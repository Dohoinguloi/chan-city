/* 3 map mới, vẽ tay từng pixel:
   · Bearplus Studio (Khánh Hội, Q.4, TP.HCM): sàn gỗ xương cá 'a', tường gạch sơn trắng chân đen 'i', biển neon "bear+",
     bàn iMac, trạm render 3D, góc motion, tường moodboard, tủ giải Awwwards / FWA / CSSDA, phòng họp kính, quầy cà phê,
     linh vật Bé Gấu, ghế lười, cửa sổ nhìn sông Sài Gòn (Bitexco, Landmark 81, cầu Khánh Hội).
   · VNPT điểm giao dịch (Hà Nội): sàn gạch bóng 'l', tường trắng viền xanh 'r', logo, quầy giao dịch, bảng số LED, máy lấy số,
     ghế chờ, tủ SIM số đẹp, tủ máy chủ nhấp nháy, bàn tổng đài, standee gói cước.
   · Miếu ông Trường Con (Hải Phòng): sân gạch đỏ 's', ao sen 'u', đường đá xanh 'v', miếu mái cong lưỡng long chầu nguyệt,
     lư hương đồng, mâm ngũ quả, ống xăm, cây đa buộc dải lụa, rùa đội bia, cổng tam quan treo đèn lồng, cờ ngũ sắc, sen,
     xe bánh đa cua, ghế nhựa, chân máy quay TikTok. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);

/* ---------- chữ pixel 3×5 (in hoa, số) dùng cho biển, bảng ---------- */
const F3={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
  I:'111010010010111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',
  S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',
  0:'111101101101111',1:'010110010010111',2:'110001010100111',3:'110001010001110',4:'101101111001001',5:'111100110001110',6:'011100110101010',7:'111001010010010',8:'010101010101010',9:'010101011001110',
  '+':'000010111010000','.':'000000000000010','-':'000000111000000',' ':'000000000000000','/':'001001010100100',':':'000010000010000'};
function text3(P,x,y,s,c,k=1){ for(const ch of s.toUpperCase()){ const m=F3[ch]||F3[' ']; for(let i=0;i<15;i++) if(m[i]==='1') P.rect(x+(i%3)*k,y+Math.floor(i/3)*k,k,k,c); x+=4*k; } return x; }
const w3=(s,k=1)=>s.length*4*k-k;

/* ================= BEARPLUS ================= */
// logo Bearplus: đầu gấu hình học trắng trên nền đen (toạ độ gốc khung 512), 2 nét mắt gãy khúc tách má với mõm, mũi tam giác khoét
const BEAR_OUT=[[105,127],[135,135],[258,116],[380,135],[410,125],[440,170],[418,290],[378,348],[334,348],[302,395],[214,395],[182,348],[138,348],[98,290],[75,170]];
const BEAR_EYE=[[[214,248],[140,232],[128,278],[162,284],[192,332],[184,352]],[[302,248],[376,232],[388,278],[354,284],[324,332],[332,352]]];
const BEAR_NOSE=[[228,350],[290,350],[259,390]];
function inPoly(x,y,pts){ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
function segD(x,y,[ax,ay],[bx,by]){ const dx=bx-ax, dy=by-ay, k=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy))); return Math.hypot(x-ax-k*dx,y-ay-k*dy); }
function bearMark(P,X,Y,w,col='#f2f2f0'){ const s=w/372, h=Math.round(284*s), hw=Math.max(12,.75/s);
  for(let py=0;py<h;py++) for(let px=0;px<w;px++){ const x=72+(px+.5)/s, y=113+(py+.5)/s; if(!inPoly(x,y,BEAR_OUT)||inPoly(x,y,BEAR_NOSE)) continue;
    let cut=false; for(const L of BEAR_EYE){ for(let i=0;i<L.length-1;i++) if(segD(x,y,L[i],L[i+1])<hw){ cut=true; break; } if(cut) break; } if(!cut) P.px(X+px,Y+py,col); }
  return h; }
A.WALKABLE.add('a');
// sàn gỗ sồi lát xương cá: mỗi ô 4 khối 8×8, khối chẵn ván ngang, khối lẻ ván dọc
TE.a=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#c99a64');
  for(let by=0;by<2;by++) for(let bx=0;bx<2;bx++){ const x0=X+bx*8, y0=Y+by*8, hor=(tx*2+bx+ty*2+by)%2===0;
    if(hor){ for(let r=0;r<8;r+=4){ P.rect(x0,y0+r,8,1,'#b0804c'); if(hash(tx*7+bx,ty*5+by+r,3)<.5) P.rect(x0+2,y0+r+2,3,1,'#d6aa72'); } }
    else { for(let c=0;c<8;c+=4){ P.rect(x0+c,y0,1,8,'#b0804c'); if(hash(tx*3+bx+c,ty*9+by,4)<.5) P.rect(x0+c+2,y0+3,1,3,'#d6aa72'); } } }
  if(hash(tx,ty,91)<.1) P.px(X+5,Y+11,'#e6bf88'); };
// tường gạch sơn trắng chân đen (mặt tường), đỉnh tường xám than
TE.i=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1);
  if(below&&below!=='i'&&A.WALKABLE.has(below)){ P.rect(X,Y,T,T,'#f2efe8');
    for(let r=0;r<12;r+=4){ P.rect(X,Y+r+3,T,1,'#ddd7cc'); const off=(r/4+ty)%2?4:0; for(let c=off;c<T;c+=8) P.rect(X+c,Y+r,1,3,'#ddd7cc'); }
    P.rect(X,Y,T,1,'#ffffff'); P.rect(X,Y+12,T,4,'#26262c'); P.rect(X,Y+12,T,1,'#3a3a42'); if(hash(tx,ty,93)<.2) P.px(X+6,Y+5,'#e8e2d6'); }
  else { P.rect(X,Y,T,T,'#2e2e34'); P.rect(X,Y,T,1,'#46464e'); P.rect(X,Y+T-1,T,1,'#202024'); } };

// neon "bear+" hồng trên tấm nền than, có quầng sáng
const NEON={b:['10000','10000','11110','10001','10001','10001','11110'],e:['00000','00000','01110','10001','11111','10000','01110'],a:['00000','00000','01110','00001','01111','10001','01111'],
  r:['00000','00000','10110','11001','10000','10000','10000'],'+':['00000','00100','00100','11111','00100','00100','00000']};
const bpNeon=()=>S(76,26,38,24,(g,P)=>{ P.rect(0,1,76,23,'#0e0e10'); P.rect(1,2,74,21,'#141416'); P.rect(1,2,74,1,'#2a2a2e');
  bearMark(P,4,4,24,'#4a4a52'); bearMark(P,4,3,24); text3(P,32,8,'BEARPLUS','#f2f2f0'); P.rect(32,15,39,1,'#3a3a40'); text3(P,32,17,'STUDIO','#8a8a94'); P.rect(3,23,2,2,'#555'); P.rect(71,23,2,2,'#555'); });

// bàn làm việc trắng + iMac (màn hình khác nhau theo v: Figma, code, brand board)
const bpDesk=(v=0)=>S(42,34,21,31,(g,P)=>{ P.rect(2,18,38,5,'#f4f4f2'); P.rect(2,18,38,1,'#ffffff'); P.rect(2,22,38,1,'#cfcfca'); P.rect(4,23,2,10,'#26262c'); P.rect(36,23,2,10,'#26262c');
  P.rect(11,1,20,14,'#d3d7dc'); P.rect(12,2,18,11,'#1e1e24'); P.rect(19,15,4,3,'#c2c6cb'); P.rect(16,17,10,1,'#b4b8bd');
  if(v%3===0){ P.rect(12,2,4,11,'#2a2a32'); for(let y=3;y<12;y+=2) P.rect(13,y,2,1,'#5a5a66'); P.rect(17,3,6,5,'#ff5fa8'); P.rect(24,3,5,3,'#7fd0ff'); P.rect(24,7,5,5,'#ffd84a'); P.rect(17,9,6,3,'#f4f4f2'); P.px(20,5,'#ffffff'); }
  else if(v%3===1){ for(let y=3;y<12;y++){ const w=2+((y*5+v)%9); P.rect(13+((y%3)?2:0),y,w,1,['#7fd0ff','#ffd84a','#c792ea','#9fe08a'][y%4]); } }
  else { P.rect(13,3,16,9,'#f4efe6'); P.disc(17,7,2,'#ff5fa8'); P.rect(21,4,7,1,'#26262c'); P.rect(21,6,5,1,'#8a8a94'); for(const [i,c] of ['#ff5fa8','#26262c','#ffd84a','#7fd0ff'].entries()) P.rect(21+i*2,9,2,2,c); }
  P.rect(15,19,12,2,'#e9e9e6'); P.rect(15,19,12,1,'#ffffff'); P.rect(29,19,3,2,'#e0e0dc');
  if(v%2===0){ P.rect(33,15,4,4,'#ff6a3a'); P.px(37,16,'#ff6a3a'); P.rect(33,15,4,1,'#ff9a6a'); } else { P.rect(4,13,5,5,'#a0643a'); P.disc(6,10,3,'#4a9a52'); P.px(5,9,'#7fd08a'); } });
