// Trường đua ngựa ở nông trại Đà Lạt: thuê ngựa đua, cá cược ai về nhất, đua kiểu Audition.
// Mỗi nhịp server phát 1 chuỗi mũi tên; gõ đúng chuỗi rồi bấm Space khi vạch chạy tới mốc → PERFECT/GREAT/COOL/BAD/MISS → ngựa lao lên.
'use strict';
const C=require('./core');
const crypto=require('crypto');
const {S,on,hook,send,now,near,moveTo,take,give,reward,note,players,broadcastScene,sceneOf}=C;
const R=S.RACE, fmt=S.fmt, KEYS=['L','U','R','D'];
const SPAWN={x:30,y:25.5};
const race={st:'idle',riders:[],bets:[],lobbyEnd:0,round:-1,roundStart:0,seq:[],doneAt:0,results:null};
// nài bot: skill 0.35–0.8, mỗi nhịp tự "bấm" ở 1 thời điểm ngẫu nhiên với độ chính xác theo skill
const fee=()=>Math.round(R.rent*R.botMul);
function botRider(){ const used=new Set(race.riders.map(r=>r.name)), name=R.bots.find(n=>!used.has(n))||'Bot '+crypto.randomInt(100);
  return {bot:true,name,skill:.35+crypto.randomInt(46)/100,dist:0,combo:0,perfect:0,hit:-1}; }
function fillBots(){ while(race.riders.length<R.maxRiders) race.riders.push(botRider()); race.riders.forEach((x,k)=>x.idx=k); }
function openLobby(t){ Object.assign(race,{st:'lobby',riders:[],bets:[],round:-1,results:null,seq:[],lobbyEnd:t+R.every*1000}); fillBots(); pushAll(); }

on('enterTrack',pl=>{ const d=S.DALAT.track; if(pl.scene!=='dalat'||!near(pl,d.x,d.y,44)) return {err:'Đứng trước cổng trường đua'};
  moveTo(pl,'track',SPAWN.x,SPAWN.y); send(pl,{t:'race',v:view(pl)}); return {}; });
const riderOf=pl=>race.riders.findIndex(r=>r.pl===pl);
function view(pl){ const t=now(), mine=race.bets.filter(b=>b.uid===pl.uid);
  return {st:race.st,round:race.round,rounds:R.rounds,track:R.track,lobbyLeft:race.st==='lobby'&&race.lobbyEnd?Math.max(0,race.lobbyEnd-t):0,
    riders:race.riders.map(r=>({name:r.name,bot:!!r.bot,dist:r.dist,j:r.j||'',combo:r.combo,pf:r.perfect,pot:race.bets.filter(b=>b.on===r.idx).reduce((a,b)=>a+b.amt,0)})),fee:race.riders.some(r=>r.bot)?fee():R.rent,every:R.every,
    me:riderOf(pl),myBets:mine.map(b=>({on:b.on,amt:b.amt})),pool:race.bets.reduce((a,b)=>a+b.amt,0),results:race.results,rent:R.rent,
    seq:race.st==='run'?race.seq:null,roundStart:race.roundStart,beat:race.roundStart+R.beatAt,roundMs:R.roundMs}; }
const pushAll=()=>{ for(const pl of sceneOf('track')) send(pl,{t:'race',v:view(pl)}); };

