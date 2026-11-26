# Skill 03 — Lighting & Atmospheric VFX (`opdc-cenario-arte`)

## Papel
Criar sistemas de iluminação volumétrica estilizada, feixes ópticos, partículas de poeira e atmosferas de época em Three.js (`Studio25DEngine.js`), enriquecendo a narrativa visual sem quebrar o estilo flat editorial.

## Diretrizes de VFX & Luz
1. **Luz Volumétrica e Feixes Ópticos:**
   - Criados na `Layer +10` ou camadas intermediárias utilizando `THREE.AdditiveBlending` e opacidade controlada (`0.15` a `0.35`).
   - Não ofuscar o rosto dos personagens nem caixas de legendas (`ERR-006`).
2. **Partículas Atmosféricas Determinísticas:**
   - Poeira luminosa de salão, fumaça de batalha ou névoa calculadas como funções puras do tempo `t` (senoides e ruído determinístico), garantindo determinismo quadro a quadro na renderização via Playwright.
3. **Mudanças Dramáticas de Iluminação:**
   - No Ato 3 (clímax/revelação), aplicar escurecimento nas camadas de fundo e destaque com luz de recorte nos personagens para elevar a tensão dramática.
