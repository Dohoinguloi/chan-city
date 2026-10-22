/* Chan City — nội thất siêu thị, tiệm net, quán cafe, quán cô Lan; xe đạp công cộng; xe máy nhìn từ trước/sau khi đi dọc. */
(function(){
const A=ART, T=A.T, OUT='#1c1516', TE=A.TILE_EXT, hash=A.hash;
const S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const seg=(P,x0,y0,x1,y1,c)=>{ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1); for(let i=0;i<=n;i++) P.px(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c); };
const ring=(g,P,x,y,r,c)=>{ P.disc(x,y,r,c); for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(dx*dx+dy*dy<(r-1.4)**2) g.clearRect(x+dx,y+dy,1,1); };

/* ---------- sàn ---------- */
for(const k of ['q','k','w']) A.WALKABLE.add(k);
// q: gạch men trắng siêu thị
TE.q=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,(tx+ty)%2?'#e6eae8':'#f1f3f1'); P.rect(X,Y,T,1,'#d3d9d7'); P.rect(X,Y,1,T,'#d3d9d7'); if(hash(tx,ty,71)<.25) P.px(X+5,Y+6,'#ffffff'); };
// k: thảm tiệm net, chấm neon
TE.k=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#23263a'); for(let y=0;y<T;y+=4) for(let x=(y/4%2)*2;x<T;x+=4) P.px(X+x,Y+y,'#2d3149');
  if(hash(tx,ty,72)<.14) P.px(X+7,Y+9,['#4fd1ff','#ff4fa3','#7de07a'][Math.floor(hash(tx,ty,73)*3)]); };
// w: sàn gỗ xương cá quán cafe
TE.w=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#946542'); for(let k=0;k<T;k+=4){ const off=(ty*4+k)/4%2?0:4; for(let x=0;x<T;x+=8){ P.rect(X+(x+off)%T,Y+k,4,3,'#a6754c'); P.rect(X+(x+off)%T,Y+k+3,4,1,'#7a5233'); } } };

/* ---------- siêu thị ---------- */
const PROD=['#d9463a','#f2c43d','#3f8a3a','#4d6f99','#e88a2e','#f4f1ea','#a259ff','#5aa9d6','#c4382e','#8cc95a'];
const gondola=(seed=0)=>S(60,42,30,40,(g,P)=>{ P.rect(1,2,58,38,'#c9ced4'); P.rect(1,2,58,2,'#e8ecef'); P.rect(1,36,58,4,'#8a9098');
  for(let s=0;s<3;s++){ const y=6+s*10; P.rect(3,y,54,8,'#f4f6f8');
    for(let x=4,i=0;;i++){ const w=3+Math.floor(hash(seed,i,s+75)*3), h=4+Math.floor(hash(i,s,seed+76)*4), c=PROD[Math.floor(hash(seed,s*20+i,74)*PROD.length)]; if(x+w>56) break;
      P.rect(x,y+8-h,w,h,c); P.rect(x,y+8-h,w,1,'rgba(255,255,255,.4)'); if(w>3) P.px(x+1,y+10-h,'#ffffff'); x+=w+1; }
    P.rect(3,y+8,54,2,'#9aa0a8'); for(let x=6;x<54;x+=12) P.rect(x,y+8,4,2,'#ffd84a'); } });          // thanh giá + tem giá vàng
const drinkFridge=(tint='#d9463a')=>S(34,46,17,44,(g,P)=>{ P.rect(1,1,32,43,'#e8ecef'); P.rect(1,1,32,6,tint); A.drawText(g,'LANH',9,2,'#ffffff');
  P.rect(3,8,28,33,'#bfe6f2'); P.rect(16,8,1,33,'#9aa0a8');
  for(let s=0;s<4;s++){ const y=10+s*8; P.rect(3,y+6,28,1,'#9aa0a8'); for(let x=4;x<30;x+=3) if(x!==16){ P.rect(x,y+1,2,5,PROD[(x+s*3)%PROD.length]); P.px(x,y,'#e8ecef'); } }
  P.rect(5,9,1,30,'rgba(255,255,255,.45)'); P.rect(19,9,1,30,'rgba(255,255,255,.45)'); P.rect(14,20,1,8,'#5a5e68'); P.rect(18,20,1,8,'#5a5e68'); });
const checkout=()=>S(56,34,28,32,(g,P)=>{ P.rect(1,12,54,19,'#3f6fb0'); P.rect(1,12,54,3,'#5a8ad0'); P.rect(1,28,54,3,'#2a4a80');
  P.rect(3,8,30,5,'#2a2a2f'); for(let x=4;x<32;x+=3) P.px(x,10,'#5a5a66');                                         // băng chuyền
  P.rect(8,4,6,4,'#f2c43d'); P.rect(15,5,5,3,'#d9463a'); P.rect(21,4,5,4,'#3f8a3a');
  P.rect(36,1,14,9,'#2a2a2f'); P.rect(37,2,12,6,'#7de07a'); P.rect(38,3,5,1,'#e8ffe0'); P.rect(42,10,2,2,'#5a5a66'); P.rect(34,11,18,2,'#9aa0a8');   // máy tính tiền
  for(let x=4;x<52;x+=8) P.rect(x,18,5,7,PROD[(x/8|0)%PROD.length]); });                                         // kẹo bày mặt trước
const produceBin=cols=>S(36,24,18,22,(g,P)=>{ P.rect(1,9,34,13,'#a7744c'); P.rect(1,9,34,2,'#c08552'); for(let x=1;x<35;x+=11) P.rect(x,9,1,13,'#6e472c'); P.rect(1,20,34,2,'#6e472c');
  cols.forEach((c,i)=>{ const x0=2+i*11; for(let k=0;k<7;k++){ const x=x0+2+(k%3)*3, y=4+Math.floor(k/3)*2+(k%2); P.disc(x,y+2,2,c); P.px(x-1,y+1,'rgba(255,255,255,.55)'); } });
  P.rect(13,14,10,4,'#f4f1ea'); P.rect(14,15,8,2,'#d9463a'); });
const basketStack=()=>S(18,18,9,16,(g,P)=>{ for(let k=0;k<3;k++){ const y=11-k*4; P.rect(2,y,14,5,'#d9463a'); P.rect(2,y,14,1,'#f06a5a'); for(let x=4;x<15;x+=3) P.px(x,y+2,'#a8322a'); } P.rect(2,1,1,4,'#5a5a66'); P.rect(15,1,1,4,'#5a5a66'); P.rect(2,1,14,1,'#5a5a66'); });
const trolley=()=>S(24,22,12,20,(g,P)=>{ P.rect(3,4,17,10,'#c9ced4'); for(let x=4;x<20;x+=3) P.rect(x,4,1,10,'#9aa0a8'); for(let y=6;y<14;y+=3) P.rect(3,y,17,1,'#9aa0a8');
  P.rect(19,1,4,2,'#d9463a'); P.rect(20,3,1,12,'#9aa0a8'); P.rect(3,15,18,2,'#9aa0a8'); P.disc(6,18,2,'#2a2a2f'); P.disc(18,18,2,'#2a2a2f'); });

/* ---------- tiệm net ---------- */
const SCREEN=[['#2a3a8a','#4fd1ff','#ffd84a'],['#3a1a4a','#ff4fa3','#7de07a'],['#1a3a2a','#7de07a','#f4f1ea'],['#4a1a1a','#ff6a55','#ffd84a']];
const pcStation=(seed=0,fr=0)=>S(32,34,16,32,(g,P)=>{ const [bg,c1,c2]=SCREEN[seed%4];
  P.rect(1,18,30,6,'#2a2a30'); P.rect(1,18,30,2,'#3a3a44'); P.rect(2,24,2,8,'#1a1a1e'); P.rect(28,24,2,8,'#1a1a1e'); P.rect(1,23,30,1,'#4fd1ff');   // bàn + led
  P.rect(5,1,22,14,'#111114'); P.rect(6,2,20,11,bg); P.rect(8+(fr%2),8,6,4,c1); P.rect(17,4+(fr%2),6,3,c2); P.rect(7,11,18,1,c1); P.px(20,9,'#ffffff'); P.px(11,5,'#ffffff');   // màn hình game
  P.rect(14,15,4,3,'#2a2a30'); P.rect(11,17,10,1,'#2a2a30');
  P.rect(5,20,14,3,'#18181c'); for(let x=6;x<18;x+=2) P.px(x,21,['#ff4fa3','#4fd1ff','#7de07a'][(x+seed)%3]); P.rect(22,20,4,3,'#18181c'); P.px(23,21,'#4fd1ff'); });
const gamingChair=(col='#d9263a')=>S(18,24,9,22,(g,P)=>{ P.rect(3,1,12,13,'#18181c'); P.rect(5,2,8,11,col); P.rect(7,2,4,11,'#18181c'); P.rect(4,0,10,2,'#18181c');
  P.rect(1,10,3,5,'#18181c'); P.rect(14,10,3,5,'#18181c'); P.rect(3,14,12,3,'#2a2a30'); P.rect(8,17,2,3,'#5a5a66'); P.rect(3,20,12,1,'#5a5a66'); for(const x of [3,8,14]) P.px(x,21,'#2a2a2f'); });
const poster=(seed=0)=>S(18,24,9,23,(g,P)=>{ const [bg,c1,c2]=SCREEN[seed%4]; P.rect(1,1,16,22,bg); P.rect(3,4,12,10,c1); P.disc(9,8,3,c2); P.rect(3,16,12,2,c2); P.rect(3,19,8,2,'#f4f1ea'); });
const netCounter=()=>S(60,30,30,28,(g,P)=>{ P.rect(1,10,58,18,'#18181c'); P.rect(1,10,58,3,'#2a2a30'); P.rect(1,26,58,2,'#ff4fa3'); A.drawText(g,'NAP GIO',17,17,'#4fd1ff');
  P.rect(38,1,16,10,'#111114'); P.rect(39,2,14,7,'#2a3a8a'); P.rect(40,3,8,1,'#4fd1ff'); P.rect(40,5,11,1,'#f4f1ea'); P.rect(44,10,4,1,'#2a2a30');
  P.rect(6,4,6,7,'#f2c43d'); P.rect(13,6,8,5,'#d9463a'); P.rect(22,5,4,6,'#3f8a3a'); });                            // mì tôm, nước ngọt bày quầy

/* ---------- quán cafe ---------- */
const cafeBar=(w=128)=>S(w,38,w/2,36,(g,P)=>{ P.rect(1,16,w-2,19,'#5a3a22'); P.rect(1,16,w-2,4,'#d8c8a8'); P.rect(1,20,w-2,1,'#3a2414');
  for(let x=4;x<w-6;x+=8) P.rect(x,23,6,10,'#6e472c');
  P.rect(8,3,26,13,'#c8ccd2'); P.rect(8,3,26,2,'#e8ecef'); P.rect(11,7,20,4,'#2a2a2f'); P.rect(13,11,2,4,'#5a5e68'); P.rect(25,11,2,4,'#5a5e68'); P.rect(12,14,4,2,'#f4f1ea'); P.rect(24,14,4,2,'#f4f1ea');
  P.px(15,8,'#d9463a'); P.px(27,8,'#7de07a');                                                                     // máy espresso
  P.rect(38,5,8,11,'#2a2a2f'); P.rect(39,2,6,4,'#6e472c'); P.rect(40,3,4,2,'#3a2414');                           // máy xay
  for(let k=0;k<4;k++) P.rect(50+k*5,11,4,5,k%2?'#f4f1ea':'#e8d8b4');
  const gx=w-44; P.rect(gx,4,40,12,'#bfe6f2'); P.rect(gx,4,40,1,'#ffffff'); for(let k=0;k<5;k++){ P.rect(gx+3+k*7,10,6,4,['#e8a85a','#f2c4d0','#8a5a36','#f4e6c4','#d98a3a'][k]); P.px(gx+4+k*7,10,'#ffffff'); } });   // tủ bánh
const menuBoard=(t='MENU')=>S(46,28,23,27,(g,P)=>{ P.rect(1,1,44,25,'#6e472c'); P.rect(3,3,40,21,'#2e3a32'); A.drawText(g,t,23-A.textW(t)/2|0,5,'#f4f1ea');
  for(let y=12;y<23;y+=4){ P.rect(6,y,20,1,'#c8d0c8'); P.rect(32,y,8,1,'#ffd84a'); } });
const cafeTable=(seed=0)=>S(36,30,18,26,(g,P)=>{ const ch=x=>{ P.rect(x,8,8,4,'#8a5d3b'); P.rect(x,12,8,8,'#a7744c'); P.rect(x+1,20,1,6,'#5a3a22'); P.rect(x+6,20,1,6,'#5a3a22'); }; ch(1); ch(27);
  P.disc(18,12,8,'#d8d4cc'); P.disc(18,11,7,'#f6f4ef'); P.rect(17,19,2,7,'#3a3a48'); P.rect(13,26,10,2,'#3a3a48');
  P.rect(14,8,4,4,seed%2?'#8a5a36':'#f4f1ea'); P.rect(15,9,2,1,'#5a3a22'); P.rect(20,10,4,2,'#e8a85a'); if(seed%3===0) P.rect(19,6,1,4,'#5fae46'); });
const pendant=()=>S(12,22,6,21,(g,P)=>{ P.rect(5,0,1,11,'#2a2a2f'); P.rect(2,11,8,4,'#2a2a2f'); P.rect(3,15,6,2,'#ffd86b'); P.rect(4,17,4,2,'rgba(255,216,107,.45)'); },false);

