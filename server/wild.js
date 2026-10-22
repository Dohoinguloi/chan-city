// Thú hoang ngẫu nhiên ở Ké Retreat: khủng long thỉnh thoảng hiện ra trong rừng (cả server cùng thấy 1 con, chụp ảnh được thưởng,
// bạo chúa đến gần thì bị đớp), cá sấu lượn dưới hồ Hoà Bình, rình người chèo kayak, áp sát là đớp lật thuyền.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,hook,now,near,markDirty,reward,send,players}=C;
const W=S.WILDLIFE, fmt=S.fmt, T=S.T, rnd=(a,b)=>a+Math.random()*(b-a);
let DINO=null, nextDino=now()+90e3, CROC=null, nextCroc=now()+60e3;
const dinoView=()=>DINO&&{k:DINO.k,x:+DINO.x.toFixed(2),y:+DINO.y.toFixed(2),face:DINO.face,until:DINO.until};
const crocView=()=>CROC&&{x:+CROC.x.toFixed(2),y:+CROC.y.toFixed(2),face:CROC.face,dive:CROC.dive>now()};
const push=()=>C.broadcastScene('retreat',{t:'wild',dino:dinoView(),croc:crocView()});
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'wild',dino:dinoView(),croc:crocView()}); });
function spawnDino(k){ const kinds=Object.keys(W.dino.kinds), kind=k||kinds[Math.floor(Math.random()*kinds.length)], [hx,hy]=W.dino.spots[Math.floor(Math.random()*W.dino.spots.length)];
  DINO={k:kind,hx,hy,x:hx,y:hy,tx:hx,ty:hy,face:1,until:now()+W.dino.stay*1000,seen:new Set(),bitAt:new Map()};
  C.broadcastScene('retreat',{t:'ev',k:'dinoCall',kind,x:hx,y:hy}); push(); }
function spawnCroc(near_){ const [x0,x1]=W.croc.x, [y0,y1]=W.croc.y, kay=[...C.sceneOf('retreat')].filter(p=>p.kayak), base=near_||(kay.length&&Math.random()<.6?kay[Math.floor(Math.random()*kay.length)]:null);
  const x=base?Math.max(x0,Math.min(x1,base.x/T+rnd(-12,12))):rnd(x0,x1), y=rnd(y0,y1); CROC={x,y,tx:x,ty:y,face:1,until:now()+W.croc.stay*1000,dive:0,bitAt:new Map()};
  C.broadcastScene('retreat',{t:'ev',k:'crocCall',x,y}); push(); }
hook('slow',()=>{ const t=now();
  if(!DINO&&t>=nextDino) spawnDino(); if(DINO&&t>=DINO.until){ DINO=null; nextDino=t+rnd(...W.dino.every)*1000; push(); }
  if(!CROC&&t>=nextCroc) spawnCroc(); if(CROC&&t>=CROC.until){ CROC=null; nextCroc=t+rnd(...W.croc.every)*1000; push(); } });
