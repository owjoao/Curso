/**
 * MÓDULO: HistoricalCharacterRig2D.js
 * Motor Canônico de Personagens Históricos no Estilo Ampulheta / Tratado de Versalhes.
 * Renderização vetorial determinística de alta fidelidade (compatível com Three.js / Canvas 2D / Remotion).
 * 
 * Baseado na Bíblia de Direção Artística (ART_DIRECTION_BIBLE.md) e na referência visual canônica:
 * - Traço em nanquim ameixa escuro (#241726 ou #1c1424)
 * - Cel-shading em camadas com sombras nítidas (hard-edge suave)
 * - Proporções anatômicas estilizadas (cabeça superelíptica, lapelas afiadas, colarinhos duros)
 * - Variações históricas: Diplomata, Barão da Sucata, Victor Lustig, André Poisson, Oficiais
 */

class HistoricalCharacterRig2D {
  constructor(config = {}) {
    this.config = Object.assign({
      id: "diplomat_master",
      name: "Delegado de Versalhes",
      skinTone: "#f8ceb0",
      skinShadow: "#e2b090",
      hairColor: "#222225",
      hairShadow: "#141416",
      hairStyle: "slicked_part", // 'slicked_part', 'white_bushy', 'bald_fringe', 'parted_center', 'fedora_hat'
      eyes: "neutral", // 'neutral', 'suspicious', 'shocked', 'winking'
      glasses: "round_black", // 'none', 'round_black', 'round_gold', 'monocle'
      mustache: "pencil", // 'none', 'pencil', 'handlebar', 'bushy_white', 'walrus'
      coatType: "diplomatic_tailcoat", // 'diplomatic_tailcoat', 'tuxedo_black', 'purple_frock', 'trench_fedora'
      coatColor: "#181a20",
      coatShadow: "#0f1014",
      tieType: "grey_ascot", // 'grey_ascot', 'black_bowtie', 'red_bowtie', 'diplomatic_tie'
      pose: "seated_neutral", // 'seated_neutral', 'seated_raising_paddle', 'persuasive_hands', 'shocked_head', 'seated_writing'
      eyebrows: "straight", // 'straight', 'raised', 'worried', 'curved'
      paddleText: "LANCE $70.000",
      hasChair: true,
      scale: 1.0
    }, config);

    this.time = 0;
  }

  update(dt) {
    this.time += dt;
  }

  draw(ctx, x, y, scale = 1.0) {
    const s = scale * this.config.scale;
    const cfg = this.config;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    // 1. Cadeira Vermelha de Veludo com Moldura Dourada (Se sentado)
    if (cfg.hasChair) {
      this.drawVelvetChair(ctx);
    }

    // 2. Tronco, Terno, Lapelas e Gravata
    this.drawTorso(ctx);

    // 3. Braços e Poses (Erguendo plaqueta, gesticulando ou apoiado)
    this.drawArms(ctx);

    // 4. Cabeça, Cabelo, Óculos e Expressão Facial
    this.drawHead(ctx);

    ctx.restore();
  }

  // Cadeira nobre estilo Luís XIV / Versalhes
  drawVelvetChair(ctx) {
    ctx.save();
    // Encosto estofado bordô
    ctx.fillStyle = '#8c1d28';
    ctx.beginPath();
    ctx.roundRect(-85, -280, 170, 240, [35, 35, 10, 10]);
    ctx.fill();

    // Moldura dourada entalhada
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Sombra interna do estofado
    ctx.fillStyle = '#5a1018';
    ctx.beginPath();
    ctx.roundRect(-70, -265, 140, 210, [25, 25, 6, 6]);
    ctx.fill();
    ctx.restore();
  }

  // Tronco, Paletó Diplomático com Lapelas Pontudas
  drawTorso(ctx) {
    const cfg = this.config;
    ctx.save();

    // Sombra projetada do paletó
    ctx.fillStyle = cfg.coatShadow;
    ctx.beginPath();
    ctx.moveTo(-110, -80);
    ctx.lineTo(110, -80);
    ctx.lineTo(135, 140);
    ctx.lineTo(-135, 140);
    ctx.fill();

    // Corpo principal do paletó (Cor Base)
    ctx.fillStyle = cfg.coatColor;
    ctx.beginPath();
    ctx.moveTo(-105, -80);
    ctx.lineTo(105, -80);
    ctx.lineTo(125, 140);
    ctx.lineTo(-125, 140);
    ctx.fill();

    // Contorno nanquim
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Colarinho Branco Rígido (Diplomático)
    ctx.fillStyle = '#f5f6fa';
    ctx.beginPath();
    ctx.moveTo(-45, -80);
    ctx.lineTo(45, -80);
    ctx.lineTo(25, -25);
    ctx.lineTo(0, -10);
    ctx.lineTo(-25, -25);
    ctx.fill();
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gravata / Ascot / Borboleta
    this.drawTie(ctx);

    // Lapelas Grandes Pontudas (Peak Lapels)
    this.drawLapels(ctx);

    ctx.restore();
  }

