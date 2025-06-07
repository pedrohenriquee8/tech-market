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
-- 1. Cria a função que fará a atualização
CREATE OR REPLACE FUNCTION fn_atualizar_valor_total() RETURNS TRIGGER AS $$ BEGIN -- Atualiza o valor_total na tabela 'pedido' somando o valor do novo item
UPDATE pedido
SET valor_total = valor_total + (NEW.quantidade * NEW.valor_unitario)
WHERE id = NEW.id_pedido;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 2. Cria o trigger que é acionado após a inserção em 'pedido_item'
CREATE TRIGGER trg_atualizar_valor_pedido
AFTER
INSERT ON pedido_item FOR EACH ROW EXECUTE FUNCTION fn_atualizar_valor_total();