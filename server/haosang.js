// Hảo sảng (chuột phải người chơi khác): donate tiền, cho vay có lãi, mời về nhà riêng chơi.
// Điểm hảo sảng tính trong data.js (hsPts): tiền cho đi ròng + khách tới nhà + khoản vay được trả đủ. Bậc hảo sảng: +EXP (core.js expMul), mua rẻ hơn (perks.js), bán được giá hơn (places.js, muforest.js, mu.js).
'use strict';
const C=require('./core');
const {S,T,on,hook,send,now,take,give,note,markDirty,players,byUid,db}=C;
const H=S.HAOSANG, LN=H.loan, SL=S.STATE_LOAN, fmt=S.fmt;
const TR=require('./treasury');   // ngân khố nhà nước (ví kaixa): vay vốn nhà nước
const rec=p=>p.hs||(p.hs={give:0,got:0,host:0,loan:0});
const view=p=>{ const t=S.hsTier(p); return {n:t.n,lv:t.lv,name:t.name,b:t.b}; };
// gần nhau: cùng cảnh, trong H.range ô
const nearP=(a,b)=>a&&b&&a!==b&&a.scene===b.scene&&Math.hypot(a.x-b.x,a.y-b.y)<=H.range*T;
// trả tiền cho người đang online hoặc ghi thẳng vào hồ sơ đã lưu nếu offline
const pay=(uid,v)=>{ const q=byUid.get(uid); if(q&&q.prof){ give(q,v); return true; } return db.addMoney(uid,v); };
// báo tiến độ hảo sảng (lên bậc thì chúc mừng)
function bump(pl,before){ const t=S.hsTier(pl.prof); send(pl,{t:'hs',v:view(pl.prof)}); if(t.lv>before) note(pl,`💛 Lên bậc hảo sảng ${t.lv}: ${t.name}! +${Math.round(t.b*100)}% EXP, mua rẻ ${Math.round(t.b*100)}%, bán được giá hơn ${Math.round(t.b*100)}%`,'quest'); }

/* ---------- khoản vay: lưu bảng loans, mỗi khoản {from,fromName,to,toName,amt,rate,days,start,due,paid,st} ---------- */
const LOANS=new Map(db.loans().map(L=>[L.id,L]));
const owes=uid=>[...LOANS.values()].filter(L=>L.to===uid&&L.st==='open');
const lent=uid=>[...LOANS.values()].filter(L=>L.from===uid&&L.st==='open');
const loanView=(L,t)=>({id:L.id,from:L.fromName,to:L.toName,amt:L.amt,rate:L.rate,due:L.due,owed:S.loanOwed(L,t),late:t>L.due,state:L.state?1:0});
// người vay trả v (đủ thì đóng khoản); người cho vay nhận tiền ngay dù offline
function repay(L,pl,v,auto){ const t=now(), owed=S.loanOwed(L,t); v=Math.min(v,owed); if(v<=0||!take(pl,v,true)) return 0;
  L.paid=(L.paid||0)+v; if(L.state){ TR.move(v); TR.repaid(v); } else pay(L.from,v); const done=S.loanOwed(L,t)<=0;   /* vay nhà nước: trả về ngân khố */ if(done) L.st='done'; db.saveLoan(L); if(done) LOANS.delete(L.id);
  const q=byUid.get(L.from); if(q&&q.prof) note(q,`💰 ${L.toName} ${auto?'bị tự trừ':'trả'} ${fmt(v)} tiền vay${done?' · đã trả đủ':''}`,'vnd');
  if(done&&q&&q.prof&&!L.state){ const p=q.prof, h=rec(p), d=p.daily, before=S.hsTier(p).lv, add=Math.min(Math.max(1,Math.floor(L.amt/1e6)),H.loanDay-(d.hsLoan||0));   /* cho vay được trả đủ: điểm hảo sảng (người cho vay đang online) */
    if(add>0){ d.hsLoan=(d.hsLoan||0)+add; h.loan=(h.loan||0)+add; markDirty(q); bump(q,before); } }
  markDirty(pl); return v; }
