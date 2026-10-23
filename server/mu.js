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
const MS=new Set(['mu','muw']), EXTRA_SCENES=new Set(), inMu=pl=>(MS.has(pl.scene)||EXTRA_SCENES.has(pl.scene))&&pl.prof;   /* MU + cảnh trận D-Day (dday.js thêm / bớt EXTRA_SCENES) */
// set legacy đang mặc (áo), không mặc thì ''
// phụ kiện đang đeo + nội tại đã cộng → thuộc tính cộng thêm
// điểm nội tại: cứ 3 cấp MU được 1 điểm (trước là mỗi cấp 1 điểm)
const pasTotal=lv=>Math.floor((lv-1)/3), pasUsed=r=>Object.values(r.pas||{}).reduce((a,v)=>a+v,0), pasPts=r=>Math.max(0,pasTotal(r.lv)-pasUsed(r));
C.hook('login',pl=>{ const r=pl.prof&&pl.prof.mu; if(!r||!r.pas||pasUsed(r)<=pasTotal(r.lv)) return; r.pas={}; markDirty(pl); setTimeout(()=>{ if(pl.prof) note(pl,`⭐ Điểm nội tại tính lại: cứ 3 cấp MU được 1 điểm. Đã hoàn lại hết, bấm ⭐ Nội tại cộng lại ${pasTotal(r.lv)} điểm nhé`,'quest'); },3600); });
function extraOf(p){ const r=rec(p), o={hp:0,mp:0,atk:0,def:0,armor:0,gw:0,regen:0,crit:0,drain:0,aspd:0,slowp:0,chainp:0,aura:0,shred:0,tdmg:0,cdr:0,spell:0};
  { const lg=lgOf(p), LB=lg&&M.legacy[lg].bonus; if(LB) for(const [s,v] of Object.entries(LB)) if(!['hp','mp','atk','def'].includes(s)) o[s]+=v; }   /* chỉ số phụ của set legacy (máu / mana / công / thủ đã tính trong muStats) */
  for(const k of Object.values(r.acc||{})){ const a=M.acc[k]; if(a) for(const [s,v] of Object.entries(a.bonus)) o[s]+=v; }
  for(const pp of [r.pas||{},r.pasB||{}]) for(const [k,n] of Object.entries(pp)){ const P=M.passive[k]; if(P) o[P.stat]+=P.per*n; }   /* điểm nội tại + cấp đọc sách */
  const w=M.weapons[r.wep]; if(w&&w.bonus) for(const [s,v] of Object.entries(w.bonus)) o[s]+=v;   /* chỉ số phụ của vũ khí Thợ Rèn */
  const my=S.mythOf(p.look&&p.look.mount,p); if(my&&p.horse&&p.horse.own) for(const [s,v] of Object.entries(my.bonus)) o[s]+=v;   /* thần thú đang chọn */
  if(S.legendOwn(p,'pod')){ o.hp+=1.5; o.mp+=1.5; o.atk+=1.5; o.def+=1.5; }   /* Cái Pod của Kaixa: +150% mọi chỉ số */
  if(S.legendOwn(p,'airpod')) o.spell+=S.LEGEND.items.airpod.spell;   /* Airpod của VNPT: sức mạnh chiêu +500% */
  // cấp cường hoá của đồ đang dùng: vũ khí, áo (giáp class / set legacy), 4 phụ kiện
  const enh=r.enh||{}, addE=k=>{ const L=k&&enh[k]; if(!L) return; const per=S.ENH.per[S.enhKind(k)]; if(per) for(const [s,v] of Object.entries(per)) o[s]+=v*L; };
  { const tp=p.look&&p.look.outfit&&p.look.outfit.top; addE(r.wep); addE((M.legacy[tp]&&M.legacy[tp].base)||tp); }   /* form Kamen Rider dùng chung cường hoá của set gốc */ for(const k of Object.values(r.acc||{})) addE(k);
  return o; }
const syncAcc=p=>{ if(p.look) p.look.acc={...(rec(p).acc||{})}; };   // để người khác thấy phụ kiện (gửi kèm ngoại hình)
// vũ khí Thợ Rèn đang cầm (+ cấp cường hoá) gửi kèm ngoại hình: ai cũng thấy trên tay, bộ đồ bỏ vũ khí vẽ sẵn
const syncWep=p=>{ if(!p.look) return; const r=rec(p), w=M.weapons[r.wep]; if(w&&w.store){ p.look.wep=r.wep; p.look.wl=(r.enh||{})[r.wep]||0; } else { delete p.look.wep; delete p.look.wl; } };
const lgOf=p=>{ const k=p.look&&p.look.outfit&&p.look.outfit.top; return k&&M.legacy[k]?k:''; };
function st(pl){ const r=rec(pl.prof); if(!r.cls) return null; const C0=M.cls[r.cls], ex=extraOf(pl.prof), s=S.muStats(r.cls,r.lv,r.fruit,r.wep,lgOf(pl.prof),ex); if(!pl.mus) pl.mus={hp:s.hp,mp:s.mp,cd:{},buff:{},dead:0};
  const m=pl.mus; m.crit=Math.min(.75,.1+ex.crit); m.drain=Math.min(.5,ex.drain); m.shred=Math.min(C0.shred?.8:.6,ex.shred+(C0.shred||0)); m.tdmg=Math.min(1,ex.tdmg); m.cdr=Math.min(.4,ex.cdr); m.spell=Math.min(S.legendOwn(pl.prof,'airpod')?7:2,ex.spell); m.slowp=Math.min(C0.slowp?1:.6,ex.slowp+(C0.slowp||0)); m.chainp=Math.min(.6,ex.chainp); m.aura=Math.min(.3,ex.aura); m.armor=Math.min(C0.armorCap||.6,ex.armor+(C0.armor||0)+((m.buff.giap||0)>now()?.2:0)); m.gw=Math.min(.6,ex.gw+(C0.gw||0));   /* chỉ số phụ đồ MU + của class, có trần; Bật Giáp +20% giáp */
   m.regen=(1+ex.regen)*(C0.regen||1);   /* đánh gần hồi máu nhanh hơn */ m.max=s.hp; m.mmax=s.mp; m.atk=s.atk; m.aspd=s.aspd; m.def=s.def*((m.buff.def||0)>now()?2:1); m.hp=Math.min(m.hp,m.max); m.mp=Math.min(m.mp,m.mmax);
  const OF=offOf(pl.prof); m.off=OF; m.pierce=(OF&&OF.pierce)||0; if(OF&&OF.rage&&(m.rageU||0)>now()){ const G=OF.rage; m.drain=Math.max(m.drain,G.drain); m.atk=Math.round(m.atk*(1+G.atk)); m.crit=Math.min(.75,m.crit+G.crit); }   /* Mặt Nạ Quỷ: đang khát máu */
  return m; }
// Kamen Rider: đang đánh thì cứ 5 giây biến sang form kế tiếp (đổi bộ đồ + chỉ số), ai cũng thấy
function krTick(pl,t){ const p=pl.prof, top=p.look&&p.look.outfit&&p.look.outfit.top, L=top&&M.legacy[top]; if(!L||L.kr==null) return; if(!pl.krNext||t-pl.krNext>15000){ pl.krNext=t+5000; return; } if(t<pl.krNext) return;
  pl.krNext=t+5000; const n='lg_kr'+((L.kr+1)%6), N=M.legacy[n]; p.look.outfit.top=n; if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); push(pl); bcast({t:'mufx',k:'krform',to:pl.pid,name:N.form,i:N.kr}); }
// món tay trái đang đeo (khiên, mặt nạ, búa, đao, động cơ, đũa) → dữ liệu MU.acc
const offOf=p=>{ const k=rec(p).acc&&rec(p).acc.shield; return (k&&M.acc[k])||null; };
// chiêu: 1–3 theo class, 4 Trái Ác Quỷ (nếu đã ăn), 5 chiêu riêng của set legacy đang mặc
const skillsOf=(r,p)=>{ const L=[...(M.skills[r.cls]||[])]; L[3]=r.fruit&&F[r.fruit]?F[r.fruit].skill:null; const lg=p&&lgOf(p); L[4]=lg?M.legacy[lg].skill:null; return L; };
function view(pl){ const r=rec(pl.prof), m=st(pl); if(!m) return {cls:''}; const t=now();
  return {cls:r.cls,lv:r.lv,exp:r.exp,next:M.lvExp(r.lv),aspd:m.aspd,fx:fxOf(m,t),sub:{regen:+(M.regen.hp*(m.regen||1)).toFixed(4),gw:m.gw,armor:m.armor,crit:m.crit,drain:m.drain,shred:m.shred,tdmg:m.tdmg,cdr:m.cdr,spell:m.spell,slowp:m.slowp,chainp:m.chainp,aura:m.aura},hp:Math.round(m.hp),max:m.max,mp:Math.round(m.mp),mmax:m.mmax,cd:Object.fromEntries(Object.entries(m.cd).map(([k,v])=>[k,Math.max(0,v-t)])),
    buff:(m.buff.def||0)>t?m.buff.def-t:0,dead:m.dead>t?m.dead-t:0,duel:pl.muDuel?pl.muDuel.other:0,w:r.w,l:r.l,fruit:r.fruit||'',wep:r.wep||'',lg:lgOf(pl.prof),enh:r.enh||{},acc:r.acc||{},accOwned:r.accOwned||{},pas:r.pas||{},pasB:r.pasB||{},sp:pasPts(r),crit:m.crit,cp:powerOf(pl.prof),atk:m.atk,def:m.def}; }   /* lực chiến tính 1 kiểu với bảng xếp hạng (powerOf) */
const push=pl=>send(pl,{t:'mume',v:view(pl)});
const inScene=()=>{ const out=[...C.sceneOf('mu'),...C.sceneOf('muw')]; for(const id of EXTRA_SCENES) out.push(...C.sceneOf(id)); return out; };
const bcast=obj=>{ for(const q of inScene()) send(q,obj); };
const dist=(pl,x,y)=>Math.hypot(pl.x/T-x,pl.y/T-y);
function gainMu(pl,n){ const r=rec(pl.prof); r.exp+=n; let up=0; while(r.lv<M.maxLv&&r.exp>=M.lvExp(r.lv)){ r.exp-=M.lvExp(r.lv); r.lv++; up++; } if(up){ const m=st(pl); if(m){ m.hp=m.max; m.mp=m.mmax; } note(pl,`⬆ MU lên cấp ${r.lv}! Máu, công, thủ tăng · +${pasTotal(r.lv)-pasTotal(r.lv-up)} điểm nội tại (bấm ⭐ Nội tại ở góc chiêu)`,'quest'); } markDirty(pl); }
function down(pl,why){ const m=pl.mus; if(!m||m.dead>now()) return; m.hp=0; m.fx={}; m.dead=now()+M.respawn*1000; bcast({t:'mufx',k:'down',to:pl.pid}); note(pl,`💀 ${why}. Hồi sinh ở cổng thành sau ${M.respawn} giây`,'lock'); if(pl.muDuel) duelEnd(players.get(pl.muDuel.other),pl); push(pl); }

/* ---------- boss: lịch xuất hiện, bảng đòn, giai đoạn ---------- */
const LIVE=new Map(), NEXT={}, RESPAWN={f:null}; let SEQ=1;   // RESPAWN.f(pl) → [cảnh, x, y] hồi sinh riêng (D-Day)
const nextAt=(b,t)=>b.perma?t+4000:Math.ceil((t-(b.offset||0)+1)/b.every)*b.every+(b.offset||0);
for(const [id,b] of Object.entries(BS)) NEXT[id]=b.summon?null:nextAt(b,now());   /* boss được gọi ra (Songoku) không có lịch riêng */   /* lần đầu ra theo lịch lệch nhau; sau đó hạ xong / bỏ đi thì hồi lại đủ b.every mới ra tiếp */
const radius=(b,B)=>(b.big?2.2:1.6)*Math.min(2.4,(B&&formOf(B).size)||1);
const formOf=B=>(B.form&&(BS[B.id].forms||[]).find(f=>f.k===B.form))||{};   /* dạng đang hoá (Titan, Hung Thủ Áo Đen, Bạch Yêu) */
const scOf=B=>BS[B.id].scene||'mu';
function phaseOf(B){ const k=B.hp/B.max, P=BS[B.id].phases; return k<P[1]?3:k<P[0]?2:1; }
function bossView(B){ const b=BS[B.id], F=formOf(B), t=now(), po=B.pochU>t; return {id:B.id,name:b.name,sprite:po?'pochita':F.sprite||b.sprite,big:po?0:b.big||0,scene:scOf(B),form:po?'pochita':B.form||'',fname:po?'Pochita':F.name||'',spin:B.spinU>t?B.spinU-t:0,gulp:B.gulp?B.gulp.pid:0,chick:B.chickU>t?B.chickU-t:0,sil:B.silU>t?B.silU-t:0,cup:B.cupU>t?B.cupU-t:0,spinR:b.spin?b.spin.r:0,guard:B.guardU>t?B.guardU-t:0,tint:F.tint||'',size:F.size||1,fly:B.buffU>t&&B.fly?1:0,ghost:B.ghostU>t?(B.ghostA.r||3):0,stun:B.stunU>t?B.stunU-t:0,dive:B.diveU>t?B.diveU-t:0,say:B.say&&t-B.say.t<3500?B.say.txt:'',ts:t,
  mins:(B.mins||[]).map(m=>[m.id,m.k,+m.x.toFixed(2),+m.y.toFixed(2),Math.round(m.hp/m.max*100)]),shots:(B.shots||[]).map(o=>[+o.x.toFixed(2),+o.y.toFixed(2),o.vx,o.vy,o.pk?1:0]),hp:Math.round(B.hp),max:B.max,x:B.x,y:B.y,phase:B.phase,anim:B.anim,until:B.until,slow:B.slow>now()?1:0,
  tele:B.tele.map(z=>({id:z.id,k:z.k,kind:z.kind,x:+z.x.toFixed(2),y:+z.y.toFixed(2),r:z.r,r0:z.r0,ang:z.ang,range:z.range,cone:z.cone,w:z.w,dash:z.dash,lock:z.lock,at:z.at,end:z.end||0,x0:z.x0,y0:z.y0,x1:z.x1,y1:z.y1,sx:z.sx,sy:z.sy,sr:z.sr}))}; }
