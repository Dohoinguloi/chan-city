// Khu mở rộng quanh Ké: thuê xe máy (cạnh Shop Chande), vườn quốc gia (vé, trạm quan sát thú, quyên góp),
// bảo tàng lịch sử, chùa (thắp hương, công đức, xin quẻ), tiệm net. "Hiểu biết" là chỉ số stats.know.
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
const {S,on,hook,now,today,near,markDirty,reward,take,give,send,players}=C;
const fmt=S.fmt, T=S.T;
const at=(pl,k,r=56)=>{ const pc=S.PLACES[k]; return (pc.scene&&pl.scene===pc.scene)||pl.scene==='retreat'&&near(pl,pc.x,pc.y,r); };
const know=(pl,n)=>P.stat(pl,'know',n);

/* ---------- xe máy thuê ---------- */
// gara: các xe đã thuê mà chưa dùng {mẫu: hết giờ}; p.moto là xe đang chọn
const garage=p=>{ const G=p.garage=p.garage||{}, t=now(); for(const k in G) if(!(G[k]>t)) delete G[k]; return G; };
const motoOk=pl=>{ const m=pl.prof.moto; return m&&m.until>now()&&S.MOTO.models[m.model]; };
on('moto',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='rent'){ const M=S.MOTO.models[m.model]; if(!M) return {err:'?'}; if(!P.nearNpc(pl,'thuexe')&&!at(pl,'thuexe')) return {err:'Thuê xe ở tiệm cạnh Shop Chande'};
    if(!take(pl,M.price)) return {err:`Thuê ${fmt(M.price)}/giờ, không đủ tiền`}; const G=garage(p);
    if(p.moto&&p.moto.until>t&&p.moto.model!==m.model) G[p.moto.model]=p.moto.until;                                   // thuê mẫu khác: xe đang thuê cất vào gara, không mất giờ
    const base=Math.max(t,p.moto&&p.moto.model===m.model?p.moto.until:0,G[m.model]||0); delete G[m.model];
    p.moto={model:m.model,until:base+S.MOTO.min*60e3}; markDirty(pl); return {moto:p.moto}; }
  if(m.op==='pick'){ const G=garage(p), u=p.moto&&p.moto.model===m.model?p.moto.until:G[m.model]; if(!S.MOTO.models[m.model]||!(u>t)) return {err:'Chưa thuê xe này hoặc đã hết giờ'};   // chọn xe trong gara để đi
    if(pl.csgt) return {err:'Đang bị CSGT kiểm tra'}; if(p.moto&&p.moto.model!==m.model){ if(p.moto.until>t) G[p.moto.model]=p.moto.until; p.moto={model:m.model,until:u}; delete G[m.model]; }
    if(pl.moto) pl.moto=m.model; markDirty(pl); return {moto:p.moto,riding:!!pl.moto}; }
  if(m.op==='mount'){ if(pl.scene!=='retreat'&&pl.scene!=='dalat') return {err:'Chỉ chạy xe ngoài đường (Ké, thị trấn, Đà Lạt)'}; if(!motoOk(pl)) return {err:'Chưa thuê xe hoặc hết giờ thuê. Thuê ở tiệm cạnh Shop Chande'};
    if(pl.kayak||pl.fishing||pl.riding||pl.optimus) return {err:'Đang bận'}; if(pl.csgt) return {err:'Đang bị CSGT kiểm tra'}; pl.moto=p.moto.model; return {model:pl.moto}; }
  if(m.op==='bike'){ const st=S.BIKESHARE.stations.find(s=>s.map===pl.scene&&near(pl,s.x,s.y,56)); if(!st) return {err:'Ra trạm xe đạp công cộng cạnh bến xe buýt'};
    if(p.moto&&p.moto.until>t&&p.moto.model!=='xedap'){ if(pl.moto) return {err:'Xuống xe máy đã'}; garage(p)[p.moto.model]=p.moto.until; } const M=S.MOTO.models.xedap; if(!take(pl,M.price)) return {err:`Thuê xe đạp ${fmt(M.price)}/${S.BIKESHARE.min} phút`};
    const keep=p.moto&&p.moto.model==='xedap'&&p.moto.until>t; p.moto={model:'xedap',until:(keep?p.moto.until:t)+S.BIKESHARE.min*60e3}; markDirty(pl); return {moto:p.moto}; }
  if(m.op==='helmet'){ if(p.helmet) return {err:'Bạn có mũ bảo hiểm rồi'}; if(!P.nearNpc(pl,'thuexe')&&!at(pl,'thuexe')) return {err:'Mua mũ ở tiệm thuê xe'};
    if(!shopPay(pl,S.MOTO.helmet)) return {err:`Mũ bảo hiểm ${fmt(S.MOTO.helmet)}, không đủ tiền`}; p.helmet=true; markDirty(pl); return {msg:'Đã mua mũ bảo hiểm. Lên xe là tự đội, khỏi lo CSGT phạt lỗi mũ!'}; }
  if(m.op==='dismount'){ pl.moto=null; pl.speeding=false; return {}; }
  if(m.op==='speed'){ const on_=!!m.on&&!!pl.moto&&pl.moto!=='xedap'; if(on_&&!pl.speeding) pl.speedAt=now(); pl.speeding=on_; return {}; }
  return {err:'?'}; });
