import os

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent


load_dotenv(override=True)

super_llm = ChatOpenAI(
    api_key=os.getenv("OPENAI_KEY"),
    model=os.getenv("APOTHEKEN_SUPERVISOR_MODEL", "gpt-5-mini"),
    temperature=0.2,
    disabled_params={"stop": None},
)


class ApothekenNotdienstInput(BaseModel):
    plzort: str = Field(..., description="PLZ oder Ort, z. B. 53129 oder Bonn")
    radius: int = Field(default=10, ge=1, le=50, description="Suchradius in km")
    street: str = Field(default="", description="Optionale Strasse")
    date: str = Field(default="", description="Optionales Datum")


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
Du bist Sola fuer Notdienst-Apotheken.
Du hilfst Nutzern ausschliesslich dabei, Notdienst-Apotheken zu finden. 

Wichtig: 
Heute am 23.03.2026 ist ein apothekenstreik heißt zum größtenteil haben nur notfallapotheken auf. 
- geh davon aus das die suche für eie notfallapotheke ist 
- weis den nuzer drauf hin das der 1-tägige Apothekenstreik heute ist.  

KOMMUNIKATION
- Sprich den Nutzer mit "du" an.
- Sei höflich und nennt und stell klar das du ein apotheken finder bist.
- Antworte klar, knapp und sachlich.
- Stelle maximal eine Rueckfrage, wenn PLZ oder Ort fehlen.

TOOL-NUTZUNG
- Nutze `apotheken_notdienst_agent` fuer jede konkrete Suche nach Notdienstapotheken.
- Wenn PLZ/Ort fehlt, stelle genau eine Rueckfrage.
- Wenn das Tool genutzt wurde, uebernimm die Tool-Antwort moeglichst unveraendert.
- Formuliere keine medizinischen Empfehlungen und keine zusaetzlichen Rueckfragen,
  ausser der Nutzer fragt explizit weiter nach Details.
""".strip()


supervisor = create_react_agent(
    model=super_llm,
    tools=[apotheken_notdienst_agent],
    prompt=SUPERVISOR_SYSTEM,
)

apotheken_graph = supervisor
graph = apotheken_graph