const allView=()=>({list:[...LIVE.values()].map(bossView),next:NEXT});
const pushBoss=()=>bcast({t:'muboss',v:allView()});
const HARD=M.bossHard||{hp:1,dmg:1,warn:1,r:1,cd:1};
function spawn(id,quiet){ const b=BS[id], n=inScene().filter(q=>q.scene===(b.scene||'mu')&&rec(q.prof).cls).length, max=Math.round((b.hp+b.perPlayer*Math.max(0,n-1))*HARD.hp), t=now();
  const B={id,hp:max,max,x:b.home.x,y:b.home.y,until:b.perma?t+3e10:t+b.life,dmg:new Map(),cd:{},tele:[],anim:{k:'spawn',t},phase:1,slow:0,mins:[],shots:[],fightAt:0,form:''};
  b.attacks.forEach((a,i)=>B.cd[a.k]=t+(a.first?a.first*1000:2500+i*1500)); LIVE.set(id,B);
  if(quiet) return; if(b.perma){ bcast({t:'note',msg:`⚔ ${b.name} đã xuất hiện ở ${S.MU.west.zones[Object.keys(S.MU.west.zones).find(k=>{ const z=S.MU.west.zones[k]; return b.home.x>=z.x0&&b.home.x<=z.x1&&b.home.y>=z.y0&&b.home.y<=z.y1; })]?.name||'Đất Phía Tây'}!`,kind:'quest'}); pushBoss(); return; }
  C.broadcastAll({t:'note',msg:id==='luffy'?`👑 Boss tổng ${b.name} vừa xuất hiện ở MU Online! Gọi Grab "vào game" đánh boss, hạ được rơi Trái Ác Quỷ`:`⚔ Boss phụ ${b.name} vừa xuất hiện ở MU Online!`,kind:'quest'}); pushBoss(); }
const alive=sc=>{ const t=now(); return inScene().filter(q=>(!sc||q.scene===sc)&&q.mus&&q.mus.dead<=t&&!(q.mus.safe>t)&&rec(q.prof).cls); };   /* safe: vừa hồi sinh, boss chưa đánh */
// chọn mục tiêu trong khu của boss
const inArea=(a,x,y)=>x>=a.x0-1&&x<=a.x1+1&&y>=a.y0-1&&y<=a.y1+1;
function targets(B,range){ const a=BS[B.id].area; return alive(scOf(B)).filter(q=>inArea(a,q.x/T,q.y/T)&&dist(q,B.x,B.y)<=range); }
// vận tốc từng người (ô/giây, làm mượt) để boss ngắm đón đầu chỗ người đó sắp chạy tới; dịch chuyển / hồi sinh thì bỏ qua
function track(t){ for(const q of alive()){ const x=q.x/T, y=q.y/T, v=q.bv||(q.bv={x,y,t,vx:0,vy:0}), dt=(t-v.t)/1000; if(dt<.15) continue;
  const vx=(x-v.x)/dt, vy=(y-v.y)/dt; if(Math.hypot(vx,vy)>14){ v.vx=0; v.vy=0; } else { v.vx=v.vx*.4+vx*.6; v.vy=v.vy*.4+vy*.6; } v.x=x; v.y=y; v.t=t; } }
const clampA=(b,x,y)=>[Math.max(b.area.x0+.5,Math.min(b.area.x1-.5,x)),Math.max(b.area.y0+.5,Math.min(b.area.y1-.5,y))];
const lead=(B,q,sec)=>{ const v=q.bv||{vx:0,vy:0}, k=Math.min(sec,1.4)*.8; return clampA(BS[B.id],q.x/T+v.vx*k,q.y/T+v.vy*k); };
function startAttack(B,a,t,mul){ const b=BS[B.id], F=formOf(B), warn=(a.warn||0)*HARD.warn*(B.slow>t?1.5:1), r=(a.r||0)*HARD.r, z={id:SEQ++,k:a.k,kind:a.kind,dmg:(a.dmg||0)*mul*HARD.dmg,pct:a.pct||0,at:t+warn*1000,then:a.then,fx:F.dot?{...(a.fx||{}),dot:F.dot}:a.fx,sw:a.swallow};
  if(a.say) B.say={txt:a.say[Math.floor(Math.random()*a.say.length)],t};
  const RC=a.far||b.reach||0, RM=F.rangeMul||1, near=rg=>targets(B,rg*RM+RC).sort((u,v)=>dist(u,B.x,B.y)-dist(v,B.x,B.y))[0], any=()=>{ const L=targets(B,14); return L[Math.floor(Math.random()*L.length)]; };
  if(a.kind==='single'){ const q=near(a.range); if(!q) return false; const [x,y]=lead(B,q,warn); Object.assign(z,{x,y,r}); B.tele.push(z); if(a.shot) B.lastShot={x0:B.x,y0:B.y,x1:x,y1:y,t}; }   /* nhớ đường đạn (Conan lướt theo) */
  else if(a.kind==='circle'||a.kind==='jump'){ const q=any(); if(!q) return false; const [x,y]=lead(B,q,warn); Object.assign(z,{x,y,r}); B.tele.push(z); }
  else if(a.kind==='chase'){ const q=any(); if(!q) return false; Object.assign(z,{x:q.x/T,y:q.y/T,r,tgt:q.pid,lock:z.at-a.lock*1000}); B.tele.push(z); }   /* bám theo người tới sát giờ nổ */
  else if(a.kind==='multi'){ const L=targets(B,14); if(!L.length) return false; for(let i=0;i<a.n;i++){ const q=L[i%L.length], [px,py]=lead(B,q,warn), j=i>=L.length; B.tele.push({...z,id:SEQ++,x:px+(j?(Math.random()-.5)*5:0),y:py+(j?(Math.random()-.5)*3:0),r}); } }
  else if(a.kind==='trail'){ const q=near(14); if(!q) return false; const [tx,ty]=lead(B,q,warn+a.n*a.step/2000), ang=Math.atan2(ty-B.y,tx-B.x), d=Math.max(3,Math.hypot(tx-B.x,ty-B.y)+2);
    for(let i=0;i<a.n;i++){ const [x,y]=clampA(b,B.x+Math.cos(ang)*d*(i+1)/a.n,B.y+Math.sin(ang)*d*(i+1)/a.n); B.tele.push({...z,id:SEQ++,kind:'circle',x,y,r,at:z.at+i*a.step}); } }
  else if(a.kind==='line'){ const q=near(a.range+2); if(!q) return false; const [tx,ty]=lead(B,q,warn); Object.assign(z,{x:B.x,y:B.y,ang:Math.atan2(ty-B.y,tx-B.x),range:a.range*RM+RC,w:a.w*HARD.r,dash:a.dash?1:0});
    const L=a.alongShot&&B.lastShot; if(L&&t-L.t<5000){ const vx=L.x1-L.x0, vy=L.y1-L.y0, l2=vx*vx+vy*vy||1, k=Math.max(0,Math.min(1,((B.x-L.x0)*vx+(B.y-L.y0)*vy)/l2)); if(Math.hypot(B.x-(L.x0+vx*k),B.y-(L.y0+vy*k))<1.6){ z.ang=Math.atan2(vy,vx); z.guard=a.guard; } }   /* đang đứng trên đường đạn: lướt dọc theo nó, xong được hộ thể */
    B.tele.push(z); }
  else if(a.kind==='cross'){ const q=near(a.range+2); if(!q) return false; const n=a.n||4, a0=Math.atan2(q.y/T-B.y,q.x/T-B.x);
    for(let w=0;w<(a.waves||1);w++) for(let i=0;i<n;i++) B.tele.push({...z,id:SEQ++,kind:'line',x:B.x,y:B.y,ang:a0+i*2*Math.PI/n+w*Math.PI/n,range:a.range,w:a.w*HARD.r,at:z.at+w*(a.gap||600)}); }
  else if(a.kind==='donut'){ if(!targets(B,a.r+3).length) return false; Object.assign(z,{x:B.x,y:B.y,r,r0:a.r0}); B.tele.push(z); }
  else if(a.kind==='cone'){ const q=near(a.range); if(!q) return false; const [tx,ty]=lead(B,q,warn); Object.assign(z,{x:B.x,y:B.y,ang:Math.atan2(ty-B.y,tx-B.x),range:a.range*RM+RC,cone:a.cone,hits:a.hits,tick:a.tick*1000,end:z.at+a.hits*a.tick*1000}); B.tele.push(z); }
  else if(a.kind==='ring'){ const rr=r*(1+(RM-1)*.5)+RC; if(!targets(B,rr+3).length) return false; Object.assign(z,{x:B.x,y:B.y,r:rr}); B.tele.push(z); }
  else if(a.kind==='blink'){ const q=any(); if(!q) return false; const ox=B.x, oy=B.y, dx=q.x/T-B.x, dy=q.y/T-B.y, d=Math.hypot(dx,dy)||1; [B.x,B.y]=clampA(b,q.x/T+dx/d*1.3,q.y/T+dy/d*1.3); Object.assign(z,{x:q.x/T,y:q.y/T,r}); B.tele.push(z); bcast({t:'mufx',k:'blink',boss:B.id,x:B.x,y:B.y,ox,oy}); }   /* mở cửa ra ngay sau lưng */
  else if(a.kind==='ghost'){ if(!targets(B,12).length) return false; B.ghostU=t+a.dur*1000; B.ghostA={r:r||a.r,dmg:a.dmg*mul*HARD.dmg,fx:a.fx,tick:a.tick*1000,next:t}; B.anim={k:a.k,t,at:t+300}; return true; }   /* bóng ma: miễn sát thương + toả độc */
  else if(a.kind==='gulp'){ if(B.gulp) return false; const q=any(); if(!q||!q.mus) return false; const F=q.mus.fx||(q.mus.fx={}); F.stun=t+a.dur*1000; F.imm=F.stun+1500;   /* nuốt chửng: giữ người trong bụng boss */
    B.gulp={pid:q.pid,until:t+a.dur*1000,next:t+1000,pct:a.pct,k:a.k}; holdIn(B,q); bcast({t:'mufx',k:'gulp',boss:B.id,to:q.pid,dur:a.dur}); bcast({t:'mufx',k:'pfx',to:q.pid,...fxOf(q.mus,t)}); note(q,`😱 Bị ${b.name} nuốt chửng! ${a.dur} giây nữa mới thoát`,'lock'); B.anim={k:a.k,t,at:t+300}; return true; }
  else if(a.kind==='buff'){ if(!targets(B,12).length) return false; B.buffU=t+a.dur*1000; B.dodgeB=a.dodge||0; B.fly=a.fly?1:0; B.anim={k:a.k,t,at:t+300}; return true; }
  else if(a.kind==='grab'){ const q=near(6); if(!q) return false; const [x,y]=lead(B,q,warn); Object.assign(z,{x,y,r}); B.tele.push(z); }
  else if(a.kind==='flood'){ if(!targets(B,a.r).length) return false; Object.assign(z,{x:B.x,y:B.y,r}); B.tele.push(z); }
  else if(a.kind==='bullets'){ if(!targets(B,16).length) return false; const o=Math.random()*6.28; for(let i=0;i<a.n;i++){ const an=o+i*2*Math.PI/a.n; B.shots.push({x:B.x,y:B.y-.6,vx:+(Math.cos(an)*a.speed).toFixed(2),vy:+(Math.sin(an)*a.speed).toFixed(2),until:t+3500,dmg:a.dmg*mul*HARD.dmg,k:a.k}); } B.anim={k:a.k,t,at:t+200}; return true; }
  else if(a.kind==='summon'){ if(!targets(B,16).length) return false; summonMin(B,a.minion,a.n,t); B.anim={k:a.k,t,at:t+400}; return true; }
  else if(a.kind==='rain'){ const L=targets(B,16); if(!L.length) return false; const ar=b.area;
    for(let i=0;i<a.n;i++){ const q=i<L.length*2?L[i%L.length]:null, [x,y]=q?lead(B,q,warn+i*.05):[ar.x0+1+Math.random()*(ar.x1-ar.x0-2),ar.y0+1+Math.random()*(ar.y1-ar.y0-2)], j=q&&i>=L.length;
      B.tele.push({...z,id:SEQ++,kind:'circle',x:x+(j?(Math.random()-.5)*3:0),y:y+(j?(Math.random()-.5)*2:0),r,at:z.at+i*60}); } }
  B.anim={k:a.k,t,at:z.at}; return true; }
// hiệu ứng lên người chơi: choáng (đứng yên, không ra đòn; hết choáng thì miễn choáng 1,5 giây), chậm đi, chậm đánh (hồi chiêu ×), mất máu mỗi giây (độc / thiêu đốt)
function applyFx(q,fx,t,B){ const m=st(q); if(!m||m.dead>t) return; const F=m.fx||(m.fx={}), dur=(fx.dur||3)*1000, stun=fx.stun&&(fx.stunChance==null||Math.random()<fx.stunChance)?fx.stun:0;
  if(stun&&!(F.imm>t)){ F.stun=t+stun*1000; F.imm=F.stun+1500; }
  if(fx.slow) F.slow={until:t+dur,mul:Math.min(fx.slow,F.slow&&F.slow.until>t?F.slow.mul:1)};
  if(fx.aslow) F.aslow={until:t+dur,mul:Math.max(fx.aslow,F.aslow&&F.aslow.until>t?F.aslow.mul:1)};
  if(fx.dot){ const on=F.dot&&F.dot.until>t; F.dot={until:Math.max(t+fx.dot.dur*1000,on?F.dot.until:0),pct:fx.dot.pct,k:fx.dot.k,hits:on?F.dot.hits||0:0}; }
  bcast({t:'mufx',k:'pfx',to:q.pid,...fxOf(m,t)}); push(q); }
