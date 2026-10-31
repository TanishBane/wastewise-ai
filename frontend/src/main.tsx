import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import "./index.css";
import App from "./App.tsx";
import "./telemetry";

if (typeof document !== "undefined" && "fonts" in document) {
  document.fonts.load('16px "Newsreader"');
  document.fonts.load('16px "Jakarta Sans"');
  document.fonts.load('16px "JetBrains Mono"');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
