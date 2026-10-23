/* Chan City — Dương Vũ (client): theo lịch SD.dvWhere đứng ở 1 map cạnh standee ZEN DESIGN SYSTEM, rao quảng cáo bằng bong bóng chữ, bấm E nói chuyện.
   Zen Token lấp lánh ở 5 studio khi đang làm "5 Zen Token thất lạc"; bàn thiết kế ở Lumen / Lavi / Bearplus có việc "Áp dụng Zen". Nối thêm vào MAPX. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, D=SD.DUONGVU, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a);
const Q=id=>(G().quests||{})[id], prog=id=>((G().qprog||{})[id]||0), F=()=>((G().flags||{}).dv)||{met:{},tok:{}}, CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn());
const where=()=>SD.dvWhere(NET.now()), name=s=>(SD.DEST[s]&&SD.DEST[s].name)||(s==='retreat'?'Ké Retreat':s);
const S_=A.sprite;
// standee cuộn: nền trắng, logo vòng tròn zen, chữ ZEN DESIGN SYSTEM
const banner=()=>cached('bn',()=>S_(30,44,15,43,(g,P)=>{ P.rect(1,0,28,40,'#f4f2ec'); P.rect(1,0,28,2,'#2a2436'); P.disc(15,10,5,'#2a2436'); P.disc(15,10,3,'#f4f2ec'); P.rect(15,5,1,3,'#f4f2ec');
  A.text3(P,9,19,'ZEN','#2a2436'); A.text3(P,3,26,'DESIGN','#7a9a6a'); A.text3(P,3,32,'SYSTEM','#7a9a6a'); P.rect(13,40,4,3,'#9aa0aa'); P.rect(8,43,14,1,'#5a5068'); }));
const token=fr=>cached('tk'+fr,()=>S_(12,14,6,13,(g,P)=>{ P.rect(4,1,4,2,'#7a9a6a'); P.rect(2,3,8,6,'#7a9a6a'); P.rect(4,9,4,2,'#7a9a6a'); P.rect(4,3,4,6,fr?'#c8f0b8':'#a8d898'); P.px(5,4,'#ffffff'); P.rect(3,12,6,1,'rgba(0,0,0,.25)'); }));
let AV=null; const av=()=>AV||(AV=AVATAR.build(SD.NPC_LOOKS.duongvu.look));
/* ---------- tương tác ---------- */
const reveal=r=>{ if(r.secret&&r.secret.length){ GAME.sfx('level_up',.5); GAME.bigText('NHIỆM VỤ ẨN!'); toast('🔍 Nhiệm vụ ẩn mới: <b>'+r.secret.map(esc).join('</b>, <b>')+'</b>','quest'); } };
function quiz(z){ GAME.sfx('blip',.5); GAME.ask(`🧘 Zen ${z.n}/${z.of}: ${z.q}`,'duongvu',z.opts,async a=>{ const r=await GAME.act({t:'dv',op:'answer',a}); if(!r||r.err) return;
  toast(r.right?'✔ Chuẩn Zen!':`✘ Chưa đúng. Đáp án: "${esc(r.good)}"`,r.right?'item':'lock'); if(r.next) return setTimeout(()=>quiz(r.next),600); if(r.done) setTimeout(()=>toast(esc(r.msg),r.pass?'quest':'lock'),500); }); }
let dvLine='';
UI.defPlace('duongvu',()=>UI.open('Dương Vũ · Zen Design System',()=>{ const w=where(), f=F(), met=Object.keys(f.met||{}).length, qs=['dv_follow','dv_token','dv_quiz','dv_figma'].filter(k=>Q(k));
  return `<p>"${esc(dvLine||'Chào bạn! Mình là Dương Vũ. Bạn đã nghe về Zen Design System chưa? Token, component, dark mode, đủ cả!')}"</p>
    ${btn('dvtalk','💬 Nghe Dương Vũ giới thiệu Zen',{},'pri')}${Q('dv_quiz')==='active'&&!prog('dv_quiz')?btn('dvquiz','🧘 Làm bài kiểm tra Zen'):''}${qs.map(UI.qRow).join('')}
    <p class="muted">Đã gặp anh ở ${met} map. Khoảng ${Math.ceil(w.left/60000)} phút nữa anh đi ${esc(name(w.next))}.</p>`; }));
UI.onAct('dvtalk',async()=>{ const r=await GAME.act({t:'dv',op:'talk'}); if(!r||r.err) return; dvLine=(r.msg||'').replace(/^Dương Vũ: "|"( \(.*\))?$/g,''); reveal(r); UI.refresh(); });
UI.onAct('dvquiz',async()=>{ const r=await GAME.act({t:'dv',op:'quiz'}); if(!r||r.err) return; UI.closeAll(); quiz(r.quiz); });
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); const S=GAME.S; if(!S) return; const w=where();
  if(w.scene===S.kind){ const d=dist(w.x*T,w.y*T); if(d<34) consider(d*.5,{type:'mapx',k:'dv',label:'Nói chuyện với Dương Vũ'}); }
  if(Q('dv_token')==='active') D.tokens.forEach(([sc,x,y],i)=>{ if(sc!==S.kind||(F().tok||{})[i]) return; const d=dist(x*T,y*T); if(d<24) consider(d*.5,{type:'mapx',k:'dvtok',i,label:'Nhặt Zen Token'}); });
  if(Q('dv_figma')==='active'&&!prog('dv_figma')&&D.figma.includes(S.kind)){ const ds=S.kind==='lumen'?SD.LUMEN.desks:S.kind==='lavi'?SD.LAVI.desks:SD.BEARPLUS.desks; for(const [x,y] of ds){ const d=dist(x*T,(y+.9)*T); if(d<26) consider(d*.4,{type:'mapx',k:'dvfig',label:'Áp dụng Zen Design System vào file'}); } } };
