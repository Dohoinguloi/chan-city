// 3 map mới: Bearplus Studio (chuỗi việc thiết kế, nộp Awwwards, cà phê cho team, tìm đầu Bé Gấu, việc freelance),
// VNPT (bốc số thứ tự, SIM số đẹp, gói data, lắp cáp quang, kéo cáp lên Ké, ca trực tổng đài),
// Miếu ông Trường Con (thắp hương cầu an, xin quẻ, buộc dải lụa ở cây đa, bánh đa cua, quay TikTok).
'use strict';
const C=require('./core'), P=require('./places');
const {shopPay}=require('./perks');   // mua đồ: giảm 20% cho học viên DAS, nhân viên Bearplus / Lumen / Everfit
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
    return P.startTask(pl,'work',G.dur,()=>{ d2.bpgig=(d2.bpgig||0)+1; const mul=night?2:1; C.earn(pl,G.vnd); const g=C.gainExp(pl,G.exp*mul); markDirty(pl);
      return {msg:`Xong việc freelance ${d2.bpgig}/${G.max}: +${S.fmt(G.vnd)}, +${g.exp} EXP${night?' (làm đêm ×2)':''}`}; },{anim:'work',name:'Việc freelance ở Bearplus'}); }
  if(op==='render'){ if(!near(pl,B.render.x,B.render.y+.9,30)) return {err:'Lại gần trạm render'}; if(!active(p,'bp_3d')||q.bp_3d) return {err:'Máy đang render cảnh khác, quạt kêu vù vù'}; return job('bp_3d',25,'Render Bé Gấu 3D cùng chị My'); }
  if(op==='motion'){ if(!near(pl,B.motion.x,B.motion.y+.9,30)) return {err:'Lại gần góc motion'}; if(!active(p,'bp_motion')||q.bp_motion) return {err:'Bảng vẽ đang tắt. Nhận việc với anh Khoa trước'}; return job('bp_motion',20,'Làm intro Bé Gấu vẫy tay'); }
  if(op==='cups'){ if(!near(pl,B.cups.x,B.cups.y+.9,30)) return {err:'Lại gần tủ giải'};
    // nộp xong nhiệm vụ mà mới được Honorable Mention: mỗi ngày nộp lại 1 dự án mới, tới khi được Site of the Day (cúp cho sổ Kỷ vật)
    if((q.bp_aww||p.quests.bp_aww==='done')&&p.flags.bpAward!=='sotd'){ if(p.daily.bpaww) return {err:'Hôm nay nộp dự án rồi, mai nộp dự án khác nhé'}; p.daily.bpaww=1; const sotd=Math.random()<B.sotd; markDirty(pl);
      if(sotd){ p.flags.bpAward='sotd'; reward(pl,{exp:150,item:'cup_sotd'},'Awwwards: SITE OF THE DAY!'); P.stat(pl,'sotd',1); } return {sotd,msg:sotd?'Dự án mới được SITE OF THE DAY! Cúp đặt lên hàng đầu tủ':'Lại Honorable Mention. Mai nộp dự án khác thử tiếp!'}; }
    if(!active(p,'bp_aww')||q.bp_aww) return {msg:p.flags.bpAward==='sotd'?'Cúp Site of the Day của bạn nằm ngay hàng đầu tủ!':'Tủ giải của Bearplus: Awwwards, FWA, CSSDA...'};
    const sotd=Math.random()<B.sotd; q.bp_aww=1; p.flags.bpAward=sotd?'sotd':'hm'; markDirty(pl);
    if(sotd){ reward(pl,{...B.sotdBonus,item:'cup_sotd'},'Awwwards: SITE OF THE DAY!'); P.stat(pl,'sotd',1); }
    return {sotd,msg:sotd?'Hội đồng chấm 7.8/10: SITE OF THE DAY! Cả team hú hét':'Honorable Mention 7.1/10. Vẫn là thành tích! Báo anh Khoa'}; }
  if(op==='coffee'){ if(!near(pl,B.coffee.x,B.coffee.y+.9,30)) return {err:'Lại gần quầy cà phê'}; if(!shopPay(pl,B.coffeePrice)) return {err:'Không đủ tiền'}; addItem(pl,'cafe_bp'); C.track(pl,'coffee'); return {msg:`Một ly cà phê sữa đá (${S.fmt(B.coffeePrice)})`}; }
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
    if(p.sim&&SIMS.get(p.sim.num)===pl.uid) SIMS.delete(p.sim.num); p.sim={num,cat:s.cat,at:t}; SIMS.set(num,pl.uid); markDirty(pl); C.refreshInfo(pl); P.stat(pl,'sim',1); if(s.num!=='random') P.stat(pl,'simVip',1); return {num,msg:`Chúc mừng! Số mới của bạn: ${num} (${s.cat})`}; }
  if(op==='pack'){ const k=V.packs[m.k]; if(!k) return {err:'?'}; if(!p.sim) return {err:'Cần có SIM VNPT trước (mua ở quầy giao dịch)'}; if(!atDesk()&&!near(pl,V.pack.x,V.pack.y+.9,30)) return {err:'Ra quầy hoặc tới standee gói cước'};
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
    if(pl._call) return callQ(pl);   // đang trong ca: hỏi lại câu hiện tại, không mở ca mới
    if((d.vncall||0)>=V.shifts) return {err:`Hôm nay trực đủ ${V.shifts} ca rồi`}; d.vncall=(d.vncall||0)+1;   // vào ca là tính 1 ca (bỏ dở rồi vào lại không được trả lời lại câu đầu lấy tiền mãi)
    pl._call={k:0,ok:0,list:shuffle([...CALLS.keys()]).slice(0,V.shift)}; markDirty(pl); return callQ(pl); }
  if(op==='answer'){ const c=pl._call; if(!c) return {err:'Chưa vào ca'}; const right=(m.a|0)===c.right; if(right){ c.ok++; C.earn(pl,V.callPay.vnd); C.gainExp(pl,V.callPay.exp); }
    const good=CALLS[c.list[c.k]][1]; c.k++; if(c.k<c.list.length){ markDirty(pl); return {right,good,next:callQ(pl),ok:c.ok}; }
    pl._call=null; if(active(p,'vn_call')&&c.ok>=4) q.vn_call=1; markDirty(pl); P.stat(pl,'calls',c.ok);
    return {right,good,done:true,ok:c.ok,of:c.list.length}; }
  return {err:'?'}; });

