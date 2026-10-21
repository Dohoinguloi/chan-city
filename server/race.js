// Trường đua ngựa ở nông trại Đà Lạt: thuê ngựa đua, cá cược ai về nhất, đua kiểu Audition.
// Mỗi nhịp server phát 1 chuỗi mũi tên; gõ đúng chuỗi rồi bấm Space khi vạch chạy tới mốc → PERFECT/GREAT/COOL/BAD/MISS → ngựa lao lên.
'use strict';
const C=require('./core');
const crypto=require('crypto');
const {S,on,hook,send,now,near,moveTo,take,give,reward,note,players,broadcastScene,sceneOf}=C;
const R=S.RACE, fmt=S.fmt, KEYS=['L','U','R','D'];
const SPAWN={x:30,y:25.5};
const race={st:'idle',riders:[],bets:[],lobbyEnd:0,round:-1,roundStart:0,seq:[],doneAt:0,results:null};

on('enterTrack',pl=>{ const d=S.DALAT.track; if(pl.scene!=='dalat'||!near(pl,d.x,d.y,44)) return {err:'Đứng trước cổng trường đua'};
  moveTo(pl,'track',SPAWN.x,SPAWN.y); send(pl,{t:'race',v:view(pl)}); return {}; });
const riderOf=pl=>race.riders.findIndex(r=>r.pl===pl);
function view(pl){ const t=now(), mine=race.bets.filter(b=>b.uid===pl.uid);
  return {st:race.st,round:race.round,rounds:R.rounds,track:R.track,lobbyLeft:race.st==='lobby'&&race.lobbyEnd?Math.max(0,race.lobbyEnd-t):0,
    riders:race.riders.map(r=>({name:r.name,dist:r.dist,j:r.j||'',combo:r.combo,pf:r.perfect,pot:race.bets.filter(b=>b.on===r.idx).reduce((a,b)=>a+b.amt,0)})),
    me:riderOf(pl),myBets:mine.map(b=>({on:b.on,amt:b.amt})),pool:race.bets.reduce((a,b)=>a+b.amt,0),results:race.results,rent:R.rent,
    seq:race.st==='run'?race.seq:null,roundStart:race.roundStart,beat:race.roundStart+R.beatAt,roundMs:R.roundMs}; }
const pushAll=()=>{ for(const pl of sceneOf('track')) send(pl,{t:'race',v:view(pl)}); };

on('race',(pl,m)=>{ if(pl.scene!=='track') return {err:'Vào trường đua đã'}; const t=now();
  if(m.op==='view') return {v:view(pl)};
  if(m.op==='join'){ if(!pl.prof.skills.cuoingua) return {err:'Chưa học Cưỡi ngựa (học online ở phòng)'};
    if(race.st==='run'||race.st==='done') return {err:'Đang có trận, đợi trận sau'}; if(riderOf(pl)>=0) return {err:'Bạn đã đăng ký'};
    if(race.riders.length>=R.maxRiders) return {err:`Tối đa ${R.maxRiders} kỵ sĩ`}; if(!take(pl,R.rent)) return {err:`Thuê ngựa đua ${fmt(R.rent)}`};
    race.riders.push({pl,uid:pl.uid,name:pl.prof.name,idx:race.riders.length,dist:0,combo:0,perfect:0,hit:-1}); race.st='lobby';
    if(race.riders.length>=R.minRiders&&!race.lobbyEnd) race.lobbyEnd=t+R.lobbyMs; pl.race=true; pushAll(); return {}; }
  if(m.op==='leave'){ const i=riderOf(pl); if(i<0||race.st!=='lobby') return {err:'Không rút được lúc này'}; withdraw(i); return {}; }
  if(m.op==='bet'){ if(race.st!=='lobby') return {err:'Chỉ cược trước khi xuất phát'}; const on_=m.on|0, amt=Math.round(m.amt||0);
    if(!race.riders[on_]) return {err:'Chọn kỵ sĩ'}; if(amt<R.betMin||amt>R.betMax) return {err:`Cược từ ${fmt(R.betMin)} tới ${fmt(R.betMax)}`};
    if(!take(pl,amt)) return {err:'Không đủ tiền'}; race.bets.push({uid:pl.uid,pid:pl.pid,name:pl.prof.name,on:on_,amt}); pushAll(); return {}; }
  if(m.op==='hit'){ const i=riderOf(pl), r=race.riders[i]; if(race.st!=='run'||!r) return {}; if((m.r|0)!==race.round||r.hit===race.round) return {};
    r.hit=race.round; const beat=race.roundStart+R.beatAt, srv=t-beat-(pl.rtt||80)/2;
    let off=Number.isFinite(+m.off)?+m.off:srv; if(Math.abs(off-srv)>450) off=srv;          // lệch quá xa so với lúc server nhận → dùng giờ server
    const keysOk=Array.isArray(m.keys)&&m.keys.length===race.seq.length&&m.keys.every((k,n)=>k===race.seq[n]);
    let j='MISS', gain=0; if(keysOk) for(const [ms,name,g] of R.judge) if(Math.abs(off)<=ms){ j=name; gain=g; break; }
    if(j==='PERFECT'){ r.combo++; r.perfect++; gain+=Math.min(6,(r.combo-1)*2); } else r.combo=0;
    r.dist=Math.min(R.track,r.dist+gain); r.j=j; broadcastScene('track',{t:'raceHit',i,j,dist:r.dist,combo:r.combo}); return {j}; } });