  drawTie(ctx) {
    const cfg = this.config;
    if (cfg.tieType === 'grey_ascot' || cfg.tieType === 'diplomatic_tie') {
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.moveTo(-10, -65);
      ctx.lineTo(10, -65);
      ctx.lineTo(16, 50);
      ctx.lineTo(0, 75);
      ctx.lineTo(-16, 50);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (cfg.tieType === 'black_bowtie' || cfg.tieType === 'red_bowtie') {
      ctx.fillStyle = (cfg.tieType === 'red_bowtie') ? '#b91c1c' : '#111115';
      ctx.beginPath();
      // Nó central
      ctx.arc(0, -60, 8, 0, Math.PI * 2);
      ctx.fill();
      // Asas
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(-24, -72); ctx.lineTo(-24, -48); ctx.lineTo(0, -60);
      ctx.lineTo(24, -72); ctx.lineTo(24, -48); ctx.lineTo(0, -60);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawLapels(ctx) {
    const cfg = this.config;
    ctx.fillStyle = cfg.coatShadow;

    // Lapela Esquerda
    ctx.beginPath();
    ctx.moveTo(-45, -80);
    ctx.lineTo(-85, -20);
    ctx.lineTo(-30, 60);
    ctx.lineTo(-15, 60);
    ctx.lineTo(-35, -40);
    ctx.fill();
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Lapela Direita
    ctx.beginPath();
    ctx.moveTo(45, -80);
    ctx.lineTo(85, -20);
    ctx.lineTo(30, 60);
    ctx.lineTo(15, 60);
    ctx.lineTo(35, -40);
    ctx.fill();
    ctx.stroke();
  }

  // Cabeça geométrica superelíptica com acabamento Versalhes
  drawHead(ctx) {
    const cfg = this.config;
    ctx.save();
    let headY = -140;

    // Pescoço
    ctx.fillStyle = cfg.skinShadow;
    ctx.fillRect(-22, headY + 30, 44, 40);
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 3;
    ctx.strokeRect(-22, headY + 30, 44, 40);

    // Orelhas geométricas
    ctx.fillStyle = cfg.skinTone;
    ctx.beginPath();
    ctx.arc(-54, headY, 14, 0, Math.PI * 2);
    ctx.arc(54, headY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Base do Rosto (Superelipse de feijão)
    ctx.fillStyle = cfg.skinTone;
    ctx.beginPath();
    ctx.roundRect(-50, headY - 60, 100, 115, [48, 48, 38, 38]);
    ctx.fill();

    // Sombra Cel-Shade 2D da mandíbula
    ctx.fillStyle = cfg.skinShadow;
    ctx.beginPath();
    ctx.moveTo(-48, headY + 20);
    ctx.quadraticCurveTo(0, headY + 55, 48, headY + 20);
    ctx.lineTo(48, headY + 45);
    ctx.quadraticCurveTo(0, headY + 60, -48, headY + 45);
    ctx.fill();

    // Contorno do Rosto
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-50, headY - 60, 100, 115, [48, 48, 38, 38]);
    ctx.stroke();

    // Cabelo Estilizado
    this.drawHair(ctx, headY);

    // Olhos Expressivos
    this.drawEyes(ctx, headY);

    // Óculos de Aro Fino Redondo (Estilo Tratado de Versalhes)
    if (cfg.glasses !== 'none') {
      this.drawGlasses(ctx, headY);
    }

    // Bigode Histórico
    this.drawMustache(ctx, headY);

    // Boca
    this.drawMouth(ctx, headY);

    ctx.restore();
  }

  drawHair(ctx, headY) {
    const cfg = this.config;
    ctx.save();
    ctx.fillStyle = cfg.hairColor;

    if (cfg.hairStyle === 'slicked_part') {
      // Cabelo penteado para trás com risca lateral
      ctx.beginPath();
      ctx.moveTo(-52, headY - 20);
      ctx.quadraticCurveTo(-54, headY - 78, 0, headY - 80);
      ctx.quadraticCurveTo(54, headY - 78, 52, headY - 20);
      ctx.lineTo(45, headY - 45);
      ctx.quadraticCurveTo(0, headY - 58, -45, headY - 45);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (cfg.hairStyle === 'white_bushy') {
      // Cabelos brancos laterais volumosos (diplomata sênior)
      ctx.beginPath();
      ctx.arc(-56, headY - 20, 22, 0, Math.PI * 2);
      ctx.arc(-54, headY - 45, 20, 0, Math.PI * 2);
      ctx.arc(56, headY - 20, 22, 0, Math.PI * 2);
      ctx.arc(54, headY - 45, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (cfg.hairStyle === 'fedora_hat') {
      // Chapéu Fedora 1920s elegante
      ctx.fillStyle = '#1c1f26';
      ctx.beginPath();
      ctx.ellipse(0, headY - 60, 78, 20, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-45, headY - 110, 90, 55);
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(-45, headY - 78, 90, 16);
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEyes(ctx, headY) {
    const cfg = this.config;
    ctx.save();
    const eyeY = headY - 12;
    const eyeSpacing = 22;

    // Sobrancelhas nítidas
    ctx.strokeStyle = cfg.hairColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (cfg.eyebrows === 'worried') {
      ctx.moveTo(-eyeSpacing - 14, eyeY - 16); ctx.lineTo(-eyeSpacing + 12, eyeY - 24);
      ctx.moveTo(eyeSpacing + 14, eyeY - 16); ctx.lineTo(eyeSpacing - 12, eyeY - 24);
    } else {
      ctx.moveTo(-eyeSpacing - 14, eyeY - 20); ctx.lineTo(-eyeSpacing + 12, eyeY - 20);
      ctx.moveTo(eyeSpacing - 12, eyeY - 20); ctx.lineTo(eyeSpacing + 14, eyeY - 20);
    }
    ctx.stroke();

    // Olhos Brancos Redondos com Pupila Negra
    for (let ex of [-eyeSpacing, eyeSpacing]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pupila
      ctx.fillStyle = '#111116';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Brilho de luz
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 1.5, eyeY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawGlasses(ctx, headY) {
    const cfg = this.config;
    ctx.save();
    const eyeY = headY - 12;
    const eyeSpacing = 22;
    const color = (cfg.glasses === 'round_gold') ? '#d4af37' : '#1c1424';

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    // Aro Esquerdo e Direito
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 15, 0, Math.PI * 2);
    ctx.arc(eyeSpacing, eyeY, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Ponte nasal entre os aros
    ctx.beginPath();
    ctx.arc(0, eyeY - 3, 8, Math.PI, 0);
    ctx.stroke();

    // Hastes
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 15, eyeY); ctx.lineTo(-50, eyeY - 4);
    ctx.moveTo(eyeSpacing + 15, eyeY); ctx.lineTo(50, eyeY - 4);
    ctx.stroke();
    ctx.restore();
  }

  drawMustache(ctx, headY) {
    const cfg = this.config;
    if (cfg.mustache === 'none') return;
    ctx.save();
    ctx.fillStyle = cfg.hairColor;
    const my = headY + 14;

    if (cfg.mustache === 'pencil') {
      // Bigode fino alinhado de diplomata
      ctx.beginPath();
      ctx.ellipse(-10, my, 12, 4, -0.15, 0, Math.PI * 2);
      ctx.ellipse(10, my, 12, 4, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.mustache === 'handlebar') {
      // Bigode clássico curvado para cima
      ctx.beginPath();
      ctx.moveTo(-28, my + 8);
      ctx.quadraticCurveTo(-14, my - 6, 0, my);
      ctx.quadraticCurveTo(14, my - 6, 28, my + 8);
      ctx.quadraticCurveTo(14, my + 2, 0, my + 4);
      ctx.quadraticCurveTo(-14, my + 2, -28, my + 8);
      ctx.fill();
      ctx.strokeStyle = '#1c1424';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMouth(ctx, headY) {
    const cfg = this.config;
    ctx.save();
    const my = headY + 28;
    ctx.strokeStyle = '#1c1424';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (cfg.eyes === 'shocked') {
      ctx.fillStyle = '#6b1111';
      ctx.arc(0, my, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.moveTo(-10, my);
      ctx.lineTo(10, my);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArms(ctx) {
    const cfg = this.config;
    ctx.save();

    if (cfg.pose === 'seated_raising_paddle') {
      // Braço direito levantando a placa de lance ($70.000)
      ctx.save();
      ctx.strokeStyle = cfg.coatColor;
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(90, -40);
      ctx.lineTo(150, -140);
      ctx.stroke();

      // Punho de camisa branca
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(135, -165, 30, 20);

      // Mão segurando cabo
      ctx.fillStyle = cfg.skinTone;
      ctx.beginPath();
      ctx.arc(150, -170, 16, 0, Math.PI * 2);
      ctx.fill();

      // Plaqueta de leilão de madeira nobre
      ctx.save();
      ctx.translate(150, -220);
      // Cabo
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(-6, 20, 12, 60);
      // Disco de madeira
      ctx.fillStyle = '#f5f6fa';
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Texto do Lance
      ctx.fillStyle = '#c0392b';
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LANCE', 0, -10);
      ctx.font = '900 18px sans-serif';
      ctx.fillText('$70.000', 0, 14);
      ctx.restore();

      ctx.restore();
    } else if (cfg.pose === 'persuasive_hands') {
      // Braços abertos em persuasão (Lustig)
      let wave = Math.sin(this.time * 3) * 8;
      ctx.strokeStyle = cfg.coatColor;
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-90, -40); ctx.lineTo(-160, 20 + wave);
      ctx.moveTo(90, -40); ctx.lineTo(160, 20 - wave);
      ctx.stroke();

      // Mãos abertas
      ctx.fillStyle = cfg.skinTone;
      ctx.beginPath();
      ctx.arc(-170, 30 + wave, 16, 0, Math.PI * 2);
      ctx.arc(170, 30 - wave, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HistoricalCharacterRig2D };
}
