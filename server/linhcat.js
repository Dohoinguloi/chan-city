// Lính Cát: học "Huấn luyện Lính Cát" với Giáo sư Cát ở Trung tâm (thị trấn Đà Bắc), chọn 1 con khởi đầu, mang tối đa 5 con (còn lại ở máy gửi giữ),
// hồi máu ở quầy y tá, mua Bóng Cát / thuốc / đá tiến hoá. Đấu theo lượt (server tính hết): Lính Cát hoang ở Ké (đánh yếu rồi ném bóng để thu phục),
// vật nuôi thả rông quanh sân Ké (lấy EXP), thú vườn quốc gia (thú bảo tồn: đấu xong 20% bị công an bắt).
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,on,now,near,markDirty,take,has,addItem,note}=C;
const L=S.LINHCAT, SP=S.LC_SPECIES, MV=S.LC_MOVES, fmt=S.fmt;
const LQ=()=>require('./lcquest');   // nhiệm vụ ẩn Lính Cát của 15 NPC rừng Đà Bắc: báo sự kiện thắng / bắt / lên cấp / tiến hoá
const rec=p=>{ const r=p.lc=p.lc||{party:[],box:[],seq:0,dex:{},gone:{}}; if(!r.gone) r.gone={}; return r; };
const stats=m=>S.lcStatsOf(m), maxHp=m=>stats(m).hp;   // có cấp ngọc (enh) + dạng huyền thoại (myth)
const mk=(r,sp,lv)=>{ r.seq++; const m={u:r.seq,sp,lv,exp:0}; m.hp=maxHp(m); r.dex[sp]=2; return m; };
const atSpot=(pl,k)=>{ const o=L.at[k]; return pl.scene==='linhcat'&&o&&near(pl,o[0],o[1],40); };
// y tá / kệ hàng / máy gửi giữ: ở Trung tâm Đà Bắc hoặc Trung tâm Lính Cát quảng trường MU
const atCenter=(pl,k)=>atSpot(pl,k)||pl.scene==='mu'&&P.nearNpc(pl,'mu_lc');
const monOf=(r,u)=>r.party.find(y=>y.u===u)||r.box.find(y=>y.u===u);
const view=p=>{ const r=rec(p); return {party:r.party,box:r.box,dex:r.dex,badges:r.badges||{},wpn:r.wpn||''}; };
const trained=p=>!!p.skills.linhcat;

