"""
ML Delay Predictor — Scikit-Learn Random Forest.
Trains on synthetic logistics data, exposes prediction + feature importances.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os
import json

MODEL_PATH = os.path.join(os.path.dirname(__file__), "delay_predictor.joblib")


def _generate_training_data(n_samples=2000):
    """Generates realistic synthetic logistics delay data."""
    np.random.seed(42)

    traffic_index = np.random.uniform(0.05, 1.0, n_samples)
    weather_severity = np.random.uniform(0.0, 1.0, n_samples)
    carrier_reliability = np.random.uniform(0.3, 1.0, n_samples)
    distance_km = np.random.uniform(50, 2000, n_samples)
    hour_of_day = np.random.randint(0, 24, n_samples)
    is_weekend = np.random.randint(0, 2, n_samples)

    # Realistic delay function
    delay_hours = (
        (traffic_index * 4)
        + (weather_severity * 6)
        + ((1.0 - carrier_reliability) * 10)
        + (distance_km * 0.002)
        + (np.where((hour_of_day >= 7) & (hour_of_day <= 10), 1.5, 0))  # rush hour
        + (np.where(is_weekend == 1, -0.5, 0))  # weekends are better
        + np.random.normal(0, 0.8, n_samples)
    )
    delay_hours = np.maximum(0, delay_hours)

    return pd.DataFrame({
        "traffic_index": traffic_index,
        "weather_severity": weather_severity,
        "carrier_reliability": carrier_reliability,
        "distance_km": distance_km,
        "hour_of_day": hour_of_day,
        "is_weekend": is_weekend,
        "delay_hours": delay_hours,
    })


def _train_model():
    print("🧠 Training ML Delay Predictor...")
    df = _generate_training_data()
    features = ["traffic_index", "weather_severity", "carrier_reliability", "distance_km", "hour_of_day", "is_weekend"]
    X = df[features]
    y = df["delay_hours"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print(f"✅ Model trained — R² = {score:.4f}")

    # Feature importances
    importances = dict(zip(features, model.feature_importances_))
    print(f"📊 Feature importances: {json.dumps({k: round(v, 3) for k, v in importances.items()})}")

    joblib.dump(model, MODEL_PATH)
    return model, importances


def load_or_train_model():
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        features = ["traffic_index", "weather_severity", "carrier_reliability", "distance_km", "hour_of_day", "is_weekend"]
        importances = dict(zip(features, model.feature_importances_))
        return model, importances
    return _train_model()


# Globals
delay_model, feature_importances = load_or_train_model()


def predict_delay(
    traffic: float,
    weather: float,
    reliability: float,
    distance_km: float,
    hour_of_day: int = 12,
    is_weekend: int = 0,
) -> dict:
    """
    Predicts delay and returns full prediction context.
    Returns dict with prediction, confidence, risk_level, and feature contributions.
    """
    features = pd.DataFrame([{
        "traffic_index": traffic,
        "weather_severity": weather,
        "carrier_reliability": reliability,
        "distance_km": distance_km,
        "hour_of_day": hour_of_day,
        "is_weekend": is_weekend,
    }])

    # Get predictions from all trees for confidence
    tree_predictions = np.array([tree.predict(features)[0] for tree in delay_model.estimators_])
    prediction = float(np.mean(tree_predictions))
    std_dev = float(np.std(tree_predictions))
    prediction = max(0, prediction)

    # Confidence: lower std = higher confidence
    confidence = max(0.0, min(1.0, 1.0 - (std_dev / (prediction + 1e-6))))

    # Risk level
    if prediction > 6:
        risk_level = "CRITICAL"
    elif prediction > 3:
        risk_level = "HIGH"
    elif prediction > 1.5:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "predicted_delay_hours": round(prediction, 2),
        "confidence": round(confidence, 3),
        "risk_level": risk_level,
        "std_deviation": round(std_dev, 3),
        "feature_importances": {k: round(v, 4) for k, v in feature_importances.items()},
        "input_features": {
            "traffic_index": traffic,
            "weather_severity": weather,
            "carrier_reliability": reliability,
            "distance_km": distance_km,
        },
    }


if __name__ == "__main__":
    print("\n--- Test: Bad conditions ---")
    r = predict_delay(traffic=0.9, weather=0.85, reliability=0.3, distance_km=500)
    print(json.dumps(r, indent=2))

    print("\n--- Test: Good conditions ---")
    r = predict_delay(traffic=0.1, weather=0.0, reliability=0.95, distance_km=200)
    print(json.dumps(r, indent=2))
