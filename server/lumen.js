// Lumen Studio (Hà Nội): ứng tuyển ở lễ tân (≥4 chứng chỉ DAS + cấp 3). Mỗi ngày tối đa 4 việc, làm ở bàn trong studio
// hoặc remote bằng laptop ở phòng; EXP gấp 4 lần việc thường, trả công từng việc. Phòng nghỉ trưa + cà phê: mỗi thứ 1 lần/ngày.
'use strict';
const C=require('./core'), P=require('./places'), W=require('./world'), DAS=require('./das');
const {S,on,now,today,near,markDirty,reward}=C;
const L=S.LUMEN, fmt=S.fmt;
const rec=p=>{ const r=p.lumen=p.lumen||{hired:false,since:'',day:'',done:[]}, d=today(); if(r.day!==d){ r.day=d; r.done=[]; } return r; };
on('lumen',(pl,m)=>{ const p=pl.prof, r=rec(p), d=today(), inStudio=pl.scene==='lumen';
  if(m.op==='view') return {lumen:{hired:r.hired,done:r.done,certs:DAS.certs(p)}};
  if(m.op==='scholar'){ if(!P.nearNpc(pl,'lumen_le')) return {err:'Gặp Annie ở quầy lễ tân Lumen'}; if(r.hired) return {err:'Bạn đã là thành viên Lumen rồi'}; if(r.scholar) return {err:'Bạn đã nhận học bổng rồi'};
    r.scholar={free:L.scholar.free,half:L.scholar.half,done:false}; markDirty(pl);
    return {msg:`Annie: "Bay vào DAS học đủ ${L.needCerts} chứng chỉ nha! ${L.scholar.free} khoá đầu Lumen trả hết, ${L.scholar.half} khoá sau giảm 50%."`}; }
  if(m.op==='apply'){ if(!P.nearNpc(pl,'lumen_le')) return {err:'Ứng tuyển ở quầy lễ tân Lumen Studio'}; if(r.hired) return {err:'Bạn đã là thành viên Lumen rồi'};
    const n=DAS.certs(p); if(n<L.needCerts) return {err:`Lumen cần ít nhất ${L.needCerts} chứng chỉ DAS (bạn có ${n}). Bay vào DAS (TP.HCM) học thêm`};
    if(p.level<L.level) return {err:`Lumen nhận từ cấp ${L.level}`}; r.hired=true; r.since=d;
    if(r.scholar&&!r.scholar.done){ r.scholar.done=true; reward(pl,L.scholar.reward,'Hoàn thành học bổng Lumen của Annie'); } markDirty(pl);
    return {msg:`Chào mừng tới Lumen Studio! Làm ở bàn trong studio hoặc remote bằng laptop ở phòng · EXP ×${L.expMul}`}; }
  if(m.op==='quit'){ if(!r.hired) return {err:'Bạn chưa làm ở Lumen'}; r.hired=false; markDirty(pl); return {msg:'Đã rời Lumen Studio'}; }
  if(m.op==='do'){ const k=String(m.task||''), t=L.tasks[k]; if(!t) return {err:'?'}; if(!r.hired) return {err:'Chưa là thành viên Lumen. Ứng tuyển ở lễ tân Lumen Studio'};
    if(r.done.includes(k)) return {err:'Hôm nay làm việc này rồi'}; if(r.done.length>=L.daily) return {err:`Hôm nay làm đủ ${L.daily} việc rồi, mai làm tiếp`};
    const atDesk=inStudio&&L.desks.some(([x,y])=>near(pl,x,y,36)); if(!atDesk&&!W.inOwnRoom(pl)) return {err:'Ngồi vào bàn ở Lumen Studio, hoặc mở laptop ở phòng của bạn để làm remote'};
    return P.startTask(pl,'work',t.dur,()=>{ if(r.done.includes(k)) return {}; r.done.push(k); reward(pl,{exp:t.exp*L.expMul,vnd:L.pay},`Lumen: xong ${t.name} (EXP ×${L.expMul}${atDesk?'':' · remote'})`); markDirty(pl); return {task:k}; },
      {anim:'work',name:'Lumen · '+t.name}); }
  if(m.op==='nap'||m.op==='coffee'){ const s=L[m.op]; if(!inStudio||!near(pl,s.x,s.y,40)) return {err:m.op==='nap'?'Vào phòng nghỉ trưa đã':'Lại máy pha cà phê ở pantry'};
    const k='lumen_'+m.op; if(p.daily[k]) return {err:'Hôm nay dùng rồi, mai nhé'}; p.daily[k]=true;
    p.needs.energy=Math.min(100,p.needs.energy+s.energy); if(s.buff) p.buff={mul:s.buff.mul,until:now()+s.buff.min*60e3}; markDirty(pl);
    return {msg:m.op==='nap'?`Ngả lưng 1 lát: +${s.energy} năng lượng`:`Cà phê lạnh Lumen: +${s.energy} năng lượng, +${Math.round((s.buff.mul-1)*100)}% EXP ${s.buff.min} phút`}; }
  return {err:'?'}; });
