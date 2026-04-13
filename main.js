// Localização: main.js

const csInterface = new CSInterface();
const fs = require('fs');
const path = require('path');
const os = require('os');

// Estado Global
const state = {
    selection: null,
    base64ToProcess: null,
    resultBase64: null
};

// Conversor Nativo: Transforma o Base64 em um arquivo "fisico" na memória para a API
function base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], {type: 'image/jpeg'});
}

window.addEventListener("DOMContentLoaded", () => {
    
    // Elementos UI
    const btnSettings = document.getElementById('toggle-settings');
    const panelSettings = document.getElementById('settings-panel');
    const keyInput = document.getElementById("api-key-input");
    const statusText = document.getElementById("api-status-text");
    const statusDot = document.getElementById("status-dot");
    const systemMsg = document.getElementById("system-message");
    const previewImg = document.getElementById("preview-image");
    const emptyState = document.getElementById("empty-state");

    const btnSync = document.getElementById("btn-sync");
    const btnExecute = document.getElementById("btn-execute");
    const btnApply = document.getElementById("btn-apply");
    const btnClear = document.getElementById("btn-clear");

    // Toggle de Configurações
    btnSettings.addEventListener('click', () => {
        panelSettings.style.display = panelSettings.style.display === 'none' ? 'block' : 'none';
    });

    // Carregar API Key
    keyInput.value = localStorage.getItem("nebula_cep_key") || "";
    updateApiStatus();

    document.getElementById("btn-save-key").addEventListener("click", () => {
        localStorage.setItem("nebula_cep_key", keyInput.value.trim());
        updateApiStatus();
        systemMsg.innerText = "Chave da Stability AI salva!";
    });

    function updateApiStatus() {
        if (keyInput.value.startsWith("sk-")) {
            statusText.innerText = "API Ready";
            statusDot.className = "status-dot green";
        } else {
            statusText.innerText = "API Missing";
            statusDot.className = "status-dot red";
        }
    }

    // BOTÃO 1: SINCROZINAR
    btnSync.addEventListener("click", () => {
        systemMsg.innerText = "Puxando do Photoshop...";
        csInterface.evalScript("syncSelection()", function(result) {
            if (result.startsWith("ERRO|")) {
                systemMsg.innerText = "Erro: Faça um letreiro no PS primeiro.";
                return;
            }

            const parts = result.split("|");
            state.selection = { left: parts[2], top: parts[3], right: parts[4], bottom: parts[5] };

            try {
                const buffer = fs.readFileSync(parts[1]);
                state.base64ToProcess = buffer.toString('base64');

                previewImg.src = "data:image/jpeg;base64," + state.base64ToProcess;
                previewImg.style.display = "block";
                emptyState.style.display = "none";
                
                systemMsg.innerText = "✓ Sincronizado! Pronto para a IA.";
                btnExecute.classList.remove("disabled");
            } catch(e) {
                systemMsg.innerText = "Falha de leitura: " + e.message;
            }
        });
    });

    // BOTÃO 2: CLEAN & REDRAW (O Novo Motor: Stable Diffusion 3.5 Medium)
    btnExecute.addEventListener("click", async () => {
        if (btnExecute.classList.contains("disabled") || !state.base64ToProcess) return;
        const apiKey = localStorage.getItem("nebula_cep_key");
        
        if (!apiKey || !apiKey.startsWith("sk-")) { 
            alert("Configure sua chave da Stability AI (começa com sk-)."); 
            return; 
        }

        systemMsg.innerText = "Preparando imagem...";
        btnExecute.classList.add("disabled");

        try {
            // --- AUTO-UPSCALER MANTIDO ---
            const imgForResize = new Image();
            imgForResize.src = "data:image/jpeg;base64," + state.base64ToProcess;
            
            await new Promise(resolve => imgForResize.onload = resolve);

            let finalBase64 = state.base64ToProcess;
            const minPixels = 262144; // O limite da API (512x512)
            const currentPixels = imgForResize.width * imgForResize.height;

            if (currentPixels < minPixels) {
                systemMsg.innerText = "Recorte pequeno. Ampliando para a IA...";
                const canvasResizer = document.createElement('canvas');
                const scale = Math.max(512 / imgForResize.width, 512 / imgForResize.height);
                canvasResizer.width = imgForResize.width * scale;
                canvasResizer.height = imgForResize.height * scale;
                
                const ctxResizer = canvasResizer.getContext('2d');
                ctxResizer.drawImage(imgForResize, 0, 0, canvasResizer.width, canvasResizer.height);
                finalBase64 = canvasResizer.toDataURL('image/jpeg', 0.9).split(',')[1];
            }
            // -----------------------------------------------------------

            systemMsg.innerText = "SD 3.5 Medium processando... Aguarde.";

            // --- NOVA ESTRUTURA DA API V2BETA ---
            const formData = new FormData();
            formData.append('image', base64ToBlob(finalBase64));
            formData.append('prompt', 'perfectly clean manga background, no text, no speech bubbles, reconstruction, high quality');
            formData.append('mode', 'image-to-image');
            formData.append('model', 'sd3.5-medium');
            formData.append('strength', 0.90); // Agora a IA tem 90% de liberdade para apagar coisas
            formData.append('output_format', 'jpeg');

            // Chamada para a rota moderna (SD3)
            const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.name || errData.message || "Falha na Stability AI v2");
            }

            const data = await response.json();
            
            // Sucesso! A API v2beta devolve o Base64 direto na propriedade 'image'
            state.resultBase64 = data.image;
            document.getElementById("preview-image").src = "data:image/jpeg;base64," + state.resultBase64;
            
            systemMsg.innerText = "✨ IA finalizou! Aplique na camada.";
            document.getElementById("btn-apply").classList.remove("disabled");

        } catch (err) {
            systemMsg.innerText = "Erro IA: " + err.message;
            btnExecute.classList.remove("disabled");
        }
    });


    // BOTÃO 3: APPLY TO LAYER
    btnApply.addEventListener("click", () => {
        if (btnApply.classList.contains("disabled") || !state.resultBase64) return;
        systemMsg.innerText = "Colando no Photoshop...";
        
        const tempPath = path.join(os.tmpdir(), "nebula_result.jpg");
        fs.writeFileSync(tempPath, Buffer.from(state.resultBase64, 'base64'));
        
        csInterface.evalScript(`applyResult("${tempPath.replace(/\\/g, '\\\\')}", ${state.selection.left}, ${state.selection.top}, ${state.selection.right}, ${state.selection.bottom})`, (result) => {
            if (result === "OK") {
                systemMsg.innerText = "Sucesso absoluto!";
            } else {
                systemMsg.innerText = "Erro ao colar: " + result;
            }
        });
    });

    // BOTÃO 4: CLEAR
    btnClear.addEventListener("click", () => {
        state.selection = null;
        state.base64ToProcess = null;
        state.resultBase64 = null;
        previewImg.style.display = "none";
        emptyState.style.display = "block";
        btnExecute.classList.add("disabled");
        btnApply.classList.add("disabled");
        systemMsg.innerText = "Memória limpa.";
    });
});