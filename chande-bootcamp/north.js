/* Chan City — MU Đỉnh Bắc (data.js MU.north): MU mở rộng lên trên MU.OY ô. Dựng map như cũ (world7 + world8 + portal.js) rồi dời cả khối xuống OY ô,
   ghép vùng Đỉnh Bắc: đại lộ ngang, lối lên qua tường trên quảng trường, 3 đấu trường có tường bao + cổng phía Nam:
   Căn cứ Siêu Nhân (sàn kim loại, Trung tâm Chỉ huy, cột năng lượng) · Thung lũng Gió Ionia (cỏ, anh đào, cổng thần, đèn đá) · Thế giới Thần Chết (đất tro, cây táo chết, Death Note).
   Hiệu ứng cơ chế boss mới: Death Note (ghi tên → mất 50% máu), mưa táo, lốc xoáy, tường gió, chiêu cuối hất tung, chém nhanh, phân thân Yone, 2 thần chết cùng nhắm 1 người. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, SD=SHARED, M=SD.MU, X=MAPX, NB=M.north, h=A.hash, S=(w,h0,ax,ay,fn,ol=true)=>A.sprite(w,h0,ax,ay,fn,ol), CR={};
const once=(k,fn)=>CR[k]||(CR[k]=fn());
/* ---------- nền 3 đấu trường ---------- */
for(const k of ['+','*','=']) A.WALKABLE.add(k);
// sàn kim loại căn cứ: tấm thép viền tối, đinh tán góc, rãnh đèn xanh mỗi 4 ô, lỗ thông gió
TE['+']=(g,X0,Y0,tx,ty,nb,fr,P)=>{ P.rect(X0,Y0,T,T,'#2e3a52'); P.rect(X0,Y0,T,1,'#46567a'); P.rect(X0,Y0,1,T,'#46567a'); P.rect(X0+T-1,Y0,1,T,'#1c2434'); P.rect(X0,Y0+T-1,T,1,'#1c2434');
  for(const [x,y] of [[2,2],[13,2],[2,13],[13,13]]) P.px(X0+x,Y0+y,'#6a7ca0');
  if(tx%4===0) P.rect(X0,Y0,1,T,'#3ad8ff'); if(ty%4===0) P.rect(X0,Y0,T,1,'#2ab0e0');
  if(h(tx,ty,331)<.08){ for(let i=0;i<4;i++) P.rect(X0+4,Y0+4+i*2,8,1,'#141a26'); } else if(h(tx,ty,332)<.05){ P.rect(X0+3,Y0+6,10,4,'#e8c020'); for(let i=0;i<5;i++) P.rect(X0+3+i*2,Y0+6,1,4,'#1c1516'); } };   /* vạch cảnh báo vàng đen */
// cỏ Ionia: xanh tươi, ngọn cỏ sáng, cánh hoa anh đào rơi
TE['*']=(g,X0,Y0,tx,ty,nb,fr,P)=>{ P.rect(X0,Y0,T,T,'#5aa84a'); for(let i=0;i<5;i++){ const x=(h(tx,ty,341+i)*14)|0, y=(h(tx,ty,351+i)*13)|0; P.rect(X0+x,Y0+y,1,2,i%2?'#7ac85a':'#4a9440'); }
  if(h(tx,ty,361)<.35){ const x=(h(tx,ty,362)*13)|0, y=(h(tx,ty,363)*13)|0; P.rect(X0+x,Y0+y,2,1,'#ffb8d8'); P.px(X0+x+1,Y0+y+1,'#ff90c0'); }
  if(h(tx,ty,364)<.12){ const x=(h(tx,ty,365)*12)|0, y=(h(tx,ty,366)*12)|0; P.px(X0+x,Y0+y,'#fff0a0'); P.px(X0+x+1,Y0+y,'#ffffff'); } };
// đất tro Thế giới Thần Chết: tím xám, vết nứt, than tím, mảnh xương
TE['=']=(g,X0,Y0,tx,ty,nb,fr,P)=>{ P.rect(X0,Y0,T,T,'#2e2634'); for(let i=0;i<4;i++){ const x=(h(tx,ty,371+i)*14)|0, y=(h(tx,ty,381+i)*14)|0; P.rect(X0+x,Y0+y,2,1,'#3a3044'); }
  if(h(tx,ty,391)<.22){ let x=(h(tx,ty,392)*8)|0, y=2; for(let i=0;i<6;i++){ P.px(X0+4+x,Y0+y+i*2,'#18121e'); x+=h(tx,ty,393+i)<.5?1:-1; x=Math.max(-3,Math.min(8,x)); } }   /* vết nứt */
  if(h(tx,ty,401)<.07){ P.px(X0+7,Y0+9,'#a060ff'); P.px(X0+8,Y0+9,'#7a3ad8'); }
  if(h(tx,ty,402)<.05){ P.rect(X0+4,Y0+11,6,1,'#c8bca8'); P.px(X0+3,Y0+10,'#c8bca8'); P.px(X0+10,Y0+12,'#c8bca8'); } };   /* mảnh xương */

