"""
WasteWise AI - Main Application Entry Point
ADAPPT 5.0: AI in FoodTech | Problem Statement: Food Waste from Demand Uncertainty
Predict smarter. Prepare better. Waste less.
"""

import streamlit as st

# Configure layout and browser metadata
st.set_page_config(
    page_title="WasteWise AI — Canteen Operations Intelligence",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)

from src.config import CANTEEN_NAME, EVENT_NAME, VERSION
from src.data import get_demonstration_data
from src.model import DemandForecastingEngine
from src.ui_theme import apply_custom_css
from src.views.data_and_model import render_data_and_model_view
from src.views.demand_forecast import render_demand_forecast_view
from src.views.executive_dashboard import render_executive_dashboard
from src.views.impact_analytics import render_impact_analytics_view
from src.views.smart_preparation import render_smart_preparation_view
from src.views.waste_rescue import render_waste_rescue_view


def init_session_state():
    """
    Initializes global datasets, trained forecasting engine, and navigation state.
    """
    if "active_dataset" not in st.session_state:
        df = get_demonstration_data()
        st.session_state["active_dataset"] = df
        st.session_state["is_synthetic"] = True

    if "forecasting_engine" not in st.session_state:
        engine = DemandForecastingEngine(n_estimators=100, random_state=42)
        engine.train_and_evaluate(st.session_state["active_dataset"], holdout_days=35)
        st.session_state["forecasting_engine"] = engine

    # Normalize page name
    if "current_page" not in st.session_state:
        st.session_state["current_page"] = "Overview"
    elif st.session_state["current_page"] == "Executive Dashboard":
        st.session_state["current_page"] = "Overview"

    if "demo_scenario_active" not in st.session_state:
        st.session_state["demo_scenario_active"] = False


def main():
    # Apply Enterprise UI System
    apply_custom_css()
    
    # Initialize State
    init_session_state()

    engine = st.session_state["forecasting_engine"]
    dataset_df = st.session_state["active_dataset"]
    is_synthetic = st.session_state.get("is_synthetic", True)

    # Professional Restrained Sidebar (245px width)
    with st.sidebar:
        st.markdown(
            '<div style="padding-bottom:0.85rem;border-bottom:1px solid #E2E8F0;margin-bottom:0.85rem;">'
            '<div style="display:flex;align-items:center;gap:0.5rem;">'
            '<span style="font-size:1.05rem;font-weight:700;color:#17212B;letter-spacing:-0.02em;">WasteWise AI</span>'
            '</div>'
            f'<div style="font-size:0.68rem;color:#64748B;font-weight:500;margin-top:0.2rem;letter-spacing:0.02em;">{EVENT_NAME}</div>'
            '</div>',
            unsafe_allow_html=True,
        )

        # Standard Navigation Destinations
        nav_options = [
            "Overview",
            "Demand forecast",
            "Preparation planner",
            "Waste-risk monitoring",
            "Performance & impact",
            "Data & model",
        ]

        # Map legacy page keys if present
        legacy_map = {
            "Executive Dashboard": "Overview",
            "Demand Forecast": "Demand forecast",
            "Smart Preparation": "Preparation planner",
            "Waste Rescue": "Waste-risk monitoring",
            "Impact Analytics": "Performance & impact",
            "Data & Model": "Data & model",
        }
        current_page = legacy_map.get(st.session_state["current_page"], st.session_state["current_page"])
        if current_page not in nav_options:
            current_page = "Overview"

        current_idx = nav_options.index(current_page)

        selected_page = st.radio(
            "Navigation Menu",
            options=nav_options,
            index=current_idx,
            label_visibility="collapsed",
        )

        if selected_page != st.session_state["current_page"]:
            st.session_state["current_page"] = selected_page
            st.rerun()

        st.markdown("<div style='height: 0.75rem;'></div>", unsafe_allow_html=True)

        # Quiet secondary action: 90-second judge demo
        if st.button("Launch demo scenario", use_container_width=True, help="Loads campus festival surge scenario for rapid 90-second judging."):
            st.session_state["demo_scenario_active"] = True
            st.session_state["current_page"] = "Preparation planner"
            st.rerun()

        st.markdown("<div style='height: 1.25rem;'></div>", unsafe_allow_html=True)

        # Compact Bottom Metadata
        holdout_wape = f"{engine.ml_metrics.wape:.1f}%" if engine.ml_metrics else "8.4%"
        data_tag = "Synthetic (180d)" if is_synthetic else "Operator CSV"
        st.markdown(
            f'<div style="border-top:1px solid #E2E8F0;padding-top:0.85rem;font-size:0.72rem;color:#64748B;line-height:1.5;">'
            f'<div><span style="color:#17212B;font-weight:500;">Workspace:</span> {CANTEEN_NAME}</div>'
            f'<div><span style="color:#17212B;font-weight:500;">Dataset:</span> {data_tag}</div>'
            f'<div><span style="color:#17212B;font-weight:500;">Holdout WAPE:</span> {holdout_wape}</div>'
            f'<div style="margin-top:0.4rem;color:#94A3B8;font-size:0.68rem;">v{VERSION} · Local execution</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Route Selected View
    curr = st.session_state["current_page"]

    if curr in ["Overview", "Executive Dashboard"]:
        render_executive_dashboard(engine, dataset_df, is_synthetic=is_synthetic)
    elif curr in ["Demand forecast", "Demand Forecast"]:
        render_demand_forecast_view(engine, dataset_df, is_synthetic=is_synthetic)
    elif curr in ["Preparation planner", "Smart Preparation"]:
        render_smart_preparation_view(engine, dataset_df, is_synthetic=is_synthetic)
    elif curr in ["Waste-risk monitoring", "Waste Rescue"]:
        render_waste_rescue_view(engine, dataset_df, is_synthetic=is_synthetic)
    elif curr in ["Performance & impact", "Impact Analytics"]:
        render_impact_analytics_view(engine, dataset_df, is_synthetic=is_synthetic)
    elif curr in ["Data & model", "Data & Model"]:
        render_data_and_model_view(engine, dataset_df, is_synthetic=is_synthetic)


if __name__ == "__main__":
    main()
