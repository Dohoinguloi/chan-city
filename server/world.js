// Di chuyển, gói vị trí 10 lần/giây, chat, tương tác giữa người chơi, nhu cầu (năng lượng/sạch sẽ/pin), đi Grab.
'use strict';
const C=require('./core');
const {S,T,on,hook,send,now,today,nearby,broadcastNear,moveTo,markDirty,note,reward,take,info,kindOf,sceneOf,players}=C;

/* ---------- vị trí ---------- */
const sizeOf=pl=>{ const k=kindOf(pl.scene); if(k==='room'||k==='stay'){ const r=k==='room'?S.ROOMS.tro:S.ROOMS[pl.stayType||'leu']; return r.size; } return S.SCENE_SIZE[k]||[80,112]; };
on('mv',(pl,m)=>{
  const x=+m.x, y=+m.y; if(!Number.isFinite(x)||!Number.isFinite(y)) return;
  const [W,H]=sizeOf(pl); if(x<0||y<0||x>W*T||y>H*T) return;
  const t=now(), el=Math.min(1,(t-pl.mvAt)/1000); pl.mvAt=t;
  const p=pl.prof, base=pl.kayak?95:pl.riding?S.RULES.run*S.HORSE.speed:pl.link?135:(p.skills.run?S.RULES.run:S.RULES.walk);
  const max=base*(pl.riding?1:C.speedMul(pl));
  pl.budget=Math.min(pl.budget+max*el*1.35,max*.9+60+(p.skills.dash?50:0));
  const d=Math.hypot(x-pl.x,y-pl.y);
  if(d>pl.budget+2){ send(pl,{t:'pos',x:pl.x,y:pl.y}); return; }                   // đi nhanh quá: kéo về chỗ cũ
  pl.budget-=d; pl.x=x; pl.y=y;
  pl.face=m.f<0?-1:1; pl.view=Math.max(0,Math.min(2,m.v|0)); pl.anim=Math.max(0,Math.min(2,m.a|0));
  if(d>6){ if(pl.fishing){ pl.fishing=null; pl.act=0; } if(pl.task&&!pl.task.walk){ pl.task=null; send(pl,{t:'task',cancel:true}); } }
});
// hành động skill / biểu cảm (có kiểm tra đã mở khoá)
const SKILL_ACT={noi:'noi',quay:'quay',gong:'gong',hokage:'hokage'};
on('act',(pl,m)=>{ const a=String(m.a||''); if(!SKILL_ACT[a]||!pl.prof.skills[a]) return;
  setAct(pl,a,S.ACT_DUR[a]); });
function setAct(pl,a,sec){ pl.act=S.ACTS.indexOf(a); pl.actUntil=sec?now()+sec*1000:0; }

/* ---------- gói vị trí ---------- */
function flags(pl){ const n=pl.prof.needs; return (pl.kayak?S.FL.kayak:0)|(pl.fishing?S.FL.fish:0)|(n.clean<20?S.FL.dirty:0)|(n.energy<20?S.FL.tired:0)|(pl.riding?S.FL.ride:0); }
function snapshot(){ const t=now();
  for(const pl of players.values()){ if(!pl.scene) continue; if(pl.actUntil&&t>pl.actUntil){ pl.act=0; pl.actUntil=0; } pl._e=[pl.pid,Math.round(pl.x),Math.round(pl.y),pl.face,pl.view,pl.anim,pl.act,flags(pl)]; pl._k=pl._e.join(','); }
  for(const pl of players.values()){ if(!pl.scene||!pl.ws||pl.ws.readyState!==1) continue;
    const vis=nearby(pl,S.RULES.viewRadius,false), u=[], seen=new Set();
    for(const q of vis){ seen.add(q.pid); const last=pl.sent.get(q.pid);
      if(last===undefined) send(pl,info(q)); if(last!==q._k){ u.push(q._e); pl.sent.set(q.pid,q._k); } }
    const g=[]; for(const id of pl.sent.keys()) if(!seen.has(id)){ g.push(id); pl.sent.delete(id); }
    if(u.length||g.length) send(pl,{t:'s',u,g}); } }
hook('tick',snapshot);

/* ---------- chat ---------- */
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,120);
on('chat',(pl,m)=>{ const msg=clean(m.m); if(!msg) return; const t=now(); if(t-pl.lastChat<700) return; pl.lastChat=t;
  broadcastNear(pl,{t:'chat',id:pl.pid,m:msg},360); });
// chat online: chỉ gửi được khi đang ở phòng riêng (laptop); nhận ở mọi nơi
const inOwnRoom=pl=>pl.scene==='room:'+pl.uid||pl.scene==='stay:'+pl.uid;
on('och',(pl,m)=>{ const msg=clean(m.m); if(!msg) return {err:'Tin trống'}; if(!inOwnRoom(pl)) return {err:'Chat online bằng laptop ở phòng của bạn'};
  const t=now(); if(t-pl.lastChat<700) return {err:'Gõ chậm thôi'}; pl.lastChat=t;
  const out={t:'och',from:pl.prof.name,fid:pl.pid,m:msg,at:t};
  if(m.to){ const q=players.get(m.to|0); if(!q) return {err:'Người đó đã offline'}; send(q,{...out,dm:true}); send(pl,{...out,dm:true,toName:q.prof.name}); return {}; }
  C.broadcastAll(out); return {}; });
