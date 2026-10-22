// Trồng trọt (vườn rau Ké + nông trại Đà Lạt), chăn nuôi, ngựa (thuê/mua, cưỡi, chăn ngựa, chở hàng), phụ cô Lan nấu ăn.
'use strict';
const C=require('./core'), P=require('./places');
const crypto=require('crypto');
const {S,T,db,on,hook,send,now,near,markDirty,note,reward,take,give,has,addItem,players,byUid,kindOf,broadcastScene}=C;
const fmt=S.fmt;

/* ---------- ô trồng ---------- */
// id ô: k0..k95 (Ké), d0.. (Đà Lạt)
const PLOTS=db.plots();
const pubOf=uid=>crypto.createHash('sha1').update(uid).digest('hex').slice(0,10);
const defOf=id=>id[0]==='k'?S.FARM.plots[+id.slice(1)]:S.DALAT.plots[+id.slice(1)];
const mapOf=id=>id[0]==='k'?'retreat':'dalat';
const view=p=>p&&{o:pubOf(p.o),n:p.n,c:p.c,at:p.at,s:p.s||0,th:p.th||'',g:p.g||0};
function push(id){ broadcastScene(mapOf(id),{t:'plot',id,p:view(PLOTS[id])}); db.savePlot(id,PLOTS[id]||null); }
function plotsFor(map){ const out={}; for(const [id,p] of Object.entries(PLOTS)) if(mapOf(id)===map) out[id]=view(p); return out; }
hook('enter',(pl,id)=>{ if(id==='retreat'||id==='dalat') send(pl,{t:'plots',map:id,list:plotsFor(id)}); });
const DOGOF=new Map(); for(const p of db.allProfiles()) if(p.dog&&S.DOGS[p.dog.k]) DOGOF.set(p._uid,{k:p.dog.k,n:p.name});
const dogsView=()=>[...DOGOF.entries()].map(([uid,d])=>({o:pubOf(uid),n:d.n,k:d.k}));
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'dogs',list:dogsView()}); });
on('dog',(pl,m)=>{ const p=pl.prof; if(m.op==='view') return {dogs:dogsView()}; if(!P.nearNpc(pl,'chuba')) return {err:'Gặp chú Ba cạnh vườn rau Ké'};
  if(m.op==='land'){ const t=S.KE_LAND.find(x=>x.id===m.tier), d=C.today(); if(!t) return {err:'?'}; if(p.keLand&&p.keLand.tier===t.id&&p.keLand.paid===d) return {err:'Đang thuê mảnh này rồi'};
    const old=p.keLand&&p.keLand.paid===d&&S.KE_LAND.find(x=>x.id===p.keLand.tier), cost=Math.max(0,t.price-(old?old.price:0)); if(cost&&!take(pl,cost)) return {err:`${t.name} ${fmt(t.price)}/ngày, không đủ tiền`};
    p.keLand={tier:t.id,paid:d}; markDirty(pl); return {msg:`Thuê ${t.name}: trồng được ${t.plots} ô ở vườn Ké · ${fmt(t.price)}/ngày`}; }
  if(m.op==='landcancel'){ p.keLand=null; markDirty(pl); return {msg:`Đã trả đất, còn trồng được ${S.FARM.free} ô miễn phí`}; }
  if(m.op==='buy'){ const D=S.DOGS[m.k]; if(!D) return {err:'?'}; if(p.dog&&p.dog.k===m.k) return {err:'Bạn đang nuôi giống này rồi'}; if(!take(pl,D.price)) return {err:`${D.name} giá ${fmt(D.price)}, không đủ tiền`};
    const old=p.dog; p.dog={k:m.k,since:now()}; DOGOF.set(pl.uid,{k:m.k,n:p.name}); markDirty(pl); broadcastScene('retreat',{t:'dogs',list:dogsView()});
    return {msg:`Đã mua ${D.name}${old?' (con cũ chú Ba nuôi hộ)':''}. Nó sẽ canh các ô rau của bạn ở Ké và cả chuồng lợn ở trại chú Sáu`}; }
  return {err:'?'}; });
const mine=(uid,map)=>Object.entries(PLOTS).filter(([id,p])=>p.o===uid&&mapOf(id)===map).length;
const state=(id,p,t)=>{ const s=S.plotState(p,t); return id[0]==='d'&&s==='open'?'ripe':s; };    // ở Đà Lạt bác Trang trông vườn, không ai cướp được

