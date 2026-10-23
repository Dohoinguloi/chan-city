// Di chuyển, gói vị trí 10 lần/giây, chat, tương tác giữa người chơi, nhu cầu (năng lượng/sạch sẽ/pin), đi Grab.
'use strict';
const C=require('./core');
const {S,T,on,hook,send,now,today,nearby,broadcastNear,moveTo,markDirty,note,reward,take,info,kindOf,sceneOf,players}=C;

/* ---------- vị trí ---------- */
const sizeOf=pl=>{ const k=kindOf(pl.scene); if(k==='room'&&pl.roomWH) return pl.roomWH;   /* nhà riêng đã mở rộng (home.js) */
  if(k==='room'||k==='stay'){ const r=k==='room'?S.ROOMS.tro:S.ROOMS[pl.stayType||'leu']; return r.size; } return S.SCENE_SIZE[k]||[80,112]; };
on('mv',(pl,m)=>{
  const x=+m.x, y=+m.y; if(!Number.isFinite(x)||!Number.isFinite(y)) return; if(pl.incar) return;   /* ngồi ghế phụ: vị trí do xe quyết định */
  if(pl.csgt||pl.freeze){ if(Math.hypot(x-pl.x,y-pl.y)>2) send(pl,{t:'pos',x:pl.x,y:pl.y}); return; }   /* đang bị CSGT giữ lại kiểm tra / đứng ô của mình trên sân pickleball */
  const [W,H]=sizeOf(pl); if(x<0||y<0||x>W*T||y>H*T) return;
  const t=now(), el=Math.min(1,(t-pl.mvAt)/1000); pl.mvAt=t;
  const p=pl.prof, base=pl.kayak?95:pl.riding?S.RULES.run*S.HORSE.speed*((S.mythOf(p.look&&p.look.mount,p)||{}).speed||1):pl.optimus==='truck'?S.RULES.run*S.OPTIMUS.truck:pl.optimus==='robot'?S.RULES.run*S.OPTIMUS.robot:pl.pcar?S.RULES.run*S.PCAR.speed:pl.moto?S.RULES.run*S.MOTO.models[pl.moto].speed:pl.link?135:(p.skills.run?S.RULES.run:S.RULES.walk);
  const mc=(pl.scene==='mu'||pl.scene==='muw'||String(pl.scene).startsWith('dday:'))&&p.mu&&S.MU.cls[p.mu.cls], max=base*(pl.riding||pl.moto||pl.pcar||pl.optimus?1:C.speedMul(pl)*(pl.kayak?1:S.shoeSpeed(p)))*(pl.moto&&pl.speeding?S.CSGT.speed.mul:1)*((mc&&mc.move)||1);   /* MU: Tiên Nữ chạy nhanh ×2 */
  pl.budget=Math.min(pl.budget+max*el*1.35,max*.9+60+(p.skills.dash?50:0));
  const d=Math.hypot(x-pl.x,y-pl.y);
  if(d>pl.budget+2){ send(pl,{t:'pos',x:pl.x,y:pl.y}); return; }                   // đi nhanh quá: kéo về chỗ cũ
  pl.budget-=d; pl.x=x; pl.y=y;
  if(pl.kayak&&d>0) treasureRoll(pl,d);
  if(pl.pcar&&pl.carPass) pl.carPass.forEach((q,k)=>{ if(q.incar){ q.x=pl.x+(k-1)*4; q.y=pl.y-1; q.budget=0; send(q,{t:'pos',x:q.x,y:q.y}); } });
  pl.face=m.f<0?-1:1; pl.view=Math.max(0,Math.min(2,m.v|0)); pl.anim=Math.max(0,Math.min(2,m.a|0));
  if(d>6){ if(pl.fishing){ pl.fishing=null; pl.act=0; } if(pl.task&&!pl.task.walk){ pl.task=null; send(pl,{t:'task',cancel:true}); } }
});
// hành động skill / biểu cảm (có kiểm tra đã mở khoá)
const SKILL_ACT={noi:'noi',quay:'quay',gong:'gong',hokage:'hokage'};
on('act',(pl,m)=>{ const a=String(m.a||''); if(a==='wheelie'){ if(pl.moto) setAct(pl,'wheelie',1.2); return; } if(!SKILL_ACT[a]||!pl.prof.skills[a]) return;
  setAct(pl,a,S.ACT_DUR[a]); });
