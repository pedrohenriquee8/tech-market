import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const NUM_CLIENTS = 20000;
const NUM_PRODUCTS = 5000;
const NUM_ORDERS = 30000;

type PaymentType = "cartao" | "boleto" | "pix";
const PaymentTypeArray: PaymentType[] = ["cartao", "boleto", "pix"];

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

interface PedidoItem {
  id: string;
  id_produto: string;
  quantidade: number;
  valor_unitario: number;
}

interface Pagamento {
  id: string;
  tipo: PaymentType;
  status: string;
  data_pagamento: string;
}

interface Pedido {
  id: string;
  id_cliente: string;
  data_pedido: string;
  status: string;
  items: PedidoItem[];
  payments: Pagamento[];
}

// Gera clientes
const seedClients = (): Cliente[] => {
  const clients: Cliente[] = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    clients.push({
      id: uuidv4(),
      nome: faker.person.firstName(),
      email: `${i}-${faker.internet.email()}`,
      telefone: faker.phone.number({ style: "international" }),
      cpf: faker.string.numeric(11),
    });
  }
  return clients;
};
const clients = seedClients();

// Gera produtos
const seedProducts = (): Produto[] => {
  const products: Produto[] = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    products.push({
      id: uuidv4(),
      nome: faker.commerce.productName(),
      categoria: faker.commerce.department(),
      preco: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
      estoque: faker.number.int({ min: 1, max: 1000 }),
    });
  }
  return products;
};
const products = seedProducts();

// Gera pedidos com itens e pagamentos embutidos
const seedOrders = (): Pedido[] => {
  const orders: Pedido[] = [];

  for (let i = 0; i < NUM_ORDERS; i++) {
    const orderDate = faker.date
      .between({
        from: dayjs().subtract(1, "year").toISOString(),
        to: dayjs().toISOString(),
      })
      .toISOString();

    // Gera itens do pedido
    const items: PedidoItem[] = [];
    const numItems = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(products);
      items.push({
        id: uuidv4(),
        id_produto: product.id,
        quantidade: faker.number.int({ min: 1, max: 10 }),
        valor_unitario: product.preco,
      });
    }

    // Gera pagamento (único) para o pedido
    const payments: Pagamento[] = [];
    const paymentDate = faker.date
      .between({
        from: orderDate,
        to: dayjs().toISOString(),
      })
      .toISOString();
    payments.push({
      id: uuidv4(),
      tipo: faker.helpers.arrayElement(PaymentTypeArray),
      status: faker.helpers.arrayElement(["PENDING", "COMPLETED", "FAILED"]),
      data_pagamento: paymentDate,
    });

    // Monta o pedido completo
    orders.push({
      id: uuidv4(),
      id_cliente: faker.helpers.arrayElement(clients).id,
      status: faker.helpers.arrayElement(["PENDING", "SHIPPED", "DELIVERED"]),
      data_pedido: orderDate,
      items,
      payments,
    });
  }

  return orders;
};
const orders = seedOrders();

export {
  clients,
  products,
  orders,
  Cliente,
  Produto,
  Pedido,
  PedidoItem,
  Pagamento,
  PaymentType,
};
