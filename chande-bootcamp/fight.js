/* Chan City — đấu game đối kháng với Evangelion Unit-01 ở góc game Group Nghiện Motion.
   1 hiệp 45 giây: đi, nhảy, đấm (nhanh), đá (xa, mạnh, nhảy qua được), đỡ (giảm 80%), Chưởng Keyframe khi đầy năng lượng.
   Eva có AI: áp sát, ra đòn có báo trước (mắt loé), đỡ bằng AT Field, lâu lâu lao tới kiểu Berserk. Kết quả gửi server tính EXP + nhiệm vụ. */
(function(){
const A=ART, $=s=>document.querySelector(s), W=320, H=150, FLOOR=134, TIME=45, G_=620, JUMP=235;
const MOVES={punch:{st:.07,ac:.1,rc:.16,rng:30,dmg:6,kb:70,hi:true},kick:{st:.16,ac:.12,rc:.26,rng:44,dmg:11,kb:150,hi:false}};
const EVA_ST={punch:.21,kick:.33};   // Eva ra đòn chậm hơn chút để người chơi kịp đỡ
const KEYS={lf:['a','arrowleft','lf'],rt:['d','arrowright','rt'],up:['w','arrowup',' ','up'],pun:['j','pun'],kik:['k','kik'],blk:['l','s','arrowdown','blk'],spc:['i','u','spc']};
let F=null, raf=0, bg=null;
const WHITE=new WeakMap(), white=c=>{ let o=WHITE.get(c); if(o) return o; o=document.createElement('canvas'); o.width=c.width; o.height=c.height; const g=o.getContext('2d'); g.drawImage(c,0,0); g.globalCompositeOperation='source-atop'; g.fillStyle='#fff'; g.fillRect(0,0,o.width,o.height); WHITE.set(c,o); return o; };
const EVA=[0,1,2,3].map(f=>A.eva(f));
const fighter=(x,face,name)=>({x,y:0,vy:0,vx:0,face,hp:100,meter:0,mv:null,stun:0,flash:0,block:false,blockT:0,walk:false,combo:0,comboT:0,name,think:.6,back:0,tele:0,dash:null});

/* ---------- phông: Tokyo-3 về đêm, sàn lưới neon ---------- */
function makeBg(){ const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'), sky=g.createLinearGradient(0,0,0,FLOOR);
  sky.addColorStop(0,'#090c22'); sky.addColorStop(.6,'#1c2350'); sky.addColorStop(1,'#3a2a5a'); g.fillStyle=sky; g.fillRect(0,0,W,FLOOR);
  g.fillStyle='#f4e8c8'; g.beginPath(); g.arc(258,30,11,0,7); g.fill(); g.fillStyle='#1c2350'; g.beginPath(); g.arc(263,27,10,0,7); g.fill();
  for(let i=0;i<60;i++){ g.fillStyle=`rgba(255,255,255,${.3+((i*37)%7)/10})`; g.fillRect((i*53)%W,(i*29)%60,1,1); }
  let x=0, k=0; while(x<W){ const w=14+((k*7)%13), h=26+((k*31)%46); g.fillStyle=k%2?'#141a38':'#10152e'; g.fillRect(x,FLOOR-h,w,h);
    for(let yy=FLOOR-h+4;yy<FLOOR-4;yy+=5) for(let xx=x+3;xx<x+w-2;xx+=4) if(((xx*13+yy*7+k)%5)<2){ g.fillStyle=((xx+yy)%3)?'#ffd86a':'#7fd0ff'; g.fillRect(xx,yy,2,2); } x+=w+1; k++; }
  g.fillStyle='#ff4a8a'; g.fillRect(60,FLOOR-74,2,8); g.fillRect(200,FLOOR-66,2,6);
  g.fillStyle='#120c24'; g.fillRect(0,FLOOR,W,H-FLOOR); g.strokeStyle='rgba(255,74,180,.55)'; g.lineWidth=1;
  for(let i=-10;i<=10;i++){ g.beginPath(); g.moveTo(W/2+i*8,FLOOR); g.lineTo(W/2+i*40,H); g.stroke(); }
  for(const yy of [FLOOR+3,FLOOR+7,FLOOR+12]){ g.beginPath(); g.moveTo(0,yy+.5); g.lineTo(W,yy+.5); g.stroke(); }
  g.fillStyle='#7fd0ff'; g.fillRect(0,FLOOR,W,1); return c; }

/* ---------- bắt đầu ---------- */
UI.evaFight=(lv=0)=>{ stop(); bg=bg||makeBg(); const look=GAME.G.look;
  F={lv:Math.max(0,Math.min(2,lv|0)),phase:'intro',t:0,timer:TIME,p:fighter(90,1,GAME.G.name||'Bạn'),e:fighter(230,-1,'EVA-01'),av:AVATAR.build(look).anims,shots:[],fx:[],shake:0,keys:new Set(),edge:new Set(),touch:new Set(),sent:false,last:performance.now(),slow:1};
  const pad=[['lf','◀'],['rt','▶'],['up','⤒ Nhảy'],['blk','🛡 Đỡ'],['pun','👊 Đấm'],['kik','🦶 Đá'],['spc','⚡ Chưởng']].map(([k,l])=>`<button class="btn sm" data-fk="${k}" type="button">${l}</button>`).join('');
  UI.open('⚔ Đấu game với Evangelion Unit-01',()=>`<canvas id="fgCv" width="${W}" height="${H}"></canvas><div class="fgPad">${pad}</div>
    <p class="muted fgHelp"><kbd>A</kbd><kbd>D</kbd> đi · <kbd>W</kbd>/<kbd>Space</kbd> nhảy · <kbd>J</kbd> đấm · <kbd>K</kbd> đá · <kbd>L</kbd>/<kbd>S</kbd> đỡ · <kbd>I</kbd> Chưởng Keyframe (đầy thanh xanh). Đá thấp thì nhảy qua, mắt Eva loé đỏ là sắp lao tới!</p>`,{static:true,wide:true});
  setTimeout(()=>{ for(const b of document.querySelectorAll('[data-fk]')){ const k=b.dataset.fk, up=e=>{ e.preventDefault(); F&&F.touch.delete(k); b.classList.remove('on'); };
      b.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!F) return; F.touch.add(k); F.edge.add(k); b.classList.add('on'); }); for(const ev of ['pointerup','pointercancel','pointerleave']) b.addEventListener(ev,up); }
    GAME.sfx('power_up',.4); F.last=performance.now(); raf=requestAnimationFrame(loop); },0); };
