# Template — Estúdio Autônomo de Animação 3D/2D (Shorts & Reels)

Modelo completo de produção automática de vídeos verticais 9:16 com **Remotion + Three.js Cel-Shaded**, narração neural em PT-BR (`edge-tts`), legendas karaokê sincronizadas, agentes/skills organizados e publicação automática via **YouTube Data API v3**.

## 1. Pré-requisitos
- Node.js 18+
- Python 3.10+
- FFmpeg no PATH do sistema
- Google Chrome instalado

## 2. Instalação
```bash
npm install
pip install -r requirements.txt
```

## 3. Configurar API Oficial do YouTube
1. Crie um projeto no Google Cloud Console e ative a **YouTube Data API v3**.
2. Crie uma credencial OAuth 2.0 (Aplicativo para computador) e baixe o JSON.
3. Salve o arquivo na raiz deste projeto como **`client_secret.json`** (veja `client_secret.example.json`).
4. Na tela de consentimento OAuth (modo Teste), adicione o seu e-mail do Google em **Usuários de teste**.
5. Rode `python scripts/youtube_api_uploader.py --check-only` para autenticar e gerar seu `youtube_token.json`.

## 4. Renderizar o Episódio 3D de Exemplo (`Bananas3D`)
```bash
npx remotion render src/index.ts Bananas3D out/bananas_3d_final.mp4 --gl=angle --browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

## 5. Orquestração e Fila de Pautas
- Edite `pautas_fila.json` com suas pautas (seguindo a regra do gancho *'Por que...'* nos primeiros 3s).
- Liste a fila: `python producao_autonoma.py --listar`
- Teste geração sem publicar: `python producao_autonoma.py --dry-run`
- Gere e publique o próximo no YouTube: `python producao_autonoma.py --proximo`

## 6. Estrutura de Agentes, Skills e Regras
- `.agent/REGRAS_CANAL_OPDC.md` — Regras editoriais, enquadramento 9:16 e padrões de qualidade.
- `.agent/memory/lessons_learned.json` — Regras canônicas (`ERR-001` a `ERR-026`).
- `.agent/skills/` e `skills/` — Skills de roteiro, cenário, câmera, rig, áudio e QA.
- `team/` — Definições dos agentes especialistas (`opdc-diretor`, `opdc-roteirista`, etc.).
