/* Chan City — phần client của 3 map mới: tương tác (bp:… vn:… mieu:…), chỉ đường nhiệm vụ, vật nhặt được ở map khác
   (đầu Bé Gấu ở DAS, hộp cáp quang ở Ké), hình động (máy render, tủ máy chủ, nến trong miếu, đèn lồng, cờ ngũ sắc),
   bảng LED gọi số ở VNPT (có giọng đọc), khói hương, hơi nồi bánh đa, linh vật Bé Gấu nhún nhảy. */
(function(){
const SD=SHARED, A=ART, T=A.T, Gm=()=>GAME, G=()=>GAME.G, esc=s=>GAME.esc(s), fmt=SD.fmt;
const act=(m)=>GAME.act(m), toast=(h,k)=>GAME.toast(h,k);
const done=r=>r&&!r.err;
const tell=r=>{ if(done(r)&&r.msg) toast(esc(r.msg),'quest'); return r; };
const Q=id=>(G().quests||{})[id], prog=id=>((G().qprog||{})[id]||0);
const here=k=>GAME.S&&GAME.S.kind===k;
let GO_ID=null; const grabTo=(name)=>{ const k=Object.keys(SD.DEST).find(d=>SD.DEST[d].name.startsWith(name.split(' (')[0])); if(k&&GO_ID) return GAME.autoGo(k,()=>GAME.questGo(GO_ID)); toast(`Việc này ở <b>${name}</b>: bấm G gọi Grab`,'quest'); UI.grab(); };   /* tự gọi Grab tới map của việc đang làm */
const MAPX={tk:null,called:false};

/* ---------- Bearplus ---------- */
MAPX.bp=async(op,it)=>{
  if(op==='desk'||op==='mood'||op==='render'||op==='motion'||op==='meet') return tell(await act({t:'bp',op,i:it&&it.i}));
  if(op==='coffee') return tell(await act({t:'bp',op:'coffee'}));
  if(op==='photo'){ GAME.sfx('blip',.6); GAME.fx.push({kind:'glint',x:GAME.P.x,y:GAME.P.y-30,t:0,life:.6}); toast(['Tách! Ảnh sống ảo cùng phông bear+ hồng rực','Tách! Tạo dáng tay chữ V cùng phông bear+','Tách! Ảnh này đăng lên là đủ like cả tuần'][Math.floor(Math.random()*3)],'item'); return; }
  if(op==='cups'){ const r=await act({t:'bp',op:'cups'}); if(!done(r)) return; if(r.sotd){ GAME.bigText('SITE OF THE DAY!'); GAME.sfx('level_up',.7); } toast(esc(r.msg),r.sotd?'item':'quest'); return; } };
/* ---------- VNPT ---------- */
MAPX.vn=async(op,it)=>{
  if(op==='ticket'){ const r=await act({t:'vn',op:'ticket'}); if(!done(r)) return; MAPX.tk={n:r.n,c:r.c}; MAPX.called=false; GAME.sfx('blip',.4);
    toast(`${r.again?'Số của bạn vẫn là':'Bạn bốc được số'} <b>${r.n}</b> · đang phục vụ ${r.serving}. Ngồi ghế chờ, gọi tới số thì ra <b>quầy ${r.c}</b>`,'item'); return; }
  if(op==='counter') return counter(it.i);
  if(op==='sim') return UI.vnptSim();
  if(op==='pack') return UI.vnptPack();
  if(op==='water'||op==='server') return tell(await act({t:'vn',op}));
  if(op==='charge'){ const r=await act({t:'vn',op:'charge'}); if(done(r)) toast('🔌 Đang sạc ở trạm VNPT, đứng yên chút nhé','quest'); return; }
  if(op==='call'){ const r=await act({t:'vn',op:'call',i:it.i}); if(done(r)) callAsk(r); return; } };
async function counter(i){ const r=await act({t:'vn',op:'counter',i}); if(!done(r)) return; MAPX.tk=null; UI.vnptDesk(i); }
function callAsk(q){ GAME.sfx('blip',.5); GAME.ask(`☎ Cuộc gọi ${q.n}/${q.of}: "${q.q}"`,'vn_caller',q.opts,async a=>{ const r=await act({t:'vn',op:'answer',a}); if(!done(r)) return;
    toast(r.right?'✔ Khách hài lòng! +40.000đ':`✘ Chưa ổn. Nên trả lời: "${esc(r.good)}"`,r.right?'item':'lock');
    if(r.next) setTimeout(()=>callAsk(r.next),700); else toast(`Hết ca trực: ${r.ok}/${r.of} cuộc gọi khách hài lòng${r.ok>=4?' · đạt yêu cầu chị Thu!':''}`,'quest'); }); }
/* ---------- Miếu ông Trường Con ---------- */
const QUE_SAY={good:'Quẻ tốt đấy cháu. Có lộc nhỏ đầu ngày, cứ chăm chỉ là may mắn theo.',mid:'Quẻ bình thường thôi, không lo. Việc gì cũng từ từ mà làm cho kỹ.',low:'Quẻ hạ cũng chỉ là lời nhắc: đi đứng cẩn thận, nghỉ ngơi cho đủ. Thắp nén hương cho yên tâm cháu nhé.'};
MAPX.mieu=async(op,it)=>{
  if(op==='congduc'){ const V=[1e6,5e6,1e7]; GAME.ask('Hòm công đức Miếu ông Trường Con: tuỳ tâm công đức bao nhiêu?','mieu_tu',V.map(v=>fmt(v)).concat(['Thôi']),async i=>{ if(i>=V.length) return; tell(await act({t:'mieu',op:'congduc',v:V[i]})); }); return; }   /* công đức (thành tựu item huyền thoại) */
  if(op==='incense'){ const r=await act({t:'mieu',op:'incense'}); if(done(r)) toast('Thắp hương... (giữ yên 5 giây)','quest'); return; }
  if(op==='que'){ const r=await act({t:'mieu',op:'que'}); if(!done(r)) return; GAME.sfx('blip',.5);
    GAME.say([['me','(Lắc ống xăm... một thẻ rơi ra)'],['mieu_tu',`Quẻ ${r.tier}: "${r.poem}"`],['mieu_tu',QUE_SAY[r.kind]+(r.kind==='good'?' (+50.000đ lộc)':'')]]); return; }
  if(op==='wish'){ const W=SD.MIEU.wishes, ks=Object.keys(W); GAME.ask(`Mua dải lụa đỏ (${fmt(SD.MIEU.wishPrice)}) buộc lên cành đa. Cầu gì?`,'mieu_tu',ks.map(k=>W[k].name).concat(['Thôi']),async i=>{ if(i>=ks.length) return; tell(await act({t:'mieu',op:'wish',k:ks[i]})); }); return; }
  if(op==='food') return UI.place('banhda',{id:'banhda'});
  if(op==='clip') return tell(await act({t:'mieu',op:'clip'}));
  if(op==='luoc'){ const r=await act({t:'mieu',op:'luoc'}); if(done(r)) toast('🍗 Đang luộc gà, chờ nước sôi...','quest'); return; }
  if(op==='stele'){ GAME.say([['me','(Bia đá đặt trên lưng rùa, chữ đã mờ theo năm tháng)'],['mieu_tu','Bia ghi công đức bà con trong làng góp tiền tu sửa miếu. Rùa đội bia là mong cho bền lâu, vững chãi đấy cháu.']]); return; }
  if(op==='altar'){ const l=SD.lunarDate(NET.now()), h=SD.holyDay(NET.now()); GAME.say([['mieu_tu',`Hôm nay mùng ${l.d} tháng ${l.m} âm lịch${h?` · ${h}`:''}. Vào lễ thì đứng ngay ngắn, chắp tay, khấn cho gia đình bình an là được.`],['me','(Chắp tay vái ba vái trước ban thờ)']]); GAME.sfx('bell',.3); return; } };

/* ---------- vật nhặt ở map khác + linh vật ---------- */
MAPX.consider=(consider,dist)=>{ const g=G(), S=GAME.S; if(!g||!S) return; const B=SD.BEARPLUS;
  if(S.kind==='bearplus'){ const d=dist(B.bear.x*T,B.bear.y*T); if(d<32) consider(d*.6,{type:'mapx',k:'bear',label:'Bé Gấu Plus'}); }
  if(S.kind==='das'&&Q('bp_head')==='active'&&!(g.items.dau_gau>0)){ const d=dist(B.head.x*T,B.head.y*T); if(d<22) consider(d,{type:'mapx',k:'head',label:'Nhặt Đầu Bé Gấu'}); }
  if(S.kind==='retreat'&&Q('vn_fiber')==='active'){ const f=(g.flags&&g.flags.fpts)||{}; SD.VNPT.fiberPts.forEach((p,i)=>{ if(f[i]) return; const d=dist(p.x*T,p.y*T); if(d<24) consider(d,{type:'mapx',k:'fiber',i,label:'Hàn nối cáp quang: '+p.name}); }); } };
MAPX.pick=async x=>{ if(x.k==='bear') return UI.place('bpbear',{id:'bp_bear'});
  if(x.k==='head'){ const r=await act({t:'bp',op:'head'}); if(done(r)){ GAME.sfx('item_pickup',.6); tell(r); } return; }
  if(x.k==='fiber') return tell(await act({t:'vn',op:'fiberpt',i:x.i})); };

/* ---------- chỉ đường nhiệm vụ của 3 map ---------- */
MAPX.go=id=>{ const q=SD.QUESTS[id]; if(!q) return false; GO_ID=id; const B=SD.BEARPLUS, V=SD.VNPT, M=SD.MIEU, S=GAME.S, can=GAME.canFinish(id), w=(x,y,l)=>GAME.walkTo(x,y,l);
  if(id.startsWith('bp_')){ if(id==='bp_head'&&!can&&Q(id)==='active'){ if(S.kind==='das') return w(B.head.x,B.head.y,'Đầu Bé Gấu'),true; grabTo('DAS (TP.HCM)'); return true; }
    if(S.kind!=='bearplus'){ grabTo('Bearplus Studio (TP.HCM)'); return true; }
    if(can) return (q.giver==='bp_bear'?w(B.bear.x,B.bear.y+1.2,'Bé Gấu'):GAME.walkToNpc(q.giver)),true;
    const spot={bp_brief:[B.meet.x,B.meet.y+1.2,'Phòng họp'],bp_mood:[B.mood.x,3.4,'Moodboard'],bp_wire:[B.desks[0][0],B.desks[0][1]+.9,'Bàn iMac'],bp_fix:[B.desks[1][0],B.desks[1][1]+.9,'Bàn iMac'],
      bp_3d:[B.render.x,B.render.y+.9,'Trạm render'],bp_motion:[B.motion.x,B.motion.y+.9,'Góc motion'],bp_aww:[B.cups.x,B.cups.y+.9,'Tủ giải'],bp_coffee:[B.coffee.x,B.coffee.y+.9,'Quầy cà phê']}[id];
    if(spot) w(...spot); return true; }
  if(id==='vn_fiber'){ if(can){ if(S.kind==='vnpt') GAME.walkToNpc('vn_tuan'); else grabTo('VNPT (Hà Nội)'); return true; }
    if(S.kind!=='retreat'){ toast('Lên <b>Ké Retreat</b> nối 3 hộp cáp quang (chấm cam trên minimap)','quest'); GAME.autoGo('retreat',()=>GAME.questGo(id)); return true; }
    const f=(G().flags&&G().flags.fpts)||{}, i=V.fiberPts.findIndex((p,k)=>!f[k]); if(i>=0) w(V.fiberPts[i].x,V.fiberPts[i].y+.6,V.fiberPts[i].name); return true; }
  if(id==='vn_call'){ if(S.kind!=='vnpt'){ grabTo('VNPT (Hà Nội)'); return true; } if(can) GAME.walkToNpc('vn_thu'); else w(V.desks[0][0],V.desks[0][1]+.9,'Bàn tổng đài'); return true; }
  if(id==='tc_antruc'){ if(can) return S.kind==='mieu'?(GAME.walkToNpc('truongcon'),true):(grabTo('Miếu ông Trường Con (Hải Phòng)'),true); if(S.kind==='yenlang') return GAME.walkToNpc('do'),true; grabTo('120 Yên Lãng (nhà anh Độ)'); return true; }
  if(id==='tc_luocga'||id==='tc_raubun'){ if(S.kind!=='mieu'){ grabTo('Miếu ông Trường Con (Hải Phòng)'); return true; } if(can) return GAME.walkToNpc('truongcon'),true;
    const g=G(), gotGa=(g.items.ga_thit||0)+(g.items.chicken||0)>0; if(id==='tc_luocga'&&gotGa) return w(M.stove.x,M.stove.y+.9,'Bếp củi'),true; return w(M.cart.x,M.cart.y+.9,'Xe bà Lụa'),true; }
  if(id==='mieu_cauan'||id==='tc_clip'){ if(S.kind!=='mieu'){ grabTo('Miếu ông Trường Con (Hải Phòng)'); return true; }
    if(can) return GAME.walkToNpc(q.giver),true;
    if(id==='tc_clip') return w(M.tiktok.x+.8,M.tiktok.y+.6,'Đèn vòng'),true;
    const f=(G().flags&&G().flags.cauan)||{}; const nx=!f.incense?[M.burner.x,M.burner.y+.9,'Lư hương']:!f.que?[M.fortune.x,M.fortune.y+.9,'Ống xăm']:[M.wish.x,M.wish.y,'Cây đa']; w(...nx); return true; }
  return false; };

/* ---------- hình động ---------- */
const CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
MAPX.anim=(o,clock)=>{ const a=o.anim;
  if(a==='render'){ const f=Math.floor(clock*4)%4; return cached('rd'+f,()=>A.renderStation(f)); }
  if(a==='stove'){ const f=Math.floor(clock*6)%2; return cached('sv'+f,()=>A.stove(f)); }
  if(a==='charger'){ const f=Math.floor(clock*2)%4; return cached('cg'+f,()=>A.chargeStation(f)); }
  if(a==='rack'){ const f=(Math.floor(clock*3)+Math.round(o.x/16))%6; return cached('rk'+f,()=>A.serverRack(f)); }
  if(a==='shrine'){ const f=Math.floor(clock*5)%3; return cached('sh'+f,()=>A.shrine(f)); }
  if(a==='gate'){ const f=Math.floor(clock*2)%4; return cached('gt'+f,()=>A.mieuGate(f)); }
  if(a==='flag'){ const f=(Math.floor(clock*6)+Math.round(o.x/16))%4; return cached('fl'+f,()=>A.flag5(f)); }
  return null; };

/* ---------- vẽ thêm theo map ---------- */
let smokeT=0, steamT=0;
MAPX.draw=(list,ctx)=>{ const S=GAME.S, g=G(); if(!S||!g) return; const cam=GAME.cam, clock=GAME.clock, B=SD.BEARPLUS, fx=GAME.fx;
  if(S.kind==='bearplus'){ const x=B.bear.x*T, y=B.bear.y*T, hasHead=Q('bp_head')==='done', fr=Math.floor(clock*2.4)%2, sp=cached('bm'+hasHead+fr,()=>A.bearMascot(hasHead,fr));
    list.push({y,d:()=>{ GAME.shadow(x,y,12); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }}); }
  if(S.kind==='das'&&Q('bp_head')==='active'&&!(g.items.dau_gau>0)){ const x=B.head.x*T, y=B.head.y*T, sp=cached('bh',()=>A.bearHead());
    list.push({y,d:()=>{ GAME.shadow(x,y,9); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y+Math.sin(clock*3)*1)); }}); if(Math.random()<.02) fx.push({kind:'glint',x:x+(Math.random()-.5)*14,y:y-10,t:0,life:.6}); }
  if(S.kind==='retreat'&&Q('vn_fiber')==='active'){ const f=(g.flags&&g.flags.fpts)||{}; SD.VNPT.fiberPts.forEach((p,i)=>{ const x=p.x*T, y=p.y*T, ok=f[i]; list.push({y,d:()=>{ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y);
      ctx.fillStyle='#1c1516'; ctx.fillRect(X-5,Y-13,10,12); ctx.fillStyle='#8a96a2'; ctx.fillRect(X-4,Y-12,8,10); ctx.fillStyle='#0b6bc2'; ctx.fillRect(X-4,Y-12,8,2);
      ctx.fillStyle=ok?'#5fe06a':(Math.floor(clock*3)%2?'#ffb03a':'#6a3a10'); ctx.fillRect(X+1,Y-8,2,2); ctx.fillStyle='#ff9a2a'; ctx.fillRect(X-2,Y-2,1,3); }}); }); }
  if(S.kind==='vnpt'){ const V=SD.VNPT, now=NET.now(), sv=SD.vnptServing(now), tk=MAPX.tk, mine=tk&&sv>=tk.n, bx=V.board.x*T, by=V.board.y*T;
    if(tk&&mine&&!MAPX.called){ MAPX.called=true; GAME.snd.bell&&GAME.snd.bell(); GAME.banner(`Mời quý khách số ${tk.n} tới quầy ${tk.c}`); GAME.sayLine(`Xin mời quý khách có số thứ tự ${tk.n}, đến quầy số ${tk.c}`,1,'vi'); }
    list.push({y:-9999,d:()=>{ const P=A.painter(ctx), X=Math.round(bx-48-cam.x), Y=Math.round(by-24-cam.y), blink=Math.floor(clock*2)%2;
      A.text3(P,X+58,Y+4,String(sv).padStart(4,'0'),'#ff4a3a'); const n=mine?tk.n:sv, c=mine?tk.c:(sv%4)+1; if(!mine||blink) A.text3(P,X+60,Y+13,`${n}-Q${c}`,mine?'#ffe680':'#ff4a3a'); }}); }
  if(S.kind==='mieu'){ const M=SD.MIEU; smokeT-=1/60; steamT-=1/60;
    if(smokeT<=0){ smokeT=.35; fx.push({kind:'smoke',x:M.burner.x*T+(Math.random()-.5)*10,y:M.burner.y*T-34,t:0,life:2.4}); }
    if(steamT<=0){ steamT=.5; fx.push({kind:'steam',x:(M.cart.x-1.4)*T+(Math.random()-.5)*12,y:M.cart.y*T-38,t:0,life:1.2}); } } };

window.MAPX=MAPX;
})();
