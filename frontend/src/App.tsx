import MetalButton from "./MetalButton";
import { MotionConfig } from "framer-motion";
import { PageTransition } from "./motion";
import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  ChefHat,
  Database,
  HelpCircle,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";
import { fetchConfig, fetchOverview } from "./api";
import {
  AsyncButton,
  Badge,
  Dialog,
  ErrorState,
  Loading,
} from "./workspace/shared";
import { date, downloadCSV, useResource } from "./workspace/model";
import type { Page, ScreenProps } from "./workspace/model";
import QuickSearchDialog from "./workspace/QuickSearchDialog";
import Sidebar from "./Sidebar";
import BrandLogo from "./BrandLogo";
import { captureException, capturePageView } from "./telemetry";

const Overview = lazy(() => import("./workspace/Overview"));
const Home = lazy(() => import("./workspace/Home"));
const Scenario = lazy(() => import("./workspace/Scenario"));
const Rescue = lazy(() => import("./workspace/Rescue"));
const Performance = lazy(() => import("./workspace/Performance"));
const Data = lazy(() => import("./workspace/Data"));
const Guide = lazy(() => import("./workspace/Guide"));

const links = [
  {
    id: "overview",
    label: "Kitchen overview",
    icon: LayoutDashboard,
    description: "Today’s menu and kitchen priorities",
  },
  {
    id: "demand-forecast",
    label: "Demand forecast",
    icon: ChartNoAxesCombined,
    description: "Explore demand and its uncertainty",
  },
  {
    id: "prep-planner",
    label: "Preparation planner",
    icon: ChefHat,
    description: "Choose batches and inventory",
  },
  {
    id: "waste-risk",
    label: "Surplus rescue",
    icon: TriangleAlert,
    description: "Review potential waste and actions",
  },
  {
    id: "performance",
    label: "Performance & impact",
    icon: BarChart3,
    description: "Model evaluation and simulated impact",
  },
  {
    id: "data-model",
    label: "Data & model",
    icon: Database,
    description: "Upload and inspect your records",
  },
] as const;

const allPages: string[] = [
  "home",
  ...links.map((link) => link.id),
  "help",
  "privacy",
  "terms",
  "transparency",
];

const currentHash = (): Page => {
  const hash = window.location.hash.slice(1);
  if (
    hash === "backend-api" ||
    hash === "auth" ||
    hash === "login" ||
    hash === "register"
  ) {
    return "home";
  }
  return allPages.includes(hash) ? (hash as Page) : "home";
};

class ViewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("View error", error, info);
    captureException(error);
  }
  render() {
    return this.state.failed ? (
      <ErrorState
        message="The page could not be displayed. Reload to recover."
        retry={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  const [page, setPage] = useState<Page>(currentHash);
  const [revision, setRevision] = useState(0);
  const config = useResource(fetchConfig, revision);
  const [dish, setDish] = useState("Pav Bhaji");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showScrollBlur, setShowScrollBlur] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("wastewise-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("wastewise-sidebar-collapsed", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    capturePageView(page);
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isOverflowing = docHeight > windowHeight + 32;
      const isAtBottom = scrollY + windowHeight >= docHeight - 24;
      setShowScrollBlur(isOverflowing && !isAtBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [page]);

  useEffect(() => {
    const update = () => {
      const next = currentHash();
      setPage(next);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const navigate = (next: Page, nextDish?: string) => {
    if (nextDish) setDish(nextDish);
    window.location.hash = next;
    setPage(next);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        navigate("help");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleExportTodayPlan = async () => {
    try {
      setExporting(true);
      setExportError("");
      const overview = await fetchOverview();
      const header = [
        "Menu Item",
        "Category",
        "Predicted Demand",
        "Recommended Prep",
        "Initial Batch",
        "Refill Trigger",
        "Cost Per Portion (INR)",
        "Naive Exposure (INR)",
      ];
      const rows: (string | number)[][] = [
        header,
        ...overview.item_details.map((it) => [
          it.menu_item,
          it.category,
          it.predicted_demand,
          it.recommended_prep,
          it.initial_batch,
          it.refill_trigger,
          it.cost_per_portion,
          it.naive_exposure,
        ]),
      ];
      downloadCSV(
        `wastewise_production_plan_${overview.service_date}.csv`,
        rows,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to export kitchen production plan.";
      setExportError(msg);
      captureException(err);
    } finally {
      setExporting(false);
    }
  };

  const currentLabel =
    page === "home"
      ? "WasteWise AI"
      : links.find((link) => link.id === page)?.label || "Guidance";
  const currentDescription =
    page === "home"
      ? "Food waste triage, dynamic demand forecasting & preparation optimization for Indian canteens."
      : links.find((link) => link.id === page)?.description ||
        "Product capabilities, algorithms & methodology";

  const tour = [
    {
      page: "home" as Page,
      title: "WasteWise AI Platform",
      text: "Explore how machine learning demand forecasting and Newsvendor optimization minimize avoidable food waste in institutional kitchens.",
    },
    {
      page: "overview" as Page,
      title: "Operational kitchen status",
      text: "Review today's menu, demand outlook, and prep priorities at a glance before kitchen firing begins.",
    },
    {
      page: "demand-forecast" as Page,
      title: "Demand forecasting",
      text: "Examine expected demand and its uncertainty ranges across weather shifts, campus events, and attendance changes.",
    },
    {
      page: "prep-planner" as Page,
      title: "Preparation planning",
      text: "Balance stockout risks and surplus waste costs with staged batch production recommendations.",
    },
    {
      page: "waste-risk" as Page,
      title: "Surplus rescue triage",
      text: "Classify end-of-service surplus and trigger cold-chain donations or hostel redistribution before food expires.",
    },
  ];

  const screen: ScreenProps | null = config.data
    ? {
        config: config.data,
        revision,
        navigate,
        dish,
        onDataChange: () => setRevision((value) => value + 1),
      }
    : null;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <div
        className={`app-frame app-shell ${collapsed ? "sidebar-collapsed collapsed" : ""}`}
      >
        <a href="#main" className="skip-link">
          Skip to main operational content
        </a>

        {/* Responsive Desktop / Mobile Collapsible Sidebar */}
        <Sidebar
          page={page}
          navigate={navigate}
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
          onOpenTour={() => {
            setTourStep(0);
            setTourOpen(true);
          }}
        />

        <div className={`workspace page-column ${collapsed ? "expanded" : ""}`}>
          <header className="workspace-bar top-bar">
            <div className="top-bar-left">
              <button
                type="button"
                className="mobile-menu-trigger"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

              <div className="mobile-brand-wrapper">
                <a
                  href="#home"
                  className="mobile-brand-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("home");
                  }}
                  aria-label="WasteWise AI Homepage"
                >
                  <BrandLogo width={28} height={20} />
                  <span className="mobile-brand-title">WasteWise AI</span>
                </a>
              </div>

              <div className="title-block">
                <div className="title-row">
                  <h1>{currentLabel}</h1>
                  <span className="header-edition-badge">DEMO</span>
                </div>
                <p>{currentDescription}</p>
              </div>
            </div>

            <div className="top-bar-actions">
              <button
                className="search-trigger-button"
                onClick={() => setSearchOpen(true)}
                title="Search dishes & views (/)"
                aria-label="Search dishes and views"
              >
                <Search size={15} />
                <span className="search-label">Search dishes & views…</span>
                <kbd className="search-kbd">/</kbd>
              </button>

              <button
                className={`utility-button icon-label ${page === "help" ? "active" : ""}`}
                onClick={() => navigate("help")}
                title="Help & getting started (?)"
                aria-label="Help & getting started"
              >
                <HelpCircle size={16} />
                <span className="utility-label">Help</span>
              </button>

              <button
                className={`utility-button icon-label ${page === "transparency" ? "active" : ""}`}
                onClick={() => navigate("transparency")}
                title="Model transparency & limits"
                aria-label="Model transparency"
              >
                <ShieldCheck size={16} />
                <span className="utility-label">Transparency</span>
              </button>

              {/* Global Demo Mode Indicator */}
              <div
                className="demo-global-pill"
                role="status"
                aria-label="Demonstration environment indicator"
                title="Public demonstration environment using synthetic canteen operational data"
              >
                <span className="demo-pill-dot" aria-hidden="true" />
                <span className="demo-pill-title">DEMO MODE</span>
                <span className="demo-pill-sep" aria-hidden="true">
                  ·
                </span>
                <span className="demo-pill-text">Sample Canteen Data</span>
              </div>
            </div>
          </header>

          <main
            id="main"
            className={`work-sheet ${page === "home" ? "home-sheet" : ""}`}
            tabIndex={-1}
          >
            <div className="source-bar">
              <div>
                <span className="status-dot amber" aria-hidden="true" />
                <strong>Demo workspace</strong>
                <span>
                  {config.data ? config.data.workspace : "ADAPPT Canteen"}
                </span>
                {config.data?.latest_date && (
                  <span className="source-bar-date">
                    <CalendarDays size={13} aria-hidden="true" />
                    <span>Reference {date(config.data.latest_date)}</span>
                  </span>
                )}
              </div>

              <div className="source-actions">
                <AsyncButton
                  className="button"
                  busy={config.loading}
                  busyLabel="Updating…"
                  onClick={() => setRevision((value) => value + 1)}
                  title="Refresh demo workspace state"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </AsyncButton>

                {page === "overview" && (
                  <AsyncButton
                    className="button"
                    busy={exporting}
                    busyLabel="Exporting…"
                    onClick={handleExportTodayPlan}
                    title="Export today's kitchen preparation plan to CSV"
                  >
                    <ArrowDownToLine size={14} />
                    <span>Export Plan</span>
                  </AsyncButton>
                )}
              </div>
            </div>

            {exportError && (
              <div className="inline-banner alert" role="alert">
                <TriangleAlert size={16} />
                <span>{exportError}</span>
              </div>
            )}

            <ViewBoundary key={page}>
              <Suspense fallback={<Loading label="Opening workspace…" />}>
                <PageTransition pageKey={page}>
                  {page === "home" ? (
                    <Home navigate={navigate} />
                  ) : config.loading && !config.data ? (
                    <Loading />
                  ) : config.error ? (
                    <ErrorState message={config.error} retry={config.retry} />
                  ) : screen ? (
                    page === "overview" ? (
                      <Overview {...screen} />
                    ) : page === "demand-forecast" ||
                      page === "prep-planner" ? (
                      <Scenario
                        key={page + dish + revision}
                        {...screen}
                        kind={page}
                      />
                    ) : page === "waste-risk" ? (
                      <Rescue {...screen} />
                    ) : page === "performance" ? (
                      <Performance {...screen} />
                    ) : page === "data-model" ? (
                      <Data {...screen} />
                    ) : (
                      <Guide {...screen} page={page} />
                    )
                  ) : null}
                </PageTransition>
              </Suspense>
            </ViewBoundary>

            <footer className="workspace-footer">
              <span>
                <Sprout size={14} />
                WasteWise AI <span className="footer-divider">/</span>{" "}
                Demonstration Environment · Synthetic Canteen Operations
              </span>
              <div>
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
                <span>ADAPPT 5.0</span>
              </div>
            </footer>
          </main>

          <div
            className="scroll-frosted-edge"
            aria-hidden="true"
            style={{ opacity: showScrollBlur ? 1 : 0 }}
          />
        </div>

        {/* Mobile Slide-in Navigation Drawer */}
        <div
          className={`mobile-drawer-backdrop ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden={!menuOpen}
        >
          <Sidebar
            page={page}
            navigate={navigate}
            collapsed={false}
            onToggleCollapse={() => {}}
            isMobile={true}
            onCloseMobile={() => setMenuOpen(false)}
            onOpenTour={() => {
              setTourStep(0);
              setTourOpen(true);
              setMenuOpen(false);
            }}
          />
        </div>

        {/* Guided Tour Modal */}
        <Dialog
          open={tourOpen}
          onClose={() => setTourOpen(false)}
          title="A better service, one decision at a time"
        >
          <div className="tour-content">
            <Badge tone="positive">
              Step {tourStep + 1} of {tour.length}
            </Badge>
            <h3>{tour[tourStep].title}</h3>
            <p>{tour[tourStep].text}</p>
            <div className="tour-steps" aria-hidden="true">
              {tour.map((_, index) => (
                <span
                  key={index}
                  className={index <= tourStep ? "complete" : ""}
                />
              ))}
            </div>
            <div className="button-row">
              <MetalButton
                className="button"
                onClick={() => {
                  navigate(tour[tourStep].page);
                  setTourOpen(false);
                }}
              >
                Explore this view
              </MetalButton>
              <MetalButton
                className="button primary"
                onClick={() =>
                  tourStep < tour.length - 1
                    ? setTourStep((value) => value + 1)
                    : setTourOpen(false)
                }
              >
                {tourStep < tour.length - 1 ? "Next step" : "Ready to explore"}
                <ArrowRight size={16} />
              </MetalButton>
            </div>
          </div>
        </Dialog>

        {/* Quick Search Dialog */}
        <QuickSearchDialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          config={config.data}
          onSelectDish={(selected) => setDish(selected)}
          onNavigate={(targetPage, targetDish) =>
            navigate(targetPage, targetDish)
          }
        />
      </div>
    </MotionConfig>
  );
}
