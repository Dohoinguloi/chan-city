// Lính Cát: học "Huấn luyện Lính Cát" với Giáo sư Cát ở Trung tâm (thị trấn Đà Bắc), chọn 1 con khởi đầu, mang tối đa 5 con (còn lại ở máy gửi giữ),
// hồi máu ở quầy y tá, mua Bóng Cát / thuốc / đá tiến hoá. Đấu theo lượt (server tính hết): Lính Cát hoang ở Ké (đánh yếu rồi ném bóng để thu phục),
// vật nuôi thả rông quanh sân Ké (lấy EXP), thú vườn quốc gia (thú bảo tồn: đấu xong 20% bị công an bắt).
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,on,now,near,markDirty,take,has,addItem,note}=C;
const L=S.LINHCAT, SP=S.LC_SPECIES, MV=S.LC_MOVES, fmt=S.fmt;
const rec=p=>{ const r=p.lc=p.lc||{party:[],box:[],seq:0,dex:{},gone:{}}; if(!r.gone) r.gone={}; return r; };
const stats=m=>S.lcStatsOf(m), maxHp=m=>stats(m).hp;   // có cấp ngọc (enh) + dạng huyền thoại (myth)
const mk=(r,sp,lv)=>{ r.seq++; const m={u:r.seq,sp,lv,exp:0}; m.hp=maxHp(m); r.dex[sp]=2; return m; };
const atSpot=(pl,k)=>{ const o=L.at[k]; return pl.scene==='linhcat'&&o&&near(pl,o[0],o[1],40); };
// y tá / kệ hàng / máy gửi giữ: ở Trung tâm Đà Bắc hoặc Trung tâm Lính Cát quảng trường MU
const atCenter=(pl,k)=>atSpot(pl,k)||pl.scene==='mu'&&P.nearNpc(pl,'mu_lc');
const monOf=(r,u)=>r.party.find(y=>y.u===u)||r.box.find(y=>y.u===u);
const view=p=>{ const r=rec(p); return {party:r.party,box:r.box,dex:r.dex}; };
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
    if(x.lv<SP[x.sp].stoneLv) return {err:`Cần Lv${SP[x.sp].stoneLv} mới tiến hoá được`}; if(!has(pl,k)) return {err:`Cần 1 ${S.ITEMS[k].name}`}; addItem(pl,k,-1); const from=x.sp; x.sp=evo[k]; x.hp=maxHp(x); r.dex[x.sp]=2; markDirty(pl);
    return {msg:`✨ ${SP[from].name} tiến hoá thành ${SP[x.sp].name}!`,evo:{from,to:x.sp}}; }
  // Sách Kinh Nghiệm: +1 / +5 cấp (tiến hoá, học chiêu theo cấp như khi thắng trận)
  if(op==='dbgmon'&&process.env.CHAN_TEST==='1'){ const mon=mk(r,String(m.sp||'lua_nhi'),m.lv|0||10); r.party.push(mon); if(!p.skills.linhcat) p.skills.linhcat=true; markDirty(pl); return {ok:1}; }   // chỉ server test
  // Huy Hiệu Pepe (hạ Pepe ở Làng Meme): đổi 1 trong 3 thần thú siêu huyền thoại, chỉ số ×15
  if(op==='badge'){ if(pl.lcb) return {err:'Đang đấu'}; const B=L.badge, sp=String(m.sp||''); if(!B.choices.includes(sp)) return {err:'?'}; if(!has(pl,B.item)) return {err:'Cần Huy Hiệu Pepe (hạ Pepe ở Làng Meme, Đất Phía Tây MU)'};
    const mon=mk(r,sp,B.lv), toParty=r.party.length<L.party; (toParty?r.party:r.box).push(mon); r.dex[sp]=2; addItem(pl,B.item,-1); markDirty(pl);
    return {ok:1,msg:`✨ ${SP[sp].name} Lv${B.lv} đã về ${toParty?'đội của bạn (xếp lên đầu đội để ra trận)':'máy gửi giữ'}!`,lc:view(p)}; }
  if(op==='book'){ if(pl.lcb) return {err:'Đang đấu'}; const k=String(m.k||''), n=L.books[k], x=monOf(r,m.u); if(!n||!x) return {err:'?'}; if(x.lv>=50) return {err:'Đã đạt cấp tối đa 50'};
    if(!has(pl,k)) return {err:`Cần ${S.ITEMS[k].name} (mua ở kệ hàng Trung tâm Lính Cát)`}; addItem(pl,k,-1); const ev=[]; for(let i=0;i<n&&x.lv<50;i++) lvUp(r,x,ev); markDirty(pl);
    const evo=ev.filter(e=>e.k==='evo').pop(), learn=ev.filter(e=>e.k==='learn').map(e=>MV[e.mv].name);
    return {msg:`📖 ${SP[x.sp].name} lên Lv${x.lv}!${learn.length?' Học chiêu '+learn.join(', ')+'.':''}${evo?` ✨ Tiến hoá thành ${SP[evo.to].name}!`:''}`,evo:evo?{from:ev.find(e=>e.k==='evo').from,to:evo.to}:null}; }
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
  if(op==='nick'){ const x=r.party.find(y=>y.u===m.u)||r.box.find(y=>y.u===m.u); if(!x) return {err:'?'}; x.nick=String(m.v||'').replace(/[<>]/g,'').trim().slice(0,14)||undefined; markDirty(pl); return {ok:true}; }
  return {err:'?'}; });

