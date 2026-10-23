// 120 Yên Lãng · nhà anh Độ: mua phở chị Thảo (ngõ phố Đà Bắc), lau mô hình Hulkbuster, gọi Ộ i i về ăn cơm, lên sóng cùng anh Độ buổi tối (1 lần/ngày).
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,on,now,near,markDirty,reward,take,has,addItem}=C;
const Y=S.YENLANG, fmt=S.fmt;
on('yl',(pl,m)=>{ const p=pl.prof, q=p.qprog=p.qprog||{};
  if(m.op==='pho'){ if(p.quests.pho!=='active') return {err:'Chị Thảo: "Hôm nay bán hết rồi em ơi!"'}; if(pl.scene!=='retreat'||!near(pl,Y.pho.x,Y.pho.y,40)) return {err:'Tìm đúng quán đã'};
    if(has(pl,'pho_thao')) return {err:'Mua rồi, mang về cho anh Độ đi'}; if(!shopPay(pl,Y.pho.price)) return {err:`Bát phở ${fmt(Y.pho.price)}, không đủ tiền`};
    addItem(pl,'pho_thao'); markDirty(pl); return {msg:'Chị Thảo: "Phở nóng đây, mang về cho thằng Độ nhé!"'}; }
  if(m.op==='lau'){ const need=S.QUESTS.hulk.prog; if(pl.scene!=='yenlang'||!near(pl,Y.hulk.x,Y.hulk.y,44)) return {err:'Lại gần mô hình Hulkbuster đã'};
    if(p.quests.hulk!=='active') return {err:'Anh Độ: "Đừng động vào, xước sơn là toang!"'}; if((q.hulk||0)>=need) return {err:'Lau sạch bóng rồi, báo anh Độ đi'};
    return P.startTask(pl,'work',Y.lau.dur,()=>{ q.hulk=(q.hulk||0)+1; markDirty(pl); return {msg:`Lau xong lượt ${q.hulk}/${need} (${['đầu','thân','chân'][q.hulk-1]||'thêm'})`}; },{anim:'work',name:'Lau mô hình Hulkbuster'}); }
  if(m.op==='goioii'){ if(p.quests.goioii!=='active') return {err:'?'}; if(pl.scene==='yenlang') return {err:'Ộ i i đang ở nhà rồi'};
    if(q.goioii) return {msg:'Ộ i i: "Biết rồi, về liền!"'}; q.goioii=1; markDirty(pl); return {msg:'Ộ i i: "Anh Độ gọi hả? Về liền, về liền!"'}; }
  if(m.op==='flatter'){ if(!require('./places').nearNpc(pl,'qnt')) return {err:'Lại gần QNT đã'}; if(p.daily.qnt) return {err:'QNT: "Hôm nay khen hết lời rồi, mai khen tiếp!"'};   // QNT nịnh: buff EXP nhỏ 1 lần/ngày
    const F=Y.flatter; p.daily.qnt=true; p.buff={mul:F.buff.mul,until:now()+F.buff.min*60e3}; p.needs.energy=Math.min(100,p.needs.energy+F.energy); markDirty(pl);
    return {msg:`QNT: "${F.lines[Math.floor(Math.random()*F.lines.length)]}" · +${Math.round((F.buff.mul-1)*100)}% EXP ${F.buff.min} phút, +${F.energy} năng lượng`}; }
  if(m.op==='stream'){ const h=S.vnTime(now()).hf, live=h>=Y.stream.from||h<Y.stream.to; if(!live) return {err:`Anh Độ lên sóng từ ${Y.stream.from}:00 tới ${Y.stream.to}:00, tối quay lại nhé`};
    if(pl.scene!=='yenlang'||!near(pl,Y.guest.x,Y.guest.y,32)) return {err:'Ngồi vào ghế khách cạnh bàn stream đã'}; if(p.daily.ylstream) return {err:'Hôm nay lên sóng rồi, mai quay lại'};
    return P.startTask(pl,'work',Y.stream.dur,()=>{ p.daily.ylstream=true; P.stat(pl,'stream',1); reward(pl,{exp:Y.stream.exp,vnd:Y.stream.vnd},'Lên sóng cùng anh Độ: người xem donate'); markDirty(pl); return {}; },{anim:'work',name:'Lên sóng cùng anh Độ'}); }
  return {err:'?'}; });