/* ---------- đồ trang trí ---------- */
// Trung tâm Chỉ huy (tường trên căn cứ): ống kính giữa có mặt Zordon, 2 dãy bàn điều khiển đèn nhấp nháy
const command=f=>once('cmd'+f,()=>S(208,66,104,64,(g,P)=>{ P.rect(0,12,208,46,'#3a4660'); P.rect(0,8,208,5,'#5a6a88'); P.rect(0,8,208,1,'#8a9ab8'); P.rect(0,56,208,10,'#232c3e'); P.rect(0,56,208,1,'#4a5a7a');
  for(let i=0;i<13;i++){ const x=3+i*16; if(x>84&&x<124) continue; P.rect(x,16,12,30,'#2e3a52'); P.rect(x,16,12,1,'#4a5a7a'); P.rect(x+2,20,8,2,i%3?'#3ad8ff':'#e8302a'); P.rect(x+2,40,8,3,'#1c2434'); }
  P.rect(86,0,36,58,'#1c2434'); P.rect(88,2,32,54,'#1a3048'); P.rect(90,4,28,50,'#2a6aa8'); P.rect(91,4,4,50,'#5ac8ff'); P.rect(112,4,3,50,'#1e4a78');   /* ống kính */
  P.disc(104,24,10,'#4a9ae8'); P.disc(104,22,8,'#7ac0ff'); P.rect(99,20,3,2,'#ffffff'); P.rect(106,20,3,2,'#ffffff'); P.rect(100,28,8,2,'#2a5a98'); P.rect(97,12,14,3,'#a8d8ff');   /* mặt Zordon */
  P.rect(84,50,40,8,'#5a6a88'); P.rect(84,50,40,1,'#8a9ab8');
  for(const x0 of [12,140]){ P.rect(x0,44,56,14,'#4a5672'); P.rect(x0,44,56,2,'#6a7896'); for(let i=0;i<7;i++){ const on=(i+f)%3===0; P.rect(x0+4+i*7,48,4,3,on?['#ff4a3a','#ffd84a','#5ae86a'][i%3]:'#2a3248'); } P.rect(x0+6,53,44,2,'#1c2434'); }
  for(const [x,c] of [[30,'#e8302a'],[46,'#3a6ad8'],[62,'#ffd23a'],[146,'#ff70b8'],[162,'#2a2a2a'],[178,'#3ac85a']]){ P.disc(x,30,5,'#1c2434'); P.disc(x,30,4,c); P.px(x-1,28,'#ffffff'); } }));   /* 6 đèn màu anh em Siêu Nhân */
// cột năng lượng: thân thép, quả cầu sáng theo màu, nhịp sáng
const pylon=(col,f)=>once('py'+col+f,()=>S(18,52,9,50,(g,P)=>{ P.rect(5,14,8,36,'#3a4660'); P.rect(5,14,2,36,'#5a6a88'); P.rect(3,46,12,5,'#232c3e'); P.rect(4,10,10,5,'#5a6a88');
  for(let y=18;y<44;y+=6) P.rect(7,y,4,2,f%2?col:'#2a3248'); P.disc(9,6,6,f%2?col:'#ffffff'); P.disc(9,6,3,'#ffffff'); }));
// Đồng Năng Lượng giữa sàn (hình nằm phẳng)
const coin=()=>once('coin',()=>S(72,36,36,18,(g,P)=>{ g.fillStyle='#8a6a1a'; g.beginPath(); g.ellipse(36,18,35,17,0,0,7); g.fill(); g.fillStyle='#e8b830'; g.beginPath(); g.ellipse(36,18,31,14,0,0,7); g.fill(); g.fillStyle='#ffd84a'; g.beginPath(); g.ellipse(36,17,26,11,0,0,7); g.fill();
  g.fillStyle='#c8302a'; g.beginPath(); g.moveTo(40,7); g.lineTo(30,19); g.lineTo(36,19); g.lineTo(31,29); g.lineTo(43,15); g.lineTo(37,15); g.closePath(); g.fill(); },false));