// rút khỏi trận khi chưa chạy: trả tiền thuê ngựa + hoàn tiền ai đã cược vào kỵ sĩ này
function withdraw(i){ const r=race.riders[i]; if(r.pl){ give(r.pl,R.rent); r.pl.race=false; }
  for(const b of race.bets.filter(b=>b.on===i)){ const q=C.byUid.get(b.uid); if(q){ give(q,b.amt); note(q,`${r.name} rút khỏi trận, hoàn ${fmt(b.amt)} tiền cược`); } }
  race.bets=race.bets.filter(b=>b.on!==i).map(b=>({...b,on:b.on>i?b.on-1:b.on}));
  race.riders.splice(i,1); race.riders.forEach((x,k)=>x.idx=k);
  if(race.riders.length<R.minRiders) race.lobbyEnd=0; if(!race.riders.length) race.st='idle'; pushAll(); }
function startRound(t){ race.round++; const len=Math.min(9,4+Math.floor(race.round*.75)); race.seq=[...Array(len)].map(()=>KEYS[crypto.randomInt(4)]);
  race.roundStart=t+400; for(const r of race.riders) r.j=''; pushAll(); }
function finish(){ const order=[...race.riders].sort((a,b)=>b.dist-a.dist||b.perfect-a.perfect), w=order[0];
  const prize=R.rent*race.riders.length, pool=race.bets.reduce((a,b)=>a+b.amt,0), wins=race.bets.filter(b=>b.on===w.idx), wsum=wins.reduce((a,b)=>a+b.amt,0);
  if(w.pl&&players.has(w.pl.pid)){ give(w.pl,prize); reward(w.pl,{exp:R.winExp,kind:'game'},`Về nhất trường đua! +${fmt(prize)}`); }
  const payTo=(uid,v,msg)=>{ const q=C.byUid.get(uid); if(q){ give(q,v); note(q,msg,'vnd'); } };
  if(wsum>0) for(const b of wins) payTo(b.uid,Math.floor(pool*b.amt/wsum),`Cược trúng ${w.name}: +${fmt(Math.floor(pool*b.amt/wsum))}`);
  else for(const b of race.bets) payTo(b.uid,b.amt,`Không ai cược trúng, hoàn ${fmt(b.amt)}`);
  race.results={order:order.map(r=>({name:r.name,dist:r.dist,pf:r.perfect})),prize,pool};
  for(const r of race.riders) if(r.pl) r.pl.race=false; race.st='done'; race.doneAt=now()+9000; pushAll(); }
hook('tick',()=>{ const t=now();
  if(race.st==='lobby'&&race.lobbyEnd&&t>=race.lobbyEnd){ race.lobbyEnd=0; if(race.riders.length>=R.minRiders){ race.st='run'; race.round=-1; startRound(t+1200); } }
  else if(race.st==='run'&&t>=race.roundStart+R.roundMs){ for(const r of race.riders) if(r.hit!==race.round){ r.combo=0; r.j='MISS'; }
    if(race.round+1>=R.rounds||race.riders.some(r=>r.dist>=R.track)) finish(); else startRound(t); }
  else if(race.st==='done'&&t>=race.doneAt){ Object.assign(race,{st:'idle',riders:[],bets:[],round:-1,results:null,seq:[]}); pushAll(); } });
hook('slow',()=>{ if(race.st==='lobby') pushAll(); });
hook('leave',(pl,old)=>{ if(old!=='track') return; const i=riderOf(pl); if(i>=0&&race.st==='lobby') withdraw(i);
  else if(i>=0) race.riders[i].pl=null; pl.race=false; });
module.exports={race};
