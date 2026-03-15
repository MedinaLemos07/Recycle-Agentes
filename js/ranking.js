/**
 * RECYCLE AGENTS - MOTOR DE COMPETIÇÃO (VERSÃO INTEGRADA 11.0)
 * Sistema de Ligas, Bots Persistentes e Promoção Semanal
 */

const LIGAS_CONFIG = {
    "Bronze": { min: 10, max: 80, bots: ["Lucas_Eco", "Mari_Verde", "Pedro_Recicla", "Ana_Natureza", "Gabriel_Sustentavel", "Julia_Bio", "Bruno_Eco", "Carla_Terra", "Diego_Verde"] },
    "Prata": { min: 100, max: 250, bots: ["Roberto_Eco", "Fernanda_Green", "Thiago_Recicla", "Beatriz_Nature", "Ricardo_Bio", "Sonia_Terra", "Marcos_Eco", "Helena_Verde", "Fabio_Sustentavel"] },
    "Ouro": { min: 300, max: 600, bots: ["Dr_Sustentavel", "Eng_Ambiental", "Mestre_Recicla", "Eco_Elite_01", "Planeta_Vivo", "Natureza_Pura", "Guerreiro_Verde", "Eco_Vida", "Bio_Expert"] },
    "Rubi": { min: 700, max: 1500, bots: ["Eco_Legend", "Master_Recycler", "Green_Champion", "Terra_Guardião", "Bio_Force", "Nature_King", "Eco_Titan", "Vida_Verde_Pro", "Recicla_Master"] },
    "Diamante": { min: 1600, max: 4000, bots: ["Deus_da_Reciclagem", "Eco_Infinity", "Diamante_Verde", "Lenda_Ambiental", "Planeta_Salvo", "Bio_Supreme", "Nature_God", "Eco_Overlord", "Recicla_Legend"] }
};

const ORDEM_LIGAS = ["Bronze", "Prata", "Ouro", "Rubi", "Diamante"];

