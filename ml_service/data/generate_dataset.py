"""
Supply Chain Dataset Generator for Offline ML Model Training
Generates two datasets:
1. demand_forecasting_data.csv: Historical product sales, lead time, price ratios, seasonality
2. shipment_delay_data.csv: Route distances, carrier reliability, congestion, weather impact, delay label
"""

import os
import numpy as np
import pandas as pd

def generate_datasets():
    np.random.seed(42)
    os.makedirs(os.path.dirname(__file__), exist_ok=True)

    # -------------------------------------------------------------
    # 1. Demand Forecasting Dataset (1500 records)
    # -------------------------------------------------------------
    categories = ['Electronics', 'Automotive', 'Perishables', 'Raw Materials', 'Apparel']
    n_demand_samples = 1500

    demand_data = []
    for _ in range(n_demand_samples):
        cat = np.random.choice(categories)
        unit_price = np.random.uniform(40.0, 950.0)
        margin = np.random.uniform(0.25, 0.55)
        unit_cost = unit_price * (1.0 - margin)
        lead_time = np.random.randint(3, 28)
        hist_avg = np.random.uniform(15.0, 120.0)
        quarter = np.random.choice(['Q1', 'Q2', 'Q3', 'Q4'])

        # Seasonality factor
        season_multiplier = 1.0
        if quarter == 'Q4':
            season_multiplier = 1.35 if cat in ['Electronics', 'Apparel'] else 1.10
        elif quarter == 'Q1':
            season_multiplier = 0.85
        elif quarter == 'Q2' and cat == 'Perishables':
            season_multiplier = 1.25

        # Real-world economic price-elasticity effect: higher prices dampen demand slightly
        price_elasticity = 1.0 - (unit_price / 3000.0)
        target_demand = int(
            max(5, (hist_avg * season_multiplier * price_elasticity) + np.random.normal(0, 6.0))
        )

        demand_data.append({
            'product_category': cat,
            'unit_price': round(unit_price, 2),
            'unit_cost': round(unit_cost, 2),
            'historical_avg_sales': round(hist_avg, 1),
            'lead_time_days': lead_time,
            'quarter': quarter,
            'actual_demand': target_demand,
        })

    df_demand = pd.DataFrame(demand_data)
    demand_csv_path = os.path.join(os.path.dirname(__file__), 'demand_forecasting_data.csv')
    df_demand.to_csv(demand_csv_path, index=False)
    print(f"Generated {len(df_demand)} demand samples at {demand_csv_path}")

    # -------------------------------------------------------------
    # 2. Shipment Delay Risk Dataset (2000 records)
    # -------------------------------------------------------------
    carriers = ['DHL Express Global', 'FedEx Freight', 'Maersk Intermodal', 'UPS Supply Chain Solutions']
    congestion_levels = ['LOW', 'MEDIUM', 'HIGH']
    priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    n_shipment_samples = 2000

    shipment_data = []
    for _ in range(n_shipment_samples):
        carrier = np.random.choice(carriers)
        distance = np.random.uniform(300.0, 3800.0)
        transit_days = int((distance / 600.0) + np.random.randint(1, 3))
        congestion = np.random.choice(congestion_levels, p=[0.35, 0.45, 0.20])
        weather_score = round(np.random.uniform(0.0, 1.0), 2)
        priority = np.random.choice(priorities)

        # Ground-truth probability of shipment delay
        carrier_bias = {
            'DHL Express Global': 0.05,
            'FedEx Freight': 0.08,
            'UPS Supply Chain Solutions': 0.10,
            'Maersk Intermodal': 0.14,
        }[carrier]

        congestion_bias = {'LOW': 0.02, 'MEDIUM': 0.12, 'HIGH': 0.30}[congestion]
        weather_bias = weather_score * 0.40
        distance_bias = (distance / 4000.0) * 0.15

        prob_delay = carrier_bias + congestion_bias + weather_bias + distance_bias
        prob_delay = min(0.95, max(0.02, prob_delay))

        is_delayed = 1 if np.random.random() < prob_delay else 0

        shipment_data.append({
            'carrier_name': carrier,
            'distance_km': round(distance, 1),
            'transit_days_expected': transit_days,
            'traffic_congestion': congestion,
            'weather_impact_score': weather_score,
            'order_priority': priority,
            'is_delayed': is_delayed,
        })

    df_shipment = pd.DataFrame(shipment_data)
    shipment_csv_path = os.path.join(os.path.dirname(__file__), 'shipment_delay_data.csv')
    df_shipment.to_csv(shipment_csv_path, index=False)
    print(f"Generated {len(df_shipment)} shipment records with {df_shipment['is_delayed'].sum()} delays at {shipment_csv_path}")

if __name__ == '__main__':
    generate_datasets()