const p0=X.pick; X.pick=async x=>{ if(x.k==='dv'){ GAME.sfx('blip',.4); return UI.place('duongvu',{id:'duongvu'}); }
  if(x.k==='dvtok'){ const r=await GAME.act({t:'dv',op:'token',i:x.i}); if(r&&!r.err){ GAME.sfx('item_pickup',.6); toast(esc(r.msg),'item'); } return; }
  if(x.k==='dvfig'){ const r=await GAME.act({t:'dv',op:'figma'}); if(r&&!r.err) toast('Mở file Figma, gắn token Zen...','quest'); return; } return p0(x); };
/* ---------- chỉ đường ---------- */
const g0=X.go; X.go=id=>{ if(!id.startsWith('dv_')) return g0(id); const S=GAME.S, w=where();
  const goDv=()=>{ if(S.kind===w.scene) return GAME.walkTo(w.x,w.y+1,'Dương Vũ'); toast(`Dương Vũ đang ở <b>${esc(name(w.scene))}</b> (còn khoảng ${Math.ceil(w.left/60000)} phút)`,'quest'); GAME.autoGo(w.scene,()=>GAME.questGo(id)); };   /* tự gọi Grab tới chỗ Dương Vũ */
  if(GAME.canFinish(id)||id==='dv_follow'||id==='dv_quiz') return goDv(),true;
  if(id==='dv_token'){ const i=D.tokens.findIndex((t,k)=>!(F().tok||{})[k]); if(i<0) return goDv(),true; const [sc,x,y]=D.tokens[i]; if(S.kind===sc) GAME.walkTo(x,y,'Zen Token'); else GAME.autoGo(sc,()=>GAME.questGo(id)); return true; }
  if(id==='dv_figma'){ if(D.figma.includes(S.kind)){ const ds=S.kind==='lumen'?SD.LUMEN.desks:S.kind==='lavi'?SD.LAVI.desks:SD.BEARPLUS.desks; GAME.walkTo(ds[0][0],ds[0][1]+.9,'Bàn thiết kế'); } else GAME.autoGo('lumen',()=>GAME.questGo(id)); return true; }
  return goDv(),true; };
/* ---------- vẽ ---------- */
let lastLineT=0, line=0;
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const S=GAME.S; if(!S) return; const cam=GAME.cam, clock=GAME.clock, w=where();
  if(w.scene===S.kind){ const x=w.x*T, y=w.y*T, bx=(w.bx+1.6)*T, by=w.by*T, moving=Math.abs(Math.cos(NET.now()/1000*.35))>.2, a=av(), an=moving?a.anims.walk:a.anims.idle, fr=an.frames[Math.floor(clock*an.fps)%an.frames.length], face=Math.cos(NET.now()/1000*.35)>0?1:-1;
    list.push({y:by,d:()=>{ const b=banner(); GAME.shadow(bx,by,8); ctx.drawImage(b.c,Math.round(bx-b.ax-cam.x),Math.round(by-b.ay-cam.y)); }});
    list.push({y,d:()=>{ GAME.shadow(x,y,8); const X0=Math.round(x-cam.x), Y0=Math.round(y-cam.y); ctx.save(); if(face<0){ ctx.translate(X0*2,0); ctx.scale(-1,1); } ctx.drawImage(fr,X0-16,Y0-46); ctx.restore(); }});
  }
  if(Q('dv_token')==='active') D.tokens.forEach(([sc,tx,ty],i)=>{ if(sc!==S.kind||(F().tok||{})[i]) return; const x=tx*T, y=ty*T, sp=token(Math.floor(clock*3)%2); list.push({y,d:()=>{ ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y+Math.sin(clock*3)*1.5)); }}); }); };
// bong bóng quảng cáo + tên (lớp giao diện cho chữ nét)
const o0=X.overlay; X.overlay=(ug,sx,sy,tag)=>{ if(o0) o0(ug,sx,sy,tag); const S=GAME.S, P=GAME.P, w=where(); if(!S||!P||w.scene!==S.kind) return; const x=w.x*T, y=w.y*T;
  ug.font='16px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom'; tag(sx(x),sy(y-46),'Dương Vũ','','#7fe0a0');
  const now=performance.now(); if(now-lastLineT>6500){ lastLineT=now; line=(line+1)%D.lines.length; } if(Math.hypot(P.x-x,P.y-y)<200&&(now-lastLineT)<4800){ const t=D.lines[line]; ug.font='15px VT323, monospace'; const tw=ug.measureText(t).width+12, X0=sx(x), Y0=sy(y-46)-22;
    ug.fillStyle='rgba(244,242,236,.95)'; ug.fillRect(X0-tw/2,Y0-20,tw,20); ug.fillStyle='#2a2436'; ug.fillRect(X0-3,Y0,6,3); ug.fillText(t,X0,Y0-3); } };
})();
