import { MongoDBConnection } from "@infra/mongodb/connection";
import { clients, products, orders } from "@scripts/mock";
import { logTime } from "@scripts/logTime";

async function seed() {
  const connection = new MongoDBConnection();
  const db = await connection.connect();

  try {
    // 1) Limpar coleções existentes
    console.log("Clearing existing collections...");
    await Promise.all([
      db
        .collection("clients")
        .drop()
        .catch(() => {}),
      db
        .collection("products")
        .drop()
        .catch(() => {}),
      db
        .collection("orders")
        .drop()
        .catch(() => {}),
    ]);
    console.log("Collections cleared.");

    // 2) Inserir clients
    console.log("Inserting clients...");
    let start = Date.now();
    await db.collection("clients").insertMany(clients);
    logTime("Clients population (MongoDB)", start);

    // 3) Inserir products
    console.log("Inserting products...");
    start = Date.now();
    await db.collection("products").insertMany(products);
    logTime("Products population (MongoDB)", start);

    // 4) Inserir orders (com items e payments embutidos)
    console.log("Inserting orders with nested items and payments...");
    start = Date.now();
    await db.collection("orders").insertMany(orders);
    logTime("Orders population (MongoDB)", start);

    console.log("MongoDB seeding completed successfully!");
  } catch (error) {
    console.error("Error during MongoDB seeding:", error);
  } finally {
    await connection.close();
  }
}

seed().catch((err) => {
  console.error("Unhandled error in seed script:", err);
  process.exit(1);
});