const meshChair=(c='#26262c')=>S(18,22,9,20,(g,P)=>{ P.rect(4,1,10,10,c); for(let y=2;y<10;y+=2) P.rect(5,y,8,1,'#3a3a44'); P.rect(3,11,12,4,'#34343c'); P.rect(8,15,2,4,'#5a5a66'); P.rect(4,19,10,1,'#5a5a66'); P.px(3,20,'#1c1c20'); P.px(14,20,'#1c1c20'); });

// tường moodboard: bảng bần, ảnh tham khảo, mẫu màu, giấy nhớ, chỉ đỏ nối ý tưởng
const moodWall=()=>S(100,36,50,34,(g,P)=>{ P.rect(0,2,100,32,'#7a5434'); P.rect(2,4,96,28,'#c9a06a');
  for(let i=0;i<120;i++){ const x=2+Math.floor(hash(i,1,7)*96), y=4+Math.floor(hash(i,2,7)*28); P.px(x,y,hash(i,3,7)<.5?'#b88e58':'#d8b47c'); }
  const cards=[[6,7,16,11,'#3a4a6a'],[25,6,12,15,'#f4f4f2'],[40,8,14,10,'#ff5fa8'],[57,6,16,12,'#26262c'],[76,7,18,11,'#7fd0ff'],[8,21,12,9,'#ffd84a'],[44,21,15,9,'#9fe08a'],[78,21,14,9,'#f4efe6']];
  for(const [x,y,w,h,c] of cards){ P.rect(x+1,y+1,w,h,'rgba(0,0,0,.25)'); P.rect(x,y,w,h,c); P.rect(x,y,w,1,'rgba(255,255,255,.35)'); }
  P.disc(14,12,3,'#ffd84a'); P.rect(8,15,12,2,'#6a8a5a'); P.rect(27,9,8,8,'#c8b8a8'); P.rect(29,11,4,4,'#8a6a5a'); P.rect(59,8,12,8,'#ff5fa8'); P.rect(61,10,8,4,'#26262c');
  text3(P,78,10,'B+','#26262c',2); for(let i=0;i<4;i++) P.rect(46+i*3,23,2,5,['#26262c','#ff5fa8','#7fd0ff','#ffd84a'][i]);
  for(const [x,y] of [[24,26],[26,26],[28,26]]) P.rect(x,y,1,1,'#4a3a2a'); P.rect(22,22,14,8,'#fff27a'); for(let y=24;y<29;y+=2) P.rect(24,y,10,1,'#8a7a3a');
  for(const [x,y] of [[13,7],[31,6],[47,8],[65,6],[85,7],[14,21],[51,21],[85,21]]){ P.px(x,y,'#d23a2e'); P.px(x,y-1,'#ff6a5a'); }
  for(let t=0;t<=1;t+=.04){ P.px(Math.round(31+(47-31)*t),Math.round(6+Math.sin(t*Math.PI)*6+(8-6)*t),'#d23a2e'); P.px(Math.round(65+(85-65)*t),Math.round(6+Math.sin(t*Math.PI)*5+t),'#d23a2e'); } });

// trạm render 3D: case kính quạt RGB (fr đổi màu), 2 màn: lưới khung gấu 3D + thanh tiến độ render
const renderStation=(fr=0)=>S(60,42,30,39,(g,P)=>{ P.rect(2,22,56,5,'#2a2a30'); P.rect(2,22,56,1,'#44444c'); P.rect(4,27,2,13,'#1c1c20'); P.rect(54,27,2,13,'#1c1c20');
  P.rect(44,6,12,16,'#1c1c22'); P.rect(45,7,10,14,'#2c3a46'); const hue=['#ff5fa8','#7fd0ff','#9fe08a','#ffd84a'];
  for(const [i,y] of [10,15].entries()){ P.disc(50,y,2,hue[(fr+i)%4]); P.px(50,y,'#ffffff'); } P.rect(45,19,10,1,hue[(fr+2)%4]);
  P.rect(4,2,20,15,'#18181c'); P.rect(5,3,18,12,'#0e1218'); P.rect(25,2,18,15,'#18181c'); P.rect(26,3,16,12,'#0e1218'); P.rect(13,17,2,5,'#3a3a42'); P.rect(33,17,2,5,'#3a3a42');
  const L='#ff9a4a'; for(const [a,b,c,d] of [[9,12,19,12],[10,7,18,7],[9,12,10,7],[19,12,18,7],[10,7,14,4],[18,7,14,4],[11,6,10,4],[17,6,18,4]]){ const n=Math.max(Math.abs(c-a),Math.abs(d-b)); for(let i=0;i<=n;i++) P.px(Math.round(a+(c-a)*i/n),Math.round(b+(d-b)*i/n),L); }
  P.disc(14,9,1,'#ffd0a0'); for(let y=4;y<14;y+=3) for(let x=27;x<41;x+=3) if((x+y+fr*3)%4<2) P.rect(x,y,2,2,'#3a5a7a'); else P.rect(x,y,2,2,'#7fd0ff');
  P.rect(27,13,14,1,'#26303a'); P.rect(27,13,4+fr*3,1,'#9fe08a');
  P.rect(8,23,14,2,'#3a3a42'); P.rect(25,23,5,2,'#4a4a54'); });

// góc motion: bảng vẽ Cintiq nghiêng, đèn vòng, storyboard
const motionDesk=()=>S(50,44,25,41,(g,P)=>{ P.rect(2,24,46,5,'#d8b07c'); P.rect(2,24,46,1,'#e8c898'); P.rect(4,29,2,12,'#7a5434'); P.rect(44,29,2,12,'#7a5434');
  P.rect(8,14,22,10,'#1c1c22'); P.rect(9,15,20,8,'#e8eef4'); for(let t=0;t<1;t+=.05) P.px(Math.round(11+t*15),Math.round(21-Math.sin(t*Math.PI)*5),'#ff5fa8'); P.disc(26,17,1,'#7fd0ff'); P.rect(30,20,1,4,'#8a8a94');
  P.rect(38,2,1,22,'#5a5a66'); for(let a=0;a<6.28;a+=.25){ P.px(Math.round(38+Math.cos(a)*6),Math.round(6+Math.sin(a)*6),'#fff8e8'); } P.disc(38,6,1,'#2a2a30'); P.rect(35,24,7,1,'#3a3a42');
  for(const [i,c] of ['#f4f4f2','#ffd84a','#f4f4f2'].entries()){ P.rect(3+i*7,2,6,5,c); P.rect(4+i*7,3,4,2,'#8a8aa0'); P.px(6+i*7,1,'#d23a2e'); }
  P.disc(43,21,3,'#26262c'); P.disc(43,21,1,'#ff5fa8'); });

// tủ giải: cúp vàng, bảng đen chữ W (Awwwards), FWA, CSSDA
const awardShelf=()=>S(50,46,25,44,(g,P)=>{ P.rect(1,1,48,44,'#1c1c22'); P.rect(3,3,44,40,'#2e3a44'); P.rect(3,3,44,2,'#4a5a66');
  for(const y of [15,28,41]) P.rect(3,y,44,2,'#8a96a0');
  for(const x of [7,17]){ P.rect(x,7,6,4,'#e8c040'); P.rect(x+1,11,4,1,'#c89a20'); P.rect(x+2,12,2,2,'#c89a20'); P.rect(x,14,6,1,'#8a6a1a'); P.px(x+1,8,'#fff3a0'); P.px(x-1,8,'#e8c040'); P.px(x+6,8,'#e8c040'); }
  P.rect(27,6,9,9,'#0e0e12'); text3(P,28,8,'W','#ffffff',2); P.rect(38,6,8,9,'#f4f4f2'); text3(P,39,8,'W','#0e0e12',1); text3(P,39,13,'.','#0e0e12');
  P.rect(6,18,14,9,'#3a3a3a'); text3(P,7,20,'FWA','#e8e8e8'); P.rect(23,18,10,9,'#f4f4f2'); text3(P,24,20,'CSS','#d23a2e'); P.rect(36,18,8,9,'#0e0e12'); P.disc(40,22,2,'#e8c040');
  for(let i=0;i<4;i++){ P.rect(6+i*10,31,7,9,['#0e0e12','#f4f4f2','#e8c040','#3a3a3a'][i]); P.rect(7+i*10,33,5,1,['#ffffff','#26262c','#fff3a0','#e8e8e8'][i]); }
  P.rect(4,4,1,38,'rgba(255,255,255,.18)'); P.rect(25,4,1,38,'rgba(255,255,255,.1)'); });
