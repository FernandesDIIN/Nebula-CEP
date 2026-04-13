# NebulaRedraw AI (CEP Version)

**NebulaRedraw AI** é uma extensão para Adobe Photoshop baseada na arquitetura **CEP (Common Extensibility Platform)**. Esta versão é compatível com Photoshop 2020+ (CSXS 10) e utiliza HTML/JS para a interface e ExtendScript (.jsx) para comunicação com o Photoshop.

## Estrutura do Projeto

*   `CSXS/manifest.xml`: Configuração da extensão (ID, Versão, Hosts).
*   `host/index.jsx`: Scripts que rodam dentro do Photoshop (ExtendScript).
*   `index.html`: Interface do usuário.
*   `style.css`: Estilização (Tema Escuro).
*   `main.js`: Lógica da interface e ponte com o Photoshop.
*   `api-handler.js`: Comunicação com a API do Google Gemini.
*   `CSInterface.js`: Biblioteca oficial da Adobe para extensões CEP.

## Como Instalar

1.  **Habilitar Modo Debug:**
    Para carregar extensões não assinadas, você precisa habilitar o modo de depuração no seu computador:
    *   **Windows:** Abra o `regedit` e vá em `HKEY_CURRENT_USER\Software\Adobe\CSXS.10`. Crie uma nova String chamada `PlayerDebugMode` com o valor `1`.
    *   **Mac:** No terminal, digite: `defaults write com.adobe.CSXS.10 PlayerDebugMode 1`.

2.  **Copiar para a pasta de extensões:**
    Copie a pasta `Nebula-CEP` para o diretório de extensões da Adobe:
    *   **Windows:** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
    *   **Mac:** `/Library/Application Support/Adobe/CEP/extensions/`

3.  **Reiniciar o Photoshop:**
    Abra o Photoshop e vá em `Janela > Extensões > NebulaRedraw AI`.

## Desenvolvimento

*   **API Key:** Você deve configurar sua API Key do Gemini no painel de configurações (ícone de engrenagem).
*   **Node.js:** Esta extensão tem o Node.js habilitado (`--enable-nodejs` no manifest), permitindo o uso de `require('fs')` para manipular arquivos temporários.

## Licença

MIT License.

