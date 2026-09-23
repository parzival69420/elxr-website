"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { bottleColors } from "@/lib/bottles";

export const bottleModels = ["arc-chamber", "prism-flask", "aether-decanter"];
/** Linear base colours and roughness for the frame metals. */
const FINISHES = {
  "Brushed titanium": { color: [0.2, 0.22, 0.25] as const, roughness: 0.16, clearcoat: 0.6 },
  "Machined edges": { color: [0.72, 0.75, 0.79] as const, roughness: 0.07, clearcoat: 0.3 },
  "Aged bronze": { color: [0.58, 0.36, 0.18] as const, roughness: 0.2, clearcoat: 0.5 },
};

export type Fluid = { time: { value: number }; tilt: { value: number } };

function labelTexture(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#080d12";
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = "#596a78";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 456, 584);
  ctx.textAlign = "center";
  ctx.fillStyle = bottleColors[index];
  ctx.font = "500 24px Satoshi, Arial";
  ctx.fillText(`FORMULA 0${index + 1}`, 256, 123);
  ctx.fillStyle = "#f3f8fa";
  ctx.font = "900 118px Satoshi, Arial";
  ctx.fillText("ELXR", 250, 315);
  ctx.fillStyle = "#8da0ad";
  ctx.font = "400 22px Satoshi, Arial";
  ctx.fillText("CREATIVE CHEMISTRY", 256, 385);
  ctx.fillStyle = bottleColors[index];
  ctx.fillRect(221, 452, 70, 3);
  ctx.fillStyle = "#9aabb6";
  ctx.font = "400 20px Satoshi, Arial";
  ctx.fillText("NEW YORK", 256, 545);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** One bottle, cloned from its GLB with the ELXR label, tinted liquid and satin metals.
 *  Glass shells are returned separately: they render with a live refraction material. */
export function useBottle(index: number) {
  const { scene } = useGLTF(`/models/${bottleModels[index % 3]}.glb`);
  const fluid = useMemo<Fluid>(() => ({ time: { value: 0 }, tilt: { value: 0 } }), []);
  const { model, shells, cap, capY, materials, texture } = useMemo(() => {
    const model = scene.clone(true),
      texture = labelTexture(index);
    const materials: THREE.MeshPhysicalMaterial[] = [],
      shells: THREE.Mesh[] = [];
    const tint = new THREE.Color(bottleColors[index]);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material as THREE.MeshPhysicalMaterial;
      if (original.name === "Optical glass") {
        shells.push(object);
        return;
      }
      const material = original.clone();
      if (object.name === "LabelSurface") {
        material.map = texture;
        material.color.set("white");
        material.emissive.set("white");
        material.emissiveMap = texture;
        material.emissiveIntensity = 0.1;
        material.roughness = 0.28;
        material.metalness = 0.18;
      } else if (original.name === "Energy") {
        material.color.copy(tint);
        material.emissive.copy(tint);
        material.emissiveIntensity = 0.7;
      } else if (original.name.startsWith("Liquid")) {
        material.color.copy(tint).lerp(new THREE.Color("white"), 0.76);
        material.attenuationColor = tint
          .clone()
          .lerp(new THREE.Color("white"), 0.18);
        material.attenuationDistance = 0.65;
        material.transmission = 0.86;
        material.thickness = 0.65;
        material.ior = 1.333;
        material.roughness = 0.028;
        material.metalness = 0;
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
        material.clearcoat = 0.4;
        material.clearcoatRoughness = 0.03;
        material.emissive.copy(tint);
        material.emissiveIntensity = 0.035;
        material.envMapIntensity = 0.8;
        object.geometry.computeBoundingBox();
        const fill = object.geometry.boundingBox!.max.y;
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uFluidTime = fluid.time;
          shader.uniforms.uFluidTilt = fluid.tilt;
          shader.uniforms.uFillLevel = { value: fill };
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              `#include <common>
            uniform float uFluidTime; uniform float uFluidTilt; uniform float uFillLevel;`,
            )
            .replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
              float surface = smoothstep(uFillLevel-.09,uFillLevel,position.y);
              transformed.y += surface*(sin(position.x*8.+uFluidTime)*cos(position.z*9.+uFluidTime*.8)*.009 + position.x*uFluidTilt);`,
            );
        };
        material.customProgramCacheKey = () => "elxr-liquid-surface-v2";
      } else if (original.name === "Ceramic inserts") {
        // Glossy black enamel: dark, but it still catches the studio strips.
        material.roughness = 0.18;
        material.clearcoat = 1;
        material.clearcoatRoughness = 0.04;
        material.envMapIntensity = 1.6;
      } else if (material.metalness > 0.5) {
        // Polished product finishes: bright enough to carry reflections, a clearcoat for the sharp highlight.
        const finish = FINISHES[original.name as keyof typeof FINISHES] ?? FINISHES["Brushed titanium"];
        material.color.setRGB(finish.color[0], finish.color[1], finish.color[2]);
        material.metalness = 1;
        material.roughness = finish.roughness;
        material.clearcoat = finish.clearcoat;
        material.clearcoatRoughness = 0.03;
        material.envMapIntensity = 2.3;
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
              "#include <roughnessmap_fragment>\nfloat grain=wearHash(floor(vWear*700.));roughnessFactor=clamp(roughnessFactor+grain*.025,.04,.8);diffuseColor.rgb*=.97+grain*.03;",
            );
        };
        material.customProgramCacheKey = () => "elxr-polished-metal-v3";
      }
      object.material = material;
      materials.push(material);
    });
    // Shell geometry is preserved from the GLB; its live material reads the shared refraction buffer.
    shells.forEach((shell) => shell.removeFromParent());
    const cap = model.getObjectByName("Stopper");
    return {
      model,
      shells,
      cap,
      capY: cap?.position.y ?? 0,
      materials,
      texture,
    };
  }, [scene, index, fluid]);
  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
      texture.dispose();
    },
    [materials, texture],
  );
  return { model, shells, cap, capY, materials, fluid };
}

bottleModels.forEach((name) => useGLTF.preload(`/models/${name}.glb`));
