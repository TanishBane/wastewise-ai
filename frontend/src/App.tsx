import MetalButton from "./MetalButton";
import {
  Component,
  Fragment,
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChartNoAxesCombined,
  ChefHat,
  ChevronRight,
  Database,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Leaf,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const navigate = (next: Page, item?: string) => {
    if (item) setDish(item);
    setPage(next);
    window.location.hash = next;
    setMenuOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const change = () => setPage(currentHash());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = `${page === "home" ? "Home" : links.find((link) => link.id === page)?.label || "Help & transparency"} · WasteWise`;
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setTourOpen(false);
        setSearchOpen((value) => !value);
        return;
      }
      if (
        (event.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable=true]",
        )
      )
        return;
      if (event.key === "?" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        navigate("help");
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
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
  const nav = (
    <>
      <a
        className="brand"
        href="#home"
        aria-label="WasteWise AI home"
        onClick={(event) => {
          event.preventDefault();
          navigate("home");
        }}
      >
        <span className="brand-mark">
          <Sprout size={24} strokeWidth={1.8} />
        </span>
        <span>
          WasteWise<span className="brand-ai">AI</span>
          <small>Kitchen intelligence</small>
        </span>
      </a>
      <div className="workspace-name">
        <span className="workspace-avatar">CG</span>
        <div>
          <strong>Campus Green</strong>
          <small>Demo canteen</small>
        </div>
      </div>
      <span className="nav-label">Plan this service</span>
      <a
        href="#home"
        className={`nav-link ${page === "home" ? "active" : ""}`}
        aria-current={page === "home" ? "page" : undefined}
        onClick={(event) => {
          event.preventDefault();
          navigate("home");
        }}
      >
        <Sprout size={18} strokeWidth={1.7} />
        <span>Home</span>
        {page === "home" && <span className="nav-active-dot" />}
      </a>
      <nav aria-label="Main navigation">
        {links.map(({ id, label, icon: Icon }, index) => (
          <Fragment key={id}>
            {index === 4 && (
              <span className="nav-label nav-group-label">
                Learn & maintain
              </span>
            )}
            <a
              key={id}
              href={`#${id}`}
              className={`nav-link ${page === id ? "active" : ""}`}
              aria-current={page === id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigate(id);
              }}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {page === id && <span className="nav-active-dot" />}
            </a>
          </Fragment>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-invite">
          <FlaskConical size={19} />
          <strong>See the whole workflow</strong>
          <p>From a demand forecast to a better kitchen plan.</p>
          <MetalButton
            onClick={() => {
              setTourStep(0);
              setTourOpen(true);
              setMenuOpen(false);
            }}
          >
            Take a quick tour
            <ArrowRight size={15} />
          </MetalButton>
        </div>
        <a
          className="nav-link"
          href="#help"
          onClick={(event) => {
            event.preventDefault();
            navigate("help");
          }}
        >
          <HelpCircle size={18} />
          Help & getting started
        </a>
        <a
          className="nav-link"
          href="#transparency"
          onClick={(event) => {
            event.preventDefault();
            navigate("transparency");
          }}
        >
          <ShieldCheck size={18} />
          Model transparency
        </a>
        <div className="sidebar-signature">
          <Leaf size={14} />
          <span>Make every portion count.</span>
        </div>
      </div>
    </>
  );
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
      page: "performance" as Page,
    },
  ];
  return (
    <div className="app-frame">
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
      <aside className="sidebar">{nav}</aside>
      <div className="workspace">
        <header className="workspace-bar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <a
              className="mobile-brand"
              href="#home"
              aria-label="WasteWise AI home"
              onClick={(event) => {
                event.preventDefault();
                navigate("home");
              }}
            >
              <Sprout size={19} />
              <span>
                WasteWise<small>AI</small>
              </span>
            </a>
            <strong>
              {page === "home"
                ? "Home"
                : links.find((link) => link.id === page)?.label || "Resources"}
            </strong>
          </div>
          <div className="workspace-tools">
            <MetalButton
              className="search-trigger"
              onClick={() => {
                setSearch("");
                setSearchOpen(true);
              }}
            >
              <Search size={16} />
              <span>Find a page</span>
              <kbd>Ctrl K</kbd>
            </MetalButton>
            <span className="operator-avatar" title="Local kitchen workspace">
              CG
            </span>
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
              {config.data?.is_synthetic ? "Connect your data" : "Manage data"}
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
                <RefreshCw size={16} className={config.loading ? "spin" : ""} />
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
              {page === "home" ? (
                <Home navigate={navigate} />
              ) : config.loading && !config.data ? (
                <Loading />
              ) : config.error ? (
                <ErrorState message={config.error} retry={config.retry} />
              ) : screen ? (
                page === "overview" ? (
                  <Overview {...screen} />
                ) : page === "demand-forecast" || page === "prep-planner" ? (
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
            </Suspense>
          </ViewBoundary>
          <footer className="workspace-footer">
            <span>
              <Sprout size={14} />
              WasteWise AI <span className="footer-divider">/</span> Thoughtful
              prep. Less waste.
            </span>
            <div>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <span>ADAPPT 5.0</span>
            </div>
          </footer>
        </main>
      </div>
      <Dialog
        open={menuOpen}
        title="Workspace navigation"
        onClose={() => setMenuOpen(false)}
      >
        <div className="mobile-navigation">{nav}</div>
      </Dialog>
      <Dialog
        open={searchOpen}
        instant
        title="Find your next step"
        onClose={() => setSearchOpen(false)}
      >
        <div className="command-search">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Search pages"
            placeholder="Search forecasts, preparation, data…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="search-results">
          {links
            .filter((link) =>
              `${link.label} ${link.description}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map(({ id, label, description, icon: Icon }) => (
              <button key={id} onClick={() => navigate(id)}>
                <Icon size={20} />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          {!links.some((link) =>
            `${link.label} ${link.description}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          ) && <p className="muted">No pages match “{search}”.</p>}
        </div>
      </Dialog>
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
    </div>
  );
}
