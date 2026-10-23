// Giải Ngoại Hạng Anh (map 'epl', data.js EPL): 6 CLB, cứ EPL.every phút giờ thật 1 vòng 3 trận (xoay vòng kiểu vòng tròn, đổi sân nhà / khách sau mỗi 5 vòng), mỗi trận EPL.dur giây.
// Bàn thắng: mỗi giây mỗi đội có xác suất ghi bàn theo sức mạnh (điểm CLB + sân nhà + độ nóng khán đài + cầu thủ người chơi đang đứng trên sân + HLV có mặt + chiến thuật).
// Cầu thủ người chơi trên sân thỉnh thoảng nhận Cơ hội dứt điểm (client bấm đúng lúc, gửi độ chuẩn q) → bàn thắng của chính họ.
// Vai: cầu thủ (hợp đồng CLB), HLV (chứng chỉ + chỉ số, mỗi CLB 1 ghế), cổ động viên (vé + cổ vũ), người bán hàng (thuê sạp, nhập hàng, rao bán). Mùa giải = 1 tuần thật, lưu ở data/epl.json.
'use strict';
const fs=require('fs'), path=require('path');
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');
const {S,T,on,hook,send,now,near,take,give,reward,markDirty,note,players,byUid,sceneOf,db}=C;
const E=S.EPL, CL=E.clubs, IDS=S.EPL_CLUBS, fmt=S.fmt, MT=E.match;
const DIR=process.env.DATA_DIR||path.join(__dirname,'data'), FILE=path.join(DIR,'epl.json');
const rec=p=>{ const r=p.epl=p.epl||{club:'',role:'',sk:0,apps:0,goals:0,fan:'',stock:{}}; r.stock=r.stock||{}; return r; };
/* ---------- mùa giải (lưu file) ---------- */
const weekOf=()=>{ const R=S.realTime(); return S.addDays(R.day,-((R.wd+6)%7)); };   /* thứ Hai của tuần thật */
const blankTable=()=>Object.fromEntries(IDS.map(k=>[k,{p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}]));
let ST={season:weekOf(),table:blankTable(),scorers:{},players:{},fans:{},coaches:{},stalls:{},pend:{},last:null};
try{ const o=JSON.parse(fs.readFileSync(FILE,'utf8')); ST={...ST,...o}; for(const k of IDS) ST.table[k]=ST.table[k]||blankTable()[k]; }catch(e){ /* lần đầu chạy: chưa có file */ }
let saveT=0; const save=()=>{ if(saveT) return; saveT=setTimeout(()=>{ saveT=0; try{ fs.writeFileSync(FILE,JSON.stringify(ST)); }catch(e){ console.error('[epl] save',e.message); } },1500); };
const ranked=()=>IDS.slice().sort((a,b)=>{ const A=ST.table[a], B=ST.table[b]; return B.pts-A.pts||(B.gf-B.ga)-(A.gf-A.ga)||B.gf-A.gf||CL[b].rating-CL[a].rating; });
/* ---------- lịch đấu ---------- */
const PER=E.every*60e3, mdAt=md=>md*PER, mdNow=t=>Math.floor(t/PER);
function fixtures(md){ const r=md%5, flip=Math.floor(md/5)%2, rest=IDS.slice(1), rot=[...rest.slice(r),...rest.slice(0,r)], arr=[IDS[0],...rot];   /* vòng tròn: giữ đội đầu, xoay 5 đội còn lại */
  return [[arr[0],arr[5]],[arr[1],arr[4]],[arr[2],arr[3]]].map(([a,b],i)=>(i+r+flip)%2?[b,a]:[a,b]); }
let LIVE=null;   /* vòng đang đá: {md,at,end,fx:[{h,a,sh,sa,heat:[0,0],ev:[],ppl:{},coach:{},tix:{},sold:{}}]} */
const inRect=(R,x,y)=>x>=R.x0&&x<=R.x1+1&&y>=R.y0&&y<=R.y1+1;
const tileOf=pl=>[pl.x/T,pl.y/T];
const nameOf=uid=>{ const q=byUid.get(uid); return q&&q.prof?q.prof.name:''; };
/* ---------- xem nhanh cho client ---------- */
const coachOf=k=>{ const c=ST.coaches[k]; return c&&c.uid?c:null; };
function liveView(){ const t=now(); if(!LIVE) return null; return {md:LIVE.md,at:LIVE.at,end:LIVE.end,min:Math.min(90,Math.floor((t-LIVE.at)/(E.dur*1000)*90)),
  fx:LIVE.fx.map(f=>({h:f.h,a:f.a,sh:f.sh,sa:f.sa,heat:f.heat.map(v=>Math.round(v)),ev:f.ev.slice(-6),tac:[tacOf(f.h),tacOf(f.a)],ppl:Object.values(f.ppl).map(x=>[x.n,x.team,x.g])}))}; }
