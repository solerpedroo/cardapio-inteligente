const Groq = require('groq-sdk');
const { pool } = require('../config/database');

// Inicializar Groq com validação
let groq;
try {
    if (!process.env.GROQ_API_KEY) {
        console.error('⚠️  ATENÇÃO: GROQ_API_KEY não configurada!');
        console.log('   Configure a chave no arquivo .env');
        console.log('   Obtenha em: https://console.groq.com/\n');
    } else {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        console.log('✅ Groq SDK inicializado');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar Groq SDK:', error.message);
}

// Gerar cardápio com Groq
async function gerarCardapio(req, res) {
    const startTime = Date.now();
    const { 
        tipoRefeicao, 
        ocasiao, 
        numeroPessoas, 
        orcamento, 
        preferencias, 
        restricoes,
        usuarioId 
    } = req.body;

    // Validação da API Key
    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
            sucesso: false,
            erro: 'API Key do Groq não configurada. Configure GROQ_API_KEY no arquivo .env'
        });
    }

    try {
        console.log('📝 Gerando cardápio com os dados:', { tipoRefeicao, ocasiao, numeroPessoas });
        
        // Construir prompt otimizado
        const prompt = `Você é um chef especialista em criar cardápios personalizados.

Crie um cardápio detalhado com as seguintes especificações:
- Tipo de refeição: ${tipoRefeicao}
- Ocasião: ${ocasiao || 'casual'}
- Número de pessoas: ${numeroPessoas}
- Orçamento: R$ ${orcamento || 'moderado'}
- Preferências: ${preferencias || 'sem preferências específicas'}
- Restrições alimentares: ${restricoes || 'nenhuma'}

Forneça o cardápio em formato JSON com a seguinte estrutura:
{
  "titulo": "nome do cardápio",
  "descricao": "descrição breve",
  "pratos": [
    {
      "nome": "nome do prato",
      "categoria": "entrada/prato principal/sobremesa/bebida",
      "descricao": "descrição detalhada",
      "ingredientes": ["lista", "de", "ingredientes"],
      "tempoPreparo": "tempo estimado",
      "dificuldade": "fácil/média/difícil",
      "custoEstimado": "valor em reais"
    }
  ],
  "dicasChef": ["dica 1", "dica 2"],
  "tempoTotalPreparo": "tempo total"
}

Retorne APENAS o JSON, sem texto adicional.`;

        console.log('🤖 Chamando API Groq...');

        // Chamar API Groq com tratamento de erros
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Você é um chef profissional especializado em criar cardápios personalizados. Sempre responda em português do Brasil com JSON válido."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: false
        });

        console.log('✅ Resposta recebida do Groq');

        const resposta = chatCompletion.choices[0]?.message?.content || '';
        
        if (!resposta) {
            throw new Error('Groq retornou resposta vazia');
        }
        
        const tempoResposta = Date.now() - startTime;
        
        // Extrair JSON da resposta
        let cardapioJson;
        try {
            console.log('📦 Processando resposta...');
            // Remover possíveis marcadores de código e espaços
            let jsonText = resposta.trim();
            
            // Remover markdown code blocks se existirem
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Tentar encontrar JSON no texto
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }
            
            cardapioJson = JSON.parse(jsonText);
            console.log('✅ JSON parseado com sucesso');
            
        } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError.message);
            console.log('Resposta recebida:', resposta.substring(0, 500));
            
            // Retornar um cardápio de fallback estruturado
            cardapioJson = {
                erro: "Não foi possível gerar o cardápio no formato esperado",
                titulo: `Cardápio de ${tipoRefeicao}`,
                descricao: "O sistema está processando sua solicitação. Tente novamente.",
                pratos: [],
                dicasChef: ["Tente novamente em alguns instantes"],
                tempoTotalPreparo: "Não disponível",
                respostaOriginal: resposta.substring(0, 1000)
            };
        }

        // Salvar no banco de dados (apenas se conectado)
        let cardapioId = null;
        try {
            const [result] = await pool.execute(
                `INSERT INTO cardapios (usuario_id, tipo_refeicao, ocasiao, numero_pessoas, orcamento, conteudo_json, prompt_usado) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuarioId || null,
                    tipoRefeicao,
                    ocasiao || null,
                    numeroPessoas,
                    orcamento || null,
                    JSON.stringify(cardapioJson),
                    prompt
                ]
            );
            cardapioId = result.insertId;

            // Salvar histórico
            await pool.execute(
                `INSERT INTO historico_geracoes (usuario_id, prompt, resposta, tokens_usados, tempo_resposta_ms) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    usuarioId || null,
                    prompt,
                    resposta,
                    chatCompletion.usage?.total_tokens || 0,
                    tempoResposta
                ]
            );
            console.log('💾 Salvo no banco de dados');
        } catch (dbError) {
            console.warn('⚠️ Erro ao salvar no banco:', dbError.message);
            // Continuar mesmo se falhar ao salvar
        }

        console.log('🎉 Cardápio gerado com sucesso!');

        res.json({
            sucesso: true,
            cardapioId: cardapioId,
            cardapio: cardapioJson,
            metadata: {
                tempoResposta: `${tempoResposta}ms`,
                tokensUsados: chatCompletion.usage?.total_tokens || 0,
                modelo: "llama-3.3-70b-versatile"
            }
        });

    } catch (error) {
        console.error('❌ Erro ao gerar cardápio:', error);
        
        // Resposta de erro mais detalhada
        const errorMessage = error.message || 'Erro desconhecido';
        const errorDetails = {
            sucesso: false,
            erro: errorMessage
        };
        
        // Adicionar detalhes específicos baseado no tipo de erro
        if (errorMessage.includes('API key')) {
            errorDetails.solucao = 'Verifique se a GROQ_API_KEY está configurada corretamente no arquivo .env';
        } else if (errorMessage.includes('rate limit')) {
            errorDetails.solucao = 'Limite de requisições atingido. Aguarde alguns minutos e tente novamente.';
        } else if (errorMessage.includes('timeout')) {
            errorDetails.solucao = 'Tempo limite excedido. Tente novamente com um prompt mais simples.';
        }
        
        res.status(500).json(errorDetails);
    }
}