on('race',(pl,m)=>{ if(pl.scene!=='track') return {err:'Vào trường đua đã'}; const t=now();
  if(m.op==='view') return {v:view(pl)};
  if(m.op==='join'){ if(!pl.prof.skills.cuoingua) return {err:'Chưa học Cưỡi ngựa (học online ở phòng)'};
    if(race.st!=='lobby') return {err:'Đang có trận, đợi lượt chốt danh sách sau'}; if(riderOf(pl)>=0) return {err:'Bạn đã đăng ký'};
    // người vào thay 1 nài bot (ưu tiên bot ít người cược nhất, hoàn tiền cược vào bot đó)
    const bots=race.riders.filter(r=>r.bot); if(!bots.length) return {err:`Đủ ${R.maxRiders} kỵ sĩ rồi`};
    const f=fee(); if(!take(pl,f)) return {err:`Thuê ngựa đua ${fmt(f)} (trận có bot ×${R.botMul})`};
    const pot=i=>race.bets.filter(b=>b.on===i).reduce((a,b)=>a+b.amt,0), b=bots.sort((x,y)=>pot(x.idx)-pot(y.idx))[0], bi=b.idx;
    for(const bt of race.bets.filter(x=>x.on===bi)){ const q=C.byUid.get(bt.uid); if(q){ give(q,bt.amt); note(q,`${b.name} nhường ngựa cho ${pl.prof.name}, hoàn ${fmt(bt.amt)} tiền cược`); } }
    race.bets=race.bets.filter(x=>x.on!==bi);
    race.riders[bi]={pl,uid:pl.uid,name:pl.prof.name,idx:bi,dist:0,combo:0,perfect:0,hit:-1,paid:f}; pl.race=true; pushAll(); return {}; }
  if(m.op==='leave'){ const i=riderOf(pl); if(i<0||race.st!=='lobby') return {err:'Không rút được lúc này'}; withdraw(i); return {}; }
  // chỉ mình với toàn bot: khỏi đợi hết giờ chốt, xuất phát luôn
  if(m.op==='start'){ if(race.st!=='lobby'||riderOf(pl)<0) return {err:'Đăng ký đua trước đã'}; if(race.riders.filter(r=>!r.bot).length>1) return {err:'Có người chơi khác cùng đua, đợi giờ chốt danh sách'};
    race.lobbyEnd=t; return {}; }
  if(m.op==='bet'){ if(race.st!=='lobby') return {err:'Chỉ cược trước khi xuất phát'}; const on_=m.on|0, amt=Math.round(m.amt||0);
    if(!race.riders[on_]) return {err:'Chọn kỵ sĩ'}; if(amt<R.betMin||amt>R.betMax) return {err:`Cược từ ${fmt(R.betMin)} tới ${fmt(R.betMax)}`};
    if(!take(pl,amt)) return {err:'Không đủ tiền'}; race.bets.push({uid:pl.uid,pid:pl.pid,name:pl.prof.name,on:on_,amt}); pushAll(); return {}; }
  if(m.op==='hit'){ const i=riderOf(pl), r=race.riders[i]; if(race.st!=='run'||!r) return {}; if((m.r|0)!==race.round||r.hit===race.round) return {};
    r.hit=race.round; const beat=race.roundStart+R.beatAt, off=C.beatOff(pl,t,beat,m.off);
    const keysOk=Array.isArray(m.keys)&&m.keys.length===race.seq.length&&m.keys.every((k,n)=>k===race.seq[n]);
    let j='MISS', gain=0; if(keysOk) for(const [ms,name,g] of R.judge) if(Math.abs(off)<=ms){ j=name; gain=g; break; }
    if(j==='PERFECT'){ r.combo++; r.perfect++; gain+=Math.min(6,(r.combo-1)*2); } else r.combo=0;
    r.dist=Math.min(R.track,r.dist+gain); r.j=j; broadcastScene('track',{t:'raceHit',i,j,dist:r.dist,combo:r.combo}); return {j}; } });

// rút khỏi trận khi chưa chạy: trả tiền thuê ngựa + hoàn tiền ai đã cược vào kỵ sĩ này
function withdraw(i){ const r=race.riders[i]; if(r.pl){ give(r.pl,r.paid||R.rent); r.pl.race=false; }
  for(const b of race.bets.filter(b=>b.on===i)){ const q=C.byUid.get(b.uid); if(q){ give(q,b.amt); note(q,`${r.name} rút khỏi trận, hoàn ${fmt(b.amt)} tiền cược`); } }
  race.bets=race.bets.filter(b=>b.on!==i); race.riders[i]={...botRider(),idx:i}; pushAll(); }
function startRound(t){ race.round++; const len=Math.min(9,4+Math.floor(race.round*.75)); race.seq=[...Array(len)].map(()=>KEYS[crypto.randomInt(4)]);
  race.roundStart=t+400; for(const r of race.riders) r.j=''; pushAll(); }