const fxOf=(m,t)=>{ const F=(m&&m.fx)||{}; return {stun:F.stun>t?F.stun-t:0,slow:F.slow&&F.slow.until>t?F.slow.mul:1,slowMs:F.slow&&F.slow.until>t?F.slow.until-t:0,aslow:F.aslow&&F.aslow.until>t?F.aslow.mul:1,dot:F.dot&&F.dot.until>t?F.dot.k:'',dotMs:F.dot&&F.dot.until>t?F.dot.until-t:0}; };
const gwOf=(m,t)=>m&&m.fx&&m.fx.gw&&m.fx.gw.until>t?m.fx.gw.mul:0;   // người chơi đang bị giảm hồi máu
const aslowOf=(m,t)=>m.fx&&m.fx.aslow&&m.fx.aslow.until>t?m.fx.aslow.mul:1, stunned=(m,t)=>!!(m.fx&&m.fx.stun>t);
function dotTick(pl,m,t){ const D=m.fx&&m.fx.dot; if(!D||D.until<=t||m.safe>t) return false; const d=Math.max(1,Math.round(m.max*D.pct*.5)); m.hp-=d; bcast({t:'mufx',k:'hurt',to:pl.pid,dmg:d,dot:D.k});
  if(m.hp<=0){ down(pl,D.k==='doc'?'Trúng độc':'Bị thiêu đốt'); return true; } push(pl); return false; }
// Titan bắt người nuốt chửng: rơi mất tiền + gục
function swallow(B,q,z){ const p=q.prof, [a0,a1]=z.sw||[200000,500000], loss=Math.min(p.money,Math.round((a0+Math.random()*(a1-a0))/1000)*1000); if(loss>0) take(q,loss);
  bcast({t:'mufx',k:'swallow',boss:B.id,to:q.pid,loss}); down(q,`Bị ${formOf(B).name||BS[B.id].name} bắt nuốt chửng${loss?`, rơi mất ${fmt(loss)}`:''}`); markDirty(q); }
// choáng mục tiêu (Đập Choáng của Đại Tượng, phát bắn Tiên Nữ): boss đứng im, thôi ra đòn mới, hết choáng thì miễn choáng 4 giây; quái / lính / người đội kia qua X0.stun.
// mobOnly: chỉ choáng quái, không choáng người (D-Day)
function stunT(B,X0,sec,t,mobOnly){ if(B){ if(B.stunImm>t||B.ghostU>t||B.diveU>t||B.cupU>t||BS[B.id].basicOnly) return false; B.stunU=t+sec*1000; B.stunImm=B.stunU+4000; pushBoss(); }
  else if(X0&&X0.stun&&!(mobOnly&&X0.pvp)) X0.stun(sec); else return false;
  bcast({t:'mufx',k:'pstun',x:B?B.x:X0.x,y:B?B.y:X0.y,dur:sec,boss:B?B.id:'',to:B?'boss:'+B.id:''}); return true; }
// khoá chiêu (Đũa Thần Howard Le): boss thôi ra đòn mới (vẫn đi), quái / lính đứng im; boss miễn phép (Quỷ Cưa) thì không dính
function silence(B,X0,sec,t){ if(B){ if(BS[B.id].basicOnly) return; B.silU=t+sec*1000; } else if(X0&&X0.stun&&!X0.pvp) X0.stun(sec); else return; bcast({t:'mufx',k:'silence',x:B?B.x:X0.x,y:B?B.y:X0.y,boss:B?B.id:'',dur:sec}); if(B) pushBoss(); }
// Phun Lửa (Tiên Nữ): mục tiêu giảm hồi máu sk.gw + quái / boss đánh yếu đi sk.weak trong sk.wdur giây
function debuff(B,X0,sk,t){ const u=t+(sk.wdur||5)*1000; if(B){ if(BS[B.id].basicOnly) return; if(sk.gw) B.gw={until:u,mul:Math.max(sk.gw,B.gw&&B.gw.until>t?B.gw.mul:0)}; if(sk.weak) B.weak={until:u,mul:sk.weak}; }
  else if(X0){ if(sk.gw&&X0.wound) X0.wound(sk.gw); if(sk.weak&&X0.weak) X0.weak(sk.weak,sk.wdur||5); } }
const weakOf=(o,t)=>o&&o.weak&&o.weak.until>t?1-o.weak.mul:1;
// chiêu lan (Phun Lửa): quái / boss khác trong sk.aoe ô quanh mục tiêu dính 60% sát thương + cùng hiệu ứng
function splash(pl,sk,cx,cy,B0,X0,d,t){ const pts=[], dd=Math.max(1,Math.round(d*.6));
  for(const src of EXTRA) if(src.around) for(const o of src.around(cx,cy,sk.aoe,6,X0&&X0.id,pl.scene)){ o.hit(dd,pl,sk); debuff(null,o,sk,t); pts.push([o.x,o.y,dd]); }
  for(const b2 of [...LIVE.values()]) if(b2!==B0&&scOf(b2)===pl.scene&&Math.hypot(b2.x-cx,b2.y-cy)<=sk.aoe+radius(BS[b2.id],b2)){ const x=dmgBoss(b2,pl,dd,t); if(x>0){ debuff(b2,null,sk,t); pts.push([b2.x,b2.y,x]); } }
  if(pts.length) bcast({t:'mufx',k:'psplash',from:pl.pid,x:cx,y:cy,r:sk.aoe,pts}); }
// Bật Giáp (Đại Tượng): phản lại boss / quái rừng một phần sát thương gốc vừa đánh vào mình (quái con của boss, lính D-Day, người thì không)
function reflect(q,rd,fx){ if(rd<1||!fx) return; const t=now();
  if(fx.boss&&fx.ak!=='bm'){ const B=LIVE.get(fx.boss); if(!B||scOf(B)!==q.scene) return; const x=dmgBoss(B,q,rd,t); if(x>0){ bcast({t:'mufx',k:'refl',from:q.pid,to:'boss:'+B.id,boss:B.id,dmg:x}); if(LIVE.has(B.id)) pushBoss(); } return; }
  if(fx.mob) for(const src of EXTRA) if(src.kind==='mob'&&src.byId){ const o=src.byId(fx.mob,q); if(o){ const to=o.hit(rd,q,{}); bcast({t:'mufx',k:'refl',from:q.pid,to,dmg:rd}); } } }
// hiệu ứng đồ MU khi đánh trúng: làm chậm mục tiêu 2 giây, giật sét lan 3 mục tiêu gần (60% sát thương), hào quang: đồng đội trong 6 ô hồi máu theo sát thương
function procs(pl,s,B,X0,d,t){ if(!(d>0)||!(B||X0)) return; const sc=pl.scene, cx=B?B.x:X0.x, cy=B?B.y:X0.y, imm=B&&BS[B.id].basicOnly;   /* imm: boss miễn hiệu ứng (Quỷ Cưa) */
  if(!imm&&s.slowp&&Math.random()<s.slowp){ if(B) B.slow=t+2000; else if(X0.slow) X0.slow(2); bcast({t:'mufx',k:'pslow',x:cx,y:cy}); }
  if(!imm&&s.gw){ if(B) B.gw={until:t+3000,mul:Math.max(s.gw,B.gw&&B.gw.until>t?B.gw.mul:0)}; else if(X0.wound) X0.wound(s.gw); }   /* giảm hồi máu 3 giây */
  if(s.chainp&&Math.random()<s.chainp){ const pts=[], dd=Math.max(1,Math.round(d*.6)); for(const src of EXTRA) if(src.around) for(const o of src.around(cx,cy,4,3,X0&&X0.id,sc)){ if(pts.length>=3) break; o.hit(dd,pl,{}); pts.push([o.x,o.y,dd]); }
    for(const b2 of [...LIVE.values()]) if(pts.length<3&&b2!==B&&scOf(b2)===sc&&Math.hypot(b2.x-cx,b2.y-cy)<=4+radius(BS[b2.id],b2)){ const x=dmgBoss(b2,pl,dd,t); if(x>0) pts.push([b2.x,b2.y,x]); }
    if(pts.length) bcast({t:'mufx',k:'pchain',from:pl.pid,x:cx,y:cy,pts}); }
  if(s.aura) for(const q of inScene()) if(q!==pl&&q.scene===sc&&q.mus&&q.mus.dead<=t&&q.mus.hp<q.mus.max&&dist(q,pl.x/T,pl.y/T)<=6){ q.mus.hp=Math.min(q.mus.max,q.mus.hp+Math.max(1,Math.round(d*s.aura))); push(q); }
  const C0=M.cls[rec(pl.prof).cls]||{}; if(C0.stunp&&Math.random()<C0.stunp) stunT(B,X0,C0.stunDur||.8,t,true);   /* Tiên Nữ: thi thoảng bắn choáng quái */
  const OF=s.off; if(OF&&OF.thor&&Math.random()<OF.thor.chance){ const mx=B?B.max:(X0.max||0); if(mx){ const dd=Math.max(1,Math.round(Math.min(mx*OF.thor.pct,OF.thor.cap?s.atk*OF.thor.cap:Infinity))); let hitOk=true; if(B) hitOk=dmgBoss(B,pl,dd,t,'thor')>0; else X0.hit(dd,pl,{});   /* Búa Thor: sét trừ % máu tối đa */
      if(hitOk) bcast({t:'mufx',k:'thor',from:pl.pid,x:cx,y:cy,dmg:dd}); } } }
// đọc sách nội tại: +1 cấp nội tại mỗi quyển, tới mức trần của nội tại đó; trả về số quyển đã đọc
function readBooks(pl,k,n){ const B=M.pasBook[k]; if(!B||!n) return 0; const r=rec(pl.prof), pb=r.pasB=r.pasB||{}, Pd=M.passive[B.pas], rd=Math.max(0,Math.min(n,Pd.max-(pb[B.pas]||0))); if(!rd) return 0;
  pb[B.pas]=(pb[B.pas]||0)+rd; if(pl.mus) st(pl); push(pl); return rd; }
// vào game: sách nội tại còn trong túi (mua từ trước) tự đọc luôn
C.hook('login',pl=>{ const p=pl.prof; if(!p||!p.mu||!p.items) return; let tot=0; for(const k of Object.keys(M.pasBook)){ const n=p.items[k]|0; if(!n) continue; const rd=readBooks(pl,k,n); if(rd){ addItem(pl,k,-rd); tot+=rd; } }
  if(tot){ markDirty(pl); setTimeout(()=>{ if(pl.prof) note(pl,`📚 Đã đọc ${tot} sách nội tại còn trong túi: lực chiến tăng`,'quest'); },3200); } });
// sát thương vào boss (mọi nguồn): né theo chong chóng tre / dạng hoá đen; trả về sát thương thật (0 = né)
const dodgeOf=(B,t)=>B.ghostU>t?1:Math.max(B.buffU>t?B.dodgeB||0:0,formOf(B).dodge||0);
// số lần đã hạ từng boss hôm nay (giờ Việt Nam thật)
const bossDay=p=>{ const day=S.realTime().day; if(!p.bossDay||p.bossDay.day!==day||p.bossDay.v!==2) p.bossDay={day,v:2,n:{}}; return p.bossDay; };
function bossTurn(pl,B){ if(B.dmg.has(pl.uid)) return true; const n=bossDay(pl.prof).n[B.id]||0, name=BS[B.id].name;
  if(M.bossPerDay&&n>=M.bossPerDay){ if(!pl.capWarn||now()-pl.capWarn>8000){ pl.capWarn=now(); note(pl,`🚫 Hôm nay bạn đã hạ ${name} đủ ${M.bossPerDay} lần: không gây sát thương, không nhận thưởng nữa. Mai quay lại nhé`,'lock'); } return false; }
  return true; }
// mã hiện chữ khi đánh trượt: 1 né, 2 hết lượt hôm nay, 3 bóng ma (miễn sát thương)
const missOf=d=>d>0?0:d===-1?2:d===-3?3:d===-4?4:d===-5?5:d===-6?6:1;
// trả về sát thương thật: 0 = boss né, -1 = hết lượt đánh boss này hôm nay, -3 = đang hoá bóng ma
function dmgBoss(B,pl,d,t,src){ if(!bossTurn(pl,B)) return -1; if(B.ghostU>t) return -3; if(B.diveU>t) return -4;   /* -4: đang lặn dưới nước */ if(B.cupU>t) return -6;   /* -6: đang trốn trong cốc mỳ */
  const bs=BS[B.id]; if(bs.spin&&!(B.pochU>t)){ const S0=bs.spin; B.hitT=(B.hitT||[]).filter(x=>t-x<S0.win*1000); B.hitT.push(t); if(B.hitT.length>=S0.hits&&!(B.spinU>t)&&t>=(B.spinCd||0)){ B.spinU=t+S0.dur*1000; B.spinCd=B.spinU+S0.cd*1000; B.spinNext=t; B.hitT=[]; bcast({t:'mufx',k:'bspin',boss:B.id,x:B.x,y:B.y}); } }   /* bị đánh dồn: xoay cưa */
  if(bs.rage&&t>=(B.rageCd||0)){ const G0=bs.rage; B.rageT=(B.rageT||[]).filter(x=>t-x<G0.win*1000); B.rageT.push(t);   /* bị đánh dồn: ra đòn nổi giận (Doraemon: mưa bánh rán) */
    if(B.rageT.length>=G0.hits){ B.rageT=[]; B.rageCd=t+G0.cd*1000; if(startAttack(B,G0.atk,t,B.phase===3?bs.enrage.mul:1)){ bcast({t:'mufx',k:'brage',boss:B.id,name:G0.atk.name}); pushBoss(); } } }
  const pr=(pl&&pl.mus&&pl.mus.pierce)||0;   /* Đũa Howard Le: giảm kháng phép của quái */
  if(bs.basicOnly&&src!=='basic'){ if(!(B.spinU>t&&bs.spin&&bs.spin.resist!=null)) return -5; d=Math.max(1,Math.round(d*(1-Math.max(0,bs.spin.resist-pr)))); }   /* -5: miễn phép, chỉ đánh thường mới mất máu; đang xoay cưa thì phép vào được 50% */
  for(const G of [B.guardU>t&&B.guard,formOf(B).guard]) if(G) d=Math.max(1,Math.round(d*(1-(src==='basic'?G.armor:Math.max(0,G.resist-pr)))));   /* hộ thể: giáp giảm đòn đánh thường, kháng phép giảm chiêu / Lính Cát / hiệu ứng */ if(Math.random()<dodgeOf(B,t)) return 0;   /* -3: đang là bóng ma */ B.hp-=d; B.dmg.set(pl.uid,(B.dmg.get(pl.uid)||0)+d); if(B.hp<=0) bossDie(B,pl); return d; }
