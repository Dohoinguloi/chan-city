// MU Online · Lục Địa Cát: chọn class ở Vệ binh (free giáp + vũ khí, đổi class sau tốn tiền), chiêu 1/2/3 (+ phím 4 nếu đã ăn Trái Ác Quỷ) theo thời gian thực
// (server tính tầm, mana, hồi chiêu, sát thương), thách đấu 1 vs 1, 5 boss: boss tổng Luffy Gear 5 + 4 boss phụ (Naruto, Quỷ Cưa, Dươngg Vũ, Rồng Dải Xanh).
// Boss đánh theo bảng đòn (MU.bosses[id].attacks): mọi đòn có cảnh báo trước, tới lúc nổ đã chạy ra khỏi vùng thì né được; dưới 60% / 30% máu boss mạnh lên.
// Hạ Luffy rơi Trái Ác Quỷ (1/10 số người góp sức); boss phụ rơi trang phục, vũ khí, lộ nhiệm vụ ẩn. Máu / mana trong trận không lưu (pl.mus).
'use strict';
const C=require('./core'), P=require('./places'), W=require('./world');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,T,on,now,markDirty,send,note,addItem,take,give,reward,players}=C;
const M=S.MU, fmt=S.fmt, BS=M.bosses, RW=M.reward, F=M.fruits;
const rec=p=>{ const r=p.mu=p.mu||{cls:'',lv:1,exp:0,w:0,l:0,boss:0}; return r; };
const inMu=pl=>pl.scene==='mu'&&pl.prof;
// set legacy đang mặc (áo), không mặc thì ''
// phụ kiện đang đeo + nội tại đã cộng → thuộc tính cộng thêm
const pasPts=r=>Math.max(0,(r.lv-1)-Object.values(r.pas||{}).reduce((a,v)=>a+v,0));
function extraOf(p){ const r=rec(p), o={hp:0,mp:0,atk:0,def:0,regen:0,crit:0,drain:0};
  for(const k of Object.values(r.acc||{})){ const a=M.acc[k]; if(a) for(const [s,v] of Object.entries(a.bonus)) o[s]+=v; }
  for(const [k,n] of Object.entries(r.pas||{})){ const P=M.passive[k]; if(P) o[P.stat]+=P.per*n; }
  const w=M.weapons[r.wep]; if(w&&w.bonus) for(const [s,v] of Object.entries(w.bonus)) o[s]+=v;   /* chỉ số phụ của vũ khí Thợ Rèn */
  const my=S.mythOf(p.look&&p.look.mount); if(my&&p.horse&&p.horse.own) for(const [s,v] of Object.entries(my.bonus)) o[s]+=v;   /* thần thú đang chọn */
  // cấp cường hoá của đồ đang dùng: vũ khí, áo (giáp class / set legacy), 4 phụ kiện
  const enh=r.enh||{}, addE=k=>{ const L=k&&enh[k]; if(!L) return; const per=S.ENH.per[S.enhKind(k)]; if(per) for(const [s,v] of Object.entries(per)) o[s]+=v*L; };
  addE(r.wep); addE(p.look&&p.look.outfit&&p.look.outfit.top); for(const k of Object.values(r.acc||{})) addE(k);
  return o; }
const syncAcc=p=>{ if(p.look) p.look.acc={...(rec(p).acc||{})}; };   // để người khác thấy phụ kiện (gửi kèm ngoại hình)
// vũ khí Thợ Rèn đang cầm (+ cấp cường hoá) gửi kèm ngoại hình: ai cũng thấy trên tay, bộ đồ bỏ vũ khí vẽ sẵn
const syncWep=p=>{ if(!p.look) return; const r=rec(p), w=M.weapons[r.wep]; if(w&&w.store){ p.look.wep=r.wep; p.look.wl=(r.enh||{})[r.wep]||0; } else { delete p.look.wep; delete p.look.wl; } };
const lgOf=p=>{ const k=p.look&&p.look.outfit&&p.look.outfit.top; return k&&M.legacy[k]?k:''; };
function st(pl){ const r=rec(pl.prof); if(!r.cls) return null; const ex=extraOf(pl.prof), s=S.muStats(r.cls,r.lv,r.fruit,r.wep,lgOf(pl.prof),ex); if(!pl.mus) pl.mus={hp:s.hp,mp:s.mp,cd:{},buff:{},dead:0};
  const m=pl.mus; m.crit=.1+ex.crit; m.drain=ex.drain; m.regen=1+ex.regen; m.max=s.hp; m.mmax=s.mp; m.atk=s.atk; m.def=s.def*((m.buff.def||0)>now()?2:1); m.hp=Math.min(m.hp,m.max); m.mp=Math.min(m.mp,m.mmax); return m; }
// chiêu: 1–3 theo class, 4 Trái Ác Quỷ (nếu đã ăn), 5 chiêu riêng của set legacy đang mặc
const skillsOf=(r,p)=>{ const L=[...(M.skills[r.cls]||[])]; L[3]=r.fruit&&F[r.fruit]?F[r.fruit].skill:null; const lg=p&&lgOf(p); L[4]=lg?M.legacy[lg].skill:null; return L; };
function view(pl){ const r=rec(pl.prof), m=st(pl); if(!m) return {cls:''}; const t=now();
  return {cls:r.cls,lv:r.lv,exp:r.exp,next:M.lvExp(r.lv),hp:Math.round(m.hp),max:m.max,mp:Math.round(m.mp),mmax:m.mmax,cd:Object.fromEntries(Object.entries(m.cd).map(([k,v])=>[k,Math.max(0,v-t)])),
    buff:(m.buff.def||0)>t?m.buff.def-t:0,dead:m.dead>t?m.dead-t:0,duel:pl.muDuel?pl.muDuel.other:0,w:r.w,l:r.l,fruit:r.fruit||'',wep:r.wep||'',lg:lgOf(pl.prof),enh:r.enh||{},acc:r.acc||{},accOwned:r.accOwned||{},pas:r.pas||{},sp:pasPts(r),crit:m.crit,cp:S.muPower({hp:m.max,mp:m.mmax,atk:m.atk,def:m.def/((m.buff.def||0)>t?2:1)}),atk:m.atk,def:m.def}; }
