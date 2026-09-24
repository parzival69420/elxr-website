"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  useFBO,
} from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useBottle } from "./useBottle";
import { bottleJourney, SCENE_COUNT } from "./journey";

type Pose = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  open: number;
  glow: number;
};

const smooth = THREE.MathUtils.smoothstep;

/**
 * Each formula has its own choreography. `e` runs -1 → 0 → 1 across a bottle's scene:
 * entering, centred, leaving. The bottle is at rest at e = 0 in every case.
 */
export function poseFor(index: number, e: number): Pose {
  const enter = 1 - smooth(e, -1, -0.22); // 1 = fully out (before), 0 = arrived
  const leave = smooth(e, 0.22, 1); // 0 = still here, 1 = gone
  const hold = 1 - Math.min(1, Math.abs(e) / 0.22);
  const pose: Pose = { x: 0, y: 0, z: 0.35, rotY: e * 0.5, rotZ: 0, scale: 1.05, open: 0, glow: 0 };
  switch (index) {
    case 0: // Attention Engineering: spins in from the right, lifts away with a half turn
      pose.x = 4.6 * enter;
      pose.rotY += -Math.PI * 2 * enter + Math.PI * leave;
      pose.y = 3.6 * leave;
      pose.scale -= 0.25 * leave;
      break;
    case 1: // Content Engine: a conveyor, in from the left and out to the right
      pose.x = -5.2 * enter + 5.2 * leave;
      pose.rotZ = 0.22 * enter - 0.22 * leave;
      pose.rotY += e * 0.4;
      break;
    case 2: // Launch & Moments: rises from below, pops its stopper, launches upward
      pose.y = -4.6 * enter + 7.5 * leave * leave;
      pose.scale = 0.6 + 0.45 * (1 - enter);
      pose.open = hold;
      break;
    case 3: // Paid Amplification: small and far, amplified to full size, then through the camera
      pose.z = 0.35 - 10 * enter + 5.4 * leave;
      pose.rotY += 0.4 * enter;
      break;
    case 4: // AI Visibility: sways up into view and lights up while it's the answer
      pose.y = -4.2 * enter - 5 * leave;
      pose.rotZ = Math.sin(e * Math.PI * 2) * 0.12;
      pose.glow = hold;
      break;
    default: // Brand & Identity: turns from its back to face you, label first
      pose.x = 3.8 * enter;
      pose.rotY = Math.PI * enter + e * 0.35;
      pose.y = 3.4 * leave;
      pose.scale -= 0.2 * leave;
  }
  return pose;
}

function ScrollBottle({
  index,
  buffer,
  reduced,
  mobile,
}: {
  index: number;
  buffer: THREE.Texture;
  reduced: boolean;
  mobile: boolean;
}) {
  const { model, shells, cap, capY, materials, fluid } = useBottle(index);
  const root = useRef<THREE.Group>(null);
  const previousAngle = useRef(0);
  useFrame(({ clock }, delta) => {
    const group = root.current;
    if (!group) return;
    let e = bottleJourney.g - index - 0.5;
    // Reduced motion: each bottle simply appears at rest for its own scene.
    if (reduced) e = Math.abs(e) < 0.5 ? 0 : 2;
    group.visible = Math.abs(e) < 1;
    if (!group.visible) return;
    const pose = poseFor(index, e);
    // Phones see a taller slice of the scene, so bottles travel further to enter and leave unseen.
    const reach = mobile ? 1.8 : 1;
    group.position.set(pose.x * reach, pose.y * reach, pose.z);
    group.rotation.set(0, pose.rotY, pose.rotZ);
    group.scale.setScalar(pose.scale);
    const speed = (pose.rotY - previousAngle.current) / Math.max(delta, 0.001);
    previousAngle.current = pose.rotY;
    fluid.tilt.value = THREE.MathUtils.damp(
      fluid.tilt.value,
      reduced ? 0 : THREE.MathUtils.clamp(-speed * 0.02 + pose.rotZ * 0.2, -0.07, 0.07),
      3,
      delta,
    );
    fluid.time.value = reduced ? 0 : clock.elapsedTime * 1.1;
    if (cap) cap.position.y = capY + pose.open * 0.3;
    for (const material of materials)
      if (material.name === "Energy")
        // HDR: the filaments sit well above the bloom threshold, so they glow through the liquid.
        material.emissiveIntensity = 2.2 + pose.glow * 1.6;
  });
  return (
    <group ref={root} visible={false}>
      <primitive object={model} />
      {shells.map((shell) => (
        <mesh
          key={shell.uuid}
          geometry={shell.geometry}
          userData={{ refractionShell: true }}
          renderOrder={5}
        >
          <MeshTransmissionMaterial
            buffer={buffer}
            resolution={mobile ? 256 : 512}
            samples={mobile ? 4 : 6}
            transmission={1}
            thickness={0.12}
            ior={1.46}
            roughness={0.012}
            chromaticAberration={0.012}
            anisotropicBlur={0.02}
            distortion={0.015}
            distortionScale={0.35}
            temporalDistortion={0}
            color="#f4fbff"
            attenuationColor="#deeff5"
            attenuationDistance={5}
            clearcoat={1}
            clearcoatRoughness={0.015}
            envMapIntensity={1.7}
            transparent={false}
            opacity={1}
            depthWrite
          />
        </mesh>
      ))}
    </group>
  );
}

