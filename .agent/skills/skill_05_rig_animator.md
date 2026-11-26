# Skill 05 — Rig Animator & Cinemática 2.5D (`opdc-rig-camera`)

## Papel
Controlar a animação e cinemática dos modelos Three.js articulados gerados pelo `Studio25DEngine.js` sob o Protocolo ARGON, garantindo lip-sync determinístico, vida orgânica e câmera cinematográfica com Parallax real.

## Módulos e Travas Obrigatórias
1. **Scene Graph Articulado (`window.CHAR_RIG[charId]`):**
   - Respeitar os pivôs anatômicos: `torsoGroup` (respiração), `headGroup` (micro-rotações e visemas), `browsGroup` (expressões), `mouthGroup` (abertura de fala), `armLeftGroup` / `armRightGroup` (rotação de ombros).
2. **Lip-Sync Procedural por Envelope de Volume a 60Hz:**
   - Modula `mouthGroup.scale.y` e `mustacheGroup.position.y` proporcionalmente à amplitude sonora instantânea.
3. **Vida Orgânica Procedural:**
   - Respiração contínua com expansão de tronco em senoide (`torsoGroup.scale.y = 1 + sin(t*2.2)*0.012`).
   - Piscadas automáticas a cada 3–4s com pálpebras fechando em 120ms (`scale.y = 1.0`).
4. **Cinematografia & Parallax Real:**
   - Utilizar interpolação `smootherstep(t)` para todos os enquadramentos de câmera.
   - Parallax real nos eixos X/Y/Z deslocando camadas de fundo (`Layer -20` a `-5`) e personagens (`Layer 0 a 8`).
5. **Travas Imutáveis ARGON (`ERR-010` a `ERR-012`):**
   - Proporção rigorosa de 6.5 cabeças; ombros com caimento orgânico contínuo; zero vazamentos de peças.
