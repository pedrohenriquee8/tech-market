import { MongoDBConnection } from "@infra/mongodb/connection";
import { logTime } from "@scripts/logTime";
import dayjs from "dayjs";

const connection = new MongoDBConnection();

async function fetchClientAndRecentOrders(email: string) {
  const db = await connection.connect();
  const start = Date.now();
  console.log(`Fetching client and recent orders for email: ${email}`);

  try {
    // 1) Find client
    const clientData = await db
      .collection("clients")
      .findOne({ email }, { projection: { id: 1, nome: 1 } });

    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    // 2) Find last 3 orders
    const recentOrders = await db
      .collection("orders")
      .find({ id_cliente: clientData.id })
      .sort({ data_pedido: -1 })
      .limit(3)
      .project({ id: 1, data_pedido: 1, status: 1, valor_total: 1 })
      .toArray();

    console.log("Recent orders:", recentOrders);
    logTime("Fetch Client and Recent Orders Query", start, 3);
  } catch (error) {
    console.error("Error fetching client/orders:", error);
  } finally {
    await connection.close();
  }
}

async function fetchProductsByCategorySorted(category: string) {
  const db = await connection.connect();
  const start = Date.now();
  console.log(`Fetching products in category: ${category}`);

  try {
    const products = await db
      .collection("products")
      .find({ categoria: category })
      .sort({ preco: 1 })
      .project({ id: 1, nome: 1, preco: 1, estoque: 1 })
      .toArray();

    if (products.length === 0) {
      console.log(`No products found in category: ${category}`);
      return;
    }

    console.log(`${products.length} products found:`, products);
    logTime("Fetch Products By Category Query", start, 3);
  } catch (error) {
    console.error("Error fetching products by category:", error);
  } finally {
    await connection.close();
  }
}

async function fetchDeliveredOrdersByClientEmail(email: string) {
  const db = await connection.connect();
  const start = Date.now();
  console.log(`Fetching delivered orders for client email: ${email}`);

  try {
    // find client id
    const clientData = await db
      .collection("clients")
      .findOne({ email }, { projection: { id: 1 } });
    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    const delivered = await db
      .collection("orders")
      .find({ id_cliente: clientData.id, status: "DELIVERED" })
      .sort({ data_pedido: -1 })
      .project({ id: 1, data_pedido: 1, valor_total: 1 })
      .toArray();

    if (delivered.length === 0) {
      console.log(`No delivered orders found for email: ${email}`);
      return;
    }

    console.log(`${delivered.length} delivered orders:`, delivered);
    logTime("Fetch Delivered Orders Query", start, 3);
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
  } finally {
    await connection.close();
  }
}

async function fetchTop5BestSellingProducts() {
  const db = await connection.connect();
  const start = Date.now();
  console.log("Fetching top 5 best-selling products...");

  try {
    const topProducts = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.id_produto",
            total_sold: { $sum: "$items.quantidade" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            id: "$_id",
            name: "$product.nome",
            total_sold: 1,
          },
        },
        { $sort: { total_sold: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    if (topProducts.length === 0) {
      console.log("No product sales found.");
      return;
    }

    console.log("Top 5 Best-Selling Products:");
    topProducts.forEach((p, i) =>
      console.log(
        `#${i + 1} | ID: ${p.id} | Name: ${p.name} | Units Sold: ${
          p.total_sold
        }`
      )
    );
    logTime("Fetch Top 5 Best-Selling Products Query", start, 3);
  } catch (error) {
    console.error("Error fetching best-selling products:", error);
  } finally {
    await connection.close();
  }
}

async function fetchPixPaymentsFromLastMonth() {
  const db = await connection.connect();
  const start = Date.now();
  console.log("Fetching PIX payments from the last month...");

  try {
    const oneMonthAgo = dayjs().subtract(1, "month").toISOString();

    const pixPayments = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$payments" },
        {
          $match: {
            "payments.tipo": "pix",
            "payments.data_pagamento": { $gte: oneMonthAgo },
          },
        },
        {
          $project: {
            id: "$payments.id",
            order_id: "$id",
            status: "$payments.status",
            payment_date: "$payments.data_pagamento",
          },
        },
        { $sort: { payment_date: -1 } },
      ])
      .toArray();

    if (pixPayments.length === 0) {
      console.log("No PIX payments found in the last month.");
      return;
    }

    console.log(`${pixPayments.length} PIX payments found:`, pixPayments);
    logTime("Fetch PIX Payments Query", start, 3);
  } catch (error) {
    console.error("Error fetching PIX payments:", error);
  } finally {
    await connection.close();
  }
}

async function getTotalSpentByClient(email: string) {
  const db = await connection.connect();
  const start = Date.now();
  console.log(`Calculating total spent by client with email: ${email}`);

  try {
    const clientData = await db
      .collection("clients")
      .findOne({ email }, { projection: { id: 1, nome: 1 } });
    if (!clientData) {
      console.log("Client not found.");
      return;
    }

    const threeMonthsAgo = dayjs().subtract(3, "months").toISOString();

    const result = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            id_cliente: clientData.id,
            data_pedido: { $gte: threeMonthsAgo },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$id_cliente",
            total_spent: {
              $sum: {
                $multiply: ["$items.quantidade", "$items.valor_unitario"],
              },
            },
          },
        },
      ])
      .toArray();

    if (result.length === 0) {
      console.log("No orders found for this client in the last 3 months.");
      return;
    }

    console.log(
      `Client: ${clientData.nome} | Email: ${email} | Total Spent (last 3 months): R$ ${result[0].total_spent}`
    );
    logTime("Get Total Spent By Client Query", start, 3);
  } catch (error) {
    console.error("Error fetching total spent by client:", error);
  } finally {
    await connection.close();
  }
}

// Query 1: Buscar cliente por email e listar seus últimos 3 pedidos
// fetchClientAndRecentOrders("email");

// Query 2: Buscar produtos por categoria e ordenar por preço
// fetchProductsByCategorySorted("Tools");

// Query 3: Listar pedidos de um cliente com status “entregue”
// fetchDeliveredOrdersByClientEmail("email");

// Query 4: Obter os 5 produtos mais vendidos
// fetchTop5BestSellingProducts();

// Query 5: Consultar pagamentos feitos via PIX no último mês
// fetchPixPaymentsFromLastMonth();

// Query 6: Obter o valor total gasto por um cliente em pedidos realizados em um determinado período (ex.: último 3 meses)
// getTotalSpentByClient("email");
