/* MATH DOORS — original procedural 3D asset library (Three.js r128)
   Objects are actual volumetric geometry, not billboard sprites.
   This file deliberately exports plain functions for the existing single-page game. */
(function () {
 'use strict';
 const T=window.THREE;
 if (!T) { console.error('THREE must load before procedural-props.js'); return; }
 const boxCache=new Map();
 const G={}; // shared prop geometries (rooms are disposed; shared geometry is never re-created)
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
 // ---- V5.1 품질: 모서리가 둥근 상자 (딱딱한 직육면체 대신 빛을 받는 모서리) ----
 // three.js examples RoundedBoxGeometry(MIT)와 같은 방식: 분할된 단위 상자의 꼭짓점을 안쪽 상자 + 반지름 방향으로 밀어낸다.
 function roundedBoxGeometry(w,h,d,radius,seg=2){
   const s2=seg*2+1;
   radius=Math.min(w/2,h/2,d/2,radius);
   const base=new T.BoxGeometry(1,1,1,s2,s2,s2).toNonIndexed();
   const pos=base.attributes.position.array, nor=base.attributes.normal.array;
   const half=.5/s2, inner=new T.Vector3(w/2-radius,h/2-radius,d/2-radius), n=new T.Vector3();
   for(let i=0;i<pos.length;i+=3){
     const px=pos[i],py=pos[i+1],pz=pos[i+2];
     n.set(px-Math.sign(px)*half,py-Math.sign(py)*half,pz-Math.sign(pz)*half).normalize();
     pos[i]=inner.x*Math.sign(px)+n.x*radius; pos[i+1]=inner.y*Math.sign(py)+n.y*radius; pos[i+2]=inner.z*Math.sign(pz)+n.z*radius;
     nor[i]=n.x; nor[i+1]=n.y; nor[i+2]=n.z;
   }
   base.attributes.position.needsUpdate=true; base.attributes.normal.needsUpdate=true;
   base.computeBoundingSphere();
   return base;
 }
 const rboxCache=new Map();
 function roundedBox(w,h,d,r){
   const k=[w.toFixed(3),h.toFixed(3),d.toFixed(3),r.toFixed(3)].join(':');let g=rboxCache.get(k);
   if(!g){g=roundedBoxGeometry(w,h,d,r,1);rboxCache.set(k,g);}return g;
 }
 // 가장 얇은 변이 4cm 이상인 조각은 모서리를 살짝 둥글게 (얇은 판·책등은 그대로 → 정점 수 절약)
 function bevelFor(w,h,d){const m=Math.min(w,h,d);return m>=.04?Math.min(.035,m*.22):0;}
 // ---- V5.1 품질: 공유 재질에 나뭇결·직물·금속 결 텍스처 (밝은 회색 → 재질 색에 곱해짐) ----
 function detailTex(kind){
   const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
   let seed=kind.length*977+13;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
   x.fillStyle='#e6e6e6';x.fillRect(0,0,256,256);
   if(kind==='wood'){
     for(let i=0;i<70;i++){const y=rnd()*256,a=.05+rnd()*.12,amp=2+rnd()*6,fr=.01+rnd()*.03;
       x.strokeStyle=`rgba(${rnd()<.5?40:255},${rnd()<.5?25:235},10,${a})`;x.lineWidth=.6+rnd()*2.2;x.beginPath();
       for(let u=0;u<=256;u+=8)x.lineTo(u,y+Math.sin(u*fr+i)*amp);x.stroke();}
     for(let i=0;i<4;i++){const cx=rnd()*256,cy=rnd()*256;for(let r=2;r<16;r+=2.5){x.strokeStyle=`rgba(40,22,8,${.18-r*.009})`;x.lineWidth=1;x.beginPath();x.ellipse(cx,cy,r*2.4,r*.7,0,0,Math.PI*2);x.stroke();}}
   } else if(kind==='stone'){
     for(let i=0;i<40;i++){const cx=rnd()*256,cy=rnd()*256,r=8+rnd()*40;const g=x.createRadialGradient(cx,cy,0,cx,cy,r);const v=rnd()<.5?0:255;g.addColorStop(0,`rgba(${v},${v},${v},${.05+rnd()*.08})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);}
     x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1;
     for(let i=0;i<7;i++){let cx=rnd()*256,cy=rnd()*256;x.beginPath();x.moveTo(cx,cy);for(let k=0;k<7;k++){cx+=(rnd()-.5)*34;cy+=(rnd()-.5)*34;x.lineTo(cx,cy);}x.stroke();}
     for(let i=0;i<900;i++){x.fillStyle=`rgba(0,0,0,${rnd()*.18})`;x.fillRect(rnd()*256,rnd()*256,1.5,1.5);}
   } else if(kind==='fabric'){
     for(let y=0;y<256;y+=2){x.fillStyle=`rgba(0,0,0,${.05+rnd()*.06})`;x.fillRect(0,y,256,1);}
     for(let u=0;u<256;u+=2){x.fillStyle=`rgba(255,255,255,${.03+rnd()*.05})`;x.fillRect(u,0,1,256);}
   } else {
     for(let i=0;i<260;i++){const y=rnd()*256;x.fillStyle=`rgba(${rnd()<.5?0:255},${rnd()<.5?0:255},${rnd()<.5?0:255},${.04+rnd()*.07})`;x.fillRect(0,y,256,.6+rnd());}
     for(let i=0;i<30;i++){x.strokeStyle=`rgba(255,255,255,${.06+rnd()*.1})`;x.lineWidth=.7;x.beginPath();const sx=rnd()*256,sy=rnd()*256;x.moveTo(sx,sy);x.lineTo(sx+rnd()*60-30,sy+rnd()*14-7);x.stroke();}
   }
   const id=x.getImageData(0,0,256,256),dd=id.data;for(let i=0;i<dd.length;i+=4){const v=(rnd()-.5)*18;dd[i]+=v;dd[i+1]+=v;dd[i+2]+=v;}x.putImageData(id,0,0);
   const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
 }
 try{
   const wt=detailTex('wood'),ft=detailTex('fabric'),mt=detailTex('metal'),st=detailTex('stone');
   MAT.stone=new T.MeshStandardMaterial({color:0x6d6a66,roughness:.9,map:st,bumpMap:st,bumpScale:.03});
   MAT.stoneDark=new T.MeshStandardMaterial({color:0x3e3b39,roughness:.92,map:st,bumpMap:st,bumpScale:.03});
   MAT.bronze=new T.MeshStandardMaterial({color:0x8a6236,metalness:.7,roughness:.38,map:mt});
   ['wood','dark','edge','panel'].forEach(k=>{MAT[k].map=wt;MAT[k].bumpMap=wt;MAT[k].bumpScale=.012;MAT[k].needsUpdate=true;});
   ['textile','cloth'].forEach(k=>{MAT[k].map=ft;MAT[k].needsUpdate=true;});
   ['metal'].forEach(k=>{MAT[k].map=mt;MAT[k].roughnessMap=mt;MAT[k].needsUpdate=true;});
 }catch(e){console.warn('detail textures skipped',e);}
 function cube(p,w,h,d,x,y,z,mat=MAT.wood){const r=bevelFor(w,h,d);let g;if(r>0)g=roundedBox(w,h,d,r);else{const k=[w,h,d].join(':');g=boxCache.get(k);if(!g){g=new T.BoxGeometry(w,h,d);boxCache.set(k,g);}}const m=new T.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;p.add(m);return m;}
 function round(p,r,x,y,z,mat=MAT.gold){let g=sphereCache.get(r);if(!g){g=new T.SphereGeometry(r,10,8);sphereCache.set(r,g);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);p.add(m);return m;}
 const cylCache=new Map(),torCache=new Map();
 function cyl(p,rt,rb,h,x,y,z,mat=MAT.wood,n=12){const k=[rt,rb,h,n].join(':');let g=cylCache.get(k);if(!g){g=new T.CylinderGeometry(rt,rb,h,n);cylCache.set(k,g);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);p.add(m);return m;}
 function torus(p,r,t,x,y,z,mat=MAT.gold){const k=r+':'+t;let g=torCache.get(k);if(!g){g=new T.TorusGeometry(r,t,6,20);torCache.set(k,g);}const m=new T.Mesh(g,mat);m.position.set(x,y,z);p.add(m);return m;}
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
     if(lootType==='key' && SEASON_ITEM.v===2){
       // 퓨즈: 유리관 + 구리 마개 + 안쪽 주황 필라멘트
       const glass=cyl(itemMesh,.05,.05,.2,0,.04,0,MAT.glass,12);glass.rotation.z=Math.PI/2;
       for(const x of [-.12,.12]){const cap=cyl(itemMesh,.056,.056,.05,x,.04,0,MAT.gold,12);cap.rotation.z=Math.PI/2;}
     }else if(lootType==='key' && SEASON_ITEM.v===3){
       // 룬 조각: 빛나는 청록 수정
       const rune=new T.Mesh(new T.OctahedronGeometry(.1),new T.MeshStandardMaterial({color:0x0e5560,emissive:0x2fe6ff,emissiveIntensity:1.2,roughness:.3}));
       rune.scale.y=1.5;rune.position.y=.08;itemMesh.add(rune);
     }else if(lootType==='key'){
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
   // Books are InstancedMesh batches (one draw call per colour) instead of ~100 separate meshes.
   const g=new T.Group();
   cube(g,2.88,3.75,1.05,0,1.875,0,MAT.dark);
   cube(g,2.70,3.55,.12,0,1.88,-.42,MAT.wood);
   for(const x of [-1.33,1.33]) cube(g,.15,3.70,1.14,x,1.87,0,MAT.edge);
   for(const h of [.22,1.12,2.02,2.93,3.65]) cube(g,2.9,.11,1.16,0,h,0,MAT.edge);
   if(!createBookshelf.mats){
     createBookshelf.mats=[0x452734,0x283947,0x544026,0x3b442a,0x67412d,0x444257].map(color=>new T.MeshStandardMaterial({color,roughness:.8}));
     createBookshelf.unit=new T.BoxGeometry(1,1,1);
   }
   const mats=createBookshelf.mats, unit=createBookshelf.unit;
   const books=mats.map(()=>[]), strips=[];
   for(let row=0;row<4;row++){
     let x=-1.17,i=0;
     while(x<1.12){
       const w=.12+((i*7+row*3)%3)*.025;
       const h=.63+((i*3+row)%4)*.04;
       books[(i+row)%mats.length].push([x+w/2,.28+row*.9+h/2,.10,w,h,.61]);
       strips.push([x+w/2,.43+row*.9,.10,w*.7,.025,.62]);
       x+=w+.025;i++;
     }
   }
   const m4=new T.Matrix4(),q=new T.Quaternion(),pos=new T.Vector3(),sc=new T.Vector3();
   const batch=(list,mat)=>{ if(!list.length) return; const im=new T.InstancedMesh(unit,mat,list.length);
     list.forEach((b,k)=>{pos.set(b[0],b[1],b[2]);sc.set(b[3],b[4],b[5]);m4.compose(pos,q,sc);im.setMatrixAt(k,m4);});
     im.instanceMatrix.needsUpdate=true; g.add(im); };
   books.forEach((list,k)=>batch(list,mats[k]));
   batch(strips,MAT.gold);
   return g;
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
   const shade=new T.Mesh(G.lampShade||(G.lampShade=new T.CylinderGeometry(.33,.49,.67,12,1,false)),MAT.ivory);
   shade.position.y=2.42;g.add(shade);
   cyl(g,.13,.13,.07,0,2.82,0,MAT.gold);
   // emissive bulb instead of a PointLight: keeps the scene light count constant (no shader recompiles)
   round(g,.12,0,2.30,0,MAT.glass);
   return g;
 }
 function makeSideTable(){
   const g=new T.Group();
   cyl(g,.54,.58,.09,0,.97,0,MAT.edge,14);
   cyl(g,.12,.18,.94,0,.48,0,MAT.wood);
   cyl(g,.39,.39,.08,0,.07,0,MAT.dark);
   const pot=cyl(g,.26,.20,.30,0,1.16,0,MAT.ivory,10);
   for(let i=0;i<7;i++){
     const a=i*2.4;const leaf=new T.Mesh(G.leaf||(G.leaf=new T.SphereGeometry(.16,7,6)),MAT.moss);
     leaf.scale.set(.48,1.9,.58);leaf.position.set(Math.cos(a)*.18,1.46+Math.sin(i)*.06,Math.sin(a)*.18);g.add(leaf);
   }
   return g;
 }
 function makeClock(){
   const g=new T.Group();
   cube(g,.78,3.4,.48,0,1.7,0,MAT.dark);
   cube(g,.96,.14,.63,0,3.42,0,MAT.edge);
   cube(g,.91,.14,.63,0,.14,0,MAT.edge);
   const face=new T.Mesh(G.clockFace||(G.clockFace=new T.CylinderGeometry(.33,.33,.035,24)),MAT.ivory);
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
   const shade=new T.Mesh(G.sconceShade||(G.sconceShade=new T.CylinderGeometry(.14,.23,.37,12)),MAT.ivory);
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
 // ---- V5.2: 출구를 막는 '봉인 석문' (예전: 회색 상자). 전체 폭 w, 높이 h, 두께 d, 바닥 중심이 원점 ----
 function createMonolith(w=2.8,h=3.8,d=1.1){
   const g=new T.Group();
   const S=MAT.stone||MAT.dark, SD=MAT.stoneDark||MAT.dark, BR=MAT.bronze||MAT.gold;
   const rune=new T.MeshStandardMaterial({color:0x330a08,emissive:0xff3b2f,emissiveIntensity:1.4,roughness:.4});
   cube(g,w,.22,d,0,.11,0,SD);                                  // 받침
   const sw=w-.24, sh=h-.62, sd=d-.24;
   cube(g,sw,sh,sd,0,.22+sh/2,0,S);                           // 석판 본체
   cube(g,w,.2,d,0,h-.3,0,SD); cube(g,w-.14,.12,d-.12,0,h-.12,0,S);   // 처마 몰딩
   for(const f of [-1,1]){
     const z=f*(sd/2+.02);
     // 테두리 띠 + 안쪽으로 들어간 판
     cube(g,sw-.1,.16,.08,0,.22+sh-.2,z,SD); cube(g,sw-.1,.16,.08,0,.42,z,SD);
     cube(g,.16,sh-.4,.08,-sw/2+.13,.22+sh/2,z,SD); cube(g,.16,sh-.4,.08,sw/2-.13,.22+sh/2,z,SD);
     // 청동 원판 + 고리 + 빛나는 '÷' 문양
     const cy=.22+sh*.56;
     const disk=cyl(g,.62,.62,.07,0,cy,z+f*.03,BR,28); disk.rotation.x=Math.PI/2;
     const ring=torus(g,.66,.05,0,cy,z+f*.06,BR); 
     const bar=cube(g,.62,.09,.04,0,cy,z+f*.08,rune);
     round(g,.075,0,cy+.22,z+f*.08,rune); round(g,.075,0,cy-.22,z+f*.08,rune);
     // 작은 수학 기호 장식 (+, ×, =)
     cube(g,.22,.05,.03,-sw/2+.48,.22+sh*.86,z+f*.03,BR); cube(g,.05,.22,.03,-sw/2+.48,.22+sh*.86,z+f*.03,BR);
     const x1=cube(g,.24,.05,.03,sw/2-.48,.22+sh*.86,z+f*.03,BR); x1.rotation.z=Math.PI/4;
     const x2=cube(g,.24,.05,.03,sw/2-.48,.22+sh*.86,z+f*.03,BR); x2.rotation.z=-Math.PI/4;
     cube(g,.24,.05,.03,0,.22+sh*.2+.05,z+f*.03,BR); cube(g,.24,.05,.03,0,.22+sh*.2-.05,z+f*.03,BR);
     // 리벳
     for(const rx of [-sw/2+.13,sw/2-.13]) for(const ry of [.55,.22+sh/2,.22+sh-.32]) round(g,.045,rx,ry,z+f*.05,BR);
   }
   // 쇠띠 두 줄 (옆면까지 감쌈)
   for(const y of [.22+sh*.28,.22+sh*.78]){ cube(g,sw+.06,.1,sd+.06,0,y,0,MAT.metal); }
   // 바닥 굴림대 (옆으로 밀려나는 장치임을 보여 줌)
   for(const rz of [-d/2+.18,d/2-.18]) for(const rx of [-w/2+.35,0,w/2-.35]){ const c=cyl(g,.09,.09,.18,rx,.09,rz,BR,10); c.rotation.x=Math.PI/2; }
   g.userData.rune=rune;
   return g;
 }
 // 중앙 홀 받침대·석상 (예전: 상자+원기둥+공)
 function createPedestal(w,h,d){
   const g=new T.Group(); const S=MAT.stone||MAT.dark, SD=MAT.stoneDark||MAT.dark, BR=MAT.bronze||MAT.gold;
   cube(g,w,.2,d,0,.1,0,SD); cube(g,w-.16,h-.38,d-.16,0,.2+(h-.38)/2,0,S); cube(g,w,.18,d,0,h-.09,0,SD);
   for(const f of [-1,1]){ cube(g,w-.5,.06,.04,0,h*.5,f*(d/2-.06),BR); cube(g,.06,h-.7,.04,-w/2+.3,h*.5,f*(d/2-.06),BR); cube(g,.06,h-.7,.04,w/2-.3,h*.5,f*(d/2-.06),BR); }
   const col=cyl(g,.42,.55,2.2,0,h+1.1,0,S,24);
   cyl(g,.62,.62,.16,0,h+.08,0,SD,24); cyl(g,.56,.5,.14,0,h+2.25,0,SD,24);
   for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const f=cube(g,.06,1.9,.06,Math.cos(a)*.47,h+1.1,Math.sin(a)*.47,SD); }
   const orb=new T.Mesh(new T.SphereGeometry(.55,24,16),new T.MeshStandardMaterial({color:0xc89a4b,metalness:.75,roughness:.28}));
   orb.position.set(0,h+2.85,0); g.add(orb);
   torus(g,.62,.035,0,h+2.85,0,BR).rotation.x=Math.PI/2;
   return g;
 }
 const SEASON_ITEM={v:1};
 window.MathDoorsProps={SEASON_ITEM,MAT,createMonolith,createPedestal,createWardrobe,createDrawer,createTerminal,createBridge,
   createGearLock,decorateDoorLeaf,trimDoorFrame,createBookshelf,createCrates,decorateRoom,
   makeStandingLamp,makeSideTable,makeClock,makeWallSconce,cube,round,cyl,torus,roundedBox,bevelFor,detailTex};
})();
