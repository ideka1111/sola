import os

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.messages import HumanMessage

from langgraph.prebuilt import create_react_agent
from sql_subagent import spezialzentrum_agent


load_dotenv(override=True)

super_llm = ChatOpenAI(
    api_key=os.getenv("OPENAI_KEY"),
    model="gpt-5-mini",
    temperature=0.3,
    disabled_params={"stop": None},
)


class SQLAgentInput(BaseModel):
    question: str = Field(..., description="User question to answer using the SQL subagent")


class ApothekenNotdienstInput(BaseModel):
    plzort: str = Field(..., description="PLZ oder Ort, z. B. 53129 oder Bonn")
    radius: int = Field(default=10, ge=1, le=50, description="Suchradius in km")
    street: str = Field(default="", description="Optionale Strasse")
    date: str = Field(default="", description="Optionales Datum")


@tool("spezialzentren_agent", args_schema=SQLAgentInput)
def spezialzentren_agent(question: str) -> str:
    """Use this to answer questions that require querying the Postgres database."""
    out = spezialzentrum_agent.invoke({"messages": [HumanMessage(content=question)]})
    msgs = out["messages"]
    last = next((m for m in reversed(msgs) if getattr(m, "content", None)), None)
    return last.content if last else ""


@tool("apotheken_notdienst_agent", args_schema=ApothekenNotdienstInput)
def apotheken_notdienst_agent(plzort: str, radius: int = 10, street: str = "", date: str = "") -> str:
    """Sucht Notdienst-Apotheken ueber Aponet fuer PLZ/Ort."""
    url = "https://www.aponet.de/notdienstsuche"
    params = {
        "tx_aponetpharmacy_search[action]": "result",
        "tx_aponetpharmacy_search[controller]": "Search",
        "tx_aponetpharmacy_search[search][plzort]": plzort,
        "tx_aponetpharmacy_search[search][date]": date,
        "tx_aponetpharmacy_search[search][street]": street or " ",
        "tx_aponetpharmacy_search[search][radius]": radius,
        "tx_aponetpharmacy_search[search][lat]": "",
        "tx_aponetpharmacy_search[search][lng]": "",
        "tx_aponetpharmacy_search[token]": os.getenv(
            "APONET_TOKEN",
            "216823d96ea25c051509d935955c130fbc72680fc1d3040fe3e8ca0e25f9cd02",
        ),
        "type": "1981",
    }
    headers = {"User-Agent": "Mozilla/5.0 (compatible; SolaBot/1.0)"}
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=20)
        resp.raise_for_status()
    except Exception as exc:
        return f"Aponet-Abfrage fehlgeschlagen: {exc}"

    try:
        payload = resp.json()
    except ValueError:
        return resp.text[:2500]

    results = payload.get("results", {})
    parameters = results.get("parameter", {})
    apotheken = results.get("apotheken", {}).get("apotheke", [])

    compact_results = []
    for apotheke in apotheken[:5]:
        compact_results.append(
            {
                "name": apotheke.get("name", ""),
                "strasse": apotheke.get("strasse", ""),
                "plz": apotheke.get("plz", ""),
                "ort": apotheke.get("ort", ""),
                "telefon": apotheke.get("telefon", ""),
                "email": apotheke.get("email", ""),
                "distanz_km": apotheke.get("distanz", ""),
                "notdienst_von": f"{apotheke.get('startdatum', '')} {apotheke.get('startzeit', '')}".strip(),
                "notdienst_bis": f"{apotheke.get('enddatum', '')} {apotheke.get('endzeit', '')}".strip(),
            }
        )

    if not compact_results:
        return f"Ich habe fuer {parameters.get('plzort', plzort)} keine Notdienst-Apotheken gefunden."

    gueltig_von = compact_results[0]["notdienst_von"]
    gueltig_bis = compact_results[0]["notdienst_bis"]
    lines = [
        f"Notdienst-Apotheken fuer {parameters.get('plzort', plzort)} im Umkreis von {parameters.get('radius', radius)} km.",
        f"Diese Informationen sind gueltig von {gueltig_von} bis {gueltig_bis}.",
        "",
    ]

    for idx, apotheke in enumerate(compact_results, start=1):
        try:
            distanz_text = f"{float(apotheke['distanz_km']):.1f}".replace(".", ",")
        except (TypeError, ValueError):
            distanz_text = apotheke["distanz_km"] or "-"
        lines.extend(
            [
                f"{idx}) {apotheke['name']}",
                f"   {apotheke['strasse']}, {apotheke['plz']} {apotheke['ort']}",
                f"   Telefon: {apotheke['telefon'] or '-'}",
                f"   Entfernung: ca. {distanz_text} km",
                f"   Im Notdienst geoeffnet bis: {apotheke['notdienst_bis'] or '-'}",
                f"   Notdienstzeitraum: {apotheke['notdienst_von'] or '-'} bis {apotheke['notdienst_bis'] or '-'}",
                "",
            ]
        )

    return "\n".join(lines).strip()


SUPERVISOR_SYSTEM = """
Du bist Sola, ein digitaler Suchassistent.
Du hilfst Nutzern, auf Basis von Symptomen oder bekannten Diagnosen
geeignete Aerzte, Fachaerzte, spezialisierte medizinische Zentren oder notfallapotheken zu finden.

KOMMUNIKATION
- Sprich den Nutzer mit "du" an.
- Antworte klar, sachlich und praezise.
- Stelle maximal eine Rueckfrage, wenn entscheidende Infos fehlen.

MEDIZINISCHE GRENZEN
- Keine Diagnosen.
- Keine Behandlungsempfehlungen.
- Ordne Symptome nur passenden Fachrichtungen oder Zentren zu.

TOOL-NUTZUNG
- Nutze `spezialzentren_agent` fuer konkrete Suche nach Aerzten/Kliniken/Zentren.
- Nutze `apotheken_notdienst_agent` fuer Notdienstapotheken (z. B. nachts/offen),
  mit PLZ oder Ort.
- Wenn PLZ/Ort fuer Apothekennotdienst fehlt, stelle genau eine Rueckfrage.
- Nutze Tools nur, wenn sie fuer die Anfrage echten Mehrwert liefern.
- Wenn `apotheken_notdienst_agent` genutzt wurde, uebernimm die Tool-Antwort fuer den Nutzer
  moeglichst unveraendert.
- Formuliere bei Apotheken keine zusaetzliche Rueckfrage wie "Moechtest du Details...?",
  ausser der Nutzer hat explizit danach gefragt.

SICHERHEIT
- Bei Red Flags auf 112/116117 verweisen.
""".strip()


supervisor = create_react_agent(
    model=super_llm,
    tools=[spezialzentren_agent, apotheken_notdienst_agent],
    prompt=SUPERVISOR_SYSTEM,
)

general_graph = supervisor
graph = general_graph
