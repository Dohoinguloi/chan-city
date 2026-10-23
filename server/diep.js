// Phòng của Diệp (Hà Nội): chỉ tiếp người cấp cao, trong người nhiều tiền (kiểm tra lúc gọi Grab sang); đang ở mà tiền tụt dưới mức thì Diệp đuổi về phòng.
// Ngồi vào bàn nhờ Diệp nấu: EXP theo tiền đang có (expK × √số triệu, tối đa expMax), +năng lượng, tính là 1 bữa; mỗi ngày tối đa 2 lần.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,hook,now,today,near,markDirty,reward,note,moveTo,players}=C;
const D=S.DIEP, K=D.cook, fmt=S.fmt;
const canVisit=p=>p.level<D.level?`Diệp chỉ tiếp khách từ cấp ${D.level} (bạn cấp ${p.level})`:p.money<D.money?`Diệp chỉ tiếp người trong người có ít nhất ${fmt(D.money)} (bạn có ${fmt(p.money)})`:'';
const kickOut=pl=>{ note(pl,`Diệp: "Ít tiền thế này mà cũng sang chơi à? Về đi!" (dưới ${fmt(D.kick)} là bị đuổi)`,'lock'); C.send(pl,{t:'ev',k:'diepKick'}); moveTo(pl,'room:'+pl.uid,S.ROOMS.tro.spawn.x,S.ROOMS.tro.spawn.y); };
hook('slow',()=>{ for(const pl of players.values()) if(pl.scene==='diep'&&pl.prof.money<D.kick) kickOut(pl); });
on('diep',(pl,m)=>{ const p=pl.prof, d=today(); if(pl.scene!=='diep') return {err:'Sang phòng Diệp đã (gọi Grab)'};
  if(m.op==='cook'){ if(!near(pl,D.seat.x,D.seat.y,40)) return {err:'Ngồi vào bàn ăn đã'}; if(p.money<D.kick){ kickOut(pl); return {err:'Bị Diệp đuổi về'}; }
    const r=p.diep=p.diep&&p.diep.day===d?p.diep:{day:d,n:0}; if(r.n>=K.daily) return {err:`Diệp: "Hôm nay nấu cho bạn ${K.daily} bữa rồi, mai sang nhé"`};
    const dish=D.dishes[Math.floor(Math.random()*D.dishes.length)];
    return P.startTask(pl,'diep',K.dur,()=>{ if(pl.scene!=='diep') return {msg:'Đi mất rồi, Diệp cất đồ ăn vào tủ lạnh'};
      const exp=Math.min(K.expMax,Math.round(K.expK*Math.sqrt(Math.max(0,p.money)/1e6))); r.n++; if(r.n===2) P.stat(pl,'diepDays',1);   /* ăn đủ 2 bữa nhà Diệp trong ngày */
      const st=S.mealStatus(p.meals), slot=st.find(s=>s.st==='now')||st.find(s=>s.st==='missed'); if(slot){ if(p.meals.day!==d) p.meals={day:d,eaten:{}}; if(!p.meals.eaten[slot.id]) C.track(pl,'meal'); p.meals.eaten[slot.id]=true; }
      p.needs.energy=Math.min(100,p.needs.energy+K.energy); reward(pl,{exp},`Diệp nấu ${dish}: ngon quá! +${exp} EXP (trong người có ${fmt(p.money)})`); markDirty(pl);
      return {msg:`Ăn xong ${dish} · ${r.n}/${K.daily} bữa hôm nay`}; },{name:'Diệp đang nấu '+dish}); }
  return {err:'?'}; });
module.exports={canVisit};
