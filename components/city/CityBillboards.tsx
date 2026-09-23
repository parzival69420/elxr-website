"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const screenVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const screenFragment = /* glsl */ `
  varying vec2 vUv;uniform sampler2D uLettering;uniform float uTime;uniform float uStyle;uniform float uHover;
  void main(){
    vec2 uv=vUv;
    vec3 accent=uStyle<.5?vec3(.015,.25,.34):vec3(.42,.004,.095);
    float sweep=exp(-pow((uv.x-uv.y*.4-sin(uTime*.12)*.2-.3)*3.,2.));
    vec3 color=mix(vec3(.004,.008,.018),accent,.22+sweep*.32);
    float band=smoothstep(.68,.72,uv.y)*(1.-smoothstep(.89,.92,uv.y));
    color+=accent*band*.12;
    vec4 type=texture2D(uLettering,uv);
    color=type.rgb;
    float ledDetail=1.-smoothstep(.004,.016,fwidth(uv.y));
    color*=1.-.025*ledDetail*(.5+.5*sin(uv.y*2048.));
    float border=step(.994,max(abs(uv.x-.5),abs(uv.y-.5))*2.);
    color+=border*accent*.8;
    gl_FragColor=vec4(color*(1.+uHover*.18)+accent*sweep*.018,1.);
  }