const k0=UI.keys; UI.keys=(pressed,keys)=>{ k0&&k0(pressed,keys); if(F){ F.keys=keys; for(const k of pressed) F.edge.add(k); } };
function stop(){ cancelAnimationFrame(raf); raf=0; F=null; }
const held=n=>KEYS[n].some(k=>F.keys.has(k)||F.touch.has(k)), tap=n=>KEYS[n].some(k=>F.edge.has(k));

/* ---------- vòng lặp ---------- */
function loop(now){ const cv=$('#fgCv'); if(!F) return;
  if(!cv){ if(!F.sent&&F.phase!=='done'){ F.sent=true; GAME.act({t:'nm',op:'gameEnd',win:false}).then(r=>{ if(r&&!r.err) GAME.toast('Bỏ ngang trận đấu, tính là thua · '+GAME.esc(r.msg),'lock'); }); } stop(); return; }
  const dt=Math.max(0,Math.min(.05,(now-F.last)/1000))*F.slow; F.last=Math.max(F.last,now); /* khung đầu rAF có thể sớm hơn lúc bắt đầu */ update(dt); render(cv.getContext('2d')); F.edge.clear(); if(F) raf=requestAnimationFrame(loop); }
function update(dt){ F.t+=dt; const P=F.p, E=F.e;
  for(const f of [P,E]){ f.flash=Math.max(0,f.flash-dt); if(f.comboT>0&&(f.comboT-=dt)<=0) f.combo=0; }
  F.shake=Math.max(0,F.shake-dt*30); F.fx=F.fx.filter(x=>(x.t+=dt)<x.life);
  if(F.phase==='intro'){ if(F.t>=2.4){ F.phase='fight'; F.t=0; GAME.sfx('dash',.5); } return; }
  if(F.phase==='end'){ F.slow=Math.min(1,F.slow+dt*.8); physics(P,dt); physics(E,dt); if(F.t>=2.3) finish(); return; }
  F.timer-=dt; control(P,E,dt); ai(E,P,dt); for(const f of [P,E]){ moveStep(f,f===P?E:P,dt); physics(f,dt); }
  if(Math.abs(P.x-E.x)<20){ const m=(P.x+E.x)/2, s=P.x<E.x?-1:1; P.x=m+s*10; E.x=m-s*10; }
  for(const s of F.shots){ s.x+=s.v*dt; s.t+=dt; const tg=s.owner===P?E:P; if(!s.dead&&Math.abs(tg.x-s.x)<14&&tg.y>-22){ s.dead=true; hit(s.owner,tg,{dmg:18,kb:180},'shot'); } if(s.x<-20||s.x>W+20) s.dead=true; }
  F.shots=F.shots.filter(s=>!s.dead);
  if(P.hp<=0||E.hp<=0||F.timer<=0){ F.phase='end'; F.t=0; F.slow=.25; F.win=E.hp<=0||(F.timer<=0&&P.hp/100>E.hp/100&&P.hp>0); F.ko=P.hp<=0||E.hp<=0; F.timer=Math.max(0,F.timer);
    GAME.sfx(F.win?'level_up':'poof',.6); F.shake=8; } }
