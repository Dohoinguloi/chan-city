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

/* ---------- các khu mới: nghĩa địa '%', bãi phế liệu '&', đồ trang trí ---------- */
A.WALKABLE.add('%'); A.WALKABLE.add('&');
TE['%']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#3a3448'); for(let i=0;i<6;i++){ const h=hash(tx*6+i,ty,131); P.px(X+Math.floor(h*16),Y+Math.floor(hash(tx,ty*5+i,132)*16),h<.4?'#4a4258':h<.7?'#2e2a3a':'#5a4a6a'); } if(hash(tx,ty,133)<.08) P.rect(X+4,Y+9,3,2,'#6a8a5a'); };
TE['&']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#6a6058'); P.rect(X,Y,T,1,'#5a5048'); P.rect(X,Y,1,T,'#5a5048'); if(hash(tx,ty,141)<.25) P.rect(X+3,Y+5,5,2,'#8a5a32'); if(hash(tx,ty,142)<.18) P.px(X+11,Y+10,'#a8a296'); if(hash(tx,ty,143)<.12) P.rect(X+8,Y+3,2,1,'#3a6ad8'); };
A.muTorii=()=>S(64,56,32,54,(g,P)=>{ P.rect(0,4,64,6,'#c8302a'); P.rect(0,4,64,2,'#e8504a'); P.rect(2,0,60,4,'#2a2026'); P.rect(6,14,52,4,'#c8302a'); P.rect(10,10,6,46,'#c8302a'); P.rect(48,10,6,46,'#c8302a'); P.rect(10,10,2,46,'#e8504a'); P.rect(48,10,2,46,'#e8504a');
  P.rect(28,8,8,10,'#2a2026'); P.rect(29,9,6,8,'#f2c43d'); P.rect(8,52,10,4,'#2a2026'); P.rect(46,52,10,4,'#2a2026'); });
A.muPost=()=>S(14,30,7,28,(g,P)=>{ P.rect(3,2,8,26,'#8a5a32'); P.rect(3,2,8,2,'#a8743e'); for(const y of [8,16]) P.rect(2,y,10,2,'#d8c098'); P.rect(1,26,12,2,'#5a3a22'); });
A.muRamen=()=>S(80,42,40,40,(g,P)=>{ P.rect(2,4,76,8,'#f4f2ec'); for(let x=6;x<76;x+=10) P.rect(x,4,6,14,'#c8302a'); P.rect(6,18,2,22,'#5a3a22'); P.rect(72,18,2,22,'#5a3a22'); P.rect(4,26,72,8,'#a8743e'); P.rect(4,26,72,1,'#c8945a');
  for(const x of [16,32,48,62]){ ell(P,x,24,4,2,'#f4f2ec'); P.rect(x-3,22,6,2,'#f2c43d'); } A.text3(P,24,6,'RAMEN','#2a2026'); });
A.muGrave=(v=0)=>S(18,22,9,20,(g,P)=>{ const c=['#8a8494','#7a7486','#9a94a4'][v%3]; P.rect(3,4,12,16,c); ell(P,9,5,6,4,c); P.rect(4,18,10,2,'#5a5468'); if(v%2){ P.rect(8,7,2,8,'#5a5468'); P.rect(6,9,6,2,'#5a5468'); } else { P.rect(6,8,6,1,'#5a5468'); P.rect(6,11,6,1,'#5a5468'); } P.rect(2,20,14,2,'#2e2a3a'); });
A.muDeadTree=()=>S(40,50,20,48,(g,P)=>{ P.rect(17,20,6,28,'#4a3a32'); for(const [x,y,w,d] of [[6,10,12,1],[22,6,12,-1],[10,18,8,1],[24,16,9,-1],[2,4,6,1],[30,2,6,-1]]) for(let i=0;i<w;i++) P.rect(d>0?x+i:x+w-i,y+i,2,2,'#4a3a32'); P.rect(14,46,12,2,'#2e2a3a'); });
A.muGhostLamp=(fr=0)=>S(16,34,8,32,(g,P)=>{ P.rect(7,10,2,22,'#3a3448'); P.rect(3,2,10,10,'#2a2436'); P.rect(4,3,8,8,fr%2?'#c8a0ff':'#9a6ae8'); P.rect(6,5,4,4,'#f4e8ff'); P.rect(4,30,8,2,'#2a2436'); });
A.muCoffin=()=>S(40,22,20,20,(g,P)=>{ P.rect(4,4,32,14,'#5a3a2a'); P.rect(2,8,36,6,'#5a3a2a'); P.rect(6,6,28,10,'#7a4a32'); P.rect(18,7,2,8,'#c8a23a'); P.rect(15,9,8,2,'#c8a23a'); },true);
A.muJunk=(v=0)=>S(44,32,22,30,(g,P)=>{ ell(P,22,22,20,9,'#5a5048'); const c=[['#8a8478','#a8a296','#6a6458'],['#a8743e','#8a5a32','#c8945a'],['#3a6ad8','#8a8478','#c8302a']][v%3];
  for(let i=0;i<7;i++){ const x=6+((i*13)%30), y=10+((i*7)%10); P.rect(x,y,8+(i%3)*2,5,c[i%3]); P.rect(x,y,8+(i%3)*2,1,'#d8d2c6'); } P.rect(16,4,3,10,'#9aa0aa'); P.rect(12,4,12,2,'#c8ccd2'); });
