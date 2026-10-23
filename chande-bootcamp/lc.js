/* Chan City — Lính Cát (client): Lính Cát hoang ở Ké (vẽ + bấm E đấu), vật nuôi thả rông quanh sân Ké, thú vườn quốc gia, con đầu đội đi theo người,
   Trung tâm Lính Cát (y tá hồi máu, Giáo sư dạy kỹ năng + tiến hoá bằng đá, bàn 3 bóng khởi đầu, máy gửi giữ, kệ hàng), bảng đội, màn đấu theo lượt có hoạt ảnh + ném Bóng Cát. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, L=SD.LINHCAT, SP=SD.LC_SPECIES, MV=SD.LC_MOVES, TY=SD.LC_TYPES;
const G=()=>GAME.G, esc=s=>GAME.esc(s), fmt=SD.fmt, $=s=>document.querySelector(s), btn=(...a)=>UI.btn(...a), toast=(h,k)=>GAME.toast(h,k), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const lc=()=>G().lc||{party:[],box:[],dex:{},gone:{}}, trained=()=>!!(G().skills||{}).linhcat, nm=m=>esc(m.nick||SP[m.sp].name), maxHp=m=>SD.lcStatsOf(m).hp, cnt=k=>(G().items||{})[k]||0;
const URL_=new Map(), img=(sp,size=48,asc=false)=>{ const k=sp+'|'+size+(asc?'|a':''); if(!URL_.has(k)){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage((asc?A.linhcatAsc(sp):A.linhcat(sp)).c,0,0,size,size); URL_.set(k,c.toDataURL()); } return `<img class="lcimg" src="${URL_.get(k)}" width="${size}" height="${size}" alt="">`; }, imgM=(m,size)=>img(m.sp,size,!!m.asc);
const chip=t=>`<span class="lct" style="background:${TY[t].col}">${TY[t].name}</span>`, chips=sp=>chip(SP[sp].t)+(SP[sp].t2?chip(SP[sp].t2):'');
const bar=(v,max,col)=>`<span class="lcbar"><i style="width:${Math.max(0,Math.min(100,Math.round(100*v/max)))}%;background:${col||(v/max>.5?'#5fe06a':v/max>.2?'#ffd84a':'#ff4a3a')}"></i></span>`;
const effOf=(mt,sp)=>SD.lcEff(mt,sp);   // sp: loài bị đánh (loài 2 hệ nhân cả 2)
// bảng khắc hệ: hệ này đánh mạnh / yếu với hệ nào
const typeChart=()=>`<div class="lcchart">${Object.keys(TY).map(t=>{ const E=SD.LC_EFF[t]||{}, s=Object.keys(E).filter(k=>E[k]>1), w=Object.keys(E).filter(k=>E[k]<1&&E[k]>0), z=Object.keys(E).filter(k=>E[k]===0);
  return `<div>${chip(t)} <small>${s.length?'mạnh với '+s.map(k=>TY[k].name).join(', '):''}${w.length?` · yếu với ${w.map(k=>TY[k].name).join(', ')}`:''}${z.length?` · vô dụng với ${z.map(k=>TY[k].name).join(', ')}`:''}</small></div>`; }).join('')}</div>`;
const req=async m=>{ const r=await NET.req(m); if(r.err) toast(esc(r.err),'lock'); return r; };
const WPN=SD.LCCLUB.weapons, monRow=(m,extra='')=>`<div class="row lcrow">${imgM(m,44)}<span><b>${m.asc?'<span class="lcasc" title="Dạng Huyền Thoại Lv50">👑</span> ':''}${m.myth?'<span class="good">★</span> ':''}${nm(m)}</b> Lv${m.lv}${m.enh?` <span class="enlv">+${m.enh}</span>`:''}${m.held&&WPN[m.held]?` <span class="lcwp">⚔ ${esc(WPN[m.held].name)}</span>`:''} ${chips(m.sp)}<br>${bar(m.hp,maxHp(m))} <small>${m.hp}/${maxHp(m)} máu · EXP ${m.exp}/${SD.lcNext(m.lv)}</small><br><small class="muted">${SD.lcMoves(m.sp,m.lv).map(k=>MV[k].name).join(' · ')}</small></span><span class="lcbtns">${extra}</span></div>`;

/* ---------- Trung tâm: y tá, Giáo sư, bàn khởi đầu, máy gửi giữ, kệ hàng ---------- */
X.lc=async(op)=>{ if(op==='nurse') return UI.place('lcyta',{id:'yta_cat'}); if(op==='box') return UI.lcBox(); if(op==='shop') return UI.lcShop();
  if(op==='starter'){ if(!trained()) return toast('Học <b>Huấn luyện Lính Cát</b> với Giáo sư Cát trước đã (góc trái)','quest'); const r=lc(); if(r.party.length||r.box.length) return toast('Bạn đã nhận Lính Cát khởi đầu rồi','lock'); return UI.lcStarter(); } };
