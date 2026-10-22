/* Chan City — MU · vùng boss phía Tây (client, cùng map MU, x 0–63): quầy vé Làng Meme dưới cổng làng
   (mỗi ngày 3 vé, 1 triệu / vé, server muwest.js), cổng ra cầu vồng trong làng, Huy Hiệu Pepe đổi 1 trong 3 thần thú siêu huyền thoại (linhcat.js op badge).
   Boss, quái con, đạn, hiệu ứng choáng / chậm / độc vẽ ở maps8. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, M=SD.MU, ME=M.west.meme, L=SD.LINHCAT, SP=SD.LC_SPECIES, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a);
const CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn()), kind=()=>GAME.S&&GAME.S.kind;
const inMeme=(x,y)=>x>=ME.x0&&x<=ME.x1+1&&y>=ME.y0&&y<=ME.y1+1;
// điểm bấm E: [cảnh, x, y, bán kính ô, mã, nhãn]
const PP=M.west.zones.dora.pipes, SPOTS=[['mu',ME.booth.x,ME.booth.y+.4,2.4,'memebooth','Quầy vé Làng Meme (đánh Pepe)'],['mu',ME.exit.x,ME.exit.y,2.2,'memeout','Ra khỏi Làng Meme'],['mu',PP.x,PP.y+.6,3,'pipesit','Ngồi lên ống cống'],['mu',M.nap.x,M.nap.y+.4,2.6,'munap',`Ngủ trưa (+${M.nap.energy} năng lượng · ${SD.fmt(M.nap.price)})`]];
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); const k=kind(); if(k!=='mu') return;
  for(const [sc,x,y,r,id,label] of SPOTS){ if(sc!==k) continue; const d=dist(x*T,y*T); if(d<r*T) consider(d*.4,{type:'mapx',k:id,label}); } };
const p0=X.pick; X.pick=async x=>{
  if(x.k==='memeout'){ const r=await GAME.act({t:'muw',op:'out'}); if(r&&!r.err) GAME.sfx('poof',.5); return; }
  if(x.k==='memebooth') return UI.memeBooth();
  if(x.k==='munap'){ const r=await GAME.act({t:'munap'}); if(r&&!r.err){ GAME.sfx('item_pickup',.5); toast('😴 '+esc(r.msg),'quest'); } return; }
  if(x.k==='pipesit'){ const P=GAME.P, [sx,sy]=PP.sit.slice().sort((a,b)=>Math.hypot(a[0]*T-P.x,a[1]*T-P.y)-Math.hypot(b[0]*T-P.x,b[1]*T-P.y))[0]; P.x=sx*T; P.y=sy*T; P.view='down'; P.seat={lift:16}; GAME.sfx('blip',.4); toast('Ngồi trên ống cống ngắm Phố Nobita (bấm phím đi để xuống)','item'); return; }   /* ngồi kiểu bọn trẻ trong truyện */
  return p0(x); };
// hoạt ảnh cổng ra cầu vồng
const a0=X.anim; X.anim=(o,clock)=>{ if(o.anim==='memeportal'){ const f=Math.floor(clock*4)%5; return cached('mp'+f,()=>A.memePortal(f)); } return a0?a0(o,clock):null; };