const glassWallV=(h=64)=>S(6,h,3,h-1,(g,P)=>{ P.rect(0,0,6,h,'#7a8a94'); P.rect(1,1,4,h-2,'#bfe2f2'); P.rect(1,1,1,h-2,'#e8f8ff'); for(let y=8;y<h;y+=24) P.rect(1,y,4,1,'#9ab4c2'); });
// bàn họp dài, 6 ghế, laptop + ly
const meetTable=()=>S(70,40,35,30,(g,P)=>{ for(const x of [10,30,50]){ P.rect(x,1,12,8,'#26262c'); P.rect(x,31,12,8,'#26262c'); P.rect(x+1,2,10,1,'#3a3a44'); }
  P.rect(4,9,62,20,'#f4f4f2'); P.rect(4,9,62,1,'#ffffff'); P.rect(4,28,62,2,'#cfcfca'); P.rect(6,30,3,8,'#26262c'); P.rect(61,30,3,8,'#26262c');
  P.rect(14,12,12,8,'#c2c6cb'); P.rect(15,13,10,6,'#1e1e24'); P.rect(16,14,4,4,'#ff5fa8'); P.rect(44,14,12,7,'#c2c6cb'); P.rect(45,15,10,5,'#e8eef4'); P.rect(46,16,6,1,'#26262c');
  for(const [x,y] of [[32,13],[36,22],[60,20],[10,22]]){ P.rect(x,y,3,3,'#f4efe6'); P.px(x+1,y,'#7a4a2a'); } P.rect(28,18,9,6,'#fff27a'); });
const bpTV=()=>S(52,32,26,30,(g,P)=>{ P.rect(0,0,52,30,'#18181c'); P.rect(2,2,48,26,'#f4efe6'); P.rect(2,2,48,7,'#0e0e10'); bearMark(P,4,3,7); text3(P,13,3,'BEARPLUS','#f4f4f2');
  P.rect(5,12,18,13,'#ff5fa8'); P.disc(14,18,4,'#ffd84a'); P.rect(26,12,21,2,'#26262c'); P.rect(26,16,17,1,'#8a8a94'); P.rect(26,19,19,1,'#8a8a94'); P.rect(26,22,12,1,'#8a8a94'); P.rect(24,30,4,2,'#2a2a30'); });
// quầy cà phê: mặt gỗ, thân bê tông, máy espresso bạc đèn đỏ, cối xay, chồng ly, bảng menu
const coffeeBar=()=>S(66,46,33,44,(g,P)=>{ P.rect(4,0,30,14,'#26262c'); P.rect(5,1,28,12,'#2e3a2e'); text3(P,7,2,'MENU','#f4efe6'); for(let y=8;y<13;y+=2){ P.rect(7,y,14,1,'#c8d0c0'); P.rect(26,y,5,1,'#ffd84a'); }
  P.rect(2,28,62,16,'#8a8f96'); for(let x=6;x<62;x+=10) P.rect(x,30,1,12,'#7a7f86'); P.rect(2,26,62,3,'#c99a64'); P.rect(2,26,62,1,'#e0b884');
  P.rect(10,14,20,12,'#c8ccd2'); P.rect(11,15,18,3,'#e8ecf0'); P.rect(13,19,4,5,'#3a3a42'); P.rect(22,19,4,5,'#3a3a42'); P.px(27,16,'#ff3a3a'); P.rect(14,24,2,2,'#7a4a2a'); P.rect(23,24,2,2,'#7a4a2a');
  P.rect(36,12,6,14,'#26262c'); P.rect(36,10,6,3,'#7a5a3a'); P.rect(37,9,4,2,'#9a7a5a');
  for(let i=0;i<4;i++){ P.rect(47,22-i*3,7,3,'#f4f4f2'); P.rect(47,22-i*3,7,1,'#ffffff'); } P.rect(56,20,6,6,'#a0643a'); P.disc(59,17,3,'#4a9a52'); });
// linh vật Bé Gấu (người mặc đồ gấu): thân nâu, bụng kem, huy hiệu "+" hồng; head=false: mất đầu, lộ cổ áo rỗng
const bearMascot=(head=true,fr=0)=>S(30,46,15,44,(g,P)=>{ const B='#8a5a34', D='#6a4224', L='#d8a878', bob=fr%2;
  P.rect(8,40,6,4,D); P.rect(16,40,6,4,D); P.rect(8,42,6,2,'#4a2e18'); P.rect(16,42,6,2,'#4a2e18');
  P.rect(6,20+bob,18,21,B); P.rect(7,19+bob,16,2,B); P.rect(10,24+bob,10,14,L); P.rect(5,22+bob,1,14,D); P.rect(24,22+bob,1,14,D);
  P.rect(2,23+bob,4,11,B); P.rect(24,23+bob,4,11,B); P.disc(4,34+bob,2,D); P.disc(26,34+bob,2,D);
  P.disc(15,28+bob,3,'#ff5fa8'); P.rect(14,26+bob,2,5,'#ffffff'); P.rect(13,27+bob,5,2,'#ffffff');
  if(head){ const hy=bob; P.disc(6,5+hy,3,B); P.disc(24,5+hy,3,B); P.disc(6,5+hy,1,'#e8a8a8'); P.disc(24,5+hy,1,'#e8a8a8');
    P.disc(15,11+hy,9,B); P.rect(7,15+hy,16,4,B); P.disc(15,15+hy,4,L); P.rect(13,13+hy,4,2,'#1c1516'); P.rect(14,15+hy,2,1,'#3a2a20');
    P.rect(10,9+hy,2,3,'#1c1516'); P.rect(18,9+hy,2,3,'#1c1516'); P.px(10,9+hy,'#ffffff'); P.px(18,9+hy,'#ffffff'); P.rect(7,13+hy,2,1,'#f0a0b0'); P.rect(21,13+hy,2,1,'#f0a0b0'); }
  else { P.rect(9,16+bob,12,4,D); P.rect(10,17+bob,10,2,'#1c1516'); P.px(12,15+bob,'#4a2e18'); P.px(18,15+bob,'#4a2e18'); } });
const bearHead=()=>S(22,20,11,18,(g,P)=>{ const B='#8a5a34', L='#d8a878'; P.disc(4,4,3,B); P.disc(18,4,3,B); P.disc(11,10,8,B); P.disc(11,13,3,L); P.rect(9,11,4,2,'#1c1516'); P.rect(7,8,2,2,'#1c1516'); P.rect(14,8,2,2,'#1c1516'); P.px(7,8,'#fff'); P.px(14,8,'#fff'); });
const beanbag=(c='#ff5fa8')=>S(24,18,12,16,(g,P)=>{ P.disc(12,10,7,c); P.rect(4,9,16,7,c); P.rect(5,15,14,1,'rgba(0,0,0,.25)'); P.disc(9,7,2,'rgba(255,255,255,.3)'); P.rect(10,4,4,1,'rgba(0,0,0,.15)'); });
// cửa sổ lớn nhìn sông Sài Gòn: trời, nhà cao tầng (Bitexco có sân đỗ trực thăng, Landmark 81 vuốt nhọn), sông, thuyền, cầu Khánh Hội
const riverWindow=(w=176)=>S(w,30,w/2,29,(g,P)=>{ P.rect(0,0,w,30,'#26262c'); const X=2, W=w-4;
  for(let y=0;y<14;y++) P.rect(X,2+y,W,1,['#8fd0f0','#9ad6f2','#a6dcf4','#b2e2f4','#bfe7f4','#cbebf2','#d6eef0','#dff0ec','#e8f0e6','#eef0e0','#f2eed8','#f4ead0','#f6e6c8','#f6e2c0'][y]);
  P.disc(X+W-22,6,3,'#fff6d8');
  for(let i=0;i<18;i++){ const bx=X+4+i*Math.floor(W/18), bh=4+Math.floor(hash(i,8,5)*7), bw=5+Math.floor(hash(i,9,5)*5); P.rect(bx,16-bh,bw,bh,'#8a9aa8'); for(let y=17-bh;y<15;y+=2) P.px(bx+2,y,'#c8d4dc'); }
  const bt=X+Math.floor(W*.36); P.rect(bt,3,4,13,'#5a6a78'); P.rect(bt+1,2,2,1,'#5a6a78'); P.rect(bt-2,7,8,1,'#7a8a98'); P.rect(bt-1,6,6,1,'#7a8a98');     // Bitexco: tháp thon, đĩa đỗ trực thăng
  const lm=X+Math.floor(W*.68); for(let y=0;y<14;y++) P.rect(lm+Math.floor(y/5),1+y,6-Math.floor(y/5)*2+Math.floor(y/3),1,'#6a7a88'); P.px(lm+3,0,'#6a7a88');        // Landmark 81
  P.rect(X,16,W,10,'#4a8aa8'); for(let y=17;y<26;y+=3) for(let x=X+(y%2)*5;x<X+W;x+=11) P.rect(x,y,4,1,'#7ab0c8');
  P.rect(X+10,20,8,2,'#f4efe6'); P.rect(X+12,19,3,1,'#d23a2e'); P.rect(X+W-40,22,12,2,'#3a3a42'); P.rect(X+W-38,21,4,1,'#f4efe6');
  P.rect(X+W*.12|0,13,W*.22|0,2,'#c8ccd2'); for(let x=(X+W*.12|0);x<(X+W*.34|0);x+=6) P.rect(x,15,1,4,'#a8acb2');
  for(let x=0;x<w;x+=44) P.rect(x,0,2,30,'#26262c'); P.rect(0,14,w,1,'rgba(38,38,44,.6)'); P.rect(X,26,W,2,'#d8dce0'); });
