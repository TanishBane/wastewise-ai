"""
WasteWise AI - Data Management and Synthetic Generation
Generates a realistic 180-day synthetic dataset of college canteen demand
with plausible calendar, weather, attendance, and event dynamics.
Includes CSV validation and sanitization for operator uploads.
"""

import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

from src.config import (
    MENU_ITEMS,
    MENU_ITEM_NAMES,
    REQUIRED_COLUMNS,
    WEATHER_TYPES,
)

ROOT_DIR = Path(__file__).resolve().parent.parent
IS_SERVERLESS = bool(
    os.environ.get("VERCEL")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("LAMBDA_TASK_ROOT")
)
DATA_DIR = Path("/tmp/data") if IS_SERVERLESS else ROOT_DIR / "data"


def generate_synthetic_canteen_data(
    start_date: str = "2026-04-01",
    num_days: int = 180,
    random_seed: int = 42,
) -> pd.DataFrame:
    """
    Generates a reproducible 180-day synthetic dataset of college canteen demand.
    Captures weekday seasonality, semester exams, campus festivals, weather fluctuations,
    and historical overproduction habits.
    """
    np.random.seed(random_seed)
    base_date = datetime.strptime(start_date, "%Y-%m-%d")
    
    records = []
    
    # Define special campus event days (e.g. Tech Fest, Sports Meet, Hackathons)
    event_days = {
        14: "Sports Fest Kickoff",
        15: "Inter-College Tournament",
        42: "Annual Cultural Fest Day 1",
        43: "Annual Cultural Fest Day 2",
        78: "Mid-Term Hackathon ADAPPT",
        105: "Alumni Meet",
        140: "Tech Fest Spark",
        141: "Tech Fest Exhibition",
        168: "Farewell Gala",
    }
    
    for day_idx in range(num_days):
        current_date = base_date + timedelta(days=day_idx)
        date_str = current_date.strftime("%Y-%m-%d")
        weekday_name = current_date.strftime("%A")
        is_weekend = current_date.weekday() in [5, 6]  # Saturday, Sunday
        
        # Attendance baseline: Sundays have 40% footfall, Saturdays 70%, weekdays ~100%
        if current_date.weekday() == 6:  # Sunday
            base_attendance = 0.40
        elif current_date.weekday() == 5:  # Saturday
            base_attendance = 0.70
        else:
            base_attendance = 1.0
            
        # Academic cycle effects (e.g. exam weeks have high attendance in canteen, reading week lower)
        exam_boost = 0.15 if 60 <= day_idx <= 75 or 150 <= day_idx <= 165 else 0.0
        
        # Event check
        is_event = 1 if day_idx in event_days else 0
        event_multiplier = 1.35 if is_event else 1.0
        
        # Stochastic attendance fluctuation (+/- 8%)
        attendance_index = round(
            float(np.clip(base_attendance * event_multiplier + exam_boost + np.random.normal(0, 0.05), 0.35, 1.6)),
            2,
        )
        
        # Weather distribution
        weather_probs = [0.60, 0.25, 0.15]  # Sunny, Hot, Rainy
        weather = np.random.choice(WEATHER_TYPES, p=weather_probs)
        
        if weather == "Hot / Humid":
            temp_c = round(float(np.random.uniform(32.0, 39.0)), 1)
        elif weather == "Rainy / Low Footfall":
            temp_c = round(float(np.random.uniform(22.0, 27.0)), 1)
        else:
            temp_c = round(float(np.random.uniform(26.0, 31.0)), 1)
            
        # Promotion status
        has_promo = 1 if (day_idx % 14 == 0 and not is_weekend) else 0

        for item_name in MENU_ITEM_NAMES:
            cfg = MENU_ITEMS[item_name]
            base_d = cfg.base_demand
            
            # Category-specific multipliers based on day, weather, and events
            weather_mult = 1.0
            if weather == "Hot / Humid":
                if item_name == "Fresh Fruit Juice":
                    weather_mult = 1.45
                elif item_name in ["Veg Thali", "Rajma Rice Bowl"]:
                    weather_mult = 0.88
            elif weather == "Rainy / Low Footfall":
                if item_name in ["Pav Bhaji", "Poha", "Masala Dosa"]:
                    weather_mult = 1.15  # Warm comfort food in rain
                elif item_name == "Fresh Fruit Juice":
                    weather_mult = 0.65
                else:
                    weather_mult = 0.85
                    
            # Item weekday preference
            day_mult = 1.0
            if weekday_name == "Monday" and item_name in ["Poha", "Idli Sambar"]:
                day_mult = 1.18  # Strong Monday morning breakfast
            elif weekday_name == "Friday" and item_name in ["Pav Bhaji", "Veg Grilled Sandwich"]:
                day_mult = 1.22  # Friday comfort snack
            elif weekday_name in ["Wednesday", "Thursday"] and item_name in ["Veg Thali", "Rajma Rice Bowl"]:
                day_mult = 1.12
            elif is_weekend:
                day_mult = 0.55 if item_name == "Veg Thali" else 0.75

            promo_mult = 1.20 if has_promo and item_name in ["Pav Bhaji", "Veg Grilled Sandwich"] else 1.0
            
            # True underlying demand with noise
            latent_mean = base_d * attendance_index * weather_mult * day_mult * promo_mult
            actual_demand = max(5, int(np.round(np.random.normal(latent_mean, base_d * 0.10))))
            
            # Traditional canteen preparation policy:
            # Often operators use a rigid rule: average weekday prep + arbitrary 15% buffer
            historical_prep_policy = int(np.round(base_d * (1.12 if not is_weekend else 0.70)))
            
            # If prep is less than demand, stockout occurs!
            # If prep is more than demand, surplus food is discarded!
            portions_sold = min(actual_demand, historical_prep_policy)
            stockout_flag = 1 if actual_demand > historical_prep_policy else 0
            food_discarded = max(0, historical_prep_policy - portions_sold)
            
            records.append({
                "date": date_str,
                "menu_item": item_name,
                "category": cfg.category,
                "portions_sold": portions_sold,
                "latent_demand": actual_demand,  # Kept for simulator evaluation
                "portions_prepared": historical_prep_policy,
                "food_discarded": food_discarded,
                "stockout_flag": stockout_flag,
                "day_of_week": weekday_name,
                "attendance_index": attendance_index,
                "campus_event": is_event,
                "weather": weather,
                "temperature_c": temp_c,
                "promotion_flag": has_promo,
                "cost_per_portion": cfg.cost_per_portion,
                "selling_price": cfg.selling_price,
            })
            
    df = pd.DataFrame(records)
    return df


