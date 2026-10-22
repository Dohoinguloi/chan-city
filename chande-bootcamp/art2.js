/* Chan City — pixel art bổ sung: tile mới, nhà/shop ở Ké, nội thất phòng, văn phòng Everfit (theo ảnh),
   nông trại Đà Lạt (nhà kính, cà phê, cao su, chuồng trại, cối xay gió, ngựa), trường đua, icon đồ mới. Viền đen 1px như ref. */
(function(){
const A=ART, T=A.T, cv=A.cv, hash=A.hash, sprite=A.sprite, OUT='#1c1516';

/* ---------- chữ biển hiệu: thêm chữ còn thiếu ---------- */
Object.assign(A.GL,{S:['.XX','X..','.X.','..X','XX.'],F:['XXX','X..','XX.','X..','X..'],V:['X.X','X.X','X.X','X.X','.X.'],Q:['.X.','X.X','X.X','X.X','.XX'],
  W:['X...X','X...X','X.X.X','XX.XX','X...X'],X:['X.X','X.X','.X.','X.X','X.X'],Z:['XXX','..X','.X.','X..','XXX'],J:['..X','..X','..X','X.X','.X.'],
  '0':['XXX','X.X','X.X','X.X','XXX'],'1':['.X','XX','.X','.X','.X'],'2':['XX.','..X','.X.','X..','XXX'],'3':['XX.','..X','.X.','..X','XX.'],'4':['X.X','X.X','XXX','..X','..X'],
  '5':['XXX','X..','XX.','..X','XX.'],'6':['.X.','X..','XX.','X.X','.X.'],'7':['XXX','..X','.X.','.X.','.X.'],'8':['.X.','X.X','.X.','X.X','.X.'],'9':['.X.','X.X','.XX','..X','.X.'],
  '·':['.','.','X','.','.'],'-':['..','..','XX','..','..'],'!':['X','X','X','.','X']});

/* ---------- tile mới ---------- */
for(const k of ['Y','Z','J','U','I','A','n','L']) A.WALKABLE.add(k);   // L: nước bể bơi, lội xuống được
const TE=A.TILE_EXT;
// Y: luống đất xới
TE.Y=(g,X,Y,tx,ty,nb,fr,P,dither)=>{ dither(['#8a5a3a','#7a4e32','#9c6a46'],.16,.06,80); for(let y=2;y<T;y+=5){ P.rect(X+1,Y+y,T-2,1,'#6a4228'); P.rect(X+1,Y+y+1,T-2,1,'#a67350'); } };
// Z: sàn gỗ sáng văn phòng (ảnh Everfit)
TE.Z=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#e2c9a2'); for(let y=0;y<T;y+=4){ P.rect(X,Y+y+3,T,1,'#cdb08a'); const s=Math.floor(hash(tx,ty*4+y,61)*16); P.rect(X+s,Y+y,1,3,'#d4b993'); P.px(X+(s+7)%16,Y+y+1,'#eed9b6'); } };
// V: vách kính toàn cảnh nhìn ra phố
TE.V=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#9fc7d9'); P.rect(X,Y,T,5,'#c7e3ee'); const h=4+Math.floor(hash(tx,1,62)*9);
  P.rect(X+2,Y+T-h,5,h,'#7d97a8'); P.rect(X+9,Y+T-h+3,5,h-3,'#6c8696'); for(let y=Y+T-h+1;y<Y+T;y+=2) P.px(X+3+(y%3),y,'#e8f4f8');
  P.rect(X+T-1,Y,1,T,'#2e3a44'); P.rect(X,Y+T-2,T,2,'#2e3a44'); };
// J: sàn tre nhà sàn
TE.J=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#c9a35e'); for(let x=0;x<T;x+=3){ P.rect(X+x,Y,1,T,'#a8833f'); } for(let y=4;y<T;y+=8) P.rect(X,Y+y,T,1,'#b8924d'); };
// U: sàn đá
TE.U=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#a9a49a'); for(let y=0;y<T;y+=8){ const off=(ty%2)*4; for(let x=0;x<T;x+=8){ P.rect(X+((x+off)%T),Y+y,1,8,'#8d887f'); } P.rect(X,Y+y,T,1,'#8d887f'); P.px(X+3,Y+y+3,'#bdb8ad'); } };
// I: gạch men phòng tắm
TE.I=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#e9f0f2'); for(let k=0;k<T;k+=8){ P.rect(X+k,Y,1,T,'#c4d3d8'); P.rect(X,Y+k,T,1,'#c4d3d8'); } };
// A: thảm xanh lá (sân cỏ trường đua bên trong)
TE.A=(g,X,Y,tx,ty,nb,fr,P,dither)=>{ dither(['#5aa040','#4f9238','#68b04a'],.12,.05,81); if((tx+ty)%2===0) P.rect(X,Y,T,T,'rgba(255,255,255,.05)'); };
// n: sàn LED Phòng Bay (đi được)
TE.n=(g,X,Y,tx,ty,nb,fr,P)=>{ const cols=['#ff4fa3','#4fd1ff','#ffd84a','#7de07a','#a259ff']; P.rect(X,Y,T,T,'#1a1426'); P.rect(X+1,Y+1,T-2,T-2,cols[(tx*3+ty*2+fr)%5]); P.rect(X+3,Y+3,T-6,T-6,'rgba(255,255,255,.18)'); };
// N: vách bạt lều (không đi được)
TE.N=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1); P.rect(X,Y,T,T,below==='N'?'#5a3f2c':'#e9dcc0'); if(below!=='N'){ for(let x=0;x<T;x+=5) P.rect(X+x,Y,1,T,'#d2c2a2'); P.rect(X,Y+T-3,T,3,'#b9a582'); } };
// g: vách kính phòng sếp (không đi được)
TE.g=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#e2c9a2'); P.rect(X,Y+5,T,8,'rgba(170,215,235,.75)'); P.rect(X,Y+5,T,1,'#4a5a66'); P.rect(X,Y+12,T,1,'#4a5a66'); P.rect(X+7,Y+5,1,8,'#4a5a66'); P.px(X+2,Y+7,'#ffffff'); };