// thảm logo "bear+" ở sảnh
const logoRug=()=>S(86,34,43,32,(g,P)=>{ P.rect(0,0,86,32,'#0e0e10'); P.rect(2,2,82,28,'#161618'); P.rect(2,2,82,1,'#26262a'); bearMark(P,6,5,30,'#e8e8e4'); text3(P,42,10,'BEAR','#e8e8e4',2); text3(P,42,22,'PLUS','#8a8a94'); },false);

/* ================= VNPT ================= */
A.WALKABLE.add('l');
TE.l=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#dbe3ea'); P.rect(X,Y,T,1,'#c2ccd6'); P.rect(X,Y,1,T,'#c2ccd6');
  if((tx+ty)%3===0){ P.rect(X+3,Y+12,6,1,'#eef4f8'); P.rect(X+5,Y+11,5,1,'#eef4f8'); } if(hash(tx,ty,61)<.08) P.px(X+9,Y+4,'#f6fafc'); };
TE.r=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1);
  if(below&&below!=='r'&&A.WALKABLE.has(below)){ P.rect(X,Y,T,T,'#f4f6f8'); P.rect(X,Y,T,1,'#ffffff'); P.rect(X,Y+8,T,3,'#0b6bc2'); P.rect(X,Y+8,T,1,'#3a8ee0'); P.rect(X,Y+11,T,5,'#e6ebf0'); P.rect(X,Y+14,T,2,'#0a3e74'); }
  else { P.rect(X,Y,T,T,'#123a66'); P.rect(X,Y,T,1,'#22528a'); P.rect(X,Y+T-1,T,1,'#0c2a4a'); } };
// logo: vòng tròn xanh có dải quỹ đạo trắng chéo + chữ VNPT
const vnptLogo=()=>S(84,28,42,26,(g,P)=>{ P.rect(0,1,84,26,'#ffffff'); P.rect(0,1,84,1,'#e0e8f0'); P.rect(0,26,84,1,'#c8d4e0');
  P.disc(14,14,10,'#0a6ad0'); P.disc(14,14,8,'#1a7ae0'); for(let t=-9;t<=9;t++){ const y=Math.round(14+t*.45-Math.abs(t)*.12); P.rect(14+t,y,1,2,'#ffffff'); } P.disc(10,10,2,'#6ab4ff');
  text3(P,30,8,'VNPT','#0a5ab8',3); });
// quầy giao dịch: mặt trắng, thân xanh, bảng số quầy, màn hình nhân viên phía sau
const vnptCounter=(n=1)=>S(64,34,32,31,(g,P)=>{ P.rect(18,0,16,11,'#26262c'); P.rect(19,1,14,9,'#cfe6ff'); P.rect(20,2,6,1,'#0a5ab8'); P.rect(20,4,10,1,'#7a8a9a'); P.rect(20,6,8,1,'#7a8a9a'); P.rect(25,11,2,3,'#3a3a42');
  P.rect(0,14,64,4,'#f8fafc'); P.rect(0,14,64,1,'#ffffff'); P.rect(0,18,64,14,'#0b6bc2'); P.rect(0,18,64,1,'#3a8ee0'); P.rect(0,31,64,2,'#0a3e74');
  P.rect(18,20,28,10,'#ffffff'); P.rect(18,20,28,1,'#dfe8f2'); text3(P,20,22,'QUAY','#0a5ab8'); text3(P,38,21,String(n),'#d23a2e',2); P.rect(48,15,8,2,'#d23a2e'); P.rect(6,15,6,2,'#8a96a2'); });
// bảng LED đang phục vụ (số vẽ động ở game)
const queueBoard=()=>S(96,26,48,24,(g,P)=>{ P.rect(0,0,96,24,'#1c1c22'); P.rect(2,2,92,20,'#0a0a0e'); text3(P,6,4,'DANG PHUC VU','#ffd84a'); text3(P,6,13,'MOI QUY KHACH','#7fe0ff');
  for(let x=4;x<92;x+=2) for(let y=3;y<21;y+=2) if(hash(x,y,5)<.05) P.px(x,y,'#2a1010'); },false);
const ticketKiosk=()=>S(20,40,10,38,(g,P)=>{ P.rect(3,2,14,36,'#f4f6f8'); P.rect(3,2,14,3,'#0b6bc2'); P.rect(5,7,10,9,'#1c2a3a'); P.rect(6,8,8,7,'#cfe6ff'); text3(P,6,9,'SO','#0a5ab8'); P.rect(8,13,4,1,'#d23a2e');
  P.disc(10,20,2,'#d23a2e'); P.px(9,19,'#ff8a7a'); P.rect(6,25,8,2,'#26262c'); P.rect(8,26,4,3,'#f8f8f0'); P.rect(4,36,12,2,'#0a3e74'); P.rect(3,5,1,31,'#d8e0e8'); });
const waitChairs=(n=4)=>S(n*14+4,22,(n*14+4)/2,20,(g,P)=>{ P.rect(1,16,n*14+2,2,'#a8b0b8'); for(let i=0;i<n;i++){ const x=2+i*14; P.rect(x,2,12,8,'#1a6fc4'); P.rect(x+1,3,10,1,'#4a9ae8'); P.rect(x,10,12,5,'#1561b0'); P.rect(x+1,10,10,1,'#3a8ee0'); P.rect(x+5,15,2,5,'#8a929a'); } P.rect(2,20,n*14,1,'#6a727a'); });
// tủ kính SIM số đẹp: thẻ SIM nhiều màu, viền vàng, biển đỏ
const simCabinet=()=>S(52,44,26,42,(g,P)=>{ P.rect(1,0,50,10,'#c0281e'); P.rect(1,0,50,1,'#e8483a'); text3(P,4,2,'SIM SO DEP','#ffe680'); P.rect(1,10,50,32,'#c8a040'); P.rect(3,12,46,22,'#dff2fa');
  const cols=['#0b6bc2','#d23a2e','#2a9a52','#e8a020','#7a3ab0','#0b6bc2'];
  for(let r=0;r<3;r++) for(let c=0;c<6;c++){ const x=5+c*7, y=14+r*7; P.rect(x,y,6,5,cols[(r*2+c)%6]); P.rect(x+1,y+1,2,2,'#e8c860'); P.px(x+4,y+3,'#ffffff'); }
  P.rect(3,12,1,22,'#ffffff'); P.rect(3,34,46,8,'#a88030'); for(let x=6;x<48;x+=10) P.rect(x,36,6,1,'#7a5a20'); });
// tủ máy chủ: đèn xanh / cam nhấp nháy theo fr
const serverRack=(fr=0)=>S(22,46,11,44,(g,P)=>{ P.rect(1,0,20,44,'#141418'); P.rect(2,1,18,42,'#22222a');
  for(let u=0;u<13;u++){ const y=3+u*3; P.rect(3,y,16,2,'#2e2e38'); for(let i=0;i<4;i++){ const on=hash(u*4+i,fr,9)<.6; P.px(5+i*3,y,on?(i%3===0?'#ffb03a':'#5fe06a'):'#1a3a1a'); } P.rect(16,y,2,1,'#4a7aa8'); }
  P.rect(19,4,1,36,'#d23a2e'); P.rect(18,6,1,32,'#0b6bc2'); P.rect(1,43,20,2,'#0c0c10'); });
const callDesk=()=>S(42,34,21,31,(g,P)=>{ P.rect(0,0,42,18,'#7a8ea0'); P.rect(1,1,40,16,'#8ea4b6'); for(let x=4;x<40;x+=6) P.rect(x,2,1,14,'#82979e');
  P.rect(2,18,38,5,'#e8ecf0'); P.rect(2,18,38,1,'#ffffff'); P.rect(4,23,2,10,'#5a626a'); P.rect(36,23,2,10,'#5a626a');
  P.rect(12,6,16,11,'#26262c'); P.rect(13,7,14,8,'#cfe6ff'); P.rect(14,8,5,1,'#0a5ab8'); for(let y=10;y<14;y+=2) P.rect(14,y,11,1,'#8a9aaa'); P.rect(19,17,2,2,'#3a3a42');
  for(let a=3.4;a<6;a+=.2) P.px(Math.round(33+Math.cos(a)*4),Math.round(11+Math.sin(a)*4),'#26262c'); P.rect(28,11,2,3,'#26262c'); P.rect(36,11,2,3,'#26262c'); P.rect(30,15,3,1,'#26262c');
  P.rect(5,19,8,3,'#3a3a42'); P.rect(6,19,6,1,'#5a5a66'); });
