// scripts/seed_cassandra.ts

import { CassandraConnection } from "@infra/cassandra/connection";
import { clients, products, orders } from "@scripts/mock";
import { logTime } from "@scripts/logTime";

async function seed() {
  const connection = new CassandraConnection();
  await connection.connect();

  try {
    // 1) Limpar tabelas existentes
    console.log("Truncating existing tables...");
    await Promise.all([
      connection.execute("TRUNCATE clientes"),
      connection.execute("TRUNCATE produtos"),
      connection.execute("TRUNCATE pedidos_por_cliente"),
    ]);
    console.log("Tables truncated.");

    // 2) Inserir clients
    console.log("Inserting clients...");
    let start = Date.now();
    for (const client of clients) {
      await connection.execute(
        `INSERT INTO clientes (id, nome, email, telefone, data_cadastro, cpf) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          client.id,
          client.nome,
          client.email,
          client.telefone,
          Date.now(),
          client.cpf,
        ]
      );
    }
    logTime("Clients population (Cassandra)", start);

    // 3) Inserir products
    console.log("Inserting products...");
    start = Date.now();
    for (const prod of products) {
      await connection.execute(
        `INSERT INTO produtos (id, nome, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)`,
        [prod.id, prod.nome, prod.categoria, prod.preco, prod.estoque]
      );
    }
    logTime("Products population (Cassandra)", start);

    // 4) Inserir orders (com items e pagamentos embutidos)
    console.log("Inserting orders with items and payments...");
    start = Date.now();
    for (const order of orders) {
      const valor_total = order.items.reduce(
        (sum, item) => sum + item.quantidade * item.valor_unitario,
        0
      );

      await connection.execute(
        `INSERT INTO pedidos_por_cliente (id_cliente, data_pedido, id_pedido, status, valor_total, itens, pagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id_cliente,
          order.data_pedido,
          order.id,
          order.status,
          valor_total,
          order.items,
          order.payments,
        ]
      );
    }
    logTime("Orders population (Cassandra)", start);

    console.log("Cassandra seeding completed successfully!");
  } catch (error) {
    console.error("Error during Cassandra seeding:", error);
    process.exitCode = 1;
  } finally {
    await connection.close();
  }
}

seed().catch((err) => {
  console.error("Unhandled error in Cassandra seed script:", err);
  process.exit(1);
});
