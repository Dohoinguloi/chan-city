/* Lính Cát: 30 loài tự thiết kế vẽ bằng code (7 dòng tiến hoá 3 cấp + Cát Con và 8 dạng tiến hoá theo hệ), vật nuôi / thú rừng làm đối thủ,
   Bóng Cát 3 khung (đóng / hé mở / mở bung), nội thất Trung tâm Lính Cát: sàn ô, tường kem sọc đỏ, quầy y tá, máy hồi máu, bàn 3 bóng khởi đầu,
   máy gửi giữ, kệ hàng, logo sàn. Mỗi con là sprite 28×28, chân chạm đáy (neo 14,27), nhìn chéo về bên trái. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, hash=A.hash, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), t3=(...a)=>A.text3(...a);
const K='#1c1516', WH='#ffffff';
const ell=(P,cx,cy,rx,ry,c)=>{ for(let y=-ry;y<=ry;y++){ const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry||1)))); P.rect(cx-w,cy+y,w*2+1,1,c); } };
const eye=(P,x,y,c=K)=>{ P.rect(x,y,2,2,c); P.px(x,y,WH); };
const blush=(P,x,y,c='#ff7a8a')=>P.rect(x,y,2,1,c);

/* ---------- 7 dòng tiến hoá ---------- */
function fireLine(P,st){ const B=['#ff9a3a','#ff6a2a','#ff8a2a'][st-1], Bd=['#d8702a','#c8401a','#c85a1a'][st-1], cr='#ffe0a0', s=st;
  const fl=(x,y,k)=>{ P.rect(x,y-k,3,k+1,'#ffd84a'); P.rect(x+1,y-k-2,1,2,'#ffd84a'); P.rect(x,y-k+1,3,k-1,'#ff5a1a'); P.px(x+1,y,'#fff3b0'); };
  if(s===3){ P.rect(1,6,7,9,'#3a8a8a'); P.rect(20,6,7,9,'#3a8a8a'); P.rect(2,7,5,7,'#5ab0b0'); P.rect(21,7,5,7,'#5ab0b0'); }
  const h=[11,14,17][s-1], w=[9,11,13][s-1], top=27-h; ell(P,14,top+h/2+2,w/2|0,h/2|0,B); ell(P,14,top+h/2+4,(w/2|0)-2,(h/2|0)-3,cr);
  ell(P,13,top-1,[5,6,6][s-1],[4,5,5][s-1],B); eye(P,9,top-2); eye(P,15,top-2); P.rect(11,top+1,4,1,Bd); P.px(14,top+1,'#fff');
  if(s>=2){ P.rect(15,top-6,2,3,Bd); P.px(16,top-7,Bd); } if(s===3){ P.rect(9,top-7,2,3,Bd); }
  P.rect(9,26,3,2,Bd); P.rect(16,26,3,2,Bd); P.rect(7,top+5,2,3,B); P.rect(19,top+5,2,3,B); fl(21,23-s,2+s); P.rect(19,24-s,3,2,B); }
function grassLine(P,st){ const B=['#5ac8a8','#4ab098','#3a9a88'][st-1], sp='#2a7a6a', s=st;
  const bw=[13,16,19][s-1], by=[20,19,18][s-1]; ell(P,14,by+2,bw/2|0,[5,6,7][s-1],B); for(const [x,y] of [[9,by],[17,by+2],[12,by+4]]) P.rect(x,y,2,2,sp);
  P.rect(6,25,3,3,B); P.rect(19,25,3,3,B); ell(P,8,by-1,4,4,B); eye(P,5,by-2,'#c83a3a'); P.px(6,by-3,'#ffffff'); P.rect(4,by+1,3,1,'#2a7a6a');
  if(s===1){ ell(P,16,by-5,4,4,'#5fae46'); P.rect(16,by-10,2,3,'#3a8a3a'); P.px(18,by-11,'#7fe05a'); }
  if(s===2){ ell(P,16,by-6,5,5,'#5fae46'); ell(P,16,by-10,3,3,'#ff7aa8'); P.rect(15,by-13,3,2,'#ff9ac0'); for(const x of [9,23]) P.rect(x,by-6,3,2,'#3a8a3a'); }
  if(s===3){ ell(P,16,by-6,9,4,'#ff6a8a'); for(const [x,y] of [[8,by-6],[24,by-6],[16,by-9]]) ell(P,x,y,3,2,'#ff9ab8'); P.rect(14,by-7,4,2,'#ffd84a'); P.rect(6,by-3,4,2,'#3a8a3a'); P.rect(22,by-3,4,2,'#3a8a3a'); } }
