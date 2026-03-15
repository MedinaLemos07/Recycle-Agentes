/**
 * RECYCLE AGENTS - CONFIGURAÇÃO E AUTENTICAÇÃO (VERSÃO FINAL CORRIGIDA)
 * Inclusão de Verificação de E-mail, Tradução de Erros e Sincronização Nuvem
 */

// 1. CONFIGURAÇÃO DO FIREBASE (Suas chaves reais)
const firebaseConfig = {
  apiKey: "AIzaSyAENuEOrpyr6zLfVayv6KMLUIWqd6r_V8c",
  authDomain: "recycle-agents.firebaseapp.com",
  projectId: "recycle-agents",
  storageBucket: "recycle-agents.firebasestorage.app",
  messagingSenderId: "314586544344",
  appId: "1:314586544344:web:b387df20a58fc9e376bfad",
  measurementId: "G-B5C0F8SQ1T"
};

// 2. INICIALIZAÇÃO
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- 3. FUNÇÃO DE LOGIN COM TRAVA DE E-MAIL ---
function loginUsuario(email, senha) {
    Swal.fire({ 
        title: 'Entrando...', 
        allowOutsideClick: false, 
        background: '#1f2937', 
        color: '#f3f4f6',
        didOpen: () => { Swal.showLoading(); } 
    });

    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            const user = userCredential.user;

            // REGRA DO RELATÓRIO: Só entra se o e-mail estiver verificado
            if (!user.emailVerified) {
                Swal.fire({
                    icon: 'warning',
                    title: 'E-mail não verificado!',
                    text: 'Por favor, verifique sua caixa de entrada (ou SPAM) antes de entrar.',
                    showCancelButton: true,
                    confirmButtonText: 'Reenviar Link',
                    cancelButtonText: 'Entendi',
                    background: '#1f2937',
                    color: '#f3f4f6',
                    confirmButtonColor: '#10b981'
                }).then((result) => {
                    if (result.isConfirmed) {
                        user.sendEmailVerification();
                        Swal.fire({ icon: 'success', title: 'Enviado!', text: 'O link de verificação foi reenviado.', background: '#1f2937', color: '#f3f4f6' });
                    }
                });
                auth.signOut(); // Desloga para impedir acesso indevido
                return;
            }

            // Busca dados reais no Firestore (Nuvem)
            db.collection("usuarios").doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const dadosNuvem = doc.data();
                    // Sincroniza LocalStorage com a Nuvem
                    localStorage.setItem('usuarioLogado', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        ...dadosNuvem
                    }));
                    
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Bem-vindo!', 
                        text: `Olá, ${dadosNuvem.nickname || dadosNuvem.nome || 'Agente'}!`, 
                        timer: 2000, 
                        showConfirmButton: false,
                        background: '#1f2937',
                        color: '#f3f4f6'
                    });
                    
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
                } else {
                    // Caso o usuário exista no Auth mas não no Firestore (raro, mas possível)
                    const perfilBasico = { 
                        nome: "Novo Agente", 
                        nickname: "Agente",
                        email: user.email, 
                        pontos_totais: 0, 
                        pontos_semana: 0,
                        nivel: 1,
                        liga: "Bronze",
                        data_cadastro: new Date().toISOString(),
                        impacto: { agua: 0, co2: 0, arvores: 0, total_itens: 0 }
                    };
                    db.collection("usuarios").doc(user.uid).set(perfilBasico).then(() => {
                        localStorage.setItem('usuarioLogado', JSON.stringify({ uid: user.uid, ...perfilBasico }));
                        window.location.href = 'dashboard.html';
                    });
                }
            });
        })
        .catch((error) => {
            console.error("Erro de Login:", error);
            let mensagem = "E-mail ou senha incorretos.";
            if (error.code === 'auth/user-not-found') mensagem = "Usuário não encontrado.";
            if (error.code === 'auth/wrong-password') mensagem = "Senha incorreta.";
            if (error.code === 'auth/too-many-requests') mensagem = "Muitas tentativas. Tente mais tarde.";
            
            Swal.fire({ icon: 'error', title: 'Falha no Login', text: mensagem, background: '#1f2937', color: '#f3f4f6' });
        });
}

// --- 4. FUNÇÃO DE CADASTRO COM ENVIO DE E-MAIL ---
function cadastrarUsuario(nome, email, senha) {
    Swal.fire({ 
        title: 'Criando sua conta...', 
        allowOutsideClick: false, 
        background: '#1f2937', 
        color: '#f3f4f6',
        didOpen: () => { Swal.showLoading(); } 
    });

    auth.createUserWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Envia o e-mail de verificação imediatamente
            user.sendEmailVerification();

            const novoUsuario = {
                uid: user.uid,
                nome: nome,
                nickname: nome.split(' ')[0],
                email: email,
                pontos_totais: 0,
                pontos_semana: 0,
                nivel: 1,
                liga: "Bronze",
                admin: false,
                data_cadastro: new Date().toISOString(),
                impacto: { agua: 0, co2: 0, arvores: 0, total_itens: 0 }
            };

            // Salva na Nuvem (Firestore)
            db.collection("usuarios").doc(user.uid).set(novoUsuario)
                .then(() => {
                    Swal.fire({ 
                        icon: 'info', 
                        title: 'Conta Criada!', 
                        text: 'Enviamos um link de verificação para o seu e-mail. Verifique-o para poder logar!', 
                        background: '#1f2937',
                        color: '#f3f4f6',
                        confirmButtonColor: '#10b981'
                    }).then(() => {
                        window.location.href = 'login.html';
                    });
                })
                .catch(err => {
                    console.error("Erro ao salvar no Firestore:", err);
                    Swal.fire({ icon: 'error', title: 'Erro de Banco', text: 'Erro ao salvar dados na nuvem.' });
                });
        })
        .catch((error) => {
            console.error("Erro de Cadastro:", error);
            let msg = "Erro ao criar conta.";
            if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está cadastrado.";
            if (error.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
            
            Swal.fire({ icon: 'error', title: 'Erro', text: msg, background: '#1f2937', color: '#f3f4f6' });
        });
}

// --- 5. MONITOR DE ESTADO (Sincronização Automática) ---
auth.onAuthStateChanged((user) => {
    if (user && user.emailVerified) {
        db.collection("usuarios").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const dados = doc.data();
                localStorage.setItem('usuarioLogado', JSON.stringify({ uid: user.uid, email: user.email, ...dados }));
            }
        });
    }
});

// --- 6. LOGOUT ---
function sairDaConta() {
    auth.signOut().then(() => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}