function setAct(pl,a,sec){ pl.act=S.ACTS.indexOf(a); pl.actUntil=sec?now()+sec*1000:0; }

// chèo kayak có thể vớt được báu vật trên sông
function treasureRoll(pl,d){ const TR=S.TREASURE, p=pl.prof; pl.paddled=(pl.paddled||0)+d; if(pl.paddled<TR.every) return; pl.paddled=0;
  if((p.daily.treasure||0)>=TR.daily||Math.random()>TR.chance) return;
  const tot=Object.values(TR.items).reduce((a,x)=>a+x.w,0); let r=Math.random()*tot, k=null; for(const [id,x] of Object.entries(TR.items)){ r-=x.w; if(r<=0){ k=id; break; } } k=k||'dong_xu_co';
  const n=p.daily.treasure=(p.daily.treasure||0)+1; reward(pl,{item:k,exp:k==='ruong_bau'?60:k==='ngoc_trai'?30:12},`Vớt được đồ cổ: ${TR.items[k].name}! (${n}/${TR.daily} hôm nay · bán cho cô Ké ${S.fmt(TR.items[k].price)})`); send(pl,{t:'ev',k:'treasure',item:k,x:pl.x,y:pl.y}); C.track(pl,'treasure');
  if(Math.random()<.25){ C.addItem(pl,'ngoc_ch',1); note(pl,'🔮 Vớt được Ngọc Cường Hoá dưới hồ!','item'); }   /* hồ Ké: 1/4 lần vớt đồ cổ kèm ngọc cường hoá */
  if(n>=TR.daily) C.note(pl,`Hôm nay mò đủ ${TR.daily} món đồ cổ rồi, mai chèo tiếp nhé`,'quest'); }

/* ---------- gói vị trí ---------- */
function flags(pl){ const n=pl.prof.needs; return (pl.riding?((pl.prof.horseCoat||0)&3)*S.FL.coat:0)|(pl.riding?S.mythIdx(pl.prof)*S.FL.mount:0)|(pl.kayak?S.FL.kayak:0)|(pl.fishing?S.FL.fish:0)|(n.clean<20?S.FL.dirty:0)|(n.energy<20?S.FL.tired:0)|(pl.riding?S.FL.ride:0)|(pl.moto?S.FL.moto:0)|(pl.moto&&pl.prof.helmet?S.FL.helmet:0)|(pl.moto==='xedap'?S.FL.bike:0)|(pl.optimus==='robot'?S.FL.optimus:0)|(pl.optimus==='truck'?S.FL.otruck:0)|(pl.pcar?S.FL.car:0)|(pl.incar?S.FL.incar:0)|(pl.prof.drunk>Date.now()?S.FL.drunk:0); }
let tickNo=0;
function snapshot(){ const t=now(), odd=++tickNo%2;
  for(const pl of players.values()){ if(!pl.scene) continue; if(pl.actUntil&&t>pl.actUntil){ pl.act=0; pl.actUntil=0; } pl._e=[pl.pid,Math.round(pl.x),Math.round(pl.y),pl.face,pl.view,pl.anim,pl.act,flags(pl)]; pl._k=pl._e.join(','); }
  for(const pl of players.values()){ if(!pl.scene||!pl.ws||pl.ws.readyState!==1) continue;
    const vis=nearby(pl,S.RULES.viewRadius,false), u=[], seen=new Set();
    for(const q of vis){ seen.add(q.pid); const last=pl.sent.get(q.pid);
      if(last===undefined) send(pl,info(q)); else if(odd&&last!==q._k&&Math.hypot(q.x-pl.x,q.y-pl.y)>300) continue;   // người ở xa: 5 lần/giây
      if(last!==q._k){ u.push(q._e); pl.sent.set(q.pid,q._k); } }
    const g=[]; for(const id of pl.sent.keys()) if(!seen.has(id)){ g.push(id); pl.sent.delete(id); }
    if(u.length||g.length) send(pl,{t:'s',u,g}); } }
hook('tick',snapshot);

