# router.py
import os
import re
from typing import Literal, Optional, TypedDict

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

load_dotenv(override=True)

Route = Literal["emergency", "general"]

# ----------------------------
# 1) Fast keyword screening
# ----------------------------
# Keep it conservative: if matched -> emergency.
_EMERGENCY_PATTERNS = [
    # Chest pain / breathing
    r"\b(brustschmerz(en)?|brustenge|druck auf der brust)\b",
    r"\b(at(e|em)not|luftnot|bekomme keine luft)\b",

    # Stroke FAST
    r"\b(schlaganfall|halbseitig(e)?\s*(lähmung|schwäche)|häng(e|t)endes?\s*gesicht|sprachstörung|verwaschene sprache)\b",

    # Loss of consciousness / seizure
    r"\b(ohnmacht|bewusstlos|krampfanfall|epilept(isch|ischer) anfall)\b",

    # Severe bleeding / trauma
    r"\b(starke(s|n)? blut(en|ung)|blute stark|unfall|schwer verletzt|kopfverletzung)\b",

    # Anaphylaxis / severe allergic reaction
    r"\b(anaphylax(ie|is)|allergischer schock|schwellung (im|am) hals|zunge schwillt)\b",

    # Suicidality / self-harm intent
    r"\b(suizid|selbstmord|mich umbringen|nicht mehr leben|selbstverletz)\b",

    # Severe abdominal pain (optional, conservative)
    r"\b(stärkste(s|n)? bauchschmerz(en)?|akuter bauch)\b",

    # Severe nose / mouth / throat bleeding
    r"\b(stark(es|e|en)?\s*(nasenbluten|nasenblutung)|blut(et|ung)\s*(aus|im)\s*(mund|rachen)|blut spucken)\b",

    # Airway obstruction / throat swelling
    r"\b(keine luft durch (hals|rachen)|hals schwillt an|rachen schwillt an|gefühl zu ersticken|atemweg(e)? blockiert)\b",

    # Sudden hearing loss
    r"\b(plötzlicher hörverlust|hörsturz|auf einmal taub(es)? ohr)\b",

    # Severe throat infection / abscess
    r"\b(peritonsillarabszess|abszess im hals|kiefersperre|starke halsschmerzen mit fieber)\b",

    # Foreign body aspiration / choking
    r"\b(verschluckt|fremdkörper (im|in den) (hals|rachen|atemweg)|ersticken an)\b",

    # Severe vertigo with red flags
    r"\b(starker schwindel (mit|und) (erbrechen|lähmung|sprachstörung)|plötzlicher schwindel mit neurologisch)\b",

]

def keyword_emergency(text: str) -> bool:
    t = (text or "").lower()
    return any(re.search(p, t, flags=re.IGNORECASE) for p in _EMERGENCY_PATTERNS)

# ----------------------------
# 2) LLM router (structured)
# ----------------------------
class RouteDecision(BaseModel):
    route: Route = Field(..., description="emergency or general")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(..., description="short reason, max 1-2 sentences")

_ROUTER_SYSTEM = """
You are a medical triage router.
Decide if the user's message indicates an emergency.

Route to "emergency" if there are red flags like:

chest pain, severe shortness of breath

stroke signs (face droop, arm weakness, speech problems)

fainting, seizures, severe bleeding, major trauma

anaphylaxis / airway swelling

suicidal intent / self-harm intent

HNO / ENT emergency red flags (add these):

airway danger: stridor/noisy breathing, rapidly worsening throat swelling, drooling or can’t swallow saliva, severe trouble breathing after throat infection/allergy/foreign body

severe throat infection signs: suspected epiglottitis, peritonsillar abscess signs (muffled “hot potato” voice, trismus/can’t open mouth, uvula deviation)

uncontrolled ENT bleeding: heavy nosebleed that won’t stop, vomiting blood, bleeding with dizziness/fainting, bleeding after facial trauma or surgery

sudden hearing issues with neuro signs: sudden one-sided hearing loss (within 72h) plus severe vertigo, severe headache, weakness, double vision

ear complications: severe ear pain with swelling/redness behind the ear, ear protruding (possible mastoiditis), high fever + very unwell

deep neck/facial infection red flags: rapid facial/neck swelling, severe tooth/jaw infection spreading, fever + neck stiffness, voice change, confusion

eye/orbit involvement from sinus infection: painful eye movement, bulging eye, vision changes, eyelid swelling + fever

caustic/foreign body emergencies: swallowed button battery/magnets, suspected airway foreign body, caustic ingestion (strong cleaners)

head & neck trauma red flags: neck trauma with hoarseness/voice loss, expanding neck hematoma, CSF-like clear fluid from nose/ear after head injury

If unsure, choose "emergency".

Return a JSON object with: route, confidence, reason.
""".strip()

def llm_route(text: str) -> RouteDecision:
    api_key = os.getenv("OPENAI_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_KEY in environment")

    llm = ChatOpenAI(
        api_key=api_key,
        model=os.getenv("ROUTER_MODEL", "gpt-5-mini"),
        temperature=0.0,
        disabled_params={"stop": None},
    ).with_structured_output(RouteDecision)

    return llm.invoke([
        HumanMessage(content=f"{_ROUTER_SYSTEM}\n\nUSER:\n{text}")
    ])

# ----------------------------
# 3) Public router function
# ----------------------------
class RouterResult(TypedDict):
    route: Route
    confidence: float
    reason: str
    via: Literal["keyword", "llm"]

def route_user_text(user_text: str, *, force_llm: bool = False) -> RouterResult:
    """
    Returns routing decision.
    - If keyword hit -> emergency immediately (unless force_llm=True).
    - Else -> use LLM router.
    """
    text = user_text or ""

    if not force_llm and keyword_emergency(text):
        return {
            "route": "emergency",
            "confidence": 0.90,
            "reason": "Matched emergency red-flag keywords.",
            "via": "keyword",
        }

    dec = llm_route(text)
    return {
        "route": dec.route,
        "confidence": float(dec.confidence),
        "reason": dec.reason,
        "via": "llm",
    }
