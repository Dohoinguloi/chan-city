/* Chan City — các bảng giao diện: quán, shop, lễ tân, phòng, laptop (chợ online / học / chat), Grab, Everfit, vườn, trại,
   nấu ăn, tương tác người chơi, bàn cờ vua / poker / ma sói, trường đua kiểu Audition. */
(function(){
const SD=SHARED, $=s=>document.querySelector(s), fmt=SD.fmt, Gm=()=>GAME, G=()=>GAME.G, esc=s=>GAME.esc(s);
const UI={}; let cur=null;                              // bảng đang mở: {el, render}
const box=$('#panel'), inner=$('#panelInner'), title=$('#panelTitle');
// bảng bị gọi khi còn ở màn tiêu đề / tạo nhân vật (tin server tới sớm) thì để dành, vào game rồi mới mở qua hàng đợi
function open(t,render,o={}){ if(!$('#title').hidden){ UI.autoOpen('pre:'+t,()=>open(t,render,o)); return; } cur={render,t,o}; box.hidden=false; box.classList.toggle('wide',!!o.wide); box.classList.toggle('xwide',!!o.xwide); box.classList.toggle('full',!!o.full); title.textContent=t; draw(); }
// vẽ lại bảng nhưng giữ ô đang gõ/kéo (chat ma sói, thanh tố poker) khỏi bị reset mỗi lần server gửi trạng thái mới
function draw(){ if(!cur) return; const a=document.activeElement, keep=a&&inner.contains(a)&&a.id?{id:a.id,v:a.value,s:a.selectionStart}:null; inner.innerHTML=cur.render(); thumbify(inner);
  if(keep){ const b=document.getElementById(keep.id); if(b){ if(b.type!=='range'||(+keep.v>=+b.min&&+keep.v<=+b.max)) b.value=keep.v; b.focus(); try{ if(keep.s!=null) b.setSelectionRange(keep.s,keep.s); }catch(e){} if(b.id==='raiseTo'){ const l=document.getElementById('raiseLbl'); if(l) l.textContent=fmt(+b.value); } } } }
UI.refresh=()=>{ if(cur&&!cur.o.static) draw(); };
// mọi thẻ trong cửa sổ đều có ảnh thumbnail: thẻ có icon thì đóng khung nền màu; thẻ chưa có thì chọn ảnh theo nội dung
const TH_KEYS=[[/sting|tăng lực/,'sting'],[/\bmì\b/,'migoi'],[/khô gà/,'khoga'],[/bí ngô/,'pumpkin'],[/phở/,'pho'],[/cà phê|cafe/,'cafe'],[/đồ cổ|bình gốm|báu vật/,'tr_binh_gom'],[/rương/,'tr_ruong_bau'],[/bướm/,'buom_la_xanh'],[/vợt/,'net'],
  [/trứng/,'egg'],[/thóc|cám|cỏ khô|thức ăn/,'feed'],[/gà/,'chicken'],[/tôm/,'shrimp'],[/lợn|heo/,'pig'],[/bò|sữa/,'milk'],[/kayak|phao|chèo|thuyền/,'fish2'],[/cá/,'fish'],[/nấm/,'mushroom'],[/măng/,'shoot'],
  [/hoa/,'flower'],[/lá|bể bơi/,'leaf'],[/rau/,'greens'],[/hạt|giống/,'seed'],[/cây|đất|vườn|trồng/,'sapling'],[/thùng|giao hàng|ship/,'crate'],[/nấu|cỗ|món|bánh|bún|cơm|ăn/,'dish'],[/ảnh|chụp|check-in/,'photo'],
  [/kính/,'sunglasses'],[/dây chuyền/,'chain'],[/mũ|nón/,'hat'],[/vòng|nhẫn/,'bracelet'],[/củi|lửa/,'wood'],[/loa|nhạc/,'speaker'],[/cúp|giải|thắng/,'cup'],[/wireframe|thiết kế|design|logo|vẽ/,'paper'],[/sim|gói|data|cáp|số/,'photo'],[/đ\b|tiền|giá/,'coin']];
const TH_HUE=k=>{ let h=0; for(const c of k) h=(h*31+c.charCodeAt(0))%360; return h; };
function thumbify(root){ for(const row of root.querySelectorAll('.list:not(.rows)>.row')){ let img=row.querySelector(':scope>img.ico'), key='';
    if(!img){ const tx=row.textContent.toLowerCase(); for(const [re,k] of TH_KEYS) if(re.test(tx)){ key=k; break; } key=key||'paper'; img=document.createElement('img'); img.className='ico'; img.alt=''; try{ img.src=GAME.icon64(key); }catch(e){ continue; } row.prepend(img); }
    else key=img.getAttribute('src').slice(-24);
    const w=document.createElement('i'); w.className='rth'+(img.classList.contains('dogi')?' wide':''); w.style.setProperty('--h',TH_HUE(key)); img.replaceWith(w); w.appendChild(img); } }
UI.isOpen=()=>!box.hidden;
UI.open=open;   // cho module ngoài (fight.js) mở bảng
UI.closeAll=()=>{ cur=null; box.hidden=true; box.classList.remove('full','xwide'); inner.innerHTML=''; stopMini(); };
// bảng thường đổi được bằng phím tắt; minigame (full / static) và lúc đang hỏi Có/Không thì không
UI.swappable=()=>!!cur&&!cur.o.full&&!cur.o.static&&$('#ask').hidden&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||'');
UI.blocking=()=>!!cur||!$('#ask').hidden||document.activeElement===$('#chatIn')||document.activeElement===$('#wcIn');
// bảng tự bật (điểm danh, quà lễ hội...): xếp hàng, mở lần lượt từng cái khi màn hình đã trống 4 giây liền, để không chồng lên nhau
// và không bật ngay lúc người chơi vừa đóng bảng khác. Người mới thì chờ nghe xong cuộc gọi đầu tiên (đang hướng dẫn) mới mở
const POPQ=[]; let idleAt=0, lastPos='', lastScene=null, sceneAt=0;
UI.autoOpen=(key,fn)=>{ if(!POPQ.some(a=>a.key===key)) POPQ.push({key,fn}); };
setInterval(()=>{ const g=G(), busy=!GAME.S||!g||!g.flags||(!g.flags.called&&GAME.S.kind==='room')||!!cur||!$('#ask').hidden||!$('#dialog').hidden||!$('#travel').hidden||!$('#mapView').hidden||($('#evBanner')||{}).hidden===false||UI.blocking();   /* banner sự kiện đang hiện cũng tính là bận */
  const P=GAME.P, pos=P?Math.round(P.x)+','+Math.round(P.y):''; if(GAME.S!==lastScene){ lastScene=GAME.S; sceneAt=Date.now(); }   // đang đi / vừa xuống xe sang map mới (8 giây) thì chưa bật
  if(pos!==lastPos){ lastPos=pos; idleAt=0; return; }
  if(busy||!POPQ.length||Date.now()-sceneAt<8000){ idleAt=0; return; } if(!idleAt){ idleAt=Date.now(); return; } if(Date.now()-idleAt<4000) return; idleAt=0; POPQ.shift().fn(); },500);
$('#panelClose').onclick=()=>UI.closeAll();
// bấm / chạm ra ngoài bảng (vào màn chơi) thì đóng bảng, không đi đâu cả (game.js bỏ qua cú bấm vì bảng đang mở);
// trừ bảng toàn màn / bảng tĩnh (câu cá, minigame) và lúc đang hỏi Đồng ý / Từ chối
$('#game').addEventListener('click',()=>{ if(cur&&!cur.o.full&&!cur.o.static&&$('#ask').hidden) UI.closeAll(); });
// nút trong bảng: data-a="tên hành động" + data-*
inner.addEventListener('click',e=>{ const b=e.target.closest('[data-a]'); if(!b||b.disabled) return; const f=ACT[b.dataset.a]; if(f) f(b.dataset,b); });
const ACT={};
const btn=(a,label,data={},cls='')=>`<button class="btn sm ${cls}" data-a="${a}" ${Object.entries(data).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const ico=k=>`<img class="ico" src="${GAME.icon64(k)}" alt="">`;
// cho module ngoài (lc.js...) dùng chung nút / hành động / bảng theo nơi
UI.btn=btn; UI.ico=ico; UI.ask=(h,cb,sec)=>quickAsk(h,cb,sec); UI.onAct=(k,f)=>{ ACT[k]=f; }; UI.defPlace=(k,f)=>{ PLACE[k]=f; }; UI.qRow=id=>qRow(id);
const money=()=>`<div class="pmoney">Ví: <b>${fmt(G().money)}</b></div>`;
// nút tự đi tới 1 người bán/chủ trại trong map hiện tại
const goBtn=(id,label)=>btn('goto','Đi tới '+label+' ➜',{id},'go');
ACT.goto=d=>GAME.walkToNpc(d.id);
async function req(m,ok){ const r=await GAME.act(m,ok); UI.refresh(); return r; }

/* ---------- menu Esc ---------- */
UI.menu=()=>open('Menu',()=>`<div class="col mcol">${btn('close','Chơi tiếp')}${btn('mute',GAME.AUD.muted?'Bật tiếng':'Tắt tiếng')}${document.body.classList.contains('touch')?btn('mchat','💬 Chat'):''}${document.body.classList.contains('touch')||matchMedia('(max-height:620px),(max-width:900px)').matches?btn('hudbtn','Tủ đồ',{id:'btnWard'})+btn('hudbtn','Xếp hạng',{id:'btnLb'})+btn('hudbtn','Về phòng',{id:'btnHome'})+btn('hudbtn','Vườn & chuồng',{id:'btnFarm'})+btn('hudbtn','Thanh kỹ năng',{id:'btnSkills'})+btn('hudbtn','📅 Hằng ngày',{id:'btnDaily'})+btn('hudbtn','👥 Ai đang online',{id:'hudPlayers'}):''}
  ${btn('nosoc',G().opts.noSocial?'Nhận lời mời tương tác: TẮT':'Nhận lời mời tương tác: BẬT')}${btn('bag','Túi đồ (I)')}${btn('phone','Điện thoại')}${btn('ach','Thành tích')}${btn('logout','Đăng xuất','','bad')}</div>
  <h5>Kỹ năng</h5><div class="list">${Object.entries(SD.SKILLS).filter(([k])=>G().skills[k]).map(([k,s])=>`<div class="row"><span><b>${s.name}</b> <small class="muted">${s.desc}</small></span><span>${s.key==='-'?'tự động':s.key==='E'?'E ở đúng chỗ':'<kbd>'+s.key+'</kbd>'}</span></div>`).join('')}</div>
  <p class="muted">Phím: WASD đi · Shift chạy · E tương tác · Enter chat · G gọi Grab · P chụp ảnh · I túi đồ · M bản đồ · L xếp hạng · B về phòng · H lên/xuống ngựa · N thanh kỹ năng</p>`,{wide:true});
ACT.phone=()=>UI.phone(); ACT.ach=()=>UI.ach(); ACT.close=()=>UI.closeAll(); ACT.mute=()=>{ GAME.setMute(!GAME.AUD.muted); draw(); }; ACT.bag=()=>UI.bag();
ACT.nosoc=async()=>{ await NET.req({t:'opt',noSocial:!G().opts.noSocial}); setTimeout(draw,200); };
ACT.logout=async()=>{ try{ await NET.api('logout',{token:NET.token}); localStorage.removeItem('chan-token'); sessionStorage.removeItem('chan-token'); }catch(e){} location.reload(); };

/* ---------- chat gần ---------- */
const chatIn=$('#chatIn');
ACT.hudbtn=d=>{ UI.closeAll(); const b=document.getElementById(d.id); if(b) b.click(); };   // menu trên điện thoại mở các nút HUD bị ẩn
ACT.mchat=()=>{ UI.closeAll(); UI.chat(); };
UI.chat=()=>UI.wchat();   // chỉ còn 1 ô chat: kênh tổng (kèm bong bóng cho người ở gần)
chatIn.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ const m=chatIn.value.trim(); if(m) NET.send({t:'chat',m}); chatIn.value=''; chatIn.blur(); }
  if(e.key==='Escape'){ chatIn.value=''; chatIn.blur(); } });
chatIn.addEventListener('blur',()=>{ chatIn.hidden=true; $('#chatBox').classList.remove('typing'); });
// kênh chat tổng: tin của cả server hiện trên thanh đồ, phím T để gõ
const wcLog=$('#wcLog'), wcIn=$('#wcIn'), wcBox=$('#wchat');
function wcAdd(e){ const d=document.createElement('div'), hm=SD.realTime(e.at), mine=!e.sys&&e.n===G().name; if(mine) d.className='me'; if(e.sys) d.className='sys';
  d.innerHTML=`<small>${String(hm.h).padStart(2,'0')}:${String(hm.m).padStart(2,'0')}</small> <b>${esc(e.n)}</b>${e.sys?'':` <small>Lv${e.lv|0}</small>`}: ${esc(e.m)}`; d.title=e.n+': '+e.m;
  const atEnd=wcLog.scrollHeight-wcLog.scrollTop-wcLog.clientHeight<8; wcLog.appendChild(d); while(wcLog.children.length>40) wcLog.firstChild.remove(); if(atEnd||mine) wcLog.scrollTop=wcLog.scrollHeight; }
let wcUnread=0; const wcShow=$('#wcShow'), wcMark=()=>{ $('#wcNew').textContent=wcUnread?`(${wcUnread} mới)`:''; };
NET.listen('wchat',e=>{ wcAdd(e); if(e.n!==G().name){ if(wcBox.hidden){ wcUnread++; wcMark(); } wcBox.classList.add('flash'); setTimeout(()=>wcBox.classList.remove('flash'),700); } });
function wcSetHidden(h){ wcBox.hidden=h; wcShow.hidden=!h; if(!h){ wcUnread=0; wcMark(); wcLog.scrollTop=wcLog.scrollHeight; } try{ localStorage.setItem('chan-wchat',h?'0':'1'); }catch(e){} }
$('#wcHide').addEventListener('click',e=>{ e.currentTarget.blur(); wcSetHidden(true); }); wcShow.addEventListener('click',e=>{ e.currentTarget.blur(); wcSetHidden(false); });
try{ if(localStorage.getItem('chan-wchat')==='0') wcSetHidden(true); }catch(e){}
NET.listen('wchatlog',m=>{ wcLog.innerHTML=''; for(const e of m.list||[]) wcAdd(e); wcLog.scrollTop=wcLog.scrollHeight; });
UI.wchat=()=>{ if(wcBox.hidden) wcSetHidden(false); wcIn.focus(); };
wcIn.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ const m=wcIn.value.trim(); if(m) NET.req({t:'wchat',m}).then(r=>{ if(r&&r.err) GAME.toast(esc(r.err),'lock'); }); wcIn.value=''; wcIn.blur(); }
  if(e.key==='Escape'){ wcIn.value=''; wcIn.blur(); } });
wcIn.addEventListener('keyup',e=>e.stopPropagation());
$('#wcFold').addEventListener('click',e=>{ e.currentTarget.blur(); const big=wcBox.classList.toggle('big'); e.currentTarget.textContent=big?'▾':'▴'; wcLog.scrollTop=wcLog.scrollHeight; });
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
UI.grab=()=>open('Gọi Grab',()=>{ const from=destOf(), g=G(), bat=Math.round(g.needs.battery), xt=(g.xt&&g.xt.lv||0)>=SD.XICHTHO.tele;
  return (xt?'<p class="good">🔥 Xích Thố cấp '+SD.XICHTHO.tele+': bấm 🔥 để dịch chuyển tới ngay, ở đâu cũng được, không tốn tiền, không cần pin</p>':'')+`<p>Pin điện thoại: <b class="${bat<SD.GRAB.minBattery?'bad':''}">${bat}%</b> ${bat<SD.GRAB.minBattery?'· hết pin, không gọi được '+btn('nhosac','🔌 Xin sạc nhờ người gần đây',{},'pri'):''}</p>`+money()+
  `<div class="list grab">${Object.entries(SD.DEST).map(([k,d])=>{ const here=(k==='home'&&GAME.S.kind==='room')||k===GAME.S.kind; let fare=SD.grabFare(from,k), note='';
    if(k==='retreat'&&!g.flags.freeRide){ fare=0; note=' · Pháp bao'; } if(k==='retreat'&&!g.flags.called) note=' · chưa có kèo';
    if(k==='diep'){ const D=SD.DIEP; note=g.level<D.level||g.money<D.money?` · cần cấp ${D.level}, ≥${fmt(D.money)}`:' · Diệp nấu ăn cho'; } if(k==='lumen') note=' · studio làm remote, EXP ×'+SD.LUMEN.expMul; if(k==='das'&&g.level<SD.DAS.level) note=' · cần cấp '+SD.DAS.level;
    const fly=d.plane||(SD.DEST[from]&&SD.DEST[from].plane), poor=!here&&fare>g.money; /* không đủ tiền: nút xám ghi thiếu bao nhiêu */ const th=GAME.destThumb(k); return `<div class="row">${th?`<img class="dthumb" src="${th}" alt="">`:'<div class="dthumb load"></div>'}<span>${fly?'✈ ':''}${d.name}</span><span>${here?'đang ở đây':fare?`<b class="${poor?'bad':''}">${fmt(fare)}</b>`+(fly?' (vé máy bay)':''):'miễn phí'}${note}</span>${here?'':poor?`<button class="btn sm" disabled title="Ví còn ${fmt(g.money)}">Thiếu ${fmt(fare-g.money)}</button>`:btn('grab',fly?'Mua vé':'Đi',{to:k},'pri')}${here||!xt?'':btn('grab','🔥 Dịch chuyển',{to:k,xt:1},'pri')}</div>`; }).join('')}</div>
  <p class="muted">Rời map nào cũng phải gọi Grab. Xe Grab cần điện thoại còn pin ≥ ${SD.GRAB.minBattery}%.</p>`; },{xwide:true});
ACT.grab=async d=>{ const r=await GAME.act({t:'grab',to:d.to,xt:d.xt?1:0}); if(!r.err) UI.closeAll(); };

/* ---------- túi đồ + tủ quần áo ---------- */
UI.bag=()=>open('Túi đồ',()=>{ const g=G(), it=Object.entries(g.items);
  return money()+`<div class="grid">${it.length?it.map(([k,n])=>`<div class="cell" title="${esc(SD.ITEMS[k]?SD.ITEMS[k].name:k)}">${ico(k)}<span>${esc(SD.ITEMS[k]?SD.ITEMS[k].name:k)}</span><i>${n}</i></div>`).join(''):'<p class="muted">Túi trống</p>'}</div>
  <h5>Ảnh đã chụp (${g.photos.length}/6)</h5><p class="muted">${g.photos.map(p=>esc(p.name)).join(' · ')||'Chưa có. Bấm P ở chỗ đẹp để chụp, rồi về phòng up ảnh sống ảo.'}</p>
  <h5>Kỹ năng</h5><p class="muted">${Object.keys(g.skills).map(k=>SD.SKILLS[k]?SD.SKILLS[k].name:k).join(' · ')}</p>`; },{wide:true});
function outfitHtml(shop){ const g=G(), out=g.look.outfit||{};
  return `<div class="shopwrap"><canvas id="pv" width="64" height="96"></canvas><div class="list">${[['hot','🔥 Set hot (mặc là thay cả bộ)'],...SD.SLOTS].map(([slot,name])=>{
    const items=Object.entries(SD.CLOTHES).filter(([k,c])=>(slot==='hot'?c.hot:c.slot===slot&&!c.hot)&&(!c.hidden||!shop&&g.owned[k])&&(shop||g.owned[k])); if(!items.length) return '';   /* đồ riêng (ẩn ở shop) vẫn hiện trong tủ đồ của người sở hữu */
    return `<h5>${name}</h5>`+items.map(([k,c])=>{ const own=g.owned[k], sl=c.slot, on=out[sl]===k;
      return `<div class="row ${on?'on':''}" data-a="preview" data-k="${k}"><img class="thumb" data-thumb="${k}" src="${thumbOf(k)}" alt=""><span>${esc(c.name)}</span><span>${own?(on?'đang mặc':'đã có'):fmt(c.price)}</span>${own?(on?(['top','bottom','shoes'].includes(sl)?'':btn('unequip','Cởi',{slot:sl})):btn('equip','Mặc',{k,slot:sl})):shop?btn('buyc','Mua',{k},'pri'):''}</div>`; }).join(''); }).join('')}</div></div>`; }
// ảnh thu nhỏ từng món: dựng nhân vật của bạn mặc thử món đó, cắt đúng vùng (đầu / thân / chân), làm dần từng món cho khỏi giật
const THUMB=new Map(), thumbQ=[]; let thumbBusy=false; const BLANK='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const THUMB_CROP={head:[6,11,20,20],eyes:[6,11,20,20],neck:[6,22,20,20],top:[6,24,20,20],wrist:[6,26,20,20],bottom:[6,30,20,18],shoes:[6,32,20,16]};
function thumbOf(k){ const key=k+'|'+JSON.stringify([G().look.gender,G().look.skin,G().look.hair,G().look.hairColor]); if(THUMB.has(key)) return THUMB.get(key);
  if(!thumbQ.some(q=>q.key===key)) thumbQ.push({k,key}); if(!thumbBusy){ thumbBusy=true; setTimeout(thumbWork,30); } return BLANK; }
function thumbWork(){ const q=thumbQ.shift(); if(!q){ thumbBusy=false; return; } const c=SD.CLOTHES[q.k], lk=G().look, base={...(lk.outfit||{})};
  if(!['top','bottom','shoes'].includes(c.slot)) for(const s of ['eyes','head','neck','wrist']) delete base[s];
  const av=AVATAR.build({...lk,outfit:{...base,[c.slot]:q.k}}), f=av.anims.idle_down.frames[0], [sx,sy,w,h]=THUMB_CROP[c.slot]||THUMB_CROP.top, cv=document.createElement('canvas'); cv.width=40; cv.height=40;
  const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,40,40); g.drawImage(f,sx,sy,w,h,Math.round((40-w*2)/2),Math.round((40-h*2)/2),w*2,h*2);
  const url=cv.toDataURL(); THUMB.set(q.key,url); document.querySelectorAll(`img[data-thumb="${q.k}"]`).forEach(im=>{ im.src=url; }); setTimeout(thumbWork,8); }
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
function menuHtml(pc){ const ms=SD.mealStatus(G().meals,NET.now()), now=NET.now(), cd=G().foodCd||{}, slot=ms.some(m=>m.st==='now'||m.st==='missed');
  // nút ăn: bữa chính hết suất thì ghi giờ bữa tới / 'Đã no'; đồ ăn vặt/uống còn thời gian chờ thì hiện 'Đã ăn · còn x phút'
  const nx=ms.find(m=>m.st==='later'), full=nx?`${nx.name} từ ${nx.from}:00`:'Đã no';   // chưa tới giờ thì ghi giờ mở bữa tới, khỏi ghi "Đang no" lúc 3h sáng
  const eatBtn=(id,f)=>{ if(f.meal&&!slot) return `<button class="btn sm" disabled>${full}</button>`; const left=cd[id]-now;
    if(!f.meal&&left>0) return `<button class="btn sm" disabled>Đã ${f.buff?'uống':'ăn'} · còn ${Math.ceil(left/60e3)} phút</button>`; return btn('eat',f.meal||f.snack?'Ăn':'Uống',{p:pc.key,id},'pri'); };
  return money()+`<p>Bữa: ${ms.map(m=>`<span class="meal ${m.st}">${m.name.replace('Bữa ','')}</span>`).join(' ')} <span class="muted">· trễ giờ thì ăn bù được</span></p><div class="list">`+
    pc.menu.map(id=>{ const f=SD.FOOD[id]; return `<div class="row"><span>${esc(f.name)} <small class="muted">${f.meal?'no 1 bữa':f.buff?'+'+Math.round((f.buff.mul-1)*100)+'% EXP '+f.buff.min+' phút':'ăn vặt, không tính bữa'} · +${f.exp} EXP</small></span><span>${fmt(f.price)}</span>${eatBtn(id,f)}</div>`; }).join('')+'</div>'; }
PLACE.mu_quan=()=>open(SD.PLACES.mu_quan.name,()=>`<p>"Đánh boss mỏi tay thì ghé ăn một bữa cho chắc bụng nhé!"</p>`+menuHtml({...SD.PLACES.mu_quan,key:'mu_quan'}));   // quán ăn ở quảng trường MU
PLACE.epl_food=()=>open(SD.PLACES.epl_food.name,()=>`<p>"Fish & chips nóng hổi cho fan bóng đá đây! Ăn no mới hò hét được 90 phút."</p>`+menuHtml({...SD.PLACES.epl_food,key:'epl_food'}));   // xe đồ ăn ở quảng trường Ngoại Hạng Anh
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
    sellHtml(Object.keys(SD.SELL).filter(k=>k in SD.CROPS||k in SD.TREASURE.items||k==='trung'||k==='sua'),'Cô Ké thu mua (cả báu vật vớt trên sông)')+keYardHtml()+keJobHtml()+`<h5>Việc hôm nay</h5><div class="list">${dailyRow('trangtri')}${dailyRow('nauan')}<div class="row"><span><b>${SD.DAILY.kayak.title}</b><br><small class="muted">${SD.DAILY.kayak.desc}</small></span><span>${dl.done.kayak?'xong hôm nay':Object.keys(dl.buoys||{}).length+'/5'}</span></div></div>`; },{wide:true});
ACT.daily=d=>req({t:'daily',id:d.id});
// sân gà Ké (phía Đông vườn rau): mua gà giống + thóc ở tiệm cô Ké
function keYardHtml(){ const g=G(), A=SD.ANIMALS.ga, n=(g.animals||[]).filter(a=>a.k==='ga'&&a.loc==='ke').length;
  return `<h5>Sân gà Ké (${n} con)</h5><p class="muted">Mỗi con ăn 1 thóc/lứa, ${Math.round(A.cycle/60)} phút đẻ ${A.yield} trứng (cô Ké mua ${fmt(SD.SELL.trung)}/quả).${g.skills.channuoi?'':' Cần học Chăn nuôi ở laptop trong phòng.'}</p>
    <div class="list"><div class="row">${ico('trung')}<span>Gà giống <small class="muted">tối đa ${A.max} con (tính cả gà ở Đà Lạt)</small></span><span>${fmt(A.price)}</span>${btn('buyan','Mua 1',{k:'ga'})}</div>
    <div class="row">${ico('thoc')}<span>Thóc <small class="muted">có ${g.items.thoc||0}</small></span><span>${fmt(SD.FEED.thoc.price)}</span>${btn('feedbuy','Mua 5',{k:'thoc',n:5})}${btn('feedbuy','Mua 20',{k:'thoc',n:20})}</div></div>${btn('gotoxy','Đi tới sân gà ➜',{x:SD.KE_YARD.x,y:SD.KE_YARD.y+3,l:'Sân gà Ké'},'go')}`; }
ACT.gotoxy=d=>{ UI.closeAll(); GAME.walkTo(+d.x,+d.y,d.l); };
// nhân viên Ké Retreat: 3 suất, mỗi ngày 3 việc, ở Nhà Ngủ miễn phí
function keJobHtml(){ const k=G().extra&&G().extra.ke, J=SD.KE_JOB; if(!k) return '';
  if(!k.staff) return `<h5>Làm nhân viên Ké Retreat (${k.count}/${k.max} suất)</h5><p class="muted">Nuôi cá, tưới rau, phục vụ khách, dọn phòng... Mỗi ngày ${J.perDay} việc, mỗi việc ${fmt(J.wage)}. Được ở ${SD.ROOMS[J.room].name} miễn phí. Bỏ ${J.fireAfter} ngày liền là bị cho nghỉ. Từ cấp ${J.minLevel}.</p>${k.count>=k.max?'<p class="bad">Hết suất rồi</p>':btn('kejob','Xin làm nhân viên',{op:'apply'},'pri')}`;
  const t=k.today||{tasks:[],done:[]};
  return `<h5>Việc nhân viên hôm nay (${t.done.length}/${t.tasks.length})</h5><div class="list">${t.tasks.map(id=>{ const D=J.tasks[id], ok=t.done.includes(id); return `<div class="row"><span><b>${D.name}</b> <small class="muted">${D.dur} giây · ${fmt(J.wage)} · +${D.exp} EXP</small></span><span>${ok?'xong':'chưa'}</span>${ok?'':btn('gotoxy','Đi tới ➜',{x:D.x,y:D.y,l:D.name},'go')}</div>`; }).join('')}</div>
    <p class="muted">Ở ${SD.ROOMS[J.room].name} miễn phí khi còn làm.</p>${btn('kejob','Nghỉ làm',{op:'quit'})}`; }
ACT.kejob=async d=>{ if(d.op==='quit'&&!confirm('Nghỉ làm nhân viên Ké? Bạn sẽ mất phòng miễn phí.')) return; const r=await req({t:'kejob',op:d.op}); if(!r.err&&r.msg) GAME.toast(esc(r.msg),'quest'); };
// bể bơi: bơi thư giãn hoặc tè lén (ai bơi cùng sẽ thấy và báo chủ homestay được)
UI.pool=()=>open('Bể bơi',()=>`<div class="col">${btn('poolswim','Bơi thư giãn (+sạch sẽ, +năng lượng)','','pri')}${btn('pee','Tè lén một tí 🤫')}</div>
  <p class="muted">Tè vào bể sẽ bẩn người (-${SD.POOL.pee.clean} sạch sẽ). Ai đang bơi cùng có thể báo chủ homestay, bạn bị phạt ${fmt(SD.POOL.pee.fine)}.</p>`);
ACT.poolswim=()=>{ UI.closeAll(); GAME.act({t:'swim'}); };
ACT.pee=async()=>{ UI.closeAll(); const r=await GAME.act({t:'pee'}); if(r.err) return; GAME.toast(r.seen?`Ối... có ${r.seen} người đang bơi cùng thấy rồi!`:'Không ai thấy... chắc thế','lock'); };
UI.peeSeen=m=>{ GAME.sfx('blip',.4); quickAsk(`<b>${esc(m.name)}</b> vừa tè vào bể bơi! Báo chủ homestay phạt ${fmt(SD.POOL.pee.fine)}?`,yes=>{ if(yes) GAME.act({t:'report',id:m.id}).then(r=>{ if(!r.err&&r.msg) GAME.toast(esc(r.msg),'quest'); }); },20); };
// thành tích (thành tích ẩn chỉ hiện tên khi mở khoá)
UI.ach=()=>open('Thành tích',()=>{ const a=G().ach||{}, s=G().stats||{};
  return `<div class="list">${Object.entries(SD.ACH).map(([k,A])=>{ const ok=a[k], v=A.stat==='money'?G().money:s[A.stat]||0;
    return `<div class="row"><span><b>${ok||!A.hidden?esc(A.name):'??? (thành tích ẩn)'}</b><br><small class="muted">${ok||!A.hidden?esc(A.desc):'Tự khám phá nhé'}</small></span><span>${ok?'đã mở':A.hidden?'':Math.min(v,A.n).toLocaleString('vi-VN')+'/'+A.n.toLocaleString('vi-VN')}</span><span>+${A.exp} EXP</span></div>`; }).join('')}</div>`; });
PLACE.quanao=()=>{ open('Shop Chande · Chị Mai',()=>money()+outfitHtml(true),{wide:true}); startPreview(); };
PLACE.letan=()=>open('Lễ tân 24h · Nhà Rếch 2',()=>{ const g=G(), st=g.stay, d=SD.vnTime(NET.now()).day;
  return money()+`<p>${st?`Bạn đang thuê <b>${SD.ROOMS[st.room].name}</b> ${st.paid===d?'· đã trả hôm nay':'· chưa trả hôm nay'}. Mỗi ngày tự trừ tiền khi sang ngày mới.`:'Bạn chưa thuê phòng. Mỗi người thuê 1 phòng, tiền trả theo ngày.'}${g.flags.rented?'':' <b>Ngày đầu Pháp bao 100.000đ.</b>'}</p>
  <div class="list">${Object.entries(SD.ROOMS).filter(([k,r])=>!r.home).map(([k,r])=>`<div class="row tall"><span><b>${r.name}</b> · ${r.where}<br><small class="muted">${r.desc}</small><br><small>Nghỉ +${r.rest} năng lượng${r.buff?` · ngủ ngon +${Math.round((r.buff.mul-1)*100)}% EXP`:''} · wifi ×${r.wifi} · ảnh ×${r.view}</small></span><span>${fmt(r.price)}/ngày</span>${st&&st.room===k?'<em>đang ở</em>':btn('rent','Thuê',{k},'pri')}</div>`).join('')}</div>
  ${st?btn('checkout','Trả phòng',{},'bad'):''}<p class="muted">Có thể gõ cửa phòng người khác (họ phải đang ở trong và đồng ý), xin ngủ lại để dùng giường, nhà tắm, ổ sạc.</p>`; },{wide:true});
ACT.rent=d=>req({t:'rent',room:d.k}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); }); ACT.checkout=()=>quickAsk('Trả phòng luôn? Tiền phòng hôm nay không hoàn lại.',y=>{ if(y) req({t:'rent',op:'checkout'}); },20);   // nút đỏ viền: hỏi lại trước khi làm

/* ---------- cửa phòng: vào phòng mình / gõ cửa ---------- */
UI.roomDoor=async room=>{ const g=G();
  if(g.stay&&g.stay.room===room){ await GAME.act({t:'enterRoom'}); return; }
  const r=await GAME.act({t:'knock',room}); if(r.err) return;
  open('Gõ cửa '+SD.ROOMS[room].name,()=>r.list.length?`<p>Ai đang ở trong:</p><div class="list">${r.list.map(p=>`<div class="row"><span>${esc(p.n)}</span>${btn('knock','Gõ cửa',{room,to:p.id},'pri')}</div>`).join('')}</div>`:'<p class="muted">Không có ai trong phòng nào ở nhà này. Muốn ở thì thuê ở lễ tân Nhà Rếch 2.</p>',{static:true}); };
ACT.knock=async d=>{ const r=await GAME.act({t:'knock',room:d.room,to:+d.to}); if(!r.err){ GAME.toast('Cốc cốc... đợi chủ phòng mở cửa','item'); UI.closeAll(); } };

/* ---------- điện thoại trong phòng ---------- */
UI.phone=()=>open('Điện thoại',()=>{ const g=G(), S=GAME.S, own=S.kind==='room'||S.own, d=g.daily, R=SD.ROOM_ACTS;
  return `<p>Pin: <b>${Math.round(g.needs.battery)}%</b> · TikTok ${d.tiktok}/${R.tiktok.daily} · sống ảo ${d.posts}/${R.songao.daily} hôm nay</p><div class="col">
    ${own?btn('ra','Lướt TikTok (+EXP, -'+R.tiktok.battery+'% pin)',{act:'tiktok'}):'<p class="muted">Lướt TikTok, up ảnh: về phòng mới làm được.</p>'}${btn('lo','Xem phim người lớn 🔞 (giải toả)')}
    ${g.photos.map((p,i)=>btn('post',`Up ảnh "${esc(p.name)}" (×${p.mul})`,{i})).join('')||'<p class="muted">Chưa có ảnh. Bấm P để chụp (ở đây hoặc chỗ đẹp ngoài trời).</p>'}
    ${S.kind==='stay'&&!own?btn('sleepask','Xin ngủ lại đêm nay'):''}${own?btn('hub','Mở chợ online / học / chat'):''}</div>${simHtml()}`; });
let SIMBOOK=null;
function simHtml(){ const g=G(), V=SD.VNPT; if(!g.sim) return `<h5>📱 SIM</h5><p class="muted">Chưa có SIM. Mua SIM ở VNPT (Hà Nội) để nhắn tin, gọi bạn bè, số đẹp còn có lộc riêng.</p>`;
  if(!SIMBOOK){ SIMBOOK=[]; NET.req({t:'who'}).then(r=>{ SIMBOOK=(r.list||[]).filter(w=>w.sim&&w.id!==NET.pid); UI.refresh(); setTimeout(()=>{ SIMBOOK=null; },20000); }); }
  return `<h5>📱 SIM ${esc(g.sim.num)} · ${esc(g.sim.cat)}</h5><p class="good">✨ ${esc((V.simPerks[g.sim.cat]||{}).desc||'')}</p><input id="smsText" maxlength="80" placeholder="Nội dung tin nhắn (${fmt(V.sms.price)}/tin)" style="width:100%;font:18px var(--f);padding:4px 8px">
    <div class="list">${(SIMBOOK||[]).map(w=>`<div class="row"><span><b>${esc(w.n)}</b> <small class="muted">${esc(w.sim)} · ${esc((w.where||'').split(' (')[0])}</small></span><span>${btn('smsto','✉ Nhắn',{to:w.sim})} ${btn('ringto','📞 Gọi',{to:w.sim})}</span></div>`).join('')||'<p class="muted">Chưa có ai có SIM đang online.</p>'}</div>
    <div class="col"><input id="smsNum" maxlength="16" placeholder="Hoặc nhập số máy..." style="font:18px var(--f);padding:4px 8px">${btn('smsnum','✉ Nhắn số này')} ${btn('ringnum','📞 Gọi số này')}</div>`; }
ACT.smsto=d=>GAME.act({t:'sms',to:d.to,msg:(document.getElementById('smsText')||{}).value||''}).then(r=>{ if(r&&!r.err){ GAME.toast(esc(r.msg),'item'); const i=document.getElementById('smsText'); if(i) i.value=''; } });
ACT.ringto=d=>GAME.act({t:'ring',to:d.to}).then(r=>{ if(r&&!r.err) GAME.toast('📞 '+esc(r.msg),'item'); });
ACT.smsnum=()=>ACT.smsto({to:(document.getElementById('smsNum')||{}).value||''}); ACT.ringnum=()=>ACT.ringto({to:(document.getElementById('smsNum')||{}).value||''});
ACT.ra=d=>{ UI.closeAll(); GAME.startRoomAct(d.act,undefined,d.act==='tiktok'?GAME.bedSpot():undefined); };   // lướt TikTok thì nằm lên giường
ACT.post=d=>{ UI.closeAll(); GAME.act({t:'ra',act:'songao',photo:+d.i}); };
ACT.sleepask=async()=>{ const r=await GAME.act({t:'sleepAsk'}); if(!r.err) GAME.toast('Đã xin, đợi chủ phòng trả lời','item'); };
ACT.hub=()=>UI.hub();

/* ---------- laptop ở phòng: chợ online, học kỹ năng, chat online, làm remote ---------- */
let hubTab='market', market=[], who=[], ochLog=[];
UI.hub=()=>{ open('Laptop',()=>hubHtml(),{wide:true}); loadMarket(); };
UI.learn=()=>{ hubTab='learn'; UI.hub(); };   // mở thẳng tab Học kỹ năng
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
  if(hubTab==='work') body=workHtml(true)+'<h5>Lumen Studio (remote)</h5>'+lumenHtml(true);
  return `<div class="tabs">${tabs.map(([k,n])=>`<button class="tab ${k===hubTab?'on':''}" data-a="tab" data-k="${k}">${n}</button>`).join('')}</div>${body}`; }
ACT.tab=d=>{ hubTab=d.k; if(d.k!=='work') loadMarket(); draw(); };
ACT.mkbuy=async d=>{ const r=await GAME.act({t:'mk',op:'buy',id:+d.id}); if(!r.err) GAME.toast('Đã mua','item'); loadMarket(); };
ACT.mkcancel=async d=>{ await GAME.act({t:'mk',op:'cancel',id:+d.id}); loadMarket(); };
ACT.mksell=async()=>{ const r=await GAME.act({t:'mk',op:'sell',item:$('#mkItem').value,n:+$('#mkN').value,price:+$('#mkP').value}); if(!r.err) GAME.toast('Đã đăng bán','item'); loadMarket(); };
/* ---------- cửa hàng online (nút bên phải, phím C): xem + mua đồ mọi người đang đăng bán ở bất cứ đâu; đăng bán / gỡ món vẫn ở laptop trong phòng ---------- */
let shopQ='', shopSort='new';
UI.shop=()=>{ open('Cửa hàng online',()=>shopHtml(),{wide:true}); loadMarket(); };
function shopHtml(){ const q=shopQ.trim().toLowerCase(), nm=l=>SD.ITEMS[l.item]?SD.ITEMS[l.item].name:l.item, mine=market.filter(l=>l.mine);
  const L=market.filter(l=>!l.mine&&(!q||nm(l).toLowerCase().includes(q)||String(l.s).toLowerCase().includes(q)));
  if(shopSort==='cheap') L.sort((a,b)=>a.price-b.price); else if(shopSort==='dear') L.sort((a,b)=>b.price-a.price);
  const sorts=[['new','Mới đăng'],['cheap','Rẻ nhất'],['dear','Đắt nhất']], each=l=>l.n>1?`<small class="muted">· ${fmt(Math.round(l.price/l.n))}/cái</small>`:'';
  return money()+`<div class="form"><input id="shopQ" maxlength="30" value="${esc(shopQ)}" placeholder="Tìm tên món hoặc người bán..." aria-label="Tìm">${btn('shopq','Tìm','','pri')}${shopQ?btn('shopq','Xoá tìm',{clear:1}):''}</div>
    <div class="tabs">${sorts.map(([k,n])=>`<button class="tab ${k===shopSort?'on':''}" data-a="shopsort" data-k="${k}">${n}</button>`).join('')}</div>
    <h5>Đang bán (${L.length})</h5><div class="list">${L.map(l=>`<div class="row">${ico(l.item)}<span>${esc(nm(l))} ×${l.n} <small class="muted">của ${esc(l.s)}</small></span><span>${fmt(l.price)} ${each(l)}</span>${btn('mkbuy','Mua',{id:l.id},G().money>=l.price?'pri':'')}</div>`).join('')||`<p class="muted">${q?'Không thấy món nào khớp':'Chưa ai bán gì'}</p>`}</div>
    ${mine.length?`<h5>Bạn đang bán (${mine.length}/${SD.MARKET.maxListings})</h5><div class="list">${mine.map(l=>`<div class="row">${ico(l.item)}<span>${esc(nm(l))} ×${l.n}</span><span>${fmt(l.price)}</span></div>`).join('')}</div>`:''}
    <p class="muted">Mua ở đâu cũng được, đồ vào túi ngay. Muốn đăng bán / gỡ món thì mở laptop trong phòng thuê (phí sàn ${SD.MARKET.fee*100}%).</p>`; }
ACT.shopq=d=>{ shopQ=d.clear?'':(($('#shopQ')||{}).value||''); draw(); };
ACT.shopsort=d=>{ shopSort=d.k; draw(); };
ACT.learn=async d=>{ const r=await GAME.act({t:'learn',skill:d.k}); if(!r.err){ UI.closeAll(); } };
ACT.och=async()=>{ const m=$('#ochIn').value.trim(); if(!m) return; const to=$('#ochTo').value; const r=await GAME.act({t:'och',m,to:to?+to:0}); if(!r.err) $('#ochIn').value=''; };
inner.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'&&e.target.id==='ochIn') ACT.och(); if(e.key==='Escape'){ e.target.blur(); } });
UI.och=m=>{ ochLog.push(m); if(ochLog.length>40) ochLog.shift(); if(cur&&cur.t==='Laptop'&&hubTab==='chat'){ draw(); const L=$('#ochLog'); if(L) L.scrollTop=L.scrollHeight; } else if(m.fid!==NET.pid) GAME.toast(`<b>${esc(m.from)}</b>${m.dm?' (nhắn riêng)':''}: ${esc(m.m)}`,'quest'); };

/* ---------- Everfit ---------- */
const WD=['CN','T2','T3','T4','T5','T6','T7'];
function workHtml(remote){ const j=G().extra&&G().extra.job; if(!j||!j.hired) return '<p class="muted">Bạn chưa làm ở Everfit. Tới văn phòng Everfit (Grab) gặp chị Vy ở quầy lễ tân để nộp đơn (giải câu đố vui).</p>';
  const t=j.today; if(!t.workday) return '<p>Hôm nay cuối tuần, Everfit nghỉ. Đi chơi thôi!</p>';
  return `<p>Hôm nay: <b>${t.remote?'làm remote (laptop ở phòng)':'làm ở văn phòng'}</b> · ${t.inHours?'trong giờ làm':`ngoài giờ (${SD.JOB.hours[0]}:00–${SD.JOB.hours[1]}:00)`}</p><div class="list">${t.tasks.map(k=>{ const w=SD.WORK_TASKS[k], done=t.done.includes(k);
    return `<div class="row"><span>${esc(w.name)} <small class="muted">${w.where==='desk'?'bàn làm việc':SD.OFFICE.spots[w.where].name} · +${w.exp} EXP</small></span><span>${done?'xong':''}</span>${done?'':(remote&&t.remote)?btn('work','Làm',{k},'pri'):''}</div>`; }).join('')}</div>
    <p class="muted">Lương tích luỹ: <b>${fmt(j.accrued)}</b> · ngày lương tới: ${j.nextPay} · remote: ${j.remote.map(d=>WD[d]).join(', ')}</p>`; }
// làm task: task ở bàn phải gõ đúng 3 từ khoá sản phẩm Everfit trước (mini game), task khác làm luôn
ACT.work=async d=>{ const w=SD.WORK_TASKS[d.k]; if(w.where==='desk'&&!d.typed) return typing(d.k,d.ot); const r=await GAME.act({t:'job',op:'do',task:d.k,ot:!!d.ot}); if(!r.err) UI.closeAll(); };
ACT.otwork=d=>ACT.work({k:d.k,ot:1});
let typ=null;
function typing(task,ot){ const ws=[...SD.WORK_WORDS].sort(()=>Math.random()-.5).slice(0,3); typ={task,ot,ws,i:0,t0:performance.now()};
  open(SD.WORK_TASKS[task].name,()=>`<p>Gõ đúng từ khoá rồi Enter (${typ.i+1}/3):</p><h5 style="font-size:30px;text-align:center">${esc(typ.ws[typ.i])}</h5><div class="form"><input id="typIn" autocomplete="off" aria-label="Gõ từ khoá"></div><p id="typMsg" class="muted"></p>`,{static:true});
  setTimeout(()=>{ const i=$('#typIn'); if(i) i.focus(); },30); }
inner.addEventListener('keydown',e=>{ if(e.target.id!=='typIn'||e.key!=='Enter'||!typ) return; const v=e.target.value.trim().toLowerCase();
  if(v!==typ.ws[typ.i]){ $('#typMsg').textContent='Sai chính tả rồi, gõ lại'; e.target.value=''; return; }
  typ.i++; if(typ.i<3){ const task=typ.task; draw(); setTimeout(()=>{ const i=$('#typIn'); if(i) i.focus(); },20); return; }
  const task=typ.task, ot=typ.ot; typ=null; ACT.work({k:task,typed:1,ot}); });
UI.work=(where,it)=>{ const j=G().extra&&G().extra.job; if(!j||!j.hired){ GAME.toast('Bạn chưa làm ở Everfit. Gặp chị Vy ở quầy lễ tân','lock'); return; }
  const t=j.today, h=SD.vnTime(NET.now()).hf;
  if(where==='desk'&&t.ot&&!t.otDone&&h>=SD.JOB.ot.from&&h<SD.JOB.ot.to){ if(it&&it.desk!==j.desk){ GAME.toast(`Bàn của bạn là bàn số ${j.desk+1}`,'lock'); return; }
    return open('OT tối nay',()=>`<p>Sếp xếp OT: <b>${esc(SD.WORK_TASKS[t.ot].name)}</b> · lương ×${SD.JOB.ot.pay}</p>${btn('otwork','Làm OT',{k:t.ot},'pri')}`); }
  const list=t.tasks.filter(k=>!t.done.includes(k)&&(where==='desk'?SD.WORK_TASKS[k].where==='desk':SD.WORK_TASKS[k].where===where));
  if(where==='desk'&&it&&it.desk!==j.desk){ GAME.toast(`Bàn của bạn là bàn số ${j.desk+1}`,'lock'); return; }
  if(!list.length){ GAME.toast(t.workday?'Chỗ này không còn việc hôm nay':'Cuối tuần nghỉ','lock'); return; }
  open('Việc sếp giao',()=>`<div class="list">${list.map(k=>`<div class="row"><span>${esc(SD.WORK_TASKS[k].name)}</span>${btn('work','Làm',{k},'pri')}</div>`).join('')}</div>`); };
PLACE.hr=()=>open('Everfit · Chị Vy (HR)',()=>{ const j=G().extra&&G().extra.job;
  if(!j||!j.hired) return `<p>Everfit làm nền tảng cho huấn luyện viên fitness: AI Workout Builder, thực đơn MacroSnap, habit tracking, nhắn tin 1-1, app gắn thương hiệu riêng.</p>
    <p>Đang có <b>${j?j.count:'?'}/${SD.JOB.max}</b> nhân viên. Lương ${fmt(SD.JOB.wage)}/ngày làm đủ task, trả ${SD.JOB.payEvery} ngày/lần. Thứ Bảy, Chủ Nhật nghỉ, 2 ngày remote.</p>${btn('apply','Nộp đơn + phỏng vấn','', 'pri')}`;
  return `<p>Bạn là nhân viên Everfit từ ${j.since} · bàn số ${j.desk+1}.</p><h5>Chọn 2 ngày làm remote</h5><div class="days">${[1,2,3,4,5].map(d=>`<label><input type="checkbox" class="rday" value="${d}" ${j.remote.includes(d)?'checked':''}> ${WD[d]}</label>`).join('')}</div>${btn('remote','Lưu lịch remote')}
    ${workHtml(false)}<p>${btn('quit','Nghỉ việc',{},'bad')}</p>`; },{wide:true});
// phỏng vấn = giải câu đố vui có hình minh hoạ (vẽ pixel ngay trong trình duyệt)
let quiz=null;
ACT.apply=async()=>{ const r=await GAME.act({t:'job',op:'apply'}); if(r.err) return; if(r.skip){ UI.refresh(); return; } quiz={qs:r.questions,pass:r.pass,i:0,ans:[]}; showQuiz(); };
function showQuiz(){ const q=quiz.qs[quiz.i];
  open(`Phỏng vấn Everfit · câu ${quiz.i+1}/${quiz.qs.length}`,()=>`<p class="muted">Đúng từ ${quiz.pass}/${quiz.qs.length} câu là đỗ.</p><canvas id="quizPic" width="160" height="96"></canvas><h5>${esc(q.q)}</h5>
    <div class="col">${q.a.map((a,k)=>btn('qa',esc(a),{k})).join('')}</div>`,{static:true}); setTimeout(()=>drawPic($('#quizPic'),q.pic),0); }
ACT.qa=async d=>{ quiz.ans.push(+d.k); quiz.i++; if(quiz.i<quiz.qs.length) return showQuiz();
  const r=await GAME.act({t:'job',op:'answer',answers:quiz.ans}); quiz=null; if(r.err) return; UI.closeAll();
  GAME.toast(r.passed?`Đỗ phỏng vấn (${r.ok}/${r.total})! Chào mừng tới Everfit`:`Trượt rồi (đúng ${r.ok}/${r.total}). 10 phút nữa nộp lại`,r.passed?'quest':'lock'); };
// hình minh hoạ câu đố
function drawPic(c,id){ if(!c) return; const g=c.getContext('2d'), P=ART.painter(g), ink='#1c1516'; g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,160,96);
  const line=(x0,y0,x1,y1,w=2,col=ink)=>{ const n=Math.ceil(Math.hypot(x1-x0,y1-y0)); for(let i=0;i<=n;i++) P.rect(Math.round(x0+(x1-x0)*i/n-w/2),Math.round(y0+(y1-y0)*i/n-w/2),w,w,col); };
  const txt=(t,x,y,size=20,col=ink)=>{ g.font=`${size}px VT323, monospace`; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=col; g.fillText(t,x,y); };
  const apple=(x,y)=>{ P.disc(x,y,6,ink); P.disc(x,y,5,'#d9463a'); P.rect(x-1,y-9,2,4,'#6b4a2f'); P.rect(x+1,y-9,4,2,'#5fae46'); P.px(x-2,y-2,'#f4a0a0'); };
  const banana=(x,y)=>{ for(let k=-6;k<=6;k++){ const yy=y+Math.round(k*k/9); P.rect(x+k-1,yy-2,3,5,ink); } for(let k=-5;k<=5;k++){ const yy=y+Math.round(k*k/9); P.rect(x+k,yy-1,2,3,'#f2c43d'); } };
  const clock=(cx,cy,h,m,r=28)=>{ P.disc(cx,cy,r+2,ink); P.disc(cx,cy,r,'#fbfaf6'); for(let k=0;k<12;k++){ const a=k/12*6.283; P.rect(Math.round(cx+Math.sin(a)*(r-4))-1,Math.round(cy-Math.cos(a)*(r-4))-1,2,2,ink); }
    const ah=(h%12+m/60)/12*6.283, am=m/60*6.283; line(cx,cy,cx+Math.sin(ah)*r*.5,cy-Math.cos(ah)*r*.5,3); line(cx,cy,cx+Math.sin(am)*r*.8,cy-Math.cos(am)*r*.8,2,'#c4382e'); P.disc(cx,cy,2,ink); };
  if(id==='tamgiac'){ line(80,8,20,88); line(80,8,140,88); line(20,88,140,88); line(80,8,80,88); line(50,48,110,48); }
  if(id==='vuong'){ for(const k of [0,40,80]){ line(40+k,8,40+k,88); line(40,8+k,120,8+k); } }
  if(id==='traicay'){ const row=(y,a,b,res)=>{ a(30,y); txt('+',50,y); b(70,y); txt('=',92,y); txt(res,120,y,22,res==='?'?'#c4382e':ink); };
    row(18,apple,apple,'10'); row(48,apple,banana,'8'); row(78,banana,banana,'?'); }
  if(id==='dayhinh'){ const sh=['o','s','t','o','s','?']; sh.forEach((k,i)=>{ const x=14+i*26, y=48;
    if(k==='o'){ P.disc(x,y,9,ink); P.disc(x,y,7,'#3f6e9a'); } if(k==='s'){ P.rect(x-9,y-9,18,18,ink); P.rect(x-7,y-7,14,14,'#5aa84a'); }
    if(k==='t'){ for(let r=0;r<16;r++) P.rect(x-Math.round(r/2)-1,y-8+r,Math.round(r)+2,1,ink); for(let r=2;r<14;r++) P.rect(x-Math.round(r/2)+1,y-7+r,Math.round(r)-2,1,'#f2c43d'); }
    if(k==='?'){ P.rect(x-10,y-10,20,20,ink); P.rect(x-8,y-8,16,16,'#fbfaf6'); txt('?',x,y,22,'#c4382e'); } }); }
  if(id==='dayso'){ ['2','4','8','16','?'].forEach((n,i)=>{ const x=20+i*30; P.rect(x-12,36,24,24,ink); P.rect(x-10,38,20,20,n==='?'?'#fbfaf6':'#ffd84a'); txt(n,x,48,20,n==='?'?'#c4382e':ink); }); }
  if(id==='dongho') clock(80,48,3,0,34);
  if(id==='guong'){ clock(42,48,9,0,26); P.rect(92,10,58,76,ink); P.rect(95,13,52,70,'#cfe8f2'); P.rect(98,16,10,30,'#ffffff'); txt('gương',121,92,14); txt('?',121,48,30,'#3f6e9a'); }
  if(id==='cua'){ P.disc(80,58,18,ink); P.disc(80,58,16,'#d9463a'); for(const s of [-1,1]){ P.disc(80+s*34,30,12,ink); P.disc(80+s*34,30,10,'#e05a4a'); P.rect(80+s*34-(s<0?10:0),22,10,4,'#f3ecdc'); line(80+s*14,50,80+s*30,38,4);
      for(let k=0;k<3;k++) line(80+s*14,62+k*5,80+s*30,70+k*7,3); } P.rect(72,48,4,4,ink); P.rect(84,48,4,4,ink); }
  if(id==='banchan'){ for(const [x,y,f] of [[52,64,1],[76,40,-1],[100,64,1],[124,40,-1]]){ P.disc(x,y,7,'#b97a58'); P.rect(x-5,y-12,10,10,'#b97a58'); for(let k=0;k<5;k++) P.disc(x-6+k*3,y-16,1+(k===0?1:0),'#b97a58'); } }
  if(id==='lich'){ P.rect(40,8,80,80,ink); P.rect(42,10,76,76,'#fbfaf6'); P.rect(42,10,76,18,'#c4382e'); txt('THÁNG ?',80,19,16,'#fbfaf6');
    for(let i=0;i<28;i++){ const x=48+(i%7)*10, y=34+Math.floor(i/7)*12; P.rect(x,y,7,8,i===27?'#ffd84a':'#e4ddd0'); } txt('28',104,80,16,'#c4382e'); }
  if(id==='ten'){ P.rect(20,18,120,60,ink); P.rect(22,20,116,56,'#fbfaf6'); P.rect(22,20,116,20,'#3f6e9a'); txt('XIN CHÀO, TÔI LÀ',80,30,15,'#fbfaf6'); txt('. . . . . . .',80,58,20); }
  if(id==='taotay'){ apple(40,40); apple(64,40); apple(88,40); P.rect(104,52,40,16,'#e8a882'); P.rect(104,52,40,2,ink); P.rect(104,66,40,2,ink); apple(116,60); apple(134,60); txt('lấy đi 2',80,84,16); }
  if(id==='ao'){ P.rect(40,22,80,64,ink); P.rect(42,24,76,60,'#f2a6b8'); P.rect(20,22,24,24,ink); P.rect(22,24,22,20,'#f2a6b8'); P.rect(116,22,24,24,ink); P.rect(116,24,22,20,'#f2a6b8'); P.disc(80,24,10,ink); P.disc(80,23,8,'#f3ecdc'); line(68,18,92,18,2,'#c4382e'); txt('cổ',80,8,14,'#c4382e'); }
  if(id==='convat'){ const sp=[ART.cow(0),ART.chicken(0),ART.pig(0)]; sp.forEach((s,i)=>g.drawImage(s.c,16+i*36,30,s.c.width*1.1,s.c.height*1.1)); g.drawImage(ART.icon('fish',3),120,28); } }
ACT.remote=()=>req({t:'job',op:'remote',days:[...document.querySelectorAll('.rday:checked')].map(e=>+e.value)});
ACT.quit=()=>quickAsk('Nghỉ việc thật à? Trong hôm nay sẽ <b>không xin lại được</b>.',y=>{ if(y) req({t:'job',op:'quit'}); },20);
const COWORK={minh:['Coach dùng AI Workout Builder dựng giáo án nhanh lắm, tao đang làm phần kéo thả bài tập.','Bug MacroSnap tuần này là ghi nhầm calo bữa phụ. Fix mãi.'],
  ha:['Màn Habit tracking tao đang vẽ lại cho dễ tích mỗi ngày.','App gắn thương hiệu (branded app) thì mỗi coach đổi được logo, màu riêng.'],
  quan:['Trước mỗi lần release tao test cả iOS lẫn Android. Đừng push bug lúc 5 giờ chiều nhé.','Pantry có cà phê miễn phí, mỗi ngày làm 1 cốc cho tỉnh.'],
  thao:['Coach hay hỏi về nhắn tin 1-1 với học viên, trả lời ticket là việc của tao.','Mệt thì ra sofa ngả lưng chút, sếp không trách đâu.']};
PLACE.cowork=n=>{ const L=COWORK[n.id]||['Chào bạn!']; GAME.say([[n.id,L[Math.floor(Math.random()*L.length)]]]); };
PLACE.sep=()=>open('Anh Khoa · sếp Everfit',()=>workHtml(false)+'<p class="muted">Ra đúng chỗ (bàn của bạn, bàn họp, phòng sếp, pantry, tường cây xanh) rồi bấm E để làm.</p>');

/* ---------- vườn ---------- */
UI.plot=id=>{ const p=GAME.PLOTS[id];
  if(!p&&id[0]==='d'){ const L=G().land; if(!L||L.paid!==SD.vnTime(NET.now()).day){ open('Ô đất của nông trại',()=>`<p>Muốn trồng ở nông trại phải thuê đất của bác Trang trước (trả theo ngày, mảnh càng nhiều ô càng đắt).</p>${goBtn('bactrang','nhà bác Trang')}`); return; } }
  if(!p){ const kind=id[0]==='k'?'ke':SD.DALAT.plots[+id.slice(1)].kind, seeds=Object.entries(SD.CROPS).filter(([k,c])=>id[0]==='k'?!c.map:c.kind===kind).filter(([k])=>G().items['hat_'+k]);
    open('Ô đất trống',()=>seeds.length?`<div class="list">${seeds.map(([k,c])=>`<div class="row">${ico('hat_'+k)}<span>${esc(c.plant||'Gieo')} ${esc(c.name.toLowerCase())} <small class="muted">${Math.round(c.grow/6)/10} phút</small></span><span>có ${G().items['hat_'+k]}</span>${btn('plant','Trồng',{id,k},'pri')}</div>`).join('')}</div>`:
      `<p class="muted">Chưa có hạt giống hợp ô này. ${id[0]==='k'?'Mua ở tiệm nông sản cô Ké (ngay cổng).':'Mua ở chỗ bác Trang (nhà phía Bắc nông trại).'}</p>${id[0]==='k'?goBtn('coke','tiệm cô Ké'):goBtn('bactrang','nhà bác Trang')}`); return; }
  const c=SD.CROPS[p.c], st=GAME.plotState(id,p), mine=p.o===NET.pub;
  if(st==='growing'){ GAME.toast(`${c.name} · ${mine?'của bạn':esc(p.n)} · còn ${Math.ceil((p.at+c.grow*1000-NET.now())/1000)} giây`,'item'); if(mine&&c.regrow) open(c.name,()=>btn('clear','Chặt bỏ cây',{id})); return; }
  GAME.act({t:'harvest',id}).then(r=>{ if(r.err) return; GAME.sfx('item_pickup',.6);
    GAME.toast(r.stole?`Cướp được <b>${r.n} ${esc(c.name.toLowerCase())}</b> của ${esc(p.n)}!`:`Thu <b>${r.n} ${esc(c.name.toLowerCase())}</b> · +${r.exp} EXP`+(r.stolen?` · bị ${esc(r.by)} cướp mất ${r.stolen}`:''),r.stole?'lock':'vnd'); }); };
ACT.plant=async d=>{ const r=await GAME.act({t:'plant',id:d.id,crop:d.k}); if(!r.err){ GAME.sfx('item_pickup',.4); UI.closeAll(); } };
ACT.clear=async d=>{ await GAME.act({t:'clearPlot',id:d.id}); UI.closeAll(); };

/* ---------- Đà Lạt: bác Trang, trại, ngựa, chợ, nấu ăn ---------- */
// thuê đất: chọn khu (rau, hoa, nhà kính, cà phê, cây ăn quả, cao su) rồi chọn cỡ mảnh; bác Trang cắm biển tên người thuê
let landField='rau';
const landHtml=()=>{ const L=G().land, d=SD.vnTime(NET.now()).day, F=SD.DALAT.fields, lands=GAME.lands||[], taken=k=>lands.filter(l=>l.field===k&&l.n!==G().name).reduce((a,l)=>a+l.plots.length,0), tot=k=>SD.DALAT.plots.filter(p=>p.kind===k).length;
  if(L&&L.own){ const t=SD.DL_LAND.find(x=>x.id===L.tier); return `<h5>Đất của bạn</h5><p>Đã mua đứt <b>${esc(t.name)}</b> (${t.plots} ô) ở khu <b>${esc(F[L.field]||L.field)}</b>: không phải trả tiền thuê.</p>${btn('landsell',`Bán lại cho bác Trang · +${fmt(t.sellBack)}`)}`; }
  return `<h5>Thuê đất (trả theo ngày) hoặc mua đứt</h5><p class="muted">${L&&L.paid===d?`Đang thuê <b>${SD.DL_LAND.find(x=>x.id===L.tier).name}</b> ở khu <b>${esc(F[L.field]||L.field||'?')}</b>, đã trả hôm nay. Biển tên bạn cắm ở góc mảnh.`:'Chưa thuê đất: chưa trồng được ở nông trại.'}</p>
  <div class="tabs">${Object.entries(F).map(([k,n])=>btn('landfield',`${n} · còn ${tot(k)-taken(k)}/${tot(k)} ô`,{k},landField===k?'pri':'')).join('')}</div>
  <div class="list">${SD.DL_LAND.map(t=>`<div class="row"><span><b>${t.name}</b> · ${t.plots} ô ở khu ${esc(F[landField])}</span><span>${fmt(t.price)}/ngày</span>${L&&L.tier===t.id&&L.field===landField&&L.paid===d?'<em>đang thuê</em>':btn('land','Thuê',{t:t.id},'pri')}${btn('landbuy',`Mua đứt ${fmt(t.buy)}`,{t:t.id})}</div>`).join('')}</div>${L?btn('landcancel','Trả đất'):''}
  <p class="muted">Mua đứt = 30 ngày tiền thuê, không bị trừ tiền hằng ngày; cần tiền thì bán lại cho bác Trang 70% giá mua.</p>`; };
ACT.landfield=d=>{ landField=d.k; draw(); };
ACT.land=d=>req({t:'land',op:'rent',tier:d.t,field:landField}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); });
ACT.landbuy=d=>{ const t=SD.DL_LAND.find(x=>x.id===d.t); if(confirm(`Mua đứt ${t.name} ở khu ${SD.DALAT.fields[landField]||landField} giá ${fmt(t.buy)}?`)) req({t:'land',op:'buy',tier:d.t,field:landField}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); }); };
ACT.landsell=()=>{ if(confirm('Bán lại mảnh đất cho bác Trang (70% giá mua)? Cây đang trồng vẫn thu hoạch được.')) req({t:'land',op:'sell'}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'vnd'); }); };
ACT.landcancel=()=>{ if(confirm('Trả lại mảnh đất? Cây đang trồng vẫn thu hoạch được.')) req({t:'land',op:'cancel'}); };
PLACE.bactrang=()=>open('Bác Trang · chủ nông trại',()=>money()+landHtml()+`<p class="muted">Ô rau, hoa, dâu tây trồng 1 lần thu 1 lần. Cà phê, bơ, hồng, cao su (cần học Làm vườn lâu năm) thu được nhiều lần.</p>
  <h5>Hạt giống, cây giống</h5>${seedHtml('dalat')}`+sellHtml(Object.keys(SD.SELL),'Bác Trang thu mua mọi nông sản'),{wide:true});
PLACE.barn=()=>open('Trại chăn nuôi · Chú Sáu',()=>{ const g=G(), now=NET.now();
  return money()+(g.skills.channuoi?'':'<p class="bad">Cần học Chăn nuôi (laptop ở phòng)</p>')+`<h5>Con giống</h5><div class="list">${Object.entries(SD.ANIMALS).map(([k,a])=>`<div class="row"><span>${esc(a.name)} <small class="muted">ăn ${SD.FEED[a.feed].name.toLowerCase()} · ${Math.round(a.cycle/60)} phút/lứa${a.feeds?' × '+a.feeds+' lứa':''} → ${a.yield} ${esc(SD.ITEMS[a.product].name.toLowerCase())}</small></span><span>${fmt(a.price)} · có ${g.animals.filter(x=>x.k===k).length}/${a.max}</span>${btn('buyan','Mua',{k},'pri')}</div>`).join('')}</div>
    <h5>Thức ăn</h5><div class="list">${Object.entries(SD.FEED).map(([k,f])=>`<div class="row">${ico(k)}<span>${f.name} <small class="muted">có ${g.items[k]||0}</small></span><span>${fmt(f.price)}</span>${btn('feedbuy','Mua 5',{k,n:5})}</div>`).join('')}</div>${guardHtml()}`; },{wide:true});
ACT.buyan=d=>req({t:'animal',op:'buy',k:d.k}); ACT.feedbuy=d=>req({t:'animal',op:'feedbuy',k:d.k,n:+d.n});
UI.pen=(k,loc)=>open(loc==='ke'?'Sân gà Ké':SD.ANIMALS[k].name,()=>{ const g=G(), now=NET.now(), list=g.animals.map((a,i)=>[a,i]).filter(([a])=>(a.k===k||(k==='lon'&&a.k==='nai'))&&(a.loc==='ke')===(loc==='ke')), A=SD.ANIMALS[k];
  return `<div class="list">${list.map(([a,i],n)=>{ const ready=a.cyc&&now>=a.cyc; const A=SD.ANIMALS[a.k]; return `<div class="row"><span>${esc(A.name)} #${n+1}${A.feeds?` · ${a.fed}/${A.feeds} ${A.birth?'lứa mang thai':'lứa'}`:''}</span><span>${!a.cyc?'đói':ready?'xong lứa':Math.ceil((a.cyc-now)/1000)+' giây'}</span>${!a.cyc?btn('feed','Cho ăn',{i},'pri'):ready?btn('collect',A.feeds&&a.fed+1<A.feeds?'Xong lứa':'Thu',{i},'pri'):''}</div>`; }).join('')||(loc==='ke'?'<p class="muted">Chưa có gà ở sân Ké. Mua gà giống ở tiệm cô Ké.</p>':'<p class="muted">Bạn chưa có con nào. Mua ở trại chú Sáu.</p>'+goBtn('chusau','trại chú Sáu'))}</div>
    ${(()=>{ const hungry=list.filter(([a])=>!a.cyc).map(([,i])=>i), done=list.filter(([a])=>a.cyc&&now>=a.cyc).map(([,i])=>i);   // cho ăn / thu cả đàn 1 lần bấm
      return hungry.length>1||done.length>1?`<div class="col">${hungry.length>1?btn('feedall',`Cho tất cả ăn (${hungry.length} con)`,{is:hungry.join(',')},'pri'):''}${done.length>1?btn('collectall',`Thu tất cả (${done.length})`,{is:done.join(',')},'pri'):''}</div>`:''; })()}
    <p class="muted">Cần ${SD.FEED[A.feed].name.toLowerCase()} (có ${g.items[A.feed]||0}).</p>${k==='lon'&&loc!=='ke'&&g.items.lon_con?`<div class="col"><p>Lợn con trong túi: <b>${g.items.lon_con}</b></p>${btn('release','Thả 1 lợn con vào chuồng',{n:1},'pri')}${g.items.lon_con>1?btn('release',`Thả hết (${g.items.lon_con})`,{n:g.items.lon_con}):''}</div>`:''}${guardBox()}${stealHtml(k,loc)}`; });
ACT.release=d=>req({t:'animal',op:'release',n:+d.n}).then(r=>{ if(!r.err&&r.msg) GAME.toast(esc(r.msg),'item'); });
// vật nuôi nhà người khác đang online (cùng chuồng): trộm 1 con (40%), nhà có chó canh / thuê chó canh thì chó ra tay trước
function stealHtml(k,loc){ const R=SD.PIG_STEAL, grp=k==='lon'?['lon','nai']:[k], here=a=>grp.includes(a.k)&&((a.loc==='ke')===(loc==='ke')), rows=[];
  for(const h of GAME.herds||[]) if(h.pid!==NET.pid) h.a.forEach((a,i)=>{ if(!R.kinds.includes(a.k)||!here(a)) return; const dog=(GAME.dogs||[]).find(d=>d.n===h.n), gp=h.gd&&SD.GUARD.plans[h.gd];
      rows.push(`<div class="row"><span>${esc(SD.ANIMALS[a.k].name)} của <b>${esc(h.n)}</b>${gp?` · 🐕‍🦺 ${esc(gp.name.split(' ·')[0])} canh ${Math.round(gp.block*100)}%`:dog?` · 🐕 ${esc(SD.DOGS[dog.k].name)} canh`:''}</span>${btn('pigsteal','Trộm',{pid:h.pid,i})}</div>`); });
  return `<h5>Vật nuôi nhà người khác</h5><p class="muted">Trộm 1 con: ${Math.round(R.chance*100)}% trót lọt (dắt về chuồng bạn). Bị bắt quả tang thì vào đồn ${R.jail} giây và bồi thường chủ ${fmt(R.comp)}. Nhà có chó canh thì chó sủa đuổi, giống dữ còn cắn đền tiền.</p>`+
    (rows.length?`<div class="list">${rows.join('')}</div>`:'<p class="muted">Chưa có vật nuôi của ai khác đang online ở chuồng này.</p>'); }
// chuồng của mình đang được ai canh: chó nhà nuôi và / hoặc gói chó canh thuê
function guardBox(){ const g=G(), d=g.dog&&SD.DOGS[g.dog.k], gp=g.guard&&g.guard.until>NET.now()&&SD.GUARD.plans[g.guard.k];
  return `<h5>Bảo vệ chuồng của bạn</h5><p class="muted">${gp?`🐕‍🦺 <b>${esc(gp.name)}</b> đang canh (chặn trộm ${Math.round(gp.block*100)}%) tới ${SD.vnTime(g.guard.until).day.split('-').reverse().join('/')}.`:'Chưa thuê chó canh chuồng.'}${d?` Chó nhà: <b>${esc(d.name)}</b> canh cả chuồng.`:''} Thuê thêm ở chú Sáu (trại Đà Lạt) hoặc chú Ba (vườn Ké).</p>`; }
// dịch vụ chó canh chuồng trại (bảng chú Sáu / chú Ba)
function guardHtml(){ const g=G(), gp=g.guard&&g.guard.until>NET.now()&&SD.GUARD.plans[g.guard.k];
  return `<h5>Dịch vụ chó canh chuồng trại</h5><p class="muted">Chó canh hết vật nuôi của bạn: lợn, bò, gà, vịt (cả lúc bạn offline). ${gp?`Đang thuê <b>${esc(gp.name)}</b> tới ${SD.vnTime(g.guard.until).day.split('-').reverse().join('/')}, thuê tiếp là cộng dồn ngày.`:'Chưa thuê.'}</p>
    <div class="list">${Object.entries(SD.GUARD.plans).map(([k,G2])=>`<div class="row ${gp&&g.guard.k===k?'on':''}"><img class="ico dogi" src="${dogIco(G2.dog)}" alt=""><span><b>${esc(G2.name)}</b><br><small class="muted">Chặn trộm ${Math.round(G2.block*100)}%${G2.bite?` · cắn kẻ trộm đền ${fmt(G2.bite)}`:''}</small></span><span>${fmt(G2.price)}</span>${btn('guard','Thuê',{k},'pri')}</div>`).join('')}</div>`; }
ACT.guard=d=>req({t:'animal',op:'guard',k:d.k}).then(r=>{ if(!r.err&&r.msg) GAME.toast(esc(r.msg),'quest'); });
ACT.pigsteal=d=>req({t:'animal',op:'steal',pid:+d.pid,i:+d.i}).then(r=>{ if(!r.err&&r.msg) GAME.toast(esc(r.msg),r.ok?'vnd':'lock'); });
ACT.feed=d=>req({t:'animal',op:'feed',i:+d.i});
ACT.feedall=async d=>{ let n=0, err=''; for(const i of String(d.is).split(',')){ const r=await GAME.act({t:'animal',op:'feed',i:+i}); if(r.err){ err=r.err; break; } n++; }
  GAME.toast(n?`Đã cho <b>${n}</b> con ăn`+(err?' · '+esc(err):''):esc(err||'Không con nào đói'),n?'item':'lock'); };
ACT.collectall=async d=>{ const got={}; for(const i of String(d.is).split(',').reverse()){ const r=await GAME.act({t:'animal',op:'collect',i:+i}); if(r.err) break; if(r.item) got[r.item]=(got[r.item]||0)+(r.n||1); else if(r.msg) GAME.toast(esc(r.msg),'item'); }
  const t=Object.entries(got).map(([k,n])=>`${n} ${esc(SD.ITEMS[k].name.toLowerCase())}`).join(', '); if(t) GAME.toast(`Thu <b>${t}</b>`,'vnd'); }; ACT.collect=d=>req({t:'animal',op:'collect',i:+d.i}).then(r=>{ if(!r.err&&r.msg) GAME.toast(esc(r.msg),'item'); else if(!r.err&&r.item) GAME.toast(`Thu <b>${r.n} ${esc(SD.ITEMS[r.item].name.toLowerCase())}</b>`,'vnd'); });
ACT.openmyth=()=>UI.place('mutamer');   /* cường hoá ngựa thành thần thú: bảng ở maps8 (Người Thuần Thú MU), mở được ở trại ngựa */
PLACE.stable=n=>open(n&&n.id==='chuongngua'?'Trại ngựa Đà Bắc · Chú Hải':'Trại ngựa · Anh Phong',()=>{ const g=G(), h=g.horse, now=NET.now();
  return money()+(g.skills.cuoingua?'':'<p class="bad">Cần học Cưỡi ngựa (laptop ở phòng)</p>')+`<p>Ngựa: ${h&&h.own?'<b>ngựa của bạn</b>':h&&h.until>now?`thuê còn ${Math.ceil((h.until-now)/60000)} phút`:'chưa có'} · bấm <kbd>H</kbd> để lên/xuống ngựa (chạy ×${SD.HORSE.speed}, chở ${SD.HORSE.carry} thùng hàng)</p>
    <div class="col">${btn('horse','Thuê 1 giờ · '+fmt(SD.HORSE.rent),{op:'rent'})}${h&&h.own?btn('openmyth','🐉 Cường hoá thần thú'+(h.myth?` (bậc ${h.myth}/${SD.HORSE.myth.length})`:''),{},'pri'):btn('horse','Mua ngựa · '+fmt(SD.HORSE.buy),{op:'buy'})}</div>
    ${n&&n.id==='chuongngua'?'<p class="muted">Cưỡi ngựa đi khắp Ké Retreat, thị trấn, vườn quốc gia, làng Mường cho nhanh. Bấm H lên/xuống.</p>':(()=>`    <h5>Chăn ngựa (${g.daily.herd}/${SD.HORSE.herd.daily} hôm nay)</h5><p class="muted">Dắt đàn ra đồng cỏ phía Đông, đứng cho ngựa ăn cỏ ${SD.HORSE.herd.dur} giây rồi dắt về đây: +${SD.HORSE.herd.exp} EXP, +${fmt(SD.HORSE.herd.vnd)}.</p>
    ${GAME.HERD?(GAME.HERD.phase==='back'?btn('herd','Giao đàn ngựa',{op:'return'},'pri'):'<em>Đang dắt đàn ra đồng cỏ</em>'):btn('herd','Nhận đàn ngựa',{op:'start'},'pri')}
    <h5>Chở hàng</h5><p class="muted">Lấy thùng ở kho cạnh nhà bác Trang, chở ra điểm nhận hàng ở chợ: ${fmt(SD.CRATES.vnd)} + ${SD.CRATES.exp} EXP/thùng (${g.daily.crates}/${SD.CRATES.daily} hôm nay).</p>`)()}`; },{wide:true});
ACT.horse=d=>req({t:'horse',op:d.op});
ACT.herd=async d=>{ const r=await GAME.act({t:'herd',op:d.op}); if(r.err) return; if(d.op==='start'){ GAME.HERD={phase:'go'}; GAME.toast('Ngựa chưa ăn cỏ: theo mũi tên vàng dắt đàn ra đồng cỏ phía Đông Bắc, đứng trong khung vàng '+SD.HORSE.herd.dur+' giây cho ngựa ăn','quest'); } if(d.op==='return') GAME.HERD=null; UI.closeAll(); };
for(const k of Object.keys(SD.DALAT.shops)) PLACE[k]=()=>open(SD.DALAT.shops[k].name,()=>{ const o=G().cookOrder, need=o?SD.RECIPES[o.r].need:{};
  return money()+`<div class="list">${Object.entries(SD.INGREDIENTS).filter(([i,g])=>g.shop===k).map(([i,g])=>`<div class="row ${need[i]?'on':''}">${ico(i)}<span>${esc(g.name)} <small class="muted">có ${G().items[i]||0}${need[i]?' · đơn cần '+need[i]:''}</small></span><span>${fmt(g.price)}</span>${btn('ing','Mua',{i,n:1})}</div>`).join('')}</div>`; });
ACT.ing=d=>req({t:'cook',op:'buy',ing:d.i,n:+d.n});
PLACE.quan_lan=()=>open('Quán cô Lan',()=>{ const g=G(), o=g.cookOrder;
  return menuHtml({...SD.PLACES.quan_lan,key:'quan_lan'})+`<h5>Phụ cô Lan nấu (${g.daily.cook}/${SD.COOK.daily} hôm nay)</h5>`+(g.skills.nauan?'':'<p class="bad">Cần học Nấu ăn (laptop ở phòng)</p>')+
    (o?`<p>Đơn: <b>${SD.RECIPES[o.r].name}</b> cần ${Object.entries(SD.RECIPES[o.r].need).map(([k,n])=>`${SD.ITEMS[k].name} ${Math.min(g.items[k]||0,n)}/${n}`).join(', ')}. Mua ở 3 quầy chợ rồi vào bếp (cạnh quán) nấu. Tiền công ${fmt(SD.RECIPES[o.r].pay)}.</p>${btn('cookcancel','Huỷ đơn',{},'bad')}`:btn('order','Nhận đơn nấu','', 'pri')); },{wide:true});
ACT.order=d=>req({t:'cook',op:'order'}); ACT.cookcancel=()=>req({t:'cook',op:'cancel'});
// nấu: 3 nhịp bấm SPACE khi kim vào vùng xanh
let mini=null; function stopMini(){ if(mini){ cancelAnimationFrame(mini.raf); mini=null; } }
UI.cook=()=>{ const o=G().cookOrder; if(!o){ open('Bếp quán cô Lan',()=>`<p>Chưa có đơn nấu. Nhận đơn ở chỗ cô Lan trước.</p>${goBtn('colan','cô Lan')}`); return; } const r=SD.RECIPES[o.r];
  const miss=Object.entries(r.need).filter(([k,n])=>(G().items[k]||0)<n);
  if(miss.length){ open('Còn thiếu nguyên liệu',()=>`<div class="list">${miss.map(([k,n])=>{ const sh=SD.INGREDIENTS[k].shop; return `<div class="row">${ico(k)}<span>${esc(SD.ITEMS[k].name)} ${G().items[k]||0}/${n} <small class="muted">bán ở ${esc(SD.DALAT.shops[sh].name)}</small></span>${goBtn(sh,SD.DALAT.shops[sh].name.toLowerCase())}</div>`; }).join('')}</div>`); return; }
  open('Nấu '+r.name,()=>`<p>3 bước: sơ chế · nêm nếm · canh lửa. Bấm <kbd>SPACE</kbd> khi kim vào vùng xanh.</p><canvas id="cookCv" width="360" height="60"></canvas><p id="cookMsg"></p>`,{static:true});
  mini={step:0,score:0,t:0,raf:0,zone:.35+Math.random()*.3}; const loop=()=>{ if(!mini) return; mini.t+=1/60; const c=$('#cookCv'); if(!c) return stopMini(); const g=c.getContext('2d');
    const k=(Math.sin(mini.t*(2.4+mini.step*.8))+1)/2; mini.k=k; g.fillStyle='#2a2230'; g.fillRect(0,0,360,60); g.fillStyle='#4fbf5a'; g.fillRect(mini.zone*340+10,10,40,40); g.fillStyle='#ffd84a'; g.fillRect(10+k*340,4,4,52);
    g.fillStyle='#fff3d6'; g.font='18px VT323'; g.fillText(`Bước ${mini.step+1}/3 · đúng ${mini.score}`,10,56); mini.raf=requestAnimationFrame(loop); }; loop(); };
UI.keys=(pressed)=>{ if(LOG&&pressed.has(' ')) loPump(); if(FS&&FS.st==='bite'&&pressed.has(' ')) hookFish();
  if(mini&&(pressed.has(' ')||pressed.has('e'))){ const ok=mini.k*340+10>=mini.zone*340+6&&mini.k*340+10<=mini.zone*340+54; mini.score+=ok?1:0; GAME.sfx(ok?'coin':'blip',.4);
    const m=$('#cookMsg'); if(m) m.textContent=ok?'Chuẩn!':'Hơi lệch...'; mini.step++; mini.zone=.1+Math.random()*.75;
    if(mini.step>=3){ const sc=mini.score; stopMini(); UI.closeAll(); GAME.act({t:'cook',op:'cook',score:sc}); } }
  if(raceInput) raceKeys(pressed); if(danceInput) danceKeys(pressed); };

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
  if(!cur||cur.t!==t){ open(t,()=>tableHtml(GAME.TABLE&&GAME.TABLE.id===tableId?GAME.TABLE:v),{full:true}); } else draw(); if(v.game==='chess') setTimeout(drawBoard,0); };
function tableHtml(v){ if(v.game==='chess') return GAMES.chessHtml(v); if(v.game==='poker') return GAMES.pokerHtml(v); return GAMES.masoiHtml(v); }
const log=v=>`<div class="tlog">${(v.log||[]).slice(-6).map(l=>`<div>${esc(l)}</div>`).join('')}</div>`;
// cờ vua
let sel=-1;
function chessHtml(v){ const me=v.me, mc=me===0?'w':me===1?'b':null, cl=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  const res=v.result?(v.result.w<0?'Hoà · '+v.result.why:`${esc(v.seats[v.result.w]?v.seats[v.result.w].name:'?')} thắng · ${esc(v.result.why)}`):'';
  return `<div class="chess"><canvas id="board" width="320" height="320"></canvas><div class="cside">
    <p>⬛ ${esc(v.seats[1]?v.seats[1].name:'(trống)')} · <b>${cl(v.clock[1])}</b></p><p>⬜ ${esc(v.seats[0]?v.seats[0].name:'(trống)')} · <b>${cl(v.clock[0])}</b></p>
    <p>Cược: <b>${fmt(v.bet)}</b> mỗi bên${v.watchers?' · '+v.watchers+' người xem':''}</p>
    <p>${v.st==='wait'?'Đợi người chơi thứ 2...':v.st==='play'?(v.turn===mc?'<b class="good">Tới lượt bạn</b>':'Đợi đối thủ...')+(v.check?' · <b class="bad">Chiếu!</b>':''):'<b>'+res+'</b>'}</p>
    ${me>=0&&v.st==='wait'&&v.seats.filter(Boolean).length===1?btn('cmove','Chơi với Lê Quang Liêm (bot)',{op:'bot'},'pri'):''}${me>=0&&v.st==='play'?btn('cmove','Xin hoà',{op:'draw'})+btn('cmove','Xin thua',{op:'resign'}):''}${me>=0&&v.st==='end'?btn('cmove',v.rematch[me]?'Đã sẵn sàng':'Chơi ván mới',{op:'rematch'},'pri'):''}
    ${v.draw>=0&&v.draw!==me&&v.st==='play'?'<p class="good">Đối thủ xin hoà · bấm Xin hoà để đồng ý</p>':''}${btn('tleave','Rời bàn')}${log(v)}</div></div>`; }
ACT.cmove=d=>NET.req({t:'tbl',id:tableId,op:d.op});
const PIECE={k:['..XX..','.XXXX.','..XX..','.XXXX.','..XX..','.XXXX.','XXXXXX'],q:['X.XX.X','XXXXXX','.XXXX.','..XX..','.XXXX.','.XXXX.','XXXXXX'],r:['X.XX.X','XXXXXX','.XXXX.','.XXXX.','.XXXX.','.XXXX.','XXXXXX'],
  b:['..XX..','.XX.X.','.XXXX.','..XX..','.XXXX.','..XX..','XXXXXX'],n:['.XXX..','XXXXX.','XX.XX.','...XX.','..XXX.','.XXXX.','XXXXXX'],p:['......','..XX..','.XXXX.','..XX..','.XXXX.','.XXXX.','XXXXXX']};
function drawBoard(){ const c=$('#board'), v=GAME.TABLE; if(!c||!v||v.game!=='chess') return; const st=v.b?{b:v.b,turn:v.turn,castle:v.castle||'',ep:v.ep,half:0,full:1}:null;
  GAMES.drawBoard(c,v,sel,st&&sel>=0?CHESS.legal(st).filter(m=>m.from===sel).map(m=>m.to):[],cdrag); }
addEventListener('resize',()=>{ if(GAME.TABLE&&GAME.TABLE.game==='chess') drawBoard(); });   // bàn cờ co lại vừa khung khi đổi cỡ / zoom
function drawBoardOld(){ const c=$('#board'), v=GAME.TABLE; if(!c||!v||v.game!=='chess') return; const g=c.getContext('2d'), flip=v.me===1, S=40;
  const st=v.b?{b:v.b,turn:v.turn,castle:v.castle||'',ep:v.ep,half:0,full:1}:null, legal=st&&sel>=0?CHESS.legal(st).filter(m=>m.from===sel).map(m=>m.to):[];
  for(let i=0;i<64;i++){ const r=i>>3, f=i&7, X=(flip?7-f:f)*S, Y=(flip?7-r:r)*S; g.fillStyle=(r+f)%2?'#8a5d3b':'#e8d8b4'; g.fillRect(X,Y,S,S);
    if(v.last&&(v.last.from===i||v.last.to===i)){ g.fillStyle='rgba(255,216,74,.35)'; g.fillRect(X,Y,S,S); } if(i===sel){ g.fillStyle='rgba(127,224,255,.5)'; g.fillRect(X,Y,S,S); }
    if(legal.includes(i)){ g.fillStyle='rgba(79,191,90,.55)'; g.fillRect(X+14,Y+14,12,12); }
    const p=v.b&&v.b[i]; if(p){ const m=PIECE[p.toLowerCase()], w=p===p.toUpperCase(); m.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch!=='X') return; g.fillStyle='#1c1516'; g.fillRect(X+5+x*5-1,Y+3+y*5-1,7,7); }));
      m.forEach((row,y)=>[...row].forEach((ch,x)=>{ if(ch!=='X') return; g.fillStyle=w?'#fbfaf6':'#3a2c36'; g.fillRect(X+5+x*5,Y+3+y*5,5,5); })); } }
  if(v.check&&v.b){ const k=v.b.indexOf(v.turn==='w'?'K':'k'), r=k>>3, f=k&7; g.strokeStyle='#ff6a55'; g.lineWidth=3; g.strokeRect((flip?7-f:f)*S+2,(flip?7-r:r)*S+2,S-4,S-4); } }
// đi quân: bấm chọn rồi bấm ô đích, hoặc giữ chuột kéo quân thả vào ô đích
let cdrag=null;
const cmove=(from,to)=>NET.req({t:'tbl',id:tableId,op:'move',from,to,promo:'q'}).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); });
inner.addEventListener('pointerdown',e=>{ if(e.target.id!=='board') return; const v=GAME.TABLE; if(!v||v.st!=='play'||v.me<0||!v.b) return; const c=e.target, i=GAMES.boardSquare(c,e,v); if(i<0) return;
  const p=v.b[i], myTurn=v.turn===(v.me===0?'w':'b'), mine=p&&((p===p.toUpperCase())===(v.me===0));
  if(mine&&myTurn){ sel=i; const [x,y]=GAMES.boardXY(c,e); cdrag={i,x,y,moved:false}; c.setPointerCapture(e.pointerId); c.style.cursor='grabbing'; }
  else if(sel>=0){ const from=sel; sel=-1; cmove(from,i); } else sel=-1;
  drawBoard(); e.preventDefault(); });
inner.addEventListener('pointermove',e=>{ const c=e.target; if(c.id!=='board') return; const v=GAME.TABLE; if(!cdrag){ if(v&&v.b&&v.st==='play'){ const i=GAMES.boardSquare(c,e,v), p=i>=0&&v.b[i]; c.style.cursor=p&&((p===p.toUpperCase())===(v.me===0))&&v.turn===(v.me===0?'w':'b')?'grab':'pointer'; } return; }
  const [x,y]=GAMES.boardXY(c,e); if(Math.hypot(x-cdrag.x,y-cdrag.y)>2) cdrag.moved=true; cdrag.x=x; cdrag.y=y; drawBoard(); });
inner.addEventListener('pointerup',e=>{ if(!cdrag) return; const c=$('#board'), v=GAME.TABLE, d=cdrag; cdrag=null; if(c) c.style.cursor='grab';
  const j=c&&v?GAMES.boardSquare(c,e,v):-1; if(d.moved&&j>=0&&j!==d.i){ sel=-1; cmove(d.i,j); }   // kéo thả xong thì đi luôn; chỉ bấm thì giữ quân đang chọn chờ bấm ô đích
  drawBoard(); });
// poker
const card=c=>c==='??'?'<span class="card back"></span>':`<span class="card ${'hd'.includes(c[1])?'red':''}">${c[0]==='T'?'10':c[0]}${{s:'♠',h:'♥',d:'♦',c:'♣'}[c[1]]}</span>`;
function pokerHtml(v){ const me=v.me, s=v.seats[me], myTurn=v.st==='play'&&v.toAct===me, need=s?v.cur-s.bet:0;
  return `<div class="poker"><p>Pot: <b>${fmt(v.pot)}</b> · mù ${fmt(v.blinds[0])}/${fmt(v.blinds[1])} ${v.st==='play'?'· lượt còn '+Math.ceil(v.left/1000)+'s':v.st==='wait'?'· đợi đủ 2 người':''}</p>
    <div class="board">${v.board.map(card).join('')||'<span class="muted">Chưa lật bài</span>'}</div>
    <div class="seats">${v.seats.map((x,i)=>x?`<div class="seat ${i===v.toAct?'act':''} ${x.fold?'fold':''}"><b>${esc(x.name)}${i===v.dealer?' (D)':''}</b><span>${fmt(x.chips)}${x.bet?' · cược '+fmt(x.bet):''}${x.allin?' · ALL-IN':''}</span><div>${(x.cards||[]).map(card).join('')}</div>${x.hand?`<em>${esc(x.hand)}</em>`:''}</div>`:'<div class="seat empty">trống</div>').join('')}</div>
    ${myTurn?`<div class="pact">${btn('pk','Bỏ bài',{op:'fold'})}${need>0?btn('pk','Theo '+fmt(Math.min(need,s.chips)),{op:'call'},'pri'):btn('pk','Xem bài',{op:'check'},'pri')}
      <input id="raiseTo" type="number" step="5000" value="${v.cur+v.minRaise}" min="${v.cur+v.minRaise}" aria-label="Tố lên">${btn('pk','Tố',{op:'raise'})}${btn('pk','All-in',{op:'allin'})}</div>`:''}
    ${s&&v.st!=='play'&&v.seats.filter(Boolean).length<SD.CLUB.poker.seats?btn('pk','Thêm bot vào bàn',{op:'bots'}):''}${s&&s.chips<v.blinds[1]&&v.st!=='play'?btn('pk','Mua thêm 200.000đ chip',{op:'rebuy'}):''}${btn('tleave','Rời bàn (đổi chip ra tiền)')}${log(v)}</div>`; }
ACT.pk=d=>{ const m={t:'tbl',id:tableId,op:d.op}; if(d.op==='raise') m.to=+$('#raiseTo').value; if(d.op==='rebuy') m.buy=200000; NET.req(m).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); }); };
// ma sói
function masoiHtml(v){ const me=v.me, alive=v.players[me]&&v.players[me].alive, ph={wait:'Đợi người',night:'Ban đêm',day:'Ban ngày: bàn bạc',vote:'Bỏ phiếu treo cổ',end:'Hết ván'}[v.st];
  const act=v.st==='night'?{soi:['kill','Cắn'],tientri:['see','Soi'],baove:['guard','Bảo vệ']}[v.role]:v.st==='vote'?['vote','Treo']:null;
  return `<div class="masoi"><p><b>${ph}</b> · ngày ${v.day} ${v.left?'· còn '+Math.ceil(v.left/1000)+'s':''} · phí ${fmt(v.fee)} · pot ${fmt(v.pot)}</p>
    ${v.role?`<p class="role">Bạn là <b>${esc(v.roleName)}</b>${alive?'':' · đã chết'}</p>`:''}${v.seen&&v.seen.length?`<p class="muted">Đã soi: ${v.seen.map(s=>esc(s.n)+(s.soi?' (SÓI)':' (dân)')).join(', ')}</p>`:''}
    <div class="mplayers">${v.players.map((p,i)=>`<div class="mp ${p.alive?'':'dead'} ${v.myAct===i?'pick':''}"><b>${esc(p.name)}</b><span>${p.role?esc(p.role):p.alive?'':'đã chết'}${v.votes&&Object.values(v.votes).filter(x=>x===i).length?' · '+Object.values(v.votes).filter(x=>x===i).length+' phiếu':''}</span>
      ${alive&&act&&p.alive&&i!==me&&!(v.role==='soi'&&p.soi&&v.st==='night')?btn('ms',act[1],{op:act[0],target:i}):''}</div>`).join('')}</div>
    ${v.st==='vote'&&alive?btn('ms','Bỏ qua',{op:'vote',target:-1}):''}${(v.st==='wait'||v.st==='end')&&me>=0&&v.players.length<SD.CLUB.bots.masoiSize?btn('ms',`Thuê quản trò tìm người (${fmt(SD.CLUB.bots.masoiHire)}, thắng ăn ×${SD.CLUB.bots.masoiBonus})`,{op:'hire'},'pri'):''}${(v.st==='wait'||v.st==='end')&&v.players.length>=v.min?btn('ms','Bắt đầu ván',{op:'start'},'pri'):''}
    <div class="tlog">${v.log.slice(-5).map(l=>`<div>${esc(l)}</div>`).join('')}${v.chat.slice(-6).map(c=>`<div class="${c.to==='soi'?'bad':''}"><b>${esc(c.n)}:</b> ${esc(c.m)}</div>`).join('')}</div>
    ${alive?`<div class="form"><input id="msIn" maxlength="100" placeholder="${v.st==='night'?(v.role==='soi'?'Nói với bầy sói...':'Ban đêm im lặng'):'Nói với cả làng...'}" aria-label="Nói">${btn('mschat','Nói')}</div>`:''}${btn('tleave','Rời bàn')}</div>`; }
ACT.ms=d=>NET.req({t:'tbl',id:tableId,op:d.op,target:+d.target}).then(r=>{ if(r.err) GAME.toast(esc(r.err),'lock'); });
ACT.mschat=()=>{ const m=$('#msIn').value.trim(); if(m) NET.req({t:'tbl',id:tableId,op:'chat',m}); $('#msIn').value=''; };
inner.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.id==='msIn') ACT.mschat(); });
inner.addEventListener('input',e=>{ if(e.target.id==='raiseTo'){ const l=$('#raiseLbl'); if(l) l.textContent=fmt(+e.target.value); } });

/* ---------- trường đua: đăng ký, cược, đua kiểu Audition ---------- */
let raceInput=null; const ARW={L:'←',U:'↑',R:'→',D:'↓'}, KEY2={arrowleft:'L',arrowup:'U',arrowright:'R',arrowdown:'D',a:'L',w:'U',d:'R',s:'D'};
UI.race=()=>open('Trường đua ngựa',()=>raceHtml(GAME.RACE),{wide:true});
function raceHtml(v){ if(!v) return '<p class="muted">Đang tải...</p>'; const R=SD.RACE, me=v.me, mm=ms=>{ const x=Math.ceil(ms/1000); return Math.floor(x/60)+':'+String(x%60).padStart(2,'0'); };
  return money()+`<p class="rhead">${v.st==='lobby'?`Đang nhận kỵ sĩ + cược · <b>chốt danh sách sau ${mm(v.lobbyLeft)}</b> (cứ ${Math.round(R.every/60*10)/10} phút 1 trận, ghế trống có bot chạy)`:v.st==='run'?`Đang đua · nhịp ${v.round+1}/${v.rounds}`:'Kết thúc · trận mới mở ngay sau đây'}</p>
    <div class="list rows">${v.riders.map((r,i)=>`<div class="row ${i===me?'on':''}"><span>#${i+1} <b>${esc(r.name)}</b>${r.bot?' <small class="muted">(bot)</small>':''} <small class="muted">${r.dist}/${v.track}m · ${r.pf} perfect</small></span><span>cược ${fmt(r.pot)}</span>${v.st==='lobby'?btn('rbet','Cược 50k',{on:i,amt:50000})+btn('rbet','Cược 200k',{on:i,amt:200000}):''}</div>`).join('')}</div>
    <p>Tổng cược: <b>${fmt(v.pool)}</b>${v.myBets.length?' · bạn cược: '+v.myBets.map(b=>`#${b.on+1} ${fmt(b.amt)}`).join(', '):''}</p>
    ${v.st==='lobby'&&me<0?btn('rjoin',`Thuê ngựa đua · ${fmt(v.fee)}`,{},'pri')+`<p class="muted">Trận có bot: phí thuê ×${R.botMul}, về nhất ăn phí × (số người + 1); mỗi ngày ${R.botWins} lần thắng bot có thưởng, sau đó chỉ hoàn phí. Cược vào bot cũng được; không ai cược trúng thì nhà cái giữ.</p>`:''}${v.st==='lobby'&&me>=0&&v.riders.filter(r=>!r.bot).length===1?btn('rstart','▶ Bắt đầu đua ngay (còn lại toàn bot)',{},'pri big'):''}${v.st==='lobby'&&me>=0?btn('rleave','Rút lui (hoàn tiền)'):''}
    ${v.results?`<h5>Kết quả</h5><p>${v.results.order.map((r,i)=>`${i+1}. ${esc(r.name)}${r.bot?' (bot)':''} (${r.dist}m)`).join(' · ')}<br>Người về nhất ăn ${fmt(v.results.prize)} · quỹ cược ${fmt(v.results.pool)} chia theo tỉ lệ</p>`:''}
    <p class="muted">Cách đua: mỗi nhịp hiện chuỗi mũi tên. Gõ đúng chuỗi bằng phím mũi tên (hoặc WASD), rồi bấm SPACE đúng lúc vạch chạy tới mốc vàng. PERFECT liên tiếp được cộng combo.</p>`; }
ACT.rjoin=()=>req({t:'race',op:'join'}); ACT.rstart=()=>req({t:'race',op:'start'}); ACT.rleave=()=>req({t:'race',op:'leave'}); ACT.rbet=d=>req({t:'race',op:'bet',on:+d.on,amt:+d.amt});
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

/* ---------- Lumen Studio: lễ tân (ứng tuyển), bàn làm việc trong studio, làm remote bằng laptop ở phòng ---------- */
function lumenHtml(remote){ const L=SD.LUMEN, g=G(), r=g.lumen&&g.lumen.day===SD.vnTime(NET.now()).day?g.lumen:{...(g.lumen||{}),done:[]}, certs=((g.das||{}).certs||[]).length;
  if(!r.hired) return `<p class="muted">Lumen Studio cần ít nhất <b>${L.needCerts} chứng chỉ DAS</b> (bạn có ${certs}) và cấp ${L.level}. Ứng tuyển ở quầy lễ tân Lumen (Grab tới Lumen Studio, Hà Nội). Làm ở đây được EXP ×${L.expMul}.</p>`;
  const left=L.daily-r.done.length;
  return `<p>Hôm nay còn <b>${left}/${L.daily}</b> việc · mỗi việc ${fmt(L.pay)} + EXP ×${L.expMul} · ${remote?'đang làm remote ở phòng':'đang ở studio'}</p><div class="list">${Object.entries(L.tasks).map(([k,t])=>{ const done=r.done.includes(k);
    return `<div class="row"><span>${esc(t.name)} <small class="muted">${t.dur} giây · +${t.exp*L.expMul} EXP</small></span><span>${done?'xong':''}</span>${done||left<=0?'':btn('lumendo','Làm',{k},'pri')}</div>`; }).join('')}</div>`; }
UI.lumen=()=>open('Lumen Studio · bàn làm việc',()=>lumenHtml(false));
PLACE.lumen=()=>open('Lumen Studio · Annie',()=>{ const L=SD.LUMEN, g=G(), lm=g.lumen||{}, sc=lm.scholar, certs=((g.das||{}).certs||[]).length, ready=certs>=L.needCerts&&g.level>=L.level;
  const intro=`<p>Annie: "Chào bạn! Lumen là studio thiết kế, làm remote thoải mái. Bên mình nhận người có từ <b>${L.needCerts} chứng chỉ DAS</b> và cấp ${L.level} trở lên, bù lại kinh nghiệm ở đây <b>gấp ${L.expMul} lần</b>."</p>`,
    perks='<p class="muted">Phòng nghỉ trưa (+năng lượng) và máy cà phê ở pantry dùng được 1 lần/ngày.</p>';
  if(lm.hired) return intro+askHtml(g)+lumenHtml(false)+btn('lumenquit','Nghỉ làm ở Lumen')+perks;
  const schol=!sc?`<h5>Học bổng Lumen</h5><p>Annie: "Chưa đủ chứng chỉ thì để Lumen tài trợ: bay vào DAS (TP.HCM) học đủ ${L.needCerts} chứng chỉ, <b>${L.scholar.free} khoá đầu miễn phí</b>, <b>${L.scholar.half} khoá sau giảm 50%</b>. Học xong quay lại đây nhận việc, có thưởng ${L.scholar.reward.exp} EXP + ${fmt(L.scholar.reward.vnd)}."</p>${btn('lumenscholar','Nhận học bổng, đi học ở DAS',{},'pri')}`
    :`<h5>Học bổng Lumen</h5><p>Đã có <b>${certs}/${L.needCerts}</b> chứng chỉ DAS · còn ${sc.free} suất miễn phí, ${sc.half} suất giảm 50% khi đăng ký khoá ở DAS.</p>`;
  return intro+askHtml(g)+`<p class="muted">Bạn: cấp ${g.level} · ${certs}/${L.needCerts} chứng chỉ DAS</p>`+(ready?btn('lumenapply',sc?'Báo cáo đủ chứng chỉ, nhận việc':'Ứng tuyển vào Lumen',{},'pri'):'')+(ready&&!sc?'':schol)+perks; });
// Leno xin tiền chị Annie: phải làm 1 việc vặt chị giao trước
function askHtml(g){ if(!(g.flags&&g.flags.annieAsk)) return ''; const A=SD.LUMEN.annieAsk, a=g.daily.annie||{}, j=a.job&&A.jobs[a.job];
  return `<h5>💸 Xin tiền chị Annie</h5>`+(a.paid?'<p class="muted">Hôm nay chị Annie cho tiền rồi, mai quay lại nhé.</p>'
    :!j?`<p>Hết tiền thì về đây xin chị Annie (mỗi ngày 1 lần, ${fmt(A.pay[0])} tới ${fmt(A.pay[1])}). Có điều chị sẽ bắt làm thêm 1 việc đã.</p>${btn('annieask','💸 Xin tiền chị Annie',{},'pri')}`
    :a.done?`<p>Xong việc "<b>${esc(j.name)}</b>" rồi, chị Annie gật gù.</p>${btn('anniepay','Nhận tiền chị Annie',{},'pri')}`
    :`<p>Việc chị giao: <b>${esc(j.name)}</b> (${j.dur} giây ở ${esc(j.where)}). Làm xong quay lại đây nhận tiền.</p>${btn('anniego','➜ Đi làm ngay',{},'pri')}`); }
ACT.annieask=async()=>{ const r=await req({t:'lumen',op:'ask'}); if(!r.err) GAME.toast(esc(r.msg),'quest'); UI.refresh(); };
ACT.anniego=()=>{ const L=SD.LUMEN, a=G().daily.annie||{}, j=L.annieAsk.jobs[a.job], P=GAME.P; if(!j) return; UI.closeAll();
  const [x,y]=j.at==='desk'?L.desks.slice().sort((u,v)=>Math.hypot(u[0]*16-P.x,u[1]*16-P.y)-Math.hypot(v[0]*16-P.x,v[1]*16-P.y))[0]:[L[j.at].x,L[j.at].y];
  GAME.walkTo(x,y,j.name,()=>GAME.act({t:'lumen',op:'askdo'})); };
ACT.anniepay=async()=>{ const r=await req({t:'lumen',op:'askpay'}); if(!r.err){ GAME.sfx('item_pickup',.6); GAME.toast(esc(r.msg),'item'); } UI.refresh(); };
ACT.lumenscholar=async()=>{ const r=await req({t:'lumen',op:'scholar'}); if(!r.err) GAME.toast(esc(r.msg),'quest'); };
ACT.lumenapply=async()=>{ const r=await req({t:'lumen',op:'apply'}); if(!r.err) GAME.toast(esc(r.msg),'quest'); };
ACT.lumenquit=async()=>{ const r=await req({t:'lumen',op:'quit'}); if(!r.err) GAME.toast(esc(r.msg),'item'); };
ACT.lumendo=async d=>{ const r=await GAME.act({t:'lumen',op:'do',task:d.k}); if(!r.err) UI.closeAll(); };
/* ---------- Chọn xe / ngựa để đi (phím H khi có nhiều hơn 1 lựa chọn) ---------- */
UI.rides=()=>open('Chọn xe để đi',()=>{ const now=NET.now(), L=GAME.rideChoices(), coat=G().horseCoat||0, rows=[], mins=u=>Math.max(0,Math.ceil((u-now)/60000));
  for(const o of L){ if(o.kind==='moto') rows.push(`<div class="row"><span><b>${esc(GAME.MOTO_NAME[o.model]||o.model)}</b>${o.cur?' · đang chọn':' · trong gara'}<br><small class="muted">${o.model==='xedap'?'xe đạp công cộng, không cần mũ':`×${SD.MOTO.models[o.model].speed} tốc độ`} · còn ${mins(o.until)} phút thuê</small></span>${btn('ridego','Đi xe này',{k:'moto',m:o.model},'pri')}</div>`);
    else SD.HORSE.coats.forEach((n,i)=>rows.push(`<div class="row"><span><b>${esc(n)}</b>${i===coat?' · đang chọn':''}<br><small class="muted">${o.own?'ngựa của bạn':`ngựa thuê · còn ${mins(o.until)} phút`} · ×${SD.HORSE.speed} tốc độ, chở ${SD.HORSE.carry} thùng hàng</small></span>${btn('ridego','Cưỡi',{k:'horse',c:i},i===coat?'pri':'')}</div>`)); }
  return rows.length?`<div class="list">${rows.join('')}</div><p class="muted">Thuê thêm mẫu xe khác ở tiệm thuê xe cạnh Shop Chande: xe cũ được cất vào gara, không mất giờ thuê. Bấm H lần nữa để xuống xe.</p>`
    :'<p class="muted">Chưa có xe nào. Thuê xe máy ở tiệm cạnh Shop Chande, xe đạp công cộng ở trạm cạnh bến xe buýt, ngựa ở trại ngựa thị trấn Đà Bắc hoặc Đà Lạt.</p>'; });
ACT.ridego=d=>GAME.rideGo(d.k==='horse'?{kind:'horse',coat:+d.c}:{kind:'moto',model:d.m});

/* ---------- 120 Yên Lãng · anh Độ: 3 việc + lên sóng buổi tối ---------- */
PLACE.yenlang=()=>open('Anh Độ · 120 Yên Lãng',()=>{ const g=G(), Y=SD.YENLANG, row=id=>{ const q=SD.QUESTS[id], st=g.quests[id], n=(g.qprog||{})[id]||0;
    const ok=q.need?Object.entries(q.need).every(([k,c])=>(g.items[k]||0)>=c):n>=q.prog, prog=q.need?(ok?'Có phở rồi!':'Chưa có phở'):id==='goioii'?(n?'Đã gọi Ộ i i':'Chưa gọi'):`Đã làm ${Math.min(n,q.prog)}/${q.prog}`;
    const r=!st?btn('qstart','Nhận việc: '+q.title,{id},'pri'):st==='active'?(ok?btn('qfinish','Báo cáo: '+q.title,{id},'pri'):`<p>${prog}</p><button class="btn sm qgo" data-go="${id}">➜ Chỉ đường</button>`):'<p class="muted">Đã xong.</p>';
    return `<h5>${q.title}</h5><p class="muted">${q.desc} Thưởng ${q.reward.exp} EXP + ${fmt(q.reward.vnd)}.</p>${r}`; };
  return `<p>"Chào anh em! Vào chơi tự nhiên, đừng sờ vào mô hình là được. Mà nhân tiện nhờ tí việc..."</p>${g.quests.tc_antruc==='active'&&!(g.qprog||{}).tc_antruc?btn('antruc','🍚 Ăn trực (Ông Trường Con giới thiệu sang)',{},'pri'):''}${row('pho')}${row('hulk')}${row('goioii')}
    <h5>Lên sóng cùng anh Độ</h5><p class="muted">Từ ${Y.stream.from}:00 tới ${Y.stream.to}:00, ngồi ghế khách đỏ cạnh bàn stream bấm E: ${Y.stream.dur} giây, +${Y.stream.exp} EXP + ${fmt(Y.stream.vnd)} tiền donate. Mỗi ngày 1 lần. Buổi tối Ộ i i cũng về đây.</p>`; });

/* ---------- Sân pickleball: HLV Tuấn dạy chơi, bảng vào sân đấu 2 vs 2 (thiếu người thuê bot tuyển thủ) ---------- */
const PK_RULE=K=>`Chạm ${K.target} điểm (hơn 2, tối đa ${K.cap}), tính điểm mỗi pha bóng. Bóng sang sân mình thì <b>chạy</b> (<kbd>WASD</kbd> / mũi tên) vào vòng vàng chỗ bóng rơi, bấm đúng lúc bóng tới: <kbd>J</kbd> drive (nhanh, đối thủ khó đỡ), <kbd>K</kbd> dink (thả nhẹ sát lưới), <kbd>L</kbd> lob (bổng ra cuối sân), <kbd>SPACE</kbd> đánh lại cú vừa chọn.`;
PLACE.pickle=()=>open('HLV Tuấn · pickleball',()=>{ const K=SD.PICKLE, g=G();
  return money()+`<p>"Pickleball dễ chơi mà nghiện lắm! Học với anh 1 buổi là vào sân đánh được, thiếu người thì thuê bot tuyển thủ, có cả Lý Hoàng Nam đấy."</p><p class="muted">${PK_RULE(K)}</p>
    ${g.skills.pickle?'<p class="good">Bạn đã biết chơi. Ra giữa sân bấm E để vào trận.</p>':btn('pklesson',`Học 1 buổi · ${fmt(K.lesson.price)} · ${K.lesson.dur} giây`,{},'pri')}`; });
UI.pickle=()=>open('Sân pickleball · đấu 2 vs 2',()=>{ const K=SD.PICKLE, v=GAME.PK||{st:'idle',seats:[null,null,null,null],score:[0,0],me:-1}, g=G(), me=v.me;
  if(!g.skills.pickle) return '<p>Chưa biết chơi pickleball: gặp <b>HLV Tuấn</b> ở góc dưới bên trái sân để học 1 buổi.</p>';
  const free=v.st==='idle'||v.st==='lobby', seat=i=>{ const s=v.seats[i], img=s&&GAME.pkFace(s), col=i<2?'#ff6a55':'#7fe0ff';   // mỗi ô có ảnh mặt người chơi / bot
    const face=img?`<img src="${img}" alt="" style="width:44px;height:44px;image-rendering:pixelated;border:2px solid ${col};background:#f3ecdc">`:`<span style="width:44px;height:44px;display:grid;place-items:center;border:2px dashed ${col};color:${col};font-size:24px">?</span>`;
    return `<div class="row"><span style="display:flex;gap:8px;align-items:center">${face}<span><b style="color:${col}">${i<2?'Đội A':'Đội B'}</b> · ô ${i%2+1}<br>${s?esc(s.name)+(s.bot?' 🤖':s.pid===NET.pid?' (bạn)':''):'<span class="muted">trống</span>'}</span></span>${!s&&me<0&&free?btn('pkjoin','Vào ô này',{seat:i},'pri'):''}</div>`; };
  const empty=v.seats.filter(s=>!s).length;
  return `<p class="muted">${PK_RULE(K)}</p><div class="list">${[0,1,2,3].map(seat).join('')}</div>
    ${v.st==='play'?`<p>Đang đấu: <b>${v.score[0]} – ${v.score[1]}</b></p>`:v.st==='end'?`<p>${esc(v.log||'')}</p>`:''}
    ${me>=0&&v.st==='lobby'?`<div class="col">${btn('pkstart',empty?`Bắt đầu · thuê ${empty} bot (${fmt(empty*K.hire)})`:'Bắt đầu trận',{},'pri')}${btn('pkleave','Rời sân')}</div>`:''}
    <p class="muted">Bot tuyển thủ: ${K.bots.map(b=>esc(b[0])).join(', ')}. Thắng: +${K.win.exp} EXP + ${fmt(K.win.vnd)}.</p>`; });
// shop đồ pickleball: 10 set, ảnh xem trước là chính nhân vật của bạn mặc set đó
const PKPRE={}; function pkPreview(z){ const g=G(); if(!g.look||!window.AVATAR) return ''; const key=z.id+JSON.stringify(g.look); if(PKPRE[key]) return PKPRE[key];
  try{ const av=AVATAR.build({...g.look,outfit:{...g.look.outfit,...z.items}}), f=(av.anims.idle_down||av.anims.idle).frames[0]; return PKPRE[key]=f.toDataURL(); }catch(e){ return ''; } }   // cả người, nhìn rõ áo quần giày
/* ---------- 3 map mới: Bearplus · VNPT · Miếu ông Trường Con ---------- */
// 1 dòng nhiệm vụ chung: nhận việc / tiến độ + chỉ đường / báo cáo / đã xong
function qRow(id){ const g=G(), q=SD.QUESTS[id], st=g.quests[id], n=(g.qprog||{})[id]||0; if(!q) return '';
  if(q.after&&g.quests[q.after]!=='done'&&!st) return '';
  const ok=GAME.canFinish(id), pg=q.need?Object.entries(q.need).map(([k,c])=>`${SD.ITEMS[k].name} ${Math.min(g.items[k]||0,c)}/${c}`).join(' · '):`Đã làm ${Math.min(n,q.prog)}/${q.prog}`;
  const r=!st?btn('qstart','Nhận việc: '+esc(q.title),{id},'pri'):st==='active'?(ok?btn('qfinish','Báo cáo: '+esc(q.title),{id},'pri'):`<p>${pg}</p><button class="btn sm qgo" data-go="${id}">➜ Chỉ đường</button>`):'<p class="muted">✔ Đã xong.</p>';
  return `<h5>${esc(q.title)}</h5><p class="muted">${esc(q.desc)} Thưởng ${q.reward.exp} EXP + ${fmt(q.reward.vnd)}.</p>${r}`; }
const BP_CHAIN=['bp_brief','bp_mood','bp_wire','bp_3d','bp_motion','bp_aww'];
PLACE.bearplus=()=>open('Anh Khoa · Bearplus Studio',()=>{ const g=G(), B=SD.BEARPLUS, cur=BP_CHAIN.find(id=>g.quests[id]!=='done')||BP_CHAIN[BP_CHAIN.length-1], nDone=BP_CHAIN.filter(id=>g.quests[id]==='done').length;
  return `<p>"Chào! Bearplus là studio nhỏ thôi: web, thương hiệu, 3D & motion, UI/UX. Ít người nhưng làm kỹ, không làm cho có. Vào việc nhé?"</p>
    <p class="muted">Dự án Awwwards: ${nDone}/${BP_CHAIN.length} bước${g.flags.bpAward==='sotd'?' · 🏆 Đã đạt Site of the Day!':g.flags.bpAward==='hm'?' · Honorable Mention':''}</p>${qRow(cur)}${qRow('bp_coffee')}
    <h5>Việc freelance</h5><p class="muted">Ngồi bất kỳ bàn iMac bấm E: ${B.gig.dur} giây, +${fmt(B.gig.vnd)} + ${B.gig.exp} EXP, ${B.gig.max} lần/ngày (hôm nay ${(g.daily.bpgig||0)}/${B.gig.max}). Làm đêm (${B.night.from}h–${B.night.to}h) EXP ×2.</p>`; });
const BP_LINES={bp_my:'Chị My: "Render con gấu này mất cả buổi chiều đấy. Lông xù khó lắm!"',bp_dev:'Tín: "Code chạy ở máy em mà, sao lên server lại lỗi nhỉ..."',bp_ngan:'Ngân: "Màu hồng này là hồng Bearplus, không phải hồng thường đâu nha."',bp_bear:'Bé Gấu: "(vẫy vẫy tay, nhún nhảy)"'};
function coffeeBtn(who){ const g=G(), given=(g.flags.bpcafe||{})[who]; if(g.quests.bp_coffee!=='active') return ''; if(given) return '<p class="muted">✔ Đã mời cà phê.</p>';
  return (g.items.cafe_bp||0)>0?btn('bpgive','☕ Mời 1 ly cà phê sữa đá',{who},'pri'):'<p class="muted">Mua cà phê ở quầy để mời.</p>'; }
PLACE.bpstaff=n=>{ const id=n.id; open(SD.NPC_LOOKS[id].name.split(' (')[0]+' · Bearplus',()=>`<p>${esc(BP_LINES[id]||'')}</p>${coffeeBtn(id)}${id==='bp_dev'?qRow('bp_fix'):''}${id==='bp_my'&&G().quests.bp_3d==='active'?'<p class="muted">"Ra trạm render bên kia, mình chạy cùng nhé!"</p>':''}`); };
PLACE.bpbear=()=>open('Bé Gấu Plus · linh vật Bearplus',()=>{ const g=G(), st=g.quests.bp_head;
  return `<p>${st==='done'?'Bé Gấu đội lại đầu, nhảy một điệu cảm ơn bạn. Ai vào studio cũng xin chụp ảnh cùng!':'Bộ đồ gấu đứng đó... mà không có đầu! Chiếc cổ áo trống trơn trông vừa buồn cười vừa tội.'}</p>${qRow('bp_head')}${coffeeBtn('bp_bear')}`; });
ACT.bpgive=async d=>{ const r=await GAME.act({t:'bp',op:'give',who:d.who}); if(r&&!r.err){ GAME.sfx('item_pickup',.5); GAME.toast(esc(r.msg),'quest'); } UI.refresh(); };
// VNPT
PLACE.vnpt=n=>{ const i=n.id==='vn_minh'?3:1; GAME.act({t:'vn',op:'counter',i}).then(r=>{ if(r&&!r.err) UI.vnptDesk(i); else if(r&&r.need) GAME.say([[n.id,'Dạ anh/chị vui lòng bốc số thứ tự ở máy cạnh cửa, ngồi ghế chờ, đến lượt bảng sẽ gọi số ạ.']]); }); };
let vnTab='sim';
UI.vnptDesk=i=>{ open(`Quầy ${i+1} · VNPT`,()=>{ const g=G(), V=SD.VNPT, now=NET.now(), data=g.data&&g.data.until>now;
  const tabs=[['sim','SIM số đẹp'],['pack','Gói data'],['fiber','Cáp quang']].map(([k,n])=>`<button class="tab ${k===vnTab?'on':''}" data-a="vntab" data-k="${k}">${n}</button>`).join('');
  let b=''; if(vnTab==='sim') b=`<p class="muted">Số đang dùng: <b>${g.sim?esc(g.sim.num)+' ('+esc(g.sim.cat)+')':'chưa có'}</b>. Số hiện cạnh tên bạn trong danh sách online.</p><div class="list">${V.sims.map((s,k)=>`<div class="row"><span><b>${s.num==='random'?'09x.xxx.xxx':s.num}</b> <span class="muted">${s.cat}</span><br><small class="good">✨ ${esc((V.simPerks[s.cat]||{}).desc||'')}</small></span><span>${fmt(s.price)} ${btn('vnbuy','Mua',{i:k})}</span></div>`).join('')}</div><p class="muted">SIM nào cũng nhắn tin, gọi điện được cho bạn bè có SIM (mở Điện thoại trong menu Esc).</p>`;
  if(vnTab==='pack') b=packHtml(data,g);
  if(vnTab==='fiber') b=`<p>Lắp cáp quang FiberVNN cho phòng trọ Hà Nội: lướt TikTok ở phòng được <b>×${V.fiber.mul} EXP</b>.</p>${g.flags.fiber?'<p class="muted">✔ Phòng bạn đã có cáp quang.</p>':btn('vnfiber','Lắp ngay · '+fmt(V.fiber.price),{},'pri')}`;
  return `<p class="muted">"Dạ em chào anh/chị, em có thể giúp gì ạ?"</p><div class="tabs">${tabs}</div>${b}`; }); };
function packHtml(data,g){ const V=SD.VNPT; return `<p>Có gói data thì điện thoại dùng 4G, <b>pin hao chậm hơn ${Math.round((1-V.packMul)*100)}%</b>.${data?` Đang dùng <b>${esc(g.data.name)}</b> tới ${SD.vnTime(g.data.until).day.split('-').reverse().join('/')}.`:''}</p>
  <div class="list">${Object.entries(V.packs).map(([k,p])=>`<div class="row"><span><b>${p.name}</b> <span class="muted">${p.h>=48?Math.round(p.h/24)+' ngày':p.h+' giờ'}</span></span><span>${fmt(p.price)} ${btn('vnpack','Đăng ký',{k})}</span></div>`).join('')}</div>`; }
UI.vnptSim=()=>open('Tủ SIM số đẹp',()=>`<p class="muted">Muốn mua thì bốc số ở máy cạnh cửa rồi ra quầy giao dịch nhé.</p><div class="list">${SD.VNPT.sims.map(s=>`<div class="row"><span><b>${s.num==='random'?'09x.xxx.xxx':s.num}</b> <span class="muted">${s.cat}</span></span><span>${fmt(s.price)}</span></div>`).join('')}</div>`);
UI.vnptPack=()=>open('Gói cước data VNPT',()=>{ const g=G(); return packHtml(g.data&&g.data.until>NET.now(),g); });
ACT.vntab=d=>{ vnTab=d.k; UI.refresh(); };
ACT.vnbuy=async d=>{ const s=SD.VNPT.sims[+d.i]; GAME.ask(`Mua số ${s.num==='random'?'ngẫu nhiên':s.num} giá ${fmt(s.price)}?`,'vn_hang',['Mua','Thôi'],async i=>{ if(i) return; const r=await GAME.act({t:'vn',op:'buysim',i:+d.i}); if(r&&!r.err){ GAME.sfx('level_up',.5); GAME.toast(esc(r.msg),'item'); } UI.refresh(); }); };
ACT.vnpack=async d=>{ const r=await GAME.act({t:'vn',op:'pack',k:d.k}); if(r&&!r.err) GAME.toast(esc(r.msg),'item'); UI.refresh(); };
ACT.vnfiber=async()=>{ const r=await GAME.act({t:'vn',op:'fiber'}); if(r&&!r.err) GAME.toast(esc(r.msg),'item'); UI.refresh(); };
PLACE.vntuan=()=>open('Anh Tuấn · kỹ thuật cáp quang',()=>`<p>"Cáp quang giờ kéo về tận bản. Rảnh thì đi với anh lên Ké nối mấy hộp cáp, xong là trên đó lướt mạng vù vù."</p>${qRow('vn_fiber')}${G().flags.wifiKe?'<p class="muted">✔ Wifi ở Ké đã mạnh hơn cho bạn: lướt TikTok ở phòng thuê ×'+SD.VNPT.keWifi+' EXP.</p>':''}`);
PLACE.vnthu=()=>open('Chị Thu · trưởng ca tổng đài',()=>{ const V=SD.VNPT, g=G(); return `<p>"Tổng đài lúc nào cũng đông. Em ngồi bàn trống nghe máy giúp chị: khách hỏi gì cứ lễ phép, đúng trọng tâm là được."</p>${qRow('vn_call')}
  <p class="muted">Mỗi ca ${V.shift} cuộc gọi, khách hài lòng mỗi cuộc +${fmt(V.callPay.vnd)} + ${V.callPay.exp} EXP. Tối đa ${V.shifts} ca/ngày (hôm nay ${g.daily.vncall||0}/${V.shifts}).</p>`; });
PLACE.vnguard=()=>GAME.say([['vn_guard','Vào giao dịch thì bốc số ở máy bên trái cửa nhé cháu. Ngồi ghế chờ, bảng đỏ trên kia gọi số thì ra quầy.'],['vn_guard','Xe máy dắt vào bãi bên hông, bác trông cho.']]);
// Miếu ông Trường Con
PLACE.mieu=()=>open('Ông Từ · Miếu ông Trường Con',()=>{ const M=SD.MIEU, l=SD.lunarDate(NET.now()), h=SD.holyDay(NET.now()), g=G(), mb=g.mbuff&&g.mbuff.until>NET.now();
  return `<p>"Hôm nay mùng ${l.d} tháng ${l.m} âm lịch${h?` · <b>${h}</b>`:''}. Miếu nhỏ của làng, ai qua cũng ghé thắp nén hương cho bình an."</p>
    <p class="muted">Mùng 6 âm lịch hằng tháng là lễ cầu an: thắp hương được phúc gấp đôi, bà Lụa mời bát bánh đa cua lấy lộc. Mùng 1, ngày rằm cũng được phúc gấp đôi.</p>
    <div class="list"><div class="row"><span>🕯 Thắp hương ở lư hương</span><span>${fmt(M.incense.price)} · +${Math.round((M.incense.mul-1)*100)}% EXP ${M.incense.min/60} giờ</span></div>
    <div class="row"><span>🎋 Xin quẻ ở ống xăm</span><span>miễn phí · 1 lần/ngày</span></div><div class="row"><span>🎀 Buộc dải lụa lên cây đa</span><span>${fmt(M.wishPrice)} · mai linh nghiệm</span></div></div>
    ${mb?`<p class="good">Đang có phúc bình an: +${Math.round((g.mbuff.mul-1)*100)}% EXP · còn ${Math.ceil((g.mbuff.until-NET.now())/60000)} phút</p>`:''}${qRow('mieu_cauan')}`; });
let tcJoke=-1;
PLACE.truongcon=()=>open('Ông Trường Con',()=>{ const J=SD.MIEU.jokes; return `<p>${tcJoke<0?'"Ơ kìa, khách quý về miếu đấy à? Ngồi đây ông kể cho nghe, mà nghe xong cười thì nhớ thả tim nhé! Mới Trường Con là như vậy!"':'"'+esc(J[tcJoke])+'"'}</p>${btn('tcjoke','😂 Nghe Ông Trường Con kể chuyện',{},'pri')}${qRow('tc_luocga')}${qRow('tc_raubun')}${qRow('tc_antruc')}${qRow('tc_clip')}
  ${(()=>{ const X=SD.XICHTHO, g=G(); if(g.xt&&g.xt.lv) return ''; const left=X.quests.filter(q=>(g.quests||{})[q]!=='done').length;   /* Xích Thố: xong 4 việc thì nhận ngay trong bảng của ông */
    return left?`<p class="muted">🐎 Giúp ông xong ${left} việc nữa, ông trao ngựa Xích Thố.</p>`:`<p class="good">🐎 Con giúp ông đủ 4 việc rồi, Xích Thố là của con!</p>${btn('xtclaim','🐎 Nhận ngựa Xích Thố',{},'pri big')}`; })()}
  <p class="muted">Xong việc thì mỗi ngày vẫn quay được 1 clip cùng Trường Con ở đèn vòng (+${SD.MIEU.clip.exp} EXP).</p>`; });
ACT.xtclaim=()=>window.XT_CLAIM&&window.XT_CLAIM();
ACT.tcjoke=()=>{ const J=SD.MIEU.jokes; let k; do{ k=Math.floor(Math.random()*J.length); }while(J.length>1&&k===tcJoke); tcJoke=k; GAME.sayLine(J[k],.7,'vi'); UI.refresh(); };
// Group Nghiện Motion
const TR_SAY=['Keyframe ít thôi, quan trọng là timing. Chuyển động đẹp nằm ở graph editor!','Ease in ease out không phải để trang trí. Vật nào cũng có khối lượng của nó.','Render lỗi không sao, mất file project mới đáng sợ. Save, save, save!','Motion đẹp là motion có chủ đích. Mỗi khung hình phải kể được câu chuyện.','Làm xong vào xông hơi 15 phút là đầu óc thông suốt, ý tưởng tự đến.'];
let trSay=0;
PLACE.trong=()=>open('☯ Giáo chủ Trọng Motion',()=>{ const g=G(), N=SD.NMOTION, dis=g.flags&&g.flags.nmDisciple, dk=g.daily.nmdesk||0;
  return `<p>"${esc(TR_SAY[trSay])}"</p>${dis?'<p class="good">☯ Bạn là <b>đệ tử chính thức</b> của Group Nghiện Motion.</p>':''}${btn('trsay','🎬 Nghe Giáo chủ giảng đạo',{},'')}
  ${qRow('nm_ball')}${qRow('nm_easing')}${qRow('nm_logo')}${qRow('nm_reel')}
  <p class="muted">Ngồi bàn làm motion cho khách: ${dk}/3 clip hôm nay (mỗi clip +60.000đ). Phòng xông hơi chung (góc dưới phải): +${N.saunaEnergy} năng lượng, có từ ${N.crowd.n} người trong phòng thì cả hội được +${Math.round((N.crowd.mul-1)*100)}% EXP ${N.crowd.min} phút.</p>`; });
ACT.trsay=()=>{ trSay=(trSay+1)%TR_SAY.length; GAME.sayLine(TR_SAY[trSay],.7,'vi'); UI.refresh(); };
// 120 Yên Lãng · Refund Gaming + Haky Food: nói chuyện (gợi ý nhiệm vụ ẩn), việc thường, nhiệm vụ ẩn đã lộ
const RF_Q=id=>Object.keys(SD.QUESTS).filter(k=>SD.QUESTS[k].giver===id), rfLine={};
function rfRows(id){ const g=G(); return RF_Q(id).filter(k=>!SD.QUESTS[k].secret||g.quests[k]).map(qRow).join(''); }
PLACE.rf=n=>open(SD.NPC_LOOKS[n.id].name,()=>{ const L=SD.RF.lines[n.id]||[], line=rfLine[n.id]||L[0]||'Chào bạn!', hid=RF_Q(n.id).filter(k=>SD.QUESTS[k].secret&&!G().quests[k]).length;
  return `<p>"${esc(line)}"</p>${btn('rftalk','💬 Nói chuyện tiếp',{who:n.id})}${rfRows(n.id)}${hid?'<p class="muted">🔍 Có vẻ người này còn giấu chuyện gì đó... thử lục lọi quanh nhà hoặc nói chuyện thêm.</p>':''}`; });
PLACE.haky=n=>open('Haky Food · bếp nhà anh Độ',()=>{ const L=SD.RF.lines.haky, line=rfLine.haky||L[0];
  return `<p>"${esc(line)}"</p>${btn('rftalk','💬 Nói chuyện tiếp',{who:'haky'})}${rfRows('haky')}<p class="muted">Bếp ở góc trên bên phải. Trứng gà mua ở tiệm thịt Đà Lạt hoặc nhặt trong rừng Ké; gà làm sẵn, rau sống có ở xe bà Lụa (Miếu Hải Phòng).</p>`; });
ACT.rftalk=async d=>{ const r=await GAME.act({t:'rf',op:'talk',who:d.who}); if(!r||r.err) return; if(r.secret){ GAME.sfx('level_up',.5); GAME.bigText('NHIỆM VỤ ẨN!'); GAME.toast(esc(r.msg),'quest'); }
  else rfLine[d.who]=r.msg.replace(/^Jikey: "|"$/g,''); UI.refresh(); };
PLACE.nm_tuck=()=>open(SD.PLACES.nm_tuck.name,()=>menuHtml({...SD.PLACES.nm_tuck,key:'nm_tuck'})+'<p class="muted">Render đêm thì Sting giữ tỉnh, mì gói trứng xúc xích tính là 1 bữa no. Ấm siêu tốc lúc nào cũng có nước sôi.</p>');
PLACE.nmmem=()=>open('Thành viên Nghiện Motion',()=>`<p>"Chào mừng tới group! Ở đây ai cũng nghiện: nghiện motion, nghiện lắp Gunpla, nghiện game đối kháng. Tối nào cũng có người ngồi render tới khuya."</p>
  <div class="list"><div class="row"><span><b>Bàn làm motion</b><br><small class="muted">Việc của Giáo chủ làm ở đây, ngoài ra mỗi ngày nhận 3 clip cho khách.</small></span></div>
  <div class="row"><span><b>Bàn lắp mô hình Gunpla</b><br><small class="muted">Hỏi Gundam đứng cạnh kệ mô hình, có việc lắp RX-78.</small></span></div>
  <div class="row"><span><b>Góc game đối kháng</b><br><small class="muted">Đấu với Eva, thắng được EXP (tối đa 6 ván/ngày).</small></span></div>
  <div class="row"><span><b>Phòng xông hơi chung</b><br><small class="muted">Rủ thêm người vào xông cùng để được buff EXP tập thể.</small></span></div></div>`);
PLACE.gundam=()=>open('Gundam RX-78-2',()=>`<p>(Mắt Gundam loé vàng, giọng rè rè như bộ đàm) "Phi công mới hả? Lắp mô hình là rèn sự kiên nhẫn: cắt runner cho sạch, gọt bavia cho mịn thì máy mới đứng vững."</p>${qRow('gp_build')}${qRow('gp_panel')}
  <p class="muted">Bàn lắp mô hình ở ngay bên trái, đầy runner, kìm cắt và lọ sơn.</p>`);
PLACE.eva=()=>open('Evangelion Unit-01',()=>{ const n=G().daily.nmgame||0; return `<p>(Unit-01 gầm khẽ, hai mắt sáng xanh) "Muốn được công nhận thì thắng tôi ở góc game. Tôi không nương tay đâu."</p>${qRow('ev_win')}
  <p class="muted">Hôm nay đã chơi ${n}/6 ván. Mỗi ván 10 giây, thắng +25 EXP, thua +10 EXP.</p>`; });
PLACE.banhda=()=>open('Bà Lụa · bánh đa cua Hải Phòng',()=>{ const M=SD.MIEU, h=SD.holyDay(NET.now())==='Lễ cầu an mùng 6', free=h&&!G().daily.mieufree;
  return `<p>"Bánh đa đỏ, riêu cua đồng, chả lá lốt, rau muống chẻ. Ăn đi cho ấm bụng cháu!"</p><div class="list">
    <div class="row"><span>🍜 Bánh đa cua <span class="muted">+${M.banhda.energy} năng lượng, tính 1 bữa</span></span><span>${free?'<b class="good">Lộc cầu an: miễn phí</b>':fmt(M.banhda.price)} ${btn('mieufood','Ăn',{k:'banhda'},'pri')}</span></div>
    <div class="row"><span>🥟 Nem cua bể <span class="muted">+${M.nem.energy} năng lượng</span></span><span>${fmt(M.nem.price)} ${btn('mieufood','Ăn',{k:'nem'})}</span></div></div>
    <h5>Bán mang về</h5><div class="list">${Object.entries(M.shop).map(([k,p])=>`<div class="row">${ico(k)}<span>${esc(SD.ITEMS[k].name)} <small class="muted">có ${G().items[k]||0}</small></span><span>${fmt(p)} ${btn('mieubuy','Mua',{k})}</span></div>`).join('')}</div>`; });
ACT.antruc=()=>GAME.act({t:'antruc'}).then(r=>{ if(r&&!r.err){ GAME.sfx('eat',.5); GAME.toast(esc(r.msg),'quest'); } UI.refresh(); });
ACT.mieubuy=d=>GAME.act({t:'mieu',op:'buy',k:d.k}).then(r=>{ if(r&&!r.err) GAME.toast(esc(r.msg),'item'); UI.refresh(); });
ACT.mieufood=async d=>{ const r=await GAME.act({t:'mieu',op:'food',k:d.k}); if(r&&!r.err){ GAME.sfx('eat',.5); GAME.toast(esc(r.msg),'item'); } UI.refresh(); };

/* ---------- Hằng ngày: điểm danh 7 ngày · việc hôm nay + rương · sổ sưu tầm · lễ hội theo mùa ---------- */
let dTab='', dChest=null;
// ảnh thumbnail cho từng việc hằng ngày: nền màu theo loại việc, tia nắng toả từ giữa, icon to, đất / nước dưới chân, lấp lánh
const DQ_TH={fish:['fish','#8fdcf6','#2a6aa8','w'],harvest:['crop_ca_chua','#c8ee90','#4f8a38','s'],forage:['mushroom','#b0e8a0','#3f7a31','g'],bug:['buom_la_xanh','#fbd8ee','#a8509a','g'],
  money:['coin','#ffeb90','#c8901a',''],exp:['*star','#d8c4ff','#6a3ab0',''],meal:['bowl','#ffcf98','#c85a2a',''],grab:['*car','#9ff4c4','#1f8a4a','r'],photo:['photo','#ffdcea','#b8507a',''],
  pickle:['*paddle','#f0f8a0','#5a9a2a','g'],treasure:['tr_binh_gom','#a4e2ea','#2a6a7a','w'],pumpkin:['pumpkin','#ffc478','#6a2a8a','g'],chest:['tr_ruong_bau','#fff0a0','#c0701a','']};
const DQ_ICON={star:P=>{ const c='#ffd84a'; P.rect(6,1,2,3,c); P.rect(5,4,4,2,c); P.rect(1,5,12,2,c); P.rect(3,7,8,2,c); P.rect(4,9,6,2,c); P.rect(3,11,3,2,c); P.rect(8,11,3,2,c); P.px(6,5,'#fff6c0'); P.px(5,6,'#fff6c0'); },
  car:P=>{ P.rect(1,6,12,5,'#1fa84a'); P.rect(3,3,8,4,'#1fa84a'); P.rect(4,4,3,2,'#bff0ff'); P.rect(8,4,2,2,'#bff0ff'); P.rect(1,8,12,1,'#ffffff'); P.disc(4,11,2,'#26262c'); P.disc(10,11,2,'#26262c'); P.px(4,11,'#8a8a94'); P.px(10,11,'#8a8a94'); P.rect(12,7,1,1,'#ffd84a'); },
  paddle:P=>{ P.disc(6,5,4,'#2a6ad0'); P.disc(6,5,3,'#4a8af0'); P.rect(5,9,2,4,'#7a4a2a'); P.disc(11,10,2,'#e8f040'); P.px(10,9,'#ffffff'); }};
const THC={}, hexMix=(a,b,k)=>{ const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)), A=p(a), B=p(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`; };
function dqThumb(id){ if(THC[id]) return THC[id]; const A=ART, d=DQ_TH[id]||DQ_TH.money, c=A.cv(32,32), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  for(let y=0;y<32;y++){ g.fillStyle=hexMix(d[1],d[2],y/31); g.fillRect(0,y,32,1); }
  g.globalAlpha=.22; g.fillStyle='#ffffff'; for(let a=0;a<16;a+=2){ const a0=a*Math.PI/8, a1=(a+1)*Math.PI/8; g.beginPath(); g.moveTo(16,14); g.lineTo(16+Math.cos(a0)*34,14+Math.sin(a0)*34); g.lineTo(16+Math.cos(a1)*34,14+Math.sin(a1)*34); g.fill(); }
  g.globalAlpha=1; const gr=g.createRadialGradient(16,14,1,16,14,13); gr.addColorStop(0,'rgba(255,255,240,.65)'); gr.addColorStop(1,'rgba(255,255,240,0)'); g.fillStyle=gr; g.fillRect(0,0,32,32);
  if(d[3]==='w'){ g.fillStyle='rgba(30,80,140,.55)'; g.fillRect(0,25,32,7); g.fillStyle='rgba(220,244,255,.8)'; for(let x=0;x<32;x+=6){ g.fillRect(x,25,3,1); g.fillRect(x+3,28,2,1); } }
  else if(d[3]==='s'){ g.fillStyle='#7a4e2c'; g.fillRect(0,26,32,6); g.fillStyle='#5a3a20'; for(let x=1;x<32;x+=5) g.fillRect(x,27,3,1); }
  else if(d[3]==='g'){ g.fillStyle='#3f8a31'; g.fillRect(0,27,32,5); g.fillStyle='#6aba4a'; for(let x=0;x<32;x+=3) g.fillRect(x,26+(x%2),1,2); }
  else if(d[3]==='r'){ g.fillStyle='#4a4e56'; g.fillRect(0,26,32,6); g.fillStyle='#f4f4f2'; for(let x=2;x<32;x+=8) g.fillRect(x,28,4,1); }
  let ic; if(d[0][0]==='*'){ ic=A.cv(14,14); DQ_ICON[d[0].slice(1)](A.painter(ic.getContext('2d'))); A.outline(ic); } else ic=A.icon(d[0]);
  g.fillStyle='rgba(20,12,24,.3)'; g.fillRect(9,27,14,2); g.drawImage(ic,0,0,14,14,id==='chest'?1:3,id==='chest'?0:1,id==='chest'?30:26,id==='chest'?30:26);
  g.fillStyle='#ffffff'; for(const [x,y] of [[4,5],[27,7],[25,3]]){ g.fillRect(x,y,1,1); g.fillRect(x-1,y+1,3,1); g.fillRect(x,y+2,1,1); }
  g.strokeStyle='rgba(255,255,255,.35)'; g.strokeRect(.5,.5,31,31);
  return THC[id]=c.toDataURL(); }