const push=pl=>send(pl,{t:'mume',v:view(pl)});
const inScene=()=>[...C.sceneOf('mu')];
const bcast=obj=>{ for(const q of inScene()) send(q,obj); };
const dist=(pl,x,y)=>Math.hypot(pl.x/T-x,pl.y/T-y);
function gainMu(pl,n){ const r=rec(pl.prof); r.exp+=n; let up=0; while(r.lv<M.maxLv&&r.exp>=M.lvExp(r.lv)){ r.exp-=M.lvExp(r.lv); r.lv++; up++; } if(up){ const m=st(pl); if(m){ m.hp=m.max; m.mp=m.mmax; } note(pl,`⬆ MU lên cấp ${r.lv}! Máu, công, thủ tăng · +${up} điểm nội tại (bấm ⭐ Nội tại ở góc chiêu)`,'quest'); } markDirty(pl); }
function down(pl,why){ const m=pl.mus; if(!m||m.dead>now()) return; m.hp=0; m.dead=now()+M.respawn*1000; bcast({t:'mufx',k:'down',to:pl.pid}); note(pl,`💀 ${why}. Hồi sinh ở cổng thành sau ${M.respawn} giây`,'lock'); if(pl.muDuel) duelEnd(players.get(pl.muDuel.other),pl); push(pl); }

/* ---------- boss: lịch xuất hiện, bảng đòn, giai đoạn ---------- */
const LIVE=new Map(), NEXT={}; let SEQ=1;
const nextAt=(b,t)=>Math.ceil((t-(b.offset||0)+1)/b.every)*b.every+(b.offset||0);
for(const [id,b] of Object.entries(BS)) NEXT[id]=nextAt(b,now());   /* lần đầu ra theo lịch lệch nhau; sau đó hạ xong / bỏ đi thì hồi lại đủ b.every mới ra tiếp */
const radius=b=>b.big?2.2:1.6;
function phaseOf(B){ const k=B.hp/B.max, P=BS[B.id].phases; return k<P[1]?3:k<P[0]?2:1; }
function bossView(B){ const b=BS[B.id]; return {id:B.id,name:b.name,sprite:b.sprite,big:b.big||0,hp:Math.round(B.hp),max:B.max,x:B.x,y:B.y,phase:B.phase,anim:B.anim,until:B.until,slow:B.slow>now()?1:0,
  tele:B.tele.map(z=>({id:z.id,k:z.k,kind:z.kind,x:z.x,y:z.y,r:z.r,ang:z.ang,range:z.range,cone:z.cone,at:z.at,end:z.end||0}))}; }
const allView=()=>({list:[...LIVE.values()].map(bossView),next:NEXT});
const pushBoss=()=>bcast({t:'muboss',v:allView()});
function spawn(id){ const b=BS[id], n=inScene().filter(q=>rec(q.prof).cls).length, max=b.hp+b.perPlayer*Math.max(0,n-1), t=now();
  const B={id,hp:max,max,x:b.home.x,y:b.home.y,until:t+b.life,dmg:new Map(),cd:{},tele:[],anim:{k:'spawn',t},phase:1,slow:0};
  b.attacks.forEach((a,i)=>B.cd[a.k]=t+2500+i*1500); LIVE.set(id,B);
  C.broadcastAll({t:'note',msg:id==='luffy'?`👑 Boss tổng ${b.name} vừa xuất hiện ở MU Online! Gọi Grab "vào game" đánh boss, hạ được rơi Trái Ác Quỷ`:`⚔ Boss phụ ${b.name} vừa xuất hiện ở MU Online!`,kind:'quest'}); pushBoss(); }
const alive=()=>inScene().filter(q=>q.mus&&q.mus.dead<=now()&&rec(q.prof).cls);
// chọn mục tiêu trong khu của boss
const inArea=(a,x,y)=>x>=a.x0-1&&x<=a.x1+1&&y>=a.y0-1&&y<=a.y1+1;
function targets(B,range){ const a=BS[B.id].area; return alive().filter(q=>inArea(a,q.x/T,q.y/T)&&dist(q,B.x,B.y)<=range); }
function startAttack(B,a,t,mul){ const b=BS[B.id], z={id:SEQ++,k:a.k,kind:a.kind,dmg:a.dmg*mul,at:t+a.warn*1000*(B.slow>t?1.5:1)};
  if(a.kind==='single'){ const q=targets(B,a.range).sort((u,v)=>dist(u,B.x,B.y)-dist(v,B.x,B.y))[0]; if(!q) return false; Object.assign(z,{x:q.x/T,y:q.y/T,r:a.r}); B.tele.push(z); }
  else if(a.kind==='circle'||a.kind==='jump'){ const L=targets(B,14); if(!L.length) return false; const q=L[Math.floor(Math.random()*L.length)]; Object.assign(z,{x:q.x/T,y:q.y/T,r:a.r}); B.tele.push(z); }
  else if(a.kind==='multi'){ const L=targets(B,14); if(!L.length) return false; for(let i=0;i<a.n;i++){ const q=L[i%L.length]; B.tele.push({...z,id:SEQ++,x:q.x/T+(i>=L.length?(Math.random()-.5)*4:0),y:q.y/T+(i>=L.length?(Math.random()-.5)*2:0),r:a.r}); } }
  else if(a.kind==='cone'){ const q=targets(B,a.range).sort((u,v)=>dist(u,B.x,B.y)-dist(v,B.x,B.y))[0]; if(!q) return false; Object.assign(z,{x:B.x,y:B.y,ang:Math.atan2(q.y/T-B.y,q.x/T-B.x),range:a.range,cone:a.cone,hits:a.hits,tick:a.tick*1000,end:z.at+a.hits*a.tick*1000}); B.tele.push(z); }
  else if(a.kind==='ring'){ if(!targets(B,a.r+3).length) return false; Object.assign(z,{x:B.x,y:B.y,r:a.r}); B.tele.push(z); }
  B.anim={k:a.k,t,at:z.at}; return true; }