/* ---------- tiện ích vẽ ---------- */
const S=(w,h,ax,ay,fn,ol=true)=>sprite(w,h,ax,ay,fn,ol);
function label(text,bg='#efe1c0',fg='#5a3a22'){ const tw=A.textW(text); return S(tw+6,9,Math.floor((tw+6)/2),8,(g,P)=>{ P.rect(0,0,tw+6,8,bg); A.drawText(g,text,3,1,fg); }); }
function signPost(text,bg='#c08552'){ const tw=A.textW(text); return S(tw+8,22,(tw+8)/2,20,(g,P)=>{ P.rect(tw/2+3,9,2,11,'#6e472c'); P.rect(1,1,tw+6,9,bg); P.rect(1,1,tw+6,1,'rgba(255,255,255,.35)'); A.drawText(g,text,4,3,'#2a1a10'); }); }
// nhà có biển hiệu (dùng house của art.js rồi gắn biển lên tường)
function shop(o){ const h=A.house({...o,sign:undefined}), tw=A.textW(o.sign), c=h.c, g=c.getContext('2d'), W=c.width, wy=(o.roofH||30)+1;
  g.fillStyle=OUT; g.fillRect(W/2-tw/2-4,wy+1,tw+8,10); g.fillStyle=o.signBg||'#efe1c0'; g.fillRect(W/2-tw/2-3,wy+2,tw+6,8); A.drawText(g,o.sign,Math.round(W/2-tw/2),wy+3,o.signFg||'#5a3a22');
  if(o.awning){ for(let x=0;x<W-12;x+=4){ g.fillStyle=(x/4)%2?'#f4f1ea':o.awning; g.fillRect(6+x,wy+12,4,5); } g.fillStyle=OUT; g.fillRect(6,wy+17,W-12,1); }
  return h; }

/* ---------- Ké Retreat: đồ mới ---------- */
const fence=(v)=>S(18,14,9,12,(g,P)=>{ if(v){ P.rect(7,0,3,13,'#8a5d3b'); P.rect(7,0,1,13,'#a7744c'); } else { P.rect(1,2,2,10,'#8a5d3b'); P.rect(15,2,2,10,'#8a5d3b'); P.rect(0,4,18,2,'#a7744c'); P.rect(0,8,18,2,'#a7744c'); } });
const whiteFence=(v)=>S(18,14,9,12,(g,P)=>{ if(v){ P.rect(7,0,3,13,'#f4f1ea'); } else { P.rect(1,2,2,10,'#f4f1ea'); P.rect(15,2,2,10,'#f4f1ea'); P.rect(0,4,18,2,'#e4e0d6'); P.rect(0,8,18,2,'#e4e0d6'); } });
function crop(kind,stage,col){ // stage 0 mầm · 1 đang lớn · 2 chín
  const c='#'+(col||'d9463a');
  return S(14,16,7,14,(g,P)=>{
    if(stage===0){ P.rect(6,10,2,4,'#5fae46'); P.px(5,10,'#79c25c'); P.px(8,9,'#79c25c'); return; }
    if(kind==='ngo'){ P.rect(6,2,2,12,'#6aa13e'); P.rect(3,6,4,2,'#79b34a'); P.rect(8,4,4,2,'#79b34a'); if(stage===2){ P.rect(8,7,3,5,c); P.px(9,6,'#c9a35e'); } return; }
    if(kind==='dua_hau'||kind==='bi_do'){ P.disc(7,11,3,'#5aa84a'); if(stage===2){ P.disc(7,11,4,c); if(kind==='dua_hau') for(let x=4;x<11;x+=2) P.rect(x,8,1,6,'#2f6b2a'); P.px(5,9,'rgba(255,255,255,.5)'); } return; }
    if(kind==='hoa'){ P.rect(6,6,2,8,'#4f8a38'); P.disc(7,5,3,stage===2?c:'#79c25c'); if(stage===2){ P.px(7,5,'#ffe066'); P.disc(3,9,2,c); P.disc(11,9,2,c); } return; }
    P.disc(7,10,4,'#5aa84a'); P.disc(5,8,2,'#79c25c'); P.disc(9,8,2,'#4f9a3e');
    if(stage===2) for(const [x,y] of [[4,10],[9,11],[7,7],[10,8]]) P.rect(x,y,2,2,c); }); }
function bush2(col,stage,kind){ // cây lâu năm: cà phê, cây ăn quả, cao su
  const c='#'+col;
  if(kind==='cafe') return S(16,18,8,16,(g,P)=>{ P.rect(7,10,2,6,'#6b4a2f'); P.disc(8,8,6,stage?'#3f7a31':'#5fae46'); P.disc(6,6,3,'#4f9a3e'); if(stage===2) for(const [x,y] of [[4,8],[10,7],[7,11],[11,10],[5,5]]) P.px(x,y,c); });
  if(kind==='caosu') return S(20,34,10,32,(g,P)=>{ P.rect(8,10,4,22,'#9a8a74'); P.rect(8,10,1,22,'#b8a890'); P.disc(10,8,stage?8:4,stage?'#3f7a31':'#5fae46'); P.disc(7,6,4,'#4f9a3e');
    if(stage===2){ P.rect(12,20,3,4,'#d8d8d0'); P.rect(12,20,3,1,'#f4f1ea'); for(let y=16;y<20;y++) P.px(11,y,'#f4f1ea'); } });
  return S(24,30,12,28,(g,P)=>{ P.rect(10,14,4,14,'#6b4a2f'); P.disc(12,11,stage?10:5,'#4f9a3e'); P.disc(9,8,5,'#6cb24f'); P.disc(15,13,4,'#3a7a32');
    if(stage===2) for(const [x,y] of [[6,12],[16,8],[12,15],[18,14],[9,6],[14,11]]){ P.disc(x,y,1,c); } }); }