UI.defPlace('lcyta',()=>UI.open('Chị Y tá Cát · quầy hồi máu',()=>{ const r=lc(), fee=SD.lcHealFee(r.party); return `<p>"Chào mừng tới Trung tâm Lính Cát! Hồi máu cả đội tính theo tổng cấp các bé nhé."</p>${r.party.length?r.party.map(m=>monRow(m)).join(''):'<p class="muted">Bạn chưa có Lính Cát nào.</p>'}${r.party.length?btn('lcheal',`💗 Hồi máu cả đội · ${fmt(fee)}`,{},'pri'):''}`; }));
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
    ${deckBtn()}<div class="lcdex">${wild.map(k=>`<span title="${dex[k]?esc(SP[k].name):'???'}" class="${dex[k]===2?'got':dex[k]?'seen':'unk'}">${img(k,32)}</span>`).join('')}</div>`; },{wide:true}));
UI.onAct('lclearn',async()=>{ const r=await req({t:'lc',op:'learn'}); if(!r.err){ GAME.sfx('level_up',.6); GAME.bigText('HUẤN LUYỆN VIÊN LÍNH CÁT!'); toast(esc(r.msg),'quest'); } UI.refresh(); });
UI.onAct('lcstone',async d=>{ const r=await req({t:'lc',op:'stone',u:+d.u,k:d.k}); if(!r.err){ GAME.sfx('level_up',.7); GAME.bigText('TIẾN HOÁ!'); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.lcStarter=()=>UI.open('Chọn Lính Cát khởi đầu',()=>`<p>"Ba Bóng Cát, ba người bạn. Chọn kỹ nhé, đây là đồng đội đầu tiên của cháu!"</p><div class="lcstarters">${L.starters.map(k=>`<div class="lcst">${img(k,84)}<b>${esc(SP[k].name)}</b>${chip(SP[k].t)}<small>${esc(SP[k].desc||'')}</small>${btn('lcpick','Chọn '+esc(SP[k].name),{k},'pri')}</div>`).join('')}</div>
  <p class="muted">Lửa khắc Cỏ, Cỏ khắc Nước, Nước khắc Lửa.</p>`,{wide:true});
UI.onAct('lcpick',async d=>{ const r=await req({t:'lc',op:'starter',k:d.k}); if(r.err) return; UI.closeAll(); GAME.sfx('level_up',.7); GAME.bigText(SP[d.k].name.toUpperCase()+'!'); toast(esc(r.msg),'quest'); });
UI.lcBox=()=>UI.open('Máy gửi giữ Lính Cát',()=>{ const r=lc(); return `<h5>Đang mang theo (${r.party.length}/${L.party})</h5>${r.party.map(m=>monRow(m,r.party.length>1?btn('lcdep','Gửi',{u:m.u}):'')).join('')||'<p class="muted">Trống</p>'}
  <h5>Trong máy (${r.box.length}/${L.box})</h5>${r.box.map(m=>monRow(m,btn('lcwd','Mang theo',{u:m.u},r.party.length<L.party?'pri':''))).join('')||'<p class="muted">Chưa gửi con nào. Gửi vào máy thì được hồi máu đầy.</p>'}`; },{wide:true});
UI.onAct('lcboxgo',()=>UI.lcBox());
UI.onAct('lcdep',async d=>{ await req({t:'lc',op:'deposit',u:+d.u}); UI.refresh(); }); UI.onAct('lcwd',async d=>{ await req({t:'lc',op:'withdraw',u:+d.u}); UI.refresh(); });
UI.lcShop=()=>UI.open('Kệ hàng Trung tâm Lính Cát',()=>`<div class="list">${Object.entries(L.shop).map(([k,v])=>`<div class="row">${UI.ico(SD.ITEMS[k].icon||k)}<span><b>${esc(SD.ITEMS[k].name)}</b> <small class="muted">· đang có ${cnt(k)}${k==='bong_vang'?' · bắt dễ gấp 1,8':k==='thuoc_cat'?` · hồi ${L.potion} máu`:k.startsWith('da_')?' · cho Cát Con tiến hoá':''}</small></span><span>${fmt(v)}</span>${btn('lcbuy','Mua 1',{k,n:1})}${k.startsWith('bong')||k==='thuoc_cat'?btn('lcbuy','Mua 5',{k,n:5}):''}</div>`).join('')}</div>`,{wide:true});
UI.onAct('lcbuy',async d=>{ const r=await req({t:'lc',op:'buy',k:d.k,n:+d.n}); if(!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });

/* ---------- bảng đội Lính Cát (nút 🐾 bên phải) ---------- */
UI.lcParty=()=>UI.open('🐾 Đội Lính Cát',()=>{ const r=lc();
  const deck=deckBtn();
  if(!trained()) return deck+`<p>Chưa biết huấn luyện Lính Cát. Tới <b>Trung tâm Lính Cát</b> cạnh Khu tâm linh (phía Đông chùa Đà Bắc, có tượng Bóng Cát) học với Giáo sư Cát, rồi chọn 1 con khởi đầu.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm',{},'go')}`;
  if(!r.party.length) return deck+`<p>Chưa có Lính Cát nào. Ra bàn 3 Bóng Cát trong Trung tâm chọn con khởi đầu nhé.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm',{},'go')}`;
  return deck+badgeRow()+`<p class="muted">Con đứng đầu đội sẽ ra sân trước và đi theo bạn. Bóng Cát: <b>${cnt('bong_cat')}</b> · Bóng Vàng: <b>${cnt('bong_vang')}</b> · Thuốc: <b>${cnt('thuoc_cat')}</b></p>
    ${r.party.map((m,i)=>monRow(m,(i?btn('lclead','Lên đầu đội',{u:m.u}):'<small class="good">Đầu đội</small>')+(cnt('thuoc_cat')&&m.hp<maxHp(m)?btn('lcpot','Cho uống thuốc',{u:m.u}):'')+lvBtns(m))).join('')}
    <h5>📦 Trong máy gửi giữ (${(r.box||[]).length}/${L.box})</h5>${(r.box||[]).map(m=>monRow(m,'')).join('')||'<p class="muted">Chưa có con nào. Đội đủ 5 con thì con mới bắt được tự gửi vào máy.</p>'}
    ${(r.box||[]).length?`<p class="muted">Muốn mang con trong máy theo: tới máy gửi giữ ở Trung tâm Lính Cát (cạnh Khu tâm linh hoặc quảng trường MU) bấm "Mang theo".</p>${btn('lcboxgo','📦 Mở máy gửi giữ')}`:''}
    <p class="muted">📖 Sách Kinh Nghiệm (+1 / +5 cấp) mua ở kệ hàng Trung tâm. 💎 Ngọc Cường Hoá cho Lính Cát ăn: +1 → +12, mỗi cấp +${Math.round(L.enh.per*100)}% mọi chỉ số (tỉ lệ như khắc đồ, thất bại mất ngọc). 🌟 Đền Lính Cát Huyền Thoại ở MU.</p>
    <p class="muted">Ra bãi cỏ quanh Ké tìm Lính Cát hoang (bấm E để đấu). Vật nuôi thả rông cạnh sân Ké cũng đấu được. Thú ở vườn quốc gia là thú bảo tồn: đấu xong dễ bị công an bắt!</p>
    <p class="muted">🏟 15 CLB Lính Cát nằm ở chỗ vắng trong rừng phía Bắc và vườn quốc gia: 12 võ đài (thắng nhận Huy hiệu Chande, đủ 12 chọn 1 trong 5 vũ khí tối thượng), 3 CLB luyện tập đấu lấy EXP. 👑 Đủ Lv50 Lính Cát thức tỉnh dạng Huyền Thoại.</p>`; },{wide:true});
// nút đọc sách / ăn ngọc trên mỗi con
const lvBtns=m=>{ const E=SD.ENH, L0=m.enh||0; return (cnt('sach_kn')&&m.lv<50?btn('lcbook',`📖 +1 cấp (${cnt('sach_kn')})`,{u:m.u,k:'sach_kn'}):'')+(cnt('sach_kn5')&&m.lv<50?btn('lcbook',`📗 +5 cấp (${cnt('sach_kn5')})`,{u:m.u,k:'sach_kn5'}):'')
  +(lc().wpn&&m.held!==lc().wpn?btn('lchold',`⚔ Cầm ${WPN[lc().wpn].name}`,{u:m.u}):'')+(L0<E.max&&cnt('ngoc_ch')?btn('lcgem',`💎 Ăn ngọc +${L0+1} (${Math.round(E.rate[L0]*100)}%)`,{u:m.u}):'')+(L0<E.max&&cnt('ngoc_ch_ht')?btn('lcgem','💠 Ngọc HT 80%',{u:m.u,legend:1}):''); };