const packStand=()=>S(24,42,12,40,(g,P)=>{ P.rect(3,0,18,36,'#0b6bc2'); P.rect(3,0,18,1,'#4a9ae8'); text3(P,5,3,'DATA','#ffffff'); text3(P,5,10,'5G','#ffe680',2);
  P.rect(5,22,14,9,'#ffffff'); P.rect(6,23,4,3,'#e8c040'); text3(P,11,23,'99','#0b6bc2'); P.rect(6,28,12,1,'#7a8a9a'); P.rect(10,36,4,4,'#5a626a'); P.rect(6,40,12,2,'#3a3a42'); });
// trạm sạc điện thoại miễn phí: tủ 6 ngăn có cửa kính, dây sạc, đèn báo, màn hình "SAC MIEN PHI" (fr: đèn chạy)
const chargeStation=(fr=0)=>S(30,44,15,42,(g,P)=>{ P.rect(2,0,26,40,'#f4f6f8'); P.rect(2,0,26,6,'#0b6bc2'); P.rect(2,0,26,1,'#3a8ee0'); text3(P,4,1,'SAC','#ffffff'); P.rect(17,1,9,4,'#ffd84a'); P.rect(19,2,3,2,'#0b6bc2'); P.px(22,2,'#0b6bc2');
  P.rect(4,8,22,6,'#1c2a3a'); text3(P,5,9,'FREE','#7fe0ff');
  for(let r=0;r<3;r++) for(let c=0;c<2;c++){ const x=4+c*11, y=16+r*8, on=(r*2+c+fr)%4!==0; P.rect(x,y,10,7,'#c8d0d8'); P.rect(x+1,y+1,8,5,'#dff2fa'); P.rect(x+3,y+2,3,4,'#26262c'); P.rect(x+4,y+3,1,2,on?'#5fe06a':'#3a4a3a'); P.px(x+8,y+1,on?'#5fe06a':'#d23a2e'); P.rect(x+1,y+1,1,5,'rgba(255,255,255,.6)'); }
  P.rect(2,40,26,3,'#0a3e74'); P.rect(27,8,1,32,'#d8e0e8'); });
const waterCooler=()=>S(14,32,7,30,(g,P)=>{ P.rect(3,0,8,10,'#9ad6f2'); P.rect(4,1,2,8,'#c8ecfc'); P.rect(2,10,10,20,'#f4f6f8'); P.rect(2,10,10,1,'#ffffff'); P.rect(4,14,2,2,'#2a6ad0'); P.rect(8,14,2,2,'#d23a2e'); P.rect(3,22,8,1,'#c8d0d8'); P.rect(2,29,10,2,'#a8b0b8'); });

/* ================= MIẾU ÔNG TRƯỜNG CON ================= */
A.WALKABLE.add('s'); A.WALKABLE.add('v');
// sân gạch đỏ vuông (gạch Bát Tràng), mạch vữa, rêu lấm tấm
TE.s=(g,X,Y,tx,ty,nb,fr,P)=>{ for(let by=0;by<2;by++) for(let bx=0;bx<2;bx++){ const h=hash(tx*2+bx,ty*2+by,17); P.rect(X+bx*8,Y+by*8,8,8,h<.33?'#b4613a':h<.66?'#a85a35':'#bc6a42');
    P.rect(X+bx*8,Y+by*8,8,1,'#8a4a2e'); P.rect(X+bx*8,Y+by*8,1,8,'#8a4a2e'); if(h>.9) P.px(X+bx*8+4,Y+by*8+5,'#6a8a3a'); if(h<.08) P.px(X+bx*8+3,Y+by*8+3,'#cc7a52'); } };
// đường đá xanh lát phiến
TE.v=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#8a949a'); const o=ty%2?6:0; P.rect(X,Y,T,1,'#6e787e'); P.rect(X+o,Y,1,T,'#6e787e'); P.rect(X+o+10>T?X+o-6:X+o+10,Y,1,T,'#6e787e');
  if(hash(tx,ty,23)<.3) P.rect(X+3,Y+6,3,1,'#a2acb2'); if(hash(tx,ty,24)<.15) P.px(X+12,Y+11,'#5f8a3a'); };
// ao sen: nước xanh rêu, gợn, mép tối khi giáp bờ
TE.u=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#4f8f86'); for(let y=2;y<T;y+=5) for(let x=0;x<T;x++) if((x+X+y*3+fr*2)%13<2) P.px(X+x,Y+y,'#6fb0a4');
  if(nb(0,-1)!=='u'){ P.rect(X,Y,T,2,'#2f5f56'); P.rect(X,Y+2,T,1,'#3f7f76'); } if(nb(-1,0)!=='u') P.rect(X,Y,1,T,'#2f5f56'); if(nb(1,0)!=='u') P.rect(X+T-1,Y,1,T,'#2f5f56'); };

// miếu: nền đá 3 bậc, 4 cột son đỏ câu đối vàng, cửa giữa mở thấy ban thờ đỏ vàng, nến (fr), hoành phi, mái 2 tầng ngói âm dương,
// đầu đao cong vút, bờ nóc lưỡng long chầu nguyệt men xanh
const shrine=(fr=0)=>S(180,132,90,128,(g,P)=>{ const R='#a8231c', Rd='#7a1812', Gd='#e8c25a', Wd='#5a2a18';
  P.rect(8,116,164,12,'#9aa0a6'); P.rect(8,116,164,2,'#b8bec4'); P.rect(14,120,152,1,'#7a8288'); P.rect(20,124,140,4,'#8a9096'); P.rect(60,124,60,4,'#a8aeb4'); P.rect(60,126,60,1,'#7a8288');
  P.rect(20,62,140,54,'#c8a070'); P.rect(20,62,140,3,'#e0bc8a'); for(let x=24;x<160;x+=8) P.rect(x,66,1,48,'#b48a5a');
  for(const x of [22,62,110,150]){ P.rect(x,60,8,56,R); P.rect(x,60,2,56,'#c83a2e'); P.rect(x+6,60,2,56,Rd); P.rect(x+2,68,4,40,Gd); for(let y=71;y<106;y+=5) P.rect(x+3,y,2,2,'#5a2a12'); P.rect(x-1,112,10,4,'#8a9096'); }
  for(const [x0,x1] of [[30,62],[118,150]]){ P.rect(x0,70,x1-x0,46,Wd); for(let y=74;y<114;y+=6) P.rect(x0+2,y,x1-x0-4,1,'#3a1a0e'); for(let x=x0+4;x<x1-2;x+=6) P.rect(x,72,1,40,'#3a1a0e'); P.rect(x0,70,x1-x0,2,'#7a3a22'); }
  P.rect(70,70,40,46,'#2a0e08'); P.rect(72,78,36,30,'#8a1a12'); P.rect(74,80,32,26,'#c0392b'); P.rect(84,82,12,14,Gd); P.rect(86,84,8,10,'#a8231c'); for(let y=86;y<93;y+=2) P.rect(88,y,4,1,Gd);
  P.rect(74,98,32,4,'#e8c25a'); P.rect(76,102,28,4,'#7a1812'); P.rect(80,94,4,4,'#c8a040'); P.rect(96,94,4,4,'#c8a040');
  for(const x of [78,102]){ P.rect(x,90,2,8,'#f4efe6'); const f=(fr+x)%3; P.px(x,89-f%2,'#ffd84a'); P.px(x+1,88,f?'#ff9a2a':'#fff3a0'); }
  P.rect(88,96,4,2,'#c8a040'); for(let i=0;i<3;i++) P.rect(87+i*2,93-i%2,1,3,'#d23a2e');
  P.rect(66,52,48,12,'#1c1210'); P.rect(68,54,44,8,'#2a1a14'); for(let i=0;i<4;i++){ const x=72+i*10; P.rect(x,55,6,1,Gd); P.rect(x+2,55,1,6,Gd); P.rect(x,58,6,1,Gd); P.rect(x+1,60,5,1,Gd); } P.rect(66,52,48,1,Gd); P.rect(66,63,48,1,Gd);
  const roof=(y0,y1,x0,x1,curl)=>{ for(let y=y0;y<=y1;y++){ const k=(y-y0)/(y1-y0||1), xa=Math.round(x0-k*8), xb=Math.round(x1+k*8); P.rect(xa,y,xb-xa,1,y%3===0?'#5a2a22':(y%3===1?'#7a3a2a':'#6a3226')); }
    for(let x=x0-8;x<x1+8;x+=4) P.rect(x,y0+2,1,y1-y0-2,'#4a2018'); P.rect(x0-10,y1,x1-x0+20,3,'#3a1812'); P.rect(x0-10,y1,x1-x0+20,1,'#8a4a32');
    if(curl){ for(const [sx,dir] of [[x0-10,-1],[x1+9,1]]){ for(let i=0;i<10;i++) P.rect(sx+dir*Math.round(i*.8),y1-Math.round(i*i*.14),2,2,'#5a2a22'); P.rect(sx+dir*8,y1-14,3,3,'#3f7a5a'); P.px(sx+dir*9,y1-15,'#6fb08a'); } } };
  roof(36,58,16,164,true); P.rect(30,30,120,7,'#c8a070'); for(let x=32;x<150;x+=6) P.rect(x,31,3,5,'#8a5a3a');
  roof(10,30,34,146,true); P.rect(30,6,120,5,'#3a1812'); P.rect(30,6,120,1,'#c8a070'); for(let x=34;x<146;x+=8) P.rect(x,7,4,3,'#6a3226');
  P.disc(90,4,4,'#e8c040'); P.disc(90,4,2,'#fff3a0'); for(let i=0;i<5;i++) P.px(90+Math.round(Math.cos(i*1.25)*6),4+Math.round(Math.sin(i*1.25)*6),'#e8a020');
  for(const dir of [-1,1]){ const bx=90+dir*10; for(let i=0;i<22;i++){ const x=bx+dir*i, y=6-Math.round(Math.sin(i*.45)*3); P.rect(x,y,2,2,i%4===0?'#6fb08a':'#3f7a5a'); } P.rect(bx+dir*22,1,3,4,'#3f7a5a'); P.px(bx+dir*1,3,'#d23a2e'); P.rect(bx+dir*2,2,2,1,'#e8c040'); }
  for(const x of [26,154]){ P.rect(x-2,114,4,2,'#8a9096'); } });
