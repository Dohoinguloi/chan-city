/* Chan City — MU Online (client).
   Mọi class đều đánh gần (áp sát 2–3 ô): Chiến Binh chém kiếm, Tiên Nữ song kiếm, Phù Thuỷ chưởng lửa / chưởng sét.
   HUD: máu / mana / ô chiêu có icon (phím 1–3, phím 4 nếu đã ăn Trái Ác Quỷ) ở góc dưới trái trên ô chat, thanh máu các boss đang ra ở trên cùng.
   Vệ binh: chọn class (xem trước giáp + vũ khí), ăn Trái Ác Quỷ, cầm vũ khí, nhiệm vụ ẩn; Pháp sư Cát: hồi máu, bán ngọc. Đứng gần người chơi bấm E để thách đấu.
   Hiệu ứng tham khảo game hành động: mỗi chiêu có lấy đà → ra đòn → trúng đích, hệ hạt cộng sáng (tia lửa, than hồng, khói, mảnh đá, lá, rune),
   khựng hình + chớp trắng khi boss trúng đòn, rung màn, trời tối lại khi Mưa Thiên Thạch, viền đỏ khi mình bị đánh. 5 boss đều có tư thế lấy đà / ra chưởng
   riêng, cảnh báo vùng đánh (tròn / nón / sóng) có vòng đếm ngược để né. Lính Cát đầu đội lao vào đánh boss cùng chủ. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, M=SD.MU, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a), $=s=>document.querySelector(s);
const here=()=>GAME.S&&(GAME.S.kind==='mu'||GAME.S.kind==='muw'||GAME.S.kind==='dday'), town=()=>GAME.S&&GAME.S.kind==='mu', CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn()), BS=M.bosses, F=M.fruits;
let ME=null, MET=0, BOSSES=[], NEXT={}, NUM=[];
const bossBy=id=>BOSSES.find(b=>b.id===id), BH=()=>BOSSES.filter(b=>(b.scene||'mu')===(GAME.S&&GAME.S.kind)), shake=(a,t)=>{ if(GAME.shake) GAME.shake(a,t); };
const posOf=pid=>{ if(pid===NET.pid) return [GAME.P.x,GAME.P.y]; const r=GAME.REM&&GAME.REM.get(pid); return r?[r.x,r.y]:null; };
const bossPos=id=>{ const b=bossBy(id); return b?[b.x*T,b.y*T]:null; };
const mobPos=to=>typeof to==='string'&&to.startsWith('dd:')&&window.DDAY?window.DDAY.pos(+to.slice(3)):typeof to==='string'&&to.startsWith('bm:')?minPosOf(+to.slice(3)):typeof to==='string'&&to.startsWith('mob:')&&window.MUMOB?window.MUMOB.pos(+to.slice(4)):null;   /* bm: quái con của boss */   /* quái rừng (maps9) */
// chiêu: 1–3 class, 4 Trái Ác Quỷ, 5 chiêu riêng của set legacy đang mặc (ô trống thì null)
const skillsOf=()=>{ if(!ME||!ME.cls) return []; const L=[...M.skills[ME.cls]]; L[3]=ME.fruit&&F[ME.fruit]?F[ME.fruit].skill:null; L[4]=ME.lg&&M.legacy[ME.lg]?M.legacy[ME.lg].skill:null; return L; };
NET.listen('mume',m=>{ const wasDead=DEAD.has(NET.pid); ME=m.v; MET=performance.now(); if(wasDead&&!(ME.dead>0)){ DEAD.delete(NET.pid); GAME.bigText('✨ HỒI SINH!'); GAME.sfx('level_up',.5); const P=GAME.P; burst(P.x,P.y-20,30,{col:C_GOLD,kind:'star',sp:[30,120],life:[.5,1]}); ring(P.x,P.y,6,50,.7,'#fff3b0',3,1); } hud(); });
NET.listen('muboss',m=>{ const was=new Set(BOSSES.map(b=>b.id)); BOSSES=m.v.list||[]; NEXT=m.v.next||NEXT;
  for(const b of BH()) if(!was.has(b.id)&&here()){ GAME.bigText(b.name.toUpperCase()+'!'); GAME.sfx('power_up',.7); } hud(); });
// hạ boss: bảng tổng kết chiến lợi phẩm (tiền, EXP, EXP MU, vật phẩm, trang phục, nhiệm vụ ẩn), tự ẩn sau 10 giây hoặc bấm ✕
let lootT=0; NET.listen('muloot',m=>{ let el=$('#muLoot'); if(!el){ el=document.createElement('div'); el.id='muLoot'; el.className='panel'; document.body.appendChild(el); el.addEventListener('click',e=>{ if(e.target.closest('.x')) el.hidden=true; }); }
  const row=(ic,txt)=>`<div class="lr">${ic}<span>${txt}</span></div>`, items=Object.entries(m.items||{});
  el.innerHTML=`<button class="x" type="button" aria-label="Đóng">✕</button><h4>🏆 Hạ ${esc(m.name)}!</h4><small>${m.rank===1?'🥇 Top 1':'Hạng '+m.rank+'/'+m.n} · góp ${m.share}% sát thương</small>
    <div class="ll">${row('💰',`<b>+${SD.fmt(m.vnd)}</b>`)}${row('⭐',`<b>+${m.exp} EXP</b>`)}${row('⚔',`<b>+${m.mu} EXP MU</b>`)}
    ${items.map(([k,n])=>row(UI.ico(SD.ITEMS[k].icon),`${esc(SD.ITEMS[k].name)}${n>1?' ×'+n:''}`)).join('')}
    ${m.cos?row('👘',`Trang phục <b>${esc(SD.CLOTHES[m.cos].name)}</b> (mở Tủ đồ U để mặc)`):''}${m.sec?row('🔍',`Mở nhiệm vụ ẩn <b>${esc(SD.QUESTS[m.sec].title.replace('🔍 ',''))}</b>`):''}</div>`;
  el.hidden=false; GAME.sfx('level_up',.6); clearTimeout(lootT); lootT=setTimeout(()=>{ el.hidden=true; },10000); });
NET.listen('muduel',m=>{ GAME.sfx('blip',.6); GAME.ask(`⚔ ${esc(m.name)} (${esc(M.cls[m.cls].name)} Lv${m.lv}) thách đấu bạn!`,'mu_guard',['Nhận lời','Từ chối'],async i=>{ if(i!==0) return; const r=await GAME.act({t:'mu',op:'accept',pid:m.from}); if(r&&!r.err) GAME.bigText('THÁCH ĐẤU!'); }); });
async function skill(i){ if(!here()||!ME||!ME.cls) return; if(!skillsOf()[i]) return; const r=await NET.req({t:'mu',op:'skill',i}); if(r.err){ toast(esc(r.err),'lock'); return; } if(r.msg) toast(esc(r.msg),'quest'); if(r.me){ ME=r.me; MET=performance.now(); hud(); } }
addEventListener('keydown',e=>{ if(!here()) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; if(UI.isOpen&&UI.isOpen()) return; const i=['1','2','3','4','5'].indexOf(e.key); if(i>=0){ e.preventDefault(); skill(i); } });

/* ======================= hệ hạt + chuỗi hoạt ảnh ======================= */
const PT=[], CASTS=[], WAVES=[], MINS=new Map();   /* MINS: Min đang được ai gọi ra (pid → hết lúc nào) */ let lastT=performance.now(), darkT=0, darkA=0, meHitAt=0;
const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
// hạt: dot (chấm sáng), spark (vệt theo hướng bay), ember (than hồng có trọng lực nhẹ), smoke (khói to dần), debris (mảnh đá rơi), leaf (lá), rune (dấu phép bay lên), star
function burst(x,y,n,o){ for(let i=0;i<n;i++){ const a=o.dir!=null?o.dir+rnd(-(o.spread??.6),o.spread??.6):rnd(0,6.283), sp=rnd(...(o.sp||[30,90]));
  PT.push({x:x+rnd(-(o.jx||0),o.jx||0),y:y+rnd(-(o.jy||0),o.jy||0),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*(o.flat??.7)-(o.up||0),t:0,life:rnd(...(o.life||[.25,.55])),s:rnd(...(o.size||[1,2.5])),c:pick(o.col),g:o.g||0,k:o.kind||'dot',drag:o.drag??3,add:o.add!==false}); } }
const ring=(x,y,r0,r1,dur,col,w=2,flat=.55)=>WAVES.push({x,y,r0,r1,t:0,dur,col,w,flat});
function stepPT(dt){ for(const p of PT){ p.t+=dt; const d=Math.exp(-p.drag*dt); p.vx*=d; p.vy=p.vy*d+p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; } for(let i=PT.length-1;i>=0;i--) if(PT[i].t>=PT[i].life) PT.splice(i,1); if(PT.length>900) PT.splice(0,PT.length-900);
  for(const w of WAVES) w.t+=dt; for(let i=WAVES.length-1;i>=0;i--) if(WAVES[i].t>=WAVES[i].dur) WAVES.splice(i,1); }
function drawPT(g,cam,add){ for(const p of PT){ if(p.add!==add) continue; const k=1-p.t/p.life, X0=p.x-cam.x, Y0=p.y-cam.y; g.globalAlpha=Math.max(0,k);
  if(p.k==='spark'){ g.strokeStyle=p.c; g.lineWidth=p.s; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X0-p.vx*.035,Y0-p.vy*.035); g.stroke(); }
  else if(p.k==='smoke'){ g.fillStyle=p.c; g.globalAlpha=k*.45; g.beginPath(); g.arc(X0,Y0,p.s*(1+(1-k)*2.2),0,7); g.fill(); }
  else if(p.k==='rune'){ g.fillStyle=p.c; g.fillRect(X0-1,Y0-2,2,4); g.fillRect(X0-2,Y0-1,4,2); }
  else if(p.k==='leaf'){ g.fillStyle=p.c; g.fillRect(X0+Math.sin(p.t*12)*2,Y0,3,2); }
  else if(p.k==='star'){ g.fillStyle=p.c; g.fillRect(X0-p.s,Y0,p.s*2+1,1); g.fillRect(X0,Y0-p.s,1,p.s*2+1); }
  else { g.fillStyle=p.c; g.fillRect(X0-p.s/2,Y0-p.s/2,p.s,p.s); } } g.globalAlpha=1; }
function drawWaves(g,cam){ for(const w of WAVES){ const k=w.t/w.dur, r=w.r0+(w.r1-w.r0)*(1-Math.pow(1-k,2)); g.globalAlpha=1-k; g.strokeStyle=w.col; g.lineWidth=w.w*(1-k*.5); g.beginPath(); g.ellipse(w.x-cam.x,w.y-cam.y,r,r*w.flat,0,0,7); g.stroke(); } g.globalAlpha=1; }
const C_FIRE=['#fff3b0','#ffd84a','#ff9a2a','#ff5a1a'], C_SPARK=['#ffffff','#fff3b0','#ffd84a'], C_BLOOD=['#ff4a5a','#ff8a8a','#ffffff'], C_ICE=['#ffffff','#bff0ff','#7fd8f0'], C_ELEC=['#ffffff','#bff0ff','#7fb8ff'], C_HEAL=['#c8ffd0','#5fe06a','#ffffff'], C_GOLD=['#fff3b0','#ffd84a','#c8901a'], C_DARK=['#c8a0ff','#8a5ad8','#3a1a5a'], C_SMOKE=['#6a6068','#8a8088','#4a4448'];
// thời điểm trúng đích (ms sau khi ra chiêu): số sát thương + boss khựng hiện đúng lúc này
const HIT_AT={xtfire:260,dapchoang:240,phunlua:300,dam:200,tamlien:130,hoachuong:230,loichuong:240,chem:110,xoay:260,thienthach:640,pet:420,hoaquyen:360,kybanghao:420,loithan:320,gomupistol:260,hoden:520};
// chỗ Min đứng: cạnh chủ, lùi về phía sau lưng
const faceOf=pid=>pid===NET.pid?GAME.P.face:((GAME.REM&&GAME.REM.get(pid))||{}).face||1;
const minPos=pid=>{ const p=posOf(pid); return p&&[p[0]-faceOf(pid)*22,p[1]+2]; };
function casterFace(c){ const P0=posOf(c.from), Q0=c.toP(); return P0&&Q0?(Q0[0]>=P0[0]?1:-1):1; }
const PHP=new Map(), GULP=new Map();   // % máu người chơi khác (server gửi 'muhp') · ai đang bị boss nuốt (tới lúc nào)
NET.listen('muhp',m=>{ PHP.clear(); for(const [pid,h] of m.l||[]) PHP.set(pid,h); });
NET.listen('mufx',e=>{ if(!here()||e.k.startsWith('mob')||e.k==='lcsk') return; const t=performance.now();   /* sự kiện quái rừng: maps9 lo */
  if(e.k==='pfx'){ PFX.set(e.to,{stunEnd:t+(e.stun||0),slowEnd:t+(e.slowMs||0),slow:e.slow||1,dot:e.dot||'',dotEnd:t+(e.dotMs||0)}); if(e.to===NET.pid&&e.stun>600){ GAME.bigText('CHOÁNG!'); GAME.sfx('poof',.5); } return; }
  if(e.k==='blink'&&e.boss==='songoku'){ for(const [x,y] of [[e.ox,e.oy],[e.x,e.y]]) if(x!=null){ burst(x*T,y*T-26,22,{col:['#7fd8ff','#ffffff','#ffd84a'],kind:'spark',sp:[40,140],life:[.2,.45]}); ring(x*T,y*T,4,30,.3,'#bff0ff',2); } GAME.sfx('dash',.5); return; }   /* Dịch Chuyển Tức Thời: loé sáng chỗ đi + chỗ đến */
  if(e.k==='krform'){ const p=posOf(e.to), col=['#e8303a','#e830a0','#ff8c1e','#ffd23a','#ffffff','#24b45a'][e.i|0]; if(p){ burst(p[0],p[1]-20,30,{col:[col,'#ffffff'],kind:'star',sp:[40,140],life:[.3,.6]}); ring(p[0],p[1],6,34,.45,col,3,1); } if(e.to===NET.pid){ GAME.bigText('KAMEN RIDER '+String(e.name).toUpperCase()+'!'); GAME.sfx('power_up',.6); } return; }   /* Kamen Rider đổi form */
  if(e.k==='krage'){ const p=posOf(e.to); if(p){ ring(p[0],p[1],4,30,.5,'#ff3a3a',3,1); burst(p[0],p[1]-20,22,{col:C_BLOOD.concat(['#ff3a3a']),kind:'spark',sp:[40,120],life:[.3,.6]}); } if(e.to===NET.pid){ GAME.bigText('KHÁT MÁU!'); GAME.sfx('power_up',.6); } return; }   /* Mặt Nạ Quỷ Kotex */
  if(e.k==='thor'){ const x=e.x*T, y=e.y*T; ZAPS.push({x,y:y-160,pts:[[x,y-14]],t}); ZAPS.push({x:x+6,y:y-150,pts:[[x-4,y-10]],t:t+40}); burst(x,y-14,24,{col:C_ELEC,kind:'spark',sp:[60,200],life:[.15,.35]}); NUM.push({x:x+rnd(-8,8),y:y-34,v:'⚡'+e.dmg,crit:1,t}); shake(2,.12); GAME.sfx('power_up',.35); return; }   /* Búa Thor: sét đánh từ trời xuống */
  if(e.k==='dbl'){ setTimeout(()=>{ const q=mobPos(e.to)||(typeof e.to==='string'&&e.to.startsWith('boss:')&&bossPos(e.to.slice(5))); if(q) NUM.push({x:q[0]+rnd(-10,10),y:q[1]-30,v:'x2 '+e.dmg,t:performance.now()}); },140); return; }   /* Động cơ Musk: đòn thứ 2 */
  if(e.k==='silence'){ ring(e.x*T,e.y*T,6,40,.5,'#b070ff',3,1); burst(e.x*T,e.y*T-30,16,{col:['#b070ff','#ffe066','#ffffff'],kind:'star',sp:[30,90],life:[.4,.7]}); NUM.push({x:e.x*T,y:e.y*T-50,v:'KHOÁ CHIÊU',miss:1,t}); return; }   /* Đũa Howard Le */
  if(e.k==='bguard'){ const p=bossPos(e.boss); if(p){ ring(p[0],p[1],6,34,.5,'#7fd8ff',3,1); burst(p[0],p[1]-24,18,{col:['#7fd8ff','#ffffff'],kind:'spark',sp:[40,120],life:[.3,.6]}); } GAME.bigText(`GIÁP +${Math.round(e.armor*100)}% · KHÁNG PHÉP +${Math.round(e.resist*100)}%`); return; }
  if(e.k==='orbheal'){ for(const [x,y] of e.to){ ZAPS.push({x:e.x*T,y:e.y*T-14,pts:[[x*T,y*T-30]],t}); burst(x*T,y*T-30,8,{col:C_HEAL,kind:'star',sp:[20,60],life:[.4,.7]}); } return; }   /* Ngọc Rồng truyền máu cho boss */
  if(e.k==='gulp'){ GULP.set(e.to,performance.now()+e.dur*1000); const p=posOf(e.to); if(p) burst(p[0],p[1]-16,24,{col:C_DARK,kind:'smoke',sp:[20,70],life:[.4,.8],size:[2,4],add:false,up:15}); if(e.to===NET.pid){ GAME.bigText('BỊ NUỐT CHỬNG!'); shake(6,.5); GAME.sfx('poof',.7); } return; }
  if(e.k==='spit'){ GULP.delete(e.to); const p=posOf(e.to); if(p) burst(p[0],p[1]-16,20,{col:['#6ae88a','#b070ff','#ffffff'],kind:'spark',sp:[40,120],life:[.3,.6]}); if(e.to===NET.pid){ GAME.bigText('THOÁT RA RỒI!'); GAME.sfx('poof',.6); } return; }
  if(e.k==='bcup'){ GAME.bigText('NOBITA CHUI VÀO CỐC MỲ!'); burst(e.x*T,e.y*T-14,18,{col:['#ffffff','#ffd84a','#e8302a'],kind:'star',sp:[30,90],life:[.3,.6]}); GAME.sfx('poof',.6); return; }
  if(e.k==='brage'){ GAME.bigText(String(e.name||'').toUpperCase()+'!'); shake(3,.25); GAME.sfx('power_up',.6); return; }
  if(e.k==='bspin'){ const b=BS[e.boss]; if(b) GAME.bigText(b.name.toUpperCase()+' XOAY CƯA!'); shake(4,.3); GAME.sfx('dash',.7); return; }
  if(e.k==='spulse'){ ring(e.x*T,e.y*T,6,e.r*T,.35,'#ffb030',3,1); burst(e.x*T,e.y*T-18,10,{col:C_SPARK.concat(['#ffb030']),kind:'spark',sp:[80,200],life:[.15,.3]}); return; }   /* xoay cưa: mỗi nhịp chém quanh người */
  if(e.k==='bpoch'){ GAME.bigText('QUỶ CƯA HOÁ POCHITA!'); burst(e.x*T,e.y*T-14,30,{col:['#f28a2a','#ffffff','#ffd84a'],kind:'star',sp:[30,110],life:[.4,.8]}); GAME.sfx('poof',.6); return; }
  if(e.k==='dive'){ burst(e.x*T,e.y*T-6,40,{col:['#d8f0f8','#ffffff','#5ab4d8'],kind:'dot',sp:[40,140],life:[.4,.8],size:[2,4],g:260,up:120}); ring(e.x*T,e.y*T,8,70,.6,'#d8f0f8',3,1); shake(3,.25); GAME.sfx('poof',.6); const b=BS[e.boss]; if(b) GAME.bigText(b.name.toUpperCase()+' LẶN XUỐNG NƯỚC!'); return; }   /* rồng lặn: nước bắn tung toé */
  if(e.k==='bcall'){ const b=BS[e.boss]; if(b) GAME.bigText(b.name.toUpperCase()+' XUẤT HIỆN!'); shake(6,.5); GAME.sfx('power_up',.8); burst(e.x*T,e.y*T-30,50,{col:['#7fd8ff','#ffffff','#ffd84a'],kind:'spark',sp:[60,220],life:[.4,.9]}); ring(e.x*T,e.y*T,8,80,.7,'#bff0ff',4,1); return; }
  if(e.k==='blink'){ if(e.ox!=null) DOORS.push({x:e.ox*T,y:e.oy*T,t,out:1}); DOORS.push({x:e.x*T,y:e.y*T,t:t+120}); const D=DISP[e.boss]; if(D){ D.x=e.x; D.y=e.y; } burst(e.x*T,e.y*T-20,24,{col:['#ff9ad0','#ffffff','#ffd84a'],kind:'star',sp:[30,90],life:[.4,.8]}); GAME.sfx('poof',.5); return; }   /* Cánh Cửa Thần Kỳ */
  if(e.k==='bform'){ GAME.bigText(String(e.name).toUpperCase()+'!'); shake(7,.6); GAME.sfx('power_up',.8); burst(e.x*T,e.y*T-30,60,{col:['#ffffff','#ffd84a','#ff6a2a'],kind:'spark',sp:[60,220],life:[.4,.9]}); ring(e.x*T,e.y*T,8,90,.7,'#ffffff',4,1); return; }
  if(e.k==='swallow'){ const p=posOf(e.to); if(p) burst(p[0],p[1]-14,30,{col:C_BLOOD,kind:'spark',sp:[40,120],life:[.3,.6]}); if(e.to===NET.pid){ GAME.bigText('BỊ NUỐT CHỬNG!'); shake(8,.6); } return; }
  if(e.k==='summon'){ const B=bossBy(e.boss); if(B) ring(B.x*T,B.y*T,6,70,.6,'#6ae88a',3,1); GAME.sfx('power_up',.5); return; }
  if(e.k==='bmdie'){ burst(e.x*T,e.y*T-10,20,{col:C_SMOKE,kind:'smoke',sp:[10,40],life:[.4,.8],size:[2,4],add:false,up:20}); MIND.delete(e.id); return; }
  if(e.k==='bmhit'){ const D=MIND.get(e.id); if(D) D.atkAt=t; return; }
  if(e.k==='gpulse'){ ring(e.x*T,e.y*T,6,e.r*T,.5,'#b070ff',3,1); burst(e.x*T,e.y*T-14,10,{col:['#b070ff','#6ae88a','#2a1030'],kind:'smoke',sp:[20,60],life:[.4,.8],size:[2,4],add:false,up:10}); return; }   /* bóng ma toả độc */
  if(e.k==='pchain'){ ZAPS.push({x:e.x*T,y:e.y*T-14,pts:e.pts.map(([x,y])=>[x*T,y*T-14]),t}); for(const [x,y,d] of e.pts) NUM.push({x:x*T+rnd(-6,6),y:y*T-24,v:d,t}); GAME.sfx('power_up',.25); return; }   /* giật sét lan */
  if(e.k==='pslow'){ burst(e.x*T,e.y*T-14,10,{col:C_ICE,kind:'spark',sp:[30,80],life:[.3,.6]}); return; }
  if(e.k==='pstun'){ if(!e.boss) STUNS.push({x:e.x*T,y:e.y*T,t,end:t+e.dur*1000}); burst(e.x*T,e.y*T-24,12,{col:['#ffe066','#ffffff'],kind:'star',sp:[30,80],life:[.3,.6]}); GAME.sfx('poof',.3); return; }   /* choáng: sao xoay trên đầu (boss vẽ theo B.stun) */
  if(e.k==='psplash'){ for(const [x,y,d] of e.pts){ burst(x*T,y*T-14,12,{col:C_FIRE,sp:[30,90],life:[.25,.5]}); NUM.push({x:x*T+rnd(-6,6),y:y*T-24,v:d,t}); } ring(e.x*T,e.y*T,4,e.r*T,.4,'#ff8a3a',3); return; }   /* lửa lan */
  if(e.k==='refl'){ const toP=()=>{ const mp=mobPos(e.to); if(mp) return [mp[0],mp[1]-14]; const q=e.boss&&bossPos(e.boss); return q&&[q[0],q[1]-(BS[e.boss]&&BS[e.boss].big?40:26)]; }; CASTS.push({...e,t,toP,done:{}});
    setTimeout(()=>{ const q=toP(); if(q) NUM.push({x:q[0]+rnd(-10,10),y:q[1]-10,v:e.dmg,t:performance.now()}); if(e.boss) hitBoss(e.boss,false); },150); return; }   /* Bật Giáp phản đòn */
  if(e.k==='hurt'&&e.dot){ const p=posOf(e.to); if(p) NUM.push({x:p[0]+rnd(-6,6),y:p[1]-30,v:e.dmg,dot:e.dot,t}); return; }   /* độc / thiêu đốt: chỉ hiện số, không rung màn */
  if(e.k==='down'){ PFX.delete(e.to); DEAD.set(e.to,t+M.respawn*1000); if(e.to===NET.pid){ GAME.bigText('💀 GỤC RỒI!'); shake(6,.5); GAME.sfx('poof',.7); } }   /* hiệu ứng chết: mờ như hồn ma, bia mộ, khoá điều khiển tới lúc hồi sinh */
  if(e.k==='hurt'){ const p=posOf(e.to); if(p){ NUM.push({x:p[0]+rnd(-6,6),y:p[1]-34,v:e.dmg,me:e.to===NET.pid,crit:e.crit,t}); burst(p[0],p[1]-18,8,{col:C_BLOOD,kind:'spark',sp:[40,90],life:[.15,.3]}); } if(e.to===NET.pid){ meHitAt=t; shake(3,.18); GAME.sfx('poof',.45); } return; }
  if(e.k==='minup'){ MINS.set(e.from,{end:t+(e.until-NET.now()),hitAt:0}); const p=posOf(e.from); if(p) burst(p[0]-20,p[1]-16,30,{col:['#ff9a3a','#ffd0e8','#ffffff'],kind:'star',sp:[30,100],life:[.5,1]}); if(e.from===NET.pid){ GAME.bigText('MIN!'); GAME.sfx('power_up',.5); } return; }
  if(e.k==='mindown'){ const p=minPos(e.from); if(p) burst(p[0],p[1]-16,20,{col:C_SMOKE,kind:'smoke',sp:[10,30],life:[.5,.9],size:[3,5],add:false,up:20}); MINS.delete(e.from); return; }
  if(e.k==='minhit'){ const M0=MINS.get(e.from); if(M0) M0.hitAt=t; const toP=()=>{ const mp=mobPos(e.to); if(mp) return [mp[0],mp[1]-14]; const q=bossPos(e.boss); return q&&[q[0],q[1]-(BS[e.boss]&&BS[e.boss].big?40:26)]; }; CASTS.push({...e,t,toP,done:{}});
    setTimeout(()=>{ const q=toP(); if(q) NUM.push({x:q[0]+rnd(-10,10),y:q[1]-10,v:e.dmg,t:performance.now()}); if(e.boss) hitBoss(e.boss,false); else if(mobPos(e.to)) window.MUMOB.hit(+e.to.slice(4),false); },380); return; }
  if(e.k==='bhit') return bossImpact(e);
  if(e.k==='bossdie') return bossDeath(e);
  if(e.k==='phase'){ const b=BS[e.boss]; if(b) GAME.bigText(e.phase===3?`${b.name.toUpperCase()} NỔI GIẬN!`:`${b.name}: GIAI ĐOẠN ${e.phase}`); shake(5,.4); GAME.sfx('power_up',.6); return; }
  if(e.k==='down'){ const p=posOf(e.to); if(p) burst(p[0],p[1]-12,14,{col:C_SMOKE,kind:'smoke',sp:[10,30],life:[.6,1],size:[3,5],add:false,up:20}); return; }
  if(e.k==='eat'){ const p=posOf(e.to), f=F[e.fruit]; if(p&&f){ burst(p[0],p[1]-20,40,{col:[f.col,'#ffffff'],kind:'star',sp:[30,120],life:[.5,1],size:[1,3]}); ring(p[0],p[1],6,50,.8,f.col,3); } if(e.to===NET.pid){ GAME.bigText('NĂNG LỰC TRÁI ÁC QUỶ!'); GAME.sfx('level_up',.8); } return; }
  const toP=()=>{ const mp=mobPos(e.to); if(mp) return [mp[0],mp[1]-14]; if(typeof e.to==='string'&&e.to.startsWith('boss:')){ const p=bossPos(e.to.slice(5)); return p&&[p[0],p[1]-(BS[e.to.slice(5)]&&BS[e.to.slice(5)].big?40:26)]; } if(e.to==='boss'&&e.boss){ const p=bossPos(e.boss); return p&&[p[0],p[1]-30]; } const p=e.to&&posOf(e.to); return p&&[p[0],p[1]-18]; };
  const c={...e,t,toP,done:{}};
  if(e.k.startsWith('lgs_')){ for(let i=0;i<3;i++) CASTS.push({...e,k:'lg',fx:e.k.slice(4),t:t+i*170,toP,done:{}}); setTimeout(()=>shake(3.5,.3),340); }   /* chiêu set legacy: hiệu ứng của set đánh 3 nhịp */
  else { CASTS.push(c); if(e.lg) CASTS.push({...e,k:'lg',fx:e.lg,t:t+40,toP,done:{}}); }
  if(e.w) CASTS.push({...e,k:'wpn',t,toP,done:{}});   /* vũ khí Thợ Rèn: vung + nổ theo hệ */
  if(e.basic){ const lk=e.from===NET.pid?G().look:((GAME.REM&&GAME.REM.get(e.from))||{}).look; ARMN[e.from]=(ARMN[e.from]||0)+1; const sword=(e.k==='chem'||e.k==='dam')&&!e.w, hammer=e.k==='dapchoang'&&!e.w; CASTS.push({...e,k:'arm',t,toP,done:{},n:ARMN[e.from],skin:lk&&lk.skin?'#'+lk.skin:'#f0b48a',sword,hammer}); if(sword||hammer) SWING.set(e.from,t+300); }   /* đánh thường: tay vung */
  if(e.miss){ setTimeout(()=>{ const q=toP(); if(q) NUM.push({x:q[0]+rnd(-6,6),y:q[1]-14,v:e.miss===2?'HẾT LƯỢT':e.miss===3?'BÓNG MA':e.miss===4?'DƯỚI NƯỚC':e.miss===5?'MIỄN PHÉP':e.miss===6?'PHÒNG THỦ':'NÉ!',miss:1,me:false,t:performance.now()}); },HIT_AT[e.k]||200); }
  if(e.dmg){ const ht=HIT_AT[e.k]||(e.k.startsWith('lgs_')?420:200); setTimeout(()=>{ const q=toP(); if(q) NUM.push({x:q[0]+rnd(-10,10),y:q[1]-10,v:e.dmg,crit:e.crit,me:e.to===NET.pid,t:performance.now()}); const bid=typeof e.to==='string'&&e.to.startsWith('boss:')?e.to.slice(5):e.boss; if(bid) hitBoss(bid,e.crit); else if(mobPos(e.to)) window.MUMOB.hit(+e.to.slice(4),e.crit); },ht); }
  if(e.from===NET.pid){ const P=GAME.P, q=toP(); P.act='attack'; P.actT=0; P.view='side'; if(q) P.face=q[0]>=P.x?1:-1; GAME.sfx({chem:'dash',xoay:'dash',dam:'dash',tamlien:'dash',hoachuong:'poof',loichuong:'power_up',thienthach:'power_up',hoi:'item_pickup',gong:'power_up',pet:'blip',dapchoang:'poof',batgiap:'power_up',hoimau:'item_pickup',phunlua:'poof'}[e.k]||'dash',.35);
    if(e.k==='xoay') setTimeout(()=>{ P.act='attack'; P.actT=0; },260); } });