const tacOf=k=>(coachOf(k)&&coachOf(k).tac)||'canbang';
function stateView(pl){ const t=now(), md=mdNow(t), nx=LIVE&&LIVE.md===md?md+1:md+(t>=mdAt(md)?1:0), r=pl&&pl.prof?rec(pl.prof):null;
  return {season:ST.season,table:ranked().map(k=>[k,ST.table[k]]),live:liveView(),next:{md:nx,at:mdAt(nx),fx:fixtures(nx)},
    scorers:Object.entries(ST.scorers).sort((a,b)=>b[1].g-a[1].g).slice(0,8).map(([,s])=>[s.n,s.c,s.g]),coaches:Object.fromEntries(IDS.map(k=>[k,coachOf(k)?{n:coachOf(k).n,tac:coachOf(k).tac}:null])),
    stalls:Object.fromEntries(IDS.map(k=>[k,ST.stalls[k]&&ST.stalls[k].day===S.realTime().day?ST.stalls[k].n:''])),last:ST.last,
    me:r&&{club:r.club,role:r.role,sk:Math.round(r.sk*10)/10,apps:r.apps,goals:r.goals,fan:r.fan,stock:r.stock,paid:(pl.prof.daily.eplPaid||0),train:(pl.prof.daily.eplTrain||0),vend:(pl.prof.daily.eplVend||0),
      tix:LIVE?LIVE.fx.map(f=>f.tix[pl.uid]?f.tix[pl.uid].side:''):[]}}; }
const pushAll=()=>{ const v=liveView(); for(const q of sceneOf('epl')) send(q,{t:'epl',v}); };
hook('enter',(pl,id)=>{ if(id==='epl') setTimeout(()=>{ if(pl.prof) send(pl,{t:'epl',v:liveView(),full:stateView(pl)}); },400); });
/* ---------- vòng đấu ---------- */
function kickoff(md,t){ const at=mdAt(md); LIVE={md,at,end:at+E.dur*1000,fx:fixtures(md).map(([h,a])=>({h,a,sh:0,sa:0,heat:[0,0],ev:[],ppl:{},coach:{},tix:(PRE[md]||{})[h]||{},sold:{}}))}; delete PRE[md];
  for(const k of Object.keys(PRE)) if(+k<md) delete PRE[k];
  for(const q of sceneOf('epl')) note(q,`⚽ Vòng ${md%1000}: ${LIVE.fx.map(f=>`${CL[f.h].short}–${CL[f.a].short}`).join(' · ')} bắt đầu!`,'quest'); pushAll(); }
const PRE={};   /* vé mua trước cho vòng tới: md → sân → {uid:{side,n,cheers}} */
function strength(f,i,t){ const k=i?f.a:f.h, c=CL[k]; let R=c.rating+(i?0:MT.home)+Math.min(MT.heatMax,f.heat[i])/MT.heatPer;
  let hum=0; for(const x of Object.values(f.ppl)) if(x.team===i&&x.here>t-2500) hum+=MT.human[0]+x.sk/MT.human[1]; R+=Math.min(5,hum);
  const co=Object.values(f.coach).find(x=>x.team===i&&x.here>t-2500); if(co) R+=1+co.lv; return R; }
function goal(f,i,who,t){ if(i) f.sa++; else f.sh++; const k=i?f.a:f.h, min=Math.min(90,Math.max(1,Math.floor((t-LIVE.at)/(E.dur*1000)*90)));
  const ev=[min,i,who]; f.ev.push(ev); for(const q of sceneOf('epl')) send(q,{t:'eplgoal',h:f.h,a:f.a,team:i,who,min,sh:f.sh,sa:f.sa}); }