UI.onAct('lcbook',async d=>{ const r=await req({t:'lc',op:'book',u:+d.u,k:d.k}); if(!r.err){ GAME.sfx('level_up',.6); if(r.evo) GAME.bigText('TIẾN HOÁ!'); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.onAct('lcgem',async d=>{ if(!cnt(d.legend?'ngoc_ch_ht':'ngoc_ch')){ if(window.MU9) window.MU9.lack(d.legend?'ngoc_ch_ht':'ngoc_ch'); return; } const r=await req({t:'lc',op:'gem',u:+d.u,legend:d.legend?1:0}); if(r.err) return;
  GAME.sfx(r.ok?'level_up':'poof',.8); if(window.MU9) window.MU9.result(r,r.name); else toast(esc(r.msg),r.ok?'item':'lock'); UI.refresh(); });
UI.onAct('lclead',async d=>{ await req({t:'lc',op:'lead',u:+d.u}); UI.refresh(); }); UI.onAct('lcpot',async d=>{ const r=await req({t:'lc',op:'potion',u:+d.u}); if(!r.err) toast(esc(r.msg),'item'); UI.refresh(); });
/* ---------- Poke Deck: sổ tay mọi Lính Cát của thế giới Chande — họ tiến hoá, bậc, hệ, chỉ số gốc, nơi gặp, huyền thoại (nút 📖 ở bảng đội / Giáo sư Cát) ---------- */
let deckTab='fam', deckType='';
const PREV={}; for(const [k,s] of Object.entries(SP)){ if(s.evo) PREV[s.evo.to]=k; if(s.stone) for(const to of Object.values(s.stone)) PREV[to]=k; }
// họ tiến hoá: từ loài gốc (không ai tiến hoá thành) đi theo evo / đá; Cát Con rẽ 8 nhánh
const FAMS=Object.keys(SP).filter(k=>!PREV[k]).map(root=>{ const out=[], walk=k=>{ out.push(k); const s=SP[k]; if(s.evo&&SP[s.evo.to]) walk(s.evo.to); if(s.stone) for(const to of Object.values(s.stone)) if(SP[to]) walk(to); }; walk(root); return out; });
const WHERE=(()=>{ const w={}, add=(k,s)=>{ if(SP[k]) (w[k]=w[k]||new Set()).add(s); };
  const ZN={1:'Ké & MU · vùng gần Lv2–5',2:'Ké & MU · vùng giữa Lv6–12',3:'Ké & MU · vùng xa Lv12–22',4:'Sâu trong vườn quốc gia Lv20–32'}, MN={dalat:'Trang trại bác Trang (Đà Lạt)',mieu:'Miếu ông Trường Con',deo:'Đèo'};
  for(const [z,Z] of Object.entries(L.zones)) for(const k of Z.pool) add(k,ZN[z]);
  for(const [m,M] of Object.entries(L.maps)) if(M.pool) for(const k of M.pool) add(k,MN[m]||m);
  const WN={1:'Hồ Hoà Bình gần khu nghỉ (dưới nước)',2:'Giữa hồ Hoà Bình, ao Rừng phía Bắc (dưới nước)',3:'Cuối hồ Hoà Bình, suối Vườn quốc gia (dưới nước)'};
  for(const [z,Z] of Object.entries(L.wzones||{})) for(const k of Z.pool) add(k,WN[z]);
  if(L.wRare) add(L.wRare.sp,`Cuối hồ / suối, cực hiếm ${Math.round(L.wRare.chance*100)}%, Lv${L.wRare.lv}+`);
  for(const f of L.farm) add(f[2],'Sân Ké (vật nuôi thả rông)'); for(const k of Object.values(L.park)) add(k,'Vườn quốc gia (thú bảo tồn, đấu dễ bị bắt)');
  for(const k of L.starters) add(k,'Quà khởi đầu của Giáo sư Cát');
  for(const k of L.legend) add(k,`Vùng xa Ké / MU, cực hiếm ${(L.legendChance*100).toFixed(1).replace('.',',')}%, Lv30+`);
  for(const k of L.badge.choices) add(k,`Đổi ${SD.ITEMS[L.badge.item].name} (Làng Meme, MU) khi đầu đội Lv${L.badge.lv}`);
  add(L.men.sp,'Rừng Ké, thi thoảng lang thang ở bãi rừng xa · mỗi người 1 con'); add(L.bn.sp,`Nơi làm việc (Lumen, Bearplus, Everfit, VNPT, Nghiện Motion, Lavi, 120 Yên Lãng, DAS), mỗi lần ở ${L.bn.stay/1000} giây · chỉ Bóng Huyền Thoại bắt được`);
  for(const k of L.dragon.choices) add(k,`Triệu hồi ở Tế đàn Rồng Thần bằng ${L.dragon.need} ${SD.ITEMS[L.dragon.item].name} · cả server chỉ 1 con`);
  for(const k of ((L.water||{}).dalat||[]).length?LINEW():[]) add(k,'Ao trang trại bác Trang (dưới nước)');
  return w; })();
const STAGE=['','Bậc 1','Bậc 2','Bậc 3']; function LINEW(){ return L.wzones[1].pool.concat(L.wzones[2].pool); }
const sbars=b=>`<span class="pdsb">${['Máu','Công','Thủ','Tốc'].map((n,i)=>`<i title="${n} ${b[i]}"><em style="width:${Math.min(100,Math.round(b[i]/1.6))}%"></em><u>${n} ${b[i]}</u></i>`).join('')}</span>`;
const how=(from,to)=>{ const s=SP[from]; if(s.evo&&s.evo.to===to) return `Lv${s.evo.lv}`; if(s.stone){ const st=Object.keys(s.stone).find(k=>s.stone[k]===to); if(st) return `${SD.ITEMS[st].name} · Lv${s.stoneLv}`; } return ''; };
function deckCard(k){ const s=SP[k], d=(lc().dex||{})[k], wh=[...(WHERE[k]||[])];
  return `<div class="pdk ${d===2?'got':d?'seen':''} ${s.legend?'leg':''} ${s.rare?'rare':''}"><i class="pdst">${d===2?'✔ đã bắt':d?'👁 đã gặp':'chưa gặp'}</i>${img(k,64)}<b>${s.legend?'★ ':s.rare?'✦ ':''}${esc(s.name)}</b>
    <span>${chips(k)} <small>${STAGE[s.st]||''}${s.night?' · 🌙 chỉ ban đêm':''}${s.water?' · 🌊 dưới nước':''}${s.sl?` · thần thú ×${s.sl}`:''}</small></span>${sbars(s.b)}
    <p>${esc(s.desc||'')}</p><small class="pdw">📍 ${wh.length?wh.map(esc).join(' · '):'Chỉ có khi tiến hoá'}</small></div>`; }
// dạng Huyền Thoại Lv50: thẻ riêng sau bậc cuối (loài còn tiến hoá thì tới Lv50 đã là dạng sau) · hình to hơn, ánh hologram, vòng aura, chỉ số ×1,2 + chỉ số phụ lối tướng Dota
const ascTxt=(k,v)=>k==='bkb'?`${SD.LC_ASC.names[k]} mỗi ${v} giây`:`${SD.LC_ASC.names[k]} +${Math.round(v*1000)/10}%`;
function ascCard(k){ const s=SP[k], a=SD.lcAsc(k); if(!a||s.evo) return ''; const pet=SD.LC_ASC.pet, P0=Object.keys(a.v).filter(x=>pet.includes(x)), O=Object.keys(a.v).filter(x=>!pet.includes(x));
  return `<span class="pdarr">Lv50 ➜</span><div class="pdk asc"><i class="pdst">👑 Lv50</i><span class="pdaura">${img(k,72,true)}</span><b>${esc(s.name)}</b><span class="pdascn">✦ Dạng Huyền Thoại ✦</span>
    <span>${chips(k)} <small>lối ${esc(a.hero)} · chỉ số ×${String(SD.LC_ASC.mul).replace('.',',')}</small></span>${sbars(s.b.map(v=>Math.round(v*SD.LC_ASC.mul)))}
    <small class="pdasc">${P0.map(x=>esc(ascTxt(x,a.v[x]))).join(' · ')}${O.length?`<br><b>Cho chủ:</b> ${O.map(x=>esc(ascTxt(x,a.v[x]))).join(' · ')}`:''}</small></div>`; }
function deckFam(f){ const root=f[0], s=SP[root];
  if(s.stone){ return `<div class="pdfam"><div class="pdrow">${deckCard(root)}<span class="pdarr">8 loại đá ➜</span></div><div class="pdbr">${f.slice(1).map(k=>`<div class="pdrow"><span class="pdarr">${esc(how(root,k))} ➜</span>${deckCard(k)}${ascCard(k)}</div>`).join('')}</div></div>`; }
  return `<div class="pdfam"><div class="pdrow">${f.map((k,i)=>(i?`<span class="pdarr">${esc(how(f[i-1],k))} ➜</span>`:'')+deckCard(k)).join('')}${ascCard(f[f.length-1])}</div></div>`; }
// nút mở Poke Deck: quyển sổ bìa đỏ trắng có Bóng Cát (vẽ pixel), tiêu đề + mô tả
let DECKICO=''; const deckIco=()=>DECKICO||(DECKICO=(()=>{ const s=A.sprite(20,22,10,21,(g,P)=>{ P.rect(3,1,14,20,'#b8202a'); P.rect(3,1,14,2,'#e8403a'); P.rect(3,11,14,10,'#f4f1ea'); P.rect(3,10,14,2,'#1c1516');
  P.disc(10,11,4,'#1c1516'); P.disc(10,11,3,'#f4f1ea'); P.rect(7,8,7,3,'#d8302a'); P.disc(10,11,1,'#1c1516'); P.rect(1,2,2,19,'#7a1018'); P.rect(17,3,2,18,'#e8dcc0'); for(let y=4;y<20;y+=2) P.px(18,y,'#c8b898');
  P.rect(5,3,3,1,'#ffb0a8'); P.rect(5,17,10,1,'#d8d2c6'); P.rect(5,19,7,1,'#d8d2c6'); }); const c=document.createElement('canvas'); c.width=60; c.height=66; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,60,66); return c.toDataURL(); })());
const deckBtn=()=>`<button class="pdbtn" type="button" data-a="lcdeck"><img src="${deckIco()}" alt=""><span><b>POKE DECK</b><small>Sổ tay ${Object.keys(SP).length} loài Lính Cát · huyền thoại · các bậc tiến hoá · nơi gặp</small></span><em>Mở ➜</em></button>`;
UI.lcDeck=tab=>{ if(tab) deckTab=tab; UI.open('Poke Deck · Lính Cát thế giới Chande',()=>{ const dex=lc().dex||{}, all=Object.keys(SP), seen=all.filter(k=>dex[k]).length, got=all.filter(k=>dex[k]===2).length;
  const isNpc=k=>SP[k].npc, isLeg=k=>SP[k].legend||SP[k].rare, fams=FAMS.filter(f=>!f.some(isNpc)&&!f.every(isLeg)), legs=all.filter(isLeg), npcs=all.filter(isNpc);
  const byType=f=>!deckType||f.some(k=>SP[k].t===deckType||SP[k].t2===deckType);
  const tabs=[['fam',`🧬 Họ tiến hoá (${fams.reduce((a,f)=>a+f.length,0)})`],['leg',`★ Huyền thoại (${legs.length})`],['npc',`🐄 Vật nuôi & thú rừng (${npcs.length})`]];
  let body='';
  if(deckTab==='fam') body=`<div class="pdtypes">${btn('pdtype','Mọi hệ',{t:''},deckType?'':'pri')}${Object.keys(TY).map(t=>`<button class="lct pdtb ${deckType===t?'on':''}" style="background:${TY[t].col}" data-a="pdtype" data-t="${t}">${TY[t].name}</button>`).join('')}</div>
    ${fams.filter(byType).map(deckFam).join('')||'<p class="muted">Không có họ nào thuộc hệ này</p>'}`;
  if(deckTab==='leg') body=`<p>Huyền thoại cực hiếm: 3 thần điểu và Tiểu Thần Cát lâu lâu mới hiện ở vùng xa, 3 thần thú đổi bằng Huy Hiệu Pepe, Thuồng Luồng ẩn dưới hồ Hoà Bình, <b>Mèn Mén</b> lang thang rừng Ké (Ném Cứt độc cộng dồn), <b>Blacknut</b> ghé nơi làm việc 10 giây (đầu đội: tiền + EXP ×2), <b>Hắc Long và Bạch Long</b> triệu hồi bằng ${L.dragon.need} Mảnh Triệu Hồi (NPC rừng Đà Bắc tặng ${Math.round(L.dragon.chance*100)}% mỗi lần xong việc), cả server mỗi con chỉ 1 chủ. Bắt được rồi có thể mang tới <b>Đền Lính Cát Huyền Thoại</b> ở MU (${Object.keys(L.myth.cost).map(k=>SD.ITEMS[k].name).join(' + ')}) để lên dạng huyền thoại: ×${String(L.myth.mul).replace('.',',')} chỉ số, hào quang vàng, kỹ năng tự đánh boss.</p>
    <div class="pdgrid">${legs.map(deckCard).join('')}</div>`;
  if(deckTab==='npc') body=`<p class="muted">Vật nuôi ở sân Ké đấu được nhưng không thu phục. Thú ở vườn quốc gia là thú bảo tồn: đấu xong dễ bị kiểm lâm bắt, phạt tiền.</p><div class="pdgrid">${npcs.map(deckCard).join('')}</div>`;
  return `<p>Thế giới Chande có <b>${all.filter(k=>!isNpc(k)).length}</b> loài Lính Cát (cộng ${npcs.length} vật nuôi, thú rừng) thuộc <b>${Object.keys(TY).length}</b> hệ, nhiều loài mang 2 hệ · bạn đã gặp <b>${seen}</b>, đã bắt <b>${got}</b>. Tiến hoá: đủ cấp thì tự tiến hoá; Cát Con tiến hoá bằng đá ở Giáo sư Cát. Đủ <b>Lv50</b> mọi loài (trừ huyền thoại) thức tỉnh <b>👑 dạng Huyền Thoại</b>: chỉ số ×${String(SD.LC_ASC.mul).replace('.',',')} và bộ chỉ số phụ theo lối chơi 1 tướng Dota.</p>
    <div class="tabs">${tabs.map(([k,n])=>`<button class="tab ${k===deckTab?'on':''}" data-a="pdtab" data-k="${k}">${n}</button>`).join('')}</div>${body}
    <h5>Bảng khắc hệ (khắc ×2, bị kháng ×0,5, chiêu cùng hệ +25%)</h5>${typeChart()}`; },{xwide:true}); };
/* ---------- 15 NPC rừng Đà Bắc: nói chuyện lộ nhiệm vụ ẩn Lính Cát (server lcquest.js), lộ rồi thì hiện tiến độ / nút báo cáo ---------- */
const lcqOf=id=>Object.keys(SD.QUESTS).find(k=>SD.QUESTS[k].giver===id&&k.startsWith('lcq_'));
UI.defPlace('lcforest',n=>{ const id=n&&n.id, q=lcqOf(id); if(!q) return; const Q=SD.QUESTS[q];
  UI.open(SD.NPC_LOOKS[id].name,()=>{ const st=(G().quests||{})[q], today=((G().daily||{}).lcqd||{})[q], DR=L.dragon, shard=`<p class="muted">🐉 Xong việc có ${Math.round(DR.chance*100)}% được tặng ${esc(SD.ITEMS[DR.item].name)} (đang có ${cnt(DR.item)}/${DR.need}).</p>`;
    if(st==='done') return `<p>"Cảm ơn cháu nhiều nhé!"</p>${today?'<p class="muted">Hôm nay xong việc này rồi, mai quay lại giúp tiếp nhé.</p>':btn('lcqtalk','🔁 Nhận lại việc hôm nay',{id:q},'pri')}${shard}`;
    return `<p>"${esc(Q.say)}"</p>${st?UI.qRow(q):`${btn('lcqtalk','💬 Hỏi chuyện',{id:q},'pri')}<p class="muted">Người trong rừng hay giấu chuyện, hỏi kỹ mới kể.</p>`}${shard}`; }); });
UI.onAct('lcqtalk',async d=>{ const r=await req({t:'lcq',id:d.id}); if(r.err) return; if(r.secret){ GAME.sfx('level_up',.5); GAME.bigText('NHIỆM VỤ ẨN!'); } toast(esc(r.msg),'quest'); UI.refresh(); });
UI.onAct('pdtab',d=>{ deckTab=d.k; UI.refresh(); });
UI.onAct('pdtype',d=>{ deckType=d.t||''; UI.refresh(); });
UI.onAct('lcdeck',()=>UI.lcDeck());
UI.onAct('lcgo',()=>{ UI.closeAll(); const S=GAME.S; if(S.kind==='linhcat') return toast('Bạn đang ở trong Trung tâm rồi','item'); if(S.kind!=='retreat'){ toast('Trung tâm Lính Cát ở cạnh Khu tâm linh (Ké): bấm G gọi Grab về Ké','quest'); return UI.grab(); } GAME.walkTo(L.door.x,L.door.y,'Trung tâm Lính Cát'); });
setTimeout(()=>{ const b=$('#btnLc'); if(b) b.addEventListener('click',e=>{ e.currentTarget.blur(); if(GAME.S) UI.lcParty(); }); },0);

/* ---------- 15 CLB Lính Cát: 12 võ đài (Huy hiệu Chande), 3 CLB luyện tập, 5 vũ khí tối thượng · Tế đàn Rồng Thần ---------- */
const CL=SD.LCCLUB, nBadge=()=>Object.keys(lc().badges||{}).length;
const weak=t=>Object.keys(TY).filter(a=>((SD.LC_EFF[a]||{})[t]||1)>1);   // hệ khắc được hệ t
function badgeRow(){ const bd=lc().badges||{}; return `<div class="lcbadges">${CL.gyms.map(g0=>`<span class="lcbd ${bd[g0.n]?'on':''}" style="--tc:${TY[g0.t].col}" title="${esc(g0.badge)} · võ đài ${esc(TY[g0.t].name)}${bd[g0.n]?' · đã có':''}">${bd[g0.n]?'🏅':g0.n}</span>`).join('')}<small>${nBadge()}/12 Huy hiệu Chande${lc().wpn?` · ⚔ ${esc(WPN[lc().wpn].name)}`:''}</small></div>`; }
UI.defPlace('lcgym',n=>{ const g0=CL.gyms.find(x=>'lcg_'+x.n===(n&&n.id)); if(!g0) return; UI.open(`🏟 Võ đài CLB ${TY[g0.t].name} · ${g0.name}`,()=>{ const r=lc(), own=(r.badges||{})[g0.n], today=((G().daily||{}).lcgymR||{})[g0.n], lv=g0.team.map(x=>x[1]);
  if(!trained()) return `<p>"${esc(g0.say)}"</p><p class="bad">Phải là huấn luyện viên Lính Cát mới lên võ đài được.</p>${btn('lcgo','➜ Tới Trung tâm Lính Cát học',{},'go')}`;
  const team=g0.team.map(([sp,l,enh,asc])=>`<span class="lcteam" title="${(r.dex||{})[sp]?esc(SP[sp].name):'???'} Lv${l}">${(r.dex||{})[sp]?img(sp,40,!!asc):'<i>?</i>'}<small>Lv${l}${enh?' +'+enh:''}${asc?' 👑':''}</small></span>`).join('');
  const wpn=nBadge()>=12&&!r.wpn?`<h5>⚔ Chọn 1 vũ khí tối thượng cho Lính Cát (đủ 12 huy hiệu)</h5><div class="list rows">${Object.entries(WPN).map(([k,w])=>`<div class="row">${UI.ico('lcw_'+k)}<span><b>${esc(w.name)}</b><br><small class="muted">${esc(w.desc)}</small></span>${btn('lcwpn','Chọn',{k},'pri')}</div>`).join('')}</div><p class="muted">Chỉ chọn được 1 lần. Vũ khí trao cho Lính Cát nào cũng được, đổi qua lại ở bảng đội 🐾.</p>`:'';
  return `<p>"${esc(g0.say)}"</p>${badgeRow()}<p>Thắng nhận <b>${esc(g0.badge)}</b> · ${fmt(g0.prize.vnd)} · ${g0.prize.exp} EXP${g0.prize.items?' · '+Object.entries(g0.prize.items).map(([k,v])=>`${v} ${esc(SD.ITEMS[k].name)}`).join(', '):''}</p>
    <p class="muted">Đội ${g0.team.length} con Lv${Math.min(...lv)}–${Math.max(...lv)}, con trước gục thì con sau ra. Hệ ${esc(TY[g0.t].name)} sợ ${weak(g0.t).map(chip).join(' ')} (nhiều con mang thêm hệ phụ, xem kỹ trong trận). Không ném bóng, bỏ chạy là thua, không nhận thần thú siêu huyền thoại.</p>
    <div class="lcteamrow">${team}</div>
    ${own?(today?'<p class="good">✔ Đã có huy hiệu · hôm nay đã đấu lại rồi</p>':`<p class="good">✔ Đã có huy hiệu này</p>${btn('lcgymgo',`⚔ Đấu lại (thưởng ${Math.round(CL.rematch*100)}%, 1 lần/ngày)`,{n:g0.n})}`):btn('lcgymgo','⚔ Thách đấu võ đài',{n:g0.n},'pri')}${wpn}`; },{wide:true}); });
UI.onAct('lcgymgo',d=>{ UI.closeAll(); battle({op:'gym',n:+d.n}); });
UI.onAct('lcwpn',async d=>{ const r=await req({t:'lc',op:'wpn',k:d.k}); if(r.err) return; GAME.sfx('level_up',.9); GAME.bigText('VŨ KHÍ TỐI THƯỢNG!'); toast(esc(r.msg),'item'); UI.refresh(); });
UI.onAct('lchold',async d=>{ const r=await req({t:'lc',op:'hold',u:+d.u}); if(!r.err) toast(esc(r.msg),'item'); UI.refresh(); });
UI.defPlace('lctrain',n=>{ const t0=CL.train.find(x=>'lct_'+x.k===(n&&n.id)); if(!t0) return; UI.open('🥋 '+t0.name,()=>{ const d=(G().daily||{}).lcspar||0, lead=(lc().party||[]).find(x=>x.hp>0&&!SP[x.sp].sl);
  if(!trained()) return `<p class="bad">Phải là huấn luyện viên Lính Cát mới đấu tập được.</p>${btn('lcgo','➜ Tới Trung tâm Lính Cát học',{},'go')}`;
  return `<p>"${t0.off<0?'Mới vào nghề thì tập với bọn tân binh cho quen tay đã.':t0.off<3?'Đội tập của CLB ngang sức con đầu đội của bạn, tập đều là lên tay.':'Cao thủ ở đây mạnh hơn bạn vài cấp. Thắng được là đủ sức lên võ đài lớn!'}"</p>
    <p>Đối thủ: ${t0.n} con, cấp bằng con đầu đội ${t0.off>=0?'+':''}${t0.off}${lead?` (≈ Lv${Math.max(3,lead.lv+t0.off)})`:''} · EXP Lính Cát ×${String(t0.mul).replace('.',',')} · thưởng ${fmt(t0.vnd)} / trận thắng</p>
    <p class="muted">Hôm nay đã tập ${d}/${CL.sparDay} trận (tính chung 3 CLB luyện tập).</p>${d<CL.sparDay?btn('lcspargo','🥋 Đấu tập',{k:t0.k},'pri'):'<p class="muted">Mai tập tiếp nhé.</p>'}`; }); });
UI.onAct('lcspargo',d=>{ UI.closeAll(); battle({op:'spar',k:d.k}); });
UI.lcAltar=async()=>{ const r=await req({t:'lcdragon',op:'view'}); if(r.err) return; const D0=r.dragon; UI.open('🐉 Tế đàn Rồng Thần',()=>{ const DR=L.dragon, have=cnt(DR.item);
  return `<p>Tương truyền ai gom đủ <b>${DR.need} ${esc(SD.ITEMS[DR.item].name)}</b> đặt lên tế đàn sẽ gọi được 1 trong 2 rồng thần. 15 người sống trong rừng Đà Bắc giữ mảnh: giúp họ xong việc (mỗi ngày làm lại được) có ${Math.round(DR.chance*100)}% được tặng 1 mảnh. Cả Chan City mỗi con chỉ có 1 chủ, mỗi người chỉ được 1 con.</p>
    <p>Bạn đang có <b>${have}/${DR.need}</b> mảnh.</p><div class="lcstarters">${DR.choices.map(k=>{ const o=D0.owners[k]; return `<div class="lcst">${img(k,84)}<b>${esc(SP[k].name)}</b>${chips(k)}<small>${esc(SP[k].desc)}</small>
    ${o?`<small class="bad">Đã có chủ: <b>${esc(o.name)}</b></small>`:D0.mine?'<small class="muted">Bạn đã có rồng thần của mình</small>':btn('lcsummon',`🐉 Triệu hồi (${DR.need} mảnh)`,{sp:k},have>=DR.need?'pri':'')}</div>`; }).join('')}</div>`; },{wide:true}); };
UI.onAct('lcsummon',async d=>{ const r=await req({t:'lcdragon',op:'summon',sp:d.sp}); if(r.err) return; UI.closeAll(); GAME.sfx('level_up',1); GAME.bigText(SP[d.sp].name.toUpperCase()+'!'); toast(esc(r.msg),'quest'); });

/* ---------- Lính Cát hoang, vật nuôi, thú vườn quốc gia trên map Ké ---------- */
let WILD=[], wildT=0, wildScene=''; const wildNow=()=>{ const t=NET.now(), k=GAME.S&&GAME.S.kind; if(t-wildT>1000||k!==wildScene){ wildT=t; wildScene=k; const gone=lc().gone||{}; WILD=SD.lcWild(t,k).filter(w=>!gone[w.key]); } return WILD; };
const farmPos=(f,i,clock)=>[f[0]+Math.sin(clock*.4+i*2)*1.2,f[1]+Math.cos(clock*.3+i)*.6];
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); const S=GAME.S; if(!S||!L.maps[S.kind]||BT) return; const tr=trained();
  for(const w of wildNow()){ const d=dist(w.x*T,w.y*T); if(d<(w.water?46:30)) consider(d*.6,{type:'mapx',k:'lcwild',i:w.i,label:tr?(w.bn?`⚔ Đấu Blacknut huyền thoại · Lv${w.lv} (cần Bóng Huyền Thoại)`:`⚔ Đấu ${SP[w.sp].name} hoang · Lv${w.lv}`):`${SP[w.sp].name} hoang (học Huấn luyện Lính Cát để đấu)`}); }
  if(tr&&S.kind==='retreat') L.farm.forEach((f,i)=>{ const [x,y]=farmPos(f,i,GAME.clock), d=dist(x*T,y*T); if(d<28) consider(d*.7,{type:'mapx',k:'lcfarm',i,label:'⚔ Cho Lính Cát đấu với '+SP[f[2]].name}); });
  if(S.kind==='retreat'){ const A0=L.dragon.altar, d=dist(A0.x*T,A0.y*T); if(d<44) consider(d*.5,{type:'mapx',k:'lcaltar',label:'🐉 Tế đàn Rồng Thần (bấm E)'}); }
  if(tr&&S.kind==='retreat') for(const s of SD.PARK.spots){ const sp=L.park[s.k]; if(!sp) continue; const d=dist(s.x*T,s.y*T); if(d<46) consider(d+12,{type:'mapx',k:'lcpark',park:s.k,label:`⚔ Đấu với ${SP[sp].name} (thú bảo tồn, dễ bị bắt!)`}); } };
