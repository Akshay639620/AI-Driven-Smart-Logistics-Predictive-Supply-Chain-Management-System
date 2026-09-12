from pydantic import BaseModel, Field
from typing import Optional, List

class DemandPredictionRequest(BaseModel):
    product_category: str = Field(..., example="Electronics")
    unit_price: float = Field(..., gt=0, example=285.00)
    unit_cost: float = Field(..., gt=0, example=155.00)
    historical_avg_sales: float = Field(..., gt=0, example=45.0)
    lead_time_days: int = Field(default=7, gt=0, example=10)
    quarter: Optional[str] = Field(default="Q4", example="Q4")

class DemandPredictionResponse(BaseModel):
    product_category: str
    predicted_demand: int
    confidence_score: float
    suggested_reorder_qty: int
    model_name: str = "RandomForestRegressor"
    model_version: str = "1.0.0"

class DelayRiskRequest(BaseModel):
    carrier_name: str = Field(..., example="DHL Express Global")
    distance_km: float = Field(..., gt=0, example=1850.5)
    transit_days_expected: int = Field(..., gt=0, example=3)
    traffic_congestion: str = Field(default="MEDIUM", example="HIGH")
    weather_impact_score: float = Field(default=0.2, ge=0.0, le=1.0, example=0.65)
    order_priority: str = Field(default="MEDIUM", example="URGENT")

class DelayRiskResponse(BaseModel):
    delay_probability: float
    predicted_delay_risk: str # 'LOW', 'MEDIUM', 'HIGH'
    primary_risk_factor: str
    suggested_mitigation: str
    model_name: str = "RandomForestClassifier"
    model_version: str = "1.0.0"
