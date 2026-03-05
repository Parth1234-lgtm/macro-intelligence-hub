from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import uvicorn

from mock_data import MOCK_NEWS
from pipeline import run_full_pipeline

app = FastAPI(title="Macro Intelligence Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache: Dict[str, Any] = {}


@app.get("/api/analyze/{sector}")
def analyze_sector(sector: str):
    if sector in _cache:
        print(f"[Cache] Returning cached result for {sector}")
        return _cache[sector]

    days_data = MOCK_NEWS.get(sector)
    if not days_data:
        return {"error": f"No data for sector: {sector}"}

    result = run_full_pipeline(sector, days_data)

    response = {
        "sector": sector,
        "events": result["all_events"],
        "themes": result["all_themes"],
        "theme_heat": result["theme_heat"],
        "hot_themes": result["hot_themes"],
        "risks": result["all_risks"],
        "graph_edges": result["graph_edges"],
        "sources": result["sources"],
    }
    _cache[sector] = response
    return response


@app.delete("/api/cache")
def clear_cache():
    _cache.clear()
    return {"message": "Cache cleared"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
