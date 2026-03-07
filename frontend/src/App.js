import { useState, useEffect } from 'react';
import KnowledgeGraph from './KnowledgeGraph';

const SECTORS = ['Stocks', 'Real Estate', 'Crypto'];

const SECTOR_META = {
  Stocks:        { icon: '📈', accent: '#6ee7f7', grad: 'linear-gradient(135deg,#0f2a3f,#0a1628)', tag: 'EQ' },
  'Real Estate': { icon: '🏢', accent: '#a78bfa', grad: 'linear-gradient(135deg,#1a0f3f,#0a0a28)', tag: 'RE' },
  Crypto:        { icon: '₿',  accent: '#fbbf24', grad: 'linear-gradient(135deg,#2a1a00,#120c00)', tag: 'CR' },
};

const SEV_COLOR = { Critical:'#f43f5e', High:'#fb923c', Medium:'#facc15', Low:'#34d399' };

function Pill({ color, children }) {
  return (
    <span style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 20,
      background: `${color}18`, border: `1px solid ${color}50`,
      color, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em',
    }}>{children}</span>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:70 }}>
      <span style={{ fontSize:10, color:'#475569', fontFamily:'Inter', letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontSize:28, fontFamily:'Outfit', fontWeight:800, color: color||'#f1f5f9', lineHeight:1 }}>{value}</span>
      {sub && <span style={{ fontSize:9, color:'#334155', fontFamily:'JetBrains Mono' }}>{sub}</span>}
    </div>
  );
}

