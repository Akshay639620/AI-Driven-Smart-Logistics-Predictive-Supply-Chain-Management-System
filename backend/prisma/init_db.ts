import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function initDbFeatures() {
  console.log('--- Initializing Advanced DBMS Features (Views, Triggers, Constraints) ---');
  const sqlFilePath = path.join(__dirname, 'views_and_triggers.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Split by statement or execute blocks
  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  // Note: Trigger functions have internal semicolons inside $$ ... $$, so we execute the custom blocks carefully
  try {
    console.log('1. Applying Check Constraints & Views...');
    // Execute views and check constraints
    await prisma.$executeRawUnsafe(`
      ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS chk_supplier_rating;
      ALTER TABLE suppliers ADD CONSTRAINT chk_supplier_rating CHECK (rating >= 1.0 AND rating <= 5.0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS chk_supplier_lead_time;
      ALTER TABLE suppliers ADD CONSTRAINT chk_supplier_lead_time CHECK (lead_time_days > 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_unit_price;
      ALTER TABLE products ADD CONSTRAINT chk_product_unit_price CHECK (unit_price > 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_unit_cost;
      ALTER TABLE products ADD CONSTRAINT chk_product_unit_cost CHECK (unit_cost > 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE inventory DROP CONSTRAINT IF EXISTS chk_inventory_quantity_non_negative;
      ALTER TABLE inventory ADD CONSTRAINT chk_inventory_quantity_non_negative CHECK (quantity >= 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE inventory DROP CONSTRAINT IF EXISTS chk_inventory_reorder_threshold;
      ALTER TABLE inventory ADD CONSTRAINT chk_inventory_reorder_threshold CHECK (reorder_threshold >= 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_total_amount;
      ALTER TABLE orders ADD CONSTRAINT chk_order_total_amount CHECK (total_amount >= 0);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE order_items DROP CONSTRAINT IF EXISTS chk_order_item_quantity;
      ALTER TABLE order_items ADD CONSTRAINT chk_order_item_quantity CHECK (quantity > 0);
    `);
    console.log('✓ Check constraints successfully applied.');

    console.log('2. Creating View: v_inventory_stock_status...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW v_inventory_stock_status AS
      SELECT 
          i.id AS inventory_id,
          p.id AS product_id,
          p.sku,
          p.name AS product_name,
          p.category,
          p.unit_price,
          p.unit_cost,
          w.id AS warehouse_id,
          w.code AS warehouse_code,
          w.name AS warehouse_name,
          w.city AS warehouse_city,
          i.quantity,
          i.reorder_threshold,
          i.max_capacity,
          ROUND((p.unit_price * i.quantity)::numeric, 2) AS total_retail_value,
          ROUND((p.unit_cost * i.quantity)::numeric, 2) AS total_inventory_cost,
          CASE 
              WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN i.quantity <= i.reorder_threshold THEN 'LOW_STOCK'
              WHEN i.quantity >= (i.max_capacity * 0.9) THEN 'OVERSTOCKED'
              ELSE 'OPTIMAL'
          END AS stock_health_status,
          i.last_restocked_at,
          i.updated_at AS last_updated_at
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id;
    `);
    console.log('✓ View v_inventory_stock_status successfully created.');

    console.log('3. Creating View: v_shipment_delay_overview...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE VIEW v_shipment_delay_overview AS
      SELECT 
          s.id AS shipment_id,
          s.tracking_number,
          s.carrier_name,
          s.status AS shipment_status,
          o.order_number,
          o.customer_name,
          r.origin_warehouse_id,
          w.name AS origin_warehouse,
          r.destination_city,
          r.distance_km,
          r.traffic_congestion,
          s.shipped_at,
          s.estimated_delivery,
          s.actual_delivery,
          rs.delay_probability,
          COALESCE(rs.predicted_delay_risk, 'NOT_EVALUATED') AS delay_risk_level,
          rs.primary_risk_factor,
          rs.suggested_mitigation
      FROM shipments s
      JOIN orders o ON s.order_id = o.id
      JOIN routes r ON s.route_id = r.id
      JOIN warehouses w ON r.origin_warehouse_id = w.id
      LEFT JOIN risk_scores rs ON rs.shipment_id = s.id;
    `);
    console.log('✓ View v_shipment_delay_overview successfully created.');

    console.log('4. Creating Trigger Function: fn_check_inventory_alert()...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION fn_check_inventory_alert()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.quantity <= NEW.reorder_threshold THEN
              INSERT INTO stock_alerts (
                  product_id,
                  warehouse_id,
                  alert_type,
                  current_quantity,
                  threshold,
                  is_resolved,
                  created_at
              ) VALUES (
                  NEW.product_id,
                  NEW.warehouse_id,
                  CASE 
                      WHEN NEW.quantity = 0 THEN 'OUT_OF_STOCK'
                      WHEN NEW.quantity <= (NEW.reorder_threshold / 2) THEN 'CRITICAL_STOCK'
                      ELSE 'LOW_STOCK'
                  END,
                  NEW.quantity,
                  NEW.reorder_threshold,
                  FALSE,
                  NOW()
              );
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('5. Attaching Trigger: trg_inventory_low_stock_check to table inventory...');
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trg_inventory_low_stock_check ON inventory;
      CREATE TRIGGER trg_inventory_low_stock_check
      AFTER UPDATE OF quantity OR INSERT ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION fn_check_inventory_alert();
    `);
    console.log('✓ Trigger trg_inventory_low_stock_check successfully attached.');

    console.log('--- All DBMS Advanced Features Initialized Successfully! ---');
  } catch (error) {
    console.error('Error applying DBMS views/triggers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDbFeatures();
