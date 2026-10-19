import React from 'react';
import {
  HelpCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { UtilityMenu } from './UtilityMenu';

export type ScenarioPreset = 'normal' | 'event' | 'rainy';

interface TopBarProps {
  currentPageTitle: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onNavigate: (page: PageId) => void;
  onLaunchDemoTour: () => void;
  onOpenLimitations: () => void;
  onOpenShortcuts: () => void;
  onExportData?: () => void;
  isSynthetic?: boolean;
  lastSyncTime?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPageTitle,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onNavigate,
  onLaunchDemoTour,
  onOpenLimitations,
  onOpenShortcuts,
  onExportData,
  isSynthetic = true,
  lastSyncTime = '6:30 AM IST',
}) => {
  return (
    <header className="bg-[#FFFFFF] border-b border-[#DFE5EC] sticky top-0 z-20 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle & Compact Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16865D]"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar ( [ )' : 'Collapse sidebar ( [ )'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#087E8B]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-[#647386] truncate">
            <span
              onClick={() => onNavigate('overview')}
              className="text-[#16865D] font-bold cursor-pointer hover:underline"
            >
              WasteWise AI
            </span>
            <span className="text-[#8A99A8]">/</span>
            <span className="text-[#17232E] font-semibold truncate">
              {currentPageTitle}
            </span>
          </nav>
        </div>

        {/* Right: Telemetry Pulse, Quick Help, and Unified Workspace Utilities Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Subtle Live Sync Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#E4F7ED] border border-[#16865D]/30 rounded-md text-[12px] text-[#12523C]"
            title={`Real-time telemetry heartbeat: Synced at ${lastSyncTime}`}
          >
            <span className="w-2 h-2 rounded-full bg-[#16865D] animate-pulse" />
            <span className="font-medium">Synced {lastSyncTime}</span>
          </div>

          {/* Quick Help Link */}
          <button
            type="button"
            onClick={() => onNavigate('help')}
            className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors border border-transparent hover:border-[#DFE5EC]"
            aria-label="Open Help Center and Playbook"
            title="Help Center & Operator Playbook"
          >
            <HelpCircle className="w-4 h-4 text-[#087E8B]" />
          </button>

          {/* Unified Workspace Utilities Menu (Dropdown) */}
          <UtilityMenu
            onNavigate={onNavigate}
            onLaunchDemoTour={onLaunchDemoTour}
            onOpenLimitations={onOpenLimitations}
            onOpenShortcuts={onOpenShortcuts}
            onExportData={onExportData}
            isSynthetic={isSynthetic}
          />
        </div>
      </div>
    </header>
  );
};