const consoleBox=f=>once('cb'+f,()=>S(26,30,13,28,(g,P)=>{ P.rect(2,8,22,20,'#4a5672'); P.rect(2,8,22,2,'#6a7896'); P.rect(5,2,16,10,'#1c2434'); P.rect(6,3,14,8,f?'#2ad8a0':'#1a8a6a'); for(let i=0;i<3;i++) P.rect(7,5+i*2,(f+i)%2?10:6,1,'#c8ffe8');
  for(let i=0;i<4;i++) P.rect(5+i*5,18,3,3,(i+f)%2?'#ffd84a':'#e8302a'); P.rect(4,24,18,2,'#232c3e'); }));
// cổng thần Ionia: 2 cột gỗ đỏ, mái cong ngói xanh ngọc, bùa giấy treo đung đưa
const shrine=f=>once('sh'+f,()=>S(80,62,40,60,(g,P)=>{ for(const x of [12,62]){ P.rect(x,14,7,46,'#8a2a22'); P.rect(x,14,2,46,'#b8443a'); P.rect(x-2,56,11,5,'#4a3a32'); }
  P.rect(6,22,68,4,'#6a2a22'); P.rect(0,8,80,6,'#2a8a8a'); P.rect(0,8,80,1,'#5ad8c8'); P.rect(-1,12,6,3,'#2a8a8a'); P.rect(75,12,6,3,'#2a8a8a'); P.rect(4,4,72,5,'#1e6a6a'); P.rect(2,2,6,3,'#2a8a8a'); P.rect(72,2,6,3,'#2a8a8a');
  P.rect(34,14,12,9,'#e8dcc0'); P.rect(36,16,8,1,'#1c1516'); P.rect(39,17,2,5,'#1c1516');
  for(let i=0;i<5;i++){ const x=22+i*9+((f+i)%2?1:0); P.rect(x,26,1,6,'#c8b890'); P.rect(x-1,32,3,7,'#f4ecd8'); P.rect(x,34,1,3,'#c8302a'); } }));
// sách Death Note trên bệ đá
const note=f=>once('dn'+f,()=>S(46,46,23,44,(g,P)=>{ P.rect(8,26,30,18,'#4a4454'); P.rect(8,26,30,2,'#6a6474'); P.rect(4,40,38,5,'#3a3444'); P.rect(12,30,22,10,'#3a3444');
  P.rect(9,8,28,19,'#0c0a10'); P.rect(9,8,28,1,'#3a3448'); P.rect(22,8,2,19,'#2a2432'); for(let i=0;i<4;i++) P.rect(12,12+i*3,8,1,'#c8c4d0'); P.rect(25,12,9,1,'#c8c4d0'); P.rect(25,15,6,1,'#c8c4d0');
  P.rect(30,2,2,10,f?'#e8e4f0':'#c8c4d0'); P.rect(31,0,3,3,'#ffffff'); if(f) P.px(29,11,'#e8302a'); }));   /* bút lông đang viết */
// cây táo chết: cành khô xám, táo đỏ bóng
const appleTree=s=>once('at'+s,()=>S(44,56,22,54,(g,P)=>{ P.rect(19,24,6,30,'#4a3a3a'); P.rect(19,24,2,30,'#6a5656'); for(const [x,y,w,d] of [[6,14,14,1],[24,10,14,-1],[10,22,10,1],[26,20,12,-1],[16,6,6,1]]){ for(let i=0;i<w;i++) P.rect(x+i,y+((i*d)>>2),2,2,'#4a3a3a'); }
  for(const [x,y] of [[8,16],[34,12],[14,24],[30,22],[20,8],[38,18],[4,20]].slice(0,5+(s%3))){ P.disc(x,y,2,'#c8202a'); P.px(x-1,y-1,'#ff8a8a'); P.px(x,y-3,'#3a6a2a'); } P.rect(14,52,16,3,'#2a2230'); }));

