/* Chan City — client của Group Nghiện Motion: tương tác (nm:…), chỉ đường nhiệm vụ, hình động (TV showreel, màn game đối kháng,
   bếp đá xông hơi), Gundam RX-78-2 và Evangelion Unit-01 đứng nhún (bấm E để gặp), hơi nước bốc trong phòng xông hơi. Nối thêm vào MAPX của maps3.js. */
(function(){
const SD=SHARED, A=ART, T=A.T, G=()=>GAME.G, esc=s=>GAME.esc(s), X=window.MAPX, N=SD.NMOTION;
const act=m=>GAME.act(m), toast=(h,k)=>GAME.toast(h,k), done=r=>r&&!r.err;
const Q=id=>(G().quests||{})[id], here=()=>GAME.S&&GAME.S.kind==='nghienmotion';
const CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
const BOTS=['gundam','eva'];
const START={sauna:'🧖 Ngồi xuống ghế gỗ, hơi nóng phả lên mặt... (giữ yên 15 giây)',tv:'📺 Bật showreel lên TV lớn, cả group xúm lại xem...',model:'🔧 Cầm kìm cắt runner lên...',desk:'🎬 Mở After Effects, bắt đầu keyframe...'};

/* ---------- tương tác ---------- */
const LOOK={toys:'Tủ kính chật kín: RX-78, Zaku, Eva-01, Optimus, Wing Zero, Zaku đỏ của Char, mấy em Haro. Dán giấy "CẤM SỜ, HỎI GIÁO CHỦ"',zaku:'Zaku II cao bằng người thật, mắt hồng quét qua quét lại. Ai bước vào cũng bị "soi"',optimus:'Optimus Prime đứng gác cạnh bảng kanban: "Autobots, render out!"'};
X.nm=async(op,it)=>{ if(op==='snack') return UI.place('nm_tuck',{id:'nm_tuck'}); if(LOOK[op]){ GAME.sfx('blip',.4); return toast(LOOK[op],'item'); } const r=await act({t:'nm',op,i:it&&it.i}); if(!done(r)) return;
  if(r.fight) return UI.evaFight(r.lv);
  if(r.msg) return toast(esc(r.msg),'quest');
  if(r.sec){ if(op==='sauna') GAME.sfx('splash',.35); toast(START[op]||'Đang làm...','quest'); } };

/* ---------- xông hơi lâu: tooltip ngay trên thanh item (server gửi 'steam' mỗi giây khi đang trong phòng) ---------- */
{ const tip=document.createElement('div'); tip.id='steamTip'; tip.className='panel'; tip.hidden=true; document.getElementById('hudBottom').prepend(tip);
  const hm=s=>{ const g=Math.round(s*SD.RULES.timeScale/60); return Math.floor(g/60)+'g'+String(g%60).padStart(2,'0'); };   /* giây thật → giờ game */
  NET.listen('steam',m=>{ document.body.classList.toggle('steam',!m.off); if(m.off){ tip.hidden=true; return; } tip.hidden=false; const k=Math.min(1,m.used/m.cap);
    tip.innerHTML=m.full?`<div>🧖 Hôm nay xông đủ ${hm(m.cap)} rồi, mai quay lại nhé · đã nhận <b>+${m.exp} EXP</b></div>`
      :`<div>🧖 Xông hơi <b>${Math.floor(m.min)} phút</b> liên tục · <b>+${m.rate.toFixed(1)} EXP/phút</b>${m.rate<N.steam.max?' (càng lâu càng tăng)':' (tối đa)'} · đã nhận <b>+${m.exp} EXP</b></div><i class="stbar"><i style="width:${Math.round(k*100)}%"></i></i><small>Hôm nay ${hm(m.used)} / ${hm(m.cap)} · ra khỏi phòng là tính lại từ đầu</small>`; }); }

/* ---------- Gundam / Eva (vật thể, không phải avatar) ---------- */
const c0=X.consider, p0=X.pick, g0=X.go, a0=X.anim, d0=X.draw;
X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()) return;
  for(const k of BOTS){ const d=dist(N[k].x*T,N[k].y*T); if(d<36) consider(d*.5,{type:'mapx',k,label:SD.NPC_LOOKS[k].name}); } };
X.pick=x=>BOTS.includes(x.k)?UI.place(x.k,{id:x.k}):p0(x);

