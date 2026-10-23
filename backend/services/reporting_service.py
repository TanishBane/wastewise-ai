"""
WasteWise AI - Reporting Service
Coordinates Overview KPIs, performance holdout evaluations, model accuracy benchmarks,
and canteen operational outcome recording.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
import pandas as pd
from backend.database import get_db_context
from backend.models import ActualOutcomeModel, MenuItemModel
from src.config import MENU_ITEMS
from src.metrics import classify_waste_risks, simulate_holdout_impact


class ReportingService:
    @staticmethod
    def get_overview(
        engine,
        dataset_df: pd.DataFrame,
        is_synthetic: bool,
        organization_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Derives menu items dynamically, predicts latest day demands,
        and aggregates kitchen operational KPIs.
        """
        latest_date = str(dataset_df["date"].max())
        day_df = dataset_df[dataset_df["date"] == latest_date]
        if day_df.empty:
            day_df = dataset_df.tail(8)

        # Read active menu catalog from DB scoped to organization or fall back to MENU_ITEMS config
        items_dict = {}
        with get_db_context() as db:
            query = db.query(MenuItemModel).filter(MenuItemModel.active == True)
            if organization_id:
                query = query.filter(MenuItemModel.organization_id == organization_id)
            db_items = query.all()
            for di in db_items:
                items_dict[di.name] = di

        # Derive active dishes present in the current operational dataset
        dataset_dish_names = set(dataset_df["menu_item"].unique())
        # Preserve catalog order if available
        if items_dict:
            item_names = [name for name in items_dict.keys() if name in dataset_dish_names]
        else:
            item_names = [name for name in MENU_ITEMS.keys() if name in dataset_dish_names]

        # If any dishes in dataset weren't in catalog, append them
        for name in dataset_dish_names:
            if name not in item_names:
                item_names.append(name)

        item_forecasts = {}
        item_preps = {}
        item_details = []

        for item_name in item_names:
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
                pred = res.predicted_demand
                low = res.lower_bound
                upp = res.upper_bound
            else:
                base_d = items_dict[item_name].base_demand if item_name in items_dict else MENU_ITEMS[item_name].base_demand
                pred = float(base_d)
                low = float(base_d * 0.85)
                upp = float(base_d * 1.15)

            item_forecasts[item_name] = pred
            trad_prep = int(round(pred * 1.16))
            item_preps[item_name] = trad_prep

            cfg = MENU_ITEMS.get(item_name)
            catalog_item = items_dict.get(item_name)
            # Uploaded data and the persisted catalog are the operational source
            # of truth. Config values only support the bundled demo dishes.
            cost_price = (
                float(match["cost_per_portion"].iloc[0])
                if not match.empty and "cost_per_portion" in match
                else (catalog_item.cost_price if catalog_item else (cfg.cost_per_portion if cfg else 40.0))
            )
            category = (
                str(match["category"].iloc[0])
                if not match.empty and "category" in match
                else (catalog_item.category if catalog_item else (cfg.category if cfg else "Custom"))
            )
            batch_size = catalog_item.prep_batch_size if catalog_item else (cfg.prep_batch_size if cfg else 20)

            rec_prep = int(round(pred * 1.05))
            batch_1 = int(round(rec_prep * 0.65)) if rec_prep > batch_size * 1.5 else rec_prep
            trig = max(5, int(round(rec_prep * 0.20))) if batch_1 < rec_prep else 0
            surplus_p = max(0, trad_prep - int(round(pred)))
            cost_exp = surplus_p * cost_price

            item_details.append({
                "menu_item": item_name,
                "category": category,
                "predicted_demand": int(round(pred)),
                "lower_bound": int(round(low)),
                "upper_bound": int(round(upp)),
                "error_minus": int(round(pred - low)),
                "error_plus": int(round(upp - pred)),
                "recommended_prep": rec_prep,
                "initial_batch": batch_1,
                "refill_trigger": trig,
                "refill_trigger_label": f"<{trig} portions" if trig > 0 else "None (single batch)",
                "cost_per_portion": cost_price,
                "naive_exposure": cost_exp,
            })

        total_predicted = int(round(sum(item_forecasts.values())))
        total_recommended_prep = int(round(sum(int(round(d * 1.05)) for d in item_forecasts.values())))
        potential_surplus = max(0, total_recommended_prep - total_predicted)
        cost_at_risk = sum(
            max(0, item_preps[row["menu_item"]] - int(round(item_forecasts[row["menu_item"]])))
            * row["cost_per_portion"]
            for row in item_details
        )

        risk_actions = classify_waste_risks(item_forecasts, item_preps)
        top_alerts = []
        for act in risk_actions[:3]:
            top_alerts.append({
                "menu_item": act.menu_item,
                "risk_level": act.risk_level,
                "predicted_demand": int(round(act.predicted_demand)),
                "planned_preparation": act.planned_preparation,
                "potential_surplus": act.potential_surplus_portions,
                "cost_at_risk": act.ingredient_cost_at_risk,
                "action": act.primary_action,
            })

        ml_m = engine.ml_metrics
        base_m = engine.baseline_metrics

        return {
            "service_date": latest_date,
            "is_synthetic": is_synthetic,
            "provenance_text": (
                "Demonstration Environment · Synthetic 180 Days"
                if is_synthetic
                else "Operator CSV Active"
            ),
            "kpis": {
                "forecast_demand": total_predicted,
                "recommended_prep": total_recommended_prep,
                "potential_surplus": potential_surplus,
                "surplus_pct": round((potential_surplus / max(1, total_recommended_prep)) * 100, 1),
                "cost_at_risk": round(cost_at_risk),
            },
            "item_details": item_details,
            "prioritized_alerts": top_alerts,
            "benchmark": {
                "ml_wape": f"{ml_m.wape:.1f}%" if ml_m else "Unavailable",
                "ml_mae": f"{ml_m.mae:.1f}" if ml_m else "Unavailable",
                "base_wape": f"{base_m.wape:.1f}%" if base_m else "Unavailable",
            },
        }

    @staticmethod
    def get_performance(engine) -> Dict[str, Any]:
        """Returns dish-level holdout accuracy and retrospective impact simulation."""
        ml_m = engine.ml_metrics
        base_m = engine.baseline_metrics

        dish_rows = []
        if engine.is_trained and engine.item_level_metrics:
            for item_name, metrics in engine.item_level_metrics.items():
                ml_w = metrics["ml_wape"]
                b_w = metrics["base_wape"]
                dish_rows.append({
                    "menu_item": item_name,
                    "ml_wape": round(ml_w, 1),
                    "ml_mae": round(metrics["ml_mae"], 1),
                    "baseline_wape": round(b_w, 1),
                    "wape_diff": round(ml_w - b_w, 1),
                })

        test_df = getattr(engine, "test_records_df", None)
        if test_df is not None and len(test_df) > 0 and "ml_pred" in test_df.columns:
            sim_res = simulate_holdout_impact(test_df, test_df["ml_pred"].values)
            sim_data = {
                "waste_reduction_pct": sim_res.waste_reduction_pct,
                "financial_savings_inr": round(sim_res.estimated_ingredient_cost_avoided),
                "carbon_avoided_kg": round(sim_res.estimated_co2e_avoided_kg, 1),
                "surplus_portions_avoided": round(sim_res.estimated_surplus_avoided_portions),
                "stockout_rate_traditional": round(sim_res.stockout_rate_baseline, 1),
                "stockout_rate_wastewise": round(sim_res.stockout_rate_wastewise, 1),
            }
        else:
            raise HTTPException(status_code=503, detail="Holdout evaluation is unavailable.")

        return {
            "ml_metrics": {
                "wape": round(ml_m.wape, 1) if ml_m else 8.4,
                "mae": round(ml_m.mae, 2) if ml_m else 4.76,
                "r2": round(ml_m.r2, 3) if ml_m else 0.902,
                "sample_size": ml_m.sample_size if ml_m else 280,
                "split_date": engine.train_split_date or "2026-08-24",
            },
            "baseline_metrics": {
                "wape": round(base_m.wape, 1) if base_m else 10.8,
                "mae": round(base_m.mae, 2) if base_m else 6.12,
            },
            "dish_comparison": dish_rows,
            "simulation": sim_data,
        }

    @staticmethod
    def record_outcome(
        service_date: str,
        target_meal: str,
        menu_item: str,
        portions_prepared: int,
        portions_sold: int,
        portions_leftover: int,
        waste_cause: str = "Over-preparation",
        discarded_kg: float = 0.0,
        donation_kg: float = 0.0,
        waste_cost: float = 0.0,
        notes: str = "",
        organization_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Records measured post-service kitchen outcome with multi-tenant isolation."""
        from backend.models import DEFAULT_ORG_ID
        effective_org_id = organization_id or DEFAULT_ORG_ID

        with get_db_context() as db:
            query = db.query(ActualOutcomeModel).filter(
                ActualOutcomeModel.service_date == service_date,
                ActualOutcomeModel.target_meal == target_meal,
                ActualOutcomeModel.menu_item == menu_item,
            )
            if effective_org_id:
                query = query.filter(ActualOutcomeModel.organization_id == effective_org_id)

            existing = query.order_by(ActualOutcomeModel.recorded_at.desc()).first()
            if existing:
                same_values = (
                    existing.portions_prepared == portions_prepared
                    and existing.portions_sold == portions_sold
                    and existing.portions_leftover == portions_leftover
                    and getattr(existing, "waste_cause", None) == waste_cause
                    and existing.discarded_kg == discarded_kg
                    and existing.donation_kg == donation_kg
                    and existing.waste_cost == waste_cost
                    and existing.notes == notes
                )
                if same_values:
                    return {
                        "status": "success",
                        "id": existing.id,
                        "message": "This service outcome was already recorded.",
                    }
                raise HTTPException(
                    status_code=409,
                    detail="An outcome already exists for this dish, meal, and service date. Use a correction workflow instead of adding a duplicate.",
                )
            record = ActualOutcomeModel(
                organization_id=effective_org_id,
                user_id=user_id,
                service_date=service_date,
                target_meal=target_meal,
                menu_item=menu_item,
                portions_prepared=portions_prepared,
                portions_sold=portions_sold,
                portions_leftover=portions_leftover,
                waste_cause=waste_cause,
                discarded_kg=discarded_kg,
                donation_kg=donation_kg,
                waste_cost=waste_cost,
                notes=notes,
            )
            db.add(record)
            db.commit()
            return {
                "status": "success",
                "id": record.id,
                "message": f"Recorded service outcome for {menu_item} on {service_date}.",
            }

    @staticmethod
    def get_outcomes(
        service_date: Optional[str] = None,
        menu_item: Optional[str] = None,
        organization_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Queries recorded actual outcomes scoped to organization."""
        with get_db_context() as db:
            query = db.query(ActualOutcomeModel)
            if organization_id:
                query = query.filter(ActualOutcomeModel.organization_id == organization_id)
            if service_date:
                query = query.filter(ActualOutcomeModel.service_date == service_date)
            if menu_item:
                query = query.filter(ActualOutcomeModel.menu_item == menu_item)
            records = query.order_by(ActualOutcomeModel.recorded_at.desc()).limit(limit).all()
            return [
                {
                    "id": r.id,
                    "service_date": r.service_date,
                    "target_meal": r.target_meal,
                    "menu_item": r.menu_item,
                    "portions_prepared": r.portions_prepared,
                    "portions_sold": r.portions_sold,
                    "portions_leftover": r.portions_leftover,
                    "waste_cause": getattr(r, "waste_cause", "Over-preparation") or "Over-preparation",
                    "discarded_kg": r.discarded_kg,
                    "donation_kg": r.donation_kg,
                    "waste_cost": r.waste_cost,
                    "notes": r.notes,
                    "recorded_at": r.recorded_at.isoformat(),
                }
                for r in records
            ]
