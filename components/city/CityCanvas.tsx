"use client";

import "@/lib/rafFallback";
import { Suspense, type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import {
  MAP_ROTATION,
  MAP_CENTER,
  mapViewHeight,
  cityJourney,
  LOAD_ZOOM,
} from "@/lib/city";
import { Ground, Broadway, Plaza, PlazaLights, Traffic } from "./CityGeometry";
import CentralPark from "./CentralPark";
import { CityBuildings, CityEnvironment, CityLandmarks, CityStreetLife } from "./CityArchitecture";
import CityBillboards from "./CityBillboards";
import Blueprint from "./Blueprint";
import { BoroughGlow, Chrysler, DistantLights, FloatingLights, LandmarkLights, Steam } from "./CityExtras";
import { CityAtmosphere, CityEffects } from "./CityAtmosphere";
import CityClouds from "./CityClouds";

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
/** Hands the loading screen's downloads to three: GLTFLoader reads files through
 *  THREE.Cache first, so useGLTF parses these bytes without another request. */
export function primeModelCache(buffers: Map<string, ArrayBuffer>) {
  THREE.Cache.enabled = true;
  buffers.forEach((buffer, url) => THREE.Cache.add(url, buffer));
}
const REVEAL_TILT = 0.42;
const REVEAL_TURN = 0.18;
// Every camera move eases in and out: no move starts or stops at full speed.
const ease = (value: number) => THREE.MathUtils.smootherstep(value, 0, 1);
/** Longest step the intro takes in one frame. A one-off hitch (a GC pause, a late texture)
 *  then slows the shot for a moment instead of making the camera jump, while any device
 *  rendering at 15 fps or better still plays the intro in real time. */
const MAX_STEP = 1 / 15;

/** Steps the intro sequence once per rendered frame, before anything reads it. */
function IntroClock() {
  useFrame((_, delta) => cityJourney.intro?.advance(Math.min(delta, MAX_STEP)), -1);
  return null;
}

/** Calls `onDone` once the intro has finished playing. */
function IntroDone({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current && cityJourney.reveal >= 1 && !cityJourney.intro) {
      done.current = true;
      onDone();
    }
  });
  return null;
}

/** Frames every part of the city is drawn for under the loading sheet (see RevealAt). */
const WARM_FRAMES = 3;