function tickMatch(t){ const L=LIVE, frac=E.dur;
  L.fx.forEach(f=>{ const B=E.block(f.h), Pt=E.pitch(f.h);
    for(const q of sceneOf('epl')){ const p=q.prof, r=rec(p), [x,y]=tileOf(q); if(!inRect(B,x,y)) continue;   /* ai đang ở trong sân đấu: cầu thủ trên mặt cỏ, HLV ở trong sân */
      const team=r.club===f.h?0:r.club===f.a?1:-1; if(team<0) continue;
      if(r.role==='player'&&inRect(Pt,x,y)){ if(!f.ppl[q.uid]) q.eplNext=Math.max(q.eplNext||0,t+12000);   /* vào sân 12 giây mới có cơ hội đầu tiên */ const o=f.ppl[q.uid]||(f.ppl[q.uid]={n:p.name,team,sk:r.sk,g:0,sec:0,here:0}); o.here=t; o.sec++; o.sk=r.sk;
        if(!q.eplCh&&t>=(q.eplNext||0)&&t<L.end-8000){ const id=t+'_'+q.pid; q.eplCh={id,until:t+MT.window*1000,fx:L.fx.indexOf(f),team}; q.eplNext=t+(MT.chance[0]+Math.random()*(MT.chance[1]-MT.chance[0]))*1000; send(q,{t:'eplch',id,until:q.eplCh.until,win:MT.window}); }
        if(q.eplCh&&t>q.eplCh.until) q.eplCh=null; }
      const co=coachOf(r.club); if(r.role==='coach'&&co&&co.uid===q.uid){ const o=f.coach[q.uid]||(f.coach[q.uid]={n:p.name,team,sec:0,here:0,lv:0}); o.here=t; o.sec++; o.lv=Math.min(2,r.apps/40); co.seen=t; } }
    const Rh=strength(f,0,t), Ra=strength(f,1,t), wh=Math.pow(Rh,5), wa=Math.pow(Ra,5), th=MT.tac[tacOf(f.h)]||MT.tac.canbang, ta=MT.tac[tacOf(f.a)]||MT.tac.canbang;
    const lh=MT.goalRate/frac*(2*wh/(wh+wa))*th.me*ta.opp/2, la=MT.goalRate/frac*(2*wa/(wh+wa))*ta.me*th.opp/2;   /* trung bình goalRate bàn / trận */
    if(Math.random()<lh) goal(f,0,CL[f.h].stars[Math.floor(Math.random()*5)],t); if(Math.random()<la) goal(f,1,CL[f.a].stars[Math.floor(Math.random()*5)],t);
    f.heat=f.heat.map(v=>Math.max(0,v-.08)); }); }   /* khán đài nguội dần nếu không ai cổ vũ */