// trừ máu người chơi (đã trừ thủ), báo hiệu ứng trúng đòn; hết máu thì gục với lý do why
function hurtP(q,d,why,fx){ const m=st(q); if(!m||m.dead>now()) return 0; const dd=Math.max(1,Math.round(d*(.9+Math.random()*.2)-m.def*.4)); m.hp-=dd; bcast({t:'mufx',k:'hurt',...fx,to:q.pid,dmg:dd});
  if(m.hp<=0) down(q,why); else push(q); return dd; }
const hurt=(B,q,d,k)=>hurtP(q,d,`Dính ${(BS[B.id].attacks.find(a=>a.k===k)||{}).name||'đòn'} của ${BS[B.id].name}`,{ak:k,boss:B.id});
// mục tiêu khác ngoài boss (quái rừng ở muforest.js): mỗi nguồn có nearest(pl) → {x,y,d,def,rad,hit(d,pl,sk) → mã mục tiêu} hoặc null
const EXTRA=[];
const nearestExtra=pl=>{ let best=null; for(const src of EXTRA){ const o=src.nearest(pl); if(o&&(!best||o.d<best.d)) best=o; } return best; };
function resolve(B,z,t){ const b=BS[B.id];
  if(z.kind==='cone'){ if(t<z.at) return false; const due=Math.floor((t-z.at)/z.tick)+1; z.done=z.done||0;
    while(z.done<Math.min(due,z.hits)){ z.done++; for(const q of alive()){ const dx=q.x/T-z.x, dy=q.y/T-z.y, d=Math.hypot(dx,dy); let da=Math.abs(Math.atan2(dy,dx)-z.ang); if(da>Math.PI) da=2*Math.PI-da; if(d<=z.range&&da<=z.cone) hurt(B,q,z.dmg,z.k); } bcast({t:'mufx',k:'bhit',boss:B.id,ak:z.k,kind:z.kind,x:z.x,y:z.y,ang:z.ang,range:z.range,n:z.done}); }
    return z.done>=z.hits; }
  if(t<z.at) return false;
  if(z.kind==='jump'){ B.x=Math.max(b.area.x0+1,Math.min(b.area.x1-1,z.x)); B.y=Math.max(b.area.y0+1,Math.min(b.area.y1-1,z.y)); }
  const cx=z.kind==='ring'?B.x:z.x, cy=z.kind==='ring'?B.y:z.y; for(const q of alive()) if(dist(q,cx,cy)<=z.r) hurt(B,q,z.dmg,z.k);
  bcast({t:'mufx',k:'bhit',boss:B.id,ak:z.k,kind:z.kind,x:cx,y:cy,r:z.r}); return true; }
function bossTick(t){ for(const [id,b] of Object.entries(BS)) if(!LIVE.has(id)&&t>=NEXT[id]){ NEXT[id]=t+b.life+b.every; spawn(id); }
  let dirty=false;
  for(const B of [...LIVE.values()]){ const b=BS[B.id];
    if(t>=B.until){ LIVE.delete(B.id); NEXT[B.id]=t+b.every; bcast({t:'note',msg:`${b.name} bỏ đi rồi, lần sau rủ thêm người nhé!`,kind:'lock'}); dirty=true; continue; }
    const ph=phaseOf(B); if(ph!==B.phase){ B.phase=ph; dirty=true; bcast({t:'mufx',k:'phase',boss:B.id,phase:ph}); if(ph===3) bcast({t:'note',msg:`🔥 ${b.name} nổi giận! Đánh mạnh và nhanh hơn`,kind:'lock'}); }
    const en=ph===3?b.enrage:{mul:1,speed:1}, speed=en.speed*(B.slow>t?.6:1);
    for(const a of b.attacks){ if((a.phase||1)>ph||t<(B.cd[a.k]||0)||B.tele.length>=3) continue; if(B.tele.some(z=>z.kind!=='single'&&z.at>t)&&a.kind!=='single') continue;
      B.cd[a.k]=t+a.every*1000/speed; if(startAttack(B,a,t,en.mul)) dirty=true; }
    const before=B.tele.length; B.tele=B.tele.filter(z=>!resolve(B,z,t)); if(B.tele.length!==before) dirty=true; }
  if(dirty) pushBoss(); }
