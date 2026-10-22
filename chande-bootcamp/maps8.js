/* Chan City — MU Online (client): bảng chọn class ở Vệ binh (xem trước giáp + vũ khí), Pháp sư Cát hồi máu / bán ngọc, thanh máu + mana + 3 chiêu
   (phím 1 / 2 / 3, có vòng hồi chiêu), thanh máu Quỷ Vương + đếm giờ xuất hiện, hiệu ứng chiêu (chém, chém xoáy, tên bay, cầu lửa, sấm sét,
   mưa thiên thạch, hồi máu, gồng giáp), vòng cảnh báo chưởng boss, số sát thương bay lên, thách đấu 1 vs 1 (bấm E cạnh người chơi). */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, M=SD.MU, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a), $=s=>document.querySelector(s);
const here=()=>GAME.S&&GAME.S.kind==='mu', CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
let ME=null, MET=0, BOSS={on:0}, FX=[], NUM=[];
const posOf=pid=>{ if(pid===NET.pid) return [GAME.P.x,GAME.P.y]; const r=GAME.REM&&GAME.REM.get(pid); return r?[r.x,r.y]:null; };
NET.listen('mume',m=>{ ME=m.v; MET=performance.now(); hud(); });
NET.listen('muboss',m=>{ const was=BOSS.on; BOSS=m.v; if(BOSS.on&&!was&&here()){ GAME.bigText(BOSS.name.toUpperCase()+'!'); GAME.sfx('power_up',.7); } hud(); });
NET.listen('mufx',e=>{ if(!here()) return; const t=performance.now(); const from=e.from&&posOf(e.from), to=e.to==='boss'?[BOSS.x*T,BOSS.y*T-40]:e.to&&posOf(e.to);
  FX.push({...e,t,from,toP:to}); if(e.dmg&&to) NUM.push({x:to[0]+(Math.random()-.5)*16,y:to[1]-(e.to==='boss'?20:36),v:e.dmg,crit:e.crit,me:e.to===NET.pid,t:t+(e.k==='thienthach'?450:e.k==='set'?150:200)});
  if(e.k==='aoe') GAME.sfx('poof',.6); if(e.k==='bossdie'){ GAME.sfx('level_up',.8); GAME.bigText('HẠ BOSS!'); }
  if(e.from===NET.pid) GAME.sfx({chem:'dash',xoay:'dash',ban:'blip',tamtien:'blip',caulua:'poof',set:'power_up',thienthach:'poof',hoi:'item_pickup',gong:'power_up'}[e.k]||'dash',.35);
  if(e.to===NET.pid&&(e.k==='bosshit'||e.k==='aoehit')) GAME.sfx('poof',.4); });