// đánh thường: cánh tay vung từ trên xuống trước mặt (đòn chẵn tay sau, đòn lẻ tay trước) + vệt chém trắng
const ARMN={}, SWING=new Map();   // ai đang vung kiếm (tới lúc nào)
function armStep(g,c,el,P0,face,cam){ const D=220; if(el>D+140) return false; const k=Math.min(1,el/D), e=1-(1-k)*(1-k), alt=c.n%2, a0=-1.9, a1=.4, ang=a0+(a1-a0)*e;
  const sx=P0[0]-cam.x+face*(alt?-2:3), sy=P0[1]-cam.y-25, L=10, ex=sx+Math.cos(ang)*L*face, ey=sy+Math.sin(ang)*L;
  g.save(); g.lineCap='round'; if(el<D+40){ g.strokeStyle='#1c1516'; g.lineWidth=4; g.beginPath(); g.moveTo(sx,sy); g.lineTo(ex,ey); g.stroke(); g.strokeStyle=c.skin; g.lineWidth=2.4; g.stroke();
    if(c.sword){ const bx=ex+Math.cos(ang)*14*face, by=ey+Math.sin(ang)*14; g.strokeStyle='#1c1516'; g.lineWidth=3.4; g.beginPath(); g.moveTo(ex,ey); g.lineTo(bx,by); g.stroke(); g.strokeStyle='#d8dce4'; g.lineWidth=2; g.stroke();
      g.strokeStyle='#ffffff'; g.lineWidth=.8; g.beginPath(); g.moveTo(ex,ey); g.lineTo(bx,by); g.stroke(); g.fillStyle='#ffd84a'; g.fillRect(Math.round(ex)-2,Math.round(ey)-1,4,2); }   /* kiếm: lưỡi bạc, chuôi vàng */
    if(c.hammer){ const bx=ex+Math.cos(ang)*12*face, by=ey+Math.sin(ang)*12; g.strokeStyle='#1c1516'; g.lineWidth=3.4; g.beginPath(); g.moveTo(ex,ey); g.lineTo(bx,by); g.stroke(); g.strokeStyle='#8a5a32'; g.lineWidth=2; g.stroke();
      g.save(); g.translate(bx,by); g.rotate(ang*face+(face<0?Math.PI:0)); g.fillStyle='#1c1516'; g.fillRect(-4,-5,9,10); g.fillStyle='#a8acb8'; g.fillRect(-3,-4,7,8); g.fillStyle='#e8ecf4'; g.fillRect(-3,-4,7,2); g.fillStyle='#ffd84a'; g.fillRect(-3,-1,7,2); g.fillStyle='#1c1516'; g.fillRect(5,-1,2,2); g.fillRect(-1,-7,2,2); g.fillRect(-1,5,2,2); g.restore(); }   /* chuỳ Đại Tượng: cán gỗ, đầu thép đai vàng, gai */
    g.fillStyle=c.skin; g.beginPath(); g.arc(ex,ey,2.3,0,7); g.fill(); g.strokeStyle='#1c1516'; g.lineWidth=.8; g.stroke(); }
  if(k>.2){ g.globalAlpha=Math.max(0,1-(el-D*.2)/(D*.9)); g.strokeStyle=c.sword?'#cfefff':'#ffffff'; g.lineWidth=c.sword?3.5:2; g.beginPath(); const r=c.sword?L+13:L+5; if(face>0) g.arc(sx,sy,r,a0+.3,ang); else g.arc(sx,sy,r,Math.PI-ang,Math.PI-a0-.3); g.stroke(); }
  g.restore(); return true; }
// boss trúng đòn: khựng 70ms + chớp + bẹp nhẹ
const HITS={}; function hitBoss(id,crit){ HITS[id]={t:performance.now(),crit}; shake(crit?3.5:1.6,crit?.2:.1); }
/* ---------- hoạt ảnh từng chiêu của người chơi (vẽ mỗi khung theo thời gian đã trôi) ---------- */
function castStep(g,c,now,cam){ const el=now-c.t, P0=posOf(c.from), Q=c.toP(), once=(k,f)=>{ if(!c.done[k]){ c.done[k]=1; f(); } };
  if(!P0) return el<1500; const face=Q?(Q[0]>=P0[0]?1:-1):1, X0=P0[0]-cam.x, Y0=P0[1]-cam.y, hx=P0[0]+face*9, hy=P0[1]-22, tip=[P0[0]+face*8,P0[1]-33], ang=Q?Math.atan2(Q[1]-hy,Q[0]-hx):(face>0?0:Math.PI);
  const lerp=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k], glow=(x,y,r,col,a=1)=>{ r=Math.max(.5,r); if(a<=0) return; const op=g.globalCompositeOperation; g.globalCompositeOperation='lighter'; g.globalAlpha=a; const gr=g.createRadialGradient(x-cam.x,y-cam.y,0,x-cam.x,y-cam.y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x-cam.x,y-cam.y,r,0,7); g.fill(); g.globalAlpha=1; g.globalCompositeOperation=op; };
  const circle=(x,y,r,col,rot,n=8,a=1)=>{ g.globalAlpha=a; g.strokeStyle=col; g.lineWidth=1.5; g.beginPath(); g.ellipse(x-cam.x,y-cam.y,r,r*.5,0,0,7); g.stroke(); g.beginPath(); g.ellipse(x-cam.x,y-cam.y,r*.7,r*.35,0,0,7); g.stroke();
    g.fillStyle=col; for(let i=0;i<n;i++){ const a2=rot+i/n*6.283; g.fillRect(x-cam.x+Math.cos(a2)*r*.85-1,y-cam.y+Math.sin(a2)*r*.42-1,3,3); } g.globalAlpha=1; };
  const slash=(cx,cy,a0,span,r,cols,k)=>{ for(let i=0;i<cols.length;i++){ g.globalAlpha=(1-k)*(1-i*.25); g.strokeStyle=cols[i]; g.lineWidth=[4,2.5,1.2][i]||1; g.beginPath(); g.ellipse(cx-cam.x,cy-cam.y,r-i*3,(r-i*3)*.75,0,a0,a0+span*Math.min(1,k*1.6)); g.stroke(); } g.globalAlpha=1; };
  const projectile=(t0,dur,from,to,draw,trail)=>{ if(el<t0) return null; const k=Math.min(1,(el-t0)/dur), p=lerp(from,to,k); if(k<1){ draw(p,k); if(trail) trail(p); } return k; };
  switch(c.k){
  case 'lg': return lgStep(c,el,{g,P0,Q,face,hx,hy,ang,cam,once,glow,slash,projectile,lerp});
  case 'wpn': return wpnStep(c,el,{g,P0,Q,face,hx,hy,cam,once});
  case 'arm': return armStep(g,c,el,P0,face,cam);
  case 'minhit': { const m0=minPos(c.from); if(!m0||!Q) return el<500; const from=[m0[0],m0[1]-22];   // Min hát: 3 nốt nhạc lượn sóng bay tới boss
    for(let i=0;i<3;i++){ const k=Math.min(1,Math.max(0,(el-i*70)/330)); if(k<=0||k>=1) continue; const p=lerp(from,Q,k), w=Math.sin(k*9+i)*6; g.font='12px VT323, monospace'; g.textAlign='center'; g.fillStyle='#1c1516'; g.fillText(i%2?'♫':'♪',p[0]-cam.x+1,p[1]-cam.y+w+1); g.fillStyle=['#ff9a3a','#ff7ac8','#ffd84a'][i]; g.fillText(i%2?'♫':'♪',p[0]-cam.x,p[1]-cam.y+w); }
    if(el>370) once('h',()=>{ burst(Q[0],Q[1],14,{col:['#ff9a3a','#ff7ac8','#ffffff'],kind:'star',sp:[40,110],life:[.3,.6]}); ring(Q[0],Q[1]+8,3,20,.3,'#ff9ac8',2); }); return el<560; }
  case 'chem': { if(el<90){ glow(hx,hy,8,'rgba(255,255,255,.9)',el/90); } else if(el<340){ slash(P0[0]+face*6,P0[1]-20,ang-1.4,2.6,20,['#ffffff','#ff6a5a','#ffd84a'],(el-90)/250); }
    if(Q&&el>110) once('hit',()=>{ burst(Q[0],Q[1],16,{col:C_SPARK,kind:'spark',dir:ang,spread:.9,sp:[60,160],life:[.12,.28]}); ring(Q[0],Q[1]+10,2,14,.25,'#ffffff',2); }); return el<400; }
  case 'xoay': { if(el<160){ once('dust',()=>burst(P0[0],P0[1],16,{col:C_SMOKE,kind:'smoke',sp:[20,50],life:[.4,.7],size:[2,4],add:false})); glow(P0[0],P0[1]-18,22,'rgba(255,80,60,.6)',el/160); }
    if(el>=160&&el<700){ const k=(el-160)/540, rot=k*12.6; for(let a=0;a<3;a++){ const a0=rot+a*2.094; for(let j=0;j<4;j++){ g.globalAlpha=(1-k*.5)*(1-j*.22); g.strokeStyle=j?'#ff7a5a':'#ffffff'; g.lineWidth=3-j*.6; g.beginPath(); g.ellipse(X0,Y0-14,26,15,0,a0-j*.25,a0-j*.25+.8); g.stroke(); } }
      g.globalAlpha=1; if(Math.random()<.5) burst(P0[0]+rnd(-24,24),P0[1]-rnd(0,10),2,{col:C_SPARK,kind:'spark',sp:[60,120],life:[.1,.2]}); once('wave',()=>{ ring(P0[0],P0[1],8,46,.45,'#ff9a7a',3); ring(P0[0],P0[1],4,30,.35,'#ffffff',2); shake(2,.2); }); }
    if(Q&&el>260) once('hit1',()=>burst(Q[0],Q[1],18,{col:C_SPARK.concat(C_BLOOD),kind:'spark',sp:[70,170],life:[.12,.3]})); if(Q&&el>440) once('hit2',()=>burst(Q[0],Q[1],14,{col:C_SPARK,kind:'spark',sp:[70,170],life:[.12,.3]})); return el<760; }
  case 'gong': { const k=el/900; if(k<1){ g.globalAlpha=(1-k)*.55; const gr=g.createLinearGradient(0,Y0-70,0,Y0); gr.addColorStop(0,'rgba(255,216,74,0)'); gr.addColorStop(1,'rgba(255,216,74,.9)'); g.fillStyle=gr; g.fillRect(X0-12+k*4,Y0-70,24-k*8,70); g.globalAlpha=1;
      g.strokeStyle='#ffd84a'; g.lineWidth=2; g.globalAlpha=1-k; g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*6.283+el/300; g.lineTo(X0+Math.cos(a)*18*(1+Math.sin(el/90)*.05),Y0-20+Math.sin(a)*22); } g.stroke(); g.globalAlpha=1;
      if(Math.random()<.6) burst(P0[0]+rnd(-14,14),P0[1],1,{col:C_GOLD,kind:'rune',dir:-1.57,spread:.2,sp:[30,60],life:[.5,.8],drag:1});
      once('b',()=>{ burst(P0[0],P0[1]-20,24,{col:C_GOLD,kind:'spark',sp:[60,140]}); ring(P0[0],P0[1],6,30,.5,'#ffd84a',2); shake(1.2,.12); }); } return el<950; }
  case 'dam': { if(!Q) return el<420;   /* song kiếm tiên: vung 2 kiếm phóng 2 luồng kiếm khí xanh băng bay tới mục tiêu (đánh xa), trúng thì toé tia băng */
    const fly=Math.max(90,Math.min(200,Math.hypot(Q[0]-hx,Q[1]-hy)*1.1));
    for(const [t0,off] of [[0,-3],[110,3]]){ const k=(el-t0)/fly; if(k>=0&&k<1){ const from=[hx,hy+off], to=[Q[0],Q[1]+off], p=lerp(from,to,k), tl=lerp(from,to,Math.max(0,k-.25));
        g.save(); g.lineCap='round'; for(const [col,w,al] of [['#7fe8ff',5,.35],['#bff0ff',3,.8],['#ffffff',1.2,1]]){ g.globalAlpha=al; g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(tl[0]-cam.x,tl[1]-cam.y); g.lineTo(p[0]-cam.x,p[1]-cam.y); g.stroke(); } g.restore(); glow(p[0],p[1],7,'rgba(190,240,255,.9)');
        if(Math.random()<.5) burst(p[0],p[1],1,{col:['#bff0ff','#ffffff'],kind:'spark',sp:[5,20],life:[.1,.2]}); }
      if(el>t0+fly) once('h'+t0,()=>{ burst(Q[0],Q[1]+off,10,{col:C_SPARK.concat(['#bff0ff']),kind:'spark',dir:ang,spread:.7,sp:[60,150],life:[.1,.25]}); ring(Q[0],Q[1]+8,1,10,.2,'#bff0ff',1.5); }); }
    return el<110+fly+80; }
  case 'tamlien': { if(!Q) return el<720;   // 3 nhát chém chéo / chéo / ngang cắt qua mục tiêu, nhát cuối nổ vòng sáng
    [-.8,.8,0].forEach((a,j)=>{ const t0=j*150, k=(el-t0)/220; if(k<0||k>=1) return; const dx=Math.cos(a), dy=Math.sin(a), p0=[Q[0]-dx*20,Q[1]-dy*20], p1=lerp(p0,[Q[0]+dx*20,Q[1]+dy*20],Math.min(1,k*2.2));
      for(const [col,w,al] of [['#ffd84a',5,.5],['#fff3b0',3,.8],['#ffffff',1.5,1]]){ g.globalAlpha=(1-k)*al; g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(p0[0]-cam.x,p0[1]-cam.y); g.lineTo(p1[0]-cam.x,p1[1]-cam.y); g.stroke(); } g.globalAlpha=1;
      if(k>.3) once('s'+j,()=>{ burst(Q[0],Q[1],12,{col:C_SPARK,kind:'spark',dir:a+1.57*(j%2?1:-1),spread:1.2,sp:[60,160],life:[.1,.25]}); if(j===2){ ring(Q[0],Q[1]+8,3,26,.35,'#fff3b0',3); shake(1.8,.14); } }); });
    return el<720; }
  case 'hoachuong': { if(el<150){ glow(hx,hy,4+el/25,'rgba(255,150,40,.95)'); if(Math.random()<.8) burst(hx+rnd(-12,12),hy+rnd(-12,12),1,{col:C_FIRE,sp:[5,15],life:[.15,.25]}); }   // tụ lửa lòng bàn tay rồi đẩy chưởng
    if(Q&&el>=150&&el<420){ const k=(el-150)/270; for(let i=0;i<4;i++){ const t=Math.random(), p=lerp([hx,hy],Q,t), sp=2+t*9; burst(p[0]+rnd(-sp,sp),p[1]+rnd(-sp,sp),1,{col:C_FIRE,kind:'dot',dir:ang,spread:.3,sp:[40,90],life:[.15,.3],size:[2,4]}); }
      glow(hx,hy,10*(1-k)+3,'rgba(255,200,80,.9)'); glow(Q[0],Q[1],14*(1-k)+6,'rgba(255,140,40,.8)');
      if(el>=230) once('ex',()=>{ burst(Q[0],Q[1],26,{col:C_FIRE,kind:'spark',sp:[60,180],life:[.2,.45]}); ring(Q[0],Q[1]+10,4,26,.35,'#ffb03a',3); burst(Q[0],Q[1],5,{col:C_SMOKE,kind:'smoke',sp:[10,30],life:[.6,1],size:[3,5],add:false,up:15}); shake(2,.15); }); }
    return el<700; }
  case 'loichuong': { if(el<220){ glow(hx,hy,5+el/30,'rgba(140,200,255,.95)'); if(Math.random()<.7) burst(hx+rnd(-10,10),hy+rnd(-10,10),1,{col:C_ELEC,kind:'spark',sp:[20,50],life:[.08,.16]}); }   // tích sét ở nắm tay rồi đấm, sét toé tới mục tiêu
    if(Q&&el>=220&&el<520){ if(!c.bolts||now-c.bt>45){ c.bt=now; c.bolts=[0,1].map(()=>{ const pts=[[hx,hy]]; for(let i=1;i<6;i++){ const p=lerp([hx,hy],Q,i/6); pts.push([p[0]+rnd(-6,6),p[1]+rnd(-6,6)]); } pts.push(Q); return pts; }); }
      for(const pts of c.bolts) for(const [col,w] of [['rgba(120,180,255,.55)',6],['#bff0ff',2.5],['#ffffff',1]]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0]-cam.x,p[1]-cam.y):g.moveTo(p[0]-cam.x,p[1]-cam.y)); g.stroke(); }
      glow(Q[0],Q[1],18,'rgba(190,240,255,.8)'); once('hit',()=>{ burst(Q[0],Q[1],28,{col:C_ELEC,kind:'spark',sp:[60,180],life:[.15,.35]}); ring(Q[0],Q[1]+10,4,30,.35,'#bff0ff',2); shake(3,.2); darkT=now; darkA=-.22; }); }
    return el<600; }
  case 'dapchoang': { if(!Q) return el<500;   /* Đại Tượng nện chuỳ: tụ sáng trên tay, nện xuống mục tiêu, sóng chấn động vàng + bụi đá; chiêu (không phải đánh thường) nổ to hơn */
    const k=Math.min(1,el/240), big=!c.basic; if(el<240) glow(hx,hy-10,6+k*8,'rgba(255,230,150,.9)',k);
    if(el>=220) once('hit',()=>{ burst(Q[0],Q[1]+8,big?26:12,{col:['#c8b89a','#8a7a6a','#fff3b0'],kind:'smoke',sp:[30,110],life:[.3,.6],size:[2,4],add:false,up:10}); burst(Q[0],Q[1],big?18:8,{col:C_SPARK,kind:'spark',sp:[60,160],life:[.12,.28]}); ring(Q[0],Q[1]+10,4,big?40:22,.35,'#ffd84a',3); if(big) ring(Q[0],Q[1]+10,2,26,.5,'#ffffff',2); shake(big?4:2,big?.25:.12); });
    if(el>=220&&el<520){ const kk=(el-220)/300; glow(Q[0],Q[1],22*(1-kk)+6,'rgba(255,216,74,.85)',1-kk); } return el<560; }
  case 'batgiap': { const k=el/1100; if(k>=1) return false;   /* Bật Giáp: khiên lục giác vàng dựng quanh người, gai phản đòn loé ra */
    const R0=20+Math.sin(el/60)*1.5, hex=r=>{ g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*6.283+.52; g.lineTo(X0+Math.cos(a)*r,Y0-18+Math.sin(a)*r*1.15); } };
    g.save(); g.globalAlpha=(k<.15?k/.15:1-(k-.15)/.85)*.85; g.strokeStyle='#ffd84a'; g.lineWidth=2; hex(R0); g.stroke(); g.fillStyle='rgba(200,220,255,.18)'; g.fill(); g.strokeStyle='#ffffff'; g.lineWidth=1; hex(R0-4); g.stroke();
    for(let i=0;i<6;i++){ const a=i/6*6.283+.52+el/500, r1=R0+2+Math.min(1,el/250)*8; g.strokeStyle='#ffd84a'; g.lineWidth=2; g.beginPath(); g.moveTo(X0+Math.cos(a)*R0,Y0-18+Math.sin(a)*R0*1.15); g.lineTo(X0+Math.cos(a)*r1,Y0-18+Math.sin(a)*r1*1.15); g.stroke(); } g.restore();
    once('b',()=>{ burst(P0[0],P0[1]-18,22,{col:['#ffd84a','#ffffff','#c8ccd8'],kind:'spark',sp:[50,130],life:[.2,.4]}); ring(P0[0],P0[1],6,34,.45,'#ffd84a',3); shake(1.5,.15); }); return true; }
  case 'hoimau': return castStep(g,{...c,k:'hoi',heal:c.heal&&c.heal.length?c.heal:[c.from]},now,cam);
  case 'xtfire': { if(!Q) return el<500; const col=(SD.XICHTHO.els[c.el]||{col:'#ff8a1a'}).col, m0=[P0[0]+face*26,P0[1]-34], k=Math.min(1,el/260);   /* Xích Thố phun lửa theo hệ từ miệng ngựa */
    if(el<420){ for(let i=0;i<3;i++){ const p=lerp(m0,Q,Math.max(0,k-i*.1)); burst(p[0]+rnd(-4,4),p[1]+rnd(-4,4),1,{col:[col,'#ffffff','#ffd84a'],sp:[10,40],life:[.15,.3],size:[2,4]}); } const p=lerp(m0,Q,k); glow(p[0],p[1],12,col); }
    if(el>260) once('h',()=>{ burst(Q[0],Q[1],22,{col:[col,'#ffffff'],sp:[40,140],life:[.25,.5],size:[2,4]}); ring(Q[0],Q[1]+8,3,24,.35,col,3); }); return el<560; }
  case 'refl': { if(!Q) return el<300; const k=Math.min(1,el/150), p=lerp([P0[0],P0[1]-20],Q,k);   /* gai vàng bay ngược về kẻ vừa đánh */
    if(k<1){ g.save(); g.strokeStyle='#ffd84a'; g.lineWidth=2.5; g.beginPath(); g.moveTo(P0[0]-cam.x,P0[1]-20-cam.y); g.lineTo(p[0]-cam.x,p[1]-cam.y); g.stroke(); g.restore(); glow(p[0],p[1],6,'rgba(255,230,120,.9)'); }
    else once('h',()=>burst(Q[0],Q[1],10,{col:['#ffd84a','#ffffff'],kind:'spark',sp:[50,120],life:[.1,.25]})); return el<300; }
  case 'phunlua': { if(!Q) return el<700;   /* Tiên Nữ phun lửa: luồng lửa cuộn từ tay tới mục tiêu, nổ lửa + khói đen ở chỗ trúng */
    if(el<520){ const k=Math.min(1,el/260); for(let i=0;i<3;i++){ const kk=Math.max(0,k-i*.08), p=lerp([hx,hy],Q,kk*(.8+Math.random()*.2)); burst(p[0]+rnd(-4,4),p[1]+rnd(-4,4),1,{col:C_FIRE,sp:[10,40],life:[.15,.3],size:[2,4]}); }
      const p=lerp([hx,hy],Q,k); g.save(); g.lineCap='round'; for(const [col,w,al] of [['#e8402a',9,.35],['#ffb030',5,.7],['#fff3b0',2,1]]){ g.globalAlpha=al*(el>360?1-(el-360)/160:1); g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(hx-cam.x,hy-cam.y); g.lineTo(p[0]-cam.x+rnd(-1,1),p[1]-cam.y+rnd(-1,1)); g.stroke(); } g.restore(); glow(p[0],p[1],12,'rgba(255,150,40,.9)'); }
    if(el>260) once('hit',()=>{ burst(Q[0],Q[1],30,{col:C_FIRE,sp:[40,140],life:[.3,.6],size:[2,4]}); burst(Q[0],Q[1]-6,12,{col:C_SMOKE,kind:'smoke',sp:[10,40],life:[.5,.9],size:[3,5],add:false,up:20}); ring(Q[0],Q[1]+8,3,28,.4,'#ff8a3a',3); shake(2.4,.16); });
    return el<720; }
  case 'hoi': { const k=el/1000; if(k<1){ circle(P0[0],P0[1],24,'#5fe06a',el/400,8,1-k); for(const pid of (c.heal||[])){ const p=posOf(pid); if(!p) continue; g.globalAlpha=(1-k)*.5; const gr=g.createLinearGradient(0,p[1]-cam.y-60,0,p[1]-cam.y); gr.addColorStop(0,'rgba(95,224,106,0)'); gr.addColorStop(1,'rgba(160,255,170,.9)'); g.fillStyle=gr; g.fillRect(p[0]-cam.x-9,p[1]-cam.y-60,18,60); g.globalAlpha=1;
      if(Math.random()<.5) burst(p[0]+rnd(-10,10),p[1]-rnd(0,8),1,{col:C_HEAL,kind:Math.random()<.5?'leaf':'rune',dir:-1.57,spread:.4,sp:[20,50],life:[.6,1],drag:1}); } }
    once('b',()=>{ for(const pid of (c.heal||[])){ const p=posOf(pid); if(p) burst(p[0],p[1]-20,16,{col:C_HEAL,kind:'star',sp:[20,70],life:[.5,.9],size:[1,2]}); } }); return el<1050; }
  case 'hoaquyen': { const big=true; if(el<200){ circle(P0[0],P0[1],20,'#ff5a2a',el/150,8,el/200); glow(tip[0],tip[1],4+el/40,'rgba(255,150,40,.95)'); if(Math.random()<.6) burst(tip[0]+rnd(-12,12),tip[1]+rnd(-12,12),1,{col:C_FIRE,sp:[5,20],life:[.2,.3]}); }
    if(Q){ const from=big?[hx,hy]:tip, k=projectile(200,big?220:280,from,Q,(p)=>{ glow(p[0],p[1],big?18:12,'rgba(255,120,30,.9)'); glow(p[0],p[1],big?8:5,'rgba(255,240,180,1)'); },p=>{ burst(p[0],p[1],big?4:2,{col:C_FIRE,kind:'dot',sp:[10,40],life:[.25,.5],size:[1.5,3],up:15}); if(Math.random()<.3) burst(p[0],p[1],1,{col:C_SMOKE,kind:'smoke',sp:[5,15],life:[.5,.8],size:[2,3],add:false}); });
      if(k>=1) once('ex',()=>{ burst(Q[0],Q[1],big?50:30,{col:C_FIRE,kind:'spark',sp:[60,200],life:[.2,.5],size:[1.5,3]}); burst(Q[0],Q[1],8,{col:C_SMOKE,kind:'smoke',sp:[10,40],life:[.6,1.1],size:[3,6],add:false,up:20}); ring(Q[0],Q[1]+10,4,big?44:28,.4,'#ffb03a',3); shake(big?4:2,.18); });
      if(k>=1&&el<(big?560:620)) glow(Q[0],Q[1],(big?34:22)*(1-(el-480)/200),'rgba(255,200,80,.8)'); } return el<900; }
  case 'loithan': { const big=true; if(el<260){ glow(tip[0],tip[1],5+el/30,'rgba(140,200,255,.95)'); if(Math.random()<.7) burst(tip[0]+rnd(-14,14),tip[1]+rnd(-14,14),1,{col:C_ELEC,kind:'spark',sp:[20,40],life:[.1,.2]}); }
    if(Q){ const cy=Q[1]-90; if(el<560){ g.globalAlpha=Math.min(1,el/200)*.8; for(const [dx,r] of [[-10,14],[8,16],[0,12]]){ g.fillStyle='#3a3a5a'; g.beginPath(); g.ellipse(Q[0]-cam.x+dx,cy-cam.y,r,6,0,0,7); g.fill(); } g.globalAlpha=1; }
      if(el>=260&&el<560){ if(!c.bolts||now-c.bt>55){ c.bt=now; c.bolts=[]; for(let b=0;b<(big?3:2);b++){ const pts=[[Q[0]+rnd(-10,10),cy]]; for(let i=1;i<7;i++) pts.push([Q[0]+rnd(-12,12)*(1-i/7),cy+(Q[1]+10-cy)*i/7]); pts.push([Q[0],Q[1]+10]); c.bolts.push(pts); } }
        for(const pts of c.bolts){ for(const [col,w] of [['rgba(120,180,255,.6)',6],['#bff0ff',2.5],['#ffffff',1]]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0]-cam.x,p[1]-cam.y):g.moveTo(p[0]-cam.x,p[1]-cam.y)); g.stroke(); } }
        once('hit',()=>{ burst(Q[0],Q[1]+8,big?36:22,{col:C_ELEC,kind:'spark',sp:[60,180],life:[.15,.35]}); ring(Q[0],Q[1]+10,4,big?40:26,.35,'#bff0ff',2); shake(big?4.5:3,.2); darkT=now; darkA=-.25; }); } } return el<700; }
  case 'thienthach': { const k0=Math.min(1,el/450); if(el<1500){ circle(P0[0],P0[1],32,'#ff9a3a',el/250,10,el<1300?k0:(1500-el)/200); circle(P0[0],P0[1],22,'#c86aff',-el/200,6,el<1300?k0:(1500-el)/200); darkT=now; darkA=Math.max(darkA,el<1200?k0*.35:.35*(1500-el)/300); }
    if(Q) for(let i=0;i<5;i++){ const t0=450+i*120, ox=((i*37)%5-2)*9, oy=((i*13)%3-1)*5, to=[Q[0]+ox,Q[1]+oy+8], from=[to[0]-70,to[1]-170];
      if(el>t0-300&&el<t0){ g.globalAlpha=.6; g.strokeStyle='#ffb03a'; g.lineWidth=1; g.beginPath(); g.ellipse(to[0]-cam.x,to[1]-cam.y,10*(1-(t0-el)/300),5*(1-(t0-el)/300),0,0,7); g.stroke(); g.globalAlpha=1; }
      const k=projectile(t0,280,from,to,p=>{ glow(p[0],p[1],10,'rgba(255,120,40,.85)'); g.fillStyle='#5a2a1a'; g.beginPath(); g.arc(p[0]-cam.x,p[1]-cam.y,4,0,7); g.fill(); g.fillStyle='#ffb03a'; g.fillRect(p[0]-cam.x-1,p[1]-cam.y-1,2,2); },p=>burst(p[0],p[1],3,{col:C_FIRE,kind:'dot',dir:-2.2,spread:.4,sp:[20,60],life:[.2,.4],size:[1.5,3]}));
      if(k>=1) once('m'+i,()=>{ burst(to[0],to[1],24,{col:C_FIRE,kind:'spark',sp:[50,170],life:[.2,.45]}); burst(to[0],to[1],10,{col:['#8a5a32','#5a3a22','#a8a296'],kind:'debris',sp:[40,120],life:[.4,.7],size:[2,3],g:260,add:false,up:80}); burst(to[0],to[1],4,{col:C_SMOKE,kind:'smoke',sp:[10,30],life:[.7,1.1],size:[3,5],add:false,up:15}); ring(to[0],to[1],4,26,.4,'#ffb03a',3); shake(2.6,.15); }); } return el<1600; }
  case 'kybanghao': { if(Q){ if(el<420){ const k=el/420; for(let i=0;i<8;i++){ const a=i/8*6.283, r=40*(1-k); g.fillStyle='#bff0ff'; g.fillRect(Q[0]-cam.x+Math.cos(a)*r-1,Q[1]-cam.y+Math.sin(a)*r*.5-3,3,6); } glow(Q[0],Q[1],14*k,'rgba(190,240,255,.8)'); }
      once('ice',()=>setTimeout(()=>{ burst(Q[0],Q[1],40,{col:C_ICE,kind:'spark',sp:[40,150],life:[.3,.6]}); ring(Q[0],Q[1]+10,6,50,.6,'#bff0ff',3); shake(3,.2); },420));
      if(el>420&&el<1400){ g.globalAlpha=(1400-el)/980*.7; g.fillStyle='#bff0ff'; for(let i=0;i<7;i++){ const a=i/7*6.283; g.beginPath(); g.moveTo(Q[0]-cam.x+Math.cos(a)*6,Q[1]-cam.y+10); g.lineTo(Q[0]-cam.x+Math.cos(a)*16,Q[1]-cam.y+10-18-(i%2)*8); g.lineTo(Q[0]-cam.x+Math.cos(a)*10,Q[1]-cam.y+12); g.fill(); } g.globalAlpha=1; } } return el<1500; }
  case 'gomupistol': { if(Q){ const k=el<260?el/260:Math.max(0,1-(el-260)/240), e=[hx+(Q[0]-hx)*k,hy+(Q[1]-hy)*k]; if(el<500){ g.strokeStyle='#c8844a'; g.lineWidth=6; g.beginPath(); g.moveTo(hx-cam.x,hy-cam.y); g.lineTo(e[0]-cam.x,e[1]-cam.y); g.stroke(); g.strokeStyle='#f0b070'; g.lineWidth=4; g.stroke(); g.fillStyle='#f0b070'; g.beginPath(); g.arc(e[0]-cam.x,e[1]-cam.y,6,0,7); g.fill(); }
      if(el>260) once('h',()=>{ burst(Q[0],Q[1],20,{col:C_SPARK,kind:'spark',sp:[80,180],life:[.12,.3]}); ring(Q[0],Q[1],4,28,.3,'#ffffff',3); shake(3,.15); }); } return el<560; }
  case 'hoden': { if(Q){ const k=Math.min(1,el/520); if(el<1100){ g.globalAlpha=Math.min(1,el/300)*(el>900?(1100-el)/200:1); g.fillStyle='#120a1a'; g.beginPath(); g.ellipse(Q[0]-cam.x,Q[1]-cam.y+6,22*k,10*k,0,0,7); g.fill(); g.strokeStyle='#8a5ad8'; g.lineWidth=2; g.stroke(); g.globalAlpha=1;
      if(Math.random()<.8) burst(Q[0]+rnd(-40,40),Q[1]+rnd(-30,20),1,{col:C_DARK,kind:'dot',sp:[0,0],life:[.3,.5],size:[2,3]}); for(const p of PT) if(p.c&&C_DARK.includes(p.c)&&Math.hypot(p.x-Q[0],p.y-Q[1])<60){ p.vx+=(Q[0]-p.x)*.2; p.vy+=(Q[1]-p.y)*.2; } }
      if(el>520) once('h',()=>{ burst(P0[0],P0[1]-18,14,{col:C_HEAL,kind:'star',sp:[20,60],life:[.4,.7]}); shake(2.5,.2); }); } return el<1150; }
  case 'chualanh': { c.heal=c.heal||[]; return castStep(g,{...c,k:'hoi'},now,cam); }
  case 'pet': { const sp=(SD.LC_SPECIES[c.sp]||{}), col=(SD.LC_TYPES[sp.t]||{}).col||'#ffffff'; if(!Q) return el<600; window.LC_FOL_HIDE=c.t+700; const home=[P0[0]-face*20,P0[1]+3];
      const k=el<350?el/350:el<700?1-(el-350)/350:0, p=lerp(home,[Q[0]-face*14,Q[1]+16],k), hop=Math.sin(k*Math.PI)*-22;
      if(el<700){ const s=A.linhcat(c.sp,0,face>0); g.globalAlpha=.35; g.drawImage(s.c,Math.round(p[0]-s.ax-cam.x-face*6),Math.round(p[1]-s.ay-cam.y+hop+2)); g.globalAlpha=1; g.drawImage(s.c,Math.round(p[0]-s.ax-cam.x),Math.round(p[1]-s.ay-cam.y+hop)); if(el<350&&Math.random()<.7) burst(p[0],p[1]-10+hop,1,{col:[col,'#ffffff'],sp:[5,20],life:[.2,.35]}); }
      if(el>=350) once('h',()=>{ burst(Q[0],Q[1],18,{col:[col,'#ffffff'],kind:'spark',sp:[50,140],life:[.15,.3]}); ring(Q[0],Q[1]+10,3,22,.3,col,2); }); return el<750; } }
  return el<1000; }
