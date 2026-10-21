/* Chan City — các bảng giao diện: quán, shop, lễ tân, phòng, laptop (chợ online / học / chat), Grab, Everfit, vườn, trại,
   nấu ăn, tương tác người chơi, bàn cờ vua / poker / ma sói, trường đua kiểu Audition. */
(function(){
const SD=SHARED, $=s=>document.querySelector(s), fmt=SD.fmt, Gm=()=>GAME, G=()=>GAME.G, esc=s=>GAME.esc(s);
const UI={}; let cur=null;                              // bảng đang mở: {el, render}
const box=$('#panel'), inner=$('#panelInner'), title=$('#panelTitle');
function open(t,render,o={}){ cur={render,t,o}; box.hidden=false; box.classList.toggle('wide',!!o.wide); title.textContent=t; draw(); }
function draw(){ if(!cur) return; inner.innerHTML=cur.render(); }
UI.refresh=()=>{ if(cur&&!cur.o.static) draw(); };
UI.closeAll=()=>{ cur=null; box.hidden=true; inner.innerHTML=''; stopMini(); };
UI.blocking=()=>!!cur||!$('#ask').hidden||document.activeElement===$('#chatIn');
$('#panelClose').onclick=()=>UI.closeAll();
// nút trong bảng: data-a="tên hành động" + data-*
inner.addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b||b.disabled) return; const f=ACT[b.dataset.a]; if(f) f(b.dataset,b); });
const ACT={};
const btn=(a,label,data={},cls='')=>`<button class="btn sm ${cls}" data-a="${a}" ${Object.entries(data).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const ico=k=>`<img class="ico" src="${GAME.icon64(k)}" alt="">`;
const money=()=>`<div class="pmoney">Ví: <b>${fmt(G().money)}</b></div>`;
async function req(m,ok){ const r=await GAME.act(m,ok); UI.refresh(); return r; }

/* ---------- menu Esc ---------- */
UI.menu=()=>open('Tạm dừng',()=>`<div class="col">${btn('close','Chơi tiếp')}${btn('mute',GAME.AUD.muted?'Bật tiếng':'Tắt tiếng')}
  ${btn('nosoc',G().opts.noSocial?'Nhận lời mời tương tác: TẮT':'Nhận lời mời tương tác: BẬT')}${btn('bag','Túi đồ (I)')}${btn('logout','Đăng xuất','','pri')}</div>
  <p class="muted">Phím: WASD đi · Shift chạy · E tương tác · Enter chat · G gọi Grab · P chụp ảnh · I túi đồ · M bản đồ · H lên/xuống ngựa · N tắt tiếng</p>`);
ACT.close=()=>UI.closeAll(); ACT.mute=()=>{ GAME.setMute(!GAME.AUD.muted); draw(); }; ACT.bag=()=>UI.bag();
ACT.nosoc=async()=>{ await NET.req({t:'opt',noSocial:!G().opts.noSocial}); setTimeout(draw,200); };
ACT.logout=async()=>{ try{ await NET.api('logout',{token:NET.token}); localStorage.removeItem('chan-token'); sessionStorage.removeItem('chan-token'); }catch(e){} location.reload(); };

/* ---------- chat gần ---------- */
const chatIn=$('#chatIn');
UI.chat=()=>{ $('#chatBox').classList.add('typing'); chatIn.hidden=false; chatIn.focus(); };
chatIn.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ const m=chatIn.value.trim(); if(m) NET.send({t:'chat',m}); chatIn.value=''; chatIn.blur(); }
  if(e.key==='Escape'){ chatIn.value=''; chatIn.blur(); } });
chatIn.addEventListener('blur',()=>{ chatIn.hidden=true; $('#chatBox').classList.remove('typing'); });
UI.chatLog=(n,m)=>{ const d=document.createElement('div'); d.innerHTML=`<b>${esc(n)}:</b> ${esc(m)}`; const L=$('#chatLog'); L.appendChild(d); while(L.children.length>7) L.firstChild.remove(); setTimeout(()=>d.classList.add('old'),12000); };

/* ---------- hỏi nhanh (lời mời) ---------- */
let askCb=null, askTimer=0;
function quickAsk(html,cb,sec=15){ $('#askText').innerHTML=html; $('#ask').hidden=false; askCb=cb; clearTimeout(askTimer); askTimer=setTimeout(()=>answer(false),sec*1000); }
function answer(yes){ if(!askCb) return; const f=askCb; askCb=null; $('#ask').hidden=true; f(yes); }
$('#askYes').onclick=()=>answer(true); $('#askNo').onclick=()=>answer(false);
addEventListener('keydown',e=>{ if($('#ask').hidden) return; if(e.key==='y'||e.key==='Y'){ answer(true); e.preventDefault(); } if(e.key==='n'||e.key==='N'){ answer(false); e.preventDefault(); } },true);
UI.socAsk=m=>{ GAME.sfx('blip',.4); quickAsk(`<b>${esc(m.name)}</b> ${SD.SOCIAL[m.kind].ask}`,yes=>NET.req({t:'soc',op:'answer',inv:m.inv,yes})); };
UI.knockAsk=m=>{ GAME.sfx('door',.4); quickAsk(m.kind==='sleep'?`<b>${esc(m.name)}</b> xin ngủ lại phòng bạn đêm nay`:`<b>${esc(m.name)}</b> đang gõ cửa, muốn vào phòng chơi`,yes=>NET.req({t:'knockAns',inv:m.inv,yes}),20); };

/* ---------- tương tác người chơi ---------- */
UI.social=r=>open('Tương tác với '+r.name,()=>`<div class="col">${Object.entries(SD.SOCIAL).map(([k,s])=>btn('soc',s.name,{k,to:r.id})).join('')}</div>
  <p class="muted">Người kia phải đồng ý. Vật tay: bấm SPACE liên tục 6 giây. Đánh nhau (vui thôi): J để đấm, ai hết máu trước thua. Thắng được EXP.</p>`);
ACT.soc=async d=>{ const r=await GAME.act({t:'soc',op:'ask',to:+d.to,kind:d.k}); if(!r.err){ GAME.toast('Đã gửi lời mời, đợi người kia đồng ý','item'); UI.closeAll(); } };

/* ---------- Grab ---------- */
const destOf=()=>SD.SCENE_DEST[GAME.S.kind];
UI.grab=()=>open('Gọi Grab',()=>{ const from=destOf(), g=G(), bat=Math.round(g.needs.battery);
  return `<p>Pin điện thoại: <b class="${bat<SD.GRAB.minBattery?'bad':''}">${bat}%</b> ${bat<SD.GRAB.minBattery?'· hết pin, không gọi được':''}</p>`+money()+
  `<div class="list">${Object.entries(SD.DEST).map(([k,d])=>{ const here=(k==='home'&&GAME.S.kind==='room')||k===GAME.S.kind; let fare=SD.grabFare(from,k), note='';
    if(k==='retreat'&&!g.flags.freeRide){ fare=0; note=' · Pháp bao'; } if(k==='retreat'&&!g.flags.called) note=' · chưa có kèo';
    return `<div class="row"><span>${d.name}</span><span>${here?'đang ở đây':fare?fmt(fare):'miễn phí'}${note}</span>${here?'':btn('grab','Đi',{to:k},'pri')}</div>`; }).join('')}</div>
  <p class="muted">Rời map nào cũng phải gọi Grab. Xe Grab cần điện thoại còn pin ≥ ${SD.GRAB.minBattery}%.</p>`; });
ACT.grab=async d=>{ const r=await GAME.act({t:'grab',to:d.to}); if(!r.err) UI.closeAll(); };

/* ---------- túi đồ + tủ quần áo ---------- */
UI.bag=()=>open('Túi đồ',()=>{ const g=G(), it=Object.entries(g.items);
  return money()+`<div class="grid">${it.length?it.map(([k,n])=>`<div class="cell" title="${esc(SD.ITEMS[k]?SD.ITEMS[k].name:k)}">${ico(k)}<span>${esc(SD.ITEMS[k]?SD.ITEMS[k].name:k)}</span><i>${n}</i></div>`).join(''):'<p class="muted">Túi trống</p>'}</div>
  <h5>Ảnh đã chụp (${g.photos.length}/6)</h5><p class="muted">${g.photos.map(p=>esc(p.name)).join(' · ')||'Chưa có. Bấm P ở chỗ đẹp để chụp, rồi về phòng up ảnh sống ảo.'}</p>
  <h5>Kỹ năng</h5><p class="muted">${Object.keys(g.skills).map(k=>SD.SKILLS[k]?SD.SKILLS[k].name:k).join(' · ')}</p>`; },{wide:true});
function outfitHtml(shop){ const g=G(), out=g.look.outfit||{};
  return `<div class="shopwrap"><canvas id="pv" width="64" height="96"></canvas><div class="list">${SD.SLOTS.map(([slot,name])=>{
    const items=Object.entries(SD.CLOTHES).filter(([k,c])=>c.slot===slot&&(shop||g.owned[k]));
    return `<h5>${name}</h5>`+items.map(([k,c])=>{ const own=g.owned[k], on=out[slot]===k;
      return `<div class="row ${on?'on':''}" data-a="preview" data-k="${k}"><span>${esc(c.name)}</span><span>${own?(on?'đang mặc':'đã có'):fmt(c.price)}</span>${own?(on?(['top','bottom','shoes'].includes(slot)?'':btn('unequip','Cởi',{slot})):btn('equip','Mặc',{k,slot})):shop?btn('buyc','Mua',{k},'pri'):''}</div>`; }).join(''); }).join('')}</div></div>`; }
let pvLook=null;
function drawPreview(){ const c=$('#pv'); if(!c) return; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,64,96);
  const av=AVATAR.build(pvLook||G().look), an=av.anims.walk_down, f=an.frames[Math.floor(performance.now()/125)%an.frames.length]; g.drawImage(f,0,0,64,96); }
let pvTimer=0; function startPreview(){ clearInterval(pvTimer); pvLook=null; pvTimer=setInterval(()=>{ if(!$('#pv')) return clearInterval(pvTimer); drawPreview(); },120); }
UI.wardrobe=()=>{ open('Tủ quần áo',()=>outfitHtml(false),{wide:true}); startPreview(); };
ACT.preview=d=>{ const c=SD.CLOTHES[d.k]; pvLook={...G().look,outfit:{...G().look.outfit,[c.slot]:d.k}}; };
ACT.equip=d=>req({t:'equip',slot:d.slot,id:d.k}); ACT.unequip=d=>req({t:'equip',slot:d.slot,id:null});
ACT.buyc=async d=>{ const r=await req({t:'buy',id:d.k}); if(!r.err){ GAME.sfx('coin',.5); await req({t:'equip',slot:SD.CLOTHES[d.k].slot,id:d.k}); } };

/* ---------- các địa điểm có người bán ---------- */
UI.place=(place,npc)=>{ const P=PLACE[place]; if(P) P(npc); else GAME.say([[npc.id,'Chào bạn!']]); };
const PLACE={};
function menuHtml(pc){ const ms=SD.mealStatus(G().meals,NET.now());
  return money()+`<p>Bữa: ${ms.map(m=>`<span class="meal ${m.st}">${m.name.replace('Bữa ','')}</span>`).join(' ')} <span class="muted">· trễ giờ thì ăn bù được</span></p><div class="list">`+
    pc.menu.map(id=>{ const f=SD.FOOD[id]; return `<div class="row"><span>${esc(f.name)} <small class="muted">${f.meal?'no 1 bữa':'+'+Math.round((f.buff.mul-1)*100)+'% EXP '+f.buff.min+' phút'} · +${f.exp} EXP</small></span><span>${fmt(f.price)}</span>${btn('eat',f.meal?'Ăn':'Uống',{p:pc.key,id},'pri')}</div>`; }).join('')+'</div>'; }
for(const k of ['quan_com','cafe','nha_an']) PLACE[k]=()=>open(SD.PLACES[k].name,()=>menuHtml({...SD.PLACES[k],key:k})+(k==='quan_com'?sellHtml(Object.keys(SD.FISH),'Chú Tư mua cá'):''));
ACT.eat=d=>req({t:'eat',place:d.p,id:d.id});
function sellHtml(keys,head){ const g=G(), rows=keys.filter(k=>g.items[k]).map(k=>`<div class="row">${ico(k)}<span>${esc(SD.ITEMS[k].name)} ×${g.items[k]}</span><span>${fmt(SD.SELL[k]*(g.skills.damphan?1.1:1))}/cái</span>${btn('sell','Bán hết',{k},'pri')}</div>`);
  return `<h5>${head}</h5><div class="list">${rows.join('')||'<p class="muted">Chưa có gì để bán</p>'}</div>`; }
ACT.sell=d=>req({t:'sell',item:d.k}).then(r=>{ if(!r.err){ GAME.sfx('coin',.5); GAME.toast(`Bán ${r.n} → <b>+${fmt(r.vnd)}</b>`,'vnd'); } });
function seedHtml(map){ return `<div class="list">`+Object.entries(SD.CROPS).filter(([k,c])=>(c.map||'ke')===map).map(([k,c])=>`<div class="row">${ico('hat_'+k)}<span>${esc(c.name)} <small class="muted">${Math.round(c.grow/60*10)/10} phút${c.regrow?' · thu lại sau '+Math.round(c.regrow/60)+' phút':''} · ${c.yield} × ${fmt(c.sell)} · +${c.exp} EXP</small></span><span>${fmt(c.seed)}${G().items['hat_'+k]?' · có '+G().items['hat_'+k]:''}</span>${btn('seed','Mua 1',{k,n:1})}${btn('seed','Mua 5',{k,n:5})}</div>`).join('')+'</div>'; }
ACT.seed=d=>req({t:'seed',crop:d.k,n:+d.n});
PLACE.nongsan=()=>open('Tiệm nông sản Ké · Cô Ké',()=>{ const g=G(), dl=g.daily;
  const dailyRow=(id)=>{ const D=SD.DAILY[id], have=D.need.any.reduce((a,k)=>a+(g.items[k]||0),0); return `<div class="row"><span><b>${D.title}</b><br><small class="muted">${D.desc}</small></span><span>${dl.done[id]?'xong hôm nay':`${Math.min(have,D.need.count)}/${D.need.count}`}</span>${dl.done[id]?'':btn('daily','Giao',{id},have>=D.need.count?'pri':'')}</div>`; };
  return money()+`<h5>Hạt giống rau (vườn Ké sau tiệm)</h5>${seedHtml('ke')}<p class="muted">Rau chín phải thu ngay trong ${SD.FARM.grace} giây, quá giờ người khác cướp được 50%.</p>`+
    sellHtml(Object.keys(SD.SELL).filter(k=>k in SD.CROPS||k==='trung'||k==='sua'),'Cô Ké thu mua')+`<h5>Việc hôm nay</h5><div class="list">${dailyRow('trangtri')}${dailyRow('nauan')}<div class="row"><span><b>${SD.DAILY.kayak.title}</b><br><small class="muted">${SD.DAILY.kayak.desc}</small></span><span>${dl.done.kayak?'xong hôm nay':Object.keys(dl.buoys||{}).length+'/5'}</span></div></div>`; },{wide:true});
ACT.daily=d=>req({t:'daily',id:d.id});
PLACE.quanao=()=>{ open('Shop Chande · Chị Mai',()=>money()+outfitHtml(true),{wide:true}); startPreview(); };
PLACE.letan=()=>open('Lễ tân 24h · Nhà Rếch 2',()=>{ const g=G(), st=g.stay, d=SD.vnTime(NET.now()).day;
  return money()+`<p>${st?`Bạn đang thuê <b>${SD.ROOMS[st.room].name}</b> ${st.paid===d?'· đã trả hôm nay':'· chưa trả hôm nay'}. Mỗi ngày tự trừ tiền khi sang ngày mới.`:'Bạn chưa thuê phòng. Mỗi người thuê 1 phòng, tiền trả theo ngày.'}${g.flags.rented?'':' <b>Ngày đầu Pháp bao 100.000đ.</b>'}</p>
  <div class="list">${Object.entries(SD.ROOMS).filter(([k,r])=>!r.home).map(([k,r])=>`<div class="row tall"><span><b>${r.name}</b> · ${r.where}<br><small class="muted">${r.desc}</small><br><small>Nghỉ +${r.rest} năng lượng${r.buff?` · ngủ ngon +${Math.round((r.buff.mul-1)*100)}% EXP`:''} · wifi ×${r.wifi} · ảnh ×${r.view}</small></span><span>${fmt(r.price)}/ngày</span>${st&&st.room===k?'<em>đang ở</em>':btn('rent','Thuê',{k},'pri')}</div>`).join('')}</div>
  ${st?btn('checkout','Trả phòng'):''}<p class="muted">Có thể gõ cửa phòng người khác (họ phải đang ở trong và đồng ý), xin ngủ lại để dùng giường, nhà tắm, ổ sạc.</p>`; },{wide:true});
ACT.rent=d=>req({t:'rent',room:d.k}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); }); ACT.checkout=()=>req({t:'rent',op:'checkout'});

/* ---------- cửa phòng: vào phòng mình / gõ cửa ---------- */
UI.roomDoor=async room=>{ const g=G();
  if(g.stay&&g.stay.room===room){ await GAME.act({t:'enterRoom'}); return; }
  const r=await GAME.act({t:'knock',room}); if(r.err) return;
  open('Gõ cửa '+SD.ROOMS[room].name,()=>r.list.length?`<p>Ai đang ở trong:</p><div class="list">${r.list.map(p=>`<div class="row"><span>${esc(p.n)}</span>${btn('knock','Gõ cửa',{room,to:p.id},'pri')}</div>`).join('')}</div>`:'<p class="muted">Không có ai trong phòng nào ở nhà này. Muốn ở thì thuê ở lễ tân Nhà Rếch 2.</p>',{static:true}); };
ACT.knock=async d=>{ const r=await GAME.act({t:'knock',room:d.room,to:+d.to}); if(!r.err){ GAME.toast('Cốc cốc... đợi chủ phòng mở cửa','item'); UI.closeAll(); } };

/* ---------- điện thoại trong phòng ---------- */
UI.phone=()=>open('Điện thoại',()=>{ const g=G(), S=GAME.S, own=S.kind==='room'||S.own, d=g.daily, R=SD.ROOM_ACTS;
  return `<p>Pin: <b>${Math.round(g.needs.battery)}%</b> · TikTok ${d.tiktok}/${R.tiktok.daily} · sống ảo ${d.posts}/${R.songao.daily} hôm nay</p><div class="col">
    ${btn('ra','Lướt TikTok (+EXP, -'+R.tiktok.battery+'% pin)',{act:'tiktok'})}
    ${g.photos.map((p,i)=>btn('post',`Up ảnh "${esc(p.name)}" (×${p.mul})`,{i})).join('')||'<p class="muted">Chưa có ảnh. Bấm P để chụp (ở đây hoặc chỗ đẹp ngoài trời).</p>'}
    ${S.kind==='stay'&&!own?btn('sleepask','Xin ngủ lại đêm nay'):''}${own?btn('hub','Mở chợ online / học / chat'):''}</div>`; });
ACT.ra=d=>{ UI.closeAll(); GAME.startRoomAct(d.act); };
ACT.post=d=>{ UI.closeAll(); GAME.act({t:'ra',act:'songao',photo:+d.i}); };
ACT.sleepask=async()=>{ const r=await GAME.act({t:'sleepAsk'}); if(!r.err) GAME.toast('Đã xin, đợi chủ phòng trả lời','item'); };
ACT.hub=()=>UI.hub();

/* ---------- laptop ở phòng: chợ online, học kỹ năng, chat online, làm remote ---------- */
let hubTab='market', market=[], who=[], ochLog=[];
UI.hub=()=>{ open('Laptop',()=>hubHtml(),{wide:true}); loadMarket(); };
async function loadMarket(){ const r=await NET.req({t:'mk',op:'list'}); market=r.list||[]; const w=await NET.req({t:'who'}); who=w.list||[]; UI.refresh(); }
function hubHtml(){ const g=G(), tabs=[['market','Chợ online'],['learn','Học kỹ năng'],['chat','Chat online'],['work','Làm remote']];
  let body='';
  if(hubTab==='market'){ const mine=market.filter(l=>l.mine), others=market.filter(l=>!l.mine);
    body=money()+`<h5>Đang bán</h5><div class="list">${others.map(l=>`<div class="row">${ico(l.item)}<span>${esc(SD.ITEMS[l.item]?SD.ITEMS[l.item].name:l.item)} ×${l.n} <small class="muted">của ${esc(l.s)}</small></span><span>${fmt(l.price)}</span>${btn('mkbuy','Mua',{id:l.id},'pri')}</div>`).join('')||'<p class="muted">Chưa ai bán gì</p>'}</div>
      <h5>Của bạn (${mine.length}/${SD.MARKET.maxListings})</h5><div class="list">${mine.map(l=>`<div class="row">${ico(l.item)}<span>${esc(SD.ITEMS[l.item].name)} ×${l.n}</span><span>${fmt(l.price)}</span>${btn('mkcancel','Gỡ',{id:l.id})}</div>`).join('')}</div>
      <h5>Đăng bán</h5><div class="form"><select id="mkItem">${Object.entries(g.items).map(([k,n])=>`<option value="${k}">${esc(SD.ITEMS[k]?SD.ITEMS[k].name:k)} (có ${n})</option>`).join('')}</select>
      <input id="mkN" type="number" min="1" value="1" aria-label="Số lượng"><input id="mkP" type="number" min="1000" step="1000" placeholder="Giá (đ)" aria-label="Giá">${btn('mksell','Đăng bán','', 'pri')}</div>
      <p class="muted">Phí sàn ${SD.MARKET.fee*100}%. Người mua trả tiền, bạn nhận tiền kể cả khi đang offline.</p>`; }
  if(hubTab==='learn') body=money()+`<div class="list">${Object.entries(SD.COURSES).map(([k,c])=>`<div class="row tall"><span><b>${c.name}</b> · cấp ${c.level} · ${c.dur} giây<br><small class="muted">${c.desc}</small></span><span>${g.skills[k]?'đã học':fmt(c.price)}</span>${g.skills[k]?'':btn('learn','Học',{k},g.level>=c.level?'pri':'')}</div>`).join('')}</div>`;
  if(hubTab==='chat') body=`<div class="ochlog" id="ochLog">${ochLog.map(m=>`<div class="${m.dm?'dm':''}"><b>${esc(m.from)}${m.toName?' → '+esc(m.toName):''}:</b> ${esc(m.m)}</div>`).join('')||'<p class="muted">Kênh chung: ai đang online đều đọc được</p>'}</div>
    <div class="form"><select id="ochTo"><option value="">Kênh chung</option>${who.filter(w=>w.id!==NET.pid).map(w=>`<option value="${w.id}">Nhắn riêng: ${esc(w.n)}</option>`).join('')}</select><input id="ochIn" maxlength="120" placeholder="Gõ tin nhắn..." aria-label="Tin nhắn">${btn('och','Gửi','', 'pri')}</div>
    <h5>Đang online (${who.length})</h5><p class="muted">${who.map(w=>`${esc(w.n)} (cấp ${w.lv}) · ${esc(w.where)}`).join('<br>')}</p>`;
  if(hubTab==='work') body=workHtml(true);
  return `<div class="tabs">${tabs.map(([k,n])=>`<button class="tab ${k===hubTab?'on':''}" data-a="tab" data-k="${k}">${n}</button>`).join('')}</div>${body}`; }
ACT.tab=d=>{ hubTab=d.k; if(d.k!=='work') loadMarket(); draw(); };
ACT.mkbuy=async d=>{ const r=await GAME.act({t:'mk',op:'buy',id:+d.id}); if(!r.err) GAME.toast('Đã mua','item'); loadMarket(); };
ACT.mkcancel=async d=>{ await GAME.act({t:'mk',op:'cancel',id:+d.id}); loadMarket(); };
ACT.mksell=async()=>{ const r=await GAME.act({t:'mk',op:'sell',item:$('#mkItem').value,n:+$('#mkN').value,price:+$('#mkP').value}); if(!r.err) GAME.toast('Đã đăng bán','item'); loadMarket(); };
ACT.learn=async d=>{ const r=await GAME.act({t:'learn',skill:d.k}); if(!r.err){ UI.closeAll(); } };
ACT.och=async()=>{ const m=$('#ochIn').value.trim(); if(!m) return; const to=$('#ochTo').value; const r=await GAME.act({t:'och',m,to:to?+to:0}); if(!r.err) $('#ochIn').value=''; };
inner.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'&&e.target.id==='ochIn') ACT.och(); if(e.key==='Escape'){ e.target.blur(); } });
UI.och=m=>{ ochLog.push(m); if(ochLog.length>40) ochLog.shift(); if(cur&&cur.t==='Laptop'&&hubTab==='chat'){ draw(); const L=$('#ochLog'); if(L) L.scrollTop=L.scrollHeight; } else if(m.fid!==NET.pid) GAME.toast(`<b>${esc(m.from)}</b>${m.dm?' (nhắn riêng)':''}: ${esc(m.m)}`,'quest'); };

/* ---------- Everfit ---------- */
const WD=['CN','T2','T3','T4','T5','T6','T7'];
function workHtml(remote){ const j=G().extra&&G().extra.job; if(!j||!j.hired) return '<p class="muted">Bạn chưa làm ở Everfit. Tới văn phòng Everfit (Grab) gặp chị Vy ở quầy lễ tân để nộp đơn.</p>';
  const t=j.today; if(!t.workday) return '<p>Hôm nay cuối tuần, Everfit nghỉ. Đi chơi thôi!</p>';
  return `<p>Hôm nay: <b>${t.remote?'làm remote (laptop ở phòng)':'làm ở văn phòng'}</b> · ${t.inHours?'trong giờ làm':`ngoài giờ (${SD.JOB.hours[0]}:00–${SD.JOB.hours[1]}:00)`}</p><div class="list">${t.tasks.map(k=>{ const w=SD.WORK_TASKS[k], done=t.done.includes(k);
    return `<div class="row"><span>${esc(w.name)} <small class="muted">${w.where==='desk'?'bàn làm việc':SD.OFFICE.spots[w.where].name} · +${w.exp} EXP</small></span><span>${done?'xong':''}</span>${done?'':(remote&&t.remote)?btn('work','Làm',{k},'pri'):''}</div>`; }).join('')}</div>
    <p class="muted">Lương tích luỹ: <b>${fmt(j.accrued)}</b> · ngày lương tới: ${j.nextPay} · remote: ${j.remote.map(d=>WD[d]).join(', ')}</p>`; }
ACT.work=async d=>{ const r=await GAME.act({t:'job',op:'do',task:d.k}); if(!r.err) UI.closeAll(); };
UI.work=(where,it)=>{ const j=G().extra&&G().extra.job; if(!j||!j.hired){ GAME.toast('Bạn chưa làm ở Everfit. Gặp chị Vy ở quầy lễ tân','lock'); return; }
  const t=j.today, list=t.tasks.filter(k=>!t.done.includes(k)&&(where==='desk'?SD.WORK_TASKS[k].where==='desk':SD.WORK_TASKS[k].where===where));
  if(where==='desk'&&it&&it.desk!==j.desk){ GAME.toast(`Bàn của bạn là bàn số ${j.desk+1}`,'lock'); return; }
  if(!list.length){ GAME.toast(t.workday?'Chỗ này không còn việc hôm nay':'Cuối tuần nghỉ','lock'); return; }
  open('Việc sếp giao',()=>`<div class="list">${list.map(k=>`<div class="row"><span>${esc(SD.WORK_TASKS[k].name)}</span>${btn('work','Làm',{k},'pri')}</div>`).join('')}</div>`); };
PLACE.hr=()=>open('Everfit · Chị Vy (HR)',()=>{ const j=G().extra&&G().extra.job;
  if(!j||!j.hired) return `<p>Everfit làm nền tảng cho huấn luyện viên fitness: AI Workout Builder, thực đơn MacroSnap, habit tracking, nhắn tin 1-1, app gắn thương hiệu riêng.</p>
    <p>Đang có <b>${j?j.count:'?'}/${SD.JOB.max}</b> nhân viên. Lương ${fmt(SD.JOB.wage)}/ngày làm đủ task, trả ${SD.JOB.payEvery} ngày/lần. Thứ Bảy, Chủ Nhật nghỉ, 2 ngày remote.</p>${btn('apply','Nộp đơn + phỏng vấn','', 'pri')}`;
  return `<p>Bạn là nhân viên Everfit từ ${j.since} · bàn số ${j.desk+1}.</p><h5>Chọn 2 ngày làm remote</h5><div class="days">${[1,2,3,4,5].map(d=>`<label><input type="checkbox" class="rday" value="${d}" ${j.remote.includes(d)?'checked':''}> ${WD[d]}</label>`).join('')}</div>${btn('remote','Lưu lịch remote')}
    ${workHtml(false)}<p>${btn('quit','Nghỉ việc')}</p>`; },{wide:true});
ACT.apply=async()=>{ const r=await GAME.act({t:'job',op:'apply'}); if(r.err) return;
  open('Phỏng vấn Everfit',()=>`${r.questions.map((q,i)=>`<h5>${i+1}. ${esc(q.q)}</h5>${q.a.map((a,k)=>`<label class="opt"><input type="radio" name="q${i}" value="${k}"> ${esc(a)}</label>`).join('')}`).join('')}<p>${btn('answer','Nộp bài','', 'pri')}</p>`,{static:true}); };
ACT.answer=async()=>{ const ans=[0,1,2].map(i=>{ const e=document.querySelector(`input[name=q${i}]:checked`); return e?+e.value:-1; });
  const r=await GAME.act({t:'job',op:'answer',answers:ans}); if(r.err) return; UI.closeAll(); GAME.toast(r.passed?'Đỗ phỏng vấn! Chào mừng tới Everfit':`Trượt rồi (đúng ${r.ok}/3). 10 phút nữa nộp lại`,r.passed?'quest':'lock'); };
ACT.remote=()=>req({t:'job',op:'remote',days:[...document.querySelectorAll('.rday:checked')].map(e=>+e.value)});
ACT.quit=()=>req({t:'job',op:'quit'});
PLACE.sep=()=>open('Anh Khoa · sếp Everfit',()=>workHtml(false)+'<p class="muted">Ra đúng chỗ (bàn của bạn, bàn họp, phòng sếp, pantry, tường cây xanh) rồi bấm E để làm.</p>');

/* ---------- vườn ---------- */
UI.plot=id=>{ const p=GAME.PLOTS[id];
  if(!p){ const kind=id[0]==='k'?'ke':SD.DALAT.plots[+id.slice(1)].kind, seeds=Object.entries(SD.CROPS).filter(([k,c])=>id[0]==='k'?!c.map:c.kind===kind).filter(([k])=>G().items['hat_'+k]);
    open('Ô đất trống',()=>seeds.length?`<div class="list">${seeds.map(([k,c])=>`<div class="row">${ico('hat_'+k)}<span>${esc(c.plant||'Gieo')} ${esc(c.name.toLowerCase())} <small class="muted">${Math.round(c.grow/6)/10} phút</small></span><span>có ${G().items['hat_'+k]}</span>${btn('plant','Trồng',{id,k},'pri')}</div>`).join('')}</div>`:
      `<p class="muted">Chưa có hạt giống hợp ô này. ${id[0]==='k'?'Mua ở tiệm nông sản cô Ké (ngay cổng).':'Mua ở chỗ bác Trang (nhà phía Bắc nông trại).'}</p>`); return; }
  const c=SD.CROPS[p.c], st=GAME.plotState(id,p), mine=p.o===NET.pub;
  if(st==='growing'){ GAME.toast(`${c.name} · ${mine?'của bạn':esc(p.n)} · còn ${Math.ceil((p.at+c.grow*1000-NET.now())/1000)} giây`,'item'); if(mine&&c.regrow) open(c.name,()=>btn('clear','Chặt bỏ cây',{id})); return; }
  GAME.act({t:'harvest',id}).then(r=>{ if(r.err) return; GAME.sfx('item_pickup',.6);
    GAME.toast(r.stole?`Cướp được <b>${r.n} ${esc(c.name.toLowerCase())}</b> của ${esc(p.n)}!`:`Thu <b>${r.n} ${esc(c.name.toLowerCase())}</b> · +${r.exp} EXP`+(r.stolen?` · bị ${esc(r.by)} cướp mất ${r.stolen}`:''),r.stole?'lock':'vnd'); }); };
ACT.plant=async d=>{ const r=await GAME.act({t:'plant',id:d.id,crop:d.k}); if(!r.err){ GAME.sfx('item_pickup',.4); UI.closeAll(); } };
ACT.clear=async d=>{ await GAME.act({t:'clearPlot',id:d.id}); UI.closeAll(); };

/* ---------- Đà Lạt: bác Trang, trại, ngựa, chợ, nấu ăn ---------- */
PLACE.bactrang=()=>open('Bác Trang · chủ nông trại',()=>money()+`<p class="muted">Ô rau, hoa, dâu tây trồng 1 lần thu 1 lần. Cà phê, bơ, hồng, cao su (cần học Làm vườn lâu năm) thu được nhiều lần. Mỗi người tối đa ${SD.DL_FARM.maxPlots} ô.</p>
  <h5>Hạt giống, cây giống</h5>${seedHtml('dalat')}`+sellHtml(Object.keys(SD.SELL),'Bác Trang thu mua mọi nông sản'),{wide:true});
PLACE.barn=()=>open('Trại chăn nuôi · Chú Sáu',()=>{ const g=G(), now=NET.now();
  return money()+(g.skills.channuoi?'':'<p class="bad">Cần học Chăn nuôi (laptop ở phòng)</p>')+`<h5>Con giống</h5><div class="list">${Object.entries(SD.ANIMALS).map(([k,a])=>`<div class="row"><span>${esc(a.name)} <small class="muted">ăn ${SD.FEED[a.feed].name.toLowerCase()} · ${Math.round(a.cycle/60)} phút/lứa${a.feeds?' × '+a.feeds+' lứa':''} → ${a.yield} ${esc(SD.ITEMS[a.product].name.toLowerCase())}</small></span><span>${fmt(a.price)} · có ${g.animals.filter(x=>x.k===k).length}/${a.max}</span>${btn('buyan','Mua',{k},'pri')}</div>`).join('')}</div>
    <h5>Thức ăn</h5><div class="list">${Object.entries(SD.FEED).map(([k,f])=>`<div class="row">${ico(k)}<span>${f.name} <small class="muted">có ${g.items[k]||0}</small></span><span>${fmt(f.price)}</span>${btn('feedbuy','Mua 5',{k,n:5})}</div>`).join('')}</div>`; },{wide:true});
ACT.buyan=d=>req({t:'animal',op:'buy',k:d.k}); ACT.feedbuy=d=>req({t:'animal',op:'feedbuy',k:d.k,n:+d.n});
UI.pen=k=>open(SD.ANIMALS[k].name,()=>{ const g=G(), now=NET.now(), list=g.animals.map((a,i)=>[a,i]).filter(([a])=>a.k===k), A=SD.ANIMALS[k];
  return `<div class="list">${list.map(([a,i],n)=>{ const ready=a.cyc&&now>=a.cyc; return `<div class="row"><span>${esc(A.name)} #${n+1}${A.feeds?` · ${a.fed}/${A.feeds} lứa`:''}</span><span>${!a.cyc?'đói':ready?'xong lứa':Math.ceil((a.cyc-now)/1000)+' giây'}</span>${!a.cyc?btn('feed','Cho ăn',{i},'pri'):ready?btn('collect',A.feeds&&a.fed+1<A.feeds?'Xong lứa':'Thu',{i},'pri'):''}</div>`; }).join('')||'<p class="muted">Bạn chưa có con nào. Mua ở trại chú Sáu.</p>'}</div>
    <p class="muted">Cần ${SD.FEED[A.feed].name.toLowerCase()} (có ${g.items[A.feed]||0}).</p>`; });
ACT.feed=d=>req({t:'animal',op:'feed',i:+d.i}); ACT.collect=d=>req({t:'animal',op:'collect',i:+d.i}).then(r=>{ if(!r.err&&r.item) GAME.toast(`Thu <b>${r.n} ${esc(SD.ITEMS[r.item].name.toLowerCase())}</b>`,'vnd'); else if(r.msg) GAME.toast(esc(r.msg),'item'); });
PLACE.stable=()=>open('Trại ngựa · Anh Phong',()=>{ const g=G(), h=g.horse, now=NET.now();
  return money()+(g.skills.cuoingua?'':'<p class="bad">Cần học Cưỡi ngựa (laptop ở phòng)</p>')+`<p>Ngựa: ${h&&h.own?'<b>ngựa của bạn</b>':h&&h.until>now?`thuê còn ${Math.ceil((h.until-now)/60000)} phút`:'chưa có'} · bấm <kbd>H</kbd> để lên/xuống ngựa (chạy ×${SD.HORSE.speed}, chở ${SD.HORSE.carry} thùng hàng)</p>
    <div class="col">${btn('horse','Thuê 1 giờ · '+fmt(SD.HORSE.rent),{op:'rent'})}${h&&h.own?'':btn('horse','Mua ngựa · '+fmt(SD.HORSE.buy),{op:'buy'})}</div>
    <h5>Chăn ngựa (${g.daily.herd}/${SD.HORSE.herd.daily} hôm nay)</h5><p class="muted">Dắt đàn ra đồng cỏ phía Đông, đứng cho ngựa ăn cỏ ${SD.HORSE.herd.dur} giây rồi dắt về đây: +${SD.HORSE.herd.exp} EXP, +${fmt(SD.HORSE.herd.vnd)}.</p>
    ${GAME.HERD?(GAME.HERD.phase==='back'?btn('herd','Giao đàn ngựa',{op:'return'},'pri'):'<em>Đang dắt đàn ra đồng cỏ</em>'):btn('herd','Nhận đàn ngựa',{op:'start'},'pri')}
    <h5>Chở hàng</h5><p class="muted">Lấy thùng ở kho cạnh nhà bác Trang, chở ra điểm nhận hàng ở chợ: ${fmt(SD.CRATES.vnd)} + ${SD.CRATES.exp} EXP/thùng (${g.daily.crates}/${SD.CRATES.daily} hôm nay).</p>`; },{wide:true});
ACT.horse=d=>req({t:'horse',op:d.op});
ACT.herd=async d=>{ const r=await GAME.act({t:'herd',op:d.op}); if(r.err) return; if(d.op==='start'){ GAME.HERD={phase:'go'}; GAME.toast('Dắt đàn ngựa ra đồng cỏ phía Đông','quest'); } if(d.op==='return') GAME.HERD=null; UI.closeAll(); };
for(const k of Object.keys(SD.DALAT.shops)) PLACE[k]=()=>open(SD.DALAT.shops[k].name,()=>{ const o=G().cookOrder, need=o?SD.RECIPES[o.r].need:{};
  return money()+`<div class="list">${Object.entries(SD.INGREDIENTS).filter(([i,g])=>g.shop===k).map(([i,g])=>`<div class="row ${need[i]?'on':''}">${ico(i)}<span>${esc(g.name)} <small class="muted">có ${G().items[i]||0}${need[i]?' · đơn cần '+need[i]:''}</small></span><span>${fmt(g.price)}</span>${btn('ing','Mua',{i,n:1})}</div>`).join('')}</div>`; });
ACT.ing=d=>req({t:'cook',op:'buy',ing:d.i,n:+d.n});
PLACE.quan_lan=()=>open('Quán cô Lan',()=>{ const g=G(), o=g.cookOrder;
  return menuHtml({...SD.PLACES.quan_lan,key:'quan_lan'})+`<h5>Phụ cô Lan nấu (${g.daily.cook}/${SD.COOK.daily} hôm nay)</h5>`+(g.skills.nauan?'':'<p class="bad">Cần học Nấu ăn (laptop ở phòng)</p>')+
    (o?`<p>Đơn: <b>${SD.RECIPES[o.r].name}</b> cần ${Object.entries(SD.RECIPES[o.r].need).map(([k,n])=>`${SD.ITEMS[k].name} ${Math.min(g.items[k]||0,n)}/${n}`).join(', ')}. Mua ở 3 quầy chợ rồi vào bếp (cạnh quán) nấu. Tiền công ${fmt(SD.RECIPES[o.r].pay)}.</p>${btn('cookcancel','Huỷ đơn')}`:btn('order','Nhận đơn nấu','', 'pri')); },{wide:true});
ACT.order=d=>req({t:'cook',op:'order'}); ACT.cookcancel=()=>req({t:'cook',op:'cancel'});
// nấu: 3 nhịp bấm SPACE khi kim vào vùng xanh
let mini=null; function stopMini(){ if(mini){ cancelAnimationFrame(mini.raf); mini=null; } }
UI.cook=()=>{ const o=G().cookOrder; if(!o){ GAME.toast('Nhận đơn ở chỗ cô Lan trước','lock'); return; } const r=SD.RECIPES[o.r];
  const miss=Object.entries(r.need).filter(([k,n])=>(G().items[k]||0)<n); if(miss.length){ GAME.toast('Còn thiếu: '+miss.map(([k])=>SD.ITEMS[k].name).join(', '),'lock'); return; }
  open('Nấu '+r.name,()=>`<p>3 bước: sơ chế · nêm nếm · canh lửa. Bấm <kbd>SPACE</kbd> khi kim vào vùng xanh.</p><canvas id="cookCv" width="360" height="60"></canvas><p id="cookMsg"></p>`,{static:true});
  mini={step:0,score:0,t:0,raf:0,zone:.35+Math.random()*.3}; const loop=()=>{ if(!mini) return; mini.t+=1/60; const c=$('#cookCv'); if(!c) return stopMini(); const g=c.getContext('2d');
    const k=(Math.sin(mini.t*(2.4+mini.step*.8))+1)/2; mini.k=k; g.fillStyle='#2a2230'; g.fillRect(0,0,360,60); g.fillStyle='#4fbf5a'; g.fillRect(mini.zone*340+10,10,40,40); g.fillStyle='#ffd84a'; g.fillRect(10+k*340,4,4,52);
    g.fillStyle='#fff3d6'; g.font='18px VT323'; g.fillText(`Bước ${mini.step+1}/3 · đúng ${mini.score}`,10,56); mini.raf=requestAnimationFrame(loop); }; loop(); };
UI.keys=(pressed)=>{ if(mini&&(pressed.has(' ')||pressed.has('e'))){ const ok=mini.k*340+10>=mini.zone*340+6&&mini.k*340+10<=mini.zone*340+54; mini.score+=ok?1:0; GAME.sfx(ok?'coin':'blip',.4);
    const m=$('#cookMsg'); if(m) m.textContent=ok?'Chuẩn!':'Hơi lệch...'; mini.step++; mini.zone=.1+Math.random()*.75;
    if(mini.step>=3){ const sc=mini.score; stopMini(); UI.closeAll(); GAME.act({t:'cook',op:'cook',score:sc}); } }
  if(raceInput) raceKeys(pressed); };

/* ---------- Nhà giải trí: cờ vua, poker, ma sói ---------- */
let tableId=null;
UI.table=async id=>{ const def=SD.CLUB.tables.find(t=>t.id===id), r=await NET.req({t:'tbl',op:'peek',id}); if(r.err) return GAME.toast(esc(r.err),'lock'); const v=r.v;
  if(v.me>=0){ tableId=id; return UI.tableView(v); }
  const C=SD.CLUB; let body='';
  if(def.game==='chess') body=v.seats.some(Boolean)?`<p>${esc(v.seats.filter(Boolean).map(s=>s.name).join(', '))} đang đợi · cược <b>${fmt(v.bet)}</b> mỗi bên.</p>${btn('join','Ngồi vào (cược '+fmt(v.bet)+')',{id},'pri')}${btn('join','Xem',{id,watch:1})}`
    :`<p>Chọn mức cược (mỗi bên đặt, ai thắng ăn cả):</p><div class="col">${C.chess.bets.map(b=>btn('join',b?fmt(b):'Chơi vui (0đ)',{id,bet:b})).join('')}</div>`;
  if(def.game==='poker') body=`<p>Texas Hold'em · mù ${fmt(C.poker.small)}/${fmt(C.poker.big)} · ${v.seats.filter(Boolean).length}/${C.poker.seats} người</p><p>Mua chip (rời bàn đổi lại thành tiền):</p><div class="col">${[100000,200000,500000,1000000].map(b=>btn('join',fmt(b),{id,buy:b})).join('')}</div>`;
  if(def.game==='masoi') body=v.players.length?`<p>${v.players.length}/${v.max} người · phí <b>${fmt(v.fee)}</b>/người, phe thắng chia pot.</p>${btn('join','Vào bàn',{id},'pri')}`
    :`<p>Ma sói ${v.min}–${v.max} người. Chọn phí vào bàn:</p><div class="col">${C.masoi.fees.map(f=>btn('join',f?fmt(f):'Chơi vui (0đ)',{id,fee:f})).join('')}</div>`;
  open(def.name,()=>money()+body,{static:true}); };