`;

function makeLettering(text: string, aspect: number, style: number) {
  const canvas = document.createElement("canvas");
  canvas.height = Math.min(1536, Math.floor(2048 / aspect));
  canvas.width = Math.round(canvas.height * aspect);
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const palette=[['#031720','#08718c','#abf4ff'],['#210515','#ae125b','#ffaad5'],['#180d08','#ad4520','#ffdb9a'],['#050d34','#253db4','#b5caff'],['#e8ded0','#a39584','#181420']][style%5];
  const gradient=ctx.createLinearGradient(0,height,width,0);
  gradient.addColorStop(0,palette[0]);gradient.addColorStop(1,palette[1]);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  // Full-bleed campaign artwork, with clean type over a separate dark field.
  ctx.save();ctx.translate(width*.5,height*.29);
  if(aspect<1.3){
    for(let i=0;i<17;i++){
      ctx.beginPath();ctx.strokeStyle=palette[2]+(style===4?'55':'88');
      ctx.lineWidth=Math.max(2,width*.004);ctx.ellipse(0,0,width*(.14+i*.008),height*(.11+i*.002),i*.14,0,Math.PI*2);ctx.stroke();
    }
    const glow=ctx.createRadialGradient(0,0,0,0,0,width*.3);glow.addColorStop(0,palette[2]+'60');glow.addColorStop(1,palette[2]+'00');ctx.fillStyle=glow;ctx.fillRect(-width/2,-height/2,width,height);
  }else{
    for(let i=0;i<12;i++){ctx.fillStyle=palette[2]+'18';ctx.fillRect(-width*.6+i*width*.13,-height,width*.06,height*2);}
  }
  ctx.restore();
  const scrim=ctx.createLinearGradient(0,height*.35,0,height);scrim.addColorStop(0,palette[0]+'00');scrim.addColorStop(.5,palette[0]+'da');scrim.addColorStop(1,palette[0]);ctx.fillStyle=scrim;ctx.fillRect(0,0,width,height);
  ctx.fillStyle = style===4?'#161320':"#fff9f5";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = text.split("\n");
  const longest = Math.max(...lines.map((line) => line.length));
  const fontSize = Math.min(
    (height * 0.36) / Math.max(1, lines.length / 1.5),
    (width * 0.9) / (longest * 0.62),
  );
  ctx.font = `900 ${fontSize}px Satoshi, Arial, sans-serif`;
  lines.forEach((line, i) =>
    ctx.fillText(
      line,
      width / 2,
      height * (aspect>1.3?.51:.61) + (i - (lines.length - 1) / 2) * fontSize * 1.04,
    ),
  );
  ctx.fillRect(width * 0.08, height * 0.87, width * 0.84, 2);
  ctx.font = `500 ${Math.min(width * 0.036, 35)}px Satoshi, Arial, sans-serif`;
  if(aspect<2){ctx.fillText("ELXR  /  NEW YORK", width / 2, height * 0.93);ctx.fillText("IDEAS LIVE HERE", width / 2, height * 0.07);}
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function Screen({
  position,
  size,
  text,
  style = 0,
  rotation = 0,
  reduced,
}: {
  position: [number, number, number];
  size: [number, number];
  text: string;
  style?: number;
  rotation?: number;
  reduced: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const aspect = size[0] / size[1];
  const texture = useMemo(() => makeLettering(text, aspect, style), [text, aspect, style]);
  const uniforms = useMemo(
    () => ({
      uLettering: { value: texture },
      uTime: { value: 0 },
      uStyle: { value: style },
      uHover: { value: 0 },
    }),
    [texture, style],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (material.current) {
      if (!reduced)
        material.current.uniforms.uTime.value += Math.min(delta, 0.06);
    }
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[size[0] + 0.16, size[1] + 0.16, 0.12]} />
        <meshStandardMaterial
          color="#080b19"
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <shaderMaterial
          ref={material}
          vertexShader={screenVertex}
          fragmentShader={screenFragment}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function CityBillboards({
  reduced,
}: {
  reduced: boolean;
}) {
  return (
    <>
      <Screen
        position={[-2.5, 7.8, 1.01]}
        size={[2.35, 4.8]}
        text="ELXR"
        style={1}
        reduced={reduced}
      />
      <Screen
        position={[-2.5, 3.5, 1.02]}
        size={[2.35, 3.4]}
        text={"MAKE\nSOME\nNOISE."}
        reduced={reduced}
      />
      <Screen
        position={[-3.81, 6, 0.1]}
        size={[1.7, 7]}
        text={"NEW\nYORK"}
        rotation={-Math.PI / 2}
        style={1}
        reduced={reduced}
      />
      <Screen
        position={[-6.5, 7.2, -2.96]}
        size={[2.6, 7]}
        text={"STAY\nLOUD."}
        style={1}
        reduced={reduced}
      />
      <Screen
        position={[0, 6.6, -3.06]}
        size={[2.15, 5.6]}
        text="IDEAS."
        reduced={reduced}
      />
      <Screen
        position={[-6.6, 4.3, 6.4]}
        size={[2.7, 4.2]}
        text={"NEW\nYORK."}
        style={0}
        reduced={reduced}
      />
      <Screen
        position={[1.2, 4.4, 6]}
        size={[2.3, 4.2]}
        text={"AFTER\nHOURS"}
        style={0}
        reduced={reduced}
      />
      <Screen
        position={[4, 10.4, -6.85]}
        size={[2.6, 7.5]}
        text={"GROW\nWITH\nUS."}
        style={0}
        reduced={reduced}
      />
      <Screen
        position={[5.45, 10, -8]}
        size={[2, 7.5]}
        text="ELXR"
        style={1}
        rotation={Math.PI / 2}
        reduced={reduced}
      />
      <Screen
        position={[-9, 5.8, 1.29]}
        size={[2.15, 4.3]}
        text={"GOOD\nENERGY"}
        style={0}
        reduced={reduced}
      />
      <Screen
        position={[3, 3, 12]}
        size={[3.5, 2]}
        text="CREATIVE."
        style={1}
        reduced={reduced}
      />
      <Screen
        position={[-5.5, 10, -11]}
        size={[2.6, 5.5]}
        text={"NO\nLIMITS"}
        style={1}
        reduced={reduced}
      />
      {[
        {p:[-6.5,2.7,-2.95],s:[2.7,1.4],t:"BROADWAY",v:2},
        {p:[-6.5,12,-2.94],s:[2.7,1.7],t:"NYC / LIVE",v:3},
        {p:[-8.06,6.2,-4],s:[1.85,8.1],t:"NEVER\nSLEEP.",v:2,r:-Math.PI/2},
        {p:[-5.02,6.2,-4],s:[1.85,8.1],t:"PLAY\nLOUD.",v:3,r:Math.PI/2},
        {p:[0,2.6,-3.03],s:[2.25,1.65],t:"CREATIVE\nCULTURE",v:2},
        {p:[1.29,6.5,-4],s:[1.6,5.2],t:"HELLO\nWORLD",v:1,r:Math.PI/2},
        {p:[-6.6,1.6,6.39],s:[2.8,.75],t:"THEATRE DISTRICT",v:2},
        {p:[-4.99,4.2,5],s:[2.3,5.8],t:"MAKE\nWAVES",v:3,r:Math.PI/2},
        {p:[1.2,1.2,5.94],s:[2.4,.6],t:"AFTER HOURS / NYC",v:1},
        {p:[-.15,4.5,4.8],s:[1.9,5.9],t:"STAY\nCURIOUS",v:2,r:-Math.PI/2},
        {p:[-2.5,10.37,1.025],s:[2.4,.55],t:"TIMES SQUARE",v:3},
        {p:[-2.5,1.35,1.03],s:[2.4,.6],t:"NEW YORK • NEW IDEAS",v:2},
        {p:[-1.18,6.5,0],s:[1.8,7.2],t:"ELXR\nNYC",v:3,r:Math.PI/2},
        {p:[4,3,-6.85],s:[2.6,2.5],t:"YOUR NEXT\nBIG THING",v:2},
        {p:[-9,2.6,1.3],s:[2.25,1.7],t:"NIGHT\nSHIFT",v:1},
        {p:[-3,1.05,-1.15],s:[1.7,.42],t:"tkts / BROADWAY",v:1},
      ].map((ad,i)=><Screen key={i} position={ad.p as [number,number,number]} size={ad.s as [number,number]} text={ad.t} style={ad.v} rotation={ad.r??0} reduced={reduced} />)}
    </>
  );
}