/* ---------- dời cả map MU xuống, ghép Đỉnh Bắc ---------- */
const AR=Object.values(NB.arenas), inA=(a,x,y)=>x>=a.x0&&x<=a.x1&&y>=a.y0&&y<=a.y1;
function northTile(x,y,W){ if(y<=1||x<=1||x>=W-2) return '0';
  for(const a of AR) if(inA(a,x,y)){ if(x===a.x0||x===a.x1||y===a.y0) return '0'; if(y===a.y1) return x>=a.gate[0]&&x<=a.gate[1]?'9':'0'; return a.tile; }
  if(y>=NB.road.y0&&y<=NB.road.y1) return '9';
  for(const a of AR) if(y>a.y1&&y<NB.road.y0&&x>=a.gate[0]&&x<=a.gate[1]) return '9';   /* lối từ cổng đấu trường xuống đại lộ */
  if(y>NB.road.y1&&x>=NB.open.x[0]&&x<=NB.open.x[1]) return '9';   /* lối xuống quảng trường */
  return h(x,y,313)<.08?'P':'G'; }
function north(r){ const OY=M.OY||0; if(!OY) return r; const W=r.W, H=r.H+OY, sh=OY*T;
  const grid=[...Array.from({length:OY},(_,y)=>Array.from({length:W},(_,x)=>northTile(x,y,W))),...r.grid.map(row=>[...row])];
  for(let y=OY;y<OY+2;y++) for(let x=NB.open.x[0];x<=NB.open.x[1];x++) grid[y][x]='9';   /* mở tường trên quảng trường */
  const obj=r.obj.map(o=>({...o,y:o.y+sh,...(o.sort!=null?{sort:o.sort+sh}:{})})), solid=r.solid.map(([x0,y0,x1,y1])=>[x0,y0+OY,x1,y1+OY]), inter=r.inter.map(i=>({...i,y:i.y+sh}));
  const put=(spr,tx,ty,o={})=>{ obj.push({spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}); }, block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]), one=(x,y)=>block(Math.floor(x),Math.ceil(y)-1,Math.floor(x),Math.ceil(y)-1);   /* chặn đúng ô chân đồ đứng */
  const tree=(x,y)=>{ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); one(x,y); };
  const R=NB.arenas.ranger, Y=NB.arenas.yasuo, K=NB.arenas.ryuk, mid=a=>(a.x0+a.x1+1)/2;
  /* đại lộ: biển, đuốc dọc 2 bên cổng đấu trường, cây ngoài bìa */
  put(A.label('DINH BAC · 3 DAU TRUONG BOSS','#2a2026','#ffd84a'),NB.open.x[0]-9,NB.road.y1-.4,{flat:true});
  for(const a of AR){ const gx=(a.gate[0]+a.gate[1]+1)/2; put(A.label(a.name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'D'),'#1c1516','#ffd84a'),gx,a.y1+2.5,{flat:true});
    for(const x of [a.gate[0]-1.5,a.gate[1]+2.5]){ put(A.muTorch(0),x,a.y1+2.4,{anim:'mutorch'}); one(x,a.y1+2.4); } }
  for(let x=4;x<W-4;x+=7){ if(AR.some(a=>x>=a.gate[0]-3&&x<=a.gate[1]+3)||x>=NB.open.x[0]-3&&x<=NB.open.x[1]+3) continue; tree(x+.5,OY-.2); }
  for(const x of [3,53,107,157]) if(x<W-2) tree(x+.5,NB.road.y0-.4);
  /* Căn cứ Siêu Nhân */
  put(command(0),mid(R),R.y0+3.1,{anim:'ncmd'}); block(Math.floor(mid(R))-6,R.y0+1,Math.floor(mid(R))+6,R.y0+2);
  put(coin(),mid(R),12.4,{flat:true});
  [['#e8302a',R.x0+3,R.y0+3],['#3a6ad8',R.x1-2,R.y0+3],['#ffd23a',R.x0+3,R.y1-1],['#ff70b8',R.x1-2,R.y1-1],['#3ac85a',R.x0+12,R.y1-1],['#c8ccd8',R.x1-11,R.y1-1]].forEach(([c,x,y])=>{ put(pylon(c,0),x+.5,y+.9,{anim:'npylon',col:c}); one(x+.5,y+.9); });
  for(const x of [R.x0+6,R.x0+10,R.x1-9,R.x1-5]){ put(consoleBox(0),x+.5,R.y0+2.9,{anim:'ncons'}); one(x+.5,R.y0+2.9); }
  /* Thung lũng Gió Ionia */
  const FA=A.farmArt; put(shrine(0),mid(Y),Y.y0+3.4,{anim:'nshrine'}); block(Math.floor(mid(Y))-2,Y.y0+3,Math.floor(mid(Y))-2,Y.y0+3); block(Math.floor(mid(Y))+1,Y.y0+3,Math.floor(mid(Y))+2,Y.y0+3);   /* 2 chân cột, đi qua được dưới mái */
  for(const [x,y,s] of [[Y.x0+3,Y.y0+4,0],[Y.x0+9,Y.y0+3,1],[Y.x1-8,Y.y0+3,2],[Y.x1-2,Y.y0+4,0],[Y.x0+3,Y.y1-1,1],[Y.x1-2,Y.y1-1,2],[Y.x0+10,Y.y1-1,0],[Y.x1-9,Y.y1-1,1]]){ put(FA?FA.cherry(s):A.tree(s,1),x+.5,y+.9,{tree:true}); one(x+.5,y+.9); }
  for(const [x,y] of [[mid(Y)-9,9],[mid(Y)+9,9],[mid(Y)-9,16],[mid(Y)+9,16]]){ put(A.stoneLantern(),x,y); one(x,y); }
  for(const [x,y] of [[Y.x0+16,7],[Y.x1-15,18],[Y.x0+18,17]]){ put(A.rock((x*3)|0),x,y); one(x,y); }
  /* Thế giới Thần Chết */
  put(note(0),mid(K),K.y0+3.5,{anim:'nnote'}); block(Math.floor(mid(K))-1,K.y0+3,Math.floor(mid(K))+1,K.y0+3);
  for(const [x,y,s] of [[K.x0+4,K.y0+4,0],[K.x1-3,K.y0+4,1],[K.x0+4,K.y1-1,2],[K.x1-3,K.y1-1,0],[K.x0+14,K.y0+3,1],[K.x1-13,K.y1-1,2]]){ put(appleTree(s),x+.5,y+.9,{tree:true}); one(x+.5,y+.9); }
  for(const [x,y] of [[K.x0+9,8],[K.x1-8,8],[K.x0+9,16],[K.x1-8,16]]){ put(A.muGhostLamp(0),x,y,{anim:'mulamp'}); one(x,y); }
  for(const [x,y] of [[K.x0+20,6],[K.x1-19,17],[K.x0+7,12],[K.x1-6,12]]){ put(A.skullTotem?A.skullTotem():A.muDeadTree(),x,y); one(x,y); }
  for(const [x,y] of [[K.x0+16,14],[K.x1-15,7],[K.x0+26,18],[K.x1-25,5]]) put(A.boneHeap?A.boneHeap():A.rock(1),x,y);
  const res={...r,H,grid,obj,solid,inter,spawn:{x:r.spawn.x,y:r.spawn.y+sh}};
  /* cổng dịch chuyển mới (toạ độ đã là khung mới) */
  const pre=new Set(((M.preOY||{}).portals||[]).map(q=>q.id)); for(const q of M.portals) if(!pre.has(q.id)&&WORLD.addPortal) WORLD.addPortal(res,q);
  const nz=[...AR.map(a=>({name:a.name,x0:a.x0+1,y0:a.y0+1,x1:a.x1-1,y1:a.y1-1})),{name:'Đại lộ Đỉnh Bắc',x0:2,y0:a0(AR)+1,x1:W-3,y1:OY-1}], oz=(r.zones||[]).map(z=>({...z,y0:z.y0+OY,y1:z.y1+OY}));
  res.zones=[...nz,...oz]; res.districts=res.zones.map(z=>({name:z.name.split(' · ')[0],x:(z.x0+z.x1+1)/2,y:(z.y0+z.y1+1)/2})); return res; }
