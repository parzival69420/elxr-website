"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random } from "@/lib/city";

export default function CentralPark() {
  const trees = useRef<THREE.InstancedMesh>(null);
  const { lake, paths, crowns, colors } = useMemo(() => {
    const rand = random(994);
    const outline = new THREE.Shape();
    outline.moveTo(-0.5, -2);
    outline.bezierCurveTo(-2, -1.8, -2.1, 0.8, -0.8, 1.7);
    outline.bezierCurveTo(0.1, 2.2, 1.7, 1.6, 1.6, 0.2);
    outline.bezierCurveTo(1.5, -0.8, 0.7, -2.3, -0.5, -2);
    const lake = new THREE.ShapeGeometry(outline, 24);
    lake.rotateX(-Math.PI / 2);
    const paths = [-0.3, 4.8].map((x) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from(
          { length: 12 },
          (_, i) =>
            new THREE.Vector3(
              x + Math.sin(i * 1.4) * 0.5,
              0.09,
              -37 + i * 1.95,
            ),
        ),
      );
      return new THREE.TubeGeometry(curve, 80, 0.065, 5, false);
    });
    const crowns: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    for (let i = 0; i < 850; i++) {
      const x = -0.8 + rand() * 7.4,
        z = -37.7 + rand() * 22.1;
      if (Math.pow((x - 2.2) / 2.1, 2) + Math.pow((z + 29) / 2.6, 2) < 1)
        continue;
      if (Math.abs(x - (-0.3 + Math.sin(((z + 37) / 1.95) * 1.4) * 0.5)) < 0.2)
        continue;
      if (Math.abs(x - (4.8 + Math.sin(((z + 37) / 1.95) * 1.4) * 0.5)) < 0.2)
        continue;
      const radius = 0.16 + rand() * 0.2;
      const m = new THREE.Matrix4().makeScale(
        radius,
        0.25 + rand() * 0.45,
        radius,
      );
      m.setPosition(x, 0.25, z);
      crowns.push(m);
      colors.push(
        new THREE.Color().setRGB(
          0.045 + rand() * 0.025,
          0.09 + rand() * 0.035,
          0.052 + rand() * 0.022,
        ),
      );
    }
    return { lake, paths, crowns, colors };
  }, []);
  useEffect(() => {
    crowns.forEach((matrix, i) => {
      trees.current?.setMatrixAt(i, matrix);
      trees.current?.setColorAt(i, colors[i]);
    });
    if (trees.current) {
      trees.current.instanceMatrix.needsUpdate = true;
      if (trees.current.instanceColor)
        trees.current.instanceColor.needsUpdate = true;
    }
    return () => {
      lake.dispose();
      paths.forEach((path) => path.dispose());
    };
  }, [lake, paths, crowns, colors]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.75, 0.055, -26.5]}>
        <planeGeometry args={[8, 23]} />
        <meshStandardMaterial color="#263b2c" roughness={1} />
      </mesh>
      <mesh geometry={lake} position={[2.2, 0.07, -29]}>
        <meshStandardMaterial
          color="#0b1520"
          roughness={0.16}
          metalness={0.7}
        />
      </mesh>
      {paths.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial color="#4b483e" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={trees} args={[undefined, undefined, crowns.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
    </group>
  );
}