/* ---------- quầy vé Làng Meme ---------- */
let TICKET=null;
UI.memeBooth=async()=>{ UI.open('Quầy vé Làng Meme',()=>{ const t=TICKET, me=window.MU8&&window.MU8.me&&window.MU8.me(), pepe=((window.MU8&&window.MU8.boss().list)||[]).find(b=>b.id==='pepe'), R=M.reward.pepe;
    return `<p>"Vào làng là gặp <b>Pepe</b> chú hề: máu gấp 50 lần boss thường. Cứ 5 giây <b>toả đạn vòng tròn</b>, 15 giây <b>nhảy đè làm choáng</b>, 30 giây <b>gọi 10 Pepe Con</b> chạy rất nhanh, 40 giây gọi <b>mưa thiên thạch</b>. Đông người vào cùng thì dễ hơn đấy!"</p>
      <p>Vé: <b>${SD.fmt(ME.ticket)}</b> / lần vào · mỗi ngày tối đa <b>${ME.perDay} vé</b>${t?` · hôm nay còn <b>${t.left}</b> vé`:''}.${M.bossPerDay?` Mỗi người hạ mỗi boss tối đa ${M.bossPerDay} lần / ngày.`:' Hạ boss không giới hạn số lần.'}</p>
      <p>${pepe?`Pepe đang ở trong làng: còn <b>${SD.fmt(Math.max(0,pepe.hp)).replace('đ','')}</b> / ${SD.fmt(pepe.max).replace('đ','')} máu`:'Pepe đang hồi sức, lát nữa quay lại.'}</p>
      <p class="muted">Hạ Pepe: +${R.exp} EXP, ${SD.fmt(R.vnd)}, ${R.mu} EXP MU, ${R.gems} Ngọc Cường Hoá, ngọc quý, +1 cấp nội tại ngẫu nhiên. Top 3 sát thương chắc chắn được 🏅 <b>Huy Hiệu Pepe</b>
        (người khác ${Math.round(R.badgeChance*100)}%): mang tới Trung tâm Lính Cát đổi 1 trong 3 thần thú siêu huyền thoại, chỉ số ×15.</p>
      <div class="row">${btn('memebuy','🎟 Mua vé & vào làng','',me&&me.cls&&(!t||t.left>0)?'pri':'')}${(G().items||{}).huy_hieu_pepe?btn('pepebadge','🏅 Dùng Huy Hiệu Pepe'):''}</div>`; },{wide:true});
  const r=await NET.req({t:'muw',op:'info'}); if(r&&!r.err){ TICKET=r; UI.refresh(); } };
UI.onAct('memebuy',async()=>{ const r=await GAME.act({t:'muw',op:'ticket'}); if(!r||r.err) return; UI.closeAll(); GAME.bigText('LÀNG MEME!'); GAME.sfx('power_up',.7); toast(esc(r.msg),'quest'); });

/* ---------- Huy Hiệu Pepe: chọn 1 trong 3 thần thú siêu huyền thoại ---------- */
const lcImg=sp=>cached('lci'+sp,()=>{ const s=A.linhcat(sp), c=A.cv(56,56), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,56,56); return c.toDataURL(); });
UI.pepeBadge=()=>UI.open('Huy Hiệu Pepe · chọn thần thú',()=>{ const n=(G().items||{}).huy_hieu_pepe||0;
  return `<p>Có <b>${n}</b> Huy Hiệu Pepe. Mỗi huy hiệu đổi được <b>1</b> thần thú siêu huyền thoại cấp ${L.badge.lv}: chỉ số <b>×15</b> so với Lính Cát thường, đứng đầu đội thì ra trận ở MU với <b>kỹ năng siêu huyền thoại</b>.</p>
    <div class="list">${L.badge.choices.map(sp=>{ const s=SP[sp], k=L.superSkill[sp]; return `<div class="row lcrow"><img src="${lcImg(sp)}" width="56" height="56" alt=""><span><b>${esc(s.name)}</b><br><small>${esc(s.desc||'')}</small><br>
      <small class="good">★ ${esc(k.name)}: đòn ×${k.mul}${k.chain?`, giật lan ${k.chain} con`:''}${k.aoe?`, nổ lan ${k.aoe} ô`:''}${k.slow?`, làm chậm ${k.slow}s`:''}${k.heal?`, hồi ${Math.round(k.heal*100)}% máu cả đội`:''} · mỗi ${k.every}s</small></span>${btn('pepepick','Chọn',{sp},n?'pri':'')}</div>`; }).join('')}</div>`; },{wide:true});
UI.onAct('pepebadge',()=>UI.pepeBadge());
UI.onAct('pepepick',async d=>{ const r=await GAME.act({t:'lc',op:'badge',sp:d.sp}); if(!r||r.err) return; GAME.sfx('level_up',.9); GAME.bigText('THẦN THÚ SIÊU HUYỀN THOẠI!'); toast(esc(r.msg),'item'); UI.refresh(); });
// minimap: chấm vàng ở cổng / quầy vé
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k==='mu') dot(ME.booth.x*T,ME.booth.y*T,'#ffd84a',2); };
void inMeme;
})();
