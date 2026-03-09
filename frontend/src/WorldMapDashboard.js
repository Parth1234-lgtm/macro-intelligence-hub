import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const C = {
  parchment:  '#F5EFE4',
  papyrus:    '#EDE3D0',
  leaf:       '#C29666',
  copper:     '#B76635',
  nutty:      '#583924',
  deer:       '#532D1C',
  chestnut:   '#68261F',
  warmWhite:  '#FBF7F1',
  confirmed:  '#4A7C59',
  ink:        '#2E1A0E',
};

// Country numeric IDs from ISO 3166-1 (used in world-110m.json)
const COUNTRY_IDS = {
  US:    ['840'],          // United States
  India: ['356'],          // India
  China: ['156'],          // China
};

const COUNTRIES_META = [
  {
    id: 'US', flag: '🇺🇸', label: 'United States', sublabel: 'North America',
    accent: C.chestnut,
    lon: -98, lat: 38,       // label pin position (lon/lat)
    stats: { themes: 12, risks: 8, hot: 3 },
    desc: 'Fed policy, equity markets & CRE stress signal elevated systemic risk.',
  },
  {
    id: 'India', flag: '🇮🇳', label: 'India', sublabel: 'South Asia',
    accent: C.copper,
    lon: 78, lat: 20,
    stats: { themes: 9, risks: 6, hot: 2 },
    desc: 'Sensex momentum, real estate boom & crypto regulatory adaptation in focus.',
  },
  {
    id: 'China', flag: '🇨🇳', label: 'China', sublabel: 'East Asia',
    accent: C.deer,
    lon: 103, lat: 34,
    stats: { themes: 11, risks: 9, hot: 4 },
    desc: 'Evergrande crisis, deflation spiral & liquidity crunch drive critical exposure.',
  },
];

