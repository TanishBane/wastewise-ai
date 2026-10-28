import { useEffect, useRef, useState } from "react";
import type { ConfigResponse } from "../types";

export type Page =
  | "home"
  | "overview"
  | "demand-forecast"
  | "prep-planner"
  | "waste-risk"
  | "performance"
  | "data-model"
  | "privacy"
  | "terms"
  | "transparency"
  | "help";
export type Navigate = (page: Page, dish?: string) => void;
export interface ScreenProps {
  config: ConfigResponse;
  revision: number;
  navigate: Navigate;
  dish: string;
  onDataChange: () => void;
}
export const number = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const date = (value?: string, compact = false) => {
  if (!value) return "Date unavailable";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.valueOf())
    ? value
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(compact ? {} : { year: "numeric" }),
      });
};

export function useResource<T>(load: () => Promise<T>, key: string | number) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify([key, attempt]);
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  }>({ key: "", data: null, error: null });
  useEffect(() => {
    let current = true;
    loadRef
      .current()
      .then((data) => {
        if (current) setState({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (current)
          setState({
            key: requestKey,
            data: null,
            error:
              error instanceof Error ? error.message : "Something went wrong.",
          });
      });
    return () => {
      current = false;
    };
  }, [requestKey]);
  return {
    ...state,
    loading: state.key !== requestKey,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    let text = String(value);
    if (typeof value === "string" && /^[=+@\-\t\r]/.test(text))
      text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