/* ---------- quán cơm cô Lan ---------- */
const stool=(c='#d9263a')=>S(10,10,5,9,(g,P)=>{ P.rect(1,1,8,3,c); P.rect(1,1,8,1,'rgba(255,255,255,.35)'); P.rect(1,4,2,5,c); P.rect(7,4,2,5,c); P.rect(3,5,4,1,c); });
const eatTable=(seed=0)=>S(42,26,21,24,(g,P)=>{ P.rect(1,6,40,9,'#c9ced4'); P.rect(1,6,40,2,'#e8ecef'); P.rect(1,15,40,2,'#8a9098'); P.rect(3,17,2,8,'#8a9098'); P.rect(37,17,2,8,'#8a9098');
  if(seed%2){ P.disc(21,7,6,'#3a3a48'); P.disc(21,6,5,'#c4382e'); P.rect(18,4,6,2,'#f4f1ea'); P.px(20,1,'#e8ecef'); P.px(22,0,'#e8ecef'); }      // nồi lẩu
  else for(const x of [10,21,32]){ P.disc(x,9,3,'#f4f1ea'); P.disc(x,9,2,'#e8c87a'); }
  P.rect(3,7,4,5,'#d4a14a'); P.rect(4,4,1,3,'#8a5d3b'); P.rect(5,3,1,4,'#8a5d3b'); P.rect(35,8,4,4,'#f2c43d'); });                    // ống đũa + hộp giấy
const ricePot=()=>S(26,26,13,24,(g,P)=>{ P.rect(4,10,18,12,'#9aa0a8'); P.rect(4,10,18,2,'#c8ccd2'); P.rect(2,12,2,3,'#5a5e68'); P.rect(22,12,2,3,'#5a5e68'); P.rect(6,7,14,3,'#c8ccd2'); P.rect(11,5,4,2,'#5a5e68');
  P.rect(3,22,20,3,'#5a3a22'); P.px(9,2,'#e8ecef'); P.px(14,0,'#e8ecef'); P.px(17,3,'#e8ecef'); });
const foodCase=()=>S(64,32,32,30,(g,P)=>{ P.rect(1,14,62,16,'#8a5d3b'); P.rect(1,14,62,3,'#a7744c'); P.rect(3,2,58,12,'#bfe6f2'); P.rect(3,2,58,1,'#ffffff'); P.rect(3,13,58,1,'#9aa0a8');
  for(let k=0;k<6;k++){ const x=6+k*9; P.rect(x,8,8,4,'#f4f1ea'); P.rect(x+1,7,6,2,['#c4382e','#e8a85a','#5fae46','#8a5a36','#f2c43d','#d98a3a'][k]); } A.drawText(g,'COM NGON',17,20,'#f4e6c4'); });
const altar=()=>S(22,20,11,19,(g,P)=>{ P.rect(1,10,20,6,'#a8322a'); P.rect(1,10,20,2,'#c4382e'); P.rect(2,16,18,2,'#6e472c'); P.rect(5,4,5,6,'#f2c43d'); P.disc(7,3,2,'#f2c43d'); P.rect(12,4,5,6,'#f2c43d');
  P.rect(18,6,1,4,'#8a5d3b'); P.px(18,5,'#ff6a55'); P.rect(3,8,2,2,'#e04848'); });

/* ---------- xe đạp công cộng ---------- */
const BIKE_GREEN='#2f9a52';
function bicycle(fr=0){ const f=fr%2; return S(38,24,15,22,(g,P)=>{ ring(g,P,7,16,6,'#2a2a2f'); ring(g,P,30,16,6,'#2a2a2f');
  for(const cx of [7,30]){ P.px(cx,16,'#9aa0a8'); if(f){ seg(P,cx-3,16,cx+3,16,'#9aa0a8'); seg(P,cx,13,cx,19,'#9aa0a8'); } else { seg(P,cx-2,14,cx+2,18,'#9aa0a8'); seg(P,cx-2,18,cx+2,14,'#9aa0a8'); } }
  for(const [a,b,c,d] of [[16,16,12,6],[12,7,25,7],[25,7,16,16],[16,16,7,16],[12,7,7,16],[25,6,30,16]]){ seg(P,a,b,c,d,BIKE_GREEN); seg(P,a,b+1,c,d+1,BIKE_GREEN); }
  P.rect(9,4,6,2,'#2a2a2f'); P.rect(12,6,1,1,'#2a2a2f');                                                          // yên
  P.rect(23,2,5,1,'#2a2a2f'); P.rect(25,3,1,3,'#5a5e68');                                                        // ghi đông
  P.rect(27,4,8,5,'#c8ccd2'); for(let x=28;x<35;x+=2) P.px(x,5,'#8a9098'); P.rect(27,8,8,1,'#8a9098');           // giỏ trước
  P.disc(16,16,2,'#5a5e68'); const pa=f?[[13,17],[19,15]]:[[16,19],[16,13]]; for(const [x,y] of pa) P.rect(x,y,3,1,'#2a2a2f');   // bàn đạp
  P.rect(3,12,6,1,BIKE_GREEN); P.rect(27,12,6,1,BIKE_GREEN); }); }
bicycle.seat={dx:-3,dy:-17}; bicycle.bar={dx:10,dy:-20}; bicycle.peg={dx:1,dy:-6};
const bikeRack=()=>S(64,34,32,32,(g,P)=>{ P.rect(2,26,60,4,'#9aa0a8'); P.rect(2,26,60,1,'#c8ccd2'); P.rect(2,2,60,7,BIKE_GREEN); A.drawText(g,'XE DAP CONG CONG',6,3,'#f4f1ea'); P.rect(3,9,2,17,'#5a5e68'); P.rect(59,9,2,17,'#5a5e68');
  for(let k=0;k<3;k++){ const x=8+k*18; ring(g,P,x+3,22,4,'#2a2a2f'); ring(g,P,x+14,22,4,'#2a2a2f'); seg(P,x+3,22,x+8,15,BIKE_GREEN); seg(P,x+8,15,x+13,15,BIKE_GREEN); seg(P,x+13,15,x+14,22,BIKE_GREEN); seg(P,x+8,15,x+9,22,BIKE_GREEN);
    P.rect(x+6,13,4,1,'#2a2a2f'); P.rect(x+12,12,4,1,'#2a2a2f'); P.rect(x+14,13,4,3,'#c8ccd2'); } });

/* ---------- xe máy / xe đạp nhìn trước (đi xuống) và sau (đi lên) ---------- */
function rideView(model='wave',back=false,fr=0){ const bc=model==='xedap', M=bc?{body:BIKE_GREEN,dark:'#2a2a2f'}:(A.BIKE_MODELS[model]||A.BIKE_MODELS.wave), f=fr%2;
  return S(26,30,13,28,(g,P)=>{
    const ww=bc?2:6, wx=13-ww/2; P.rect(wx,17,ww,12,'#2a2a2f'); if(!bc){ P.rect(wx+1,18,ww-2,10,'#3a3a44'); P.rect(wx+1,f?20:24,ww-2,1,'#5a5a66'); } else P.px(wx,f?20:25,'#5a5a66');   // bánh xe
    if(bc){ P.rect(12,7,2,11,M.body); P.rect(2,4,22,1,'#2a2a2f'); P.rect(1,4,2,2,'#2a2a2f'); P.rect(23,4,2,2,'#2a2a2f');
      if(!back){ P.rect(8,6,10,6,'#c8ccd2'); for(let x=9;x<17;x+=2) P.px(x,8,'#8a9098'); P.rect(12,12,2,1,'#ffd86b'); } else { P.rect(10,6,6,2,'#2a2a2f'); P.rect(12,14,2,2,'#e04a3a'); } return; }
    if(!back){ P.rect(9,15,8,3,M.body); P.rect(9,15,8,1,'rgba(255,255,255,.35)'); P.rect(8,9,1,8,'#c8ccd2'); P.rect(17,9,1,8,'#c8ccd2');
      P.rect(7,4,12,8,M.shield||M.body); P.rect(8,4,10,1,'rgba(255,255,255,.4)'); P.disc(13,7,2,'#ffd86b'); P.px(12,6,'#ffffff');       // đầu xe + đèn pha
      if(M.basket){ P.rect(8,0,10,4,'#2a2a2f'); for(let x=9;x<17;x+=2) P.px(x,1,'#5a5a66'); } }
    else { P.rect(8,9,10,9,M.body); P.rect(8,9,10,1,'rgba(255,255,255,.35)'); P.rect(9,11,8,2,'#e04a3a'); P.rect(10,11,6,1,'#ff8a7a');   // đuôi + đèn hậu
      P.rect(9,14,8,4,'#f4f1ea'); P.rect(10,15,6,1,'#3a3a48'); P.rect(10,17,4,1,'#3a3a48'); P.rect(7,6,12,4,M.dark); P.rect(18,16,4,7,'#c8ccd2'); P.rect(18,16,4,1,'#e8ecef'); }   // biển số, yên, ống xả
    P.rect(1,3,24,2,M.dark); P.rect(0,3,2,3,'#2a2a2f'); P.rect(24,3,2,3,'#2a2a2f');                            // tay lái
    P.rect(3,0,1,3,'#9aa0a8'); P.rect(22,0,1,3,'#9aa0a8'); P.rect(2,0,3,1,back?'#5a5e68':'#c8ccd2'); P.rect(21,0,3,1,back?'#5a5e68':'#c8ccd2');   // gương
    P.rect(6,10,2,2,'#f2a03a'); P.rect(18,10,2,2,'#f2a03a'); }); }
rideView.seatY=-15; rideView.barY=-24;

Object.assign(A,{gondola,drinkFridge,checkout,produceBin,basketStack,trolley,pcStation,gamingChair,poster,netCounter,cafeBar,menuBoard,cafeTable,pendant,stool,eatTable,ricePot,foodCase,altar,bicycle,bikeRack,rideView,BIKE_GREEN});
})();

/* ---------- trang trí thị trấn, làng, rừng ---------- */
(function(){
const A=ART, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const seg=(P,x0,y0,x1,y1,c)=>{ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1); for(let i=0;i<=n;i++) P.px(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),c); };
const ring=(g,P,x,y,r,c)=>{ P.disc(x,y,r,c); for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(dx*dx+dy*dy<(r-1.4)**2) g.clearRect(x+dx,y+dy,1,1); };
const mailbox=(c='#c4382e')=>S(10,18,5,17,(g,P)=>{ P.rect(4,8,2,9,'#6e472c'); P.rect(1,2,8,7,c); P.rect(1,2,8,2,'rgba(255,255,255,.3)'); P.rect(8,3,2,3,'#f2c43d'); });
const doghouse=(c='#3f78c4')=>S(26,24,13,22,(g,P)=>{ P.rect(3,10,20,12,'#e8dcc0'); for(let y=12;y<22;y+=3) P.rect(3,y,20,1,'#cfc2a2'); P.rect(9,13,8,9,'#2a1e18'); for(let k=0;k<8;k++) P.rect(1+Math.floor(k*1.5),9-k,24-Math.floor(k*3),1,c); });
const clothesline=()=>S(48,26,24,24,(g,P)=>{ P.rect(2,4,2,20,'#6e472c'); P.rect(44,4,2,20,'#6e472c'); P.rect(3,5,42,1,'#e8e8e0');
  [['#c4382e',7],['#4d6f99',15],['#f2c43d',24],['#f4f1ea',32],['#3f8a3a',39]].forEach(([c,x])=>{ P.rect(x,6,6,8,c); P.rect(x+1,14,4,2,c); }); });
const haystack=()=>S(28,24,14,22,(g,P)=>{ P.disc(14,12,10,'#d9b04a'); P.rect(4,12,20,10,'#d9b04a'); for(let k=0;k<14;k++) P.px(5+hash(k,1,80)*18,5+hash(k,2,80)*15,'#b88a2a'); P.rect(13,0,2,4,'#6e472c'); P.rect(4,20,20,2,'#b88a2a'); });
const goalPost=()=>S(36,26,18,24,(g,P)=>{ P.rect(2,2,32,2,'#f4f4f1'); P.rect(2,2,2,22,'#f4f4f1'); P.rect(32,2,2,22,'#f4f4f1'); for(let x=5;x<32;x+=3) P.rect(x,4,1,18,'rgba(255,255,255,.4)'); for(let y=7;y<23;y+=3) P.rect(4,y,28,1,'rgba(255,255,255,.4)'); });
const waterWheel=()=>S(42,46,21,44,(g,P)=>{ ring(g,P,21,20,18,'#6e472c'); ring(g,P,21,20,12,'#8a5d3b'); for(let k=0;k<8;k++){ const a=k*Math.PI/4, ex=21+Math.round(Math.cos(a)*18), ey=20+Math.round(Math.sin(a)*18); seg(P,21,20,ex,ey,'#8a5d3b'); P.rect(ex-2,ey-2,4,4,'#c9a35e'); }
  P.disc(21,20,3,'#3a2414'); P.rect(19,22,4,22,'#5a3a22'); P.rect(9,40,24,4,'#5a3a22'); });
const fountain=()=>S(50,38,25,34,(g,P)=>{ P.disc(25,24,21,'#8d887f'); P.disc(25,23,19,'#bdb8ad'); P.disc(25,23,16,'#3b8ed3'); P.disc(25,22,13,'#5aa9e6'); P.rect(23,6,4,17,'#c8ccd2'); P.disc(25,8,5,'#c8ccd2'); P.disc(25,7,3,'#8fd3ea');
  for(const [x,y] of [[18,13],[32,13],[16,18],[34,18],[25,1],[21,3],[29,3]]) P.px(x,y,'#e8f8ff'); });
const well=()=>S(24,30,12,28,(g,P)=>{ P.rect(3,16,18,11,'#9b968c'); P.rect(3,16,18,2,'#bdb8ad'); for(let x=3;x<21;x+=5) P.rect(x,20,4,2,'#86817a'); P.rect(5,17,14,2,'#2a4a6a');
  P.rect(3,3,2,14,'#6e472c'); P.rect(19,3,2,14,'#6e472c'); P.rect(1,1,22,3,'#a8322a'); P.rect(11,4,2,7,'#c8ccd2'); P.rect(9,10,6,3,'#8a5d3b'); });
