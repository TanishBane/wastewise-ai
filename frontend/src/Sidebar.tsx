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
import BrandLogo from "./BrandLogo";

/* Nav link groups — matched to DESIGN.md 60-30-10 distribution */
const navLinks = [
  {
    id: "home" as Page,
    label: "Product homepage",
    icon: Sprout,
    group: "plan" as const,
  },
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

  const planLinks = navLinks.filter((link) => link.group === "plan");
  const learnLinks = navLinks.filter((link) => link.group === "learn");

  return (
    <aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile-drawer" : ""}`}
      aria-label="Sidebar navigation"
    >
      {/* 1. Header / Brand */}
      <div className="sidebar-header">
        <a
          href="#home"
          className="sidebar-brand-link"
          onClick={(e) => {
            e.preventDefault();
            handleNav("home");
          }}
          aria-label="WasteWise AI Homepage"
        >
          <div className="brand-icon-wrap">
            <BrandLogo width={36} height={26} />
          </div>
          {!isCollapsed && (
            <div className="brand-text-block">
              <span className="brand-title">WasteWise AI</span>
              <span className="brand-edition">DEMO EDITION</span>
            </div>
          )}
        </a>

        {/* Mobile close button */}
        {isMobile && (
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        )}
      </div>

      {/* 2. Primary Navigation Links */}
      <div className="sidebar-nav-group">
        {!isCollapsed && (
          <span className="sidebar-section-heading">Operational Plan</span>
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
      </div>

      {/* 3. Secondary Navigation Links */}
      <div className="sidebar-nav-group">
        {!isCollapsed && (
          <span className="sidebar-section-heading">Intelligence</span>
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

      {/* 4. Bottom Utility Area */}
      <div className="sidebar-bottom">
        {/* Demo Mode Badge */}
        {!isCollapsed ? (
          <div
            className="sidebar-demo-badge"
            role="status"
            aria-label="Demonstration environment status"
          >
            <div className="demo-badge-content">
              <span className="demo-pulse-dot" aria-hidden="true" />
              <div className="demo-badge-text">
                <span className="demo-badge-title">DEMO ENVIRONMENT</span>
                <span className="demo-badge-subtitle">
                  Sample canteen data · Public access
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mb-2 flex justify-center"
            title="DEMO ENVIRONMENT · Sample Canteen Data"
          >
            <span
              className="demo-pulse-dot"
              aria-label="Demo environment active"
            />
          </div>
        )}

        {!isCollapsed ? (
          <div className="demo-invite">
            <div className="demo-invite-content">
              <FlaskConical size={16} className="invite-icon" />
              <div>
                <strong>Explore the workflow</strong>
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
          {!isCollapsed && (
            <div className="sidebar-foot-meta">
              <span>Make every portion count.</span>
              <a
                href="https://adappt.ietempstme.com"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-adappt-badge"
                title="Visit ADAPPT platform (adappt.ietempstme.com)"
              >
                ADAPPT 5.0 ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