ACT.join=async d=>{ const m={t:'tbl',op:'join',id:d.id}; if(d.bet!==undefined) m.bet=+d.bet; if(d.buy) m.buy=+d.buy; if(d.fee!==undefined) m.fee=+d.fee;
  const r=await GAME.act(m); if(!r.err){ tableId=d.id; const v=(await NET.req({t:'tbl',op:'peek',id:d.id})).v; UI.tableView(v); } };
ACT.tleave=async()=>{ await NET.req({t:'tbl',op:'leave'}); tableId=null; UI.closeAll(); };
UI.tableView=v=>{ if(!tableId||v.id!==tableId) return; const t={chess:'Cờ vua',poker:'Poker',masoi:'Ma sói'}[v.game]+' · '+v.name;
  if(!cur||cur.t!==t){ open(t,()=>tableHtml(GAME.TABLE&&GAME.TABLE.id===tableId?GAME.TABLE:v),{wide:true}); } else draw(); if(v.game==='chess') setTimeout(drawBoard,0); };
function tableHtml(v){ if(v.game==='chess') return chessHtml(v); if(v.game==='poker') return pokerHtml(v); return masoiHtml(v); }
const log=v=>`<div class="tlog">${(v.log||[]).slice(-6).map(l=>`<div>${esc(l)}</div>`).join('')}</div>`;
// cờ vua
let sel=-1;
function chessHtml(v){ const me=v.me, mc=me===0?'w':me===1?'b':null, cl=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  const res=v.result?(v.result.w<0?'Hoà · '+v.result.why:`${esc(v.seats[v.result.w]?v.seats[v.result.w].name:'?')} thắng · ${esc(v.result.why)}`):'';
  return `<div class="chess"><canvas id="board" width="320" height="320"></canvas><div class="cside">
    <p>⬛ ${esc(v.seats[1]?v.seats[1].name:'(trống)')} · <b>${cl(v.clock[1])}</b></p><p>⬜ ${esc(v.seats[0]?v.seats[0].name:'(trống)')} · <b>${cl(v.clock[0])}</b></p>
    <p>Cược: <b>${fmt(v.bet)}</b> mỗi bên${v.watchers?' · '+v.watchers+' người xem':''}</p>
    <p>${v.st==='wait'?'Đợi người chơi thứ 2...':v.st==='play'?(v.turn===mc?'<b class="good">Tới lượt bạn</b>':'Đợi đối thủ...')+(v.check?' · <b class="bad">Chiếu!</b>':''):'<b>'+res+'</b>'}</p>
    ${me>=0&&v.st==='play'?btn('cmove','Xin hoà',{op:'draw'})+btn('cmove','Xin thua',{op:'resign'}):''}${me>=0&&v.st==='end'?btn('cmove',v.rematch[me]?'Đã sẵn sàng':'Chơi ván mới',{op:'rematch'},'pri'):''}
    ${v.draw>=0&&v.draw!==me&&v.st==='play'?'<p class="good">Đối thủ xin hoà · bấm Xin hoà để đồng ý</p>':''}${btn('tleave','Rời bàn')}${log(v)}</div></div>`; }