/* ---------- Trung tâm ---------- */
on('lc',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op;
  if(op==='learn'){ if(!P.nearNpc(pl,'gs_cat')) return {err:'Gặp Giáo sư Cát trong Trung tâm Lính Cát'}; if(trained(p)) return {err:'Bạn đã biết huấn luyện Lính Cát rồi'};
    if(!take(pl,L.learnFee)) return {err:`Học phí ${fmt(L.learnFee)}, không đủ tiền`}; p.skills.linhcat=true; markDirty(pl);
    return {msg:'Giáo sư Cát: "Giỏi lắm! Giờ ra bàn 3 Bóng Cát chọn người bạn đầu tiên đi."'}; }
  if(op==='starter'){ if(!atSpot(pl,'starter')) return {err:'Lại bàn 3 Bóng Cát'}; if(!trained(p)) return {err:'Học Huấn luyện Lính Cát với Giáo sư Cát trước đã'}; if(r.seq>0) return {err:'Bạn đã nhận Lính Cát khởi đầu rồi'};
    const sp=String(m.k||''); if(!L.starters.includes(sp)) return {err:'?'}; const mon=mk(r,sp,L.startLv); r.party.push(mon); addItem(pl,'bong_cat',L.startBalls); addItem(pl,'thuoc_cat',L.startPotions); markDirty(pl);
    return {msg:`Bạn nhận được ${SP[sp].name} Lv${L.startLv}, ${L.startBalls} Bóng Cát và ${L.startPotions} thuốc hồi máu! Ra Ké tìm Lính Cát hoang để luyện tập nhé`,mon}; }
  if(op==='heal'){ if(!atCenter(pl,'nurse')) return {err:'Lại quầy y tá'}; if(!r.party.length) return {err:'Bạn chưa có Lính Cát nào'}; const fee=S.lcHealFee(r.party);
    if(!shopPay(pl,fee)) return {err:`Hồi máu cả đội ${fmt(fee)}, không đủ tiền`}; for(const x of r.party) x.hp=maxHp(x); markDirty(pl);
    return {msg:`Chị Y tá Cát: "Các bé đã khoẻ re rồi nhé!" (-${fmt(fee)})`}; }
  if(op==='buy'){ const k=String(m.k||''), price=L.shop[k], n=Math.max(1,Math.min(10,m.n|0||1)); if(!price) return {err:'?'}; if(!atCenter(pl,'shop')) return {err:'Lại kệ hàng trong Trung tâm'};
    if(!shopPay(pl,price*n)) return {err:`Cần ${fmt(price*n)}, không đủ tiền`}; addItem(pl,k,n); markDirty(pl); return {msg:`Mua ${n} ${S.ITEMS[k].name} (-${fmt(price*n)})`}; }
  if(op==='deposit'||op==='withdraw'){ if(!atCenter(pl,'box')) return {err:'Lại máy gửi giữ'}; const from=op==='deposit'?r.party:r.box, to=op==='deposit'?r.box:r.party, i=from.findIndex(x=>x.u===m.u);
    if(i<0) return {err:'?'}; if(op==='deposit'&&r.party.length<=1) return {err:'Phải mang theo ít nhất 1 Lính Cát'}; if(op==='withdraw'&&r.party.length>=L.party) return {err:`Chỉ mang theo được ${L.party} con, gửi bớt 1 con đã`};
    if(op==='deposit'&&r.box.length>=L.box) return {err:'Máy gửi giữ đầy rồi'}; const [x]=from.splice(i,1); if(op==='deposit') x.hp=maxHp(x); to.push(x); markDirty(pl); return {ok:true}; }
  if(op==='lead'){ const i=r.party.findIndex(x=>x.u===m.u); if(i<=0) return {err:'?'}; if(pl.lcb) return {err:'Đang đấu'}; const [x]=r.party.splice(i,1); r.party.unshift(x); markDirty(pl); return {ok:true}; }
  if(op==='potion'){ if(pl.lcb) return {err:'Đang đấu thì dùng trong trận'}; const x=r.party.find(y=>y.u===m.u); if(!x) return {err:'?'}; if(!has(pl,'thuoc_cat')) return {err:'Hết thuốc, mua ở Trung tâm Lính Cát'};
    if(x.hp>=maxHp(x)) return {err:'Đang khoẻ re'}; addItem(pl,'thuoc_cat',-1); x.hp=Math.min(maxHp(x),x.hp+L.potion); markDirty(pl); return {msg:`${SP[x.sp].name} hồi ${L.potion} máu`}; }
  if(op==='stone'){ const x=r.party.find(y=>y.u===m.u)||r.box.find(y=>y.u===m.u), k=String(m.k||''); if(!x) return {err:'?'}; const evo=SP[x.sp].stone; if(!evo||!evo[k]) return {err:'Con này không tiến hoá bằng đá'};
    if(x.lv<SP[x.sp].stoneLv) return {err:`Cần Lv${SP[x.sp].stoneLv} mới tiến hoá được`}; if(!has(pl,k)) return {err:`Cần 1 ${S.ITEMS[k].name}`}; addItem(pl,k,-1); const from=x.sp; x.sp=evo[k]; x.hp=maxHp(x); r.dex[x.sp]=2; markDirty(pl); LQ().ev(pl,'evo',x.sp);
    return {msg:`✨ ${SP[from].name} tiến hoá thành ${SP[x.sp].name}!`,evo:{from,to:x.sp}}; }
  // Sách Kinh Nghiệm: +1 / +5 cấp (tiến hoá, học chiêu theo cấp như khi thắng trận)
  if(op==='dbgmon'&&process.env.CHAN_TEST==='1'){ if(m.badges){ r.badges={}; for(let i=1;i<=(m.badges|0);i++) r.badges[i]=1; markDirty(pl); return {ok:1}; } if(m.heal){ for(const x of r.party) x.hp=maxHp(x); markDirty(pl); return {ok:1}; } if(m.clear){ r.party=[]; r.box=[]; } const mon=mk(r,String(m.sp||'lua_nhi'),m.lv|0||10); ascUp(mon); r.party.push(mon); if(!p.skills.linhcat) p.skills.linhcat=true; markDirty(pl); return {ok:1}; }   // chỉ server test
  // Huy Hiệu Pepe (hạ Pepe ở Làng Meme): đổi 1 trong 3 thần thú siêu huyền thoại, chỉ số ×15
  if(op==='badge'){ if(pl.lcb) return {err:'Đang đấu'}; const B=L.badge, sp=String(m.sp||''); if(!B.choices.includes(sp)) return {err:'?'}; if(!has(pl,B.item)) return {err:'Cần Huy Hiệu Pepe (hạ Pepe ở Làng Meme, Đất Phía Tây MU)'};
    const mon=mk(r,sp,B.lv), toParty=r.party.length<L.party; (toParty?r.party:r.box).push(mon); r.dex[sp]=2; addItem(pl,B.item,-1); markDirty(pl);
    return {ok:1,msg:`✨ ${SP[sp].name} Lv${B.lv} đã về ${toParty?'đội của bạn (xếp lên đầu đội để ra trận)':'máy gửi giữ'}!`,lc:view(p)}; }
  if(op==='book'){ if(pl.lcb) return {err:'Đang đấu'}; const k=String(m.k||''), n=L.books[k], x=monOf(r,m.u); if(!n||!x) return {err:'?'}; if(x.lv>=50) return {err:'Đã đạt cấp tối đa 50'};
    if(!has(pl,k)) return {err:`Cần ${S.ITEMS[k].name} (mua ở kệ hàng Trung tâm Lính Cát)`}; addItem(pl,k,-1); const ev=[]; for(let i=0;i<n&&x.lv<50;i++) lvUp(r,x,ev); markDirty(pl); LQ().ev(pl,'lv',x.sp); if(ev.some(e=>e.k==='evo')) LQ().ev(pl,'evo',x.sp);
    const evo=ev.filter(e=>e.k==='evo').pop(), learn=ev.filter(e=>e.k==='learn').map(e=>MV[e.mv].name);
    return {msg:`📖 ${SP[x.sp].name} lên Lv${x.lv}!${learn.length?' Học chiêu '+learn.join(', ')+'.':''}${evo?` ✨ Tiến hoá thành ${SP[evo.to].name}!`:''}${ev.some(e=>e.k==='asc')?' 👑 Thức tỉnh dạng Huyền Thoại Lv50!':''}`,evo:evo?{from:ev.find(e=>e.k==='evo').from,to:evo.to}:null,asc:ev.some(e=>e.k==='asc')}; }
  // ăn Ngọc Cường Hoá: +1 → +12 (mỗi cấp +6% chỉ số), tỉ lệ như khắc đồ; Ngọc Huyền Thoại 80%; thất bại mất ngọc
  if(op==='gem'){ if(pl.lcb) return {err:'Đang đấu'}; const x=monOf(r,m.u); if(!x) return {err:'?'}; const E=S.ENH, Lv=x.enh||0; if(Lv>=E.max) return {err:`${SP[x.sp].name} đã ăn đủ ${E.max} ngọc`};
    const gem=m.legend?'ngoc_ch_ht':'ngoc_ch'; if(!has(pl,gem)) return {err:`Cần ${S.ITEMS[gem].name}`}; addItem(pl,gem,-1); const rate=m.legend?E.legendRate:E.rate[Lv], ok=Math.random()<rate;
    if(ok){ const mh=maxHp(x); x.enh=Lv+1; x.hp=Math.min(maxHp(x),x.hp+(maxHp(x)-mh)); } markDirty(pl);
    return {ok,lv:x.enh||0,rate,name:SP[x.sp].name,msg:ok?`💎 ${SP[x.sp].name} ăn ngọc thành công: +${x.enh} (mọi chỉ số +${Math.round(x.enh*L.enh.per*100)}%)`:`${SP[x.sp].name} nhè ngọc ra: thất bại (${Math.round(rate*100)}%), mất 1 ngọc`}; }
  // Đền Lính Cát Huyền Thoại (MU): đập đủ 3 ngọc quý → dạng huyền thoại + kỹ năng tự động theo hệ khi ở MU
  if(op==='myth'){ if(pl.scene!=='mu'||!P.nearNpc(pl,'mu_lctemple')) return {err:'Tới Đền Lính Cát Huyền Thoại ở quảng trường MU'}; if(pl.lcb) return {err:'Đang đấu'}; const x=monOf(r,m.u); if(!x) return {err:'?'};
    if(x.myth) return {err:'Con này đã là dạng huyền thoại rồi'}; const cost=Object.entries(L.myth.cost), miss=cost.filter(([k,n])=>!has(pl,k,n)); if(miss.length) return {err:'Cần '+miss.map(([k,n])=>`${n} ${S.ITEMS[k].name}`).join(', ')};
    for(const [k,n] of cost) addItem(pl,k,-n); const mh=maxHp(x); x.myth=1; x.hp=Math.min(maxHp(x),x.hp+(maxHp(x)-mh)); markDirty(pl); const sk=L.mythSkill[SP[x.sp].t]||L.mythSkill.thuong;
    return {msg:`🌟 ${SP[x.sp].name} thức tỉnh dạng huyền thoại! Chỉ số ×${L.myth.mul}, kỹ năng tự động "${sk.name}" khi ở MU (để con này đứng đầu đội)`,myth:x.u}; }
  // đủ 12 huy hiệu: chọn 1 trong 5 vũ khí tối thượng (gặp HLV bất kỳ ở võ đài), rồi trao cho Lính Cát nào cũng được, đổi qua lại
  if(op==='wpn'){ const k=String(m.k||''), Wp=S.LCCLUB.weapons[k]; if(!Wp) return {err:'?'}; if(r.wpn) return {err:'Bạn đã chọn vũ khí tối thượng rồi'}; if(Object.keys(r.badges||{}).length<12) return {err:'Cần đủ 12 Huy hiệu Chande'};
    if(!S.LCCLUB.gyms.some(g=>P.nearNpc(pl,'lcg_'+g.n))) return {err:'Gặp HLV ở võ đài CLB Lính Cát để nhận vũ khí'}; r.wpn=k; const lead=r.party[0]; if(lead) lead.held=k; markDirty(pl);
    require('./world').sysChat(`⚔ ${p.name} nhận vũ khí tối thượng ${Wp.name} cho Lính Cát!`); return {msg:`⚔ Nhận ${Wp.name}! Đã trao cho ${lead?SP[lead.sp].name:'Lính Cát'}: ${Wp.desc}`,lc:view(p)}; }
  if(op==='hold'){ if(!r.wpn) return {err:'Chưa có vũ khí tối thượng'}; if(pl.lcb) return {err:'Đang đấu'}; const x=monOf(r,m.u); if(!x) return {err:'?'}; for(const y of [...r.party,...r.box]) delete y.held;
    const mh=maxHp(x); x.held=r.wpn; x.hp=Math.min(maxHp(x),x.hp+(maxHp(x)-mh)); markDirty(pl); return {msg:`⚔ ${SP[x.sp].name} cầm ${S.LCCLUB.weapons[r.wpn].name}`}; }
  if(op==='nick'){ const x=r.party.find(y=>y.u===m.u)||r.box.find(y=>y.u===m.u); if(!x) return {err:'?'}; x.nick=String(m.v||'').replace(/[<>]/g,'').trim().slice(0,14)||undefined; markDirty(pl); return {ok:true}; }
  return {err:'?'}; });

