"use client";

import "@/lib/rafFallback";
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pourProgress } from "@/lib/pour";

/* ------------------------------------------------------------------ */
/* Tunables — the knobs to turn if the skyline or framerate needs work */
/* ------------------------------------------------------------------ */
const GRID = 26; // cells per side (desktop)
const GRID_MOBILE = 16; // reduced instance count under 768px
const CELL = 1.0; // world units per cell
const STREET_EVERY = 4; // every Nth row/col is a street (a gap, not a mesh)
const EMPTY_CHANCE = 0.12; // some lots stay vacant so it reads as a city
const SEED = 20260902; // skyline is identical on every reload

/* Seeded PRNG so the skyline is repeatable across reloads */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------- Buildings ---------------------- */

const buildingVertex = /* glsl */ `
  attribute float aHeight;
  attribute float aRand;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vRand;
  void main() {
    vUv = uv;
    vHeight = aHeight;
    vRand = aRand;
    vNormal = normalize((instanceMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

/* Windows are a shader pattern, not meshes (section 5). Each side face gets a
   grid of emissive windows; a hash decides which are lit. Roofs stay dark. */
const buildingFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vHeight;
  varying float vRand;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 facade = vec3(0.16, 0.12, 0.24);

    // simple isometric key light
    float shade = 0.45 + 0.55 * clamp(dot(vNormal, normalize(vec3(0.65, 0.75, 0.25))), 0.0, 1.0);

    if (vNormal.y > 0.9) {
      // roof
      gl_FragColor = vec4(facade * 1.35, 1.0);
      return;
    }

    // window grid: 3 columns, floors scale with building height
    float floors = max(2.0, floor(vHeight * 4.0));
    vec2 cell = vec2(floor(vUv.x * 3.0), floor(vUv.y * floors));
    vec2 inCell = fract(vec2(vUv.x * 3.0, vUv.y * floors));

    float isWindow = step(0.25, inCell.x) * step(inCell.x, 0.75)
                   * step(0.3, inCell.y) * step(inCell.y, 0.72);
    float litUp = step(0.55, hash(cell + vRand * 100.0));

    // warm butter glow with the occasional lavender window
    vec3 warm = vec3(0.95, 0.87, 0.63);
    vec3 cool = vec3(0.65, 0.55, 0.98);
    vec3 windowColor = mix(warm, cool, step(0.8, hash(cell.yx + vRand * 57.0)));

    vec3 color = facade * shade + isWindow * litUp * windowColor * 0.9;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function Buildings({ grid }: { grid: number }) {
  const { geometry, material, count, matrices } = useMemo(() => {
    const rand = mulberry32(SEED);
    const half = (grid * CELL) / 2;
    const mats: THREE.Matrix4[] = [];
    const hts: number[] = [];
    const rds: number[] = [];
    const m = new THREE.Matrix4();

    for (let ix = 0; ix < grid; ix++) {
      for (let iz = 0; iz < grid; iz++) {
        // streets are gaps in the grid, not meshes
        if (ix % STREET_EVERY === STREET_EVERY - 1) continue;
        if (iz % STREET_EVERY === STREET_EVERY - 1) continue;
        if (rand() < EMPTY_CHANCE) continue;

        const x = ix * CELL - half + CELL / 2;
        const z = iz * CELL - half + CELL / 2;

        const distToCenter = Math.hypot(x, z);
        let h = 0.4 + rand() * 1.6;
        // a handful of taller landmark blocks near the center
        if (distToCenter < grid * 0.14 && rand() < 0.35) {
          h = 2.5 + rand() * 2.5;
        } else if (distToCenter < grid * 0.3) {
          h += rand() * 1.2;
        }

        const w = CELL * (0.62 + rand() * 0.2);
        m.makeScale(w, h, w);
        m.setPosition(x, h / 2, z);
        mats.push(m.clone());
        hts.push(h);
        rds.push(rand());
      }
    }

    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.setAttribute(
      "aHeight",
      new THREE.InstancedBufferAttribute(new Float32Array(hts), 1),
    );
    geo.setAttribute(
      "aRand",
      new THREE.InstancedBufferAttribute(new Float32Array(rds), 1),
    );

    const mat = new THREE.ShaderMaterial({
      vertexShader: buildingVertex,
      fragmentShader: buildingFragment,
    });

    return {
      geometry: geo,
      material: mat,
      count: mats.length,
      matrices: mats,
    };
  }, [grid]);

  return (
    <instancedMesh
      ref={(mesh) => {
        if (!mesh) return;
        matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat));
        mesh.instanceMatrix.needsUpdate = true;
      }}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

/* ---------------------- Ground with the liquid spread ---------------------- */

const groundFragment = /* glsl */ `
  varying vec2 vWorld;
  uniform float uRadius;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec3 ground = vec3(0.055, 0.04, 0.08);
    vec3 liquid = vec3(0.44, 0.22, 0.88);
    vec3 liquidDeep = vec3(0.24, 0.09, 0.55);

    float d = length(vWorld);
    // wobbly edge so the spread reads as liquid, not a spotlight
    float edge = d + noise(vWorld * 1.6) * 1.4;
    float inside = 1.0 - smoothstep(uRadius - 1.2, uRadius + 0.4, edge);

    vec3 liquidColor = mix(liquidDeep, liquid, noise(vWorld * 0.7) * 0.8);
    // faint sheen ring right at the leading edge
    float rim = smoothstep(uRadius - 1.6, uRadius - 0.2, edge) * inside;
    liquidColor += rim * vec3(0.35, 0.25, 0.5);

    vec3 color = mix(ground, liquidColor, inside);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const groundVertex = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

