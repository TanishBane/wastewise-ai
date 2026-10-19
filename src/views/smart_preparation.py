"""
WasteWise AI - View 3: Preparation Planner (Core Decision Interface)
Cost-aware preparation planning using Newsvendor critical fractile logic,
staggered batch allocations, refill triggers, and side-by-side policy simulation.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.config import MENU_ITEMS, MENU_ITEM_NAMES, WEATHER_TYPES
from src.planner import PreparationPlanner
from src.ui_theme import (
    format_plotly_chart,
    render_callout,
    render_context_banner,
    render_kpi,
    render_page_header,
)


def render_smart_preparation_view(engine, dataset_df, is_synthetic: bool = True):
    render_page_header(
        title="Preparation planner",
        subtitle="Cost-aware batch calibration balancing holding waste against shortage risk.",
        meta_label="STAGE 2: PREPARE",
    )

    provenance_text = (
        "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"
        if is_synthetic
        else "OPERATOR ENVIRONMENT · Custom historical CSV active"
    )
    render_context_banner(provenance_text)

    # Check if a demo scenario was launched from sidebar
    demo_active = st.session_state.get("demo_scenario_active", False)
    default_item = "Pav Bhaji"
    default_att = 130 if demo_active else 100
    default_event = True if demo_active else False

    # Scenario Controls in 2 Compact Panels
    ctrl_col1, ctrl_col2 = st.columns([1.2, 1.2])

    with ctrl_col1:
        st.markdown(
            """
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748B; margin-bottom: 0.5rem;">
                1. Operational Conditions
            </div>
            """,
            unsafe_allow_html=True,
        )

        selected_item = st.selectbox(
            "Target menu item",
            options=MENU_ITEM_NAMES,
            index=MENU_ITEM_NAMES.index(default_item) if default_item in MENU_ITEM_NAMES else 0,
            key="prep_item_select",
        )
        cfg = MENU_ITEMS[selected_item]

        row_a, row_b = st.columns(2)
        with row_a:
            selected_day = st.selectbox(
                "Service day",
                options=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                index=0,
                key="prep_day_select",
            )
        with row_b:
            weather_val = st.selectbox(
                "Weather condition",
                options=WEATHER_TYPES,
                index=0,
                key="prep_weather_select",
            )

        att_slider = st.slider(
            "Expected footfall attendance (%)",
            min_value=50,
            max_value=160,
            value=default_att,
            step=5,
            key="prep_att_slider",
        )

        event_toggle = st.checkbox(
            "Major campus event / festival active",
            value=default_event,
            key="prep_event_toggle",
        )

    with ctrl_col2:
        st.markdown(
            """
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748B; margin-bottom: 0.5rem;">
                2. Economic Asymmetry & Constraints
            </div>
            """,
            unsafe_allow_html=True,
        )

        current_inventory = st.number_input(
            "Existing inventory / prepped stock on hand",
            min_value=0,
            max_value=150,
            value=0,
            step=5,
            key="prep_inv_input",
        )

        col_cost1, col_cost2 = st.columns(2)
        with col_cost1:
            cost_surplus = st.number_input(
                "Cost of excess (₹/portion)",
                min_value=5.0,
                max_value=200.0,
                value=float(cfg.cost_per_portion),
                step=2.0,
                key="prep_surplus_cost",
            )
        with col_cost2:
            cost_shortage = st.number_input(
                "Cost of shortage (₹/portion)",
                min_value=5.0,
                max_value=200.0,
                value=float(cfg.selling_price - cfg.cost_per_portion),
                step=2.0,
                key="prep_shortage_cost",
            )

        service_level_pref = st.slider(
            "Service level appetite (buffer tolerance)",
            min_value=0.30,
            max_value=0.85,
            value=0.55,
            step=0.05,
            key="prep_service_pref",
        )

        traditional_prep_policy = st.number_input(
            "Traditional baseline preparation habit",
            min_value=20,
            max_value=200,
            value=int(round(cfg.base_demand * 1.25)),
            step=5,
            key="prep_trad_habit",
        )

    # Compute Forecast & Decision Plan
    att_idx = round(att_slider / 100.0, 2)
    event_flag = 1 if event_toggle else 0

    if engine.is_trained:
        fc = engine.predict_scenario(
            menu_item=selected_item,
            day_of_week=selected_day,
            attendance_index=att_idx,
            campus_event=event_flag,
            weather=weather_val,
        )
        pred_d = fc.predicted_demand
        low_d = fc.lower_bound
        up_d = fc.upper_bound
    else:
        pred_d = float(cfg.base_demand * att_idx * (1.30 if event_flag else 1.0))
        low_d = float(pred_d * 0.88)
        up_d = float(pred_d * 1.12)

    planner = PreparationPlanner()
    plan = planner.generate_plan(
        menu_item=selected_item,
        predicted_demand=pred_d,
        lower_bound=low_d,
        upper_bound=up_d,
        current_stock=int(current_inventory),
        custom_cost_surplus=cost_surplus,
        custom_cost_shortage=cost_shortage,
        service_level_preference=service_level_pref,
        traditional_baseline_prep=int(traditional_prep_policy),
    )

    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)

    # Recommendation Metric Cards
    st.markdown(
        f"""
        <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
            Preparation recommendation: {selected_item}
        </div>
        """,
        unsafe_allow_html=True,
    )

    out1, out2, out3, out4 = st.columns(4)
    with out1:
        render_kpi(
            label="Forecast demand",
            value=f"{pred_d:.0f}",
            unit="portions",
            meta=f"80% range: {low_d:.0f} – {up_d:.0f}",
            pill_text="DEMAND",
            pill_variant="mint",
        )
    with out2:
        render_kpi(
            label="Total day plan",
            value=f"{plan.recommended_total_plan}",
            unit="portions",
            meta=f"Buffer: {plan.recommended_buffer:+d} (CR {plan.critical_ratio:.2f})",
            pill_text="TARGET",
            pill_variant="neutral",
        )
    with out3:
        render_kpi(
            label="Initial batch (7:00 AM)",
            value=f"{plan.recommended_initial_batch}",
            unit="portions",
            meta="Start with 65%; hold remainder",
            pill_text="STAGE 1",
            pill_variant="neutral",
        )
    with out4:
        render_kpi(
            label="Refill trigger",
            value=f"{plan.refill_trigger_threshold}",
            unit="portions",
            meta="Prep Batch 2 if stock hits threshold",
            pill_text="TRIGGER",
            pill_variant="amber" if plan.refill_trigger_threshold > 10 else "neutral",
        )

    # Operational Rationale Notice
    render_callout(
        title="Planning Rationale",
        text=f"{plan.recommendation_reason} Classified as {plan.risk_classification} risk exposure.",
        variant="info" if plan.risk_classification == "Low" else ("warning" if plan.risk_classification == "Moderate" else "danger"),
    )

    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)

    # Side-by-Side Comparison: Traditional Habit vs WasteWise AI
    st.markdown(
        """
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.88rem; font-weight: 600; color: #17212B;">Policy simulation: Traditional habit vs WasteWise adaptive plan</span>
            <span style="font-size: 0.72rem; color: #64748B;">1,000 Monte Carlo distribution draws</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    comp_left, comp_right = st.columns([1.5, 1.5])

    with comp_left:
        comp_df = pd.DataFrame({
            "Policy metric": [
                "Planned preparation",
                "Expected surplus food (waste)",
                "Expected shortages (stockouts)",
                "Expected financial penalty",
                "Net food saved from discard",
                "Net cost avoided",
            ],
            "Traditional habit": [
                f"{plan.current_policy_prep} portions",
                f"{plan.current_policy_expected_surplus:.1f} portions",
                f"{plan.current_policy_expected_shortage:.1f} portions",
                f"₹{plan.current_policy_expected_cost:,.0f}",
                "—",
                "—",
            ],
            "WasteWise plan": [
                f"{plan.recommended_total_plan} portions",
                f"{plan.wastewise_expected_surplus:.1f} portions",
                f"{plan.wastewise_expected_shortage:.1f} portions",
                f"₹{plan.wastewise_expected_cost:,.0f}",
                f"{plan.surplus_portions_avoided:.1f} portions",
                f"₹{plan.net_cost_avoided:,.0f}",
            ],
        })
        st.dataframe(comp_df, hide_index=True, use_container_width=True)

    with comp_right:
        categories = ["Surplus cost", "Shortage penalty", "Total expected penalty"]
        trad_vals = [
            round(plan.current_policy_expected_surplus * cost_surplus, 0),
            round(plan.current_policy_expected_shortage * cost_shortage, 0),
            round(plan.current_policy_expected_cost, 0),
        ]
        ww_vals = [
            round(plan.wastewise_expected_surplus * cost_surplus, 0),
            round(plan.wastewise_expected_shortage * cost_shortage, 0),
            round(plan.wastewise_expected_cost, 0),
        ]

        fig_comp = go.Figure()
        fig_comp.add_trace(
            go.Bar(
                name="Traditional habit",
                x=categories,
                y=trad_vals,
                marker_color="#A5B3AB",
                hovertemplate="%{x}<br>Traditional: ₹%{y:,.0f}<extra></extra>",
            )
        )
        fig_comp.add_trace(
            go.Bar(
                name="WasteWise plan",
                x=categories,
                y=ww_vals,
                marker_color="#246B53",
                hovertemplate="%{x}<br>WasteWise: ₹%{y:,.0f}<extra></extra>",
            )
        )
        fig_comp.update_layout(
            height=280,
            barmode="group",
            yaxis_title="Expected cost (₹)",
        )
        st.plotly_chart(format_plotly_chart(fig_comp, height=280), use_container_width=True)
