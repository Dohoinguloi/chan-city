/* Chan City — client của Lavi Studio (TP.HCM): tương tác lv:spot, câu đố typography / layout của Linh Manh, Gấu và Luna đi lại quanh ổ nằm
   (vẫy đuôi, bấm E để vuốt ve), chỉ đường nhiệm vụ, hình động góc vibe code + màn chiếu. Nối thêm vào MAPX. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX, L=SD.LAVI, G=()=>GAME.G, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k), btn=(...a)=>UI.btn(...a);
const Q=id=>(G().quests||{})[id], here=()=>GAME.S&&GAME.S.kind==='lavi', CACHE={}, cached=(k,fn)=>CACHE[k]||(CACHE[k]=fn()), DOGS=['be_muc','be_bo'];
const secret=r=>{ GAME.sfx('level_up',.5); GAME.bigText('NHIỆM VỤ BÍ MẬT!'); toast(esc(r.msg),'quest'); };
/* ---------- câu đố ---------- */
function quiz(z){ GAME.sfx('blip',.5); GAME.ask(`📝 Câu ${z.n}/${z.of}: ${z.q}`,'linhmanh',z.opts,async a=>{ const r=await GAME.act({t:'lv',op:'answer',a}); if(!r||r.err) return;
  toast(r.right?'✔ Chuẩn!':`✘ Chưa đúng. Đáp án: "${esc(r.good)}"`,r.right?'item':'lock'); if(r.next) return setTimeout(()=>quiz(r.next),600);
  if(r.done){ GAME.sfx(r.pass?'quest_complete':'blip',.6); setTimeout(()=>toast(esc(r.msg),r.pass?'quest':'lock'),500); } }); }
NET.listen('task',m=>{ if(m.done&&m.lvq) setTimeout(()=>quiz(m.lvq),700); });
X.lv=async(op,it)=>{ const r=await GAME.act({t:'lv',op:'spot',k:it&&it.k}); if(!r||r.err) return; if(r.secret) return secret(r); if(r.quiz) return quiz(r.quiz); if(r.msg) return toast(esc(r.msg),'item'); if(r.sec) toast('Bắt đầu... đứng yên nhé','quest'); };
/* ---------- 2 bé cún ---------- */
const dogPos=(k,clock)=>{ const b=L[k==='be_muc'?'muc':'bo'], i=k==='be_muc'?0:1, ph=clock*.35+i*2; return [b.x+Math.sin(ph)*1.1,b.y+Math.sin(ph*1.7)*.4,Math.cos(ph)>0?1:-1]; };
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()) return; for(const k of DOGS){ const [x,y]=dogPos(k,GAME.clock), d=dist(x*T,y*T); if(d<30) consider(d*.5,{type:'mapx',k,label:'Vuốt ve '+SD.NPC_LOOKS[k].name.split(' (')[0]}); } };
const p0=X.pick; X.pick=x=>DOGS.includes(x.k)?UI.place('lvdog',{id:x.k}):p0(x);
const a0=X.anim; X.anim=(o,clock)=>{ if(o.anim==='lvvibe'){ const f=Math.floor(clock*2)%5; return cached('vb'+f,()=>A.vibeDesk(f)); } if(o.anim==='lvscreen'){ const f=Math.floor(clock/3)%3; return cached('sc'+f,()=>A.laviScreen(f)); } return a0(o,clock); };
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()) return; const cam=GAME.cam, clock=GAME.clock;
  for(const k of DOGS){ const [dx,dy,face]=dogPos(k,clock), x=dx*T, y=dy*T, fr=Math.floor(clock*4)%2, sp=cached(k+fr,()=>k==='be_muc'?A.beMuc(fr):A.beBo(fr));
    list.push({y,d:()=>{ GAME.shadow(x,y,9); const X0=Math.round(x-cam.x), Y0=Math.round(y-cam.y); ctx.save(); if(face>0){ ctx.translate(X0*2,0); ctx.scale(-1,1); } ctx.drawImage(sp.c,X0-sp.ax,Y0-sp.ay); ctx.restore(); }}); } };
/* ---------- chỉ đường ---------- */
const g0=X.go; X.go=id=>{ if(!/^(lv_|sq_xuong|sq_no_bo|sq_bua_khuya|sq_dao)/.test(id)) return g0(id); const q=SD.QUESTS[id]; if(!q) return false;
  if(!here()){ GAME.autoGo('lavi',()=>GAME.questGo(id)); return true; }
  if(GAME.canFinish(id)||Q(id)!=='active'){ if(DOGS.includes(q.giver)){ const [x,y]=dogPos(q.giver,GAME.clock); GAME.walkTo(x,y+.8,SD.NPC_LOOKS[q.giver].name); } else GAME.walkToNpc(q.giver); return true; }
  const t=L.tasks[id]; if(t){ const s=L.spots[t.at]; GAME.walkTo(s.x,s.y,s.label); return true; } GAME.walkToNpc(q.giver); return true; };
/* ---------- bảng hội thoại ---------- */
const LM_SAY=['Chữ đẹp là chữ dễ đọc trước đã, rồi mới tới cá tính.','Layout đẹp nằm ở khoảng trắng. Đừng sợ để trống!','Vibe code thì vibe nhưng vẫn phải đọc code AI viết nhé.','Hai bé cún là trưởng phòng tinh thần của Lavi đấy.'];
let lmSay=0;
UI.defPlace('linhmanh',()=>UI.open('Linh Manh · Lavi Studio',()=>`<p>"${esc(LM_SAY[lmSay])}"</p>${btn('lmsay','💬 Nghe Linh Manh chia sẻ')}${['lv_kern','lv_grid','lv_vibe','lv_launch','sq_bua_khuya'].filter(k=>!SD.QUESTS[k].secret||Q(k)).map(UI.qRow).join('')}
  <p class="muted">Việc typography và layout xong phải trả lời 3 câu đố, đúng từ 2 câu mới qua. Gấu và Luna hay giấu đồ quanh studio đấy!</p>`));
UI.onAct('lmsay',()=>{ lmSay=(lmSay+1)%LM_SAY.length; GAME.sayLine(LM_SAY[lmSay],.7,'vi'); UI.refresh(); });
UI.defPlace('lvmem',()=>UI.open('Designer Lavi',()=>`<p>"Chào bạn! Mình làm UI ở Lavi. Linh Manh khó tính lắm, căn lệch 1px là bắt làm lại đó hihi."</p><p>"Gấu hay rúc vào ghế sofa, còn Luna thì cứ chạy ra kệ sách mẫu chữ. Nửa đêm hai bé ngồi chầu bát ăn đòi ăn khuya!"</p>`));
let dogLine={};
UI.defPlace('lvdog',n=>UI.open(SD.NPC_LOOKS[n.id].name,()=>{ const sec=Object.keys(SD.QUESTS).filter(k=>SD.QUESTS[k].giver===n.id), shown=sec.filter(k=>Q(k));
  return `<p>${esc(dogLine[n.id]||SD.LAVI.lines[n.id][0])}</p>${btn('lvpet','🐾 Vuốt ve',{who:n.id},'pri')}${shown.map(UI.qRow).join('')}${sec.length>shown.length?'<p class="muted">🔍 Bé có vẻ muốn nhờ bạn chuyện gì đó... thử vuốt ve thêm hoặc lục lọi quanh studio.</p>':''}`; }));
UI.onAct('lvpet',async d=>{ const r=await GAME.act({t:'lv',op:'talk',who:d.who}); if(!r||r.err) return; GAME.sfx('dog_bark',.4); if(r.secret) secret(r); else dogLine[d.who]=r.msg; UI.refresh(); });
})();
