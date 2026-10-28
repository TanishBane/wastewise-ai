"""
WasteWise AI - Waste Rescue & Triage Service
Prioritizes kitchen surplus risks, ingredient exposures, and actionable intervention steps.
"""

from typing import Any, Dict, List, Optional
import pandas as pd
from backend.database import get_db_context
from backend.models import MenuItemModel
from src.config import MENU_ITEMS
from src.metrics import classify_waste_risks


class WasteRescueService:
    @staticmethod
    def get_waste_risks(
        engine,
        dataset_df: pd.DataFrame,
        risk_tier: Optional[str] = None,
        organization_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculates dish-level risk tier, potential surplus portions, and operational guidance.
        """
        latest_date = str(dataset_df["date"].max())
        day_df = dataset_df[dataset_df["date"] == latest_date]
        if day_df.empty:
            day_df = dataset_df.tail(8)

        # Get menu items from DB scoped to organization or fallback to config
        items_catalog = {}
        with get_db_context() as db:
            query = db.query(MenuItemModel).filter(MenuItemModel.active == True)
            if organization_id:
                query = query.filter(MenuItemModel.organization_id == organization_id)
            db_items = query.all()
            for di in db_items:
                items_catalog[di.name] = di

        dataset_dish_names = set(dataset_df["menu_item"].unique())
        catalog_names = list(items_catalog.keys()) if items_catalog else list(MENU_ITEMS.keys())
        item_names = [name for name in catalog_names if name in dataset_dish_names]
        for name in dataset_dish_names:
            if name not in item_names:
                item_names.append(name)

        item_forecasts = {}
        item_preps = {}

        for item_name in item_names:
            match = day_df[day_df["menu_item"] == item_name]
            att_idx = float(match["attendance_index"].values[0]) if not match.empty else 1.0
            event_flag = int(match["campus_event"].values[0]) if not match.empty else 0
            weather_val = str(match["weather"].values[0]) if not match.empty else "Sunny / Mild"
            day_name = str(match["day_of_week"].values[0]) if not match.empty else "Monday"

            res = engine.predict_scenario(
                menu_item=item_name,
                day_of_week=day_name,
                attendance_index=att_idx,
                campus_event=event_flag,
                weather=weather_val,
            )
            item_forecasts[item_name] = res.predicted_demand
            item_preps[item_name] = int(round(res.predicted_demand * 1.18))

        actions = classify_waste_risks(item_forecasts, item_preps)

        items = []
        for act in actions:
            if risk_tier and risk_tier.lower() != "all" and act.risk_level.lower() != risk_tier.lower():
                continue

            cat_item = items_catalog.get(act.menu_item)
            cfg = MENU_ITEMS.get(act.menu_item)
            category = cat_item.category if cat_item else (cfg.category if cfg else "Main")
            shelf_life = cat_item.shelf_life_hours if cat_item else (cfg.shelf_life_hours if cfg else 4.0)

            items.append({
                "menu_item": act.menu_item,
                "category": category,
                "predicted_demand": int(round(act.predicted_demand)),
                "planned_preparation": act.planned_preparation,
                "potential_surplus": act.potential_surplus_portions,
                "ingredient_cost_at_risk": round(act.ingredient_cost_at_risk),
                "risk_level": act.risk_level,
                "primary_action": act.primary_action,
                "kitchen_guidance": act.operational_details,
                "shelf_life_hours": shelf_life,
            })

        high_risk_count = sum(1 for a in actions if a.risk_level == "High")
        mod_risk_count = sum(1 for a in actions if a.risk_level == "Moderate")
        total_surplus = sum(a.potential_surplus_portions for a in actions)
        total_cost = sum(a.ingredient_cost_at_risk for a in actions)

        return {
            "items": items,
            "summary": {
                "high_risk_count": high_risk_count,
                "mod_risk_count": mod_risk_count,
                "total_surplus_exposure": total_surplus,
                "total_ingredient_cost_at_risk": round(total_cost),
            },
        }