// người bị nuốt: dính vào giữa người boss; nhổ ra cạnh boss khi hết giờ / boss chết / người gục
function holdIn(B,q){ q.x=B.x*T; q.y=B.y*T; q.budget=0; send(q,{t:'pos',x:q.x,y:q.y}); }
function gulpTick(B,t){ const G=B.gulp; if(!G) return; const q=players.get(G.pid), dead=!q||!q.mus||q.mus.dead>t||q.scene!==scOf(B);
  if(dead||t>=G.until){ B.gulp=null; if(!dead){ const [x,y]=clampA(BS[B.id],B.x+(Math.random()<.5?-2:2),B.y+1); q.x=x*T; q.y=y*T; q.budget=0; send(q,{t:'pos',x:q.x,y:q.y}); if(q.mus.fx) q.mus.fx.stun=0; bcast({t:'mufx',k:'pfx',to:q.pid,...fxOf(q.mus,t)}); push(q); } bcast({t:'mufx',k:'spit',boss:B.id,to:G.pid,x:B.x,y:B.y}); return; }
  holdIn(B,q); if(t>=G.next){ G.next=t+1000; hurtPct(B,q,G.pct,G.k); } }
// Quỷ Bom Reze thả bom hạt nhân lúc Quỷ Cưa hoá Pochita: phủ cả khu boss, chừa vòng an toàn sát Pochita
function nuke(Rz,B,N,t){ const ar=BS[Rz.id].area; Rz.tele.push({id:SEQ++,k:'nuke',kind:'nuke',x:(ar.x0+ar.x1)/2,y:(ar.y0+ar.y1)/2,x0:ar.x0,y0:ar.y0,x1:ar.x1,y1:ar.y1,sx:B.x,sy:B.y,sr:N.safe,dmg:N.dmg*HARD.dmg,at:t+N.warn*1000,fx:N.fx});
  Rz.anim={k:'nuke',t,at:t+600}; for(const q of inScene()) if(q.scene===scOf(Rz)) note(q,`☢ ${BS[Rz.id].name} thả BOM HẠT NHÂN! Chạy lại nấp sát Pochita!`,'lock'); }
// boss gọi boss khác ra đánh cùng (Rồng Dải Xanh → Songoku): đứng cạnh boss gọi, ở lại ít nhất bằng boss gọi
function callBoss(B,k,t){ const c=BS[k]; if(!c||LIVE.has(k)) return; spawn(k,true); const G=LIVE.get(k); if(!G) return; [G.x,G.y]=clampA(c,B.x+2.4,B.y-1.2); G.until=Math.max(G.until,B.until); G.anim={k:'spawn',t};
  bcast({t:'mufx',k:'bcall',boss:k,from:B.id,x:G.x,y:G.y}); for(const q of inScene()) if(q.scene===scOf(B)) note(q,`⚠ ${BS[B.id].name} gọi ${c.name} ra trợ chiến!`,'lock'); pushBoss(); }
// đổi dạng: máu ×hpMul (giữ % máu), nói câu thoại, gọi quái con
function transform(B,f,t){ const b=BS[B.id]; B.form=f.k; if(f.hpMul){ B.max=Math.round(B.max*f.hpMul); B.hp=Math.round(B.hp*f.hpMul); } if(f.say) B.say={txt:f.say,t}; B.anim={k:'form',t,at:t+900};
  for(const a of b.attacks) B.cd[a.k]=Math.min(B.cd[a.k]||t,t+1200); if(f.summon) summonMin(B,f.summon.k,f.summon.n,t); bcast({t:'mufx',k:'bform',boss:B.id,name:f.name,x:B.x,y:B.y});
  for(const q of inScene()) if(q.scene===scOf(B)) note(q,`⚠ ${b.name} hoá ${f.name}!${f.say?` "${f.say}"`:''}`,'lock'); }
// quái con: Pepe Con đuổi cắn, Trứng Laser đứng yên bắn tia về người gần nhất. Tối đa 20 con / boss
let MSEQ=1;
function summonMin(B,k,n,t){ const D=M.minions[k], b=BS[B.id]; const room=Math.max(0,20-B.mins.length);
  for(let i=0;i<Math.min(n,room);i++){ const an=i*2*Math.PI/n, [x,y]=clampA(b,B.x+Math.cos(an)*2.8,B.y+Math.sin(an)*2), hp=Math.max(50,Math.round(B.max*D.hpFrac)); B.mins.push({id:MSEQ++,k,x,y,hp,max:hp,next:t+900+i*120}); }
  bcast({t:'mufx',k:'summon',boss:B.id,mk:k,n}); }
function minionTick(B,t,dt){ const b=BS[B.id]; if(!B.mins.length) return false; const L=targets(B,30); let moved=false;
  for(const m of B.mins){ if(m.stun>t) continue; const D=M.minions[m.k], q=L.slice().sort((u,v)=>dist(u,m.x,m.y)-dist(v,m.x,m.y))[0]; if(!q) continue; const dx=q.x/T-m.x, dy=q.y/T-m.y, d=Math.hypot(dx,dy)||1;
    if(D.spd){ const an=m.id*2.39996, kr=D.keep||1.15, tx=q.x/T+Math.cos(an)*kr, ty=q.y/T+Math.sin(an)*kr*.74;   /* keep: đứng vây cách xa (lính bắn) */ let vx=tx-m.x, vy=ty-m.y;   /* mỗi con vây 1 hướng quanh người + đẩy nhau ra, không chồng lên nhau */
      for(const o of B.mins){ if(o===m) continue; const ox=m.x-o.x, oy=m.y-o.y, od=Math.hypot(ox,oy); if(od<1&&od>.001){ vx+=ox/od*(1-od)*4; vy+=oy/od*(1-od)*4; } }
      const vd=Math.hypot(vx,vy); if(vd>.12){ const sp=Math.min(vd,D.spd*dt); [m.x,m.y]=clampA(b,m.x+vx/vd*sp,m.y+vy/vd*sp); moved=true; } }
    if(t<m.next) continue;
    if(D.orb){ m.next=t+D.orb.every*1000; const O=D.orb, hs=[];   /* Ngọc Rồng: hồi máu cho các boss trong danh sách, toả độc + giảm hồi máu quanh ngọc */
      for(const id of O.to){ const H=LIVE.get(id); if(!H||scOf(H)!==scOf(B)||H.hp>=H.max) continue; H.hp=Math.min(H.max,H.hp+H.max*O.heal*(H.gw&&H.gw.until>t?1-H.gw.mul:1)); hs.push([H.x,H.y]); }
      for(const q of alive(scOf(B))) if(dist(q,m.x,m.y)<=O.r+BODY){ applyFx(q,O.fx,t,B); if(O.fx.gw&&q.mus){ const F=q.mus.fx||(q.mus.fx={}); F.gw={until:t+(O.fx.dot?O.fx.dot.dur:3)*1000,mul:O.fx.gw}; } }
      if(hs.length) bcast({t:'mufx',k:'orbheal',x:m.x,y:m.y,to:hs}); moved=true; continue; }
    if(D.shoot){ if(d>D.shoot.range) continue; const S0=D.shoot, ty=q.y/T-.5, dx2=q.x/T-m.x, dy2=ty-m.y, l=Math.hypot(dx2,dy2)||1; m.next=t+S0.every*1000*(.8+Math.random()*.4);   /* bắn đạn tròn đỏ hồng về người gần nhất */
      B.shots.push({x:m.x,y:m.y-.6,vx:+(dx2/l*S0.speed).toFixed(2),vy:+(dy2/l*S0.speed).toFixed(2),until:t+2400,dmg:S0.dmg*HARD.dmg,k:'hhshot',pk:1}); bcast({t:'mufx',k:'bmhit',boss:B.id,id:m.id}); moved=true; continue; }
    if(D.laser){ if(d>D.laser.range) continue; m.next=t+D.laser.every*1000; const [tx,ty]=lead(B,q,D.laser.warn); B.tele.push({id:SEQ++,k:'laser',kind:'line',x:m.x,y:m.y,ang:Math.atan2(ty-m.y,tx-m.x),range:D.laser.range,w:D.laser.w,dmg:D.laser.dmg*HARD.dmg,at:t+D.laser.warn*1000,mob:1}); moved=true; }
    else if(d<=D.range+BODY){ m.next=t+D.every*1000; hurtP(q,D.dmg*HARD.dmg*weakOf(B,t),`Bị ${D.name} cắn`,{ak:'bm',boss:B.id}); bcast({t:'mufx',k:'bmhit',boss:B.id,id:m.id,to:q.pid}); } }
  return moved; }
// đạn toả vòng tròn: bay thẳng, trúng người (tính cả thân) thì nổ
function shotTick(B,t,dt){ if(!B.shots.length) return false; const b=BS[B.id], L=alive(scOf(B));
  B.shots=B.shots.filter(o=>{ const x0=o.x, y0=o.y; o.x+=o.vx*dt; o.y+=o.vy*dt; if(t>o.until||!inArea(b.area,o.x,o.y)) return false;
    for(const q of L){ const px=q.x/T, py=q.y/T-.5, vx=o.x-x0, vy=o.y-y0, l2=vx*vx+vy*vy||1, k=Math.max(0,Math.min(1,((px-x0)*vx+(py-y0)*vy)/l2)); if(Math.hypot(px-(x0+vx*k),py-(y0+vy*k))<.6){ hurt(B,q,o.dmg,o.k); return false; } } return true; });
  return true; }
// quái con cũng là mục tiêu đánh được (đánh thường / chiêu / Lính Cát) như quái rừng
const minHit=(B,m)=>(d,pl)=>{ if(m.hp<=0) return 'bm:'+m.id; m.hp-=d; B.dmg.set(pl.uid,(B.dmg.get(pl.uid)||0)+Math.round(d*.25)); if(m.hp<=0){ B.mins=B.mins.filter(x=>x!==m); bcast({t:'mufx',k:'bmdie',boss:B.id,id:m.id,x:m.x,y:m.y}); gainMu(pl,8); } return 'bm:'+m.id; };
const asMin=(B,m,d)=>({id:m.id,x:m.x,y:m.y,d,max:m.max,def:M.minions[m.k].def||5,rad:.5,hit:minHit(B,m),slow:()=>{},stun:sec=>{ m.stun=now()+sec*1000; m.next=Math.max(m.next,m.stun); }});
// trừ máu người chơi (đã trừ thủ), báo hiệu ứng trúng đòn; hết máu thì gục với lý do why
function hurtP(q,d,why,fx){ const m=st(q); if(!m||m.dead>now()||m.safe>now()) return 0; const dd=Math.max(1,Math.round((d*(.9+Math.random()*.2)-m.def*.4)*(1-(m.armor||0)))); if(!q.muGod) m.hp-=dd;   /* giáp: giảm % sát thương quái / boss */   /* muGod: chỉ server test (dbggod) */ bcast({t:'mufx',k:'hurt',...fx,to:q.pid,dmg:dd});
  if(m.reflect&&(m.buff.giap||0)>now()) reflect(q,Math.round(d*m.reflect),fx);
  if(m.hp<=0) down(q,why); else push(q); return dd; }
// đòn trừ theo % máu tối đa (Mưa Bom Vĩ Thú): xuyên thủ + giáp
function hurtPct(B,q,pct,k){ const m=st(q); if(!m||m.dead>now()||m.safe>now()||q.muGod) return 0; const dd=Math.max(1,Math.round(m.max*pct)); if(!q.muGod) m.hp-=dd; bcast({t:'mufx',k:'hurt',ak:k,boss:B.id,to:q.pid,dmg:dd});
  if(m.hp<=0) down(q,`Dính ${(BS[B.id].attacks.find(a=>a.k===k)||{}).name||'đòn'} của ${BS[B.id].name}`); else push(q); return dd; }
const AK_NAME={hhshot:'đạn của Anh tóc dài kakaka',spin:'Cưa Xoay Vòng Tròn',nuke:'Bom Hạt Nhân'};   /* tên đòn không nằm trong bảng attacks */
const hurt=(B,q,d,k)=>{ const ps=BS[B.id].poisonStack, D=q.mus&&q.mus.fx&&q.mus.fx.dot; if(ps&&D&&D.until>now()&&(D.hits=(D.hits||0)+1)>=ps.hits){ D.hits=0; D.until+=ps.add*1000; }   /* trúng 3 đòn lúc đang độc: độc kéo dài thêm */
  const cr=BS[B.id].crit&&Math.random()<BS[B.id].crit, sm=B.spinU>now()?BS[B.id].spin.mul:1; return hurtP(q,(cr?d*1.5:d)*weakOf(B,now())*sm,`Dính ${AK_NAME[k]||(BS[B.id].attacks.find(a=>a.k===k)||{}).name||'đòn'}${cr?' chí mạng':''} của ${BS[B.id].name}`,{ak:k,boss:B.id,crit:cr?1:0}); };   /* boss có tỉ lệ chí mạng (Luffy 75%) */
