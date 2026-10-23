// Nhân viên Ké Retreat: xin cô Ké (chủ tiệm Ké Retreat), tối đa 3 người. Mỗi ngày 3 việc ở khắp Ké,
// xong việc nào trả lương việc đó; được ở Nhà Ngủ miễn phí; bỏ 3 ngày liền không làm thì cho nghỉ.
'use strict';
const C=require('./core'), P=require('./places');
const {S,db,on,hook,now,today,near,markDirty,note,reward,give,players}=C;
const K=S.KE_JOB, fmt=S.fmt, key=uid=>'ke:'+uid;
const STAFF={}; for(const [k,v] of Object.entries(db.jobs())) if(k.startsWith('ke:')) STAFF[k.slice(3)]=v;
const saveStaff=uid=>db.saveJob(key(uid),STAFF[uid]||null);
function tasksFor(uid,d){ let h=2166136261; for(const ch of 'ke'+uid+d){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } const pool=Object.keys(K.tasks), out=[];
  while(out.length<K.perDay&&pool.length){ h=Math.imul(h^(h>>>15),2246822507)>>>0; out.push(pool.splice(h%pool.length,1)[0]); } return out; }
function rec(uid){ const s=STAFF[uid], d=today(); if(!s.days[d]) s.days[d]={tasks:tasksFor(uid,d),done:[]}; for(const k of Object.keys(s.days)) if(k<S.addDays(d,-5)) delete s.days[k]; return s.days[d]; }
function view(pl){ const s=STAFF[pl.uid]; if(!s) return {staff:false,count:Object.keys(STAFF).length,max:K.max}; const r=rec(pl.uid); return {staff:true,count:Object.keys(STAFF).length,max:K.max,since:s.since,today:r}; }
// phòng miễn phí + đếm ngày bỏ việc
function roll(pl){ const s=STAFF[pl.uid], p=pl.prof, d=today(); if(!s){ if(p.stay&&p.stay.staff){ p.stay=null; markDirty(pl); } return; }
  let x=S.addDays(s.checked||s.since,1); while(x<d){ const r=s.days[x]; if(!r||!r.done.length) s.miss++; else s.miss=0; x=S.addDays(x,1); } s.checked=S.addDays(d,-1);
  if(s.miss>=K.fireAfter){ delete STAFF[pl.uid]; saveStaff(pl.uid); if(p.stay&&p.stay.staff) p.stay=null; markDirty(pl); note(pl,'Cô Ké: cháu bỏ việc 3 ngày liền rồi, cô phải tìm người khác','lock'); return; }
  if(!p.stay||(p.stay.staff&&p.stay.paid!==d)){ p.stay={room:K.room,paid:d,since:s.since,staff:true}; markDirty(pl); }
  saveStaff(pl.uid); }
hook('login',pl=>{ const ex=pl.extra; pl.extra=()=>({...(ex?ex():{}),ke:view(pl)}); roll(pl); });
let lastDay=today(); hook('slow',()=>{ const d=today(); if(d!==lastDay){ lastDay=d; for(const pl of players.values()) roll(pl); } });
on('kejob',(pl,m)=>{ const p=pl.prof, s=STAFF[pl.uid];
  if(m.op==='view') return {ke:view(pl)};
  if(m.op==='apply'){ if(!P.nearNpc(pl,'coke')) return {err:'Xin việc ở chỗ cô Ké (tiệm nông sản ngay cổng)'}; if(s) return {err:'Bạn đang là nhân viên rồi'}; if(p.flags.keQuit===today()) return {err:'Hôm nay cháu vừa nghỉ việc, mai quay lại xin nhé'};   // nghỉ rồi xin lại trong ngày thì việc hôm nay làm lại được → lãnh lương mãi
    if(p.level<K.minLevel) return {err:`Cô Ké nhận người từ cấp ${K.minLevel}`}; if(Object.keys(STAFF).length>=K.max) return {err:`Ké Retreat đủ ${K.max} nhân viên rồi`};
    STAFF[pl.uid]={name:p.name,since:today(),checked:today(),days:{},miss:0}; roll(pl); markDirty(pl);
    return {msg:`Chào mừng nhân viên mới! Ở ${S.ROOMS[K.room].name} miễn phí, mỗi ngày làm ${K.perDay} việc, mỗi việc ${fmt(K.wage)}`}; }
  if(!s) return {err:'Bạn chưa là nhân viên Ké Retreat'};
  if(m.op==='quit'){ p.flags.keQuit=today(); delete STAFF[pl.uid]; saveStaff(pl.uid); if(p.stay&&p.stay.staff) p.stay=null; markDirty(pl); return {msg:'Đã nghỉ làm ở Ké Retreat'}; }
  if(m.op==='do'){ const task=String(m.task||''), def=K.tasks[task], r=rec(pl.uid); if(!def||!r.tasks.includes(task)) return {err:'Hôm nay cô Ké không giao việc này'};
    if(r.done.includes(task)) return {err:'Xong việc này rồi'}; if(pl.scene!=='retreat'||!near(pl,def.x,def.y,40)) return {err:'Ra đúng chỗ làm việc đã'};
    return P.startTask(pl,'work',def.dur,()=>{ if(r.done.includes(task)) return {}; r.done.push(task); if(r.tasks&&r.done.length===r.tasks.length) P.stat(pl,'kestaff',1);   /* đủ việc 1 ngày nhân viên Ké */ saveStaff(pl.uid);
      reward(pl,{exp:def.exp,vnd:K.wage},'Cô Ké trả công: '+def.name); markDirty(pl); return {task}; },{anim:'work',name:def.name}); }
  return {err:'?'}; });
// reset server (reset.js): dọn dữ liệu trong bộ nhớ của các tài khoản bị reset
hook('reset',gone=>{ for(const uid of Object.keys(STAFF)) if(gone(uid)){ delete STAFF[uid]; saveStaff(uid); } });   /* nhân viên Ké Retreat */
