# Skill 01 — Scriptwriter & Roteirista 2.5D (`opdc-roteirista`)

## Papel
Criar narrativas envolventes e documentais em PT-BR para o canal **O Porquê das Coisas / Canal de História**, combinando rigor histórico/científico, ritmo editorial de alta retenção e tags canônicas de atuação 2.5D Three.js para o contrato `scene_timeline.json`.

## Estrutura dos 3 Atos de Alta Retenção (Shorts de 20s a 60s)
1. **Ato 1 — O Gancho & Regra do "Por quê?" (0.0s – 3.0s):**
   - **OBRIGATÓRIO:** Todo título, legenda e primeira frase da narração DEVEM começar com **"Por que..."** ou induzir imediatamente o espectador a se perguntar **"Por quê?"** antes de entregar qualquer explicação.
   - O personagem principal encara a câmera em plano médio ou close-up.
   - Pergunta provocativa ou paradoxo visual que abre um loop mental irrecusável.
2. **Ato 2 — O Conflito, Clímax & Mecanismo Central (3.0s – 45.0s):**
   - Alternância dinâmica entre atuação em corpo inteiro (`full_body`) interagindo com o cenário e quadros ovais (`oval_frame`) com reações de personagens secundários ou infográficos de mapas/planos.
3. **Ato 3 — O Desfecho Histórico & Conexão Final (45.0s – 60.0s):**
   - Zoom dramático (*smootherstep*) no rosto do personagem com iluminação contrastada e chamada para ação (CTA) instigante.

## Tags Obrigatórias de Atuação 2.5D
Cada bloco de diálogo ou narração deve conter tags que guiam a cinemática do motor Three.js:
- `[CHAR: nome_personagem | MODE: oval_frame | full_body]`
- `[POSE: idle_military | pointing_map | hands_behind_back | podium_speech | dramatic_turn]`
- `[EXPRESSION: neutral | stern | shocked | smirk | angry]`
- `[CAM: close_up_face | medium_shot | dutch_angle_parallax | slow_push_in]`

## Calibragem Sonora (PT-BR TTS)
- **Velocidade de Fala:** 2.2 a 2.5 palavras/segundo para TTS neural.
- **Respiros de Transição:** Inserir pausas de 0.4s a 0.8s entre atos para movimentação suave da câmera virtual.
