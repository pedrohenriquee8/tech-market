import { PostgresConnection } from "@infra/postgres/connection";
import { logTime } from "@scripts/logTime";

const db = new PostgresConnection();

async function fetchClientAndRecentOrders(email: string) {
  const client = await db.connect();
  const start = Date.now();
  console.log(`Fetching client and recent orders for email: ${email}`);

  try {
    const clientResult = await client.query(
      `SELECT id, nome FROM cliente WHERE email = $1`,
      [email]
    );

    if (clientResult.rowCount === 0) {
      console.log("Client not found.");
      return;
    }

    const clientData = clientResult.rows[0];

    await client.query(
      `SELECT id, data_pedido, status, valor_total
       FROM pedido
       WHERE id_cliente = $1
       ORDER BY data_pedido DESC
       LIMIT 3`,
      [clientData.id]
    );

    logTime("Fetch Client and Recent Orders Query", start, 3);
  } catch (error) {
    console.error("Error fetching client/orders:", error);
  } finally {
    client.release();
    await db.close();
  }
}

async function fetchProductsByCategorySorted(category: string) {
  const client = await db.connect();
  const start = Date.now();
  console.log(`Fetching products in category: ${category}`);

  try {
    const result = await client.query(
      `SELECT id, nome, preco, estoque
       FROM produto
       WHERE categoria = $1
       ORDER BY preco ASC`,
      [category]
    );

    logTime("Fetch Products By Category Query", start, 3);

    if (result.rowCount === 0) {
      console.log(`No products found in category: ${category}`);
      return;
    }

    console.log(`Products in category: ${category}`);
    console.log(`${result.rowCount} products found`);
  } catch (error) {
    console.error("Error fetching products by category:", error);
  } finally {
    client.release();
    await db.close();
  }
}

async function fetchDeliveredOrdersByClientEmail(email: string) {
  const client = await db.connect();
  const start = Date.now();
  console.log(`Fetching delivered orders for client email: ${email}`);

  try {
    const result = await client.query(
      `SELECT p.id, p.data_pedido, p.valor_total
       FROM pedido p
       INNER JOIN cliente c ON p.id_cliente = c.id
       WHERE c.email = $1 AND p.status = 'DELIVERED'
       ORDER BY p.data_pedido DESC`,
      [email]
    );

    logTime("Fetch Delivered Orders Query", start, 3);

    if (result.rowCount === 0) {
      console.log(`No delivered orders found for email: ${email}`);
      return;
    }

    console.log(
      `${result.rowCount} delivered orders found for email: ${email}`
    );
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
  } finally {
    client.release();
    await db.close();
  }
}

async function fetchTop5BestSellingProducts() {
  const client = await db.connect();
  const start = Date.now();
  console.log("Fetching top 5 best-selling products...");

  try {
    const result = await client.query(
      `SELECT 
         pr.id, 
         pr.nome AS name, 
         SUM(pi.quantidade) AS total_sold
       FROM pedido_item pi
       INNER JOIN produto pr ON pi.id_produto = pr.id
       GROUP BY pr.id, pr.nome
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    logTime("Fetch Top 5 Best-Selling Products Query", start, 3);

    if (result.rowCount === 0) {
      console.log("No product sales found.");
      return;
    }

    console.log("Top 5 Best-Selling Products:");
    result.rows.forEach((product: any, index: number) => {
      console.log(
        `#${index + 1} | ID: ${product.id} | Name: ${
          product.name
        } | Units Sold: ${product.total_sold}`
      );
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
  } finally {
    client.release();
    await db.close();
  }
}

async function fetchPixPaymentsFromLastMonth() {
  const client = await db.connect();
  const start = Date.now();
  console.log("Fetching PIX payments from the last month...");

  try {
    const result = await client.query(
      `SELECT 
         p.id, 
         p.id_pedido AS order_id, 
         p.status, 
         p.data_pagamento AS payment_date
       FROM pagamento p
       WHERE p.tipo = 'pix'
         AND p.data_pagamento >= NOW() - INTERVAL '1 month'
       ORDER BY p.data_pagamento DESC`
    );

    logTime("Fetch PIX Payments Query", start, 3);

    if (result.rowCount === 0) {
      console.log("No PIX payments found in the last month.");
      return;
    }

    console.log(`${result.rowCount} PIX payments found in the last month`);
  } catch (error) {
    console.log("Error fetching PIX payments:", error);
  } finally {
    client.release();
    await db.close();
  }
}

async function getTotalSpentByClient(email: string) {
  const client = await db.connect();
  const start = Date.now();
  console.log(`Calculating total spent by client with email: ${email}`);

  try {
    const result = await client.query(
      `SELECT 
         c.nome AS client_name,
         c.email,
         SUM(p.valor_total) AS total_spent
       FROM cliente c
       JOIN pedido p ON c.id = p.id_cliente
       WHERE c.email = $1
         AND p.data_pedido >= NOW() - INTERVAL '3 months'
       GROUP BY c.nome, c.email`,
      [email]
    );

    logTime("Get Total Spent By Client Query", start, 3);

    if (result.rowCount === 0) {
      console.log("No orders found for this client in the last 3 months.");
      return;
    }

    const row = result.rows[0];
    console.log(
      `Client: ${row.client_name} | Email: ${row.email} | Total Spent (last 3 months): R$ ${row.total_spent}`
    );
  } catch (error) {
    console.error("Error fetching total spent by client:", error);
  } finally {
    client.release();
    await db.close();
  }
}

// Query 1: Buscar cliente por email e listar seus últimos 3 pedidos
// fetchClientAndRecentOrders("0Eve.Cartwright49@yahoo.com");

// Query 2: Buscar produtos por categoria e ordenar por preço
// fetchProductsByCategorySorted("Tools");

// Query 3: Listar pedidos de um cliente com status “entregue”
// fetchDeliveredOrdersByClientEmail("1Johann.Mann@hotmail.com");

// Query 4: Obter os 5 produtos mais vendidos
// fetchTop5BestSellingProducts();

// Query 5: Consultar pagamentos feitos via PIX no último mês
// fetchPixPaymentsFromLastMonth();

// Query 6: Obter o valor total gasto por um cliente em pedidos realizados em um determinado período (ex.: último 3 meses)
// getTotalSpentByClient("1Timmy.Ziemann@yahoo.com");