on('plant',(pl,m)=>{ const id=String(m.id||''), d=defOf(id), c=S.CROPS[m.crop], p=pl.prof; if(!d||!c) return {err:'?'};
  if(pl.scene!==mapOf(id)||!near(pl,d.x,d.y,26)) return {err:'Đứng cạnh ô đất'}; if(PLOTS[id]) return {err:'Ô này có người trồng rồi'};
  const dl=id[0]==='d'; if(dl?(c.map!=='dalat'||c.kind!==d.kind):c.map) return {err:dl?`Ô này trồng ${({rau:'rau',hoa:'hoa',nhakinh:'dâu tây',cafe:'cà phê',cay:'cây ăn quả',caosu:'cao su'})[d.kind]}`:'Vườn Ké chỉ trồng rau'};
  if(!has(pl,'hat_'+m.crop)) return {err:'Chưa có '+S.ITEMS['hat_'+m.crop].name};
  let lim=S.FARM.free; { const L=p.keLand, tier=L&&L.paid===C.today()&&S.KE_LAND.find(x=>x.id===L.tier); if(tier) lim=tier.plots; }
  if(dl){ const L=p.land, tier=L&&L.paid===C.today()&&S.DL_LAND.find(x=>x.id===L.tier); if(!tier) return {err:'Chưa thuê đất. Gặp bác Trang để thuê một mảnh'}; lim=tier.plots;
    if(!L.plots||!L.plots.includes(id)){ const o=ownerOf(id); return {err:o?`Mảnh này ${o.n} đang thuê`:'Ô này không thuộc mảnh đất bạn thuê (xem biển tên)'}; } }
  const used=dl?p.land.plots.filter(x=>PLOTS[x]&&PLOTS[x].o===pl.uid).length:mine(pl.uid,mapOf(id));   // Đà Lạt: chỉ đếm ô trong mảnh đang thuê (cây còn sót ở mảnh cũ không chiếm chỗ)
  if(used>=lim) return {err:dl?`Mảnh đất của bạn chỉ có ${lim} ô. Thuê mảnh lớn hơn ở chỗ bác Trang`:`Đang trồng được ${lim} ô ở vườn Ké. Thuê thêm đất của chú Ba (cạnh vườn rau)`};
  addItem(pl,'hat_'+m.crop,-1); PLOTS[id]={o:pl.uid,n:p.name,c:m.crop,at:now()}; const dg=!dl&&p.dog&&S.DOGS[p.dog.k]; if(dg&&dg.grace) PLOTS[id].g=dg.grace; push(id); return {}; });
on('harvest',(pl,m)=>{ const id=String(m.id||''), d=defOf(id), pt=PLOTS[id], t=now(); if(!d||!pt) return {err:'Ô trống'};
  if(pl.scene!==mapOf(id)||!near(pl,d.x,d.y,26)) return {err:'Đứng cạnh ô đất'};
  const c=S.CROPS[pt.c], st=state(id,pt,t);
  if(st==='growing') return {err:`${c.name} chưa chín, còn ${Math.ceil((pt.at+c.grow*1000-t)/1000)} giây`};
  if(pt.o===pl.uid){ const dg=id[0]==='k'&&pl.prof.dog&&S.DOGS[pl.prof.dog.k], n=c.yield-(pt.s||0)+(dg&&dg.bonus||0); addItem(pl,pt.c,n); const g=C.gainExp(pl,c.exp); P.stat(pl,'harvest',n);
    if(c.regrow){ PLOTS[id]={...pt,at:t+(c.regrow-c.grow)*1000,s:0,th:'',nt:0,nt2:0}; } else delete PLOTS[id];
    push(id); return {item:pt.c,n,exp:g.exp,stolen:pt.s||0,by:pt.th||''}; }
  // người khác: chỉ cướp được khi chủ để quá giờ, mỗi ô 1 lần, lấy 50%
  if(st!=='open') return {err:`Rau của ${pt.n}. Chủ còn ${Math.max(0,Math.ceil((pt.at+(c.grow+S.FARM.grace)*1000-t)/1000))} giây để thu`};
  if(pt.s) return {err:'Ô này bị cướp một lần rồi'}; if(pt.blk>t) return {err:'Con chó vẫn đang gầm gừ, chưa dám lại gần'};
  const owner=byUid.get(pt.o), dd=id[0]==='k'&&DOGOF.get(pt.o), D=dd&&S.DOGS[dd.k], dn=D?D.name:''; let extra='';
  if(D&&D.block&&Math.random()<D.block){ pt.blk=t+30000; if(owner) note(owner,`${dn} của bạn vừa doạ ${pl.prof.name} chạy mất dép!`,'quest'); return {err:`${dn} của ${pt.n} sủa ầm lên, bạn sợ quá bỏ chạy!`}; }
  const n=Math.max(1,Math.floor(c.yield*(D&&D.steal||S.FARM.steal))); pt.s=n; pt.th=pl.prof.name; addItem(pl,pt.c,n); P.stat(pl,'harvest',n); const g=C.gainExp(pl,S.FARM.stealExp);
  if(D&&D.drain){ pl.prof.needs.energy=Math.max(0,pl.prof.needs.energy-D.drain); extra+=` · ${dn} vờn bạn mệt lả (-${D.drain} năng lượng)`; }
  if(D&&D.bite&&Math.random()<D.bite){ const v=Math.min(pl.prof.money,D.fine); take(pl,v); if(owner) give(owner,v); else db.addMoney&&db.addMoney(pt.o,v); extra+=` · bị ${dn} cắn, đền chủ vườn ${fmt(v)}`;
    if(owner) note(owner,`${dn} cắn ${pl.prof.name} khi cướp rau! Bạn nhận ${fmt(v)} tiền đền`,'vnd'); broadcastScene('retreat',{t:'ev',k:'bite',id:pl.pid}); }
  if(owner) note(owner,`${pl.prof.name} vừa cướp ${n} ${c.name.toLowerCase()} ở vườn của bạn${D&&D.alert?' (Beagle đánh hơi báo ngay)':' vì để quá giờ'}!`,'lock');
  markDirty(pl); push(id); return {item:pt.c,n,exp:g.exp,stole:true,msg:extra?extra.slice(3):''}; });
