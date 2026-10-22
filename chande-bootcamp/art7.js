/* Group Nghiện Motion (Hà Nội): phòng tông xanh đêm, thảm 'x', tường xanh than viền neon 'j', sàn gỗ thông phòng xông hơi 't'.
   Bàn đôi màn hình (timeline After Effects, graph editor, khung 3D), TV lớn logo NGHIỆN MOTION, bảng kanban giấy nhớ,
   kệ mô hình, bàn lắp Gunpla, góc chơi game, phòng xông hơi: vách gỗ, ghế 2 tầng, bếp đá có hơi; Gundam & Evangelion cỡ người. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), t3=(...a)=>A.text3(...a);
A.WALKABLE.add('x'); A.WALKABLE.add('t');
TE.x=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#2c3550'); P.rect(X,Y,T,1,'#262e46'); P.rect(X,Y,1,T,'#262e46'); for(let i=0;i<5;i++){ const h=hash(tx*5+i,ty*3,71); P.px(X+Math.floor(h*16),Y+Math.floor(hash(tx,ty*7+i,72)*16),h<.5?'#343e5c':'#283048'); } };
TE.t=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#c8925a'); for(let r=0;r<T;r+=4){ P.rect(X,Y+r,T,1,'#a8743e'); const o=(r/4+tx)%2?6:0; P.rect(X+o,Y+r,1,4,'#a8743e'); } if(hash(tx,ty,73)<.25) P.rect(X+3,Y+6,2,1,'#8a5a2e'); };
TE.j=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1);
  if(below&&below!=='j'&&A.WALKABLE.has(below)){ P.rect(X,Y,T,T,'#2a3352'); P.rect(X,Y,T,1,'#3a4570'); P.rect(X,Y+11,T,1,'#7fd0ff'); P.rect(X,Y+12,T,4,'#1c2238'); if((tx+ty)%3===0) P.px(X+7,Y+4,'#34406a'); }
  else { P.rect(X,Y,T,T,'#161a2a'); P.rect(X,Y,T,1,'#242a40'); } };

// cửa sổ đêm: phố Hà Nội lên đèn, đường cao tốc trên cao
const nightWindow=(w=128)=>S(w,28,w/2,27,(g,P)=>{ P.rect(0,0,w,28,'#1c2238'); P.rect(2,2,w-4,24,'#3a5a8a'); for(let y=2;y<14;y++) P.rect(2,y,w-4,1,['#2a3a6a','#2e4272','#324a7a','#36507e','#3a5682','#3e5c86','#42628a','#46688c','#4a6e90','#4e7492','#527a94','#567e96'][y-2]);
  for(let i=0;i<14;i++){ const bx=4+i*Math.floor((w-8)/14), bh=6+Math.floor(hash(i,3,9)*10); P.rect(bx,26-bh,7,bh,'#1a2440'); for(let y=27-bh;y<25;y+=2) if(hash(i,y,4)<.6) P.px(bx+2+(y%3),y,'#ffd86a'); }
  P.rect(2,20,w-4,2,'#2a2e3a'); for(let x=4;x<w-4;x+=6) P.px(x,21,'#ff5a5a'); for(let x=2;x<w;x+=32) P.rect(x,2,2,24,'#1c2238'); P.rect(2,14,w-4,1,'rgba(28,34,56,.6)'); });
// bàn làm motion: 2 màn hình (v: timeline / graph editor / khung 3D), bàn phím, chuột, bảng vẽ
const nmDesk=(v=0)=>S(46,34,23,31,(g,P)=>{ P.rect(2,18,42,5,'#c8945a'); P.rect(2,18,42,1,'#e0b07a'); P.rect(2,22,42,1,'#8a5a32'); P.rect(4,23,2,10,'#3a3a44'); P.rect(40,23,2,10,'#3a3a44'); P.rect(34,23,8,10,'#3a3a44'); P.rect(35,25,6,1,'#5a5a66'); P.rect(35,29,6,1,'#5a5a66');
  for(const [x,k] of [[5,0],[24,1]]){ P.rect(x,3,18,13,'#18181e'); P.rect(x+1,4,16,10,'#101420'); P.rect(x+8,16,2,2,'#3a3a44'); const m=(v+k)%3;
    if(m===0){ for(let r=0;r<4;r++){ P.rect(x+2,6+r*2,13,1,'#2a3048'); P.rect(x+3+((r*4+v)%6),6+r*2,4+r,1,['#7fd0ff','#ffd84a','#c792ea','#9fe08a'][r]); } P.rect(x+9,5,1,9,'#ff5a5a'); }
    else if(m===1){ for(let i=0;i<14;i++){ const y=12-Math.round((1-Math.cos(i/13*Math.PI))/2*7); P.px(x+2+i,y,'#ffd84a'); } P.rect(x+2,13,14,1,'#3a4058'); P.px(x+2,12,'#ff5a5a'); P.px(x+15,5,'#ff5a5a'); }
    else { P.rect(x+5,6,6,6,'#3a4a7a'); P.rect(x+6,5,6,1,'#5a6a9a'); P.rect(x+11,6,1,6,'#2a3a5a'); for(let i=0;i<4;i++) P.px(x+3+i*3,13,'#7fd0ff'); } }
  P.rect(12,19,14,2,'#2a2a32'); P.rect(12,19,14,1,'#4a4a56'); P.rect(28,19,4,3,'#2a2a32'); P.rect(33,19,1,1,'#7fd0ff'); });
// TV lớn treo tường: logo NGHIỆN MOTION + quả bóng nảy chạy (fr)
const nmTV=(fr=0)=>S(70,40,35,38,(g,P)=>{ P.rect(0,0,70,38,'#0e0e14'); P.rect(2,2,66,32,'#141a2e'); for(let y=2;y<34;y++) P.rect(2,y,66,1,y%2?'#141a2e':'#161e34');
  t3(P,8,6,'NGHIEN','#7fd0ff',2); t3(P,8,18,'MOTION','#ff7ac8',2); const bx=50+Math.round(Math.sin(fr*.8)*6), by=26-Math.round(Math.abs(Math.sin(fr*.6))*16); P.disc(bx,by,3,'#ffd84a'); P.rect(bx-3,30,7,1,'#2a3048'); P.rect(32,36,6,2,'#26262c'); });
// bảng kanban trên giá: cột TODO / DOING / DONE, giấy nhớ nhiều màu
const kanban=()=>S(52,46,26,44,(g,P)=>{ P.rect(3,0,46,32,'#e8ecf0'); P.rect(3,0,46,2,'#ffffff'); P.rect(2,0,1,32,'#8a8f96'); P.rect(49,0,1,32,'#8a8f96'); P.rect(3,31,46,2,'#8a8f96');
  for(const [i,lab] of ['TODO','DOING','DONE'].entries()){ t3(P,5+i*15,3,lab,'#3a4058'); P.rect(17+i*15,3,1,27,'#c8ccd2'); }
  for(let k=0;k<11;k++){ const col=k%3, x=5+col*15+(k%2)*5, y=10+Math.floor(k/3)*5; P.rect(x,y,5,4,['#fff27a','#ff9ac8','#9fe0ff','#b8f0a0'][k%4]); P.px(x+1,y+1,'#8a8a94'); }
  P.rect(10,33,2,12,'#5a5a66'); P.rect(40,33,2,12,'#5a5a66'); P.rect(24,33,2,8,'#5a5a66'); P.rect(6,44,40,2,'#3a3a44'); });
// kệ mô hình: Gunpla, figure, hộp mô hình
const figShelf=()=>S(44,50,22,48,(g,P)=>{ P.rect(1,0,42,48,'#3a2a22'); P.rect(3,2,38,44,'#2a1e18'); for(const y of [15,30,45]) P.rect(3,y,38,2,'#5a4232');
  const fig=(x,y,c1,c2)=>{ P.rect(x+1,y-10,4,4,c1); P.rect(x,y-6,6,4,c2); P.rect(x+1,y-2,2,2,c1); P.rect(x+3,y-2,2,2,c1); P.px(x+2,y-11,'#ffd84a'); P.px(x+3,y-11,'#ffd84a'); };
  fig(6,15,'#f4f4f2','#2a5ab8'); fig(15,15,'#7a3ab0','#5fe06a'); fig(24,15,'#d23a2e','#f4f4f2'); fig(33,15,'#e8e8e8','#26262c');
  for(let i=0;i<4;i++){ P.rect(5+i*9,20,8,10,['#d23a2e','#2a5ab8','#f2c43d','#26262c'][i]); P.rect(6+i*9,22,6,3,'#f4f4f2'); }
  fig(8,45,'#ff8ac8','#ffd84a'); fig(18,45,'#7fd0ff','#26262c'); P.rect(27,36,12,9,'#f4f4f2'); P.rect(28,38,10,2,'#d23a2e'); P.rect(28,41,6,2,'#2a5ab8'); });
// bàn lắp Gunpla: khay runner, kìm cắt, chi tiết, lọ sơn, mô hình dở dang
const modelTable=()=>S(50,32,25,29,(g,P)=>{ P.rect(2,12,46,6,'#b8845a'); P.rect(2,12,46,1,'#d8a47a'); P.rect(4,18,3,12,'#6a4a32'); P.rect(43,18,3,12,'#6a4a32');
  P.rect(5,6,18,7,'#c8ccd2'); for(let i=0;i<4;i++) P.rect(6+i*4,7,3,5,['#f4f4f2','#2a5ab8','#d23a2e','#f2c43d'][i]); P.rect(5,9,18,1,'#8a8f96');
  P.rect(26,4,6,9,'#f4f4f2'); P.rect(27,6,4,3,'#2a5ab8'); P.rect(26,9,6,2,'#d23a2e'); P.px(28,3,'#f2c43d'); P.px(29,3,'#f2c43d');
  P.rect(35,9,2,4,'#d23a2e'); P.rect(38,9,2,4,'#2a5ab8'); P.rect(41,9,2,4,'#f2c43d'); P.rect(34,13,10,1,'#8a6a4a'); P.rect(14,14,6,1,'#3a3a44'); P.rect(19,13,3,1,'#c8ccd2'); });
// góc game: TV trên kệ, máy console, tay cầm, đèn LED
const gameCorner=(fr=0)=>S(58,40,29,38,(g,P)=>{ P.rect(4,24,50,14,'#26262c'); P.rect(4,24,50,2,'#3a3a44'); P.rect(6,28,14,8,'#18181e'); P.rect(38,28,14,8,'#18181e'); P.rect(22,30,14,4,'#f4f4f2'); P.px(34,31,'#5fe06a');
  P.rect(8,0,42,24,'#0e0e14'); P.rect(10,2,38,19,'#1a2240'); const hp=Math.round(10+Math.sin(fr)*4); P.rect(12,4,14,2,'#ff5a5a'); P.rect(12,4,hp,2,'#5fe06a'); P.rect(32,4,14,2,'#ff5a5a'); P.rect(32,4,14-hp+10,2,'#5fe06a');
  P.rect(16+(fr%2),11,5,8,'#7a3ab0'); P.rect(17+(fr%2),9,3,2,'#5fe06a'); P.rect(34-(fr%2),11,5,8,'#d23a2e'); P.rect(35-(fr%2),9,3,2,'#f4d0a8'); P.rect(10,19,38,2,'#2a3048');
  for(let x=4;x<54;x+=4) P.px(x,38,['#ff5fa8','#7fd0ff','#9fe08a','#ffd84a'][(x/4+fr)%4]); P.rect(24,36,4,2,'#3a3a44'); P.rect(30,36,4,2,'#3a3a44'); });
// phòng xông hơi: vách gỗ, ghế 2 tầng, bếp đá có than đỏ (fr), xô gáo
const saunaWall=(w=160)=>S(w,24,w/2,23,(g,P)=>{ P.rect(0,0,w,24,'#8a5a32'); for(let x=0;x<w;x+=6) P.rect(x,0,1,24,'#6a4224'); P.rect(0,0,w,2,'#a8743e'); P.rect(0,22,w,2,'#5a3a1e'); },false);
const saunaWallV=(h=96)=>S(8,h,4,h-1,(g,P)=>{ P.rect(0,0,8,h,'#8a5a32'); P.rect(0,0,2,h,'#a8743e'); P.rect(6,0,2,h,'#5a3a1e'); for(let y=0;y<h;y+=8) P.rect(0,y,8,1,'#6a4224'); },false);
const saunaBench=(w=96)=>S(w,26,w/2,24,(g,P)=>{ P.rect(0,2,w,6,'#d8a46a'); P.rect(0,2,w,1,'#f0c48a'); P.rect(0,8,w,2,'#8a5a32'); P.rect(0,14,w,6,'#c8925a'); P.rect(0,14,w,1,'#e0b07a'); P.rect(0,20,w,2,'#7a4a2a');
  for(let x=4;x<w;x+=20){ P.rect(x,10,3,4,'#6a4224'); P.rect(x,22,3,3,'#6a4224'); } for(let x=0;x<w;x+=12){ P.rect(x,4,1,4,'#b8844a'); P.rect(x+6,16,1,4,'#a8743e'); } });
const saunaHeater=(fr=0)=>S(30,34,15,32,(g,P)=>{ P.rect(3,12,24,20,'#3a3a42'); P.rect(3,12,24,2,'#5a5a66'); P.rect(5,18,20,10,'#26262c'); P.rect(7,20,16,6,fr%2?'#ff7a2a':'#ff5a1a'); P.rect(9,21,12,3,fr%2?'#ffd84a':'#ffb03a');
  for(const [x,y,r] of [[8,9,4],[15,8,4],[22,9,4],[11,5,3],[19,5,3]]) P.disc(x,y,r,'#7a8288'); for(const [x,y] of [[7,8],[14,7],[21,8]]) P.px(x,y,'#9aa2a8'); P.rect(1,30,28,3,'#26262c'); });
const bucket=()=>S(16,16,8,14,(g,P)=>{ P.rect(3,6,10,8,'#a8743e'); P.rect(3,6,10,1,'#c8945a'); P.rect(3,9,10,1,'#6a4224'); P.rect(3,12,10,1,'#6a4224'); P.rect(2,5,12,1,'#5a3a1e'); P.rect(10,0,1,7,'#8a5a32'); P.rect(9,0,4,2,'#a8743e'); });
// Gundam cỡ người (RX-78): trắng, ngực xanh, eo đỏ, ăng-ten chữ V vàng, mắt xanh lá nhấp nháy, khiên đỏ
const gundam=(fr=0)=>S(30,46,15,44,(g,P)=>{ const W='#f2f2f0', Wd='#c8ccd2', B='#2a5ab8', R='#d23a2e', Y='#f2c43d', bob=fr%2;
  P.rect(8,36,5,8,W); P.rect(17,36,5,8,W); P.rect(7,42,7,3,R); P.rect(16,42,7,3,R); P.rect(9,38,3,2,Wd); P.rect(18,38,3,2,Wd);
  P.rect(9,28+bob,12,8,W); P.rect(12,30+bob,6,4,Wd); P.rect(9,26+bob,12,3,R); P.rect(14,27+bob,2,1,Y);
  P.rect(7,16+bob,16,10,B); P.rect(9,18+bob,4,3,Y); P.rect(17,18+bob,4,3,Y); P.rect(7,16+bob,16,1,'#4a7ad8'); P.rect(13,22+bob,4,4,'#1a4a9a');
  P.rect(2,15+bob,6,5,W); P.rect(22,15+bob,6,5,W); P.rect(3,20+bob,4,9,W); P.rect(23,20+bob,4,9,W); P.rect(3,28+bob,4,3,Wd); P.rect(23,28+bob,4,3,Wd);
  P.rect(24,22+bob,6,12,R); P.rect(25,23+bob,4,1,Y); P.rect(26,26+bob,2,5,'#f2f2f0');
  P.rect(10,6+bob,10,10,W); P.rect(11,8+bob,8,3,'#26262c'); P.px(12,9+bob,fr%4<2?'#5fe06a':'#c8ffc8'); P.px(17,9+bob,fr%4<2?'#5fe06a':'#c8ffc8'); P.rect(13,13+bob,4,2,R); P.rect(14,6+bob,2,2,R);
  for(let i=0;i<5;i++){ P.px(14-i,5+bob-i,Y); P.px(15+i,5+bob-i,Y); } P.rect(9,8+bob,1,5,Wd); P.rect(20,8+bob,1,5,Wd); });
// Evangelion Unit-01 cỡ người: giáp tím, vạch xanh lá, sừng, hàm, mắt xanh, dáng gù
const eva=(fr=0)=>S(28,48,14,46,(g,P)=>{ const V='#6a3ab0', Vd='#4a2488', G='#5fe06a', O='#ff9a3a', bob=fr%2;
  P.rect(8,38,4,8,V); P.rect(16,38,4,8,V); P.rect(7,44,6,2,Vd); P.rect(15,44,6,2,Vd); P.rect(9,40,1,3,G); P.rect(17,40,1,3,G);
  P.rect(8,28+bob,12,10,V); P.rect(10,30+bob,8,2,G); P.rect(13,33+bob,2,4,O);
  P.rect(6,16+bob,16,12,V); P.rect(8,18+bob,3,6,G); P.rect(17,18+bob,3,6,G); P.rect(12,20+bob,4,5,Vd); P.rect(4,14+bob,5,4,G); P.rect(19,14+bob,5,4,G);
  P.rect(2,18+bob,4,12,V); P.rect(22,18+bob,4,12,V); P.rect(2,22+bob,4,1,G); P.rect(22,22+bob,4,1,G); P.rect(1,29+bob,5,3,Vd); P.rect(22,29+bob,5,3,Vd);
  P.rect(10,6+bob,8,10,V); P.rect(10,12+bob,8,3,Vd); P.rect(11,13+bob,6,1,G); P.rect(11,8+bob,2,2,fr%4<2?G:'#c8ffc8'); P.rect(15,8+bob,2,2,fr%4<2?G:'#c8ffc8');
  P.rect(13,1+bob,2,5,O); P.px(13,0+bob,O); P.rect(9,5+bob,10,2,Vd); });
// pantry: kệ mì gói (cốc trắng viền đỏ/vàng, gói Hảo Hảo), Sting xếp tháp, ấm siêu tốc bốc hơi
const snackRack=(fr=0)=>S(44,34,22,32,(g,P)=>{ P.rect(1,10,42,22,'#3a2a1e'); P.rect(1,10,42,2,'#5a4230'); P.rect(3,20,38,1,'#2a1e14'); P.rect(1,30,42,2,'#2a1e14');
  for(let i=0;i<6;i++){ const x=4+i*6; P.rect(x,13,5,6,'#f4f4f2'); P.rect(x,14,5,2,i%2?'#f2c43d':'#d23a2e'); P.px(x+2,13,'#c8ccd2'); }
  for(let i=0;i<4;i++){ const x=4+i*9; P.rect(x,23,8,5,'#f2a83a'); P.rect(x+1,24,6,1,'#d23a2e'); P.rect(x+2,26,4,1,'#5fae46'); }
  for(const [x,y] of [[30,4],[33,4],[36,4],[31.5,0],[34.5,0]]){ P.rect(x,y+1,3,5,'#d2232e'); P.px(x+1,y+2,'#ffd84a'); P.rect(x,y,3,1,'#c8ccd2'); }
  P.rect(6,3,8,7,'#e8ecef'); P.rect(6,3,8,1,'#c8ccd2'); P.rect(13,5,2,3,'#c8ccd2'); P.px(9,2,'#26262c'); P.px(8,6,fr%2?'#5fe06a':'#2a7a3a');
  if(fr%2){ P.px(7,0,'rgba(255,255,255,.6)'); P.px(9,1,'rgba(255,255,255,.5)'); } else { P.px(8,1,'rgba(255,255,255,.6)'); P.px(10,0,'rgba(255,255,255,.5)'); } });
// robot đồ chơi: bảng màu chung (thân / ngực / đầu / mắt / điểm nhấn / chân), mono: mắt 1 chấm kiểu Zaku
const TOY={rx:{b:'#f2f2f0',c:'#2a5ab8',h:'#f2f2f0',e:'#5fe06a',a:'#f2c43d',l:'#f2f2f0',r:'#d23a2e'},zaku:{b:'#6a9a4a',c:'#4a7a36',h:'#6a9a4a',e:'#ff4a8a',a:'#9aa0aa',l:'#4a7a36',mono:1},
  char:{b:'#d2465a',c:'#a02a3a',h:'#d2465a',e:'#ffd84a',a:'#f2c43d',l:'#a02a3a',mono:1},eva02:{b:'#d23a2e',c:'#f2a83a',h:'#d23a2e',e:'#5fe06a',a:'#f2f2f0',l:'#a02a22'},
  eva01:{b:'#6a3ab0',c:'#5fe06a',h:'#6a3ab0',e:'#5fe06a',a:'#ff9a3a',l:'#4a2488'},opt:{b:'#d23a2e',c:'#7fd0ff',h:'#2a5ab8',e:'#7fd0ff',a:'#c8ccd2',l:'#2a5ab8'},
  maz:{b:'#3a3a44',c:'#d23a2e',h:'#3a3a44',e:'#ffd84a',a:'#c8ccd2',l:'#26262c'},wing:{b:'#f2f2f0',c:'#2a5ab8',h:'#f2f2f0',e:'#5fe06a',a:'#f2c43d',l:'#2a5ab8',wing:1}};
// robot tí hon (đứng bàn, xếp tủ kính)
function tinyBot(P,ox,oy,k){ const C=TOY[k]; if(k==='haro'){ P.rect(ox+1,oy+5,6,5,'#5fe06a'); P.rect(ox+2,oy+4,4,1,'#5fe06a'); P.rect(ox+1,oy+8,6,2,'#3fae4a'); P.px(ox+2,oy+6,'#16161c'); P.px(ox+5,oy+6,'#16161c'); P.rect(ox+3,oy+8,2,1,'#16161c'); P.rect(ox,oy+11,8,1,'#26262c'); return; }
  if(C.wing){ P.rect(ox-1,oy+2,2,5,'#f2f2f0'); P.rect(ox+7,oy+2,2,5,'#f2f2f0'); }
  P.rect(ox+2,oy,4,3,C.h); if(C.mono) P.px(ox+3,oy+1,C.e); else { P.px(ox+2,oy+1,C.e); P.px(ox+5,oy+1,C.e); } P.px(ox+3,oy,C.a); P.px(ox+4,oy,C.a);
  P.rect(ox+1,oy+3,6,4,C.b); P.rect(ox+2,oy+3,4,2,C.c); P.rect(ox,oy+3,1,4,C.b); P.rect(ox+7,oy+3,1,4,C.b); P.rect(ox+2,oy+7,2,4,C.l); P.rect(ox+4,oy+7,2,4,C.l); P.rect(ox,oy+11,8,1,'#26262c'); }
const deskToy=k=>S(10,13,5,12,(g,P)=>tinyBot(P,1,0,k));
// robot mini trên đế (kệ treo tường)
function miniBot(P,ox,oy,k){ const C=TOY[k]; if(C.wing){ P.rect(ox-2,oy+4,3,8,'#f2f2f0'); P.rect(ox+11,oy+4,3,8,'#f2f2f0'); P.px(ox-2,oy+12,'#c8ccd2'); P.px(ox+13,oy+12,'#c8ccd2'); }
  P.rect(ox+3,oy+1,6,5,C.h); P.rect(ox+3,oy+3,6,2,'#16161c'); if(C.mono) P.rect(ox+5,oy+3,2,2,C.e); else { P.px(ox+4,oy+3,C.e); P.px(ox+7,oy+3,C.e); }
  P.px(ox+4,oy,C.a); P.px(ox+7,oy,C.a); P.px(ox+5,oy+1,C.a); P.px(ox+6,oy+1,C.a);
  P.rect(ox,oy+6,3,3,C.b); P.rect(ox+9,oy+6,3,3,C.b); P.rect(ox+2,oy+6,8,6,C.b); P.rect(ox+3,oy+7,6,3,C.c); if(C.r) P.rect(ox+4,oy+10,4,2,C.r);
  P.rect(ox,oy+9,2,4,C.b); P.rect(ox+10,oy+9,2,4,C.b); P.rect(ox+3,oy+12,3,5,C.l); P.rect(ox+6,oy+12,3,5,C.l); P.rect(ox+2,oy+16,4,1,C.a); P.rect(ox+6,oy+16,4,1,C.a); }
const robotWall=()=>S(52,26,26,25,(g,P)=>{ P.rect(0,21,52,3,'#5a4232'); P.rect(0,21,52,1,'#7a5a42'); P.rect(4,24,2,2,'#3a2a22'); P.rect(46,24,2,2,'#3a2a22');
  ['rx','zaku','wing','eva02'].forEach((k,i)=>miniBot(P,2+i*12,4,k)); });
// tủ kính trưng mô hình: 3 tầng robot tí hon, đèn LED trắng
const toyCabinet=()=>S(42,54,21,52,(g,P)=>{ P.rect(0,0,42,52,'#26262c'); P.rect(2,2,38,46,'#1a2030'); P.rect(2,2,38,1,'#e8f4ff');
  const ks=['rx','zaku','eva01','opt','maz','haro','eva02','wing','char','rx','haro','zaku']; for(let s=0;s<3;s++){ const y=4+s*15; P.rect(2,y+12,38,2,'#c8d4e0'); for(let i=0;i<4;i++) tinyBot(P,4+i*9,y,ks[s*4+i]); }
  P.rect(2,2,1,46,'rgba(255,255,255,.25)'); P.rect(20,2,1,46,'#3a3a44'); P.rect(18,26,1,4,'#c8ccd2'); P.rect(22,26,1,4,'#c8ccd2'); P.rect(0,48,42,4,'#16161c'); });
// tượng Zaku cỡ người (mắt hồng quét qua lại) và Optimus Prime trên bệ
const zakuStatue=(fr=0)=>S(28,46,14,44,(g,P)=>{ const G='#6a9a4a', D='#4a7a36', M='#9aa0aa';
  P.rect(3,37,22,8,'#26262c'); P.rect(3,37,22,1,'#3a3a44'); P.rect(10,40,8,2,'#c8a23a');
  P.rect(8,25,5,10,G); P.rect(15,25,5,10,G); P.rect(7,33,7,3,D); P.rect(14,33,7,3,D); P.rect(7,21,14,5,D);
  P.rect(7,12,14,10,G); P.rect(9,14,1,6,M); P.rect(18,14,1,6,M); P.rect(11,13,6,5,D);
  P.rect(1,10,7,7,D); for(const x of [2,4,6]) P.px(x,9,M); P.rect(20,10,7,9,G); P.rect(21,11,5,7,D); P.rect(3,17,4,8,G); P.rect(3,24,4,2,M); P.rect(22,19,4,6,G); P.rect(22,24,4,2,M);
  P.rect(10,3,8,9,G); P.rect(11,2,6,1,G); P.rect(10,6,8,2,'#16161c'); P.rect(11+[0,2,4,2][fr%4],6,2,2,'#ff4a8a'); P.rect(12,10,1,3,M); P.rect(15,10,1,3,M); P.px(14,1,D); });
const optimusStatue=()=>S(28,48,14,46,(g,P)=>{ const R='#d23a2e', B='#2a5ab8', Sl='#c8ccd2';
  P.rect(3,39,22,8,'#26262c'); P.rect(3,39,22,1,'#3a3a44'); P.rect(10,42,8,2,'#c8a23a');
  P.rect(8,27,5,11,B); P.rect(15,27,5,11,B); P.rect(8,30,5,2,Sl); P.rect(15,30,5,2,Sl); P.rect(7,36,6,2,Sl); P.rect(15,36,6,2,Sl); P.rect(8,24,12,4,Sl); P.rect(10,25,8,1,'#8a8e96');
  P.rect(6,12,16,12,R); P.rect(7,13,6,5,'#7fd0ff'); P.rect(15,13,6,5,'#7fd0ff'); P.rect(7,13,6,1,'#e8f8ff'); P.rect(15,13,6,1,'#e8f8ff'); P.rect(11,19,6,4,Sl); for(let x=12;x<16;x+=1) if(x%2) P.rect(x,19,1,4,'#8a8e96');
  P.rect(2,12,4,7,R); P.rect(22,12,4,7,R); P.rect(2,19,4,6,B); P.rect(22,19,4,6,B); P.rect(2,25,4,2,Sl); P.rect(22,25,4,2,Sl);
  P.rect(10,3,8,9,B); P.rect(9,1,1,5,B); P.rect(18,1,1,5,B); P.rect(11,6,6,5,Sl); P.rect(11,6,2,1,'#7fd0ff'); P.rect(15,6,2,1,'#7fd0ff'); P.rect(12,9,4,2,'#8a8e96'); P.rect(13,2,2,2,Sl); });
const haro=(fr=0)=>S(12,12,6,11,(g,P)=>{ const b=fr%2; P.rect(1,2+b,10,8,'#5fe06a'); P.rect(2,1+b,8,1,'#5fe06a'); P.rect(1,7+b,10,3,'#3fae4a'); P.rect(0,4+b,1,3,'#3fae4a'); P.rect(11,4+b,1,3,'#3fae4a');
  P.rect(3,4+b,2,2,b?'#ff4a3a':'#16161c'); P.rect(7,4+b,2,2,b?'#ff4a3a':'#16161c'); P.rect(4,8+b,4,1,'#16161c'); });
// icon túi đồ: mô hình Gunpla
const ICONS7={sting:P=>{ P.rect(5,2,5,11,'#d2232e'); P.rect(5,2,5,1,'#c8ccd2'); P.rect(5,12,5,1,'#c8ccd2'); P.rect(6,5,3,4,'#ffd84a'); P.px(7,6,'#d2232e'); P.px(6,3,'#ff6a6a'); },
  migoi:P=>{ P.rect(3,5,8,8,'#f4f4f2'); P.rect(3,7,8,2,'#d23a2e'); P.rect(2,4,10,1,'#c8ccd2'); P.px(5,10,'#f2c43d'); P.px(8,11,'#f2c43d'); P.px(5,2,'rgba(255,255,255,.7)'); P.px(8,1,'rgba(255,255,255,.7)'); P.px(7,3,'rgba(255,255,255,.6)'); },
  gunpla:P=>{ P.rect(4,4,6,5,'#f2f2f0'); P.rect(5,5,4,2,'#26262c'); P.px(5,6,'#5fe06a'); P.px(8,6,'#5fe06a'); P.px(4,3,'#f2c43d'); P.px(9,3,'#f2c43d'); P.rect(3,9,8,3,'#2a5ab8'); P.rect(5,12,1,2,'#f2f2f0'); P.rect(8,12,1,2,'#f2f2f0'); P.rect(1,9,2,3,'#f2f2f0'); P.rect(11,9,2,3,'#d23a2e'); }};
const oldIcon7=A.icon; A.icon=function(name,scale=1){ const f=ICONS7[name]; if(!f) return oldIcon7(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
Object.assign(A,{deskToy,robotWall,toyCabinet,zakuStatue,optimusStatue,haro,snackRack,nightWindow,nmDesk,nmTV,kanban,figShelf,modelTable,gameCorner,saunaWall,saunaWallV,saunaBench,saunaHeater,bucket,gundam,eva});
})();
