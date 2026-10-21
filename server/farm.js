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
const view=p=>p&&{o:pubOf(p.o),n:p.n,c:p.c,at:p.at,s:p.s||0,th:p.th||''};
function push(id){ broadcastScene(mapOf(id),{t:'plot',id,p:view(PLOTS[id])}); db.savePlot(id,PLOTS[id]||null); }
function plotsFor(map){ const out={}; for(const [id,p] of Object.entries(PLOTS)) if(mapOf(id)===map) out[id]=view(p); return out; }
hook('enter',(pl,id)=>{ if(id==='retreat'||id==='dalat') send(pl,{t:'plots',map:id,list:plotsFor(id)}); });
const mine=(uid,map)=>Object.entries(PLOTS).filter(([id,p])=>p.o===uid&&mapOf(id)===map).length;
const state=(id,p,t)=>{ const s=S.plotState(p,t); return id[0]==='d'&&s==='open'?'ripe':s; };    // ở Đà Lạt bác Trang trông vườn, không ai cướp được

on('plant',(pl,m)=>{ const id=String(m.id||''), d=defOf(id), c=S.CROPS[m.crop], p=pl.prof; if(!d||!c) return {err:'?'};
  if(pl.scene!==mapOf(id)||!near(pl,d.x,d.y,26)) return {err:'Đứng cạnh ô đất'}; if(PLOTS[id]) return {err:'Ô này có người trồng rồi'};
  const dl=id[0]==='d'; if(dl?(c.map!=='dalat'||c.kind!==d.kind):c.map) return {err:dl?`Ô này trồng ${({rau:'rau',hoa:'hoa',nhakinh:'dâu tây',cafe:'cà phê',cay:'cây ăn quả',caosu:'cao su'})[d.kind]}`:'Vườn Ké chỉ trồng rau'};
  if(!has(pl,'hat_'+m.crop)) return {err:'Chưa có '+S.ITEMS['hat_'+m.crop].name};
  const lim=dl?S.DL_FARM.maxPlots:S.FARM.maxPlots; if(mine(pl.uid,mapOf(id))>=lim) return {err:`Mỗi người trồng tối đa ${lim} ô ở đây`};
  addItem(pl,'hat_'+m.crop,-1); PLOTS[id]={o:pl.uid,n:p.name,c:m.crop,at:now()}; push(id); return {}; });
on('harvest',(pl,m)=>{ const id=String(m.id||''), d=defOf(id), pt=PLOTS[id], t=now(); if(!d||!pt) return {err:'Ô trống'};
  if(pl.scene!==mapOf(id)||!near(pl,d.x,d.y,26)) return {err:'Đứng cạnh ô đất'};
  const c=S.CROPS[pt.c], st=state(id,pt,t);
  if(st==='growing') return {err:`${c.name} chưa chín, còn ${Math.ceil((pt.at+c.grow*1000-t)/1000)} giây`};
  if(pt.o===pl.uid){ const n=c.yield-(pt.s||0); addItem(pl,pt.c,n); const g=C.gainExp(pl,c.exp);
    if(c.regrow){ PLOTS[id]={...pt,at:t+(c.regrow-c.grow)*1000,s:0,th:'',nt:0,nt2:0}; } else delete PLOTS[id];
    push(id); return {item:pt.c,n,exp:g.exp,stolen:pt.s||0,by:pt.th||''}; }
  // người khác: chỉ cướp được khi chủ để quá giờ, mỗi ô 1 lần, lấy 50%
  if(st!=='open') return {err:`Rau của ${pt.n}. Chủ còn ${Math.max(0,Math.ceil((pt.at+(c.grow+S.FARM.grace)*1000-t)/1000))} giây để thu`};
  if(pt.s) return {err:'Ô này bị cướp một lần rồi'};
  const n=Math.max(1,Math.floor(c.yield*S.FARM.steal)); pt.s=n; pt.th=pl.prof.name; addItem(pl,pt.c,n); const g=C.gainExp(pl,S.FARM.stealExp);
  const owner=byUid.get(pt.o); if(owner) note(owner,`${pl.prof.name} vừa cướp ${n} ${c.name.toLowerCase()} ở vườn của bạn vì để quá giờ!`,'lock');
  push(id); return {item:pt.c,n,exp:g.exp,stole:true}; });
on('clearPlot',(pl,m)=>{ const id=String(m.id||''), pt=PLOTS[id]; if(!pt||pt.o!==pl.uid) return {err:'Không phải ô của bạn'}; delete PLOTS[id]; push(id); return {}; });
// báo chủ khi chín / sắp bị cướp; dọn ô bỏ hoang quá 1 ngày
hook('slow',()=>{ const t=now();
  for(const [id,p] of Object.entries(PLOTS)){ const c=S.CROPS[p.c]; if(!c){ delete PLOTS[id]; push(id); continue; } const ripe=p.at+c.grow*1000, o=byUid.get(p.o);
    if(t>=ripe&&!p.nt){ p.nt=1; if(o) note(o,`${c.name} chín rồi! ${id[0]==='k'?`Thu trong ${S.FARM.grace} giây kẻo bị người khác cướp 50%`:'Ra nông trại thu hoạch'}`,'quest'); }
    if(id[0]==='k'&&t>=ripe+S.FARM.grace*1000&&!p.nt2){ p.nt2=1; if(o&&!p.s) note(o,`${c.name} ở vườn Ké quá giờ thu, người khác cướp được rồi!`,'lock'); }
    if(t>ripe+864e5&&!c.regrow){ delete PLOTS[id]; push(id); } } });

