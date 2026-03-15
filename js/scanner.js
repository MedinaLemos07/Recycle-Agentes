/**
 * RECYCLE AGENTS - MOTOR DO SCANNER (VERSÃO PROFISSIONAL 11.0)
 * Filtro de Consistência (Leitura Tripla) e Integração com Motor de Validação
 */

let leiturasSeguidas = 0;
let ultimoCodigoLido = "";
const META_LEITURAS = 3; // O código só é aceito se lido 3 vezes seguidas

function iniciarScanner() {
    const container = document.querySelector('#interactive');
    if (!container) return;

    // Reinicia contadores ao ligar a câmera
    leiturasSeguidas = 0;
    ultimoCodigoLido = "";

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: container,
            constraints: {
                facingMode: "environment", // Câmera traseira
                width: { min: 640 },
                height: { min: 480 },
                focusMode: "continuous" // Foco contínuo para maior precisão
            },
        },
        decoder: {
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "code_128_reader"]
        },
        locate: true
    }, function(err) {
        if (err) {
            console.error("Erro ao iniciar câmera:", err);
            Swal.fire({ icon: 'error', title: 'Erro de Câmera', text: 'Não foi possível acessar a câmera.', background: '#1f2937', color: '#f3f4f6' });
            return;
        }
        Quagga.start();
        console.log("Scanner iniciado com Filtro de Consistência ativado!");
    });

    // EVENTO DE DETECÇÃO COM FILTRO DE CONSISTÊNCIA
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        if (!code) return;

        // LÓGICA DE LEITURA TRIPLA (RELATÓRIO ITEM 3.2)
        if (code === ultimoCodigoLido) {
            leiturasSeguidas++;
            console.log(`Leitura consistente: ${code} (${leiturasSeguidas}/${META_LEITURAS})`);
        } else {
            leiturasSeguidas = 1;
            ultimoCodigoLido = code;
        }

        // Só processa se atingir a meta de leituras idênticas
        if (leiturasSeguidas >= META_LEITURAS) {
            Quagga.stop(); // Para o scanner para processar
            
            // Feedback sonoro de sucesso
            const beep = new Audio('https://www.soundjay.com/button/beep-07.mp3' );
            beep.play().catch(() => {});

            console.log("Código Validado pelo Filtro:", code);
            
            // Chama o motor de validação no reciclagem.js
            if (typeof validarReciclagem === 'function') {
                validarReciclagem(code).catch(err => {
                    console.error("Erro na validação:", err);
                    Quagga.start(); // Reinicia em caso de erro crítico
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Erro de Sistema', text: 'Motor de validação não encontrado.' });
                Quagga.start();
            }

            // Reseta para o próximo scan
            leiturasSeguidas = 0;
            ultimoCodigoLido = "";
        }
    });
}

function processarCodigoManual(codigo) {
    if (!codigo) return;
    
    if (typeof validarReciclagem === 'function') {
        validarReciclagem(codigo);
    } else {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Motor de validação não encontrado.' });
    }
}