UI.daily=(tab)=>{ if(tab) dTab=tab; dChest=null; if(!GAME.DQ) GAME.act({t:'dq',op:'state'}); open('Hằng ngày',dailyHtml,{wide:true}); };
PLACE.bingo=()=>UI.daily('season');
function dailyHtml(){ const D=GAME.DQ, g=G(); if(!D) return '<p class="dim">Đang tải…</p>';
  const season=D.season&&SD.SEASON[D.season], L=D.login, q=D.dq, badge=n=>n?` <span class="dbadge">${n}</span>`:'';
  const nQ=q.list.filter(t=>t.ok&&!t.got).length+(q.list.length&&q.list.every(t=>t.got)&&!q.chest?1:0), nA=Object.entries(SD.ALBUM).filter(([a,z])=>!D.albumGot[a]&&z.items.every(k=>D.seen[k])).length;
  if(!dTab) dTab=!L.claimed?'login':nQ?'quest':'quest';
  const tabs=[['login','Điểm danh'+badge(L.claimed?0:1)],['quest','Việc hôm nay'+badge(nQ)],['album','Sổ sưu tầm'+badge(nA)]]; if(season) tabs.push(['season','🎃 '+season.name]);
  let body='';
  if(dChest) body+=`<div class="dchest pop">${ico('ruong_bau')}<div><b>Mở rương!</b><br>+${fmt(dChest.vnd)} · +${dChest.exp} EXP · ${ico(dChest.item)} ${esc((SD.ITEMS[dChest.item]||{name:dChest.item}).name)}</div></div>`;
  if(dTab==='login'){ const s=L.streak, done=i=>i<s-1||(i===s-1&&L.claimed);
    body+=`<p class="dim">Vào game mỗi ngày để nhận quà, quà to dần tới ngày 7. Lỡ 1 ngày là quay về Ngày 1.</p><div class="d7">${SD.LOGIN7.map((r,i)=>{ const today=i===s-1, st=done(i)?'got':today?'now':'lock';
      const ic=r.chest?ico('ruong_bau'):r.items?ico(Object.keys(r.items)[0]):ico('coin');
      return `<div class="dday ${st}${r.chest?' big':''}"><span>Ngày ${i+1}</span>${ic}<b>${esc(r.label)}</b>${st==='got'?'<i>✔ Đã nhận</i>':today?btn('dlogin','Nhận quà',{},'pri'):'<i>🔒</i>'}</div>`; }).join('')}</div>`; }
  if(dTab==='quest'){ const nGot=q.list.filter(t=>t.got).length, all=q.list.length&&nGot===q.list.length, vn=SD.realTime(NET.now()), left=24*60-(vn.h*60+vn.m), cdn=`${Math.floor(left/60)} giờ ${left%60} phút`;
    body+=`<div class="dqhead"><div><b>VIỆC HÔM NAY</b><span>⏳ Làm mới sau ${cdn}</span></div><div class="dqpips">${q.list.map(t=>`<i class="${t.got?'on':t.ok?'ok':''}"></i>`).join('')}<em>${nGot}/${q.list.length}</em></div></div><div class="dq2">`+q.list.map((t,i)=>{ const def=SD.DAYQ.pool[t.id]; if(!def) return '';
      const pct=Math.round(t.n/def.goal*100), seg=def.goal<=10?def.goal:0, kk=v=>v>=1e6?(Math.round(v/1e5)/10+'tr'):v>=1000?Math.round(v/1000)+'K':String(v), num=t.id==='money'||t.id==='exp'?`${kk(t.n)}/${kk(def.goal)}`:`${t.n}/${def.goal}`, st=t.got?'got':t.ok?'ready':'';
      const chips=(def.rw.vnd?`<span class="chip coin"><img src="${GAME.icon64('coin')}" alt="">${fmt(def.rw.vnd)}</span>`:'')+(def.rw.exp?`<span class="chip xp">★ ${def.rw.exp} EXP</span>`:'');
      return `<div class="dqc ${st}"><div class="dqt"><img src="${dqThumb(t.id)}" alt=""><span>${num}</span></div><div class="dqm"><b>${esc(def.name)}</b>
        <div class="dqbar${seg?' seg':''}" style="${seg?`--seg:${seg}`:''}"><i style="width:${pct}%"></i></div><div class="dqr">${chips}</div></div>
        <div class="dqa">${t.got?'':t.ok?btn('dget','NHẬN',{i},'dqget'):btn('dgo','Đi làm ➜',{id:t.id},'dqgo')}</div>${t.got?'<em class="stamp">ĐÃ NHẬN</em>':''}</div>`; }).join('')+
      `<div class="dqc chest ${q.chest?'got':all?'ready':''}"><div class="dqt big"><img src="${dqThumb('chest')}" alt=""></div><div class="dqm"><b>RƯƠNG NGÀY</b><span class="muted">Nhận đủ thưởng ${q.list.length} việc để mở</span>
        <div class="dqr"><span class="chip coin"><img src="${GAME.icon64('coin')}" alt="">${fmt(SD.DAYQ.chest.vnd[0])}–${fmt(SD.DAYQ.chest.vnd[1])}</span><span class="chip xp">★ ${SD.DAYQ.chest.exp} EXP</span><span class="chip gift">🎁 1 món ngẫu nhiên</span></div></div>
        <div class="dqa">${q.chest?'':all?btn('dchest','MỞ RƯƠNG',{},'dqget'):`<span class="lock">🔒 ${nGot}/${q.list.length}</span>`}</div>${q.chest?'<em class="stamp">ĐÃ MỞ</em>':''}</div></div>`; }
  if(dTab==='album'){ body+=`<p class="dim">Lần đầu có một món là được ghi vào sổ. Đủ bộ thì nhận thưởng lớn.</p>`+Object.entries(SD.ALBUM).map(([a,z])=>{ const have=z.items.filter(k=>D.seen[k]).length, full=have===z.items.length, got=D.albumGot[a];
      return `<div class="dalb ${full?'full':''}"><h5>${esc(z.name)} <small>${have}/${z.items.length}</small></h5><div class="dgrid">${z.items.map(k=>{ const it=SD.ITEMS[k]||SD.CLOTHES[k]||{name:k}, seen=D.seen[k];
        return `<div class="dcell ${seen?'':'unk'}" title="${seen?esc(it.name):'Chưa có'}">${ico(SD.ITEMS[k]?k:'hat')}<span>${seen?esc(it.name):'???'}</span></div>`; }).join('')}</div>
        ${z.hints&&!full?`<ul class="dhint">${z.items.filter(k=>!D.seen[k]&&z.hints[k]).map(k=>`<li><b>${esc((SD.ITEMS[k]||{}).name||k)}:</b> ${esc(z.hints[k])}</li>`).join('')}</ul>`:''}
        <div class="drw">Thưởng đủ bộ: ${fmt(z.rw.vnd)} · ${z.rw.exp} EXP ${got?'<i>✔ Đã nhận</i>':full?btn('dalbum','Nhận thưởng',{al:a},'pri'):''}</div></div>`; }).join(''); }
  if(dTab==='season'&&season){ const n=g.items.bi_ngo||0, bg=(g.flags&&g.flags.bingo)||{}, end=season.to.split('-').reverse().join('/');
    if(!(g.flags||{}).hwFree) body+=`<p>${btn('hwopen','🎃 Nhận 1 bộ trang phục Halloween miễn phí (15 bộ để chọn)',{},'pri')}</p>`;
    body+=`<div class="dseason"><p>Từ ${season.from.split('-').reverse().join('/')} tới ${end}: bí ngô mọc rải khắp <b>Ké Retreat</b> và <b>Đà Lạt</b> (chấm cam trên minimap), mỗi giờ đổi chỗ. Hái bí rồi mang tới <b>Cô Bí Ngô</b> ở cổng Ké đổi quà. Tối đến đèn bí ngô ở cổng sáng lập loè.</p>
      <div class="dhave">${ico('bi_ngo')} Bạn có <b>${n}</b> quả bí ngô ${btn('dgo','Tìm bí gần nhất ➜',{id:'pumpkin'},'go')}</div>
      <div class="dshop">${season.shop.map(it=>{ const own=!it.again&&bg[it.id], can=n>=it.cost&&!own; return `<div class="dsi ${own?'got':''}">${ico(it.item?it.item:it.cloth==='ao_bingo'?'ao_bingo':it.cloth?'mu_phuthuy':'bi_ngo')}<div><b>${esc(it.name)}</b><span>${esc(it.desc)}</span></div><div class="dcost">${it.cost} 🎃 ${own?'<i>✔ Có rồi</i>':btn('bingo','Đổi',{id:it.id},can?'pri':'')}</div></div>`; }).join('')}</div>
      ${GAME.S&&GAME.S.kind==='retreat'?goBtn('bingo','Cô Bí Ngô'):''}</div>`; }
  return `<div class="tabs">${tabs.map(([k,n])=>`<button class="tab ${k===dTab?'on':''}" data-a="dtab" data-k="${k}">${n}</button>`).join('')}</div><div class="daily">${body}</div>`; }