function Ground({ maxRadius }: { maxRadius: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (!matRef.current) return;
    // spread begins once the pour recedes (progress > 0.5)
    const p = THREE.MathUtils.clamp((pourProgress.value - 0.5) * 2, 0, 1);
    matRef.current.uniforms.uRadius.value = p * maxRadius;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[120, 120]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={groundVertex}
        fragmentShader={groundFragment}
        uniforms={{ uRadius: { value: 0 } }}
      />
    </mesh>
  );
}

/* ------------- Fullscreen pour quad (technique 2, same WebGL context) ------------- */

const pourVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* The pour shader — a screen-space quad with its own
   tiny vertex stage so the scene camera is irrelevant. Phase A (0→0.5):
   opaque dark hides the city while purple liquid rises. Phase B (0.5→1):
   the liquid line falls away, revealing the city above it. */
const pourFragReal = /* glsl */ `
  precision highp float;
  uniform float uProgress;
  uniform vec2 uRes;

  vec3 PURPLE = vec3(0.44, 0.22, 0.88);
  vec3 DEEP = vec3(0.26, 0.10, 0.58);
  vec3 BASE = vec3(0.043, 0.027, 0.063);

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float p = uProgress;

    float wob = (noise(vec2(uv.x * 6.0, p * 5.0)) - 0.5) * 0.14
              + (noise(vec2(uv.x * 18.0, p * 9.0)) - 0.5) * 0.05;

    vec3 color;
    float alpha;

    if (p < 0.5) {
      // flood: liquid rises over the dark base
      float line = p * 2.0 * 1.25 - 0.06 + wob;
      float inLiquid = smoothstep(line, line - 0.015, uv.y);
      vec3 liq = mix(DEEP, PURPLE, noise(uv * 5.0 + p * 3.0) * 0.9);
      color = mix(BASE, liq, inLiquid);
      alpha = 1.0;
    } else {
      // recede: the line falls, city visible above it
      float t = (p - 0.5) * 2.0;
      float line = (1.0 - t) * 1.25 - 0.12 + wob;
      float inLiquid = smoothstep(line, line - 0.015, uv.y);
      vec3 liq = mix(DEEP, PURPLE, noise(uv * 5.0 + p * 3.0) * 0.9);
      color = liq;
      alpha = inLiquid;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

function PourQuad() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uProgress.value = pourProgress.value;
    matRef.current.uniforms.uRes.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );
  });
  return (
    <mesh frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={pourVertex}
        fragmentShader={pourFragReal}
        transparent
        depthTest={false}
        depthWrite={false}
        uniforms={{
          uProgress: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
        }}
      />
    </mesh>
  );
}

/* ---------------------- Camera: locked isometric ---------------------- */

function IsoCamera() {
  const { camera, size } = useThree();
  useMemo(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.position.set(20, 20, 20);
    cam.lookAt(0, 1.5, 0);
    // frame roughly the same slice of city at any viewport width
    cam.zoom = Math.max(38, Math.min(64, size.width / 22));
    cam.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

/* ---------------------- Scene ---------------------- */

export default function CityCanvas({
  mobile,
  withPour,
}: {
  mobile: boolean;
  withPour: boolean;
}) {
  const grid = mobile ? GRID_MOBILE : GRID;
  return (
    <Canvas
      orthographic
      camera={{ near: -100, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <color attach="background" args={["#0B0710"]} />
      <IsoCamera />
      <Buildings grid={grid} />
      <Ground maxRadius={grid * 0.75} />
      {withPour && <PourQuad />}
    </Canvas>
  );
}