A.muBarrel=()=>S(16,22,8,20,(g,P)=>{ P.rect(2,3,12,17,'#3a6ad8'); P.rect(2,3,12,2,'#5a8ae8'); for(const y of [8,14]) P.rect(2,y,12,1,'#2a4a98'); P.rect(5,9,6,4,'#ffd84a'); P.px(7,10,'#1c1516'); P.px(8,11,'#1c1516'); });
A.muTires=()=>S(26,18,13,16,(g,P)=>{ for(const [x,y] of [[8,12],[18,12],[13,6]]){ ell(P,x,y,6,4,'#26262c'); ell(P,x,y,3,2,'#5a5048'); } });
/* ---------- 4 boss phụ ---------- */
const flash=(g,w,h,hit)=>{ if(!hit) return; g.globalCompositeOperation='source-atop'; g.fillStyle='rgba(255,244,220,.7)'; g.fillRect(0,0,w,h); g.globalCompositeOperation='source-over'; };
// Naruto Cửu Vĩ: bò thấp như cáo, áo khoác chakra đỏ + đuôi uốn cong, tóc vàng dựng, băng đeo trán, đồ cam đen
A.muNaruto=(fr=0,hit=false)=>S(96,76,52,74,(g,P)=>{ const R='#e8304a', Rd='#b81a3a', up=fr%2;
  for(let i=0;i<18;i++){ const k=i/17, x=Math.round(40-Math.sin(k*3.2)*30+k*-4), y=Math.round(66-k*62); ell(P,x,y+up,7-Math.round(k*3),5-Math.round(k*2),R); if(i%4===1) P.rect(x-1,y+up-1,2,2,'#ffd0d8'); }
  ell(P,52,52,36,18,R); for(let i=0;i<8;i++) P.rect(20+i*9,30-((i*5)%9)+up,4,8,R);
  P.rect(30,44,40,16,'#1c1820'); P.rect(30,44,22,8,'#f2802a'); P.rect(52,52,18,8,'#f2802a'); P.rect(40,50,10,2,'#e8e4dc'); P.rect(24,58,14,8,'#f2802a'); P.rect(20,64,10,4,'#2a4ab8'); P.rect(62,60,12,6,'#f2802a');
  ell(P,76,46,10,8,'#f0c090'); for(let i=0;i<6;i++){ P.rect(68+i*3,30-((i%2)*5),3,10,'#ffd84a'); } P.rect(68,36,20,6,'#ffd84a'); P.rect(68,40,18,3,'#2a4ab8'); P.rect(74,40,6,3,'#c8ccd2'); P.rect(75,41,4,1,'#5a5a68');
  P.rect(78,45,4,2,'#c8302a'); P.rect(72,46,3,1,'#1c1516'); for(const y of [49,51]) P.rect(80,y,4,1,'#8a4a2a'); P.rect(74,52,6,2,'#1c1516'); P.rect(62,64,10,6,'#f0c090'); P.rect(80,62,10,6,'#f0c090'); flash(g,96,76,hit); });
