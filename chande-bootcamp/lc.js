/* Chan City — Lính Cát (client): Lính Cát hoang ở Ké (vẽ + bấm E đấu), vật nuôi thả rông quanh sân Ké, thú vườn quốc gia, con đầu đội đi theo người,
   Trung tâm Lính Cát (y tá hồi máu, Giáo sư dạy kỹ năng + tiến hoá bằng đá, bàn 3 bóng khởi đầu, máy gửi giữ, kệ hàng), bảng đội, màn đấu theo lượt có hoạt ảnh + ném Bóng Cát. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, L=SD.LINHCAT, SP=SD.LC_SPECIES, MV=SD.LC_MOVES, TY=SD.LC_TYPES;
const G=()=>GAME.G, esc=s=>GAME.esc(s), fmt=SD.fmt, $=s=>document.querySelector(s), btn=(...a)=>UI.btn(...a), toast=(h,k)=>GAME.toast(h,k), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const lc=()=>G().lc||{party:[],box:[],dex:{},gone:{}}, trained=()=>!!(G().skills||{}).linhcat, nm=m=>esc(m.nick||SP[m.sp].name), maxHp=m=>SD.lcStats(m.sp,m.lv).hp, cnt=k=>(G().items||{})[k]||0;
const URL_=new Map(), img=(sp,size=48)=>{ const k=sp+'|'+size; if(!URL_.has(k)){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(A.linhcat(sp).c,0,0,size,size); URL_.set(k,c.toDataURL()); } return `<img class="lcimg" src="${URL_.get(k)}" width="${size}" height="${size}" alt="">`; };
const chip=t=>`<span class="lct" style="background:${TY[t].col}">${TY[t].name}</span>`;
const bar=(v,max,col)=>`<span class="lcbar"><i style="width:${Math.max(0,Math.min(100,Math.round(100*v/max)))}%;background:${col||(v/max>.5?'#5fe06a':v/max>.2?'#ffd84a':'#ff4a3a')}"></i></span>`;
const effOf=(mt,dt)=>((SD.LC_EFF[mt]||{})[dt]??1);
// bảng khắc hệ: hệ này đánh mạnh / yếu với hệ nào
const typeChart=()=>`<div class="lcchart">${Object.keys(TY).map(t=>{ const E=SD.LC_EFF[t]||{}, s=Object.keys(E).filter(k=>E[k]>1), w=Object.keys(E).filter(k=>E[k]<1&&E[k]>0), z=Object.keys(E).filter(k=>E[k]===0);
  return `<div>${chip(t)} <small>${s.length?'mạnh với '+s.map(k=>TY[k].name).join(', '):''}${w.length?` · yếu với ${w.map(k=>TY[k].name).join(', ')}`:''}${z.length?` · vô dụng với ${z.map(k=>TY[k].name).join(', ')}`:''}</small></div>`; }).join('')}</div>`;
const req=async m=>{ const r=await NET.req(m); if(r.err) toast(esc(r.err),'lock'); return r; };
const monRow=(m,extra='')=>`<div class="row lcrow">${img(m.sp,44)}<span><b>${nm(m)}</b> Lv${m.lv} ${chip(SP[m.sp].t)}<br>${bar(m.hp,maxHp(m))} <small>${m.hp}/${maxHp(m)} máu · EXP ${m.exp}/${SD.lcNext(m.lv)}</small><br><small class="muted">${SD.lcMoves(m.sp,m.lv).map(k=>MV[k].name).join(' · ')}</small></span><span class="lcbtns">${extra}</span></div>`;

/* ---------- Trung tâm: y tá, Giáo sư, bàn khởi đầu, máy gửi giữ, kệ hàng ---------- */
X.lc=async(op)=>{ if(op==='nurse') return UI.place('lcyta',{id:'yta_cat'}); if(op==='box') return UI.lcBox(); if(op==='shop') return UI.lcShop();
  if(op==='starter'){ if(!trained()) return toast('Học <b>Huấn luyện Lính Cát</b> với Giáo sư Cát trước đã (góc trái)','quest'); const r=lc(); if(r.party.length||r.box.length) return toast('Bạn đã nhận Lính Cát khởi đầu rồi','lock'); return UI.lcStarter(); } };
