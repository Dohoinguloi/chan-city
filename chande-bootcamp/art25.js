/* Lính Cát 200 loài: vẽ tự động 41 họ mới theo SHARED.LC_SPECIES[k].art {plan dáng, c màu [thân, tối, sáng, điểm nhấn], st bậc, f chi tiết}.
   Khung 28×28 nhìn chéo sang trái như art9, chân chạm đáy (neo 14,27); bậc 1 nhỏ ×0,72, bậc 2 ×0,86, bậc 3 to đủ khung, bậc cao thêm sừng / bờm / cánh.
   Kèm 2 rồng huyền thoại Hắc Long, Bạch Long; viền hào quang dạng Huyền Thoại Lv50; Tế đàn Rồng Thần; cổng võ đài CLB theo màu hệ. */
(function(){
const A=ART, D=A.LC_DRAW, {ell,eye}=A.lcKit, K='#1c1516', WH='#ffffff', SD=SHARED;
const at=(f,k,st)=>{ const v=f[k]; return v===undefined?false:v===1||v===true?true:typeof v==='number'?st>=v:v; };   /* chi tiết f.k: 1 mọi bậc, số n: từ bậc n */
function kit(P,a){ const s=[0,.72,.86,1][a.st]||1, X=x=>Math.round(14+(x-14)*s), Y=y=>Math.round(27-(27-y)*s), R=r=>Math.max(1,Math.round(r*s)), N=v=>Math.max(1,Math.round(v*s));
  const [B,Dk,L,Ac]=a.c.map(h=>'#'+h);
  return {B,Dk,L,Ac,s,e:(x,y,rx,ry,c)=>ell(P,X(x),Y(y),R(rx),R(ry),c),r:(x,y,w,h,c)=>P.rect(X(x),Y(y),N(w),N(h),c),p:(x,y,c)=>P.px(X(x),Y(y),c),ey:(x,y,c)=>eye(P,X(x),Y(y),c)}; }
const HORN='#f4f1ea', WOOD='#8a5a32', LEAF='#5fae46', GOLD='#f2c43d';
/* ---------- tai, đuôi, sừng dùng chung ---------- */
function ears(k,f,st,hx,hy){ const {B,Dk,L,e,r}=k, t=f.ear; if(!t) return;
  if(t==='pointy'){ r(hx-3,hy-6,2,4,B); r(hx+2,hy-6,2,4,B); r(hx-3,hy-5,1,2,Dk); r(hx+2,hy-5,1,2,Dk); }
  if(t==='cat'){ r(hx-3,hy-5,2,3,B); r(hx+2,hy-5,2,3,B); r(hx-3,hy-6,1,1,B); r(hx+3,hy-6,1,1,B); }
  if(t==='round'){ e(hx-3,hy-4,2,2,B); e(hx+3,hy-4,2,2,B); e(hx-3,hy-4,1,1,L); }
  if(t==='flop'){ r(hx+2,hy-2,3,6,Dk); }
  if(t==='long'){ r(hx-3,hy-11,2,8,B); r(hx+1,hy-11,2,8,B); r(hx-3,hy-9,1,5,'#ffb0c0'); r(hx+1,hy-9,1,5,'#ffb0c0'); } }
function tail(k,f,st,tx,ty){ const {B,Dk,L,Ac,e,r}=k, t=f.tail; if(!t) return;
  if(t==='fluffy'){ e(tx+2,ty-2,3,4,B); e(tx+2,ty-4,2,2,L); }
  if(t==='thin'){ r(tx,ty,4,1,Dk); r(tx+3,ty-4,1,4,Dk); }
  if(t==='short') e(tx,ty,1,1,B); if(t==='puff') e(tx,ty,2,2,L);
  if(t==='bolt'){ r(tx-1,ty,2,1,Ac); r(tx,ty-3,1,3,Ac); r(tx+1,ty-4,2,1,Ac); r(tx+2,ty-7,1,3,Ac); e(tx+2,ty-8,1,1,'#ff8a3a'); }
  if(t==='curl'){ r(tx,ty+1,4,1,Dk); r(tx+3,ty-3,1,4,Dk); r(tx+1,ty-4,2,1,Dk); }
  if(t==='thick'){ e(tx+3,ty+5,5,2,B); } }
/* ---------- 4 chân: chó, nai, cừu, mèo, tê giác, trâu, sói, thỏ ---------- */
function quad(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  tail(k,f,st,22,16);
  if(f.ice3&&st>=3) for(const [x,y,h] of [[12,11,4],[15,10,5],[18,11,4],[21,12,3]]) r(x,y,1,h,Ac);
  r(19,22,2,5,Dk); r(22,22,2,5,Dk);
  if(f.wool){ e(16,18,9,6,L); e(10,16,3,3,L); e(22,15,3,3,L); e(16,13,4,2,L); } else { e(16,19,8,5,B); e(15,21,6,2,L); }
  r(9,22,2,5,B); r(12,23,2,4,Dk); r(17,23,2,4,Dk); r(21,22,2,5,B);
  const pat=f.pat||(st===1&&f.pat1)||(st>=2&&f.pat2)||(st>=3&&f.pat3);
  if(pat==='stripes') for(let x=12;x<=21;x+=3) r(x,15,1,4,Dk); if(pat==='spots') for(const [x,y] of [[12,17],[16,16],[19,18],[14,20]]) r(x,y,2,1,f.ear==='cat'?Ac:WH);
  if(f.plates) for(const x of [11,15,19]) r(x,15,3,2,Dk);
  if(f.shell) e(15,20,3,2,Ac);
  if(f.mane&&st>=f.mane) e(11,15,4,5,f.wool?Ac:L);
  e(7,13,5,5,f.wool?B:B); r(1,14,4,3,L); p(1,14,K); ey(4,11); ey(8,11);
  if(f.coin3&&st>=3) e(6,8,2,2,Ac); if(f.moon&&st>=f.moon){ r(5,8,3,1,Ac); p(4,9,Ac); }
  ears(k,f,st,6,9);
  const h=f.horn; if(h==='antler'&&st>=2){ r(4,3,1,5,WOOD); r(2,3,3,1,WOOD); r(9,3,1,5,WOOD); r(8,2,3,1,WOOD); if(st>=3) for(const [x,y] of [[2,2],[5,2],[8,1],[11,2]]) r(x,y,2,2,Ac); }
  if(h==='nose'){ r(1,10,2,4,Ac); if(st>=2) r(1,7,1,3,Ac); if(st>=3){ r(4,9,1,2,Ac); } }
  if(h==='buffalo'){ r(1,8,4,1,Ac); r(0,6,1,2,Ac); r(9,8,4,1,Ac); r(12,6,1,2,Ac); if(st>=3){ r(0,4,1,2,Ac); r(12,4,1,2,Ac); } }
  if(f.sword3&&st>=3){ r(0,12,1,11,'#c8ccd4'); r(0,11,1,1,WH); r(0,16,3,1,GOLD); }
  if(f.wool&&st>=3) e(4,8,2,2,Ac); }
/* ---------- 2 chân: gà chọi, khỉ, ếch, tiên, người tuyết, gấu trúc, chuột túi, cóc, Tề Thiên ---------- */
function biped(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  tail(k,f,st,19,17);
  if(f.wings2&&st>=2){ e(20,11,4,6,'#e8f4ff'); e(22,15,3,4,'#d8ecff'); }
  if(f.staff3&&st>=3){ r(22,3,1,23,'#c8302a'); r(22,2,1,2,GOLD); r(22,25,1,2,GOLD); }
  if(f.stick2&&st>=2) r(21,9,1,13,WOOD);
  const panda=f.panda, legC=panda?Dk:Dk; r(10,22,3,5,legC); r(15,22,3,5,legC); r(9,26,4,1,Dk); r(14,26,4,1,Dk);
  if(f.fluff){ e(13,17,7,7,L); e(13,17,6,6,B); } else e(13,17,6,6,B);
  if(f.dress){ for(let i=0;i<8;i++) r(13-2-Math.round(i*.6),16+i,5+Math.round(i*1.2),1,i%3?WH:'#e8e8f4'); }
  else e(13,18,4,4,panda?WH:L);
  const armC=panda?Dk:B; r(6,15,2,6,armC); r(19,15,2,6,armC);
  if(f.glove){ e(6,21,2,2,Ac); e(20,21,2,2,Ac); } if(f.glove3&&st>=3){ for(const x of [5,19]){ r(x,13,3,2,'#ff8a3a'); p(x+1,12,'#ffd84a'); } }
  if(f.leafy){ e(7,13,2,2,Ac); e(19,13,2,2,Ac); }
  if(f.cheek) e(8,13,2,2,Ac);
  if(f.frog){ e(12,10,6,4,B); r(6,5,4,4,B); r(14,5,4,4,B); r(7,6,2,2,WH); r(15,6,2,2,WH); p(7,7,K); p(15,7,K); r(8,12,7,1,Dk); }
  else { e(12,9,5,5,B); if(!f.dress&&!panda) e(11,10,3,3,L); if(panda){ e(9,9,2,2,Dk); e(14,9,2,2,Dk); } ey(9,8); ey(13,8); }
  if(f.hair){ e(12,6,5,3,Ac); r(7,7,2,5,Ac); r(16,7,2,4,Ac); }
  if(f.beak){ r(5,10,3,2,'#f2a83a'); } if(f.crest){ r(11,2,1,3,Ac); r(13,3,1,2,Ac); if(st>=3) r(9,3,1,2,Ac); }
  if(f.scarf2&&st>=2){ r(8,13,9,2,Ac); r(17,14,4,1,Ac); }
  if(f.leaf){ r(12,2,3,2,LEAF); p(13,1,LEAF); } if(f.leaf1&&st===1){ r(4,12,4,1,LEAF); p(3,11,LEAF); }
  if(f.band3&&st>=3){ r(8,5,9,1,Ac); p(7,6,Ac); }
  ears(k,f,st,12,7);
  if(f.leafy){ r(10,3,5,2,Ac); p(12,2,Ac); } }
/* ---------- chim: cánh cụt, quạ, cú, vẹt, hạc, công ---------- */
function bird(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  if(f.fan&&st>=f.fan){ for(let i=0;i<7;i++){ const ang=-1.2+i*.4, x=18+Math.cos(ang)*8, y=13+Math.sin(ang)*7; e(x,y,2,2,L); e(x,y,1,1,Ac); } }
  if(f.penguin){ r(10,23,3,4,Ac); r(15,23,3,4,Ac); e(13,16,6,9,B); e(12,18,4,7,L); r(6,14,2,6,Dk); r(19,14,2,6,Dk); e(12,8,5,4,B); r(6,9,3,2,Ac); ey(10,7); ey(14,7);
    if(f.crown3&&st>=3){ r(9,1,1,3,Ac); r(12,0,1,4,Ac); r(15,1,1,3,Ac); r(9,3,7,1,Ac); } return; }
  if(f.owl){ r(11,23,1,4,'#e8a83a'); r(15,23,1,4,'#e8a83a'); e(13,17,7,7,B); e(13,19,4,5,L); e(12,10,7,6,B); e(12,11,5,4,L); r(7,9,4,4,WH); r(14,9,4,4,WH); r(8,10,2,2,K); r(15,10,2,2,K); p(12,13,Ac);
    r(6,3,2,4,Dk); r(17,3,2,4,Dk); if(st>=3){ r(5,2,1,2,Ac); r(19,2,1,2,Ac); } return; }
  r(21,15,5,2,Dk); r(23,13,4,2,B); if(st>=3) r(24,11,3,2,Ac);
  r(11,23,1,4,'#e8a83a'); r(15,23,1,4,'#e8a83a'); r(10,26,3,1,'#e8a83a'); r(14,26,3,1,'#e8a83a');
  e(14,17,7,6,B); e(12,19,4,4,L); e(17,16,4,4,Dk);
  if(f.neck){ r(7,6,2,11,B); e(7,5,3,3,B); r(0,5,5,1,'#e8c84a'); ey(6,4); if(f.crest) r(6,2,3,1,Ac); r(21,13,4,2,'#2a2a36'); return; }
  e(8,10,4,4,B); r(2,10,3,2,'#f2a83a'); ey(6,9);
  if(f.crest){ r(8,4,1,3,Ac); r(10,3,1,3,Ac); if(st>=2) r(12,4,1,3,Ac); }
  if(f.crest3&&st>=3){ r(4,4,10,2,Dk); r(6,1,6,3,Dk); r(5,6,8,1,Ac); } }
/* ---------- cá (dưới nước: phần trên 22 dòng nổi khỏi mặt nước) ---------- */
function fish(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  r(23,12,2,9,Dk); r(25,10,2,13,Dk); e(13,16,10,6,B); e(12,19,7,2,L);
  if(f.fin){ r(12,7,2,4,Dk); r(14,8,2,3,Dk); r(16,9,2,2,Dk); if(st>=3) r(10,8,2,3,Dk); r(15,20,3,3,Dk); }
  ey(6,13); if(f.teeth){ for(let x=3;x<10;x+=2) p(x,18,WH); r(3,17,7,1,K); } if(st>=3) for(const [x,y] of [[14,13],[18,14],[16,16]]) p(x,y,Ac); }
/* ---------- rắn / lươn / rồng nước ---------- */
function serpent(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  for(let i=0;i<8;i++){ const x=24-i*2.4, y=22-Math.round(Math.sin(i*1.05)*3)-i*.6; e(x,y,3,3,i%2?B:Dk); p(x,y+2,L); if(f.spots&&i%2) p(x,y-1,Ac); if(f.fin&&i%2===0) r(x,y-4,1,2,Ac); }
  e(6,9,5,4,B); r(0,10,4,3,L); ey(5,7); if(f.whisker){ r(0,13,4,1,Ac); if(st>=2) r(0,8,3,1,Ac); }
  if(f.horn&&st>=2){ r(6,2,1,4,HORN); if(st>=3) r(9,3,1,3,HORN); }
  if(f.orb&&st>=f.orb) e(10,15,2,2,'#7fd8ff'); if(st>=3) r(23,14,4,3,L); }
/* ---------- côn trùng: bọ ngựa, ong, bọ hung, bọ cạp ---------- */
function bug(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  if((f.wings||f.wings2&&st>=2)){ e(16,9,5,4,'#e8f4ff'); e(20,11,4,3,'#d8ecff'); }
  if(f.stinger&&f.claw2){ r(24,14,2,6,B); r(22,10,2,4,B); r(19,8,3,2,B); r(18,10,1,2,Ac); }
  for(const x of [9,13,17]) r(x,21,1,6,Dk);
  e(19,19,6,5,B); if(f.stripe) for(const x of [17,20,23]) r(x,15,1,9,Ac);
  e(12,17,4,4,Dk); e(7,14,4,4,B); r(4,12,2,2,K); p(4,12,WH); r(6,8,1,4,Dk); r(9,7,1,4,Dk); p(5,7,Dk); p(9,6,Dk);
  if(f.claw){ r(3,15,1,6,Ac); r(2,15,3,1,Ac); if(st>=2){ r(1,14,1,5,Ac); } if(st>=3){ r(0,13,1,7,Ac); r(5,19,4,1,Ac); } }
  if(f.claw2){ e(2,18,2,2,Ac); e(4,14,2,2,Ac); if(st>=3) e(1,16,1,1,Ac); }
  if(f.stinger&&!f.claw2) r(25,20,2,1,K);
  if(f.horn){ const hc=st>=3?Ac:Dk; r(3,6,2,8,hc); r(2,4,3,2,hc); if(st>=2) r(1,3,2,1,hc); }
  if(f.crown3&&st>=3){ r(5,8,5,2,GOLD); p(5,7,GOLD); p(7,6,GOLD); p(9,7,GOLD); } }
/* ---------- tròn / lơ lửng: bí ma, nến ma, mộng ---------- */
function blob(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p}=k, f=a.f, st=a.st;
  e(14,19,9,7,B); for(const x of [9,14,19]) r(x,13,1,13,Dk); r(13,9,3,3,LEAF); if(st>=2){ r(16,8,4,1,LEAF); r(19,9,1,3,LEAF); }
  r(9,16,3,2,'#ffd84a'); r(16,16,3,2,'#ffd84a'); r(10,21,8,1,'#ffd84a'); for(const x of [11,14,17]) p(x,22,'#ffd84a');
  if(st>=3){ r(8,8,12,2,Ac); r(11,3,6,5,Ac); r(11,6,6,1,'#8a2a8a'); } }
function float(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  if(f.flame){ if(st>=2){ r(8,10,12,13,'#3a3040'); r(9,11,10,11,B); } else r(10,13,8,10,B); r(11,13,2,4,L); e(14,8,3,4,Ac); e(14,9,1,2,WH); ey(11,17); ey(15,17);
    if(f.arms3&&st>=3){ r(2,14,24,1,Dk); for(const x of [2,25]){ r(x,12,1,2,Dk); e(x,10,1,2,Ac); } } return; }
  e(14,14,8,7,B); for(const [x,y] of [[10,11],[17,12],[13,17],[19,16]]){ p(x,y,L); p(x+1,y,Ac); p(x,y+1,L); } r(9,13,3,1,K); r(15,13,3,1,K); r(20,19,5,1,L); r(23,17,1,2,L); if(st>=3) e(14,6,3,2,Ac); }
/* ---------- cây: sen ---------- */
function plant(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,ey}=k, st=a.st;
  e(14,22,10,3,Ac); e(14,22,8,2,'#7ac86a'); e(14,17,5,5,B); ey(12,16); ey(15,16);
  e(8,12,3,4,B); e(20,12,3,4,B); e(14,10,3,5,L); if(st>=2){ e(6,15,2,3,L); e(22,15,2,3,L); e(14,6,2,3,B); } if(st>=3){ r(13,2,2,2,GOLD); e(4,18,2,2,B); e(24,18,2,2,B); } }
