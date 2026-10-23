/* Chan City — client của 120 Yên Lãng mở rộng: góc Refund Gaming + bếp Haky Food. Tương tác rf:desk / rf:spot, chỉ đường nhiệm vụ (cả nhiệm vụ ẩn đã lộ),
   hình động màn hình PUBG, lửa bếp ga, bàn DJ; hơi bốc từ nồi lẩu. Nối thêm vào MAPX (maps3.js). */
(function(){
const SD=SHARED, A=ART, T=A.T, G=()=>GAME.G, esc=s=>GAME.esc(s), X=window.MAPX, R=SD.RF;
const act=m=>GAME.act(m), toast=(h,k)=>GAME.toast(h,k), done=r=>r&&!r.err, Q=id=>(G().quests||{})[id];
const here=()=>GAME.S&&GAME.S.kind==='yenlang', CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
X.rf=async(op,it)=>{ const r=await act({t:'rf',op:op==='desk'?'desk':'spot',k:it&&it.k,i:it&&it.i}); if(!done(r)) return;
  if(r.secret){ GAME.sfx('level_up',.5); GAME.bigText('NHIỆM VỤ ẨN!'); return toast(esc(r.msg),'quest'); }
  if(r.msg) return toast(esc(r.msg),'item'); if(r.sec) toast('Bắt đầu... đứng yên nhé','quest'); };
/* ---------- chỉ đường ---------- */
const g0=X.go; X.go=id=>{ if(!/^(rf|hk|sq)_/.test(id)) return g0(id); const q=SD.QUESTS[id]; if(!q) return false;
  if(!here()){ GAME.autoGo('yenlang',()=>GAME.questGo(id)); return true; }
  if(GAME.canFinish(id)||Q(id)!=='active'){ GAME.walkToNpc(q.giver); return true; }
  if(id==='sq_banhbao') return GAME.walkToNpc('rf_jikey'),true;
  const t=R.tasks[id]; if(!t){ GAME.walkToNpc(q.giver); return true; }
  if(t.at==='desk'){ const P=GAME.P, d=R.desks.slice().sort((a,b)=>Math.hypot(a[0]*T-P.x,a[1]*T-P.y)-Math.hypot(b[0]*T-P.x,b[1]*T-P.y))[0]; GAME.walkTo(d[0],d[1]+.8,'Máy PUBG'); return true; }
  const s=R.spots[t.at]; GAME.walkTo(s.x,s.y,s.label); return true; };
/* ---------- hình động ---------- */
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim||'';
  if(a.startsWith('rfdesk')){ const i=+a.slice(6), f=(Math.floor(clock/2.5)+i)%4; return cached('pd'+f,()=>A.pubgDesk(f)); }
  if(a==='rfstove'){ const f=Math.floor(clock*6)%2; return cached('ks'+f,()=>A.kitchenRow(f)); }
  if(a==='rfbooth'){ const f=Math.floor(clock*4)%4; return cached('dj'+f,()=>A.djBooth(f)); }
  return a0(o,clock); };
let steamT=0; const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()) return; steamT-=1/60; if(steamT>0) return; steamT=.45;
  GAME.fx.push({kind:'steam',x:(32.3+(Math.random()-.5)*.6)*T,y:3.4*T,t:0,life:1.3}); };
})();
