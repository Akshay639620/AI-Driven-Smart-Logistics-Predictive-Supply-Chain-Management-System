# DBMS Project Viva Defense Guide & Examination Cheat Sheet

**Project Title**: AI-Driven Smart Logistics & Predictive Supply Chain Management System  
**Course**: Database Management Systems (DBMS)  
**Database**: PostgreSQL 16+ on Neon Serverless  
**Architecture**: React.js (Vite) + Express.js + Prisma ORM + FastAPI (Scikit-Learn ML Microservice)  

---

## 1. Top Viva Questions & Definitive Answers

### Q1: Explain how your schema achieves Third Normal Form (3NF).
**Answer**:
- **First Normal Form (1NF)**: Every attribute contains only atomic, indivisible values. There are no repeating groups (e.g. products in an order are not stored as arrays or comma-delimited strings in `orders`, but in normalized rows inside `order_items`).
- **Second Normal Form (2NF)**: The database is in 1NF and contains no partial dependencies on candidate keys. In bridge tables with composite identifiers like `product_suppliers(product_id, supplier_id)`, non-key attributes (`supply_price`, `is_primary`) depend fully on both columns. Independent attributes like `supplier_address` or `product_dimensions` reside in their parent tables.
- **Third Normal Form (3NF)**: The database is in 2NF and has no transitive functional dependencies ($X \rightarrow Y$ and $Y \rightarrow Z$ where $Z$ is non-prime).
  - *Example 1*: In `orders`, we store `created_by` (FK to `users`), but we do not store the user's role or password hash on the order record.
  - *Example 2*: In `shipments`, we store `route_id` (FK to `routes`), but route distance and congestion levels are not replicated on the shipment tuple.

---

### Q2: What many-to-many (M:N) relationships exist, and how did you resolve them?
**Answer**:
We resolved three distinct many-to-many relationships using bridge (associative) tables:
1. **Products ↔ Suppliers** $\rightarrow$ Resolved by `product_suppliers`:
   - A single product can be supplied by multiple competing vendors.
   - A vendor supplies dozens of different products.
   - Bridge attributes: `product_id`, `supplier_id`, `supplier_sku`, `supply_price`, `is_primary`.
2. **Products ↔ Warehouses** $\rightarrow$ Resolved by `inventory`:
   - A product is stocked across multiple regional hubs.
   - A warehouse stores hundreds of product SKUs.
   - Bridge attributes: `product_id`, `warehouse_id`, `quantity`, `reorder_threshold`, `max_capacity`.
3. **Orders ↔ Products** $\rightarrow$ Resolved by `order_items`:
   - An order contains multiple product line items.
   - A product is purchased across thousands of customer orders.
   - Bridge attributes: `order_id`, `product_id`, `warehouse_id`, `quantity`, `unit_price`, `subtotal`.

---

### Q3: Explain your PostgreSQL View (`v_inventory_stock_status`). Why use a view instead of querying tables directly?
**Answer**:
- **SQL Definition**:
  ```sql
  CREATE OR REPLACE VIEW v_inventory_stock_status AS
  SELECT 
      i.id AS inventory_id, p.id AS product_id, p.sku, p.name AS product_name,
      p.category, p.unit_price, p.unit_cost, w.id AS warehouse_id,
      w.code AS warehouse_code, w.name AS warehouse_name, w.city AS warehouse_city,
      i.quantity, i.reorder_threshold, i.max_capacity,
      ROUND((p.unit_price * i.quantity)::numeric, 2) AS total_retail_value,
      CASE 
          WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
          WHEN i.quantity <= i.reorder_threshold THEN 'LOW_STOCK'
          WHEN i.quantity >= (i.max_capacity * 0.9) THEN 'OVERSTOCKED'
          ELSE 'OPTIMAL'
      END AS stock_health_status,
      i.updated_at AS last_updated_at
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  JOIN warehouses w ON i.warehouse_id = w.id;
  ```