function LoadingPipeline({ sector }) {
  const steps = ['Ingesting', 'Classifying', 'Heat Detection', 'Risk Analysis', 'Graph Build'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 900);
    return () => clearInterval(iv);
  }, []);
  const meta = SECTOR_META[sector];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:500, gap:32 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, color:'#475569', fontFamily:'JetBrains Mono', letterSpacing:'0.2em' }}>RUNNING AI PIPELINE</span>
        <span style={{ fontSize:22, fontFamily:'Outfit', fontWeight:700, color: meta.accent }}>{sector.toUpperCase()}</span>
      </div>

      {/* animated pipeline steps */}
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center' }}>
            <div style={{
              padding:'8px 16px', fontSize:10, fontFamily:'JetBrains Mono',
              background: i === step ? `${meta.accent}18` : '#0a0f1a',
              border: `1px solid ${i === step ? meta.accent : '#1a2535'}`,
              color: i === step ? meta.accent : '#2a3a4a',
              borderRadius: i===0?'8px 0 0 8px':i===steps.length-1?'0 8px 8px 0':'0',
              transition:'all 0.4s',
              boxShadow: i===step ? `0 0 20px ${meta.accent}30` : 'none',
            }}>{s}</div>
            {i < steps.length-1 && (
              <div style={{ width:1, height:36, background: i < step ? `${meta.accent}60` : '#1a2535' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%',
            background: meta.accent,
            animation:`dotpulse 1.2s ${i*0.15}s ease-in-out infinite`,
            opacity: 0.3,
          }}/>
        ))}
      </div>
      <style>{`@keyframes dotpulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Stocks');
  const [sectorData, setSectorData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const fetchSector = async (sector) => {
    if (sectorData[sector] || loading[sector]) return;
    setLoading(prev => ({ ...prev, [sector]: true }));
    try {
      const res = await fetch(`https://macro-intelligence-hub.onrender.com/api/analyze/${encodeURIComponent(sector)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setSectorData(prev => ({ ...prev, [sector]: d }));
    } catch (err) {
      setError(prev => ({ ...prev, [sector]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [sector]: false }));
    }
  };

  useEffect(() => { fetchSector('Stocks'); }, []);
  const handleTab = (s) => { setActiveTab(s); fetchSector(s); };

  const d    = sectorData[activeTab];
  const meta = SECTOR_META[activeTab];
  const confirmed = d ? d.risks.filter(r => r.confirmed) : [];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:'#060a12', minHeight:'100vh', color:'#e2e8f0' }}>
      <style>{`
        * { box-sizing: border-box }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 8px #6ee7f730} 50%{box-shadow:0 0 24px #6ee7f760} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#060a12}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: 'rgba(6,10,18,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #0f1f35',
        padding: '0 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 62, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: 'linear-gradient(135deg,#6ee7f7,#3b82f6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, boxShadow:'0 0 16px #6ee7f740',
          }}>◈</div>
          <div>
            <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:16, letterSpacing:'0.02em', color:'#f1f5f9' }}>
              Macro Intelligence Hub
            </div>
            <div style={{ fontSize:10, color:'#334155', fontFamily:'JetBrains Mono', letterSpacing:'0.1em' }}>
              3-DAY ROLLING RISK ENGINE
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <Pill color="#6ee7f7">● LIVE</Pill>
          <Pill color="#00ff88">✓ CONFIRMS ACTIVE</Pill>
          <Pill color="#fbbf24">⚡ AI PIPELINE</Pill>
        </div>
      </header>

      {/* ── Sector Tabs ── */}
      <div style={{ background:'#080d18', borderBottom:'1px solid #0f1f35', padding:'0 36px', display:'flex', gap:4 }}>
        {SECTORS.map(sector => {
          const m = SECTOR_META[sector];
          const sd = sectorData[sector];
          const conf = sd ? sd.risks.filter(r=>r.confirmed).length : 0;
          const isActive = activeTab === sector;
          return (
            <button key={sector} onClick={() => handleTab(sector)} style={{
              background: isActive ? `${m.accent}0f` : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? m.accent : 'transparent'}`,
              color: isActive ? m.accent : '#475569',
              padding: '16px 24px', fontSize: 12, letterSpacing: '0.08em',
              fontFamily: 'Inter', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.2s',
            }}>
              <span>{m.icon}</span>
              <span>{sector}</span>
              {sd && (
                <span style={{
                  fontSize:9, padding:'2px 7px', borderRadius:10,
                  background:`${m.accent}18`, border:`1px solid ${m.accent}40`,
                  color:m.accent, fontFamily:'JetBrains Mono',
                }}>{sd.risks?.length} risks</span>
              )}
              {conf > 0 && (
                <span style={{
                  fontSize:9, padding:'2px 7px', borderRadius:10,
                  background:'#00ff8818', border:'1px solid #00ff8840',
                  color:'#00ff88', fontFamily:'JetBrains Mono',
                }}>✓ {conf}</span>
              )}
              {loading[sector] && (
                <span style={{ width:6, height:6, borderRadius:'50%', background:m.accent, display:'inline-block', animation:'pulse 0.5s infinite' }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main ── */}
      <main style={{ padding:'28px 36px', animation:'fadein 0.4s ease' }}>

        {loading[activeTab] && <LoadingPipeline sector={activeTab} />}

        {error[activeTab] && (
          <div style={{ padding:24, textAlign:'center', color:'#f43f5e', fontSize:12, fontFamily:'JetBrains Mono', background:'#1a0810', border:'1px solid #f43f5e30', borderRadius:8 }}>
            ✗ {error[activeTab]} — Backend may be waking up, retry in 30s
          </div>
        )}

        {d && !loading[activeTab] && (
          <div style={{ animation:'fadein 0.5s ease', display:'flex', flexDirection:'column', gap:20 }}>

            {/* Stats row */}
            <div style={{
              display:'flex', gap:0, background:'#080d18',
              border:'1px solid #0f1f35', borderRadius:12, overflow:'hidden',
            }}>
              {[
                { label:'Events', value:d.events?.length, color:meta.accent },
                { label:'Themes', value:d.themes?.length, color:'#a78bfa' },
                { label:'Hot 🔥', value:d.hot_themes?.length, color:'#fb923c' },
                { label:'Risks', value:d.risks?.length, color:'#f43f5e' },
                { label:'Confirmed ✓', value:confirmed.length, color:'#00ff88' },
              ].map((s,i) => (
                <div key={s.label} style={{
                  flex:1, padding:'18px 24px',
                  borderRight: i<4 ? '1px solid #0f1f35' : 'none',
                  background: i===4 && confirmed.length>0 ? '#00ff8808' : 'transparent',
                }}>
                  <StatCard {...s} />
                </div>
              ))}
              {/* Hot themes */}
              <div style={{ flex:2, padding:'18px 24px', display:'flex', flexDirection:'column', gap:8, borderLeft:'1px solid #0f1f35' }}>
                <span style={{ fontSize:10, color:'#475569', fontFamily:'Inter', letterSpacing:'0.08em', textTransform:'uppercase' }}>Hot Themes</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {d.hot_themes?.map(t => <Pill key={t} color="#fb923c">🔥 {t}</Pill>)}
                </div>
              </div>
            </div>

            {/* Confirmed alert */}
            {confirmed.length > 0 && (
              <div style={{
                padding:'14px 20px', background:'#001a0d',
                border:'1px solid #00ff8830', borderRadius:10,
                display:'flex', gap:14, alignItems:'center',
                boxShadow:'0 0 24px #00ff8815',
              }}>
                <div style={{ fontSize:20 }}>✓</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <span style={{ fontSize:11, color:'#00ff88', fontFamily:'JetBrains Mono', letterSpacing:'0.15em' }}>
                    PREDICTED RISKS CONFIRMED BY SUBSEQUENT EVENTS
                  </span>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {confirmed.map(r => (
                      <span key={r.id} style={{
                        fontSize:10, padding:'3px 10px', borderRadius:20,
                        background:'#002a14', border:'1px solid #00ff8850',
                        color:'#00ff88', fontFamily:'JetBrains Mono',
                      }}>{r.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Graph */}
            <div style={{
              background:'#070b14',
              border:`1px solid ${meta.accent}25`,
              borderRadius:12, overflow:'hidden',
            }}>
              {/* Graph header */}
              <div style={{
                padding:'12px 20px',
                borderBottom:`1px solid ${meta.accent}15`,
                display:'flex', justifyContent:'space-between', alignItems:'center',
                background:`${meta.accent}06`,
              }}>
                <span style={{ fontSize:11, color:meta.accent, fontFamily:'JetBrains Mono', letterSpacing:'0.15em', fontWeight:500 }}>
                  {activeTab.toUpperCase()} · 3-DAY KNOWLEDGE GRAPH
                </span>
                <div style={{ display:'flex', gap:20, fontSize:10, fontFamily:'JetBrains Mono', alignItems:'center' }}>
                  <span style={{ color:'#94a3b8' }}>● Event</span>
                  <span style={{ color:'#a78bfa' }}>◆ Theme</span>
                  <span style={{ color:'#f43f5e' }}>■ Risk</span>
                  <span style={{ color:'#00ff88' }}>⤻ Confirms</span>
                  <span style={{ color:'#fb923c60' }}>--- Implies</span>
                </div>
              </div>
              <KnowledgeGraph data={d} sector={activeTab} accentColor={meta.accent} />
            </div>

          </div>
        )}

        {!loading[activeTab] && !d && !error[activeTab] && (
          <div style={{ textAlign:'center', padding:80, color:'#1e3a5f', fontSize:12, fontFamily:'JetBrains Mono', letterSpacing:'0.2em' }}>
            AWAITING PIPELINE RUN
          </div>
        )}
      </main>
    </div>
  );
}