const receptionDesk=()=>S(40,22,20,20,(g,P)=>{ P.rect(1,6,38,14,'#c08552'); P.rect(1,6,38,3,'#dca170'); P.rect(1,18,38,2,'#6e472c'); P.rect(28,1,7,6,'#f4f1ea'); P.rect(29,2,5,3,'#3fa9f5'); P.rect(4,3,4,4,'#e8c38a'); });
const bathHouse=()=>shop({w:40,wallH:20,roofH:22,roof:'thatch',wall:'wood',doors:[15],sign:'NHA TAM'});

/* ---------- nội thất trong nhà ---------- */
const counter=(w=60,col='#c08552')=>S(w,24,w/2,22,(g,P)=>{ P.rect(1,6,w-2,15,col); P.rect(1,6,w-2,3,'rgba(255,255,255,.3)'); P.rect(1,20,w-2,2,'#5a3a22'); P.rect(6,2,8,5,'#3a3a48'); P.rect(7,3,6,2,'#9fd3e6'); });
const shelf=(items)=>S(34,40,17,38,(g,P)=>{ P.rect(1,1,32,36,'#8a5d3b'); for(let y=10;y<36;y+=9) P.rect(2,y,30,2,'#6e472c');
  for(let r=0;r<3;r++) for(let k=0;k<4;k++){ const c=items[(r*4+k)%items.length]; P.rect(4+k*7,3+r*9,5,6,c); P.rect(4+k*7,3+r*9,5,1,'rgba(255,255,255,.35)'); } });
const basket=(col)=>S(18,14,9,12,(g,P)=>{ P.rect(2,6,14,7,'#a7744c'); for(let x=3;x<15;x+=3) P.rect(x,6,1,7,'#8a5d3b'); P.disc(6,5,3,col); P.disc(11,5,3,col); P.disc(9,3,2,col); });
const rack=(cols)=>S(40,36,20,34,(g,P)=>{ P.rect(2,2,36,2,'#5a5a66'); P.rect(2,2,2,32,'#5a5a66'); P.rect(36,2,2,32,'#5a5a66');
  cols.forEach((c,k)=>{ const x=6+k*6; P.rect(x+1,4,1,2,'#3a3a48'); P.rect(x-1,6,5,16,c); P.rect(x-1,6,5,2,'rgba(255,255,255,.25)'); }); P.rect(0,32,40,3,'#3a3a48'); });
const mirror=()=>S(18,34,9,32,(g,P)=>{ P.rect(2,1,14,30,'#c08552'); P.rect(4,3,10,26,'#cfe8f2'); P.rect(5,4,3,10,'#ffffff'); P.rect(6,30,6,3,'#6e472c'); });
const chessTable=()=>S(40,30,20,24,(g,P)=>{ P.rect(4,6,32,14,'#8a5d3b'); P.rect(10,8,20,10,'#e8d8b4'); for(let y=0;y<4;y++) for(let x=0;x<8;x++) if((x+y)%2) P.rect(10+x*2.5,8+y*2.5,3,3,'#6e472c');
  P.rect(6,20,3,6,'#5a3a22'); P.rect(31,20,3,6,'#5a3a22'); P.rect(0,10,4,10,'#a7744c'); P.rect(36,10,4,10,'#a7744c'); });
const pokerTable=()=>S(72,40,36,32,(g,P)=>{ P.disc(36,18,16,'#6e472c'); P.rect(20,2,32,32,'#6e472c'); P.disc(20,18,16,'#6e472c'); P.disc(52,18,16,'#6e472c');
  P.disc(22,18,13,'#2f7a46'); P.disc(50,18,13,'#2f7a46'); P.rect(22,5,28,27,'#2f7a46'); P.rect(30,15,12,6,'#f4f1ea'); for(let k=0;k<4;k++) P.rect(24+k*7,10,4,3,['#c4382e','#3f6e9a','#f2c43d','#1c1516'][k]);
  for(const [x,y] of [[8,8],[64,8],[8,30],[64,30],[36,36],[36,0]]) P.rect(x-3,y-2,6,5,'#3a3a48'); });
const roundTable=()=>S(60,44,30,36,(g,P)=>{ P.disc(30,20,18,'#5a3a22'); P.disc(30,19,16,'#8a5d3b'); P.disc(30,19,4,'#c4382e'); P.rect(29,13,2,6,'#f4f1ea'); P.px(29,12,'#ffd84a'); P.px(30,11,'#ff9f2e');
  for(let k=0;k<10;k++){ const a=k/10*6.28; P.rect(30+Math.cos(a)*24-2,20+Math.sin(a)*17-2,5,5,'#3a3a48'); } });