function waterLine(P,st){ const B=['#7ac8f0','#5aa8e8','#4a88d8'][st-1], sh='#a8743e', shd='#7a5028', cr='#f4e8c0', s=st;
  const h=[12,15,18][s-1], top=27-h; ell(P,15,top+h/2+3,[6,7,9][s-1],h/2|0,sh); ell(P,15,top+h/2+3,[4,5,7][s-1],(h/2|0)-2,shd); ell(P,13,top+h/2+4,[4,5,6][s-1],(h/2|0)-2,cr);
  for(let i=0;i<3;i++) P.rect(10,top+h/2+1+i*3,6,1,'#d8c890'); ell(P,13,top,[5,6,7][s-1],[4,5,5][s-1],B); eye(P,9,top-1); eye(P,15,top-1); P.rect(11,top+2,4,1,'#2a5a8a');
  P.rect(8,26,3,2,B); P.rect(17,26,3,2,B); P.rect(6,top+6,3,3,B); P.rect(21,top+6,3,3,B);
  if(s===1) P.rect(22,top+h-2,3,2,B); if(s===2){ P.rect(7,top-6,3,3,'#c8e8ff'); P.rect(17,top-6,3,3,'#c8e8ff'); ell(P,23,top+h-3,3,3,'#e8f4ff'); }
  if(s===3){ for(const x of [6,20]){ P.rect(x,top-3,3,6,'#9aa0aa'); P.rect(x,top-4,3,1,'#c8ccd2'); P.rect(x+1,top-4,1,1,K); } } }
function elecLine(P,st){ const B=['#fff07a','#ffd84a','#f2a83a'][st-1], s=st, tip='#2a2026';
  const h=[10,13,16][s-1], top=27-h; ell(P,14,top+h/2+2,[5,6,7][s-1],h/2|0,B); ell(P,13,top-1,[5,6,7][s-1],[4,5,5][s-1],B);
  const ear=[5,7,8][s-1]; P.rect(8,top-3-ear,3,ear,B); P.rect(8,top-3-ear,3,2,tip); P.rect(16,top-3-ear,3,ear,B); P.rect(16,top-3-ear,3,2,tip);
  eye(P,9,top-2); eye(P,15,top-2); P.rect(7,top+1,2,2,'#4ab0ff'); P.px(6,top,'#bff0ff'); P.rect(18,top+1,2,2,'#4ab0ff'); P.px(20,top,'#bff0ff'); P.px(12,top-4,'#a8761e'); P.px(13,top-3,'#a8761e'); P.px(12,top-2,'#a8761e'); P.rect(12,top+1,2,1,'#8a4a2a');
  P.rect(9,26,3,2,B); P.rect(15,26,3,2,B); const ty=top+h/2; P.rect(20,ty,3,2,'#a8761e'); P.rect(22,ty-3,3,3,B); P.rect(21,ty-6,4,3,B); P.rect(24,ty-8,3,3,B);
  if(s===3){ P.rect(14,top+5,1,6,'#a8761e'); P.rect(8,top+9,10,1,'#fff3b0'); } if(s===1){ P.rect(8,top+3,10,1,'#fff8c0'); } }
