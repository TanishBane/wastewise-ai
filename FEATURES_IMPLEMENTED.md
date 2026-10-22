# WasteWise AI — Features Implemented & UI Refinements

## 1. Overview of Delivered Enhancements

This document summarizes the user-facing and architectural features implemented across the Complete Coordinated Upgrade of **WasteWise AI** for **ADAPPT 5.0 — AI in FoodTech**.

---

## 2. Connected AI & Operational Features

### A. Interactive Demand Simulator (`#demand-forecast` & `#prep-planner`)
- **Dynamic Scenario Controls**:
  - **Service Day**: Full 7-day selection.
  - **Expected Attendance**: Range slider from $10\%$ to $180\%$ ($100\%$ baseline).
  - **Weather Conditions**: Sunny / Mild, Overcast, Hot / Humid, Rainy / Monsoon.
  - **Campus Event / Festival**: Instant toggle accounting for non-linear demand surges.
  - **Ready-to-Serve Stock**: Live deduction from batch recommendations.
  - **Service Level Preference**: Dynamic $30\%\text{--}80\%$ tradeoff slider between waste minimization and availability.
- **Dirty State Indicator**:
  - When scenario conditions change, prior calculation results are gracefully hidden with an actionable warning banner: *"Conditions changed. Recalculate to update."*
- **Preserved Presets**:
  - `Normal`, `Event`, and `Rainy` presets trigger real model API calls without client-side multipliers or mock numbers.

### B. Explainable Recommendations & Real Feature Attributions
- **Model-Wide Drivers Panel**:
  - Reads global feature importances directly from `engine.feature_importances_`:
    - Attendance Footfall
    - Dish Baseline Demand
    - Day of the Week
    - Campus Event Surges
    - Weather / Temperature Shifts
  - Labeled explicitly as **"Model-wide drivers"** to maintain scientific and operational transparency.
- **Attendance Index Definition**:
  - Documented and displayed in the interface:
    > `attendance_index` is the relative ratio of campus footfall compared to normal baseline ($1.0 = \text{typical campus attendance}$, $1.3 = +30\%$ footfall due to exam periods or cultural events, $0.7 = \text{vacation/holiday recess}$). It is estimated at morning planning time from student hostel occupancy, academic timetables, and campus registration logs.

### C. Transparent Impact Disclosures & Assumption Modeling
- **Simulated Savings Disclosure**:
  - All occurrences of simulated monetary savings ($₹48,324$) are prominently annotated with:
    > **"Simulated on synthetic data. Not measured."**
  - **Full Underlying Assumptions Displayed**:
    - Replays historical demand against Newsvendor $55\%$ critical ratio service level.
    - Compares against a traditional $16\%$ safety overprep baseline.
    - Ingredient savings calculate raw food cost avoiding food disposal ($₹18\text{--}₹65/\text{portion}$).
    - Missed-sale margin penalties and goodwill costs are excluded.
    - Carbon emissions compute using $0.32\text{ kg}/\text{portion}$ food mass and $2.5\text{ kg CO}_2\text{e}/\text{kg}$ food waste factor.

### D. Operational Kitchen Outcome Capture (`#performance`)
- **Direct Post-Service Logging**:
  - Canteen managers can record actual kitchen results for every meal service via **"Log service outcome"**:
    - Service Date & Target Meal (Breakfast, Lunch, Dinner, Snacks)
    - Menu Item Dish
    - Portions Prepared & Portions Sold
    - Leftover Portions & Discarded Weight ($\text{kg}$)
    - Qualitative Kitchen Notes (e.g., weather turns, batch spoilage, staff donations)
- **Durable Storage**:
  - Records persist to SQLite `actual_outcomes` and are dynamically displayed in an audit table for post-service variance analysis.

---

## 3. UI/UX, Motion & Visual Craft

### A. Frosted-Glass Bottom-Edge Scroll Blur
- **True Scroll Container Placement**:
  - Implemented on `.work-sheet` / `main` with viewport fixed positioning (`.scroll-frosted-edge`).
  - Restrained gradient: Fades from transparent into soft ivory/ground token (`var(--ground)`).
  - Subtle blur: `backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);`.
  - Non-interfering: `pointer-events: none` ensures clicks, text selections, and keyboard focus are never obstructed.
  - Scroll-Aware Dynamics: Automatically fades to `opacity: 0` when the user scrolls to the bottom of the page or when content does not overflow the viewport.
  - Motion Respect: Completely disables blur filtering under `@media (prefers-reduced-motion: reduce)`.

### B. Tactile Metal Controls (`MetalButton`)
- Multi-layer reflection system:
  - `.metal-rim-motion`: Orbiting conic gradient rim simulating brushed chrome edges.
  - `.metal-light`: Pointer-tracking face reflection following cursor coordinates across $X$ and $Y$ axes.
  - Reflection sweep: Web Animations API triggers a smooth highlight sweep on pointerdown and touch press.
  - Pauses rotation when button is disabled (`button:disabled .metal-environment`).
  - Replaces all motion with static accessible state under `prefers-reduced-motion: reduce`.

### C. Accessible Guided Demo Tour
- Comprehensive 5-step interactive walk-through:
  1. **Load day**: Canteen overview uniting demand forecasts, prep targets, and surplus priorities.
  2. **Read forecast**: Point predictions, 80% ensemble uncertainty bounds, and model-wide feature drivers.
  3. **Choose plan**: Stochastic Newsvendor batch planning, safe stock deduction, and replenishment triggers.
  4. **Toggle campus event**: Simulating festival footfall and special event adaptations.
  5. **Log actuals**: Post-service operational reality logging to track real waste reduction.
- Keyboard accessible: Esc closes, Tab trapped, Arrow keys / buttons navigate, fully offline capable.

### D. Instant Command Palette Dialog
- Triggered by `Ctrl+K` / `Cmd+K` or "Find a page" button.
- Configured with `dialog-instant` (`animation: none`) for immediate keyboard focus without decorative opening delay.
- Enables lightning-fast routing between all 11 application screens.
