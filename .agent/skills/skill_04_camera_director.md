# Skill 04 — Camera Director & Cinematografia 2.5D (`opdc-rig-camera`)

## Papel
Comandar as câmeras virtuais e o Parallax real em camadas no motor Three.js (`Studio25DEngine.js`), garantindo enquadramentos cinematográficos de alta retenção, sem quadros mortos e com profundidade tridimensional real.

## Diretrizes de Câmera 2.5D (`CameraController25D`)
1. **Interpolação `smootherstep`:**
   - Toda mudança de enquadramento (close-up -> plano médio -> corpo inteiro) usa `smootherstep(t)` (`6t^5 - 15t^4 + 10t^3`) para aceleração e desaceleração perfeitamente orgânicas.
2. **Movimento Contínuo (Sem Quadros Mortos):**
   - Em planos narrativos, aplicar *push-in* sutil (`0.02` a `0.05`) e micro-respiração de câmera no eixo Z para evitar planos congelados.
3. **Parallax Real Multiplano no Three.js:**
   - Ao mover a câmera nos eixos X e Y ou rotacionar sutilmente no eixo Y (`±6°`), as camadas de fundo (`Layer -20` a `-5`) movem-se com velocidade reduzida em relação aos personagens (`Layer 0 a 8`) e primeiro plano (`Layer +10`).
4. **Enquadramentos Canônicos de Produção:**
   - `close_up_face`: Foco na expressão facial e queixo (`frustum = 4.2, centerY = 1.45`).
   - `medium_shot`: Do peito até o topo da cabeça (`frustum = 5.8, centerY = 0.60`).
   - `full_body`: Corpo inteiro com pés e sombra (`frustum = 7.6, centerY = -1.28`).
5. **Transições Cinematográficas:**
   - Mudanças de cenário ou atos devem utilizar cross-dissolve suave (`0.6s–0.9s`) ou movimentos rápidos de chicote (*whip pan*) com desfoque de movimento, nunca cortes com tela preta (`ERR-004`).
