// Shopee Chande: mua quần áo, giày dép, mũ kính, phụ kiện, đồ phụ trợ online ở bất cứ đâu (nút C → Chợ đồ cũ → Shopee Chande), freeship.
// Giá: flash sale (data.js SHOPEE.base) rồi mới tới ưu đãi DAS / Bearplus / Lumen / Everfit và hảo sảng (perks.js shopPay). Lưu 30 đơn gần nhất ở p.shopee.orders
'use strict';
const C=require('./core');
const {shopPay,priceFor}=require('./perks');
const {S,on,now,markDirty,addItem}=C, SP=S.SHOPEE, fmt=S.fmt;
on('shopee',(pl,m)=>{ const p=pl.prof, t=now(), k=String(m.k||'');
  if(m.op==='orders') return {orders:(p.shopee&&p.shopee.orders)||[]};
  if(m.op!=='buy') return {err:'?'};
  const it=SP.item(k), aux=k.startsWith('aux:')?it:null, pet=k.startsWith('pet:')?k.slice(4):null, c=aux||pet?null:it;
  if(!it||!SP.ids().includes(k)) return {err:'Món này không bán trên Shopee'};
  if(c&&p.owned[k]) return {err:'Bạn có món này rồi'};
  if(aux&&aux.helmet&&p.helmet) return {err:'Bạn có mũ bảo hiểm rồi'};
  if(aux&&aux.gear&&p.gear&&p.gear[aux.gear]) return {err:'Bạn có món này rồi, mở Túi đồ (I) để dùng'};
  if(aux&&aux.pack&&!p.sim) return {err:'Gói 4G cần SIM VNPT: mua SIM ở điểm giao dịch VNPT trước'};
  if(pet&&p.pets&&p.pets[pet]) return {err:'Bạn đang nuôi bé này rồi'};
  const base=SP.base(k,t), pay=priceFor(pl,base); if(!shopPay(pl,base)) return {err:`${it.name} giá ${fmt(pay)}, ví không đủ`};
  if(c) p.owned[k]=1;
  else if(pet){ p.pets=p.pets||{}; p.pets[pet]={at:t,fed:t}; if(!p.pet) p.pet=pet; C.refreshInfo(pl); }   /* thú cưng: no sẵn 6 giờ, chưa có con nào theo thì con mới theo luôn */
  else if(aux.item) addItem(pl,aux.item,aux.n);
  else if(aux.helmet) p.helmet=true;
  else if(aux.gear){ p.gear=p.gear||{}; p.gear[aux.gear]=1; }   /* đồ mang theo: sạc dự phòng, túi ngủ (gear.js) */
  else if(aux.pack){ const pk=S.VNPT.packs[aux.pack], from=Math.max(t,(p.data&&p.data.until)||0); p.data={name:pk.name,until:from+pk.h*3600e3}; }
  const o=p.shopee=p.shopee||{orders:[],n:0}; o.orders.unshift({k,pay,full:it.price,at:t}); o.orders.length=Math.min(o.orders.length,30); o.n=(o.n||0)+1;
  markDirty(pl); return {pay,full:it.price,name:it.name}; });