on('clearPlot',(pl,m)=>{ const id=String(m.id||''), pt=PLOTS[id]; if(!pt||pt.o!==pl.uid) return {err:'Không phải ô của bạn'}; delete PLOTS[id]; push(id); return {}; });
// báo chủ khi chín / sắp bị cướp; dọn ô bỏ hoang quá 1 ngày
hook('slow',()=>{ const t=now();
  for(const [id,p] of Object.entries(PLOTS)){ const c=S.CROPS[p.c]; if(!c){ delete PLOTS[id]; push(id); continue; } const ripe=p.at+c.grow*1000, o=byUid.get(p.o);
    if(t>=ripe&&!p.nt){ p.nt=1; if(o) note(o,`${c.name} chín rồi! ${id[0]==='k'?`Thu trong ${S.FARM.grace} giây kẻo bị người khác cướp 50%`:'Ra nông trại thu hoạch'}`,'quest'); }
    if(id[0]==='k'&&o&&!p.s){ const dd=DOGOF.get(p.o), D=dd&&S.DOGS[dd.k]; if(D&&D.fetch&&t>=ripe+D.fetch*1000&&t<ripe+(p.g||S.FARM.grace)*1000){ const n=c.yield+(D.bonus||0); addItem(o,p.c,n); P.stat(o,'harvest',n); note(o,`${D.name} tha về ${n} ${c.name.toLowerCase()} cho bạn 🐶`,'item'); if(c.regrow) PLOTS[id]={...p,at:t+(c.regrow-c.grow)*1000,s:0,th:'',nt:0,nt2:0}; else delete PLOTS[id]; push(id); continue; } }
    if(id[0]==='k'&&t>=ripe+(p.g||S.FARM.grace)*1000&&!p.nt2){ p.nt2=1; if(o&&!p.s) note(o,`${c.name} ở vườn Ké quá giờ thu, người khác cướp được rồi!`,'lock'); }
    if(t>ripe+864e5&&!c.regrow){ delete PLOTS[id]; push(id); } } });

