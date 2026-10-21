// Map 2: đi làm ở Everfit. Tối đa 10 nhân viên, phỏng vấn 3 câu, 3 task/ngày, lương trả 3 ngày 1 lần,
// nghỉ Thứ Bảy + Chủ Nhật, 2 ngày remote làm bằng laptop ở phòng. Bỏ 3 ngày làm liền thì bị cho nghỉ việc.
'use strict';
const C=require('./core'), P=require('./places'), W=require('./world');
const crypto=require('crypto');
const {S,db,on,hook,send,now,today,near,markDirty,note,reward,give,players,byUid,kindOf}=C;
const J=S.JOB, fmt=S.fmt;
const JOBS=db.jobs();
const saveJob=uid=>db.saveJob(uid,JOBS[uid]||null);
const workday=d=>!S.isWeekend(d);
const isRemote=(j,d)=>j.remote.includes(S.dayOfWeek(d));
const inHours=()=>{ const h=S.vnTime().hf; return h>=J.hours[0]&&h<J.hours[1]; };
function dayRec(uid,d){ const j=JOBS[uid]; if(!j.days[d]) j.days[d]={tasks:S.dailyTasks(uid,d,isRemote(j,d)),done:[]};
  for(const k of Object.keys(j.days)) if(k<S.addDays(d,-7)) delete j.days[k]; return j.days[d]; }
function jobView(pl){ const j=JOBS[pl.uid]; if(!j) return {hired:false,count:Object.keys(JOBS).length,max:J.max};
  const d=today(), wd=workday(d), rec=wd?dayRec(pl.uid,d):null;
  return {hired:true,count:Object.keys(JOBS).length,max:J.max,since:j.since,desk:j.desk,remote:j.remote,accrued:Math.round(j.accrued),nextPay:S.addDays(j.lastPay,J.payEvery),
    today:{workday:wd,remote:wd&&isRemote(j,d),tasks:rec?rec.tasks:[],done:rec?rec.done:[],inHours:inHours()},miss:j.miss}; }
const tagOf=pl=>JOBS[pl.uid]?'Everfit':'';
hook('login',pl=>{ pl.tag=()=>tagOf(pl); pl.extra=()=>({job:jobView(pl)}); roll(pl); });
// trả lương 3 ngày/lần, đếm ngày bỏ làm
function roll(pl){ const j=JOBS[pl.uid]; if(!j) return; const d=today();
  let x=S.addDays(j.checked||j.since,1);
  while(x<d){ if(workday(x)){ const r=j.days[x]; if(!r||!r.done.length) j.miss++; else j.miss=0; } x=S.addDays(x,1); }
  j.checked=S.addDays(d,-1);
  if(j.miss>=J.fireAfter){ delete JOBS[pl.uid]; saveJob(pl.uid); note(pl,`Everfit: bạn đã nghỉ ${J.fireAfter} ngày làm liền không báo, công ty cho thôi việc`,'lock'); C.refreshInfo(pl); markDirty(pl); return; }
  if(d>=S.addDays(j.lastPay,J.payEvery)){ const v=Math.round(j.accrued); j.accrued=0; j.lastPay=d;
    if(v>0){ give(pl,v); note(pl,`Everfit chuyển lương: +${fmt(v)}`,'vnd'); } }
  saveJob(pl.uid); markDirty(pl); }
let lastDay=today(); hook('slow',()=>{ const d=today(); if(d!==lastDay){ lastDay=d; for(const pl of players.values()) roll(pl); } });