const barCounter=()=>S(96,30,48,28,(g,P)=>{ P.rect(1,10,94,17,'#3a2c24'); P.rect(1,10,94,3,'#6e472c'); for(let x=6;x<90;x+=10){ P.rect(x,2,3,8,['#c4382e','#3f8a3a','#f2c43d','#8fc4c6'][(x/10|0)%4]); P.rect(x,1,3,1,'#f4f1ea'); } });
const sofa=(col='#ece4d2',w=48)=>S(w,26,w/2,24,(g,P)=>{ P.rect(1,2,w-2,10,col); P.rect(1,12,w-2,10,col); P.rect(1,12,w-2,2,'rgba(0,0,0,.08)'); P.rect(0,4,5,18,col); P.rect(w-5,4,5,18,col); for(let x=w/3;x<w-4;x+=w/3) P.rect(x,13,1,8,'rgba(0,0,0,.12)'); P.rect(2,22,w-4,2,'#8a7a66'); });
const coffeeTable=(flowers=true)=>S(30,20,15,18,(g,P)=>{ P.rect(2,6,26,9,'#6e472c'); P.rect(2,6,26,2,'#8a5d3b'); P.rect(4,15,2,3,'#4a3424'); P.rect(24,15,2,3,'#4a3424'); if(flowers){ P.rect(13,2,4,5,'#f4f1ea'); P.disc(15,1,3,'#a8202e'); P.px(13,0,'#c4382e'); P.px(17,1,'#e0445a'); } });
const palm=()=>S(28,40,14,38,(g,P)=>{ P.rect(9,30,10,8,'#f4f1ea'); P.rect(9,30,10,2,'#ffffff'); P.rect(13,14,2,16,'#6b8a3a'); for(const [x,y,dx] of [[6,10,-1],[22,10,1],[8,4,-1],[20,4,1],[14,2,0]]) for(let k=0;k<7;k++) P.rect(14+(x-14)*k/6,14-(14-y)*k/6,3,2,k%2?'#4f9a3e':'#6cb24f'); });
const plantWall=(h=100)=>S(20,h,10,h-2,(g,P)=>{ P.rect(2,0,16,h-4,'#2f5a2a'); for(let k=0;k<h*2;k++){ const x=2+hash(k,1,90)*16, y=hash(k,2,90)*(h-6); P.disc(x,y,2,['#4f9a3e','#3a7a32','#6cb24f','#2f6b2a'][k%4]); } P.rect(0,h-4,20,4,'#8a7a66'); });
const longTable=(w=160,col='#f4f4f1')=>S(w,20,w/2,16,(g,P)=>{ P.rect(1,2,w-2,10,col); P.rect(1,2,w-2,2,'#ffffff'); P.rect(1,11,w-2,1,'#c9c9c4');
  for(let x=12;x<w-10;x+=32){ P.rect(x,4,10,6,'#2a2a2f'); P.rect(x+1,5,8,4,'#5aa9d6'); P.rect(x+3,11,4,1,'#9a9aa0'); } });
const whiteChair=()=>S(12,14,6,12,(g,P)=>{ P.rect(2,1,8,6,'#f4f4f1'); P.rect(2,7,8,3,'#e4e4e0'); P.rect(5,10,2,3,'#9a9aa0'); });
const woodTable=(w=72)=>S(w,22,w/2,18,(g,P)=>{ P.rect(1,4,w-2,10,'#8a5a36'); P.rect(1,4,w-2,2,'#a86e44'); for(let x=4;x<w-4;x+=12){ P.rect(x,0,7,4,'#efe6d8'); P.rect(x,15,7,5,'#efe6d8'); } });
const pantry=()=>S(70,30,35,28,(g,P)=>{ P.rect(1,8,68,20,'#f4f4f1'); P.rect(1,8,68,3,'#d9d4ca'); P.rect(8,0,12,12,'#3a3a48'); P.rect(10,2,8,4,'#c4382e'); P.rect(12,8,4,3,'#1c1516'); P.rect(30,3,8,6,'#f4f1ea'); P.rect(44,2,6,7,'#8fc4c6'); P.rect(56,4,8,5,'#e8c38a'); });
const elevator=()=>S(40,40,20,38,(g,P)=>{ P.rect(1,1,38,36,'#b8bcc2'); P.rect(4,6,15,30,'#d7dbe0'); P.rect(21,6,15,30,'#d7dbe0'); P.rect(19,6,2,30,'#8a8e94'); P.rect(16,1,8,4,'#2e3a44'); P.px(19,2,'#7de07a'); P.px(20,2,'#7de07a'); });
const exitSign=()=>S(26,10,13,9,(g,P)=>{ P.rect(1,1,24,8,'#2f7a46'); A.drawText(g,'EXIT',6,2,'#f4f1ea'); P.rect(2,3,3,1,'#f4f1ea'); P.px(2,2,'#f4f1ea'); P.px(2,4,'#f4f1ea'); });
const printer=()=>S(22,20,11,18,(g,P)=>{ P.rect(1,6,20,12,'#e4e4e0'); P.rect(4,2,14,5,'#f4f4f1'); P.rect(3,10,16,2,'#3a3a48'); P.px(17,8,'#7de07a'); });
const bossDesk=()=>S(50,26,25,24,(g,P)=>{ P.rect(1,6,48,12,'#3a2c24'); P.rect(1,6,48,2,'#6e472c'); P.rect(18,0,14,7,'#2a2a2f'); P.rect(19,1,12,5,'#5aa9d6'); P.rect(6,18,3,6,'#2a2a2f'); P.rect(41,18,3,6,'#2a2a2f'); P.rect(38,2,5,5,'#c4382e'); });