/* ---------- hiệu ứng đòn riêng của set legacy (chạy chồng lên hoạt ảnh chiêu) ---------- */
function lgStep(c,el,o){ const {g,P0,Q,face,hx,hy,ang,cam,once,glow,slash,projectile,lerp}=o, f=c.fx, X=p=>p[0]-cam.x, Y=p=>p[1]-cam.y;
  const bolt=(cols)=>{ for(const pts of c.bolts) for(const [col,w] of cols){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(X(p),Y(p)):g.moveTo(X(p),Y(p))); g.stroke(); } };
  if(f==='kamen'){ if(!Q) return el<500; const k=Math.min(1,el/260), p=lerp([P0[0],P0[1]-60],[Q[0],Q[1]-10],k);   /* Rider Kick: bay lên rồi đạp chéo xuống mục tiêu, vệt lửa, nổ chữ X */
    if(k<1){ g.save(); g.lineCap='round'; for(const [col,w,al] of [['#ff5a1a',10,.35],['#ffd84a',5,.8],['#ffffff',2,1]]){ g.globalAlpha=al; g.strokeStyle=col; g.lineWidth=w; g.beginPath(); g.moveTo(X([P0[0],0]),Y([0,P0[1]-60])); g.lineTo(X(p),Y(p)); g.stroke(); } g.restore(); glow(p[0],p[1],12,'rgba(255,200,80,.95)'); }
    else once('h',()=>{ burst(Q[0],Q[1],40,{col:['#ffd84a','#ff5a1a','#ffffff'],kind:'spark',sp:[80,240],life:[.25,.55]}); ring(Q[0],Q[1]+8,6,44,.45,'#ffd84a',4,1); shake(4,.25); }); return el<620; }
  if(f==='shovel'){ if(el<260) slash(P0[0]+face*6,P0[1]-16,ang-1.3,2.4,17,['#acccff','#4c7cea','#2c4cba'],el/260);   // xẻng hất: đất đá + ngọc xanh
    if(Q&&el>150) once('h',()=>{ burst(Q[0],Q[1]+10,12,{col:['#8a5a32','#5a3a22','#a8a296'],kind:'debris',sp:[40,120],life:[.4,.7],size:[2,3],g:260,add:false,up:90}); burst(Q[0],Q[1],12,{col:['#4cc8ff','#acccff','#ffffff'],kind:'star',sp:[30,100],life:[.4,.8],size:[1,2.5]}); }); return el<600; }
  if(f==='pow'){ if(!Q) return el<300; const k=(el-90)/500; if(k>0&&k<1){ const sc=k<.15?k/.15*1.3:1.3-(k-.15)*.3; g.save(); g.translate(X(Q),Y(Q)-20); g.rotate(-.15); g.scale(sc,sc); g.globalAlpha=Math.min(1,(1-k)*2);   // chữ POW! nổ trên mục tiêu
      g.beginPath(); for(let i=0;i<20;i++){ const r=i%2?9:16, a=i/20*6.283; g.lineTo(Math.cos(a)*r,Math.sin(a)*r*.75); } g.closePath(); g.fillStyle='#ffd84a'; g.fill(); g.strokeStyle='#e8302a'; g.lineWidth=1.5; g.stroke();
      g.font='12px VT323, monospace'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#e8302a'; g.fillText('POW!',0,1); g.restore(); g.globalAlpha=1; }
    if(el>90) once('h',()=>{ burst(Q[0],Q[1],14,{col:['#ff4a4a','#ffffff','#ffd84a'],kind:'spark',sp:[60,160],life:[.12,.3]}); shake(2.5,.15); }); return el<620; }
  if(f==='egg'){ if(!Q) return el<300; const k=projectile(0,300,[hx,hy],Q,(p,kk)=>{ const h=Math.sin(kk*Math.PI)*26; g.fillStyle='#ffffff'; g.beginPath(); g.ellipse(X(p),Y(p)-h,4,5,0,0,7); g.fill(); g.strokeStyle='#1c1516'; g.lineWidth=1; g.stroke(); g.fillStyle='#40ba62'; g.fillRect(X(p)-2,Y(p)-h-2,2,2); g.fillRect(X(p)+1,Y(p)-h+1,2,2); });   // ném trứng Yoshi
    if(k>=1) once('h',()=>{ burst(Q[0],Q[1],16,{col:['#ffd84a','#fff6a8','#ffffff'],kind:'star',sp:[40,120],life:[.4,.8],size:[1.5,3]}); burst(Q[0],Q[1],6,{col:['#ffffff','#40ba62'],kind:'debris',sp:[40,90],life:[.4,.6],size:[2,3],g:200,add:false,up:60}); }); return el<700; }
  if(f==='air'){ if(!Q) return el<300; const k=el/650; if(k<1){ for(let i=0;i<3;i++){ const a0=el/90+i*2.09, r=8+k*22; g.globalAlpha=(1-k)*.9; g.strokeStyle=i%2?'#bff0ff':'#ffffff'; g.lineWidth=2; g.beginPath(); g.ellipse(X(Q),Y(Q),r,r*.45,0,a0,a0+2.2); g.stroke(); }   // lốc khí xoáy
      g.globalAlpha=1; if(Math.random()<.6) burst(Q[0]+rnd(-14,14),Q[1]+rnd(-6,6),1,{col:['#ffffff','#bff0ff'],kind:'dot',sp:[20,50],life:[.3,.5],up:20}); } return el<700; }
  if(f==='chainsaw'){ if(!Q) return el<300; if(el<380){ if(Math.random()<.9) burst(Q[0]+rnd(-4,4),Q[1]+rnd(-4,4),3,{col:['#ffd84a','#ff8c2c','#ffffff'],kind:'spark',sp:[80,200],life:[.08,.2]});   // cưa toé lửa + máu
      if(Math.random()<.3) burst(Q[0],Q[1],2,{col:['#c8202a','#ff4a5a'],kind:'debris',sp:[40,100],life:[.4,.7],size:[1.5,2.5],g:300,add:false,up:60}); if(Math.floor(el/60)%2) shake(1,.05); } return el<500; }
  if(f==='lion'){ const k=el/500; if(Q&&k<1){ for(const [d,col] of [[0,'#ffd84a'],[.15,'#ffb03a']]){ const kk=Math.max(0,k-d); g.globalAlpha=1-kk; g.strokeStyle=col; g.lineWidth=3; g.beginPath(); g.ellipse(X(Q),Y(Q),6+kk*30,(6+kk*30)*.55,0,0,7); g.stroke(); } g.globalAlpha=1; }   // sóng gầm sư tử vàng
    if(Q) once('h',()=>{ burst(Q[0],Q[1],18,{col:['#ffd84a','#fff6a8','#c8901a'],kind:'spark',sp:[60,180],life:[.2,.45]}); burst(P0[0],P0[1]-40,6,{col:['#ea442e','#b8221c'],kind:'leaf',sp:[20,50],life:[.6,1],drag:1}); shake(2.2,.15); }); return el<600; }
  if(f==='sand'){ if(!Q) return el<300; const k=el/750; if(k<1){ for(let i=0;i<3;i++) burst(Q[0]+Math.cos(el/80+i*2.1)*(16-k*8),Q[1]+Math.sin(el/80+i*2.1)*7,1,{col:['#e2c9a2','#d6aa34','#c8a877'],kind:'dot',sp:[5,20],life:[.4,.7],size:[1.5,2.5],add:false});   // bão cát + chữ thần
      if(Math.random()<.25) burst(Q[0]+rnd(-12,12),Q[1],1,{col:['#ffd84a'],kind:'rune',dir:-1.57,spread:.2,sp:[30,50],life:[.6,.9],drag:1}); } once('h',()=>shake(1.6,.15)); return el<800; }
  if(f==='oni'){ if(!Q) return el<300; if(el<320){ const k=el/320; g.save(); g.translate(X(Q),Y(Q)); g.rotate(face>0?-.5:Math.PI+.5);   // vầng trăng đỏ
      for(let i=0;i<3;i++){ g.globalAlpha=(1-k)*(1-i*.3); g.strokeStyle=['#ff4a4a','#b8221c','#2a0a0a'][i]; g.lineWidth=[4,2.5,1.5][i]; g.beginPath(); g.ellipse(0,0,22-i*3,9-i,0,-.2*Math.PI,Math.PI*(-.2+1.2*Math.min(1,k*1.8))); g.stroke(); } g.restore(); g.globalAlpha=1; }
    once('h',()=>burst(Q[0],Q[1],14,{col:['#ff4a4a','#ffb03a','#2a0a0a'],kind:'dot',sp:[30,90],life:[.3,.6],up:30})); return el<500; }
  if(f==='beam'){ if(!Q) return el<300; if(el<130) glow(hx,hy,3+el/20,'rgba(255,240,120,.95)'); else if(el<480){ const k=(el-130)/350, L=Math.hypot(Q[0]-hx,Q[1]-hy)||1, ux=(Q[0]-hx)/L, uy=(Q[1]-hy)/L;   // tia xoáy Makankosappo
      g.globalAlpha=1-k*.6; g.strokeStyle='#fff6a8'; g.lineWidth=3; g.beginPath(); g.moveTo(hx-cam.x,hy-cam.y); g.lineTo(X(Q),Y(Q)); g.stroke(); g.strokeStyle='#c86aff'; g.lineWidth=1.5; g.beginPath();
      for(let d=0;d<=L;d+=2){ const w=Math.sin(d/4-el/30)*5, x=hx+ux*d-uy*w, y=hy+uy*d+ux*w; d?g.lineTo(x-cam.x,y-cam.y):g.moveTo(x-cam.x,y-cam.y); } g.stroke(); g.globalAlpha=1;
      once('h',()=>{ burst(Q[0],Q[1],16,{col:['#fff6a8','#c86aff','#ffffff'],kind:'spark',sp:[60,160],life:[.15,.35]}); ring(Q[0],Q[1]+8,3,20,.3,'#c86aff',2); }); } return el<600; }
  if(f==='buster'){ if(el<160){ glow(hx,hy,3+el/18,'rgba(127,216,255,.95)'); if(Math.random()<.7) burst(hx+rnd(-12,12),hy+rnd(-12,12),1,{col:['#bff0ff','#ffffff'],sp:[5,15],life:[.1,.2]}); }   // tích lực rồi bắn cầu plasma
    if(Q){ const k=projectile(160,160,[hx,hy],Q,p=>{ glow(p[0],p[1],10,'rgba(127,216,255,.9)'); glow(p[0],p[1],4,'rgba(255,255,220,1)'); }); if(k>=1) once('h',()=>{ ring(Q[0],Q[1]+6,3,24,.3,'#7fd8f0',3); burst(Q[0],Q[1],14,{col:['#bff0ff','#ffffff','#ffd84a'],kind:'spark',sp:[60,160],life:[.12,.3]}); }); } return el<600; }
  if(f==='zsaber'){ if(!Q) return el<300; if(el<300){ const k=el/300; slash(Q[0],Q[1],ang-1.6,3.2,22,['#ffffff','#7ce26e','#2a8a3a'],k); slash(Q[0],Q[1]+2,ang-1.4,2.8,16,['#c8ffd0','#7ce26e'],Math.max(0,k-.15)); }   // vầng trăng Z-Saber
    once('h',()=>burst(Q[0],Q[1],14,{col:['#7ce26e','#ffffff'],kind:'spark',sp:[60,150],life:[.12,.28]})); return el<500; }
  if(f==='king'){ if(el<120) glow(hx,hy-6,6,'rgba(255,216,74,.9)'); if(!Q) return el<300; once('h',()=>burst(Q[0],Q[1]-20,24,{col:['#ffd84a','#ea442e','#ffffff','#fff6a8'],kind:'dot',sp:[30,90],life:[.6,1.1],size:[1.5,2.5],g:120,up:40}));   // mưa vàng + vương miện loé
    if(el>100&&el<700){ const k=(el-100)/600, x=X(Q), y=Y(Q)-34-k*8; g.globalAlpha=1-k; g.fillStyle='#ffd84a'; g.fillRect(x-6,y,13,3); g.fillRect(x-6,y-4,2,4); g.fillRect(x,y-5,1,5); g.fillRect(x+5,y-4,2,4); g.fillStyle='#ea442e'; g.fillRect(x-1,y+1,3,1); g.globalAlpha=1; } return el<900; }
  if(f==='force'){ if(el<260) slash(P0[0]+face*6,P0[1]-18,ang-1.4,2.6,18,['#ffffff','#ff4040','#b8221c'],el/260);   // kiếm ánh sáng đỏ + vòng Thần Lực siết lại
    if(Q){ const k=el/600; if(k<1){ g.globalAlpha=(1-k)*.8; g.strokeStyle='#3a1a4a'; g.lineWidth=3; g.beginPath(); g.ellipse(X(Q),Y(Q),26*(1-k)+4,(26*(1-k)+4)*.55,0,0,7); g.stroke(); g.strokeStyle='#8a5ad8'; g.lineWidth=1; g.stroke(); g.globalAlpha=1; } once('h',()=>shake(2,.2)); } return el<650; }
  if(f==='selfie'){ if(el<140){ glow(hx,hy-4,4+el/12,'rgba(255,255,255,1)'); if(el>100) once('flash',()=>{ darkT=performance.now(); darkA=-.35; }); }   // flash điện thoại loé trắng, tim hồng bay tới, sao choáng quay quanh mục tiêu
    if(!Q) return el<400; const heart=(x,y,c)=>{ g.fillStyle=c; g.fillRect(x-2,y-1,2,2); g.fillRect(x+1,y-1,2,2); g.fillRect(x-2,y+1,5,1); g.fillRect(x-1,y+2,3,1); g.fillRect(x,y+3,1,1); };
    for(let i=0;i<4;i++){ const k=Math.min(1,Math.max(0,(el-120-i*50)/280)); if(k>0&&k<1){ const p=lerp([hx,hy],Q,k); heart(Math.round(p[0]-cam.x),Math.round(p[1]-cam.y+Math.sin(k*8+i)*5),['#ff7ac8','#ff4a8a','#ffd0e8','#ff9ac8'][i]); } }
    if(el>420&&el<1100){ for(let i=0;i<3;i++){ const a=el/160+i*2.09; g.fillStyle='#ffe066'; const x=Math.round(Q[0]-cam.x+Math.cos(a)*10), y=Math.round(Q[1]-cam.y-14+Math.sin(a)*3); g.fillRect(x-1,y,3,1); g.fillRect(x,y-1,1,3); } }
    if(el>400) once('h',()=>{ burst(Q[0],Q[1],16,{col:['#ff7ac8','#ffffff','#ffd0e8'],kind:'star',sp:[40,110],life:[.3,.7]}); ring(Q[0],Q[1]+8,3,22,.3,'#ff7ac8',2); }); return el<1150; }
  if(f==='snake'){ if(!Q) return el<300; const k=Math.min(1,el/260), L=Math.hypot(Q[0]-hx,Q[1]-hy)||1, ux=(Q[0]-hx)/L, uy=(Q[1]-hy)/L;   // rắn độc lao ra cắn rồi rút về, toé bọt độc
    if(el<520){ const reach=el<260?k:Math.max(0,1-(el-260)/260), n=Math.max(2,Math.round(L*reach/3)); g.lineCap='round';
      for(const [col,w] of [['#0f4a26',5],['#3ab04a',3.4]]){ g.strokeStyle=col; g.lineWidth=w; g.beginPath(); for(let i=0;i<=n;i++){ const d=L*reach*i/n, wv=Math.sin(i*1.3-el/40)*3*(1-i/n); const x=hx+ux*d-uy*wv, y=hy+uy*d+ux*wv; i?g.lineTo(x-cam.x,y-cam.y):g.moveTo(x-cam.x,y-cam.y); } g.stroke(); }
      const hxp=hx+ux*L*reach, hyp=hy+uy*L*reach; g.fillStyle='#2a8a3a'; g.beginPath(); g.ellipse(hxp-cam.x,hyp-cam.y,4,3,Math.atan2(uy,ux),0,7); g.fill(); g.fillStyle='#ffe02a'; g.fillRect(hxp-cam.x-1,hyp-cam.y-2,1,1); g.fillStyle='#e8302a'; g.fillRect(hxp-cam.x+ux*4,hyp-cam.y+uy*4,2,1); g.lineCap='butt'; }
    if(el>250) once('h',()=>{ burst(Q[0],Q[1],16,{col:['#7ae05a','#b070ff','#ffffff'],kind:'dot',sp:[30,90],life:[.4,.8],size:[1.5,3],up:20}); ring(Q[0],Q[1]+8,3,20,.3,'#7ae05a',2); }); return el<620; }
  if(f==='note'){ if(!Q) return el<400; if(el<600){ for(let i=0;i<2;i++) if(Math.random()<.5){ const a=rnd(0,6.28); NOTES.push({x:Q[0]+Math.cos(a)*12,y:Q[1]+Math.sin(a)*6,t:performance.now(),c:pick(['#ff9a3a','#ff7ac8','#ffd84a','#ffffff']),s:pick(['♪','♫'])}); } }   // nốt nhạc bay lên quanh mục tiêu
    once('h',()=>{ burst(Q[0],Q[1],16,{col:['#ff9a3a','#ff7ac8','#ffffff'],kind:'star',sp:[40,120],life:[.3,.7]}); ring(Q[0],Q[1]+8,3,24,.35,'#ff7ac8',2); }); return el<650; }
  if(f==='zeus'){ if(!Q) return el<300; const cy=Q[1]-110; if(el>=120&&el<420){ if(!c.bolts||performance.now()-c.bt>50){ c.bt=performance.now(); const pts=[[Q[0]+rnd(-10,10),cy]]; for(let i=1;i<8;i++) pts.push([Q[0]+rnd(-12,12)*(1-i/8),cy+(Q[1]-cy)*i/8]); pts.push([Q[0],Q[1]+8]); c.bolts=[pts]; }   // sét vàng từ trời
      bolt([['rgba(255,200,60,.5)',7],['#ffd84a',3],['#ffffff',1]]); once('h',()=>{ burst(Q[0],Q[1]+6,26,{col:['#ffd84a','#fff6a8','#ffffff'],kind:'spark',sp:[60,200],life:[.15,.4]}); ring(Q[0],Q[1]+10,4,32,.4,'#ffd84a',3); shake(3.5,.22); darkT=performance.now(); darkA=-.25; }); } return el<700; }
  return el<300; }