def get_demonstration_data(data_dir: str | Path = DATA_DIR) -> pd.DataFrame:
    """
    Returns the demonstration dataset. Caches to disk as CSV if not already present.
    """
    candidate_paths = [
        Path(data_dir) / "wastewise_sample_canteen_data.csv",
        ROOT_DIR / "data" / "wastewise_sample_canteen_data.csv",
        Path("/tmp/data/wastewise_sample_canteen_data.csv"),
    ]
    for csv_path in candidate_paths:
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                # Ensure date is string
                df["date"] = df["date"].astype(str)
                return df
            except Exception:
                pass

    df = generate_synthetic_canteen_data()
    try:
        cache_dir = Path("/tmp/data" if IS_SERVERLESS else data_dir)
        cache_dir.mkdir(parents=True, exist_ok=True)
        df.to_csv(cache_dir / "wastewise_sample_canteen_data.csv", index=False)
    except OSError:
        pass
    return df


def validate_dataset(df: pd.DataFrame) -> Tuple[bool, List[str], pd.DataFrame]:
    """
    Validates user-uploaded historical sales data against required schema.
    Returns: (is_valid, list_of_errors_or_warnings, sanitized_df)
    Never silently replaces bad values without clear warnings.
    """
    issues = []
    
    if df is None or df.empty:
        return False, ["Uploaded CSV is empty."], df
        
    cleaned_df = df.copy()
    cleaned_df.columns = [c.strip().lower() for c in cleaned_df.columns]

    blank_rows = int(cleaned_df.isna().all(axis=1).sum())
    if blank_rows:
        cleaned_df = cleaned_df.dropna(how="all").copy()
        issues.append(f"Ignored {blank_rows} completely blank row(s).")
    
    # Check required columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in cleaned_df.columns]
    if missing_cols:
        issues.append(f"Missing required columns: {', '.join(missing_cols)}")
        return False, issues, cleaned_df

    # Date validation
    try:
        parsed_dates = pd.to_datetime(cleaned_df["date"], errors="coerce")
        if parsed_dates.isna().any():
            count = int(parsed_dates.isna().sum())
            return False, issues + [f"Column 'date' has {count} invalid or missing date value(s)."], cleaned_df
        cleaned_df["date"] = parsed_dates.dt.strftime("%Y-%m-%d")
    except Exception as e:
        issues.append(f"Failed to parse dates in 'date' column: {str(e)}")
        return False, issues, cleaned_df
        
    if "temperature_c" not in cleaned_df.columns:
        cleaned_df["temperature_c"] = 28.0
        issues.append("Missing temperature_c defaulted to 28 degrees Celsius.")

    # Check numeric types
    numeric_cols = ["portions_sold", "attendance_index", "campus_event", "cost_per_portion", "selling_price", "temperature_c"]
    numeric_errors = []
    for col in numeric_cols:
        cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
        if (~np.isfinite(cleaned_df[col])).any():
            bad_count = int((~np.isfinite(cleaned_df[col])).sum())
            numeric_errors.append(f"Column '{col}' has {bad_count} non-numeric, missing or non-finite entries.")
            
    if numeric_errors:
        return False, issues + numeric_errors, cleaned_df

    # Range and logic checks
    if (cleaned_df["portions_sold"] < 0).any():
        issues.append("Negative values found in 'portions_sold'. Quantities must be >= 0.")
        return False, issues, cleaned_df
        
    if (cleaned_df["cost_per_portion"] <= 0).any():
        issues.append("Zero or negative values found in 'cost_per_portion'.")
        return False, issues, cleaned_df

    if (cleaned_df["selling_price"] <= 0).any():
        return False, issues + ["Zero or negative values found in 'selling_price'."], cleaned_df
    if (~cleaned_df["attendance_index"].between(0.1, 2.0)).any():
        return False, issues + ["'attendance_index' must be between 0.1 and 2.0."], cleaned_df
    if (~cleaned_df["campus_event"].isin([0, 1])).any():
        return False, issues + ["'campus_event' must be 0 or 1."], cleaned_df
    allowed_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    invalid_days = ~cleaned_df["day_of_week"].astype(str).isin(allowed_days)
    if invalid_days.any():
        return False, issues + [f"'day_of_week' has {int(invalid_days.sum())} invalid value(s)."], cleaned_df
    invalid_weather = ~cleaned_df["weather"].astype(str).isin(WEATHER_TYPES)
    if invalid_weather.any():
        return False, issues + [f"'weather' has {int(invalid_weather.sum())} unsupported value(s). Use the template labels."], cleaned_df
    expected_days = pd.to_datetime(cleaned_df["date"]).dt.day_name()
    mismatched_days = cleaned_df["day_of_week"].astype(str) != expected_days
    if mismatched_days.any():
        return False, issues + [f"'day_of_week' does not match 'date' for {int(mismatched_days.sum())} row(s)."], cleaned_df
    duplicate_rows = int(cleaned_df.duplicated().sum())
    if duplicate_rows:
        return False, issues + [f"Found {duplicate_rows} exact duplicate row(s). Remove duplicates before importing."], cleaned_df
        
    # Check minimum history size
    unique_dates = cleaned_df["date"].nunique()
    if unique_dates < 14:
        issues.append(
            f"Dataset has only {unique_dates} unique dates. At least 14 days of history "
            "are recommended for meaningful time-aware baseline or machine learning training."
        )
        return False, issues, cleaned_df
        
    return True, issues, cleaned_df


def generate_sample_csv_template() -> str:
    """
    Returns CSV text of a 14-day template suitable for operators to download.
    """
    sample_df = generate_synthetic_canteen_data(num_days=14)
    cols_to_export = [
        "date",
        "menu_item",
        "portions_sold",
        "portions_prepared",
        "food_discarded",
        "stockout_flag",
        "day_of_week",
        "attendance_index",
        "campus_event",
        "weather",
        "temperature_c",
        "cost_per_portion",
        "selling_price",
    ]
    return sample_df[cols_to_export].to_csv(index=False)
