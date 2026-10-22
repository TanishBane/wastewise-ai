"""
WasteWise AI - Forecasting Service
Executes scenario predictions using Random Forest ensemble quantile bounds,
computes explainability feature contributions, and persists runs to SQLite.
"""

import json
from typing import Any, Dict, List, Optional
import pandas as pd
from fastapi import HTTPException
from backend.database import get_db_context
from backend.models import ForecastRunModel, MenuItemModel
from src.config import MENU_ITEMS


class ForecastingService:
    @staticmethod
    def predict_scenario(
        engine,
        dataset_df: pd.DataFrame,
        menu_item: str,
        day_of_week: str,
        attendance_index: float,
        campus_event: int,
        weather: str,
        target_service: str = "Lunch",
    ) -> Dict[str, Any]:
        """
        Runs the ML ensemble model for a specific operational scenario,
        saves the forecast run in SQLite, and returns structured predictions.
        """
        res = engine.predict_scenario(
            menu_item=menu_item,
            day_of_week=day_of_week,
            attendance_index=attendance_index,
            campus_event=campus_event,
            weather=weather,
        )

        item_cfg = MENU_ITEMS.get(menu_item)
        price = item_cfg.selling_price if item_cfg else 60.0
        gross_value = round(res.predicted_demand * price)

        # Historical trajectory (last 30 observed days)
        item_df = dataset_df[dataset_df["menu_item"] == menu_item].sort_values("date").tail(30)
        split_date = engine.train_split_date or "2026-08-23"

        trajectory: List[Dict[str, Any]] = []
        for _, row in item_df.iterrows():
            d_str = str(row["date"])
            is_holdout = d_str > split_date
            trajectory.append({
                "date": d_str,
                "actual_sold": int(row["portions_sold"]),
                "is_holdout": is_holdout,
            })

        # Model feature contributions extracted directly from fitted model
        features: List[Dict[str, Any]] = []
        if res.feature_contributions:
            for feat, val in sorted(res.feature_contributions.items(), key=lambda x: x[1], reverse=True):
                features.append({
                    "feature": feat,
                    "importance_pct": round(float(val), 1),
                })

        base_demand = float(
            engine.baseline.averages.get(
                (menu_item, day_of_week),
                engine.baseline.item_fallback.get(menu_item, 50.0),
            )
        )

        # Persist run to SQLite. A returned forecast must be auditable.
        try:
            with get_db_context() as db:
                run_record = ForecastRunModel(
                    menu_item=menu_item,
                    day_of_week=day_of_week,
                    attendance_index=attendance_index,
                    is_event=campus_event,
                    weather=weather,
                    target_service=target_service,
                    predicted_demand=round(res.predicted_demand, 1),
                    lower_bound=round(res.lower_bound, 1),
                    upper_bound=round(res.upper_bound, 1),
                    weekday_baseline=round(base_demand, 1),
                    model_version="1.0-rf",
                    feature_contributions_json=json.dumps(res.feature_contributions or {}),
                )
                db.add(run_record)
                db.commit()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail="The forecast was calculated but could not be recorded. Please retry.",
            ) from exc

        return {
            "menu_item": menu_item,
            "predicted_demand": round(res.predicted_demand),
            "lower_bound": round(res.lower_bound),
            "upper_bound": round(res.upper_bound),
            "weekday_baseline": round(base_demand),
            "baseline_diff": round(res.predicted_demand - base_demand),
            "gross_value": gross_value,
            "selling_price": price,
            "features": features,
            "trajectory": trajectory,
        }

    @staticmethod
    def get_forecast_history(limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves recent scenario forecast runs for audit and comparison."""
        with get_db_context() as db:
            runs = (
                db.query(ForecastRunModel)
                .order_by(ForecastRunModel.timestamp.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": r.id,
                    "timestamp": r.timestamp.isoformat(),
                    "menu_item": r.menu_item,
                    "day_of_week": r.day_of_week,
                    "attendance_index": r.attendance_index,
                    "is_event": r.is_event,
                    "weather": r.weather,
                    "predicted_demand": r.predicted_demand,
                    "lower_bound": r.lower_bound,
                    "upper_bound": r.upper_bound,
                    "model_version": r.model_version,
                }
                for r in runs
            ]
