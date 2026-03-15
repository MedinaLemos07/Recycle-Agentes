/**
 * RECYCLE AGENTS - SISTEMA DE PERFIL (VERSÃO GAMIFICADA 11.0)
 * Visual de "Card de Herói" e Sincronização com Firestore
 */

const NIVEIS_CONFIG = [
    { nivel: 1, min_xp: 0, titulo: "Semente da Terra" },
    { nivel: 2, min_xp: 50, titulo: "Brotinho Verde" },
    { nivel: 3, min_xp: 150, titulo: "Folha Sustentável" },
    { nivel: 4, min_xp: 300, titulo: "Jovem Árvore" },
    { nivel: 5, min_xp: 500, titulo: "Protetor da Natureza" },
    { nivel: 6, min_xp: 800, titulo: "Eco-Agente" },
    { nivel: 7, min_xp: 1200, titulo: "Sentinela Ambiental" },
    { nivel: 8, min_xp: 1700, titulo: "Guerreiro da Ecologia" },
    { nivel: 9, min_xp: 2300, titulo: "Herói do Planeta" },
    { nivel: 10, min_xp: 3000, titulo: "Guardião Supremo" }
];

function calcularNivel(xpTotal) {
    let nivelAtual = NIVEIS_CONFIG[0];
    for (let i = 0; i < NIVEIS_CONFIG.length; i++) {
        if (xpTotal >= NIVEIS_CONFIG[i].min_xp) {
            nivelAtual = NIVEIS_CONFIG[i];
        } else {
            break;
        }
    }
    return nivelAtual;
}

