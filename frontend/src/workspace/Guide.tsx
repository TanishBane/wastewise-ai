import {
  ArrowRight,
  BookOpen,
  ChefHat,
  Database,
  ShieldCheck,
} from "lucide-react";
import { Badge, Notice, PageHeading, Panel } from "./shared";
import type { Page, ScreenProps } from "./model";

export default function Guide({
  page,
  navigate,
}: ScreenProps & { page: Page }) {
  const privacy = page === "privacy";
  const terms = page === "terms";
  const transparency = page === "transparency";
  const title = privacy
    ? "Your service records, handled plainly."
    : terms
      ? "A little clarity before you cook."
      : transparency
        ? "Know what the model knows."
        : "The kitchen field guide.";
  return (
    <>
      <PageHeading
        title={title}
        description={
          privacy
            ? "How this local prototype uses and retains data."
            : terms
              ? "Use guidance and the limits of this prototype."
              : transparency
                ? "What is estimated, what is observed, and what remains uncertain."
                : "A practical guide to running WasteWise in your kitchen."
        }
      />
      <div className="guide-layout">
        <Panel
          title={
            privacy
              ? "Data handling"
              : terms
                ? "Operator responsibilities"
                : transparency
                  ? "The model and its limits"
                  : "From service history to a better plan"
          }
        >
          {privacy ? (
            <div className="prose">
              <h3>Uploaded service records</h3>
              <p>
                Your CSV is sent to the configured WasteWise backend for
                validation, model training, and preview. This implementation
                keeps the uploaded dataset in server memory. It is replaced by
                another upload, a demo reset, or a server restart.
              </p>
              <h3>Shared backend, shared dataset</h3>
              <p>
                All sessions using the same backend see the same active dataset.
                This prototype does not provide account authentication or
                per-user dataset isolation. Use it in a controlled environment.
              </p>
              <h3>Browser storage and external services</h3>
              <p>
                Local interface preferences or review marks may live in your
                browser. Fonts are served with the application. The forecasting
                engine does not require an external language-model API. Network
                traffic still depends on how you host and configure the app.
              </p>
              <h3>Choose data deliberately</h3>
              <p>
                Upload operational counts rather than names, payment details, or
                other personal information. Retain your source CSV; this
                workspace is not a permanent records archive.
              </p>
            </div>
          ) : terms ? (
            <div className="prose">
              <h3>Decision support, with human review</h3>
              <p>
                WasteWise proposes demand and batch quantities. A responsible
                operator must confirm ingredient availability, kitchen capacity,
                timing, actual sales, and safe food handling before using a
                recommendation.
              </p>
              <h3>Prototype limitations</h3>
              <p>
                This is an experimental operational prototype. Forecasts,
                uncertainty ranges, and cost simulations may be inaccurate.
                Exporting a plan does not send instructions to kitchen staff or
                a production system.
              </p>
              <h3>Food handling and rescue</h3>
              <p>
                No forecast certifies food as safe. Discounting, holding,
                reheating, and donation must follow your applicable procedures
                and qualified food-safety guidance.
              </p>
              <h3>Claims and evidence</h3>
              <p>
                Synthetic examples and retrospective impact simulations are not
                measured business results. Validate performance in a monitored
                pilot before relying on savings estimates.
              </p>
            </div>
          ) : transparency ? (
            <div className="prose">
              <h3>Demand forecasting</h3>
              <p>
                A Random Forest learns from menu item, weekday, weather,
                attendance, campus events, and temperature. The training target
                is portions sold, which may be lower than demand when a dish
                sells out.
              </p>
              <h3>Uncertainty is not a guarantee</h3>
              <p>
                The range uses the 10th and 90th percentiles of individual tree
                predictions. It describes ensemble variation and has not been
                calibrated to guarantee 80% coverage of future customer demand.
              </p>
              <h3>Preparation economics</h3>
              <p>
                The planner balances surplus cost and shortage cost, blends that
                balance with your service preference, and derives a target from
                an approximate normal demand distribution. Existing stock
                reduces new preparation. Batch splits are operational
                heuristics.
              </p>
              <h3>Explainability</h3>
              <p>
                Feature importance is global across the trained model. It does
                not establish causes or explain the effect of a particular
                variable in one scenario.
              </p>
              <h3>Evaluation and impact</h3>
              <p>
                Later service dates form a chronological holdout. WAPE and MAE
                compare predicted sales with observed sales. The impact
                calculation replays the planner against holdout demand;
                simulated cost, carbon, and stockouts are estimates.
              </p>
            </div>
          ) : (
            <div className="guide-steps">
              {[
                {
                  icon: Database,
                  title: "Bring the kitchen’s history",
                  text: "Start with the downloadable CSV template. Include at least 14 distinct service dates, the required demand drivers, and consistent dish names.",
                  page: "data-model" as Page,
                  action: "Connect service records",
                },
                {
                  icon: BookOpen,
                  title: "Read the service before it starts",
                  text: "Check expected menu demand and surplus priorities. Explore different attendance and weather conditions when the day looks unusual.",
                  page: "demand-forecast" as Page,
                  action: "Explore a forecast",
                },
                {
                  icon: ChefHat,
                  title: "Keep the second batch flexible",
                  text: "Enter ready-to-serve stock, review new preparation, and export a batch plan. Keep the human decision where it belongs: in the kitchen.",
                  page: "prep-planner" as Page,
                  action: "Build a kitchen plan",
                },
              ].map(
                ({
                  icon: Icon,
                  title: heading,
                  text,
                  page: destination,
                  action,
                }) => (
                  <div key={heading}>
                    <Icon size={24} strokeWidth={1.5} />
                    <div>
                      <h3>{heading}</h3>
                      <p>{text}</p>
                      <button
                        className="text-link"
                        onClick={() => navigate(destination)}
                      >
                        {action}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </Panel>
        <aside>
          <Panel
            title="Keep the distinction clear"
            action={<ShieldCheck size={18} />}
          >
            <dl className="definition-list">
              <div>
                <dt>
                  <Badge tone="warning">Demo</Badge>
                </dt>
                <dd>Synthetic records for exploration.</dd>
              </div>
              <div>
                <dt>
                  <Badge>Forecast</Badge>
                </dt>
                <dd>A model estimate, not an order.</dd>
              </div>
              <div>
                <dt>
                  <Badge>Simulation</Badge>
                </dt>
                <dd>A retrospective what-if, not a measured saving.</dd>
              </div>
              <div>
                <dt>
                  <Badge tone="positive">Operator data</Badge>
                </dt>
                <dd>
                  Uploaded service records, still subject to model limitations.
                </dd>
              </div>
            </dl>
          </Panel>
          <Notice>
            Need to move quickly? Press Ctrl/⌘ K to find a page. Press ? to
            return to this guide.
          </Notice>
        </aside>
      </div>
      {!privacy && !terms && !transparency && (
        <Panel title="Questions that come up in a real kitchen">
          <div className="faq">
            {[
              [
                "Why doesn’t the service date say today?",
                "The overview uses the latest service date in the active dataset. Scenario planning lets you choose a weekday, but does not invent a current-day sales record.",
              ],
              [
                "Can I use the app without my own data?",
                "Yes. The demo dataset lets you explore every workflow. It is clearly labeled and does not represent your kitchen’s actual demand.",
              ],
              [
                "Does reviewing a dish notify the kitchen?",
                "No. Review marks are local interface state. Export a plan and communicate it through your normal kitchen process.",
              ],
              [
                "Can savings be negative?",
                "A plan can perform worse under a given scenario. Read the error, availability, surplus, and cost figures together rather than treating any single number as success.",
              ],
              [
                "Why is a dish missing from the planner?",
                "The menu is configured in the backend. Uploading a new dish name does not automatically add it to the operational menu.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
