"""
WasteWise AI - Organization State & Model Registry
Manages multi-tenant demand forecasting models, active datasets, and preparation planners
ensuring strict tenant isolation, thread-safe access, and private on-disk dataset storage.
"""

import asyncio
from pathlib import Path
import re
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

    SAFE_ORG_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")

    def __init__(self, base_data_dir: Optional[Path] = None):
        self.data_dir = base_data_dir or DATA_DIR
        self.tenants_dir = (self.data_dir / "tenants").resolve()
        try:
            self.tenants_dir.mkdir(parents=True, exist_ok=True)
        except OSError:
            self.data_dir = Path("/tmp/data").resolve()
            self.tenants_dir = (self.data_dir / "tenants").resolve()
            try:
                self.tenants_dir.mkdir(parents=True, exist_ok=True)
            except OSError:
                pass
        self._states: Dict[str, OrgState] = {}
        self._registry_lock = threading.Lock()
        self._tenant_locks: Dict[str, threading.Lock] = {}
        self._tenant_locks_lock = threading.Lock()

    def sanitize_org_id(self, organization_id: Optional[str]) -> str:
        org_id = (organization_id or DEFAULT_ORG_ID).strip()
        if not self.SAFE_ORG_ID_PATTERN.match(org_id):
            raise ValueError(f"Invalid organization identifier: {organization_id!r}")
        return org_id

    def _get_tenant_lock(self, organization_id: str) -> threading.Lock:
        with self._tenant_locks_lock:
            if organization_id not in self._tenant_locks:
                self._tenant_locks[organization_id] = threading.Lock()
            return self._tenant_locks[organization_id]

    def get_tenant_dir(self, organization_id: str) -> Path:
        safe_id = self.sanitize_org_id(organization_id)
        t_dir = (self.tenants_dir / safe_id).resolve()
        # Enforce strict boundary against path traversal attacks (e.g., ../../)
        try:
            if not t_dir.is_relative_to(self.tenants_dir):
                raise ValueError(f"Path traversal detected in organization identifier: {organization_id!r}")
        except AttributeError:
            # Fallback for Python < 3.9 path relative checking
            if not str(t_dir).startswith(str(self.tenants_dir)):
                raise ValueError(f"Path traversal detected in organization identifier: {organization_id!r}")

        try:
            t_dir.mkdir(parents=True, exist_ok=True)
        except OSError:
            fallback_base = Path("/tmp/data/tenants").resolve()
            t_dir = (fallback_base / safe_id).resolve()
            try:
                t_dir.mkdir(parents=True, exist_ok=True)
            except OSError:
                pass
        return t_dir

    def get_tenant_csv_path(self, organization_id: str) -> Path:
        return self.get_tenant_dir(organization_id) / "active_operator_dataset.csv"

    def _build_tenant_state(self, org_id: str) -> OrgState:
        """Loads and trains the model for a tenant outside the global registry lock."""
        # 1. Check if tenant has a persisted operator dataset on disk
        csv_path = self.get_tenant_csv_path(org_id)
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                is_valid, _, clean_df = validate_dataset(df)
                if is_valid:
                    engine = DemandForecastingEngine(n_estimators=100, random_state=42)
                    holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))
                    engine.train_and_evaluate(clean_df, holdout_days=holdout_days)
                    return OrgState(
                        organization_id=org_id,
                        dataset_df=clean_df,
                        engine=engine,
                        is_synthetic=False,
                    )
            except Exception:
                # Fall back to demonstration dataset if file is corrupt
                pass

        # 2. Also check legacy root data dir for default demo org if active
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
                        return OrgState(
                            organization_id=org_id,
                            dataset_df=clean_df,
                            engine=engine,
                            is_synthetic=False,
                        )
                except Exception:
                    pass

        # 3. Initialize with default baseline demonstration data for this organization
        demo_df = get_demonstration_data()
        demo_engine = DemandForecastingEngine(n_estimators=100, random_state=42)
        demo_engine.train_and_evaluate(demo_df, holdout_days=35)
        return OrgState(
            organization_id=org_id,
            dataset_df=demo_df,
            engine=demo_engine,
            is_synthetic=True,
        )

    def get_state(self, organization_id: Optional[str] = None) -> OrgState:
        org_id = self.sanitize_org_id(organization_id)

        # 1. Fast path: check cache with quick lock without blocking other operations
        with self._registry_lock:
            if org_id in self._states:
                return self._states[org_id]

        # 2. Acquire per-tenant lock so concurrent requests for DIFFERENT tenants do not block
        tenant_lock = self._get_tenant_lock(org_id)
        with tenant_lock:
            # Re-check under lock in case another thread trained it while waiting
            with self._registry_lock:
                if org_id in self._states:
                    return self._states[org_id]

            # Train / load state outside the global registry lock
            new_state = self._build_tenant_state(org_id)

            with self._registry_lock:
                self._states[org_id] = new_state
                return new_state

    def set_tenant_state(
        self,
        organization_id: str,
        clean_df: pd.DataFrame,
        engine: DemandForecastingEngine,
        is_synthetic: bool = False,
    ):
        org_id = self.sanitize_org_id(organization_id)
        tenant_lock = self._get_tenant_lock(org_id)
        with tenant_lock:
            with self._registry_lock:
                if org_id in self._states:
                    self._states[org_id].dataset_df = clean_df
                    self._states[org_id].engine = engine
                    self._states[org_id].is_synthetic = is_synthetic
                else:
                    self._states[org_id] = OrgState(
                        organization_id=org_id,
                        dataset_df=clean_df,
                        engine=engine,
                        is_synthetic=is_synthetic,
                    )

    def reset_tenant_state(self, organization_id: str):
        org_id = self.sanitize_org_id(organization_id)
        tenant_lock = self._get_tenant_lock(org_id)
        with tenant_lock:
            with self._registry_lock:
                # 1. Remove active operator dataset for this tenant
                csv_path = self.get_tenant_csv_path(org_id)
                if csv_path.exists():
                    try:
                        csv_path.unlink()
                    except Exception:
                        pass

                if org_id == DEFAULT_ORG_ID:
                    legacy_path = self.data_dir / "active_operator_dataset.csv"
                    if legacy_path.exists():
                        try:
                            legacy_path.unlink()
                        except Exception:
                            pass

                # 2. Deactivate upload audit records only for this tenant
                with get_db_context() as db:
                    db.query(UploadHistoryModel).filter(
                        UploadHistoryModel.organization_id == org_id,
                        UploadHistoryModel.is_active == True,
                    ).update({"is_active": False})
                    db.commit()

                # 3. Reset in-memory state for this tenant to demonstration baseline
                demo_df = get_demonstration_data()
                demo_engine = DemandForecastingEngine(n_estimators=100, random_state=42)
                demo_engine.train_and_evaluate(demo_df, holdout_days=35)

                if org_id in self._states:
                    self._states[org_id].dataset_df = demo_df
                    self._states[org_id].engine = demo_engine
                    self._states[org_id].is_synthetic = True
                else:
                    self._states[org_id] = OrgState(
                        organization_id=org_id,
                        dataset_df=demo_df,
                        engine=demo_engine,
                        is_synthetic=True,
                    )


# Global registry singleton
org_state_registry = OrgStateRegistry()
