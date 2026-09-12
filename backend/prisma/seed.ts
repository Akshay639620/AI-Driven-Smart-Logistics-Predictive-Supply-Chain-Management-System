import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Clean existing records in dependency order
  console.log('Cleaning existing records...');
  await prisma.auditLog.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.demandForecast.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.shipmentTracking.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.route.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 2. Roles
  console.log('Creating Roles...');
  const roleAdmin = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Full system access, user management, and configuration' },
  });
  const roleManager = await prisma.role.create({
    data: { name: 'MANAGER', description: 'Supply chain oversight, order approval, stock adjustments' },
  });
  const roleStaff = await prisma.role.create({
    data: { name: 'STAFF', description: 'Operational warehouse staff, order entry, and shipment tracking' },
  });

  // 3. Users
  console.log('Creating Users with pre-hashed passwords...');
  const salt = await bcrypt.genSalt(10);
  const passwordAdmin = await bcrypt.hash('admin123', salt);
  const passwordManager = await bcrypt.hash('manager123', salt);
  const passwordStaff = await bcrypt.hash('staff123', salt);

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@logistics.com',
      passwordHash: passwordAdmin,
      fullName: 'Elena Rostova',
      department: 'Executive Operations',
      roleId: roleAdmin.id,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      email: 'manager@logistics.com',
      passwordHash: passwordManager,
      fullName: 'Marcus Chen',
      department: 'Global Supply Chain',
      roleId: roleManager.id,
    },
  });

  const userStaff = await prisma.user.create({
    data: {
      email: 'staff@logistics.com',
      passwordHash: passwordStaff,
      fullName: 'Sarah Jenkins',
      department: 'Warehouse Operations',
      roleId: roleStaff.id,
    },
  });

  const allUsers = [userAdmin, userManager, userStaff];

  // 4. Warehouses
  console.log('Creating Warehouses...');
  const warehouseData = [
    { code: 'WH-ORD-01', name: 'Chicago Central Distribution Hub', location: '1000 Logistics Way', city: 'Chicago', capacitySqm: 28000, managerName: 'David Miller' },
    { code: 'WH-DFW-02', name: 'Dallas Metro Logistics Depot', location: '450 Freight Blvd', city: 'Dallas', capacitySqm: 35000, managerName: 'Maria Rodriguez' },
    { code: 'WH-LAX-03', name: 'West Coast Maritime Terminal', location: '88 Ocean Gateway', city: 'Los Angeles', capacitySqm: 42000, managerName: 'Kenji Sato' },
    { code: 'WH-JFK-04', name: 'Northeast Cargo Gateway', location: '210 Aviation Pkwy', city: 'Newark', capacitySqm: 31000, managerName: 'Rachel Green' },
    { code: 'WH-ATL-05', name: 'Southeast Regional Freight Center', location: '500 Interstate Rd', city: 'Atlanta', capacitySqm: 33000, managerName: 'Terrence Vance' },
  ];

  const warehouses = [];
  for (const wh of warehouseData) {
    warehouses.push(await prisma.warehouse.create({ data: wh }));
  }

  // 5. Suppliers
  console.log('Creating Suppliers...');
  const supplierSeedList = [
    { name: 'Apex Semiconductors Corp', contactName: 'Hiroshi Tanaka', email: 'sales@apexsemi.com', phone: '+1-408-555-0199', city: 'San Jose', country: 'United States', rating: 4.8, leadTimeDays: 14 },
    { name: 'Nordic Precision Alloys', contactName: 'Astrid Lindholm', email: 'orders@nordicalloys.se', phone: '+46-8-123-4567', city: 'Gothenburg', country: 'Sweden', rating: 4.9, leadTimeDays: 21 },
    { name: 'Pacific Component Solutions', contactName: 'Wei Zhang', email: 'contact@pacificcomp.tw', phone: '+886-2-8765-4321', city: 'Hsinchu', country: 'Taiwan', rating: 4.6, leadTimeDays: 12 },
    { name: 'Bavaria Industrial Drives', contactName: 'Klaus Schmidt', email: 'vertrieb@bavariadrives.de', phone: '+49-89-987654', city: 'Munich', country: 'Germany', rating: 4.7, leadTimeDays: 18 },
    { name: 'OmniPack Global Logistics', contactName: 'Carlos Morales', email: 'carlos@omnipack.com', phone: '+1-312-555-0144', city: 'Chicago', country: 'United States', rating: 4.4, leadTimeDays: 5 },
    { name: 'BioTherm Cold-Chain Systems', contactName: 'Claire Beaumont', email: 'support@biotherm.ch', phone: '+41-22-334-5566', city: 'Geneva', country: 'Switzerland', rating: 4.9, leadTimeDays: 9 },
    { name: 'Vanguard Polymers & Textiles', contactName: 'Rajesh Patel', email: 'info@vanguardpoly.in', phone: '+91-22-2456-7890', city: 'Mumbai', country: 'India', rating: 4.3, leadTimeDays: 16 },
    { name: 'Shenzhen Optics & Photonics', contactName: 'Lin Xiaoyu', email: 'b2b@szoptics.cn', phone: '+86-755-8888-9999', city: 'Shenzhen', country: 'China', rating: 4.5, leadTimeDays: 10 },
  ];

  const suppliers = [];
  for (const s of supplierSeedList) {
    suppliers.push(await prisma.supplier.create({ data: s }));
  }

  // 6. Products
  console.log('Creating Products...');
  const productSeedList = [
    { sku: 'ELEC-MCU-320', name: 'Industrial 32-Bit Microcontroller Unit', category: 'Electronics', unitPrice: 48.50, unitCost: 26.00, weightKg: 0.15, dimensions: '12x8x2 cm' },
    { sku: 'ELEC-IOT-500', name: 'Ruggedized IoT Gateway Hub', category: 'Electronics', unitPrice: 285.00, unitCost: 155.00, weightKg: 1.20, dimensions: '25x18x6 cm' },
    { sku: 'ELEC-GPS-100', name: 'High-Precision Asset GPS Tracker', category: 'Electronics', unitPrice: 110.00, unitCost: 58.00, weightKg: 0.35, dimensions: '10x6x3 cm' },
    { sku: 'ELEC-OPT-042', name: 'Multi-Spectrum Optical LiDAR Sensor', category: 'Electronics', unitPrice: 740.00, unitCost: 420.00, weightKg: 0.85, dimensions: '15x15x10 cm' },
    { sku: 'ELEC-PWR-24V', name: 'Redundant 24V Industrial Power Inverter', category: 'Electronics', unitPrice: 195.00, unitCost: 105.00, weightKg: 3.40, dimensions: '30x20x15 cm' },

    { sku: 'AUTO-BAT-48V', name: '48V High-Density Lithium-Ion Module', category: 'Automotive', unitPrice: 980.00, unitCost: 610.00, weightKg: 18.5, dimensions: '60x40x20 cm' },
    { sku: 'AUTO-HYD-VAL', name: 'Electro-Hydraulic Proportional Valve', category: 'Automotive', unitPrice: 320.00, unitCost: 180.00, weightKg: 4.20, dimensions: '22x14x12 cm' },
    { sku: 'AUTO-BRK-HD1', name: 'Ceramic Composite Heavy Brake Rotor', category: 'Automotive', unitPrice: 240.00, unitCost: 130.00, weightKg: 8.90, dimensions: '38x38x8 cm' },
    { sku: 'AUTO-ALT-150', name: '150A Heavy-Duty Alternator Motor', category: 'Automotive', unitPrice: 215.00, unitCost: 115.00, weightKg: 6.50, dimensions: '28x22x20 cm' },

    { sku: 'PERI-MED-BOX', name: 'Vacuum-Insulated Vaccine Transport Box', category: 'Perishables', unitPrice: 420.00, unitCost: 220.00, weightKg: 5.10, dimensions: '45x45x45 cm' },
    { sku: 'PERI-DAT-LOG', name: 'Cryogenic Bluetooth Temperature Logger', category: 'Perishables', unitPrice: 85.00, unitCost: 40.00, weightKg: 0.12, dimensions: '8x5x2 cm' },
    { sku: 'PERI-COL-GEL', name: 'Phase-Change Refrigerant Gel Pack (Case of 24)', category: 'Perishables', unitPrice: 65.00, unitCost: 28.00, weightKg: 12.0, dimensions: '40x30x25 cm' },

    { sku: 'RAW-ALU-6061', name: '6061-T6 Precision Aluminum Extrusion (3m)', category: 'Raw Materials', unitPrice: 115.00, unitCost: 65.00, weightKg: 7.20, dimensions: '300x5x5 cm' },
    { sku: 'RAW-CFB-300', name: 'Aerospace Carbon Fiber Fabric Roll (10m)', category: 'Raw Materials', unitPrice: 530.00, unitCost: 310.00, weightKg: 6.00, dimensions: '120x20x20 cm' },
    { sku: 'RAW-SIL-200', name: 'Monocrystalline Silicon Wafer Disk 200mm', category: 'Raw Materials', unitPrice: 380.00, unitCost: 210.00, weightKg: 1.10, dimensions: '25x25x5 cm' },

    { sku: 'APP-STE-BOOT', name: 'Waterproof Kevlar-Reinforced Steel Safety Boots', category: 'Apparel', unitPrice: 145.00, unitCost: 72.00, weightKg: 2.10, dimensions: '35x25x15 cm' },
    { sku: 'APP-PAR-VIS', name: 'All-Weather High-Visibility Hi-Vis Parka (Class 3)', category: 'Apparel', unitPrice: 125.00, unitCost: 55.00, weightKg: 1.40, dimensions: '40x30x8 cm' },
    { sku: 'APP-GLV-CUT', name: 'Level 5 Cut-Resistant Nitrile Grip Gloves (Pack of 12)', category: 'Apparel', unitPrice: 54.00, unitCost: 24.00, weightKg: 0.80, dimensions: '25x15x10 cm' },
  ];

  const products = [];
  for (const p of productSeedList) {
    products.push(await prisma.product.create({ data: p }));
  }

  // 7. ProductSuppliers (Resolving M:N)
  console.log('Resolving Product <-> Supplier M:N...');
  for (const product of products) {
    // Assign 1 to 2 suppliers per product
    const primarySupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    await prisma.productSupplier.create({
      data: {
        productId: product.id,
        supplierId: primarySupplier.id,
        supplierSku: `${primarySupplier.name.slice(0, 3).toUpperCase()}-${product.sku}`,
        supplyPrice: Number((product.unitCost * 0.95).toFixed(2)),
        isPrimary: true,
      },
    });

    // Add secondary supplier for high-demand items
    if (Math.random() > 0.4) {
      const secondarySuppliers = suppliers.filter((s) => s.id !== primarySupplier.id);
      const secondarySupplier = secondarySuppliers[Math.floor(Math.random() * secondarySuppliers.length)];
      await prisma.productSupplier.create({
        data: {
          productId: product.id,
          supplierId: secondarySupplier.id,
          supplierSku: `${secondarySupplier.name.slice(0, 3).toUpperCase()}-${product.sku}`,
          supplyPrice: Number((product.unitCost * 1.05).toFixed(2)),
          isPrimary: false,
        },
      });
    }
  }

  // 8. Inventory (Resolving Product <-> Warehouse M:N)
  console.log('Populating Inventory across Warehouses...');
  for (const product of products) {
    for (const warehouse of warehouses) {
      // Intentionally introduce some LOW_STOCK and CRITICAL_STOCK items for triggering demo
      const isCritical = Math.random() < 0.12;
      const isLow = !isCritical && Math.random() < 0.20;

      let qty = Math.floor(Math.random() * 200) + 50;
      const reorderThreshold = 25;

      if (isCritical) {
        qty = Math.floor(Math.random() * 8); // 0 to 7 (triggers trigger!)
      } else if (isLow) {
        qty = Math.floor(Math.random() * 12) + 12; // 12 to 23
      }

      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: qty,
          reorderThreshold: reorderThreshold,
          maxCapacity: 400,
          lastRestockedAt: faker.date.recent({ days: 45 }),
        },
      });
    }
  }

  // 9. Routes
  console.log('Creating Logistics Routes...');
  const destinationCities = [
    { city: 'New York', baseDistance: 1300, baseDays: 3 },
    { city: 'Los Angeles', baseDistance: 2800, baseDays: 4 },
    { city: 'Houston', baseDistance: 1500, baseDays: 3 },
    { city: 'Phoenix', baseDistance: 2300, baseDays: 4 },
    { city: 'Philadelphia', baseDistance: 1200, baseDays: 2 },
    { city: 'Miami', baseDistance: 1900, baseDays: 3 },
    { city: 'Seattle', baseDistance: 3200, baseDays: 5 },
    { city: 'Denver', baseDistance: 1600, baseDays: 3 },
  ];

  const routes = [];
  for (const wh of warehouses) {
    for (const dest of destinationCities) {
      const congestionLevels = ['LOW', 'MEDIUM', 'HIGH'];
      const congestion = congestionLevels[Math.floor(Math.random() * congestionLevels.length)];
      const weatherImpact = Number((Math.random() * 0.8).toFixed(2));

      routes.push(
        await prisma.route.create({
          data: {
            originWarehouseId: wh.id,
            destinationCity: dest.city,
            distanceKm: Number((dest.baseDistance + (Math.random() * 400 - 200)).toFixed(1)),
            transitDaysExpected: dest.baseDays + (congestion === 'HIGH' ? 1 : 0),
            trafficCongestion: congestion,
            weatherImpactScore: weatherImpact,
          },
        })
      );
    }
  }

  // 10. Historical Orders & Order Items
  console.log('Creating 120+ Historical Orders with Items and Shipments...');
  const carriers = ['DHL Express Global', 'FedEx Freight', 'Maersk Intermodal', 'UPS Supply Chain Solutions'];
  const orderStatuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'PENDING'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 1; i <= 120; i++) {
    const orderDate = faker.date.past({ years: 1 });
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const selectedWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
    const targetRoute = routes.find((r) => r.originWarehouseId === selectedWarehouse.id) || routes[0];

    // Pick 1 to 4 distinct products
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    let totalAmount = 0;
    const itemsData = [];

    for (const prod of shuffledProducts) {
      const qty = Math.floor(Math.random() * 8) + 1;
      const subtotal = Number((prod.unitPrice * qty).toFixed(2));
      totalAmount += subtotal;
      itemsData.push({
        productId: prod.id,
        warehouseId: selectedWarehouse.id,
        quantity: qty,
        unitPrice: prod.unitPrice,
        subtotal: subtotal,
      });
    }

    const orderNumber = `ORD-2026-${String(i).padStart(4, '0')}`;
    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber,
        customerName: faker.company.name(),
        customerEmail: faker.internet.email(),
        destinationCity: targetRoute.destinationCity,
        destinationAddress: faker.location.streetAddress(),
        status: status,
        priority: priority,
        totalAmount: Number(totalAmount.toFixed(2)),
        createdById: user.id,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: itemsData,
        },
      },
    });

    // Create Shipment for SHIPPED, DELIVERED, or PROCESSING orders
    if (status !== 'PENDING') {
      const isDelivered = status === 'DELIVERED';
      const isDelayed = Math.random() < 0.22; // deliberate delay scenario
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const shippedAt = new Date(orderDate.getTime() + 24 * 3600 * 1000);
      const estDelivery = new Date(shippedAt.getTime() + targetRoute.transitDaysExpected * 24 * 3600 * 1000);
      const actualDelivery = isDelivered
        ? new Date(estDelivery.getTime() + (isDelayed ? 3 : 0) * 24 * 3600 * 1000)
        : null;

      const shipmentStatus = isDelivered
        ? 'DELIVERED'
        : isDelayed
        ? 'DELAYED'
        : 'IN_TRANSIT';

      const shipment = await prisma.shipment.create({
        data: {
          trackingNumber: `TRK-${carrier.slice(0, 3).toUpperCase()}-${String(i).padStart(5, '0')}`,
          orderId: order.id,
          routeId: targetRoute.id,
          carrierName: carrier,
          status: shipmentStatus,
          shippedAt: shippedAt,
          estimatedDelivery: estDelivery,
          actualDelivery: actualDelivery,
          currentLocation: isDelivered ? targetRoute.destinationCity : selectedWarehouse.city,
          createdAt: shippedAt,
          updatedAt: actualDelivery || estDelivery,
        },
      });

      // Add Tracking checkpoints
      await prisma.shipmentTracking.createMany({
        data: [
          {
            shipmentId: shipment.id,
            statusUpdate: 'Manifest Picked Up at Origin Facility',
            location: selectedWarehouse.city,
            checkpointTimestamp: shippedAt,
            notes: `Package departed from ${selectedWarehouse.name}`,
          },
          {
            shipmentId: shipment.id,
            statusUpdate: isDelayed ? 'Severe Weather / Transit Delay Reported' : 'In Transit Through Regional Sorting Hub',
            location: 'Intermediate Hub',
            checkpointTimestamp: new Date(shippedAt.getTime() + 24 * 3600 * 1000),
            notes: isDelayed ? 'Delay risk flagged due to severe interstate storm' : 'On schedule',
          },
          ...(isDelivered
            ? [
                {
                  shipmentId: shipment.id,
                  statusUpdate: 'Delivered and Signed by Consignee',
                  location: targetRoute.destinationCity,
                  checkpointTimestamp: actualDelivery!,
                  notes: 'Successful receipt recorded in ERP',
                },
              ]
            : []),
        ],
      });

      // Add Risk Score for active or delayed shipments
      const delayProb = isDelayed ? Number((0.72 + Math.random() * 0.22).toFixed(2)) : Number((0.08 + Math.random() * 0.20).toFixed(2));
      const riskLevel = delayProb > 0.65 ? 'HIGH' : delayProb > 0.35 ? 'MEDIUM' : 'LOW';
      const riskFactors = ['Adverse Weather Warning', 'Route Distance & Congestion', 'Carrier Capacity Crunch', 'Normal Operations'];
      const factor = isDelayed ? riskFactors[Math.floor(Math.random() * 3)] : 'Normal Operations';

      await prisma.riskScore.create({
        data: {
          shipmentId: shipment.id,
          delayProbability: delayProb,
          predictedDelayRisk: riskLevel,
          primaryRiskFactor: factor,
          suggestedMitigation: delayProb > 0.5 ? 'Reroute via secondary regional corridor or expedite air cargo dispatch' : 'Maintain standard transit schedule',
          calculatedAt: shippedAt,
        },
      });
    }
  }

  // 11. Initial Demand Forecasts
  console.log('Generating Baseline Demand Forecasts for Products...');
  for (const prod of products) {
    const historicalAvg = Math.floor(Math.random() * 60) + 20;
    const seasonalityFactor = 1.15 + (Math.random() * 0.3 - 0.15);
    const predicted = Math.round(historicalAvg * seasonalityFactor);

    await prisma.demandForecast.create({
      data: {
        productId: prod.id,
        forecastPeriod: '2026-Q4',
        historicalAvgSales: historicalAvg,
        predictedDemand: predicted,
        confidenceScore: Number((0.84 + Math.random() * 0.12).toFixed(2)),
        suggestedReorderQty: Math.max(0, predicted + 15),
        createdById: userManager.id,
      },
    });
  }

  // 12. Initial Audit Logs
  console.log('Generating Initial Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: userAdmin.id,
        action: 'INITIALIZE_SYSTEM',
        tableName: 'roles',
        recordId: roleAdmin.id,
        newData: { initialized: true, version: '1.0.0' },
      },
      {
        userId: userManager.id,
        action: 'POPULATE_INVENTORY',
        tableName: 'inventory',
        recordId: 1,
        newData: { message: 'Initial baseline stock configured' },
      },
    ],
  });

  console.log('✅ Database seeded successfully with realistic enterprise data!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
