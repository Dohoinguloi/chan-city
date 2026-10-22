/* Chan City — MU Online (client) phần 2:
   · rừng quái phía Nam (server muforest.js): vẽ quái đi mượt, khung vung đòn + vùng báo đòn dưới đất, đạn của quái đánh xa, chớp khi trúng đòn, mờ dần khi chết,
     thanh máu + tên / cấp khi lại gần, chiến lợi phẩm bay lên chỗ quái chết, chấm đỏ trên minimap;
   · Phù Thuỷ Cường Hoá: khắc 12 lỗ cho vũ khí / giáp / set legacy / phụ kiện / giày (tỉ lệ theo cấp + Lính Cát đầu đội), mua ngọc, quà Lính Cát huyền thoại, thu mua chiến lợi phẩm;
   · Tiệm Giày Lướt Gió: 15 đôi giày (ô Giày) đi nhanh hơn + chỉ số MU;
   · mọi map: vũ khí Thợ Rèn cầm trên tay (mình và người khác, từ +7 phát sáng theo hệ), ván trượt / patin dưới chân. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, M=SD.MU, F=M.forest, KI=Object.keys(F.mobs), E=SD.ENH, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a);
const here=()=>GAME.S&&GAME.S.kind==='mu', U=()=>window.MU8, CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
const SHOT_COL={mage:['#fff3b0','#ff9a2a','#e8402a'],wraith:['#ffffff','#a8c8ff','#5a6ad8'],wendigo:['#e8ffd0','#7aff3a','#2a9a2a']};

/* ======================= quái rừng ======================= */
const MOBS=new Map(), SHOTS=[], LOOT=[];
NET.listen('mumob',m=>{ const t=performance.now(), seen=new Set();
  for(const [id,ki,x10,y10,hp,st,face] of m.l){ const k=KI[ki], x=x10/10, y=y10/10; seen.add(id); let o=MOBS.get(id);
    if(!o||o.k!==k||o.dead){ o={id,k,dx:x,dy:y,hitAt:0,windAt:0,wdur:0,wx:0,wy:0,dead:0}; MOBS.set(id,o); }
    Object.assign(o,{x,y,hp,st,face}); }
  for(const [id,o] of MOBS) if(!seen.has(id)&&!o.dead) MOBS.delete(id); });
NET.listen('mufx',e=>{ if(!here()) return; const t=performance.now(), o=e.id&&MOBS.get(e.id), FX=U();
  if(e.k==='mobwind'&&o){ o.windAt=t; o.wdur=e.dur*1000; o.wx=e.x; o.wy=e.y; return; }
  if(e.k==='mobshot'){ SHOTS.push({mk:e.mk,x0:e.x0,y0:e.y0,x1:e.x,y1:e.y,t,dur:e.dur*1000}); return; }
  if(e.k==='mobmiss'&&o){ if(FX) FX.num(o.dx*T,o.dy*T-26,'hụt'); return; }
  if(e.k==='mobdie'){ const d=o||{id:e.id,k:e.mk,dx:e.x,dy:e.y,hitAt:0,windAt:0}; d.dead=t; MOBS.set(e.id,d);
    if(FX){ FX.burst(e.x*T,e.y*T-12,18,{col:FX.C_SMOKE,kind:'smoke',sp:[10,40],life:[.5,.9],size:[3,5],add:false,up:20}); FX.burst(e.x*T,e.y*T-14,10,{col:FX.C_SPARK,kind:'star',sp:[30,80],life:[.3,.6]}); } GAME.sfx('poof',.35); } });
NET.listen('mobloot',m=>{ const L=[]; if(m.vnd) L.push(['+'+SD.fmt(m.vnd),'#ffd84a']); if(m.mu) L.push([`+${m.mu} EXP MU`,'#7fe0ff']); if(m.exp) L.push([`+${m.exp} EXP`,'#7de07a']);
  const gem=m.items&&(m.items.ngoc_ch||m.items.ngoc_ch_ht); for(const [k,n] of Object.entries(m.items||{})) L.push([`+${n} ${(SD.ITEMS[k]||{}).name||k}`,k.startsWith('ngoc_ch')?'#d8b0ff':'#fff3d6',k]);
  LOOT.push({x:m.x*T,y:m.y*T,t:performance.now(),L}); if(gem){ GAME.sfx('level_up',.6); const FX=U(); if(FX) FX.burst(m.x*T,m.y*T-16,30,{col:['#d8b0ff','#7fe8ff','#ffffff'],kind:'star',sp:[30,110],life:[.6,1.1]}); } else GAME.sfx('coin',.3); });
// vị trí hiển thị cho maps8 (đòn đánh, số sát thương) + chớp khi trúng
window.MUMOB={list:()=>{ const now=performance.now(), out=[]; for(const o of MOBS.values()) if(!o.dead){ const s=sprOf(o,now,GAME.clock); out.push({id:o.id,x:o.dx*T,y:o.dy*T,rad:F.mobs[o.k].big?.9:.5,w:s.ax*.8||10,h:s.ay||20}); } return out; },   /* cho đánh thường (maps8) */
  pos:id=>{ const o=MOBS.get(id); return o?[o.dx*T,o.dy*T]:null; },hit:id=>{ const o=MOBS.get(id); if(o) o.hitAt=performance.now(); }};
