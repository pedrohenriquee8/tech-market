import { CassandraConnection } from "@infra/cassandra/connection";
import { logTime } from "@scripts/logTime";
import dayjs from "dayjs";
import { types } from "cassandra-driver";

const connection = new CassandraConnection();

async function fetchClientAndRecentOrders(email: string) {
  await connection.connect();
  const start = Date.now();
  console.log(`Fetching client and recent orders for email: ${email}`);

  try {
    const clientResult = await connection.execute(
      "SELECT id, nome FROM clientes WHERE email = ? LIMIT 1 ALLOW FILTERING",
      [email]
    );
    const clientData = clientResult.first();

    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    const ordersResult = await connection.execute(
      `SELECT id_pedido, data_pedido, status, valor_total 
       FROM pedidos_por_cliente 
       WHERE id_cliente = ? 
       ORDER BY data_pedido DESC 
       LIMIT 3`,
      [clientData.id]
    );

    console.log("Recent orders:", ordersResult.rows);
    logTime("Fetch Client and Recent Orders Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching client/orders:", error);
  } finally {
    await connection.close();
  }
}

async function fetchProductsByCategorySorted(category: string) {
  await connection.connect();
  const start = Date.now();
  console.log(`Fetching products in category: ${category}`);

  try {
    const result = await connection.execute(
      `SELECT id, nome, preco, estoque FROM produtos WHERE categoria = ? ALLOW FILTERING`,
      [category]
    );

    if (result.rows.length === 0) {
      console.log(`No products found in category: ${category}`);
      return;
    }

    const products = result.rows.sort((a, b) => a.preco - b.preco);

    console.log(`${products.length} products found:`, products);
    logTime("Fetch Products By Category Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching products by category:", error);
  } finally {
    await connection.close();
  }
}