function physics(f,dt){ f.vy+=G_*dt; f.y=Math.min(0,f.y+f.vy*dt); if(f.y>=0) f.vy=0; f.x+=f.vx*dt; f.vx*=Math.pow(.004,dt); f.x=Math.max(22,Math.min(W-22,f.x)); }
function start(f,k){ f.mv={k,t:0,done:false}; GAME.sfx('dash',.25); }
function moveStep(f,o,dt){ if(f.dash){ f.dash.t+=dt; f.x+=f.face*270*dt; const d=(o.x-f.x)*f.face; if(!f.dash.done&&d<16&&d>-6&&o.y>-22){ f.dash.done=true; hit(f,o,{dmg:16,kb:210},'dash'); }
    if(f.dash.t>=.5||f.x<=24||f.x>=W-24) f.dash=null; return; }
  if(!f.mv) return; const M=MOVES[f.mv.k], st=f===F.e?EVA_ST[f.mv.k]:M.st; f.mv.t+=dt;
  if(!f.mv.done&&f.mv.t>=st&&f.mv.t<=st+M.ac){ const d=(o.x-f.x)*f.face; if(d>0&&d<=M.rng+8&&(M.hi||o.y>-18)){ f.mv.done=true; hit(f,o,M,f.mv.k); } }
  if(f.mv.t>=st+M.ac+M.rc) f.mv=null; }
// trúng đòn: đỡ đúng hướng thì giảm 80%, không thì choáng + bật lùi + combo + đầy năng lượng
function hit(a,d,M,kind){ const by=FLOOR+d.y-(kind==='kick'?16:44), bx=d.x-a.face*8;
  if(d.block&&d.face===-a.face){ const dmg=Math.max(1,Math.round(M.dmg*.2)); d.hp=Math.max(0,d.hp-dmg); d.vx=a.face*M.kb*.4; d.meter=Math.min(100,d.meter+8);
    F.fx.push({k:'block',x:bx,y:by,t:0,life:.3,c:d===F.e?'#ff9a3a':'#7fd0ff'}); GAME.sfx('blip',.35); return; }
  d.hp=Math.max(0,d.hp-M.dmg); d.stun=kind==='shot'||kind==='dash'?.45:.28; d.flash=.12; d.vx=a.face*M.kb; d.mv=null; d.dash=null; d.tele=0;
  a.combo++; a.comboT=.9; a.meter=Math.min(100,a.meter+14); d.meter=Math.min(100,d.meter+9); F.shake=kind==='punch'?2:4;
  F.fx.push({k:'spark',x:bx,y:by,t:0,life:.25},{k:'num',x:d.x,y:by-10,t:0,life:.7,v:M.dmg}); GAME.sfx('poof',.4); }