ACT.cmove=d=>NET.req({t:'tbl',id:tableId,op:d.op});
const PIECE={k:['..XX..','.XXXX.','..XX..','.XXXX.','..XX..','.XXXX.','XXXXXX'],q:['X.XX.X','XXXXXX','.XXXX.','..XX..','.XXXX.','.XXXX.','XXXXXX'],r:['X.XX.X','XXXXXX','.XXXX.','.XXXX.','.XXXX.','.XXXX.','XXXXXX'],
  b:['..XX..','.XX.X.','.XXXX.','..XX..','.XXXX.','..XX..','XXXXXX'],n:['.XXX..','XXXXX.','XX.XX.','...XX.','..XXX.','.XXXX.','XXXXXX'],p:['......','..XX..','.XXXX.','..XX..','.XXXX.','.XXXX.','XXXXXX']};
function drawBoard(){ const c=$('#board'), v=GAME.TABLE; if(!c||!v||v.game!=='chess') return; const g=c.getContext('2d'), flip=v.me===1, S=40;
  const st=v.b?{b:v.b,turn:v.turn,castle:v.castle||'',ep:v.ep,half:0,full:1}:null, legal=st&&sel>=0?CHESS.legal(st).filter(m=>m.from===sel).map(m=>m.to):[];
  for(let i=0;i<64;i++){ const r=i>>3, f=i&7, X=(flip?7-f:f)*S, Y=(flip?7-r:r)*S; g.fillStyle=(r+f)%2?'#8a5d3b':'#e8d8b4'; g.fillRect(X,Y,S,S);
    if(v.last&&(v.last.from===i||v.last.to===i)){ g.fillStyle='rgba(255,216,74,.35)'; g.fillRect(X,Y,S,S); } if(i===sel){ g.fillStyle='rgba(127,224,255,.5)'; g.fillRect(X,Y,S,S); }
    if(legal.includes(i)){ g.fillStyle='rgba(79,191,90,.55)'; g.fillRect(X+14,Y+14,12,12); }
    const p=v.b&&v.b[i]; if(p){ const m=PIECE[p.toLowerCase()], w=p===p.toUpperCase(); m.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch!=='X') return; g.fillStyle='#1c1516'; g.fillRect(X+5+x*5-1,Y+3+y*5-1,7,7); }));
      m.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch!=='X') return; g.fillStyle=w?'#fbfaf6':'#3a2c36'; g.fillRect(X+5+x*5,Y+3+y*5,5,5); })); } }
  if(v.check&&v.b){ const k=v.b.indexOf(v.turn==='w'?'K':'k'), r=k>>3, f=k&7; g.strokeStyle='#ff6a55'; g.lineWidth=3; g.strokeRect((flip?7-f:f)*S+2,(flip?7-r:r)*S+2,S-4,S-4); } }
