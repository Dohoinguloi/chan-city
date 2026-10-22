// MU Online · Lục Địa Cát: chọn class ở Vệ binh (free giáp + vũ khí, đổi class sau tốn tiền), chiêu 1/2/3 theo thời gian thực (server tính tầm, mana,
// hồi chiêu, sát thương), thách đấu 1 vs 1, Quỷ Vương Bóng Đêm xuất hiện mỗi 20 phút cho cả server cùng đánh: ai gây sát thương đều có thưởng.
// Máu / mana trong trận không lưu (pl.mus); class, cấp, EXP MU, thắng / thua lưu ở p.mu.
'use strict';
const C=require('./core'), P=require('./places');
const {S,T,on,now,markDirty,send,note,addItem,take,give,reward,players}=C;
const M=S.MU, fmt=S.fmt, B=M.boss;
const rec=p=>p.mu=p.mu||{cls:'',lv:1,exp:0,w:0,l:0,boss:0};
const inMu=pl=>pl.scene==='mu'&&pl.prof;
function st(pl){ const r=rec(pl.prof); if(!r.cls) return null; const s=S.muStats(r.cls,r.lv); if(!pl.mus) pl.mus={hp:s.hp,mp:s.mp,cd:{},buff:{},dead:0};
  const m=pl.mus; m.max=s.hp; m.mmax=s.mp; m.atk=s.atk; m.def=s.def*((m.buff.def||0)>now()?2:1); m.hp=Math.min(m.hp,m.max); m.mp=Math.min(m.mp,m.mmax); return m; }
function view(pl){ const r=rec(pl.prof), m=st(pl); if(!m) return {cls:''}; const t=now();
  return {cls:r.cls,lv:r.lv,exp:r.exp,next:M.lvExp(r.lv),hp:Math.round(m.hp),max:m.max,mp:Math.round(m.mp),mmax:m.mmax,cd:Object.fromEntries(Object.entries(m.cd).map(([k,v])=>[k,Math.max(0,v-t)])),
    buff:(m.buff.def||0)>t?m.buff.def-t:0,dead:m.dead>t?m.dead-t:0,duel:pl.muDuel?pl.muDuel.other:0,w:r.w,l:r.l}; }
const push=pl=>send(pl,{t:'mume',v:view(pl)});
const bcast=obj=>{ for(const q of C.sceneOf('mu')) send(q,obj); };
const dist=(pl,x,y)=>Math.hypot(pl.x/T-x,pl.y/T-y);
function gainMu(pl,n){ const r=rec(pl.prof); r.exp+=n; let up=0; while(r.lv<M.maxLv&&r.exp>=M.lvExp(r.lv)){ r.exp-=M.lvExp(r.lv); r.lv++; up++; } if(up){ const m=st(pl); if(m){ m.hp=m.max; m.mp=m.mmax; } note(pl,`⬆ MU lên cấp ${r.lv}! Máu, công, thủ tăng`,'quest'); } markDirty(pl); }
// gục: 8 giây sau hồi sinh ở cổng thành
function down(pl,why){ const m=pl.mus; if(!m||m.dead>now()) return; m.hp=0; m.dead=now()+M.respawn*1000; bcast({t:'mufx',k:'down',to:pl.pid}); note(pl,`💀 ${why}. Hồi sinh ở cổng thành sau ${M.respawn} giây`,'lock'); if(pl.muDuel) duelEnd(players.get(pl.muDuel.other),pl); push(pl); }

/* ---------- Quỷ Vương Bóng Đêm ---------- */
let BOSS=null, NEXT=Math.ceil(now()/B.every)*B.every;
const bossView=()=>BOSS?{on:1,hp:Math.round(BOSS.hp),max:BOSS.max,x:BOSS.x,y:BOSS.y,tele:BOSS.tele,name:B.name,until:BOSS.until}:{on:0,next:NEXT,name:B.name};
function bossSpawn(){ const n=[...C.sceneOf('mu')].filter(q=>rec(q.prof).cls).length, max=B.hp+B.perPlayer*Math.max(0,n-1);
  BOSS={hp:max,max,x:M.altar.x,y:M.altar.y,until:now()+B.life,dmg:new Map(),hitAt:now()+3000,aoeAt:now()+8000,tele:null};
  C.broadcastAll({t:'note',msg:`👹 ${B.name} vừa xuất hiện ở MU Online! Gọi Grab "vào game" đánh boss tổng, ai gây sát thương đều có thưởng`,kind:'quest'}); bcast({t:'muboss',v:bossView()}); }
