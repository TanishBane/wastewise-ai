import { useRef } from "react";
import { Printer } from "lucide-react";
import { Dialog } from "./shared";
import MetalButton from "../MetalButton";
import type { OverviewItemDetail, PlanResponse } from "../types";

interface PrintKitchenSheetProps {
  open: boolean;
  onClose: () => void;
  serviceDate: string;
  items?: OverviewItemDetail[];
  singlePlan?: {
    item: string;
    category?: string;
    plan: PlanResponse;
    stock: number;
  };
}

export default function PrintKitchenSheet({
  open,
  onClose,
  serviceDate,
  items,
  singlePlan,
}: PrintKitchenSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Kitchen Preparation Sheet · Print Preview"
    >
      <div className="print-sheet-toolbar">
        <p className="print-hint">
          Standard A4 format with high-contrast typography optimized for kitchen
          clipboards and batch verification.
        </p>
        <div className="print-actions">
          <MetalButton className="button primary" onClick={handlePrint}>
            <Printer size={16} />
            Print to kitchen printer
          </MetalButton>
        </div>
      </div>

      <div ref={printRef} className="printable-kitchen-sheet">
        {/* Printable Document Header */}
        <header className="sheet-doc-header">
          <div className="sheet-brand-row">
            <div className="sheet-brand">
              <span className="sheet-logo-mark">WW</span>
              <div>
                <h2>WasteWise AI · Kitchen Operations Sheet</h2>
                <small>
                  Campus Green Main Canteen · Shift Preparation Schedule
                </small>
              </div>
            </div>
            <div className="sheet-meta-block">
              <div>
                <strong>Date:</strong> {serviceDate}
              </div>
              <div>
                <strong>Shift:</strong> Lunch Service (11:30 – 14:00)
              </div>
              <div>
                <strong>Status:</strong> Approved for Kitchen Prep
              </div>
            </div>
          </div>
        </header>

        {/* Operational Scope */}
        {singlePlan ? (
          <div className="sheet-single-view">
            <div className="sheet-dish-banner">
              <div>
                <h3>{singlePlan.item}</h3>
                <span>
                  {singlePlan.category || "Main Course"} · Recipe prep target
                </span>
              </div>
              <div className="sheet-target-badge">
                <span>Cooking Target:</span>
                <strong>
                  {singlePlan.plan.recommended_total_plan} portions
                </strong>
              </div>
            </div>

            <div className="sheet-batch-breakdown">
              <div className="batch-box primary">
                <span className="batch-tag">Batch 1 (Initial Cook)</span>
                <strong className="batch-qty">
                  {singlePlan.plan.recommended_initial_batch} portions
                </strong>
                <p>
                  Have hot holding vessels ready &gt;65°C by 11:15 AM before
                  doors open.
                </p>
              </div>

              <div className="batch-box secondary">
                <span className="batch-tag">
                  Mid-Service Refill Decision Gate
                </span>
                <strong className="batch-qty">
                  {singlePlan.plan.refill_trigger_threshold > 0
                    ? `Fire Batch 2 when remaining drops to ≤ ${singlePlan.plan.refill_trigger_threshold} portions`
                    : "Single batch preparation — no replenishment scheduled"}
                </strong>
                <p>
                  Do not cook subsequent batches unless demand pace breaches
                  threshold.
                </p>
              </div>
            </div>

            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Metric / Factor</th>
                  <th>Value</th>
                  <th>Operational Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Predicted Demand</td>
                  <td>
                    <strong>{singlePlan.plan.predicted_demand}</strong> portions
                  </td>
                  <td>Ensemble model forecast for today's lunch service</td>
                </tr>
                <tr>
                  <td>Forecast Uncertainty (80% Interval)</td>
                  <td>
                    {singlePlan.plan.lower_bound} –{" "}
                    {singlePlan.plan.upper_bound} portions
                  </td>
                  <td>
                    Expected demand range based on weekday & event signals
                  </td>
                </tr>
                <tr>
                  <td>Current Stock on Hand</td>
                  <td>{singlePlan.stock} portions</td>
                  <td>Deducted directly from initial cook requirement</td>
                </tr>
                <tr>
                  <td>Net Portions to Prepare</td>
                  <td>
                    <strong>{singlePlan.plan.recommended_total_plan}</strong>{" "}
                    portions
                  </td>
                  <td>
                    Optimal production target balancing stockouts against waste
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : items && items.length > 0 ? (
          <div className="sheet-multi-view">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Menu Item</th>
                  <th>Category</th>
                  <th className="numeric">Demand</th>
                  <th className="numeric">Range (80%)</th>
                  <th className="numeric">Initial Batch</th>
                  <th className="numeric">Refill Trigger</th>
                  <th className="numeric">Target Total</th>
                  <th className="center">Chef Sign-off</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.menu_item}>
                    <td>
                      <strong>{item.menu_item}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td className="numeric">{item.predicted_demand}</td>
                    <td className="numeric">
                      {item.lower_bound}–{item.upper_bound}
                    </td>
                    <td className="numeric highlight">
                      <strong>{item.initial_batch}</strong> port.
                    </td>
                    <td className="numeric">
                      {item.refill_trigger_label ||
                        (item.refill_trigger
                          ? `≤ ${item.refill_trigger}`
                          : "Single batch")}
                    </td>
                    <td className="numeric strong">
                      <strong>{item.recommended_prep}</strong> port.
                    </td>
                    <td className="center sign-cell">[ &nbsp; ] Cooked</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sheet-empty">
            No preparation schedule items available for this service date.
          </p>
        )}

        {/* Operating Rules & Food Handling */}
        <section className="sheet-safety-section">
          <h4>Kitchen Operational Protocol & Quality Control</h4>
          <div className="safety-grid">
            <div className="safety-item">
              <strong>1. Hot Holding Temperature</strong>
              <p>
                Keep hot holding wells and bain-maries at &gt;65°C throughout
                service.
              </p>
            </div>
            <div className="safety-item">
              <strong>2. Staggered Batch Replenishment</strong>
              <p>
                Do not cook second batches until customer pace drops counter
                display below Refill Trigger.
              </p>
            </div>
            <div className="safety-item">
              <strong>3. Post-Service Leftover Audit</strong>
              <p>
                At 14:00 cutoff, record unsold portions in WasteWise AI Surplus
                Rescue before chilling or donation.
              </p>
            </div>
          </div>
        </section>

        {/* Sign-off signatures */}
        <footer className="sheet-doc-footer">
          <div className="sig-block">
            <span>Lead Line Cook Signature:</span>
            <div className="sig-line">____________________________________</div>
          </div>
          <div className="sig-block">
            <span>Kitchen Shift Supervisor Signature:</span>
            <div className="sig-line">____________________________________</div>
          </div>
          <div className="sig-block date-sig">
            <span>Verified Time:</span>
            <div className="sig-line">_______ : _______ AM / PM</div>
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
