// Lavi Studio (TP.HCM): việc của Linh Manh làm ở đúng chỗ trong studio (LAVI.tasks), việc typography / layout xong phải trả lời 3 câu đố (đúng ≥2 mới qua);
// 2 bé cún Gấu, Luna giấu nhiệm vụ bí mật (LAVI.secrets): lục khe sofa, kệ sách mẫu chữ, ban đêm ngồi cạnh bát ăn, vuốt ve Gấu đủ 3 lần trong ngày.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,now,near,markDirty,has,addItem}=C;
const L=S.LAVI, Q=S.QUESTS, pr=p=>p.qprog=p.qprog||{}, active=(p,id)=>p.quests[id]==='active';
const night=()=>{ const h=S.vnTime(now()).hf; return h>=L.night[0]||h<L.night[1]; };
const at=(pl,k)=>{ const o=L.spots[k]; return o&&near(pl,o.x,o.y,34); };
function reveal(pl,id,item){ const p=pl.prof, q=Q[id]; if(p.quests[id]) return null; p.quests[id]='active'; if(item&&!has(pl,item)) addItem(pl,item); markDirty(pl);
  return {msg:`🔍 Phát hiện nhiệm vụ bí mật: ${q.title.replace('🔍 ','')}! ${q.desc}`,secret:id}; }
// câu đố: 3 câu ngẫu nhiên trong bộ, đúng từ 2 câu là qua
function quizStart(pl,id){ const set=L.quiz[L.tasks[id].quiz], idx=set.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,3); pl.lvq={id,set:L.tasks[id].quiz,idx,i:0,ok:0}; return quizView(pl); }
function quizView(pl){ const z=pl.lvq, it=L.quiz[z.set][z.idx[z.i]]; return {n:z.i+1,of:z.idx.length,q:it.q,opts:it.a}; }
on('lv',(pl,m)=>{ const p=pl.prof, q=pr(p), d=p.daily; if(pl.scene!=='lavi') return {err:'Việc này ở Lavi Studio (TP.HCM)'};
  if(m.op==='talk'){ const id=String(m.who||''); if(!L.lines[id]||!P.nearNpc(pl,id)) return {err:'Lại gần bé cún đã'}; const T=d.lvPet=d.lvPet||{}; T[id]=(T[id]||0)+1; markDirty(pl);
    const sq=L.talkSecret[id]; if(sq&&T[id]>=3){ const r=reveal(pl,sq); if(r) return r; } const Ls=L.lines[id]; return {msg:Ls[(T[id]-1)%Ls.length]}; }
  if(m.op==='answer'){ const z=pl.lvq; if(!z) return {err:'?'}; const it=L.quiz[z.set][z.idx[z.i]], right=(m.a|0)===it.ok; if(right) z.ok++; z.i++;
    if(z.i<z.idx.length) return {right,good:it.a[it.ok],next:quizView(pl)};
    pl.lvq=null; const pass=z.ok>=2; if(pass){ q[z.id]=1; markDirty(pl); }
    return {right,good:it.a[it.ok],done:true,pass,ok:z.ok,of:z.idx.length,msg:pass?`Linh Manh gật gù: đúng ${z.ok}/${z.idx.length}! Báo Linh Manh nhận thưởng`:`Mới đúng ${z.ok}/${z.idx.length}, chưa qua. Ra chỗ cũ trả lời lại nhé`}; }
  if(m.op!=='spot') return {err:'?'}; const k=String(m.k||''); if(!L.spots[k]) return {err:'?'}; if(!at(pl,k)) return {err:'Lại gần hơn chút'};
  const id=Object.keys(L.tasks).find(t=>L.tasks[t].at===k&&active(p,t)&&(q[t]||0)<(Q[t].prog||1));
  if(id){ const t=L.tasks[id], F=p.flags.lvTask=p.flags.lvTask||{};
    if(t.night&&!night()) return {err:`Chỉ làm được ban đêm (${L.night[0]}h tới ${L.night[1]}h giờ game)`};
    if(t.quiz&&F[id]) return {quiz:quizStart(pl,id)};   // đã làm xong phần việc, chỉ còn câu đố
    const step=id==='lv_vibe'?L.vibeSteps[q[id]||0]:t.label;
    return P.startTask(pl,'work',t.dur,()=>{ if(t.quiz){ F[id]=true; markDirty(pl); return {msg:`Xong: ${step}. Linh Manh: "Giờ kiểm tra kiến thức tí nhé!"`,lvq:quizStart(pl,id)}; }
      q[id]=(q[id]||0)+1; markDirty(pl); const need=Q[id].prog||1;
      return {msg:q[id]>=need?`Xong: ${step}! Báo ${S.NPC_LOOKS[Q[id].giver].name.split(' (')[0]} nhận thưởng`:`Xong bước ${q[id]}/${need}: ${step}`}; },{anim:'work',name:step}); }
  const sc=L.secrets[k];
  if(sc&&!p.quests[sc.q]){ if(sc.how==='night'){ if(night()){ const r=reveal(pl,sc.q); if(r) return r; } } else { const r=reveal(pl,sc.q,sc.item); if(r) return r; } }
  const look={type:'Tường chữ: logo LAVI với các vạch kerning đỏ, chữ "Aa" to tướng',grid:'Bảng lưới 12 cột, bản phác landing page dán đầy giấy nhớ',specimen:'Kệ sách mẫu chữ: Garamond, Helvetica, Futura, Be Vietnam Pro...',
    vibe:'Laptop đang mở code, đèn LED dưới bàn đổi màu theo nhạc lo-fi',screen:'Màn chiếu đang để slide "LAVI STUDIO · DESIGN & CODE"',bowl:'Bát ăn của 2 bé cún, còn vài hạt',sofa:'Ghế sofa tím, lông chó dính khắp nơi',door:'Cửa kính studio nhìn ra phố'};
  return {msg:look[k]||'Không có gì đặc biệt'}; });
module.exports={};
