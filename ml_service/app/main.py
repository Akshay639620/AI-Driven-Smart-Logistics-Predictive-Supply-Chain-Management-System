"""
FastAPI Microservice for Demand Forecasting and Delay Risk Prediction
Stateless inference service serving pre-trained Scikit-learn pipelines.
"""

import os
import json
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .schemas import (
    DemandPredictionRequest,
    DemandPredictionResponse,
    DelayRiskRequest,
    DelayRiskResponse,
)

models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load serialized ML models once on startup
    base_dir = os.path.dirname(os.path.dirname(__file__))
    models_dir = os.path.join(base_dir, 'saved_models')

    demand_path = os.path.join(models_dir, 'demand_forecaster.joblib')
    risk_path = os.path.join(models_dir, 'shipment_delay_risk.joblib')

    # If models don't exist yet, trigger training automatically
    if not os.path.exists(demand_path) or not os.path.exists(risk_path):
        print("Model artifacts not found. Initiating offline training...")
        from .train import train_models
        train_models()

    models['demand'] = joblib.load(demand_path)
    models['risk'] = joblib.load(risk_path)

    metrics_path = os.path.join(models_dir, 'model_metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            models['metrics'] = json.load(f)

    print("✓ Scikit-learn models successfully loaded into memory.")
    yield
    models.clear()

app = FastAPI(
    title="Smart Logistics AI/ML Predictive Microservice",
    description="Offline-trained Scikit-learn models for Demand Forecasting (RandomForestRegressor) and Delay Risk Scoring (RandomForestClassifier)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "demand_forecaster": "demand" in models,
            "shipment_delay_risk": "risk" in models,
        },
        "metrics": models.get("metrics", {}),
    }

@app.post("/predict/demand", response_model=DemandPredictionResponse)
def predict_demand(req: DemandPredictionRequest):
    if "demand" not in models:
        raise HTTPException(status_code=503, detail="Demand forecasting model not loaded")

    df_input = pd.DataFrame([{
        "product_category": req.product_category,
        "unit_price": req.unit_price,
        "unit_cost": req.unit_cost,
        "historical_avg_sales": req.historical_avg_sales,
        "lead_time_days": req.lead_time_days,
        "quarter": req.quarter or "Q4",
    }])

    pred_val = float(models["demand"].predict(df_input)[0])
    predicted_demand = max(5, int(round(pred_val)))
    suggested_reorder = int(round(predicted_demand * 1.25))

    return DemandPredictionResponse(
        product_category=req.product_category,
        predicted_demand=predicted_demand,
        confidence_score=0.88,
        suggested_reorder_qty=suggested_reorder,
    )

@app.post("/predict/delay-risk", response_model=DelayRiskResponse)
def predict_delay_risk(req: DelayRiskRequest):
    if "risk" not in models:
        raise HTTPException(status_code=503, detail="Delay risk model not loaded")

    df_input = pd.DataFrame([{
        "carrier_name": req.carrier_name,
        "distance_km": req.distance_km,
        "transit_days_expected": req.transit_days_expected,
        "traffic_congestion": req.traffic_congestion,
        "weather_impact_score": req.weather_impact_score,
        "order_priority": req.order_priority,
    }])

    prob_delay = float(models["risk"].predict_proba(df_input)[0][1])
    prob_delay = round(prob_delay, 2)

    if prob_delay >= 0.60:
        risk_level = "HIGH"
    elif prob_delay >= 0.30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Identify primary risk factor
    factors = []
    if req.weather_impact_score > 0.4:
        factors.append(f"Adverse Weather (Impact score: {req.weather_impact_score})")
    if req.traffic_congestion == "HIGH":
        factors.append("Severe Corridor Traffic Congestion")
    if req.distance_km > 2400:
        factors.append(f"Long Transit Distance ({req.distance_km:.0f} km)")
    if req.carrier_name in ["Maersk Intermodal"]:
        factors.append("Intermodal Transfer Port Dwell")

    primary_factor = factors[0] if factors else "Routine Transit Variables"

    mitigations = {
        "HIGH": "Expedite priority air cargo rerouting or transfer shipment to high-speed dedicated express fleet immediately.",
        "MEDIUM": "Alert receiving warehouse of potential 24-48h milestone variance and monitor next regional sorting scan.",
        "LOW": "Shipment is operating within nominal transit parameters. Maintain standard tracking schedule.",
    }

    return DelayRiskResponse(
        delay_probability=prob_delay,
        predicted_delay_risk=risk_level,
        primary_risk_factor=primary_factor,
        suggested_mitigation=mitigations[risk_level],
    )