function fairyLine(P,st){ const B=['#ffb8d8','#ff9ac8','#ffb0d0'][st-1], d='#e870a8', s=st;
  if(s===3){ for(const x of [3,21]){ ell(P,x+2,12,3,5,'#e8f4ff'); ell(P,x+2,12,2,4,'#ffffff'); } }
  const r=[6,8,8][s-1], cy=[20,18,15][s-1]; ell(P,14,cy,r,r,B); if(s===3){ ell(P,14,cy+8,6,5,B); P.rect(9,25,3,3,B); P.rect(16,25,3,3,B); }
  P.rect(13,cy-r-2,3,3,B); P.px(15,cy-r-3,B); P.px(16,cy-r-2,d); if(s>=2){ P.rect(7,cy-r+1,3,3,B); P.rect(18,cy-r+1,3,3,B); P.px(8,cy-r+2,d); P.px(19,cy-r+2,d); }
  eye(P,10,cy-1); eye(P,16,cy-1); blush(P,9,cy+2); blush(P,17,cy+2); P.rect(13,cy+2,2,1,d);
  for(const [x,y] of [[8,cy+4],[20,cy-3]]) P.px(x,y,d); if(s===1){ P.rect(10,cy+r-1,3,2,B); P.rect(15,cy+r-1,3,2,B); } }
function ghostLine(P,st){ const s=st;
  if(s===1){ ell(P,14,16,10,9,'rgba(170,110,230,.55)'); ell(P,14,16,6,6,'#2a1a3a'); eye(P,10,14,'#ffffff'); eye(P,16,14,'#ffffff'); P.px(11,15,K); P.px(17,15,K); P.rect(12,19,4,1,'#c84a6a'); return; }
  if(s===2){ ell(P,14,13,8,7,'#8a5ad8'); for(let i=0;i<4;i++) P.rect(6+i*4,19,3,3+(i%2),'#8a5ad8'); for(const x of [6,18]) P.rect(x,7,3,4,'#8a5ad8'); eye(P,10,11,'#fff0a0'); eye(P,16,11,'#fff0a0'); P.px(11,12,'#c83a3a'); P.px(17,12,'#c83a3a');
    P.rect(10,15,8,2,'#2a1a3a'); for(let x=10;x<18;x+=2) P.px(x,15,'#ffffff'); ell(P,3,17,2,2,'#8a5ad8'); ell(P,25,17,2,2,'#8a5ad8'); return; }
  ell(P,14,16,10,10,'#6a3ab0'); for(const [x,y] of [[5,6],[9,4],[19,4],[23,6],[4,12],[24,12]]) P.rect(x,y,3,3,'#6a3ab0'); P.rect(7,25,4,3,'#6a3ab0'); P.rect(17,25,4,3,'#6a3ab0');
  eye(P,9,12,'#ff4a4a'); eye(P,17,12,'#ff4a4a'); P.rect(8,18,12,3,'#ff9ad0'); for(let x=8;x<20;x+=2) P.px(x,18,'#ffffff'); }
function dragonLine(P,st){ const s=st;
  if(s<3){ const B=s===1?'#6a8ae8':'#5a7ad8', bel='#e8f0ff', L=s===1?4:6;
    for(let i=0;i<L;i++){ const x=6+i*3, y=24-Math.round(Math.sin(i*.9)*2)-(s===2?i*1.2:0); ell(P,x,y,2,2,B); P.px(x,y+1,bel); }
    const hx=s===1?8:7, hy=s===1?17:10; ell(P,hx,hy,4,4,B); P.rect(hx-4,hy+1,8,2,bel); eye(P,hx-2,hy-1); P.rect(hx+2,hy-5,3,2,'#ffffff'); P.rect(hx+3,hy-6,2,1,'#c8d8ff');
    if(s===2){ P.disc(hx,hy+6,1,'#4ab0ff'); for(const y of [16,21]) P.disc(22,y,1,'#4ab0ff'); } return; }
  const B='#f2a83a', bel='#ffe0a0'; P.rect(2,8,7,8,'#3a8a6a'); P.rect(19,8,7,8,'#3a8a6a'); ell(P,14,18,7,8,B); ell(P,14,20,5,6,bel); ell(P,12,8,5,4,B); eye(P,9,7); eye(P,14,7);
  P.rect(10,2,1,4,B); P.rect(15,2,1,4,B); P.rect(9,26,3,2,B); P.rect(16,26,3,2,B); P.rect(21,20,4,3,B); P.rect(24,17,3,3,B); }
