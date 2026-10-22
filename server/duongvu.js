// Dương Vũ: đi khắp các map theo lịch (S.dvWhere) quảng cáo Zen Design System. Nói chuyện để lộ nhiệm vụ ẩn: đuổi theo anh ở 3 map, nhặt 5 Zen Token,
// bài kiểm tra Zen (đúng ≥3/4), áp dụng Zen vào file thật ở bàn thiết kế Lumen / Lavi / Bearplus. Gặp đủ 3 map được tặng áo thun Zen.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,now,near,markDirty,has,addItem,note}=C;
const D=S.DUONGVU, Q=S.QUESTS, pr=p=>p.qprog=p.qprog||{}, active=(p,id)=>p.quests[id]==='active';
function reveal(pl,id){ const p=pl.prof; if(p.quests[id]) return ''; p.quests[id]='active'; return Q[id].title.replace('🔍 ',''); }
const desksOf=sc=>sc==='lumen'?S.LUMEN.desks:sc==='lavi'?S.LAVI.desks:sc==='bearplus'?S.BEARPLUS.desks:[];
on('dv',(pl,m)=>{ const p=pl.prof, q=pr(p), F=p.flags.dv=p.flags.dv||{met:{},tok:{}}, op=m.op;
  if(op==='talk'){ if(!P.nearNpc(pl,'duongvu')) return {err:'Dương Vũ đi chỗ khác mất rồi'}; const first=!Object.keys(F.met).length; F.met[pl.scene]=1; const n=Object.keys(F.met).length, got=[];
    for(const id of ['dv_follow','dv_token']){ const t=reveal(pl,id); if(t) got.push(t); }
    if(active(p,'dv_follow')) q.dv_follow=Math.min(3,n); if(n>=2){ const t=reveal(pl,'dv_quiz'); if(t) got.push(t); } if(p.quests.dv_quiz==='done'){ const t=reveal(pl,'dv_figma'); if(t) got.push(t); }
    if(n>=3&&!p.owned.ao_zen){ p.owned.ao_zen=1; got.push('quà: Áo thun Zen Design System (mở Tủ đồ U để mặc)'); } markDirty(pl);
    const line=D.lines[Math.floor(Math.random()*D.lines.length)];
    return {msg:first?`Dương Vũ: "Chào bạn! Mình là Dương Vũ, đang đi giới thiệu Zen Design System. ${line}"`:`Dương Vũ: "${line}" (đã gặp anh ở ${n} map)`,secret:got}; }
  if(op==='token'){ const i=m.i|0, t=D.tokens[i]; if(!t||!active(p,'dv_token')||F.tok[i]) return {err:'?'}; if(pl.scene!==t[0]||!near(pl,t[1],t[2],30)) return {err:'Lại gần hơn'};
    F.tok[i]=1; addItem(pl,'zen_token',1); markDirty(pl); const n=Object.keys(F.tok).length; return {msg:`Nhặt được Zen Token ${n}/${D.tokens.length}!${n>=D.tokens.length?' Đủ rồi, đi tìm Dương Vũ trả nhé':''}`}; }
  if(op==='quiz'){ if(!P.nearNpc(pl,'duongvu')) return {err:'Gặp Dương Vũ để làm bài'}; if(!active(p,'dv_quiz')||q.dv_quiz) return {err:'?'};
    pl.dvq={i:0,ok:0,idx:D.quiz.map((_,k)=>k).sort(()=>Math.random()-.5)}; const it=D.quiz[pl.dvq.idx[0]]; return {quiz:{n:1,of:D.quiz.length,q:it.q,opts:it.a}}; }
  if(op==='answer'){ const z=pl.dvq; if(!z) return {err:'?'}; const it=D.quiz[z.idx[z.i]], right=(m.a|0)===it.ok; if(right) z.ok++; z.i++;
    if(z.i<z.idx.length){ const nx=D.quiz[z.idx[z.i]]; return {right,good:it.a[it.ok],next:{n:z.i+1,of:z.idx.length,q:nx.q,opts:nx.a}}; }
    pl.dvq=null; const pass=z.ok>=3; if(pass){ q.dv_quiz=1; markDirty(pl); }
    return {right,good:it.a[it.ok],done:true,pass,msg:pass?`Dương Vũ: "Đúng ${z.ok}/4, chuẩn dân Zen rồi!" Báo anh nhận thưởng`:`Mới đúng ${z.ok}/4. Gặp Dương Vũ làm lại nhé`}; }
  if(op==='figma'){ if(!active(p,'dv_figma')||q.dv_figma) return {err:'?'}; if(!D.figma.includes(pl.scene)||!desksOf(pl.scene).some(([x,y])=>near(pl,x,y+.9,40))) return {err:'Ngồi vào 1 bàn thiết kế ở Lumen, Lavi hoặc Bearplus'};
    return P.startTask(pl,'work',D.figmaDur,()=>{ q.dv_figma=1; markDirty(pl); return {msg:'File của khách giờ dùng toàn token Zen, đổi theme 1 phát là xong! Đi tìm Dương Vũ báo cáo'}; },{anim:'work',name:'Áp dụng Zen Design System'}); }
  return {err:'?'}; });
// đổi map: báo người chơi đang ở map anh vừa tới
let lastScene=''; C.hook('slow',()=>{ const w=S.dvWhere(now()); if(w.scene===lastScene) return; lastScene=w.scene;
  for(const pl of C.players.values()) if(pl.prof&&pl.scene===w.scene) note(pl,'📣 Dương Vũ vừa tới đây quảng cáo Zen Design System!','quest'); });
module.exports={};
