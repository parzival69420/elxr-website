"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three";
import { onIsland, random } from "@/lib/city";
import { stylize } from "./cityStyle";

export const BASE = "/models/city/";
export type Placement = { x: number; z: number; w: number; d: number; h: number; variant: number; seed: number; distant?: boolean };
const anchors: Placement[] = [
  {x:-6.5,z:-4,w:3,d:2,h:16.2,variant:1,seed:1},
  {x:0,z:-4,w:2.5,d:1.8,h:12,variant:4,seed:2},
  {x:-6.6,z:5,w:3.1,d:2.6,h:10,variant:3,seed:3},
  {x:1.2,z:4.8,w:2.6,d:2.2,h:10.1,variant:5,seed:4},
  {x:-9,z:0,w:2.5,d:2.5,h:12.7,variant:2,seed:5},
  {x:-5.5,z:-12,w:2.8,d:1.9,h:15.2,variant:7,seed:6},
  {x:4,z:-8,w:2.8,d:2.2,h:18.5,variant:8,seed:7},
  {x:3,z:10.8,w:3.8,d:2,h:5,variant:0,seed:8},
];
const lots = [
  ...anchors,
  {x:-2.5,z:0,w:2.7,d:2.1}, {x:7.5,z:9,w:3.8,d:3},
  {x:8,z:-6,w:3.4,d:3}, {x:-10,z:10,w:3.3,d:6.5},
  {x:-3,z:47,w:3.5,d:3.5},
  {x:10.4,z:-2.6,w:2,d:2}, // Chrysler
];

/** Photographic lighting is reflected by the PBR materials inside the GLBs. */
export function CityEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    let disposed = false;
    const previous = scene.environment;
    let target: THREE.WebGLRenderTarget | undefined;
    const loader = new RGBELoader();
    loader.load("/textures/rooftop-night-1k.hdr", (texture) => {
      if (disposed) { texture.dispose(); return; }
      const pmrem = new THREE.PMREMGenerator(gl);
      target = pmrem.fromEquirectangular(texture);
      scene.environment = target.texture;
      scene.environmentIntensity = .58;
      texture.dispose(); pmrem.dispose();
    }, undefined, () => { /* Direct lighting also supports offline HDR failure. */ });
    return () => { disposed = true; scene.environment = previous; target?.dispose(); };
  }, [gl, scene]);
  return null;
}