hook('leave',pl=>{ pl.moto=null; });

/* ---------- cảnh sát giao thông: lập chốt / đi tuần trên đường ven hồ ---------- */
const CG=S.CSGT; let POST=null, nextPost=now()+40e3;
const postView=()=>POST&&{x:POST.x,y:POST.y,kind:POST.kind,dir:POST.dir,until:POST.until,hp:POST.hp,ko:POST.ko>now(),wreck:!!POST.wreck};
const pushPost=()=>C.broadcastScene('retreat',{t:'csgt',post:postView()});
const stopView=c=>!c?null:c.type==='helmet'||c.type==='speed'?{type:c.type,fine:c.fine,bribe:c.bribe}:{type:'quiz',i:c.i,n:c.qs.length,wrong:c.wrong,q:CG.Q[c.qs[c.i]][0],opts:CG.Q[c.qs[c.i]][1]};
const sendStop=pl=>send(pl,{t:'csgt',stop:stopView(pl.csgt)});
// không đủ tiền nộp phạt thì về đồn tạm giữ 1 phút
function fineOrJail(pl,v){ if(take(pl,v)){ P.stat(pl,'fine',v); return true; } const p=pl.prof; p.money=0; p.jail={until:now()+60e3,fine:v}; pl.csgt=null; pl.moto=null; send(pl,{t:'moto',off:true}); markDirty(pl); P.stat(pl,'jail',1); C.moveTo(pl,'doncongan',7,6); return false; }
function stopCheck(pl){ const p=pl.prof; pl.csgtAt=now();
  if(pl.speeding){ pl.speeding=false; pl.csgt={type:'speed',fine:C.fineOf(pl,CG.speed.fine),bribe:C.fineOf(pl,CG.speed.bribe),at:now()}; P.stat(pl,'csgt',1); send(pl,{t:'ev',k:'csgtStop'}); sendStop(pl); return; }
  if(!p.helmet) pl.csgt={type:'helmet',fine:C.fineOf(pl,CG.fine),bribe:C.fineOf(pl,CG.bribe),at:now()};   /* phạt theo ví: data.js fineOf */
  else if(Math.random()<CG.quiz) pl.csgt={type:'quiz',qs:[...CG.Q.keys()].sort(()=>Math.random()-.5).slice(0,CG.n),i:0,wrong:0,at:now()};
  else { C.note(pl,'CSGT kiểm tra: mũ bảo hiểm đội đúng, giấy tờ đủ. "Mời đi tiếp, chú ý an toàn nhé!"','item'); return; }
  P.stat(pl,'csgt',1); send(pl,{t:'ev',k:'csgtStop'}); sendStop(pl); }   /* bị CSGT bắt dừng xe (thành tựu) */
function impound(pl){ const p=pl.prof, md=pl.moto||(p.moto&&p.moto.model)||'wave'; p.impound={model:md,left:Math.max(0,(p.moto&&p.moto.until||0)-now()),fee:C.fineOf(pl,CG.impound)}; p.moto=null; pl.moto=null;
  send(pl,{t:'moto',off:true}); C.broadcastScene('retreat',{t:'ev',k:'impound',id:pl.pid,x:pl.x,y:pl.y,model:md}); markDirty(pl); }
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'csgt',post:postView()}); });
hook('slow',()=>{ const t=now();
  if(!POST&&t>=nextPost){ POST={kind:Math.random()<.5?'chot':'tuan',x:CG.x[0]+Math.random()*(CG.x[1]-CG.x[0]),y:CG.y,dir:Math.random()<.5?-1:1,until:t+CG.stay*1000,hp:CG.riot.truckHp,ko:0}; pushPost(); }
  if(!POST) return;
  if(t>=POST.until){ POST=null; nextPost=t+(CG.every[0]+Math.random()*(CG.every[1]-CG.every[0]))*1000; pushPost(); return; }
  if(POST.wreck||POST.ko>t) return;   /* xe nát / chú CSGT bị hạ: chốt không chặn ai */
  if(POST.kind==='tuan'){ POST.x+=POST.dir*1.2; if(POST.x<CG.x[0]||POST.x>CG.x[1]) POST.dir*=-1; pushPost(); }      // xe tuần chạy chậm dọc đường
  for(const pl of C.sceneOf('retreat')) if(pl.moto&&pl.moto!=='xedap'&&!pl.csgt&&(pl.speeding?near(pl,POST.x,POST.y,CG.speed.sight*T):!(pl.csgtAt>t-CG.cool*1000)&&near(pl,POST.x,POST.y,CG.r+(POST.kind==='tuan'?16:0)))) stopCheck(pl); });
