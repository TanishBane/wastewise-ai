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

export default function QuickSearchDialog({
  open,
  onClose,
  config,
  onSelectDish,
  onNavigate,
}: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
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
    "Dal Tadka & Rice",
    "Paneer Butter Masala",
    "Chole Bhature",
    "Veg Biryani",
    "Rajma Chawal",
    "Masala Dosa",
    "Idli Sambar",
  ];

  const matchingDishes = dishes
    .filter((d) => d.toLowerCase().includes(q))
    .slice(0, 6);

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

  const results: ResultItem[] = [
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
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, results.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = results[selectedIndex];
      if (current) handleSelect(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search Views & Menu Dishes">
      <div className="quick-search-modal quick-search-container">
        {/* Search input field */}
        <div className="quick-search-input-wrap">
          <Search size={18} className="search-icon-left" />
          <input
            ref={inputRef}
            type="text"
            className="quick-search-input"
            placeholder="Type a page or menu dish name (e.g. Overview, Biryani, Pav Bhaji)…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search pages and dishes"
          />
          {query && (
            <button
              className="quick-search-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear query"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="quick-search-results" role="listbox">
          {results.length > 0 ? (
            results.map((item, idx) => {
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
                  <span className="search-item-icon">
                    <Icon size={17} />
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
                  <ArrowRight size={14} className="search-item-arrow" />
                </button>
              );
            })
          ) : (
            <div className="search-no-results">
              <p>No pages or menu items match "{query}".</p>
              <small>Try searching "Forecast", "Planner", "Dal", or "Biryani"</small>
            </div>
          )}
        </div>

        {/* Modal footer hints */}
        <div className="quick-search-footer">
          <span><kbd className="search-kbd">↑↓</kbd> to navigate</span>
          <span><kbd className="search-kbd">↵</kbd> to select</span>
          <span><kbd className="search-kbd">esc</kbd> to close</span>
        </div>
      </div>
    </Dialog>
  );
}