function InstancedPart({ part, placements, dimensions }: {
  part: THREE.Mesh; placements: Placement[]; dimensions: {width:number;depth:number;height:number};
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { matrices, colors } = useMemo(() => {
    const colors: THREE.Color[] = [];
    const matrices = placements.map(({x,z,w,h,d,seed}) => {
      colors.push(new THREE.Color().setRGB(.72 + seed*.28, .78+seed*.22, .88+seed*.12));
      return new THREE.Matrix4().makeScale(w/dimensions.width,h/dimensions.height,d/dimensions.depth).setPosition(x,0,z);
    });
    return { matrices, colors };
  }, [placements, dimensions]);
  // Instanced interiors vary by address, and each building has its own share of lit windows.
  const material = useMemo(() => {
    const value = (part.material as THREE.MeshStandardMaterial).clone();
    if (value.map) value.map.anisotropy = 8;
    // Lit windows carry the night skyline: push the facade atlas and interiors hard enough to bloom.
    if (value.name.startsWith("Facade_atlas")) value.emissiveIntensity *= 2.6;
    if (/interiors/.test(value.name)) {
      value.emissiveIntensity *= 2;
      value.onBeforeCompile = (shader) => {
        shader.vertexShader = "varying vec3 vBuildingAddress;\nvarying vec2 vBuildingOrigin;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vBuildingAddress = (instanceMatrix * vec4(position, 1.)).xyz;\n vBuildingOrigin = instanceMatrix[3].xz;");
        shader.fragmentShader = "varying vec3 vBuildingAddress;\nvarying vec2 vBuildingOrigin;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          float room = fract(sin(dot(floor(vBuildingAddress * vec3(4., 3., 4.)), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          float occupancy = mix(.42, .7, fract(sin(dot(vBuildingOrigin, vec2(12.9898, 78.233))) * 43758.5453));
          totalEmissiveRadiance *= mix(.06, 2.2, smoothstep(occupancy - .12, occupancy + .12, room));`);
      };
      value.customProgramCacheKey = () => "city-address-interiors-v3";
    }
    return stylize(value, dimensions.height);
  }, [part, dimensions.height]);
  useEffect(() => {
    matrices.forEach((matrix,i) => { ref.current?.setMatrixAt(i,matrix); ref.current?.setColorAt(i,colors[i]); });
    if(ref.current) { ref.current.instanceMatrix.needsUpdate=true; if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true; ref.current.computeBoundingSphere(); }
  }, [matrices,colors]);
  useEffect(() => () => material.dispose(), [material]);
  return <instancedMesh ref={ref} args={[part.geometry,material,placements.length]} />;
}

/** Every kit building on the island. Seeded, so the blueprint wireframe and the city share one layout. */
export function buildingPlacements(scene:THREE.Object3D,mobile:boolean):Placement[] {
    const rand=random(82019),data:Placement[]=[...anchors];
    // Each placement uses the kit building whose modelled height is closest, so floors keep their proportions.
    const kitHeights=Array.from({length:9},(_,i)=>(scene.getObjectByName(`Block_${i}`)!.userData as {height:number}).height);
    const variantFor=(h:number)=>{
      const nearest=kitHeights.map((kh,i)=>({i,gap:Math.abs(Math.log(kh/h))})).sort((a,b)=>a.gap-b.gap);
      return nearest[Math.floor(rand()*Math.min(3,nearest.length))].i;
    };
    const place=(x:number,z:number,w:number,d:number,h:number)=>data.push({x,z,w,d,h,variant:variantFor(h),seed:rand()});
    for(let x=-12;x<=12;x+=2.35)for(let z=-64;z<58;z+=2.1){
      const w=1.55+rand()*.42,d=1.35+rand()*.36;
      if(!onIsland(x-w/2,z)||!onIsland(x+w/2,z))continue;
      if(x>-1.7&&x<7.1&&z>-39&&z<-14)continue;
      if(lots.some(lot=>Math.abs(x-lot.x)<(w+lot.w)/2+.2&&Math.abs(z-lot.z)<(d+lot.d)/2+.2))continue;
      if(z>-3&&z<18&&x>-5&&x<1)continue;
      // Midtown and the Financial District carry the skyline; everything between stays lower.
      const midtown=Math.exp(-Math.pow((z+5)/20,2)),downtown=Math.exp(-Math.pow((z-47)/10,2));
      const tall=Math.max(midtown,downtown);
      let h=2+rand()*3.4+midtown*(3+rand()*15)+downtown*(4+rand()*19);
      if(z>-2&&z<12&&x>-.6&&x<6)h=Math.min(h,4.2+rand()*2.5);
      if(z>12&&z<25)h*=.7;
      // Most lots hold two buildings of different heights: a jagged street wall, not one block per lot.
      if(rand()<(mobile?.25:.4)+tall*.3){
        const split=.42+rand()*.16,w1=w*split-.06,w2=w*(1-split)-.06;
        place(x-w/2+w1/2,z,w1,d,h);
        place(x+w/2-w2/2,z+(rand()-.5)*.2,w2,d*(.85+rand()*.15),h*(.45+rand()*.9));
      } else place(x,z,w,d,h);
    }
    return data;
}

export function CityBuildings({mobile}:{mobile:boolean}) {
  const {scene} = useGLTF(`${BASE}architecture-kit.glb`);
  const placements = useMemo(() => {
    const data=buildingPlacements(scene,mobile);
    return Array.from({length:9},(_,i)=>data.filter(p=>p.variant===i));
  }, [scene, mobile]);
  return <group>{placements.map((_,i)=>{const variant=scene.getObjectByName(`Block_${i}`)!;return <group key={variant.name}>
    {variant.children.map(part=><InstancedPart key={part.uuid} part={part as THREE.Mesh} placements={placements[i]} dimensions={variant.userData as {width:number;depth:number;height:number}} />)}
  </group>;})}</group>;
}

export const models = [
  {id:"times-square",file:"one-times-square",position:[-2.5,0,0]},
  {id:"empire-state",file:"empire-state",position:[7.5,0,9]},
  {id:"world-trade",file:"one-world-trade",position:[-3,0,47]},
  {id:"summit",file:"one-vanderbilt",position:[8,0,-6]},
  {id:"edge",file:"hudson-yards-edge",position:[-10,0,10]},
] as const;
function LandmarkModel({model}:{model:typeof models[number]}) {
  const {scene}=useGLTF(`${BASE}${model.file}.glb`);
  // Landmarks take the same stylized blend as the kit buildings.
  useMemo(()=>{
    const height=new THREE.Box3().setFromObject(scene).max.y,done=new Set<THREE.Material>();
    scene.traverse(o=>{const m=(o as THREE.Mesh).material as THREE.Material|undefined;if(m&&!Array.isArray(m)&&!done.has(m)){done.add(m);stylize(m,height);}});
  },[scene]);
  return <primitive object={scene} position={[...model.position]} />;
}
export function CityLandmarks() {
  return <>{models.map(model=><LandmarkModel key={model.id} model={model} />)}</>;
}

function StreetPart({part,matrices,animated,reduced}:{part:THREE.Mesh;matrices:THREE.Matrix4[];animated:boolean;reduced:boolean}) {
  const ref=useRef<THREE.InstancedMesh>(null);
  useEffect(()=>{matrices.forEach((m,i)=>ref.current?.setMatrixAt(i,m));if(ref.current){ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();}},[matrices]);
  const matrix=useMemo(()=>new THREE.Matrix4(),[]);
  useFrame(({clock})=>{
    if(!animated||reduced||!ref.current)return;
    matrices.forEach((m,i)=>{matrix.copy(m);const dir=i%2?1:-1;matrix.elements[14]=((m.elements[14]+clock.elapsedTime*dir*.4+180)%60)-20;ref.current!.setMatrixAt(i,matrix);});
    ref.current.instanceMatrix.needsUpdate=true;
  });
  return <instancedMesh ref={ref} args={[part.geometry,part.material,matrices.length]} frustumCulled={false} />;
}
export function CityStreetLife({reduced,mobile}:{reduced:boolean;mobile:boolean}) {
  const {scene}=useGLTF(`${BASE}street-kit.glb`);
  const placements=useMemo(()=>{
    const rand=random(492),data:Record<string,THREE.Matrix4[]>={Taxi:[],Streetlamp:[],Pedestrian:[],Bollard:[]};
    const put=(name:string,x:number,z:number,angle=0,scale=1)=>data[name].push(new THREE.Matrix4().compose(new THREE.Vector3(x,0,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),new THREE.Vector3(scale,scale,scale)));
    for(let i=0;i<54;i++)put("Taxi",i%2?-4.6:-.5,-18+rand()*60,i%2?0:Math.PI,1.2);
    for(let z=-17;z<26;z+=2.7)for(const x of [-4.15,-.8]){put("Streetlamp",x,z,x< -2?0:Math.PI);put("Bollard",x,z+.7);put("Bollard",x,z+1.4);}
    for(let i=0;i<(mobile?100:230);i++){const z=-9+rand()*25,x=-3.9+rand()*2.8;if(z<1.3&&z>-1.3)continue;put("Pedestrian",x,z,rand()*6.28,.8+rand()*.5);}
    return data;
  },[mobile]);
  return <group>{Object.keys(placements).flatMap(name=>scene.getObjectByName(name)!.children.map(part=><StreetPart key={part.uuid} part={part as THREE.Mesh} matrices={placements[name]} animated={name==="Taxi"} reduced={reduced} />))}</group>;
}

// Preload only the scene assets; no external model or decoder requests at runtime.
for(const file of ["architecture-kit","street-kit",...models.map(m=>m.file)])useGLTF.preload(`${BASE}${file}.glb`);