/** Parts of the city that switch on at a point in the reveal (see Blueprint for the phases). */
function RevealAt({ from, children }: { from: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  // Hidden objects are skipped by the renderer, so their shaders, pipelines and textures would
  // otherwise be built on the frame they first appear: mid camera flight, as a visible freeze.
  // Instead they are drawn for a few real frames, through the same composer and targets as the
  // flight, while the loading sheet still covers the canvas. The reflections (CityEnvironment)
  // arrive a little later and change every lit shader, so their arrival warms everything again.
  // Culling is off while warming so parts outside the loading view are built too.
  const warm = useRef({
    frames: WARM_FRAMES,
    environment: undefined as THREE.Texture | null | undefined,
    culled: [] as THREE.Object3D[],
  });
  useFrame(({ scene }) => {
    const root = group.current;
    if (!root) return;
    const state = warm.current;
    if (state.environment !== scene.environment && cityJourney.reveal === 0) {
      state.environment = scene.environment;
      if (state.frames === WARM_FRAMES)
        root.traverse((object) => {
          if (object.frustumCulled) state.culled.push(object);
          object.frustumCulled = false;
        });
      state.frames = 0;
    } else if (state.frames < WARM_FRAMES && ++state.frames === WARM_FRAMES) {
      state.culled.forEach((object) => (object.frustumCulled = true));
      state.culled.length = 0;
    }
    root.visible = state.frames < WARM_FRAMES || cityJourney.reveal >= from;
  });
  return <group ref={group}>{children}</group>;
}

/** The camera is locked to the map → skyline path; visitors cannot orbit or zoom. */
function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree();
  const scratch = useMemo(
    // A camera, not a plain Object3D: only cameras point -Z (their view axis) at a lookAt target.
    () => ({ target: new THREE.Vector3(), rig: new THREE.PerspectiveCamera(), from: new THREE.Quaternion() }),
    [],
  );
  useFrame(() => {
    const t = reduced ? (cityJourney.progress > 0.5 ? 1 : 0) : ease(cityJourney.progress);
    const mobile = size.width < 768;
    const mapHeight = mapViewHeight(size.width / size.height);
    const mapRadius = mapHeight / (2 * Math.tan(THREE.MathUtils.degToRad(24)));
    // The reveal tilts the flat map into an aerial and turns it slightly, so the rising city reads.
    const rise = ease(cityJourney.reveal);
    // Before the reveal finishes, the camera sits closer: the zoomed-in loading map.
    const settle = THREE.MathUtils.lerp(1 / LOAD_ZOOM, 1, rise);
    const radius =
      THREE.MathUtils.lerp(mapRadius, mobile ? CITY_RADIUS.mobile : CITY_RADIUS.desktop, t) *
      THREE.MathUtils.lerp(settle, 1, t);
    const centerX = THREE.MathUtils.lerp(MAP_CENTER.x, CITY_TARGET.x, t);
    const angle = THREE.MathUtils.lerp(0.006 + REVEAL_TILT * rise, CITY_ANGLE, t);
    const z = THREE.MathUtils.lerp(MAP_CENTER.z, CITY_TARGET.z, t);
    // The camera leans back toward the bottom of the screen, so the aerial reads upright.
    const heading = THREE.MathUtils.lerp(-(MAP_ROTATION + REVEAL_TURN * rise), CITY_HEADING, t);
    camera.position.set(
      centerX + Math.sin(heading) * Math.sin(angle) * radius,
      Math.cos(angle) * radius + 2,
      Math.cos(heading) * Math.sin(angle) * radius + z,
    );
    // Orientation turns along the shortest arc between the map view and the skyline view,
    // so the long turn up Broadway never rolls or wobbles on the way.
    const { rig, target, from } = scratch;
    const azimuth = MAP_ROTATION + REVEAL_TURN * rise;
    rig.position.copy(camera.position);
    rig.up.set(Math.sin(azimuth), 0, -Math.cos(azimuth));
    rig.lookAt(target.set(MAP_CENTER.x, 0, MAP_CENTER.z));
    from.copy(rig.quaternion);
    rig.up.set(0, 1, 0);
    rig.lookAt(target.copy(CITY_TARGET));
    camera.quaternion.slerpQuaternions(from, rig.quaternion, t);
    // A longer lens at the skyline: the city spans the full width and stays low in the frame.
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.lerp(48, mobile ? CITY_FOV.mobile : CITY_FOV.desktop, t);
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
  // Quality steps down (never back up, so it can't oscillate) when the device can't hold the
  // frame rate: 2 = full (Retina resolution, 4x MSAA, contact shadows); 1 = no contact
  // shadows, 1.5x; 0 = 1x without MSAA. Phones start at 1: their screens are already dense.
  const [quality, setQuality] = useState(mobile ? 1 : 2);
  const [monitoring, setMonitoring] = useState(false);
  const [shown, setShown] = useState(false);
  const ready = useCallback(() => {
    setShown(true);
    onReady();
  }, [onReady]);
  const introDone = useCallback(() => setMonitoring(true), []);
  const maxDpr = quality === 2 ? 2 : quality === 1 ? 1.5 : 1;
  const msaa = quality === 0 ? 0 : 4;
  return (
    <Canvas
      frameloop={active ? "always" : "demand"}
      camera={{ fov: 48, near: 0.1, far: 650, position: [0, 110, 0.1] }}
      dpr={[1, maxDpr]}
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
      {/* Judged only once the intro has played: a quality drop rebuilds the post-processing
          chain, which would freeze the camera flight for a frame. */}
      {shown && !monitoring && <IntroDone onDone={introDone} />}
      {monitoring && (
        <PerformanceMonitor onDecline={() => setQuality((level) => Math.max(0, level - 1))} />
      )}
      <IntroClock />
      <CameraRig reduced={reduced} />
      <CityAtmosphere reduced={reduced} />
      <CityEnvironment />
      <Ground />
      <Suspense fallback={null}>
        {/* The blueprint extrudes, then its scan line prints the stylized buildings up to full height. */}
        <Blueprint mobile={mobile} />
        <CityBuildings mobile={mobile} />
        <CityLandmarks />
        <PlazaLights from={0.42} />
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
        <CityClouds mobile={mobile} />
        <CityEffects ao={quality === 2} msaa={msaa} reduced={reduced} onReady={ready} />
      </Suspense>
    </Canvas>
  );
}
