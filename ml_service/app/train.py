"""
Offline Training Pipeline for Supply Chain ML Models
- Trains RandomForestRegressor for demand forecasting
- Trains RandomForestClassifier for shipment delay-risk prediction
- Serializes models using joblib to saved_models/
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, roc_auc_score

def train_models():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    models_dir = os.path.join(base_dir, 'saved_models')
    os.makedirs(models_dir, exist_ok=True)

    # 1. Check/Generate datasets
    demand_csv = os.path.join(data_dir, 'demand_forecasting_data.csv')
    shipment_csv = os.path.join(data_dir, 'shipment_delay_data.csv')

    if not os.path.exists(demand_csv) or not os.path.exists(shipment_csv):
        import sys
        sys.path.append(base_dir)
        from data.generate_dataset import generate_datasets
        generate_datasets()

    print("=========================================================")
    print("1. TRAINING DEMAND FORECASTING MODEL (RandomForestRegressor)")
    print("=========================================================")
    df_demand = pd.read_csv(demand_csv)
    X_demand = df_demand[['product_category', 'unit_price', 'unit_cost', 'historical_avg_sales', 'lead_time_days', 'quarter']]
    y_demand = df_demand['actual_demand']

    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_demand, y_demand, test_size=0.2, random_state=42)

    cat_cols_d = ['product_category', 'quarter']
    num_cols_d = ['unit_price', 'unit_cost', 'historical_avg_sales', 'lead_time_days']

    preprocessor_d = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols_d),
            ('num', 'passthrough', num_cols_d)
        ]
    )

    demand_pipeline = Pipeline([
        ('preprocessor', preprocessor_d),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42))
    ])

    demand_pipeline.fit(X_train_d, y_train_d)
    y_pred_d = demand_pipeline.predict(X_test_d)

    mae_d = mean_absolute_error(y_test_d, y_pred_d)
    rmse_d = np.sqrt(mean_squared_error(y_test_d, y_pred_d))
    r2_d = r2_score(y_test_d, y_pred_d)

    print(f"Demand Model Evaluation:")
    print(f"  - Mean Absolute Error (MAE): {mae_d:.2f} units")
    print(f"  - Root Mean Squared Error (RMSE): {rmse_d:.2f} units")
    print(f"  - R² Score: {r2_d:.3f}")

    demand_model_path = os.path.join(models_dir, 'demand_forecaster.joblib')
    joblib.dump(demand_pipeline, demand_model_path)
    print(f"  ✓ Saved model artifact to: {demand_model_path}")

    print("\n=========================================================")
    print("2. TRAINING SHIPMENT DELAY-RISK MODEL (RandomForestClassifier)")
    print("=========================================================")
    df_shipment = pd.read_csv(shipment_csv)
    X_shipment = df_shipment[['carrier_name', 'distance_km', 'transit_days_expected', 'traffic_congestion', 'weather_impact_score', 'order_priority']]
    y_shipment = df_shipment['is_delayed']

    X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(X_shipment, y_shipment, test_size=0.2, random_state=42, stratify=y_shipment)

    cat_cols_s = ['carrier_name', 'traffic_congestion', 'order_priority']
    num_cols_s = ['distance_km', 'transit_days_expected', 'weather_impact_score']

    preprocessor_s = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols_s),
            ('num', 'passthrough', num_cols_s)
        ]
    )

    shipment_pipeline = Pipeline([
        ('preprocessor', preprocessor_s),
        ('classifier', RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42, class_weight='balanced'))
    ])

    shipment_pipeline.fit(X_train_s, y_train_s)
    y_pred_s = shipment_pipeline.predict(X_test_s)
    y_prob_s = shipment_pipeline.predict_proba(X_test_s)[:, 1]

    acc_s = accuracy_score(y_test_s, y_pred_s)
    auc_s = roc_auc_score(y_test_s, y_prob_s)

    print(f"Shipment Delay Risk Evaluation:")
    print(f"  - Accuracy: {acc_s * 100:.2f}%")
    print(f"  - ROC-AUC Score: {auc_s:.3f}")

    shipment_model_path = os.path.join(models_dir, 'shipment_delay_risk.joblib')
    joblib.dump(shipment_pipeline, shipment_model_path)
    print(f"  ✓ Saved model artifact to: {shipment_model_path}")

    # Save summary metrics
    metrics = {
        "demand_model": {
            "type": "RandomForestRegressor",
            "n_estimators": 100,
            "mae": round(mae_d, 2),
            "rmse": round(rmse_d, 2),
            "r2_score": round(r2_d, 3),
        },
        "shipment_risk_model": {
            "type": "RandomForestClassifier",
            "n_estimators": 120,
            "accuracy": round(acc_s, 3),
            "roc_auc": round(auc_s, 3),
        }
    }
    metrics_path = os.path.join(models_dir, 'model_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"  ✓ Metrics saved to: {metrics_path}")

if __name__ == '__main__':
    train_models()