/* ---------- đấu theo lượt ----------
   foe: đối thủ đang ra sân {sp,lv,hp,max,enh?,asc?}; team: các con còn lại của huấn luyện viên (võ đài / CLB luyện tập), con trước gục thì con sau ra.
   Dạng Lv50 (asc): hút máu, trừ giáp, trói (mất 1 lượt), giảm sát thương nhận, đánh lan sang con chờ của đội đối thủ. Vũ khí tối thượng (held): S.LCCLUB.weapons */
const ballOf=k=>['bong_vang','bong_ht'].includes(k)?k:'bong_cat', W=m=>(m&&m.held&&S.LCCLUB.weapons[m.held])||{}, AX=m=>m&&m.asc?((S.lcAsc(m.sp)||{}).v||null):null, stabOf=(mt,sp)=>mt===SP[sp].t||mt===SP[sp].t2;
function hitCalc(A,D,mv,bonus=1){ const M=MV[mv], a=S.lcStatsOf(A), d=S.lcStatsOf(D), wa=W(A), wd=W(D), xa=AX(A)||{}, xd=AX(D)||{};
  if(Math.random()>M.acc||wd.evade&&Math.random()<wd.evade) return {miss:true,dmg:0,eff:1};
  let eff=S.lcEff(M.t,D.sp); if(wa.pierce) eff=eff===0?.5:Math.max(1,eff);   /* Aghanim: xuyên kháng hệ */ if(!eff) return {dmg:0,eff:0};
  const crit=Math.random()<1/16+(wa.crit||0), stab=stabOf(M.t,A.sp)?1.25:1, def=Math.max(1,d.def*(1-(xa.shred||0)));
  const base=Math.floor(((2*A.lv/5+2)*M.pow*(1+(wa.pow||0))*a.atk/def)/50)+2;
  return {dmg:Math.max(1,Math.floor(base*stab*eff*bonus*(crit?1.5:1)*(.85+Math.random()*.15)*(1-(xd.dr||0)))),eff,crit,ls:(xa.ls||0)+(wa.ls||0),root:!!xa.root&&Math.random()<xa.root,splash:xa.splash||0}; }
