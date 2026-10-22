// MU Online · rừng quái (MU.forest): 9 khu × 3 ổ, mỗi ổ 2–3 con cùng loài. Quái đi lang thang quanh ổ; người chơi MU (đã chọn class, còn sống) lại gần thì lao vào.
// Mỗi đòn có báo trước (windup): cận chiến tới lúc ra đòn mà người đã chạy khỏi tầm là hụt; đánh xa bắn đạn bay tới chỗ người lúc vung, đạn tới mà người đã né ra thì hụt.
// Đuổi quá leash ô khỏi ổ thì bỏ về, về tới ổ hồi đầy máu. Hạ quái: EXP + tiền + EXP MU chia theo phần sát thương (góp ≥ 15% nhận đủ EXP),
// người đánh nhiều nhất nhặt chiến lợi phẩm, có tỉ lệ ra Ngọc Cường Hoá. respawn giây sau con mới ra ở ổ cũ. Chỉ chạy AI khi có người ở MU.
'use strict';
const C=require('./core'), MU=require('./mu'), P=require('./places');
const {S,T,on,now,send,give,addItem,markDirty}=C;
const F=S.MU.forest, KI=Object.keys(F.mobs);
const MOBS=new Map(); let SEQ=1;
const rnd=(a,b)=>a+Math.random()*(b-a);
function make(k,pi,i){ const m=F.mobs[k], [px,py]=m.packs[pi], a=i*2.1+pi; const hx=px+Math.cos(a)*1.4, hy=py+Math.sin(a)*.9;
  return {id:SEQ++,k,pi,i,hx,hy,x:hx,y:hy,wx:hx,wy:hy,wait:0,hp:m.hp,max:m.hp,st:0,tgt:0,cd:0,wind:0,ax:0,ay:0,face:1,back:false,dmg:new Map(),dead:0}; }
