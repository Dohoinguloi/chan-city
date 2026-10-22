/* MU Online · Lục Địa Cát: quảng trường lát đá '9', tường thành đá xám '0', đài phun nước, đền triệu hồi phía Bắc (vòng phù chú đỏ),
   cột đuốc lửa, cờ các class, quầy Pháp sư; boss Luffy Gear 5 (2 khung cười rung người); icon 3 loại ngọc. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), {ell,eye}=A.lcKit, K='#1c1516', WH='#ffffff';
A.WALKABLE.add('9');
TE['9']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#9a9488'); const o=ty%2?8:0; P.rect(X,Y,T,1,'#7a746a'); P.rect(X+o,Y,1,T,'#7a746a'); P.rect(X+(o+8)%16,Y+8,1,8,'#7a746a'); P.rect(X,Y+8,T,1,'#857f74'); if(hash(tx,ty,121)<.3) P.rect(X+3,Y+4,2,1,'#b0aa9e'); if(hash(tx,ty,122)<.12) P.px(X+11,Y+12,'#5fae46'); };
TE['0']=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1); P.rect(X,Y,T,T,'#6a665e'); for(let r=0;r<T;r+=5){ P.rect(X,Y+r,T,1,'#4a4640'); const o=((r/5+tx)%2)*8; P.rect(X+o,Y+r,1,5,'#4a4640'); }
  if(below&&below!=='0'){ P.rect(X,Y+12,T,4,'#3a3630'); if(tx%3===0){ P.rect(X+5,Y+2,6,8,'#2a2622'); P.rect(X+6,Y+3,4,6,'#1a1612'); } } };
A.muFountain=(fr=0)=>S(64,44,32,40,(g,P)=>{ ell(P,32,32,30,10,'#8a847a'); ell(P,32,31,27,8,'#5a9ad8'); for(let i=0;i<6;i++) P.rect(10+i*8+((fr+i)%2)*2,29+(i%2),4,1,'#bfe8ff');
  P.rect(28,12,8,18,'#a8a296'); P.rect(26,10,12,3,'#c8c2b6'); ell(P,32,8,9,3,'#8a847a'); P.rect(31,0,2,8,'#bfe8ff'); for(const [dx,dy] of [[-6,4],[6,4],[-9,9],[9,9]]) P.px(32+dx,dy+((fr+dx)%2),'#e8f8ff'); });
A.muAltar=(fr=0)=>S(96,52,48,40,(g,P)=>{ ell(P,48,36,46,14,'#3a3036'); ell(P,48,36,40,11,fr%2?'#c8302a':'#a8201e'); ell(P,48,36,36,9,'#2a2026'); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; P.rect(Math.round(48+Math.cos(a)*38)-1,Math.round(36+Math.sin(a)*10),3,2,fr%2?'#ff7a5a':'#ff4a3a'); }
  P.rect(40,8,16,24,'#4a4048'); P.rect(38,6,20,3,'#6a6068'); P.rect(44,14,8,8,fr%2?'#ff4a3a':'#c8302a'); P.rect(46,16,4,4,'#ffd84a'); });
A.muTorch=(fr=0)=>S(14,40,7,38,(g,P)=>{ P.rect(5,12,4,26,'#5a5048'); P.rect(3,10,8,3,'#8a8078'); P.rect(4,4,6,6,'#ff7a2a'); P.rect(5,1+(fr%2),4,5,'#ffd84a'); P.px(6,0+(fr%2),'#fff3b0'); P.rect(3,36,8,2,'#3a3630'); });
A.muBanner=(c='#c8302a')=>S(18,44,9,42,(g,P)=>{ P.rect(8,0,2,42,'#5a4232'); P.rect(1,3,16,22,c); P.rect(1,25,8,4,c); P.rect(9,25,8,2,c); P.rect(5,9,8,8,'#ffd84a'); P.rect(7,11,4,4,c); P.rect(1,3,16,1,'#ffd84a'); });
A.muStall=()=>S(64,40,32,38,(g,P)=>{ P.rect(2,10,60,4,'#3a6ad8'); for(let x=2;x<62;x+=8) P.rect(x,10,4,4,'#f4f2ec'); P.rect(4,14,2,24,'#5a4232'); P.rect(58,14,2,24,'#5a4232'); P.rect(4,24,56,6,'#8a5a32'); P.rect(4,24,56,1,'#c8945a');
  for(let i=0;i<6;i++){ const x=10+i*8; P.rect(x,19,4,5,['#e8302a','#3a6ad8','#e8302a','#3a6ad8','#ffd84a','#5fe06a'][i]); P.rect(x+1,17,2,2,'#e8ecef'); } });
// Boss: Luffy Gear 5 (tóc trắng bồng như mây, cười há to, tay che trán, áo khoác trắng cúc vàng cổ vàng, đai tím buông dài, quần trắng rộng, ngồi xổm, dép)
// fr: 0/1 cười rung người (tóc + vai nảy) · hit: chớp sáng khi trúng đòn. Khung 104×108, chân chạm đáy.
A.muBoss=(fr=0,hit=false)=>S(104,108,52,106,(g,P)=>{ const up=fr%2, SK='#f0b070', SKd='#c8844a', W1='#fbfbf8', W2='#d8d8dc', W3='#a8a8b0', Y='#f2c43d', Yd='#c8901a', PU='#9a3ad8', PUd='#6a1aa8';
  // tóc mây trắng
  for(const [x,y,r] of [[52,22,20],[34,24,11],[70,22,12],[42,10,9],[60,9,10],[28,34,8],[76,34,8],[52,4,7],[36,14,7],[68,12,7]]) ell(P,x,y-up,r,Math.round(r*.85),W1);
  for(const [x,y] of [[38,18],[62,14],[70,28],[30,30],[48,8],[58,24]]) P.rect(x,y-up,4,2,W2); for(const [x,y] of [[44,26],[64,20],[34,28]]) P.rect(x,y-up,3,2,W3);
  // mặt + tai
  ell(P,54,44-up,14,12,SK); P.rect(38,40-up,3,6,SK); P.rect(67,40-up,3,6,SK); P.rect(39,42-up,1,2,SKd); P.rect(68,42-up,1,2,SKd);
  // miệng cười há to: răng trên, lưỡi hồng, răng dưới
  ell(P,55,49-up,9,7,'#7a1a22'); P.rect(47,44-up,17,3,'#ffffff'); ell(P,55,53-up,6,3,'#ff8aa8'); P.rect(49,55-up,12,2,'#ffffff'); for(const x of [50,54,58]) P.px(x,45-up,'#d8d8dc');
  // tay che trán (từ trái vươn qua), ngón tay
  P.rect(24,32-up,32,7,SK); P.rect(24,38-up,32,1,SKd); for(let i=0;i<4;i++){ P.rect(56+i*3,31-up+i,3,7-i,SK); P.px(56+i*3,37-up,SKd); } P.rect(14,34-up,12,8,W1);
  // cổ, ngực, sẹo chữ X, dây chuyền
  P.rect(48,56,14,6,SK); P.rect(42,60,26,16,SK); P.rect(50,63,10,1,'#8a2a22'); P.rect(51,64,8,1,'#8a2a22'); for(let i=0;i<6;i++){ P.px(48+i*2,66+i,'#a8302a'); P.px(60-i*2,66+i,'#a8302a'); } P.rect(50,61,10,1,'#3a2a22');
  // áo khoác trắng: vai bồng như mây, cổ vàng, cúc vàng
  for(const [x,y,r] of [[22,62,12],[86,60,12],[14,70,9],[92,70,9],[30,72,10],[80,72,10]]) ell(P,x,y+up,r,Math.round(r*.8),W1);
  P.rect(30,58,14,22,W1); P.rect(66,58,12,22,W1); P.rect(30,58,14,2,W2); P.rect(66,58,12,2,W2); for(const [x,y] of [[34,74],[26,68],[80,74],[88,66]]) P.rect(x,y+up,4,2,W3);
  P.rect(40,56,8,6,Y); P.rect(62,56,8,6,Y); P.rect(40,61,8,1,Yd); P.rect(62,61,8,1,Yd); for(let i=0;i<4;i++) P.rect(38,62+i*4,3,3,Y);
  // tay phải vắt ngang bụng
  P.rect(44,72,26,6,SK); P.rect(44,77,26,1,SKd); for(let i=0;i<3;i++) P.rect(42+i*2,70+i,3,3,SK);
  // đai tím + vạt buông
  P.rect(30,78,50,7,PU); P.rect(30,84,50,1,PUd); P.rect(66,84,9,16,PU); P.rect(68,99,7,3,PU); P.rect(66,84,2,16,PUd); P.rect(74,90,1,10,PUd);
  // quần trắng rộng, chân ngồi xổm, dép
  ell(P,52,92,24,8,W1); P.rect(28,86,48,8,W1); for(const x of [36,48,60]) P.rect(x,88,1,6,W2); P.rect(50,92,4,1,W3);
  P.rect(14,86,16,8,W1); P.rect(76,86,16,8,W1); P.rect(12,93,9,10,SK); P.rect(84,93,9,10,SK); P.rect(12,93,9,1,SKd); P.rect(84,93,9,1,SKd);
  P.rect(8,102,16,3,'#8a5a32'); P.rect(80,102,16,3,'#8a5a32'); P.rect(8,101,16,1,Y); P.rect(80,101,16,1,Y); for(const x of [10,14,18,82,86,90]) P.rect(x,99,2,2,SK);
  if(hit){ g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(255,244,200,.7)'; g.fillRect(0,0,104,108); g.globalCompositeOperation='source-over'; } });
const ICONS12={jewel_bless:P=>{ P.rect(5,2,4,2,'#c8e8ff'); P.rect(3,4,8,6,'#7ab8f0'); P.rect(5,10,4,2,'#5a98d8'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_soul:P=>{ P.rect(5,2,4,2,'#ffe8a0'); P.rect(3,4,8,6,'#f2c43d'); P.rect(5,10,4,2,'#c8901a'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_chaos:P=>{ P.rect(4,2,6,2,'#ff9ad0'); P.rect(2,4,10,6,'#c83a8a'); P.rect(4,10,6,2,'#8a1a5a'); P.rect(4,4,2,3,'#ffd0e8'); P.px(9,7,'#ffd84a'); }};
const oldIcon12=A.icon; A.icon=function(name,scale=1){ const f=ICONS12[name]; if(!f) return oldIcon12(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
})();
