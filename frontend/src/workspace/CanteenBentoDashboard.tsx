import { useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  Sparkles,
  ChefHat,
  TrendingUp,
  BarChart2,
  Flame,
} from "lucide-react";
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

  const kpis = overviewData.kpis;
  const items = overviewData.item_details;
  const alerts = overviewData.prioritized_alerts;

  const drawCharts = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

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
        const W = nwCard.clientWidth > 100 ? nwCard.clientWidth : 720;
        const Hh = 220;
        const top = 25;
        const bot = 25;
        const mid = top + (Hh - top - bot) / 2;

        svg.setAttribute("width", "100%");
        svg.setAttribute("height", String(Hh));
        svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);

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
          const color = isBatch1 ? "#ffffff" : "#e0a96d";
          const [x1, y1] = P2(134, a);
          const [x2, y2] = P2(i % 6 === 0 ? 112 : 118, a);
          s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-opacity="${isBatch1 ? 1 : 0.85}" stroke-width="3" stroke-linecap="round" />`;
        }

        s += `
          <text y="-22" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-weight="200" font-size="52" fill="#fff" letter-spacing="-2">65<tspan font-size="20" dy="-22" fill="rgba(255,255,255,0.65)">%</tspan></text>
          <text y="4" text-anchor="middle" font-size="12" font-weight="600" fill="rgba(255,255,255,0.75)" font-family="Plus Jakarta Sans, sans-serif">BATCH 1 INITIAL PREP</text>
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
          s += `<line x1="${x}" x2="${x}" y1="${i % 5 === 0 ? 0 : 6}" y2="18" stroke="${on ? "#e0a96d" : "rgba(255,255,255,0.22)"}" stroke-width="1.8" stroke-linecap="round" />`;
        }
        svg.innerHTML = s;
      }
    }

    // 4. Draw Shift Demand Waves
    const flowCard = root.querySelector<HTMLElement>("#canteen-flow");
    if (flowCard) {
      const svg = flowCard.querySelector<SVGSVGElement>(".canteen-fls");
      if (svg) {
        const W = flowCard.clientWidth > 100 ? flowCard.clientWidth : 460;
        const Hh = 210;
        const L = 38;
        const R = W - 28;
        const mid = Hh / 2;
        const amp = 60;

        svg.setAttribute("width", "100%");
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
          s += `<text x="${X(i)}" y="${mid + 4}" text-anchor="middle" font-size="10.5" font-weight="600" fill="rgba(21,61,48,0.6)" font-family="Plus Jakarta Sans, sans-serif">${d}</text>`;
        });

        s += `
          <path d="${smoothPath(lunchP)}" fill="none" stroke="#153d30" stroke-width="2.5" stroke-linecap="round" />
          <path d="${smoothPath(eveP)}" fill="none" stroke="#b9773b" stroke-width="2.5" stroke-linecap="round" />
        `;

        lunchP.forEach(([x, y]) => {
          s += `<circle cx="${x}" cy="${y}" r="3.5" fill="#153d30" stroke="#f8f5ee" stroke-width="2"/>`;
        });
        eveP.forEach(([x, y]) => {
          s += `<circle cx="${x}" cy="${y}" r="3.5" fill="#b9773b" stroke="#f8f5ee" stroke-width="2"/>`;
        });

        svg.innerHTML = s;
      }
    }

    // 5. Draw Weekly Volume Bars
    const volCard = root.querySelector<HTMLElement>("#canteen-volume");
    if (volCard) {
      const svg = volCard.querySelector<SVGSVGElement>(".canteen-vls");
      if (svg) {
        const W = volCard.clientWidth ? volCard.clientWidth - 48 : 220;
        const Hh = 130;
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", String(Hh));
        svg.setAttribute("viewBox", `0 0 ${W} ${Hh}`);

        const days = ["M", "T", "W", "T", "F", "S", "S"];
        const values = [110, 145, 175, 160, 190, 130, 95];
        const maxVal = 200;
        const bw = Math.max(12, Math.floor((W - 30) / days.length - 10));
        let s = "";

        days.forEach((d, i) => {
          const x = 16 + i * (bw + 10);
          const bh = (values[i] / maxVal) * 90;
          const y = Hh - 26 - bh;
          const isToday = i === 4;
          s += `
            <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="5" fill="${isToday ? "#ffffff" : "rgba(255,255,255,0.38)"}" />
            <text x="${x + bw / 2}" y="${Hh - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="rgba(255,255,255,0.75)" font-family="Plus Jakarta Sans, sans-serif">${d}</text>
          `;
        });
        svg.innerHTML = s;
      }
    }
  }, [kpis]);

  useEffect(() => {
    drawCharts();
    const handleResize = () => {
      drawCharts();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCharts]);

  return (
    <div
      className={`canteen-bento-dashboard ${className}`}
      ref={rootRef}
      role="region"
      aria-label="Canteen Kitchen Command Bento Grid"
    >
      <style>{`
        /* Self-contained, robust 12-column Bento Grid styling */
        .canteen-bento-dashboard {
          width: 100%;
          box-sizing: border-box;
          margin-top: 14px;
          margin-bottom: 24px;
          font-family: var(--font-body), "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        }
        .canteen-bento-dashboard * {
          box-sizing: border-box;
        }
        .bento-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .bento-top-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #153d30;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bento-top-sub {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-top: 2px;
        }
        .bento-top-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bento-seg-group {
          display: flex;
          padding: 3px;
          gap: 2px;
          border-radius: 12px;
          background: rgba(21, 61, 48, 0.08);
          border: 1px solid rgba(21, 61, 48, 0.12);
        }
        .bento-seg-btn {
          border: 0;
          height: 28px;
          padding: 0 10px;
          border-radius: 9px;
          background: transparent;
          color: #3b5044;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bento-seg-btn.active {
          background: #153d30;
          color: #ffffff;
        }

        /* 12-Column Responsive Bento Grid */
        .bento-12-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
        }

        /* Desktop Spans (Strict & Mandatory) */
        .bento-card-block {
          position: relative;
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 10px 28px -6px rgba(21, 61, 48, 0.16);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .bento-card-block:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 34px -8px rgba(21, 61, 48, 0.24);
        }

        /* Grid Column Assignment by ID and Class */
        #canteen-nw,
        .bento-12-grid .bento-span-8 {
          grid-column: span 8 !important;
          min-height: 380px;
        }
        #canteen-alloc,
        .bento-12-grid .bento-span-4 {
          grid-column: span 4 !important;
          min-height: 380px;
        }
        .bento-12-grid .bento-kpi,
        .bento-12-grid .bento-span-3 {
          grid-column: span 3 !important;
          min-height: 180px;
        }
        #canteen-flow,
        .bento-12-grid .bento-span-5 {
          grid-column: span 5 !important;
          min-height: 340px;
        }
        #canteen-dishes,
        .bento-12-grid .bento-span-4-dishes {
          grid-column: span 4 !important;
          min-height: 340px;
        }
        #canteen-volume,
        .bento-12-grid .bento-span-3-vol {
          grid-column: span 3 !important;
          min-height: 340px;
        }

        /* 6 Rich Image 2 Color Schemes */
        .card-forest {
          background: #153d30 !important;
          color: #fbf9f4 !important;
        }
        .card-terracotta {
          background: #6d4536 !important;
          color: #fbf9f4 !important;
        }
        .card-amber {
          background: #b9773b !important;
          color: #ffffff !important;
        }
        .card-bark {
          background: #35221b !important;
          color: #fbf9f4 !important;
        }
        .card-mint {
          background: #edf5ee !important;
          color: #153d30 !important;
          border: 1.5px solid rgba(21, 61, 48, 0.16) !important;
        }
        .card-sand {
          background: #f8f5ee !important;
          color: #153d30 !important;
          border: 1.5px solid rgba(21, 61, 48, 0.14) !important;
        }

        .bento-card-inner {
          position: relative;
          padding: 22px 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .bento-card-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          position: relative;
          z-index: 4;
        }

        .bento-block-ttl {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bento-cap {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.85;
        }

        .bento-badge-pill {
          display: inline-flex;
          align-items: center;
          height: 22px;
          padding: 0 9px;
          border-radius: 11px;
          background: rgba(0, 0, 0, 0.24);
          color: #ffffff;
          font-size: 11px;
          font-family: monospace;
          font-weight: 600;
        }

        .bento-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
          margin-top: 10px;
          width: fit-content;
        }
        .bento-cta-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .bento-cta-btn:active {
          transform: translateY(0);
        }
        .cta-forest-on-mint {
          background: #153d30;
          color: #ffffff;
        }
        .cta-cream-on-terracotta {
          background: #fbf9f4;
          color: #6d4536;
        }
        .cta-white-on-amber {
          background: #ffffff;
          color: #b9773b;
        }
        .cta-cream-on-bark {
          background: #fbf9f4;
          color: #35221b;
        }
        .cta-forest-on-sand {
          background: #153d30;
          color: #ffffff;
        }

        .bento-stream-headline {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-top: 12px;
          position: relative;
          z-index: 4;
        }
        .stream-main-stat {
          font-size: clamp(26px, 2.8vw, 36px);
          font-weight: 700;
          letter-spacing: -0.03em;
          font-family: monospace;
          line-height: 1;
        }
        .stream-delta {
          font-size: 13px;
          font-weight: 700;
          color: #e0a96d;
          font-family: monospace;
        }
        .stream-sub {
          font-size: 12px;
          opacity: 0.75;
          margin-top: 2px;
        }

        .bento-stream-legend {
          display: flex;
          gap: 12px;
          font-size: 11.5px;
          font-weight: 600;
          opacity: 0.85;
        }
        .bento-stream-legend span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .bento-stream-legend i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .stream-svg {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          display: block;
          z-index: 1;
          pointer-events: none;
        }
        .alloc-svg {
          display: block;
          margin: 6px auto 0;
        }

        .bento-alloc-rows {
          margin-top: auto;
          padding-top: 6px;
          width: 100%;
        }
        .alloc-data-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 26px;
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .alloc-data-row i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .alloc-name {
          flex: 1;
          font-weight: 600;
        }
        .alloc-pct {
          font-family: monospace;
          opacity: 0.75;
          width: 36px;
          text-align: right;
        }
        .alloc-val {
          font-family: monospace;
          font-weight: 700;
          width: 85px;
          text-align: right;
        }

        .bento-big-kpi {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1;
          font-family: monospace;
        }
        .bento-kpi-sub {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .decision-mini-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 12px;
        }

        .bento-progress-track {
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          background: rgba(21, 61, 48, 0.16);
          overflow: hidden;
          margin-top: 4px;
        }
        .bento-progress-fill {
          height: 100%;
          border-radius: 9999px;
          background: #153d30;
        }

        .flow-svg {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 12px;
          width: calc(100% - 28px);
        }
        .vol-svg {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 12px;
          width: calc(100% - 28px);
        }

        .dish-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .dish-row-item:last-child {
          border-bottom: none;
        }

        /* Responsive Breakpoints: Tablet */
        @media (max-width: 1199px) {
          #canteen-nw,
          .bento-12-grid .bento-span-8 {
            grid-column: span 12 !important;
          }
          #canteen-alloc,
          .bento-12-grid .bento-span-4 {
            grid-column: span 12 !important;
            min-height: 350px;
          }
          .bento-12-grid .bento-kpi,
          .bento-12-grid .bento-span-3 {
            grid-column: span 6 !important;
          }
          #canteen-flow,
          .bento-12-grid .bento-span-5 {
            grid-column: span 12 !important;
          }
          #canteen-dishes,
          .bento-12-grid .bento-span-4-dishes {
            grid-column: span 6 !important;
          }
          #canteen-volume,
          .bento-12-grid .bento-span-3-vol {
            grid-column: span 6 !important;
          }
        }

        /* Responsive Breakpoints: Mobile */
        @media (max-width: 767px) {
          .bento-12-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          .bento-card-block {
            width: 100% !important;
            min-height: auto !important;
          }
          .bento-card-inner {
            padding: 18px 16px !important;
          }
          #canteen-nw {
            min-height: 380px !important;
          }
          #canteen-alloc {
            min-height: 340px !important;
          }
          .bento-12-grid .bento-kpi {
            min-height: 160px !important;
          }
          #canteen-flow {
            min-height: 320px !important;
          }
          #canteen-dishes {
            min-height: auto !important;
          }
          #canteen-volume {
            min-height: 280px !important;
          }
          .bento-top-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .bento-top-controls {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .bento-card-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .bento-stream-legend {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .bento-stream-headline {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .stream-main-stat {
            font-size: 32px !important;
            color: #ffffff !important;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          }
          .stream-delta {
            color: #e0a96d !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          }
          .stream-sub {
            color: rgba(255, 255, 255, 0.9) !important;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          }
          }
        }
      `}</style>

      {/* 12-Column Grid Layout matching Finance Bento Architecture */}
      <div className="bento-12-grid">
        {/* Card 1 (Span 8): Net Demand & Hedged Prep Stream — Image 2 Forest Green */}
        <article
          id="canteen-nw"
          className="bento-card-block bento-span-8 card-forest"
          aria-label="Net Demand Stream"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-block-ttl">
                <ChefHat size={18} color="#e0a96d" />
                <span>Demand, Meet Preparation</span>
              </div>
              <div className="bento-stream-legend">
                <span>
                  <i style={{ background: "#b9773b" }} />
                  Hedge Buffer (+5%)
                </span>
                <span>
                  <i style={{ background: "#6d4536" }} />
                  Suggested Prep
                </span>
                <span>
                  <i style={{ background: "#153d30" }} />
                  Baseline
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

            <button
              type="button"
              className="bento-cta-btn cta-cream-on-bark"
              onClick={() => navigate("demand-forecast")}
              aria-label="Explore Demand Forecast"
            >
              <span>Explore Forecast</span>
              <ArrowRight size={13} />
            </button>

            <svg className="canteen-nws stream-svg" aria-hidden="true" />
          </div>
        </article>

        {/* Card 2 (Span 4): Production Allocation & Batch Hedging Gauge — Image 2 Warm Mocha */}
        <article
          id="canteen-alloc"
          className="bento-card-block bento-span-4 card-terracotta"
          aria-label="Batch Allocation Gauge"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-block-ttl">
                <BarChart2 size={18} color="#fbf9f4" />
                <span>Batch Allocation</span>
              </div>
              <span className="bento-badge-pill">Target 65/35</span>
            </div>

            <svg
              className="canteen-alg alloc-svg"
              width="300"
              height="165"
              viewBox="-150 -150 300 165"
              aria-hidden="true"
            />

            <div className="bento-alloc-rows">
              <div className="alloc-data-row">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <i style={{ background: "#ffffff" }} />
                  <span className="alloc-name">Batch 1 (Initial Fire)</span>
                </div>
                <span className="alloc-pct">65%</span>
                <span className="alloc-val">
                  {Math.round(kpis.recommended_prep * 0.65)} pts
                </span>
              </div>
              <div className="alloc-data-row">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <i style={{ background: "#e0a96d" }} />
                  <span className="alloc-name">Batch 2 (Replenish)</span>
                </div>
                <span className="alloc-pct">35%</span>
                <span className="alloc-val">
                  {Math.round(kpis.recommended_prep * 0.35)} pts
                </span>
              </div>
              <div className="alloc-data-row">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <i style={{ background: "#a2d2b0" }} />
                  <span className="alloc-name">Buffer Reserve</span>
                </div>
                <span className="alloc-pct">&lt;5%</span>
                <span className="alloc-val">{kpis.potential_surplus} pts</span>
              </div>
            </div>

            <button
              type="button"
              className="bento-cta-btn cta-cream-on-terracotta"
              onClick={() => navigate("prep-planner")}
              aria-label="Review Preparation Batches"
            >
              <span>Tune Batch Policy</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </article>

        {/* KPI Row (4 Cards, Span 3 Each) with Image 2 Color Schemes */}
        {/* KPI 1: Solid Caramel Amber Tile — Margin Saved */}
        <article
          className="bento-card-block bento-span-3 bento-kpi card-amber"
          aria-label="Margin Protected"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-cap">Weekly Margin Saved</div>
              <span className="bento-badge-pill">+₹14.2k</span>
            </div>

            <div style={{ marginTop: "auto" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <TrendingUp size={28} color="#ffffff" />
                <span className="bento-big-kpi">34%</span>
              </div>
              <div className="bento-kpi-sub">
                Avoided surplus · 2.5 kg CO₂e / portion
              </div>
              <button
                type="button"
                className="bento-cta-btn cta-white-on-amber"
                onClick={() => navigate("performance")}
                aria-label="View Margin Analytics"
              >
                <span>View Margin</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </article>

        {/* KPI 2: Dark Espresso Bark — Kitchen Buffer Runway */}
        <article
          id="canteen-runway"
          className="bento-card-block bento-span-3 bento-kpi card-bark"
          aria-label="Kitchen Runway"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-cap">Service Buffer</div>
              <span className="bento-badge-pill">3.5 hrs</span>
            </div>

            <div style={{ marginTop: "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span className="bento-big-kpi">
                  {kpis.potential_surplus}{" "}
                  <small style={{ fontSize: "14px", fontWeight: "normal" }}>
                    pts
                  </small>
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#e0a96d",
                  }}
                >
                  98.2% safety
                </span>
              </div>

              <svg
                className="canteen-rwt"
                width="100%"
                height="18"
                aria-hidden="true"
                style={{ display: "block", marginBottom: "6px" }}
              />

              <button
                type="button"
                className="bento-cta-btn cta-cream-on-bark"
                onClick={() => navigate("prep-planner")}
                aria-label="Adjust Buffer Runway"
              >
                <span>Buffer Policy</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </article>

        {/* KPI 3: Warm Cocoa Mocha — Active Priority Decisions */}
        <article
          className="bento-card-block bento-span-3 bento-kpi card-terracotta"
          aria-label="Kitchen Decisions"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-cap">Priority Decisions</div>
              <span className="bento-badge-pill">{alerts.length} items</span>
            </div>

            <div style={{ marginTop: "auto" }}>
              {alerts.slice(0, 2).map((item) => (
                <div key={item.menu_item} className="decision-mini-row">
                  <span
                    style={{
                      fontWeight: 600,
                      maxWidth: "110px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.menu_item}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      opacity: 0.85,
                    }}
                  >
                    +{item.potential_surplus}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#e0a96d",
                    }}
                  >
                    ₹{item.cost_at_risk}
                  </span>
                </div>
              ))}

              <button
                type="button"
                className="bento-cta-btn cta-cream-on-terracotta"
                onClick={() => navigate("prep-planner", alerts[0]?.menu_item)}
                aria-label="Review Priority Items"
              >
                <span>Review Items</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </article>

        {/* KPI 4: Celadon Mint Tile — Zero-Landfill Sustainability Protocol */}
        <article
          className="bento-card-block bento-span-3 bento-kpi card-mint"
          aria-label="Sustainability Goals"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-cap" style={{ color: "#153d30" }}>
                Zero-Landfill Protocol
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#153d30",
                  fontFamily: "monospace",
                }}
              >
                Active
              </span>
            </div>

            <div style={{ marginTop: "auto" }}>
              <div style={{ marginBottom: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#153d30",
                  }}
                >
                  <span>Audit Alignment</span>
                  <span style={{ fontFamily: "monospace" }}>94.2%</span>
                </div>
                <div className="bento-progress-track">
                  <div
                    className="bento-progress-fill"
                    style={{ width: "94.2%" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#153d30",
                  }}
                >
                  <span>14:30 Rescue Protocol</span>
                  <span style={{ fontFamily: "monospace" }}>Armed</span>
                </div>
                <div className="bento-progress-track">
                  <div
                    className="bento-progress-fill"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="bento-cta-btn cta-forest-on-mint"
                onClick={() => navigate("waste-risk")}
                aria-label="Open Surplus Rescue"
              >
                <span>Rescue Hub</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </article>

        {/* Bottom Row (3 Cards: Span 5, Span 4, Span 3) */}
        {/* Card 1 (Span 5): Shift Demand Waves — Image 2 Warm Sand / Ivory */}
        <article
          id="canteen-flow"
          className="bento-card-block bento-span-5 card-sand"
          aria-label="Shift Demand Waves"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div>
                <div className="bento-block-ttl" style={{ color: "#153d30" }}>
                  <Flame size={18} color="#b9773b" />
                  <span>Shift Demand Waves</span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#5f7166",
                    marginTop: "2px",
                  }}
                >
                  Peak lunch rush vs evening batch replenishment
                </div>
              </div>
              <div className="bento-stream-legend" style={{ color: "#153d30" }}>
                <span>
                  <i style={{ background: "#153d30" }} />
                  Lunch Rush
                </span>
                <span>
                  <i style={{ background: "#b9773b" }} />
                  Dinner
                </span>
              </div>
            </div>

            <button
              type="button"
              className="bento-cta-btn cta-forest-on-sand"
              onClick={() => navigate("demand-forecast")}
              style={{ position: "relative", zIndex: 5 }}
              aria-label="Inspect Shift Patterns"
            >
              <span>Shift Telemetry</span>
              <ArrowRight size={13} />
            </button>

            <svg className="canteen-fls flow-svg" aria-hidden="true" />
          </div>
        </article>

        {/* Card 2 (Span 4): Top Menu Dishes Velocity — Image 2 Forest Green */}
        <article
          id="canteen-dishes"
          className="bento-card-block bento-span-4-dishes card-forest"
          aria-label="Menu Dishes Velocity"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div className="bento-block-ttl">
                <Sparkles size={18} color="#e0a96d" />
                <span>Dish Velocity</span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  opacity: 0.8,
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                7-Day Run
              </span>
            </div>

            <div style={{ margin: "10px 0" }}>
              {items.slice(0, 3).map((item) => (
                <div key={item.menu_item} className="dish-row-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.menu_item}
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        opacity: 0.7,
                        fontFamily: "monospace",
                      }}
                    >
                      {item.category} · {item.predicted_demand} portions
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: "10px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#e0a96d",
                        fontFamily: "monospace",
                      }}
                    >
                      ₹{item.cost_per_portion * item.predicted_demand}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "#a2d2b0",
                        fontWeight: 600,
                      }}
                    >
                      recom: {Math.round(item.predicted_demand * 1.05)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="bento-cta-btn cta-cream-on-bark"
              onClick={() => navigate("prep-planner")}
              aria-label="Launch Planner for Top Dishes"
            >
              <span>Launch Planner</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </article>

        {/* Card 3 (Span 3): Weekly Volume & Velocity — Image 2 Caramel Amber */}
        <article
          id="canteen-volume"
          className="bento-card-block bento-span-3-vol card-amber"
          aria-label="Weekly Kitchen Volume"
        >
          <div className="bento-card-inner">
            <div className="bento-card-row">
              <div>
                <div className="bento-cap">Weekly Volume</div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "20px",
                    fontWeight: 700,
                    marginTop: "2px",
                  }}
                >
                  790 <small style={{ fontSize: "11px" }}>pts/wk</small>
                </div>
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                <div>↑ 1.8%</div>
                <div style={{ opacity: 0.75, fontSize: "10px" }}>
                  vs last wk
                </div>
              </div>
            </div>

            <button
              type="button"
              className="bento-cta-btn cta-white-on-amber"
              onClick={() => navigate("demand-forecast")}
              style={{ position: "relative", zIndex: 5, marginTop: "6px" }}
              aria-label="View Volume History"
            >
              <span>History</span>
              <ArrowRight size={13} />
            </button>

            <svg className="canteen-vls vol-svg" aria-hidden="true" />
          </div>
        </article>
      </div>
    </div>
  );
}
