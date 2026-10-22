// Cổng D-Day (nhà sự kiện ở quảng trường MU): ghép trận 1-1, 2-2, 3-3 rồi đưa cả 2 đội vào đấu trường riêng (cảnh 'dday:<trận>').
// Mỗi đội 1 nhà chính ở 2 đầu, cứ vài chục giây mỗi nhà tung 1 đợt quái chạy dọc đường giữa đánh sang nhà kia; nhà chính tự bắn kẻ địch lại gần.
// Người chơi đánh quái, nhà chính và người đội kia bằng đánh thường / chiêu MU (nguồn mục tiêu 'dd' trong MU.EXTRA), gục thì hồi sinh cạnh nhà mình.
// Phá nhà chính đối thủ trước là thắng (hết giờ: đội còn nhiều % máu nhà chính hơn). Mỗi ngày mỗi người vào tối đa 2 trận (tính lúc trận bắt đầu).
'use strict';
const C=require('./core'), MU=require('./mu');
const {S,T,on,hook,now,send,note,markDirty,reward,players}=C, D=S.MU.dday;
const QUEUE={1:[],2:[],3:[]}, MATCH=new Map(); let MSEQ=1, CSEQ=1;
const BASE_ID=900000, PL_ID=1000000;   // mã mục tiêu: quái = số thứ tự, nhà chính đội k = BASE_ID+k, người chơi = PL_ID+pid
const dayRec=p=>{ const day=S.realTime().day; if(!p.ddayT||p.ddayT.day!==day) p.ddayT={day,n:0}; return p.ddayT; };
const modeOf=pl=>{ for(const [k,q] of Object.entries(QUEUE)) if(q.includes(pl)) return +k; return 0; };
const queueView=()=>Object.fromEntries(Object.entries(QUEUE).map(([k,q])=>[k,q.length]));
const leaveQueue=pl=>{ for(const q of Object.values(QUEUE)){ const i=q.indexOf(pl); if(i>=0) q.splice(i,1); } };
function pushQueue(){ const v=queueView(); for(const q of Object.values(QUEUE)) for(const pl of q) send(pl,{t:'ddq',v,mode:modeOf(pl)}); }
const nearGate=pl=>pl.scene==='mu'&&Math.hypot(pl.x/T-D.gate.x,pl.y/T-D.gate.y)<=3.2;
const matchOf=pl=>pl.dday&&MATCH.get(pl.dday.id);
const dd=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pPos=q=>({x:q.x/T,y:q.y/T});
const aliveP=(M,team)=>M.teams[team].map(pid=>players.get(pid)).filter(q=>q&&q.prof&&q.scene===M.sc&&q.dday&&q.dday.id===M.id&&q.mus&&q.mus.dead<=now()&&!(q.mus.safe>now()));

on('dday',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const op=m.op;
  if(op==='info') return {q:queueView(),mode:modeOf(pl),left:Math.max(0,D.perDay-dayRec(p).n),live:[...MATCH.values()].filter(M=>M.st==='play').map(M=>({mode:M.mode,left:Math.max(0,M.until-now())}))};
  if(op==='join'){ const mode=m.mode|0; if(!QUEUE[mode]) return {err:'?'}; if(!nearGate(pl)) return {err:'Tới Cổng D-Day ở quảng trường MU'};
    if(!MU.rec(p).cls) return {err:'Chọn class MU ở Vệ binh trước đã'}; if(pl.dday) return {err:'Đang trong trận'}; if(pl.muDuel) return {err:'Đang thách đấu'};
    if(dayRec(p).n>=D.perDay) return {err:`Hôm nay bạn đã vào D-Day đủ ${D.perDay} trận, mai quay lại nhé`};
    leaveQueue(pl); QUEUE[mode].push(pl); pushQueue(); tryStart(mode); return {ok:1,mode,msg:pl.dday?'Đủ người, vào trận!':`Đang chờ ghép trận ${D.modes[mode]} (${QUEUE[mode].length}/${mode*2} người)`}; }
  if(op==='dbg'&&process.env.CHAN_TEST==='1'){ const M=matchOf(pl); if(!M) return {err:'?'}; if(m.base!=null) M.base[m.k|0]=+m.base; return {ok:1,v:view(M)}; }   // chỉ server test
  if(op==='leave'){ leaveQueue(pl); pushQueue(); send(pl,{t:'ddq',v:queueView(),mode:0}); return {ok:1}; }
  return {err:'?'}; });

