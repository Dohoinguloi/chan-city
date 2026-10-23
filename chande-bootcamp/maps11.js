/* Chan City — Cổng D-Day (client, server dday.js): bảng ghép trận ở nhà sự kiện trên quảng trường MU (1-1, 2-2, 3-3, mỗi ngày 2 trận),
   trong đấu trường: nhà chính 2 đội + thanh máu, đợt quái chạy dọc đường, nhà chính bắn kẻ địch, vòng xanh / đỏ dưới chân phe ta / phe địch,
   bảng tỉ số trên cùng màn hình (máu 2 nhà chính, giờ còn lại, số lần hạ gục), thẻ kết quả + phần thưởng lúc hết trận.
   window.DDAY: vị trí / danh sách mục tiêu cho đánh thường và hiệu ứng chiêu ở maps8 (mã 'dd:<id>'). */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, D=SD.MU.dday, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a), $=s=>document.querySelector(s);
const CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn()), kind=()=>GAME.S&&GAME.S.kind, BASE_ID=900000, PL_ID=1000000;
let Q={v:{},mode:0}, INFO=null, ST=null, CR=new Map(), MYTEAM=-1;
const teamOf=pid=>!ST?-1:ST.teams[0].includes(pid)?0:ST.teams[1].includes(pid)?1:-1;
const posOf=pid=>{ if(pid===NET.pid) return [GAME.P.x,GAME.P.y]; const r=GAME.REM&&GAME.REM.get(pid); return r?[r.x,r.y]:null; };
const fmtLeft=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };

/* ---------- nhà sự kiện ở quảng trường MU ---------- */
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(kind()!=='mu') return; const d=dist(D.gate.x*T,(D.gate.y+.6)*T); if(d<3*T) consider(d*.4,{type:'mapx',k:'ddgate',label:'Cổng D-Day (1-1 · 2-2 · 3-3)'}); };
const p0=X.pick; X.pick=async x=>{ if(x.k==='ddgate') return UI.dday(); return p0(x); };
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim; if(a==='ddgate'){ const f=Math.floor(clock*2)%2; return cached('dg'+f,()=>A.ddayGate(f)); }
  if(a==='ddbase0'||a==='ddbase1'){ const k=+a.slice(-1), f=Math.floor(clock*3)%2; return cached('db'+k+f,()=>A.ddayBase(k,f)); } return a0?a0(o,clock):null; };
UI.dday=async()=>{ UI.open('Cổng D-Day',()=>{ const v=(INFO&&INFO.q)||Q.v||{}, mine=Q.mode||(INFO&&INFO.mode)||0, left=INFO?INFO.left:'?', R=D.reward.win;
    return `<p>"Ghép trận đánh nhau giữa 2 đội: mỗi đội 1 <b>nhà chính</b> ở 2 đầu đấu trường, cứ ${D.wave.every} giây nhà chính tung 1 đợt quái chạy sang đánh nhà kia. Đánh quái, đánh người đội kia, <b>phá nhà chính đối thủ trước là thắng</b>. Nhà chính tự bắn kẻ địch lại gần, đừng xông vào sớm!"</p>
      <p>Mỗi trận tối đa ${Math.round(D.time/60)} phút (hết giờ đội còn nhiều máu nhà chính hơn thắng). Mỗi ngày vào được <b>${D.perDay} trận</b> · hôm nay còn <b>${left}</b> trận.</p>
      <div class="list">${Object.entries(D.modes).map(([m,name])=>{ const n=v[m]||0, need=m*2, me=+m===mine; return `<div class="row"><span><b>⚔ ${esc(name)}</b> · ${m} đấu ${m}<br><small class="muted">đang chờ ${n}/${need} người</small></span>${me?`<em class="good">Đang chờ...</em>${btn('ddleave','Huỷ chờ')}`:btn('ddjoin',`Vào hàng chờ ${esc(name)}`,{m},mine?'':'pri')}</div>`; }).join('')}</div>
      <p class="muted">Thắng: 🎁 <b>vật phẩm bí mật huyền thoại</b>, +${R.exp} EXP, ${SD.fmt(R.vnd)}, +${R.mu} EXP MU, ${R.gems} Ngọc Cường Hoá, ${R.jewels} ngọc quý, 1 Trái Ác Quỷ. Thua vẫn có thưởng an ủi.</p>${INFO&&INFO.live&&INFO.live.length?`<p class="muted">Đang có ${INFO.live.length} trận diễn ra.</p>`:''}`; },{wide:true});
  const r=await NET.req({t:'dday',op:'info'}); if(r&&!r.err){ INFO=r; UI.refresh(); } };