inner.addEventListener('click',e=>{ if(e.target.id!=='board') return; const v=GAME.TABLE; if(!v||v.st!=='play'||v.me<0) return; const rc=e.target.getBoundingClientRect(), S=rc.width/8, flip=v.me===1;
  let f=Math.floor((e.clientX-rc.left)/S), r=Math.floor((e.clientY-rc.top)/S); if(flip){ f=7-f; r=7-r; } const i=r*8+f, p=v.b[i], mine=p&&((p===p.toUpperCase())===(v.me===0));
  if(sel>=0&&!mine){ const from=sel; sel=-1; NET.req({t:'tbl',id:tableId,op:'move',from,to:i,promo:'q'}).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); }); } else sel=mine&&v.turn===(v.me===0?'w':'b')?i:-1; drawBoard(); });
// poker
const card=c=>c==='??'?'<span class="card back"></span>':`<span class="card ${'hd'.includes(c[1])?'red':''}">${c[0]==='T'?'10':c[0]}${{s:'♠',h:'♥',d:'♦',c:'♣'}[c[1]]}</span>`;
function pokerHtml(v){ const me=v.me, s=v.seats[me], myTurn=v.st==='play'&&v.toAct===me, need=s?v.cur-s.bet:0;
  return `<div class="poker"><p>Pot: <b>${fmt(v.pot)}</b> · mù ${fmt(v.blinds[0])}/${fmt(v.blinds[1])} ${v.st==='play'?'· lượt còn '+Math.ceil(v.left/1000)+'s':v.st==='wait'?'· đợi đủ 2 người':''}</p>
    <div class="board">${v.board.map(card).join('')||'<span class="muted">Chưa lật bài</span>'}</div>
    <div class="seats">${v.seats.map((x,i)=>x?`<div class="seat ${i===v.toAct?'act':''} ${x.fold?'fold':''}"><b>${esc(x.name)}${i===v.dealer?' (D)':''}</b><span>${fmt(x.chips)}${x.bet?' · cược '+fmt(x.bet):''}${x.allin?' · ALL-IN':''}</span><div>${(x.cards||[]).map(card).join('')}</div>${x.hand?`<em>${esc(x.hand)}</em>`:''}</div>`:'<div class="seat empty">trống</div>').join('')}</div>
    ${myTurn?`<div class="pact">${btn('pk','Bỏ bài',{op:'fold'})}${need>0?btn('pk','Theo '+fmt(Math.min(need,s.chips)),{op:'call'},'pri'):btn('pk','Xem bài',{op:'check'},'pri')}
      <input id="raiseTo" type="number" step="5000" value="${v.cur+v.minRaise}" min="${v.cur+v.minRaise}" aria-label="Tố lên">${btn('pk','Tố',{op:'raise'})}${btn('pk','All-in',{op:'allin'})}</div>`:''}
    ${s&&s.chips<v.blinds[1]&&v.st!=='play'?btn('pk','Mua thêm 200.000đ chip',{op:'rebuy'}):''}${btn('tleave','Rời bàn (đổi chip ra tiền)')}${log(v)}</div>`; }
