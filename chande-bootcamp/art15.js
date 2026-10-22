/* Chan City — phụ kiện MU (shop Thợ Kim Hoàn): cánh sau lưng (lông vũ / dơi / bướm, 2 khung vỗ cánh), vật hộ thân bay lơ lửng cạnh người,
   icon dây chuyền + màu dây / mặt để vẽ trên ngực, quầy Thợ Kim Hoàn. Vẽ bằng khối có đổ bóng (A.vol của art13). */
(function(){
const A=ART, vol=A.vol;
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=(c,al=255)=>{ const b=hx(c); return [mix(b,[255,252,240],.55),b,mix(b,[20,10,50],.32),mix(b,[10,5,30],.6)].map(v=>[...v,al]); };
const flipX=c=>{ const o=A.cv(c.width,c.height), g=o.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(c,0,0); return o; };
/* ---------- cánh: vẽ cánh phải trên khung 26×30 (gốc ở mép trái), lật ra cánh trái, ghép thành 52×30 ---------- */
const WING={w_angel:{k:'feather',c:'#e8f4ff'},w_sky:{k:'feather',c:'#4ac8f0'},w_demon:{k:'feather',c:'#7a3ac8',tip:'#1c1020'},
  w_bat:{k:'bat',c:'#8a1a2a',bone:'#5a5a64'},w_pinkbat:{k:'bat',c:'#e8a0b8',bone:'#7a4a5a'},w_fairy:{k:'fly',c:'#ff9ac8'},w_monarch:{k:'fly',c:'#ff8a1a',vein:'#2a0a0a'}};
function wingHalf(d,fr){ const V=vol(26,30), up=fr?3:0;
  if(d.k==='feather'){ const rp=R(d.c), tp=d.tip?R(d.tip):rp;
    for(let i=5;i>=0;i--){ const a=(-62+i*19+(fr?10:0))*Math.PI/180, L=22-i*2.4, x0=2, y0=12+i*.9; V.tube([[x0,y0],[x0+Math.cos(a)*L*.55,y0+Math.sin(a)*L*.55+i*.6],[x0+Math.cos(a)*L,y0+Math.sin(a)*L+i*1.2]],[3.2,2.6,.9],i<2?tp:rp,{g:'f'+i}); }
    V.ell(4,12,4.5,5.5,rp,{g:'b'}); }
  else if(d.k==='bat'){ const m=R(d.c), b=R(d.bone), W=[2,12], H=[11,4-up], T=[[23,2-up],[22,12-up/2],[16,21]];
    V.poly([W,H,T[0],[19,8-up/2],T[1],[18,16],T[2],[9,19],[2,17]],m,{n:[-.2,-.35,.92]});
    V.tube([W,H],[1.8,1.2],b,{ink:true}); for(const p of T) V.tube([H,p],[1.1,.5],b,{ink:true}); V.ell(11,4-up,1.6,1.6,b); }
  else { const m=R(d.c); V.ell(12,9-up,10,7,m,{g:'u'}); V.ell(9,20,6,5.5,m,{g:'l'});
    if(d.vein){ for(const [x,y] of [[20,6],[21,11],[15,15]]) V.line(3,13,x,y-up,d.vein); V.line(3,16,12,24,d.vein).line(3,16,14,19,d.vein); for(const [x,y] of [[21,5],[22,9],[19,14],[13,24],[8,25]]) V.px(x,y-(y<15?up:0),'#ffffff'); }
    else { V.ell(12,8-up,5,3,R('#ffd0e8'),{g:'u2'}); V.ell(9,20,3,2.5,R('#ffd0e8'),{g:'l2'}); } }
  return V.done(false); }
const WCACHE={};
A.muWing=(k,fr=0)=>{ const key=k+fr; if(WCACHE[key]) return WCACHE[key]; const d=WING[k]; if(!d) return null; const h=wingHalf(d,fr), c=A.cv(52,30), g=c.getContext('2d');
  g.drawImage(flipX(h),0,0); g.drawImage(h,26,0); return WCACHE[key]={c,ax:26,ay:13}; };
/* ---------- vật hộ thân 20×20, neo giữa ---------- */
const CH={
  c_fire:V=>{ for(const [x,y] of [[18,2],[15,1],[19,6]]) V.tube([[11,10],[x,y]],[3,.6],R('#e8302a'),{g:'t'}); V.ell(9,12,6,6,R('#ff9a2a')); V.ell(8,13,3.5,3.5,R('#fff3a0')); V.px(7,12,'#ffffff').px(8,12,'#ffffff'); },
  c_comet:V=>{ for(let i=0;i<4;i++) V.line(1+i,7+i*2,9,9+i,'#1c1516'); V.ell(12,11,6,4.6,R('#3a3a7a')); V.ell(13,8,4,2.4,R('#5ad0ea')); V.ell(15,8,2,2,R('#ffffff')); V.px(10,12,'#1c1516').px(13,13,'#1c1516'); },
  c_bolt:V=>{ V.poly([[13,1],[6,11],[10,11],[7,19],[15,8],[11,8]],R('#ffd83a'),{n:[-.4,-.3,.86]}); V.line(12,2,8,9,'#fff8c0'); },
  c_cat:V=>{ V.poly([[4,8],[6,3],[9,7]],R('#dceaff'),{n:[-.3,-.3,.9]}).poly([[11,7],[15,3],[16,9]],R('#dceaff'),{n:[-.3,-.3,.9]}); V.ell(10,12,8,5,R('#f4f8ff'));
    V.rect(6,11,2,2,'#1c1516').rect(12,11,2,2,'#1c1516').line(9,14,11,14,'#1c1516').rect(2,14,3,2,'#f4a0a8').rect(15,14,3,2,'#f4a0a8'); },
  c_pad:V=>{ V.ell(5,12,4.5,4.5,R('#e8e8ec'),{g:'p'}).ell(15,12,4.5,4.5,R('#e8e8ec'),{g:'p'}).ell(10,10,7,4,R('#f4f4f6'),{g:'p'});
    V.rect(4,9,1,5,'#1c1516').rect(2,11,5,1,'#1c1516').px(14,9,'#2aa0ff').px(16,11,'#e8302a').px(14,13,'#f2d030').px(12,11,'#3ab04a').rect(8,10,1,1,'#1c1516').rect(10,10,1,1,'#1c1516'); },
  c_tv:V=>{ V.poly([[3,3],[17,3],[17,14],[3,14]],R('#c8b88a'),{n:[-.3,-.3,.9]}); V.rect(5,5,11,8,'#2a6a5a').rect(8,8,1,2,'#e8f0a0').rect(12,8,1,2,'#e8f0a0').line(8,11,12,11,'#e8f0a0'); V.rect(7,15,2,3,'#8a7a5a').rect(12,15,2,3,'#8a7a5a').rect(1,7,2,4,'#8a7a5a'); },
  c_code:V=>{ V.poly([[4,2],[16,2],[16,12],[4,12]],R('#ff8a5a'),{n:[-.2,-.3,.93]}); V.rect(1,6,3,3,'#ff8a5a').rect(16,6,3,3,'#ff8a5a').rect(7,5,1,3,'#1c1516').rect(13,5,1,3,'#1c1516');
    V.poly([[3,12],[14,12],[15,18],[4,18]],R('#2a2a32'),{n:[0,-.2,.98]}); V.rect(7,14,1,1,'#ffffff').rect(9,15,1,1,'#ffffff').rect(10,14,1,1,'#ffffff'); },
  c_eye:V=>{ for(const x of [5,9,13,16]) V.tube([[x,13],[x+(x%2?-1:1),18]],[1.4,.6],R('#3a2a2a'),{g:'t'}); V.ell(10,9,8,6.5,R('#b8a888')); V.ell(10,9,4.5,4.5,R('#e8203a')); V.ell(10,9,3,3,R('#f4f0e8')); V.rect(10,9,1,1,'#1c1516'); V.ell(12,3,4,2,R('#8a6a8a')); },
  c_walle:V=>{ V.ell(6,4,3.4,2.6,R('#9aa0ae'),{g:'e'}).ell(13,4,3.4,2.6,R('#9aa0ae'),{g:'e'}); V.rect(6,4,1,1,'#3a3a44').rect(13,4,1,1,'#3a3a44'); V.tube([[10,6],[10,9]],1,R('#a88a5a'));
    V.poly([[4,9],[16,9],[16,16],[4,16]],R('#c8a060'),{n:[-.3,-.3,.9]}); V.rect(7,10,6,3,'#2a2a34').px(8,11,'#e8302a').px(11,11,'#f2a020'); V.ell(3,16,2.5,2.5,R('#5a4a3a')).ell(17,16,2.5,2.5,R('#5a4a3a')); },
  c_sonic:V=>{ for(const [x,y] of [[2,4],[1,9],[3,14]]) V.tube([[9,9],[x,y]],[3.2,.6],R('#2a4ab8'),{g:'s'}); V.ell(10,9,6,6,R('#2a4ab8')); V.ell(13,11,4,3,R('#f8d0a8')); V.rect(11,5,3,5,'#ffffff').rect(13,6,1,3,'#1c1516'); V.px(17,11,'#1c1516'); },
  c_ghost:V=>{ for(const a of [-150,-110,-70,-30]){ const r=a*Math.PI/180; V.tube([[10+Math.cos(r)*6,11+Math.sin(r)*6],[10+Math.cos(r)*10,11+Math.sin(r)*10]],[3,.5],R('#2a1a2a'),{g:'sp'}); }
    V.ell(10,11,8,7.5,R('#2a1a2a')); V.poly([[4,8],[8,10],[7,12],[4,11]],R('#ffe02a'),{n:[0,-.3,.95]}).poly([[16,8],[12,10],[13,12],[16,11]],R('#ffe02a'),{n:[0,-.3,.95]}); V.rect(5,14,10,2,'#ffffff').line(5,13,15,13,'#ff2a8a'); V.px(3,16,'#ff2a8a').px(17,6,'#ff2a8a').px(2,9,'#ff2a8a'); },
  c_tank:V=>{ V.ell(8,6,4,4,R('#a8e040')); V.rect(9,5,1,2,'#1c1516'); V.poly([[2,10],[17,10],[18,14],[1,14]],R('#3ab04a'),{n:[-.3,-.3,.9]}); V.tube([[13,9],[19,8]],1.2,R('#2a8a3a')); V.poly([[1,14],[18,14],[17,18],[2,18]],R('#2a2a32'),{n:[0,-.2,.98]});
    for(const x of [4,8,12]) V.px(x,16,'#e8302a').px(x+1,16,'#ffffff'); },
  c_crown:V=>{ V.poly([[2,16],[2,6],[6,11],[10,3],[14,11],[18,6],[18,16]],R('#7a2aa8'),{n:[-.3,-.3,.9]}); V.rect(2,13,17,2,'#3ab0e8'); V.ell(10,9,1.6,2.4,R('#ff9ae8')).ell(6,13,1.2,1.2,R('#ff9ae8')).ell(14,13,1.2,1.2,R('#ff9ae8')); V.px(10,1,'#5aeaff').px(10,2,'#5aeaff'); }};
const CC={};
A.muCharm=k=>{ if(CC[k]) return CC[k]; const f=CH[k]; if(!f) return null; const V=vol(20,20); f(V); return CC[k]={c:V.done(false),ax:10,ay:10}; };
/* ---------- dây chuyền: icon 16×16 + màu dây / mặt để vẽ nhỏ trên ngực ---------- */
const NECK={n_bead:{chain:'#3ad8d8',gem:'#c84ae8'},n_ruby:{chain:'#e8c080',gem:'#e8304a'},n_amethyst:{chain:'#f0f080',gem:'#7a5ac8'},n_gold:{chain:'#f2c43d',gem:'#f2c43d'},n_pharaoh:{chain:'#f2a81a',gem:'#2ad8a0'},n_star:{chain:'#e8c040',gem:'#ff4ab8'}};
A.muNeckCol=k=>NECK[k];
const NC={};
A.muNeckIcon=k=>{ if(NC[k]) return NC[k]; const d=NECK[k]; if(!d) return null; const V=vol(18,18);
  for(let i=0;i<=20;i++){ const a=Math.PI*(.05+.9*i/20), x=9+Math.cos(a)*7, y=3+Math.sin(a)*8; V.px(Math.round(x),Math.round(y),i%2?d.chain:'#8a6a2a'); }
  if(k==='n_bead') for(const a of [.2,.35,.65,.8]) V.ell(9+Math.cos(Math.PI*a)*7,3+Math.sin(Math.PI*a)*8,1.4,1.4,R(d.gem),{g:'b'+a});
  if(k==='n_pharaoh'){ V.tube([[2,5],[9,12],[16,5]],2.2,R('#f2a81a')); V.ell(9,13,2.2,2.2,R('#2ad8a0')).ell(5,9,1.2,1.2,R('#2a4ad8')).ell(13,9,1.2,1.2,R('#2a4ad8')); }
  else if(k==='n_gold'){ V.poly([[7,11],[12,11],[12,17],[7,17]],R('#f2c43d'),{n:[-.3,-.3,.9]}); V.rect(8,12,3,2,'#1c1516'); }
  else if(k==='n_star'){ V.poly([[9,9],[10,12],[13,13],[10,14],[9,17],[8,14],[5,13],[8,12]],R('#f2d040'),{n:[-.3,-.3,.9]}); V.px(9,13,'#ff4ab8'); }
  else V.ell(9,13,k==='n_ruby'?2:2.6,k==='n_ruby'?3.4:2.6,R(d.gem));
  return NC[k]=V.done(false); };
/* ---------- quầy Thợ Kim Hoàn: tủ kính trưng cánh, dây chuyền, ngọc ---------- */
A.muJewelStall=()=>A.sprite(56,46,28,44,(g,P)=>{ for(let i=0;i<8;i++) P.rect(2+Math.round(i*6.5),6,7,10,i%2?'#5ad0ea':'#2a4ab8'); P.rect(2,16,52,2,'#c8901a');
  P.rect(4,18,2,26,'#6a5a4a'); P.rect(50,18,2,26,'#6a5a4a'); P.rect(4,30,48,14,'#2a2a4a'); P.rect(4,30,48,2,'#4a4a6a'); P.rect(7,32,42,8,'#9ad8f0'); P.rect(7,32,42,1,'#ffffff');
  for(const [x,c] of [[12,'#e8304a'],[20,'#2ad8a0'],[28,'#c84ae8'],[36,'#f2c43d'],[44,'#5aa0ff']]){ P.disc(x,36,2,c); P.px(x-1,35,'#ffffff'); }
  for(const [x,c] of [[14,'#e8f4ff'],[42,'#7a3ac8']]){ P.rect(x-6,21,5,6,c); P.rect(x+1,21,5,6,c); P.rect(x-1,22,2,4,'#1c1516'); }
  P.rect(12,0,32,7,'#1c1516'); A.drawText(g,'PHU KIEN',13,1,'#5ad0ea'); });
})();
