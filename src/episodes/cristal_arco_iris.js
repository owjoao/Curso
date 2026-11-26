/**
 * cristal_arco_iris.js — Episódio 01 (v2 Multi-Cenários & Jogo de Câmera Macro)
 * Tema: "Por que um cristal cria um arco-íris?" (60.0s determinístico)
 */
(function (root) {
  'use strict';

  const { clamp, lerp, smootherstep, segmentProgress } = root;

  const CHAPTERS = [
    {
      id: 'cap-1',
      number: 1,
      title: 'O Mistério no Laboratório',
      start: 0,
      end: 8.2,
      summary: 'Plano geral do laboratório e close no cristal misterioso.'
    },
    {
      id: 'cap-2',
      number: 2,
      title: 'A Luz do Sol em Ondas',
      start: 8.2,
      end: 20.0,
      summary: 'Cenário solar mostrando que a luz branca contém todas as cores.'
    },
    {
      id: 'cap-3',
      number: 3,
      title: 'Macro no Prisma (Refração)',
      start: 20.0,
      end: 38.0,
      summary: 'Zoom macro no cristal revelando a desaceleração e separação das cores.'
    },
    {
      id: 'cap-4',
      number: 4,
      title: 'Eureka! O Leque de 7 Cores',
      start: 38.0,
      end: 49.8,
      summary: 'Reação do professor e análise ondulatória de 700 nm a 400 nm.'
    },
    {
      id: 'cap-5',
      number: 5,
      title: 'Arco-Íris em Campo Aberto',
      start: 49.8,
      end: 60.0,
      summary: 'Ambiente aberto pós-chuva com gotículas e arco-íris gigante no céu.'
    }
  ];

  // Timings sincronizados exatamente com audio/cristal_arco_iris/cue_timings.json
  const SUBTITLE_CUES = [
    { start: 0.7, end: 4.043, text: 'Você já se perguntou como um pedaço de vidro transparente cria um arco-íris?', talk: true },
    { start: 4.6, end: 7.862, text: 'Parece mágica... mas o segredo já estava escondido dentro da própria luz!', talk: true },
    { start: 8.3, end: 12.361, text: 'A luz branca do Sol não é sem cor: ela é a soma de todas as cores juntas.', talk: true },
    { start: 14.0, end: 17.634, text: 'Cada cor viaja como uma onda — do vermelho longo ao violeta curto.', talk: true },
    { start: 20.3, end: 24.471, text: 'Quando esse feixe atinge o cristal em ângulo, a velocidade da luz diminui de repente.', talk: true },
    { start: 26.4, end: 30.529, text: 'Esse freio faz o raio mudar de direção — é o fenômeno chamado refração!', talk: true },
    { start: 32.5, end: 36.631, text: 'Só que o cristal não freia todas as ondas igual: as curtas sofrem um desvio maior.', talk: true },
    { start: 38.3, end: 43.329, text: 'Eureka! O violeta dobra bem mais que o vermelho, abrindo o feixe em sete faixas nítidas.', talk: true },
    { start: 44.5, end: 48.592, text: 'E o cristal não criou tinta nenhuma: ele apenas separou cores que já viajavam unidas!', talk: true },
    { start: 50.2, end: 53.986, text: 'Depois da chuva, cada gotinha no céu age exatamente como esse prisma na bancada.', talk: true },
    { start: 55.2, end: 59.243, text: 'Da próxima vez que vir um arco-íris, lembre: é pura física pintando o horizonte!', talk: true }
  ];

  // Tracks de câmera dedicados por cenário para jogo de câmera macro e cross-dissolve sem saltos
  const LAB_CAMERA_TRACK = [
    { t: 0.0, x: -30, y: 0, zoom: 1.0 },
    { t: 4.2, x: 10, y: -4, zoom: 1.06 },
    { t: 7.8, x: 125, y: 18, zoom: 1.32 },
    // Retorno ao laboratório com zoom macro direto no Prisma de Cristal
    { t: 19.6, x: 125, y: 24, zoom: 1.42 },
    { t: 22.8, x: 215, y: 46, zoom: 1.80 },
    { t: 27.5, x: 245, y: 44, zoom: 1.82 },
    { t: 32.5, x: 315, y: 38, zoom: 1.62 },
    { t: 37.4, x: 295, y: 36, zoom: 1.56 },
    // Reenquadramento rápido para o Professor "Eureka!" (plano médio acima da cintura)
    { t: 38.7, x: -215, y: -88, zoom: 1.42 },
    { t: 43.2, x: -205, y: -82, zoom: 1.45 },
    // Abertura final da bancada antes de sair ao ar livre
    { t: 45.2, x: 75, y: 8, zoom: 1.15 },
    { t: 50.2, x: 95, y: 10, zoom: 1.18 }
  ];

  const SOLAR_CAMERA_TRACK = [
    { t: 7.8, x: -25, y: -12, zoom: 1.02 },
    { t: 11.5, x: 65, y: -45, zoom: 1.22 },
    { t: 15.2, x: 248, y: -88, zoom: 1.56 },
    { t: 20.3, x: 262, y: -92, zoom: 1.62 }
  ];

  const OUTDOOR_CAMERA_TRACK = [
    { t: 49.4, x: 55, y: -38, zoom: 1.24 },
    { t: 52.8, x: 68, y: -46, zoom: 1.28 },
    { t: 55.6, x: 12, y: -10, zoom: 1.04 },
    { t: 60.0, x: 0, y: 0, zoom: 1.0 }
  ];

  function getActiveChapter(timeSec) {
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (timeSec >= CHAPTERS[i].start && timeSec < CHAPTERS[i].end) {
        return CHAPTERS[i];
      }
    }
    return CHAPTERS[CHAPTERS.length - 1];
  }

  function getActiveCue(timeSec) {
    for (let i = 0; i < SUBTITLE_CUES.length; i++) {
      if (timeSec >= SUBTITLE_CUES[i].start && timeSec <= SUBTITLE_CUES[i].end) {
        return SUBTITLE_CUES[i];
      }
    }
    return null;
  }

  function evaluate(timeSec) {
    const t = clamp(timeSec, 0, 60);
    const chapter = getActiveChapter(t);
    const cue = getActiveCue(t);

    // Determina cenário principal e eventual cross-dissolve (0.6s)
    let scene = 'lab';
    let sceneNext = null;
    let sceneBlend = 0;

    if (t >= 7.9 && t < 8.5) {
      scene = 'lab';
      sceneNext = 'solar_waves';
      sceneBlend = smootherstep(segmentProgress(t, 7.9, 8.5));
    } else if (t >= 8.5 && t < 19.7) {
      scene = 'solar_waves';
    } else if (t >= 19.7 && t < 20.3) {
      scene = 'solar_waves';
      sceneNext = 'lab';
      sceneBlend = smootherstep(segmentProgress(t, 19.7, 20.3));
    } else if (t >= 20.3 && t < 49.5) {
      scene = 'lab';
    } else if (t >= 49.5 && t < 50.15) {
      scene = 'lab';
      sceneNext = 'outdoor_rainbow';
      sceneBlend = smootherstep(segmentProgress(t, 49.5, 50.15));
    } else if (t >= 50.15) {
      scene = 'outdoor_rainbow';
    }

    // Entrada suave do professor caminhando entre 0.0s e 2.2s
    const walkIn = smootherstep(segmentProgress(t, 0.0, 2.2));
    const profXLab = lerp(215, 328, walkIn);
    const profScale = 0.94;

    let profMode = 'presenter';
    let profExpression = 'talking';
    let ideaBulbAlpha = 0;

    if (t < 2.2) {
      profMode = 'walk';
      profExpression = 'happy';
    } else if (t < 8.2) {
      profMode = 'open';
      profExpression = t > 4.6 ? 'surprised' : 'talking';
    } else if (t < 20.0) {
      profMode = 'presenter';
      profExpression = 'talking';
    } else if (t < 38.0) {
      profMode = t > 26.4 && t < 31.0 ? 'open' : 'presenter';
      profExpression = t > 26.4 && t < 31.0 ? 'surprised' : 'talking';
    } else if (t < 44.2) {
      profMode = 'idea';
      profExpression = 'surprised';
      const inB = smootherstep(segmentProgress(t, 38.2, 39.0));
      const outB = 1 - smootherstep(segmentProgress(t, 43.1, 44.1));
      ideaBulbAlpha = Math.min(inB, outB);
    } else if (t < 55.2) {
      profMode = 'presenter';
      profExpression = 'happy';
    } else {
      profMode = 'open';
      profExpression = 'happy';
    }

    // Quadro negro no laboratório
    let boardMode = 'title';
    if (t >= 20.0 && t < 50.0) boardMode = 'refraction';

    // Escurecimento dramático do laboratório durante a demonstração óptica macro
    const dimUp = smootherstep(segmentProgress(t, 19.6, 21.8));
    const dimDown = 1 - smootherstep(segmentProgress(t, 49.0, 50.2));
    const roomDarkness = Math.min(dimUp, dimDown) * 0.85;

    // Progressão física do feixe e espectro no laboratório
    const whiteBeamProgress = smootherstep(segmentProgress(t, 20.2, 22.8));
    const spectrumProgress = smootherstep(segmentProgress(t, 23.0, 27.4));
    const crystalGlow = Math.max(0.2, smootherstep(segmentProgress(t, 22.4, 24.8)));

    // Revelação das ondas solares e do arco-íris aberto
    const solarWaveReveal = smootherstep(segmentProgress(t, 8.2, 13.5));
    const outdoorRainbowReveal = smootherstep(segmentProgress(t, 49.5, 51.6));
    const raindropLoupeAlpha =
      Math.min(
        smootherstep(segmentProgress(t, 49.8, 50.7)),
        1 - smootherstep(segmentProgress(t, 54.6, 56.2))
      );

    return {
      time: t,
      scene,
      sceneNext,
      sceneBlend,
      chapter,
      cue,
      talkActive: Boolean(cue && cue.talk),
      profX: profXLab,
      profScale,
      profMode,
      profExpression,
      ideaBulbAlpha,
      sceneProfessor: {
        lab: { profX: profXLab, profScale, profMode, profExpression },
        solar_waves: {
          profX: 285,
          profScale: 0.94,
          profMode: t > 12.2 ? 'idle' : profMode,
          profExpression
        },
        outdoor_rainbow: { profX: 335, profScale: 0.94, profMode, profExpression }
      },
      boardMode,
      boardAlpha: 1,
      roomDarkness,
      whiteBeamProgress: t < 20.0 ? 0 : whiteBeamProgress,
      spectrumProgress: t < 23.0 ? 0 : spectrumProgress,
      crystalGlow,
      showBeamWaves: t >= 30.0 && t <= 49.8,
      showSpectrumLabels: t >= 31.5 && t <= 50.0,
      solarWaveReveal,
      outdoorRainbowReveal,
      raindropLoupeAlpha,
      cameraTrack: LAB_CAMERA_TRACK,
      sceneCameras: {
        lab: LAB_CAMERA_TRACK,
        solar_waves: SOLAR_CAMERA_TRACK,
        outdoor_rainbow: OUTDOOR_CAMERA_TRACK
      }
    };
  }

  const EpisodeCristalArcoIris = {
    id: 'cristal_arco_iris',
    title: 'Por que um Cristal cria um Arco-Íris?',
    channel: 'O Porquê das Coisas',
    duration: 60,
    chapters: CHAPTERS,
    cues: SUBTITLE_CUES,
    evaluate,
    getActiveChapter,
    getActiveCue
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EpisodeCristalArcoIris };
  }
  root.EpisodeCristalArcoIris = EpisodeCristalArcoIris;
})(typeof window !== 'undefined' ? window : globalThis);
