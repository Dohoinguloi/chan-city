/* Chan City — Trung tâm Lính Cát (thị trấn Đà Bắc): quầy y tá hồi máu, máy hồi máu, Giáo sư Cát dạy kỹ năng + bàn 3 Bóng Cát khởi đầu,
   máy gửi giữ (đội mang theo tối đa 5 con), kệ hàng (bóng, thuốc, đá tiến hoá), logo bóng giữa sàn, ghế chờ, cây. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
function buildLinhCat(){ const I=SD.INTERIORS.linhcat, W=I.W, H=I.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||y===H-1||x===0||x===W-1?'6':'5'));
  put(A.label('TRUNG TAM LINH CAT','#d23a2e','#ffffff'),12,1.4,{flat:true});
  put(A.healMachine(0),16.6,3.6,{anim:'lcheal'}); block(15,2,18,2);
  put(A.lcCounter(112),12,5.2); block(9,4,15,4); act(SD.LINHCAT.at.nurse[0],SD.LINHCAT.at.nurse[1],'Quầy y tá: hồi máu Lính Cát (miễn phí)',{do:'lc:nurse'},28);
  put(A.starterTable(),5.4,9); block(4,8,7,8); act(SD.LINHCAT.at.starter[0],SD.LINHCAT.at.starter[1],'Bàn 3 Bóng Cát khởi đầu',{do:'lc:starter'},26);
  put(A.pcBox(0),20.4,4.6,{anim:'lcpc'}); block(20,3,21,3); act(SD.LINHCAT.at.box[0],SD.LINHCAT.at.box[1],'Máy gửi giữ Lính Cát',{do:'lc:box'},24);
  put(A.lcShelf(),20.4,9.4); block(19,7,21,8); act(SD.LINHCAT.at.shop[0],SD.LINHCAT.at.shop[1],'Kệ hàng: Bóng Cát, thuốc, đá tiến hoá',{do:'lc:shop'},26);
  put(A.lcEmblem(),12,10.6,{flat:true});
  for(const [x,y] of [[4,13.2],[20,13.2]]){ put(A.bench(),x,y); }
  for(const [x,y] of [[1.8,3.4],[22.2,3.4],[1.8,14.4],[22.2,14.4]]){ put(A.pottedFern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  act(W/2,H-.7,'Ra ngoài',{do:'exit'},24);
  return {name:I.name,W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:I.spawn.x*T,y:I.spawn.y*T},indoor:true,music:'music_room'}; }
Object.assign(WORLD,{buildLinhCat});
})();
