// Sân pickleball (Hà Nội): HLV Tuấn dạy (kỹ năng 'pickle'), đấu 2 vs 2 chạm 7 điểm (hơn 2, tối đa 11), tính điểm mỗi pha bóng.
// Bóng rơi vào 1 điểm ở nửa sân đội nhận: chạy tới (WASD/mũi tên) đứng trong tầm vợt, bấm J drive / K dink / L lob (SPACE: cú vừa chọn) đúng lúc bóng tới.
// Không ai đỡ kịp là đội kia ăn điểm. Bot tự chạy tới điểm rơi. Thiếu người thì người bấm bắt đầu thuê bot tuyển thủ; rời sân giữa trận thì bot vào thay.
'use strict';
const C=require('./core'), P=require('./places'), crypto=require('crypto');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,T,on,hook,send,now,near,take,reward,markDirty,players,sceneOf}=C;
const K=S.PICKLE, SH=K.shots, fmt=S.fmt;
const M={st:'idle',seats:[null,null,null,null],pos:[null,null,null,null],score:[0,0],ball:null,nextServe:0,endAt:0,log:'',win:-1,server:0};
const C0=K.court, teamOf=i=>i<2?0:1, seatOf=pl=>M.seats.findIndex(s=>s&&s.pl===pl);
// nửa sân của mỗi đội (đội A nửa dưới, B nửa trên) và điểm bóng rơi theo cú: dink rơi sát lưới, lob rơi sâu cuối sân, drive/giao bóng rơi giữa
const half=t=>t===0?{y0:K.net+.8,y1:C0.y1+.6}:{y0:C0.y0+.4,y1:K.net-.8};
function landing(team,shot){ const h=half(team), x=C0.x0+1+Math.random()*(C0.x1-C0.x0-1), deep=team===0?h.y1-1:h.y0+1, nearNet=team===0?h.y0+1.2:h.y1-1.2, mid=(deep+nearNet)/2;
  const y=shot==='dink'?nearNet+(Math.random()-.5)*.8:shot==='lob'?deep+(Math.random()-.5)*.8:mid+(Math.random()-.5)*2.4; return {x,y:Math.max(h.y0,Math.min(h.y1,y))}; }
const posOf=i=>{ const s=M.seats[i]; if(s&&s.pl) return {x:s.pl.x/T,y:s.pl.y/T}; return M.pos[i]||{x:K.slots[i][0],y:K.slots[i][1]}; };
const view=pl=>({st:M.st,seats:M.seats.map(s=>s&&{name:s.name,bot:!!s.bot,pid:s.pl?s.pl.pid:0,g:s.g||'nam',c:s.c||''}),score:M.score,log:M.log,win:M.win,me:seatOf(pl),
  pos:M.pos.map((p,i)=>M.seats[i]&&M.seats[i].bot&&p?[+p.x.toFixed(2),+p.y.toFixed(2)]:null),
  ball:M.ball&&{from:M.ball.from,team:M.ball.team,fx:M.ball.fx,fy:M.ball.fy,tx:M.ball.tx,ty:M.ball.ty,shot:M.ball.shot,t0:M.ball.t0,at:M.ball.at}});
const push=()=>{ for(const q of sceneOf('pickle')) send(q,{t:'pk',v:view(q)}); };
function botOf(){ const used=new Set(M.seats.filter(Boolean).map(s=>s.name)), b=K.bots.find(b=>!used.has(b[0]))||K.bots[0]; return {bot:true,name:b[0],skill:b[1],g:b[2],c:b[3]}; }
function newBall(from,shot){ const p=posOf(from), team=1-teamOf(from), L=landing(team,shot), t=now()+200;
  M.ball={from,team,fx:+p.x.toFixed(2),fy:+p.y.toFixed(2),tx:+L.x.toFixed(2),ty:+L.y.toFixed(2),shot,t0:t,at:t+SH[shot].flight,hit:null}; push(); }
function serve(team){ const mine=team?[2,3]:[0,1]; newBall(mine[crypto.randomInt(2)],'serve'); }
function begin(){ M.st='play'; M.score=[0,0]; M.win=-1; M.log='Bắt đầu! Đội A giao bóng'; M.seats.forEach((s,i)=>{ M.pos[i]={x:K.slots[i][0],y:K.slots[i][1]};
    if(s&&s.pl){ const [x,y]=K.slots[i]; s.pl.x=x*T; s.pl.y=y*T; s.pl.budget=0; send(s.pl,{t:'pos',x:s.pl.x,y:s.pl.y}); } }); serve(0); }
function end(team){ M.st='end'; M.win=team; M.ball=null; M.endAt=now()+7000; M.log=`Đội ${team?'B':'A'} thắng ${M.score[team]}–${M.score[1-team]}!`;
  M.seats.forEach((s,i)=>{ if(!s||!s.pl) return; C.track(s.pl,'match'); if(teamOf(i)===team){ const o=s.pl.prof.look&&s.pl.prof.look.outfit||{}, pr=S.PK_SETS.find(z=>z.premium&&Object.entries(z.items).every(([sl,k])=>o[sl]===k));   // mặc đủ set premium: ×1,5 EXP
    const d=s.pl.prof.daily, paid=(d.pkWin||0)<(K.paidWins||99); if(paid) d.pkWin=(d.pkWin||0)+1;   /* paidWins trận thắng có tiền mỗi ngày */
    reward(s.pl,{exp:Math.round(K.win.exp*(pr?1.5:1)),vnd:paid?K.win.vnd:0},'Thắng trận pickleball 2 vs 2!'+(pr?` (set ${pr.name} ×1,5 EXP)`:'')+(paid?'':` (hôm nay đủ ${K.paidWins} trận có thưởng tiền)`)); P.stat(s.pl,'pickle',1); } else reward(s.pl,{exp:K.lose.exp},'Thua trận pickleball, tập thêm nhé'); });
  push(); }