// sau 1 đòn trúng: hút máu về con đánh, trói con bị đánh (mất lượt kế), đánh lan sang con chờ của đội đối thủ
function afterHit(b,h,att,w,ev){ if(!h.dmg) return; const mx=w==='me'?maxHp(att):att.max, cut=(w==='me'?b.psnMe:b.psnFoe)?L.men.poison.healCut:0;
  if(h.ls){ const n=Math.min(mx-att.hp,Math.round(h.dmg*h.ls*(1-cut))); if(n>0){ att.hp+=n; ev.push({k:'drain',w,n,hp:att.hp}); } }
  if(h.root){ if(w==='me') b.rootFoe=true; else b.rootMe=true; ev.push({k:'root',w:w==='me'?'foe':'me'}); }
  if(h.splash&&w==='me'&&b.team&&b.team.length){ const o=b.team[0], n=Math.min(o.hp-1,Math.round(h.dmg*h.splash)); if(n>0){ o.hp-=n; ev.push({k:'splash',n,sp:o.sp}); } } }
function foeMove(f,meSp,ai){ const ms=S.lcMoves(f.sp,f.lv); if(Math.random()<(ai?1-ai:.3)) return ms[Math.floor(Math.random()*ms.length)];
  return ms.map(k=>[k,MV[k].pow*MV[k].acc*S.lcEff(MV[k].t,meSp)*(stabOf(MV[k].t,f.sp)?1.25:1)]).sort((a,b)=>b[1]-a[1])[0][0]; }
const active=(r,b)=>r.party.find(x=>x.u===b.u);
const canFight=(b,x)=>x.hp>0&&!(b&&b.nosl&&SP[x.sp].sl);   // võ đài / CLB không nhận thần thú siêu huyền thoại
function bview(pl){ const b=pl.lcb, r=rec(pl.prof); if(!b) return null; const me=active(r,b), F=b.foe;
  if(me&&me.hp>maxHp(me)) me.hp=maxHp(me);   // chỉ số gốc đổi (cân bằng) thì không để máu vượt mức tối đa mới
  return {kind:b.kind,gym:b.gym||0,spar:b.spar||'',left:(b.team||[]).length,foe:{sp:F.sp,lv:F.lv,hp:F.hp,max:F.max,asc:F.asc?1:0,enh:F.enh||0},me:me&&{u:me.u,sp:me.sp,lv:me.lv,hp:me.hp,max:maxHp(me),exp:me.exp,next:S.lcNext(me.lv),moves:S.lcMoves(me.sp,me.lv),asc:me.asc?1:0,held:me.held||''},
    canBall:b.kind==='wild',won:!!b.won,party:r.party.map(x=>({u:x.u,sp:x.sp,lv:x.lv,hp:x.hp,max:maxHp(x),asc:x.asc?1:0,ok:canFight(b,x)})),need:b.need||null}; }
const mkFoe=(sp,lv,enh,asc)=>{ const f={sp,lv,...(enh?{enh}:{}),...(asc?{asc:1}:{})}; f.max=S.lcStatsOf(f).hp; f.hp=f.max; return f; };
function start(pl,kind,foe,extra={}){ const p=pl.prof, r=rec(p); if(!trained(p)) return {err:'Phải học Huấn luyện Lính Cát ở Trung tâm Lính Cát (thị trấn Đà Bắc) trước'};
  // còn trận cũ (mạng chậm bảng đấu không mở, đóng bảng giữa chừng): mở lại trận đó để đánh tiếp / bỏ chạy; bỏ quá 2 phút thì huỷ, đấu trận mới
  if(pl.lcb){ if(now()-(pl.lcb.last||pl.lcb.at)<120000) return {battle:bview(pl),resume:true}; pl.lcb=null; }
  if(pl.task) return {err:'Đang bận việc khác'}; menLv(p); const me=r.party.find(x=>canFight(extra,x));
  if(!me) return {err:extra.nosl&&r.party.some(x=>x.hp>0)?'Võ đài không nhận thần thú siêu huyền thoại: mang theo Lính Cát khác (gửi bớt ở máy gửi giữ)':'Lính Cát của bạn kiệt sức hết rồi, về Trung tâm hồi máu'};
  for(const f of [foe,...(extra.team||[])]) if(!SP[f.sp].npc&&!r.dex[f.sp]) r.dex[f.sp]=1;
  pl.lcb={kind,foe,u:me.u,at:now(),...extra}; markDirty(pl); return {battle:bview(pl)}; }
