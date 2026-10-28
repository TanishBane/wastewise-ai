"""
WasteWise AI - Machine Learning Demand Forecasting Engine
Trains a scikit-learn Random Forest Regressor and benchmarks against a
chronological weekday-average baseline. Evaluates on a strict time-based holdout.
Computes MAE, WAPE, RMSE, and defensible prediction intervals.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder

from src.config import MENU_ITEM_NAMES, WEATHER_TYPES


@dataclass
class EvaluationMetrics:
    mae: float
    wape: float  # Percentage
    rmse: float
    r2: float
    sample_size: int


@dataclass
class ForecastResult:
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    confidence_level: float  # e.g., 0.80 (80% interval)
    model_name: str
    feature_contributions: Dict[str, float]


class WeekdayAverageBaseline:
    """
    Transparent reference baseline: Predicts demand based on historical
    average demand for the same (menu_item, day_of_week) combination.
    """
    def __init__(self):
        self.averages: Dict[Tuple[str, str], float] = {}
        self.item_fallback: Dict[str, float] = {}
        self.global_average: float = 50.0

    def fit(self, train_df: pd.DataFrame) -> "WeekdayAverageBaseline":
        # Group by (menu_item, day_of_week)
        grouped = train_df.groupby(["menu_item", "day_of_week"])["portions_sold"].mean()
        self.averages = grouped.to_dict()
        
        # Item fallback if a weekday wasn't seen
        self.item_fallback = train_df.groupby("menu_item")["portions_sold"].mean().to_dict()
        self.global_average = float(train_df["portions_sold"].mean())
        return self

    def predict(self, test_df: pd.DataFrame) -> np.ndarray:
        preds = []
        for _, row in test_df.iterrows():
            key = (row["menu_item"], row["day_of_week"])
            if key in self.averages:
                preds.append(self.averages[key])
            elif row["menu_item"] in self.item_fallback:
                preds.append(self.item_fallback[row["menu_item"]])
            else:
                preds.append(self.global_average)
        return np.array(preds)


class DemandForecastingEngine:
    """
    Production-grade demand forecasting engine for college canteens.
    Uses Random Forest Regression with one-hot encoded categorical drivers
    and calculates empirical ensemble uncertainty intervals.
    """
    def __init__(self, n_estimators: int = 100, random_state: int = 42):
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=self.random_state,
        )
        self.encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.categorical_cols = ["menu_item", "day_of_week", "weather"]
        self.numeric_cols = ["attendance_index", "campus_event", "temperature_c"]
        self.feature_names: List[str] = []
        self.is_trained: bool = False
        self.baseline = WeekdayAverageBaseline()
        
        # Stored evaluation results
        self.known_menu_items: set = set()
        self.train_split_date: Optional[str] = None
        self.ml_metrics: Optional[EvaluationMetrics] = None
        self.baseline_metrics: Optional[EvaluationMetrics] = None
        self.item_level_metrics: Dict[str, Dict[str, float]] = {}
        self.test_records_df: Optional[pd.DataFrame] = None

    def _prepare_features(self, df: pd.DataFrame, is_train: bool = False) -> np.ndarray:
        # Ensure all required categories exist
        cats_df = df[self.categorical_cols].astype(str)
        if is_train:
            encoded_cats = self.encoder.fit_transform(cats_df)
            cat_feature_names = list(self.encoder.get_feature_names_out(self.categorical_cols))
            self.feature_names = cat_feature_names + self.numeric_cols
        else:
            encoded_cats = self.encoder.transform(cats_df)
            
        nums = df[self.numeric_cols].fillna(0).values
        return np.hstack([encoded_cats, nums])

    def train_and_evaluate(
        self,
        df: pd.DataFrame,
        holdout_days: int = 35,
    ) -> Dict[str, Any]:
        """
        Splits data chronologically (time-based holdout), trains both ML and Baseline,
        and computes MAE, WAPE, RMSE, and per-item metrics.
        """
        if df is None or df.empty:
            raise ValueError("Cannot train on an empty dataset.")

        sorted_df = df.sort_values("date").reset_index(drop=True)
        unique_dates = sorted_df["date"].unique()
        
        if len(unique_dates) < 2:
            raise ValueError("Insufficient data: at least 2 unique dates are required to split into train and test sets.")

        if len(unique_dates) <= holdout_days + 7:
            # Fallback for small datasets: 80% train, 20% test split
            split_idx = int(len(unique_dates) * 0.8)
            split_date = unique_dates[split_idx]
        else:
            split_date = unique_dates[-holdout_days]
            
        self.known_menu_items = set(sorted_df["menu_item"].unique())
        self.train_split_date = str(split_date)
        train_df = sorted_df[sorted_df["date"] < split_date].copy()
        test_df = sorted_df[sorted_df["date"] >= split_date].copy()
        
        # Fit baseline
        self.baseline.fit(train_df)
        baseline_preds = self.baseline.predict(test_df)
        
        # Fit Random Forest
        X_train = self._prepare_features(train_df, is_train=True)
        y_train = train_df["portions_sold"].values
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        X_test = self._prepare_features(test_df, is_train=False)
        y_test = test_df["portions_sold"].values
        ml_preds = self.model.predict(X_test)
        
        # Compute global evaluation metrics
        self.ml_metrics = self._calculate_metrics(y_test, ml_preds)
        self.baseline_metrics = self._calculate_metrics(y_test, baseline_preds)
        
        # Compute item-level comparison
        tree_predictions = np.array([tree.predict(X_test) for tree in self.model.estimators_])
        test_df["lower_bound"] = np.maximum(0.0, np.percentile(tree_predictions, 10, axis=0))
        test_df["upper_bound"] = np.maximum(0.0, np.percentile(tree_predictions, 90, axis=0))
        test_df["ml_pred"] = np.maximum(0.0, ml_preds)
        test_df["baseline_pred"] = np.maximum(0.0, baseline_preds)
        self.test_records_df = test_df
        
        self.item_level_metrics = {}
        for item in sorted_df["menu_item"].unique():
            item_sub = test_df[test_df["menu_item"] == item]
            if len(item_sub) > 0:
                y_i = item_sub["portions_sold"].values
                ml_i = item_sub["ml_pred"].values
                base_i = item_sub["baseline_pred"].values
                self.item_level_metrics[item] = {
                    "ml_mae": round(float(mean_absolute_error(y_i, ml_i)), 2),
                    "ml_wape": round(float(np.sum(np.abs(y_i - ml_i)) / max(1e-5, np.sum(y_i)) * 100), 2),
                    "base_mae": round(float(mean_absolute_error(y_i, base_i)), 2),
                    "base_wape": round(float(np.sum(np.abs(y_i - base_i)) / max(1e-5, np.sum(y_i)) * 100), 2),
                    "sample_count": len(item_sub),
                }

        return {
            "split_date": self.train_split_date,
            "train_rows": len(train_df),
            "test_rows": len(test_df),
            "ml_metrics": self.ml_metrics,
            "baseline_metrics": self.baseline_metrics,
            "item_metrics": self.item_level_metrics,
        }

    @staticmethod
    def _calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> EvaluationMetrics:
        mae = float(mean_absolute_error(y_true, y_pred))
        total_observed = float(np.sum(y_true))
        total_abs_err = float(np.sum(np.abs(y_true - y_pred)))
        wape = (total_abs_err / total_observed * 100.0) if total_observed > 0 else 0.0
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred))
        
        return EvaluationMetrics(
            mae=round(mae, 2),
            wape=round(wape, 2),
            rmse=round(rmse, 2),
            r2=round(r2, 3),
            sample_size=len(y_true),
        )

    def predict_scenario(
        self,
        menu_item: str,
        day_of_week: str,
        attendance_index: float,
        campus_event: int,
        weather: str,
        temperature_c: float = 28.0,
        confidence_level: float = 0.80,
    ) -> ForecastResult:
        """
        Generates point forecast and empirical 80% uncertainty bounds
        using the distribution of predictions across ensemble decision trees.
        """
        if not self.is_trained:
            raise RuntimeError("Demand forecasting engine must be trained before predicting.")

        scenario_df = pd.DataFrame([{
            "menu_item": menu_item,
            "day_of_week": day_of_week,
            "weather": weather,
            "attendance_index": attendance_index,
            "campus_event": campus_event,
            "temperature_c": temperature_c,
        }])
        
        X_scen = self._prepare_features(scenario_df, is_train=False)
        
        # Gather predictions from every tree in the Random Forest ensemble
        tree_preds = np.array([tree.predict(X_scen)[0] for tree in self.model.estimators_])
        point_prediction = float(np.mean(tree_preds))
        
        # Uncertainty intervals (e.g. 10th and 90th percentile for 80% coverage)
        alpha = (1.0 - confidence_level) / 2.0
        lower_pct = alpha * 100
        upper_pct = (1.0 - alpha) * 100
        
        lower_bound = float(np.percentile(tree_preds, lower_pct))
        upper_bound = float(np.percentile(tree_preds, upper_pct))
        
        # Feature importance summary for explainability
        feature_importances = dict(zip(self.feature_names, self.model.feature_importances_))
        
        # Aggregate feature contributions for display
        contributions = {
            "Attendance Footfall": round(float(feature_importances.get("attendance_index", 0.0) * 100), 1),
            "Campus Event": round(float(feature_importances.get("campus_event", 0.0) * 100), 1),
            "Dish Baseline": round(float(sum(v for k, v in feature_importances.items() if "menu_item" in k) * 100), 1),
            "Day of Week": round(float(sum(v for k, v in feature_importances.items() if "day_of_week" in k) * 100), 1),
            "Weather / Temp": round(float((feature_importances.get("temperature_c", 0.0) + sum(v for k, v in feature_importances.items() if "weather" in k)) * 100), 1),
        }
        
        return ForecastResult(
            predicted_demand=round(point_prediction, 1),
            lower_bound=max(0.0, round(lower_bound, 1)),
            upper_bound=round(upper_bound, 1),
            confidence_level=confidence_level,
            model_name="Random Forest Regressor (Ensemble Quantile)",
            feature_contributions=contributions,
        )

    def save(self, filepath: Any) -> None:
        """
        Serializes the trained Random Forest ensemble, OneHotEncoder,
        and evaluation metrics to disk with level-3 compression.
        """
        import joblib
        payload = {
            "model": self.model,
            "encoder": self.encoder,
            "feature_names": self.feature_names,
            "is_trained": self.is_trained,
            "baseline": self.baseline,
            "known_menu_items": getattr(self, "known_menu_items", set()),
            "train_split_date": self.train_split_date,
            "ml_metrics": self.ml_metrics,
            "baseline_metrics": self.baseline_metrics,
            "item_level_metrics": self.item_level_metrics,
            "test_records_df": self.test_records_df,
            "n_estimators": self.n_estimators,
            "random_state": self.random_state,
        }
        joblib.dump(payload, filepath, compress=3)

    @classmethod
    def load(cls, filepath: Any) -> "DemandForecastingEngine":
        """
        Loads a serialized forecasting engine artifact from disk.
        """
        import joblib
        payload = joblib.load(filepath)
        engine = cls(
            n_estimators=payload.get("n_estimators", 100),
            random_state=payload.get("random_state", 42),
        )
        engine.model = payload["model"]
        engine.encoder = payload["encoder"]
        engine.feature_names = payload["feature_names"]
        engine.is_trained = payload["is_trained"]
        engine.baseline = payload["baseline"]
        engine.known_menu_items = payload.get("known_menu_items", set())
        engine.train_split_date = payload["train_split_date"]
        engine.ml_metrics = payload["ml_metrics"]
        engine.baseline_metrics = payload["baseline_metrics"]
        engine.item_level_metrics = payload["item_level_metrics"]
        engine.test_records_df = payload["test_records_df"]
        return engine

