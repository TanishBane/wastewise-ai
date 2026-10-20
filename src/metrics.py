"""
WasteWise AI - Impact, Risk Scoring, and Operational Rescue Analytics
Calculates surplus risk indices, generates safe operational rescue interventions,
and simulates pilot impact while rigorously maintaining boundaries between
measured facts, model predictions, and hypothetical simulations.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from src.config import CARBON_FACTOR_NOTE, MENU_ITEMS
from src.planner import PreparationPlanner


@dataclass
class RescueAction:
    menu_item: str
    risk_level: str               # 'High', 'Moderate', 'Low'
    predicted_demand: float
    planned_preparation: int
    potential_surplus_portions: int
    ingredient_cost_at_risk: float # in ₹
    primary_action: str
    action_type: str               # 'Batch Reduction', 'Staggered Prep', 'Discount', 'Rescue Protocol'
    operational_details: str
    safety_advisory: str


@dataclass
class ImpactSimulationSummary:
    total_portions_prepared_baseline: int
    total_portions_prepared_wastewise: int
    estimated_surplus_avoided_portions: int
    estimated_surplus_avoided_kg: float
    estimated_ingredient_cost_avoided: float # in ₹
    estimated_co2e_avoided_kg: float         # in kg CO2e
    stockout_rate_baseline: float            # %
    stockout_rate_wastewise: float           # %
    waste_reduction_pct: float
    methodology_note: str


def classify_waste_risks(
    forecasts: Dict[str, float],
    planned_preparations: Dict[str, int],
) -> List[RescueAction]:
    """
    Classifies each menu item into transparent risk tiers (High, Moderate, Low)
    and attaches pragmatic operational kitchen interventions.
    """
    actions = []
    
    for item_name, pred_d in forecasts.items():
        cfg = MENU_ITEMS.get(item_name)
        cost_unit = cfg.cost_per_portion if cfg else 30.0
        shelf_life = cfg.shelf_life_hours if cfg else 3.0
        
        prep_qty = planned_preparations.get(item_name, int(round(pred_d * 1.15)))
        surplus_portions = max(0, prep_qty - int(round(pred_d)))
        cost_at_risk = round(surplus_portions * cost_unit, 2)
        surplus_ratio = surplus_portions / max(1.0, pred_d)
        
        # Transparent rule logic based on surplus ratio and shelf life
        if surplus_ratio >= 0.20 or surplus_portions >= 18:
            risk = "High"
            action_type = "Batch Reduction & Staggered Prep"
            primary_action = f"Pull back initial cook by {surplus_portions} portions; prepare mise-en-place only."
            operational_details = (
                f"Demand is projected at {pred_d:.0f} vs planned {prep_qty}. "
                f"Cook Batch 1 at {int(round(pred_d * 0.70))} portions. Keep sauce and prepped vegetables chilled; "
                f"cook secondary batch only if 50% sold before 1:30 PM."
            )
            safety_advisory = (
                "⚠️ Food Safety Alert: Cooked items have a strict hold limit of "
                f"{shelf_life:.1f}h. Do not leave surplus at ambient counter temperatures."
            )
        elif surplus_ratio >= 0.08 or surplus_portions >= 8:
            risk = "Moderate"
            action_type = "Dynamic Refill Monitoring"
            primary_action = "Maintain standard initial batch; hold replenishment until mid-service sales check."
            operational_details = (
                f"Mild surplus risk of ~{surplus_portions} portions (₹{cost_at_risk:.0f} at risk). "
                f"Hold Batch 2 approval until floor sales velocity is confirmed at 1:15 PM."
            )
            safety_advisory = "Standard hot holding (>60°C) required if prepared in advance."
        else:
            risk = "Low"
            action_type = "Standard Operations"
            primary_action = "Proceed with recommended preparation quantity."
            operational_details = (
                f"Forecast aligns tightly with planned batch ({pred_d:.0f} vs {prep_qty}). "
                "Low overproduction exposure."
            )
            safety_advisory = "Normal kitchen standard operating procedures apply."
            
        actions.append(
            RescueAction(
                menu_item=item_name,
                risk_level=risk,
                predicted_demand=pred_d,
                planned_preparation=prep_qty,
                potential_surplus_portions=surplus_portions,
                ingredient_cost_at_risk=cost_at_risk,
                primary_action=primary_action,
                action_type=action_type,
                operational_details=operational_details,
                safety_advisory=safety_advisory,
            )
        )
        
    # Sort descending by cost at risk
    actions.sort(key=lambda x: (x.risk_level == "High", x.ingredient_cost_at_risk), reverse=True)
    return actions


def simulate_holdout_impact(
    test_df: pd.DataFrame,
    ml_preds: np.ndarray,
    baseline_prep_policy: Optional[pd.Series] = None,
) -> ImpactSimulationSummary:
    """
    Simulates what would have occurred on the held-out validation dataset
    if the kitchen followed WasteWise cost-aware recommendations versus
    the historical fixed preparation policy.
    
    Clearly tagged as a hypothetical simulation.
    """
    df = test_df.copy()
    df["ml_pred"] = ml_preds
    
    # 1. Baseline traditional policy (historical portions prepared)
    if baseline_prep_policy is not None:
        df["trad_prep"] = baseline_prep_policy.values
    elif "portions_prepared" in df.columns:
        df["trad_prep"] = df["portions_prepared"]
    else:
        df["trad_prep"] = (df["portions_sold"] * 1.15).round().astype(int)
        
    # Replay the operational planner with holdout ensemble bounds when available.
    # Other callers use an approximate +/-15% interval.
    planner = PreparationPlanner()
    df["ww_prep"] = [
        planner.generate_plan(
            menu_item=row["menu_item"], predicted_demand=row["ml_pred"],
            lower_bound=row.get("lower_bound", row["ml_pred"] * 0.85),
            upper_bound=row.get("upper_bound", row["ml_pred"] * 1.15),
            service_level_preference=0.55,
        ).recommended_total_plan
        for _, row in df.iterrows()
    ]
    
    # True latent demand proxy (observed portions sold or latent_demand if present)
    true_demand = df["latent_demand"] if "latent_demand" in df.columns else df["portions_sold"]
    
    # Baseline outcomes
    trad_surplus = np.maximum(0, df["trad_prep"] - true_demand)
    trad_shortage = np.maximum(0, true_demand - df["trad_prep"])
    trad_stockout_count = (trad_shortage > 0).sum()
    
    # WasteWise outcomes
    ww_surplus = np.maximum(0, df["ww_prep"] - true_demand)
    ww_shortage = np.maximum(0, true_demand - df["ww_prep"])
    ww_stockout_count = (ww_shortage > 0).sum()
    
    # Financial impact
    unit_cost = df["cost_per_portion"].values
    trad_waste_cost = np.sum(trad_surplus * unit_cost)
    ww_waste_cost = np.sum(ww_surplus * unit_cost)
    cost_avoided = float(max(0.0, trad_waste_cost - ww_waste_cost))
    
    surplus_difference = float(np.sum(trad_surplus) - np.sum(ww_surplus))
    waste_reduction_pct = round(surplus_difference / float(np.sum(trad_surplus)) * 100, 1) if np.sum(trad_surplus) > 0 else 0.0
    portions_avoided = int(max(0, surplus_difference))
    # Approximate 1 portion = ~0.32 kg on average in canteen dishes
    kg_avoided = round(portions_avoided * 0.32, 1)
    # UNEP factor: ~2.5 kg CO2e per kg discarded edible food
    co2e_avoided = round(kg_avoided * 2.5, 1)
    
    total_eval_rows = len(df)
    stockout_rate_trad = round(float(trad_stockout_count / total_eval_rows * 100), 1)
    stockout_rate_ww = round(float(ww_stockout_count / total_eval_rows * 100), 1)
    
    methodology = (
        "Simulation Methodology: Applied WasteWise batch recommendations against held-out "
        f"test records ({total_eval_rows} item-day periods). Compared against recorded baseline "
        "habit. Ingredient savings evaluated at item unit cost. Carbon impact computed using "
        "UNEP Food Waste Index standard factor (2.5 kg CO2e/kg food). "
        "⚠️ This is a retrospective mathematical simulation, not an empirically measured commercial pilot."
    )
    
    return ImpactSimulationSummary(
        total_portions_prepared_baseline=int(np.sum(df["trad_prep"])),
        total_portions_prepared_wastewise=int(np.sum(df["ww_prep"])),
        estimated_surplus_avoided_portions=portions_avoided,
        estimated_surplus_avoided_kg=kg_avoided,
        estimated_ingredient_cost_avoided=round(cost_avoided, 2),
        estimated_co2e_avoided_kg=co2e_avoided,
        stockout_rate_baseline=stockout_rate_trad,
        stockout_rate_wastewise=stockout_rate_ww,
        waste_reduction_pct=waste_reduction_pct,
        methodology_note=methodology,
    )