ACT.nhosac=()=>GAME.nhoSac();
ACT.dtab=d=>{ dTab=d.k; dChest=null; UI.refresh(); };
ACT.dlogin=async()=>{ const r=await GAME.act({t:'dq',op:'login'}); if(r&&!r.err){ GAME.sfx('level_up',.5); if(r.chest) dChest=r.chest; } UI.refresh(); };
ACT.dget=async d=>{ const r=await GAME.act({t:'dq',op:'get',i:+d.i}); if(r&&!r.err) GAME.sfx('item_pickup',.5); UI.refresh(); };
ACT.dchest=async()=>{ const r=await GAME.act({t:'dq',op:'chest'}); if(r&&r.chest){ dChest=r.chest; GAME.sfx('level_up',.6); } UI.refresh(); };
// quà Halloween: chọn 1 trong 15 bộ trang phục, có hình xem trước theo đúng ngoại hình của mình
const HW_IMG=new Map(); function hwImg(id){ const look=G().look, k=id+JSON.stringify(look); if(!HW_IMG.has(k)){ const av=AVATAR.build({...look,outfit:{...look.outfit,top:id}}), fr=av.anims.idle_down.frames[0], c=document.createElement('canvas'); c.width=64; c.height=90; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(fr,0,2,32,45,0,0,64,90); HW_IMG.set(k,c.toDataURL()); } return HW_IMG.get(k); }
UI.hwPick=()=>open('🎃 Quà Halloween: chọn 1 bộ trang phục miễn phí',()=>`<p>Mừng lễ hội Halloween, Chan City tặng mỗi người <b>1 bộ trang phục</b>. Chọn kỹ nhé, mỗi người chỉ được nhận 1 bộ! Nhận xong là mặc luôn, đổi lại trong Tủ đồ (U).</p>
  <div class="hwgrid">${SD.HW_SETS.map(([id,name])=>`<div class="hwc"><img src="${hwImg(id)}" width="64" height="90" alt=""><b>${esc(name)}</b>${btn('hwclaim','Nhận',{k:id},'pri')}</div>`).join('')}</div>`,{wide:true,static:true});