UI.lcNeed=()=>UI.open('Chưa biết huấn luyện Lính Cát',()=>`<p>Muốn đấu và thu phục Lính Cát thì phải học <b>Huấn luyện Lính Cát</b> với Giáo sư Cát ở <b>Trung tâm Lính Cát</b> (cạnh Khu tâm linh, phía Đông chùa Đà Bắc, có tượng Bóng Cát). Học xong được tặng 1 con khởi đầu.</p>${btn('lcgo','➜ Chỉ đường tới Trung tâm Lính Cát',{},'pri')}`);
const p0=X.pick; X.pick=x=>{ if(x.k==='lcaltar') return UI.lcAltar(); if(x.k==='lcwild'||x.k==='lcfarm'||x.k==='lcpark'){ if(!trained()) return UI.lcNeed();
    return battle(x.k==='lcwild'?{op:'wild',i:x.i}:x.k==='lcfarm'?{op:'farm',i:x.i}:{op:'park',k:x.park}); } return p0(x); };
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim;
  if(a==='lcheal'){ const f=Math.floor(clock*2)%7; return SPR['h'+f]||(SPR['h'+f]=A.healMachine(f)); } if(a==='lcpc'){ const f=Math.floor(clock*2)%2; return SPR['p'+f]||(SPR['p'+f]=A.pcBox(f)); } return a0(o,clock); }; const SPR={};