// hạ boss: chia thưởng theo phần sát thương
function bossDie(B,killer){ const b=BS[B.id], R=RW[b.drops]||{}; LIVE.delete(B.id); NEXT[B.id]=now()+b.every;   /* hồi lại đủ thời gian mới ra tiếp */
  const total=[...B.dmg.values()].reduce((a,v)=>a+v,0)||1, top=[...B.dmg.entries()].sort((a,c)=>c[1]-a[1]).filter(([u])=>C.byUid.get(u)), lines=[];
  // Trái Ác Quỷ (chỉ Luffy): số trái = 1/10 số người góp sức, tối thiểu 1; ai góp nhiều sát thương thì dễ được hơn
  const fruitTo=new Set(); if(B.id==='luffy'){ const n=Math.max(1,Math.ceil(top.length/(R.fruitPer||10))), pool=top.map(([u,d])=>({u,w:d})); for(let i=0;i<n&&pool.length;i++){ const sum=pool.reduce((a,x)=>a+x.w,0); let r=Math.random()*sum, k=0; while(k<pool.length-1&&(r-=pool[k].w)>0) k++; fruitTo.add(pool[k].u); pool.splice(k,1); } }
  top.forEach(([uid,d],rank)=>{ const pl=C.byUid.get(uid); if(!pl||!pl.prof) return; const p=pl.prof, sh=d/total, items={}, extra=[], hadCos=!!(R.costume&&p.owned[R.costume]);
    { const gc=B.id==='luffy'?(rank===0?2:Math.random()<.6?1:0):(rank===0?1:Math.random()<.35?1:0); if(gc) items.ngoc_ch=(items.ngoc_ch||0)+gc; }   /* ngọc cường hoá */
    if(B.id==='luffy'&&(rank===0||Math.random()<R.jewel)){ const j=M.jewels[Math.floor(Math.random()*M.jewels.length)]; items[j]=1; }
    if(fruitTo.has(uid)){ const ks=Object.keys(F), k=ks[Math.floor(Math.random()*ks.length)]; items['taq_'+k]=1; extra.push(`🍇 ${F[k].name}!`); }
    let cos='', sec=''; if(R.costume&&!p.owned[R.costume]&&(rank===0||Math.random()<R.chance)){ p.owned[R.costume]=1; cos=R.costume; extra.push(`trang phục ${S.CLOTHES[R.costume].name}`); }
    if(R.weapon&&!C.has(pl,R.weapon)&&(rank===0&&hadCos||Math.random()<R.chance)){ items[R.weapon]=1; const r=rec(p), cur=(M.weapons[r.wep]||{}).atk||0; if(M.weapons[R.weapon].atk>cur) r.wep=R.weapon; extra.push(`vũ khí ${M.weapons[R.weapon].name}`); }
    if(R.secret&&!p.quests[R.secret]){ p.quests[R.secret]='active'; sec=R.secret; extra.push(`nhiệm vụ ẩn "${S.QUESTS[R.secret].title.replace('🔍 ','')}"`); }
    const got=reward(pl,{exp:R.exp+Math.round(300*sh),vnd:R.vnd+Math.round((B.id==='luffy'?600000:300000)*sh),items},`Hạ ${b.name}: góp ${Math.round(sh*100)}% sát thương${rank===0?' (top 1!)':''}`), mu=R.mu+Math.round(200*sh); gainMu(pl,mu); rec(p).boss++;
    send(pl,{t:'muloot',boss:B.id,name:b.name,rank:rank+1,n:top.length,share:Math.round(sh*100),exp:got.exp||0,vnd:got.vnd||0,mu,items:got.items||{},cos,sec});   // bảng tổng kết chiến lợi phẩm
    if(extra.length) note(pl,'🎁 Rơi ra: '+extra.join(', '),'item'); if(pl.mus) st(pl); push(pl); markDirty(pl); if(rank<3) lines.push(`${rank+1}. ${p.name} ${Math.round(sh*100)}%`); });
  C.broadcastAll({t:'note',msg:`🏆 ${b.name} đã bị hạ${killer?` bởi ${killer.prof.name}`:''}! ${lines.join(' · ')}${fruitTo.size?` · rơi ${fruitTo.size} Trái Ác Quỷ`:''}`,kind:'quest'});
  bcast({t:'mufx',k:'bossdie',boss:B.id,x:B.x,y:B.y}); pushBoss(); }
// Min (gọi từ set 16Typh) hát ra nốt nhạc đánh boss gần chủ nhất trong 9 ô, mỗi 0,9 giây, tới khi hết giờ / chủ gục
function minTick(t){ for(const pl of inScene()){ const mm=pl.muMin; if(!mm) continue; const m=pl.mus;
    if(mm.until<=t||!m||m.dead>t){ pl.muMin=null; bcast({t:'mufx',k:'mindown',from:pl.pid}); continue; } if(t<mm.next) continue; mm.next=t+900;
    const B=[...LIVE.values()].filter(x=>dist(pl,x.x,x.y)<=9).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
    if(X0&&X0.d<=9&&(!B||X0.d<dist(pl,B.x,B.y))){ const d=Math.max(1,Math.round(m.atk*1.1*(.9+Math.random()*.2)-X0.def*.3)), to=X0.hit(d,pl,{}); bcast({t:'mufx',k:'minhit',from:pl.pid,to,dmg:d}); continue; }
    if(!B) continue;
    const d=Math.max(1,Math.round(m.atk*1.1*(.9+Math.random()*.2)-BS[B.id].def*.3)); B.hp-=d; B.dmg.set(pl.uid,(B.dmg.get(pl.uid)||0)+d);
    bcast({t:'mufx',k:'minhit',from:pl.pid,to:'boss:'+B.id,boss:B.id,dmg:d}); if(B.hp<=0) bossDie(B,pl); } }
// Lính Cát đầu đội tự đánh boss gần nhất cùng chủ (trong 8 ô)
function petTick(t){ for(const pl of inScene()){ const m=pl.mus, lead=pl.prof.lc&&pl.prof.lc.party&&pl.prof.lc.party[0];
    if(!m||m.dead>t||!lead||lead.hp<=0||!pl.prof.skills.linhcat||(pl.muPetAt||0)>t) continue; const B=[...LIVE.values()].filter(x=>dist(pl,x.x,x.y)<=8).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
    if(X0&&X0.d<=8&&(!B||X0.d<dist(pl,B.x,B.y))){ pl.muPetAt=t+2000; const d=Math.max(1,Math.round(S.lcStats(lead.sp,lead.lv).atk*1.3*(.9+Math.random()*.2)-X0.def*.3)), to=X0.hit(d,pl,{}); bcast({t:'mufx',k:'pet',from:pl.pid,to,dmg:d,sp:lead.sp}); continue; }
    if(!B) continue;
    pl.muPetAt=t+2000; const a=S.lcStats(lead.sp,lead.lv).atk, d=Math.max(1,Math.round(a*1.3*(.9+Math.random()*.2)-BS[B.id].def*.3)); B.hp-=d; B.dmg.set(pl.uid,(B.dmg.get(pl.uid)||0)+d);
    bcast({t:'mufx',k:'pet',from:pl.pid,to:'boss',boss:B.id,dmg:d,sp:lead.sp}); if(B.hp<=0) bossDie(B,pl); } }
