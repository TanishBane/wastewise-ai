import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ChefHat,
  AlertTriangle,
  BarChart3,
  Database,
  Building2,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'demand-forecast'
  | 'prep-planner'
  | 'waste-risk'
  | 'performance'
  | 'data-model'
  | 'privacy'
  | 'terms'
  | 'transparency'
  | 'help';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onLaunchDemoScenario: () => void;
  isOpen: boolean;
  onClose: () => void;
  isSynthetic: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  workspaceName?: string;
  onOpenLimitations?: () => void;
}

const NAV_ITEMS = [
  { id: 'overview' as PageId, label: 'Overview', icon: LayoutDashboard, hotkey: '1' },
  { id: 'demand-forecast' as PageId, label: 'Demand Forecast', icon: TrendingUp, hotkey: '2' },
  { id: 'prep-planner' as PageId, label: 'Preparation Planner', icon: ChefHat, hotkey: '3' },
  { id: 'waste-risk' as PageId, label: 'Waste-Risk Monitoring', icon: AlertTriangle, hotkey: '4' },
  { id: 'performance' as PageId, label: 'Performance & Impact', icon: BarChart3, hotkey: '5' },
  { id: 'data-model' as PageId, label: 'Data & Model', icon: Database, hotkey: '6' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  onLaunchDemoScenario,
  isOpen,
  onClose,
  isSynthetic,
  isCollapsed = false,
  onToggleCollapse,
  workspaceName = 'Campus Green Central Canteen',
  onOpenLimitations,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] border-r border-[#DFE5EC] flex flex-col justify-between transition-all duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-[68px] w-[240px]' : 'w-[240px]'}`}
        aria-label="Primary Navigation"
      >
        {/* Top Header & Navigation */}
        <div className={`flex flex-col ${isCollapsed ? 'md:p-2.5 p-4' : 'p-4'} pb-0`}>
          {/* Brand Row */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#DFE5EC]">
            <button
              type="button"
              onClick={() => {
                onSelectPage('overview');
                onClose();
              }}
              className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16865D] rounded-lg p-0.5"
              title="Return to Executive Overview"
            >
              <div className="w-7 h-7 rounded-lg bg-[#12523C] flex items-center justify-center text-[#47D7A0] font-bold text-sm shadow-xs shrink-0">
                W
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="font-bold text-[#17232E] text-sm tracking-tight leading-none">
                    WasteWise AI
                  </div>
                  <div className="text-[12px] uppercase font-bold text-[#16865D] tracking-wider mt-1">
                    ADAPPT 5.0 · FoodTech
                  </div>
                </div>
              )}
            </button>

            {/* Collapse toggle (Desktop) */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex p-1 rounded-md text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#087E8B]" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#647386] hover:text-[#17232E] md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canteen Selector / Badge */}
          <div
            className={`mt-3 px-2.5 py-1.5 bg-[#F0F3F8] rounded-lg border border-[#DFE5EC] flex items-center gap-2 text-xs text-[#17232E] ${
              isCollapsed ? 'md:justify-center' : ''
            }`}
            title={`Active Canteen: ${workspaceName}`}
          >
            <Building2 className="w-4 h-4 text-[#087E8B] shrink-0" />
            {!isCollapsed && (
              <div className="truncate font-semibold text-xs leading-tight">
                {workspaceName}
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="mt-3.5 flex flex-col gap-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage(item.id);
                    onClose();
                  }}
                  title={isCollapsed ? `${item.label} (Press ${item.hotkey})` : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left relative group ${
                    isActive
                      ? 'bg-[#E4F7ED] text-[#12523C] shadow-xs'
                      : 'text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8]'
                  } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#16865D] rounded-r-md" />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#16865D]' : 'text-[#647386] group-hover:text-[#087E8B]'
                    }`}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Guided Demo Launch Action */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                onLaunchDemoScenario();
                onClose();
              }}
              title="Launch Guided Demo Tour"
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#FFFFFF] bg-gradient-to-r from-[#16865D] to-[#087E8B] hover:from-[#12523C] hover:to-[#087E8B] active:from-[#12523C] rounded-lg shadow-xs hover:shadow-sm transition-all ${
                isCollapsed ? 'md:px-0 md:py-2.5' : ''
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#47D7A0] shrink-0" />
              {!isCollapsed && <span className="truncate">Guided Demo Tour</span>}
            </button>
          </div>
        </div>

        {/* Bottom Metadata & Provenance */}
        <div className={`p-4 border-t border-[#DFE5EC] text-xs text-[#647386] leading-relaxed ${isCollapsed ? 'md:p-2 md:text-center' : ''}`}>
          {!isCollapsed ? (
            <>
              <div className="flex justify-between items-center py-1">
                <span>Holdout WAPE:</span>
                <span className="font-bold text-[#12523C] bg-[#E4F7ED] border border-[#47D7A0]/40 px-1.5 py-0.5 rounded-sm tabular-nums">
                  8.4%
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Baseline WAPE:</span>
                <span className="font-medium text-[#647386] tabular-nums">
                  10.8%
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Provenance:</span>
                {onOpenLimitations ? (
                  <button
                    type="button"
                    onClick={onOpenLimitations}
                    className="font-semibold text-[#16865D] hover:underline"
                  >
                    {isSynthetic ? 'Synthetic (365d)' : 'Operator CSV'}
                  </button>
                ) : (
                  <span className="font-semibold text-[#17232E]">
                    {isSynthetic ? 'Synthetic (365d)' : 'Operator CSV'}
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-[#DFE5EC]/60 text-xs text-[#8A99A8] flex justify-between items-center">
                <span>ADAPPT 5.0</span>
                <span>Local v1.0</span>
              </div>
            </>
          ) : (
            <div
              className="hidden md:flex flex-col items-center gap-1 py-1 text-[12px] font-bold text-[#12523C] bg-[#E4F7ED] rounded p-1"
              title="Holdout WAPE 8.4% · Synthetic 365d data"
            >
              <span>8.4%</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
