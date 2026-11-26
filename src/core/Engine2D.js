/**
 * Engine2D.js — Estúdio Autônomo 2D (Ampulheta + claude-animated-shorts)
 * Canal: O Porquê das Coisas
 *
 * Contém:
 * - Helpers matemáticos e de timeline determinística (smootherstep, lerp, clamp)
 * - CameraController2D (resolução virtual 1280x720, parallax multiplane, push-in contínuo)
 * - SceneryAndLighting2D (cenário vetorial flat bicolor, feixe branco, prisma, arco-íris 7 cores, infográficos)
 * - ProfessorRig2D (rigging FK 100% aderente às travas ERR-001..ERR-005 de lessons_learned.json)
 */
(function (root) {
  'use strict';

  const VIRTUAL_WIDTH = 1280;
  const VIRTUAL_HEIGHT = 720;
  const GROUND_Y = 605; // 84% de 720px (ERR-004)

  const SPECTRUM_BANDS = [
    { name: 'Vermelho', nm: 700, color: '#ef4444', angleOffset: -0.22 },
    { name: 'Laranja', nm: 620, color: '#f97316', angleOffset: -0.15 },
    { name: 'Amarelo', nm: 580, color: '#facc15', angleOffset: -0.08 },
    { name: 'Verde', nm: 530, color: '#22c55e', angleOffset: 0.0 },
    { name: 'Ciano', nm: 490, color: '#06b6d4', angleOffset: 0.08 },
    { name: 'Azul', nm: 450, color: '#3b82f6', angleOffset: 0.16 },
    { name: 'Violeta', nm: 400, color: '#8b5cf6', angleOffset: 0.25 }
  ];

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smootherstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * x * (x * (x * 6 - 15) + 10);
  }

  function easeOutCubic(t) {
    const x = clamp(t, 0, 1);
    return 1 - Math.pow(1 - x, 3);
  }

  function segmentProgress(time, start, end) {
    if (end <= start) return time >= end ? 1 : 0;
    return clamp((time - start) / (end - start), 0, 1);
  }

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function hashFloat(seed) {
    const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }

  /**
   * CameraController2D — Câmera 2D com parallax em camadas e interpolação smootherstep.
   */
  class CameraController2D {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.zoom = 1.0;
      this.driftX = 0;
      this.driftY = 0;
      this.driftZoom = 0;
    }

    reset() {
      this.x = 0;
      this.y = 0;
      this.zoom = 1.0;
      this.driftX = 0;
      this.driftY = 0;
      this.driftZoom = 0;
    }

    /**
     * Avalia uma lista de keyframes [{ t, x, y, zoom }] de forma determinística.
     */
    evaluateTrack(time, keyframes) {
      if (!keyframes || keyframes.length === 0) return;

      let prev = keyframes[0];
      let next = keyframes[keyframes.length - 1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (time >= keyframes[i].t && time <= keyframes[i + 1].t) {
          prev = keyframes[i];
          next = keyframes[i + 1];
          break;
        }
      }

      if (time <= keyframes[0].t) {
        prev = next = keyframes[0];
      } else if (time >= keyframes[keyframes.length - 1].t) {
        prev = next = keyframes[keyframes.length - 1];
      }

      const span = next.t - prev.t;
      const alpha = span > 0 ? smootherstep((time - prev.t) / span) : 0;

      // Micro-respiração documental contínua (evita planos mortos)
      this.driftX = Math.sin(time * 0.55) * 3.0;
      this.driftY = Math.cos(time * 0.42) * 1.5;
      this.driftZoom = Math.sin(time * 0.35) * 0.008;

      this.x = clamp(lerp(prev.x, next.x, alpha) + this.driftX, -380, 420);
      this.y = clamp(lerp(prev.y, next.y, alpha) + this.driftY, -220, 180);
      this.zoom = clamp(lerp(prev.zoom, next.zoom, alpha) + this.driftZoom, 0.95, 2.05);
    }

    /**
     * Aplica transformação de câmera ponderada pelo fator parallax da camada.
     */
    applyLayerTransform(ctx, parallax = 1.0) {
      const layerZoom = lerp(1.0, this.zoom, 0.35 + 0.65 * parallax);
      const cx = VIRTUAL_WIDTH * 0.5;
      const cy = VIRTUAL_HEIGHT * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(layerZoom, layerZoom);
      ctx.translate(-cx - this.x * parallax, -cy - this.y * parallax);
    }

    withLayer(ctx, parallax, drawFn) {
      ctx.save();
      this.applyLayerTransform(ctx, parallax);
      drawFn(ctx);
      ctx.restore();
    }
  }

  /**
   * SceneryAndLighting2D — Cenário estilo Ampulheta, iluminação óptica e infográficos.
   */
  class SceneryAndLighting2D {
    drawBackdrop(ctx, state) {
      const dark = clamp(state.roomDarkness || 0, 0, 1);

      // Céu / Parede profunda em camadas (cobre margem extra para macro zoom/pan seguro)
      const bgGrad = ctx.createLinearGradient(0, -350, 0, GROUND_Y + 40);
      bgGrad.addColorStop(0, dark > 0.5 ? '#070b17' : '#0f172a');
      bgGrad.addColorStop(0.55, dark > 0.5 ? '#11182c' : '#1e293b');
      bgGrad.addColorStop(1, dark > 0.5 ? '#1b2038' : '#2f3554');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-800, -450, VIRTUAL_WIDTH + 1600, GROUND_Y + 550);

      // Painéis arquitetônicos sutis ao fundo (estilo documental)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * (1 - dark * 0.6)})`;
      for (let x = -120; x < VIRTUAL_WIDTH + 180; x += 220) {
        ctx.fillRect(x, 40, 170, GROUND_Y - 70);
      }

      // Janela alta à esquerda por onde entra o feixe solar branco
      this.drawWindow(ctx, 110, 62, 170, 260, dark);

      // Globo / quadros distantes discretos
      ctx.save();
      ctx.globalAlpha = 0.22 * (1 - dark * 0.5);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(1090, 130, 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(1090, 130, 54, 18, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawWindow(ctx, x, y, w, h, dark) {
      // Moldura externa bicolor
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x - 10, y - 10, w + 20, h + 20, [90, 90, 6, 6]);
      ctx.fill();

      // Vidro com luz solar
      const sunAlpha = lerp(0.92, 0.72, dark);
      const skyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      skyGrad.addColorStop(0, `rgba(254, 249, 195, ${sunAlpha})`);
      skyGrad.addColorStop(0.6, `rgba(186, 230, 253, ${sunAlpha * 0.88})`);
      skyGrad.addColorStop(1, `rgba(125, 211, 252, ${sunAlpha * 0.75})`);
      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, [82, 82, 4, 4]);
      ctx.fill();

      // Travessas da janela
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + w * 0.5 - 4, y, 8, h);
      ctx.fillRect(x, y + h * 0.48, w, 8);
    }

    drawMidground(ctx, state, time) {
      const dark = clamp(state.roomDarkness || 0, 0, 1);

      // Estante científica à esquerda (bicolor flat)
      this.drawBookshelf(ctx, 74, 275, 175, GROUND_Y - 275, dark);

      // Quadro-negro central/direito para infográficos (folga acima do prisma)
      this.drawChalkboard(ctx, 470, 74, 495, 250, state, time);
    }

    drawBookshelf(ctx, x, y, w, h, dark) {
      ctx.save();
      ctx.fillStyle = dark > 0.5 ? '#261810' : '#3e271a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = dark > 0.5 ? '#1b110b' : '#2b1a10';
      ctx.fillRect(x + w * 0.52, y, w * 0.48, h);

      // Prateleiras e livros vetoriais planos
      const shelfYs = [y + 82, y + 168, y + 252];
      const bookColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#eab308'];

      shelfYs.forEach((sy, sIdx) => {
        ctx.fillStyle = '#1a0f09';
        ctx.fillRect(x + 10, sy, w - 20, 10);

        let bx = x + 16;
        for (let i = 0; i < 6; i++) {
          const bw = 16 + ((i + sIdx) % 3) * 5;
          const bh = 44 + ((i * 7 + sIdx * 3) % 22);
          ctx.fillStyle = bookColors[(i + sIdx * 2) % bookColors.length];
          ctx.fillRect(bx, sy - bh, bw, bh);
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(bx + bw * 0.55, sy - bh, bw * 0.45, bh);
          bx += bw + 4;
        }
      });
      ctx.restore();
    }

    drawChalkboard(ctx, x, y, w, h, state, time) {
      ctx.save();
      // Moldura madeira bicolor
      ctx.fillStyle = '#5c3820';
      ctx.beginPath();
      ctx.roundRect(x - 10, y - 10, w + 20, h + 20, 8);
      ctx.fill();

      // Superfície verde-ardósia escura
      ctx.fillStyle = '#132a27';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      ctx.fillRect(x + w * 0.55, y, w * 0.45, h);

      // Grade sutil
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let gx = x + 40; gx < x + w; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
        ctx.stroke();
      }
      for (let gy = y + 40; gy < y + h; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
      }

      // Conteúdo dinâmico do quadro conforme capítulo/estado
      const boardMode = state.boardMode || 'title';
      const boardAlpha = clamp(state.boardAlpha !== undefined ? state.boardAlpha : 1, 0, 1);
      ctx.globalAlpha = boardAlpha;

      if (boardMode === 'title') {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('POR QUE UM CRISTAL', x + w * 0.5, y + 88);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('CRIA UM ARCO-ÍRIS?', x + w * 0.5, y + 132);

        // Mini barra espectral decorativa
        const barW = 280;
        const stepW = barW / SPECTRUM_BANDS.length;
        SPECTRUM_BANDS.forEach((b, idx) => {
          ctx.fillStyle = b.color;
          ctx.fillRect(x + w * 0.5 - barW * 0.5 + idx * stepW, y + 168, stepW + 1, 10);
        });
      } else if (boardMode === 'waves') {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LUZ BRANCA = SOMA DE ONDAS', x + 28, y + 44);

        // Desenha onda longa (700nm vermelho) vs onda curta (400nm violeta)
        const rows = [
          { label: '700 nm (Vermelho) — Onda Longa', color: '#ef4444', freq: 0.045, y0: y + 96 },
          { label: '530 nm (Verde) — Média', color: '#22c55e', freq: 0.075, y0: y + 152 },
          { label: '400 nm (Violeta) — Onda Curta', color: '#a78bfa', freq: 0.115, y0: y + 208 }
        ];
        rows.forEach((r) => {
          ctx.fillStyle = r.color;
          ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillText(r.label, x + 28, r.y0 - 22);
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          for (let px = 0; px <= w - 60; px += 4) {
            const py = r.y0 + Math.sin(px * r.freq - time * 5.2) * 12;
            if (px === 0) ctx.moveTo(x + 28 + px, py);
            else ctx.lineTo(x + 28 + px, py);
          }
          ctx.stroke();
        });
      } else if (boardMode === 'refraction') {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ÍNDICE DE REFRAÇÃO DO CRISTAL', x + 28, y + 44);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('Ar (n = 1.00)  →  Vidro (n ≈ 1.52)', x + 28, y + 82);

        // Esquema didático da normal e desvio
        const cx = x + 245;
        const cy = y + 162;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(cx, cy - 52, 190, 104);
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - 140, cy);
        ctx.lineTo(cx + 210, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Raio incidente
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 125, cy - 55);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Raios refratados (vermelho menos desviado, violeta mais desviado)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 185, cy + 28);
        ctx.stroke();

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 185, cy + 56);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('Mais rápida no ar', cx - 155, cy - 64);
        ctx.fillText('Mais lenta e dobrada no cristal', cx + 12, cy + 80);
      } else if (boardMode === 'raindrop') {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('NA NATUREZA: GOTAS DE CHUVA', x + 28, y + 44);

        const dropX = x + 250;
        const dropY = y + 144;
        const dropR = 56;

        // Gota esférica bicolor flat
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Raio do Sol entrando, refletindo no fundo da gota e saindo em cores
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 48, dropY - 26);
        ctx.lineTo(dropX - 58, dropY - 26);
        ctx.lineTo(dropX + 60, dropY - 8);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(dropX + 54, dropY - 8);
        ctx.lineTo(dropX - 38, dropY + 40);
        ctx.lineTo(x + 65, dropY + 64);
        ctx.stroke();

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(dropX + 54, dropY - 8);
        ctx.lineTo(dropX - 42, dropY + 28);
        ctx.lineTo(x + 65, dropY + 46);
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('Milhões de gotas = milhões de mini prismas!', x + 28, y + 230);
      }

      ctx.restore();
    }

    drawForegroundFloorAndWorkbench(ctx, state) {
      // Chão ancorado exatamente em GROUND_Y = 605 (ERR-004)
      ctx.fillStyle = '#3c2415';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, VIRTUAL_HEIGHT - GROUND_Y + 480);

      // Linha de rodapé / horizonte do piso
      ctx.fillStyle = '#25150c';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, 8);

      // Tábuas sutis de madeira
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let px = -640; px < VIRTUAL_WIDTH + 640; px += 160) {
        ctx.fillRect(px, GROUND_Y + 8, 3, VIRTUAL_HEIGHT - GROUND_Y + 440);
      }

      // Bancada de experimento no chão (y = 605) à direita do professor
      const benchX = 760;
      const benchW = 240;
      const benchH = 148;
      const benchTopY = GROUND_Y - benchH;

      // Sombra de contato da bancada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(benchX + benchW * 0.5, GROUND_Y + 4, benchW * 0.54, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pernas da bancada
      ctx.fillStyle = '#4a2c1a';
      ctx.fillRect(benchX + 18, benchTopY + 18, 22, benchH - 18);
      ctx.fillStyle = '#361f12';
      ctx.fillRect(benchX + benchW - 40, benchTopY + 18, 22, benchH - 18);

      // Corpo e tampo bicolor
      ctx.fillStyle = '#633c24';
      ctx.fillRect(benchX, benchTopY, benchW * 0.5, 22);
      ctx.fillStyle = '#4e2e1a';
      ctx.fillRect(benchX + benchW * 0.5, benchTopY, benchW * 0.5, 22);

      // Pedestal e Prisma de Cristal
      const prismCx = benchX + 95;
      const prismBaseY = benchTopY;
      ctx.fillStyle = '#475569';
      ctx.fillRect(prismCx - 22, prismBaseY - 12, 44, 12);
      ctx.fillStyle = '#334155';
      ctx.fillRect(prismCx, prismBaseY - 12, 22, 12);

      this.drawCrystalPrism(ctx, prismCx, prismBaseY - 12, state.crystalGlow || 0);

      // Lanterna / Fonte Óptica em tripé apoiada no chão (GROUND_Y = 605)
      this.drawOpticalLampStand(ctx, 525, GROUND_Y, state.whiteBeamProgress || 0);

      // Anteparo branco à direita para projetar o arco-íris
      this.drawProjectionScreen(ctx, 1105, GROUND_Y);
    }

    drawOpticalLampStand(ctx, cx, groundY, beamProg) {
      // Sombra de contato
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 3, 38, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tripé bicolor apoiado exatamente no chão
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, groundY - 210);
      ctx.lineTo(cx - 26, groundY);
      ctx.moveTo(cx, groundY - 210);
      ctx.lineTo(cx + 26, groundY);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, groundY - 235);
      ctx.lineTo(cx, groundY - 2);
      ctx.stroke();

      // Corpo da lanterna óptica apontada para o prisma (angle ~ +7.2°)
      ctx.save();
      ctx.translate(cx, groundY - 242);
      ctx.rotate(0.125);

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(-24, 0, 48, 14);

      // Anel dourado da lente colimadora
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(18, -12, 10, 24, 3);
      ctx.fill();

      // Lente emissora acesa quando feixe ativo
      ctx.fillStyle = beamProg > 0.02 ? '#fef9c3' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(27, 0, 8, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.restore();
    }

    drawCrystalPrism(ctx, cx, baseY, glow = 0) {
      const h = 92;
      const halfW = 54;
      const topX = cx;
      const topY = baseY - h;
      const leftX = cx - halfW;
      const rightX = cx + halfW;

      ctx.save();
      if (glow > 0.02) {
        ctx.fillStyle = `rgba(186, 230, 253, ${0.22 * glow})`;
        ctx.beginPath();
        ctx.arc(cx, baseY - h * 0.45, 76, 0, Math.PI * 2);
        ctx.fill();
      }

      // Face esquerda iluminada do prisma
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(leftX, baseY);
      ctx.lineTo(cx, baseY);
      ctx.closePath();
      ctx.fill();

      // Face direita sombreada (bicolor 2.5D)
      ctx.fillStyle = 'rgba(125, 211, 252, 0.72)';
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(cx, baseY);
      ctx.lineTo(rightX, baseY);
      ctx.closePath();
      ctx.fill();

      // Contorno nítido de cristal
      ctx.strokeStyle = '#f0f9ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(rightX, baseY);
      ctx.lineTo(leftX, baseY);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    drawProjectionScreen(ctx, screenX, groundY) {
      // Haste metálica apoiada em groundY
      ctx.fillStyle = '#334155';
      ctx.fillRect(screenX + 18, groundY - 300, 12, 300);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(screenX - 4, groundY - 12, 56, 12, 4);
      ctx.fill();

      // Painel de projeção branco inclinado (face esquerda recebe o espectro)
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(screenX, groundY - 320, 22, 230, 4);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(screenX + 12, groundY - 320, 10, 230);
    }

    /**
     * Desenha feixe de luz branca, dispersão no cristal, arco-íris 7 cores e poeira brilhante.
     */
    drawOpticalVFX(ctx, state, time) {
      const whiteProg = clamp(state.whiteBeamProgress || 0, 0, 1);
      const specProg = clamp(state.spectrumProgress || 0, 0, 1);

      const srcX = 552;
      const srcY = 367;
      const hitX = 829; // face esquerda do prisma (prismCx = 855)
      const hitY = 403;
      const exitBaseX = 877; // face direita do prisma
      const exitBaseY = 412;
      const screenX = 1105;

      // 1. Feixe de luz branca entrando pela janela
      if (whiteProg > 0.01) {
        const endX = lerp(srcX, hitX, whiteProg);
        const endY = lerp(srcY, hitY, whiteProg);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.moveTo(srcX, srcY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(srcX, srcY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Partículas determinísticas iluminadas ao longo do feixe
        for (let i = 0; i < 18; i++) {
          const u = ((i / 18) + time * 0.04) % 1;
          if (u > whiteProg) continue;
          const jitter = (hashFloat(i + 1) - 0.5) * 26;
          const px = lerp(srcX, hitX, u) + Math.sin(time * 2.1 + i) * 5;
          const py = lerp(srcY, hitY, u) + jitter + Math.cos(time * 1.7 + i) * 4;
          const alpha = 0.35 + 0.5 * Math.sin(time * 4 + i * 1.3);
          ctx.fillStyle = `rgba(255, 255, 255, ${clamp(alpha, 0.1, 0.85)})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.0 + (i % 2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Dispersão interna e 7 faixas do arco-íris até o anteparo
      if (specProg > 0.01) {
        ctx.save();
        SPECTRUM_BANDS.forEach((band, idx) => {
          const exitY = exitBaseY - 12 + idx * 5.5;
          const targetY = 315 + idx * 24;
          const curX = lerp(exitBaseX, screenX, specProg);
          const curY = lerp(exitY, targetY, specProg);

          // Cone interno do ponto de entrada até a face de saída do cristal
          ctx.strokeStyle = band.color;
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(hitX, hitY);
          ctx.lineTo(exitBaseX, exitY);
          ctx.stroke();

          // Feixe colorido externo até o anteparo
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(exitBaseX, exitY);
          ctx.lineTo(curX, curY);
          ctx.stroke();

          // Destaque ondulatório opcional quando explicando comprimentos de onda
          if (state.showBeamWaves) {
            ctx.globalAlpha = 0.95;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            const len = Math.hypot(curX - exitBaseX, curY - exitY);
            const ang = Math.atan2(curY - exitY, curX - exitBaseX);
            ctx.save();
            ctx.translate(exitBaseX, exitY);
            ctx.rotate(ang);
            ctx.beginPath();
            const freq = 0.06 + idx * 0.022;
            for (let d = 0; d <= len; d += 6) {
              const wy = Math.sin(d * freq - time * 9) * 3.2;
              if (d === 0) ctx.moveTo(d, wy);
              else ctx.lineTo(d, wy);
            }
            ctx.stroke();
            ctx.restore();
          }

          // Mancha brilhante no anteparo quando o feixe chega
          if (specProg > 0.94) {
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = band.color;
            ctx.fillRect(screenX - 4, targetY - 11, 8, 22);
          }
        });

        // Rótulos limpos das extremidades com tarja legível (700nm Vermelho e 400nm Violeta)
        if (specProg > 0.7 && state.showSpectrumLabels) {
          const lblAlpha = clamp((specProg - 0.7) / 0.3, 0, 1);
          ctx.globalAlpha = lblAlpha;
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'right';

          const tags = [
            { text: '700 nm (desvia menos)', y: 294, color: '#fca5a5' },
            { text: '400 nm (desvia mais)', y: 484, color: '#c4b5fd' }
          ];
          tags.forEach((tg) => {
            const tw = ctx.measureText(tg.text).width;
            ctx.fillStyle = 'rgba(7, 11, 20, 0.84)';
            ctx.beginPath();
            ctx.roundRect(screenX - 16 - tw - 14, tg.y - 12, tw + 16, 20, 6);
            ctx.fill();
            ctx.fillStyle = tg.color;
            ctx.fillText(tg.text, screenX - 23, tg.y + 3);
          });
        }
        ctx.restore();
      }
    }

    drawIdeaBulb(ctx, x, y, alpha, time) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y + Math.sin(time * 4) * 3);

      // Aura luminosa
      ctx.fillStyle = 'rgba(250, 204, 21, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();

      // Raios curtos ao redor
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI + (i * Math.PI) / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
        ctx.lineTo(Math.cos(a) * 35, Math.sin(a) * 35);
        ctx.stroke();
      }

      // Bulbo bicolor flat
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Base metálica
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(-8, 17, 16, 10, 3);
      ctx.fill();
      ctx.restore();
    }

    drawVignetteAndFades(ctx, time, duration) {
      // Vinheta documental discreta
      const vig = ctx.createRadialGradient(
        VIRTUAL_WIDTH * 0.5,
        VIRTUAL_HEIGHT * 0.45,
        VIRTUAL_WIDTH * 0.28,
        VIRTUAL_WIDTH * 0.5,
        VIRTUAL_HEIGHT * 0.5,
        VIRTUAL_WIDTH * 0.72
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(5, 8, 18, 0.42)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // Fade-in de abertura e fade-out final suaves
      let fadeAlpha = 0;
      if (time < 0.7) {
        fadeAlpha = 1 - smootherstep(time / 0.7);
      } else if (time > duration - 0.9) {
        fadeAlpha = smootherstep((time - (duration - 0.9)) / 0.9);
      }
      if (fadeAlpha > 0.005) {
        ctx.fillStyle = `rgba(6, 9, 19, ${fadeAlpha})`;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      }
    }

    /* =========================================================================
       CENÁRIO 2: ESTÚDIO SOLAR / ONDAS DA LUZ BRANCA ('solar_waves')
       ========================================================================= */
    drawSolarBackdrop(ctx, state, time) {
      const grad = ctx.createLinearGradient(0, -350, 0, GROUND_Y + 40);
      grad.addColorStop(0, '#040814');
      grad.addColorStop(0.6, '#0c1630');
      grad.addColorStop(1, '#19294d');
      ctx.fillStyle = grad;
      ctx.fillRect(-800, -450, VIRTUAL_WIDTH + 1600, GROUND_Y + 550);

      // Estrelas e anéis astronômicos sutis
      for (let i = 0; i < 42; i++) {
        const sx = -100 + hashFloat(i * 3 + 1) * 1480;
        const sy = -40 + hashFloat(i * 3 + 2) * 520;
        const tw = 0.3 + 0.5 * Math.sin(time * 2.2 + i);
        ctx.fillStyle = `rgba(226, 232, 240, ${clamp(tw, 0.12, 0.85)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.3 + (i % 2) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sol dourado estilo flat bicolor no lado esquerdo-superior
      const sunX = 240;
      const sunY = 185;
      ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 130 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.24)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 88, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 58, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
    }

    drawSolarMidground(ctx, state, time) {
      const sunX = 240;
      const sunY = 185;
      const splitX = 505;
      const splitY = 235;
      const waveProg = clamp(state.solarWaveReveal !== undefined ? state.solarWaveReveal : 1, 0, 1);

      // Feixe solar branco indo até o anel divisor
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(sunX + 46, sunY + 10);
      ctx.lineTo(splitX, splitY);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(sunX + 46, sunY + 10);
      ctx.lineTo(splitX, splitY);
      ctx.stroke();

      // Anel óptico divisor minimalista
      ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(splitX, splitY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Card translúcido por trás das ondas para leitura cristalina no zoom
      const endX = 1180;
      ctx.fillStyle = 'rgba(8, 15, 32, 0.72)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(545, 76, 650, 340, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 21px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('A LUZ BRANCA CONTÉM TODAS AS ONDAS:', 575, 114);

      // Desenha as 7 ondas espectrais oscilando em tamanho real
      const drawStartX = 580;
      const drawMaxX = lerp(drawStartX, endX - 25, waveProg);
      SPECTRUM_BANDS.forEach((band, idx) => {
        const yCenter = 152 + idx * 36;
        const amp = 9.5;
        const freq = 0.036 + idx * 0.014;

        // Guia fina conectando do anel divisor até o início da onda
        ctx.strokeStyle = band.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX + 18, splitY);
        ctx.lineTo(drawStartX, yCenter);
        ctx.stroke();

        // Onda senoidal brilhante
        ctx.globalAlpha = 0.96;
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        for (let px = drawStartX; px <= drawMaxX; px += 4) {
          const py = yCenter + Math.sin((px - drawStartX) * freq - time * 7.0) * amp;
          if (px === drawStartX) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Rótulo lateral nos extremos e centro
        if (waveProg > 0.65 && (idx === 0 || idx === 3 || idx === 6)) {
          ctx.fillStyle = band.color;
          ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${band.name} (${band.nm} nm)`, 1172, yCenter - 12);
        }
      });

      ctx.restore();
    }

    drawSolarForeground(ctx) {
      // Plataforma de observação ancorada em GROUND_Y = 605 (ERR-004)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, VIRTUAL_HEIGHT - GROUND_Y + 480);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, 8);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      for (let px = -640; px < VIRTUAL_WIDTH + 640; px += 180) {
        ctx.fillRect(px, GROUND_Y + 8, 3, VIRTUAL_HEIGHT - GROUND_Y + 440);
      }
    }

    /* =========================================================================
       CENÁRIO 3: AMBIENTE ABERTO PÓS-CHUVA COM ARCO-ÍRIS ('outdoor_rainbow')
       ========================================================================= */
    drawOutdoorBackdrop(ctx, state, time) {
      // Céu pós-chuva luminoso
      const sky = ctx.createLinearGradient(0, -350, 0, GROUND_Y + 20);
      sky.addColorStop(0, '#1d4ed8');
      sky.addColorStop(0.55, '#38bdf8');
      sky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = sky;
      ctx.fillRect(-800, -450, VIRTUAL_WIDTH + 1600, GROUND_Y + 550);

      // Sol dourado abrindo entre as nuvens no canto superior esquerdo
      const sunX = 185;
      const sunY = 135;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 108 + Math.sin(time * 2.2) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 52, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();

      // Arco-íris gigante de 7 faixas cruzando todo o céu sobre o vale
      const rbProg = clamp(state.outdoorRainbowReveal !== undefined ? state.outdoorRainbowReveal : 1, 0, 1);
      const cx = 755;
      const cy = 620;
      const outerR = 525;
      const bandW = 16;

      ctx.save();
      SPECTRUM_BANDS.forEach((band, idx) => {
        const r = outerR - idx * bandW;
        const startAngle = Math.PI * 1.02;
        const endAngle = lerp(startAngle, Math.PI * 1.98, rbProg);
        ctx.strokeStyle = band.color;
        ctx.globalAlpha = 0.78;
        ctx.lineWidth = bandW + 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.stroke();
      });
      ctx.restore();
    }

    drawOutdoorMidground(ctx, state, time) {
      // Nuvens flat bicolores se dissipando após a chuva
      const drawCloud = (cx, cy, sc) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.roundRect(-75, -10, 150, 32, 16);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-36, -12, 28, 0, Math.PI * 2);
        ctx.arc(0, -24, 36, 0, Math.PI * 2);
        ctx.arc(38, -10, 26, 0, Math.PI * 2);
        ctx.roundRect(-72, -14, 144, 28, 14);
        ctx.fill();
        ctx.restore();
      };
      const drift = Math.sin(time * 0.3) * 14;
      drawCloud(255 - drift, 128, 0.92);
      drawCloud(1055 + drift, 118, 1.05);

      // Cadeia de montanhas e colinas facetadas bicolor (Ampulheta 2.5D)
      const peaks = [
        [80, GROUND_Y, 320, 415, 560, GROUND_Y],
        [440, GROUND_Y, 720, 380, 990, GROUND_Y],
        [860, GROUND_Y, 1120, 400, 1440, GROUND_Y]
      ];
      peaks.forEach(([x1, y1, px, py, x2, y2]) => {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(px, py);
        ctx.lineTo(px, y1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x2, y2);
        ctx.lineTo(px, y1);
        ctx.closePath();
        ctx.fill();
      });

      // Colinas frontais suaves
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(260, GROUND_Y + 10, 440, 88, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(980, GROUND_Y + 12, 520, 96, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Gotículas leves brilhando no ar pós-chuva
      ctx.save();
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 24; i++) {
        const rx = 120 + hashFloat(i * 5 + 1) * 1040;
        const ry = ((hashFloat(i * 5 + 2) * 480 + time * 140) % 480) + 60;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
        ctx.stroke();
      }
      ctx.restore();

      // Lupa Óptica no céu explicando uma gota d'água agindo como prisma
      const dropAlpha = clamp(state.raindropLoupeAlpha !== undefined ? state.raindropLoupeAlpha : 1, 0, 1);
      if (dropAlpha > 0.02) {
        const lx = 835;
        const ly = 248;
        const lr = 70;
        ctx.save();
        ctx.globalAlpha = dropAlpha;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lx, ly, lr + 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gota esférica interna
        ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lx, ly, lr * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Raio branco entrando e saindo refratado
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(lx - lr - 10, ly - 18);
        ctx.lineTo(lx - 44, ly - 18);
        ctx.lineTo(lx + 48, ly - 4);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(lx + 48, ly - 4);
        ctx.lineTo(lx - 32, ly + 32);
        ctx.lineTo(lx - lr - 8, ly + 48);
        ctx.stroke();

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(lx + 48, ly - 4);
        ctx.lineTo(lx - 36, ly + 22);
        ctx.lineTo(lx - lr - 8, ly + 34);
        ctx.stroke();

        // Rótulo nítido abaixo da lupa
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(lx - 115, ly + lr + 24, 230, 26, 8);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Cada gota = um mini prisma', lx, ly + lr + 41);

        ctx.restore();
      }
    }

    drawOutdoorForeground(ctx) {
      // Gramado verde ancorado exatamente em GROUND_Y = 605 (ERR-004)
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, VIRTUAL_HEIGHT - GROUND_Y + 480);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-800, GROUND_Y, VIRTUAL_WIDTH + 1600, 14);
      ctx.fillStyle = '#166534';
      ctx.fillRect(-800, GROUND_Y + 14, VIRTUAL_WIDTH + 1600, 12);

      // Arbustos laterais planos bicolor (mantidos nas pontas para não obstruir legendas)
      const drawBush = (bx, by, sc) => {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(sc, sc);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(-28, -14, 24, 0, Math.PI * 2);
        ctx.arc(0, -24, 30, 0, Math.PI * 2);
        ctx.arc(28, -14, 24, 0, Math.PI * 2);
        ctx.fillRect(-48, -16, 96, 16);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(12, -20, 22, 0, Math.PI * 2);
        ctx.arc(28, -14, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawBush(92, GROUND_Y, 1.0);
      drawBush(1170, GROUND_Y, 1.12);
    }
  }

  /**
   * ProfessorRig2D — Padrão Vetorial Flat Ampulheta (ERR-001..ERR-005).
   */
  class ProfessorRig2D {
    constructor() {
      this.time = 0;
      this.walkScroll = 0;

      this.state = {
        animMode: 'presenter', // 'presenter', 'walk', 'idea', 'open', 'idle', 'manual'
        expression: 'talking', // 'happy', 'talking', 'surprised', 'serious'
        talkActive: true,
        animSpeed: 1.0,
        headScale: 1.0,
        handScale: 1.0,
        torsoWidth: 1.0,
        coatLength: 1.0,
        pose: {
          lShoulder: 22,
          lElbow: 35,
          rShoulder: 60,
          rElbow: 40,
          lHip: 2,
          lKnee: 0,
          rHip: 2,
          rKnee: 0,
          headTilt: 0,
          torsoLean: 0,
          bodyBob: 0,
          lFootY: 0,
          rFootY: 0
        }
      };
    }

    /**
     * Atualiza de forma incremental (útil em estúdio interativo).
     */
    update(dt) {
      this.time += (dt || 0) * this.state.animSpeed;
      this.evaluateTime(this.time);
    }

    /**
     * Avalia a pose de forma 100% determinística para qualquer instante timeSec (ideal para scrub de timeline).
     */
    evaluateTime(timeSec) {
      this.time = timeSec;
      const t = timeSec * this.state.animSpeed;
      const p = this.state.pose;
      const mode = this.state.animMode;

      if (mode === 'manual') return;

      // Reseta offsets padrão
      p.lFootY = 0;
      p.rFootY = 0;
      p.torsoLean = 0;

      if (mode === 'presenter') {
        p.bodyBob = Math.sin(t * 2.8) * 2.5;
        p.headTilt = Math.sin(t * 1.4) * 3.5;

        p.lShoulder = 22 + Math.sin(t * 2.2) * 8;
        p.lElbow = 42 + Math.cos(t * 2.8) * 14;

        p.rShoulder = 58 + Math.sin(t * 3.0) * 14;
        p.rElbow = 48 + Math.sin(t * 3.0 + 0.5) * 16;

        p.lHip = 2;
        p.lKnee = 0;
        p.rHip = 2;
        p.rKnee = 0;
      } else if (mode === 'walk') {
        const w = t * 5.2;
        this.walkScroll += 0.03;
        p.bodyBob = Math.abs(Math.sin(w)) * -7;
        p.headTilt = Math.sin(w * 0.5) * 2.5;
        p.torsoLean = 2.0;

        // Perna esquerda e direita alternadas mantendo abertura positiva para fora (ERR-001)
        const stepL = Math.sin(w);
        const stepR = Math.sin(w + Math.PI);
        p.lHip = Math.max(0, stepL) * 18 + 2;
        p.lKnee = Math.max(0, -stepL) * 22;
        p.rHip = Math.max(0, stepR) * 18 + 2;
        p.rKnee = Math.max(0, -stepR) * 22;

        p.lFootY = Math.max(0, Math.cos(w)) * -10;
        p.rFootY = Math.max(0, Math.cos(w + Math.PI)) * -10;

        p.lShoulder = 24 + Math.max(0, stepR) * 20;
        p.lElbow = 26 + Math.abs(stepR) * 18;
        p.rShoulder = 24 + Math.max(0, stepL) * 20;
        p.rElbow = 26 + Math.abs(stepL) * 18;
      } else if (mode === 'idea') {
        p.bodyBob = Math.sin(t * 2.2) * 2;
        p.headTilt = -4 + Math.sin(t * 1.8) * 2.2;

        p.rShoulder = 78 + Math.sin(t * 3.5) * 6;
        p.rElbow = 65 + Math.cos(t * 3.5) * 8;

        p.lShoulder = 18;
        p.lElbow = 26 + Math.sin(t * 1.8) * 5;

        p.lHip = 1.5;
        p.lKnee = 0;
        p.rHip = 1.5;
        p.rKnee = 0;
      } else if (mode === 'open') {
        p.bodyBob = Math.sin(t * 3.0) * 3.2;
        p.headTilt = Math.sin(t * 1.5) * 2.5;

        p.lShoulder = 72 + Math.sin(t * 2.5) * 5;
        p.lElbow = 14 + Math.cos(t * 2.5) * 5;
        p.rShoulder = 72 + Math.sin(t * 2.5) * 5;
        p.rElbow = 14 + Math.cos(t * 2.5) * 5;

        p.lHip = 5;
        p.lKnee = 0;
        p.rHip = 5;
        p.rKnee = 0;
      } else if (mode === 'idle') {
        p.bodyBob = Math.sin(t * 1.8) * 1.8;
        p.headTilt = Math.sin(t * 0.9) * 1.5;
        p.lShoulder = 16;
        p.lElbow = 12;
        p.rShoulder = 16;
        p.rElbow = 12;
        p.lHip = 1.5;
        p.lKnee = 0;
        p.rHip = 1.5;
        p.rKnee = 0;
      }
    }

    /**
     * Renderiza o personagem ancorado no chão em (anchorX, groundY).
     */
    drawCharacter(ctx, anchorX, groundY, scale = 1.0) {
      const p = this.state.pose;
      ctx.save();
      ctx.translate(anchorX, groundY);
      ctx.scale(scale, scale);

      // 1. Sombra oval de contato no chão
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 76, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1.5 Forro traseiro escuro do casaco (desenhado ATRÁS das pernas)
      ctx.save();
      ctx.translate(0, -170 + p.bodyBob);
      ctx.rotate(degToRad(p.torsoLean));
      this.drawCoatBackLining2D(ctx);
      ctx.restore();

      // 2. Pernas paralelas (quadril fixo em x = -28 e +28 conforme ERR-001)
      this.drawLeg2D(ctx, -28 * this.state.torsoWidth, -170 + p.bodyBob, p.lHip, p.lKnee, p.lFootY, true);
      this.drawLeg2D(ctx, 28 * this.state.torsoWidth, -170 + p.bodyBob, p.rHip, p.rKnee, p.rFootY, false);

      // 3. Tronco, Colete Argyle, Casaco Roxo e Gravata
      ctx.save();
      ctx.translate(0, -170 + p.bodyBob);
      ctx.rotate(degToRad(p.torsoLean));
      this.drawTorsoAndCoat2D(ctx);

      // 4. Braços articulados com Mãos Redondas (y = -114 => global -284)
      const shoulderX = 56 * this.state.torsoWidth;
      const shoulderY = -114;
      this.drawArm2D(ctx, -shoulderX, shoulderY, p.lShoulder, p.lElbow, true);
      this.drawArm2D(ctx, shoulderX, shoulderY, p.rShoulder, p.rElbow, false);

      // 5. Cabeça (pescoço em -132, centro em -172 => global -342)
      this.drawHead2D(ctx, 0, -132, p.headTilt);

      ctx.restore();
      ctx.restore();
    }

    drawLeg2D(ctx, hipX, hipY, hipAngleDeg, kneeAngleDeg, footLiftY, isLeft) {
      const thighLen = 78;
      const shinLen = 74;
      const dir = isLeft ? 1 : -1;
      const hipRad = degToRad(hipAngleDeg * dir);
      const kneeRad = degToRad(kneeAngleDeg * dir);

      ctx.save();
      ctx.translate(hipX, hipY + (footLiftY || 0));
      ctx.rotate(hipRad);

      // Coxa (ERR-003: lineCap round)
      ctx.lineCap = 'round';
      ctx.lineWidth = 34;
      ctx.strokeStyle = isLeft ? '#7c2814' : '#631f0f';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, thighLen);
      ctx.stroke();

      // Joelho e Canela
      ctx.translate(0, thighLen);
      ctx.rotate(kneeRad);

      // Meia Listrada (Amarelo e Roxo)
      const sockStart = 28;
      for (let sy = sockStart; sy < shinLen; sy += 9) {
        const isYellow = Math.floor((sy - sockStart) / 9) % 2 === 0;
        ctx.fillStyle = isYellow ? '#f59e0b' : '#581c87';
        ctx.fillRect(-10, sy, 20, 9);
      }

      // Bainha da Calça Marrom
      ctx.fillStyle = isLeft ? '#7c2814' : '#631f0f';
      ctx.beginPath();
      ctx.roundRect(-18, -10, 36, 46, 6);
      ctx.fill();

      // Retalhos Costurados (Verde à esquerda, Laranja à direita)
      ctx.save();
      ctx.translate(isLeft ? -2 : 2, 12);
      ctx.rotate(isLeft ? -0.06 : 0.06);
      ctx.fillStyle = isLeft ? '#657a37' : '#ea580c';
      ctx.beginPath();
      ctx.roundRect(-11, -13, 22, 26, 3);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-9, -11, 18, 22);
      ctx.setLineDash([]);
      ctx.restore();

      // Sapato Nivelado com o Chão (ERR-002: compensação automática de tornozelo)
      ctx.translate(0, shinLen);
      ctx.rotate(-(hipRad + kneeRad));

      const outDir = isLeft ? -1 : 1;
      ctx.save();
      ctx.scale(outDir, 1);

      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.roundRect(-18, 10, 58, 7, 3);
      ctx.fill();

      ctx.fillStyle = isLeft ? '#581c87' : '#441569';
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-16, -8);
      ctx.quadraticCurveTo(0, -14, 16, -4);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isLeft ? '#f59e0b' : '#d97706';
      ctx.beginPath();
      ctx.arc(24, 1, 15, Math.PI * 0.95, Math.PI * 2.05);
      ctx.lineTo(39, 10);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(6, -7);
      ctx.lineTo(14, -2);
      ctx.moveTo(10, -9);
      ctx.lineTo(17, -4);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    }

    drawCoatBackLining2D(ctx) {
      const w = 58 * this.state.torsoWidth;
      const flare = 74 * this.state.torsoWidth * this.state.coatLength;
      const coatBottom = 58 * this.state.coatLength;

      ctx.fillStyle = '#2e0f4c';
      ctx.beginPath();
      ctx.moveTo(-w, -20);
      ctx.lineTo(w, -20);
      ctx.lineTo(flare, coatBottom);
      ctx.lineTo(-flare, coatBottom);
      ctx.closePath();
      ctx.fill();
    }

    drawTorsoAndCoat2D(ctx) {
      const w = 58 * this.state.torsoWidth;
      const flare = 74 * this.state.torsoWidth * this.state.coatLength;
      const coatBottom = 58 * this.state.coatLength;

      // Pélvis da calça (bicolor 2.5D)
      ctx.fillStyle = '#7c2814';
      ctx.fillRect(-w * 0.78, -22, w * 0.78, 36);
      ctx.fillStyle = '#631f0f';
      ctx.fillRect(0, -22, w * 0.78, 36);

      // Colete de Losangos (Argyle)
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w * 0.65, -122, w * 1.3, 106);
      ctx.clip();

      ctx.fillStyle = '#d97706';
      ctx.fillRect(-w * 0.65, -122, w * 1.3, 106);

      const colors = ['#ef4444', '#10b981', '#8b5cf6', '#3b82f6', '#facc15'];
      const dx = 14;
      const dy = 18;
      let idx = 0;
      for (let y = -120; y < -10; y += dy) {
        for (let x = -42; x <= 42; x += dx) {
          const ox = Math.floor(Math.abs(y) / dy) % 2 === 0 ? 0 : dx / 2;
          ctx.fillStyle = colors[idx % colors.length];
          ctx.beginPath();
          ctx.moveTo(x + ox, y - dy / 2);
          ctx.lineTo(x + ox + dx / 2, y);
          ctx.lineTo(x + ox, y + dy / 2);
          ctx.lineTo(x + ox - dx / 2, y);
          ctx.closePath();
          ctx.fill();
          idx++;
        }
      }

      // Meio-tom 2.5D vertical do lado direito
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      ctx.fillRect(0, -122, w * 0.65, 106);

      // Botões do colete
      ctx.fillStyle = '#3b1508';
      for (let by = -95; by <= -35; by += 20) {
        ctx.beginPath();
        ctx.arc(0, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Casaco Roxo (Esquerda iluminada)
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(-w, -124);
      ctx.lineTo(-18, -124);
      ctx.lineTo(-24, -18);
      ctx.lineTo(-34, coatBottom);
      ctx.lineTo(-flare, coatBottom - 4);
      ctx.closePath();
      ctx.fill();

      // Casaco Roxo (Direita sombreada)
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(18, -124);
      ctx.lineTo(w, -124);
      ctx.lineTo(flare, coatBottom - 4);
      ctx.lineTo(34, coatBottom);
      ctx.lineTo(24, -18);
      ctx.closePath();
      ctx.fill();

      // Bolsos do casaco
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.roundRect(-w + 8, -28, 22, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#441569';
      ctx.beginPath();
      ctx.roundRect(w - 30, -28, 22, 18, 3);
      ctx.fill();

      // Lenço laranja no bolso superior direito
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(28, -90);
      ctx.lineTo(36, -102);
      ctx.lineTo(44, -90);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#441569';
      ctx.fillRect(26, -90, 20, 4);

      // Lapelas
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.moveTo(-18, -124);
      ctx.lineTo(-46, -104);
      ctx.lineTo(-36, -84);
      ctx.lineTo(-44, -74);
      ctx.lineTo(-22, -40);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(18, -124);
      ctx.lineTo(46, -104);
      ctx.lineTo(36, -84);
      ctx.lineTo(44, -74);
      ctx.lineTo(22, -40);
      ctx.closePath();
      ctx.fill();

      // Estrela dourada e botões (esquerda)
      this.drawStar(ctx, -38, -74, 5, 11, 5, '#facc15');
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-32, -48, 4.5, 0, Math.PI * 2);
      ctx.arc(-34, -26, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Colarinho branco bicolor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-20, -126);
      ctx.lineTo(0, -110);
      ctx.lineTo(0, -130);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(20, -126);
      ctx.lineTo(0, -110);
      ctx.lineTo(0, -130);
      ctx.closePath();
      ctx.fill();

      // Gravata borboleta vermelha com bolinhas amarelas
      ctx.save();
      ctx.translate(0, -122);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-24, -12);
      ctx.quadraticCurveTo(-28, 0, -24, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, -12);
      ctx.quadraticCurveTo(28, 0, 24, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      const dots = [
        [-17, -4],
        [-13, 4],
        [-21, 2],
        [17, -4],
        [13, 4],
        [21, 2]
      ];
      for (const [dxDot, dyDot] of dots) {
        ctx.beginPath();
        ctx.arc(dxDot, dyDot, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(-5, -6, 10, 12, 3);
      ctx.fill();
      ctx.restore();
    }

    drawArm2D(ctx, shoulderX, shoulderY, shoulderDeg, elbowDeg, isLeft) {
      const upperArmLen = 58;
      const forearmLen = 52;
      const dir = isLeft ? 1 : -1;
      const sRad = degToRad(shoulderDeg * dir);
      const eRad = degToRad(elbowDeg * dir);
      const coatColor = isLeft ? '#6b21a8' : '#581c87';

      ctx.save();
      ctx.translate(shoulderX, shoulderY);
      ctx.rotate(sRad);

      // Braço superior (ERR-003: lineCap round)
      ctx.lineCap = 'round';
      ctx.lineWidth = 24;
      ctx.strokeStyle = coatColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, upperArmLen);
      ctx.stroke();

      // Cotovelo (esfera de pivô oculta evita frestas)
      ctx.translate(0, upperArmLen);
      ctx.fillStyle = coatColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Antebraço
      ctx.rotate(eRad);
      ctx.lineWidth = 22;
      ctx.strokeStyle = coatColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, forearmLen);
      ctx.stroke();

      // Punho da camisa branca
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(-10, forearmLen - 4, 20, 10, 3);
      ctx.fill();

      // Mão perfeitamente redonda com sombra em meia-lua curva (ERR-003)
      ctx.translate(0, forearmLen + 14);
      const handR = 14 * this.state.handScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, handR, 0, Math.PI * 2);
      ctx.fillStyle = '#d59a74';
      ctx.fill();
      ctx.clip();

      ctx.fillStyle = '#eab693';
      ctx.beginPath();
      ctx.arc(-4.5, -3.5, handR * 1.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    /**
     * Cabeça 100% conforme ERR-005 (Padrão Facial Ampulheta):
     * - Rosto oval com crescent shading na direita
     * - Apenas uma orelha visível à direita (giro 3/4)
     * - Olhos de ponto sólido escuro SEM esclera branca
     * - Óculos redondos de aro fino
     * - Nariz trapezoidal vertical flat
     * - Bigode em arco duplo com chanfro central
     * - Boca em linha reta horizontal arredondada
     */
    drawHead2D(ctx, hx, hy, headTiltDeg) {
      const s = this.state.headScale;
      const expr = this.state.expression;

      // Pescoço
      ctx.fillStyle = '#d59a74';
      ctx.fillRect(-13 * s, hy - 14, 26 * s, 26);
      ctx.fillStyle = '#eab693';
      ctx.fillRect(-13 * s, hy - 14, 15 * s, 26);

      ctx.save();
      ctx.translate(hx, hy - 40); // centro da cabeça em -172 relativo ao tronco (-342 global)
      ctx.scale(s, s);
      ctx.rotate(degToRad(headTiltDeg));

      // 1. Volume Traseiro do Cabelo Cacheado Castanho
      const backTufts = [
        [-42, -16, 26], [-48, 8, 22], [-34, -42, 28],
        [-14, -56, 30], [14, -56, 30], [36, -42, 28],
        [46, -14, 26], [48, 12, 22], [-34, 28, 20], [36, 28, 20]
      ];
      for (const [tx, ty, tr] of backTufts) {
        ctx.fillStyle = tx > 10 ? '#422513' : '#5c3820';
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Apenas UMA orelha visível à direita (giro 3/4 conforme ERR-005)
      ctx.fillStyle = '#d59a74';
      ctx.beginPath();
      ctx.ellipse(35, 3, 9, 13, 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b97c56';
      ctx.beginPath();
      ctx.ellipse(35, 4, 4.5, 7, 0.12, 0, Math.PI * 2);
      ctx.fill();

      // 3. Rosto oval com sombra curva em meia-lua na direita (crescent shading - ERR-005)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 35, 45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#d59a74';
      ctx.fill();
      ctx.clip();

      // Área iluminada deslocada à esquerda cria a meia-lua curva perfeita na direita
      ctx.fillStyle = '#eab693';
      ctx.beginPath();
      ctx.ellipse(-9, -2, 34, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rubor suave nas bochechas
      ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
      ctx.beginPath();
      ctx.ellipse(-20, 10, 7.5, 4.2, 0, 0, Math.PI * 2);
      ctx.ellipse(13, 10, 7.5, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Deslocamento sutil 3/4 para esquerda nos traços faciais
      const fx = -3;

      // 4. Olhos de ponto sólido escuro SEM esclera branca (ERR-005)
      const blinkCycle = (this.time * 0.68) % 4.0;
      const isBlinking = blinkCycle > 3.87;
      const eyeY = -8;
      const lEyeX = fx - 13;
      const rEyeX = fx + 13;
      const eyeR = expr === 'surprised' ? 4.6 : 4.0;

      ctx.fillStyle = '#1b120e';
      for (const ex of [lEyeX, rEyeX]) {
        ctx.beginPath();
        if (isBlinking) {
          ctx.roundRect(ex - 4.5, eyeY - 1, 9, 2.2, 1);
        } else {
          ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // 5. Sobrancelhas expressivas
      const browY = expr === 'surprised' ? -24 : expr === 'serious' ? -18 : -21;
      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 4.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (expr === 'serious') {
        ctx.moveTo(lEyeX - 8, browY - 2);
        ctx.quadraticCurveTo(lEyeX, browY + 1, lEyeX + 7, browY + 3);
        ctx.moveTo(rEyeX - 7, browY + 3);
        ctx.quadraticCurveTo(rEyeX, browY + 1, rEyeX + 8, browY - 2);
      } else {
        ctx.moveTo(lEyeX - 8, browY + 1);
        ctx.quadraticCurveTo(lEyeX, browY - 4, lEyeX + 8, browY);
        ctx.moveTo(rEyeX - 8, browY);
        ctx.quadraticCurveTo(rEyeX, browY - 4, rEyeX + 8, browY + 1);
      }
      ctx.stroke();

      // 6. Óculos redondos de aro fino + haste até a orelha direita
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.arc(lEyeX, eyeY, 12.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rEyeX, eyeY, 12.2, 0, Math.PI * 2);
      ctx.stroke();
      // Ponte central e haste direita
      ctx.beginPath();
      ctx.moveTo(lEyeX + 12.2, eyeY - 1);
      ctx.quadraticCurveTo(fx, eyeY - 4, rEyeX - 12.2, eyeY - 1);
      ctx.moveTo(rEyeX + 12.2, eyeY - 2);
      ctx.lineTo(35, 0);
      ctx.stroke();

      // Reflexo sutil nas lentes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(lEyeX, eyeY, 8.5, -2.5, -1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rEyeX, eyeY, 8.5, -2.5, -1.8);
      ctx.stroke();

      // 7. Nariz trapezoidal vertical flat (ERR-005)
      ctx.fillStyle = '#cf8d65';
      ctx.beginPath();
      ctx.moveTo(fx - 2.6, -4);
      ctx.lineTo(fx + 2.6, -4);
      ctx.lineTo(fx + 5.2, 10);
      ctx.lineTo(fx - 5.2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b97852';
      ctx.beginPath();
      ctx.moveTo(fx, -4);
      ctx.lineTo(fx + 2.6, -4);
      ctx.lineTo(fx + 5.2, 10);
      ctx.lineTo(fx, 10);
      ctx.closePath();
      ctx.fill();

      // 8. Boca em linha reta horizontal arredondada (ERR-005)
      const mouthY = 23;
      if (this.state.talkActive) {
        const openAmt = 0.25 + Math.abs(Math.sin(this.time * 10.5)) * 0.75;
        const mouthH = 3.2 + openAmt * 6.2;
        ctx.fillStyle = '#5c1414';
        ctx.beginPath();
        ctx.roundRect(fx - 9, mouthY - mouthH * 0.5, 18, mouthH, mouthH * 0.5);
        ctx.fill();
      } else if (expr === 'surprised') {
        ctx.fillStyle = '#5c1414';
        ctx.beginPath();
        ctx.roundRect(fx - 5.5, mouthY - 5.5, 11, 11, 5.5);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#5c1e16';
        ctx.lineWidth = 3.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (expr === 'happy') {
          ctx.moveTo(fx - 10, mouthY - 1);
          ctx.quadraticCurveTo(fx, mouthY + 3, fx + 10, mouthY - 1);
        } else {
          ctx.moveTo(fx - 9, mouthY);
          ctx.lineTo(fx + 9, mouthY);
        }
        ctx.stroke();
      }

      // 9. Bigode em arco duplo com chanfro central (ERR-005)
      const stacheWave = this.state.talkActive ? Math.sin(this.time * 10.5) * 1.1 : 0;
      const mY = 12 + stacheWave;
      ctx.fillStyle = '#29170e';
      ctx.beginPath();
      // Topo com chanfro central pronunciado em fx
      ctx.moveTo(fx, mY + 2);
      ctx.bezierCurveTo(fx - 5, mY - 6, fx - 19, mY - 3, fx - 29, mY + 7);
      ctx.quadraticCurveTo(fx - 24, mY + 12, fx - 14, mY + 9);
      ctx.quadraticCurveTo(fx - 4, mY + 8, fx, mY + 4.5);
      // Lado direito simétrico
      ctx.quadraticCurveTo(fx + 4, mY + 8, fx + 14, mY + 9);
      ctx.quadraticCurveTo(fx + 24, mY + 12, fx + 29, mY + 7);
      ctx.bezierCurveTo(fx + 19, mY - 3, fx + 5, mY - 6, fx, mY + 2);
      ctx.closePath();
      ctx.fill();

      // 10. Topete / Cachos Frontais
      const frontTufts = [
        [-22, -38, 15], [-4, -44, 17], [15, -40, 16], [28, -32, 13]
      ];
      for (const [tx, ty, tr] of frontTufts) {
        ctx.fillStyle = tx > 8 ? '#4a2b17' : '#633c23';
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Engine2D — Orquestrador unificado de cena, câmera, VFX e episódio 16:9 (1280x720).
   */
  class Engine2D {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.camera = new CameraController2D();
      this.scenery = new SceneryAndLighting2D();
      this.professor = new ProfessorRig2D();
      this.transitionCanvas = null;
      this.transitionCtx = null;
    }

    ensureTransitionBuffer() {
      if (!this.transitionCanvas && typeof document !== 'undefined') {
        this.transitionCanvas = document.createElement('canvas');
        this.transitionCanvas.width = VIRTUAL_WIDTH;
        this.transitionCanvas.height = VIRTUAL_HEIGHT;
        this.transitionCtx = this.transitionCanvas.getContext('2d');
      }
      return this.transitionCtx;
    }

    renderScenePass(ctx, sceneName, sceneState, t) {
      // Limpa canvas na resolução virtual 1280x720
      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // Atualiza track de câmera (suporta câmera por cena durante cross-dissolve ou track global)
      const camTrack =
        (sceneState.sceneCameras && sceneState.sceneCameras[sceneName]) || sceneState.cameraTrack;
      this.camera.evaluateTrack(t, camTrack);

      // Camada 1: Fundo distante (parallax 0.15x)
      this.camera.withLayer(ctx, 0.15, () => {
        if (sceneName === 'solar_waves') {
          this.scenery.drawSolarBackdrop(ctx, sceneState, t);
        } else if (sceneName === 'outdoor_rainbow') {
          this.scenery.drawOutdoorBackdrop(ctx, sceneState, t);
        } else {
          this.scenery.drawBackdrop(ctx, sceneState);
        }
      });

      // Camada 2: Plano médio (parallax 0.45x)
      this.camera.withLayer(ctx, 0.45, () => {
        if (sceneName === 'solar_waves') {
          this.scenery.drawSolarMidground(ctx, sceneState, t);
        } else if (sceneName === 'outdoor_rainbow') {
          this.scenery.drawOutdoorMidground(ctx, sceneState, t);
        } else {
          this.scenery.drawMidground(ctx, sceneState, t);
        }
      });

      // Camada 3: Primeiro plano - Chão y=605, elementos, professor e VFX (parallax 1.0x)
      this.camera.withLayer(ctx, 1.0, () => {
        if (sceneName === 'solar_waves') {
          this.scenery.drawSolarForeground(ctx, sceneState);
        } else if (sceneName === 'outdoor_rainbow') {
          this.scenery.drawOutdoorForeground(ctx, sceneState);
        } else {
          this.scenery.drawForegroundFloorAndWorkbench(ctx, sceneState);
        }

        // Posiciona e anima o professor ancorado exatamente em GROUND_Y = 605
        const profCfg =
          (sceneState.sceneProfessor && sceneState.sceneProfessor[sceneName]) || sceneState;
        this.professor.state.animMode = profCfg.profMode || 'presenter';
        this.professor.state.expression = profCfg.profExpression || 'talking';
        this.professor.state.talkActive = Boolean(sceneState.talkActive);
        this.professor.evaluateTime(t);
        this.professor.drawCharacter(
          ctx,
          profCfg.profX !== undefined ? profCfg.profX : 330,
          GROUND_Y,
          profCfg.profScale !== undefined ? profCfg.profScale : 0.94
        );

        // Efeito da lâmpada acima da cabeça quando em modo 'idea'
        if (sceneState.ideaBulbAlpha > 0 && sceneName === 'lab') {
          const px = profCfg.profX !== undefined ? profCfg.profX : 330;
          const pScale = profCfg.profScale !== undefined ? profCfg.profScale : 0.94;
          this.scenery.drawIdeaBulb(ctx, px, GROUND_Y - 465 * pScale, sceneState.ideaBulbAlpha, t);
        }

        // Feixe branco, prisma dispersando e arco-íris no laboratório
        if (sceneName === 'lab') {
          this.scenery.drawOpticalVFX(ctx, sceneState, t);
        }
      });
    }

    renderAt(timeSec, episode) {
      const ctx = this.ctx;
      const t = clamp(timeSec, 0, episode.duration);
      const sceneState = episode.evaluate(t, this);

      const primaryScene = sceneState.scene || 'lab';
      const nextScene = sceneState.sceneNext || null;
      const blend = clamp(sceneState.sceneBlend || 0, 0, 1);

      this.renderScenePass(ctx, primaryScene, sceneState, t);

      // Cross-dissolve suave entre cenários diferentes (sem corte seco)
      if (nextScene && nextScene !== primaryScene && blend > 0.005) {
        const tCtx = this.ensureTransitionBuffer();
        if (tCtx) {
          this.renderScenePass(tCtx, nextScene, sceneState, t);
          ctx.save();
          ctx.globalAlpha = blend;
          ctx.drawImage(this.transitionCanvas, 0, 0);
          ctx.restore();
        }
      }

      // Camada 4: Vinheta e transições globais de abertura/encerramento
      this.scenery.drawVignetteAndFades(ctx, t, episode.duration);

      return sceneState;
    }
  }

  /**
   * DynamicChart2D — Sistema de Gráficos e Infográficos Animados 2D
   * Estética: Ampulheta Flat Vector 2.5D (Sem sombras borradas realistas)
   * Suporta:
   * 1. Curva Exponencial com "Quebra de Teto" (Supervalorização do Café)
   * 2. Barras Comparativas de Exportação (40% -> 70%)
   * 3. Medidor Proporcional de Xícaras (7 em cada 10)
   */
  class DynamicChart2D {
    static easeInExpo(t) {
      return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    }

    static easeOutBack(t) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    /**
     * Gráfico de Supervalorização Exponencial com Quebra de Topo
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x Coordenada X base (ex: 660)
     * @param {number} y Coordenada Y base (ex: 110)
     * @param {number} w Largura (ex: 480)
     * @param {number} h Altura do card (ex: 340)
     * @param {number} progress 0.0 a 1.0 (animação determinística)
     * @param {Object} options Configurações adicionais
     */
    // Função pura da curva: de 0 em s=0 até 1.0 (topo da grade) e 1.25 (rompimento físico do card)
    static getBreakoutValue(s) {
      if (s <= 0) return 0;
      // Curva em potência suave: começa lenta e ganha aceleração contínua
      return Math.pow(s, 2.8) * 1.25;
    }

    static drawBreakoutChart(ctx, x, y, w, h, progress = 0, options = {}) {
      const p = Math.max(0, Math.min(1, progress));
      const title = options.title || 'SUPERVALORIZAÇÃO DO CAFÉ';
      const subtitle = options.subtitle || 'Preço por Saca / Salto Exponencial de Lucro';

      // Parâmetros geométricos do grid
      const padL = 54;
      const padR = 26;
      const padT = 74;
      const padB = 40;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;

      // O topo da grade (100%) ocorre quando getBreakoutValue(s) == 1.0
      // Math.pow(s, 2.8) * 1.25 = 1.0 => s = (1/1.25)^(1/2.8) = (0.8)^(0.3571) = ~0.923
      const ruptureT = Math.pow(1.0 / 1.25, 1 / 2.8); // ~0.9233

      // O teto FÍSICO da moldura (em y=0 na coordenada do card, ou seja, -padT acima do topo da grade)
      // Ocorre quando effectiveVal = (plotH + padT) / plotH = 1 + 74/plotH = ~1.20
      const physicalFrameCeilingT = Math.pow((plotH + padT) / (plotH * 1.25), 1 / 2.8); // ~0.985

      // O rompimento REAL só começa quando a ponta física da linha ultrapassa o teto (p >= ruptureT)
      const isBreaking = p >= ruptureT;
      const breakProg = isBreaking ? Math.min(1.0, (p - ruptureT) / (1.0 - ruptureT)) : 0;

      // Shake reativo começa EXATAMENTE quando fura o teto e cresce no impacto
      let shakeX = 0;
      let shakeY = 0;
      if (isBreaking) {
        const shakeIntensity = breakProg * 8.0;
        shakeX = Math.sin(p * 110) * shakeIntensity;
        shakeY = Math.cos(p * 125) * shakeIntensity;
      }

      ctx.save();
      ctx.translate(x + shakeX, y + shakeY);

      // 1. Moldura do Card Flat Bicolor 2.5D
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, w, h, 14);
      } else {
        ctx.rect(0, 0, w, h);
      }
      ctx.fill();
      ctx.stroke();

      // Faixa Superior / Cabeçalho
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, w, 54, [14, 14, 0, 0]);
      } else {
        ctx.rect(0, 0, w, 54);
      }
      ctx.fill();

      // Ponto pulsante de status
      ctx.fillStyle = isBreaking ? '#ef4444' : '#22c55e';
      ctx.beginPath();
      ctx.arc(24, 27, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Tipografia do Cabeçalho
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 40, 31);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(subtitle, 40, 47);

      // 2. Grade de Fundo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 4; i++) {
        const gy = padT + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padL, gy);
        ctx.lineTo(padL + plotW, gy);
        ctx.stroke();
      }

      // Linha tracejada vermelha do TOPO DA GRADE
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = isBreaking ? '#ef4444' : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL + plotW, padT);
      ctx.stroke();
      ctx.restore();

      // Rótulos do Eixo Y
      ctx.fillStyle = '#64748b';
      ctx.font = '600 11px "Segoe UI", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('TOPO', padL - 8, padT + 4);
      ctx.fillText('75%', padL - 8, padT + plotH * 0.25 + 4);
      ctx.fillText('50%', padL - 8, padT + plotH * 0.50 + 4);
      ctx.fillText('25%', padL - 8, padT + plotH * 0.75 + 4);
      ctx.fillText('0', padL - 8, padT + plotH + 4);

      // Eixo X (Datas históricas)
      ctx.textAlign = 'center';
      ctx.fillText('1830', padL + plotW * 0.05, h - 16);
      ctx.fillText('1850', padL + plotW * 0.35, h - 16);
      ctx.fillText('1870', padL + plotW * 0.65, h - 16);
      ctx.fillText('1888', padL + plotW * 0.95, h - 16);

      // 3. Traçado da Curva Exponencial com ALTA RESOLUÇÃO SUAVE (120 passos)
      // A linha avança de x = padL até x_head = padL + p * plotW
      const numSamples = Math.max(2, Math.floor(p * 120));
      const currentPoints = [];

      for (let i = 0; i <= numSamples; i++) {
        const frac = i / numSamples;
        const curS = frac * p; // progresso temporal real do ponto
        const curX = padL + curS * plotW;
        const effectiveVal = DynamicChart2D.getBreakoutValue(curS);
        const curY = padT + plotH - effectiveVal * plotH;
        currentPoints.push({ x: curX, y: curY });
      }

      if (currentPoints.length > 1) {
        // Área preenchida sob a curva
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, padT + plotH);
        for (const pt of currentPoints) {
          ctx.lineTo(pt.x, Math.max(-50, pt.y));
        }
        const lastPt = currentPoints[currentPoints.length - 1];
        ctx.lineTo(lastPt.x, padT + plotH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(234, 179, 8, 0.40)');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Linha dourada sólida
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();

        // Cabeça guia brilhante (ponta atual da linha)
        const head = currentPoints[currentPoints.length - 1];
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 4. EFEITO DE QUEBRA DO TETO (SÓ DISPARA QUANDO A LINHA REALMENTE CRUZA O TOPO)
      if (isBreaking && currentPoints.length > 0) {
        const head = currentPoints[currentPoints.length - 1];
        const ruptureX = padL + ruptureT * plotW;
        const ruptureY = padT;

        // Lascas e estilhaços voando a partir do ponto de quebra
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        const shardCount = 10;
        for (let s = 0; s < shardCount; s++) {
          const angle = -Math.PI * 0.75 + (s / shardCount) * Math.PI * 0.65;
          const dist = breakProg * (50 + (s % 3) * 20);
          const shardX = ruptureX + Math.cos(angle) * dist;
          const shardY = ruptureY + Math.sin(angle) * dist;
          const shardSize = 7 - (s % 3);

          ctx.beginPath();
          ctx.moveTo(shardX, shardY);
          ctx.lineTo(shardX + shardSize, shardY - shardSize * 0.6);
          ctx.lineTo(shardX + shardSize * 0.5, shardY + shardSize);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Faíscas determinísticas
        for (let k = 0; k < 16; k++) {
          const sparkAngle = (k / 16) * Math.PI * 2;
          const sparkDist = breakProg * (35 + (k % 4) * 18);
          const sx = ruptureX + Math.cos(sparkAngle) * sparkDist;
          const sy = ruptureY - 12 + Math.sin(sparkAngle) * sparkDist;
          ctx.fillStyle = k % 2 === 0 ? '#facc15' : '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, 3.2 * (1 - breakProg * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Selo de Explosão / Recorde
        // Posicionado à esquerda do ponto de saída
        const badgeX = ruptureX - 110;
        const badgeY = ruptureY - 32;
        const tagScale = DynamicChart2D.easeOutBack(Math.min(1.0, breakProg * 1.4));

        ctx.save();
        ctx.translate(badgeX, badgeY);
        ctx.scale(tagScale, tagScale);

        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-85, -24, 170, 48, 8);
        } else {
          ctx.rect(-85, -24, 170, 48);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESTOUROU O TOPO!', 0, -4);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 16px "Segoe UI", monospace';
        ctx.fillText('+700% LUCRO', 0, 16);
        ctx.restore();
      }

      ctx.restore();
    }

    // =========================================================================
    // PRESET 2: Barras Comparativas 2.5D (40% em 1850 -> 70% em 1880)
    // =========================================================================
    static drawBarComparisonChart(ctx, x, y, w, h, progress = 0, options = {}) {
      const p = Math.max(0, Math.min(1, progress));
      const title = options.title || 'PARTICIPAÇÃO NAS EXPORTAÇÕES';
      const subtitle = options.subtitle || 'Salto Histórico da Receita Cambial do Brasil';
      const valA = options.valA !== undefined ? options.valA : 40;
      const valB = options.valB !== undefined ? options.valB : 70;
      const labelA = options.labelA || '1850 (~40%)';
      const labelB = options.labelB || '1880 (>70%)';

      ctx.save();
      ctx.translate(x, y);

      // Card Base
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, w, h, 14);
      else ctx.rect(0, 0, w, h);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, w, 52, [14, 14, 0, 0]);
      else ctx.rect(0, 0, w, 52);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(24, 26, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 40, 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(subtitle, 40, 46);

      const padL = 60;
      const padR = 40;
      const padT = 76;
      const padB = 46;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      const baselineY = padT + plotH;

      // Linha de Meta 50%
      const metaY = padT + plotH * 0.5;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, metaY);
      ctx.lineTo(padL + plotW, metaY);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('50% (MAIORIA ABSOLUTA)', padL + plotW, metaY - 6);
      ctx.restore();

      const colW = 86;
      const col1X = padL + plotW * 0.28 - colW * 0.5;
      const col2X = padL + plotW * 0.72 - colW * 0.5;

      const progA = DynamicChart2D.easeOutBack(Math.min(1, p * 1.3));
      const progB = DynamicChart2D.easeOutBack(p);

      const currentValA = valA * progA;
      const currentValB = valB * progB;

      const hA = (currentValA / 100) * plotH;
      const hB = (currentValB / 100) * plotH;

      const drawPrismBar = (bx, barHeight, colorLight, colorDark, topColor, val, label) => {
        const by = baselineY - barHeight;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(bx + colW * 0.5, baselineY + 4, colW * 0.52, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (barHeight > 4) {
          ctx.fillStyle = colorLight;
          ctx.fillRect(bx, by, colW * 0.52, barHeight);
          ctx.fillStyle = colorDark;
          ctx.fillRect(bx + colW * 0.52, by, colW * 0.48, barHeight);

          ctx.fillStyle = topColor;
          ctx.beginPath();
          ctx.ellipse(bx + colW * 0.5, by, colW * 0.5, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = colorLight;
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx + colW * 0.5 - 34, by - 32, 68, 24, 6);
          else ctx.rect(bx + colW * 0.5 - 34, by - 32, 68, 24);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(val)}%`, bx + colW * 0.5, by - 16);
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, bx + colW * 0.5, baselineY + 22);
      };

      drawPrismBar(col1X, hA, '#38bdf8', '#0284c7', '#7dd3fc', currentValA, labelA);
      drawPrismBar(col2X, hB, '#f59e0b', '#b45309', '#fde047', currentValB, labelB);

      // Conector com Delta
      if (p > 0.45) {
        const conProg = DynamicChart2D.easeOutBack(Math.min(1, (p - 0.45) / 0.55));
        const startX = col1X + colW;
        const startY = baselineY - hA - 16;
        const endX = col2X;
        const endY = baselineY - hB - 16;

        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo((startX + endX) * 0.5, Math.min(startY, endY) - 30, endX, endY);
        ctx.stroke();
        ctx.restore();

        const midX = (startX + endX) * 0.5;
        const midY = (startY + endY) * 0.5 - 28;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.scale(conProg, conProg);

        ctx.fillStyle = '#16a34a';
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-65, -16, 130, 32, 6);
        else ctx.rect(-65, -16, 130, 32);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.deltaLabel || '+30% EM 30 ANOS', 0, 5);
        ctx.restore();
      }

      ctx.restore();
    }

    // =========================================================================
    // PRESET 3: Medidor de Xícaras ("7 em Cada 10 Xícaras no Mundo")
    // =========================================================================
    static drawRatioGridChart(ctx, x, y, w, h, progress = 0, options = {}) {
      const p = Math.max(0, Math.min(1, progress));
      const title = options.title || 'DOMÍNIO DO MERCADO GLOBAL';
      const subtitle = options.subtitle || 'A Cada 10 Xícaras Consumidas no Planeta...';
      const activeTarget = options.activeCount || 7;
      const totalCount = options.totalCount || 10;
      const time = options.time || 0;

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, w, h, 14);
      else ctx.rect(0, 0, w, h);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(0, 0, w, 52, [14, 14, 0, 0]);
      else ctx.rect(0, 0, w, 52);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(24, 26, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 40, 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(subtitle, 40, 46);

      const drawCup2D = (cx, cy, isActive, idx) => {
        ctx.save();
        ctx.translate(cx, cy);

        const colorBodyLight = isActive ? '#fef3c7' : '#334155';
        const colorBodyDark = isActive ? '#fde68a' : '#1e293b';
        const colorSaucer = isActive ? '#cbd5e1' : '#1e293b';
        const alpha = isActive ? 1.0 : 0.45;

        ctx.globalAlpha = alpha;

        ctx.fillStyle = colorSaucer;
        ctx.beginPath();
        ctx.ellipse(0, 16, 26, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorBodyLight;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-18, -14, 18, 28, [2, 0, 4, 12]);
        else ctx.rect(-18, -14, 18, 28);
        ctx.fill();

        ctx.fillStyle = colorBodyDark;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(0, -14, 18, 28, [0, 2, 12, 4]);
        else ctx.rect(0, -14, 18, 28);
        ctx.fill();

        ctx.strokeStyle = colorBodyDark;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(19, 0, 7, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        ctx.fillStyle = isActive ? '#3f2212' : '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, -14, 17, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (isActive) {
          ctx.strokeStyle = 'rgba(254, 243, 199, 0.65)';
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          for (let v = 0; v < 2; v++) {
            const vx = (v === 0 ? -6 : 6);
            const vPhase = time * 3.5 + idx * 1.5 + v * 2.0;
            ctx.beginPath();
            ctx.moveTo(vx, -20);
            ctx.bezierCurveTo(
              vx + Math.sin(vPhase) * 6, -28,
              vx - Math.sin(vPhase) * 6, -36,
              vx + Math.sin(vPhase) * 4, -44
            );
            ctx.stroke();
          }
        }

        ctx.restore();
      };

      const startX = 64;
      const startY = 126;
      const gapX = 74;
      const gapY = 82;
      const activatedCountExact = p * activeTarget;

      for (let i = 0; i < totalCount; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const cupX = startX + col * gapX;
        const cupY = startY + row * gapY;
        const isTarget = i < activeTarget;
        const activationProgress = Math.max(0, Math.min(1, activatedCountExact - i));
        const isActive = isTarget && activationProgress > 0.3;
        drawCup2D(cupX, cupY, isActive, i);
      }

      // Gauge Circular Lateral
      const gaugeX = w - 95;
      const gaugeY = 175;
      const gaugeR = 48;
      const currentPercent = Math.min(70, Math.round(p * 70));

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, gaugeR, 0, Math.PI * 2);
      ctx.stroke();

      const arcAngle = (currentPercent / 100) * (Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, gaugeR, -Math.PI * 0.5, -Math.PI * 0.5 + arcAngle);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentPercent}%`, gaugeX, gaugeY + 4);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px "Segoe UI", monospace';
      ctx.fillText('DO MUNDO', gaugeX, gaugeY + 18);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('7 DE CADA 10 XÍCARAS ERAM PRODUZIDAS NO BRASIL', w * 0.5, h - 18);

      ctx.restore();
    }
  }

  const exportsObj = {
    VIRTUAL_WIDTH,
    VIRTUAL_HEIGHT,
    GROUND_Y,
    SPECTRUM_BANDS,
    clamp,
    lerp,
    smootherstep,
    easeOutCubic,
    segmentProgress,
    CameraController2D,
    SceneryAndLighting2D,
    DynamicChart2D,
    ProfessorRig2D,
    Engine2D
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  Object.assign(root, exportsObj);
})(typeof window !== 'undefined' ? window : globalThis);