on('who',pl=>({list:[...players.values()].map(q=>({id:q.pid,n:q.prof.name,lv:q.prof.level,where:S.DEST[S.SCENE_DEST[kindOf(q.scene)]]?.name||''}))}));
on('opt',(pl,m)=>{ if(typeof m.noSocial==='boolean'){ pl.prof.opts.noSocial=m.noSocial; markDirty(pl); } return {opts:pl.prof.opts}; });

/* ---------- tương tác người chơi (cần người kia đồng ý) ---------- */
const invites=new Map(); let invSeq=1;
const busy=pl=>pl.soc||pl.table||pl.kayak||pl.riding||pl.race;
on('soc',(pl,m)=>{
  const t=now();
  if(m.op==='ask'){ const q=players.get(m.to|0), kind=S.SOCIAL[m.kind]?m.kind:null;
    if(!q||!kind||q===pl||q.scene!==pl.scene||Math.hypot(q.x-pl.x,q.y-pl.y)>64) return {err:'Đứng gần người đó hơn'};
    if(busy(pl)) return {err:'Bạn đang bận'}; if(busy(q)) return {err:q.prof.name+' đang bận'};
    if(q.prof.opts.noSocial) return {err:q.prof.name+' đang tắt nhận lời mời'};
    if(t-(pl.lastAsk||0)<3000) return {err:'Đợi chút rồi mời tiếp'}; pl.lastAsk=t;
    const id=invSeq++; invites.set(id,{id,a:pl,b:q,kind,exp:t+15000});
    send(q,{t:'socAsk',inv:id,from:pl.pid,name:pl.prof.name,kind}); return {sent:true}; }
  if(m.op==='answer'){ const inv=invites.get(m.inv|0); if(!inv||inv.b!==pl) return {err:'Lời mời đã hết hạn'}; invites.delete(inv.id);
    const {a,b,kind}=inv; if(!m.yes){ note(a,`${b.prof.name} đã từ chối`); return {}; }
    if(!players.has(a.pid)||a.scene!==b.scene||Math.hypot(a.x-b.x,a.y-b.y)>90||busy(a)||busy(b)) return {err:'Không còn ở gần nhau'};
    startSoc(a,b,kind); return {}; }
  if(m.op==='end'){ if(pl.soc) endSoc(pl.soc,pl.soc.kind==='namtay'?null:'quit',pl); return {}; }
  const s=pl.soc; if(!s) return;
  const me=s.a===pl?'a':'b', op=me==='a'?s.b:s.a;
  if(m.op==='mash'&&s.kind==='vattay'){ if(t-(pl.lastMash||0)<60) return; pl.lastMash=t; s.score[me]++; return; }
  if(m.op==='hit'&&s.kind==='danhnhau'){ if(t-(pl.lastHit||0)<450) return; pl.lastHit=t; setAct(pl,'attack',.35);
    if(Math.hypot(op.x-pl.x,op.y-pl.y)>40) return; const dmg=8+Math.floor(Math.random()*7); s.hp[me==='a'?'b':'a']-=dmg; setAct(op,'hurt',.4);
    broadcastNear(pl,{t:'ev',k:'hit',from:pl.pid,to:op.pid,dmg,hp:s.hp},400);
    if(s.hp.a<=0||s.hp.b<=0) endSoc(s,me); }
});
function startSoc(a,b,kind){ const s={kind,a,b,start:now()}; a.soc=s; b.soc=s;
  if(kind==='vattay') s.score={a:0,b:0};
  if(kind==='danhnhau') s.hp={a:S.SOCIAL.danhnhau.hp,b:S.SOCIAL.danhnhau.hp};
  if(kind==='namtay'){ b.link=a; }
  if(kind==='hon'){ setAct(a,'kiss',2.6); setAct(b,'kiss',2.6); }
  broadcastNear(a,{t:'soc',k:'start',kind,a:a.pid,b:b.pid},420); }
// winner: 'a' | 'b' | null (hoà / kết thúc êm); quit: người bỏ cuộc
function endSoc(s,winner,quitter){ const {a,b,kind}=s; if(a.soc!==s&&b.soc!==s) return; a.soc=null; b.soc=null; if(b.link===a) b.link=null;
  if(winner==='quit') winner=quitter===a?'b':'a';
  const w=winner==='a'?a:winner==='b'?b:null, l=w?(w===a?b:a):null, def=S.SOCIAL[kind];
  if(w&&def.winExp&&w.prof.daily.gameExp<S.RULES.gameExpCap){ reward(w,{exp:def.winExp,kind:'game'},`Thắng ${def.name.toLowerCase()} với ${l.prof.name}`); }
  if(l&&kind==='danhnhau') setAct(l,'ko',3);
  broadcastNear(a,{t:'soc',k:'end',kind,a:a.pid,b:b.pid,win:w?w.pid:0,score:s.score,hp:s.hp},420); }