/* ---------- vũ khí Thợ Rèn: vung theo loại (chém, đâm, bổ, nện, quét, rút đao, bắn tên, phóng cầu phép) + nổ theo hệ ở mục tiêu ---------- */
const WHIT={stab:120,slash:160,shoot:300,thrust:140,chop:150,slam:230,iai:110,sweep:220,cast:360,cleave:260};
function wpnImpact(el,Q,face){ const C=M.welems[el].col;
  if(el==='poison'){ burst(Q[0],Q[1],16,{col:['#7ae05a','#c8ff7a','#6a3a9a'],kind:'dot',sp:[20,70],life:[.5,.9],size:[1.5,3],up:30}); ring(Q[0],Q[1]+8,3,20,.35,C,2); }
  else if(el==='ice'){ burst(Q[0],Q[1],18,{col:C_ICE,kind:'spark',sp:[60,150],life:[.2,.4]}); burst(Q[0],Q[1],8,{col:['#ffffff','#bff0ff'],kind:'star',sp:[20,60],life:[.5,.9],size:[1,2]}); ring(Q[0],Q[1]+8,3,22,.35,'#bff0ff',2); }
  else if(el==='fire'){ burst(Q[0],Q[1],20,{col:C_FIRE,kind:'spark',sp:[60,170],life:[.2,.45]}); burst(Q[0],Q[1],4,{col:C_SMOKE,kind:'smoke',sp:[10,30],life:[.6,1],size:[3,5],add:false,up:15}); ring(Q[0],Q[1]+8,3,24,.35,'#ffb03a',3); }
  else if(el==='thunder'){ burst(Q[0],Q[1],18,{col:C_ELEC.concat(['#ffe066']),kind:'spark',sp:[70,180],life:[.12,.3]}); ring(Q[0],Q[1]+8,3,22,.3,'#ffe066',2); darkT=performance.now(); darkA=-.15; }
  else { burst(Q[0],Q[1],16,{col:['#c86aff','#ff4ab8','#2a1830'],kind:'dot',sp:[10,40],life:[.4,.8],size:[1.5,3]}); ring(Q[0],Q[1]+8,24,3,.4,'#c86aff',2); }
  shake(1.6,.12); }
function wpnStep(c,el,o){ const {g,P0,Q,face,hx,hy,cam,once}=o, w=M.weapons[c.w]; if(!w) return false; const s=A.muWeapon(c.w), sw=M.wtypes[w.type].swing, ht=WHIT[sw]||180, col=M.welems[w.el].col;
  const drawW=(ang,al=1,fx=0,fy=0)=>{ if(al<=0) return; g.save(); g.translate(Math.round(hx-cam.x),Math.round(hy-cam.y)); if(face<0) g.scale(-1,1); g.translate(fx,fy); g.rotate(ang+Math.PI/4); g.globalAlpha=al; g.drawImage(s.c,-s.px,-s.py); g.restore(); g.globalAlpha=1; };
  const arcSwing=(a0,a1,dur,trail=3)=>{ if(el>=dur+160) return; const k=Math.min(1,el/dur), e=1-Math.pow(1-k,3), a=a0+(a1-a0)*e; for(let i=trail;i>=1;i--) drawW(a-(a1-a0)*.09*i,(1-k*.5)*(.5-i*.12)); drawW(a,el<dur?1:1-(el-dur)/160); };
  if(sw==='slash') arcSwing(-1.9,.6,200); else if(sw==='chop') arcSwing(-2.4,.4,170); else if(sw==='cleave') arcSwing(-2.2,.8,280,4); else if(sw==='sweep') arcSwing(-2.8,1.6,300,5); else if(sw==='slam') arcSwing(-2.6,.9,230,3);
  else if(sw==='stab'){ if(el<380){ const ph=(el%180)/180, f=Math.sin(Math.PI*Math.min(1,ph*1.4))*10; drawW(-.1,1,f,0); } }
  else if(sw==='thrust'){ if(el<360){ const f=el<150?el/150*14:Math.max(0,14-(el-150)/210*14); drawW(0,1,f,0); drawW(0,.3,f-6,0); } }
  else if(sw==='iai'){ if(el<70) drawW(1.2,el/70); else if(el<360){ drawW(.25,1-(el-70)/290); if(Q&&el<200){ g.globalAlpha=1-(el-70)/130; g.strokeStyle='#ffffff'; g.lineWidth=2; g.beginPath(); g.moveTo(Q[0]-cam.x-face*18,Q[1]-cam.y-6); g.lineTo(Q[0]-cam.x+face*18,Q[1]-cam.y+6); g.stroke(); g.strokeStyle=col; g.lineWidth=1; g.stroke(); g.globalAlpha=1; } } }
  else if(sw==='shoot'||sw==='cast'){ if(el<420) drawW(sw==='shoot'?-Math.PI/2+.2:-Math.PI/2+.35,el<340?1:1-(el-340)/80);
    if(Q){ const t0=sw==='shoot'?100:160, dur=sw==='shoot'?200:200, k=(el-t0)/dur; if(k>0&&k<1){ const tip=[hx+face*6,hy-10], p=[tip[0]+(Q[0]-tip[0])*k,tip[1]+(Q[1]-tip[1])*k];
        if(sw==='shoot'){ const ang=Math.atan2(Q[1]-tip[1],Q[0]-tip[0]); g.strokeStyle='#f4f0e0'; g.lineWidth=1.5; g.beginPath(); g.moveTo(p[0]-cam.x,p[1]-cam.y); g.lineTo(p[0]-cam.x-Math.cos(ang)*10,p[1]-cam.y-Math.sin(ang)*10); g.stroke(); g.fillStyle=col; g.fillRect(Math.round(p[0]-cam.x)-1,Math.round(p[1]-cam.y)-1,3,3); }
        else { g.save(); g.globalCompositeOperation='lighter'; const gr=g.createRadialGradient(p[0]-cam.x,p[1]-cam.y,0,p[0]-cam.x,p[1]-cam.y,8); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.4,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(p[0]-cam.x-8,p[1]-cam.y-8,16,16); g.restore(); }
        if(Math.random()<.6) burst(p[0],p[1],1,{col:[col,'#ffffff'],sp:[5,20],life:[.2,.35]}); } } }
  if(Q&&el>=ht) once('imp',()=>{ wpnImpact(w.el,Q,face); if(sw==='slam'){ ring(Q[0],Q[1]+10,4,36,.45,col,3); burst(Q[0],Q[1]+8,10,{col:['#8a5a32','#5a3a22','#a8a296'],kind:'debris',sp:[40,120],life:[.4,.7],size:[2,3],g:260,add:false,up:80}); } if(sw==='cleave') shake(3,.18); });
  // dư âm theo hệ ở mục tiêu: sét giật / khe nứt hư không
  if(Q&&el>=ht&&el<ht+260){ const k=(el-ht)/260;
    if(w.el==='thunder'&&k<.6){ g.strokeStyle='#fff6a8'; g.lineWidth=2; g.beginPath(); let x=Q[0]-cam.x+rnd(-4,4), y=Q[1]-cam.y-40; g.moveTo(x,y); for(let i=0;i<5;i++){ x+=rnd(-6,6); y+=8; g.lineTo(x,y); } g.stroke(); }
    if(w.el==='void'){ g.globalAlpha=Math.sin(k*Math.PI); g.fillStyle='#140a1a'; g.beginPath(); g.ellipse(Q[0]-cam.x,Q[1]-cam.y,3+k*6,10*(1-k*.3),.4,0,7); g.fill(); g.strokeStyle='#ff4ab8'; g.lineWidth=1; g.stroke(); g.globalAlpha=1; } }
  return el<Math.max(ht+300,520); }
/* ---------- boss: lấy đà, ra đòn, hiệu ứng từng đòn ---------- */
const AURA={reze:['#ff9a2a','#ffe066'],songoku:['#7fd8ff','#bff0ff'],luffy:['#ffffff','#fff3d0'],naruto:['#ff3a5a','#ff8a8a'],cuamay:['#ffd84a','#ff9a2a'],duongvu_ma:['#c8a0ff','#8a5ad8'],rongxanh:['#6ad88a','#c8ffd0']};
const BOSS_FX=[], NOTES=[]; // hiệu ứng đòn boss lúc nổ · nốt nhạc bay lên (set 16Typh)
function bossImpact(e){ const t=performance.now(), b=BS[e.boss]; if(!b) return; const B=bossBy(e.boss), bx=B?B.x*T:e.x*T, by=B?B.y*T:e.y*T, X0=e.x*T, Y0=e.y*T;
  if(e.kind==='flood'){ PUD.push({x:X0,y:Y0,r:(e.r||8)*T,t}); shake(3,.3); GAME.sfx('poof',.5); return; }
  if(e.kind==='nuke'){ GAME.bigText('☢ BÙM!!!'); shake(12,1); GAME.sfx('poof',1); darkT=t; darkA=.9; for(let i=0;i<6;i++) setTimeout(()=>{ burst(X0+rnd(-80,80),Y0+rnd(-40,40),40,{col:C_FIRE.concat(['#ffffff','#ffe066']),kind:'spark',sp:[80,260],life:[.4,.9],size:[2,4]}); burst(X0+rnd(-40,40),Y0-rnd(20,90),20,{col:C_SMOKE,kind:'smoke',sp:[10,50],life:[.9,1.6],size:[4,7],add:false,up:40}); ring(X0,Y0,10,220,.8,'#ffe066',5,1); },i*120); return; }   /* nấm khói + chớp trắng */
  BOSS_FX.push({...e,t,bx,by,X0,Y0});
  const near=Math.hypot(GAME.P.x-X0,GAME.P.y-Y0)<(e.r||4)*T*2; if(e.kind==='ring'||e.kind==='circle'||e.kind==='jump') shake(near?5:2.5,.25); else shake(near?2.5:1,.12);
  const col={luffy:C_SPARK,naruto:['#ff4a6a','#ffd84a','#ffffff'],cuamay:['#ffd84a','#ffffff','#ff9a2a'],duongvu_ma:C_DARK,rongxanh:['#6ad88a','#c8ffd0','#ffffff']}[e.boss]||C_SPARK;
  if(e.kind==='line'){ const L=e.range*T, c=Math.cos(e.ang), s_=Math.sin(e.ang); for(let i=1;i<=8;i++) burst(X0+c*L*i/8,Y0+s_*L*i/8,4,{col,kind:'spark',dir:e.ang+(i%2?1.57:-1.57),spread:.7,sp:[50,150],life:[.15,.35]});
    if(e.dash&&B) for(let i=0;i<5;i++) BOSS_FX.push({k:'ghost',t:t+i*35,sprite:B.sprite,bx:X0+c*L*i/5,by:Y0+s_*L*i/5,X0,Y0}); }   /* lao: để lại bóng mờ dọc đường */
  else if(e.kind!=='cone'){ burst(X0,Y0,e.kind==='single'?14:32,{col,kind:'spark',sp:[60,200],life:[.2,.45]}); burst(X0,Y0,e.kind==='single'?2:8,{col:C_SMOKE,kind:'smoke',sp:[10,40],life:[.6,1.1],size:[3,6],add:false,up:15}); ring(X0,Y0,e.kind==='donut'?e.r0*T:4,(e.r||1.5)*T,.4,col[0],3,1); if(e.kind==='donut') ring(X0,Y0,e.r*T,e.r0*T,.45,col[1]||col[0],3,1); }
  if(e.ak==='gigant'||e.ak==='manh'||e.ak==='thienthachrong') burst(X0,Y0,12,{col:['#8a5a32','#5a3a22','#a8a296'],kind:'debris',sp:[50,140],life:[.4,.8],size:[2,3],g:260,add:false,up:90});
  if(e.ak==='mycoc'){ for(let i=0;i<3;i++) setTimeout(()=>ring(X0,Y0,10,e.r*T,.6,i%2?'#6ae88a':'#ffffff',4,1),i*120); burst(X0,Y0-14,40,{col:['#6ae88a','#3a8a3a','#ffffff'],kind:'smoke',sp:[40,160],life:[.5,1],size:[2,5],add:false,up:20}); shake(6,.4); }   /* chui ra khỏi cốc mỳ: nổ độc + choáng */
  if(e.ak==='drum'){ for(let i=0;i<3;i++) setTimeout(()=>ring(X0,Y0,10,e.r*T,.5,'#ffffff',3),i*140); } if(e.ak==='roar'||e.ak==='nguyenrua'||e.ak==='loc'||e.ak==='xoaycua') ring(X0,Y0,10,e.r*T,.6,col[0],4);
  if(e.kind==='cone') burst(bx+Math.cos(e.ang)*e.range*T*.6,by-20+Math.sin(e.ang)*e.range*T*.6,10,{col,kind:'spark',dir:e.ang,spread:.5,sp:[80,200],life:[.15,.3]}); }
function bossDeath(e){ const X0=e.x*T, Y0=e.y*T; GAME.sfx('level_up',.8); GAME.bigText('HẠ BOSS!'); shake(7,.7);
  for(let i=0;i<5;i++) setTimeout(()=>{ burst(X0+rnd(-30,30),Y0-rnd(10,60),30,{col:C_FIRE.concat(C_GOLD),kind:'spark',sp:[80,220],life:[.3,.7]}); ring(X0,Y0,10,70,.6,'#ffd84a',4); },i*160);
  burst(X0,Y0-30,40,{col:C_GOLD,kind:'star',sp:[40,160],life:[.6,1.2],size:[1,3],g:120}); }
function drawBossFx(g,now,cam){ for(let i=BOSS_FX.length-1;i>=0;i--){ const f=BOSS_FX[i], el=now-f.t, k=el/500; if(el>700){ BOSS_FX.splice(i,1); continue; } if(el<0) continue; const X0=f.X0-cam.x, Y0=f.Y0-cam.y, bx=f.bx-cam.x, by=f.by-cam.y;
    g.globalAlpha=Math.max(0,1-k);
    if(f.k==='ghost'){ const sp=CACHE['mb'+f.sprite+'0false']; if(sp){ g.globalAlpha=Math.max(0,.45-el/700); g.drawImage(sp.c,Math.round(bx-sp.ax),Math.round(by-sp.ay)); } g.globalAlpha=1; continue; }
    if(f.kind==='line'){ const L=f.range*T, W=f.w*T*(1-k*.6), col=(AURA[f.boss]||['#ffffff'])[0]; g.save(); g.translate(X0,Y0); g.rotate(f.ang); g.globalCompositeOperation='lighter';
      g.fillStyle=col; g.globalAlpha=Math.max(0,.75-k*.75); g.fillRect(-T,-W,L+T,W*2); g.fillStyle='#ffffff'; g.globalAlpha=Math.max(0,1-k*1.4); g.fillRect(-T,-W*.35,L+T,W*.7); g.restore(); g.globalAlpha=1; continue; }
    if(f.ak==='pistol'||f.ak==='rasengan'||f.ak==='longkich'||f.ak==='bongden'){ const c=f.ak==='pistol'?'#f0b070':f.ak==='rasengan'?'#7fd0ff':f.ak==='longkich'?'#6ad88a':'#8a5ad8'; if(f.ak==='pistol'){ g.strokeStyle='#c8844a'; g.lineWidth=7; g.beginPath(); g.moveTo(bx,by-40); g.lineTo(X0,Y0-10); g.stroke(); g.strokeStyle=c; g.lineWidth=5; g.stroke(); g.fillStyle=c; g.beginPath(); g.arc(X0,Y0-10,9,0,7); g.fill(); }
      else { g.fillStyle=c; g.beginPath(); g.arc(X0,Y0-8,10*(1-k*.5),0,7); g.fill(); g.strokeStyle='#ffffff'; g.lineWidth=1.5; g.beginPath(); g.arc(X0,Y0-8,6,el/40,el/40+4); g.stroke(); } }
    if(f.ak==='gigant'){ const drop=Math.max(0,1-el/120); g.fillStyle='#f0b070'; g.beginPath(); g.ellipse(X0,Y0-10-drop*120,26,20,0,0,7); g.fill(); g.strokeStyle='#c8844a'; g.lineWidth=2; g.stroke(); }
    if(f.kind==='cone'){ g.fillStyle=f.boss==='rongxanh'?'rgba(106,216,138,.55)':'rgba(240,176,112,.55)'; g.beginPath(); g.moveTo(bx,by-30); g.arc(bx,by-30,f.range*T,f.ang-.5,f.ang+.5); g.closePath(); g.fill();
      if(f.boss==='luffy') for(let j=0;j<6;j++){ const d=rnd(.3,1)*f.range*T, a=f.ang+rnd(-.45,.45); g.fillStyle='#f0b070'; g.beginPath(); g.arc(bx+Math.cos(a)*d,by-30+Math.sin(a)*d,5,0,7); g.fill(); } }
    if(f.ak==='bunshin'||f.ak==='thoimien'){ g.fillStyle=f.ak==='bunshin'?'rgba(242,128,42,.8)':'rgba(255,154,184,.7)'; g.beginPath(); g.arc(X0,Y0-14,10,0,7); g.fill(); }
    if(f.ak==='shuriken'){ g.save(); g.translate(X0,Y0-10); g.rotate(el/30); g.fillStyle='#c8ccd2'; for(let j=0;j<4;j++){ g.rotate(1.5708); g.fillRect(-1,-9,3,9); } g.restore(); }
    g.globalAlpha=1; } }
