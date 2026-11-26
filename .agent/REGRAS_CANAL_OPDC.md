# Regras Oficiais do Canal — O Porquê das Coisas

## 1. Regra de Ouro do Gancho ("Por quê?")
- **Todo episódio (Título, Primeira Frase do Roteiro e Legenda)** deve começar com **"Por que..."** ou induzir imediatamente o público a se perguntar **"Por quê?"** nos primeiros 3 segundos.
- Nunca começar com saudações genéricas ("Olá pessoal", "Você sabia que..."). Vá direto para a pergunta ou paradoxo.

## 2. Padrão Visual & Motores Aprovados
- **Formato:** Vertical **9:16 (1080x1920 @ 30fps)**, H.264 `yuv420p`, áudio AAC 192k (`-24 LUFS` / `-14 LUFS` normalizado).
- **Motor Principal (3D Cel-Shaded):** Remotion + Three.js (`src/videos/<slug>/` baseado em `templates/dumont3d/`), usando o **Professor Canônico** (`LOOKS.professor`) e objetos 3D estilizados com contorno preto (*ink outlines*), céu/fundo saturado e câmera cinematográfica.
- **Texto na Tela:** Nunca usar emojis coloridos em fontes do sistema que não suportam (evitar `□□`); usar apenas caracteres PT-BR limpos ou renderização HTML/CSS no Remotion.

## 3. Equipe de Agentes & Skills
| Agente | Função | Skill / Arquivo |
| :--- | :--- | :--- |
| `opdc-diretor` | Orquestração geral e aprovação de pautas | `.agent/skills/skill_00_studio_director.md` |
| `opdc-roteirista` | Roteiros PT-BR com gancho "Por quê?" | `.agent/skills/skill_01_scriptwriter.md` |
| `opdc-cenario-arte` | Cenários 3D/2.5D e iluminação | `.agent/skills/skill_02_scenery_builder.md`, `skill_03_lighting_vfx.md` |
| `opdc-rig-camera` | Animação do Professor, poses e câmera | `.agent/skills/skill_04_camera_director.md`, `skill_05_rig_animator.md` |
| `opdc-audio-render` | Voz neural (`pt-BR-AntonioNeural`) e FFmpeg | `.agent/skills/skill_07_audio_and_render.md` |
| `opdc-qa-curador` | QA técnico (`ffprobe`) e auditoria visual | `.agent/skills/skill_06_qa_reviewer.md` |

## 4. Publicação Oficial (APIs & Perfis Corretos)
- **YouTube:** Canal **`seu_canal_youtube` (`@seu_canal_youtube`)** — ID `SEU_CHANNEL_ID`.
  - Publicação 100% automática via **YouTube Data API v3** (`scripts/youtube_api_uploader.py` + `youtube_token.json`).
  - **Atenção:** Nunca usar o canal `OutroCanal` ou `seu_perfil` para vídeos de O Porquê das Coisas.
- **TikTok:** Perfil **`@seu_perfil_tiktok`** via navegador isolado (CDP porta `9230`, `scripts/tiktok_scraper.py`).
- **Controle de Fila:** Todas as pautas ficam em `pautas_fila.json` e publicações registradas em `historico_publicacoes.json`.