ACT.pk=d=>{ const m={t:'tbl',id:tableId,op:d.op}; if(d.op==='raise') m.to=+$('#raiseTo').value; if(d.op==='rebuy') m.buy=200000; NET.req(m).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); }); };
// ma sói
function masoiHtml(v){ const me=v.me, alive=v.players[me]&&v.players[me].alive, ph={wait:'Đợi người',night:'Ban đêm',day:'Ban ngày: bàn bạc',vote:'Bỏ phiếu treo cổ',end:'Hết ván'}[v.st];
  const act=v.st==='night'?{soi:['kill','Cắn'],tientri:['see','Soi'],baove:['guard','Bảo vệ']}[v.role]:v.st==='vote'?['vote','Treo']:null;
  return `<div class="masoi"><p><b>${ph}</b> · ngày ${v.day} ${v.left?'· còn '+Math.ceil(v.left/1000)+'s':''} · phí ${fmt(v.fee)} · pot ${fmt(v.pot)}</p>
    ${v.role?`<p class="role">Bạn là <b>${esc(v.roleName)}</b>${alive?'':' · đã chết'}</p>`:''}${v.seen&&v.seen.length?`<p class="muted">Đã soi: ${v.seen.map(s=>esc(s.n)+(s.soi?' (SÓI)':' (dân)')).join(', ')}</p>`:''}
    <div class="mplayers">${v.players.map((p,i)=>`<div class="mp ${p.alive?'':'dead'} ${v.myAct===i?'pick':''}"><b>${esc(p.name)}</b><span>${p.role?esc(p.role):p.alive?'':'đã chết'}${v.votes&&Object.values(v.votes).filter(x=>x===i).length?' · '+Object.values(v.votes).filter(x=>x===i).length+' phiếu':''}</span>
      ${alive&&act&&p.alive&&i!==me&&!(v.role==='soi'&&p.soi&&v.st==='night')?btn('ms',act[1],{op:act[0],target:i}):''}</div>`).join('')}</div>
    ${v.st==='vote'&&alive?btn('ms','Bỏ qua',{op:'vote',target:-1}):''}${(v.st==='wait'||v.st==='end')&&v.players.length>=v.min?btn('ms','Bắt đầu ván',{op:'start'},'pri'):''}
    <div class="tlog">${v.log.slice(-5).map(l=>`<div>${esc(l)}</div>`).join('')}${v.chat.slice(-6).map(c=>`<div class="${c.to==='soi'?'bad':''}"><b>${esc(c.n)}:</b> ${esc(c.m)}</div>`).join('')}</div>
    ${alive?`<div class="form"><input id="msIn" maxlength="100" placeholder="${v.st==='night'?(v.role==='soi'?'Nói với bầy sói...':'Ban đêm im lặng'):'Nói với cả làng...'}" aria-label="Nói">${btn('mschat','Nói')}</div>`:''}${btn('tleave','Rời bàn')}</div>`; }
