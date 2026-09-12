# Entity-Relationship (ER) Diagram & Normalization Analysis

**System**: AI-Driven Smart Logistics & Predictive Supply Chain Management System  
**Target RDBMS**: PostgreSQL 16+ (Hosted on Neon Serverless)  
**ORM**: Prisma  

---

## 1. Relational ER Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    USERS ||--o{ ORDERS : "creates (audit)"
    USERS ||--o{ DEMAND_FORECASTS : "generates"
    USERS ||--o{ AUDIT_LOGS : "performs"

    PRODUCTS ||--o{ PRODUCT_SUPPLIERS : "has suppliers"
    SUPPLIERS ||--o{ PRODUCT_SUPPLIERS : "supplies products"

    PRODUCTS ||--o{ INVENTORY : "stored in"
    WAREHOUSES ||--o{ INVENTORY : "contains"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered as"
    WAREHOUSES ||--o{ ORDER_ITEMS : "fulfilled from"

    WAREHOUSES ||--o{ ROUTES : "originates from"
    ROUTES ||--o{ SHIPMENTS : "traverses"
    ORDERS ||--|| SHIPMENTS : "fulfilled by (1:1)"

    SHIPMENTS ||--o{ SHIPMENT_TRACKING : "audited by (1:M)"
    SHIPMENTS ||--o{ RISK_SCORES : "scored by ML (1:M)"

    PRODUCTS ||--o{ STOCK_ALERTS : "triggers alert for"
    WAREHOUSES ||--o{ STOCK_ALERTS : "alert location"
    PRODUCTS ||--o{ DEMAND_FORECASTS : "forecasted for"

    ROLES {
        int id PK
        string name UK "ADMIN | MANAGER | STAFF"
        string description
        datetime created_at
    }

    USERS {
        int id PK
        int role_id FK
        string email UK
        string password_hash
        string full_name
        string department
        datetime created_at
        datetime updated_at
    }

    SUPPLIERS {
        int id PK
        string name
        string email UK
        string phone
        string address
        string city
        string country
        float rating "CHECK 1.0 to 5.0"
        string status "ACTIVE | INACTIVE"
        int lead_time_days "CHECK > 0"
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        int id PK
        string sku UK
        string name
        string category
        float unit_price "CHECK > 0"
        float unit_cost "CHECK > 0"
        float weight_kg
        string dimensions
        datetime created_at
        datetime updated_at
    }

    PRODUCT_SUPPLIERS {
        int id PK
        int product_id FK
        int supplier_id FK
        string supplier_sku
        float supply_price
        boolean is_primary
        datetime created_at
    }

    WAREHOUSES {
        int id PK
        string code UK
        string name
        string location
        string city
        int capacity_sqm
        string manager_name
        string status
        datetime created_at
        datetime updated_at
    }

    INVENTORY {
        int id PK
        int product_id FK
        int warehouse_id FK
        int quantity "CHECK >= 0"
        int reorder_threshold "CHECK >= 0"
        int max_capacity
        datetime last_restocked_at
        datetime updated_at
    }

    ORDERS {
        int id PK
        string order_number UK
        string customer_name
        string customer_email
        string destination_city
        string destination_address
        string status "PENDING | CONFIRMED | SHIPPED | DELIVERED"
        float total_amount "CHECK >= 0"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        int created_by FK
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int warehouse_id FK
        int quantity "CHECK > 0"
        float unit_price
        float subtotal
        datetime created_at
    }

    ROUTES {
        int id PK
        int origin_warehouse_id FK
        string destination_city
        float distance_km
        int transit_days_expected
        string traffic_congestion "LOW | MEDIUM | HIGH"
        float weather_impact_score
        datetime created_at
    }

    SHIPMENTS {
        int id PK
        string tracking_number UK
        int order_id FK,UK
        int route_id FK
        string carrier_name
        string status "PREPARING | IN_TRANSIT | DELIVERED | DELAYED"
        datetime shipped_at
        datetime estimated_delivery
        datetime actual_delivery
        string current_location
        datetime created_at
        datetime updated_at
    }

    SHIPMENT_TRACKING {
        int id PK
        int shipment_id FK
        string status_update
        string location
        datetime checkpoint_timestamp
        string notes
        datetime created_at
    }

    STOCK_ALERTS {
        int id PK
        int product_id FK
        int warehouse_id FK
        string alert_type "LOW_STOCK | CRITICAL_STOCK | OUT_OF_STOCK"
        int current_quantity
        int threshold
        boolean is_resolved
        datetime created_at
    }

    DEMAND_FORECASTS {
        int id PK
        int product_id FK
        string forecast_period
        float historical_avg_sales
        int predicted_demand
        float confidence_score
        int suggested_reorder_qty
        datetime generated_at
        int created_by FK
    }

    RISK_SCORES {
        int id PK
        int shipment_id FK
        float delay_probability
        string predicted_delay_risk "LOW | MEDIUM | HIGH"
        string primary_risk_factor
        string suggested_mitigation
        datetime calculated_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string table_name
        int record_id
        jsonb old_data
        jsonb new_data
        datetime created_at
    }
```

---

## 2. Relational Normalization Proof (1NF to 3NF)

### 2.1 First Normal Form (1NF)
- **Rule**: Each column contains atomic (indivisible) values, and there are no repeating groups or multi-valued attributes.
- **Application**:
  - In legacy designs, an order table often had columns like `item_1`, `item_2`, `item_3` or a comma-separated list of product IDs.
  - In our schema, line items are normalized into `order_items`, with exactly one product per tuple.
  - Multi-supplier products are separated into `product_suppliers`.
  - Checkpoint tracking events are normalized into `shipment_tracking` rather than JSON arrays.

### 2.2 Second Normal Form (2NF)
- **Rule**: The relation is in 1NF and every non-prime attribute is fully functionally dependent on the primary key (no partial dependencies on composite keys).
- **Application**:
  - In `product_suppliers`, candidate key is `(product_id, supplier_id)`. The non-key attributes `supply_price`, `supplier_sku`, and `is_primary` depend strictly on both the product and supplier simultaneously. Product names and supplier addresses are kept in their respective parent tables (`products` and `suppliers`) to prevent partial functional dependency.
  - In `inventory`, candidate key is `(product_id, warehouse_id)`. Non-key attributes `quantity` and `reorder_threshold` depend on the specific product at that specific warehouse.

### 2.3 Third Normal Form (3NF)
- **Rule**: The relation is in 2NF and no non-prime attribute is transitively dependent on the primary key ($X \rightarrow Y$ and $Y \rightarrow Z$ where $Z$ is non-prime).
- **Application**:
  - In `orders`, the customer information has `destination_city`, but warehouse capacity and address are NOT stored on the order; they are linked via `warehouse_id` in `order_items`.
  - In `shipments`, the route distance and congestion are not duplicated; they reside in `routes`, linked via `route_id`.
  - In `users`, roles are normalized out to `roles`, preventing transitive dependency ($User \rightarrow RoleName \rightarrow RolePermissions$).

---

## 3. Resolution of Many-to-Many Relationships

| Relationship | Entity 1 | Entity 2 | Bridge Table | Key Attributes in Bridge |
|---|---|---|---|---|
| **Product ↔ Supplier** | `products` | `suppliers` | `product_suppliers` | `supply_price`, `supplier_sku`, `is_primary` |
| **Product ↔ Warehouse** | `products` | `warehouses` | `inventory` | `quantity`, `reorder_threshold`, `max_capacity` |
| **Order ↔ Product** | `orders` | `products` | `order_items` | `warehouse_id`, `quantity`, `unit_price`, `subtotal` |