/* ---------- chat ---------- */
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,120);
// kênh chat tổng (trên thanh đồ): tin tới cả server, giữ 40 tin gần nhất gửi cho người mới vào
const WCHAT=[];
on('wchat',(pl,m)=>{ const msg=clean(m.m); if(!msg) return {}; const t=now(); if(t-(pl.lastW||0)<2000) return {err:'Chat chậm thôi, 2 giây 1 tin'}; pl.lastW=t;
  const e={n:pl.prof.name,lv:pl.prof.level,m:msg,at:t}; WCHAT.push(e); if(WCHAT.length>40) WCHAT.shift(); C.broadcastAll({t:'wchat',...e}); broadcastNear(pl,{t:'chat',id:pl.pid,m:msg,w:1},360); return {}; });   // kèm bong bóng trên đầu cho người ở gần
hook('login',pl=>setTimeout(()=>{ if(pl.prof) send(pl,{t:'wchatlog',list:WCHAT}); },900));
// tin hệ thống trên kênh tổng (thông báo bản cập nhật...): quiet thì chỉ nằm trong lịch sử kênh cho người vào sau, không gửi ngay
const sysChat=(m,quiet)=>{ const e={n:'📢 Chan City',sys:1,m,at:now()}; WCHAT.push(e); if(WCHAT.length>40) WCHAT.shift(); if(!quiet) C.broadcastAll({t:'wchat',...e}); };
on('chat',(pl,m)=>{ const msg=clean(m.m); if(!msg) return; const t=now(); if(t-pl.lastChat<700) return; pl.lastChat=t;
  broadcastNear(pl,{t:'chat',id:pl.pid,m:msg},360); });
// chat online: chỉ gửi được khi đang ở phòng riêng (laptop); nhận ở mọi nơi
const inOwnRoom=pl=>pl.scene==='room:'+pl.uid||pl.scene==='stay:'+pl.uid;
on('och',(pl,m)=>{ const msg=clean(m.m); if(!msg) return {err:'Tin trống'}; if(!inOwnRoom(pl)) return {err:'Chat online bằng laptop ở phòng của bạn'};
  const t=now(); if(t-pl.lastChat<700) return {err:'Gõ chậm thôi'}; pl.lastChat=t;
  const out={t:'och',from:pl.prof.name,fid:pl.pid,m:msg,at:t};
  if(m.to){ const q=players.get(m.to|0); if(!q) return {err:'Người đó đã offline'}; send(q,{...out,dm:true}); send(pl,{...out,dm:true,toName:q.prof.name}); return {}; }
  C.broadcastAll(out); return {}; });
// số người đang online: gửi cho mọi người mỗi khi đổi (HUD góc trên), người mới vào map cũng nhận
let lastOnline=-1; hook('slow',()=>{ const n=players.size; if(n===lastOnline) return; lastOnline=n; C.broadcastAll({t:'online',n}); });
hook('enter',pl=>send(pl,{t:'online',n:players.size}));
on('who',pl=>({list:[...players.values()].map(q=>({id:q.pid,n:q.prof.name,lv:q.prof.level,sim:q.prof.sim?q.prof.sim.num:'',where:S.DEST[S.SCENE_DEST[kindOf(q.scene)]]?.name||''}))}));
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
  for(const pl of players.values()){ if(!pl.scene) continue; const n=pl.prof.needs, k=kindOf(pl.scene), out=night&&(k==='retreat'||k==='dalat')&&!hasBed(pl);
    const before=[n.energy|0,n.clean|0,n.battery|0];
    n.energy=Math.max(0,n.energy-dt/S.NEEDS.energy.decay*(out?2:1)*(pl.riding?.5:1));
    n.clean=Math.max(0,n.clean-dt/S.NEEDS.clean.decay*(pl.soc&&pl.soc.kind==='danhnhau'?3:1));
    if(!(pl.task&&pl.task.act==='sac')) n.battery=Math.max(0,n.battery-dt/S.NEEDS.battery.decay*(pl.prof.data&&pl.prof.data.until>now()?S.VNPT.packMul:1)*(1-(C.simPerk(pl.prof).battery||0)));   // gói data VNPT: pin hao chậm hơn
    if(before.join()!==[n.energy|0,n.clean|0,n.battery|0].join()){ send(pl,{t:'nd',n:{energy:+n.energy.toFixed(1),clean:+n.clean.toFixed(1),battery:+n.battery.toFixed(1)}}); markDirty(pl); } } });