// boss lấy đà: nghiêng người + hào quang dày lên trước khi ra đòn; khựng khi trúng đòn
const DISP={};   // vị trí boss hiển thị: trượt mượt; lúc nhảy (Rocket, Rasengan, Bổ Nhào...) bay vòng cung tới chỗ đáp
function drawBoss(g,B,now,cam,clock){ const hit=HITS[B.id], stun=hit&&now-hit.t<70, fl=hit&&now-hit.t<110, D=DISP[B.id]||(DISP[B.id]={x:B.x,y:B.y,fr:0}), fr=stun?D.fr:Math.floor(clock*(B.phase===3?3:1.6))%2; D.fr=fr;
  const an=B.anim||{}, jz=an.at&&NET.now()<an.at&&(B.tele||[]).find(z=>z.k===an.k&&z.kind==='jump');
  if(jz){ if(!D.j||D.j.id!==jz.id) D.j={id:jz.id,x:D.x,y:D.y}; const k=Math.max(0,Math.min(1,1-(jz.at-NET.now())/((jz.at-an.t)||1))), e=k*k*(3-2*k); D.x=D.j.x+(jz.x-D.j.x)*e; D.y=D.j.y+(jz.y-D.j.y)*e; D.h=Math.sin(k*Math.PI)*56; D.v=0; }
  else { const ox=D.x, oy=D.y; D.x+=(B.x-D.x)*.2; D.y+=(B.y-D.y)*.2; D.h=0; D.v=Math.hypot(D.x-ox,D.y-oy); if(Math.abs(D.x-ox)>.002) D.dir=Math.sign(D.x-ox); }
  const AN=A.bossAnim&&A.bossAnim(B.sprite), ch=an.at&&NET.now()<an.at+260, F2=AN&&!stun?(ch?AN.atk:(D.v||0)>.004?AN.walk[Math.floor(clock*8)%AN.walk.length]:AN.idle[Math.floor(clock*1.6)%AN.idle.length]):fr;   /* boss mới: khung đứng / đi / ra đòn */
  const sp=cached('mb'+B.sprite+F2+!!fl,()=>A.muBossSprite(B.sprite,F2,!!fl)), x=D.x*T, y=D.y*T, warn=an.at?Math.max(0,Math.min(1,1-(an.at-NET.now())/((an.at-an.t)||1))):0, charging=an.at&&NET.now()<an.at, release=an.at&&NET.now()-an.at<260;
  const sq=hit&&now-hit.t<120?1-(now-hit.t)/120:0, lean=charging?-warn*.08:release?.06:0, sx=1+sq*.06+(charging?warn*.04:0), sy=1-sq*.05-(charging?warn*.03:0), au=B.form==='ssj'?['#ffd84a','#fff3b0']:AURA[B.id]||['#ffffff','#ffffff'];   /* Siêu Saiyan: hào quang vàng */
  if(bUntil(B,'chick')){ const s=A.chicken(Math.floor(clock*6)%4), k=BS[B.id].big?4:3; GAME.shadow(x,y,14); g.drawImage(s.c,Math.round(x-cam.x-s.ax*k),Math.round(y-cam.y-s.ay*k),s.c.width*k,s.c.height*k); return; }   /* Cây Bút của Redtype: boss hoá gà */
  if(bUntil(B,'cup')){ const cx=Math.round(x-cam.x), cy=Math.round(y-cam.y); GAME.shadow(x,y,16); g.save(); g.fillStyle='#1c1516'; g.beginPath(); g.moveTo(cx-15,cy-34); g.lineTo(cx+15,cy-34); g.lineTo(cx+11,cy); g.lineTo(cx-11,cy); g.closePath(); g.fill();   /* cốc mỳ ly: thân trắng, đai đỏ chữ vàng, nắp giấy, hơi nóng */
    g.fillStyle='#f4f2ec'; g.beginPath(); g.moveTo(cx-13,cy-33); g.lineTo(cx+13,cy-33); g.lineTo(cx+10,cy-1); g.lineTo(cx-10,cy-1); g.closePath(); g.fill(); g.fillStyle='#d8d4c8'; g.fillRect(cx+5,cy-32,5,31);
    g.fillStyle='#e8302a'; g.fillRect(cx-12,cy-24,24,9); g.fillStyle='#ffd84a'; g.fillRect(cx-7,cy-21,3,3); g.fillRect(cx-2,cy-21,3,3); g.fillRect(cx+3,cy-21,3,3); g.fillStyle='#c8a060'; g.fillRect(cx-16,cy-37,32,4); g.fillStyle='#1c1516'; g.fillRect(cx-16,cy-33,32,1);
    const sh=1+Math.sin(clock*30)*.8; g.translate(sh,0); g.globalAlpha=.5; g.fillStyle='#ffffff'; for(let i=0;i<3;i++){ const k=(clock*.9+i/3)%1; g.fillRect(cx-6+i*6+Math.round(Math.sin(k*9+i)*2),cy-40-k*16,2,4); } g.restore(); return; }   /* Nobita trốn trong cốc: không vẽ người */
  if(bUntil(B,'guard')){ g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=.35+.15*Math.sin(clock*6); g.strokeStyle='#7fd8ff'; g.lineWidth=2; g.beginPath(); g.ellipse(x-cam.x,y-cam.y-sp.ay*.5,sp.ax*.9,sp.ay*.62,0,0,7); g.stroke(); g.globalAlpha=.12; g.fillStyle='#7fd8ff'; g.fill(); g.restore(); }   /* hộ thể xanh: giáp + kháng phép */
  if(bUntil(B,'spin')){ const Rs=(B.spinR||3)*T; g.save(); g.globalAlpha=.16+.08*Math.sin(clock*20); g.fillStyle='#ff4a2a'; g.beginPath(); g.ellipse(x-cam.x,y-cam.y,Rs,Rs*.55,0,0,7); g.fill(); g.globalAlpha=1;
    for(let i=0;i<8;i++){ const a=clock*14+i*.785, bx=x-cam.x+Math.cos(a)*Rs*.85, by=y-cam.y-14+Math.sin(a)*Rs*.47; g.save(); g.translate(bx,by); g.rotate(a+1.57); g.fillStyle='#1c1516'; g.fillRect(-6,-2,12,4); g.fillStyle='#c8ccd8'; g.fillRect(-5,-1,10,2); g.fillStyle='#ff8a2a'; g.fillRect(4,-1,2,2); g.restore(); }
    g.restore(); if(Math.random()<.6) burst(x+rnd(-1,1)*(B.spinR||3)*T*.8,y-14+rnd(-6,6),2,{col:C_SPARK,kind:'spark',sp:[60,160],life:[.1,.2]}); }   /* cưa xoay vòng tròn quanh người */
  if(bUntil(B,'dive')){ g.save(); g.globalAlpha=.35; g.fillStyle='#0a2a4a'; g.beginPath(); g.ellipse(x-cam.x,y-cam.y,sp.ax*.8,sp.ax*.3,0,0,7); g.fill(); g.strokeStyle='#d8f0f8'; g.lineWidth=1.5;
    for(let i=0;i<3;i++){ const k=(clock*.8+i/3)%1, r=8+k*sp.ax; g.globalAlpha=(1-k)*.8; g.beginPath(); g.ellipse(x-cam.x,y-cam.y,r,r*.35,0,0,7); g.stroke(); } g.restore();
    if(Math.random()<.35) burst(x+rnd(-sp.ax,sp.ax)*.5,y,1,{col:['#d8f0f8','#ffffff'],kind:'dot',sp:[10,30],dir:-1.57,spread:.4,life:[.4,.8],size:[1.5,3],up:20}); return; }   /* lặn xuống nước: chỉ còn bóng tối dưới nước, gợn sóng, bọt */
  if(B.ghost){ g.save(); g.globalAlpha=.18+.1*Math.sin(clock*7); g.fillStyle='#8a4ad8'; g.beginPath(); g.arc(x-cam.x,y-cam.y,B.ghost*T,0,7); g.fill(); g.globalAlpha=.7; g.strokeStyle='#d0a0ff'; g.setLineDash([5,4]); g.lineDashOffset=-clock*25; g.beginPath(); g.arc(x-cam.x,y-cam.y,B.ghost*T,0,7); g.stroke(); g.restore(); }   /* vùng độc bóng ma 3 ô */
  const walking=(D.v||0)>.004&&!charging, jumpH=(D.h||0)+(walking?Math.abs(Math.sin(clock*9))*3:0)+(B.fly?12+Math.sin(clock*5)*2:0), tilt=walking?(D.dir||1)*.05:0;   /* đi bộ áp sát: nhún bước + nghiêng về trước */
  g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=.25+.25*(charging?warn:Math.abs(Math.sin(clock*2)))+(B.phase===3?.2:0); const gr=g.createRadialGradient(x-cam.x,y-cam.y-sp.ay*.45,0,x-cam.x,y-cam.y-sp.ay*.45,sp.ay*.7); gr.addColorStop(0,au[0]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x-cam.x,y-cam.y-sp.ay*.45,sp.ay*.7,0,7); g.fill(); g.restore();
  if(Math.random()<(B.phase===3?.3:.12)) burst(x+rnd(-sp.ax,sp.ax)*.7,y-rnd(0,sp.ay),1,{col:au,kind:B.id==='luffy'?'smoke':'dot',sp:[10,30],dir:-1.57,spread:.6,life:[.5,.9],size:B.id==='luffy'?[3,5]:[1.5,2.5],add:B.id!=='luffy',up:15});
  GAME.shadow(x,y,BS[B.id].big?28:20); g.save(); g.translate(Math.round(x-cam.x),Math.round(y-cam.y-jumpH)); g.rotate(lean+tilt); g.scale(sx,sy); const oc=tgCol('boss:'+B.id); if(oc){ g.globalAlpha=.75+.25*Math.sin(clock*8); g.drawImage(outline(sp.c,oc),-sp.ax-1,-sp.ay-1); g.globalAlpha=1; } g.drawImage(sp.c,-sp.ax,-sp.ay);
  if(B.ghost){ g.globalAlpha=.55+.15*Math.sin(clock*9); g.drawImage(tinted(sp.c,'#b070ff'),-sp.ax,-sp.ay); g.globalAlpha=1; }   /* đang hoá bóng ma: phủ tím trong suốt */
  if(B.tint){ g.globalAlpha=.88; g.drawImage(tinted(sp.c,B.tint),-sp.ax,-sp.ay); g.globalAlpha=1; if(B.tint==='#120c16'){ g.fillStyle='#ffffff'; for(const dx of [-3,2]) g.fillRect(dx,Math.round(-sp.ay*.76),2,1); } }   /* Hung Thủ Áo Đen: chỉ còn 2 mắt trắng */
  if(B.fly){ g.fillStyle='#f2c43a'; g.fillRect(-1,-sp.ay-4,2,4); const bl=2+Math.abs(Math.cos(clock*38))*9; g.fillRect(Math.round(-bl),-sp.ay-5,Math.round(bl*2),2); }   /* chong chóng tre */
  g.restore(); if(bUntil(B,'stun')) stunStars(g,x-cam.x,y-cam.y-sp.ay-jumpH-6,clock); }
// boss đang bị choáng / đang lặn: server gửi số ms còn lại lúc ts, client tự hết giờ (không cần đợi gói mới)
const bUntil=(B,k)=>B[k]>0&&NET.now()<(B.ts||0)+B[k];
// choáng: 3 ngôi sao vàng xoay vòng elip trên đầu
function stunStars(g,cx,cy,clock){ g.save(); for(let i=0;i<3;i++){ const a=clock*5+i*2.094, x=Math.round(cx+Math.cos(a)*10), y=Math.round(cy+Math.sin(a)*3); g.fillStyle='#1c1516'; g.fillRect(x-2,y-1,5,3); g.fillRect(x-1,y-2,3,5); g.fillStyle=Math.sin(a)>0?'#ffe066':'#c8a020'; g.fillRect(x-1,y,3,1); g.fillRect(x,y-1,1,3); } g.restore(); }
// cảnh báo vùng đánh: nền đỏ nhấp nháy + phần tô sáng lan dần tới lúc nổ, 0,25 giây cuối chớp trắng. Vẽ đúng hình server tính trúng
// (tròn thật, không dẹt): tròn / nhảy / đuổi theo (vàng cam khi còn bám theo, đỏ khi đã khoá), tia thẳng, chữ thập, vành khuyên (vòng xanh = chỗ an toàn sát boss), nón
const SPAN={}, TD={};   // tổng thời gian cảnh báo của từng vùng (lúc mới thấy) · vị trí hiển thị vùng đuổi theo (trượt mượt giữa các gói 0,2 giây)
function drawTele(g,B,now,cam,clock){ const tn=NET.now(); if(Object.keys(SPAN).length>300){ for(const k in SPAN) delete SPAN[k]; for(const k in TD) delete TD[k]; }
  for(const z of B.tele||[]){ const left=(z.at-tn)/1000; if(left<-.25&&z.kind!=='cone') continue; const span=SPAN[z.id]||(SPAN[z.id]=Math.max(.35,left)), warn=Math.max(0,Math.min(1,1-left/span)), last=left<.25&&left>-.25;
    const blink=.14+.2*Math.abs(Math.sin(clock*(last?24:9))), edge=last?'#ffffff':'#ff2a4a', core=z.kind==='ring'||z.kind==='donut'?'#ff8a2a':'#ff4a3a';
    let zx=z.x, zy=z.y; if(z.kind==='chase'){ const d=TD[z.id]||(TD[z.id]={x:z.x,y:z.y}); d.x+=(z.x-d.x)*.22; d.y+=(z.y-d.y)*.22; zx=d.x; zy=d.y; }
    const X0=zx*T-cam.x, Y0=zy*T-cam.y; g.save();
    if(z.kind==='line'){ const W=z.w*T, L=z.range*T, lz=z.k==='laser'; g.translate(X0,Y0); g.rotate(z.ang);
      g.globalAlpha=blink; g.fillStyle=lz?'#ff4ab8':'#ff2a4a'; g.fillRect(-T,-W,L+T,W*2); g.globalAlpha=.3+.35*warn; g.fillStyle=lz?'#ff9ad0':core; g.fillRect(-T,-W,(L+T)*warn,W*2);
      g.globalAlpha=.9; g.strokeStyle=edge; g.lineWidth=last?2:1; g.strokeRect(-T,-W,L+T,W*2); g.globalAlpha=.7; g.fillStyle='#ffd84a'; for(let i=1;i<=3;i++){ const x=((clock*90+i*L/3)%L); g.beginPath(); g.moveTo(x,-W*.5); g.lineTo(x+6,0); g.lineTo(x,W*.5); g.fill(); } }   /* mũi tên chạy dọc tia */
    else if(z.kind==='cone'){ const R=z.range*T; g.globalAlpha=blink; g.fillStyle='#ff2a4a'; g.beginPath(); g.moveTo(X0,Y0); g.arc(X0,Y0,R,z.ang-z.cone,z.ang+z.cone); g.closePath(); g.fill();
      g.globalAlpha=.3+.35*warn; g.fillStyle=core; g.beginPath(); g.moveTo(X0,Y0); g.arc(X0,Y0,R*warn,z.ang-z.cone,z.ang+z.cone); g.closePath(); g.fill(); g.globalAlpha=.9; g.strokeStyle=edge; g.lineWidth=1; g.beginPath(); g.moveTo(X0,Y0); g.arc(X0,Y0,R,z.ang-z.cone,z.ang+z.cone); g.closePath(); g.stroke(); }
    else if(z.kind==='donut'){ const R=z.r*T, R0=z.r0*T, Rw=R0+(R-R0)*warn; g.globalAlpha=blink; g.fillStyle='#ff6a2a'; g.beginPath(); g.arc(X0,Y0,R,0,7); g.arc(X0,Y0,R0,0,7,true); g.fill();
      g.globalAlpha=.3+.35*warn; g.fillStyle=core; g.beginPath(); g.arc(X0,Y0,Rw,0,7); g.arc(X0,Y0,R0,0,7,true); g.fill(); g.globalAlpha=.9; g.strokeStyle=edge; g.lineWidth=last?2:1; g.beginPath(); g.arc(X0,Y0,R,0,7); g.stroke();
      g.globalAlpha=.85; g.strokeStyle='#6ae88a'; g.setLineDash([4,3]); g.lineDashOffset=-clock*20; g.lineWidth=1.5; g.beginPath(); g.arc(X0,Y0,R0,0,7); g.stroke(); g.setLineDash([]); }
    else if(z.kind==='nuke'){ g.restore(); g.save(); const ax=z.x0*T-cam.x, ay=z.y0*T-cam.y, aw=(z.x1-z.x0)*T, ah=(z.y1-z.y0)*T, sx=z.sx*T-cam.x, sy=z.sy*T-cam.y, sr=z.sr*T;
      const hole=()=>{ g.beginPath(); g.rect(ax,ay,aw,ah); g.arc(sx,sy,sr,0,7,true); };   /* cả khu trừ vòng an toàn (tô evenodd, không xoá nền) */
      g.globalAlpha=.18+.22*Math.abs(Math.sin(clock*(last?20:6))); g.fillStyle='#ff2a1a'; hole(); g.fill('evenodd'); g.globalAlpha=.25*warn; g.fillStyle='#fff3b0'; hole(); g.fill('evenodd');
      g.globalAlpha=.9; g.strokeStyle='#6ae88a'; g.lineWidth=2.5; g.setLineDash([6,4]); g.lineDashOffset=-clock*30; g.beginPath(); g.arc(sx,sy,sr,0,7); g.stroke(); g.setLineDash([]);
      g.font='14px VT323, monospace'; g.textAlign='center'; g.fillStyle='#1c1516'; g.fillText('NẤP Ở ĐÂY',sx+1,sy-sr-5); g.fillStyle='#bfffc8'; g.fillText('NẤP Ở ĐÂY',sx,sy-sr-6);
      g.font='28px VT323, monospace'; const cd='☢ '+Math.max(0,left).toFixed(1); g.fillStyle='#1c1516'; g.fillText(cd,ax+aw/2+2,ay+30); g.fillStyle='#ffe066'; g.fillText(cd,ax+aw/2,ay+28); }   /* bom hạt nhân */
    else if(z.kind==='flood'){ const R=z.r*T*Math.max(.08,warn); g.globalAlpha=.22+.25*warn; g.fillStyle='#4ad86a'; g.beginPath(); g.arc(X0,Y0,R,0,7); g.fill(); g.globalAlpha=.6; g.strokeStyle='#bfffc8'; g.lineWidth=1;
      for(let i=1;i<=3;i++){ g.beginPath(); g.arc(X0,Y0,R*i/3.2,0,7); g.stroke(); } g.globalAlpha=.9; g.strokeStyle=edge; g.setLineDash([6,4]); g.lineDashOffset=-clock*20; g.beginPath(); g.arc(X0,Y0,z.r*T,0,7); g.stroke(); g.setLineDash([]); }   /* nước độc loang ra từ người boss */
    else { const R=z.r*T, locked=z.kind!=='chase'||tn>=z.lock; g.globalAlpha=blink; g.fillStyle=locked?(z.kind==='ring'?'#ff6a2a':'#ff2a4a'):'#ff9a2a'; g.beginPath(); g.arc(X0,Y0,R,0,7); g.fill();
      g.globalAlpha=.3+.35*warn; g.fillStyle=core; g.beginPath(); g.arc(X0,Y0,R*warn,0,7); g.fill(); g.globalAlpha=.9; g.strokeStyle=locked?edge:'#ffd84a'; g.lineWidth=last?2:1;
      if(!locked){ g.setLineDash([5,3]); g.lineDashOffset=-clock*30; } g.beginPath(); g.arc(X0,Y0,R,0,7); g.stroke(); g.setLineDash([]);
      if(z.kind==='single'||z.kind==='chase'){ g.save(); g.translate(X0,Y0); g.rotate(locked?0:clock*3); g.beginPath(); for(let i=0;i<4;i++){ g.rotate(1.5708); g.moveTo(R*.35,0); g.lineTo(R*.75,0); } g.stroke(); g.restore(); }   /* tâm ngắm: còn xoay = còn đuổi theo */
      if(z.kind==='grab'){ g.globalAlpha=.35+.45*warn; g.fillStyle='#2a1014'; for(let i=0;i<5;i++){ g.save(); g.translate(X0,Y0); g.rotate((-1.2+i*.6)*(1-warn*.7)); g.fillRect(-1.5,-R*(1.6-warn*.7),3,R*.9); g.restore(); } }   /* bàn tay Titan khép lại */
      if(z.k==='muavithu'){ const hY=(1-warn)*110, Rb=6+warn*3; g.globalAlpha=1; g.fillStyle='#120818'; g.beginPath(); g.arc(X0,Y0-hY-8,Rb+1,0,7); g.fill(); g.fillStyle='#4a1a6a'; g.beginPath(); g.arc(X0,Y0-hY-8,Rb,0,7); g.fill(); g.fillStyle='#c870ff'; g.fillRect(X0-2,Y0-hY-11,3,2); }   /* bom vĩ thú tím đen rơi xuống */
      if(z.k==='muabanhran'){ const hY=(1-warn)*90; g.globalAlpha=1; g.fillStyle='#1c1516'; g.beginPath(); g.ellipse(X0,Y0-hY-6,9,5.5,0,0,7); g.fill(); g.fillStyle='#c8803a'; g.beginPath(); g.ellipse(X0,Y0-hY-6,8,4.5,0,0,7); g.fill(); g.fillStyle='#7a4a22'; g.fillRect(X0-8,Y0-hY-6,16,1.5); g.fillStyle='#e8a860'; g.fillRect(X0-4,Y0-hY-9,5,1); }   /* bánh rán rơi xuống */
      if(z.kind==='jump'){ g.globalAlpha=.35+.3*warn; g.fillStyle='#120c16'; g.beginPath(); g.ellipse(X0,Y0,R*.5*(.4+warn*.6),R*.3*(.4+warn*.6),0,0,7); g.fill(); } }   /* bóng boss rơi xuống to dần */
    g.restore(); } }
/* ======================= HUD ======================= */
/* icon chiêu 32×32 vẽ thẳng ở độ phân giải gốc: viền kim loại vát, nền tối toả sáng theo hệ, hình chiêu có bóng + điểm sáng */
const SKH={chem:['#2a0a18','#ff5a4a'],xoay:['#2a0814','#ff7a4a'],gong:['#2a1a06','#ffd84a'],dam:['#06202a','#7fe8ff'],tamlien:['#0a1430','#fff3b0'],hoi:['#062a14','#6ae88a'],
  hoachuong:['#2a0a10','#ffa030'],loichuong:['#1a0a2a','#d8a0ff'],thienthach:['#1a0a1e','#ff8a3a'],hoaquyen:['#2a0606','#ff6a2a'],kybanghao:['#061a38','#7fd8ff'],loithan:['#140a26','#ffe066'],
  gomupistol:['#2a1408','#f0b070'],hoden:['#0a0614','#b070ff'],chualanh:['#06261a','#8affb0'],dapchoang:['#1a1408','#ffd84a'],batgiap:['#0c1420','#c8d8ff'],hoimau:['#062a14','#6ae88a'],phunlua:['#2a0a06','#ff8a3a']};
function skDraw(k){ if(k.startsWith('lgs_')) return lgsIcon(k); const c=A.cv(32,32), g=c.getContext('2d'), [b0,b1]=SKH[k]||['#1a1420','#ffffff'];
  const R=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(x|0,y|0,w,h); }, D=(cx,cy,r,col)=>{ g.fillStyle=col; for(let y=-r;y<=r;y++){ const s=Math.floor(Math.sqrt(r*r-y*y+r*.6)); g.fillRect((cx-s)|0,(cy+y)|0,2*s+1,1); } };
  const L=(x0,y0,x1,y1,col,w=1)=>{ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1; for(let i=0;i<=n;i++) R(Math.round(x0+(x1-x0)*i/n-(w-1)/2),Math.round(y0+(y1-y0)*i/n-(w-1)/2),w,w,col); };
  const glow=(cx,cy,r,col,a)=>{ const gr=g.createRadialGradient(cx,cy,0,cx,cy,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalAlpha=a; g.fillStyle=gr; g.fillRect(0,0,32,32); g.globalAlpha=1; };
  // nền + viền vát
  R(0,0,32,32,'#0c0810'); R(1,1,30,30,'#dfe3ec'); R(2,2,29,29,'#5c6070'); R(2,2,28,28,b0); glow(16,16,18,b1,.28);
  const arc=(cx,cy,r,a0,a1,cols,w=2)=>{ for(let i=0;i<cols.length;i++){ g.strokeStyle=cols[i]; g.lineWidth=w; g.beginPath(); g.arc(cx,cy,r-i*2,a0,a1); g.stroke(); } };
  const blade=(x0,y0,x1,y1)=>{ L(x0+1,y0+1,x1+1,y1+1,'#3a3e4a',3); L(x0,y0,x1,y1,'#c8ccd8',3); L(x0,y0-1,x1,y1-1,'#ffffff',1); };
  const bolt=(pts,c1,c2)=>{ for(let i=0;i<pts.length-1;i++){ L(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],c1,3); } for(let i=0;i<pts.length-1;i++) L(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],c2,1); };
  const flame=(cx,cy,s)=>{ for(const [dx,h,w] of [[-5,10,4],[0,15,5],[5,11,4],[-2,8,3],[3,7,3]]) for(let i=0;i<h*s;i++){ const ww=Math.max(1,Math.round(w*s*(1-i/(h*s)))); R(cx+dx*s-ww/2+Math.sin(i*.7+dx)*1.2,cy-i,ww,1,i<h*s*.3?'#fff3b0':i<h*s*.6?'#ffb030':'#e8402a'); } };
  switch(k){
  case 'chem': arc(9,23,16,-1.45,.05,['#ff5a4a','#b81a2a'],2); blade(7,25,24,8); R(5,24,6,3,'#c8a23a'); R(5,26,2,3,'#8a5a32'); R(24,7,2,2,'#ffffff'); break;
  case 'xoay': for(let i=0;i<3;i++){ const a=i*2.094; arc(16,16,11,a,a+1.6,['#ffffff','#ff7a4a','#b81a2a'],2); } D(16,16,3,'#fff3b0'); R(15,15,2,2,'#ffffff'); break;
  case 'gong': D(16,15,10,'#8a6a1a'); D(16,14,9,'#ffd84a'); D(16,15,6,'#e8302a'); D(16,15,3,'#ffd84a'); R(15,6,2,18,'#fff3b0'); R(7,14,18,2,'#c8901a'); L(9,24,16,28,'#c8901a',2); L(23,24,16,28,'#c8901a',2); break;
  case 'dam': for(const [x0,y0,x1,y1] of [[6,26,22,8],[26,26,10,8]]){ L(x0+1,y0+1,x1+1,y1+1,'#0a3a4a',3); L(x0,y0,x1,y1,'#7fe8ff',3); L(x0,y0-1,x1,y1-1,'#ffffff',1); } R(4,24,5,3,'#c8a23a'); R(23,24,5,3,'#c8a23a'); glow(16,14,7,'#ffffff',.5); break;
  case 'tamlien': for(const [y,dx] of [[9,0],[16,2],[23,-1]]){ L(5+dx,y+4,27+dx,y-3,'#c8901a',3); L(5+dx,y+4,27+dx,y-3,'#fff3b0',1); } glow(16,16,8,'#ffffff',.35); break;
  case 'hoi': R(12,6,8,20,'#2a8a3a'); R(6,12,20,8,'#2a8a3a'); R(13,7,6,18,'#6ae88a'); R(7,13,18,6,'#6ae88a'); R(14,8,2,16,'#c8ffd0'); R(8,14,16,2,'#c8ffd0'); for(const [x,y] of [[6,6],[25,8],[24,25],[7,24]]){ R(x,y-1,1,3,'#ffffff'); R(x-1,y,3,1,'#ffffff'); } break;
  case 'hoachuong': flame(16,27,1.2); R(9,22,14,6,'#f0b070'); R(9,22,14,1,'#ffd8a8'); for(const x of [10,13,16,19]) R(x,19,2,4,'#f0b070'); glow(16,14,10,'#ffe080',.5); break;
  case 'loichuong': R(6,15,13,10,'#f0b070'); R(6,15,13,2,'#ffd8a8'); for(const x of [7,10,13,16]) R(x,13,2,3,'#f0b070'); bolt([[21,3],[16,11],[22,12],[15,22],[24,14],[19,13],[26,4]],'#8a4ad8','#ffffff'); glow(20,12,9,'#d8a0ff',.5); break;
  case 'thienthach': for(let i=0;i<4;i++) L(4+i*3,3,17+i*2,16,['#ff3a2a','#ff8a3a','#ffd84a','#fff3b0'][i],2); D(20,20,7,'#5a2a1a'); D(19,19,6,'#c8401a'); D(18,18,4,'#ff8a3a'); D(17,17,2,'#fff3b0'); glow(18,18,10,'#ff8a3a',.45); break;
  case 'hoaquyen': flame(16,29,1.3); D(16,16,7,'#c8844a'); R(10,12,12,9,'#f0b070'); for(const x of [10,13,16,19]) R(x,10,3,3,'#f0b070'); R(10,12,12,1,'#ffd8a8'); glow(16,16,12,'#ff6a2a',.4); break;
  case 'kybanghao': for(const [x,h,w] of [[6,14,3],[10,20,4],[15,24,5],[20,18,4],[25,12,3]]) for(let i=0;i<h;i++){ const ww=Math.max(1,Math.round(w*(1-i/h))); R(x-ww/2,28-i,ww,1,i>h*.7?'#ffffff':i>h*.35?'#7fd8ff':'#2a6ad8'); } glow(16,18,11,'#bff0ff',.4); break;
  case 'loithan': D(10,8,5,'#4a4a6a'); D(18,7,6,'#5a5a7a'); D(24,9,4,'#4a4a6a'); R(5,9,24,3,'#3a3a5a'); bolt([[16,11],[12,18],[17,18],[11,28],[21,16],[16,16],[19,11]],'#c8901a','#fff6a8'); glow(15,19,9,'#ffe066',.5); break;
  case 'gomupistol': L(3,19,20,15,'#c8844a',6); L(3,18,20,14,'#f0b070',4); D(23,14,6,'#c8844a'); D(23,13,5,'#f0b070'); R(20,11,6,1,'#ffd8a8'); for(const y of [9,13,17]) L(27,y,30,y,'#ffffff',1); break;
  case 'hoden': D(16,16,11,'#3a1a6a'); D(16,16,9,'#7a3ad8'); D(16,16,7,'#1a0a2a'); D(16,16,4,'#050208'); arc(16,16,12,0,4.4,['#d8a0ff'],1); R(22,8,2,2,'#ffffff'); R(8,22,1,1,'#ffffff'); break;
  case 'dapchoang': L(7,27,19,13,'#3a2214',4); L(7,26,19,12,'#8a5a32',2); R(15,4,14,10,'#1c1516'); R(16,5,12,8,'#8a90a0'); R(16,5,12,2,'#e8ecf4'); R(16,8,12,2,'#ffd84a'); R(28,8,2,2,'#c8ccd8'); for(const [x,y] of [[5,9],[10,4],[4,17]]){ R(x,y-1,1,3,'#ffe066'); R(x-1,y,3,1,'#ffe066'); } glow(20,10,9,'#fff3b0',.4); break;
  case 'batgiap': D(16,16,11,'#3a3e4a'); D(16,15,10,'#c8ccd8'); D(16,15,7,'#7a8090'); R(15,6,2,19,'#ffd84a'); R(8,14,16,2,'#ffd84a'); for(const [x0,y0,x1,y1] of [[2,15,5,15],[27,15,30,15],[16,1,16,3],[16,28,16,30],[5,5,7,7],[27,5,25,7]]) L(x0,y0,x1,y1,'#ffffff',1); glow(16,15,10,'#ffffff',.3); break;
  case 'hoimau': D(11,12,6,'#2a8a3a'); D(21,12,6,'#2a8a3a'); for(let y=0;y<11;y++) R(5+y,14+y,22-2*y,1,'#2a8a3a'); D(11,12,5,'#6ae88a'); D(21,12,5,'#6ae88a'); for(let y=0;y<10;y++) R(6+y,14+y,20-2*y,1,'#6ae88a'); R(8,9,3,2,'#c8ffd0'); R(15,12,2,8,'#ffffff'); R(12,15,8,2,'#ffffff'); break;
  case 'phunlua': flame(20,28,1.25); R(3,12,10,8,'#f2e8d8'); R(3,12,10,2,'#ffffff'); R(11,13,3,6,'#f0b070'); glow(18,16,12,'#ff8a3a',.5); for(const [x,y] of [[24,6],[28,12],[26,20]]) R(x,y,2,2,'#fff3b0'); break;
  case 'chualanh': for(let i=0;i<6;i++){ const a=i/6*6.283; D(16+Math.cos(a)*7,16+Math.sin(a)*7,4,'#3aa85a'); D(16+Math.cos(a)*7,16+Math.sin(a)*7,2,'#8affb0'); } D(16,16,4,'#ffe066'); D(16,16,2,'#ffffff'); break;
  }
  R(2,29,28,1,'rgba(0,0,0,.35)'); return c; }