// đủ người: chia ngẫu nhiên 2 đội, hồi đầy máu, đưa vào đấu trường riêng
function tryStart(mode){ const Q=QUEUE[mode]; for(let i=Q.length-1;i>=0;i--){ const q=Q[i]; if(!players.has(q.pid)||!nearGate(q)||q.dday||!MU.rec(q.prof).cls) Q.splice(i,1); }
  if(Q.length<mode*2) return; const L=Q.splice(0,mode*2).sort(()=>Math.random()-.5), id=MSEQ++, max=D.base.hp+D.base.per*mode, t=now();
  const M={id,mode,sc:'dday:'+id,teams:[L.slice(0,mode).map(q=>q.pid),L.slice(mode).map(q=>q.pid)],names:{},base:[max,max],max,creeps:[],shots:[],kills:[0,0],t,until:t+D.time*1000,nextWave:t+D.wave.first*1000,turretAt:[0,0],st:'play'};
  MATCH.set(id,M); MU.EXTRA_SCENES.add(M.sc);
  M.teams.forEach((team,k)=>team.forEach((pid,j)=>{ const q=players.get(pid), sp=D.spawn[k]; M.names[pid]=q.prof.name; q.dday={id,team:k}; dayRec(q.prof).n++; markDirty(q);
    const s=MU.st(q); if(s){ s.hp=s.max; s.mp=s.mmax; s.dead=0; s.fx={}; } C.moveTo(q,M.sc,sp.x+(j%2?1.2:-.2),sp.y+j*1.4);
    send(q,{t:'ddstart',mode,team:k,left:dayRec(q.prof).n,per:D.perDay}); }));
  pushQueue(); }

// quái theo đợt: chạy dọc đường giữa sang nhà đối thủ, gặp kẻ địch (quái / người) trong tầm aggro thì đánh, tới nhà chính thì đập nhà
function spawnWave(M){ const W=D.wave; for(let k=0;k<2;k++){ const b=D.bases[k], dir=k?-1:1; for(let i=0;i<W.n;i++) M.creeps.push({id:CSEQ++,team:k,x:b.x+dir*(D.base.r+1+i*.6),y:D.lane.y+(i-(W.n-1)/2)*1.1,hp:W.hp,max:W.hp,next:0,slow:0}); } }
function enemiesOf(M,team){ const L=[]; for(const c of M.creeps) if(c.team!==team&&c.hp>0) L.push({k:'c',o:c,x:c.x,y:c.y}); for(const q of aliveP(M,1-team)) L.push({k:'p',o:q,...pPos(q)}); return L; }
function hurtBase(M,k,d){ M.base[k]=Math.max(0,M.base[k]-d); if(M.base[k]<=0) endMatch(M,1-k,`phá được nhà chính ${D.bases[k].name}`); }
function tick(M,t,dt){ const W=D.wave;
  if(t>=M.nextWave){ M.nextWave=t+W.every*1000; spawnWave(M); }
  for(const c of M.creeps){ if(c.hp<=0||c.stun>t) continue; const eb=D.bases[1-c.team], foes=enemiesOf(M,c.team); let tg=null, td=1e9; for(const f of foes){ const d=dd(c,f); if(d<td&&d<=W.aggro){ td=d; tg=f; } }
    const bd=Math.hypot(eb.x-c.x,eb.y-c.y)-D.base.r, sp=W.spd*(c.slow>t?.45:1)*dt;
    if(tg&&td>W.range){ c.x+=(tg.x-c.x)/td*Math.min(sp,td-W.range*.8); c.y+=(tg.y-c.y)/td*Math.min(sp,td-W.range*.8); }
    else if(!tg&&bd>W.range){ const dx=eb.x-c.x, dy=D.lane.y-c.y, l=Math.hypot(dx,dy)||1; c.x+=dx/l*sp; c.y+=dy/l*sp*.5; }
    if(t<c.next) continue;
    if(tg&&td<=W.range){ c.next=t+W.cd*1000; const wa=W.atk*(c.weak&&c.weak.until>t?1-c.weak.mul:1); if(tg.k==='c') tg.o.hp-=Math.max(1,wa-W.def*.5); else MU.hurtP(tg.o,wa,`Bị quái ${D.bases[c.team].name} đánh gục`,{ak:'ddc'}); }
    else if(!tg&&bd<=W.range){ c.next=t+W.cd*1000; hurtBase(M,1-c.team,W.atk*(c.weak&&c.weak.until>t?1-c.weak.mul:1)); if(M.st!=='play') return; } }
  M.creeps=M.creeps.filter(c=>c.hp>0);
  // nhà chính bắn kẻ địch gần nhất trong tầm
  M.shots=M.shots.filter(s=>t-s.t<350);
  for(let k=0;k<2;k++){ if(t<M.turretAt[k]) continue; const b=D.bases[k]; let tg=null, td=1e9; for(const f of enemiesOf(M,k)){ const d=Math.hypot(f.x-b.x,f.y-b.y); if(d<td&&d<=D.turret.range){ td=d; tg=f; } }
    if(!tg) continue; M.turretAt[k]=t+D.turret.every*1000; M.shots.push({k,x:tg.x,y:tg.y,t});
    if(tg.k==='c') tg.o.hp-=D.turret.dmg; else MU.hurtP(tg.o,D.turret.dmg,`Bị nhà chính ${b.name} bắn gục`,{ak:'ddt'}); }
  // hết giờ / một đội bỏ trận hết
  if(t>=M.until){ const a=M.base[0]/M.max, b=M.base[1]/M.max; endMatch(M,a===b?-1:a>b?0:1,'hết giờ, so máu nhà chính'); return; }
  for(let k=0;k<2;k++) if(!M.teams[k].some(pid=>{ const q=players.get(pid); return q&&q.dday&&q.dday.id===M.id; })){ endMatch(M,1-k,`${D.bases[k].name} bỏ trận`); return; } }
