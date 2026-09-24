"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cityJourney, random } from "@/lib/city";
import { styleClock } from "./cityStyle";

/** Tileable two-octave cloud noise, baked once: sampling a texture is far cheaper than
 *  per-pixel fbm across several screen-sized cloud layers. R = broad billows, G = fine detail. */
function cloudNoise(size = 128) {
  const rand = random(4077);
  const lattice = (cells: number) => Float32Array.from({ length: cells * cells }, rand);
  const sample = (grid: Float32Array, cells: number, x: number, y: number) => {
    const gx = (x / size) * cells, gy = (y / size) * cells;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (i: number, j: number) => grid[((j % cells) * cells) + (i % cells)];
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return top + (bottom - top) * sy;
  };
  const octaves = [4, 8, 16, 32, 64].map((cells) => ({ cells, grid: lattice(cells) }));
  const broadWeights = [0.55, 0.3, 0.15, 0, 0];
  const fineWeights = [0, 0.4, 0.3, 0.2, 0.1];
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let broad = 0, fine = 0;
      octaves.forEach(({ cells, grid }, i) => {
        const value = sample(grid, cells, x, y);
        broad += value * broadWeights[i];
        fine += value * fineWeights[i];
      });
      const k = (y * size + x) * 4;
      data[k] = broad * 255;
      data[k + 1] = fine * 255;
      data[k + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** One slice of a cloud layer. Slices of a layer sample the same noise, so together they read
 *  as one volume. The city lights the clouds from below: magenta nearest Times Square, violet
 *  further out, and a bright rim where a billow's edge faces the glow (the halo). */
const fragmentShader = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uDensity;
  uniform float uCoverage;
  uniform float uSlice;
  uniform float uVertical;
  uniform float uScale;
  uniform float uBase;
  uniform float uThickness;
  uniform float uNear;
  uniform float uLight;
  uniform float uSpeed;
  varying vec3 vWorld;
  varying vec2 vUv;
  float clouds(vec2 p, float t) {
    // Billows ride the wind while the fine wisps churn against it, so the clouds drift and change shape.
    t *= uSpeed;
    float broad = texture2D(uNoise, p * uScale + vec2(t * .016, t * .005) + uSlice * .11).r;
    float fine = texture2D(uNoise, p * uScale * 3.1 - vec2(t * .03, -t * .013) + uSlice * .37).g;
    return broad * .68 + fine * .32;
  }
  void main() {
    if (uOpacity < .002) discard;
    // Vertical sheets billow upward; horizontal slices spread across the ground.
    vec2 p = mix(vWorld.xz, vec2(vWorld.x, vWorld.y * 1.7 + uSlice * 40.), uVertical);
    float height = clamp((vWorld.y - uBase) / uThickness, 0., 1.);
    float n = clouds(p, uTime);
    // Sparser toward the top of a layer, so tops break into billows and the base stays full.
    float threshold = uCoverage + mix(uSlice * .2, height * .42, uVertical);
    float density = smoothstep(threshold, threshold + .24, n);
    // A second sample nudged toward the city (down, and toward midtown): where it is thinner
    // than here, this is an edge facing the glow, and it lights up.
    vec2 toCity = normalize(vec2(-2., 0.) - vWorld.xz + 1e-3);
    vec2 lightStep = mix(toCity * 2.2, vec2(0., -2.4), uVertical);
    float rim = clamp((n - clouds(p + lightStep, uTime)) * 5., 0., 1.) * density;

    float cityDistance = length(vWorld.xz - vec2(-2., -8.));
    float glow = exp(-cityDistance * .011);
    float under = 1. - height;
    vec3 magenta = vec3(.34, .05, .26);
    vec3 violet = vec3(.14, .06, .32);
    vec3 color = vec3(.022, .018, .06);
    float belly = pow(under, 1.6);
    color += mix(violet, magenta, glow) * (belly * .8 + .08) * (.3 + glow * 1.3);
    color += mix(vec3(.3, .16, .62), vec3(.95, .3, .72), glow) * rim * (.5 + glow);
    color *= uLight;

    // Soft plane edges, and thin out right in front of the lens so nothing blocks the shot.
    vec2 edge = min(vUv, 1. - vUv);
    float border = smoothstep(0., .18, edge.x) * smoothstep(0., .18, edge.y);
    float nearFade = smoothstep(uNear, uNear + 22., distance(vWorld, cameraPosition));
    float alpha = density * uDensity * uOpacity * border * nearFade;
    if (alpha < .003) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

type Layer = {
  /** Centre of the layer. */
  center: [number, number, number];
  /** Width and depth (horizontal) or width and height (vertical). */
  size: [number, number];
  slices: number;
  /** Spacing between slices: up for horizontal layers, back for vertical ones. */
  spacing: number;
  vertical: boolean;
  density: number;
  coverage: number;
  scale: number;
  near: number;
  /** How strongly the street neon lights this layer: the low banks sit right in the glow. */
  light: number;
  /** Drift speed: nearer layers move faster, so the layers slide past each other. */
  speed: number;
};

/** Back to front: the cloud sea behind the skyline, the volume round the tower bases, and
 *  wisps along the bottom of the frame. Tune placement here. */
const LAYERS: Layer[] = [
  // Banks behind the skyline, in receding sheets: they slide apart as the camera flies in.
  // Kept low, so the sky behind the headline stays clear and the glow sits behind the towers.
  { center: [0, 5, -105], size: [440, 26], slices: 4, spacing: -45, vertical: true, density: 0.4, coverage: 0.48, scale: 0.0042, near: 0, light: 1, speed: 0.6 },
  // Wisps the towers rise out of.
  { center: [-2, 2, -40], size: [150, 150], slices: 5, spacing: 1.8, vertical: false, density: 0.2, coverage: 0.52, scale: 0.0065, near: 18, light: 1.5, speed: 1 },
  // Strands drifting between the towers, low and at mid height, so the skyline rises through
  // them. Sized to the island's footprint, so they stay among the buildings and the shoreline
  // stays clear.
  { center: [-1, 7, -30], size: [30, 90], slices: 3, spacing: 1.8, vertical: false, density: 0.32, coverage: 0.46, scale: 0.02, near: 20, light: 1.8, speed: 1.2 },
  { center: [-1, 15, -34], size: [28, 80], slices: 3, spacing: 2, vertical: false, density: 0.26, coverage: 0.48, scale: 0.018, near: 20, light: 1.5, speed: 1.4 },
  // Loose wisps rolling across the bottom of the frame, below the headline.
  { center: [-2, 7, -4], size: [110, 44], slices: 3, spacing: 2.6, vertical: false, density: 0.42, coverage: 0.46, scale: 0.01, near: 20, light: 2.2, speed: 1.6 },
];

export default function CityClouds({ mobile }: { mobile: boolean }) {
  const noise = useMemo(() => cloudNoise(), []);
  useEffect(() => () => noise.dispose(), [noise]);
  const time = useMemo(() => ({ value: 0 }), []);
  const opacity = useMemo(() => ({ value: 0 }), []);
  const slices = useMemo(
    () =>
      LAYERS.flatMap((layer) => {
        const count = mobile ? Math.ceil(layer.slices / 2) : layer.slices;
        const spacing = (layer.spacing * layer.slices) / count;
        return Array.from({ length: count }, (_, i) => {
          const offset = (i - (count - 1) / 2) * spacing;
          const [x, y, z] = layer.center;
          const thickness = layer.vertical ? layer.size[1] : Math.abs(layer.spacing) * layer.slices;
          return {
            position: (layer.vertical ? [x, y, z + offset] : [x, y + offset, z]) as [number, number, number],
            rotation: (layer.vertical ? [0, 0, 0] : [-Math.PI / 2, 0, 0]) as [number, number, number],
            size: layer.size,
            uniforms: {
              uNoise: { value: noise },
              uTime: time,
              uOpacity: opacity,
              uDensity: { value: layer.density },
              uCoverage: { value: layer.coverage },
              uSlice: { value: count > 1 ? i / (count - 1) : 0 },
              uVertical: { value: layer.vertical ? 1 : 0 },
              uScale: { value: layer.scale },
              uBase: { value: layer.vertical ? y - layer.size[1] / 2 : y - thickness / 2 },
              uThickness: { value: thickness },
              uNear: { value: layer.near },
              uLight: { value: layer.light },
              uSpeed: { value: layer.speed },
            },
          };
        });
      }),
    [mobile, noise, time, opacity],
  );
  useFrame(() => {
    // They gather as the camera descends, and are fully in once it lands on the skyline.
    opacity.value = THREE.MathUtils.smoothstep(cityJourney.progress, 0.35, 0.95);
    time.value = styleClock.value;
  });
  return (
    <group>
      {slices.map(({ position, rotation, size, uniforms }, i) => (
        <mesh key={i} position={position} rotation={rotation} renderOrder={3}>
          <planeGeometry args={size} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