// đội đối thủ cho CLB luyện tập: n con ngẫu nhiên, bậc theo cấp (dưới 16 bậc 1, dưới 25 tới bậc 2, còn lại bậc 2–3)
const SPAR_POOL=lv=>Object.keys(SP).filter(k=>{ const s=SP[k]; if(s.npc||s.legend||s.rare) return false; return lv<16?s.st===1:lv<25?s.st<=2:s.st>=2; });
on('lcb',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now();
  if(op==='wild'){ if(!L.maps[pl.scene]) return {err:'?'}; const w=S.lcWild(t,pl.scene).find(x=>x.i===(m.i|0)); if(!w||r.gone[w.key]) return {err:'Con này chạy mất rồi'};
    if(!near(pl,w.x,w.y,56)) return {err:'Lại gần hơn'}; if(w.men||w.bn){ const e=w.men?menErr(pl):bnErr(pl); if(e) return {err:e}; } return start(pl,'wild',mkFoe(w.sp,w.lv),{key:w.key}); }
  if(op==='farm'){ const f=L.farm[m.i|0]; if(!f||pl.scene!=='retreat'||!near(pl,f[0],f[1],48)) return {err:'Lại gần đàn vật nuôi'}; const lead=r.party.find(x=>x.hp>0);
    if((p.daily.lcfarm||0)>=8) return {err:'Đàn vật nuôi mệt rồi, mai đấu tiếp'}; return start(pl,'farm',mkFoe(f[2],Math.max(3,(lead?lead.lv:5)+Math.floor(Math.random()*5)-2))); }
  if(op==='park'){ const s=S.PARK.spots.find(x=>x.k===m.k), sp=L.park[m.k]; if(!s||!sp||pl.scene!=='retreat'||!near(pl,s.x,s.y,56)) return {err:'Lại gần đàn thú'}; return start(pl,'park',mkFoe(sp,14+Math.floor(Math.random()*10))); }
  // võ đài CLB: đấu cả đội của huấn luyện viên, thắng lần đầu nhận huy hiệu; đã có huy hiệu thì mỗi ngày đấu lại 1 lần (thưởng ít hơn)
  if(op==='gym'){ const G0=S.LCCLUB.gyms[(m.n|0)-1]; if(!G0) return {err:'?'}; if(!P.nearNpc(pl,'lcg_'+G0.n)) return {err:'Lại gần huấn luyện viên'};
    const bd=r.badges||{}; if(bd[G0.n]&&(p.daily.lcgymR||{})[G0.n]) return {err:'Hôm nay đã đấu lại võ đài này rồi, mai quay lại nhé'};
    const team=G0.team.map(([sp,lv,enh,asc])=>mkFoe(sp,lv,enh,asc)); return start(pl,'gym',team.shift(),{team,gym:G0.n,bonus:G0.bonus,ai:G0.ai,nosl:true,again:!!bd[G0.n]}); }
  if(op==='spar'){ const ix=S.LCCLUB.train.findIndex(x=>x.k===m.k), T0=S.LCCLUB.train[ix]; if(!T0) return {err:'?'}; if(!P.nearNpc(pl,'lct_'+T0.k)) return {err:'Lại gần huấn luyện viên CLB'};
    if((p.daily.lcspar||0)>=S.LCCLUB.sparDay) return {err:`Hôm nay đã đấu tập ${S.LCCLUB.sparDay} trận, mai tập tiếp`}; const lead=r.party.find(x=>canFight({nosl:1},x)); if(!lead) return {err:'Cần 1 Lính Cát còn sức (không phải thần thú)'};
    const lv=Math.max(3,Math.min(55,lead.lv+T0.off)), pool=SPAR_POOL(lv), team=Array.from({length:T0.n},(_,i)=>mkFoe(pool[Math.floor(Math.random()*pool.length)],Math.max(2,lv-(T0.n-1-i)),lv>=40?Math.floor((lv-36)/4):0,lv>=50&&i===T0.n-1));
    return start(pl,'spar',team.shift(),{team,spar:T0.k,bonus:1.05+ix*.05,ai:.7+ix*.08,mul:T0.mul,nosl:true}); }
  const b=pl.lcb; if(op==='view') return {battle:bview(pl)}; if(!b) return {err:'Không có trận nào'}; b.last=t;
  const me=active(r,b), ev=[], F=b.foe, end=(res)=>finish(pl,res,ev);
  // đã đánh thắng con hoang: có quyền thu phục chắc chắn (tốn 1 bóng) hoặc thả đi
  if(b.won){ if(op==='release'||op==='run'){ ev.push({k:'release',sp:F.sp}); return end('win'); }
    if(op!=='ball') return {err:'Thu phục hoặc thả đi'}; const k=ballOf(m.k); if(SP[F.sp].bn&&k!==L.bn.ball) return {err:'Blacknut chỉ chịu chui vào Bóng Huyền Thoại'}; if(!has(pl,k)) return {err:`Hết ${S.ITEMS[k].name}, mua ở Trung tâm Lính Cát`}; addItem(pl,k,-1);
    if(SP[F.sp].men){ const e=menErr(pl); if(e){ ev.push({k:'release',sp:F.sp}); return {...end('run'),msg:e}; } }
    const mon=mk(r,F.sp,F.lv); mon.hp=Math.max(1,Math.round(maxHp(mon)/2)); (r.party.length<L.party?r.party:r.box).push(mon); r.gone[b.key]=1; if(SP[F.sp].men) menGot(pl,mon); if(SP[F.sp].bn) bnGot(pl);
    ev.push({k:'ball',ball:k,shakes:3,ok:true},{k:'caught',sp:F.sp,box:r.party.indexOf(mon)<0}); return end('caught'); }
  if(op==='run'){ ev.push({k:'run'}); return end('run'); }
  if(op==='switch'){ const x=r.party.find(y=>y.u===m.u&&canFight(b,y)); if(!x||x.u===b.u) return {err:'?'}; b.u=x.u; b.need=null; b.psnMe=0; ev.push({k:'switch',sp:x.sp,asc:x.asc?1:0}); if(!b.forced) foeTurn(b,x,ev); b.forced=false; return turnEnd(pl,ev); }
  if(b.need) return {err:'Chọn Lính Cát khác ra sân'}; if(!me||me.hp<=0) return {err:'?'};
  if(op==='potion'){ if(!has(pl,'thuoc_cat')) return {err:'Hết thuốc'}; addItem(pl,'thuoc_cat',-1); const n=Math.min(maxHp(me)-me.hp,Math.round(L.potion*(b.psnMe?1-L.men.poison.healCut:1))); me.hp+=n; ev.push({k:'heal',w:'me',n}); foeTurn(b,me,ev); return turnEnd(pl,ev); }
  if(op==='ball'){ if(b.kind!=='wild') return {err:b.kind==='park'?'Thú bảo tồn không được bắt!':b.kind==='gym'||b.kind==='spar'?'Lính Cát của huấn luyện viên, không bắt được':'Vật nuôi nhà người ta, không bắt được'}; const k=ballOf(m.k); if(SP[F.sp].bn&&k!==L.bn.ball) return {err:'Blacknut chỉ chịu chui vào Bóng Huyền Thoại (kệ hàng Trung tâm Lính Cát)'};
    if(!has(pl,k)) return {err:`Hết ${S.ITEMS[k].name}, mua ở Trung tâm Lính Cát`}; addItem(pl,k,-1);
    const ch=Math.min(.95,(1-.8*F.hp/F.max)*(.35+.65*(SP[F.sp].rate||.3))*L.ball[k]), ok=Math.random()<ch, shakes=ok?3:Math.floor(Math.random()*3);
    ev.push({k:'ball',ball:k,shakes,ok}); if(ok&&SP[F.sp].men&&menErr(pl)){ ev.push({k:'release',sp:F.sp}); return {...end('run'),msg:menErr(pl)}; } if(ok){ const mon=mk(r,F.sp,F.lv); mon.hp=F.hp; if(SP[F.sp].men) menGot(pl,mon); if(SP[F.sp].bn) bnGot(pl); (r.party.length<L.party?r.party:r.box).push(mon); r.gone[b.key]=1; ev.push({k:'caught',sp:F.sp,box:r.party.indexOf(mon)<0}); LQ().ev(pl,'catch',F.sp); return end('caught'); }
    foeTurn(b,me,ev); return turnEnd(pl,ev); }
  if(op==='move'){ const mv=String(m.mv||''); if(!S.lcMoves(me.sp,me.lv).includes(mv)) return {err:'?'}; const PZ=L.men.poison, meFirst=stats(me).spd*(b.psnMe?PZ.slow:1)>=S.lcStatsOf(F).spd*(b.psnFoe?PZ.slow:1)||Math.random()<.1;   /* dính cứt: chậm đi */
    const mine=()=>{ if(b.rootMe){ b.rootMe=false; ev.push({k:'rooted',w:'me',sp:me.sp}); return false; }
      const h=hitCalc(me,F,mv,1.2);   /* Lính Cát có người huấn luyện đánh mạnh hơn con hoang 20% */ F.hp=Math.max(0,F.hp-h.dmg); ev.push({k:'mv',w:'me',mv,...h,hp:F.hp}); if(h.dmg&&MV[mv].poop) poop(b,'foe',ev); if(F.hp>0) afterHit(b,h,me,'me',ev); else afterHit(b,{...h,root:false},me,'me',ev); return F.hp<=0; };
    if(meFirst){ if(mine()) return foeDown(pl,ev); foeTurn(b,me,ev); } else { foeTurn(b,me,ev); if(me.hp>0&&mine()) return foeDown(pl,ev); }
    return turnEnd(pl,ev); }
  return {err:'?'}; });
