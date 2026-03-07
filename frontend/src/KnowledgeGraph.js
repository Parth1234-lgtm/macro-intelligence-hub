import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SEV = { Critical:'#f43f5e', High:'#fb923c', Medium:'#e8c84a', Low:'#34d399' };
const DAY_PAL = [
  { node:'#888', glow:'#aaa' },
  { node:'#666', glow:'#888' },
  { node:'#555', glow:'#777' },
];

export default function KnowledgeGraph({ data, sector }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { events, themes, risks, graph_edges } = data;

    const days  = [...new Set(events.map(e => e.date))].sort();
    const N     = days.length;
    const W     = Math.max(svgRef.current.parentElement.clientWidth || 1100, 1100);
    const H     = 520;
    const MID   = H / 2;
    const CYCLE = (W - 80) / N;
    const ARC_TOP = 48;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);

    // Background
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','#0d0d0d');

    // Subtle dot grid
    const defs = svg.append('defs');
    const dp = defs.append('pattern').attr('id',`dp${sector}`)
      .attr('width',30).attr('height',30).attr('patternUnits','userSpaceOnUse');
    dp.append('circle').attr('cx',15).attr('cy',15).attr('r',.7).attr('fill','#181818');
    svg.append('rect').attr('width',W).attr('height',H).attr('fill',`url(#dp${sector})`);

    // Subtle center guide
    svg.append('line').attr('x1',0).attr('y1',MID).attr('x2',W).attr('y2',MID)
      .attr('stroke','#161616').attr('stroke-width',1).attr('stroke-dasharray','3 9');

    // Glow filters
    const mkGlow = (id, color, blur) => {
      const f = defs.append('filter').attr('id',id).attr('x','-60%').attr('y','-60%').attr('width','220%').attr('height','220%');
      f.append('feGaussianBlur').attr('stdDeviation',blur).attr('result','b');
      f.append('feFlood').attr('flood-color',color).attr('flood-opacity',.4).attr('result','c');
      f.append('feComposite').attr('in','c').attr('in2','b').attr('operator','in').attr('result','d');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in','d');
      m.append('feMergeNode').attr('in','SourceGraphic');
    };
    mkGlow(`gC${sector}`, '#00ff88', 14);
    mkGlow(`gR${sector}`, '#f43f5e', 5);
    mkGlow(`gH${sector}`, '#fb923c', 7);
    mkGlow(`gE${sector}`, '#888', 5);

    // Arrow markers
    defs.append('marker').attr('id',`aT${sector}`)
      .attr('viewBox','0 -4 10 8').attr('refX',18).attr('refY',0)
      .attr('markerWidth',4).attr('markerHeight',4).attr('orient','auto')
      .append('path').attr('d','M0,-4L10,0L0,4').attr('fill','#252525');
    defs.append('marker').attr('id',`aI${sector}`)
      .attr('viewBox','0 -4 10 8').attr('refX',18).attr('refY',0)
      .attr('markerWidth',4).attr('markerHeight',4).attr('orient','auto')
      .append('path').attr('d','M0,-4L10,0L0,4').attr('fill','#fb923c40');
    defs.append('marker').attr('id',`aC${sector}`)
      .attr('viewBox','0 -4 10 8').attr('refX',18).attr('refY',0)
      .attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto')
      .append('path').attr('d','M0,-4L10,0L0,4').attr('fill','#00ff88');

    // ── Node positions ────────────────────────────────────────────────────
    const nm = {};
    days.forEach((date, di) => {
      const cs  = 40 + di * CYCLE;
      const pal = DAY_PAL[di] || DAY_PAL[0];

      const evts = events.filter(e => e.date === date);
      const eX   = cs + CYCLE * 0.14;
      const eR   = Math.min(evts.length * 54, 270);
      evts.forEach((e, i) => {
        const y = evts.length===1 ? MID : MID - eR/2 + (eR/(evts.length-1))*i;
        nm[e.id] = { ...e, type:'event', x:eX, y, di, pal };
      });

      const thms = themes.filter(t => Number(t.day||1)===di+1);
      const tX   = cs + CYCLE * 0.50;
      const tR   = Math.min(thms.length * 70, 200);
      thms.forEach((t, i) => {
        const y = thms.length===1 ? MID : MID - tR/2 + (tR/(thms.length-1))*i;
        nm[t.id] = { ...t, type:'theme', x:tX, y, di, pal };
      });

      const rsks = risks.filter(r => Number(r.day||1)===di+1);
      const rX   = cs + CYCLE * 0.80;
      const rR   = Math.min(rsks.length * 70, 200);
      rsks.forEach((r, i) => {
        const y = rsks.length===1 ? MID : MID - rR/2 + (rR/(rsks.length-1))*i;
        nm[r.id] = { ...r, type:'risk', x:rX, y, di, pal };
      });

      // date chip
      svg.append('rect')
        .attr('x', cs+CYCLE/2-40).attr('y', H-26)
        .attr('width',80).attr('height',17).attr('rx',8)
        .attr('fill','#111').attr('stroke','#1e1e1e');
      svg.append('text')
        .attr('x', cs+CYCLE/2).attr('y', H-13)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size',8).attr('fill','#333').attr('letter-spacing',1)
        .text(date);
    });

    // ── Edges ─────────────────────────────────────────────────────────────
    const edgeG = svg.append('g');
    const confirmEdges = graph_edges.filter(e => e.type==='confirms');
    const otherEdges   = graph_edges.filter(e => e.type!=='confirms');

    otherEdges.forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s||!t) return;
      const isI = edge.type==='implies';
      const cp1x = s.x+(t.x-s.x)*.4, cp2x = s.x+(t.x-s.x)*.6;
      edgeG.append('path')
        .attr('d', `M${s.x},${s.y} C${cp1x},${s.y} ${cp2x},${t.y} ${t.x},${t.y}`)
        .attr('fill','none')
        .attr('stroke', isI ? '#fb923c28' : '#202020')
        .attr('stroke-width', isI ? 1 : 0.8)
        .attr('stroke-dasharray', isI ? '5 3' : 'none')
        .attr('marker-end', `url(#${isI?'aI':'aT'}${sector})`);
    });

    // ── CONFIRMATION ARCS ─────────────────────────────────────────────────
    confirmEdges.forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s||!t) return;

      const pathD = `M${s.x},${s.y} C${s.x},${ARC_TOP} ${t.x},${ARC_TOP} ${t.x},${t.y}`;

      // Wide outer glow — pulsing
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',16)
        .attr('opacity',.03)
        .style('animation','cg 2.5s ease-in-out infinite');

      // Mid glow
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',5)
        .attr('opacity',.08)
        .style('animation','cg 2.5s ease-in-out infinite .15s');

      // Thin glow
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',1.5)
        .attr('opacity',.3)
        .style('animation','cg 2.5s ease-in-out infinite .3s');

      // Marching dashes on top
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',1.5)
        .attr('stroke-dasharray','10 6')
        .attr('marker-end', `url(#aC${sector})`)
        .style('animation','cg 2.5s ease-in-out infinite, march 1.1s linear infinite');

      // CONFIRMS pill at arc apex
      const midX = (s.x + t.x) / 2;
      edgeG.append('rect')
        .attr('x', midX-34).attr('y', ARC_TOP-10)
        .attr('width', 68).attr('height', 18).attr('rx', 9)
        .attr('fill','#0a0f0a').attr('stroke','#00ff8840').attr('stroke-width',1);
      edgeG.append('text')
        .attr('x', midX).attr('y', ARC_TOP+4)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size',7.5).attr('fill','#00ff88cc').attr('letter-spacing',2)
        .text('CONFIRMS');
    });

    // ── Event circles ─────────────────────────────────────────────────────
    const eG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='event'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',22)
      .attr('fill','none').attr('stroke','#1e1e1e').attr('stroke-width',1);
    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',16)
      .attr('fill','#111').attr('stroke','#2a2a2a').attr('stroke-width',1.5)
      .attr('filter',`url(#gE${sector})`);
    eG.append('text').attr('x',d=>d.x).attr('y',d=>d.y).attr('dy','0.35em')
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8).attr('fill','#888')
      .text(d=>`E${d.id.replace(/\D/g,'').slice(-2)}`);
    eG.append('text').attr('x',d=>d.x+24).attr('y',d=>d.y)
      .attr('dominant-baseline','middle').attr('font-family','Inter')
      .attr('font-size',9.5).attr('fill','#3a3a3a')
      .text(d=>d.headline.slice(0,24)+'…');

    // ── Theme diamonds ────────────────────────────────────────────────────
    const tG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='theme'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    tG.append('polygon')
      .attr('points', d => { const s=27; return `${d.x},${d.y-s} ${d.x+s},${d.y} ${d.x},${d.y+s} ${d.x-s},${d.y}`; })
      .attr('fill', d => d.is_hot ? '#130d00' : '#111')
      .attr('stroke', d => d.is_hot ? '#fb923c' : '#2a2a2a')
      .attr('stroke-width', d => d.is_hot ? 1.5 : 1)
      .attr('filter', d => d.is_hot ? `url(#gH${sector})` : 'none');

    tG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+40)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',500)
      .attr('font-size',9.5).attr('fill',d=>d.is_hot?'#fb923c':'#666')
      .text(d=>(d.is_hot?'🔥 ':'')+d.name?.slice(0,16));

    tG.append('rect').attr('x',d=>d.x-25).attr('y',d=>d.y+52).attr('width',50).attr('height',2).attr('rx',1).attr('fill','#1a1a1a');
    tG.append('rect').attr('x',d=>d.x-25).attr('y',d=>d.y+52)
      .attr('width',d=>50*(d.heat||0)).attr('height',2).attr('rx',1)
      .attr('fill',d=>d.is_hot?'#fb923c':'#444');

    // ── Risk rects ────────────────────────────────────────────────────────
    const rG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='risk'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    const RW=100, RH=52;
    rG.append('rect')
      .attr('x',d=>d.x-RW/2).attr('y',d=>d.y-RH/2)
      .attr('width',RW).attr('height',RH).attr('rx',8)
      .attr('fill', d => d.confirmed ? '#0a120a' : '#111')
      .attr('stroke', d => d.confirmed ? '#00ff88' : (SEV[d.severity]||'#f43f5e'))
      .attr('stroke-width', d => d.confirmed ? 1.5 : 1)
      .attr('filter', d => `url(#${d.confirmed?'gC':'gR'}${sector})`);

    rG.filter(d=>d.confirmed).append('text')
      .attr('x',d=>d.x+RW/2-10).attr('y',d=>d.y-RH/2+16)
      .attr('font-size',11).attr('text-anchor','middle').attr('fill','#00ff88cc').text('✓');

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y-8)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',500)
      .attr('font-size',9.5).attr('fill',d=>d.confirmed?'#00ff88':(SEV[d.severity]||'#f43f5e'))
      .text(d=>d.name?.slice(0,16));

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+7)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8).attr('fill',d=>d.confirmed?'#00ff8855':`${SEV[d.severity]||'#f43f5e'}80`)
      .text(d=>`${d.severity} · ${Math.round((d.probability||.5)*100)}%`);

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+20)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',7).attr('fill',d=>d.confirmed?'#00ff8840':'#2a2a2a')
      .text(d=>d.confirmed?'✓ CONFIRMED':(d.time_horizon?.split('(')[0]?.trim()||''));

    // ── Tooltip ───────────────────────────────────────────────────────────
    const tip = d3.select(tipRef.current);

    function showTip(evt, d) {
      let h='';
      if (d.type==='event') h=`<div class="tl">${d.source} · ${d.date}</div><div class="tt">${d.headline}</div>`;
      else if (d.type==='theme') h=`<div class="tl">THEME · ${d.category}${d.is_hot?' 🔥':''}</div><div class="tt">${d.name}</div><div class="td">${d.description||''}</div><div class="th">Heat: ${Math.round((d.heat||0)*100)}%</div>`;
      else h=`<div class="tl">RISK · ${d.severity}${d.confirmed?' · ✓ CONFIRMED':''}</div><div class="tt">${d.name}</div><div class="td">${d.description||''}</div><div class="ta">→ ${d.action||''}</div>`;

      const cr = svgRef.current.parentElement.getBoundingClientRect();
      const relX = evt.clientX - cr.left;
      const relY = evt.clientY - cr.top;
      const tipW=300, tipH=150;
      const left = relX+16+tipW > cr.width ? relX-tipW-8 : relX+16;
      const top  = Math.max(8, Math.min(relY-10, cr.height-tipH-10));
      tip.html(h).style('opacity',1).style('left',`${left}px`).style('top',`${top}px`);
    }
    function hideTip() { tip.style('opacity',0); }

  }, [data, sector]);

  return (
    <div style={{ position:'relative', overflowX:'auto', overflowY:'visible' }}>
      <svg ref={svgRef} style={{ display:'block' }}/>
      <div ref={tipRef} style={{
        position:'absolute', pointerEvents:'none', opacity:0,
        background:'#111', border:'1px solid #222',
        borderRadius:10, padding:'14px 18px', maxWidth:300,
        zIndex:200, fontFamily:'Inter', transition:'opacity .12s',
        boxShadow:'0 8px 40px rgba(0,0,0,0.9)',
      }}>
        <style>{`
          .tl{font-size:9px;color:#444;letter-spacing:.12em;margin-bottom:6px;font-family:'JetBrains Mono';text-transform:uppercase}
          .tt{font-size:13px;color:#e8e8e8;line-height:1.5;margin-bottom:6px;font-weight:500}
          .td{font-size:10px;color:#555;line-height:1.5;margin-bottom:4px}
          .th{font-size:10px;color:#fb923c}
          .ta{font-size:10px;color:#34d399;margin-top:4px;line-height:1.4}
          @keyframes cg{0%,100%{opacity:.05}50%{opacity:.9}}
          @keyframes march{from{stroke-dashoffset:32}to{stroke-dashoffset:0}}
        `}</style>
      </div>
    </div>
  );
}
