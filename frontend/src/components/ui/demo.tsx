// @ts-nocheck
"use client";

import * as React from "react";
import { FinanceBento } from "@/components/ui/finance-bento";

/* Geist + Geist Mono for the demo */
function useFonts() {
  React.useEffect(() => {
    const id = "geist-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

/* 36 month-end balances that grow with some honest wobble */
const history = Array.from({ length: 36 }, (_, i) => {
  const t = i / 35;
  const d = new Date(2026, 9 - (35 - i), 1);
  const noise = (Math.sin(i * 12.9898 + 156.466) * 43758.5453) % 1;
  return {
    date: d.toISOString(),
    fiat: 14000 + t * 7000 + Math.sin(i * 0.9) * 900,
    stocks: 12000 + t * 19000 + Math.sin(i * 0.55) * 1600 + noise * 800,
    crypto: Math.max(
      2500,
      4000 +
        t * 12000 +
        Math.sin(i * 0.8 + 1) * 3200 +
        Math.cos(i * 0.33) * 1400,
    ),
  };
});

const data = {
  history,
  payments: [
    { name: "Rent", date: "Nov 1", amount: 1800 },
    { name: "Index fund · auto-buy", date: "Nov 3", amount: 500 },
    { name: "Insurance", date: "Nov 9", amount: 96 },
  ],
  goals: [
    { name: "House deposit", progress: 0.42, target: 60000 },
    { name: "Japan, spring", progress: 0.76, target: 6000 },
  ],
  cashflow: {
    months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    income: [
      [2.4, 3.6, 5.4, 6.4, 5.0, 3.4],
      [2.0, 3.0, 4.4, 5.2, 4.2, 2.8],
      [1.6, 2.4, 3.4, 4.0, 3.3, 2.2],
    ],
    spending: [
      [1.2, 2.2, 3.8, 4.6, 3.4, 1.8],
      [1.0, 1.8, 3.0, 3.8, 2.8, 1.5],
      [0.8, 1.4, 2.4, 3.0, 2.2, 1.2],
    ],
  },
  crypto: [
    {
      name: "Bitcoin",
      symbol: "BTC",
      share: 0.62,
      change: "+3.1%",
      ohlc: [
        [66.1, 67.0, 65.8, 66.8],
        [66.8, 67.6, 66.5, 67.4],
        [67.4, 67.9, 66.9, 67.1],
        [67.1, 68.2, 67.0, 68.0],
        [68.0, 68.9, 67.8, 68.7],
        [68.7, 69.1, 68.1, 68.4],
        [68.4, 69.6, 68.3, 69.4],
      ],
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      share: 0.26,
      change: "−0.8%",
      ohlc: [
        [3.52, 3.58, 3.44, 3.47],
        [3.47, 3.55, 3.4, 3.53],
        [3.53, 3.56, 3.38, 3.41],
        [3.41, 3.5, 3.36, 3.48],
        [3.48, 3.51, 3.39, 3.43],
        [3.43, 3.49, 3.37, 3.46],
        [3.46, 3.52, 3.42, 3.44],
      ],
    },
    {
      name: "Solana",
      symbol: "SOL",
      share: 0.12,
      change: "+6.4%",
      ohlc: [
        [142, 149, 139, 147],
        [147, 151, 141, 143],
        [143, 156, 142, 154],
        [154, 158, 147, 149],
        [149, 162, 148, 160],
        [160, 166, 155, 157],
        [157, 171, 156, 168],
      ],
    },
  ],
  stocks: {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    values: [2.1, 1.2, 3.4, 1.9, 4.6],
  },
};

const AVATAR =
  "data:image/jpeg;base64,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";

export default function FinanceBentoDemo() {
  useFonts();
  return (
    <div className="min-h-screen w-full bg-black px-4 py-6 sm:px-6 sm:py-8">
      <FinanceBento
        className="mx-auto max-w-[1320px]"
        data={data}
        title="Overview"
        subtitle="Updated today, 09:41"
        avatar={AVATAR}
        avatarAlt="Roman Vasnev"
      />
    </div>
  );
}

export { FinanceBentoDemo };
