"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { cityJourney, random, signalCityReady } from "@/lib/city";

export function CityAtmosphere({ reduced }: { reduced: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const stars = useRef<THREE.PointsMaterial>(null);
  const { camera } = useThree();
  const positions = useMemo(() => {
    const rand = random(810);
    const p = new Float32Array(210 * 3);
    for (let i = 0; i < 210; i++) {
      p[i * 3] = (rand() - 0.5) * 350;
      p[i * 3 + 1] = 45 + rand() * 90;
      p[i * 3 + 2] = -140 + rand() * 90;
    }
    return p;
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uJourney: { value: 0 },
      uCameraWorld: { value: new THREE.Matrix4() },
      uProjectionInverse: { value: new THREE.Matrix4() },
    }),
    [],
  );
  useFrame((_, delta) => {
    uniforms.uJourney.value = cityJourney.progress;
    uniforms.uCameraWorld.value.copy(camera.matrixWorld);
    uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
    if (!reduced) uniforms.uTime.value += Math.min(delta, 0.06);
    if (stars.current)
      stars.current.opacity =
        THREE.MathUtils.smoothstep(cityJourney.progress, 0.35, 0.8) * 0.12;
  });
  return (
    <>
      <mesh frustumCulled={false} renderOrder={-100}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          depthTest={false}
          depthWrite={false}
          vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.9999,1.);}`}
          fragmentShader={`
        varying vec2 vUv; uniform float uTime; uniform float uJourney;
        uniform mat4 uCameraWorld; uniform mat4 uProjectionInverse;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        float fbm(vec2 p){float v=0.,a=.52;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<6;i++){v+=a*noise(p);p=r*p*2.06+vec2(4.1,1.7);a*=.49;}return v;}
        void main(){
          if(uJourney<.01){gl_FragColor=vec4(.001,.002,.004,1.);return;}
          vec4 view=uProjectionInverse*vec4(vUv*2.-1.,1.,1.);
          vec3 ray=normalize((uCameraWorld*vec4(view.xyz,0.)).xyz);
          vec3 color=vec3(.0007,.0010,.0018);
          float horizon=exp(-abs(ray.y+.045)*13.);
          color+=vec3(.008,.010,.016)*horizon;
          color+=vec3(.014,.002,.005)*horizon*exp(-pow(ray.x*2.,2.));
          vec2 wind=vec2(uTime*.005,uTime*.0015);
          vec2 p=ray.xz/(max(ray.y,.07)+.28)*2.6+wind;
          float warp=fbm(p*.48);
          float field=fbm(p+warp*1.2);
          float density=smoothstep(.40,.71,field);
          float back=fbm(p*1.7+vec2(17.,8.)-wind*.4);
          float lower=smoothstep(.46,.74,back)*.65*smoothstep(.025,.14,ray.y);
          float edge=max(0.,fbm(p+vec2(.05,.03))-field)*12.;
          vec3 clouds=vec3(.010,.013,.019)*density+vec3(.017,.021,.03)*edge;
          clouds+=vec3(.008,.004,.009)*density*horizon;
          color=mix(color,color*.4+clouds,smoothstep(.055,.18,ray.y));
          color=mix(color,color*.45+vec3(.004,.006,.010)*lower,lower*.65);
          float journey=smoothstep(.08,.75,uJourney);
          gl_FragColor=vec4(mix(vec3(.001,.002,.004),color,journey),1.);
        }
      `}
        />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={stars}
          color="#abc8ef"
          size={0.065}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>
      <ambientLight intensity={0.34} color="#72849e" />
      <directionalLight
        position={[-15, 45, 12]}
        intensity={1.05}
        color="#91b6d0"
      />
      <fog attach="fog" args={["#050b15", 45, 165]} />
    </>
  );
}

export function CityEffects({
  mobile,
  onReady,
}: {
  mobile: boolean;
  onReady: () => void;
}) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const value = new EffectComposer(gl);
    value.addPass(new RenderPass(scene, camera));
    value.addPass(
      new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.35, 0.92),
    );
    value.addPass(new OutputPass());
    return value;
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size, mobile]);
  useEffect(
    () => () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
    [composer],
  );
  const frames = useRef(0);
  useFrame(() => {
    composer.render();
    if (++frames.current === 2) {
      signalCityReady();
      onReady();
    }
  }, 1);
  return null;
}