/* ---------- thách đấu ---------- */
function duelEnd(win,lose){ for(const q of [win,lose]) if(q){ q.muDuel=null; push(q); }
  if(win&&lose&&win.prof&&lose.prof){ const ra=rec(win.prof), rb=rec(lose.prof); ra.w++; rb.l++; gainMu(win,M.duel.mu); C.gainExp(win,M.duel.exp); const lb=lose.mus; if(lb&&lb.hp<=0){ lb.hp=1; lb.dead=0; }
    for(const q of inScene()) note(q,`⚔ ${win.prof.name} thắng ${lose.prof.name} trong trận thách đấu!`,'quest'); markDirty(win); markDirty(lose); } }
const HID_Q={cuon_truc:'mu_cuontruc',banh_mut:'mu_banhmut',lua_ma:'mu_lua_ma',vay_rong:'mu_vayrong'};
const night=()=>{ const h=S.vnTime(now()).hf; return h>=19||h<5; };
/* ---------- thao tác ---------- */
on('mu',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now(); if(!inMu(pl)) return {err:'Vào thế giới MU Online trước (gọi Grab)'};
  if(op==='view') return {me:view(pl),boss:allView()};
  if(op==='dbgboss'&&process.env.CHAN_TEST==='1'){ const id=BS[m.id]?m.id:'luffy'; if(!LIVE.has(id)) spawn(id); if(m.hp) LIVE.get(id).hp=+m.hp; return {boss:allView()}; }   // chỉ server test: gọi boss ra ngay
  if(op==='class'){ const k=String(m.cls||''), c=M.cls[k]; if(!c) return {err:'?'}; if(!P.nearNpc(pl,'mu_guard')) return {err:'Gặp Vệ binh ở cổng thành'}; if(r.cls===k) return {err:'Bạn đang là '+c.name+' rồi'};
    if(r.cls&&!take(pl,300000)) return {err:'Đổi class tốn 300.000đ, không đủ tiền'}; r.cls=k; p.owned[c.set]=1; if(p.look&&p.look.outfit) p.look.outfit.top=c.set; pl.mus=null; st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:`Bạn trở thành ${c.name}! Đã nhận và mặc ${S.CLOTHES[c.set].name}. Phím 1 / 2 / 3 để ra chiêu`,look:p.look}; }
  if(op==='heal'){ if(!P.nearNpc(pl,'mu_mage')) return {err:'Gặp Pháp sư Cát'}; const s=st(pl); if(!s) return {err:'Chọn class ở Vệ binh trước'}; if(pl.muDuel) return {err:'Đang thách đấu'}; s.hp=s.max; s.mp=s.mmax; push(pl); return {msg:'Pháp sư Cát: "Máu với mana đầy rồi, ra trận đi!"'}; }
  if(op==='sell'){ if(!P.nearNpc(pl,'mu_mage')) return {err:'Gặp Pháp sư Cát'}; const k=String(m.k||''), price={ngoc_uoc:150000,ngoc_tam_linh:200000,ngoc_hon_nguyen:400000}[k]; if(!price||!C.has(pl,k)) return {err:'Không có ngọc này'};
    addItem(pl,k,-1); give(pl,price); markDirty(pl); return {msg:`Bán ${S.ITEMS[k].name} được ${fmt(price)}`}; }
  // Premium Store: mua set legacy (giữ mãi, mặc luôn), mặc / cởi (k rỗng = mặc lại giáp class)
  if(op==='buy'||op==='wear'){ if(!P.nearNpc(pl,'mu_shop')) return {err:'Gặp Thương nhân Huyền Thoại ở quảng trường'}; const k=String(m.k||''), L=M.legacy[k];
    if(op==='buy'){ if(!L) return {err:'?'}; if(p.owned[k]) return {err:'Bạn có set này rồi, bấm Mặc'}; if(!shopPay(pl,L.price)) return {err:`Cần ${fmt(L.price)} để mua ${L.name}`}; p.owned[k]=1; }
    else if(k&&(!L||!p.owned[k])) return {err:'Chưa có set này'};
    const top=k||(r.cls?M.cls[r.cls].set:''); if(!top) return {err:'Chọn class ở Vệ binh trước'}; if(p.look&&p.look.outfit) p.look.outfit.top=top; if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:op==='buy'?`Đã mua và mặc Set Legacy ${L.name}! Lực chiến tăng, đòn đánh có hiệu ứng riêng`:k?`Đã mặc ${L.name}`:'Đã mặc lại giáp class',look:p.look}; }
  // Phù Thuỷ Cường Hoá: khắc lỗ cường hoá cho 1 món đồ (1 ngọc + phí; legend = dùng Ngọc Huyền Thoại 80%), mua ngọc, nhận quà Lính Cát huyền thoại
  if(op==='enh'||op==='enhbuy'||op==='enhgift'){ if(!P.nearNpc(pl,'mu_enchant')) return {err:'Gặp Phù Thuỷ Cường Hoá ở quảng trường'}; const E=S.ENH;
    if(op==='enhbuy'){ const n=Math.max(1,Math.min(20,m.n|0)); if(!shopPay(pl,E.gemPrice*n)) return {err:`${n} ngọc giá ${fmt(E.gemPrice*n)}`}; addItem(pl,'ngoc_ch',n); markDirty(pl); return {msg:`Mua ${n} Ngọc Cường Hoá`}; }
    if(op==='enhgift'){ const lc=p.lc||{}, got=p.flags.enhGift=p.flags.enhGift||{}, sp=[...new Set([...(lc.party||[]),...(lc.box||[])].map(x=>x.sp).filter(s=>S.LC_SPECIES[s]&&S.LC_SPECIES[s].legend&&!got[s]))];
      if(!sp.length) return {err:'Chưa có Lính Cát huyền thoại mới (mỗi loài huyền thoại tặng 1 viên)'}; for(const s of sp) got[s]=1; addItem(pl,'ngoc_ch_ht',sp.length); markDirty(pl);
      return {msg:`${sp.map(s=>S.LC_SPECIES[s].name).join(', ')} tặng bạn ${sp.length} Ngọc Cường Hoá Huyền Thoại (80% thành công)!`}; }
    const k=String(m.k||''), kind=S.enhKind(k); if(!kind) return {err:'Món này không cường hoá được'};
    const own=kind==='weapon'?C.has(pl,k):kind==='set'?!!p.owned[k]:!!(r.accOwned||{})[k]; if(!own) return {err:'Bạn chưa có món này'};
    const enh=r.enh=r.enh||{}, L=enh[k]||0; if(L>=E.max) return {err:`Đã khắc đủ ${E.max} lỗ`}; const gem=m.legend?'ngoc_ch_ht':'ngoc_ch'; if(!C.has(pl,gem)) return {err:`Cần ${S.ITEMS[gem].name}`};
    if(!take(pl,E.fee(L))) return {err:`Phí khắc lỗ ${fmt(E.fee(L))}`}; const lead=(p.lc&&p.lc.party||[])[0], lcB=lead?Math.min(E.lcMax,lead.lv*E.lcPer):0, rate=m.legend?E.legendRate:Math.min(.99,E.rate[L]+lcB);
    addItem(pl,gem,-1); const ok=Math.random()<rate; if(ok){ enh[k]=L+1; if(k===r.wep){ syncWep(p); C.refreshInfo(pl); } } if(pl.mus) st(pl); markDirty(pl); push(pl);
    return {ok,lv:enh[k]||0,rate,msg:ok?`Cường hoá thành công! ${(M.weapons[k]||M.legacy[k]||M.acc[k]||S.CLOTHES[k]||{}).name||k} +${L+1}`:`Cường hoá thất bại (${Math.round(rate*100)}%), mất 1 ngọc`}; }
  // Thợ Rèn Huyền Thoại: mua vũ khí (vào túi, cầm luôn); đã có thì cầm
  if(op==='smithbuy'){ if(!P.nearNpc(pl,'mu_smith')) return {err:'Gặp Thợ Rèn Huyền Thoại ở quảng trường'}; const k=String(m.k||''), w=M.weapons[k]; if(!w||!w.store) return {err:'?'};
    if(!C.has(pl,k)){ if(!shopPay(pl,w.price)) return {err:`Cần ${fmt(w.price)} để mua ${w.name}`}; addItem(pl,k,1); }
    r.wep=k; syncWep(p); C.refreshInfo(pl); if(pl.mus) st(pl); markDirty(pl); push(pl); return {msg:`Đã cầm ${w.name}! ${w.desc}`,look:p.look}; }
  // Thợ Kim Hoàn: mua phụ kiện (giữ mãi, đeo luôn), đeo / tháo theo ô
  if(op==='accbuy'||op==='accwear'){ if(!P.nearNpc(pl,'mu_acc')&&!P.nearNpc(pl,'mu_shoes')) return {err:'Gặp Thợ Kim Hoàn (phụ kiện) hoặc Tiệm Giày ở quảng trường'}; const k=String(m.k||''), a=M.acc[k], slot=a?a.slot:String(m.slot||'');
    if(!M.slots[slot]) return {err:'?'}; const own=r.accOwned=r.accOwned||{}, eq=r.acc=r.acc||{};
    if(op==='accbuy'){ if(!a) return {err:'?'}; if(own[k]) return {err:'Có món này rồi, bấm Đeo'}; if(!shopPay(pl,a.price)) return {err:`Cần ${fmt(a.price)} để mua ${a.name}`}; own[k]=1; }
    else if(k&&(!a||!own[k])) return {err:'Chưa có món này'};
    if(k) eq[slot]=k; else delete eq[slot]; syncAcc(p); if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:op==='accbuy'?`Đã mua và đeo ${a.name}!`:k?`Đã đeo ${a.name}`:`Đã tháo ${M.slots[slot].toLowerCase()}`}; }
  // nội tại: cộng 1 điểm (mỗi cấp MU được 1 điểm); đặt lại tốn 200.000đ
  if(op==='pas'){ const k=String(m.k||''), Pd=M.passive[k]; if(!Pd) return {err:'?'}; const pas=r.pas=r.pas||{}; if(!pasPts(r)) return {err:'Hết điểm nội tại, lên cấp MU để có thêm'};
    if((pas[k]||0)>=Pd.max) return {err:`${Pd.name} đã tối đa`}; pas[k]=(pas[k]||0)+1; if(pl.mus) st(pl); markDirty(pl); push(pl); return {msg:`${Pd.name} lên cấp ${pas[k]}`}; }
  if(op==='pasreset'){ if(!Object.keys(r.pas||{}).length) return {err:'Chưa cộng điểm nào'}; if(!take(pl,200000)) return {err:'Đặt lại nội tại tốn 200.000đ'}; r.pas={}; if(pl.mus) st(pl); markDirty(pl); push(pl); return {msg:'Đã trả lại toàn bộ điểm nội tại'}; }
  // ăn Trái Ác Quỷ: mỗi người chỉ 1 trái, có chiêu thứ 4 (phím 4) + chỉ số cộng thêm
  if(op==='eat'){ const k=String(m.k||''), f=F[k]; if(!f||!C.has(pl,'taq_'+k)) return {err:'Không có trái này'}; if(r.fruit) return {err:`Bạn đã ăn ${F[r.fruit].name} rồi! Ăn thêm trái nữa là nổ tung người đấy`}; if(!r.cls) return {err:'Chọn class ở Vệ binh trước'};
    addItem(pl,'taq_'+k,-1); r.fruit=k; pl.mus=null; st(pl); markDirty(pl); push(pl); bcast({t:'mufx',k:'eat',to:pl.pid,fruit:k}); return {msg:`Ăn ${f.name}! Năng lực mới: phím 4 "${f.skill.name}". ${f.desc}`}; }
  if(op==='wep'){ const k=String(m.k||''); if(k&&(!M.weapons[k]||!C.has(pl,k))) return {err:'Chưa có vũ khí này'}; r.wep=k||''; syncWep(p); C.refreshInfo(pl); pl.mus&&st(pl); markDirty(pl); push(pl); return {msg:k?`Cầm ${M.weapons[k].name}: ${M.weapons[k].desc}`:'Cất vũ khí'}; }
  if(op==='pick'){ const k=String(m.k||''), L=M.hidden[k], i=m.i|0, q=HID_Q[k]; if(!L||!L[i]) return {err:'?'}; if(p.quests[q]!=='active') return {err:'?'}; if(k==='lua_ma'&&!night()) return {err:'Đốm lửa ma chỉ hiện ban đêm'};
    const H=p.flags.muHid=p.flags.muHid||{}; if(H[k+i]) return {err:'Nhặt rồi'}; if(dist(pl,L[i][0],L[i][1])>2.2) return {err:'Lại gần hơn'}; H[k+i]=1; addItem(pl,k,1); markDirty(pl);
    const n=Object.keys(H).filter(x=>x.startsWith(k)).length; return {msg:`Nhặt được ${S.ITEMS[k].name} (${n}/${L.length})`}; }
  const s=st(pl); if(!s) return {err:'Gặp Vệ binh ở cổng thành chọn class trước'};
  if(op==='duel'){ const q=players.get(m.pid|0); if(!q||!inMu(q)||q===pl) return {err:'Người này không ở MU'}; if(!rec(q.prof).cls) return {err:'Người kia chưa chọn class'}; if(pl.muDuel||q.muDuel) return {err:'Đang có trận thách đấu khác'};
    if(s.dead>t) return {err:'Đang gục'}; if(dist(pl,q.x/T,q.y/T)>M.duel.range) return {err:'Đứng gần hơn để thách đấu'}; q.muAsk={from:pl.pid,at:t}; send(q,{t:'muduel',from:pl.pid,name:p.name,cls:r.cls,lv:r.lv}); return {msg:`Đã gửi lời thách đấu tới ${q.prof.name}`}; }
  if(op==='accept'){ const q=players.get(m.pid|0); if(!pl.muAsk||pl.muAsk.from!==(m.pid|0)||t-pl.muAsk.at>30000||!q||!inMu(q)) return {err:'Lời thách đấu đã hết hạn'}; pl.muAsk=null; if(pl.muDuel||q.muDuel) return {err:'Đang có trận khác'};
    pl.muDuel={other:q.pid}; q.muDuel={other:pl.pid}; for(const x of [pl,q]){ const ss=st(x); ss.hp=ss.max; ss.mp=ss.mmax; ss.dead=0; push(x); }
    for(const x of inScene()) note(x,`⚔ ${q.prof.name} và ${p.name} bắt đầu thách đấu!`,'quest'); return {ok:true}; }
  if(op==='skill'){ if(s.dead>t) return {err:'Đang gục, chờ hồi sinh'}; const sk=skillsOf(r,p)[m.i|0]; if(!sk) return {err:'Chưa có chiêu này'}; if((s.cd[sk.k]||0)>t) return {err:'Chiêu đang hồi'}; if(s.mp<sk.mp) return {err:'Không đủ mana'};
    if(sk.buff||sk.heal&&!sk.mul){ s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000; const healed=[]; W.setAct(pl,'attack',.35);
      if(sk.buff==='def') s.buff.def=t+sk.dur*1000; const tgs=sk.team?inScene().filter(q=>q.mus&&q.mus.dead<=t&&(q===pl||(!pl.muDuel&&dist(q,pl.x/T,pl.y/T)<=sk.team))):[pl];
      for(const q of tgs){ const qs=st(q); if(!qs) continue; const n=Math.round(qs.max*sk.heal); qs.hp=Math.min(qs.max,qs.hp+n); healed.push(q.pid); if(q!==pl) push(q); }
      const lg=lgOf(p); bcast({t:'mufx',k:sk.k,from:pl.pid,heal:healed,lg:lg&&M.legacy[lg].fx}); push(pl); return {me:view(pl)}; }
    // chiêu Gọi Min (set 16Typh): chưa có boss / boss ngoài tầm vẫn gọi được, Min tự hát đánh boss trong 9 ô quanh chủ
    const near0=!pl.muDuel&&([...LIVE.values()].find(B=>Math.hypot(pl.x/T-B.x,pl.y/T-B.y)<=sk.range+radius(BS[B.id]))||(()=>{ const X0=nearestExtra(pl); return X0&&X0.d<=sk.range+X0.rad; })());
    if(sk.summon&&!pl.muDuel&&!near0){ s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000; W.setAct(pl,'attack',.35); pl.muMin={until:t+sk.summon*1000,next:t+700};
      bcast({t:'mufx',k:'minup',from:pl.pid,until:pl.muMin.until}); push(pl); return {me:view(pl),msg:`Min ra rồi! Min hát đánh boss trong 9 ô quanh bạn (${sk.summon} giây)`}; }
    // chiêu đánh: thách đấu thì đánh đối thủ, không thì đánh boss / quái rừng gần nhất trong tầm
    const opp=pl.muDuel&&players.get(pl.muDuel.other); let tx,ty,tdef,onHit,rad=0;
    if(opp&&inMu(opp)){ const os=st(opp); tx=opp.x/T; ty=opp.y/T; tdef=os.def; onHit=d=>{ os.hp-=d; if(os.hp<=0){ os.hp=0; duelEnd(pl,opp); } else push(opp); return opp.pid; }; }
    else { const B=[...LIVE.values()].sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
      if(!B&&!X0){ const ids=Object.keys(BS).sort((a,c)=>NEXT[a]-NEXT[c]); return {err:`Chưa có boss nào. ${BS[ids[0]].name} xuất hiện sau ${Math.max(1,Math.ceil((NEXT[ids[0]]-t)/60000))} phút. Xuống rừng phía Nam đánh quái, hoặc thách đấu ai đó`}; }
      if(X0&&(!B||X0.d-X0.rad<dist(pl,B.x,B.y)-radius(BS[B.id]))){ tx=X0.x; ty=X0.y; tdef=X0.def; rad=X0.rad; onHit=d=>X0.hit(d,pl,sk); }
      else { tx=B.x; ty=B.y; tdef=BS[B.id].def; rad=radius(BS[B.id]);
        onHit=d=>{ B.hp-=d; B.dmg.set(pl.uid,(B.dmg.get(pl.uid)||0)+d); if(sk.slow) B.slow=t+sk.slow*1000; if(B.hp<=0) bossDie(B,pl); else pushBoss(); return 'boss:'+B.id; }; } }
    if(Math.hypot(pl.x/T-tx,pl.y/T-ty)>sk.range+rad) return {err:`Xa quá, tầm chiêu ${sk.range} ô`};
    s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000; W.setAct(pl,'attack',.35); const crit=Math.random()<s.crit, d=Math.max(1,Math.round((s.atk*sk.mul*(.9+Math.random()*.2)-tdef*.5)*(crit?1.5:1)));
    if(sk.drain||s.drain) s.hp=Math.min(s.max,s.hp+Math.round(d*((sk.drain||0)+s.drain))); if(sk.heal) s.hp=Math.min(s.max,s.hp+Math.round(s.max*sk.heal));   /* chiêu đánh kèm hồi máu (set Yoshi, King Knight) */ const to=onHit(d);
    const lg=lgOf(p), wv=M.weapons[r.wep]; bcast({t:'mufx',k:sk.k,from:pl.pid,to,dmg:d,crit,lg:lg&&M.legacy[lg].fx,w:wv&&wv.store?r.wep:'',wl:(r.enh||{})[r.wep]||0});
    if(sk.summon){ pl.muMin={until:t+sk.summon*1000,next:t+700}; bcast({t:'mufx',k:'minup',from:pl.pid,until:pl.muMin.until}); }   // set 16Typh: Min ra đánh cùng
    push(pl); return {me:view(pl)}; }
  return {err:'?'}; });