const buffalo=()=>S(42,26,21,24,(g,P)=>{ const c='#4a4648', d='#2e2a2c'; P.rect(8,7,24,11,c); P.rect(8,7,24,2,'#5e5a5c'); P.rect(30,6,8,8,c); P.rect(36,10,3,4,'#6a6466'); P.px(33,8,'#ffffff');
  P.rect(28,3,4,2,'#d8d0c0'); P.rect(34,3,4,2,'#d8d0c0'); P.rect(27,2,2,2,'#d8d0c0'); P.rect(37,2,2,2,'#d8d0c0');
  for(const [x,k] of [[10,0],[14,1],[25,0],[29,1]]) P.rect(x,18,3,6-k,k?d:c); P.rect(5,9,3,1,d); P.rect(4,10,1,6,d); });
const lookout=()=>S(40,72,20,70,(g,P)=>{ for(const x of [6,31]) P.rect(x,24,3,46,'#6e472c'); seg(P,8,30,31,66,'#5a3a22'); seg(P,31,30,8,66,'#5a3a22'); P.rect(4,20,32,6,'#8a5d3b');
  P.rect(4,10,2,10,'#6e472c'); P.rect(34,10,2,10,'#6e472c'); P.rect(2,4,36,7,'#a8322a'); P.rect(6,0,28,4,'#8c231f'); P.rect(6,12,28,1,'#6e472c'); });
const waterfall=(w=48)=>S(w,58,w/2,56,(g,P)=>{ for(let y=0;y<46;y+=6) for(let x=0;x<w;x+=8) P.rect(x+(y/6%2)*4,y,8,6,['#7a756c','#8d887f','#6a655c'][(x+y)%3]);
  P.rect(w/2-10,0,20,48,'#8fd3ea'); for(let k=0;k<16;k++) P.rect(w/2-9+Math.floor(hash(k,3,81)*18),Math.floor(hash(k,4,81)*44),1,4,'#ffffff'); P.rect(w/2-14,46,28,10,'#e8f8ff'); P.rect(w/2-12,48,24,6,'#bfe6f2'); });
const noticeBoard=(t='BANG TIN')=>S(44,30,22,28,(g,P)=>{ P.rect(5,14,2,14,'#6e472c'); P.rect(37,14,2,14,'#6e472c'); P.rect(1,1,42,16,'#8a5d3b'); P.rect(3,4,38,11,'#f4e6c4');
  A.drawText(g,t,22-Math.floor(A.textW(t)/2),5,'#8c231f'); P.rect(6,12,12,1,'#9a8a6a'); P.rect(22,12,16,1,'#9a8a6a'); });
const flowerBed=(cols=['#ff6a55','#ffe066','#f4f1ea','#a882ff'])=>S(34,12,17,11,(g,P)=>{ P.rect(1,5,32,6,'#6e472c'); P.rect(1,5,32,1,'#8a5d3b'); for(let k=0;k<10;k++){ P.rect(2+k*3,3,1,3,'#3f8a3a'); P.disc(2+k*3,3,1,cols[k%cols.length]); } });
const monument=()=>S(34,54,17,52,(g,P)=>{ P.rect(2,42,30,10,'#8d887f'); P.rect(2,42,30,2,'#bdb8ad'); P.rect(6,36,22,7,'#9b968c'); P.rect(11,4,12,33,'#bdb8ad'); P.rect(11,4,3,33,'#d8d4cc'); P.rect(10,2,14,3,'#8d887f');
  P.disc(17,14,3,'#f2c43d'); P.px(17,10,'#f2c43d'); P.rect(13,24,8,1,'#8d887f'); P.rect(13,27,8,1,'#8d887f'); });
const basketHoop=()=>S(22,46,11,44,(g,P)=>{ P.rect(10,10,2,34,'#5a5e68'); P.rect(2,2,18,12,'#f4f4f1'); P.rect(7,6,8,5,'#c4382e'); P.rect(8,7,6,3,'#f4f4f1'); P.rect(6,14,10,1,'#e8742a'); for(let x=7;x<16;x+=2) P.rect(x,15,1,4,'#e8e8e0'); P.rect(6,42,10,2,'#5a5e68'); });
const busShelter=()=>S(64,40,32,38,(g,P)=>{ P.rect(2,4,60,5,'#2f7a46'); A.drawText(g,'BEN XE DA BAC',8,5,'#f4f1ea'); P.rect(4,9,2,29,'#5a5e68'); P.rect(58,9,2,29,'#5a5e68'); P.rect(6,10,52,16,'rgba(170,215,235,.55)'); P.rect(10,28,44,4,'#a7744c'); P.rect(12,32,2,6,'#6e472c'); P.rect(50,32,2,6,'#6e472c'); });
const coach=()=>S(84,40,42,38,(g,P)=>{ P.rect(2,6,80,26,'#f2c43d'); P.rect(2,6,80,3,'#f8e49a'); for(let x=8;x<70;x+=12) P.rect(x,11,10,9,'#3a5a7a'); P.rect(72,11,8,12,'#3a5a7a'); P.rect(2,22,80,3,'#c4382e'); P.rect(66,20,6,12,'#2a2a2f');
  P.disc(16,33,5,'#2a2a2f'); P.disc(16,33,2,'#9aa0a8'); P.disc(66,33,5,'#2a2a2f'); P.disc(66,33,2,'#9aa0a8'); P.rect(80,24,3,3,'#ffd86b'); });
const tableTennis=()=>S(40,24,20,22,(g,P)=>{ P.rect(1,4,38,12,'#2f6fb0'); P.rect(1,4,38,1,'#5a8ad0'); P.rect(19,2,2,14,'#f4f4f1'); P.rect(1,9,38,1,'#ffffff'); for(const x of [3,35]) P.rect(x,16,2,7,'#3a3a48'); });
Object.assign(A,{mailbox,doghouse,clothesline,haystack,goalPost,waterWheel,fountain,well,buffalo,lookout,waterfall,noticeBoard,flowerBed,monument,basketHoop,busShelter,coach,tableTennis});
})();

/* ---------- cảnh sát giao thông: xe thùng (chở được xe máy), cọc tiêu ---------- */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
function policeTruck(cargo='',light=0,dmg=0){ return S(80,50,40,48,(g,P)=>{ const W=dmg>=5?'#8a8a86':'#f4f4f1';
  P.rect(2,22,46,18,W); P.rect(2,22,46,2,'#ffffff'); P.rect(2,28,46,7,'#2a4ad0'); A.drawText(g,'CSGT',14,29,'#ffffff');           // thùng xe + băng xanh
  for(let x=4;x<46;x+=8) P.rect(x,12,2,10,'#d8d8d0'); P.rect(2,12,46,2,'#d8d8d0');                                                 // khung lan can thùng
  if(cargo){ const b=A.motorbike(0,cargo,''); g.drawImage(b.c,8,2); }
  for(const x of [36,42]){ P.rect(x,15,4,7,'#e8742a'); P.rect(x+1,13,2,2,'#e8742a'); P.rect(x,18,4,1,'#ffffff'); }                 // cọc tiêu trong thùng
  P.rect(48,12,28,28,W); P.rect(48,12,28,2,'#ffffff'); P.rect(54,15,16,10,'#9fd3e6'); P.rect(55,16,6,3,'#d8f2fb'); P.rect(52,26,1,12,'#c8ccd2'); P.rect(48,30,28,3,'#2a4ad0');   // cabin
  P.rect(52,8,20,4,'#3a3a48'); P.rect(53,8,9,3,light?'#ff3a3a':'#8a2020'); P.rect(62,8,9,3,light?'#3a6aff':'#20308a');                  // đèn ưu tiên
  P.rect(74,34,4,3,'#ffd86b'); P.rect(0,36,4,3,'#e04a3a'); P.rect(2,40,74,3,'#2a2a2f');
  for(const cx of [16,62]){ P.disc(cx,42,6,'#2a2a2f'); P.disc(cx,42,3,'#9aa0a8'); P.px(cx,42,'#2a2a2f'); }
  for(let k=0;k<Math.min(dmg,5);k++){ const x=[10,30,52,64,22][k], y=[24,34,20,30,16][k]; P.rect(x,y,7,4,'#6a6a70'); P.rect(x+1,y+1,5,2,'#4a4a50'); P.px(x+6,y-1,'#2a2a2f'); }   // vết móp
  if(dmg>=3){ for(let k=0;k<6;k++) P.px(56+k*2,16+(k%3)*2,'#ffffff'); P.rect(55,19,14,1,'#2a2a2f'); }                                                         // kính nứt
  if(dmg>=5){ g.fillStyle='rgba(20,16,14,.45)'; g.fillRect(0,0,80,50); P.rect(52,8,20,4,'#2a2a2f'); } }); }
const cone=()=>S(10,14,5,13,(g,P)=>{ P.rect(3,3,4,8,'#e8742a'); P.rect(4,1,2,2,'#e8742a'); P.rect(3,6,4,2,'#ffffff'); P.rect(1,11,8,2,'#2a2a2f'); });
const streetSign=t=>{ const w=A.textW(t)+10; return S(w,30,w/2|0,29,(g,P)=>{ P.rect((w>>1)-1,10,2,19,'#5a5e68'); P.rect(1,1,w-2,10,'#1f5fb0'); P.rect(2,2,w-4,8,'#2a6fd0'); P.rect(2,2,w-4,1,'#ffffff'); A.drawText(g,t,5,4,'#ffffff'); }); };
Object.assign(A,{policeTruck,cone,streetSign});
})();

/* ---------- Optimus Prime: robot (trước / sau / ngang, 2 nhịp bước) và dạng xe đầu kéo ---------- */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const RD='#d9263a', RD2='#a8182a', BL='#2a4ad0', BL2='#1a2e8a', GR='#b8bcc4', GR2='#8a9098', YL='#f2c43d', GL='#8fe0ff';
function optimus(view='down',fr=0){ const f=fr%2;
  if(view==='punch') return S(46,58,17,57,(g,P)=>{ const b=optimus('side',0); g.drawImage(b.c,0,0); P.rect(14,16,22,6,RD); P.rect(14,16,22,2,'#ff5a6a'); P.rect(34,14,9,10,BL); P.rect(36,15,5,2,'#4a6af0'); for(const [x,y] of [[44,12],[45,18],[44,24]]) P.px(x,y,YL); },false);
  if(view==='side') return S(34,58,17,57,(g,P)=>{ const st=f?3:-3;
    P.rect(13-st,38,6,17,BL2); P.rect(12-st,54,9,3,BL2);                                                  // chân sau
    P.rect(7,4,2,14,GR); P.rect(7,3,2,1,'#e8ecef');                                                     // ống khói sau lưng
    P.rect(10,13,15,12,RD); P.rect(17,15,7,6,GL); P.rect(18,16,2,4,'#ffffff'); P.rect(21,15,1,6,'#1c1516');   // ngực + cửa kính
    P.rect(11,25,12,6,GR); for(let y=26;y<31;y+=2) P.rect(12,y,10,1,GR2); P.rect(11,31,12,5,GR); P.rect(20,32,3,2,YL);
    P.rect(12,3,10,10,BL); P.rect(18,6,5,7,GR); P.px(20,8,'#5af0ff'); P.px(21,8,'#5af0ff'); P.rect(12,1,2,4,BL); P.rect(16,0,2,3,BL);   // đầu + mặt bạc + mắt
    P.rect(14+st,38,6,17,BL); P.rect(15+st,42,4,4,GR); P.rect(13+st,54,10,3,BL);                         // chân trước
    P.rect(8,12,7,6,RD2); P.rect(10,18,5,15,RD); P.rect(10,26,5,2,YL); P.rect(10,33,5,5,BL); });          // vai + tay
  const back=view==='up';
  return S(42,58,21,57,(g,P)=>{ const lu=f?1:0, ru=f?0:1;
    P.rect(10,37-lu,9,18,BL); P.rect(23,37-ru,9,18,BL); P.rect(12,43-lu,5,4,GR); P.rect(25,43-ru,5,4,GR); P.rect(9,54-lu,11,3,BL2); P.rect(22,54-ru,11,3,BL2);   // 2 chân
    P.rect(12,31,18,6,GR); P.rect(14,32,3,2,YL); P.rect(25,32,3,2,YL);                                   // hông + đèn vàng
    P.rect(14,25,14,6,GR); for(let y=26;y<31;y+=2) P.rect(15,y,12,1,GR2);                                 // bụng
    P.rect(7,12,28,13,RD); P.rect(19,12,4,13,RD2);                                                      // ngực
    if(!back){ for(const x of [9,24]){ P.rect(x,14,9,8,GL); for(let k=0;k<5;k++) P.px(x+2+k,20-k,'#1c1516'); P.px(x+1,15,'#ffffff'); } }
    else { P.rect(9,14,24,8,RD2); P.rect(5,2,2,14,GR); P.rect(35,2,2,14,GR); P.rect(5,1,2,1,'#e8ecef'); P.rect(35,1,2,1,'#e8ecef'); }   // lưng + 2 ống khói
    P.rect(2,8,8,8,RD); P.rect(32,8,8,8,RD); if(!back){ P.rect(4,10,4,4,'#f4f4f1'); P.rect(34,10,4,4,'#f4f4f1'); }   // vai
    P.rect(2,16,6,18,RD); P.rect(34,16,6,18,RD); P.rect(2,26,6,2,YL); P.rect(34,26,6,2,YL); P.rect(2,34,6,6,BL); P.rect(34,34,6,6,BL);   // tay
    P.rect(15,2,12,10,BL); P.rect(14,0,2,5,BL); P.rect(26,0,2,5,BL); P.rect(20,0,2,3,BL);               // mũ + ăng ten
    if(!back){ P.rect(17,5,8,7,GR); P.rect(18,6,2,1,'#5af0ff'); P.rect(22,6,2,1,'#5af0ff'); P.rect(18,9,6,2,GR2); } }); }