/* ---------- thuê đất nông trại (theo ngày) ---------- */
// mảnh đất đang thuê: uid → {n tên, field khu, plots [id ô]}; dựng lại từ hồ sơ khi server khởi động
const LANDS=new Map();
for(const p of db.allProfiles()) if(p.land&&p.land.plots&&p.land.paid>=S.addDays(C.today(),-1)) LANDS.set(p._uid,{n:p.name,field:p.land.field,plots:p.land.plots});
const ownerOf=id=>{ for(const [uid,L] of LANDS) if(L.plots.includes(id)) return {uid,...L}; return null; };
const landsView=()=>[...LANDS.values()].map(L=>({n:L.n,field:L.field,plots:L.plots}));
const pushLands=()=>broadcastScene('dalat',{t:'lands',list:landsView()});
hook('enter',(pl,id)=>{ if(id==='dalat') send(pl,{t:'lands',list:landsView()}); });
function freeIn(field,uid,n){ const out=[]; S.DALAT.plots.forEach((d,i)=>{ const id='d'+i, o=ownerOf(id), pt=PLOTS[id]; if(out.length<n&&d.kind===field&&(!o||o.uid===uid)&&(!pt||pt.o===uid)) out.push(id); }); return out; }
function dropLand(pl){ const p=pl.prof; p.land=null; LANDS.delete(pl.uid); markDirty(pl); pushLands(); }
on('land',(pl,m)=>{ const p=pl.prof; if(m.op==='view') return {lands:landsView()}; if(!P.nearNpc(pl,'bactrang')) return {err:'Gặp bác Trang ở nhà phía Bắc nông trại'};
  if(m.op==='cancel'){ dropLand(pl); return {msg:'Đã trả đất. Cây đang trồng vẫn thu hoạch được'}; }
  const t=S.DL_LAND.find(x=>x.id===m.tier), field=String(m.field||'rau'); if(!t||!S.DALAT.plots.some(d=>d.kind===field)) return {err:'?'}; const d=C.today();
  if(p.land&&p.land.tier===t.id&&p.land.field===field&&p.land.paid===d) return {err:'Bạn đang thuê mảnh này rồi'};
  LANDS.delete(pl.uid); const ids=freeIn(field,pl.uid,t.plots); if(ids.length<t.plots){ if(p.land&&p.land.plots) LANDS.set(pl.uid,{n:p.name,field:p.land.field,plots:p.land.plots}); return {err:`Khu này chỉ còn ${ids.length} ô trống, chọn khu khác hoặc mảnh nhỏ hơn`}; }
  const paidToday=p.land&&p.land.paid===d, old=paidToday&&S.DL_LAND.find(x=>x.id===p.land.tier), cost=Math.max(0,t.price-(old?old.price:0));   // đổi mảnh trong ngày: chỉ bù phần chênh
  if(cost&&!take(pl,cost)){ if(p.land&&p.land.plots) LANDS.set(pl.uid,{n:p.name,field:p.land.field,plots:p.land.plots}); return {err:`${t.name} (${t.plots} ô) giá ${fmt(t.price)}/ngày, không đủ tiền`}; }
  p.land={tier:t.id,paid:d,field,plots:ids}; LANDS.set(pl.uid,{n:p.name,field,plots:ids}); markDirty(pl); pushLands();
  return {msg:`Đã thuê ${t.name} · ${t.plots} ô ở khu ${S.DALAT.fields?S.DALAT.fields[field]:field} · ${fmt(t.price)}/ngày. Bác Trang đã cắm biển tên bạn`}; });
function landRoll(pl){ const p=pl.prof, L=p.land, d=C.today();
  { const K=p.keLand; if(K&&K.paid!==d&&p.look){ const t=S.KE_LAND.find(x=>x.id===K.tier); if(t&&take(pl,t.price)){ K.paid=d; note(pl,`Đã trừ tiền thuê đất vườn Ké: ${fmt(t.price)}`,'vnd'); } else { p.keLand=null; note(pl,'Không đủ tiền thuê đất vườn Ké, chú Ba lấy lại đất','lock'); } markDirty(pl); } }
  // hồ sơ cũ (thuê trước khi có mảnh thật): giao 1 mảnh ở khu rau
  if(L&&!L.plots&&p.look){ const t2=S.DL_LAND.find(x=>x.id===L.tier), ids=freeIn('rau',pl.uid,t2?t2.plots:2); L.field='rau'; L.plots=ids; LANDS.set(pl.uid,{n:p.name,field:'rau',plots:ids}); markDirty(pl); pushLands(); }
  if(!L||L.paid===d||!p.look) return; const t=S.DL_LAND.find(x=>x.id===L.tier);
  if(t&&take(pl,t.price)){ L.paid=d; note(pl,`Đã trừ tiền thuê đất ${t.name}: ${fmt(t.price)}`,'vnd'); } else { dropLand(pl); note(pl,'Không đủ tiền thuê đất, bác Trang đã lấy lại mảnh đất','lock'); } markDirty(pl);
 }
hook('login',landRoll); hook('slow',()=>{ for(const pl of players.values()) landRoll(pl); });