// phóng nhanh: cứ vài giây xét xoè xe; bị giữ quá 2 phút (mất mạng, không bấm) thì CSGT cho đi
hook('slow',()=>{ const t=now(), Sp=CG.speed;
  for(const pl of players.values()){
    if(pl.csgt&&pl.csgt.at&&t-pl.csgt.at>120e3){ pl.csgt=null; sendStop(pl); C.note(pl,'CSGT nhắc nhở rồi cho đi','item'); }
    if(!pl.speeding||!pl.moto) continue; if(t-(pl.speedAt||t)<Sp.every*1000) continue; pl.speedAt=t;
    if(Math.random()<Sp.crash){ const p=pl.prof, md=pl.moto; pl.moto=null; pl.speeding=false; p.needs.energy=Math.max(0,p.needs.energy-Sp.energy); if(!take(pl,Sp.repair)) p.money=0; markDirty(pl);
      send(pl,{t:'moto',off:true}); C.broadcastScene(pl.scene,{t:'ev',k:'crash',id:pl.pid,x:pl.x,y:pl.y,model:md,face:pl.face||1});
      C.note(pl,`Xoè xe! Trầy hết cả chân, mất ${fmt(Sp.repair)} sửa xe, -${Sp.energy} năng lượng. Bấm H lên xe đi tiếp (chậm thôi!)`,'lock'); } } });
on('csgt',(pl,m)=>{ const c=pl.csgt, p=pl.prof;
  if(m.op==='redeem'){ const im=p.impound; if(!im) return {err:'Không có xe nào bị tạm giữ'}; if(!P.nearNpc(pl,'congan',80)) return {err:'Lên đồn công an Đà Bắc nộp phạt'};
    if(!take(pl,im.fee)) return {err:`Nộp ${fmt(im.fee)} mới lấy lại xe`}; p.moto={model:im.model,until:now()+Math.max(10*60e3,im.left)}; p.impound=null; markDirty(pl); return {msg:'Đã nộp phạt, xe được trả lại. Ra đường bấm H để lên xe.'}; }
  if(!c) return {err:'Không bị chặn'};
  if(c.type==='helmet'||c.type==='speed'){
    if(m.op==='pay'){ pl.csgt=null; if(!fineOrJail(pl,c.fine)) return {jail:true,msg:'Không đủ tiền nộp phạt, bị đưa về đồn tạm giữ'}; sendStop(pl); return {msg:c.type==='speed'?`Nộp phạt ${fmt(c.fine)} lỗi phóng nhanh vượt ẩu. Đi chậm thôi!`:`Nộp phạt ${fmt(c.fine)} lỗi không đội mũ bảo hiểm. Mua mũ ở tiệm thuê xe nhé!`}; }
    if(m.op==='bribe'){ pl.csgt=null;
      if(Math.random()<CG.bribeOk&&take(pl,c.bribe)){ sendStop(pl); return {ok:true,msg:c.type==='speed'?'Chú CSGT nhét tiền vào túi: "Lần sau đi chậm thôi nhé!"':'Chú CSGT liếc quanh rồi nhét tiền vào túi: "Lần sau nhớ đội mũ nhé!"'}; }
      const total=c.fine+CG.extra; if(!fineOrJail(pl,total)) return {jail:true,msg:'CSGT từ chối hối lộ, không đủ tiền phạt nên bị đưa về đồn'}; sendStop(pl);
      return {ok:false,msg:`CSGT từ chối: "Định hối lộ người thi hành công vụ à?" Phạt ${fmt(total)} (thêm ${fmt(CG.extra)})`}; } }
  if(c.type==='quiz'&&m.op==='answer'){ const Q=CG.Q[c.qs[c.i]], right=(m.a|0)===Q[2], res={right,correct:Q[1][Q[2]],fine:right?0:CG.wrongFine};
    if(!right){ c.wrong++; if(!take(pl,CG.wrongFine)) p.money=0; markDirty(pl); } c.i++;
    if(c.i<c.qs.length){ sendStop(pl); return res; }
    pl.csgt=null; sendStop(pl); res.done=true; res.wrong=c.wrong; if(c.wrong>=c.qs.length){ impound(pl); res.impound=true; } else reward(pl,{exp:5*(c.qs.length-c.wrong)},'Trả lời luật giao thông'); return res; }
  return {err:'?'}; });