/* ---------- Cát Con và 8 dạng tiến hoá ---------- */
const FOX={cat_con:{B:'#c8945a',d:'#8a5a32',m:'#f4e8c8'},cat_hoa:{B:'#ff7a3a',d:'#c84a1a',m:'#ffe07a',x:'mane'},cat_thuy:{B:'#5ab0e8',d:'#2a7ab8',m:'#f4f8ff',x:'fin'},
  cat_loi:{B:'#ffd84a',d:'#c8a020',m:'#ffffff',x:'spike'},cat_la:{B:'#f0e0b0',d:'#5fae46',m:'#8ad06a',x:'leaf'},cat_bang:{B:'#9ae0f0',d:'#3a8ab8',m:'#e8f8ff',x:'ice'},
  cat_tien:{B:'#f4f2ec',d:'#ff8ab8',m:'#8ac8ff',x:'ribbon'},cat_nguyet:{B:'#2a2a36',d:'#16161c',m:'#f2c43d',x:'ring'},cat_than:{B:'#d8a8e8',d:'#a86ac8',m:'#ff4a8a',x:'gem'}};
function fox(P,id){ const F=FOX[id], x=F.x;
  P.rect(18,14,6,3,F.B); P.rect(21,11,5,5,F.B); P.rect(23,9,3,3,x==='spike'?F.B:F.m); if(x==='fin') P.rect(20,10,6,2,F.d); if(x==='leaf') ell(P,23,11,3,3,F.d);
  ell(P,15,20,7,5,F.B); P.rect(8,24,3,4,F.B); P.rect(18,24,3,4,F.B); P.rect(12,25,2,3,F.d); P.rect(15,25,2,3,F.d);
  if(x==='mane'||!x||x==='ribbon'){ ell(P,10,16,4,4,F.m); } if(x==='spike'){ for(const [a,b] of [[13,14],[16,13],[19,15],[10,15]]) P.rect(a,b-2,2,3,F.m); }
  ell(P,9,12,5,5,F.B); P.rect(4,4,3,7,F.B); P.rect(12,3,3,7,F.B); P.rect(5,6,1,4,F.d); P.rect(13,5,1,4,F.d);
  if(x==='leaf'){ P.rect(3,3,4,4,F.d); P.rect(12,2,4,4,F.d); } if(x==='ice'){ for(const [a,b] of [[16,18],[19,21],[13,22]]) P.rect(a,b,2,2,F.m); } if(x==='ring'){ for(const [a,b] of [[8,8],[16,19],[22,12],[9,24]]) P.rect(a,b,2,2,F.m); }
  if(x==='gem') P.rect(8,7,2,2,F.m); if(x==='ribbon'){ P.rect(13,9,4,2,F.d); P.rect(16,10,2,6,F.d); P.rect(5,17,2,5,F.m); }
  eye(P,6,11); eye(P,10,11); P.rect(4,14,3,1,F.d); P.px(3,13,K); if(x==='fin'){ P.rect(7,8,4,2,F.d); } }
