"""
WasteWise AI - Ingestion Service
Handles resilient CSV parsing (BOM/UTF-8-SIG), strict schema validation,
concurrency locking, async thread-pool model training, and database upload tracking.
"""

import asyncio
import hashlib
import io
import json
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException
import pandas as pd
from backend.database import get_db_context
from backend.models import MenuItemModel, UploadHistoryModel
from src.data import DATA_DIR, validate_dataset
from src.model import DemandForecastingEngine


class IngestionService:
    MAX_UPLOAD_BYTES = 10 * 1024 * 1024

    def __init__(self):
        self._lock = asyncio.Lock()

    async def process_and_train_csv(
        self,
        file_bytes: bytes,
        filename: str,
    ) -> Tuple[pd.DataFrame, DemandForecastingEngine, List[str]]:
        """
        Processes uploaded CSV bytes under a concurrency lock:
        - Validates format and BOM encoding
        - Verifies required schema and positive values
        - Asynchronously trains Random Forest model in a background thread
        - Records file hash and upload audit history in SQLite
        - Synchronizes newly discovered menu items into SQLite catalog
        """
        async with self._lock:
            if not file_bytes:
                raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")
            if len(file_bytes) > self.MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="CSV files must be 10 MB or smaller.")
            if not filename.lower().endswith(".csv"):
                raise HTTPException(status_code=415, detail="Only .csv uploads are supported.")
            # 1. Parse CSV with BOM protection
            try:
                # pandas read_csv handles bytes directly and autodetects utf-8 / utf-8-sig
                df = pd.read_csv(io.BytesIO(file_bytes), encoding_errors="replace")
                # Strip leading/trailing whitespaces from column headers
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
                # Run the CPU-bound training in a worker thread to keep the event loop non-blocking
                await asyncio.to_thread(engine.train_and_evaluate, clean_df, holdout_days)
            except Exception as exc:
                raise HTTPException(
                    status_code=422,
                    detail=f"Cannot train forecasting model on this dataset: {exc}",
                ) from exc

            # 5. Persist Upload Record & Sync Menu Catalog in SQLite
            try:
                with get_db_context() as db:
                    # Mark prior uploads as inactive
                    db.query(UploadHistoryModel).filter(UploadHistoryModel.is_active == True).update(
                        {"is_active": False}
                    )

                    upload_record = UploadHistoryModel(
                        filename=filename,
                        checksum=sha256,
                        row_count=len(clean_df),
                        service_days=int(clean_df["date"].nunique()),
                        validation_warnings_json=json.dumps(issues),
                        source="operator",
                        is_active=True,
                    )
                    db.add(upload_record)

                    # Discover any new menu items in the uploaded dataset
                    unique_items = clean_df["menu_item"].unique()
                    existing_names = {m.name for m in db.query(MenuItemModel.name).all()}
                    for item_name in unique_items:
                        if item_name not in existing_names:
                            new_item = MenuItemModel(
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
                # Persist the validated active source only after its audit record
                # is committed, allowing restart recovery without a partial import.
                clean_df.to_csv(DATA_DIR / "active_operator_dataset.csv", index=False)
            except Exception as exc:
                raise HTTPException(
                    status_code=503,
                    detail="The upload was validated but could not be saved. No active dataset was changed.",
                ) from exc

            return clean_df, engine, issues
