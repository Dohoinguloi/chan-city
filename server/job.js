// Map 2: đi làm ở Everfit. Tối đa 10 nhân viên, phỏng vấn 3 câu, 3 task/ngày, lương trả 3 ngày 1 lần,
// nghỉ Thứ Bảy + Chủ Nhật, 2 ngày remote làm bằng laptop ở phòng. Bỏ 3 ngày làm liền thì bị cho nghỉ việc.
'use strict';
const C=require('./core'), P=require('./places'), W=require('./world');
const crypto=require('crypto');
const {S,db,on,hook,send,now,today,near,markDirty,note,reward,give,players,byUid,kindOf}=C;
const J=S.JOB, fmt=S.fmt;
const dasBoost=p=>{ const r=p.das; return r?Math.min(S.DAS.maxBoost,r.certs.reduce((a,k)=>a+(S.DAS.courses[k]?S.DAS.courses[k].boost:0),0)):0; }, dasCerts=p=>p.das?p.das.certs.length:0;
const JOBS=Object.fromEntries(Object.entries(db.jobs()).filter(([k])=>!k.startsWith('ke:')));   // 'ke:' là nhân viên Ké Retreat (kejob.js)
const saveJob=uid=>db.saveJob(uid,JOBS[uid]||null);
const workday=d=>!S.isWeekend(d);
const isRemote=(j,d)=>j.remote.includes(S.dayOfWeek(d));
const inHours=()=>{ const h=S.vnTime().hf; return h>=J.hours[0]&&h<J.hours[1]; };
const otHours=()=>{ const h=S.vnTime().hf; return h>=J.ot.from&&h<J.ot.to; };
// văn phòng có mở cho người này không: giờ hành chính ngày thường, hoặc đúng tối có lịch OT
function officeOpen(pl){ const d=today(), j=JOBS[pl.uid]; if(workday(d)&&inHours()) return true; if(!j) return false;
  const ot=S.otTask(pl.uid,d), rec=j.days[d]; return !!ot&&otHours()&&!(rec&&rec.ot); }
function dayRec(uid,d){ const j=JOBS[uid]; if(!j.days[d]) j.days[d]={tasks:S.dailyTasks(uid,d,isRemote(j,d)),done:[]};
  for(const k of Object.keys(j.days)) if(k<S.addDays(d,-7)) delete j.days[k]; return j.days[d]; }
function jobView(pl){ const j=JOBS[pl.uid]; if(!j) return {hired:false,count:Object.keys(JOBS).length,max:J.max,open:officeOpen(pl)};
  const d=today(), wd=workday(d), rec=wd?dayRec(pl.uid,d):null;
  return {hired:true,count:Object.keys(JOBS).length,max:J.max,since:j.since,desk:j.desk,remote:j.remote,accrued:Math.round(j.accrued),nextPay:S.addDays(j.lastPay,J.payEvery),
    today:{workday:wd,remote:wd&&isRemote(j,d),tasks:rec?rec.tasks:[],done:rec?rec.done:[],inHours:inHours(),ot:S.otTask(pl.uid,d),otDone:!!(rec&&rec.ot),otHours:otHours()},miss:j.miss,open:officeOpen(pl)}; }
const tagOf=pl=>JOBS[pl.uid]?'Everfit':'';
hook('login',pl=>{ pl.tag=()=>tagOf(pl); pl.extra=()=>({job:jobView(pl)}); roll(pl); });
// trả lương 3 ngày/lần, đếm ngày bỏ làm
function roll(pl){ const j=JOBS[pl.uid]; if(!j) return; const d=today();
  let x=S.addDays(j.checked||j.since,1);
  while(x<d){ if(workday(x)){ const r=j.days[x]; if(!r||!r.done.length) j.miss++; else j.miss=0; } x=S.addDays(x,1); }
  j.checked=S.addDays(d,-1);
  if(j.miss>=J.fireAfter){ delete JOBS[pl.uid]; saveJob(pl.uid); note(pl,`Everfit: bạn đã nghỉ ${J.fireAfter} ngày làm liền không báo, công ty cho thôi việc`,'lock'); C.refreshInfo(pl); markDirty(pl); return; }
  if(d>=S.addDays(j.lastPay,J.payEvery)){ const v=Math.round(j.accrued); j.accrued=0; j.lastPay=d;
    if(v>0){ C.earn(pl,v); note(pl,`Everfit chuyển lương: +${fmt(v)}`,'vnd'); } }
  saveJob(pl.uid); markDirty(pl); }
let lastDay=today(); hook('slow',()=>{ const d=today(); if(d!==lastDay){ lastDay=d; for(const pl of players.values()) roll(pl); } });

