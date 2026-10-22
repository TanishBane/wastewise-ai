import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (typeof document !== "undefined" && "fonts" in document) {
  document.fonts.load('16px "Interwoven"');
  document.fonts.load('16px "Inter"');
  document.fonts.load('16px "Manrope"');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