const sprOf=(o,now,clock)=>{ const wind=o.windAt&&now-o.windAt<o.wdur+150, walk=o.st===1||o.st===3, f=wind?2:walk?Math.floor(clock*6+o.id)%2:Math.floor(clock*1.4+o.id*.37)%2;
  return A.mob(o.k,f,now-o.hitAt<110); };
function drawMob(g,o,now,cam,clock){ const m=F.mobs[o.k], s=sprOf(o,now,clock), fl=m.kind==='float', bob=fl?Math.round(Math.sin(clock*2.4+o.id)*2)-4:0, shk=now-o.hitAt<90?(o.id%2?1:-1):0;
  const a=o.dead?Math.max(0,1-(now-o.dead)/500):1; if(a<=0) return; GAME.shadow(o.dx*T,o.dy*T,m.big?15:9);
  const X0=Math.round(o.dx*T-cam.x)+shk, Y0=Math.round(o.dy*T-cam.y)+bob; g.globalAlpha=a;
  const U8=window.MU8, tg=U8&&U8.tg&&U8.tg(), key='mob:'+o.id, oc=tg&&!o.dead?(tg.lock===key?'#ff4a3a':tg.hov===key?'#ffe14a':''):'', ol=oc&&U8.outline(s.c,oc);   /* viền: vàng = đang rê chuột, đỏ = mục tiêu đã khoá */
  if(o.face<0){ g.save(); g.translate(X0,0); g.scale(-1,1); if(ol) g.drawImage(ol,-s.ax-1,Y0-s.ay-1); g.drawImage(s.c,-s.ax,Y0-s.ay); g.restore(); } else { if(ol) g.drawImage(ol,X0-s.ax-1,Y0-s.ay-1); g.drawImage(s.c,X0-s.ax,Y0-s.ay); } g.globalAlpha=1; }
// vùng báo đòn dưới đất: cận chiến = vòng tầm đánh quanh quái, đánh xa = vòng ở chỗ ngắm; đỏ dần lên tới lúc ra đòn
function drawWind(g,o,now,cam){ if(!o.windAt||o.dead) return; const el=now-o.windAt; if(el>o.wdur) return; const m=F.mobs[o.k], k=el/o.wdur, ranged=m.kind==='ranged'||m.kind==='float'&&m.range>2;
  const cx=(ranged?o.wx:o.dx)*T-cam.x, cy=(ranged?o.wy:o.dy)*T-cam.y, r=(ranged?1.1:m.range)*T;
  g.save(); g.fillStyle=`rgba(255,60,40,${.12+.25*k})`; g.strokeStyle=`rgba(255,80,60,${.5+.4*k})`; g.lineWidth=1; g.beginPath(); g.ellipse(cx,cy,r,r*.5,0,0,7); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx,cy,r*k,r*.5*k,0,0,7); g.stroke(); g.restore(); }
function drawShots(g,now,cam){ for(let i=SHOTS.length-1;i>=0;i--){ const s=SHOTS[i], k=(now-s.t)/s.dur, C=SHOT_COL[s.mk]||SHOT_COL.mage; if(k>=1){ SHOTS.splice(i,1); const FX=U(); if(FX) FX.burst(s.x1*T,s.y1*T-8,10,{col:C,kind:'spark',sp:[30,80],life:[.2,.4]}); continue; }
    const x=(s.x0+(s.x1-s.x0)*k)*T-cam.x, y=(s.y0+(s.y1-s.y0)*k)*T-cam.y-14+Math.sin(k*Math.PI)*-10; g.save(); g.globalCompositeOperation='lighter';
    const gr=g.createRadialGradient(x,y,0,x,y,7); gr.addColorStop(0,C[0]); gr.addColorStop(.4,C[1]); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,7,0,7); g.fill(); g.restore();
    if(Math.random()<.5){ const FX=U(); if(FX) FX.burst(x+cam.x,y+cam.y,1,{col:C,kind:'dot',sp:[5,15],life:[.2,.4],size:[1,2]}); } } }
/* ======================= vũ khí cầm tay + ván trượt / patin (mọi map) ======================= */
const lookOf=r=>{ if(r._lk9!==r.look){ r._lk9=r.look; try{ r._g9=JSON.parse(r.look); }catch(e){ r._g9=null; } } return r._g9; };
function gearPeople(){ const out=[], P=GAME.P, me=GAME.G&&GAME.G.look; if(me&&!P.incar&&!P.moto&&!P.kayak) out.push({x:P.x,y:P.y,face:P.face,view:P.view,lk:me,mv:P.moving,rd:!!P.riding,mi:P.riding?SD.mythIdx(GAME.G):0,atk:P.act==='attack',k:0});
  for(const r of (GAME.REM||new Map()).values()){ if(!r.look) continue; const lk=lookOf(r), fl=r.fl||0; if(!lk||!(lk.wep||lk.acc&&lk.acc.feet)||fl&SD.FL.moto||fl&SD.FL.kayak) continue;
    out.push({x:r.x,y:r.y,face:r.face,view:r.view,lk,mv:(r.anim||'').startsWith('walk')||(r.anim||'').startsWith('run'),rd:!!(fl&SD.FL.ride),mi:Math.floor(fl/SD.FL.mount)&15,atk:(r.anim||'').startsWith('attack'),k:r.id}); }
  return out; }
