// Boss MCK ở đấu trường góc Tây Bắc Ké: thách đấu ở sân khấu, mọi người trong đấu trường cùng đánh (J). MCK đuổi người gần nhất, vung mic cận chiến,
// phóng sóng âm từ xa. Máu boss tăng theo số người; hạ được thì thưởng theo phần sát thương; gục thì mất năng lượng, bị đẩy ra cổng; không ai đánh một lúc thì MCK bỏ đi.
'use strict';
const C=require('./core'), P=require('./places');
const {S,T,on,hook,send,now,near,markDirty,reward,give,note,players}=C;
const B=S.MCK, A0=B.arena, fmt=S.fmt;
let BOSS=null, bossCd=0, pushAt=0;
const inArena=pl=>pl.scene==='retreat'&&pl.x/T>=A0.x0&&pl.x/T<=A0.x1+1&&pl.y/T>=A0.y0&&pl.y/T<=A0.y1+1;
// lượt đấu mỗi ngày (theo lịch thật): thua lượt 1 thì được đánh lượt 2; thắng 1 lần hoặc thua 2 lần là hết lượt hôm nay. MCK bỏ qua người đã hết lượt
const tries=pl=>{ const f=pl.prof.flags, d=S.realTime(now()).day; if(!f.mckDay||f.mckDay.d!==d) f.mckDay={d,lose:0,win:0}; return f.mckDay; };
const canFight=pl=>{ const r=tries(pl); return !r.win&&r.lose<2; };
const noTry=pl=>tries(pl).win?'Hôm nay bạn đã hạ MCK rồi, mai quay lại nhé!':'Bạn đã thua MCK 2 lượt hôm nay, mai quay lại phục thù nhé!';
const fighters=()=>[...players.values()].filter(pl=>inArena(pl)&&canFight(pl));
const view=()=>BOSS&&{x:+BOSS.x.toFixed(2),y:+BOSS.y.toFixed(2),hp:Math.max(0,BOSS.hp),max:BOSS.max,face:BOSS.face,act:BOSS.act,actAt:BOSS.actAt,line:BOSS.line,lineAt:BOSS.lineAt,
  waves:BOSS.waves.map(w=>[+w.x.toFixed(2),+w.y.toFixed(2)]),hps:Object.fromEntries([...BOSS.hpOf].map(([pid,h])=>[pid,Math.max(0,h)]))};
const push=()=>C.broadcastScene('retreat',{t:'mck',v:view()});
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'mck',v:view()}); });
const say=()=>{ BOSS.line=B.lines[Math.floor(Math.random()*B.lines.length)]; BOSS.lineAt=now(); };
function end(win){ const M=BOSS; if(!M) return; BOSS=null; bossCd=now()+B.cd*1000; C.broadcastScene('retreat',{t:'ev',k:'mckEnd',win,x:M.x,y:M.y});
  if(win){ const tot=[...M.dmg.values()].reduce((a,b)=>a+b,0)||1; for(const [pid,d] of M.dmg){ const pl=players.get(pid); if(!pl) continue; const k=d/tot, v=Math.round(B.prize*k);
      tries(pl).win=1; markDirty(pl); C.earn(pl,v); reward(pl,{exp:Math.round(B.exp*(.4+.6*k))},`Hạ boss MCK! Góp ${Math.round(k*100)}% sát thương · +${fmt(v)} (hôm nay hết lượt đấu MCK)`); P.stat(pl,'mck',1); } }
  push(); }