// mục tiêu khác ngoài boss (quái rừng ở muforest.js): mỗi nguồn có nearest(pl) → {x,y,d,def,rad,hit(d,pl,sk) → mã mục tiêu} hoặc null
const EXTRA=[];
EXTRA.push({kind:'bm',nearest:pl=>{ let best=null, bd=1e9; for(const B of LIVE.values()) if(scOf(B)===pl.scene) for(const m of B.mins||[]){ const d=dist(pl,m.x,m.y); if(d<bd){ bd=d; best=[B,m]; } } return best&&bd<=14?asMin(best[0],best[1],bd):null; },
  byId:(id,pl)=>{ for(const B of LIVE.values()) if(scOf(B)===pl.scene) for(const m of B.mins||[]) if(m.id===id) return asMin(B,m,dist(pl,m.x,m.y)); return null; },
  around:(x,y,r,n,skip,sc)=>{ const out=[]; for(const B of LIVE.values()) if(!sc||scOf(B)===sc) for(const m of B.mins||[]) if(m.id!==skip&&Math.hypot(m.x-x,m.y-y)<=r) out.push(asMin(B,m,0)); return out.slice(0,n); }});
const nearestExtra=pl=>{ let best=null; for(const src of EXTRA){ const o=src.nearest(pl); if(o&&(!best||o.d<best.d)) best=o; } return best; };
// vùng đánh có tính cả thân người (BODY ô): chạm mép là dính
const BODY=.35, SELF=new Set(['ring','donut','line','cone','flood']);
const NOTELE=new Set(['summon','buff','ghost','gulp']);   /* đòn toả từ chính boss: boss đứng yên lúc gồng */
function inZone(z,x,y){ if(z.kind==='nuke') return x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1&&Math.hypot(x-z.sx,y-z.sy)>z.sr;
  if(z.kind==='line'){ const dx=x-z.x, dy=y-z.y, c=Math.cos(z.ang), sn=Math.sin(z.ang), u=dx*c+dy*sn, v=-dx*sn+dy*c; return u>=-1&&u<=z.range+BODY&&Math.abs(v)<=z.w+BODY; }
  const d=Math.hypot(x-z.x,y-z.y); return z.kind==='donut'?d>=z.r0-BODY&&d<=z.r+BODY:d<=z.r+BODY; }
function resolve(B,z,t){ const b=BS[B.id];
  if(z.kind==='cone'){ if(t<z.at) return false; const due=Math.floor((t-z.at)/z.tick)+1; z.done=z.done||0;
    while(z.done<Math.min(due,z.hits)){ z.done++; for(const q of alive(scOf(B))){ const dx=q.x/T-z.x, dy=q.y/T-z.y, d=Math.hypot(dx,dy); let da=Math.abs(Math.atan2(dy,dx)-z.ang); if(da>Math.PI) da=2*Math.PI-da; if(d<=z.range+BODY&&(da<=z.cone||d<1.2)){ hurt(B,q,z.dmg,z.k); if(z.fx) applyFx(q,z.fx,t,B); } } bcast({t:'mufx',k:'bhit',boss:B.id,ak:z.k,kind:z.kind,x:z.x,y:z.y,ang:z.ang,range:z.range,n:z.done}); }
    return z.done>=z.hits; }
  if(t<z.at) return false;
  if(z.kind==='jump'){ [B.x,B.y]=clampA(b,z.x,z.y); }
  if(z.kind==='ring'||z.kind==='donut'){ z.x=B.x; z.y=B.y; }
  for(const q of alive(scOf(B))) if(inZone(z,q.x/T,q.y/T)){ if(z.kind==='grab'){ swallow(B,q,z); continue; } if(z.pct) hurtPct(B,q,z.pct,z.k); else if(z.dmg) hurt(B,q,z.dmg,z.k); if(z.fx) applyFx(q,z.fx,t,B); }
  if(z.kind==='line'&&z.dash){ const [x,y]=clampA(b,z.x+Math.cos(z.ang)*z.range,z.y+Math.sin(z.ang)*z.range); B.x=x; B.y=y; }   /* lao theo tia */
  if(z.guard){ B.guardU=t+z.guard.dur*1000; B.guard=z.guard; bcast({t:'mufx',k:'bguard',boss:B.id,x:B.x,y:B.y,armor:z.guard.armor,resist:z.guard.resist}); }   /* Conan lướt trên đường đạn: giáp + kháng phép */
  bcast({t:'mufx',k:'bhit',boss:B.id,ak:z.k,kind:z.kind,x:z.x,y:z.y,r:z.r,r0:z.r0,ang:z.ang,range:z.range,w:z.w,dash:z.dash});
  const f=z.then; if(f&&B.phase>=(f.phase||1)) B.tele.push({id:SEQ++,k:z.k,kind:f.kind,x:B.x,y:B.y,r:f.r*HARD.r,dmg:f.dmg*HARD.dmg*(B.phase===3?b.enrage.mul:1),at:t+f.warn*HARD.warn*1000});   /* đòn nối: sóng chấn động chỗ đáp */
  return true; }
// boss đi áp sát người gần nhất trong khu, nhưng không rời chỗ đứng quá LEASH ô (khỏi mò xuống chỗ hồi sinh); hết người thì về chỗ cũ. Đang gồng đòn toả từ người nó thì đứng yên
const LEASH=7;
function walk(B,dt,speed){ speed*=formOf(B).move||1; const b=BS[B.id]; if(!b.move||B.tele.some(z=>SELF.has(z.kind))) return false; const q=targets(B,18).sort((u,v)=>dist(u,B.x,B.y)-dist(v,B.x,B.y))[0];
  let tx=b.home.x, ty=b.home.y, stop=.2; if(q){ const hx=q.x/T-b.home.x, hy=q.y/T-b.home.y, hd=Math.hypot(hx,hy), k=hd>LEASH?LEASH/hd:1; tx=b.home.x+hx*k; ty=b.home.y+hy*k; stop=hd>LEASH?.2:1.6; }
  const dx=tx-B.x, dy=ty-B.y, d=Math.hypot(dx,dy); if(d<=stop+.05) return false; const st=Math.min(d-stop,b.move*speed*dt*(q?1:.6)); [B.x,B.y]=clampA(b,B.x+dx/d*st,B.y+dy/d*st); return true; }
function bossTick(t){ for(const [id,b] of Object.entries(BS)) if(!b.summon&&!LIVE.has(id)&&t>=NEXT[id]){ NEXT[id]=t+b.life+b.every; spawn(id); }
  if(LIVE.size) track(t);
  let dirty=false;
  for(const B of [...LIVE.values()]){ const b=BS[B.id];
    if(t>=B.until){ LIVE.delete(B.id); NEXT[B.id]=b.summon?null:t+b.every; bcast({t:'note',msg:`${b.name} bỏ đi rồi, lần sau rủ thêm người nhé!`,kind:'lock'}); dirty=true; continue; }
    const ph=phaseOf(B); if(ph!==B.phase){ B.phase=ph; dirty=true; bcast({t:'mufx',k:'phase',boss:B.id,phase:ph}); if(ph===3) bcast({t:'note',msg:`🔥 ${b.name} nổi giận! Đánh mạnh và nhanh hơn`,kind:'lock'}); }
    if(!B.fightAt&&targets(B,16).length) B.fightAt=t;
    if(b.forms&&!B.form) for(const f of b.forms) if((f.when.hp&&B.hp/B.max<=f.when.hp)||(f.when.t&&B.fightAt&&t-B.fightAt>=f.when.t*1000)){ transform(B,f,t); dirty=true; break; }
    if(b.minAt&&!B.minCalled&&B.hp/B.max<=b.minAt.hp){ B.minCalled=1; summonMin(B,b.minAt.k,b.minAt.n,t); const MD=M.minions[b.minAt.k]; for(const q of inScene()) if(q.scene===scOf(B)) note(q,`⚠ ${b.name} gọi ${b.minAt.n} ${MD.name} ra trợ chiến!`,'lock'); dirty=true; }
    if(b.cup&&B.hp/B.max<b.cup.hp&&t>=(B.cupNext||0)&&!(B.cupU>t)){ const U=b.cup; B.cupU=t+U.dur*1000; B.cupNext=t+U.every*1000; B.tele=B.tele.filter(z=>z.mob);   /* Nobita chui vào cốc mỳ: phòng thủ, hết giờ nổ choáng + độc */
      B.tele.push({id:SEQ++,k:'mycoc',kind:'ring',x:B.x,y:B.y,r:U.r,dmg:U.dmg*HARD.dmg,at:B.cupU,fx:U.fx}); bcast({t:'mufx',k:'bcup',boss:B.id,x:B.x,y:B.y}); dirty=true; }
    if(b.call&&!B.called&&B.hp/B.max<=b.call.hp){ B.called=1; callBoss(B,b.call.k,t); dirty=true; }
    if(b.dive&&B.hp/B.max<b.dive.hp&&t>=(B.diveNext||0)){ B.diveU=t+b.dive.dur*1000; B.diveNext=t+b.dive.every*1000; B.tele=B.tele.filter(z=>z.mob); bcast({t:'mufx',k:'dive',boss:B.id,x:B.x,y:B.y,dur:b.dive.dur}); dirty=true; }   /* lặn: bỏ đòn đang gồng */
    const F=formOf(B); if(F.regen&&B.hp<B.max){ B.hp=Math.min(B.max,B.hp+B.max*F.regen*.2*(B.gw&&B.gw.until>t?1-B.gw.mul:1)); dirty=true; }   /* bị giảm hồi máu thì hồi ít đi */   /* Titan hồi máu mỗi giây */
    const en=ph===3?b.enrage:{mul:1,speed:1}, speed=en.speed*(B.slow>t?.6:1), aspd=speed*(F.spd||1)*(b.spd||1), cap=[0,4,7,10][ph], own=B.tele.filter(z=>!z.mob);   /* giai đoạn sau nhiều đòn chồng lên nhau hơn; tia của trứng không tính */
    if(B.spinU>t&&t>=(B.spinNext||0)){ const S0=b.spin; B.spinNext=t+S0.tick*1000; for(const q of alive(scOf(B))) if(dist(q,B.x,B.y)<=S0.r+BODY) hurt(B,q,S0.dmg*HARD.dmg,'spin'); bcast({t:'mufx',k:'spulse',boss:B.id,x:B.x,y:B.y,r:S0.r}); }   /* xoay cưa: chém quanh người */
    if(b.pochita){ const P0=b.pochita, Rz=LIVE.get(b.call&&b.call.k); if(!Rz||scOf(Rz)!==scOf(B)) B.pochNext=Math.max(B.pochNext||0,t+P0.first*1000);
      else if(t>=(B.pochNext||0)&&!(B.pochU>t)){ B.pochU=t+P0.dur*1000; B.pochNext=t+P0.every*1000; B.spinU=0; B.tele=B.tele.filter(z=>z.mob); bcast({t:'mufx',k:'bpoch',boss:B.id,x:B.x,y:B.y}); nuke(Rz,B,P0.nuke,t); dirty=true; } }
    const stn=B.stunU>t||B.diveU>t||B.pochU>t||B.cupU>t||B.chickU>t;   /* hoá gà (Cây Bút): đứng im */   /* bị choáng / đang lặn / đang là Pochita: không ra đòn mới, không đi */
    if(!stn&&!(B.silU>t)) for(const a of b.attacks){ if(a.hpBelow&&B.hp/B.max>a.hpBelow) continue; const nt=NOTELE.has(a.kind); if((a.phase||1)>ph||(a.form&&B.form!==a.form)||t<(B.cd[a.k]||0)||(!nt&&own.length>=cap)) continue; if(!nt&&ph<2&&a.kind!=='single'&&own.some(z=>z.kind!=='single'&&z.at>t)) continue;   /* chiêu không có vùng cảnh báo (gọi lính, buff...) không bị giới hạn số vùng */
      B.cd[a.k]=t+a.every*(b.exact||a.exact?1:HARD.cd)*1000/(a.noSpd?1:aspd); if(startAttack(B,a,t,en.mul)){ dirty=true; own.push(1); } }
    if(minionTick(B,t,.2)) dirty=true; if(shotTick(B,t,.2)) dirty=true; gulpTick(B,t);
    if(B.ghostU>t&&t>=B.ghostA.next){ const G=B.ghostA; G.next=t+G.tick; for(const q of alive(scOf(B))) if(dist(q,B.x,B.y)<=G.r+BODY){ hurt(B,q,G.dmg,'bongma'); if(G.fx) applyFx(q,G.fx,t,B); } bcast({t:'mufx',k:'gpulse',boss:B.id,x:B.x,y:B.y,r:G.r}); }
    for(const z of B.tele) if(z.tgt&&t<z.lock){ const q=players.get(z.tgt); if(q&&inMu(q)&&inArea(b.area,q.x/T,q.y/T)){ z.x+=(q.x/T-z.x)*.7; z.y+=(q.y/T-z.y)*.7; dirty=true; } }   /* vùng đuổi theo người */
    if(!stn&&walk(B,.2,speed)) dirty=true;
    const before=B.tele.length; B.tele=B.tele.filter(z=>!resolve(B,z,t)); if(B.tele.length!==before) dirty=true; }
  if(dirty) pushBoss(); }
