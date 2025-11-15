const express = require('express');
const router = express.Router();
const {
    gerarCardapio,
    buscarHistorico,
    adicionarFavorito,
    buscarFavoritos
} = require('../controllers/menuController');

// Log de requisições
router.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// Rota para gerar cardápio
router.post('/gerar', gerarCardapio);

// Rotas de histórico
router.get('/historico/:usuarioId', buscarHistorico);

// Rotas de favoritos - CORRIGIDAS
router.post('/favoritos', adicionarFavorito);
router.get('/favoritos/:usuarioId', buscarFavoritos);

// Rota de teste
router.get('/test', (req, res) => {
    res.json({ message: 'API funcionando!' });
});

module.exports = router;