/* ---------- phòng ngủ ---------- */
const bedSingle=(col='#f4f1ea',frame='#a7744c')=>S(22,38,11,36,(g,P)=>{ P.rect(1,1,20,6,frame); P.rect(2,6,18,28,frame); P.rect(3,7,16,26,col); P.rect(4,8,14,6,'#ffffff'); P.rect(3,16,16,17,'#8fc4c6'); P.rect(3,16,16,2,'#b9e0e2'); });
const bedDouble=(sheet='#d6c3a5')=>S(40,40,20,38,(g,P)=>{ P.rect(1,1,38,7,'#6e472c'); P.rect(2,7,36,30,'#8a5d3b'); P.rect(3,8,34,28,'#f4f1ea'); P.rect(5,9,13,6,'#ffffff'); P.rect(22,9,13,6,'#ffffff'); P.rect(3,18,34,18,sheet); P.rect(3,18,34,2,'rgba(255,255,255,.3)'); });
const netBed=()=>S(40,46,20,44,(g,P)=>{ P.rect(3,16,34,26,'#c4563c'); for(let y=18;y<42;y+=4) P.rect(3,y,34,1,'#e8b83a'); P.rect(5,17,12,6,'#f4f1ea'); P.rect(1,1,38,40,'rgba(240,240,240,.28)'); P.rect(1,1,38,1,'#e4e4e0'); P.rect(1,1,1,40,'#e4e4e0'); P.rect(38,1,1,40,'#e4e4e0'); });
const sleepBag=()=>S(18,34,9,32,(g,P)=>{ P.rect(2,2,14,30,'#3f6e9a'); P.rect(2,2,14,8,'#5a8dbf'); P.rect(4,3,10,5,'#f4f1ea'); for(let y=12;y<32;y+=5) P.rect(2,y,14,1,'#2f5278'); });
const lantern=()=>S(10,14,5,13,(g,P)=>{ P.rect(3,0,4,2,'#3a3a48'); P.rect(2,2,6,9,'#3a3a48'); P.rect(3,3,4,7,'#ffd86b'); P.rect(2,11,6,2,'#3a3a48'); },true);
const fan=()=>S(16,30,8,28,(g,P)=>{ P.disc(8,7,6,'#e4e4e0'); P.disc(8,7,2,'#9aa0a8'); for(const [x,y] of [[8,2],[3,9],[13,9]]) P.disc(x,y,2,'#c9d3da'); P.rect(7,13,2,13,'#9aa0a8'); P.rect(3,26,10,2,'#9aa0a8'); });
const aircon=()=>S(30,12,15,11,(g,P)=>{ P.rect(1,1,28,9,'#f4f4f1'); P.rect(3,7,24,1,'#c9c9c4'); P.px(25,3,'#7de07a'); },true);
const kettleTable=()=>S(26,20,13,18,(g,P)=>{ P.rect(2,8,22,7,'#8a5d3b'); P.rect(2,8,22,2,'#a7744c'); P.rect(4,15,2,4,'#5a3a22'); P.rect(20,15,2,4,'#5a3a22'); P.rect(6,2,6,6,'#d4d8dc'); P.rect(12,4,2,2,'#d4d8dc'); P.rect(16,4,3,4,'#f4f1ea'); P.rect(20,5,2,3,'#8c231f'); });
const shower=()=>S(26,40,13,38,(g,P)=>{ P.rect(1,1,24,36,'#e9f0f2'); P.rect(1,1,24,36,'rgba(150,200,220,.25)'); P.rect(18,3,5,2,'#9aa0a8'); P.rect(20,5,2,6,'#9aa0a8'); P.rect(4,30,18,6,'#c4d3d8'); P.rect(1,1,1,36,'#9aa0a8'); });
const bathtub=()=>S(44,26,22,24,(g,P)=>{ P.rect(2,4,40,18,'#f4f4f1'); P.rect(5,7,34,12,'#8fd3ea'); P.rect(6,8,10,2,'#d8f2fb'); P.rect(36,2,3,4,'#9aa0a8'); P.rect(4,22,4,3,'#d4d8dc'); P.rect(36,22,4,3,'#d4d8dc'); });
const towel=()=>S(14,22,7,21,(g,P)=>{ P.rect(1,1,12,2,'#9aa0a8'); P.rect(3,3,8,16,'#f4f1ea'); P.rect(3,15,8,2,'#8fc4c6'); },true);
const charger=(bank)=>S(12,12,6,11,(g,P)=>{ if(bank){ P.rect(2,3,8,7,'#2a2a2f'); P.rect(3,4,3,2,'#7de07a'); } else { P.rect(3,2,6,8,'#f4f4f1'); P.rect(5,4,1,2,'#3a3a48'); P.rect(7,4,1,2,'#3a3a48'); } });
const laptop=()=>S(22,16,11,15,(g,P)=>{ P.rect(3,1,16,10,'#2a2a2f'); P.rect(4,2,14,8,'#5aa9d6'); P.rect(5,3,6,2,'#d8f2fb'); P.rect(1,11,20,3,'#9aa0a8'); });
const lakeWindow=()=>S(48,26,24,25,(g,P)=>{ P.rect(1,1,46,22,'#6e472c'); P.rect(3,3,42,18,'#bfe3f2'); P.rect(3,11,42,4,'#7fa98a'); P.rect(3,15,42,6,'#3b8ed3'); for(let x=5;x<44;x+=6) P.px(x,17,'#d8efff'); P.rect(23,3,2,18,'#6e472c'); });
const balcony=(w=96)=>S(w,18,w/2,16,(g,P)=>{ P.rect(1,10,w-2,4,'#a26c40'); for(let x=2;x<w-2;x+=5) P.rect(x,2,2,9,'#8a5d3b'); P.rect(1,1,w-2,2,'#bb8352'); });

/* ---------- Đà Lạt ---------- */
function pine(seed=0,size=1){ const h=Math.round((40+hash(seed,3)*14)*size), w=Math.round(h*.55);
  return S(w,h,w/2,h-2,(g,P)=>{ const cx=w/2; P.rect(cx-1,h-10,3,9,'#5a3a22');
    for(let k=0;k<4;k++){ const y=4+k*(h-14)/4, hw=Math.round(3+k*(w/2-3)/3.2); for(let r=0;r<(h-14)/4+3;r++){ const ww=Math.round(hw*r/((h-14)/4+3)); P.rect(cx-ww,y+r,ww*2+1,1,k%2?'#2f5e3a':'#3a6e46'); } }
    P.px(cx-2,8,'#5a8e5e'); P.px(cx+1,h*.5,'#5a8e5e'); }); }
const teaBush=()=>S(18,11,9,9,(g,P)=>{ P.rect(1,3,16,6,'#4f9a3e'); P.rect(1,3,16,2,'#6cb24f'); for(let x=2;x<16;x+=3) P.px(x,2,'#86c860'); });
const greenhouse=(w=200,h=110)=>S(w,h,w/2,h-2,(g,P)=>{ g.fillStyle='rgba(220,240,245,.22)'; g.fillRect(2,2,w-4,h-4);
  for(let x=2;x<w;x+=24) P.rect(x,2,2,h-4,'rgba(240,248,250,.8)'); P.rect(2,2,w-4,2,'#f4f8fa'); P.rect(2,h-4,w-4,2,'#f4f8fa'); P.rect(2,2,2,h-4,'#f4f8fa'); P.rect(w-4,2,2,h-4,'#f4f8fa'); },false);