function finish(){ const order=[...race.riders].sort((a,b)=>b.dist-a.dist||b.perfect-a.perfect), w=order[0], withBots=race.riders.some(r=>r.bot);
  // tiền thưởng: phí của mọi ngựa (nhà cái góp phần của bot) ×1,5 khi có bot; cược chia theo tỉ lệ, nhà cái bù thêm 20%
  // đua với bot: thưởng = phí × (số người + 1), mỗi ngày chỉ botWins lần thắng có thưởng (sau đó hoàn phí)
  const humans=race.riders.filter(r=>!r.bot).length, wd=w.pl&&w.pl.prof?w.pl.prof.daily:null, botPaid=!withBots||!wd||(wd.raceBotW||0)<(R.botWins||99);
  const prize=withBots?(botPaid?fee()*(humans+1):fee()):R.rent*race.riders.length, pool0=race.bets.reduce((a,b)=>a+b.amt,0), pool=withBots?Math.round(pool0*(1+R.houseBonus)):pool0;
  const wins=race.bets.filter(b=>b.on===w.idx), wsum=wins.reduce((a,b)=>a+b.amt,0);
  if(w.pl&&players.has(w.pl.pid)){ require('./places').stat(w.pl,'raceW',1); if(withBots&&botPaid) wd.raceBotW=(wd.raceBotW||0)+1; give(w.pl,prize); reward(w.pl,{exp:R.winExp,kind:'game'},`Về nhất trường đua! +${fmt(prize)}${withBots&&!botPaid?` (hôm nay đã thắng bot ${R.botWins} lần có thưởng, lần này hoàn phí)`:''}`); }
  const payTo=(uid,v,msg)=>{ const q=C.byUid.get(uid); if(q){ give(q,v); note(q,msg,'vnd'); } };
  if(wsum>0) for(const b of wins) payTo(b.uid,Math.floor(pool*b.amt/wsum),`Cược trúng ${w.name}: +${fmt(Math.floor(pool*b.amt/wsum))}`);
  else if(!withBots) for(const b of race.bets) payTo(b.uid,b.amt,`Không ai cược trúng, hoàn ${fmt(b.amt)}`);
  for(const b of race.bets) if(b.on!==w.idx){ const q=C.byUid.get(b.uid); if(q) note(q,`Cược ${fmt(b.amt)} vào ${race.riders[b.on].name} thua rồi`,'lock'); }
  race.results={order:order.map(r=>({name:r.name,bot:!!r.bot,dist:r.dist,pf:r.perfect})),prize,pool,withBots};
  for(const r of race.riders) if(r.pl) r.pl.race=false; race.st='done'; race.doneAt=now()+9000; pushAll(); }
// bot tự chấm điểm mỗi nhịp theo skill
function botsHit(t){ for(const r of race.riders){ if(!r.bot||r.hit===race.round) continue; if(!r.at) r.at=race.roundStart+R.beatAt-300+crypto.randomInt(600); if(t<r.at) continue;
  r.hit=race.round; r.at=0; const x=Math.random(), s=r.skill; let j='MISS', gain=0;
  for(const [k,[name,g]] of [[s*.45,['PERFECT',14]],[s*.85,['GREAT',10]],[s+.15,['COOL',7]],[.92,['BAD',3]]].map(([k,v])=>[k,v])) if(x<k){ j=name; gain=g; break; }
  if(j==='PERFECT'){ r.combo++; r.perfect++; gain+=Math.min(6,(r.combo-1)*2); } else r.combo=0;
  r.dist=Math.min(R.track,r.dist+gain); r.j=j; broadcastScene('track',{t:'raceHit',i:r.idx,j,dist:r.dist,combo:r.combo}); } }
hook('tick',()=>{ const t=now();
  if(race.st==='idle') openLobby(t);
  else if(race.st==='lobby'&&t>=race.lobbyEnd){ fillBots(); race.st='run'; race.round=-1; startRound(t+1200); }   // chốt danh sách, xuất phát
  else if(race.st==='run'){ botsHit(t); if(t>=race.roundStart+R.roundMs){ for(const r of race.riders) if(r.hit!==race.round){ r.combo=0; r.j='MISS'; }
    if(race.round+1>=R.rounds||race.riders.some(r=>r.dist>=R.track)) finish(); else startRound(t); } }
  else if(race.st==='done'&&t>=race.doneAt) openLobby(t); });
hook('slow',()=>{ if(race.st==='lobby') pushAll(); });
hook('leave',(pl,old)=>{ if(old!=='track') return; const i=riderOf(pl); if(i>=0&&race.st==='lobby') withdraw(i);
  else if(i>=0){ race.riders[i].pl=null; race.riders[i].bot=true; race.riders[i].skill=.3; } pl.race=false; });   // bỏ chạy giữa trận: ngựa chạy tiếp như bot
module.exports={race};