/* ---------- đá: pha lê ---------- */
function rock(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,ey}=k, st=a.st;
  r(17,4,3,11,B); r(18,5,1,8,WH); r(21,8,2,7,L); if(st>=2) r(4,10,2,6,L); if(st>=3){ r(8,7,2,7,B); r(24,12,2,4,B); }   /* tinh thể mọc lệch sau lưng */
  for(let y=0;y<12;y++){ const w=y<4?6+y*2:y<8?14:14-(y-7)*2; r(14-w/2,14+y,w,1,y<4?L:y<8?B:Dk); } r(10,18,1,4,Dk); r(18,18,1,4,Dk); ey(11,18); ey(15,18);   /* thân viên đá quý mài 6 cạnh */
  if(st>=3){ e(14,15,2,2,Ac); r(13,14,1,1,WH); } }
/* ---------- rùa: Kim Quy ---------- */
function shell(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  for(const x of [8,12,19,23]) r(x,22,3,5,Dk); e(16,17,9,6,B); for(const [x,y] of [[12,15],[16,13],[20,15],[16,18]]){ r(x,y,3,2,Dk); } r(7,21,18,1,Dk); e(5,17,3,3,L); ey(3,16);
  if(f.sprout&&st===1){ r(16,8,1,4,LEAF); e(15,8,2,1,LEAF); e(18,8,2,1,LEAF); } if(st===2) e(16,10,5,3,LEAF);
  if(f.tree3&&st>=3){ r(15,4,2,8,WOOD); e(16,3,6,3,LEAF); e(13,2,2,2,'#7ac86a'); } }
