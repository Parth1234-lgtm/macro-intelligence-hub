import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SEV = { Critical:'#f43f5e', High:'#fb923c', Medium:'#facc15', Low:'#34d399' };
const DAY_PAL = ['#6ee7f7','#a78bfa','#f59e0b'];

export default function KnowledgeGraph({ data, sector }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { events, themes, risks, graph_edges } = data;

    const days  = [...new Set(events.map(e => e.date))].sort();
    const N     = days.length;
    const W     = Math.max(containerRef.current.clientWidth || 1100, 1100);
    // Extra top padding so arcs have room
    const TOP_PAD = 80;
    const BOT_PAD = 50;
    const GRAPH_H = 420;
    const H = TOP_PAD + GRAPH_H + BOT_PAD;
    const MID = TOP_PAD + GRAPH_H / 2;
    const CYCLE = (W - 80) / N;
    const ARC_Y = 24; // arc peaks here (absolute Y in SVG)

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current)
      .attr('width', W).attr('height', H)
      .style('overflow', 'visible');

    // Background
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','#0d0d0d');

    // Dot grid
    const defs = svg.append('defs');
    const dp = defs.append('pattern').attr('id',`dp${sector}`)
      .attr('width',28).attr('height',28).attr('patternUnits','userSpaceOnUse');
    dp.append('circle').attr('cx',14).attr('cy',14).attr('r',.7).attr('fill','#181818');
    svg.append('rect').attr('width',W).attr('height',H).attr('fill',`url(#dp${sector})`);

    // Glow filters
    const mkGlow = (id, color, blur) => {
      const f = defs.append('filter').attr('id',id)
        .attr('x','-80%').attr('y','-80%').attr('width','260%').attr('height','260%');
      f.append('feGaussianBlur').attr('stdDeviation',blur).attr('result','b');
      f.append('feFlood').attr('flood-color',color).attr('flood-opacity',.6).attr('result','c');
      f.append('feComposite').attr('in','c').attr('in2','b').attr('operator','in').attr('result','d');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in','d');
      m.append('feMergeNode').attr('in','SourceGraphic');
    };
    DAY_PAL.forEach((c,i) => mkGlow(`gD${i}${sector}`, c, 8));
    mkGlow(`gC${sector}`, '#00ff88', 16);
    mkGlow(`gR${sector}`, '#f43f5e', 6);
    mkGlow(`gH${sector}`, '#fb923c', 9);

    // Arrow markers
    const mkArrow = (id, color, size=5) => {
      defs.append('marker').attr('id',id)
        .attr('viewBox','0 -4 10 8').attr('refX',20).attr('refY',0)
        .attr('markerWidth',size).attr('markerHeight',size).attr('orient','auto')
        .append('path').attr('d','M0,-4L10,0L0,4').attr('fill',color);
    };
    mkArrow(`aT${sector}`,'#252525',4);
    mkArrow(`aI${sector}`,'#fb923c50',4);
    mkArrow(`aC${sector}`,'#00ff88',7);

    // ── Node positions ────────────────────────────────────────────────────
    const nm = {};
    days.forEach((date, di) => {
      const cs  = 40 + di * CYCLE;
      const col = DAY_PAL[di];

      const evts = events.filter(e => e.date === date);
      const eX   = cs + CYCLE * 0.13;
      const eR   = Math.min(evts.length * 56, 280);
      evts.forEach((e, i) => {
        const y = evts.length===1 ? MID : MID - eR/2 + (eR/(evts.length-1))*i;
        nm[e.id] = { ...e, type:'event', x:eX, y, di, col };
      });

      const thms = themes.filter(t => Number(t.day||1)===di+1);
      const tX   = cs + CYCLE * 0.50;
      const tR   = Math.min(thms.length * 72, 200);
      thms.forEach((t, i) => {
        const y = thms.length===1 ? MID : MID - tR/2 + (tR/(thms.length-1))*i;
        nm[t.id] = { ...t, type:'theme', x:tX, y, di, col };
      });

      const rsks = risks.filter(r => Number(r.day||1)===di+1);
      const rX   = cs + CYCLE * 0.80;
      const rR   = Math.min(rsks.length * 72, 200);
      rsks.forEach((r, i) => {
        const y = rsks.length===1 ? MID : MID - rR/2 + (rR/(rsks.length-1))*i;
        nm[r.id] = { ...r, type:'risk', x:rX, y, di, col };
      });

      // date chip
      svg.append('rect').attr('x',cs+CYCLE/2-38).attr('y',H-28)
        .attr('width',76).attr('height',18).attr('rx',9)
        .attr('fill','#111').attr('stroke','#222');
      svg.append('text').attr('x',cs+CYCLE/2).attr('y',H-15)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size',8).attr('fill',`${col}70`).attr('letter-spacing',1)
        .text(date);
    });

    // ── Regular edges ─────────────────────────────────────────────────────
    const edgeG = svg.append('g');
    graph_edges.filter(e=>e.type!=='confirms').forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s||!t) return;
      const isI = edge.type==='implies';
      const cp1x = s.x+(t.x-s.x)*.4, cp2x = s.x+(t.x-s.x)*.6;
      edgeG.append('path')
        .attr('d',`M${s.x},${s.y} C${cp1x},${s.y} ${cp2x},${t.y} ${t.x},${t.y}`)
        .attr('fill','none')
        .attr('stroke', isI ? '#fb923c35' : '#222')
        .attr('stroke-width', isI ? 1.2 : 1)
        .attr('stroke-dasharray', isI ? '5 3' : 'none')
        .attr('marker-end',`url(#${isI?'aI':'aT'}${sector})`);
    });

    // ── CONFIRMATION ARCS — glowing green above the graph ─────────────────
    const confirmG = svg.append('g');
    graph_edges.filter(e=>e.type==='confirms').forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s||!t) return;

      // Cubic bezier arcing UP above the graph
      const pathD = `M${s.x},${s.y} C${s.x},${ARC_Y} ${t.x},${ARC_Y} ${t.x},${t.y}`;

      // Layer 1: big soft outer glow
      confirmG.append('path').attr('d',pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',20)
        .attr('opacity',.04)
        .style('animation','cg 2.5s ease-in-out infinite');

      // Layer 2: medium glow
      confirmG.append('path').attr('d',pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',7)
        .attr('opacity',.1)
        .style('animation','cg 2.5s ease-in-out infinite .2s');

      // Layer 3: core line
      confirmG.append('path').attr('d',pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',2)
        .attr('opacity',.4)
        .style('animation','cg 2.5s ease-in-out infinite .4s');

      // Layer 4: marching dashes on top
      confirmG.append('path').attr('d',pathD)
        .attr('fill','none').attr('stroke','#00ff88').attr('stroke-width',2)
        .attr('stroke-dasharray','10 6')
        .attr('marker-end',`url(#aC${sector})`)
        .style('animation','cg 2.5s ease-in-out infinite, march 1s linear infinite');

      // CONFIRMS pill at apex
      const midX = (s.x+t.x)/2;
      confirmG.append('rect')
        .attr('x',midX-34).attr('y',ARC_Y-11)
        .attr('width',68).attr('height',19).attr('rx',9.5)
        .attr('fill','#0a120a').attr('stroke','#00ff8860').attr('stroke-width',1);
      confirmG.append('text')
        .attr('x',midX).attr('y',ARC_Y+3)
        .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
        .attr('font-size',8).attr('fill','#00ff88').attr('letter-spacing',2)
        .text('CONFIRMS');
    });

    // ── Event nodes ───────────────────────────────────────────────────────
    const eG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='event'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover',showTip).on('mouseout',hideTip);

    // outer ring
    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',23)
      .attr('fill','none').attr('stroke',d=>d.col).attr('stroke-width',.5).attr('opacity',.25);
    // main
    eG.append('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',17)
      .attr('fill','#111').attr('stroke',d=>d.col).attr('stroke-width',1.5)
      .attr('filter',d=>`url(#gD${d.di}${sector})`);
    // label inside
    eG.append('text').attr('x',d=>d.x).attr('y',d=>d.y).attr('dy','0.35em')
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8).attr('font-weight',500).attr('fill',d=>d.col)
      .text(d=>`E${d.id.replace(/\D/g,'').slice(-2)}`);
    // headline beside node
    eG.append('text').attr('x',d=>d.x+26).attr('y',d=>d.y-1)
      .attr('dominant-baseline','middle').attr('font-family','Inter')
      .attr('font-size',10).attr('fill','#555').attr('font-weight',400)
      .text(d=>d.headline.slice(0,22)+'…');

    // ── Theme diamonds ────────────────────────────────────────────────────
    const tG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='theme'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover',showTip).on('mouseout',hideTip);

    const DS = 28;
    tG.append('polygon')
      .attr('points', d=>`${d.x},${d.y-DS} ${d.x+DS},${d.y} ${d.x},${d.y+DS} ${d.x-DS},${d.y}`)
      .attr('fill', d=>d.is_hot?'#140c00':'#111')
      .attr('stroke', d=>d.is_hot?'#fb923c':d.col)
      .attr('stroke-width', d=>d.is_hot?2:1.5)
      .attr('filter', d=>d.is_hot?`url(#gH${sector})`:`url(#gD${d.di}${sector})`);

    // diamond inner icon
    tG.append('polygon')
      .attr('points', d=>{ const s=10; return `${d.x},${d.y-s} ${d.x+s},${d.y} ${d.x},${d.y+s} ${d.x-s},${d.y}`; })
      .attr('fill', d=>d.is_hot?'#fb923c50':d.col+'40');

    tG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+42)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',600)
      .attr('font-size',10).attr('fill',d=>d.is_hot?'#fb923c':d.col)
      .text(d=>(d.is_hot?'🔥 ':'')+d.name?.slice(0,16));

    // heat bar
    tG.append('rect').attr('x',d=>d.x-26).attr('y',d=>d.y+55).attr('width',52).attr('height',2.5).attr('rx',1.25).attr('fill','#1a1a1a');
    tG.append('rect').attr('x',d=>d.x-26).attr('y',d=>d.y+55)
      .attr('width',d=>52*(d.heat||0)).attr('height',2.5).attr('rx',1.25)
      .attr('fill',d=>d.is_hot?'#fb923c':d.col);

    // ── Risk rects ────────────────────────────────────────────────────────
    const rG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n=>n.type==='risk'))
      .enter().append('g').style('cursor','pointer')
      .on('mouseover',showTip).on('mouseout',hideTip);

    const RW=106, RH=58;
    rG.append('rect')
      .attr('x',d=>d.x-RW/2).attr('y',d=>d.y-RH/2)
      .attr('width',RW).attr('height',RH).attr('rx',10)
      .attr('fill',d=>d.confirmed?'#061009':({Critical:'#1a0510',High:'#150900',Medium:'#131000',Low:'#041009'})[d.severity]||'#111')
      .attr('stroke',d=>d.confirmed?'#00ff88':(SEV[d.severity]||'#f43f5e'))
      .attr('stroke-width',d=>d.confirmed?2:1.5)
      .attr('filter',d=>`url(#${d.confirmed?'gC':'gR'}${sector})`);

    // confirmed check badge
    rG.filter(d=>d.confirmed).append('circle')
      .attr('cx',d=>d.x+RW/2-12).attr('cy',d=>d.y-RH/2+12)
      .attr('r',8).attr('fill','#0a1f0a').attr('stroke','#00ff8870');
    rG.filter(d=>d.confirmed).append('text')
      .attr('x',d=>d.x+RW/2-12).attr('y',d=>d.y-RH/2+16)
      .attr('text-anchor','middle').attr('font-size',9).attr('fill','#00ff88').text('✓');

    // risk name — bold and readable
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y-9)
      .attr('text-anchor','middle').attr('font-family','Inter').attr('font-weight',700)
      .attr('font-size',10).attr('fill',d=>d.confirmed?'#00ff88':(SEV[d.severity]||'#f43f5e'))
      .text(d=>d.name?.slice(0,15));

    // severity + probability
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+7)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',8.5)
      .attr('fill',d=>d.confirmed?'#00ff8870':`${SEV[d.severity]||'#f43f5e'}90`)
      .text(d=>`${d.severity} · ${Math.round((d.probability||.5)*100)}%`);

    // confirmed / time horizon
    rG.append('text').attr('x',d=>d.x).attr('y',d=>d.y+21)
      .attr('text-anchor','middle').attr('font-family','JetBrains Mono')
      .attr('font-size',7.5).attr('fill',d=>d.confirmed?'#00ff8850':'#333')
      .text(d=>d.confirmed?'✓ CONFIRMED':(d.time_horizon?.split('(')[0]?.trim()||''));

    // ── Tooltip ───────────────────────────────────────────────────────────
    const tip = d3.select(tipRef.current);
    function showTip(evt, d) {
      let h='';
      if (d.type==='event')
        h=`<div class="tl">${d.source} · ${d.date}</div><div class="tt">${d.headline}</div>`;
      else if (d.type==='theme')
        h=`<div class="tl">THEME · ${d.category}${d.is_hot?' 🔥':''}</div><div class="tt">${d.name}</div><div class="td">${d.description||''}</div><div class="th">Heat: ${Math.round((d.heat||0)*100)}%</div>`;
      else
        h=`<div class="tl">RISK · ${d.severity}${d.confirmed?' · ✓ CONFIRMED':''}</div><div class="tt">${d.name}</div><div class="td">${d.description||''}</div><div class="ta">→ ${d.action||''}</div>`;

      const cr = containerRef.current.getBoundingClientRect();
      const rx = evt.clientX - cr.left, ry = evt.clientY - cr.top;
      const left = rx+16+300 > cr.width ? rx-316 : rx+16;
      const top  = Math.max(8, Math.min(ry-10, cr.height-160));
      tip.html(h).style('opacity',1).style('left',`${left}px`).style('top',`${top}px`);
    }
    function hideTip() { tip.style('opacity',0); }

  }, [data, sector]);

  return (
    <div ref={containerRef} style={{ position:'relative', overflowX:'auto' }}>
      <svg ref={svgRef} style={{ display:'block', overflow:'visible' }}/>
      <div ref={tipRef} style={{
        position:'absolute', pointerEvents:'none', opacity:0,
        background:'#111', border:'1px solid #222', borderRadius:12,
        padding:'14px 18px', maxWidth:300, zIndex:200, fontFamily:'Inter',
        transition:'opacity .12s', boxShadow:'0 8px 40px rgba(0,0,0,.9)',
      }}>
        <style>{`
          .tl{font-size:9px;color:#444;letter-spacing:.12em;margin-bottom:6px;font-family:'JetBrains Mono';text-transform:uppercase}
          .tt{font-size:13px;color:#e8e8e8;line-height:1.5;margin-bottom:6px;font-weight:600}
          .td{font-size:10px;color:#555;line-height:1.5;margin-bottom:4px}
          .th{font-size:10px;color:#fb923c}
          .ta{font-size:10px;color:#34d399;margin-top:4px;line-height:1.4}
          @keyframes cg{0%,100%{opacity:.06}50%{opacity:1}}
          @keyframes march{from{stroke-dashoffset:32}to{stroke-dashoffset:0}}
        `}</style>
      </div>
    </div>
  );
}
