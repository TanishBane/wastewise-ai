import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { OverviewResponse } from "../types";
import type { Navigate } from "./model";

export interface CanteenBentoDashboardProps {
  overviewData: OverviewResponse;
  navigate: Navigate;
  className?: string;
}

export default function CanteenBentoDashboard({
  overviewData,
  navigate,
  className = "",
}: CanteenBentoDashboardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"1M" | "3M" | "1Y" | "All">("1Y");
  const [unit, setUnit] = useState<"INR" | "USD">("INR");

  const kpis = overviewData.kpis;
  const items = overviewData.item_details;
  const alerts = overviewData.prioritized_alerts;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Color definitions from Image 2
    const COL = {
      forest: "#153d30",
      accent: "#e0a96d",
      white: "#ffffff",
    };

    // 1. Draw Net Demand / Preparation Stream Chart
    const nwCard = root.querySelector<HTMLElement>("#canteen-nw");
    if (nwCard) {
      const svg = nwCard.querySelector<SVGSVGElement>(".canteen-nws");
      const numHost = nwCard.querySelector<HTMLElement>(".canteen-nwn");
      const dEl = nwCard.querySelector<HTMLElement>(".canteen-nwd");
      const cEl = nwCard.querySelector<HTMLElement>(".canteen-nwc");

      if (numHost) {
        numHost.textContent = `${Math.round(kpis.recommended_prep)} portions`;
      }
      if (dEl) {
        dEl.textContent = `+${kpis.surplus_pct}% buffer`;
      }
      if (cEl) {
        cEl.textContent = `${kpis.forecast_demand} forecasted · ${kpis.potential_surplus} hedge reserve`;
      }

      if (svg) {
        const W = nwCard.clientWidth || 700;
        const Hh = 230;
        const top = 30;
        const bot = 30;
        const mid = top + (Hh - top - bot) / 2;

        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(Hh));
        svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);

        // 12 synthetic temporal historical shift points
        const points = [
          { l: "May", demand: 130, prep: 142, hedge: 148 },
          { l: "Jun", demand: 142, prep: 155, hedge: 160 },
          { l: "Jul", demand: 148, prep: 162, hedge: 165 },
          { l: "Aug", demand: 138, prep: 150, hedge: 154 },
          { l: "Sep", demand: 154, prep: 165, hedge: 172 },
          { l: "Oct", demand: 150, prep: 160, hedge: 166 },
          { l: "Nov", demand: 160, prep: 170, hedge: 175 },
          { l: "Dec", demand: 145, prep: 156, hedge: 162 },
          { l: "Jan", demand: 152, prep: 164, hedge: 170 },
          { l: "Feb", demand: 158, prep: 168, hedge: 174 },
          { l: "Mar", demand: 165, prep: 175, hedge: 180 },
          {
            l: "Today",
            demand: kpis.forecast_demand,
            prep: kpis.recommended_prep,
            hedge: Math.round(kpis.recommended_prep * 1.05),
          },
        ];

        const n = points.length;
        const X = (i: number) => -10 + (i / (n - 1)) * (W + 20);

        const smoothPath = (P: number[][], move = true) => {
          let d = (move ? "M" : "L") + `${P[0][0]},${P[0][1]}`;
          for (let i = 0; i < P.length - 1; i++) {
            const p0 = P[i - 1] || P[i];
            const p1 = P[i];
            const p2 = P[i + 1];
            const p3 = P[i + 2] || p2;
            const k = 0.18;
            d += `C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
          }
          return d;
        };

        const maxVal = 190;
        const bandH = (v: number) =>
          ((v - 110) / (maxVal - 110)) * ((Hh - top - bot) / 2);

        const topHedge = points.map((p, i) => [X(i), mid - bandH(p.hedge)]);
        const botHedge = points
          .map((p, i) => [X(i), mid + bandH(p.hedge)])
          .reverse();
        const hedgeD = smoothPath(topHedge) + smoothPath(botHedge, false) + "Z";

        const topPrep = points.map((p, i) => [X(i), mid - bandH(p.prep)]);
        const botPrep = points
          .map((p, i) => [X(i), mid + bandH(p.prep)])
          .reverse();
        const prepD = smoothPath(topPrep) + smoothPath(botPrep, false) + "Z";

        const topDem = points.map((p, i) => [X(i), mid - bandH(p.demand)]);
        const botDem = points
          .map((p, i) => [X(i), mid + bandH(p.demand)])
          .reverse();
        const demD = smoothPath(topDem) + smoothPath(botDem, false) + "Z";

        svg.innerHTML = `
          <defs>
            <linearGradient id="streamGradHedge" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#b9773b" stop-opacity="0.85"/>
              <stop offset="100%" stop-color="#b9773b" stop-opacity="0.3"/>
            </linearGradient>
            <linearGradient id="streamGradPrep" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#6d4536" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#6d4536" stop-opacity="0.5"/>
            </linearGradient>
            <linearGradient id="streamGradDem" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#153d30" stop-opacity="1"/>
              <stop offset="100%" stop-color="#153d30" stop-opacity="0.8"/>
            </linearGradient>
          </defs>
          <path d="${hedgeD}" fill="url(#streamGradHedge)" />
          <path d="${prepD}" fill="url(#streamGradPrep)" />
          <path d="${demD}" fill="url(#streamGradDem)" />
          <g>
            ${points
              .filter((_, idx) => idx % 3 === 0 || idx === n - 1)
              .map(
                (p, idx) => `
              <line x1="${X(idx * 3 < n ? idx * 3 : n - 1)}" x2="${X(idx * 3 < n ? idx * 3 : n - 1)}" y1="${top}" y2="${Hh - bot}" stroke="rgba(255,255,255,0.18)" stroke-dasharray="3,3" />
              <text x="${X(idx * 3 < n ? idx * 3 : n - 1)}" y="${Hh - bot + 18}" text-anchor="middle" font-size="11" font-weight="600" fill="rgba(255,255,255,0.85)" font-family="Plus Jakarta Sans">${p.l}</text>
            `,
              )
              .join("")}
          </g>
        `;
      }
    }

    // 2. Draw Batch Allocation & Hedging Arc Gauge
    const allocCard = root.querySelector<HTMLElement>("#canteen-alloc");
    if (allocCard) {
      const svg = allocCard.querySelector<SVGSVGElement>(".canteen-alg");
      if (svg) {
        const totalTicks = 52;
        const batch1Frac = 0.65;
        let s = "";

        const P2 = (r: number, a: number) => [
          r * Math.cos((a * Math.PI) / 180),
          r * Math.sin((a * Math.PI) / 180),
        ];

        for (let i = 0; i <= totalTicks; i++) {
          const frac = i / totalTicks;
          const a = 180 + frac * 180;
          const isBatch1 = frac <= batch1Frac;
          const color = isBatch1 ? COL.white : COL.accent;
          const [x1, y1] = P2(134, a);
          const [x2, y2] = P2(i % 6 === 0 ? 112 : 118, a);
          s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-opacity="${isBatch1 ? 1 : 0.85}" stroke-width="3" stroke-linecap="round" />`;
        }

        s += `
          <text y="-22" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="200" font-size="52" fill="#fff" letter-spacing="-2">65<tspan font-size="20" dy="-22" fill="rgba(255,255,255,0.65)">%</tspan></text>
          <text y="4" text-anchor="middle" font-size="12" font-weight="600" fill="rgba(255,255,255,0.75)" font-family="Plus Jakarta Sans">BATCH 1 INITIAL PREP</text>
        `;
        svg.innerHTML = s;
      }
    }

    // 3. Draw Free Kitchen Runway Ticks
    const runwayCard = root.querySelector<HTMLElement>("#canteen-runway");
    if (runwayCard) {
      const svg = runwayCard.querySelector<SVGSVGElement>(".canteen-rwt");
      if (svg) {
        const W = runwayCard.clientWidth ? runwayCard.clientWidth - 48 : 220;
        const ticks = 34;
        let s = "";
        for (let i = 0; i < ticks; i++) {
          const x = 1 + (i * (W - 2)) / (ticks - 1);
          const on = i / (ticks - 1) <= 0.65;
          s += `<line x1="${x}" x2="${x}" y1="${i % 5 === 0 ? 0 : 6}" y2="18" stroke="${on ? COL.accent : "rgba(255,255,255,0.22)"}" stroke-width="1.8" stroke-linecap="round" />`;
        }
        svg.innerHTML = s;
      }
    }

    // 4. Draw Cash Flow / Shift Demand Waves
    const flowCard = root.querySelector<HTMLElement>("#canteen-flow");
    if (flowCard) {
      const svg = flowCard.querySelector<SVGSVGElement>(".canteen-fls");
      if (svg) {
        const W = flowCard.clientWidth || 450;
        const Hh = 230;
        const L = 38;
        const R = W - 28;
        const mid = Hh / 2;
        const amp = 70;

        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(Hh));
        svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const lunchDemand = [4.2, 5.6, 6.8, 6.2, 5.1, 3.8];
        const eveningDemand = [2.8, 3.5, 4.4, 4.1, 3.4, 2.2];

        const X = (i: number) => L + (i / (days.length - 1)) * (R - L);

        const smoothPath = (P: number[][]) => {
          let d = `M${P[0][0]},${P[0][1]}`;
          for (let i = 0; i < P.length - 1; i++) {
            const p0 = P[i - 1] || P[i];
            const p1 = P[i];
            const p2 = P[i + 1];
            const p3 = P[i + 2] || p2;
            const k = 0.2;
            d += `C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
          }
          return d;
        };

        const lunchP = lunchDemand.map((v, i) => [X(i), mid - (v / 8) * amp]);
        const eveP = eveningDemand.map((v, i) => [X(i), mid + (v / 8) * amp]);

        let s = "";
        days.forEach((d, i) => {
          s += `<text x="${X(i)}" y="${mid + 4}" text-anchor="middle" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.7)" font-family="Plus Jakarta Sans">${d}</text>`;
        });

        s += `
          <path d="${smoothPath(lunchP)}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
          <path d="${smoothPath(eveP)}" fill="none" stroke="#e0a96d" stroke-width="2.5" stroke-linecap="round" />
        `;
        svg.innerHTML = s;
      }
    }

    // 5. Draw Weekly Volume Columns
    const volCard = root.querySelector<HTMLElement>("#canteen-volume");
    if (volCard) {
      const svg = volCard.querySelector<SVGSVGElement>(".canteen-vls");
      if (svg) {
        const W = (volCard.clientWidth || 240) - 36;
        const Hh = 160;
        const pb = 20;
        const bw = 24;
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const vols = [158, 142, 178, 164, 185];
        const maxV = 200;
        const gap = (W - bw * 5) / 4;

        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(Hh));

        let s = "";
        vols.forEach((val, i) => {
          const x = i * (bw + gap);
          const barH = ((Hh - pb - 20) * val) / maxV;
          const y = Hh - pb - barH;
          const isToday = i === 4;

          s += `
            <rect x="${x}" y="10" width="${bw}" height="${Hh - pb - 10}" rx="${bw / 2}" fill="rgba(0,0,0,0.18)" />
            <rect x="${x}" y="${y}" width="${bw}" height="${barH}" rx="${bw / 2}" fill="${isToday ? COL.white : "rgba(255,255,255,0.7)"}" />
            <text x="${x + bw / 2}" y="${Hh - 3}" text-anchor="middle" font-size="10" font-weight="600" fill="${isToday ? "#fff" : "rgba(255,255,255,0.75)"}" font-family="Plus Jakarta Sans">${days[i]}</text>
          `;
        });
        svg.innerHTML = s;
      }
    }
  }, [
    kpis.forecast_demand,
    kpis.recommended_prep,
    kpis.potential_surplus,
    kpis.surplus_pct,
    items,
    period,
    unit,
  ]);

  return (
    <section
      ref={rootRef}
      className={`canteen-bento-dashboard ${className}`}
      aria-label="Canteen Intelligence Command Bento"
    >
      {/* Top Controls Bar matching Finance Bento */}
      <div className="bento-top-bar">
        <div className="bento-top-meta">
          <h2 className="bento-top-title">
            Shift Command Center
            <span className="bento-top-sub">
              Updated live · Lunch Service · {overviewData.service_date}
            </span>
          </h2>
        </div>

        <div className="bento-top-controls">
          <div
            className="bento-seg-group"
            role="group"
            aria-label="Shift Horizon"
          >
            {(["1M", "3M", "1Y", "All"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`bento-seg-btn ${period === p ? "active" : ""}`}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div
            className="bento-seg-group"
            role="group"
            aria-label="Currency Format"
          >
            {(["INR", "USD"] as const).map((u) => (
              <button
                key={u}
                type="button"
                className={`bento-seg-btn ${unit === u ? "active" : ""}`}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
              >
                {u === "INR" ? "₹ INR" : "$ USD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 12-Column Grid Layout matching Finance Bento Architecture */}
      <div className="bento-12-grid">
        {/* Card 1 (Span 8): Net Demand & Hedged Prep Stream */}
        <article
          id="canteen-nw"
          className="bento-card-block bento-h1 col-span-8 bg-forest"
          aria-label="Net Demand Stream"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-block-ttl">
                <Sparkles size={16} className="text-accent" />
                <span>Demand, Meet Preparation</span>
              </div>
              <div className="bento-stream-legend">
                <span>
                  <i style={{ background: "#b9773b" }} />
                  Hedge Buffer (+5%)
                </span>
                <span>
                  <i style={{ background: "#6d4536" }} />
                  Recommended Prep
                </span>
                <span>
                  <i style={{ background: "#153d30" }} />
                  Baseline Demand
                </span>
              </div>
            </div>

            <div className="bento-stream-headline">
              <div className="canteen-nwn stream-main-stat">
                {kpis.recommended_prep} portions
              </div>
              <div>
                <div className="canteen-nwd stream-delta">
                  +{kpis.surplus_pct}% buffer
                </div>
                <div className="canteen-nwc stream-sub">
                  {kpis.forecast_demand} forecasted across {items.length} items
                </div>
              </div>
            </div>

            <svg className="canteen-nws stream-svg" aria-hidden="true" />
          </div>
        </article>

        {/* Card 2 (Span 4): Production Allocation & Batch Hedging Gauge */}
        <article
          id="canteen-alloc"
          className="bento-card-block bento-h1 col-span-4 bg-terracotta"
          aria-label="Batch Allocation Gauge"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-block-ttl">Batch Allocation</div>
              <span className="bento-badge-pill">Target 65/35</span>
            </div>

            <svg
              className="canteen-alg alloc-svg"
              width="300"
              height="168"
              viewBox="-150 -150 300 168"
              aria-hidden="true"
            />

            <div className="bento-alloc-rows">
              <div className="alloc-data-row">
                <i style={{ background: "#ffffff" }} />
                <span className="alloc-name">Batch 1 (Initial Cooking)</span>
                <span className="alloc-pct">65%</span>
                <span className="alloc-val">
                  {Math.round(kpis.recommended_prep * 0.65)} portions
                </span>
              </div>
              <div className="alloc-data-row border-t">
                <i style={{ background: "#e0a96d" }} />
                <span className="alloc-name">Batch 2 (Replenishment)</span>
                <span className="alloc-pct">35%</span>
                <span className="alloc-val">
                  {Math.round(kpis.recommended_prep * 0.35)} portions
                </span>
              </div>
              <div className="alloc-data-row border-t">
                <i style={{ background: "#a2d2b0" }} />
                <span className="alloc-name">Buffer Contingency</span>
                <span className="alloc-pct">&lt;5%</span>
                <span className="alloc-val">
                  {kpis.potential_surplus} portions
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* KPI Row (4 Cards, Span 3 Each) with Image 2 Color Schemes */}
        {/* KPI 1: Solid Golden Copper Accent Tile — Margin Protected */}
        <article
          className="bento-card-block bento-h2 col-span-3 bg-copper"
          aria-label="Margin Protected"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-cap">Weekly Margin Saved</div>
              <span className="bento-badge-pill">+₹14.2k</span>
            </div>

            <div className="bento-kpi-bottom">
              <div className="flex items-center gap-2">
                <svg
                  width="26"
                  height="32"
                  viewBox="0 0 34 40"
                  aria-hidden="true"
                  className="stroke-white"
                >
                  <path
                    d="M17 37V5M5 17L17 5l12 12"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="bento-big-kpi">34%</span>
              </div>
              <div className="bento-kpi-sub">
                Avoided surplus · 2.5 kg CO₂e / portion
              </div>
            </div>
          </div>
        </article>

        {/* KPI 2: Deep Dark Roast Espresso — Kitchen Free Runway */}
        <article
          id="canteen-runway"
          className="bento-card-block bento-h2 col-span-3 bg-bark"
          aria-label="Kitchen Runway"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-cap">Service Buffer</div>
              <span className="bento-sub-muted">Runway</span>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <span className="bento-big-kpi">
                {kpis.potential_surplus} <small className="text-sm">pts</small>
              </span>
              <span className="font-mono text-lg font-semibold">
                3.5 <span className="text-xs text-white/60">hrs</span>
              </span>
            </div>

            <svg
              className="canteen-rwt runway-svg"
              width="100%"
              height="20"
              aria-hidden="true"
            />
          </div>
        </article>

        {/* KPI 3: Warm Cocoa Mocha — Next Kitchen Decisions */}
        <article
          className="bento-card-block bento-h2 col-span-3 bg-terracotta"
          aria-label="Kitchen Decisions"
        >
          <div className="bento-card-inner pb-3">
            <div className="bento-card-row justify-between">
              <div className="bento-cap">Priority Decisions</div>
              <span className="bento-sub-muted font-mono">
                {alerts.length} items
              </span>
            </div>

            <div className="bento-decision-mini-list mt-2">
              {alerts.slice(0, 2).map((item) => (
                <div key={item.menu_item} className="decision-mini-row">
                  <div className="font-semibold text-xs truncate flex-1">
                    {item.menu_item}
                  </div>
                  <span className="text-[11px] font-mono font-medium text-white/80">
                    +{item.potential_surplus} pts
                  </span>
                  <span className="text-xs font-semibold text-accent font-mono ml-2">
                    ₹{item.cost_at_risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* KPI 4: Celadon Mint / Ivory Tile — Sustainability Goals */}
        <article
          className="bento-card-block bento-h2 col-span-3 bg-sage"
          aria-label="Sustainability Goals"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-cap text-forest">
                Zero-Landfill Protocol
              </div>
              <span className="text-xs font-semibold text-forest/75 font-mono">
                Active
              </span>
            </div>

            <div className="mt-2 space-y-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-forest">
                  <span>Audit Alignment</span>
                  <span className="font-mono">82%</span>
                </div>
                <div className="w-full bg-forest/15 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-forest h-full rounded-full"
                    style={{ width: "82%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-forest">
                  <span>14:30 Rescue Protocol</span>
                  <span className="font-mono">Ready</span>
                </div>
                <div className="w-full bg-forest/15 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-forest h-full rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Bottom Row (3 Cards: Span 5, Span 4, Span 3) */}
        {/* Card 1 (Span 5): Service Shift Flow Waves */}
        <article
          id="canteen-flow"
          className="bento-card-block bento-h3 col-span-5 bg-terracotta"
          aria-label="Shift Demand Waves"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div>
                <div className="bento-block-ttl">Shift Demand Waves</div>
                <div className="text-xs text-white/70 mt-1">
                  Peak lunch rush vs evening batch replenishment
                </div>
              </div>
              <div className="bento-stream-legend">
                <span>
                  <i style={{ background: "#ffffff" }} />
                  Lunch Rush
                </span>
                <span>
                  <i style={{ background: "#e0a96d" }} />
                  Dinner Replenish
                </span>
              </div>
            </div>

            <svg className="canteen-fls flow-svg" aria-hidden="true" />
          </div>
        </article>

        {/* Card 2 (Span 4): Top Menu Dishes Velocity */}
        <article
          id="canteen-dishes"
          className="bento-card-block bento-h3 col-span-4 bg-forest"
          aria-label="Menu Dishes Velocity"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row justify-between">
              <div className="bento-block-ttl">Dish Velocity</div>
              <span className="bento-sub-muted text-xs">7-Day Trajectory</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.menu_item}
                  className="flex items-center justify-between py-2 border-b border-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {item.menu_item}
                    </div>
                    <div className="text-xs text-white/60 font-mono">
                      {item.category} · {item.predicted_demand} portions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-accent">
                      ₹{item.cost_per_portion * item.predicted_demand}
                    </div>
                    <div className="text-[10px] text-white/60 font-mono">
                      recom: {item.recommended_prep}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-2">
              <button
                type="button"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => navigate("prep-planner")}
              >
                <span>Launch Preparation Planner</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </article>

        {/* Card 3 (Span 3): Weekly Shift Volume */}
        <article
          id="canteen-volume"
          className="bento-card-block bento-h3 col-span-3 bg-copper"
          aria-label="Weekly Kitchen Volume"
        >
          <div className="bento-card-inner">
            <div className="bento-block-ttl">Weekly Volume</div>
            <div className="text-2xl font-light font-mono mt-2">
              {kpis.forecast_demand * 5}{" "}
              <small className="text-xs">pts/wk</small>
            </div>
            <div className="text-xs text-white/80 mt-1 font-mono">
              ↑ 1.8% vs last week
            </div>

            <svg className="canteen-vls vol-svg" aria-hidden="true" />
          </div>
        </article>
      </div>
    </section>
  );
}
