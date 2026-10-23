/* Chan City — Giải Ngoại Hạng Anh (map 'epl', data.js EPL, server/epl.js): 6 sân bóng (2 hàng × 3, cổng nhìn ra quảng trường giữa), mặt cỏ kẻ sọc, khán đài màu CLB,
   đèn pha, bảng điện tử, ca bin dự bị, sạp hàng + quầy vé trước cổng; quảng trường: cúp Premier League, bảng xếp hạng, xe buýt 2 tầng, bốt điện thoại đỏ, Tổng kho, xe đồ ăn, biển Grab.
   Trận đang đá: 22 cầu thủ bot mặc áo 2 đội chạy theo bóng, bàn thắng bóng bay vào lưới + pháo giấy, bảng tỉ số góc trên. Mini-game sút: tập penalty / cơ hội dứt điểm trong trận. */
(function(){
const A=ART, T=A.T, TE=A.TILE_EXT, SD=SHARED, E=SD.EPL, CL=E.clubs, IDS=SD.EPL_CLUBS, X=MAPX, hh=A.hash, S=(w,h0,ax,ay,fn,ol=true)=>A.sprite(w,h0,ax,ay,fn,ol);
const esc=s=>GAME.esc(String(s)), fmt=SD.fmt, btn=(...a)=>UI.btn(...a), toast=(m,k)=>GAME.toast(m,k), $=s=>document.querySelector(s), CR={}, once=(k,f)=>CR[k]||(CR[k]=f());
const here=()=>GAME.S&&GAME.S.kind==='epl', top=k=>E.top(k);
const hx=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)), lite=(c,k)=>'#'+hx(c).map(v=>Math.round(v+(255-v)*k).toString(16).padStart(2,'0')).join(''), dark=(c,k)=>'#'+hx(c).map(v=>Math.round(v*(1-k)).toString(16).padStart(2,'0')).join('');
/* ---------- nền: cỏ sân kẻ sọc, khán đài màu CLB, tường bê tông ---------- */
for(const k of ['<','>']) A.WALKABLE.add(k);
const turf=(base,P,X0,Y0,tx,ty)=>{ P.rect(X0,Y0,T,T,base); for(let i=0;i<4;i++){ const x=(hh(tx,ty,511+i)*15)|0, y=(hh(tx,ty,521+i)*14)|0; P.rect(X0+x,Y0+y,1,2,lite(base,.18)); } };
TE['<']=(g,X0,Y0,tx,ty,nb,fr,P)=>turf('#55a43e',P,X0,Y0,tx,ty);
TE['>']=(g,X0,Y0,tx,ty,nb,fr,P)=>turf('#4a9636',P,X0,Y0,tx,ty);
TE['$']=(g,X0,Y0,tx,ty,nb,fr,P)=>{ const k=E.clubAt(tx+.5,ty+.5), c=k?CL[k]:{col:'#7a7a84',col2:'#d8d8d8'}, aisle=(tx-(k?CL[k].bx:0))%9===4;   /* 2 hàng ghế / ô, lối đi bậc thang mỗi 9 ô */
  if(aisle){ P.rect(X0,Y0,T,T,'#8a8a92'); for(let y=0;y<T;y+=4) P.rect(X0,Y0+y,T,1,'#6a6a72'); return; }
  for(let r=0;r<2;r++){ const y=Y0+r*8, sc=(ty*2+r)%3===0?c.col2:c.col; P.rect(X0,y,T,8,dark(sc,.25)); P.rect(X0,y+5,T,3,sc); P.rect(X0,y+7,T,1,dark(sc,.45));
    for(let s=0;s<4;s++){ if(hh(tx*4+s,ty*2+r,531)<.55){ const hx0=X0+s*4+1, skin=['#f3c4a4','#e0a882','#b97a58','#8f5a3c'][(hh(tx*4+s,ty,532)*4)|0]; P.rect(hx0,y+1,3,3,skin); P.rect(hx0,y,3,1,hh(tx*4+s,ty,533)<.5?'#2a2226':c.col); } } } };
TE['|']=(g,X0,Y0,tx,ty,nb,fr,P)=>{ const below=nb(0,1); P.rect(X0,Y0,T,T,'#6c6c76'); for(let y=0;y<T;y+=8) P.rect(X0,Y0+y,T,1,'#58585f'); P.rect(X0+(ty%2?4:12),Y0,1,T,'#58585f');
  if(below&&below!=='|'&&below!=='$'){ P.rect(X0,Y0+11,T,5,'#4a4a52'); P.rect(X0,Y0+11,T,1,'#8a8a94'); } };
/* ---------- sprite ---------- */
const crest=k=>once('cr'+k,()=>S(18,22,9,21,(g,P)=>{ const c=CL[k]; P.rect(2,1,14,13,c.col); P.rect(3,14,12,3,c.col); P.rect(5,17,8,2,c.col); P.rect(7,19,4,2,c.col); P.rect(3,2,12,4,c.col2); A.drawText(g,c.short,3,7,c.col2); P.rect(8,0,2,2,'#e8b830'); }));   /* huy hiệu cách điệu */
function markings(k){ return once('mk'+k,()=>{ const R=E.pitch(k), w=(R.x1-R.x0+1)*T, h=(R.y1-R.y0+1)*T; return S(w,h,0,0,(g)=>{ g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2;
  const L=(x,y,a,b)=>g.strokeRect(x+1,y+1,a,b); L(4,4,w-10,h-10); g.beginPath(); g.moveTo(w/2,5); g.lineTo(w/2,h-5); g.stroke(); g.beginPath(); g.arc(w/2,h/2,40,0,7); g.stroke(); g.fillStyle='#fff'; g.fillRect(w/2-2,h/2-2,4,4);
  const bh=h*.56, gh=h*.28; L(4,(h-bh)/2,58,bh); L(w-64,(h-bh)/2,58,bh); L(4,(h-gh)/2,22,gh); L(w-28,(h-gh)/2,22,gh); g.fillRect(42,h/2-1,3,3); g.fillRect(w-46,h/2-1,3,3);
  for(const s of [-1,1]){ g.beginPath(); g.arc(s<0?62:w-62,h/2,22,s<0?-.95:Math.PI-.95,s<0?.95:Math.PI+.95); g.stroke(); }
  for(const [x,y,a0] of [[5,5,0],[w-5,5,Math.PI/2],[w-5,h-5,Math.PI],[5,h-5,-Math.PI/2]]){ g.beginPath(); g.arc(x,y,7,a0,a0+Math.PI/2); g.stroke(); } },false); }); }
const goalSpr=right=>once('goal'+right,()=>S(20,52,10,50,(g,P)=>{ P.rect(right?2:10,2,8,48,'rgba(230,236,244,.35)'); for(let y=4;y<50;y+=4) P.rect(right?2:10,y,8,1,'rgba(255,255,255,.55)'); for(let x=0;x<8;x+=3) P.rect((right?2:10)+x,2,1,48,'rgba(255,255,255,.45)');
  P.rect(right?1:16,0,3,52,'#f4f4f4'); P.rect(right?1:8,0,11,3,'#f4f4f4'); P.rect(right?1:8,49,11,3,'#f4f4f4'); }));
