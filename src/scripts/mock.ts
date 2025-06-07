import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const NUM_CLIENTS = 20000;
const NUM_PRODUCTS = 5000;
const NUM_ORDERS = 30000;

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
}

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
}

interface Pedido {
  id: string;
  id_cliente: string;
  data_pedido: string;
  status: string;
}

interface PedidoItem {
  id: string;
  id_pedido: string;
  id_produto: string;
  quantidade: number;
  valor_unitario: number;
}

type PaymentType = "cartao" | "boleto" | "pix";

const PaymentTypeArray: PaymentType[] = ["cartao", "boleto", "pix"];

interface Pagamento {
  id: string;
  id_pedido: string;
  tipo: PaymentType;
  status: string;
  data_pagamento: string;
}

const seedClients = () => {
  const clients: Cliente[] = [];

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = {
      id: uuidv4(),
      nome: faker.person.firstName(),
      email: i + faker.internet.email(),
      telefone: faker.phone.number({
        style: "international",
      }),
      cpf: faker.string.numeric(11),
    };

    clients.push(client);
  }

  return clients;
};

const clients = seedClients();

const seedProducts = () => {
  const products: Produto[] = [];

  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const product = {
      id: uuidv4(),
      nome: faker.commerce.productName(),
      categoria: faker.commerce.department(),
      preco: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
      estoque: faker.number.int({ min: 1, max: 1000 }),
    };

    products.push(product);
  }

  return products;
};

const products = seedProducts();

const seedOrders = () => {
  const orders: Pedido[] = [];

  for (let i = 0; i < NUM_ORDERS; i++) {
    const order = {
      id: uuidv4(),
      id_cliente: faker.helpers.arrayElement(clients).id,
      status: faker.helpers.arrayElement(["PENDING", "SHIPPED", "DELIVERED"]),
      data_pedido: faker.date
        .between({
          from: dayjs().subtract(1, "year").toISOString(),
          to: dayjs().toISOString(),
        })
        .toISOString(),
    };

    orders.push(order);
  }

  return orders;
};

const orders = seedOrders();

const seedOrderItems = () => {
  const orderItems: PedidoItem[] = [];

  for (const order of orders) {
    const numItems = faker.number.int({ min: 1, max: 5 });

    for (let i = 0; i < numItems; i++) {
      const product = faker.helpers.arrayElement(products);

      const orderItem = {
        id: uuidv4(),
        id_pedido: order.id,
        id_produto: product.id,
        quantidade: faker.number.int({ min: 1, max: 10 }),
        valor_unitario: product.preco,
      };

      orderItems.push(orderItem);
    }
  }

  return orderItems;
};

const orderItems = seedOrderItems();

const seedPayments = () => {
  const payments: Pagamento[] = [];

  for (const order of orders) {
    const payment = {
      id: uuidv4(),
      id_pedido: order.id,
      tipo: faker.helpers.arrayElement(PaymentTypeArray),
      status: faker.helpers.arrayElement(["PENDING", "COMPLETED", "FAILED"]),
      data_pagamento: faker.date
        .between({
          from: order.data_pedido,
          to: dayjs().toISOString(),
        })
        .toISOString(),
    };

    payments.push(payment);
  }

  return payments;
};

const payments = seedPayments();

export {
  clients,
  products,
  orders,
  orderItems,
  payments,
  Cliente,
  Produto,
  Pedido,
  PedidoItem,
  Pagamento,
  PaymentType,
};