for(const [k,m] of Object.entries(F.mobs)) m.packs.forEach((_,pi)=>{ for(let i=0;i<m.n;i++){ const o=make(k,pi,i); MOBS.set(o.id,o); } });
const SHOTS=[];   // đạn quái đánh xa đang bay: {o,q,x,y,at,dmg}
const ST={idle:0,walk:1,wind:2,back:3};
const dOf=(o,q)=>Math.hypot(q.x/T-o.x,q.y/T-o.y);
// hiệu ứng quái chỉ gửi cho người ở gần (trong khung nhìn rộng)
const nearB=(x,y,obj)=>{ for(const q of MU.inScene()) if(Math.abs(q.x/T-x)<26&&Math.abs(q.y/T-y)<20) send(q,obj); };
function step(o,tx,ty,v,dt){ if(o.slow>now()) v*=.45; const dx=tx-o.x,   /* bị làm chậm (Băng Phong của Lính Cát huyền thoại): đi chậm hơn hẳn */  dy=ty-o.y, d=Math.hypot(dx,dy); if(d<.05) return true; const s=Math.min(d,v*dt); o.x+=dx/d*s; o.y+=dy/d*s; if(Math.abs(dx)>.05) o.face=dx>0?1:-1; return s>=d; }
const wk=(o,t)=>o.weak&&o.weak.until>t?1-o.weak.mul:1;   /* bị Phun Lửa: đánh yếu đi */
let lastT=now();
function tick(){ const t=now(), dt=Math.min(.5,(t-lastT)/1000); lastT=t; if(!MU.inScene().length) return; const live=MU.alive();
  for(const o of MOBS.values()){ const m=F.mobs[o.k];
    if(o.dead){ if(t>=o.dead){ Object.assign(o,make(o.k,o.pi,o.i),{id:o.id}); } continue; }
    if(o.stun>t){ o.st=ST.idle; continue; }   /* bị choáng: đứng im, bỏ đòn đang vung */
    const home=Math.hypot(o.x-o.hx,o.y-o.hy);
    if(o.back){ o.st=ST.back; if(step(o,o.hx,o.hy,m.spd*1.6,dt)){ o.back=false; o.hp=o.max; o.dmg.clear(); o.st=ST.idle; } continue; }
    if(home>F.leash){ o.back=true; o.tgt=0; o.wind=0; continue; }
    // đang vung đòn: tới giờ thì ra đòn
    if(o.wind){ o.st=ST.wind; if(t<o.wind) continue; o.wind=0; o.cd=t+m.every*1000; const q=C.players.get(o.tgt);
      if(q&&live.includes(q)){ if(m.kind==='ranged'||m.kind==='float'&&m.range>2){ const d=Math.hypot(o.ax-o.x,o.ay-o.y); SHOTS.push({o,q,x:o.ax,y:o.ay,at:t+d/9*1000,dmg:m.atk*wk(o,t)}); nearB(o.x,o.y,{t:'mufx',k:'mobshot',id:o.id,mk:o.k,x0:o.x,y0:o.y,x:o.ax,y:o.ay,dur:d/9}); }
        else if(dOf(o,q)<=m.range+.6) MU.hurtP(q,m.atk*wk(o,t),`Bị ${m.name} hạ gục`,{mob:o.id}); else nearB(o.x,o.y,{t:'mufx',k:'mobmiss',id:o.id}); }
      o.st=ST.idle; continue; }
    // chọn mục tiêu: người đang đánh mình / gần nhất trong tầm aggro, không ra quá xa ổ
    let q=o.tgt&&C.players.get(o.tgt); if(q&&(!live.includes(q)||Math.hypot(q.x/T-o.hx,q.y/T-o.hy)>F.leash+2)) q=null;
    if(!q){ let best=F.aggro; for(const p of live){ const d=dOf(o,p); if(d<best&&Math.hypot(p.x/T-o.hx,p.y/T-o.hy)<F.leash){ best=d; q=p; } } }
    o.tgt=q?q.pid:0;
    if(q){ const d=dOf(o,q), px=q.x/T, py=q.y/T;
      if(d<=m.range){ o.face=px>=o.x?1:-1; if(t>=o.cd){ o.wind=t+F.windup*1000; o.ax=px; o.ay=py; o.st=ST.wind; nearB(o.x,o.y,{t:'mufx',k:'mobwind',id:o.id,mk:o.k,x:px,y:py,dur:F.windup}); } else o.st=ST.idle; }
      else { step(o,px,py,m.spd,dt); o.st=ST.walk; }
      continue; }
    // không có ai: đi lang thang quanh ổ
    if(t>=o.wait){ if(step(o,o.wx,o.wy,m.spd*.35,dt)){ o.wait=t+rnd(2500,6000); const a=rnd(0,6.283), r=rnd(0,2.2); o.wx=o.hx+Math.cos(a)*r; o.wy=o.hy+Math.sin(a)*r*.6; o.st=ST.idle; } else o.st=ST.walk; }
    else o.st=ST.idle; }
  // đạn tới đích: người còn đứng gần chỗ ngắm (≤ 1,1 ô) thì trúng
  for(let i=SHOTS.length-1;i>=0;i--){ const s=SHOTS[i]; if(t<s.at) continue; SHOTS.splice(i,1); const q=s.q, m=F.mobs[s.o.k];
    if(live.includes(q)&&Math.hypot(q.x/T-s.x,q.y/T-s.y)<=1.1) MU.hurtP(q,s.dmg,`Bị ${m.name} hạ gục`,{mob:s.o.id}); }
  sync(); }
// gửi mỗi người các con quái trong 22 ô: [id, loài, x×10, y×10, % máu, trạng thái, hướng]; chỉ gửi khi đổi
function sync(){ for(const pl of MU.inScene()){ if(!pl.ws||pl.ws.readyState!==1) continue; const px=pl.x/T, py=pl.y/T, L=[];
    if(py>S.MU.town-12) for(const o of MOBS.values()){ if(o.dead||Math.abs(o.x-px)>22||Math.abs(o.y-py)>16) continue; L.push([o.id,KI.indexOf(o.k),Math.round(o.x*10),Math.round(o.y*10),Math.ceil(o.hp/o.max*100),o.st,o.face]); }
    const key=JSON.stringify(L); if(key===pl._mobKey) continue; pl._mobKey=key; send(pl,{t:'mumob',l:L}); } }
