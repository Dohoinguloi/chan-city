// Thú cưng (mua ở Shopee Chande, tab Thú cưng): chọn 1 con đi theo, cho ăn bằng gói hạt đúng loài. No: +3% EXP (core.js expMul), dỗi quá 24 giờ thì không theo (data.js petState)
'use strict';
const C=require('./core');
const {S,on,now,markDirty,addItem}=C;
on('pet',(pl,m)=>{ const p=pl.prof, k=String(m.k||''), t=now(), mine=p.pets||{};
  if(m.op==='use'){ if(k&&!mine[k]) return {err:'Bạn chưa nuôi bé này'}; p.pet=k||null; markDirty(pl); C.refreshInfo(pl); return {msg:k?`${S.PETS[k].name} đi theo bạn`:'Cho thú cưng ở nhà'}; }
  if(m.op==='feed'){ const e=mine[k], P=S.PETS[k]; if(!e||!P) return {err:'Bạn chưa nuôi bé này'}; const it='petfood_'+P.food;
    if(!((p.items[it]||0)>0)) return {err:`Hết ${S.PETFOOD[P.food].name}: mua ở Shopee Chande, tab Thú cưng`};
    if(t-(e.fed||0)<S.PETCFG.full*3600e3*.5) return {err:`${P.name} còn no lắm, lát nữa cho ăn nhé`};
    addItem(pl,it,-1); const was=S.petState(p,t); e.fed=t; markDirty(pl); if(p.pet===k&&was==='sulk') C.refreshInfo(pl);
    return {msg:`${P.name} ăn ngon lành! No ${S.PETCFG.full} giờ, đi theo bạn được +${Math.round((S.PETCFG.buff-1)*100)}% EXP`}; }
  return {err:'?'}; });
