/**
 * ============================================================================
 * UniversalHumanoidFactory.js
 * FÁBRICA CANÔNICA DE HUMANOIDES 2.5D (PROTOCOLO ARGON 6.5 CABEÇAS)
 * Estúdio: O Porquê das Coisas / Canal de História
 *
 * Módulo reutilizável para carregar o corpo padrão universal em qualquer cena
 * Three.js sem necessidade de reconfiguração manual. Basta passar a skin!
 * ============================================================================
 */

export const ARGON_GRID = {
  head:      { y: 1.65, w: 1.05, h: 1.25, layer: 3.0 },
  eyes:      { x: 0.19, y: 1.65, layer: 5.2 },
  nose:      { y: 1.50, topW: 0.035, botW: 0.15, h: 0.26, layer: 6.0 }, // Base termina em y = 1.37
  mustache:  { y: 1.26, w: 0.15, h: 0.075, layer: 6.4 },               // Respiro de 0.07 de pele do nariz
  mouth:     { y: 1.18, w: 0.15, h: 0.020, layer: 5.0 },
  neck:      { y: 0.98, w: 0.35, h: 0.26, layer: 1.0 },
  torso:     { yTop: 0.90, yBot: -1.25, shoulderW: 0.68, waistW: 0.52, layer: 2.0 },
  belt:      { y: -0.30, w: 1.08, h: 0.14, buckleW: 0.18, layer: 3.8 },
  armLeft:   { xCenter: -0.72, yTop: 0.65, yBot: -1.20, w: 0.26, rotZ: 0.05, layer: 1.8 },
  armRight:  { xCenter:  0.72, yTop: 0.65, yBot: -1.20, w: 0.26, rotZ: -0.05, layer: 1.8 },
  hands:     { x: 0.72, y: -1.32, w: 0.18, h: 0.20, layer: 1.5 },
  breeches:  { yTop: -1.15, yBot: -2.60, hipW: 0.62, kneeW: 0.28, layer: 1.4 },
  boots:     { x: 0.21, yTop: -2.55, yBot: -4.80, w: 0.26, layer: 1.7 },
  shadow:    { y: -4.85, rx: 1.05, ry: 0.15, layer: 0.2 }
};

export const CANONICAL_SHAPES = (THREE) => ({
  ellipse: (rx, ry) => {
    const s = new THREE.Shape();
    s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    return s;
  },
  roundedRect: (w, h, r = 0.02) => {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  },
  diamond: (w, h) => {
    const s = new THREE.Shape();
    s.moveTo(0, h / 2); s.lineTo(w / 2, 0); s.lineTo(0, -h / 2); s.lineTo(-w / 2, 0);
    s.closePath();
    return s;
  },
  trapezoid: (topW, botW, h) => {
    const s = new THREE.Shape();
    s.moveTo(-botW / 2, -h / 2); s.lineTo(botW / 2, -h / 2);
    s.lineTo(topW / 2, h / 2); s.lineTo(-topW / 2, h / 2);
    s.closePath();
    return s;
  },
  arcStroke: (x1, y1, cx, cy, x2, y2, thickness = 0.03) => {
    const s = new THREE.Shape();
    s.moveTo(x1, y1);
    s.quadraticCurveTo(cx, cy, x2, y2);
    s.lineTo(x2, y2 - thickness);
    s.quadraticCurveTo(cx, cy - thickness, x1, y1 - thickness);
    s.closePath();
    return s;
  },
  star5: (outerR, innerR) => {
    const s = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerR : innerR;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }
});

