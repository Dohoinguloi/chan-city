// 120 Yên Lãng mở rộng: Refund Gaming (máy PUBG, tủ cúp, bàn DJ) và bếp Haky Food. Việc làm ở "chỗ" (RF.tasks), nhiệm vụ ẩn (RF.secrets) tự lục ra mới có:
// nhìn kỹ 1 chỗ, mở tủ lạnh nhiều lần, nút đỏ Hulkbuster chỉ sáng ban đêm giờ game, nói chuyện với DjChip đủ 3 lần trong ngày.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,now,near,markDirty,has,addItem}=C;
const R=S.RF, Q=S.QUESTS, pr=p=>p.qprog=p.qprog||{}, active=(p,id)=>p.quests[id]==='active';
const night=()=>{ const h=S.vnTime(now()).hf; return h>=R.night[0]||h<R.night[1]; };
const at=(pl,k,i)=>{ if(k==='desk'){ const d=R.desks[i|0]; return d&&near(pl,d[0],d[1]+.8,32); } const o=R.spots[k]; return o&&near(pl,o.x,o.y,34); };
// nhiệm vụ ẩn: lộ ra là tự nhận luôn, kèm đồ tìm được (nếu có)
function reveal(pl,id,item){ const p=pl.prof, q=Q[id]; if(p.quests[id]) return null; p.quests[id]='active'; if(item&&!has(pl,item)) addItem(pl,item); markDirty(pl);
  return {msg:`🔍 Phát hiện nhiệm vụ ẩn: ${q.title.replace('🔍 ','')}! ${q.desc}`,secret:id}; }
on('rf',(pl,m)=>{ const p=pl.prof, q=pr(p), d=p.daily; if(pl.scene!=='yenlang') return {err:'Việc này ở 120 Yên Lãng (nhà anh Độ)'};
  if(m.op==='talk'){ const id=String(m.who||''); if(!R.lines[id]||!P.nearNpc(pl,id)) return {err:'?'}; const T=d.rfTalk=d.rfTalk||{}; T[id]=(T[id]||0)+1; markDirty(pl);
    const sq=R.talkSecret[id]; if(sq&&T[id]>=3){ const r=reveal(pl,sq); if(r) return r; }
    if(id==='rf_jikey'&&active(p,'sq_banhbao')&&!q.sq_banhbao){ q.sq_banhbao=1; markDirty(pl); return {msg:'Jikey: "Thôi thú thật... mình ăn 3 cái bánh bao lúc 3 giờ sáng. Đừng nói Haky nha!" (về báo Haky)'}; }
    const L=R.lines[id]; return {msg:L[(T[id]-1)%L.length],n:T[id]}; }
  if(m.op!=='desk'&&m.op!=='spot') return {err:'?'};
  const k=m.op==='desk'?'desk':String(m.k||''); if(k!=='desk'&&!R.spots[k]) return {err:'?'}; if(!at(pl,k,m.i)) return {err:'Lại gần hơn chút'};
  // 1) đang có việc làm ở chỗ này
  const id=Object.keys(R.tasks).find(t=>R.tasks[t].at===k&&active(p,t)&&(q[t]||0)<(Q[t].prog||1));
  if(id){ const t=R.tasks[id];
    if(t.night&&!night()) return {err:`Chỉ làm được ban đêm (${R.night[0]}h tới ${R.night[1]}h giờ game)`};
    for(const [it,n] of Object.entries(t.use||{})) if(!has(pl,it,n)) return {err:`Cần ${n} ${(S.ITEMS[it]||S.INGREDIENTS[it]||{name:it}).name}. ${Q[id].desc}`};
    if(k==='desk'&&(d.rfdesk||0)>=R.deskDaily) return {err:'Hôm nay chơi PUBG đủ rồi, mỏi mắt quá'};
    for(const [it,n] of Object.entries(t.use||{})) addItem(pl,it,-n);
    return P.startTask(pl,'work',t.dur,()=>{ if(k==='desk') d.rfdesk=(d.rfdesk||0)+1; const need=Q[id].prog||1;
      if(t.chance&&Math.random()>t.chance){ markDirty(pl); return {msg:`${t.label}: bị bo ép, về sảnh rồi! Thử lại nhé`}; }
      q[id]=(q[id]||0)+1; markDirty(pl);
      return {msg:q[id]>=need?`Xong: ${t.label}! Báo ${S.NPC_LOOKS[Q[id].giver].name.split(' (')[0]} nhận thưởng`:`${t.label}: ${q[id]}/${need}`}; },{anim:k==='stove'?'cook':'work',name:t.label}); }
  // 2) chỗ này giấu nhiệm vụ ẩn
  const sc=R.secrets[k];
  if(sc&&!p.quests[sc.q]){
    if(sc.how==='look'){ const r=reveal(pl,sc.q,sc.item); if(r) return r; }
    if(sc.how==='night'){ if(night()){ const r=reveal(pl,sc.q); if(r) return r; } }
    if(sc.how==='n'){ const N=d.rfOpen=d.rfOpen||{}; N[k]=(N[k]||0)+1; markDirty(pl); if(N[k]>=sc.n){ const r=reveal(pl,sc.q); if(r) return r; } } }
  // 3) không có gì: tả cảnh
  if(k==='desk') return {msg:'Máy PUBG của team, màn hình còn đang ở sảnh chờ'}; return {msg:R.look[k]||'Không có gì đặc biệt'}; });
module.exports={};
