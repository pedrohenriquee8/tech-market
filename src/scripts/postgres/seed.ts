import { PostgresConnection } from "@infra/postgres/connection";
import { faker } from "@faker-js/faker";

const db = new PostgresConnection();

const NUM_CLIENTS = 20000;
const NUM_PRODUCTS = 5000;
const NUM_ORDERS = 30000;

function logTime(label: string, startTime: number) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${label} completed in ${duration} seconds.`);
}

async function seed() {
  const client = await db.connect();

  try {
    console.log("Starting to populate clients...");
    let start = Date.now();

    for (let i = 0; i < NUM_CLIENTS; i++) {
      const fullName = faker.person.fullName();
      const username = fullName.toLowerCase().replace(/[^a-zA-Z0-9]/g, ".");
      const email = `${username}${i}@example.com`;

      await client.query(
        `INSERT INTO cliente (nome, email, telefone, cpf, data_cadastro) VALUES ($1, $2, $3, $4, NOW())`,
        [fullName, email, faker.string.numeric(11), faker.string.numeric(11)]
      );
      if (i > 0 && i % 5000 === 0) {
        console.log(`Inserted ${i} clients...`);
      }
    }
    logTime("Clients population", start);

    console.log("Starting to populate products...");
    start = Date.now();

    for (let i = 0; i < NUM_PRODUCTS; i++) {
      await client.query(
        `INSERT INTO produto (nome, categoria, preco, estoque) VALUES ($1, $2, $3, $4)`,
        [
          faker.commerce.productName(),
          faker.commerce.department(),
          parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
          faker.number.int({ min: 1, max: 1000 }),
        ]
      );
      if (i > 0 && i % 1000 === 0) {
        console.log(`Inserted ${i} products...`);
      }
    }
    logTime("Products population", start);

    console.log("Fetching clients and products IDs...");
    const { rows: clients } = await client.query(`SELECT id FROM cliente`);
    const { rows: products } = await client.query(`SELECT id FROM produto`);

    console.log("Starting to populate orders and payments...");
    start = Date.now();

    for (let i = 0; i < NUM_ORDERS; i++) {
      const clientData = faker.helpers.arrayElement(clients);
      const orderDate = faker.date.between({
        from: "2023-01-01",
        to: "2025-01-01",
      });

      const orderResult = await client.query(
        `INSERT INTO pedido (id_cliente, data_pedido, status, valor_total) VALUES ($1, $2, $3, 0) RETURNING id`,
        [
          clientData.id,
          orderDate,
          faker.helpers.arrayElement(["PENDING", "SHIPPED", "DELIVERED"]),
        ]
      );
      const orderId = orderResult.rows[0].id;

      const numItems = faker.number.int({ min: 1, max: 5 });
      let totalValue = 0;

      for (let j = 0; j < numItems; j++) {
        const productData = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 3 });

        await client.query(
          `INSERT INTO pedido_item (id_pedido, id_produto, quantidade) VALUES ($1, $2, $3)`,
          [orderId, productData.id, quantity]
        );

        const { rows } = await client.query(
          `SELECT preco FROM produto WHERE id = $1`,
          [productData.id]
        );
        const price = rows[0].preco;
        totalValue += price * quantity;
      }

      await client.query(`UPDATE pedido SET valor_total = $1 WHERE id = $2`, [
        totalValue,
        orderId,
      ]);

      await client.query(
        `INSERT INTO pagamento (id_pedido, tipo, status, data_pagamento) VALUES ($1, $2, $3, $4)`,
        [
          orderId,
          faker.helpers.arrayElement(["cartao", "pix", "boleto"]),
          faker.helpers.arrayElement(["PAID", "PENDING"]),
          faker.date.between({ from: orderDate, to: "2025-12-31" }),
        ]
      );

      if (i > 0 && i % 5000 === 0) {
        console.log(`Inserted ${i} orders and payments...`);
      }
    }
    logTime("Orders and payments population", start);

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    client.release();
    await db.close();
  }
}

seed();