const interviews=new Map();
on('job',(pl,m)=>{ const p=pl.prof, j=JOBS[pl.uid], t=now(), d=today();
  if(m.op==='view') return {job:jobView(pl)};
  if(m.op==='apply'){ if(!officeOpen(pl)) return {err:'Ngoài giờ làm việc, chị Vy về rồi. Ngày thường 8:00–20:00 quay lại nhé'}; if(!P.nearNpc(pl,'hr')) return {err:'Gặp chị Vy ở quầy lễ tân Everfit'}; if(j) return {err:'Bạn đang làm ở Everfit rồi'}; if(p.flags.jobQuit===d) return {err:'Hôm nay bạn vừa nghỉ việc, mai quay lại nộp hồ sơ nhé'};   // nghỉ rồi xin lại trong ngày thì việc hôm nay làm lại được → lãnh lương mãi
    if(Object.keys(JOBS).length>=J.max) return {err:`Everfit đã tuyển đủ ${J.max} người. Đợi có người nghỉ nhé`};
    if(t-(p.flags.applyAt||0)<10*60e3) return {err:'Vừa trượt phỏng vấn, 10 phút nữa nộp lại'};
    if(dasCerts(p)>=S.DAS.skipInterview){ const used=new Set(Object.values(JOBS).map(x=>x.desk)); let desk=0; while(used.has(desk)) desk++;
      JOBS[pl.uid]={name:p.name,since:d,checked:d,desk,remote:J.defaultRemote.slice(),days:{},accrued:0,lastPay:d,miss:0}; saveJob(pl.uid); C.refreshInfo(pl); markDirty(pl);
      reward(pl,{exp:20},'Chị Vy: hồ sơ DAS đẹp quá, nhận luôn không cần phỏng vấn!'); return {passed:true,skip:true,job:jobView(pl)}; }
    const ks=[...S.INTERVIEW.keys()]; for(let i=ks.length-1;i>0;i--){ const j=crypto.randomInt(i+1); [ks[i],ks[j]]=[ks[j],ks[i]]; }   // xáo đều
    const qs=ks.slice(0,S.INTERVIEW_PICK); interviews.set(pl.uid,qs);
    return {questions:qs.map(i=>({q:S.INTERVIEW[i].q,a:S.INTERVIEW[i].a,pic:S.INTERVIEW[i].pic})),pass:Math.max(3,S.INTERVIEW_PASS-dasCerts(p))}; }
  if(m.op==='answer'){ const qs=interviews.get(pl.uid); if(!qs) return {err:'Chưa phỏng vấn'}; interviews.delete(pl.uid);
    const ans=Array.isArray(m.answers)?m.answers:[], ok=qs.filter((q,i)=>S.INTERVIEW[q].ok===(ans[i]|0)).length;
    if(ok<Math.max(3,S.INTERVIEW_PASS-dasCerts(p))){ p.flags.applyAt=t; markDirty(pl); return {passed:false,ok,total:qs.length}; }
    if(Object.keys(JOBS).length>=J.max) return {err:'Vừa có người nhận mất suất cuối'};
    const used=new Set(Object.values(JOBS).map(x=>x.desk)); let desk=0; while(used.has(desk)) desk++;
    JOBS[pl.uid]={name:p.name,since:d,checked:d,desk,remote:J.defaultRemote.slice(),days:{},accrued:0,lastPay:d,miss:0}; saveJob(pl.uid);
    C.refreshInfo(pl); markDirty(pl); reward(pl,{exp:20},'Chào mừng bạn tới Everfit!'); return {passed:true,ok,total:qs.length,job:jobView(pl)}; }
  if(!j) return {err:'Bạn chưa làm ở Everfit'};
  if(m.op==='remote'){ if(!P.nearNpc(pl,'hr')) return {err:'Đổi lịch remote ở quầy HR'};
    const days=[...new Set((m.days||[]).map(x=>x|0))].filter(x=>x>=1&&x<=5); if(days.length!==2) return {err:'Chọn đúng 2 ngày từ Thứ Hai tới Thứ Sáu'};
    j.remote=days.sort(); const rec=j.days[d]; if(rec&&!rec.done.length) delete j.days[d]; saveJob(pl.uid); markDirty(pl); return {job:jobView(pl)}; }
  if(m.op==='quit'){ p.flags.jobQuit=d; if(j.accrued>0) give(pl,Math.round(j.accrued)); delete JOBS[pl.uid]; saveJob(pl.uid); C.refreshInfo(pl); markDirty(pl); return {msg:'Đã nghỉ việc ở Everfit'}; }
  if(m.op==='do'){ const task=String(m.task||''), def=S.WORK_TASKS[task], rec=workday(d)?dayRec(pl.uid,d):null, ot=S.otTask(pl.uid,d);
    // task OT buổi tối: làm ở văn phòng, lương ×1,5
    if(m.ot){ if(!ot||task!==ot) return {err:'Tối nay bạn không có lịch OT'}; if(!otHours()) return {err:`OT từ ${J.ot.from}:00 tới ${J.ot.to}:00`}; if(rec.ot) return {err:'Xong OT rồi, về nghỉ đi'};
      if(pl.scene!=='everfit'||!near(pl,S.OFFICE.desks[j.desk][0],S.OFFICE.desks[j.desk][1],36)) return {err:'Về bàn làm việc của bạn'};
      return P.startTask(pl,'work',def.dur,()=>{ rec.ot=true; j.accrued+=J.wage*(1+dasBoost(pl.prof))/J.tasksPerDay*J.ot.pay; reward(pl,{exp:Math.round(def.exp*1.5)},'Xong OT: '+def.name+' (lương ×1,5)'); saveJob(pl.uid); markDirty(pl); return {task}; },{anim:'work',name:'OT: '+def.name}); }
    if(!workday(d)) return {err:'Cuối tuần nghỉ, đi chơi đi!'}; if(!inHours()) return {err:`Giờ làm từ ${J.hours[0]}:00 tới ${J.hours[1]}:00`};
    if(!def||!rec.tasks.includes(task)) return {err:'Sếp không giao việc này hôm nay'};
    if(rec.done.includes(task)) return {err:'Xong việc này rồi'};
    const remote=isRemote(j,d);
    if(remote){ if(!W.inOwnRoom(pl)) return {err:'Hôm nay làm remote: mở laptop ở phòng của bạn'}; }
    else { if(pl.scene!=='everfit') return {err:'Hôm nay làm ở văn phòng Everfit'};
      const at=def.where==='desk'?{x:S.OFFICE.desks[j.desk][0],y:S.OFFICE.desks[j.desk][1]}:S.OFFICE.spots[def.where];
      if(!near(pl,at.x,at.y,36)) return {err:def.where==='desk'?'Về bàn làm việc của bạn':'Ra '+S.OFFICE.spots[def.where].name}; }
    return P.startTask(pl,'work',def.dur,()=>{ if(rec.done.includes(task)) return {}; rec.done.push(task); if(rec.tasks&&rec.done.length===rec.tasks.length) P.stat(pl,'everfit',1);   /* đủ việc 1 ngày Everfit */ j.accrued+=J.wage*(1+dasBoost(pl.prof))/J.tasksPerDay;
      reward(pl,{exp:def.exp},'Xong: '+def.name);
      if(rec.done.length===rec.tasks.length) reward(pl,{exp:J.bonusExp},'Sếp khen: hôm nay làm tốt lắm!');
      saveJob(pl.uid); markDirty(pl); return {task}; },{anim:'work',name:def.name}); }
  return {err:'?'}; });

