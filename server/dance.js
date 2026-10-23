// Phòng Bay: nhảy kiểu Audition. Mỗi lượt server phát chuỗi mũi tên; gõ đúng chuỗi rồi bấm Space đúng phách cuối của lượt.
// PERFECT/GREAT/COOL/BAD/MISS cộng điểm, PERFECT liền nhau có combo. Hết bài xếp hạng, nhận EXP theo hạng.
'use strict';
const C=require('./core');
const crypto=require('crypto');
const {S,on,hook,send,now,near,moveTo,reward,markDirty,players,broadcastScene,sceneOf}=C;
const D=S.DANCE, KEYS=['L','U','R','D'];
const room={st:'idle',song:null,dancers:[],lobbyEnd:0,round:-1,roundStart:0,roundMs:0,beatAt:0,seq:[],doneAt:0,results:null,startAt:0};
const songOf=id=>S.SONGS.find(s=>s.id===id)||S.SONGS[0];
const di=pl=>room.dancers.findIndex(d=>d.pl===pl);
function view(pl){ return {st:room.st,song:room.song,songName:room.song&&songOf(room.song).name,bpm:room.song&&songOf(room.song).bpm,round:room.round,rounds:D.rounds,
  lobbyLeft:room.st==='lobby'?Math.max(0,room.lobbyEnd-now()):0,dancers:room.dancers.map(d=>({name:d.name,score:d.score,pf:d.perfect,combo:d.combo,j:d.j||''})),
  me:di(pl),seq:room.st==='play'?room.seq:null,roundStart:room.roundStart,beat:room.roundStart+room.beatAt,roundMs:room.roundMs,startAt:room.startAt,results:room.results}; }
const push=()=>{ for(const pl of sceneOf('phongbay')) send(pl,{t:'dance',v:view(pl)}); };
hook('enter',(pl,id)=>{ if(id==='phongbay') setTimeout(()=>{ if(pl.prof&&pl.scene==='phongbay') send(pl,{t:'dance',v:view(pl)}); },300); });   /* Phòng Bay là nhà riêng ở phố Đà Bắc (cửa thường) */
on('enterBay',pl=>{ if(pl.scene!=='club'||!near(pl,D.door.x,D.door.y,40)) return {err:'Phòng Bay đã dời ra nhà riêng ở phố Đà Bắc, cạnh đường Hà Phạm'};
  const I=S.INTERIORS.phongbay; moveTo(pl,'phongbay',I.spawn.x,I.spawn.y); send(pl,{t:'dance',v:view(pl)}); return {}; });
on('dance',(pl,m)=>{ if(pl.scene!=='phongbay') return {err:'Vào Phòng Bay đã'}; const t=now();
  if(m.op==='view') return {v:view(pl)};
  if(m.op==='join'){ if(room.st==='play'||room.st==='done') return {err:'Bài đang chạy, đợi bài sau'}; if(di(pl)>=0) return {err:'Đã vào sàn rồi'};
    if(room.dancers.length>=D.maxDancers) return {err:`Sàn tối đa ${D.maxDancers} người`};
    if(!room.dancers.length){ room.song=songOf(m.song).id; room.st='lobby'; room.lobbyEnd=t+D.lobbyMs; }
    room.dancers.push({pl,uid:pl.uid,name:pl.prof.name,score:0,perfect:0,combo:0,hit:-1}); pl.dancing=true; push(); return {}; }
  if(m.op==='leave'){ const i=di(pl); if(i<0) return {}; if(room.st==='lobby'){ room.dancers.splice(i,1); if(!room.dancers.length) room.st='idle'; } else room.dancers[i].pl=null; pl.dancing=false; push(); return {}; }
  if(m.op==='hit'){ const i=di(pl), d=room.dancers[i]; if(room.st!=='play'||!d||(m.r|0)!==room.round||d.hit===room.round) return {};
    d.hit=room.round; const beat=room.roundStart+room.beatAt, off=C.beatOff(pl,t,beat,m.off);
    const ok=Array.isArray(m.keys)&&m.keys.length===room.seq.length&&m.keys.every((k,n)=>k===room.seq[n]);
    let j='MISS', pts=0; if(ok) for(const [ms,name,p] of D.judge) if(Math.abs(off)<=ms){ j=name; pts=p; break; }
    if(j==='PERFECT'){ d.combo++; d.perfect++; pts+=D.combo*(d.combo-1); } else if(j!=='GREAT') d.combo=0;
    d.score+=pts; d.j=j; broadcastScene('phongbay',{t:'danceHit',i,j,score:d.score,combo:d.combo}); return {j}; } });
