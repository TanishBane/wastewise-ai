"""
Unit tests for forecasting model training, baseline, evaluation, and scenario predictions.
"""

import pandas as pd
import pytest
from src.data import generate_synthetic_canteen_data
from src.model import DemandForecastingEngine, WeekdayAverageBaseline


@pytest.fixture(scope="module")
def sample_dataset():
    return generate_synthetic_canteen_data(num_days=45, random_seed=42)


def test_baseline_fit_and_predict(sample_dataset):
    baseline = WeekdayAverageBaseline()
    train_df = sample_dataset[sample_dataset["date"] < "2026-05-01"]
    test_df = sample_dataset[sample_dataset["date"] >= "2026-05-01"]
    
    baseline.fit(train_df)
    preds = baseline.predict(test_df)
    
    assert len(preds) == len(test_df)
    assert (preds > 0).all()


def test_model_training_and_holdout_metrics(sample_dataset):
    engine = DemandForecastingEngine(n_estimators=30, random_state=42)
    results = engine.train_and_evaluate(sample_dataset, holdout_days=10)
    
    assert engine.is_trained is True
    assert results["split_date"] is not None
    assert results["train_rows"] > 0
    assert results["test_rows"] > 0
    
    ml_m = results["ml_metrics"]
    base_m = results["baseline_metrics"]
    
    assert ml_m.mae >= 0.0
    assert ml_m.wape >= 0.0
    assert base_m.mae >= 0.0
    assert base_m.wape >= 0.0


def test_predict_scenario_uncertainty_interval(sample_dataset):
    engine = DemandForecastingEngine(n_estimators=30, random_state=42)
    engine.train_and_evaluate(sample_dataset, holdout_days=10)
    
    res = engine.predict_scenario(
        menu_item="Pav Bhaji",
        day_of_week="Monday",
        attendance_index=1.0,
        campus_event=0,
        weather="Sunny / Mild",
        temperature_c=28.0,
    )
    
    assert res.predicted_demand > 0
    # Plausible uncertainty interval: lower <= upper
    assert res.lower_bound <= res.upper_bound
    # Ensure point estimate is within or near the interval
    assert res.lower_bound <= res.predicted_demand <= res.upper_bound or abs(res.predicted_demand - res.lower_bound) < 5
    assert len(res.feature_contributions) > 0
from src.model import DemandForecastingEngine

def test_empty_dataset():
    engine = DemandForecastingEngine()
    df = pd.DataFrame(columns=["date", "menu_item", "day_of_week", "weather", "attendance_index", "campus_event", "temperature_c", "portions_sold"])
    with pytest.raises(ValueError):
        engine.train_and_evaluate(df)

def test_single_row_dataset():
    engine = DemandForecastingEngine()
    df = pd.DataFrame([{
        "date": "2026-05-01",
        "menu_item": "Pav Bhaji",
        "day_of_week": "Monday",
        "weather": "Sunny",
        "attendance_index": 1.0,
        "campus_event": 0,
        "temperature_c": 28.0,
        "portions_sold": 50.0
    }])
    with pytest.raises(ValueError):
        engine.train_and_evaluate(df)