ACT.hwopen=()=>UI.hwPick();
ACT.hwclaim=async d=>{ const r=await GAME.act({t:'dq',op:'hwclaim',k:d.k}); if(r&&!r.err){ UI.closeAll(); GAME.sfx('level_up',.7); GAME.bigText('HAPPY HALLOWEEN!'); GAME.toast(esc(r.msg),'item'); } };
// tự mời nhận quà Halloween tối đa 1 lần/ngày trên mỗi máy (lần sau vào lại từ Hằng ngày → Lễ hội), đi qua hàng đợi bảng tự bật
let HW_ASK=0; NET.listen('dq',m=>{ if(HW_ASK||m.season!=='halloween'||(G()&&G().flags&&G().flags.hwFree)) return; HW_ASK=1;
  const day=new Date().toDateString(); try{ if(localStorage.getItem('chande-hw-ask')===day) return; }catch(e){}
  UI.autoOpen('hw',()=>{ const g=G(); if(g&&g.flags&&g.flags.hwFree) return; try{ localStorage.setItem('chande-hw-ask',day); }catch(e){} UI.hwPick(); }); });
ACT.dalbum=async d=>{ const r=await GAME.act({t:'dq',op:'album',a:d.al}); /* data-a là tên hành động nên khoá bộ đặt là al */ if(r&&!r.err) GAME.sfx('level_up',.6); UI.refresh(); };
ACT.dgo=d=>GAME.dqGo(d.id);
ACT.bingo=async d=>{ const r=await GAME.act({t:'bingo',id:d.id}); if(r&&!r.err) GAME.sfx('item_pickup',.6); UI.refresh(); };
PLACE.pkshop=()=>open('Chị Hà · đồ pickleball',()=>{ const g=G(), sets=SD.PK_SETS, card=z=>{ const have=Object.values(z.items).every(k=>g.owned[k]), wearing=Object.entries(z.items).every(([sl,k])=>g.look&&g.look.outfit[sl]===k), img=pkPreview(z);
    return `<div class="row tall"><span style="display:flex;gap:8px;align-items:center">${img?`<img src="${img}" alt="" style="width:48px;height:72px;object-fit:contain;image-rendering:pixelated;background:#3f7fae;border:2px solid ${z.premium?'#d4a83a':'#3a3a44'}">`:''}<span><b>${esc(z.name)}</b>${z.premium?' <b class="good">★ PREMIUM</b>':''}<br><small class="muted">${z.g==='nam'?'Nam':'Nữ'} · áo, ${z.bottom==='skirt'?'váy':'quần'}, giày${z.cap?', mũ':''}${z.premium?' · mặc đủ bộ thắng trận ×1,5 EXP':''}</small></span></span>
      <span>${have?(wearing?'đang mặc':'đã có'):fmt(z.price)}</span>${have?(wearing?'':btn('pkwear','Mặc',{id:z.id},'pri')):btn('pkbuy','Mua & mặc',{id:z.id},'pri')}</div>`; };
  return money()+`<p>"Ra sân thì phải đẹp mới đánh hay! Chị có 10 set chuẩn pickleball, 2 set premium hàng tuyển thủ."</p>
    <h5>Set nam</h5><div class="list">${sets.filter(z=>z.g==='nam').map(card).join('')}</div><h5>Set nữ</h5><div class="list">${sets.filter(z=>z.g==='nu').map(card).join('')}</div>
    <p class="muted">Đồ đã mua nằm trong tủ đồ (phím U), thay lẻ từng món được.</p>`; },{wide:true});