/* ---------- đấu theo lượt ---------- */
const effOf=(mt,dt)=>((S.LC_EFF[mt]||{})[dt]??1);
function hitCalc(A,D,mv,bonus=1){ const M=MV[mv], a=S.lcStatsOf(A), d=S.lcStatsOf(D), aSp=A.sp, aLv=A.lv, dSp=D.sp;
  if(Math.random()>M.acc) return {miss:true,dmg:0,eff:1};
  const eff=effOf(M.t,SP[dSp].t); if(!eff) return {dmg:0,eff:0}; const crit=Math.random()<1/16, stab=M.t===SP[aSp].t?1.25:1;
  const base=Math.floor(((2*aLv/5+2)*M.pow*a.atk/d.def)/50)+2; return {dmg:Math.max(1,Math.floor(base*stab*eff*bonus*(crit?1.5:1)*(.85+Math.random()*.15))),eff,crit}; }
function foeMove(f,meSp){ const ms=S.lcMoves(f.sp,f.lv); if(Math.random()<.3) return ms[Math.floor(Math.random()*ms.length)];
  return ms.map(k=>[k,MV[k].pow*MV[k].acc*effOf(MV[k].t,SP[meSp].t)*(MV[k].t===SP[f.sp].t?1.25:1)]).sort((a,b)=>b[1]-a[1])[0][0]; }
const active=(r,b)=>r.party.find(x=>x.u===b.u);
function bview(pl){ const b=pl.lcb, r=rec(pl.prof); if(!b) return null; const me=active(r,b);
  if(me&&me.hp>maxHp(me)) me.hp=maxHp(me);   // chỉ số gốc đổi (cân bằng) thì không để máu vượt mức tối đa mới
  return {kind:b.kind,foe:{sp:b.foe.sp,lv:b.foe.lv,hp:b.foe.hp,max:b.foe.max},me:me&&{u:me.u,sp:me.sp,lv:me.lv,hp:me.hp,max:maxHp(me),exp:me.exp,next:S.lcNext(me.lv),moves:S.lcMoves(me.sp,me.lv)},
    canBall:b.kind==='wild',won:!!b.won,party:r.party.map(x=>({u:x.u,sp:x.sp,lv:x.lv,hp:x.hp,max:maxHp(x)})),need:b.need||null}; }
