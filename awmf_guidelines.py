from __future__ import annotations
from dotenv import load_dotenv
import os
import json
import re
from typing import TypedDict, Optional, List, Dict, Any

import fitz  # PyMuPDF
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

# ----------------------------
# Guardrails: Beraterrolle + Extraction
# ----------------------------
TEXT_SYSTEM_PROMPT = """\
Du bist ein Leitlinien-Informationsagent (AWMF/medizinische Leitlinien).
Du extrahierst Informationen aus Leitlinien-Text. Du darfst NICHT raten.

HARTES VERBOT:
- Keine Diagnosen.
- Keine personalisierten Empfehlungen ("du solltest", "mach X").
- Keine Schritt-für-Schritt-Anweisungen, keine Dosierungen, keine Therapiepläne.
- Keine vollständigen Diagnostik-/Behandlungspfade rekonstruieren.

REGELN:
- Extrahiere nur, was im Text steht. Wenn unbekannt: "unknown" / leere Liste.
- Evidence: kurze Fragmente (max 20-30 Wörter), immer mit Seitenzahl.

OUTPUT:
- Gib ausschließlich gültiges JSON im Schema aus (kein Markdown).
"""

TARGET_SCHEMA = {
  "meta": {
    "title": "unknown",
    "awmf_id": "unknown",
    "version_or_date": "unknown"
  },
  "scope": {
    "population": "unknown",
    "setting": "unknown",
    "topic": "unknown"
  },
  "key_sections_found": [],  # z.B. ["Diagnostik", "Definition", "Red Flags", ...]
  "definitions_and_terms": [],
  "diagnostic_considerations": [],
  "red_flags_or_urgent_signs": [],
  "limits_and_uncertainties": [],
  "evidence": [
    # {"field":"diagnostic_considerations", "value":"...", "page":12, "snippet":"..."}
  ],
  "sources": []
}

# ----------------------------
# LangGraph State
# ----------------------------
class TextState(TypedDict, total=False):
    pdf_path: str
    pages: Optional[List[int]]           # optional: only process these pages
    pages_per_chunk: int                 # default 2

    # intern
    extracted_pages: List[Dict[str, Any]]  # [{"page": 1, "text": "..."}]
    chunks: List[Dict[str, Any]]           # [{"chunk_id":1,"pages":[1,2],"text":"..."}]
    chunk_results: List[Dict[str, Any]]
    merged: Dict[str, Any]


# ----------------------------
# PDF -> page texts (better than pypdf for many guidelines)
# ----------------------------
def pdf_to_page_texts(pdf_path: str, pages: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    doc = fitz.open(pdf_path)
    out: List[Dict[str, Any]] = []

    if pages:
        page_indices = [p - 1 for p in pages if 1 <= p <= doc.page_count]
    else:
        page_indices = list(range(doc.page_count))

    for idx in page_indices:
        page = doc.load_page(idx)
        text = page.get_text("text") or ""
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if text:
            out.append({"page": idx + 1, "text": text})

    doc.close()
    return out


def chunk_pages(pages: List[Dict[str, Any]], pages_per_chunk: int = 2) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    for i in range(0, len(pages), pages_per_chunk):
        part = pages[i:i+pages_per_chunk]
        chunk_text = "\n\n".join([f"[PAGE {p['page']}]\n{p['text']}" for p in part])
        chunks.append({
            "chunk_id": len(chunks) + 1,
            "pages": [p["page"] for p in part],
            "text": chunk_text
        })
    return chunks


# ----------------------------
# Nodes
# ----------------------------
def node_extract_pages(state: TextState) -> TextState:
    state["extracted_pages"] = pdf_to_page_texts(state["pdf_path"], state.get("pages"))
    return state


def node_chunk(state: TextState) -> TextState:
    ppc = state.get("pages_per_chunk") or 2
    state["chunks"] = chunk_pages(state.get("extracted_pages", []), pages_per_chunk=ppc)
    return state


def node_llm_extract(state: TextState) -> TextState:
    # IMPORTANT: use OPENAI_API_KEY (standard) unless you really want OPENAI_KEY
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=api_key)

    results: List[Dict[str, Any]] = []
    for ch in state.get("chunks", []):
        prompt = f"""\
AUFGABE
Du analysierst einen Abschnitt einer medizinischen Leitlinie (AWMF o.ä.).
Deine Aufgabe ist **reine Informationsextraktion**, keine Bewertung, keine Empfehlung.

WICHTIGE REGELN
- Extrahiere **ausschließlich**, was explizit im Text steht.
- Wenn eine Information nicht im Text vorkommt: setze "unknown" oder [].
- **Keine Diagnosen**, **keine Therapieempfehlungen**, **keine Dosierungen**.
- Keine Schritt-für-Schritt-Anleitungen.
- Keine Formulierungen wie "man sollte", "empfohlen ist", "Therapie der Wahl".
- Wenn der Text Begriffe wie "empfohlen" enthält, formuliere neutral um
  (z.B. "in der Leitlinie wird erwähnt, dass … berücksichtigt wird").

DIAGNOSTIK & METHODEN
- Wenn diagnostische Verfahren genannt werden, liste sie **neutral** auf
  (z.B. "klinische Untersuchung", "Laborparameter", "Bildgebung").
- **Keine Reihenfolge** und **keine Priorisierung** herstellen.
- Keine Aussagen darüber, was besser, sinnvoller oder notwendig ist.

RED FLAGS
- Warnhinweise oder Dringlichkeitskriterien dürfen erfasst werden,
  aber nur als **Beschreibungen**, nicht als Handlungsanweisung.

EVIDENCE
- Für jeden extrahierten Punkt in "evidence":
  - kurze Textstelle (max. 20–30 Wörter)
  - die Seitenzahl (aus dem [PAGE X]-Marker ableiten)
- Zitate nur fragmentarisch, niemals ganze Sätze.

FORMAT
- Gib **ausschließlich gültiges JSON** zurück.
- Nutze **exakt** dieses Schema:
{json.dumps(TARGET_SCHEMA, ensure_ascii=False)}

LEITLINIENTEXT:
{ch["text"][:120000]}
"""

        resp = llm.invoke([SystemMessage(content=TEXT_SYSTEM_PROMPT), HumanMessage(content=prompt)])
        txt = resp.content.strip()

        # robust JSON slice
        start, end = txt.find("{"), txt.rfind("}")
        if start != -1 and end != -1:
            txt = txt[start:end+1]

        try:
            data = json.loads(txt)
        except Exception:
            data = {
                "meta": {"title": "unknown", "awmf_id": "unknown", "version_or_date": "unknown"},
                "scope": {"population": "unknown", "setting": "unknown", "topic": "unknown"},
                "key_sections_found": [],
                "definitions_and_terms": [],
                "diagnostic_considerations": [],
                "red_flags_or_urgent_signs": [],
                "limits_and_uncertainties": [],
                "evidence": [],
                "sources": []
            }
            data["limits_and_uncertainties"].append(f"Parsing failed in chunk {ch['chunk_id']} pages {ch['pages']}")

        results.append({"chunk_id": ch["chunk_id"], "pages": ch["pages"], "data": data})

    state["chunk_results"] = results
    return state


