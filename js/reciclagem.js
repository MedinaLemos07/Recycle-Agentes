/**
 * RECYCLE AGENTS - MOTOR DE VALIDAÇÃO (VERSÃO INTEGRADA 11.0)
 * Conexão direta com Missões, Firestore e LocalStorage
 */

async function validarReciclagem(codigo) {
    // 1. Bloqueio Anti-Fraude (15 segundos)
    if (!verificarSeguranca()) return;

    const db = firebase.firestore();
    
    Swal.fire({ 
        title: 'Consultando Produto...', 
        allowOutsideClick: false, 
        background: '#1f2937',
        color: '#f3f4f6',
        didOpen: () => { Swal.showLoading(); } 
    });

    // 2. CAMADA NUVEM: Consulta produtos aprovados no Firestore
    try {
        const doc = await db.collection("produtos_aprovados").doc(codigo).get();
        if (doc.exists) {
            const produto = doc.data();
            processarSucesso(produto); 
            return { sucesso: true, mensagem: `Produto Aprovado: ${produto.nome}` };
        }
    } catch (e) {
        console.error("Erro Firestore:", e);
    }

    // 3. CAMADA API: Consulta a base mundial (Open Food Facts)
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json` );
        const data = await response.json();
        
        if (data.status === 1) {
            const nome = data.product.product_name || "Produto Desconhecido";
            const material = identificarMaterial(data.product); 
            
            const produtoAPI = {
                nome: nome, 
                material: material, 
                xp: 20,
                impacto: gerarImpactoPadrao(material)
            };
            
            processarSucesso(produtoAPI);
            return { sucesso: true, mensagem: `API Reconheceu: ${nome}` };
        }
    } catch (e) { 
        console.error("Erro API Mundial:", e); 
    }

    // 4. CAMADA MANUAL: Se não achou, sugere o envio para o ADM
    Swal.fire({
        icon: 'warning',
        title: 'Produto não identificado',
        text: "Este item ainda não está no nosso sistema. Envie uma foto para o ADM validar!",
        background: '#1f2937',
        color: '#f3f4f6',
        confirmButtonText: 'ENTENDI'
    }).then(() => { 
        if (typeof Quagga !== 'undefined') Quagga.start(); 
    });

    return { sucesso: false, mensagem: "Produto não identificado." };
}

// --- FUNÇÃO QUE DISTRIBUI PONTOS E ATUALIZA MISSÕES ---
function processarSucesso(produto) {
    const userAuth = firebase.auth().currentUser;
    if (!userAuth) return;

    const db = firebase.firestore();
    
    // Atualiza no Firestore (Nuvem)
    db.collection("usuarios").doc(userAuth.uid).update({
        pontos_totais: firebase.firestore.FieldValue.increment(produto.xp),
        pontos_semana: firebase.firestore.FieldValue.increment(produto.xp),
        "impacto.total_itens": firebase.firestore.FieldValue.increment(1),
        "impacto.agua": firebase.firestore.FieldValue.increment(produto.impacto.agua),
        "impacto.co2": firebase.firestore.FieldValue.increment(produto.impacto.co2),
        "impacto.arvores": firebase.firestore.FieldValue.increment(produto.impacto.arvores)
    }).then(() => {
        // --- CONEXÃO COM MISSÕES ---
        if (typeof atualizarProgressoMissao === 'function') {
            atualizarProgressoMissao('reciclar_' + produto.material, 1);
            atualizarProgressoMissao('ganhar_xp', produto.xp);
        }

        // --- ATUALIZAÇÃO DO LOCALSTORAGE ---
        let userLocal = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (userLocal) {
            userLocal.pontos_totais = (userLocal.pontos_totais || 0) + produto.xp;
            userLocal.pontos_semana = (userLocal.pontos_semana || 0) + produto.xp;
            if (!userLocal.impacto) userLocal.impacto = { agua: 0, co2: 0, arvores: 0, total_itens: 0 };
            userLocal.impacto.total_itens += 1;
            userLocal.impacto.agua += produto.impacto.agua;
            userLocal.impacto.co2 += produto.impacto.co2;
            userLocal.impacto.arvores += produto.impacto.arvores;
            localStorage.setItem('usuarioLogado', JSON.stringify(userLocal));
        }

        // Feedback visual
        Swal.fire({ 
            icon: 'success', 
            title: `+${produto.xp} XP Ganhos!`, 
            text: `Reciclado: ${produto.nome}`,
            background: '#1f2937',
            color: '#f3f4f6',
            timer: 2500,
            showConfirmButton: false
        }).then(() => {
            mostrarCardEducativo(produto.material);
            if (typeof Quagga !== 'undefined') Quagga.start();
        });
    });
}

function identificarMaterial(info) {
    const texto = ((info.product_name || "") + " " + (info.packaging || "") + " " + (info.categories || "")).toLowerCase();
    if (texto.includes("lata") || texto.includes("tin") || texto.includes("can") || texto.includes("alumínio")) return "metal";
    if (texto.includes("garrafa") || texto.includes("pet") || texto.includes("plastic") || texto.includes("plástico")) return "plastico";
    if (texto.includes("vidro") || texto.includes("glass") || texto.includes("bottle")) return "vidro";
    if (texto.includes("papel") || texto.includes("caixa") || texto.includes("cardboard") || texto.includes("paper")) return "papel";
    return "plastico"; 
}

function gerarImpactoPadrao(material) {
    const bases = {
        'plastico': { agua: 2.0, co2: 0.1, arvores: 0.001 },
        'metal': { agua: 5.0, co2: 0.5, arvores: 0.005 },
        'vidro': { agua: 1.0, co2: 0.3, arvores: 0.002 },
        'papel': { agua: 10.0, co2: 0.2, arvores: 0.015 }
    };
    return bases[material] || bases['plastico'];
}

function verificarSeguranca() {
    const ultima = localStorage.getItem('ultima_reciclagem_timestamp');
    const agora = Date.now();
    if (ultima && (agora - ultima < 15000)) {
        Swal.fire({ icon: 'error', title: 'Aguarde...', text: 'Espere 15s para o próximo scan.', background: '#1f2937', color: '#f3f4f6', timer: 2000, showConfirmButton: false });
        return false;
    }
    localStorage.setItem('ultima_reciclagem_timestamp', agora);
    return true;
}

function mostrarCardEducativo(material) {
    const dicas = {
        'plastico': 'O plástico leva 400 anos para sumir. Reciclar economiza petróleo!',
        'metal': 'O alumínio é 100% reciclável. Uma lata volta a ser lata em 60 dias!',
        'papel': 'Reciclar papel salva árvores e gasta 80% menos água.',
        'vidro': 'O vidro é eterno. Recicle para não poluir por 4.000 anos!'
    };
    Swal.fire({ title: 'VOCÊ SABIA? 🌍', text: dicas[material], icon: 'info', toast: true, position: 'top', timer: 6000, showConfirmButton: false, background: '#10b981', color: '#fff' });
}
