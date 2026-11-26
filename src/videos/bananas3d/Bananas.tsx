import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { InkPass, noInkFallback } from "../pisa/ink";
import { LensBlur } from "../pisa/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../pisa/grade";
import { BananasWorld, TOTAL, shotAt, focusAt } from "./scene";
import wordsData from "../../../audio/bananas_radioativas_words.json";

export const BANANAS_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.45,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) =>
    setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new BananasWorld(), []);
  const fx = useMemo(
    () => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    }),
    [camera, scene]
  );

  useEffect(() => () => fx.ink.dispose(), [fx]);
  const gl = useThree((st) => st.gl);
  const size = useThree((st) => st.size);
  const nopost = (getInputProps() as { nopost?: boolean }).nopost;

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, {
      multisampling: 4,
      frameBufferType: THREE.HalfFloatType,
    });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(fx.ink);
    c.addPass(new EffectPass(camera, fx.lens.pre));
    c.addPass(new EffectPass(camera, fx.lens.main));
    c.addPass(new EffectPass(camera, fx.bloom, fx.tone, fx.grade));
    return c;
  }, [gl, scene, camera, fx]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  useEffect(() => () => {
    composer.removeAllPasses();
  }, [composer]);

  useFrame((_, dt) => {
    if (nopost) gl.render(scene, camera);
    else composer.render(dt);
  }, 1);

  const cam = camera as THREE.PerspectiveCamera;
  world.update(f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  const fp = focusAt(f, world);
  fx.lens.focus = Math.max(0.3, fp.sub(cam.position).dot(fwd));
  const s = shotAt(f);
  fx.lens.cInf = 10;
  gradeFor(fx.grade, s.light);

  return <primitive object={world.root} dispose={null} />;
};

type WordItem = { word: string; start: number; end: number };

function getKaraokeWords(tSec: number): { words: WordItem[]; activeIdx: number } {
  const all = wordsData.words as WordItem[];
  if (!all || all.length === 0) return { words: [], activeIdx: -1 };
  let active = 0;
  for (let i = 0; i < all.length; i++) {
    if (all[i].start <= tSec) active = i;
    else break;
  }
  const chunkStart = Math.floor(active / 3) * 3;
  return {
    words: all.slice(chunkStart, chunkStart + 3),
    activeIdx: active - chunkStart,
  };
}

export const BananasShort: React.FC = () => {
  const f = useCurrentFrame();
  const { words, activeIdx } = getKaraokeWords(f / 30);

  // Título limpo apenas na abertura (0s a 2.2s) com fade-out suave
  const titleOpacity = f < 50 ? 1 : f < 70 ? 1 - (f - 50) / 20 : 0;

  return (
    <AbsoluteFill style={{ background: "#bcd6f0", fontFamily: "'Arial Black', 'Segoe UI', sans-serif" }}>
      <Audio src={staticFile("audio/bananas_radioativas_narracao.mp3")} />

      <ThreeCanvas
        width={1080}
        height={1920}
        shadows
        gl={{
          alpha: false,
          antialias: false,
          stencil: false,
          powerPreference: "high-performance",
          toneMappingExposure: 1.0,
        }}
        camera={{ fov: 40, near: 0.15, far: 1500 }}
      >
        <Inner />
      </ThreeCanvas>

      {/* Título cinemático limpo (sem caixa pesada, só nos primeiros 2.3s) */}
      {titleOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 55,
            right: 55,
            opacity: titleOpacity,
            textAlign: "center",
            pointerEvents: "none",
            color: "#ffe066",
            fontSize: 54,
            fontWeight: 900,
            lineHeight: 1.15,
            WebkitTextStroke: "3px #1b1224",
            textShadow: "0 6px 18px rgba(0,0,0,0.65)",
          }}
        >
          POR QUE AS BANANAS SÃO RADIOATIVAS?
        </div>
      )}

      {/* Legenda estilo Shorts/TikTok: 3 palavras sem caixa, contorno nítido e destaque amarelo */}
      {words.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 310,
            left: 60,
            right: 60,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "16px",
            pointerEvents: "none",
          }}
        >
          {words.map((w, i) => {
            const isActive = i === activeIdx;
            return (
              <span
                key={`${w.start}-${i}`}
                style={{
                  color: isActive ? "#ffe066" : "#ffffff",
                  fontSize: isActive ? 64 : 58,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  WebkitTextStroke: "3.5px #140e1c",
                  textShadow: "0 6px 16px rgba(0,0,0,0.75)",
                  transform: isActive ? "scale(1.06)" : "scale(1)",
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
