import { useEffect, useState } from "react";
import {
  Check,
  ClipboardList,
  Plus,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { fetchOutcomes, recordOutcome } from "../api";
import type { ActualOutcomeItem, ConfigResponse } from "../types";
import { AsyncButton, Badge, Panel } from "./shared";

interface OutcomeLoggerProps {
  config: ConfigResponse;
  activeDish?: string;
  onOutcomeLogged?: () => void;
}

export default function OutcomeLogger({
  config,
  activeDish,
  onOutcomeLogged,
}: OutcomeLoggerProps) {
  const defaultDish =
    activeDish && config.menu_item_names.includes(activeDish)
      ? activeDish
      : config.menu_item_names[0] || "Pav Bhaji";

  const [date, setDate] = useState(
    config.latest_date || new Date().toISOString().slice(0, 10),
  );
  const [dish, setDish] = useState(defaultDish);
  const [prepared, setPrepared] = useState<number>(60);
  const [sold, setSold] = useState<number>(54);
  const [leftover, setLeftover] = useState<number>(6);
  const [wasteCause, setWasteCause] = useState("Over-preparation");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "positive" | "danger";
    message: string;
  } | null>(null);

  // History of recorded outcomes from backend SQLite
  const [history, setHistory] = useState<ActualOutcomeItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const records = await fetchOutcomes();
      setHistory(records);
    } catch {
      // Degrade gracefully if offline
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Sync leftover estimate when prepared or sold changes
  const handlePreparedChange = (val: number) => {
    const p = Math.max(0, val);
    setPrepared(p);
    setLeftover(Math.max(0, p - sold));
  };

  const handleSoldChange = (val: number) => {
    const s = Math.max(0, val);
    setSold(s);
    setLeftover(Math.max(0, prepared - s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sold > prepared) {
      setFeedback({
        tone: "danger",
        message: "Portions sold cannot exceed portions prepared.",
      });
      return;
    }
    if (leftover < 0) {
      setFeedback({
        tone: "danger",
        message: "Portions leftover cannot be negative.",
      });
      return;
    }
    if (sold + leftover !== prepared) {
      setFeedback({
        tone: "danger",
        message:
          "Portions prepared must equal portions sold plus leftover portions.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const result = await recordOutcome({
        service_date: date,
        target_meal: "Lunch",
        menu_item: dish,
        portions_prepared: prepared,
        portions_sold: sold,
        portions_leftover: leftover,
        waste_cause: wasteCause,
        discarded_kg: parseFloat((leftover * 0.2).toFixed(1)),
        donation_kg: 0,
        waste_cost: 0,
        notes,
      });

      setFeedback({
        tone: "positive",
        message: result.message || `Recorded service outcome for ${dish}.`,
      });
      setNotes("");
      await loadHistory();
      if (onOutcomeLogged) onOutcomeLogged();
    } catch (err: unknown) {
      setFeedback({
        tone: "danger",
        message:
          err instanceof Error
            ? err.message
            : "Failed to save outcome record to database.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      className="outcome-logger-panel"
      title="Record End-of-Service Outcome"
      description="Capture actual portions prepared and sold to close the feedback loop. Records persist in SQLite."
      action={
        <div className="panel-actions-compact">
          <Badge>{history.length} outcomes recorded</Badge>
          <button
            className="icon-button small"
            onClick={loadHistory}
            disabled={loadingHistory}
            title="Refresh recorded outcomes"
            aria-label="Refresh outcomes"
          >
            <RefreshCw size={14} className={loadingHistory ? "spin" : ""} />
          </button>
        </div>
      }
    >
      <div className="outcome-logger-layout">
        {/* Entry Form */}
        <form onSubmit={handleSubmit} className="outcome-form">
          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="outcome-date" className="field-label">
                Service Date
              </label>
              <input
                id="outcome-date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="outcome-dish" className="field-label">
                Menu Item
              </label>
              <select
                id="outcome-dish"
                className="select"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
              >
                {config.menu_item_names.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-grid three-col">
            <div className="form-group">
              <label htmlFor="outcome-prepared" className="field-label">
                Portions Prepared
              </label>
              <input
                id="outcome-prepared"
                type="number"
                min="0"
                className="input tabular-num"
                value={prepared}
                onChange={(e) => handlePreparedChange(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="outcome-sold" className="field-label">
                Portions Sold
              </label>
              <input
                id="outcome-sold"
                type="number"
                min="0"
                className="input tabular-num"
                value={sold}
                onChange={(e) => handleSoldChange(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="outcome-leftover" className="field-label">
                Leftover (Unsold)
              </label>
              <input
                id="outcome-leftover"
                type="number"
                min="0"
                className="input tabular-num"
                value={leftover}
                onChange={(e) => setLeftover(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label htmlFor="outcome-cause" className="field-label">
                Observed Waste Cause
              </label>
              <select
                id="outcome-cause"
                className="select"
                value={wasteCause}
                onChange={(e) => setWasteCause(e.target.value)}
              >
                <option value="Over-preparation">
                  Over-preparation (excess initial fire)
                </option>
                <option value="Unexpected low footfall">
                  Unexpected low footfall / weather dip
                </option>
                <option value="Quality / holding limit">
                  Quality / holding time limit reached
                </option>
                <option value="Late replenishment">
                  Replenishment fired too late in shift
                </option>
                <option value="Accidental spoilage">
                  Preparation loss / kitchen spill
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="outcome-notes" className="field-label">
                Shift Observation Notes
              </label>
              <input
                id="outcome-notes"
                type="text"
                className="input"
                placeholder="e.g. Rainy afternoon, student crowd tapered off after 13:15."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`inline-banner ${feedback.tone === "positive" ? "success-banner" : "error-banner"}`}
              role="alert"
            >
              {feedback.tone === "positive" ? (
                <Check size={16} />
              ) : (
                <TriangleAlert size={16} />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="form-actions">
            <AsyncButton
              type="submit"
              className="button primary"
              busy={saving}
              busyLabel="Recording outcome…"
            >
              <Plus size={16} />
              Save Operational Outcome
            </AsyncButton>
          </div>
        </form>

        {/* Recent Outcomes Table */}
        <div className="outcome-history-block">
          <div className="history-header">
            <h4>Recent Persistent Service Records</h4>
            <span className="history-count">
              {history.length === 0
                ? "No entries yet"
                : `${history.length} logged`}
            </span>
          </div>

          {history.length > 0 ? (
            <div className="table-scroll compact">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Dish</th>
                    <th className="numeric">Prepared</th>
                    <th className="numeric">Sold</th>
                    <th className="numeric">Leftover</th>
                    <th>Waste Cause</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.service_date}</strong>
                      </td>
                      <td>{item.menu_item}</td>
                      <td className="numeric">{item.portions_prepared}</td>
                      <td className="numeric">{item.portions_sold}</td>
                      <td className="numeric highlight-warn">
                        {item.portions_leftover}
                      </td>
                      <td>
                        <span className="cause-tag">
                          {item.waste_cause || "Over-prep"}
                        </span>
                      </td>
                      <td className="table-notes-cell">{item.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-history-placeholder">
              <ClipboardList size={22} className="muted-icon" />
              <p>No operational outcomes recorded yet.</p>
              <small>
                Use the form above to record portions prepared and sold after
                today's service.
              </small>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
