// Nhà riêng (Hà Nội): mua nội thất (laptop / bảng Sửa nhà), đặt / dời / xoay / cất đồ, bán lại 50%, đổi sàn + tường, mở rộng nhà 4 cấp,
// độ ấm cúng (buff khi ngủ ở nhà, places.js roomCtx), khách thích nhà, bảng xếp hạng nhà đẹp + ghé thăm nhà mở cửa (lb.js). Dữ liệu: data.js HOME.
'use strict';
const C=require('./core'), {shopPay}=require('./perks');
const {S,on,send,take,give,note,markDirty,byUid,db,now}=C;
const H=S.HOME, fmt=S.fmt;
// nhà của 1 hồ sơ (lần đầu tạo bố cục có sẵn giống căn hộ cũ)
function homeOf(p){ if(!p.home||!Array.isArray(p.home.items)) p.home=S.homeDefault(); const h=p.home; h.inv=h.inv||{}; h.own=h.own||{floor:{go:1},wall:{kem:1}}; h.likes=h.likes||{}; if(h.open==null) h.open=true; return h; }
// bố cục gửi cho mọi người trong nhà; chủ nhà nhận thêm kho đồ, sàn / tường đã mua
const view=(h,name)=>({lv:h.lv||0,floor:h.floor,wall:h.wall,items:h.items,likes:Object.keys(h.likes||{}).length,cozy:S.homeCozy(h),name});
const mine=h=>({inv:h.inv,own:h.own,open:h.open});
// nhà theo uid: chủ đang online thì lấy hồ sơ đang chơi, không thì đọc hồ sơ đã lưu
function homeByUid(uid){ const q=byUid.get(uid); if(q&&q.prof) return {h:homeOf(q.prof),name:q.prof.name,q}; const p=db.profile(uid); if(!p) return null; return {h:p.home&&Array.isArray(p.home.items)?p.home:S.homeDefault(),name:p.name,p}; }
// vào nhà ai (core.moveTo gọi): gửi kèm bố cục + kích thước để server chặn đi ra ngoài tường
C.homeScene=(pl,id)=>{ const uid=id.slice(5), r=homeByUid(uid); if(!r) return {}; const L=H.levels[r.h.lv||0]; pl.roomWH=[L.W,L.H]; return {home:view(r.h,r.name),...(pl.uid===uid?{mine:mine(r.h)}:{})}; };
function push(pl){ const h=homeOf(pl.prof), v=view(h,pl.prof.name), L=H.levels[h.lv||0]; for(const q of C.sceneOf('room:'+pl.uid)){ q.roomWH=[L.W,L.H]; send(q,{t:'home',home:v,...(q===pl?{mine:mine(h)}:{})}); } if(!C.sceneOf('room:'+pl.uid).has(pl)) send(pl,{t:'home',home:v,mine:mine(h),away:1}); }
const atHome=pl=>pl.scene==='room:'+pl.uid;
const meTile=pl=>[Math.floor(pl.x/C.T),Math.floor(pl.y/C.T)];
on('home',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const op=m.op, h=homeOf(p), D=H.items;
  if(op==='state') return {home:view(h,p.name),mine:mine(h),score:S.homeScore(h)};
  // mua món vào kho (đặt sau ở chế độ Sửa nhà); giảm giá học viên / hảo sảng như mọi cửa hàng
  if(op==='buy'){ const d=D[m.k], n=Math.max(1,Math.min(5,m.n|0||1)); if(!d) return {err:'?'}; if(!shopPay(pl,d.price*n)) return {err:`Cần ${fmt(d.price*n)}`}; h.inv[m.k]=(h.inv[m.k]||0)+n; h.edited=1; markDirty(pl); push(pl); return {msg:`Đã mua ${n} ${d.name}: vào kho nội thất, bấm 🛠 Sửa nhà để đặt`}; }
  // mua cả bộ sưu tập: các món chưa có (chưa đặt, chưa trong kho), giảm 10%
  if(op==='buyset'){ const st=H.sets[m.s]; if(!st) return {err:'?'}; const placed=new Set(h.items.map(o=>o.k)), miss=st.items.filter(k=>!placed.has(k)&&!(h.inv[k]>0)); if(!miss.length) return {err:'Bạn đã có đủ bộ này rồi, đặt hết vào nhà để nhận thưởng'};
    const v=Math.round(miss.reduce((a,k)=>a+D[k].price,0)*.9/1000)*1000; if(!shopPay(pl,v)) return {err:`Cả bộ còn thiếu ${miss.length} món: ${fmt(v)}`}; for(const k of miss) h.inv[k]=(h.inv[k]||0)+1; h.edited=1; markDirty(pl); push(pl); return {msg:`Đã mua ${miss.length} món bộ ${st.name}: vào kho, đặt đủ cả bộ để +${st.bonus} ấm cúng`}; }
  if(op==='sell'){ const d=D[m.k]; if(!d||!(h.inv[m.k]>0)) return {err:'Trong kho không có món này'}; const v=Math.round(d.price*H.sellBack); h.inv[m.k]--; if(!h.inv[m.k]) delete h.inv[m.k]; give(pl,v); markDirty(pl); push(pl); return {msg:`Bán lại ${d.name} được ${fmt(v)}`}; }
  // đổi sàn / tường: lần đầu mua, đã mua thì đổi qua lại miễn phí
  if(op==='floor'||op==='wall'){ const T0=op==='floor'?H.floors:H.walls, k=String(m.k||''), t=T0[k]; if(!t) return {err:'?'}; const own=h.own[op]=h.own[op]||{};
    if(!own[k]){ if(!shopPay(pl,t.price)) return {err:`Cần ${fmt(t.price)}`}; own[k]=1; } h[op]=k; h.edited=1; markDirty(pl); push(pl); return {msg:`Đã đổi ${op==='floor'?'sàn':'tường'}: ${t.name}`}; }
  if(op==='expand'){ const nx=H.levels[(h.lv||0)+1]; if(!nx) return {err:'Nhà đã to nhất rồi'}; if(!take(pl,nx.price)) return {err:`Mở rộng lên ${nx.name} cần ${fmt(nx.price)}`}; h.lv=(h.lv||0)+1; h.edited=1; markDirty(pl); push(pl);
    return {msg:`🏗 Nhà đã mở rộng: ${nx.name} (${nx.W}×${nx.H} ô, đặt tối đa ${nx.cap} món)`}; }
  if(op==='open'){ h.open=!!m.v; markDirty(pl); push(pl); return {msg:h.open?'Mở cửa cho khách ghé thăm từ bảng xếp hạng nhà đẹp':'Đã đóng cửa, chỉ người được mời mới vào'}; }
  // sửa đồ: phải đang ở trong nhà mình
  if(['place','move','flip','stash'].includes(op)&&!atHome(pl)) return {err:'Về nhà mình mới sửa nhà được'};
  if(op==='place'){ const d=D[m.k], it={k:String(m.k||''),x:m.x|0,y:m.y|0,f:m.f?1:0}; if(!d) return {err:'?'}; if(!(h.inv[it.k]>0)) return {err:'Trong kho không còn món này, mua thêm ở 🛒'};
    const cap=H.levels[h.lv||0].cap; if(h.items.length>=cap) return {err:`Nhà này đặt tối đa ${cap} món, mở rộng nhà để đặt thêm`}; const e=S.homeFits(h,it,-1,meTile(pl)); if(e) return {err:e};
    h.inv[it.k]--; if(!h.inv[it.k]) delete h.inv[it.k]; h.items.push(it); h.edited=1; markDirty(pl); push(pl); return {ok:1}; }
  const i=m.i|0, it=h.items[i]; if(['move','flip','stash'].includes(op)&&!it) return {err:'Món đó không còn ở đây'};
  if(op==='move'){ const nx={...it,x:m.x|0,y:m.y|0,f:m.f==null?it.f:(m.f?1:0)}, e=S.homeFits(h,nx,i,meTile(pl)); if(e) return {err:e}; h.items[i]=nx; h.edited=1; markDirty(pl); push(pl); return {ok:1}; }
  if(op==='flip'){ it.f=it.f?0:1; markDirty(pl); push(pl); return {ok:1}; }
  if(op==='stash'){ const d=D[it.k]; if(d&&d.req) return {err:`${d.name} là đồ cần thiết, chỉ dời chỗ được`}; h.items.splice(i,1); h.inv[it.k]=(h.inv[it.k]||0)+1; h.edited=1; markDirty(pl); push(pl); return {ok:1}; }
  // khách thích nhà (mỗi người thích 1 nhà 1 lần, từ cấp HOME.likeLv): cộng điểm bảng xếp hạng nhà đẹp
  if(op==='like'){ const kind=C.kindOf(pl.scene), uid=pl.scene.slice(5); if(kind!=='room'||uid===pl.uid) return {err:'Vào nhà người khác mới thích được'}; if((p.level||1)<H.likeLv) return {err:`Từ cấp ${H.likeLv} mới thích nhà được`};
    const r=homeByUid(uid); if(!r) return {err:'?'}; r.h.likes=r.h.likes||{}; if(r.h.likes[pl.uid]) return {err:'Bạn đã thích nhà này rồi'}; r.h.likes[pl.uid]=1;
    if(r.q){ markDirty(r.q); note(r.q,`❤ ${p.name} thích nhà của bạn!`,'quest'); push(r.q); } else if(r.p){ r.p.home=r.h; db.saveProfile(uid,r.p); }
    return {msg:`❤ Đã thích nhà của ${r.name}`,likes:Object.keys(r.h.likes).length}; }
  // ghé thăm nhà trên bảng xếp hạng nhà đẹp (chủ mở cửa, online hay offline đều vào được)
  if(op==='visit'){ const uid=require('./lb').homeUid(m.i|0,m.n); if(!uid) return {err:'Bảng xếp hạng đã đổi, mở lại xem'}; if(uid===pl.uid){ const sp=S.ROOMS.tro.spawn; C.moveTo(pl,'room:'+pl.uid,sp.x,sp.y); return {}; }
    const r=homeByUid(uid); if(!r||r.h.open===false) return {err:'Nhà này đang đóng cửa'}; if(pl.race||pl.stunt||(p.jail&&p.jail.until>now())) return {err:'Đang bận'};
    const sp=S.ROOMS.tro.spawn; C.moveTo(pl,'room:'+uid,sp.x,sp.y,{host:r.name}); if(r.q) note(r.q,`🏠 ${p.name} ghé thăm nhà bạn`,'quest'); return {}; }
  return {err:'?'}; });
module.exports={homeOf};