// icon chiêu set legacy: chân dung nhân vật mặc set trên nền vàng tím, viền kim loại
function lgsIcon(k){ const set=Object.keys(M.legacy).find(s=>M.legacy[s].skill.k===k), c=A.cv(32,32), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  g.fillStyle='#0c0810'; g.fillRect(0,0,32,32); g.fillStyle='#ffe9a0'; g.fillRect(1,1,30,30); g.fillStyle='#8a5a1a'; g.fillRect(2,2,29,29); g.fillStyle='#2a0a3a'; g.fillRect(2,2,28,28);
  const gr=g.createRadialGradient(16,14,0,16,14,18); gr.addColorStop(0,'rgba(255,216,74,.65)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(2,2,28,28);
  if(set){ const look=GAME.G.look, av=AVATAR.build({...look,outfit:{...look.outfit,top:set}}), fr=av.anims.idle_down.frames[0]; g.save(); g.beginPath(); g.rect(2,2,28,28); g.clip(); g.drawImage(fr,4,8,24,28,4,3,24,28); g.restore(); }
  return c; }
const skIcon=k=>cached('ski'+k+(k.startsWith('lgs_')?JSON.stringify(GAME.G.look.outfit):''),()=>skDraw(k).toDataURL());
function ensureHud(){ let h=$('#muHud'); if(h) return h; h=document.createElement('div'); h.id='muHud'; h.className='panel'; h.innerHTML='<div id="muMe"></div><div id="muSk"></div>';
  const box=$('#chatBox'), bb=document.createElement('div'); bb.id='muBoss'; bb.className='panel'; if(box){ box.prepend(h); box.prepend(bb); } else { document.body.appendChild(bb); document.body.appendChild(h); }   /* thanh boss nằm trên khung MU, trên ô chat */
  bb.addEventListener('click',e=>{ if(e.target.closest('[data-mubtg]')){ e.preventDefault(); BOSSHIDE=pref('muBossHide',!BOSSHIDE); hud(); } });
  h.addEventListener('click',e=>{ if(e.target.closest('[data-musubtg]')){ e.preventDefault(); SUBHIDE=pref('muSubHide',!SUBHIDE); hud(); return; } if(e.target.closest('[data-mupas]')){ e.preventDefault(); openPas(); return; } const b=e.target.closest('[data-musk]'); if(b){ e.preventDefault(); skill(+b.dataset.musk); } }); return h; }
const fmtLeft=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
// chỉ số phụ trên bảng nhân vật MU (chỉ hiện chỉ số > 0): giáp, chí mạng, hút máu, trừ giáp, sát thương chuẩn, giảm hồi chiêu, sức mạnh phép, làm chậm, giật sét, hào quang
// luôn hiện đủ (kể cả 0%) để biết mình đang có hiệu ứng gì: tốc đánh, hồi máu mỗi giây, giảm hồi chiêu, giáp + các hiệu ứng khi đánh trúng
const SUB=[['regen','💗','Hồi máu',v=>`${(v*100).toFixed(1)}%/s`],['cdr','⏱','Giảm hồi chiêu'],['armor','🛡','Giáp'],['crit','💥','Chí mạng'],['drain','🩸','Hút máu'],['shred','🔨','Trừ giáp'],
  ['tdmg','☠','Độc'],['slowp','❄','Làm chậm',v=>`${Math.round(v*100)}% (2s)`],['chainp','⚡','Giật sét',v=>`${Math.round(v*100)}%`],['spell','✨','Sức mạnh phép'],['aura','💚','Hào quang hút máu'],['gw','🩹','Giảm hồi máu']];
// nút thu gọn bảng chỉ số / danh sách boss, nhớ theo trình duyệt
const pref=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k)==='1'; localStorage.setItem(k,v?'1':'0'); }catch(e){ /* trình duyệt chặn lưu: bỏ qua */ } return !!v; };
let SUBHIDE=pref('muSubHide'), BOSSHIDE=pref('muBossHide');
const subHtml=()=>{ const s=ME&&ME.sub; if(!s) return ''; return `<button type="button" class="mutg" data-musubtg>${SUBHIDE?'▸ Xem chỉ số':'▾ Thu gọn chỉ số'}</button>`+(SUBHIDE?'':`<div class="musub">${SUB.map(([k,ic,nm,f])=>{ const v=s[k]||0; return `<span class="${v>.0005?'':'z'}" title="${esc(M.statVI[k]||nm)}">${ic} ${nm} <b>${f?f(v):Math.round(v*100)+'%'}</b></span>`; }).join('')}</div>`); };
function hud(){ const h=ensureHud(), b=$('#muBoss'), on=here(); h.hidden=!on; b.hidden=!on; document.body.classList.toggle('inmu',on); if(!on) return; const me=$('#muMe'), sk=$('#muSk');
  const sc=GAME.S.kind, cdl=Object.keys(BS).filter(id=>(BS[id].scene||'mu')===sc&&!BOSSES.some(x=>x.id===id)&&NEXT[id]).sort((a,c)=>NEXT[a]-NEXT[c]);   /* boss đang hồi: đếm ngược tới lúc ra lại */
  const cdh=cdl.length?`<small class="mucdl" id="muCdl">${cdl.map(id=>`${id==='luffy'?'👑':'⏳'} ${esc(BS[id].name.split(' ')[0])} <b data-id="${id}">${fmtLeft(NEXT[id]-NET.now())}</b>`).join(' · ')}</small>`:'';
  const btg=`<button type="button" class="mutg" data-mubtg>${BOSSHIDE?`▸ Boss (${BH().length} đang ra)`:'▾ Ẩn danh sách boss'}</button>`;
  if(BOSSHIDE) b.innerHTML=btg;
  else if(BH().length) b.innerHTML=btg+cdh+BH().map(x=>`<div class="mub"><b>${x.id==='luffy'?'👑':'⚔'} ${esc(x.name)}${x.phase>1?` <em>${x.phase===3?'🔥 nổi giận':'GĐ 2'}</em>`:''}</b><span class="mubar boss"><i style="width:${Math.max(0,100*x.hp/x.max)}%"></i></span><small>${Math.max(0,Math.round(x.hp))}</small></div>`).join('');
  else b.innerHTML=cdh?btg+cdh:'';
  b.hidden=!b.innerHTML;
  if(!ME||!ME.cls){ me.innerHTML='<small>Gặp <b>Vệ binh</b> ở cổng thành để chọn class, nhận free giáp + vũ khí</small>'; sk.innerHTML=''; return; }
  const c=M.cls[ME.cls]; me.innerHTML=`<b style="color:${c.col}">${esc(c.name)}</b> <small>Lv${ME.lv} · ⚔ Lực chiến <b>${ME.cp||0}</b> · ⚡ Tốc đánh <b>${ME.aspd||1}</b>/s · EXP ${ME.exp}/${ME.next}${ME.fruit?` · 🍇 ${esc(F[ME.fruit].name.split(' (')[0])}`:''}${ME.wep?` · 🗡 ${esc(M.weapons[ME.wep].name)}`:''}${ME.duel?' · ⚔ đang thách đấu':''}${ME.buff?' · 🛡 gồng giáp':''}</small>${subHtml()}
    <span class="mubar hp"><i style="width:${100*ME.hp/ME.max}%"></i><em>${ME.hp}/${ME.max}</em></span><span class="mubar mp"><i style="width:${100*ME.mp/ME.mmax}%"></i><em>${ME.mp}/${ME.mmax}</em></span>${ME.dead?'<small class="bad">💀 Đang gục, chờ hồi sinh...</small>':''}`;
  sk.innerHTML=skillsOf().map((s,i)=>s?`<button class="musk${i===3?' fruit':i===4?' lgsk':''}" type="button" data-musk="${i}" title="${esc(s.name)} · ${s.mp} MP · hồi ${s.cd}s"><img src="${skIcon(s.k)}" width="32" height="32" alt=""><b>${i+1}</b><small>${s.mp}</small><i class="mucd" data-k="${s.k}"></i><span>${esc(s.name)}</span></button>`:'').join('')
    +`<button class="musk pas${ME.sp?' has':''}" type="button" data-mupas="1" title="Nội tại: cộng điểm tăng chỉ số"><span class="pasi">⭐</span><b>${ME.sp||0}</b><span>Nội tại</span></button>`; }
function hudTick(){ const h=$('#muHud'); if(!h) return; if(h.hidden!==!here()) hud(); if(!here()) return; for(const el of document.querySelectorAll('#muCdl b[data-id]')) el.textContent=fmtLeft((NEXT[el.dataset.id]||0)-NET.now());
  if(ME&&ME.cd){ const el=(performance.now()-MET); for(const i of document.querySelectorAll('.mucd')){ const k=i.dataset.k, s=skillsOf().find(x=>x&&x.k===k), left=Math.max(0,(ME.cd[k]||0)-el); i.style.height=s&&left>0?Math.min(100,100*left/(s.cd*1000))+'%':'0'; } } }
/* ======================= NPC: Vệ binh, Pháp sư Cát ======================= */
const clsImg=k=>setImg(M.cls[k].set), setImg=set=>{ const key='set'+set+JSON.stringify(G().look); if(CACHE[key]) return CACHE[key]; const look=G().look, av=AVATAR.build({...look,outfit:{...look.outfit,top:set}}), fr=av.anims.idle_down.frames[0], c=document.createElement('canvas'); c.width=64; c.height=90; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(fr,0,2,32,45,0,0,64,90); return CACHE[key]=c.toDataURL(); };
UI.defPlace('muguard',()=>UI.open('Vệ binh Lục Địa Cát',()=>{ const cur=ME&&ME.cls, it=G().items||{}, fr=Object.keys(F).filter(k=>it['taq_'+k]), ws=Object.keys(M.weapons).filter(k=>it[k]), qs=['mu_cuontruc','mu_banhmut','mu_lua_ma','mu_vayrong'].filter(k=>(G().quests||{})[k]);
  return `<p>"Chào chiến binh! Ở Lục Địa Cát ai cũng được tặng free 1 bộ giáp và vũ khí theo class. ${cur?'Đổi class tốn 300.000đ':'Chọn đi, lần đầu miễn phí'}!"</p>
  <div class="mucls">${Object.entries(M.cls).map(([k,c])=>`<div class="mucl" style="--cc:${c.col}"><img src="${clsImg(k)}" width="64" height="90" alt=""><b>${esc(c.name)}</b><small>${esc(c.en)}</small><p>${esc(c.desc)}</p>
    <small class="muted">Máu ${c.hp} · Mana ${c.mp} · Công ${c.atk} · Thủ ${c.def}</small><ul>${M.skills[k].map((s,i)=>`<li><b class="mukey">${i+1}</b> ${esc(s.name)}${s.mul?` · ×${s.mul}, tầm ${s.range} ô`:s.heal?` · hồi ${Math.round(s.heal*100)}%${s.team?' cả đội':''}`:''}${s.buff==='giap'?' · thủ ×2, giáp +20%, phản '+Math.round(s.reflect*100)+'% đòn':s.buff?' · giáp ×2':''}${s.stun?` · choáng ${s.stun}s`:''}${s.weak?` · giảm hồi máu ${Math.round(s.gw*100)}%, quái yếu đi ${Math.round(s.weak*100)}%`:''}</li>`).join('')}</ul>
    ${cur===k?'<small class="good">✔ Class hiện tại</small>':btn('mucls',cur?'Đổi sang (300.000đ)':'Chọn class này',{k},'pri')}</div>`).join('')}</div>
  <h5>🍇 Trái Ác Quỷ ${ME&&ME.fruit?`· đã ăn: ${esc(F[ME.fruit].name)}`:''}</h5>${fr.length?`<div class="list">${fr.map(k=>`<div class="row">${UI.ico('fruit_'+k)}<span><b>${esc(F[k].name)}</b><br><small class="muted">Phím 4: ${esc(F[k].skill.name)} · ${esc(F[k].desc)}</small></span>${ME&&ME.fruit?'':btn('mueat','Ăn',{k},'pri')}</div>`).join('')}</div>`:`<p class="muted">Hạ boss tổng Luffy Gear 5 có cơ hội rơi Trái Ác Quỷ (1/10 số người góp sức). Ăn vào được chiêu thứ 4 + chỉ số. Mỗi người chỉ ăn được 1 trái.</p>`}
  <h5>🗡 Vũ khí</h5>${ws.length?`<div class="list">${ws.map(k=>`<div class="row">${UI.ico(SD.ITEMS[k].icon)}<span><b>${esc(M.weapons[k].name)}</b><br><small class="muted">${esc(M.weapons[k].desc)}</small></span>${ME&&ME.wep===k?'<small class="good">Đang cầm</small>':btn('muwep','Cầm',{k})}</div>`).join('')}</div>`:'<p class="muted">Boss phụ (Naruto, Quỷ Cưa, Dươngg Vũ, Rồng Dải Xanh) có tỉ lệ rơi vũ khí và trang phục riêng.</p>'}
  <p class="muted">🛍 Set legacy (thêm chiêu phím 5) bán ở <b>Thương nhân Huyền Thoại</b> (quầy Premium bên trái quảng trường) · cánh, dây chuyền, vật hộ thân, aura ở <b>Thợ Kim Hoàn</b> (bên phải) · 50 vũ khí ở <b>Thợ Rèn Huyền Thoại</b> (bên trái) · cường hoá ngựa thành thần thú ở <b>Người Thuần Thú</b> (góc dưới phải) · bấm ⭐ cạnh ô chiêu để cộng điểm nội tại.</p>
  ${qs.length?`<h5>🔍 Nhiệm vụ ẩn</h5>${qs.map(UI.qRow).join('')}`:''}
  <p class="muted">Boss tổng Luffy Gear 5 ở đền phía Bắc, hạ xong 20 phút sau mới ra lại (boss phụ 10–18 phút); boss phụ ở rừng Làng Lá, Đầm Rồng, nghĩa địa, bãi phế liệu phía Đông. Đòn boss đều có vòng cảnh báo đỏ: chạy ra khỏi vòng trước khi vòng vàng thu hết là né được!</p>`; },{wide:true,static:true}));
UI.onAct('mucls',async d=>{ const r=await GAME.act({t:'mu',op:'class',cls:d.k}); if(r&&!r.err){ UI.closeAll(); GAME.sfx('level_up',.7); GAME.bigText(M.cls[d.k].name.toUpperCase()); toast(esc(r.msg),'item'); } });
UI.onAct('mueat',async d=>{ const r=await GAME.act({t:'mu',op:'eat',k:d.k}); if(r&&!r.err){ UI.closeAll(); toast(esc(r.msg),'item'); } });
UI.onAct('muwep',async d=>{ const r=await GAME.act({t:'mu',op:'wep',k:d.k}); if(r&&!r.err){ GAME.sfx('item_pickup',.6); toast(esc(r.msg),'item'); UI.closeAll(); } });
UI.defPlace('mumage',()=>UI.open('Pháp sư Cát',()=>{ const it=G().items||{}, pb=(ME&&ME.pasB)||{}; return `<p>"Ta hồi đầy máu và mana miễn phí. Có ngọc rơi từ boss thì bán cho ta! Ta còn bán sách nội tại."</p>${btn('muheal','💗 Hồi đầy máu + mana',{},'pri')}
  <h5>Bán ngọc</h5><div class="list">${['ngoc_uoc','ngoc_tam_linh','ngoc_hon_nguyen'].map(k=>`<div class="row">${UI.ico(SD.ITEMS[k].icon)}<span><b>${esc(SD.ITEMS[k].name)}</b> <small class="muted">· có ${it[k]||0}</small></span><span>${SD.fmt(SD.MU.jewelSell[k])}</span>${(it[k]||0)?btn('musell','Bán 1',{k})+((it[k]||0)>1?btn('musell',`Bán hết (${it[k]})`,{k,all:1}):''):''}</div>`).join('')}</div>
  <h5>📚 Sách nội tại</h5><p class="muted">Đọc 1 quyển = +1 cấp nội tại đó, không tốn điểm, cộng thêm tối đa bằng mức trần. Đặt lại điểm không mất cấp sách. Đọc trong bảng ⭐ Nội tại.</p>
  <div class="list">${Object.entries(M.pasBook).map(([k,B])=>{ const P=M.passive[B.pas], n=pb[B.pas]||0; return `<div class="row"><img class="ico" src="${pasIcon(B.pas)}" alt=""><span><b>${esc(SD.ITEMS[k].name)}</b> <small class="muted">· ${esc(P.desc)} +${pct(P.per)}/quyển · đã đọc ${n}/${P.max} · có ${it[k]||0}</small></span><span>${SD.fmt(B.price)}</span>${n<P.max?btn('mupasbuy','Mua 1',{k},'pri'):'<small class="good">Đủ</small>'}</div>`; }).join('')}</div>`; },{wide:true}));
