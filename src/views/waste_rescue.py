"""
WasteWise AI - View 4: Waste-Risk Monitoring (Operational Triage)
Professional operations table, prioritized risk tiering, batch pull-back directives,
and strict food-safety donation boundaries.
"""

import pandas as pd
import streamlit as st

from src.config import MENU_ITEMS
from src.metrics import classify_waste_risks
from src.ui_theme import (
    render_callout,
    render_context_banner,
    render_kpi,
    render_page_header,
)


def render_waste_rescue_view(engine, dataset_df, is_synthetic: bool = True):
    render_page_header(
        title="Waste-risk monitoring",
        subtitle="Operational triage to intercept overproduction before service completion.",
        meta_label="STAGE 3: RESCUE",
    )

    provenance_text = (
        "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"
        if is_synthetic
        else "OPERATOR ENVIRONMENT · Custom historical CSV active"
    )
    render_context_banner(provenance_text)

    # Compute Today's Forecasts & Planned Batches across all 8 items
    latest_date = dataset_df["date"].max()
    day_df = dataset_df[dataset_df["date"] == latest_date]
    if day_df.empty:
        day_df = dataset_df.tail(8)

    forecasts = {}
    preps = {}

    for item_name in MENU_ITEMS.keys():
        match = day_df[day_df["menu_item"] == item_name]
        att_idx = float(match["attendance_index"].values[0]) if not match.empty else 1.0
        event_flag = int(match["campus_event"].values[0]) if not match.empty else 0
        weather_val = str(match["weather"].values[0]) if not match.empty else "Sunny / Mild"
        day_name = str(match["day_of_week"].values[0]) if not match.empty else "Monday"

        if engine.is_trained:
            res = engine.predict_scenario(
                menu_item=item_name,
                day_of_week=day_name,
                attendance_index=att_idx,
                campus_event=event_flag,
                weather=weather_val,
            )
            d = res.predicted_demand
        else:
            d = float(MENU_ITEMS[item_name].base_demand)

        forecasts[item_name] = d
        preps[item_name] = int(round(d * 1.18))

    actions = classify_waste_risks(forecasts, preps)

    # Summary Row: 4 Metric Cards
    high_count = sum(1 for a in actions if a.risk_level == "High")
    mod_count = sum(1 for a in actions if a.risk_level == "Moderate")
    total_surplus_portions = sum(a.potential_surplus_portions for a in actions)
    total_cost_risk = sum(a.ingredient_cost_at_risk for a in actions)

    k1, k2, k3, k4 = st.columns(4)
    with k1:
        render_kpi(
            label="High surplus risk",
            value=f"{high_count}",
            unit="items",
            meta="Requires initial batch pull-back",
            pill_text="CRITICAL",
            pill_variant="red" if high_count > 0 else "neutral",
        )
    with k2:
        render_kpi(
            label="Moderate risk",
            value=f"{mod_count}",
            unit="items",
            meta="Hold replenishment at review point",
            pill_text="WATCH",
            pill_variant="amber" if mod_count > 0 else "neutral",
        )
    with k3:
        render_kpi(
            label="Total surplus exposure",
            value=f"{total_surplus_portions}",
            unit="portions",
            meta="Avoidable over-preparation buffer",
            pill_text="VOLUME",
            pill_variant="neutral",
        )
    with k4:
        render_kpi(
            label="Ingredient cost at risk",
            value=f"₹{total_cost_risk:,.0f}",
            unit="",
            meta="Raw ingredient capital at risk",
            pill_text="CAPITAL",
            pill_variant="amber" if total_cost_risk > 1500 else "neutral",
        )

    st.markdown("<div style='height: 1.25rem;'></div>", unsafe_allow_html=True)

    # Filter Bar
    filter_col1, filter_col2 = st.columns([1.5, 3])
    with filter_col1:
        selected_risk = st.selectbox(
            "Filter by risk tier",
            options=["All tiers", "High risk only", "Moderate risk only", "Low risk only"],
            index=0,
            key="waste_risk_filter",
        )

    filtered_actions = actions
    if selected_risk == "High risk only":
        filtered_actions = [a for a in actions if a.risk_level == "High"]
    elif selected_risk == "Moderate risk only":
        filtered_actions = [a for a in actions if a.risk_level == "Moderate"]
    elif selected_risk == "Low risk only":
        filtered_actions = [a for a in actions if a.risk_level == "Low"]

    st.markdown(
        """
        <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
            Operational triage table
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Professional Operations Table (Section 7.C)
    table_rows = []
    for act in filtered_actions:
        cfg = MENU_ITEMS[act.menu_item]
        table_rows.append({
            "Menu item": act.menu_item,
            "Category": cfg.category,
            "Forecast": f"{act.predicted_demand:.0f} portions",
            "Planned prep": f"{act.planned_preparation} portions",
            "Potential surplus": f"+{act.potential_surplus_portions} portions",
            "Cost at risk": f"₹{act.ingredient_cost_at_risk:,.0f}",
            "Risk level": act.risk_level,
            "Suggested kitchen action": act.primary_action,
        })

    ops_df = pd.DataFrame(table_rows)
    st.dataframe(ops_df, hide_index=True, use_container_width=True)

    st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)

    # Detailed Action Callout per High/Mod Risk Item
    if any(a.risk_level in ["High", "Moderate"] for a in filtered_actions):
        st.markdown(
            """
            <div style="font-size: 0.84rem; font-weight: 600; color: #17212B; margin: 0.75rem 0 0.35rem 0;">
                Detailed kitchen handling instructions
            </div>
            """,
            unsafe_allow_html=True,
        )
        for act in filtered_actions:
            if act.risk_level in ["High", "Moderate"]:
                render_callout(
                    title=f"{act.menu_item} · {act.action_type} ({act.risk_level} Risk)",
                    text=f"{act.operational_details} | {act.safety_advisory}",
                    variant="warning" if act.risk_level == "Moderate" else "danger",
                )

    # Food Safety Compliance Callout
    render_callout(
        title="Food Safety & Donation Compliance Boundaries",
        text=(
            "Crucial Operating Boundary: WasteWise AI is an operational decision-support tool, not a biological food-safety certification system. "
            "Demand models cannot verify microbiological safety. Hot cooked food held in the danger zone (5°C to 60°C) for over 2 hours cannot be donated. "
            "All physical donations or student surplus pricing require chef sensory inspection and thermal logging."
        ),
        variant="info",
    )