hook('logout',pl=>{ pl.csgt=null; });

/* ---------- Optimus Prime: xe đầu kéo đỗ cạnh xe Chika Phú, chỉ Kaixa biến hình ---------- */
const OP=S.OPTIMUS; let OPT=0;
const pushOpt=()=>C.broadcastScene('retreat',{t:'optimus',on:OPT});
const isKaixa=pl=>String(pl.prof.name||'').toLowerCase()===OP.owner;
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'optimus',on:OPT}); });
on('optimus',(pl,m)=>{ if(!isKaixa(pl)) return {err:'Chỉ Kaixa mới biến hình được Optimus Prime'}; if(pl.scene!=='retreat') return {err:'Biến hình ở Ké Retreat'};
  if(m.op==='robot'){ if(!pl.optimus&&!near(pl,OP.park.x,OP.park.y,72)) return {err:'Ra chỗ xe Optimus đỗ cạnh xe Chika Phú'}; if(pl.moto||pl.riding||pl.pcar||pl.incar||pl.kayak) return {err:'Xuống xe đã'}; pl.optimus='robot'; }
  else if(m.op==='truck'){ if(!pl.optimus) return {err:'Biến hình robot trước'}; pl.optimus='truck'; }
  else if(m.op==='megatron') return megaSummon(pl);
  else if(m.op==='mhit') return megaHit(pl,m.kind);
  else if(m.op==='smash'||m.op==='punch'){ const R=CG.riot, t=now(); if(pl.optimus!=='robot') return {err:'Biến robot đã'}; if(!POST) return {err:'Không có CSGT nào quanh đây'}; if(t-(pl.riotAt||0)<R.cd) return {};
    pl.riotAt=t; const tx=POST.kind==='chot'?POST.x+2.1:POST.x, ty=POST.kind==='chot'?POST.y-1.4:POST.y;
    if(m.op==='smash'){ if(POST.wreck) return {err:'Xe nát bét rồi'}; if(!near(pl,tx,ty,64)) return {err:'Lại gần xe CSGT đã'}; POST.hp--; if(POST.hp<=0){ POST.wreck=true; POST.until=t+R.wreck*1000; } }
    else { if(POST.kind!=='chot') return {err:'Xe tuần không có ai đứng ngoài'}; if(POST.ko>t) return {err:'Chú CSGT nằm đo đất rồi'}; if(!near(pl,POST.x,POST.y,48)) return {err:'Lại gần chú CSGT đã'}; POST.ko=t+R.ko*1000; }
    pushPost(); C.broadcastScene('retreat',{t:'ev',k:'riot',op:m.op,id:pl.pid,x:m.op==='smash'?tx:POST.x,y:m.op==='smash'?ty:POST.y,hp:POST.hp,wreck:!!POST.wreck});
    if(Math.random()<(m.op==='smash'?R.smashJail:R.punchJail)){ const p=pl.prof; pl.optimus=null; if(OPT===pl.pid){ OPT=0; pushOpt(); } p.jail={until:t+R.jail*1000,fine:C.fineOf(pl,R.fine),why:'Optimus Prime phá xe, hành hung CSGT'}; markDirty(pl); P.stat(pl,'jail',1);
      C.broadcastScene('retreat',{t:'ev',k:'arrest',id:pl.pid,name:p.name}); C.moveTo(pl,'doncongan',7,6); return {arrested:true,msg:`Bị lực lượng cơ động khống chế! Tạm giữ ${R.jail} giây, nộp ${fmt(p.jail.fine)} để về sớm`}; }
    return {hp:POST.hp,wreck:!!POST.wreck,ko:POST.ko>t,msg:m.op==='smash'?(POST.wreck?'RẦM! Xe CSGT nát bét, khói bốc nghi ngút!':`Đập móp xe CSGT (còn ${POST.hp}/${R.truckHp})`):'BỐP! Chú CSGT ngã lăn quay'}; }
  else if(m.op==='human'){ if(!pl.optimus) return {}; if(!near(pl,OP.park.x,OP.park.y,90)) return {err:'Về chỗ đỗ cạnh xe Chika Phú mới cất xe được'}; pl.optimus=null; }
  else return {err:'?'};
  OPT=pl.optimus?pl.pid:0; pushOpt(); C.broadcastScene('retreat',{t:'ev',k:'transform',id:pl.pid,x:pl.x,y:pl.y,to:pl.optimus||'human'}); return {mode:pl.optimus}; });