NET.listen('muduel',m=>{ GAME.sfx('blip',.6); GAME.ask(`⚔ ${esc(m.name)} (${esc(M.cls[m.cls].name)} Lv${m.lv}) thách đấu bạn!`,'mu_guard',['Nhận lời','Từ chối'],async i=>{ if(i!==0) return; const r=await GAME.act({t:'mu',op:'accept',pid:m.from}); if(r&&!r.err){ GAME.bigText('THÁCH ĐẤU!'); } }); });
async function skill(i){ if(!here()||!ME||!ME.cls) return; const sk=M.skills[ME.cls][i]; if(!sk) return; const r=await NET.req({t:'mu',op:'skill',i}); if(r.err){ toast(esc(r.err),'lock'); return; } if(r.me){ ME=r.me; MET=performance.now(); hud(); } }
addEventListener('keydown',e=>{ if(!here()) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; if(UI.isOpen&&UI.isOpen()) return; const i=['1','2','3'].indexOf(e.key); if(i>=0){ e.preventDefault(); skill(i); } });
/* ---------- HUD: máu / mana / 3 ô chiêu có icon (góc dưới trái, trên ô chat), thanh boss mảnh ở trên cùng ---------- */
// icon chiêu 16×16 vẽ pixel
const SKI={chem:P=>{ for(let i=0;i<9;i++) P.rect(3+i,12-i,2,2,'#e8ecef'); P.rect(2,11,5,2,'#c8a23a'); P.rect(2,13,2,2,'#8a5a32'); },
  xoay:P=>{ for(let a=0;a<6;a++){ const x=8+Math.round(Math.cos(a)*5), y=8+Math.round(Math.sin(a)*5); P.rect(x,y,2,2,a%2?'#ff7a5a':'#e8ecef'); } P.rect(7,7,3,3,'#c8a23a'); },
  gong:P=>{ P.rect(4,2,9,10,'#c8a23a'); P.rect(5,3,7,8,'#e8302a'); P.rect(6,12,5,2,'#c8a23a'); P.rect(8,13,1,2,'#c8a23a'); P.rect(7,5,3,3,'#ffd84a'); },
  ban:P=>{ for(let i=0;i<10;i++) P.px(3+i,12-i,'#c8945a'); P.rect(12,2,3,3,'#e8ecef'); P.rect(2,12,3,2,'#ff4a5a'); },
  tamtien:P=>{ for(const o of [-3,0,3]) for(let i=0;i<8;i++) P.px(4+i+o,12-i,'#c8945a'); for(const o of [-3,0,3]) P.rect(11+o,3,2,2,'#e8ecef'); },
  hoi:P=>{ P.rect(6,2,4,12,'#5fe06a'); P.rect(2,6,12,4,'#5fe06a'); P.rect(7,3,2,10,'#c8ffd0'); },
  caulua:P=>{ P.disc(9,8,5,'#ff7a2a'); P.disc(9,8,3,'#ffd84a'); P.rect(2,6,4,2,'#ff9a3a'); P.rect(1,9,4,2,'#ff7a2a'); },
  set:P=>{ for(const [x,y,w] of [[8,1,4],[7,4,3],[5,7,6],[8,9,3],[7,11,2],[6,13,2]]) P.rect(x,y,w,2,'#ffd84a'); P.rect(8,7,2,2,'#ffffff'); },
  thienthach:P=>{ P.disc(10,10,4,'#c8401a'); P.disc(10,10,2,'#ffb03a'); for(let i=0;i<5;i++) P.px(2+i,2+i,'#ff9a3a'); for(let i=0;i<4;i++) P.px(5+i,1+i,'#ffd84a'); }};
const skIcon=k=>cached('ski'+k,()=>{ const c=A.cv(16,16); (SKI[k]||(()=>{}))(A.painter(c.getContext('2d'))); A.outline&&A.outline(c); const s=A.cv(32,32), g=s.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,32,32); return s.toDataURL(); });
function ensureHud(){ let h=$('#muHud'); if(h) return h; h=document.createElement('div'); h.id='muHud'; h.className='panel'; h.innerHTML='<div id="muMe"></div><div id="muSk"></div>';
  const box=$('#chatBox'); if(box) box.prepend(h); else document.body.appendChild(h);
  const bb=document.createElement('div'); bb.id='muBoss'; bb.className='panel'; document.body.appendChild(bb);
  h.addEventListener('click',e=>{ const b=e.target.closest('[data-musk]'); if(b){ e.preventDefault(); skill(+b.dataset.musk); } }); return h; }