/* ---------- chăn nuôi ---------- */
// vật nuôi của mọi người đang online (để vẽ trong chuồng kèm tên chủ); gửi lại khi có thay đổi
const guardOf=p=>p.guard&&p.guard.until>now()&&S.GUARD.plans[p.guard.k]?p.guard.k:'';   // gói chó canh chuồng đang còn hạn
const herdsView=()=>[...players.values()].filter(q=>q.prof.look&&q.prof.animals&&q.prof.animals.length).map(q=>({n:q.prof.name,pid:q.pid,gd:guardOf(q.prof),a:q.prof.animals.map(a=>({k:a.k,loc:a.loc||'dl',r:a.cyc&&now()>=a.cyc?1:a.cyc?0:2}))}));
let lastHerds=''; hook('slow',()=>{ const v=herdsView(), s=JSON.stringify(v); if(s===lastHerds) return; lastHerds=s; broadcastScene('dalat',{t:'herds',list:v}); broadcastScene('retreat',{t:'herds',list:v}); });
hook('enter',(pl,id)=>{ if(id==='dalat'||id==='retreat') send(pl,{t:'herds',list:herdsView()}); });
const penNear=(pl,k,loc)=>loc==='ke'?pl.scene==='retreat'&&near(pl,S.KE_YARD.x,S.KE_YARD.y,64):pl.scene==='dalat'&&(near(pl,S.DALAT.pens[k].x,S.DALAT.pens[k].y,56)||(k==='vit'&&near(pl,S.DALAT.pens.vit.x+4,S.DALAT.pens.vit.y+.8,72)));   // vịt: đứng dọc mép hồ là cho ăn được
const atKeShop=pl=>P.nearNpc(pl,'coke');
on('animal',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='buy'){ const a=S.ANIMALS[m.k]; if(!a) return {err:'?'}; const ke=atKeShop(pl); if(ke&&m.k!=='ga') return {err:'Tiệm cô Ké chỉ bán gà giống'}; if(!ke&&!P.nearNpc(pl,'chusau')) return {err:'Mua ở trại chú Sáu (Đà Lạt) hoặc gà ở tiệm cô Ké'};
    if(!p.skills.channuoi) return {err:'Chưa học Chăn nuôi (học online ở phòng)'};
    if(p.animals.filter(x=>x.k===m.k).length>=a.max) return {err:`Tối đa ${a.max} ${a.name.toLowerCase()}`};
    if(!take(pl,a.price)) return {err:`${a.name} giá ${fmt(a.price)}, không đủ tiền`}; p.animals.push({k:m.k,at:t,fed:0,cyc:0,loc:ke?'ke':'dl'}); markDirty(pl); return {}; }
  if(m.op==='release'){ const B=S.ANIMALS.lon, n=Math.max(1,Math.min(10,m.n|0||1)); if(!has(pl,'lon_con')) return {err:'Không có lợn con trong túi'}; if(!penNear(pl,'lon','dl')) return {err:'Ra chuồng lợn trại chú Sáu (Đà Lạt) để thả'};   // thả lợn con vào chuồng
    let k=0; while(k<n&&has(pl,'lon_con')&&p.animals.filter(x=>x.k==='lon').length<B.max){ addItem(pl,'lon_con',-1); p.animals.push({k:'lon',at:t,fed:0,cyc:0,loc:'dl'}); k++; }
    if(!k) return {err:`Chuồng lợn đầy (tối đa ${B.max} con), bán bớt hoặc chờ xuất chuồng`}; markDirty(pl); return {n:k,msg:`Đã thả ${k} lợn con vào chuồng, cho ăn cám để lớn`}; }
  if(m.op==='feedbuy'){ const f=S.FEED[m.k], n=Math.max(1,Math.min(20,m.n|0||1)); if(!f) return {err:'?'}; const ke=atKeShop(pl); if(ke&&m.k!=='thoc') return {err:'Tiệm cô Ké chỉ bán thóc'}; if(!ke&&!P.nearNpc(pl,'chusau')) return {err:'Mua ở trại chú Sáu'};
    if(!take(pl,f.price*n)) return {err:'Không đủ tiền'}; addItem(pl,m.k,n); return {n}; }
  if(m.op==='guard'){ const G=S.GUARD.plans[m.k]; if(!G) return {err:'?'}; if(!P.nearNpc(pl,'chusau')&&!P.nearNpc(pl,'chuba')) return {err:'Gặp chú Sáu (trại Đà Lạt) hoặc chú Ba (vườn Ké) để thuê'};
    if(!take(pl,G.price)) return {err:`${G.name} giá ${fmt(G.price)}, không đủ tiền`}; const from=p.guard&&p.guard.until>t?p.guard.until:t;
    p.guard={k:m.k,until:from+G.h*3600e3}; markDirty(pl); lastHerds=''; return {msg:`Đã thuê ${G.name}: chó canh hết chuồng lợn, bò, gà, vịt của bạn tới ${S.vnTime(p.guard.until).day.split('-').reverse().join('/')}`}; }
  if(m.op==='steal'){ const R=S.PIG_STEAL, o=players.get(m.pid|0); if(!o||o===pl) return {err:'Chủ chuồng này không còn online'};
    const j=m.i|0, an=o.prof.animals[j]; if(!an||!R.kinds.includes(an.k)) return {err:'Không có con này'};
    if(!penNear(pl,an.k,an.loc)) return {err:an.loc==='ke'?'Ra sân gà Ké đã':'Ra chuồng ở trại chú Sáu (Đà Lạt) đã'};
    if(pl.pigAt&&t-pl.pigAt<R.cd*1000) return {err:`Vừa ra tay xong, đợi ${Math.ceil((R.cd*1000-(t-pl.pigAt))/1000)} giây cho đỡ lộ`};
    pl.pigAt=t; const A=S.ANIMALS[an.k], an1=A.name.toLowerCase(), dd=DOGOF.get(o.uid), D0=dd&&S.DOGS[dd.k], gk=guardOf(o.prof), GP=gk&&S.GUARD.plans[gk], oname=o.prof.name, me=p.name;
    // chó nhà canh hoặc đội chó thuê canh: lấy bên canh chắc hơn
    const cD=D0?(D0.block||D0.bite||R.dogGuard):0, cG=GP?GP.block:0, D=cG>cD?{name:gk==='k9'?'Đội Béc-giê K9':'Chó canh thuê',bite:GP.bite?1:0,fine:GP.bite||0}:D0;
    if(D&&Math.random()<Math.max(cD,cG)){ let msg=`${D.name} nhà ${oname} sủa ầm lên, bạn bỏ chạy không kịp dắt ${an1}!`;   // chó canh cả chuồng lợn, bò, gà, vịt
      if(D.bite){ const v=Math.min(p.money,D.fine); take(pl,v); give(o,v); msg=`${D.name} nhà ${oname} cắn bạn, đền ${fmt(v)}!`; note(o,`${D.name} của bạn cắn ${me} khi định trộm ${an1}! Nhận ${fmt(v)} tiền đền`,'vnd'); }
      else note(o,`${D.name} của bạn vừa đuổi ${me} đang định trộm ${an1}!`,'quest');
      if(D.drain) p.needs.energy=Math.max(0,p.needs.energy-D.drain); markDirty(pl); return {msg}; }
    if(Math.random()>=R.chance){ const v=Math.min(p.money,R.comp); take(pl,v); give(o,v);                                   // bị bắt quả tang: bồi thường cho chủ + vào đồn
      p.jail={until:t+R.jail*1000,fine:R.fine,why:`Trộm ${an1} của ${oname} bị bắt quả tang`}; P.stat(pl,'jail',1); markDirty(pl);
      note(o,`Bắt quả tang ${me} trộm ${an1}! Đã giải lên đồn, ${me} bồi thường bạn ${fmt(v)}`,'vnd'); broadcastScene(pl.scene,{t:'ev',k:'pigBust',id:pl.pid,name:me,by:oname});
      C.moveTo(pl,'doncongan',7,6); return {msg:`Bị ${oname} bắt quả tang! Bồi thường ${fmt(v)}, tạm giữ ${R.jail} giây (nộp ${fmt(R.fine)} để về sớm)`}; }
    o.prof.animals.splice(j,1); markDirty(o); const room=p.animals.filter(x=>x.k===an.k).length<A.max;
    if(room) p.animals.push({...an}); else addItem(pl,R.loot[an.k]||'lon_thit',1);
    note(o,`😱 ${me} vừa trộm 1 ${A.name.toLowerCase()} trong chuồng của bạn!`,'lock'); markDirty(pl);
    return {ok:true,msg:room?`Trót lọt! Dắt 1 ${an1} của ${oname} về chuồng bạn`:`Trót lọt nhưng chuồng bạn đầy, được 1 ${S.ITEMS[R.loot[an.k]]?S.ITEMS[R.loot[an.k]].name.toLowerCase():'phần thịt'}`}; }
  const i=m.i|0, an=p.animals[i]; if(!an) return {err:'Không có con này'}; const a=S.ANIMALS[an.k]; if(!penNear(pl,an.k,an.loc)) return {err:an.loc==='ke'?'Ra sân gà Ké (sườn đồi phía Tây)':'Ra chuồng '+a.name.toLowerCase()};
  if(m.op==='feed'){ if(an.cyc) return {err:t<an.cyc?'Đang lớn, chưa cần cho ăn':'Thu hoạch trước đã'}; if(!has(pl,a.feed)) return {err:'Hết '+S.FEED[a.feed].name.toLowerCase()+'. Mua ở trại chú Sáu'};
    addItem(pl,a.feed,-1); an.cyc=t+a.cycle*1000; markDirty(pl); return {cyc:an.cyc}; }
  if(m.op==='collect'){ if(!an.cyc||t<an.cyc) return {err:'Chưa xong lứa'}; an.cyc=0;
    if(a.feeds&&++an.fed<a.feeds){ markDirty(pl); return {msg:`${a.name} ${a.birth?'mang thai':'lớn thêm'} (${an.fed}/${a.feeds} lứa)`}; }
    if(a.birth){ const n=a.yield+crypto.randomInt(3); an.fed=0; addItem(pl,a.product,n);   // lợn nái đẻ: lợn con vào túi đồ, ra chuồng lợn thả vào nuôi lớn (hoặc giữ bán cho chú Sáu)
      const g=C.gainExp(pl,a.exp); markDirty(pl); return {item:a.product,n,exp:g.exp,msg:`${a.name} đẻ ${n} lợn con! Đã vào túi đồ: thả vào chuồng lợn để nuôi lớn, hoặc bán cho chú Sáu (${fmt(S.SELL[a.product])}/con) · +${g.exp} EXP`}; }
    addItem(pl,a.product,a.yield); const g=C.gainExp(pl,a.exp); if(!a.keep) p.animals.splice(i,1); markDirty(pl); return {item:a.product,n:a.yield,exp:g.exp}; } });