const optOff=pl=>{ if(!pl.optimus) return; pl.optimus=null; if(OPT===pl.pid){ OPT=0; pushOpt(); } };

/* ---------- Megatron: trận đấu boss với Optimus ---------- */
const MG=S.MEGATRON; let MEGA=null, megaCd=0, megaPushAt=0;
const megaView=()=>MEGA&&{x:MEGA.x,y:MEGA.y,hp:MEGA.hp,max:MG.hp,face:MEGA.face,act:MEGA.act,actAt:MEGA.actAt,foe:MEGA.foe.pid,opt:Math.max(0,MEGA.foe.optHp||0),optMax:MG.optHp,shots:MEGA.shots.map(s=>[+s.x.toFixed(2),+s.y.toFixed(2)])};
const pushMega=()=>C.broadcastScene('retreat',{t:'mega',v:megaView()});
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'mega',v:megaView()}); });
function megaEnd(win,why){ const M=MEGA; if(!M) return; MEGA=null; megaCd=now()+MG.cd*1000; const pl=M.foe;
  C.broadcastScene('retreat',{t:'ev',k:'megaEnd',win,x:M.x,y:M.y,id:pl.pid});
  if(win){ const d=pl.prof.daily, paid=(d.mega||0)<(MG.daily||99); if(paid){ d.mega=(d.mega||0)+1; C.earn(pl,MG.prize); } reward(pl,{exp:paid?MG.winExp:Math.round(MG.winExp/5)},paid?`Đánh bại Megatron! +${fmt(MG.prize)}`:'Đánh bại Megatron! (hôm nay nhận thưởng rồi, mai đánh tiếp có tiền)'); P.stat(pl,'megatron',1); }   /* MG.daily lần thắng có thưởng mỗi ngày */
  else if(why==='ko'){ const p=pl.prof; p.needs.energy=Math.max(0,p.needs.energy-MG.loseEnergy); optOff(pl); markDirty(pl); C.note(pl,`Optimus gục ngã, trở lại làm Kaixa (-${MG.loseEnergy} năng lượng). Hồi sức rồi gọi Megatron đấu lại!`,'lock'); }
  else C.note(pl,'Megatron rút lui: "Ta sẽ quay lại, Optimus!"','item');
  pushMega(); }
function megaSummon(pl){ if(MEGA) return {err:'Megatron đang ở đây rồi!'}; if(now()<megaCd) return {err:`Megatron đang hồi sức, ${Math.ceil((megaCd-now())/1000)} giây nữa gọi lại`};
  const dir=Math.random()<.5?-1:1; MEGA={x:Math.min(330,Math.max(8,pl.x/T+dir*8)),y:pl.y/T,hp:MG.hp,foe:pl,face:-dir,act:'',actAt:0,nextAtk:now()+1800,nextShot:now()+2600,shots:[]};
  pl.optHp=MG.optHp; C.broadcastScene('retreat',{t:'ev',k:'megaCall',x:MEGA.x,y:MEGA.y,id:pl.pid}); pushMega(); return {msg:'Megatron xuất hiện! Bấm J để đấm, hoá xe (K) húc thẳng vào hắn'}; }
function megaHit(pl,kind){ const M=MEGA, t=now(); if(!M||M.foe!==pl) return {err:'Không có Megatron để đánh'};
  const d=Math.hypot(pl.x/T-M.x,pl.y/T-M.y);
  if(kind==='punch'){ if(pl.optimus!=='robot') return {}; if(t-(pl.mgAt||0)<MG.punchCd||d>2.9) return {}; pl.mgAt=t; M.hp-=MG.punch; }
  else if(kind==='ram'){ if(pl.optimus!=='truck') return {}; if(t-(pl.mgAt||0)<MG.ramCd||d>3.3) return {}; pl.mgAt=t; M.hp-=MG.ram; M.x+=Math.sign(M.x-pl.x/T||1)*2.5; }
  else return {};
  C.broadcastScene('retreat',{t:'ev',k:'megaDmg',x:M.x,y:M.y,n:kind==='ram'?MG.ram:MG.punch,kind});
  if(M.hp<=0) megaEnd(true); else pushMega(); return {hp:Math.max(0,M.hp)}; }