function hud(){ const h=ensureHud(), b=$('#muBoss'); h.hidden=!here(); b.hidden=!here(); if(!here()) return; const me=$('#muMe'), sk=$('#muSk');
  b.innerHTML=BOSS.on?`<b>👹 ${esc(BOSS.name)}</b><span class="mubar boss"><i style="width:${Math.max(0,100*BOSS.hp/BOSS.max)}%"></i></span><small>${Math.max(0,Math.round(BOSS.hp))}/${BOSS.max}</small>`
    :`<small>👹 ${esc(BOSS.name||M.boss.name)} xuất hiện sau <b id="muCd">${fmtLeft((BOSS.next||0)-NET.now())}</b></small>`;
  if(!ME||!ME.cls){ me.innerHTML='<small>Gặp <b>Vệ binh</b> ở cổng thành để chọn class, nhận free giáp + vũ khí</small>'; sk.innerHTML=''; return; }
  const c=M.cls[ME.cls]; me.innerHTML=`<b style="color:${c.col}">${esc(c.name)}</b> <small>Lv${ME.lv} · EXP ${ME.exp}/${ME.next}${ME.duel?' · ⚔ đang thách đấu':''}${ME.buff?' · 🛡 gồng giáp':''}</small>
    <span class="mubar hp"><i style="width:${100*ME.hp/ME.max}%"></i><em>${ME.hp}/${ME.max}</em></span><span class="mubar mp"><i style="width:${100*ME.mp/ME.mmax}%"></i><em>${ME.mp}/${ME.mmax}</em></span>${ME.dead?'<small class="bad">💀 Đang gục, chờ hồi sinh...</small>':''}`;
  sk.innerHTML=M.skills[ME.cls].map((s,i)=>`<button class="musk" type="button" data-musk="${i}" title="${esc(s.name)} · ${s.mp} MP · hồi ${s.cd}s"><img src="${skIcon(s.k)}" width="32" height="32" alt=""><b>${i+1}</b><small>${s.mp}</small><i class="mucd" data-k="${s.k}"></i><span>${esc(s.name)}</span></button>`).join(''); }
const fmtLeft=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
function hudTick(){ const h=$('#muHud'); if(!h) return; if(h.hidden!==!here()) hud(); if(!here()) return; const cd=$('#muCd'); if(cd) cd.textContent=fmtLeft((BOSS.next||0)-NET.now());
  if(ME&&ME.cd){ const el=(performance.now()-MET); for(const i of document.querySelectorAll('.mucd')){ const k=i.dataset.k, s=M.skills[ME.cls].find(x=>x.k===k), left=Math.max(0,(ME.cd[k]||0)-el); i.style.height=s&&left>0?Math.min(100,100*left/(s.cd*1000))+'%':'0'; } } }
/* ---------- NPC: Vệ binh chọn class, Pháp sư Cát ---------- */
const clsImg=k=>{ const key='cls'+k+JSON.stringify(G().look); if(CACHE[key]) return CACHE[key]; const look=G().look, av=AVATAR.build({...look,outfit:{...look.outfit,top:M.cls[k].set}}), fr=av.anims.idle_down.frames[0], c=document.createElement('canvas'); c.width=64; c.height=90; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(fr,0,2,32,45,0,0,64,90); return CACHE[key]=c.toDataURL(); };
UI.defPlace('muguard',()=>UI.open('Vệ binh Lục Địa Cát · chọn class',()=>{ const cur=ME&&ME.cls;
  return `<p>"Chào chiến binh mới! Ở Lục Địa Cát ai cũng được tặng free 1 bộ giáp và vũ khí theo class. Chọn đi, ${cur?'đổi class tốn 300.000đ':'lần đầu miễn phí'}!"</p>
  <div class="mucls">${Object.entries(M.cls).map(([k,c])=>`<div class="mucl" style="--cc:${c.col}"><img src="${clsImg(k)}" width="64" height="90" alt=""><b>${esc(c.name)}</b><small>${esc(c.en)}</small><p>${esc(c.desc)}</p>
    <small class="muted">Máu ${c.hp} · Mana ${c.mp} · Công ${c.atk} · Thủ ${c.def}</small><ul>${M.skills[k].map((s,i)=>`<li><kbd>${i+1}</kbd> ${esc(s.name)}${s.mul?` · ×${s.mul} sát thương, tầm ${s.range} ô`:s.heal?` · hồi ${Math.round(s.heal*100)}% máu${s.team?' cả đội':''}`:''}${s.buff?' · giáp ×2':''}</li>`).join('')}</ul>
    ${cur===k?'<small class="good">✔ Class hiện tại</small>':btn('mucls',cur?'Đổi sang (300.000đ)':'Chọn class này',{k},'pri')}</div>`).join('')}</div>
  <p class="muted">Boss tổng <b>${esc(M.boss.name)}</b> xuất hiện mỗi 20 phút ở đền phía Bắc. Muốn thách đấu ai thì đứng gần người đó bấm E.</p>`; },{wide:true,static:true}));
