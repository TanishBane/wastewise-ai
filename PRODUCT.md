# WasteWise AI

## Platform
Web application, React and TypeScript with a Python FastAPI backend.

## Users and purpose
Canteen operators planning food preparation under uncertain demand. The user confirmed daily operations as the primary use, with a clearly labeled demonstration mode.

## Workflows
Review menu demand, investigate a forecast, set preparation quantities and batches, triage potential surplus, inspect holdout performance, and upload historical CSV records. All computed figures come from the backend. Local review marks and saved plans are explicitly labeled and never represented as a server-side kitchen dispatch.

## Constraints
Preserve existing API routes and hash destinations. Distinguish synthetic demonstration data, uploaded records, forecasts, and retrospective simulations. Never infer biological food safety from forecasts. Do not invent sales histories, savings, live synchronization, or model accuracy. Maintain usable keyboard navigation, responsive layouts, and reduced-motion behavior.

## Stack
Existing React 19, TypeScript, Vite, Recharts, and Lucide. Self-hosted IBM Plex Sans. Local deployment; no new external runtime services.