function optimusTruck(view='side',fr=0){ const f=fr%2;
  if(view==='side') return S(104,52,52,50,(g,P)=>{
    P.rect(2,32,52,5,'#3a3a44'); P.rect(6,28,16,4,'#2a2a2f'); P.rect(102,30,2,5,'#e04a3a');                 // khung đuôi + mâm kéo
    P.rect(40,4,3,30,GR); P.rect(39,0,4,5,'#e8ecef');                                                    // ống xả crôm
    P.rect(44,8,24,28,BL); P.rect(44,8,24,2,'#4a6af0'); P.rect(50,12,12,9,GL); P.rect(51,13,4,3,'#d8f8ff');   // cabin
    P.rect(56,2,12,7,BL); P.rect(60,0,6,3,BL2);                                                         // mũi gió nóc
    P.rect(68,18,30,18,BL); P.rect(68,18,30,2,'#4a6af0'); P.rect(96,18,6,19,GR); for(let y=20;y<36;y+=3) P.rect(97,y,4,1,GR2);   // nắp capo + lưới tản nhiệt
    for(const [y,c] of [[24,RD],[27,'#f08a3a'],[30,YL]]) P.rect(44,y,54,2,c);                           // sọc đỏ cam vàng
    P.rect(100,24,3,3,'#ffd86b'); P.rect(48,36,20,6,GR); P.rect(48,36,20,1,'#e8ecef');                    // đèn + bình xăng crôm
    for(let x=46;x<98;x+=8) P.px(x,9,YL);                                                               // đèn dọc mui
    for(const cx of [16,30,84]){ P.disc(cx,43,7,'#1c1516'); P.disc(cx,43,4,GR); P.disc(cx,43,2,BL); P.px(cx+(f?2:-2),43,'#1c1516'); } });
  const back=view==='up';
  return S(46,56,23,54,(g,P)=>{
    P.rect(4,40,8,13,'#1c1516'); P.rect(34,40,8,13,'#1c1516'); P.rect(5,f?44:48,6,1,'#3a3a44'); P.rect(35,f?44:48,6,1,'#3a3a44');   // bánh
    P.rect(6,10,34,32,BL); P.rect(6,10,34,2,'#4a6af0');
    if(!back){ P.rect(9,14,28,10,GL); P.rect(10,15,8,3,'#d8f8ff'); P.rect(14,28,18,12,GR); for(let y=29;y<40;y+=2) P.rect(15,y,16,1,GR2); P.rect(7,32,5,4,'#ffd86b'); P.rect(34,32,5,4,'#ffd86b');
      for(const [y,c] of [[26,RD],[27,'#f08a3a']]) P.rect(6,y,34,1,c); P.rect(4,42,38,3,GR); }
    else { P.rect(10,14,26,8,BL2); for(const [y,c] of [[24,RD],[26,'#f08a3a'],[28,YL]]) P.rect(6,y,34,2,c); P.rect(14,34,18,5,'#3a3a44'); P.rect(7,36,4,3,'#e04a3a'); P.rect(35,36,4,3,'#e04a3a'); }
    P.rect(1,2,3,28,GR); P.rect(42,2,3,28,GR); P.rect(0,0,5,3,'#e8ecef'); P.rect(41,0,5,3,'#e8ecef');      // 2 ống xả
    P.rect(12,4,22,7,BL); for(let x=12;x<34;x+=5) P.px(x,6,YL); }); }
Object.assign(A,{optimus,optimusTruck});
})();

/* ---------- vẽ lại hươu sao (theo ảnh mẫu, nhìn chéo) và khỉ vàng (thân cam, tay chân xám dài, đuôi cuộn) ---------- */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), rows=A.gridRows;
const DEER_PAL={K:'#8b1a10',R:'#c4201a',O:'#e87008',L:'#f99a1a',C:'#ffe4d8',D:'#cc5511',E:'#1c1516'};
const DEER=['10K 12K 15K 17K','9-10K 12K 15K 17-18K','10-12K 15-17K','11-12K 15-16K','8-9R 12K 15K 18-19R','8-9O 10R 12K 15K 17R 18-19O','8O 9L 10O 11-16R 17O 18L 19O','9O 10L 11O 12-15L 16O 17L 18O',
  '10O 11-12L 13-14C 15-16L 17O','2O 10O 11E 12L 13-14C 15L 16E 17O','2-3O 10O 11E 12L 13-14C 15L 16E 17O','2-3O 10O 11-16L 17O','2O 3L 4-6D 11O 12L 13-14R 15L 16O','2L 3D 4-6O 7-8D 11D 12-14O 15D',
  '2D 3-4O 5C 6-8O 9-10D 11O 12-14L 15D','2D 3-7O 8C 9-11O 12L 13-14C 15L 16D','2D 3C 4-10O 11L 12-15C 16D','1D 2-5O 6-8L 9-10O 11L 12-15C 16D','1D 2-4O 5L 6-8C 9L 10O 11L 12-15C 16D','1D 2-3O 4L 5-7C 8L 9-11O 12L 13-14C 15L 16D',
  '0D 1-2O 3-10D 11-12O 13-14L 15D','0D 1O 2D 4-5R 9-15D 16R','0-1D 4-5R 10-12D 15-17R','0-1D 4-6R 11-13D 16-18R','0-1D 5-7R 12-14D 17-19R','0-1D 6-8R 13-15D 18-20R','0-1D 7R 8-9K 14-16D 19R 20-21K','0D 1-2K 8-9K 15D 16-17K 20-21K','1-2K 16-17K'];
// bước đi: khung lẻ thì cặp chân đỏ (chân gần) bước lên 1px, cặp chân cam sẫm (chân xa) lùi 1px; móng đi theo chân của nó
const legShift=(c,x)=>c==='R'||(c==='K'&&(x>=8&&x<=9||x>=20))?1:c==='D'||(c==='K'&&(x<=2||x>=15&&x<=17))?-1:0;
const DEER2=DEER.map((r,y)=>y<21?r:r.split(' ').map(tk=>{ const m=/^(\d+)(?:-(\d+))?(.)$/.exec(tk); if(!m) return tk; const d=legShift(m[3],+m[1]), a=Math.max(0,+m[1]+d), b=m[2]?Math.max(a,+m[2]+d):null; return (b!=null?a+'-'+b:a)+m[3]; }).join(' '));
const deer=fr=>S(24,29,11,28,(g,P)=>rows(P,fr%2?DEER2:DEER,DEER_PAL,0,0),false);   // không viền đen: gạc mảnh không bị bết lại như ảnh mẫu
function monkey(fr=0){ const f=fr%4, sw=[0,1,0,-1][f], O='#c8701a', O2='#a85a14', HL='#e0882a', Gy='#6a6a70', Gd='#4a4a50', Wh='#f4f1ea';
  return S(32,25,16,24,(g,P)=>{
    P.rect(6,5,2,5,O); P.rect(5,2,2,4,O); P.rect(6,0,4,2,O); P.rect(10,1,2,2,Gy); P.rect(9,3,2,1,Gy);                     // đuôi cuộn, chóp xám
    P.rect(7,14,2,8-Math.max(0,sw),Gd); P.rect(6-sw,22,3,1,Gd); P.rect(17,13,2,8+Math.min(0,sw),Gd); P.rect(16+sw,21,3,1,Gd);   // chân, tay phía xa
    P.rect(6,9,3,4,O); P.rect(7,8,15,6,O); P.rect(8,8,13,1,HL); P.rect(9,13,11,1,O2);                                    // thân
    P.rect(9,13,3,3,O); P.rect(10-sw,16,2,6,Gy); P.rect(9-sw,22,3,1,Gd);                                                  // chân gần
    P.rect(20,7,2,5,O); P.rect(19,12,2,4,O); P.rect(19,16,3,1,Wh); P.rect(20+sw,17,2,5,Gy); P.rect(20+sw,22,3,1,Gd);        // tay gần: cổ tay trắng, cẳng tay xám
    P.rect(21,3,7,3,O); P.rect(20,5,1,2,O); P.rect(28,5,1,2,O); P.rect(21,5,1,4,O);                                       // mũ lông cam + tai
    P.rect(22,5,6,6,Wh); P.rect(22,6,6,2,Gy); P.rect(23,6,2,2,'#1c1516'); P.rect(26,6,2,2,'#1c1516'); P.px(23,6,'#ffffff'); P.px(26,6,'#ffffff');   // mặt trắng, mặt nạ xám, mắt
    P.rect(24,8,3,2,Gy); P.rect(24,10,3,1,Gd); }); }
// voi: đầu to nhìn chéo, tai hồng nâu, ngà trắng, vòi buông, thân + đuôi phía sau
function elephant(fr=0){ const f=fr%2, G='#8a9aa0', G2='#a8b8bc', G3='#6a7a80', PK='#b88a7a', W='#f4f4f1';
  return S(38,30,19,29,(g,P)=>{
    P.rect(32,10,2,8,G3); P.rect(32,18,2,2,'#3a3a40');                                                                // đuôi
    P.rect(20,21+f,4,7-f,G3); P.rect(15,20+(1-f),4,8-(1-f),G3);                                                       // chân phía xa
    P.rect(14,9,18,13,G); P.rect(16,9,14,2,G2); P.rect(14,20,18,2,G3); for(const [x,y] of [[20,13],[26,15],[23,17]]) P.px(x,y,G3);   // thân
    P.rect(26,20,5,8-f,G); P.rect(9,19,5,9-(1-f),G); for(const x of [9,11,13,26,28,30]) P.px(x,x<20?27-(1-f):27-f,W);   // chân gần + móng
    P.rect(1,3,6,12,G); P.rect(2,5,4,8,PK); P.rect(19,3,7,12,G); P.rect(20,5,5,8,PK);                                    // 2 tai
    P.rect(7,2,12,14,G); P.rect(6,4,1,10,G); P.rect(19,4,1,10,G); P.rect(8,3,10,2,G2); P.rect(9,9,1,2,'#1c1516'); P.rect(16,9,1,2,'#1c1516');   // đầu + mắt
    P.rect(11,13,4,4,G); P.rect(12,17,3,6,G); P.rect(11,23,2,2,G); for(const y of [14,16,18,20]) P.rect(12,y,3,1,G3);   // vòi
    P.rect(7,16,4,1,W); P.rect(6,17,2,1,W); P.rect(15,16,4,1,W); P.rect(18,17,2,1,W); }); }                             // ngà
// lợn rừng: thân tròn nâu có sọc sáng sau lưng, mõm hồng, nanh ngà to, bờm đen
function boar(fr=0){ const f=fr%2, B='#8a6a48', B2='#6e5236', BL='#c0a880', PK='#d49088', TK='#efe4b0', DK='#2a1a12';
  return S(36,27,17,26,(g,P)=>{
    P.rect(2,9,2,4,DK); P.px(1,8,DK);                                                                                  // đuôi
    P.rect(7+f,22,3,4-f,B2); P.rect(19+f,22,3,4-f,B2);                                                                  // chân xa
    P.rect(6,6,20,16,B); P.rect(4,9,2,11,B); P.rect(26,8,3,12,B); P.rect(7,5,15,1,B); P.rect(9,4,12,1,'#4a3020');        // thân + bờm
    for(const [x,y,w] of [[7,9,9],[6,12,11],[8,15,8],[10,18,5]]) P.rect(x,y,w,1,BL);                                    // sọc lông
    P.rect(5,19,22,3,B2); P.rect(19,3,3,4,B); P.px(20,4,PK); P.rect(24,3,3,4,B); P.px(25,4,PK);                          // bụng, 2 tai
    P.rect(21,10,1,2,DK); P.rect(24,10,1,2,DK);                                                                         // mắt
    P.rect(26,13,7,5,PK); P.rect(26,13,7,1,'#e8a8a0'); P.rect(28,15,1,2,DK); P.rect(30,15,1,2,DK);                       // mõm
    P.rect(21,17,4,2,TK); P.px(20,18,TK); P.rect(32,18,3,1,TK); P.px(34,17,TK);                                         // nanh
    P.rect(11-f,22,3,4-(1-f),B); P.rect(23-f,22,3,4-(1-f),B); for(const x of [11,23]) P.rect(x-f,25,3,1,DK); }); }    // chân gần + móng
// hổ Đông Dương: thân cam vằn đen, bụng + mặt trắng, đuôi khoanh đen
function tiger(fr=0){ const f=fr%2, O='#f4a820', O2='#d88a10', W='#f4f1ea', K='#1c1516';
  return S(46,26,22,25,(g,P)=>{
    P.rect(4,7,4,2,O); P.rect(2,9,2,5,O); P.rect(5,7,1,2,K); P.rect(2,11,2,1,K); P.rect(2,13,2,1,K);                      // đuôi
    P.rect(12+f,17,3,7-f,O2); P.rect(27+f,17,3,7-f,O2); P.rect(12+f,23-f,3,1,W); P.rect(27+f,23-f,3,1,W);                 // chân xa
    P.rect(8,6,26,11,O); P.rect(9,5,22,1,O); P.rect(10,15,22,3,W); P.rect(8,14,3,3,W);                                      // thân + bụng
    for(let x=10;x<33;x+=3){ P.rect(x,5,1,4+(x%2),K); P.rect(x+1,10,1,3,K); }                                               // vằn
    P.rect(32,3,9,10,O); P.rect(33,2,2,2,O); P.rect(38,2,2,2,O); P.px(34,3,K); P.px(39,3,K);                               // đầu + tai
    P.rect(35,8,6,5,W); P.rect(41,7,2,3,O); P.px(42,7,'#e88a70'); P.px(37,6,'#7de07a'); P.px(38,6,K); P.rect(34,4,1,2,K); P.rect(36,4,2,1,K); P.rect(33,8,2,1,K);   // mặt trắng, mũi, mắt xanh, vằn đầu
    P.rect(15-f,17,3,7-(1-f),O); P.rect(30-f,17,3,7-(1-f),O); P.rect(15-f,23,4,2,W); P.rect(30-f,23,4,2,W); }); }       // chân gần, bàn chân trắng
