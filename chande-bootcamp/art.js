/* Chande Bootcamp — pixel art vẽ bằng code.
   Cùng ngôn ngữ với nhân vật ref: viền đen 1px (#1c1516), mỗi khối 2–3 tông, sáng trên-trái.
   Tile 16×16. Đồ vật trả về {c: canvas, ax, ay}: (ax, ay) là điểm chân (giữa cạnh dưới) trong canvas. */
(function(){
const OUT='#1c1516', T=16;
const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
function hash(x,y,s=0){ let h=(x*374761393+y*668265263+s*1442695041)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; }
function rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }

// thêm viền 1px quanh mọi pixel có màu (như ref)
function outline(c,col=OUT){
  const g=c.getContext('2d'), w=c.width, h=c.height, im=g.getImageData(0,0,w,h), d=im.data, a=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++) a[i]=d[i*4+3]>40?1:0;
  const [r,gg,b]=rgb(col);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=y*w+x; if(a[i]) continue;
    if((x>0&&a[i-1])||(x<w-1&&a[i+1])||(y>0&&a[i-w])||(y<h-1&&a[i+w])){ d[i*4]=r; d[i*4+1]=gg; d[i*4+2]=b; d[i*4+3]=255; } }
  g.putImageData(im,0,0); return c;
}
function painter(g){
  const px=(x,y,c)=>{ g.fillStyle=c; g.fillRect(x|0,y|0,1,1); };
  const rect=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(x|0,y|0,w|0,h|0); };
  const disc=(cx,cy,r,c)=>{ g.fillStyle=c; for(let y=-r;y<=r;y++){ const s=Math.floor(Math.sqrt(r*r-y*y+r*.6)); g.fillRect((cx-s)|0,(cy+y)|0,2*s+1,1); } };
  return {px,rect,disc};
}
function sprite(w,h,ax,ay,fn,ol=true){ const c=cv(w,h), g=c.getContext('2d'); fn(g,painter(g)); if(ol) outline(c); return {c,ax:Math.floor(ax),ay:Math.floor(ay)}; }   // neo pixel nguyên: chữ, viền không bị nhoè

/* ---------- Chữ biển hiệu 3×5 ---------- */
const GL={A:['.X.','X.X','XXX','X.X','X.X'],B:['XX.','X.X','XX.','X.X','XX.'],C:['.XX','X..','X..','X..','.XX'],D:['XX.','X.X','X.X','X.X','XX.'],
  E:['XXX','X..','XX.','X..','XXX'],H:['X.X','X.X','XXX','X.X','X.X'],I:['X','X','X','X','X'],K:['X.X','X.X','XX.','X.X','X.X'],
  M:['X...X','XX.XX','X.X.X','X...X','X...X'],N:['X..X','XX.X','X.XX','X..X','X..X'],O:['.X.','X.X','X.X','X.X','.X.'],
  P:['XX.','X.X','XX.','X..','X..'],R:['XX.','X.X','XX.','X.X','X.X'],T:['XXX','.X.','.X.','.X.','.X.'],U:['X.X','X.X','X.X','X.X','XXX'],
  G:['.XX','X..','X.X','X.X','.XX'],L:['X..','X..','X..','X..','XXX'],Y:['X.X','X.X','.X.','.X.','.X.'],' ':['..','..','..','..','..']};
function textW(s){ return [...s].reduce((a,ch,i)=>a+(GL[ch==='É'?'E':ch]||GL[' '])[0].length+(i?1:0),0); }
function drawText(g,s,x,y,col){ g.fillStyle=col; let cx=x;
  for(const ch of s){ const key=ch==='É'?'E':ch, gl=GL[key]||GL[' '];
    gl.forEach((r,dy)=>[...r].forEach((c,dx)=>{ if(c==='X') g.fillRect(cx+dx,y+dy,1,1); }));
    if(ch==='É'){ g.fillRect(cx+2,y-2,1,1); g.fillRect(cx+1,y-1,1,1); }
    cx+=gl[0].length+1; } }

/* ---------- Tile mặt đất ---------- */
const C={
  grass:['#79b34a','#6aa13e','#8dc65a','#5e9637','#9bd36a'], forest:['#4b8a39','#3f7a31','#5a9a43','#356a2a'],
  path:['#d6c39b','#c4ae84','#e6d8b6','#b49c72'], road:['#5e5e66','#55555c','#68686f','#3a3a40'],
  sand:['#e3d2a2','#d4c08e','#c9b583'], water:['#3b8ed3','#2e7bc0','#77bdf0','#d8efff'],
  deck:['#a26c40','#7d5130','#bb8352'], pool:['#43c5e3','#2aa0c0','#8fe6f4'], edge:['#e6e0d2','#c8c0ae'],
  stone:['#9b968c','#86817a','#aaa59b','#5d5852'], pave:['#cbc6ba','#a9a396','#ddd8cd'],
  floor:['#b98a5c','#a37548','#c99a6a','#8e6239'], wall:['#eadfca','#d7c8ad','#8c6b4a','#4a3c34'], rug:['#b5483c','#8f3328','#e8c38a']};