/* ---------- rồng 2 chân: Sa Long, Phi Long ---------- */
function dragon(P,a){ const k=kit(P,a), {B,Dk,L,Ac,e,r,p,ey}=k, f=a.f, st=a.st;
  if(f.wings3&&st>=3){ for(let i=0;i<7;i++) r(15+i,3+i,10-i,2,Ac); r(16,2,9,1,Ac); r(18,10,7,1,'#a81a1a'); }
  r(19,22,6,2,B); r(24,19,2,4,B); r(10,23,3,4,Dk); r(16,23,3,4,Dk);
  e(14,18,6,6,B); e(13,19,4,4,L); r(7,16,2,4,B); if(f.fins){ r(5,13,2,7,Ac); if(st>=3) r(3,12,2,8,Ac); }
  e(9,10,5,4,B); r(3,11,4,3,B); r(3,13,4,1,L); ey(7,8); r(14,9,2,4,Dk);
  if(f.horn){ r(10,4,1,3,HORN); if(st>=2) r(13,5,1,2,HORN); } if(st>=3&&!f.wings3) r(16,12,2,5,Ac); }
const PLAN={quad,biped,bird,fish,serpent,bug,blob,float,plant,rock,shell,dragon};
for(const [id,s] of Object.entries(SD.LC_SPECIES)) if(s.art&&PLAN[s.art.plan]&&!D[id]) D[id]=P=>PLAN[s.art.plan](P,s.art);
/* ---------- 2 rồng huyền thoại ---------- */
D.hac_long=P=>{ const B='#2a2a36', Dk='#16161e', G='#4ad8ff', R='#e8302a';
  for(let i=0;i<6;i++) P.rect(15+i,2+i*2,9-i,2,'#22222c'); P.rect(15,2,10,1,Dk); for(const [x,y] of [[16,4],[19,6],[22,8]]) P.px(x,y,G);   /* cánh như bàn tay */
  ell(P,22,21,4,4,Dk); ell(P,22,21,3,3,B); ell(P,22,21,1,1,G); P.rect(19,21,3,1,G); P.rect(25,21,2,1,G); P.rect(22,18,1,2,G); P.rect(22,24,1,2,G);   /* đuôi máy phát điện */
  P.rect(10,22,4,5,Dk); P.rect(15,22,4,5,Dk); ell(P,13,17,6,7,B); P.rect(11,13,4,8,'#3a3a4a');
  ell(P,6,17,3,4,B); ell(P,5,21,3,2,Dk); P.rect(3,22,1,2,G); P.rect(6,22,1,2,G);   /* tay to */
  ell(P,9,8,5,4,B); P.rect(2,9,5,3,B); P.rect(2,11,5,1,Dk); P.rect(6,6,2,2,R); P.px(6,6,'#ffb0a8');
  P.rect(8,1,2,4,Dk); P.rect(12,0,3,5,Dk); P.rect(13,2,1,2,G); P.rect(10,3,6,1,Dk); };