// hạ boss: chia thưởng theo phần sát thương
function bossDie(B,killer){ if(!LIVE.has(B.id)) return; if(B.gulp){ B.gulp.until=0; gulpTick(B,now()); }   /* boss chết: nhổ người đang bị nuốt ra */ const b=BS[B.id], R=RW[b.drops]||{}; LIVE.delete(B.id); NEXT[B.id]=b.summon?null:now()+(b.perma?b.perma*1000:b.every);   /* hồi lại đủ thời gian mới ra tiếp */
  const total=[...B.dmg.values()].reduce((a,v)=>a+v,0)||1, top=[...B.dmg.entries()].sort((a,c)=>c[1]-a[1]).filter(([u])=>C.byUid.get(u)), lines=[];
  // Trái Ác Quỷ (chỉ Luffy): số trái = 1/10 số người góp sức, tối thiểu 1; ai góp nhiều sát thương thì dễ được hơn
  const fruitTo=new Set(); if(B.id==='luffy'){ const n=Math.max(1,Math.ceil(top.length/(R.fruitPer||10))), pool=top.map(([u,d])=>({u,w:d})); for(let i=0;i<n&&pool.length;i++){ const sum=pool.reduce((a,x)=>a+x.w,0); let r=Math.random()*sum, k=0; while(k<pool.length-1&&(r-=pool[k].w)>0) k++; fruitTo.add(pool[k].u); pool.splice(k,1); } }
  // ngọc quý (mọi boss): chắc chắn cho người nhiều sát thương nhất còn cần ngọc (thú cưỡi chưa lên hết bậc thần thú), không thì nhường top 2, top 3; thêm 20% cho 1 người bất kỳ góp sức
  const needJ=p=>!(p.horse&&(p.horse.myth||0)>=S.HORSE.myth.length); let jewelTo=null; for(const [u] of top.slice(0,3)){ const q=C.byUid.get(u); if(q&&q.prof&&needJ(q.prof)){ jewelTo=u; break; } }
  const luckyTo=top.length&&Math.random()<.2?top[Math.floor(Math.random()*top.length)][0]:null;
  top.forEach(([uid,d],rank)=>{ const pl=C.byUid.get(uid); if(!pl||!pl.prof) return; const p=pl.prof, sh=d/total, items={}, extra=[], hadCos=!!(R.costume&&p.owned[R.costume]);
    let tired=1; { const BD=bossDay(p), n=BD.n[B.id]=(BD.n[B.id]||0)+1, all=BD.all=(BD.all||0)+1; if(M.bossPerDay) setTimeout(()=>{ if(pl.prof) note(pl,`⚔ Đã hạ ${b.name} ${n}/${M.bossPerDay} lần hôm nay${n>=M.bossPerDay?': đủ lượt, mai đánh tiếp':''}`,'quest'); },1500);   /* giới hạn tính theo lần hạ */
      if(M.bossFull&&all>M.bossFull){ tired=M.bossTired||.2; if(all===M.bossFull+1) setTimeout(()=>{ if(pl.prof) note(pl,`⚔ Hôm nay đã hạ ${M.bossFull} boss: từ giờ tới hết ngày thưởng boss còn ${Math.round(tired*100)}% (vẫn đánh thoải mái)`,'quest'); },1600); } }   /* quá bossFull lần hạ / ngày: thưởng giảm, không nhân ngọc */
    { const gc=B.id==='luffy'?(rank===0?2:Math.random()<.6?1:0):(rank===0?1:Math.random()<.35?1:0); if(gc) items.ngoc_ch=(items.ngoc_ch||0)+gc; }   /* ngọc cường hoá */
    if(rank===0&&Math.random()<.15) items.ngoc_ch_ht=(items.ngoc_ch_ht||0)+1;   /* top 1: 15% Ngọc Cường Hoá Huyền Thoại */
    for(const got of [uid===jewelTo,uid===luckyTo]) if(got){ const j=M.jewels[Math.floor(Math.random()*M.jewels.length)]; items[j]=(items[j]||0)+1; if(uid===luckyTo&&got===(uid===luckyTo)&&uid!==jewelTo) extra.push('🍀 may mắn được ngọc quý'); }
    if(R.gems&&(rank===0||Math.random()<.5)) items.ngoc_ch=(items.ngoc_ch||0)+R.gems;
    if(R.jewels) for(let j=0;j<(rank===0?R.jewels:Math.random()<.5?1:0);j++){ const jk=M.jewels[Math.floor(Math.random()*M.jewels.length)]; items[jk]=(items[jk]||0)+1; }
    if(R.badge&&(rank<3||Math.random()<R.badgeChance)){ items[R.badge]=(items[R.badge]||0)+1; extra.push(`🏅 ${S.ITEMS[R.badge].name} (đổi 1 trong 3 thần thú ở Trung tâm Lính Cát)`); }
    if(R.pas){ const rr=rec(p), ks=Object.keys(M.passive).filter(k=>((rr.pasB||{})[k]||0)<M.passive[k].max); if(ks.length){ const k=ks[Math.floor(Math.random()*ks.length)]; rr.pasB=rr.pasB||{}; rr.pasB[k]=Math.min(M.passive[k].max,(rr.pasB[k]||0)+R.pas); extra.push(`📚 +${R.pas} cấp nội tại ${M.passive[k].name}`); } }   /* buff chỉ số nội tại */
    if(fruitTo.has(uid)){ const ks=Object.keys(F), k=ks[Math.floor(Math.random()*ks.length)]; items['taq_'+k]=1; extra.push(`🍇 ${F[k].name}!`); }
    let cos='', sec=''; if(R.costume&&!p.owned[R.costume]&&(rank===0||Math.random()<R.chance)){ p.owned[R.costume]=1; cos=R.costume; extra.push(`trang phục ${S.CLOTHES[R.costume].name}`); }
    if(R.weapon&&!C.has(pl,R.weapon)&&(rank===0&&hadCos||Math.random()<R.chance)){ items[R.weapon]=1; const r=rec(p), cur=(M.weapons[r.wep]||{}).atk||0; if(M.weapons[R.weapon].atk>cur) r.wep=R.weapon; extra.push(`vũ khí ${M.weapons[R.weapon].name}`); }
    if(R.secret&&!p.quests[R.secret]){ p.quests[R.secret]='active'; sec=R.secret; extra.push(`nhiệm vụ ẩn "${S.QUESTS[R.secret].title.replace('🔍 ','')}"`); }
    const RX=M.bossRewardX||1; if(tired===1) for(const k of ['ngoc_ch',...M.jewels]) if(items[k]) items[k]*=k==='ngoc_ch'?(M.bossGemX||RX):(M.bossJewelX||RX);   /* Ngọc Cường Hoá ×bossGemX (5), ngọc quý ×bossJewelX (3): ngọc nhân lên, đồ độc nhất giữ nguyên */
    const got=reward(pl,{exp:Math.round((R.exp+Math.round(300*sh))*(M.bossExpX||RX)*tired),vnd:Math.round((R.vnd+Math.round((B.id==='luffy'?600000:300000)*sh))*(M.bossVndX||RX)*tired/1000)*1000,items},`Hạ ${b.name}: góp ${Math.round(sh*100)}% sát thương${rank===0?' (top 1!)':''}${tired<1?` · quá ${M.bossFull} boss hôm nay, thưởng ${Math.round(tired*100)}%`:''}`), mu=Math.round((R.mu+Math.round(200*sh))*(M.bossMuX||RX)*tired); gainMu(pl,mu); { const rr=rec(p); rr.boss++; rr.bossK=rr.bossK||{}; rr.bossK[B.id]=(rr.bossK[B.id]||0)+1; }   /* đếm từng boss (thành tựu item huyền thoại) */
    send(pl,{t:'muloot',boss:B.id,name:b.name,rank:rank+1,n:top.length,share:Math.round(sh*100),exp:got.exp||0,vnd:got.vnd||0,mu,items:got.items||{},cos,sec});   // bảng tổng kết chiến lợi phẩm
    if(extra.length) note(pl,'🎁 Rơi ra: '+extra.join(', '),'item'); if(pl.mus) st(pl); push(pl); markDirty(pl); if(rank<3) lines.push(`${rank+1}. ${p.name} ${Math.round(sh*100)}%`); });
  C.broadcastAll({t:'note',msg:`🏆 ${b.name} đã bị hạ${killer?` bởi ${killer.prof.name}`:''}! ${lines.join(' · ')}${fruitTo.size?` · rơi ${fruitTo.size} Trái Ác Quỷ`:''}`,kind:'quest'});
  bcast({t:'mufx',k:'bossdie',boss:B.id,x:B.x,y:B.y}); pushBoss(); }
// Xích Thố: người đang cưỡi trong MU cứ every giây phun lửa (theo hệ) vào boss / quái gần nhất trong range ô
function xtTick(t){ const BR=S.XICHTHO.breath; for(const pl of inScene()){ const p=pl.prof, x=p&&p.xt, m=pl.mus; if(!x||!x.lv||!pl.riding||!p.look||p.look.mount!=='xichtho'||!m||m.dead>t||(pl.xtAt||0)>t) continue;
    const B=[...LIVE.values()].filter(b=>scOf(b)===pl.scene&&!(b.diveU>t)&&dist(pl,b.x,b.y)<=BR.range+radius(BS[b.id],b)).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl), useX=!!(X0&&X0.d<=BR.range+X0.rad&&(!B||X0.d<dist(pl,B.x,B.y)));
    if(!B&&!useX) continue; pl.xtAt=t+BR.every*1000; const el=x.el, crit=el==='kim'&&Math.random()<.3; let d=Math.max(1,Math.round(m.atk*(BR.mul+BR.per*x.lv)*(el==='hoa'?1.5:1)*(crit?1.5:1))), to;
    if(useX){ to=X0.hit(d,pl,{}); if(el==='thuy'&&X0.slow) X0.slow(2); if(el==='tho'&&Math.random()<.2&&X0.stun&&!X0.pvp) X0.stun(1); }
    else { const dd=dmgBoss(B,pl,d,t,'xt'); if(dd<=0) d=0; else { if(el==='thuy') B.slow=t+2000; if(el==='tho'&&Math.random()<.2) stunT(B,null,1,t); } to='boss:'+B.id; }
    if(el==='moc'&&d){ m.hp=Math.min(m.max,m.hp+m.max*.03); push(pl); }
    bcast({t:'mufx',k:'xtfire',from:pl.pid,to,boss:useX?'':B.id,el,dmg:d,crit}); } }
// Min (gọi từ set 16Typh) hát ra nốt nhạc đánh boss gần chủ nhất trong 9 ô, mỗi 0,9 giây, tới khi hết giờ / chủ gục
function minTick(t){ for(const pl of inScene()){ const mm=pl.muMin; if(!mm) continue; const m=pl.mus;
    if(mm.until<=t||!m||m.dead>t){ pl.muMin=null; bcast({t:'mufx',k:'mindown',from:pl.pid}); continue; } if(t<mm.next) continue; mm.next=t+900;
    const B=[...LIVE.values()].filter(x=>scOf(x)===pl.scene&&dist(pl,x.x,x.y)<=9).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
    if(X0&&X0.d<=9&&(!B||X0.d<dist(pl,B.x,B.y))){ const d=Math.max(1,Math.round(m.atk*1.1*(.9+Math.random()*.2)-X0.def*.3)), to=X0.hit(d,pl,{}); bcast({t:'mufx',k:'minhit',from:pl.pid,to,dmg:d}); continue; }
    if(!B) continue;
    const d=dmgBoss(B,pl,Math.max(1,Math.round(m.atk*1.1*(.9+Math.random()*.2)-BS[B.id].def*.3)),t);
    bcast({t:'mufx',k:'minhit',from:pl.pid,to:'boss:'+B.id,boss:B.id,dmg:Math.max(0,d),miss:missOf(d)}); } }
// Lính Cát đầu đội tự đánh boss / quái gần nhất cùng chủ (trong 8 ô). Dạng huyền thoại (myth): đánh nhanh hơn, mạnh theo hệ + hiệu ứng (S.LINHCAT.mythSkill)
function mythFx(pl,lead,sk,X0,B,d){ const m=pl.mus, LC=S.LINHCAT; if(!sk) return; let healed=0;
  if(sk.heal){ healed=Math.round(m.max*sk.heal); m.hp=Math.min(m.max,m.hp+healed); } if(sk.mp) m.mp=Math.min(m.mmax,m.mp+m.mmax*sk.mp); if(sk.drain){ const n=Math.round(d*sk.drain); healed+=n; m.hp=Math.min(m.max,m.hp+n); }
  if(sk.shield) m.buff.def=Math.max(m.buff.def||0,now()+sk.shield*1000); if(sk.slow){ if(X0&&X0.slow) X0.slow(sk.slow); else if(B) B.slow=now()+sk.slow*1000; }
  const chain=[]; if(sk.chain&&X0){ for(const src of EXTRA) if(src.around) for(const o of src.around(X0.x,X0.y,4,sk.chain,X0.id,pl.scene)){ const dd=Math.max(1,Math.round(d*.6)); o.hit(dd,pl,{}); chain.push([o.x,o.y,dd]); } }
  if(sk.aoe){ const tx=X0?X0.x:B.x, ty=X0?X0.y:B.y; for(const src of EXTRA) if(src.around) for(const o of src.around(tx,ty,sk.aoe,8,X0&&X0.id,pl.scene)){ const dd=Math.max(1,Math.round(d*.7)); o.hit(dd,pl,{}); chain.push([o.x,o.y,dd]); }   /* siêu huyền thoại: nổ lan */
    for(const b2 of [...LIVE.values()]) if(b2!==B&&scOf(b2)===pl.scene&&Math.hypot(b2.x-tx,b2.y-ty)<=sk.aoe+radius(BS[b2.id],b2)){ const dd=dmgBoss(b2,pl,Math.max(1,Math.round(d*.7)),now()); if(dd>0) chain.push([b2.x,b2.y,dd]); } }
  if(sk.team) for(const q of inScene()) if(q!==pl&&q.scene===pl.scene&&q.mus&&q.mus.dead<=now()&&dist(q,pl.x/T,pl.y/T)<=sk.team){ q.mus.hp=Math.min(q.mus.max,q.mus.hp+Math.round(q.mus.max*(sk.heal||0))); push(q); }
  bcast({t:'mufx',k:'lcsk',from:pl.pid,sp:lead.sp,ty:S.LC_SPECIES[lead.sp].t,name:sk.name,x:X0?X0.x:B.x,y:X0?X0.y:B.y,heal:healed,chain}); if(healed||sk.mp||sk.shield) push(pl); void LC; }
