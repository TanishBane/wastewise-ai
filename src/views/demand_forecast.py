"""
WasteWise AI - View 2: Demand Forecast
Dedicated scenario control panel, point forecasts with 80% uncertainty bounds,
historical demand trajectory, and explainable feature driver contributions.
"""

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.config import MENU_ITEMS, MENU_ITEM_NAMES, WEATHER_TYPES
from src.ui_theme import (
    format_plotly_chart,
    render_callout,
    render_context_banner,
    render_kpi,
    render_page_header,
)


def render_demand_forecast_view(engine, dataset_df, is_synthetic: bool = True):
    render_page_header(
        title="Demand forecast",
        subtitle="Item-level demand inference based on footfall, calendar and weather drivers.",
        meta_label="STAGE 1: PREDICT",
    )

    provenance_text = (
        "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"
        if is_synthetic
        else "OPERATOR ENVIRONMENT · Custom historical CSV active"
    )
    render_context_banner(provenance_text)

    # Dedicated Control Panel
    with st.container():
        st.markdown(
            """
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748B; margin-bottom: 0.5rem;">
                Forecast Parameters
            </div>
            """,
            unsafe_allow_html=True,
        )

        c1, c2, c3, c4, c5 = st.columns([1.5, 1.2, 1.2, 1.2, 1.2])

        with c1:
            selected_item = st.selectbox(
                "Menu item",
                options=MENU_ITEM_NAMES,
                index=0,
                key="fc_item_select",
            )
        with c2:
            selected_day = st.selectbox(
                "Service day",
                options=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                index=0,
                key="fc_day_select",
            )
        with c3:
            attendance_pct = st.slider(
                "Attendance footfall (%)",
                min_value=50,
                max_value=150,
                value=100,
                step=5,
                key="fc_att_slider",
            )
        with c4:
            weather_opt = st.selectbox(
                "Weather condition",
                options=WEATHER_TYPES,
                index=0,
                key="fc_weather_select",
            )
        with c5:
            st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)
            campus_event = st.checkbox(
                "Campus event / fest",
                value=False,
                key="fc_event_check",
            )

    attendance_index = round(attendance_pct / 100.0, 2)
    event_val = 1 if campus_event else 0

    # Execute Forecast
    if engine.is_trained:
        forecast_res = engine.predict_scenario(
            menu_item=selected_item,
            day_of_week=selected_day,
            attendance_index=attendance_index,
            campus_event=event_val,
            weather=weather_opt,
        )
        pt_pred = forecast_res.predicted_demand
        lower_b = forecast_res.lower_bound
        upper_b = forecast_res.upper_bound
        drivers = forecast_res.feature_contributions
    else:
        cfg = MENU_ITEMS[selected_item]
        pt_pred = float(cfg.base_demand)
        lower_b = float(pt_pred * 0.85)
        upper_b = float(pt_pred * 1.15)
        drivers = {"Attendance": 40.0, "Day of Week": 25.0, "Campus Event": 20.0, "Weather": 15.0}

    # Baseline comparison for identical parameters
    baseline_match = (
        dataset_df[
            (dataset_df["menu_item"] == selected_item) &
            (dataset_df["day_of_week"] == selected_day)
        ]["portions_sold"].mean()
        if not dataset_df.empty
        else MENU_ITEMS[selected_item].base_demand
    )
    baseline_val = round(float(baseline_match), 1)

    st.markdown("<div style='height: 0.75rem;'></div>", unsafe_allow_html=True)

    # 4 Output Metric Cards
    f1, f2, f3, f4 = st.columns(4)

    with f1:
        render_kpi(
            label="Point forecast",
            value=f"{pt_pred:.0f}",
            unit="portions",
            meta="Expected customer demand",
            pill_text="RANDOM FOREST",
            pill_variant="mint",
        )

    with f2:
        render_kpi(
            label="80% uncertainty range",
            value=f"{lower_b:.0f} – {upper_b:.0f}",
            unit="portions",
            meta="Ensemble 10th – 90th percentile",
            pill_text="INTERVAL",
            pill_variant="neutral",
        )

    with f3:
        diff_base = pt_pred - baseline_val
        sign = "+" if diff_base >= 0 else ""
        render_kpi(
            label="Weekday baseline",
            value=f"{baseline_val:.0f}",
            unit="portions",
            meta=f"ML difference: {sign}{diff_base:.0f} portions",
            pill_text="REFERENCE",
            pill_variant="neutral",
        )

    with f4:
        item_cfg = MENU_ITEMS[selected_item]
        est_rev = pt_pred * item_cfg.selling_price
        render_kpi(
            label="Estimated gross value",
            value=f"₹{est_rev:,.0f}",
            unit="",
            meta=f"₹{item_cfg.selling_price:.0f} retail / portion",
            pill_text="REVENUE",
            pill_variant="neutral",
        )

    st.markdown("<div style='height: 1.25rem;'></div>", unsafe_allow_html=True)

    # Analytics Two-Column
    c_left, c_right = st.columns([1.6, 1.4])

    with c_left:
        st.markdown(
            f"""
            <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
                Demand trajectory: {selected_item}
            </div>
            """,
            unsafe_allow_html=True,
        )

        item_history = (
            dataset_df[dataset_df["menu_item"] == selected_item]
            .sort_values("date")
            .tail(40)
            .copy()
        )
        split_dt = engine.train_split_date or "2026-08-01"

        fig_hist = go.Figure()
        train_slice = item_history[item_history["date"] < split_dt]
        test_slice = item_history[item_history["date"] >= split_dt]

        if not train_slice.empty:
            fig_hist.add_trace(
                go.Scatter(
                    x=train_slice["date"],
                    y=train_slice["portions_sold"],
                    mode="lines",
                    name="Training observed",
                    line=dict(color="#A5B3AB", width=1.5),
                    hovertemplate="%{x}<br>Train sales: %{y}<extra></extra>",
                )
            )

        if not test_slice.empty:
            fig_hist.add_trace(
                go.Scatter(
                    x=test_slice["date"],
                    y=test_slice["portions_sold"],
                    mode="lines+markers",
                    name="Holdout observed",
                    line=dict(color="#246B53", width=2),
                    marker=dict(size=4, color="#246B53"),
                    hovertemplate="%{x}<br>Holdout sales: %{y}<extra></extra>",
                )
            )

        # Plot Today's Forecast Point
        fig_hist.add_trace(
            go.Scatter(
                x=[item_history["date"].max()],
                y=[pt_pred],
                mode="markers+text",
                name="Current scenario",
                text=[f"Today: {pt_pred:.0f}"],
                textposition="top left",
                marker=dict(size=8, color="#17212B", symbol="circle"),
                error_y=dict(
                    type="data",
                    symmetric=False,
                    array=[upper_b - pt_pred],
                    arrayminus=[pt_pred - lower_b],
                    color="#17212B",
                    thickness=1.5,
                ),
            )
        )

        fig_hist.update_layout(
            height=300,
            xaxis_title="Date",
            yaxis_title="Portions sold",
            xaxis_tickangle=-25,
        )
        st.plotly_chart(format_plotly_chart(fig_hist, height=300), use_container_width=True)

    with c_right:
        st.markdown(
            """
            <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
                Model feature attribution
            </div>
            """,
            unsafe_allow_html=True,
        )

        driver_keys = list(drivers.keys())
        driver_vals = [drivers[k] for k in driver_keys]

        fig_bar = go.Figure()
        fig_bar.add_trace(
            go.Bar(
                y=driver_keys[::-1],
                x=driver_vals[::-1],
                orientation="h",
                marker=dict(color="#246B53"),
                hovertemplate="<b>%{y}</b><br>Importance: %{x:.1f}%<extra></extra>",
            )
        )
        fig_bar.update_layout(
            height=300,
            xaxis_title="Feature importance (%)",
            showlegend=False,
        )
        st.plotly_chart(format_plotly_chart(fig_bar, height=300, show_legend=False), use_container_width=True)

    # Technical Specifications Callout
    render_callout(
        title="Forecasting Methodology & Uncertainty Protocol",
        text=(
            "Predictions are generated by a scikit-learn RandomForestRegressor (100 estimators) trained on chronological canteen history. "
            "Uncertainty intervals reflect empirical 10th and 90th percentile tree estimates across the ensemble. "
            "Predictions are operational decision inputs, not guarantees of customer turnout."
        ),
        variant="info",
    )