D.bach_long=P=>{ const B='#f4f4f8', Dk='#c8c8d8', F='#ff8a3a', Y='#ffd84a', E='#4ab0ff';
  for(let i=0;i<6;i++) P.rect(16+i,3+i*2,9-i,2,'#e8e8f0'); P.rect(16,3,9,1,WH); for(let i=0;i<5;i++) P.px(17+i*2,5+i*2,Dk);   /* cánh lông vũ */
  ell(P,22,21,4,4,Dk); ell(P,22,21,3,3,'#3a3a46'); ell(P,22,21,2,2,F); ell(P,22,21,1,1,Y);   /* đuôi tua-bin lửa */
  P.rect(10,22,4,5,Dk); P.rect(15,22,4,5,Dk); ell(P,13,17,6,7,B); ell(P,10,13,5,4,WH); for(const [x,y] of [[6,12],[7,15],[14,11]]) P.px(x,y,Dk);   /* bờm lông cổ */
  P.rect(5,17,2,5,B); P.rect(4,21,3,1,Dk);
  ell(P,8,7,5,4,B); P.rect(1,8,5,3,B); P.rect(1,10,5,1,Dk); P.rect(5,5,2,2,E); P.px(5,5,WH);
  for(const [x,y,h] of [[9,0,4],[12,1,4],[15,3,3]]) P.rect(x,y,2,h,WH); P.rect(9,1,1,2,Dk); };