UI.onAct('ddjoin',async d=>{ const r=await GAME.act({t:'dday',op:'join',mode:+d.m}); if(!r||r.err) return; Q.mode=r.mode; toast(esc(r.msg),'quest'); const i=await NET.req({t:'dday',op:'info'}); if(i&&!i.err) INFO=i; UI.refresh(); });
UI.onAct('ddleave',async()=>{ await GAME.act({t:'dday',op:'leave'}); Q.mode=0; const i=await NET.req({t:'dday',op:'info'}); if(i&&!i.err) INFO=i; UI.refresh(); });
NET.listen('ddq',m=>{ Q=m; if(INFO) INFO.q=m.v; if(UI.isOpen()) UI.refresh(); });
NET.listen('ddstart',m=>{ MYTEAM=m.team; Q.mode=0; UI.closeAll(); GAME.bigText('D-DAY BẮT ĐẦU!'); GAME.sfx('power_up',.8); toast(`Bạn ở <b style="color:${D.bases[m.team].col}">${esc(D.bases[m.team].name)}</b>: bảo vệ nhà mình, phá nhà chính đối thủ! (trận ${m.left}/${m.per} hôm nay)`,'quest'); });
NET.listen('dday',m=>{ ST=m.v; const seen=new Set(); for(const [id,team,x,y,hp] of ST.creeps){ seen.add(id); let c=CR.get(id); if(!c){ c={x,y,team,face:team?-1:1,atk:0}; CR.set(id,c); } c.tx=x; c.ty=y; c.hp=hp; }
  for(const id of CR.keys()) if(!seen.has(id)) CR.delete(id); for(const [k,x,y] of ST.shots){ const key=k+':'+x+':'+y; if(!SHOTS.has(key)) SHOTS.set(key,{k,x:x*T,y:y*T,t:performance.now()}); } });