function foeTurn(b,me,ev){ const F=b.foe; if(F.hp<=0||me.hp<=0) return; if(b.rootFoe){ b.rootFoe=false; ev.push({k:'rooted',w:'foe',sp:F.sp}); return; }
  const mv=foeMove(F,me.sp,b.ai), h=hitCalc(F,me,mv,b.bonus||1); me.hp=Math.max(0,me.hp-h.dmg); ev.push({k:'mv',w:'foe',mv,...h,hp:me.hp}); if(h.dmg&&MV[mv].poop) poop(b,'me',ev); if(me.hp>0) afterHit(b,h,F,'foe',ev); }
function poop(b,w,ev){ const k=w==='foe'?'psnFoe':'psnMe', PZ=L.men.poison; b[k]=Math.min(PZ.max,(b[k]||0)+1); ev.push({k:'poop',w,n:b[k]}); }
function turnEnd(pl,ev){ const b=pl.lcb, r=rec(pl.prof), me=active(r,b), PZ=L.men.poison;
  if(b.psnFoe&&b.foe.hp>0){ const n=Math.max(1,Math.round(b.foe.max*PZ.per*b.psnFoe)); b.foe.hp=Math.max(0,b.foe.hp-n); ev.push({k:'poison',w:'foe',n,hp:b.foe.hp,st:b.psnFoe}); if(b.foe.hp<=0) return foeDown(pl,ev); }   /* độc cứt: trừ máu theo số tầng */
  if(b.psnMe&&me&&me.hp>0){ const n=Math.max(1,Math.round(maxHp(me)*PZ.per*b.psnMe)); me.hp=Math.max(0,me.hp-n); ev.push({k:'poison',w:'me',n,hp:me.hp,st:b.psnMe}); }
  if(me&&me.hp<=0&&W(me).revive&&!b.aegis){ b.aegis=1; me.hp=Math.round(maxHp(me)*W(me).revive); ev.push({k:'aegis',sp:me.sp,hp:me.hp}); }   /* Khiên Aegis: hồi sinh 1 lần mỗi trận */
  if(me&&me.hp<=0){ ev.push({k:'faint',w:'me',sp:me.sp}); if(r.party.some(x=>canFight(b,x))){ b.need=true; b.forced=true; } else { ev.push({k:'lose'}); return finish(pl,'lose',ev); } }
  markDirty(pl); return {ev,battle:bview(pl)}; }