const WALKABLE=new Set(['G','P','S','R','D','K','E','T','O','M','Q','C']);
const TILE_EXT={};   // tile bổ sung (art2.js)
// vẽ 1 ô; nb(dx,dy) trả loại ô hàng xóm; frame dùng cho nước
// nhà riêng: sàn / tường theo theme chủ nhà chọn (data.js HOME.floors / walls); game.js đặt lại mỗi lần vào cảnh, cảnh khác là null
let HT={};
function homeTheme(t){ HT=t||{}; }
function homeFloor(P,X,Y,tx,ty,F){ const c=F.col;
  if(F.style==='tile'){ P.rect(X,Y,T,T,c[0]); P.rect(X,Y,T,1,c[1]); P.rect(X,Y,1,T,c[1]); P.rect(X+2,Y+2,4,1,c[2]); P.px(X+2,Y+3,c[2]); }
  else if(F.style==='check'){ P.rect(X,Y,T,T,(tx+ty)%2?c[2]:c[0]); P.rect(X,Y,T,1,c[1]); P.rect(X,Y,1,T,c[1]); P.px(X+3,Y+3,(tx+ty)%2?c[3]:'#ffffff'); }
  else if(F.style==='marble'){ P.rect(X,Y,T,T,c[0]); for(let i=0;i<3;i++){ const sx=Math.floor(hash(tx,ty*3+i,81)*16), sy=Math.floor(hash(tx*3+i,ty,82)*16); for(let k=0;k<6;k++) P.px(X+((sx+k)&15),Y+((sy+(k>>1))&15),k%2?c[1]:c[3]); } P.rect(X,Y,T,1,c[2]); P.rect(X,Y,1,T,c[1]); }
  else if(F.style==='plank2'){ P.rect(X,Y,T,T,c[0]); for(let y=0;y<T;y+=8){ P.rect(X,Y+y+7,T,1,c[3]); P.rect(X,Y+y,T,1,c[2]); const off=(((ty*2+y/8)%3)*6+tx*16)%24; for(const sx of [off%16,(off+11)%16]) if(sx<T) P.rect(X+sx,Y+y,1,7,c[1]); P.px(X+(tx*5+y)%14+1,Y+y+3,c[1]); } }   /* ván gỗ to so le */
  else if(F.style==='diamond'){ P.rect(X,Y,T,T,c[0]); for(let i=0;i<T;i++){ P.px(X+i,Y+((i+8)%16),c[1]); P.px(X+i,Y+((24-i)%16),c[1]); } P.rect(X+7,Y+7,2,2,c[2]); P.px(X,Y,c[2]); P.px(X+15,Y,c[2]); }   /* gạch trắng kẻ chéo, chấm đen ở mắt lưới */
  else if(F.style==='carpet'){ P.rect(X,Y,T,T,c[0]); for(let i=0;i<10;i++) P.px(X+Math.floor(hash(tx*7+i,ty,83)*16),Y+Math.floor(hash(tx,ty*7+i,84)*16),i%2?c[1]:c[2]); }
  else { P.rect(X,Y,T,T,c[0]); for(let y=0;y<T;y+=4){ P.rect(X,Y+y+3,T,1,c[1]); const s=Math.floor(hash(tx,ty*4+y,60)*16); P.rect(X+s,Y+y,1,3,c[3]); P.px(X+(s+5)%16,Y+y+1,c[2]); } } }
// up: hàng tường phía trên (tường nhà riêng cao 2 ô); wains: ván ngang phía trên + nẹp + ốp gỗ chân tường; vplank: ván dọc
function homeWall(P,X,Y,W,up){ const c=W.col; P.rect(X,Y,T,T,c[0]);
  if(W.style==='wains'){ if(up){ P.rect(X,Y,T,2,c[4]||c[2]); P.rect(X,Y+2,T,1,c[3]); for(let y=6;y<T;y+=5) P.rect(X,Y+y,T,1,c[1]); P.px(X+(X*3)%13+1,Y+9,c[1]); return; }
    for(let y=3;y<6;y+=5) P.rect(X,Y+y,T,1,c[1]); P.rect(X,Y+5,T,2,c[4]||c[2]); P.rect(X,Y+7,T,9,c[2]); P.rect(X+2,Y+9,T-4,4,c[4]||c[1]); P.rect(X+2,Y+9,T-4,1,'#c08a5a'); P.rect(X,Y+T-2,T,2,c[4]||c[3]); return; }
  if(W.style==='vplank'){ for(let x=0;x<T;x+=4){ P.rect(X+x,Y,1,T,c[1]); P.px(X+x+2,Y+((X+x)*7)%14,c[2]); } if(up){ P.rect(X,Y,T,2,c[3]); return; } P.rect(X,Y+T-3,T,3,c[3]); P.rect(X,Y+T-3,T,1,c[2]); return; }
  if(up){ if(W.style==='brick'){ for(let y=0;y<T;y+=4){ P.rect(X,Y+y,T,1,c[1]); for(let x=(y/4)%2?4:0;x<T;x+=8) P.rect(X+x,Y+y,1,4,c[1]); } } else if(W.style==='stripe'){ for(let x=0;x<T;x+=4) P.rect(X+x,Y,2,T,c[1]); } else if(W.style==='panel'){ for(let x=0;x<T;x+=4) P.rect(X+x,Y,1,T,c[1]); } else for(let x=0;x<T;x+=8) P.rect(X+x,Y,1,T,c[1]); P.rect(X,Y,T,2,c[3]); return; }
  if(W.style==='brick'){ for(let y=0;y<T-4;y+=4){ P.rect(X,Y+y,T,1,c[1]); for(let x=(y/4)%2?4:0;x<T;x+=8) P.rect(X+x,Y+y,1,4,c[1]); } }
  else if(W.style==='stripe'){ for(let x=0;x<T;x+=4) P.rect(X+x,Y,2,T-4,c[1]); }
  else if(W.style==='panel'){ for(let x=0;x<T;x+=4) P.rect(X+x,Y,1,T-4,c[1]); P.rect(X,Y+3,T,1,c[2]); }
  else for(let x=0;x<T;x+=8) P.rect(X+x,Y,1,T-4,c[1]);
  P.rect(X,Y+T-4,T,4,c[2]); P.rect(X,Y+T-4,T,1,'#a8865f'); }