const flood=()=>once('flood',()=>S(22,86,11,84,(g,P)=>{ P.rect(9,18,4,66,'#7a7e8a'); P.rect(9,18,1,66,'#a8acb8'); for(let y=26;y<84;y+=10) P.rect(7,y,8,1,'#5a5e6a'); P.rect(0,0,22,18,'#3a3e4a'); for(let r=0;r<3;r++) for(let c=0;c<4;c++) P.rect(2+c*5,2+r*5,4,4,'#fff6c8'); }));
const board=k=>once('bd'+k,()=>S(112,40,56,38,(g,P)=>{ P.rect(0,0,112,32,'#16161c'); P.rect(2,2,108,28,'#0c0c12'); P.rect(0,32,6,8,'#3a3a44'); P.rect(106,32,6,8,'#3a3a44'); P.rect(2,2,108,2,CL[k].col); A.drawText(g,CL[k].stadium.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,''),6,8,'#ffd84a'); }));
const dugout=k=>once('dg'+k,()=>S(48,26,24,24,(g,P)=>{ P.rect(0,0,48,10,dark(CL[k].col,.2)); P.rect(0,0,48,2,lite(CL[k].col,.3)); P.rect(2,10,44,12,'rgba(180,210,230,.35)'); P.rect(2,18,44,4,'#3a3a44'); for(let x=4;x<44;x+=7) P.rect(x,14,5,4,CL[k].col); }));
const stall=k=>once('st'+k,()=>S(40,40,20,38,(g,P)=>{ const c=CL[k]; for(let i=0;i<5;i++) P.rect(i*8,0,8,10,i%2?c.col2:c.col); P.rect(0,10,40,2,dark(c.col,.3)); P.rect(3,12,2,24,'#5a4030'); P.rect(35,12,2,24,'#5a4030');
  P.rect(2,24,36,14,'#8a6a4a'); P.rect(2,24,36,2,'#b08a62'); P.rect(6,18,8,6,c.col); P.rect(16,19,6,5,'#e8c070'); P.rect(25,18,9,6,c.col2); P.rect(8,28,6,4,'#d8302a'); }));
const booth=k=>once('bo'+k,()=>S(34,40,17,38,(g,P)=>{ const c=CL[k]; P.rect(0,0,34,8,c.col); P.rect(0,0,34,2,lite(c.col,.4)); A.drawText(g,'VE',11,2,c.col2); P.rect(2,8,30,30,'#d8d0c0'); P.rect(6,12,22,12,'#8ac0d8'); P.rect(6,12,22,2,'#c8e8f8'); P.rect(2,26,30,12,dark(c.col,.15)); }));
const trophy=()=>once('cup',()=>S(48,78,24,76,(g,P)=>{ P.rect(6,58,36,18,'#5a5662'); P.rect(6,58,36,3,'#8a8692'); P.rect(10,52,28,8,'#4a4652'); A.drawText(g,'EPL',15,64,'#ffd84a');
  P.rect(18,40,12,12,'#c8a030'); P.rect(14,48,20,5,'#e8c040'); P.disc(24,26,13,'#e8c040'); P.disc(24,25,10,'#ffe070'); P.rect(9,20,5,10,'#c8a030'); P.rect(34,20,5,10,'#c8a030'); P.rect(18,4,12,8,'#e8c040'); P.rect(20,0,8,5,'#ffe070'); P.rect(20,22,3,6,'#fff6c8'); P.rect(14,36,20,4,'#6a2a8a'); }));   /* cúp vàng, đai tím Premier League */
const leagueBoard=()=>once('lb',()=>S(128,64,64,62,(g,P)=>{ P.rect(0,0,128,52,'#2a0a3a'); P.rect(2,2,124,48,'#3d1052'); P.rect(2,2,124,10,'#5a1a78'); A.drawText(g,'PREMIER LEAGUE',22,4,'#ffffff');
  for(let i=0;i<6;i++){ P.rect(6,15+i*6,116,5,i%2?'#4a1662':'#541a6e'); P.rect(8,16+i*6,3,3,'#00ff85'); } P.rect(10,52,6,12,'#3a3a44'); P.rect(112,52,6,12,'#3a3a44'); }));
const phone=()=>once('ph',()=>S(20,44,10,42,(g,P)=>{ P.rect(1,2,18,40,'#c8102e'); P.rect(1,2,18,3,'#e8303a'); P.rect(0,0,20,3,'#a80a22'); for(let r=0;r<4;r++) for(let c=0;c<3;c++) P.rect(4+c*4,10+r*7,3,5,'#bfe8f8'); P.rect(3,5,14,3,'#1c1516'); A.drawText(g,'TEL',4,5,'#ffffff'); }));
const bus=()=>once('bus',()=>S(96,58,48,56,(g,P)=>{ P.rect(2,4,92,46,'#c8102e'); P.rect(2,4,92,3,'#e8404a'); P.rect(2,26,92,2,'#8a0a1a'); for(let i=0;i<8;i++){ P.rect(8+i*11,9,8,10,'#bfe8f8'); P.rect(8+i*11,31,8,10,'#bfe8f8'); } P.rect(4,0,88,5,'#1c1516');
  P.rect(70,31,10,17,'#2a2a34'); A.drawText(g,'LONDON',30,21,'#ffd84a'); for(const x of [16,76]){ P.disc(x,51,6,'#1c1516'); P.disc(x,51,3,'#8a8a94'); } }));
