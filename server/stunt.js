// Đua xe bốc đầu với Đôn Chề trên đường đèo Đà Bắc. Có tín hiệu thì bấm Space đúng nhịp để bốc đầu;
// trượt hoặc không bấm thì có thể xoè xe (mất năng lượng, sạch sẽ). Chạy xong có tỉ lệ bị công an bắt về đồn.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,hook,send,now,moveTo,markDirty,note,reward,take,players}=C;
const W=S.WHEELIE, fmt=S.fmt;
const back=pl=>{ const d=S.NPCS.find(n=>n.id==='donche'); moveTo(pl,'retreat',d.x+1,d.y+1); };
on('stunt',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='start'){ if(!P.nearNpc(pl,'donche')) return {err:'Gặp Đôn Chề ở sân lửa trại'}; if(p.quests.cui!=='done') return {err:'Giúp Đôn Chề gom củi trước đã'};
    if(P.jailed(pl)) return {err:'Đang bị tạm giữ'}; if((p.daily.stunt||0)>=W.daily) return {err:`Hôm nay đua ${W.daily} lần rồi, nghỉ thôi`};
    pl.stunt={pick:true,at:t}; moveTo(pl,'deo:'+pl.uid,3,W.lane+.5,{stunt:{pick:true}}); return {}; }
  const st=pl.stunt; if(!st) return {err:'Chưa đua'};
  // gara đầu đèo: chọn 1 trong 4 xe (trả tiền thuê) rồi mới xuất phát
  if(m.op==='bike'){ if(!st.pick) return {err:'Đang chạy rồi'}; const bk=S.BIKES[m.bike]?m.bike:'wave', B=S.BIKES[bk]; if(B.price&&!take(pl,B.price)) return {err:`Thuê ${B.name} mất ${fmt(B.price)}, không đủ tiền`};
    const start=t+2500, cues=[...Array(W.cues)].map((_,k)=>start+(k+1)*W.gap);
    pl.stunt={start,cues,res:Array(W.cues).fill(null),ok:0,falls:0,bike:bk}; p.daily.stunt=(p.daily.stunt||0)+1; markDirty(pl);
    send(pl,{t:'stunt',k:'go',v:{start,cues,gap:W.gap,lead:W.lead,window:B.window,speed:B.speed,bike:bk}}); return {}; }
  if(m.op==='quit'){ if(!st.pick) return {err:'Đang chạy rồi'}; pl.stunt=null; back(pl); return {}; }
  if(st.pick) return {err:'Chọn xe đã'};
  if(m.op==='hit'){ const i=m.i|0, cue=st.cues[i]; if(cue===undefined||st.res[i]!==null) return {};
    const off=C.beatOff(pl,t,cue,m.off);
    if(Math.abs(off)<=S.BIKES[st.bike].window){ st.res[i]='ok'; st.ok++; send(pl,{t:'stunt',k:'ok',i}); } else fail(pl,i,'trượt'); return {}; } });
function fail(pl,i,why){ const st=pl.stunt, n=pl.prof.needs; st.res[i]='fail';
  if(Math.random()<S.BIKES[st.bike].fall){ st.falls++; n.energy=Math.max(0,n.energy-W.energy); n.clean=Math.max(0,n.clean-W.clean); markDirty(pl); send(pl,{t:'stunt',k:'fall',i,why}); }
  else send(pl,{t:'stunt',k:'miss',i,why}); }
function finish(pl){ const st=pl.stunt, p=pl.prof; pl.stunt=null;
  const B=S.BIKES[st.bike], crash=st.falls>=W.maxFalls, risk=Math.max(0,Math.min(W.policeMax,W.policeBase+W.policePer*st.ok+B.police));
  if(st.ok) P.stat(pl,'stunt',st.ok);
  if(Math.random()<risk){ p.jail={until:now()+W.jail*1000,fine:C.fineOf(pl,W.fine)}; markDirty(pl); P.stat(pl,'jail',1); moveTo(pl,'doncongan',7,6);
    note(pl,`Công an! Bị tạm giữ ${W.jail} giây vì đua xe trái phép. Nộp phạt ${fmt(p.jail.fine)} để về sớm.`,'lock'); send(pl,{t:'stunt',k:'end',caught:true,ok:st.ok,falls:st.falls}); return; }
  back(pl);
  if(crash){ note(pl,'Xoè xe liên tục, Đôn Chề phải dắt xe về. Không có thưởng.','lock'); send(pl,{t:'stunt',k:'end',crash:true,ok:st.ok,falls:st.falls}); return; }
  if(st.ok) reward(pl,{exp:Math.round(W.exp*st.ok*B.pay),vnd:Math.round(W.vnd*st.ok*B.pay),kind:'game'},`Bốc đầu thành công ${st.ok}/${W.cues} lần trên ${B.name} · Đôn Chề thưởng nóng`);
  send(pl,{t:'stunt',k:'end',ok:st.ok,falls:st.falls}); }
hook('tick',()=>{ const t=now();
  for(const pl of players.values()){ const st=pl.stunt; if(!st) continue; if(st.pick){ if(t-st.at>120000){ pl.stunt=null; back(pl); } continue; }
    st.cues.forEach((c,i)=>{ if(st.res[i]===null&&t>c+S.BIKES[st.bike].window+250) fail(pl,i,'không bấm'); });
    if(st.falls>=W.maxFalls||t>st.cues[st.cues.length-1]+1600) finish(pl); } });
hook('leave',(pl,old,to)=>{ if(pl.stunt&&old&&old.startsWith('deo:')&&to&&!to.startsWith('deo:')) pl.stunt=null; });
// đồn công an: nộp phạt hoặc chờ hết giờ tạm giữ
on('police',(pl,m)=>{ const p=pl.prof; if(!P.nearNpc(pl,'congan')) return {err:'Gặp chú công an ở bàn'};
  if(m.op==='fine'){ if(!P.jailed(pl)) return {err:'Bạn không bị tạm giữ'}; if(!take(pl,p.jail.fine)) return {err:`Phạt ${fmt(p.jail.fine)}, không đủ tiền. Đợi hết giờ tạm giữ`}; P.stat(pl,'fine',p.jail.fine);
    p.jail=null; markDirty(pl); return {msg:'Đã nộp phạt. Lần sau đi xe cẩn thận, đội mũ bảo hiểm nhé!'}; }
  return {jail:p.jail}; });
hook('slow',()=>{ const t=now(); for(const pl of players.values()){ const j=pl.prof.jail; if(j&&j.until<=t){ pl.prof.jail=null; markDirty(pl); note(pl,'Hết giờ tạm giữ, được về rồi. Đi đứng cẩn thận nhé!','quest'); } } });