/* ---------- vật nuôi / thú rừng ---------- */
function beast(P,id){
  if(id==='lon'){ ell(P,14,19,9,6,'#f4b0b8'); ell(P,6,17,5,5,'#f4b0b8'); P.rect(1,17,4,3,'#e88a98'); P.px(2,18,K); P.px(4,18,K); eye(P,6,15); P.rect(5,11,3,3,'#e88a98'); for(const x of [8,12,17,21]) P.rect(x,24,2,4,'#e88a98'); P.px(24,17,'#e88a98'); P.px(25,16,'#e88a98'); return; }
  if(id==='bo'){ ell(P,15,17,10,6,'#c8945a'); ell(P,5,14,5,5,'#c8945a'); P.rect(1,15,5,4,'#f4d8b0'); P.rect(2,8,2,3,'#f4f2ec'); P.rect(8,8,2,3,'#f4f2ec'); eye(P,4,13); for(const x of [8,12,18,22]) P.rect(x,22,2,6,'#8a5a32'); P.rect(25,15,1,7,'#8a5a32'); return; }
  if(id==='ga'){ ell(P,15,19,7,6,'#c84a2a'); ell(P,8,12,4,4,'#c84a2a'); P.rect(7,6,4,3,'#e8302a'); P.rect(3,12,2,2,'#f2c43d'); eye(P,7,11); P.rect(19,10,4,8,'#2a5a3a'); P.rect(22,8,3,6,'#1c3a2a'); P.rect(12,25,1,3,'#f2c43d'); P.rect(16,25,1,3,'#f2c43d'); return; }
  if(id==='vit'){ ell(P,15,20,8,5,'#f4f2ec'); ell(P,8,13,4,4,'#3a8a4a'); P.rect(2,14,4,2,'#f2a83a'); eye(P,7,12); P.rect(4,17,3,1,'#f4f2ec'); P.rect(20,16,4,3,'#c8ccd2'); P.rect(12,25,3,2,'#f2a83a'); P.rect(17,25,3,2,'#f2a83a'); return; }
  if(id==='huou'){ ell(P,15,17,8,5,'#c8743a'); for(const [x,y] of [[11,15],[15,14],[18,17],[13,19]]) P.rect(x,y,2,1,'#ffffff'); ell(P,6,11,3,4,'#c8743a'); P.rect(4,3,1,5,'#8a5a32'); P.rect(3,3,3,1,'#8a5a32'); P.rect(8,3,1,5,'#8a5a32'); P.rect(7,3,3,1,'#8a5a32'); eye(P,5,10); for(const x of [9,12,18,21]) P.rect(x,21,2,7,'#8a5a32'); return; }
  if(id==='raica'){ ell(P,14,21,9,4,'#8a5a32'); ell(P,6,17,4,4,'#8a5a32'); ell(P,6,19,3,2,'#c8a07a'); eye(P,4,16); eye(P,8,16); P.px(6,18,K); P.rect(22,22,5,2,'#6a4228'); P.rect(9,25,2,3,'#6a4228'); P.rect(17,25,2,3,'#6a4228'); return; }
  if(id==='gau'){ ell(P,14,18,10,9,'#2a2226'); ell(P,14,10,6,6,'#2a2226'); P.rect(8,4,3,3,'#2a2226'); P.rect(17,4,3,3,'#2a2226'); P.rect(9,15,10,3,'#f4f2ec'); P.rect(11,12,6,3,'#6a5a50'); P.px(14,12,K); eye(P,10,8); eye(P,16,8); P.rect(6,25,5,3,'#2a2226'); P.rect(17,25,5,3,'#2a2226'); return; }
  if(id==='voc'){ ell(P,14,19,6,6,'#3a3a40'); ell(P,13,10,5,5,'#3a3a40'); ell(P,13,11,3,3,'#f2c8a0'); eye(P,11,10); eye(P,14,10); P.rect(7,17,2,7,'#3a3a40'); P.rect(19,17,2,7,'#3a3a40'); P.rect(19,22,2,6,'#f4f2ec'); P.rect(10,25,3,3,'#3a3a40'); P.rect(15,25,3,3,'#3a3a40'); P.rect(21,12,1,10,'#3a3a40'); return; } }