/* ---------- Grab ---------- */
function destSpawn(pl,to){ if(to==='home') return ['room:'+pl.uid,S.ROOMS.tro.spawn];
  if(to==='mu') return ['mu',S.MU.spawn];
  if(to==='lavi') return ['lavi',S.LAVI.spawn];
  if(to==='nghienmotion') return ['nghienmotion',S.NMOTION.spawn];
  if(to==='bearplus') return ['bearplus',S.BEARPLUS.spawn]; if(to==='vnpt') return ['vnpt',S.VNPT.spawn]; if(to==='mieu') return ['mieu',S.MIEU.spawn];
  if(to==='everfit') return ['everfit',S.OFFICE.spawn]; if(to==='dalat') return ['dalat',S.DALAT.spawn]; if(to==='das') return ['das',S.DAS.spawn]; if(to==='lumen') return ['lumen',S.LUMEN.spawn]; if(to==='yenlang') return ['yenlang',S.YENLANG.spawn]; if(to==='pickle') return ['pickle',S.PICKLE.spawn]; if(to==='epl') return ['epl',S.EPL.spawn]; if(to==='diep') return ['diep',S.DIEP.spawn]; return ['retreat',S.SPAWN.retreat]; }
// điều kiện vào các map có khoá (đi Grab, hay nghe điện thoại rồi Grab tới chỗ người gọi): trả về câu báo lỗi, hoặc '' nếu được vào
function entryErr(p,to){
  if(to==='diep'){ const why=require('./diep').canVisit(p); if(why) return why; }   // Diệp chỉ tiếp người cấp cao, nhiều tiền
  if(to==='das'&&p.level<S.DAS.level) return `DAS nhận học viên từ cấp ${S.DAS.level}, lên cấp rồi hãy bay vào`;
  if(to==='bearplus'&&p.level<S.BEARPLUS.level) return `Bearplus nhận cộng tác viên từ cấp ${S.BEARPLUS.level}. Lên cấp rồi bay vào nhé`;
  if(to==='retreat'&&!p.flags.called) return 'Chưa có kèo đi Ké Retreat. Đợi Pháp gọi đã.';
  return ''; }
on('grab',(pl,m)=>{ const to=String(m.to||''), from=S.SCENE_DEST[kindOf(pl.scene)], p=pl.prof;
  if(!S.DEST[to]) return {err:'Không có điểm đến này'}; if(destSpawn(pl,to)[0]===pl.scene) return {err:'Bạn đang ở đây rồi'};
  { const why=entryErr(p,to); if(why&&to!=='retreat') return {err:why}; }
  if(pl.race) return {err:'Đang đua ngựa'}; if(pl.stunt) return {err:'Đang đua xe'};
  if(p.jail&&p.jail.until>now()) return {err:'Đang bị tạm giữ ở đồn công an'};
  if(to==='retreat'&&!p.flags.called) return {err:'Chưa có kèo đi Ké Retreat. Đợi Pháp gọi đã.'};
  if(m.xt){ if(!(p.xt&&p.xt.lv>=S.XICHTHO.tele)) return {err:`Xích Thố cấp ${S.XICHTHO.tele} mới dịch chuyển được`};   /* Xích Thố cấp 15: tới mọi map ngay, không tốn tiền / pin */
    if(to==='retreat') p.flags.arrived=true; const [id,sp]=destSpawn(pl,to); moveTo(pl,id,sp.x,sp.y,{xtp:p.xt.el||'-'}); C.track(pl,'grab'); return {fare:0,xt:1}; }
  if(p.needs.battery<S.GRAB.minBattery) return {err:'Điện thoại hết pin, không gọi được Grab. Bấm 🔌 Xin sạc nhờ để cắm sạc nhờ người gần đó'};
  let fare=Math.round(S.grabFare(from,to)*(1-(C.simPerk(p).grab||0))), free=false;   // SIM Lặp kép: Grab rẻ hơn
  if(to==='retreat'&&!p.flags.freeRide){ fare=0; free=true; }
  if(fare&&!take(pl,fare)) return {err:`Chuyến này ${S.fmt(fare)}, trong ví còn ${S.fmt(p.money)}`};
  if(free) p.flags.freeRide=true; if(to==='retreat') p.flags.arrived=true;
  p.needs.battery=Math.max(0,p.needs.battery-2);
  const [id,sp]=destSpawn(pl,to); moveTo(pl,id,sp.x,sp.y,{ride:{from,to,fare,free}}); C.track(pl,'grab'); return {fare,free}; });

module.exports={entryErr,setAct,hasBed,inOwnRoom,clean,destSpawn,endSoc,sysChat};
