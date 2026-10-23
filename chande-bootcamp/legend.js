/* Chan City — 3 ô item huyền thoại cạnh thanh đồ (Cái Pod của Kaixa, Cây Bút của Redtype, Airpod của VNPT): chưa đủ 15 mảnh thì xám + số mảnh,
   bấm vào mở bảng 15 mảnh (nhiệm vụ / nhiệm vụ ẩn / câu đố / nhiệm vụ nhóm) có nút ➜ tự đi tới (khác map thì tự gọi Grab). Phiến đá câu đố + vòng sáng nhiệm vụ nhóm vẽ trên map,
   lại gần bấm E. Cây Bút: phím 6 (trong MU) hoá gà quái gần nhất + làm mới mọi chiêu. Hiệu ứng: gà thay boss / quái, khiên bất tử của Airpod. */
(function(){
const SD=SHARED, L=SD.LEGEND, T=ART.T, X=MAPX, esc=s=>GAME.esc(String(s)), toast=(m,k)=>GAME.toast(m,k), G=()=>GAME.G||{}, btn=UI.btn;
const TYPE={q:['📜','Nhiệm vụ'],qs:['🔍','Nhiệm vụ ẩn'],puz:['🧩','Câu đố logic'],grp:['👥','Nhiệm vụ nhóm'],ach:['🏆','Thành tựu']};
const fv=(t,v)=>t.money?SD.fmt(v):String(v);   /* số tiến độ: tiền thì định dạng đồng */
const kindOf=t=>t.t==='q'?(SD.QUESTS[t.q]&&SD.QUESTS[t.q].secret?'qs':'q'):t.t;
const sceneName=sc=>{ const d=SD.SCENE_DEST[sc]||sc; return (SD.DEST[d]&&SD.DEST[d].name.split(' (')[0])||sc; };
// icon 32×32 vẽ tay: Pod tím ánh vàng, Bút đỏ ngòi vàng, Airpod trắng viền xanh VNPT
const ICON={};
function icon(k){ if(ICON[k]) return ICON[k]; const c=ART.cv(32,32), g=c.getContext('2d'), R=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(x,y,w,h); };
  if(k==='pod'){ R(9,4,14,24,'#1c1516'); R(10,5,12,22,'#7a3ac8'); R(10,5,12,3,'#b070ff'); R(12,9,8,8,'#1a1030'); R(13,10,6,6,'#5ae8f0'); R(14,11,2,2,'#ffffff'); R(10,20,12,2,'#ffd84a'); R(14,23,4,3,'#ffd84a'); R(21,6,1,20,'#4a2a8a'); }
  else if(k==='but'){ g.save(); g.translate(16,16); g.rotate(-.75); R(-3,-14,6,22,'#1c1516'); R(-2,-13,4,20,'#e8302a'); R(-2,-13,1,20,'#ff7a6a'); R(-3,-15,6,3,'#c8c8d0'); R(2,-12,1,10,'#ffd84a'); R(-2,7,4,3,'#ffd84a'); R(-1,10,2,4,'#ffe9a0'); R(0,13,1,2,'#1c1516'); g.restore(); }
  else { for(const [x,s] of [[7,1],[19,-1]]){ R(x,6,7,9,'#1c1516'); R(x+1,7,5,7,'#f4f6fa'); R(x+1,7,5,2,'#ffffff'); R(x+2+(s>0?0:1),15,2,12,'#1c1516'); R(x+2+(s>0?0:1),15,1,11,'#e8ecf4'); R(x+2,9,2,2,'#3a8ae8'); } R(6,27,20,3,'#1c1516'); R(7,27,18,2,'#3a8ae8'); }
  return ICON[k]=c.toDataURL(); }
const own=k=>SD.legendOwn(G(),k), cnt=k=>SD.legendCount(G(),k);
// 3 ô cạnh thanh đồ (game.js ghép vào #hudItems mỗi lần vẽ HUD)
const LEGUI={slots(){ const now=NET.now(), b=G().legend||{}; return '<span class="lgsep"></span>'+Object.entries(L.items).map(([k,I])=>{ const o=own(k), cd=k==='but'&&o&&(b.butAt||0)>now?Math.ceil((b.butAt-now)/1000):0;
    return `<button class="slot lgslot ${o?'on':'off'}" type="button" data-lg="${k}" title="${esc(I.name)}: ${esc(I.desc)}" style="--lc:${I.col}"><img src="${icon(k)}" alt="">${o?(I.key?`<kbd>${I.key}</kbd>`:'<b>✔</b>'):`<i>${cnt(k)}/${L.need}</i>`}${cd?`<em>${cd}</em>`:''}</button>`; }).join(''); }};
// thẻ 3 món trong banner Đại nhiệm vụ Tân Thế Giới Chande
LEGUI.banner=()=>Object.entries(L.items).map(([k,I])=>`<button type="button" class="evlgi" data-lg="${k}" style="--lc:${I.col}"><img src="${icon(k)}" alt=""><b>${esc(I.name)}</b><small>${own(k)?'✔ Đã ghép xong':`Mảnh ${cnt(k)}/${L.need} · ➜ xem đường đi`}</small></button>`).join('');
window.LEGUI=LEGUI;
document.addEventListener('click',e=>{ const b=e.target.closest('.lgslot,.evlgi'); if(!b) return; e.stopPropagation(); b.blur(); if(b.classList.contains('evlgi')) document.getElementById('evBanner').hidden=true; openItem(b.dataset.lg); },true);
function line(t){ const done=SD.legendDone(G(),t), k=kindOf(t), [ic,tn]=TYPE[k], q=t.t==='q'&&SD.QUESTS[t.q], st=q&&(G().quests||{})[t.q];
  const what=t.t==='q'?esc(q.title.replace('🔍 ','')):t.t==='puz'?'Phiến đá câu đố cổ':t.t==='ach'?esc(t.label):esc(t.label)+` (cần ${t.n} người)`;
  const where=t.t==='ach'?esc(t.where):t.t==='q'?esc(sceneName(GAME.npcScene(q.giver)||'retreat'))+' · '+esc((SD.NPC_LOOKS[q.giver]||{}).name||q.giver):esc(t.where);
  const av=t.t==='ach'?Math.min(t.need,SD.legendAch(G(),t.st)):0; const hint=t.t==='ach'?`${fv(t,av)} / ${fv(t,t.need)}${done?' ✔':''}`:t.t==='q'?(done?'Đã xong':k==='qs'&&!st?'Nhiệm vụ ẩn: tự lục lọi, nói chuyện, để ý đồ vật lạ ở map này':st==='active'?'Đang làm: bấm ➜ đi tiếp':'Gặp người giao để nhận việc'):t.t==='puz'?(done?'Đã giải':'Lại gần phiến đá, bấm E để trả lời'):(done?'Đã xong':`Rủ ${t.n-1} người nữa cùng đứng vào vòng sáng, ai cũng bấm E trong 15 giây`);
  return `<div class="lgrow ${done?'done':''}"><span class="lgic">${done?'✔':ic}</span><span><b>${what}</b> <small class="lgty">${tn}</small><br><small class="muted">📍 ${where} · ${hint}</small></span>${done||(t.t==='ach'&&!t.go)?'':btn('lggo','➜',{id:t.id},'pri')}</div>${t.t==='ach'&&!done?`<div class="lgbar sm"><i style="width:${Math.round(av/t.need*100)}%"></i></div>`:''}`; }
function openItem(k){ const I=L.items[k]; UI.open('✨ '+I.name,()=>{ const n=cnt(k), o=n>=L.need, list=L.tasks.filter(t=>t.it===k);
  return `<div class="lghead" style="--lc:${I.col}"><img src="${icon(k)}" width="64" height="64" alt=""><div><b>${esc(I.name)}</b><p>${esc(I.desc)}</p><div class="lgbar"><i style="width:${Math.round(n/L.need*100)}%"></i></div><small>${o?'✔ Đã ghép đủ, đang có hiệu lực':`Mảnh: ${n}/${L.need} · tìm ở ${esc(I.map)}`}</small>${o&&k==='but'?' '+btn('lguse','✏️ Dùng (phím 6, trong MU)',{},'pri'):''}</div></div>
    <div class="lglist">${list.map(line).join('')}</div>`; },{wide:true}); }
// ➜: nhiệm vụ → dẫn như bảng Việc cần làm (chưa nhận thì về gặp người giao); câu đố / nhóm → tự đi tới phiến đá / vòng sáng (khác map thì tự gọi Grab)
UI.onAct('lggo',d=>{ const t=L.tasks.find(x=>x.id===d.id); if(!t) return; UI.closeAll();
  if(t.t==='q'){ const q=SD.QUESTS[t.q], st=(G().quests||{})[t.q]; if(st==='active') return GAME.questGo(t.q); const sc=GAME.npcScene(q.giver);
    if(!sc) return toast('Người giao việc này đi lang thang: mở bản đồ (M) tìm nhé','quest'); return GAME.autoGo(sc,()=>{ if(q.secret&&!st) toast(`🔍 ${esc(q.title)}: nhiệm vụ ẩn, tự khám phá quanh đây`,'quest'); GAME.walkToNpc(q.giver); }); }
  if(t.t==='ach'){ const g=t.go; if(!g) return toast(esc(t.where),'quest'); return GAME.autoGo(g.sc,()=>{ if(g.place){ const pc=SD.PLACES[g.place]; GAME.walkTo(pc.door.x,pc.door.y,pc.name,()=>GAME.act({t:'enter',place:g.place})); } else if(g.npc) GAME.walkToNpc(g.npc); else toast(esc(t.label)+': '+esc(t.where),'quest'); }); }
  GAME.autoGo(t.sc,()=>{ const s=spot(t); GAME.walkTo(s.x,s.y+.6,t.t==='puz'?'Phiến đá câu đố':t.label); }); });
UI.onAct('lguse',()=>usePen());
async function usePen(){ if(!own('but')) return; if(!['mu','muw'].includes(GAME.S.kind)&&!String(GAME.S.kind).startsWith('dday')) return toast('Cây Bút chỉ dùng trong MU Online','lock'); const r=await GAME.act({t:'mu',op:'pen'}); if(r&&!r.err){ toast(esc(r.msg),'item'); GAME.sfx('power_up',.6); } }
addEventListener('keydown',e=>{ if(e.key!=='6'||e.repeat||/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'')) return; if(['mu','muw'].includes(GAME.S&&GAME.S.kind)||String(GAME.S&&GAME.S.kind).startsWith('dday')) usePen(); });
NET.listen('legend',m=>{ const I=L.items[m.it]; if(!I) return; GAME.sfx(m.done?'level_up':'item_pickup',.7); if(m.done) GAME.bigText(I.name.toUpperCase()+'!'); GAME.renderHUD&&GAME.renderHUD(); UI.refresh&&UI.refresh(); });
// chỗ câu đố / vòng nhóm: dời sang ô đi được gần nhất nếu toạ độ rơi vào vật cản
const FIX={}; function spot(t){ const S=GAME.S, k=t.id+S.kind; if(FIX[k]) return FIX[k]; let best={x:t.x,y:t.y}; if(S.solid&&S.kind===t.sc){ const ok=(x,y)=>x>=0&&y>=0&&x<S.W&&y<S.H&&S.solid[y*S.W+x]!==1;
    if(!ok(Math.floor(t.x),Math.floor(t.y))) outer: for(let r=1;r<=4;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(ok(Math.floor(t.x)+dx,Math.floor(t.y)+dy)){ best={x:Math.floor(t.x)+dx+.5,y:Math.floor(t.y)+dy+.5}; break outer; } }
  return FIX[k]=best; }
const here=()=>L.tasks.filter(t=>t.t!=='q'&&GAME.S&&GAME.S.kind===t.sc&&!SD.legendDone(G(),t));
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); for(const t of here()){ const s=spot(t), d=dist(s.x*T,s.y*T); if(d<1.8*T) consider(d*.5,{type:'mapx',k:t.t==='puz'?'lgpuz':'lggrp',id:t.id,label:t.t==='puz'?'🧩 Giải câu đố cổ':`👥 ${t.label} (cần ${t.n} người)`}); } };
const p0=X.pick; X.pick=async x=>{ if(x.k==='lgpuz') return puzzle(x.id); if(x.k==='lggrp'){ const r=await GAME.act({t:'legend',op:'group',id:x.id}); if(r&&!r.err) toast(esc(r.msg),r.wait?'quest':'item'); return; } return p0(x); };
function puzzle(id){ const t=L.tasks.find(x=>x.id===id), I=L.items[t.it]; UI.open('🧩 Phiến đá câu đố cổ',()=>`<p class="muted">Giải đúng nhận 1 mảnh <b>${esc(I.name)}</b>.</p><p class="lgq">"${esc(t.q)}"</p>
  <form class="lgans" data-id="${t.id}"><input id="lgAns" maxlength="40" autocomplete="off" placeholder="Câu trả lời..." aria-label="Câu trả lời"><button class="btn pri" type="submit">Trả lời</button></form>`,{}); setTimeout(()=>{ const i=document.getElementById('lgAns'); if(i) i.focus(); },50); }
