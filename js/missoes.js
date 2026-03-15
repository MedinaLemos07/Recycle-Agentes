/**
 * RECYCLE AGENTS - SISTEMA DE MISSÕES (VERSÃO CORRIGIDA 11.0)
 * Separação de Diárias/Semanais e Persistência no LocalStorage
 */

const POOL_MISSOES_DIARIAS = [
    { desc: "Recicle 2 itens de plástico", meta: 2, xp: 15, icone: 'fa-bottle-water', acao: 'reciclar_plastico' },
    { desc: "Recicle 1 item de metal", meta: 1, xp: 10, icone: 'fa-faucet', acao: 'reciclar_metal' },
    { desc: "Ganhe 30 XP hoje", meta: 30, xp: 20, icone: 'fa-bolt', acao: 'ganhar_xp' },
    { desc: "Recicle 1 item de vidro", meta: 1, xp: 15, icone: 'fa-wine-glass', acao: 'reciclar_vidro' },
    { desc: "Escaneie 3 itens quaisquer", meta: 3, xp: 25, icone: 'fa-barcode', acao: 'reciclar_geral' },
    { desc: "Recicle 2 itens de papel", meta: 2, xp: 10, icone: 'fa-box-open', acao: 'reciclar_papel' }
];

function carregarMissoes() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) return;

    const hoje = new Date().toLocaleDateString();
    // Pega o número da semana atual para o reset semanal
    const dataAtual = new Date();
    const numeroSemana = Math.ceil((((dataAtual - new Date(dataAtual.getFullYear(), 0, 1)) / 86400000) + 1) / 7);

    let missoesDados = JSON.parse(localStorage.getItem('missoes_usuario')) || { data: hoje, semana: numeroSemana, lista: [] };

    // LÓGICA DE RESET:
    // Se mudou o dia OU não há missões, gera novas diárias
    // Se mudou a semana, gera novas semanais
    if (missoesDados.data !== hoje || missoesDados.semana !== numeroSemana || missoesDados.lista.length === 0) {
        
        // 1. Seleciona 3 novas Diárias
        const novasDiarias = POOL_MISSOES_DIARIAS
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((m, i) => ({
                ...m,
                id: Date.now() + i,
                tipo: 'diária',
                progresso: 0,
                concluida: false
            }));

        // 2. Mantém as Semanais se a semana for a mesma, ou gera novas se mudou
        let novasSemanais = [];
        if (missoesDados.semana === numeroSemana && missoesDados.lista.length > 0) {
            novasSemanais = missoesDados.lista.filter(m => m.tipo === 'semanal');
        } else {
            novasSemanais = [
                { id: 'S1', tipo: 'semanal', desc: "Recicle 15 itens no total", meta: 15, progresso: 0, xp: 100, concluida: false, icone: 'fa-recycle', acao: 'reciclar_geral' },
                { id: 'S2', tipo: 'semanal', desc: "Ganhe 500 XP na semana", meta: 500, progresso: 0, xp: 200, concluida: false, icone: 'fa-trophy', acao: 'ganhar_xp' }
            ];
        }

        missoesDados = { 
            data: hoje, 
            semana: numeroSemana, 
            lista: [...novasDiarias, ...novasSemanais] 
        };
        localStorage.setItem('missoes_usuario', JSON.stringify(missoesDados));
    }

    renderizarMissoesUI(missoesDados.lista);
}

function renderizarMissoesUI(lista) {
    const container = document.getElementById('lista-missoes');
    if (!container) return;

    container.innerHTML = "";
    lista.forEach(m => {
        const porcentagem = Math.min((m.progresso / m.meta) * 100, 100);
        const corCard = m.concluida ? 'var(--primary)' : 'var(--border)';
        
        container.innerHTML += `
            <div class="card" style="padding: 20px; border-color: ${corCard}; transition: 0.3s; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 45px; height: 45px; background: ${m.concluida ? 'var(--primary)' : '#374151'}; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">
                            <i class="fas ${m.concluida ? 'fa-check' : m.icone}"></i>
                        </div>
                        <div>
                            <span style="font-size: 0.65rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">${m.tipo}</span>
                            <div style="font-weight: bold; font-size: 1rem; color: ${m.concluida ? 'var(--primary)' : 'var(--text-main)'}">${m.desc}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 900; color: var(--gold); font-size: 1.1rem;">+${m.xp} XP</div>
                    </div>
                </div>
                
                <div style="background: #374151; height: 10px; border-radius: 10px; overflow: hidden;">
                    <div style="background: var(--primary); width: ${porcentagem}%; height: 100%; transition: 1s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; font-weight: bold; color: var(--text-muted);">
                    <span>${m.concluida ? 'CONCLUÍDA' : 'EM PROGRESSO'}</span>
                    <span>${m.progresso} / ${m.meta}</span>
                </div>
            </div>
        `;
    });
}

function atualizarProgressoMissao(acaoRealizada, quantidade = 1) {
    let missoesDados = JSON.parse(localStorage.getItem('missoes_usuario'));
    if (!missoesDados) return;

    let xpGanhoTotal = 0;
    let houveConclusao = false;

    missoesDados.lista.forEach(m => {
        // Lógica de correspondência de ação
        const acaoCombina = (m.acao === acaoRealizada) || 
                           (acaoRealizada.includes('reciclar') && m.acao === 'reciclar_geral');

        if (!m.concluida && acaoCombina) {
            m.progresso += quantidade;
            
            if (m.progresso >= m.meta) {
                m.progresso = m.meta;
                m.concluida = true;
                xpGanhoTotal += m.xp;
                houveConclusao = true;
            }
        }
    });

    if (houveConclusao) {
        // Importante: O XP das missões é somado aqui no LocalStorage, 
        // mas a função processarSucesso do reciclagem.js já cuida do Firestore para o XP do scan.
        // Para o XP extra da MISSÃO, precisamos atualizar o Firestore também:
        const userAuth = firebase.auth().currentUser;
        if (userAuth) {
            firebase.firestore().collection("usuarios").doc(userAuth.uid).update({
                pontos_totais: firebase.firestore.FieldValue.increment(xpGanhoTotal),
                pontos_semana: firebase.firestore.FieldValue.increment(xpGanhoTotal)
            });
        }

        let userLocal = JSON.parse(localStorage.getItem('usuarioLogado'));
        userLocal.pontos_totais += xpGanhoTotal;
        userLocal.pontos_semana += xpGanhoTotal;
        localStorage.setItem('usuarioLogado', JSON.stringify(userLocal));
        
        Swal.fire({
            title: 'MISSÃO CONCLUÍDA! 🌟',
            html: `<b style="color: var(--gold); font-size: 1.5rem;">+${xpGanhoTotal} XP</b>`,
            icon: 'success',
            background: '#1f2937',
            color: '#f3f4f6',
            timer: 3000
        });
    }

    localStorage.setItem('missoes_usuario', JSON.stringify(missoesDados));
    
    // Atualiza a UI se o container de missões existir na página atual
    if (document.getElementById('lista-missoes')) {
        renderizarMissoesUI(missoesDados.lista);
    }
}
