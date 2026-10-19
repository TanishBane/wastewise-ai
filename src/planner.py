"""
WasteWise AI - Smart Preparation Planner and Newsvendor Decision Engine
Translates demand forecasts and cost asymmetries (surplus cost vs. shortage cost)
into cost-optimal preparation quantities, initial batch allocations, and refill triggers.
"""

from dataclasses import dataclass
from typing import Any, Dict
import numpy as np
from scipy.stats import norm

from src.config import MENU_ITEMS


@dataclass
class PreparationPlan:
    menu_item: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    critical_ratio: float           # Target quantile (CR)
    recommended_total_plan: int     # Cost-optimal total day target
    recommended_initial_batch: int  # Initial cooking batch
    refill_trigger_threshold: int   # Remaining portion trigger for Batch 2
    recommended_buffer: int         # Safety buffer portions
    current_policy_prep: int        # Baseline traditional fixed prep
    
    # Financial & Risk comparison
    wastewise_expected_surplus: float
    wastewise_expected_shortage: float
    wastewise_expected_cost: float
    
    current_policy_expected_surplus: float
    current_policy_expected_shortage: float
    current_policy_expected_cost: float
    
    net_cost_avoided: float         # Savings in ₹
    surplus_portions_avoided: float # Food saved from trash in portions
    
    recommendation_reason: str
    risk_classification: str        # 'Low', 'Moderate', 'High'


