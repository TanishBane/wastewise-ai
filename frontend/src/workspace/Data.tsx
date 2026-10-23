import MetalButton from "../MetalButton";
import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  RotateCcw,
  Search,
  UploadCloud,
} from "lucide-react";
import { fetchDataInfo, resetDataset, uploadDatasetCSV } from "../api";
import { AnimatedNumber } from "../motion";
import {
  Badge,
  AsyncButton,
  Dialog,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
  Panel,
  Stats,
} from "./shared";
import { date, useResource } from "./model";
import type { ScreenProps } from "./model";

const schema = [
  ["date", "Required", "Service date, YYYY-MM-DD"],
  ["menu_item", "Required", "Consistent dish name"],
  ["portions_sold", "Required", "Number of portions sold, zero or more"],
  ["day_of_week", "Required", "Monday through Sunday"],
  ["attendance_index", "Required", "Typical day = 1.0"],
  ["campus_event", "Required", "0 or 1"],
  ["weather", "Required", "Use the weather labels in the template"],
  ["cost_per_portion", "Required", "Ingredient cost in INR, greater than zero"],
  ["selling_price", "Required", "Menu price in INR"],
  ["temperature_c", "Optional", "Temperature in Celsius; defaults to 28"],
  ["portions_prepared", "Optional", "Total portions prepared for the day"],
  ["food_discarded", "Optional", "Discarded portions"],
  ["stockout_flag", "Optional", "0 or 1"],
];
export default function Data({ config, revision, onDataChange }: ScreenProps) {
  const { data, loading, error, retry } = useResource(fetchDataInfo, revision);
  const [busy, setBusy] = useState(false);
  const [operation, setOperation] = useState<"upload" | "reset">("upload");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const upload = async (file?: File) => {
    if (!file || busy) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage({
        error: true,
        text: "Choose a .csv file. Download the template for the expected format.",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({
        error: true,
        text: "This upload is larger than 10 MB. Use a smaller CSV for this local workspace.",
      });
      return;
    }
    setBusy(true);
    setOperation("upload");
    setMessage(null);
    try {
      const result = await uploadDatasetCSV(file);
      setMessage({ error: false, text: result.message });
      onDataChange();
    } catch (reason) {
      setMessage({
        error: true,
        text:
          reason instanceof Error
            ? reason.message
            : "Upload failed. Check the schema and try again.",
      });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  const reset = async () => {
    setConfirm(false);
    setBusy(true);
    setOperation("reset");
    setMessage(null);
    try {
      const result = await resetDataset();
      setMessage({ error: false, text: result.message });
      onDataChange();
    } catch (reason) {
      setMessage({
        error: true,
        text:
          reason instanceof Error ? reason.message : "Reset failed. Try again.",
      });
    } finally {
      setBusy(false);
    }
  };
  const template = `${import.meta.env.VITE_API_BASE_URL || ""}/api/data/template`;
  const rows =
    data?.preview.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query.toLowerCase()),
      ),
    ) || [];
  return (
    <>
      <PageHeading
        title="Bring your service history."
        description="Bring your service history into the plan. See exactly what the model learns from."
      >
        <a className="button" href={template} download>
          <ArrowDownToLine size={16} />
          Download CSV template
        </a>
      </PageHeading>
      {message && (
        <div
          role={message.error ? "alert" : "status"}
          className={message.error ? "inline-error" : "saved-note"}
        >
          {!message.error && <CheckCircle2 size={17} />}
          {message.text}
        </div>
      )}
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState
          message={error || "No dataset information returned."}
          retry={retry}
        />
      ) : (
        <>
          <Stats
            items={[
              {
                label: "Active service records",
                value: <AnimatedNumber value={data.total_records} />,
                note: data.is_synthetic
                  ? "Synthetic demonstration data"
                  : "Uploaded operator records",
              },
              {
                label: "History begins",
                value: date(data.date_min, true),
                note: date(data.date_min),
              },
              {
                label: "Latest service",
                value: date(data.date_max, true),
                note: date(data.date_max),
              },
              {
                label: "Menu configuration",
                value: <AnimatedNumber value={config.menu_item_names.length} />,
                note: "Configured dishes available for planning",
              },
            ]}
          />
          <div className="data-trust-banner">
            <div className="trust-item">
              <span className="trust-label">Dataset Provenance</span>
              <strong>
                {data.is_synthetic
                  ? "Synthetic Demonstration (180 Days)"
                  : data.last_filename || "Operator Dataset Active"}
              </strong>
            </div>
            <div className="trust-divider">·</div>
            <div className="trust-item">
              <span className="trust-label">Coverage Window</span>
              <strong>
                {date(data.date_min)} — {date(data.date_max)}
              </strong>
            </div>
            <div className="trust-divider">·</div>
            <div className="trust-item">
              <span className="trust-label">Last Synchronization</span>
              <strong>{data.last_import || "Pre-bundled Synthetic"}</strong>
            </div>
            <div className="trust-divider">·</div>
            <div className="trust-item">
              <span className="trust-label">Schema Validation</span>
              <strong className="positive-text">
                100% Strict Schema Verified
              </strong>
            </div>
          </div>
          <div className="data-grid">
            <Panel
              title="Start with a service log"
              description="A CSV with at least 14 distinct service days."
              action={
                <Badge tone={data.is_synthetic ? "warning" : "positive"}>
                  {data.is_synthetic
                    ? "Demo data active"
                    : "Operator data active"}
                </Badge>
              }
            >
              <div
                className={`upload-zone ${dragging ? "dragging" : ""} ${busy ? "uploading" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  upload(event.dataTransfer.files[0]);
                }}
              >
                <UploadCloud size={35} strokeWidth={1.3} />
                <h3>
                  {busy ? "Validating and training…" : "Drop your CSV here"}
                </h3>
                <p>
                  {busy
                    ? "Keep this tab open while the model learns from your service records."
                    : "or choose a file from your computer"}
                </p>
                <AsyncButton
                  className="button primary"
                  disabled={busy}
                  busy={busy && operation === "upload"}
                  busyLabel="Validating & training…"
                  onClick={() => input.current?.click()}
                >
                  <FileSpreadsheet size={16} />
                  {busy ? "Processing…" : "Choose CSV file"}
                </AsyncButton>
                <input
                  ref={input}
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Upload historical service CSV"
                  className="visually-hidden"
                  disabled={busy}
                  onChange={(event) => upload(event.target.files?.[0])}
                />
                <small>UTF-8 CSV · up to 10 MB in this interface</small>
              </div>
              <div className="upload-steps">
                <span>
                  <FileSpreadsheet size={15} />
                  Validate schema
                </span>
                <ArrowRight size={13} />
                <span>
                  <Database size={15} />
                  Train model
                </span>
                <ArrowRight size={13} />
                <span>
                  <RotateCcw size={15} />
                  Refresh workspace
                </span>
              </div>
              <Notice>
                Uploading replaces the active dataset for this local workspace.
                The validated source and its audit record are retained across
                backend restarts; the original file remains your source record.
              </Notice>
            </Panel>
            <Panel
              title="A few things to know"
              description="A small check now saves a confusing forecast later."
            >
              <div className="data-notes">
                <div>
                  <strong>Use a consistent menu</strong>
                  <p>
                    The planner uses {config.menu_item_names.length} configured
                    dishes. Other names can be learned from, but won’t
                    automatically become new menu options.
                  </p>
                </div>
                <div>
                  <strong>Keep service days in order</strong>
                  <p>
                    Dates are normalized before a chronological train/holdout
                    split. Include at least 14 unique dates.
                  </p>
                </div>
                <div>
                  <strong>Match the template’s column names</strong>
                  <p>
                    Use cost_per_portion for ingredient cost. Missing
                    temperature defaults to 28°C.
                  </p>
                </div>
                <div>
                  <strong>Return to a safe demo anytime</strong>
                  <p>
                    Restoring demo data replaces the current in-memory operator
                    dataset.
                  </p>
                  <AsyncButton
                    className="button"
                    disabled={busy || data.is_synthetic}
                    busy={busy && operation === "reset"}
                    busyLabel="Restoring demo…"
                    onClick={() => setConfirm(true)}
                  >
                    <RotateCcw size={15} />
                    Restore demonstration data
                  </AsyncButton>
                </div>
              </div>
            </Panel>
          </div>
          <Panel
            title="A window into the active dataset"
            description="The 15 most recent records from the active dataset."
            action={
              <div className="input-search">
                <Search size={16} />
                <input
                  aria-label="Search dataset preview"
                  placeholder="Search recent records…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
          >
            <div className="table-scroll data-table">
              <table>
                <thead>
                  <tr>
                    {data.columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className={
                          [
                            "menu_item",
                            "date",
                            "weather",
                            "category",
                            "day_of_week",
                          ].includes(column)
                            ? ""
                            : "numeric"
                        }
                      >
                        {column.replaceAll("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {data.columns.map((column) => (
                        <td
                          key={column}
                          className={
                            typeof row[column] === "number" ? "numeric" : ""
                          }
                        >
                          {row[column] == null ? "—" : String(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <Empty
                title="No recent records match"
                text="Clear the search to see the latest service records."
                action={
                  query ? (
                    <MetalButton
                      className="button small"
                      onClick={() => setQuery("")}
                    >
                      Clear search
                    </MetalButton>
                  ) : undefined
                }
              />
            )}
          </Panel>
          <Panel
            title="The schema, without the guesswork"
            description="Required and optional columns accepted by the importer."
          >
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Requirement</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.map(([name, requirement, description]) => (
                    <tr key={name}>
                      <td>
                        <code>{name}</code>
                      </td>
                      <td>
                        <Badge>{requirement}</Badge>
                      </td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Restore demonstration data?"
      >
        <div className="dialog-body">
          <Database size={28} />
          <p>
            This replaces the active operator records with the synthetic sample
            and retrains the model. Download or retain your original CSV first.
          </p>
          <div className="button-row">
            <MetalButton className="button" onClick={() => setConfirm(false)}>
              Keep current data
            </MetalButton>
            <MetalButton className="button primary" onClick={reset}>
              Restore demo data
            </MetalButton>
          </div>
        </div>
      </Dialog>
    </>
  );
}