// thưởng tiền / ngày gộp mọi vai: paidPerDay trận
const paidOk=p=>{ const d=p.daily; if((d.eplPaid||0)>=E.pay.paidPerDay) return false; d.eplPaid=(d.eplPaid||0)+1; return true; };
const qp=(pl,id,n=1,max)=>{ const p=pl.prof, q=S.QUESTS[id]; if(p.quests[id]!=='active'||!q) return; const pr=p.qprog=p.qprog||{}; pr[id]=Math.min(max||q.prog||1,(pr[id]||0)+n); markDirty(pl); };
function finish(t){ const L=LIVE; LIVE=null;
  for(const f of L.fx){ const T0=ST.table[f.h], T1=ST.table[f.a]; T0.p++; T1.p++; T0.gf+=f.sh; T0.ga+=f.sa; T1.gf+=f.sa; T1.ga+=f.sh;
    const res=f.sh>f.sa?0:f.sa>f.sh?1:-1; if(res===0){ T0.w++; T0.pts+=3; T1.l++; } else if(res===1){ T1.w++; T1.pts+=3; T0.l++; } else { T0.d++; T1.d++; T0.pts++; T1.pts++; }
    const big=new Set(['mci','liv','che']), arsWin=(f.h==='ars'&&res===0&&big.has(f.a))||(f.a==='ars'&&res===1&&big.has(f.h)), line=`${CL[f.h].short} ${f.sh}–${f.sa} ${CL[f.a].short}`;
    // cầu thủ: có mặt trên sân ≥ 60 giây
    for(const [uid,x] of Object.entries(f.ppl)){ const q=byUid.get(uid); if(!q||!q.prof||x.sec<60) continue; const p=q.prof, r=rec(p), won=res===x.team, PY=E.pay.player, paid=paidOk(p);
      r.apps++; p.needs.energy=Math.max(0,p.needs.energy-MT.energy); P.stat(q,'eplApps',1); const sp=ST.players[uid]||(ST.players[uid]={n:p.name,c:r.club,apps:0}); sp.apps++; sp.c=r.club;
      reward(q,{exp:PY.exp+x.g*PY.goalExp,vnd:paid?PY.wage+(won?PY.win:0)+x.g*PY.goal:0},`⚽ ${line} · ${won?'thắng':res<0?'hoà':'thua'}${x.g?` · bạn ghi ${x.g} bàn`:''}${paid?'':` (đủ ${E.pay.paidPerDay} trận có lương hôm nay)`}`);
      if(arsWin&&r.club==='ars') qp(q,'ars_big'); markDirty(q); }
    // HLV: có mặt ở sân ≥ 60 giây
    for(const [uid,x] of Object.entries(f.coach)){ const q=byUid.get(uid); if(!q||!q.prof||x.sec<60) continue; const p=q.prof, r=rec(p), won=res===x.team, CO=E.pay.coach, paid=paidOk(p);
      r.apps++; reward(q,{exp:CO.exp,vnd:paid?CO.wage+(won?CO.win:0):0},`📋 HLV ${CL[r.club].name}: ${line}${paid?'':' (hết lượt có lương hôm nay)'}`); if(won&&r.club==='ars') qp(q,'ars_coach'); if(arsWin&&r.club==='ars') qp(q,'ars_big'); markDirty(q); }
    // cổ động viên có vé: cổ vũ đủ số lần
    for(const [uid,x] of Object.entries(f.tix)){ const q=byUid.get(uid); if(!q||!q.prof) continue; const p=q.prof, FA=E.pay.fan, side=x.side==='a'?1:0, club=side?f.a:f.h, won=res===side;
      P.stat(q,'eplFan',1); const sf=ST.fans[uid]||(ST.fans[uid]={n:p.name,c:club,att:0}); sf.att++; sf.c=club;
      if(x.cheers<FA.cheers){ reward(q,{exp:Math.round(FA.exp/2)},`🎟 ${line}: cổ vũ ít quá (${x.cheers}/${FA.cheers} lần)`); continue; }
      const paid=won&&paidOk(p); reward(q,{exp:FA.exp+(won?10:0),vnd:paid?FA.win:0},`📣 ${line}${won?` · đội ${CL[club].short} thắng! Cháy cùng đội: EXP ×${FA.buff.mul} trong ${FA.buff.min} phút`:''}`);
      if(won) p.ebuff={mul:FA.buff.mul,until:t+FA.buff.min*60e3}; if(club==='ars') qp(q,'ars_fan',1,2); if(arsWin&&club==='ars') qp(q,'ars_big'); markDirty(q); } }
  ST.last={md:L.md,res:L.fx.map(f=>[f.h,f.sh,f.sa,f.a])}; save();
  for(const q of sceneOf('epl')) send(q,{t:'epl',v:null,full:stateView(q)}); }
/* ---------- hết tuần: trao thưởng mùa giải ---------- */
function payPend(uid,vnd,exp,msg,champ){ const q=byUid.get(uid); if(q&&q.prof){ reward(q,{vnd,exp},msg); if(champ) P.stat(q,'eplChamp',1); return; } (ST.pend[uid]=ST.pend[uid]||[]).push({vnd,exp,msg,champ:champ?1:0}); }
function seasonEnd(){ const champ=ranked()[0], SE=E.season, c=CL[champ], lines=[];
  for(const [uid,x] of Object.entries(ST.players)) if(x.c===champ&&x.apps>=3){ payPend(uid,SE.player,300,`🏆 ${c.name} vô địch Ngoại Hạng Anh tuần ${ST.season}! Thưởng cầu thủ`,1); lines.push(x.n); }
  const co=coachOf(champ); if(co) payPend(co.uid,SE.coach,500,`🏆 HLV vô địch Ngoại Hạng Anh cùng ${c.name}!`,1);
  for(const [uid,x] of Object.entries(ST.fans)) if(x.c===champ&&x.att>=SE.fanMin) payPend(uid,SE.fan,150,`🏆 ${c.name} vô địch! Thưởng cổ động viên đi xem ${x.att} trận`);
  const top=Object.entries(ST.scorers).sort((a,b)=>b[1].g-a[1].g)[0]; if(top&&top[1].g>=SE.bootMin) payPend(top[0],SE.boot,300,`👟 Chiếc giày vàng tuần ${ST.season}: ${top[1].g} bàn`);
  require('./world').sysChat(`🏆 ${c.name} vô địch Ngoại Hạng Anh tuần ${ST.season} (${ST.table[champ].pts} điểm)${lines.length?' · cầu thủ: '+lines.slice(0,5).join(', '):''}${top&&top[1].g>=SE.bootMin?` · Vua phá lưới ${top[1].n} ${top[1].g} bàn`:''}`);
  Object.assign(ST,{season:weekOf(),table:blankTable(),scorers:{},players:{},fans:{}}); save(); }