/* ================= MIẾU ÔNG TRƯỜNG CON ================= */
function cauan(pl,part){ const p=pl.prof, f=p.flags.cauan=p.flags.cauan||{}; if(!active(p,'mieu_cauan')||f[part]) return; f[part]=1; pr(p).mieu_cauan=Object.keys(f).length; markDirty(pl); }
on('mieu',(pl,m)=>{ const p=pl.prof, M=S.MIEU, op=m.op, d=p.daily, holy=S.holyDay(now());
  if(pl.scene!=='mieu') return {err:'Việc này ở Miếu ông Trường Con (Hải Phòng)'};
  if(op==='congduc'){ const v=[1e6,5e6,1e7].includes(m.v|0)?m.v|0:0; if(!v) return {err:'?'}; if(!near(pl,M.altar.x,M.altar.y+1,48)) return {err:'Lại gần ban thờ ông Trường Con'}; if(!take(pl,v)) return {err:`Công đức ${S.fmt(v)}, ví không đủ`};   /* hòm công đức (thành tựu item huyền thoại) */
    P.stat(pl,'donateMieu',v); reward(pl,{exp:Math.round(10+v/50000)},`Công đức ${S.fmt(v)} cho Miếu ông Trường Con 🙏`); markDirty(pl); return {msg:`Đã công đức ${S.fmt(v)}. Tổng công đức: ${S.fmt((p.stats&&p.stats.donateMieu)||v)}`}; }
  if(op==='incense'){ if(!near(pl,M.burner.x,M.burner.y+.9,34)) return {err:'Lại gần lư hương'}; if(d.incense) return {err:'Hôm nay bạn thắp hương rồi, lòng thành là đủ'}; if(!take(pl,M.incense.price)) return {err:'Không đủ tiền mua hương'};
    return P.startTask(pl,'incense',M.incense.dur,()=>{ d.incense=1; const b=holy?M.incense.holy:M.incense; const cur=p.mbuff&&p.mbuff.until>now()?p.mbuff.mul:1; p.mbuff={mul:Math.max(cur,b.mul),until:now()+b.min*60e3}; cauan(pl,'incense'); markDirty(pl);
      return {msg:`Thắp hương xong. Phúc bình an: +${Math.round((b.mul-1)*100)}% EXP trong ${b.min/60} giờ${holy?` (${holy}: phúc gấp đôi)`:''}`}; },{name:'Thắp hương cầu an'}); }
  if(op==='que'){ if(!near(pl,M.fortune.x,M.fortune.y+.9,30)) return {err:'Lại gần ống xăm'}; if(d.que) return {err:'Mỗi ngày xin 1 quẻ thôi, mai xin tiếp nhé'};
    const r=Math.random(), pool=M.que.filter(x=>x[2]===(r<.25?'good':r<.75?'mid':'low')), z=pool[Math.floor(Math.random()*pool.length)]; d.que=1; cauan(pl,'que');
    if(z[2]==='good') C.earn(pl,50000); markDirty(pl); return {tier:z[0],poem:z[1],kind:z[2]}; }
  if(op==='wish'){ const w=M.wishes[m.k]; if(!w) return {err:'?'}; if(!near(pl,M.wish.x,M.wish.y,34)) return {err:'Lại gần cây đa'}; if(p.wish&&p.wish.day===today()) return {err:'Hôm nay bạn buộc dải lụa rồi'};
    if(!take(pl,M.wishPrice)) return {err:'Không đủ tiền mua dải lụa'}; p.wish={k:m.k,day:today()}; cauan(pl,'wish'); markDirty(pl);
    return {msg:`Đã buộc dải lụa cầu ${w.name}. Mai quay lại game xem điều ước có linh không nhé!`}; }
  if(op==='food'){ const f=m.k==='nem'?M.nem:M.banhda, name=m.k==='nem'?'Nem cua bể':'Bánh đa cua'; if(!near(pl,M.cart.x,M.cart.y+.9,40)) return {err:'Lại gần xe bánh đa cua'};
    const free=holy==='Lễ cầu an mùng 6'&&m.k!=='nem'&&!d.mieufree; if(!free&&!shopPay(pl,f.price)) return {err:'Không đủ tiền'}; if(free) d.mieufree=1;
    p.needs.energy=Math.min(100,p.needs.energy+f.energy); const ds=today(); if(p.meals.day!==ds) p.meals={day:ds,eaten:{}}; const slot=S.mealStatus(p.meals,now()).find(s=>s.st==='now');
    if(slot&&!p.meals.eaten[slot.id]){ p.meals.eaten[slot.id]=true; C.track(pl,'meal'); } if(m.k!=='nem'&&!has(pl,'banh_da_cua')) addItem(pl,'banh_da_cua'); markDirty(pl);
    return {msg:`${name} nóng hổi${free?' (lộc cầu an, miễn phí!)':''}: +${f.energy} năng lượng${slot?', tính 1 bữa':''}`}; }
  if(op==='buy'){ const k=String(m.k||''), price=M.shop[k]; if(!price) return {err:'?'}; if(!near(pl,M.cart.x,M.cart.y+.9,44)) return {err:'Lại gần xe bà Lụa'}; if(!shopPay(pl,price)) return {err:'Không đủ tiền'};
    addItem(pl,k); markDirty(pl); return {msg:`Bà Lụa: "Của cháu đây: ${S.ITEMS[k].name.toLowerCase()}, mới về sáng nay!"`}; }
  if(op==='luoc'){ if(!near(pl,M.stove.x,M.stove.y+.9,44)) return {err:'Lại gần bếp củi'}; const q=pr(p); if(!active(p,'tc_luocga')||q.tc_luocga) return {err:'Bếp củi đang đỏ lửa. Ông Trường Con chưa nhờ luộc gì'};
    const k=has(pl,'ga_thit')?'ga_thit':has(pl,'chicken')?'chicken':''; if(!k) return {err:'Chưa có gà. Mua gà làm sẵn ở xe bà Lụa (45.000đ)'};
    return P.startTask(pl,'cook',10,()=>{ addItem(pl,k,-1); q.tc_luocga=1; markDirty(pl); return {msg:'Gà luộc vàng ươm, da giòn! Mang ra báo Ông Trường Con'}; },{anim:'cook',name:'Luộc gà cúng'}); }
  if(op==='clip'){ if(!near(pl,M.tiktok.x+.8,M.tiktok.y+.6,34)) return {err:'Đứng trước đèn vòng'}; const q=pr(p);
    if(active(p,'tc_clip')&&(q.tc_clip||0)<3) return P.startTask(pl,'tiktok',M.clip.dur,()=>{ q.tc_clip=(q.tc_clip||0)+1; markDirty(pl); return {msg:q.tc_clip>=3?'Đủ 3 clip! Báo Trường Con nhé':`Xong clip ${q.tc_clip}/3. Trường Con: "Mới Trường Con là như vậy!"`}; },{name:'Quay TikTok cùng Trường Con'});
    if(d.tcclip) return {err:'Hôm nay quay với Trường Con rồi, mai lên clip mới'}; return P.startTask(pl,'tiktok',M.clip.dur,()=>{ d.tcclip=1; d.tiktok=(d.tiktok||0)+1; const g=C.gainExp(pl,M.clip.exp); markDirty(pl); return {msg:`Clip lên xu hướng! +${g.exp} EXP`}; },{name:'Quay clip cùng Trường Con'}); }
  return {err:'?'}; });