function control(P,E,dt){ P.face=E.x>P.x?1:-1; if(P.stun>0){ P.stun-=dt; P.block=false; return; } if(P.mv){ P.block=false; return; }
  P.block=held('blk')&&P.y===0; P.walk=false; if(P.block) return;
  const dx=(held('rt')?1:0)-(held('lf')?1:0); if(dx){ P.x+=dx*(P.y<0?80:100)*dt; P.walk=true; }
  if(tap('up')&&P.y===0) P.vy=-JUMP;
  if(tap('spc')&&P.meter>=100){ P.meter=0; F.shots.push({owner:P,x:P.x+P.face*18,v:P.face*200,t:0}); GAME.sfx('power_up',.5); P.mv={k:'punch',t:0,done:true}; return; }
  if(tap('pun')) start(P,'punch'); else if(tap('kik')) start(P,'kick'); }
// AI của Eva: cấp càng cao (đã thắng Eva càng nhiều) phản xạ càng nhanh
function ai(E,P,dt){ E.face=P.x>E.x?1:-1; E.walk=false; if(E.stun>0){ E.stun-=dt; E.block=false; return; } if(E.dash) return;
  if(E.tele>0){ E.tele-=dt; E.block=false; if(E.tele<=0){ E.dash={t:0,done:false}; GAME.sfx('power_up',.5); } return; }
  if(E.blockT>0){ E.blockT-=dt; E.block=true; return; } E.block=false; if(E.mv) return;
  const d=Math.abs(P.x-E.x), lv=F.lv; E.think-=dt;
  if(E.think<=0){ E.think=.34-.06*lv+Math.random()*.22;
    const threat=(P.mv&&!P.mv.done&&d<58)||F.shots.some(s=>s.owner===P&&Math.abs(s.x-E.x)<90);
    if(threat&&Math.random()<.32+.13*lv){ if(F.shots.length&&E.y===0&&Math.random()<.5) E.vy=-JUMP; else E.blockT=.42; return; }
    if(E.meter>=100&&d>70&&Math.random()<.6){ E.meter=0; E.tele=.55; return; }
    if(d<=46){ const r=Math.random(); if(r<.42) start(E,'punch'); else if(r<.78) start(E,'kick'); else E.back=.35; return; } }
  if(E.back>0){ E.back-=dt; E.x-=E.face*70*dt; E.walk=true; } else if(d>40){ E.x+=E.face*(60+12*lv)*dt; E.walk=true; } }

/* ---------- vẽ ---------- */
function render(g){ g.imageSmoothingEnabled=false; g.save(); if(F.shake>0) g.translate(Math.round((Math.random()-.5)*F.shake),Math.round((Math.random()-.5)*F.shake));
  g.drawImage(bg,0,0); const P=F.p, E=F.e;
  for(const f of [P,E]){ g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(f.x,FLOOR+1,14+f.y/8,3,0,0,7); g.fill(); }
  drawEva(g,E); drawMe(g,P);
  for(const s of F.shots){ const X=Math.round(s.x), Y=FLOOR-30, r=6+Math.sin(s.t*30); g.fillStyle='rgba(127,208,255,.35)'; g.beginPath(); g.arc(X,Y,r+5,0,7); g.fill();
    g.fillStyle='#bff0ff'; g.beginPath(); g.moveTo(X,Y-r); g.lineTo(X+r,Y); g.lineTo(X,Y+r); g.lineTo(X-r,Y); g.closePath(); g.fill(); g.fillStyle='#ffffff'; g.fillRect(X-1,Y-1,3,3);
    for(let i=1;i<5;i++){ g.fillStyle=`rgba(127,208,255,${.5-i*.1})`; g.fillRect(X-s.v/Math.abs(s.v)*i*7-2,Y-2,4,4); } }
  for(const x of F.fx){ const k=x.t/x.life;
    if(x.k==='spark'){ g.fillStyle=`rgba(255,240,160,${1-k})`; const r=4+k*10; for(let i=0;i<8;i++){ const a=i*Math.PI/4; g.fillRect(Math.round(x.x+Math.cos(a)*r)-1,Math.round(x.y+Math.sin(a)*r)-1,3,3); } g.fillStyle=`rgba(255,255,255,${1-k})`; g.fillRect(x.x-2,x.y-2,5,5); }
    if(x.k==='block'){ g.strokeStyle=x.c; g.globalAlpha=1-k; g.lineWidth=2; g.beginPath(); g.arc(x.x,x.y,4+k*12,0,7); g.stroke(); g.globalAlpha=1; }
    if(x.k==='num'){ g.font='14px VT323, monospace'; g.textAlign='center'; g.fillStyle='#120c16'; g.fillText('-'+x.v,x.x+1,x.y-k*14+1); g.fillStyle='#ffd84a'; g.fillText('-'+x.v,x.x,x.y-k*14); } }
  g.restore(); hud(g); }