function windmill(fr=0){ return S(46,70,23,68,(g,P)=>{ P.rect(19,24,8,44,'#e4ddd0'); P.rect(19,24,2,44,'#f4efe6'); P.rect(21,56,4,12,'#6e472c'); P.rect(18,20,10,6,'#c4382e');
  const a=fr*.35; for(let k=0;k<4;k++){ const an=a+k*Math.PI/2; for(let r=2;r<20;r++){ const x=23+Math.cos(an)*r, y=22+Math.sin(an)*r; P.rect(x,y,2,2,r>6?'#f4f1ea':'#8a8e94'); } } P.disc(23,22,2,'#3a3a48'); }); }
function cow(fr=0){ return S(30,22,15,20,(g,P)=>{ P.rect(5,5,18,10,'#f4f1ea'); P.rect(9,6,6,5,'#2a2a2f'); P.rect(17,9,4,4,'#2a2a2f'); P.rect(22,3,7,7,'#f4f1ea'); P.rect(25,9,4,3,'#f2b8b0'); P.px(24,5,OUT); P.rect(21,1,2,3,'#d6d0c4');
  const l=fr%2; P.rect(6,15,2,5-l,'#d6d0c4'); P.rect(11,15,2,5-(1-l),'#d6d0c4'); P.rect(16,15,2,5-l,'#d6d0c4'); P.rect(20,15,2,5-(1-l),'#d6d0c4'); P.rect(3,6,2,6,'#d6d0c4'); P.rect(14,14,4,2,'#f2b8b0'); }); }
function pig(fr=0){ return S(22,16,11,14,(g,P)=>{ P.disc(10,8,6,'#f2b0a8'); P.rect(4,4,12,8,'#f2b0a8'); P.rect(15,5,5,5,'#f2b0a8'); P.rect(18,7,3,3,'#e08a84'); P.px(17,5,OUT); P.px(14,3,'#e08a84'); const l=fr%2; P.rect(5,12,2,3-l,'#e08a84'); P.rect(13,12,2,3-(1-l),'#e08a84'); P.px(3,6,'#e08a84'); }); }
function horse(fr=0,col='#8a5a36',gallop=false){ return S(40,30,20,28,(g,P)=>{ const b=gallop?(fr%2):0;
  P.rect(8,10-b,22,10,col); P.rect(26,4-b,6,10,col); P.rect(30,2-b,7,6,col); P.rect(34,6-b,3,3,'#3a2418'); P.px(33,3-b,OUT); P.rect(25,3-b,4,8,'#3a2418'); P.rect(4,10-b,5,8,'#3a2418');
  const L=gallop?[[10,fr%4<2?-2:2],[14,fr%4<2?2:-2],[24,fr%4<2?-2:2],[28,fr%4<2?2:-2]]:[[10,fr%2?1:0],[14,fr%2?0:1],[24,fr%2?1:0],[28,fr%2?0:1]];
  for(const [x,dx] of L){ P.rect(x+dx,20-b,2,8,col); P.rect(x+dx,27-b,2,1,'#2a2a2f'); } P.rect(8,10-b,22,2,'rgba(255,255,255,.12)'); }); }
const saddle=()=>S(14,8,7,7,(g,P)=>{ P.rect(1,2,12,4,'#5a2a1c'); P.rect(2,1,10,1,'#8a4a32'); P.rect(6,6,2,2,'#c9a35e'); },false);
const coop=()=>shop({w:60,wallH:18,roofH:22,roof:'tile',wall:'wood',doors:[24],sign:'CHUONG GA'});
const sty=()=>shop({w:76,wallH:18,roofH:22,roof:'stone',wall:'wood',doors:[30],sign:'CHUONG LON'});
const barn=()=>shop({w:92,wallH:26,roofH:30,roof:'tile',wall:'wood',doors:[38],sign:'TRAI BO SUA',awning:'#c4382e'});
const crate=()=>S(14,13,7,12,(g,P)=>{ P.rect(1,2,12,10,'#c08552'); P.rect(1,2,12,2,'#dca170'); P.rect(1,6,12,1,'#8a5d3b'); P.rect(6,2,1,10,'#8a5d3b'); P.rect(3,0,3,2,'#e0445a'); P.rect(8,0,3,2,'#f28a1e'); });
const stove=()=>S(30,26,15,24,(g,P)=>{ P.rect(1,8,28,16,'#5a5a66'); P.rect(1,8,28,3,'#7a7a86'); P.disc(9,7,4,'#2a2a2f'); P.disc(21,7,4,'#2a2a2f'); P.rect(5,2,9,4,'#9aa0a8'); P.rect(18,3,8,3,'#c4382e'); P.px(9,11,'#ff9f2e'); P.px(21,11,'#ff9f2e'); });
const stall=(col,items)=>S(44,36,22,34,(g,P)=>{ P.rect(4,12,36,20,'#c08552'); P.rect(4,12,36,3,'#dca170'); for(let x=0;x<44;x+=6){ P.rect(x,2,6,8,(x/6)%2?'#f4f1ea':col); } P.rect(0,10,44,2,OUT);
  items.forEach((c,k)=>{ P.disc(10+k*8,16,3,c); }); P.rect(5,12,2,22,'#6e472c'); P.rect(37,12,2,22,'#6e472c'); });
const busStop=()=>S(40,40,20,38,(g,P)=>{ P.rect(3,6,2,32,'#5a5a66'); P.rect(35,6,2,32,'#5a5a66'); P.rect(1,2,38,6,'#2f7a46'); A.drawText(g,'XE BUYT',5,3,'#f4f1ea'); P.rect(6,24,28,4,'#a7744c'); });
const grabSign=()=>S(28,24,14,22,(g,P)=>{ P.rect(13,9,2,14,'#5a5a66'); P.rect(1,1,26,9,'#00b14f'); A.drawText(g,'GRAB',6,3,'#f4f1ea'); });