const a0=L=>Math.max(...L.map(a=>a.y1));
const mw=WORLD.muWest; WORLD.muWest=m=>north(mw(m));
const an0=X.anim; X.anim=(o,clock)=>{ const f=Math.floor(clock*2)%2;
  if(o.anim==='ncmd') return command(f); if(o.anim==='npylon') return pylon(o.col,Math.floor(clock*3)%2); if(o.anim==='ncons') return consoleBox(Math.floor(clock*4)%2); if(o.anim==='nshrine') return shrine(Math.floor(clock*1.5)%2); if(o.anim==='nnote') return note(Math.floor(clock*3)%2);
  return an0?an0(o,clock):null; };

/* ---------- hiệu ứng cơ chế boss mới ---------- */
const here=()=>GAME.S&&GAME.S.kind==='mu', U=()=>window.MU8, posOf=pid=>{ if(pid===NET.pid) return [GAME.P.x,GAME.P.y]; const r=GAME.REM&&GAME.REM.get(pid); return r?[r.x,r.y]:null; };
const NAMES={}, TORN=[], SLASH=[], SEEN={}, rnd=(a,b)=>a+Math.random()*(b-a);
const bossOf=id=>((U()&&U().boss().list)||[]).find(b=>b.id===id), until=(B,k)=>B[k]>0&&NET.now()<(B.ts||0)+B[k];
NET.listen('mufx',e=>{ if(!here()||!U()) return; const u=U(), me=e.to===NET.pid||(Array.isArray(e.to)&&e.to.includes(NET.pid));
  if(e.k==='dnote'){ NAMES[e.to]=e.name; if(me){ GAME.bigText('📓 TÊN BẠN ĐÃ BỊ GHI VÀO DEATH NOTE!'); GAME.sfx('blip',.7); } return; }
  if(e.k==='dnhit'){ const p=posOf(e.to); if(p){ u.burst(p[0],p[1]-20,36,{col:['#e8202a','#1c1516','#ffffff'],kind:'spark',sp:[60,200],life:[.25,.55]}); u.ring(p[0],p[1],6,46,.5,'#e8202a',3,1); }
    u.burst(e.ox*T,e.oy*T-30,20,{col:['#2a1a3a','#4a3a5a'],kind:'smoke',sp:[10,40],life:[.4,.8],size:[3,5],add:false,up:10}); u.shake(me?7:3,.4); if(me) GAME.bigText('DEATH NOTE: -50% MÁU!'); GAME.sfx('poof',.6); return; }
  if(e.k==='windwall'){ GAME.bigText('YASUO: TƯỜNG GIÓ! (chặn mọi đòn 3 giây)'); GAME.sfx('dash',.6); u.ring(e.x*T,e.y*T,8,60,.5,'#bff0ff',3,1); return; }
  if(e.k==='airup'){ for(const pid of e.to){ const p=posOf(pid); if(p){ u.burst(p[0],p[1]-10,24,{col:['#e8f4ff','#bff0ff','#ffffff'],kind:'spark',sp:[60,160],dir:-1.57,spread:.8,life:[.3,.6]}); u.ring(p[0],p[1],4,30,.4,'#bff0ff',2,1); } }
    GAME.bigText(me?'BỊ HẤT TUNG LÊN KHÔNG!':'YASUO: '+String(e.name||'').toUpperCase()+'!'); u.shake(5,.4); GAME.sfx('dash',.8); return; }
  if(e.k==='ulthit'){ const p=posOf(e.to); if(p) SLASH.push({x:p[0],y:p[1]-30,t:performance.now()}); u.shake(2.5,.12); GAME.sfx('dash',.35); return; }
  if(e.k==='ultland'){ GAME.bigText(`YASUO ĐÁP ĐẤT · CHÉM NHANH ×${e.fast} · GIÁP +${Math.round(e.armor*100)}% · KHÁNG PHÉP +${Math.round(e.resist*100)}%`); u.ring(e.x*T,e.y*T,8,90,.6,'#bff0ff',4,1); u.shake(6,.5); GAME.sfx('power_up',.7); return; }
  if(e.k==='bclone'){ GAME.bigText('YONE PHÂN THÂN!'); u.burst(e.x*T,e.y*T-24,40,{col:['#6a3aa8','#3a2a5a','#c8a0ff'],kind:'smoke',sp:[20,80],life:[.5,1],size:[3,6],add:false,up:15}); GAME.sfx('poof',.6); return; }
  if(e.k==='bfade'){ u.burst(e.x*T,e.y*T-24,30,{col:['#6a3aa8','#3a2a5a'],kind:'smoke',sp:[10,40],life:[.5,1],size:[3,5],add:false,up:20}); return; }
  if(e.k==='bcall'&&e.boss==='yone') GAME.toast('⚠ Yone có mặt: Yasuo và Yone gây <b>sát thương chuẩn</b> (xuyên giáp + thủ)','lock');
  if(e.k==='bcall'&&e.boss==='rem') GAME.toast('⚠ Rem xuất hiện: 2 thần chết cùng đánh 1 người với tốc độ ×10, người bị nhắm hãy chạy!','lock');
  if(e.k==='bhit'&&e.ak==='locxoay') TORN.push({x:e.x*T,y:e.y*T,ang:e.ang,L:e.range*T,t:performance.now()});
  if(e.k==='bhit'&&e.ak==='muatao') u.burst(e.x*T,e.y*T-4,10,{col:['#e8202a','#ff8a8a','#ffffff'],kind:'dot',sp:[30,90],life:[.2,.45],size:[1.5,3]}); });