on('mck',(pl,m)=>{ const t=now();
  if(m.op==='call'){ if(BOSS) return {err:'MCK đang trên sân khấu rồi!'}; if(!canFight(pl)) return {err:noTry(pl)}; if(!near(pl,B.stage.x,B.stage.y+2,64)) return {err:'Lên sân khấu đấu trường MCK đã'};
    if(t<bossCd) return {err:`MCK đang nghỉ giữa giờ, ${Math.ceil((bossCd-t)/1000)} giây nữa thách đấu lại`};
    const n=Math.max(1,fighters().length); BOSS={x:B.stage.x,y:B.stage.y+2.2,hp:B.hp+B.hpPer*(n-1),max:B.hp+B.hpPer*(n-1),face:1,act:'',actAt:0,nextAtk:t+1800,nextWave:t+2500,waves:[],dmg:new Map(),hpOf:new Map(),seenAt:t,line:'',lineAt:0};
    say(); C.broadcastScene('retreat',{t:'ev',k:'mckCall',x:BOSS.x,y:BOSS.y,id:pl.pid,name:pl.prof.name}); push(); return {msg:'MCK lên sân khấu! Bấm J để đấm, né sóng âm tím'}; }
  if(m.op==='hit'){ const M=BOSS; if(!M||!inArena(pl)) return {}; if(!canFight(pl)) return {err:noTry(pl)}; if(t-(pl.mckAt||0)<B.punchCd||Math.hypot(pl.x/T-M.x,pl.y/T-M.y)>2.9) return {}; if((M.hpOf.get(pl.pid)??B.playerHp)<=0) return {};
    pl.mckAt=t; M.hp-=B.punch; M.dmg.set(pl.pid,(M.dmg.get(pl.pid)||0)+B.punch); C.broadcastScene('retreat',{t:'ev',k:'mckDmg',x:M.x,y:M.y,n:B.punch});
    if(Math.random()<.15) say(); if(M.hp<=0) end(true); else push(); return {hp:Math.max(0,M.hp)}; }
  return {err:'?'}; });
function hurt(pl,n){ const M=BOSS, h=(M.hpOf.get(pl.pid)??B.playerHp)-n; M.hpOf.set(pl.pid,h); C.broadcastScene('retreat',{t:'ev',k:'mckHit',x:pl.x/T,y:pl.y/T,n,id:pl.pid});
  if(h>0) return; const p=pl.prof; p.needs.energy=Math.max(0,p.needs.energy-B.loseEnergy); markDirty(pl); M.hpOf.delete(pl.pid);   // gục: đẩy ra cổng đấu trường, vào lại đánh tiếp với máu đầy
  pl.x=B.gate.x*T; pl.y=B.gate.y*T; pl.budget=0; send(pl,{t:'pos',x:pl.x,y:pl.y}); const r=tries(pl); r.lose++;
  note(pl,r.lose<2?`Bị MCK hạ đo ván! -${B.loseEnergy} năng lượng. Thua lượt 1, hôm nay còn 1 lượt: hồi sức rồi vào đấu trường đánh tiếp`:`Bị MCK hạ đo ván! -${B.loseEnergy} năng lượng. Thua 2 lượt rồi, hôm nay hết lượt đấu MCK`,'lock'); }
hook('tick',()=>{ const M=BOSS; if(!M) return; const t=now(), F=fighters();
  if(F.length) M.seenAt=t; else if(t-M.seenAt>B.idle*1000){ C.broadcastScene('retreat',{t:'ev',k:'mckLeave'}); BOSS=null; bossCd=t+30e3; push(); return; }
  let tg=null, td=1e9; for(const pl of F){ const d=Math.hypot(pl.x/T-M.x,pl.y/T-M.y); if(d<td){ td=d; tg=pl; } }
  if(tg){ const dx=tg.x/T-M.x, dy=tg.y/T-M.y, d=td||1; M.face=dx>=0?1:-1;
    if(d>2&&!(M.act==='wave'&&t-M.actAt<500)){ const st=Math.min(d-1.8,B.speed*.1); M.x+=dx/d*st; M.y+=dy/d*st; }
    M.x=Math.max(A0.x0+1,Math.min(A0.x1,M.x)); M.y=Math.max(A0.y0+2,Math.min(A0.y1,M.y));
    if(d<=2.4&&t>=M.nextAtk){ M.act='punch'; M.actAt=t; M.nextAtk=t+B.meleeCd; hurt(tg,B.melee); }
    else if(d>=3.5&&d<=12&&t>=M.nextWave){ M.act='wave'; M.actAt=t; M.nextWave=t+B.waveCd; if(Math.random()<.5) say(); M.waves.push({x:M.x+M.face*1.2,y:M.y-1.4,vx:dx/d*B.waveSpeed,vy:dy/d*B.waveSpeed,until:t+2200}); } }
  for(const w of M.waves){ w.x+=w.vx*.1; w.y+=w.vy*.1; for(const pl of F) if(w.until>t&&Math.hypot(pl.x/T-w.x,pl.y/T-1.2-w.y)<1.4){ w.until=0; hurt(pl,B.wave); } }
  M.waves=M.waves.filter(w=>w.until>t);
  if(t-pushAt>=100){ pushAt=t; push(); } });