const LINE={lua_nhi:[fireLine,1],hoa_binh:[fireLine,2],hoa_tuong:[fireLine,3],mam_nhi:[grassLine,1],la_binh:[grassLine,2],moc_tuong:[grassLine,3],rua_nhi:[waterLine,1],thuy_binh:[waterLine,2],thuy_tuong:[waterLine,3],
  ti_set:[elecLine,1],set_binh:[elecLine,2],loi_tuong:[elecLine,3],bong_bong:[fairyLine,1],bong_hong:[fairyLine,2],tien_bong:[fairyLine,3],khoi_nhi:[ghostLine,1],bong_ma_binh:[ghostLine,2],quy_tuong:[ghostLine,3],
  rong_nhi:[dragonLine,1],rong_may:[dragonLine,2],long_vuong:[dragonLine,3]};
const LCC=new Map(); A.LC_DRAW=A.LC_DRAW||{};   // art10.js thêm các loài mới vào đây
A.lcKit={ell,eye,blush};
// fr: 0/1 nhún nhẹ (dịch 1px), flip: quay mặt sang phải (Lính Cát của mình khi đấu)
A.linhcat=(id,fr=0,flip=false)=>{ const k=id+fr+flip; if(LCC.has(k)) return LCC.get(k);
  const sp=S(28,28,14,27,(g,P)=>{ const f=A.LC_DRAW[id]; if(f) f(P); else if(LINE[id]) LINE[id][0](P,LINE[id][1]); else if(FOX[id]) fox(P,id); else beast(P,id); });
  let out=sp; if(fr||flip){ const c=A.cv(28,28), g=c.getContext('2d'); if(flip){ g.translate(28,0); g.scale(-1,1); } g.drawImage(sp.c,0,fr?-1:0); out={c,ax:14,ay:27}; }
  LCC.set(k,out); return out; };
/* ---------- Bóng Cát: 0 đóng, 1 hé mở, 2 mở bung (gold: Bóng Cát Vàng) ---------- */
A.lcBall=(fr=0,gold=false)=>{ const top=gold==='ht'?'#9a4ae8':gold?'#f2c43d':'#e8302a', topD=gold==='ht'?'#5a1a9a':gold?'#c8901a':'#b81a1a';   /* gold 'ht': Bóng Huyền Thoại tím */
  return S(14,14,7,13,(g,P)=>{ if(fr===0){ ell(P,7,7,6,6,'#f4f4f2'); for(let y=1;y<7;y++){ const w=Math.round(6*Math.sqrt(1-((y-7)*(y-7))/36)); P.rect(7-w,y,w*2+1,1,y<4?top:topD); }
      P.rect(1,7,13,1,K); P.disc(7,7,2,K); P.disc(7,7,1,'#ffffff'); P.rect(4,2,2,1,'#ffb0a8'); P.rect(2,10,10,1,'#c8ccd2'); return; }
    if(fr===1){ ell(P,7,8,6,5,'#f4f4f2'); ell(P,7,8,4,3,'#2a1a1c'); for(let y=1;y<5;y++) P.rect(2+y%2,y,10,1,y<3?top:topD); P.rect(5,4,3,1,'#ffffff'); P.rect(2,11,10,1,'#c8ccd2'); return; }
    ell(P,7,9,6,4,'#c8ccd2'); ell(P,7,9,5,3,K); P.rect(3,1,9,4,'#9aa0aa'); P.rect(3,1,4,4,'#c8ccd2'); for(const x of [2,4,9,11]) P.px(x,0,top); P.rect(2,12,10,1,'#c8ccd2'); }); };
