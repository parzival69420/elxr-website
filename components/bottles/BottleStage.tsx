"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { bottleColors } from "@/lib/bottles";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const models = ["arc-chamber", "prism-flask", "aether-decanter"];
const bottleOffset = (index: number, active: number) =>
  ((index - active + 9) % 6) - 3;

function labelTexture(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = index % 3 === 1 ? "#1b0d12" : "#071017";
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = bottleColors[index];
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, 460, 588);
  ctx.strokeRect(36, 36, 440, 568);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e5faff";
  ctx.font = "500 24px Satoshi, Arial";
  ctx.fillText("ELXR LABORATORIES", 256, 105);
  ctx.font = "900 100px Satoshi, Arial";
  ctx.fillText("ELXR", 256, 280);
  ctx.fillStyle = bottleColors[index];
  ctx.font = "400 29px Satoshi, Arial";
  ctx.fillText(`FORMULA / 0${index + 1}`, 256, 349);
  ctx.font = "500 19px Satoshi, Arial";
  ctx.fillText("CONCENTRATED CREATIVE ENERGY", 256, 476);
  ctx.fillText("NEW YORK • MIXED TO ORDER", 256, 512);
  ctx.beginPath();
  ctx.moveTo(84, 401);
  ctx.lineTo(428, 401);
  ctx.stroke();
  for (let i = 0; i < 35; i++) ctx.fillRect(102 + i * 9, 555, 2 + (i % 3), 25);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function BottleModel({
  index,
  active,
  open,
  hovered,
  rotation,
  reduced,
  onSelect,
  onHover,
  onReady,
}: {
  index: number;
  active: number;
  open: boolean;
  hovered: number | null;
  rotation: React.MutableRefObject<number>;
  reduced: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onReady: () => void;
}) {
  const { scene } = useGLTF(`/models/${models[index % 3]}.glb`);
  const group = useRef<THREE.Group>(null);
  const { model, cap, capY, materials, texture } = useMemo(() => {
    const model = scene.clone(true);
    const texture = labelTexture(index);
    const materials: THREE.Material[] = [];
    const tint = new THREE.Color(bottleColors[index]);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material as THREE.MeshStandardMaterial;
      const material = original.clone() as THREE.MeshPhysicalMaterial;
      if (object.name === "LabelSurface") {
        material.map = texture;
        material.color.set("#ffffff");
        material.emissive.set(
          index % 3 === 1 ? "#ffad66" : bottleColors[index],
        );
        material.emissiveMap = texture;
        material.emissiveIntensity = index % 3 === 1 ? 0.7 : 0.18;
        material.roughness = 0.36;
        material.metalness = 0.1;
      } else if (original.name === "Energy") {
        material.color.copy(tint);
        material.emissive.copy(tint);
        material.emissiveIntensity = 1.7;
      } else if (original.name === "Liquid") {
        material.color.copy(tint).multiplyScalar(0.28);
        material.emissive.copy(tint);
        material.emissiveIntensity = 0.2;
        material.opacity = 0.38;
        material.depthWrite = false;
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vFluid;",
            )
            .replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\nvFluid = position;",
            );
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              `#include <common>
            varying vec3 vFluid;
            float plasma(vec3 p) {
              float f = sin(p.x*12.+sin(p.y*17.))*sin(p.z*13.+sin(p.y*11.));
              f += .5*sin(p.x*29.+p.y*21.+sin(p.z*19.));
              return pow(max(0.,1.-abs(f)*5.),6.);
            }`,
            )
            .replace(
              "#include <emissivemap_fragment>",
              "#include <emissivemap_fragment>\nfloat electric = plasma(vFluid); totalEmissiveRadiance *= .12 + electric * 2.4; diffuseColor.rgb *= .5 + electric * .5;",
            );
        };
        material.customProgramCacheKey = () => "elxr-liquid-v1";
      } else if (original.name === "Optical glass") {
        material.color.copy(tint).lerp(new THREE.Color("#3e5665"), 0.78);
        material.envMapIntensity = 0.4;
        material.opacity = 0.5;
        material.transmission = 0.92;
        material.thickness = 0.2;
        material.depthWrite = false;
        material.roughness = 0.085;
      } else if (material.metalness > 0.5) {
        material.envMapIntensity = 1.5;
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vWear;",
            )
            .replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\nvWear=position;",
            );
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vWear;\nfloat wearHash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,43.24)))*43758.5453);}",
            )
            .replace(
              "#include <roughnessmap_fragment>",
              "#include <roughnessmap_fragment>\nfloat grain=wearHash(floor(vWear*700.));roughnessFactor=clamp(roughnessFactor+grain*.14,.12,.8);diffuseColor.rgb*=.86+grain*.14;",
            );
        };
        material.customProgramCacheKey = () => "elxr-brushed-metal-v1";
      }
      object.material = material;
      materials.push(material);
    });
    const cap = model.getObjectByName("Stopper");
    return { model, cap, capY: cap?.position.y ?? 0, materials, texture };
  }, [scene, index]);
  useEffect(() => {
    onReady();
    return () => {
      materials.forEach((material) => material.dispose());
      texture.dispose();
    };
  }, [materials, texture, onReady]);
  useFrame(({ clock, pointer }, delta) => {
    const root = group.current;
    if (!root) return;
    const selected = index === active,
      over = hovered === index;
    const targetX = bottleOffset(index, active) * 2.55;
    root.position.x = reduced
      ? targetX
      : THREE.MathUtils.damp(root.position.x, targetX, 7, delta);
    root.position.y = THREE.MathUtils.damp(
      root.position.y,
      selected ? 0.06 : 0,
      7,
      delta,
    );
    root.position.z = THREE.MathUtils.damp(
      root.position.z,
      selected ? 0.4 : -0.15,
      7,
      delta,
    );
    const scale = selected ? 1 : 0.9;
    root.scale.setScalar(
      reduced ? scale : THREE.MathUtils.damp(root.scale.x, scale, 8, delta),
    );
    const angle = selected
      ? rotation.current + (over && !reduced ? pointer.x * 0.12 : 0)
      : Math.sign(bottleOffset(index, active)) * -0.18;
    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, angle, 7, delta);
    root.rotation.z = THREE.MathUtils.damp(
      root.rotation.z,
      over && !reduced ? pointer.x * -0.025 : 0,
      6,
      delta,
    );
    if (cap) {
      const target =
        capY + (selected && open ? 0.36 : over && !reduced ? 0.07 : 0);
      cap.position.y = THREE.MathUtils.damp(
        cap.position.y,
        target,
        reduced ? 100 : 7,
        delta,
      );
      cap.rotation.y = selected && open ? 0.35 : 0;
    }
    for (const mat of materials) {
      const material = mat as THREE.MeshStandardMaterial;
      if (material.name === "Energy")
        material.emissiveIntensity =
          (selected ? 2.4 : 1.65) +
          (selected && open ? 0.9 : 0) +
          (reduced ? 0 : Math.sin(clock.elapsedTime * 1.5 + index) * 0.12);
      if (material.name === "Liquid")
        material.emissiveIntensity = selected && open ? 1.1 : 0.6;
    }
  });
  return (
    <group
      ref={group}
      position={[
        bottleOffset(index, active) * 2.55,
        0,
        index === active ? 0.4 : -0.15,
      ]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(index);
      }}
      onPointerOut={() => onHover(null)}
    >
      <primitive object={model} />
    </group>
  );
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