const bench=()=>A.bench?A.bench():once('bn',()=>S(30,14,15,12,(g,P)=>{ P.rect(0,4,30,4,'#8a5a32'); P.rect(2,8,3,6,'#3a3a44'); P.rect(25,8,3,6,'#3a3a44'); }));
/* ---------- dựng map ---------- */
function buildEpl(){ const W=E.W, H=E.H, obj=[], solid=[], inter=[], put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; }, block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{ if(y<=1||x<=1||x>=W-2||y>=H-2) return '|';
    if((y>=37&&y<=40)||(y>=59&&y<=62)) return '9'; if(x>=50&&x<=108&&y>=41&&y<=58) return '9'; return 'G'; }));
  for(const k of IDS){ const c=CL[k], B=E.block(k), Pt=E.pitch(k), t=top(k), gx0=c.bx+E.gate[0], gx1=c.bx+E.gate[1];
    for(let y=B.y0;y<=B.y1;y++) for(let x=B.x0;x<=B.x1;x++){ const lx=x-c.bx, ly=y-c.by, edge=lx===0||lx===E.bw-1||ly===0||ly===E.bh-1;
      let ch; if(edge) ch='|'; else if(x>=Pt.x0&&x<=Pt.x1&&y>=Pt.y0&&y<=Pt.y1) ch=Math.floor((x-Pt.x0)/3)%2?'>':'<'; else if(x>=Pt.x0-1&&x<=Pt.x1+1&&y>=Pt.y0-1&&y<=Pt.y1+1) ch='9'; else ch='$';
      if(x>=gx0&&x<=gx1&&(t?y>Pt.y1:y<Pt.y0)) ch='9'; g[y][x]=ch; }   /* cổng + lối vào xuyên khán đài gần */
    for(let x=gx0;x<=gx1;x++) for(const y of t?[B.y1+1,B.y1+2,B.y1+3]:[B.y0-1,B.y0-2,B.y0-3]) g[y][x]='9';
    put(markings(k),Pt.x0,Pt.y0,{flat:true}); const my=(Pt.y0+Pt.y1+1)/2;
    put(goalSpr(false),Pt.x0-.15,my+1.6,{sort:(my+1.6)*T}); put(goalSpr(true),Pt.x1+1.15,my+1.6,{sort:(my+1.6)*T});
    for(const [x,y] of [[B.x0+1.5,B.y0+2.6],[B.x1-.5,B.y0+2.6],[B.x0+1.5,B.y1-.2],[B.x1-.5,B.y1-.2]]) put(flood(),x,y);
    const far=t?B.y0+4.4:B.y1-1.6, near=t?Pt.y1+1.9:Pt.y0-.1; put(board(k),(B.x0+B.x1+1)/2,far,{eplBoard:k});
    put(dugout(k),Pt.x0+11,near,{sort:near*T}); put(dugout(k),Pt.x1-10,near,{sort:near*T});
    const gy=t?B.y1+1:B.y0; put(A.label(c.stadium.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,''),'#1c1516','#ffd84a'),(gx0+gx1+1)/2,t?gy+.2:gy+.9,{flat:true}); put(crest(k),gx0-1.2,t?gy+.1:gy+.9); put(crest(k),gx1+2.2,t?gy+.1:gy+.9);
    const sp=E.stall(k); put(stall(k),sp.x,sp.y-.6,{eplStall:k}); block(Math.floor(sp.x)-1,Math.floor(sp.y)-1,Math.floor(sp.x),Math.floor(sp.y)-1);
    const bx=c.bx+E.gate[1]+3.5, by=t?B.y1+1.6:B.y0-1.6; put(booth(k),bx,by-.7); block(Math.floor(bx)-1,Math.floor(by)-2,Math.floor(bx),Math.floor(by)-2); }
  /* quảng trường */
  put(A.label('PREMIER LEAGUE · NGOAI HANG ANH','#3d1052','#ffffff'),79,41.4,{flat:true}); put(leagueBoard(),79,45.4); block(75,43,82,44);
  put(trophy(),79,51.4); block(77,49,80,50); put(phone(),56.5,44.4); block(56,43,56,43); put(bus(),101,47.8); block(98,45,103,46);
  put(A.grabSign(),73.5,57.8,{grab:true}); block(73,56,73,56);
  put(A.stall('#3d1052',['#ef0107','#6cabdd','#ffffff']),66.5,52.6); block(65,51,67,51); put(A.stall('#c8102e',['#e8b860','#f4ead8','#5fae46']),92.5,52.6); block(91,51,93,51);   /* Tổng kho đồ cổ động · xe đồ ăn */
  for(const x of [54,62,96,104]) for(const y of [43,57]){ put(bench(),x,y+.4); }
  for(let x=6;x<W-6;x+=9){ for(const y of [36.6,64]){ if(IDS.some(k=>x>=CL[k].bx+E.gate[0]-6&&x<=CL[k].bx+40)) continue;   /* chừa cổng, quầy vé, sạp hàng */ put(A.tree((x*3)|0,.85),x+.5,y,{tree:true}); block(x,Math.ceil(y)-1,x,Math.ceil(y)-1); } }
  for(const x of [50,58,100,108]) for(const y of [41.4,58.6]) if(A.lamp){ put(A.lamp(),x,y); }
  const zones=[...IDS.map(k=>{ const B=E.block(k); return {name:`Sân ${CL[k].stadium} · ${CL[k].name}`,x0:B.x0,y0:B.y0,x1:B.x1,y1:B.y1}; }),{name:'Quảng trường Premier League',x0:2,y0:35,x1:W-3,y1:64}];
  return {name:'Giải Ngoại Hạng Anh · nước Anh',W,H,grid:g,obj,solid,inter,zones,districts:zones.map(z=>({name:z.name.split(' · ')[0],x:(z.x0+z.x1+1)/2,y:(z.y0+z.y1+1)/2})),spawn:{x:E.spawn.x*T,y:E.spawn.y*T},music:'pickle'}; }
WORLD.buildEpl=buildEpl;
/* ---------- trạng thái từ server ---------- */
let LV=null, FULL=null, LVT=0;
NET.listen('epl',m=>{ LV=m.v; LVT=performance.now(); if(m.full) FULL=m.full; hud(); if(UI.isOpen&&UI.isOpen()) UI.refresh(); });
const refresh=async()=>{ const r=await NET.req({t:'epl',op:'view'}); if(r&&r.v){ FULL=r.v; LV=r.v.live; hud(); } return r; };
const doAct=async q=>{ const r=await GAME.act({t:'epl',...q}); if(r&&r.v){ FULL=r.v; LV=r.v.live; } if(r&&r.look&&GAME.G) GAME.G.look=r.look; if(r&&r.msg) toast(esc(r.msg),'quest'); if(UI.isOpen&&UI.isOpen()) UI.refresh(); hud(); return r; };
/* ---------- bảng tỉ số góc trên ---------- */
function hud(){ let el=$('#eplHud'); if(!el){ el=document.createElement('div'); el.id='eplHud'; el.className='panel'; el.style.cssText='position:fixed;left:50%;top:44px;transform:translateX(-50%);z-index:4;display:flex;gap:10px;padding:4px 10px;font-size:17px;color:#fff3d6;pointer-events:none'; document.body.appendChild(el); }
  if(!here()||!LV){ el.hidden=true; return; } el.hidden=false; const min=Math.min(90,Math.floor((NET.now()-LV.at)/(E.dur*1000)*90));
  el.innerHTML=LV.fx.map(f=>`<span><b style="color:${CL[f.h].col==='#241f20'?'#ddd':lite(CL[f.h].col,.2)}">${CL[f.h].short}</b> ${f.sh}–${f.sa} <b style="color:${CL[f.a].col==='#241f20'?'#ddd':lite(CL[f.a].col,.2)}">${CL[f.a].short}</b></span>`).join('<span class="muted">·</span>')+`<span class="muted">${Math.max(0,min)}'</span>`; }
