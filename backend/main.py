from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uvicorn

from mock_data import MOCK_NEWS, SIMULATION_THEMES
from pipeline import run_full_pipeline, run_simulation_pipeline

app = FastAPI(title="Macro Intelligence Hub API v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache: Dict[str, Any] = {}


@app.get("/api/analyze/{country}/{sector}")
def analyze(country: str, sector: str):
    key = f"{country}::{sector}"
    if key in _cache:
        return _cache[key]

    country_data = MOCK_NEWS.get(country)
    if not country_data:
        return {"error": f"No data for country: {country}"}
    days_data = country_data.get(sector)
    if not days_data:
        return {"error": f"No data for sector: {sector} in {country}"}

    result = run_full_pipeline(country, sector, days_data)
    response = {
        "country": country,
        "sector": sector,
        "events": result["all_events"],
        "themes": result["all_themes"],
        "theme_heat": result["theme_heat"],
        "hot_themes": result["hot_themes"],
        "risks": result["all_risks"],
        "graph_edges": result["graph_edges"],
        "sources": result["sources"],
        "is_simulation": False,
    }
    _cache[key] = response
    return response


@app.get("/api/simulation-themes")
def get_simulation_themes():
    return {"themes": SIMULATION_THEMES}


class SimulationRequest(BaseModel):
    theme_ids: List[str]
    custom_themes: Optional[List[Dict]] = []
    scenario_description: str
    country: Optional[str] = "Global"
    sector: Optional[str] = "Cross-Sector"


@app.post("/api/simulate")
def simulate(req: SimulationRequest):
    # Build themes list from IDs + any custom ones
    all_sim_themes = {t["id"]: t for t in SIMULATION_THEMES}

    selected = []
    for tid in req.theme_ids:
        if tid in all_sim_themes:
            selected.append(all_sim_themes[tid])

    for ct in (req.custom_themes or []):
        selected.append({
            "id": f"custom_{len(selected)+1}",
            "name": ct.get("name", "Custom Theme"),
            "description": ct.get("description", "User-defined scenario condition"),
        })

    if not selected:
        return {"error": "No themes selected for simulation"}

    result = run_simulation_pipeline(
        themes=selected,
        scenario_description=req.scenario_description,
        country=req.country,
        sector=req.sector,
    )
    return result


@app.delete("/api/cache")
def clear_cache():
    _cache.clear()
    return {"message": "Cache cleared"}


@app.get("/api/countries")
def get_countries():
    return {"countries": list(MOCK_NEWS.keys())}


@app.get("/api/sectors/{country}")
def get_sectors(country: str):
    data = MOCK_NEWS.get(country, {})
    return {"sectors": list(data.keys())}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
