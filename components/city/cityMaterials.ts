/** Architectural surfaces stay procedural so every facade keeps its own scale. */
export const buildingVertex = /* glsl */ `
  attribute float aHeight; attribute float aWidth; attribute float aDepth;
  attribute float aSeed; attribute float aDistrict;
  uniform float uJourney;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
  varying float vHeight; varying float vWidth; varying float vSeed; varying float vDistance;
  void main() {
    vUv=uv; vHeight=aHeight; vSeed=aSeed; vNormal=normal;
    vWidth=abs(normal.x)>.5?aDepth:aWidth;
    vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);
    if(aDistrict>.5) world.y-=55.*(1.-smoothstep(.12,.48,uJourney));
    vWorld=world.xyz;
    vec4 view=viewMatrix*world; vDistance=-view.z;
    gl_Position=projectionMatrix*view;
  }
`;

export const buildingFragment = /* glsl */ `
  uniform sampler2D uEnvironment; uniform float uEnvironmentReady;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorld;
  varying float vHeight; varying float vWidth; varying float vSeed; varying float vDistance;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
  float box(vec2 uv,vec2 lo,vec2 hi,vec2 aa){return smoothstep(lo.x-aa.x,lo.x+aa.x,uv.x)*(1.-smoothstep(hi.x-aa.x,hi.x+aa.x,uv.x))*smoothstep(lo.y-aa.y,lo.y+aa.y,uv.y)*(1.-smoothstep(hi.y-aa.y,hi.y+aa.y,uv.y));}
  vec3 environment(vec3 r){
    vec2 uv=vec2(atan(r.z,r.x)*.15915494+.5,asin(clamp(r.y,-1.,1.))*.31830989+.5);
    vec3 photograph=texture2D(uEnvironment,uv).rgb;
    return mix(vec3(.018,.026,.04)*(1.-r.y*.6),min(photograph,vec3(2.5))*.32,uEnvironmentReady);
  }
  void main(){
    vec3 n=normalize(vNormal),view=normalize(cameraPosition-vWorld);
    float glass=step(.39,vSeed),stone=1.-glass;
    float faceLight=.38+.62*max(0.,dot(n,normalize(vec3(-.6,1.,.5))));
    float grain=noise(vWorld.xz*45.+vWorld.y*19.);
    vec3 concrete=mix(vec3(.048,.041,.034),vec3(.041,.05,.066),vSeed);
    vec3 color=concrete*faceLight*(.78+grain*.22);
    float streetGlow=exp(-length(vWorld.xz-vec2(-2.,0.))*.12)*exp(-vWorld.y*.065);
    vec3 neon=mix(vec3(.008,.052,.072),vec3(.095,.006,.035),smoothstep(-7.,2.,vWorld.x));
    if(n.y>.5){
      // Roof gravel, membrane seams, parapets, drains and mechanical louvers.
      vec2 roof=vUv*vec2(max(vWidth,1.),max(vWidth,1.))*5.;
      vec2 seams=abs(fract(roof)-.5);
      color=vec3(.019,.022,.029)*(.65+noise(vWorld.xz*67.)*.65);
      color*=.8+.2*smoothstep(.025,.05,min(seams.x,seams.y));
      float rim=1.-box(vUv,vec2(.035),vec2(.965),vec2(.003));
      color+=rim*vec3(.043,.052,.065);
      float vent=box(vUv,vec2(.23,.30),vec2(.69,.63),vec2(.004));
      float louver=.55+.45*step(.4,fract(vUv.y*55.));
      color=mix(color,vec3(.06,.073,.084)*louver,vent);
      float puddle=smoothstep(.66,.8,noise(vWorld.xz*2.1));
      color+=environment(reflect(-view,n))*puddle*.07;
      if(vSeed>.92)color+=rim*vec3(.13,.002,.04);
    } else {
      vec2 grid=vec2(max(2.,floor(vWidth*(glass>.5?4.2:3.2))),max(1.,floor(vHeight*3.4)));
      vec2 uv=vUv*grid,cell=floor(uv),sub=fract(uv),aa=max(fwidth(uv)*.65,vec2(.006));
      float pane=box(sub,mix(vec2(.20,.17),vec2(.07,.10),glass),mix(vec2(.80,.79),vec2(.93,.84),glass),aa);
      float inner=box(sub,mix(vec2(.25,.22),vec2(.11,.15),glass),mix(vec2(.75,.74),vec2(.89,.79),glass),aa);
      vec3 normalGlass=normalize(n+vec3(sin(cell.y*.8+vSeed*21.)*.022,noise(cell*.4)*.025,cos(cell.x*.7)*.022));
      float fresnel=.08+.72*pow(1.-max(dot(view,normalGlass),0.),5.);
      vec3 reflection=environment(reflect(-view,normalGlass));
      vec3 glazing=vec3(.003,.007,.013)+reflection*(.32+fresnel)*(.75+.25*hash(cell+vSeed));
      glazing+=neon*streetGlow*(.14+fresnel)*(.4+.6*noise(vec2(cell.x*.16,cell.y*.025)));
      float room=hash(vec2(floor(cell.x/2.),cell.y)+vSeed*177.);
      float office=step(.57,room)*step(.18,hash(vec2(floor(cell.y/4.),vSeed*61.)));
      float blinds=1.-step(.74,room)*.6*step(.45,fract(sub.y*6.));
      float roomDepth=.48+.52*smoothstep(.12,.7,sub.y);
      float silhouette=box(sub,vec2(.4,.18),vec2(.46,.49),aa)*step(.7,hash(cell+43.));
      vec3 warm=mix(vec3(.36,.21,.09),vec3(.19,.29,.37),step(.64,hash(cell*.12+vSeed)));
      glazing+=warm*office*blinds*roomDepth*(1.-silhouette*.85)*(.35+room*.65);
      // Dark transoms and softly lit metal mullions are separate from the panes.
      vec3 frame=mix(concrete*.7,vec3(.038,.045,.055),glass)*faceLight;
      color=mix(color,frame,pane);
      color=mix(color,glazing,inner);
      float sill=box(sub,vec2(.17,.13),vec2(.83,.17),aa)*stone;
      color+=sill*vec3(.044,.038,.029);
      float slab=1.-smoothstep(.035,.08,sub.y);
      color*=1.-slab*.28;
      float pilaster=step(.96,fract(vUv.x*max(1.,floor(vWidth))))*stone;
      color+=pilaster*vec3(.025,.027,.033)*faceLight;
      float weather=1.-noise(vec2(vWorld.x*7.+vWorld.z*7.,vWorld.y*.3))*.18;
      color*=weather;
      // Sparse architectural lighting, not a neon outline on every floor.
      float edge=1.-smoothstep(.004,.012,min(vUv.x,1.-vUv.x));
      if(vSeed>.91)color+=edge*vec3(.14,.002,.035);
      if(vSeed<.075)color+=edge*vec3(.008,.09,.12);
    }
    color+=neon*streetGlow*.11;
    float occlusion=mix(.40,1.,smoothstep(0.,2.5,vWorld.y));
    color*=occlusion;
    float haze=1.-exp(-pow(max(vDistance,0.)*.012,1.6));
    color=mix(color,vec3(.006,.009,.015),haze*.78);
    gl_FragColor=vec4(color,1.);
  }
`;
