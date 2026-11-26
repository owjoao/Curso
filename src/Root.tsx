import React from "react";
import { Composition } from "remotion";
import { PisaShort, PISA_FRAMES } from "./videos/pisa/Pisa";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { DumontShort, DUMONT_FRAMES } from "./videos/dumont3d/Dumont";
import { BananasShort, BANANAS_FRAMES } from "./videos/bananas3d/Bananas";
// Cada desenho novo: copie templates/pisa/ (2D) ou templates/dumont3d/ (3D) para src/videos/<nome>/, renomeie e registre aqui.
export const Root: React.FC = () => (
  <>
    <Composition id="PisaShort" component={PisaShort} durationInFrames={PISA_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Dumont3D" component={DumontShort} durationInFrames={DUMONT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Bananas3D" component={BananasShort} durationInFrames={BANANAS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
