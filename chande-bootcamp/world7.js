/* Chan City — MU Online · Lục Địa Cát: tường thành 2 bên + phía Bắc, quảng trường lát đá, đài phun nước giữa, đền triệu hồi boss phía Bắc
   (vòng phù chú + cột đuốc), cờ 3 class, quầy Pháp sư Cát, Vệ binh ở cổng; cổng Nam để gọi Grab ra. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
function buildMU(){ const M=SD.MU, W=M.W, H=M.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||x<=1||x>=W-2?'0':(x<5||x>W-6||y>H-4)?'G':'9'));
  for(let x=19;x<=24;x++){ g[H-1][x]='9'; g[H-2][x]='9'; g[H-3][x]='9'; }
  const al=M.altar; put(A.muAltar(0),al.x,al.y+2.5,{flat:true,anim:'mualtar'});
  for(const [x,y] of [[13,4],[31,4],[13,11],[31,11]]){ put(A.muTorch(0),x,y,{anim:'mutorch'}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.muFountain(0),M.fountain.x,M.fountain.y,{anim:'mufount'}); block(20,13,23,15);
  [['#c8302a',9],['#f2c43d',22],['#3a6ad8',35]].forEach(([c,x])=>{ put(A.muBanner(c),x,3.2,{flat:true}); });
  put(A.muStall(),30.6,19.2); block(29,17,32,18);
  for(const [x,y] of [[3,6],[3,12],[3,18],[40,6],[40,12],[40,18],[3,24],[40,24]]){ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.label('MU ONLINE · LUC DIA CAT','#2a2026','#ffd84a'),22,26.4,{flat:true}); act(22,28.4,'Ra khỏi game (gọi Grab)',{do:'grab'},26);
  return {name:'MU Online · Lục Địa Cát',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:M.spawn.x*T,y:M.spawn.y*T}}; }
Object.assign(WORLD,{buildMU});
})();