UI.onAct('mucls',async d=>{ const r=await GAME.act({t:'mu',op:'class',cls:d.k}); if(r&&!r.err){ UI.closeAll(); GAME.sfx('level_up',.7); GAME.bigText(M.cls[d.k].name.toUpperCase()); toast(esc(r.msg),'item'); } });
UI.defPlace('mumage',()=>UI.open('Pháp sư Cát',()=>{ const it=G().items||{}; return `<p>"Ta hồi đầy máu và mana miễn phí. Có ngọc rơi từ Quỷ Vương thì bán cho ta!"</p>${btn('muheal','💗 Hồi đầy máu + mana',{},'pri')}
  <div class="list">${['ngoc_uoc','ngoc_tam_linh','ngoc_hon_nguyen'].map(k=>`<div class="row">${UI.ico(SD.ITEMS[k].icon)}<span><b>${esc(SD.ITEMS[k].name)}</b> <small class="muted">· có ${it[k]||0}</small></span><span>${SD.fmt({ngoc_uoc:150000,ngoc_tam_linh:200000,ngoc_hon_nguyen:400000}[k])}</span>${(it[k]||0)?btn('musell','Bán 1',{k}):''}</div>`).join('')}</div>`; }));
UI.onAct('muheal',async()=>{ const r=await GAME.act({t:'mu',op:'heal'}); if(r&&!r.err) toast(esc(r.msg),'item'); });
UI.onAct('musell',async d=>{ const r=await GAME.act({t:'mu',op:'sell',k:d.k}); if(r&&!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
/* ---------- thách đấu: bấm E cạnh người chơi khác ---------- */
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()||!ME||!ME.cls||ME.duel) return; const R=GAME.REM; if(!R) return;
  for(const r of R.values()){ if(!r.name) continue; const d=dist(r.x,r.y); if(d<34) consider(d+6,{type:'mapx',k:'muduel',pid:r.id,label:'⚔ Thách đấu '+r.name}); } };
const p0=X.pick; X.pick=async x=>{ if(x.k==='muduel'){ const r=await GAME.act({t:'mu',op:'duel',pid:x.pid}); if(r&&!r.err) toast(esc(r.msg),'quest'); return; } return p0(x); };
/* ---------- vẽ: boss, vòng cảnh báo, hiệu ứng chiêu ---------- */
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim; if(a==='mualtar'){ const f=Math.floor(clock*2)%2; return cached('al'+f,()=>A.muAltar(f)); } if(a==='mutorch'){ const f=(Math.floor(clock*6)+Math.round(o.x/16))%2; return cached('tc'+f,()=>A.muTorch(f)); }
  if(a==='mufount'){ const f=Math.floor(clock*3)%2; return cached('fo'+f,()=>A.muFountain(f)); } return a0(o,clock); };