/* ---------- nội thất Trung tâm Lính Cát ---------- */
A.WALKABLE.add('5');
TE['5']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,(tx+ty)%2?'#f4efe2':'#e8e0cc'); P.rect(X,Y,T,1,'#ddd4bc'); P.rect(X,Y,1,T,'#ddd4bc'); if(hash(tx,ty,91)<.1) P.px(X+5,Y+9,'#d4ccb4'); };
TE['6']=(g,X,Y,tx,ty,nb,fr,P)=>{ const below=nb(0,1); if(below==='5'){ P.rect(X,Y,T,T,'#f4ecd8'); P.rect(X,Y+9,T,3,'#d23a2e'); P.rect(X,Y+12,T,4,'#c8b89a'); if(tx%4===0) P.rect(X+2,Y+2,12,5,'#9ad0f0'); }
  else { P.rect(X,Y,T,T,'#3a2a22'); P.rect(X,Y,T,1,'#5a4232'); } };
A.lcCounter=(w=112)=>S(w,30,w/2,28,(g,P)=>{ P.rect(0,8,w,20,'#f4f2ec'); P.rect(0,8,w,3,'#d23a2e'); P.rect(0,22,w,6,'#d23a2e'); P.rect(0,27,w,1,'#a81a1a');
  for(let x=8;x<w-8;x+=24){ P.rect(x,13,14,6,'#e8e0cc'); } P.rect(w/2-10,1,20,8,'#26262c'); P.rect(w/2-9,2,18,5,'#7fd0ff'); P.rect(w/2-2,9,4,1,'#3a3a44'); t3(P,w/2-26,14,'LE TAN','#d23a2e'); });
A.healMachine=(fr=0)=>S(44,40,22,38,(g,P)=>{ P.rect(2,16,40,22,'#e8ecef'); P.rect(2,16,40,3,'#c8d0d8'); P.rect(2,34,40,4,'#9aa0aa'); ell(P,22,12,14,9,fr%2?'#ff8a8a':'#ff6a6a'); ell(P,22,10,10,5,'#ffc0c0'); P.rect(19,4,5,2,'#ffffff');
  for(let i=0;i<6;i++){ const x=7+i*5.5|0; P.disc(x,26,2,i<(fr%7)?'#e8302a':'#c8ccd2'); P.px(x,26,'#ffffff'); } P.rect(16,30,12,3,'#26262c'); P.rect(17,31,10,1,fr%2?'#5fe06a':'#2a7a3a'); });
A.starterTable=()=>S(60,30,30,28,(g,P)=>{ P.rect(2,8,56,14,'#7ac87a'); P.rect(2,8,56,2,'#a8e0a8'); P.rect(0,20,60,4,'#e8ecef'); P.rect(4,24,3,6,'#9aa0aa'); P.rect(53,24,3,6,'#9aa0aa');
  for(const x of [14,30,46]){ ell(P,x,13,5,5,'#f4f4f2'); for(let y=8;y<13;y++){ const w=Math.round(5*Math.sqrt(1-((y-13)*(y-13))/25)); P.rect(x-w,y,w*2+1,1,'#e8302a'); } P.rect(x-5,13,11,1,K); P.disc(x,13,1,'#ffffff'); P.px(x-2,9,'#ffb0a8'); } });
A.pcBox=(fr=0)=>S(30,40,15,38,(g,P)=>{ P.rect(2,4,26,34,'#c8d0d8'); P.rect(2,4,26,2,'#e8ecef'); P.rect(5,8,20,13,'#26262c'); P.rect(6,9,18,11,fr%2?'#3a8ad8':'#2a6ab8'); for(let i=0;i<3;i++) P.rect(8,11+i*3,8+((fr+i)%3)*2,1,'#bfe8ff');
  P.rect(5,24,20,6,'#9aa0aa'); for(let i=0;i<4;i++) P.rect(7+i*5,26,3,2,'#e8ecef'); P.rect(12,32,6,3,'#e8302a'); t3(P,6,1,'GUI GIU','#26262c'); });