// "Đi ăn trực" (việc Ông Trường Con): sang nhà anh Độ được bữa miễn phí, tính 1 bữa
on('antruc',(pl,m)=>{ const p=pl.prof, q=pr(p); if(!active(p,'tc_antruc')||q.tc_antruc) return {err:'Anh Độ: "Ăn gì chưa? Mà thôi, nhà hết cơm rồi!"'}; if(pl.scene!=='yenlang'||!P.nearNpc(pl,'do')) return {err:'Sang 120 Yên Lãng gặp anh Độ'};
  q.tc_antruc=1; p.needs.energy=Math.min(100,p.needs.energy+30); const ds=today(); if(p.meals.day!==ds) p.meals={day:ds,eaten:{}}; const slot=S.mealStatus(p.meals,now()).find(s=>s.st==='now'||s.st==='missed');
  if(slot&&!p.meals.eaten[slot.id]){ p.meals.eaten[slot.id]=true; C.track(pl,'meal'); } markDirty(pl); return {msg:'Anh Độ: "Ngồi xuống ăn đi em, khen ngon là được!" (+30 năng lượng). Về báo Ông Trường Con'}; });
/* ---------- SIM: lộc hằng ngày, nhắn tin, gọi bạn tới chỗ mình ---------- */
hook('login',pl=>{ const p=pl.prof, k=C.simPerk(p).daily; if(!k||p.daily.simGift) return; p.daily.simGift=1; if(k.vnd) give(pl,k.vnd); if(k.exp) C.gainExp(pl,k.exp); markDirty(pl);
  setTimeout(()=>{ if(pl.prof) note(pl,`📱 Lộc SIM ${p.sim.cat} (${p.sim.num}): ${k.vnd?'+'+S.fmt(k.vnd):'+'+k.exp+' EXP'}`,'vnd'); },2500); });
