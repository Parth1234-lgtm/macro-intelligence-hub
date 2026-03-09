import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// ── Vintage Palette ──────────────────────────────────────────────
const P = {
  parchment:  '#F5EFE4',
  papyrus:    '#EDE3D0',
  leaf:       '#C29666',   // withered leaves
  copper:     '#B76635',   // copper
  nutty:      '#583924',   // nutty brown
  deer:       '#532D1C',   // brown deer
  chestnut:   '#68261F',   // golden chestnut
  warmWhite:  '#FBF7F1',
  confirmed:  '#4A7C59',
  ink:        '#2E1A0E',
};

const SEV = {
  Critical: P.chestnut,
  High:     P.copper,
  Medium:   '#8B6914',
  Low:      P.confirmed,
};

const DAY_PAL = [P.copper, P.nutty, P.chestnut];

export default function KnowledgeGraph({ data, sector, country, isSimulation }) {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const tipRef       = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const { events = [], themes = [], risks = [], graph_edges = [] } = data;

    const days   = [...new Set(events.map(e => e.date))].sort();
    const N      = Math.max(days.length, 1);
    const W      = Math.max(containerRef.current.clientWidth || 1100, 1100);
    const TOP_PAD = 80;
    const BOT_PAD = 50;
    const GRAPH_H = 420;
    const H      = TOP_PAD + GRAPH_H + BOT_PAD;
    const MID    = TOP_PAD + GRAPH_H / 2;
    const CYCLE  = (W - 80) / N;
    const ARC_Y  = 22;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', W).attr('height', H)
      .style('overflow', 'visible');

    // ── Background ────────────────────────────────────────────────
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', P.parchment);

    const defs = svg.append('defs');

    // Aged paper texture — fine dot grid
    const dp = defs.append('pattern')
      .attr('id', `dp${sector}${country}`)
      .attr('width', 24).attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');
    dp.append('circle').attr('cx', 12).attr('cy', 12).attr('r', 0.8).attr('fill', `${P.leaf}60`);
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#dp${sector}${country})`);

    // Subtle top-to-bottom vignette for aged feel
    const vg = defs.append('linearGradient').attr('id', `vg${sector}${country}`).attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',1);
    vg.append('stop').attr('offset','0%').attr('stop-color', P.nutty).attr('stop-opacity', 0.06);
    vg.append('stop').attr('offset','100%').attr('stop-color', P.deer).attr('stop-opacity', 0.09);
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', `url(#vg${sector}${country})`);

    // ── Glow / shadow filters ─────────────────────────────────────
    const mkGlow = (id, color, blur, opacity = 0.30) => {
      const f = defs.append('filter').attr('id', id)
        .attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%');
      f.append('feGaussianBlur').attr('stdDeviation', blur).attr('result', 'b');
      f.append('feFlood').attr('flood-color', color).attr('flood-opacity', opacity).attr('result', 'c');
      f.append('feComposite').attr('in', 'c').attr('in2', 'b').attr('operator', 'in').attr('result', 'd');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in', 'd');
      m.append('feMergeNode').attr('in', 'SourceGraphic');
    };
    DAY_PAL.forEach((c, i) => mkGlow(`gD${i}${sector}${country}`, c, 5, 0.22));
    mkGlow(`gC${sector}${country}`,  P.confirmed, 10, 0.35);
    mkGlow(`gR${sector}${country}`,  P.chestnut,  4,  0.25);
    mkGlow(`gH${sector}${country}`,  P.copper,    6,  0.28);

    // ── Arrow markers ─────────────────────────────────────────────
    const mkArrow = (id, color, size = 5) => {
      defs.append('marker').attr('id', id)
        .attr('viewBox', '0 -4 10 8').attr('refX', 20).attr('refY', 0)
        .attr('markerWidth', size).attr('markerHeight', size).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', color);
    };
    mkArrow(`aT${sector}${country}`, `${P.leaf}90`, 4);
    mkArrow(`aI${sector}${country}`, `${P.copper}70`, 4);

    // Confirm arc arrowhead
    const ca = defs.append('marker').attr('id', `aC${sector}${country}`)
      .attr('viewBox', '0 -6 14 12').attr('refX', 8).attr('refY', 0)
      .attr('markerWidth', 12).attr('markerHeight', 12).attr('orient', 'auto');
    ca.append('path').attr('d', 'M0,-5L12,0L0,5Z').attr('fill', P.confirmed).attr('opacity', 0.5).attr('filter', `url(#gC${sector}${country})`);
    ca.append('path').attr('d', 'M0,-5L12,0L0,5Z').attr('fill', P.confirmed);

    // ── Node positions ────────────────────────────────────────────
    const nm = {};
    days.forEach((date, di) => {
      const cs  = 40 + di * CYCLE;
      const col = DAY_PAL[di % DAY_PAL.length];

      const evts = events.filter(e => e.date === date);
      const eX   = cs + CYCLE * 0.13;
      const eR   = Math.min(evts.length * 56, 280);
      evts.forEach((e, i) => {
        const y = evts.length === 1 ? MID : MID - eR / 2 + (eR / (evts.length - 1)) * i;
        nm[e.id] = { ...e, type: 'event', x: eX, y, di, col };
      });

      const thms = themes.filter(t => Number(t.day || 1) === di + 1);
      const tX   = cs + CYCLE * 0.50;
      const tR   = Math.min(thms.length * 72, 200);
      thms.forEach((t, i) => {
        const y = thms.length === 1 ? MID : MID - tR / 2 + (tR / (thms.length - 1)) * i;
        nm[t.id] = { ...t, type: 'theme', x: tX, y, di, col };
      });

      const rsks = risks.filter(r => Number(r.day || 1) === di + 1);
      const rX   = cs + CYCLE * 0.80;
      const rR   = Math.min(rsks.length * 72, 200);
      rsks.forEach((r, i) => {
        const y = rsks.length === 1 ? MID : MID - rR / 2 + (rR / (rsks.length - 1)) * i;
        nm[r.id] = { ...r, type: 'risk', x: rX, y, di, col };
      });

      // Date chip
      svg.append('rect').attr('x', cs + CYCLE / 2 - 40).attr('y', H - 29)
        .attr('width', 80).attr('height', 18).attr('rx', 9)
        .attr('fill', P.papyrus).attr('stroke', `${P.leaf}80`);
      svg.append('text').attr('x', cs + CYCLE / 2).attr('y', H - 16)
        .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace")
        .attr('font-size', 8).attr('fill', `${col}CC`).attr('letter-spacing', 1)
        .text(date);
    });

    // ── Regular edges ─────────────────────────────────────────────
    const edgeG = svg.append('g');
    graph_edges.filter(e => e.type !== 'confirms').forEach(edge => {
      const s = nm[edge.from], t = nm[edge.to];
      if (!s || !t) return;
      const isI  = edge.type === 'implies';
      const cp1x = s.x + (t.x - s.x) * 0.4;
      const cp2x = s.x + (t.x - s.x) * 0.6;
      edgeG.append('path')
        .attr('d', `M${s.x},${s.y} C${cp1x},${s.y} ${cp2x},${t.y} ${t.x},${t.y}`)
        .attr('fill', 'none')
        .attr('stroke', isI ? `${P.copper}50` : `${P.leaf}70`)
        .attr('stroke-width', isI ? 1.2 : 1)
        .attr('stroke-dasharray', isI ? '5 3' : 'none')
        .attr('marker-end', `url(#${isI ? 'aI' : 'aT'}${sector}${country})`);
    });

    // ── Confirmation arcs ─────────────────────────────────────────
    const confirmG = svg.append('g');

    const drawConfirmArc = (riskNode, eventNode, arcIndex = 0) => {
      if (!riskNode.confirmed) return;
      if (eventNode.x <= riskNode.x) return;

      const startX = riskNode.x;
      const startY = riskNode.y - 29;
      const endX   = eventNode.x;
      const endY   = eventNode.y - 17;
      const arcY   = ARC_Y + arcIndex * 22;
      const pathD  = `M${startX},${startY} C${startX},${arcY} ${endX},${arcY} ${endX},${endY}`;

      // Glow halo
      confirmG.append('path').attr('d', pathD)
        .attr('fill', 'none').attr('stroke', P.confirmed).attr('stroke-width', 7)
        .attr('opacity', 0.07);

      // Main dashed arc
      confirmG.append('path').attr('d', pathD)
        .attr('fill', 'none').attr('stroke', P.confirmed).attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '6 4').attr('opacity', 0.85)
        .style('animation', 'march 1.5s linear infinite');

      // Arrow tip
      confirmG.append('path')
        .attr('d', `M${endX - 5},${endY - 9} L${endX},${endY} L${endX + 5},${endY - 9}`)
        .attr('fill', 'none').attr('stroke', P.confirmed).attr('stroke-width', 1.8)
        .attr('marker-end', `url(#aC${sector}${country})`);

      // Label pill — vintage ink style
      const lx = (startX + endX) / 2;
      const ly = arcY - 9;
      confirmG.append('rect')
        .attr('x', lx - 30).attr('y', ly - 13).attr('width', 60).attr('height', 16)
        .attr('rx', 8)
        .attr('fill', P.papyrus).attr('stroke', `${P.confirmed}80`).attr('stroke-width', 1);
      confirmG.append('text')
        .attr('x', lx).attr('y', ly - 1)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-family', "'DM Mono', monospace").attr('font-size', 7.5)
        .attr('fill', P.confirmed).attr('letter-spacing', '0.1em').attr('font-weight', 600)
        .text('CONFIRMS');
    };

    const riskNodes  = Object.values(nm).filter(n => n.type === 'risk');
    const drawnRisks = new Set();
    let arcIdx = 0;

    riskNodes.forEach(rNode => {
      if (!rNode.confirmed || drawnRisks.has(rNode.id)) return;
      let bestEvent = null, bestDist = Infinity;
      Object.values(nm).filter(n => n.type === 'event').forEach(eNode => {
        if (eNode.x <= rNode.x) return;
        const d = eNode.x - rNode.x;
        if (d < bestDist) { bestDist = d; bestEvent = eNode; }
      });
      if (bestEvent) { drawnRisks.add(rNode.id); drawConfirmArc(rNode, bestEvent, arcIdx++); }
    });

    // ── Event nodes ───────────────────────────────────────────────
    const eG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n => n.type === 'event'))
      .enter().append('g').style('cursor', 'pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    // Outer ring (faint)
    eG.append('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 22)
      .attr('fill', 'none').attr('stroke', d => d.col).attr('stroke-width', 0.6).attr('opacity', 0.3);
    // Main circle
    eG.append('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 17)
      .attr('fill', P.warmWhite).attr('stroke', d => d.col).attr('stroke-width', 1.8)
      .attr('filter', d => `url(#gD${d.di}${sector}${country})`);
    // Label
    eG.append('text').attr('x', d => d.x).attr('y', d => d.y).attr('dy', '0.35em')
      .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace")
      .attr('font-size', 8).attr('font-weight', 600).attr('fill', d => d.col)
      .text(d => `E${d.id.replace(/\D/g, '').slice(-2)}`);
    // Headline
    eG.append('text').attr('x', d => d.x + 25).attr('y', d => d.y)
      .attr('dominant-baseline', 'middle').attr('font-family', "'DM Mono', monospace")
      .attr('font-size', 10).attr('fill', `${P.nutty}AA`).attr('font-weight', 400)
      .text(d => d.headline.slice(0, 22) + '…');

    // ── Theme diamonds ────────────────────────────────────────────
    const tG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n => n.type === 'theme'))
      .enter().append('g').style('cursor', 'pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    const DS = 26;
    tG.append('polygon')
      .attr('points', d => `${d.x},${d.y - DS} ${d.x + DS},${d.y} ${d.x},${d.y + DS} ${d.x - DS},${d.y}`)
      .attr('fill',   d => d.is_hot ? '#F7EDE4' : P.warmWhite)
      .attr('stroke', d => d.is_hot ? P.copper  : `${P.leaf}CC`)
      .attr('stroke-width', d => d.is_hot ? 2 : 1.5)
      .attr('filter', d => d.is_hot
        ? `url(#gH${sector}${country})`
        : `url(#gD${d.di}${sector}${country})`);

    // Inner diamond
    tG.append('polygon')
      .attr('points', d => { const s = 9; return `${d.x},${d.y-s} ${d.x+s},${d.y} ${d.x},${d.y+s} ${d.x-s},${d.y}`; })
      .attr('fill', d => d.is_hot ? `${P.copper}50` : `${P.leaf}50`);

    // Name label
    tG.append('text').attr('x', d => d.x).attr('y', d => d.y + 40)
      .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace").attr('font-weight', 600)
      .attr('font-size', 10).attr('fill', d => d.is_hot ? P.copper : P.nutty)
      .text(d => (d.is_hot ? '🔥 ' : '') + d.name?.slice(0, 16));

    // Heat bar track
    tG.append('rect').attr('x', d => d.x - 24).attr('y', d => d.y + 53)
      .attr('width', 48).attr('height', 2.5).attr('rx', 1.25).attr('fill', `${P.leaf}30`);
    // Heat bar fill
    tG.append('rect').attr('x', d => d.x - 24).attr('y', d => d.y + 53)
      .attr('width', d => 48 * (d.heat || 0)).attr('height', 2.5).attr('rx', 1.25)
      .attr('fill', d => d.is_hot ? P.copper : P.leaf);

    // ── Risk rectangles ───────────────────────────────────────────
    const rG = svg.append('g').selectAll('g')
      .data(Object.values(nm).filter(n => n.type === 'risk'))
      .enter().append('g').style('cursor', 'pointer')
      .on('mouseover', showTip).on('mouseout', hideTip);

    const RW = 108, RH = 58;

    const riskFill = d => {
      if (d.confirmed)           return '#EEF5F0';
      if (isSimulation)          return '#F3EDF8';
      return ({ Critical: '#F5E8E6', High: '#F7EDE4', Medium: '#F5EDD8', Low: '#EAF0EA' })[d.severity] || P.warmWhite;
    };
    const riskStroke = d => {
      if (d.confirmed)  return P.confirmed;
      if (isSimulation) return '#7C5C8A';
      return SEV[d.severity] || P.chestnut;
    };

    rG.append('rect')
      .attr('x', d => d.x - RW / 2).attr('y', d => d.y - RH / 2)
      .attr('width', RW).attr('height', RH).attr('rx', 10)
      .attr('fill',   riskFill)
      .attr('stroke', riskStroke)
      .attr('stroke-width', d => d.confirmed ? 2 : 1.5)
      .attr('filter', d => `url(#${d.confirmed ? 'gC' : 'gR'}${sector}${country})`);

    // Confirmed badge
    rG.filter(d => d.confirmed).append('circle')
      .attr('cx', d => d.x + RW / 2 - 13).attr('cy', d => d.y - RH / 2 + 13)
      .attr('r', 8).attr('fill', '#D8EDE0').attr('stroke', `${P.confirmed}80`);
    rG.filter(d => d.confirmed).append('text')
      .attr('x', d => d.x + RW / 2 - 13).attr('y', d => d.y - RH / 2 + 17)
      .attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', P.confirmed).text('✓');

    // Simulated badge
    if (isSimulation) {
      rG.append('circle')
        .attr('cx', d => d.x + RW / 2 - 13).attr('cy', d => d.y - RH / 2 + 13)
        .attr('r', 8).attr('fill', '#EDE8F5').attr('stroke', '#7C5C8A80');
      rG.append('text')
        .attr('x', d => d.x + RW / 2 - 13).attr('y', d => d.y - RH / 2 + 17)
        .attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#7C5C8A').text('⚗');
    }

    // Risk name
    rG.append('text').attr('x', d => d.x).attr('y', d => d.y - 9)
      .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace").attr('font-weight', 700)
      .attr('font-size', 10)
      .attr('fill', d => d.confirmed ? P.confirmed : (isSimulation ? '#6B4A82' : (SEV[d.severity] || P.chestnut)))
      .text(d => d.name?.slice(0, 15));

    // Severity + probability
    rG.append('text').attr('x', d => d.x).attr('y', d => d.y + 7)
      .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace").attr('font-size', 8.5)
      .attr('fill', d => `${d.confirmed ? P.confirmed : (SEV[d.severity] || P.chestnut)}99`)
      .text(d => `${d.severity} · ${Math.round((d.probability || 0.5) * 100)}%`);

    // Footer text
    rG.append('text').attr('x', d => d.x).attr('y', d => d.y + 21)
      .attr('text-anchor', 'middle').attr('font-family', "'DM Mono', monospace").attr('font-size', 7.5)
      .attr('fill', d => d.confirmed ? `${P.confirmed}70` : `${P.leaf}80`)
      .text(d => d.confirmed ? '✓ CONFIRMED' : (d.time_horizon?.split('(')[0]?.trim() || ''));

    // ── Tooltip ───────────────────────────────────────────────────
    const tip = d3.select(tipRef.current);

    function showTip(evt, d) {
      let h = '';
      if (d.type === 'event')
        h = `<div class="tl">${d.source} · ${d.date}</div><div class="tt">${d.headline}</div>`;
      else if (d.type === 'theme')
        h = `<div class="tl">THEME · ${d.category}${d.is_hot ? ' 🔥' : ''}</div><div class="tt">${d.name}</div><div class="td">${d.description || ''}</div><div class="th">Heat: ${Math.round((d.heat || 0) * 100)}%</div>`;
      else
        h = `<div class="tl">RISK · ${d.severity}${d.confirmed ? ' · ✓ CONFIRMED' : ''}</div><div class="tt">${d.name}</div><div class="td">${d.description || ''}</div><div class="ta">→ ${d.action || ''}</div>`;

      const cr   = containerRef.current.getBoundingClientRect();
      const rx   = evt.clientX - cr.left;
      const ry   = evt.clientY - cr.top;
      const left = rx + 16 + 300 > cr.width ? rx - 316 : rx + 16;
      const top  = Math.max(8, Math.min(ry - 10, cr.height - 160));
      tip.html(h).style('opacity', 1).style('left', `${left}px`).style('top', `${top}px`);
    }
    function hideTip() { tip.style('opacity', 0); }

  }, [data, sector, country, isSimulation]);

  return (
    <div ref={containerRef} style={{ position: 'relative', overflowX: 'auto', overflowY: 'visible' }}>
      <svg ref={svgRef} style={{ display: 'block', overflow: 'visible' }} />
      <div ref={tipRef} style={{
        position: 'absolute', pointerEvents: 'none', opacity: 0,
        background: '#FBF7F1',
        border: `1px solid ${P.leaf}80`,
        borderRadius: 12,
        padding: '14px 18px', maxWidth: 300, zIndex: 200,
        fontFamily: "'Lora', serif",
        transition: 'opacity .12s',
        boxShadow: `0 8px 32px ${P.deer}22`,
      }}>
        <style>{`
          .tl { font-size:9px; color:${P.leaf}; letter-spacing:.14em; margin-bottom:6px; font-family:'DM Mono',monospace; text-transform:uppercase }
          .tt { font-size:13px; color:${P.deer}; line-height:1.5; margin-bottom:6px; font-weight:600; font-family:'Playfair Display',serif }
          .td { font-size:11px; color:${P.nutty}; line-height:1.6; margin-bottom:4px }
          .th { font-size:10px; color:${P.copper} }
          .ta { font-size:10px; color:${P.confirmed}; margin-top:4px; line-height:1.4 }
          @keyframes march { from { stroke-dashoffset:32 } to { stroke-dashoffset:0 } }
        `}</style>
      </div>
    </div>
  );
}