function drawTile(g,t,tx,ty,nb,frame=0){
  const X=tx*T, Y=ty*T, P=painter(g);
  const dither=(cols,p1,p2,seed)=>{ P.rect(X,Y,T,T,cols[0]); for(let y=0;y<T;y++) for(let x=0;x<T;x++){ const h=hash(X+x,Y+y,seed);
    if(h<p1) P.px(X+x,Y+y,cols[1]); else if(h<p1+p2) P.px(X+x,Y+y,cols[2]); } };
  const isPathy=k=>k==='P'||k==='T'||k==='S'||k==='R'||k==='E'||k==='K';
  switch(t){
  case 'G': case 'B': {
    dither(C.grass,.10,.05,1);
    if(hash(tx,ty,7)<.45){ const x=X+2+Math.floor(hash(tx,ty,8)*11), y=Y+3+Math.floor(hash(tx,ty,9)*10);
      P.px(x,y,C.grass[3]); P.px(x+2,y,C.grass[3]); P.px(x+1,y+1,C.grass[3]); P.px(x,y-1,C.grass[4]); P.px(x+2,y-1,C.grass[4]); }
    if(hash(tx,ty,11)<.07){ const x=X+3+Math.floor(hash(tx,ty,12)*9), y=Y+3+Math.floor(hash(tx,ty,13)*9), fc=['#ffffff','#ffe066','#ff9fb2'][Math.floor(hash(tx,ty,14)*3)];
      P.px(x,y,fc); P.px(x+1,y,fc); P.px(x,y+1,fc); P.px(x+1,y+1,'#f2b33d'); }
    break; }
  case 'F': {
    dither(C.forest,.16,.06,2);
    for(let k=0;k<3;k++){ const x=X+Math.floor(hash(tx,ty,20+k)*14), y=Y+Math.floor(hash(tx,ty,30+k)*14); P.px(x,y,C.forest[3]); P.px(x+1,y,C.forest[3]); }
    break; }
  case 'P': case 'T': {
    dither(C.path,.14,.05,3);
    if(t==='T') for(let y=3;y<T;y+=5){ P.rect(X,Y+y,T,1,'#a88f66'); P.rect(X,Y+y-1,T,1,'#ead9b3'); }
    edges(g,X,Y,nb,k=>isPathy(k)||k==='B'||k==='Q',C.path[3]);
    break; }
  case 'S': {
    P.rect(X,Y,T,T,C.pave[0]);
    for(let y=0;y<T;y+=8) for(let x=0;x<T;x+=8){ const off=(ty%2)*4; P.rect(X+((x+off)%T),Y+y,1,8,C.pave[1]); P.rect(X+x,Y+y,8,1,C.pave[1]); P.px(X+x+2,Y+y+2,C.pave[2]); }
    edges(g,X,Y,nb,k=>isPathy(k)||k==='B',C.pave[1]);
    break; }
  case 'R': {
    dither(C.road,.14,.04,4);
    const isR=k=>k==='R'; let up=0, dn=0, lf=0, rt=0; while(up<7&&isR(nb(0,-up-1))) up++; while(dn<7&&isR(nb(0,dn+1))) dn++; while(lf<7&&isR(nb(-lf-1,0))) lf++; while(rt<7&&isR(nb(rt+1,0))) rt++;
    const vert=up+dn>lf+rt;                                                                                   // đường dọc hay ngang
    if(!isR(nb(0,-1))&&!vert) P.rect(X,Y,T,2,C.road[3]); if(!isR(nb(0,1))&&!vert) P.rect(X,Y+T-2,T,2,C.road[3]);
    if(!isR(nb(-1,0))&&vert) P.rect(X,Y,2,T,C.road[3]); if(!isR(nb(1,0))&&vert) P.rect(X+T-2,Y,2,T,C.road[3]);
    if(up<7&&dn<7&&lf<7&&rt<7&&up+dn>2&&lf+rt>2){}                                                            // ngã tư: không kẻ vạch
    else if(!vert&&tx%3===0){ if(up===dn&&up>0) P.rect(X+4,Y+8,7,1,'#e9e4d8'); else if(dn===up+1) P.rect(X+4,Y+T-1,7,1,'#e9e4d8'); }   // vạch giữa đường ngang
    else if(vert&&ty%3===0){ if(lf===rt&&lf>0) P.rect(X+8,Y+4,1,7,'#e9e4d8'); else if(rt===lf+1) P.rect(X+T-1,Y+4,1,7,'#e9e4d8'); }
    break; }
  case 'D': {
    dither(C.sand,.14,.0,5);
    if(nb(0,1)==='W') for(let x=0;x<T;x++) P.px(X+x,Y+T-1-((x+frame)%5===0?1:0),C.sand[2]);
    break; }
  case 'W': {
    const deep=nb(0,-3)==='W'&&nb(0,-2)==='W';
    P.rect(X,Y,T,T,deep?C.water[1]:C.water[0]);
    for(let y=1;y<T;y+=5) for(let x=0;x<T;x++){ const w=(x+X+y*3+frame*3)%14; if(w<3) P.px(X+x,Y+y,C.water[2]); }
    if(nb(0,-1)!=='W'&&nb(0,-1)!=='Q') for(let x=0;x<T;x++){ P.px(X+x,Y,C.water[3]); if((x+frame*2)%4<2) P.px(X+x,Y+1,C.water[2]); }
    break; }
  case 'Q': { // cầu gỗ ra hồ
    P.rect(X,Y,T,T,C.water[0]);
    P.rect(X+2,Y,12,T,C.deck[0]); for(let x=2;x<14;x+=4) P.rect(X+x,Y,1,T,C.deck[1]);
    P.rect(X+2,Y,1,T,C.deck[2]); P.rect(X+1,Y,1,T,OUT); P.rect(X+14,Y,1,T,OUT);
    break; }
  case 'K': {
    P.rect(X,Y,T,T,C.deck[0]);
    for(let y=0;y<T;y+=4){ P.rect(X,Y+y+3,T,1,C.deck[1]); P.rect(X,Y+y,T,1,C.deck[2]); const off=(Math.floor(hash(tx,ty+y,40)*12)); P.px(X+off,Y+y+1,C.deck[1]); }
    edges(g,X,Y,nb,k=>k==='K'||k==='L'||k==='E'||k==='B',OUT);
    break; }
  case 'L': {
    P.rect(X,Y,T,T,C.pool[0]);
    for(let y=0;y<T;y+=4) for(let x=0;x<T;x++) if(((x+X)*2+y*5+frame*2)%11<2) P.px(X+x,Y+y+((x>>2)%2),C.pool[2]);
    if(nb(0,-1)!=='L') P.rect(X,Y,T,2,C.pool[1]);
    if(nb(-1,0)!=='L') P.rect(X,Y,1,T,C.pool[1]);
    break; }
  case 'E': {
    P.rect(X,Y,T,T,C.edge[0]); P.rect(X+7,Y,1,T,C.edge[1]); P.rect(X,Y+7,T,1,C.edge[1]); P.rect(X+15,Y,1,T,C.edge[1]); P.rect(X,Y+15,T,1,C.edge[1]);
    break; }
  case 'X': { // kè đá xếp khan như ảnh thực địa
    P.rect(X,Y,T,T,C.stone[3]);
    for(let y=0;y<T;y+=5){ const off=((ty*3+y)%2)*3; for(let x=-off;x<T;x+=6){ const c=C.stone[Math.floor(hash(X+x,Y+y,50)*3)];
      P.rect(X+Math.max(0,x),Y+y,Math.min(5,T-Math.max(0,x))-(x<0?-x:0),4,c); P.px(X+Math.max(0,x)+1,Y+y,'#c3beb3'); } }
    if(nb(0,-1)==='G'||nb(0,-1)==='F') for(let x=0;x<T;x+=2) P.px(X+x,Y,C.grass[3]);
    break; }
  case 'C': { // nền khu cắm trại (đất nện)
    dither(['#c9a877','#b8955f','#d8bb8c'],.14,.05,6);
    edges(g,X,Y,nb,k=>k==='C'||isPathy(k)||k==='B',C.path[3]);
    break; }
  case 'O': { if(HT.f){ homeFloor(P,X,Y,tx,ty,HT.f); break; }
    P.rect(X,Y,T,T,C.floor[0]);
    for(let y=0;y<T;y+=4){ P.rect(X,Y+y+3,T,1,C.floor[1]); const s=Math.floor(hash(tx,ty*4+y,60)*16); P.rect(X+s,Y+y,1,3,C.floor[3]); P.px(X+(s+5)%16,Y+y+1,C.floor[2]); }
    break; }
  case 'M': {
    P.rect(X,Y,T,T,C.rug[0]);
    if(nb(0,-1)!=='M') P.rect(X,Y,T,2,C.rug[2]); if(nb(0,1)!=='M') P.rect(X,Y+T-2,T,2,C.rug[2]);
    if(nb(-1,0)!=='M') P.rect(X,Y,2,T,C.rug[2]); if(nb(1,0)!=='M') P.rect(X+T-2,Y,2,T,C.rug[2]);
    for(let i=4;i<12;i+=4) P.rect(X+i,Y+i,2,2,C.rug[1]);
    break; }
  case 'H': { // tường phòng: mặt tường trước nếu ô dưới là sàn, còn lại là đỉnh tường tối
    const below=nb(0,1);
    if(HT.w){ const fl=b=>b==='O'||b==='M'||b==='I'; if(fl(below)){ homeWall(P,X,Y,HT.w,0); break; } if(below==='H'&&fl(nb(0,2))&&ty<=1){ homeWall(P,X,Y,HT.w,1); break; } P.rect(X,Y,T,T,HT.w.col[3]); P.rect(X,Y,T,1,'#62524a'); break; }   /* nhà riêng: tường trên cùng cao 2 ô */
    if(below==='O'||below==='M'){ P.rect(X,Y,T,T,C.wall[0]); for(let x=0;x<T;x+=8) P.rect(X+x,Y,1,T-4,C.wall[1]); P.rect(X,Y+T-4,T,4,C.wall[2]); P.rect(X,Y+T-4,T,1,'#a8865f'); }
    else { P.rect(X,Y,T,T,C.wall[3]); P.rect(X,Y,T,1,'#62524a'); }
    break; }
  default: if(TILE_EXT[t]){ TILE_EXT[t](g,X,Y,tx,ty,nb,frame,P,dither); break; } P.rect(X,Y,T,T,'#ff00ff');
  }
}
// viền mép ô + vài cọng cỏ lấn mép
function edges(g,X,Y,nb,same,col){ const P=painter(g);
  if(!same(nb(0,-1))){ P.rect(X,Y,T,1,col); for(let x=1;x<T;x+=3) if(hash(X+x,Y,70)<.5) P.px(X+x,Y+1,C.grass[3]); }
  if(!same(nb(0,1))) P.rect(X,Y+T-1,T,1,col);
  if(!same(nb(-1,0))) P.rect(X,Y,1,T,col);
  if(!same(nb(1,0))) P.rect(X+T-1,Y,1,T,col); }

