# Skill 07 — Audio & Render Engineer (Engenheiro de Áudio & Renderização 60fps)

## Papel
Gerar a dublagem neural PT-BR, extrair o envelope de volume a 60Hz para o lip-sync determinístico, compor o sound design com auto-ducking e renderizar o vídeo final H.264/AAC MP4 a 60fps via Playwright + FFmpeg sem deadlocks no Windows.

## Checklist de Produção & Renderização
1. **Síntese Neural & Timestamps (`edge-tts`):**
   - Gerar voz documental via `edge-tts` (`pt-BR-AntonioNeural`), medir durações exatas por fala e salvar `cue_timings.json`.
2. **Extração de Volume a 60Hz (`audio_envelope.json`):**
   - Calcular a energia RMS do áudio amostrada a 60 quadros/segundo.
   - Salvar `audio_envelope.json` (array normalizado de 0.0 a 1.0) para alimentar `window.stepSimulation(frame, amp)`.
3. **Sound Design & Auto-Ducking Dinâmico:**
   - Adicionar trilha sonora de época + efeitos de transição/foley.
   - Aplicar ducking automático: trilha a ~0.18x durante falas e ~0.50x nos respiros.
4. **Captura Determinística via Playwright & Prevenção de Deadlock (`ERR-014`):**
   - Iniciar Playwright/Chrome em modo headless limpo.
   - Chamar `window.stepSimulation(frame, amp, expr, cam)` sequencialmente para cada frame.
   - **PROIBIDO `stderr=subprocess.PIPE`** ao pipear imagens para o FFmpeg no Windows (trava em 64KB).
   - Usar sempre `stderr=open('ffmpeg_render.log', 'w')` e `-loglevel warning`.
5. **Exportação Final MP4:**
   - Codec: H.264 (`libx264`, `pix_fmt yuv420p`, `-crf 18`, `-preset slow`).
   - Áudio: AAC `192k`, `48000 Hz`.
   - Taxa de quadros: rigorosamente 60.0 fps (ou 30.0 fps).