// hạ đối thủ: EXP cho con đang ra sân, lên cấp, học chiêu, tiến hoá theo cấp; đội huấn luyện viên còn con thì con kế ra sân
function foeDown(pl,ev){ const b=pl.lcb, p=pl.prof, r=rec(p), me=active(r,b), F=b.foe; ev.push({k:'faint',w:'foe',sp:F.sp});
  const gain=Math.round((20+F.lv*9)*[1,1.4,1.8][(SP[F.sp].st||1)-1]*(b.kind==='farm'?.7:b.kind==='gym'?1.5:1)*(b.mul||1)); me.exp+=gain; ev.push({k:'exp',n:gain,sp:me.sp});
  while(me.lv<50&&me.exp>=S.lcNext(me.lv)){ me.exp-=S.lcNext(me.lv); lvUp(r,me,ev); }
  if(b.kind==='wild') LQ().ev(pl,'win',F.sp); LQ().ev(pl,'lv',me.sp); if(ev.some(e=>e.k==='evo')) LQ().ev(pl,'evo',me.sp);
  if(b.kind==='farm') p.daily.lcfarm=(p.daily.lcfarm||0)+1;
  if(b.kind==='wild'){ r.gone[b.key]=1; b.won=true; b.paid=true; const g=C.gainExp(pl,L.trainerExp); ev.push({k:'won',sp:F.sp,exp:g.exp}); markDirty(pl); return {ev,battle:bview(pl)}; }   // thắng con hoang: được quyền thu phục
  if(b.team&&b.team.length){ const nx=b.team.shift(); b.foe=nx; b.rootFoe=false; b.psnFoe=0; ev.push({k:'next',sp:nx.sp,lv:nx.lv,hp:nx.hp,max:nx.max,asc:nx.asc?1:0,left:b.team.length}); markDirty(pl); return {ev,battle:bview(pl)}; }
  return finish(pl,'win',ev); }
// lên 1 cấp: thêm máu tối đa, học chiêu mới, tiến hoá khi đủ cấp; đủ Lv50 thì thức tỉnh dạng Huyền Thoại Lv50 (loài không phải huyền thoại)
// con nào đã đủ cấp tiến hoá (vd mốc tiến hoá mới cấp 25) / đủ Lv50 thì tiến hoá, thức tỉnh luôn lúc chủ vào game
const ascUp=me=>{ if(me.asc||me.lv<S.LC_ASC.lv||!S.lcAsc(me.sp)) return false; const mh=maxHp(me); me.asc=1; me.hp=Math.min(maxHp(me),me.hp+(maxHp(me)-mh)); return true; };
C.hook('login',pl=>{ const p=pl.prof; if(!p||!p.lc) return; const r=rec(p), done=[]; menLv(p);
  for(const me of [...r.party,...r.box]){ let E=SP[me.sp]&&SP[me.sp].evo; while(E&&me.lv>=E.lv){ const from=me.sp, ratio=me.hp/maxHp(me); me.sp=E.to; me.hp=Math.max(1,Math.round(maxHp(me)*ratio)); r.dex[me.sp]=2; done.push(`${SP[from].name} → ${SP[me.sp].name}`); E=SP[me.sp].evo; }
    if(ascUp(me)) done.push(`${SP[me.sp].name} thức tỉnh dạng Huyền Thoại Lv50`); }
  if(done.length){ C.markDirty(pl); setTimeout(()=>{ if(pl.prof) C.note(pl,`✨ Lính Cát: ${done.join(', ')}`,'quest'); },3000); } });
function lvUp(r,me,ev){ const before=S.lcMoves(me.sp,me.lv), mh=maxHp(me); me.lv++; me.hp=Math.min(maxHp(me),me.hp+(maxHp(me)-mh)); ev.push({k:'lvl',lv:me.lv,sp:me.sp});
  for(const mv of S.lcMoves(me.sp,me.lv)) if(!before.includes(mv)) ev.push({k:'learn',mv,sp:me.sp});
  const E=SP[me.sp].evo; if(E&&me.lv>=E.lv){ const from=me.sp, ratio=me.hp/maxHp(me); me.sp=E.to; me.hp=Math.max(1,Math.round(maxHp(me)*ratio)); r.dex[me.sp]=2; ev.push({k:'evo',from,to:me.sp}); }
  if(ascUp(me)) ev.push({k:'asc',sp:me.sp}); }
function finish(pl,res,ev){ const p=pl.prof, b=pl.lcb, r=rec(p); pl.lcb=null; let msg='';
  if(res==='win'&&b&&b.kind==='gym'){ const G0=S.LCCLUB.gyms[b.gym-1], bd=r.badges=r.badges||{};
    if(b.again){ (p.daily.lcgymR=p.daily.lcgymR||{})[G0.n]=1; const k=S.LCCLUB.rematch; C.reward(pl,{exp:Math.round(G0.prize.exp*k),vnd:Math.round(G0.prize.vnd*k)},`Thắng lại võ đài ${G0.name}`); msg=`Thắng lại võ đài! Thưởng ${Math.round(k*100)}%`; }
    else { bd[G0.n]=1; C.reward(pl,G0.prize,`🏅 Nhận ${G0.badge}!`); const n=Object.keys(bd).length; msg=`🏅 Thắng ${G0.name}, nhận ${G0.badge} (${n}/12)!`; ev.push({k:'badge',n:G0.n,count:n});
      if(n>=12&&!r.wpn) setTimeout(()=>{ if(pl.prof) note(pl,'🏆 Đủ 12 Huy hiệu Chande! Tới gặp HLV bất kỳ ở võ đài để chọn 1 trong 5 vũ khí tối thượng cho Lính Cát','quest'); },2500);
      if(n>=12) require('./world').sysChat(`🏆 ${p.name} đã thu thập đủ 12 Huy hiệu Chande của 12 võ đài Lính Cát!`); } }
  else if(res==='win'&&b&&b.kind==='spar'){ const T0=S.LCCLUB.train.find(x=>x.k===b.spar); p.daily.lcspar=(p.daily.lcspar||0)+1; C.reward(pl,{vnd:T0.vnd,exp:L.trainerExp*2},'Thắng trận đấu tập');
    msg=`Thắng trận đấu tập ở ${T0.name} (${p.daily.lcspar}/${S.LCCLUB.sparDay} hôm nay)`; }
  else if(res==='win'){ if(b&&b.paid) msg='Đã thả Lính Cát về với thiên nhiên'; else { const g=C.gainExp(pl,L.trainerExp); msg=`Thắng! +${g.exp} EXP huấn luyện viên`; } }
  if(res==='caught') msg='Thu phục thành công!'; if(res==='lose') msg=b&&(b.kind==='gym'||b.kind==='spar')?'Thua rồi! Luyện thêm, tính khắc hệ kỹ rồi quay lại thách đấu':'Lính Cát của bạn kiệt sức hết, về Trung tâm hồi máu nhé';
  if(res==='run') msg=b&&(b.kind==='gym'||b.kind==='spar')?'Bỏ cuộc':'Đã rút lui';
  // thú bảo tồn: đấu xong 20% bị công an bắt vì làm hại động vật hoang dã
  if(b&&b.kind==='park'&&Math.random()<L.jail.chance){ const J=L.jail, jf=C.fineOf(pl,J.fine); p.jail={until:now()+J.sec*1000,fine:jf,why:'Cho Lính Cát đánh thú bảo tồn ở vườn quốc gia'}; P.stat(pl,'jail',1);
    ev.push({k:'arrest'}); markDirty(pl); setTimeout(()=>{ if(pl.prof) C.moveTo(pl,'doncongan',7,6); },2600);
    note(pl,`🚓 Kiểm lâm báo công an: làm hại động vật hoang dã! Tạm giữ ${J.sec} giây, nộp ${fmt(jf)} để về sớm`,'lock'); }
  for(const k of Object.keys(r.gone)){ const per=+k.split(':').slice(-2)[0]; if(!(per>=Math.floor(now()/L.period)-1)) delete r.gone[k]; }   // khoá: map:chu kỳ:điểm
  markDirty(pl); return {ev,result:res,msg,battle:null}; }
