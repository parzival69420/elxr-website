"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cityJourney, onIsland, random, shoreline } from "@/lib/city";

export function Ground() {
  const { island, coast, streets } = useMemo(() => {
    const shape = new THREE.Shape(
      shoreline.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    const island = new THREE.ShapeGeometry(shape);
    island.rotateX(-Math.PI / 2);
    const coast = new THREE.BufferGeometry().setFromPoints(
      [...shoreline, shoreline[0]].map(
        ([x, z]) => new THREE.Vector3(x, 0.04, z),
      ),
    );
    const points: THREE.Vector3[] = [];
    for (let x = -13.25; x < 13; x += 2.5)
      for (let z = -68; z < 62; z += 0.6) {
        if (onIsland(x, z) && onIsland(x, z + 0.6))
          points.push(
            new THREE.Vector3(x, 0.025, z),
            new THREE.Vector3(x, 0.025, z + 0.6),
          );
      }
    for (let z = -65.05; z < 61; z += 2.15)
      for (let x = -14; x < 14; x += 0.6) {
        if (onIsland(x, z) && onIsland(x + 0.6, z))
          points.push(
            new THREE.Vector3(x, 0.025, z),
            new THREE.Vector3(x + 0.6, 0.025, z),
          );
      }
    const streets = new THREE.BufferGeometry().setFromPoints(points);
    return { island, coast, streets };
  }, []);
  // 0 = the navy loading map, 1 = the lit night city. Follows the reveal.
  const reveal = useMemo(() => ({ uReveal: { value: 0 } }), []);
  const water = useMemo(() => ({ uReveal: reveal.uReveal }), [reveal]);
  useFrame(() => {
    reveal.uReveal.value = 1 - Math.pow(1 - cityJourney.reveal, 3);
  });
  useEffect(
    () => () => {
      island.dispose();
      coast.dispose();
      streets.dispose();
    },
    [island, coast, streets],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[800, 800]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={water}
          vertexShader={`varying float depth;varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;vec4 p=modelViewMatrix*vec4(position,1.);depth=-p.z;gl_Position=projectionMatrix*p;}`}
          fragmentShader={`varying float depth;varying vec3 world;uniform float uReveal;
          void main(){
            float ripple=.5+.5*sin(world.z*17.+sin(world.x*8.)*2.);
            float shimmer=pow(.5+.5*sin(world.x*22.+sin(world.z*.4)),8.);
            float coast=exp(-pow((abs(world.x)-15.2)*.37,2.));
            vec3 c=vec3(.003,.009,.018)+vec3(.014,.027,.046)*coast*(.3+ripple*.7);
            c+=mix(vec3(.045,.01,.034),vec3(.025,.05,.068),step(0.,world.x))*coast*shimmer;
            c=mix(c,vec3(.003,.005,.008),smoothstep(65.,190.,depth));
            c=mix(vec3(.0015,.003,.016),c,uReveal);
            gl_FragColor=vec4(c,1.-smoothstep(150.,260.,depth));
          }`}
        />
      </mesh>
      <mesh geometry={island}>
        <shaderMaterial
          uniforms={reveal}
          vertexShader={`varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`}
          fragmentShader={`
            varying vec3 vWorld;
            uniform float uReveal;
            float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
            void main(){
              vec2 cell=fract((vWorld.xz+vec2(13.25,65.05))/vec2(2.5,2.15));
              vec2 edge=min(cell,1.-cell)*vec2(2.5,2.15);
              float road=1.-smoothstep(.16,.23,min(edge.x,edge.y));
              float grain=hash(floor(vWorld.xz*170.));
              vec3 color=mix(vec3(.020,.023,.029),vec3(.006,.008,.011),road)*(.78+.22*grain);
              float curb=smoothstep(.20,.225,min(edge.x,edge.y))*(1.-smoothstep(.235,.25,min(edge.x,edge.y)));
              color+=curb*vec3(.019,.022,.027);
              float lane=(1.-smoothstep(.006,.016,edge.x))*step(.65,fract(vWorld.z*1.6))*smoothstep(.3,.45,edge.y);
              color+=lane*vec3(.10,.078,.028);
              float wet=hash(floor(vWorld.xz*4.));
              float glow=exp(-length(vWorld.xz-vec2(-2.,1.))*.14)*road*(.45+.55*wet);
              color+=mix(vec3(.05,.004,.025),vec3(.006,.045,.068),step(-1.,vWorld.x))*glow;
              float streak=.5+.5*sin(vWorld.x*48.+hash(floor(vWorld.xz*8.))*2.);
              color+=vec3(.12,.006,.046)*exp(-abs(vWorld.x+2.5)*1.4)*exp(-abs(vWorld.z-2.)*.16)*streak*.3;
              float distance=length(cameraPosition-vWorld);
              color=mix(color,vec3(.004,.006,.009),1.-exp(-distance*.006));
              // Loading map: navy blocks inside lighter street borders; the 2D map's colours in linear space (OutputPass converts).
              float lotLine=1.-smoothstep(.0,.03,abs(fract(vWorld.x*.8+hash(floor(vWorld.xz/vec2(2.5,2.15)))*.5)-.5)-.47);
              vec3 block=mix(vec3(.0033,.0056,.037),vec3(.0056,.0103,.068),step(.85,hash(floor((vWorld.xz+vec2(13.25,65.05))/vec2(2.5,2.15)))));
              vec3 mapColor=mix(block,vec3(.0103,.0203,.133),max(1.-smoothstep(.17,.21,min(edge.x,edge.y)),lotLine*.25));
              color=mix(mapColor,color,uReveal);
              gl_FragColor=vec4(color,1.);
            }`}
        />
      </mesh>
      <lineLoop geometry={coast}>
        <lineBasicMaterial color="#35758a" transparent opacity={0.65} />
      </lineLoop>
      <lineSegments geometry={streets}>
        <lineBasicMaterial color="#34405e" transparent opacity={0.14} />
      </lineSegments>
    </>
  );
}

export function Broadway() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.09, 53),
      new THREE.Vector3(-5, 0.09, 25),
      new THREE.Vector3(-3, 0.09, 1),
      new THREE.Vector3(1, 0.09, -28),
      new THREE.Vector3(4, 0.09, -58),
    ]);
    return new THREE.TubeGeometry(curve, 120, 0.018, 5, false);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={[0.52, 0.018, 0.12]} />
    </mesh>
  );
}

