import {
  ArrowRight,
  BarChart3,
  ChartNoAxesCombined,
  ChefHat,
  Database,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  PanelLeftClose,
  PanelLeftOpen,
  Sprout,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Page } from "./workspace/model";

const navLinks = [
  {
    id: "overview" as Page,
    label: "Kitchen overview",
    icon: LayoutDashboard,
    group: "plan" as const,
  },
  {
    id: "demand-forecast" as Page,
    label: "Demand forecast",
    icon: ChartNoAxesCombined,
    group: "plan" as const,
  },
  {
    id: "prep-planner" as Page,
    label: "Preparation planner",
    icon: ChefHat,
    group: "plan" as const,
  },
  {
    id: "waste-risk" as Page,
    label: "Surplus rescue",
    icon: TriangleAlert,
    group: "plan" as const,
  },
  {
    id: "performance" as Page,
    label: "Performance & impact",
    icon: BarChart3,
    group: "learn" as const,
  },
  {
    id: "data-model" as Page,
    label: "Data & model",
    icon: Database,
    group: "learn" as const,
  },
];

interface SidebarProps {
  page: Page;
  navigate: (page: Page, dish?: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenTour: () => void;
}

export default function Sidebar({
  page,
  navigate,
  collapsed,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
  onOpenTour,
}: SidebarProps) {
  const isCollapsed = collapsed && !isMobile;

  const handleNav = (targetPage: Page) => {
    navigate(targetPage);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const planLinks = navLinks.filter((l) => l.group === "plan");
  const learnLinks = navLinks.filter((l) => l.group === "learn");

  return (
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : "expanded"} ${isMobile ? "mobile-drawer" : ""}`}
      aria-label="Application navigation"
    >
      {/* 1. Brand Header & Collapse Toggle */}
      <div className="sidebar-header">
        <a
          className="sidebar-brand"
          href="#home"
          aria-label="WasteWise AI Home"
          onClick={(e) => {
            e.preventDefault();
            handleNav("home");
          }}
        >
          <span className="brand-mark">
            <img
              className="brand-logo"
              src="/brand/wastewise-mark.png"
              alt="WasteWise Logo"
              width="36"
              height="26"
            />
          </span>
          {!isCollapsed && (
            <span className="sidebar-brand-text">
              <span className="brand-title">
                WasteWise<span className="brand-ai">AI</span>
              </span>
              <small className="brand-subtitle">Kitchen intelligence</small>
            </span>
          )}
        </a>

        {isMobile ? (
          <button
            className="sidebar-toggle-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
            title="Close menu"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            aria-label={
              isCollapsed
                ? "Expand sidebar (Ctrl+[)"
                : "Collapse sidebar (Ctrl+[)"
            }
            title={
              isCollapsed
                ? "Expand sidebar (Ctrl+[)"
                : "Collapse sidebar (Ctrl+[)"
            }
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {isCollapsed && (
              <span className="nav-tooltip">Expand sidebar (Ctrl+[)</span>
            )}
          </button>
        )}
      </div>

      {/* 2. Workspace Identity Card */}
      <div
        className="workspace-card"
        title="Campus Green · Demo canteen workspace"
      >
        <span className="workspace-avatar-wrap">
          <span className="workspace-avatar">CG</span>
          {isCollapsed && (
            <span className="nav-tooltip">Campus Green · Demo canteen</span>
          )}
        </span>
        {!isCollapsed && (
          <div className="workspace-text">
            <strong>Campus Green</strong>
            <small>Demo canteen</small>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <div className="sidebar-nav-scroll">
        {/* 3. Primary Navigation: Home */}
        <a
          href="#home"
          className={`nav-link ${page === "home" ? "active" : ""}`}
          aria-current={page === "home" ? "page" : undefined}
          aria-label="Home"
          onClick={(e) => {
            e.preventDefault();
            handleNav("home");
          }}
        >
          <Sprout size={18} strokeWidth={1.8} className="nav-icon" />
          {!isCollapsed && <span className="nav-text">Home</span>}
          {isCollapsed && <span className="nav-tooltip">Home</span>}
        </a>

        {/* 4. Planning Group */}
        {!isCollapsed ? (
          <span className="nav-group-title">Plan this service</span>
        ) : (
          <div className="nav-group-divider" aria-hidden="true" />
        )}

        {planLinks.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`nav-link ${page === id ? "active" : ""}`}
            aria-current={page === id ? "page" : undefined}
            aria-label={label}
            onClick={(e) => {
              e.preventDefault();
              handleNav(id);
            }}
          >
            <Icon size={18} strokeWidth={1.8} className="nav-icon" />
            {!isCollapsed && <span className="nav-text">{label}</span>}
            {isCollapsed && <span className="nav-tooltip">{label}</span>}
          </a>
        ))}

        {/* 5. Learning & Maintenance Group */}
        {!isCollapsed ? (
          <span className="nav-group-title">Learn & maintain</span>
        ) : (
          <div className="nav-group-divider" aria-hidden="true" />
        )}

        {learnLinks.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`nav-link ${page === id ? "active" : ""}`}
            aria-current={page === id ? "page" : undefined}
            aria-label={label}
            onClick={(e) => {
              e.preventDefault();
              handleNav(id);
            }}
          >
            <Icon size={18} strokeWidth={1.8} className="nav-icon" />
            {!isCollapsed && <span className="nav-text">{label}</span>}
            {isCollapsed && <span className="nav-tooltip">{label}</span>}
          </a>
        ))}
      </div>

      {/* 6. Bottom Utility Area */}
      <div className="sidebar-bottom">
        {!isCollapsed ? (
          <div className="demo-invite">
            <div className="demo-invite-content">
              <FlaskConical size={16} className="invite-icon" />
              <div>
                <strong>See the whole workflow</strong>
                <p>From a demand forecast to a practical kitchen plan.</p>
              </div>
            </div>
            <button
              className="sidebar-tour-btn"
              onClick={onOpenTour}
              type="button"
            >
              <span>Take a quick tour</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <button
            className="collapsed-utility-btn"
            onClick={onOpenTour}
            type="button"
            title="Take a quick tour"
            aria-label="Take a quick tour"
          >
            <FlaskConical size={18} />
            <span className="nav-tooltip">Take a quick tour</span>
          </button>
        )}

        <div className={`sidebar-signature ${isCollapsed ? "collapsed" : ""}`}>
          <Leaf size={14} className="leaf-icon" />
          {!isCollapsed && <span>Make every portion count.</span>}
        </div>
      </div>
    </aside>
  );
}
