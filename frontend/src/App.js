import { useState, useEffect } from 'react';
import KnowledgeGraph from './KnowledgeGraph';

const SECTORS = ['Stocks', 'Real Estate', 'Crypto'];

const SECTOR_META = {
  Stocks:        { icon: '📈', accent: '#2196f3', dim: '#0d2137' },
  'Real Estate': { icon: '🏢', accent: '#818cf8', dim: '#0d0f37' },
  Crypto:        { icon: '₿',  accent: '#f59e0b', dim: '#1a1000' },
};

const SEVERITY_COLOR = {
  Critical: '#ff2d55', High: '#ff6b35', Medium: '#ffd166', Low: '#06d6a0',
};

const DAY_COLORS = ['#2196f3', '#a78bfa', '#f59e0b'];

function StatBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#475569', letterSpacing: '0.15em' }}>{label}</span>
      <span style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 800, color: color || '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function LoadingPipeline({ sector }) {
  const steps = ['INGESTING NEWS', 'CLASSIFYING THEMES', 'DETECTING HEAT', 'GENERATING RISKS', 'BUILDING GRAPH'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 1100);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 580, gap: 24 }}>
      <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.3em' }}>RUNNING 3-DAY PIPELINE · {sector.toUpperCase()}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '5px 10px', fontSize: 8, letterSpacing: '0.1em', fontFamily: 'Space Mono',
              background: i === step ? '#0d2547' : '#080d16',
              border: `1px solid ${i === step ? '#2196f3' : '#1e3a5f'}`,
              color: i === step ? '#60a5fa' : '#334155',
              transition: 'all 0.3s',
            }}>{s}</div>
            {i < steps.length - 1 && <span style={{ color: '#1e3a5f' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: '#334155', letterSpacing: '0.2em' }}>PROCESSING DAY 1 → DAY 2 → DAY 3 SEQUENTIALLY...</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#2196f3', animation: `pulse ${0.6 + i * 0.2}s infinite` }} />)}
      </div>
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

  const handleTab = (sector) => { setActiveTab(sector); fetchSector(sector); };

  const d = sectorData[activeTab];
  const meta = SECTOR_META[activeTab];

  const confirmedRisks = d ? d.risks.filter(r => r.confirmed) : [];

  return (
    <div style={{ fontFamily: "'Space Mono', monospace", background: '#05080f', minHeight: '100vh', color: '#e2e8f0' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes confirmPulse { 0%,100%{box-shadow:0 0 6px #00ff8860} 50%{box-shadow:0 0 18px #00ff88} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#05080f}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
      `}</style>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(90deg,#080f1e,#05080f)',
        borderBottom: '1px solid #0d1f38',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 58,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 10px #00e5ff', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '0.05em' }}>MACRO INTELLIGENCE HUB</span>
          <span style={{ fontSize: 9, color: '#1e3a5f', letterSpacing: '0.2em' }}>// 3-DAY ROLLING ANALYSIS</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 9, color: '#334155', letterSpacing: '0.1em' }}>
          <span style={{ color: '#00ff88' }}>✅ CONFIRMED RISK</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #0d1f38', padding: '0 32px', display: 'flex', background: '#080d16' }}>
        {SECTORS.map(sector => {
          const m = SECTOR_META[sector];
          const isActive = activeTab === sector;
          const sd = sectorData[sector];
          const confirmed = sd ? sd.risks.filter(r => r.confirmed).length : 0;
          return (
            <button key={sector} onClick={() => handleTab(sector)} style={{
              background: isActive ? '#0d1f38' : 'transparent',
              border: 'none', borderBottom: isActive ? `2px solid ${m.accent}` : '2px solid transparent',
              color: isActive ? m.accent : '#475569',
              padding: '15px 28px', fontSize: 11, letterSpacing: '0.15em',
              fontFamily: 'Space Mono', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}>
              {m.icon} {sector.toUpperCase()}
              {sd && <span style={{ fontSize: 8, padding: '1px 6px', background: m.dim, border: `1px solid ${m.accent}`, color: m.accent }}>{sd.risks?.length} RISKS</span>}
              {confirmed > 0 && <span style={{ fontSize: 8, padding: '1px 6px', background: '#001a0d', border: '1px solid #00ff88', color: '#00ff88' }}>✅ {confirmed}</span>}
              {loading[sector] && <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.accent, animation: 'pulse 0.5s infinite', display: 'inline-block' }} />}
            </button>
          );
        })}
      </div>

      <main style={{ padding: '24px 32px', animation: 'fadeIn 0.4s ease' }}>

        {loading[activeTab] && <LoadingPipeline sector={activeTab} />}
        {error[activeTab] && (
          <div style={{ padding: 20, textAlign: 'center', color: '#ef4444', fontSize: 11 }}>
            ERROR: {error[activeTab]} — Is the backend running on port 8000?
          </div>
        )}

        {d && !loading[activeTab] && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 28, padding: '14px 22px', background: '#080d16', border: `1px solid ${meta.accent}20`, marginBottom: 20, flexWrap: 'wrap' }}>
              <StatBadge label="EVENTS (3 DAYS)" value={d.events?.length} color={meta.accent} />
              <div style={{ width: 1, background: '#0d1f38' }} />
              <StatBadge label="THEMES" value={d.themes?.length} color="#00e5ff" />
              <div style={{ width: 1, background: '#0d1f38' }} />
              <StatBadge label="HOT 🔥" value={d.hot_themes?.length} color="#f59e0b" />
              <div style={{ width: 1, background: '#0d1f38' }} />
              <StatBadge label="RISKS" value={d.risks?.length} color="#ff2d55" />
              <div style={{ width: 1, background: '#0d1f38' }} />
              <StatBadge label="✅ CONFIRMED" value={confirmedRisks.length} color="#00ff88" />
              <div style={{ width: 1, background: '#0d1f38' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 9, color: '#475569', letterSpacing: '0.15em' }}>HOT THEMES</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {d.hot_themes?.map(t => (
                    <span key={t} style={{ fontSize: 8, padding: '3px 8px', background: '#2d1200', border: '1px solid #ff6b35', color: '#ff6b35' }}>🔥 {t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirmed risks alert banner */}
            {confirmedRisks.length > 0 && (
              <div style={{ marginBottom: 16, padding: '10px 18px', background: '#001a0d', border: '1px solid #00ff88', display: 'flex', gap: 12, alignItems: 'center', animation: 'confirmPulse 2s infinite' }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <div>
                  <div style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.2em', marginBottom: 3 }}>PREDICTED RISKS NOW CONFIRMED BY SUBSEQUENT EVENTS</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {confirmedRisks.map(r => (
                      <span key={r.id} style={{ fontSize: 9, padding: '2px 8px', background: '#002a14', border: '1px solid #00ff8860', color: '#00ff88' }}>{r.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge Graph */}
            <div style={{ background: '#07090f', border: `1px solid ${meta.accent}30`, marginBottom: 20 }}>
              <div style={{ padding: '10px 18px', borderBottom: `1px solid ${meta.accent}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.2em', color: meta.accent }}>{activeTab.toUpperCase()} · 3-DAY KNOWLEDGE GRAPH</span>
                <div style={{ display: 'flex', gap: 14, fontSize: 8, color: '#334155' }}>
                  <span>● EVENTS</span>
                  <span style={{ color: '#00e5ff' }}>◆ THEMES</span>
                  <span style={{ color: '#ff2d55' }}>■ RISKS</span>
                  <span style={{ color: '#00ff88' }}>— CONFIRMS</span>
                  <span style={{ color: '#ff6b3580' }}>--- IMPLIES</span>
                  <span style={{ color: '#2196f330' }}>— TRIGGERS</span>
                </div>
              </div>
              <KnowledgeGraph data={d} sector={activeTab} />
            </div>



          </div>
        )}

        {!loading[activeTab] && !d && !error[activeTab] && (
          <div style={{ textAlign: 'center', padding: 60, color: '#1e3a5f', fontSize: 11, letterSpacing: '0.2em' }}>AWAITING PIPELINE RUN</div>
        )}
      </main>
    </div>
  );
}
