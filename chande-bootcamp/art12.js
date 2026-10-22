/* MU Online · Lục Địa Cát: quảng trường lát đá '9', tường thành đá xám '0', đài phun nước, đền triệu hồi phía Bắc (vòng phù chú đỏ),
   cột đuốc lửa, cờ các class, quầy Pháp sư; Quỷ Vương Bóng Đêm (boss lớn, cánh dơi, sừng, mắt đỏ, 2 khung thở); icon 3 loại ngọc. */
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
// Quỷ Vương Bóng Đêm: thân tím đen cao ~80px, cánh dơi, 2 sừng cong, mắt đỏ rực, móng vuốt; fr: thở / gồng
A.muBoss=(fr=0,hit=false)=>S(110,96,55,94,(g,P)=>{ const B=hit?'#f4f2ec':'#3a2448', Bd=hit?'#e8e0f0':'#26162e', W2=hit?'#f4f2ec':'#4a2a5a', up=fr%2;
  for(const side of [-1,1]){ for(let i=0;i<5;i++){ const x=55+side*(20+i*7), y=18+i*4-up; P.rect(Math.min(x,x+side*7),y,8,30-i*4,W2); P.rect(Math.min(x,x+side*7),y,8,2,Bd); } }
  ell(P,55,58-up,20,26,B); ell(P,55,64-up,13,16,Bd); ell(P,55,26-up,14,12,B); for(const [x,d] of [[44,-1],[64,1]]){ P.rect(x,10-up,3,8,'#c8c0b0'); P.rect(x+d*2,6-up,3,5,'#c8c0b0'); P.rect(x+d*4,3-up,2,4,'#e8e0d0'); }
  P.rect(46,22-up,6,4,hit?'#ffb0b0':'#ff2a2a'); P.rect(58,22-up,6,4,hit?'#ffb0b0':'#ff2a2a'); P.rect(47,23-up,2,2,'#ffd84a'); P.rect(59,23-up,2,2,'#ffd84a'); P.rect(49,31-up,12,3,'#120a16'); for(let x=50;x<60;x+=3) P.rect(x,31-up,1,2,WH);
  for(const x of [30,72]){ P.rect(x,48-up,8,20,B); for(let k=0;k<3;k++) P.rect(x+k*3,68-up,2,4,'#e8e0d0'); } P.rect(40,82,10,12,Bd); P.rect(60,82,10,12,Bd); P.rect(38,92,14,2,'#120a16'); P.rect(58,92,14,2,'#120a16'); });
const ICONS12={jewel_bless:P=>{ P.rect(5,2,4,2,'#c8e8ff'); P.rect(3,4,8,6,'#7ab8f0'); P.rect(5,10,4,2,'#5a98d8'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_soul:P=>{ P.rect(5,2,4,2,'#ffe8a0'); P.rect(3,4,8,6,'#f2c43d'); P.rect(5,10,4,2,'#c8901a'); P.rect(5,4,2,3,'#ffffff'); },
  jewel_chaos:P=>{ P.rect(4,2,6,2,'#ff9ad0'); P.rect(2,4,10,6,'#c83a8a'); P.rect(4,10,6,2,'#8a1a5a'); P.rect(4,4,2,3,'#ffd0e8'); P.px(9,7,'#ffd84a'); }};
const oldIcon12=A.icon; A.icon=function(name,scale=1){ const f=ICONS12[name]; if(!f) return oldIcon12(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
})();
