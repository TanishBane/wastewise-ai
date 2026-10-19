"""
WasteWise AI - View 6: Data & Model Hub
Dataset provenance, local CSV ingestion with schema validation,
model specifications, and operational transparency.
"""

import pandas as pd
import streamlit as st

from src.config import (
    CANTEEN_NAME,
    DISCLAIMER_TEXT,
    MENU_ITEMS,
    REQUIRED_COLUMNS,
)
from src.data import (
    generate_sample_csv_template,
    get_demonstration_data,
    validate_dataset,
)
from src.ui_theme import (
    render_callout,
    render_context_banner,
    render_kpi,
    render_page_header,
)


def render_data_and_model_view(engine, dataset_df, is_synthetic: bool = True):
    render_page_header(
        title="Data & model",
        subtitle="Dataset provenance, schema validation, CSV ingestion and model specifications.",
        meta_label="INFRASTRUCTURE",
    )

    provenance_text = (
        "DEMONSTRATION ENVIRONMENT · Synthetic data · 180 days"
        if is_synthetic
        else "OPERATOR ENVIRONMENT · Custom historical CSV active"
    )
    render_context_banner(provenance_text)

    tabs = st.tabs(["CSV ingestion & validation", "Active dataset explorer", "Model specifications & transparency"])

    # TAB 1: CSV INGESTION & VALIDATION
    with tabs[0]:
        st.markdown(
            """
            <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.35rem;">
                Import canteen sales history (CSV)
            </div>
            <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 0.85rem;">
                All validation runs locally in the Python runtime. Zero customer or transaction data is sent to external services.
            </p>
            """,
            unsafe_allow_html=True,
        )

        col_up, col_rules = st.columns([1.5, 1.2])

        with col_up:
            uploaded_file = st.file_uploader(
                "Upload historical canteen CSV",
                type=["csv"],
                help="CSV must match required column headers.",
                label_visibility="collapsed",
            )

            sample_csv_text = generate_sample_csv_template()
            st.download_button(
                label="Download sample CSV template",
                data=sample_csv_text,
                file_name="wastewise_canteen_sample_template.csv",
                mime="text/csv",
                help="7-day validated demonstration CSV structure.",
            )

        with col_rules:
            st.markdown(
                """
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.85rem; font-size: 0.78rem; color: #64748B; line-height: 1.45;">
                    <div style="font-weight: 600; color: #17212B; margin-bottom: 0.35rem;">Required schema columns:</div>
                    <code style="font-size: 0.72rem; color: #17212B;">date</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">menu_item</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">portions_sold</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">day_of_week</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">attendance_index</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">campus_event</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">weather</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">cost_per_portion</code>, 
                    <code style="font-size: 0.72rem; color: #17212B;">selling_price</code>
                    <div style="margin-top: 0.4rem; color: #64748B;">
                        Minimum 14 historical dates required for chronological model training.
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Handle File Upload
        if uploaded_file is not None:
            try:
                raw_df = pd.read_csv(uploaded_file)
                is_valid, issues, cleaned_df = validate_dataset(raw_df)

                if is_valid:
                    st.success(f"Validation successful: Loaded {len(cleaned_df):,} records across {cleaned_df['date'].nunique()} service dates.")
                    st.dataframe(cleaned_df.head(4), hide_index=True, use_container_width=True)

                    if st.button("Train model on uploaded data", type="primary"):
                        with st.spinner("Training Random Forest Regressor..."):
                            st.session_state["active_dataset"] = cleaned_df
                            st.session_state["is_synthetic"] = False
                            train_res = engine.train_and_evaluate(cleaned_df, holdout_days=max(5, int(cleaned_df["date"].nunique() * 0.2)))
                            st.session_state["forecasting_engine"] = engine
                            st.success(f"Model trained! New holdout WAPE: {train_res['ml_metrics'].wape:.1f}%.")
                            st.rerun()
                else:
                    st.error("Data validation rejected the file:")
                    for issue in issues:
                        st.markdown(f"- {issue}")
            except Exception as e:
                st.error(f"Error reading CSV: {str(e)}")

        st.markdown("<hr style='margin: 1.25rem 0; border: none; border-top: 1px solid #E2E8F0;'>", unsafe_allow_html=True)

        if st.button("Restore default demonstration dataset (180 days)"):
            demo_df = get_demonstration_data()
            st.session_state["active_dataset"] = demo_df
            st.session_state["is_synthetic"] = True
            with st.spinner("Retraining on default dataset..."):
                engine.train_and_evaluate(demo_df, holdout_days=35)
                st.session_state["forecasting_engine"] = engine
            st.success("Default demonstration dataset restored.")
            st.rerun()

    # TAB 2: ACTIVE DATASET EXPLORER
    with tabs[1]:
        st.markdown(
            """
            <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
                Active dataset summary
            </div>
            """,
            unsafe_allow_html=True,
        )

        d1, d2, d3, d4 = st.columns(4)
        with d1:
            render_kpi("Total observations", f"{len(dataset_df):,}", "records", "Daily dish rows", pill_variant="neutral")
        with d2:
            render_kpi("Unique dates", f"{dataset_df['date'].nunique()}", "days", f"{dataset_df['date'].min()} to {dataset_df['date'].max()}", pill_variant="neutral")
        with d3:
            render_kpi("Tracked menu items", f"{dataset_df['menu_item'].nunique()}", "items", "Active canteen dishes", pill_variant="neutral")
        with d4:
            avg_daily = dataset_df.groupby("date")["portions_sold"].sum().mean()
            render_kpi("Average daily volume", f"{avg_daily:.0f}", "portions", "Total canteen demand", pill_variant="neutral")

        st.markdown("<div style='height: 0.75rem;'></div>", unsafe_allow_html=True)

        # Filters
        f1, f2 = st.columns(2)
        with f1:
            f_dish = st.selectbox("Filter dish", options=["All items"] + sorted(list(dataset_df["menu_item"].unique())), key="ds_filter_dish")
        with f2:
            f_weather = st.selectbox("Filter weather", options=["All conditions"] + sorted(list(dataset_df["weather"].unique())), key="ds_filter_weather")

        filtered_df = dataset_df.copy()
        if f_dish != "All items":
            filtered_df = filtered_df[filtered_df["menu_item"] == f_dish]
        if f_weather != "All conditions":
            filtered_df = filtered_df[filtered_df["weather"] == f_weather]

        st.dataframe(
            filtered_df.sort_values("date", ascending=False).head(100),
            hide_index=True,
            use_container_width=True,
        )

    # TAB 3: MODEL SPECIFICATIONS & TRANSPARENCY
    with tabs[2]:
        st.markdown(
            """
            <div style="font-size: 0.88rem; font-weight: 600; color: #17212B; margin-bottom: 0.5rem;">
                Model architecture & decision formulation
            </div>
            """,
            unsafe_allow_html=True,
        )

        spec_table = pd.DataFrame({
            "Component": [
                "Candidate model",
                "Baseline reference",
                "Evaluation split",
                "Feature set",
                "Uncertainty method",
                "Decision algorithm",
                "Data storage",
            ],
            "Specification": [
                "Scikit-learn RandomForestRegressor (100 estimators, max depth 12, min leaf 2)",
                "WeekdayAverageBaseline (Historical mean grouped by dish and weekday)",
                "Strict chronological holdout (First ~80% train dates, Last ~20% test dates; zero leakage)",
                "Attendance index, campus event flag, weather category, temperature, day of week, menu item",
                "Empirical 10th and 90th percentile quantile distribution across decision tree ensemble",
                "Newsvendor Critical Fractile (CR = C_shortage / (C_shortage + C_surplus)) + staggered batching",
                "Local in-memory DataFrame / local CSV files. Zero cloud API calls or telemetry",
            ],
        })
        st.dataframe(spec_table, hide_index=True, use_container_width=True)

        render_callout(
            title="Operational System Boundary",
            text=DISCLAIMER_TEXT,
            variant="info",
        )