/* ---------- Blacknut: mèo trắng ngồi, khăn xanh trùm kín mũi miệng (quai đeo sau tai), mắt hổ phách lim dim ---------- */
D.blacknut=P=>{ const W1='#f4f4f2', W2='#d8d8e0', W3='#b8b8c4', PK='#f2a6b8', MK='#7ac8e0', MKd='#4a98b8', AM='#e8a83a';
  ell(P,16,21,7,6,W1); ell(P,18,23,5,4,W2); P.rect(9,24,3,3,W1); P.rect(13,25,3,2,W1); P.rect(22,18,2,6,W2); P.rect(23,14,2,5,W2); P.rect(22,13,2,2,W1);   /* thân ngồi + đuôi dựng */
  ell(P,12,12,7,6,W1); ell(P,12,15,6,3,W2);
  P.rect(5,4,4,5,W1); P.rect(6,6,2,3,PK); P.rect(15,4,4,5,W1); P.rect(16,6,2,3,PK); P.px(5,4,W3); P.px(18,4,W3);   /* tai */
  P.rect(8,10,3,2,AM); P.rect(14,10,3,2,AM); P.px(9,10,K); P.px(15,10,K); P.rect(8,9,3,1,W3); P.rect(14,9,3,1,W3);   /* mắt lim dim */
  P.rect(6,13,13,5,MK); P.rect(6,13,13,1,'#a8e0f0'); P.rect(7,15,11,1,MKd); P.rect(7,17,11,1,MKd); P.rect(5,12,1,2,'#f4f4f2'); P.rect(19,12,1,2,'#f4f4f2'); P.px(4,11,W3); P.px(20,11,W3);   /* khẩu trang + quai */
  P.rect(11,20,4,1,W3); };