// công: xoè đuôi hình quạt xanh có mắt cam-xanh, thân + cổ xanh dương, mào, chân cam
function peacock(fr=0){ return S(38,34,19,33,(g,P)=>{
  for(let y=0;y<26;y++){ const hw=Math.round(Math.sqrt(Math.max(0,1-((y-15)/15)**2))*18); if(hw<=0) continue; P.rect(19-hw,y,hw*2,1,'#1a8a4a'); if(hw>1) P.rect(20-hw,y,hw*2-2,1,'#2aaa5a'); }
  for(let k=0;k<26;k++){ const a=Math.PI*(.08+.84*(k%13)/12), r=k<13?14:9; P.px(19-Math.round(Math.cos(a)*r),15-Math.round(Math.sin(a)*r)+2,'#6acc5a'); }
  for(const [x,y] of [[19,3],[11,5],[27,5],[5,10],[33,10],[3,17],[35,17],[6,23],[32,23],[13,12],[25,12]]){ P.disc(x,y,2,'#f4a820'); P.rect(x-1,y-1,2,2,'#3a6ad0'); P.px(x,y,'#1a2a5a'); }   // mắt lông đuôi
  P.rect(14,19,9,9,'#2a4ad0'); P.rect(15,20,6,5,'#4a7ae0'); P.rect(16,10,3,10,'#2a3a9a'); P.rect(15,7,4,4,'#2a4ad0'); P.px(16,8,'#ffffff'); P.px(14,9,'#e8a040');   // thân, cổ, đầu, mắt, mỏ
  P.px(15,5,'#2a4ad0'); P.px(17,4,'#2a4ad0'); P.px(19,5,'#2a4ad0'); P.px(15,4,'#4a7ae0'); P.px(17,3,'#4a7ae0'); P.px(19,4,'#4a7ae0');                         // mào
  P.rect(16,28,1,4,'#e8a040'); P.rect(20,28,1,4,'#e8a040'); P.rect(15,32,3,1,'#c8802a'); P.rect(19,32,3,1,'#c8802a'); }); }
// gấu ngựa: thân đen bóng, lưng gù, mõm vàng nâu, vệt trắng hình chữ V trước ngực
function bear(fr=0){ const f=fr%2, K='#1c1a1e', D='#2e2c32', G='#4a4850', TN='#d8b090';
  return S(38,24,18,23,(g,P)=>{
    P.rect(7+f,16,4,6,K); P.rect(21+f,16,4,6,K);                                                                        // chân xa
    P.rect(4,7,24,10,D); P.rect(6,5,15,2,D); P.rect(9,4,8,1,D); P.rect(3,9,1,6,D); for(const [x,y] of [[8,7],[12,6],[16,8],[20,7],[10,11],[18,12],[24,9]]) P.rect(x,y,2,1,G);   // thân + lưng gù
    P.rect(24,5,8,9,D); P.rect(25,3,3,2,D); P.rect(29,3,3,2,D); P.px(26,4,G); P.px(30,4,G); P.rect(31,8,4,4,TN); P.px(34,8,K); P.px(28,7,'#c8a040'); P.rect(24,13,4,1,'#e8e0d0');   // đầu, tai, mõm, mắt, ngực
    P.rect(11-f,16,4,6,D); P.rect(25-f,16,4,6,D); for(const x of [11,25]) P.rect(x-f,21,4,1,TN); }); }                 // chân gần + móng
// voọc: ngồi khom, lông đen, đùi xám, mặt kem đeo mặt nạ đen, mắt cam to, đuôi khoanh đen kem cuộn tròn
function vooc(fr=0){ const K='#1c1a1e', G='#9aa0a8', C='#e8dcc0', OR='#f2a020', BR='#6a2a10', sw=fr%2;
  return S(30,33,14,32,(g,P)=>{
    [[21,21],[22,18],[23,15],[23,12],[22,9],[20,6],[17,4],[14,4],[12,6],[12,9],[14,11]].forEach(([x,y],i)=>P.rect(x+(i>3?sw:0),y,3,3,i%2?C:K));   // đuôi khoanh
    P.rect(6,13,16,16,K); P.rect(8,11,12,2,K); P.rect(21,16,2,12,K);                                                     // thân khom
    P.rect(12,20,8,8,G); P.rect(13,20,6,1,'#b8bec6'); P.rect(9,28,10,2,G); P.rect(6,29,4,1,C);                            // đùi xám + bàn chân
    P.rect(4,17,3,12,K); P.rect(2,28,4,1,C);                                                                             // tay chống
    P.rect(2,3,12,10,C); P.px(1,3,C); P.px(14,3,C); P.px(1,4,K); P.px(14,4,K); P.rect(5,3,6,2,K);                         // đầu kem, tai, vạch đen trên đầu
    P.rect(3,6,10,4,BR); P.rect(4,7,3,2,OR); P.rect(9,7,3,2,OR); P.px(5,7,K); P.px(10,7,K); P.rect(7,10,2,1,K); P.rect(6,12,4,1,K); }); }   // mặt nạ, mắt cam, mũi
const oldWild=A.wild; A.wild=(k,fr=0)=>k==='huou'?deer(fr):k==='khi'?monkey(fr):k==='voi'?elephant(fr):k==='lonrung'?boar(fr):k==='ho'?tiger(fr):k==='cong'?peacock(fr):k==='gau'?bear(fr):k==='vooc'?vooc(fr):oldWild(k,fr);
})();

/* ---------- Megatron: robot bạc, mắt đỏ, pháo đen trên tay phải (đứng / đi / đấm / bắn), đạn pháo tím ---------- */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const SV='#b8bcc4', SV2='#8a9098', DK='#4a4a52', PU='#7a3ab0', RE='#ff3030', BK='#1c1c22';
function megatron(view='side',fr=0){ const f=fr%2;
  if(view==='side'||view==='punch'||view==='fire') return S(52,58,20,57,(g,P)=>{ const st=view==='side'?(f?3:-3):0;
    P.rect(15-st,38,6,17,SV2); P.rect(14-st,54,9,3,DK);                                                                 // chân sau
    P.rect(10,13,15,12,SV); P.rect(12,15,8,7,DK); for(let y=16;y<21;y+=2) P.rect(13,y,6,1,SV2); P.rect(20,14,4,4,PU);   // ngực + biểu tượng tím
    P.rect(11,25,12,7,DK); P.rect(11,31,12,5,SV2); P.rect(14,27,6,2,PU);                                                 // hông, đai tím
    P.rect(11,2,11,11,SV2); P.rect(13,0,7,3,SV); P.rect(16,0,1,3,DK); P.rect(18,5,5,7,SV); P.rect(19,7,3,1,RE); P.px(22,7,'#ff8080'); P.rect(19,10,3,1,DK);   // mũ xô + mặt bạc + mắt đỏ
    P.rect(16+st,38,6,17,SV); P.rect(17+st,42,4,4,DK); P.rect(15+st,54,10,3,DK);                                       // chân trước
    if(view==='punch'){ P.rect(14,15,24,6,SV); P.rect(14,15,24,1,'#e8ecef'); P.rect(36,13,9,10,DK); P.rect(37,14,6,2,SV2); }
    else if(view==='fire'){ P.rect(14,15,14,6,SV); P.rect(26,13,20,9,BK); P.rect(27,14,18,2,'#3a3a44'); P.rect(45,14,6,7,'#c070ff'); P.rect(47,15,4,5,'#f0d8ff'); }
    else { P.rect(9,12,8,7,SV2); P.rect(11,18,5,10,SV); P.rect(10,26,7,12,BK); P.rect(11,27,5,2,'#3a3a44'); P.rect(12,38,3,2,PU); } });   // tay cầm pháo buông xuống
  const back=view==='up';
  return S(44,58,22,57,(g,P)=>{ const lu=f?1:0, ru=f?0:1;
    P.rect(10,37-lu,9,18,SV); P.rect(25,37-ru,9,18,SV); P.rect(12,43-lu,5,4,DK); P.rect(27,43-ru,5,4,DK); P.rect(9,54-lu,11,3,DK); P.rect(24,54-ru,11,3,DK);
    P.rect(12,31,20,6,DK); P.rect(19,32,6,3,PU); P.rect(14,25,16,6,SV2); for(let y=26;y<31;y+=2) P.rect(15,y,14,1,DK);
    P.rect(7,12,30,13,SV); P.rect(19,12,6,13,SV2); if(!back){ P.rect(10,14,8,8,DK); P.rect(26,14,8,8,DK); P.rect(20,15,4,4,PU); }
    P.rect(2,9,8,8,SV2); P.rect(34,9,8,8,SV2); P.rect(2,17,6,18,SV); P.rect(36,17,6,8,SV); P.rect(35,24,8,16,BK); P.rect(36,25,6,2,'#3a3a44'); P.rect(2,35,6,5,DK);   // vai, tay, pháo
    P.rect(15,1,14,11,SV2); P.rect(17,0,10,2,SV); P.rect(21,0,2,4,DK);
    if(!back){ P.rect(18,5,8,7,SV); P.rect(19,7,2,1,RE); P.rect(23,7,2,1,RE); P.rect(19,10,6,1,DK); } }); }
const megaShot=()=>S(14,14,7,7,(g,P)=>{ P.disc(7,7,6,'rgba(170,90,255,.45)'); P.disc(7,7,4,'#a050ff'); P.disc(7,7,2,'#f0d8ff'); },false);
Object.assign(A,{megatron,megaShot});
})();

/* ---------- khủng long cổ dài (theo ảnh mẫu): xanh lá đốm xanh đậm, bụng + mặt dưới cổ cam, quay phải, đi 2 nhịp ---------- */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
function dino(fr=0){ const f=fr%2, G='#5ab832', G2='#3a8a2a', L='#8ad84a', O='#e8a030', O2='#c47a1a';
  return S(48,40,24,39,(g,P)=>{
    P.rect(15+f,29,4,8-f,G2); P.rect(28+f,29,4,8-f,G2);                                                               // chân phía xa
    P.rect(1,26,4,2,G); P.rect(4,24,6,4,G); P.rect(9,22,6,6,G); P.rect(3,27,8,1,O); P.rect(9,28,6,1,O);                 // đuôi thon về trái
    P.rect(12,15,24,14,G); P.rect(14,13,18,2,G); P.rect(17,12,12,1,G); P.rect(11,18,1,9,G); P.rect(36,17,1,10,G);        // thân gù
    P.rect(16,13,12,1,L); P.rect(13,16,4,1,L);                                                                         // vệt sáng lưng
    for(const [x,y,r] of [[19,17,2],[26,16,2],[31,20,2],[22,23,1],[15,21,1]]) P.disc(x,y,r,G2);                         // đốm
    P.rect(13,28,22,2,O); P.rect(13,29,22,1,O2);                                                                        // bụng cam
    P.rect(33,10,4,8,G); P.rect(35,5,4,7,G); P.rect(37,2,4,5,G); P.rect(37,12,1,6,O); P.rect(39,7,1,5,O);               // cổ dài + mặt dưới cổ cam
    P.rect(37,0,9,6,G); P.rect(38,0,6,1,L); P.rect(44,2,3,3,G); P.px(42,2,'#1c1516'); P.px(41,2,'#ffffff'); P.rect(42,5,5,1,G2); P.px(46,3,G2);   // đầu, mắt, miệng
    P.rect(18-f,29,4,8-(1-f),G); P.rect(31-f,29,4,8-(1-f),G); for(const x of [18,31]) P.rect(x-f,36,4,1,G2); }); }      // chân phía gần
// ba sừng: cam, diềm cổ vàng có sọc, 3 sừng xám, đốm nâu đỏ trên lưng
function trice(fr=0){ const f=fr%2, O='#f07a10', O2='#c85a08', Y='#f4b020', Y2='#d08a10', H='#b0a8c0', SP='#a83a1a';
  return S(50,32,25,31,(g,P)=>{
    P.rect(15+f,24,4,7-f,O2); P.rect(29+f,24,4,7-f,O2);                                                                // chân xa
    P.rect(1,18,3,2,O); P.rect(3,17,6,4,O); P.rect(8,15,6,7,O);                                                         // đuôi
    P.rect(12,10,24,15,O); P.rect(14,8,18,2,O); P.rect(17,7,12,1,O); P.rect(12,23,24,2,O2);                             // thân
    for(const [x,y] of [[17,11],[23,10],[28,13],[20,16],[31,17]]){ P.px(x,y,SP); P.px(x-1,y+1,SP); P.px(x+1,y+1,SP); P.px(x,y+2,SP); }   // đốm hình thoi
    P.rect(30,1,8,18,Y); P.rect(28,4,2,12,Y); P.rect(38,3,1,14,Y2); for(const y of [4,8,12]) P.rect(31,y,6,1,Y2);       // diềm cổ
    P.rect(36,9,10,10,O); P.rect(44,13,4,5,O); P.rect(47,15,2,2,O2); P.rect(38,18,9,1,O2); P.px(41,12,'#1c1516'); P.rect(42,16,4,1,O2);   // đầu + mỏ
    for(const [x,y] of [[40,8],[41,7],[42,6],[43,5],[44,4]]) P.rect(x,y,2,1,H); for(const [x,y] of [[36,8],[37,7],[38,6],[39,5]]) P.rect(x,y,2,1,H); P.rect(46,12,2,1,H); P.px(48,11,H);   // 3 sừng
    P.rect(18-f,24,4,7-(1-f),O); P.rect(32-f,24,4,7-(1-f),O); for(const x of [18,32]) P.rect(x-f,30,4,1,'#e8e0f0'); }); }