/* ---------- Cây cối ---------- */
function tree(seed=0,size=1){
  const r=Math.round((12+hash(seed,1)*4)*size), w=r*2+12, h=r*2+18;
  return sprite(w,h,w/2,h-2,(g,P)=>{
    const cx=w/2, cy=r+3;
    P.rect(cx-2,cy+r-6,4,14,'#6b4a2f'); P.rect(cx-2,cy+r-6,1,14,'#86603d'); P.rect(cx+1,cy+r-6,1,14,'#563a24');
    const blobs=[[0,0,r],[-r*.55,r*.25,r*.65],[r*.55,r*.25,r*.65],[0,-r*.35,r*.7]];
    for(const [dx,dy,rr] of blobs) P.disc(cx+dx,cy+dy,Math.round(rr),'#4f9a3e');
    for(const [dx,dy,rr] of blobs) P.disc(cx+dx+1,cy+dy+2,Math.round(rr*.55),'#3a7a32');
    P.disc(cx-r*.35,cy-r*.45,Math.round(r*.45),'#6cb24f');
    for(let k=0;k<7;k++){ const a=hash(seed,k+10)*6.28, d=hash(seed,k+20)*r*.8; const x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d*.8;
      P.px(x,y,'#86c860'); P.px(x+1,y,'#86c860'); P.px(x,y+1,'#3a7a32'); }
  });
}
function bamboo(seed=0){
  const w=30, h=56;
  return sprite(w,h,w/2,h-2,(g,P)=>{
    for(let k=0;k<5;k++){ const x=5+k*5+Math.round(hash(seed,k)*2), top=6+Math.round(hash(seed,k+5)*10);
      P.rect(x,top,2,h-top-2,'#7aa83c'); P.rect(x,top,1,h-top-2,'#9bc75a');
      for(let y=top+6;y<h-4;y+=7) P.rect(x,y,2,1,'#3e6a24'); }
    for(let k=0;k<9;k++){ const x=3+hash(seed,k+30)*24, y=4+hash(seed,k+40)*22; P.disc(x,y,3,'#5f9e3f'); P.px(x-1,y-1,'#8cc65c'); }
  });
}
function bush(seed=0){ return sprite(18,13,9,11,(g,P)=>{ P.disc(6,7,5,'#4f9a3e'); P.disc(12,7,5,'#4f9a3e'); P.disc(9,5,5,'#5aa84a'); P.disc(7,4,2,'#79c25c'); P.px(12,9,'#3a7a32'); P.px(5,9,'#3a7a32');
  if(hash(seed,3)<.4){ P.px(4,5,'#ff9fb2'); P.px(13,4,'#ffffff'); P.px(9,8,'#ffe066'); } }); }
