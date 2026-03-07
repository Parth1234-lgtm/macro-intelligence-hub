import { useState, useEffect } from 'react';
import KnowledgeGraph from './KnowledgeGraph';

const SECTORS = ['Stocks', 'Real Estate', 'Crypto'];

const SECTOR_META = {
  Stocks:        { icon: '📈', accent: '#e8e8e8', sub: '#666' },
  'Real Estate': { icon: '🏢', accent: '#e8e8e8', sub: '#666' },
  Crypto:        { icon: '₿',  accent: '#e8e8e8', sub: '#666' },
};

function StatCard({ label, value, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, flex:1, padding:'22px 28px', borderRight:'1px solid #1a1a1a' }}>
      <span style={{ fontSize:10, color:'#444', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontSize:30, fontFamily:'Outfit', fontWeight:800, color: color||'#e8e8e8', lineHeight:1 }}>{value}</span>
    </div>
  );
}

function LoadingPipeline({ sector }) {
  const steps = ['Ingesting', 'Classifying', 'Heat Detection', 'Risk Analysis', 'Building Graph'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s+1) % steps.length), 900);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:500, gap:36 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:10, color:'#444', fontFamily:'JetBrains Mono', letterSpacing:'0.2em' }}>AI PIPELINE RUNNING</span>
        <span style={{ fontSize:24, fontFamily:'Outfit', fontWeight:700, color:'#e8e8e8' }}>{sector}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center' }}>
            <div style={{
              padding:'10px 18px', fontSize:10, fontFamily:'JetBrains Mono',
              background: i===step ? '#1e1e1e' : '#111',
              border: `1px solid ${i===step ? '#444' : '#1a1a1a'}`,
              color: i===step ? '#e8e8e8' : '#333',
              borderRadius: i===0?'8px 0 0 8px':i===steps.length-1?'0 8px 8px 0':'0',
              transition:'all 0.3s',
            }}>{s}</div>
            {i < steps.length-1 && <div style={{ width:1, height:38, background:'#1a1a1a' }}/>}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#444',
            animation:`dp 1.2s ${i*0.15}s ease-in-out infinite`, opacity:.3 }}/>
        ))}
      </div>
      <style>{`@keyframes dp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}`}</style>
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
  const confirmed = d ? d.risks.filter(r => r.confirmed) : [];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:'#0a0a0a', minHeight:'100vh', color:'#e8e8e8' }}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseop{0%,100%{opacity:1}50%{opacity:.3}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0a0a0a}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
      `}</style>

      {/* Header */}
      <header style={{
        background:'#0d0d0d', borderBottom:'1px solid #1a1a1a',
        padding:'0 40px', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:60,
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'#1a1a1a', border:'1px solid #2a2a2a',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, color:'#e8e8e8',
          }}>◈</div>
          <div>
            <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:16, color:'#f0f0f0', letterSpacing:'-0.01em' }}>
              Macro Intelligence Hub
            </div>
            <div style={{ fontSize:9, color:'#444', fontFamily:'JetBrains Mono', letterSpacing:'0.1em' }}>
              RISK KNOWLEDGE ENGINE
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {[['● LIVE','#34d399'],['✓ CONFIRMS TRACKING','#e8e8e8']].map(([label,color])=>(
            <span key={label} style={{
              fontSize:9, padding:'4px 12px', borderRadius:20,
              background:'#141414', border:'1px solid #222',
              color, fontFamily:'JetBrains Mono', letterSpacing:'0.05em',
            }}>{label}</span>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background:'#0d0d0d', borderBottom:'1px solid #1a1a1a', padding:'0 40px', display:'flex', gap:2 }}>
        {SECTORS.map(sector => {
          const sd = sectorData[sector];
          const conf = sd ? sd.risks.filter(r=>r.confirmed).length : 0;
          const isActive = activeTab === sector;
          const meta = SECTOR_META[sector];
          return (
            <button key={sector} onClick={() => handleTab(sector)} style={{
              background: isActive ? '#141414' : 'transparent',
              border:'none', borderBottom:`2px solid ${isActive ? '#e8e8e8' : 'transparent'}`,
              color: isActive ? '#e8e8e8' : '#555',
              padding:'16px 28px', fontSize:12, letterSpacing:'0.05em',
              fontFamily:'Inter', fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:10, transition:'all 0.2s',
            }}>
              <span>{meta.icon}</span>
              <span>{sector}</span>
              {sd && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#666', fontFamily:'JetBrains Mono' }}>{sd.risks?.length} risks</span>}
              {conf > 0 && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#001a0d', border:'1px solid #00ff8830', color:'#00ff88', fontFamily:'JetBrains Mono' }}>✓ {conf}</span>}
              {loading[sector] && <span style={{ width:5, height:5, borderRadius:'50%', background:'#555', display:'inline-block', animation:'pulseop 0.5s infinite' }}/>}
            </button>
          );
        })}
      </div>

      {/* Main */}
      <main style={{ padding:'32px 40px', animation:'fadein 0.4s ease' }}>

        {loading[activeTab] && <LoadingPipeline sector={activeTab} />}

        {error[activeTab] && (
          <div style={{ padding:24, textAlign:'center', color:'#f43f5e', fontSize:12, fontFamily:'JetBrains Mono', background:'#140810', border:'1px solid #f43f5e20', borderRadius:10 }}>
            ✗ {error[activeTab]} — Backend may be waking up, retry in 30s
          </div>
        )}

        {d && !loading[activeTab] && (
          <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'fadein 0.4s ease' }}>

            {/* Stats row */}
            <div style={{ display:'flex', background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:12, overflow:'hidden' }}>
              <StatCard label="Events"      value={d.events?.length}     color="#e8e8e8" />
              <StatCard label="Themes"      value={d.themes?.length}     color="#aaa" />
              <StatCard label="Hot 🔥"      value={d.hot_themes?.length} color="#fb923c" />
              <StatCard label="Risks"       value={d.risks?.length}      color="#f43f5e" />
              <StatCard label="Confirmed ✓" value={confirmed.length}     color="#00ff88" />
              <div style={{ flex:2, padding:'22px 28px', display:'flex', flexDirection:'column', gap:8, borderLeft:'1px solid #1a1a1a' }}>
                <span style={{ fontSize:10, color:'#444', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>Hot Themes</span>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {d.hot_themes?.map(t => (
                    <span key={t} style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#fb923c', fontFamily:'JetBrains Mono' }}>🔥 {t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirmed banner */}
            {confirmed.length > 0 && (
              <div style={{ padding:'14px 22px', background:'#0a0f0a', border:'1px solid #00ff8820', borderRadius:10, display:'flex', gap:14, alignItems:'center' }}>
                <span style={{ fontSize:16, color:'#00ff88' }}>✓</span>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <span style={{ fontSize:10, color:'#00ff88', fontFamily:'JetBrains Mono', letterSpacing:'0.12em' }}>PREDICTED RISKS CONFIRMED BY SUBSEQUENT EVENTS</span>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {confirmed.map(r => (
                      <span key={r.id} style={{ fontSize:10, padding:'3px 12px', borderRadius:20, background:'#0d1a0d', border:'1px solid #00ff8830', color:'#00ff88', fontFamily:'JetBrains Mono' }}>{r.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Graph */}
            <div style={{ background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'14px 22px', borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#888', fontFamily:'JetBrains Mono', letterSpacing:'0.12em' }}>
                  {activeTab.toUpperCase()} · KNOWLEDGE GRAPH
                </span>
                <div style={{ display:'flex', gap:20, fontSize:10, fontFamily:'JetBrains Mono', color:'#444', alignItems:'center' }}>
                  <span>● Event</span>
                  <span style={{ color:'#777' }}>◆ Theme</span>
                  <span style={{ color:'#f43f5e80' }}>■ Risk</span>
                  <span style={{ color:'#00ff88' }}>⤻ Confirms</span>
                  <span style={{ color:'#fb923c40' }}>--- Implies</span>
                </div>
              </div>
              <KnowledgeGraph data={d} sector={activeTab} />
            </div>

          </div>
        )}

        {!loading[activeTab] && !d && !error[activeTab] && (
          <div style={{ textAlign:'center', padding:80, color:'#222', fontSize:12, fontFamily:'JetBrains Mono', letterSpacing:'0.2em' }}>
            AWAITING PIPELINE
          </div>
        )}
      </main>
    </div>
  );
}
