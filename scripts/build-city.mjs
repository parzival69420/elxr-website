import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mkdir, writeFile } from 'node:fs/promises';

// Original, locally served glTF assets. Rebuild with npm run models:city.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
};
function random(seed) { return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mat = (name, color, metalness=.3, roughness=.6, emissive, intensity=0) => new T.MeshStandardMaterial({name,color,metalness,roughness,emissive:emissive ?? '#000000',emissiveIntensity:intensity});
const M = {
  stone: mat('Limestone', '#676a70', .12, .78),
  brick: mat('Weathered masonry', '#51424a', .08, .9),
  metal: mat('Brushed aluminum', '#677887', .82, .31),
  roof: mat('Roof membrane and mechanical equipment', '#202b37', .32, .76),
  glass: mat('Reflective blue curtain wall', '#193949', .78, .19),
  dark: mat('Unlit recessed glazing', '#0b192a', .65, .22),
  warm: mat('Warm occupied interiors', '#303137', .32, .36, '#ffc68c', .20),
  cool: mat('Cool occupied interiors', '#263442', .42, .28, '#aadcf5', .16),
  dim: mat('Shaded interiors', '#232934', .4, .45, '#bb9971', .045),
  cyan: mat('Cyan architectural light', '#49cbe8', .3, .3, '#1fd3ff', 1.8),
  pink: mat('Magenta architectural light', '#ca367d', .3, .3, '#ff2e93', 1.6),
  gold: mat('Champagne crown light', '#62605b', .45, .5, '#ffd9a3', .3),
  red: mat('Red stair glass', '#771839', .32, .3, '#fb2257', .6),
  yellow: mat('NYC taxi paint', '#dfae31', .35, .3),
};
for(let i=0;i<4;i++)M[`facade${i}`]=mat(`Facade_atlas_${i}`, '#ffffff', i%2?.08:.42, i%2?.78:.3, '#ffffff', .24);
function facade(g,width,height,x,y,z,rotation,style) {
  const columns=Math.max(1,Math.ceil(width/2.1)),rows=Math.max(1,Math.ceil(height/2.7));
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const w=width/columns,h=height/rows,geo=new T.PlaneGeometry(w,h),uv=geo.attributes.uv;
    const tile=style%3===0?(style%2?3:1):style%2===1?0:2;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(tile%2)*.5+.002+uv.getX(i)*.496,Math.floor(tile/2)*.5+.002+(1-uv.getY(i))*.496);
    const offset=-width/2+(col+.5)*w;
    add(g,geo,M[`facade${tile}`],[x+Math.cos(rotation)*offset,y+(row+.5)*h,z-Math.sin(rotation)*offset],rotation);
  }
}
const add=(g,geo,material,p=[0,0,0],rotation=0)=>{const m=new T.Mesh(geo,material);m.position.set(...p);m.rotation.y=rotation;g.add(m);return m;};
const box=(g,w,h,d,x,y,z,m=M.roof)=>add(g,new T.BoxGeometry(w,h,d),m,[x,y,z]);
function beam(g,a,b,r=.02,m=M.metal) {
  const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);
  const mesh=add(g,new T.CylinderGeometry(r,r,v.length(),5),m,start.clone().add(end).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
}
function roof(g,w,d,y,rand) {
  for(const s of [-1,1]){box(g,w+.04,.1,.05,0,y+.05,s*d/2);box(g,.05,.1,d,s*w/2,y+.05,0);}
  for(let i=0;i<3;i++){
    const x=(rand()-.5)*w*.6,z=(rand()-.5)*d*.5;
    box(g,.28,.22,.38,x,y+.11,z,M.metal);
    for(let j=0;j<5;j++)box(g,.26,.012,.018,x,y+.23,z-.14+j*.07,M.roof);
  }
  if(rand()>.55){
    const x=w*.23,z=-d*.22;
    add(g,new T.CylinderGeometry(.2,.2,.45,12),M.brick,[x,y+.46,z]);
    add(g,new T.ConeGeometry(.24,.16,12),M.metal,[x,y+.765,z]);
    for(const a of [-1,1])for(const b of [-1,1])box(g,.024,.25,.024,x+a*.14,y+.12,z+b*.14,M.metal);
    for(const yy of [.28,.59]){const ring=add(g,new T.TorusGeometry(.204,.012,4,12),M.metal,[x,y+yy,z]);ring.rotation.x=Math.PI/2;}
  }
}
// Recessed glazing with uneven occupancy, floor heights, mullions and blinds.
function block(g,{w,d,h,y=0,x=0,z=0,seed=1,style=0,detail=true}) {
  const rand=random(seed),stone=style%3===0, shell=stone?(style%2?M.brick:M.stone):M.glass;
  box(g,w,h,d,x,y+h/2,z,M.roof);
  const floorHeight=.24+rand()*.11, rows=Math.max(1,Math.floor(h/floorHeight));
  for(let face=0;face<4;face++){
    const width=face%2?d:w,columns=Math.max(2,Math.floor(width/(stone?.17+rand()*.09:.13+rand()*.1)));
    const cellW=width/columns,cellH=h/rows;
    facade(g,width,h,x+Math.sin(face*Math.PI/2)*(w/2+.012),y,z+Math.cos(face*Math.PI/2)*(d/2+.012),face*Math.PI/2,style);
    if(detail){
      for(let col=0;col<=columns;col+=(stone?2:3)){
        const offset=col*cellW-width/2;
        if(face%2)box(g,.03,h,.03,x+(face===1?1:-1)*(w/2+.012),y+h/2,z+offset,M.metal);
        else box(g,.03,h,.035,x+offset,y+h/2,z+(face===0?1:-1)*(d/2+.012),M.metal);
      }
    }
  }
  if(detail)for(let row=0;row<=rows;row+=stone?3:4){
    box(g,w+.045,.035,d+.045,x,y+row*h/rows,z,stone?M.stone:M.metal);
  }
}
function kitBuilding(i){
  const g=new T.Group();g.name=`Block_${i}`;const rand=random(i*143+17);
  const w=1.6+rand()*.4,d=1.5+rand()*.3,h=[6,13,18,5,16,11,7,20,17][i];
  block(g,{w,d,h,seed:i*131+11,style:i});
  const top=i%3===1?1.8:i%3===2?.8:0;
  if(top)block(g,{w:w*.75,d:d*.72,h:top,y:h,seed:121+i,style:i});
  roof(g,top?w*.75:w,top?d*.72:d,h+top,rand);
  // A real ground-floor storefront, projecting awning and lintel.
  for(let j=0;j<3;j++){
    box(g,w*.27,.44,.03,(j-1)*w*.31,.24,d/2+.03,j===1?M.warm:M.dark);
    box(g,w*.29,.055,.24,(j-1)*w*.31,.54,d/2+.11,i%2?M.pink:M.cyan);
  }
  if(i%3===0)for(let yy=.9;yy<h;yy+=.9){
    box(g,.44,.035,.22,w/2-.24,yy,d/2+.11,M.metal);
    for(const side of [-1,1])beam(g,[w/2-.24+side*.19,yy,d/2+.2],[w/2-.24+side*.19,yy+.18,d/2+.2],.009);
    beam(g,[w/2-.42,yy,d/2+.21],[w/2-.05,yy+.75,d/2+.21],.012);
  }
  g.userData={width:w,depth:d,height:h+top};return g;
}
function empire(){
  const g=new T.Group();g.name='Empire_State';
  for(const [w,d,h,y]of[[3.6,2.8,2,0],[3,2.45,2,2],[2.65,2.15,8,4],[2.18,1.8,1.7,12],[1.72,1.42,1.3,13.7],[1.2,1.08,1.5,15],[.78,.74,1.5,16.5]]){
    block(g,{w,d,h,y,seed:193+Math.round(y*17),style:0});
    for(const s of [-1,1])box(g,w,.055,.04,0,y+h,s*d/2,y>12?M.gold:M.stone);
  }
  for(let x=-1.2;x<=1.21;x+=.3)for(const z of [-1.09,1.09])box(g,.047,8,.07,x,8,z,M.stone);
  add(g,new T.CylinderGeometry(.16,.34,1.35,12),M.gold,[0,18.67,0]);
  add(g,new T.CylinderGeometry(.045,.13,2.1,12),M.metal,[0,20.35,0]);
  add(g,new T.ConeGeometry(.035,.9,8),M.gold,[0,21.85,0]);
  for(let y=19;y<21.4;y+=.3){const ring=add(g,new T.TorusGeometry(.13,.012,4,16),M.metal,[0,y,0]);ring.rotation.x=Math.PI/2;}
  return g;
}
function wtc(){
  const g=new T.Group();g.name='One_World_Trade_Center';
  block(g,{w:3.1,d:3.1,h:3,y:0,seed:108,style:2});
  // Eight triangular faces connect a square base to a rotated square crown.
  const bottom=[[-1.55,3,-1.55],[1.55,3,-1.55],[1.55,3,1.55],[-1.55,3,1.55]];
  const top=[[0,23,-1.6],[1.6,23,0],[0,23,1.6],[-1.6,23,0]];
  for(let i=0;i<4;i++){
    const triangles=[[bottom[i],bottom[(i+1)%4],top[i]],[top[i],bottom[(i+1)%4],top[(i+1)%4]]];
    for(const tri of triangles){
      const geo=new T.BufferGeometry().setFromPoints(tri.map(p=>new T.Vector3(...p)));geo.setIndex([0,2,1]);geo.computeVertexNormals();
      geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));add(g,geo,M.glass);
    }
    beam(g,bottom[i],top[i],.025,M.metal);beam(g,bottom[(i+1)%4],top[i],.025,M.metal);
  }
  // Each level follows the changing octagonal cross-section.
  const rand=random(1776);
  for(let y=3.25;y<22.9;y+=.245){
    const t=(y-3)/20,a=1.55*(1-t),b=1.55*(1-t)+1.6*t;
    const pts=[[-a,-b],[a,-b],[b,-a],[b,a],[a,b],[-a,b],[-b,a],[-b,-a]];
    for(let k=0;k<8;k++){
      const p=new T.Vector3(pts[k][0],y,pts[k][1]),q=new T.Vector3(pts[(k+1)%8][0],y,pts[(k+1)%8][1]);
      const length=p.distanceTo(q),n=Math.max(1,Math.floor(length/.2));
      for(let j=0;j<n;j++){
        const c=p.clone().lerp(q,(j+.5)/n),out=c.clone().setY(0).normalize().multiplyScalar(.011);c.add(out);
        const pane=new T.PlaneGeometry(length/n*.91,.19),uv=pane.attributes.uv;
        const col=Math.floor(rand()*8),row=Math.floor(rand()*8);
        for(let v=0;v<uv.count;v++)uv.setXY(v,(col+.05+uv.getX(v)*.9)/16,(row+.95-uv.getY(v)*.9)/16);
        add(g,pane,M.facade0,c.toArray(),Math.atan2(-(q.z-p.z),q.x-p.x)+Math.PI);
      }
    }
  }
  add(g,new T.CylinderGeometry(.75,.75,.16,24),M.metal,[0,23.12,0]);
  add(g,new T.CylinderGeometry(.04,.13,5.8,12),M.metal,[0,26.05,0]);
  for(let y=23.4;y<28.5;y+=.55)beam(g,[-.13,y,0],[.13,y+.35,0],.015,M.gold);
  add(g,new T.SphereGeometry(.055,8,6),M.pink,[0,29,0]);return g;
}
function summit(){
  const g=new T.Group();g.name='One_Vanderbilt_SUMMIT';
  for(const [w,d,h,y,x,z]of[[3.2,2.8,3,0,0,0],[2.9,2.55,10,3,0,0],[2.45,2.2,3.5,13,-.15,-.12],[1.85,1.65,2.5,16.5,-.3,-.24],[1.2,1.04,2.2,19,-.5,-.35],[.62,.55,1.4,21.2,-.66,-.43]]){
    block(g,{w,d,h,y,x,z,seed:245+Math.round(y*13),style:2});
    box(g,w+.035,.04,d+.035,x,y+h,z,y>12?M.gold:M.metal);
  }
  // Two luminous observation floors and projecting glass skyboxes.
  for(const y of [16.1,16.6])box(g,2.53,.085,2.24,-.15,y,-.12,M.cyan);
  for(const x of [-.8,.5])box(g,.46,.42,.35,x,16.32,1.1,M.cool);
  beam(g,[-.66,22.6,-.43],[-.66,25.3,-.43],.035,M.gold);
  return g;
}
function edge(){
  const g=new T.Group();g.name='30_Hudson_Yards_Edge';
  block(g,{w:3.1,d:2.9,h:17.6,seed:30,style:1});
  // Sloping roof line, stepped through closely spaced curtain-wall sections.
  for(let i=0;i<14;i++)block(g,{w:3.1/14,d:2.9,h:1.2+i*.16,y:17.6,x:-1.55+(i+.5)*3.1/14,seed:30+i,style:1,detail:false});
  const shape=new T.Shape();shape.moveTo(-1.4,1.45);shape.lineTo(1.4,1.45);shape.lineTo(.85,4.15);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:.13,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,16.4,0);
  add(g,geo,M.metal);
  const vertices=[[-1.4,16.45,1.45],[1.4,16.45,1.45],[.85,16.45,4.15]];
  for(let i=0;i<3;i++){
    const a=vertices[i],b=vertices[(i+1)%3];beam(g,a,b,.022,M.cyan);
    beam(g,[a[0],16.83,a[2]],[b[0],16.83,b[2]],.018,M.metal);
    for(let t=0;t<=1;t+=.1){const x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;beam(g,[x,16.45,z],[x,16.83,z],.008,M.metal);}
  }
  beam(g,[.85,16.35,4.15],[0,14.1,1.45],.065,M.metal);
  return g;
}
function timesSquare(){
  const g=new T.Group();g.name='One_Times_Square';
  block(g,{w:2.55,d:1.9,h:10.7,seed:1904,style:0});
  block(g,{w:1.6,d:1.5,h:1.5,y:10.7,seed:1905,style:0});
  for(const y of [1.4,5.25,10.3])box(g,2.74,.12,2.02,0,y,0,M.metal);
  beam(g,[0,12.2,0],[0,14.6,0],.045,M.metal);
  add(g,new T.IcosahedronGeometry(.32,2),M.cool,[0,14.15,0]);
  return g;
}
function taxi(){
  const g=new T.Group();g.name='Taxi';
  box(g,.18,.075,.39,0,.09,0,M.yellow);box(g,.15,.065,.2,0,.155,-.025,M.dark);
  box(g,.15,.016,.21,0,.193,-.025,M.yellow);box(g,.065,.025,.055,0,.216,-.025,M.warm);
  for(const x of [-.073,.073]){box(g,.035,.02,.015,x,.104,.202,M.cool);box(g,.035,.02,.015,x,.104,-.202,M.pink);}
  for(const x of [-.09,.09])for(const z of [-.125,.125]){const wheel=add(g,new T.CylinderGeometry(.038,.038,.018,8),M.roof,[x,.05,z]);wheel.rotation.z=Math.PI/2;}
  return g;
}
function street(){
  const root=new T.Group();root.name='Street_kit';root.add(taxi());
  const lamp=new T.Group();lamp.name='Streetlamp';beam(lamp,[0,0,0],[0,1.3,0],.022);beam(lamp,[0,1.3,0],[.32,1.3,0],.022);box(lamp,.2,.03,.08,.28,1.28,0,M.warm);root.add(lamp);
  const person=new T.Group();person.name='Pedestrian';add(person,new T.SphereGeometry(.028,6,4),M.stone,[0,.19,0]);box(person,.058,.09,.04,0,.12,0,M.metal);for(const x of [-.018,.018])box(person,.02,.07,.023,x,.04,0,M.roof);root.add(person);
  const bollard=new T.Group();bollard.name='Bollard';add(bollard,new T.CylinderGeometry(.032,.038,.23,8),M.metal,[0,.115,0]);root.add(bollard);
  return root;
}
function consolidate(source){
  source.updateMatrixWorld(true);const bins=new Map();
  source.traverse(o=>{if(!o.isMesh)return;const key=o.material.name;if(!bins.has(key))bins.set(key,{material:o.material,geometries:[]});const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);bins.get(key).geometries.push(geometry);});
  const result=new T.Group();result.name=source.name;result.userData=source.userData;
  for(const {material,geometries}of bins.values()){const geometry=mergeGeometries(geometries,false);const mesh=new T.Mesh(geometry,material);mesh.name=material.name;result.add(mesh);}return result;
}
await mkdir('public/models/city',{recursive:true});
const kit=new T.Group();kit.name='Manhattan_architecture_kit';for(let i=0;i<9;i++)kit.add(consolidate(kitBuilding(i)));
// A compact far-distance mesh preserves a lit facade without thousands of windows.
const distant=new T.Group();distant.name='Block_9';block(distant,{w:2,d:1.8,h:12,seed:909,style:2,detail:false});distant.userData={width:2,depth:1.8,height:12};kit.add(consolidate(distant));
const streetKit=new T.Group();for(const child of street().children)streetKit.add(consolidate(child));
for(const [name,source]of [['architecture-kit',kit],['empire-state',consolidate(empire())],['one-world-trade',consolidate(wtc())],['one-vanderbilt',consolidate(summit())],['hudson-yards-edge',consolidate(edge())],['one-times-square',consolidate(timesSquare())],['street-kit',streetKit]]){
  source.userData={...source.userData,author:'ELXR Creative',license:'Project original',format:'glTF 2.0',note:'Architectural interpretation, not a surveyed replica'};
  const data=await new GLTFExporter().parseAsync(source,{binary:true});
  const buffer=Buffer.from(data),jsonLength=buffer.readUInt32LE(12),json=JSON.parse(buffer.subarray(20,20+jsonLength).toString());
  const atlasMaterials=(json.materials??[]).filter(m=>m.name.startsWith('Facade_atlas_'));
  if(atlasMaterials.length){
    json.images=[{uri:'../../textures/manhattan-facades.png'}];json.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];json.textures=[{source:0,sampler:0}];
    for(const m of atlasMaterials){m.pbrMetallicRoughness.baseColorTexture={index:0};m.emissiveTexture={index:0};}
  }
  let text=Buffer.from(JSON.stringify(json));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]);
  const bin=buffer.subarray(20+jsonLength),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+text.length+bin.length,8);header.writeUInt32LE(text.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const output=Buffer.concat([header,text,bin]);await writeFile(`public/models/city/${name}.glb`,output);console.log(`${name}: ${(output.byteLength/1024).toFixed(0)} KB`);
}
