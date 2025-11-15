/**
 * Script para testar a conexão com a API do Groq
 * Execute: node test-groq.js
 */

require('dotenv').config();
const Groq = require('groq-sdk');

async function testarGroq() {
    console.log('\n🧪 Testando configuração do Groq AI...\n');
    
    // Verificar se a API key está configurada
    if (!process.env.GROQ_API_KEY) {
        console.error('❌ ERRO: GROQ_API_KEY não encontrada no arquivo .env');
        console.log('\n💡 Solução:');
        console.log('1. Crie um arquivo .env na raiz do projeto');
        console.log('2. Adicione: GROQ_API_KEY=sua_chave_aqui');
        console.log('3. Obtenha sua chave em: https://console.groq.com/\n');
        process.exit(1);
    }
    
    console.log('✅ API Key encontrada:', process.env.GROQ_API_KEY.substring(0, 10) + '...');
    
    try {
        console.log('\n🔄 Testando conexão com Groq...');
        
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: "Responda apenas com a palavra 'OK'"
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 10
        });
        
        const resposta = chatCompletion.choices[0]?.message?.content || '';
        
        console.log('✅ Conexão bem-sucedida!');
        console.log('📝 Resposta do modelo:', resposta);
        console.log('🔢 Tokens usados:', chatCompletion.usage?.total_tokens || 0);
        console.log('⚡ Modelo:', chatCompletion.model);
        
        console.log('\n🎉 Groq AI está configurado corretamente!');
        console.log('✨ Você pode usar o sistema de cardápios agora.\n');
        
    } catch (error) {
        console.error('\n❌ ERRO ao conectar com Groq:');
        console.error('Mensagem:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n💡 Solução: Verifique se sua API key está correta');
            console.log('Acesse: https://console.groq.com/ para gerar uma nova chave\n');
        } else if (error.message.includes('rate limit')) {
            console.log('\n💡 Solução: Você atingiu o limite de requisições');
            console.log('Aguarde alguns minutos ou verifique seu plano em https://console.groq.com/\n');
        } else if (error.message.includes('network')) {
            console.log('\n💡 Solução: Verifique sua conexão com a internet\n');
        } else {
            console.log('\n💡 Detalhes completos do erro:');
            console.error(error);
            console.log('');
        }
        
        process.exit(1);
    }
}

// Executar teste
testarGroq();