document.addEventListener('submit',async e=>{ const f=e.target.closest('.lgans'); if(!f) return; e.preventDefault(); const a=f.querySelector('input').value.trim(); if(!a) return; const r=await GAME.act({t:'legend',op:'answer',id:f.dataset.id,a}); if(r&&!r.err){ UI.closeAll(); toast(esc(r.msg),'item'); } });
// ông Trường Con ở Miếu: xin Xích Thố (xong 4 nhiệm vụ của ông thì ông trao ngựa)
{ const c1=X.consider; X.consider=(consider,dist)=>{ c1(consider,dist); const S=GAME.S, n=SD.NPCS.find(x=>x.id==='truongcon'); if(!S||S.kind!=='mieu'||!n||(G().xt&&G().xt.lv)) return; const d=dist(n.x*T,n.y*T); if(d<2.6*T) consider(d*.6+4,{type:'mapx',k:'xtclaim',label:'🐎 Xin ông Trường Con cưỡi Xích Thố'}); };
  window.XT_CLAIM=async()=>{ const r=await GAME.act({t:'xichtho',op:'claim'}); if(r&&!r.err){ const g=GAME.G; if(r.horse) g.horse=r.horse; if(r.look) g.look=r.look; if(r.xt) g.xt=r.xt; UI.closeAll(); GAME.bigText('XÍCH THỐ!'); GAME.sfx('level_up',.8); toast(esc(r.msg),'item'); } return r; };   /* dùng chung: phím E cạnh ông, nút trong bảng ông Trường Con */
  const p1=X.pick; X.pick=async x=>{ if(x.k!=='xtclaim') return p1(x); window.XT_CLAIM(); }; }