/** Glass refracts what's behind it: render the scene without the shells into a buffer first. */
function Bottles({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const { gl, scene, camera, size } = useThree();
  // Refraction buffer at display resolution, so what's seen through the glass stays crisp.
  const scale = Math.min(1, (mobile ? 800 : 1600) / size.width);
  const buffer = useFBO(
    Math.max(128, Math.round(size.width * scale)),
    Math.max(128, Math.round(size.height * scale)),
    { type: THREE.HalfFloatType, depthBuffer: true },
  );
  const hidden = useMemo<THREE.Object3D[]>(() => [], []);
  // The canvas is transparent, so give the glass the page's split panels to refract, not black.
  const backdrop = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = mobile ? "#0d0d10" : "#000000";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = "#0d0d10";
    ctx.fillRect(1, 0, 1, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }, [mobile]);
  useEffect(() => () => backdrop.dispose(), [backdrop]);
  useFrame(() => {
    hidden.length = 0;
    scene.traverse((object) => {
      if (object.userData.refractionShell && object.visible) {
        hidden.push(object);
        object.visible = false;
      }
    });
    const target = gl.getRenderTarget(),
      tone = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    scene.background = backdrop;
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(target);
    scene.background = null;
    gl.toneMapping = tone;
    hidden.forEach((object) => {
      object.visible = true;
    });
  }, 0.5);
  return (
    <>
      {Array.from({ length: SCENE_COUNT }, (_, index) => (
        <ScrollBottle
          key={index}
          index={index}
          buffer={buffer.texture}
          reduced={reduced}
          mobile={mobile}
        />
      ))}
    </>
  );
}

/** Bloom on the energy cores and the glowing liquid; the canvas stays transparent so the page's panels show through. */
function Effects({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    // Multisampled, so edges stay anti-aliased through the bloom pass.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: 4,
    });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.45, 1.3));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, size, gl]);
  useEffect(
    () => () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
    [composer],
  );
  const frames = useRef(0);
  useFrame(() => {
    composer.render();
    if (++frames.current === 2) onReady();
  }, 1);
  return null;
}

/**
 * Compile every material before the first real frame. The bottles are hidden
 * until their scene scrolls in, and three only compiles what's visible, so
 * show everything for the compile, then restore. compileAsync uses the
 * browser's parallel shader compile where it exists, keeping the main thread
 * free while the page is still being read above.
 */
function Warmup() {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    let cancelled = false;
    const hidden: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (!object.visible) {
        hidden.push(object);
        object.visible = true;
      }
    });
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => {
        hidden.forEach((object) => {
          object.visible = false;
        });
        if (!cancelled) invalidate();
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, invalidate]);
  return null;
}

function ContextWatch({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onFailure);
    return () => canvas.removeEventListener("webglcontextlost", onFailure);
  }, [gl, onFailure]);
  return null;
}

export default function BottleScenesCanvas({
  reduced,
  mobile,
  active,
  onReady,
  onFailure,
}: {
  reduced: boolean;
  mobile: boolean;
  active: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <Canvas
      camera={{ fov: 34, position: [0, 1.9, mobile ? 17 : 9.2] }}
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "demand"}
      gl={{
        alpha: true,
        // The composer renders into its own multisampled target; canvas MSAA would be wasted fill.
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.18,
      }}
      onCreated={({ camera, gl }) => {
        // On phones the bottle sits in the upper half, above the copy.
        camera.lookAt(0, mobile ? 0.1 : 1.55, 0);
        gl.setClearColor(0x000000, 0);
        gl.domElement.setAttribute("aria-hidden", "true");
        gl.domElement.style.pointerEvents = "none";
      }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 6, 4]} intensity={1.8} color="#f2f7ff" />
      <directionalLight position={[-4, 3, -2]} intensity={1.4} color="#67caff" />
      <spotLight position={[0, 7, 2.5]} angle={0.45} penumbra={0.9} intensity={40} color="#ffffff" />
      {/* A product studio: tall strip softboxes either side give the metal its long, crisp highlights. */}
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#05070b"]} />
        <Lightformer form="rect" intensity={4} position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={9} position={[-3.2, 2, 2.4]} rotation={[0, 0.9, 0]} scale={[0.35, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={9} position={[3.2, 2, 2.4]} rotation={[0, -0.9, 0]} scale={[0.35, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={4} position={[-2, 2.5, -3]} rotation={[0, 2.6, 0]} scale={[0.6, 7, 1]} color="#b9ddeb" />
        <Lightformer form="rect" intensity={4} position={[2.4, 2.5, -3]} rotation={[0, -2.6, 0]} scale={[0.6, 7, 1]} color="#ffe2c4" />
        <Lightformer form="ring" intensity={3} position={[0, 2.2, 5]} scale={1.6} color="#ffffff" />
        <Lightformer form="rect" intensity={1.2} position={[0, -2, 3]} rotation={[-Math.PI / 3, 0, 0]} scale={[8, 2, 1]} color="#8fa2c4" />
      </Environment>
      {/* Grounds each bottle on the page; fades as a bottle flies away from the floor. */}
      <ContactShadows
        position={[0, 0.002, 0.35]}
        scale={4.2}
        far={1.6}
        blur={1.8}
        opacity={1}
        resolution={256}
        color="#000000"
      />
      <Suspense fallback={null}>
        <Bottles reduced={reduced} mobile={mobile} />
        <Effects onReady={onReady} />
        <Warmup />
      </Suspense>
      <ContextWatch onFailure={onFailure} />
    </Canvas>
  );
}