function start(pl,kind,sp,lv,extra){ const p=pl.prof, r=rec(p); if(!trained(p)) return {err:'Phải học Huấn luyện Lính Cát ở Trung tâm Lính Cát (thị trấn Đà Bắc) trước'};
  // còn trận cũ (mạng chậm bảng đấu không mở, đóng bảng giữa chừng): mở lại trận đó để đánh tiếp / bỏ chạy; bỏ quá 2 phút thì huỷ, đấu trận mới
  if(pl.lcb){ if(now()-(pl.lcb.last||pl.lcb.at)<120000) return {battle:bview(pl),resume:true}; pl.lcb=null; }
  if(pl.task) return {err:'Đang bận việc khác'}; const me=r.party.find(x=>x.hp>0); if(!me) return {err:'Lính Cát của bạn kiệt sức hết rồi, về Trung tâm hồi máu'};
  const foe={sp,lv,max:S.lcStats(sp,lv).hp}; foe.hp=foe.max; if(!SP[sp].npc&&!r.dex[sp]) r.dex[sp]=1;
  pl.lcb={kind,foe,u:me.u,at:now(),...extra}; markDirty(pl); return {battle:bview(pl)}; }
on('lcb',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now();
  if(op==='wild'){ if(!L.maps[pl.scene]) return {err:'?'}; const w=S.lcWild(t,pl.scene).find(x=>x.i===(m.i|0)); if(!w||r.gone[w.key]) return {err:'Con này chạy mất rồi'};
    if(!near(pl,w.x,w.y,56)) return {err:'Lại gần hơn'}; return start(pl,'wild',w.sp,w.lv,{key:w.key}); }
  if(op==='farm'){ const f=L.farm[m.i|0]; if(!f||pl.scene!=='retreat'||!near(pl,f[0],f[1],48)) return {err:'Lại gần đàn vật nuôi'}; const lead=r.party.find(x=>x.hp>0);
    if((p.daily.lcfarm||0)>=8) return {err:'Đàn vật nuôi mệt rồi, mai đấu tiếp'}; return start(pl,'farm',f[2],Math.max(3,(lead?lead.lv:5)+Math.floor(Math.random()*5)-2)); }
  if(op==='park'){ const s=S.PARK.spots.find(x=>x.k===m.k), sp=L.park[m.k]; if(!s||!sp||pl.scene!=='retreat'||!near(pl,s.x,s.y,56)) return {err:'Lại gần đàn thú'}; return start(pl,'park',sp,14+Math.floor(Math.random()*10)); }
  const b=pl.lcb; if(op==='view') return {battle:bview(pl)}; if(!b) return {err:'Không có trận nào'}; b.last=t;
  const me=active(r,b), ev=[], F=b.foe, end=(res)=>finish(pl,res,ev);
  // đã đánh thắng con hoang: có quyền thu phục chắc chắn (tốn 1 bóng) hoặc thả đi
  if(b.won){ if(op==='release'||op==='run'){ ev.push({k:'release',sp:F.sp}); return end('win'); }
    if(op!=='ball') return {err:'Thu phục hoặc thả đi'}; const k=m.k==='bong_vang'?'bong_vang':'bong_cat'; if(!has(pl,k)) return {err:`Hết ${S.ITEMS[k].name}, mua ở Trung tâm Lính Cát`}; addItem(pl,k,-1);
    const mon=mk(r,F.sp,F.lv); mon.hp=Math.max(1,Math.round(maxHp(mon)/2)); (r.party.length<L.party?r.party:r.box).push(mon); r.gone[b.key]=1;
    ev.push({k:'ball',ball:k,shakes:3,ok:true},{k:'caught',sp:F.sp,box:r.party.indexOf(mon)<0}); return end('caught'); }
  if(op==='run'){ ev.push({k:'run'}); return end('run'); }
  if(op==='switch'){ const x=r.party.find(y=>y.u===m.u&&y.hp>0); if(!x||x.u===b.u) return {err:'?'}; b.u=x.u; b.need=null; ev.push({k:'switch',sp:x.sp}); if(!b.forced) foeTurn(b,x,ev); b.forced=false; return turnEnd(pl,ev); }
  if(b.need) return {err:'Chọn Lính Cát khác ra sân'}; if(!me||me.hp<=0) return {err:'?'};
  if(op==='potion'){ if(!has(pl,'thuoc_cat')) return {err:'Hết thuốc'}; addItem(pl,'thuoc_cat',-1); const n=Math.min(maxHp(me)-me.hp,L.potion); me.hp+=n; ev.push({k:'heal',w:'me',n}); foeTurn(b,me,ev); return turnEnd(pl,ev); }
  if(op==='ball'){ if(b.kind!=='wild') return {err:b.kind==='park'?'Thú bảo tồn không được bắt!':'Vật nuôi nhà người ta, không bắt được'}; const k=m.k==='bong_vang'?'bong_vang':'bong_cat';
    if(!has(pl,k)) return {err:`Hết ${S.ITEMS[k].name}, mua ở Trung tâm Lính Cát`}; addItem(pl,k,-1);
    const ch=Math.min(.95,(1-.8*F.hp/F.max)*(.35+.65*(SP[F.sp].rate||.3))*L.ball[k]), ok=Math.random()<ch, shakes=ok?3:Math.floor(Math.random()*3);
    ev.push({k:'ball',ball:k,shakes,ok}); if(ok){ const mon=mk(r,F.sp,F.lv); mon.hp=F.hp; (r.party.length<L.party?r.party:r.box).push(mon); r.gone[b.key]=1; ev.push({k:'caught',sp:F.sp,box:r.party.indexOf(mon)<0}); return end('caught'); }
    foeTurn(b,me,ev); return turnEnd(pl,ev); }
  if(op==='move'){ const mv=String(m.mv||''); if(!S.lcMoves(me.sp,me.lv).includes(mv)) return {err:'?'}; const meFirst=stats(me).spd>=S.lcStats(F.sp,F.lv).spd||Math.random()<.1;
    const mine=()=>{ const h=hitCalc(me,F,mv,1.2);   /* Lính Cát có người huấn luyện đánh mạnh hơn con hoang 20% */ F.hp=Math.max(0,F.hp-h.dmg); ev.push({k:'mv',w:'me',mv,...h,hp:F.hp}); return F.hp<=0; };
    if(meFirst){ if(mine()) return foeDown(pl,ev); foeTurn(b,me,ev); } else { foeTurn(b,me,ev); if(me.hp>0&&mine()) return foeDown(pl,ev); }
    return turnEnd(pl,ev); }
  return {err:'?'}; });
