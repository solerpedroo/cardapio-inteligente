// Configuração da API
const API_URL = window.location.origin + '/api';
const USUARIO_ID = 1; // ID fixo para demo

// ===================================
// ELEMENTOS DO DOM
// ===================================
const formCardapio = document.getElementById('formCardapio');
const btnGerar = document.getElementById('btnGerar');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultado = document.getElementById('resultado');
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

// ===================================
// NAVEGAÇÃO ENTRE SEÇÕES
// ===================================
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetSection = btn.dataset.section;
        
        // Atualizar botões ativos
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Atualizar seções visíveis
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetSection) {
                section.classList.add('active');
            }
        });
        
        // Carregar dados se necessário
        if (targetSection === 'historico') {
            carregarHistorico();
        } else if (targetSection === 'favoritos') {
            carregarFavoritos();
        }
    });
});

// ===================================
// GERAR CARDÁPIO
// ===================================
formCardapio.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        tipoRefeicao: document.getElementById('tipoRefeicao').value,
        ocasiao: document.getElementById('ocasiao').value,
        numeroPessoas: parseInt(document.getElementById('numeroPessoas').value),
        orcamento: parseFloat(document.getElementById('orcamento').value) || null,
        preferencias: document.getElementById('preferencias').value,
        restricoes: document.getElementById('restricoes').value,
        usuarioId: USUARIO_ID
    };
    
    // Validação
    if (!dados.tipoRefeicao) {
        mostrarNotificacao('Por favor, selecione o tipo de refeição', 'error');
        return;
    }
    
    // Mostrar loading
    mostrarLoading(true);
    btnGerar.classList.add('loading');
    
    try {
        const response = await fetch(`${API_URL}/menu/gerar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        // Verificar se a resposta é válida
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }
        
        // Tentar fazer parse do JSON
        let data;
        try {
            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Resposta vazia do servidor');
            }
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            throw new Error('Resposta inválida do servidor. Verifique se a API do Groq está configurada corretamente.');
        }
        
        if (data.sucesso) {
            exibirResultado(data.cardapio, data.metadata);
            mostrarNotificacao('Cardápio gerado com sucesso! 🎉', 'success');
            
            // Salvar ID do cardápio para favoritos
            window.cardapioAtualId = data.cardapioId;
        } else {
            const errorMsg = data.erro || 'Erro ao gerar cardápio';
            const solucao = data.solucao || '';
            throw new Error(errorMsg + (solucao ? '\n\n💡 ' + solucao : ''));
        }
        
    } catch (error) {
        console.error('Erro completo:', error);
        
        let mensagemErro = error.message;
        
        // Mensagens de erro mais amigáveis
        if (mensagemErro.includes('Failed to fetch')) {
            mensagemErro = '🔌 Não foi possível conectar ao servidor. Verifique se o servidor está rodando em http://localhost:3000';
        } else if (mensagemErro.includes('Resposta vazia')) {
            mensagemErro = '⚠️ Servidor retornou resposta vazia. Possíveis causas:\n\n' +
                          '1. API Key do Groq não configurada no .env\n' +
                          '2. Banco de dados não conectado\n' +
                          '3. Erro no servidor\n\n' +
                          'Verifique o console do servidor para mais detalhes.';
        }
        
        mostrarNotificacao(mensagemErro, 'error');
    } finally {
        mostrarLoading(false);
        btnGerar.classList.remove('loading');
    }
});

// ===================================
// EXIBIR RESULTADO
// ===================================
function exibirResultado(cardapio, metadata) {
    // Mostrar seção de resultado
    resultado.classList.remove('hidden');
    
    // Scroll suave até o resultado
    setTimeout(() => {
        resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Preencher cabeçalho
    document.getElementById('resultadoTitulo').textContent = cardapio.titulo || 'Seu Cardápio';
    document.getElementById('resultadoDescricao').textContent = cardapio.descricao || '';
    
    // Badges de metadata
    if (metadata) {
        document.getElementById('badgeTempo').textContent = `⚡ ${metadata.tempoResposta}`;
        document.getElementById('badgeTokens').textContent = `🔢 ${metadata.tokensUsados} tokens`;
    }
    
    // Renderizar pratos
    const pratosContainer = document.getElementById('pratos');
    pratosContainer.innerHTML = '';
    
    if (cardapio.pratos && cardapio.pratos.length > 0) {
        cardapio.pratos.forEach((prato, index) => {
            const pratoCard = criarCardPrato(prato, index);
            pratosContainer.appendChild(pratoCard);
        });
    }
    
    // Dicas do chef
    const dicasContainer = document.getElementById('dicas');
    const listaDicas = document.getElementById('listaDicas');
    
    if (cardapio.dicasChef && cardapio.dicasChef.length > 0) {
        dicasContainer.classList.remove('hidden');
        listaDicas.innerHTML = '';
        cardapio.dicasChef.forEach(dica => {
            const li = document.createElement('li');
            li.textContent = dica;
            listaDicas.appendChild(li);
        });
    } else {
        dicasContainer.classList.add('hidden');
    }
    
    // Tempo total
    document.getElementById('tempoTotal').textContent = cardapio.tempoTotalPreparo || 'Não especificado';
}

// ===================================
// CRIAR CARD DE PRATO
// ===================================
function criarCardPrato(prato, index) {
    const card = document.createElement('div');
    card.className = 'prato-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Mapear categorias
    const categoriaLower = (prato.categoria || '').toLowerCase();
    
    card.innerHTML = `
        <div class="prato-categoria">${prato.categoria || 'Prato'}</div>
        <h4 class="prato-nome">${prato.nome}</h4>
        <p class="prato-descricao">${prato.descricao || ''}</p>
        
        ${prato.ingredientes && prato.ingredientes.length > 0 ? `
            <div class="prato-ingredientes">
                <strong>Ingredientes Principais</strong>
                <p>${prato.ingredientes.join(', ')}</p>
            </div>
        ` : ''}
        
        <div class="prato-info">
            ${prato.tempoPreparo ? `
                <div class="info-item">
                    <svg class="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    <span>${prato.tempoPreparo}</span>
                </div>
            ` : ''}
            
            ${prato.dificuldade ? `
                <div class="info-item">
                    <svg class="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                    <span>${prato.dificuldade}</span>
                </div>
            ` : ''}
            
            ${prato.custoEstimado ? `
                <div class="info-item">
                    <svg class="info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>${prato.custoEstimado}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// ===================================
// ===================================
// SALVAR NOS FAVORITOS
// ===================================
document.getElementById('btnSalvarFavorito').addEventListener('click', async () => {
    if (!window.cardapioAtualId) {
        mostrarNotificacao('Nenhum cardápio para salvar', 'error');
        return;
    }
    
    try {
        const titulo = document.getElementById('resultadoTitulo').textContent;
        const descricao = document.getElementById('resultadoDescricao').textContent;
        
        console.log('Salvando favorito...', { titulo, cardapioId: window.cardapioAtualId });
        
        const response = await fetch(`${API_URL}/menu/favoritos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuarioId: USUARIO_ID,
                cardapioId: window.cardapioAtualId,
                nomePrato: titulo,
                descricao: descricao
            })
        });
        
        console.log('Resposta status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.sucesso) {
            mostrarNotificacao('Adicionado aos favoritos com sucesso', 'success');
        } else {
            throw new Error(data.erro || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('Erro completo ao salvar favorito:', error);
        mostrarNotificacao('Erro ao salvar: ' + error.message, 'error');
    }
});

