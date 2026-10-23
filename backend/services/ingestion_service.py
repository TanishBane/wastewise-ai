"""
WasteWise AI - Ingestion Service
Handles resilient CSV parsing (BOM/UTF-8-SIG), strict schema validation,
tenant-scoped concurrency locking, async thread-pool model training,
and organization-isolated dataset persistence.
"""

import asyncio
import hashlib
import io
import json
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException
import pandas as pd

from backend.database import get_db_context
from backend.models import MenuItemModel, UploadHistoryModel, DEFAULT_ORG_ID
from backend.services.org_state_service import org_state_registry
from src.data import DATA_DIR, validate_dataset
from src.model import DemandForecastingEngine


class IngestionService:
    MAX_UPLOAD_BYTES = 10 * 1024 * 1024

    def __init__(self):
        self._global_lock = asyncio.Lock()

    async def process_and_train_csv(
        self,
        file_bytes: bytes,
        filename: str,
        organization_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Tuple[pd.DataFrame, DemandForecastingEngine, List[str]]:
        """
        Processes uploaded CSV bytes under tenant-scoped isolation:
        - Validates format and BOM encoding
        - Verifies required schema and positive values
        - Asynchronously trains Random Forest model in a background worker thread
        - Records file hash and upload audit history scoped to the organization
        - Synchronizes newly discovered menu items into organization's catalog
        - Stores the dataset in private tenant storage without affecting other tenants
        """
        effective_org_id = organization_id or DEFAULT_ORG_ID
        org_state = org_state_registry.get_state(effective_org_id)

        async with org_state.lock:
            if not file_bytes:
                raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")
            if len(file_bytes) > self.MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="CSV files must be 10 MB or smaller.")
            if not filename.lower().endswith(".csv"):
                raise HTTPException(status_code=415, detail="Only .csv uploads are supported.")

            # 1. Parse CSV with BOM protection
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding_errors="replace")
                df.columns = [str(c).strip() for c in df.columns]
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid CSV format: {exc}",
                ) from exc

            # 2. Strict Schema Validation
            is_valid, issues, clean_df = validate_dataset(df)
            if not is_valid:
                raise HTTPException(status_code=422, detail=issues)

            # 3. Compute SHA256 Checksum
            sha256 = hashlib.sha256(file_bytes).hexdigest()

            # 4. Off-thread Model Training
            engine = DemandForecastingEngine(n_estimators=100, random_state=42)
            holdout_days = min(35, max(5, clean_df["date"].nunique() // 5))

            try:
                await asyncio.to_thread(engine.train_and_evaluate, clean_df, holdout_days)
            except Exception as exc:
                raise HTTPException(
                    status_code=422,
                    detail=f"Cannot train forecasting model on this dataset: {exc}",
                ) from exc

            # 5. Persist Upload Record & Sync Menu Catalog for this specific Organization
            try:
                with get_db_context() as db:
                    # Mark prior uploads for THIS tenant as inactive
                    db.query(UploadHistoryModel).filter(
                        UploadHistoryModel.organization_id == effective_org_id,
                        UploadHistoryModel.is_active == True,
                    ).update({"is_active": False})

                    upload_record = UploadHistoryModel(
                        organization_id=effective_org_id,
                        user_id=user_id,
                        filename=filename,
                        checksum=sha256,
                        row_count=len(clean_df),
                        service_days=int(clean_df["date"].nunique()),
                        validation_warnings_json=json.dumps(issues),
                        source="operator",
                        is_active=True,
                    )
                    db.add(upload_record)

                    # Discover any new menu items in the uploaded dataset for this tenant
                    unique_items = clean_df["menu_item"].unique()
                    existing_names = {
                        m.name
                        for m in db.query(MenuItemModel.name)
                        .filter(MenuItemModel.organization_id == effective_org_id)
                        .all()
                    }
                    for item_name in unique_items:
                        if item_name not in existing_names:
                            new_item = MenuItemModel(
                                organization_id=effective_org_id,
                                name=str(item_name),
                                category="Custom",
                                cost_price=40.0,
                                selling_price=70.0,
                                prep_time_min=30,
                                prep_batch_size=20,
                                shelf_life_hours=4.0,
                                base_demand=float(clean_df[clean_df["menu_item"] == item_name]["portions_sold"].mean()),
                                active=True,
                            )
                            db.add(new_item)

                    db.commit()

                # Persist to tenant-scoped private directory
                tenant_csv_path = org_state_registry.get_tenant_csv_path(effective_org_id)
                clean_df.to_csv(tenant_csv_path, index=False)

                if effective_org_id == DEFAULT_ORG_ID:
                    clean_df.to_csv(DATA_DIR / "active_operator_dataset.csv", index=False)

                # Update in-memory registry state for this tenant
                org_state_registry.set_tenant_state(
                    organization_id=effective_org_id,
                    clean_df=clean_df,
                    engine=engine,
                    is_synthetic=False,
                )
            except Exception as exc:
                raise HTTPException(
                    status_code=503,
                    detail="The upload was validated but could not be saved. No active dataset was changed.",
                ) from exc

            return clean_df, engine, issues
