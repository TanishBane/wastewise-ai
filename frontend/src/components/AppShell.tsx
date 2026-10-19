import React, { useState, useEffect } from 'react';
import { Menu, Calendar, ShieldAlert } from 'lucide-react';
import { Sidebar, PageId } from './Sidebar';
import { TopBar, ScenarioPreset } from './TopBar';

interface AppShellProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onLaunchDemoScenario: () => void;
  isSynthetic: boolean;
  serviceDate?: string;
  activeScenario: ScenarioPreset;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  onOpenLimitations: () => void;
  onOpenShortcuts: () => void;
  onExportReport?: () => void;
  children: React.ReactNode;
}

const PAGE_TITLES: Record<PageId, string> = {
  overview: 'Executive Overview',
  'demand-forecast': 'Demand Forecast & Uncertainty',
  'prep-planner': 'Preparation Planner',
  'waste-risk': 'Waste-Risk Monitoring',
  performance: 'Performance & Impact Analytics',
  'data-model': 'Data & Model Governance',
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  transparency: 'AI & Data Transparency',
  help: 'Help Center & Operator Playbook',
};

export const AppShell: React.FC<AppShellProps> = ({
  currentPage,
  onSelectPage,
  onLaunchDemoScenario,
  isSynthetic,
  serviceDate = '27 Sep 2026',
  activeScenario,
  onSelectScenario,
  onOpenLimitations,
  onOpenShortcuts,
  onExportReport,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('wastewise_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('wastewise_sidebar_collapsed', String(next));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#17232E] flex flex-col">
      {/* Top Persistent Synthetic Demonstration Banner */}
      <div className="bg-[#172B3D] text-[#EAF0FF] px-4 py-1.5 text-xs font-semibold flex items-center justify-between z-30 border-b border-[#087E8B]/40">
        <div className="flex items-center gap-2 max-w-[1360px] mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#47D7A0] animate-pulse" />
            <span className="truncate">
              Demonstration Environment · Synthetic Operational Data (ADAPPT 5.0 AI in FoodTech)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectPage('transparency')}
            className="text-[12px] underline text-[#47D7A0] hover:text-[#FFFFFF] transition-colors cursor-pointer shrink-0 ml-2"
          >
            Model Limitations & Validation Dossier
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={onSelectPage}
          onLaunchDemoScenario={onLaunchDemoScenario}
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          isSynthetic={isSynthetic}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onOpenLimitations={onOpenLimitations}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? 'md:pl-[68px]' : 'md:pl-[240px]'
          }`}
        >
          {/* Mobile Header Bar */}
          <header className="h-14 border-b border-[#DFE5EC] bg-[#FFFFFF] px-4 flex items-center justify-between md:hidden sticky top-0 z-20">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#F0F3F8] text-[#17232E]"
              aria-label="Open primary navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-[#17232E]">WasteWise AI</span>
            <div className="flex items-center gap-1.5 text-xs text-[#647386]">
              <Calendar className="w-3.5 h-3.5 text-[#16865D]" />
              <span className="font-semibold">{serviceDate}</span>
            </div>
          </header>

          {/* Desktop TopBar */}
          <div className="hidden md:block">
            <TopBar
              currentPageTitle={PAGE_TITLES[currentPage] || 'Dashboard'}
              onToggleSidebar={toggleSidebarCollapse}
              isSidebarCollapsed={sidebarCollapsed}
              onNavigate={onSelectPage}
              onLaunchDemoTour={onLaunchDemoScenario}
              onOpenLimitations={onOpenLimitations}
              onOpenShortcuts={onOpenShortcuts}
              onExportData={onExportReport}
              isSynthetic={isSynthetic}
            />
          </div>

          {/* Page Container */}
          <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1360px] w-full mx-auto">
            {children}
          </main>

          {/* Persistent Clean Page Footer with Trust & Legal Access */}
          <footer className="border-t border-[#DFE5EC] bg-[#FFFFFF] px-4 sm:px-8 py-3.5 text-xs text-[#647386]">
            <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-semibold text-[#17232E]">WasteWise AI</span>
                <span>·</span>
                <span>ADAPPT 5.0 AI in FoodTech</span>
                <span>·</span>
                <span className="text-[#12523C] font-semibold">Holdout WAPE: 8.4%</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectPage('privacy')}
                  className="hover:text-[#17232E] hover:underline"
                >
                  Privacy Policy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onSelectPage('terms')}
                  className="hover:text-[#17232E] hover:underline"
                >
                  Terms of Use
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onSelectPage('transparency')}
                  className="hover:text-[#17232E] hover:underline text-[#16865D] font-medium"
                >
                  AI & Data Transparency
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onSelectPage('help')}
                  className="hover:text-[#17232E] hover:underline"
                >
                  Help
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