function startRound(t){ room.round++; const len=Math.min(9,3+Math.floor(room.round*.85)); room.seq=[...Array(len)].map(()=>KEYS[crypto.randomInt(4)]); room.roundStart=t; for(const d of room.dancers) d.j=''; push(); }
function finish(){ const order=[...room.dancers].sort((a,b)=>b.score-a.score||b.perfect-a.perfect);
  order.forEach((d,rank)=>{ const pl=d.pl&&players.has(d.pl.pid)?d.pl:null; if(!pl) return; pl.dancing=false;
    reward(pl,{exp:D.exp[rank]||10,kind:'game'},`Phòng Bay: hạng ${rank+1}/${order.length} · ${d.score} điểm · ${d.perfect} PERFECT`);
    const st=p0=>{ const s=p0.stats=p0.stats||{}; s.dance=Math.max(s.dance||0,d.score); }; st(pl.prof); markDirty(pl);
    const p=pl.prof; if(p.quests.quay2==='active'){ p.qprog=p.qprog||{}; p.qprog.quay2=Math.max(p.qprog.quay2||0,d.perfect); markDirty(pl); } });
  room.results=order.map(d=>({name:d.name,score:d.score,pf:d.perfect})); room.st='done'; room.doneAt=now()+8000; push(); }
hook('tick',()=>{ const t=now();
  if(room.st==='lobby'&&t>=room.lobbyEnd){ if(!room.dancers.length){ room.st='idle'; return; } const bpm=songOf(room.song).bpm;
    room.roundMs=Math.round(480000/bpm); room.beatAt=Math.round(room.roundMs*7/8); room.st='play'; room.round=-1; room.startAt=t+room.roundMs/2; startRound(room.startAt); }
  else if(room.st==='play'&&t>=room.roundStart+room.roundMs){ for(const d of room.dancers) if(d.hit!==room.round){ d.combo=0; d.j='MISS'; }
    if(room.round+1>=D.rounds) finish(); else startRound(room.roundStart+room.roundMs); }
  else if(room.st==='done'&&t>=room.doneAt){ Object.assign(room,{st:'idle',dancers:[],round:-1,results:null,seq:[],song:null}); push(); } });
hook('slow',()=>{ if(room.st==='lobby') push(); });
// bo cho Bot Dancer 500k thì được hôn (cả phòng thấy tim bay)
const P=require('./places');
on('tip',pl=>{ if(pl.scene!=='phongbay'||!P.nearNpc(pl,'dancer',60)) return {err:'Lại gần Bot Dancer đã'}; if(!C.take(pl,D.tip)) return {err:`Bo ${S.fmt(D.tip)} mới được hôn`};
  broadcastScene('phongbay',{t:'ev',k:'kiss',npc:'dancer',id:pl.pid,name:pl.prof.name}); C.gainExp(pl,10); return {msg:'Chụt! Bot Dancer hôn má bạn một cái ♥'}; });
hook('leave',(pl,old)=>{ if(old!=='phongbay') return; const i=di(pl); if(i<0) return; if(room.st==='lobby'){ room.dancers.splice(i,1); if(!room.dancers.length) room.st='idle'; } else room.dancers[i].pl=null; pl.dancing=false; push(); });
