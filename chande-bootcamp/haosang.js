/* Chan City — phím R cạnh người chơi khác: 🙌 Tương tác · 💸 Donate tiền · 🤝 Cho vay · 🏠 Mời về nhà (server/haosang.js).
   R khi đứng trong nhà mà không ai gần: 💛 Hảo sảng của tôi (bậc, quyền lợi, khoản đang nợ / cho vay), đang ở nhà người khác thì có 🏠 Về nhà mình.
   Bậc hảo sảng (data.js HAOSANG): +EXP, mua rẻ hơn, bán được giá hơn; chip trên HUD. */
(function(){
const SD=SHARED, H=SD.HAOSANG, LN=H.loan, fmt=SD.fmt, esc=s=>GAME.esc(String(s)), toast=(m,k)=>GAME.toast(m,k), G=()=>GAME.G||{}, btn=UI.btn, $=s=>document.querySelector(s);
const pct=v=>Math.round(v*100)+'%';
let HS=null;   /* bậc hảo sảng của mình do server gửi (t:'hs') */
NET.listen('hs',m=>{ HS=m.v; });
window.HSUI={chip(){ const v=HS||SD.hsTier(G()); return v&&v.lv?`<span class="good hschip" title="Hảo sảng bậc ${v.lv}: +${pct(v.b)} EXP, mua rẻ ${pct(v.b)}, bán được giá hơn ${pct(v.b)}">💛 ${esc(v.name)} +${pct(v.b)}</span>`:''; }};
async function hsAct(q){ const r=await GAME.act(q); if(r&&!r.err&&r.msg) toast(esc(r.msg),'item'); return r; }

/* ---------- menu phím R (game.js rMenu) ---------- */
const PM=document.getElementById('pmenu');
const pmClose=()=>{ PM.hidden=true; PM.innerHTML=''; PM._r=null; };
const guestHome=()=>{ const S=GAME.S; return S&&S.kind==='room'&&S.host&&!S.own; };
UI.pmenu=(r,cx,cy)=>{ const items=r?[['soc','🙌 Tương tác'],['gift','💸 Donate tiền'],['loan','🤝 Cho vay'],['home','🏠 Mời về nhà']]:[['me','💛 Hảo sảng của tôi'],...(GAME.S&&GAME.S.kind==='room'&&!GAME.S.host?[['deco','🛠 Sửa nhà']]:[]),...(guestHome()?[['like','❤ Thích nhà này'],['back','🏠 Về nhà mình']]:[])];
  PM.innerHTML=`<b>${esc(r?r.name:G().name||'Bạn')}</b><small class="muted pmhs">${r?'…':''}</small>`+items.map(([k,l])=>`<button type="button" class="btn sm" data-pm="${k}">${l}</button>`).join('');
  PM.hidden=false; PM._r=r; const w=PM.offsetWidth, h=PM.offsetHeight; PM.style.left=Math.max(8,Math.min(innerWidth-w-8,cx+6))+'px'; PM.style.top=Math.max(8,Math.min(innerHeight-h-8,cy+6))+'px';
  if(r) NET.req({t:'hs',op:'peek',to:r.id}).then(v=>{ const el=PM.querySelector('.pmhs'); if(!el||PM._r!==r||!v||v.err) return; el.textContent=(v.v.lv?`Hảo sảng bậc ${v.v.lv} · ${v.v.name}`:'Chưa có bậc hảo sảng')+(v.late?' · ⚠ đang nợ quá hạn':''); }); };
PM.addEventListener('click',e=>{ const b=e.target.closest('[data-pm]'); if(!b) return; const r=PM._r, k=b.dataset.pm; pmClose();
  if(k==='soc') UI.social(r); else if(k==='gift') gift(r); else if(k==='loan') loan(r); else if(k==='home') hsAct({t:'hs',op:'invite',to:r.id}); else if(k==='me') panel(); else if(k==='back') hsAct({t:'hs',op:'home'}); else if(k==='deco'&&window.HOMEUI) window.HOMEUI.open(); else if(k==='like') hsAct({t:'home',op:'like'}); });
addEventListener('mousedown',e=>{ if(!PM.hidden&&!PM.contains(e.target)) pmClose(); },true);
addEventListener('keydown',e=>{ if(e.key==='Escape'&&!PM.hidden) pmClose(); });

/* ---------- donate ---------- */
function gift(r){ UI.open('💸 Donate cho '+r.name,()=>`<p>Trong ví: <b>${fmt(G().money)}</b>. Donate là cho luôn, không lấy lại.</p>
  <p class="muted">Cứ ${fmt(H.perPts)} cho đi (trừ phần người khác donate lại cho bạn) là +1 điểm hảo sảng. 2 người chuyển qua chuyển lại thì không lên điểm.</p>
  <div class="hsq">${[50000,100000,500000,1000000,5000000].map(v=>btn('hsgset',fmt(v),{v})).join('')}</div>
  <div class="hsrow"><input id="hsAmt" type="number" min="${H.giftMin}" max="${H.giftMax}" step="10000" value="100000" aria-label="Số tiền donate">${btn('hsgift','💸 Donate',{to:r.id},'pri')}</div>`,{static:true}); }
UI.onAct('hsgset',d=>{ $('#hsAmt').value=d.v; });
UI.onAct('hsgift',async d=>{ const r=await hsAct({t:'hs',op:'gift',to:+d.to,amt:+$('#hsAmt').value}); if(r&&!r.err){ GAME.sfx('coin',.6); UI.closeAll(); } });

/* ---------- cho vay: số tiền, lãi / ngày, hạn; người vay đồng ý mới chuyển ---------- */
function loan(r){ const rates=[];for(let x=LN.minRate;x<=LN.maxRate+1e-9;x+=.01) rates.push(Math.round(x*100)/100);
  UI.open('🤝 Cho '+r.name+' vay',()=>`<p>Trong ví: <b>${fmt(G().money)}</b>. Người vay đồng ý thì tiền chuyển ngay. Lãi đơn theo ngày (tính tròn ngày, ít nhất 1 ngày). Quá hạn mà chưa trả thì người vay có tiền là bị tự trừ trả bạn.</p>
  <div class="hsform"><label>Số tiền<input id="lnAmt" type="number" min="${LN.min}" max="${LN.max}" step="100000" value="1000000"></label>
    <label>Lãi / ngày<select id="lnRate">${rates.map(x=>`<option value="${x}">${Math.round(x*100)}%</option>`).join('')}</select></label>
    <label>Hạn trả<select id="lnDays">${Array.from({length:LN.maxDays},(_,i)=>`<option value="${i+1}">${i+1} ngày</option>`).join('')}</select></label></div>
  <p id="lnSum" class="good"></p><p class="muted">Được trả đủ: +1 điểm hảo sảng mỗi 1 triệu tiền gốc (tối đa ${H.loanDay} điểm / ngày, tổng ${H.loanMax}).</p>${btn('hsloan','🤝 Đề nghị cho vay',{to:r.id},'pri')}`,{static:true});
  const sum=()=>{ const a=+$('#lnAmt').value||0, k=+$('#lnRate').value, d=+$('#lnDays').value, el=$('#lnSum'); if(el) el.textContent=`Đúng hạn ${d} ngày: người vay trả ${fmt(Math.round(a*(1+k*d)/1000)*1000)} (lãi ${fmt(Math.round(a*k*d/1000)*1000)})`; };
  for(const id of ['#lnAmt','#lnRate','#lnDays']){ const el=$(id); if(el) el.addEventListener('input',sum); } sum(); }
UI.onAct('hsloan',async d=>{ const r=await hsAct({t:'hs',op:'loan',to:+d.to,amt:+$('#lnAmt').value,rate:+$('#lnRate').value,days:+$('#lnDays').value}); if(r&&!r.err) UI.closeAll(); });
NET.listen('hsAsk',m=>{ GAME.sfx('blip',.4);
  const html=m.kind==='loan'?`<b>${esc(m.name)}</b> muốn cho bạn vay <b>${fmt(m.amt)}</b>, lãi ${pct(m.rate)} / ngày, hạn ${m.days} ngày (trả đúng hạn tổng ${fmt(m.total)}). Quá hạn là tự trừ tiền trong ví.`:`<b>${esc(m.name)}</b> mời bạn về nhà chơi`;
  UI.ask(html,yes=>NET.req({t:'hs',op:'answer',id:m.id,yes}).then(r=>{ if(r&&r.err) toast(esc(r.err),'lock'); else if(r&&r.msg) toast(esc(r.msg),'item'); }),m.kind==='loan'?25:15); });

/* ---------- hảo sảng của tôi ---------- */
let ST=null;
async function panel(){ ST=await NET.req({t:'hs',op:'state'}); if(!ST||ST.err) return; if(ST.v) HS=ST.v; UI.open('💛 Hảo sảng',render,{wide:true}); }
function render(){ const v=HS||{lv:0,n:0,b:0}, nx=H.tiers[v.lv], t=NET.now(), h=ST.h||{};
  const row=(L,mine)=>`<div class="row"><span>${mine?`Nợ <b>${esc(L.from)}</b>`:`<b>${esc(L.to)}</b> nợ bạn`} · gốc ${fmt(L.amt)} · lãi ${pct(L.rate)} / ngày</span><span class="${L.late?'bad':''}">${L.late?'⚠ quá hạn':'hạn '+Math.max(0,Math.ceil((L.due-t)/36e5))+' giờ nữa'} · còn ${fmt(L.owed)}</span>${mine?btn('hsrepay','Trả nợ',{id:L.id},'pri'):''}</div>`;
  return `<div class="hshead"><b>${v.lv?`Bậc ${v.lv} · ${esc(v.name)}`:'Chưa có bậc'}</b><span>${v.n} điểm${nx?` · bậc sau ${esc(nx.name)} cần ${nx.pts} điểm`:' · bậc cao nhất'}</span>
    <span class="good">Quyền lợi: +${pct(v.b)} EXP · mua đồ rẻ ${pct(v.b)} · bán đồ được giá hơn ${pct(v.b)}</span></div>
  <div class="list">${H.tiers.map((x,i)=>`<div class="row ${v.lv>i?'good':''}"><span>${v.lv>i?'✔':'◻'} Bậc ${i+1} · ${esc(x.name)}</span><span>${x.pts} điểm · +${pct(x.b)}</span></div>`).join('')}</div>
  <p class="muted">Cách lên điểm: donate (cứ ${fmt(H.perPts)} cho đi ròng = 1 điểm) · mời bạn về nhà chơi (1 điểm / người / ngày, tối đa ${H.hostDay} / ngày) · cho vay được trả đủ (1 điểm / 1 triệu gốc). Chuột phải vào người chơi khác để làm.</p>
  <p class="muted">Đã cho đi ${fmt(h.give||0)} · được cho ${fmt(h.got||0)} · tiếp khách ${h.host||0} · cho vay ${h.loan||0}</p>
  <h5>Khoản đang nợ</h5><div class="list">${(ST.owe||[]).map(L=>row(L,true)).join('')||'<p class="muted">Không nợ ai</p>'}</div>
  <h5>Khoản cho vay</h5><div class="list">${(ST.lent||[]).map(L=>row(L,false)).join('')||'<p class="muted">Chưa cho ai vay</p>'}</div>`; }
UI.onAct('hsrepay',async d=>{ const r=await hsAct({t:'hs',op:'repay',id:+d.id}); if(r&&!r.err){ ST.owe=r.owe; UI.refresh(); } });
UI.hsPanel=panel;
// chip hảo sảng trên HUD bấm vào mở bảng
document.addEventListener('click',e=>{ if(e.target.closest('.hschip')) panel(); });
})();