export function Traffic({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = random(112);
    const data = new Float32Array(540);
    for (let i = 0; i < 180; i++) {
      data[i * 3] = (Math.floor(rand() * 9) - 4) * 2.5 - 1.1;
      data[i * 3 + 1] = 0.13;
      data[i * 3 + 2] = (rand() - 0.5) * 108;
    }
    return data;
  }, []);
  useFrame((_, delta) => {
    if (reduced || !ref.current || cityJourney.progress < 0.03) return;
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      let z = attr.getZ(i) + delta * (i % 2 ? 1 : -1) * 0.55;
      if (z > 55) z = -55;
      if (z < -55) z = 55;
      attr.setZ(i, z);
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffbc95"
        size={0.11}
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

export function Plaza() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.065, 6.5]}>
        <planeGeometry args={[3.1, 10]} />
        <shaderMaterial
          vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){
            vec2 cells=fract(vUv*vec2(18.,60.));float joint=step(.04,min(cells.x,cells.y));
            vec3 base=vec3(.022,.027,.038)*(.5+.5*joint);
            float ripple=.55+.45*hash(floor(vUv*vec2(170.,300.)));
            vec3 glow=mix(vec3(.19,.012,.065),vec3(.008,.105,.16),vUv.x);
            base+=glow*pow(1.-abs(vUv.x-.5),4.)*ripple*(.7+.3*sin(vUv.y*14.));
            gl_FragColor=vec4(base,1.);
          }`}
        />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-3, 0.08 + i * 0.055, -3.5 + i * 0.22]}>
          <boxGeometry args={[1.8, 0.1 + i * 0.11, 0.25]} />
          <meshStandardMaterial
            color="#9a0640"
            emissive="#f30b56"
            emissiveIntensity={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
      {[-4.3, -0.8].map((x, i) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.075, 6]}>
          <planeGeometry args={[0.04, 18]} />
          <meshBasicMaterial
            color={i ? [0.03, 0.8, 1.4] : [2.2, 0.01, 0.6]}
            toneMapped={false}
          />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-2.6, 0.08, 10.7 + i * 0.22]}
        >
          <planeGeometry args={[2.8, 0.09]} />
          <meshBasicMaterial color="#718290" transparent opacity={0.5} />
        </mesh>
      ))}
      <pointLight
        position={[-2, 5, 4]}
        color="#ff1d8f"
        intensity={38}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[2, 6, -4]}
        color="#0cbdff"
        intensity={30}
        distance={15}
        decay={2}
      />
    </group>
  );
}
