// Lumen Studio (Hà Nội): ứng tuyển ở lễ tân (≥4 chứng chỉ DAS + cấp 3). Mỗi ngày tối đa 4 việc, làm ở bàn trong studio
// hoặc remote bằng laptop ở phòng; EXP gấp 4 lần việc thường, trả công từng việc. Phòng nghỉ trưa + cà phê: mỗi thứ 1 lần/ngày.
'use strict';
const C=require('./core'), P=require('./places'), W=require('./world'), DAS=require('./das');
const {S,on,now,today,near,markDirty,reward}=C;
const L=S.LUMEN, fmt=S.fmt;
const rec=p=>{ const r=p.lumen=p.lumen||{hired:false,since:'',day:'',done:[]}, d=today(); if(r.day!==d){ r.day=d; r.done=[]; } return r; };
// Leno xin tiền chị Annie (LUMEN.annieAsk): xin → Annie giao 1 việc vặt → làm đúng chỗ → quay lại lễ tân nhận tiền. Mỗi ngày 1 lần
const ASK=L.annieAsk, asker=pl=>ASK.who.includes(pl.uid);
C.hook('login',pl=>{ const p=pl.prof, v=asker(pl); if(!!p.flags.annieAsk!==v){ p.flags.annieAsk=v; markDirty(pl); }
  if(v&&p.money<100000&&!(p.daily.annie&&p.daily.annie.paid)) setTimeout(()=>{ if(pl.prof) C.note(pl,'Hết tiền rồi hả? Về Lumen Studio (Hà Nội) xin chị Annie đi!','quest'); },4000); });
function annie(pl,m,inStudio){ const p=pl.prof, a=p.daily.annie=p.daily.annie||{}; if(!asker(pl)) return {err:'?'};
  if(a.paid) return {err:'Annie: "Hôm nay chị cho rồi mà! Mai hẵng quay lại nhé"'};
  if(m.op==='ask'){ if(!P.nearNpc(pl,'lumen_le')) return {err:'Về quầy lễ tân Lumen gặp chị Annie'};
    if(a.job) return {err:a.done?'Làm xong rồi thì bấm nhận tiền đi':'Làm xong việc chị giao đã: '+ASK.jobs[a.job].name};
    const ks=Object.keys(ASK.jobs), k=ks[Math.floor(Math.random()*ks.length)]; a.job=k; a.done=false; markDirty(pl);
    return {job:k,msg:`Annie: "Lại hết tiền rồi hả Leno? Chị cho, nhưng trước tiên ${ASK.jobs[k].ask}"`}; }
  if(m.op==='askdo'){ const j=ASK.jobs[a.job]; if(!j) return {err:'Xin chị Annie ở lễ tân trước đã'}; if(a.done) return {err:'Xong rồi, về lễ tân nhận tiền thôi'};
    const at=j.at==='desk'?L.desks.some(([x,y])=>near(pl,x,y,36)):near(pl,L[j.at].x,L[j.at].y,40); if(!inStudio||!at) return {err:'Tới đúng chỗ: '+j.where};
    return P.startTask(pl,'work',j.dur,()=>{ a.done=true; markDirty(pl); return {msg:'Xong việc chị Annie giao! Về quầy lễ tân xin tiền thôi'}; },{anim:'work',name:'Việc chị Annie: '+j.name}); }
  if(!P.nearNpc(pl,'lumen_le')) return {err:'Về quầy lễ tân gặp chị Annie'}; if(!a.done) return {err:'Làm xong việc chị giao đã'};
  const [lo,hi]=ASK.pay, amt=Math.round((lo+Math.random()*(hi-lo))/10000)*10000; a.paid=true;
  reward(pl,{exp:ASK.exp,vnd:amt},'Chị Annie cho tiền'); markDirty(pl);
  return {msg:`Annie: "${ASK.lines[Math.floor(Math.random()*ASK.lines.length)]}" (+${fmt(amt)})`,vnd:amt}; }
on('lumen',(pl,m)=>{ const p=pl.prof, r=rec(p), d=today(), inStudio=pl.scene==='lumen';
  if(m.op==='ask'||m.op==='askdo'||m.op==='askpay') return annie(pl,m,inStudio);
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
    return P.startTask(pl,'work',t.dur,()=>{ if(r.done.includes(k)) return {}; r.done.push(k); if(r.done.length===L.daily) P.stat(pl,'lumen',1); reward(pl,{exp:t.exp*L.expMul,vnd:L.pay},`Lumen: xong ${t.name} (EXP ×${L.expMul}${atDesk?'':' · remote'})`); markDirty(pl); return {task:k}; },
      {anim:'work',name:'Lumen · '+t.name}); }
  if(m.op==='nap'||m.op==='coffee'){ const s=L[m.op]; if(!inStudio||!near(pl,s.x,s.y,40)) return {err:m.op==='nap'?'Vào phòng nghỉ trưa đã':'Lại máy pha cà phê ở pantry'};
    const k='lumen_'+m.op; if(p.daily[k]) return {err:'Hôm nay dùng rồi, mai nhé'}; p.daily[k]=true;
    p.needs.energy=Math.min(100,p.needs.energy+s.energy); if(s.buff) p.buff={mul:s.buff.mul,until:now()+s.buff.min*60e3}; markDirty(pl);
    return {msg:m.op==='nap'?`Ngả lưng 1 lát: +${s.energy} năng lượng`:`Cà phê lạnh Lumen: +${s.energy} năng lượng, +${Math.round((s.buff.mul-1)*100)}% EXP ${s.buff.min} phút`}; }
  return {err:'?'}; });