// Quỷ Cưa: chó cam ngồi, lưỡi cưa trắng mọc trên đầu, tai đen, 1 mắt tròn, đuôi có dây giật
A.muCuaMay=(fr=0,hit=false)=>S(64,60,32,58,(g,P)=>{ const O='#f2802a', Od='#d8601a', up=fr%2;
  for(let i=0;i<7;i++){ P.rect(8+i*3,4+i*3-up,8,6,'#f4f4f2'); P.rect(8+i*3,4+i*3-up,8,1,'#c8ccd2'); } for(let i=0;i<8;i++) P.px(6+i*3,8+i*3-up,'#1c1516');
  ell(P,32,38,22,18,O); P.rect(12,30,40,22,O); P.rect(42,18,10,8,'#1c1516'); P.rect(46,16,6,4,'#f4f4f2'); ell(P,40,30,5,5,'#f4f4f2'); P.rect(39,29,3,3,'#1c1516'); P.rect(22,30,6,2,'#1c1516'); P.rect(26,33,4,2,'#1c1516');
  for(const [x,y] of [[16,44],[30,46],[44,36]]) P.rect(x,y,3,4,'#c8302a'); P.rect(10,48,46,6,Od); P.rect(28,52,10,4,O); P.rect(40,44,8,2,'#1c1516');
  P.rect(52,52,10,2,'#c8ccd2'); P.rect(58,49,4,8,'#f4f4f2'); flash(g,64,60,hit); });
// Dươngg Vũ (bóng ma tím): thân tròn gai, mắt đỏ híp, miệng cười nhe răng trắng, lơ lửng (fr: nảy)
A.muGengar=(fr=0,hit=false)=>S(72,72,36,68,(g,P)=>{ const B='#7a5ab8', Bd='#5a3a98', Bl='#9a7ad8', up=fr%2*2;
  ell(P,36,38-up,26,24,B); ell(P,32,34-up,18,16,Bl); for(const [x,y,w] of [[12,10,6],[22,6,6],[34,8,6],[48,6,6],[58,10,6],[8,30,6],[64,32,6],[10,48,5],[62,48,5]]){ P.rect(x,y-up,w,10,B); P.rect(x+1,y-up-3,w-2,4,Bd); }
  for(const [x] of [[18],[50]]){ ell(P,x,34-up,6,3,'#ff9ab8'); P.rect(x-2,33-up,4,2,'#c8302a'); } P.rect(14,30-up,10,2,Bd); P.rect(46,30-up,10,2,Bd);
  ell(P,36,48-up,18,6,'#2a1a4a'); P.rect(20,45-up,32,4,'#ffffff'); for(let x=22;x<52;x+=5) P.rect(x,45-up,1,4,'#c8c0d8'); P.rect(24,50-up,24,2,'#ffffff');
  P.rect(16,58-up,10,8,Bd); P.rect(44,58-up,10,8,Bd); flash(g,72,72,hit); });
// Rồng Dải Xanh: thân rắn dài xanh lục cuộn tròn, đầu ngẩng có sừng vây, vân vàng, miệng đỏ (fr: thở)
A.muRong=(fr=0,hit=false)=>S(112,104,56,102,(g,P)=>{ const G='#3aa85a', Gd='#1a6a3a', Gl='#6ad88a', Y='#f2c43d', up=fr%2;
  for(let i=0;i<26;i++){ const k=i/25, a=k*Math.PI*2.4, x=Math.round(56+Math.cos(a)*(34-k*14)), y=Math.round(84-Math.sin(a)*(10+k*6)-k*30); ell(P,x,y,8,6,G); P.rect(x-3,y+3,6,2,Gd); if(i%4===0) P.rect(x-2,y-4,4,2,Y); if(i%6===3) P.rect(x-1,y-5,3,2,'#e8302a'); }
  ell(P,34,36-up,15,10,G); P.rect(18,38-up,18,8,G); ell(P,22,44-up,10,5,'#e86a6a'); P.rect(14,42-up,10,3,'#f4f4f2'); P.rect(28,30-up,6,4,Y); P.rect(30,31-up,3,2,'#c8302a');
  for(const [x,y,l] of [[38,26,22],[46,30,18]]) for(let i=0;i<l;i++) P.rect(x+i,y-i-up,3,3,i%5===0?Y:G); P.rect(44,40-up,10,4,Gl); for(const x of [40,48,56]) P.rect(x,48-up,4,6,G); flash(g,112,104,hit); });
