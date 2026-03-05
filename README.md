# 🧠 Macro Intelligence Hub
> Wealth Wellness Engine — Event → Theme → Risk Knowledge Graph

## Architecture

```
MOCK NEWS
    ↓
[FastAPI Backend]
    ↓
[LangGraph Pipeline]
    ├── Node 1: Event Extraction
    ├── Node 2: Theme Classification  (Groq LLM)
    ├── Node 3: Theme Heat Detector
    ├── Node 4: Risk Implication Node (Groq LLM)
    └── Node 5: Graph Builder
    ↓
[React Frontend]
    └── D3.js Knowledge Graph (Events → Themes → Risks)
```

---

## Setup & Run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs at: `http://localhost:8000`

API Endpoints:
- `GET /api/analyze/Stocks`
- `GET /api/analyze/Real Estate`
- `GET /api/analyze/Crypto`
- `GET /api/analyze-all`
- `DELETE /api/cache` — clears cache to re-run pipeline

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## How It Works

1. **News Ingestion** — Mock news data (18 articles across 3 sectors) loaded per sector
2. **Theme Classification** — LLM identifies 3-5 macro themes (Inflation, Geopolitics, etc.)
3. **Heat Detection** — Themes that appear across multiple events become "hot" 🔥
4. **Risk Implication** — LLM combines multiple themes to generate compound risks with severity + action
5. **Graph** — D3.js renders Events (circles) → Themes (diamonds) → Risks (rectangles) with live edges

---

## Graph Legend

| Shape | Color | Meaning |
|-------|-------|---------|
| ● Circle | Blue | News Event |
| ◆ Diamond | Cyan / Orange🔥 | Macro Theme |
| ■ Rectangle | Red gradient | Compound Risk |
| — Solid line | Blue | Event triggers Theme |
| --- Dashed line | Orange | Theme implies Risk |

---

## Tech Stack
- **Backend**: FastAPI + LangGraph + Groq (Llama 3.3 70B)
- **Frontend**: React + D3.js
- **Data**: Mocked financial news (easily swappable with real APIs)
