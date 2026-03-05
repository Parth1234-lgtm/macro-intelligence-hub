import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SEV = { Critical:'#ff2d55', High:'#ff6b35', Medium:'#ffd166', Low:'#06d6a0' };
const DC  = ['#2196f3','#a78bfa','#f59e0b'];

// YOUR SKETCH LAYOUT:
//
//  ●  ●              ●  ●           ●  ●
//   ↘ ↗  →  ◆  →  ■     ↘ ↗  → ◆ → ■
//  ●                   ●
//
// Everything flows on a SINGLE horizontal band.
// Events fan IN to a theme from above/below.
// Theme points right to Risk.
// Next day events fan in to next theme, etc.
// Confirmation: later event arcs back to earlier risk.

export default function KnowledgeGraph({ data, sector }) {
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { events, themes, risks, graph_edges } = data;

    const days = [...new Set(events.map(e => e.date))].sort();
    const N = days.length;

    // Canvas
    const W = Math.max(svgRef.current.parentElement.clientWidth, 1100);
    const H = 480;
    const MID = H / 2;           // center Y — everything flows around here
    const CYCLE = (W - 80) / N;  // horizontal space per day

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', W).attr('height', H);

    // defs
    const defs = svg.append('defs');
    const pat = defs.append('pattern').attr('id',`p${sector}`).attr('width',40).attr('height',40).attr('patternUnits','userSpaceOnUse');
    pat.append('path').attr('d','M40 0L0 0 0 40').attr('fill','none').attr('stroke','#0b1520').attr('stroke-width',.5);
    svg.append('rect').attr('width',W).attr('height',H).attr('fill',`url(#p${sector})`);

    const glow = (id, blur) => {
      const f = defs.append('filter').attr('id', id);
      f.append('feGaussianBlur').attr('stdDeviation', blur).attr('result','b');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in','b');
      m.append('feMergeNode').attr('in','SourceGraphic');
    };
    glow(`gE${sector}`,3); glow(`gT${sector}`,3); glow(`gR${sector}`,3);
    glow(`gC${sector}`,6); glow(`gH${sector}`,4);

    const arrow = (id, col) => defs.append('marker').attr('id',id)
      .attr('viewBox','0 -4 8 8').attr('refX',16).attr('refY',0)
      .attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
      .append('path').attr('d','M0,-4L8,0L0,4').attr('fill',col);
    arrow(`aT${sector}`,'#1e3a5f');
    arrow(`aI${sector}`,'#ff6b35');
    arrow(`aC${sector}`,'#00ff88');

    // date axis
    svg.append('line').attr('x1',40).attr('y1',H-25).attr('x2',W-40).attr('y2',H-25).attr('stroke','#0d1f38').attr('stroke-width',1);

    // ── Position nodes ────────────────────────────────────────────────────
    // Per day cycle layout (within CYCLE width):
    //   Events:  leftmost ~30% of cycle, spread vertically around MID
    //   Theme:   ~50% of cycle, at MID
    //   Risk:    ~75% of cycle, at MID
    const nm = {};

    days.forEach((date, di) => {
      const cycleStart = 40 + di * CYCLE;
      const dc = DC[di];

      // Events for this day — spread vertically
      const evts = events.filter(e => e.date === date);
      const eX = cycleStart + CYCLE * 0.15;
      const eSpread = Math.min(evts.length * 55, 280);
      evts.forEach((e, i) => {
        const yOffset = -eSpread/2 + (eSpread / Math.max(evts.length-1,1)) * i;
        const y = evts.length === 1 ? MID : MID + yOffset;
        nm[e.id] = { ...e, type:'event', x: eX, y, di, dc };
      });

      // Themes — center of cycle, stacked vertically if multiple
      const thms = themes.filter(t => Number(t.day||1) === di+1);
      const tX = cycleStart + CYCLE * 0.5;
      const tSpread = Math.min(thms.length * 70, 200);
      thms.forEach((t, i) => {
        const yOffset = -tSpread/2 + (tSpread / Math.max(thms.length-1,1)) * i;
        const y = thms.length === 1 ? MID : MID + yOffset;
        nm[t.id] = { ...t, type:'theme', x: tX, y, di, dc };
      });

      // Risks — right side of cycle
      const rsks = risks.filter(r => Number(r.day||1) === di+1);
      const rX = cycleStart + CYCLE * 0.78;
      const rSpread = Math.min(rsks.length * 70, 200);
      rsks.forEach((r, i) => {
        const yOffset = -rSpread/2 + (rSpread / Math.max(rsks.length-1,1)) * i;
        const y = rsks.length === 1 ? MID : MID + yOffset;
        nm[r.id] = { ...r, type:'risk', x: rX, y, di, dc };
      });

      // date label
      svg.append('text').attr('x', cycleStart + CYCLE/2).attr('y', H-8)
        .attr('text-anchor','middle').attr('font-family','Space Mono')
        .attr('font-size',8).attr('fill',`${dc}80`).attr('letter-spacing',2)
        .text(date);
    });

    // ── Edges ─────────────────────────────────────────────────────────────
    const eg = svg.append('g');
    graph_edges.forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s || !t) return;
      const isC = edge.type === 'confirms';
      const isI = edge.type === 'implies';

      // straight line with slight curve
      const cp1x = s.x + (t.x - s.x) * 0.4;
      const cp2x = s.x + (t.x - s.x) * 0.6;
      const pathD = isC
        ? `M${s.x},${s.y} C${s.x},${H-40} ${t.x},${H-40} ${t.x},${t.y}`
        : `M${s.x},${s.y} C${cp1x},${s.y} ${cp2x},${t.y} ${t.x},${t.y}`;

      if (isC) {
        eg.append('path').attr('d',pathD).attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',7).attr('opacity',.07).style('animation','cpulse 1.5s ease-in-out infinite');
        eg.append('path').attr('d',pathD).attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',1.5).attr('stroke-dasharray','8 4').attr('marker-end',`url(#aC${sector})`).style('animation','cdash 1s linear infinite,cpulse 1.5s ease-in-out infinite');
      } else if (isI) {
        eg.append('path').attr('d',pathD).attr('fill','none').attr('stroke','#ff6b3570').attr('stroke-width',1).attr('stroke-dasharray','5 3').attr('marker-end',`url(#aI${sector})`);
      } else {
        eg.append('path').attr('d',pathD).attr('fill','none').attr('stroke','#2196f340').attr('stroke-width',1).attr('marker-end',`url(#aT${sector})`);
      }
    });

    // ── Event circles ─────────────────────────────────────────────────────
    const eG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='event'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', show).on('mouseout', hide);

    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',18)
      .attr('fill','#07111e').attr('stroke',d=>d.dc).attr('stroke-width',1.5)
      .attr('filter',d=>`url(#gE${sector})`);
    eG.append('text').attr('x',d=>d.x).attr('y',d=>d.y).attr('dy','0.35em')
      .attr('text-anchor','middle').attr('font-family','Space Mono')
      .attr('font-size',7).attr('fill',d=>d.dc)
      .text(d=>`E${d.id.replace(/\D/g,'').slice(-2)}`);
    eG.append('text').attr('x',d=>d.x+24).attr('y',d=>d.y)
      .attr('dominant-baseline','middle').attr('font-family','Space Mono')
      .attr('font-size',6.5).attr('fill','#243448')
      .text(d=>d.headline.slice(0,22)+'…');

    // ── Theme diamonds ────────────────────────────────────────────────────
    const tG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='theme'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', show).on('mouseout', hide);

    tG.append('polygon')
      .attr('points', d => { const s=26; return `${d.x},${d.y-s} ${d.x+s},${d.y} ${d.x},${d.y+s} ${d.x-s},${d.y}`; })
      .attr('fill',d=>d.is_hot?'#1e0c00':'#07141e')
      .attr('stroke',d=>d.is_hot?'#ff6b35':d.dc)
      .attr('stroke-width',d=>d.is_hot?2.5:1.5)
      .attr('filter',d=>`url(#${d.is_hot?'gH':'gT'}${sector})`);
    tG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+38)
      .attr('text-anchor','middle').attr('font-family','Space Mono')
      .attr('font-size',8).attr('fill',d=>d.is_hot?'#ff6b35':d.dc)
      .text(d=>(d.is_hot?'🔥 ':'')+d.name?.slice(0,14));
    // heat bar
    tG.append('rect').attr('x',d=>d.x-24).attr('y',d=>d.y+48).attr('width',48).attr('height',2).attr('rx',1).attr('fill','#0d1829');
    tG.append('rect').attr('x',d=>d.x-24).attr('y',d=>d.y+48).attr('width',d=>48*(d.heat||0)).attr('height',2).attr('rx',1).attr('fill',d=>d.is_hot?'#ff6b35':'#00e5ff');

    // ── Risk rects ────────────────────────────────────────────────────────
    const rG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='risk'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover', show).on('mouseout', hide);

    rG.append('rect').attr('x',d=>d.x-44).attr('y',d=>d.y-24).attr('width',88).attr('height',48).attr('rx',4)
      .attr('fill',d=>d.confirmed?'#001a0d':({Critical:'#2a0808',High:'#1c0d00',Medium:'#181300',Low:'#001410'})[d.severity]||'#180808')
      .attr('stroke',d=>d.confirmed?'#00ff88':(SEV[d.severity]||'#ff2d55'))
      .attr('stroke-width',d=>d.confirmed?2.5:1.5)
      .attr('filter',d=>`url(#${d.confirmed?'gC':'gR'}${sector})`);
    rG.filter(d=>d.confirmed).append('text').attr('x',d=>d.x+36).attr('y',d=>d.y-18).attr('font-size',10).text('✅');
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y-7).attr('text-anchor','middle').attr('font-family','Space Mono').attr('font-size',7.5).attr('fill',d=>d.confirmed?'#00ff88':'#fca5a5').text(d=>d.name?.slice(0,14));
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+6).attr('text-anchor','middle').attr('font-family','Space Mono').attr('font-size',7).attr('fill',d=>d.confirmed?'#00cc6680':(SEV[d.severity]||'#ff2d55')).text(d=>`[${d.severity}] ${Math.round((d.probability||.5)*100)}%`);
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+18).attr('text-anchor','middle').attr('font-family','Space Mono').attr('font-size',6).attr('fill',d=>d.confirmed?'#00ff8855':'#2a3a4a').text(d=>d.confirmed?'CONFIRMED':(d.time_horizon?.split('(')[0]||''));

    // ── Tooltip ───────────────────────────────────────────────────────────
    function show(evt, d) {
      let h = '';
      if (d.type==='event') h=`<div class="tl">EVENT · ${d.source} · ${d.date}</div><div class="tt">${d.headline}</div>`;
      else if (d.type==='theme') h=`<div class="tl">THEME · ${d.category}${d.is_hot?' 🔥':''}</div><div class="tt">${d.name}</div><div class="td">${d.description}</div><div class="th">HEAT ${Math.round((d.heat||0)*100)}%</div>`;
      else h=`<div class="tl">RISK · ${d.severity}${d.confirmed?' · ✅':''}</div><div class="tt">${d.name}</div><div class="td">${d.description}</div><div class="ta">→ ${d.action}</div>`;
      d3.select(tipRef.current).html(h).style('opacity',1).style('left',`${evt.offsetX+16}px`).style('top', `${Math.min(evt.offsetY - 10, H - 160)}px`);
    }
    function hide() { d3.select(tipRef.current).style('opacity',0); }

  }, [data, sector]);

  return (
    <div style={{position:'relative', overflowX:'auto'}}>
      <svg ref={svgRef} style={{display:'block'}}/>
      <div ref={tipRef} style={{position:'absolute',pointerEvents:'none',opacity:0,background:'#060d1a',border:'1px solid #1e3a5f',padding:'10px 14px',maxWidth:300,zIndex:100,fontFamily:'Space Mono',transition:'opacity .12s'}}>
        <style>{`
          .tl{font-size:8px;color:#3b82f6;letter-spacing:2px;margin-bottom:4px}
          .tt{font-size:11px;color:#e2e8f0;line-height:1.5;margin-bottom:4px}
          .td{font-size:9px;color:#64748b;line-height:1.4;margin-bottom:3px}
          .th{font-size:9px;color:#f59e0b}
          .ta{font-size:9px;color:#34d399;margin-top:3px;line-height:1.4}
          @keyframes cpulse{0%,100%{opacity:.08}50%{opacity:.6}}
          @keyframes cdash{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}
        `}</style>
      </div>
    </div>
  );
}
