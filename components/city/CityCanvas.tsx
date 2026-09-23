"use client";

import "@/lib/rafFallback";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  MAP_ROTATION,
  MAP_CENTER,
  mapViewHeight,
  cityJourney,
  landmarks,
  type LandmarkId,
  type CityCommand,
  type CityAction,
} from "@/lib/city";
import { Ground, Broadway, Traffic } from "./CityGeometry";
import { CityBuildings, CityEnvironment, CityLandmarks, CityStreetLife } from "./CityArchitecture";
import CityBillboards from "./CityBillboards";
import { CityAtmosphere, CityEffects } from "./CityAtmosphere";

const CITY_TARGET = new THREE.Vector3(-2, 8, -3);

function CameraRig({
  reduced,
  exploring,
  onCameraChange,
}: {
  reduced: boolean;
  exploring: boolean;
  onCameraChange?: (position: string) => void;
}) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const lastReport = useRef(0);
  useFrame(({ clock }) => {
    if (onCameraChange && clock.elapsedTime - lastReport.current > 0.3) {
      lastReport.current = clock.elapsedTime;
      onCameraChange(
        camera.position
          .toArray()
          .map((value) => value.toFixed(2))
          .join(","),
      );
    }
    if (exploring && cityJourney.progress > 0.62) return;
    const p = THREE.MathUtils.smoothstep(cityJourney.progress, 0, 0.88);
    const t = reduced ? (p > 0.5 ? 1 : 0) : p;
    const mapHeight = mapViewHeight(size.width / size.height);
    const mapRadius = mapHeight / (2 * Math.tan(THREE.MathUtils.degToRad(24)));
    const radius = THREE.MathUtils.lerp(
      mapRadius,
      size.width < 768 ? 54 : 49,
      t,
    );
    const centerX = THREE.MathUtils.lerp(MAP_CENTER.x, CITY_TARGET.x, t);
    const angle = THREE.MathUtils.lerp(0.006, 1.14, t);
    const azimuth = THREE.MathUtils.lerp(MAP_ROTATION, -0.02, t);
    const z = THREE.MathUtils.lerp(MAP_CENTER.z, CITY_TARGET.z, t);
    camera.position.set(
      centerX + Math.sin(azimuth) * Math.sin(angle) * radius,
      Math.cos(angle) * radius + 2,
      Math.cos(azimuth) * Math.sin(angle) * radius + z,
    );
    target.set(centerX, THREE.MathUtils.lerp(0, CITY_TARGET.y, t), z);
    camera.up
      .set(Math.sin(azimuth) * (1 - t), t, -Math.cos(azimuth) * (1 - t))
      .normalize();
    camera.lookAt(target);
  });
  return null;
}