function drawGear(list,ctx,cam,clock){ for(const o of gearPeople()){ const seat=o.rd?(o.mi&&A.mythMount&&A.mythMount.M[SD.mountKey(o.mi)]?A.mythMount.M[SD.mountKey(o.mi)].seat:{dx:-4,dy:-15}):null,
    X0=Math.round(o.x-cam.x)+(seat?seat.dx*o.face:0), Y0=Math.round(o.y-cam.y)+(seat?seat.dy+7:0), w=o.lk.wep&&M.weapons[o.lk.wep], feet=o.lk.acc&&o.lk.acc.feet;
  // ván trượt / patin: dưới chân, chỉ khi đi bộ
  if(feet&&!o.rd){ const fg=A.footGear(feet); if(fg) list.push({y:o.y-.4,d:()=>{ const side=o.view==='side'; if(side) ctx.drawImage(fg.c,X0-fg.ax,Y0-fg.ay+(o.mv&&feet==='sh_skate'?Math.round(Math.sin(clock*18)*.6):0));
      else ctx.drawImage(fg.c,X0-fg.ax+Math.round(fg.c.width*.3),Y0-fg.ay,Math.round(fg.c.width*.4),fg.c.height); }}); }
  if(!w||!w.store||o.atk) continue; const s=A.muWeapon(o.lk.wep); if(!s) continue; const wl=o.lk.wl|0, back=o.view==='up', side=o.view==='side', f=side?o.face:1;
  const hx=side?o.face*5:back?-6:7, hy=-12+Math.round(Math.sin(clock*(o.mv?9:2.2))*(o.mv?1:.5)), ang=side?(o.face>0?.18:-.18):back?-.6:.35;
  list.push({y:o.y+(back?-.5:.35),d:()=>{ ctx.save(); ctx.translate(X0+hx,Y0+hy); if(f<0) ctx.scale(-1,1); ctx.rotate(ang); ctx.scale(.72,.72);
    if(wl>=7){ ctx.shadowColor=M.welems[w.el].col; ctx.shadowBlur=3+(wl-6)*2; } ctx.drawImage(s.c,-s.px,-s.py); ctx.restore(); }});
  if(wl>=7&&here()&&Math.random()<.04*(wl-6)){ const FX=U(); if(FX) FX.burst(o.x+hx*.6+FX.rnd(-4,4),o.y-22+FX.rnd(-4,4),1,{col:[M.welems[w.el].col,'#ffffff'],kind:'star',sp:[5,15],life:[.3,.6],size:[1,2]}); } } }

/* ======================= vẽ + lớp chữ + minimap ======================= */
let lastT=performance.now(), WARM=null;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const now=performance.now(), dt=Math.min(.1,(now-lastT)/1000), cam=GAME.cam, clock=GAME.clock; lastT=now; drawGear(list,ctx,cam,clock);
  if(!here()){ if(MOBS.size) MOBS.clear(); SHOTS.length=0; return; }
  // vào MU: vẽ sẵn hình các loài quái (mỗi khung 1 hình) để lúc gặp lần đầu không khựng
  if(!WARM) WARM=KI.flatMap(k=>[0,1,2].flatMap(f=>[[k,f,false],[k,f,true]])); if(WARM.length){ const [k,f,h]=WARM.pop(); A.mob(k,f,h); }
  const vx=cam.x-60, vy=cam.y-80, vw=innerWidth+120, vh=innerHeight+160;
  for(const [id,o] of MOBS){ if(o.dead&&now-o.dead>600){ MOBS.delete(id); continue; } const k=Math.min(1,dt*9); o.dx+=(o.x-o.dx)*k; o.dy+=(o.y-o.dy)*k;
    const x=o.dx*T, y=o.dy*T; if(x<vx||y<vy||x>vx+vw||y>vy+vh) continue; list.push({y:-9996,d:()=>drawWind(ctx,o,now,cam)}); list.push({y,d:()=>drawMob(ctx,o,now,cam,clock)}); }
  list.push({y:99996,d:()=>drawShots(ctx,now,cam)}); };
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); if(!here()) return; const now=performance.now(), P=GAME.P, me=U()&&U().me(), lv=me&&me.lv||1;
  ug.textAlign='center'; ug.textBaseline='bottom';
  for(const o of MOBS.values()){ if(o.dead) continue; const m=F.mobs[o.k], s=sprOf(o,now,GAME.clock), x=o.dx*T, top=o.dy*T-s.ay-(m.kind==='float'?6:2), near=Math.hypot(P.x-x,P.y-o.dy*T)<6*T;
    if(o.hp<100||near||now-o.hitAt<3000){ const w=m.big?56:44, h=6, X0=Math.round(sx(x)-w/2), Y0=Math.round(sy(top)-9); ug.fillStyle='#120c16'; ug.fillRect(X0-2,Y0-2,w+4,h+4); ug.fillStyle='#3a1418'; ug.fillRect(X0,Y0,w,h);   /* thanh máu: đầy xanh lá → vàng → đỏ khi gần chết */
      ug.fillStyle=`hsl(${Math.round(120*Math.max(0,o.hp)/100)},85%,48%)`; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*o.hp/100)),h); ug.fillStyle='rgba(255,255,255,.35)'; ug.fillRect(X0,Y0,Math.max(1,Math.round(w*o.hp/100)),2); }
    if(near){ ug.font='14px VT323, monospace'; tag(sx(x),sy(top)-12,`Lv${m.lv} ${m.name}`,'',m.lv>lv+5?'#ff6a5a':m.lv<lv-8?'#a8a0a0':'#ffd84a'); }
    if(o.windAt&&now-o.windAt<o.wdur){ ug.font='18px VT323, monospace'; ug.fillStyle='#120c16'; ug.fillText('!',sx(x)+1,sy(top)-13); ug.fillStyle='#ff4a3a'; ug.fillText('!',sx(x),sy(top)-14); } }
  for(let i=LOOT.length-1;i>=0;i--){ const l=LOOT[i], k=(now-l.t)/1600; if(k>=1){ LOOT.splice(i,1); continue; } ug.font='15px VT323, monospace';
    l.L.forEach(([txt,col],j)=>{ const X0=sx(l.x), Y0=sy(l.y)-30-k*26-j*13; ug.globalAlpha=Math.min(1,(1-k)*2); ug.fillStyle='#120c16'; ug.fillText(txt,X0+1,Y0+1); ug.fillStyle=col; ug.fillText(txt,X0,Y0); }); ug.globalAlpha=1; } };
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k!=='mu') return; for(const o of MOBS.values()) if(!o.dead) dot(o.dx*T,o.dy*T,'#ff5a4a',1); };
// hoạt ảnh đồ trang trí rừng + quầy Phù Thuỷ
const a0=X.anim; X.anim=(o,clock)=>{ const a=o.anim; if(a==='muenchant'){ const f=Math.floor(clock*2)%2; return cached('es'+f,()=>A.enchantStall(f)); } if(a==='hellgate'){ const f=Math.floor(clock*3)%2; return cached('hg'+f,()=>A.hellGate(f)); }
  if(a==='lctemple'){ const f=Math.floor(clock*1.5)%2; return cached('lt'+f,()=>A.lcTemple(f)); }
  if(a==='bonfire'){ const f=Math.floor(clock*6)%2; return cached('bf'+f,()=>A.bonfire(true,f)); } return a0?a0(o,clock):null; };