UI.onAct('mupasbuy',async d=>{ const r=await GAME.act({t:'mu',op:'pasbuy',k:d.k,n:1}); if(r&&!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.onAct('muheal',async()=>{ const r=await GAME.act({t:'mu',op:'heal'}); if(r&&!r.err) toast(esc(r.msg),'item'); });
UI.onAct('musell',async d=>{ const r=await GAME.act({t:'mu',op:'sell',k:d.k,all:d.all?1:0}); if(r&&!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
// Premium Store: set legacy mặc vào tăng lực chiến + hiệu ứng đòn riêng
const bonusTxt=b=>Object.entries(b||{}).filter(([,v])=>v).map(([k,v])=>`${M.statVI[k]||k} +${Math.round(v*100)}%`).join(' · ');   /* cả chỉ số phụ: tốc đánh, hút máu, giật sét... */
UI.defPlace('mushop',()=>UI.open('Premium Store · Set Legacy',()=>{ const g=G(), own=g.owned||{}; let cur=g.look&&g.look.outfit&&g.look.outfit.top; const ok=ME&&ME.cls, cp=k=>SD.muPower(SD.muStats(ME.cls,ME.lv,ME.fruit,ME.wep,k),k&&M.legacy[k]?M.legacy[k].bonus:{}), base=ok?cp(''):0;
  const list=Object.entries(M.legacy).filter(([,L])=>!L.hidden).sort((a,b)=>a[1].tier-b[1].tier||a[1].price-b[1].price); if(cur&&M.legacy[cur]&&M.legacy[cur].base) cur=M.legacy[cur].base;   /* form Kamen Rider: tính là đang mặc set gốc */
  return `<p>"Hàng huyền thoại đây! Mặc set legacy vào là lực chiến tăng vọt, mỗi set một kiểu ra đòn riêng. Mua 1 lần giữ mãi."</p>
  <p class="muted">${ok?`Lực chiến hiện tại: <b>${ME.cp||base}</b>${cur&&M.legacy[cur]?` · đang mặc ${esc(M.legacy[cur].name)}`:''}`:'Chọn class ở Vệ binh trước để xem mỗi set tăng bao nhiêu lực chiến'}</p>
  <div class="mulg">${list.map(([k,L])=>{ const up=ok?cp(k)-base:0;
    return `<div class="mulgc t${L.tier}"><img src="${setImg(k)}" width="64" height="90" alt=""><b>${esc(L.name)}</b><small class="star">${'★'.repeat(L.tier)}</small><small>${bonusTxt(L.bonus)}</small>${up?`<small class="good">+${up} lực chiến</small>`:''}<p>${esc(L.desc)}</p>
      <div class="mulgb">${own[k]?(cur===k?`<small class="good">✔ Đang mặc</small>${btn('mulgwear','Cởi',{k:''})}`:btn('mulgwear','Mặc',{k},'pri')):btn('mulgbuy','Mua '+SD.fmt(L.price),{k},'pri')}</div></div>`; }).join('')}</div>`; },{wide:true,static:true}));
const lgDone=r=>{ if(!r||r.err) return; UI.closeAll(); GAME.sfx('level_up',.7); toast(esc(r.msg),'item'); };
UI.onAct('mulgbuy',async d=>{ const r=await GAME.act({t:'mu',op:'buy',k:d.k}); if(r&&!r.err) GAME.bigText(M.legacy[d.k].name.toUpperCase()); lgDone(r); });
UI.onAct('mulgwear',async d=>lgDone(await GAME.act({t:'mu',op:'wear',k:d.k})));
/* ======================= phụ kiện (cánh · dây chuyền · vật hộ thân · aura) + nội tại ======================= */
const SLOT_ORDER=['wing','neck','charm','aura'], AC=M.acc;
const exOf=eq=>{ const o={}; for(const k of Object.values(eq||{})) if(AC[k]) for(const [s,v] of Object.entries(AC[k].bonus)) o[s]=(o[s]||0)+v; return o; };
// ảnh xem trước phụ kiện (to x2) cho bảng
const accImg=k=>cached('acc'+k,()=>{ const a=AC[k], c=A.cv(64,48), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  if(a.slot==='wing'){ const s=A.muWing(k,0); g.drawImage(s.c,6,9,52,30); }
  else if(a.slot==='charm'){ const s=A.muCharm(k); g.drawImage(s.c,12,4,40,40); }
  else if(a.slot==='neck') g.drawImage(A.muNeckIcon(k),14,6,36,36);
  else { g.translate(32,30); for(let r=0;r<3;r++){ g.globalAlpha=.9-r*.25; g.strokeStyle=a.col; g.lineWidth=2; g.beginPath(); g.ellipse(0,0,26-r*7,10-r*2.6,0,0,7); g.stroke(); } g.globalAlpha=1; g.fillStyle=a.col; for(let i=0;i<6;i++){ const t=i*1.047; g.fillRect(Math.round(Math.cos(t)*21)-1,Math.round(Math.sin(t)*8)-1,3,3); } }
  return c.toDataURL(); });
UI.defPlace('muacc',()=>UI.open('Thợ Kim Hoàn · Phụ kiện',()=>{ const own=(ME&&ME.accOwned)||{}, eq=(ME&&ME.acc)||{}, ok=ME&&ME.cls;
  const cp=e=>ok?SD.muPower(SD.muStats(ME.cls,ME.lv,ME.fruit,ME.wep,ME.lg,exOf(e)),exOf(e)):0, base=cp(eq);
  return `<p>"Ngoài bộ trang phục chính, đeo thêm cánh, dây chuyền, vật hộ thân và aura để tăng lực chiến. Mỗi ô đeo 1 món, mua 1 lần giữ mãi, ai cũng thấy!"</p>
  ${SLOT_ORDER.map(sl=>`<h5>${esc(M.slots[sl])}${eq[sl]?` · đang đeo ${esc(AC[eq[sl]].name)}`:''}</h5><div class="mulg">${Object.entries(AC).filter(([,a])=>a.slot===sl).map(([k,a])=>{ const up=ok?cp({...eq,[sl]:k})-base:0;
    return `<div class="mulgc"><img src="${accImg(k)}" width="96" height="72" alt=""><b>${esc(a.name)}</b><small>${bonusTxt(a.bonus)}</small>${up>0?`<small class="good">+${up} lực chiến</small>`:''}
      <div class="mulgb">${own[k]?(eq[sl]===k?`<small class="good">✔ Đang đeo</small>${btn('muaccwear','Tháo',{k:'',slot:sl})}`:btn('muaccwear','Đeo',{k,slot:sl},'pri')):btn('muaccbuy','Mua '+SD.fmt(a.price),{k},'pri')}</div></div>`; }).join('')}</div>`).join('')}`; },{wide:true}));
const accDone=r=>{ if(!r||r.err) return; GAME.sfx('item_pickup',.6); toast(esc(r.msg),'item'); UI.refresh(); };
UI.onAct('muaccbuy',async d=>accDone(await GAME.act({t:'mu',op:'accbuy',k:d.k})));
UI.onAct('muaccwear',async d=>accDone(await GAME.act({t:'mu',op:'accwear',k:d.k,slot:d.slot})));
// nội tại: mỗi cấp MU 1 điểm
const pct=v=>Math.round(v*100)+'%';
// icon nội tại 32×32 (khối có đổ bóng): kiếm tăng công, khiên, tim, pha lê mana, vòng hồi phục, tâm ngắm chí mạng, giọt máu
const PASI={cuongluc:V=>{ const RP=A.volRamp; V.tube([[7,25],[23,9]],[2.6,1.4],RP.metal); V.poly([[22,6],[27,5],[26,10]],RP.metal,{n:[-.3,-.3,.9]}); V.tube([[5,21],[11,27]],1.8,RP.yellow); V.tube([[4,28],[7,25]],1.6,RP.brown); V.poly([[20,24],[26,18],[29,24],[27,24],[27,29],[25,29],[25,24]],RP.red,{n:[-.2,-.3,.93]}); },
  thietbi:V=>{ const RP=A.volRamp; V.poly([[16,3],[27,7],[26,18],[16,29],[6,18],[5,7]],RP.blue,{n:[-.3,-.35,.88]}); V.poly([[16,7],[23,9],[22,17],[16,24],[10,17],[9,9]],RP.metal,{n:[-.3,-.35,.88]}); V.tube([[16,9],[16,22]],1.2,RP.yellow).tube([[11,13],[21,13]],1.2,RP.yellow); },
  sinhluc:V=>{ const RP=A.volRamp; V.ell(11,12,6.5,6.5,RP.red,{g:'h'}).ell(21,12,6.5,6.5,RP.red,{g:'h'}); V.poly([[5,14],[27,14],[16,28]],RP.red,{g:'h',n:[-.1,0,.99]}); V.ell(9,10,2,2,RP.white); },
  linhluc:V=>{ const RP=A.volRamp; V.poly([[16,2],[24,12],[16,30],[8,12]],RP.blue,{n:[-.35,-.3,.88]}); V.poly([[16,2],[24,12],[16,12]],[[200,230,255,255],[160,210,255,255],[120,180,250,255],[80,140,230,255]],{n:[-.5,-.5,.7]}); V.line(16,4,16,27,'#e8f6ff'); },
  hoiphuc:V=>{ const RP=A.volRamp; for(let i=0;i<14;i++){ const a=i/14*5.2-1.3; V.ell(16+Math.cos(a)*10,16+Math.sin(a)*10,2.2,2.2,RP.green,{g:'r'}); } V.poly([[24,2],[30,8],[22,10]],RP.green,{n:[-.3,-.3,.9]}); V.tube([[16,10],[16,22]],2,RP.white).tube([[10,16],[22,16]],2,RP.white); },
  chimang:V=>{ const RP=A.volRamp; for(const a of [0,1.57,3.14,4.71]) V.tube([[16+Math.cos(a)*5,16+Math.sin(a)*5],[16+Math.cos(a)*14,16+Math.sin(a)*14]],[2,.6],RP.orange,{g:'s'}); for(const a of [.78,2.36,3.93,5.5]) V.tube([[16+Math.cos(a)*5,16+Math.sin(a)*5],[16+Math.cos(a)*10,16+Math.sin(a)*10]],[1.4,.4],RP.yellow,{g:'s2'}); V.ell(16,16,4,4,RP.red); V.px(15,15,'#ffffff'); },
  hutmau:V=>{ const RP=A.volRamp; V.ell(16,20,8,8,RP.red,{g:'d'}); V.poly([[16,3],[23,16],[9,16]],RP.red,{g:'d',n:[-.2,-.2,.96]}); V.ell(13,19,2,3,RP.white); V.poly([[9,24],[12,24],[10.5,29]],RP.white,{n:[0,0,1]}).poly([[20,24],[23,24],[21.5,29]],RP.white,{n:[0,0,1]}); }};
const pasIcon=k=>cached('pas'+k,()=>{ const V=A.vol(32,32); (PASI[k]||(()=>{}))(V); return V.done(false).toDataURL(); });
function openPas(){ UI.open('⭐ Nội tại',()=>{ if(!ME||!ME.cls) return '<p>Gặp Vệ binh chọn class trước.</p>'; const pas=ME.pas||{}, pb=ME.pasB||{}, it=G().items||{};
  return `<p>Cứ 3 cấp MU được 1 điểm nội tại để tăng chỉ số. Còn <b class="good">${ME.sp||0}</b> điểm.</p><div class="list">${Object.entries(M.passive).map(([k,P])=>{ const n=pas[k]||0;
    const b=pb[k]||0, bk='snt_'+k; return `<div class="row"><img class="ico" src="${pasIcon(k)}" alt=""><span><b>${esc(P.name)}</b> <small class="muted">cấp ${n}/${P.max}${b?` · sách +${b}/${P.max}`:''}</small><br><small>${esc(P.desc)} +${pct(P.per*(n+b))}${n<P.max?` → +${pct(P.per*(n+b+1))}`:' (điểm tối đa)'}</small></span>${n<P.max&&ME.sp>0?btn('mupas','+1',{k},'pri'):''}${it[bk]&&b<P.max?btn('mupasread',`📖 Đọc sách (${it[bk]})`,{k:bk}):''}</div>`; }).join('')}</div>
    ${Object.keys(pas).length?btn('mupasreset','Đặt lại điểm (200.000đ)'):''}`; }); }
UI.onAct('mupas',async d=>{ const r=await GAME.act({t:'mu',op:'pas',k:d.k}); if(r&&!r.err) GAME.sfx('level_up',.4); UI.refresh(); });
UI.onAct('mupasread',async d=>{ const r=await GAME.act({t:'mu',op:'pasread',k:d.k}); if(r&&!r.err){ GAME.sfx('level_up',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.onAct('mupasreset',async()=>{ const r=await GAME.act({t:'mu',op:'pasreset'}); if(r&&!r.err) toast(esc(r.msg),'item'); UI.refresh(); });
// vẽ phụ kiện trên người (mình + người khác, mọi map): aura dưới chân, cánh sau lưng (đi lên thì cánh ở trước), vật hộ thân bay cạnh vai, dây chuyền trên ngực
function accPeople(){ const out=[], P=GAME.P, me=GAME.G&&GAME.G.look&&GAME.G.look.acc; if(me&&Object.keys(me).length&&!P.incar) out.push({x:P.x,y:P.y,face:P.face,view:P.view,acc:me,mv:P.moving,rd:!!P.riding,mi:P.riding?SD.mythIdx(GAME.G):0,k:'me'});
  for(const r of (GAME.REM||new Map()).values()){ if(!r.look) continue; if(r._lk!==r.look){ r._lk=r.look; try{ r._acc=JSON.parse(r.look).acc||null; }catch(e){ r._acc=null; } } if(r._acc&&Object.keys(r._acc).length) out.push({x:r.x,y:r.y,face:r.face,view:r.view,acc:r._acc,mv:(r.anim||'').startsWith('walk')||(r.anim||'').startsWith('run'),rd:!!((r.fl||0)&SD.FL.ride),mi:Math.floor((r.fl||0)/SD.FL.mount)&15,k:r.id}); }
  return out; }
function drawAcc(list,ctx,cam,clock){ for(const o of accPeople()){ const a=o.acc, Xg=Math.round(o.x-cam.x), Yg=Math.round(o.y-cam.y), st=o.rd?(o.mi&&A.mythMount&&A.mythMount.M[SD.mountKey(o.mi)]?A.mythMount.M[SD.mountKey(o.mi)].seat:{dx:-4,dy:-15}):null, X0=Xg+(st?st.dx*o.face:0), Y0=Yg+(st?st.dy+7:0),   /* đang cưỡi: dời theo yên ngựa / thần thú */ side=o.view==='side', back=o.view==='up', bob=Math.round(Math.sin(clock*3+(o.k==='me'?0:o.k))*1.5);
  if(a.aura&&AC[a.aura]){ const col=AC[a.aura].col; list.push({y:o.y-.6,d:()=>{ const g=ctx, cy=Yg-1, X0=Xg; g.save(); g.globalCompositeOperation='lighter';
      const gr=g.createRadialGradient(X0,cy,0,X0,cy,19); gr.addColorStop(0,col+'66'); gr.addColorStop(1,col+'00'); g.fillStyle=gr; g.beginPath(); g.ellipse(X0,cy,19,7.5,0,0,7); g.fill();
      g.strokeStyle=col; g.lineWidth=1; g.globalAlpha=.85; g.beginPath(); g.ellipse(X0,cy,16,6,0,0,7); g.stroke();
      for(let i=0;i<6;i++){ const t=clock*1.4+i*1.047; g.beginPath(); g.ellipse(X0,cy,11.5,4.3,0,t,t+.55); g.stroke(); }
      g.fillStyle=col; for(let i=0;i<8;i++){ const t=-clock*.9+i*.785; g.fillRect(Math.round(X0+Math.cos(t)*14)-1,Math.round(cy+Math.sin(t)*5.3)-1,2,2); }
      g.globalAlpha=.5+.3*Math.sin(clock*4); g.fillRect(X0-1,cy-1,2,2); g.restore(); if(here()&&Math.random()<.2) burst(o.x+rnd(-12,12),o.y-1+rnd(-3,3),1,{col:[col,'#ffffff'],kind:'dot',dir:-1.57,spread:.3,sp:[10,25],life:[.5,.9],size:[1,1.8],up:10}); }}); }
  if(a.wing&&A.muWing(a.wing,0)){ const fr=Math.floor(clock*(o.mv?7:2.4))%2, s=A.muWing(a.wing,fr); list.push({y:o.y+(back?.3:-.3),d:()=>{ const g=ctx; if(side){ g.save(); g.translate(X0-o.face*4,0); g.scale(.62,1); g.drawImage(s.c,-s.ax,Y0-16-s.ay+bob); g.restore(); } else g.drawImage(s.c,X0-s.ax,Y0-16-s.ay+bob); }}); }
  if(a.shield&&A.muOff){ const s=A.muOff(a.shield), sx=side?o.face*5:back?6:-12; list.push({y:o.y+(back?-.25:.25),d:()=>{ const g=ctx; if(side){ g.save(); g.translate(X0+sx,0); g.scale(.6,1); g.drawImage(s.c,-s.ax,Y0-9-s.ay+bob); g.restore(); } else g.drawImage(s.c,X0+sx-s.ax,Y0-9-s.ay+bob); }}); }   /* khiên: tay trái (nghiêng: chắn trước mặt) */
  if(a.charm&&A.muCharm(a.charm)){ const s=A.muCharm(a.charm), sx=side?-o.face*15:15; list.push({y:o.y+.2,d:()=>ctx.drawImage(s.c,X0+sx-s.ax,Y0-27-s.ay+Math.round(Math.sin(clock*2.6+1)*2.5)) }); }
  if(a.neck&&A.muNeckCol(a.neck)&&!back){ const c=A.muNeckCol(a.neck); list.push({y:o.y+.15,d:()=>{ const g=ctx; g.fillStyle=c.chain; if(side){ g.fillRect(X0+o.face*2,Y0-16,1,3); g.fillStyle=c.gem; g.fillRect(X0+o.face*2,Y0-13,2,2); return; }
      for(let i=0;i<4;i++){ g.fillRect(X0-4+i,Y0-17+i,1,1); g.fillRect(X0+3-i,Y0-17+i,1,1); } g.fillStyle=c.gem; g.fillRect(X0-1,Y0-13,2,2); g.fillStyle='#ffffff'; g.fillRect(X0-1,Y0-13,1,1); }}); } } }
// Thợ Rèn Huyền Thoại: 50 vũ khí chia theo loại, mỗi loại 5 hệ
const wImg=k=>cached('wimg'+k,()=>{ const s=A.muWeapon(k); if(!s) return GAME.icon64(k);   /* vũ khí rơi từ boss (không phải hàng Thợ Rèn): dùng icon túi đồ */
  const c=A.cv(48,48), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,48,48); return c.toDataURL(); });
UI.defPlace('musmith',()=>UI.open('Thợ Rèn Huyền Thoại · 50 vũ khí',()=>{ const it=G().items||{}, cur=ME&&ME.wep, ok=ME&&ME.cls, W=M.weapons;
  const xw=k=>({...exOf(ME.acc),...(W[k]&&W[k].bonus||{})}), cp=k=>ok?SD.muPower(SD.muStats(ME.cls,ME.lv,ME.fruit,k,ME.lg,xw(k)),xw(k)):0, base=ok?SD.muPower(SD.muStats(ME.cls,ME.lv,ME.fruit,cur,ME.lg,xw(cur)),xw(cur)):0;
  return `<p>"Vũ khí rèn từ 5 hệ: Kịch Độc, Băng Giá, Hoả Ngục, Lôi Thần, Hư Không. Cầm vào là tăng công, ra chiêu có hiệu ứng riêng. 5 sao là hàng huyền thoại!"</p>${cur&&W[cur]?`<p class="muted">Đang cầm: <b>${esc(W[cur].name)}</b></p>`:''}${shieldRow()}
  ${Object.entries(M.wtypes).map(([tk,ty])=>`<h5>${esc(ty.name)} <small class="muted">· ${esc(ty.desc)} · ${bonusTxt(ty.bonus)}</small></h5><div class="mulg">${Object.keys(M.welems).map(ek=>{ const k='vw_'+tk+'_'+ek, w=W[k], up=ok?cp(k)-base:0;
    return `<div class="mulgc wr${w.star}"><img src="${wImg(k)}" width="48" height="48" alt=""><b>${esc(w.name)}</b><small class="star">${'★'.repeat(w.star)} ${esc(M.wrank[w.star])}</small><small>Công +${Math.round(w.atk*100)}%</small><small class="sub">${bonusTxt(w.bonus)}</small>${up>0?`<small class="good">+${up} lực chiến</small>`:''}
      <div class="mulgb">${it[k]?(cur===k?'<small class="good">✔ Đang cầm</small>':btn('musmithbuy','Cầm',{k},'pri')):btn('musmithbuy','Mua '+SD.fmt(w.price),{k},'pri')}</div></div>`; }).join('')}</div>`).join('')}`; },{wide:true}));
// khiên (ô riêng tay trái, không thay vũ khí): mua 1 lần giữ mãi, đeo / tháo
const shImg=k=>cached('shimg'+k,()=>{ const s=A.muOff(k,true), c=A.cv(52,60), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,52,60); return c.toDataURL(); });
function shieldRow(){ const own=(ME&&ME.accOwned)||{}, cur=ME&&ME.acc&&ME.acc.shield, ok=ME&&ME.cls; return `<h5>✋ Tay trái <small class="muted">· ô riêng (khiên, mặt nạ, búa, đao, động cơ, đũa), đeo cùng vũ khí, mỗi lúc 1 món</small></h5><div class="mulg">${Object.entries(AC).filter(([,a])=>a.slot==='shield').map(([k,a])=>`<div class="mulgc wr5"><img src="${shImg(k)}" width="52" height="60" alt=""><b>${esc(a.name)}</b><small>${esc(a.desc)}</small><small class="good">${a.spd?`Tốc chạy +${Math.round(a.spd*100)}% · `:''}${bonusTxt(a.bonus)}</small>
    <div class="mulgb">${!ok?'':cur===k?btn('mushield','Tháo',{k:''},'')+'<small class="good">✔ Đang đeo</small>':own[k]?btn('mushield','Đeo',{k},'pri'):btn('mushieldbuy','Mua '+SD.fmt(a.price),{k},'pri')}</div></div>`).join('')}</div>`; }
const shDone=r=>{ if(r&&!r.err){ GAME.sfx('item_pickup',.7); toast(esc(r.msg),'item'); } UI.refresh(); };
UI.onAct('mushieldbuy',async d=>shDone(await GAME.act({t:'mu',op:'accbuy',k:d.k})));
UI.onAct('mushield',async d=>shDone(await GAME.act({t:'mu',op:'accwear',k:d.k,slot:'shield'})));
UI.onAct('musmithbuy',async d=>{ const r=await GAME.act({t:'mu',op:'smithbuy',k:d.k}); if(r&&!r.err){ GAME.sfx('item_pickup',.7); toast(esc(r.msg),'item'); } UI.refresh(); });
// Người Thuần Thú: cường hoá ngựa đã mua lần lượt 6 bậc thần thú, cưỡi con nào cũng được trong số đã mở
const mountImg=k0=>{ const k=k0==='xichtho'?'xichtho_'+((G().xt||{}).el||''):k0; return cached('mimg'+k+(k?'':(G().horseCoat||0)),()=>{ const s=k?A.mythMount(k,0,false):A.horse(0,G().horseCoat||0,false,true), c=A.cv(128,104), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  const sc=Math.min(2,128/s.c.width,104/s.c.height); g.drawImage(s.c,Math.round(64-s.ax*sc),Math.round(102-s.ay*sc),s.c.width*sc,s.c.height*sc); return c.toDataURL(); }); };   /* vừa khung dù hình to / nhỏ; Xích Thố theo hệ đang chọn */
UI.defPlace('mutamer',()=>UI.open('Người Thuần Thú · Mua ngựa & cường hoá',()=>{ const g=G(), h=g.horse||{}, lv=h.myth||0, cur=(g.look&&g.look.mount)||'', it=g.items||{}, rent=h.until>NET.now()?Math.ceil((h.until-NET.now())/60000):0;
  return `<p>"Mang ngựa đã mua tới đây, ta cường hoá thành thần thú! Mỗi bậc chạy nhanh hơn, cộng máu + công MU. Đã mở bậc nào thì cưỡi con nào cũng được, ai cũng thấy."</p>
  ${h.own?`<p class="muted">Ngựa của bạn: <b>bậc ${lv}/${SD.HORSE.myth.length}</b> · bấm H để lên ngựa</p>`:`<p class="bad">Chưa có ngựa riêng: mua ngựa ở đây để cưỡi và cường hoá (ngựa thuê chỉ cưỡi được, không cường hoá được).</p>
    ${g.skills.cuoingua?'':'<p class="bad">Cần học Cưỡi ngựa trước (laptop ở phòng)</p>'}${rent?`<p class="muted">Đang thuê ngựa, còn ${rent} phút · bấm H để lên ngựa</p>`:''}
    <div class="col">${btn('horse','Mua ngựa · '+SD.fmt(SD.HORSE.buy),{op:'buy'},'pri')}${btn('horse','Thuê 1 giờ · '+SD.fmt(SD.HORSE.rent),{op:'rent'})}</div>`}
  <div class="mulg">${[{k:'',name:'Ngựa thường',desc:'Ngựa mua ở trại',lv:0}].concat(SD.HORSE.myth).map(m=>{ const open=m.lv<=lv, next=m.lv===lv+1, need=Object.entries(m.jewels||{}).map(([k,n])=>`${n} ${SD.ITEMS[k].name} (có ${it[k]||0})`).join(', ');
    return `<div class="mulgc ${m.lv>=5?'wr5':m.lv>=3?'wr4':m.lv?'wr3':''}"><img src="${mountImg(m.k)}" width="128" height="104" alt=""><b>${esc(m.name)}</b>${m.lv?`<small class="star">${'★'.repeat(m.lv)} Bậc ${m.lv}</small>`:''}<small>${esc(m.desc)}</small>
      ${m.lv?`<small class="good">Tốc độ +${Math.round((m.speed-1)*100)}% · ${bonusTxt(m.bonus)}</small>`:''}
      <div class="mulgb">${!h.own?'':open?(cur===m.k?'<small class="good">✔ Đang cưỡi</small>':btn('mythpick','Cưỡi',{k:m.k},'pri')):next?`${need?`<small class="muted">Cần ${esc(need)}</small>`:''}${btn('mythup','Cường hoá '+SD.fmt(m.price),{},'pri')}`:'<small class="muted">🔒 Cường hoá bậc trước</small>'}</div></div>`; }).join('')}</div>
  ${xtCard(g,h,cur,it)}
  ${window.MU9?window.MU9.gemGuide((()=>{ const nx=SD.HORSE.myth[lv]; const ks=nx?Object.keys(nx.jewels||{}):[]; return ks.length?ks:M.jewels; })()):''}`; },{wide:true}));
const mythDone=r=>{ if(!r||r.err) return; if(r.horse) GAME.G.horse=r.horse; if(r.look) GAME.G.look=r.look; if(r.xt) GAME.G.xt=r.xt; toast(esc(r.msg),'item'); UI.refresh(); };
// thẻ Xích Thố (ông Trường Con): chưa có thì khoá + hướng dẫn 4 nhiệm vụ (➜ tự đi), có rồi thì cưỡi / lên cấp / chọn 5 hệ
function xtCard(g,h,cur,it){ const X=SD.XICHTHO, x=g.xt||{}, has=x.lv>0, my=has?SD.mythOf('xichtho',g):null, E=X.els[x.el], c=has&&x.lv<X.max?X.cost(x.lv+1):null;
  const need=c?Object.entries(c.jewels).map(([k,n])=>`${n} ${SD.ITEMS[k].name} (có ${it[k]||0})`).join(', '):'';
  const qs=X.quests.map(q=>{ const st=(g.quests||{})[q], Q=SD.QUESTS[q]; return `<li>${st==='done'?'✔':st==='active'?'▶':'◻'} ${esc(Q.title)} ${st==='done'?'':`<button class="qgo" type="button" data-go="${q}" title="Tự đi tới">➜</button>`}</li>`; }).join('');
  /* 6 dáng Xích Thố: lửa gốc + 5 hệ; có ngựa rồi thì bấm để chọn / đổi hệ */
  const gal=`<div class="xtgal">${[['',{name:'Lửa gốc',col:'#ff8a1a',fx:'chưa chọn hệ'}]].concat(Object.entries(X.els)).map(([k,e])=>{ const on=has&&(x.el||'')===k, inner=`<img src="${mountImg('xichtho_'+k)}" width="96" height="78" alt=""><b>${k?'Hệ ':''}${esc(e.name)}</b><small>${esc(k?e.fx.split(',')[0]:e.fx)}</small>`;
    return has&&k?`<button type="button" class="xtv ${on?'on':''}" style="--lc:${e.col}" data-a="xtel" data-el="${k}" title="${esc(e.fx)}">${inner}${on?'<em>✔ đang theo</em>':''}</button>`:`<div class="xtv ${on?'on':''}" style="--lc:${e.col}" title="${esc(e.fx)}">${inner}</div>`; }).join('')}</div>`;
  const tele=x.lv>=X.tele?`<small class="good">🔥 Đã mở DỊCH CHUYỂN: bảng Grab bấm 🔥 là tới ngay mọi map</small>`:`<small class="star">✨ Cấp ${X.tele}: mở DỊCH CHUYỂN tới mọi map, ở đâu cũng đi được, không cần gọi Grab</small>`;
  return `<h5>🔥 Xích Thố của ông Trường Con <small class="muted">· ngựa lửa thần thoại, chọn 1 trong 5 hệ, cưỡi trong MU tự phun lửa đánh quái</small></h5>
  <div class="mulgc wr5 ${has?'':'xtlock'}"><img src="${mountImg('xichtho')}" width="128" height="104" alt=""><b>Xích Thố${has?` · cấp ${x.lv}/${X.max}`:''}${E?` · hệ ${E.name}`:''}</b>
    <small class="good">⚡ MẠNH HƠN mọi thú cưỡi thường: chỉ số hơn thần thú cùng bậc 30%${has?'':' · máu ??? · công ??? · tốc độ ???'}</small>${tele}
    ${has?`<small class="good">Tốc độ +${Math.round((my.speed-1)*100)}% · ${bonusTxt(my.bonus)}</small>${E?`<small>${esc(E.fx)}</small>`:'<small class="bad">Chưa chọn hệ: bấm 1 trong 5 con bên dưới (lần đầu miễn phí)</small>'}
      <div class="mulgb">${cur==='xichtho'?'<small class="good">✔ Đang cưỡi</small>':btn('mythpick','Cưỡi',{k:'xichtho'},'pri')}${c?`${need?`<small class="muted">Cần ${esc(need)}</small>`:''}${btn('xtup','Lên cấp '+(x.lv+1)+' · '+SD.fmt(c.vnd),{},'pri')}`:'<small class="good">Cấp tối đa</small>'}</div>
      ${gal}${x.el?'<small class="muted">đổi hệ: 1 Ngọc Hỗn Nguyên</small>':''}`
    :`<small class="bad">🔒 Chưa mở: làm xong 4 nhiệm vụ của ông Trường Con ở Miếu (Hải Phòng) rồi gặp ông xin ngựa</small>${gal}<ul class="xtq">${qs}</ul>
      <div class="mulgb">${btn('xtgo','➜ Tới gặp ông Trường Con',{},'pri')}</div>`}</div>`; }
UI.onAct('xtup',async()=>{ const r=await GAME.act({t:'xichtho',op:'up'}); if(r&&!r.err){ GAME.sfx('level_up',.8); GAME.bigText('XÍCH THỐ CẤP '+r.xt.lv+'!'); } mythDone(r); });
UI.onAct('xtel',async d=>mythDone(await GAME.act({t:'xichtho',op:'el',el:d.el})));
UI.onAct('xtgo',()=>{ UI.closeAll(); GAME.autoGo('mieu',()=>GAME.walkToNpc('truongcon')); });
UI.onAct('mythup',async()=>{ const r=await GAME.act({t:'horse',op:'mythup'}); if(r&&!r.err){ GAME.sfx('level_up',.8); const m=SD.mythOf(r.look&&r.look.mount); if(m) GAME.bigText(m.name.toUpperCase()+'!'); } mythDone(r); });
UI.onAct('mythpick',async d=>mythDone(await GAME.act({t:'horse',op:'mythpick',k:d.k})));
/* ======================= thách đấu + nhặt đồ nhiệm vụ ẩn ======================= */
const HID_Q={cuon_truc:'mu_cuontruc',banh_mut:'mu_banhmut',lua_ma:'mu_lua_ma',vay_rong:'mu_vayrong'};
const nightNow=()=>{ const h=SD.vnTime(NET.now()).hf; return h>=19||h<5; };
const hidList=()=>{ if(!town()) return []; const g=G(), q=g.quests||{}, H=(g.flags&&g.flags.muHid)||{}, out=[]; for(const [k,L] of Object.entries(M.hidden)){ if(q[HID_Q[k]]!=='active'||(k==='lua_ma'&&!nightNow())) continue; L.forEach(([x,y],i)=>{ if(!H[k+i]) out.push({k,i,x,y}); }); } return out; };
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()) return;
  for(const h of hidList()){ const d=dist(h.x*T,h.y*T); if(d<24) consider(d*.4,{type:'mapx',k:'muhid',hk:h.k,i:h.i,label:'Nhặt '+SD.ITEMS[h.k].name}); }
  if(!ME||!ME.cls||ME.duel) return; const R=GAME.REM; if(!R) return; for(const r of R.values()){ if(!r.name) continue; const d=dist(r.x,r.y); if(d<34) consider(d+6,{type:'mapx',k:'muduel',pid:r.id,label:'⚔ Thách đấu '+r.name}); } };
const p0=X.pick; X.pick=async x=>{ if(x.k==='muduel'){ const r=await GAME.act({t:'mu',op:'duel',pid:x.pid}); if(r&&!r.err) toast(esc(r.msg),'quest'); return; }
  if(x.k==='muhid'){ const r=await GAME.act({t:'mu',op:'pick',k:x.hk,i:x.i}); if(r&&!r.err){ GAME.sfx('item_pickup',.6); toast(esc(r.msg),'item'); burst(GAME.P.x,GAME.P.y-20,16,{col:C_GOLD,kind:'star',sp:[20,60],life:[.4,.8]}); } return; } return p0(x); };
// nhạc nền MU: đứng trong 14 ô quanh boss đang ra thì nhạc đánh boss, không thì nhạc theo khu
window.MU_BGM=zone=>{ const P=GAME.P; if(BH().some(b=>Math.hypot(b.x*T-P.x,b.y*T-P.y)<14*T)) return 'mu_boss';
  return /Làng Lá/.test(zone)?'mu_forest':/Đầm Rồng/.test(zone)?'mu_lake':/Nghĩa địa/.test(zone)?'mu_grave':/Phế Liệu/.test(zone)?'mu_junk':'mu_plaza'; };
// minimap: boss đang ra (Luffy chấm vàng to, boss phụ chấm đỏ)
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k!=='mu') return; for(const B of BOSSES) dot(B.x*T,B.y*T,B.id==='luffy'?'#ffd84a':'#ff4a5a',B.id==='luffy'?4:3); };
/* ======================= vẽ ======================= */
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim; if(a==='mualtar'){ const f=Math.floor(clock*2)%2; return cached('al'+f,()=>A.muAltar(f)); } if(a==='mutorch'){ const f=(Math.floor(clock*6)+Math.round(o.x/16))%2; return cached('tc'+f,()=>A.muTorch(f)); }
  if(a==='mufount'){ const f=Math.floor(clock*3)%2; return cached('fo'+f,()=>A.muFountain(f)); } if(a==='mulamp'){ const f=Math.floor(clock*3+o.x)%2; return cached('gl'+f,()=>A.muGhostLamp(f)); } return a0(o,clock); };
const HID_ICON={cuon_truc:'scroll',banh_mut:'jambread',lua_ma:'ghostfire',vay_rong:'scale'};
let lastHud=0;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const now=performance.now(), dt=Math.min(.05,(now-lastT)/1000); lastT=now; if(now-lastHud>250){ lastHud=now; hudTick(); } const cam=GAME.cam, clock=GAME.clock; drawAcc(list,ctx,cam,clock); if(!here()) return; stepPT(dt);
  for(const h of hidList()){ const x=h.x*T, y=h.y*T, ic=cached('hi'+h.k,()=>{ const c=A.icon(HID_ICON[h.k],2); return c; }); list.push({y,d:()=>{ ctx.globalAlpha=.55+.45*Math.abs(Math.sin(clock*3)); ctx.drawImage(ic,Math.round(x-14-cam.x),Math.round(y-30-cam.y+Math.sin(clock*3)*2)); ctx.globalAlpha=1; }}); if(Math.random()<.05) burst(x,y-16,1,{col:C_GOLD,kind:'star',sp:[5,15],life:[.4,.7]}); }
  for(const B of BH()){ list.push({y:-9997,d:()=>drawTele(ctx,B,now,cam,clock)}); list.push({y:B.y*T,d:()=>drawBoss(ctx,B,now,cam,clock)}); }
  drawWest(list,ctx,now,cam,clock);
  // Min đứng cạnh chủ, quay về boss gần nhất, vừa hát (tư thế ra đòn) vừa toả lấp lánh
  for(const [pid,m0] of MINS){ if(now>m0.end){ MINS.delete(pid); continue; } const p=minPos(pid); if(!p) continue; const av=cached('minav',()=>AVATAR.build(SD.NPC_LOOKS.mu_min.look)), B=BOSSES.slice().sort((u,v)=>Math.hypot(u.x*T-p[0],u.y*T-p[1])-Math.hypot(v.x*T-p[0],v.y*T-p[1]))[0], f=B?(B.x*T>=p[0]?1:-1):faceOf(pid);
    const atk=now-m0.hitAt<300, an=atk?av.anims.attack:av.anims.idle, fr=an.frames[Math.floor((atk?(now-m0.hitAt)/1000:clock)*an.fps)%an.frames.length]||an.frames[0];
    list.push({y:p[1],d:()=>{ GAME.shadow(p[0],p[1],8); const X0=Math.round(p[0]-cam.x), Y0=Math.round(p[1]-cam.y); ctx.save(); if(f<0){ ctx.translate(X0,0); ctx.scale(-1,1); ctx.translate(-X0,0); } ctx.drawImage(fr,X0-16,Y0-48); ctx.restore(); }});
    if(Math.random()<.15) burst(p[0]+rnd(-8,8),p[1]-rnd(8,30),1,{col:['#ff9a3a','#ffd0e8'],kind:'star',sp:[5,15],life:[.4,.7],size:[1,2]}); }
  for(let i=NOTES.length-1;i>=0;i--) if(now-NOTES[i].t>900) NOTES.splice(i,1);
  list.push({y:99997,d:()=>{ ctx.font='11px VT323, monospace'; ctx.textAlign='center'; for(const n of NOTES){ const k=(now-n.t)/900; ctx.globalAlpha=1-k; ctx.fillStyle='#1c1516'; ctx.fillText(n.s,n.x-cam.x+1,n.y-cam.y-k*26+1); ctx.fillStyle=n.c; ctx.fillText(n.s,n.x-cam.x,n.y-cam.y-k*26); } ctx.globalAlpha=1; }});
  list.push({y:99998,d:()=>{ drawPT(ctx,cam,false); drawBossFx(ctx,now,cam); for(let i=CASTS.length-1;i>=0;i--) if(!castStep(ctx,CASTS[i],now,cam)) CASTS.splice(i,1);
    ctx.save(); ctx.globalCompositeOperation='lighter'; drawWaves(ctx,cam); drawPT(ctx,cam,true); ctx.restore();
    if(darkA>0&&now-darkT<400){ ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle=`rgba(10,6,24,${darkA})`; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.restore(); } else if(darkA<0&&now-darkT<90){ ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle=`rgba(255,255,255,${-darkA})`; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.restore(); } else darkA=0; }}); };
// số sát thương + tên boss + viền đỏ khi mình bị đánh: vẽ ở lớp giao diện cho nét
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); if(!here()) return; const now=performance.now(); NUM=NUM.filter(n=>now-n.t<1000);
  { const foe=new Set(window.DDAY?window.DDAY.targets().map(q=>q.to):[]); for(const r of (GAME.REM||new Map()).values()){ const h=PHP.get(r.id); if(h==null||(r.fl&SD.FL.incar)) continue; const X0=Math.round(sx(r.x))-14, Y0=Math.round(sy(r.y-40)), w=Math.round(26*h/100), en=foe.has('dd:'+(1000000+r.id));   /* thanh máu người chơi khác: xanh → vàng → đỏ, đội địch D-Day viền đỏ */
      ug.fillStyle=en?'#ff3a3a':'#120c16'; ug.fillRect(X0-1,Y0-1,30,6); ug.fillStyle='#3a1a1e'; ug.fillRect(X0,Y0,28,4); ug.fillStyle=h>50?'#4ad86a':h>25?'#ffd84a':'#ff4a4a'; ug.fillRect(X0+1,Y0+1,w,2); } }
  ug.textAlign='center'; ug.textBaseline='bottom'; for(const n of NUM){ const k=(now-n.t)/1000, pop=k<.12?1+(.12-k)*4:1; ug.font=`${Math.round((n.crit?24:18)*pop)}px VT323, monospace`; const X0=sx(n.x)+(n.crit?Math.sin(now/30)*2:0), Y0=sy(n.y)-k*34; ug.globalAlpha=Math.min(1,(1-k)*1.6);
    ug.fillStyle='#120c16'; ug.fillText((n.crit?'💥 ':'')+n.v,X0+1,Y0+1); ug.fillStyle=n.miss?'#c8c8ff':n.dot==='doc'?'#6ae88a':n.dot==='chay'?'#ff9a3a':n.me?'#ff5a5a':n.crit?'#ffb03a':'#ffd84a'; ug.fillText((n.crit?'💥 ':'')+n.v,X0,Y0); ug.globalAlpha=1; }
  for(const pid of MINS.keys()){ const p=minPos(pid); if(p){ ug.font='14px VT323, monospace'; tag(sx(p[0]),sy(p[1]-38),'Min ♪','','#ff9a3a'); } }
  for(const B of BH()) for(const m of B.mins||[]){ const D=MIND.get(m[0]), sp=CACHE['mb'+(M.minions[m[1]]||{}).sprite+'0false']; if(!D||!sp) continue; const w=26, X0=Math.round(sx(D.x*T)-w/2), Y0=Math.round(sy(D.y*T-sp.ay)-7);
    ug.fillStyle='#120c16'; ug.fillRect(X0-1,Y0-1,w+2,5); ug.fillStyle=`hsl(${Math.round(1.2*m[4])},85%,48%)`; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*m[4]/100)),3); }   /* thanh máu quái con */
  for(const B of BH()){ const D=DISP[B.id]||B, sp0=CACHE['mb'+B.sprite+'0false'], bx=sx(D.x*T), by=sy(D.y*T-(sp0?sp0.ay+16:(B.big?100:70))-(D.h||0)-(B.fly?12:0));
    { const w=B.big||B.size>1?96:72, h=7, X0=Math.round(bx-w/2), Y0=Math.round(by+5), k=Math.max(0,Math.min(1,B.hp/B.max)); ug.fillStyle='#120c16'; ug.fillRect(X0-2,Y0-2,w+4,h+4); ug.fillStyle='#3a1418'; ug.fillRect(X0,Y0,w,h);
      ug.fillStyle=`hsl(${Math.round(120*k)},85%,48%)`; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*k)),h); ug.fillStyle='rgba(255,255,255,.35)'; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*k)),2); }   /* thanh máu trên đầu boss */
    if(B.say){ ug.font='15px VT323, monospace'; tag(bx,by-20,'💬 '+B.say,'','#ffffff'); }   /* thoại boss */ ug.font='16px VT323, monospace'; tag(bx,by,B.name+(B.phase===3?' 🔥':''),'',B.id==='luffy'?'#ffd84a':'#ff6a8a');
    const an=B.anim||{}, el=NET.now()-(an.t||0), at=an.k&&el<1600&&(BS[B.id].attacks.find(a=>a.k===an.k)); if(at){ const pop=el<120?1.3-el/400:1; ug.globalAlpha=Math.min(1,(1600-el)/300); ug.font=`${Math.round(15*pop)}px VT323, monospace`; tag(bx,by+30,'⚠ '+at.name,'','#ffb03a'); ug.globalAlpha=1; } }   /* tên đòn sắp ra: đọc được mà né */
  { const du=DEAD.get(NET.pid); if(du&&du>now){ const w=innerWidth, h=innerHeight; ug.fillStyle='rgba(40,36,48,.55)'; ug.fillRect(0,0,w,h); ug.font='28px VT323, monospace'; ug.textAlign='center'; ug.fillStyle='#120c16'; ug.fillText(`💀 Bạn đã gục · hồi sinh ở cổng thành sau ${Math.ceil((du-now)/1000)} giây`,w/2+2,h*.3+2); ug.fillStyle='#e8e0f0'; ug.fillText(`💀 Bạn đã gục · hồi sinh ở cổng thành sau ${Math.ceil((du-now)/1000)} giây`,w/2,h*.3); } }
  const hk=(now-meHitAt)/350; if(hk<1){ const w=innerWidth, h=innerHeight, gr=ug.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.7); gr.addColorStop(0,'rgba(255,0,0,0)'); gr.addColorStop(1,`rgba(220,20,40,${.45*(1-hk)})`); ug.fillStyle=gr; ug.fillRect(0,0,w,h); } };
