import {
  useRef,
  type ComponentProps,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";

/** Real button semantics with independent, decorative reflection layers. */
export default function MetalButton({
  children,
  onPointerMove,
  onMouseMove,
  onPointerDown,
  kind = "secondary",
  ...props
}: ComponentProps<"button"> & { kind?: "primary" | "secondary" }) {
  const lightRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e);
    if (!lightRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const offsetX = kind === "primary" ? -20 + relX * 40 : -25 + relX * 50;
    if (reducedMotion) {
      lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0)`;
    } else {
      lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0) rotate(-16deg)`;
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e);
    if (!lightRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const offsetX = kind === "primary" ? -20 + relX * 40 : -25 + relX * 50;
    if (reducedMotion) {
      lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0)`;
    } else {
      lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0) rotate(-16deg)`;
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
    if (!lightRef.current) return;
    if (reducedMotion) {
      // Static state under reduced motion
      lightRef.current.style.transform = `translate3d(-20%, 0, 0)`;
      lightRef.current.style.opacity = "0.5";
    } else {
      lightRef.current.animate(
        [
          { transform: "translate3d(-80%, 0, 0) rotate(-16deg)", opacity: "0.8" },
          { transform: "translate3d(80%, 0, 0) rotate(-16deg)", opacity: "0.2" },
        ],
        { duration: 500, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    }
  };

  // Determine button variant styles based on kind
  const buttonBg = kind === "primary" ? "var(--ww-brand-primary)" : "var(--ww-card)";
  const buttonBorder = kind === "primary" ? "var(--ww-brand-primary)" : "var(--ww-border)";
  const buttonColor = kind === "primary" ? "#FFFFFF" : "var(--ww-ink)";
  const buttonFontWeight = kind === "primary" ? "500" : "500";

  return (
    <button
      data-metal="true"
      onPointerMove={handlePointerMove}
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      className={`button ${kind}`}
      style={{
        backgroundColor: buttonBg,
        borderColor: buttonBorder,
        color: buttonColor,
      }}
      {...props}
    >
      <span className="metal-rim-motion" aria-hidden="true">
        <span className="metal-environment" />
      </span>
      <span className="metal-reflection" aria-hidden="true">
        <span ref={lightRef} className="metal-light" />
      </span>
      <span className="metal-label">{children}</span>
    </button>
  );
}