// thằn lằn bay: thân tím, cánh màng cam, mỏ dài, mào; 2 khung vỗ cánh
function ptero(fr=0){ const up=fr%2===0, Pu='#8a5aa8', Pl='#b08ad0', Pd='#5a3a78', W='#f4a820', W2='#d07a10';
  return S(52,30,26,29,(g,P)=>{ const wing=(pts,dark)=>{ g.fillStyle=dark?W2:W; g.beginPath(); g.moveTo(...pts[0]); for(const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); g.strokeStyle=Pu; g.lineWidth=1; g.beginPath(); g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.stroke(); };
    if(up){ wing([[30,14],[40,2],[47,4],[34,16]],true); wing([[20,14],[6,1],[26,2],[28,14]],false); } else { wing([[30,16],[42,26],[47,23],[34,16]],true); wing([[20,16],[6,27],[26,26],[28,16]],false); }
    P.rect(12,16,8,2,Pu); P.rect(8,17,5,1,Pu);                                                                          // đuôi
    P.rect(18,13,16,6,Pu); P.rect(19,13,14,1,Pl); P.rect(18,18,16,1,Pd);                                                 // thân
    P.rect(32,11,8,6,Pu); P.rect(33,11,6,1,Pl); P.rect(26,9,7,2,Pu); P.rect(24,8,3,2,Pd);                               // đầu + mào
    P.rect(40,13,9,2,Pu); P.rect(40,15,7,1,Pd); P.px(49,13,Pd); P.px(35,12,'#1c1516'); P.rect(38,15,3,1,'#a8322a');     // mỏ dài, mắt, miệng
    P.rect(24,19,1,3,Pd); P.rect(28,19,1,3,Pd); }); }
// bạo chúa hồng: đầu to há miệng có răng, bụng vàng, tay ngắn, đứng thẳng
function rexPink(fr=0){ const f=fr%2, K='#d8507a', L='#f07aa0', D='#a83a5a', Y='#f4b030', Y2='#d08a10';
  return S(44,44,22,43,(g,P)=>{
    P.rect(0,30,4,2,K); P.rect(3,28,6,5,K); P.rect(8,26,6,8,K);                                                         // đuôi
    P.rect(26+f,34,6,8-f,D);                                                                                             // chân xa
    P.rect(11,15,18,20,K); P.rect(13,14,14,1,K); P.rect(15,17,8,18,Y); P.rect(15,17,2,18,Y2);                            // thân + bụng vàng
    for(const [x,y] of [[24,20],[26,25],[12,22]]) P.px(x,y,D);
    P.rect(28,18,5,2,K); P.rect(32,19,2,3,L); P.rect(30,22,4,2,K); P.rect(33,23,2,2,L);                                 // tay ngắn
    P.rect(16,1,24,10,K); P.rect(18,0,20,1,K); P.rect(17,1,22,1,L); P.rect(16,13,22,4,K); P.rect(16,16,22,1,D);         // đầu: hàm trên, hàm dưới
    P.rect(18,11,20,2,'#5a1a2a'); for(let x=19;x<38;x+=3){ P.rect(x,10,2,2,'#ffffff'); P.rect(x+1,13,2,1,'#ffffff'); }    // miệng há, răng
    P.rect(29,3,5,4,'#ffffff'); P.rect(31,4,2,2,'#1c1516'); P.rect(28,2,6,1,D); P.px(38,4,D); P.px(37,5,D);             // mắt trợn, lỗ mũi
    P.rect(12-f,28,10,8,K); P.rect(13-f,28,8,2,L); P.rect(12-f,36,6,6-(1-f),K); P.rect(10-f,41,10,2,D); for(const x of [10,14,18]) P.px(x-f,42,'#ffffff'); }); }   // đùi + bàn chân to, móng
// bạo chúa xanh: tư thế ngang đang gầm, miệng hồng há to, bụng be, đuôi vểnh
function rexGreen(fr=0){ const f=fr%2, G='#4ab83a', L='#7ad84a', D='#2a7a2a', B='#e8d4a8', M='#e87a8a';
  return S(56,40,28,39,(g,P)=>{
    P.rect(2,2,6,3,D); P.rect(6,3,6,5,G); P.rect(10,6,8,6,G); P.rect(4,1,3,2,G);                                        // đuôi vểnh lên trái
    P.rect(32+f,26,4,12-f,D); P.rect(31+f,37,7,2,D);                                                                     // chân xa
    P.rect(14,9,26,14,G); P.rect(16,8,22,1,L); for(const x of [20,26,32]) P.rect(x,10,3,1,D); P.rect(18,21,22,3,B);       // thân + vằn lưng + bụng
    P.rect(36,11,3,2,G); P.rect(38,13,3,2,G); P.px(40,15,'#e8e8f0');                                                     // tay ngắn
    P.rect(38,3,14,7,G); P.rect(39,3,12,1,L); P.px(47,5,'#1c1516'); P.px(46,5,'#ffffff'); P.rect(50,4,3,4,G);            // hàm trên + mắt
    P.rect(40,10,12,4,M); for(let x=41;x<52;x+=3){ P.rect(x,10,1,2,'#ffffff'); P.rect(x+1,13,1,1,'#ffffff'); }            // miệng hồng, răng
    P.rect(39,14,13,3,G); P.rect(40,16,11,1,D);                                                                          // hàm dưới
    P.rect(23-f,20,8,8,G); P.rect(24-f,20,6,2,L); P.rect(25-f,28,4,9,G); P.rect(23-f,37,8,2,D); for(const x of [23,26,29]) P.px(x-f,38,'#e8e8f0'); }); }   // đùi + chân gần
// cá sấu (theo ảnh mẫu): xanh lá, bụng xanh nhạt, móng vàng, mắt lồi trên đỉnh đầu; dáng thấp để nổi nửa người dưới nước
function croc(fr=0,open=false){ const f=fr%2, G='#7aa844', D='#5a8a30', L='#b8cc60', Y='#f2d84a';
  return S(46,18,23,17,(g,P)=>{
    P.rect(0,10,6,2,G); P.rect(5,9,8,3,G); P.rect(12,7,14,7,G); P.rect(13,13,12,1,D); for(let x=8;x<24;x+=3) P.rect(x,6+(x>14?0:2),2,1,D);   // đuôi + thân, gai lưng
    P.rect(26,6,8,6,G); P.rect(28,3,2,3,G); P.rect(31,3,2,3,G); P.px(28,4,'#ffffff'); P.px(29,4,'#1c1516'); P.px(31,4,'#ffffff'); P.px(32,4,'#1c1516');   // đầu + 2 mắt lồi
    if(open){ P.rect(34,4,10,3,G); P.rect(34,7,10,2,'#e87a8a'); P.rect(34,9,10,2,L); for(let x=35;x<43;x+=2){ P.px(x,7,'#ffffff'); P.px(x+1,8,'#ffffff'); } }
    else { P.rect(34,7,10,3,G); P.rect(36,10,8,1,L); P.px(43,7,'#1c1516'); }                                            // mõm dài
    P.rect(20,12,10,2,L); for(const [x,k] of [[14,0],[24,1]]) { P.rect(x+(f^k),14,3,2,G); P.rect(x+(f^k),16,3,1,Y); } }); }
Object.assign(A,{dino,trice,ptero,rexPink,rexGreen,croc});
})();

/* Bụi (mèo đen trắng, đứng lâu thì nằm) và Bặm (mèo Ba Tư lông xù kem đốm cam, đứng lâu thì ngồi): 2 bé mèo của Dvu, vẽ theo ảnh, quay phải.
   pose 'walk' (fr = bước chân), 'lie' / 'sit' (fr 1 = nhắm mắt) */
(function(){
const A=ART, S=(w,h,ax,ay,fn)=>A.sprite(w,h,ax,ay,fn,true);
const CAT={bui:{B:'#2b2832',b:'#46414f',d:'#1a181f',W:'#f4f1ea',w:'#cfcac2',E:'#c8e05a',N:'#e89aa0',L:'#5a5662'},
  bam:{B:'#f4e8d4',b:'#fffaf0',d:'#d8c4a6',W:'#fffaf0',w:'#e4d4bc',O:'#e8973e',o:'#c4742a',E:'#c06a1e',N:'#e0828c',L:'#c8b496'}};
function cat(k,pose='walk',fr=0){ const C=CAT[k]||CAT.bui, xu=k==='bam';
  return S(20,13,10,12,(g,P)=>{ const r=(x,y,w,h,c)=>P.rect(x,y,w,h,c), px=(x,y,c)=>P.px(x,y,c);
    if(pose==='lie'){                                                                                        // nằm dài, chân trước duỗi
      r(0,10,4,2,C.B); r(3,8,11,4,C.B); r(4,8,9,1,C.b); r(4,12,9,1,C.d);
      r(12,4,6,5,C.B); r(12,3,2,1,C.B); r(16,3,2,1,C.B); px(12,2,C.B); px(17,2,C.B);
      r(14,7,4,2,C.W); r(12,9,3,2,C.W); r(14,11,5,1,C.W); px(17,7,C.N);
      for(const x of [14,16]) px(x,6,fr?C.L:C.E); return; }
    if(pose==='sit'){                                                                                        // ngồi, đuôi xù quấn trước chân
      r(3,6,9,5,C.B); r(4,5,6,1,C.B); r(2,8,1,3,C.B); r(4,7,3,2,C.O); r(5,9,2,1,C.o);
      r(2,11,12,2,C.B); r(2,11,3,2,C.O); r(10,6,4,5,C.W);
      r(10,9,1,3,C.w); r(12,9,1,3,C.w);
      r(9,1,7,5,C.B); px(9,0,C.B); px(10,0,C.O); px(14,0,C.O); px(15,0,C.B); r(10,1,5,1,C.O); r(9,2,2,2,C.O); r(11,5,3,1,C.W);
      for(const x of [11,13]) px(x,3,fr?C.L:C.E); px(12,4,C.N); return; }
    const a=fr?1:-1;                                                                                         // đi: chân xa tối hơn, bước so le
    if(xu){ r(0,1,3,5,C.B); r(1,0,2,1,C.B); r(0,1,2,2,C.O); }                                               // đuôi xù, chóp cam
    else { r(2,5,1,2,C.B); r(1,2,2,3,C.B); px(2,1,C.B); }
    r(5+a,10,2,3,C.d); r(12-a,10,2,3,C.d); r(4-a,10,2,3,C.B); r(13+a,10,2,3,C.B);
    if(xu){ r(3,4,12,6,C.B); r(4,3,10,1,C.B); r(4,4,10,1,C.b); r(6,4,4,2,C.O); r(7,6,2,1,C.o); for(const x of [4,7,10,13]) px(x,10,C.w);
      r(13,1,6,5,C.B); px(13,0,C.B); px(14,0,C.O); px(17,0,C.O); px(18,0,C.B); r(13,1,4,2,C.O); r(12,2,1,4,C.B); r(14,4,5,2,C.W);
      px(16,3,C.E); px(18,3,C.E); px(17,4,C.N); }                                                            // mặt bẹt, má trắng, mắt nâu đồng
    else { r(3,6,11,4,C.B); r(4,6,9,1,C.b); r(8,9,5,1,C.W); for(const x of [4-a,13+a]) r(x,12,2,1,C.W);   // Bụi đi tất trắng
      r(13,2,6,5,C.B); px(13,1,C.B); px(14,1,C.B); px(17,1,C.B); px(18,1,C.B); r(15,5,4,2,C.W); r(13,6,3,4,C.W);
      px(15,3,C.E); px(17,3,C.E); px(18,5,C.N); } }); }
Object.assign(A,{cat});
})();

/* Ộ i i: gói khô gà đè tem (icon + vật rơi trên đất), bình shisha, thảm Ba Tư và đệm ngồi ở góc shisha Nhà giải trí */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const khoga=P=>{ P.rect(2,1,10,12,'#f4ecd8'); P.rect(2,1,10,2,'#d23a2e'); P.rect(3,1,8,1,'#f05a4a');                               // túi zip, mép đỏ
  for(const [x,y,c] of [[4,4,'#c46a2a'],[5,5,'#a04a1a'],[7,4,'#e08a3a'],[9,5,'#c46a2a'],[4,7,'#e08a3a'],[6,6,'#c46a2a'],[8,7,'#a04a1a'],[10,8,'#e08a3a'],[5,9,'#a04a1a'],[3,10,'#c46a2a'],[6,10,'#e08a3a']]){ P.rect(x,y,2,1,c); }   // khô gà xé sợi
  P.px(9,4,'#d23a2e'); P.px(4,6,'#d23a2e');                                                                                     // lá chanh, ớt
  P.rect(7,8,4,4,'#c8d0e8'); P.px(8,9,'#8a9ad8'); P.px(9,10,'#e89ac8'); P.px(9,9,'#ffffff'); P.px(8,10,'#a8e0c8'); };           // tem chống giả lấp lánh