/* ---------- đánh thường: đứng gần quái / boss là tự đánh theo tốc đánh. Rê chuột vào con nào thì con đó sáng viền vàng và được ưu tiên đánh;
   bấm chuột trái vào thì khoá mục tiêu (viền đỏ) và tự đi tới tầm đánh ---------- */
let HOV=null, LOCK=null, basicAt=0, basicBusy=false;
const OUTL=new WeakMap();
function outline(c,col){ let m=OUTL.get(c); if(!m) OUTL.set(c,m={}); if(m[col]) return m[col]; const o=A.cv(c.width+2,c.height+2), g=o.getContext('2d');
  for(const [dx,dy] of [[0,1],[2,1],[1,0],[1,2]]) g.drawImage(c,dx,dy); g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,o.width,o.height); return m[col]=o; }   /* viền 1px quanh hình */
const tgCol=k=>k===LOCK?'#ff4a3a':k===HOV?'#ffe14a':'';
const tgList=()=>{ const L=[]; for(const B of BH()) for(const m of B.mins||[]){ const D=MIND.get(m[0]), sp=CACHE['mb'+(M.minions[m[1]]||{}).sprite+'0false']; if(D) L.push({to:'bm:'+m[0],x:D.x*T,y:D.y*T,rad:.5,w:sp?sp.ax*.8:8,h:sp?sp.ay:16}); }
  for(const B of BH()){ if(bUntil(B,'dive')) continue; const D=DISP[B.id]||B, sp=CACHE['mb'+B.sprite+'0false']; L.push({to:'boss:'+B.id,x:D.x*T,y:D.y*T,rad:B.big?2.2:1.6,w:sp?sp.ax*.75:20,h:sp?sp.ay:50}); }
  if(window.MUMOB&&window.MUMOB.list) for(const o of window.MUMOB.list()) L.push({to:'mob:'+o.id,...o}); if(window.DDAY) L.push(...window.DDAY.targets()); return L; };   /* D-Day: quái, nhà chính, người đội kia */
function pickTg(wx,wy){ let best=null, bd=1e9; for(const q of tgList()) if(Math.abs(wx-q.x)<q.w&&wy<q.y+4&&wy>q.y-q.h){ const d=Math.hypot(wx-q.x,wy-(q.y-q.h/2)); if(d<bd){ bd=d; best=q.to; } } return best; }
const cvs8=document.getElementById('game');
cvs8.addEventListener('mousemove',e=>{ if(!here()||!GAME.worldAt){ HOV=null; return; } const [x,y]=GAME.worldAt(e); HOV=pickTg(x,y); if(HOV) cvs8.style.cursor='var(--cur-hand)'; });
cvs8.addEventListener('mouseleave',()=>{ HOV=null; });
addEventListener('click',e=>{ if(!here()||e.target!==cvs8||!HOV||!ME||!ME.cls) return; e.stopPropagation(); LOCK=HOV; const q=tgList().find(x=>x.to===LOCK), P=GAME.P;   /* bắt trước game.js: bấm quái = khoá mục tiêu */
  if(q&&Math.hypot(q.x-P.x,q.y-P.y)>(((M.cls[ME.cls]||{}).reach||M.basic.range)+q.rad-.4)*T) GAME.walkTo(q.x/T,q.y/T,''); },true);
function autoBasic(){ const now=performance.now(); if(basicBusy||now<basicAt||ME.duel||(ME.dead>0&&now-MET<ME.dead)) return;
  const P=GAME.P, L=tgList(), R=(M.cls[ME.cls]||{}).reach||M.basic.range, inR=q=>Math.hypot(q.x-P.x,q.y-P.y)<=(R+q.rad-.15)*T; if(LOCK&&!L.some(q=>q.to===LOCK)) LOCK=null;
  const q=[LOCK,HOV].map(k=>k&&L.find(x=>x.to===k)).find(x=>x&&inR(x))||L.filter(inR).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0]; if(!q) return;
  basicBusy=true; NET.req({t:'mu',op:'basic',to:q.to}).then(r=>{ basicBusy=false; basicAt=performance.now()+(r&&r.next?r.next:300); },()=>{ basicBusy=false; basicAt=performance.now()+600; }); }
const dB=X.draw; X.draw=(list,ctx)=>{ dB(list,ctx); if(here()&&ME&&ME.cls) autoBasic(); else { HOV=null; LOCK=null; } };
/* ---------- Đất Phía Tây: quái con, đạn toả vòng, vũng độc, Cánh Cửa Thần Kỳ, hiệu ứng trên người chơi ---------- */
const PFX=new Map(), MIND=new Map(), PUD=[], DOORS=[], ZAPS=[], STUNS=[], DEAD=new Map(), TINT=new WeakMap();   // DEAD: ai đang gục (tới lúc nào)
function tinted(c,col){ let m=TINT.get(c); if(!m) TINT.set(c,m={}); if(m[col]) return m[col]; const o=A.cv(c.width,c.height), g=o.getContext('2d'); g.drawImage(c,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,o.width,o.height); return m[col]=o; }
function minPosOf(id){ const D=MIND.get(id); return D?[D.x*T,D.y*T]:null; }
function drawWest(list,ctx,now,cam,clock){
  for(let i=PUD.length-1;i>=0;i--){ const p=PUD[i], el=now-p.t; if(el>5000){ PUD.splice(i,1); continue; } list.push({y:-9998,d:()=>{ ctx.save(); ctx.globalAlpha=.32*(1-el/5000)+.05; ctx.fillStyle='#3ac85a'; ctx.beginPath(); ctx.arc(p.x-cam.x,p.y-cam.y,p.r,0,7); ctx.fill();
    ctx.globalAlpha=.5*(1-el/5000); ctx.fillStyle='#bfffc8'; for(let k=0;k<6;k++){ const a=k*1.05+clock*.4, r=p.r*(.25+.6*((k*37)%10)/10); ctx.beginPath(); ctx.arc(p.x-cam.x+Math.cos(a)*r,p.y-cam.y+Math.sin(a)*r,1.5+Math.sin(clock*4+k),0,7); ctx.fill(); } ctx.restore(); }}); }
  // Cánh Cửa Thần Kỳ: cửa hồng hiện lên, cánh cửa mở ra (lộ ánh sáng bên trong), boss bước qua rồi cửa đóng lại và mờ đi; hiện cả chỗ đi lẫn chỗ đến
  for(let i=DOORS.length-1;i>=0;i--){ const d=DOORS[i], el=now-d.t; if(el>1300){ DOORS.splice(i,1); continue; } if(el<0) continue;
    const a=Math.min(1,el/160)*(el>1050?1-(el-1050)/250:1), open=el<220?0:el<520?(el-220)/300:el<850?1:Math.max(0,1-(el-850)/200);
    list.push({y:d.y+(d.out?-1:2),d:()=>{ const X0=Math.round(d.x-cam.x)-10, Y0=Math.round(d.y-cam.y); ctx.save(); ctx.globalAlpha=a;
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X0+10,Y0+1,13,3,0,0,7); ctx.fill();
      ctx.fillStyle='#2a1a22'; ctx.fillRect(X0-1,Y0-33,22,34); ctx.fillStyle='#e85a9a'; ctx.fillRect(X0,Y0-32,20,32);   /* khung cửa */
      const gl=ctx.createLinearGradient(X0,0,X0+20,0); gl.addColorStop(0,'#fff8d0'); gl.addColorStop(1,'#ffffff'); ctx.fillStyle=gl; ctx.fillRect(X0+2,Y0-30,16,30);   /* bên trong sáng loá */
      if(open>.05){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=a*.6*open; ctx.fillStyle='#fff3b0'; ctx.beginPath(); ctx.moveTo(X0+2,Y0); ctx.lineTo(X0+18,Y0); ctx.lineTo(X0+30,Y0+8); ctx.lineTo(X0-10,Y0+8); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=a; }
      const pw=Math.max(2,Math.round(16*(1-open*.85))); ctx.fillStyle='#ff7ab8'; ctx.fillRect(X0+2,Y0-30,pw,30); ctx.fillStyle='#ffb0d8'; ctx.fillRect(X0+2,Y0-30,pw,2);   /* cánh cửa quay mở */
      if(pw>6){ ctx.fillStyle='#ffd84a'; ctx.fillRect(X0+2+pw-4,Y0-15,2,3); } ctx.restore(); }}); }
  for(let i=STUNS.length-1;i>=0;i--){ const s=STUNS[i]; if(now>s.end){ STUNS.splice(i,1); continue; } list.push({y:99980,d:()=>stunStars(ctx,s.x-cam.x,s.y-cam.y-30,clock)}); }   /* quái bị choáng: sao xoay trên đầu */
  for(let i=ZAPS.length-1;i>=0;i--){ const z=ZAPS[i], el=now-z.t; if(el>280){ ZAPS.splice(i,1); continue; } list.push({y:99990,d:()=>{ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=1-el/280; ctx.lineWidth=2;
    for(const [x,y] of z.pts){ ctx.strokeStyle=el%60<30?'#ffffff':'#ffe066'; ctx.beginPath(); let px=z.x-cam.x, py=z.y-cam.y; ctx.moveTo(px,py); for(let k=1;k<=5;k++){ const qx=z.x+(x-z.x)*k/5-cam.x+(k<5?rnd(-5,5):0), qy=z.y+(y-z.y)*k/5-cam.y+(k<5?rnd(-5,5):0); ctx.lineTo(qx,qy); } ctx.stroke(); } ctx.restore(); }}); }   /* tia sét lan */
  const seen=new Set();
  for(const B of BH()){ const age=Math.max(0,(NET.now()-(B.ts||NET.now()))/1000);
    for(const m of B.mins||[]){ const [id,k,x,y]=m, MD=M.minions[k]; if(!MD) continue; seen.add(id); let D=MIND.get(id); if(!D){ D={x,y,face:1,atkAt:0}; MIND.set(id,D); } const ox=D.x; D.x+=(x-D.x)*.2; D.y+=(y-D.y)*.2; if(Math.abs(D.x-ox)>.003) D.face=D.x>ox?1:-1;
      const spn=MD.stars?MD.sprite+((id%7)+1):MD.sprite, fr=now-D.atkAt<260?(MD.shoot?2:1):Math.floor(clock*(MD.spd?6:2)+id)%2,   /* lính bắn: khung 2 lúc bắn; Ngọc Rồng 1–7 sao */ sp=cached('mb'+spn+fr+'false',()=>A.muBossSprite(spn,fr,false)); cached('mb'+MD.sprite+'0false',()=>A.muBossSprite(spn,0,false));
      list.push({y:D.y*T,d:()=>{ const X0=Math.round(D.x*T-cam.x), Y0=Math.round(D.y*T-cam.y)-(MD.spd?Math.abs(Math.round(Math.sin(clock*12+id)*2)):0); GAME.shadow(D.x*T,D.y*T,7); const oc=tgCol('bm:'+id);
        if(MD.orb){ ctx.save(); ctx.globalAlpha=.14+.06*Math.sin(clock*4+id); ctx.fillStyle='#7a2aa8'; ctx.beginPath(); ctx.ellipse(X0,Y0,MD.orb.r*T,MD.orb.r*T*.55,0,0,7); ctx.fill(); ctx.globalAlpha=.6; ctx.strokeStyle='#6ae88a'; ctx.setLineDash([4,3]); ctx.lineDashOffset=-clock*15; ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }   /* vùng độc quanh Ngọc Rồng */
        ctx.save(); ctx.translate(X0,Y0-(MD.orb?6+Math.round(Math.sin(clock*2.5+id)*2):0)); if(D.face<0) ctx.scale(-1,1); if(oc) ctx.drawImage(outline(sp.c,oc),-sp.ax-1,-sp.ay-1); ctx.drawImage(sp.c,-sp.ax,-sp.ay); ctx.restore(); }}); }
    for(const o of B.shots||[]){ const x=(o[0]+o[2]*age)*T, y=(o[1]+o[3]*age)*T, vx=o[2], vy=o[3], v=Math.hypot(vx,vy)||1;
      if(o[4]){ list.push({y:y+20,d:()=>{ const X0=x-cam.x, Y0=y-cam.y; ctx.save(); ctx.globalCompositeOperation='lighter'; const gr=ctx.createRadialGradient(X0,Y0,0,X0,Y0,9); gr.addColorStop(0,'rgba(255,90,150,.9)'); gr.addColorStop(1,'rgba(255,40,100,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(X0,Y0,9,0,7); ctx.fill();
        ctx.fillStyle='#ff3a7a'; ctx.beginPath(); ctx.arc(X0,Y0,4.5,0,7); ctx.fill(); ctx.strokeStyle='#ffd0e0'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(X0,Y0,4.5,0,7); ctx.stroke(); ctx.fillStyle='#ffffff'; ctx.fillRect(Math.round(X0)-2,Math.round(Y0)-2,2,2); ctx.restore(); }}); continue; }   /* đạn tròn đỏ hồng của Phạm Hoàng Hà */
      list.push({y:y+20,d:()=>{ const X0=x-cam.x, Y0=y-cam.y; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(180,255,90,.55)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X0-vx/v*10,Y0-vy/v*10); ctx.stroke();
        ctx.fillStyle='#d8ff7a'; ctx.beginPath(); ctx.arc(X0,Y0,3,0,7); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.fillRect(Math.round(X0)-1,Math.round(Y0)-1,2,2); ctx.restore(); }}); } }   /* đạn toả vòng của Pepe */
  for(const id of MIND.keys()) if(!seen.has(id)) MIND.delete(id);
  // người đang gục: bia mộ dưới chân + hồn bay lên
  for(const [pid,until] of DEAD){ if(now>until+1500){ DEAD.delete(pid); continue; } const p=posOf(pid); if(!p) continue;
    if(Math.random()<.12) burst(p[0]+rnd(-4,4),p[1]-10,1,{col:['#e8eef6','#c8d0e0'],kind:'dot',sp:[8,20],dir:-1.57,spread:.3,life:[.8,1.4],size:[2,3],add:false,up:25});
    list.push({y:p[1]+1,d:()=>{ const X0=Math.round(p[0]-cam.x), Y0=Math.round(p[1]-cam.y); ctx.save(); ctx.fillStyle='#5a5664'; ctx.fillRect(X0+8,Y0-12,8,12); ctx.fillStyle='#8a8494'; ctx.fillRect(X0+9,Y0-11,6,1); ctx.fillStyle='#2a2630'; ctx.fillRect(X0+11,Y0-10,2,6); ctx.fillRect(X0+9,Y0-8,6,2); ctx.restore(); }}); }
  // hiệu ứng trên người chơi: choáng = sao vàng quay trên đầu, chậm = vòng xanh dưới chân, độc = bong bóng xanh, thiêu đốt = lửa
  for(const [pid,f] of PFX){ if(now>f.stunEnd&&now>f.slowEnd&&now>f.dotEnd){ PFX.delete(pid); continue; } const p=posOf(pid); if(!p) continue;
    if(f.dot&&now<f.dotEnd&&Math.random()<.25) burst(p[0]+rnd(-6,6),p[1]-rnd(6,26),1,f.dot==='doc'?{col:['#6ae88a','#bfffc8'],kind:'dot',sp:[5,15],dir:-1.57,spread:.5,life:[.4,.8],size:[1.5,2.5],up:20}:{col:C_FIRE,kind:'spark',sp:[10,30],dir:-1.57,spread:.5,life:[.25,.5],up:30});
    list.push({y:p[1]+2,d:()=>{ const X0=p[0]-cam.x, Y0=p[1]-cam.y; ctx.save();
      if(now<f.slowEnd){ ctx.strokeStyle='rgba(120,200,255,.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(X0,Y0,9,3.5,0,clock*3,clock*3+4.5); ctx.stroke(); }
      if(now<f.stunEnd){ ctx.fillStyle='#ffe14a'; for(let k=0;k<3;k++){ const a=clock*5+k*2.09; ctx.fillRect(Math.round(X0+Math.cos(a)*8)-1,Math.round(Y0-44+Math.sin(a)*2.5)-1,3,3); } }
      ctx.restore(); }}); } }
window.MU8={tg:()=>({hov:HOV,lock:LOCK}),outline,swinging:pid=>here()&&(SWING.get(pid)||0)>performance.now(),deadAlpha:pid=>!here()?1:(GULP.get(pid)||0)>performance.now()?.12:(DEAD.get(pid)||0)>performance.now()?.35:1,   /* đang bị nuốt: gần như tàng hình trong bụng boss */moveMul:()=>{ if(!here()) return 1; const f=PFX.get(NET.pid), cm=(ME&&ME.cls&&M.cls[ME.cls]&&M.cls[ME.cls].move)||1; return (f&&performance.now()<f.slowEnd?f.slow:1)*cm; },
  stunned:()=>{ if(!here()) return false; if((DEAD.get(NET.pid)||0)>performance.now()) return true; const f=PFX.get(NET.pid); return !!(f&&performance.now()<f.stunEnd); },   /* gục: không điều khiển được */boss:()=>({list:BOSSES,next:NEXT}),burst,ring,shake,rnd,num:(x,y,v,o={})=>NUM.push({x,y,v,...o,t:performance.now()}),setImg,accImg,wImg,me:()=>ME,here,C_SMOKE,C_SPARK,C_GOLD};
setInterval(()=>{ if(here()&&(!ME)) NET.req({t:'mu',op:'view'}).then(r=>{ if(r&&r.me){ ME=r.me; MET=performance.now(); if(r.boss){ BOSSES=r.boss.list||[]; NEXT=r.boss.next||{}; } hud(); } }); else hudTick(); },1500);
})();