function bossDie(killer){ const b=BOSS; BOSS=null; NEXT=Math.ceil((now()+1)/B.every)*B.every; const R=B.reward, total=[...b.dmg.values()].reduce((a,v)=>a+v,0)||1;
  const top=[...b.dmg.entries()].sort((a,c)=>c[1]-a[1]); const lines=[];
  top.forEach(([uid,d],rank)=>{ const pl=C.byUid.get(uid); if(!pl||!pl.prof) return; const sh=d/total, items={}; if(rank===0||Math.random()<R.jewel){ const j=B.jewels[Math.floor(Math.random()*B.jewels.length)]; items[j]=1; }
    reward(pl,{exp:R.exp+Math.round(300*sh),vnd:R.vnd+Math.round(600000*sh),items},`Hạ ${B.name}: góp ${Math.round(sh*100)}% sát thương${rank===0?' (top 1!)':''}`); gainMu(pl,R.mu+Math.round(200*sh)); rec(pl.prof).boss++; if(rank<3) lines.push(`${rank+1}. ${pl.prof.name} ${Math.round(sh*100)}%`); });
  C.broadcastAll({t:'note',msg:`🏆 ${B.name} đã bị hạ${killer?` bởi ${killer.prof.name}`:''}! ${lines.join(' · ')}`,kind:'quest'}); bcast({t:'muboss',v:bossView()}); bcast({t:'mufx',k:'bossdie'}); }
function bossTick(){ const t=now(); if(!BOSS){ if(t>=NEXT) bossSpawn(); return; } const b=BOSS;
  if(t>=b.until){ BOSS=null; NEXT=Math.ceil((t+1)/B.every)*B.every; bcast({t:'note',msg:`${B.name} bỏ đi, lần sau đông người hơn nhé!`,kind:'lock'}); bcast({t:'muboss',v:bossView()}); return; }
  const alive=[...C.sceneOf('mu')].filter(q=>q.mus&&q.mus.dead<=t&&rec(q.prof).cls);
  if(t>=b.hitAt){ b.hitAt=t+B.hit.every*1000; const tg=alive.map(q=>[q,dist(q,b.x,b.y)]).filter(a=>a[1]<=B.hit.range).sort((a,c)=>a[1]-c[1])[0];
    if(tg){ const q=tg[0], m=st(q), d=Math.max(1,Math.round(B.hit.dmg*(.85+Math.random()*.3)-m.def*.5)); m.hp-=d; bcast({t:'mufx',k:'bosshit',to:q.pid,dmg:d}); if(m.hp<=0) down(q,`Bị ${B.name} đánh gục`); else push(q); } }
  if(!b.tele&&t>=b.aoeAt){ const tg=alive.filter(q=>dist(q,b.x,b.y)<12)[Math.floor(Math.random()*alive.length)]; b.aoeAt=t+B.aoe.every*1000; if(tg){ b.tele={x:tg.x/T,y:tg.y/T,r:B.aoe.r,at:t+B.aoe.warn*1000}; bcast({t:'muboss',v:bossView()}); } }
  if(b.tele&&t>=b.tele.at){ const z=b.tele; b.tele=null; for(const q of alive) if(dist(q,z.x,z.y)<=z.r){ const m=st(q), d=Math.max(1,Math.round(B.aoe.dmg*(.9+Math.random()*.2)-m.def*.5)); m.hp-=d; bcast({t:'mufx',k:'aoehit',to:q.pid,dmg:d}); if(m.hp<=0) down(q,'Dính chưởng Bóng Đêm'); else push(q); }
    bcast({t:'mufx',k:'aoe',x:z.x,y:z.y,r:z.r}); bcast({t:'muboss',v:bossView()}); } }
/* ---------- thách đấu ---------- */
function duelEnd(win,lose){ const a=win||null, b=lose||null; for(const q of [a,b]) if(q){ q.muDuel=null; push(q); }
  if(a&&b&&a.prof&&b.prof){ const ra=rec(a.prof), rb=rec(b.prof); ra.w++; rb.l++; gainMu(a,M.duel.mu); C.gainExp(a,M.duel.exp); const lb=b.mus; if(lb&&lb.hp<=0){ lb.hp=1; lb.dead=0; }
    for(const q of C.sceneOf('mu')) note(q,`⚔ ${a.prof.name} thắng ${b.prof.name} trong trận thách đấu!`,'quest'); markDirty(a); markDirty(b); } }