- **Why a View?**:
  1. **Abstraction & Security**: Exposes calculated stock health (`OUT_OF_STOCK`, `LOW_STOCK`, `OPTIMAL`) and retail valuations directly to client apps without repeating complex CASE statements in application code.
  2. **Query Simplification**: Consolidates a 3-table join (`inventory` + `products` + `warehouses`) into a single logical relation (`SELECT * FROM v_inventory_stock_status WHERE stock_health_status = 'LOW_STOCK'`).
  3. **Consistency**: Any inventory modification in the underlying tables is instantly reflected in the view on subsequent reads.

---

### Q4: How does your PostgreSQL Trigger work? What business problem does it solve?
**Answer**:
- **Trigger Function**: `fn_check_inventory_alert()`
- **Trigger**: `trg_inventory_low_stock_check`
- **Execution Timing**: `AFTER UPDATE OF quantity OR INSERT ON inventory FOR EACH ROW`
- **Logic**:
  ```sql
  IF NEW.quantity <= NEW.reorder_threshold THEN
      INSERT INTO stock_alerts (
          product_id, warehouse_id, alert_type, current_quantity, threshold, is_resolved, created_at
      ) VALUES (
          NEW.product_id, NEW.warehouse_id,
          CASE WHEN NEW.quantity = 0 THEN 'OUT_OF_STOCK' ELSE 'LOW_STOCK' END,
          NEW.quantity, NEW.reorder_threshold, FALSE, NOW()
      );
  END IF;
  ```
- **Why Database-Level?**:
  If stock updates occur outside the web application (e.g. direct SQL updates, batch ERP data loads, warehouse barcode scanner integrations), application-level alerts would fail to fire. Implementing the trigger directly inside PostgreSQL guarantees that low-stock alerts are generated under 100% of mutation paths.

---

### Q5: How do you guarantee ACID transaction properties during order placement?
**Answer**:
Order placement involves multiple tables: checking stock, inserting into `orders`, inserting into `order_items`, and decrementing `inventory`.
- **Atomicity**: Executed inside Prisma `$transaction`. If any step fails (e.g. requested quantity > stock available, or a foreign key fails), the entire transaction aborts. Zero rows are persisted to `orders` or `order_items`, and inventory is not decremented.
- **Consistency**: Database check constraints (`quantity >= 0`, `unit_price > 0`, `total_amount >= 0`) and foreign key constraints are enforced before the transaction commits.
- **Isolation**: PostgreSQL uses Read Committed isolation level by default. Row-level locks prevent race conditions where two simultaneous orders attempt to claim the last available stock item.
- **Durability**: Once Neon PostgreSQL acknowledges `COMMIT`, the write-ahead log (WAL) is synced to durable storage.

---

### Q6: Which indexes did you create, and how did you verify their effectiveness?
**Answer**:
We implemented B-Tree indexes based on real dashboard access patterns:
1. `orders(created_at DESC)`: The analytics dashboard runs time-series queries grouping sales by month (`TO_CHAR(created_at, 'YYYY-MM')`). A descending B-Tree index avoids full sequential table scans and in-memory sorting.
2. `shipments(status)`: Frequently queried on the dispatcher screen (`WHERE status IN ('IN_TRANSIT', 'DELAYED')`).
3. `inventory(product_id, warehouse_id)`: Composite unique index enabling sub-millisecond inventory lookups during atomic order validation.
- **Verification**: Verified using `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL. The query plan demonstrates an **Index Scan** using the B-Tree index rather than a Seq Scan.

---

### Q7: Is the machine learning real or simulated? How is it architected?
**Answer**:
- **It is 100% real, offline-trained machine learning**:
  - `RandomForestRegressor` for demand forecasting (trained on historical sales velocity, price elasticity, lead times, and seasonal quarters).
  - `RandomForestClassifier` for shipment delay risk (trained on carrier reliability, route distances, transit days, congestion levels, and weather scores).
- **Stateless Microservice Separation**:
  - The models are trained offline via `train.py` and serialized to `.joblib` files.
  - A dedicated **FastAPI** service loads the models once at startup. It does not perform training per request, making inference sub-10ms and stateless.
  - The Express backend calls FastAPI, and then **persists the predicted values** into the relational PostgreSQL database tables (`demand_forecasts` and `risk_scores`), preserving a permanent audit trail of model predictions.