// lốc xoáy: các vòng elip chồng nhau xoay, chạy dọc đường lốc
function tornado(ctx,x,y,clock,a=1){ ctx.save(); ctx.globalAlpha=.7*a; for(let i=0;i<7;i++){ const k=i/6, rx=5+k*13, yy=y-k*40; ctx.strokeStyle=i%2?'#e8f4ff':'#a8b8c8'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x+Math.sin(clock*9+i)*3*k,yy,rx,rx*.32,0,clock*8+i,clock*8+i+4.2); ctx.stroke(); } ctx.restore(); }
function skull(ctx,x,y,col){ ctx.fillStyle='#1c1516'; ctx.fillRect(x-5,y-5,11,10); ctx.fillStyle=col; ctx.fillRect(x-4,y-4,9,6); ctx.fillRect(x-3,y+2,7,2); ctx.fillStyle='#1c1516'; ctx.fillRect(x-3,y-2,3,2); ctx.fillRect(x+1,y-2,3,2); ctx.fillRect(x-1,y+2,1,2); ctx.fillRect(x+1,y+2,1,2); }
const txt=(ctx,s,x,y,col,px=14)=>{ ctx.font=px+'px VT323, monospace'; ctx.textAlign='center'; ctx.fillStyle='#1c1516'; ctx.fillText(s,x+1,y+1); ctx.fillStyle=col; ctx.fillText(s,x,y); };
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()||!U()) return; const cam=GAME.cam, clock=GAME.clock, now=performance.now(), tn=NET.now(), u=U();
  for(const B of u.boss().list||[]){ if(!BS_N.has(B.id)) continue; const bx=B.x*T-cam.x, by=B.y*T-cam.y;
    if(B.dn){ const [pid,ms]=B.dn, left=Math.max(0,ms-(tn-(B.ts||tn)))/1000, p=posOf(pid), nm=NAMES[pid]||'';   /* Death Note: sổ trên đầu Ryuk ghi tên, đầu lâu đếm ngược trên người bị ghi */
      list.push({y:99993,d:()=>{ ctx.save(); const nx=bx, ny=by-110; ctx.fillStyle='#0c0a10'; ctx.fillRect(nx-16,ny-10,32,22); ctx.fillStyle='#3a3448'; ctx.fillRect(nx-1,ny-10,2,22); ctx.fillStyle='#e8e4f0'; ctx.fillRect(nx+3,ny-6,10,1); ctx.fillRect(nx+3,ny-2,8,1); ctx.fillRect(nx-13,ny-6,10,1);
        txt(ctx,'DEATH NOTE',nx,ny-14,'#e8e4f0',12); if(nm) txt(ctx,nm,nx,ny+24,'#ff4a4a',14); ctx.restore();
        if(p){ const X0=p[0]-cam.x, Y0=p[1]-cam.y; ctx.save(); ctx.globalAlpha=.35+.3*Math.abs(Math.sin(clock*10)); ctx.strokeStyle='#e8202a'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(X0,Y0,14,6,0,0,7); ctx.stroke(); ctx.globalAlpha=1;
          skull(ctx,Math.round(X0),Math.round(Y0-58),'#f4ecd8'); txt(ctx,left.toFixed(1),X0,Y0-66,'#ff4a4a',16); ctx.restore(); } }}); }
    if(B.focus&&(B.id==='ryuk'||B.id==='rem')){ const p=posOf(B.focus); if(p) list.push({y:99992,d:()=>{ const X0=p[0]-cam.x, Y0=p[1]-cam.y-50; ctx.save(); ctx.translate(X0,Y0); ctx.rotate(clock*2); ctx.strokeStyle='#ff3a3a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,8,0,7); ctx.moveTo(-12,0); ctx.lineTo(-4,0); ctx.moveTo(4,0); ctx.lineTo(12,0); ctx.moveTo(0,-12); ctx.lineTo(0,-4); ctx.moveTo(0,4); ctx.lineTo(0,12); ctx.stroke(); ctx.restore(); }}); }
    if(until(B,'ww')) list.push({y:B.y*T+30,d:()=>{ ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=0;i<5;i++){ const r=30+i*3; ctx.globalAlpha=.25+.12*Math.sin(clock*8+i); ctx.strokeStyle=i%2?'#bff0ff':'#ffffff'; ctx.lineWidth=2; ctx.setLineDash([10,6]); ctx.lineDashOffset=-clock*60*(i%2?1:-1); ctx.beginPath(); ctx.ellipse(bx,by-24,r,r*.95,0,0,7); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); }});   /* tường gió bao quanh Yasuo */
    if(until(B,'fast')&&Math.random()<.5) u.burst(B.x*T+rnd(-14,14),B.y*T-rnd(10,40),2,{col:['#bff0ff','#ffffff','#7fd8ff'],kind:'spark',sp:[80,180],dir:Math.random()<.5?0:3.14,spread:.2,life:[.1,.25]});   /* chém nhanh: vệt gió */
    if(B.air) for(const pid of B.air){ const p=posOf(pid); if(p) list.push({y:p[1]+1,d:()=>tornado(ctx,p[0]-cam.x,p[1]-cam.y,clock,.8)}); }
    for(const z of B.tele||[]){ if(z.k!=='muatao') continue; const s0=SEEN[z.id]||(SEEN[z.id]=tn), span=Math.max(300,z.at-s0), w=Math.max(0,Math.min(1,(tn-s0)/span)), X0=z.x*T-cam.x, Y0=z.y*T-cam.y-(1-w)*110;   /* táo rơi xuống chỗ cảnh báo */
      list.push({y:99980,d:()=>{ ctx.fillStyle='#1c1516'; ctx.beginPath(); ctx.arc(X0,Y0-6,5.5,0,7); ctx.fill(); ctx.fillStyle='#d8202a'; ctx.beginPath(); ctx.arc(X0,Y0-6,4.5,0,7); ctx.fill(); ctx.fillStyle='#ff8a8a'; ctx.fillRect(X0-3,Y0-9,2,2); ctx.fillStyle='#5a3a22'; ctx.fillRect(X0,Y0-13,1,3); ctx.fillStyle='#3ac85a'; ctx.fillRect(X0+1,Y0-13,3,2); }}); } }
  if(Object.keys(SEEN).length>400) for(const k in SEEN) delete SEEN[k];
  for(let i=TORN.length-1;i>=0;i--){ const o=TORN[i], k=(now-o.t)/650; if(k>1){ TORN.splice(i,1); continue; } const x=o.x+Math.cos(o.ang)*o.L*k, y=o.y+Math.sin(o.ang)*o.L*k; if(Math.random()<.5) u.burst(x,y,2,{col:['#c8b898','#a89878'],kind:'dot',sp:[20,60],life:[.3,.6],size:[1.5,2.5],add:false,up:20}); list.push({y,d:()=>tornado(ctx,x-cam.x,y-cam.y,clock,1-k*.3)}); }
  for(let i=SLASH.length-1;i>=0;i--){ const o=SLASH[i], k=(now-o.t)/260; if(k>1){ SLASH.splice(i,1); continue; } list.push({y:99991,d:()=>{ const X0=o.x-cam.x, Y0=o.y-cam.y, L=10+k*18; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=1-k; ctx.strokeStyle='#ffffff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(X0-L,Y0-L); ctx.lineTo(X0+L,Y0+L); ctx.moveTo(X0+L,Y0-L); ctx.lineTo(X0-L,Y0+L); ctx.stroke(); ctx.strokeStyle='#7fd8ff'; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore(); }}); }
  /* bầu không khí: cánh hoa bay ở Ionia, đốm tím ở Thế giới Thần Chết, tia điện xanh ở căn cứ */
  const P=GAME.P, tx=P.x/T, ty=P.y/T, a=AR.find(z=>inA(z,tx,ty)); if(a&&Math.random()<.35){ const x=cam.x+Math.random()*innerWidth/(GAME.SCALE||3), y=cam.y+Math.random()*innerHeight/(GAME.SCALE||3)*.6;
    if(a.tile==='*') u.burst(x,y,1,{col:['#ffb8d8','#ff90c0','#ffffff'],kind:'leaf',sp:[15,35],dir:.6,spread:.4,life:[1.6,2.6],size:[1,2],add:false,g:8});
    else if(a.tile==='=') u.burst(x,y+80,1,{col:['#a060ff','#7a3ad8','#c8a0ff'],kind:'dot',sp:[5,15],dir:-1.57,spread:.6,life:[1.2,2],size:[1,2],up:10});
    else if(Math.random()<.4) u.burst(x,y+60,1,{col:['#3ad8ff','#bff0ff'],kind:'spark',sp:[30,80],life:[.15,.3]}); } };
const BS_N=new Set(Object.entries(M.bosses).filter(([,b])=>b.north).map(([k])=>k));
})();