// lư hương đồng 3 chân trên bệ đá (khói vẽ ở game)
const luHuong=()=>S(36,42,18,40,(g,P)=>{ P.rect(4,30,28,10,'#8a9096'); P.rect(4,30,28,2,'#b0b6bc'); P.rect(6,38,24,2,'#6e767c'); P.rect(2,40,32,2,'#7a8288');
  P.rect(9,26,3,5,'#6a4a1a'); P.rect(24,26,3,5,'#6a4a1a'); P.rect(16,27,4,4,'#5a3a12');
  P.disc(18,19,10,'#9a6a24'); P.rect(6,12,24,4,'#b4823a'); P.rect(6,12,24,1,'#e0b060'); P.rect(4,13,3,3,'#9a6a24'); P.rect(29,13,3,3,'#9a6a24'); P.disc(12,21,2,'#c89a4a'); P.rect(10,18,16,1,'#7a4a14');
  P.rect(8,10,20,3,'#d8d0c0'); for(let i=0;i<9;i++){ const x=9+i*2; P.rect(x,2+(i%3),1,9-(i%3),'#c0281e'); P.px(x,2+(i%3),'#ff8a3a'); } });
// mâm ngũ quả trên bàn khăn đỏ: chuối, bưởi, cam, thanh long, hoa cúc, nến, vàng mã
const offerTable=()=>S(48,32,24,30,(g,P)=>{ P.rect(2,14,44,14,'#b8241c'); P.rect(2,14,44,2,'#d84a3a'); P.rect(2,26,44,2,'#e8c25a'); for(let x=4;x<46;x+=6) P.rect(x,22,3,4,'#e8c25a');
  P.rect(4,28,3,3,'#5a2a18'); P.rect(41,28,3,3,'#5a2a18'); P.rect(12,11,24,4,'#c8a040'); P.rect(12,11,24,1,'#e8d080');
  P.disc(24,7,4,'#7ab040'); P.px(23,4,'#a8d870'); P.disc(17,9,3,'#f08a20'); P.disc(31,9,3,'#f08a20'); P.disc(20,6,2,'#e8486a'); P.px(20,4,'#7ab040');
  for(let i=0;i<4;i++) P.rect(26+i,2+i,2,4,'#f2d040'); P.rect(6,6,4,8,'#4a8a5a'); for(const [x,y] of [[7,4],[5,5],[9,5],[7,6]]) P.disc(x,y,1,'#ffd84a');
  P.rect(40,8,2,6,'#f4efe6'); P.px(40,7,'#ffd84a'); P.rect(35,12,5,3,'#e8c040'); P.rect(36,12,3,1,'#fff3a0'); });
const fortuneTable=()=>S(26,28,13,26,(g,P)=>{ P.rect(2,14,22,4,'#7a3a22'); P.rect(2,14,22,1,'#9a5a3a'); P.rect(4,18,2,9,'#5a2a18'); P.rect(20,18,2,9,'#5a2a18');
  P.rect(9,4,8,10,'#c89a4a'); P.rect(9,4,8,1,'#e8c070'); for(let y=6;y<14;y+=3) P.rect(9,y,8,1,'#a07a30'); for(let i=0;i<6;i++) P.rect(10+i,0+(i%3),1,5,'#d8b070'); P.px(12,0,'#d23a2e');
  P.rect(18,11,5,3,'#e8c25a'); P.rect(3,11,5,3,'#f4efe6'); });
// cây đa: tán lớn nhiều cụm, rễ phụ buông, thân xù xì, dải lụa đỏ + thẻ ước buộc cành thấp
const banyan=()=>S(132,134,66,130,(g,P)=>{ const L=['#2f6a2a','#3f7a31','#4b8a39','#5a9a43','#6aaa4a'];
  P.rect(52,78,28,52,'#6a4a2e'); P.rect(48,110,36,20,'#6a4a2e'); P.rect(42,122,48,8,'#5a3e26'); for(let y=80;y<128;y+=4) P.rect(54+((y/4)%3)*6,y,2,4,'#4e3420'); P.rect(56,82,3,40,'#7a5a3a');
  for(const x of [20,30,38,92,100,112]) for(let y=60;y<118;y++) if(hash(x,y,3)<.9) P.px(x+Math.round(Math.sin(y*.2)*1),y,'#6a4a2e');
  const cl=[[66,40,34],[34,50,26],[98,50,26],[50,26,22],[84,24,22],[20,66,16],[112,66,16],[66,64,24]];
  for(const [x,y,r] of cl) P.disc(x,y,r,L[0]); for(const [x,y,r] of cl) P.disc(x-2,y-3,r-4,L[1]); for(const [x,y,r] of cl) P.disc(x-4,y-6,r-10,L[2]);
  for(let i=0;i<160;i++){ const x=8+Math.floor(hash(i,5,11)*116), y=6+Math.floor(hash(i,6,11)*74); P.px(x,y,hash(i,7,11)<.5?L[3]:L[4]); }
  for(const [x,y,c] of [[30,76,'#d23a2e'],[40,80,'#e8c040'],[46,74,'#d23a2e'],[86,78,'#d23a2e'],[96,74,'#e8c040'],[104,80,'#d23a2e'],[76,82,'#d23a2e'],[58,84,'#e8c040']]){ P.rect(x,y,2,8,c); P.rect(x-1,y+8,4,4,c==='#e8c040'?'#f4efe6':'#e8c040'); }
  for(let i=0;i<40;i++){ const x=24+i*2.2|0; P.px(x,76+Math.round(Math.sin(i*.6)*2),'#d23a2e'); } });
// rùa đá đội bia
const turtleStele=()=>S(34,40,17,38,(g,P)=>{ P.disc(17,33,10,'#7a8288'); P.rect(6,31,22,6,'#7a8288'); P.disc(17,31,8,'#8a9298'); for(const [x,y] of [[12,30],[17,28],[22,30],[14,34],[20,34]]) P.disc(x,y,2,'#6a7278');
  P.disc(29,34,3,'#8a9298'); P.px(31,33,'#2a2a2a'); P.rect(5,36,4,3,'#6a7278'); P.rect(25,37,4,3,'#6a7278');
  P.rect(10,4,14,26,'#9aa2a8'); P.rect(9,2,16,4,'#8a9298'); P.disc(17,3,4,'#8a9298'); P.rect(10,4,1,26,'#b0b8be'); for(let y=8;y<28;y+=3) for(let x=12;x<23;x+=3) if(hash(x,y,4)<.75) P.rect(x,y,2,1,'#6a7278'); });
