"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { GradeShader, MistShader } from "./cityPostFX";
import { styleClock } from "./cityStyle";
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
          vec3 color=vec3(.004,.004,.018);
          float horizon=exp(-abs(ray.y+.045)*13.);
          color+=(vec3(.05,.012,.06)*horizon+vec3(.24,.03,.06)*pow(horizon,3.))*(.85+.15*sin(uTime*.45));
          color+=vec3(.08,.01,.03)*horizon*exp(-pow(ray.x*1.5,2.));
          vec2 wind=vec2(uTime*.005,uTime*.0015);
          vec2 p=ray.xz/(max(ray.y,.07)+.28)*2.6+wind;
          float warp=fbm(p*.48);
          float field=fbm(p+warp*1.2);
          float density=smoothstep(.40,.71,field);
          float back=fbm(p*1.7+vec2(17.,8.)-wind*.4);
          float lower=smoothstep(.46,.74,back)*.65*smoothstep(.025,.14,ray.y);
          float edge=max(0.,fbm(p+vec2(.05,.03))-field)*12.;
          // Night clouds are lit from below: brighter bellies near the horizon, where the city glows.
          float underlit=exp(-max(ray.y-.05,0.)*5.);
          vec3 clouds=vec3(.018,.016,.05)*density+vec3(.05,.03,.08)*edge;
          clouds+=vec3(.09,.015,.06)*density*underlit;
          color=mix(color,color*.4+clouds,smoothstep(.055,.18,ray.y));
          color=mix(color,color*.45+vec3(.03,.012,.05)*lower,lower*.7);
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
      {/* Indigo ambient, a violet key and a magenta bounce from the street. */}
      <ambientLight intensity={0.35} color="#3a2d7a" />
      <directionalLight
        position={[-15, 45, 12]}
        intensity={1.1}
        color="#8a7dff"
      />
      <hemisphereLight args={["#3b2a8a", "#3a0a2e", 0.5]} />
      <fog attach="fog" args={["#050b15", 45, 165]} />
    </>
  );
}

/** Meshes that shouldn't write into the AO depth: the sky quad and anything see-through. */
function hiddenFromAO(object: THREE.Object3D) {
  if ((object as THREE.Points).isPoints || (object as THREE.Line).isLine) return true;
  const material = (object as THREE.Mesh).material as THREE.Material | undefined;
  return !!material && !Array.isArray(material) && (material.transparent || !material.depthTest);
}

export function CityEffects({
  mobile,
  reduced,
  onReady,
}: {
  mobile: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  const { gl, scene, camera, size } = useThree();
  const { composer, mist, ao, grade } = useMemo(() => {
    // Both ping-pong targets carry depth, so the mist can read the scene's depth at full resolution.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(1, 1),
    });
    const composer = new EffectComposer(gl, target);
    // A cloned depth texture shares its GPU source, which would sample and write the same texture.
    composer.renderTarget2.depthTexture = new THREE.DepthTexture(1, 1);
    composer.addPass(new RenderPass(scene, camera));
    const mist = new ShaderPass(MistShader);
    mist.material.depthTest = false;
    mist.material.depthWrite = false;
    composer.addPass(mist);
    // Contact shadows where towers meet the street. Desktop only, at half resolution.
    let ao: GTAOPass | null = null;
    if (!mobile) {
      ao = new GTAOPass(scene, camera, 1, 1);
      ao.updateGtaoMaterial({ radius: 2.2, distanceFallOff: 1, thickness: 2, scale: 1.3, samples: 12 });
      ao.updatePdMaterial({ radius: 6, rings: 2, samples: 12 });
      const pass = ao;
      const resize = pass.setSize.bind(pass);
      pass.setSize = (width: number, height: number) => resize(width * 0.5, height * 0.5);
      // GTAO restores visibility from this same cache afterwards.
      const cache = (pass as unknown as { _visibilityCache: Map<THREE.Object3D, boolean> })._visibilityCache;
      pass.overrideVisibility = function () {
        scene.traverse((object) => {
          cache.set(object, object.visible);
          if (hiddenFromAO(object)) object.visible = false;
        });
      };
      composer.addPass(pass);
    }
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.4, 0.9),
    );
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return { composer, mist, ao, grade };
  }, [gl, scene, camera, mobile]);
  useEffect(() => {
    composer.setSize(size.width, size.height);
    const ratio = gl.getPixelRatio();
    mist.uniforms.uTexel.value.set(1 / (size.width * ratio), 1 / (size.height * ratio));
  }, [composer, mist, gl, size]);
  useEffect(
    () => () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
    [composer],
  );
  const frames = useRef(0);
  useFrame((_, delta) => {
    // The flat loading map stays untouched; atmosphere arrives as the city rises and the camera descends.
    const rise = THREE.MathUtils.smoothstep(cityJourney.reveal, 0.2, 1);
    const air = THREE.MathUtils.smoothstep(cityJourney.progress, 0.15, 0.85);
    const u = mist.uniforms;
    u.tDepth.value = composer.readBuffer.depthTexture;
    u.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
    u.uCameraWorld.value.copy(camera.matrixWorld);
    u.uCameraPosition.value.copy(camera.position);
    u.uStrength.value = air;
    grade.uniforms.uStrength.value = rise;
    if (!reduced) {
      styleClock.value += Math.min(delta, 0.06);
      u.uTime.value += Math.min(delta, 0.06);
      grade.uniforms.uTime.value += delta;
    }
    if (ao) {
      ao.enabled = air > 0.01;
      ao.blendIntensity = air * 0.85;
    }
    composer.render();
    if (++frames.current === 2) {
      signalCityReady();
      onReady();
    }
  }, 1);
  return null;
}