class PreparationPlanner:
    """
    Implements Newsvendor Critical Fractile optimization and staggered batch planning.
    Balances holding/ingredient loss against stockout margin penalty.
    """
    def __init__(self):
        pass

    @staticmethod
    def calculate_critical_ratio(
        cost_surplus: float,
        cost_shortage: float,
        service_level_preference: float = 0.50,
    ) -> float:
        """
        Computes the target quantile using Newsvendor intuition:
        CR = C_shortage / (C_shortage + C_surplus)
        Adjusted gently by operator risk preference (0.3 to 0.8).
        """
        raw_cr = cost_shortage / max(1e-4, (cost_shortage + cost_surplus))
        # Blend raw economic ratio with operator preference
        blended_cr = 0.65 * raw_cr + 0.35 * service_level_preference
        return float(np.clip(blended_cr, 0.15, 0.92))

    def generate_plan(
        self,
        menu_item: str,
        predicted_demand: float,
        lower_bound: float,
        upper_bound: float,
        current_stock: int = 0,
        custom_cost_surplus: float = None,
        custom_cost_shortage: float = None,
        service_level_preference: float = 0.50,
        traditional_baseline_prep: int = None,
    ) -> PreparationPlan:
        """
        Creates an actionable preparation recommendation for an operator.
        """
        item_cfg = MENU_ITEMS.get(menu_item)
        if item_cfg:
            default_c_surplus = item_cfg.cost_per_portion
            default_c_shortage = max(10.0, item_cfg.selling_price - item_cfg.cost_per_portion)
            batch_size = item_cfg.prep_batch_size
            default_trad_prep = int(round(item_cfg.base_demand * 1.15))
        else:
            default_c_surplus = 35.0
            default_c_shortage = 40.0
            batch_size = 15
            default_trad_prep = 100

        c_surplus = custom_cost_surplus if custom_cost_surplus is not None else default_c_surplus
        c_shortage = custom_cost_shortage if custom_cost_shortage is not None else default_c_shortage
        trad_prep = traditional_baseline_prep if traditional_baseline_prep is not None else default_trad_prep

        cr = self.calculate_critical_ratio(c_surplus, c_shortage, service_level_preference)

        # Approximate demand distribution std dev from the 80% interval (z ~= 1.28 on each side)
        span = max(4.0, upper_bound - lower_bound)
        implied_sigma = span / 2.56
        
        # Newsvendor optimal target Q* = mu + z_CR * sigma
        z_cr = norm.ppf(cr)
        optimal_target = predicted_demand + z_cr * implied_sigma - current_stock
        optimal_target = max(0.0, optimal_target)
        
        # Round to operational practical batch
        # For canteens, preparation happens in practical batch multiples or integer portions
        rec_total = int(round(optimal_target))
        
        # Staggered Batching Strategy:
        # If item has shelf life <= 4 hours and total > batch_size, cook initial batch (60-70%)
        # and hold the remainder for mid-service replenishment.
        if rec_total > batch_size * 1.5:
            initial_batch = int(round(rec_total * 0.65))
            refill_trigger = max(10, int(round(rec_total * 0.20)))
        else:
            initial_batch = rec_total
            refill_trigger = max(5, int(round(rec_total * 0.15)))

        buffer_portions = rec_total - int(round(predicted_demand))

        # Simulation: evaluate expected surplus and shortage for both policies
        # Monte Carlo simulation over implied normal distribution
        np.random.seed(42)
        simulated_demands = np.random.normal(predicted_demand, implied_sigma, size=1000)
        simulated_demands = np.clip(simulated_demands, 0, None)
        
        # WasteWise policy outcome
        ww_surplus = np.mean(np.maximum(0, rec_total - simulated_demands))
        ww_shortage = np.mean(np.maximum(0, simulated_demands - rec_total))
        ww_cost = float(ww_surplus * c_surplus + ww_shortage * c_shortage)

        # Traditional policy outcome
        trad_surplus = np.mean(np.maximum(0, trad_prep - simulated_demands))
        trad_shortage = np.mean(np.maximum(0, simulated_demands - trad_prep))
        trad_cost = float(trad_surplus * c_surplus + trad_shortage * c_shortage)

        net_cost_avoided = round(trad_cost - ww_cost, 2)
        surplus_portions_avoided = round(float(trad_surplus - ww_surplus), 1)

        # Risk Classification
        surplus_ratio = (rec_total - predicted_demand) / max(1.0, predicted_demand)
        if trad_prep - predicted_demand > 20 or surplus_ratio > 0.25:
            risk = "High"
        elif trad_prep - predicted_demand > 8 or surplus_ratio > 0.10:
            risk = "Moderate"
        else:
            risk = "Low"

        # Generate human-readable reason
        if current_stock > 0:
            reason = (
                f"Existing inventory of {current_stock} portions factored in. "
                f"Recommended initial prep is reduced to {initial_batch} portions to prevent expiry."
            )
        elif cr > 0.60:
            reason = (
                f"High margin dish (Shortage cost ₹{c_shortage:.0f} vs. Waste cost ₹{c_surplus:.0f}). "
                f"Slightly positive buffer of {buffer_portions} portions protects against customer disappointment."
            )
        elif cr < 0.45:
            reason = (
                f"Perishable item with high ingredient cost exposure (₹{c_surplus:.0f}/portion). "
                f"Conservative initial batch of {initial_batch} portions prevents costly end-of-day discards."
            )
        else:
            reason = (
                f"Balanced cost profile. Staggered batching: start with {initial_batch} portions, "
                f"check pace at 1:15 PM, and prepare secondary batch if stock reaches {refill_trigger}."
            )

        return PreparationPlan(
            menu_item=menu_item,
            predicted_demand=predicted_demand,
            lower_bound=lower_bound,
            upper_bound=upper_bound,
            critical_ratio=round(cr, 3),
            recommended_total_plan=rec_total,
            recommended_initial_batch=initial_batch,
            refill_trigger_threshold=refill_trigger,
            recommended_buffer=buffer_portions,
            current_policy_prep=trad_prep,
            wastewise_expected_surplus=round(float(ww_surplus), 1),
            wastewise_expected_shortage=round(float(ww_shortage), 1),
            wastewise_expected_cost=round(ww_cost, 2),
            current_policy_expected_surplus=round(float(trad_surplus), 1),
            current_policy_expected_shortage=round(float(trad_shortage), 1),
            current_policy_expected_cost=round(trad_cost, 2),
            net_cost_avoided=net_cost_avoided,
            surplus_portions_avoided=surplus_portions_avoided,
            recommendation_reason=reason,
            risk_classification=risk,
        )
