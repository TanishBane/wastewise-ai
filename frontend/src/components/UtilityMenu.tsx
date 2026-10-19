import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Keyboard,
  Database,
  Download,
  RotateCcw,
  FileText,
  Shield,
  Info,
  ChevronRight,
  Settings2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface UtilityMenuProps {
  onNavigate: (page: PageId) => void;
  onLaunchDemoTour: () => void;
  onOpenLimitations: () => void;
  onOpenShortcuts: () => void;
  onExportData?: () => void;
  isSynthetic: boolean;
}

export const UtilityMenu: React.FC<UtilityMenuProps> = ({
  onNavigate,
  onLaunchDemoTour,
  onOpenLimitations,
  onOpenShortcuts,
  onExportData,
  isSynthetic,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('wastewise_reduced_motion') === 'true';
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setResetConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem('wastewise_reduced_motion', String(next));
    if (next) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  const handleAction = (cb: () => void) => {
    cb();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Workspace settings and utilities menu"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
          isOpen
            ? 'bg-[#E4F7ED] border-[#16865D] text-[#12523C] shadow-xs ring-2 ring-[#16865D]/20'
            : 'bg-[#FFFFFF] border-[#DFE5EC] text-[#17232E] hover:bg-[#F0F3F8] hover:border-[#CAD6CE]'
        }`}
        title="Help, Settings, Transparency & Workspace Utilities"
      >
        <Settings2 className="w-4 h-4 text-[#087E8B]" />
        <span className="hidden sm:inline">Utilities</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Workspace utilities"
          className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xl z-50 py-2 animate-scale-in text-xs divide-y divide-[#F0F3F8]"
        >
          {/* Header */}
          <div className="px-3.5 py-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#17232E] text-xs">Workspace Utilities</span>
              <span className="text-[12px] font-semibold text-[#16865D] bg-[#E4F7ED] px-2 py-0.5 rounded-full border border-[#16865D]/30">
                ADAPPT 5.0
              </span>
            </div>
            <p className="text-[12px] text-[#647386] mt-0.5">
              Campus Green Central Canteen · Lunch Dispatch
            </p>
          </div>

          {/* Section 1: Help & Learning */}
          <div className="py-1.5">
            <div className="px-3.5 py-1 text-[12px] uppercase font-bold tracking-wider text-[#647386]">
              Help & Learning
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(() => onNavigate('help'))}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#087E8B]" />
                <span className="font-medium">Help Center & Operator Playbook</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onLaunchDemoTour)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#16865D]" />
                <span className="font-medium">Launch Guided Demo Tour</span>
              </div>
              <span className="text-[12px] font-bold text-[#16865D] bg-[#E4F7ED] px-1.5 py-0.2 rounded">
                5 Steps
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onOpenLimitations)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#4263D8]" />
                <span className="font-medium">Methodology & Scientific Dossier</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onOpenShortcuts)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#7656D6]" />
                <span className="font-medium">Keyboard Shortcuts</span>
              </div>
              <kbd className="text-[12px] font-mono bg-[#F0F3F8] border border-[#DFE5EC] px-1.5 py-0.5 rounded text-[#647386]">
                ?
              </kbd>
            </button>
          </div>

          {/* Section 2: Data & Workspace */}
          <div className="py-1.5">
            <div className="px-3.5 py-1 text-[12px] uppercase font-bold tracking-wider text-[#647386]">
              Data & Workspace
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(() => onNavigate('data-model'))}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#087E8B]" />
                <span className="font-medium">Data & Model Governance</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>

            {onExportData && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleAction(onExportData)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#4263D8]" />
                  <span className="font-medium">Export Operational CSV</span>
                </div>
                <span className="text-[12px] text-[#647386]">Daily Log</span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => setResetConfirmOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#92400E] hover:bg-[#FFF3D9] transition-colors"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#E7A32D]" />
                <span className="font-medium">Reset Demonstration Data</span>
              </div>
              <span className="text-[12px] text-[#92400E]">Safe Reset</span>
            </button>
          </div>

          {/* Section 3: Legal, Privacy & Transparency */}
          <div className="py-1.5">
            <div className="px-3.5 py-1 text-[12px] uppercase font-bold tracking-wider text-[#647386]">
              Trust & Transparency
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(() => onNavigate('privacy'))}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#16865D]" />
                <span className="font-medium">Privacy Policy</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(() => onNavigate('terms'))}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#647386]" />
                <span className="font-medium">Terms of Use</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(() => onNavigate('transparency'))}
              className="w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#087E8B]" />
                <span className="font-medium">AI & Data Transparency</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386]" />
            </button>
          </div>

          {/* Section 4: Display Preferences */}
          <div className="py-1.5">
            <div className="px-3.5 py-1 text-[12px] uppercase font-bold tracking-wider text-[#647386]">
              Display Preferences
            </div>

            <div className="px-3.5 py-1.5 flex items-center justify-between text-[#17232E]">
              <span>Reduce Motion</span>
              <button
                type="button"
                onClick={toggleReducedMotion}
                role="switch"
                aria-checked={reducedMotion}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#16865D] ${
                  reducedMotion ? 'bg-[#16865D]' : 'bg-[#DFE5EC]'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                    reducedMotion ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div
            className="w-full max-w-md bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] p-6 shadow-2xl space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3D9] text-[#92400E] border border-[#E7A32D] flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 id="reset-title" className="text-sm font-bold text-[#17232E]">
                  Restore Demonstration Dataset?
                </h3>
                <p className="text-xs text-[#647386]">
                  Safe action · Reverts to baseline synthetic records
                </p>
              </div>
            </div>

            <p className="text-xs text-[#647386] leading-relaxed">
              This will reload the pristine 365-day cafeteria dataset and retrain the Random Forest regressor to standard baseline weights. Custom uploaded CSVs will be archived.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFE5EC]">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#647386] hover:bg-[#F0F3F8] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetConfirmOpen(false);
                  setIsOpen(false);
                  onNavigate('data-model');
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#16865D] hover:bg-[#12523C] rounded-lg shadow-xs transition-colors"
              >
                Go to Data Governance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
