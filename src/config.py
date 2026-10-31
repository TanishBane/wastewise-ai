"""
WasteWise AI - Configuration and Domain Constants
ADAPPT 5.0: AI in FoodTech | Problem Statement: Food Waste from Demand Uncertainty
"""

from dataclasses import dataclass
from typing import Dict, List

# Product Branding
APP_NAME = "WasteWise AI"
TAGLINE = "Predict smarter. Prepare better. Waste less."
VERSION = "1.0-prototype"
EVENT_NAME = "ADAPPT 5.0 — AI in FoodTech"

# Default Demo Canteen Settings
CANTEEN_NAME = "Campus Green Demo Canteen"
TARGET_PERIOD = "Lunch & All-Day Service"

# Color Palette - Botanical Editorial Design System (ADAPPT 5.0)
# 60% Structural Ground & Canvas  |  30% Secondary Surfaces & Framing  |  10% Intentional Accents
THEME_COLORS = {
    # 60% Structural Ground & Canvas
    "page_bg": "#F8F1E5",           # Ground — Warm Cream Canvas
    "card_bg": "#FFFFFF",           # Surface Card — Pure White

    # 30% Secondary Surfaces & Framing
    "text_primary": "#181D19",      # Ink — Primary Text on light surface
    "text_secondary": "#667168",    # Muted — Secondary text, captions
    "border": "#E3DCCF",            # Border Subtle — 60% distribution border
    "border_subtle": "#E8E4DC",     # Border Extra Subtle — divider lines

    # 10% Intentional Accents
    "brand_primary": "#1B4D3E",     # Forest Primary — primary actions, nav accents
    "brand_muted": "#EEF1F5",       # Sage Muted — secondary backgrounds, pills inactive
    "warning_text": "#D97736",      # Terracotta Warning — warnings, alerts
    "warning_bg": "#FDF8EE",        # Terracotta Surface — warning cards
    "warning_border": "#EFE2C5",    # Terracotta Border — warning borders
    "danger_text": "#C25438",       # Copper Critical — error states
    "danger_bg": "#FDF2F2",         # Copper Surface — error cards
    "danger_border": "#F4CECE",     # Copper Border — error borders
    "success_text": "#3C674C",      # Sage Success — positive actions
    "success_bg": "#EEF6F0",        # Sage Surface — success cards
    "success_border": "#C6E7D2",    # Sage Border — success borders
}

@dataclass(frozen=True)
class MenuItemConfig:
    name: str
    category: str
    cost_per_portion: float    # ₹ Ingredient cost
    selling_price: float       # ₹ Retail price
    prep_batch_size: int       # Min practical cooking batch
    shelf_life_hours: float    # Service hold window
    carbon_kg_per_portion: float # Synthetic reference for simulation
    base_demand: int           # Baseline average daily demand

# Standard 8-item Canteen Menu covering breakfast, meals, snacks, beverages
MENU_ITEMS: Dict[str, MenuItemConfig] = {
    "Pav Bhaji": MenuItemConfig(
        name="Pav Bhaji",
        category="Lunch / Snack",
        cost_per_portion=35.0,
        selling_price=75.0,
        prep_batch_size=15,
        shelf_life_hours=4.0,
        carbon_kg_per_portion=0.38,
        base_demand=72,
    ),
    "Idli Sambar": MenuItemConfig(
        name="Idli Sambar",
        category="Breakfast / Light",
        cost_per_portion=22.0,
        selling_price=50.0,
        prep_batch_size=20,
        shelf_life_hours=5.0,
        carbon_kg_per_portion=0.24,
        base_demand=64,
    ),
    "Veg Thali": MenuItemConfig(
        name="Veg Thali",
        category="Lunch Meals",
        cost_per_portion=65.0,
        selling_price=130.0,
        prep_batch_size=20,
        shelf_life_hours=3.5,
        carbon_kg_per_portion=0.68,
        base_demand=95,
    ),
    "Veg Grilled Sandwich": MenuItemConfig(
        name="Veg Grilled Sandwich",
        category="Snack",
        cost_per_portion=28.0,
        selling_price=60.0,
        prep_batch_size=10,
        shelf_life_hours=2.5,
        carbon_kg_per_portion=0.26,
        base_demand=52,
    ),
    "Rajma Rice Bowl": MenuItemConfig(
        name="Rajma Rice Bowl",
        category="Lunch Meals",
        cost_per_portion=45.0,
        selling_price=95.0,
        prep_batch_size=15,
        shelf_life_hours=4.0,
        carbon_kg_per_portion=0.42,
        base_demand=68,
    ),
    "Poha": MenuItemConfig(
        name="Poha",
        category="Breakfast / Light",
        cost_per_portion=18.0,
        selling_price=40.0,
        prep_batch_size=20,
        shelf_life_hours=3.0,
        carbon_kg_per_portion=0.20,
        base_demand=58,
    ),
    "Masala Dosa": MenuItemConfig(
        name="Masala Dosa",
        category="All-Day",
        cost_per_portion=32.0,
        selling_price=70.0,
        prep_batch_size=15,
        shelf_life_hours=2.0,
        carbon_kg_per_portion=0.30,
        base_demand=62,
    ),
    "Fresh Fruit Juice": MenuItemConfig(
        name="Fresh Fruit Juice",
        category="Beverage",
        cost_per_portion=30.0,
        selling_price=65.0,
        prep_batch_size=10,
        shelf_life_hours=2.0,
        carbon_kg_per_portion=0.15,
        base_demand=48,
    ),
}

MENU_ITEM_NAMES: List[str] = list(MENU_ITEMS.keys())

WEATHER_TYPES = ["Sunny / Mild", "Hot / Humid", "Rainy / Low Footfall"]

# Required Schema for Historical Data
REQUIRED_COLUMNS = [
    "date",
    "menu_item",
    "portions_sold",
    "day_of_week",
    "attendance_index",
    "campus_event",
    "weather",
    "cost_per_portion",
    "selling_price",
]

OPTIONAL_COLUMNS = [
    "portions_prepared",
    "food_discarded",
    "stockout_flag",
    "temperature_c",
    "promotion_flag",
]

# Carbon emission factor (UNEP 2024 / Food Waste Index baseline proxy: ~2.5 kg CO2e per kg food waste, approx 0.35 - 0.7 kg per canteen meal portion)
CARBON_FACTOR_NOTE = "Estimated based on UNEP/FAO food waste life-cycle emission factors (~2.5 kg CO2e/kg discarded food). Used strictly for illustrative simulation."

# Strict Provenance & Pilot Boundaries
DATA_PROVENANCE_SYNTHETIC = "🧪 Demonstration Dataset (Synthetic 180 Days — ADAPPT 5.0 Prototype)"
DATA_PROVENANCE_UPLOADED = "📁 Custom Canteen Dataset (Uploaded by Operator)"

DISCLAIMER_TEXT = (
    "⚠️ Operational Decision Support Prototype: WasteWise AI forecasts demand and suggests "
    "cost-aware preparation batches. It does not provide food-safety certifications or guaranteed sales outcomes. "
    "All impact figures are simulated scenarios unless verified via an active pilot trial."
)