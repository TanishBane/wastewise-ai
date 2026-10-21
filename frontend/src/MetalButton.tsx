import type { ComponentProps } from "react";

/** Real button semantics with independent, decorative reflection layers. */
export default function MetalButton({
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button {...props}>
      <span className="metal-rim-motion" aria-hidden="true">
        <span className="metal-environment" />
      </span>
      <span className="metal-reflection" aria-hidden="true">
        <span className="metal-light" />
      </span>
      <span className="metal-label">{children}</span>
    </button>
  );
}
