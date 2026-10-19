import React, { useState, useEffect } from 'react';
import { X, Sliders, AlertTriangle, Check, RotateCcw } from 'lucide-react';
import { tokens } from '../../tokens';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: string;
  recommendedPrep: number;
  currentOverride?: { quantity: number; reason: string } | null;
  onSaveOverride: (menuItem: string, quantity: number, reason: string) => void;
  onResetOverride?: (menuItem: string) => void;
}

const OVERRIDE_REASONS = [
  'Unexpected campus VIP / catering booking',
  'Inclement weather / low footfall observation',
  'Exam week / student study schedule shift',
  'Ingredient stock availability constraint',
  'Chef intuition / historical pattern',
  'Other operational requirement',
];

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  onClose,
  menuItem,
  recommendedPrep,
  currentOverride,
  onSaveOverride,
  onResetOverride,
}) => {
  const [quantity, setQuantity] = useState<number>(recommendedPrep);
  const [reason, setReason] = useState<string>(OVERRIDE_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentOverride) {
        setQuantity(currentOverride.quantity);
        setReason(currentOverride.reason);
      } else {
        setQuantity(recommendedPrep);
        setReason(OVERRIDE_REASONS[0]);
      }
      setCustomNote('');
    }
  }, [isOpen, currentOverride, recommendedPrep]);

  if (!isOpen) return null;

  const delta = quantity - recommendedPrep;
  const deltaPct = recommendedPrep > 0 ? ((delta / recommendedPrep) * 100).toFixed(1) : '0';

  const handleSave = () => {
    const finalReason = customNote.trim() ? `${reason} — ${customNote.trim()}` : reason;
    onSaveOverride(menuItem, quantity, finalReason);
    onClose();
  };

  const handleReset = () => {
    if (onResetOverride) {
      onResetOverride(menuItem);
    }
    setQuantity(recommendedPrep);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] shadow-2xl p-6 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F3F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E4F7ED] text-[#16865D] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="override-title" className="text-base font-bold text-[#17232E]">
                Kitchen Preparation Override
              </h2>
              <p className="text-xs text-[#647386]">{menuItem}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner (Amber) */}
        <div className="my-4 p-3 bg-[#FFF3D9] border border-[#E7A32D] rounded-lg text-xs text-[#92400E] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E7A32D]" />
          <div>
            <span className="font-semibold">Session-only kitchen override:</span>
            <span> Adjusting batch size applies to today's prep board only. It does not alter underlying ML models or historical training weights.</span>
          </div>
        </div>

        {/* Stepper Quantity Input */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="quantity-input" className="text-xs font-semibold uppercase tracking-wider text-[#647386]">
                Planned Preparation (Portions)
              </label>
              <span className="text-xs text-[#647386]">
                ML Recommendation: <strong className="text-[#17232E]">{recommendedPrep}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 5))}
                className="w-12 h-12 rounded-lg border border-[#DFE5EC] bg-[#F0F3F8] hover:bg-[#DFE5EC] active:bg-[#CAD6CE] font-bold text-lg text-[#17232E] transition-colors"
                aria-label="Decrease by 5"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-12 rounded-lg border border-[#DFE5EC] bg-[#F0F3F8] hover:bg-[#DFE5EC] active:bg-[#CAD6CE] font-bold text-lg text-[#17232E] transition-colors"
                aria-label="Decrease by 1"
              >
                -1
              </button>
              <input
                id="quantity-input"
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 text-center text-xl font-bold text-[#17232E] tabular-nums bg-[#FFFFFF] border-2 border-[#16865D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13B8A6]"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-12 rounded-lg border border-[#DFE5EC] bg-[#F0F3F8] hover:bg-[#DFE5EC] active:bg-[#CAD6CE] font-bold text-lg text-[#17232E] transition-colors"
                aria-label="Increase by 1"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 5)}
                className="w-12 h-12 rounded-lg border border-[#DFE5EC] bg-[#F0F3F8] hover:bg-[#DFE5EC] active:bg-[#CAD6CE] font-bold text-lg text-[#17232E] transition-colors"
                aria-label="Increase by 5"
              >
                +5
              </button>
            </div>

            {/* Delta info */}
            <div className="mt-2 text-xs flex justify-between items-center text-[#647386]">
              <span>Deviation vs ML Recommendation:</span>
              <span className={`font-semibold tabular-nums ${delta > 0 ? 'text-[#E7A32D]' : delta < 0 ? 'text-[#4263D8]' : 'text-[#12523C]'}`}>
                {delta > 0 ? `+${delta} portions (+${deltaPct}%)` : delta < 0 ? `${delta} portions (${deltaPct}%)` : 'Exact match to ML recommendation'}
              </span>
            </div>
          </div>

          {/* Operational Reason */}
          <div>
            <label htmlFor="reason-select" className="block text-xs font-semibold uppercase tracking-wider text-[#647386] mb-1.5">
              Operational Justification
            </label>
            <select
              id="reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 text-xs text-[#17232E] bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16865D]"
            >
              {OVERRIDE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="custom-note" className="block text-xs font-semibold uppercase tracking-wider text-[#647386] mb-1.5">
              Additional Kitchen Log Note (Optional)
            </label>
            <input
              id="custom-note"
              type="text"
              placeholder="e.g., Head chef approved extra buffer for 12:30 rush"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full h-9 px-3 text-xs text-[#17232E] bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16865D]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F0F3F8]">
          <div>
            {currentOverride && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to ML Plan</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FFFFFF] bg-[#16865D] hover:bg-[#12523C] active:bg-[#12523C] rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Apply Override</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
