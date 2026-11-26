---
name: o-porque-das-coisas-director
description: Diretor Audiovisual e Orquestrador do Estúdio de Animação 2D/2.5D (Engine2D + Three.js Studio25DEngine + Protocolo ARGON). Conecta roteiros, personagens articulados, cenários multiplano, rig e câmera com Lip-Sync determinístico e renderização MP4 auditada.
---

# O Porquê das Coisas — Diretor do Estúdio 2D/3D (Animated-23D-Xavier)

Esta skill governa a operação audiovisual do estúdio **O Porquê das Coisas**, unificada sob a arquitetura **Animated-23D-Xavier (Remotion + Three.js + TypeScript)** localizada em `.`.

---

## 1. Motores Gráficos do Estúdio (Dual-Engine 2D & 3D)

O estúdio opera nativamente em dois modos visuais intercambiáveis:

1. **Modo 3D Articulado Completo (`Dumont3D` / `src/videos/dumont3d/`):**
   - Personagens 3D volumétricos com juntas anatômicas blindadas (cotovelos dobráveis, joelhos, passadas com bob vertical e giro de quadril).
   - Rostos dinâmicos gerados via decal de Canvas 2D (olhos piscando, bocas paramétricas com Lip-Sync por amplitude de áudio, sobrancelhas e bigodes).
   - Iluminação Three.js rica com sombras projetadas no chão e nos objetos (`castShadow` / `receiveShadow`).
   - Câmera orbital livre com transições cinemáticas e enquadramento vertical 9:16 (1080x1920).
   - Suporte nativo ao **Professor Canônico** (`LOOKS.professor` em `chars.ts` com paletó roxo `#5e1672`, gravata borboleta laranja `#e6551b`, óculos redondos e bigode).

2. **Modo 2D Vetorial em Cenário 3D (`PisaShort` / `BridgeShort`):**
   - Personagens 2D em estilo *bean-head* / cards recortados com contorno de tinta preta (*ink outlines*).
   - Cenários 3D coloridos e estilizados, com iluminação solar saturada e profundidade de campo.
   - Ideal para contação de histórias rápidas, fábulas e fatos científicos diretos.

3. **Motor 2.5D Studio25DEngine (ARGON):**
   - Disponível para infográficos técnicos, moedas e montagens multiplano em camadas Z.

---

## 2. Equipe Especialista Integrada

1. **`opdc-char-builder-25d`** — Modela personagens em `THREE.Shape` extrudados seguindo o grid ARGON, com pivots em `torsoGroup`, `armLeftGroup`, `armRightGroup`, `headGroup`, `browsGroup`, `eyesGroup` e `mouthGroup`.
2. **`opdc-roteirista`** — Roteiriza com tags de atuação `[CHAR / POSE / EXPRESSION / CAM]`.
3. **`opdc-cenario-arte`** — Constrói ambientes multiplano Z (Céu `Layer -20`, Arquitetura `Layer -12`, Props `Layer -5`, Foreground `Layer +10`).
4. **`opdc-rig-camera`** — Controla LipSync procedural, respiração orgânica, piscadas e parallax de câmera 2.5D com Macro-Zoom óptico.
5. **`opdc-audio-render`** — Síntese neural (`pt-BR-AntonioNeural`), geração de `audio_envelope.json` a 60Hz e mixagem FFmpeg com ducking.
6. **`opdc-qa-curador`** — Validação do grid ARGON (sem colisões ou vazamentos), Z-fighting check, `blackdetect` e conformidade de proporções e anatomia final.

---

## 3. FÁBRICA CANÔNICA DE PERSONAGENS 2.5D (ANATOMIA PADRÃO UNIVERSAL ARGON - ERR-018)
É TERMINANTEMENTE PROIBIDO modelar bonecos planos improvisados com círculos e planos avulsos. Todo personagem humanoide deve ser instanciado obrigatoriamente através da Fábrica Canônica Universal (`UniversalHumanoidFactory.js` ou `Studio25DEngine.prototype.buildHumanoidCharacter`):

```javascript
import { createCanonicalProfessor } from './src/core/UniversalHumanoidFactory.js';
// Carrega o Professor Canônico oficial completo com roupas, colete, estrela e articulações:
const profRig = createCanonicalProfessor(THREE, scene, { x: 0, y: -0.30, scale: 1.05 });
```

Para qualquer outro personagem histórico ou científico, usa-se a mesma anatomia blindada alterando apenas o figurino e os traços:
```javascript
import { buildCanonicalHumanoid } from './src/core/UniversalHumanoidFactory.js';
const personagem = buildCanonicalHumanoid(THREE, scene, {
  id: 'albert_einstein',
  outfit: { type: 'classic_suit' },
  features: { hair: 'wild_scientist', mustache: 'eccentric_arch', wrinkles: true }
});
```

---

## 4. PORTÕES DE QUALIDADE & AUDITORIA INQUISITIVA DO QA CURADOR (ERR-015 e ERR-016)

Nenhum vídeo é finalizado sem submissão ao **Questionário Inquisitivo de 32 Perguntas Críticas** executado pelo `opdc-qa-curador`:

1. **Integridade de Peças:** Cabeça, pescoço, ombros, mangas, punhos, mãos, pernas e sapatos devem estar 100% conectados sem vácuos ou membros levitando soltos. Veículos devem ter rodas e chaminés acopladas ao chassi.
2. **Cabelo vs Barba & Feições:** Cabelo restrito ao crânio (proibido descer se fundindo com o bigode como barba espúria). Respiro de pele entre nariz e bigode $\ge 0.07$ unidades (`ERR-005`). Cabelo compacto estilo Einstein sem inchaço de cogumelo.
3. **Mãos & Polegares:** Polegares sempre voltados para cima ou para fora na orientação anatômica correta (proibido polegares para baixo ou mãos espelhadas ao contrário). Braços sempre abrem para fora do corpo.
4. **Proporções Canônicas & Macro Óptico (`ERR-016`):**
   - **Moeda vs Cabeça/Mão:** Diâmetro da moeda deve ser de **10% a 18% da altura da cabeça**, cabendo confortavelmente na palma da mão ou entre os dedos. Proibido moedas com tamanho de cabeça (parecendo escudos ou pratos de jantar).
   - **Macro Zoom Cinematográfico:** Detalhes de bordas (ex: 96 ranhuras da moeda) devem ser revelados por **aproximação de câmera (dolly-in / macro zoom)** e NUNCA por modelar um objeto gigante no mundo 3D.
   - **Cenário vs Personagem:** Mesas e bancadas devem alinhar na altura da cintura/cotovelos (~45% da altura total). Portas e veículos devem respeitar a escala humana.
5. **Enquadramento & Oclusão:** Elementos estelares (moeda, ranhura, torre) devem estar 100% íntegros dentro da safe zone 9:16 vertical sem serem cortados por bordas da tela ou oclusos por legendas.
6. **Física de Movimento:** Objetos como moedas em cara-ou-coroa devem girar em cambalhotas no eixo horizontal (*referee end-over-end flips*). Pausas narrativas devem conter *creeping push-in* de câmera ($0.15\%$ a $0.35\%$/f) para eliminar frames congelados.
7. **Integridade Técnica:** Zero Z-fighting, zero telas pretas $\ge 0.15$s (`blackdetect`), áudio a -24 LUFS.