hook('login',pl=>{ const L=ST.pend[pl.uid]; if(!L) return; delete ST.pend[pl.uid]; save(); setTimeout(()=>{ if(!pl.prof) return; for(const x of L){ reward(pl,{vnd:x.vnd,exp:x.exp},x.msg); if(x.champ) P.stat(pl,'eplChamp',1); } },3000); });
setInterval(()=>{ try{ const t=now();
  if(weekOf()!==ST.season&&!LIVE) seasonEnd();
  if(LIVE&&t>=LIVE.end) finish(t);
  if(!LIVE){ const md=mdNow(t); if(t<mdAt(md)+E.dur*1000-15000&&(!ST.last||ST.last.md!==md)) kickoff(md,t); }
  if(LIVE){ tickMatch(t); if(t%3000<1000) pushAll(); } }catch(e){ console.error('[epl]',e); } },1000);
/* ---------- thao tác ---------- */
const nearMgr=(pl,k)=>P.nearNpc(pl,'epl_mgr_'+k), nearShop=(pl,k)=>P.nearNpc(pl,'epl_shop_'+k);
on('epl',(pl,m)=>{ const p=pl.prof, r=rec(p), op=m.op, t=now(), k=String(m.club||''); if(pl.scene!=='epl') return {err:'Bay sang Ngoại Hạng Anh đã (Grab)'};
  if(op==='view') return {v:stateView(pl)};
  if(op==='dbgkick'&&process.env.CHAN_TEST==='1'){ if(LIVE) finish(t); const md=mdNow(t); kickoff(md,t); LIVE.at=t; LIVE.end=t+(m.dur||40)*1000; pushAll(); return {v:stateView(pl)}; }   /* chỉ server test: đá ngay 1 vòng ngắn */
  if(op==='dbgepl'&&process.env.CHAN_TEST==='1'){ if(m.sk!=null) r.sk=+m.sk; if(m.apps!=null) r.apps=m.apps|0; markDirty(pl); return {v:stateView(pl)}; }
  if(op==='sign'){ if(!CL[k]) return {err:'?'}; if(!nearMgr(pl,k)) return {err:`Gặp Giám đốc ${CL[k].name} trước cổng sân ${CL[k].stadium}`}; if((p.level||1)<E.contract.lv) return {err:`Từ cấp ${E.contract.lv} mới ký hợp đồng cầu thủ được`};
    if(r.role==='coach') return {err:'Đang là HLV: từ chức trước đã'}; if(r.club===k&&r.role==='player') return {err:'Bạn đã là cầu thủ CLB này'};
    if(r.club&&r.club!==k&&r.role==='player'){ if(t-(r.signedAt||0)<E.contract.cd*3600e3) return {err:`Vừa ký hợp đồng, ${Math.ceil((E.contract.cd*3600e3-(t-r.signedAt))/3600e3)} giờ nữa mới chuyển CLB được`};
      if(!take(pl,E.contract.transfer)) return {err:`Phí chuyển nhượng ${fmt(E.contract.transfer)}`}; }
    Object.assign(r,{club:k,role:'player',signedAt:t}); markDirty(pl); return {msg:`✍ Đã ký hợp đồng cầu thủ ${CL[k].name}! Có trận của ${CL[k].short} thì vào mặt cỏ sân đó đứng đá`,v:stateView(pl)}; }
  if(op==='release'){ if(r.role!=='player') return {err:'Bạn chưa có hợp đồng'}; Object.assign(r,{role:'',club:''}); markDirty(pl); return {msg:'Đã thanh lý hợp đồng, thành cầu thủ tự do',v:stateView(pl)}; }
  if(op==='coach'){ if(!CL[k]) return {err:'?'}; if(!nearMgr(pl,k)) return {err:`Gặp Giám đốc ${CL[k].name}`}; const RQ=E.coachReq;
    if(!p.skills[RQ.course]) return {err:`Cần ${S.COURSES[RQ.course].name} (học bằng laptop ở phòng)`}; if(r.sk<RQ.sk||r.apps<RQ.apps) return {err:`Cần chỉ số Sút bóng ${RQ.sk} và ${RQ.apps} trận đã đá (bạn: ${Math.floor(r.sk)} · ${r.apps} trận)`};
    const co=coachOf(k); if(co&&co.uid!==pl.uid&&t-(co.seen||0)<72*3600e3) return {err:`${co.n} đang ngồi ghế HLV ${CL[k].name}`};
    for(const x of IDS) if(coachOf(x)&&coachOf(x).uid===pl.uid&&x!==k) delete ST.coaches[x];
    ST.coaches[k]={uid:pl.uid,n:p.name,seen:t,tac:'canbang'}; Object.assign(r,{club:k,role:'coach'}); save(); markDirty(pl); return {msg:`📋 Bạn là HLV trưởng ${CL[k].name}! Chọn chiến thuật, có trận thì vào sân chỉ đạo`,v:stateView(pl)}; }
  if(op==='resign'){ if(r.role!=='coach') return {err:'Bạn không phải HLV'}; if(coachOf(r.club)&&coachOf(r.club).uid===pl.uid) delete ST.coaches[r.club]; Object.assign(r,{role:'',club:''}); save(); markDirty(pl); return {msg:'Đã từ chức HLV',v:stateView(pl)}; }
  if(op==='tactic'){ const co=coachOf(r.club); if(r.role!=='coach'||!co||co.uid!==pl.uid) return {err:'Chỉ HLV trưởng chọn chiến thuật'}; if(!MT.tac[m.k]) return {err:'?'}; co.tac=m.k; save(); return {msg:`Chiến thuật: ${MT.tac[m.k].name}`,v:stateView(pl)}; }
  if(op==='fan'){ if(!CL[k]) return {err:'?'}; if(!nearShop(pl,k)) return {err:'Tới quầy vé & áo đấu trước cổng sân'}; r.fan=k; markDirty(pl); return {msg:`💙 Bạn là cổ động viên ${CL[k].name}`,v:stateView(pl)}; }
  if(op==='kit'){ if(!CL[k]) return {err:'?'}; if(!nearShop(pl,k)) return {err:'Tới quầy vé & áo đấu trước cổng sân'}; const id='kit_'+k;
    if(!p.owned[id]){ if(!shopPay(pl,E.kitPrice)) return {err:`Áo đấu ${fmt(E.kitPrice)}`}; p.owned[id]=1; }
    if(p.look){ p.look.outfit={...p.look.outfit,top:id}; C.refreshInfo(pl); } if(k==='ars') qp(pl,'ars_kit'); markDirty(pl); return {msg:`👕 Đã mặc ${S.CLOTHES[id].name}`,look:p.look}; }
  if(op==='ticket'){ if(!CL[k]) return {err:'?'}; if(!nearShop(pl,k)) return {err:'Tới quầy vé trước cổng sân'}; const side=m.side==='a'?'a':'h';
    const md=mdNow(t), live=LIVE&&LIVE.fx.find(f=>f.h===k), nx=LIVE?LIVE.md+1:(t>=mdAt(md)+E.dur*1000-15000?md+1:md), nf=fixtures(nx).find(([h])=>h===k);
    let bag=null, f0=null; if(live&&t<LIVE.end-30000){ bag=live.tix; f0=[live.h,live.a]; } else if(nf){ bag=((PRE[nx]=PRE[nx]||{})[k]=PRE[nx][k]||{}); f0=nf; }
    if(!bag){ const where=fixtures(nx).map(([h,a])=>`${CL[h].short}–${CL[a].short} ở ${CL[h].stadium}`).join(' · '); return {err:`Vòng tới sân này không có trận. Vòng tới: ${where}`}; }
    if(bag[pl.uid]) return {err:'Bạn đã có vé trận này'}; if(!take(pl,E.pay.fan.ticket)) return {err:`Vé ${fmt(E.pay.fan.ticket)}`};
    bag[pl.uid]={side,n:p.name,cheers:0}; const club=side==='a'?f0[1]:f0[0]; return {msg:`🎟 Vé ${CL[f0[0]].short}–${CL[f0[1]].short}, khán đài ${CL[club].short}. Vào sân bấm E cổ vũ (đủ ${E.pay.fan.cheers} lần)`,v:stateView(pl)}; }
  if(op==='cheer'){ const [x,y]=tileOf(pl), at=E.clubAt(x,y), f=at&&LIVE&&LIVE.fx.find(f=>f.h===at); if(!f) return {err:'Sân này đang không có trận'}; const tk=f.tix[pl.uid]; if(!tk) return {err:'Chưa có vé trận này (mua ở quầy vé trước cổng)'};
    if(t<(pl.eplCheerAt||0)) return {}; pl.eplCheerAt=t+4000; const side=tk.side==='a'?1:0, club=side?f.a:f.h, kit=p.look&&p.look.outfit&&p.look.outfit.top==='kit_'+club;
    f.heat[side]=Math.min(MT.heatMax,f.heat[side]+(kit?1.5:1)); tk.cheers++; for(const q of sceneOf('epl')) send(q,{t:'eplcheer',pid:pl.pid,club,kit:kit?1:0}); return {cheers:tk.cheers,heat:Math.round(f.heat[side])}; }
  if(op==='shot'){ const ch=pl.eplCh; if(!ch||ch.id!==m.id||t>ch.until+800||!LIVE) return {ok:false}; pl.eplCh=null; const f=LIVE.fx[ch.fx], x=f&&f.ppl[pl.uid]; if(!x) return {ok:false};
    const q=Math.max(0,Math.min(1,+m.q||0)), pr=Math.max(.05,Math.min(.8,.12+.4*q+r.sk/300)); if(Math.random()>=pr){ send(pl,{t:'eplmiss'}); return {ok:true,goal:false}; }
    x.g++; r.goals++; P.stat(pl,'goals',1); const sc=ST.scorers[pl.uid]||(ST.scorers[pl.uid]={n:p.name,c:r.club,g:0}); sc.g++; sc.c=r.club; save(); if(r.club==='ars') qp(pl,'ars_goal',1,3);
    goal(f,ch.team,p.name,t); markDirty(pl); return {ok:true,goal:true}; }
  if(op==='train'){ const [x,y]=tileOf(pl), at=E.clubAt(x,y); if(!at||!inRect(E.pitch(at),x,y)) return {err:'Ra chấm phạt đền trên mặt cỏ để tập sút'}; if(LIVE&&LIVE.fx.some(f=>f.h===at)) return {err:'Sân đang có trận, tập ở sân khác'};
    const TR=E.train, d=p.daily; if((d.eplTrain||0)>=TR.perDay) return {err:`Hôm nay tập đủ ${TR.perDay} buổi rồi`}; if(t<(pl.eplTrainAt||0)) return {err:`Nghỉ ${Math.ceil((pl.eplTrainAt-t)/1000)} giây rồi sút tiếp`};
    if(p.needs.energy<TR.energy) return {err:'Hết sức rồi, ăn uống / ngủ nghỉ đã'}; pl.eplTrainAt=t+TR.cd*1000; d.eplTrain=(d.eplTrain||0)+1; p.needs.energy-=TR.energy;
    const q=Math.max(0,Math.min(1,+m.q||0)), g=(TR.gain[0]+(TR.gain[1]-TR.gain[0])*r.sk/100)*(.4+.6*q), goalIn=Math.random()<.25+.65*q; r.sk=Math.min(100,r.sk+g);
    reward(pl,{exp:TR.exp},`🥅 ${goalIn?'VÀO!':'Trượt!'} Sút bóng ${Math.floor(r.sk)} (+${g.toFixed(1)})`); markDirty(pl); return {goal:goalIn,sk:r.sk,v:stateView(pl)}; }
  // bán hàng: thuê sạp, nhập hàng, rao bán
  if(op==='rent'){ if(!CL[k]) return {err:'?'}; const sp=E.stall(k); if(!near(pl,sp.x,sp.y,48)) return {err:'Đứng cạnh sạp hàng trước cổng sân'}; const day=S.realTime().day, cur=ST.stalls[k];
    if(cur&&cur.day===day) return {err:cur.uid===pl.uid?'Sạp này bạn thuê rồi':`${cur.n} đã thuê sạp này hôm nay`}; for(const x of IDS) if(ST.stalls[x]&&ST.stalls[x].uid===pl.uid&&ST.stalls[x].day===day) return {err:'Hôm nay bạn đã thuê 1 sạp rồi'};
    if(!take(pl,E.vendor.rent)) return {err:`Thuê sạp ${fmt(E.vendor.rent)}/ngày`}; ST.stalls[k]={uid:pl.uid,n:p.name,day,sold:{}}; save(); return {msg:`🛒 Đã thuê sạp trước sân ${CL[k].stadium} hôm nay. Nhập hàng ở Tổng kho (quảng trường), có trận ở sân này thì bán được giá`,v:stateView(pl)}; }
  if(op==='stock'){ const g=E.vendor.goods[m.k], n=Math.max(1,Math.min(20,m.n|0||1)); if(!g) return {err:'?'}; if(!P.nearNpc(pl,'epl_kho')) return {err:'Gặp ông Tony ở Tổng kho quảng trường'};
    const have=Object.values(r.stock).reduce((a,v)=>a+v,0); if(have+n>E.vendor.maxStock) return {err:`Sạp chứa tối đa ${E.vendor.maxStock} món`}; if(!shopPay(pl,g.cost*n)) return {err:`${n} ${g.name}: ${fmt(g.cost*n)}`};
    r.stock[m.k]=(r.stock[m.k]||0)+n; markDirty(pl); return {msg:`Nhập ${n} ${g.name}`,v:stateView(pl)}; }
  if(op==='sell'){ const day=S.realTime().day, k2=IDS.find(x=>ST.stalls[x]&&ST.stalls[x].uid===pl.uid&&ST.stalls[x].day===day); if(!k2) return {err:'Chưa thuê sạp hôm nay'}; const sp=E.stall(k2); if(!near(pl,sp.x,sp.y,48)) return {err:'Về đứng ở sạp của bạn'};
    const V=E.vendor; if(t<(pl.eplSellAt||0)) return {}; const ks=Object.keys(r.stock).filter(x=>r.stock[x]>0); if(!ks.length) return {err:'Hết hàng, nhập thêm ở Tổng kho'};
    if((p.daily.eplVend||0)>=V.dailyCap) return {err:`Hôm nay lãi đủ ${fmt(V.dailyCap)} rồi, mai bán tiếp`};
    const f=LIVE&&LIVE.fx.find(f=>f.h===k2), key=f?LIVE.md+':'+k2:'idle:'+mdNow(t), st=ST.stalls[k2], n0=(st.sold[key]||0); if(n0>=(f?V.perMatch:V.perIdle)) return {err:f?'Khán giả trận này mua đủ rồi':'Giờ vắng khách, đợi có trận ở sân này'};
    pl.eplSellAt=t+V.cd*1000; const gk=ks[Math.floor(Math.random()*ks.length)], g=V.goods[gk], heat=f?(f.heat[0]+f.heat[1])/(2*MT.heatMax):0, mul=f?V.mul[0]+(V.mul[1]-V.mul[0])*Math.min(1,heat+.25):V.quiet;
    const price=Math.round(g.cost*mul/1000)*1000, gain=Math.min(price-g.cost,V.dailyCap-(p.daily.eplVend||0)); r.stock[gk]--; st.sold[key]=n0+1; for(const x of Object.keys(st.sold)) if(x!==key) delete st.sold[x];
    p.daily.eplVend=(p.daily.eplVend||0)+Math.max(0,gain); give(pl,g.cost+Math.max(0,gain)); markDirty(pl); return {msg:`Bán ${g.name} giá ${fmt(price)} (lãi ${fmt(Math.max(0,gain))})`,v:stateView(pl)}; }
  return {err:'?'}; });
// reset server (reset.js): bỏ tài khoản bị reset khỏi bảng mùa giải, ghế HLV, sạp hàng, thưởng chờ
hook('reset',gone=>{ for(const o of [ST.scorers,ST.players,ST.fans,ST.pend]) for(const u of Object.keys(o)) if(gone(u)) delete o[u]; for(const k of IDS){ if(ST.coaches[k]&&gone(ST.coaches[k].uid)) delete ST.coaches[k]; if(ST.stalls[k]&&gone(ST.stalls[k].uid)) delete ST.stalls[k]; } save(); });
// rời map / thoát: bỏ cơ hội dứt điểm đang chờ
hook('leave',(pl,old)=>{ if(old==='epl') pl.eplCh=null; });
module.exports={ST,stateView};
