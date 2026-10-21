/* MATH DOORS — original procedural 3D asset library (Three.js r128)
   Objects are actual volumetric geometry, not billboard sprites.
   This file deliberately exports plain functions for the existing single-page game. */
(function () {
 'use strict';
 const T=window.THREE;
 if (!T) { console.error('THREE must load before procedural-props.js'); return; }
 const boxCache=new Map();
 const sphereCache=new Map();
 const MAT={
   wood:new T.MeshStandardMaterial({color:0x59351f,roughness:.73}),
   dark:new T.MeshStandardMaterial({color:0x24140f,roughness:.81}),
   edge:new T.MeshStandardMaterial({color:0x7a4930,roughness:.58}),
   panel:new T.MeshStandardMaterial({color:0x43271b,roughness:.65}),
   inner:new T.MeshStandardMaterial({color:0x1a110c,roughness:.95}),
   gold:new T.MeshStandardMaterial({color:0xc89a4b,metalness:.67,roughness:.32}),
   wornGold:new T.MeshStandardMaterial({color:0x79603b,metalness:.48,roughness:.5}),
   metal:new T.MeshStandardMaterial({color:0x3c4550,metalness:.72,roughness:.36}),
   textile:new T.MeshStandardMaterial({color:0x591725,roughness:.94}),
   cloth:new T.MeshStandardMaterial({color:0x303a4d,roughness:.9}),
   ivory:new T.MeshStandardMaterial({color:0xd1b78d,roughness:.85}),
   glass:new T.MeshStandardMaterial({color:0xffda93,emissive:0x5d350b,emissiveIntensity:.3,roughness:.2}),
   moss:new T.MeshStandardMaterial({color:0x2b4332,roughness:.95})
 };
 function cube(p,w,h,d,x,y,z,mat=MAT.wood){const k=[w,h,d].join(':');let g=boxCache.get(k);if(!g){g=new T.BoxGeometry(w,h,d);boxCache.set(k,g);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;p.add(m);return m;}
 function round(p,r,x,y,z,mat=MAT.gold){let g=sphereCache.get(r);if(!g){g=new T.SphereGeometry(r,10,8);sphereCache.set(r,g);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);p.add(m);return m;}
 function cyl(p,rt,rb,h,x,y,z,mat=MAT.wood,n=12){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),mat);m.position.set(x,y,z);p.add(m);return m;}
 function torus(p,r,t,x,y,z,mat=MAT.gold){const m=new T.Mesh(new T.TorusGeometry(r,t,6,20),mat);m.position.set(x,y,z);p.add(m);return m;}
 // Layered 3D framed panel; front plane faces +Z.
 function framedPanel(p,x,y,z,w,h,mat=MAT.panel,deep=.035){
   cube(p,w,h,deep,x,y,z,mat);
   const e=.047, d=.065;
   cube(p,w+e*2,e,d,x,y+h/2+e/2,z+deep/2+.015,MAT.edge);
   cube(p,w+e*2,e,d,x,y-h/2-e/2,z+deep/2+.015,MAT.edge);
   cube(p,e,h+e*2,d,x-w/2-e/2,y,z+deep/2+.015,MAT.edge);
   cube(p,e,h+e*2,d,x+w/2+e/2,y,z+deep/2+.015,MAT.edge);
 }
 function decorateDoorLeaf(leaf, w=2.4, h=3.6) {
   // Carved panel structure; keep top-center label unobstructed.
   // Part geometry on both faces so reverse view remains solid.
   for (const dir of [-1,1]){
     const side=new T.Group();side.position.z=dir*(.10);
     cube(side,.09,h-.12,.075,-w/2+.09,0,0,MAT.edge);
     cube(side,.09,h-.12,.075,w/2-.09,0,0,MAT.edge);
     cube(side,w-.20,.09,.075,0,h/2-.10,0,MAT.edge);
     cube(side,w-.20,.10,.075,0,-h/2+.10,0,MAT.edge);
     // Two inset, genuinely recessed-looking lower fields.
     for(const py of [-.85,-.05]){
       cube(side,w-.58,.59,.052,0,py,dir*.012,MAT.panel);
       cube(side,w-.52,.045,.087,0,py+.305,dir*.020,MAT.edge);
       cube(side,w-.52,.045,.087,0,py-.305,dir*.020,MAT.edge);
     }
     // Omit center of top field so the original mathematical door plaque remains legible.
     round(side,.10,w/2-.28,-.05,dir*.12,MAT.gold);
     leaf.add(side);
   }
 }
 function trimDoorFrame(parent,x,z,w=2.4,h=3.6){
   const g=new T.Group();g.position.set(x,0,z);
   for (const f of [-1,1]) {
     const d=f*.245;
     cube(g,.13,h+.19,.13,-w/2-.18,(h+.19)/2,d,MAT.edge);
     cube(g,.13,h+.19,.13,w/2+.18,(h+.19)/2,d,MAT.edge);
     cube(g,w+.60,.18,.19,0,h+.13,d,MAT.edge);
     cube(g,w+.70,.055,.23,0,h+.25,d,MAT.gold);
     cube(g,w+.59,.085,.17,0,.14,d,MAT.dark);
   }
   parent.add(g);return g;
 }
 function createWardrobe(roomCenterX,zCenter,onLeftWall=true){
   const group=new T.Group();
   // true cabinet volume, rear board, dark interior, ceiling & plinth
   cube(group,.10,3.35,2.06,-.56,1.69,0,MAT.wood);
   cube(group,1.20,3.3,.11,0,1.65,.98,MAT.edge);
   cube(group,1.20,3.3,.11,0,1.65,-.98,MAT.edge);
   cube(group,1.28,.13,2.10,0,3.31,0,MAT.dark);
   cube(group,1.37,.13,2.22,0,3.42,0,MAT.edge);
   cube(group,1.24,.12,2.08,0,.07,0,MAT.dark);
   cube(group,1.35,.16,2.18,0,.11,0,MAT.wood);
   cube(group,.035,2.85,1.86,-.502,1.75,0,MAT.inner);
   cube(group,.08,.09,1.76,-.11,2.82,0,MAT.gold); // hanger rail
   for(let i=0;i<3;i++){
     const z=-.49+i*.49;
     // hanging garment pieces, seen through open doors
     cube(group,.08,.68,.31,-.16,2.30,z, i%2?MAT.cloth:MAT.textile);
     cube(group,.15,.06,.10,-.13,2.74,z,MAT.wood);
   }
   // Hinges at cabinet open front x=.57, left and right halves along local Z
   function makeDoor(sign){
     const piv=new T.Group();piv.position.set(.59,1.70,sign*.94);
     cube(piv,.105,3.08,.92,0,0,-sign*.46,MAT.wood);
     for(const py of [-.80,.28]){
       const pz=-sign*.46;
       cube(piv,.025,.73,.69,.070,py,pz,MAT.panel);
       cube(piv,.048,.055,.76,.096,py+.40,pz,MAT.edge);
       cube(piv,.048,.055,.76,.096,py-.40,pz,MAT.edge);
       cube(piv,.050,.85,.04,.095,py,pz+sign*.39,MAT.edge);
       cube(piv,.050,.85,.04,.095,py,pz-sign*.39,MAT.edge);
     }
     // brass hardware and hinges
     round(piv,.065,.11,.0,-sign*.73,MAT.gold);
     for(const hy of [-1.08,1.08]) cube(piv,.07,.15,.045,-.01,hy,0,MAT.wornGold);
     group.add(piv);return piv;
   }
   const leftDoorPivot=makeDoor(1),rightDoorPivot=makeDoor(-1);
   for(const y of [.18,3.20]) cube(group,.08,.10,2.18,.62,y,0,MAT.gold);
   return {group,leftDoorPivot,rightDoorPivot,openAmount:0,targetOpen:0,facingRight:onLeftWall,
      worldX:roomCenterX,worldZ:zCenter,insideX:roomCenterX,outsideX:roomCenterX};
 }
 function createDrawer(worldX,worldZ,rotY,lootType){
   const group=new T.Group();
   // Desk has deep open cavity, not a printed rectangular sprite.
   cube(group,1.86,.13,1.07,0,1.11,0,MAT.edge);
   cube(group,1.79,.045,.99,0,1.19,0,MAT.dark);
   cube(group,1.77,.18,.98,0,.19,0,MAT.wood);
   for(const sx of [-.79,.79]){
     cube(group,.14,.82,1.0,sx,.70,0,MAT.wood);
     cube(group,.09,.74,1.02,sx,.70,.01,MAT.edge);
     cube(group,.17,.18,.95,sx,.11,0,MAT.dark);
   }
   cube(group,1.49,.82,.09,0,.71,-.47,MAT.dark);
   cube(group,1.48,.055,.93,0,.33,0,MAT.inner);
   // Carved structural bands on cabinet front sides.
   cube(group,1.8,.09,.12,0,1.08,.51,MAT.edge);
   const drawerMesh=new T.Group();drawerMesh.position.set(0,.70,.04);
   cube(drawerMesh,1.38,.055,.84,0,-.17,0,MAT.inner);  // actual bottom
   for(const dx of [-.68,.68]) cube(drawerMesh,.06,.36,.83,dx,0,0,MAT.wood);
   cube(drawerMesh,1.42,.37,.065,0,.0,-.42,MAT.wood); // back wall
   cube(drawerMesh,1.55,.42,.10,0,0,.45,MAT.edge);   // outward-facing front
   framedPanel(drawerMesh,0,.015,.505,1.27,.25,MAT.panel);
   round(drawerMesh,.064,0,.05,.56,MAT.gold);
   // hidden item: only visible after opening
   let itemMesh=null;
   if(lootType!=='none'){
     itemMesh=new T.Group();
     if(lootType==='key'){
       const ring=torus(itemMesh,.095,.021,-.12,.02,0,MAT.gold);ring.rotation.x=Math.PI/2;
       const stem=cube(itemMesh,.29,.035,.04,.06,.02,0,MAT.gold);
       cube(itemMesh,.045,.11,.04,.20,.02,.025,MAT.gold);
     }else if(lootType==='battery'){
       const body=cyl(itemMesh,.065,.065,.24,0,.025,0,MAT.metal);body.rotation.z=Math.PI/2;
       cyl(itemMesh,.035,.035,.015,.13,.025,0,MAT.gold).rotation.z=Math.PI/2;
     }else if(lootType==='medkit'){
       cube(itemMesh,.29,.13,.25,0,.04,0,MAT.textile);
       cube(itemMesh,.06,.014,.19,0,.115,0,MAT.ivory);
       cube(itemMesh,.17,.014,.06,0,.116,0,MAT.ivory);
     }else{const s=cyl(itemMesh,.042,.042,.28,0,.04,0,MAT.ivory);s.rotation.z=Math.PI/2;}
     itemMesh.position.set(0,-.09,-.03);itemMesh.visible=false;drawerMesh.add(itemMesh);
   }
   group.add(drawerMesh);group.rotation.y=rotY;
   return {group,drawerMesh,itemMesh,worldX,worldZ,opened:false,lootCollected:lootType==='none',openProgress:0,lootType};
 }
 function createTerminal(mode='stand'){
   const g=new T.Group();
   if(mode==='keypad'){
     cube(g,.51,.75,.16,0,0,0,MAT.metal);
     cube(g,.45,.68,.045,0,0,.11,MAT.dark);
     cube(g,.37,.22,.045,0,.21,.15,MAT.glass.clone());
     for(let i=0;i<9;i++){
       cube(g,.072,.065,.035,-.12+(i%3)*.12,.035-Math.floor(i/3)*.105,.17,i===8?MAT.gold:MAT.metal);
     }
     g.userData.screenMesh=g.children[2];
   }else{
     cyl(g,.20,.31,1.20,0,.60,0,MAT.metal,12);
     cube(g,.65,.17,.52,0,1.16,0,MAT.dark);
     const head=cube(g,.97,.61,.20,0,1.47,0,MAT.metal);
     head.rotation.x=-.37;
     const screen=cube(g,.76,.42,.065,0,1.48,.114,MAT.glass.clone());
     screen.rotation.x=-.37;
     // visual buttons below status screen
     for(let i=0;i<3;i++) round(g,.05,-.21+i*.21,1.18,.33,i===0?MAT.gold:MAT.metal);
     g.userData.screenMesh=screen;
   }
   // keep screen dynamically recolorable with `.material.color.setHex(...)`
   return g;
 }
 function createBridge(width=3.4,length=6){
   const group=new T.Group();
   // Individual timber planks, longitudinal joists and iron rivets
   for(let i=0;i<12;i++){
     const z=-length/2+(i+.5)*length/12;
     cube(group,width,.20,length/12-.035,0,0,z,i%3===0?MAT.edge:MAT.wood);
     for(const s of [-1,1]) round(group,.035,s*(width/2-.18),.12,z,MAT.wornGold);
   }
   for(const x of [-width/2+.16,width/2-.16]){
     cube(group,.20,.24,length,x,-.21,0,MAT.dark);
     for(let i=0;i<4;i++){
       const z=-length/2+(i+.1)*length/3.9;
       cube(group,.16,1.14,.16,x,.50,z,MAT.edge);
       round(group,.14,x,1.12,z,MAT.gold);
     }
     cube(group,.10,.10,length,x,1.05,0,MAT.edge);
   }
   return group;
 }
 function createGearLock(){
   const g=new T.Group();
   const plate=cube(g,2.8,2.8,.19,0,0,0,MAT.dark);
   for(let i=0;i<8;i++){
     const a=i*Math.PI/4;
     const m=cube(g,.28,.46,.17,Math.cos(a)*1.25,Math.sin(a)*1.25,.15,MAT.metal);
     m.rotation.z=a;
   }
   const ring=torus(g,1.06,.19,0,0,.15,MAT.gold);
   const inner=torus(g,.66,.075,0,0,.24,MAT.wornGold);
   for(let i=0;i<4;i++){
     const a=i*Math.PI/2;
     cube(g,1.14,.12,.11,0,0,.21,MAT.metal).rotation.z=a;
   }
   round(g,.22,0,0,.34,MAT.gold);
   return g;
 }
 function createBookshelf(){
   const g=new T.Group();
   cube(g,2.88,3.75,1.05,0,1.875,0,MAT.dark);
   cube(g,2.70,3.55,.12,0,1.88,-.42,MAT.wood);
   for(const x of [-1.33,1.33]) cube(g,.15,3.70,1.14,x,1.87,0,MAT.edge);
   for(const h of [.22,1.12,2.02,2.93,3.65]) cube(g,2.9,.11,1.16,0,h,0,MAT.edge);
   const colorMats=[0x452734,0x283947,0x544026,0x3b442a,0x67412d,0x444257].map(color=>new T.MeshStandardMaterial({color,roughness:.8}));
   for(let row=0;row<4;row++){
     let x=-1.17,i=0;
     while(x<1.12){
       const w=.12+((i*7+row*3)%3)*.025;
       const h=.63+((i*3+row)%4)*.04;
       const m=cube(g,w,h,.61,x+w/2,.28+row*.9+h/2,.10,colorMats[(i+row)%colorMats.length]);
       cube(g,w*.7,.025,.62,x+w/2,.43+row*.9,.10,MAT.gold);
       x+=w+.025;i++;
     }
   }
   return g;
 }
 // Lightweight grounded bookcase for the much larger Figure library.
 // 3D volume and shelves remain, but grouped book spines avoid hundreds of draw calls per shelf.
 function createLibraryShelfLite(){
   const g=new T.Group();
   cube(g,2.95,3.7,.85,0,1.85,-.05,MAT.dark);
   cube(g,2.8,3.45,.075,0,1.78,-.48,MAT.wood);
   for(const x of [-1.4,1.4]) cube(g,.15,3.7,1.05,x,1.85,0,MAT.edge);
   for(const h of [.18,1.04,1.93,2.81,3.64]) cube(g,2.95,.095,1.04,0,h,0,MAT.edge);
   const mats=[MAT.textile,MAT.cloth,MAT.moss,MAT.wood,MAT.panel];
   for(let row=0;row<4;row++){
     for(let b=0;b<6;b++){
       const w=.35 + ((row+b)%2)*.025;
       const height=.62+((row+b*3)%3)*.06;
       const x=-1.20+b*.43;
       cube(g,w,height,.57,x,.23+row*.89+height/2,.07,mats[(row+b)%mats.length]);
     }
   }
   return g; // ground anchor y=0, no floating offset needed
 }
 function createCrates(){
   const g=new T.Group();
   cube(g,1.70,1.70,1.70,0,.85,0,MAT.wood);
   for(const y of [.12,1.58]){
     cube(g,1.79,.11,1.79,0,y,0,MAT.dark);
   }
   for(const x of [-.78,.78]){
     cube(g,.12,1.7,1.78,x,.85,0,MAT.edge);
   }
   for(const z of [-.78,.78]){
     cube(g,1.76,1.7,.11,0,.85,z,MAT.edge);
     const brace=cube(g,.11,1.9,.07,0,.85,z+(z>0?.065:-.065),MAT.dark);brace.rotation.z=.80;
   }
   return g;
 }
 function makeStandingLamp(){
   const g=new T.Group();
   cyl(g,.19,.30,.17,0,.085,0,MAT.gold);
   cyl(g,.045,.065,2.10,0,1.18,0,MAT.wornGold);
   const shade=new T.Mesh(new T.CylinderGeometry(.33,.49,.67,12,1,false),MAT.ivory);
   shade.position.y=2.42;g.add(shade);
   cyl(g,.13,.13,.07,0,2.82,0,MAT.gold);
   const bulb=new T.PointLight(0xffbb6e,.35,4,2);bulb.position.set(0,2.37,0);g.add(bulb);
   return g;
 }
 function makeSideTable(){
   const g=new T.Group();
   cyl(g,.54,.58,.09,0,.97,0,MAT.edge,14);
   cyl(g,.12,.18,.94,0,.48,0,MAT.wood);
   cyl(g,.39,.39,.08,0,.07,0,MAT.dark);
   const pot=cyl(g,.26,.20,.30,0,1.16,0,MAT.ivory,10);
   for(let i=0;i<7;i++){
     const a=i*2.4;const leaf=new T.Mesh(new T.SphereGeometry(.16,7,6),MAT.moss);
     leaf.scale.set(.48,1.9,.58);leaf.position.set(Math.cos(a)*.18,1.46+Math.sin(i)*.06,Math.sin(a)*.18);g.add(leaf);
   }
   return g;
 }
 function makeClock(){
   const g=new T.Group();
   cube(g,.78,3.4,.48,0,1.7,0,MAT.dark);
   cube(g,.96,.14,.63,0,3.42,0,MAT.edge);
   cube(g,.91,.14,.63,0,.14,0,MAT.edge);
   const face=new T.Mesh(new T.CylinderGeometry(.33,.33,.035,24),MAT.ivory);
   face.rotation.x=Math.PI/2;face.position.set(0,2.77,.30);g.add(face);
   torus(g,.34,.045,0,2.77,.33,MAT.gold);
   for(let i=0;i<12;i++){
     const a=i*Math.PI/6;
     round(g,.024,Math.sin(a)*.26,2.77+Math.cos(a)*.26,.34,MAT.dark);
   }
   cube(g,.035,.20,.035,0,2.85,.37,MAT.dark);
   cube(g,.18,.035,.035,.09,2.76,.38,MAT.dark);
   torus(g,.20,.025,0,1.50,.29,MAT.gold);
   return g;
 }
 function makeWallSconce(){
   const g=new T.Group();
   cube(g,.25,.40,.09,0,0,0,MAT.dark);
   round(g,.13,0,0,.17,MAT.gold);
   cyl(g,.055,.07,.42,0,.25,.20,MAT.gold);
   const shade=new T.Mesh(new T.CylinderGeometry(.14,.23,.37,12),MAT.ivory);
   shade.position.set(0,.48,.20);g.add(shade);
   return g;
 }
 function decorateRoom(group,{arch,roomW,roomLen,zStart}){
   const extras=[];
   const add=(obj,x,z,angle=0,r=.65)=>{
     obj.position.set(x,0,z);obj.rotation.y=angle;group.add(obj);extras.push({x,z,r});
   };
   // Two volumetric wall lamps for layered lighting: wall-facing models with actual geometry
   for(const x of [-roomW/2+.20,roomW/2-.20]){
     const lamp=makeWallSconce();lamp.position.set(x,2.65,zStart-roomLen*.38);
     lamp.rotation.y=x<0?Math.PI/2:-Math.PI/2;group.add(lamp);
   }
   if(arch==='guest'||arch==='grandHall'){
     add(makeSideTable(),roomW/2-1.6,zStart-roomLen*.66,0,.65);
     if(arch==='grandHall') add(makeClock(),-roomW/2+1.0,zStart-roomLen*.82,Math.PI/2,.72);
   }else if(arch==='darkRoom'){
     add(makeStandingLamp(),roomW/2-1.32,zStart-roomLen*.64,0,.4);
   }else if(arch==='keySearch'){
     add(makeSideTable(),-roomW/2+1.65,zStart-roomLen*.50,0,.62);
   }else if(arch==='storage'){
     add(createCrates(),-roomW/2+1.4,zStart-roomLen*.78,0,1.1);
   }
   // Keep central walkway free; existing movement collision uses extras below.
   return extras;
 }
 window.MathDoorsProps={MAT,createWardrobe,createDrawer,createTerminal,createBridge,
   createGearLock,decorateDoorLeaf,trimDoorFrame,createBookshelf,createLibraryShelfLite,createCrates,decorateRoom};
})();
