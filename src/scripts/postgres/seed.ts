import { PostgresConnection } from "@infra/postgres/connection";
import { clients, products, orders, orderItems, payments } from "@scripts/mock";
import { logTime } from "@scripts/logTime";

const db = new PostgresConnection();

async function seed() {
  const client = await db.connect();

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await client.query(
      `TRUNCATE TABLE cliente, produto, pedido, pedido_item, pagamento RESTART IDENTITY CASCADE`
    );
    console.log("Existing data cleared...");

    // Populate clients
    console.log("Starting to populate clients...");
    let start = Date.now();
    for (const c of clients) {
      await client.query(
        `INSERT INTO cliente (id, nome, email, telefone, cpf) VALUES ($1, $2, $3, $4, $5)`,
        [c.id, c.nome, c.email, c.telefone, c.cpf]
      );
    }
    console.log(`Inserted ${clients.length} clients...`);
    logTime("Clients population", start);

    // Populate products
    console.log("Starting to populate products...");
    start = Date.now();
    for (const p of products) {
      await client.query(
        `INSERT INTO produto (id, nome, categoria, preco, estoque) VALUES ($1, $2, $3, $4, $5)`,
        [p.id, p.nome, p.categoria, p.preco, p.estoque]
      );
    }
    console.log(`Inserted ${products.length} products...`);
    logTime("Products population", start);

    // Populate orders
    console.log("Starting to populate order...");
    start = Date.now();
    for (const o of orders) {
      await client.query(
        `INSERT INTO pedido (id, id_cliente, data_pedido, status) VALUES ($1, $2, $3, $4)`,
        [o.id, o.id_cliente, o.data_pedido, o.status]
      );
    }
    console.log(`Inserted ${orders.length} orders...`);
    logTime("Orders population", start);

    // Populate orders items
    console.log("Starting to populate order items...");
    start = Date.now();
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO pedido_item (id, id_pedido, id_produto, quantidade, valor_unitario) VALUES ($1, $2, $3, $4, $5)`,
        [oi.id, oi.id_pedido, oi.id_produto, oi.quantidade, oi.valor_unitario]
      );
    }
    console.log(`Inserted ${orderItems.length} orders items...`);
    logTime("Orders items population", start);

    // Populate payments
    console.log("Starting to populate payments...");
    start = Date.now();
    for (const p of payments) {
      await client.query(
        `INSERT INTO pagamento (id, id_pedido, tipo, status, data_pagamento) VALUES ($1, $2, $3, $4, $5)`,
        [p.id, p.id_pedido, p.tipo, p.status, p.data_pagamento]
      );
    }
    console.log(`Inserted ${payments.length} payments...`);
    logTime("Payments population", start);

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    client.release();
    await db.close();
  }
}

seed();