function frameOf(f,an){ const a=f.stun>0?an.hurt:f.mv?an.attack:f.y<0||f.walk?an.walk:an.idle; const fr=f.mv?Math.min(a.frames.length-1,Math.floor(f.mv.t/.07)):Math.floor(F.t*a.fps)%a.frames.length; return a.frames[f.stun>0?1:fr]; }
function drawMe(g,P){ const c=frameOf(P,F.av), s=1.5, img=P.flash>0?white(c):c; g.save(); g.translate(Math.round(P.x),Math.round(FLOOR+P.y)); g.scale(P.face*s,s); g.drawImage(img,-16,-47); g.restore();
  if(P.mv&&P.mv.k==='kick'&&!P.mv.done||P.mv&&P.mv.k==='kick'&&P.mv.t<.4){ const e=Math.min(1,P.mv.t/.16)*(P.mv.t>.32?Math.max(0,1-(P.mv.t-.32)/.2):1), x0=P.x+P.face*6, x1=x0+P.face*(6+e*30), y=FLOOR+P.y-14;
    g.fillStyle='#2a2a34'; g.fillRect(Math.min(x0,x1),y,Math.abs(x1-x0),6); g.fillStyle='#f2f2f0'; g.fillRect(x1-(P.face>0?0:6),y-1,6,8); if(e>.6){ g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(Math.min(x0,x1),y-3,Math.abs(x1-x0),1); } }
  if(P.block){ g.strokeStyle='rgba(127,208,255,.9)'; g.fillStyle='rgba(127,208,255,.25)'; hexa(g,P.x+P.face*16,FLOOR+P.y-36,15); } }
function drawEva(g,E){ const fr=Math.floor(F.t*2.2)%2+(E.tele>0||E.dash?2:0), c=EVA[fr].c, s=1.85, img=E.flash>0?white(c):c, X=Math.round(E.x), Y=Math.round(FLOOR+E.y);
  if(E.dash) for(let i=1;i<4;i++){ g.globalAlpha=.25/i; g.drawImage(white(c),X-E.face*i*12-EVA[0].ax*s,Y-EVA[0].ay*s,c.width*s,c.height*s); } g.globalAlpha=1;
  const ext=(t,st,M)=>t<st?0:Math.min(1,(t-st)/.05)*(t>st+M.ac?Math.max(0,1-(t-st-M.ac)/M.rc):1);
  if(E.mv){ const M=MOVES[E.mv.k], st=EVA_ST[E.mv.k], e=ext(E.mv.t,st,M), lo=E.mv.k==='kick', y=Y-(lo?18:58), x0=X+E.face*12, x1=x0+E.face*(4+e*(lo?34:24));
    g.fillStyle='#6a3ab0'; g.fillRect(Math.min(x0,x1),y,Math.abs(x1-x0),lo?9:8); g.fillStyle='#5fe06a'; g.fillRect(Math.min(x0,x1),y+(lo?6:5),Math.abs(x1-x0),2); g.fillStyle=lo?'#4a2488':'#5fe06a'; g.fillRect(x1-(E.face>0?0:9),y-1,9,lo?10:10);
    if(E.mv.t<st){ g.fillStyle=Math.floor(F.t*20)%2?'#ffffff':'#ff4a3a'; g.fillRect(X-2,Y-88,5,5); } }
  g.drawImage(img,X-EVA[0].ax*s,Y-EVA[0].ay*s,c.width*s,c.height*s);
  if(E.tele>0){ g.fillStyle=`rgba(255,40,40,${.4+.4*Math.sin(F.t*40)})`; g.fillRect(X-10,Y-74,7,4); g.fillRect(X+3,Y-74,7,4); g.font='14px VT323, monospace'; g.textAlign='center'; g.fillStyle='#ff4a3a'; g.fillText('BERSERK!',X,Y-94); }
  if(E.block){ g.strokeStyle='rgba(255,154,58,.95)'; g.fillStyle='rgba(255,154,58,.22)'; hexa(g,X+E.face*20,Y-46,24,8); g.font='14px VT323, monospace'; g.textAlign='center'; g.fillStyle='#ffb05a'; g.fillText('A.T. FIELD',X+E.face*20,Y-74); } }