setInterval(()=>{ if(here()) hud(); else { const el=$('#eplHud'); if(el) el.hidden=true; } },1000);
/* ---------- cầu thủ bot trên sân: đội nhà bên trái, khách bên phải, sơ đồ 4-4-2, bóng chuyền qua lại ---------- */
const FORM=[[.04,.5],[.18,.18],[.16,.4],[.16,.6],[.18,.82],[.33,.15],[.31,.38],[.31,.62],[.33,.85],[.45,.36],[.45,.64]];
const HAIR=['buzz','fade','swept','messy','undercut','fringe'], HC=['211c21','3a2f37','6b4128','c98a45','1c1820'], SKN=['f8cdb0','f3b194','e8a882','b97a58','8f5a3c'];
const MATCH={};   /* khoá `${md}:${h}` → {bots, ball} */
function setup(f,md){ const key=md+':'+f.h; if(MATCH[key]) return MATCH[key]; for(const k of Object.keys(MATCH)) if(!k.startsWith(md+':')) delete MATCH[k];
  const R=E.pitch(f.h), bots=[], d2=(a,b)=>{ const A0=hx(CL[a].col), B0=hx(CL[b].col); return Math.hypot(A0[0]-B0[0],A0[1]-B0[1],A0[2]-B0[2]); }, away=d2(f.h,f.a)<170;   /* trùng màu: đội khách mặc áo sân khách */
  for(const [team,club] of [[0,f.h],[1,f.a]]) FORM.forEach(([fx,fy],i)=>{ const bx=team?1-fx:fx, look={gender:'nam',hair:HAIR[(i*7+team*3)%6],hairColor:HC[(i+team*2)%5],skin:SKN[(i*3+team)%5],outfit:{top:i===0?(team?'tee_den':'tee_xanh'):'kit_'+club+(team&&away?'_away':''),bottom:'short_xam',shoes:'giay_den'}};
    const x=R.x0+bx*(R.x1-R.x0+1), y=R.y0+fy*(R.y1-R.y0+1); bots.push({team,i,bx,by:fy,x,y,face:team?-1:1,av:AVATAR.build(look),run:0}); });
  const M={bots,ball:{x:(R.x0+R.x1+1)/2,y:(R.y0+R.y1+1)/2,tx:0,ty:0,owner:-1,next:0,goal:null},R,cele:0,celeTeam:0}; MATCH[key]=M; return M; }
function stepMatch(M,dt,now){ const R=M.R, w=R.x1-R.x0+1, hgt=R.y1-R.y0+1, b=M.ball;
  if(b.goal){ const k=Math.min(1,(now-b.goal.t)/500); b.x=b.goal.x0+(b.goal.x1-b.goal.x0)*k; b.y=b.goal.y0+(b.goal.y1-b.goal.y0)*k; if(now-b.goal.t>2600){ b.goal=null; b.x=R.x0+w/2; b.y=R.y0+hgt/2; b.owner=-1; } }
  else if(b.owner<0||now>b.next){ const pick=M.bots.filter(o=>o.i>0); const o=pick[Math.floor(Math.random()*pick.length)]; b.owner=M.bots.indexOf(o); b.next=now+900+Math.random()*1400; b.tx=o.x; b.ty=o.y; }
  else { const o=M.bots[b.owner]; b.tx=o.x+o.face*.4; b.ty=o.y; const d=Math.hypot(b.tx-b.x,b.ty-b.y); if(d>.05){ const s=Math.min(d,dt*9); b.x+=(b.tx-b.x)/d*s; b.y+=(b.ty-b.y)/d*s; } }
  for(const o of M.bots){ const ax=R.x0+o.bx*w, ay=R.y0+o.by*hgt, pull=o.i===0?.06:.2, hold=M.bots[b.owner]===o; let tx=ax+(b.x-ax)*pull, ty=ay+(b.y-ay)*pull;
    if(hold){ tx=o.x+(o.team?-1:1)*1.2; ty=o.y+(Math.random()-.5)*.4; } if(M.cele>now&&o.team===M.celeTeam&&o.i>0){ tx=R.x0+(o.team?.2:.8)*w; ty=R.y0+hgt/2+(o.i-5)*.3; }
    tx=Math.max(R.x0+.3,Math.min(R.x1+.7,tx)); ty=Math.max(R.y0+.6,Math.min(R.y1+.7,ty)); const dx=tx-o.x, dy=ty-o.y, d=Math.hypot(dx,dy), sp=(hold?3.4:2.6)*dt;
    if(d>.08){ o.x+=dx/d*Math.min(d,sp); o.y+=dy/d*Math.min(d,sp); o.run=1; if(Math.abs(dx)>.05) o.face=dx>0?1:-1; } else o.run=0; } }
NET.listen('eplgoal',m=>{ if(!here()) return; const md=LV&&LV.md, key=md+':'+m.h, M=MATCH[key], R=E.pitch(m.h), my=(R.y0+R.y1+1)/2, P=GAME.P, at=E.clubAt(P.x/T,P.y/T);
  if(M){ const toRight=m.team===0; M.ball.goal={t:performance.now(),x0:M.ball.x,y0:M.ball.y,x1:toRight?R.x1+1.3:R.x0-.3,y1:my+(Math.random()-.5)*1.2}; M.cele=performance.now()+2600; M.celeTeam=m.team; confetti(toRight?R.x1:R.x0,my,CL[m.team?m.a:m.h]); }
  if(LV){ const f=LV.fx.find(x=>x.h===m.h); if(f){ f.sh=m.sh; f.sa=m.sa; } } hud();
  const c=CL[m.team?m.a:m.h]; if(at===m.h){ GAME.bigText(`⚽ GOAL! ${m.who} (${c.short}) ${m.min}'`); GAME.sfx('level_up',.6); GAME.shake&&GAME.shake(4,.3); } else toast(`⚽ ${esc(m.who)} ghi bàn cho ${esc(c.name)} · ${CL[m.h].short} ${m.sh}–${m.sa} ${CL[m.a].short}`,'quest'); });