function foeTurn(b,me,ev){ const F=b.foe; if(F.hp<=0||me.hp<=0) return; const mv=foeMove(F,me.sp), h=hitCalc(F,me,mv); me.hp=Math.max(0,me.hp-h.dmg); ev.push({k:'mv',w:'foe',mv,...h,hp:me.hp}); }
function turnEnd(pl,ev){ const b=pl.lcb, r=rec(pl.prof), me=active(r,b);
  if(me&&me.hp<=0){ ev.push({k:'faint',w:'me',sp:me.sp}); if(r.party.some(x=>x.hp>0)){ b.need=true; b.forced=true; } else { ev.push({k:'lose'}); return finish(pl,'lose',ev); } }
  markDirty(pl); return {ev,battle:bview(pl)}; }
// hạ đối thủ: EXP cho con đang ra sân, lên cấp, học chiêu, tiến hoá theo cấp
function foeDown(pl,ev){ const b=pl.lcb, p=pl.prof, r=rec(p), me=active(r,b), F=b.foe; ev.push({k:'faint',w:'foe',sp:F.sp});
  const gain=Math.round((20+F.lv*9)*[1,1.4,1.8][(SP[F.sp].st||1)-1]*(b.kind==='farm'?.7:1)); me.exp+=gain; ev.push({k:'exp',n:gain,sp:me.sp});
  while(me.lv<50&&me.exp>=S.lcNext(me.lv)){ me.exp-=S.lcNext(me.lv); lvUp(r,me,ev); }
  if(b.kind==='farm') p.daily.lcfarm=(p.daily.lcfarm||0)+1;
  if(b.kind==='wild'){ r.gone[b.key]=1; b.won=true; b.paid=true; const g=C.gainExp(pl,L.trainerExp); ev.push({k:'won',sp:F.sp,exp:g.exp}); markDirty(pl); return {ev,battle:bview(pl)}; }   // thắng con hoang: được quyền thu phục
  return finish(pl,'win',ev); }