/* ======================= nơi tìm ngọc (bảng Phù Thuỷ, Người Thuần Thú) ======================= */
// mỗi nguồn: [nơi, cách rơi, [x, y] trong MU để tự đi tới | null]
const GEM_SRC={ngoc_ch:[['Quái rừng phía Nam MU','mỗi con hạ được có tỉ lệ rơi: 1,6% ở Đồi Bí Ngô, càng xuống sâu càng dễ, tới 4,8% ở Cổng Địa Ngục',[21.5,34]],
    ['Boss MU','Luffy Gear 5: top 1 được 10 viên, người góp sức khác 60% được 5. Boss phụ: top 1 được 5, người khác 35%',[22,9]],
    ['Nhiệm vụ ẩn ở mọi map','xong mỗi nhiệm vụ ẩn (🔍) tặng thêm 1 viên',null],['Hồ Ké Retreat','thuê kayak chèo trên hồ: 1/4 lần vớt được đồ cổ có kèm 1 viên',null],
    ['Phù Thuỷ Cường Hoá','mua 1.000.000đ/viên, gói 5 viên 4.700.000đ',[7.5,26.4]]],
  ngoc_ch_ht:[['Mọi boss MU','người nhiều sát thương nhất có 15% được 1 viên',[22,9]],['Lính Cát huyền thoại','mỗi loài huyền thoại có trong đội / hộp tặng 1 viên (bấm 🎁 ở Phù Thuỷ Cường Hoá)',[7.5,26.4]],['Rừng quái sâu (3 khu dưới cùng)','Mỏ Đá Cổ, Rừng Sọ Hươu, Cổng Địa Ngục: mỗi con 0,15%',[48,61]]]};
for(const k of M.jewels) GEM_SRC[k]=[['Mọi boss MU (Luffy, boss phụ, vùng boss phía Tây, Pepe)','Hạ được: người nhiều sát thương nhất chắc chắn có ngọc quý (Ước Nguyện / Tâm Linh / Hỗn Nguyên ngẫu nhiên); nếu người đó đã nâng thú cưỡi đủ bậc thì nhường cho top 2, top 3. Thêm 20% cho 1 người bất kỳ tham gia đánh',[22,9]]];
function luffyLeft(){ const b=U()&&U().boss(); if(!b) return ''; if((b.list||[]).some(x=>x.id==='luffy')) return '<b class="good">đang xuất hiện, tới đánh ngay!</b>'; const t=(b.next||{}).luffy; return t?`ra sau ${Math.max(1,Math.ceil((t-NET.now())/60000))} phút`:''; }
const gemGuide=keys=>{ const it=G().items||{};
  return `<div class="gemguide"><h5>Tìm ngọc ở đâu?</h5>${keys.map(k=>`<div class="gg"><img src="${GAME.icon64(k)}" width="28" height="28" alt=""><b>${esc(SD.ITEMS[k].name)}</b> <small>(đang có ${it[k]||0})</small>
    <ul>${(GEM_SRC[k]||[]).map(([w,how,xy])=>`<li><b>${esc(w)}</b>${w.includes('Luffy')?` · ${luffyLeft()}`:''}: ${esc(how)} ${xy?btn('gemgo','➜ Tới',{x:xy[0]+(M.OX||0),y:xy[1]}):''}</li>`).join('')}</ul></div>`).join('')}</div>`; };
