import {
  ArrowRight,
  BarChart3,
  Check,
  ChefHat,
  ShieldCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";
import MetalButton from "../MetalButton";
import type { Navigate } from "./model";

export default function Home({ navigate }: { navigate: Navigate }) {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker">
            <Sprout size={15} />
            A calmer way to run the canteen
          </span>
          <h1>Make every portion count.</h1>
          <p>
            WasteWise turns daily demand signals into confident preparation
            decisions—so your team can cook what people need, when they need
            it.
          </p>
          <div className="home-actions">
            <div className="home-action-buttons">
              <MetalButton
                className="button primary"
                onClick={() => navigate("data-model")}
              >
                Add your workplace
                <ArrowRight size={16} />
              </MetalButton>
              <MetalButton
                className="button"
                onClick={() => navigate("overview")}
              >
                Explore the demo workspace
                <ArrowRight size={16} />
              </MetalButton>
            </div>
            <a
              className="home-text-link"
              href="#home-how-it-works"
            >
              See how it works
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="home-signal" aria-label="WasteWise workflow preview">
          <img
            className="home-signal-logo"
            src="/brand/wastewise-mark.png"
            alt="WasteWise"
          />
        </div>
      </section>

      <section className="home-proof" aria-label="WasteWise benefits">
        <div>
          <strong>One workspace.</strong>
          <span>From first signal to final decision.</span>
        </div>
        <div>
          <strong>Clear evidence.</strong>
          <span>Know what the model can and cannot tell you.</span>
        </div>
        <div>
          <strong>Human judgment.</strong>
          <span>Every recommendation stays reviewable.</span>
        </div>
      </section>

      <section className="home-section" id="home-how-it-works">
        <div className="home-section-heading">
          <span className="home-eyebrow">A simple operating rhythm</span>
          <h2>Less searching. More deciding.</h2>
          <p>
            The workspace follows the order your kitchen already thinks in:
            understand the day, choose a batch, then act on what remains.
          </p>
        </div>
        <div className="home-steps">
          <article className="home-step">
            <span className="home-step-number">01</span>
            <BarChart3 size={22} />
            <h3>See demand clearly</h3>
            <p>Start with the menu, service context, and an honest range.</p>
            <button onClick={() => navigate("demand-forecast")}>
              Explore forecasts <ArrowRight size={14} />
            </button>
          </article>
          <article className="home-step home-step-featured">
            <span className="home-step-number">02</span>
            <ChefHat size={22} />
            <h3>Prepare with intent</h3>
            <p>Turn a forecast into an initial batch and a sensible refill.</p>
            <button onClick={() => navigate("prep-planner")}>
              Build a plan <ArrowRight size={14} />
            </button>
          </article>
          <article className="home-step">
            <span className="home-step-number">03</span>
            <TriangleAlert size={22} />
            <h3>Rescue what matters</h3>
            <p>Prioritize surplus by risk, cost, and the next best action.</p>
            <button onClick={() => navigate("waste-risk")}>
              Review surplus <ArrowRight size={14} />
            </button>
          </article>
        </div>
      </section>

      <section className="home-evidence">
        <div className="home-evidence-mark">
          <ShieldCheck size={24} />
          <span>Built for transparent decisions</span>
        </div>
        <div>
          <span className="home-eyebrow">The useful kind of intelligence</span>
          <h2>Recommendations, not black boxes.</h2>
          <p>
            Every screen keeps the important context close: where a number
            came from, what it means, and where operator judgment still
            belongs.
          </p>
          <ul>
            <li>
              <Check size={15} /> Synthetic data is clearly labeled
            </li>
            <li>
              <Check size={15} /> Ranges sit beside point estimates
            </li>
            <li>
              <Check size={15} /> Impact is shown as retrospective simulation
            </li>
          </ul>
          <button className="home-text-link" onClick={() => navigate("transparency")}>
            Read the model notes <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <section className="home-end">
        <span className="home-eyebrow">Ready when the kitchen is</span>
        <h2>Bring your workplace into focus.</h2>
        <MetalButton
          className="button primary"
          onClick={() => navigate("data-model")}
        >
          Add your workplace data
          <ArrowRight size={16} />
        </MetalButton>
      </section>
    </div>
  );
}
