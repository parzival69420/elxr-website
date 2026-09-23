import * as THREE from "three";

/** Street-level mist and distance haze, rebuilt from the scene depth. Runs in linear
 *  light before bloom, so neon behind the mist still glows through it. */
export const MistShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    uProjectionInverse: { value: new THREE.Matrix4() },
    uCameraWorld: { value: new THREE.Matrix4() },
    uCameraPosition: { value: new THREE.Vector3() },
    uTime: { value: 0 },
    uStrength: { value: 0 },
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D tDepth;
    uniform mat4 uProjectionInverse; uniform mat4 uCameraWorld; uniform vec3 uCameraPosition;
    uniform float uTime; uniform float uStrength; uniform vec2 uTexel;
    varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(3.1,1.7);a*=.5;}return v;}
    void main(){
      vec4 scene=texture2D(tDiffuse,vUv);
      if(uStrength<.001){gl_FragColor=scene;return;}
      float depth=texture2D(tDepth,vUv).x;
      vec4 view=uProjectionInverse*vec4(vec3(vUv,depth)*2.-1.,1.);
      view.xyz/=view.w;
      bool sky=depth>=.99999;
      vec3 world=(uCameraWorld*vec4(view.xyz,1.)).xyz;
      vec3 ray=world-uCameraPosition;
      float dist=sky?420.:length(ray);
      vec3 dir=normalize(ray);
      if(sky) world=uCameraPosition+dir*dist;

      // Distance haze: cool, thin, grows toward the horizon.
      float haze=1.-exp(-dist*.009);
      // Exponential height fog integrated along the ray: dense at street level, gone by the rooftops.
      float falloff=.16;
      float dy=dir.y*dist;
      float height=exp(-max(uCameraPosition.y,0.)*falloff);
      float column=abs(dy)>.001?(1.-exp(-dy*falloff))/(dy*falloff):1.;
      float ground=clamp(.034*dist*height*column,0.,1.);
      // Drifting banks: the mist is patchy, and the patches move.
      vec2 drift=vec2(uTime*.35,uTime*.12);
      vec3 probe=uCameraPosition+dir*min(dist,90.)*.7;
      // Fine detail fades with distance, where it would alias into streaks.
      float detail=1.-smoothstep(50.,140.,dist);
      float banks=fbm(probe.xz*.045+drift*.04)*.75+(fbm(world.xz*.11-drift*.07)-.5)*.5*detail+.25;
      banks=smoothstep(.45,1.1,banks);
      float mist=sky?0.:clamp(ground*(.1+banks*1.8),0.,.72);

      // Background blur: the city beyond Midtown softens, like a long lens; the towers in the
      // shot stay in focus.
      float blur=smoothstep(85.,200.,dist)*(sky?.6:1.)*3.;
      vec3 soft=scene.rgb;
      if(blur>.05){
        vec3 acc=vec3(0.);
        for(int i=0;i<8;i++){float a=float(i)*.785398;acc+=texture2D(tDiffuse,vUv+vec2(cos(a),sin(a))*uTexel*blur).rgb;}
        soft=mix(scene.rgb,acc/8.,.85);
      }
      vec3 hazeColor=mix(vec3(.012,.008,.04),vec3(.09,.014,.06),smoothstep(60.,200.,dist));
      vec3 mistColor=vec3(.05,.02,.08)+soft*.2;
      vec3 color=mix(soft,hazeColor,haze*.8*(sky?.15:1.));
      color=mix(color,mistColor,mist);
      gl_FragColor=vec4(mix(scene.rgb,color,uStrength),scene.a);
    }
  `,
};

/** Final grade in display space: an S-curve for contrast, a touch of saturation,
 *  a soft vignette and fine grain so the dark sky doesn't band. */
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uStrength: { value: 0 },
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
  },
  vertexShader: MistShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uStrength; uniform vec2 uTexel;
    varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      // Contrast-adaptive sharpen: crisper facade and roofline detail, backed off where local
      // contrast is already high, so neon edges and the bloom halo stay soft.
      vec3 n=texture2D(tDiffuse,vUv+vec2(0.,uTexel.y)).rgb, s=texture2D(tDiffuse,vUv-vec2(0.,uTexel.y)).rgb;
      vec3 e=texture2D(tDiffuse,vUv+vec2(uTexel.x,0.)).rgb, w=texture2D(tDiffuse,vUv-vec2(uTexel.x,0.)).rgb;
      vec3 lo=min(c,min(min(n,s),min(e,w))), hi=max(c,max(max(n,s),max(e,w)));
      vec3 amount=sqrt(clamp(min(lo,1.-hi)/max(hi,1e-4),0.,1.))*.16;
      c=clamp(c+(4.*c-n-s-e-w)*amount,0.,1.);
      // Dreamy rather than harsh: a gentle curve, shadows lifted toward indigo.
      vec3 graded=mix(c,c*c*(3.-2.*c),.45);
      float luma=dot(graded,vec3(.2126,.7152,.0722));
      graded+=vec3(.006,.003,.02)*(1.-smoothstep(0.,.3,luma));
      graded=mix(vec3(luma),graded,1.3);
      vec2 d=vUv-.5;
      float vignette=1.-smoothstep(.32,.95,length(d*vec2(1.,.82)))*.42;
      graded*=vignette;
      graded+=(hash(vUv*1024.+fract(uTime)*37.)-.5)*.018;
      gl_FragColor=vec4(mix(c,graded,uStrength),1.);
    }
  `,
};