export function buildCanonicalHumanoid(THREE, scene, {
  id = 'humanoid',
  x = 0,
  y = 0,
  z = 0,
  scale = 1.0,
  outfit = { type: 'professor_eccentric' },
  features = { hair: 'wild_scientist', mustache: 'eccentric_arch', glasses: true, smile: true, wrinkles: true },
  palette = {}
} = {}) {
  const A = ARGON_GRID;
  const S = CANONICAL_SHAPES(THREE);
  const zSpacing = 0.025;
  const extrudeDepth = 0.015;

  // Scene Graph Hierárquico Canônico
  const rig = {
    id,
    rootGroup: new THREE.Group(),
    legsGroup: new THREE.Group(),
    torsoGroup: new THREE.Group(),
    armLeftGroup: new THREE.Group(),
    armRightGroup: new THREE.Group(),
    headGroup: new THREE.Group(),
    eyesGroup: new THREE.Group(),
    eyelids: [],
    browsGroup: new THREE.Group(),
    mouthGroup: new THREE.Group(),
    mustacheGroup: new THREE.Group()
  };

  rig.rootGroup.position.set(x, y, z);
  if (scale !== 1.0) rig.rootGroup.scale.set(scale, scale, scale);

  // Pivôs Anatômicos Canônicos (Ajustados para encaixe perfeito do pescoço no colarinho)
  rig.torsoGroup.position.set(0, -1.95, 0);
  rig.armLeftGroup.position.set(-0.72, 0.65, 0.02);
  rig.armRightGroup.position.set(0.72, 0.65, 0.04);
  rig.headGroup.position.set(0, -0.28, 0.06);

  rig.rootGroup.add(rig.legsGroup);
  rig.rootGroup.add(rig.torsoGroup);
  rig.rootGroup.add(rig.armLeftGroup);
  rig.rootGroup.add(rig.armRightGroup);
  rig.rootGroup.add(rig.headGroup);

  rig.headGroup.add(rig.eyesGroup);
  rig.headGroup.add(rig.browsGroup);
  rig.headGroup.add(rig.mouthGroup);
  rig.headGroup.add(rig.mustacheGroup);

  const P = Object.assign({
    skin: 0xf5cfb3,
    skinShadow: 0xdca88a,
    skinDeep: 0xc48c6c,
    profPurpleCoat: 0x5e1672,
    profPurpleCoatDark: 0x3d0c4d,
    profPurpleCoatLight: 0x7c2394,
    profVestYellow: 0xdfa028,
    profVestRed: 0xb7302c,
    profVestBlue: 0x255d82,
    profVestGreen: 0x367347,
    profPantsBrown: 0x863d23,
    profPantsDark: 0x5e2815,
    profPatchGreen: 0x5b6d32,
    profPatchOrange: 0xd9572b,
    profBowtieOrange: 0xe6551b,
    profBowtieYellow: 0xf5b722,
    profStarGold: 0xf6be23,
    profShoePurple: 0x561668,
    profShoeYellow: 0xeca31c,
    profShoeLaces: 0xd62828,
    profSockStripeYellow: 0xf7be23,
    profSockStripePurple: 0x541864,
    profHairGreyBrown: 0xb0b8c4,
    profHairLight: 0xdce2ec,
    profHairDark: 0x7e8898,
    profGlassesFrame: 0x141218,
    profMustacheBrown: 0x735d4f
  }, palette);

  const addLayer = (group, shape, color, layerIndex, { px = 0, py = 0, rotZ = 0, scaleX = 1, scaleY = 1, mirrorX = false, opacity = 1.0 } = {}) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: extrudeDepth, bevelEnabled: false, curveSegments: 24 });
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.15,
      transparent: opacity < 1.0,
      opacity
    });

    const createInst = (dir) => {
      const mesh = new THREE.Mesh(geo, mat);
      let localX = px * dir;
      let localY = py;

      // Compensa offset dos pivôs hierárquicos para alinhamento 100% perfeito (ERR-010 / ERR-018)
      if (group === rig.torsoGroup) {
        localY -= -1.95;
      } else if (
        group === rig.headGroup ||
        group === rig.eyesGroup ||
        group === rig.browsGroup ||
        group === rig.mouthGroup ||
        group === rig.mustacheGroup
      ) {
        localY -= -0.28;
      }
      // NOTA CRÍTICA: armLeftGroup e armRightGroup já possuem pivôs nos ombros (±0.72, 0.65).
      // As geometrias do braço são construídas em coordenadas locais relativas ao ombro (0, 0),
      // portanto NENHUM offset deve ser subtraído aqui, evitando deslocar os braços para o centro do peito.

      mesh.position.set(localX, localY, layerIndex * zSpacing);
      mesh.rotation.z = rotZ * dir;
      mesh.scale.set(scaleX * dir, scaleY, 1);
      group.add(mesh);
      return mesh;
    };

    createInst(1);
    if (mirrorX) createInst(-1);
  };

  // --------------------------------------------------------------------------
  // 1. MEMBROS INFERIORES: SAPATOS BULBOSOS & CALÇA COTELÊ COM RETALHOS
  // --------------------------------------------------------------------------
  if (outfit.type === 'professor_eccentric') {
    [-1, 1].forEach(side => {
      const bx = side * A.boots.x;
      // Sapato roxo
      const shoeBody = new THREE.Shape();
      shoeBody.moveTo(-0.14, -4.32); shoeBody.lineTo(0.14, -4.32);
      shoeBody.lineTo(side > 0 ? 0.26 : 0.18, -4.68);
      shoeBody.lineTo(side > 0 ? 0.22 : 0.14, -4.84);
      shoeBody.lineTo(-0.16, -4.84); shoeBody.closePath();
      addLayer(rig.legsGroup, shoeBody, P.profShoePurple, 1.7, { px: bx });

      // Bico amarelo mostarda bulboso
      const toeBulb = S.ellipse(0.15, 0.13);
      addLayer(rig.legsGroup, toeBulb, P.profShoeYellow, 1.85, { px: bx + (side > 0 ? 0.18 : 0.12), py: -4.68 });

      // Cadarços vermelhos
      addLayer(rig.legsGroup, S.roundedRect(0.12, 0.024, 0.005), P.profShoeLaces, 1.95, { px: bx + 0.02, py: -4.46, rotZ: side * 0.30 });
      addLayer(rig.legsGroup, S.roundedRect(0.12, 0.024, 0.005), P.profShoeLaces, 1.95, { px: bx + 0.02, py: -4.54, rotZ: -side * 0.30 });

      // Meias listradas
      addLayer(rig.legsGroup, S.roundedRect(0.18, 0.06, 0.004), P.profSockStripeYellow, 1.6, { px: bx, py: -4.10 });
      addLayer(rig.legsGroup, S.roundedRect(0.18, 0.06, 0.004), P.profSockStripePurple, 1.6, { px: bx, py: -4.20 });
    });

    // Calça de veludo cotelê marrom
    const profPants = new THREE.Shape();
    profPants.moveTo(-A.breeches.hipW * 0.95, A.breeches.yTop);
    profPants.lineTo(A.breeches.hipW * 0.95, A.breeches.yTop);
    profPants.lineTo(0.34, -4.02); profPants.lineTo(0.10, -4.02);
    profPants.lineTo(0, -1.55); // Gancho
    profPants.lineTo(-0.10, -4.02); profPants.lineTo(-0.34, -4.02);
    profPants.closePath();
    addLayer(rig.legsGroup, profPants, P.profPantsBrown, A.breeches.layer);

    // Retalho Verde Oliva no joelho direito (esquerda do observador)
    addLayer(rig.legsGroup, S.roundedRect(0.18, 0.20, 0.02), P.profPatchGreen, 1.5, { px: -0.22, py: -2.72, rotZ: 0.08 });
    // Retalho Laranja Ferrugem no joelho esquerdo (direita do observador)
    addLayer(rig.legsGroup, S.roundedRect(0.18, 0.20, 0.02), P.profPatchOrange, 1.5, { px: 0.22, py: -2.72, rotZ: -0.08 });
  }

  // --------------------------------------------------------------------------
  // 2. TORSO: COLETE ARGYLE ABERTO + CASACO DE VELUDO ROXO + ESTRELA DOURADA
  // --------------------------------------------------------------------------
  // 2. TORSO: CORPO BASE DO CASACO ROXO + COLETE ARGYLE + GRAVATA + LAPELAS
  // --------------------------------------------------------------------------
  // Base estrutural do casaco de veludo roxo cobrindo peito, flancos e cintura (Layer 2.0)
  // Garante fechamento hermético entre os ombros, peitoral e a cintura com a calça (ERR-001 / ERR-018)
  const tunicBody = new THREE.Shape();
  tunicBody.moveTo(-0.16, 0.90);
  tunicBody.lineTo(0.16, 0.90);
  tunicBody.quadraticCurveTo(0.44, 0.85, A.torso.shoulderW, 0.65);
  tunicBody.quadraticCurveTo(0.66, 0.10, A.torso.waistW, -0.30);
  tunicBody.lineTo(0.60, -1.35); // Barra inferior unindo cintura e calça
  tunicBody.lineTo(-0.60, -1.35);
  tunicBody.lineTo(-A.torso.waistW, -0.30);
  tunicBody.quadraticCurveTo(-0.66, 0.10, -A.torso.shoulderW, 0.65);
  tunicBody.quadraticCurveTo(-0.44, 0.85, -0.16, 0.90);
  tunicBody.closePath();
  addLayer(rig.torsoGroup, tunicBody, P.profPurpleCoat, 2.0);

  // Faixa/cinto de reforço na linha de transição da cintura com a calça (Layer 2.1)
  addLayer(rig.torsoGroup, S.roundedRect(1.22, 0.20, 0.02), P.profPurpleCoatDark, 2.1, { py: -1.25 });

  // Colete Argyle Mostarda
  const vestBase = new THREE.Shape();
  vestBase.moveTo(-0.25, 0.85); vestBase.lineTo(0.25, 0.85);
  vestBase.lineTo(0.28, -1.25); vestBase.lineTo(0, -1.35); vestBase.lineTo(-0.28, -1.25);
  vestBase.closePath();
  addLayer(rig.torsoGroup, vestBase, P.profVestYellow, 2.3);

  // Losangos Argyle
  const dW = 0.10, dH = 0.15;
  const diamonds = [
    { x: -0.11, y: 0.65, c: P.profVestBlue }, { x: 0.11, y: 0.65, c: P.profVestRed },
    { x: 0.00, y: 0.48, c: P.profVestGreen }, { x: -0.18, y: 0.48, c: P.profVestRed }, { x: 0.18, y: 0.48, c: P.profVestBlue },
    { x: -0.11, y: 0.30, c: P.profVestBlue }, { x: 0.11, y: 0.30, c: P.profVestRed },
    { x: 0.00, y: 0.12, c: P.profVestGreen },
    { x: -0.11, y: -0.06, c: P.profVestRed }, { x: 0.11, y: -0.06, c: P.profVestBlue },
    { x: 0.00, y: -0.24, c: P.profVestGreen }
  ];
  diamonds.forEach(d => addLayer(rig.torsoGroup, S.diamond(dW, dH), d.c, 2.4, { px: d.x, py: d.y }));

  // Botões de Ouro do Colete
  [0.55, 0.35, 0.15, -0.05, -0.25].forEach(by => {
    addLayer(rig.torsoGroup, S.ellipse(0.016, 0.016), P.profStarGold, 2.5, { py: by });
  });

  // Camisa branca e Colarinho pontiagudo
  const shirt = new THREE.Shape();
  shirt.moveTo(-0.16, 0.90); shirt.lineTo(0.16, 0.90);
  shirt.lineTo(0.10, 0.60); shirt.lineTo(0, 0.50); shirt.lineTo(-0.10, 0.60); shirt.closePath();
  addLayer(rig.torsoGroup, shirt, 0xffffff, 2.6);

  [-1, 1].forEach(side => {
    const colTip = new THREE.Shape();
    colTip.moveTo(side * 0.14, 0.90); colTip.lineTo(side * 0.03, 0.68); colTip.lineTo(side * 0.08, 0.90); colTip.closePath();
    addLayer(rig.torsoGroup, colTip, 0xffffff, 3.6);
  });

  // Gravata Borboleta Laranja com Poás Amarelos
  const bowL = new THREE.Shape();
  bowL.moveTo(0, 0.73); bowL.lineTo(-0.18, 0.82); bowL.lineTo(-0.15, 0.64); bowL.lineTo(0, 0.70); bowL.closePath();
  const bowR = new THREE.Shape();
  bowR.moveTo(0, 0.73); bowR.lineTo(0.18, 0.82); bowR.lineTo(0.15, 0.64); bowR.lineTo(0, 0.70); bowR.closePath();
  addLayer(rig.torsoGroup, bowL, P.profBowtieOrange, 3.1);
  addLayer(rig.torsoGroup, bowR, P.profBowtieOrange, 3.1);
  addLayer(rig.torsoGroup, S.ellipse(0.034, 0.030), P.profBowtieOrange, 3.2, { py: 0.72 });
  [-0.10, 0.10].forEach(px => addLayer(rig.torsoGroup, S.ellipse(0.012, 0.012), P.profBowtieYellow, 3.25, { px, py: 0.73 }));

  // Casaco de Veludo Roxo Aberto com Lapelas Peak Lapel
  [-1, 1].forEach(side => {
    const coatFront = new THREE.Shape();
    coatFront.moveTo(side * 0.18, 0.90);
    coatFront.lineTo(side * 0.44, 0.82);
    coatFront.lineTo(side * 0.46, -1.35);
    coatFront.lineTo(side * 0.24, -1.35);
    coatFront.lineTo(side * 0.16, 0.20);
    coatFront.closePath();
    addLayer(rig.torsoGroup, coatFront, P.profPurpleCoat, 3.3);

    const lapel = new THREE.Shape();
    lapel.moveTo(side * 0.16, 0.90);
    lapel.lineTo(side * 0.38, 0.65);
    lapel.lineTo(side * 0.24, 0.35);
    lapel.lineTo(side * 0.38, 0.22);
    lapel.lineTo(side * 0.16, -0.15);
    lapel.lineTo(side * 0.16, 0.60);
    lapel.closePath();
    addLayer(rig.torsoGroup, lapel, P.profPurpleCoatLight, 3.5);
  });

  // Estrela Dourada bordada no peito direito
  addLayer(rig.torsoGroup, S.star5(0.085, 0.038), P.profStarGold, 3.6, { px: -0.32, py: 0.38 });

  // --------------------------------------------------------------------------
  // 3. BRAÇOS E MÃOS ARTICULADAS (Deltoide curvo + Punhos com botões dourados)
  // Construídos em coordenadas locais com pivô no ombro (0, 0) para rotação anatômica
  // --------------------------------------------------------------------------
  [-1, 1].forEach(side => {
    const isLeft = side < 0;
    const group = isLeft ? rig.armLeftGroup : rig.armRightGroup;
    const xIn = isLeft ? 0.14 : -0.14;   // Lado interno (junto ao tronco)
    const xOut = isLeft ? -0.16 : 0.16;  // Lado externo (deltoide)
    const armLen = 1.75;                 // Comprimento do ombro ao punho (escala 6.5 cabeças)

    // Sombra interna da manga
    const armShadow = new THREE.Shape();
    armShadow.moveTo(xIn, 0.0);
    armShadow.quadraticCurveTo(0, 0.05, xOut * 0.4, -armLen);
    armShadow.lineTo(xIn * 0.9, -armLen);
    armShadow.closePath();
    addLayer(group, armShadow, P.profPurpleCoatDark, 1.7);

    // Manga de veludo roxo com deltoide curvado no ombro
    const sleeve = new THREE.Shape();
    sleeve.moveTo(xIn, 0.0);
    sleeve.quadraticCurveTo(0, 0.08, xOut, -0.04);
    sleeve.quadraticCurveTo(xOut * 1.15, -0.85, xOut * 0.95, -armLen);
    sleeve.lineTo(xIn * 0.95, -armLen);
    sleeve.quadraticCurveTo(xIn * 1.05, -0.85, xIn, 0.0);
    sleeve.closePath();
    addLayer(group, sleeve, P.profPurpleCoat, 1.8);

    // Punho escuro com acabamento e botões dourados
    addLayer(group, S.roundedRect(0.28, 0.10, 0.015), P.profPurpleCoatDark, 2.2, { py: -armLen });
    [-0.05, 0.05].forEach(bx => {
      addLayer(group, S.ellipse(0.014, 0.014), P.profStarGold, 2.3, { px: bx, py: -armLen });
    });

    // Mão anatômica (palma natural)
    const palmY = -armLen - 0.14;
    addLayer(group, S.ellipse(0.10, 0.12), P.skin, 2.4, { py: palmY });

    // Dedos estendidos / levemente fechados
    const fingerY = palmY - 0.12;
    addLayer(group, S.roundedRect(0.16, 0.10, 0.03), P.skinShadow, 2.38, { py: fingerY });

    // Polegar anatômico apontando para fora/cima
    const thumbSide = isLeft ? -1 : 1;
    const thumbShape = new THREE.Shape();
    thumbShape.moveTo(0, palmY + 0.03);
    thumbShape.lineTo(thumbSide * 0.14, palmY + 0.07);
    thumbShape.lineTo(thumbSide * 0.12, palmY - 0.02);
    thumbShape.lineTo(0, palmY - 0.04);
    thumbShape.closePath();
    addLayer(group, thumbShape, P.skin, 2.5);
  });

  // --------------------------------------------------------------------------
  // 4. CABEÇA, CABELO EINSTEIN, ÓCULOS REDONDOS & BIGODE ARQUEADO
  // --------------------------------------------------------------------------
  // Pescoço firme
  addLayer(rig.headGroup, S.roundedRect(A.neck.w, A.neck.h, 0.04), P.skin, A.neck.layer, { py: A.neck.y });

  // Cabeça Squircle Canônica
  const hy = A.head.y;
  const head = new THREE.Shape();
  head.moveTo(0, hy + 0.62);
  head.bezierCurveTo(0.47, hy + 0.62, 0.55, hy + 0.37, 0.52, hy - 0.02);
  head.bezierCurveTo(0.50, hy - 0.37, 0.37, hy - 0.60, 0, hy - 0.60);
  head.bezierCurveTo(-0.37, hy - 0.60, -0.50, hy - 0.37, -0.52, hy - 0.02);
  head.bezierCurveTo(-0.55, hy + 0.37, -0.47, hy + 0.62, 0, hy + 0.62);
  addLayer(rig.headGroup, head, P.skin, A.head.layer);

  // Cabelo estilo Einstein compacto e espetado
  const hairDark = new THREE.Shape();
  hairDark.moveTo(-0.45, hy + 0.10);
  hairDark.lineTo(-0.62, hy + 0.22); hairDark.lineTo(-0.50, hy + 0.32);
  hairDark.lineTo(-0.66, hy + 0.44); hairDark.lineTo(-0.48, hy + 0.52);
  hairDark.lineTo(-0.58, hy + 0.62);
  hairDark.lineTo(-0.35, hy + 0.65); hairDark.lineTo(-0.25, hy + 0.74);
  hairDark.lineTo(-0.10, hy + 0.68); hairDark.lineTo( 0.00, hy + 0.76);
  hairDark.lineTo( 0.10, hy + 0.68); hairDark.lineTo( 0.25, hy + 0.74);
  hairDark.lineTo( 0.35, hy + 0.65);
  hairDark.lineTo( 0.58, hy + 0.62); hairDark.lineTo( 0.48, hy + 0.52);
  hairDark.lineTo( 0.66, hy + 0.44); hairDark.lineTo( 0.50, hy + 0.32);
  hairDark.lineTo( 0.62, hy + 0.22); hairDark.lineTo( 0.45, hy + 0.10);
  hairDark.closePath();
  addLayer(rig.headGroup, hairDark, P.profHairDark, 2.15);

  const hairMid = new THREE.Shape();
  hairMid.moveTo(-0.40, hy + 0.15);
  hairMid.lineTo(-0.54, hy + 0.25); hairMid.lineTo(-0.42, hy + 0.35);
  hairMid.lineTo(-0.56, hy + 0.45); hairMid.lineTo(-0.38, hy + 0.54);
  hairMid.lineTo(-0.20, hy + 0.66); hairMid.lineTo( 0.00, hy + 0.68);
  hairMid.lineTo( 0.20, hy + 0.66); hairMid.lineTo( 0.38, hy + 0.54);
  hairMid.lineTo( 0.56, hy + 0.45); hairMid.lineTo( 0.42, hy + 0.35);
  hairMid.lineTo( 0.54, hy + 0.25); hairMid.lineTo( 0.40, hy + 0.15);
  hairMid.quadraticCurveTo(0.20, hy + 0.46, 0.00, hy + 0.42);
  hairMid.quadraticCurveTo(-0.20, hy + 0.46, -0.40, hy + 0.15);
  hairMid.closePath();
  addLayer(rig.headGroup, hairMid, P.profHairLight, 4.9);

  // Olhos e Pupilas expressivas
  [-1, 1].forEach(side => {
    addLayer(rig.eyesGroup, S.ellipse(0.046, 0.046), 0x181615, A.eyes.layer, { px: side * A.eyes.x, py: A.eyes.y });
    addLayer(rig.eyesGroup, S.ellipse(0.013, 0.013), 0xffffff, A.eyes.layer + 0.4, { px: side * A.eyes.x - 0.013, py: A.eyes.y + 0.013 });
  });

  // Nariz canônico
  addLayer(rig.headGroup, S.trapezoid(A.nose.topW, A.nose.botW, A.nose.h), P.skinDeep, A.nose.layer, { py: A.nose.y });

  // Óculos Redondos Pretos com lentes de reflexo
  [-1, 1].forEach(side => {
    const rimOuter = S.ellipse(0.13, 0.13);
    addLayer(rig.headGroup, rimOuter, P.profGlassesFrame, 6.2, { px: side * (A.eyes.x + 0.02), py: A.eyes.y });
    const lensInner = S.ellipse(0.105, 0.105);
    addLayer(rig.headGroup, lensInner, 0xffffff, 6.25, { px: side * (A.eyes.x + 0.02), py: A.eyes.y, opacity: 0.18 });
    addLayer(rig.headGroup, S.roundedRect(0.07, 0.018, 0.004), 0xffffff, 6.3, { px: side * (A.eyes.x + 0.02) + 0.03, py: A.eyes.y + 0.035, rotZ: 0.65 });
  });
  // Ponte nasal dos óculos
  addLayer(rig.headGroup, S.arcStroke(-0.08, A.eyes.y, 0, A.eyes.y + 0.035, 0.08, A.eyes.y, 0.024), P.profGlassesFrame, 6.3);

  // Bigode Arqueado Canônico (com respiro de 0.07 de pele sob o nariz)
  const archL = new THREE.Shape();
  archL.moveTo(0, A.mustache.y + 0.03);
  archL.quadraticCurveTo(-0.14, A.mustache.y + 0.06, -0.28, A.mustache.y + 0.00);
  archL.quadraticCurveTo(-0.32, A.mustache.y - 0.07, -0.22, A.mustache.y - 0.08);
  archL.quadraticCurveTo(-0.12, A.mustache.y - 0.03, 0, A.mustache.y);
  archL.closePath();
  const archR = new THREE.Shape();
  archR.moveTo(0, A.mustache.y + 0.03);
  archR.quadraticCurveTo(0.14, A.mustache.y + 0.06, 0.28, A.mustache.y + 0.00);
  archR.quadraticCurveTo(0.32, A.mustache.y - 0.07, 0.22, A.mustache.y - 0.08);
  archR.quadraticCurveTo(0.12, A.mustache.y - 0.03, 0, A.mustache.y);
  archR.closePath();
  addLayer(rig.mustacheGroup, archL, P.profMustacheBrown, 6.4);
  addLayer(rig.mustacheGroup, archR, P.profMustacheBrown, 6.4);
  addLayer(rig.mustacheGroup, S.ellipse(0.065, 0.040), P.profMustacheBrown, 6.45, { py: A.mustache.y + 0.015 });

  // Boca & Sorriso Acolhedor com Dentes Brancos
  const mouthY = A.mouth.y - 0.02;
  const mouthSmile = new THREE.Shape();
  mouthSmile.moveTo(-0.16, mouthY + 0.03);
  mouthSmile.quadraticCurveTo(0, mouthY - 0.09, 0.16, mouthY + 0.03);
  mouthSmile.quadraticCurveTo(0.12, mouthY + 0.005, 0, mouthY - 0.02);
  mouthSmile.quadraticCurveTo(-0.12, mouthY + 0.005, -0.16, mouthY + 0.03);
  mouthSmile.closePath();
  addLayer(rig.mouthGroup, mouthSmile, 0x581c1c, 6.2);

  const teeth = new THREE.Shape();
  teeth.moveTo(-0.12, mouthY + 0.025);
  teeth.lineTo(0.12, mouthY + 0.025);
  teeth.quadraticCurveTo(0.06, mouthY + 0.008, 0, mouthY + 0.008);
  teeth.quadraticCurveTo(-0.06, mouthY + 0.008, -0.12, mouthY + 0.025);
  teeth.closePath();
  addLayer(rig.mouthGroup, teeth, 0xffffff, 6.3);

  scene.add(rig.rootGroup);
  return rig;
}

export function createCanonicalProfessor(THREE, scene, options = {}) {
  return buildCanonicalHumanoid(THREE, scene, Object.assign({
    id: 'professor',
    outfit: { type: 'professor_eccentric' },
    features: { hair: 'wild_scientist', mustache: 'eccentric_arch', glasses: true, smile: true, wrinkles: true }
  }, options));
}