/* ---------- trường đua ---------- */
const grandstand=(w=320)=>S(w,48,w/2,46,(g,P)=>{ for(let r=0;r<4;r++){ P.rect(2,4+r*10,w-4,10,r%2?'#9aa0a8':'#b8bcc2'); for(let x=6;x<w-6;x+=7){ const c=['#c4382e','#3f6e9a','#f2c43d','#5a8d64','#f2a6b8','#2a2a2f','#f4f1ea'][Math.floor(hash(x,r,95)*7)]; P.rect(x,r*10+2,4,4,'#f3b194'); P.rect(x,r*10+6,4,4,c); } }
  P.rect(0,0,w,3,'#c4382e'); P.rect(0,44,w,2,'#5a5a66'); });
const finishLine=(h=120)=>S(10,h,5,h-1,(g,P)=>{ for(let y=0;y<h;y+=4) for(let x=0;x<8;x+=4) P.rect(1+x+((y/4)%2?4:0)%8,y,4,4,'#f4f1ea'); P.rect(1,0,8,h,'rgba(0,0,0,0)'); },false);
const rail=(w=16)=>S(w,8,w/2,7,(g,P)=>{ P.rect(0,1,w,2,'#f4f1ea'); P.rect(1,1,2,6,'#f4f1ea'); P.rect(w-3,1,2,6,'#f4f1ea'); });

/* ---------- icon đồ mới (14×14) ---------- */
const ICONX={
  flower:P=>{ P.rect(5,6,2,6,'#4f8a38'); for(const [x,y] of [[6,2],[3,4],[9,4],[4,7],[8,7]]) P.disc(x,y,1,'#ff9fb2'); P.px(6,5,'#ffe066'); },
  leaf:P=>{ P.disc(6,6,4,'#5aa84a'); P.rect(6,2,1,9,'#3a7a32'); P.px(4,4,'#79c25c'); },
  shoot:P=>{ for(let y=2;y<11;y++) P.rect(5-(y>>2),y,3+(y>>2),1,y%3?'#c9b46a':'#a8933f'); },
  greens:P=>{ P.disc(4,7,3,'#5fae46'); P.disc(8,6,3,'#79c25c'); P.rect(5,9,3,3,'#e8f0d8'); },
  egg:P=>{ P.disc(6,6,4,'#f4ead8'); P.px(4,4,'#ffffff'); },
  mushroom:P=>{ P.disc(6,5,4,'#a8653a'); P.px(4,4,'#f4f1ea'); P.px(8,3,'#f4f1ea'); P.rect(5,8,3,4,'#efe6d3'); },
  fish2:P=>{ P.rect(3,5,6,3,'#d9a14a'); P.rect(2,6,1,1,'#d9a14a'); P.rect(9,4,2,5,'#b5812e'); P.px(4,5,OUT); },
  fish3:P=>{ P.rect(2,5,8,3,'#8aa0b8'); P.rect(2,5,8,1,'#f2a07a'); P.rect(10,4,2,5,'#6b829a'); P.px(3,6,OUT); },
  seed:P=>{ P.rect(3,3,7,8,'#e8d8b4'); P.rect(3,3,7,2,'#c9a35e'); P.disc(6,8,2,'#5fae46'); },
  sapling:P=>{ P.rect(4,8,5,4,'#a7744c'); P.rect(6,3,1,6,'#5a3a22'); P.disc(5,3,2,'#5fae46'); P.disc(8,4,2,'#79c25c'); },
  milk:P=>{ P.rect(4,2,4,2,'#3f6e9a'); P.rect(3,4,6,8,'#f4f4f1'); P.rect(3,7,6,2,'#3f6e9a'); },
  pig:P=>{ P.disc(6,7,4,'#f2b0a8'); P.rect(8,6,3,3,'#e08a84'); P.px(7,5,OUT); },
  shrimp:P=>{ for(let k=0;k<6;k++) P.rect(2+k,4+Math.abs(k-3),2,2,'#f27a4a'); P.px(2,4,OUT); P.rect(9,8,2,2,'#e05a2a'); },
  crate:P=>{ P.rect(2,3,9,8,'#c08552'); P.rect(2,6,9,1,'#8a5d3b'); P.rect(6,3,1,8,'#8a5d3b'); },
  feed:P=>{ P.rect(3,3,7,8,'#d8c49a'); P.rect(4,2,5,2,'#b8a070'); P.rect(4,6,5,2,'#5a8d64'); },
  dish:P=>{ P.disc(6,8,4,'#f4f1ea'); P.disc(6,7,3,'#e8a05a'); P.px(5,6,'#5fae46'); P.px(7,7,'#c4382e'); },
  ing_tiem_rau:P=>{ P.disc(6,7,3,'#5fae46'); P.rect(5,2,1,4,'#3a7a32'); },
  ing_tiem_thit:P=>{ P.disc(6,7,4,'#d9665a'); P.disc(6,7,2,'#f2b0a8'); },
  ing_tiem_kho:P=>{ P.rect(3,3,7,8,'#f4ead8'); P.rect(3,3,7,2,'#c4382e'); },
  tr_dong_xu_co:P=>{ P.disc(6,6,4,'#b08a3a'); P.disc(6,6,2,'#8a6a2a'); P.rect(5,5,2,2,'#e8d08a'); },
  tr_binh_gom:P=>{ P.rect(4,1,4,2,'#3f6e9a'); P.disc(6,7,4,'#e8e0d0'); P.rect(3,6,7,1,'#3f6e9a'); P.px(5,8,'#3f6e9a'); P.px(7,8,'#3f6e9a'); },
  tr_ngoc_trai:P=>{ P.disc(6,7,4,'#8a8a9a'); P.disc(6,6,2,'#f8f4ff'); P.px(5,5,'#ffffff'); },
  tr_ruong_bau:P=>{ P.rect(1,4,11,7,'#8a5a36'); P.rect(1,4,11,2,'#a86e44'); P.rect(1,7,11,1,'#e8b83a'); P.rect(5,6,3,3,'#e8b83a'); P.px(3,3,'#ffd84a'); P.px(9,2,'#ffd84a'); },
};
for(const [k,c] of Object.entries(SHARED.CROPS)){ const col='#'+c.col; ICONX['crop_'+k]=P=>{ if(c.kind==='hoa'){ P.rect(5,6,2,6,'#4f8a38'); P.disc(6,4,3,col); P.px(6,4,'#ffe066'); } else if(k==='mu_cao_su'){ P.rect(3,4,7,7,'#d8d8d0'); P.rect(3,4,7,2,'#f4f1ea'); } else { P.disc(6,7,4,col); P.px(4,5,'rgba(255,255,255,.6)'); P.rect(6,2,1,2,'#3a7a32'); } }; }
// gắn icon mới vào bộ icon cũ
const oldIcon=A.icon;
A.icon=function(name,scale=1){ if(!ICONX[name]) return oldIcon(name,scale); const c=cv(14,14), g=c.getContext('2d'); g.translate(1,1); ICONX[name](A.painter(g)); g.setTransform(1,0,0,1,0,0); A.outline(c);
  if(scale===1) return c; const s=cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };

