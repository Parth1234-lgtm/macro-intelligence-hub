import { useState, useEffect, useCallback } from 'react';
import KnowledgeGraph from './KnowledgeGraph';
import ScenarioLab from './ScenarioLab';
import WorldMapDashboard from './WorldMapDashboard';

const API = process.env.REACT_APP_API_URL || 'https://macro-intelligence-hub.onrender.com';

const C = {
  parchment:   '#F5EFE4',
  papyrus:     '#EDE3D0',
  leaf:        '#C29666',
  copper:      '#B76635',
  nutty:       '#583924',
  deer:        '#532D1C',
  chestnut:    '#68261F',
  ink:         '#2E1A0E',
  warmWhite:   '#FBF7F1',
  confirmed:   '#4A7C59',
  confirmedBg: '#EAF2EC',
};

const COUNTRIES = [
  { id: 'US',    flag: '🇺🇸', label: 'United States', accent: C.chestnut },
  { id: 'India', flag: '🇮🇳', label: 'India',         accent: C.copper   },
  { id: 'China', flag: '🇨🇳', label: 'China',         accent: C.deer     },
];

const SECTORS = [
  { id: 'Stocks',      icon: '📈', label: 'Equities'      },
  { id: 'Real Estate', icon: '🏛',  label: 'Real Estate'  },
  { id: 'Crypto',      icon: '◈',  label: 'Digital Assets'},
];

const SEV_COLOR = { Critical: C.chestnut, High: C.copper, Medium: '#8B6914', Low: C.confirmed };
const SEV_BG    = { Critical: '#F5E8E6',  High: '#F7EDE4', Medium: '#F5EDD8', Low: '#E8F0EA'  };