// boss AI 5 lần / giây (đủ mịn để né đòn), Lính Cát đánh phụ, hồi máu / mana, hồi sinh
let regenT=0;
setInterval(()=>{ try{ const t=now(); bossTick(t); petTick(t); minTick(t); if(t<regenT) return; regenT=t+500;
  for(const pl of inScene()){ const m=pl.mus; if(!m||!rec(pl.prof).cls) continue;
    if(m.dead&&m.dead<=t){ m.dead=0; m.hp=m.max; m.mp=m.mmax; C.moveTo(pl,'mu',M.spawn.x,M.spawn.y); push(pl); continue; }
    if(m.dead>t) continue; const h=m.hp, mp=m.mp; m.hp=Math.min(m.max,m.hp+m.max*M.regen.hp*.5*(m.regen||1)); m.mp=Math.min(m.mmax,m.mp+m.mmax*M.regen.mp*.5*(m.regen||1)); if((Math.round(h)!==Math.round(m.hp)||Math.round(mp)!==Math.round(m.mp))&&Math.random()<.5) push(pl); }
  for(const pl of players.values()) if(pl.muDuel){ const q=players.get(pl.muDuel.other); if(!q||!inMu(q)||!inMu(pl)){ pl.muDuel=null; if(q) q.muDuel=null; push(pl); } }
  if(LIVE.size) pushBoss(); }catch(e){ console.error('[mu]',e); } },200);
