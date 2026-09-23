"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { onIsland, random } from "@/lib/city";
import { stylize } from "./cityStyle";

const BASE = "/models/city/";

/** Soft round glow, shared by every beacon and crown light. */
function useGlowTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,.55)");
    g.addColorStop(0.5, "rgba(255,255,255,.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Glow({
  position,
  color,
  size,
  blink = false,
  reduced,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  blink?: boolean;
  reduced: boolean;
}) {
  const texture = useGlowTexture();
  const material = useRef<THREE.SpriteMaterial>(null);
  const sprite = useRef<THREE.Sprite>(null);
  const phase = useMemo(() => position[0] * 1.7 + position[2] * 0.3, [position]);
  useFrame(({ clock }) => {
    if (reduced || !material.current || !sprite.current) return;
    const t = clock.elapsedTime;
    if (blink) material.current.opacity = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.2), 6);
    // Crown halos swell and settle, slowly.
    else sprite.current.scale.setScalar(size * (0.85 + 0.25 * Math.sin(t * 0.8 + phase)));
  });
  return (
    <sprite ref={sprite} position={position} scale={[size, size, 1]}>
      <spriteMaterial
        ref={material}
        map={texture}
        color={color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/** Crown lights and aircraft beacons, placed from each landmark model's real bounds. */
const crowns = [
  { file: "empire-state", position: [7.5, 0, 9], crown: "#7fe0ff", crownSize: 1.3, crownDrop: 0.2 },
  { file: "one-world-trade", position: [-3, 0, 47], crown: "#c9d6ff", crownSize: 2, crownDrop: 0.12 },
  { file: "one-vanderbilt", position: [8, 0, -6], crown: "#ff6fd0", crownSize: 1.7, crownDrop: 0.08 },
] as const;

function LandmarkCrown({ item, reduced }: { item: (typeof crowns)[number]; reduced: boolean }) {
  const { scene } = useGLTF(`${BASE}${item.file}.glb`);
  const top = useMemo(() => new THREE.Box3().setFromObject(scene).max.y, [scene]);
  const [x, , z] = item.position;
  return (
    <>
      <Glow position={[x, top * (1 - item.crownDrop), z]} color={item.crown} size={item.crownSize} reduced={reduced} />
      <Glow position={[x, top + 0.1, z]} color="#ff2a2a" size={0.55} blink reduced={reduced} />
    </>
  );
}

export function LandmarkLights({ reduced }: { reduced: boolean }) {
  return (
    <>
      {crowns.map((item) => (
        <LandmarkCrown key={item.file} item={item} reduced={reduced} />
      ))}
    </>
  );
}

/** Chrysler Building: a kit tower for the shaft, then the stepped steel crown with lit triangular windows. */
export const CHRYSLER = { x: 10.4, z: -2.6, w: 1.5, h: 13.5 };

function useCrownTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = "#ffe9c2";
    // Sunburst windows: rows of narrow triangles across each face.
    for (let i = 0; i < 16; i++) {
      const x = i * 16 + 3;
      ctx.beginPath();
      ctx.moveTo(x, 58);
      ctx.lineTo(x + 5, 10);
      ctx.lineTo(x + 10, 58);
      ctx.closePath();
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function Chrysler({ reduced }: { reduced: boolean }) {
  const { scene } = useGLTF(`${BASE}architecture-kit.glb`);
  const crownTexture = useCrownTexture();
  const shaft = useMemo(() => {
    const block = scene.getObjectByName("Block_7")!.clone(true);
    const { width, depth, height } = block.userData as { width: number; depth: number; height: number };
    block.scale.set(CHRYSLER.w / width, CHRYSLER.h / height, CHRYSLER.w / depth);
    // Its own material copies, so the shaft's stylized height doesn't leak into the kit.
    block.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = stylize((mesh.material as THREE.Material).clone(), height);
    });
    return block;
  }, [scene]);
  const stages = [0.62, 0.52, 0.42, 0.32, 0.22];
  return (
    <group position={[CHRYSLER.x, 0, CHRYSLER.z]}>
      <primitive object={shaft} />
      {stages.map((radius, i) => (
        <mesh
          key={i}
          position={[0, CHRYSLER.h + 0.35 + i * 0.62, 0]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <cylinderGeometry args={[stages[i + 1] ?? 0.14, radius, 0.62, 4, 1, true]} />
          <meshStandardMaterial
            color="#9aa3ad"
            metalness={0.95}
            roughness={0.22}
            emissive="#ffe0b0"
            emissiveMap={crownTexture}
            emissiveIntensity={2.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, CHRYSLER.h + 0.35 + stages.length * 0.62 + 0.9, 0]}>
        <coneGeometry args={[0.07, 2.2, 6]} />
        <meshStandardMaterial color="#c8d0d8" metalness={1} roughness={0.2} />
      </mesh>
      <Glow position={[0, CHRYSLER.h + 2.2, 0]} color="#ffe6c0" size={1.7} reduced={reduced} />
      <Glow position={[0, CHRYSLER.h + 5.6, 0]} color="#ff2a2a" size={0.5} blink reduced={reduced} />
    </group>
  );
}

/** Across the rivers: no buildings, only the glitter of Jersey City, Brooklyn and Queens to the horizon. */
export function DistantLights({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const { geometry, uniforms } = useMemo(() => {
    const rand = random(3301);
    const count = mobile ? 2600 : 6500;
    const positions: number[] = [];
    const colors: number[] = [];
    const seeds: number[] = [];
    const warm = new THREE.Color("#ff4fbf");
    const white = new THREE.Color("#ffd6f0");
    const cool = new THREE.Color("#7fe0ff");
    let placed = 0;
    while (placed < count) {
      // Lights run along a jittered street grid, thinning out with distance.
      const street = rand() < 0.5;
      let x = (rand() - 0.5) * 420;
      let z = -230 + rand() * 400;
      if (street) x = Math.round(x / 3.2) * 3.2 + (rand() - 0.5) * 0.3;
      else z = Math.round(z / 2.6) * 2.6 + (rand() - 0.5) * 0.3;
      if (Math.abs(x) < 17.5 || onIsland(x, z)) continue;
      const far = Math.hypot(x, z);
      if (rand() < 1.15 - far / 280) {
        positions.push(x, 0.08 + rand() * (far < 60 ? 1.6 : 0.6), z);
        const r = rand();
        const c = r < 0.55 ? warm : r < 0.9 ? white : cool;
        colors.push(c.r, c.g, c.b);
        seeds.push(rand());
        placed++;
      }
    }
    // Brooklyn and Manhattan Bridges: cable lights sagging between two towers.
    for (const [ax, az, bx, bz] of [
      [7, 44, 22, 51],
      [8.5, 37, 22, 40],
    ]) {
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const sag = 3.4 - Math.sin(t * Math.PI) * 2;
        for (const side of [-0.25, 0.25]) {
          positions.push(ax + (bx - ax) * t, sag, az + (bz - az) * t + side);
          colors.push(white.r, white.g, white.b);
          seeds.push(rand());
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    return { geometry, uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } } };
  }, [mobile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl }, delta) => {
    uniforms.uPixel.value = gl.getPixelRatio();
    if (!reduced) uniforms.uTime.value += delta;
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float aSeed; uniform float uTime; uniform float uPixel;
          varying vec3 vColor; varying float vFade;
          void main(){
            vec4 view=modelViewMatrix*vec4(position,1.);
            float twinkle=.75+.25*sin(uTime*(1.5+aSeed*3.)+aSeed*40.);
            vColor=color*twinkle;
            vFade=1.-smoothstep(160.,300.,-view.z);
            gl_PointSize=clamp(140./-view.z,1.2,5.)*uPixel;
            gl_Position=projectionMatrix*view;
          }`}
        fragmentShader={`
          varying vec3 vColor; varying float vFade;
          void main(){
            float d=length(gl_PointCoord-.5);
            float a=smoothstep(.5,0.,d);
            gl_FragColor=vec4(vColor*a*vFade*2.2,1.);
          }`}
      />
    </points>
  );
}

/** Hundreds of tiny magenta lights hanging over the city: they carry the sense of scale and depth. */
export function FloatingLights({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const { geometry, uniforms } = useMemo(() => {
    const rand = random(7717);
    const count = mobile ? 450 : 1100;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 34;
      positions[i * 3 + 1] = 1 + Math.pow(rand(), 1.6) * 26;
      positions[i * 3 + 2] = -70 + rand() * 125;
      seeds[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return { geometry, uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } } };
  }, [mobile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl }, delta) => {
    uniforms.uPixel.value = gl.getPixelRatio();
    if (!reduced) uniforms.uTime.value += delta;
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float aSeed; uniform float uTime; uniform float uPixel;
          varying float vGlow; varying float vWhite;
          void main(){
            vec3 p=position;
            p.y+=sin(uTime*.35+aSeed*20.)*.35;
            p.x+=sin(uTime*.2+aSeed*11.)*.25;
            vec4 view=modelViewMatrix*vec4(p,1.);
            vGlow=(.6+.4*sin(uTime*(1.+aSeed*2.)+aSeed*30.))*(1.-smoothstep(90.,180.,-view.z));
            vWhite=step(.88,aSeed);
            gl_PointSize=clamp(70./-view.z,1.,3.5)*uPixel;
            gl_Position=projectionMatrix*view;
          }`}
        fragmentShader={`
          varying float vGlow; varying float vWhite;
          void main(){
            float d=length(gl_PointCoord-.5);
            float a=smoothstep(.5,0.,d);
            vec3 c=mix(vec3(1.,.16,.62),vec3(1.,.85,.95),vWhite);
            gl_FragColor=vec4(c*a*vGlow*1.8,1.);
          }`}
      />
    </points>
  );
}

/** The glow of the other boroughs: a warm haze on the land across the rivers, brightest near the water. */
export function BoroughGlow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -20]}>
      <planeGeometry args={[520, 460]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`}
        fragmentShader={`
          varying vec3 vWorld;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
          void main(){
            float land=smoothstep(17.,22.,abs(vWorld.x));
            float shore=exp(-(abs(vWorld.x)-18.)*.03);
            float patches=.45+.55*noise(vWorld.xz*.04)*noise(vWorld.xz*.11+3.);
            float fade=1.-smoothstep(120.,260.,length(vWorld.xz));
            vec3 c=mix(vec3(.06,.012,.05),vec3(.02,.02,.07),noise(vWorld.xz*.02));
            gl_FragColor=vec4(c*land*(.35+shore)*patches*fade*3.2,1.);
          }`}
      />
    </mesh>
  );
}

/** Steam from street vents: soft billboards that roll upward and fade. */
const vents: [number, number, number][] = [
  [-4.4, 0, -10],
  [-1, 0, 14],
  [-4.2, 0, 21],
  [2.6, 0, -12.5],
  [-8.1, 0, 3.2],
  [5.2, 0, 16],
];

export function Steam({ reduced }: { reduced: boolean }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (!reduced) uniforms.uTime.value += delta;
  });
  return (
    <>
      {vents.map((position, i) => (
        <Billboard key={i} position={[position[0], 1.3, position[2]]} lockX lockZ>
          <mesh>
            <planeGeometry args={[1.4, 2.8]} />
            <shaderMaterial
              uniforms={{ ...uniforms, uSeed: { value: i * 7.3 } }}
              transparent
              depthWrite={false}
              vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
              fragmentShader={`
                varying vec2 vUv; uniform float uTime; uniform float uSeed;
                float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
                float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
                float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=.5;}return v;}
                void main(){
                  vec2 p=vec2(vUv.x*2.,vUv.y*3.-uTime*.55+uSeed);
                  float plume=fbm(p+fbm(p*1.3)*.8);
                  float width=exp(-pow((vUv.x-.5)/(.14+vUv.y*.3),2.));
                  float fade=smoothstep(0.,.12,vUv.y)*(1.-smoothstep(.45,1.,vUv.y));
                  float a=smoothstep(.35,.8,plume)*width*fade*.55;
                  gl_FragColor=vec4(vec3(.22,.23,.25),a);
                }`}
            />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}
