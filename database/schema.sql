-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS cardapio_inteligente CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cardapio_inteligente;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    preferencias_alimentares TEXT,
    restricoes_alimentares TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

select * from usuarios;

-- Tabela de cardápios gerados
CREATE TABLE IF NOT EXISTS cardapios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo_refeicao VARCHAR(50) NOT NULL,
    ocasiao VARCHAR(100),
    numero_pessoas INT DEFAULT 1,
    orcamento DECIMAL(10, 2),
    conteudo_json TEXT NOT NULL,
    prompt_usado TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

select * from cardapios;

-- Tabela de pratos favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cardapio_id INT NOT NULL,
    nome_prato VARCHAR(200) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (cardapio_id) REFERENCES cardapios(id) ON DELETE CASCADE
);

select * from favoritos;

-- Tabela de histórico de gerações
CREATE TABLE IF NOT EXISTS historico_geracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    prompt TEXT NOT NULL,
    resposta TEXT NOT NULL,
    tokens_usados INT,
    tempo_resposta_ms INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Inserir usuário de exemplo
INSERT INTO usuarios (nome, email, preferencias_alimentares, restricoes_alimentares) 
VALUES ('Usuário Demo', 'demo@cardapio.com', 'Comida brasileira, italiana', 'Sem glúten');

-- Índices para melhor performance
CREATE INDEX idx_cardapios_usuario ON cardapios(usuario_id);
CREATE INDEX idx_cardapios_criado ON cardapios(criado_em);
CREATE INDEX idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX idx_historico_usuario ON historico_geracoes(usuario_id);