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
  LogIn,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";
import { fetchConfig, fetchOverview, setAuthGetter } from "./api";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./workspace/AuthModal";
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
import { captureException, capturePageView } from "./telemetry";

const Overview = lazy(() => import("./workspace/Overview"));
const Home = lazy(() => import("./workspace/Home"));
const Scenario = lazy(() => import("./workspace/Scenario"));
const Rescue = lazy(() => import("./workspace/Rescue"));
const Performance = lazy(() => import("./workspace/Performance"));
const Data = lazy(() => import("./workspace/Data"));
const Guide = lazy(() => import("./workspace/Guide"));
const BackendApi = lazy(() => import("./workspace/BackendApi"));

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
  {
    id: "backend-api",
    label: "Backend & Live API",
    icon: Server,
    description: "FastAPI service telemetry, live tester & interactive Swagger UI",
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
  return allPages.includes(hash) ? (hash as Page) : "overview";
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
  const {
    user,
    accessToken,
    profile,
    activeOrg,
    organizations,
    recoveryMode,
    setActiveOrgId,
    signOut,
  } = useAuth();

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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Synchronize authentication tokens with API layer
  useEffect(() => {
    setAuthGetter(() => ({
      token: accessToken,
      orgId: activeOrg?.id ?? null,
    }));
  }, [accessToken, activeOrg]);

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

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [page, revision]);

  const navigate = (next: Page, item?: string) => {
    if (item) setDish(item);
    setPage(next);
    window.location.hash = next;
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const change = () => setPage(currentHash());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);

  useEffect(() => {
    document.title = `${page === "home" ? "Home" : links.find((link) => link.id === page)?.label || "Help & transparency"} · WasteWise AI`;
  }, [page]);

  useEffect(() => {
    const pointer = () => {
      document.documentElement.dataset.interaction = "pointer";
    };
    const keyboard = () => {
      document.documentElement.dataset.interaction = "keyboard";
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", keyboard);
    };
  }, []);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("input,textarea,select,[contenteditable=true]")
      ) {
        return;
      }

      if (event.key === "Escape") {
        if (menuOpen) {
          event.preventDefault();
          setMenuOpen(false);
        }
        return;
      }

      if (event.key === "?" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        navigate("help");
      }
      if (
        (event.key === "/" ||
          (event.key.toLowerCase() === "k" &&
            (event.metaKey || event.ctrlKey))) &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (
        (event.key === "[" ||
          (event.key.toLowerCase() === "b" &&
            (event.metaKey || event.ctrlKey))) &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menuOpen]);

  const exportReport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const result = await fetchOverview();
      downloadCSV(`wastewise-menu-${result.service_date}.csv`, [
        [
          "Service date",
          "Source",
          "Dish",
          "Category",
          "Forecast portions",
          "Lower estimate",
          "Upper estimate",
          "Recommended prep",
          "Initial batch",
          "Refill trigger",
          "Ingredient cost at risk INR",
        ],
        ...result.item_details.map((row) => [
          result.service_date,
          result.is_synthetic
            ? "Synthetic demonstration"
            : "Uploaded operator records",
          row.menu_item,
          row.category,
          row.predicted_demand,
          row.lower_bound,
          row.upper_bound,
          row.recommended_prep,
          row.initial_batch,
          row.refill_trigger,
          row.naive_exposure,
        ]),
      ]);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Export failed. Try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  const screen: ScreenProps | null = config.data
    ? {
        config: config.data,
        revision,
        navigate,
        dish,
        onDataChange: () => setRevision((value) => value + 1),
      }
    : null;

  const tour = [
    {
      title: "Start with the kitchen’s day",
      text: "The overview brings menu forecasts, preparation targets, and surplus priorities together. All figures reflect the active dataset.",
      page: "overview" as Page,
    },
    {
      title: "Test a different kind of day",
      text: "Explore a campus event, changing attendance, or rainy weather in Demand forecast. These are scenarios, not recorded sales.",
      page: "demand-forecast" as Page,
    },
    {
      title: "Turn demand into a batch plan",
      text: "Factor in existing stock and the cost of running out. Review what to cook now and what to hold for refill.",
      page: "prep-planner" as Page,
    },
    {
      title: "Act on surplus, then learn",
      text: "Review rescue priorities and inspect holdout performance. Impact figures are retrospective simulations until measured in a real pilot.",
      page: "waste-risk" as Page,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-frame ${collapsed ? "sidebar-collapsed" : ""}`}>
        <a
          className="skip-link"
          href="#main"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById("main")?.focus();
          }}
        >
          Skip to content
        </a>

        {/* Desktop Sidebar Rail */}
        <Sidebar
          page={page}
          navigate={navigate}
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
          onOpenTour={() => {
            setTourStep(0);
            setTourOpen(true);
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <div className="workspace">
          <header className="workspace-bar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation drawer"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <a
                className="mobile-brand"
                href="#home"
                aria-label="WasteWise AI home"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("home");
                }}
              >
                <img
                  className="brand-logo mobile-brand-logo"
                  src="/brand/wastewise-mark.png"
                  alt="WasteWise Logo"
                  width="28"
                  height="20"
                />
                <span>
                  WasteWise<small>AI</small>
                </span>
              </a>
              <strong>
                {page === "home"
                  ? "Home"
                  : links.find((link) => link.id === page)?.label ||
                    (page === "help"
                      ? "Help & getting started"
                      : page === "transparency"
                        ? "Model transparency"
                        : "Resources")}
              </strong>
            </div>

            {/* Top-Right Utility Navigation Controls */}
            <div className="workspace-tools">
              <button
                className="utility-button search-trigger"
                onClick={() => setSearchOpen(true)}
                title="Quick search dishes and views (Ctrl+K or /)"
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
                className={`utility-button icon-label ${page === "backend-api" ? "active" : ""}`}
                onClick={() => navigate("backend-api")}
                title="View live FastAPI backend, Swagger docs & service telemetry"
                aria-label="Backend & Live API status"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Server size={15} />
                  <span className="utility-label font-medium">FastAPI Live</span>
                </span>
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

              {user ? (
                <div className="relative">
                  <button
                    className="workspace-profile-pill"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    title={`${activeOrg?.name || "ADAPPT Canteen"} · ${user.email}`}
                    aria-label="User account and organization menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span className="operator-avatar">
                      {(
                        profile?.full_name?.slice(0, 2) ||
                        user.email?.slice(0, 2) ||
                        "CG"
                      ).toUpperCase()}
                    </span>
                    <div className="workspace-pill-info">
                      <strong>{activeOrg?.name || "ADAPPT Canteen"}</strong>
                      <small>
                        {activeOrg?.role ? `${activeOrg.role} · ` : ""}
                        {config.data?.is_synthetic ? "Demo Data" : "Live CSV"}
                      </small>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface,#fcfaf5)] border border-[var(--border,#d4cdbf)] shadow-2xl p-3 z-50 text-xs text-[var(--ink,#1f2923)]">
                      <div className="border-b border-[var(--border,#d4cdbf)] pb-2 mb-2">
                        <p className="font-bold text-sm truncate">
                          {profile?.full_name || "Canteen Operator"}
                        </p>
                        <p className="text-[var(--ink-light,#666)] truncate">
                          {user.email}
                        </p>
                      </div>

                      {organizations.length > 1 && (
                        <div className="mb-2">
                          <p className="font-semibold text-[10px] uppercase tracking-wider text-[var(--ink-light,#666)] mb-1">
                            Switch Canteen
                          </p>
                          <div className="space-y-1">
                            {organizations.map((org) => (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => {
                                  setActiveOrgId(org.id);
                                  setUserMenuOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition ${
                                  org.id === activeOrg?.id
                                    ? "bg-[var(--surface-muted,#eee9de)] font-semibold text-[var(--primary,#1e4638)]"
                                    : "hover:bg-[var(--surface-muted,#eee9de)]"
                                }`}
                              >
                                <span className="truncate">{org.name}</span>
                                <span className="text-[10px] text-[var(--ink-light,#666)] uppercase">
                                  {org.role}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigate("data-model");
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[var(--surface-muted,#eee9de)] text-[var(--ink,#1f2923)] transition flex items-center gap-1.5"
                        >
                          <Database size={13} />
                          <span>Dataset & Outlets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-700 transition flex items-center gap-1.5 font-medium"
                        >
                          <LogOut size={13} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <MetalButton
                  onClick={() => setAuthModalOpen(true)}
                  className="button primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </MetalButton>
              )}
            </div>
          </header>

          <main
            id="main"
            className={`work-sheet ${page === "home" ? "home-sheet" : ""}`}
            tabIndex={-1}
          >
            <div className="source-bar">
              <div>
                <span
                  className={`status-dot ${config.data?.is_synthetic ? "amber" : ""}`}
                />
                <strong>
                  {config.data
                    ? config.data.is_synthetic
                      ? "Demo workspace"
                      : "Operator dataset"
                    : "Connecting to workspace"}
                </strong>
                <span className="source-detail">
                  {config.data?.is_synthetic
                    ? "Synthetic data · explore without affecting your kitchen"
                    : config.data
                      ? "Forecasts from your uploaded service records"
                      : "Waiting for the local API"}
                </span>
              </div>
              <button
                className="text-link"
                onClick={() => navigate("data-model")}
              >
                {config.data?.is_synthetic
                  ? "Connect your data"
                  : "Manage data"}
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="page-tools">
              <span>
                <CalendarDays size={15} />
                Service date: {date(config.data?.latest_date)}
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Refresh workspace"
                  disabled={config.loading}
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <RefreshCw
                    size={16}
                    className={config.loading ? "spin" : ""}
                  />
                </button>
                <AsyncButton
                  className="button small"
                  onClick={exportReport}
                  disabled={!config.data}
                  busy={exporting}
                  busyLabel="Exporting menu…"
                >
                  <ArrowDownToLine size={15} />
                  {exporting ? "Exporting…" : "Export menu"}
                </AsyncButton>
              </div>
            </div>

            {exportError && (
              <div className="inline-error" role="alert">
                {exportError}
                <button className="text-link" onClick={exportReport}>
                  Retry export
                </button>
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
                    ) : page === "backend-api" ? (
                      <BackendApi {...screen} />
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
                Thoughtful prep. Less waste.
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
        />
        <div
          className={`mobile-drawer-container ${menuOpen ? "open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
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
            onOpenAuth={() => {
              setAuthModalOpen(true);
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

        {/* Supabase Authentication & Recovery Modal */}
        <AuthModal
          open={authModalOpen || recoveryMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