export default function WorldMapDashboard({ onSelectCountry }) {
  const svgRef      = useRef(null);
  const containerRef= useRef(null);
  const [hovered,   setHovered]  = useState(null);
  const [selected,  setSelected] = useState(null);
  const [revealed,  setRevealed] = useState(false);
  const [mapReady,  setMapReady] = useState(false);
  const [mapError,  setMapError] = useState(false);
  const projRef     = useRef(null);

  // ── Load TopoJSON + render map ──────────────────────────────────
  useEffect(() => {
    setTimeout(() => setRevealed(true), 120);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAndDraw() {
      try {
        // Load topojson-client from CDN
        const topoScript = document.createElement('script');
        topoScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
        await new Promise((res, rej) => {
          topoScript.onload = res;
          topoScript.onerror = rej;
          document.head.appendChild(topoScript);
        });

        // Fetch world data — try multiple sources
        let topo = null;
        const sources = [
          'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
          'https://unpkg.com/world-atlas@2/countries-110m.json',
        ];
        for (const src of sources) {
          try {
            const r = await fetch(src);
            if (r.ok) { topo = await r.json(); break; }
          } catch {}
        }

        if (!topo || cancelled) return;

        // Convert to GeoJSON features
        const countries = window.topojson.feature(topo, topo.objects.countries);

        if (cancelled || !svgRef.current || !containerRef.current) return;

        drawMap(countries);
        setMapReady(true);
      } catch (e) {
        console.warn('Map load failed:', e);
        if (!cancelled) setMapError(true);
      }
    }

    loadAndDraw();
    return () => { cancelled = true; };
  }, []);

  function drawMap(countries) {
    const container = containerRef.current;
    const W = container.clientWidth  || 960;
    const H = container.clientHeight || 500;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width',  W)
      .attr('height', H)
      .style('cursor','grab');

    const defs = svg.append('defs');

    // Ocean gradient
    const oceanGrad = defs.append('radialGradient')
      .attr('id','mapOcean').attr('cx','50%').attr('cy','45%').attr('r','70%');
    oceanGrad.append('stop').attr('offset','0%').attr('stop-color','#DDD0B8');
    oceanGrad.append('stop').attr('offset','100%').attr('stop-color','#C4AA88');

    // Vignette
    const vig = defs.append('radialGradient')
      .attr('id','mapVig').attr('cx','50%').attr('cy','50%').attr('r','70%');
    vig.append('stop').attr('offset','50%').attr('stop-color','transparent');
    vig.append('stop').attr('offset','100%').attr('stop-color',C.deer).attr('stop-opacity','0.22');

    // Land shadow
    const shadow = defs.append('filter').attr('id','landShadow')
      .attr('x','-5%').attr('y','-5%').attr('width','110%').attr('height','110%');
    shadow.append('feDropShadow')
      .attr('dx','0').attr('dy','1.5').attr('stdDeviation','2')
      .attr('flood-color',C.deer).attr('flood-opacity','0.18');

    // Clip to map bounds
    defs.append('clipPath').attr('id','mapClip')
      .append('rect').attr('width',W).attr('height',H).attr('rx',12);

    // ── Projection — auto-fit entire world inside container ──────
    const projection = d3.geoNaturalEarth1()
      .fitExtent([[20, 20], [W - 20, H - 20]], {type:'Sphere'});
    projRef.current = projection;

    const path = d3.geoPath().projection(projection);

    // ── Static background (not part of zoomable group) ──────────
    svg.append('rect').attr('width',W).attr('height',H)
      .attr('fill','url(#mapOcean)').attr('rx',12);

    // ── Zoomable group — everything inside zooms & pans ─────────
    const zoomG = svg.append('g').attr('id','zoomGroup').attr('clip-path','url(#mapClip)');

    // Dot grid inside zoomable group
    const dotPat = defs.append('pattern')
      .attr('id','dotGrid').attr('width',20).attr('height',20).attr('patternUnits','userSpaceOnUse');
    dotPat.append('circle').attr('cx',10).attr('cy',10).attr('r',0.7).attr('fill',`${C.leaf}45`);
    zoomG.append('rect').attr('width',W*4).attr('height',H*4).attr('x',-W*1.5).attr('y',-H*1.5)
      .attr('fill','url(#dotGrid)').attr('opacity',0.55);

    // Graticule
    const graticule = d3.geoGraticule().step([20,20]);
    zoomG.append('path').datum(graticule())
      .attr('d',path).attr('fill','none')
      .attr('stroke',`${C.leaf}20`).attr('stroke-width',0.5);

    // Equator line
    const equator = {type:'LineString', coordinates:[[-180,0],[180,0]]};
    zoomG.append('path').datum(equator)
      .attr('d',path).attr('fill','none')
      .attr('stroke',`${C.copper}45`).attr('stroke-width',1).attr('stroke-dasharray','4 8');

    // Equator label
    const eqPt = projection([-162, 0]);
    if (eqPt) {
      zoomG.append('text').attr('x',eqPt[0]+6).attr('y',eqPt[1]-5)
        .attr('font-family',"'DM Mono',monospace").attr('font-size',9)
        .attr('fill',`${C.leaf}80`).attr('letter-spacing',1)
        .style('pointer-events','none').text('EQUATOR');
    }

    // Ocean labels
    [{t:'PACIFIC OCEAN',lon:-148,lat:5},{t:'ATLANTIC OCEAN',lon:-30,lat:15},{t:'INDIAN OCEAN',lon:75,lat:-28}]
    .forEach(l => {
      const pt = projection([l.lon,l.lat]);
      if (!pt) return;
      zoomG.append('text').attr('x',pt[0]).attr('y',pt[1])
        .attr('text-anchor','middle')
        .attr('font-family',"'DM Mono',monospace").attr('font-size',9)
        .attr('fill',`${C.nutty}28`).attr('letter-spacing',2)
        .style('pointer-events','none').text(l.t);
    });

    // ── Countries ─────────────────────────────────────────────────
    const idToMeta = {};
    COUNTRIES_META.forEach(meta => {
      COUNTRY_IDS[meta.id]?.forEach(numId => { idToMeta[numId] = meta; });
    });

    const countryGroup = zoomG.append('g').attr('id','countries');

    const updateFill = (hovId, selId) => {
      countryGroup.selectAll('path')
        .attr('fill', d => {
          const m = idToMeta[d.id];
          if (!m) return '#E5D8C0';
          if (selId === m.id) return m.accent + '45';
          if (hovId === m.id) return m.accent + '30';
          return '#EAD9BE';
        })
        .attr('stroke', d => {
          const m = idToMeta[d.id];
          if (!m) return `${C.leaf}65`;
          if (selId===m.id||hovId===m.id) return m.accent;
          return `${C.leaf}85`;
        })
        .attr('stroke-width', d => {
          const m = idToMeta[d.id];
          return (m && (selId===m.id||hovId===m.id)) ? 2 : 0.5;
        });
    };

    countryGroup.selectAll('path')
      .data(countries.features)
      .enter().append('path')
      .attr('d', path)
      .attr('fill','#E5D8C0')
      .attr('stroke',`${C.leaf}65`)
      .attr('stroke-width',0.5)
      .attr('filter','url(#landShadow)')
      .style('cursor', d => idToMeta[d.id] ? 'pointer' : 'default')
      .on('click', (evt,d) => {
        const meta = idToMeta[d.id];
        if (meta) { evt.stopPropagation(); handleSelect(meta.id); }
      })
      .on('mouseenter', (evt,d) => {
        const meta = idToMeta[d.id];
        const hovId = meta ? meta.id : null;
        setHovered(hovId);
        updateFill(hovId, selected);
      })
      .on('mouseleave', () => {
        setHovered(null);
        updateFill(null, selected);
      });

    // ── Pins (inside zoomable group so they pan/zoom with map) ───
    const pinGroup = zoomG.append('g').attr('id','pins');

    COUNTRIES_META.forEach(meta => {
      const pt = projection([meta.lon, meta.lat]);
      if (!pt) return;
      const [px,py] = pt;
      const g = pinGroup.append('g').style('cursor','pointer')
        .on('click', (evt) => { evt.stopPropagation(); handleSelect(meta.id); })
        .on('mouseenter', () => { setHovered(meta.id); updateFill(meta.id, selected); })
        .on('mouseleave', () => { setHovered(null);   updateFill(null, selected); });

      // Pulse ring
      g.append('circle').attr('cx',px).attr('cy',py).attr('r',18)
        .attr('fill',meta.accent).attr('opacity',0.10);
      // Shadow
      g.append('circle').attr('cx',px+1).attr('cy',py+2).attr('r',12)
        .attr('fill',C.deer).attr('opacity',0.12);
      // Main pin
      g.append('circle').attr('cx',px).attr('cy',py).attr('r',12)
        .attr('fill',C.warmWhite).attr('stroke',meta.accent).attr('stroke-width',2)
        .attr('class',`pin-body-${meta.id}`);
      // Flag
      g.append('text').attr('x',px).attr('y',py+5)
        .attr('text-anchor','middle').attr('font-size',11)
        .style('user-select','none').text(meta.flag);
      // Label tag
      g.append('rect').attr('x',px-36).attr('y',py+15).attr('width',72).attr('height',18).attr('rx',6)
        .attr('fill',C.papyrus).attr('stroke',meta.accent).attr('stroke-width',1)
        .attr('class',`pin-tag-${meta.id}`);
      g.append('text').attr('x',px).attr('y',py+27)
        .attr('text-anchor','middle')
        .attr('font-family',"'DM Mono',monospace").attr('font-size',8.5).attr('font-weight',600)
        .attr('fill',meta.accent).attr('letter-spacing','0.04em')
        .style('user-select','none')
        .text(meta.label.split(' ').pop().toUpperCase());
    });

    // Vignette overlay (static, not zoomable)
    svg.append('rect').attr('width',W).attr('height',H)
      .attr('fill','url(#mapVig)').attr('rx',12).style('pointer-events','none');

    // ── Zoom & Pan ────────────────────────────────────────────────
    const zoom = d3.zoom()
      .scaleExtent([0.9, 6])
      .translateExtent([[-W*0.5,-H*0.5],[W*1.5,H*1.5]])
      .on('zoom', (event) => {
        zoomG.attr('transform', event.transform);
        // Scale pin size inversely so pins stay readable at any zoom
        const k = event.transform.k;
        pinGroup.selectAll('circle').attr('r', function() {
          const cls = d3.select(this).attr('class') || '';
          if (cls.startsWith('pin-body')) return 12 / k;
          return 18 / k;
        });
        pinGroup.selectAll('text').attr('font-size', 11 / k);
        pinGroup.selectAll('rect')
          .attr('width',  72 / k).attr('height', 18 / k).attr('rx', 6 / k)
          .each(function() {
            const el = d3.select(this);
            const cls = el.attr('class') || '';
            const id  = cls.replace('pin-tag-','');
            const meta = COUNTRIES_META.find(c=>c.id===id);
            if (!meta) return;
            const pt2 = projection([meta.lon, meta.lat]);
            if (!pt2) return;
            el.attr('x', pt2[0] - 36/k).attr('y', pt2[1] + 15/k);
          });
        svg.style('cursor', event.sourceEvent?.type === 'mousemove' ? 'grabbing' : 'grab');
      })
      .on('end', () => svg.style('cursor','grab'));

    svg.call(zoom);

    // Hint text
    svg.append('text')
      .attr('x', W - 14).attr('y', H - 12)
      .attr('text-anchor','end')
      .attr('font-family',"'DM Mono',monospace").attr('font-size',8)
      .attr('fill',`${C.leaf}70`).attr('letter-spacing',1)
      .style('pointer-events','none')
      .text('SCROLL TO ZOOM · DRAG TO PAN');
  }

  function handleSelect(id) {
    setSelected(id);
    setTimeout(() => onSelectCountry(id), 550);
  }

  const hoveredMeta = COUNTRIES_META.find(c => c.id === hovered);

  return (
    <div style={{
      width:'100%', height:'100vh', position:'relative', overflow:'hidden',
      fontFamily:"'Lora',serif",
      opacity: revealed ? 1 : 0, transition:'opacity 0.7s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Lora:wght@400;500;600&family=DM+Mono:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes floatUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        button { cursor:pointer; }
      `}</style>

      {/* ── MAP fills 100% of viewport ── */}
      <div ref={containerRef} style={{
        position:'absolute', inset:0,
        background:'#C8B898',
        cursor:'grab',
      }} onMouseLeave={() => setHovered(null)}>
        <svg ref={svgRef} style={{display:'block',width:'100%',height:'100%'}}/>

        {/* Loading */}
        {!mapReady && !mapError && (
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:'#C8B898'}}>
            <div style={{fontSize:10,color:C.deer,fontFamily:"'DM Mono',monospace",letterSpacing:'0.2em',animation:'pulse 1.5s infinite'}}>LOADING MAP...</div>
            <div style={{display:'flex',gap:6}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.copper,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
      </div>

      {/* ── HEADER — floats on top ── */}
      <header style={{
        position:'absolute', top:0, left:0, right:0, zIndex:50,
        background:`linear-gradient(to bottom, ${C.deer}F0 0%, ${C.deer}CC 60%, transparent 100%)`,
        padding:'0 40px', height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:36,height:36,borderRadius:9,background:C.copper,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:C.warmWhite,fontWeight:700,boxShadow:`0 2px 8px ${C.ink}50`}}>◈</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,color:C.warmWhite,textShadow:`0 1px 4px ${C.ink}60`}}>Macro Intelligence Hub</div>
            <div style={{fontSize:8.5,color:`${C.leaf}DD`,fontFamily:"'DM Mono',monospace",letterSpacing:'0.14em'}}>WEALTH WELLNESS ENGINE </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#4A9A6A',display:'inline-block',animation:'pulse 2s infinite'}}/>
          <span style={{fontSize:10,color:`${C.leaf}EE`,fontFamily:"'DM Mono',monospace",letterSpacing:'0.12em',textShadow:`0 1px 3px ${C.ink}60`}}>LIVE · GLOBAL RISK MONITOR</span>
        </div>
      </header>

      {/* ── TITLE — bottom-left float ── */}
      <div style={{
        position:'absolute', bottom:100, left:40, zIndex:50,
        animation:'floatUp 0.8s ease 0.3s both',
      }}>
        <div style={{fontSize:9,color:`${C.leaf}EE`,fontFamily:"'DM Mono',monospace",letterSpacing:'0.22em',marginBottom:6,textShadow:`0 1px 3px ${C.ink}80`}}>
          SELECT MARKET · GLOBAL INTELLIGENCE VIEW
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:36,color:C.warmWhite,lineHeight:1.1,textShadow:`0 2px 12px ${C.ink}80`}}>
          Where do you want<br/>to track risk today?
        </div>
      </div>

      {/* ── COUNTRY BUTTONS — bottom bar float ── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:50,
        background:`linear-gradient(to top, ${C.deer}F5 0%, ${C.deer}CC 50%, transparent 100%)`,
        padding:'28px 40px 20px',
        display:'flex', alignItems:'flex-end', justifyContent:'center', gap:12,
        animation:'floatUp 1s ease 0.4s both',
      }}>
        {COUNTRIES_META.map(c=>(
          <button key={c.id}
            onClick={()=>handleSelect(c.id)}
            onMouseEnter={()=>setHovered(c.id)}
            onMouseLeave={()=>setHovered(null)}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'12px 26px', borderRadius:12,
              background: selected===c.id
                ? c.accent
                : hovered===c.id
                  ? `${C.warmWhite}F0`
                  : `${C.warmWhite}CC`,
              backdropFilter:'blur(8px)',
              border:`1.5px solid ${(hovered===c.id||selected===c.id) ? c.accent : C.leaf+'80'}`,
              color: selected===c.id ? C.warmWhite : C.deer,
              fontFamily:"'DM Mono',monospace", fontWeight:600, fontSize:12,
              letterSpacing:'0.05em', transition:'all 0.22s',
              boxShadow: selected===c.id
                ? `0 4px 20px ${c.accent}60`
                : `0 2px 12px ${C.ink}20`,
            }}>
            <span style={{fontSize:20}}>{c.flag}</span>
            <div style={{textAlign:'left'}}>
              <div>{c.label}</div>
              <div style={{fontSize:9,color:selected===c.id?`${C.warmWhite}AA`:C.leaf,fontWeight:400,marginTop:1}}>
                {c.stats.risks} risks · {c.stats.hot} hot
              </div>
            </div>
            <div style={{
              width:7,height:7,borderRadius:'50%',
              background: c.id==='China' ? C.chestnut : c.id==='India' ? C.copper : '#E8923A',
              boxShadow:`0 0 6px ${c.accent}`,
              animation:'pulse 2s infinite',
            }}/>
          </button>
        ))}
      </div>

      {/* ── INFO CARD — absolute top-right, floats over map ── */}
      <div style={{
        position:'absolute', top:80, right:32, zIndex:60,
        width:268,
        background:`${C.warmWhite}F2`,
        backdropFilter:'blur(12px)',
        border:`1px solid ${C.leaf}70`,
        borderRadius:16, padding:'16px 18px',
        boxShadow:`0 8px 40px ${C.ink}25`,
        opacity: hoveredMeta ? 1 : 0,
        transform: hoveredMeta ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.98)',
        transition:'opacity 0.18s ease, transform 0.18s ease',
        pointerEvents:'none',
      }}>
        {COUNTRIES_META.map(meta=>(
          <div key={meta.id} style={{display:hoveredMeta?.id===meta.id?'block':'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{fontSize:22}}>{meta.flag}</span>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:C.deer}}>{meta.label}</div>
                <div style={{fontSize:8,color:C.leaf,fontFamily:"'DM Mono',monospace",letterSpacing:'0.12em'}}>{meta.sublabel}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:C.nutty,lineHeight:1.65,fontFamily:"'Lora',serif",marginBottom:10}}>{meta.desc}</div>
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              {[{l:'Themes',v:meta.stats.themes,c:C.copper},{l:'Risks',v:meta.stats.risks,c:C.chestnut},{l:'Hot 🔥',v:meta.stats.hot,c:C.nutty}].map(s=>(
                <div key={s.l} style={{flex:1,textAlign:'center',padding:'7px 2px',background:C.papyrus,borderRadius:8}}>
                  <div style={{fontSize:17,fontFamily:"'Playfair Display',serif",fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:7.5,color:C.leaf,fontFamily:"'DM Mono',monospace"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'7px',background:meta.accent+'18',border:`1px solid ${meta.accent}40`,borderRadius:8,textAlign:'center'}}>
              <span style={{fontSize:9.5,color:meta.accent,fontFamily:"'DM Mono',monospace",fontWeight:600,letterSpacing:'0.08em'}}>CLICK TO ANALYSE →</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── ZOOM HINT — bottom right ── */}
      <div style={{
        position:'absolute', bottom:22, right:36, zIndex:50,
        fontSize:8, color:`${C.warmWhite}80`,
        fontFamily:"'DM Mono',monospace", letterSpacing:'0.1em',
        textShadow:`0 1px 3px ${C.ink}60`,
        animation:'fadeIn 1.5s ease 1s both',
      }}>
        SCROLL TO ZOOM · DRAG TO PAN
      </div>
    </div>
  );
}
