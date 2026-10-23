"""
WasteWise AI - Organization State & Model Registry
Manages multi-tenant demand forecasting models, active datasets, and preparation planners
ensuring strict tenant isolation, thread-safe access, and private on-disk dataset storage.
"""

import asyncio
from pathlib import Path
import threading
from typing import Dict, Optional
import pandas as pd

from backend.database import get_db_context
from backend.models import UploadHistoryModel, DEFAULT_ORG_ID
from src.data import DATA_DIR, get_demonstration_data, validate_dataset
from src.model import DemandForecastingEngine
from src.planner import PreparationPlanner


class OrgState:
    """Encapsulates the ML forecasting engine and dataset scoped to a single organization."""

    def __init__(
        self,
        organization_id: str,
        dataset_df: pd.DataFrame,
        engine: DemandForecastingEngine,
        is_synthetic: bool = True,
    ):
        self.organization_id = organization_id
        self.dataset_df = dataset_df
        self.engine = engine
        self.is_synthetic = is_synthetic
        self.planner = PreparationPlanner()
        self.lock = asyncio.Lock()

    @property
    def latest_date(self) -> str:
        if self.dataset_df is not None and not self.dataset_df.empty and "date" in self.dataset_df.columns:
            return str(self.dataset_df["date"].max())
        return "2026-10-23"


class OrgStateRegistry:
    """
    Registry that lazily instantiates, caches, and maintains tenant-scoped forecasting engines.
    Prevents cross-tenant state pollution and guarantees that Tenant A's dataset uploads
    or resets never modify Tenant B's ML model or application state.
    """

    def __init__(self, base_data_dir: Optional[Path] = None):
        self.data_dir = base_data_dir or DATA_DIR
        self.tenants_dir = self.data_dir / "tenants"
        self.tenants_dir.mkdir(parents=True, exist_ok=True)
        self._states: Dict[str, OrgState] = {}
        self._registry_lock = threading.Lock()

    def get_tenant_dir(self, organization_id: str) -> Path:
        t_dir = self.tenants_dir / organization_id
        t_dir.mkdir(parents=True, exist_ok=True)
        return t_dir

    def get_tenant_csv_path(self, organization_id: str) -> Path:
        return self.get_tenant_dir(organization_id) / "active_operator_dataset.csv"

    def get_state(self, organization_id: Optional[str] = None) -> OrgState:
        org_id = organization_id or DEFAULT_ORG_ID

        with self._registry_lock:
            if org_id in self._states:
                return self._states[org_id]

            # Check if tenant has a persisted operator dataset on disk
            csv_path = self.get_tenant_csv_path(org_id)
            if csv_path.exists():
                try:
                    df = pd.read_csv(csv_path)
                    is_valid, _, clean_df = validate_dataset(df)
                    if is_valid:
                        engine = DemandForecastingEngine(n_estimators=100, random_state=42)
                        holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))
                        engine.train_and_evaluate(clean_df, holdout_days=holdout_days)
                        state = OrgState(
                            organization_id=org_id,
                            dataset_df=clean_df,
                            engine=engine,
                            is_synthetic=False,
                        )
                        self._states[org_id] = state
                        return state
                except Exception:
                    # Fall back to demonstration dataset if file is corrupt
                    pass

            # Also check legacy root data dir for default demo org if active
            if org_id == DEFAULT_ORG_ID:
                legacy_path = self.data_dir / "active_operator_dataset.csv"
                if legacy_path.exists():
                    try:
                        df = pd.read_csv(legacy_path)
                        is_valid, _, clean_df = validate_dataset(df)
                        if is_valid:
                            engine = DemandForecastingEngine(n_estimators=100, random_state=42)
                            holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))
                            engine.train_and_evaluate(clean_df, holdout_days=holdout_days)
                            state = OrgState(
                                organization_id=org_id,
                                dataset_df=clean_df,
                                engine=engine,
                                is_synthetic=False,
                            )
                            self._states[org_id] = state
                            return state
                    except Exception:
                        pass

            # Initialize with default baseline demonstration data for this organization
            demo_df = get_demonstration_data()
            demo_engine = DemandForecastingEngine(n_estimators=100, random_state=42)
            demo_engine.train_and_evaluate(demo_df, holdout_days=35)
            state = OrgState(
                organization_id=org_id,
                dataset_df=demo_df,
                engine=demo_engine,
                is_synthetic=True,
            )
            self._states[org_id] = state
            return state

    def set_tenant_state(
        self,
        organization_id: str,
        clean_df: pd.DataFrame,
        engine: DemandForecastingEngine,
        is_synthetic: bool = False,
    ):
        with self._registry_lock:
            if organization_id in self._states:
                self._states[organization_id].dataset_df = clean_df
                self._states[organization_id].engine = engine
                self._states[organization_id].is_synthetic = is_synthetic
            else:
                self._states[organization_id] = OrgState(
                    organization_id=organization_id,
                    dataset_df=clean_df,
                    engine=engine,
                    is_synthetic=is_synthetic,
                )

    def reset_tenant_state(self, organization_id: str):
        with self._registry_lock:
            # 1. Remove active operator dataset for this tenant
            csv_path = self.get_tenant_csv_path(organization_id)
            if csv_path.exists():
                try:
                    csv_path.unlink()
                except Exception:
                    pass

            if organization_id == DEFAULT_ORG_ID:
                legacy_path = self.data_dir / "active_operator_dataset.csv"
                if legacy_path.exists():
                    try:
                        legacy_path.unlink()
                    except Exception:
                        pass

            # 2. Deactivate upload audit records only for this tenant
            with get_db_context() as db:
                db.query(UploadHistoryModel).filter(
                    UploadHistoryModel.organization_id == organization_id,
                    UploadHistoryModel.is_active == True,
                ).update({"is_active": False})
                db.commit()

            # 3. Reset in-memory state for this tenant to demonstration baseline
            demo_df = get_demonstration_data()
            demo_engine = DemandForecastingEngine(n_estimators=100, random_state=42)
            demo_engine.train_and_evaluate(demo_df, holdout_days=35)

            if organization_id in self._states:
                self._states[organization_id].dataset_df = demo_df
                self._states[organization_id].engine = demo_engine
                self._states[organization_id].is_synthetic = True
            else:
                self._states[organization_id] = OrgState(
                    organization_id=organization_id,
                    dataset_df=demo_df,
                    engine=demo_engine,
                    is_synthetic=True,
                )


# Global registry singleton
org_state_registry = OrgStateRegistry()