hook('tick',()=>{ const t=now(); let moved=false;
  if(DINO){ const K=W.dino.kinds[DINO.k], d=Math.hypot(DINO.tx-DINO.x,DINO.ty-DINO.y);
    if(d<.3){ const r=K.fly?26:7; DINO.tx=DINO.hx+rnd(-r,r); DINO.ty=DINO.hy+rnd(-r*.6,r*.6); }
    else { const st=Math.min(d,K.speed*.1); DINO.x+=(DINO.tx-DINO.x)/d*st; DINO.y+=(DINO.ty-DINO.y)/d*st; DINO.face=DINO.tx>DINO.x?1:-1; moved=true; }
    if(K.bite) for(const pl of C.sceneOf('retreat')){ if(pl.optimus||Math.hypot(pl.x/T-DINO.x,pl.y/T-DINO.y)>W.dino.bite.r) continue; if(t-(DINO.bitAt.get(pl.pid)||0)<W.dino.bite.cd) continue; DINO.bitAt.set(pl.pid,t);
      const p=pl.prof, B=W.dino.bite, dx=pl.x/T-DINO.x, dy=pl.y/T-DINO.y, dl=Math.hypot(dx,dy)||1; p.needs.energy=Math.max(0,p.needs.energy-B.energy); pl.x+=dx/dl*B.push*T; pl.y+=dy/dl*B.push*T; pl.budget=0; markDirty(pl);
      send(pl,{t:'pos',x:pl.x,y:pl.y}); C.broadcastScene('retreat',{t:'ev',k:'dinoBite',id:pl.pid,x:DINO.x,y:DINO.y}); C.note(pl,`${K.name} đớp trúng! -${B.energy} năng lượng. Đứng xa ra mà chụp ảnh!`,'lock'); } }
  if(CROC){ const kay=[...C.sceneOf('retreat')].filter(p=>p.kayak); let tg=null, bd=W.croc.stalk;
    for(const p of kay){ const dd=Math.hypot(p.x/T-CROC.x,p.y/T-CROC.y); if(dd<bd){ bd=dd; tg=p; } }
    if(tg&&CROC.dive<t){ CROC.tx=tg.x/T; CROC.ty=Math.max(W.croc.y[0]-4,Math.min(W.croc.y[1]+3,tg.y/T)); }
    else if(Math.hypot(CROC.tx-CROC.x,CROC.ty-CROC.y)<.3){ CROC.tx=Math.max(W.croc.x[0],Math.min(W.croc.x[1],CROC.x+rnd(-10,10))); CROC.ty=rnd(...W.croc.y); }
    const d=Math.hypot(CROC.tx-CROC.x,CROC.ty-CROC.y); if(d>.05){ const st=Math.min(d,W.croc.speed*.1*(CROC.dive>t?.4:1)); CROC.x+=(CROC.tx-CROC.x)/d*st; CROC.y+=(CROC.ty-CROC.y)/d*st; CROC.face=CROC.tx>CROC.x?1:-1; moved=true; }
    if(tg&&bd<W.croc.r&&CROC.dive<t){ const p=tg.prof, lost=Math.min(W.croc.dropMax,Math.floor(p.money*W.croc.drop)); tg.kayak=false; p.needs.energy=Math.max(0,p.needs.energy-W.croc.energy); p.money-=lost; markDirty(tg);
      CROC.dive=t+6000; C.broadcastScene('retreat',{t:'ev',k:'crocBite',id:tg.pid,x:CROC.x,y:CROC.y});
      C.note(tg,`Cá sấu đớp lật kayak! Bơi vội vào bờ, -${W.croc.energy} năng lượng${lost?`, rơi mất ${fmt(lost)} xuống hồ`:''}`,'lock'); } }
  if(moved&&t%500<100) push(); });
on('wild',(pl,m)=>{ const p=pl.prof;
  if(m.op==='photo'){ if(!DINO||pl.scene!=='retreat') return {err:'Không thấy khủng long nào'}; const K=W.dino.kinds[DINO.k];
    if(Math.hypot(pl.x/T-DINO.x,pl.y/T-DINO.y)>(K.fly?7:5)) return {err:'Lại gần hơn chút mới chụp rõ'}; if(DINO.seen.has(pl.uid)) return {err:'Chụp con này rồi'};
    DINO.seen.add(pl.uid); P.stat(pl,'dino',1); P.stat(pl,'know',W.dino.photoKnow); reward(pl,{exp:K.exp},`Chụp được ${K.name}! +${W.dino.photoKnow} hiểu biết`); markDirty(pl); P.achCheck&&P.achCheck(pl); return {msg:`Ảnh ${K.name} siêu nét, đăng lên mạng ai cũng trầm trồ!`}; }
  return {err:'?'}; });
if(process.env.CHAN_TEST==='1') on('wilddbg',(pl,m)=>{ if(m.dino){ spawnDino(m.dino); DINO.hx=DINO.x=DINO.tx=pl.x/T+4; DINO.hy=DINO.y=DINO.ty=pl.y/T; push(); } if(m.croc){ spawnCroc(pl); CROC.x=pl.x/T+5; CROC.y=pl.y/T; push(); } return {dino:dinoView(),croc:crocView()}; });
module.exports={};