function hexa(g,x,y,r,n=6){ g.lineWidth=2; g.beginPath(); for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2+Math.PI/n; g.lineTo(x+Math.cos(a)*r*.6,y+Math.sin(a)*r); } g.fill(); g.stroke(); }
function bar(g,x,y,w,v,right){ g.fillStyle='#120c16'; g.fillRect(x-1,y-1,w+2,9); g.fillStyle='#3a1a1e'; g.fillRect(x,y,w,7); const c=v>50?'#5fe06a':v>25?'#ffd84a':'#ff4a3a', ww=Math.round(w*v/100);
  g.fillStyle=c; g.fillRect(right?x+w-ww:x,y,ww,7); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(right?x+w-ww:x,y,ww,2); }
function hud(g){ const P=F.p, E=F.e; g.font='14px VT323, monospace'; g.textBaseline='alphabetic';
  bar(g,8,8,120,P.hp,false); bar(g,W-128,8,120,E.hp,true);
  for(const [f,x,right] of [[P,8,false],[E,W-128,true]]){ g.fillStyle='#120c16'; g.fillRect(x-1,18,62,5); g.fillStyle=f.meter>=100&&Math.floor(F.t*6)%2?'#ffffff':'#7fd0ff'; g.fillRect(right?x+120-Math.round(60*f.meter/100):x,19,Math.round(60*f.meter/100),3); }
  g.textAlign='left'; g.fillStyle='#ffd84a'; g.fillText(String(P.name).slice(0,16),8,33); g.textAlign='right'; g.fillText('EVA-01',W-8,33);
  if(P.meter>=100&&F.phase==='fight'){ g.textAlign='left'; g.fillStyle=Math.floor(F.t*4)%2?'#bff0ff':'#7fd0ff'; g.fillText('CHƯỞNG SẴN SÀNG (I)',8,44); }
  g.textAlign='center'; g.fillStyle='#120c16'; g.fillRect(W/2-14,4,28,16); g.fillStyle=F.timer<10?'#ff4a3a':'#f4f1ea'; g.font='16px VT323, monospace'; g.fillText(String(Math.ceil(F.timer)),W/2,17);
  for(const [f,x] of [[P,70],[E,W-70]]) if(f.combo>=2){ g.font='14px VT323, monospace'; g.fillStyle='#ff9a3a'; g.fillText(f.combo+' HIT!',x,58); }
  const big=(t,c)=>{ g.font='34px VT323, monospace'; g.textAlign='center'; g.fillStyle='#120c16'; g.fillText(t,W/2+2,H/2+2); g.fillStyle=c; g.fillText(t,W/2,H/2); };
  if(F.phase==='intro') big(F.t<.7?'3':F.t<1.4?'2':F.t<2.1?'1':'ĐẤU!',F.t<2.1?'#f4f1ea':'#ffd84a');
  if(F.phase==='end'){ if(F.t<1.1) big(F.ko?'K.O.!':'HẾT GIỜ!','#ff4a3a'); else big(F.win?'BẠN THẮNG!':'EVA THẮNG','#ffd84a'); } }
async function finish(){ if(!F||F.sent) return; F.sent=true; F.phase='done'; const win=!!F.win; const r=await GAME.act({t:'nm',op:'gameEnd',win}); stop(); UI.closeAll(); if(r&&!r.err) GAME.toast(GAME.esc(r.msg),win?'item':'quest'); }
})();
