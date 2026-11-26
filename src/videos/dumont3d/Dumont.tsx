// "O homem que inventou o avião foi barrado no aeroporto" — 20 s, bonecos em 3D (23/11).
// Mesma cadeia de acabamento da Torre de Pisa: contorno -> lente (pré + principal) -> [bloom, tone map NEUTRAL, cor].
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../pisa/ink";
import { LensBlur } from "../pisa/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../pisa/grade";
import { DumontWorld, TOTAL, FLASHES, shotAt, focusAt, warpF } from "./scene";

export const DUMONT_FRAMES = TOTAL;

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = warpF(useCurrentFrame());
  const { camera, scene } = useThree();
  const world = useMemo(() => new DumontWorld(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const gl = useThree((st) => st.gl);
  const size = useThree((st) => st.size);
  const nopost = (getInputProps() as { nopost?: boolean }).nopost;
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(fx.ink);
    c.addPass(new EffectPass(camera, fx.lens.pre));
    c.addPass(new EffectPass(camera, fx.lens.main));
    c.addPass(new EffectPass(camera, fx.bloom, fx.tone, fx.grade));
    return c;
  }, [gl, scene, camera, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size]);
  useEffect(() => () => { composer.removeAllPasses(); }, [composer]);
  useFrame((_, dt) => { if (nopost) gl.render(scene, camera); else composer.render(dt); }, 1);
  const cam = camera as THREE.PerspectiveCamera;
  world.update(f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  const fp = focusAt(f, world);
  fx.lens.focus = Math.max(0.3, fp.sub(cam.position).dot(fwd));
  const s = shotAt(f);
  fx.lens.cInf = s.id === 5 && f / 30 < 16.88 ? 4 : s.id === 1 ? 10 : 12;
  gradeFor(fx.grade, s.light);
  return <primitive object={world.root} dispose={null} />;
};

export const DumontShort: React.FC = () => {
  const f = useCurrentFrame();
  const flash = FLASHES.reduce((a, F) => (f >= F && f < F + 4 ? [1, 0.7, 0.4, 0.15][f - F] : a), 0);
  return (
    <AbsoluteFill style={{ background: "#bcd6f0" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ alpha: false, antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
        camera={{ fov: 40, near: 0.15, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};