const SHOTS=new Map();
// thẻ kết quả: thắng / thua / hoà + phần thưởng, tự ẩn sau 10 giây
let endT=0; NET.listen('ddend',m=>{ let el=$('#ddEnd'); if(!el){ el=document.createElement('div'); el.id='ddEnd'; el.className='panel'; el.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:60;min-width:300px;max-width:92vw;padding:14px 18px;text-align:center'; document.body.appendChild(el); el.addEventListener('click',e=>{ if(e.target.closest('.x')) el.hidden=true; }); }
  const items=Object.entries(m.items||{}), head=m.win>0?'🏆 CHIẾN THẮNG!':m.win<0?'💀 THUA RỒI':'🤝 HOÀ';
  el.innerHTML=`<button class="x" type="button" aria-label="Đóng">✕</button><h3 style="margin:0 0 4px">${head}</h3><small>${esc(m.why||'')} · hạ gục ${m.kills[0]} - ${m.kills[1]}</small>
    ${m.secret?`<p style="font-size:18px;color:#ffd84a">🎁 Vật phẩm bí mật huyền thoại: <b>${esc(m.secret)}</b></p>`:''}<p>+${m.exp} EXP · +${SD.fmt(m.vnd)} · +${m.mu} EXP MU</p>
    ${items.length?`<p>${items.map(([k,n])=>`${UI.ico(SD.ITEMS[k].icon)} ${esc(SD.ITEMS[k].name)}${n>1?' ×'+n:''}`).join(' · ')}</p>`:''}<small class="muted">6 giây nữa về Cổng D-Day ở quảng trường MU</small>`;
  el.hidden=false; GAME.bigText(head); GAME.sfx(m.win>0?'level_up':'poof',.8); clearTimeout(endT); endT=setTimeout(()=>{ el.hidden=true; },10000); });

/* ---------- đấu trường: quái, nhà chính, phát bắn, vòng đội dưới chân ---------- */
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const hud=$('#ddHud'); if(kind()!=='dday'||!ST){ if(hud) hud.hidden=true; if(kind()!=='dday'){ ST=null; CR.clear(); } return; }
  const now=performance.now(), cam=GAME.cam, clock=GAME.clock;
  for(const [id,c] of CR){ const ox=c.x; c.x+=(c.tx-c.x)*.25; c.y+=(c.ty-c.y)*.25; if(Math.abs(c.x-ox)>.002) c.face=c.x>ox?1:-1; const mv=Math.abs(c.x-ox)>.002, f=mv?Math.floor(clock*6+id)%2:0, sp=cached('dc'+c.team+f,()=>A.ddCreep(c.team,f));
    list.push({y:c.y*T,d:()=>{ const X0=Math.round(c.x*T-cam.x), Y0=Math.round(c.y*T-cam.y); GAME.shadow(c.x*T,c.y*T,6); const oc=window.MU8&&window.MU8.tg?window.MU8.tg():null, key='dd:'+id;
      ctx.save(); ctx.translate(X0,Y0); if(c.face<0) ctx.scale(-1,1); if(oc&&(oc.hov===key||oc.lock===key)) ctx.drawImage(window.MU8.outline(sp.c,oc.lock===key?'#ff4a3a':'#ffe14a'),-sp.ax-1,-sp.ay-1); ctx.drawImage(sp.c,-sp.ax,-sp.ay); ctx.restore(); }}); }
  for(const [key,s] of SHOTS){ const el=now-s.t; if(el>350){ SHOTS.delete(key); continue; } const b=D.bases[s.k]; list.push({y:99989,d:()=>{ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=1-el/350; ctx.strokeStyle=s.k?'#ff8a8a':'#8ac8ff'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(b.x*T-cam.x,b.y*T-cam.y-46); ctx.lineTo(s.x-cam.x,s.y-cam.y-10); ctx.stroke(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(s.x-cam.x,s.y-cam.y-10,4,0,7); ctx.fill(); ctx.restore(); }}); }   /* nhà chính bắn */
  for(const pid of [...ST.teams[0],...ST.teams[1]]){ const p=posOf(pid); if(!p) continue; const tm=teamOf(pid), ally=tm===MYTEAM; list.push({y:p[1]-1,d:()=>{ ctx.save(); ctx.strokeStyle=ally?'rgba(90,170,255,.9)':'rgba(255,80,80,.9)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(p[0]-cam.x,p[1]-cam.y,9,3.5,0,0,7); ctx.stroke(); ctx.restore(); }}); }   /* xanh: phe mình · đỏ: phe địch */
  if(hud&&now-(hud._t||0)>200){ hud._t=now; const bar=(k)=>{ const v=ST.base[k], w=Math.max(0,100*v/ST.max); return `<span style="display:inline-block;width:120px;height:10px;background:#2a1418;border:1px solid #120c16;vertical-align:middle"><i style="display:block;height:100%;width:${w}%;background:${D.bases[k].col}"></i></span>`; };
    hud.hidden=false; hud.innerHTML=`<b style="color:${D.bases[0].col}">${esc(D.bases[0].name)}</b> ${bar(0)} <small>${ST.base[0]}</small> &nbsp; ⏱ <b>${fmtLeft(ST.until-NET.now())}</b> · ⚔ ${ST.kills[0]} - ${ST.kills[1]} &nbsp; <small>${ST.base[1]}</small> ${bar(1)} <b style="color:${D.bases[1].col}">${esc(D.bases[1].name)}</b>${MYTEAM>=0?`<br><small>Bạn ở ${esc(D.bases[MYTEAM].name)} · phá nhà chính đối thủ!</small>`:''}`; } };
// thanh máu quái + nhà chính (lớp chữ)
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); if(kind()!=='dday'||!ST) return;
  for(const c of CR.values()){ const w=22, X0=Math.round(sx(c.x*T)-w/2), Y0=Math.round(sy(c.y*T-28)); ug.fillStyle='#120c16'; ug.fillRect(X0-1,Y0-1,w+2,5); ug.fillStyle=D.bases[c.team].col; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*c.hp/100)),3); }
  D.bases.forEach((b,k)=>{ const w=90, X0=Math.round(sx(b.x*T)-w/2), Y0=Math.round(sy(b.y*T-76)); ug.fillStyle='#120c16'; ug.fillRect(X0-2,Y0-2,w+4,10); ug.fillStyle='#3a1418'; ug.fillRect(X0,Y0,w,6); ug.fillStyle=b.col; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*ST.base[k]/ST.max)),6);
    ug.font='14px VT323, monospace'; tag(sx(b.x*T),Y0-4,`${b.name}${k===MYTEAM?' (nhà mình)':''}`,'',b.col); }); };
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k==='mu') dot(D.gate.x*T,D.gate.y*T,'#ff6a3a',2); if(k!=='dday'||!ST) return; for(const c of CR.values()) dot(c.x*T,c.y*T,D.bases[c.team].col,1); D.bases.forEach(b=>dot(b.x*T,b.y*T,b.col,3)); };
setTimeout(()=>{ if($('#ddHud')) return; const h=document.createElement('div'); h.id='ddHud'; h.className='panel'; h.hidden=true; h.style.cssText='position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:30;padding:4px 10px;font-size:14px;text-align:center;pointer-events:none;white-space:nowrap'; document.body.appendChild(h); },0);

/* ---------- mục tiêu cho đánh thường / vị trí hiệu ứng chiêu (maps8) ---------- */
window.DDAY={pos:id=>{ if(id>=PL_ID) return posOf(id-PL_ID); if(id>=BASE_ID){ const b=D.bases[id-BASE_ID]; return b?[b.x*T,b.y*T]:null; } const c=CR.get(id); return c?[c.x*T,c.y*T]:null; },
  targets:()=>{ if(kind()!=='dday'||!ST||MYTEAM<0) return []; const L=[]; for(const [id,c] of CR) if(c.team!==MYTEAM) L.push({to:'dd:'+id,x:c.x*T,y:c.y*T,rad:.5,w:9,h:24});
    const eb=D.bases[1-MYTEAM]; L.push({to:'dd:'+(BASE_ID+1-MYTEAM),x:eb.x*T,y:eb.y*T,rad:D.base.r,w:26,h:64});
    for(const pid of ST.teams[1-MYTEAM]){ const p=posOf(pid); if(p) L.push({to:'dd:'+(PL_ID+pid),x:p[0],y:p[1],rad:.4,w:10,h:44}); } return L; }};
})();
