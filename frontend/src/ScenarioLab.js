import { useState } from 'react';
import KnowledgeGraph from './KnowledgeGraph';

const C = {
  parchment: '#F5EFE4', papyrus: '#EDE3D0', leaf: '#C29666',
  copper: '#B76635', nutty: '#583924', deer: '#532D1C',
  chestnut: '#68261F', ink: '#2E1A0E', warmWhite: '#FBF7F1',
  confirmed: '#4A7C59', confirmedBg: '#EAF2EC',
};

const SEV_COLOR = { Critical: C.chestnut, High: C.copper, Medium: '#8B6914', Low: C.confirmed };
const SEV_BG    = { Critical: '#F5E8E6',  High: '#F7EDE4', Medium: '#F5EDD8', Low: '#E8F0EA'  };

const PRESET_SCENARIOS = [
  { label: 'Stagflation Trap',    emoji: '🌀', description: 'Persistent inflation refuses to fall while economic growth stalls and unemployment rises.', theme_ids: ['sim_t1','sim_t6','sim_t2'] },
  { label: 'AI Disruption Wave',  emoji: '🤖', description: 'Rapid AI adoption causes mass job displacement while creating a productivity boom.', theme_ids: ['sim_t4','sim_t9','sim_t7'] },
  { label: 'EM Debt Crisis',      emoji: '🌏', description: 'Rising US dollar triggers sovereign debt defaults across emerging markets.', theme_ids: ['sim_t5','sim_t2','sim_t10'] },
  { label: 'Rate Pivot Rally',    emoji: '🚀', description: 'Central banks pivot to aggressive rate cuts triggering a risk asset boom.', theme_ids: ['sim_t8','sim_t4','sim_t7'] },
  { label: 'Geopolitical Fracture', emoji: '⚔️', description: 'US-China tensions combined with Middle East conflict disrupts global trade.', theme_ids: ['sim_t3','sim_t6','sim_t5'] },
];

const ALL_THEMES = [
  { id:'sim_t1',  name:'Stagflation',           emoji:'🌀', description:'High inflation combined with economic stagnation and rising unemployment' },
  { id:'sim_t2',  name:'Credit Crunch',          emoji:'💳', description:'Banks tighten lending standards sharply, credit availability collapses' },
  { id:'sim_t3',  name:'Geopolitical Escalation',emoji:'⚔️', description:'Military or trade conflict disrupts global supply chains' },
  { id:'sim_t4',  name:'AI Productivity Boom',   emoji:'🤖', description:'Rapid AI adoption drives corporate earnings and productivity gains' },
  { id:'sim_t5',  name:'Currency Crisis',         emoji:'💱', description:'Emerging market currency collapse triggers capital flight' },
  { id:'sim_t6',  name:'Energy Shock',            emoji:'⛽', description:'Oil or gas supply disruption causes energy price surge' },
  { id:'sim_t7',  name:'Deflationary Spiral',    emoji:'📉', description:'Falling prices reduce consumer spending and corporate revenues' },
  { id:'sim_t8',  name:'Rate Pivot',              emoji:'🔄', description:'Central banks reverse course and cut rates aggressively' },
  { id:'sim_t9',  name:'Regulatory Crackdown',   emoji:'🏛', description:'Governments tighten rules on financial markets, tech, or crypto' },
  { id:'sim_t10', name:'Debt Ceiling Crisis',    emoji:'⚖️', description:'Government fiscal impasse threatens sovereign default' },
];

