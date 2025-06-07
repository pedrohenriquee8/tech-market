-- Tabela cliente
CREATE TABLE IF NOT EXISTS cliente (
  id VARCHAR(100) PRIMARY KEY NOT NULL,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cpf VARCHAR(14) UNIQUE NOT NULL
);
-- Tabela produto
CREATE TABLE IF NOT EXISTS produto (
  id VARCHAR(100) PRIMARY KEY NOT NULL,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  preco NUMERIC(10, 2) NOT NULL,
  estoque INT NOT NULL
);
-- Tabela pedido
CREATE TABLE IF NOT EXISTS pedido (
  id VARCHAR(100) PRIMARY KEY NOT NULL,
  id_cliente VARCHAR(100) REFERENCES cliente(id),
  data_pedido TIMESTAMP,
  status VARCHAR(50),
  valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);
-- Tabela pedido_item
CREATE TABLE IF NOT EXISTS pedido_item (
  id VARCHAR(100) PRIMARY KEY NOT NULL,
  id_pedido VARCHAR(100) REFERENCES pedido(id) ON DELETE CASCADE,
  id_produto VARCHAR(100) REFERENCES produto(id),
  quantidade INT NOT NULL,
  valor_unitario NUMERIC(10, 2) NOT NULL
);
-- Tabela pagamento
CREATE TABLE IF NOT EXISTS pagamento (
  id VARCHAR(100) PRIMARY KEY NOT NULL,
  id_pedido VARCHAR(100) REFERENCES pedido(id),
  tipo VARCHAR(20) CHECK (tipo IN ('cartao', 'pix', 'boleto')),
  status VARCHAR(20),
  data_pagamento TIMESTAMP
);