/* ---------- ngựa ---------- */
const hasHorse=pl=>{ const h=pl.prof.horse; return h&&(h.own||h.until>now()); };
const inPasture=pl=>{ const z=S.DALAT.pasture, x=pl.x/T, y=pl.y/T; return pl.scene==='dalat'&&x>=z.x0&&x<=z.x1+1&&y>=z.y0&&y<=z.y1+1; };
on('horse',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='rent'||m.op==='buy'){ if(!P.nearNpc(pl,'anhphong')&&!P.nearNpc(pl,'chuongngua')) return {err:'Gặp anh Phong (Đà Lạt) hoặc chú Hải (trại ngựa thị trấn Đà Bắc)'}; if(!p.skills.cuoingua) return {err:'Chưa học Cưỡi ngựa (học online ở phòng)'};
    if(m.op==='buy'){ if(p.horse&&p.horse.own) return {err:'Bạn có ngựa rồi'}; if(!take(pl,S.HORSE.buy)) return {err:`Ngựa giá ${fmt(S.HORSE.buy)}`}; p.horse={own:true,until:0}; }
    else { if(!take(pl,S.HORSE.rent)) return {err:`Thuê ngựa ${fmt(S.HORSE.rent)}/giờ`}; p.horse={own:!!(p.horse&&p.horse.own),until:Math.max(t,p.horse&&p.horse.until||0)+S.HORSE.rentMin*60e3}; }
    markDirty(pl); return {horse:p.horse}; }
  if(m.op==='coat'){ const c=m.c|0; if(c<0||c>=S.HORSE.coats.length) return {err:'?'}; if(!hasHorse(pl)) return {err:'Chưa có ngựa. Thuê hoặc mua ở trại ngựa'}; p.horseCoat=c; markDirty(pl); return {coat:c}; }   // chọn loại ngựa
  if(m.op==='mount'){ if(pl.scene!=='dalat'&&pl.scene!=='retreat') return {err:'Chỉ cưỡi ngựa ngoài trời (Ké, thị trấn, Đà Lạt)'}; if(!hasHorse(pl)) return {err:'Chưa có ngựa. Thuê hoặc mua ở trại anh Phong'};
    if(pl.kayak||pl.fishing) return {err:'Đang bận'}; pl.riding=true; return {}; }
  if(m.op==='dismount'){ pl.riding=false; return {}; } });