UI.defPlace('lcyta',()=>UI.open('Chị Y tá Cát · quầy hồi máu',()=>{ const r=lc(); return `<p>"Chào mừng tới Trung tâm Lính Cát! Chị chăm các bé miễn phí nhé."</p>${r.party.length?r.party.map(m=>monRow(m)).join(''):'<p class="muted">Bạn chưa có Lính Cát nào.</p>'}${r.party.length?btn('lcheal','💗 Hồi máu cả đội',{},'pri'):''}`; }));
UI.onAct('lcheal',async()=>{ const r=await req({t:'lc',op:'heal'}); if(!r.err){ GAME.sfx('power_up',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.defPlace('lcgs',()=>UI.open('Giáo sư Cát',()=>{ const r=lc(), dex=r.dex||{}, wild=Object.keys(SP).filter(k=>!SP[k].npc), caught=wild.filter(k=>dex[k]===2).length, seen=wild.filter(k=>dex[k]).length;
  if(!trained()) return `<p>"Chào cháu! Ta là Giáo sư Cát. Lính Cát là những sinh vật sống quanh Ké: ngoài bãi cỏ, ven rừng, ban đêm còn có cả Lính Cát hệ Ma."</p>
    <p>"Muốn thu phục và huấn luyện Lính Cát thì phải học bài bản: cách ra lệnh, cách chăm sóc, cách ném Bóng Cát. Học xong ta tặng cháu 1 con khởi đầu và ${L.startBalls} Bóng Cát."</p>${btn('lclearn',`📖 Học Huấn luyện Lính Cát · ${fmt(L.learnFee)}`,{},'pri')}`;
  const evos=[...r.party,...r.box].filter(m=>SP[m.sp].stone&&m.lv>=SP[m.sp].stoneLv), st=Object.keys(SP.cat_con.stone);
  return `<p>"Sổ Lính Cát của cháu: đã gặp <b>${seen}</b>, thu phục <b>${caught}</b>/${wild.length} loài. Đánh yếu đối thủ rồi mới ném bóng, tỉ lệ bắt cao hơn nhiều!"</p>
    <p class="muted">Mang theo tối đa ${L.party} con, còn lại gửi ở máy gửi giữ bên phải. Lính Cát hệ Ma chỉ ra ban đêm, Rồng Nhí ở vùng xa phía Đông.</p>
    <h5>Tiến hoá bằng đá (Cát Con từ Lv${SP.cat_con.stoneLv})</h5>${evos.length?evos.map(m=>`<div class="row lcrow">${img(m.sp,40)}<span><b>${nm(m)}</b> Lv${m.lv}</span><span class="lcbtns">${st.map(k=>cnt(k)?btn('lcstone',SD.ITEMS[k].name,{u:m.u,k}):'').join('')||'<small class="muted">Mua đá ở kệ hàng</small>'}</span></div>`).join('')
      :`<p class="muted">Cát Con có 8 hướng tiến hoá: ${st.map(k=>SP[SP.cat_con.stone[k]].name).join(', ')}. Đủ Lv${SP.cat_con.stoneLv} thì mang đá tới đây.</p>`}
    <h5>Bảng khắc hệ (chiêu khắc hệ gây ×2 sát thương, bị kháng ×0,5, chiêu cùng hệ với Lính Cát +25%)</h5>${typeChart()}
    <div class="lcdex">${wild.map(k=>`<span title="${dex[k]?esc(SP[k].name):'???'}" class="${dex[k]===2?'got':dex[k]?'seen':'unk'}">${img(k,32)}</span>`).join('')}</div>`; },{wide:true}));
UI.onAct('lclearn',async()=>{ const r=await req({t:'lc',op:'learn'}); if(!r.err){ GAME.sfx('level_up',.6); GAME.bigText('HUẤN LUYỆN VIÊN LÍNH CÁT!'); toast(esc(r.msg),'quest'); } UI.refresh(); });
UI.onAct('lcstone',async d=>{ const r=await req({t:'lc',op:'stone',u:+d.u,k:d.k}); if(!r.err){ GAME.sfx('level_up',.7); GAME.bigText('TIẾN HOÁ!'); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.lcStarter=()=>UI.open('Chọn Lính Cát khởi đầu',()=>`<p>"Ba Bóng Cát, ba người bạn. Chọn kỹ nhé, đây là đồng đội đầu tiên của cháu!"</p><div class="lcstarters">${L.starters.map(k=>`<div class="lcst">${img(k,84)}<b>${esc(SP[k].name)}</b>${chip(SP[k].t)}<small>${esc(SP[k].desc||'')}</small>${btn('lcpick','Chọn '+esc(SP[k].name),{k},'pri')}</div>`).join('')}</div>
  <p class="muted">Lửa khắc Cỏ, Cỏ khắc Nước, Nước khắc Lửa.</p>`,{wide:true});
UI.onAct('lcpick',async d=>{ const r=await req({t:'lc',op:'starter',k:d.k}); if(r.err) return; UI.closeAll(); GAME.sfx('level_up',.7); GAME.bigText(SP[d.k].name.toUpperCase()+'!'); toast(esc(r.msg),'quest'); });
UI.lcBox=()=>UI.open('Máy gửi giữ Lính Cát',()=>{ const r=lc(); return `<h5>Đang mang theo (${r.party.length}/${L.party})</h5>${r.party.map(m=>monRow(m,r.party.length>1?btn('lcdep','Gửi',{u:m.u}):'')).join('')||'<p class="muted">Trống</p>'}
  <h5>Trong máy (${r.box.length}/${L.box})</h5>${r.box.map(m=>monRow(m,btn('lcwd','Mang theo',{u:m.u},r.party.length<L.party?'pri':''))).join('')||'<p class="muted">Chưa gửi con nào. Gửi vào máy thì được hồi máu đầy.</p>'}`; },{wide:true});
UI.onAct('lcdep',async d=>{ await req({t:'lc',op:'deposit',u:+d.u}); UI.refresh(); }); UI.onAct('lcwd',async d=>{ await req({t:'lc',op:'withdraw',u:+d.u}); UI.refresh(); });
UI.lcShop=()=>UI.open('Kệ hàng Trung tâm Lính Cát',()=>`<div class="list">${Object.entries(L.shop).map(([k,v])=>`<div class="row">${UI.ico(SD.ITEMS[k].icon||k)}<span><b>${esc(SD.ITEMS[k].name)}</b> <small class="muted">· đang có ${cnt(k)}${k==='bong_vang'?' · bắt dễ gấp 1,8':k==='thuoc_cat'?` · hồi ${L.potion} máu`:k.startsWith('da_')?' · cho Cát Con tiến hoá':''}</small></span><span>${fmt(v)}</span>${btn('lcbuy','Mua 1',{k,n:1})}${k.startsWith('bong')||k==='thuoc_cat'?btn('lcbuy','Mua 5',{k,n:5}):''}</div>`).join('')}</div>`,{wide:true});
UI.onAct('lcbuy',async d=>{ const r=await req({t:'lc',op:'buy',k:d.k,n:+d.n}); if(!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });

/* ---------- bảng đội Lính Cát (nút 🐾 bên phải) ---------- */
UI.lcParty=()=>UI.open('🐾 Đội Lính Cát',()=>{ const r=lc();
  if(!trained()) return `<p>Chưa biết huấn luyện Lính Cát. Tới <b>Trung tâm Lính Cát</b> ở thị trấn Đà Bắc (phía Đông chợ, toà mái đỏ) học với Giáo sư Cát, rồi chọn 1 con khởi đầu.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm',{},'go')}`;
  if(!r.party.length) return `<p>Chưa có Lính Cát nào. Ra bàn 3 Bóng Cát trong Trung tâm chọn con khởi đầu nhé.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm',{},'go')}`;
  return `<p class="muted">Con đứng đầu đội sẽ ra sân trước và đi theo bạn. Bóng Cát: <b>${cnt('bong_cat')}</b> · Bóng Vàng: <b>${cnt('bong_vang')}</b> · Thuốc: <b>${cnt('thuoc_cat')}</b></p>
    ${r.party.map((m,i)=>monRow(m,(i?btn('lclead','Lên đầu đội',{u:m.u}):'<small class="good">Đầu đội</small>')+(cnt('thuoc_cat')&&m.hp<maxHp(m)?btn('lcpot','Cho uống thuốc',{u:m.u}):''))).join('')}
    <p class="muted">Ra bãi cỏ quanh Ké tìm Lính Cát hoang (bấm E để đấu). Vật nuôi thả rông cạnh sân Ké cũng đấu được. Thú ở vườn quốc gia là thú bảo tồn: đấu xong dễ bị công an bắt!</p>`; },{wide:true});
UI.onAct('lclead',async d=>{ await req({t:'lc',op:'lead',u:+d.u}); UI.refresh(); }); UI.onAct('lcpot',async d=>{ const r=await req({t:'lc',op:'potion',u:+d.u}); if(!r.err) toast(esc(r.msg),'item'); UI.refresh(); });
UI.onAct('lcgo',()=>{ UI.closeAll(); const S=GAME.S; if(S.kind==='linhcat') return toast('Bạn đang ở trong Trung tâm rồi','item'); if(S.kind!=='retreat'){ toast('Trung tâm Lính Cát ở thị trấn Đà Bắc (Ké): bấm G gọi Grab về Ké','quest'); return UI.grab(); } GAME.walkTo(L.door.x,L.door.y,'Trung tâm Lính Cát'); });
setTimeout(()=>{ const b=$('#btnLc'); if(b) b.addEventListener('click',e=>{ e.currentTarget.blur(); if(GAME.S) UI.lcParty(); }); },0);

/* ---------- Lính Cát hoang, vật nuôi, thú vườn quốc gia trên map Ké ---------- */
let WILD=[], wildT=0, wildScene=''; const wildNow=()=>{ const t=NET.now(), k=GAME.S&&GAME.S.kind; if(t-wildT>1000||k!==wildScene){ wildT=t; wildScene=k; const gone=lc().gone||{}; WILD=SD.lcWild(t,k).filter(w=>!gone[w.key]); } return WILD; };
const farmPos=(f,i,clock)=>[f[0]+Math.sin(clock*.4+i*2)*1.2,f[1]+Math.cos(clock*.3+i)*.6];
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); const S=GAME.S; if(!S||!L.maps[S.kind]||BT) return; const tr=trained();
  for(const w of wildNow()){ const d=dist(w.x*T,w.y*T); if(d<30) consider(d*.6,{type:'mapx',k:'lcwild',i:w.i,label:tr?`⚔ Đấu ${SP[w.sp].name} hoang · Lv${w.lv}`:`${SP[w.sp].name} hoang (học Huấn luyện Lính Cát để đấu)`}); }
  if(tr&&S.kind==='retreat') L.farm.forEach((f,i)=>{ const [x,y]=farmPos(f,i,GAME.clock), d=dist(x*T,y*T); if(d<28) consider(d*.7,{type:'mapx',k:'lcfarm',i,label:'⚔ Cho Lính Cát đấu với '+SP[f[2]].name}); });
  if(tr&&S.kind==='retreat') for(const s of SD.PARK.spots){ const sp=L.park[s.k]; if(!sp) continue; const d=dist(s.x*T,s.y*T); if(d<46) consider(d+12,{type:'mapx',k:'lcpark',park:s.k,label:`⚔ Đấu với ${SP[sp].name} (thú bảo tồn, dễ bị bắt!)`}); } };
UI.lcNeed=()=>UI.open('Chưa biết huấn luyện Lính Cát',()=>`<p>Muốn đấu và thu phục Lính Cát thì phải học <b>Huấn luyện Lính Cát</b> với Giáo sư Cát ở <b>Trung tâm Lính Cát</b> (thị trấn Đà Bắc, toà mái đỏ phía Đông chợ). Học xong được tặng 1 con khởi đầu.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm Lính Cát',{},'pri')}`);
const p0=X.pick; X.pick=x=>{ if(x.k==='lcwild'||x.k==='lcfarm'||x.k==='lcpark'){ if(!trained()) return UI.lcNeed();
    return battle(x.k==='lcwild'?{op:'wild',i:x.i}:x.k==='lcfarm'?{op:'farm',i:x.i}:{op:'park',k:x.park}); } return p0(x); };
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim;
  if(a==='lcheal'){ const f=Math.floor(clock*2)%7; return SPR['h'+f]||(SPR['h'+f]=A.healMachine(f)); } if(a==='lcpc'){ const f=Math.floor(clock*2)%2; return SPR['p'+f]||(SPR['p'+f]=A.pcBox(f)); } return a0(o,clock); }; const SPR={};
let FOL=null, lastClock=0;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const S=GAME.S, P=GAME.P; if(!S||!P) return; const cam=GAME.cam, clock=GAME.clock, dt=Math.min(.1,Math.max(0,clock-lastClock)); lastClock=clock;
  if(L.maps[S.kind]){ const vx=cam.x-40, vy=cam.y-40, vw=innerWidth+80, vh=innerHeight+80, inV=(x,y)=>x>vx&&y>vy&&x<vx+vw&&y<vy+vh;
    for(const w of wildNow()){ const x=w.x*T, y=w.y*T; if(!inV(x,y)) continue; const fr=Math.floor(clock*2+w.i)%2, sp=A.linhcat(w.sp,fr,Math.sin(clock*.5+w.i)>0);
      list.push({y,d:()=>{ GAME.shadow(x,y,8); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }}); }
    if(S.kind==='retreat') L.farm.forEach((f,i)=>{ const [fx,fy]=farmPos(f,i,clock), x=fx*T, y=fy*T; if(!inV(x,y)) return; const sp=A.linhcat(f[2],Math.floor(clock*2+i)%2,Math.cos(clock*.4+i*2)>0); list.push({y,d:()=>{ GAME.shadow(x,y,9); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }}); }); }
  // con đầu đội đi theo người (không theo khi đang đi xe / chèo kayak)
  const lead=(lc().party||[])[0]; if(!lead||lead.hp<=0||P.kayak||P.moto||P.incar||P.pcar||P.riding||P.opt||['phongbay','track','deo'].includes(S.kind)){ FOL=null; return; }   // đang cưỡi / đi xe / đua ngựa / bốc đầu ở đèo thì không đi theo
  const tx=P.x-(P.face||1)*20, ty=P.y+3; if(!FOL||FOL.sp!==lead.sp||FOL.scene!==S.kind||Math.hypot(FOL.x-tx,FOL.y-ty)>200) FOL={sp:lead.sp,x:tx,y:ty,scene:S.kind,face:1};
  const dx=tx-FOL.x, dy=ty-FOL.y, dd=Math.hypot(dx,dy); if(dd>4){ const k=Math.min(1,dt*5); FOL.x+=dx*k; FOL.y+=dy*k; if(Math.abs(dx)>1) FOL.face=dx>0?1:-1; }
  const moving=dd>6, fr=Math.floor(clock*(moving?6:2))%2, sp=A.linhcat(FOL.sp,fr,FOL.face>0), fx=FOL.x, fy=FOL.y;
  list.push({y:fy,d:()=>{ GAME.shadow(fx,fy,7); ctx.drawImage(sp.c,Math.round(fx-sp.ax-cam.x),Math.round(fy-sp.ay-cam.y-(moving&&fr?1:0))); }}); };

// nhãn "Lv cấp + tên" của con hoang ở gần: vẽ ở lớp giao diện cho chữ nét
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); const S=GAME.S, P=GAME.P; if(!S||!P||BT) return; ug.font='14px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom';
  for(const w of (S.kind===wildScene?WILD:[])){ const x=w.x*T, y=w.y*T; if(Math.hypot(P.x-x,P.y-y)>80) continue; tag(sx(x),sy(y-30),`Lv${w.lv} ${SP[w.sp].name}`,'',SP[w.sp].night?'#c8a0ff':'#ffd84a'); } };
/* ---------- màn đấu theo lượt ---------- */
let BT=null;
async function battle(m){ if(BT) return; const r=await req({t:'lcb',...m}); if(r.err||!r.battle) return; open(r.battle); }
function open(v){ const k=v.kind; BT={v,busy:false,msg:k==='wild'?`Một ${SP[v.foe.sp].name} hoang xuất hiện!`:k==='farm'?`${SP[v.foe.sp].name} hùng hổ lao tới!`:`${SP[v.foe.sp].name} của vườn quốc gia nhìn bạn đầy cảnh giác...`,
    s:{foe:{sp:v.foe.sp,lv:v.foe.lv,hp:v.foe.hp,max:v.foe.max,vis:1,y:0},me:{sp:v.me.sp,lv:v.me.lv,hp:v.me.hp,max:v.me.max,vis:1,y:0}},tw:[],fx:[],ball:null,t0:performance.now(),flash:0,end:false};
  GAME.sfx('power_up',.45);
  UI.open(k==='wild'?'⚔ Đấu Lính Cát hoang':k==='farm'?'⚔ Đấu với vật nuôi':'⚔ Đấu thú bảo tồn (cẩn thận!)',()=>`<canvas id="lcCv" width="320" height="150"></canvas><div id="lcMsg" class="lcmsg"></div><div id="lcCtl" class="lcctl"></div>`,{static:true,wide:true});
  setTimeout(()=>{ const ctl=$('#lcCtl'); if(!ctl) return; ctl.addEventListener('click',e=>{ const b=e.target.closest('[data-lc]'); if(!b||b.disabled||!BT||BT.busy) return; act(b.dataset); }); setMsg(BT.msg); controls(); requestAnimationFrame(loop); },0); }
const setMsg=t=>{ const m=$('#lcMsg'); if(m) m.innerHTML=t; };
function controls(force){ const ctl=$('#lcCtl'); if(!ctl||!BT) return; const v=BT.v; if(BT.end){ ctl.innerHTML=''; return; }
  if(v.won){ ctl.innerHTML=`<div class="lcrow2"><button class="btn sm pri" data-lc="ball" data-k="bong_cat" ${cnt('bong_cat')?'':'disabled'}>🎾 Thu phục bằng Bóng Cát (${cnt('bong_cat')})</button><button class="btn sm" data-lc="ball" data-k="bong_vang" ${cnt('bong_vang')?'':'disabled'}>🟡 Bóng Vàng (${cnt('bong_vang')})</button><button class="btn sm" data-lc="release">👋 Thả đi</button></div>${cnt('bong_cat')+cnt('bong_vang')?'':'<p class="muted">Hết bóng rồi! Mua Bóng Cát ở Trung tâm Lính Cát.</p>'}`; return; }
  if(force||v.need){ ctl.innerHTML=`<p class="muted">Chọn Lính Cát ra sân:</p>`+v.party.filter(x=>x.hp>0&&x.u!==v.me.u).map(x=>`<button class="btn sm pri" data-lc="switch" data-u="${x.u}">${img(x.sp,24)} ${esc(SP[x.sp].name)} Lv${x.lv} · ${x.hp}/${x.max}</button>`).join('')+(force&&!v.need?`<button class="btn sm" data-lc="back">↩ Quay lại</button>`:''); return; }
  const me=v.me, ft=SP[v.foe.sp].t, mvs=me.moves.map(k=>{ const M=MV[k], e=effOf(M.t,ft), stab=M.t===SP[me.sp].t, tip=e===0?'<em class="e0">×0 không tác dụng</em>':e>1?'<em class="e2">×2 khắc hệ!</em>':e<1?'<em class="e5">×0,5 bị kháng</em>':'';
    return `<button class="btn sm lcmv" data-lc="move" data-mv="${k}" style="--tc:${TY[M.t].col}"><b>${esc(M.name)}</b><small>${TY[M.t].name}${stab?' · cùng hệ +25%':''} · ${M.pow} · ${Math.round(M.acc*100)}%</small>${tip}</button>`; }).join('');
  ctl.innerHTML=`<div class="lcmoves">${mvs}</div><div class="lcrow2">${v.canBall?`<button class="btn sm" data-lc="ball" data-k="bong_cat" ${cnt('bong_cat')?'':'disabled'}>🎾 Bóng Cát (${cnt('bong_cat')})</button><button class="btn sm" data-lc="ball" data-k="bong_vang" ${cnt('bong_vang')?'':'disabled'}>🟡 Bóng Vàng (${cnt('bong_vang')})</button>`:''}
    <button class="btn sm" data-lc="potion" ${cnt('thuoc_cat')?'':'disabled'}>🧪 Thuốc (${cnt('thuoc_cat')})</button><button class="btn sm" data-lc="sw" ${v.party.filter(x=>x.hp>0).length>1?'':'disabled'}>🔁 Đổi</button><button class="btn sm" data-lc="run">🏃 Chạy</button></div>`; }
async function act(d){ if(d.lc==='sw') return controls(true); if(d.lc==='back') return controls();
  BT.busy=true; for(const b of document.querySelectorAll('#lcCtl button')) b.disabled=true;
  const m={t:'lcb',op:d.lc}; if(d.mv) m.mv=d.mv; if(d.k) m.k=d.k; if(d.u) m.u=+d.u; const r=await req(m); if(!BT) return; if(r.err){ BT.busy=false; controls(); return; }
  await play(r.ev||[]); if(!BT) return;
  if(r.result!==undefined&&r.battle===null){ BT.end=true; controls(); setMsg(esc(r.msg||'')); await sleep(1700); UI.closeAll(); BT=null; if(r.msg) toast(esc(r.msg),r.result==='lose'?'lock':'item'); return; }
  BT.v=r.battle; BT.busy=false; const s=BT.s, me=BT.v.me; Object.assign(s.me,{sp:me.sp,lv:me.lv,hp:me.hp,max:me.max});
  if(BT.v.won){ s.foe.y=0; await tween(s.foe,'vis',.85,300); setMsg(`${esc(SP[s.foe.sp].name)} đã chịu thua! Bạn có quyền <b>thu phục</b> nó: ném 1 Bóng Cát là chắc chắn bắt được.`); controls(); return; }
  setMsg(BT.v.need?'Lính Cát của bạn kiệt sức! Chọn con khác ra sân.':`${esc(SP[me.sp].name)} nên làm gì?`); controls(); }
const tween=(o,k,to,ms)=>new Promise(res=>BT.tw.push({o,k,from:o[k],to,t0:performance.now(),ms,res}));
const name=w=>w==='me'?SP[BT.s.me.sp].name:SP[BT.s.foe.sp].name;
async function play(ev){ const s=BT.s;
  for(const e of ev){ if(!BT) return;
    if(e.k==='mv'){ const att=e.w==='me'?s.me:s.foe, tg=e.w==='me'?s.foe:s.me; setMsg(`${esc(name(e.w))} dùng <b>${esc(MV[e.mv].name)}</b>!`); att.lunge=performance.now(); GAME.sfx('dash',.35); await sleep(320);
      if(e.miss){ setMsg(`${esc(name(e.w))} dùng ${esc(MV[e.mv].name)}... trượt rồi!`); await sleep(600); continue; }
      if(e.eff===0){ setMsg('Không có tác dụng gì cả!'); await sleep(700); continue; }
      tg.hit=performance.now(); BT.fx.push({k:'boom',w:e.w==='me'?'foe':'me',t:performance.now(),c:TY[MV[e.mv].t].col}); GAME.sfx('poof',.4); await tween(tg,'hp',e.hp,450);
      const note=(e.crit?'Chí mạng! ':'')+(e.eff>1?'Hiệu quả cao!':e.eff<1?'Không hiệu quả lắm...':''); if(note){ setMsg(note); await sleep(650); } else await sleep(250); continue; }
    if(e.k==='faint'){ const o=e.w==='me'?s.me:s.foe; setMsg(`${esc(SP[e.sp].name)} kiệt sức!`); GAME.sfx('poof',.5); await Promise.all([tween(o,'y',30,500),tween(o,'vis',0,500)]); await sleep(300); continue; }
    if(e.k==='ball'){ await throwBall(e); continue; }
    if(e.k==='caught'){ setMsg(`🎉 Thu phục được <b>${esc(SP[e.sp].name)}</b>!${e.box?' Đội đã đủ 5 con nên gửi vào máy ở Trung tâm.':''}`); GAME.sfx('level_up',.7); await sleep(1300); continue; }
    if(e.k==='exp'){ setMsg(`${esc(SP[e.sp].name)} nhận <b>${e.n}</b> EXP`); await sleep(700); continue; }
    if(e.k==='lvl'){ setMsg(`⬆ ${esc(SP[e.sp].name)} lên <b>Lv${e.lv}</b>!`); s.me.lv=e.lv; GAME.sfx('level_up',.5); await sleep(900); continue; }
    if(e.k==='learn'){ setMsg(`${esc(SP[e.sp].name)} học được chiêu <b>${esc(MV[e.mv].name)}</b>!`); await sleep(900); continue; }
    if(e.k==='evo'){ setMsg(`Ơ kìa... ${esc(SP[e.from].name)} đang tiến hoá!`); for(let i=0;i<8;i++){ s.me.sp=i%2?e.to:e.from; s.me.white=1; await sleep(140+i*30); s.me.white=0; await sleep(80); }
      s.me.sp=e.to; GAME.sfx('level_up',.8); setMsg(`✨ ${esc(SP[e.from].name)} tiến hoá thành <b>${esc(SP[e.to].name)}</b>!`); await sleep(1400); continue; }
    if(e.k==='switch'){ s.me={...s.me,sp:e.sp,vis:0,y:0}; setMsg(`Ra sân nào, <b>${esc(SP[e.sp].name)}</b>!`); const p=BT.v.party.find(x=>x.sp===e.sp&&x.hp>0); if(p) Object.assign(s.me,{hp:p.hp,max:p.max,lv:p.lv}); await tween(s.me,'vis',1,350); await sleep(300); continue; }
    if(e.k==='heal'){ setMsg(`🧪 Hồi ${e.n} máu`); await tween(s.me,'hp',s.me.hp+e.n,400); continue; }
    if(e.k==='run'){ setMsg('Rút lui an toàn!'); await sleep(600); continue; }
    if(e.k==='won'){ setMsg(`🏆 Thắng! +${e.exp} EXP huấn luyện viên`); GAME.sfx('level_up',.5); await sleep(900); continue; }
    if(e.k==='release'){ setMsg(`${esc(SP[e.sp].name)} chạy vào bụi cỏ, ngoái lại vẫy đuôi cảm ơn`); await tween(BT.s.foe,'vis',0,500); continue; }
    if(e.k==='lose'){ setMsg('Không còn Lính Cát nào chiến đấu được...'); await sleep(900); continue; }
    if(e.k==='arrest'){ BT.flash=1; setMsg('🚓 <b>Kiểm lâm phát hiện!</b> Bị bắt vì làm hại động vật hoang dã!'); GAME.sfx('poof',.6); await sleep(1800); continue; } } }
// ném bóng: bay vòng cung → đối thủ chui vào bóng → bóng rơi, lắc → bắt được (sao lấp lánh) hoặc bóng bật mở
async function throwBall(e){ const s=BT.s, gold=e.ball==='bong_vang'; setMsg(`Ném ${gold?'Bóng Cát Vàng':'Bóng Cát'}!`); GAME.sfx('dash',.4);
  BT.ball={x:70,y:120,fr:0,gold,rot:0}; await Promise.all([tween(BT.ball,'x',232,520),tween(BT.ball,'y',52,520)]); BT.ball.fr=2; BT.flash=.6; await tween(s.foe,'vis',0,250); BT.ball.fr=0;
  await tween(BT.ball,'y',84,280); for(let i=0;i<e.shakes;i++){ setMsg('...'.slice(0,i+1)); await tween(BT.ball,'rot',.5,140); await tween(BT.ball,'rot',-.5,200); await tween(BT.ball,'rot',0,140); await sleep(360); }
  if(e.ok){ BT.fx.push({k:'stars',t:performance.now()}); GAME.sfx('item_pickup',.7); await sleep(700); return; }
  BT.ball.fr=1; await sleep(120); BT.ball.fr=2; BT.flash=.5; await tween(s.foe,'vis',1,260); BT.ball=null; setMsg(`Ối! ${esc(SP[s.foe.sp].name)} thoát ra rồi!`); await sleep(800); }
/* ---------- vẽ màn đấu ---------- */
let BG=null; function bg(){ if(BG) return BG; const c=document.createElement('canvas'); c.width=320; c.height=150; const g=c.getContext('2d'), sky=g.createLinearGradient(0,0,0,90); sky.addColorStop(0,'#9ad8f8'); sky.addColorStop(1,'#e8f6e0');
  g.fillStyle=sky; g.fillRect(0,0,320,150); g.fillStyle='#7ac86a'; g.fillRect(0,70,320,80); for(let i=0;i<70;i++){ g.fillStyle=i%2?'#6ab85a':'#8ad87a'; g.fillRect((i*47)%320,72+(i*29)%76,2,3); }
  g.fillStyle='rgba(255,255,255,.8)'; for(const [x,y,w] of [[40,18,30],[180,12,40],[270,26,26]]){ g.beginPath(); g.ellipse(x,y,w,7,0,0,7); g.fill(); }
  g.fillStyle='#5fa850'; g.beginPath(); g.ellipse(232,82,52,12,0,0,7); g.fill(); g.fillStyle='#8ad87a'; g.beginPath(); g.ellipse(232,80,48,10,0,0,7); g.fill();
  g.fillStyle='#5fa850'; g.beginPath(); g.ellipse(84,140,62,13,0,0,7); g.fill(); g.fillStyle='#8ad87a'; g.beginPath(); g.ellipse(84,138,58,11,0,0,7); g.fill(); BG=c; return c; }
const WH=new Map(); const whiteOf=c=>{ if(WH.has(c)) return WH.get(c); const o=document.createElement('canvas'); o.width=c.width; o.height=c.height; const g=o.getContext('2d'); g.drawImage(c,0,0); g.globalCompositeOperation='source-atop'; g.fillStyle='#fff'; g.fillRect(0,0,o.width,o.height); WH.set(c,o); return o; };
function loop(){ const cv=$('#lcCv'); if(!BT) return; if(!cv){ if(!BT.end&&!BT.busy){ NET.req({t:'lcb',op:'run'}); } BT=null; return; }
  const now=performance.now(); BT.tw=BT.tw.filter(w=>{ const k=Math.min(1,(now-w.t0)/w.ms); w.o[w.k]=w.from+(w.to-w.from)*(k<1?(1-Math.pow(1-k,2)):1); if(k>=1){ w.o[w.k]=w.to; w.res(); return false; } return true; });
  draw(cv.getContext('2d'),now); requestAnimationFrame(loop); }
function mon(g,o,x,y,sc,flip,now){ if(o.vis<=0.01) return; const sp=A.linhcat(o.sp,Math.floor(now/400)%2,flip), c=o.white?whiteOf(sp.c):sp.c, lunge=o.lunge&&now-o.lunge<300?Math.sin((now-o.lunge)/300*Math.PI)*14*(flip?1:-1):0;
  const hit=o.hit&&now-o.hit<380, sh=hit?(Math.floor(now/40)%2?3:-3):0; g.save(); g.globalAlpha=o.vis; const w=28*sc*(0.4+.6*o.vis);
  g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x,y+2,w*.35,4,0,0,7); g.fill(); g.drawImage(hit&&Math.floor(now/60)%2?whiteOf(sp.c):c,Math.round(x-w/2+lunge+sh),Math.round(y-w*27/28+o.y),Math.round(w),Math.round(w)); g.restore(); }
function hpBox(g,o,x,y,me){ const w=128, t=TY[SP[o.sp].t]; g.fillStyle='rgba(28,21,22,.86)'; g.fillRect(x,y,w,me?30:24); g.fillStyle='#ffd84a'; g.font='12px VT323, monospace'; g.textAlign='left'; g.fillText(SP[o.sp].name,x+4,y+10);
  const nw=g.measureText(SP[o.sp].name).width, tw=g.measureText(t.name).width+6; g.fillStyle=t.col; g.fillRect(x+8+nw,y+2,tw,10); g.fillStyle='#120c16'; g.fillText(t.name,x+11+nw,y+10); g.textAlign='right'; g.fillStyle='#f4f1ea'; g.fillText('Lv'+o.lv,x+w-4,y+10);
  const k=Math.max(0,o.hp/o.max); g.fillStyle='#3a1a1e'; g.fillRect(x+4,y+14,w-8,5); g.fillStyle=k>.5?'#5fe06a':k>.2?'#ffd84a':'#ff4a3a'; g.fillRect(x+4,y+14,Math.round((w-8)*k),5);
  if(me){ g.textAlign='right'; g.fillStyle='#f4f1ea'; g.fillText(`${Math.max(0,Math.round(o.hp))}/${o.max}`,x+w-4,y+28); } }
function draw(g,now){ g.imageSmoothingEnabled=false; g.drawImage(bg(),0,0); const s=BT.s;
  mon(g,s.foe,232,82,2.4,false,now); mon(g,s.me,84,140,3,true,now);
  for(const f of BT.fx){ const k=(now-f.t)/450; if(k>1) continue; if(f.k==='boom'){ const [x,y]=f.w==='foe'?[232,58]:[84,104]; g.fillStyle=f.c; g.globalAlpha=1-k; for(let i=0;i<8;i++){ const a=i*Math.PI/4, r=6+k*22; g.fillRect(x+Math.cos(a)*r-2,y+Math.sin(a)*r-2,4,4); } g.globalAlpha=1; }
    if(f.k==='stars'){ g.fillStyle='#ffd84a'; for(let i=0;i<6;i++){ const a=i*Math.PI/3+k, r=8+k*20; g.fillRect(232+Math.cos(a)*r-1,78+Math.sin(a)*r-1,3,3); } } }
  BT.fx=BT.fx.filter(f=>now-f.t<(f.k==='stars'?900:450));
  if(BT.ball){ const b=BT.ball, sp=A.lcBall(b.fr,b.gold); g.save(); g.translate(Math.round(b.x),Math.round(b.y)); g.rotate(b.rot||0); g.drawImage(sp.c,-14,-24,28,28); g.restore(); }
  hpBox(g,s.foe,8,8,false); hpBox(g,s.me,184,96,true);
  if(BT.flash>0){ g.fillStyle=`rgba(255,255,255,${BT.flash})`; g.fillRect(0,0,320,150); BT.flash=Math.max(0,BT.flash-.05); } }
})();