let FOL=null, lastClock=0;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const S=GAME.S, P=GAME.P; if(!S||!P) return; const cam=GAME.cam, clock=GAME.clock, dt=Math.min(.1,Math.max(0,clock-lastClock)); lastClock=clock;
  if(L.maps[S.kind]){ const vx=cam.x-40, vy=cam.y-40, vw=innerWidth+80, vh=innerHeight+80, inV=(x,y)=>x>vx&&y>vy&&x<vx+vw&&y<vy+vh;
    for(const w of wildNow()){ const x=w.x*T, y=w.y*T; if(!inV(x,y)) continue; const fr=Math.floor(clock*2+w.i)%2, sp=A.linhcat(w.sp,fr,Math.sin(clock*.5+w.i)>0);
      list.push({y,d:()=>{ if(w.water){ const X0=Math.round(x-cam.x), Y0=Math.round(y-cam.y), bob=Math.round(Math.sin(clock*2+w.i)*1.5), k=(clock*.8+w.i*.3)%1;   /* dưới nước: gợn sóng lan, nhấp nhô */
          ctx.strokeStyle=`rgba(220,245,255,${.75-k*.6})`; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(X0,Y0-2,8+k*8,3+k*3,0,0,7); ctx.stroke(); ctx.drawImage(sp.c,0,0,28,22,X0-sp.ax,Y0-sp.ay+bob+4,28,22); return; }
        GAME.shadow(x,y,8); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }}); }
    if(S.kind==='retreat'){ const x=171*T, y=36.4*T; if(inV(x,y)){ const ball=A.lcBall(0), bob=Math.sin(clock*2)*3, pul=.5+.5*Math.sin(clock*3);   /* Trung tâm Lính Cát: Bóng Cát khổng lồ phát sáng nổi trên mái */
      list.push({y:y+200,d:()=>{ const X0=Math.round(x-cam.x), Y0=Math.round(y-cam.y+bob); const gr=ctx.createRadialGradient(X0,Y0,4,X0,Y0,34); gr.addColorStop(0,`rgba(255,216,74,${.55*pul+.2})`); gr.addColorStop(1,'rgba(255,216,74,0)'); ctx.fillStyle=gr; ctx.fillRect(X0-36,Y0-36,72,72);
        ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(ball.c,X0-14,Y0-14,28,28); ctx.restore(); }}); } }
    if(S.kind==='retreat') L.farm.forEach((f,i)=>{ const [fx,fy]=farmPos(f,i,clock), x=fx*T, y=fy*T; if(!inV(x,y)) return; const sp=A.linhcat(f[2],Math.floor(clock*2+i)%2,Math.cos(clock*.4+i*2)>0); list.push({y,d:()=>{ GAME.shadow(x,y,9); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }}); }); }
  // con đầu đội đi theo người, cả khi cưỡi ngựa / thần thú (chạy sau đuôi ngựa); không theo khi đi xe / chèo kayak / đua ngựa / bốc đầu ở đèo
  const lead=(lc().party||[])[0]; if(!lead||lead.hp<=0||P.kayak||P.moto||P.incar||P.pcar||P.opt||['phongbay','track','deo'].includes(S.kind)){ FOL=null; return; }
  const tx=P.x-(P.face||1)*(P.riding?34:lead.asc?25:20), ty=P.y+3; if(!FOL||FOL.sp!==lead.sp||FOL.scene!==S.kind||Math.hypot(FOL.x-tx,FOL.y-ty)>200) FOL={sp:lead.sp,x:tx,y:ty,scene:S.kind,face:1};
  const dx=tx-FOL.x, dy=ty-FOL.y, dd=Math.hypot(dx,dy); if(dd>4){ const k=Math.min(1,dt*5); FOL.x+=dx*k; FOL.y+=dy*k; if(Math.abs(dx)>1) FOL.face=dx>0?1:-1; }
  const moving=dd>6, fr=Math.floor(clock*(moving?6:2))%2, sp=(lead.asc?A.linhcatAsc:A.linhcat)(FOL.sp,fr,FOL.face>0), fx=FOL.x, fy=FOL.y;
  // dạng huyền thoại: hào quang vàng dưới chân + 3 đốm lấp lánh quanh người
  const myth=!!lead.myth&&!lead.asc, asc=!!lead.asc, glow=()=>{ const X0=Math.round(fx-cam.x), Y0=Math.round(fy-cam.y)-9, gr=ctx.createRadialGradient(X0,Y0,1,X0,Y0,15); gr.addColorStop(0,'rgba(255,236,140,.55)'); gr.addColorStop(1,'rgba(255,200,60,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(X0,Y0,15,0,7); ctx.fill(); ctx.fillStyle='#fff3b0'; for(let i=0;i<3;i++){ const a=clock*2.2+i*2.09, tw=Math.sin(clock*6+i*1.7)>.2; if(tw) ctx.fillRect(Math.round(X0+Math.cos(a)*11),Math.round(Y0+Math.sin(a)*7),1,1); } };
  list.push({y:fy,d:()=>{ if(asc) A.lcAura(ctx,Math.round(fx-cam.x),Math.round(fy-cam.y),clock,15); else GAME.shadow(fx,fy,7); if(myth) glow(); ctx.drawImage(asc?A.lcHolo(sp,clock):sp.c,Math.round(fx-sp.ax-cam.x),Math.round(fy-sp.ay-cam.y-(moving&&fr?1:0))); }}); };   /* dạng Lv50: vòng aura xoay, ánh hologram */

// nhãn "Lv cấp + tên" của con hoang ở gần: vẽ ở lớp giao diện cho chữ nét
// Blacknut: bong bóng thoại thi thoảng nói, còn mấy giây nữa thì biến
function bnTalk(ug,x,y,w){ const t=NET.now(), left=Math.max(0,Math.ceil((w.until-t)/1000)), say=Math.floor(t/3500)%3<2?L.bn.say[Math.floor(t/7000)%L.bn.say.length]:'';
  const tl=`Huyền Thoại · biến sau ${left}s`, w0=ug.measureText(tl).width+10; ug.fillStyle='rgba(90,42,138,.9)'; ug.fillRect(Math.round(x-w0/2),y-16,w0,16); ug.fillStyle='#ffe08a'; ug.fillText(tl,x,y-2);
  if(say){ const w1=ug.measureText(say).width+14, X0=Math.round(x-w1/2), Y0=y-40; ug.fillStyle='#fffdf4'; ug.fillRect(X0,Y0,w1,20); ug.fillRect(Math.round(x)-3,Y0+20,6,3); ug.fillStyle='#1c1516'; ug.fillRect(X0,Y0,w1,1); ug.fillRect(X0,Y0+19,w1,1); ug.fillRect(X0,Y0,1,20); ug.fillRect(X0+w1-1,Y0,1,20); ug.fillText(say,x,Y0+17); } }
// dòng chữ trên đầu Mèn Mén (ngoài rừng + khi đi theo chủ)
function menTag(ug,x,y){ const t='Huyền Thoại / Motion', w=ug.measureText(t).width+12, X0=Math.round(x-w/2), gr=ug.createLinearGradient(X0,0,X0+w,0); gr.addColorStop(0,'#5a2a8a'); gr.addColorStop(.5,'#2a6a5a'); gr.addColorStop(1,'#5a2a8a');
  ug.fillStyle=gr; ug.fillRect(X0,y-16,w,16); ug.fillStyle='#f2c43d'; ug.fillRect(X0,y-16,w,1); ug.fillRect(X0,y-1,w,1); ug.fillStyle='#ffe08a'; ug.fillText(t,x,y-2); }
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); const S=GAME.S, P=GAME.P; if(!S||!P||BT) return; ug.font='14px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom';
  for(const w of (S.kind===wildScene?WILD:[])){ const x=w.x*T, y=w.y*T; if(Math.hypot(P.x-x,P.y-y)>80) continue; const X0=sx(x), Y0=sy(y-30); tag(X0,Y0,`Lv${w.lv} ${SP[w.sp].name}`,'',SP[w.sp].night?'#c8a0ff':'#ffd84a'); typeTags(ug,X0,Y0-18,w.sp); if(w.men) menTag(ug,X0,Y0-36); if(w.bn) bnTalk(ug,X0,Y0-36,w); }
  if(FOL&&SP[FOL.sp]&&SP[FOL.sp].men&&FOL.scene===S.kind) menTag(ug,sx(FOL.x),sy(FOL.y-38)); };