async function fetchDeliveredOrdersByClientEmail(email: string) {
  await connection.connect();
  const start = Date.now();
  console.log(`Fetching delivered orders for client email: ${email}`);

  try {
    const clientResult = await connection.execute(
      "SELECT id FROM clientes WHERE email = ? LIMIT 1 ALLOW FILTERING",
      [email]
    );
    const clientData = clientResult.first();

    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    const allOrdersResult = await connection.execute(
      `SELECT id_pedido, data_pedido, valor_total, status 
       FROM pedidos_por_cliente 
       WHERE id_cliente = ?`,
      [clientData.id]
    );

    const delivered = allOrdersResult.rows
      .filter((order: types.Row) => order.status === "DELIVERED")
      .sort(
        (a: types.Row, b: types.Row) =>
          new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime()
      );

    if (delivered.length === 0) {
      console.log(`No delivered orders found for email: ${email}`);
      return;
    }

    console.log(`${delivered.length} delivered orders:`, delivered);
    logTime("Fetch Delivered Orders Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
  } finally {
    await connection.close();
  }
}

async function fetchTop5BestSellingProducts() {
  await connection.connect();
  const start = Date.now();
  console.log("Fetching top 5 best-selling products...");

  try {
    const allOrdersResult = await connection.execute(
      "SELECT itens FROM pedidos_por_cliente"
    );

    const salesCount = new Map<string, number>();

    for (const order of allOrdersResult.rows) {
      if (order.itens) {
        for (const item of order.itens) {
          salesCount.set(
            item.id_produto,
            (salesCount.get(item.id_produto) || 0) + item.quantidade
          );
        }
      }
    }

    if (salesCount.size === 0) {
      console.log("No product sales found.");
      return;
    }

    const sortedProducts = Array.from(salesCount.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const top5Ids = sortedProducts.slice(0, 5).map((p) => p[0]);

    const productsResult = await connection.execute(
      "SELECT id, nome FROM produtos WHERE id IN ?",
      [top5Ids]
    );
    const productNames = new Map(
      productsResult.rows.map((p) => [p.id, p.nome])
    );

    console.log("Top 5 Best-Selling Products:");
    sortedProducts.slice(0, 5).forEach((p, i) => {
      console.log(
        `#${i + 1} | ID: ${p[0]} | Name: ${
          productNames.get(p[0]) || "N/A"
        } | Units Sold: ${p[1]}`
      );
    });

    logTime("Fetch Top 5 Best-Selling Products Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching best-selling products:", error);
  } finally {
    await connection.close();
  }
}

async function fetchPixPaymentsFromLastMonth() {
  await connection.connect();
  const start = Date.now();
  console.log("Fetching PIX payments from the last month...");

  try {
    const oneMonthAgo = dayjs().subtract(1, "month");
    const allOrdersResult = await connection.execute(
      "SELECT id_pedido, pagamento FROM pedidos_por_cliente"
    );

    const pixPayments: any[] = [];

    for (const order of allOrdersResult.rows) {
      if (order.pagamento) {
        for (const payment of order.pagamento) {
          if (
            payment.tipo === "pix" &&
            dayjs(payment.data_pagamento).isAfter(oneMonthAgo)
          ) {
            pixPayments.push({
              id: payment.id,
              order_id: order.id_pedido,
              status: payment.status,
              payment_date: payment.data_pagamento,
            });
          }
        }
      }
    }

    if (pixPayments.length === 0) {
      console.log("No PIX payments found in the last month.");
      return;
    }

    const sortedPayments = pixPayments.sort(
      (a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );

    console.log(`${sortedPayments.length} PIX payments found:`, sortedPayments);
    logTime("Fetch PIX Payments Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching PIX payments:", error);
  } finally {
    await connection.close();
  }
}

async function getTotalSpentByClient(email: string) {
  await connection.connect();
  const start = Date.now();
  console.log(`Calculating total spent by client with email: ${email}`);

  try {
    const clientResult = await connection.execute(
      "SELECT id, nome FROM clientes WHERE email = ? LIMIT 1 ALLOW FILTERING",
      [email]
    );
    const clientData = clientResult.first();

    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    const threeMonthsAgo = dayjs().subtract(3, "months");
    const ordersResult = await connection.execute(
      "SELECT data_pedido, valor_total FROM pedidos_por_cliente WHERE id_cliente = ?",
      [clientData.id]
    );

    let totalSpent = 0;
    for (const order of ordersResult.rows) {
      if (dayjs(order.data_pedido).isAfter(threeMonthsAgo)) {
        totalSpent += order.valor_total;
      }
    }

    if (totalSpent === 0) {
      console.log("No orders found for this client in the last 3 months.");
      return;
    }

    console.log(
      `Client: ${
        clientData.nome
      } | Email: ${email} | Total Spent (last 3 months): R$ ${totalSpent.toFixed(
        2
      )}`
    );
    logTime("Get Total Spent By Client Query (Cassandra)", start, 3);
  } catch (error) {
    console.error("Error fetching total spent by client:", error);
  } finally {
    await connection.close();
  }
}

// Query 1: Buscar cliente por email e listar seus últimos 3 pedidos
// fetchClientAndRecentOrders("12781-Tessie_Dare97@hotmail.com");

// Query 2: Buscar produtos por categoria e ordenar por preço
// fetchProductsByCategorySorted("Tools");

// Query 3: Listar pedidos de um cliente com status “entregue”
// fetchDeliveredOrdersByClientEmail("12781-Tessie_Dare97@hotmail.com");

// Query 4: Obter os 5 produtos mais vendidos
// fetchTop5BestSellingProducts();

// Query 5: Consultar pagamentos feitos via PIX no último mês
fetchPixPaymentsFromLastMonth();

// Query 6: Obter o valor total gasto por um cliente em pedidos realizados em um determinado período (ex.: último 3 meses)
// getTotalSpentByClient("12781-Tessie_Dare97@hotmail.com");