// cổng tam quan: 3 lối, cột trụ, mái cong 2 tầng ở giữa, mái thấp 2 bên, đèn lồng đỏ, hoành phi
const mieuGate=(fr=0)=>S(164,92,82,88,(g,P)=>{ const R='#a8231c', Wl='#e8dcc0';
  for(const [x,w] of [[4,20],[36,22],[106,22],[140,20]]){ P.rect(x,30,w,58,Wl); P.rect(x,30,w,3,'#f8f0dc'); P.rect(x+w-3,30,3,58,'#c8bca0'); P.rect(x-2,84,w+4,4,'#9aa0a6'); P.rect(x+3,40,w-6,36,'#d8ccb0'); P.rect(x+5,44,w-10,28,R); P.rect(x+7,46,w-14,24,'#c0392b'); for(let y=48;y<68;y+=4) P.rect(x+w/2-1|0,y,2,2,'#e8c25a'); }
  P.rect(24,48,12,40,'#7a8288'); P.rect(128,48,12,40,'#7a8288'); P.rect(58,40,48,8,'#c8a070');
  P.rect(62,50,40,36,'#2a1a14'); P.rect(64,52,36,34,'#4a2a1a');
  const roof=(y0,y1,x0,x1)=>{ for(let y=y0;y<=y1;y++){ const k=(y-y0)/(y1-y0||1), xa=Math.round(x0-k*6), xb=Math.round(x1+k*6); P.rect(xa,y,xb-xa,1,y%3===0?'#5a2a22':(y%3===1?'#7a3a2a':'#6a3226')); }
    P.rect(x0-8,y1,x1-x0+16,2,'#3a1812'); for(const [sx,dir] of [[x0-8,-1],[x1+7,1]]) for(let i=0;i<7;i++) P.rect(sx+dir*Math.round(i*.8),y1-Math.round(i*i*.18),2,2,'#5a2a22'); };
  roof(22,32,2,46); roof(22,32,118,162); roof(14,38,50,114); roof(0,14,58,106); P.rect(56,0,52,3,'#3a1812'); P.disc(82,1,3,'#e8c040');
  P.rect(66,40,32,9,'#1c1210'); P.rect(67,41,30,7,'#2a1a14'); for(let i=0;i<3;i++){ P.rect(70+i*9,43,6,1,'#e8c25a'); P.rect(72+i*9,43,1,4,'#e8c25a'); }
  for(const [x,ph] of [[60,0],[104,1],[30,2],[134,3]]){ const sw=((fr+ph)%4<2)?0:1; P.rect(x+sw,40,1,6,'#3a2a1a'); P.rect(x-3+sw,46,8,9,'#d23a2e'); P.rect(x-2+sw,45,6,1,'#e8c040'); P.rect(x-2+sw,55,6,1,'#e8c040'); P.rect(x-1+sw,47,2,7,'#ff6a4a'); P.px(x+sw,56,'#e8c040'); P.px(x+sw,57,'#e8c040'); } });
// cờ ngũ sắc phấp phới (fr)
const flag5=(fr=0)=>S(16,52,2,50,(g,P)=>{ P.rect(1,0,2,50,'#8a6a3a'); P.px(1,0,'#e8c040'); const cols=['#d23a2e','#f2d040','#2a8a3a','#2a5ab8','#f4f4f2'];
  for(let i=0;i<5;i++) for(let x=0;x<12;x++){ const y=3+i*3+Math.round(Math.sin((x+fr*2)*.6)*1.2*(x/12)); P.rect(3+x,y,1,3,cols[i]); } });
const lotus=(v=0)=>S(16,12,8,9,(g,P)=>{ P.disc(8,8,5,'#3f8a3a'); P.disc(8,8,3,'#4f9a43'); P.rect(8,5,6,2,'#4f8f86'); if(v%2===0){ P.rect(6,2,4,5,'#f6a6c1'); P.rect(5,3,1,3,'#f08ab0'); P.rect(10,3,1,3,'#f08ab0'); P.px(7,1,'#ffd0e0'); P.rect(7,4,2,2,'#ffe680'); } else P.disc(4,6,2,'#4f9a43'); },false);
// xe bánh đa cua: nồi nước dùng to (hơi vẽ ở game), bát, tủ kính rau, mái bạt sọc, biển
const foodCart=()=>S(78,56,39,54,(g,P)=>{ for(let x=2;x<76;x+=8) P.rect(x,0,8,10,(x/8)%2?'#2a5ab8':'#d23a2e'); P.rect(2,10,74,2,'#1c1516'); P.rect(6,12,2,24,'#8a8a94'); P.rect(70,12,2,24,'#8a8a94');
  P.rect(4,32,70,16,'#c8ccd2'); P.rect(4,32,70,2,'#e8ecf0'); P.rect(4,46,70,2,'#8a8f96'); P.disc(14,52,3,'#26262c'); P.disc(64,52,3,'#26262c'); P.disc(14,52,1,'#8a8a94'); P.disc(64,52,1,'#8a8a94');
  P.rect(10,20,22,13,'#3a3a42'); P.rect(9,19,24,3,'#5a5a66'); P.rect(11,22,20,2,'#c06a2a'); P.rect(12,24,18,2,'#d8844a');
  P.rect(38,18,30,14,'#bfe2f2'); P.rect(38,18,30,1,'#e8f8ff'); for(let i=0;i<5;i++) P.disc(42+i*6,27,2,['#4f9a43','#6aaa4a','#e8d080','#4f9a43','#d23a2e'][i]);
  for(let i=0;i<3;i++){ P.rect(36+i*2,35-i*2,10,2,'#f4f4f2'); P.rect(36+i*2,35-i*2,10,1,'#2a5ab8'); }
  P.rect(18,36,40,8,'#f4efe6'); text3(P,20,38,'BANH DA CUA','#c0281e'); });
const plasticStool=(c='#d23a2e')=>S(12,12,6,10,(g,P)=>{ P.rect(1,2,10,3,c); P.rect(1,2,10,1,'rgba(255,255,255,.35)'); P.rect(2,5,2,5,c); P.rect(8,5,2,5,c); P.rect(4,7,4,1,c); },false);
const lowTable=()=>S(26,16,13,14,(g,P)=>{ P.rect(1,2,24,6,'#2a5ab8'); P.rect(1,2,24,1,'#4a7ad8'); P.rect(3,8,2,6,'#1a4a9a'); P.rect(21,8,2,6,'#1a4a9a'); P.disc(8,4,2,'#f4efe6'); P.px(8,4,'#c06a2a'); P.disc(17,4,2,'#f4efe6'); P.rect(12,3,1,3,'#c89a4a'); });
// bếp củi kiềng 3 chân + nồi luộc gà (fr: lửa bập bùng), củi chất bên cạnh
const stove=(fr=0)=>S(34,30,17,28,(g,P)=>{ P.rect(4,20,26,8,'#7a5a42'); P.rect(4,20,26,2,'#9a7a5a'); P.rect(6,26,22,2,'#5a3e2a');
  const fl=fr%2?['#ffd84a','#ff8a2a']:['#ff8a2a','#ffd84a']; P.rect(11,16,12,5,fl[1]); P.rect(13,13,3,4,fl[0]); P.rect(18,14,3,3,fl[0]); P.px(15,12,'#fff3a0');
  P.rect(8,6,18,10,'#3a3a42'); P.rect(7,5,20,2,'#5a5a66'); P.rect(9,8,16,1,'#26262c'); P.rect(6,7,2,3,'#3a3a42'); P.rect(26,7,2,3,'#3a3a42'); P.rect(10,3,4,2,'#d8a060'); P.px(12,2,'#f0c080');
  for(let i=0;i<4;i++) P.rect(28+(i%2),18+i*2,5,2,['#8a5a32','#6a4224'][i%2]); });
// chân máy + đèn vòng + điện thoại (góc quay TikTok của Trường Con)
const tripodRing=()=>S(18,44,9,42,(g,P)=>{ P.rect(8,12,2,22,'#3a3a42'); P.rect(5,34,1,8,'#3a3a42'); P.rect(12,34,1,8,'#3a3a42'); P.rect(8,34,2,8,'#3a3a42'); P.rect(6,33,6,2,'#26262c');
  for(let a=0;a<6.28;a+=.22) P.px(Math.round(9+Math.cos(a)*7),Math.round(7+Math.sin(a)*7),'#fff8e8'); P.rect(6,4,6,9,'#1c1c22'); P.rect(7,5,4,7,'#ff4fa3'); P.px(9,8,'#ffffff'); });

/* ---------- chi tiết thêm cho các khoảng trống ---------- */
// bàn bóng bàn xanh, lưới trắng, 2 vợt + quả bóng (studio nào cũng có)
const pingPong=()=>S(66,40,33,34,(g,P)=>{ P.rect(3,6,60,26,'#1f6fb2'); P.rect(3,6,60,2,'#3f8fd2'); P.rect(3,6,60,1,'#f4f4f2'); P.rect(3,31,60,1,'#f4f4f2'); P.rect(3,6,1,26,'#f4f4f2'); P.rect(62,6,1,26,'#f4f4f2'); P.rect(32,6,1,26,'#f4f4f2');
  P.rect(32,2,2,30,'#e8eef4'); for(let y=3;y<31;y+=2) P.px(33,y,'#a8b4c0'); P.rect(31,1,4,2,'#26262c'); P.rect(31,31,4,2,'#26262c'); P.rect(6,32,3,6,'#26262c'); P.rect(57,32,3,6,'#26262c');
  P.disc(14,16,3,'#d23a2e'); P.rect(13,19,2,4,'#7a4a2a'); P.disc(50,22,3,'#26262c'); P.rect(49,25,2,4,'#7a4a2a'); P.disc(40,12,1,'#ffffff'); });
