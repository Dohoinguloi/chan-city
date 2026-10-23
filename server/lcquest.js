// 15 NPC trong rừng Đà Bắc giao nhiệm vụ ẩn về Lính Cát (data.js LCFOREST, QUESTS lcq_*): nói chuyện mới lộ nhiệm vụ,
// tiến độ (qprog) cộng từ linhcat.js: thắng con hoang, thu phục, lên cấp, tiến hoá; số loài đã gặp đếm theo Poke Deck. Báo cáo bằng nhiệm vụ thường (places.js)
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,markDirty,note}=C;
const LQ=Object.entries(S.QUESTS).filter(([,q])=>q.lcq);
function bump(pl,id,q,v,set){ const p=pl.prof, pr=p.qprog=p.qprog||{}, old=pr[id]||0, nv=Math.min(q.prog,set?Math.max(old,v):old+v); if(nv===old) return;
  pr[id]=nv; markDirty(pl); if(nv>=q.prog) note(pl,`✔ ${q.title.replace('🔍 ','')}: xong! Quay lại gặp ${S.NPC_LOOKS[q.giver].name} báo cáo`,'quest'); }
// k: win | catch | lv | evo | check (vừa lộ nhiệm vụ: tính ngay mục lv / dex)
function ev(pl,k,sp){ const p=pl&&pl.prof; if(!p||!p.lc) return; const s=S.LC_SPECIES[sp]||{}, r=p.lc;
  for(const [id,q] of LQ){ const L=q.lcq; if(p.quests[id]!=='active') continue;
    if(L.k==='lv'){ const top=Math.max(0,...[...(r.party||[]),...(r.box||[])].map(m=>m.lv)); if(top>=L.lv) bump(pl,id,q,1,true); continue; }
    if(L.k==='dex'){ bump(pl,id,q,Object.values(r.dex||{}).filter(Boolean).length,true); continue; }
    if(L.k!==k) continue; if(L.t&&s.t!==L.t) continue; if(L.sp&&sp!==L.sp) continue; if(L.water&&!s.water) continue; bump(pl,id,q,1); } }
on('lcq',(pl,m)=>{ const p=pl.prof, id=String(m.id||''), q=S.QUESTS[id]; if(!q||!q.lcq&&!q.need||!String(id).startsWith('lcq_')) return {err:'?'};
  if(!P.nearNpc(pl,q.giver)) return {err:'Lại gần hơn'};
  if(p.quests[id]==='done'){ if((p.daily.lcqd||{})[id]) return {err:'Hôm nay xong việc này rồi, mai quay lại nhé'}; p.quests[id]='active'; (p.qprog=p.qprog||{})[id]=0; markDirty(pl); ev(pl,'check');   /* làm lại mỗi ngày */
    return {msg:`🔁 Nhận lại việc hôm nay: ${q.title.replace('🔍 ','')}. ${q.desc}`,again:id}; }
  if(p.quests[id]) return {msg:q.say};
  p.quests[id]='active'; markDirty(pl); ev(pl,'check'); return {msg:`🔍 Phát hiện nhiệm vụ ẩn: ${q.title.replace('🔍 ','')}! ${q.desc}`,secret:id}; });
module.exports={ev};
