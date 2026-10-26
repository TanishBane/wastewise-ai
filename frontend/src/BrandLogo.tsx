import { useState } from "react";
import logoImg from "./assets/brand/wastewise-mark.png";

interface BrandLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export default function BrandLogo({
  className = "brand-logo",
  width = 36,
  height = 26,
  alt = "WasteWise Logo",
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <svg
        className={className}
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={alt}
      >
        <rect width="64" height="64" rx="12" fill="#24533d" />
        <g
          stroke="#eeeae1"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M32 49V27M32 37C14 37 14 20 14 20s18 0 18 17ZM32 28C32 11 50 11 50 11s0 17-18 17ZM20 49h24" />
        </g>
      </svg>
    );
  }

  return (
    <img
      src={logoImg}
      className={className}
      alt={alt}
      width={width}
      height={height}
      onError={() => setFailed(true)}
      loading="eager"
    />
  );
}