/* ---------- chỉ đường nhiệm vụ ---------- */
X.go=id=>{ if(!/^(nm|gp|ev)_/.test(id)) return g0(id); const q=SD.QUESTS[id]; if(!q) return false;
  const w=(x,y,l)=>GAME.walkTo(x,y,l), P=GAME.P;
  if(!here()){ GAME.autoGo('nghienmotion',()=>GAME.questGo(id)); return true; }
  if(GAME.canFinish(id)||Q(id)!=='active'){ if(q.giver==='trong') GAME.walkToNpc('trong'); else w(N[q.giver].x,N[q.giver].y+1.2,SD.NPC_LOOKS[q.giver].name); return true; }
  const desk=N.desks.map(([x,y])=>[x,y+.9]).sort((a,b)=>Math.hypot(a[0]*T-P.x,a[1]*T-P.y)-Math.hypot(b[0]*T-P.x,b[1]*T-P.y))[0];
  const spot={nm_ball:[...desk,'Bàn làm motion'],nm_easing:[...desk,'Bàn làm motion'],nm_logo:[...desk,'Bàn làm motion'],nm_reel:[N.tv.x,3.4,'TV lớn'],
    gp_build:[N.model.x,N.model.y+.9,'Bàn lắp mô hình'],gp_panel:[N.model.x,N.model.y+.9,'Bàn lắp mô hình'],ev_win:[N.game.x,N.game.y+.9,'Góc game']}[id];
  if(spot) w(...spot); return true; };

/* ---------- hình động ---------- */
X.anim=(o,clock)=>{ const a=o.anim;
  if(a==='nmtv'){ const f=Math.floor(clock*3)%4; return cached('tv'+f,()=>A.nmTV(f)); }
  if(a==='nmgame'){ const f=Math.floor(clock*4)%4; return cached('gc'+f,()=>A.gameCorner(f)); }
  if(a==='zaku'){ const f=Math.floor(clock*2)%4; return cached('zk'+f,()=>A.zakuStatue(f)); }
  if(a==='haro'){ const f=(Math.floor(clock*3)+Math.round(o.x/16))%2; return cached('hr'+f,()=>A.haro(f)); }
  if(a==='snack'){ const f=Math.floor(clock*3)%2; return cached('sn'+f,()=>A.snackRack(f)); }
  if(a==='heater'){ const f=Math.floor(clock*5)%2; return cached('ht'+f,()=>A.saunaHeater(f)); }
  return a0(o,clock); };

/* ---------- vẽ thêm: Gundam, Eva, dấu nhiệm vụ, hơi nước ---------- */
const mark=(ctx,X0,Y0,ch,col)=>{ ctx.fillStyle='#120c16'; ctx.fillRect(X0-3,Y0-1,7,10); ctx.fillStyle=col;
  if(ch==='!'){ ctx.fillRect(X0-1,Y0,3,5); ctx.fillRect(X0-1,Y0+6,3,2); } else { ctx.fillRect(X0-2,Y0,5,2); ctx.fillRect(X0+1,Y0+2,2,2); ctx.fillRect(X0-1,Y0+4,3,1); ctx.fillRect(X0-1,Y0+6,3,2); } };
const botMark=k=>{ const qs=Object.keys(SD.QUESTS).filter(id=>SD.QUESTS[id].giver===k);
  if(qs.some(id=>Q(id)==='active'&&GAME.canFinish(id))) return ['?','#5fe06a'];
  if(qs.some(id=>!Q(id)&&(!SD.QUESTS[id].after||Q(SD.QUESTS[id].after)==='done'))) return ['!','#ffd84a']; return null; };
let steamT=0;
X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()) return; const cam=GAME.cam, clock=GAME.clock, fx=GAME.fx, Z=N.sauna, P=GAME.P;
  for(const k of BOTS){ const x=N[k].x*T, y=N[k].y*T, fr=Math.floor(clock*(k==='eva'?2.2:1.8))%2, sp=cached(k+fr,()=>A[k](fr)), mk=botMark(k);
    list.push({y,d:()=>{ GAME.shadow(x,y,11); const X0=Math.round(x-cam.x), Y0=Math.round(y-cam.y); ctx.drawImage(sp.c,X0-sp.ax,Y0-sp.ay);
      if(mk) mark(ctx,X0,Y0-sp.ay-12+Math.round(Math.sin(clock*4)),mk[0],mk[1]); }}); }
  steamT-=1/60; if(steamT>0) return; const tx=P.x/T, ty=P.y/T, inside=tx>=Z.x0&&tx<=Z.x1+1&&ty>=Z.y0&&ty<=Z.y1+1; steamT=inside?.14:.35;
  fx.push({kind:'steam',x:(N.heater.x+(Math.random()-.5)*1.2)*T,y:N.heater.y*T-30,t:0,life:1.6});
  if(Math.random()<.6) fx.push({kind:'steam',x:(Z.x0+1.5+Math.random()*(Z.x1-Z.x0-1))*T,y:(Z.y0+2.5+Math.random()*(Z.y1-Z.y0-2))*T,t:0,life:2.2}); };
})();
