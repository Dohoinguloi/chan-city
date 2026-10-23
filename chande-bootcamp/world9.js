/* Chan City — đấu trường D-Day (cảnh 'dday:<trận>', SD.MU.dday 64×28): tường thành bao quanh, đường lát đá giữa (lane y 9–19) nối 2 nhà chính
   (Đội Xanh bên trái, Đội Đỏ bên phải), bãi cỏ 2 bên đường có cây, đá, cờ đội cắm dọc đường. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function buildDday(){ const D=SD.MU.dday, W=D.W, H=D.H, L=D.lane, obj=[], solid=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; }, block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{ if(y<=1||x<=1||y>=H-2||x>=W-2) return '0';
    if(y>=L.y0&&y<=L.y1) return A.hash(x,y,5)<.07?'P':'9';   // đường giữa lát đá, lốm đốm vài viên cát
    return A.hash(x>>1,y>>1,31)<.18?'P':'G'; }));
  D.bases.forEach((b,k)=>{ put(A.ddayBase(k,0),b.x,b.y+1.2,{anim:'ddbase'+k}); block(Math.floor(b.x)-1,Math.floor(b.y)-1,Math.floor(b.x)+1,Math.floor(b.y)); });   // nhà chính 2 đội
  for(let i=0;i<4;i++){ put(A.ddayFlag(0),14+i*4,L.y0-.3); put(A.ddayFlag(0),14+i*4,L.y1+1.6); put(A.ddayFlag(1),W-15-i*4,L.y0-.3); put(A.ddayFlag(1),W-15-i*4,L.y1+1.6); }
  for(const [x,y] of [[8,4],[20,5],[32,3.5],[44,5],[56,4],[8,24],[20,23],[32,24.5],[44,23],[56,24]]){ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[26,6],[38,22],[14,21],[50,6]]) put(A.rock(x|0),x,y);
  put(A.label('D-DAY · PHA NHA CHINH DOI THU','#2a2026','#ffd84a'),W/2,2.8,{flat:true}); put(A.label(D.bases[0].name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'D'),'#1e4a9a','#ffffff'),D.bases[0].x,D.bases[0].y+3.6,{flat:true});
  put(A.label(D.bases[1].name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'D'),'#8a1e1e','#ffffff'),D.bases[1].x,D.bases[1].y+3.6,{flat:true});
  const zones=[{name:'Đấu trường D-Day',x0:0,y0:0,x1:W-1,y1:H-1}];
  return {name:'MU · Đấu trường D-Day',W,H,grid:g,obj,solid,inter:[],zones,districts:[],spawn:{x:D.spawn[0].x*T,y:D.spawn[0].y*T}}; }
Object.assign(WORLD,{buildDday});
})();
