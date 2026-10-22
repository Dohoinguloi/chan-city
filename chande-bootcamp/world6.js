/* Chan City — Lavi Studio (TP.HCM): tường chữ + bảng lưới + kệ sách mẫu chữ trên tường, 3 bàn iMac, góc vibe code, màn chiếu,
   khu nghỉ có sofa, ổ nằm và bát ăn của Gấu, Luna. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
function buildLavi(){ const L=SD.LAVI, W=L.W, H=L.H, K=kit(), {put,block,act}=K, sp=L.spots;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||y===H-1||x===0||x===W-1?'8':'7'));
  put(A.laviSign(),16,1.7,{flat:true});
  put(A.typeWall(),7.6,3.9,{flat:true}); block(5,2,10,2); put(A.gridBoard(),15.6,3.9,{flat:true}); block(14,2,17,2); put(A.specimenShelf(),24,4.2); block(23,2,25,3);
  L.desks.forEach(([x,y],i)=>{ put(A.imacDesk(i),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); put(A.meshChair(i%2?'#b8a0e8':'#2a2436'),x,y+1.3); });
  put(A.vibeDesk(0),26.4,10.4,{anim:'lvvibe'}); block(25,9,28,9); put(A.laviScreen(0),4.6,10.2,{anim:'lvscreen'}); block(3,8,6,9);
  put(A.dogBed('#b8a0e8'),L.muc.x,L.muc.y+1,{flat:true}); put(A.dogBed('#ffd84a'),L.bo.x,L.bo.y+1,{flat:true}); put(A.dogBowl(),sp.bowl.x,sp.bowl.y-.4);
  put(A.sofa('#b8a0e8',72),20,17.2); block(18,16,22,16);
  for(const [x,y] of [[1.8,3.6],[30.2,3.6],[1.8,20.4],[30.2,20.4],[29.6,14.4]]){ put(A.pottedFern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [k,o] of Object.entries(sp)) act(o.x,o.y,o.label,{do:'lv:spot',k},k==='door'?16:22);
  put(A.label('LAVI STUDIO','#2a2436','#e8dcff'),16,21.4,{flat:true}); act(16,21.3,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'Lavi Studio · TP.HCM',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:L.spawn.x*T,y:L.spawn.y*T},indoor:true}; }
Object.assign(WORLD,{buildLavi});
})();
