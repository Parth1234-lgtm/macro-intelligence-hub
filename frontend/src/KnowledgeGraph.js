import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SEV = { Critical:'#f43f5e', High:'#fb923c', Medium:'#facc15', Low:'#34d399' };
const DAY_PALETTES = [
  { node:'#6ee7f7', glow:'#6ee7f7' },
  { node:'#a78bfa', glow:'#a78bfa' },
  { node:'#fbbf24', glow:'#fbbf24' },
];

export default function KnowledgeGraph({ data, sector, accentColor = '#6ee7f7' }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { events, themes, risks, graph_edges } = data;

    const days = [...new Set(events.map(e => e.date))].sort();
    const N = days.length;

    const W   = Math.max(svgRef.current.parentElement.clientWidth || 1100, 1100);
    const H   = 500;
    const MID = H / 2;
    const CYCLE = (W - 80) / N;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);

    // ── Background ────────────────────────────────────────────────────────
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#070b14');

    // subtle dot grid
    const defs = svg.append('defs');
    const dotPat = defs.append('pattern').attr('id',`dot${sector}`)
      .attr('width', 28).attr('height', 28).attr('patternUnits','userSpaceOnUse');
    dotPat.append('circle').attr('cx',14).attr('cy',14).attr('r',0.7).attr('fill','#0f1f35');
    svg.append('rect').attr('width',W).attr('height',H).attr('fill',`url(#dot${sector})`);

    // ── Glows ─────────────────────────────────────────────────────────────
    const mkGlow = (id, color, blur) => {
      const f = defs.append('filter').attr('id', id).attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%');
      f.append('feGaussianBlur').attr('stdDeviation', blur).attr('result','b');
      f.append('feFlood').attr('flood-color', color).attr('flood-opacity', 0.4).attr('result','c');
      f.append('feComposite').attr('in','c').attr('in2','b').attr('operator','in').attr('result','d');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in','d');
      m.append('feMergeNode').attr('in','SourceGraphic');
    };
    DAY_PALETTES.forEach((p,i) => mkGlow(`gN${i}${sector}`, p.glow, 6));
    mkGlow(`gC${sector}`, '#00ff88', 10);
    mkGlow(`gR${sector}`, '#f43f5e', 6);
    mkGlow(`gH${sector}`, '#fb923c', 8);

    // ── Arrows ────────────────────────────────────────────────────────────
    const mkArrow = (id, color, size=5) => {
      defs.append('marker').attr('id', id)
        .attr('viewBox','0 -4 10 8').attr('refX', 18).attr('refY', 0)
        .attr('markerWidth', size).attr('markerHeight', size).attr('orient','auto')
        .append('path').attr('d','M0,-4L10,0L0,4').attr('fill', color);
    };
    mkArrow(`aT${sector}`, '#1e3a5f', 4);
    mkArrow(`aI${sector}`, '#fb923c80', 4);
    mkArrow(`aC${sector}`, '#00ff88', 6);

    // ── Horizontal center guide (very subtle) ─────────────────────────────
    svg.append('line').attr('x1',0).attr('y1',MID).attr('x2',W).attr('y2',MID)
      .attr('stroke','#0f1f35').attr('stroke-width',1).attr('stroke-dasharray','4 8');

    // ── Node positioning ─────────────────────────────────────────────────
    const nm = {};

    days.forEach((date, di) => {
      const cs   = 40 + di * CYCLE;
      const pal  = DAY_PALETTES[di] || DAY_PALETTES[0];

      // events — spread vertically around MID
      const evts   = events.filter(e => e.date === date);
      const eX     = cs + CYCLE * 0.14;
      const eRange = Math.min(evts.length * 52, 260);
      evts.forEach((e, i) => {
        const y = evts.length === 1
          ? MID
          : MID - eRange/2 + (eRange/(evts.length-1)) * i;
        nm[e.id] = { ...e, type:'event', x:eX, y, di, pal };
      });

      // themes — middle of cycle
      const thms   = themes.filter(t => Number(t.day||1) === di+1);
      const tX     = cs + CYCLE * 0.50;
      const tRange = Math.min(thms.length * 68, 190);
      thms.forEach((t, i) => {
        const y = thms.length === 1
          ? MID
          : MID - tRange/2 + (tRange/(thms.length-1)) * i;
        nm[t.id] = { ...t, type:'theme', x:tX, y, di, pal };
      });

      // risks — right of cycle
      const rsks   = risks.filter(r => Number(r.day||1) === di+1);
      const rX     = cs + CYCLE * 0.80;
      const rRange = Math.min(rsks.length * 68, 190);
      rsks.forEach((r, i) => {
        const y = rsks.length === 1
          ? MID
          : MID - rRange/2 + (rRange/(rsks.length-1)) * i;
        nm[r.id] = { ...r, type:'risk', x:rX, y, di, pal };
      });

      // date chip at bottom
      svg.append('rect')
        .attr('x', cs + CYCLE/2 - 44).attr('y', H-30)
        .attr('width', 88).attr('height', 20).attr('rx', 10)
        .attr('fill', `${pal.node}10`).attr('stroke', `${pal.node}30`).attr('stroke-width',1);
      svg.append('text')
        .attr('x', cs + CYCLE/2).attr('y', H-16)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size', 8).attr('fill', `${pal.node}80`).attr('letter-spacing', 1)
        .text(date);
    });

    // ── Edges ──────────────────────────────────────────────────────────────
    const edgeG = svg.append('g');

    // draw regular edges first, confirms on top
    const regular = graph_edges.filter(e => e.type !== 'confirms');
    const confirms = graph_edges.filter(e => e.type === 'confirms');

    regular.forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s || !t) return;
      const isI = edge.type === 'implies';
      const cp1x = s.x + (t.x-s.x)*0.4, cp2x = s.x + (t.x-s.x)*0.6;
      const d = `M${s.x},${s.y} C${cp1x},${s.y} ${cp2x},${t.y} ${t.x},${t.y}`;
      edgeG.append('path').attr('d',d).attr('fill','none')
        .attr('stroke', isI ? '#fb923c35' : '#334155')
        .attr('stroke-width', isI ? 1 : 0.8)
        .attr('stroke-dasharray', isI ? '5 3' : 'none')
        .attr('marker-end', `url(#${isI?'aI':'aT'}${sector})`);
    });

    // confirmation arcs — arc upward (above the graph), glowing green
    confirms.forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s || !t) return;

      // arc control points: go up above the graph
      const arcY = 30; // top of canvas
      const pathD = `M${s.x},${s.y} C${s.x},${arcY} ${t.x},${arcY} ${t.x},${t.y}`;

      // thick glow layer
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width', 10)
        .attr('opacity', 0.06)
        .style('animation','confglow 2s ease-in-out infinite');

      // medium glow
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width', 3)
        .attr('opacity', 0.15)
        .style('animation','confglow 2s ease-in-out infinite 0.1s');

      // crisp dashed line with marching ants
      edgeG.append('path').attr('d', pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '10 5')
        .attr('marker-end', `url(#aC${sector})`)
        .style('animation','confglow 2s ease-in-out infinite, marchdash 1.2s linear infinite');

      // "CONFIRMS" label at apex of arc
      const midX = (s.x + t.x) / 2;
      edgeG.append('rect')
        .attr('x', midX-32).attr('y', arcY+2)
        .attr('width', 64).attr('height', 16).attr('rx', 8)
        .attr('fill','#001a0d').attr('stroke','#00ff8840').attr('stroke-width',1);
      edgeG.append('text')
        .attr('x', midX).attr('y', arcY+13)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size', 7.5).attr('fill','#00ff88').attr('letter-spacing', 1.5)
        .text('CONFIRMS');
    });

    // ── Event nodes (clean circles) ───────────────────────────────────────
    const eG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='event'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    // outer ring
    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',22)
      .attr('fill','none')
      .attr('stroke',d=>d.pal.node).attr('stroke-width',0.5).attr('opacity',0.4);

    // main circle
    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',17)
      .attr('fill',d=>`${d.pal.node}12`)
      .attr('stroke',d=>d.pal.node).attr('stroke-width',1.5)
      .attr('filter',d=>`url(#gN${d.di}${sector})`);

    // label
    eG.append('text').attr('x',d=>d.x).attr('y',d=>d.y).attr('dy','0.35em')
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8).attr('font-weight',500).attr('fill',d=>d.pal.node)
      .text(d=>`E${d.id.replace(/\D/g,'').slice(-2)}`);

    // headline text
    eG.append('text').attr('x',d=>d.x+26).attr('y',d=>d.y)
      .attr('dominant-baseline','middle').attr('font-family','Inter')
      .attr('font-size',9).attr('fill','#334155')
      .text(d=>d.headline.slice(0,24)+'…');

    // ── Theme nodes (diamonds) ────────────────────────────────────────────
    const tG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='theme'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    tG.append('polygon')
      .attr('points', d => {
        const s=28;
        return `${d.x},${d.y-s} ${d.x+s},${d.y} ${d.x},${d.y+s} ${d.x-s},${d.y}`;
      })
      .attr('fill', d => d.is_hot ? '#1a0800' : `${d.pal.node}0a`)
      .attr('stroke', d => d.is_hot ? '#fb923c' : d.pal.node)
      .attr('stroke-width', d => d.is_hot ? 2 : 1.5)
      .attr('filter', d => `url(#${d.is_hot?'gH':'gN'+d.di}${sector})`);

    tG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+40)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',600)
      .attr('font-size',9).attr('fill',d=>d.is_hot?'#fb923c':d.pal.node)
      .text(d=>(d.is_hot?'🔥 ':'')+d.name?.slice(0,16));

    // heat bar
    tG.append('rect').attr('x',d=>d.x-26).attr('y',d=>d.y+52).attr('width',52).attr('height',3).attr('rx',1.5)
      .attr('fill','#0f1f35');
    tG.append('rect').attr('x',d=>d.x-26).attr('y',d=>d.y+52)
      .attr('width',d=>52*(d.heat||0)).attr('height',3).attr('rx',1.5)
      .attr('fill',d=>d.is_hot?'#fb923c':d.pal.node).attr('opacity',0.8);

    // ── Risk nodes (rounded rects) ────────────────────────────────────────
    const rG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='risk'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    const RW=96, RH=52;

    rG.append('rect')
      .attr('x',d=>d.x-RW/2).attr('y',d=>d.y-RH/2)
      .attr('width',RW).attr('height',RH).attr('rx',8)
      .attr('fill', d => d.confirmed ? '#001a0d' :
        ({Critical:'#1e0610',High:'#180d00',Medium:'#14120000',Low:'#00140f'})[d.severity]||'#120610')
      .attr('stroke', d => d.confirmed ? '#00ff88' : (SEV[d.severity]||'#f43f5e'))
      .attr('stroke-width', d => d.confirmed ? 2 : 1.5)
      .attr('filter', d => `url(#${d.confirmed?'gC':'gR'}${sector})`);

    // confirmed checkmark
    rG.filter(d=>d.confirmed).append('text')
      .attr('x',d=>d.x+RW/2-8).attr('y',d=>d.y-RH/2+14)
      .attr('font-size',11).attr('text-anchor','middle').text('✓')
      .attr('fill','#00ff88');

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y-8)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',600)
      .attr('font-size',9)
      .attr('fill',d=>d.confirmed?'#00ff88':(SEV[d.severity]||'#f43f5e'))
      .text(d=>d.name?.slice(0,16));

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+7)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8).attr('fill',d=>d.confirmed?'#00ff8870':(SEV[d.severity]||'#f43f5e')+'bb')
      .text(d=>`${d.severity} · ${Math.round((d.probability||.5)*100)}%`);

    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+20)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',7).attr('fill',d=>d.confirmed?'#00ff8850':'#334155')
      .text(d=>d.confirmed?'✓ CONFIRMED':(d.time_horizon?.split('(')[0]?.trim()||''));

    // ── Tooltip ───────────────────────────────────────────────────────────
    const tip = d3.select(tipRef.current);

    function showTip(evt, d) {
      let html = '';
      if (d.type==='event') {
        html = `<div class="tl">${d.source} · ${d.date}</div>
                <div class="tt">${d.headline}</div>`;
      } else if (d.type==='theme') {
        html = `<div class="tl">THEME · ${d.category}${d.is_hot?' 🔥':''}</div>
                <div class="tt">${d.name}</div>
                <div class="td">${d.description||''}</div>
                <div class="th">Heat: ${Math.round((d.heat||0)*100)}%</div>`;
      } else {
        html = `<div class="tl">RISK · ${d.severity}${d.confirmed?' · ✓ CONFIRMED':''}</div>
                <div class="tt">${d.name}</div>
                <div class="td">${d.description||''}</div>
                <div class="ta">→ ${d.action||''}</div>`;
      }
      const svgRect = svgRef.current.getBoundingClientRect();
      const containerRect = svgRef.current.parentElement.getBoundingClientRect();
      const relX = evt.clientX - containerRect.left;
      const relY = evt.clientY - containerRect.top;
      const tipW = 300, tipH = 140;
      const left = relX + 16 + tipW > containerRect.width ? relX - tipW - 8 : relX + 16;
      const top  = Math.min(relY - 10, containerRect.height - tipH - 10);
      tip.html(html).style('opacity',1).style('left',`${left}px`).style('top',`${Math.max(top,8)}px`);
    }
    function hideTip() { tip.style('opacity',0); }

  }, [data, sector, accentColor]);

  return (
    <div style={{ position:'relative', overflowX:'auto', overflowY:'visible' }}>
      <svg ref={svgRef} style={{ display:'block' }} />
      <div ref={tipRef} style={{
        position:'absolute', pointerEvents:'none', opacity:0,
        background:'#080d18', border:'1px solid #1e3a5f',
        borderRadius:10, padding:'12px 16px', maxWidth:300,
        zIndex:200, fontFamily:'Inter', transition:'opacity 0.12s',
        boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
      }}>
        <style>{`
          .tl{font-size:9px;color:#6ee7f7;letter-spacing:.1em;margin-bottom:5px;font-family:'JetBrains Mono';text-transform:uppercase}
          .tt{font-size:12px;color:#f1f5f9;line-height:1.5;margin-bottom:6px;font-weight:500}
          .td{font-size:10px;color:#64748b;line-height:1.5;margin-bottom:4px}
          .th{font-size:10px;color:#fb923c}
          .ta{font-size:10px;color:#34d399;margin-top:4px;line-height:1.4}
          @keyframes confglow{0%,100%{opacity:.08}50%{opacity:.7}}
          @keyframes marchdash{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}
        `}</style>
      </div>
    </div>
  );
}