// kệ sách thiết kế: gáy sách nhiều màu, tạp chí, tượng gấu nhỏ
const designShelf=()=>S(40,48,20,46,(g,P)=>{ P.rect(1,0,38,46,'#3a3a42'); P.rect(3,2,34,42,'#24242a'); for(const y of [13,25,37]) P.rect(3,y,34,2,'#5a5a66');
  const cols=['#ff5fa8','#7fd0ff','#ffd84a','#f4f4f2','#9fe08a','#26262c','#c792ea','#ff9a4a'];
  for(const [r,y] of [3,15,27].entries()) for(let x=4,i=0;x<34;i++){ const w=2+(hash(i,r,7)*3|0), h=7+(hash(i,r,8)*3|0); P.rect(x,y+10-h,w,h,cols[(i+r*3)%cols.length]); P.rect(x,y+10-h,w,1,'rgba(255,255,255,.3)'); x+=w+(hash(i,r,9)<.2?2:0); }
  P.rect(6,40,10,4,'#ff5fa8'); P.rect(18,39,9,5,'#f4f4f2'); P.disc(31,40,2,'#8a5a34'); P.disc(29,38,1,'#8a5a34'); P.disc(33,38,1,'#8a5a34'); });
// cây monstera lá xẻ trong chậu bê tông
const monstera=()=>S(34,46,17,44,(g,P)=>{ P.rect(9,34,16,10,'#9aa0a6'); P.rect(8,33,18,2,'#b8bec4'); P.rect(10,43,14,1,'#7a8288');
  for(const [x,y,r] of [[17,12,8],[8,20,7],[26,20,7],[12,28,5],[23,29,5],[17,24,6]]){ P.disc(x,y,r,'#2f7a3a'); P.disc(x-1,y-1,r-2,'#3f9a4a'); for(let i=-r+2;i<r-1;i+=3) P.px(x+i,y+1,'#1f5a2a'); P.rect(x,y-r+2,1,r,'#5fba6a'); }
  for(const [x,y] of [[15,10],[20,14],[6,19],[28,21],[11,27]]) P.px(x,y,'#e8f4e0'); P.rect(16,30,2,4,'#2f5a2a'); });
// góc chụp ảnh với Bé Gấu: phông hồng có chữ bear+, đèn chụp
const photoCorner=()=>S(56,48,28,46,(g,P)=>{ P.rect(4,0,48,40,'#0e0e10'); P.rect(4,0,48,2,'#2a2a2e'); for(let i=0;i<9;i++) P.disc(8+i*5,37,3,'#26262a'); bearMark(P,14,5,28); text3(P,13,30,'BEARPLUS','#8a8a94');
  P.rect(0,4,3,42,'#3a3a42'); P.rect(53,4,3,42,'#3a3a42'); P.rect(0,2,6,4,'#26262c'); P.rect(1,3,4,2,'#fff8e8'); P.rect(50,2,6,4,'#26262c'); P.rect(51,3,4,2,'#fff8e8'); P.rect(4,40,48,6,'#e8e8e4'); });
// VNPT: kệ tờ rơi gói cước, TV MyTV chiếu bóng đá, áp phích 5G
const brochureRack=()=>S(22,40,11,38,(g,P)=>{ P.rect(3,2,16,34,'#c8d0d8'); P.rect(3,2,16,1,'#e8eef4'); for(let r=0;r<4;r++) for(let c=0;c<2;c++){ const x=5+c*7, y=5+r*8; P.rect(x,y,6,7,['#0b6bc2','#ffd84a','#d23a2e','#2a9a52'][(r+c)%4]); P.rect(x+1,y+1,4,1,'#ffffff'); P.rect(x+1,y+3,3,1,'rgba(255,255,255,.6)'); }
  P.rect(8,36,6,2,'#5a626a'); P.rect(5,38,12,2,'#3a3a42'); });
const myTV=()=>S(56,34,28,32,(g,P)=>{ P.rect(0,0,56,32,'#141418'); P.rect(2,2,52,28,'#3a9a4a'); for(let y=3;y<30;y+=6) P.rect(2,y,52,3,'#348a42'); P.rect(27,2,1,28,'#e8f4e0'); P.disc(28,16,5,'#e8f4e0'); P.disc(28,16,4,'#3a9a4a');
  P.rect(10,10,2,3,'#d23a2e'); P.rect(40,18,2,3,'#ffffff'); P.rect(18,20,2,3,'#d23a2e'); P.px(33,12,'#ffffff'); P.rect(2,2,18,5,'rgba(0,0,0,.55)'); text3(P,3,3,'VIE 2-1','#ffd84a'); P.rect(46,3,7,4,'#0b6bc2'); text3(P,47,3,'MY','#ffffff'); P.rect(25,32,6,2,'#26262c'); });
const poster5G=()=>S(40,30,20,28,(g,P)=>{ P.rect(0,0,40,28,'#0a3e74'); P.rect(2,2,36,24,'#0b6bc2'); for(let i=0;i<3;i++) for(let a=-1;a<=1;a+=.08) P.px(Math.round(30+Math.cos(a-1.57)*(4+i*4)),Math.round(20+Math.sin(a-1.57)*(4+i*4)),'#7fd0ff');
  text3(P,5,5,'5G','#ffffff',3); text3(P,5,20,'NHANH','#ffe680'); P.disc(30,20,1,'#ffffff'); },false);
// Miếu: rặng tre, cây hoa sứ (đại) hoa trắng nhuỵ vàng, đèn đá, chậu bonsai
const plumeria=()=>S(44,56,22,54,(g,P)=>{ P.rect(20,30,5,24,'#8a7a6a'); P.rect(14,24,3,14,'#8a7a6a'); P.rect(27,22,3,14,'#8a7a6a'); P.rect(16,36,6,2,'#8a7a6a'); P.rect(24,34,5,2,'#8a7a6a'); P.rect(21,30,1,22,'#a8988a');
  for(const [x,y,r] of [[15,18,9],[30,16,9],[22,10,8],[8,26,6],[36,26,6]]){ P.disc(x,y,r,'#3f7a31'); P.disc(x-1,y-2,r-3,'#4b8a39'); }
  for(const [x,y] of [[12,14],[18,9],[26,8],[33,12],[29,20],[16,22],[9,24],[37,24],[22,15],[35,17]]){ P.rect(x-1,y,3,1,'#fff8ec'); P.rect(x,y-1,1,3,'#fff8ec'); P.px(x,y,'#ffd84a'); } });
const stoneLantern=()=>S(16,32,8,30,(g,P)=>{ P.rect(3,26,10,4,'#7a8288'); P.rect(5,18,6,8,'#8a9298'); P.rect(2,12,12,6,'#9aa2a8'); P.rect(4,13,8,4,'#2a2a2a'); P.rect(6,14,4,2,'#ffb84a'); P.rect(1,9,14,3,'#7a8288'); P.rect(4,6,8,3,'#8a9298'); P.disc(8,4,2,'#9aa2a8'); P.rect(2,30,12,2,'#6a7278'); });

// icon túi đồ 14×14: ly cà phê sữa đá, đầu gấu, cúp Site of the Day, bát bánh đa cua
const ICONS6={
  cafe:P=>{ P.rect(3,2,8,11,'#e8f4fa'); P.rect(4,5,6,7,'#8a5a34'); P.rect(4,5,6,2,'#d8b088'); P.rect(5,8,2,2,'#f4f4f2'); P.rect(3,2,8,1,'#ffffff'); P.rect(8,0,1,5,'#ff5fa8'); },
  bearhead:P=>{ P.disc(3,3,2,'#8a5a34'); P.disc(10,3,2,'#8a5a34'); P.disc(6,7,5,'#8a5a34'); P.disc(6,9,2,'#d8a878'); P.rect(5,8,2,1,'#1c1516'); P.px(4,6,'#1c1516'); P.px(8,6,'#1c1516'); },
  cup:P=>{ P.rect(3,1,7,5,'#e8c040'); P.rect(1,2,2,2,'#e8c040'); P.rect(10,2,2,2,'#e8c040'); P.rect(5,6,3,3,'#c89a20'); P.rect(3,9,7,3,'#26262c'); P.rect(4,10,5,1,'#e8c040'); P.px(4,2,'#fff3a0'); },
  bowl:P=>{ P.rect(1,6,12,5,'#f4f4f2'); P.rect(2,11,10,1,'#d8d8d4'); P.rect(1,6,12,1,'#2a5ab8'); P.rect(2,5,10,2,'#c06a2a'); P.rect(3,4,3,1,'#d8844a'); P.rect(7,4,3,1,'#e8d080'); P.px(10,4,'#4f9a43'); P.px(4,3,'#4f9a43'); } };
const oldIcon6=A.icon; A.icon=function(name,scale=1){ const f=ICONS6[name]; if(!f) return oldIcon6(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
Object.assign(A,{text3,bearMark,bpNeon,bpDesk,meshChair,moodWall,renderStation,motionDesk,awardShelf,glassWallV,meetTable,bpTV,coffeeBar,bearMascot,bearHead,beanbag,riverWindow,logoRug,
  vnptLogo,vnptCounter,queueBoard,ticketKiosk,waitChairs,simCabinet,serverRack,callDesk,packStand,waterCooler,chargeStation,
  shrine,luHuong,offerTable,fortuneTable,banyan,turtleStele,mieuGate,flag5,lotus,foodCart,plasticStool,lowTable,tripodRing,stove,
  pingPong,designShelf,monstera,photoCorner,brochureRack,myTV,poster5G,plumeria,stoneLantern});
})();