setInterval(()=>{ try{ tick(); }catch(e){ console.error('[muforest]',e); } },200);
// trúng đòn người chơi: cộng phần sát thương, quay sang đánh người đó; hết máu thì chia thưởng
function hit(o,d,pl){ if(o.dead) return 'mob:'+o.id; o.hp-=d; o.dmg.set(pl.uid,(o.dmg.get(pl.uid)||0)+d); if(!o.tgt&&!o.back) o.tgt=pl.pid; if(o.hp<=0) die(o); return 'mob:'+o.id; }
function die(o){ const m=F.mobs[o.k], t=now(); o.dead=t+F.respawn*1000; o.hp=0; o.wind=0; o.tgt=0;
  const total=[...o.dmg.values()].reduce((a,v)=>a+v,0)||1, top=[...o.dmg.entries()].sort((a,b)=>b[1]-a[1]).filter(([u])=>C.byUid.get(u));
  nearB(o.x,o.y,{t:'mufx',k:'mobdie',id:o.id,mk:o.k,x:o.x,y:o.y});
  top.forEach(([uid,dd],rank)=>{ const pl=C.byUid.get(uid); if(!pl||!pl.prof) return; const sh=dd/total, items={};
    if(rank===0){ if(Math.random()<F.mat) items[m.mat]=1; if(Math.random()<F.gem(m.tier)) items.ngoc_ch=1; if(Math.random()<F.gemHt(m.tier)) items.ngoc_ch_ht=1; }
    const g=C.gainExp(pl,Math.round(m.exp*(sh>=.15||rank===0?1:sh))), vnd=Math.max(1,Math.round(m.vnd*sh)), mu=Math.max(1,Math.round(m.mu*(sh>=.15?1:sh)));
    give(pl,vnd); for(const [k,n] of Object.entries(items)) addItem(pl,k,n); MU.gainMu(pl,mu); const r=MU.rec(pl.prof); r.mobs=(r.mobs||0)+1; markDirty(pl);
    if(g.level){ send(pl,{t:'rw',msg:'',level:g.level}); C.refreshInfo(pl); }
    if(items.ngoc_ch||items.ngoc_ch_ht) C.note(pl,`💎 ${m.name} rơi ${items.ngoc_ch_ht?'Ngọc Cường Hoá Huyền Thoại':'Ngọc Cường Hoá'}!`,'item');
    send(pl,{t:'mobloot',id:o.id,x:o.x,y:o.y,exp:g.exp||0,vnd,mu,items}); MU.push(pl); }); }
// cho mu.js: con quái gần người nhất (để chiêu / Min / Lính Cát nhắm vào)
MU.EXTRA.push({kind:'mob',nearest:pl=>{ const px=pl.x/T, py=pl.y/T; if(pl.scene!=='mu'||py<S.MU.town-4) return null; let best=null, bd=1e9;
  for(const o of MOBS.values()){ if(o.dead) continue; const d=Math.hypot(o.x-px,o.y-py); if(d<bd){ bd=d; best=o; } }
  if(!best||bd>14) return null; return asTarget(best,bd); },
  // các con quái khác quanh 1 điểm (giật lan): n con gần nhất trong r ô, trừ con đang nhắm
  byId:(id,pl)=>{ const o=MOBS.get(id); return o&&!o.dead&&pl.scene==='mu'?asTarget(o,Math.hypot(pl.x/T-o.x,pl.y/T-o.y)):null; },
  around:(x,y,r,n,skip,sc)=>sc&&sc!=='mu'?[]:[...MOBS.values()].filter(o=>!o.dead&&o.id!==skip&&Math.hypot(o.x-x,o.y-y)<=r).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,n).map(o=>asTarget(o,0))});
function asTarget(o,d){ const m=F.mobs[o.k]; return {id:o.id,x:o.x,y:o.y,d,def:m.def,rad:m.big?.9:.5,hit:(dd,p)=>hit(o,dd,p),slow:sec=>{ o.slow=now()+sec*1000; },stun:sec=>{ o.stun=now()+sec*1000; o.wind=0; },weak:(mul,sec)=>{ o.weak={until:now()+sec*1000,mul}; }}; }
// thu mua chiến lợi phẩm rừng (Phù Thuỷ Cường Hoá): bán 1 loại hoặc tất cả
on('mobsell',(pl,m)=>{ if(pl.scene!=='mu'||!P.nearNpc(pl,'mu_enchant')) return {err:'Gặp Phù Thuỷ Cường Hoá ở quảng trường'}; const it=pl.prof.items, ks=m.k?[String(m.k)]:Object.keys(S.MU.matPrice);
  let sum=0, n=0; for(const k of ks){ const c=it[k]|0, pr=S.MU.matPrice[k]; if(!c||!pr) continue; addItem(pl,k,-c); sum+=c*pr; n+=c; }
  if(!n) return {err:'Chưa có chiến lợi phẩm rừng để bán'}; give(pl,sum); markDirty(pl); return {msg:`Bán ${n} chiến lợi phẩm được ${S.fmt(sum)}`}; });
C.hook('enter',pl=>{ pl._mobKey=''; });
module.exports={MOBS};