// ===================================
// CARREGAR HISTÓRICO
// ===================================
async function carregarHistorico() {
    const container = document.getElementById('listaHistorico');
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Carregando...</p>';
    
    try {
        const response = await fetch(`${API_URL}/menu/historico/${USUARIO_ID}`);
        const data = await response.json();
        
        if (data.sucesso && data.cardapios.length > 0) {
            container.innerHTML = '';
            data.cardapios.forEach((item, index) => {
                const card = criarCardHistorico(item, index);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1.5rem; color: var(--border-medium);">
                        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
                    </svg>
                    <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">Nenhum cardápio no histórico</p>
                    <p style="font-size: 0.9375rem;">Gere seu primeiro cardápio para começar</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = '<p style="color: var(--primary); text-align: center;">Erro ao carregar histórico</p>';
    }
}

// ===================================
// CRIAR CARD DE HISTÓRICO
// ===================================
function criarCardHistorico(item, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const cardapio = item.conteudo_json;
    const data = new Date(item.criado_em).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
                <h4 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
                    ${cardapio.titulo || item.tipo_refeicao}
                </h4>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${data}
                </p>
            </div>
            <span class="badge">${item.tipo_refeicao}</span>
        </div>
        
        <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9375rem;">
            ${cardapio.descricao || 'Sem descrição'}
        </p>
        
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
            ${item.ocasiao ? `<span class="badge">${item.ocasiao}</span>` : ''}
            <span class="badge">${item.numero_pessoas} pessoa${item.numero_pessoas > 1 ? 's' : ''}</span>
            ${item.orcamento ? `<span class="badge">R$ ${item.orcamento}</span>` : ''}
        </div>
        
        <button class="btn btn-secondary btn-sm" onclick="visualizarCardapio(${item.id})" style="width: 100%;">
            Visualizar Completo
        </button>
    `;
    
    return card;
}

// ===================================
// VISUALIZAR CARDÁPIO DO HISTÓRICO
// ===================================
async function visualizarCardapio(id) {
    try {
        const response = await fetch(`${API_URL}/menu/historico/${USUARIO_ID}`);
        const data = await response.json();
        
        if (data.sucesso) {
            const item = data.cardapios.find(c => c.id === id);
            if (item) {
                exibirResultado(item.conteudo_json, null);
                window.cardapioAtualId = item.id;
                
                // Navegar para seção gerar
                document.querySelector('[data-section="gerar"]').click();
            }
        }
    } catch (error) {
        console.error('Erro ao visualizar cardápio:', error);
        mostrarNotificacao('Erro ao carregar cardápio', 'error');
    }
}

// ===================================
// CARREGAR FAVORITOS
// ===================================
async function carregarFavoritos() {
    const container = document.getElementById('listaFavoritos');
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Carregando...</p>';
    
    try {
        const response = await fetch(`${API_URL}/menu/favoritos/${USUARIO_ID}`);
        const data = await response.json();
        
        if (data.sucesso && data.favoritos.length > 0) {
            container.innerHTML = '';
            data.favoritos.forEach((item, index) => {
                const card = criarCardFavorito(item, index);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1.5rem; color: var(--border-medium);">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">Nenhum favorito ainda</p>
                    <p style="font-size: 0.9375rem;">Salve seus cardápios preferidos para acesso rápido</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        container.innerHTML = '<p style="color: var(--primary); text-align: center;">Erro ao carregar favoritos</p>';
    }
}

// ===================================
// CRIAR CARD DE FAVORITO
// ===================================
function criarCardFavorito(item, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const data = new Date(item.criado_em).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h4 style="color: var(--text-primary); font-size: 1.25rem; font-weight: 700;">
                ${item.nome_prato}
            </h4>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        </div>
        
        <p style="color: var(--text-secondary); margin: 1rem 0; font-size: 0.9375rem; line-height: 1.6;">
            ${item.descricao || 'Sem descrição'}
        </p>
        
        <p style="color: var(--text-tertiary); font-size: 0.875rem;">
            Salvo em ${data}
        </p>
    `;
    
    return card;
}

// ===================================
// UTILITÁRIOS
// ===================================
function mostrarLoading(mostrar) {
    if (mostrar) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    
    const colors = {
        success: { bg: '#10B981', border: '#059669' },
        error: { bg: '#EA1D2C', border: '#C4161F' },
        info: { bg: '#1E1E1E', border: '#3E3E3E' }
    };
    
    const color = colors[tipo] || colors.info;
    
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${color.bg};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid ${color.border};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
        font-size: 0.9375rem;
        font-family: 'Inter', sans-serif;
    `;
    notif.textContent = mensagem;
    
    document.body.appendChild(notif);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Adicionar animação CSS para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// BOTÕES DE ATUALIZAÇÃO
// ===================================
document.getElementById('btnCarregarHistorico').addEventListener('click', carregarHistorico);
document.getElementById('btnCarregarFavoritos').addEventListener('click', carregarFavoritos);

// ===================================
// INICIALIZAÇÃO
// ===================================
console.log('Cardápio Inteligente carregado');
console.log('Powered by Groq AI');