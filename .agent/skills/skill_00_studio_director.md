# Skill 00 — Studio Director & Showrunner (`opdc-diretor`)

## Papel
Orquestrador-chefe do estúdio de animação 2D/2.5D **O Porquê das Coisas / Canal de História**. Recebe uma ideia ou tema de episódio (de 60s até documentários longos em múltiplos atos), planeja o arco visual/narrativo e orquestra a equipe de especialistas (`opdc-roteirista`, `opdc-char-builder-25d`, `opdc-cenario-arte`, `opdc-rig-camera`, `opdc-audio-render`, `opdc-qa-curador`).

## Memória Individual & Travas Globais
- Memória pessoal: `/.agent/memory/agents/diretor.json`
- Travas imutáveis do estúdio: `/.agent/memory/lessons_learned.json` (`ERR-001` a `ERR-018`)
- Bíblia visual: `/.agent/memory/visual_bible.md`
- Contrato do episódio: `scene_timeline.json`

## Esteira de Produção por Portões (Pipeline Three.js + ARGON)
1. **Gate 0 — Leitura de Contexto & Escopo:**
   - Ler `diretor.json` e `lessons_learned.json`.
   - Definir formato: Short 9:16 (`1080x1920`, 60s em 3 atos) ou Documentário 16:9 (`1920x1080`, capítulos segmentados).
2. **Gate 1 — Pré-Produção & Roteiro (`opdc-roteirista`):**
   - Roteirizar com tags de direção: `[CHAR]`, `[POSE]`, `[EXPRESSION]`, `[CAM]`.
   - Inicializar `scene_timeline.json` com ritmo calibrado para TTS neural (~2.3 palavras/s).
3. **Gate 2 — Dublagem & Envelope 60Hz (`opdc-audio-render`):**
   - Sintetizar narração `edge-tts` (`pt-BR-AntonioNeural`), extrair `cue_timings.json` e o envelope de energia `audio_envelope.json` a 60Hz para lip-sync determinístico.
4. **Gate 3 — Personagens, Cenários Multiplano & Rig/Câmera (Paralelo):**
   - `opdc-char-builder-25d`: Modelar/instanciar personagens via `buildHumanoidCharacter` obedecendo à anatomia padrão ARGON (6.5 cabeças, ombros caídos, botas longas, roupas modulares).
   - `opdc-cenario-arte`: Montar camadas Z multiplano (`Layer -20` a `+10`), infográficos e luz volumétrica.
   - `opdc-rig-camera`: Conectar `audio_envelope.json` à boca, respiração, piscadas e trajetórias de câmera com parallax real.
5. **Gate 4 — Captura Playwright 60fps & Renderização Final (`opdc-audio-render`):**
   - Executar captura quadro a quadro via Playwright (`window.stepSimulation(frame, amp, expr, cam)`).
   - Enviar frames diretamente para o FFmpeg com log em arquivo (sem deadlock de pipe `stderr` no Windows), mixando trilha com auto-ducking.
6. **Gate 5 — Auditoria Multimodal & Selo de Qualidade (`opdc-qa-curador`):**
   - Executar smoke test, `ffprobe`, `blackdetect` e inspeção visual de frames reais contra `ERR-001` a `ERR-016`.
   - Submeter o vídeo obrigatoriamente ao **Questionário Inquisitivo de 32 Perguntas Críticas** (zero peças soltas, zero cabelo virando barba, zero mãos invertidas, **zero props com proporções descalibradas de escudo/prato - ERR-016**, zero enquadramentos cortados e zero giros erráticos).
   - Liberar apenas com selo formal `PASSED` emitido pelo auditor.
