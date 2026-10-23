// Item huyền thoại (Cái Pod của Kaixa, Cây Bút của Redtype, Airpod của VNPT): mỗi món ghép từ 15 mảnh.
// Mảnh nhiệm vụ tự tính theo p.quests (data.js legendDone); ở đây xử lý câu đố logic (đáp án chỉ server giữ) và nhiệm vụ nhóm (đủ n người trong vòng sáng bấm trong 15 giây).
'use strict';
const C=require('./core');
const {S,T,on,send,now,markDirty,note,players}=C;
const L=S.LEGEND;
// đáp án: số thì so phần số, chữ thì so sau khi bỏ dấu / khoảng trắng
const ANS={pod_p1:['ho','cai ho','lo','cai lo'],pod_p2:['13','muoi ba'],pod_p3:['nam'],pod_p4:['5','nam'],but_p1:['2','hai'],but_p2:['8','tam'],but_p3:['1','mot'],
  ap_p1:['6','sau'],ap_p2:['than','than cui','cuc than'],ap_p3:['42','bon muoi hai','bon hai'],ap_p4:['40','bon muoi']};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]/g,'');
function correct(id,a){ const raw=String(a||''), dg=(raw.match(/\d+/)||[''])[0], n=norm(raw); return (ANS[id]||[]).some(x=>/^\d+$/.test(x)?dg===x:n===norm(x)||n==='con'+norm(x)||n==='cai'+norm(x)); }
const rec=p=>{ const r=p.legend||(p.legend={f:{}}); r.f=r.f||{}; return r; };
const near=(pl,t)=>pl&&pl.scene===t.sc&&Math.hypot(pl.x/T-t.x,pl.y/T-t.y)<=3.5;
const GRP={};   // id nhiệm vụ nhóm → Map(pid → lúc bấm)
function grant(pl,t){ const r=rec(pl.prof); r.f=r.f||{}; if(r.f[t.id]) return false; r.f[t.id]=1; markDirty(pl); const n=S.legendCount(pl.prof,t.it), I=L.items[t.it];
  note(pl,`🧩 Nhận 1 mảnh ${I.name} (${n}/${L.need})${n>=L.need?' · ĐÃ GHÉP XONG, món huyền thoại đã kích hoạt!':''}`,'item'); send(pl,{t:'legend',it:t.it,n,done:n>=L.need}); return true; }
on('legend',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const t=L.tasks.find(x=>x.id===m.id);
  if(m.op==='answer'){ if(!t||t.t!=='puz') return {err:'?'}; if(rec(p).f[t.id]) return {err:'Đã giải câu này rồi'}; if(!near(pl,t)) return {err:'Lại gần phiến đá câu đố đã'};
    const tn=now(); if(pl.legTry&&tn<pl.legTry) return {err:'Bình tĩnh nghĩ đã, 3 giây nữa trả lời tiếp'}; if(!correct(t.id,m.a)){ pl.legTry=tn+3000; return {err:'Sai rồi! Nghĩ lại xem'}; }   /* chống dò đáp án */
    grant(pl,t); return {ok:1,msg:'Chính xác! +1 mảnh'}; }
  if(m.op==='group'){ if(!t||t.t!=='grp') return {err:'?'}; if(now()-(pl.grpAt||0)<2500) return {err:'Đang chờ mọi người'}; pl.grpAt=now();   /* mỗi lần bấm báo cho cả vùng: 2,5 giây 1 lần */ if(!near(pl,t)) return {err:'Đứng vào vòng sáng nhiệm vụ nhóm đã'}; const g=GRP[t.id]||(GRP[t.id]=new Map()), tn=now(); g.set(pl.pid,tn);
    for(const [pid,at] of g) if(tn-at>15000||!near(players.get(pid),t)) g.delete(pid);
    if(g.size>=t.n){ const got=[]; for(const pid of g.keys()){ const q=players.get(pid); if(q&&grant(q,t)) got.push(q.prof.name); } g.clear();
      for(const q of C.sceneOf(t.sc)) if(near(q,t)) note(q,`👥 ${t.label}: xong! ${got.length?got.join(', ')+' nhận mảnh':'(mọi người đã có mảnh này)'}`,'quest'); return {ok:1,msg:'Cả nhóm hoàn thành!'}; }
    for(const q of C.sceneOf(t.sc)) if(q!==pl&&Math.hypot(q.x/T-t.x,q.y/T-t.y)<=14) note(q,`👥 ${p.name} đang chờ ở vòng sáng "${t.label}": cần ${t.n} người, còn thiếu ${t.n-g.size} (15 giây)`,'quest');
    return {ok:1,wait:t.n-g.size,msg:`Đang chờ thêm ${t.n-g.size} người cùng bấm trong 15 giây`}; }
  if(m.op==='dbgown'&&process.env.CHAN_TEST==='1'){ const it=String(m.it||''), r=rec(p); r.force=r.force||{}; r.force[it]=1; markDirty(pl); return {ok:1}; }   // chỉ server test: coi như đã ghép đủ 1 món   // chỉ server test: ghép đủ 1 món
  return {err:'?'}; });
module.exports={};