function view(M){ return {id:M.id,mode:M.mode,base:M.base.map(Math.round),max:M.max,until:M.until,kills:M.kills,teams:M.teams,names:M.names,st:M.st,ts:now(),
  creeps:M.creeps.map(c=>[c.id,c.team,+c.x.toFixed(2),+c.y.toFixed(2),Math.round(c.hp/c.max*100)]),shots:M.shots.map(s=>[s.k,+s.x.toFixed(1),+s.y.toFixed(1)])}; }
setInterval(()=>{ try{ const t=now(); for(const M of MATCH.values()){ if(M.st==='play') tick(M,t,.2); const v=view(M); for(const q of C.sceneOf(M.sc)) send(q,{t:'dday',v}); } }catch(e){ console.error('[dday]',e); } },200);

// mục tiêu cho đánh thường / chiêu MU trong trận: quái đội kia, nhà chính đội kia, người đội kia
function asT(M,pl,f,d){ const team=pl.dday.team;
  if(f.k==='c'){ const c=f.o; return {id:c.id,x:c.x,y:c.y,d,max:c.max,def:D.wave.def,rad:.5,hit:dmg=>{ if(c.hp>0){ c.hp-=dmg; if(c.hp<=0) MU.gainMu(pl,6); } return 'dd:'+c.id; },slow:sec=>{ c.slow=now()+sec*1000; },stun:sec=>{ c.stun=now()+sec*1000; },weak:(mul,sec)=>{ c.weak={until:now()+sec*1000,mul}; }}; }
  if(f.k==='b'){ const k=1-team; return {id:BASE_ID+k,x:D.bases[k].x,y:D.bases[k].y,d,max:M.max,def:D.base.def,rad:D.base.r,hit:dmg=>{ if(M.st==='play') hurtBase(M,k,dmg); return 'dd:'+(BASE_ID+k); },slow:()=>{}}; }
  const q=f.o; return {id:PL_ID+q.pid,x:q.x/T,y:q.y/T,d,def:(q.mus&&q.mus.def)||5,rad:.4,hit:dmg=>{ const was=q.mus&&q.mus.dead>now(); MU.hurtP(q,dmg,`Bị ${pl.prof.name} (${D.bases[team].name}) hạ gục`,{ak:'pvp'});
    if(!was&&q.mus&&q.mus.dead>now()){ M.kills[team]++; MU.gainMu(pl,25); note(pl,`⚔ Hạ gục ${q.prof.name}!`,'quest'); } return 'dd:'+(PL_ID+q.pid); },
    pvp:1,slow:sec=>{ MU.applyFx&&MU.applyFx(q,{slow:.6,dur:sec},now()); },stun:sec=>{ MU.applyFx&&MU.applyFx(q,{stun:sec},now()); },wound:mul=>{ if(q.mus){ const F=q.mus.fx||(q.mus.fx={}); F.gw={until:now()+3000,mul}; } }}; }
