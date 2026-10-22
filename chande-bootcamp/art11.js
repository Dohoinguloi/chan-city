/* Lavi Studio (TP.HCM): studio thiết kế tông kem + tím lilac. Sàn gỗ sồi sáng '7', tường trắng viền lilac '8'. Tường chữ "Aa" có vạch kerning,
   bảng lưới 12 cột, kệ sách mẫu chữ, góc vibe code (laptop chạy code, đèn LED đổi màu), màn chiếu landing page, bàn iMac trắng,
   ổ nằm + bát ăn cho 2 bé cún: Gấu (Alaskan đen-vàng lông xù, áo sơ mi caro trắng xám) và Luna (Golden kem, váy caro bèo, nơ trắng). */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), t3=(...a)=>A.text3(...a);
const {ell,eye}=A.lcKit, K='#1c1516', WH='#ffffff', LIL='#b8a0e8', LILD='#8a6ac8';
A.WALKABLE.add('7');
TE['7']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#e8d4b0'); for(let r=0;r<T;r+=4){ P.rect(X,Y+r,T,1,'#d8c098'); const o=((ty*4+r)/4+tx)%3*5; P.rect(X+o,Y+r,1,4,'#d8c098'); } if(hash(tx,ty,111)<.15) P.rect(X+4,Y+7,3,1,'#cdb48a'); };
TE['8']=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1); if(below==='7'){ P.rect(X,Y,T,T,'#f6f2ea'); P.rect(X,Y+10,T,2,LIL); P.rect(X,Y+12,T,4,'#e8e0f0'); } else { P.rect(X,Y,T,T,'#2a2436'); P.rect(X,Y,T,1,'#3a3448'); } };
// logo Lavi theo mẫu: chữ trắng trên nền đen · L có chân serif + đuôi uốn, a serif, v ghép từ các ô pixel bậc thang, i viết tay nghiêng có chấm
A.laviLogo=(P,ox,oy,c=WH)=>{ P.rect(ox+4,oy+2,7,1,c); P.rect(ox+6,oy+2,3,17,c); P.rect(ox+5,oy+3,1,2,c); P.rect(ox+3,oy+19,12,2,c); P.rect(ox+14,oy+17,1,2,c); P.rect(ox+1,oy+20,2,2,c); P.px(ox+2,oy+22,c);
  P.rect(ox+17,oy+10,7,2,c); P.px(ox+16,oy+11,c); P.rect(ox+23,oy+11,2,10,c); P.rect(ox+25,oy+20,1,1,c); for(const [y,a,b] of [[14,18,23],[15,17,18],[16,17,18],[17,17,18],[18,17,18],[19,18,23],[20,19,22]]) P.rect(ox+a,oy+y,b-a+1,1,c); P.rect(ox+19,oy+15,4,1,c);
  for(const [x,y] of [[28,10],[30,13],[32,16],[34,18],[36,16],[38,13],[40,10]]) P.rect(ox+x,oy+y,3,3,c);
  for(const [x,y,w] of [[48,10,2],[47,12,2],[46,14,2],[45,16,2],[45,18,2],[46,20,3]]) P.rect(ox+x,oy+y,w,2,c); P.rect(ox+49,oy+19,2,1,c); P.disc(ox+50,oy+6,1,c); };
A.laviSign=()=>S(62,26,31,25,(g,P)=>{ P.rect(0,0,62,24,'#0c0c0e'); A.laviLogo(P,4,1); P.rect(0,24,2,2,'#3a3448'); P.rect(60,24,2,2,'#3a3448'); });
// tường chữ: "Aa" lớn, vạch kerning đỏ giữa các chữ L A V I
A.typeWall=()=>S(64,30,32,29,(g,P)=>{ P.rect(0,0,64,28,'#fbf8f2'); P.rect(0,0,64,1,'#d8d0e8'); P.rect(2,2,26,24,'#f0e8ff');
  P.rect(5,22,4,2,K); P.rect(7,6,3,16,K); P.rect(10,6,3,16,K); P.rect(13,22,4,2,K); P.rect(8,4,4,3,K); P.rect(8,14,5,2,K); ell(P,21,18,4,4,K); P.rect(24,13,2,9,K); ell(P,21,18,2,2,'#f0e8ff');
  t3(P,32,6,'L A V I',K); for(const x of [36,40,44]) P.rect(x,4,1,9,'#ff4a5a'); P.rect(32,15,28,1,'#c8c0d8'); for(let i=0;i<6;i++) P.rect(32+i*5,18,3,6,i%2?'#d8d0e8':LIL); P.rect(31,26,30,1,'#c8c0d8'); });
