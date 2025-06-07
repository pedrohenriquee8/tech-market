import { PostgresConnection } from "@infra/postgres/connection";
import { clients, products, orders } from "@scripts/mock";
import { logTime } from "@scripts/logTime";

const db = new PostgresConnection();

async function seed() {
  const client = await db.connect();

  try {
    // Limpa dados existentes
    console.log("Clearing existing data...");
    await client.query(
      `TRUNCATE TABLE cliente, produto, pedido, pedido_item, pagamento RESTART IDENTITY CASCADE`
    );
    console.log("Existing data cleared...");

    // Popula clientes
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

    // Popula produtos
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

    // Popula pedidos, itens e pagamentos
    console.log(
      "Starting to populate orders with nested items and payments..."
    );
    start = Date.now();
    let totalItems = 0;
    let totalPayments = 0;

    for (const o of orders) {
      // 1) Insere o pedido
      const valor_total = o.items.reduce(
        (sum, item) => sum + item.quantidade * item.valor_unitario,
        0
      );
      await client.query(
        `INSERT INTO pedido (id, id_cliente, data_pedido, status, valor_total) VALUES ($1, $2, $3, $4, $5)`,
        [o.id, o.id_cliente, o.data_pedido, o.status, valor_total]
      );

      // 2) Insere os items do pedido
      for (const item of o.items) {
        await client.query(
          `INSERT INTO pedido_item (id, id_pedido, id_produto, quantidade, valor_unitario) 
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id, o.id, item.id_produto, item.quantidade, item.valor_unitario]
        );
        totalItems++;
      }

      // 3) Insere os pagamentos do pedido
      for (const pay of o.payments) {
        await client.query(
          `INSERT INTO pagamento (id, id_pedido, tipo, status, data_pagamento) 
           VALUES ($1, $2, $3, $4, $5)`,
          [pay.id, o.id, pay.tipo, pay.status, pay.data_pagamento]
        );
        totalPayments++;
      }
    }

    console.log(
      `Inserted ${orders.length} orders, ${totalItems} items and ${totalPayments} payments...`
    );
    logTime("Orders, items & payments population", start);

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    client.release();
    await db.close();
  }
}

seed();