hook('tick',()=>{ const t=now();
  for(const [id,inv] of invites) if(t>inv.exp) invites.delete(id);
  const done=new Set();
  for(const pl of players.values()){ const s=pl.soc; if(!s||done.has(s)) continue; done.add(s); const def=S.SOCIAL[s.kind], el=(t-s.start)/1000, d=Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y);
    if(s.a.scene!==s.b.scene||!players.has(s.a.pid)||!players.has(s.b.pid)){ endSoc(s,null); continue; }
    if(s.kind==='namtay'){ if(d>160) endSoc(s,null); continue; }
    if(s.kind==='hon'){ if(el>def.dur) endSoc(s,null); continue; }
    if(s.kind==='vattay'){ if(Math.floor(el*5)!==s.lastP){ s.lastP=Math.floor(el*5); broadcastNear(s.a,{t:'soc',k:'prog',a:s.a.pid,b:s.b.pid,score:s.score,left:Math.max(0,def.dur-el)},420); }
      if(el>def.dur) endSoc(s,s.score.a>s.score.b?'a':s.score.b>s.score.a?'b':null); continue; }
    if(s.kind==='danhnhau'){ if(d>200) endSoc(s,s.hp.a>=s.hp.b?'a':'b');                  // chạy khỏi trận: người còn nhiều máu hơn thắng
      else if(el>def.dur) endSoc(s,s.hp.a>s.hp.b?'a':s.hp.b>s.hp.a?'b':null); } } });
hook('leave',pl=>{ if(pl.soc) endSoc(pl.soc,null); });

/* ---------- nhu cầu ---------- */
// có chỗ ngủ đêm nay: phòng đã trả tiền hôm nay, hoặc được ai cho ngủ nhờ
const hasBed=pl=>{ const p=pl.prof, d=today(); return (p.stay&&p.stay.paid===d)||(p.sleep&&p.sleep.day===d); };
let lastNeeds=now();
hook('slow',()=>{ const t=now(), dt=(t-lastNeeds)/1000; lastNeeds=t; const h=S.vnTime().hf, night=h>=22||h<6;
  for(const pl of players.values()){ const n=pl.prof.needs, k=kindOf(pl.scene), out=night&&(k==='retreat'||k==='dalat')&&!hasBed(pl);
    const before=[n.energy|0,n.clean|0,n.battery|0];
    n.energy=Math.max(0,n.energy-dt/S.NEEDS.energy.decay*(out?2:1)*(pl.riding?.5:1));
    n.clean=Math.max(0,n.clean-dt/S.NEEDS.clean.decay*(pl.soc&&pl.soc.kind==='danhnhau'?3:1));
    if(!(pl.task&&pl.task.act==='sac')) n.battery=Math.max(0,n.battery-dt/S.NEEDS.battery.decay);
    if(before.join()!==[n.energy|0,n.clean|0,n.battery|0].join()){ send(pl,{t:'nd',n:{energy:+n.energy.toFixed(1),clean:+n.clean.toFixed(1),battery:+n.battery.toFixed(1)}}); markDirty(pl); } } });

/* ---------- Grab ---------- */
function destSpawn(pl,to){ if(to==='home') return ['room:'+pl.uid,S.ROOMS.tro.spawn];
  if(to==='everfit') return ['everfit',S.OFFICE.spawn]; if(to==='dalat') return ['dalat',S.DALAT.spawn]; return ['retreat',S.SPAWN.retreat]; }
on('grab',(pl,m)=>{ const to=String(m.to||''), from=S.SCENE_DEST[kindOf(pl.scene)], p=pl.prof;
  if(!S.DEST[to]) return {err:'Không có điểm đến này'}; if(destSpawn(pl,to)[0]===pl.scene) return {err:'Bạn đang ở đây rồi'};
  if(pl.race) return {err:'Đang đua ngựa'};
  if(p.needs.battery<S.GRAB.minBattery) return {err:'Điện thoại hết pin, không gọi được Grab. Về phòng sạc đã.'};
  if(to==='retreat'&&!p.flags.called) return {err:'Chưa có kèo đi Ké Retreat. Đợi Pháp gọi đã.'};
  let fare=S.grabFare(from,to), free=false;
  if(to==='retreat'&&!p.flags.freeRide){ fare=0; free=true; }
  if(fare&&!take(pl,fare)) return {err:`Chuyến này ${S.fmt(fare)}, trong ví còn ${S.fmt(p.money)}`};
  if(free) p.flags.freeRide=true; if(to==='retreat') p.flags.arrived=true;
  p.needs.battery=Math.max(0,p.needs.battery-2);
  const [id,sp]=destSpawn(pl,to); moveTo(pl,id,sp.x,sp.y,{ride:{from,to,fare,free}}); return {fare,free}; });

module.exports={setAct,hasBed,inOwnRoom,clean,destSpawn,endSoc};
