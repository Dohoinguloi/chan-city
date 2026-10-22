// 3 map mới: Bearplus Studio (chuỗi việc thiết kế, nộp Awwwards, cà phê cho team, tìm đầu Bé Gấu, việc freelance),
// VNPT (bốc số thứ tự, SIM số đẹp, gói data, lắp cáp quang, kéo cáp lên Ké, ca trực tổng đài),
// Miếu ông Trường Con (thắp hương cầu an, xin quẻ, buộc dải lụa ở cây đa, bánh đa cua, quay TikTok).
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,hook,now,today,near,kindOf,markDirty,send,note,reward,take,give,has,addItem}=C;
const pr=p=>p.qprog=p.qprog||{};
const active=(p,id)=>p.quests[id]==='active';
const vnHour=()=>S.vnTime(now()).hf;

/* ================= BEARPLUS ================= */
on('bp',(pl,m)=>{ const p=pl.prof, B=S.BEARPLUS, q=pr(p), op=m.op, here=pl.scene==='bearplus', h=vnHour(), night=h>=B.night.from||h<B.night.to;
  const job=(id,sec,label,fn)=>P.startTask(pl,'work',sec,()=>{ const r=fn?fn():null; if(id){ q[id]=(q[id]||0)+1; markDirty(pl); } return r||{msg:`Xong: ${label}. Về báo anh Khoa nhận thưởng`}; },{anim:'work',name:label});
  if(op==='head'){ if(pl.scene!=='das') return {err:'?'}; if(!active(p,'bp_head')) return {err:'Cái đầu gấu ai để quên ở đây thế nhỉ?'}; if(has(pl,'dau_gau')) return {err:'Đã cầm đầu gấu rồi'};
    if(!near(pl,B.head.x,B.head.y,30)) return {err:'Lại gần hơn'}; addItem(pl,'dau_gau'); return {msg:'Nhặt được Đầu Bé Gấu! Bay về Bearplus trả Bé Gấu'}; }
  if(!here) return {err:'Việc này ở Bearplus Studio (TP.HCM)'};
  if(op==='meet'){ if(!near(pl,B.meet.x,B.meet.y+1.2,40)) return {err:'Vào phòng họp kính đã'}; if(!active(p,'bp_brief')||q.bp_brief) return {err:'Phòng họp đang trống. Anh Khoa chưa hẹn khách'};
    return job('bp_brief',15,'Nghe khách brief website mới'); }
  if(op==='mood'){ if(!near(pl,B.mood.x,3.2,48)) return {err:'Lại gần tường moodboard'}; if(!active(p,'bp_mood')) return {err:'Moodboard của team, đẹp ghê. Nhận việc với anh Khoa để ghim thêm'}; if((q.bp_mood||0)>=3) return {err:'Đủ 3 hướng rồi, báo anh Khoa'};
    return job('bp_mood',6,`Ghim hướng hình ảnh ${(q.bp_mood||0)+1}/3`,()=>({msg:(q.bp_mood||0)+1>=3?'Đủ 3 hướng moodboard! Báo anh Khoa':`Ghim xong hướng ${(q.bp_mood||0)+1}/3`})); }
  if(op==='desk'){ const d=B.desks[m.i|0]; if(!d||!near(pl,d[0],d[1]+.9,26)) return {err:'Ngồi vào 1 bàn iMac'};
    if(active(p,'bp_fix')&&!q.bp_fix){ if(!night) return {err:`Bug chỉ hiện lúc đêm khuya (${B.night.from}h–${B.night.to}h), giờ deploy làm gì có lỗi`}; return job('bp_fix',15,'Deploy bản vá lúc 2 giờ sáng'); }
    if(active(p,'bp_wire')&&!q.bp_wire) return job('bp_wire',20,'Dựng wireframe trang chủ');
    const d2=p.daily, G=B.gig; if((d2.bpgig||0)>=G.max) return {err:`Hôm nay làm đủ ${G.max} việc freelance rồi, mai quay lại`};
    return P.startTask(pl,'work',G.dur,()=>{ d2.bpgig=(d2.bpgig||0)+1; const mul=night?2:1; give(pl,G.vnd); const g=C.gainExp(pl,G.exp*mul); markDirty(pl);
      return {msg:`Xong việc freelance ${d2.bpgig}/${G.max}: +${S.fmt(G.vnd)}, +${g.exp} EXP${night?' (làm đêm ×2)':''}`}; },{anim:'work',name:'Việc freelance ở Bearplus'}); }
  if(op==='render'){ if(!near(pl,B.render.x,B.render.y+.9,30)) return {err:'Lại gần trạm render'}; if(!active(p,'bp_3d')||q.bp_3d) return {err:'Máy đang render cảnh khác, quạt kêu vù vù'}; return job('bp_3d',25,'Render Bé Gấu 3D cùng chị My'); }
  if(op==='motion'){ if(!near(pl,B.motion.x,B.motion.y+.9,30)) return {err:'Lại gần góc motion'}; if(!active(p,'bp_motion')||q.bp_motion) return {err:'Bảng vẽ đang tắt. Nhận việc với anh Khoa trước'}; return job('bp_motion',20,'Làm intro Bé Gấu vẫy tay'); }
  if(op==='cups'){ if(!near(pl,B.cups.x,B.cups.y+.9,30)) return {err:'Lại gần tủ giải'};
    if(!active(p,'bp_aww')||q.bp_aww) return {msg:p.flags.bpAward==='sotd'?'Cúp Site of the Day của bạn nằm ngay hàng đầu tủ!':'Tủ giải của Bearplus: Awwwards, FWA, CSSDA...'};
    const sotd=Math.random()<B.sotd; q.bp_aww=1; p.flags.bpAward=sotd?'sotd':'hm'; markDirty(pl);
    if(sotd){ reward(pl,{...B.sotdBonus,item:'cup_sotd'},'Awwwards: SITE OF THE DAY!'); P.stat(pl,'sotd',1); }
    return {sotd,msg:sotd?'Hội đồng chấm 7.8/10: SITE OF THE DAY! Cả team hú hét':'Honorable Mention 7.1/10. Vẫn là thành tích! Báo anh Khoa'}; }
  if(op==='coffee'){ if(!near(pl,B.coffee.x,B.coffee.y+.9,30)) return {err:'Lại gần quầy cà phê'}; if(!take(pl,B.coffeePrice)) return {err:'Không đủ tiền'}; addItem(pl,'cafe_bp'); C.track(pl,'coffee'); return {msg:`Một ly cà phê sữa đá (${S.fmt(B.coffeePrice)})`}; }
  if(op==='give'){ const who=String(m.who||''); if(!['bp_my','bp_dev','bp_ngan','bp_bear'].includes(who)) return {err:'?'}; if(!P.nearNpc(pl,who)) return {err:'Lại gần hơn'};
    if(!active(p,'bp_coffee')) return {err:'Chưa nhận việc mời cà phê'}; const g=p.flags.bpcafe=p.flags.bpcafe||{}; if(g[who]) return {err:'Người này có cà phê rồi'}; if(!has(pl,'cafe_bp')) return {err:'Mua cà phê ở quầy trước đã'};
    addItem(pl,'cafe_bp',-1); g[who]=1; q.bp_coffee=Object.keys(g).length; markDirty(pl); return {msg:`Đã mời cà phê (${q.bp_coffee}/4)`}; }
  return {err:'?'}; });