function bigleaf(seed=0){ // cây lá to (môn, chuối) như ảnh bể bơi
  return sprite(26,24,13,22,(g,P)=>{ P.rect(12,12,2,10,'#4b7a2d');
    for(const [x,y,r] of [[7,9,6],[19,9,6],[13,5,6],[6,15,4],[20,15,4]]){ P.disc(x,y,r,'#4c9a3c'); P.disc(x-1,y-1,Math.max(1,r-3),'#70b850'); P.rect(x,y-r+1,1,r*2-2,'#3a7a32'); } }); }
function rock(seed=0){ return sprite(16,11,8,9,(g,P)=>{ P.disc(8,6,5,'#8f8a82'); P.disc(6,5,3,'#aaa59b'); P.px(10,8,'#6e6a66'); P.px(11,7,'#6e6a66'); }); }
function potPlant(seed=0){ return sprite(12,18,6,16,(g,P)=>{ P.rect(3,11,7,6,'#f2efe8'); P.rect(3,11,7,1,'#ffffff'); P.rect(8,11,2,6,'#d6d1c6');
  for(const [x,y,r] of [[6,7,3],[3,6,2],[9,5,2],[6,3,2]]) P.disc(x,y,r,'#4f9a3e'); P.px(5,4,'#7cc25a'); }); }

/* ---------- Nhà ---------- */
// mái: 'thatch' lá cọ, 'tile' ngói đỏ, 'stone' đá. tường: 'ochre' đất vàng, 'wood' gỗ, 'stone' đá
const ROOF={thatch:['#b48c4e','#9a743d','#cba566','#8a6634'],tile:['#c55a3c','#9c3f29','#e07a56','#7e321f'],stone:['#7e8189','#62656b','#9ea2aa','#4e5157'],
  tile_blue:['#3f78c4','#2c5a9a','#6a9ee0','#1f4278'],tile_purple:['#7a52b0','#5a3a8a','#9a76d0','#43296a'],tile_green:['#3f8a5a','#2c6a44','#62ac7a','#1f4e32'],tile_teal:['#2f8a8a','#206a6a','#52acac','#164e4e']};
const WALLC={ochre:['#d9a85c','#c48f45','#e7bf7a'],wood:['#8a5d3b','#6e472c','#a7744c'],stone:['#a49e93','#8b857b','#bdb7ab'],
  white:['#ecebe4','#d8d6cc','#ffffff'],brick:['#b5523c','#93402e','#c86a52'],cream:['#efe1b8','#dccb9a','#f8eecf'],pink:['#e8b4b8','#d49aa0','#f4cdd0'],mint:['#b8dcc4','#9cc8ac','#d0ecda'],yellow:['#f0d270','#d9b850','#f8e49a']};