function carregarPerfil() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) return;

    const container = document.getElementById('perfil-info');
    if (!container) return;

    const xpTotal = user.pontos_totais || 0;
    const infoNivel = calcularNivel(xpTotal);
    
    const proxNivel = NIVEIS_CONFIG.find(n => n.nivel === infoNivel.nivel + 1);
    let porcentagemProx = 100;
    let xpFaltante = 0;
    
    if (proxNivel) {
        const xpNoNivelAtual = xpTotal - infoNivel.min_xp;
        const xpNecessarioParaSubir = proxNivel.min_xp - infoNivel.min_xp;
        porcentagemProx = Math.min((xpNoNivelAtual / xpNecessarioParaSubir) * 100, 100);
        xpFaltante = proxNivel.min_xp - xpTotal;
    }

    const avatarAtual = user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.nome}&backgroundColor=10b981`;
    const impacto = user.impacto || { agua: 0, co2: 0, arvores: 0, total_itens: 0 };

    container.innerHTML = `
        <div class="card fade-in" style="padding: 0; overflow: hidden; border-color: var(--primary );">
            <!-- Header do Card (Avatar e Nome) -->
            <div style="background: linear-gradient(135deg, var(--card-dark), #111827); padding: 40px 20px; text-align: center; border-bottom: 1px solid var(--border);">
                <div style="position: relative; display: inline-block; margin-bottom: 20px;">
                    <img src="${avatarAtual}" id="avatar-preview" style="width: 120px; height: 120px; background: #2d3748; border-radius: 50%; border: 4px solid var(--primary); object-fit: cover; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">
                    <button onclick="trocarAvatar()" style="position: absolute; bottom: 0; right: 0; background: var(--primary); border: 3px solid var(--card-dark); border-radius: 50%; width: 38px; height: 38px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-camera" style="font-size: 0.9rem;"></i>
                    </button>
                </div>
                <h2 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 5px;">${user.nome}</h2>
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--primary); font-weight: 700;">
                    <span>@${user.nickname || user.nome.split(' ')[0]}</span>
                    <i class="fas fa-pencil-alt" onclick="habilitarEdicaoNick()" style="cursor: pointer; font-size: 0.8rem; opacity: 0.7;"></i>
                </div>
            </div>

            <!-- Corpo do Card (Nível e Progresso) -->
            <div style="padding: 30px 20px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--primary); display: inline-block; padding: 8px 20px; border-radius: 50px; margin-bottom: 15px;">
                        <span style="color: var(--primary); font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">
                            Nível ${infoNivel.nivel} - ${infoNivel.titulo}
                        </span>
                    </div>
                    
                    <div style="max-width: 280px; margin: 0 auto;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">
                            <span>Progresso</span>
                            <span>${xpFaltante > 0 ? `${xpTotal} / ${proxNivel.min_xp} XP` : 'Nível Máximo!'}</span>
                        </div>
                        <div style="background: #374151; height: 10px; border-radius: 10px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, var(--primary), #34d399); width: ${porcentagemProx}%; height: 100%; transition: 1.5s ease;"></div>
                        </div>
                    </div>
                </div>

                <!-- Grid de Impacto (Visual Jogo) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; text-align: center;">
                        <i class="fas fa-tint" style="color: #60a5fa; margin-bottom: 5px;"></i>
                        <div style="font-size: 1.1rem; font-weight: 900;">${impacto.agua.toFixed(1)}L</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">Água Salva</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; text-align: center;">
                        <i class="fas fa-cloud" style="color: var(--silver); margin-bottom: 5px;"></i>
                        <div style="font-size: 1.1rem; font-weight: 900;">${impacto.co2.toFixed(2)}kg</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">CO2 Evitado</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; text-align: center;">
                        <i class="fas fa-tree" style="color: var(--primary); margin-bottom: 5px;"></i>
                        <div style="font-size: 1.1rem; font-weight: 900;">${impacto.arvores.toFixed(3)}</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">Árvores</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; text-align: center;">
                        <i class="fas fa-recycle" style="color: var(--gold); margin-bottom: 5px;"></i>
                        <div style="font-size: 1.1rem; font-weight: 900;">${impacto.total_itens || 0}</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">Itens Totais</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function trocarAvatar() {
    let user = JSON.parse(localStorage.getItem('usuarioLogado'));
    const seeds = ['Forest', 'River', 'Mountain', 'Earth', 'Sun', 'Sprout', 'Felix', 'Aneka', 'Jocelyn', 'Buster', 'Snuggles'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const novoAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}&backgroundColor=10b981`;
    
    user.avatar = novoAvatar;
    localStorage.setItem('usuarioLogado', JSON.stringify(user ));
    
    firebase.firestore().collection("usuarios").doc(user.uid).update({ avatar: novoAvatar })
        .then(() => {
            const imgPreview = document.getElementById('avatar-preview');
            if (imgPreview) imgPreview.src = novoAvatar;
            Swal.fire({ icon: 'success', title: 'Avatar atualizado!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#1f2937', color: '#f3f4f6' });
        });
}

function habilitarEdicaoNick() {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    Swal.fire({
        title: 'Alterar Nickname',
        input: 'text',
        inputLabel: 'Como você quer ser chamado?',
        inputValue: user.nickname || user.nome.split(' ')[0],
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#374151',
        confirmButtonText: 'SALVAR',
        background: '#1f2937',
        color: '#f3f4f6',
        inputValidator: (value) => {
            if (!value) return 'O nickname não pode ser vazio!';
            if (value.length > 15) return 'Máximo de 15 caracteres!';
        }
    }).then((result) => {
        if (result.isConfirmed) {
            salvarNovoNick(result.value);
        }
    });
}

function salvarNovoNick(novoNick) {
    let user = JSON.parse(localStorage.getItem('usuarioLogado'));
    user.nickname = novoNick;
    localStorage.setItem('usuarioLogado', JSON.stringify(user));

    firebase.firestore().collection("usuarios").doc(user.uid).update({ nickname: novoNick })
        .then(() => {
            carregarPerfil();
            Swal.fire({ icon: 'success', title: 'Nickname salvo!', background: '#1f2937', color: '#f3f4f6', timer: 1500, showConfirmButton: false });
        });
}
