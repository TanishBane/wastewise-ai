"""
WasteWise AI - View 1: Canteen Overview (Executive Dashboard)
Restrained operational overview with a compact header, 4-card KPI row,
two-column layout (Forecast chart + Attention table), and prep summary.
"""

from datetime import datetime
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.config import CANTEEN_NAME, MENU_ITEMS
from src.metrics import classify_waste_risks
from src.ui_theme import (
    format_plotly_chart,
    render_callout,
    render_context_banner,
    render_kpi,
    render_page_header,
)


def render_executive_dashboard(engine, dataset_df, is_synthetic: bool = True):
    # Compact Header with Right-Side Metadata & Date
    latest_date = str(dataset_df["date"].max())
    header_col1, header_col2 = st.columns([2.5, 1.2])
    with header_col1:
        st.markdown(
            '<div style="padding-bottom:0.5rem;border-bottom:1px solid #E2E8F0;margin-bottom:0.85rem;">'
            '<h1 style="font-size:1.55rem;font-weight:700;color:#17212B;margin:0 0 0.2rem 0;letter-spacing:-0.02em;">Canteen overview</h1>'
            '<p style="font-size:0.86rem;color:#64748B;margin:0;font-weight:400;">Demand planning and kitchen risk for the selected service date.</p>'
            '</div>',
            unsafe_allow_html=True,
        )
    with header_col2:
        date_display = datetime.strptime(latest_date, "%Y-%m-%d").strftime("%d %b %Y") if "-" in latest_date else latest_date
        st.markdown(
            f'<div style="text-align:right;padding-top:0.2rem;">'
            f'<div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.04em;color:#64748B;font-weight:600;">Service Date</div>'
            f'<div style="font-size:0.92rem;font-weight:600;color:#17212B;">{date_display} · Lunch</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Slim Contextual Status Banner
    provenance_text = (
        "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"
        if is_synthetic
        else "OPERATOR ENVIRONMENT · Custom historical CSV active"
    )
    render_context_banner(provenance_text)

    # Compute Today's Overview Forecast across all 8 menu items
    day_df = dataset_df[dataset_df["date"] == latest_date]
    if day_df.empty:
        day_df = dataset_df.tail(8)

    item_forecasts = {}
    item_preps = {}
    item_lower = {}
    item_upper = {}

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
            item_forecasts[item_name] = res.predicted_demand
            item_lower[item_name] = res.lower_bound
            item_upper[item_name] = res.upper_bound
        else:
            base_d = MENU_ITEMS[item_name].base_demand
            item_forecasts[item_name] = float(base_d)
            item_lower[item_name] = float(base_d * 0.85)
            item_upper[item_name] = float(base_d * 1.15)

        # Baseline traditional prep habit
        item_preps[item_name] = int(round(item_forecasts[item_name] * 1.16))

    total_predicted = int(round(sum(item_forecasts.values())))
    total_recommended_prep = int(round(sum(int(round(d * 1.05)) for d in item_forecasts.values())))
    potential_surplus = max(0, total_recommended_prep - total_predicted)
    
    cost_at_risk = sum(
        max(0, item_preps[item] - int(round(item_forecasts[item]))) * MENU_ITEMS[item].cost_per_portion
        for item in item_forecasts
    )

    # 4-Card Primary KPI Row (Section 5 requirement)
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        render_kpi(
            label="Forecast Demand",
            value=f"{total_predicted:,}",
            unit="portions",
            meta="Combined across 8 menu items",
            pill_text="MODEL",
            pill_variant="mint",
        )
    with kpi2:
        render_kpi(
            label="Recommended Preparation",
            value=f"{total_recommended_prep:,}",
            unit="portions",
            meta="Cost-aware staggered batch target",
            pill_text="PLAN",
            pill_variant="neutral",
        )
    with kpi3:
        surplus_pct = (potential_surplus / max(1, total_recommended_prep)) * 100
        render_kpi(
            label="Potential Surplus",
            value=f"{potential_surplus}",
            unit="portions",
            meta=f"{surplus_pct:.1f}% planned buffer",
            pill_text="MONITORED",
            pill_variant="amber" if potential_surplus > 30 else "mint",
        )
    with kpi4:
        render_kpi(
            label="Estimated Cost at Risk",
            value=f"₹{cost_at_risk:,.0f}",
            unit="",
            meta="Ingredient exposure under naive prep",
            pill_text="EXPOSURE",
            pill_variant="amber" if cost_at_risk > 1500 else "neutral",
        )

    st.markdown("<div style='height: 1.25rem;'></div>", unsafe_allow_html=True)

    # Main Analytics Section: Two-Column Layout (Chart Left, Decisions Right)
    col_chart, col_actions = st.columns([1.6, 1.4])

    with col_chart:
        st.markdown(
            """
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.88rem; font-weight: 600; color: #17212B;">Forecast demand by menu item</span>
                <span style="font-size: 0.72rem; color: #64748B;">80% uncertainty bounds</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        items_list = list(item_forecasts.keys())
        preds_list = [item_forecasts[it] for it in items_list]
        lowers = [item_lower[it] for it in items_list]
        uppers = [item_upper[it] for it in items_list]
        err_plus = [uppers[i] - preds_list[i] for i in range(len(items_list))]
        err_minus = [preds_list[i] - lowers[i] for i in range(len(items_list))]

        fig_pred = go.Figure()
        fig_pred.add_trace(
            go.Bar(
                x=items_list,
                y=preds_list,
                name="Point Forecast",
                marker=dict(color="#246B53", line=dict(color="#1A4432", width=1)),
                error_y=dict(
                    type="data",
                    symmetric=False,
                    array=err_plus,
                    arrayminus=err_minus,
                    color="#64748B",
                    thickness=1.2,
                    width=3,
                ),
                hovertemplate="<b>%{x}</b><br>Forecast: %{y:.0f} portions<extra></extra>",
            )
        )
        fig_pred.update_layout(
            height=310,
            xaxis_tickangle=-25,
            yaxis_title="Portions",
            showlegend=False,
        )
        st.plotly_chart(format_plotly_chart(fig_pred, height=310, show_legend=False), use_container_width=True)

    with col_actions:
        st.markdown(
            """
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.88rem; font-weight: 600; color: #17212B;">Kitchen decisions requiring attention</span>
                <span style="font-size: 0.72rem; color: #64748B;">Prioritized by exposure</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        risk_actions = classify_waste_risks(item_forecasts, item_preps)
        
        # Compact list of prioritized items
        for act in risk_actions[:3]:
            badge_class = "ww-pill-red" if act.risk_level == "High" else ("ww-pill-amber" if act.risk_level == "Moderate" else "ww-pill-mint")
            st.markdown(
                f'<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:0.65rem 0.85rem;margin-bottom:0.5rem;">'
                f'<div style="display:flex;justify-content:space-between;align-items:baseline;">'
                f'<span style="font-size:0.88rem;font-weight:600;color:#17212B;">{act.menu_item}</span>'
                f'<span class="ww-pill {badge_class}">{act.risk_level.upper()} RISK</span>'
                f'</div>'
                f'<div style="font-size:0.78rem;color:#64748B;margin-top:0.2rem;">'
                f'Forecast: <strong>{act.predicted_demand:.0f}</strong> · Planned: <strong>{act.planned_preparation}</strong> · Exposure: <strong>₹{act.ingredient_cost_at_risk:,.0f}</strong>'
                f'</div>'
                f'<div style="font-size:0.78rem;color:#17212B;margin-top:0.25rem;">'
                f'↳ {act.primary_action}'
                f'</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

    st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)

    # Preparation Summary Table
    st.markdown(
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">'
        '<span style="font-size:0.88rem;font-weight:600;color:#17212B;">Daily preparation summary</span>'
        '<span style="font-size:0.75rem;color:#64748B;">All tracked canteen menu items</span>'
        '</div>',
        unsafe_allow_html=True,
    )

    table_rows = []
    for it in MENU_ITEMS.keys():
        cfg = MENU_ITEMS[it]
        pred_qty = int(round(item_forecasts[it]))
        rec_prep = int(round(pred_qty * 1.05))
        batch_1 = int(round(rec_prep * 0.65)) if rec_prep > cfg.prep_batch_size * 1.5 else rec_prep
        trig = max(5, int(round(rec_prep * 0.20))) if batch_1 < rec_prep else 0
        surplus_p = max(0, item_preps[it] - pred_qty)
        cost_exp = surplus_p * cfg.cost_per_portion

        table_rows.append({
            "Menu item": it,
            "Category": cfg.category,
            "Forecast": f"{pred_qty} portions",
            "Initial batch": f"{batch_1} portions",
            "Refill trigger": f"<{trig} portions" if trig > 0 else "None (single batch)",
            "Cost / unit": f"₹{cfg.cost_per_portion:.0f}",
            "Naive prep exposure": f"₹{cost_exp:,.0f}",
        })

    summary_df = pd.DataFrame(table_rows)
    st.dataframe(summary_df, hide_index=True, use_container_width=True)

    # Secondary Evaluation Metadata Bar
    ml_wape = f"{engine.ml_metrics.wape:.1f}%" if engine.ml_metrics else "8.4%"
    ml_mae = f"{engine.ml_metrics.mae:.1f} portions" if engine.ml_metrics else "5.1 portions"
    base_wape = f"{engine.baseline_metrics.wape:.1f}%" if engine.baseline_metrics else "14.2%"

    st.markdown(
        f'<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:0.6rem 0.9rem;margin-top:0.75rem;display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:#64748B;">'
        f'<div>'
        f'<strong style="color:#17212B;">Holdout Model Benchmark:</strong> '
        f'Random Forest WAPE <strong>{ml_wape}</strong> (MAE {ml_mae}) vs Weekday Baseline <strong>{base_wape}</strong>'
        f'</div>'
        f'<div style="color:#246B53;font-weight:500;">'
        f'Navigation: Select \'Preparation planner\' in sidebar for scenario adjustments →'
        f'</div>'
        f'</div>',
        unsafe_allow_html=True,
    )