// lên 1 cấp: thêm máu tối đa, học chiêu mới, tiến hoá khi đủ cấp
// con nào đã đủ cấp tiến hoá (vd mốc tiến hoá mới cấp 25) thì tiến hoá luôn lúc chủ vào game
C.hook('login',pl=>{ const p=pl.prof; if(!p||!p.lc) return; const r=rec(p), done=[];
  for(const me of [...r.party,...r.box]){ let E=SP[me.sp]&&SP[me.sp].evo; while(E&&me.lv>=E.lv){ const from=me.sp, ratio=me.hp/maxHp(me); me.sp=E.to; me.hp=Math.max(1,Math.round(maxHp(me)*ratio)); r.dex[me.sp]=2; done.push(`${SP[from].name} → ${SP[me.sp].name}`); E=SP[me.sp].evo; } }
  if(done.length){ C.markDirty(pl); setTimeout(()=>{ if(pl.prof) C.note(pl,`✨ Lính Cát tiến hoá: ${done.join(', ')}`,'quest'); },3000); } });
function lvUp(r,me,ev){ const before=S.lcMoves(me.sp,me.lv), mh=maxHp(me); me.lv++; me.hp=Math.min(maxHp(me),me.hp+(maxHp(me)-mh)); ev.push({k:'lvl',lv:me.lv,sp:me.sp});
  for(const mv of S.lcMoves(me.sp,me.lv)) if(!before.includes(mv)) ev.push({k:'learn',mv,sp:me.sp});
  const E=SP[me.sp].evo; if(E&&me.lv>=E.lv){ const from=me.sp, ratio=me.hp/maxHp(me); me.sp=E.to; me.hp=Math.max(1,Math.round(maxHp(me)*ratio)); r.dex[me.sp]=2; ev.push({k:'evo',from,to:me.sp}); } }
function finish(pl,res,ev){ const p=pl.prof, b=pl.lcb, r=rec(p); pl.lcb=null; let msg='';
  if(res==='win'){ if(b&&b.paid) msg='Đã thả Lính Cát về với thiên nhiên'; else { const g=C.gainExp(pl,L.trainerExp); msg=`Thắng! +${g.exp} EXP huấn luyện viên`; } }
  if(res==='caught') msg='Thu phục thành công!'; if(res==='lose') msg='Lính Cát của bạn kiệt sức hết, về Trung tâm hồi máu nhé'; if(res==='run') msg='Đã rút lui';
  // thú bảo tồn: đấu xong 20% bị công an bắt vì làm hại động vật hoang dã
  if(b&&b.kind==='park'&&Math.random()<L.jail.chance){ const J=L.jail, jf=C.fineOf(pl,J.fine); p.jail={until:now()+J.sec*1000,fine:jf,why:'Cho Lính Cát đánh thú bảo tồn ở vườn quốc gia'}; P.stat(pl,'jail',1);
    ev.push({k:'arrest'}); markDirty(pl); setTimeout(()=>{ if(pl.prof) C.moveTo(pl,'doncongan',7,6); },2600);
    note(pl,`🚓 Kiểm lâm báo công an: làm hại động vật hoang dã! Tạm giữ ${J.sec} giây, nộp ${fmt(jf)} để về sớm`,'lock'); }
  for(const k of Object.keys(r.gone)){ const per=+k.split(':').slice(-2)[0]; if(!(per>=Math.floor(now()/L.period)-1)) delete r.gone[k]; }   // khoá: map:chu kỳ:điểm
  markDirty(pl); return {ev,result:res,msg,battle:null}; }
module.exports={view};