const byNum=num=>{ for(const q of C.players.values()) if(q.prof.sim&&q.prof.sim.num===num) return q; return null; };
// số SIM → uid (cả người offline), dựng 1 lần lúc chạy server: trước đây mỗi tin nhắn tới số offline đọc lại toàn bộ hồ sơ trong DB
const SIMS=new Map(); for(const r of C.db.allProfiles()) if(r.sim&&r.sim.num&&!SIMS.has(r.sim.num)) SIMS.set(r.sim.num,r._uid);
const INBOX_MAX=30;   // hộp thư người offline giữ tối đa 30 tin mới nhất
on('sms',(pl,m)=>{ const p=pl.prof, V=S.VNPT, msg=require('./world').clean(m.msg).slice(0,80), to=String(m.to||''), t=now(); if(!p.sim) return {err:'Chưa có SIM. Mua ở VNPT (Hà Nội)'};
  if(p.needs.battery<S.GRAB.minBattery) return {err:'Hết pin rồi'}; if(!msg) return {err:'Gõ nội dung tin nhắn đã'}; if(pl.smsAt&&t-pl.smsAt<V.sms.cd*1000) return {err:'Nhắn chậm thôi'};
  if(to===p.sim.num) return {err:'Đây là số của bạn'}; if(!take(pl,V.sms.price)) return {err:'Không đủ tiền cước'}; pl.smsAt=t; p.needs.battery=Math.max(0,p.needs.battery-1); markDirty(pl);
  const q=byNum(to), line=`📩 SMS từ ${p.sim.num} (${p.name}): ${msg}`;
  if(q){ note(q,line,'quest'); send(q,{t:'sms',from:p.sim.num,name:p.name,msg}); return {msg:`Đã gửi tới ${to}`}; }
  const uid=SIMS.get(to), prof=uid&&!C.byUid.has(uid)&&C.db.profile(uid);
  if(prof&&prof.sim&&prof.sim.num===to){ const ib=prof.inbox=prof.inbox||[]; ib.push(line); if(ib.length>INBOX_MAX) ib.splice(0,ib.length-INBOX_MAX); C.db.saveProfile(uid,prof); return {msg:`${to} đang offline, tin nhắn chờ trong hộp thư`}; }
  return {err:'Số máy quý khách vừa gọi hiện không có thật'}; });
