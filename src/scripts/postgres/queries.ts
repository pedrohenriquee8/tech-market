import { PostgresConnection } from "@infra/postgres/connection";

const db = new PostgresConnection();

async function fetchClientAndRecentOrders(email: string) {
  const client = await db.connect();
  const start = Date.now();

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

    const ordersResult = await client.query(
      `SELECT id, data_pedido, status, valor_total
       FROM pedido
       WHERE id_cliente = $1
       ORDER BY data_pedido DESC
       LIMIT 3`,
      [clientData.id]
    );

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

    console.log(`Client: ${clientData.nome}`);
    console.log("Last 3 orders:");
    ordersResult.rows.forEach((order: any, index: number) => {
      console.log(
        `#${index + 1} | ID: ${
          order.id
        } | Date: ${order.data_pedido.toISOString()} | Status: ${
          order.status
        } | Total: $${order.valor_total}`
      );
    });
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

  try {
    const result = await client.query(
      `SELECT id, nome, preco, estoque
       FROM produto
       WHERE categoria = $1
       ORDER BY preco ASC`,
      [category]
    );

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

    if (result.rowCount === 0) {
      console.log(`No products found in category: ${category}`);
      return;
    }

    console.log(`Products in category: ${category}`);
    result.rows.forEach((product: any, index: number) => {
      console.log(
        `#${index + 1} | ID: ${product.id} | Name: ${product.nome} | Price: $${
          product.preco
        } | Stock: ${product.estoque}`
      );
    });
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

  try {
    const result = await client.query(
      `SELECT p.id, p.data_pedido, p.valor_total
       FROM pedido p
       INNER JOIN cliente c ON p.id_cliente = c.id
       WHERE c.email = $1 AND p.status = 'DELIVERED'
       ORDER BY p.data_pedido DESC`,
      [email]
    );

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

    if (result.rowCount === 0) {
      console.log(`No delivered orders found for email: ${email}`);
      return;
    }

    console.log(`Delivered orders for client: ${email}`);
    result.rows.forEach((order: any, index: number) => {
      console.log(
        `#${index + 1} | Order ID: ${order.id} | Date: ${
          order.data_pedido
        } | Total: $${order.valor_total}`
      );
    });
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

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

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

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

    if (result.rowCount === 0) {
      console.log("No PIX payments found in the last month.");
      return;
    }

    console.log("PIX Payments from the Last Month:");
    result.rows.forEach((payment: any) => {
      console.log(
        `Payment ID: ${payment.id} | Order ID: ${payment.order_id} | Status: ${payment.status} | Date: ${payment.payment_date}`
      );
    });
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

    const duration = ((Date.now() - start) / 1000).toFixed(3);
    console.log(`Query executed in ${duration} seconds`);

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
// fetchClientAndRecentOrders("wilbert.deckow.dds311@example.com");

// Query 2: Buscar produtos por categoria e ordenar por preço
// fetchProductsByCategorySorted("Tools");

// Query 3: Listar pedidos de um cliente com status “entregue”
// fetchDeliveredOrdersByClientEmail("rosa.jakubowski1465@example.com");

// Query 4: Obter os 5 produtos mais vendidos
// fetchTop5BestSellingProducts();

// Query 5: Consultar pagamentos feitos via PIX no último mês
// fetchPixPaymentsFromLastMonth();

// Query 6: Obter o valor total gasto por um cliente em pedidos realizados em um determinado período (ex.: último 3 meses)
// getTotalSpentByClient("wilbert.deckow.dds311@example.com");
