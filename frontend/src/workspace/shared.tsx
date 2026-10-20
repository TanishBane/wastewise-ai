import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";

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
    <header className="page-heading">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </header>
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
  return (
    <section className={`panel ${className}`}>
      <header className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
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
  return (
    <div
      className="stats"
      style={{ "--stat-count": items.length } as React.CSSProperties}
    >
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <span className="stat-label">{item.label}</span>
          <div className={`stat-value ${item.tone || ""}`}>{item.value}</div>
          <span className="stat-note">{item.note}</span>
        </div>
      ))}
    </div>
  );
}
export function Loading({
  label = "Loading kitchen data…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={22} />
      <span>{label}</span>
      <div className="loading-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
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
      <button className="button" onClick={retry}>
        <RefreshCw size={15} />
        Try again
      </button>
      <span className="muted">
        Check that the backend is running on port 8000.
      </span>
    </div>
  );
}
export function Empty({
  title = "No dishes match",
  text = "Try another search or clear your filters.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
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
      className="dialog"
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
  return (
    <div className="batch-strip">
      <div className="batch-track" aria-hidden="true">
        <span style={{ flex: initial || 0.001 }} />
        <span style={{ flex: refill || 0.001 }} />
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