// nhãn hệ (màu theo hệ, loài 2 hệ có 2 nhãn) vẽ ngay trên tên con hoang
function typeTags(ug,x,y,sp){ const ts=[SP[sp].t,SP[sp].t2].filter(Boolean), ws=ts.map(t=>ug.measureText(TY[t].name).width+8), tot=ws.reduce((a,v)=>a+v,0)+(ts.length-1)*3; let cx=Math.round(x-tot/2);
  ug.textAlign='left'; ts.forEach((t,i)=>{ ug.fillStyle=TY[t].col; ug.fillRect(cx,y-15,ws[i],15); ug.fillStyle='rgba(0,0,0,.25)'; ug.fillRect(cx,y-1,ws[i],1); ug.fillStyle='#120c16'; ug.fillText(TY[t].name,cx+4,y-1); cx+=ws[i]+3; }); ug.textAlign='center'; }
/* ---------- màn đấu theo lượt ---------- */
let BT=null;
async function battle(m){ if(BT) return; const r=await req({t:'lcb',...m}); if(r.err||!r.battle) return; open(r.battle); }
const GYM=n=>SD.LCCLUB.gyms[n-1], TRN=k=>SD.LCCLUB.train.find(x=>x.k===k);
function open(v){ const k=v.kind, fn=SP[v.foe.sp].name; BT={v,busy:false,msg:k==='wild'?`Một ${fn} hoang xuất hiện!`:k==='farm'?`${fn} hùng hổ lao tới!`:k==='gym'?`${esc(GYM(v.gym).name)} tung ra <b>${fn}</b>! (đội còn ${v.left} con chờ)`:k==='spar'?`Bạn tập ở ${esc(TRN(v.spar).name)} tung ra <b>${fn}</b>!`:`${fn} của vườn quốc gia nhìn bạn đầy cảnh giác...`,
    s:{foe:{sp:v.foe.sp,lv:v.foe.lv,hp:v.foe.hp,max:v.foe.max,vis:1,y:0,asc:v.foe.asc},me:{sp:v.me.sp,lv:v.me.lv,hp:v.me.hp,max:v.me.max,vis:1,y:0,asc:v.me.asc}},tw:[],fx:[],ball:null,t0:performance.now(),flash:0,end:false};
  GAME.sfx('power_up',.45);
  UI.open(k==='wild'?'⚔ Đấu Lính Cát hoang':k==='farm'?'⚔ Đấu với vật nuôi':k==='gym'?`🏟 Võ đài ${esc(GYM(v.gym).badge.replace('Huy hiệu ',''))} · ${esc(GYM(v.gym).name)}`:k==='spar'?`🥋 Đấu tập · ${esc(TRN(v.spar).name)}`:'⚔ Đấu thú bảo tồn (cẩn thận!)',()=>`<canvas id="lcCv" width="320" height="150"></canvas><div id="lcMsg" class="lcmsg"></div><div id="lcCtl" class="lcctl"></div>`,{static:true,wide:true});
  setTimeout(()=>{ const ctl=$('#lcCtl'); if(!ctl) return; ctl.addEventListener('click',e=>{ const b=e.target.closest('[data-lc]'); if(!b||b.disabled||!BT||BT.busy) return; act(b.dataset); }); setMsg(BT.msg); controls(); requestAnimationFrame(loop); },0); }
