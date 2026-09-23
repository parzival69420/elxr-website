"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  useFBO,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { bottleColors } from "@/lib/bottles";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const models = ["arc-chamber", "prism-flask", "aether-decanter"];
const bottleOffset = (index: number, active: number) =>
  ((index - active + 9) % 6) - 3;
type StageProps = {
  active: number;
  open: boolean;
  hovered: number | null;
  rotation: MutableRefObject<number>;
  reduced: boolean;
  mobile: boolean;
  inView: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onReady: () => void;
  onFailure: () => void;
};

function labelTexture(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#080d12";
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = "#596a78";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 456, 584);
  ctx.textAlign = "center";
  ctx.fillStyle = bottleColors[index];
  ctx.font = "500 24px Satoshi, Arial";
  ctx.fillText(`FORMULA 0${index + 1}`, 256, 123);
  ctx.fillStyle = "#f3f8fa";
  ctx.font = "900 118px Satoshi, Arial";
  ctx.fillText("ELXR", 250, 315);
  ctx.fillStyle = "#8da0ad";
  ctx.font = "400 22px Satoshi, Arial";
  ctx.fillText("CREATIVE CHEMISTRY", 256, 385);
  ctx.fillStyle = bottleColors[index];
  ctx.fillRect(221, 452, 70, 3);
  ctx.fillStyle = "#9aabb6";
  ctx.font = "400 20px Satoshi, Arial";
  ctx.fillText("NEW YORK", 256, 545);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function BottleModel({
  index,
  buffer,
  ...props
}: StageProps & { index: number; buffer: THREE.Texture }) {
  const {
    active,
    open,
    hovered,
    rotation,
    reduced,
    mobile,
    onSelect,
    onHover,
    onReady,
  } = props;
  const { scene } = useGLTF(`/models/${models[index % 3]}.glb`);
  const root = useRef<THREE.Group>(null);
  const previousAngle = useRef(0);
  const fluid = useMemo(() => ({ time: { value: 0 }, tilt: { value: 0 } }), []);
  const { model, shells, cap, capY, materials, texture } = useMemo(() => {
    const model = scene.clone(true),
      texture = labelTexture(index);
    const materials: THREE.MeshPhysicalMaterial[] = [],
      shells: THREE.Mesh[] = [];
    const tint = new THREE.Color(bottleColors[index]);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const original = object.material as THREE.MeshPhysicalMaterial;
      if (original.name === "Optical glass") {
        shells.push(object);
        return;
      }
      const material = original.clone();
      if (object.name === "LabelSurface") {
        material.map = texture;
        material.color.set("white");
        material.emissive.set("white");
        material.emissiveMap = texture;
        material.emissiveIntensity = 0.1;
        material.roughness = 0.28;
        material.metalness = 0.18;
      } else if (original.name === "Energy") {
        material.color.copy(tint);
        material.emissive.copy(tint);
        material.emissiveIntensity = 0.7;
      } else if (original.name.startsWith("Liquid")) {
        material.color.copy(tint).lerp(new THREE.Color("white"), 0.76);
        material.attenuationColor = tint
          .clone()
          .lerp(new THREE.Color("white"), 0.18);
        material.attenuationDistance = 0.65;
        material.transmission = 0.86;
        material.thickness = 0.65;
        material.ior = 1.333;
        material.roughness = 0.028;
        material.metalness = 0;
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
        material.clearcoat = 0.4;
        material.clearcoatRoughness = 0.03;
        material.emissive.copy(tint);
        material.emissiveIntensity = 0.035;
        material.envMapIntensity = 0.8;
        object.geometry.computeBoundingBox();
        const fill = object.geometry.boundingBox!.max.y;
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uFluidTime = fluid.time;
          shader.uniforms.uFluidTilt = fluid.tilt;
          shader.uniforms.uFillLevel = { value: fill };
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              `#include <common>
            uniform float uFluidTime; uniform float uFluidTilt; uniform float uFillLevel;`,
            )
            .replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
              float surface = smoothstep(uFillLevel-.09,uFillLevel,position.y);
              transformed.y += surface*(sin(position.x*8.+uFluidTime)*cos(position.z*9.+uFluidTime*.8)*.009 + position.x*uFluidTilt);`,
            );
        };
        material.customProgramCacheKey = () => "elxr-liquid-surface-v2";
      } else if (material.metalness > 0.5) {
        material.envMapIntensity = 1.5;
        material.roughness = original.name === "Machined edges" ? 0.17 : 0.29;
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vWear;",
            )
            .replace(
              "#include <begin_vertex>",
              "#include <begin_vertex>\nvWear=position;",
            );
          shader.fragmentShader = shader.fragmentShader
            .replace(
              "#include <common>",
              "#include <common>\nvarying vec3 vWear;\nfloat wearHash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,43.24)))*43758.5453);}",
            )
            .replace(
              "#include <roughnessmap_fragment>",
              "#include <roughnessmap_fragment>\nfloat grain=wearHash(floor(vWear*700.));roughnessFactor=clamp(roughnessFactor+grain*.06,.12,.8);diffuseColor.rgb*=.94+grain*.06;",
            );
        };
        material.customProgramCacheKey = () => "elxr-satin-metal-v2";
      }
      object.material = material;
      materials.push(material);
    });
    // Shell geometry is preserved from the GLB; its live material reads the shared refraction buffer.
    shells.forEach((shell) => shell.removeFromParent());
    const cap = model.getObjectByName("Stopper");
    return {
      model,
      shells,
      cap,
      capY: cap?.position.y ?? 0,
      materials,
      texture,
    };
  }, [scene, index, fluid]);
  useEffect(() => {
    onReady();
    return () => {
      materials.forEach((m) => m.dispose());
      texture.dispose();
    };
  }, [materials, texture, onReady]);
  useFrame(({ clock, pointer }, delta) => {
    const group = root.current;
    if (!group) return;
    const selected = index === active,
      over = hovered === index,
      offset = bottleOffset(index, active);
    const blend = reduced ? 1 : 1 - Math.exp(-delta * 7);
    group.position.lerp(
      new THREE.Vector3(
        offset * 2.45,
        selected ? 0.02 : 0.04,
        selected ? 0.35 : -0.7,
      ),
      blend,
    );
    const scale = selected ? 1.05 : 0.82;
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, scale, blend));
    const angle = selected
      ? rotation.current + (over && !reduced ? pointer.x * 0.06 : 0)
      : Math.sign(offset) * -0.26;
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, angle, blend);
    group.rotation.z = THREE.MathUtils.lerp(
      group.rotation.z,
      over && !reduced ? pointer.x * -0.018 : 0,
      blend,
    );
    const speed =
      (group.rotation.y - previousAngle.current) / Math.max(delta, 0.001);
    previousAngle.current = group.rotation.y;
    fluid.tilt.value = THREE.MathUtils.damp(
      fluid.tilt.value,
      reduced ? 0 : THREE.MathUtils.clamp(-speed * 0.025, -0.07, 0.07),
      3,
      delta,
    );
    fluid.time.value = reduced ? 0 : clock.elapsedTime * 1.1;
    if (cap) {
      cap.position.y = THREE.MathUtils.lerp(
        cap.position.y,
        capY + (selected && open ? 0.3 : over && !reduced ? 0.045 : 0),
        blend,
      );
      cap.rotation.y = selected && open ? 0.3 : 0;
    }
    for (const material of materials) {
      if (material.name === "Energy")
        material.emissiveIntensity =
          (selected ? 0.82 : 0.44) +
          (selected && open ? 0.4 : 0) +
          (reduced ? 0 : Math.sin(clock.elapsedTime * 1.2 + index) * 0.025);
    }
  });
  return (
    <group
      ref={root}
      position={[
        bottleOffset(index, active) * 2.45,
        0,
        index === active ? 0.35 : -0.7,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
      }}
      onPointerOut={() => onHover(null)}
    >
      <primitive object={model} />
      {shells.map((shell) => (
        <mesh
          key={shell.uuid}
          geometry={shell.geometry}
          userData={{ refractionShell: true }}
          renderOrder={5}
        >
          <MeshTransmissionMaterial
            buffer={buffer}
            resolution={64}
            backsideResolution={64}
            samples={mobile ? 3 : 5}
            transmission={1}
            thickness={0.12}
            ior={1.46}
            roughness={0.026}
            chromaticAberration={0.006}
            anisotropicBlur={0.02}
            distortion={0.015}
            distortionScale={0.35}
            temporalDistortion={0}
            color="#f4fbff"
            attenuationColor="#deeff5"
            attenuationDistance={5}
            clearcoat={1}
            clearcoatRoughness={0.025}
            envMapIntensity={1.25}
            transparent={false}
            opacity={1}
            depthWrite
          />
        </mesh>
      ))}
    </group>
  );
}

function GlassScene(props: StageProps) {
  const { gl, scene, camera, size } = useThree();
  const scale = Math.min(1, (props.mobile ? 640 : 1152) / size.width);
  const buffer = useFBO(
    Math.max(128, Math.round(size.width * scale)),
    Math.max(128, Math.round(size.height * scale)),
    { type: THREE.HalfFloatType, depthBuffer: true },
  );
  const hidden = useMemo<THREE.Object3D[]>(() => [], []);
  useFrame(() => {
    hidden.length = 0;
    scene.traverse((object) => {
      if (object.userData.refractionShell && object.visible) {
        hidden.push(object);
        object.visible = false;
      }
    });
    const target = gl.getRenderTarget(),
      tone = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(target);
    gl.toneMapping = tone;
    hidden.forEach((object) => {
      object.visible = true;
    });
  }, 0.5);
  return (
    <>
      {Array.from(
        { length: 6 },
        (_, index) =>
          Math.abs(bottleOffset(index, props.active)) <= 1 && (
            <BottleModel
              key={index}
              index={index}
              buffer={buffer.texture}
              {...props}
            />
          ),
      )}
    </>
  );
}

function StudioBackdrop() {
  return (
    <mesh position={[0, 2, -5]}>
      <planeGeometry args={[35, 16]} />
      <shaderMaterial
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv;void main(){vec2 p=(vUv-.5)*vec2(2.4,1.);float halo=exp(-dot(p,p)*9.);float pool=exp(-dot((vUv-vec2(.5,.32))*vec2(4.,12.),(vUv-vec2(.5,.32))*vec2(4.,12.)));vec3 c=vec3(.0012,.0018,.003)+vec3(.013,.017,.024)*halo+vec3(.007,.012,.013)*pool;gl_FragColor=vec4(c,1.);}`}
      />
    </mesh>
  );
}
function Effects() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.14, 0.3, 1.3));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  useEffect(
    () => () => {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
    [composer],
  );
  useFrame(() => composer.render(), 1);
  return null;
}
function ContextWatch({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onFailure);
    return () => canvas.removeEventListener("webglcontextlost", onFailure);
  }, [gl, onFailure]);
  return null;
}
export default function BottleStage(props: StageProps) {
  return (
    <Canvas
      camera={{ fov: 34, position: [0, 1.93, props.mobile ? 7.8 : 7.5] }}
      dpr={[1, props.mobile ? 1.25 : 1.5]}
      frameloop={props.inView ? "always" : "demand"}
      gl={{
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.65, 0);
        gl.domElement.setAttribute(
          "aria-label",
          "Interactive glass service bottles. Drag to rotate the selected bottle.",
        );
        gl.domElement.style.touchAction = "pan-y";
      }}
    >
      <color attach="background" args={["#05070a"]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#e8f4ff" />
      <directionalLight
        position={[-4, 3, -2]}
        intensity={1.5}
        color="#67caff"
      />
      <Environment resolution={256}>
        <Lightformer
          intensity={3}
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 3, 1]}
        />
        <Lightformer
          intensity={5}
          position={[-3, 2, 3]}
          rotation={[0, 0.55, 0]}
          scale={[0.55, 6, 1]}
          color="#edf8ff"
        />
        <Lightformer
          intensity={3}
          position={[3, 2.5, 1]}
          rotation={[0, -0.7, 0]}
          scale={[1.1, 5, 1]}
          color="#b9ddeb"
        />
        <Lightformer
          intensity={3}
          position={[0, 2, -4]}
          rotation={[0, Math.PI, 0]}
          scale={[7, 3, 1]}
          color="#89a9cb"
        />
        <Lightformer
          intensity={1}
          position={[1, 1, 5]}
          scale={[3, 2, 1]}
          color="#ffffff"
        />
      </Environment>
      <StudioBackdrop />
      <Suspense fallback={null}>
        <GlassScene {...props} />
      </Suspense>
      <ContextWatch onFailure={props.onFailure} />
      <Effects />
    </Canvas>
  );
}
