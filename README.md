# 🍽️ Cardápio Inteligente - AI Powered

Sistema completo de geração de cardápios personalizados usando **Groq LLM** com interface moderna e animações suaves.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** + **Express.js**
- **MySQL** (Banco de dados)
- **Groq SDK** (LLM API)
- **dotenv** (Variáveis de ambiente)

### Frontend
- **HTML5** + **CSS3** + **JavaScript Vanilla**
- Design responsivo
- Animações CSS avançadas
- Paleta de cores vermelha premium

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- MySQL (v8 ou superior)
- Conta na Groq AI (para obter API key)

## 🔧 Instalação

### 1. Clone ou baixe o projeto

```bash
git clone <seu-repositorio>
cd cardapio-inteligente
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados MySQL

Acesse o MySQL e execute o arquivo `database/schema.sql`:

```bash
mysql -u root -p < database/schema.sql
```

Ou através do MySQL Workbench/phpMyAdmin, copie e execute o conteúdo do arquivo.

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações do MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=cardapio_inteligente
DB_PORT=3306

# API Groq (obtenha em: https://console.groq.com/)
GROQ_API_KEY=sua_chave_groq_aqui

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 5. Obtenha sua API Key do Groq

1. Acesse: https://console.groq.com/
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Crie uma nova chave
5. Copie e cole no arquivo `.env`

## ▶️ Como Executar

### Teste a configuração primeiro

Antes de iniciar o servidor, teste se tudo está configurado:

```bash
# Testar conexão com Groq API
node test-groq.js
```

Se o teste passar, você verá: `🎉 Groq AI está configurado corretamente!`

### Modo Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
cardapio-inteligente/
├── frontend/
│   ├── index.html          # Interface principal
│   ├── css/
│   │   └── style.css       # Estilos com animações
│   └── js/
│       └── app.js          # Lógica do frontend
│
├── backend/
│   ├── server.js           # Servidor Express
│   ├── config/
│   │   └── database.js     # Conexão MySQL
│   ├── routes/
│   │   └── menu.js         # Rotas da API
│   └── controllers/
│       └── menuController.js  # Lógica de negócio
│
├── database/
│   └── schema.sql          # Schema do banco
│
├── .env                    # Variáveis de ambiente
├── package.json            # Dependências
└── README.md              # Este arquivo
```

## 🎯 Funcionalidades

### ✨ Geração de Cardápios
- Tipo de refeição (café, almoço, jantar, etc.)
- Ocasião especial
- Número de pessoas
- Orçamento
- Preferências alimentares
- Restrições alimentares
- Geração em tempo real com Groq AI

### 📋 Histórico
- Visualize todos os cardápios gerados
- Filtros por tipo e data
- Reload de cardápios anteriores

### ❤️ Favoritos
- Salve seus cardápios preferidos
- Acesso rápido aos favoritos
- Gerenciamento de lista

## 🎨 Design Features

- **Paleta Vermelha Premium**: Cores vibrantes e modernas
- **Animações Suaves**: Transições e efeitos CSS
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Loading States**: Feedback visual durante operações
- **Notificações**: Sistema de toast para feedback