// Việc thiết kế của Huy Phan: tới đúng chỗ ở Lumen Studio (bàn làm việc / Annie) hoặc DAS (ghế lớp / thầy Huy Tạ) làm xong, rồi về Ké báo Huy Phan nhận thưởng.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,near,markDirty}=C;
on('design',(pl,m)=>{ const p=pl.prof, q=S.QUESTS[m.id], j=q&&q.job; if(!j) return {err:'?'}; if(p.quests[m.id]!=='active') return {err:'Chưa nhận việc này của Huy Phan'};
  const pr=p.qprog=p.qprog||{}; if(pr[m.id]) return {err:'Làm xong rồi, về Ké báo Huy Phan'};
  if(pl.scene!==j.where) return {err:`Việc này làm ở ${S.DEST[j.where].name}`};
  const ok=j.npc?P.nearNpc(pl,j.npc):j.at==='desk'?S.LUMEN.desks.some(([x,y])=>near(pl,x,y,36)):S.DAS.seats.some(([x,y])=>near(pl,x,y,30));
  if(!ok) return {err:j.npc?'Lại gần '+S.NPC_LOOKS[j.npc].name.split(' (')[0]+' đã':j.at==='desk'?'Ngồi vào 1 bàn làm việc ở Lumen':'Ngồi vào ghế trong lớp DAS'};
  if(j.cert&&!((p.das&&p.das.certs)||[]).includes(j.cert)) return {err:`Cần chứng chỉ DAS "${S.DAS.courses[j.cert].name}"`};
  return P.startTask(pl,'work',j.dur,()=>{ pr[m.id]=1; markDirty(pl); return {msg:`Xong: ${j.label}. Về Ké báo Huy Phan nhận thưởng`}; },{anim:'work',name:'Việc Huy Phan: '+j.label}); });