ACT.ms=d=>NET.req({t:'tbl',id:tableId,op:d.op,target:+d.target}).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); });
ACT.mschat=()=>{ const m=$('#msIn').value.trim(); if(m) NET.req({t:'tbl',id:tableId,op:'chat',m}); $('#msIn').value=''; };
inner.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='msIn') ACT.mschat(); });

/* ---------- trường đua: đăng ký, cược, đua kiểu Audition ---------- */
let raceInput=null; const ARW={L:'←',U:'↑',R:'→',D:'↓'}, KEY2={arrowleft:'L',arrowup:'U',arrowright:'R',arrowdown:'D',a:'L',w:'U',d:'R',s:'D'};
UI.race=()=>open('Trường đua ngựa',()=>raceHtml(GAME.RACE),{wide:true});
function raceHtml(v){ if(!v) return '<p class="muted">Đang tải...</p>'; const R=SD.RACE, me=v.me;
  return money()+`<p>${v.st==='idle'?'Chưa có trận. Đăng ký để mở trận mới.':v.st==='lobby'?`Đang nhận kỵ sĩ + cược${v.lobbyLeft?' · xuất phát sau '+Math.ceil(v.lobbyLeft/1000)+'s':' · cần ít nhất '+R.minRiders+' kỵ sĩ'}`:v.st==='run'?`Đang đua · nhịp ${v.round+1}/${v.rounds}`:'Kết thúc'}</p>
    <div class="list">${v.riders.map((r,i)=>`<div class="row"><span>#${i+1} <b>${esc(r.name)}</b> <small class="muted">${r.dist}/${v.track}m · ${r.pf} perfect</small></span><span>cược ${fmt(r.pot)}</span>${v.st==='lobby'?btn('rbet','Cược 50k',{on:i,amt:50000})+btn('rbet','Cược 200k',{on:i,amt:200000}):''}</div>`).join('')||'<p class="muted">Chưa có ai</p>'}</div>
    <p>Tổng cược: <b>${fmt(v.pool)}</b>${v.myBets.length?' · bạn cược: '+v.myBets.map(b=>`#${b.on+1} ${fmt(b.amt)}`).join(', '):''}</p>
    ${(v.st==='idle'||v.st==='lobby')&&me<0?btn('rjoin','Thuê ngựa đua · '+fmt(R.rent),{},'pri'):''}${v.st==='lobby'&&me>=0?btn('rleave','Rút lui (hoàn tiền)'):''}
    ${v.results?`<h5>Kết quả</h5><p>${v.results.order.map((r,i)=>`${i+1}. ${esc(r.name)} (${r.dist}m)`).join(' · ')}<br>Người về nhất ăn ${fmt(v.results.prize)} tiền thuê ngựa · cược chia theo tỉ lệ</p>`:''}
    <p class="muted">Cách đua: mỗi nhịp hiện chuỗi mũi tên. Gõ đúng chuỗi bằng phím mũi tên (hoặc WASD), rồi bấm SPACE đúng lúc vạch chạy tới mốc vàng. PERFECT liên tiếp được cộng combo.</p>`; }
ACT.rjoin=()=>req({t:'race',op:'join'}); ACT.rleave=()=>req({t:'race',op:'leave'}); ACT.rbet=d=>req({t:'race',op:'bet',on:+d.on,amt:+d.amt});
let lastRound=-1, judge=null;
UI.raceView=v=>{ if(cur&&cur.t==='Trường đua ngựa') draw();
  if(v.st==='run'&&v.me>=0){ if(cur&&cur.t==='Trường đua ngựa') UI.closeAll(); if(v.round!==lastRound){ lastRound=v.round; raceInput={r:v.round,keys:[],sent:false}; } } else if(v.st!=='run'){ raceInput=null; lastRound=-1; } };
UI.raceHit=m=>{ const v=GAME.RACE; if(v&&m.i===v.me) judge={j:m.j,combo:m.combo,t:performance.now()}; };
function raceKeys(pressed){ const v=GAME.RACE; if(!v||v.st!=='run'||!raceInput||raceInput.sent) return;
  for(const k of pressed){ const a=KEY2[k]; if(a){ if(raceInput.keys.length<v.seq.length){ raceInput.keys.push(a); if(v.seq[raceInput.keys.length-1]!==a){ raceInput.keys=[]; GAME.sfx('blip',.3); } } }
    if(k===' '){ raceInput.sent=true; NET.send({t:'race',op:'hit',r:v.round,keys:raceInput.keys,off:NET.now()-v.beat}); } } }
UI.raceOverlay=(g)=>{ const v=GAME.RACE; if(!v||v.st!=='run'||v.me<0) return; const W=innerWidth, Y=innerHeight-150, now=NET.now();
  g.fillStyle='rgba(28,22,30,.85)'; g.fillRect(W/2-230,Y-60,460,120);
  const n=v.seq.length, ks=raceInput?raceInput.keys:[]; g.font='34px VT323, monospace'; g.textAlign='center';
  v.seq.forEach((a,i)=>{ g.fillStyle=i<ks.length?'#7de07a':'#fff3d6'; g.fillText(ARW[a],W/2+(i-(n-1)/2)*40,Y-18); });
  const t0=v.roundStart, k=Math.max(0,Math.min(1,(now-t0)/v.roundMs)), mk=SD.RACE.beatAt/v.roundMs;
  g.fillStyle='#3a2f40'; g.fillRect(W/2-200,Y,400,14); g.fillStyle='#ffd84a'; g.fillRect(W/2-200+mk*400-4,Y-4,8,22); g.fillStyle='#7fe0ff'; g.fillRect(W/2-200+k*400-2,Y-2,4,18);
  if(judge&&performance.now()-judge.t<900){ g.fillStyle={PERFECT:'#ffd84a',GREAT:'#7de07a',COOL:'#7fe0ff',BAD:'#ff9f2e',MISS:'#ff6a55'}[judge.j]; g.font='40px VT323, monospace'; g.fillText(judge.j+(judge.combo>1?' x'+judge.combo:''),W/2,Y-62); }
  g.font='18px VT323, monospace'; g.fillStyle='#c9b9a6'; g.fillText(raceInput&&raceInput.sent?'Đã bấm':'Gõ mũi tên rồi SPACE ở mốc vàng',W/2,Y+40); };

window.UI=UI;
})();
