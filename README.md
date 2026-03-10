# Macro Intelligence Hub
### Wealth Wellness Engine · FinTech Innovators Hackathon 2026

> Real-time AI-powered macro intelligence platform for asset managers — transforming raw financial news into structured, visual, actionable risk insight.

**Live Demo:** https://macro-intelligence-edff6vokm-parth1234-lgtms-projects.vercel.app  
**Backend API:** https://macro-intelligence-hub.onrender.com

---

## What It Does

The Macro Intelligence Hub ingests macro news across three geographies (US, India, China) and three asset classes (Equities, Real Estate, Digital Assets), runs it through a LangGraph Agentic AI pipeline, and produces an interactive knowledge graph showing which themes are heating up, which risks are confirmed, and how global events connect to portfolio exposure.

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

**⚡ Real-Time AI Inference**  
Powered by Groq (Llama 3.3 70B) — sub-second LLM responses mean the full 
5-node pipeline completes in seconds, not minutes. No waiting, no batch 
processing — live intelligence on demand.

**🎯 Built for Everyone**  
No finance degree required. The knowledge graph, heat scores, and risk register 
are designed to be understood at a glance — whether you're a portfolio manager 
at a fund or a self-directed investor managing your own money.

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

The opportunity operates on two levels:

**Institutional** — Global AUM exceeds $100 trillion. Every major asset manager, 
macro hedge fund, and sovereign wealth fund employs research teams doing manually 
what this platform does automatically.

**Retail** — Over 100 million self-directed retail investors globally make portfolio 
decisions with no access to the macro intelligence that institutions take for granted. 
A Fed rate decision, a property crisis, a crypto rally — retail investors feel the 
impact but rarely understand the connections in time to act.

The Macro Intelligence Hub bridges that gap — giving everyday investors the same 
real-time macro signal detection that was previously only available to billion-dollar 
research desks. Democratising institutional-grade intelligence is not just a feature, 
it is the mission.

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
