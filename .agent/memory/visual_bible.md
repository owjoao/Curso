# Bíblia Visual do Estúdio 2.5D — Protocolo ARGON & Linha Editorial

## 1. Identidade Visual & Formato
- **Estilo Artístico:** Animação Vetorial em Camadas Extrudadas 2.5D (*Editorial Flat Matte*).
- **Zero Primitivas 3D Clichês:** Todo modelo nasce de curvas vetoriais 2D (`THREE.Shape`) com extrusão rasa (`0.018`), preservando a estética gráfica ilustrada com iluminação cel-shade, sem brilho plástico de videogame.
- **Resoluções Canônicas:**
  - **Vertical (9:16):** `1080 x 1920` (Shorts, TikTok, Reels de alta retenção).
  - **Horizontal (16:9):** `1920 x 1080` (Documentários completos de história e ciência).
- **Taxa de Quadros:** Rigorosamente **60.0 fps** determinístico via `window.stepSimulation(frame, amp, expr, cam)`.

---

## 2. Anatomia Padrão Universal ARGON (6.5 Cabeças)
Todos os personagens do estúdio compartilham obrigatoriamente a mesma fundação geométrica e esqueleto de rigging (`buildHumanoidCharacter`):

1. **Escala Corporal (6.5 Cabeças / Altura Total ~7.10):**
   - Proporção estatuária, esguia e imponente que elimina qualquer aspecto quadrado, infantil ou atarracado.
2. **Cabeça & Queixo:**
   - Formato squircle proporcional (`y = 1.65, w = 1.05, h = 1.25`, queixo em `y = 1.05`).
   - Sombra facial lateral direita em tom cel-shade mais escuro.
3. **Pescoço & Conexão com o Colarinho:**
   - Pescoço firme e visível (`y = 0.98, w = 0.35, h = 0.26`) encaixando solidamente a base do queixo (`y = 1.05`) ao colarinho da roupa (`y = 0.90`), com meia-lua de sombra de mandíbula.
4. **Ombros Naturais (Anti-Quina de 90°):**
   - Caimento anatômico suave de 25° partindo do colarinho até o deltoide superior (`y = 0.65`). Mangas curvadas organicamente sem cortes retos horizontais.
5. **Mãos & Braços:**
   - Mãos com punho e polegar anatômico (`x = ±0.72, y = -1.32`).
6. **Membros Inferiores & Calçados:**
   - Pernas alongadas com gancho canônico coberto pela barra da roupa superior (`yTop = -1.15` até `y = -4.80`).
   - Calçados com sola nivelada e apoio sobre a sombra elíptica do solo em `y = -4.85`.

---

## 3. Sistema Modular de Figurinos (`outfit`)
A anatomia do corpo nunca é redesenhada. Para novos personagens, criam-se apenas presets de vestimenta:

- **Farda Militar WW2 (`military_uniform_ww2`):**
  - Túnica militar alongada em sarja cáqui/cinza (`#56503f`), costura central com botões escuros, cinto de couro marrom com fivela dourada em `y = -0.30`, Cruz de Ferro no bolso peitoral esquerdo e braçadeira vermelha no braço esquerdo 100% contida dentro da manga (`x ∈ [-0.85, -0.59]`).
  - Calças de montaria afuniladas com vincos (`Layer 1.4`) e botas de couro de cano alto lustradas (`Layer 1.7`) com filete vertical de reflexo.
- **Terno Clássico Diplomático (`classic_suit`):**
  - Paletó de corte clássico escuro (`#242830`), lapelas notch elegantes (`#181a20`), camisa branca de colarinho engomado, gravata de seda carmesim (`#7a2228`), lenço branco dobrado no bolso superior (`pocket square`).
  - Calças sociais retas com vinco e sapatos masculinos Oxford de couro lustrado com salto.
- **Manequim Base ARGON (`mannequin`):**
  - Corpo neutro em tom de cinza de estúdio com marcações sutis de peitoral e abdômen, servindo como molde puro de teste.

---

## 4. Feições Pessoais & Cabelo (`features`)
- **Pelos Faciais & Respiro de Pele (`ERR-010`):**
  - O bigode deve obrigatoriamente manter um respiro visível de pele de pelo menos **`0.07` unidades** entre a base do nariz e o topo do bigode (evita colisão visual).
  - Estilos suportados: `toothbrush` (escovinha/Hitler), `pencil` (fino/diplomata), `walrus` (farto/Stalin), `none` (rosto liso).
- **Cabelos & Penteados:**
  - `side_part_hitler`: Cabelo escuro penteado com franja diagonal caindo sobre a costeleta esquerda e mechas de luz.
  - `slick_back`: Cabelo repartido elegante para trás com costeletas visíveis dos dois lados.
- **Expressões nas Sobrancelhas (`browsGroup`):**
  - Rotações paramétricas controladas pelo roteiro: `neutral`, `stern`, `angry`, `surprised`, `smirk`.
- **Olhos & Pálpebras:**
  - Pupilas escuras com brilho especular branco e pálpebras articuladas para piscada orgânica rápida de `120ms`.

---

## 5. Cenários Multiplano Z & Iluminação Parallax
- **Camadas de Profundidade:**
  - `Layer -20`: Céu / Fundo distante com gradiente atmosférico.
  - `Layer -12`: Arquitetura histórica (vitrais, arcos, colunas, trincheiras, fachadas).
  - `Layer -5`: Mobiliário e props interativos (mesas de mapa, púlpitos, mastros).
  - `Layer 0 a 8`: Espaço exclusivo de atuação dos Personagens ARGON.
  - `Layer +10`: Primeiro plano, partículas de poeira e feixes de luz com `AdditiveBlending`.
- **Paleta Cromática de Época:**
  - Tons nobres e materiais clássicos: latão envelhecido, bronze, carvalho escuro, verde esmeralda de conferência (`#20362a`), nanquim ameixa (`#241726`), vermelho escarlate e papel envelhecido.