window.MU9={gemGuide,result:(r,name)=>enhResult(r,null,name),lack:gem=>enhNeed(gem)};   /* lc.js dùng thẻ kết quả khi Lính Cát ăn ngọc */
UI.onAct('gemgo',d=>{ if(!here()){ toast('Gọi Grab (phím G) chọn MU Online rồi bấm lại','lock'); return; } UI.closeAll(); GAME.walkTo(+d.x,+d.y,'Tới chỗ tìm ngọc'); });

/* ======================= Phù Thuỷ Cường Hoá ======================= */
const STAT_VI=M.statVI, bonusTxt=b=>Object.entries(b||{}).filter(([,v])=>v).map(([k,v])=>`${STAT_VI[k]||k} +${Math.round(v*100)}%`).join(' · ');
const shoeImg=k=>cached('sh'+k,()=>{ const c=A.muShoe(k); return c?c.toDataURL():''; });
const imgOf=(k,kind)=>{ const FX=U(); if(kind==='weapon') return FX.wImg(k); if(kind==='set') return FX.setImg(k); if(kind==='feet') return shoeImg(k); return FX.accImg(k); };
// đồ cường hoá được: vũ khí trong túi, giáp class, set legacy đã mua, phụ kiện + giày đã mua
function enhItems(){ const g=G(), me=U().me()||{}, it=g.items||{}, own=g.owned||{}, out=[];
  for(const k of Object.keys(it)) if(M.weapons[k]) out.push({k,kind:'weapon',name:M.weapons[k].name,on:me.wep===k});
  if(me.cls) out.push({k:M.cls[me.cls].set,kind:'set',name:SD.CLOTHES[M.cls[me.cls].set].name,on:!me.lg});
  for(const k of Object.keys(M.legacy)) if(own[k]) out.push({k,kind:'set',name:'Set '+M.legacy[k].name,on:me.lg===k});
  for(const k of Object.keys(me.accOwned||{})) if(M.acc[k]) out.push({k,kind:M.acc[k].slot,name:M.acc[k].name,on:Object.values(me.acc||{}).includes(k)});
  return out.sort((a,b)=>(b.on?1:0)-(a.on?1:0)); }
const lcBonus=()=>{ const lead=((G().lc||{}).party||[])[0]; return lead?Math.min(E.lcMax,lead.lv*E.lcPer):0; };
const holes=L=>`<span class="enholes">${Array.from({length:E.max},(_,i)=>`<i class="${i<L?'on':''}${i>=9?' hi':''}"></i>`).join('')}</span>`;
UI.defPlace('muenchant',()=>UI.open('Phù Thuỷ Cường Hoá',()=>{ const g=G(), me=U().me(), it=g.items||{}, n=it.ngoc_ch||0, nh=it.ngoc_ch_ht||0, lb=lcBonus(), enh=(me&&me.enh)||{};
  if(!me||!me.cls) return '<p>"Gặp Vệ binh ở cổng thành chọn class trước, rồi mang đồ tới đây ta khắc lỗ cường hoá cho."</p>';
  const mats=Object.keys(M.matPrice).filter(k=>it[k]), sum=mats.reduce((a,k)=>a+it[k]*M.matPrice[k],0);
  return `<p>"Mỗi món đồ khắc được <b>${E.max} lỗ</b> cường hoá, mỗi lỗ tăng chỉ số. Lỗ càng sâu càng khó: lỗ đầu chắc chắn thành, lỗ cuối chỉ ${Math.round(E.rate[E.max-1]*100)}%. Thất bại thì mất ngọc, đồ không sao."</p>
  <div class="enbar"><span><img src="${GAME.icon64('ngoc_ch')}" width="28" height="28" alt=""> Ngọc Cường Hoá: <b>${n}</b></span><span><img src="${GAME.icon64('ngoc_ch_ht')}" width="28" height="28" alt=""> Ngọc Huyền Thoại (${Math.round(E.legendRate*100)}%): <b>${nh}</b></span>
    <span>${btn('enhbuy','Mua 1 ngọc · '+SD.fmt(SD.gemCost(1)),{n:1})}${btn('enhbuy',`Mua 5 · ${SD.fmt(SD.gemCost(5))} <small>(tiết kiệm ${SD.fmt(SD.gemCost(1)*5-SD.gemCost(5))})</small>`,{n:5},'pri')}${btn('enhgift','🎁 Quà Lính Cát huyền thoại',{})}</span></div>
  <p class="muted">Lính Cát đầu đội cấp càng cao càng cộng tỉ lệ (cấp × ${(E.lcPer*100).toFixed(1)}%, tối đa +${Math.round(E.lcMax*100)}%): đang cộng <b class="good">+${(lb*100).toFixed(1)}%</b>. Ngọc rơi từ boss, quái rừng phía Nam, nhiệm vụ ẩn, vớt dưới hồ Ké.</p>
  <div class="enlist">${enhItems().map(x=>{ const L=enh[x.k]||0, max=L>=E.max, rate=max?0:Math.min(.99,E.rate[L]+lb), per=L&&bonusTxt(Object.fromEntries(Object.entries(E.per[SD.enhKind(x.k)]||{}).map(([s,v])=>[s,v*L])));
    return `<div class="enrow ${x.on?'on':''}"><img src="${imgOf(x.k,x.kind)}" width="48" height="48" alt=""><div class="enmid"><b>${esc(x.name)} ${L?`<span class="enlv">+${L}</span>`:''}${x.on?' <small class="good">đang dùng</small>':''}</b>${holes(L)}
      <small>${max?'<span class="good">Đã khắc đủ 12 lỗ!</span>':`Lỗ ${L+1}: <b>${Math.round(rate*100)}%</b> · phí ${SD.fmt(E.fee(L))}`}${per?` · đang cộng ${per}`:''}</small></div>
      <div class="enbtn">${max?'':btn('enh','Khắc',{k:x.k},'pri')+(nh?btn('enh','Ngọc HT',{k:x.k,legend:1}):'')}</div></div>`; }).join('')||'<p class="muted">Chưa có đồ nào để cường hoá.</p>'}</div>
  ${gemGuide(['ngoc_ch','ngoc_ch_ht'])}
  <h5>Thu mua chiến lợi phẩm rừng</h5>${mats.length?`<p>${mats.map(k=>`${esc(SD.ITEMS[k].name)} ×${it[k]} (${SD.fmt(M.matPrice[k])})`).join(' · ')}</p>${btn('mobsell',`Bán tất cả · ${SD.fmt(sum)}`,{},'pri')}`:'<p class="muted">Xuống rừng quái phía Nam đánh quái lấy chiến lợi phẩm rồi mang về đây bán.</p>'}`; },{wide:true}));