/* ---------- thao tác ---------- */
on('mu',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now(); if(!inMu(pl)) return {err:'Vào thế giới MU Online trước (gọi Grab)'};
  if(op==='view') return {me:view(pl),boss:bossView()};
  if(op==='dbgboss'&&process.env.CHAN_TEST==='1'){ if(!BOSS) bossSpawn(); return {boss:bossView()}; }   // chỉ server test: gọi boss ra ngay
  if(op==='class'){ const k=String(m.cls||''), c=M.cls[k]; if(!c) return {err:'?'}; if(!P.nearNpc(pl,'mu_guard')) return {err:'Gặp Vệ binh ở cổng thành'}; if(r.cls===k) return {err:'Bạn đang là '+c.name+' rồi'};
    if(r.cls&&!take(pl,300000)) return {err:'Đổi class tốn 300.000đ, không đủ tiền'}; r.cls=k; p.owned[c.set]=1; if(p.look&&p.look.outfit) p.look.outfit.top=c.set; pl.mus=null; st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:`Bạn trở thành ${c.name}! Đã nhận và mặc ${S.CLOTHES[c.set].name}. Phím 1 / 2 / 3 để ra chiêu`,look:p.look}; }
  if(op==='heal'){ if(!P.nearNpc(pl,'mu_mage')) return {err:'Gặp Pháp sư Cát'}; const s=st(pl); if(!s) return {err:'Chọn class ở Vệ binh trước'}; if(pl.muDuel) return {err:'Đang thách đấu'}; s.hp=s.max; s.mp=s.mmax; push(pl); return {msg:'Pháp sư Cát: "Máu với mana đầy rồi, ra trận đi!"'}; }
  if(op==='sell'){ if(!P.nearNpc(pl,'mu_mage')) return {err:'Gặp Pháp sư Cát'}; const k=String(m.k||''), price={ngoc_uoc:150000,ngoc_tam_linh:200000,ngoc_hon_nguyen:400000}[k]; if(!price||!C.has(pl,k)) return {err:'Không có ngọc này'};
    addItem(pl,k,-1); give(pl,price); markDirty(pl); return {msg:`Bán ${S.ITEMS[k].name} được ${fmt(price)}`}; }
  const s=st(pl); if(!s) return {err:'Gặp Vệ binh ở cổng thành chọn class trước'};
  if(op==='duel'){ const q=players.get(m.pid|0); if(!q||!inMu(q)||q===pl) return {err:'Người này không ở MU'}; if(!rec(q.prof).cls) return {err:'Người kia chưa chọn class'}; if(pl.muDuel||q.muDuel) return {err:'Đang có trận thách đấu khác'};
    if(s.dead>t) return {err:'Đang gục'}; if(dist(pl,q.x/T,q.y/T)>M.duel.range) return {err:'Đứng gần hơn để thách đấu'}; q.muAsk={from:pl.pid,at:t}; send(q,{t:'muduel',from:pl.pid,name:p.name,cls:r.cls,lv:r.lv}); return {msg:`Đã gửi lời thách đấu tới ${q.prof.name}`}; }
  if(op==='accept'){ const q=players.get(m.pid|0); if(!pl.muAsk||pl.muAsk.from!==(m.pid|0)||t-pl.muAsk.at>30000||!q||!inMu(q)) return {err:'Lời thách đấu đã hết hạn'}; pl.muAsk=null; if(pl.muDuel||q.muDuel) return {err:'Đang có trận khác'};
    pl.muDuel={other:q.pid}; q.muDuel={other:pl.pid}; for(const x of [pl,q]){ const ss=st(x); ss.hp=ss.max; ss.mp=ss.mmax; ss.dead=0; push(x); }
    for(const x of C.sceneOf('mu')) note(x,`⚔ ${q.prof.name} và ${p.name} bắt đầu thách đấu!`,'quest'); return {ok:true}; }
  if(op==='skill'){ if(s.dead>t) return {err:'Đang gục, chờ hồi sinh'}; const sk=M.skills[r.cls][m.i|0]; if(!sk) return {err:'?'}; if((s.cd[sk.k]||0)>t) return {err:'Chiêu đang hồi'}; if(s.mp<sk.mp) return {err:'Không đủ mana'};
    if(sk.buff||sk.heal&&!sk.mul){ s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000; const healed=[];
      if(sk.buff==='def') s.buff.def=t+sk.dur*1000; const tgs=sk.team?[...C.sceneOf('mu')].filter(q=>q.mus&&q.mus.dead<=t&&(q===pl||(!pl.muDuel&&dist(q,pl.x/T,pl.y/T)<=sk.team))):[pl];
      for(const q of tgs){ const qs=st(q); if(!qs) continue; const n=Math.round(qs.max*sk.heal); qs.hp=Math.min(qs.max,qs.hp+n); healed.push(q.pid); if(q!==pl) push(q); }
      bcast({t:'mufx',k:sk.k,from:pl.pid,heal:healed}); push(pl); return {me:view(pl)}; }
    // chiêu đánh: thách đấu thì đánh đối thủ, không thì đánh boss
    const opp=pl.muDuel&&players.get(pl.muDuel.other); let tx,ty,tdef,onHit;
    if(opp&&inMu(opp)){ const os=st(opp); tx=opp.x/T; ty=opp.y/T; tdef=os.def; onHit=d=>{ os.hp-=d; if(os.hp<=0){ os.hp=0; duelEnd(pl,opp); } else push(opp); return opp.pid; }; }
    else if(BOSS){ tx=BOSS.x; ty=BOSS.y; tdef=B.def; onHit=d=>{ BOSS.hp-=d; BOSS.dmg.set(pl.uid,(BOSS.dmg.get(pl.uid)||0)+d); if(BOSS.hp<=0) bossDie(pl); else bcast({t:'muboss',v:bossView()}); return 'boss'; }; }
    else return {err:BOSS===null?`Chưa có mục tiêu. Boss xuất hiện sau ${Math.max(1,Math.ceil((NEXT-t)/60000))} phút, hoặc thách đấu ai đó`:'?'};
    const range=sk.range+(opp?0:1.5); if(Math.hypot(pl.x/T-tx,pl.y/T-ty)>range) return {err:`Xa quá, tầm chiêu ${sk.range} ô`};
    s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000; const crit=Math.random()<.1, d=Math.max(1,Math.round((s.atk*sk.mul*(.9+Math.random()*.2)-tdef*.5)*(crit?1.5:1))); const to=onHit(d);
    bcast({t:'mufx',k:sk.k,from:pl.pid,to,dmg:d,crit}); push(pl); return {me:view(pl)}; }
  return {err:'?'}; });