hook('tick',()=>{ const M=MEGA; if(!M) return; const t=now(), pl=M.foe;
  if(!players.has(pl.pid)||pl.scene!=='retreat'||!pl.optimus){ megaEnd(false,'flee'); return; }
  const dx=pl.x/T-M.x, dy=pl.y/T-M.y, d=Math.hypot(dx,dy)||1; M.face=dx>=0?1:-1;
  if(d>2.1&&!(M.act==='fire'&&t-M.actAt<500)){ const st=Math.min(d-2,MG.speed*.1); M.x+=dx/d*st; M.y+=dy/d*st; }
  if(d<=2.5&&t>=M.nextAtk){ M.act='punch'; M.actAt=t; M.nextAtk=t+MG.meleeCd; pl.optHp-=MG.melee; C.broadcastScene('retreat',{t:'ev',k:'megaHit',x:pl.x/T,y:pl.y/T,n:MG.melee,id:pl.pid}); }
  else if(d>=3.5&&d<=11&&t>=M.nextShot){ M.act='fire'; M.actAt=t; M.nextShot=t+MG.shotCd; M.shots.push({x:M.x+M.face*1.6,y:M.y-1.6,vx:dx/d*MG.shotSpeed,vy:dy/d*MG.shotSpeed,until:t+2200}); }
  for(const s of M.shots){ s.x+=s.vx*.1; s.y+=s.vy*.1; if(Math.hypot(pl.x/T-s.x,pl.y/T-1.2-s.y)<1.3){ s.until=0; pl.optHp-=MG.shot; C.broadcastScene('retreat',{t:'ev',k:'megaBoom',x:s.x,y:s.y,n:MG.shot,id:pl.pid}); } }
  M.shots=M.shots.filter(s=>s.until>t);
  if(pl.optHp<=0){ megaEnd(false,'ko'); return; }
  if(t-megaPushAt>=100){ megaPushAt=t; pushMega(); } });
hook('leave',(pl,old)=>{ if(old==='retreat') optOff(pl); }); hook('logout',optOff);
// chạy thử tự động: dựng chốt ngay chỗ người chơi
if(process.env.CHAN_TEST==='1') on('csgtdbg',(pl,m)=>{ POST={kind:m.kind||'chot',x:pl.x/T,y:CG.y,dir:1,until:now()+CG.stay*1000,hp:CG.riot.truckHp,ko:0}; pl.csgtAt=0; pushPost(); return {post:postView()}; });
hook('slow',()=>{ for(const pl of players.values()) if(pl.moto&&!motoOk(pl)){ pl.moto=null; C.note(pl,'Hết giờ thuê xe máy, xe tự về tiệm','lock'); send(pl,{t:'moto',off:true}); } });

/* ---------- vườn quốc gia ---------- */
on('park',(pl,m)=>{ const p=pl.prof, d=today(), K=S.PARK; p.park=p.park||{day:'',seen:{}}; if(p.park.day!==d&&m.op!=='ticket'&&m.op!=='donate'&&m.op!=='view') p.park.seen={};
  if(m.op==='view') return {park:p.park};
  if(m.op==='ticket'){ if(!P.nearNpc(pl,'kiemlam',80)) return {err:'Mua vé ở cổng vườn quốc gia'}; if(p.park.day===d) return {err:'Hôm nay có vé rồi'}; if(!take(pl,K.ticket)) return {err:`Vé ${fmt(K.ticket)}, không đủ tiền`};
    p.park={day:d,seen:{}}; markDirty(pl); return {msg:`Đã mua vé tham quan hôm nay (${fmt(K.ticket)}). Đi theo đường mòn tới các trạm quan sát nhé!`}; }
  if(m.op==='visit'){ const i=m.i|0, sp=K.spots[i]; if(!sp) return {err:'?'}; if(p.park.day!==d) return {err:'Chưa có vé tham quan hôm nay'}; if(pl.scene!=='retreat'||!near(pl,sp.x,sp.y,48)) return {err:'Đứng ở trạm quan sát đã'};
    if(p.park.seen[i]) return {err:'Hôm nay xem trạm này rồi',fact:sp.fact}; p.park.seen[i]=1; know(pl,1); reward(pl,{exp:K.visitExp},`${sp.name}: +1 hiểu biết`); markDirty(pl); return {fact:sp.fact,name:sp.name}; }
  if(m.op==='donate'){ const v=m.v|0; if(!K.donate.includes(v)) return {err:'?'}; if(!P.nearNpc(pl,'kiemlam',80)) return {err:'Quyên góp ở cổng vườn quốc gia'}; if(!take(pl,v)) return {err:'Không đủ tiền'};
    P.stat(pl,'donate',v); know(pl,Math.max(1,Math.round(v/100000))); reward(pl,{exp:Math.round(10+v/20000)},`Cảm ơn bạn đã quyên góp ${fmt(v)} cho vườn quốc gia! 🌳`); markDirty(pl); return {}; }
  return {err:'?'}; });