/* ================= VNPT ================= */
const CALLS=S.VNPT.calls;
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function callQ(pl){ const c=pl._call, k=c.list[c.k], row=CALLS[k], opts=shuffle([0,1,2]); c.right=opts.indexOf(0); return {q:row[0],opts:opts.map(i=>row[1+i]),n:c.k+1,of:c.list.length}; }
on('vn',(pl,m)=>{ const p=pl.prof, V=S.VNPT, op=m.op, t=now(), serving=S.vnptServing(t), q=pr(p);
  if(op==='fiberpt'){ const pt=V.fiberPts[m.i|0]; if(!pt||kindOf(pl.scene)!=='retreat') return {err:'?'}; if(!active(p,'vn_fiber')) return {err:'Hộp cáp quang của VNPT'};
    const f=p.flags.fpts=p.flags.fpts||{}; if(f[m.i|0]) return {err:'Hộp này nối xong rồi'}; if(!near(pl,pt.x,pt.y,30)) return {err:'Lại gần hộp cáp'};
    return P.startTask(pl,'work',6,()=>{ f[m.i|0]=1; q.vn_fiber=Object.keys(f).length; if(q.vn_fiber>=3) p.flags.wifiKe=true; markDirty(pl);
      return {msg:q.vn_fiber>=3?'Nối đủ 3 hộp! Wifi ở Ké mạnh hẳn. Về VNPT báo anh Tuấn':`Hàn nối xong ${pt.name} (${q.vn_fiber}/3)`}; },{anim:'work',name:'Hàn nối cáp quang'}); }
  if(pl.scene!=='vnpt') return {err:'Việc này ở điểm giao dịch VNPT (Hà Nội)'};
  if(op==='ticket'){ if(!near(pl,V.kiosk.x+.2,V.kiosk.y+.9,30)) return {err:'Lại gần máy lấy số'}; const k=pl._tk;
    if(k&&t<k.until&&!k.used) return {n:k.n,c:k.c,serving,again:true};
    const n=serving+3+Math.floor(Math.random()*2), c=1+Math.floor(Math.random()*V.counters.length); pl._tk={n,c,until:t+(n-serving+1)*V.step+90000}; return {n,c,serving}; }
  if(op==='counter'){ const i=m.i|0, ct=V.counters[i]; if(!ct||!near(pl,ct[0],ct[1]+.9,30)) return {err:'Lại gần quầy'};
    if(pl._ok&&pl._ok.until>t&&pl._ok.c===i+1) return {ok:true};
    const k=pl._tk; if(!k||t>k.until) return {err:'Anh/chị vui lòng bốc số thứ tự ở máy cạnh cửa giúp em ạ',need:true};
    if(serving<k.n) return {err:`Chưa tới lượt ạ: số của bạn ${k.n}, đang phục vụ ${serving}. Ngồi ghế chờ chút nhé`};
    if(k.c!==i+1) return {err:`Số ${k.n} được mời tới quầy ${k.c} ạ`};
    k.used=true; pl._ok={c:i+1,until:t+5*60e3}; return {ok:true}; }
  const atDesk=()=>pl._ok&&pl._ok.until>t&&V.counters.some(([x,y])=>near(pl,x,y+.9,34));
  if(op==='buysim'){ if(!atDesk()) return {err:'Ra quầy giao dịch (bốc số trước) để mua SIM'}; const s=V.sims[m.i|0]; if(!s) return {err:'?'};
    if(p.sim&&p.sim.num===s.num) return {err:'Bạn đang dùng số này rồi'}; if(!take(pl,s.price)) return {err:`Số này ${S.fmt(s.price)}, ví không đủ`};
    let num=s.num; if(num==='random'){ const r=()=>Math.floor(Math.random()*10); num=`09${r()}${r()}.${r()}${r()}${r()}.${r()}${r()}${r()}`; }
    p.sim={num,cat:s.cat,at:t}; markDirty(pl); C.refreshInfo(pl); P.stat(pl,'sim',1); return {num,msg:`Chúc mừng! Số mới của bạn: ${num} (${s.cat})`}; }
  if(op==='pack'){ const k=V.packs[m.k]; if(!k) return {err:'?'}; if(!atDesk()&&!near(pl,V.pack.x,V.pack.y+.9,30)) return {err:'Ra quầy hoặc tới standee gói cước'};
    if(!take(pl,k.price)) return {err:'Không đủ tiền'}; const from=Math.max(t,(p.data&&p.data.until)||0); p.data={name:k.name,until:from+k.h*3600e3}; markDirty(pl);
    return {msg:`Đăng ký ${k.name} thành công! Pin điện thoại hao chậm hơn ${Math.round((1-V.packMul)*100)}% tới ${S.vnTime(p.data.until).day.split('-').reverse().join('/')}`}; }
  if(op==='fiber'){ if(!atDesk()) return {err:'Ra quầy giao dịch (bốc số trước) để đăng ký'}; if(p.flags.fiber) return {err:'Phòng bạn có cáp quang rồi'}; if(!take(pl,V.fiber.price)) return {err:'Không đủ tiền'};
    p.flags.fiber=true; markDirty(pl); return {msg:`Đã lắp cáp quang cho phòng trọ! Lướt TikTok ở phòng được ×${V.fiber.mul} EXP`}; }
  if(op==='charge'){ const Ch=V.charger; if(!near(pl,Ch.x,Ch.y+.9,52)) return {err:'Lại gần trạm sạc'}; if(p.needs.battery>=99) return {err:'Pin đầy rồi'};   // nhà mạng có trạm sạc miễn phí, sạc đầy, không giới hạn
    return P.startTask(pl,'sac',Ch.dur,()=>{ p.needs.battery=100; markDirty(pl); return {msg:'Trạm sạc VNPT: pin đầy 100%. Miễn phí, cảm ơn quý khách!'}; },{name:'Sạc ở trạm VNPT'}); }
  if(op==='water'){ const d=p.daily; if((d.vnwater||0)>=5) return {err:'Uống nhiều quá rồi'}; d.vnwater=(d.vnwater||0)+1; p.needs.energy=Math.min(100,p.needs.energy+5); markDirty(pl); return {msg:'Ực ực. +5 năng lượng'}; }
  if(op==='server'){ const d=p.daily; if(d.vnserver) return {msg:'Phòng máy chủ chạy êm, đèn xanh nhấp nháy đều'}; d.vnserver=1; const g=C.gainExp(pl,15); markDirty(pl);
    return {msg:`Bạn đứng ngắm phòng máy chủ: hàng trăm đèn nháy, quạt làm mát ù ù. Học thêm được chút kiến thức mạng (+${g.exp} EXP)`}; }
  if(op==='call'){ const ct=V.desks[m.i|0]; if(!ct||!near(pl,ct[0],ct[1]+.9,28)) return {err:'Ngồi vào bàn tổng đài'}; const d=p.daily;
    if((d.vncall||0)>=V.shifts) return {err:`Hôm nay trực đủ ${V.shifts} ca rồi`}; pl._call={k:0,ok:0,list:shuffle([...CALLS.keys()]).slice(0,V.shift)}; return callQ(pl); }
  if(op==='answer'){ const c=pl._call; if(!c) return {err:'Chưa vào ca'}; const right=(m.a|0)===c.right; if(right){ c.ok++; give(pl,V.callPay.vnd); C.gainExp(pl,V.callPay.exp); }
    const good=CALLS[c.list[c.k]][1]; c.k++; if(c.k<c.list.length){ markDirty(pl); return {right,good,next:callQ(pl),ok:c.ok}; }
    pl._call=null; const d=p.daily; d.vncall=(d.vncall||0)+1; if(active(p,'vn_call')&&c.ok>=4) q.vn_call=1; markDirty(pl); P.stat(pl,'calls',c.ok);
    return {right,good,done:true,ok:c.ok,of:c.list.length}; }
  return {err:'?'}; });

