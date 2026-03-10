# Macro Intelligence Hub
### Wealth Wellness Engine · FinTech Innovators Hackathon 2026

> Real-time AI-powered macro intelligence platform for asset managers — transforming raw financial news into structured, visual, actionable risk insight.

**Live Demo:** https://macro-intelligence-edff6vokm-parth1234-lgtms-projects.vercel.app  
**Backend API:** https://macro-intelligence-hub.onrender.com

---

## What It Does

The Macro Intelligence Hub ingests macro news across three geographies (US, India, China) and three asset classes (Equities, Real Estate, Digital Assets), runs it through a 5-node LangGraph AI pipeline, and produces an interactive knowledge graph showing which themes are heating up, which risks are confirmed, and how global events connect to portfolio exposure.

Instead of manually reading hundreds of articles, portfolio managers get a real-time visual map of macro risk — in seconds.

---

## Problem Statement

Asset managers face three core challenges today:

- **Information overload** — hundreds of macro news items daily across geographies and asset classes
- **No institutional memory** — themes emerge and fade with no structured tracking over time
- **Disconnected signals** — a Fed rate decision, a Chinese property crisis, and a crypto rally are all connected, but nothing surfaces that connection automatically

The Macro Intelligence Hub solves all three.

---

## Solution

A full-stack AI pipeline that processes news and produces structured intelligence:

| Node | Function |
|------|----------|
| Event Extraction | Pulls discrete macro events from raw news |
| Theme Classification | LLM groups events into macro themes (Monetary Policy, Credit Stress, etc.) |
| Heat Detection | Scores each theme as Hot, Warm, or Cooling |
| Risk Implication | LLM generates specific portfolio risk statements per theme |
| Graph Builder | Constructs the knowledge graph linking Events → Themes → Risks |

---

## Key Features

**🗺️ Interactive World Map**  
Full-screen vintage parchment world map (D3 geoNaturalEarth projection) with zoom, pan, and country selection. Click a country to enter its analysis dashboard.

**🧠 Knowledge Graph Visualisation**  
D3.js graph with three node types — Events (circles), Themes (diamonds), Risks (rectangles). Confirmation arcs show when multiple events validate the same risk. Hot themes pulse with amber glow.

**🌍 Multi-Geography, Multi-Sector**  
Nine market views: US, India, China × Equities, Real Estate, Digital Assets. Results cached per combination for instant switching.

**⚗️ Scenario Lab**  
Select macro themes and write custom conditions to simulate hypothetical risk scenarios. The same AI pipeline runs in simulation mode — results are clearly marked SIMULATED so they are never confused with live data.

**📋 Risk Register**  
Structured list of all identified risks with severity badges (CRITICAL / HIGH / MODERATE), confirmation status, asset class tags, and triggering events for full traceability.

---

## Tech Stack

**Frontend**
- React + D3.js
- Custom vintage design system (Brown Deer / Copper / Parchment palette)
- Deployed on Vercel

**Backend**
- FastAPI + LangGraph
- Groq API (Llama 3.3 70B) for theme classification and risk generation
- Deployed on Render

---

## Market Potential

Global AUM exceeds $100 trillion. Every major asset manager employs macro research teams doing manually what this platform does automatically. Target users include tier-1 asset managers, macro hedge funds, sovereign wealth funds, and investment bank research divisions.

The platform is designed to augment human analysts — surfacing connections and heat signals faster than any manual process, while keeping humans in control of final investment decisions.

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
# Add GROQ_API_KEY to .env
python main.py

# Frontend
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```
