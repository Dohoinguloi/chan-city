// Sân pickleball (Hà Nội): HLV Tuấn dạy (kỹ năng 'pickle'), đấu 2 vs 2 chạm 7 điểm (hơn 2, tối đa 11), tính điểm mỗi pha bóng.
// Bóng bay tới ai thì người đó bấm SPACE đúng lúc (cửa sổ theo cú đối thủ đánh), chọn cú trả ↑ drive / ↓ dink / ← → lob; hụt là đội kia ăn điểm.
// Thiếu người thì người bấm bắt đầu thuê bot tuyển thủ. Đang đấu thì đứng yên ở ô của mình; rời sân giữa trận thì bot vào thay.
'use strict';
const C=require('./core'), P=require('./places'), crypto=require('crypto');
const {S,T,on,hook,send,now,near,take,reward,markDirty,players,sceneOf}=C;
const K=S.PICKLE, SH=K.shots, fmt=S.fmt;
const M={st:'idle',seats:[null,null,null,null],score:[0,0],ball:null,nextServe:0,endAt:0,log:'',win:-1};
const teamOf=i=>i<2?0:1, seatOf=pl=>M.seats.findIndex(s=>s&&s.pl===pl);
const view=pl=>({st:M.st,seats:M.seats.map(s=>s&&{name:s.name,bot:!!s.bot,pid:s.pl?s.pl.pid:0,g:s.g||'nam',c:s.c||''}),score:M.score,log:M.log,win:M.win,me:seatOf(pl),
  ball:M.ball&&{from:M.ball.from,to:M.ball.to,shot:M.ball.shot,t0:M.ball.t0,at:M.ball.at}});
const push=()=>{ for(const q of sceneOf('pickle')) send(q,{t:'pk',v:view(q)}); };
function botOf(){ const used=new Set(M.seats.filter(Boolean).map(s=>s.name)), b=K.bots.find(b=>!used.has(b[0]))||K.bots[0]; return {bot:true,name:b[0],skill:b[1],g:b[2],c:b[3]}; }
const lock=(pl,i)=>{ const [x,y]=K.slots[i]; pl.freeze=true; pl.x=x*T; pl.y=y*T; pl.budget=0; send(pl,{t:'pos',x:pl.x,y:pl.y}); };
function newBall(from,to,shot){ const t=now()+250; M.ball={from,to,shot,t0:t,at:t+SH[shot].flight,hit:null}; push(); }
function serve(team){ const mine=team?[2,3]:[0,1], opp=team?[0,1]:[2,3]; newBall(mine[crypto.randomInt(2)],opp[crypto.randomInt(2)],'serve'); }
function begin(){ M.st='play'; M.score=[0,0]; M.win=-1; M.log='Bắt đầu! Đội A giao bóng'; M.seats.forEach((s,i)=>{ if(s&&s.pl) lock(s.pl,i); }); serve(0); }
function end(team){ M.st='end'; M.win=team; M.ball=null; M.endAt=now()+7000; M.log=`Đội ${team?'B':'A'} thắng ${M.score[team]}–${M.score[1-team]}!`;
  M.seats.forEach((s,i)=>{ if(!s||!s.pl) return; s.pl.freeze=false; if(teamOf(i)===team){ reward(s.pl,{exp:K.win.exp,vnd:K.win.vnd},'Thắng trận pickleball 2 vs 2!'); P.stat(s.pl,'pickle',1); } else reward(s.pl,{exp:K.lose.exp},'Thua trận pickleball, tập thêm nhé'); });
  push(); }
const won=()=>{ const [a,b]=M.score; return Math.max(a,b)>=K.cap||(Math.max(a,b)>=K.target&&Math.abs(a-b)>=2); };
function botShot(){ const r=Math.random(); return r<.4?'drive':r<.75?'dink':'lob'; }
hook('tick',()=>{ const t=now();
  if(M.st==='end'&&t>=M.endAt){ Object.assign(M,{st:'idle',seats:[null,null,null,null],score:[0,0],ball:null,log:'',win:-1}); push(); return; }
  if(M.st!=='play') return;
  if(!M.ball){ if(M.nextServe&&t>=M.nextServe){ M.nextServe=0; serve(M.server); } return; }
  const b=M.ball, W=SH[b.shot].win; if(t<b.at+W*.6+80) return;
  const s=M.seats[b.to]; let ok, next;
  if(s.bot){ ok=Math.random()<s.skill*SH[b.shot].bot; next=botShot(); } else { ok=!!(b.hit&&b.hit.ok); next=b.hit&&b.hit.shot||'drive'; }
  if(ok){ const opp=teamOf(b.to)?[0,1]:[2,3]; M.log=`${s.name}: ${SH[next].name}`; newBall(b.to,opp[crypto.randomInt(2)],next); return; }
  const scorer=1-teamOf(b.to); M.score[scorer]++; M.log=`${s.name} ${s.bot?'đỡ hụt':b.hit?'đánh lệch nhịp':'không kịp đỡ'}! Đội ${scorer?'B':'A'} +1`; M.ball=null;
  if(won()) return end(scorer); M.server=scorer; M.nextServe=t+1400; push(); });