A.gridBoard=()=>S(56,30,28,29,(g,P)=>{ P.rect(0,0,56,28,'#26222e'); P.rect(2,2,52,24,'#fbf8f2'); for(let i=0;i<12;i++) P.rect(4+i*4,3,3,22,i%2?'rgba(184,160,232,.35)':'rgba(184,160,232,.2)');
  P.rect(4,4,47,4,'#2a2436'); P.rect(4,10,23,8,LIL); P.rect(28,10,23,3,'#c8c0d8'); P.rect(28,14,23,1,'#c8c0d8'); P.rect(28,16,18,1,'#c8c0d8'); P.rect(4,20,15,4,'#ffd84a'); P.rect(20,20,15,4,'#8ad0c0'); P.rect(36,20,15,4,'#ff9ab8'); });
A.specimenShelf=()=>S(44,46,22,44,(g,P)=>{ P.rect(0,0,44,44,'#c8a878'); P.rect(2,2,40,40,'#f4ecdc'); for(const y of [14,28]) P.rect(2,y,40,2,'#a8885a');
  const cols=['#2a2436',LIL,'#ffd84a','#ff7a5a','#8ad0c0','#f2f2f0','#5a7ad8','#2a2436']; for(let s=0;s<3;s++) for(let i=0;i<8;i++){ const x=4+i*5, h=9+((i+s)%3), y=2+s*14+(12-h); P.rect(x,y,4,h,cols[(i+s*3)%8]); P.px(x+1,y+2,(i+s)%2?'#ffffff':K); } });
// góc vibe code: laptop mở code + bàn phím cơ + đèn LED dải đổi màu (fr)
A.vibeDesk=(fr=0)=>S(50,34,25,31,(g,P)=>{ P.rect(2,17,46,5,'#3a3448'); P.rect(2,17,46,1,'#5a5068'); P.rect(4,22,2,10,'#2a2436'); P.rect(44,22,2,10,'#2a2436');
  const led=['#ff4a8a','#b8a0e8','#4ab0ff','#5fe06a','#ffd84a'][fr%5]; P.rect(2,21,46,1,led); P.rect(10,3,22,13,'#16141c'); P.rect(11,4,20,10,'#1e1a2a');
  for(let i=0;i<5;i++) P.rect(12+(i%2)*2,5+i*2,6+((i*5+fr)%9),1,['#c792ea','#82aaff','#c3e88d','#ffcb6b','#f78c6c'][i]); P.rect(12+((fr*3)%14),13,2,1,WH); P.rect(8,16,26,1,'#9aa0aa');
  P.rect(35,14,10,3,'#2a2436'); for(let i=0;i<4;i++) P.px(36+i*2,15,led); P.rect(38,8,5,6,'#f2f2f0'); P.rect(39,9,3,2,'#c8a878'); });
A.laviScreen=(fr=0)=>S(60,40,30,38,(g,P)=>{ P.rect(0,0,60,34,'#16141c'); P.rect(2,2,56,30,'#fbf8f2'); P.rect(2,2,56,6,'#0c0c0e'); t3(P,6,4,'LAVI','#ffffff');
  P.rect(6,11,24,4,K); P.rect(6,17,18,2,'#9a94a8'); P.rect(6,21,10,4,LIL); ell(P,44,19,9,8,['#ffd84a','#ff9ab8','#8ad0c0'][fr%3]); P.rect(28,34,4,6,'#3a3448'); P.rect(20,38,20,2,'#3a3448'); });
A.imacDesk=(v=0)=>S(42,32,21,29,(g,P)=>{ P.rect(2,16,38,4,'#f4f2ec'); P.rect(2,16,38,1,'#ffffff'); P.rect(4,20,2,10,'#c8ccd2'); P.rect(36,20,2,10,'#c8ccd2');
  P.rect(11,1,20,13,'#e8ecef'); P.rect(12,2,18,10,['#b8a0e8','#ffd84a','#8ad0c0'][v%3]); P.rect(13,3,8,1,WH); P.rect(13,5,12,4,'rgba(255,255,255,.55)'); P.rect(20,14,2,2,'#c8ccd2'); P.rect(16,16,10,1,'#c8ccd2'); P.rect(32,14,4,2,'#e8ecef'); });