NET.listen('eplcheer',m=>{ if(!here()) return; const r=GAME.REM&&GAME.REM.get(m.pid), p=m.pid===NET.pid?GAME.P:r; if(p) puff(p.x/T,p.y/T-2.6,CL[m.club]); });
/* ---------- hạt: pháo giấy bàn thắng, khói màu cổ vũ ---------- */
const PT=[]; function confetti(x,y,c){ for(let i=0;i<70;i++) PT.push({x:x*T,y:y*T-20,vx:(Math.random()-.5)*180,vy:-80-Math.random()*160,t:0,life:1.4+Math.random(),c:[c.col,c.col2,'#ffd84a','#ffffff'][i%4]}); }
function puff(x,y,c){ for(let i=0;i<8;i++) PT.push({x:x*T,y:y*T,vx:(Math.random()-.5)*50,vy:-30-Math.random()*40,t:0,life:.7,c:[c.col,c.col2][i%2]}); }
/* ---------- vẽ ---------- */
let lastT=performance.now();
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()) return; const now=performance.now(), dt=Math.min(.05,(now-lastT)/1000), cam=GAME.cam, clock=GAME.clock; lastT=now;
  const vw=innerWidth/(GAME.SCALE||3), vh=innerHeight/(GAME.SCALE||3);
  if(LV) for(const f of LV.fx){ const M=setup(f,LV.md), R=M.R; stepMatch(M,dt,now); if(R.x1*T<cam.x-40||R.x0*T>cam.x+vw+40||R.y1*T<cam.y-80||R.y0*T>cam.y+vh+40) continue;
    for(const o of M.bots){ const an=o.run?o.av.anims.run||o.av.anims.walk:o.av.anims.idle, fr=an.frames[Math.floor(clock*an.fps+o.i)%an.frames.length], cele=M.cele>now&&o.team===M.celeTeam;
      list.push({y:o.y*T,d:()=>{ const X0=Math.round(o.x*T-cam.x), Y0=Math.round(o.y*T-cam.y)-(cele?Math.abs(Math.round(Math.sin(clock*14+o.i)*5)):0); GAME.shadow(o.x*T,o.y*T,7); ctx.save(); ctx.translate(X0,Y0); if(o.face<0) ctx.scale(-1,1); ctx.drawImage(fr,-16,-48); ctx.restore(); }}); }
    const b=M.ball; list.push({y:b.y*T+1,d:()=>{ const X0=b.x*T-cam.x, Y0=b.y*T-cam.y-3; ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(X0,Y0+3,3,1.4,0,0,7); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(X0,Y0,2.6,0,7); ctx.fill(); ctx.fillStyle='#1c1516'; ctx.fillRect(Math.round(X0)-1,Math.round(Y0)-1,2,2); }});
    const B=E.block(f.h), far=top(f.h)?B.y0+4.4:B.y1-1.6, bx=(B.x0+B.x1+1)/2;   /* bảng điện tử: tỉ số + phút */
    list.push({y:far*T+1,d:()=>{ const X0=bx*T-cam.x, Y0=far*T-cam.y-24; ctx.font='16px VT323, monospace'; ctx.textAlign='center'; ctx.fillStyle='#ffd84a'; ctx.fillText(`${CL[f.h].short} ${f.sh} - ${f.sa} ${CL[f.a].short}`,X0,Y0); ctx.fillStyle='#7fe8ff'; ctx.font='14px VT323, monospace'; ctx.fillText(`${Math.min(90,Math.floor((NET.now()-LV.at)/(E.dur*1000)*90))}'`,X0,Y0+10); }}); }
  for(let i=PT.length-1;i>=0;i--){ const p=PT[i]; p.t+=dt; if(p.t>p.life){ PT.splice(i,1); continue; } p.vy+=220*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; list.push({y:99990,d:()=>{ ctx.globalAlpha=Math.max(0,1-p.t/p.life); ctx.fillStyle=p.c; ctx.fillRect(Math.round(p.x-cam.x),Math.round(p.y-cam.y),3,2); ctx.globalAlpha=1; }}); }
  /* tên người thuê sạp */
  if(FULL&&FULL.stalls) for(const k of IDS){ const n=FULL.stalls[k]; if(!n) continue; const sp=E.stall(k); list.push({y:99970,d:()=>{ ctx.font='14px VT323, monospace'; ctx.textAlign='center'; ctx.fillStyle='#1c1516'; ctx.fillText('Sạp '+n,sp.x*T-cam.x+1,(sp.y-3.3)*T-cam.y+1); ctx.fillStyle='#ffd84a'; ctx.fillText('Sạp '+n,sp.x*T-cam.x,(sp.y-3.3)*T-cam.y); }}); } };
/* ---------- mini-game sút: vạch chạy qua lại, bấm SPACE / chạm khi vạch vào vùng xanh ---------- */
let MG=null;
function mini(title,ms,cb){ let el=$('#eplMini'); if(!el){ el=document.createElement('div'); el.id='eplMini'; el.className='panel'; el.style.cssText='position:fixed;left:50%;bottom:140px;transform:translateX(-50%);z-index:8;width:340px;padding:8px 12px;text-align:center';
    el.innerHTML='<b id="eplMiniT"></b><div style="position:relative;height:22px;margin:8px 0;background:#3a2a2a;border:2px solid #1c1516"><div style="position:absolute;left:40%;width:20%;top:0;bottom:0;background:#3ac85a"></div><div style="position:absolute;left:47%;width:6%;top:0;bottom:0;background:#a8ff90"></div><div id="eplMiniM" style="position:absolute;top:-4px;bottom:-4px;width:4px;background:#fff;box-shadow:0 0 0 1px #1c1516"></div></div><small class="muted">Bấm SPACE hoặc chạm vào đây đúng lúc vạch trắng vào vùng xanh</small>';
    document.body.appendChild(el); el.addEventListener('pointerdown',()=>fire()); }
  el.querySelector('#eplMiniT').textContent=title; el.hidden=false; MG={t0:performance.now(),end:performance.now()+ms,cb,el,speed:1.4+Math.random()*.6}; anim(); }
function anim(){ if(!MG) return; const t=performance.now(); if(t>MG.end){ const g=MG; MG=null; g.el.hidden=true; g.cb(0,true); return; } const ph=((t-MG.t0)/1000*MG.speed)%2, pos=ph<1?ph:2-ph; MG.pos=pos; MG.el.querySelector('#eplMiniM').style.left=(pos*100-1)+'%'; requestAnimationFrame(anim); }
function fire(){ if(!MG) return; const g=MG; MG=null; g.el.hidden=true; const q=Math.max(0,1-Math.abs(g.pos-.5)*2.6); g.cb(q,false); }
addEventListener('keydown',e=>{ if(MG&&(e.code==='Space'||e.key===' ')){ e.preventDefault(); e.stopPropagation(); fire(); } },true);
NET.listen('eplch',m=>{ if(!here()) return; GAME.sfx('blip',.7); mini('⚡ CƠ HỘI DỨT ĐIỂM!',Math.max(1500,m.until-NET.now()),async(q,miss)=>{ if(miss){ toast('Bỏ lỡ cơ hội!','lock'); return; } const r=await NET.req({t:'epl',op:'shot',id:m.id,q}); if(r&&r.goal){ GAME.bigText('⚽ BẠN GHI BÀN!'); GAME.sfx('level_up',.8); } }); });
NET.listen('eplmiss',()=>{ if(here()) toast('Sút trúng thủ môn! Tiếc quá','lock'); });
/* ---------- tương tác (E) ---------- */
const ptIn=(R,x,y)=>x>=R.x0&&x<=R.x1+1&&y>=R.y0&&y<=R.y1+1;
const myStall=()=>FULL&&IDS.find(k=>FULL.stalls[k]===(GAME.G&&GAME.G.name));
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()) return; const P=GAME.P, x=P.x/T, y=P.y/T, at=E.clubAt(x,y), live=at&&LV&&LV.fx.find(f=>f.h===at);
  if(at&&live) consider(30,{type:'mapx',k:'eplcheer',label:`📣 Cổ vũ ${CL[live.h].short}–${CL[live.a].short} (cần vé)`});
  if(at&&!live&&ptIn(E.pitch(at),x,y)) for(const [sx,sy] of E.spots(at)){ const d=dist(sx*T,sy*T); if(d<2*T) consider(d*.4,{type:'mapx',k:'epltrain',label:'🥅 Tập sút phạt đền (năng lượng -6)'}); }
  for(const k of IDS){ const sp=E.stall(k), d=dist(sp.x*T,sp.y*T); if(d<2.6*T){ const mine=myStall()===k, rented=FULL&&FULL.stalls[k]; consider(d*.5,{type:'mapx',k:mine?'eplsell':'eplrent',club:k,label:mine?'🛒 Rao bán hàng':rented?`Sạp của ${rented}`:`🛒 Thuê sạp (${fmt(E.vendor.rent)}/ngày)`}); } }
  { const d=dist(79*T,46*T); if(d<3.2*T) consider(d*.5,{type:'mapx',k:'epltable',label:'🏆 Bảng xếp hạng Ngoại Hạng Anh'}); } };