const setMsg=t=>{ const m=$('#lcMsg'); if(m) m.innerHTML=t; };
function controls(force){ const ctl=$('#lcCtl'); if(!ctl||!BT) return; const v=BT.v; if(BT.end){ ctl.innerHTML=''; return; }
  const bn=!!SP[v.foe.sp].bn, htB=`<button class="btn sm ${bn?'pri':''}" data-lc="ball" data-k="bong_ht" ${cnt('bong_ht')?'':'disabled'}>🟣 Bóng Huyền Thoại (${cnt('bong_ht')})</button>`;
  if(v.won){ ctl.innerHTML=`<div class="lcrow2">${bn?'':`<button class="btn sm pri" data-lc="ball" data-k="bong_cat" ${cnt('bong_cat')?'':'disabled'}>🎾 Thu phục bằng Bóng Cát (${cnt('bong_cat')})</button><button class="btn sm" data-lc="ball" data-k="bong_vang" ${cnt('bong_vang')?'':'disabled'}>🟡 Bóng Vàng (${cnt('bong_vang')})</button>`}${bn||cnt('bong_ht')?htB:''}<button class="btn sm" data-lc="release">👋 Thả đi</button></div>${bn?(cnt('bong_ht')?'':'<p class="muted">Blacknut chỉ chịu vào Bóng Huyền Thoại (kệ hàng Trung tâm Lính Cát).</p>'):cnt('bong_cat')+cnt('bong_vang')?'':'<p class="muted">Hết bóng rồi! Mua Bóng Cát ở Trung tâm Lính Cát.</p>'}`; return; }
  if(force||v.need){ ctl.innerHTML=`<p class="muted">Chọn Lính Cát ra sân:</p>`+v.party.filter(x=>x.ok!==false&&x.hp>0&&x.u!==v.me.u).map(x=>`<button class="btn sm pri" data-lc="switch" data-u="${x.u}">${img(x.sp,24)} ${esc(SP[x.sp].name)} Lv${x.lv} · ${x.hp}/${x.max}</button>`).join('')+(force&&!v.need?`<button class="btn sm" data-lc="back">↩ Quay lại</button>`:''); return; }
  const me=v.me, mvs=me.moves.map(k=>{ const M=MV[k], e=effOf(M.t,v.foe.sp), stab=M.t===SP[me.sp].t||M.t===SP[me.sp].t2, tip=e===0?'<em class="e0">×0 không tác dụng</em>':e>1?`<em class="e2">×${e} khắc hệ!</em>`:e<1?`<em class="e5">×${String(e).replace('.',',')} bị kháng</em>`:'';
    return `<button class="btn sm lcmv" data-lc="move" data-mv="${k}" style="--tc:${TY[M.t].col}"><b>${esc(M.name)}</b><small>${TY[M.t].name}${stab?' · cùng hệ +25%':''} · ${M.pow} · ${Math.round(M.acc*100)}%</small>${tip}</button>`; }).join('');
  ctl.innerHTML=`<div class="lcmoves">${mvs}</div><div class="lcrow2">${v.canBall?(bn?htB:`<button class="btn sm" data-lc="ball" data-k="bong_cat" ${cnt('bong_cat')?'':'disabled'}>🎾 Bóng Cát (${cnt('bong_cat')})</button><button class="btn sm" data-lc="ball" data-k="bong_vang" ${cnt('bong_vang')?'':'disabled'}>🟡 Bóng Vàng (${cnt('bong_vang')})</button>${cnt('bong_ht')?htB:''}`):''}
    <button class="btn sm" data-lc="potion" ${cnt('thuoc_cat')?'':'disabled'}>🧪 Thuốc (${cnt('thuoc_cat')})</button><button class="btn sm" data-lc="sw" ${v.party.filter(x=>x.ok!==false&&x.hp>0).length>1?'':'disabled'}>🔁 Đổi</button><button class="btn sm" data-lc="run">${v.kind==='gym'||v.kind==='spar'?'🏳 Bỏ cuộc':'🏃 Chạy'}</button></div>`; }
