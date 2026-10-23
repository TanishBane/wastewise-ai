import MetalButton from "../MetalButton";
import { useEffect, useId, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { ScrollReveal, StaggerGroup, StaggerItem } from "../motion";

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    document
      .querySelector<HTMLHeadingElement>(".page-heading h1")
      ?.focus({ preventScroll: true });
  }, []);
  return (
    <ScrollReveal direction="up" distance={12} duration={0.45} threshold={0.05}>
      <header className="page-heading">
        <div>
          <h1 tabIndex={-1}>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="heading-actions">{children}</div>
      </header>
    </ScrollReveal>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const trackPointer = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - bounds.top}px`,
    );
  };
  return (
    <ScrollReveal direction="up" distance={14} duration={0.5} threshold={0.08}>
      <section
        className={`panel interactive-surface ${className}`}
        onPointerMove={trackPointer}
      >
        <header className="panel-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </header>
        {children}
      </section>
    </ScrollReveal>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
export function RiskBadge({ level }: { level: string }) {
  return (
    <Badge
      tone={
        level === "High"
          ? "danger"
          : level === "Moderate"
            ? "warning"
            : "positive"
      }
    >
      {level} risk
    </Badge>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: ReactNode; note: string; tone?: string }[];
}) {
  const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - bounds.top}px`,
    );
  };
  return (
    <StaggerGroup
      className="stats interactive-surface"
      onPointerMove={trackPointer}
      style={{ "--stat-count": items.length } as React.CSSProperties}
      staggerDelay={0.07}
    >
      {items.map((item) => (
        <StaggerItem
          className="stat"
          key={item.label}
          distance={12}
          duration={0.45}
        >
          <span className="stat-label">{item.label}</span>
          <div className={`stat-value ${item.tone || ""}`}>{item.value}</div>
          <span className="stat-note">{item.note}</span>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
export function Loading({
  label = "Loading kitchen data…",
  variant = "overview",
  showIndicator = true,
}: {
  label?: string;
  variant?: "overview" | "scenario";
  showIndicator?: boolean;
}) {
  return (
    <div className="loading-state" role="status" aria-busy="true">
      <div className="loading-label">
        {showIndicator && <LoaderCircle className="spin" size={20} />}
        <span>{label}</span>
      </div>
      <div
        className={`workspace-skeleton skeleton-${variant}`}
        aria-hidden="true"
      >
        <div className="skeleton-stats">
          {(variant === "scenario" ? [0, 1, 2] : [0, 1, 2, 3]).map((index) => (
            <div
              key={index}
              style={{ "--skeleton-order": index } as React.CSSProperties}
            >
              <span />
              <strong />
              <span />
            </div>
          ))}
        </div>
        <div className="skeleton-work">
          <div className="skeleton-chart">
            <span />
            <div>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <i key={index} />
              ))}
            </div>
          </div>
          <div className="skeleton-list">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
        <div className="skeleton-rows">
          {[0, 1, 2, 3].map((index) => (
            <div key={index}>
              <span />
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AsyncButton({
  busy,
  busyLabel,
  children,
  className = "button",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy: boolean;
  busyLabel: string;
}) {
  return (
    <MetalButton
      {...props}
      className={`${className} async-button`}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {busy ? (
        <>
          <LoaderCircle className="spin" size={16} />
          <span>{busyLabel}</span>
        </>
      ) : (
        children
      )}
      {busy && <span className="button-activity" aria-hidden="true" />}
    </MetalButton>
  );
}

export function CalculationStages({
  stage,
  planning,
}: {
  stage: "forecast" | "plan";
  planning: boolean;
}) {
  return (
    <ol className="calculation-stages" aria-label="Calculation progress">
      <li
        className={stage === "plan" ? "complete" : "current"}
        aria-current={stage === "forecast" ? "step" : undefined}
      >
        {stage === "plan" ? (
          <Check size={14} />
        ) : (
          <LoaderCircle size={14} className="spin" />
        )}
        <span>Estimate demand</span>
      </li>
      {planning && (
        <li
          className={stage === "plan" ? "current" : ""}
          aria-current={stage === "plan" ? "step" : undefined}
        >
          {stage === "plan" ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <span className="stage-pending" />
          )}
          <span>Balance stock & cost</span>
        </li>
      )}
    </ol>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} />
      <h2>We couldn’t load this view</h2>
      <p>{message}</p>
      <MetalButton className="button" onClick={retry}>
        <RefreshCw size={15} />
        Try again
      </MetalButton>
      <span className="muted">
        Check that the backend is running on port 8000.
      </span>
    </div>
  );
}
export function Empty({
  title = "No dishes match",
  text = "Try another search or clear your filters.",
  action,
  icon: Icon,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="empty-state" role="status">
      {Icon ? (
        <Icon size={32} className="empty-state-icon" />
      ) : (
        <Search size={32} className="empty-state-icon" />
      )}
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={14} />
    </button>
  );
}
export function Notice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`notice ${tone}`}>
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  instant = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  instant?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      const prior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prior;
      };
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`dialog ${instant ? "dialog-instant" : ""}`}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function BatchStrip({
  initial,
  total,
  stock = 0,
}: {
  initial: number;
  total: number;
  stock?: number;
}) {
  const refill = Math.max(0, total - initial);
  if (total <= 0) {
    return (
      <div className="batch-strip">
        <div className="batch-labels">
          <span>No new batch planned</span>
          {stock > 0 && (
            <span>
              In stock <strong>{stock}</strong>
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="batch-strip">
      <div className="batch-track" aria-hidden="true">
        {initial > 0 && (
          <span style={{ flex: initial, transition: "flex 0.5s ease-out" }} />
        )}
        {refill > 0 && (
          <span style={{ flex: refill, transition: "flex 0.5s ease-out" }} />
        )}
      </div>
      <div className="batch-labels">
        <span>
          <i />
          Cook now <strong>{initial}</strong>
        </span>
        <span>
          <i />
          Hold for refill <strong>{refill}</strong>
        </span>
        {stock > 0 && (
          <span>
            In stock <strong>{stock}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
export function SavedNote({ children }: { children: ReactNode }) {
  return (
    <div className="saved-note" role="status">
      <Check size={16} />
      {children}
    </div>
  );
}