const oldIcon=A.icon; A.icon=function(name,scale=1){ if(name!=='khoga') return oldIcon(name,scale); const c=A.cv(14,14); khoga(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
// bình shisha: bầu thuỷ tinh tím, thân đồng, nõ đất nung + than hồng (fr đổi ánh than), dây hút xanh
const shisha=(fr=0)=>S(18,32,8,31,(g,P)=>{ P.rect(4,29,9,2,'#2a1a40'); P.rect(3,20,11,9,'#5a3a9a'); P.rect(4,19,9,1,'#5a3a9a'); P.rect(5,18,7,1,'#6a4aaa');
    P.rect(4,24,9,4,'#4a8ac8'); P.rect(4,24,9,1,'#7ab8e0'); P.rect(5,20,2,6,'#8a6ad0'); P.px(5,21,'#c8b8f0');                        // nước trong bầu, ánh sáng
    P.rect(7,7,3,11,'#c8a24a'); P.rect(6,10,5,1,'#e8c86a'); P.rect(6,14,5,1,'#e8c86a'); P.rect(8,7,1,11,'#e8c86a');                  // thân đồng
    P.rect(4,7,9,1,'#a8aeb6'); P.rect(5,6,7,1,'#c8ccd2');                                                                       // đĩa hứng tro
    P.rect(6,2,5,4,'#b8543a'); P.rect(6,2,5,1,'#d8dce2'); P.px(7,1,fr?'#ffb84a':'#ff7a2a'); P.px(9,1,fr?'#ff7a2a':'#ffb84a'); P.px(8,1,'#3a2a2a');   // nõ + than
    for(const [x,y] of [[11,15],[12,16],[13,17],[14,18],[15,20],[15,22],[15,24],[14,26],[15,27],[16,28]]) P.rect(x,y,1,2,'#3a7a4a');  // dây hút
    P.rect(16,28,2,2,'#c8a24a'); });
// thảm Ba Tư: viền đỏ sẫm, ruột đỏ, hoa văn trám vàng, tua trắng 2 đầu (nằm phẳng dưới đất)
const rug=()=>S(72,36,36,18,(g,P)=>{ P.rect(2,2,68,32,'#6a1a1a'); P.rect(4,4,64,28,'#b8342e'); P.rect(7,7,58,22,'#8c231f'); P.rect(9,9,54,18,'#c4382e');
    for(let x=12;x<62;x+=10){ const c='#e8b83a'; P.px(x+2,13,c); P.rect(x+1,14,3,1,c); P.rect(x,15,5,1,c); P.rect(x+1,16,3,1,c); P.px(x+2,17,c); P.px(x+2,15,'#2a4a8a'); }
    P.rect(30,19,12,4,'#2a4a8a'); P.rect(32,20,8,2,'#e8b83a');
    for(let y=3;y<34;y+=2){ P.px(0,y,'#f4f1ea'); P.px(1,y,'#d8d2c6'); P.px(71,y,'#f4f1ea'); P.px(70,y,'#d8d2c6'); } },false);
// đệm ngồi bệt (pouf) tím sọc vàng
const pouf=()=>S(18,11,9,10,(g,P)=>{ P.rect(1,3,16,7,'#6a3a8a'); P.rect(2,2,14,1,'#8a5aaa'); P.rect(1,9,16,1,'#4a2a6a'); for(let x=3;x<16;x+=4) P.rect(x,3,1,6,'#e8b83a'); P.rect(6,2,6,1,'#a87ac8'); });
Object.assign(A,{shisha,rug,pouf});
})();

/* Lumen Studio (camera + đèn vòng, phông xanh, TV treo tường, ghế lounge, tab đầu giường) và Phòng của Diệp
   (máy game thùng, ghế bành tím, bàn trải khăn đỏ + chân nến, sofa nhìn ngang, kệ sách, bàn TV máy game cổ + đèn dung nham, chậu bonsai, thảm xanh) */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), OUT='#1c1516';
const cameraRig=()=>S(24,42,12,40,(g,P)=>{ for(const [x0,x1] of [[11,3],[12,12],[13,21]]){ const n=14; for(let i=0;i<=n;i++) P.px(Math.round(x0+(x1-x0)*i/n),26+i,'#3a3a40'); }   // chân máy
    P.rect(11,14,2,13,'#4a4a52'); P.rect(6,9,12,7,'#26262c'); P.rect(15,10,4,5,'#3a3a44'); P.disc(17,12,2,'#5aa9d6'); P.px(8,10,'#d9263a');   // thân máy quay
    P.disc(12,6,6,'#f4f4f1'); P.disc(12,6,4,'#ffffff'); P.disc(12,6,2,'#c8ccd2'); });                                          // đèn vòng
const greenScreen=()=>S(80,34,40,32,(g,P)=>{ P.rect(2,1,76,2,'#3a3a40'); P.rect(4,3,72,26,'#38b04a'); P.rect(4,3,72,3,'#4ac85c'); for(let x=8;x<76;x+=12) P.rect(x,6,1,22,'#30a040');
    P.rect(2,3,2,30,'#3a3a40'); P.rect(76,3,2,30,'#3a3a40'); },false);
const wallTV=()=>S(44,26,22,25,(g,P)=>{ P.rect(1,1,42,22,'#18181c'); P.rect(3,3,38,18,'#2a4a7a'); P.rect(5,5,16,6,'#5aa9d6'); P.rect(23,5,16,3,'#ffd84a'); P.rect(23,10,12,2,'#f4f4f1'); P.rect(5,14,30,2,'#7fe0ff'); P.rect(20,23,4,2,'#3a3a40'); });
const loungeChair=(col='#c4384a')=>S(16,18,8,16,(g,P)=>{ P.rect(2,1,12,8,col); P.rect(3,2,10,2,'rgba(255,255,255,.25)'); P.rect(1,8,14,5,col); P.rect(1,12,14,1,'rgba(0,0,0,.25)'); P.rect(2,13,2,4,'#3a3a40'); P.rect(12,13,2,4,'#3a3a40'); });
const bedside=(flower='#ff7a8a')=>S(18,30,9,28,(g,P)=>{ P.rect(1,14,16,14,'#e8ecef'); P.rect(1,14,16,2,'#ffffff'); P.rect(3,19,12,1,'#b8bec6'); P.rect(8,21,2,1,'#8a9098');
    P.rect(6,8,6,6,'#e0a070'); P.rect(5,8,8,1,'#c8885a'); P.rect(8,3,2,5,'#4f9a3e'); P.disc(6,4,2,flower); P.disc(12,4,2,flower); P.disc(9,2,2,'#ffd84a'); });
// ---- phòng Diệp
const arcade=(col='#d9463a')=>S(26,44,13,42,(g,P)=>{ P.rect(2,1,22,40,'#3a3a44'); P.rect(2,1,22,8,col); P.rect(4,3,18,4,'#5a5a66'); P.rect(7,4,12,2,'#c8ccd2');   // biển hiệu
    P.rect(3,10,20,13,'#18181c'); P.rect(4,11,18,11,'#2a3a2a'); P.rect(10,12,6,5,'#f4f4f1'); P.px(11,14,OUT); P.px(14,14,OUT); P.rect(11,16,4,1,OUT);   // màn hình: con ma cười
    for(const x of [5,8,17,20]) P.rect(x,19,2,1,'#5fe06a'); P.rect(2,23,22,6,col); P.rect(5,24,2,3,OUT); P.disc(6,24,1,'#ffd84a'); P.disc(15,26,1,'#f4f4f1'); P.disc(19,26,1,'#ff4fa3');   // bảng điều khiển
    P.rect(3,30,20,10,'#4a4a56'); P.rect(9,33,8,4,'#2a2a30'); P.rect(10,34,2,1,'#d9263a'); P.rect(14,34,2,1,'#d9263a'); });
const armchair=(col='#8a5aaa')=>S(34,34,17,32,(g,P)=>{ const hi='#a87ac8', lo='#6a3a8a'; P.rect(5,1,24,17,col); P.rect(7,2,20,3,hi); P.rect(9,6,16,10,lo);
    P.rect(1,10,7,18,col); P.rect(26,10,7,18,col); P.rect(2,11,5,2,hi); P.rect(27,11,5,2,hi); P.rect(6,16,22,10,col); P.rect(7,17,20,2,hi); P.rect(1,27,32,3,lo); P.rect(3,30,3,3,'#3a2a40'); P.rect(28,30,3,3,'#3a2a40'); });
const redTable=(candle=true)=>S(48,34,24,30,(g,P)=>{ P.rect(2,14,44,10,'#8a5d3b'); P.rect(2,14,44,2,'#a7744c'); P.rect(4,24,3,8,'#5a3a22'); P.rect(41,24,3,8,'#5a3a22');
    P.rect(13,13,22,15,'#c4382e'); P.rect(13,13,22,2,'#e05a4a'); P.rect(13,26,22,2,'#e8b83a'); P.rect(19,15,10,8,'#f2c43d'); P.rect(21,13,6,4,'#e8a838');   // khăn đỏ viền vàng + đĩa đồ ăn
    P.disc(7,12,2,'#e8b83a'); P.disc(10,13,2,'#f2c43d');                                                                       // đĩa quả
    if(candle){ P.rect(39,6,2,8,'#c8ccd2'); P.rect(35,7,10,1,'#c8ccd2'); for(const x of [35,39,44]){ P.rect(x,3,1,4,'#f4f1ea'); P.px(x,2,'#ffb84a'); } P.rect(37,13,6,1,'#a8aeb6'); } });
const sofaSide=(col='#8a5aaa')=>S(22,40,11,38,(g,P)=>{ P.rect(10,1,11,37,'#6a3a8a'); P.rect(1,4,10,31,col); P.rect(2,5,8,2,'#a87ac8'); P.rect(1,1,20,5,col); P.rect(1,33,20,5,col); P.rect(2,2,18,1,'#a87ac8'); P.rect(1,36,20,2,'#4a2a60'); });
const retroShelf=(top='terra')=>S(34,40,17,38,(g,P)=>{ P.rect(1,14,32,24,'#7a4a2a'); P.rect(1,14,32,2,'#9a6a3a'); for(const y of [18,27]){ P.rect(3,y,28,7,'#5a3a22');
      for(let x=4,i=0;x<30;i++){ const w=2+(i*7)%3, c=['#c4382e','#3f7a8a','#e8b83a','#5aa9d6','#4f9a3e','#e8823a'][(i+y)%6]; P.rect(x,y+2,w,5,c); x+=w+1; } }
    P.rect(4,35,26,1,'#3a6ad0'); for(let x=5;x<30;x+=4) P.px(x,36,'#e8b83a');
    if(top==='terra'){ P.rect(8,4,18,10,'rgba(200,230,240,.55)'); P.rect(8,4,18,1,'#ffffff'); P.rect(9,10,16,3,'#6e472c'); P.rect(15,6,2,4,'#5a3a22'); P.disc(16,6,3,'#3f7a31'); }
    else { P.rect(6,10,22,4,'#e8b83a'); for(let x=7;x<27;x+=3){ P.rect(x,6,2,4,'#f2c43d'); P.px(x,5,'#c48a1a'); } } });
const consoleTable=()=>S(86,40,43,38,(g,P)=>{ P.rect(2,22,82,6,'#8a5d3b'); P.rect(2,22,82,2,'#a7744c'); P.rect(4,28,3,10,'#5a3a22'); P.rect(79,28,3,10,'#5a3a22'); P.rect(8,30,70,2,'#6e472c');
    P.rect(30,3,26,19,'#a8aeb6'); P.rect(32,5,22,12,'#18181c'); P.rect(33,6,20,10,'#5aa9d6'); P.rect(33,13,20,3,'#4f9a3e'); P.rect(36,10,3,3,'#e8823a'); P.rect(45,8,2,2,'#f4f4f1');   // màn hình game cổ
    P.rect(34,18,18,3,'#8a9098'); P.rect(44,19,4,1,'#d9263a'); P.rect(22,24,8,3,'#c8ccd2'); P.rect(56,24,8,3,'#c8ccd2');
    for(const [x,c] of [[10,'#ff7a2a'],[70,'#ffb84a']]){ P.rect(x,18,8,4,'#c8ccd2'); P.rect(x+1,7,6,11,'rgba(255,255,255,.5)'); P.disc(x+4,11,2,c); P.disc(x+3,15,1,c); P.rect(x+1,4,6,3,'#c8ccd2'); } });   // đèn dung nham
const bonsaiPot=(leaf='#e86a2a')=>S(22,34,11,32,(g,P)=>{ P.rect(4,22,14,10,'#c8ccd2'); P.rect(3,22,16,2,'#e8ecef'); P.rect(10,13,3,9,'#6e472c'); P.rect(7,15,3,2,'#6e472c');
    for(const [x,y,r] of [[11,8,5],[6,12,4],[16,12,4],[11,4,3]]) P.disc(x,y,r,leaf); P.disc(9,6,2,'rgba(255,255,255,.25)'); });
const greenRug=(w=200,h=132)=>S(w,h,w/2,h/2,(g,P)=>{ P.rect(0,0,w,h,'#4a6a4a'); P.rect(3,3,w-6,h-6,'#c8b896'); P.rect(5,5,w-10,h-10,'#5a7a5a'); P.rect(9,9,w-18,h-18,'#c8b896'); P.rect(10,10,w-20,h-20,'#557555');
    for(const [x,y] of [[12,12],[w-16,12],[12,h-16],[w-16,h-16]]){ P.rect(x,y,4,4,'#c8b896'); P.px(x+1,y+1,'#557555'); } },false);
Object.assign(A,{cameraRig,greenScreen,wallTV,loungeChair,bedside,arcade,armchair,redTable,sofaSide,retroShelf,consoleTable,bonsaiPot,greenRug});
})();

/* Lumen Studio có bộ nhận diện riêng (khác DAS): sàn gạch xám xanh 'b', tường kem chân xanh bạc hà 'h', chậu cây tròn, bàn tư liệu gỗ, cửa kính */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
A.WALKABLE.add('b');
TE.b=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#dfe6ea'); P.rect(X,Y,T,1,'#c3ccd2'); P.rect(X,Y,1,T,'#c3ccd2'); P.rect(X+8,Y,1,T,'#ccd5da'); P.rect(X,Y+8,T,1,'#ccd5da'); if(hash(tx,ty,81)<.12) P.px(X+4,Y+5,'#f6f9fb'); };
TE.h=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1);
  if(below&&below!=='h'&&A.WALKABLE.has(below)){ P.rect(X,Y,T,T,'#efe6cf'); P.rect(X,Y,T,2,'#fbf6ea'); P.rect(X,Y+7,T,7,'#5f9e84'); P.rect(X,Y+7,T,1,'#7fbfa2'); P.rect(X,Y+14,T,2,'#3f6e5c'); for(let x=3;x<T;x+=8) P.rect(X+x,Y+8,1,5,'#548f76'); }   // mặt tường: kem trên, ốp xanh dưới
  else { P.rect(X,Y,T,T,'#4a5560'); P.rect(X,Y,T,1,'#66737e'); P.rect(X,Y+T-1,T,1,'#3a434c'); } };                                                    // đỉnh tường
const pottedFern=()=>S(22,30,11,28,(g,P)=>{ P.rect(5,20,12,8,'#a0643a'); P.rect(4,20,14,2,'#c07a48'); P.rect(6,27,10,1,'#6e472c');
  for(const [x,y,r] of [[11,12,6],[6,15,4],[16,15,4],[11,7,4]]) P.disc(x,y,r,'#3f8a4a'); for(const [x,y] of [[8,9],[13,11],[10,15],[15,13]]) P.px(x,y,'#6fc07a'); });