function petTick(t){ for(const pl of inScene()){ const m=pl.mus, lead=pl.prof.lc&&pl.prof.lc.party&&pl.prof.lc.party[0];
    if(!m||m.dead>t||!lead||lead.hp<=0||!pl.prof.skills.linhcat||(pl.muPetAt||0)>t) continue; const B=[...LIVE.values()].filter(x=>scOf(x)===pl.scene&&dist(pl,x.x,x.y)<=8).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
    const LC=S.LINHCAT, SL=LC.superSkill[lead.sp], sk=SL||(lead.myth?(LC.mythSkill[S.LC_SPECIES[lead.sp].t]||LC.mythSkill.thuong):null), mul=sk?sk.mul:1, cd=SL?SL.every*1000:sk?LC.myth.every*1000:2000, atk=S.lcStatsOf(lead).atk;
    if(X0&&X0.d<=8&&(!B||X0.d<dist(pl,B.x,B.y))){ pl.muPetAt=t+cd; const d=Math.max(1,Math.round(atk*1.3*mul*(.9+Math.random()*.2)-X0.def*.3)), to=X0.hit(d,pl,{}); bcast({t:'mufx',k:'pet',from:pl.pid,to,dmg:d,sp:lead.sp}); mythFx(pl,lead,sk,X0,null,d); continue; }
    if(!B) continue;
    pl.muPetAt=t+cd; const a=atk*mul, d0=Math.max(1,Math.round(a*1.3*(.9+Math.random()*.2)-BS[B.id].def*.3)), d=dmgBoss(B,pl,d0,t);
    bcast({t:'mufx',k:'pet',from:pl.pid,to:'boss',boss:B.id,dmg:Math.max(0,d),miss:missOf(d),sp:lead.sp}); if(d>0) mythFx(pl,lead,sk,null,B,d); } }
/* ---------- thách đấu ---------- */
// hết trận (1 người hết máu, gục vì quái / boss, hoặc rời MU): cả 2 hồi đầy máu + mana, báo thắng / thua to giữa màn hình
function duelEnd(win,lose){ for(const q of [win,lose]) if(q) q.muDuel=null;
  if(win&&lose&&win.prof&&lose.prof){ const ra=rec(win.prof), rb=rec(lose.prof); ra.w++; rb.l++; gainMu(win,M.duel.mu); C.gainExp(win,M.duel.exp);
    for(const q of [win,lose]){ const s=q.mus; if(s){ s.hp=s.max; s.mp=s.mmax; s.dead=0; } }
    send(win,{t:'muduelend',win:1,other:lose.prof.name,mu:M.duel.mu}); send(lose,{t:'muduelend',win:0,other:win.prof.name});
    for(const q of inScene()) note(q,`⚔ ${win.prof.name} thắng ${lose.prof.name} trong trận thách đấu!`,'quest'); markDirty(win); markDirty(lose); }
  for(const q of [win,lose]) if(q) push(q); }
const HID_Q={cuon_truc:'mu_cuontruc',banh_mut:'mu_banhmut',lua_ma:'mu_lua_ma',vay_rong:'mu_vayrong'};
const night=()=>{ const h=S.vnTime(now()).hf; return h>=19||h<5; };
/* ---------- thao tác ---------- */
on('mu',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now(); if(!inMu(pl)) return {err:'Vào thế giới MU Online trước (gọi Grab)'};
  if(op==='view') return {me:view(pl),boss:allView()};
  if(op==='dbggod'&&process.env.CHAN_TEST==='1'){ pl.muGod=!!m.on; return {ok:true}; }
  if(op==='dbgboss'&&process.env.CHAN_TEST==='1'){ const id=BS[m.id]?m.id:'luffy'; if(!LIVE.has(id)) spawn(id); if(m.hp) LIVE.get(id).hp=+m.hp; return {boss:allView()}; }   // chỉ server test: gọi boss ra ngay
  if(op==='class'){ const k=String(m.cls||''), c=M.cls[k]; if(!c) return {err:'?'}; if(!P.nearNpc(pl,'mu_guard')) return {err:'Gặp Vệ binh ở cổng thành'}; if(r.cls===k) return {err:'Bạn đang là '+c.name+' rồi'};
    if(r.cls&&!take(pl,300000)) return {err:'Đổi class tốn 300.000đ, không đủ tiền'}; r.cls=k; p.owned[c.set]=1; if(p.look&&p.look.outfit) p.look.outfit.top=c.set; pl.mus=null; st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:`Bạn trở thành ${c.name}! Đã nhận và mặc ${S.CLOTHES[c.set].name}. Phím 1 / 2 / 3 để ra chiêu`,look:p.look}; }
  if(op==='heal'){ if(!P.nearNpc(pl,'mu_mage')) return {err:'Gặp Pháp sư Cát'}; const s=st(pl); if(!s) return {err:'Chọn class ở Vệ binh trước'}; if(pl.muDuel) return {err:'Đang thách đấu'}; s.hp=s.max; s.mp=s.mmax; push(pl); return {msg:'Pháp sư Cát: "Máu với mana đầy rồi, ra trận đi!"'}; }
  if(op==='sell'){ if(!P.nearNpc(pl,'mu_mage',140)) return {err:'Lại gần Pháp sư Cát (quầy bên phải đài phun nước) rồi bán'}; const k=String(m.k||''), price=Math.round(S.MU.jewelSell[k]*(1+S.hsBonus(p))); if(!price||!C.has(pl,k)) return {err:'Không có ngọc này'};
    const n=m.all?(p.items[k]|0):1; addItem(pl,k,-n); give(pl,price*n); markDirty(pl); return {msg:`Bán ${n} ${S.ITEMS[k].name} được ${fmt(price*n)}`}; }
  // sách nội tại: mua ở Pháp sư Cát, đọc ở đâu cũng được (+1 cấp nội tại, không tốn điểm, tối đa thêm max cấp)
  if(op==='pasbuy'){ if(!P.nearNpc(pl,'mu_mage',140)) return {err:'Lại gần Pháp sư Cát rồi mua'}; const k=String(m.k||''), B=M.pasBook[k], n=Math.max(1,Math.min(5,m.n|0||1)); if(!B) return {err:'?'};
    if(!shopPay(pl,B.price*n)) return {err:`${n} quyển giá ${fmt(B.price*n)}`}; const rd=readBooks(pl,k,n); if(n-rd>0) addItem(pl,k,n-rd); markDirty(pl);   /* mua là đọc luôn tới mức trần, dư thì cất túi */
    return {msg:rd?`Mua ${n} ${S.ITEMS[k].name}: đã đọc ngay ${rd} quyển (+${rd} cấp ${M.passive[B.pas].name})${n-rd?`, còn ${n-rd} quyển trong túi`:''}`:`Mua ${n} ${S.ITEMS[k].name} (đã đọc đủ mức trần, cất trong túi)`,me:view(pl)}; }
  if(op==='pasread'){ const k=String(m.k||''), B=M.pasBook[k]; if(!B) return {err:'?'}; if(!C.has(pl,k)) return {err:`Chưa có ${S.ITEMS[k].name} (Pháp sư Cát bán)`}; const Pd=M.passive[B.pas], pb=r.pasB=r.pasB||{};
    if((pb[B.pas]||0)>=Pd.max) return {err:`Đã đọc đủ ${Pd.max} quyển ${Pd.name}`}; addItem(pl,k,-1); pb[B.pas]=(pb[B.pas]||0)+1; if(pl.mus) st(pl); markDirty(pl); push(pl);
    return {msg:`📖 Đọc xong: ${Pd.name} +1 (sách ${pb[B.pas]}/${Pd.max})`}; }
  // Premium Store: mua set legacy (giữ mãi, mặc luôn), mặc / cởi (k rỗng = mặc lại giáp class)
  if(op==='buy'||op==='wear'){ if(!P.nearNpc(pl,'mu_shop')) return {err:'Gặp Thương nhân Huyền Thoại ở quảng trường'}; const k=String(m.k||''), L=M.legacy[k];
    if(op==='buy'){ if(!L||L.hidden) return {err:'?'}; if(p.owned[k]) return {err:'Bạn có set này rồi, bấm Mặc'}; if(!shopPay(pl,L.price)) return {err:`Cần ${fmt(L.price)} để mua ${L.name}`}; p.owned[k]=1; }
    else if(k&&(!L||!p.owned[k])) return {err:'Chưa có set này'};
    const top=k||(r.cls?M.cls[r.cls].set:''); if(!top) return {err:'Chọn class ở Vệ binh trước'}; if(p.look&&p.look.outfit) p.look.outfit.top=top; if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); push(pl);
    return {msg:op==='buy'?`Đã mua và mặc Set Legacy ${L.name}! Lực chiến tăng, đòn đánh có hiệu ứng riêng`:k?`Đã mặc ${L.name}`:'Đã mặc lại giáp class',look:p.look}; }
  // Phù Thuỷ Cường Hoá: khắc lỗ cường hoá cho 1 món đồ (1 ngọc + phí; legend = dùng Ngọc Huyền Thoại 80%), mua ngọc, nhận quà Lính Cát huyền thoại
  if(op==='enh'||op==='enhbuy'||op==='enhgift'){ if(!P.nearNpc(pl,'mu_enchant')) return {err:'Gặp Phù Thuỷ Cường Hoá ở quảng trường'}; const E=S.ENH;
    if(op==='enhbuy'){ const n=Math.max(1,Math.min(20,m.n|0)), cost=S.gemCost(n); if(!shopPay(pl,cost)) return {err:`${n} ngọc giá ${fmt(cost)}`}; addItem(pl,'ngoc_ch',n); markDirty(pl); return {msg:`Mua ${n} Ngọc Cường Hoá`}; }
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
  if(op==='accbuy'||op==='accwear'){ if(!P.nearNpc(pl,'mu_acc')&&!P.nearNpc(pl,'mu_shoes')&&!P.nearNpc(pl,'mu_smith')) return {err:'Gặp Thợ Kim Hoàn (phụ kiện), Tiệm Giày hoặc Thợ Rèn (khiên) ở quảng trường'}; const k=String(m.k||''), a=M.acc[k], slot=a?a.slot:String(m.slot||'');
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
  // đánh thường (client tự gửi khi đứng gần quái / boss): ưu tiên mục tiêu client chỉ (to = 'boss:id' / 'mob:id') nếu trong tầm, không thì con gần nhất; nhịp theo tốc đánh
  if(op==='basic'){ if(s.dead>t||pl.muDuel) return {}; if(stunned(s,t)) return {next:300}; const gap=1000/(s.aspd||1)*aslowOf(s,t); if(t-(s.basicAt||0)<gap*.85) return {next:gap-(t-(s.basicAt||0))};
    const R=M.cls[r.cls].reach||M.basic.range, want=String(m.to||''); let B=null, X0=null;
    if(want.startsWith('boss:')){ const b=LIVE.get(want.slice(5)); if(b&&scOf(b)===pl.scene&&!(b.diveU>t)&&dist(pl,b.x,b.y)<=R+radius(BS[b.id],b)) B=b; }
    else if(want.includes(':')){ const [pk,pi]=want.split(':'); for(const src of EXTRA) if((src.kind||'mob')===pk){ const o=src.byId&&src.byId(+pi,pl); if(o&&o.d<=R+o.rad){ X0=o; break; } } }
    if(!B&&!X0){ const nb=[...LIVE.values()].filter(b=>scOf(b)===pl.scene&&!(b.diveU>t)).map(b=>[b,dist(pl,b.x,b.y)-radius(BS[b.id],b)]).filter(([,d])=>d<=R).sort((a,c)=>a[1]-c[1])[0], nx=nearestExtra(pl);
      if(nx&&nx.d-nx.rad<=R&&(!nb||nx.d-nx.rad<nb[1])) X0=nx; else if(nb) B=nb[0]; }
    if(!B&&!X0) return {};
    krTick(pl,t); s.basicAt=t; const crit=Math.random()<s.crit, raw=s.atk*M.basic.mul*(.9+Math.random()*.2), def=B?BS[B.id].def:X0.def, d=Math.max(1,Math.round((raw-def*.5*(1-s.shred))*(crit?1.5:1)+s.atk*s.tdmg*.5));
    let to, miss=0; if(B){ const dd=dmgBoss(B,pl,d,t,'basic'); miss=missOf(dd); to='boss:'+B.id; } else to=X0.hit(d,pl,{k:'basic'});
    if(s.drain) s.hp=Math.min(s.max,s.hp+Math.round(d*s.drain*(1-gwOf(s,t)))); if(!miss) procs(pl,s,B,X0,d,t); W.setAct(pl,'attack',.25);
    if(!miss&&s.off&&s.off.dbl&&Math.random()<s.off.dbl){ if(B){ if(dmgBoss(B,pl,d,t,'basic')>0) procs(pl,s,B,X0,d,t); } else X0.hit(d,pl,{k:'basic'}); bcast({t:'mufx',k:'dbl',from:pl.pid,to,dmg:d}); }   /* Động cơ Musk: đánh liền 2 đòn */
    const wv=M.weapons[r.wep]; bcast({t:'mufx',k:M.skills[r.cls][0].k,basic:1,from:pl.pid,to,dmg:miss?0:d,miss,crit,w:wv&&wv.store?r.wep:'',wl:(r.enh||{})[r.wep]||0}); return {ok:1,to,next:gap}; }   /* hiệu ứng = chiêu 1 của class */
  if(op==='pen'){ const I=S.LEGEND.items.but; if(!S.legendOwn(p,'but')) return {err:`Chưa ghép đủ ${S.LEGEND.need} mảnh ${I.name}`}; if(s.dead>t) return {err:'Đang gục'}; const lg=p.legend; if((lg.butAt||0)>t) return {err:`Bút đang hồi, ${Math.ceil((lg.butAt-t)/1000)} giây nữa`};   /* Cây Bút của Redtype */
    lg.butAt=t+I.cd*1000; s.cd={}; const B=[...LIVE.values()].filter(b=>scOf(b)===pl.scene&&!(b.diveU>t)&&!(b.ghostU>t)&&dist(pl,b.x,b.y)<=I.range+radius(BS[b.id],b)).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl); let hit='';
    if(B&&(!X0||X0.d>dist(pl,B.x,B.y))){ B.chickU=t+I.chick*1000; B.tele=B.tele.filter(z=>z.mob); hit=BS[B.id].name; bcast({t:'mufx',k:'chick',boss:B.id,x:B.x,y:B.y,dur:I.chick}); pushBoss(); }
    else if(X0&&X0.d<=I.range&&X0.stun&&!X0.pvp){ X0.stun(I.chick); hit='quái'; bcast({t:'mufx',k:'chick',x:X0.x,y:X0.y,dur:I.chick}); }
    bcast({t:'mufx',k:'pen',from:pl.pid}); markDirty(pl); push(pl); return {me:view(pl),msg:hit?`✏️ Hoá gà ${hit} ${I.chick} giây · mọi chiêu đã hồi xong`:'✏️ Mọi chiêu đã hồi xong (không có quái trong tầm để hoá gà)'}; }
  if(op==='skill'){ if(s.dead>t) return {err:'Đang gục, chờ hồi sinh'}; const sk=skillsOf(r,p)[m.i|0]; if(!sk) return {err:'Chưa có chiêu này'}; if(stunned(s,t)) return {err:'Đang bị choáng!'}; if((s.cd[sk.k]||0)>t) return {err:'Chiêu đang hồi'}; if(s.mp<sk.mp) return {err:'Không đủ mana'};
    if(sk.buff||sk.heal&&!sk.mul){ s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000*aslowOf(s,t)*(1-s.cdr); const healed=[]; W.setAct(pl,'attack',.35);
      if(sk.buff==='def') s.buff.def=t+sk.dur*1000; if(sk.buff==='giap'){ s.buff.def=s.buff.giap=t+sk.dur*1000; s.reflect=sk.reflect||0; } if(sk.cleanse&&s.fx){ delete s.fx.dot; delete s.fx.slow; delete s.fx.aslow; } const tgs=sk.team?inScene().filter(q=>q.mus&&q.mus.dead<=t&&(q===pl||(!pl.muDuel&&dist(q,pl.x/T,pl.y/T)<=sk.team))):[pl];
      if(sk.heal) for(const q of tgs){ const qs=st(q); if(!qs) continue; const n=Math.round(qs.max*sk.heal); qs.hp=Math.min(qs.max,qs.hp+n); healed.push(q.pid); if(q!==pl) push(q); }
      const lg=lgOf(p); bcast({t:'mufx',k:sk.k,from:pl.pid,heal:healed,lg:lg&&M.legacy[lg].fx}); push(pl); return {me:view(pl)}; }
    // chiêu Gọi Min (set 16Typh): chưa có boss / boss ngoài tầm vẫn gọi được, Min tự hát đánh boss trong 9 ô quanh chủ
    const near0=!pl.muDuel&&([...LIVE.values()].find(B=>scOf(B)===pl.scene&&Math.hypot(pl.x/T-B.x,pl.y/T-B.y)<=sk.range+radius(BS[B.id],B))||(()=>{ const X0=nearestExtra(pl); return X0&&X0.d<=sk.range+X0.rad; })());
    if(sk.summon&&!pl.muDuel&&!near0){ s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000*aslowOf(s,t)*(1-s.cdr); W.setAct(pl,'attack',.35); pl.muMin={until:t+sk.summon*1000,next:t+700};
      bcast({t:'mufx',k:'minup',from:pl.pid,until:pl.muMin.until}); push(pl); return {me:view(pl),msg:`Min ra rồi! Min hát đánh boss trong 9 ô quanh bạn (${sk.summon} giây)`}; }
    // chiêu đánh: thách đấu thì đánh đối thủ, không thì đánh boss / quái rừng gần nhất trong tầm
    const opp=pl.muDuel&&players.get(pl.muDuel.other); let tx,ty,tdef,onHit,rad=0,miss=0,tgB=null,tgX=null;
    if(opp&&inMu(opp)){ const os=st(opp); tx=opp.x/T; ty=opp.y/T; tdef=os.def; onHit=d=>{ os.hp-=d; if(os.hp<=0){ os.hp=0; duelEnd(pl,opp); } else push(opp); return opp.pid; }; }
    else { const B=[...LIVE.values()].filter(b=>scOf(b)===pl.scene&&!(b.diveU>t)).sort((u,v)=>dist(pl,u.x,u.y)-dist(pl,v.x,v.y))[0], X0=nearestExtra(pl);
      if(!B&&!X0){ const ids=Object.keys(BS).filter(k=>!BS[k].summon).sort((a,c)=>NEXT[a]-NEXT[c]); return {err:`Chưa có boss nào. ${BS[ids[0]].name} xuất hiện sau ${Math.max(1,Math.ceil((NEXT[ids[0]]-t)/60000))} phút. Xuống rừng phía Nam đánh quái, hoặc thách đấu ai đó`}; }
      if(X0&&(!B||X0.d-X0.rad<dist(pl,B.x,B.y)-radius(BS[B.id],B))){ tx=X0.x; ty=X0.y; tdef=X0.def; rad=X0.rad; tgX=X0; onHit=d=>X0.hit(d,pl,sk); }
      else { tx=B.x; ty=B.y; tdef=BS[B.id].def; rad=radius(BS[B.id],B); tgB=B;
        onHit=d=>{ const dd=dmgBoss(B,pl,d,t); if(dd<=0){ miss=missOf(dd); return 'boss:'+B.id; } if(sk.slow) B.slow=t+sk.slow*1000; if(LIVE.has(B.id)) pushBoss(); return 'boss:'+B.id; }; } }
    if(Math.hypot(pl.x/T-tx,pl.y/T-ty)>sk.range+rad) return {err:`Xa quá, tầm chiêu ${sk.range} ô`};
    krTick(pl,t); s.mp-=sk.mp; s.cd[sk.k]=t+sk.cd*1000*aslowOf(s,t)*(1-s.cdr); W.setAct(pl,'attack',.35); const crit=Math.random()<s.crit, d=Math.max(1,Math.round((s.atk*sk.mul*(1+s.spell)*(.9+Math.random()*.2)-tdef*.5*(1-s.shred))*(crit?1.5:1)+s.atk*s.tdmg));
    { const gk=1-gwOf(s,t); if(sk.drain||s.drain) s.hp=Math.min(s.max,s.hp+Math.round(d*((sk.drain||0)+s.drain)*gk)); if(sk.heal) s.hp=Math.min(s.max,s.hp+Math.round(s.max*sk.heal*gk)); }   /* chiêu đánh kèm hồi máu (set Yoshi, King Knight) */ const to=onHit(d); if(!miss){ if(opp){ if(s.slowp&&Math.random()<s.slowp) applyFx(opp,{slow:.6,dur:2},t); if(s.gw&&opp.mus){ const F=opp.mus.fx||(opp.mus.fx={}); F.gw={until:t+3000,mul:s.gw}; } } else procs(pl,s,tgB,tgX,d,t); if(sk.stun){ if(opp) applyFx(opp,{stun:sk.stun},t); else stunT(tgB,tgX,sk.stun,t); } if(!opp){ if(sk.gw||sk.weak) debuff(tgB,tgX,sk,t); if(sk.aoe) splash(pl,sk,tx,ty,tgB,tgX,d,t); } }
    if(!opp&&s.off&&s.off.silence){ s.skN=(s.skN||0)+1; if(s.skN>=s.off.silence.every){ s.skN=0; silence(tgB,tgX,s.off.silence.dur,t); } }   /* Đũa Howard Le: khoá chiêu quái */
    const lg=lgOf(p), wv=M.weapons[r.wep]; bcast({t:'mufx',k:sk.k,from:pl.pid,to,dmg:miss?0:d,miss,crit,lg:lg&&M.legacy[lg].fx,w:wv&&wv.store?r.wep:'',wl:(r.enh||{})[r.wep]||0});
    if(sk.summon){ pl.muMin={until:t+sk.summon*1000,next:t+700}; bcast({t:'mufx',k:'minup',from:pl.pid,until:pl.muMin.until}); }   // set 16Typh: Min ra đánh cùng
    push(pl); return {me:view(pl)}; }
  return {err:'?'}; });
