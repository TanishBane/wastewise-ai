"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ColorKey =
  | "color1"
  | "color2"
  | "color3"
  | "color4"
  | "color5"
  | "color6"
  | "color7"
  | "color8"
  | "color9"
  | "color10"
  | "color11"
  | "color12"
  | "color13"
  | "color14"
  | "color15"
  | "color16"
  | "color17";

export type Colors = Record<ColorKey, string>;

const VIVID_BOTANICAL_COLORS: Colors = {
  color1: "#FFFFFF",
  color2: "#0D684D",
  color3: "#4ADE80",
  color4: "#F0FDF4",
  color5: "#DCFCE7",
  color6: "#86EFAC",
  color7: "#059669",
  color8: "#10B981",
  color9: "#15803D",
  color10: "#34D399",
  color11: "#047857",
  color12: "#BBF7D0",
  color13: "#064E3B",
  color14: "#A7F3D0",
  color15: "#D1FAE5",
  color16: "#065F46",
  color17: "#16A34A",
};

const svgOrder = [
  "svg1",
  "svg2",
  "svg3",
  "svg4",
  "svg3",
  "svg2",
  "svg1",
] as const;

type SvgKey = (typeof svgOrder)[number];

type Stop = {
  offset: number;
  stopColor: string;
};

type SvgState = {
  gradientTransform: string;
  stops: Stop[];
};

type SvgStates = Record<SvgKey, SvgState>;

const createStopsArray = (
  svgStates: SvgStates,
  svgOrder: readonly SvgKey[],
  maxStops: number,
): Stop[][] => {
  const stopsArray: Stop[][] = [];
  for (let i = 0; i < maxStops; i++) {
    const stopConfigurations = svgOrder.map((svgKey) => {
      const svg = svgStates[svgKey];
      return svg.stops[i] || svg.stops[svg.stops.length - 1];
    });
    stopsArray.push(stopConfigurations);
  }
  return stopsArray;
};

type GradientSvgProps = {
  className: string;
  isHovered: boolean;
  colors: Colors;
};