// thẻ kết quả cường hoá: to giữa màn hình, nằm trên cả bảng (thành công: xanh băng + "+N" lớn, lỗ mới sáng lên; thất bại: đỏ, rung); bấm để tắt, tự ẩn sau 2,8 giây
const enhCard=()=>{ let el=document.getElementById('enhRes'); if(!el){ el=document.createElement('div'); el.id='enhRes'; el.onclick=()=>{ el.hidden=true; }; document.body.appendChild(el); } return el; };
const enhShow=(el,ms)=>{ el.hidden=false; el.style.animation='none'; void el.offsetWidth; el.style.animation=''; clearTimeout(el._t); el._t=setTimeout(()=>{ el.hidden=true; },ms); };
// thiếu ngọc / tiền / lỗi khác khi khắc: thẻ cam cùng cỡ, chỉ chỗ mua / tìm ngọc
function enhNeed(gem,err){ const el=enhCard(), ht=gem==='ngoc_ch_ht';
  el.className='lack'; el.innerHTML=gem?`<small>⚠ KHÔNG ĐỦ NGỌC ⚠</small><b>💎</b><span>Cần 1 ${esc(SD.ITEMS[gem].name)} để khắc lỗ</span><em>${ht?'Lính Cát huyền thoại tặng (bấm 🎁 ở Phù Thuỷ) · rừng quái sâu rơi':`Mua ở Phù Thuỷ: 1 viên ${SD.fmt(SD.gemCost(1))} · gói 5 viên ${SD.fmt(SD.gemCost(5))}<br>hoặc đánh quái rừng, boss MU, làm nhiệm vụ ẩn (xem mục Tìm ngọc ở đâu)`}</em>`
    :`<small>⚠ CHƯA KHẮC ĐƯỢC ⚠</small><b>!</b><span>${esc(err||'')}</span>`;
  GAME.sfx('blip',.7); enhShow(el,3200); }
function enhResult(r,k,nm){ const el=enhCard();
  const name=nm||(M.weapons[k]||M.legacy[k]||M.acc[k]||SD.CLOTHES[k]||{}).name||k, L=r.lv|0, pct=Math.round((r.rate||0)*100);
  el.className=r.ok?'ok':'fail'; el.innerHTML=r.ok?`<small>✨ CƯỜNG HOÁ THÀNH CÔNG ✨</small><b>+${L}</b><span>${esc(name)}</span>${holes(L)}<em>tỉ lệ ${pct}% · ${L>=E.max?'đã khắc đủ 12 lỗ!':`lỗ ${L+1}: ${Math.round(Math.min(.99,E.rate[L]+lcBonus())*100)}%`}</em>`
    :`<small>💥 CƯỜNG HOÁ THẤT BẠI 💥</small><b>×</b><span>${esc(name)} vẫn +${L}</span>${holes(L)}<em>mất 1 ngọc · tỉ lệ lần này ${pct}%</em>`;
  const last=el.querySelectorAll('.enholes i')[L-1]; if(r.ok&&last) last.classList.add('new'); enhShow(el,2800); }
UI.onAct('enh',async d=>{ const gem=d.legend?'ngoc_ch_ht':'ngoc_ch'; if(!(G().items||{})[gem]) return enhNeed(gem);
  const r=await NET.req({t:'mu',op:'enh',k:d.k,legend:d.legend?1:0}); if(!r) return; if(r.err) return enhNeed(/^Cần Ngọc/.test(r.err)?gem:null,r.err); const FX=U(), P=GAME.P;
  if(r.ok){ GAME.sfx('level_up',.9); if(FX){ FX.burst(P.x,P.y-20,40,{col:['#7fe8ff','#ffffff','#ffd84a'],kind:'star',sp:[40,140],life:[.6,1.2]}); FX.ring(P.x,P.y,6,46,.7,'#7fe8ff',3); FX.shake(3,.2); } }
  else { GAME.sfx('poof',.8); if(FX){ FX.burst(P.x,P.y-20,16,{col:FX.C_SMOKE,kind:'smoke',sp:[10,30],life:[.5,.9],size:[3,5],add:false,up:20}); FX.shake(5,.3); } }
  enhResult(r,d.k); UI.refresh(); });
