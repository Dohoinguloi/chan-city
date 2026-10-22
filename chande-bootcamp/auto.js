/* Chan City — Auto nhiệm vụ: bấm 🤖 Auto ở bảng Việc cần làm. Nhân vật tự lo ngủ / tắm / sạc / ăn khi thấp, tự nhận việc ở người giao trong map,
   tự đi tới chỗ làm (như nút ➜), tới nơi tự tương tác (nhặt đồ, chụp ảnh, nói chuyện...), xong việc tự về báo cáo nhận thưởng; hết việc ở map này thì gọi Grab
   sang map còn việc. Việc cần tự chơi (đua, nhảy, đánh nhau, câu cá...) hoặc đi mãi không tiến triển thì tạm bỏ qua, 3 phút sau thử lại. Bấm phím đi hoặc bấm lại nút để tắt. */
(function(){
const SD=SHARED, Q=SD.QUESTS, T=ART.T, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k);
let ON=false, wait=0, pending=false, dest=null, lastMeal=0, lastGrab=0, lastEat=0;
const hungry=g=>!!(SD.hunger(g.meals,NET.now())||SD.mealStatus(g.meals,NET.now()).some(m=>m.st==='now'));
const tries={}, prog={}, skip=new Map();   // việc bỏ qua → thời điểm thử lại (3 phút sau)
const skipped=id=>(skip.get(id)||0)>performance.now();
// nhật ký 60 việc gần nhất (mở console gõ AUTOQ.log để xem Auto đã làm gì)
const LOG=[], log=s=>{ LOG.push(Math.round(performance.now()/1000)+'s '+(GAME.S?GAME.S.kind:'')+' '+s); if(LOG.length>60) LOG.shift(); };
const npcHere=id=>GAME.npcs.find(n=>n.id===id), dist=n=>Math.hypot(n.x-GAME.P.x,n.y-GAME.P.y);
const nearGiver=q=>{ if(q.giver==='oii'){ const o=GAME.oii; return o&&o.on&&Math.hypot(o.x-GAME.P.x,o.y-GAME.P.y)<56; } const n=npcHere(q.giver); return n&&dist(n)<56; };
const sceneOfNpc=id=>{ const d=SD.NPCS.find(n=>n.id===id); return d?(d.scene||'retreat'):null; };
function set(on,why=''){ log((on?'BẬT':'TẮT')+' '+why); ON=on; skip.clear(); for(const k in tries) delete tries[k]; for(const k in prog) delete prog[k]; wait=0; GAME.renderHUD();
  toast(on?'🤖 <b>Auto nhiệm vụ: BẬT</b> · tự nhận việc, tự đi làm, tự báo cáo. Bấm phím đi để tắt':'🤖 Auto nhiệm vụ: TẮT',on?'quest':'lock'); }
document.addEventListener('click',e=>{ if(!e.target.closest('#qAuto')) return; e.stopPropagation(); e.preventDefault(); set(!ON,'nút'); },true);
addEventListener('keydown',e=>{ if(!ON||!e.isTrusted) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) set(false,'phím '+e.key); });
// mỗi việc được thử tối đa 6 lần mà không tiến triển (tiến độ không đổi) thì bỏ qua
function attempt(id,title,max=5,quiet=false){ const p=(Q[id]?GAME.questProgress(id)+'|'+GAME.canFinish(id):'')+'|'+GAME.S.kind;
  if(prog[id]===p) tries[id]=(tries[id]||0)+1; else { prog[id]=p; tries[id]=0; }
  if(skipped(id)) return false; if(tries[id]>max){ skip.set(id,performance.now()+180000); tries[id]=0; if(!quiet) toast(`🤖 Tạm bỏ qua <b>${esc(title||id)}</b> (chưa làm tiếp được, 3 phút sau thử lại)`,'lock'); return false; } return true; }
// những thứ không tự bấm E (không phải việc nhiệm vụ, hoặc tốn tiền / đổi chỗ / lên xe)
const SKIP_E=/Grab|Ra khỏi|Thoát|Ra ngoài|Về nhà|Trồng|Tưới|Thu hoạch|Bơi|bể bơi|Ngồi|Ngủ|Tắm|Mua|Thuê|Lên xe|Cưỡi|Lái|Chèo|Câu cá|Đua|Nhảy|Thách đấu|Đổi/i;
// thứ bấm được gần điểm (tx,ty) nhất: tính nearest() như thể đang đứng ở đó
const atDest=d=>{ const P=GAME.P, ox=P.x, oy=P.y; P.x=d[0]*T; P.y=d[1]*T; try{ return GAME.nearest(); } finally{ P.x=ox; P.y=oy; } };
// nhích từng bước bằng phím ảo cho tới sát (x,y), tối đa 1,2 giây
async function approach(x,y){ const K=GAME.keys, dirs=['w','a','s','d'], P=GAME.P;
  for(let i=0;i<24;i++){ const dx=x-P.x, dy=y-P.y; for(const k of dirs) K.delete(k); if(Math.hypot(dx,dy)<9) break;
    if(Math.abs(dx)>4) K.add(dx>0?'d':'a'); if(Math.abs(dy)>4) K.add(dy>0?'s':'w'); await new Promise(r=>setTimeout(r,50)); }
  for(const k of dirs) K.delete(k); }