const workTable=()=>S(48,26,24,24,(g,P)=>{ P.rect(2,8,44,10,'#b88a5a'); P.rect(2,8,44,2,'#d4a878'); P.rect(4,18,3,7,'#7a5434'); P.rect(41,18,3,7,'#7a5434');
  P.rect(7,4,12,6,'#2a2a30'); P.rect(8,5,10,4,'#7fe0ff'); P.rect(6,10,14,1,'#5a5a66'); P.rect(25,9,8,6,'#f4f4f1'); P.rect(27,11,5,1,'#b8bec6'); P.rect(35,8,6,7,'#fff3a8'); P.rect(36,10,4,1,'#c8b860'); });
const glassWall=(w=96)=>S(w,22,w/2,21,(g,P)=>{ P.rect(0,0,w,22,'#7a8a94'); P.rect(2,2,w-4,18,'#bfe2f2'); for(let x=2;x<w-2;x+=24) P.rect(x,2,2,18,'#7a8a94'); P.rect(2,2,w-4,3,'#e8f8ff'); for(let x=8;x<w;x+=24) P.rect(x,6,6,1,'#ffffff'); },false);
Object.assign(A,{pottedFern,workTable,glassWall});
})();

/* bãi đỗ xe Ké: vạch trắng chia ô (nằm phẳng trên nền nhựa), chữ P */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const parkingLines=(cols=3,rows=2,cw=72,rh=46)=>S(cols*cw+4,rows*rh+4,0,0,(g,P)=>{ for(let r=0;r<=rows;r++) P.rect(0,r*rh,cols*cw+4,2,'#f4f1ea'); for(let c=0;c<=cols;c++) for(let r=0;r<rows;r++) P.rect(c*cw,r*rh,2,rh-8,'#f4f1ea'); },false);
const parkSign=()=>S(20,34,10,32,(g,P)=>{ P.rect(9,14,2,18,'#8a9098'); P.rect(2,1,16,15,'#2a5aa8'); P.rect(3,2,14,13,'#3a6ad0'); P.rect(7,4,2,9,'#ffffff'); P.rect(9,4,4,1,'#ffffff'); P.rect(12,5,1,3,'#ffffff'); P.rect(9,8,4,1,'#ffffff'); });
Object.assign(A,{parkingLines,parkSign});
})();

/* 120 Yên Lãng · phòng stream anh Độ (theo ảnh): sàn gỗ xương cá sáng 'e', tường xám xanh đậm viền LED 'f', giá súng mô hình treo tường, bàn stream 3 màn hình,
   tủ kính figure đèn LED, mảng tường gạch đỏ + kệ figure, mô hình Hulkbuster đỏ 3 mét, đôn đen, thảm xám; bát phở chị Thảo (icon) */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), OUT='#1c1516';
A.WALKABLE.add('e');
TE.e=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#c8a878'); for(let k=0;k<T;k+=4){ const off=(ty*4+k)/4%2?0:4; for(let x=0;x<T;x+=8){ P.rect(X+(x+off)%T,Y+k,4,3,'#d8bc8e'); P.rect(X+(x+off)%T,Y+k+3,4,1,'#b08e60'); } } };
TE.f=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1);
  if(below&&below!=='f'&&A.WALKABLE.has(below)){ P.rect(X,Y,T,T,'#2f3d44'); P.rect(X,Y+2,T,1,'#7fe0ff'); for(let x=2;x<T;x+=6) P.rect(X+x,Y+4,1,10,'#28353b'); P.rect(X,Y+T-2,T,2,'#1e282d'); }   // mặt tường + dải LED xanh
  else { P.rect(X,Y,T,T,'#1e282d'); P.rect(X,Y,T,1,'#3a4a52'); } };
const gunRack=(w=110)=>S(w,26,w/2,25,(g,P)=>{ for(const [y,len,c] of [[5,w-20,'#2a2a2f'],[13,w-34,'#3a3a40'],[20,w-26,'#4a3a2a']]){ const x=8+(w-20-len)/2; P.rect(x,y,len,3,c); P.rect(x,y+3,8,3,c); P.rect(x+len-12,y-2,10,2,'#5a5a66'); P.rect(x+len*.45,y+3,3,4,c); }
    for(const x of [6,w-8]) P.rect(x,2,2,22,'#8a9098'); },false);
const streamDesk=(w=128)=>S(w,40,w/2,38,(g,P)=>{ P.rect(2,22,w-4,8,'#8a5d3b'); P.rect(2,22,w-4,2,'#a7744c'); P.rect(4,30,3,8,'#5a3a22'); P.rect(w-7,30,3,8,'#5a3a22');
    for(const [x,c] of [[14,'#5aa9d6'],[46,'#7fe0ff'],[78,'#4f9a3e']]){ P.rect(x,2,30,18,'#18181c'); P.rect(x+2,4,26,13,c); P.rect(x+4,6,10,2,'#f4f4f1'); P.rect(x+13,19,4,3,'#3a3a40'); }   // 3 màn hình
    P.rect(w-26,14,18,8,'#c8ccd2'); P.rect(w-25,9,16,6,'#2a2a30'); P.rect(w-24,10,14,4,'#ff7a8a');                                                  // laptop
    P.rect(4,10,2,12,'#3a3a40'); P.disc(5,8,3,'#26262c'); P.rect(40,23,26,3,'#26262c'); for(let x=41;x<65;x+=3) P.px(x,24,['#ff4fa3','#7fe0ff','#5fe06a'][x%3]); });   // mic + bàn phím LED
const displayCase=(seed=0)=>S(34,46,17,44,(g,P)=>{ P.rect(1,1,32,43,'#3a4a52'); P.rect(3,3,28,38,'rgba(190,230,245,.35)'); P.rect(2,2,1,41,'#f4f4f1'); P.rect(31,2,1,41,'#f4f4f1');
    for(const y of [14,26,38]) P.rect(3,y,28,1,'#e8f8ff');
    for(let r=0;r<3;r++) for(let i=0;i<3;i++){ const x=6+i*9, y=6+r*12, c=['#d9263a','#f2c43d','#3a6ad0','#5fe06a','#ff7a2a','#a87ac8'][(seed+r*3+i)%6]; P.rect(x+1,y,3,3,'#f3c4a4'); P.rect(x,y+3,5,5,c); P.rect(x+1,y+8,1,1,c); P.rect(x+3,y+8,1,1,c); } });
const brickWall=(w=110)=>S(w,44,w/2,43,(g,P)=>{ P.rect(0,0,w,44,'#a8482e'); for(let y=0;y<44;y+=6){ P.rect(0,y,w,1,'#7a3420'); for(let x=(y/6%2)*6;x<w;x+=12) P.rect(x,y,1,6,'#7a3420'); }
    for(const y of [12,28]){ P.rect(4,y,w-8,2,'#5a3a22'); for(let x=8;x<w-8;x+=11){ const c=['#d9263a','#f2c43d','#5fe06a','#3a6ad0','#f4f1ea'][(x+y)%5]; P.rect(x,y-7,4,7,c); P.rect(x+1,y-9,2,2,'#f3c4a4'); } } },false);
const hulkbuster=()=>S(56,92,28,90,(g,P)=>{ const R='#c4282a', r='#8a1a1c', Y='#e8b83a';
    P.rect(16,2,24,20,R); P.rect(20,6,16,8,Y); P.rect(22,9,4,2,'#ffffff'); P.rect(30,9,4,2,'#ffffff'); P.rect(18,18,20,3,r);                          // đầu
    P.rect(6,22,44,30,R); P.rect(10,24,36,4,'#e04040'); P.disc(28,36,6,'#bfe2f2'); P.disc(28,36,3,'#ffffff'); P.rect(8,48,40,4,r);                    // ngực + lò phản ứng
    P.rect(0,24,8,34,R); P.rect(48,24,8,34,R); P.rect(0,56,10,10,r); P.rect(46,56,10,10,r); P.rect(2,60,6,3,Y); P.rect(48,60,6,3,Y);                   // tay to
    P.rect(12,52,32,10,Y); P.rect(14,62,12,26,R); P.rect(30,62,12,26,R); P.rect(12,86,16,4,r); P.rect(28,86,16,4,r); P.rect(16,70,8,3,Y); P.rect(32,70,8,3,Y); });
const ottoman=()=>S(30,18,15,16,(g,P)=>{ P.rect(2,3,26,11,'#26262c'); P.rect(3,4,24,3,'#3a3a44'); P.rect(2,14,26,2,'#18181c'); });
const plainRug=(w=128,h=96,c='#7a7e86',edge='#5a5e66')=>S(w,h,w/2,h/2,(g,P)=>{ P.rect(0,0,w,h,edge); P.rect(3,3,w-6,h-6,c); for(let x=6;x<w-6;x+=8) P.rect(x,6,1,h-12,'rgba(255,255,255,.06)'); },false);
const phoIcon=P=>{ P.rect(1,6,12,5,'#f4f1ea'); P.rect(2,11,10,2,'#d8d2c6'); P.rect(2,6,10,2,'#e8b860'); P.rect(3,5,3,1,'#5fae46'); P.rect(8,5,2,1,'#d9463a'); P.rect(9,1,1,5,'#a8763a'); P.rect(11,0,1,6,'#a8763a'); };
const oldIcon=A.icon; A.icon=function(name,scale=1){ if(name!=='pho') return oldIcon(name,scale); const c=A.cv(14,14); phoIcon(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
Object.assign(A,{gunRack,streamDesk,displayCase,brickWall,hulkbuster,ottoman,plainRug});
})();

/* sân pickleball trong nhà: mặt sân xanh dương 'c', viền sân xanh lá 'd', vạch kẻ (biên, giữa, vùng cấm volley "kitchen"), lưới, bóng nhựa lỗ vàng, bảng điểm */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
A.WALKABLE.add('c'); A.WALKABLE.add('d');
TE.c=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#3f7fae'); if(hash(tx,ty,91)<.2) P.px(X+5,Y+9,'#4a8cbc'); };
TE.d=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#4f9a6a'); if(hash(tx,ty,92)<.2) P.px(X+9,Y+4,'#5aaa76'); };
const courtLines=(w,h,net,kit)=>S(w,h,0,0,(g,P)=>{ const L='#f4f1ea'; P.rect(0,0,w,2,L); P.rect(0,h-2,w,2,L); P.rect(0,0,2,h,L); P.rect(w-2,0,2,h,L);
  P.rect(0,net-kit,w,2,L); P.rect(0,net+kit,w,2,L); P.rect(w/2-1,0,2,net-kit,L); P.rect(w/2-1,net+kit,2,h-net-kit,L); P.rect(0,net-1,w,2,'rgba(0,0,0,.25)'); },false);
const pkNet=(w)=>S(w+8,22,4,18,(g,P)=>{ P.rect(0,2,4,18,'#3a3a40'); P.rect(w+4,2,4,18,'#3a3a40'); P.rect(4,4,w,2,'#f4f1ea'); for(let y=6;y<16;y+=2) P.rect(4,y,w,1,'rgba(30,30,36,.75)'); for(let x=4;x<w+4;x+=3) P.rect(x,6,1,10,'rgba(30,30,36,.55)'); });
const pkBall=()=>S(6,6,3,3,(g,P)=>{ P.disc(3,3,2,'#e8f040'); P.px(2,2,'#a8b020'); P.px(4,3,'#a8b020'); P.px(3,4,'#a8b020'); });
const scoreBoard=()=>S(56,30,28,29,(g,P)=>{ P.rect(26,20,4,10,'#3a3a40'); P.rect(1,1,54,20,'#18181c'); P.rect(3,3,24,16,'#2a2a30'); P.rect(29,3,24,16,'#2a2a30'); P.rect(9,6,12,10,'#ff4a3d'); P.rect(35,6,12,10,'#7fe0ff'); },false);
const paddleRack=()=>S(28,30,14,28,(g,P)=>{ P.rect(2,10,24,18,'#8a5d3b'); P.rect(2,10,24,2,'#a7744c'); for(const [x,c] of [[4,'#c4382e'],[10,'#3a6ad0'],[16,'#2f9a52'],[22,'#f2c43d']]){ P.rect(x,2,4,9,c); P.rect(x+1,11,2,4,'#26262c'); } });
Object.assign(A,{courtLines,pkNet,pkBall,scoreBoard,paddleRack});
})();

/* đấu trường MCK: sân khấu đen (màn LED, 2 dàn loa, đèn), cột đèn sân khấu */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const mckStage=()=>S(150,64,75,62,(g,P)=>{ P.rect(4,30,142,30,'#18181c'); P.rect(4,30,142,3,'#3a3a44'); P.rect(4,56,142,4,'#0e0e12');
  P.rect(34,2,82,30,'#26262c'); P.rect(37,5,76,24,'#3a2a5a'); P.rect(40,8,70,18,'#a259ff'); A.drawText(g,'MCK',62,12,'#ffffff'); for(let x=42;x<108;x+=6) P.px(x,24,'#ff4fa3');
  for(const x of [6,124]){ P.rect(x,14,20,44,'#26262c'); P.rect(x+2,16,16,40,'#1a1a1e'); for(const y of [22,36,48]){ P.disc(x+10,y,5,'#3a3a44'); P.disc(x+10,y,2,'#5a5a66'); } }
  for(const [x,c] of [[30,'#ff4fa3'],[60,'#7fe0ff'],[90,'#ffd84a'],[120,'#5fe06a']]) P.rect(x,33,6,3,c); });
const stageLight=(c='#ff4fa3')=>S(14,44,7,42,(g,P)=>{ P.rect(6,10,2,32,'#3a3a40'); P.rect(2,40,10,3,'#26262c'); P.rect(2,3,10,8,'#26262c'); P.disc(7,7,3,c); P.disc(7,7,1,'#ffffff'); });
Object.assign(A,{mckStage,stageLight});
})();