/* ---------- chăn nuôi ---------- */
const penNear=(pl,k)=>pl.scene==='dalat'&&near(pl,S.DALAT.pens[k].x,S.DALAT.pens[k].y,56);
on('animal',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='buy'){ const a=S.ANIMALS[m.k]; if(!a) return {err:'?'}; if(!P.nearNpc(pl,'chusau')) return {err:'Mua ở trại chú Sáu'};
    if(!p.skills.channuoi) return {err:'Chưa học Chăn nuôi (học online ở phòng)'};
    if(p.animals.filter(x=>x.k===m.k).length>=a.max) return {err:`Tối đa ${a.max} ${a.name.toLowerCase()}`};
    if(!take(pl,a.price)) return {err:`${a.name} giá ${fmt(a.price)}, không đủ tiền`}; p.animals.push({k:m.k,at:t,fed:0,cyc:0}); markDirty(pl); return {}; }
  if(m.op==='feedbuy'){ const f=S.FEED[m.k], n=Math.max(1,Math.min(20,m.n|0||1)); if(!f) return {err:'?'}; if(!P.nearNpc(pl,'chusau')) return {err:'Mua ở trại chú Sáu'};
    if(!take(pl,f.price*n)) return {err:'Không đủ tiền'}; addItem(pl,m.k,n); return {n}; }
  const i=m.i|0, an=p.animals[i]; if(!an) return {err:'Không có con này'}; const a=S.ANIMALS[an.k]; if(!penNear(pl,an.k)) return {err:'Ra chuồng '+a.name.toLowerCase()};
  if(m.op==='feed'){ if(an.cyc) return {err:t<an.cyc?'Đang lớn, chưa cần cho ăn':'Thu hoạch trước đã'}; if(!has(pl,a.feed)) return {err:'Hết '+S.FEED[a.feed].name.toLowerCase()+'. Mua ở trại chú Sáu'};
    addItem(pl,a.feed,-1); an.cyc=t+a.cycle*1000; markDirty(pl); return {cyc:an.cyc}; }
  if(m.op==='collect'){ if(!an.cyc||t<an.cyc) return {err:'Chưa xong lứa'}; an.cyc=0;
    if(a.feeds&&++an.fed<a.feeds){ markDirty(pl); return {msg:`${a.name} lớn thêm (${an.fed}/${a.feeds} lứa)`}; }
    addItem(pl,a.product,a.yield); const g=C.gainExp(pl,a.exp); if(!a.keep) p.animals.splice(i,1); markDirty(pl); return {item:a.product,n:a.yield,exp:g.exp}; } });

/* ---------- ngựa ---------- */
const hasHorse=pl=>{ const h=pl.prof.horse; return h&&(h.own||h.until>now()); };
const inPasture=pl=>{ const z=S.DALAT.pasture, x=pl.x/T, y=pl.y/T; return pl.scene==='dalat'&&x>=z.x0&&x<=z.x1+1&&y>=z.y0&&y<=z.y1+1; };
on('horse',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='rent'||m.op==='buy'){ if(!P.nearNpc(pl,'anhphong')) return {err:'Gặp anh Phong ở trại ngựa'}; if(!p.skills.cuoingua) return {err:'Chưa học Cưỡi ngựa (học online ở phòng)'};
    if(m.op==='buy'){ if(p.horse&&p.horse.own) return {err:'Bạn có ngựa rồi'}; if(!take(pl,S.HORSE.buy)) return {err:`Ngựa giá ${fmt(S.HORSE.buy)}`}; p.horse={own:true,until:0}; }
    else { if(!take(pl,S.HORSE.rent)) return {err:`Thuê ngựa ${fmt(S.HORSE.rent)}/giờ`}; p.horse={own:!!(p.horse&&p.horse.own),until:Math.max(t,p.horse&&p.horse.until||0)+S.HORSE.rentMin*60e3}; }
    markDirty(pl); return {horse:p.horse}; }
  if(m.op==='mount'){ if(pl.scene!=='dalat') return {err:'Chỉ cưỡi ngựa ở nông trại Đà Lạt'}; if(!hasHorse(pl)) return {err:'Chưa có ngựa. Thuê hoặc mua ở trại anh Phong'};
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
  if(m.op==='return'){ if(h.phase!=='back') return {err:'Ngựa chưa ăn cỏ'}; if(!P.nearNpc(pl,'anhphong')) return {err:'Dắt về chuồng anh Phong'};
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
    if(pl.scene!=='dalat'||!near(pl,D.stove.x,D.stove.y,40)) return {err:'Vào bếp của quán cô Lan'};
    const miss=Object.entries(r.need).filter(([k,n])=>!has(pl,k,n)).map(([k])=>S.ITEMS[k].name); if(miss.length) return {err:'Còn thiếu: '+miss.join(', ')};
    const score=Math.max(0,Math.min(S.COOK.steps,m.score|0));
    for(const [k,n] of Object.entries(r.need)) addItem(pl,k,-n);
    return P.startTask(pl,'cook',5,()=>{ p.cookOrder=null; p.daily.cook++; const ok=score>=2, k=ok?1:.6;
      reward(pl,{exp:Math.round(r.exp*k),vnd:Math.round(r.pay*k)},`${r.name} ${ok?'ngon tuyệt':'hơi mặn'} · cô Lan trả công`); return {score}; },{anim:'cook',name:'Nấu '+r.name}); } });

module.exports={PLOTS,pubOf,hasHorse,inPasture};