/* ---------- Mèn Mén (Nghiện Motion): yêu tinh xanh mũ trùm, mào xanh dương viền mũ, tai nhọn vểnh, mũi to rủ, chân xanh rêu ---------- */
D.men_men=P=>{ const G1='#5fd08a', G2='#4a9a6a', G3='#2a6a5a', HL='#a8f06a', BL='#1a4ac8', LG='#1f4a44';
  P.rect(11,22,3,5,LG); P.rect(15,22,3,5,LG); P.rect(10,26,4,1,G3); P.rect(15,26,3,1,G3);
  ell(P,14,19,4,4,G2); P.rect(12,17,4,3,G1); P.rect(17,18,1,4,G3);
  for(let y=0;y<5;y++) P.rect(19+y,7+y,8-y*2,2,y%2?G2:G1); P.rect(20,9,4,2,G3); P.rect(26,7,1,1,K);   /* tai nhọn vểnh sang phải */
  ell(P,13,10,8,7,G1); ell(P,14,13,6,4,G2); ell(P,10,7,3,2,HL); P.rect(8,10,2,2,HL);
  ell(P,6,14,3,2,G1); P.rect(2,13,5,3,G1); P.rect(2,15,4,1,G2); P.px(2,13,G2);   /* mũi to rủ xuống */
  P.rect(11,11,3,2,K); P.px(11,13,G3); P.rect(9,15,3,1,K);
  for(const [x,y,w] of [[4,13,1],[4,11,1],[5,9,1],[6,7,1],[7,5,2],[9,4,2],[11,3,5],[16,4,2],[18,5,1],[19,6,1]]) P.rect(x,y,w,1,BL); };
/* ---------- dạng Huyền Thoại Lv50: hình dạng mới to hơn ×1,25 (khung 36×36), màu rực hơn, viền sáng vàng tím, ánh kim trên mép trên, vương miện ----------
   lúc chạy còn có: ánh hologram chạy qua người (A.lcHolo), vòng aura xoay dưới chân + hạt sáng bay lên (A.lcAura) */