// gọi điện: người nghe máy được Grab tới chỗ người gọi (cước theo 2 thành phố); người gọi đang ở phòng riêng / chỗ đặc biệt thì chỉ nói chuyện
const CALL_OK=new Set(['epl','lavi','nghienmotion','retreat','dalat','das','lumen','yenlang','pickle','diep','everfit','bearplus','vnpt','mieu','club','track']);
on('ring',(pl,m)=>{ const p=pl.prof, t=now(), to=String(m.to||''); if(!p.sim) return {err:'Chưa có SIM. Mua ở VNPT (Hà Nội)'}; if(p.needs.battery<S.GRAB.minBattery) return {err:'Hết pin rồi'};
  if(pl.ringAt&&t-pl.ringAt<15000) return {err:'Vừa gọi xong, chờ chút'}; const q=byNum(to); if(!q) return {err:'Thuê bao quý khách vừa gọi tạm thời không liên lạc được'}; if(q===pl) return {err:'Đây là số của bạn'};
  pl.ringAt=t; p.needs.battery=Math.max(0,p.needs.battery-2); markDirty(pl); const k=kindOf(pl.scene), dest=S.SCENE_DEST[k], come=CALL_OK.has(k)&&dest;
  q.call={from:pl.pid,until:t+30000,come}; send(q,{t:'ring',name:p.name,num:p.sim.num,come:!!come,where:come?S.DEST[dest].name:'',fare:come?S.grabFare(S.SCENE_DEST[kindOf(q.scene)]||'home',dest):0});
  return {msg:`Đang gọi ${to}...`}; });
on('pickup',(pl,m)=>{ const c=pl.call, t=now(); if(!c||t>c.until) return {err:'Cuộc gọi đã kết thúc'}; pl.call=null; const o=C.players.get(c.from); if(!o) return {err:'Người gọi đã offline'};
  if(!m.go){ note(o,`📞 ${pl.prof.name} đã nghe máy: "Ừ, alo!"`,'quest'); return {msg:`Đang nói chuyện với ${o.prof.name}`}; }
  if(!c.come) return {err:'Người gọi đang ở chỗ riêng, không tới được'};
  // người gọi có thể đã đổi chỗ sau khi gọi: chỉ tới được nếu chỗ hiện tại vẫn cho đón, và người nghe đủ điều kiện vào map đó như đi Grab
  const ok=kindOf(o.scene), dest=CALL_OK.has(ok)&&S.SCENE_DEST[ok]; if(!dest) return {err:'Người gọi đang ở chỗ riêng, không tới được'};
  { const why=require('./world').entryErr(pl.prof,dest); if(why) return {err:why}; }
  if(pl.task) return {err:'Đang làm việc khác'}; if(pl.prof.jail&&pl.prof.jail.until>t) return {err:'Đang bị tạm giữ ở đồn'};
  const fare=Math.round(S.grabFare(S.SCENE_DEST[kindOf(pl.scene)]||'home',S.SCENE_DEST[kindOf(o.scene)])*(1-(C.simPerk(pl.prof).grab||0))); if(fare&&!take(pl,fare)) return {err:`Grab tới đó ${S.fmt(fare)}, ví không đủ`};
  C.moveTo(pl,o.scene,o.x/C.T+.8,o.y/C.T+.4,{ride:{from:S.SCENE_DEST[kindOf(pl.scene)]||'home',to:S.SCENE_DEST[kindOf(o.scene)],fare}}); note(o,`📞 ${pl.prof.name} đang Grab tới chỗ bạn!`,'quest'); return {msg:'Đang tới'}; });
// điều ước buộc ở cây đa: hôm sau vào game là linh nghiệm
hook('login',pl=>{ const p=pl.prof, w=p.wish; if(!w||w.day>=today()) return; const def=Object.hasOwn(S.MIEU.wishes,w.k)&&S.MIEU.wishes[w.k]; p.wish=null; if(!def||!def.gift) return; const g=def.gift;
  if(g.vnd) give(pl,g.vnd); if(g.exp) C.gainExp(pl,g.exp); if(g.item) addItem(pl,g.item); if(g.energy) p.needs.energy=Math.min(100,p.needs.energy+g.energy); markDirty(pl);
  setTimeout(()=>{ if(pl.prof) note(pl,`🎋 Dải lụa cầu ${def.name} ở cây đa miếu ông Trường Con đã linh nghiệm: ${g.vnd?'+'+S.fmt(g.vnd):g.exp?'+'+g.exp+' EXP':g.item?'nhận '+S.ITEMS[g.item].name:'+'+g.energy+' năng lượng'}!`,'quest'); },3000); });
module.exports={};