const leaveSeat=pl=>{ const i=seatOf(pl); if(i<0) return; pl.freeze=false; if(M.st==='play') M.seats[i]=botOf(); else { M.seats[i]=null; if(M.st==='lobby'&&!M.seats.some(s=>s&&s.pl)) M.st='idle'; } push(); };
hook('enter',(pl,id)=>{ if(id==='pickle') send(pl,{t:'pk',v:view(pl)}); });
hook('leave',(pl,old)=>{ if(old==='pickle') leaveSeat(pl); }); hook('logout',leaveSeat);
on('pk',(pl,m)=>{ const p=pl.prof; if(pl.scene!=='pickle') return {err:'Tới sân pickleball đã (Grab, Hà Nội)'};
  if(m.op==='view') return {v:view(pl)};
  if(m.op==='lesson'){ if(p.skills.pickle) return {err:'Bạn đã học rồi, vào sân đấu thôi'}; if(!P.nearNpc(pl,'hlv_pickle')) return {err:'Gặp HLV Tuấn cạnh sân'};
    if(!take(pl,K.lesson.price)) return {err:`Học phí ${fmt(K.lesson.price)}`};
    return P.startTask(pl,'work',K.lesson.dur,()=>{ p.skills.pickle=true; reward(pl,{exp:K.lesson.exp},'Học xong pickleball: SPACE đánh bóng, ↑ drive, ↓ dink, ← → lob'); markDirty(pl); return {}; },{anim:'attack',name:'Tập pickleball với HLV Tuấn'}); }
  if(m.op==='join'){ if(!p.skills.pickle) return {err:'Chưa biết chơi: học với HLV Tuấn trước'}; if(M.st==='play'||M.st==='end') return {err:'Đang có trận, đợi trận sau'}; if(seatOf(pl)>=0) return {err:'Bạn đã vào sân rồi'};
    let i=Number.isInteger(m.seat)&&m.seat>=0&&m.seat<4&&!M.seats[m.seat]?m.seat:M.seats.findIndex(s=>!s); if(i<0) return {err:'Sân đủ 4 người rồi'};
    M.seats[i]={pl,name:p.name}; M.st='lobby'; push(); return {seat:i}; }
  if(m.op==='leave'){ if(seatOf(pl)<0) return {err:'Bạn chưa vào sân'}; leaveSeat(pl); return {}; }
  if(m.op==='start'){ if(M.st!=='lobby') return {err:'Chưa có ai vào sân'}; if(seatOf(pl)<0) return {err:'Vào sân đã rồi mới bắt đầu được'};
    const empty=M.seats.filter(s=>!s).length, cost=empty*K.hire; if(cost&&!take(pl,cost)) return {err:`Thuê ${empty} bot hết ${fmt(cost)}, không đủ tiền`};
    for(let i=0;i<4;i++) if(!M.seats[i]) M.seats[i]=botOf();   // lần lượt để mỗi bot 1 tuyển thủ khác nhau
    begin(); return {hired:empty,cost}; }
  if(m.op==='water'){ const t=now(); if(pl.waterAt&&t-pl.waterAt<60e3) return {err:'Vừa uống rồi, nghỉ chút'}; pl.waterAt=t; p.needs.energy=Math.min(100,p.needs.energy+5); markDirty(pl); return {msg:'Ực ực, mát! +5 năng lượng'}; }
  if(m.op==='hit'){ const i=seatOf(pl), b=M.ball; if(M.st!=='play'||!b||b.to!==i||b.hit) return {}; const d=now()-b.at, W=SH[b.shot].win;
    b.hit={ok:d>=-W&&d<=W*.6,shot:SH[m.shot]&&m.shot!=='serve'?m.shot:'drive',d}; return {ok:b.hit.ok,d}; }
  return {err:'?'}; });
module.exports={M};