const GradientSvg: React.FC<GradientSvgProps> = ({
  className,
  isHovered,
  colors,
}) => {
  const svgStates: SvgStates = {
    svg1: {
      gradientTransform:
        "translate(287.5 280) rotate(-29.0546) scale(689.807 1000)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color3 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.537556, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color8 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg2: {
      gradientTransform:
        "translate(126.5 418.5) rotate(-64.756) scale(533.444 773.324)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.104167, stopColor: colors.color12 },
        { offset: 0.182292, stopColor: colors.color13 },
        { offset: 0.28125, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.453125, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.75, stopColor: colors.color14 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color1 },
      ],
    },
    svg3: {
      gradientTransform:
        "translate(264.5 339.5) rotate(-42.3022) scale(946.451 1372.05)",
      stops: [
        { offset: 0, stopColor: colors.color1 },
        { offset: 0.188423, stopColor: colors.color2 },
        { offset: 0.307292, stopColor: colors.color1 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.442708, stopColor: colors.color15 },
        { offset: 0.537556, stopColor: colors.color16 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.725645, stopColor: colors.color17 },
        { offset: 0.817779, stopColor: colors.color9 },
        { offset: 0.84375, stopColor: colors.color10 },
        { offset: 0.90569, stopColor: colors.color1 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
    svg4: {
      gradientTransform:
        "translate(860.5 420) rotate(-153.984) scale(957.528 1388.11)",
      stops: [
        { offset: 0.109375, stopColor: colors.color11 },
        { offset: 0.171875, stopColor: colors.color2 },
        { offset: 0.260417, stopColor: colors.color13 },
        { offset: 0.328792, stopColor: colors.color4 },
        { offset: 0.328892, stopColor: colors.color5 },
        { offset: 0.328992, stopColor: colors.color1 },
        { offset: 0.442708, stopColor: colors.color6 },
        { offset: 0.515625, stopColor: colors.color7 },
        { offset: 0.631738, stopColor: colors.color1 },
        { offset: 0.692708, stopColor: colors.color8 },
        { offset: 0.817708, stopColor: colors.color9 },
        { offset: 0.869792, stopColor: colors.color10 },
        { offset: 1, stopColor: colors.color11 },
      ],
    },
  };

  const maxStops = Math.max(
    ...Object.values(svgStates).map((svg) => svg.stops.length),
  );
  const stopsAnimationArray = createStopsArray(svgStates, svgOrder, maxStops);
  const gradientTransform = svgOrder.map(
    (svgKey) => svgStates[svgKey].gradientTransform,
  );

  const variants = {
    hovered: {
      gradientTransform: gradientTransform,
      transition: { duration: 16, repeat: Infinity, ease: "linear" as const },
    },
    notHovered: {
      gradientTransform: gradientTransform,
      transition: { duration: 5, repeat: Infinity, ease: "linear" as const },
    },
  };

  return (
    <svg
      className={className}
      viewBox="0 0 1030 280"
      style={{ width: "100%", height: "100%", display: "block" }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="1030"
        height="280"
        rx="140"
        fill="url(#paint0_radial_liquid)"
      />
      <defs>
        <motion.radialGradient
          id="paint0_radial_liquid"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          animate={isHovered ? variants.hovered : variants.notHovered}
        >
          {stopsAnimationArray.map((stopConfigs, index) => (
            <AnimatePresence key={index}>
              <motion.stop
                initial={{
                  offset: stopConfigs[0].offset,
                  stopColor: stopConfigs[0].stopColor,
                }}
                animate={{
                  offset: stopConfigs.map((config) => config.offset),
                  stopColor: stopConfigs.map((config) => config.stopColor),
                }}
                transition={{
                  duration: 0,
                  ease: "linear" as const,
                  repeat: Infinity,
                }}
              />
            </AnimatePresence>
          ))}
        </motion.radialGradient>
      </defs>
    </svg>
  );
};

type LiquidProps = {
  isHovered: boolean;
  colors: Colors;
};

export const Liquid: React.FC<LiquidProps> = ({ isHovered, colors }) => {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className={`shivering-liquid-layer shivering-liquid-layer-${index}`}
        >
          <GradientSvg
            className="w-full h-full"
            isHovered={isHovered}
            colors={colors}
          />
        </div>
      ))}
    </>
  );
};

export interface ShiveringLiquidButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  colors?: Colors;
  ariaLabel?: string;
}

export const ShiveringLiquidButton: React.FC<ShiveringLiquidButtonProps> = ({
  children,
  onClick,
  className = "",
  colors = VIVID_BOTANICAL_COLORS,
  ariaLabel = "Launch demo canteen",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`shivering-btn-wrap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer blurred pulsating aura */}
      <div className="shivering-btn-aura">
        <span className="shivering-btn-aura-bg" />
        <div className="shivering-btn-liquid-box">
          <Liquid isHovered={isHovered} colors={colors} />
        </div>
      </div>

      {/* Mid depth backdrop */}
      <div className="shivering-btn-mid" />

      {/* Main button core */}
      <div className="shivering-btn-core">
        <span className="shivering-btn-bg" />
        <div className="shivering-btn-liquid-box">
          <Liquid isHovered={isHovered} colors={colors} />
        </div>

        {/* Layered glassy rim reflections */}
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`shivering-btn-rim shivering-btn-rim-${i}`}
          />
        ))}

        {/* Shivering core highlight */}
        <span className="shivering-btn-highlight" />

        {/* Interactive Trigger & Content */}
        <button
          className="shivering-btn-trigger"
          aria-label={ariaLabel}
          type="button"
          onClick={onClick}
        >
          {children}
        </button>
      </div>
    </div>
  );
};

export default ShiveringLiquidButton;