function carregarRanking() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) return;

    const ligaAtual = usuarioLogado.liga || "Bronze";
    const config = LIGAS_CONFIG[ligaAtual] || LIGAS_CONFIG["Bronze"];

    // 1. Recupera ou gera bots persistentes para a semana
    const dataAtual = new Date();
    const numeroSemana = Math.ceil((((dataAtual - new Date(dataAtual.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
    const chaveRanking = `ranking_liga_${ligaAtual}_S${numeroSemana}`;
    
    let competidores = JSON.parse(localStorage.getItem(chaveRanking));

    if (!competidores) {
        competidores = config.bots.map(nome => ({
            nome: nome,
            pontos: Math.floor(Math.random() * (config.max - config.min)) + config.min,
            isBot: true,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${nome}&backgroundColor=10b981`,
            ultimaAtualizacao: Date.now( )
        }));
        localStorage.setItem(chaveRanking, JSON.stringify(competidores));
    }

    // 2. Simulação de ganho de pontos dos bots
    const agora = Date.now();
    let houveMudanca = false;
    competidores.forEach(bot => {
        const tempoPassado = (agora - (bot.ultimaAtualizacao || 0)) / 1000;
        if (tempoPassado > 3600) { // Bots ganham pontos a cada 1 hora
            if (Math.random() > 0.5) {
                const ganho = ligaAtual === "Bronze" ? 5 : 15;
                bot.pontos += Math.floor(Math.random() * ganho) + 5;
                bot.ultimaAtualizacao = agora;
                houveMudanca = true;
            }
        }
    });

    if (houveMudanca) localStorage.setItem(chaveRanking, JSON.stringify(competidores));

    // 3. Monta a lista final com o usuário real
    const listaFinal = [...competidores, {
        nome: usuarioLogado.nickname || usuarioLogado.nome,
        pontos: usuarioLogado.pontos_semana || 0,
        isBot: false,
        avatar: usuarioLogado.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${usuarioLogado.nome}&backgroundColor=10b981`
    }].sort((a, b ) => b.pontos - a.pontos);

    renderizarRankingUI(listaFinal, ligaAtual);
    atualizarTemporizador();
}

function renderizarRankingUI(lista, ligaAtual) {
    const container = document.getElementById('tabelaRanking');
    if (!container) return;

    container.innerHTML = "";
    lista.forEach((user, index) => {
        const pos = index + 1;
        let status = "";
        
        if (pos <= 3) {
            status = `<span style="color: var(--primary); font-size: 0.65rem; font-weight: 800;"><i class="fas fa-caret-up"></i> ZONA DE PROMOÇÃO</span>`;
        } else if (pos >= 8) {
            status = `<span style="color: var(--ruby); font-size: 0.65rem; font-weight: 800;"><i class="fas fa-caret-down"></i> ZONA DE REBAIXAMENTO</span>`;
        }

        container.innerHTML += `
            <div class="ranking-item ${user.isBot ? '' : 'me'}" style="padding: 15px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 15px;">
                <div style="width: 30px; font-weight: 900; color: var(--text-muted);">${pos}</div>
                <img src="${user.avatar}" style="width: 45px; height: 45px; border-radius: 50%; background: #2d3748; border: 2px solid ${user.isBot ? 'transparent' : 'var(--primary)'};">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: var(--text-main);">${user.nome}</div>
                    ${status}
                </div>
                <div style="font-weight: 900; color: var(--primary);">${user.pontos} XP</div>
            </div>
        `;
    });

    const nomeDivisao = document.getElementById('nomeDivisao');
    if (nomeDivisao) nomeDivisao.innerText = `Divisão ${ligaAtual}`;
}

function atualizarTemporizador() {
    const agora = new Date();
    const proximaSegunda = new Date();
    proximaSegunda.setDate(agora.getDate() + (1 + 7 - agora.getDay()) % 7);
    proximaSegunda.setHours(0, 0, 0, 0);

    const diff = proximaSegunda - agora;
    
    // Se o tempo acabou (segunda-feira 00:00), processa a troca de liga
    if (diff <= 0) {
        finalizarTemporada();
        return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const timerElem = document.getElementById('countdown');
    if (timerElem) {
        timerElem.innerHTML = `<i class="fas fa-clock"></i> Termina em: <strong>${dias}d ${horas}h ${minutos}m</strong>`;
    }
}

// --- FUNÇÃO DE PROMOÇÃO/REBAIXAMENTO ---
function finalizarTemporada() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return;

    // Lógica simplificada: Se estiver no Top 3, sobe. Se estiver no Bottom 3, desce.
    // Para um sistema real, isso deveria ser processado no servidor (Firebase Functions)
    // Aqui simulamos o resultado baseado nos pontos atuais
    const competidores = JSON.parse(localStorage.getItem(`ranking_liga_${user.liga}_S${getNumeroSemana()}`)) || [];
    const listaFinal = [...competidores, { nome: user.nome, pontos: user.pontos_semana }].sort((a, b) => b.pontos - a.pontos);
    const posicao = listaFinal.findIndex(u => u.nome === user.nome) + 1;

    let novaLiga = user.liga;
    const indexAtual = ORDEM_LIGAS.indexOf(user.liga);

    if (posicao <= 3 && indexAtual < ORDEM_LIGAS.length - 1) {
        novaLiga = ORDEM_LIGAS[indexAtual + 1];
    } else if (posicao >= 8 && indexAtual > 0) {
        novaLiga = ORDEM_LIGAS[indexAtual - 1];
    }

    // Reseta pontos da semana e atualiza liga
    user.liga = novaLiga;
    user.pontos_semana = 0;
    localStorage.setItem('usuarioLogado', JSON.stringify(user));
    
    firebase.firestore().collection("usuarios").doc(user.uid).update({
        liga: novaLiga,
        pontos_semana: 0
    }).then(() => {
        Swal.fire({
            title: 'Nova Temporada!',
            text: `Você terminou em ${posicao}º lugar e agora está na liga ${novaLiga}!`,
            icon: 'info',
            background: '#1f2937',
            color: '#f3f4f6'
        }).then(() => window.location.reload());
    });
}

function getNumeroSemana() {
    const d = new Date();
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
}

// Atualiza o temporizador a cada minuto
setInterval(atualizarTemporizador, 60000);