// boss AI 5 lần / giây (đủ mịn để né đòn), Lính Cát đánh phụ, hồi máu / mana, hồi sinh
let regenT=0;
setInterval(()=>{ try{ const t=now(); bossTick(t); petTick(t); minTick(t); xtTick(t); if(t<regenT) return; regenT=t+500;
  for(const pl of inScene()){ const m=pl.mus; if(!m||!rec(pl.prof).cls) continue;
    if(m.dead&&m.dead<=t){ m.dead=0; m.safe=t+4000; m.hp=m.max; m.mp=m.mmax; const sp=RESPAWN.f&&RESPAWN.f(pl); if(sp) C.moveTo(pl,sp[0],sp[1],sp[2]); else C.moveTo(pl,'mu',M.spawn.x,M.spawn.y);   /* D-Day: hồi sinh cạnh nhà mình */ push(pl); continue; }
    if(S.legendOwn(pl.prof,'airpod')&&m.dead<=t&&t>=(m.apNext||0)){ const AP=S.LEGEND.items.airpod; m.apNext=t+AP.every*1000; m.safe=Math.max(m.safe||0,t+AP.dur*1000); bcast({t:'mufx',k:'airpod',to:pl.pid,dur:AP.dur}); }   /* Airpod: tự bật bất tử */
    { const OF=offOf(pl.prof); if(OF&&OF.rage&&m.dead<=t&&t>=(m.rageNext||0)){ m.rageNext=t+OF.rage.every*1000; m.rageU=t+OF.rage.dur*1000; st(pl); bcast({t:'mufx',k:'krage',to:pl.pid,dur:OF.rage.dur}); push(pl); } }   /* Mặt Nạ Quỷ: cứ every giây khát máu dur giây */
    if(m.dead>t||dotTick(pl,m,t)) continue; const h=m.hp, mp=m.mp; m.hp=Math.min(m.max,m.hp+m.max*M.regen.hp*.5*(m.regen||1)*(1-gwOf(m,t))); m.mp=Math.min(m.mmax,m.mp+m.mmax*M.regen.mp*.5*(m.regen||1)); if((Math.round(h)!==Math.round(m.hp)||Math.round(mp)!==Math.round(m.mp))&&Math.random()<.5) push(pl); }
  for(const pl of players.values()) if(pl.muDuel){ const q=players.get(pl.muDuel.other); if(!q||!inMu(q)||!inMu(pl)){ pl.muDuel=null; if(q) q.muDuel=null; push(pl); } }
  if(LIVE.size) pushBoss(); hpTick(); }catch(e){ console.error('[mu]',e); } },200);
// % máu người chơi trong MU / D-Day (thanh máu trên đầu đồng đội lúc đánh quái): gửi theo cảnh, nửa giây 1 lần, chỉ khi đổi
const HPKEY={};
function hpTick(){ const by={}, t=now(); for(const q of inScene()){ const m=q.mus; if(!m||!m.max||!rec(q.prof).cls) continue; (by[q.scene]=by[q.scene]||[]).push([q.pid,m.dead>t?0:Math.max(0,Math.min(100,Math.round(m.hp/m.max*100)))]); }
  for(const sc of Object.keys(HPKEY)) if(!by[sc]) delete HPKEY[sc]; for(const [sc,L] of Object.entries(by)){ const k=JSON.stringify(L); if(HPKEY[sc]===k) continue; HPKEY[sc]=k; for(const q of C.sceneOf(sc)) send(q,{t:'muhp',l:L}); } }
C.hook('login',pl=>{ if(pl.prof&&pl.prof.mu){ syncAcc(pl.prof); syncWep(pl.prof); } });
// tủ đồ (mọi map): đổi vũ khí / phụ kiện / thần thú đang dùng; chỉ số MU tính khi vào MU
on('gear',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const r=rec(p), k=String(m.k||'');
  if(m.op==='wep'){ if(k&&(!M.weapons[k]||!C.has(pl,k))) return {err:'Chưa có vũ khí này'}; r.wep=k; }
  else if(m.op==='acc'){ const slot=String(m.slot||''); if(!M.slots[slot]) return {err:'?'}; if(k&&(!M.acc[k]||M.acc[k].slot!==slot||!(r.accOwned||{})[k])) return {err:'Chưa có món này'}; r.acc=r.acc||{}; if(k) r.acc[slot]=k; else delete r.acc[slot]; syncAcc(p); }
  else if(m.op==='mount'){ const my=k&&S.mythOf(k,p), lv=(p.horse&&p.horse.myth)||0; if(!(p.horse&&p.horse.own)) return {err:'Chưa có ngựa riêng'}; if(k&&(!my||my.lv>lv)) return {err:'Chưa mở thần thú này'}; if(p.look) p.look.mount=k; }
  else return {err:'?'};
  syncWep(p); if(pl.mus) st(pl); markDirty(pl); C.refreshInfo(pl); if(inMu(pl)) push(pl); return {ok:true,look:p.look}; });
C.hook('enter',pl=>{ if(pl.scene==='mu'&&pl.prof) pl.prof.muOX=S.MU.OX;   /* đánh dấu vị trí MU theo toạ độ mới */
  if(MS.has(pl.scene)||EXTRA_SCENES.has(pl.scene)) setTimeout(()=>{ if(pl.prof){ send(pl,{t:'muboss',v:allView()}); push(pl); } },600); });
// lực chiến của 1 hồ sơ (bảng xếp hạng Lực chiến): chỉ người đã chọn class MU
const powerOf=p=>{ const r=p&&p.mu; if(!r||!r.cls) return 0; const ex=extraOf(p); return S.muPower(S.muStats(r.cls,r.lv,r.fruit,r.wep,lgOf(p),ex),{...ex,armor:ex.armor+(M.cls[r.cls].armor||0)}); };
module.exports={rec,st,push,view,inScene,bcast,alive,gainMu,hurtP,dist,EXTRA,powerOf,EXTRA_SCENES,RESPAWN,down,applyFx};
