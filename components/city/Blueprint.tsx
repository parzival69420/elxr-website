"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { cityJourney } from "@/lib/city";
import { BASE, buildingPlacements, models } from "./CityArchitecture";
import { CHRYSLER } from "./CityExtras";
import { scanLine } from "./cityStyle";

/** Tallest point the scan line has to clear before the city counts as built. */
const SCAN_TOP = 44;

/** The reveal in two overlapping phases, both 0 → 1:
 *  `build` extrudes the wireframe out of the flat map, radiating from Times Square;
 *  `scan` sweeps a line up the towers, turning wireframe into the solid city behind it. */
export function revealPhases(reveal: number) {
  const build = THREE.MathUtils.clamp(reveal / 0.5, 0, 1);
  const scan = THREE.MathUtils.clamp((reveal - 0.42) / 0.58, 0, 1);
  return { build, scan };
}

const vertexShader = /* glsl */ `
  uniform float uBuild;
  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vWorld;
  void main() {
    vec3 origin = instanceMatrix[3].xyz;
    vSize = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    // Buildings nearest Times Square extrude first; the wave rolls out to both ends of the island.
    float delay = clamp(length(origin.xz - vec2(-2., 0.)) / 70., 0., 1.) * .55;
    float grow = smoothstep(delay, delay + .45, uBuild);
    // vLocal stays in the unit box (0..1 up), so roofs keep their edges while the box grows.
    vLocal = position;
    vec3 p = position;
    p.y *= grow;
    vSize.y *= max(grow, .001);
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uScan;
  uniform float uFade;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vWorld;
  void main() {
    // Distance to the nearest box edge in world units: on each face, the smaller of its two in-plane gaps.
    vec3 gap = vec3(.5 - abs(vLocal.x), min(vLocal.y, 1. - vLocal.y), .5 - abs(vLocal.z)) * vSize;
    float lo = min(gap.x, min(gap.y, gap.z));
    float hi = max(gap.x, max(gap.y, gap.z));
    float edgeDistance = gap.x + gap.y + gap.z - lo - hi;
    // Capped, or faces seen edge-on smear their lines across the whole face.
    float px = min(fwidth(edgeDistance), .04);
    float edge = 1. - smoothstep(.02, .02 + px * 1.5, edgeDistance);
    // Floor lines every storey, fainter than the frame.
    float toFloor = (.5 - abs(fract(vWorld.y / .8) - .5)) * .8;
    float fw = fwidth(vWorld.y);
    // Faded out where storeys get finer than a few pixels apart, so distant towers don't shimmer.
    float floors = (1. - smoothstep(.0, min(fw, .03) * 1.2, toFloor)) * .12 * (1. - smoothstep(.02, .05, fw));
    floors *= smoothstep(.0, .05, gap.y); // walls only, never roofs
    float line = max(edge * .6, floors);
    // The scan line: a hot band where wireframe is turning solid; below it the wireframe dies away.
    float band = exp(-abs(vWorld.y - uScan) * 8.);
    float below = smoothstep(uScan + .2, uScan - .8, vWorld.y);
    float alpha = line * (1. - below) + band * edge * .8 + band * .06;
    gl_FragColor = vec4(mix(uColor, uAccent, clamp(band * 1.6, 0., 1.)), alpha * uFade);
  }
`;

/** Wireframe massing for every building, in blueprint ink: the drawing the city is built from. */
export default function Blueprint({ mobile }: { mobile: boolean }) {
  const { scene: kit } = useGLTF(`${BASE}architecture-kit.glb`);
  // One call per landmark (a fixed list, so hook order is stable); these hit useGLTF's cache.
  const landmarks = models.map((model) => useGLTF(`${BASE}${model.file}.glb`)); // eslint-disable-line react-hooks/rules-of-hooks
  const mesh = useRef<THREE.InstancedMesh>(null);

  const boxes = useMemo(() => {
    const list = buildingPlacements(kit, mobile).map(({ x, z, w, d, h }) => ({ x, z, w, d, h }));
    // Landmarks have hand-built models: take their footprint and height from the geometry.
    landmarks.forEach(({ scene }, i) => {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const [x, , z] = models[i].position;
      list.push({ x: x + (box.min.x + box.max.x) / 2, z: z + (box.min.z + box.max.z) / 2, w: size.x, d: size.z, h: box.max.y });
    });
    list.push({ x: CHRYSLER.x, z: CHRYSLER.z, w: CHRYSLER.w, d: CHRYSLER.w, h: CHRYSLER.h });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit, mobile, ...landmarks.map(({ scene }) => scene)]);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const uniforms = useMemo(
    () => ({
      uBuild: { value: 0 },
      uScan: { value: -1 },
      uFade: { value: 1 },
      // The 2D sheet's ink (--bp-ink) and amber accent (--neon), so the drawing reads as one.
      uColor: { value: new THREE.Color("#c4deff") },
      uAccent: { value: new THREE.Color("#ffa41b") },
    }),
    [],
  );

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    boxes.forEach(({ x, z, w, d, h }, i) => {
      matrix.makeScale(w, h, d).setPosition(x, 0, z);
      mesh.current?.setMatrixAt(i, matrix);
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.computeBoundingSphere();
    }
  }, [boxes]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const { build, scan } = revealPhases(cityJourney.reveal);
    const height = scan <= 0 ? -1 : scan >= 1 ? 1e4 : -0.5 + Math.pow(scan, 1.15) * SCAN_TOP;
    // The solid city and the wireframe read the same scan height, so the hand-off is seamless.
    scanLine.value = height;
    uniforms.uBuild.value = build;
    uniforms.uScan.value = height;
    uniforms.uFade.value = 1 - THREE.MathUtils.smoothstep(scan, 0.8, 1);
    if (mesh.current) mesh.current.visible = cityJourney.reveal < 1;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, boxes.length]}
      frustumCulled={false}
      renderOrder={2}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