const won=()=>{ const [a,b]=M.score; return Math.max(a,b)>=K.cap||(Math.max(a,b)>=K.target&&Math.abs(a-b)>=2); };
function botShot(){ const r=Math.random(); return r<.4?'drive':r<.75?'dink':'lob'; }
// người đỡ bóng của đội nhận: ai đứng gần điểm rơi nhất (người hay bot); bot chỉ chạy khi mình là người gần nhất, còn lại lùi về ô
const nearest=b=>{ let best=-1, bd=1e9; for(const i of b.team?[2,3]:[0,1]){ const p=posOf(i), d=Math.hypot(p.x-b.tx,p.y-b.ty); if(d<bd){ bd=d; best=i; } } return best; };
hook('tick',()=>{ const t=now();
  if(M.st==='end'&&t>=M.endAt){ Object.assign(M,{st:'idle',seats:[null,null,null,null],pos:[null,null,null,null],score:[0,0],ball:null,log:'',win:-1}); push(); return; }
  if(M.st!=='play') return;
  const b=M.ball, chaser=b?nearest(b):-1;
  M.seats.forEach((s,i)=>{ if(!s||!s.bot) return; const p=M.pos[i]||(M.pos[i]={x:K.slots[i][0],y:K.slots[i][1]}), g=b&&i===chaser?{x:b.tx,y:b.ty}:{x:K.slots[i][0],y:K.slots[i][1]};
    const dx=g.x-p.x, dy=g.y-p.y, d=Math.hypot(dx,dy); if(d>.05){ const st=Math.min(d,K.botSpeed*.1); p.x+=dx/d*st; p.y+=dy/d*st; } });
  if(!b){ if(M.nextServe&&t>=M.nextServe){ M.nextServe=0; serve(M.server); } else if(t%500<100) push(); return; }
  if(t%300<100) push();                                                                                       // gửi vị trí bot cho mọi máy
  const W=SH[b.shot].win; if(t<b.at+W*.6+80) return;
  let ok=false, next='drive', who=chaser, s=M.seats[chaser];
  if(b.hit){ ok=true; next=b.hit.shot; who=b.hit.seat; s=M.seats[who]; }
  else if(s&&s.bot){ const p=M.pos[chaser]; ok=Math.hypot(p.x-b.tx,p.y-b.ty)<=K.reach&&Math.random()<s.skill*SH[b.shot].bot; next=botShot(); }
  if(ok){ M.log=`${s.name}: ${SH[next].name}`; newBall(who,next); return; }
  const scorer=1-b.team; M.score[scorer]++; M.log=`${s?s.name:'Đội '+(b.team?'B':'A')} ${s&&s.bot?'đỡ hụt':'không đỡ được'}! Đội ${scorer?'B':'A'} +1`; M.ball=null;
  if(won()) return end(scorer); M.server=scorer; M.nextServe=t+1400; push(); });
const leaveSeat=pl=>{ const i=seatOf(pl); if(i<0) return; if(M.st==='play'){ M.seats[i]=botOf(); M.pos[i]={x:pl.x/T,y:pl.y/T}; } else { M.seats[i]=null; if(M.st==='lobby'&&!M.seats.some(s=>s&&s.pl)) M.st='idle'; } push(); };
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
  if(m.op==='buyset'||m.op==='wearset'){ const z=S.PK_SETS.find(z=>z.id===m.id); if(!z) return {err:'Không có set này'}; if(!P.nearNpc(pl,'pk_shop')) return {err:'Gặp chị Hà ở quầy đồ pickleball'};
    const ids=Object.values(z.items), have=ids.every(k=>p.owned[k]);
    if(m.op==='buyset'){ if(have) return {err:'Bạn đã có set này rồi'}; if(!shopPay(pl,z.price)) return {err:`Set ${z.name} giá ${fmt(z.price)}, không đủ tiền`}; for(const k of ids) p.owned[k]=1; }
    else if(!have) return {err:'Chưa mua set này'};
    if(m.op==='wearset'||m.wear){ p.look.outfit={...p.look.outfit,...z.items}; C.refreshInfo(pl); }
    markDirty(pl); return {msg:m.op==='buyset'?`Đã mua set ${z.name}${m.wear?' và mặc luôn':''}`:`Đã mặc set ${z.name}`,look:p.look}; }
  if(m.op==='water'){ const t=now(); if(pl.waterAt&&t-pl.waterAt<60e3) return {err:'Vừa uống rồi, nghỉ chút'}; pl.waterAt=t; p.needs.energy=Math.min(100,p.needs.energy+5); markDirty(pl); return {msg:'Ực ực, mát! +5 năng lượng'}; }
  if(m.op==='hit'){ const i=seatOf(pl), b=M.ball; if(M.st!=='play'||!b||i<0||teamOf(i)!==b.team||b.hit) return {ok:false}; const d=now()-b.at, W=SH[b.shot].win;   // phải đứng trong tầm vợt của điểm rơi và bấm đúng lúc
    const far=Math.hypot(pl.x/T-b.tx,pl.y/T-b.ty)>K.reach+.4, early=d<-W, late=d>W*.6; if(far||early||late) return {ok:false,why:far?'xa':early?'sớm':'muộn'};
    b.hit={seat:i,shot:Object.hasOwn(SH,m.shot)&&m.shot!=='serve'?m.shot:'drive'}; return {ok:true}; }
  return {err:'?'}; });
module.exports={M};