// hiệu ứng: gà thay boss / quái (2 giây), khiên bất tử Airpod (3 giây), bút loé sáng
const CHICK=[], AIR=new Map();
NET.listen('mufx',e=>{ const t=performance.now(); if(e.k==='chick'&&!e.boss) CHICK.push({x:e.x*T,y:e.y*T,end:t+e.dur*1000}); if(e.k==='chick'){ GAME.sfx('poof',.5); } if(e.k==='airpod'){ AIR.set(e.to,t+e.dur*1000); if(e.to===NET.pid) GAME.bigText('AIRPOD: BẤT TỬ!'); } });
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const cam=GAME.cam, now=performance.now(), clock=GAME.clock;
  for(const t of here()){ const s=spot(t), x=s.x*T-cam.x, y=s.y*T-cam.y, col=L.items[t.it].col; list.push({y:s.y*T-2,d:()=>{ ctx.save();
      if(t.t==='puz'){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y+1,9,3,0,0,7); ctx.fill(); ctx.fillStyle='#1c1516'; ctx.fillRect(x-7,y-17,14,18); ctx.fillStyle='#8a8478'; ctx.fillRect(x-6,y-16,12,16); ctx.fillStyle='#a8a296'; ctx.fillRect(x-6,y-16,12,3);   /* phiến đá cổ khắc dấu ? phát sáng */
        ctx.globalAlpha=.6+.4*Math.sin(clock*3); ctx.fillStyle=col; ctx.font='14px VT323, monospace'; ctx.textAlign='center'; ctx.fillText('?',x,y-4); }
      else { ctx.globalAlpha=.35+.25*Math.sin(clock*3); ctx.strokeStyle=col; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.lineDashOffset=-clock*20; ctx.beginPath(); ctx.ellipse(x,y,2.6*T,1.3*T,0,0,7); ctx.stroke(); ctx.setLineDash([]);   /* vòng sáng nhóm */
        ctx.globalAlpha=.18; ctx.fillStyle=col; ctx.fill(); ctx.globalAlpha=.9; ctx.font='14px VT323, monospace'; ctx.textAlign='center'; ctx.fillStyle='#1c1516'; ctx.fillText('👥 '+t.n,x+1,y+5); ctx.fillStyle='#ffffff'; ctx.fillText('👥 '+t.n,x,y+4); }
      ctx.restore(); }}); }
  for(let i=CHICK.length-1;i>=0;i--){ const c=CHICK[i]; if(now>c.end){ CHICK.splice(i,1); continue; } list.push({y:c.y+3,d:()=>{ const s=ART.chicken(Math.floor(clock*6)%4); ctx.drawImage(s.c,Math.round(c.x-cam.x-s.ax*2),Math.round(c.y-cam.y-s.ay*2),s.c.width*2,s.c.height*2); }}); }
  for(const [pid,end] of AIR){ if(now>end){ AIR.delete(pid); continue; } const P=pid===NET.pid?GAME.P:(GAME.REM&&GAME.REM.get(pid)); if(!P) continue; list.push({y:P.y+1,d:()=>{ ctx.save(); ctx.globalAlpha=.3+.15*Math.sin(clock*8); ctx.strokeStyle='#5ae8f0'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(P.x-cam.x,P.y-cam.y-18,14,22,0,0,7); ctx.stroke(); ctx.globalAlpha=.12; ctx.fillStyle='#5ae8f0'; ctx.fill(); ctx.restore(); }}); } };
})();