// Lính Cát đầu đội tự đánh boss cùng chủ (đứng trong 8 ô quanh boss, mỗi 2 giây 1 đòn theo chỉ số công + cấp, tính vào phần sát thương của chủ)
function petTick(t){ if(!BOSS) return; for(const pl of C.sceneOf('mu')){ const m=pl.mus, lead=pl.prof.lc&&pl.prof.lc.party&&pl.prof.lc.party[0];
    if(!m||m.dead>t||!lead||lead.hp<=0||!pl.prof.skills.linhcat||(pl.muPetAt||0)>t||dist(pl,BOSS.x,BOSS.y)>8) continue; pl.muPetAt=t+2000;
    const a=S.lcStats(lead.sp,lead.lv).atk, d=Math.max(1,Math.round(a*1.3*(.9+Math.random()*.2)-B.def*.3)); BOSS.hp-=d; BOSS.dmg.set(pl.uid,(BOSS.dmg.get(pl.uid)||0)+d);
    bcast({t:'mufx',k:'pet',from:pl.pid,to:'boss',dmg:d,sp:lead.sp}); if(BOSS.hp<=0){ bossDie(pl); return; } } }
// boss AI + Lính Cát đánh phụ + hồi máu / mana + hồi sinh, 2 lần mỗi giây
setInterval(()=>{ try{ bossTick(); const t=now(); petTick(t); if(BOSS) bcast({t:'muboss',v:bossView()});
  for(const pl of C.sceneOf('mu')){ const m=pl.mus; if(!m||!rec(pl.prof).cls) continue;
    if(m.dead&&m.dead<=t){ m.dead=0; m.hp=m.max; m.mp=m.mmax; C.moveTo(pl,'mu',M.spawn.x,M.spawn.y); push(pl); continue; }
    if(m.dead>t) continue; const h=m.hp, mp=m.mp; m.hp=Math.min(m.max,m.hp+m.max*M.regen.hp*.5); m.mp=Math.min(m.mmax,m.mp+m.mmax*M.regen.mp*.5); if(Math.round(h)!==Math.round(m.hp)||Math.round(mp)!==Math.round(m.mp)) if(Math.random()<.5) push(pl); }
  for(const pl of players.values()) if(pl.muDuel){ const q=players.get(pl.muDuel.other); if(!q||!inMu(q)||!inMu(pl)){ pl.muDuel=null; if(q) q.muDuel=null; push(pl); } } }catch(e){ console.error('[mu]',e); } },500);
C.hook('enter',pl=>{ if(pl.scene==='mu') setTimeout(()=>{ if(pl.prof){ send(pl,{t:'muboss',v:bossView()}); push(pl); } },600); });
module.exports={};