function Pill({ children, color, bg, onClick, selected, style = {} }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 11px', borderRadius: 20,
      fontSize: 10, fontFamily: "'DM Mono', monospace",
      letterSpacing: '0.05em', fontWeight: 600,
      background: selected ? (color || C.copper) : (bg || C.papyrus),
      color: selected ? '#FBF7F1' : (color || C.nutty),
      border: `1px solid ${selected ? (color || C.copper) : C.leaf}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      ...style,
    }}>{children}</span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      flex: 1, padding: '20px 24px',
      borderRight: `1px solid ${C.leaf}40`,
    }}>
      <span style={{ fontSize: 9, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 800, color: color || C.deer, lineHeight: 1 }}>{value ?? '—'}</span>
    </div>
  );
}

function LoadingPipeline({ country, sector }) {
  const steps = ['Ingesting', 'Classifying', 'Heat Detection', 'Risk Analysis', 'Building Graph'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 900);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 480, gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.2em', marginBottom: 8 }}>PIPELINE RUNNING</div>
        <div style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: C.deer }}>{country} · {sector}</div>
      </div>
      <div style={{ display: 'flex', gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            padding: '9px 15px', fontSize: 10, fontFamily: "'DM Mono', monospace",
            background: i === step ? C.copper : C.papyrus,
            color: i === step ? C.warmWhite : C.leaf,
            borderRadius: i === 0 ? '8px 0 0 8px' : i === steps.length - 1 ? '0 8px 8px 0' : '0',
            border: `1px solid ${C.leaf}60`,
            fontWeight: i === step ? 600 : 400,
            transition: 'all 0.4s ease',
          }}>{s}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.copper,
            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );
}

function RiskCard({ risk }) {
  const [open, setOpen] = useState(false);
  const sev = risk.severity || 'Medium';
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: risk.confirmed ? C.confirmedBg : C.warmWhite,
      border: `1px solid ${risk.confirmed ? C.confirmed + '80' : C.leaf + '60'}`,
      borderLeft: `4px solid ${risk.confirmed ? C.confirmed : SEV_COLOR[sev]}`,
      borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${C.deer}14`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
            {risk.confirmed && <Pill color={C.confirmed} bg={C.confirmedBg}>✓ CONFIRMED</Pill>}
            {risk.simulated && <Pill color="#7C5C8A" bg="#F0EBF8">⚗ SIMULATED</Pill>}
            <Pill color={SEV_COLOR[sev]} bg={SEV_BG[sev]}>{sev}</Pill>
            {risk.time_horizon && <Pill>{risk.time_horizon}</Pill>}
          </div>
          <div style={{ fontSize: 14, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: C.deer }}>{risk.name}</div>
        </div>
        <span style={{ color: C.leaf, fontSize: 14, marginLeft: 10 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.leaf}40` }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: C.nutty, lineHeight: 1.7, fontFamily: "'Lora', serif" }}>{risk.description}</p>
          {risk.action && (
            <div style={{ background: C.papyrus, border: `1px solid ${C.leaf}60`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', marginBottom: 4 }}>ANALYST NOTE</div>
              <div style={{ fontSize: 12, color: C.nutty, fontFamily: "'Lora', serif" }}>{risk.action}</div>
            </div>
          )}
          {risk.probability != null && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: C.leaf, fontFamily: "'DM Mono', monospace" }}>PROBABILITY</span>
              <div style={{ flex: 1, height: 4, background: C.papyrus, borderRadius: 2 }}>
                <div style={{ width: `${(risk.probability*100).toFixed(0)}%`, height: '100%', background: SEV_COLOR[sev], borderRadius: 2, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: SEV_COLOR[sev], fontWeight: 700 }}>{(risk.probability*100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ANALYSIS DASHBOARD ────────────────────────────────────────────
function AnalysisDashboard({ initialCountry, onBackToMap }) {
  const [activeCountry, setActiveCountry] = useState(initialCountry);
  const [activeSector,  setActiveSector]  = useState('Stocks');
  const [activeView,    setActiveView]    = useState('analysis');
  const [dataCache,     setDataCache]     = useState({});
  const [loading,       setLoading]       = useState({});
  const [errors,        setErrors]        = useState({});
  const [graphView,     setGraphView]     = useState('graph');
  const [visible,       setVisible]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const cacheKey = `${activeCountry}::${activeSector}`;

  const fetchData = useCallback(async (country, sector) => {
    const key = `${country}::${sector}`;
    if (dataCache[key] || loading[key]) return;
    setLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`${API}/api/analyze/${encodeURIComponent(country)}/${encodeURIComponent(sector)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setDataCache(p => ({ ...p, [key]: d }));
    } catch (err) {
      setErrors(p => ({ ...p, [key]: err.message }));
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  }, [dataCache, loading]);

  useEffect(() => { fetchData(initialCountry, 'Stocks'); }, []);

  const handleCountry = (c) => { setActiveCountry(c); fetchData(c, activeSector); };
  const handleSector  = (s) => { setActiveSector(s);  fetchData(activeCountry, s); };

  const d           = dataCache[cacheKey];
  const isLoading   = loading[cacheKey];
  const isError     = errors[cacheKey];
  const confirmed   = d ? d.risks?.filter(r => r.confirmed) : [];
  const countryMeta = COUNTRIES.find(c => c.id === activeCountry);

  return (
    <div style={{
      fontFamily: "'Lora', serif", background: C.parchment,
      minHeight: '100vh', color: C.ink,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Lora:wght@400;500;600&family=DM+Mono:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:1} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${C.papyrus}; }
        ::-webkit-scrollbar-thumb { background:${C.leaf}; border-radius:2px; }
        button { cursor:pointer; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: C.deer, borderBottom: `1px solid ${C.nutty}`,
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 16px ${C.ink}40`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Back to map button */}
          <button onClick={onBackToMap} style={{
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.leaf}60`,
            background: `${C.nutty}80`, color: `${C.leaf}CC`,
            fontSize: 10, fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.06em', marginRight: 6,
          }}>← MAP</button>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: C.copper,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: C.warmWhite, fontWeight: 700,
          }}>◈</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: C.warmWhite }}>Macro Intelligence Hub</div>
            <div style={{ fontSize: 9, color: `${C.leaf}CC`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em' }}>WEALTH WELLNESS ENGINE </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', background: `${C.nutty}80`, borderRadius: 10, padding: 3, gap: 2 }}>
            {[['analysis','⬡ Analysis'],['lab','⚗ Scenario Lab']].map(([v, label]) => (
              <button key={v} onClick={() => setActiveView(v)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: activeView === v ? C.copper : 'transparent',
                color: activeView === v ? C.warmWhite : `${C.leaf}CC`,
                fontSize: 11, fontFamily: "'DM Mono', monospace",
                fontWeight: activeView === v ? 600 : 400, transition: 'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Pill color="#4A9A6A" bg={`${C.nutty}60`} style={{ border: `1px solid #4A9A6A80` }}>● LIVE</Pill>
            <Pill color={`${C.leaf}CC`} bg={`${C.nutty}60`} style={{ border: `1px solid ${C.leaf}40` }}>✓ RISK TRACKING</Pill>
          </div>
        </div>
      </header>

      {activeView === 'lab' ? (
        <ScenarioLab api={API} />
      ) : (
        <>
          {/* ── COUNTRY TABS ── */}
          <div style={{ background: C.nutty, borderBottom: `1px solid ${C.deer}`, padding: '0 40px', display: 'flex' }}>
            {COUNTRIES.map(c => (
              <button key={c.id} onClick={() => handleCountry(c.id)} style={{
                background: 'transparent', border: 'none',
                borderBottom: `3px solid ${activeCountry === c.id ? C.leaf : 'transparent'}`,
                color: activeCountry === c.id ? C.warmWhite : `${C.leaf}90`,
                padding: '14px 24px', fontSize: 12,
                fontFamily: "'DM Mono', monospace", fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', letterSpacing: '0.03em',
              }}>
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* ── SECTOR TABS ── */}
          <div style={{ background: C.papyrus, borderBottom: `1px solid ${C.leaf}60`, padding: '0 40px', display: 'flex', gap: 2 }}>
            {SECTORS.map(s => {
              const key = `${activeCountry}::${s.id}`;
              const sd  = dataCache[key];
              const conf = sd?.risks?.filter(r => r.confirmed).length ?? 0;
              const isAct = activeSector === s.id;
              return (
                <button key={s.id} onClick={() => handleSector(s.id)} style={{
                  background: isAct ? C.warmWhite : 'transparent',
                  border: 'none', borderBottom: `2px solid ${isAct ? C.copper : 'transparent'}`,
                  color: isAct ? C.deer : C.leaf,
                  padding: '12px 22px', fontSize: 12,
                  fontFamily: "'DM Mono', monospace", fontWeight: isAct ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                }}>
                  <span>{s.icon}</span><span>{s.label}</span>
                  {sd && <Pill>{sd.risks?.length} risks</Pill>}
                  {conf > 0 && <Pill color={C.confirmed} bg={C.confirmedBg}>✓ {conf}</Pill>}
                  {loading[key] && <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.copper, display: 'inline-block', animation: 'shimmer 0.8s infinite' }} />}
                </button>
              );
            })}
          </div>

          {/* ── MAIN ── */}
          <main style={{ padding: '28px 40px', animation: 'fadein 0.4s ease' }}>
            {isLoading && <LoadingPipeline country={activeCountry} sector={activeSector} />}
            {isError && !isLoading && (
              <div style={{ padding: 24, textAlign: 'center', color: C.chestnut, fontSize: 12, fontFamily: "'DM Mono', monospace", background: '#F5E8E6', border: `1px solid ${C.chestnut}40`, borderRadius: 10 }}>
                ✗ {isError} — Backend may be waking up, retry in 30s
              </div>
            )}
            {d && !isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadein 0.4s ease' }}>
                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{countryMeta?.flag}</span>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 24, color: C.deer }}>{activeCountry} · {activeSector}</div>
                    <div style={{ fontSize: 10, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', marginTop: 2 }}>MACRO RISK ANALYSIS · 3-DAY ROLLING WINDOW</div>
                  </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', background: C.warmWhite, border: `1px solid ${C.leaf}60`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 2px 16px ${C.deer}0A` }}>
                  <StatCard label="Events"       value={d.events?.length}      color={C.deer}      />
                  <StatCard label="Themes"       value={d.themes?.length}      color={C.nutty}     />
                  <StatCard label="Hot 🔥"       value={d.hot_themes?.length}  color={C.copper}    />
                  <StatCard label="Risks"        value={d.risks?.length}       color={C.chestnut}  />
                  <StatCard label="Confirmed ✓" value={confirmed.length}      color={C.confirmed} />
                  <div style={{ flex: 2, padding: '20px 24px', borderLeft: `1px solid ${C.leaf}40` }}>
                    <div style={{ fontSize: 9, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Hot Themes</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {d.hot_themes?.length ? d.hot_themes.map(t => (
                        <Pill key={t} color={C.copper} bg="#F7EDE4">🔥 {t}</Pill>
                      )) : <span style={{ fontSize: 11, color: C.leaf, fontFamily: "'DM Mono', monospace" }}>None elevated</span>}
                    </div>
                  </div>
                </div>
                {/* Confirmed banner */}
                {confirmed.length > 0 && (
                  <div style={{ padding: '16px 22px', background: C.confirmedBg, border: `1px solid ${C.confirmed}60`, borderRadius: 12, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 20, color: C.confirmed }}>✓</span>
                    <div>
                      <div style={{ fontSize: 10, color: C.confirmed, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', marginBottom: 8 }}>PREDICTED RISKS CONFIRMED BY SUBSEQUENT EVENTS</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {confirmed.map(r => <Pill key={r.id} color={C.confirmed} bg={C.confirmedBg}>✓ {r.name}</Pill>)}
                      </div>
                    </div>
                  </div>
                )}
                {/* View toggle */}
                <div style={{ display: 'flex', gap: 2, background: C.papyrus, borderRadius: 10, padding: 3, width: 'fit-content', border: `1px solid ${C.leaf}40` }}>
                  {[['graph','⬡ Knowledge Graph'],['risks','⚠ Risk Register']].map(([v, label]) => (
                    <button key={v} onClick={() => setGraphView(v)} style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: graphView === v ? C.copper : 'transparent',
                      color: graphView === v ? C.warmWhite : C.leaf,
                      fontSize: 11, fontFamily: "'DM Mono', monospace",
                      fontWeight: graphView === v ? 600 : 400, transition: 'all 0.2s',
                    }}>{label}</button>
                  ))}
                </div>
                {graphView === 'graph' ? (
                  <div style={{ background: C.warmWhite, border: `1px solid ${C.leaf}60`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 2px 16px ${C.deer}0A` }}>
                    <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.leaf}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.papyrus }}>
                      <span style={{ fontSize: 11, color: C.nutty, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', fontWeight: 600 }}>
                        {activeCountry.toUpperCase()} · {activeSector.toUpperCase()} · CAUSAL KNOWLEDGE GRAPH
                      </span>
                      <div style={{ display: 'flex', gap: 18, fontSize: 10, fontFamily: "'DM Mono', monospace", color: C.leaf, alignItems: 'center' }}>
                        <span>● Event</span>
                        <span style={{ color: C.copper }}>◆ Theme</span>
                        <span style={{ color: C.chestnut }}>■ Risk</span>
                        <span style={{ color: C.confirmed }}>⤻ Confirms</span>
                      </div>
                    </div>
                    <KnowledgeGraph data={d} sector={activeSector} country={activeCountry} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', marginBottom: 4 }}>
                      {d.risks?.length} RISKS IDENTIFIED · {confirmed.length} CONFIRMED
                    </div>
                    {d.risks?.sort((a,b) => {
                      const order = { Critical:0, High:1, Medium:2, Low:3 };
                      return (order[a.severity]??4)-(order[b.severity]??4);
                    }).map(r => <RiskCard key={r.id} risk={r} />)}
                  </div>
                )}
              </div>
            )}
            {!isLoading && !d && !isError && (
              <div style={{ textAlign: 'center', padding: 80, color: C.leaf, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: '0.2em' }}>
                AWAITING PIPELINE
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────
export default function App() {
  const [screen,          setScreen]          = useState('map');   // 'map' | 'dashboard'
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleSelectCountry = (countryId) => {
    setSelectedCountry(countryId);
    setScreen('dashboard');
  };

  const handleBackToMap = () => {
    setScreen('map');
  };

  if (screen === 'map') {
    return <WorldMapDashboard onSelectCountry={handleSelectCountry} />;
  }

  return (
    <AnalysisDashboard
      key={selectedCountry}
      initialCountry={selectedCountry}
      onBackToMap={handleBackToMap}
    />
  );
}
