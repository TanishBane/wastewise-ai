import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '[', desc: 'Toggle sidebar collapsed mode' },
    { key: '1', desc: 'Navigate to Executive Overview' },
    { key: '2', desc: 'Navigate to Demand Forecast & Uncertainty' },
    { key: '3', desc: 'Navigate to Smart Preparation Planner' },
    { key: '4', desc: 'Navigate to Waste-Risk Monitoring & Triage' },
    { key: '5', desc: 'Navigate to Performance & Impact Analytics' },
    { key: '6', desc: 'Navigate to Data & Model Governance' },
    { key: '?', desc: 'Open Keyboard Shortcuts and Help' },
    { key: 'Esc', desc: 'Close open dialogs, menus, or modals' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#DFE5EC] shadow-2xl p-6 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#DFE5EC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0EBFF] text-[#7656D6] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-[#17232E]">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-[#647386]">Quick operational navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            aria-label="Close shortcuts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="py-4 space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#F5F7FA] transition-colors text-xs"
            >
              <span className="text-[#17232E] font-medium">{s.desc}</span>
              <kbd className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-[#F0F3F8] border border-[#DFE5EC] font-mono text-xs font-semibold text-[#17232E] shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DFE5EC] flex items-center justify-between text-xs text-[#647386]">
          <span>Shortcuts active across all views</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#F0F3F8] hover:bg-[#DFE5EC] text-[#17232E] font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
