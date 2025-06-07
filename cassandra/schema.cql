-- Passo 1: Criar o Keyspace (o "banco de dados")
CREATE KEYSPACE IF NOT EXISTS tech_market
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1 -- Ideal para desenvolvimento com um único nó
};

-- Passo 2: Conectar-se ao Keyspace
USE tech_market;

-- Passo 3: Criar Tipos de Dados Personalizados (UDTs) para agrupar dados
-- UDT para representar um item dentro de um pedido
CREATE TYPE IF NOT EXISTS item_pedido (
    id_produto uuid,
    nome_produto text,
    quantidade int,
    valor_unitario decimal
);

-- UDT para representar os detalhes do pagamento
CREATE TYPE IF NOT EXISTS info_pagamento (
    tipo text,
    status text,
    data_pagamento timestamp
);


-- Passo 4: Criar as tabelas baseadas nas consultas

-- Tabela para a consulta Q3 e Q4: Encontrar todos os pedidos de um cliente
-- Esta é a tabela mais importante. Ela é DESNORMALIZADA e contém dados que
-- no SQL estariam em 'pedido', 'pedido_item' e 'pagamento'.
CREATE TABLE IF NOT EXISTS pedidos_por_cliente (
    id_cliente uuid,
    data_pedido timestamp,
    id_pedido uuid,
    status text,
    valor_total decimal,
    itens list<FROZEN<item_pedido>>, -- Lista de itens do pedido
    pagamento FROZEN<info_pagamento>,  -- Detalhes do pagamento
    PRIMARY KEY ((id_cliente), data_pedido) -- Particionado por cliente, ordenado por data
) WITH CLUSTERING ORDER BY (data_pedido DESC); -- Ordena do mais recente para o mais antigo

-- Tabela para a consulta Q2: Encontrar um produto pelo ID
CREATE TABLE IF NOT EXISTS produtos (
    id uuid PRIMARY KEY,
    nome text,
    categoria text,
    preco decimal,
    estoque int
);

-- Tabela para a consulta Q1: Encontrar um cliente pelo ID
CREATE TABLE IF NOT EXISTS clientes (
    id uuid PRIMARY KEY,
    nome text,
    email text,
    telefone text,
    data_cadastro timestamp,
    cpf text
);