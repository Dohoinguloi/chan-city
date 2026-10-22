// DAS · Design Anthropology School (TP.HCM): gặp thầy Huy Tạ đăng ký khoá, học từng buổi ở ghế lớp học (2 buổi của 1 khoá cách nhau D.gapH tiếng),
// học đủ buổi thì nhận chứng chỉ (Everfit nhận dễ hơn, lương cao hơn). Đủ chứng chỉ + cấp thì đứng lớp làm giảng viên kiếm tiền.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,now,today,near,markDirty,reward,take,give}=C;
const D=S.DAS, fmt=S.fmt;
const rec=p=>p.das=p.das||{c:{},certs:[],taught:{day:'',n:0}};
const boostOf=p=>{ const r=p.das; if(!r) return 0; return Math.min(D.maxBoost,r.certs.reduce((a,k)=>a+(D.courses[k]?D.courses[k].boost:0),0)); };
const view=p=>{ const r=rec(p); return {c:r.c,certs:r.certs,boost:boostOf(p),taught:r.taught.day===today()?r.taught.n:0}; };
on('das',(pl,m)=>{ const p=pl.prof, r=rec(p), d=today();
  if(m.op==='view') return {das:view(p)}; if(pl.scene!=='das') return {err:'Bay vào DAS (TP.HCM) đã'};
  if(m.op==='enroll'){ const c=D.courses[m.k]; if(!c) return {err:'?'}; if(p.level<D.level) return {err:`DAS nhận học viên từ cấp ${D.level}`}; if(!P.nearNpc(pl,'huyta')) return {err:'Đăng ký với thầy Huy Tạ ở quầy'};
    if(r.certs.includes(m.k)) return {err:'Bạn có chứng chỉ khoá này rồi'}; if(r.c[m.k]) return {err:'Đã đăng ký khoá này, vào lớp học thôi'};
    const sc=p.lumen&&p.lumen.scholar&&!p.lumen.scholar.done?p.lumen.scholar:null, kind=sc&&sc.free>0?'free':sc&&sc.half>0?'half':'', fee=kind==='free'?0:kind==='half'?Math.round(c.fee/2):c.fee;   // học bổng Lumen của Annie
    if(fee&&!take(pl,fee)) return {err:`Học phí ${fmt(fee)}, không đủ tiền`}; if(kind) sc[kind]--; r.c[m.k]={n:0,last:''}; markDirty(pl);
    return {msg:`Đã đăng ký ${c.name}${kind?` (học bổng Lumen: ${kind==='free'?'miễn phí':'giảm 50%, đóng '+fmt(fee)})`:''}. Học ở ghế trong lớp, mỗi buổi cách nhau ${D.gapH} tiếng (${c.sessions} buổi)`}; }
  if(m.op==='study'){ const k=String(m.k||''), c=D.courses[k], e=r.c[k]; if(!c||!e) return {err:'Chưa đăng ký khoá này'}; const wait=(e.at||0)+D.gapH*3600e3-now(); if(wait>0){ const mn=Math.ceil(wait/60e3); return {err:`Buổi tiếp theo của khoá này học được sau ${mn>=60?Math.floor(mn/60)+' tiếng ':''}${mn%60?mn%60+' phút ':''}nữa`}; }
    if(!D.seats.some(([x,y])=>near(pl,x,y,28))) return {err:'Ngồi vào ghế trong lớp học đã'};
    return P.startTask(pl,'hoc',c.dur,()=>{ e.n++; e.at=now(); let msg=`Xong buổi ${e.n}/${c.sessions} · ${c.name}`;
      if(e.n>=c.sessions){ delete r.c[k]; r.certs.push(k); msg=`Tốt nghiệp ${c.name}! Nhận chứng chỉ DAS · lương Everfit +${Math.round(boostOf(p)*100)}%`; }
      reward(pl,{exp:c.exp},msg); markDirty(pl); return {}; },{anim:'work',name:'Học '+c.name}); }
  if(m.op==='teach'){ const T=D.teach; if(r.certs.length<T.needCerts) return {err:`Cần ít nhất ${T.needCerts} chứng chỉ DAS mới được đứng lớp`}; if(p.level<T.level) return {err:`Cần cấp ${T.level}`};
    if(r.taught.day!==d) r.taught={day:d,n:0}; if(r.taught.n>=T.daily) return {err:`Hôm nay dạy đủ ${T.daily} buổi rồi`}; if(!near(pl,D.podium.x,D.podium.y,30)) return {err:'Lên bục giảng đã'};
    return P.startTask(pl,'work',T.dur,()=>{ r.taught.n++; reward(pl,{exp:T.exp,vnd:T.pay},`Đứng lớp xong buổi ${r.taught.n}/${T.daily} · thù lao giảng viên`); markDirty(pl); return {}; },{anim:'work',name:'Đứng lớp giảng bài'}); }
  return {err:'?'}; });
module.exports={boostOf,certs:p=>p.das?p.das.certs.length:0};
