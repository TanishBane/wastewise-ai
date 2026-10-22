import {
  useRef,
  type ComponentProps,
  type MouseEvent,
  type PointerEvent,
} from "react";

/** Real button semantics with independent, decorative reflection layers. */
export default function MetalButton({
  children,
  onPointerMove,
  onMouseMove,
  onPointerDown,
  ...props
}: ComponentProps<"button">) {
  const lightRef = useRef<HTMLSpanElement>(null);

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(e);
    if (!lightRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const offsetX = -25 + relX * 50;
    lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0) rotate(-16deg)`;
  };

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e);
    if (!lightRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const offsetX = -25 + relX * 50;
    lightRef.current.style.transform = `translate3d(${offsetX.toFixed(2)}%, 0, 0) rotate(-16deg)`;
  };

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e);
    if (!lightRef.current) return;
    lightRef.current.animate(
      [
        { transform: "translate3d(-80%, 0, 0) rotate(-16deg)", opacity: "0.8" },
        { transform: "translate3d(80%, 0, 0) rotate(-16deg)", opacity: "0.2" },
      ],
      { duration: 500, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  };

  return (
    <button
      data-metal="true"
      onPointerMove={handlePointerMove}
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
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