UI.onAct('enhbuy',async d=>{ const r=await GAME.act({t:'mu',op:'enhbuy',n:+d.n||1}); if(r&&!r.err){ GAME.sfx('coin',.5); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.onAct('enhgift',async()=>{ const r=await GAME.act({t:'mu',op:'enhgift'}); if(r&&!r.err){ GAME.sfx('level_up',.7); toast(esc(r.msg),'item'); } UI.refresh(); });
UI.onAct('mobsell',async()=>{ const r=await GAME.act({t:'mobsell'}); if(r&&!r.err){ GAME.sfx('coin',.6); toast(esc(r.msg),'vnd'); } UI.refresh(); });

/* ======================= Tiệm Giày Lướt Gió ======================= */
const SHOES=Object.entries(M.acc).filter(([,a])=>a.slot==='feet');
UI.defPlace('mushoes',()=>UI.open('Tiệm Giày Lướt Gió · ô Giày',()=>{ const me=U().me(), own=(me&&me.accOwned)||{}, cur=me&&me.acc&&me.acc.feet, ok=me&&me.cls;
  return `<p>"Giày tốt chạy nhanh hơn ở mọi nơi (đi bộ, chạy, không tính cưỡi ngựa, đi xe), lại thêm chỉ số đánh boss. Ván Trượt Vàng là món mạnh nhất tiệm!"</p>${ok?'':'<p class="bad">Gặp Vệ binh chọn class MU trước rồi quay lại.</p>'}
  <div class="mulg">${SHOES.map(([k,a],i)=>{ const has=own[k], on=cur===k, tier=i>=14?5:i>=12?4:i>=9?3:i>=6?2:0;
    return `<div class="mulgc ${tier>=5?'wr5':tier>=3?'wr4':tier?'wr3':''}"><img src="${shoeImg(k)}" width="96" height="72" alt=""><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
      <small class="good">Tốc độ +${Math.round(a.spd*100)}% · ${bonusTxt(a.bonus)}</small>
      <div class="mulgb">${!ok?'':on?btn('shoeoff','Tháo',{},'')+'<small class="good">✔ Đang mang</small>':has?btn('shoewear','Mang',{k},'pri'):btn('shoebuy','Mua · '+SD.fmt(a.price),{k},'pri')}</div></div>`; }).join('')}</div>`; },{wide:true}));
const shoeDone=r=>{ if(!r||r.err) return; GAME.sfx('item_pickup',.6); toast(esc(r.msg),'item'); UI.refresh(); };
UI.onAct('shoebuy',async d=>shoeDone(await GAME.act({t:'mu',op:'accbuy',k:d.k})));
UI.onAct('shoewear',async d=>shoeDone(await GAME.act({t:'mu',op:'accwear',k:d.k,slot:'feet'})));
UI.onAct('shoeoff',async()=>shoeDone(await GAME.act({t:'mu',op:'accwear',k:'',slot:'feet'})));

/* ======================= Lính Cát ở MU: Trung tâm + Đền Lính Cát Huyền Thoại ======================= */
const L=SD.LINHCAT, SP=SD.LC_SPECIES, LCT=SD.LC_TYPES, lcImg=sp=>cached('lci'+sp,()=>{ const c=A.cv(44,44), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(A.linhcat(sp).c,0,0,44,44); return c.toDataURL(); });
const mythSk=sp=>L.mythSkill[SP[sp].t]||L.mythSkill.thuong;
const skDesc=sk=>[`đòn ×${sk.mul} công`,sk.heal&&`hồi ${Math.round(sk.heal*100)}% máu cho bạn`,sk.mp&&`hồi ${Math.round(sk.mp*100)}% mana`,sk.drain&&`hút ${Math.round(sk.drain*100)}% sát thương thành máu cho bạn`,
  sk.chain&&`giật lan thêm ${sk.chain} quái`,sk.slow&&`làm chậm ${sk.slow} giây`,sk.shield&&`tăng thủ cho bạn ${sk.shield} giây`].filter(Boolean).join(' · ');
UI.defPlace('mulc',()=>UI.open('Trung tâm Lính Cát · Lục Địa Cát',()=>{ const r=G().lc||{party:[]}, fee=SD.lcHealFee(r.party||[]);
  return `<p>"Chào mừng tới Trung tâm Lính Cát ở MU! Hồi máu cả đội tính theo tổng cấp các bé."</p>${(r.party||[]).length?btn('lcheal',`💗 Hồi máu cả đội · ${SD.fmt(fee)}`,{},'pri'):'<p class="muted">Bạn chưa có Lính Cát nào (học ở Trung tâm Lính Cát thị trấn Đà Bắc).</p>'}
  <div class="col">${btn('mulcshop','🛒 Kệ hàng: bóng, thuốc, đá, Sách Kinh Nghiệm')}${btn('mulcbox','📦 Máy gửi giữ')}${btn('mulcparty','🐾 Đội Lính Cát: đọc sách, cho ăn Ngọc Cường Hoá')}${(G().items||{}).huy_hieu_pepe?btn('pepebadge','🏅 Huy Hiệu Pepe: chọn thần thú siêu huyền thoại','','pri'):''}</div>
  <p class="muted">Sách Kinh Nghiệm +1 / +5 cấp, đủ cấp là tiến hoá. Ngọc Cường Hoá cho Lính Cát ăn: +1 → +12, mỗi cấp +${Math.round(L.enh.per*100)}% mọi chỉ số. Đền Lính Cát Huyền Thoại ngay phía Nam đài phun nước.</p>`; }));
UI.onAct('mulcshop',()=>UI.lcShop()); UI.onAct('mulcbox',()=>UI.lcBox()); UI.onAct('mulcparty',()=>UI.lcParty());
UI.defPlace('mulctemple',()=>UI.open('Đền Lính Cát Huyền Thoại',()=>{ const r=G().lc||{party:[],box:[]}, it=G().items||{}, cost=Object.entries(L.myth.cost), ok=cost.every(([k,n])=>(it[k]||0)>=n);
  return `<p>"Đập đủ 3 viên ngọc quý vào 1 Lính Cát, nó sẽ thức tỉnh <b>dạng huyền thoại</b>: chỉ số ×${L.myth.mul}, hào quang vàng, và có <b>kỹ năng tự động</b> theo hệ, cứ ${L.myth.every} giây tung 1 đòn hỗ trợ bạn đánh quái / boss ở MU. Chỉ con đứng đầu đội mới ra trận."</p>
  <p>Cần: ${cost.map(([k,n])=>`<img src="${GAME.icon64(k)}" width="24" height="24" alt="" style="vertical-align:middle"> ${n} ${esc(SD.ITEMS[k].name)} <small class="${(it[k]||0)>=n?'good':'bad'}">(có ${it[k]||0})</small>`).join(' · ')}</p>
  <div class="list">${(r.party||[]).map((m,i)=>{ const sk=mythSk(m.sp); return `<div class="row lcrow"><img src="${lcImg(m.sp)}" width="44" height="44" alt=""><span><b>${esc(m.nick||SP[m.sp].name)}</b> Lv${m.lv}${m.enh?` <span class="enlv">+${m.enh}</span>`:''} <small class="muted">· hệ ${esc((LCT[SP[m.sp].t]||{}).name||'')}${i?'':' · đầu đội'}</small><br>
    <small><b>${m.myth?'★ ':''}${esc(sk.name)}</b>: ${esc(skDesc(sk))}</small></span>${m.myth?'<small class="good">★ Đã thức tỉnh</small>':btn('lcmyth','🌟 Thức tỉnh',{u:m.u},ok?'pri':'')}</div>`; }).join('')||'<p class="muted">Chưa có Lính Cát nào trong đội.</p>'}</div>
  ${gemGuide(M.jewels)}`; },{wide:true}));
UI.onAct('lcmyth',async d=>{ const r=await GAME.act({t:'lc',op:'myth',u:+d.u}); if(!r||r.err) return; GAME.sfx('level_up',.9); GAME.bigText('LÍNH CÁT HUYỀN THOẠI!'); const FX=U(), P=GAME.P;
  if(FX){ FX.burst(P.x,P.y-20,50,{col:['#ffd84a','#fff3b0','#ffffff'],kind:'star',sp:[40,150],life:[.7,1.4]}); FX.ring(P.x,P.y,6,60,.9,'#ffd84a',3); } toast(esc(r.msg),'item'); UI.refresh(); });
// kỹ năng tự động của Lính Cát huyền thoại: tên chiêu bay lên chỗ con Lính Cát, nổ màu hệ ở mục tiêu, tia giật lan, số máu hồi
NET.listen('mufx',e=>{ if(e.k!=='lcsk'||!here()) return; const FX=U(); if(!FX) return; const col=(LCT[e.ty]||{}).col||'#ffd84a', me=e.from===NET.pid;
  const p=e.from===NET.pid?[GAME.P.x,GAME.P.y]:(()=>{ const q=GAME.REM&&GAME.REM.get(e.from); return q?[q.x,q.y]:null; })();
  if(p) LOOT.push({x:p[0]-20,y:p[1]+6,t:performance.now(),L:[['★ '+e.name,col]]});
  const X0=e.x*T, Y0=e.y*T; FX.burst(X0,Y0-12,24,{col:[col,'#ffffff'],kind:'spark',sp:[50,150],life:[.2,.45]}); FX.ring(X0,Y0,4,30,.4,col,3);
  for(const [cx,cy,dd] of e.chain||[]){ FX.burst(cx*T,cy*T-12,12,{col:[col,'#ffffff'],kind:'spark',sp:[40,120],life:[.15,.35]}); FX.num(cx*T,cy*T-24,dd); }
  if(e.heal&&p){ FX.num(p[0],p[1]-40,'+'+e.heal,{heal:1}); if(me) GAME.sfx('item_pickup',.3); } });
// hết trận thách đấu: thẻ to thắng / thua (dùng chung khung thẻ cường hoá)
NET.listen('muduelend',m=>{ const el=enhCard(); el.className=m.win?'ok':'fail';
  el.innerHTML=m.win?`<small>⚔ KẾT THÚC THÁCH ĐẤU ⚔</small><b>THẮNG</b><span>Bạn hạ ${esc(m.other)}</span><em>+${m.mu} EXP MU · cả 2 được hồi đầy máu</em>`:`<small>⚔ KẾT THÚC THÁCH ĐẤU ⚔</small><b>THUA</b><span>${esc(m.other)} thắng trận này</span><em>Đã hồi đầy máu, thách đấu lại khi nào cũng được</em>`;
  GAME.sfx(m.win?'level_up':'poof',.8); enhShow(el,3200); });
})();
