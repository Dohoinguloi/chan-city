// Đồ mang theo mua ở Shopee Chande: sạc dự phòng (data.js GEAR.pbank.per lượt / ngày), túi ngủ di động (ngủ ở đâu cũng được),
// lương khô (mỗi gói 4 bữa, ăn ở đâu cũng tính là bữa chính như ăn ở quán). Dùng ở Túi đồ, nút cạnh cảnh báo chỉ số, Auto cũng tự dùng.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,markDirty,addItem}=C, G=S.GEAR;
on('carry',(pl,m)=>{   /* tên riêng: 'gear' là lệnh đổi trang bị MU (mu.js) */ const p=pl.prof, d=p.daily, own=p.gear||{}, op=String(m.op||''); if(pl.lcb||pl.race) return {err:'Đang bận'};
  if(op==='pbank'){ if(!own.pbank) return {err:'Chưa có sạc dự phòng: mua ở Shopee Chande, tab Phụ trợ'}; if((d.pbank||0)>=G.pbank.per) return {err:`Hôm nay đã sạc đủ ${G.pbank.per} lần, sạc dự phòng hết pin rồi`};
    if(p.needs.battery>=99) return {err:'Pin đầy rồi'};
    return P.startTask(pl,'sac',G.pbank.sec,()=>{ d.pbank=(d.pbank||0)+1; p.needs.battery=Math.min(100,p.needs.battery+G.pbank.charge); markDirty(pl);
      return {msg:`🔋 Sạc dự phòng: pin ${Math.round(p.needs.battery)}% · còn ${G.pbank.per-d.pbank} lần hôm nay`}; },{name:'Cắm sạc dự phòng'}); }
  if(op==='bag'){ if(!own.bag) return {err:'Chưa có túi ngủ di động: mua ở Shopee Chande, tab Phụ trợ'}; if(pl.moto) return {err:'Xuống xe đã rồi ngủ'};
    return P.startTask(pl,'nghi',G.bag.sec,()=>{ p.needs.energy=Math.min(100,p.needs.energy+G.bag.rest); markDirty(pl); return {msg:`🛌 Chợp mắt trong túi ngủ: +${G.bag.rest} năng lượng`}; },{anim:'sleep',name:'Ngủ túi ngủ di động'}); }
  if(op==='luong'){ if(!((p.items.luong_kho||0)>0)) return {err:'Hết lương khô: mua ở Shopee Chande, tab Phụ trợ'};
    const st=S.mealStatus(p.meals), slot=st.find(s=>s.st==='now')||st.find(s=>s.st==='missed');
    if(!slot){ const nx=st.find(s=>s.st==='later'); return {err:nx?`Đang no. Bữa tới: ${nx.name} từ ${nx.from}:00`:'Hôm nay ăn đủ 3 bữa rồi'}; }
    addItem(pl,'luong_kho',-1); const day=C.today(); if(p.meals.day!==day) p.meals={day,eaten:{}}; if(!p.meals.eaten[slot.id]) C.track(pl,'meal'); p.meals.eaten[slot.id]=true;
    p.needs.energy=Math.min(100,p.needs.energy+G.luong.energy); C.reward(pl,{exp:G.luong.exp},`Ăn lương khô thay ${slot.name.toLowerCase()}`); markDirty(pl);
    return {msg:`🍙 Ăn lương khô thay ${slot.name.toLowerCase()} · còn ${p.items.luong_kho||0} bữa`,meal:slot.id}; }
  return {err:'?'}; });