A.dogBed=(c='#b8a0e8')=>S(30,16,15,14,(g,P)=>{ ell(P,15,9,13,6,c); ell(P,15,9,10,4,'#fbf8f2'); for(let x=6;x<25;x+=4) P.px(x,7,'#e8e0f0'); },true);
A.dogBowl=()=>S(16,10,8,9,(g,P)=>{ ell(P,8,6,7,3,'#ff7a8a'); ell(P,8,5,5,2,'#c8402a'); for(const x of [5,8,11]) P.px(x,4,'#a8743e'); P.rect(4,2,1,1,WH); });
// 2 bé cún (fr: vẫy đuôi)
function gingham(P,x0,y0,w,h,a,b){ for(let y=0;y<h;y++) for(let x=0;x<w;x++) P.px(x0+x,y0+y,((x>>1)+(y>>1))%2?a:b); }
A.beMuc=(fr=0)=>S(30,26,15,25,(g,P)=>{ const B='#2a2226', T2='#c8945a', W2='#f4efe6';
  ell(P,16,16,9,6,B); gingham(P,9,11,15,8,'#e8ecef','#a8b0b8'); P.rect(9,11,15,1,'#f4f4f2'); P.rect(15,11,1,8,'#f4f4f2'); P.px(15,13,'#c8ccd2'); P.px(15,16,'#c8ccd2');
  ell(P,8,10,6,5,B); ell(P,7,12,4,3,W2); ell(P,7,9,2,2,W2); P.rect(3,3,3,4,B); P.rect(10,3,3,4,B); P.px(4,4,T2); P.px(11,4,T2); eye(P,5,8); eye(P,9,8); P.rect(5,13,3,1,K); P.px(6,12,K);
  P.rect(9,21,3,4,B); P.rect(19,21,3,4,B); P.rect(9,24,3,1,W2); P.rect(19,24,3,1,W2); for(let i=0;i<4;i++) P.rect(24+(fr?i%2:0),8+i*2-(fr?1:0),3,3,i===3?W2:B); P.rect(13,21,2,3,T2); });
A.beBo=(fr=0)=>S(30,26,15,25,(g,P)=>{ const B='#f0d8a8', Bd='#d8b480';
  ell(P,16,15,8,6,B); gingham(P,10,12,14,6,'#f4f4f2','#d8dce4'); for(let x=10;x<25;x+=2){ P.px(x,18,'#ffffff'); P.px(x+1,19,'#ffffff'); } P.rect(10,18,15,1,'#e8ecef');
  ell(P,8,10,6,5,B); ell(P,4,12,3,3,'#f8e8c8'); P.rect(2,8,4,7,Bd); P.rect(12,8,3,6,Bd); eye(P,6,9); eye(P,10,9); P.rect(3,11,2,2,K); P.rect(4,14,3,1,'#c86a7a');
  P.rect(7,3,7,3,'#ffffff'); P.rect(9,4,3,1,'#e8dce0'); P.px(6,4,'#ffffff'); P.px(14,4,'#ffffff');
  P.rect(10,21,3,4,B); P.rect(19,21,3,4,B); for(let i=0;i<4;i++) P.rect(24+(fr?(i%2):0),9+i*2-(fr?1:0),3,3,i===3?'#f8e8c8':B); });
const ICONS11={zentoken:P=>{ P.rect(5,1,4,2,'#7a9a6a'); P.rect(3,3,8,7,'#7a9a6a'); P.rect(5,10,4,2,'#7a9a6a'); P.rect(5,3,4,7,'#a8d898'); P.px(6,4,'#ffffff'); P.rect(6,6,2,2,'#2a2436'); },
  bone:P=>{ P.rect(3,6,8,2,'#f4efe6'); P.disc(3,5,2,'#f4efe6'); P.disc(3,8,2,'#f4efe6'); P.disc(11,5,2,'#f4efe6'); P.disc(11,8,2,'#f4efe6'); P.rect(4,6,6,1,'#d8d0c0'); },
  bow:P=>{ P.rect(2,4,4,6,'#ffffff'); P.rect(8,4,4,6,'#ffffff'); P.rect(6,5,2,4,'#e8dce0'); P.rect(3,6,2,2,'#e8dce0'); P.rect(9,6,2,2,'#e8dce0'); }};
const oldIcon11=A.icon; A.icon=function(name,scale=1){ const f=ICONS11[name]; if(!f) return oldIcon11(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
})();