hook('tick',()=>{ for(const pl of players.values()) if(pl.riding&&!hasHorse(pl)){ pl.riding=false; note(pl,'Hết giờ thuê ngựa'); } });
hook('leave',pl=>{ pl.riding=false; pl.herd=null; });
// chăn ngựa: nhận đàn ở chuồng → dắt ra đồng cỏ → cho ăn cỏ 20 giây → dắt về
on('herd',(pl,m)=>{ const p=pl.prof, H=S.HORSE.herd;
  if(m.op==='start'){ if(!P.nearNpc(pl,'anhphong')) return {err:'Gặp anh Phong ở trại ngựa'}; if(p.daily.herd>=H.daily) return {err:'Hôm nay chăn đủ rồi'}; pl.herd={phase:'go'}; return {}; }
  const h=pl.herd; if(!h) return {err:'Chưa nhận đàn ngựa'};
  if(m.op==='graze'){ if(h.phase!=='go'||!inPasture(pl)) return {err:'Dắt đàn vào đồng cỏ đã'};
    return P.startTask(pl,'herd',H.dur,()=>{ if(!inPasture(pl)){ pl.herd={phase:'go'}; return {msg:'Ngựa chưa ăn xong đã bị dắt đi'}; } pl.herd={phase:'back'}; return {msg:'Ngựa no cỏ rồi, dắt về chuồng'}; },{walk:true,anim:'herd',name:'Cho ngựa ăn cỏ'}); }
  if(m.op==='return'){ if(h.phase!=='back') return {err:'Ngựa chưa ăn cỏ: dắt đàn ra đồng cỏ phía Đông Bắc (theo mũi tên vàng), đứng trong khung vàng '+H.dur+' giây'}; if(!P.nearNpc(pl,'anhphong')) return {err:'Dắt về chuồng anh Phong'};
    pl.herd=null; p.daily.herd++; reward(pl,{exp:H.exp,vnd:H.vnd},'Chăn ngựa xong'); return {}; } });