/* ---------- bảo tàng ---------- */
on('museum',(pl,m)=>{ const p=pl.prof, d=today(), M=S.MUSEUM; p.mus=p.mus||{day:'',seen:{}}; if(!at(pl,'baotang',80)&&!P.nearNpc(pl,'huongdan',80)) return {err:'Vào bảo tàng ở thị trấn'};
  if(m.op==='ticket'){ if(p.mus.day===d) return {err:'Hôm nay có vé rồi'}; if(!take(pl,M.ticket)) return {err:`Vé ${fmt(M.ticket)}`}; p.mus={day:d,seen:{}}; markDirty(pl); return {}; }
  if(m.op==='learn'){ const i=m.i|0, ex=M.exhibits[i]; if(!ex) return {err:'?'}; if(p.mus.day!==d) return {err:'Mua vé đã'}; if(p.mus.seen[i]) return {err:'Hôm nay xem hiện vật này rồi'};
    p.mus.seen[i]=1; know(pl,1); reward(pl,{exp:10},`${ex.name}: +1 hiểu biết`); markDirty(pl); return {fact:ex.fact}; }
  return {err:'?'}; });

/* ---------- chùa ---------- */
on('temple',(pl,m)=>{ const p=pl.prof, d=today(), TP=S.TEMPLE; if(!at(pl,'chua',90)&&!P.nearNpc(pl,'suthay',90)) return {err:'Lên chùa Đà Bắc đã'}; p.daily.temple=p.daily.temple||{};
  const bless=(mul,min)=>{ const cur=p.lbuff&&p.lbuff.until>now()?p.lbuff.mul:1; p.lbuff={mul:Math.max(cur,mul),until:now()+min*60e3}; };
  if(m.op==='pray'){ if(p.daily.temple.pray) return {err:'Hôm nay thắp hương rồi'}; p.daily.temple.pray=1; bless(TP.pray.mul,TP.pray.min); reward(pl,{exp:TP.pray.exp},`Thắp hương: phúc +${Math.round((TP.pray.mul-1)*100)}% EXP ${TP.pray.min} phút`); markDirty(pl); return {}; }
  if(m.op==='donate'){ const o=TP.donate.find(x=>x.v===(m.v|0)); if(!o) return {err:'?'}; if(!take(pl,o.v)) return {err:'Không đủ tiền'}; bless(o.mul,o.min); P.stat(pl,'donate',o.v);
    reward(pl,{exp:5+Math.round(o.v/40000)},`Công đức ${fmt(o.v)}: phúc +${Math.round((o.mul-1)*100)}% EXP ${o.min} phút 🙏`); markDirty(pl); return {}; }
  if(m.op==='fortune'){ if(p.daily.temple.fortune) return {err:'Mỗi ngày chỉ xin 1 quẻ',fortune:p.daily.temple.fortune}; const f=TP.fortunes[Math.floor(Math.random()*TP.fortunes.length)]; p.daily.temple.fortune=f; markDirty(pl); return {fortune:f}; }
  return {err:'?'}; });

/* ---------- tiệm net ---------- */
on('netcafe',(pl,m)=>{ const p=pl.prof, N=S.NETCAFE; if(!at(pl,'net',60)&&!P.nearNpc(pl,'chunet',70)) return {err:'Vào tiệm net ở thị trấn'};
  if(m.op==='game'){ if(!take(pl,N.game.fee)) return {err:`Thuê máy ${fmt(N.game.fee)}`}; return P.startTask(pl,'work',N.game.dur,()=>{ p.needs.energy=Math.max(0,p.needs.energy-N.game.energy); reward(pl,{exp:N.game.exp,kind:'game'},'Leo rank thành công!'); markDirty(pl); return {}; },{anim:'work',name:'Chơi game online'}); }
  if(m.op==='web'){ if((p.daily.web||0)>=N.web.daily) return {err:'Hôm nay lướt đủ rồi'}; if(!take(pl,N.web.fee)) return {err:`Thuê máy ${fmt(N.web.fee)}`};
    return P.startTask(pl,'work',N.web.dur,()=>{ p.daily.web=(p.daily.web||0)+1; know(pl,N.web.know); reward(pl,{exp:8},'Đọc được nhiều điều hay: +1 hiểu biết'); markDirty(pl); return {}; },{anim:'work',name:'Lướt web học hỏi'}); }
  return {err:'?'}; });
