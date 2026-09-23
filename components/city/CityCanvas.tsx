"use client";

import "@/lib/rafFallback";
import { Suspense, type ReactNode, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  MAP_ROTATION,
  MAP_CENTER,
  mapViewHeight,
  cityJourney,
  LOAD_ZOOM,
} from "@/lib/city";
import { Ground, Broadway, Plaza, Traffic } from "./CityGeometry";
import CentralPark from "./CentralPark";
import { CityBuildings, CityEnvironment, CityLandmarks, CityStreetLife } from "./CityArchitecture";
import CityBillboards from "./CityBillboards";
import Blueprint from "./Blueprint";
import { BoroughGlow, Chrysler, DistantLights, FloatingLights, LandmarkLights, Steam } from "./CityExtras";
import { CityAtmosphere, CityEffects } from "./CityAtmosphere";

// The resting shot: from above lower Manhattan, looking level up Broadway toward Times Square
// and Midtown. The camera sits a little above the look target, so the skyline fills the lower
// part of the frame and the headline sits over open sky.
// Pulled back and raised over Broadway so the whole Midtown cluster sits in the lower part of the
// frame with no cropped towers in the foreground. Tune the shot here.
const CITY_TARGET = new THREE.Vector3(-1.5, 16, -22);
const CITY_HEADING = -0.02;
const CITY_ANGLE = 1.1; // from straight down; lower looks down more steeply
const CITY_RADIUS = { desktop: 72, mobile: 84 };
const CITY_FOV = { desktop: 29, mobile: 40 };

// Model downloads go through three's default manager; the loading screen reads this.
THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => {
  if (total) cityJourney.load = Math.max(cityJourney.load, loaded / total);
};
const REVEAL_TILT = 0.42;
const REVEAL_TURN = 0.18;
const easeReveal = (value: number) => 1 - Math.pow(1 - value, 3);

/** Parts of the city that switch on at a point in the reveal (see Blueprint for the phases). */
function RevealAt({ from, children }: { from: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = cityJourney.reveal >= from;
  });
  return <group ref={group}>{children}</group>;
}

/** The camera is locked to the map → skyline path; visitors cannot orbit or zoom. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = THREE.MathUtils.smoothstep(cityJourney.progress, 0, 0.88);
    const t = reduced ? (p > 0.5 ? 1 : 0) : p;
    const mapHeight = mapViewHeight(size.width / size.height);
    const mapRadius = mapHeight / (2 * Math.tan(THREE.MathUtils.degToRad(24)));
    // Before the reveal finishes, the camera sits closer: the zoomed-in loading map.
    const settle = THREE.MathUtils.lerp(1 / LOAD_ZOOM, 1, easeReveal(cityJourney.reveal));
    const radius =
      THREE.MathUtils.lerp(mapRadius, size.width < 768 ? CITY_RADIUS.mobile : CITY_RADIUS.desktop, t) *
      THREE.MathUtils.lerp(settle, 1, t);
    const centerX = THREE.MathUtils.lerp(MAP_CENTER.x, CITY_TARGET.x, t);
    // The reveal tilts the flat map into an aerial and turns it slightly, so the rising city reads.
    const rise = easeReveal(cityJourney.reveal);
    const angle = THREE.MathUtils.lerp(0.006 + REVEAL_TILT * rise, CITY_ANGLE, t);
    const azimuth = THREE.MathUtils.lerp(MAP_ROTATION + REVEAL_TURN * rise, -0.02, t);
    const z = THREE.MathUtils.lerp(MAP_CENTER.z, CITY_TARGET.z, t);
    // The camera leans back toward the bottom of the screen, so the aerial reads upright.
    const heading = THREE.MathUtils.lerp(-(MAP_ROTATION + REVEAL_TURN * rise), CITY_HEADING, t);
    camera.position.set(
      centerX + Math.sin(heading) * Math.sin(angle) * radius,
      Math.cos(angle) * radius + 2,
      Math.cos(heading) * Math.sin(angle) * radius + z,
    );
    target.set(centerX, THREE.MathUtils.lerp(0, CITY_TARGET.y, t), z);
    camera.up
      .set(Math.sin(azimuth) * (1 - t), t, -Math.cos(azimuth) * (1 - t))
      .normalize();
    camera.lookAt(target);
    // A longer lens at the skyline: the city spans the full width and stays low in the frame.
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.lerp(48, size.width < 768 ? CITY_FOV.mobile : CITY_FOV.desktop, t);
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });
  return null;
}

export default function CityCanvas({
  mobile = false,
  reduced = false,
  active = true,
  onReady = () => {},
  onFailure = () => {},
}: {
  mobile?: boolean;
  reduced?: boolean;
  active?: boolean;
  onReady?: () => void;
  onFailure?: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "demand"}
      camera={{ fov: 48, near: 0.1, far: 650, position: [0, 110, 0.1] }}
      dpr={[1, mobile ? 1.25 : 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
      }}
      fallback={<span>A stylised night view of Manhattan.</span>}
    >
      <color attach="background" args={["#050719"]} />
      <CameraRig reduced={reduced} />
      <CityAtmosphere reduced={reduced} />
      <CityEnvironment />
      <Ground />
      <Suspense fallback={null}>
        {/* The blueprint extrudes, then its scan line prints the stylized buildings up to full height. */}
        <Blueprint mobile={mobile} />
        <CityBuildings mobile={mobile} />
        <CityLandmarks />
        <RevealAt from={0.42}>
          <Plaza />
          <CentralPark />
          <Broadway />
        </RevealAt>
        {/* Once the towers are printed, the lights come on. */}
        <RevealAt from={0.9}>
          <Chrysler reduced={reduced} />
          <CityBillboards reduced={reduced} />
          <Traffic reduced={reduced} />
          <CityStreetLife reduced={reduced} mobile={mobile} />
          <LandmarkLights reduced={reduced} />
          <Steam reduced={reduced} />
          <FloatingLights mobile={mobile} reduced={reduced} />
          <BoroughGlow />
          <DistantLights mobile={mobile} reduced={reduced} />
        </RevealAt>
        <CityEffects mobile={mobile} reduced={reduced} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
