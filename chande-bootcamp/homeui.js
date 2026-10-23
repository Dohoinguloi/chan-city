/* Chan City — sửa nhà riêng (server home.js, dữ liệu data.js HOME): nút 🛠 Sửa nhà khi đứng trong nhà mình (hoặc bấm R).
   Chế độ Sửa nhà: thanh dưới có kho đồ, 🛒 cửa hàng nội thất, 🎨 sàn & tường, 🏗 mở rộng nhà. Chọn món trong kho → bóng mờ theo chuột (xanh đặt được, đỏ kèm lý do) → bấm chuột trái đặt.
   Bấm vào món đã đặt để nhấc lên dời chỗ · R xoay (lật trái phải) · Delete cất vào kho · chuột phải / Esc thôi cầm. */
(function(){
const SD=SHARED, HM=SD.HOME, A=ART, T=A.T, X=MAPX, fmt=SD.fmt, esc=s=>GAME.esc(String(s)), toast=(m,k)=>GAME.toast(m,k), btn=UI.btn, $=s=>document.querySelector(s);
const ED={on:false,hold:null,hover:null,tab:'moi',msg:''};
const ownHome=()=>{ const S=GAME.S; return !!(S&&S.kind==='room'&&!S.host); };
const home=()=>GAME.HOME||SD.homeDefault(), mine=()=>GAME.HOME_MINE||{inv:{},own:{floor:{go:1},wall:{kem:1}},open:true};
async function act(q){ const r=await GAME.act(q); if(r&&!r.err&&r.msg) toast(esc(r.msg),'item'); return r; }
// ảnh nhỏ của từng món cho cửa hàng / kho
const TH={};
function thumb(k){ if(TH[k]) return TH[k]; const d=HM.items[k], c=A.cv(48,40), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  if(d.rug){ g.fillStyle='#b5483c'; g.fillRect(4,10,40,20); g.fillStyle='#e8c38a'; g.fillRect(4,10,40,2); g.fillRect(4,28,40,2); g.fillStyle='#8f3328'; for(let i=8;i<44;i+=8) g.fillRect(i,18,2,2); }
  else { const s=A[d.art](...(d.args||[])), sc=Math.min(1,46/s.c.width,38/s.c.height); g.drawImage(s.c,Math.round(24-s.c.width*sc/2),Math.round(39-s.c.height*sc),Math.round(s.c.width*sc),Math.round(s.c.height*sc)); }
  return TH[k]=c.toDataURL(); }
// thanh ấm cúng có tên bậc (Trống trải → Tổ ấm mơ ước)
const meter=c=>`<span class="hcz" title="Độ ấm cúng: nội thất + sàn + tường + thưởng bộ sưu tập"><i style="width:${Math.round(c/HM.cozyMax*100)}%"></i><em>${c}/${HM.cozyMax} · ${esc(SD.homeTier(c))}</em></span>`;
const sizeTxt=d=>d.wall?`treo tường · rộng ${d.fw} ô`:`${d.fw}×${d.fh||1} ô`;

/* ---------- nút Sửa nhà + thanh công cụ ---------- */
const BTN=document.createElement('button'); BTN.type='button'; BTN.id='btnHome'; BTN.className='btn pri'; BTN.textContent='🛠 Sửa nhà'; BTN.hidden=true; document.body.appendChild(BTN);
BTN.addEventListener('click',e=>{ e.currentTarget.blur(); edit(true); });
const BAR=document.createElement('div'); BAR.id='homeBar'; BAR.className='panel'; BAR.hidden=true; document.body.appendChild(BAR);
setInterval(()=>{ const own=ownHome(); BTN.hidden=!own||ED.on; if(ED.on&&!own) edit(false); },400);
function edit(on){ ED.on=on; ED.hold=null; ED.msg=''; BAR.hidden=!on; if(on){ UI.closeAll(); bar(); toast('🛠 Chế độ Sửa nhà: chọn món trong kho để đặt, bấm vào món đã đặt để dời','item'); } }
function bar(){ if(!ED.on) return; const h=home(), m=mine(), L=HM.levels[h.lv||0], inv=Object.entries(m.inv||{}).filter(([k,n])=>n>0&&HM.items[k]);
  const cz=SD.homeCozy(h); BAR.innerHTML=`<div class="hbinfo"><b>🛠 Sửa nhà</b> ${meter(cz)} <span>${h.items.length}/${L.cap} món · ${esc(L.name)}</span>
    <small class="${ED.msg?'bad':'muted'}">${ED.msg?esc(ED.msg):ED.hold?`Đang cầm ${esc(HM.items[ED.hold.k].name)}: bấm chuột trái để đặt · R xoay · ${ED.hold.i!=null?'Delete cất vào kho · ':''}chuột phải thôi`:'Bấm 1 món trong kho để đặt · bấm vào đồ trong nhà để nhấc lên dời chỗ'}</small></div>
    <div class="hbinv">${inv.length?inv.map(([k,n])=>`<button type="button" class="hbit ${ED.hold&&ED.hold.i==null&&ED.hold.k===k?'on':''}" data-hk="${k}" title="${esc(HM.items[k].name)}"><img src="${thumb(k)}" alt=""><i>${n}</i></button>`).join(''):'<small class="muted">Kho trống: mua thêm ở 🛒</small>'}</div>
    <div class="hbbtn">${btn('hshop','🛒 Cửa hàng',{},'pri')}${btn('hshop','🎨 Sàn & tường',{tab:'floor'})}${btn('hshop','🏗 Mở rộng',{tab:'expand'})}${btn('hopen',m.open===false?'🔒 Đang đóng cửa':'🔓 Mở cửa cho khách',{})}${btn('hdone','✔ Xong',{},'pri')}</div>`; }
BAR.addEventListener('click',e=>{ const it=e.target.closest('[data-hk]'); if(it){ ED.hold={k:it.dataset.hk,f:0}; ED.msg=''; bar(); return; }
  const b=e.target.closest('[data-a]'); if(!b) return; e.stopPropagation(); const a=b.dataset.a;
  if(a==='hshop') shop(b.dataset.tab||ED.tab); else if(a==='hopen') act({t:'home',op:'open',v:mine().open===false}); else if(a==='hdone') edit(false); });
window.HOMEUI={changed(m){ if(ED.hold&&ED.hold.i==null&&!((mine().inv||{})[ED.hold.k]>0)) ED.hold=null; bar(); if(SHOP) UI.refresh(); },edit,open:()=>edit(true)};

/* ---------- chuột / phím trong chế độ Sửa nhà ---------- */
const cv=document.getElementById('game');
const tileOf=e=>{ const [x,y]=GAME.worldAt(e); return [Math.floor(x/T),Math.floor(y/T)]; };
// món đang cầm đặt ở ô chuột: chuột ở giữa chân đồ; đồ treo tường thì dọc theo tường trên
const placeAt=(hold,t)=>{ const d=HM.items[hold.k]; return {k:hold.k,x:t[0]-Math.floor(d.fw/2),y:d.wall?2:t[1]+Math.floor(((d.fh||1)-1)/2),f:hold.f?1:0}; };
// món đã đặt ở ô (ưu tiên đồ đứng, rồi đồ treo, đồ phẳng, thảm sau cùng)
function itemAt(t){ const h=home(); let best=-1, bs=9; h.items.forEach((it,i)=>{ const d=HM.items[it.k]; if(!d) return; const F=SD.homeFoot(d,it), hit=d.wall?(t[1]<=2&&t[0]>=F.x0&&t[0]<=F.x1):(t[0]>=F.x0&&t[0]<=F.x1&&t[1]>=F.y0&&t[1]<=F.y1); if(!hit) return;
  const sc=d.rug?4:d.flat?3:d.wall?2:SD.homeSolid(d)?0:1; if(sc<bs){ bs=sc; best=i; } }); return best; }
const meTile=()=>[Math.floor(GAME.P.x/T),Math.floor(GAME.P.y/T)];
async function click(){ const t=ED.hover; if(!t) return; const h=home();
  if(ED.hold){ const it=placeAt(ED.hold,t), e=SD.homeFits(h,it,ED.hold.i==null?-1:ED.hold.i,meTile()); if(e){ ED.msg=e; bar(); GAME.sfx('blip',.3); return; }
    const r=await GAME.act(ED.hold.i==null?{t:'home',op:'place',...it}:{t:'home',op:'move',i:ED.hold.i,x:it.x,y:it.y,f:it.f}); if(r&&!r.err){ GAME.sfx('item_pickup',.4); ED.msg=''; if(ED.hold.i!=null||!((mine().inv||{})[ED.hold.k]>1)) ED.hold=null; } else if(r) ED.msg=r.err; bar(); return; }
  const i=itemAt(t); if(i<0) return; const it=h.items[i]; ED.hold={k:it.k,i,f:it.f||0}; ED.msg=''; bar(); }
addEventListener('mousemove',e=>{ if(ED.on&&e.target===cv) ED.hover=tileOf(e); },true);
addEventListener('click',e=>{ if(!ED.on||e.target!==cv) return; e.stopImmediatePropagation(); e.preventDefault(); ED.hover=tileOf(e); click(); },true);
addEventListener('mousedown',e=>{ if(!ED.on||e.target!==cv||e.button!==2) return; e.stopImmediatePropagation(); e.preventDefault(); if(ED.hold){ ED.hold=null; ED.msg=''; bar(); } },true);
addEventListener('contextmenu',e=>{ if(ED.on&&e.target===cv){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
addEventListener('keydown',e=>{ if(!ED.on) return; const tg=e.target; if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA')) return; const k=e.key;
  if(k==='r'||k==='R'){ e.preventDefault(); e.stopImmediatePropagation(); if(ED.hold){ ED.hold.f=ED.hold.f?0:1; bar(); } else { const i=ED.hover?itemAt(ED.hover):-1; if(i>=0) act({t:'home',op:'flip',i}); } }
  else if(k==='Delete'||k==='Backspace'){ e.preventDefault(); e.stopImmediatePropagation(); const i=ED.hold&&ED.hold.i!=null?ED.hold.i:ED.hover?itemAt(ED.hover):-1; if(i>=0){ ED.hold=null; GAME.act({t:'home',op:'stash',i}).then(r=>{ if(r&&r.err){ ED.msg=r.err; bar(); } }); } }
  else if(k==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if(ED.hold){ ED.hold=null; ED.msg=''; bar(); } else edit(false); } },true);

/* ---------- vẽ lưới + bóng mờ món đang cầm ---------- */
const FL=new Map();
function ghost(d,f){ const key=d.art+JSON.stringify(d.args||[])+(f?'f':''); let s=FL.get(key); if(s) return s; const b=A[d.art](...(d.args||[])); if(!f){ FL.set(key,b); return b; }
  const c=A.cv(b.c.width,b.c.height), g=c.getContext('2d'); g.translate(b.c.width,0); g.scale(-1,1); g.drawImage(b.c,0,0); s={c,ax:b.c.width-b.ax,ay:b.ay}; FL.set(key,s); return s; }
function drawEdit(ctx){ const S=GAME.S, cam=GAME.cam, h=home(), W=S.W, H=S.H; ctx.save();
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; for(let x=1;x<W-1;x++){ ctx.beginPath(); ctx.moveTo(x*T-cam.x+.5,2*T-cam.y); ctx.lineTo(x*T-cam.x+.5,(H-1)*T-cam.y); ctx.stroke(); } for(let y=2;y<H-1;y++){ ctx.beginPath(); ctx.moveTo(T-cam.x,y*T-cam.y+.5); ctx.lineTo((W-1)*T-cam.x,y*T-cam.y+.5); ctx.stroke(); }
  const t=ED.hover; if(t){ if(ED.hold){ const d=HM.items[ED.hold.k], it=placeAt(ED.hold,t), F=SD.homeFoot(d,it), ok=!SD.homeFits(h,it,ED.hold.i==null?-1:ED.hold.i,meTile());
      ctx.fillStyle=ok?'rgba(90,232,106,.28)':'rgba(255,74,90,.32)'; ctx.fillRect(F.x0*T-cam.x,(d.wall?0:F.y0)*T-cam.y,(F.x1-F.x0+1)*T,(d.wall?2:F.y1-F.y0+1)*T); ctx.strokeStyle=ok?'#5ae86a':'#ff4a5a'; ctx.strokeRect(F.x0*T-cam.x+.5,(d.wall?0:F.y0)*T-cam.y+.5,(F.x1-F.x0+1)*T-1,(d.wall?2:F.y1-F.y0+1)*T-1);
      if(!d.rug){ const s=ghost(d,ED.hold.f), [ax,ay]=SD.homeAnchor(d,it), fx=d.flat?(F.x0+d.fw/2)*T-s.c.width/2:ax*T-s.ax, fy=d.flat?(F.y0+(d.fh||1)/2)*T-s.c.height/2:ay*T-s.ay; ctx.globalAlpha=.7; ctx.drawImage(s.c,Math.round(fx-cam.x),Math.round(fy-cam.y)); ctx.globalAlpha=1; } }
    else { const i=itemAt(t); if(i>=0){ const it=h.items[i], d=HM.items[it.k], F=SD.homeFoot(d,it); ctx.strokeStyle='#ffd84a'; ctx.setLineDash([3,2]); ctx.strokeRect(F.x0*T-cam.x+.5,(d.wall?0:F.y0)*T-cam.y+.5,(F.x1-F.x0+1)*T-1,(d.wall?2:F.y1-F.y0+1)*T-1); ctx.setLineDash([]);
      ctx.font='14px VT323, monospace'; ctx.textAlign='center'; ctx.fillStyle='#1c1516'; ctx.fillText(d.name,(F.x0+F.x1+1)/2*T-cam.x+1,F.y0*T-cam.y-2); ctx.fillStyle='#ffd84a'; ctx.fillText(d.name,(F.x0+F.x1+1)/2*T-cam.x,F.y0*T-cam.y-3); } } }
  ctx.restore(); }
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(ED.on&&ownHome()) list.push({y:99990,d:()=>drawEdit(ctx)}); };

/* ---------- cửa hàng nội thất / sàn & tường / mở rộng / kho ---------- */
let SHOP=false;
function shop(tab){ ED.tab=tab; SHOP=true; BAR.hidden=true; UI.open('🛒 Nội thất · Nhà riêng',shopHtml,{wide:true}); }
function shopHtml(){ const h=home(), m=mine(), tab=ED.tab, tabs=[['moi','✨ Đồ mới'],['set','🏆 Bộ sưu tập'],...HM.cats,['floor','🎨 Sàn & tường'],['expand','🏗 Mở rộng'],['kho','📦 Kho']];
  const card=([k,d])=>`<div class="hcard">${d.isNew?'<span class="hnew">MỚI</span>':''}<img src="${thumb(k)}" alt=""><b>${esc(d.name)}</b><small>${sizeTxt(d)} · +${d.cozy} ấm cúng${d.act?' · dùng được':''}</small><small class="muted">trong kho: ${(m.inv||{})[k]||0}</small>${btn('hbuy',fmt(d.price),{k},'pri')}${btn('hbuy','Mua & đặt',{k,put:1})}</div>`;
  let body='';
  if(tab==='floor'){ const sw=(T0,k,t,kind)=>{ const own=(m.own&&m.own[kind]||{})[k], cur=h[kind]===k; return `<div class="hcard hsw ${cur?'on':''}">${t.isNew?'<span class="hnew">MỚI</span>':''}<i class="hswc" style="background:linear-gradient(135deg,${t.col[0]} 0 45%,${t.col[1]} 45% 55%,${t.col[2]} 55%)"></i><b>${esc(t.name)}</b><small>+${t.cozy} ấm cúng</small>${cur?'<small class="good">✔ Đang dùng</small>':btn('htheme',own?'Dùng':'Mua · '+fmt(t.price),{kind,k},'pri')}</div>`; };
    body=`<h5>Sàn nhà</h5><div class="grid">${Object.entries(HM.floors).map(([k,t])=>sw(HM.floors,k,t,'floor')).join('')}</div><h5>Tường</h5><div class="grid">${Object.entries(HM.walls).map(([k,t])=>sw(HM.walls,k,t,'wall')).join('')}</div><p class="muted">Mua 1 lần, sau đó đổi qua lại miễn phí.</p>`; }
  else if(tab==='expand'){ const L=HM.levels, cur=h.lv||0; body=`<div class="list">${L.map((x,i)=>`<div class="row ${i<=cur?'good':''}"><span>${i<=cur?'✔':'◻'} <b>${esc(x.name)}</b> · ${x.W}×${x.H} ô · đặt tối đa ${x.cap} món</span><span>${i===0?'có sẵn':fmt(x.price)}</span>${i===cur+1?btn('hexpand','🏗 Mở rộng',{},'pri'):''}</div>`).join('')}</div><p class="muted">Mở rộng thêm khoảng trống bên phải và phía dưới, đồ đang đặt giữ nguyên chỗ.</p>`; }
  else if(tab==='kho'){ const inv=Object.entries(m.inv||{}).filter(([k,n])=>n>0&&HM.items[k]); body=inv.length?`<div class="grid">${inv.map(([k,n])=>{ const d=HM.items[k]; return `<div class="hcard"><img src="${thumb(k)}" alt=""><b>${esc(d.name)} ×${n}</b><small>${sizeTxt(d)}</small>${btn('hhold','Đặt',{k},'pri')}${btn('hsell','Bán lại · '+fmt(Math.round(d.price*HM.sellBack)),{k})}</div>`; }).join('')}</div>`:'<p class="muted">Kho trống. Đồ cất từ nhà vào (Delete) sẽ nằm ở đây.</p>'; }
  else if(tab==='set'){ const placed=new Set(h.items.map(o=>o.k)); body=Object.entries(HM.sets).map(([sk,st])=>{ const have=st.items.filter(k=>placed.has(k)).length, done=have===st.items.length, miss=st.items.filter(k=>!placed.has(k)&&!((m.inv||{})[k]>0)), cost=Math.round(miss.reduce((a,k)=>a+HM.items[k].price,0)*.9/1000)*1000;
      return `<div class="hset ${done?'done':''}"><div><b>${done?'✔ ':''}${esc(st.name)}</b> <small>${have}/${st.items.length} món đã đặt · đủ bộ +${st.bonus} ấm cúng</small></div><div class="hsetit">${st.items.map(k=>`<span class="${placed.has(k)?'on':(m.inv||{})[k]>0?'inv':''}" title="${esc(HM.items[k].name)}"><img src="${thumb(k)}" alt=""></span>`).join('')}</div>${miss.length?btn('hbuyset',`Mua ${miss.length} món còn thiếu · ${fmt(cost)} (−10%)`,{s:sk},'pri'):done?'<small class="good">Đã nhận thưởng bộ sưu tập</small>':'<small class="muted">Đủ đồ trong kho rồi, đặt hết vào nhà để nhận thưởng</small>'}</div>`; }).join(''); }
  else if(tab==='moi') body=`<p class="muted">Bộ nhà ấm kiểu game pixel đồng quê: gỗ nâu, chăn kẻ ô, tủ bếp gạch ốp, đèn tường. Đặt đủ bộ ở tab 🏆 để thêm ấm cúng.</p><div class="grid">${Object.entries(HM.items).filter(([k,d])=>d.isNew).map(card).join('')}</div><h5>Sàn & tường mới</h5><p class="muted">${[...Object.values(HM.floors),...Object.values(HM.walls)].filter(t=>t.isNew).map(t=>esc(t.name)).join(' · ')} (tab 🎨)</p>`;
  else body=`<div class="grid">${Object.entries(HM.items).filter(([k,d])=>d.cat===tab).map(card).join('')}</div>`;
  return `<p>Trong ví <b>${fmt(G().money)}</b> · ${meter(SD.homeCozy(h))} (ngủ ở nhà: ${(b=>b?`+${Math.round((b.mul-1)*100)}% EXP ${b.min} phút`:'cần ≥ 10 để có buff')(SD.homeBuff(SD.homeCozy(h)))}) · mỗi loại đồ tính ấm cúng tối đa ${HM.sameMax} món</p>
    <div class="tabs">${tabs.map(([k,n])=>`<button class="tab ${k===tab?'on':''}" data-a="htab" data-k="${k}">${n}</button>`).join('')}</div>${body}`; }
const G=()=>GAME.G||{};
UI.onAct('htab',d=>{ ED.tab=d.k; UI.refresh(); });
UI.onAct('hbuy',async d=>{ const r=await act({t:'home',op:'buy',k:d.k}); if(r&&!r.err&&d.put){ UI.closeAll(); SHOP=false; if(!ED.on) edit(true); ED.hold={k:d.k,f:0}; bar(); } });
UI.onAct('hsell',d=>act({t:'home',op:'sell',k:d.k}));
UI.onAct('hbuyset',d=>act({t:'home',op:'buyset',s:d.s}));
UI.onAct('hhold',d=>{ UI.closeAll(); SHOP=false; if(!ED.on) edit(true); ED.hold={k:d.k,f:0}; bar(); });
UI.onAct('htheme',d=>act({t:'home',op:d.kind,k:d.k}));
UI.onAct('hexpand',async()=>{ const r=await act({t:'home',op:'expand'}); if(r&&!r.err){ GAME.sfx('level_up',.7); GAME.bigText('NHÀ MỞ RỘNG!'); } });
const c0=UI.closeAll; UI.closeAll=()=>{ SHOP=false; c0(); if(ED.on) BAR.hidden=false; };   /* đóng cửa hàng: hiện lại thanh Sửa nhà */
})();