/* ================= MIẾU ÔNG TRƯỜNG CON ================= */
function cauan(pl,part){ const p=pl.prof, f=p.flags.cauan=p.flags.cauan||{}; if(!active(p,'mieu_cauan')||f[part]) return; f[part]=1; pr(p).mieu_cauan=Object.keys(f).length; markDirty(pl); }
on('mieu',(pl,m)=>{ const p=pl.prof, M=S.MIEU, op=m.op, d=p.daily, holy=S.holyDay(now());
  if(pl.scene!=='mieu') return {err:'Việc này ở Miếu ông Trường Con (Hải Phòng)'};
  if(op==='incense'){ if(!near(pl,M.burner.x,M.burner.y+.9,34)) return {err:'Lại gần lư hương'}; if(d.incense) return {err:'Hôm nay bạn thắp hương rồi, lòng thành là đủ'}; if(!take(pl,M.incense.price)) return {err:'Không đủ tiền mua hương'};
    return P.startTask(pl,'incense',M.incense.dur,()=>{ d.incense=1; const b=holy?M.incense.holy:M.incense; const cur=p.mbuff&&p.mbuff.until>now()?p.mbuff.mul:1; p.mbuff={mul:Math.max(cur,b.mul),until:now()+b.min*60e3}; cauan(pl,'incense'); markDirty(pl);
      return {msg:`Thắp hương xong. Phúc bình an: +${Math.round((b.mul-1)*100)}% EXP trong ${b.min/60} giờ${holy?` (${holy}: phúc gấp đôi)`:''}`}; },{name:'Thắp hương cầu an'}); }
  if(op==='que'){ if(!near(pl,M.fortune.x,M.fortune.y+.9,30)) return {err:'Lại gần ống xăm'}; if(d.que) return {err:'Mỗi ngày xin 1 quẻ thôi, mai xin tiếp nhé'};
    const r=Math.random(), pool=M.que.filter(x=>x[2]===(r<.25?'good':r<.75?'mid':'low')), z=pool[Math.floor(Math.random()*pool.length)]; d.que=1; cauan(pl,'que');
    if(z[2]==='good') give(pl,50000); markDirty(pl); return {tier:z[0],poem:z[1],kind:z[2]}; }
  if(op==='wish'){ const w=M.wishes[m.k]; if(!w) return {err:'?'}; if(!near(pl,M.wish.x,M.wish.y,34)) return {err:'Lại gần cây đa'}; if(p.wish&&p.wish.day===today()) return {err:'Hôm nay bạn buộc dải lụa rồi'};
    if(!take(pl,M.wishPrice)) return {err:'Không đủ tiền mua dải lụa'}; p.wish={k:m.k,day:today()}; cauan(pl,'wish'); markDirty(pl);
    return {msg:`Đã buộc dải lụa cầu ${w.name}. Mai quay lại game xem điều ước có linh không nhé!`}; }
  if(op==='food'){ const f=m.k==='nem'?M.nem:M.banhda, name=m.k==='nem'?'Nem cua bể':'Bánh đa cua'; if(!near(pl,M.cart.x,M.cart.y+.9,40)) return {err:'Lại gần xe bánh đa cua'};
    const free=holy==='Lễ cầu an mùng 6'&&m.k!=='nem'&&!d.mieufree; if(!free&&!take(pl,f.price)) return {err:'Không đủ tiền'}; if(free) d.mieufree=1;
    p.needs.energy=Math.min(100,p.needs.energy+f.energy); const ds=today(); if(p.meals.day!==ds) p.meals={day:ds,eaten:{}}; const slot=S.mealStatus(p.meals,now()).find(s=>s.st==='now');
    if(slot&&!p.meals.eaten[slot.id]){ p.meals.eaten[slot.id]=true; C.track(pl,'meal'); } if(m.k!=='nem'&&!has(pl,'banh_da_cua')) addItem(pl,'banh_da_cua'); markDirty(pl);
    return {msg:`${name} nóng hổi${free?' (lộc cầu an, miễn phí!)':''}: +${f.energy} năng lượng${slot?', tính 1 bữa':''}`}; }
  if(op==='clip'){ if(!near(pl,M.tiktok.x+.8,M.tiktok.y+.6,34)) return {err:'Đứng trước đèn vòng'}; const q=pr(p);
    if(active(p,'tc_clip')&&(q.tc_clip||0)<3) return P.startTask(pl,'tiktok',M.clip.dur,()=>{ q.tc_clip=(q.tc_clip||0)+1; markDirty(pl); return {msg:q.tc_clip>=3?'Đủ 3 clip! Báo Trường Con nhé':`Xong clip ${q.tc_clip}/3. Trường Con: "Mới Trường Con là như vậy!"`}; },{name:'Quay TikTok cùng Trường Con'});
    if(d.tcclip) return {err:'Hôm nay quay với Trường Con rồi, mai lên clip mới'}; return P.startTask(pl,'tiktok',M.clip.dur,()=>{ d.tcclip=1; d.tiktok=(d.tiktok||0)+1; const g=C.gainExp(pl,M.clip.exp); markDirty(pl); return {msg:`Clip lên xu hướng! +${g.exp} EXP`}; },{name:'Quay clip cùng Trường Con'}); }
  return {err:'?'}; });

// điều ước buộc ở cây đa: hôm sau vào game là linh nghiệm
hook('login',pl=>{ const p=pl.prof, w=p.wish; if(!w||w.day>=today()) return; const def=S.MIEU.wishes[w.k]; p.wish=null; if(!def) return; const g=def.gift;
  if(g.vnd) give(pl,g.vnd); if(g.exp) C.gainExp(pl,g.exp); if(g.item) addItem(pl,g.item); if(g.energy) p.needs.energy=Math.min(100,p.needs.energy+g.energy); markDirty(pl);
  setTimeout(()=>{ if(pl.prof) note(pl,`🎋 Dải lụa cầu ${def.name} ở cây đa miếu ông Trường Con đã linh nghiệm: ${g.vnd?'+'+S.fmt(g.vnd):g.exp?'+'+g.exp+' EXP':g.item?'nhận '+S.ITEMS[g.item].name:'+'+g.energy+' năng lượng'}!`,'quest'); },3000); });
module.exports={};