function Effects() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.4, 1.1));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  useEffect(
    () => () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
    [composer],
  );
  useFrame(() => {
    composer.render();
  }, 1);
  return null;
}

export default function BottleStage({
  active,
  open,
  hovered,
  rotation,
  reduced,
  mobile,
  inView,
  onSelect,
  onHover,
  onReady,
  onFailure,
}: {
  active: number;
  open: boolean;
  hovered: number | null;
  rotation: React.MutableRefObject<number>;
  reduced: boolean;
  mobile: boolean;
  inView: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <Canvas
      camera={{ fov: 34, position: [0, 1.8, mobile ? 7.6 : 7.1] }}
      dpr={[1, mobile ? 1.25 : 1.5]}
      frameloop={inView ? "always" : "demand"}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.7, 0);
        gl.domElement.setAttribute(
          "aria-label",
          "Interactive 3D service bottles. Drag horizontally to rotate the selected bottle.",
        );
        gl.domElement.style.touchAction = "pan-y";
      }}
    >
      <color attach="background" args={["#030508"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.7} color="#d6efff" />
      <directionalLight position={[-4, 3, -2]} intensity={2} color="#67caff" />
      <pointLight position={[0, 3, 3]} intensity={8} color="#fae6bc" />
      <Environment resolution={128}>
        <Lightformer intensity={4} position={[0, 5, -4]} scale={[8, 3, 1]} />
        <Lightformer
          intensity={5}
          position={[-4, 2, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[2, 6, 1]}
          color="#a4dcff"
        />
        <Lightformer
          intensity={4}
          position={[4, 3, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1, 6, 1]}
          color="#fff0d4"
        />
        <Lightformer intensity={2} position={[0, 2, 5]} scale={[0.4, 4, 1]} />
      </Environment>
      <Suspense fallback={null}>
        {Array.from(
          { length: 6 },
          (_, index) =>
            Math.abs(bottleOffset(index, active)) <= 1 && (
              <BottleModel
                key={index}
                index={index}
                active={active}
                open={open}
                hovered={hovered}
                rotation={rotation}
                reduced={reduced}
                onSelect={onSelect}
                onHover={onHover}
                onReady={onReady}
              />
            ),
        )}
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
        <planeGeometry args={[30, 18]} />
        <meshBasicMaterial color="#030508" />
      </mesh>
      <ContextWatch onFailure={onFailure} />
      <Effects />
    </Canvas>
  );
}