/* ---------- xe máy, đồn công an ---------- */
// xe số nhìn nghiêng; wheelie: bánh trước nhấc lên; fallen: xe đổ nằm ngang
function motorbike(fr=0,col='#c4382e',mode=''){ return S(40,26,16,24,(g,P)=>{ const lift=mode==='wheelie'?7:0, f=fr%2;
  if(mode==='fallen'){ P.rect(4,16,30,6,col); P.disc(8,21,4,'#2a2a2f'); P.disc(30,19,4,'#2a2a2f'); P.rect(14,14,10,3,'#2a2a2f'); return; }
  const wb=(x,y)=>{ P.disc(x,y,5,'#2a2a2f'); P.disc(x,y,2,'#9aa0a8'); P.px(x+(f?1:-1),y-3,'#9aa0a8'); };
  wb(7,19); wb(32,19-lift);
  for(let x=9;x<31;x++){ const y=Math.round(13-(x-9)*lift/22); P.rect(x,y,1,4,col); }               // thân xe nghiêng theo đầu xe
  P.rect(11,10-Math.round(lift*.1),11,3,'#2a2a2f'); P.rect(27,8-lift,2,6,'#9aa0a8'); P.rect(25,7-lift,6,2,'#2a2a2f'); P.px(31,10-lift,'#ffd86b'); P.rect(4,15,6,2,'#9aa0a8'); }); }
const djBooth=()=>S(80,34,40,32,(g,P)=>{ P.rect(1,10,78,22,'#2a2236'); P.rect(1,10,78,3,'#5a4a72'); for(let x=6;x<74;x+=8) P.rect(x,15,5,3,['#ff4fa3','#4fd1ff','#ffd84a','#7de07a'][(x/8|0)%4]); P.disc(22,6,6,'#3a3a48'); P.disc(22,6,2,'#9aa0a8'); P.disc(58,6,6,'#3a3a48'); P.disc(58,6,2,'#9aa0a8'); P.rect(34,2,12,8,'#5aa9d6'); });
const speaker=()=>S(22,40,11,38,(g,P)=>{ P.rect(1,1,20,36,'#1c1a22'); P.disc(11,11,6,'#3a3a48'); P.disc(11,11,2,'#9aa0a8'); P.disc(11,26,8,'#3a3a48'); P.disc(11,26,3,'#9aa0a8'); });
const discoBall=()=>S(22,34,11,33,(g,P)=>{ P.rect(10,0,2,14,'#9aa0a8'); P.disc(11,22,9,'#cfd6e0'); for(let y=14;y<31;y+=3) for(let x=3;x<20;x+=3) P.px(x,y,(x+y)%2?'#ffffff':'#8a96a8'); },true);
const flagPole=()=>S(20,40,3,38,(g,P)=>{ P.rect(2,2,2,36,'#9aa0a8'); P.rect(4,3,15,10,'#da251d'); P.px(11,7,'#ffd84a'); P.rect(10,8,3,1,'#ffd84a'); P.px(11,9,'#ffd84a'); P.px(10,10,'#ffd84a'); P.px(12,10,'#ffd84a'); });
const cellBars=(w=48)=>S(w,40,w/2,38,(g,P)=>{ P.rect(0,2,w,3,'#5a5a66'); P.rect(0,34,w,3,'#5a5a66'); for(let x=2;x<w;x+=6) P.rect(x,2,2,35,'#7a7a86'); },true);
const policeDesk=()=>S(60,26,30,24,(g,P)=>{ P.rect(1,8,58,15,'#6e472c'); P.rect(1,8,58,3,'#8a5d3b'); P.rect(6,2,10,7,'#f4f1ea'); P.rect(40,3,12,6,'#2a2a2f'); P.rect(41,4,10,4,'#5aa9d6'); P.rect(24,4,8,5,'#c4382e'); });
const mountain=(w=200,h=60,seed=0)=>S(w,h,w/2,h-1,(g,P)=>{ for(let x=0;x<w;x++){ const t=x/w, hh=Math.round(h*(.55+.35*Math.sin(t*3.14)+.08*Math.sin(x*.13+seed))); P.rect(x,h-hh,1,hh,'#6f8f7a'); P.rect(x,h-hh,1,2,'#8fae96'); } },false);
Object.assign(A,{djBooth,speaker,discoBall,motorbike,flagPole,cellBars,policeDesk,mountain,label,signPost,shop,fence,whiteFence,crop,bush2,receptionDesk,bathHouse,counter,shelf2:shelf,basket,rack,mirror,chessTable,pokerTable,roundTable,barCounter,sofa,coffeeTable,palm,plantWall,
  longTable,whiteChair,woodTable,pantry,elevator,exitSign,printer,bossDesk,bedSingle,bedDouble,netBed,sleepBag,lantern,fan,aircon,kettleTable,shower,bathtub,towel,charger,laptop,lakeWindow,balcony,
  pine,teaBush,greenhouse,windmill,cow,pig,horse,saddle,coop,sty,barn,crate,stove,stall,busStop,grabSign,grandstand,finishLine,rail});
})();
