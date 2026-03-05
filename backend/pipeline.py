import json
import httpx
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
import os
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


# ── State Schema ──────────────────────────────────────────────────────────────
class PipelineState(TypedDict):
    sector: str
    day: int
    raw_events: List[Dict]
    # accumulated across days
    all_events: List[Dict]
    all_themes: List[Dict]
    all_risks: List[Dict]
    theme_heat: Dict[str, float]
    hot_themes: List[str]
    graph_edges: List[Dict]
    sources: Dict[str, str]


# ── Groq LLM Call ─────────────────────────────────────────────────────────────
def call_groq(system: str, user: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "max_tokens": 1500,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    r = httpx.post(GROQ_URL, json=payload, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def parse_json(text: str) -> Any:
    text = text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ── Node 1: Event Extraction ──────────────────────────────────────────────────
def event_extraction_node(state: PipelineState) -> PipelineState:
    sources = {e["id"]: e["source"] for e in state["raw_events"]}
    state["sources"] = {**state.get("sources", {}), **sources}
    print(f"  [EventExtraction] Day {state['day']}: {len(state['raw_events'])} events for {state['sector']}")
    return state


# ── Node 2: Theme Classification ──────────────────────────────────────────────
def theme_classification_node(state: PipelineState) -> PipelineState:
    headlines = "\n".join([f"[{e['id']}] ({e['date']}) {e['headline']}" for e in state["raw_events"]])
    existing = [t["name"] for t in state.get("all_themes", [])]

    system = """You are a senior macro analyst. Classify financial news into macro themes.
Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {
    "id": "UNIQUE_ID_HERE",
    "name": "Theme Name",
    "category": "Inflation|Geopolitics|Technology|Credit Risk|Liquidity|Regulatory|Supply Chain|Sentiment",
    "event_ids": ["id1", "id2"],
    "description": "one sentence description",
    "heat": 0.6
  }
]
IMPORTANT: Use unique IDs like t_stocks_d2_1. heat = 0.0 to 1.0."""

    user = f"Sector: {state['sector']}, Day: {state['day']}\nExisting themes from previous days: {existing}\nNew headlines:\n{headlines}\n\nExtract 2-4 macro themes. Reuse existing theme names if the same theme continues."

    raw = call_groq(system, user)
    new_themes = parse_json(raw)

    # merge with existing — boost heat if theme already exists
    existing_themes = list(state.get("all_themes", []))
    for nt in new_themes:
        nt["day"] = state["day"]
        match = next((t for t in existing_themes if t["name"].lower() == nt["name"].lower()), None)
        if match:
            match["heat"] = min(1.0, match["heat"] + 0.2)
            match["event_ids"] = list(set(match["event_ids"] + nt.get("event_ids", [])))
        else:
            existing_themes.append(nt)

    state["all_themes"] = existing_themes
    print(f"  [ThemeClassification] Total themes: {len(existing_themes)}")
    return state


# ── Node 3: Theme Heat Detector ───────────────────────────────────────────────
def theme_heat_detector(state: PipelineState) -> PipelineState:
    heat_map = {}
    hot_themes = []
    for t in state["all_themes"]:
        event_count = len(t.get("event_ids", []))
        adjusted = min(1.0, t.get("heat", 0.5) + (event_count - 1) * 0.08)
        t["heat"] = round(adjusted, 2)
        heat_map[t["name"]] = adjusted
        if adjusted >= 0.65:
            t["is_hot"] = True
            hot_themes.append(t["name"])
        else:
            t["is_hot"] = False

    state["theme_heat"] = heat_map
    state["hot_themes"] = list(set(hot_themes))
    print(f"  [HeatDetector] Hot: {state['hot_themes']}")
    return state


# ── Node 4: Risk Implication ───────────────────────────────────────────────────
def risk_implication_node(state: PipelineState) -> PipelineState:
    # Only use themes from current day for generating new risks
    current_day_themes = [t for t in state["all_themes"] if t.get("day") == state["day"]]
    if not current_day_themes:
        current_day_themes = state["all_themes"]

    themes_summary = "\n".join([
        f"- [{t['id']}] {t['name']} (heat:{t['heat']}, hot:{t.get('is_hot', False)}): {t['description']}"
        for t in current_day_themes
    ])

    existing_risks = state.get("all_risks", [])
    existing_risk_names = [r["name"] for r in existing_risks]

    system = """You are a risk strategist. Given macro themes, identify compound risks AND check if any existing predicted risks are now being confirmed.
Respond ONLY with valid JSON, no markdown:
{
  "new_risks": [
    {
      "id": "UNIQUE_ID",
      "name": "Risk Name",
      "description": "Description referencing theme combinations",
      "theme_ids": ["t1", "t2"],
      "severity": "Critical|High|Medium|Low",
      "probability": 0.7,
      "time_horizon": "Near-term (1-3mo)|Medium-term (3-12mo)|Long-term (1yr+)",
      "action": "Recommended investor action"
    }
  ],
  "confirmed_risk_names": ["Exact Risk Name That Is Now Confirmed By Today's Events"]
}
Use unique IDs like r_stocks_d2_1."""

    user = f"""Sector: {state['sector']}, Day: {state['day']}
Current themes:
{themes_summary}

Previously predicted risks (check if any are being confirmed by today's events):
{existing_risk_names}

Today's headlines: {[e['headline'] for e in state['raw_events']]}

Generate 1-2 NEW risks (different from existing) and identify which existing risks today's events CONFIRM."""

    raw = call_groq(system, user)
    parsed = parse_json(raw)

    new_risks = parsed.get("new_risks", [])
    confirmed_names = parsed.get("confirmed_risk_names", [])

    for r in new_risks:
        r["day"] = state["day"]
        r["confirmed"] = False

    # mark confirmed risks
    all_risks = list(existing_risks)
    confirmed_risk_ids = []
    for r in all_risks:
        if r["name"] in confirmed_names:
            r["confirmed"] = True
            confirmed_risk_ids.append(r["id"])

    all_risks.extend(new_risks)
    state["all_risks"] = all_risks
    state["_confirmed_risk_ids"] = confirmed_risk_ids
    print(f"  [RiskImplication] New: {len(new_risks)}, Confirmed: {confirmed_names}")
    return state


# ── Node 5: Graph Builder ─────────────────────────────────────────────────────
def graph_builder_node(state: PipelineState) -> PipelineState:
    edges = list(state.get("graph_edges", []))
    confirmed_risk_ids = state.get("_confirmed_risk_ids", [])

    # Events → Themes (only current day)
    current_day_event_ids = {e["id"] for e in state["raw_events"]}
    for theme in state["all_themes"]:
        for eid in theme.get("event_ids", []):
            if eid in current_day_event_ids:
                if not any(e["from"] == eid and e["to"] == theme["id"] for e in edges):
                    edges.append({"from": eid, "to": theme["id"], "type": "triggers", "label": "triggers"})

    # Themes → Risks (current day themes → current day risks)
    current_day_theme_ids = {t["id"] for t in state["all_themes"] if t.get("day") == state["day"]}
    for risk in state["all_risks"]:
        if risk.get("day") == state["day"]:
            for tid in risk.get("theme_ids", []):
                if not any(e["from"] == tid and e["to"] == risk["id"] for e in edges):
                    edges.append({"from": tid, "to": risk["id"], "type": "implies", "label": "implies"})

    # Current day events → confirmed previous risks (confirmation edges)
    for eid in current_day_event_ids:
        for rid in confirmed_risk_ids:
            if not any(e["from"] == eid and e["to"] == rid for e in edges):
                edges.append({"from": eid, "to": rid, "type": "confirms", "label": "confirms"})

    state["graph_edges"] = edges
    print(f"  [GraphBuilder] Total edges: {len(edges)}, confirmation edges: {len(confirmed_risk_ids)}")
    return state


# ── Build Pipeline ────────────────────────────────────────────────────────────
def build_pipeline():
    wf = StateGraph(PipelineState)
    wf.add_node("event_extraction", event_extraction_node)
    wf.add_node("theme_classification", theme_classification_node)
    wf.add_node("theme_heat_detector", theme_heat_detector)
    wf.add_node("risk_implication", risk_implication_node)
    wf.add_node("graph_builder", graph_builder_node)

    wf.set_entry_point("event_extraction")
    wf.add_edge("event_extraction", "theme_classification")
    wf.add_edge("theme_classification", "theme_heat_detector")
    wf.add_edge("theme_heat_detector", "risk_implication")
    wf.add_edge("risk_implication", "graph_builder")
    wf.add_edge("graph_builder", END)
    return wf.compile()


def run_full_pipeline(sector: str, days_data: Dict) -> Dict:
    """Run pipeline day by day, carrying state forward."""
    print(f"\n[Pipeline] Starting multi-day run for: {sector}")
    pipeline = build_pipeline()

    state = {
        "sector": sector,
        "day": 1,
        "raw_events": [],
        "all_events": [],
        "all_themes": [],
        "all_risks": [],
        "theme_heat": {},
        "hot_themes": [],
        "graph_edges": [],
        "sources": {},
        "_confirmed_risk_ids": [],
    }

    for day_key in ["day1", "day2", "day3"]:
        day_num = int(day_key[-1])
        events = days_data.get(day_key, [])
        if not events:
            continue

        print(f"\n  --- Day {day_num} ---")
        state["day"] = day_num
        state["raw_events"] = events
        state["all_events"] = state.get("all_events", []) + events
        state = pipeline.invoke(state)

    return state