function CityInteraction({
  enabled,
  onExplore,
  command,
  reduced,
  selected,
}: {
  enabled: boolean;
  onExplore: () => void;
  command: CityCommand;
  reduced: boolean;
  selected: LandmarkId | null;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const flight = useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
  useEffect(() => {
    if (!enabled || !selected) return;
    const landmark = landmarks.find(item => item.id === selected);
    if (!landmark) return;
    const [x,height,z] = landmark.position;
    const target = new THREE.Vector3(x,height*.48,z);
    const distance = Math.max(26,height*1.35);
    const position = target.clone().add(selected==="times-square"
      ? new THREE.Vector3(1.5,3.5,25)
      : new THREE.Vector3(12,distance*.23,distance));
    flight.current = {position,target};
  }, [selected,enabled]);
  useEffect(() => {
    if(command.action==="reset"){
      flight.current=null;
      controls.current?.target.copy(CITY_TARGET);
    }
  }, [command]);
  useFrame((_,delta)=>{
    if(!flight.current||!controls.current)return;
    const t=reduced?1:1-Math.exp(-delta*3.8);
    camera.position.lerp(flight.current.position,t);
    controls.current.target.lerp(flight.current.target,t);
    controls.current.update();
    if(camera.position.distanceTo(flight.current.position)<.015)flight.current=null;
  });
  const apply = useCallback(
    (action: CityAction) => {
      if (!enabled) return;
      if (action === "reset") return;
      onExplore();
      flight.current=null;
      const pivot = controls.current?.target ?? CITY_TARGET;
      const offset = camera.position.clone().sub(pivot);
      const sphere = new THREE.Spherical().setFromVector3(offset);
      if (action === "left") sphere.theta -= 0.12;
      if (action === "right") sphere.theta += 0.12;
      if (action === "up") sphere.phi -= 0.08;
      if (action === "down") sphere.phi += 0.08;
      if (action === "zoom-in") sphere.radius *= 0.86;
      if (action === "zoom-out") sphere.radius *= 1.16;
      sphere.radius = THREE.MathUtils.clamp(sphere.radius, 10, 70);
      sphere.phi = THREE.MathUtils.clamp(sphere.phi, 0.42, 1.42);
      camera.position
        .copy(pivot)
        .add(new THREE.Vector3().setFromSpherical(sphere));
      camera.lookAt(pivot);
      controls.current?.update();
    },
    [camera, enabled, onExplore],
  );
  useEffect(() => {
    if (command.id) apply(command.action);
  }, [command, apply]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = enabled ? 0 : -1;
    canvas.style.touchAction = enabled ? "none" : "pan-y";
    canvas.setAttribute(
      "aria-label",
      "Interactive Times Square. Drag to orbit. Use arrow keys to look around and plus or minus to zoom.",
    );
    const focusWithoutScroll = (event: PointerEvent) => {
      if (enabled) {
        event.preventDefault();
        canvas.focus({ preventScroll: true });
      }
    };
    canvas.addEventListener("pointerdown", focusWithoutScroll, {
      capture: true,
    });
    const keydown = (event: KeyboardEvent) => {
      const actions: Record<string, CityAction> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        "+": "zoom-in",
        "=": "zoom-in",
        "-": "zoom-out",
      };
      const action = actions[event.key];
      if (action && enabled) {
        event.preventDefault();
        apply(action);
      }
    };
    canvas.addEventListener("keydown", keydown);
    return () => {
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("pointerdown", focusWithoutScroll, {
        capture: true,
      });
    };
  }, [gl, enabled, apply]);
  return (
    <OrbitControls
      ref={controls}
      enabled={enabled}
      target={CITY_TARGET}
      enablePan={false}
      enableZoom={false}
      enableDamping={!reduced}
      dampingFactor={0.085}
      rotateSpeed={0.45}
      minPolarAngle={0.42}
      maxPolarAngle={1.42}
      onStart={() => { flight.current=null; onExplore(); }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.ROTATE }}
    />
  );
}

export default function CityCanvas({
  mobile = false,
  reduced = false,
  active = true,
  interactive = false,
  exploring = false,
  selected = null,
  command = { id: 0, action: "reset" },
  onExplore = () => {},
  onSelect = () => {},
  onReady = () => {},
  onFailure = () => {},
  onCameraChange,
}: {
  mobile?: boolean;
  reduced?: boolean;
  active?: boolean;
  interactive?: boolean;
  exploring?: boolean;
  selected?: LandmarkId | null;
  command?: CityCommand;
  onExplore?: () => void;
  onSelect?: (id: LandmarkId) => void;
  onReady?: () => void;
  onFailure?: () => void;
  onCameraChange?: (position: string) => void;
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
        toneMappingExposure: 1.05,
      }}
      style={{
        position: "absolute",
        inset: 0,
        touchAction: interactive ? "pan-y" : "auto",
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
      }}
      fallback={<span>Explore Manhattan using the map.</span>}
    >
      <color attach="background" args={["#050719"]} />
      <CityInteraction
        enabled={interactive && (!mobile || exploring)}
        command={command}
        onExplore={onExplore}
        reduced={reduced}
        selected={selected}
      />
      <CameraRig
        reduced={reduced}
        exploring={exploring}
        onCameraChange={onCameraChange}
      />
      <CityAtmosphere reduced={reduced} />
      <CityEnvironment />
      <Ground />
      <Broadway />
      <Suspense fallback={null}>
      <CityBuildings mobile={mobile} />
      <CityLandmarks onSelect={onSelect} selected={selected} />
      <CityBillboards
        reduced={reduced}
        onSelect={onSelect}
      />
      <Traffic reduced={reduced} />
      <CityStreetLife reduced={reduced} mobile={mobile} />
      <CityEffects mobile={mobile} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