// Buscar histórico de cardápios
async function buscarHistorico(req, res) {
    try {
        const { usuarioId } = req.params;
        const [rows] = await pool.execute(
            `SELECT id, tipo_refeicao, ocasiao, numero_pessoas, orcamento, conteudo_json, criado_em 
             FROM cardapios 
             WHERE usuario_id = ? OR usuario_id IS NULL 
             ORDER BY criado_em DESC 
             LIMIT 20`,
            [usuarioId]
        );

        const cardapios = rows.map(row => ({
            ...row,
            conteudo_json: JSON.parse(row.conteudo_json)
        }));

        res.json({ sucesso: true, cardapios });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
}

// Adicionar aos favoritos
async function adicionarFavorito(req, res) {
    console.log('📌 Requisição de adicionar favorito recebida');
    console.log('Body:', req.body);
    
    try {
        const { usuarioId, cardapioId, nomePrato, descricao } = req.body;
        
        if (!usuarioId || !cardapioId || !nomePrato) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Dados incompletos: usuarioId, cardapioId e nomePrato são obrigatórios'
            });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO favoritos (usuario_id, cardapio_id, nome_prato, descricao) 
             VALUES (?, ?, ?, ?)`,
            [usuarioId, cardapioId, nomePrato, descricao || null]
        );

        console.log('✅ Favorito adicionado com sucesso, ID:', result.insertId);

        res.json({ 
            sucesso: true, 
            mensagem: 'Prato adicionado aos favoritos!',
            favoritoId: result.insertId
        });
        
    } catch (error) {
        console.error('❌ Erro ao adicionar favorito:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
}

// Buscar favoritos
async function buscarFavoritos(req, res) {
    try {
        const { usuarioId } = req.params;
        const [rows] = await pool.execute(
            `SELECT f.*, c.conteudo_json 
             FROM favoritos f 
             JOIN cardapios c ON f.cardapio_id = c.id 
             WHERE f.usuario_id = ? 
             ORDER BY f.criado_em DESC`,
            [usuarioId]
        );

        res.json({ sucesso: true, favoritos: rows });
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
}

module.exports = {
    gerarCardapio,
    buscarHistorico,
    adicionarFavorito,
    buscarFavoritos
};