let lastHud=0;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const now=performance.now(); if(now-lastHud>250){ lastHud=now; hudTick(); } if(!here()) return; const cam=GAME.cam, clock=GAME.clock;
  if(BOSS.on){ const x=BOSS.x*T, y=BOSS.y*T, hit=FX.some(f=>f.to==='boss'&&now-f.t<120), sp=cached('bs'+(Math.floor(clock*1.5)%2)+hit,()=>A.muBoss(Math.floor(clock*1.5)%2,hit));
    list.push({y,d:()=>{ GAME.shadow(x,y,26); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }});
    if(BOSS.tele){ const z=BOSS.tele, k=Math.max(0,Math.min(1,1-(z.at-NET.now())/(M.boss.aoe.warn*1000))); list.push({y:-9998,d:()=>{ ctx.save(); ctx.globalAlpha=.25+.35*Math.abs(Math.sin(clock*10)); ctx.fillStyle='#ff2a4a'; ctx.beginPath(); ctx.ellipse(z.x*T-cam.x,z.y*T-cam.y,z.r*T,z.r*T*.6,0,0,7); ctx.fill();
      ctx.globalAlpha=.8; ctx.strokeStyle='#ffd84a'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(z.x*T-cam.x,z.y*T-cam.y,z.r*T*k,z.r*T*.6*k,0,0,7); ctx.stroke(); ctx.restore(); }}); } }
  FX=FX.filter(f=>now-f.t<900); list.push({y:99999,d:()=>{ for(const f of FX) fx(ctx,f,now,cam); }}); };
function fx(g,f,now,cam){ const k=(now-f.t)/1000, P=f.from, Q=f.toP, X0=p=>p[0]-cam.x, Y0=p=>p[1]-cam.y; g.save();
  const line=(c,w,pts)=>{ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); };
  if((f.k==='chem'||f.k==='xoay')&&P&&k<.3){ const cx=X0(P), cy=Y0(P)-20, a=Q?Math.atan2(Q[1]-P[1],Q[0]-P[0]):0; g.strokeStyle=f.k==='xoay'?'#ff7a5a':'#ffffff'; g.lineWidth=3; g.globalAlpha=1-k/.3; g.beginPath();
    if(f.k==='xoay') g.arc(cx,cy+8,18+k*30,0,7); else g.arc(cx,cy,16,a-1.1+k*6,a-1.1+k*6+1.6); g.stroke(); }
  if((f.k==='ban'||f.k==='tamtien')&&P&&Q&&k<.35){ const n=f.k==='tamtien'?3:1; for(let i=0;i<n;i++){ const kk=Math.min(1,k/.3), x=X0(P)+(X0(Q)-X0(P))*kk, y=Y0(P)-24+(Y0(Q)-Y0(P)+4)*kk+(i-1)*5; line('#f4e8c8',2,[[x-5,y],[x+5,y]]); g.fillStyle='#c8a23a'; g.fillRect(x+4,y-1,3,3); } }
  if(f.k==='caulua'&&P&&Q){ const kk=Math.min(1,k/.35), x=X0(P)+(X0(Q)-X0(P))*kk, y=Y0(P)-24+(Y0(Q)-Y0(P)+4)*kk; if(kk<1){ g.fillStyle='#ff7a2a'; g.beginPath(); g.arc(x,y,5,0,7); g.fill(); g.fillStyle='#ffd84a'; g.beginPath(); g.arc(x,y,3,0,7); g.fill(); } else if(k<.6){ g.globalAlpha=1-(k-.35)/.25; g.fillStyle='#ff9a3a'; g.beginPath(); g.arc(X0(Q),Y0(Q)-10,8+(k-.35)*40,0,7); g.fill(); } }
  if(f.k==='set'&&Q&&k<.35){ const x=X0(Q), y=Y0(Q)-10; g.globalAlpha=1-k/.35; const pts=[[x,y-90]]; for(let i=1;i<6;i++) pts.push([x+(i%2?8:-8)*(Math.random()+.3),y-90+i*16]); pts.push([x,y]); line('#bff0ff',3,pts); line('#ffffff',1,pts); }
  if(f.k==='thienthach'&&Q&&k<.8){ for(let i=0;i<3;i++){ const kk=Math.min(1,Math.max(0,(k-i*.12)/.35)), x=X0(Q)-40+40*kk+(i-1)*10, y=Y0(Q)-110+100*kk; if(kk<1){ g.fillStyle='#c8401a'; g.beginPath(); g.arc(x,y,5,0,7); g.fill(); line('rgba(255,160,60,.7)',3,[[x-14,y-14],[x,y]]); } else if(k-i*.12<.65){ g.globalAlpha=.7; g.fillStyle='#ffb03a'; g.beginPath(); g.arc(X0(Q)+(i-1)*10,Y0(Q)-6,10,0,7); g.fill(); g.globalAlpha=1; } } }
  if(f.k==='hoi'&&f.heal) for(const pid of f.heal){ const p=posOf(pid); if(!p) continue; g.globalAlpha=1-k/.9; g.fillStyle='#5fe06a'; for(let i=0;i<4;i++){ const x=p[0]-cam.x-8+i*5, y=p[1]-cam.y-20-k*30-(i%2)*6; g.fillRect(x-1,y-3,2,6); g.fillRect(x-3,y-1,6,2); } }
  if(f.k==='gong'&&P&&k<.8){ g.globalAlpha=1-k/.8; g.strokeStyle='#ffd84a'; g.lineWidth=2; g.beginPath(); g.ellipse(X0(P),Y0(P)-16,12+k*10,22+k*10,0,0,7); g.stroke(); }
  if(f.k==='bosshit'&&Q&&k<.3){ g.globalAlpha=1-k/.3; for(let i=0;i<3;i++) line('#ff2a4a',2,[[X0(Q)-10+i*6,Y0(Q)-40],[X0(Q)-16+i*6,Y0(Q)-14]]); }
  if(f.k==='pet'&&P&&Q&&k<.5){ const c=(SD.LC_TYPES[(SD.LC_SPECIES[f.sp]||{}).t]||{}).col||'#ffffff', kk=Math.min(1,k/.4), x=X0(P)-18+(X0(Q)-X0(P)+18)*kk, y=Y0(P)-8+(Y0(Q)-Y0(P)+8)*kk-Math.sin(kk*Math.PI)*18;
    if(kk<1){ g.fillStyle=c; g.beginPath(); g.arc(x,y,4,0,7); g.fill(); g.globalAlpha=.4; g.beginPath(); g.arc(x-4,y+2,3,0,7); g.fill(); } else { g.globalAlpha=1-(k-.4)/.1; g.fillStyle=c; g.beginPath(); g.arc(X0(Q),Y0(Q)-10,10,0,7); g.fill(); } }
  if(f.k==='aoe'&&k<.6){ g.globalAlpha=1-k/.6; g.fillStyle='#8a2ad8'; g.beginPath(); g.ellipse(f.x*T-cam.x,f.y*T-cam.y,f.r*T*(1+k),f.r*T*.6*(1+k),0,0,7); g.fill(); }
  g.restore(); }