async function act(d){ if(d.lc==='sw') return controls(true); if(d.lc==='back') return controls();
  BT.busy=true; for(const b of document.querySelectorAll('#lcCtl button')) b.disabled=true;
  const m={t:'lcb',op:d.lc}; if(d.mv) m.mv=d.mv; if(d.k) m.k=d.k; if(d.u) m.u=+d.u; const r=await req(m); if(!BT) return; if(r.err){ BT.busy=false; controls(); return; }
  await play(r.ev||[]); if(!BT) return;
  if(r.result!==undefined&&r.battle===null){ BT.end=true; controls(); setMsg(esc(r.msg||'')); await sleep(1700); UI.closeAll(); BT=null; if(r.msg) toast(esc(r.msg),r.result==='lose'?'lock':'item'); return; }
  BT.v=r.battle; BT.busy=false; const s=BT.s, me=BT.v.me, fo=BT.v.foe; Object.assign(s.me,{sp:me.sp,lv:me.lv,hp:me.hp,max:me.max,asc:me.asc}); Object.assign(s.foe,{sp:fo.sp,lv:fo.lv,hp:fo.hp,max:fo.max,asc:fo.asc});
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
    if(e.k==='switch'){ s.me={...s.me,sp:e.sp,vis:0,y:0,asc:e.asc}; setMsg(`Ra sân nào, <b>${esc(SP[e.sp].name)}</b>!`); const p=BT.v.party.find(x=>x.sp===e.sp&&x.hp>0); if(p) Object.assign(s.me,{hp:p.hp,max:p.max,lv:p.lv}); await tween(s.me,'vis',1,350); await sleep(300); continue; }
    if(e.k==='heal'){ setMsg(`🧪 Hồi ${e.n} máu`); await tween(s.me,'hp',s.me.hp+e.n,400); continue; }
    if(e.k==='run'){ setMsg('Rút lui an toàn!'); await sleep(600); continue; }
    if(e.k==='won'){ setMsg(`🏆 Thắng! +${e.exp} EXP huấn luyện viên`); GAME.sfx('level_up',.5); await sleep(900); continue; }
    if(e.k==='release'){ setMsg(`${esc(SP[e.sp].name)} chạy vào bụi cỏ, ngoái lại vẫy đuôi cảm ơn`); await tween(BT.s.foe,'vis',0,500); continue; }
    if(e.k==='lose'){ setMsg('Không còn Lính Cát nào chiến đấu được...'); await sleep(900); continue; }
    if(e.k==='poop'){ BT.fx.push({k:'poop',w:e.w,t:performance.now()}); GAME.sfx('poof',.5); setMsg(`💩 ${esc(name(e.w))} dính cứt! Độc ${e.n}/${L.men.poison.max} tầng · bị chậm · giảm hồi máu`); await sleep(700); continue; }
    if(e.k==='poison'){ const o=e.w==='me'?s.me:s.foe; o.hit=performance.now(); setMsg(`☠ ${esc(name(e.w))} trúng độc cứt (${e.st} tầng): -${e.n} máu`); await tween(o,'hp',e.hp,350); await sleep(250); continue; }
    if(e.k==='next'){ s.foe={sp:e.sp,lv:e.lv,hp:e.hp,max:e.max,vis:0,y:0,asc:e.asc}; setMsg(`Huấn luyện viên tung ra <b>${esc(SP[e.sp].name)}</b> Lv${e.lv}! (còn ${e.left} con chờ)`); GAME.sfx('power_up',.4); await tween(s.foe,'vis',1,400); await sleep(500); continue; }
    if(e.k==='drain'){ const o=e.w==='me'?s.me:s.foe; setMsg(`🩸 ${esc(name(e.w))} hút ${e.n} máu`); await tween(o,'hp',e.hp,300); continue; }
    if(e.k==='root'){ setMsg(`🌿 ${esc(name(e.w))} bị trói, mất lượt kế!`); await sleep(650); continue; }
    if(e.k==='rooted'){ setMsg(`🌿 ${esc(SP[e.sp].name)} đang bị trói, không ra đòn được!`); await sleep(700); continue; }
    if(e.k==='splash'){ setMsg(`💥 Đánh lan: ${esc(SP[e.sp].name)} đang chờ cũng mất ${e.n} máu`); await sleep(650); continue; }
    if(e.k==='aegis'){ s.me.vis=1; s.me.y=0; setMsg(`🛡 Khiên Aegis toả sáng: ${esc(SP[e.sp].name)} hồi sinh!`); BT.flash=.8; GAME.sfx('level_up',.7); await tween(s.me,'hp',e.hp,500); await sleep(500); continue; }
    if(e.k==='asc'){ s.me.asc=1; BT.flash=.9; GAME.sfx('level_up',.9); setMsg(`👑 ${esc(SP[e.sp].name)} đạt Lv50, thức tỉnh <b>dạng Huyền Thoại</b>!`); await sleep(1500); continue; }
    if(e.k==='badge'){ GAME.sfx('level_up',.9); GAME.bigText('HUY HIỆU CHANDE!'); setMsg(`🏅 Nhận <b>${esc(GYM(e.n).badge)}</b> (${e.count}/12)!`); await sleep(1600); continue; }
    if(e.k==='arrest'){ BT.flash=1; setMsg('🚓 <b>Kiểm lâm phát hiện!</b> Bị bắt vì làm hại động vật hoang dã!'); GAME.sfx('poof',.6); await sleep(1800); continue; } } }
// ném bóng: bay vòng cung → đối thủ chui vào bóng → bóng rơi, lắc → bắt được (sao lấp lánh) hoặc bóng bật mở
async function throwBall(e){ const s=BT.s, gold=e.ball==='bong_ht'?'ht':e.ball==='bong_vang'; setMsg(`Ném ${SD.ITEMS[e.ball]?SD.ITEMS[e.ball].name:'Bóng Cát'}!`); GAME.sfx('dash',.4);
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
function mon(g,o,x,y,sc,flip,now){ if(o.vis<=0.01) return; const sp=(o.asc?A.linhcatAsc:A.linhcat)(o.sp,Math.floor(now/400)%2,flip), c=o.white?whiteOf(sp.c):sp.c, lunge=o.lunge&&now-o.lunge<300?Math.sin((now-o.lunge)/300*Math.PI)*14*(flip?1:-1):0;
  const hit=o.hit&&now-o.hit<380, sh=hit?(Math.floor(now/40)%2?3:-3):0; g.save(); g.globalAlpha=o.vis; const sz=sp.c.width, w=sz*sc*(o.asc?.9:1)*(0.4+.6*o.vis);   /* dạng Lv50 to hơn ~15% nhưng không đè hộp máu */
  if(o.asc&&!o.white) A.lcAura(g,x,y+2,now/1000,w*.42); else { g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x,y+2,w*.35,4,0,0,7); g.fill(); }
  g.drawImage(hit&&Math.floor(now/60)%2?whiteOf(sp.c):o.asc&&!o.white?A.lcHolo(sp,now/1000):c,Math.round(x-w/2+lunge+sh),Math.round(y-w*sp.ay/sz+o.y),Math.round(w),Math.round(w)); g.restore(); }
function hpBox(g,o,x,y,me){ const w=128, t=TY[SP[o.sp].t]; g.fillStyle='rgba(28,21,22,.86)'; g.fillRect(x,y,w,me?30:24); g.fillStyle='#ffd84a'; g.font='14px VT323, monospace'; g.textAlign='left'; g.fillText(SP[o.sp].name,x+4,y+10);
  const nw=g.measureText(SP[o.sp].name).width, tw=g.measureText(t.name).width+6; g.fillStyle=t.col; g.fillRect(x+8+nw,y+2,tw,10); g.fillStyle='#120c16'; g.fillText(t.name,x+11+nw,y+10); g.textAlign='right'; g.fillStyle='#f4f1ea'; g.fillText('Lv'+o.lv,x+w-4,y+10);
  const k=Math.max(0,o.hp/o.max); g.fillStyle='#3a1a1e'; g.fillRect(x+4,y+14,w-8,5); g.fillStyle=k>.5?'#5fe06a':k>.2?'#ffd84a':'#ff4a3a'; g.fillRect(x+4,y+14,Math.round((w-8)*k),5);
  if(me){ g.textAlign='right'; g.fillStyle='#f4f1ea'; g.fillText(`${Math.max(0,Math.round(o.hp))}/${o.max}`,x+w-4,y+28); } }
function draw(g,now){ g.imageSmoothingEnabled=false; g.drawImage(bg(),0,0); const s=BT.s;
  mon(g,s.foe,232,82,2.4,false,now); mon(g,s.me,84,140,3,true,now);
  for(const f of BT.fx){ const k=(now-f.t)/450; if(k>1) continue; if(f.k==='boom'){ const [x,y]=f.w==='foe'?[232,58]:[84,104]; g.fillStyle=f.c; g.globalAlpha=1-k; for(let i=0;i<8;i++){ const a=i*Math.PI/4, r=6+k*22; g.fillRect(x+Math.cos(a)*r-2,y+Math.sin(a)*r-2,4,4); } g.globalAlpha=1; }
    if(f.k==='poop'){ const [x,y]=f.w==='foe'?[232,58]:[84,104]; g.globalAlpha=1-k*.6; for(const [dx,dy,r,c] of [[0,0,6,'#7a4a1a'],[-7,4,3,'#5a3210'],[8,3,3,'#8a5a22'],[2,-6,2,'#a87a3a'],[-3,8,2,'#5a3210']]){ g.fillStyle=c; g.beginPath(); g.arc(x+dx*(1+k),y+dy*(1+k),r,0,7); g.fill(); } g.globalAlpha=1; }
    if(f.k==='stars'){ g.fillStyle='#ffd84a'; for(let i=0;i<6;i++){ const a=i*Math.PI/3+k, r=8+k*20; g.fillRect(232+Math.cos(a)*r-1,78+Math.sin(a)*r-1,3,3); } } }
  BT.fx=BT.fx.filter(f=>now-f.t<(f.k==='stars'?900:450));
  if(BT.ball){ const b=BT.ball, sp=A.lcBall(b.fr,b.gold); g.save(); g.translate(Math.round(b.x),Math.round(b.y)); g.rotate(b.rot||0); g.drawImage(sp.c,-14,-24,28,28); g.restore(); }
  hpBox(g,s.foe,8,8,false); hpBox(g,s.me,184,96,true);
  if(BT.v.kind==='gym'||BT.v.kind==='spar'){ const n=BT.v.left; for(let i=0;i<n;i++){ const b=A.lcBall(0); g.drawImage(b.c,8+i*12,34,12,12); } }
  if(BT.flash>0){ g.fillStyle=`rgba(255,255,255,${BT.flash})`; g.fillRect(0,0,320,150); BT.flash=Math.max(0,BT.flash-.05); } }
})();