A.lcShelf=()=>S(46,46,23,44,(g,P)=>{ P.rect(0,0,46,44,'#c8945a'); P.rect(2,2,42,40,'#f4ecd8'); for(const y of [14,28]) P.rect(2,y,42,2,'#a8743e');
  for(let i=0;i<5;i++){ const x=5+i*8; ell(P,x+2,9,3,3,'#f4f4f2'); P.rect(x-1,6,7,3,i%2?'#f2c43d':'#e8302a'); P.rect(x-1,9,7,1,K); }
  for(let i=0;i<5;i++){ const x=5+i*8; P.rect(x,19,5,8,'#7ad8a8'); P.rect(x+1,17,3,2,'#e8ecef'); P.rect(x+1,22,3,2,'#ffffff'); }
  const st=['#ff7a3a','#4ab0ff','#f2c43d','#5fae46','#7fd8f0','#ff8ad2','#5a4a6a','#e86ab8']; st.forEach((c,i)=>{ const x=4+i*5; P.rect(x,33,4,5,c); P.px(x+1,34,'#ffffff'); }); });
A.lcEmblem=()=>S(64,40,32,20,(g,P)=>{ ell(P,32,20,30,18,'rgba(210,58,46,.28)'); ell(P,32,20,26,15,'rgba(244,239,226,.6)'); P.rect(6,19,52,3,'rgba(210,58,46,.5)'); ell(P,32,20,8,6,'rgba(210,58,46,.55)'); ell(P,32,20,4,3,'rgba(255,255,255,.9)'); },false);
/* ---------- icon túi đồ ---------- */
const ST={hoa:'#ff7a3a',thuy:'#4ab0ff',loi:'#f2c43d',moc:'#5fae46',bang:'#7fd8f0',tien:'#ff8ad2',am:'#5a4a6a',than:'#e86ab8'};
const ICONS9={lcball:P=>{ ell(P,7,7,5,5,'#f4f4f2'); for(let y=2;y<7;y++){ const w=Math.round(5*Math.sqrt(1-((y-7)*(y-7))/25)); P.rect(7-w,y,w*2+1,1,'#e8302a'); } P.rect(2,7,11,1,K); P.disc(7,7,1,'#ffffff'); },
  lcball3:P=>{ ell(P,7,7,5,5,'#f4f4f2'); for(let y=2;y<7;y++){ const w=Math.round(5*Math.sqrt(1-((y-7)*(y-7))/25)); P.rect(7-w,y,w*2+1,1,y<4?'#b87aff':'#8a3ad8'); } P.rect(2,7,11,1,K); P.disc(7,7,1,'#ffffff'); P.px(4,3,'#f4e8ff'); P.px(10,4,'#f2c43d'); P.px(3,5,'#f2c43d'); },
  lcball2:P=>{ ell(P,7,7,5,5,'#f4f4f2'); for(let y=2;y<7;y++){ const w=Math.round(5*Math.sqrt(1-((y-7)*(y-7))/25)); P.rect(7-w,y,w*2+1,1,'#f2c43d'); } P.rect(2,7,11,1,K); P.disc(7,7,1,'#ffffff'); P.px(4,3,'#fff3b0'); },
  lcpotion:P=>{ P.rect(5,2,4,2,'#e8ecef'); P.rect(4,4,6,8,'#7ad8a8'); P.rect(5,5,1,5,'#c8ffe8'); P.rect(6,7,2,1,'#ffffff'); P.rect(6,6,1,3,'#ffffff'); }};
for(const [k,c] of Object.entries(ST)) ICONS9['lcstone_'+k]=P=>{ P.rect(4,3,6,9,c); P.rect(3,5,8,5,c); P.rect(5,4,2,3,'#ffffff'); P.px(9,9,'rgba(0,0,0,.3)'); };
const oldIcon9=A.icon; A.icon=function(name,scale=1){ const f=ICONS9[name]; if(!f) return oldIcon9(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
})();
