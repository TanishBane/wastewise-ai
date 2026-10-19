"""
Unit tests for data generation, schema validation, and CSV handling.
"""

import pandas as pd
import pytest
from src.data import generate_synthetic_canteen_data, validate_dataset
from src.config import MENU_ITEM_NAMES, REQUIRED_COLUMNS


def test_synthetic_data_generation():
    df = generate_synthetic_canteen_data(num_days=20, random_seed=42)
    assert not df.empty
    assert len(df) == 20 * len(MENU_ITEM_NAMES)
    
    # Check all required columns exist
    for col in REQUIRED_COLUMNS:
        assert col in df.columns
        
    # Check that quantities are non-negative
    assert (df["portions_sold"] >= 0).all()
    assert (df["cost_per_portion"] > 0).all()
    assert (df["selling_price"] > 0).all()
    assert set(df["menu_item"].unique()) == set(MENU_ITEM_NAMES)


def test_validate_dataset_valid():
    df = generate_synthetic_canteen_data(num_days=20, random_seed=42)
    is_valid, issues, cleaned = validate_dataset(df)
    assert is_valid is True
    assert len(issues) == 0
    assert not cleaned.empty


def test_validate_dataset_empty():
    is_valid, issues, _ = validate_dataset(pd.DataFrame())
    assert is_valid is False
    assert any("empty" in i.lower() for i in issues)


def test_validate_dataset_missing_column():
    df = generate_synthetic_canteen_data(num_days=20, random_seed=42)
    df_dropped = df.drop(columns=["portions_sold"])
    is_valid, issues, _ = validate_dataset(df_dropped)
    assert is_valid is False
    assert any("portions_sold" in i for i in issues)


def test_validate_dataset_negative_values():
    df = generate_synthetic_canteen_data(num_days=20, random_seed=42)
    df.loc[0, "portions_sold"] = -10
    is_valid, issues, _ = validate_dataset(df)
    assert is_valid is False
    assert any("negative" in i.lower() for i in issues)


def test_validate_dataset_too_short():
    df = generate_synthetic_canteen_data(num_days=5, random_seed=42)
    is_valid, issues, _ = validate_dataset(df)
    assert is_valid is False
    assert any("at least 14 days" in i.lower() for i in issues)