const p0=X.pick; X.pick=async x=>{ if(!/^epl/.test(x.k||'')) return p0(x);
  if(x.k==='eplcheer'){ const r=await GAME.act({t:'epl',op:'cheer'}); if(r&&r.cheers) toast(`📣 Cổ vũ lần ${r.cheers} · sân nóng ${r.heat}`,'quest'); return; }
  if(x.k==='epltrain') return mini('🥅 Sút phạt đền',4000,async(q,miss)=>{ const r=await doAct({op:'train',q:miss?0:q}); if(r&&!r.err) GAME.sfx(r.goal?'level_up':'poof',.5); });
  if(x.k==='eplsell'){ const r=await GAME.act({t:'epl',op:'sell'}); if(r&&r.v) FULL=r.v; if(r&&r.msg) toast(esc(r.msg),'vnd'); return; }
  if(x.k==='eplrent') return doAct({op:'rent',club:x.club});
  if(x.k==='epltable') return UI.epl(); };
/* ---------- bảng ---------- */
const clubName=k=>`<b style="color:${CL[k].col==='#241f20'?'#ddd':lite(CL[k].col,.25)}">${esc(CL[k].name)}</b>`;
const roleName={player:'Cầu thủ',coach:'Huấn luyện viên'}, tacName=k=>(E.match.tac[k]||{}).name||k;
const until=at=>{ const s=Math.max(0,Math.ceil((at-NET.now())/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
const RULES=`<h5>Luật chơi</h5><ul class="muted">
  <li>Cứ <b>${E.every} phút</b> có 1 vòng 3 trận, mỗi trận ${E.dur/60} phút thật = 90 phút bóng đá. Bàn thắng theo sức mạnh 2 đội: điểm CLB, sân nhà, khán đài nóng, cầu thủ + HLV người chơi có mặt, chiến thuật.</li>
  <li><b>Cầu thủ</b>: ký hợp đồng ở Giám đốc CLB (từ cấp ${E.contract.lv}), tới mặt cỏ sân đang đá của đội mình đứng ít nhất 1 phút. Thỉnh thoảng có <b>Cơ hội dứt điểm</b>: bấm đúng lúc là ghi bàn. Lương ${fmt(E.pay.player.wage)} + thắng ${fmt(E.pay.player.win)} + mỗi bàn ${fmt(E.pay.player.goal)}. Tập sút ở chấm phạt đền (sân không có trận) lên chỉ số Sút bóng.</li>
  <li><b>HLV</b>: học ${esc(SD.COURSES.hlvbd.name)} bằng laptop ở phòng, Sút bóng ${E.coachReq.sk} + ${E.coachReq.apps} trận đã đá. Mỗi CLB 1 ghế; chọn chiến thuật, có mặt ở sân lúc đá thì nhận lương ${fmt(E.pay.coach.wage)} + thắng ${fmt(E.pay.coach.win)}.</li>
  <li><b>Cổ động viên</b>: mua vé ${fmt(E.pay.fan.ticket)} ở quầy trước cổng, vào sân bấm E cổ vũ (mặc áo đúng đội mạnh gấp rưỡi) làm đội mạnh thêm. Đội mình thắng: ${fmt(E.pay.fan.win)} + EXP ×${E.pay.fan.buff.mul} trong ${E.pay.fan.buff.min} phút.</li>
  <li><b>Người bán hàng</b>: thuê sạp trước cổng ${fmt(E.vendor.rent)}/ngày, nhập hàng ở Tổng kho quảng trường, đứng ở sạp bấm E rao bán. Có trận ở sân đó và khán đài càng nóng thì càng được giá (lãi tối đa ${fmt(E.vendor.dailyCap)}/ngày).</li>
  <li>Mỗi ngày tối đa ${E.pay.paidPerDay} trận có tiền (gộp mọi vai). Mùa giải 1 tuần (thứ Hai → Chủ nhật): CLB vô địch thưởng cầu thủ ${fmt(E.season.player)}, HLV ${fmt(E.season.coach)}, fan đi xem ≥ ${E.season.fanMin} trận ${fmt(E.season.fan)}; Vua phá lưới ${fmt(E.season.boot)}.</li></ul>`;
UI.epl=()=>{ refresh(); UI.open('🏆 Ngoại Hạng Anh',()=>{ const F=FULL; if(!F) return '<p>Đang tải...</p>';
  const tbl=`<table class="tbl"><tr><th>#</th><th>CLB</th><th>Tr</th><th>T</th><th>H</th><th>B</th><th>HS</th><th>Đ</th></tr>${F.table.map(([k,r],i)=>`<tr><td>${i+1}</td><td>${clubName(k)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf-r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>`;
  const live=F.live?`<h5>Đang đá · ${Math.min(90,Math.floor((NET.now()-F.live.at)/(E.dur*1000)*90))}'</h5><div class="list">${F.live.fx.map(f=>`<div class="row"><span>${clubName(f.h)} <b>${f.sh} – ${f.sa}</b> ${clubName(f.a)}</span><small class="muted">sân ${esc(CL[f.h].stadium)}</small></div>`).join('')}</div>`:'';
  const nx=`<h5>Vòng tới · còn ${until(F.next.at)}</h5><div class="list">${F.next.fx.map(([h,a])=>`<div class="row"><span>${clubName(h)} – ${clubName(a)}</span><small class="muted">${esc(CL[h].stadium)}</small></div>`).join('')}</div>`;
  const sc=F.scorers.length?`<h5>Vua phá lưới tuần này</h5><p>${F.scorers.map(([n,c,g])=>`${esc(n)} (${CL[c]?CL[c].short:''}) <b>${g}</b>`).join(' · ')}</p>`:'';
  if(F.me&&F.me.fanq) FAN=F.me.fanq;
  return `<p class="muted">Mùa giải tuần ${esc(F.season)} · 3 điểm thắng, 1 điểm hoà</p>${tbl}${live}${nx}<h5>💙 Đội hâm mộ</h5>${fanBox(FAN)}${sc}${RULES}`; },{wide:true}); };
UI.defPlace('epl_mgr',n=>{ const k=n.club, c=CL[k]; refresh(); UI.open(`Giám đốc ${c.name}`,()=>{ const F=FULL, me=F&&F.me, co=F&&F.coaches[k], g=GAME.G;
  const mine=me&&me.club===k, isCoach=mine&&me.role==='coach', isPlayer=mine&&me.role==='player';
  return `<p>${clubName(k)} · sân ${esc(c.stadium)} · sức mạnh ${c.rating} · ngôi sao: ${c.stars.map(esc).join(', ')}</p>
    <p>HLV: <b>${co?esc(co.n)+' (người chơi)':esc(c.coach)+' 🤖'}</b> · chiến thuật: ${tacName(co?co.tac:'canbang')}</p>
    ${me?`<p class="muted">Bạn: ${me.role?roleName[me.role]+' '+(CL[me.club]?CL[me.club].short:''):'chưa có CLB'} · Sút bóng ${Math.floor(me.sk)} · ${me.apps} trận · ${me.goals} bàn · hôm nay ${me.paid}/${E.pay.paidPerDay} trận có tiền</p>`:''}
    <div class="col">${isPlayer?btn('eplact','Thanh lý hợp đồng',{op:'release'}):btn('eplact',`Ký hợp đồng cầu thủ ${c.short}${me&&me.club&&me.club!==k&&me.role==='player'?` (phí chuyển nhượng ${fmt(E.contract.transfer)})`:''}`,{op:'sign',club:k},'pri')}
      ${isCoach?btn('eplact','Từ chức HLV',{op:'resign'}):btn('eplact','Nhận ghế HLV trưởng',{op:'coach',club:k})}</div>
    ${isCoach?`<h5>Chiến thuật</h5><div class="col">${Object.entries(E.match.tac).map(([t,v])=>btn('eplact',v.name+(co&&co.tac===t?' ✓':''),{op:'tactic',k:t})).join('')}</div>`:''}${RULES}`; },{wide:true}); });
UI.defPlace('epl_shop',n=>{ const k=n.club, c=CL[k]; refresh(); UI.open(`Quầy vé & áo đấu ${c.short}`,()=>{ const F=FULL, me=F&&F.me, g=GAME.G, own=g&&g.owned['kit_'+k];
  const live=F&&F.live&&F.live.fx.find(f=>f.h===k), nf=F&&F.next.fx.find(([h])=>h===k), fx0=live?[live.h,live.a]:nf, when=live?'đang đá':nf?`vòng tới, còn ${until(F.next.at)}`:'';
  return `<p>Sân ${esc(c.stadium)} của ${clubName(k)}.</p>
    <h5>Vé trận</h5>${fx0?`<p>${clubName(fx0[0])} – ${clubName(fx0[1])} · ${when}</p><div class="col">${btn('eplact',`Vé khán đài ${CL[fx0[0]].short} · ${fmt(E.pay.fan.ticket)}`,{op:'ticket',club:k,side:'h'},'pri')}${btn('eplact',`Vé khán đài ${CL[fx0[1]].short} · ${fmt(E.pay.fan.ticket)}`,{op:'ticket',club:k,side:'a'})}</div>`:'<p class="muted">Vòng tới sân này không có trận, xem lịch ở Bảng xếp hạng giữa quảng trường.</p>'}
    <h5>Áo đấu</h5><div class="col">${btn('eplact',own?`Mặc áo ${c.short}`:`Mua + mặc áo ${c.short} · ${fmt(E.kitPrice)}`,{op:'kit',club:k},'pri')}${btn('eplact',me&&me.fan===k?`Bạn là fan ${c.short} ✓`:`Làm cổ động viên ${c.short}`,{op:'fan',club:k})}</div>
    <p class="muted">Mặc áo đúng đội lúc cổ vũ: mỗi lần cổ vũ mạnh gấp rưỡi.</p>`; }); });
UI.defPlace('epl_kho',()=>{ refresh(); UI.open('Ông Tony · Tổng kho đồ cổ động',()=>{ const me=FULL&&FULL.me, V=E.vendor, st=(me&&me.stock)||{};
  return `<p>"Hàng cổ động giá gốc đây! Thuê sạp trước cổng sân nào đó rồi ra đó rao, có trận là bán chạy."</p><div class="list">${Object.entries(V.goods).map(([k,g])=>`<div class="row"><span><b>${esc(g.name)}</b> · gốc ${fmt(g.cost)} · đang có ${st[k]||0}</span><span>${btn('eplact','+5',{op:'stock',k,n:5})}${btn('eplact','+10',{op:'stock',k,n:10})}</span></div>`).join('')}</div>
    <p class="muted">Bán được ×${V.mul[0]}–${V.mul[1]} giá gốc lúc có trận (sân càng nóng càng đắt, tối đa ${V.perMatch} món / trận), ×${V.quiet} lúc vắng (${V.perIdle} món / vòng). Lãi hôm nay ${fmt((me&&me.vend)||0)} / ${fmt(V.dailyCap)}. Sạp chứa ${V.maxStock} món.</p>`; }); });
UI.defPlace('epl_hp',()=>{ UI.open('Huy Phan · fan cứng Arsenal',()=>{ const g=GAME.G, ids=Object.keys(SD.QUESTS).filter(k=>SD.QUESTS[k].giver==='huyphan_epl');
  const row=id=>{ const q=SD.QUESTS[id], st=g.quests[id], pr=(g.qprog||{})[id]||0, lock=q.after&&g.quests[q.after]!=='done';
    return `<div class="row"><span><b>${esc(q.title)}</b><br><small class="muted">${esc(q.desc)}</small>${st==='active'?`<br><small>Tiến độ ${pr}/${q.prog}</small>`:''}</span>${st==='done'?'<small class="good">Xong ✓</small>':lock?'<small class="muted">làm việc trước</small>':st==='active'?(pr>=q.prog?btn('eplq','Báo xong',{id,op:'finish'},'pri'):''):btn('eplq','Nhận',{id,op:'start'},'pri')}</div>`; };
  return `<p>"Arsenal là chân ái! Cùng tôi đưa Pháo Thủ lên đỉnh Ngoại Hạng Anh nào, COYG!"</p><div class="list">${ids.map(row).join('')}</div>`; },{wide:true}); });
UI.onAct('eplact',d=>doAct(d));
UI.onAct('eplq',async d=>{ const r=await GAME.act({t:'quest',id:d.id,op:d.op}); if(r&&!r.err){ GAME.sfx(d.op==='finish'?'quest_complete':'quest_accept',.6); toast(d.op==='finish'?`Hoàn thành: <b>${esc(SD.QUESTS[d.id].title)}</b>`:`Nhận nhiệm vụ: <b>${esc(SD.QUESTS[d.id].title)}</b>`,'quest'); } UI.refresh(); });
// nút "đi tới" của nhiệm vụ Pháo Thủ: bay sang Anh, tới chỗ Huy Phan / sân Emirates
const g0=X.go; X.go=id=>{ if(!/^ars_/.test(id)) return g0(id); if(!here()){ GAME.autoGo('epl',()=>GAME.questGo(id)); return true; }
  const at=k=>SD.NPCS.find(x=>x.id===k), w=(k,l)=>{ const n=at(k); GAME.walkTo(n.x,n.y+1.2,l); return true; }, g=GAME.G;
  if(g.quests[id]!=='active'||GAME.canFinish(id)) return w('huyphan_epl','Huy Phan');   /* nhận / báo xong */
  if(id==='ars_kit') return w('epl_shop_ars','Quầy áo đấu Arsenal');
  if(id==='ars_goal'||id==='ars_coach') return w('epl_mgr_ars','Giám đốc Arsenal');
  const F=FULL, lf=F&&F.live&&F.live.fx.find(f=>f.h==='ars'||f.a==='ars'), nf=F&&F.next.fx.find(([h,a])=>h==='ars'||a==='ars'), host=lf?lf.h:nf?nf[0]:'ars';   /* xem / có mặt trận Arsenal: quầy vé sân đang (sắp) có trận */
  return w('epl_shop_'+host,'Quầy vé sân '+CL[host].stadium); };
/* ---------- dòng tỉ số trên thanh trên cùng (mọi map): vòng đang đá (LIVE phút, tỉ số), vòng tới (đếm ngược), kết quả vòng trước; trận của đội hâm mộ đứng đầu + ★ ---------- */
let BAR=null, barI=0, FAN=null; const short=k=>CL[k]?CL[k].short:k;
function barText(){ if(!BAR) return ''; const t=NET.now(), fav=(FAN&&FAN.fan)||(FULL&&FULL.me&&FULL.me.fan)||'', fx=BAR.fx.slice().sort((a,b)=>((b[0]===fav||b[1]===fav)?1:0)-((a[0]===fav||a[1]===fav)?1:0));
  const one=f=>`${f[0]===fav||f[1]===fav?'<span class="fav">★</span>':''}${esc(short(f[0]))} ${BAR.live?`<b>${f[2]}–${f[3]}</b>`:'–'} ${esc(short(f[1]))}`;
  if(BAR.live){ const min=Math.min(90,Math.max(1,Math.floor((t-BAR.at)/(E.dur*1000)*90))); return `<span class="lv">● LIVE</span>${min}' · ${one(fx[barI%fx.length])}`; }
  const L0=BAR.last; if(L0&&L0.at&&t-L0.at<120000){ const r=L0.res[barI%L0.res.length]; return `⚽ KT vòng ${L0.md%1000}: ${esc(short(r[0]))} <b>${r[1]}–${r[2]}</b> ${esc(short(r[3]))}`; }
  return `⚽ Vòng ${BAR.md%1000} sau ${until(BAR.at)} · ${one(fx[barI%fx.length])}`; }
function barDraw(){ const b=$('#hudEpl'), tx=$('#hudEplT'); if(!b||!tx) return; b.hidden=!BAR; if(!BAR) return; b.classList.toggle('live',!!BAR.live); tx.innerHTML=barText(); }
setInterval(()=>{ barI++; barDraw(); },3000); setInterval(barDraw,1000);
NET.listen('eplbar',m=>{ BAR=m.v; barDraw(); if(m.goal){ const b=$('#hudEpl'); if(b){ b.classList.remove('goal'); void b.offsetWidth; b.classList.add('goal'); } const fav=(FAN&&FAN.fan)||'', mine=m.goal.h===fav||m.goal.a===fav;
  if(!here()) toast(`⚽ ${m.goal.min}' VÀO! ${esc(m.goal.who)} (${esc(short(m.goal.team?m.goal.a:m.goal.h))}) · ${esc(short(m.goal.h))} ${BAR.fx.find(f=>f[0]===m.goal.h)?BAR.fx.find(f=>f[0]===m.goal.h)[2]:''}–${BAR.fx.find(f=>f[0]===m.goal.h)?BAR.fx.find(f=>f[0]===m.goal.h)[3]:''} ${esc(short(m.goal.a))}${mine?' ★':''}`,mine?'quest':'item'); } });
setTimeout(()=>{ const b=$('#hudEpl'); if(b) b.addEventListener('click',e=>{ e.currentTarget.blur(); if(GAME.S) UI.eplFan(); }); },0);
// đội hâm mộ: chọn đội, 7 nhiệm vụ trong ngày, điểm trung thành (mở được ở mọi map)
const fanBox=F=>{ if(!F) return '<p class="muted">Đang tải...</p>'; const lv=E.loyalOf(F.lp), nx=E.loyal.find(x=>x.lp>F.lp), day=SD.realTime().day, canSwap=!F.fan||F.favDay!==day;
  const pick=`<div class="eplclubs">${IDS.map(k=>F.fan===k?`<span class="btn sm pri">💙 ${esc(CL[k].short)}</span>`:btn('eplfav',CL[k].short,{club:k},canSwap?'':'dis')).join('')}</div>`;
  if(!F.fan) return `<p>Chọn 1 đội để hâm mộ: mỗi ngày có ${E.fanq.length} nhiệm vụ riêng cho đội đó (tiền + EXP + điểm trung thành), đội thắng được thêm tiền thưởng theo bậc trung thành.</p>${pick}`;
  return `<p>Đội của bạn: ${clubName(F.fan)} · bậc <b>${esc(lv.name)}</b> (${F.lp} điểm${nx?`, lên ${esc(nx.name)} ở ${nx.lp}`:''})${lv.bonus?` · đội thắng +${Math.round(lv.bonus*100)}% tiền thưởng cổ động viên`:''}</p>
    <div class="list rows eplfq">${E.fanq.map(Q=>{ const n=Math.min(Q.n,F.prog[Q.k]||0), done=F.done[Q.k]; return `<div class="row"><span><b>${esc(Q.name)}</b> <small class="muted">${n}/${Q.n} · ${fmt(Q.vnd)} · ${Q.exp} EXP · +${Q.lp} trung thành</small></span>${done?'<small class="good">✔ Đã nhận</small>':n>=Q.n?btn('eplfq','Nhận thưởng',{k:Q.k},'pri'):''}</div>`; }).join('')}</div>
    <p class="muted">${canSwap?'Đổi đội (mất nửa điểm trung thành):':'Hôm nay đã chọn đội, mai mới đổi được.'}</p>${pick}`; };
UI.eplFan=async()=>{ const r=await NET.req({t:'epl',op:'fanview'}); if(r&&r.fan){ FAN=r.fan; BAR=r.bar||BAR; } UI.open('⚽ Ngoại Hạng Anh · đội hâm mộ',()=>{ const B=BAR;
  const fx=B?`<h5>${B.live?`● Đang đá · vòng ${B.md%1000}`:`Vòng ${B.md%1000} · còn ${until(B.at)}`}</h5><div class="list">${B.fx.map(f=>`<div class="row"><span>${clubName(f[0])} ${B.live?`<b>${f[2]} – ${f[3]}</b>`:'–'} ${clubName(f[1])}</span><small class="muted">sân ${esc(CL[f[0]].stadium)}</small></div>`).join('')}</div>`:'';
  return `${fx}<h5>💙 Đội hâm mộ</h5>${fanBox(FAN)}${here()?btn('eplopen','🏆 Bảng xếp hạng + luật giải'):btn('eplgo','✈ Gọi Grab sang Ngoại Hạng Anh',{},'pri')}`; },{wide:true}); };
UI.onAct('eplfav',async d=>{ const r=await GAME.act({t:'epl',op:'fav',club:d.club}); if(r&&r.fan){ FAN=r.fan; GAME.sfx('quest_accept',.6); if(r.msg) toast(esc(r.msg),'quest'); } UI.refresh(); barDraw(); });
UI.onAct('eplfq',async d=>{ const r=await GAME.act({t:'epl',op:'fq',k:d.k}); if(r&&r.fan){ FAN=r.fan; GAME.sfx('quest_complete',.6); } UI.refresh(); });
UI.onAct('eplopen',()=>UI.epl()); UI.onAct('eplgo',()=>{ UI.closeAll(); GAME.autoGo('epl',()=>{}); });
// minimap: chấm vàng ở cổng mỗi sân
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k!=='epl') return; for(const c of IDS){ const C0=CL[c]; dot((C0.bx+(E.gate[0]+E.gate[1]+1)/2)*T,(top(c)?C0.by+E.bh+1:C0.by-1)*T,'#ffd84a',2); } };
})();