C.hook('login',pl=>{ if(pl.prof&&pl.prof.mu){ syncAcc(pl.prof); syncWep(pl.prof); } });
// tủ đồ (mọi map): đổi vũ khí / phụ kiện / thần thú đang dùng; chỉ số MU tính khi vào MU
on('gear',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const r=rec(p), k=String(m.k||'');
  if(m.op==='wep'){ if(k&&(!M.weapons[k]||!C.has(pl,k))) return {err:'Chưa có vũ khí này'}; r.wep=k; }
  else if(m.op==='acc'){ const slot=String(m.slot||''); if(!M.slots[slot]) return {err:'?'}; if(k&&(!M.acc[k]||M.acc[k].slot!==slot||!(r.accOwned||{})[k])) return {err:'Chưa có món này'}; r.acc=r.acc||{}; if(k) r.acc[slot]=k; else delete r.acc[slot]; syncAcc(p); }
  else if(m.op==='mount'){ const my=k&&S.mythOf(k), lv=(p.horse&&p.horse.myth)||0; if(!(p.horse&&p.horse.own)) return {err:'Chưa có ngựa riêng'}; if(k&&(!my||my.lv>lv)) return {err:'Chưa mở thần thú này'}; if(p.look) p.look.mount=k; }
  else return {err:'?'};
  syncWep(p); if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); if(inMu(pl)) push(pl); return {ok:true,look:p.look}; });
C.hook('enter',pl=>{ if(pl.scene==='mu') setTimeout(()=>{ if(pl.prof){ send(pl,{t:'muboss',v:allView()}); push(pl); } },600); });
// lực chiến của 1 hồ sơ (bảng xếp hạng Lực chiến): chỉ người đã chọn class MU
const powerOf=p=>{ const r=p&&p.mu; if(!r||!r.cls) return 0; return S.muPower(S.muStats(r.cls,r.lv,r.fruit,r.wep,lgOf(p),extraOf(p))); };
module.exports={rec,st,push,view,inScene,bcast,alive,gainMu,hurtP,dist,EXTRA,powerOf};
