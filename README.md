# 🧠 Macro Intelligence Hub v2
> Wealth Wellness Engine — Country × Sector Risk Knowledge Graph + Scenario Lab

## What's New in v2

- **Country × Sector analysis**: US / India / China each with Stocks, Real Estate, Crypto
- **Scenario Lab**: Manual simulation — pick themes or describe a hypothetical, AI generates compound risks
- **Warm UI**: Light cream/amber design system (Playfair Display + Lora + DM Mono)
- **Risk Register view**: Expandable risk cards with severity, probability bars, analyst notes

## Architecture

```
MOCK NEWS (9 buckets: 3 countries × 3 sectors)
    ↓
[FastAPI Backend]
    ├── GET /api/analyze/{country}/{sector}
    ├── POST /api/simulate
    └── GET /api/simulation-themes
    ↓
[LangGraph Pipeline]
    ├── Node 1: Event Extraction
    ├── Node 2: Theme Classification  (Groq LLM)
    ├── Node 3: Theme Heat Detector
    ├── Node 4: Risk Implication      (Groq LLM)
    └── Node 5: Graph Builder
    ↓
[React Frontend]
    ├── Country tabs (US 🇺🇸 / India 🇮🇳 / China 🇨🇳)
    ├── Sector tabs (Equities / Real Estate / Digital Assets)
    ├── Knowledge Graph (D3.js)
    ├── Risk Register (expandable cards)
    └── Scenario Lab (theme picker + free text → simulation)
```

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
# Add GROQ_API_KEY to .env
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Scenario Lab

Users can:
1. Pick from **preset scenarios** (Stagflation, AI Disruption, EM Debt Crisis, etc.)
2. **Select individual themes** (10 themes available as clickable pills)
3. **Describe a custom condition** in plain text
4. Add a scenario description and hit **Run Simulation**

The AI generates compound risks that emerge from that combination — marked as ⚗ SIMULATED — with the same graph and risk card UI as live analysis.
"# macro-intelligence-hub" 