ACT.pkbuy=async d=>{ const r=await req({t:'pk',op:'buyset',id:d.id,wear:true}); if(!r.err) GAME.toast(esc(r.msg),'item'); };
ACT.pkwear=async d=>{ const r=await req({t:'pk',op:'wearset',id:d.id}); if(!r.err) GAME.toast(esc(r.msg),'item'); };
ACT.pklesson=async()=>{ const r=await GAME.act({t:'pk',op:'lesson'}); if(!r.err) UI.closeAll(); };
ACT.pkjoin=d=>req({t:'pk',op:'join',seat:+d.seat}); ACT.pkleave=()=>req({t:'pk',op:'leave'});
ACT.pkstart=async()=>{ const r=await req({t:'pk',op:'start'}); if(!r.err) UI.closeAll(); };

PLACE.qnt=()=>open('Quang Nịnh Thần (QNT)',()=>{ const F=SD.YENLANG.flatter, done=G().daily&&G().daily.qnt;
  return `<p>"Ôi anh/chị đến rồi! Nhìn thần thái này là biết khách VIP của anh Độ!"</p><p class="muted">QNT nịnh 1 câu mỗi ngày: +${Math.round((F.buff.mul-1)*100)}% EXP trong ${F.buff.min} phút, +${F.energy} năng lượng.</p>
    ${done?'<p class="muted">Hôm nay nghe nịnh rồi, mai quay lại.</p>':btn('qntflatter','Nghe QNT nịnh',{},'pri')}`; });