A.muBossSprite=(sprite,fr,hit)=>sprite==='naruto'?A.muNaruto(fr,hit):sprite==='cuamay'?A.muCuaMay(fr,hit):sprite==='gengar'?A.muGengar(fr,hit):sprite==='rong'?A.muRong(fr,hit):A.muBoss(fr,hit);
const FRUIT_ICON=(col,sw)=>P=>{ P.disc(7,8,5,col); for(let i=0;i<4;i++){ P.px(4+i*2,6+(i%2),sw); P.px(5+i*2,9+(i%2),sw); } P.rect(7,1,2,3,'#3a8a3a'); P.rect(9,1,3,2,'#5fae46'); P.px(5,5,'#ffffff'); };
const ICONS12={fruit_mera:FRUIT_ICON('#ff6a2a','#ffd84a'),fruit_hie:FRUIT_ICON('#7fd8f0','#ffffff'),fruit_goro:FRUIT_ICON('#f2c43d','#ffffff'),fruit_gomu:FRUIT_ICON('#a83ad8','#e8c0ff'),fruit_yami:FRUIT_ICON('#3a2a5a','#8a6ad8'),fruit_chiyu:FRUIT_ICON('#5fe06a','#d8ffd8'),
  kunai:P=>{ for(let i=0;i<7;i++) P.rect(3+i,10-i,2,2,'#c8ccd2'); P.rect(9,2,3,3,'#e8ecef'); P.rect(1,11,4,2,'#3a3448'); P.disc(2,12,1,'#c8ccd2'); },
  chainsaw:P=>{ P.rect(2,6,10,4,'#c8ccd2'); for(let x=2;x<12;x+=2) P.px(x,5,'#5a5a68'); P.rect(10,5,4,6,'#f2802a'); P.rect(12,10,2,3,'#1c1820'); },
  scythe:P=>{ P.rect(7,2,2,12,'#5a3a22'); for(let i=0;i<7;i++) P.rect(1+i,2+Math.round(i*.5),2,2,'#c8c0d8'); P.px(1,3,'#ffffff'); },
  spear:P=>{ for(let i=0;i<10;i++) P.px(2+i,12-i,'#8a5a32'); P.rect(10,1,3,3,'#3aa85a'); P.px(12,1,'#ffffff'); },
  scroll:P=>{ P.rect(3,4,8,7,'#f4e8c8'); P.rect(2,3,2,9,'#c8302a'); P.rect(10,3,2,9,'#c8302a'); P.rect(5,6,4,1,'#5a3a22'); P.rect(5,8,4,1,'#5a3a22'); },
  jambread:P=>{ P.rect(2,4,10,8,'#e8b878'); P.rect(3,5,8,6,'#f4d8a0'); P.rect(4,6,6,4,'#c8302a'); P.px(5,7,'#ff7a7a'); },
  ghostfire:P=>{ P.disc(7,9,4,'#9a6ae8'); P.rect(6,2,3,5,'#c8a0ff'); P.disc(7,9,2,'#f4e8ff'); },
  scale:P=>{ P.rect(4,3,6,8,'#3aa85a'); P.rect(5,2,4,1,'#6ad88a'); P.rect(5,11,4,1,'#1a6a3a'); P.rect(6,4,1,6,'#f2c43d'); },
  jewel_bless:P=>{ P.rect(5,2,4,2,'#c8e8ff'); P.rect(3,4,8,6,'#7ab8f0'); P.rect(5,10,4,2,'#5a98d8'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_soul:P=>{ P.rect(5,2,4,2,'#ffe8a0'); P.rect(3,4,8,6,'#f2c43d'); P.rect(5,10,4,2,'#c8901a'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_chaos:P=>{ P.rect(4,2,6,2,'#ff9ad0'); P.rect(2,4,10,6,'#c83a8a'); P.rect(4,10,6,2,'#8a1a5a'); P.rect(4,4,2,3,'#ffd0e8'); P.px(9,7,'#ffd84a'); }};
const oldIcon12=A.icon; A.icon=function(name,scale=1){ const f=ICONS12[name]; if(!f) return oldIcon12(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
})();