const interviews=new Map();
on('job',(pl,m)=>{ const p=pl.prof, j=JOBS[pl.uid], t=now(), d=today();
  if(m.op==='view') return {job:jobView(pl)};
  if(m.op==='apply'){ if(!P.nearNpc(pl,'hr')) return {err:'Gặp chị Vy ở quầy lễ tân Everfit'}; if(j) return {err:'Bạn đang làm ở Everfit rồi'};
    if(Object.keys(JOBS).length>=J.max) return {err:`Everfit đã tuyển đủ ${J.max} người. Đợi có người nghỉ nhé`};
    if(t-(p.flags.applyAt||0)<10*60e3) return {err:'Vừa trượt phỏng vấn, 10 phút nữa nộp lại'};
    const qs=[...S.INTERVIEW.keys()].sort(()=>crypto.randomInt(3)-1).slice(0,3); interviews.set(pl.uid,qs);
    return {questions:qs.map(i=>({q:S.INTERVIEW[i].q,a:S.INTERVIEW[i].a}))}; }
  if(m.op==='answer'){ const qs=interviews.get(pl.uid); if(!qs) return {err:'Chưa phỏng vấn'}; interviews.delete(pl.uid);
    const ans=Array.isArray(m.answers)?m.answers:[], ok=qs.filter((q,i)=>S.INTERVIEW[q].ok===(ans[i]|0)).length;
    if(ok<2){ p.flags.applyAt=t; markDirty(pl); return {passed:false,ok}; }
    if(Object.keys(JOBS).length>=J.max) return {err:'Vừa có người nhận mất suất cuối'};
    const used=new Set(Object.values(JOBS).map(x=>x.desk)); let desk=0; while(used.has(desk)) desk++;
    JOBS[pl.uid]={name:p.name,since:d,checked:d,desk,remote:J.defaultRemote.slice(),days:{},accrued:0,lastPay:d,miss:0}; saveJob(pl.uid);
    C.refreshInfo(pl); markDirty(pl); reward(pl,{exp:20},'Chào mừng bạn tới Everfit!'); return {passed:true,ok,job:jobView(pl)}; }
  if(!j) return {err:'Bạn chưa làm ở Everfit'};
  if(m.op==='remote'){ if(!P.nearNpc(pl,'hr')) return {err:'Đổi lịch remote ở quầy HR'};
    const days=[...new Set((m.days||[]).map(x=>x|0))].filter(x=>x>=1&&x<=5); if(days.length!==2) return {err:'Chọn đúng 2 ngày từ Thứ Hai tới Thứ Sáu'};
    j.remote=days.sort(); const rec=j.days[d]; if(rec&&!rec.done.length) delete j.days[d]; saveJob(pl.uid); markDirty(pl); return {job:jobView(pl)}; }
  if(m.op==='quit'){ if(j.accrued>0) give(pl,Math.round(j.accrued)); delete JOBS[pl.uid]; saveJob(pl.uid); C.refreshInfo(pl); markDirty(pl); return {msg:'Đã nghỉ việc ở Everfit'}; }
  if(m.op==='do'){ if(!workday(d)) return {err:'Cuối tuần nghỉ, đi chơi đi!'}; if(!inHours()) return {err:`Giờ làm từ ${J.hours[0]}:00 tới ${J.hours[1]}:00`};
    const rec=dayRec(pl.uid,d), task=String(m.task||''), def=S.WORK_TASKS[task]; if(!def||!rec.tasks.includes(task)) return {err:'Sếp không giao việc này hôm nay'};
    if(rec.done.includes(task)) return {err:'Xong việc này rồi'};
    const remote=isRemote(j,d);
    if(remote){ if(!W.inOwnRoom(pl)) return {err:'Hôm nay làm remote: mở laptop ở phòng của bạn'}; }
    else { if(pl.scene!=='everfit') return {err:'Hôm nay làm ở văn phòng Everfit'};
      const at=def.where==='desk'?{x:S.OFFICE.desks[j.desk][0],y:S.OFFICE.desks[j.desk][1]}:S.OFFICE.spots[def.where];
      if(!near(pl,at.x,at.y,36)) return {err:def.where==='desk'?'Về bàn làm việc của bạn':'Ra '+S.OFFICE.spots[def.where].name}; }
    return P.startTask(pl,'work',def.dur,()=>{ if(rec.done.includes(task)) return {}; rec.done.push(task); j.accrued+=J.wage/J.tasksPerDay;
      reward(pl,{exp:def.exp},'Xong: '+def.name);
      if(rec.done.length===rec.tasks.length) reward(pl,{exp:J.bonusExp},'Sếp khen: hôm nay làm tốt lắm!');
      saveJob(pl.uid); markDirty(pl); return {task}; },{anim:'work',name:def.name}); }
  return {err:'?'}; });

module.exports={JOBS,jobView};
