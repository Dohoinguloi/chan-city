/* Chan City — Group Nghiện Motion (Hà Nội). Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
const plant=(K,x,y)=>{ K.put(A.pottedFern(),x,y); K.block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); };

/* trên: TV lớn logo, cửa sổ đêm nhìn phố, bảng kanban, kệ mô hình · giữa: 2 dãy bàn làm motion · phải: bàn lắp Gunpla + Gundam
   dưới trái: góc chơi game + Evangelion, ghế lười · dưới phải: phòng xông hơi chung (vách gỗ, cửa trái, ghế 2 tầng, bếp đá) */
function buildNghienMotion(){ const N=SD.NMOTION, W=N.W, H=N.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||y===H-1||x===0||x===W-1?'j':'x')); const m=Math.floor(W/2); g[H-1][m-1]='x'; g[H-1][m]='x';
  const Z=N.sauna; for(let y=Z.y0+1;y<=Z.y1;y++) for(let x=Z.x0+1;x<=Z.x1;x++) g[y][x]='t';
  put(A.nmTV(0),N.tv.x,N.tv.y,{flat:true,anim:'nmtv'}); put(A.nightWindow(128),15.6,1.9,{flat:true});
  act(N.tv.x,3.4,'TV lớn: chiếu showreel',{do:'nm:tv'},34);
  put(A.kanban(),N.kanban.x,N.kanban.y); block(23,4,25,4); act(N.kanban.x,N.kanban.y+.9,'Bảng kanban của group',{do:'nm:kanban'},24);
  put(A.figShelf(),N.shelf.x,N.shelf.y); block(29,3,31,4);
  N.desks.forEach(([x,y],i)=>{ put(A.nmDesk(i),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); put(A.meshChair(i%2?'#26262c':'#2a3352'),x,y+1.3); act(x,y+.9,'Bàn làm motion',{do:'nm:desk',i},18); });
  put(A.modelTable(),N.model.x,N.model.y); block(25,10,27,10); act(N.model.x,N.model.y+.9,'Bàn lắp mô hình Gunpla',{do:'nm:model'},24);
  put(A.gameCorner(0),N.game.x,N.game.y,{anim:'nmgame'}); block(4,16,7,17); act(N.game.x,N.game.y+.9,'Góc chơi game đối kháng',{do:'nm:game'},26);
  put(A.drinkFridge('#d2232e'),N.snack.x-1.6,N.snack.y-.9); put(A.snackRack(0),N.snack.x+1.2,N.snack.y-.9,{anim:'snack'}); block(Math.floor(N.snack.x)-3,Math.floor(N.snack.y)-2,Math.floor(N.snack.x)+2,Math.floor(N.snack.y)-2);
  act(N.snack.x,N.snack.y,'Tủ Sting & mì gói',{do:'nm:snack'},30);
  put(A.beanbag('#7a3ab0'),4.4,20.6); put(A.beanbag('#5fe06a'),7.6,20.8);
  // phòng xông hơi: vách gỗ trên + phải sẵn là tường; vách trái có cửa ở dưới
  put(A.saunaWall(176),27.5,Z.y0+.9); block(Z.x0,Z.y0,Z.x1,Z.y0); put(A.saunaWallV(64),Z.x0+.25,Z.y0+4.9); block(Z.x0,Z.y0,Z.x0,Z.y0+3);
  put(A.label('PHONG XONG HOI CHUNG','#5a3a1e','#ffe0b0'),27.5,Z.y0+.2,{flat:true});
  N.benches.forEach(([x,y])=>{ put(A.saunaBench(112),x,y); act(x,y+.6,'Ngồi xông hơi',{do:'nm:sauna'},40); });
  put(A.saunaHeater(0),N.heater.x,N.heater.y,{anim:'heater'}); block(30,20,31,20); put(A.bucket(),28.4,21.4);
  // robot khắp phòng: kệ treo tường cạnh TV, tủ kính, tượng Zaku (cửa ra) + Optimus (cạnh kanban), robot tí hon trên mỗi bàn, Haro lăn ở góc game
  put(A.robotWall(),9.7,2.6,{flat:true}); put(A.toyCabinet(),3.4,10.4); block(2,8,4,9); act(3.4,11.2,'Tủ kính mô hình robot',{do:'nm:toys'},22);
  put(A.zakuStatue(0),13.4,22.6,{anim:'zaku'}); block(12,21,14,21); act(13.4,22.9,'Tượng Zaku II cỡ người',{do:'nm:zaku'},20);
  put(A.optimusStatue(),27.4,4.8); block(26,3,28,3); act(27.4,5.2,'Tượng Optimus Prime',{do:'nm:optimus'},22);
  const TOYS=['rx','zaku','eva01','opt','wing','char']; N.desks.forEach(([x,y],i)=>put(A.deskToy(TOYS[i]),x+(i%2?1.05:-1.05),y-.7,{sort:Math.round(y*T)+1}));
  put(A.deskToy('haro'),N.model.x+1.1,N.model.y-.7,{sort:Math.round(N.model.y*T)+1}); put(A.haro(0),2.6,18.6,{anim:'haro'}); put(A.haro(0),20.8,16.4,{anim:'haro'});
  for(const [x,y] of [[1.8,4.6],[1.8,13.6],[20.6,4.6],[20.6,21.4],[1.8,22.4]]) plant(K,x,y);
  put(A.label('GROUP NGHIEN MOTION','#1c2238','#7fd0ff'),17,23.4,{flat:true}); act(17,23.3,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'Group Nghiện Motion · Hà Nội',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:N.spawn.x*T,y:N.spawn.y*T},indoor:true}; }

Object.assign(WORLD,{buildNghienMotion});
})();