function house(o){
  const w=o.w, wallH=o.wallH||22, roofH=o.roofH||30, eave=4, stone=o.stoneBase?6:0, stilt=o.stilt?6:0;
  const W=w+eave*2+2, H=roofH+wallH+stone+stilt+2;
  return sprite(W,H,W/2,H-1,(g,P)=>{
    const x0=eave+1, wy=roofH+1, wc=WALLC[o.wall||'ochre'], rc=ROOF[o.roof||'thatch'];
    // chân đá / cột sàn
    if(stone){ for(let y=0;y<stone;y+=3) for(let x=0;x<w;x+=5){ P.rect(x0+x+(y%2)*2,wy+wallH+stilt+y,4,2,['#9b968c','#86817a','#aaa59b'][(x+y)%3]); } P.rect(x0,wy+wallH+stilt,w,1,'#5d5852'); }
    if(stilt){ P.rect(x0,wy+wallH,w,stilt,'#3a2c24'); for(let x=2;x<w;x+=Math.max(8,Math.floor(w/5))) P.rect(x0+x,wy+wallH,2,stilt,'#6e472c'); }
    // tường
    P.rect(x0,wy,w,wallH,wc[0]);
    if(o.wall==='wood') for(let x=0;x<w;x+=4) P.rect(x0+x,wy,1,wallH,wc[1]);
    else if(o.wall==='brick') for(let y=0;y<wallH;y+=4){ P.rect(x0,wy+y+3,w,1,wc[1]); for(let x=(y/4%2)*4;x<w;x+=8) P.rect(x0+x,wy+y,1,3,wc[1]); }
    else for(let k=0;k<w*wallH/14;k++) P.px(x0+hash(k,w,1)*w,wy+hash(k,w,2)*wallH,wc[1]);
    P.rect(x0,wy,w,3,'rgba(0,0,0,.28)');                                   // bóng mái
    // cửa sổ, cửa ra vào
    for(const wx of o.windows||[]){ P.rect(x0+wx,wy+6,8,7,'#3c2a20'); P.rect(x0+wx+1,wy+7,6,5,o.lit?'#ffd877':'#9fd3e6'); P.rect(x0+wx+4,wy+7,1,5,'#3c2a20'); P.rect(x0+wx+1,wy+7,2,1,'#e9f7fb'); }
    for(const dx of o.doors||[]){ P.rect(x0+dx,wy+wallH-15,10,15,'#3c2a20'); P.rect(x0+dx+1,wy+wallH-14,8,14,'#6e472c'); P.rect(x0+dx+5,wy+wallH-14,1,14,'#4f3220'); P.px(x0+dx+7,wy+wallH-7,'#e8c38a'); }
    if(o.open){ P.rect(x0+3,wy+4,w-6,wallH-4,'#4a3424'); for(let x=3;x<w-3;x+=Math.floor((w-6)/4)) P.rect(x0+x,wy,3,wallH,'#7a5232');
      if(o.tables) for(let x=8;x<w-12;x+=18){ P.rect(x0+x,wy+wallH-8,12,3,'#a7744c'); P.rect(x0+x+1,wy+wallH-5,2,4,'#6e472c'); P.rect(x0+x+9,wy+wallH-5,2,4,'#6e472c'); } }
    if(o.rail){ P.rect(x0-1,wy+wallH-7,w+2,2,'#a7744c'); for(let x=0;x<w;x+=3) P.rect(x0+x,wy+wallH-5,1,5,'#7a5232'); }
    // mái hông: mặt trước hình thang, viền diềm
    for(let y=0;y<roofH;y++){ const inset=Math.round((roofH-y)*.55), xa=1+Math.max(0,inset-roofH*.55+eave+2), xb=W-1-xa;
      const t=y/roofH; for(let x=Math.round(xa);x<=Math.round(xb);x++){
        let c=rc[0];
        if(/^tile/.test(o.roof)) c=(y%4===3)?rc[1]:((x+(Math.floor(y/4)%2)*3)%6===0?rc[1]:(y%4===0?rc[2]:rc[0]));
        else if(o.roof==='stone') c=(y%5===4||((x+Math.floor(y/5)*4)%9===0))?rc[1]:(y%5===0?rc[2]:rc[0]);
        else c=(x%3===0)?rc[1]:((x+y)%7===0?rc[2]:rc[0]);
        if(x<xa+2&&t>.15) c=rc[2]; if(x>xb-2) c=rc[1];
        P.px(x,y+1,c); } }
    // gờ nóc mái + diềm dưới
    P.rect(W/2-w*.18,1,w*.36,2,rc[3]);
    for(let x=1;x<W-1;x++) P.px(x,roofH+(o.roof==='thatch'&&x%2?1:0),rc[3]);
    if(o.sign){ const tw=textW(o.sign); P.rect(W/2-tw/2-2,wy+1,tw+4,8,'#efe1c0'); drawText(g,o.sign,Math.round(W/2-tw/2),wy+2,'#5a3a22'); }
  });
}
function tent(o={}){ // lều bạt
  const w=o.w||40, h=30;
  return sprite(w+4,h+4,(w+4)/2,h+2,(g,P)=>{
    for(let y=0;y<h;y++){ const half=Math.round(y*(w/2)/h); P.rect(w/2+2-half,y+2,half*2,1,y%5===0?'#d8ccb3':'#efe6d3'); P.rect(w/2+2,y+2,half,1,y%5===0?'#c7baa0':'#ddd2bb'); }
    P.rect(w/2+1,2,2,h,'#8a6634');
    for(let y=h-12;y<h;y++){ const half=Math.round((y-(h-12))*.45); P.rect(w/2+2-half,y+2,half*2,1,'#3c2a20'); }
    if(o.flag) { P.rect(w/2+1,0,1,4,'#6e472c'); P.rect(w/2+2,0,4,2,o.flag); }
  });
}
function domeTent(col='#e07a3c'){ return sprite(30,20,15,18,(g,P)=>{ P.disc(15,13,11,col); P.rect(3,13,24,6,col); P.disc(12,10,5,'rgba(255,255,255,.25)'); P.rect(12,10,6,9,'#3c2a20'); P.rect(15,10,1,9,'#e8c38a'); }); }
function gate(){
  const w=78, h=50;
  return sprite(w,h,w/2,h-2,(g,P)=>{
    for(const x of [4,w-12]){ P.rect(x,12,8,h-14,'#7a5232'); P.rect(x,12,2,h-14,'#9a6a42'); P.rect(x+6,12,2,h-14,'#5a3a22'); P.rect(x-2,h-6,12,4,'#8f8a82'); }
    P.rect(0,8,w,6,'#6e472c'); P.rect(0,8,w,1,'#9a6a42'); P.rect(2,3,w-4,5,'#7a5232');
    const s1='CHANDE BOOTCAMP', t1=textW(s1); P.rect(w/2-t1/2-3,15,t1+6,9,'#efe1c0'); drawText(g,s1,Math.round(w/2-t1/2),17,'#8c231f');
    const s2='KÉ RETREAT', t2=textW(s2); P.rect(w/2-t2/2-3,1,t2+6,8,'#2e5b38'); drawText(g,s2,Math.round(w/2-t2/2),3,'#f4e6c4');
    for(let x=8;x<w-8;x+=6){ P.px(x,26+((x/6)%2),'#ffd86b'); } P.rect(8,25,w-16,1,'rgba(60,40,30,.6)');
  });
}
function car(){ // xe bán tải 4 bánh đưa khách lên đồi
  return sprite(54,30,27,28,(g,P)=>{
    P.rect(2,12,50,11,'#3f6e4a'); P.rect(2,12,50,2,'#5a8d64'); P.rect(20,3,20,10,'#3f6e4a'); P.rect(22,5,7,7,'#9fd3e6'); P.rect(31,5,7,7,'#9fd3e6'); P.rect(22,5,7,1,'#e9f7fb');
    P.rect(2,12,17,4,'#2f5238'); P.rect(44,15,6,3,'#ffd86b'); P.rect(2,17,4,2,'#c4382e'); P.rect(2,22,50,2,'#2a2a2f');
    for(const x of [11,42]){ P.disc(x,23,5,'#26262b'); P.disc(x,23,2,'#9a9aa0'); }
    P.rect(8,9,10,3,'#8a6634');                                            // hành lý thùng sau
  });
}
function umbrella(){ return sprite(26,30,13,28,(g,P)=>{ P.rect(12,10,2,18,'#8a6634'); for(let y=0;y<10;y++){ const half=Math.round(12-Math.abs(y-7)*(y<7?1.5:3)); P.rect(13-half,y+1,half*2,1,y%3?'#f4f1ea':'#d9d4ca'); }
  for(let x=3;x<24;x+=5) P.rect(x,9,1,2,'#c9c3b6'); }); }
