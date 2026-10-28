"""
WasteWise AI - Planning Service
Coordinates Newsvendor stochastic preparation optimization, multi-batch replenishment,
Monte Carlo simulated demand distributions, and preparation plan persistence.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np
from fastapi import HTTPException
from backend.database import get_db_context
from backend.models import PreparationPlanModel
from src.planner import PreparationPlanner


class PlanningService:
    def __init__(self, planner: Optional[PreparationPlanner] = None):
        self.planner = planner or PreparationPlanner()

    def generate_plan(
        self,
        menu_item: str,
        predicted_demand: float,
        lower_bound: float,
        upper_bound: float,
        current_stock: int = 0,
        custom_cost_surplus: Optional[float] = None,
        custom_cost_shortage: Optional[float] = None,
        service_level_preference: float = 0.55,
        traditional_baseline_prep: Optional[int] = None,
        service_date: Optional[str] = None,
        target_meal: str = "Lunch",
        organization_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculates optimized batch preparation sizes, replenishment triggers,
        Monte Carlo distribution curves, and saves the plan to SQLite.
        """
        plan = self.planner.generate_plan(
            menu_item=menu_item,
            predicted_demand=predicted_demand,
            lower_bound=lower_bound,
            upper_bound=upper_bound,
            current_stock=current_stock,
            custom_cost_surplus=custom_cost_surplus,
            custom_cost_shortage=custom_cost_shortage,
            service_level_preference=service_level_preference,
            traditional_baseline_prep=traditional_baseline_prep,
        )

        # 100-point Monte Carlo distribution curves for comparison chart
        rng = np.random.default_rng(42)
        span = max(4.0, upper_bound - lower_bound)
        sigma = span / 2.56
        sim_demands = rng.normal(predicted_demand, sigma, 600)
        sim_demands = np.clip(sim_demands, 0, None)

        bins = np.linspace(max(0, predicted_demand - 2.5 * sigma), predicted_demand + 2.5 * sigma, 15)
        counts, bin_edges = np.histogram(sim_demands, bins=bins)
        distribution = []
        for i in range(len(counts)):
            mid = round((bin_edges[i] + bin_edges[i+1]) / 2)
            distribution.append({
                "portions": mid,
                "frequency": int(counts[i]),
            })

        from backend.models import DEFAULT_ORG_ID
        effective_org_id = organization_id or DEFAULT_ORG_ID

        # Persist the plan with tenant isolation
        try:
            with get_db_context() as db:
                date_str = service_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
                record = PreparationPlanModel(
                    organization_id=effective_org_id,
                    user_id=user_id,
                    service_date=date_str,
                    target_meal=target_meal,
                    menu_item=menu_item,
                    predicted_demand=round(predicted_demand, 1),
                    lower_bound=round(lower_bound, 1),
                    upper_bound=round(upper_bound, 1),
                    current_stock=current_stock,
                    critical_ratio=round(plan.critical_ratio, 3),
                    recommended_total_plan=plan.recommended_total_plan,
                    recommended_initial_batch=plan.recommended_initial_batch,
                    refill_trigger_threshold=plan.refill_trigger_threshold,
                    wastewise_expected_cost=round(plan.wastewise_expected_cost, 2),
                    current_policy_expected_cost=round(plan.current_policy_expected_cost, 2),
                    net_cost_avoided=round(plan.net_cost_avoided, 2),
                    status="recommended",
                )
                db.add(record)
                db.commit()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail="The plan was calculated but could not be saved. Please retry.",
            ) from exc

        return {
            "menu_item": plan.menu_item,
            "predicted_demand": round(plan.predicted_demand),
            "lower_bound": round(plan.lower_bound),
            "upper_bound": round(plan.upper_bound),
            "critical_ratio": round(plan.critical_ratio, 3),
            "recommended_total_plan": plan.recommended_total_plan,
            "recommended_initial_batch": plan.recommended_initial_batch,
            "refill_trigger_threshold": plan.refill_trigger_threshold,
            "recommended_buffer": plan.recommended_buffer,
            "current_policy_prep": plan.current_policy_prep,
            "wastewise_expected_surplus": round(plan.wastewise_expected_surplus, 1),
            "wastewise_expected_shortage": round(plan.wastewise_expected_shortage, 1),
            "wastewise_expected_cost": round(plan.wastewise_expected_cost),
            "current_policy_expected_surplus": round(plan.current_policy_expected_surplus, 1),
            "current_policy_expected_shortage": round(plan.current_policy_expected_shortage, 1),
            "current_policy_expected_cost": round(plan.current_policy_expected_cost),
            "net_cost_avoided": round(plan.net_cost_avoided),
            "surplus_portions_avoided": round(plan.surplus_portions_avoided, 1),
            "recommendation_reason": plan.recommendation_reason,
            "risk_classification": plan.risk_classification,
            "distribution": distribution,
        }

    @staticmethod
    def get_recent_plans(
        organization_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Retrieves stored preparation plans for the specified organization."""
        with get_db_context() as db:
            query = db.query(PreparationPlanModel)
            if organization_id:
                query = query.filter(PreparationPlanModel.organization_id == organization_id)
            plans = (
                query
                .order_by(PreparationPlanModel.created_at.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": p.id,
                    "service_date": p.service_date,
                    "target_meal": p.target_meal,
                    "menu_item": p.menu_item,
                    "predicted_demand": p.predicted_demand,
                    "recommended_total_plan": p.recommended_total_plan,
                    "recommended_initial_batch": p.recommended_initial_batch,
                    "refill_trigger_threshold": p.refill_trigger_threshold,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                }
                for p in plans
            ]