ACT.qntflatter=async()=>{ const r=await req({t:'yl',op:'flatter'}); if(!r.err) GAME.toast(esc(r.msg),'quest'); };

/* ---------- Huy Phan: chuỗi việc thiết kế (Lumen Studio / DAS) ---------- */
UI.huyphan=()=>open('Huy Phan · việc thiết kế',()=>{ const g=G(), ids=Object.keys(SD.QUESTS).filter(k=>SD.QUESTS[k].giver==='huyphan'&&SD.QUESTS[k].job);
  const rows=ids.map(id=>{ const q=SD.QUESTS[id], st=g.quests[id], ok=!!(g.qprog||{})[id], locked=q.after&&g.quests[q.after]!=='done';
    const r=locked?'<p class="muted">Làm xong việc trước đã.</p>':!st?btn('qstart','Nhận việc: '+q.title,{id},'pri'):st==='active'?(ok?btn('qfinish','Báo cáo: '+q.title,{id},'pri'):`<p>${esc(q.job.label)} ở <b>${esc(SD.DEST[q.job.where].name)}</b></p><button class="btn sm qgo" data-go="${id}">➜ Chỉ đường</button>`):'<p class="muted">Đã xong.</p>';
    return `<h5>${q.title}${st==='done'?' ✓':''}</h5><p class="muted">${q.desc} Thưởng ${q.reward.exp} EXP + ${fmt(q.reward.vnd)}.</p>${r}`; }).join('');
  return `<p>"Ké sắp đổi nhận diện mới, anh cần người làm thiết kế. Việc nhiều mà lương cao, chịu khó chạy sang Lumen với DAS nhé!"</p>${rows}`; },{wide:true});

/* ---------- Phòng của Diệp ---------- */
PLACE.diep=()=>open('Diệp',()=>{ const D=SD.DIEP, g=G(), d=SD.vnTime(NET.now()).day, n=g.diep&&g.diep.day===d?g.diep.n:0, exp=Math.min(D.cook.expMax,Math.round(D.cook.expK*Math.sqrt(Math.max(0,g.money)/1e6)));
  return `<p>"Sang chơi hả? Ngồi vào bàn đi, mình nấu ramen cho ăn. Mà nói trước nha, ít tiền quá (dưới ${fmt(D.kick)}) là mình đuổi về đó!"</p>
    <p>Hôm nay Diệp đã nấu <b>${n}/${D.cook.daily}</b> bữa cho bạn. Ăn đồ Diệp nấu lúc này được khoảng <b>+${exp} EXP</b> (càng nhiều tiền trong người càng nhiều EXP, tối đa ${D.cook.expMax}), +${D.cook.energy} năng lượng, tính là 1 bữa.</p>
    <p class="muted">Ngồi vào bàn trải khăn đỏ giữa phòng rồi bấm E để nhờ Diệp nấu.</p>`; });

/* ---------- ai đang online (bấm nút ở góc trên) ---------- */
let onlineList=null;
UI.online=()=>{ onlineList=null; NET.req({t:'who'}).then(r=>{ onlineList=r.list||[]; UI.refresh(); });
  open('Đang online',()=>{ if(!onlineList) return '<p class="muted">Đang tải...</p>'; const L=[...onlineList].sort((a,b)=>(b.id===NET.pid)-(a.id===NET.pid)||b.lv-a.lv);
    return `<p><b>${L.length}</b> người đang chơi.</p><div class="list olist">${L.map(w=>`<div class="row"><span class="${w.id===NET.pid?'you':''}">${esc(w.n)}${w.id===NET.pid?' (bạn)':''}</span><span class="muted">cấp ${w.lv}${w.sim?' · 📱 '+esc(w.sim):''}${w.where?' · '+esc(w.where):''}</span></div>`).join('')}</div>`; }); };

/* ---------- Ộ i i: khô gà đè tem + shisha ở Nhà giải trí ---------- */
UI.oii=()=>open('Ộ i i',()=>{ const g=G(), row=id=>{ const q=SD.QUESTS[id], st=g.quests[id], kg=Math.min(g.items.khoga||0,10), sh=(g.qprog||{}).shisha||0;
    const ok=id==='khoga'?kg>=10:sh>=1, prog=id==='khoga'?`Đã gom ${kg}/10 gói.`:'Chưa hút shisha cùng Ộ i i.';
    const r=!st?btn('qstart','Nhận việc: '+q.title,{id},'pri'):st==='active'?(ok?btn('qfinish','Báo cáo: '+q.title,{id},'pri'):`<p>${prog}</p><button class="btn sm qgo" data-go="${id}">➜ Chỉ đường</button>`):'<p class="muted">Đã xong việc này.</p>';
    return `<h5>${q.title}</h5><p class="muted">${q.desc} Thưởng ${q.reward.exp} EXP + ${fmt(q.reward.vnd)}.</p>${r}`; };
  return `<p><i>"Alo Hải à em... Thôi em đừng có chối."</i></p>${row('khoga')}${row('shisha')}`; });

/* ---------- Đôn Chề: bánh mì Dân Tổ + đua xe bốc đầu ---------- */
UI.donche=n=>open('Đôn Chề',()=>{ const g=G(), q=SD.QUESTS.banhmi, st=g.quests.banhmi, prog=(g.qprog||{}).banhmi||0, W=SD.WHEELIE;
  const qrow=!st?btn('qstart','Nhận việc: '+q.title,{id:'banhmi'},'pri'):st==='active'?(prog>=q.eat.n?btn('qfinish','Báo cáo: đã ăn đủ '+q.eat.n+' lần',{id:'banhmi'},'pri'):`<p>Đã ăn ${prog}/${q.eat.n} bánh mì Dân Tổ.</p>${goBtn('banhmi','quán bánh mì Dân Tổ')}`):'<p class="muted">Đã xong việc bánh mì.</p>';
  return `<h5>${q.title}</h5><p class="muted">${q.desc} Thưởng ${q.reward.exp} EXP + ${fmt(q.reward.vnd)}.</p>${qrow}
    <h5>Đua xe bốc đầu (${g.daily.stunt||0}/${W.daily} hôm nay)</h5><p class="muted">Đi cùng Đôn Chề lên đường đèo. Có tín hiệu "CHUẨN BỊ BỐC ĐẦU" thì bấm SPACE đúng lúc vạch chạy tới mốc đỏ. Trượt hoặc không bấm có thể xoè xe (-${W.energy} năng lượng, -${W.clean} sạch sẽ). Xong có thể bị công an bắt (bốc đầu càng nhiều càng dễ bị để ý): phạt ${fmt(W.fine)} hoặc tạm giữ ${W.jail} giây. Ngoài đời đừng làm nhé!</p>
    ${btn('stunt','Lên đường đèo (chọn xe ở gara đầu đèo)','','pri')}`; });