/* ---------- 2 rồng huyền thoại: cả server mỗi con 1 chủ (lưu DATA_DIR/lcdragon.json), 1 người chỉ có 1 con ---------- */
const fs=require('fs'), path=require('path'), DFILE=path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'lcdragon.json');
const DRG=(()=>{ try{ return JSON.parse(fs.readFileSync(DFILE,'utf8')); }catch(e){ return {}; } })();
const dragonView=pl=>{ const DR=L.dragon; return {need:DR.need,have:(pl.prof.items[DR.item]||0),owners:Object.fromEntries(DR.choices.map(k=>[k,DRG[k]?{name:DRG[k].name,at:DRG[k].at}:null])),mine:DR.choices.find(k=>DRG[k]&&DRG[k].uid===pl.uid)||''}; };
on('lcdragon',(pl,m)=>{ const p=pl.prof, r=rec(p), DR=L.dragon, A0=DR.altar; if(m.op==='view') return {dragon:dragonView(pl)};
  if(m.op!=='summon') return {err:'?'}; if(pl.scene!=='retreat'||!near(pl,A0.x,A0.y,64)) return {err:'Tới Tế đàn Rồng Thần trong rừng phía Bắc (trên thác Đà Bắc)'}; if(!trained(p)) return {err:'Phải là huấn luyện viên Lính Cát'};
  const sp=String(m.sp||''); if(!DR.choices.includes(sp)) return {err:'?'}; if(DR.choices.some(k=>DRG[k]&&DRG[k].uid===pl.uid)) return {err:'Bạn đã có 1 rồng huyền thoại rồi, nhường con còn lại cho người khác'};
  if(DRG[sp]) return {err:`${SP[sp].name} đã có chủ: ${DRG[sp].name}`}; if(!has(pl,DR.item,DR.need)) return {err:`Cần đủ ${DR.need} ${S.ITEMS[DR.item].name} (đang có ${p.items[DR.item]||0})`};
  addItem(pl,DR.item,-DR.need); DRG[sp]={uid:pl.uid,name:p.name,at:now()}; try{ fs.writeFileSync(DFILE,JSON.stringify(DRG)); }catch(e){ console.error('[lcdragon] save',e.message); }
  const mon=mk(r,sp,DR.lv), toParty=r.party.length<L.party; (toParty?r.party:r.box).push(mon); markDirty(pl);
  require('./world').sysChat(`🐉 ${p.name} đã triệu hồi ${SP[sp].name} ở Tế đàn Rồng Thần! Cả Chan City chỉ có duy nhất 1 con.`);
  return {msg:`🐉 ${SP[sp].name} Lv${DR.lv} đáp lời triệu hồi, về ${toParty?'đội của bạn':'máy gửi giữ'}!`,sp,lc:view(p),dragon:dragonView(pl)}; });
/* Mèn Mén, Blacknut: mỗi người chỉ thu phục được 1 con; Mèn Mén mạnh theo cấp chủ (ol) */
const ownSp=(p,sp)=>[...(p.lc&&p.lc.party||[]),...(p.lc&&p.lc.box||[])].some(x=>x.sp===sp);
const menErr=pl=>ownSp(pl.prof,L.men.sp)?'Bạn đã có Mèn Mén rồi, nhường người khác nhé':'', bnErr=pl=>ownSp(pl.prof,L.bn.sp)?'Bạn đã có Blacknut rồi, nhường người khác nhé':'';
const menLv=p=>{ for(const x of [...(p.lc&&p.lc.party||[]),...(p.lc&&p.lc.box||[])]) if(SP[x.sp]&&SP[x.sp].men) x.ol=p.level; };
function menGot(pl,mon){ mon.ol=pl.prof.level; require('./world').sysChat(`💩 ${pl.prof.name} vừa thu phục Mèn Mén huyền thoại (Motion) trong rừng Ké!`); }
function bnGot(pl){ require('./world').sysChat(`🐱 ${pl.prof.name} vừa bắt được Blacknut bằng Bóng Huyền Thoại! "Cũng đúng nhờ"`); }
module.exports={view};