function lounger(){ return sprite(12,24,6,22,(g,P)=>{ P.rect(2,2,8,20,'#e9e2d0'); P.rect(2,2,8,6,'#f6f1e4'); for(let y=9;y<21;y+=3) P.rect(2,y,8,1,'#c9c0aa'); P.rect(2,21,1,2,'#8a6634'); P.rect(9,21,1,2,'#8a6634'); }); }
function bench(){ return sprite(28,14,14,12,(g,P)=>{ P.rect(1,3,26,4,'#a7744c'); P.rect(1,3,26,1,'#c08552'); P.rect(3,7,2,5,'#6e472c'); P.rect(23,7,2,5,'#6e472c'); }); }
function table(){ return sprite(30,20,15,18,(g,P)=>{ P.rect(3,3,24,8,'#a7744c'); P.rect(3,3,24,2,'#c08552'); P.rect(5,11,2,7,'#6e472c'); P.rect(23,11,2,7,'#6e472c'); P.rect(0,13,6,3,'#8a5d3b'); P.rect(24,13,6,3,'#8a5d3b'); }); }
function bonfire(lit,frame=0){ return sprite(26,26,13,22,(g,P)=>{
  for(let k=0;k<10;k++){ const a=k/10*6.28; P.disc(13+Math.cos(a)*9,18+Math.sin(a)*4,2,['#8f8a82','#a49e93'][k%2]); }
  P.rect(7,16,12,3,'#6e472c'); P.rect(9,14,8,3,'#8a5d3b');
  if(lit){ const f=frame%2; P.disc(13,12-f,5,'#ff9f2e'); P.disc(12+f,10-f,3,'#ffd84a'); P.rect(12,3+f,2,6,'#ffd84a'); P.px(16,6+f,'#ff9f2e'); P.px(9,7-f,'#ffd84a'); } }); }
function sign(text){ const tw=textW(text); return sprite(tw+8,22,(tw+8)/2,20,(g,P)=>{ P.rect(tw/2+3,9,2,11,'#6e472c'); P.rect(1,1,tw+6,9,'#c08552'); P.rect(1,1,tw+6,1,'#dca170'); drawText(g,text,4,3,'#3c2a20'); }); }
function lamp(){ return sprite(8,30,4,28,(g,P)=>{ P.rect(3,4,2,24,'#5a3a22'); P.rect(1,2,6,4,'#3c2a20'); P.rect(2,3,4,2,'#ffd877'); }); }
function kayak(){ return sprite(36,12,18,10,(g,P)=>{ P.rect(4,3,28,6,'#ff8a2a'); P.rect(2,5,32,2,'#ff8a2a'); P.rect(14,4,8,3,'#2a2a2f'); P.rect(4,3,28,1,'#ffb36a'); }); }
function platform(){ return sprite(44,30,22,28,(g,P)=>{ P.rect(1,6,42,22,'#a26c40'); for(let y=6;y<28;y+=4){ P.rect(1,y+3,42,1,'#7d5130'); P.rect(1,y,42,1,'#bb8352'); } P.rect(1,26,42,2,'#5a3a22'); }); }
function chicken(frame=0){ return sprite(12,12,6,10,(g,P)=>{ P.rect(2,4,7,5,'#b5652e'); P.rect(2,4,7,1,'#d98a4a'); P.rect(7,1,3,4,'#b5652e'); P.px(8,0,'#e23b2e'); P.px(9,2,OUT); P.px(10,3,'#f2b33d'); P.rect(1,3,2,3,'#3f2a1c');
  P.rect(4,9,1,2+(frame%2),'#f2b33d'); P.rect(6,9,1,3-(frame%2),'#f2b33d'); }); }
function sparkleMarker(col='#ffd84a'){ return sprite(16,10,8,8,(g,P)=>{ P.rect(2,3,12,4,'rgba(255,255,255,.0)'); for(let x=2;x<14;x++){ P.px(x,4+(x%2),col); } },false); }

/* ---------- Đồ trong phòng Mèn Mén ---------- */
function bed(){ return sprite(34,46,17,44,(g,P)=>{ P.rect(1,1,32,8,'#8a5d3b'); P.rect(1,1,32,2,'#a7744c'); P.rect(2,8,30,34,'#a7744c'); P.rect(3,9,28,10,'#f4f1ea'); P.rect(3,9,28,2,'#ffffff');
  P.rect(3,18,28,23,'#8a95a6'); for(let y=21;y<41;y+=5) P.rect(3,y,28,1,'#77829a'); P.rect(3,18,28,2,'#a3adbd'); P.rect(2,41,30,3,'#6e472c'); }); }
function desk(){ return sprite(50,40,25,38,(g,P)=>{ P.rect(1,18,48,8,'#a7744c'); P.rect(1,18,48,2,'#c08552'); P.rect(2,26,3,12,'#6e472c'); P.rect(45,26,3,12,'#6e472c'); P.rect(30,26,14,10,'#8a5d3b'); P.rect(31,29,12,1,'#6e472c');
  P.rect(12,2,24,15,'#2a2a2f'); P.rect(13,3,22,12,'#2c2c3a');                 // màn hình mở Figma
  P.rect(14,4,4,10,'#1e1e28'); P.rect(19,5,9,5,'#f24e1e'); P.rect(19,10,4,3,'#a259ff'); P.rect(24,10,4,3,'#1abcfe'); P.rect(29,4,5,10,'#1e1e28'); P.rect(22,15,4,3,'#2a2a2f');
  P.rect(13,19,18,3,'#d9d4ca'); }); }
function phone(ring=false,frame=0){ return sprite(10,8,5,7,(g,P)=>{ P.rect(2,1,6,5,ring?(frame%2?'#7fe0ff':'#ffffff'):'#2a2a2f'); P.rect(3,2,4,3,ring?'#3fa9f5':'#3a3a48'); }); }
function wardrobe(){ return sprite(32,46,16,44,(g,P)=>{ P.rect(1,1,30,42,'#8a5d3b'); P.rect(1,1,30,2,'#a7744c'); P.rect(15,4,1,38,'#5a3a22'); P.rect(12,20,2,4,'#e8c38a'); P.rect(17,20,2,4,'#e8c38a'); P.rect(1,41,30,2,'#5a3a22'); }); }
function shelf(){ return sprite(30,40,15,38,(g,P)=>{ P.rect(1,1,28,36,'#8a5d3b'); for(let y=10;y<36;y+=9) P.rect(2,y,26,2,'#6e472c');
  const bk=['#c4382e','#3f7a8a','#e8c38a','#5a8d64','#a259ff','#f2b33d']; for(let s=0;s<3;s++) for(let k=0;k<6;k++) P.rect(3+k*4,3+s*9,3,7,bk[(k+s*2)%bk.length]); }); }