// gara đầu đèo: 4 xe, chỉ số dạng thanh, chọn xong là xuất phát
const bar=(v,col)=>`<span class="sbar"><i style="width:${Math.round(Math.max(.06,Math.min(1,v))*100)}%;background:${col}"></i></span>`;
UI.garage=()=>open('Gara đầu đèo · chọn xe',()=>`<div class="fsg garage"><p class="ghint">Đôn Chề: "Chọn con nào thì chọn, xe xịn bốc đầu ngọt hơn nhưng tốn tiền thuê!" · Ví <b>${fmt(G().money)}</b></p><div class="gcards">${Object.entries(SD.BIKES).map(([k,b])=>`<div class="gcard">
    <img src="${GAME.bikeIcon(k)}" alt=""><h4>${esc(b.name)}</h4><p class="muted">${esc(b.desc)}</p>
    <div class="gstat"><span>Tốc độ</span>${bar((b.speed-150)/70,'#5aa9ff')}<span>Dễ bốc đầu</span>${bar((b.window-170)/120,'#7de07a')}<span>Bám đường</span>${bar((.6-b.fall)/.35,'#ffd84a')}<span>Thưởng</span>${bar((b.pay-.8)/.8,'#f2a6b8')}<span>Công an để ý</span>${bar(.5+b.police*5,'#ff6a55')}</div>
    <b class="gprice">${b.price?fmt(b.price):'MIỄN PHÍ'}</b>${btn('pickbike','Chọn xe này',{bike:k},'pri')}</div>`).join('')}</div>${btn('quitstunt','Thôi, về sân lửa trại')}</div>`,{full:true,static:true});
ACT.pickbike=async d=>{ const r=await GAME.act({t:'stunt',op:'bike',bike:d.bike}); if(r.err) return; };
ACT.quitstunt=async()=>{ UI.closeAll(); await GAME.act({t:'stunt',op:'quit'}); };
ACT.qstart=async d=>{ const r=await GAME.act({t:'quest',id:d.id,op:'start'}); if(!r.err){ GAME.sfx('quest_accept',.5); GAME.toast(`Nhận nhiệm vụ: <b>${esc(SD.QUESTS[d.id].title)}</b>`,'quest'); } UI.refresh(); };
ACT.qfinish=async d=>{ const r=await GAME.act({t:'quest',id:d.id,op:'finish'}); if(!r.err) GAME.sfx('quest_complete',.6); UI.refresh(); };
ACT.stunt=async()=>{ const r=await GAME.act({t:'stunt',op:'start'}); if(!r.err) UI.closeAll(); };
PLACE.danto=()=>open('Bánh mì Dân Tổ',()=>{ const q=SD.QUESTS.banhmi, st=G().quests.banhmi, n=(G().qprog||{}).banhmi||0;
  return menuHtml({...SD.PLACES.danto,key:'danto'})+`<p class="muted">Bánh mì ăn lúc nào cũng được, không tính là bữa chính.</p>`+(st==='active'?`<p>Nhiệm vụ Đôn Chề: đã ăn <b>${Math.min(n,q.eat.n)}/${q.eat.n}</b>${n>=q.eat.n?' · về báo Đôn Chề nhận thưởng':''}</p>`:''); });
PLACE.congan=()=>open('Đồn công an Đà Bắc · Chú Dũng',()=>{ const j=G().jail, now=NET.now();
  if(j&&j.until>now) return `<p class="bad">Bạn đang bị tạm giữ vì ${esc(j.why||'đua xe trái phép')}. Còn ${Math.ceil((j.until-now)/1000)} giây.</p>${btn('fine','Nộp phạt '+fmt(j.fine)+' để về','','pri')}<p class="muted">Không nộp thì đợi hết giờ là được về.</p>`;
  const im=G().impound; if(im) return `<p class="bad">Xe ${esc(im.model)} của bạn đang bị tạm giữ ở đồn (CSGT cẩu về vì trả lời sai luật giao thông).</p>${btn('redeem','Nộp phạt '+fmt(im.fee)+' lấy lại xe','','pri')}`;
  return '<p>Chú Dũng: "Đi đường nhớ đội mũ bảo hiểm, không đua xe, không bốc đầu nhé cháu!"</p>'; });
ACT.redeem=async()=>{ const r=await GAME.act({t:'csgt',op:'redeem'}); if(!r.err){ GAME.toast(esc(r.msg),'quest'); UI.closeAll(); } };
ACT.fine=async()=>{ const r=await GAME.act({t:'police',op:'fine'}); if(!r.err){ GAME.toast(esc(r.msg),'quest'); UI.closeAll(); } };
PLACE.baove=()=>{ const j=G().extra&&G().extra.job; GAME.say([['baove',j&&j.hired&&j.today&&j.today.ot&&!j.today.otDone?'Có lịch OT tối nay à? Lên làm đi cháu, xong sớm còn về.':'Giờ này văn phòng đóng cửa rồi cháu ơi. Chị Vy với sếp về nhà cả rồi. Ngày thường 8 giờ sáng tới 8 giờ tối quay lại nhé.']]); };

/* ---------- Phòng Bay: nhảy kiểu Audition ---------- */
let danceInput=null, lastDRound=-1, djudge=null;
UI.dance=()=>open('Phòng Bay',()=>danceHtml(GAME.DANCE),{full:true});
const stars=bpm=>'★'.repeat(Math.max(1,Math.min(5,Math.round((bpm-90)/14))))+'☆'.repeat(5-Math.max(1,Math.min(5,Math.round((bpm-90)/14))));
function danceHtml(v){ if(!v) return '<p class="muted">Đang tải...</p>'; const me=v.me, pf=n=>`<img class="pface round" src="${GAMES.portraitURL(n)}" alt="">`;
  const status=v.st==='idle'?'Sàn trống · chọn 1 bài để mở sàn, ai vào trong 12 giây thì nhảy cùng':v.st==='lobby'?`Bài <b>${esc(v.songName)}</b> · ${v.bpm} BPM · bắt đầu sau <b>${Math.ceil(v.lobbyLeft/1000)}s</b>`:v.st==='play'?`Đang nhảy <b>${esc(v.songName)}</b> · lượt ${v.round+1}/${v.rounds}`:'Hết bài · xem bảng xếp hạng';
  return `<div class="fsg bay"><div class="bayhead"><h2>PHÒNG BAY</h2><p>🎧 Bot DJ Thái Hoàng đang lên nhạc · ${status}</p></div>
    ${v.st==='idle'?`<div class="baysongs">${SD.SONGS.map(s=>`<div class="bsong"><b>${esc(s.name)}</b><span>${s.bpm} BPM · <i>${stars(s.bpm)}</i></span>${btn('djoin','Mở bài này',{song:s.id},'pri')}</div>`).join('')}</div>`:''}
    <div class="baymid"><div class="baydancers"><h5>Trên sàn (${v.dancers.length}/${SD.DANCE.maxDancers})</h5>${v.dancers.map((d,i)=>`<div class="bdancer ${i===me?'me':''}">${pf(d.name)}<b>${esc(d.name)}</b><span>${d.score} điểm · ${d.pf} perfect</span></div>`).join('')||'<p class="muted">Chưa có ai</p>'}</div>
      ${v.results?`<div class="bayres"><h5>Xếp hạng</h5>${v.results.map((r,i)=>`<div class="bdancer ${i===0?'win':''}"><span class="brank">${i+1}</span>${pf(r.name)}<b>${esc(r.name)}</b><span>${r.score} điểm</span></div>`).join('')}</div>`:''}</div>
    <div class="baybar">${v.st==='lobby'&&me<0?btn('djoin','LÊN SÀN NHẢY CÙNG',{song:v.song},'pri'):''}${v.st==='lobby'&&me>=0?btn('dleave','Rời sàn'):''}${btn('close','Xem mọi người nhảy')}</div>
    <p class="bayhint">Mỗi lượt hiện chuỗi mũi tên: gõ đúng bằng phím ← ↑ → ↓ (hoặc WASD, hoặc bấm nút to trên màn hình), rồi bấm SPACE đúng lúc vạch hồng chạy vào ô vàng. PERFECT liền nhau được combo. Nhiệm vụ Khá Bảnh: 8 PERFECT trong 1 bài. Bo Bot Dancer ${fmt(SD.DANCE.tip)} để được hôn ♥</p></div>`; }
ACT.djoin=d=>req({t:'dance',op:'join',song:d.song}); ACT.dleave=()=>req({t:'dance',op:'leave'});
// nút to trên màn hình khi đang nhảy (chuột / cảm ứng)
const dbtns=document.createElement('div'); dbtns.id='danceBtns'; dbtns.hidden=true;
dbtns.innerHTML=[['arrowleft','←','L'],['arrowup','↑','U'],['arrowdown','↓','D'],['arrowright','→','R'],[' ','SPACE','S']].map(([k,l,c])=>`<button type="button" class="dbtn d${c}" data-k="${k}">${l}</button>`).join('');
document.body.appendChild(dbtns);
dbtns.addEventListener('pointerdown',e=>{ const b=e.target.closest('[data-k]'); if(!b) return; e.preventDefault(); b.classList.add('hit'); setTimeout(()=>b.classList.remove('hit'),120); danceKeys(new Set([b.dataset.k])); });
UI.danceView=v=>{ if(cur&&cur.t==='Phòng Bay') draw(); const on=v.st==='play'&&v.me>=0; dbtns.hidden=!on;
  if(on){ if(cur&&cur.t==='Phòng Bay') UI.closeAll(); if(v.round!==lastDRound){ lastDRound=v.round; danceInput={r:v.round,keys:[],sent:false}; } } else if(v.st!=='play'){ danceInput=null; lastDRound=-1; } };
UI.danceHit=m=>{ const v=GAME.DANCE; if(v&&m.i===v.me) djudge={j:m.j,combo:m.combo,t:performance.now()}; };
function danceKeys(pressed){ const v=GAME.DANCE; if(!v||v.st!=='play'||!danceInput||danceInput.sent) return;
  for(const k of pressed){ const a=KEY2[k]; if(a&&danceInput.keys.length<v.seq.length){ danceInput.keys.push(a); if(v.seq[danceInput.keys.length-1]!==a){ danceInput.keys=[]; danceInput.shake=performance.now(); GAME.sfx('blip',.3); } }
    if(k===' '){ danceInput.sent=true; NET.send({t:'dance',op:'hit',r:v.round,keys:danceInput.keys,off:NET.now()-v.beat}); } } }
// mũi tên kiểu Audition: ô vuông bo góc, mỗi hướng 1 màu, gõ đúng thì sáng lên
const DCOL={L:'#ff5fa8',U:'#5ad1ff',R:'#ffd84a',D:'#7de07a'}, JCOL={PERFECT:'#ffd84a',GREAT:'#7de07a',COOL:'#7fe0ff',BAD:'#ff9f2e',MISS:'#ff6a55'};
function arrowTile(g,cx,cy,s,dir,state,t){ const col=DCOL[dir], r=s*.18, x=cx-s/2, y=cy-s/2, pulse=state==='next'?1+Math.sin(t/90)*.06:1;
  g.save(); g.translate(cx,cy); g.scale(pulse,pulse); g.translate(-cx,-cy);
  g.fillStyle=state==='done'?col:'rgba(20,14,34,.88)'; g.strokeStyle=state==='todo'?'rgba(255,255,255,.35)':col; g.lineWidth=4; if(state==='done'){ g.shadowColor=col; g.shadowBlur=18; }
  g.beginPath(); g.roundRect(x,y,s,s,r); g.fill(); g.stroke(); g.shadowBlur=0;
  g.translate(cx,cy); g.rotate({U:0,R:Math.PI/2,D:Math.PI,L:-Math.PI/2}[dir]); g.beginPath(); g.moveTo(0,-s*.36); g.lineTo(s*.32,0); g.lineTo(s*.13,0); g.lineTo(s*.13,s*.34); g.lineTo(-s*.13,s*.34); g.lineTo(-s*.13,0); g.lineTo(-s*.32,0); g.closePath();
  g.fillStyle=state==='done'?'#1c1430':col; g.fill(); g.lineWidth=3; g.strokeStyle='#1c1430'; g.stroke(); g.restore(); }
UI.danceOverlay=g=>{ const v=GAME.DANCE; if(!v||v.st!=='play') return; const W=innerWidth, H=innerHeight, now=NET.now(), t=performance.now();
  g.textBaseline='alphabetic';
  // bảng điểm bên trái
  g.textAlign='left'; v.dancers.forEach((d,i)=>{ const y=110+i*34; g.fillStyle=i===v.me?'rgba(255,216,74,.22)':'rgba(20,14,34,.75)'; g.fillRect(12,y,270,30); g.fillStyle=i===v.me?'#ffd84a':'#fff3d6'; g.font='22px VT323, monospace'; g.fillText(`${i+1}. ${d.name}`,20,y+21); g.textAlign='right'; g.fillText(`${d.score}${d.j?' · '+d.j:''}`,276,y+21); g.textAlign='left'; });
  // tên bài + lượt ở giữa trên
  g.textAlign='center'; g.font='26px VT323, monospace'; g.fillStyle='rgba(20,14,34,.75)'; g.fillRect(W/2-220,58,440,34); g.fillStyle='#ff9fe0'; g.fillText(`♪ ${v.songName} · ${v.bpm} BPM · lượt ${v.round+1}/${v.rounds}`,W/2,83);
  if(v.me<0) return; const me=v.dancers[v.me]||{score:0,combo:0};
  g.textAlign='right'; g.font='56px VT323, monospace'; g.fillStyle='#ffd84a'; g.fillText(me.score.toLocaleString('vi-VN'),W-24,150); g.font='24px VT323, monospace'; g.fillStyle='#fff3d6'; g.fillText(me.combo>1?`COMBO x${me.combo}`:'ĐIỂM',W-24,176);
  // chuỗi mũi tên
  const ks=danceInput?danceInput.keys:[], n=v.seq.length, S=Math.min(76,(W-80)/n-10), gap=S+12, Y=H-250, sh=danceInput&&t-(danceInput.shake||0)<250?Math.sin(t/20)*8:0;
  g.fillStyle='rgba(20,14,34,.6)'; g.fillRect(W/2-(n*gap)/2-20,Y-S/2-18,n*gap+40,S+36);
  v.seq.forEach((a,i)=>arrowTile(g,W/2+(i-(n-1)/2)*gap+sh,Y,S,a,i<ks.length?'done':i===ks.length?'next':'todo',t));
  // vạch nhịp: 8 phách, ô vàng ở phách cuối
  const BW=Math.min(680,W-60), BX=W/2-BW/2, BY=Y+S/2+30, k=Math.max(0,Math.min(1,(now-v.roundStart)/v.roundMs)), mk=7/8;
  g.fillStyle='#1c1430'; g.fillRect(BX-4,BY-4,BW+8,30); g.fillStyle='#3a2f50'; g.fillRect(BX,BY,BW,22); for(let b=1;b<8;b++){ g.fillStyle='#5a4a72'; g.fillRect(BX+b*BW/8,BY,2,22); }
  g.fillStyle='#ffd84a'; g.fillRect(BX+mk*BW-14,BY-8,28,38); g.fillStyle='#ff5fa8'; g.shadowColor='#ff5fa8'; g.shadowBlur=12; g.fillRect(BX+k*BW-3,BY-6,6,34); g.shadowBlur=0;
  g.textAlign='center'; g.font='22px VT323, monospace'; g.fillStyle='#c9b9e6'; g.fillText(danceInput&&danceInput.sent?'Đã bấm · đợi lượt sau':'Gõ đúng mũi tên rồi bấm SPACE khi vạch hồng vào ô vàng',W/2,BY+56);
  // PERFECT! to, nảy lên
  if(djudge&&t-djudge.t<1000){ const e=(t-djudge.t)/1000, sc=1+.5*Math.max(0,1-e*4), a=e<.7?1:1-(e-.7)/.3; g.save(); g.globalAlpha=a; g.translate(W/2,Y-S/2-70); g.scale(sc,sc);
    g.font='84px VT323, monospace'; g.lineWidth=8; g.strokeStyle='#1c1430'; g.strokeText(djudge.j+'!',0,0); g.fillStyle=JCOL[djudge.j]; g.fillText(djudge.j+'!',0,0);
    if(djudge.combo>1){ g.font='36px VT323, monospace'; g.strokeText('x'+djudge.combo+' COMBO',0,40); g.fillStyle='#fff3d6'; g.fillText('x'+djudge.combo+' COMBO',0,40); } g.restore(); } };

/* ---------- bảng xếp hạng toàn game ---------- */
let lbTab='exp', LB=null;
// chip danh hiệu top 10 đại gia trong bảng xếp hạng (hiệu ứng CSS khớp với chữ trên đầu nhân vật)
// ảnh mặt người chơi trong bảng xếp hạng (dựng từ dáng người, nhớ theo dáng)
const LBFACE={}; const lbFace=l=>{ if(!l) return ''; const k=JSON.stringify(l); if(LBFACE[k]!==undefined) return LBFACE[k]; let u=''; try{ const av=AVATAR.build(l); u=av&&av.portrait?av.portrait.toDataURL():''; }catch(e){} return LBFACE[k]=u; };
const ttl=rk=>{ const D=SD.TOP_TITLES[rk-1]; return D?`<span class="ttl ttl${rk}" data-t="${esc(D.name)}"><i>${rk===1?'♛ ':rk===7?'🐐 ':''}${esc(D.name)}</i></span>`:''; };
const LB_TABS=[['exp','Cấp độ',v=>v+' EXP'],['money','Đại gia',v=>fmt(v)],['power','Lực chiến MU',v=>v.toLocaleString('vi-VN')+' ⚔'],['fish','Cần thủ',v=>v+' con cá'],['harvest','Nông dân',v=>v+' nông sản'],['dance','Vũ công Phòng Bay',v=>v+' điểm'],['know','Hiểu biết',v=>v+' 📚'],['donate','Mạnh thường quân',v=>fmt(v)],['home','Nhà đẹp',v=>v+' điểm'],['goals','Vua phá lưới',v=>v+' bàn']];
UI.leaderboard=async()=>{ open('Bảng xếp hạng',()=>lbHtml(),{wide:true}); const r=await NET.req({t:'lb'}); if(r.lb){ LB=r.lb; UI.refresh(); } };
function lbHtml(){ const tab=LB_TABS.find(t=>t[0]===lbTab), rows=LB&&LB[lbTab]||[], me=G().name;
  return `<div class="tabs">${LB_TABS.map(([k,n])=>`<button class="tab ${k===lbTab?'on':''}" data-a="lbtab" data-k="${k}">${n}</button>`).join('')}</div>
    ${LB?`${lbTab==='money'?'<p class="muted">Top 10 đại gia được danh hiệu óng ánh hiện trên đầu nhân vật.</p>':''}${lbTab==='home'?'<p class="muted">Điểm nhà = độ ấm cúng (nội thất, sàn, tường) + 2 điểm mỗi người thích. Bấm Ghé thăm để vào xem nhà đang mở cửa.</p>':''}<div class="list rows">${rows.map((r,i)=>`<div class="row ${r.n===me?'on':''}${lbTab==='money'&&i<10?' tt'+(i+1):''}"><span class="lbn"><b>${i<3?['🥇','🥈','🥉'][i]:i+1+'.'}</b>${(f=>f?`<img class="lbf" src="${f}" alt="">`:'<i class="lbf"></i>')(lbFace(r.l))} ${esc(r.n)} <small class="muted">${lbTab==='power'?'MU Lv':'cấp'} ${r.lv}</small>${lbTab==='money'&&i<10?ttl(i+1):''}</span><span>${tab[2](r.v)}</span>${lbTab==='home'&&r.o?btn('lbvisit','🏠 Ghé thăm',{i,n:r.n}):''}</div>`).join('')||`<p class="muted">Chưa ai có thành tích mục ${esc(tab[1])}. Làm trước là lên top 1 luôn!</p>`}</div><p class="muted">${LB.total} người chơi trong game · cập nhật 30 giây/lần</p>`:'<p class="muted">Đang tải...</p>'}`; }
ACT.lbtab=d=>{ lbTab=d.k; draw(); };
ACT.lbvisit=async d=>{ const r=await GAME.act({t:'home',op:'visit',i:+d.i,n:d.n}); if(r&&!r.err) UI.closeAll(); };   /* ghé thăm nhà đẹp (home.js) */
/* ---------- câu cá kiểu Dota 2: chọn bóng cá → phao chìm bấm nhanh → giữ vùng xanh bám cá ---------- */
let FS=null;
UI.fish=async()=>{ const r=await GAME.act({t:'fish',op:'open'}); if(r.err) return; FS={fish:r.fish,st:'look',t0:performance.now(),mx:180,my:110,p:.2,zone:.5,vz:0,fy:.5,fv:0};
  open('Câu cá',()=>`<div class="fishfs"><canvas id="fishCv"></canvas><div id="fishMsg" class="fishmsg">Bấm chuột vào bóng cá muốn câu. Cá to khó kéo hơn, cá lấp lánh được gấp đôi EXP.</div><div class="fishhelp">Chuột: chọn cá · SPACE/chuột: giật & giữ để kéo · Esc: thôi câu · còn ${Math.max(0,SD.FISHING.daily-(G().daily.fish||0))} lượt hôm nay</div></div>`,{static:true,full:true}); fishSize(); fishLoop(); };
function fishSize(){ const c=$('#fishCv'); if(!c) return; const r=c.parentElement.getBoundingClientRect(), s=Math.max(2,Math.round(Math.min(r.width/300,r.height/190))); c.width=Math.floor(r.width/s); c.height=Math.floor(r.height/s); FS.scale=s; }
addEventListener('resize',()=>{ if(FS) fishSize(); });
const fishPos=(f,t)=>{ const s=f.seed, a=(s%628)/100, b=(s%377)/60; return [180+130*Math.sin(t*(.25+(s%7)/40)+a), 110+70*Math.sin(t*(.33+(s%5)/30)+b)]; };
function fishLoop(){ if(!FS) return; const c=$('#fishCv'); if(!c){ endFish(); return; } const t=(performance.now()-FS.t0)/1000;
  FS.geo=GAMES.drawFishScene(c,FS,t,fishPos);
  if(FS.st==='bite'){ const g=c.getContext('2d'); g.font=`${Math.round(c.height/7)}px VT323, monospace`; g.fillStyle='#ff6a55'; g.textAlign='center'; g.fillText('! GIẬT NGAY (SPACE)',c.width/2,c.height*.18); }
  if(FS.st==='reel'){ // kéo cá: giữ SPACE (hoặc giữ chuột) để nâng vùng xanh bám theo con cá
    const F=SHARED.FISHING.sizes[FS.size], dt=1/60, hold=GAME.keys.has(' ')||FS.mouse;
    FS.fv+=(Math.random()-.5)*F.jitter*.9; FS.fv*=.94; FS.fy=Math.max(.03,Math.min(.97,FS.fy+FS.fv*dt)); if(FS.fy<=.03||FS.fy>=.97) FS.fv*=-.6;
    FS.vz+=(hold?1.2:-.9)*dt; FS.vz*=.9; FS.zone=Math.max(F.zone/2,Math.min(1-F.zone/2,FS.zone+FS.vz*dt)); if(FS.zone<=F.zone/2||FS.zone>=1-F.zone/2) FS.vz=0;
    const over=Math.abs(FS.fy-FS.zone)<F.zone/2; FS.p+=over?dt*1.1/F.reel:-dt*.08; FS.p=Math.min(1,FS.p);
    GAMES.drawReel(c,FS,F,over); const g=c.getContext('2d'); g.font=`${Math.round(c.height/14)}px VT323, monospace`; g.fillStyle='#fff3d6'; g.textAlign='right'; g.fillText('Giữ SPACE / chuột để nâng vùng xanh',c.width-80,c.height-8);
    if(FS.p>=1) landFish(true); else if(FS.p<=0) landFish(false); }
  FS.raf=requestAnimationFrame(fishLoop); }
async function landFish(ok){ if(FS.st!=='reel') return; FS.st='landing'; const r=await NET.req({t:'fish',op:'land',ok}); const m=$('#fishMsg');
  if(r.item){ GAME.sfx('item_pickup',.6); GAME.toast(`Câu được <b>${esc(SD.ITEMS[r.item].name)}</b>${r.sparkle?' lấp lánh':''} · +${r.exp} EXP`,'vnd'); const f=FS.fish.find(x=>x.i===FS.target); if(f) f.gone=true; if(m) m.textContent='Dính rồi! Chọn con khác hoặc Esc để thôi.'; }
  else if(m) m.textContent=r.msg||r.err||'Cá thoát rồi';
  FS.st='look'; FS.bx=undefined; if(!FS.fish.some(f=>!f.gone)){ if(m) m.textContent='Hết cá ở đây rồi, chỗ khác thử xem'; } }
function endFish(){ if(FS){ cancelAnimationFrame(FS.raf); FS=null; NET.send({t:'fish',op:'stop'}); } }
// toạ độ chuột → khung logic 360×220 của mặt hồ (hồ chiếm 80% chiều cao màn câu)
const fishXY=e=>{ const rc=e.target.getBoundingClientRect(), L=FS.geo?FS.geo.LH/e.target.height:.8; return [(e.clientX-rc.left)*360/rc.width,Math.min(219,(e.clientY-rc.top)*220/(rc.height*L))]; };
inner.addEventListener('mousemove',e=>{ if(!FS||e.target.id!=='fishCv') return; [FS.mx,FS.my]=fishXY(e); });
inner.addEventListener('mousedown',e=>{ if(FS&&e.target.id==='fishCv'&&FS.st==='reel') FS.mouse=true; });
addEventListener('mouseup',()=>{ if(FS) FS.mouse=false; });
inner.addEventListener('click',async e=>{ if(!FS||e.target.id!=='fishCv') return; [FS.mx,FS.my]=fishXY(e); const t=(performance.now()-FS.t0)/1000;
  if(FS.st==='bite') return hookFish();
  if(FS.st!=='look') return; let best=null, bd=1e9; for(const f of FS.fish){ if(f.gone) continue; const [x,y]=fishPos(f,t), d=Math.hypot(x-FS.mx,y-FS.my); if(d<f.size*9+18&&d<bd){ bd=d; best=f; } }
  if(!best){ $('#fishMsg').textContent='Thả trúng bóng cá mới câu được'; return; }
  const r=await NET.req({t:'fish',op:'cast',i:best.i}); if(r.err){ $('#fishMsg').textContent=r.err; return; } FS.st='wait'; FS.target=best.i; FS.size=best.size; FS.bx=FS.mx; FS.by=FS.my; GAME.sfx('dash',.3); $('#fishMsg').textContent='Đợi phao chìm...'; });
async function hookFish(){ if(!FS||FS.st!=='bite') return; FS.st='hooking'; const r=await NET.req({t:'fish',op:'hook'});
  if(r.miss||r.err){ $('#fishMsg').textContent=r.msg||r.err; FS.st='look'; FS.bx=undefined; return; } FS.st='reel'; FS.p=.4; FS.zone=.5; FS.vz=0; FS.fy=.5; FS.fv=0; $('#fishMsg').textContent='Kéo!'; }
UI.fishBite=()=>{ if(FS&&FS.st==='wait'){ FS.st='bite'; GAME.sfx('blip',.5); } };
const oldClose=UI.closeAll; UI.closeAll=()=>{ endFish(); oldClose(); };

/* ---------- lọ: giữ thanh "phê" trong vùng xanh đủ lâu (bấm SPACE / chuột liên tục), quá đỏ là hỏng ---------- */
let LOG=null;
ACT.lo=async()=>{ UI.closeAll(); const r=await GAME.act({t:'lo',op:'start'}); if(r.err) return; if(r.fined){ GAME.toast(esc(r.msg),'lock'); GAME.sfx('dash',.6); return; }
  LOG={v:.2,inZone:0,t0:performance.now(),last:performance.now(),done:false};
  open('Giải toả',()=>`<div class="fsg lofs"><canvas id="loCv" width="160" height="110"></canvas><div class="loside"><h3>Đang xem "phim"...</h3><p>Bấm <kbd>SPACE</kbd> hoặc chuột liên tục để giữ thanh trong <b class="good">vùng xanh</b> đủ ${SD.LO.hold} giây. Lên vùng đỏ là... xong sớm.</p><div class="lobar"><i id="loFill"></i><b></b></div><p id="loMsg" class="muted"></p>${btn('loquit','Thôi, tắt máy')}</div></div>`,{static:true,full:true});
  requestAnimationFrame(loLoop); };
