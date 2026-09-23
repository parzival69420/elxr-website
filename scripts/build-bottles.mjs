import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { writeFile, mkdir } from "node:fs/promises";

// GLTFExporter uses this browser API only to assemble binary buffers.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;
      this.onloadend?.();
    });
  }
};
const steel = new THREE.MeshStandardMaterial({
  name: "Brushed titanium",
  color: "#25333c",
  metalness: 0.94,
  roughness: 0.28,
});
const silver = new THREE.MeshStandardMaterial({
  name: "Machined edges",
  color: "#82919b",
  metalness: 0.95,
  roughness: 0.22,
});
const bronze = new THREE.MeshStandardMaterial({
  name: "Aged bronze",
  color: "#69523a",
  metalness: 0.88,
  roughness: 0.33,
});
const black = new THREE.MeshStandardMaterial({
  name: "Ceramic inserts",
  color: "#070b10",
  metalness: 0.25,
  roughness: 0.4,
});
const glass = new THREE.MeshPhysicalMaterial({
  name: "Optical glass",
  color: "#c9f6ff",
  metalness: 0,
  roughness: 0.075,
  transmission: 0.96,
  thickness: 0.22,
  ior: 1.45,
  transparent: true,
  opacity: 0.72,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const energy = new THREE.MeshStandardMaterial({
  name: "Energy",
  color: "#09c4e5",
  emissive: "#20ddff",
  emissiveIntensity: 2.2,
  roughness: 0.25,
  metalness: 0.15,
});
const liquid = new THREE.MeshPhysicalMaterial({
  name: "Liquid",
  color: "#057989",
  emissive: "#08c6e0",
  emissiveIntensity: 0.38,
  transmission: 0.3,
  thickness: 0.65,
  ior: 1.34,
  roughness: 0.1,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});
const mesh = (parent, geometry, material, name, position = [0, 0, 0]) => {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.position.set(...position);
  parent.add(m);
  return m;
};
const cylinder = (g, r, h, y, mat, name = "Collar", r2 = r) =>
  mesh(g, new THREE.CylinderGeometry(r, r2, h, 48), mat, name, [0, y, 0]);
const ring = (g, r, t, y, mat, name = "Ring") => {
  const m = mesh(g, new THREE.TorusGeometry(r, t, 10, 64), mat, name, [
    0,
    y,
    0,
  ]);
  m.rotation.x = Math.PI / 2;
  return m;
};
function tube(g, points, r, mat, name = "Conduit") {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
      points.length * 5,
      r,
      7,
      false,
    ),
    mat,
    name,
  );
}
function lathe(g, profile, mat, name) {
  return mesh(
    g,
    new THREE.LatheGeometry(
      profile.map((p) => new THREE.Vector2(...p)),
      56,
    ),
    mat,
    name,
  );
}
function bolt(g, x, y, z, size = 0.06) {
  const m = mesh(
    g,
    new THREE.CylinderGeometry(size, size, 0.035, 12),
    silver,
    "Bolt",
    [x, y, z],
  );
  m.rotation.x = Math.PI / 2;
  mesh(
    g,
    new THREE.BoxGeometry(size * 0.8, 0.013, 0.006),
    black,
    "Screw slot",
    [x, y, z + 0.022],
  );
}
function stopper(root, y, r, variant = 0) {
  const cap = new THREE.Group();
  cap.name = "Stopper";
  cap.position.y = y;
  root.add(cap);
  cylinder(cap, r, 0.16, 0.08, variant ? bronze : steel, "Cap body");
  ring(cap, r, 0.035, 0.04, silver);
  ring(cap, r * 0.96, 0.025, 0.16, silver);
  cylinder(cap, r * 0.87, 0.065, 0.19, steel, "Cap crown");
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const fin = mesh(
      cap,
      new THREE.BoxGeometry(0.025, 0.09, 0.045),
      bronze,
      "Knurl",
      [Math.sin(a) * r, 0.085, Math.cos(a) * r],
    );
    fin.rotation.y = a;
  }
  cylinder(cap, r * 0.69, 0.012, 0.229, black, "Cap seal");
  ring(cap, r * 0.67, 0.012, 0.24, energy, "Energy cap");
}
// Branching filaments are geometry inside the glass, visible from every angle.
function coils(g, r, base, height, turns = 3) {
  for (let j = 0; j < 5; j++) {
    const points = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const a = j * 1.27 + t * turns * 2.8 + Math.sin(i * 1.93 + j) * 0.17;
      const radius = r * (0.83 + Math.sin(i * 2.47 + j * 5) * 0.13);
      points.push([
        Math.sin(a) * radius,
        base + t * height,
        Math.cos(a) * radius,
      ]);
    }
    tube(g, points, 0.006 + (j % 2) * 0.003, energy, "Plasma filament");
    for (let branch = 8; branch < 40; branch += 8) {
      const p = points[branch];
      tube(
        g,
        [
          p,
          [p[0] * 0.7, p[1] + 0.045, p[2] * 0.65],
          [p[0] * 0.5 + 0.05, p[1] + 0.1, p[2] * 0.55],
          [p[0] * 0.3, p[1] + 0.16, p[2] * 0.5],
        ],
        0.004,
        energy,
        "Plasma branch",
      );
    }
  }
  for (let i = 0; i < 26; i++) {
    const a = i * 2.4;
    mesh(
      g,
      new THREE.SphereGeometry(0.006 + (i % 3) * 0.005, 6, 4),
      energy,
      "Suspended particle",
      [
        Math.sin(a) * r * 0.75,
        base + (i / 26) * height,
        Math.cos(a) * r * 0.75,
      ],
    );
  }
}
function beam(g, from, to, width, depth, mat, name = "Armor brace") {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to);
  const piece = mesh(
    g,
    new RoundedBoxGeometry(width, a.distanceTo(b), depth, 2, 0.014),
    mat,
    name,
  );
  piece.position.copy(a).add(b).multiplyScalar(0.5);
  piece.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    b.sub(a).normalize(),
  );
}
function plaque(g, y, z, w = 0.68, h = 0.57) {
  mesh(
    g,
    new RoundedBoxGeometry(w + 0.1, h + 0.1, 0.07, 3, 0.05),
    bronze,
    "Label frame",
    [0, y, z],
  );
  mesh(g, new RoundedBoxGeometry(w, h, 0.08, 3, 0.035), black, "Label plate", [
    0,
    y,
    z + 0.025,
  ]);
  mesh(g, new THREE.PlaneGeometry(w * 0.85, h * 0.82), black, "LabelSurface", [
    0,
    y,
    z + 0.068,
  ]);
  for (const x of [-1, 1])
    for (const sy of [-1, 1])
      bolt(g, x * w * 0.43, y + sy * h * 0.4, z + 0.085, 0.029);
}
function chamber() {
  const g = new THREE.Group();
  g.name = "Arc chamber";
  lathe(
    g,
    [
      [0, 0.18],
      [0.43, 0.18],
      [0.57, 0.24],
      [0.57, 0.35],
      [0.5, 0.44],
      [0.5, 2.12],
      [0.55, 2.28],
      [0.46, 2.4],
      [0.32, 2.61],
      [0.3, 2.91],
      [0.31, 3.02],
      [0, 3.02],
    ],
    glass,
    "Glass body",
  );
  cylinder(g, 0.455, 1.62, 1.25, liquid, "Liquid core");
  coils(g, 0.42, 0.43, 1.72, 2.4);
  for (const [y, r] of [
    [0.18, 0.58],
    [0.3, 0.6],
    [0.4, 0.54],
    [2.17, 0.56],
    [2.33, 0.53],
    [2.58, 0.35],
    [2.92, 0.36],
  ]) {
    cylinder(g, r, 0.085, y, steel);
    ring(g, r, 0.023, y + 0.042, silver);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    const x = Math.sin(a),
      z = Math.cos(a);
    tube(
      g,
      [
        [x * 0.61, 0.18, z * 0.61],
        [x * 0.6, 0.4, z * 0.6],
        [x * 0.54, 1.2, z * 0.54],
        [x * 0.6, 2.17, z * 0.6],
        [x * 0.4, 2.55, z * 0.4],
      ],
      0.044,
      steel,
      "Armature",
    );
    for (const y of [0.38, 2.19]) {
      const part = mesh(
        g,
        new THREE.CylinderGeometry(0.1, 0.1, 0.11, 16),
        bronze,
        "Lock hinge",
        [x * 0.58, y, z * 0.58],
      );
      part.rotation.z = Math.PI / 2;
    }
  }
  for (const y of [0.5, 0.58, 1.94, 2.02])
    ring(g, 0.508, 0.009, y, energy, "Energy band");
  plaque(g, 1.48, 0.57, 0.6, 0.65);
  coils(g, 0.24, 2.56, 0.36, 1.5);
  for (const y of [0.21, 0.29, 2.18, 2.3]) {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const part = mesh(
        g,
        new THREE.BoxGeometry(0.022, 0.06, 0.025),
        bronze,
        "Collar engraving",
        [Math.sin(a) * 0.582, y, Math.cos(a) * 0.582],
      );
      part.rotation.y = a;
    }
  }
  stopper(g, 3.0, 0.37);
  return g;
}
function flask() {
  const g = new THREE.Group();
  g.name = "Prism flask";
  const profile = [
    [-0.35, 0.26],
    [-0.72, 0.49],
    [-0.86, 0.86],
    [-0.86, 1.83],
    [-0.61, 2.3],
    [-0.31, 2.49],
    [0.31, 2.49],
    [0.61, 2.3],
    [0.86, 1.83],
    [0.86, 0.86],
    [0.72, 0.49],
    [0.35, 0.26],
  ];
  const shape = new THREE.Shape(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
  );
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.64,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.055,
    bevelThickness: 0.055,
  });
  geom.translate(0, 0, -0.32);
  mesh(g, geom, glass, "Glass body");
  const core = mesh(g, geom.clone(), liquid, "Liquid core");
  core.scale.set(0.87, 0.87, 0.77);
  core.position.y = 0.15;
  for (const z of [-0.38, 0.38]) {
    const pts = [...profile, profile[0]].map(([x, y]) => [x, y, z]);
    for (let i = 0; i < pts.length - 1; i++) {
      beam(g, pts[i], pts[i + 1], 0.082, 0.065, steel, "Octagonal frame");
      beam(
        g,
        pts[i].map((v, j) => (j === 2 ? v * 1.1 : v * 0.972)),
        pts[i + 1].map((v, j) => (j === 2 ? v * 1.1 : v * 0.972)),
        0.019,
        0.019,
        bronze,
        "Inlaid frame trim",
      );
    }
    for (const side of [-1, 1]) {
      beam(
        g,
        [side * 0.31, 2.46, z],
        [side * 0.48, 1.99, z + 0.04],
        0.11,
        0.06,
        bronze,
      );
      beam(
        g,
        [side * 0.48, 1.99, z + 0.04],
        [side * 0.37, 1.83, z + 0.06],
        0.1,
        0.05,
        steel,
      );
      beam(
        g,
        [side * 0.48, 0.87, z + 0.04],
        [side * 0.31, 0.29, z],
        0.11,
        0.06,
        bronze,
      );
      beam(
        g,
        [side * 0.48, 0.87, z + 0.04],
        [side * 0.37, 1.07, z + 0.06],
        0.1,
        0.05,
        steel,
      );
      beam(
        g,
        [side * 0.84, 1.94, z],
        [side * 0.48, 1.99, z + 0.04],
        0.07,
        0.06,
        steel,
      );
      beam(
        g,
        [side * 0.84, 0.88, z],
        [side * 0.48, 0.87, z + 0.04],
        0.07,
        0.06,
        steel,
      );
    }
  }
  for (const x of [-0.79, 0.79]) {
    tube(
      g,
      [
        [x, 0.48, 0],
        [x * 1.14, 0.65, 0],
        [x * 1.14, 2, 0],
        [x * 0.65, 2.43, 0],
      ],
      0.052,
      bronze,
      "Side rail",
    );
  }
  for (const x of [-0.48, 0.48])
    for (const y of [0.87, 1.99]) {
      const b = mesh(
        g,
        new THREE.CylinderGeometry(0.16, 0.16, 0.11, 24),
        steel,
        "Panel fastener",
        [x, y, 0.44],
      );
      b.rotation.x = Math.PI / 2;
      bolt(g, x, y, 0.52, 0.088);
    }
  for (const y of [0.27, 0.36]) {
    const base = cylinder(g, 0.63, 0.08, y, steel);
    base.scale.z = 0.62;
    ring(g, 0.59, 0.035, y, silver).scale.y = 0.62;
  }
  cylinder(g, 0.31, 0.42, 2.65, steel, "Neck");
  ring(g, 0.34, 0.05, 2.48, bronze);
  ring(g, 0.32, 0.025, 2.65, silver);
  ring(g, 0.32, 0.016, 2.77, energy, "Energy neck");
  coils(g, 0.42, 0.62, 1.57, 2.1);
  plaque(g, 1.45, 0.43, 0.65, 0.69);
  for (const side of [-1, 1])
    beam(
      g,
      [side * 0.36, 1.07, 0.51],
      [side * 0.36, 1.84, 0.51],
      0.016,
      0.016,
      energy,
      "Luminous label frame",
    );
  stopper(g, 2.88, 0.34, 1);
  return g;
}
function decanter() {
  const g = new THREE.Group();
  g.name = "Aether decanter";
  lathe(
    g,
    [
      [0, 0.14],
      [0.45, 0.14],
      [0.59, 0.21],
      [0.63, 0.37],
      [0.62, 0.56],
      [0.53, 0.76],
      [0.47, 1.16],
      [0.47, 1.81],
      [0.57, 2.12],
      [0.53, 2.35],
      [0.4, 2.53],
      [0.25, 2.65],
      [0.25, 2.97],
      [0, 2.97],
    ],
    glass,
    "Glass body",
  );
  lathe(
    g,
    [
      [0, 0.23],
      [0.47, 0.23],
      [0.54, 0.37],
      [0.54, 0.53],
      [0.43, 0.87],
      [0.4, 1.35],
      [0.4, 2.15],
      [0.44, 2.24],
      [0, 2.24],
    ],
    liquid,
    "Liquid core",
  );
  for (const [y, r] of [
    [0.17, 0.6],
    [0.29, 0.64],
    [0.4, 0.64],
    [2.55, 0.32],
    [2.7, 0.28],
    [2.87, 0.28],
  ]) {
    ring(g, r, 0.034, y, bronze);
    cylinder(g, r, 0.047, y, steel);
  }
  for (const side of [-1, 1]) {
    tube(
      g,
      [
        [side * 0.24, 2.89, 0],
        [side * 0.48, 2.85, 0],
        [side * 0.55, 2.6, 0],
        [side * 0.72, 2.26, 0],
        [side * 0.73, 0.48, 0],
        [side * 0.6, 0.2, 0],
      ],
      0.036,
      bronze,
      "Handle",
    );
    for (const y of [0.49, 2.22]) {
      const pivot = mesh(
        g,
        new THREE.SphereGeometry(0.12, 16, 10),
        bronze,
        "Handle hinge",
        [side * 0.63, y, 0.04],
      );
      pivot.scale.z = 0.8;
    }
  }
  coils(g, 0.36, 0.45, 1.79, 3.7);
  ring(g, 0.48, 0.017, 0.55, energy, "Energy base");
  plaque(g, 1.48, 0.48, 0.57, 0.9);
  stopper(g, 2.95, 0.31, 1);
  return g;
}
function consolidate(source) {
  source.updateMatrixWorld(true);
  const cap = source.getObjectByName("Stopper");
  const inverse = cap.matrixWorld.clone().invert();
  const bins = new Map();
  source.traverse((object) => {
    if (!object.isMesh) return;
    let parent = object.parent,
      isCap = false;
    while (parent) {
      if (parent === cap) isCap = true;
      parent = parent.parent;
    }
    const label = object.name === "LabelSurface";
    const key = `${isCap ? "cap" : "body"}:${label ? "label" : object.material.name}`;
    if (!bins.has(key))
      bins.set(key, {
        geometries: [],
        material: object.material,
        isCap,
        name: label ? "LabelSurface" : object.material.name,
      });
    const transform = isCap
      ? inverse.clone().multiply(object.matrixWorld)
      : object.matrixWorld;
    const geometry = object.geometry.index
      ? object.geometry.clone()
      : mergeVertices(object.geometry.clone());
    bins.get(key).geometries.push(geometry.applyMatrix4(transform));
  });
  const result = new THREE.Group();
  result.name = source.name;
  const stopper = new THREE.Group();
  stopper.name = "Stopper";
  stopper.position.copy(cap.position);
  result.add(stopper);
  for (const { geometries, material, isCap, name } of bins.values()) {
    const geometry = mergeGeometries(geometries, false);
    mesh(isCap ? stopper : result, geometry, material, name);
  }
  return result;
}
await mkdir("public/models", { recursive: true });
for (const [name, factory] of [
  ["arc-chamber", chamber],
  ["prism-flask", flask],
  ["aether-decanter", decanter],
]) {
  const group = consolidate(factory());
  group.userData = {
    author: "ELXR Creative",
    license: "Project original",
    purpose: "Interactive service bottle",
  };
  const result = await new GLTFExporter().parseAsync(group, {
    binary: true,
    onlyVisible: true,
  });
  await writeFile(`public/models/${name}.glb`, Buffer.from(result));
  console.log(`${name}.glb: ${(result.byteLength / 1024).toFixed(0)} KB`);
}