function Pill({ children, color, bg, onClick, selected, style = {} }) {
  return (
    <span onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '5px 12px', borderRadius: 20,
      fontSize: 11, fontFamily: "'DM Mono', monospace",
      letterSpacing: '0.04em', fontWeight: 600,
      background: selected ? (color || C.copper) : (bg || C.papyrus),
      color: selected ? C.warmWhite : (color || C.nutty),
      border: `1px solid ${selected ? (color || C.copper) : C.leaf + '60'}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      ...style,
    }}>{children}</span>
  );
}

function RiskCard({ risk }) {
  const [open, setOpen] = useState(false);
  const sev = risk.severity || 'Medium';
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: C.warmWhite,
      border: `1px solid ${C.leaf}50`,
      borderLeft: `4px solid ${SEV_COLOR[sev]}`,
      borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${C.deer}12`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <Pill color={SEV_COLOR[sev]} bg={SEV_BG[sev]}>{sev}</Pill>
            <Pill color="#7C5C8A" bg="#F0EBF8">⚗ SIMULATED</Pill>
            {risk.time_horizon && <Pill>{risk.time_horizon}</Pill>}
          </div>
          <div style={{ fontSize: 14, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: C.deer }}>{risk.name}</div>
        </div>
        <span style={{ color: C.leaf, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.leaf}40` }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: C.nutty, lineHeight: 1.7, fontFamily: "'Lora', serif" }}>{risk.description}</p>
          {risk.action && (
            <div style={{ background: C.papyrus, border: `1px solid ${C.leaf}50`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, color: C.leaf, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', marginBottom: 4 }}>PREPARATION NOTE</div>
              <div style={{ fontSize: 12, color: C.nutty, fontFamily: "'Lora', serif" }}>{risk.action}</div>
            </div>
          )}
          {risk.probability != null && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: C.leaf, fontFamily: "'DM Mono', monospace" }}>PROBABILITY</span>
              <div style={{ flex: 1, height: 4, background: C.papyrus, borderRadius: 2 }}>
                <div style={{ width: `${(risk.probability*100).toFixed(0)}%`, height: '100%', background: SEV_COLOR[sev], borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: SEV_COLOR[sev], fontWeight: 700 }}>{(risk.probability*100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScenarioLab({ api }) {
  const [step,           setStep]           = useState('build');
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [customText,     setCustomText]     = useState('');
  const [scenarioDesc,   setScenarioDesc]   = useState('');
  const [result,         setResult]         = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [resultView,     setResultView]     = useState('risks');

  const toggleTheme = (id) => setSelectedThemes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const loadPreset = (p) => { setSelectedThemes(p.theme_ids); setScenarioDesc(p.description); setCustomText(''); };

  const canRun = (selectedThemes.length >= 2 || customText.trim().length > 10) && scenarioDesc.trim().length > 0;

  const runSimulation = async () => {
    setLoading(true); setError(null);
    try {
      const customThemes = customText.trim() ? [{ name:'Custom Condition', description: customText.trim() }] : [];
      const res = await fetch(`${api}/api/simulate`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ theme_ids: selectedThemes, custom_themes: customThemes, scenario_description: scenarioDesc.trim(), country:'Global', sector:'Cross-Sector' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
      setStep('result');
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const ta = { width:'100%', padding:'12px 14px', background: C.papyrus, border:`1px solid ${C.leaf}60`, borderRadius:8, fontSize:13, fontFamily:"'Lora',serif", color:C.ink, resize:'vertical', outline:'none', lineHeight:1.6 };

  return (
    <div style={{ padding:'32px 40px', animation:'fadein 0.4s ease' }}>
      <style>{`@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>⚗</span>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:26, color:C.deer }}>Scenario Lab</div>
            <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em' }}>HYPOTHETICAL RISK SIMULATION · COMBINE THEMES · EXPLORE FUTURES</div>
          </div>
        </div>
        <p style={{ fontSize:14, color:C.nutty, fontFamily:"'Lora',serif", lineHeight:1.7, maxWidth:680 }}>
          Select macro themes or describe a hypothetical condition. The AI will analyse compound risks that emerge — helping you stay prepared before events unfold.
        </p>
      </div>

      {step === 'build' ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>

          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Presets */}
            <div style={{ background:C.warmWhite, border:`1px solid ${C.leaf}60`, borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:14 }}>QUICK PRESETS</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {PRESET_SCENARIOS.map(p => (
                  <button key={p.label} onClick={() => loadPreset(p)} style={{
                    background:C.papyrus, border:`1px solid ${C.leaf}60`, borderRadius:10,
                    padding:'12px 16px', textAlign:'left', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:12, transition:'all 0.2s',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.parchment;e.currentTarget.style.borderColor=C.copper;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=C.papyrus;e.currentTarget.style.borderColor=`${C.leaf}60`;}}
                  >
                    <span style={{ fontSize:20, flexShrink:0 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:12, color:C.deer, marginBottom:2 }}>{p.label}</div>
                      <div style={{ fontSize:11, color:C.nutty, fontFamily:"'Lora',serif", lineHeight:1.4 }}>{p.description.slice(0,80)}...</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme chips */}
            <div style={{ background:C.warmWhite, border:`1px solid ${C.leaf}60`, borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:14 }}>
                SELECT THEMES <span style={{ color:C.copper }}>({selectedThemes.length} selected · min 2)</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {ALL_THEMES.map(t => (
                  <Pill key={t.id} onClick={()=>toggleTheme(t.id)} selected={selectedThemes.includes(t.id)} color={C.copper} bg={C.papyrus}>
                    {t.emoji} {t.name}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Selection preview */}
            <div style={{ background:'#F7EDE4', border:`1px solid ${C.copper}50`, borderRadius:14, padding:'20px 22px', minHeight:100 }}>
              <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:12 }}>SELECTED COMBINATION</div>
              {selectedThemes.length === 0
                ? <div style={{ fontSize:12, color:C.leaf, fontFamily:"'Lora',serif", fontStyle:'italic' }}>Select themes or choose a preset...</div>
                : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {selectedThemes.map(id => { const t=ALL_THEMES.find(x=>x.id===id); return t ? <Pill key={id} selected color={C.copper}>{t.emoji} {t.name}</Pill> : null; })}
                  </div>
              }
            </div>

            {/* Custom condition */}
            <div style={{ background:C.warmWhite, border:`1px solid ${C.leaf}60`, borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:10 }}>CUSTOM CONDITION (OPTIONAL)</div>
              <textarea value={customText} onChange={e=>setCustomText(e.target.value)}
                placeholder="Describe any additional condition... e.g. 'A major pension fund collapse triggers a liquidity crisis'"
                style={{ ...ta, minHeight:80 }} />
            </div>

            {/* Scenario description */}
            <div style={{ background:C.warmWhite, border:`1px solid ${C.leaf}60`, borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:10 }}>
                SCENARIO DESCRIPTION <span style={{ color:C.chestnut }}>*</span>
              </div>
              <textarea value={scenarioDesc} onChange={e=>setScenarioDesc(e.target.value)}
                placeholder="Describe the overall scenario... e.g. 'A stagflationary environment where central banks cannot cut rates despite slowing growth'"
                style={{ ...ta, minHeight:90 }} />
            </div>

            {error && <div style={{ padding:'12px 16px', background:'#F5E8E6', border:`1px solid ${C.chestnut}40`, borderRadius:8, color:C.chestnut, fontSize:12, fontFamily:"'DM Mono',monospace" }}>✗ {error}</div>}

            <button onClick={runSimulation} disabled={!canRun||loading} style={{
              padding:'16px 28px', borderRadius:12, border:'none',
              background: canRun&&!loading ? C.deer : C.papyrus,
              color: canRun&&!loading ? C.warmWhite : C.leaf,
              fontSize:14, fontFamily:"'DM Mono',monospace", fontWeight:600,
              letterSpacing:'0.06em', cursor: canRun&&!loading ? 'pointer' : 'not-allowed',
              transition:'all 0.3s',
              boxShadow: canRun&&!loading ? `0 4px 20px ${C.deer}40` : 'none',
            }}>
              {loading ? '⚗ RUNNING SIMULATION...' : '⚗ RUN SCENARIO SIMULATION →'}
            </button>
          </div>
        </div>

      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:20, animation:'fadein 0.4s ease' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <button onClick={()=>{setStep('build');setResult(null);}} style={{
                padding:'8px 16px', borderRadius:8, border:`1px solid ${C.leaf}60`,
                background:C.warmWhite, color:C.nutty, fontSize:11, fontFamily:"'DM Mono',monospace",
              }}>← NEW SCENARIO</button>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:C.deer }}>⚗ Simulation Results</div>
                <div style={{ fontSize:10, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em' }}>{result?.themes?.length} THEMES · {result?.risks?.length} RISKS IDENTIFIED</div>
              </div>
            </div>
            <div style={{ display:'flex', background:C.papyrus, borderRadius:10, padding:3, gap:2, border:`1px solid ${C.leaf}40` }}>
              {[['risks','⚠ Risks'],['graph','⬡ Graph']].map(([v,label])=>(
                <button key={v} onClick={()=>setResultView(v)} style={{
                  padding:'7px 16px', borderRadius:8, border:'none',
                  background: resultView===v ? C.copper : 'transparent',
                  color: resultView===v ? C.warmWhite : C.leaf,
                  fontSize:11, fontFamily:"'DM Mono',monospace",
                  fontWeight: resultView===v ? 600 : 400, transition:'all 0.2s',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Scenario banner */}
          <div style={{ background:'#F7EDE4', border:`1px solid ${C.copper}50`, borderRadius:12, padding:'16px 22px' }}>
            <div style={{ fontSize:9, color:C.leaf, fontFamily:"'DM Mono',monospace", letterSpacing:'0.14em', marginBottom:8 }}>HYPOTHETICAL SCENARIO</div>
            <div style={{ fontSize:14, color:C.deer, fontFamily:"'Lora',serif", lineHeight:1.6, marginBottom:10 }}>{result?.scenario}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {result?.themes?.map(t => (
                <Pill key={t.id} selected color={C.copper}>
                  {ALL_THEMES.find(x=>x.id===t.id)?.emoji||'⚗'} {t.name}
                </Pill>
              ))}
            </div>
          </div>

          {resultView === 'risks' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {result?.risks?.sort((a,b)=>({Critical:0,High:1,Medium:2,Low:3}[a.severity]??4)-({Critical:0,High:1,Medium:2,Low:3}[b.severity]??4))
                .map(r=><RiskCard key={r.id} risk={{...r,simulated:true}}/>)}
            </div>
          ) : (
            <div style={{ background:C.warmWhite, border:`1px solid ${C.leaf}60`, borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.leaf}40`, background:C.papyrus }}>
                <span style={{ fontSize:11, color:C.nutty, fontFamily:"'DM Mono',monospace", letterSpacing:'0.12em', fontWeight:600 }}>⚗ SIMULATED · CROSS-SECTOR CAUSAL GRAPH</span>
              </div>
              <KnowledgeGraph data={result} sector="Simulation" country="Global" isSimulation />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