function windowWall(){ return sprite(34,24,17,23,(g,P)=>{ P.rect(1,1,32,20,'#6e472c'); P.rect(3,3,28,16,'#a8dcf0'); P.rect(3,3,28,5,'#d9f2fb'); P.rect(16,3,2,16,'#6e472c'); P.rect(3,10,28,1,'#6e472c');
  P.rect(0,19,34,3,'#8a5d3b'); P.disc(9,15,3,'#79b34a'); }); }
function poster(){ return sprite(22,26,11,25,(g,P)=>{ P.rect(1,1,20,24,'#f4f1ea'); P.rect(3,3,16,13,'#2e5b38'); P.disc(11,12,4,'#ffd84a'); P.rect(3,12,16,4,'#3f7a31'); drawText(g,'KE',6,18,'#8c231f'); }); }
function chair(){ return sprite(14,18,7,16,(g,P)=>{ P.rect(2,1,10,8,'#3a3a48'); P.rect(2,9,10,3,'#2a2a2f'); P.rect(6,12,2,4,'#2a2a2f'); P.rect(3,15,8,1,'#2a2a2f'); }); }
function doorTile(){ return sprite(26,30,13,29,(g,P)=>{ P.rect(1,1,24,28,'#5a3a22'); P.rect(3,3,20,26,'#8a5d3b'); P.rect(12,3,1,26,'#6e472c'); P.px(19,16,'#e8c38a'); P.px(19,17,'#e8c38a'); },true); }

/* ---------- Đồ nhặt + icon túi đồ (12×12) ---------- */
const ICON={
  bone:(P)=>{ P.rect(3,5,6,2,'#f4f1ea'); P.disc(3,5,1,'#f4f1ea'); P.disc(3,7,1,'#f4f1ea'); P.disc(9,5,1,'#f4f1ea'); P.disc(9,7,1,'#f4f1ea'); },
  speaker:(P)=>{ P.rect(3,2,6,8,'#2a2a2f'); P.disc(6,7,2,'#56565f'); P.px(6,7,'#9a9aa0'); P.px(6,3,'#3fa9f5'); },
  wood:(P)=>{ P.rect(2,4,8,2,'#8a5d3b'); P.rect(2,7,8,2,'#a7744c'); P.rect(3,5,1,4,'#e8c38a'); P.rect(6,3,1,7,'#c4382e'); },
  fish:(P)=>{ P.rect(3,5,6,3,'#7fa8c9'); P.rect(2,6,1,1,'#7fa8c9'); P.rect(9,4,2,5,'#5f86a8'); P.px(4,5,OUT); P.rect(3,5,6,1,'#a8c8e2'); },
  chicken:(P)=>{ P.rect(3,4,6,5,'#b5652e'); P.rect(7,2,2,3,'#b5652e'); P.px(8,1,'#e23b2e'); P.px(9,3,'#f2b33d'); P.rect(3,4,6,1,'#d98a4a'); },
  comlam:(P)=>{ P.rect(3,1,3,10,'#7aa83c'); P.rect(7,2,3,9,'#5c8a2e'); P.rect(3,1,3,2,'#f4f1ea'); P.rect(7,2,3,2,'#f4f1ea'); P.rect(3,6,3,1,'#3e6a24'); },
  paper:(P)=>{ P.rect(2,1,8,10,'#ffffff'); for(let y=3;y<10;y+=2) P.rect(3,y,5,1,'#9fb5c7'); P.rect(3,3,3,3,'#f24e1e'); },
  sunglasses:(P)=>{ P.rect(1,5,4,3,'#1c1516'); P.rect(7,5,4,3,'#1c1516'); P.rect(5,5,2,1,'#1c1516'); P.px(2,5,'#a3a3aa'); P.px(8,5,'#a3a3aa'); },
  chain:(P)=>{ for(let k=0;k<7;k++){ const a=k/6*3.14; P.px(6+Math.cos(a)*4,3+Math.sin(a)*5,'#e8b83a'); } P.rect(5,8,2,2,'#e8b83a'); },
  hat:(P)=>{ P.rect(1,7,10,2,'#c8352c'); P.rect(3,5,6,2,'#c8352c'); P.rect(5,3,2,2,'#c8352c'); P.rect(4,6,4,2,'#fbfaf6'); P.px(6,7,'#c8352c'); },
  bracelet:(P)=>{ P.disc(6,6,4,'#d4d8dc'); P.disc(6,6,2,'rgba(0,0,0,0)'); },
  lighter:(P)=>{ P.rect(4,4,4,7,'#c4382e'); P.rect(4,2,4,2,'#d4d8dc'); P.px(6,1,'#ffd84a'); },
  coin:(P)=>{ P.disc(6,6,4,'#e8b83a'); P.disc(5,5,2,'#ffe28a'); P.rect(6,4,1,5,'#a8761e'); },
  photo:(P)=>{ P.rect(2,3,8,6,'#2a2a2f'); P.disc(6,6,2,'#9fd3e6'); P.rect(3,2,3,1,'#2a2a2f'); },
};
function icon(name,scale=1){ const c=cv(14,14), g=c.getContext('2d'); g.translate(1,1); ICON[name]&&ICON[name](painter(g)); g.setTransform(1,0,0,1,0,0);
  if(name==='bracelet'){ const im=g.getImageData(0,0,14,14); for(let y=0;y<14;y++) for(let x=0;x<14;x++){ const d=Math.hypot(x-7,y-7); if(d<2.6){ im.data[(y*14+x)*4+3]=0; } } g.putImageData(im,0,0); }
  outline(c); if(scale===1) return c; const s=cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; }
function pickup(name){ const c=icon(name); return {c,ax:7,ay:13}; }

window.ART={homeTheme,T,WALKABLE,TILE_EXT,GL,C,painter,sprite,edges,rgb,drawTile,outline,hash,cv,tree,bamboo,bush,bigleaf,rock,potPlant,house,tent,domeTent,gate,car,umbrella,lounger,bench,table,bonfire,sign,lamp,kayak,platform,chicken,
  bed,desk,phone,wardrobe,shelf,windowWall,poster,chair,doorTile,icon,pickup,textW,drawText,sparkleMarker};
})();