// quyền lợi văn phòng (ai tới Everfit cũng dùng được, mỗi ngày 1 lần)
on('perk',(pl,m)=>{ const k=String(m.k||''), P=S.OFFICE_PERKS[k], p=pl.prof; if(!P) return {err:'?'}; if(pl.scene!=='everfit') return {err:'Ở văn phòng Everfit mới có'};
  const at=k==='coffee'?S.OFFICE.spots.pantry:{x:22,y:13.8}; if(!near(pl,at.x,at.y,44)) return {err:'Lại gần đã'};
  p.daily.perks=p.daily.perks||{}; if(p.daily.perks[k]) return {err:'Hôm nay dùng rồi'}; p.daily.perks[k]=true;
  if(P.buff) p.buff={mul:P.buff.mul,until:now()+P.buff.min*60e3}; p.needs.energy=Math.min(100,p.needs.energy+P.energy); markDirty(pl);
  return {msg:k==='coffee'?`Cà phê pantry: +${P.energy} năng lượng, +${Math.round((P.buff.mul-1)*100)}% EXP ${P.buff.min} phút`:`Ngả lưng ở sofa: +${P.energy} năng lượng`}; });
// reset server (reset.js): dọn dữ liệu trong bộ nhớ của các tài khoản bị reset
hook('reset',gone=>{ for(const uid of Object.keys(JOBS)) if(gone(uid)){ delete JOBS[uid]; saveJob(uid); } });   /* nhân viên Everfit */
module.exports={JOBS,jobView,officeOpen};