const ASC=new Map(), AW=36;
A.linhcatAsc=(id,fr=0,flip=false)=>{ const k=id+fr+flip; if(ASC.has(k)) return ASC.get(k); const b=A.linhcat(id,fr,flip), c=A.cv(AW,AW), g=c.getContext('2d'), t=A.cv(AW,AW), tg=t.getContext('2d');
  tg.imageSmoothingEnabled=false; tg.filter='saturate(1.45) brightness(1.1) contrast(1.05)'; tg.drawImage(b.c,0,0,28,28,0,1,35,35); tg.filter='none';
  const src=tg.getImageData(0,0,AW,AW), d=src.data, solid=(x,y)=>x>=0&&y>=0&&x<AW&&y<AW&&d[(y*AW+x)*4+3]>0, out=g.createImageData(AW,AW), o=out.data; let top=AW;
  for(let y=0;y<AW;y++) for(let x=0;x<AW;x++){ const i=(y*AW+x)*4; if(solid(x,y)){ top=Math.min(top,y); o[i]=d[i]; o[i+1]=d[i+1]; o[i+2]=d[i+2]; o[i+3]=255;
      if(!solid(x,y-1)||!solid(x,y-2)&&(x+y)%2){ o[i]=Math.min(255,d[i]*.45+255*.55); o[i+1]=Math.min(255,d[i+1]*.45+236*.55); o[i+2]=Math.min(255,d[i+2]*.45+170*.55); } continue; }   /* ánh kim viền trên */
    if(solid(x-1,y)||solid(x+1,y)||solid(x,y-1)||solid(x,y+1)){ const gold=(x*3+y)%5<3; o[i]=gold?255:190; o[i+1]=gold?214:128; o[i+2]=gold?80:255; o[i+3]=255; }
    else if(solid(x-2,y)||solid(x+2,y)||solid(x,y-2)||solid(x,y+2)){ o[i]=255; o[i+1]=236; o[i+2]=160; o[i+3]=70; } }
  g.putImageData(out,0,0); const cx=Math.round(AW/2)+(flip?2:-2), ty=Math.max(3,top-1);
  g.fillStyle='#f2c43d'; g.fillRect(cx-4,ty,9,2); g.fillRect(cx-4,ty-2,1,2); g.fillRect(cx-2,ty-3,1,3); g.fillRect(cx,ty-4,1,4); g.fillRect(cx+2,ty-3,1,3); g.fillRect(cx+4,ty-2,1,2);
  g.fillStyle='#fff3b0'; g.fillRect(cx-4,ty,9,1); g.fillStyle='#e8302a'; g.fillRect(cx,ty+1,1,1); g.fillStyle='#4ab0ff'; g.fillRect(cx-3,ty+1,1,1); g.fillRect(cx+3,ty+1,1,1);
  const r={c,ax:18,ay:35}; ASC.set(k,r); return r; };
// ánh hologram óng ánh chạy chéo qua người (vẽ ngay sau khi gọi, dùng chung 1 canvas nháp)
const HOLO=A.cv(AW,AW), HG=HOLO.getContext('2d');
A.lcHolo=(sp,t)=>{ HG.globalCompositeOperation='source-over'; HG.clearRect(0,0,AW,AW); HG.drawImage(sp.c,0,0); HG.globalCompositeOperation='source-atop';
  const k=((t*.45)%1.8)-.4, gr=HG.createLinearGradient(0,0,AW,AW); const st=(v,c)=>gr.addColorStop(Math.max(0,Math.min(1,v)),c);
  st(k-.2,'rgba(255,255,255,0)'); st(k-.1,'rgba(255,140,230,.45)'); st(k,'rgba(130,240,255,.55)'); st(k+.1,'rgba(255,232,120,.5)'); st(k+.2,'rgba(255,255,255,0)'); HG.fillStyle=gr; HG.fillRect(0,0,AW,AW);
  HG.globalCompositeOperation='source-over'; return HOLO; };