function targetsFor(M,pl){ const team=pl.dday.team, L=enemiesOf(M,team).map(f=>f); const eb=D.bases[1-team]; L.push({k:'b',x:eb.x,y:eb.y}); return L; }
MU.EXTRA.push({kind:'dd',
  nearest:pl=>{ const M=matchOf(pl); if(!M||M.st!=='play'||pl.scene!==M.sc) return null; const P=pPos(pl); let best=null, bd=1e9; for(const f of targetsFor(M,pl)){ const d=Math.hypot(f.x-P.x,f.y-P.y)-(f.k==='b'?D.base.r:0); if(d<bd){ bd=d; best=f; } }
    return best&&bd<=14?asT(M,pl,best,Math.hypot(best.x-P.x,best.y-P.y)):null; },
  byId:(id,pl)=>{ const M=matchOf(pl); if(!M||M.st!=='play') return null; const P=pPos(pl), f=targetsFor(M,pl).find(f=>f.k==='c'?f.o.id===id:f.k==='b'?id===BASE_ID+(1-pl.dday.team):id===PL_ID+f.o.pid); return f?asT(M,pl,f,Math.hypot(f.x-P.x,f.y-P.y)):null; },
  around:()=>[]});
MU.RESPAWN.f=pl=>{ const M=matchOf(pl); if(!M||M.st!=='play') return null; const sp=D.spawn[pl.dday.team]; return [M.sc,sp.x,sp.y]; };

// hết trận: thưởng, báo kết quả, 6 giây sau đưa mọi người về Cổng D-Day
function pickSecret(){ const tot=D.secret.reduce((a,s)=>a+s[1],0); let r=Math.random()*tot; for(const s of D.secret){ if((r-=s[1])<0) return s; } return D.secret[0]; }
function endMatch(M,win,why){ if(M.st!=='play') return; M.st='end'; const RW=D.reward, F=Object.keys(S.MU.fruits);
  M.teams.forEach((team,k)=>team.forEach(pid=>{ const q=players.get(pid); if(!q||!q.prof||!q.dday||q.dday.id!==M.id) return; const w=k===win, R=w?RW.win:RW.lose, items={}; let secret=''; if(w) require('./places').stat(q,'ddayW',1);
    if(w){ const [sk,,sn]=pickSecret(); items[sk]=(items[sk]||0)+sn; secret=`${S.ITEMS[sk].name}${sn>1?' ×'+sn:''}`; items.ngoc_ch=RW.win.gems; for(let j=0;j<RW.win.jewels;j++){ const jk=S.MU.jewels[Math.floor(Math.random()*S.MU.jewels.length)]; items[jk]=(items[jk]||0)+1; }
      const fk='taq_'+F[Math.floor(Math.random()*F.length)]; items[fk]=(items[fk]||0)+RW.win.fruit; }
    const got=reward(q,{exp:R.exp,vnd:R.vnd,items},w?`Thắng D-Day ${D.modes[M.mode]}`:win<0?`Hoà D-Day ${D.modes[M.mode]}`:`D-Day ${D.modes[M.mode]}`); MU.gainMu(q,R.mu);
    send(q,{t:'ddend',win:win<0?0:w?1:-1,why,secret,exp:got.exp||0,vnd:got.vnd||0,mu:R.mu,items:got.items||{},kills:M.kills,team:k}); markDirty(q); }));
  const txt=win<0?`hoà (${why})`:`${D.bases[win].name} thắng · ${why}`; for(const q of MU.inScene()) if(q.scene==='mu') note(q,`🏳 D-Day ${D.modes[M.mode]}: ${txt}`,'quest');
  setTimeout(()=>{ for(const pid of [...M.teams[0],...M.teams[1]]){ const q=players.get(pid); if(!q||!q.dday||q.dday.id!==M.id) continue; q.dday=null;
      if(q.scene===M.sc){ const s=MU.st(q); if(s){ s.hp=s.max; s.mp=s.mmax; s.dead=0; s.fx={}; } C.moveTo(q,'mu',D.gate.x,D.gate.y+1.6); } }
    MATCH.delete(M.id); MU.EXTRA_SCENES.delete(M.sc); },6000); }
// rời đấu trường (Grab đi / thoát game) giữa trận: bỏ trận; rời quảng trường thì ra khỏi hàng chờ
hook('leave',(pl,old,to)=>{ if(old==='mu'&&to!=='mu'&&modeOf(pl)){ leaveQueue(pl); pushQueue(); }
  const M=matchOf(pl); if(M&&old===M.sc&&to!==M.sc){ pl.dday=null; } });
module.exports={MATCH,QUEUE};