/* ---------- ô tô riêng của Chika Phú ---------- */
const CAR={x:S.PCAR.park.x,y:S.PCAR.park.y,driver:null};
const dropAll=()=>{ const d=CAR.driver; if(!d||!d.carPass) return; d.carPass.forEach((q,k)=>{ if(q.incar){ q.incar=false; q.x=d.x+(k-1)*14; q.y=d.y+16; send(q,{t:'pos',x:q.x,y:q.y}); send(q,{t:'pcar',x:CAR.x,y:CAR.y,driving:0,out:true}); } }); d.carPass=[]; };
const isOwner=pl=>String(pl.prof.name||'').toLowerCase()===S.PCAR.owner;
const passOf=()=>CAR.driver&&CAR.driver.carPass?CAR.driver.carPass.filter(q=>q.incar).map(q=>q.pid):[];
const pushCar=()=>C.broadcastScene('retreat',{t:'pcar',x:CAR.x,y:CAR.y,driving:CAR.driver?CAR.driver.pid:0,pass:passOf()});
hook('enter',(pl,id)=>{ if(id==='retreat') send(pl,{t:'pcar',x:CAR.x,y:CAR.y,driving:CAR.driver?CAR.driver.pid:0,pass:passOf()}); });
on('pcar',(pl,m)=>{ if(pl.scene!=='retreat') return {err:'Xe đỗ ở Ké Retreat'};
  if(m.op==='drive'){ if(!isOwner(pl)) return {err:'Xe riêng của Chika Phú, chỉ chủ xe lái được'}; if(CAR.driver) return {err:'Đang lái rồi'}; if(!near(pl,CAR.x,CAR.y,64)) return {err:'Lại gần xe đã'};
    if(pl.riding||pl.moto||pl.kayak) return {err:'Xuống ngựa / xe máy đã'}; CAR.driver=pl; pl.pcar=true; pushCar(); return {}; }
  if(m.op==='park'){ if(CAR.driver!==pl) return {err:'?'}; dropAll(); CAR.driver=null; pl.pcar=false; CAR.x=pl.x/T; CAR.y=pl.y/T; pushCar(); return {}; }
  // ghế phụ: tối đa 3 người lên xe đang có tài xế
  if(m.op==='ride'){ const d=CAR.driver; if(!d) return {err:'Xe chưa có tài xế'}; if(d===pl) return {err:'?'}; if(pl.incar) return {err:'Đang ngồi trên xe'}; if(!near(pl,d.x/T,d.y/T,64)) return {err:'Lại gần xe đã'};
    d.carPass=(d.carPass||[]).filter(q=>q.incar); if(d.carPass.length>=S.PCAR.seats) return {err:`Xe chỉ chở thêm ${S.PCAR.seats} người`}; if(pl.riding||pl.moto) return {err:'Xuống ngựa / xe máy đã'};
    pl.incar=true; d.carPass.push(pl); C.note(d,`${pl.prof.name} lên xe`); pushCar(); return {}; }
  if(m.op==='leave'){ if(!pl.incar) return {}; pl.incar=false; if(CAR.driver&&CAR.driver.carPass) CAR.driver.carPass=CAR.driver.carPass.filter(q=>q!==pl); pl.y+=14; send(pl,{t:'pos',x:pl.x,y:pl.y}); pushCar(); return {}; }
  return {err:'?'}; });
hook('leave',(pl,old)=>{ if(pl.incar){ pl.incar=false; if(CAR.driver&&CAR.driver.carPass) CAR.driver.carPass=CAR.driver.carPass.filter(q=>q!==pl); } if(CAR.driver===pl){ dropAll(); CAR.driver=null; pl.pcar=false; if(old==='retreat'){ CAR.x=pl.x/T; CAR.y=pl.y/T; } pushCar(); } });
hook('logout',pl=>{ if(CAR.driver===pl){ dropAll(); CAR.driver=null; pl.pcar=false; pushCar(); } });
module.exports={motoOk};
