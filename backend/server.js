const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const menuRoutes = require('./routes/menu');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/menu', menuRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.stack);
    res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        mensagem: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
async function startServer() {
    try {
        // Testar conexão com banco de dados
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.warn('⚠️  Servidor iniciando sem conexão com banco de dados');
        }

        app.listen(PORT, () => {
            console.log('\n🍽️  ===================================');
            console.log('   CARDÁPIO INTELIGENTE - SERVER');
            console.log('   ===================================');
            console.log(`   🚀 Servidor rodando em: http://localhost:${PORT}`);
            console.log(`   📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   💾 Banco de dados: ${dbConnected ? 'Conectado ✅' : 'Desconectado ❌'}`);
            console.log('   ===================================\n');
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recebido. Encerrando servidor...');
    process.exit(0);
});

startServer();