// quá hạn: cứ có tiền là tự trừ trả nợ (lúc vào game và mỗi nhịp chậm)
function collect(pl){ const t=now(); for(const L of owes(pl.uid)) if(t>L.due&&pl.prof.money>0){ const v=repay(L,pl,pl.prof.money,true); if(v) note(pl,`🏦 Khoản vay của ${L.fromName} quá hạn: tự trừ ${fmt(v)}${L.st==='done'?' · đã trả đủ':''}`,'lock'); } }
hook('login',pl=>{ setTimeout(()=>{ if(pl.prof){ collect(pl); send(pl,{t:'hs',v:view(pl.prof)}); } },3000); });
hook('slow',()=>{ for(const pl of players.values()) if(pl.prof) collect(pl); });

const asks=new Map(); let askSeq=1;
hook('tick',()=>{ const t=now(); for(const [id,a] of asks) if(t>a.exp) asks.delete(id); });
const busyHome=pl=>pl.race||pl.stunt||(pl.prof.jail&&pl.prof.jail.until>now());

on('hs',(pl,m)=>{ const p=pl.prof, t=now(), op=m.op, q=m.to!=null?players.get(m.to|0):null;
  if(op==='state'){ const h=rec(p); return {v:view(p),h:{give:h.give||0,got:h.got||0,host:h.host||0,loan:h.loan||0},owe:owes(pl.uid).map(L=>loanView(L,t)),lent:lent(pl.uid).map(L=>loanView(L,t))}; }
  if(op==='peek'){ if(!q||!q.prof) return {err:'?'}; return {name:q.prof.name,v:view(q.prof),late:owes(q.uid).some(L=>t>L.due)}; }
  // donate: chuyển thẳng, điểm tính theo tiền cho đi ròng
  if(op==='gift'){ const v=Math.round(+m.amt||0); if(!nearP(pl,q)) return {err:'Lại gần người đó hơn'}; if(!(v>=H.giftMin&&v<=H.giftMax)) return {err:`Donate từ ${fmt(H.giftMin)} tới ${fmt(H.giftMax)}`};
    if(!take(pl,v,true)) return {err:`Trong ví chỉ còn ${fmt(p.money)}`}; give(q,v); const before=S.hsTier(p).lv; rec(p).give+=v; rec(q.prof).got+=v; markDirty(pl); markDirty(q);
    note(q,`🎁 ${p.name} donate cho bạn ${fmt(v)}!`,'vnd'); C.broadcastNear(pl,{t:'ev',k:'donate',id:pl.pid,to:q.pid,v},400); bump(pl,before); send(q,{t:'hs',v:view(q.prof)});
    return {msg:`Đã donate ${fmt(v)} cho ${q.prof.name}`,v:view(p)}; }
  // cho vay: người cho vay đề nghị, người vay đồng ý mới chuyển tiền
  if(op==='loan'){ const v=Math.round(+m.amt||0), rate=Math.round((+m.rate||0)*100)/100, days=m.days|0; if(!nearP(pl,q)) return {err:'Lại gần người đó hơn'};
    if(!(v>=LN.min&&v<=LN.max)) return {err:`Cho vay từ ${fmt(LN.min)} tới ${fmt(LN.max)}`}; if(!(rate>=LN.minRate&&rate<=LN.maxRate)) return {err:`Lãi từ ${LN.minRate*100}% tới ${LN.maxRate*100}% / ngày`};
    if(!(days>=1&&days<=LN.maxDays)) return {err:`Hạn từ 1 tới ${LN.maxDays} ngày`}; if(p.money<v) return {err:`Trong ví chỉ còn ${fmt(p.money)}`};
    if(owes(q.uid).length>=LN.maxActive) return {err:`${q.prof.name} đang nợ ${LN.maxActive} khoản rồi`}; if(t-(pl.hsAskAt||0)<4000) return {err:'Đợi chút rồi hỏi tiếp'}; pl.hsAskAt=t;
    const id=askSeq++; asks.set(id,{id,kind:'loan',a:pl,b:q,amt:v,rate,days,exp:t+30000});
    send(q,{t:'hsAsk',id,kind:'loan',name:p.name,amt:v,rate,days,total:Math.round(v*(1+rate*days)/1000)*1000}); return {msg:`Đã gửi đề nghị cho ${q.prof.name} vay ${fmt(v)}, đợi đồng ý`}; }
  // mời về nhà riêng (nhà Hà Nội): đồng ý thì chủ nhà và khách cùng về
  if(op==='invite'){ if(!nearP(pl,q)) return {err:'Lại gần người đó hơn'}; if(busyHome(pl)) return {err:'Bạn đang bận'}; if(t-(pl.hsAskAt||0)<4000) return {err:'Đợi chút rồi mời tiếp'}; pl.hsAskAt=t;
    const id=askSeq++; asks.set(id,{id,kind:'home',a:pl,b:q,exp:t+20000}); send(q,{t:'hsAsk',id,kind:'home',name:p.name}); return {msg:`Đã mời ${q.prof.name} về nhà chơi, đợi đồng ý`}; }
  if(op==='answer'){ const a=asks.get(m.id|0); if(!a||a.b!==pl) return {err:'Lời mời đã hết hạn'}; asks.delete(a.id); const A=a.a;
    if(!players.has(A.pid)||!A.prof) return {err:'Người kia đã thoát game'}; if(!m.yes){ note(A,`${p.name} đã từ chối`); return {}; }
    if(a.kind==='loan'){ if(owes(pl.uid).length>=LN.maxActive) return {err:`Bạn đang nợ ${LN.maxActive} khoản rồi`}; if(!take(A,a.amt,true)) { note(A,'Không đủ tiền cho vay nữa'); return {err:A.prof.name+' không còn đủ tiền'}; }
      give(pl,a.amt); const L={from:A.uid,fromName:A.prof.name,to:pl.uid,toName:p.name,amt:a.amt,rate:a.rate,days:a.days,start:t,due:t+a.days*864e5,paid:0,st:'open'}; L.id=db.addLoan(L); LOANS.set(L.id,L); markDirty(A); markDirty(pl);
      note(A,`🤝 ${p.name} đã nhận khoản vay ${fmt(a.amt)}, lãi ${Math.round(a.rate*100)}% / ngày, hạn ${a.days} ngày`,'vnd'); return {msg:`Đã vay ${A.prof.name} ${fmt(a.amt)}: hạn ${a.days} ngày, quá hạn là tự trừ tiền trong ví`}; }
    if(a.kind==='home'){ if(busyHome(A)||busyHome(pl)) return {err:'Đang bận, không về được'}; if(!nearP(A,pl)) return {err:`${A.prof.name} đã đi chỗ khác rồi`};   /* không kéo người mời ra khỏi trận / việc đang làm */ const sp=S.ROOMS.tro.spawn, home='room:'+A.uid;
      if(A.scene!==home) C.moveTo(A,home,sp.x,sp.y); C.moveTo(pl,home,sp.x+1.2,sp.y,{host:A.prof.name,hostPid:A.pid});
      const d=A.prof.daily, seen=d.hsGuests=d.hsGuests||{}; if(!seen[pl.uid]&&Object.keys(seen).length<H.hostDay){ seen[pl.uid]=1; const h=rec(A.prof), before=S.hsTier(A.prof).lv; if((h.host||0)<H.hostMax){ h.host=(h.host||0)+1; bump(A,before); } }   /* tiếp khách: 1 điểm / khách / ngày */
      markDirty(A); note(A,`🏠 ${p.name} tới nhà bạn chơi`,'quest'); return {}; } }
  // vay vốn nhà nước: giải ngân từ ví kaixa (ngân khố), không cần ai đồng ý; quá hạn tự trừ như khoản vay thường
  if(op==='stloan'){ const v=Math.round(+m.amt||0), days=m.days|0, mine=owes(pl.uid), cap=SL.cap(p.level);
    if(m.view) return {cap,lv:SL.minLv,cur:mine.filter(L=>L.state).map(L=>loanView(L,t)),tr:TR.view()};
    if(!TR.KX()) return {err:'Ngân khố chưa mở'}; if(TR.isKx(pl.uid)) return {err:'Ngân khố là của bạn rồi'}; if(p.level<SL.minLv) return {err:`Từ cấp ${SL.minLv} mới được vay vốn nhà nước`};
    if(mine.some(L=>L.state)) return {err:'Bạn đang có 1 khoản vay nhà nước, trả xong mới vay tiếp'}; if(mine.length>=LN.maxActive) return {err:`Bạn đang nợ ${LN.maxActive} khoản rồi`};
    if(!SL.amts.includes(v)||v>cap) return {err:`Cấp ${p.level} vay tối đa ${fmt(cap)}`}; if(!SL.days.includes(days)) return {err:'Chọn kỳ hạn'};
    if(TR.balance()<v) return {err:'Ngân khố không đủ tiền cho vay lúc này'}; if(!TR.move(-v)) return {err:'Ngân khố đang bận, thử lại sau'}; TR.lend(v);
    p.money+=v; const L={from:TR.KX(),fromName:'Ngân khố nhà nước',to:pl.uid,toName:p.name,amt:v,rate:SL.rate,days,start:t,due:t+days*864e5,paid:0,st:'open',state:1}; L.id=db.addLoan(L); LOANS.set(L.id,L); markDirty(pl);
    return {msg:`🏦 Đã giải ngân ${fmt(v)} vốn trồng trọt, chăn nuôi: lãi ${Math.round(SL.rate*100)}%/ngày, hạn ${days} ngày, quá hạn tự trừ trong ví`,cur:[loanView(L,t)]}; }
  if(op==='repay'){ if(t-(pl.repayAt||0)<2000) return {err:'Chờ chút rồi trả tiếp'}; pl.repayAt=t; const L=LOANS.get(m.id|0);   /* mỗi lần trả là ghi DB (người cho vay offline thì đọc / ghi cả hồ sơ): 2 giây 1 lần */ if(!L||L.to!==pl.uid||L.st!=='open') return {err:'Không có khoản nợ này'}; const owed=S.loanOwed(L,t), v=Math.min(owed,Math.round(+m.amt||owed));
    if(p.money<v) return {err:`Cần ${fmt(v)}, trong ví còn ${fmt(p.money)}`}; const got=repay(L,pl,v,false); return {msg:`Đã trả ${L.fromName} ${fmt(got)}${L.st==='done'?' · hết nợ':''}`,owe:owes(pl.uid).map(x=>loanView(x,t))}; }
  if(op==='home'){ if(C.kindOf(pl.scene)!=='room'||pl.scene==='room:'+pl.uid) return {err:'Bạn đang không ở nhà người khác'}; const sp=S.ROOMS.tro.spawn; C.moveTo(pl,'room:'+pl.uid,sp.x,sp.y); return {}; }
  return {err:'?'}; });
// chủ nhà rời nhà → khách về nhà mình
hook('leave',(pl,old,to)=>{ if(old==='room:'+pl.uid&&to!==old) for(const q of [...C.sceneOf(old)]) if(q!==pl){ const sp=S.ROOMS.tro.spawn; note(q,'Chủ nhà đã ra ngoài, bạn về nhà mình'); C.moveTo(q,'room:'+q.uid,sp.x,sp.y); } });
// reset server (reset.js): dọn dữ liệu trong bộ nhớ của các tài khoản bị reset
hook('reset',gone=>{ for(const L of [...LOANS.values()]) if(gone(L.from)||gone(L.to)){ L.st='done'; db.saveLoan(L); LOANS.delete(L.id); } });   /* khoản vay có người bị reset: xoá */
module.exports={owes,lent};