def node_merge(state: TextState) -> TextState:
    merged = json.loads(json.dumps(TARGET_SCHEMA))  # deep-ish copy
    merged["sources"] = [state["pdf_path"]]

    def take_first_non_unknown(dst: dict, path: List[str], value: str):
        cur = dst
        for k in path[:-1]:
            cur = cur[k]
        last = path[-1]
        if cur[last] == "unknown" and value and value != "unknown":
            cur[last] = value

    seen = set()

    for r in state.get("chunk_results", []):
        d = r["data"]

        # meta
        take_first_non_unknown(merged, ["meta","title"], d.get("meta",{}).get("title","unknown"))
        take_first_non_unknown(merged, ["meta","awmf_id"], d.get("meta",{}).get("awmf_id","unknown"))
        take_first_non_unknown(merged, ["meta","version_or_date"], d.get("meta",{}).get("version_or_date","unknown"))

        # scope
        for k in ["population","setting","topic"]:
            take_first_non_unknown(merged, ["scope",k], d.get("scope",{}).get(k,"unknown"))

        # lists
        for field in [
            "key_sections_found",
            "definitions_and_terms",
            "diagnostic_considerations",
            "red_flags_or_urgent_signs",
            "limits_and_uncertainties",
        ]:
            for item in d.get(field, []) or []:
                norm = (field, str(item).strip().lower())
                if item and item != "unknown" and norm not in seen:
                    merged[field].append(item)
                    seen.add(norm)

        # evidence keep all (you can dedupe later)
        for ev in d.get("evidence", []) or []:
            merged["evidence"].append(ev)

    state["merged"] = merged
    return state


def build_guideline_text_graph():
    g = StateGraph(TextState)
    g.add_node("extract_pages", node_extract_pages)
    g.add_node("chunk", node_chunk)
    g.add_node("llm_extract", node_llm_extract)
    g.add_node("merge", node_merge)

    g.set_entry_point("extract_pages")
    g.add_edge("extract_pages", "chunk")
    g.add_edge("chunk", "llm_extract")
    g.add_edge("llm_extract", "merge")
    g.add_edge("merge", END)

    return g.compile()


if __name__ == "__main__":
    graph = build_guideline_text_graph()

    result = graph.invoke({
        "pdf_path": r"C:\Users\dempt\Documents\Projekte\sola-v3-rag-learnign\assets\030-057p1_S1_Therapie-der-Migraeneattacke-Prophylaxe-der-Migraene_2025-10.pdf",
        "pages": None,            # or [1,2,3,...]
        "pages_per_chunk": 2
    })

    print(json.dumps(result["merged"], ensure_ascii=False, indent=2))