// chở thùng hàng từ kho ra chợ: đi bộ 1 thùng, cưỡi ngựa 3 thùng
on('crate',(pl,m)=>{ const p=pl.prof, D=S.DALAT; if(pl.scene!=='dalat') return {err:'?'};
  if(m.op==='load'){ if(!near(pl,D.warehouse.x,D.warehouse.y,48)) return {err:'Lấy hàng ở kho cạnh nhà bác Trang'};
    const cap=pl.riding?S.HORSE.carry:1, cur=p.items.thung_hang||0, left=S.CRATES.daily-p.daily.crates-cur; const n=Math.min(cap-cur,left);
    if(left<=0) return {err:'Hôm nay chở đủ rồi'}; if(n<=0) return {err:pl.riding?'Ngựa chở đầy rồi':'Đi bộ chỉ vác được 1 thùng. Cưỡi ngựa chở được 3'};
    addItem(pl,'thung_hang',n); return {n}; }
  if(m.op==='deliver'){ if(!near(pl,D.market.x,D.market.y,48)) return {err:'Giao ở điểm nhận hàng của chợ'}; const n=p.items.thung_hang||0; if(!n) return {err:'Không có thùng nào'};
    addItem(pl,'thung_hang',-n); p.daily.crates+=n; reward(pl,{exp:S.CRATES.exp*n,vnd:S.CRATES.vnd*n},`Giao ${n} thùng hàng`); return {n}; } });

/* ---------- phụ cô Lan nấu ăn ---------- */
on('cook',(pl,m)=>{ const p=pl.prof, D=S.DALAT;
  if(m.op==='order'){ if(!P.nearNpc(pl,'colan')) return {err:'Gặp cô Lan ở quán'}; if(!p.skills.nauan) return {err:'Chưa học Nấu ăn (học online ở phòng)'};
    if(p.cookOrder) return {order:p.cookOrder}; if(p.daily.cook>=S.COOK.daily) return {err:'Hôm nay phụ quán đủ rồi'};
    const ks=Object.keys(S.RECIPES); p.cookOrder={r:ks[crypto.randomInt(ks.length)],at:now()}; markDirty(pl); return {order:p.cookOrder}; }
  if(m.op==='buy'){ const g=S.INGREDIENTS[m.ing], n=Math.max(1,Math.min(10,m.n|0||1)); if(!g) return {err:'?'};
    if(!P.nearNpc(pl,g.shop)) return {err:'Mua ở '+D.shops[g.shop].name}; if(!take(pl,g.price*n)) return {err:'Không đủ tiền'}; addItem(pl,m.ing,n); return {n}; }
  if(m.op==='cancel'){ p.cookOrder=null; markDirty(pl); return {}; }
  if(m.op==='cook'){ const o=p.cookOrder; if(!o) return {err:'Chưa nhận đơn'}; const r=S.RECIPES[o.r];
    if(pl.scene!=='quan_lan'||!near(pl,D.stove.x,D.stove.y,40)) return {err:'Vào bếp trong quán cô Lan'};
    const miss=Object.entries(r.need).filter(([k,n])=>!has(pl,k,n)).map(([k])=>S.ITEMS[k].name); if(miss.length) return {err:'Còn thiếu: '+miss.join(', ')};
    const score=Math.max(0,Math.min(S.COOK.steps,m.score|0));
    for(const [k,n] of Object.entries(r.need)) addItem(pl,k,-n);
    return P.startTask(pl,'cook',5,()=>{ p.cookOrder=null; p.daily.cook++; const ok=score>=2, k=ok?1:.6;
      reward(pl,{exp:Math.round(r.exp*k),vnd:Math.round(r.pay*k)},`${r.name} ${ok?'ngon tuyệt':'hơi mặn'} · cô Lan trả công`); return {score}; },{anim:'cook',name:'Nấu '+r.name}); } });

// chỉ dùng khi chạy thử: cho ô rau già đi `sec` giây
function agePlot(id,sec){ const p=PLOTS[id]; if(p){ p.at-=sec*1000; p.nt=0; p.nt2=0; push(id); } }
module.exports={PLOTS,pubOf,hasHorse,inPasture,agePlot};