ACT.loquit=()=>loEnd(false);
function loPump(){ if(LOG&&!LOG.done) LOG.v=Math.min(1.05,LOG.v+.06); }
async function loEnd(ok){ if(!LOG||LOG.done) return; LOG.done=true; const r=await GAME.act({t:'lo',op:'end',ok}); UI.closeAll(); LOG=null; if(!r.err&&r.msg) GAME.toast(esc(r.msg),ok?'exp':'lock'); }
function loLoop(){ if(!LOG||LOG.done) return; const c=$('#loCv'); if(!c){ loEnd(false); return; } const t=performance.now(), dt=Math.min(.05,(t-LOG.last)/1000); LOG.last=t;
  LOG.v=Math.max(0,LOG.v-dt*.22); const z=LOG.v>=.55&&LOG.v<=.85; if(z) LOG.inZone+=dt;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#1c1516'; g.fillRect(0,0,160,110); g.fillStyle='#2a2a30'; g.fillRect(40,4,80,102);
  for(let y=10;y<100;y+=6) for(let x=46;x<114;x+=6){ const h=Math.floor((Math.sin(x*.3+t/300)+Math.cos(y*.2+t/250))*40+120); g.fillStyle=`rgb(${h+60},${h-20},${h})`; g.fillRect(x,y,6,6); }   // màn hình đã che mờ
  g.fillStyle='#e04848'; g.fillRect(64,46,32,16); g.fillStyle='#fff'; g.font='12px VT323, monospace'; g.textAlign='center'; g.fillText('18+ ĐÃ CHE',80,58);
  const f=$('#loFill'); if(f){ f.style.height=Math.round(Math.min(1,LOG.v)*100)+'%'; f.style.background=LOG.v>.85?'#ff6a55':z?'#7de07a':'#ffd84a'; }
  const m=$('#loMsg'); if(m) m.textContent=`Trong vùng xanh: ${LOG.inZone.toFixed(1)}/${SD.LO.hold}s`;
  if(LOG.v>1){ if(m) m.textContent='Ối... xong sớm quá!'; setTimeout(()=>loEnd(false),600); LOG.done=true; return; }
  if(LOG.inZone>=SD.LO.hold){ loEnd(true); return; }
  requestAnimationFrame(loLoop); }
inner.addEventListener('pointerdown',e=>{ if(LOG&&e.target.closest('.lofs')&&!e.target.closest('[data-a]')) loPump(); });

/* ---------- bot tiếp khách ở Nhà giải trí ---------- */
PLACE.botco=()=>open('Lê Quang Liêm · bot cờ vua',()=>`<p>"Làm một ván không? Chọn mức cược, tôi cược bằng."</p><div class="col">${SD.CLUB.chess.bets.map(b=>btn('vsbot',b?'Cược '+fmt(b):'Chơi vui (0đ)',{bet:b})).join('')}</div>`,{static:true});
ACT.vsbot=async d=>{ const free=SD.CLUB.tables.filter(t=>t.game==='chess'); for(const t of free){ const v=(await NET.req({t:'tbl',op:'peek',id:t.id})).v; if(v&&v.st!=='play'&&!v.seats.some(Boolean)){ GAME.walkTo(t.x,t.y+.9,t.name,async()=>{ const r=await GAME.act({t:'tbl',op:'join',id:t.id,bet:+d.bet}); if(r.err) return; tableId=t.id; await NET.req({t:'tbl',id:t.id,op:'bot'}); UI.tableView((await NET.req({t:'tbl',op:'peek',id:t.id})).v); }); UI.closeAll(); return; } } GAME.toast('Các bàn cờ đều có người','lock'); };
PLACE.botpoker=()=>GAME.say([['botpoker','Ngồi vào bàn poker (mua chip) rồi bấm "Thêm bot" là có 3 bot vào chơi cùng. Bot thua thì tiền về tay bạn, thắng thì chip về nhà cái.']]);
PLACE.dj=()=>UI.dance();
PLACE.dancebot=n=>GAME.say([[n.id,{hlinh:'Lên sàn quẩy với chị đi em ơi!',lebao:'Nhạc lên rồi, đừng đứng im thế!',ccmk:'Nhảy đi, đừng ngại, sai thì nhảy lại!'}[n.id]||'Quẩy lên!']],()=>UI.dance());
PLACE.dancer=n=>GAME.ask(`Bo Bot Dancer ${fmt(SD.DANCE.tip)} để được hôn?`,n.id,['Bo luôn','Thôi'],async i=>{ if(i!==0) return; const r=await GAME.act({t:'tip'}); if(!r.err) GAME.toast(esc(r.msg),'quest'); });
// chú Ba: bán 9 giống chó giữ vườn Ké, mỗi con 1 năng lực
const dogIco=k=>{ const s=ART.dog(k,0), c=document.createElement('canvas'); c.width=54; c.height=42; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,54,42); return c.toDataURL(); };
PLACE.kennel=()=>open('Chú Ba · thuê đất vườn Ké, chó giữ vườn',()=>{ const g=G(), d=g.dog&&SD.DOGS[g.dog.k], K=g.keLand, day=SD.vnTime(NET.now()).day, cur=K&&K.paid===day&&SD.KE_LAND.find(x=>x.id===K.tier);
  return money()+`<h5>Đất vườn Ké: thuê theo ngày hoặc mua đứt</h5><p class="muted">${K&&K.own&&cur?`Đã mua đứt <b>${esc(cur.name)}</b>: trồng được ${cur.plots} ô, không phải trả tiền thuê.`:cur?`Đang thuê <b>${esc(cur.name)}</b>: trồng được ${cur.plots} ô.`:`Chưa thuê: trồng được ${SD.FARM.free} ô miễn phí.`} Rau chín phải thu trong ${SD.FARM.grace} giây, quá giờ người khác cướp được.</p>
    <div class="list">${SD.KE_LAND.map(t=>`<div class="row ${cur&&cur.id===t.id?'on':''}"><span><b>${esc(t.name)}</b> · ${t.plots} ô</span><span>${fmt(t.price)}/ngày</span>${cur&&cur.id===t.id?`<em>${K&&K.own?'của bạn':'đang thuê'}</em>`:K&&K.own?'':btn('keland','Thuê',{t:t.id},'pri')}${K&&K.own?'':btn('kelandbuy',`Mua đứt ${fmt(t.buy)}`,{t:t.id})}</div>`).join('')}</div>${K&&K.own&&cur?btn('kelandsell',`Bán lại cho chú Ba · +${fmt(cur.sellBack)}`):cur?btn('kelandcancel','Trả đất'):''}
    <p class="muted">Mua đứt = 30 ngày tiền thuê, không bị trừ tiền hằng ngày; cần tiền thì bán lại cho chú Ba 70% giá mua.</p>
    <h5>Chó giữ vườn</h5>`+`<p>${d?`Bạn đang nuôi <b>${esc(d.name)}</b>: ${esc(d.desc)}.`:'Chưa có chó. Trộm cướp rau mà gặp chó là bị cắn, phải đền tiền cho chủ vườn!'} Chó ngồi canh cạnh các ô rau của bạn ở Ké.</p>
    <div class="list">${Object.entries(SD.DOGS).map(([k,D])=>`<div class="row ${g.dog&&g.dog.k===k?'on':''}"><img class="ico dogi" src="${dogIco(k)}" alt=""><span><b>${esc(D.name)}</b><br><small class="muted">${esc(D.desc)}</small></span><span>${fmt(D.price)}</span>${g.dog&&g.dog.k===k?'<em>đang nuôi</em>':btn('buydog','Mua',{k},'pri')}</div>`).join('')}</div>${guardHtml()}`; },{wide:true});
ACT.keland=d=>req({t:'dog',op:'land',tier:d.t}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); });
ACT.kelandbuy=d=>{ const t=SD.KE_LAND.find(x=>x.id===d.t); if(confirm(`Mua đứt ${t.name} ở vườn Ké giá ${fmt(t.buy)}?`)) req({t:'dog',op:'landbuy',tier:d.t}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'quest'); }); };
ACT.kelandsell=()=>{ if(confirm('Bán lại đất vườn Ké cho chú Ba (70% giá mua)?')) req({t:'dog',op:'landsell'}).then(r=>{ if(!r.err) GAME.toast(esc(r.msg),'vnd'); }); };
ACT.kelandcancel=()=>{ if(confirm('Trả đất vườn Ké?')) req({t:'dog',op:'landcancel'}); };
ACT.buydog=async d=>{ if(G().dog&&!confirm('Đổi chó? Con cũ chú Ba nuôi hộ, không hoàn tiền.')) return; const r=await req({t:'dog',op:'buy',k:d.k}); if(!r.err){ GAME.sfx('dog_bark',.6); GAME.toast(esc(r.msg),'quest'); } };
// DAS: thầy Huy Tạ đăng ký khoá học, xem chứng chỉ, đứng lớp làm giảng viên
PLACE.das=()=>open('DAS · thầy Huy Tạ',()=>{ const g=G(), r=g.das||{c:{},certs:[]}, D=SD.DAS, sc=g.lumen&&g.lumen.scholar&&!g.lumen.scholar.done?g.lumen.scholar:null,
    fee=c=>sc&&sc.free>0?'<b class="good">Miễn phí (học bổng Lumen)</b>':sc&&sc.half>0?`<s>${fmt(c.fee)}</s> <b class="good">${fmt(Math.round(c.fee/2))}</b> (Lumen −50%)`:fmt(c.fee), boost=Math.min(D.maxBoost,(r.certs||[]).reduce((a,k)=>a+(D.courses[k]?D.courses[k].boost:0),0)), T=D.teach;
  return money()+`<p>"Chào em! Học ở DAS xong có chứng chỉ, xin việc Everfit dễ hơn (đủ ${D.skipInterview} chứng chỉ là nhận thẳng) và lương cao hơn."</p>
    ${g.level<D.level?`<p class="bad">DAS nhận học viên từ cấp ${D.level}</p>`:''}${sc?`<p class="good">Học bổng Lumen: còn ${sc.free} khoá miễn phí, ${sc.half} khoá giảm 50%</p>`:''}
    <p>Chứng chỉ: <b>${(r.certs||[]).length}</b>${r.certs&&r.certs.length?' ('+r.certs.map(k=>esc(D.courses[k].name)).join(', ')+')':''} · lương Everfit <b class="good">+${Math.round(boost*100)}%</b></p>
    <h5>Khoá học (ngồi ghế trong lớp, mỗi buổi cách nhau ${D.gapH} tiếng)</h5><div class="list">${Object.entries(D.courses).map(([k,c])=>{ const e=r.c&&r.c[k], has=(r.certs||[]).includes(k);
      return `<div class="row"><span><b>${esc(c.name)}</b><br><small class="muted">${c.sessions} buổi × ${c.dur}s · lương Everfit +${Math.round(c.boost*100)}% · +${c.exp} EXP/buổi</small></span><span>${has?'đã có chứng chỉ':e?`đang học ${e.n}/${c.sessions}${dasWait(e)}`:fee(c)}</span>${has||e?'':btn('dasenroll','Đăng ký',{k},'pri')}</div>`; }).join('')}</div>
    <h5>Làm giảng viên</h5><p class="muted">Cần ${T.needCerts} chứng chỉ + cấp ${T.level}. Lên bục giảng trong lớp đứng lớp ${T.dur}s: ${fmt(T.pay)}/buổi, tối đa ${T.daily} buổi/ngày.</p>`; },{wide:true});
const dasWait=e=>{ const w=(e.at||0)+SD.DAS.gapH*3600e3-NET.now(); const mn=Math.ceil(w/60e3); return w>0?` · buổi sau: ${mn>=60?Math.floor(mn/60)+'h':''}${mn%60?mn%60+'p':''} nữa`:' · học được rồi'; };
ACT.dasenroll=async d=>{ const r=await req({t:'das',op:'enroll',k:d.k}); if(!r.err) GAME.toast(esc(r.msg),'quest'); };
UI.dasStudy=()=>{ const r=G().das||{c:{}}, ks=Object.keys(r.c||{}); if(!ks.length){ GAME.toast('Chưa đăng ký khoá nào. Gặp thầy Huy Tạ ở quầy','lock'); return; }
  if(ks.length===1) return GAME.act({t:'das',op:'study',k:ks[0]});
  open('Học khoá nào?',()=>`<div class="col">${ks.map(k=>btn('dasstudy',esc(SD.DAS.courses[k].name)+` (${r.c[k].n}/${SD.DAS.courses[k].sessions})`,{k},'pri')).join('')}</div>`); };
ACT.dasstudy=d=>{ UI.closeAll(); GAME.act({t:'das',op:'study',k:d.k}); };
PLACE.duongvu=()=>{ const r=G().das||{c:{},certs:[]}, en=Object.keys(r.c||{}).length, c=(r.certs||[]).length;
  GAME.say([['duongvu',c>=SD.DAS.teach.needCerts?'Em đủ chuẩn đứng lớp rồi đấy, lên bục giảng thử một buổi xem!':en?'Vào ghế ngồi đi em, buổi hôm nay mình học tiếp nhé.':'Muốn học thì đăng ký với thầy Huy Tạ ở quầy lễ tân trước nha.']]); };
PLACE.sunhung=()=>GAME.say([['sunhung','Design không chỉ đẹp, phải hiểu người dùng. Ngồi đây nghe anh kể chuyện research đi.'],['sunhung','Muốn học bài bản thì đăng ký khoá với thầy Huy Tạ nhé.']]);
PLACE.sv=n=>GAME.say([[n.id,['Học ở đây vui lắm, thầy Huy Tạ giảng hay cực!','Mai em thuyết trình đồ án UX, run quá...','Có chứng chỉ DAS xin Everfit dễ hơn đó!'][n.x%3|0]]]);
// bảng Vườn & chuồng: mọi ô rau đang trồng và vật nuôi của mình, thanh thời gian tới lúc thu / cho ăn (tự cập nhật mỗi giây)
const left=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return s>=3600?`${Math.floor(s/3600)} giờ ${Math.floor(s%3600/60)} phút`:s>=60?`${Math.floor(s/60)} phút ${s%60}s`:`${s}s`; };
const tline=(k,col,txt)=>`<div class="tline"><i style="width:${Math.round(Math.max(0,Math.min(1,k))*100)}%;background:${col}"></i><span>${txt}</span></div>`;
UI.farm=()=>{ open('Vườn & chuồng',farmHtml,{wide:true}); clearInterval(UI._farmT); UI._farmT=setInterval(()=>{ if(cur&&cur.t==='Vườn & chuồng') draw(); else clearInterval(UI._farmT); },1000); };
function farmHtml(){ const g=G(), now=NET.now(), P=GAME.plots||{}, mine=Object.entries(P).filter(([id,p])=>p.o===NET.pub);
  const plotRow=([id,p])=>{ const c=SD.CROPS[p.c], ke=id[0]==='k', d=ke?SD.FARM.plots[+id.slice(1)]:SD.DALAT.plots[+id.slice(1)], ripe=p.at+c.grow*1000, grace=(p.g||SD.FARM.grace)*1000, st=SD.plotState(p,now);
    const [k,col,txt]=now<ripe?[1-(ripe-now)/(c.grow*1000),'#7de07a',`chín sau ${left(ripe-now)}`]:ke&&now<ripe+grace?[1,'#ffd84a',`CHÍN RỒI · thu trong ${left(ripe+grace-now)} kẻo bị cướp`]:[1,ke?'#ff6a55':'#ffd84a',ke?'quá giờ, người khác cướp được!':'chín rồi, ra thu hoạch'];
    return `<div class="row">${ico(p.c)}<span><b>${esc(c.name)}</b> <small class="muted">${ke?'vườn Ké':'Đà Lạt'} · ô ${id}${p.s?` · bị cướp ${p.s}`:''}</small>${tline(k,col,txt)}</span>${btn('gotoxy','Đi tới ➜',{x:d.x,y:d.y+1,l:c.name},'go')}</div>`; };
  const aniRow=(a,i)=>{ const A=SD.ANIMALS[a.k], total=A.cycle*1000, ke=a.loc==='ke';
    const [k,col,txt]=!a.cyc?[0,'#ff6a55','đói · cần cho ăn '+SD.FEED[A.feed].name.toLowerCase()]:now<a.cyc?[1-(a.cyc-now)/total,'#7fe0ff',`${A.feeds?`lứa ${a.fed+1}/${A.feeds} · `:''}xong sau ${left(a.cyc-now)}`]:[1,'#ffd84a','xong lứa, ra thu'];
    return `<div class="row">${ico(A.product)}<span><b>${esc(A.name)}</b> <small class="muted">${ke?'sân gà Ké':'Đà Lạt'}</small>${tline(k,col,txt)}</span></div>`; };
  const an=g.animals||[];
  return `<h5>Rau đang trồng (${mine.length})</h5><div class="list">${mine.sort((a,b)=>a[1].at+SD.CROPS[a[1].c].grow*1000-(b[1].at+SD.CROPS[b[1].c].grow*1000)).map(plotRow).join('')||'<p class="muted">Chưa trồng gì. Mua hạt ở tiệm cô Ké (Ké) hoặc bác Trang (Đà Lạt).</p>'}</div>
    <p class="muted">Chỉ thấy ô ở map bạn đã ghé gần đây.</p>
    <h5>Vật nuôi (${an.length})</h5><div class="list">${an.map(aniRow).join('')||'<p class="muted">Chưa nuôi con nào. Mua ở trại chú Sáu (Đà Lạt), gà ở tiệm cô Ké.</p>'}</div>`; }
/* ---------- khu mở rộng: thuê xe, cafe, siêu thị, quán nhậu, tiệm net, bảo tàng, chùa, vườn quốc gia ---------- */
PLACE.thuexe=()=>open('Tiệm thuê xe máy · Anh Tùng',()=>{ const g=G(), m=g.moto, now=NET.now(), M=SD.MOTO.models, names={wave:'Wave',dream:'Dream Thái',exciter:'Exciter',sh:'SH'};
  return money()+`<p>${m&&m.until>now?`Đang thuê <b>${names[m.model]}</b>, còn ${Math.ceil((m.until-now)/60000)} phút. Bấm <kbd>H</kbd> để lên/xuống xe (chạy được ở Ké, thị trấn, Đà Lạt).`:'Thuê xe chạy cho nhanh, trả theo giờ.'}</p>
    <p>Mũ bảo hiểm: ${g.helmet?'<b class="good">đã có, lên xe tự đội</b>':`<b class="bad">chưa có</b> · không đội dễ bị CSGT phạt ${fmt(SD.CSGT.fine)} ${btn('helmet','Mua mũ '+fmt(SD.MOTO.helmet),{},'pri')}`}</p>
    <div class="list">${Object.entries(M).filter(([k,b])=>!b.bike).map(([k,b])=>`<div class="row"><img class="ico bike" src="${GAME.bikeIcon(k)}" alt=""><span><b>${names[k]}</b><br><small class="muted">nhanh gấp ${b.speed.toFixed(1)} lần chạy bộ</small></span><span>${fmt(b.price)}/giờ</span>${btn('rentmoto','Thuê 1 giờ',{k},'pri')}</div>`).join('')}</div>`; },{wide:true});
ACT.helmet=async()=>{ const r=await GAME.act({t:'moto',op:'helmet'}); if(!r.err) GAME.toast(esc(r.msg),'item'); };
ACT.rentmoto=async d=>{ const r=await GAME.act({t:'moto',op:'rent',model:d.k}); if(r.err) return; UI.closeAll(); GAME.mountMoto(); };   // thuê xong: đóng bảng, lên xe lái luôn
for(const k of ['cafe2','sieuthi','nhau']) PLACE[k]=()=>open(SD.PLACES[k].name,()=>menuHtml({...SD.PLACES[k],key:k})+(k==='nhau'?'<p class="muted">Rượu cần, bia hơi uống vào say chuếnh choáng, đi loạng choạng một lúc đấy!</p>':''),{wide:true});
PLACE.net=()=>open('Tiệm net Cỏ',()=>{ const N=SD.NETCAFE, d=G().daily; return money()+`<div class="col">${btn('netdo',`Chơi game online · ${fmt(N.game.fee)} · ${N.game.dur}s (+${N.game.exp} EXP)`,{op:'game'},'pri')}${btn('netdo',`Lướt web học hỏi · ${fmt(N.web.fee)} · +1 hiểu biết (${d.web||0}/${N.web.daily} hôm nay)`,{op:'web'})}</div>`; });
ACT.netdo=d=>{ UI.closeAll(); GAME.act({t:'netcafe',op:d.op}); };
PLACE.baotang=()=>open('Bảo tàng lịch sử Hoà Bình',()=>{ const g=G(), M=SD.MUSEUM, d=SD.vnTime(NET.now()).day, mu=g.mus&&g.mus.day===d?g.mus:null;
  return money()+(mu?`<p>Đã có vé hôm nay. Tìm hiểu từng hiện vật: +1 hiểu biết mỗi món.</p>`:`<p>Vé tham quan <b>${fmt(M.ticket)}</b>/ngày.</p>${btn('musticket','Mua vé','','pri')}`)+
    `<div class="list">${M.exhibits.map((e,i)=>`<div class="row tall"><span><b>${esc(e.name)}</b>${mu&&mu.seen[i]?`<br><small>${esc(e.fact)}</small>`:''}</span>${mu?(mu.seen[i]?'<em>đã xem</em>':btn('muslearn','Tìm hiểu',{i},'pri')):''}</div>`).join('')}</div>`; },{wide:true});
ACT.musticket=()=>req({t:'museum',op:'ticket'}); ACT.muslearn=d=>req({t:'museum',op:'learn',i:+d.i}).then(r=>{ if(r.fact) GAME.toast(esc(r.fact),'item'); });
PLACE.chua=()=>open('Chùa Đà Bắc · Sư thầy',()=>{ const g=G(), tp=(g.daily.temple)||{}, TP=SD.TEMPLE, lb=g.lbuff&&g.lbuff.until>NET.now()?g.lbuff:null;
  return money()+`<p>"A di đà Phật. Thí chủ lên chùa thắp nén hương, cầu bình an."</p>${lb?`<p class="good">Đang có phúc: +${Math.round((lb.mul-1)*100)}% EXP, còn ${Math.ceil((lb.until-NET.now())/60000)} phút</p>`:''}
    <div class="col">${tp.pray?'<p class="muted">Hôm nay đã thắp hương</p>':btn('tpray',`Thắp hương (miễn phí · phúc +${Math.round((TP.pray.mul-1)*100)}% EXP ${TP.pray.min} phút)`,{},'pri')}
    ${tp.fortune?`<p>Quẻ hôm nay: <b>${esc(tp.fortune)}</b></p>`:btn('tfortune','Xin quẻ đầu ngày')}</div>
    <h5>Công đức</h5><div class="list">${TP.donate.map(o=>`<div class="row"><span>${fmt(o.v)}</span><span>phúc +${Math.round((o.mul-1)*100)}% EXP · ${o.min} phút</span>${btn('tdonate','Công đức',{v:o.v})}</div>`).join('')}</div>`; },{wide:true});
ACT.tpray=()=>req({t:'temple',op:'pray'}); ACT.tdonate=d=>req({t:'temple',op:'donate',v:+d.v}); ACT.tfortune=()=>req({t:'temple',op:'fortune'}).then(r=>{ if(r.fortune) GAME.toast('🎋 '+esc(r.fortune),'quest'); });
PLACE.park=()=>open('Vườn quốc gia Đà Bắc · Chú kiểm lâm',()=>{ const g=G(), K=SD.PARK, d=SD.vnTime(NET.now()).day, pk=g.park&&g.park.day===d?g.park:null;
  return money()+`<p>${pk?'Đã có vé hôm nay. Đi theo đường mòn tới các trạm quan sát, bấm E ở trạm để xem thú: +EXP, +1 hiểu biết.':`Vé tham quan <b>${fmt(K.ticket)}</b>/ngày. Không có vé không vào được vườn.`}</p>${pk?'':btn('pkticket','Mua vé tham quan','','pri')}
    <h5>Trạm quan sát (${pk?Object.keys(pk.seen).length:0}/${K.spots.length} hôm nay)</h5><div class="list">${K.spots.map((sp,i)=>`<div class="row"><span><b>${esc(sp.name)}</b></span><span>${pk&&pk.seen[i]?'đã xem':''}</span>${pk?btn('gotoxy','Đi tới ➜',{x:sp.x,y:sp.y,l:sp.name},'go'):''}</div>`).join('')}</div>
    <h5>Quyên góp bảo tồn</h5><p class="muted">Tiền quyên góp dùng chăm sóc thú cứu hộ. Có bảng xếp hạng Mạnh thường quân.</p><div class="col">${K.donate.map(v=>btn('pkdonate','Quyên góp '+fmt(v),{v})).join('')}</div>`; },{wide:true});
ACT.pkticket=()=>req({t:'park',op:'ticket'}).then(r=>{ if(r.msg) GAME.toast(esc(r.msg),'quest'); }); ACT.pkdonate=d=>req({t:'park',op:'donate',v:+d.v});
PLACE.quantro=()=>GAME.say([['quantro',`Vào bàn ma sói. Không đủ người thì trả ${fmt(SD.CLUB.bots.masoiHire)} để tôi tìm người (bot) lấp bàn. Thắng khi chơi với bot ăn pot ×${SD.CLUB.bots.masoiBonus} vì nhà cái bù tiền cho bot.`]]);


/* ---------- cảnh sát giao thông chặn xe ---------- */
UI.csgt=st=>open('Cảnh sát giao thông · Dừng xe kiểm tra',()=>{ const pc=GAME.portrait('csgt'), pr=pc&&pc.toDataURL?pc.toDataURL():'', head=`<div class="csgtHead">${pr?`<img class="por" src="${pr}" alt="">`:''}<p><b>Tuýt tuýt!</b> "Mời anh/chị tấp vào lề, xuất trình giấy tờ."</p></div>`;
  if(st.type==='helmet'||st.type==='speed') return head+`<p class="bad">Lỗi: ${st.type==='speed'?'phóng nhanh vượt ẩu, chạy quá tốc độ':'không đội mũ bảo hiểm khi đi xe máy'} · phạt ${fmt(st.fine)}</p>
    <div class="list"><div class="row"><span><b>Nộp phạt</b><small class="muted">Đúng luật, có biên bản</small></span><span>${fmt(st.fine)}</span>${btn('csgtpay','Nộp phạt',{},'pri')}</div>
    <div class="row"><span><b>Đút lót</b><small class="muted">50% chú CSGT nhận. Không nhận thì phạt thêm ${fmt(SD.CSGT.extra)}</small></span><span>${fmt(st.bribe)}</span>${btn('csgtbribe','Dúi tiền')}</div></div>`;
  return head+`<p>Kiểm tra hiểu biết luật giao thông · câu <b>${st.i+1}/${st.n}</b> · sai ${st.wrong} câu</p><h5>${esc(st.q)}</h5>
    <div class="col">${st.opts.map((o,i)=>btn('csgtans',String.fromCharCode(65+i)+'. '+esc(o),{ans:i},'big')).join('')}</div>
    <p class="muted">Sai mỗi câu phạt ${fmt(SD.CSGT.wrongFine)}. Sai cả ${st.n} câu thì xe lên xe thùng về đồn.</p>`; });
ACT.csgtpay=async()=>{ const r=await GAME.act({t:'csgt',op:'pay'}); if(!r.err) GAME.toast(esc(r.msg),r.jail?'lock':'vnd'); };
ACT.csgtbribe=async()=>{ const r=await GAME.act({t:'csgt',op:'bribe'}); if(!r.err) GAME.toast(esc(r.msg),r.ok?'item':'lock'); };
ACT.csgtans=async d=>{ const r=await GAME.act({t:'csgt',op:'answer',a:+d.ans}); if(r.err) return; GAME.toast(r.right?'<b>Đúng!</b>':`<b>Sai!</b> Đáp án: ${esc(r.correct)} · phạt ${fmt(r.fine)}`,r.right?'exp':'lock');
  if(r.done&&!r.impound) GAME.toast(`Xong kiểm tra: sai ${r.wrong}/${SD.CSGT.n} câu. "Mời đi tiếp!"`,'item'); };

window.UI=UI;
})();