// số sát thương: vẽ ở lớp giao diện cho chữ nét
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); if(!here()) return; const now=performance.now(); NUM=NUM.filter(n=>now-n.t<900);
  ug.textAlign='center'; ug.textBaseline='bottom'; for(const n of NUM){ const k=(now-n.t)/900; if(k<0) continue; ug.font=n.crit?'22px VT323, monospace':'18px VT323, monospace'; const X=sx(n.x), Y=sy(n.y)-k*30; ug.globalAlpha=1-k;
    ug.fillStyle='#120c16'; ug.fillText((n.crit?'💥':'')+n.v,X+1,Y+1); ug.fillStyle=n.me?'#ff5a5a':n.crit?'#ffb03a':'#ffd84a'; ug.fillText((n.crit?'💥':'')+n.v,X,Y); ug.globalAlpha=1; }
  if(BOSS.on){ ug.font='16px VT323, monospace'; tag(sx(BOSS.x*T),sy(BOSS.y*T-96),BOSS.name,'','#ff6a8a'); } };
setInterval(()=>{ if(here()&&(!ME)) NET.req({t:'mu',op:'view'}).then(r=>{ if(r&&r.me){ ME=r.me; MET=performance.now(); BOSS=r.boss||BOSS; hud(); } }); else hudTick(); },1500);
})();