// việc ở map khác: gọi Grab tới map đó (mỗi 30 giây tối đa 1 lần)
async function grabTo(scene,why){ const dest=SD.SCENE_DEST[scene]||(SD.DEST[scene]?scene:null); if(!dest||!SD.DEST[dest]||performance.now()-lastGrab<30000) return false; lastGrab=performance.now();
  log('Grab → '+dest+' ('+why+')'); const r=await GAME.act({t:'grab',to:dest}); if(r&&!r.err){ toast(`🤖 Gọi Grab tới <b>${esc(SD.DEST[dest].name)}</b> để ${esc(why)}`,'quest'); return true; } return false; }
async function tick(){ if(!ON||!GAME.started) return; const g=GAME.G, S=GAME.S, P=GAME.P, t=performance.now(); if(!g||!S||t<wait) return;
  // hộp thoại NPC: bấm cho qua lời; có lựa chọn thì chọn nhận / đồng ý / báo cáo, tránh lựa chọn tốn tiền (không có thì chọn cái cuối: thường là Thôi / Để sau)
  const dlg=document.getElementById('dialog'); if(dlg&&!dlg.hidden){ const ch=[...document.querySelectorAll('#dlgChoices .choice')];
    if(ch.length){ const ok=ch.findIndex(b=>/Nhận|Đồng ý|Được|OK|Có|Báo cáo|Trả việc|Xong|Đi thôi|Nghe/i.test(b.textContent)&&!/Mua|Nộp|Thuê|Trả tiền|Cược|đ\b|\d\.\d{3}/i.test(b.textContent)); const pick=ch[ok>=0?ok:ch.length-1]; log('chọn: '+pick.textContent.trim()); pick.click(); }
    else dlg.click(); wait=t+350; return; }
  // bảng đang mở (kể cả bảng tự bật giữa đường như quà, hằng ngày: chặn di chuyển): bấm nút nhận / báo cáo việc nếu có, không thì đóng lại
  if(UI.isOpen()){ const b=document.querySelector('#panel [data-a="qfinish"],#panel [data-a="qstart"]'); if(b&&!skipped(b.dataset.id)){ log('bảng: '+b.textContent.trim()); b.click(); wait=t+900; return; }
    // quán ăn: việc cần ăn món nào thì mua món đó; đang đói / tới bữa thì ăn món đầu tiên còn mua được
    const eatQ=Object.keys(Q).find(id=>g.quests[id]==='active'&&Q[id].eat&&document.querySelector(`#panel [data-a="eat"][data-id="${Q[id].eat.id}"]:not([disabled])`));
    const eb=eatQ?document.querySelector(`#panel [data-a="eat"][data-id="${Q[eatQ].eat.id}"]`):(hungry(g)?[...document.querySelectorAll('#panel [data-a="eat"]:not([disabled])')].find(b=>b.textContent.trim()==='Ăn'):null);   /* đói thì chọn món ăn, không mua đồ uống */
    if(eb&&t-lastEat>2500){ lastEat=t; log('ăn: '+eb.dataset.id); eb.click(); wait=t+1500; return; }
    log('đóng bảng '+(document.getElementById('panelTitle')||{}).textContent); UI.closeAll(); if(!GAME.AUTOWALK) pending=false; wait=t+500; return; }
  if(GAME.AUTOWALK||GAME.TASK){ if(GAME.AUTOWALK){ pending=true; dest=GAME.AUTOWALK.dest; } return; }
  if(g.jail&&g.jail.until>NET.now()) return;
  // vừa đi tới nơi: chưa có gì để bấm thì nhích sát đích thêm, rồi tự tương tác với thứ gần nhất (trừ cửa ra / gọi Grab)
  if(pending){ const d=dest; pending=false; dest=null; const n=d&&atDest(d);   // thứ nằm đúng ở điểm đích (con bướm, bó củi, người giao...), không phải thứ gần người nhất
    if(n&&!SKIP_E.test(n.label||'')){ if(Math.hypot(d[0]*T-P.x,d[1]*T-P.y)>12) await approach(d[0]*T,d[1]*T); log('E (tới nơi): '+n.label); GAME.interact(n); wait=t+1200; return; } }
  // 1. nhu cầu: ngủ / tắm / sạc khi dưới 18%, đến giờ ăn hoặc đang đói thì đi ăn
  const nd=g.needs; for(const k of ['energy','clean','battery']) if(nd[k]<18){ log('nhu cầu '+k); GAME.needGo(k); wait=t+4000; return; }
  if(hungry(g)&&t-lastMeal>90000){ lastMeal=t; log('đi ăn'); GAME.eatGo(); wait=t+4000; return; }
  // mới vào game: đi gặp Pháp ở cổng Ké trước
  if(S.kind==='retreat'&&!g.flags.hello){ if(attempt('phap','Gặp Pháp',8)){ GAME.walkToNpc('phap'); wait=t+2500; } return; }
  const act=Object.keys(Q).filter(id=>g.quests[id]==='active'&&!skipped(id));
  // 2. việc đã đủ: về báo cáo nhận thưởng
  for(const id of act){ if(!GAME.canFinish(id)) continue; const q=Q[id];
    if(nearGiver(q)){ log('báo cáo '+id); await GAME.finishQuest(id); toast(`🤖 Báo cáo xong: <b>${esc(q.title)}</b>`,'quest'); wait=t+1200; return; }
    if(!attempt(id,q.title)) continue; log('về báo cáo '+id); GAME.questGo(id); pending=true; dest=GAME.AUTOWALK?GAME.AUTOWALK.dest:[GAME.P.x/T,GAME.P.y/T];   /* đã đứng sẵn ở chỗ làm thì bấm ngay tại đây */ wait=t+1500; if(!GAME.AUTOWALK&&!npcHere(q.giver)) await grabTo(sceneOfNpc(q.giver),'báo cáo '+q.title); return; }
  // 3. đang làm dở: đi tiếp tới chỗ làm
  for(const id of act){ const q=Q[id]; if(!attempt(id,q.title)) continue; log('làm '+id+' ('+GAME.questProgress(id)+')'); GAME.questGo(id); pending=true; dest=GAME.AUTOWALK?GAME.AUTOWALK.dest:[GAME.P.x/T,GAME.P.y/T];   /* đã đứng sẵn ở chỗ làm thì bấm ngay tại đây */ wait=t+1500;
    if(!GAME.AUTOWALK){ const sc=q.job?q.job.where:sceneOfNpc(q.giver); if(sc&&sc!==S.kind&&await grabTo(sc,'làm '+q.title)) return; }
    return; }
  // 4. nhận việc mới ở người giao trong map (gần nhất trước)
  const can=(id,q)=>!g.quests[id]&&!q.secret&&!skipped(id)&&(!q.after||g.quests[q.after]==='done');
  const here=Object.entries(Q).filter(([id,q])=>can(id,q)&&npcHere(q.giver)).sort((a,b)=>dist(npcHere(a[1].giver))-dist(npcHere(b[1].giver)));
  if(here.length){ const [id,q]=here[0];
    if(nearGiver(q)){ log('nhận '+id); const r=await GAME.act({t:'quest',id,op:'start'}); if(r&&r.err) skip.set(id,performance.now()+180000); else { GAME.sfx('quest_accept',.5); toast(`🤖 Nhận việc: <b>${esc(q.title)}</b>`,'quest'); } wait=t+800; return; }
    if(!attempt('nhan:'+id,q.title,10)){ skip.set(id,performance.now()+180000); return; } const n=npcHere(q.giver); log('tới người giao '+q.giver+' ('+id+')'); GAME.walkTo(n.x/T,n.y/T+1.1,'người giao việc',null,{quiet:true}); wait=t+1500; return; }
  // 5. đang đứng cạnh thứ bấm E được (nút E hiện ra) thì bấm hộ, mỗi thứ tối đa 3 lần
  { const n=GAME.nearest(), pr=document.getElementById('prompt'); if(n&&pr&&!pr.hidden&&!SKIP_E.test(n.label||'')&&attempt('E:'+n.label,n.label,2,true)){ log('E hộ: '+n.label); GAME.interact(n); wait=t+1200; return; } }
  // 6. hết việc ở map này: gọi Grab sang map còn việc, không còn thì tắt Auto
  const far=Object.entries(Q).find(([id,q])=>can(id,q)&&sceneOfNpc(q.giver)&&sceneOfNpc(q.giver)!==S.kind);
  if(far&&await grabTo(sceneOfNpc(far[1].giver),'nhận việc '+far[1].title)){ wait=t+3000; return; }
  if(!far){ if(Object.keys(Q).some(id=>g.quests[id]==='active')){ wait=t+5000; return; }   /* còn việc tạm bỏ qua: đợi tới lượt thử lại */
    toast('🤖 Hết việc làm được rồi!','quest'); set(false,'hết việc'); }
  wait=t+3000; }
setInterval(()=>{ tick().catch(e=>{ console.error('[auto]',e); wait=performance.now()+3000; }); },700);
window.AUTOQ={get on(){ return ON; },set,get log(){ return LOG.slice(); }};
})();