// vòng aura dưới chân: quầng sáng, 2 vòng nét đứt xoay ngược nhau, 6 viên ngọc chạy quanh, hạt sáng bay lên
A.lcAura=(ctx,x,y,t,r=16)=>{ ctx.save(); const pul=.8+.2*Math.sin(t*3), gr=ctx.createRadialGradient(x,y,1,x,y,r*1.4); gr.addColorStop(0,`rgba(255,220,120,${.42*pul})`); gr.addColorStop(.6,`rgba(184,122,255,${.22*pul})`); gr.addColorStop(1,'rgba(184,122,255,0)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(x,y,r*1.4,r*.6,0,0,7); ctx.fill(); ctx.lineWidth=1.5;
  for(let i=0;i<2;i++){ ctx.strokeStyle=i?'rgba(196,150,255,.95)':'rgba(255,216,74,.95)'; ctx.setLineDash(i?[3,4]:[7,3]); ctx.lineDashOffset=(i?-1:1)*t*22; ctx.beginPath(); ctx.ellipse(x,y,r*(i?.72:1),r*(i?.28:.4),0,0,7); ctx.stroke(); } ctx.setLineDash([]);
  for(let i=0;i<6;i++){ const a=t*1.3+i*Math.PI/3, px=x+Math.cos(a)*r, py=y+Math.sin(a)*r*.4; ctx.fillStyle=i%2?'#fff3b0':'#d8b8ff'; ctx.fillRect(Math.round(px)-1,Math.round(py)-1,2,2); }
  for(let i=0;i<6;i++){ const ph=(t*.55+i*.17)%1, px=x+Math.sin(i*2.3+t*.8)*r*.7, py=y-4-ph*r*2.2; ctx.globalAlpha=1-ph; ctx.fillStyle=i%2?'#ffffff':'#ffe08a'; ctx.fillRect(Math.round(px),Math.round(py),1,i%3?1:2); }
  ctx.restore(); };
A.lcSprite=(m,fr=0,flip=false)=>m&&m.asc?A.linhcatAsc(m.sp,fr,flip):A.linhcat(m.sp,fr,flip);
/* ---------- Tế đàn Rồng Thần (rừng Bắc): bệ đá 3 bậc, 2 tượng đầu rồng đen / trắng, quả cầu tím giữa ---------- */
A.lcAltar=()=>A.sprite(56,46,28,44,(g,P)=>{ P.rect(2,34,52,10,'#6a6e76'); P.rect(2,34,52,2,'#9a9ea6'); P.rect(8,28,40,7,'#7a7e86'); P.rect(8,28,40,2,'#a8acb4'); P.rect(14,22,28,7,'#8a8e96'); P.rect(14,22,28,2,'#b8bcc4');
  for(let i=0;i<7;i++) P.rect(10+i*5,38,3,3,i%2?'#b8a0e8':'#8a6ac8');
  P.rect(4,12,8,22,'#2a2a36'); ell(P,8,10,5,4,'#2a2a36'); P.rect(2,10,4,2,'#2a2a36'); P.px(6,9,'#e8302a'); P.rect(7,4,2,4,'#16161e');
  P.rect(44,12,8,22,'#e8e8f0'); ell(P,48,10,5,4,'#f4f4f8'); P.rect(50,10,4,2,'#f4f4f8'); P.px(49,9,'#4ab0ff'); P.rect(47,4,2,4,'#ffffff');
  P.disc(28,15,6,'#5a2a8a'); P.disc(28,15,4,'#a86ae8'); P.disc(27,13,1,'#f4e8ff'); });
/* ---------- quán Nhà giải trí nhỏ đặt ở mọi map: mái tím, biển neon GIAI TRI nhấp nháy bóng đèn, cửa vàng ấm, chậu cây, bích chất / cơ / rô / tép ---------- */
A.clubBooth=()=>A.sprite(56,64,28,63,(g,P)=>{ P.rect(4,26,48,36,'#3a2a3a'); P.rect(4,26,48,2,'#5a4258'); P.rect(6,60,44,3,'#2a1e28');
  for(let i=0;i<6;i++) P.rect(2+i,26-i*2-2,52-i*2,2,i%2?'#6a2a7a':'#7a3a8a'); P.rect(6,12,44,2,'#4a1a5a');
  P.rect(8,1,40,11,'#1c1516'); P.rect(9,2,38,9,'#2a1030'); A.drawText(g,'GIAI TRI',Math.round(28-A.textW('GIAI TRI')/2),3,'#ffd84a'); for(let x=9;x<47;x+=4){ P.px(x,1,x%8?'#ff5aa8':'#7fd8ff'); P.px(x+2,11,x%8?'#7fd8ff':'#ff5aa8'); }
  P.rect(21,38,14,22,'#ffd27a'); P.rect(21,38,14,2,'#fff0b8'); P.rect(27,38,2,22,'#c89a4a'); P.rect(20,37,16,1,'#1c1516');
  P.rect(8,34,10,10,'#7fd8ff'); P.rect(38,34,10,10,'#7fd8ff'); P.rect(9,35,8,8,'#2a6a9a'); P.rect(39,35,8,8,'#2a6a9a');
  P.px(12,38,'#f4f1ea'); P.px(13,39,'#f4f1ea'); P.px(42,38,'#e84a5a'); P.px(43,39,'#e84a5a'); P.px(43,37,'#e84a5a');
  P.rect(6,50,6,8,'#8a5a32'); P.rect(5,45,8,6,'#5fae46'); P.rect(44,50,6,8,'#8a5a32'); P.rect(43,45,8,6,'#5fae46'); });
/* ---------- cổng võ đài CLB: 2 cột gỗ, băng rôn màu hệ có Bóng Cát ---------- */
A.lcGate=col=>A.sprite(64,40,32,39,(g,P)=>{ for(const x of [3,57]){ P.rect(x,6,4,33,'#6a4228'); P.rect(x,6,4,2,'#8a5a32'); P.rect(x-1,37,6,2,'#4a2e1c'); } P.rect(2,4,60,4,'#4a2e1c');
  P.rect(8,9,48,13,col); P.rect(8,9,48,2,'rgba(255,255,255,.35)'); P.rect(8,21,48,1,'rgba(0,0,0,.3)'); P.disc(32,15,5,'#f4f4f2'); P.rect(27,12,11,3,'#e8302a'); P.rect(27,15,11,1,K); P.disc(32,15,1,K);
  for(const x of [12,48]) P.rect(x,22,2,5,col); });
A.lcFlagT=col=>A.sprite(20,44,4,43,(g,P)=>{ P.rect(3,2,2,41,'#6a6e76'); P.rect(2,1,4,2,GOLD); P.rect(5,4,14,11,col); P.rect(5,4,14,2,'rgba(255,255,255,.35)'); P.disc(12,10,3,'#f4f4f2'); P.rect(9,9,7,1,K); P.px(12,10,K); P.rect(1,42,6,2,'#4a4e56'); });
})();
