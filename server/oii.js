// Ộ i i: nhặt khô gà đè tem ở mọi map; hút shisha cùng Ộ i i ở Nhà giải trí, người khác cùng phòng chụp ảnh báo công an được.
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,on,now,near,kindOf,markDirty,send,note,give,addItem,moveTo,players,broadcastScene}=C;
const O=S.OII, H=S.SHISHA, R=H.report, fmt=S.fmt;
on('khoga',(pl,m)=>{ const p=pl.prof, i=m.i|0, s=O.khoga[i]; if(!s||p.quests.khoga!=='active') return {err:'Chưa nhận việc của Ộ i i'};
  const got=p.flags.khoga=p.flags.khoga||{}; if(got[i]) return {err:'Gói này nhặt rồi'};
  if(kindOf(pl.scene)!==s.scene||!near(pl,s.x,s.y,32)) return {err:'Xa quá'}; got[i]=true; addItem(pl,'khoga'); markDirty(pl); return {item:'khoga',n:p.items.khoga||0}; });
on('shisha',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='report'){ const v=players.get(m.id|0); if(!v||v===pl||v.scene!==pl.scene||!v.shisha||t>v.shisha.until) return {err:'Không thấy ai đang hút shisha'};
    if(v.shisha.reported) return {err:'Đã có người báo rồi'}; if(pl.reportAt&&t-pl.reportAt<R.cd*1000) return {err:'Đợi chút rồi hãy báo tiếp'};
    pl.reportAt=t; v.shisha.reported=true;
    if(Math.random()>=R.chance){ note(v,`📸 ${p.name} chụp ảnh báo công an, may mà công an tới không bắt được!`,'lock'); return {msg:'Đã gửi ảnh cho công an, nhưng lần này họ không xử lý'}; }
    const vp=v.prof, jf=C.fineOf(v,R.fine); vp.jail={until:t+R.jail*1000,fine:jf,why:'Hút shisha ở Nhà giải trí (bị chụp ảnh tố giác)'}; v.shisha=null; v.task=null; send(v,{t:'task',cancel:true}); markDirty(v); P.stat(v,'jail',1);
    broadcastScene(pl.scene,{t:'ev',k:'shishaBust',id:v.pid,name:vp.name,by:p.name}); moveTo(v,'doncongan',7,6);
    note(v,`🚓 Bị ${p.name} chụp ảnh báo công an! Tạm giữ ${R.jail} giây, nộp ${fmt(jf)} để về sớm`,'lock'); give(pl,R.bounty);
    return {msg:`Công an đã tới bắt ${vp.name}. Thưởng tố giác ${fmt(R.bounty)}`}; }
  if(kindOf(pl.scene)!=='club'||!near(pl,H.seat.x,H.seat.y,40)) return {err:'Ngồi vào đệm ở góc shisha đã'};
  if(pl.task) return {err:'Đang làm việc khác'}; if(!shopPay(pl,H.price)) return {err:`Cần ${fmt(H.price)} gọi bình shisha`};
  const others=[...players.values()].filter(o=>o!==pl&&o.scene===pl.scene).length;
  pl.shisha={until:t+(H.dur+2)*1000};
  const r=P.startTask(pl,'shisha',H.dur,()=>{ pl.shisha=null; const q=p.qprog=p.qprog||{}; if(p.quests.shisha==='active') q.shisha=(q.shisha||0)+1; markDirty(pl);
    return {msg:'Phê... Ộ i i: "Thôi em đừng có chối"'}; },{anim:'shisha',name:'Hút shisha cùng Ộ i i'});
  if(r.err){ give(pl,H.price); return r; } return {...r,others}; });
