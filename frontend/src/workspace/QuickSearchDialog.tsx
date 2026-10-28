import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChartNoAxesCombined,
  ChefHat,
  Database,
  HelpCircle,
  LayoutDashboard,
  Search,
  ShieldCheck,
  TriangleAlert,
  Utensils,
  X,
} from "lucide-react";
import { Dialog } from "./shared";
import type { ConfigResponse } from "../types";
import type { Page } from "./model";

interface QuickSearchDialogProps {
  open: boolean;
  onClose: () => void;
  config?: ConfigResponse | null;
  onSelectDish: (dish: string) => void;
  onNavigate: (page: Page, dish?: string) => void;
}

type ScopeId = "all" | "operations" | "intelligence" | "dishes" | "resources";

export default function QuickSearchDialog({
  open,
  onClose,
  config,
  onSelectDish,
  onNavigate,
}: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeScope, setActiveScope] = useState<ScopeId>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
        setActiveScope("all");
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const views = [
    {
      id: "overview" as Page,
      label: "Kitchen Overview",
      description: "Service command center & menu priorities",
      icon: LayoutDashboard,
      category: "Operations",
    },
    {
      id: "demand-forecast" as Page,
      label: "Demand Forecast",
      description: "Predictive demand & what-if scenarios",
      icon: ChartNoAxesCombined,
      category: "Intelligence",
    },
    {
      id: "prep-planner" as Page,
      label: "Preparation Planner",
      description: "Batch sizing, inventory deductions & print sheets",
      icon: ChefHat,
      category: "Kitchen Planning",
    },
    {
      id: "waste-risk" as Page,
      label: "Surplus Rescue",
      description: "Surplus triage, flash sales, donations & outcome logging",
      icon: TriangleAlert,
      category: "Operations",
    },
    {
      id: "performance" as Page,
      label: "Performance & Impact",
      description: "Holdout evaluation & retrospective simulation",
      icon: BarChart3,
      category: "Evaluation",
    },
    {
      id: "data-model" as Page,
      label: "Data & Model",
      description: "Dataset provenance, CSV ingestion & schema",
      icon: Database,
      category: "Data",
    },
    {
      id: "help" as Page,
      label: "Help & Getting Started",
      description: "Workflow rhythm & kitchen onboarding field guide",
      icon: HelpCircle,
      category: "Resources",
    },
    {
      id: "transparency" as Page,
      label: "Model Transparency",
      description: "Random forest mechanics, formulas & limits",
      icon: ShieldCheck,
      category: "Resources",
    },
  ];

  const q = query.trim().toLowerCase();

  const matchingViews = views.filter(
    (v) =>
      v.label.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q),
  );

  const dishes = config?.menu_item_names || [
    "Pav Bhaji",
    "Idli Sambar",
    "Veg Thali",
    "Veg Grilled Sandwich",
    "Rajma Rice Bowl",
    "Poha",
    "Masala Dosa",
    "Fresh Fruit Juice",
  ];

  const matchingDishes = dishes.filter((d) => d.toLowerCase().includes(q));

  interface ResultItem {
    type: "view" | "dish";
    id: string;
    label: string;
    sub: string;
    icon: typeof LayoutDashboard;
    badge: string;
    targetPage: Page;
    dishName?: string;
  }

  const allResults: ResultItem[] = [
    ...matchingViews.map((v) => ({
      type: "view" as const,
      id: `view-${v.id}`,
      label: v.label,
      sub: v.description,
      icon: v.icon,
      badge: v.category,
      targetPage: v.id,
    })),
    ...matchingDishes.map((dish) => ({
      type: "dish" as const,
      id: `dish-${dish}`,
      label: dish,
      sub: "Jump to Preparation Planner for this dish",
      icon: Utensils,
      badge: "Menu Item",
      targetPage: "prep-planner" as Page,
      dishName: dish,
    })),
  ];

  // Scope filter counts
  const operationsCount = matchingViews.filter(
    (v) => v.category === "Operations" || v.category === "Kitchen Planning",
  ).length;
  const intelligenceCount = matchingViews.filter(
    (v) =>
      v.category === "Intelligence" ||
      v.category === "Evaluation" ||
      v.category === "Data",
  ).length;
  const dishesCount = matchingDishes.length;
  const resourcesCount = matchingViews.filter(
    (v) => v.category === "Resources",
  ).length;

  const scopes = [
    { id: "all" as ScopeId, label: "All Items", count: allResults.length },
    {
      id: "operations" as ScopeId,
      label: "Operations",
      count: operationsCount,
    },
    {
      id: "intelligence" as ScopeId,
      label: "Intelligence",
      count: intelligenceCount,
    },
    { id: "dishes" as ScopeId, label: "Menu Dishes", count: dishesCount },
    { id: "resources" as ScopeId, label: "Resources", count: resourcesCount },
  ];

  const filteredResults = allResults.filter((item) => {
    if (activeScope === "all") return true;
    if (activeScope === "operations")
      return item.badge === "Operations" || item.badge === "Kitchen Planning";
    if (activeScope === "intelligence")
      return (
        item.badge === "Intelligence" ||
        item.badge === "Evaluation" ||
        item.badge === "Data"
      );
    if (activeScope === "dishes") return item.type === "dish";
    if (activeScope === "resources") return item.badge === "Resources";
    return true;
  });

  const handleSelect = (item: ResultItem) => {
    if (item.type === "dish" && item.dishName) {
      onSelectDish(item.dishName);
      onNavigate("prep-planner", item.dishName);
    } else {
      onNavigate(item.targetPage);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev + 1 >= filteredResults.length ? 0 : prev + 1,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredResults.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) handleSelect(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search Views & Menu Dishes">
      <div className="quick-search-modal quick-search-container">
        {/* Search input field utilizing the entire bar */}
        <div className="quick-search-input-wrap">
          <div className="search-input-left" aria-hidden="true">
            <Search size={19} className="search-icon-left" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="quick-search-input"
            placeholder="Type a page, menu dish name, or keyword (e.g. Overview, Biryani, Forecast)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search pages and menu dishes"
          />
          <div className="search-input-right">
            {query ? (
              <>
                <span className="search-count-badge">
                  {filteredResults.length}{" "}
                  {filteredResults.length === 1 ? "match" : "matches"}
                </span>
                <button
                  type="button"
                  className="quick-search-clear"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search input"
                  title="Clear input"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="search-shortcut-hint" aria-hidden="true">
                <kbd className="search-input-kbd">ESC</kbd>
              </div>
            )}
          </div>
        </div>

        {/* Scope category filter chips */}
        <div
          className="quick-search-scopes"
          role="tablist"
          aria-label="Category filters"
        >
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={activeScope === s.id}
              className={`search-scope-chip ${activeScope === s.id ? "active" : ""}`}
              onClick={() => {
                setActiveScope(s.id);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
            >
              <span>{s.label}</span>
              <span className="scope-count">{s.count}</span>
            </button>
          ))}
        </div>

        {/* Results list */}
        <div className="quick-search-results" role="listbox">
          {filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  className={`search-result-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="search-item-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div className="search-item-body">
                    <div className="search-item-title-row">
                      <strong>{item.label}</strong>
                      <span className="search-item-badge">{item.badge}</span>
                    </div>
                    <small>{item.sub}</small>
                  </div>
                  {item.type === "dish" && (
                    <span className="dish-jump-actions">
                      <span className="jump-pill">Plan dish</span>
                    </span>
                  )}
                  <ArrowRight
                    size={15}
                    className="search-item-arrow"
                    aria-hidden="true"
                  />
                </button>
              );
            })
          ) : (
            <div className="search-no-results">
              <p>No pages or menu items match "{query}".</p>
              <small>
                Try searching "Forecast", "Planner", "Dal", or click a category
                chip above.
              </small>
              <div className="search-suggestions-row">
                {[
                  "Kitchen Overview",
                  "Demand Forecast",
                  "Pav Bhaji",
                  "Veg Thali",
                  "Surplus Rescue",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    className="search-sug-pill"
                    onClick={() => {
                      setQuery(sug);
                      setActiveScope("all");
                      inputRef.current?.focus();
                    }}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer hints */}
        <div className="quick-search-footer">
          <div className="footer-keys-group">
            <span>
              <kbd className="search-kbd">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="search-kbd">↵</kbd> to select
            </span>
            <span>
              <kbd className="search-kbd">esc</kbd> to close
            </span>
          </div>
          <span className="footer-status-count">
            {filteredResults.length}{" "}
            {filteredResults.length === 1 ? "item" : "items"} available
          </span>
        </div>
      </div>
    </Dialog>
  );
}
