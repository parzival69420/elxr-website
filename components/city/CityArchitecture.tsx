"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three";
import { onIsland, random } from "@/lib/city";

const BASE = "/models/city/";
type Placement = { x: number; z: number; w: number; d: number; h: number; variant: number; seed: number; distant?: boolean };
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

/** Facade finishes, multiplied onto the kit's materials so no two neighbours read as the same block. */
const FINISHES = [
  [0.78, 0.86, 1.0], // cool curtain glass
  [1.0, 0.92, 0.8], // limestone
  [0.96, 0.78, 0.68], // brick
  [0.82, 0.84, 0.88], // steel
  [0.62, 0.68, 0.8], // dark glass
  [0.98, 0.9, 0.76], // sandstone
  [0.86, 0.8, 0.92], // lilac render
];
const up = new THREE.Vector3(0, 1, 0);

function InstancedPart({ part, placements, dimensions }: {
  part: THREE.Mesh; placements: Placement[]; dimensions: {width:number;depth:number;height:number};
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { matrices, colors } = useMemo(() => {
    const colors: THREE.Color[] = [];
    const matrices = placements.map(({x,z,w,h,d,seed}) => {
      const finish = FINISHES[Math.floor(seed * 997) % FINISHES.length];
      const shade = 0.84 + ((seed * 7919) % 1) * 0.28;
      colors.push(new THREE.Color().setRGB(finish[0]*shade, finish[1]*shade, finish[2]*shade));
      // One of four orientations; a quarter turn swaps which model axis spans the lot's width.
      const turn = Math.floor(seed * 4099) % 4;
      const quarter = turn % 2 === 1;
      const scale = new THREE.Vector3(
        (quarter ? d : w) / dimensions.width,
        h / dimensions.height,
        (quarter ? w : d) / dimensions.depth,
      );
      return new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0, z),
        new THREE.Quaternion().setFromAxisAngle(up, (turn * Math.PI) / 2),
        scale,
      );
    });
    return { matrices, colors };
  }, [placements, dimensions]);
  // Each building gets its own occupancy, window warmth and weathering, keyed to its address.
  const material = useMemo(() => {
    const value = (part.material as THREE.MeshStandardMaterial).clone();
    if (value.map) value.map.anisotropy = 8;
    const lit = value.emissiveMap !== null || /interiors/.test(value.name);
    value.onBeforeCompile = (shader) => {
      shader.vertexShader = "varying vec3 vBuildingAddress;\nvarying vec3 vBuildingOrigin;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        vBuildingAddress = (instanceMatrix * vec4(position, 1.)).xyz;
        vBuildingOrigin = instanceMatrix[3].xyz;`);
      shader.fragmentShader = `varying vec3 vBuildingAddress;
        varying vec3 vBuildingOrigin;
        float buildingHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        float building = buildingHash(vBuildingOrigin.xz);
        float storey = floor(vBuildingAddress.y * 1.5);
        diffuseColor.rgb *= 0.86 + 0.26 * building;
        diffuseColor.rgb *= 0.94 + 0.12 * buildingHash(vec2(storey, building * 91.));`);
      if (lit)
        shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          float room = fract(sin(dot(floor(vBuildingAddress * vec3(4., 3., 4.)), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          float occupancy = mix(0.22, 0.72, building);
          totalEmissiveRadiance *= mix(.07, 1.45, smoothstep(occupancy - .12, occupancy + .12, room));
          totalEmissiveRadiance *= mix(vec3(1., .84, .7), vec3(.78, .92, 1.1), fract(building * 7.13));`);
    };
    value.customProgramCacheKey = () => `city-unique-building-v2-${lit ? "lit" : "solid"}`;
    return value;
  }, [part]);
  useEffect(() => {
    matrices.forEach((matrix,i) => { ref.current?.setMatrixAt(i,matrix); ref.current?.setColorAt(i,colors[i]); });
    if(ref.current) { ref.current.instanceMatrix.needsUpdate=true; if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true; ref.current.computeBoundingSphere(); }
  }, [matrices,colors]);
  useEffect(() => () => material.dispose(), [material]);
  return <instancedMesh ref={ref} args={[part.geometry,material,placements.length]} />;
}

export function CityBuildings({mobile}:{mobile:boolean}) {
  const {scene} = useGLTF(`${BASE}architecture-kit.glb`);
  const placements = useMemo(() => {
    const rand=random(82019),data:Placement[]=[...anchors];
    for(let x=-12;x<=12;x+=2.35)for(let z=-64;z<58;z+=2.1){
      const w=1.55+rand()*.42,d=1.35+rand()*.36;
      if(!onIsland(x-w/2,z)||!onIsland(x+w/2,z))continue;
      if(x>-1.7&&x<7.1&&z>-39&&z<-14)continue;
      if(lots.some(lot=>Math.abs(x-lot.x)<(w+lot.w)/2+.2&&Math.abs(z-lot.z)<(d+lot.d)/2+.2))continue;
      if(z>-3&&z<18&&x>-5&&x<1)continue;
      const midtown=Math.exp(-Math.pow((z+5)/20,2)),downtown=Math.exp(-Math.pow((z-47)/9,2));
      let h=1.8+rand()*3.2+midtown*(2+rand()*9)+downtown*rand()*11;
      if(z>-2&&z<12&&x>-.6&&x<6)h=Math.min(h,4.2+rand()*2.5);
      if(z>12&&z<25)h*=.65;
      data.push({x,z,w,d,h,variant:Math.floor(rand()*9),seed:rand()});
    }
    const step=mobile?5.3:4.2;
    for(let x=-91;x<92;x+=step)for(let z=-105;z<65;z+=step){
      if(Math.abs(x)<18||rand()<.05)continue;
      // Across the rivers: low-rise Brooklyn, Queens and Jersey City, so Manhattan owns the skyline.
      const w=2.2+rand()*1.4,d=2.2+rand()*1.4;
      data.push({x:x+rand()*.6,z:z+rand()*.6,w,d,h:1+rand()*2.6+Math.exp(-Math.pow((z+28)/27,2))*rand()*2.2,variant:rand()<.55?9:Math.floor(rand()*9),seed:rand(),distant:true});
    }
    return Array.from({length:10},(_,i)=>data.filter(p=>p.variant===i));
  }, [mobile]);
  return <group>{placements.map((_,i)=>{const variant=scene.getObjectByName(`Block_${i}`)!;return <group key={variant.name}>
    {variant.children.map(part=><InstancedPart key={part.uuid} part={part as THREE.Mesh} placements={placements[i]} dimensions={variant.userData as {width:number;depth:number;height:number}} />)}
  </group>;})}</group>;
}

const models = [
  {id:"times-square",file:"one-times-square",position:[-2.5,0,0]},
  {id:"empire-state",file:"empire-state",position:[7.5,0,9]},
  {id:"world-trade",file:"one-world-trade",position:[-3,0,47]},
  {id:"summit",file:"one-vanderbilt",position:[8,0,-6]},
  {id:"edge",file:"hudson-yards-edge",position:[-10,0,10]},
] as const;
function LandmarkModel({model}:{model:typeof models[number]}) {
  const {scene}=useGLTF(`${BASE}${model.file}.glb`);
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
