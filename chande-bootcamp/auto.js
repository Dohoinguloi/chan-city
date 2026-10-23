/* Chan City — Auto nhiệm vụ: bấm 🤖 Auto ở bảng Việc cần làm. Nhân vật tự lo ngủ / tắm / sạc / ăn khi thấp, tự nhận việc ở người giao trong map,
   tự đi tới chỗ làm (như nút ➜), tới nơi tự tương tác (nhặt đồ, chụp ảnh, nói chuyện...), xong việc tự về báo cáo nhận thưởng; hết việc ở map này thì gọi Grab
   sang map còn việc. Việc cần tự chơi (đua, nhảy, đánh nhau, câu cá...) hoặc đi mãi không tiến triển thì tạm bỏ qua, 3 phút sau thử lại. Bấm phím đi hoặc bấm lại nút để tắt. */
(function(){
const SD=SHARED, Q=SD.QUESTS, T=ART.T, esc=s=>GAME.esc(s), toast=(h,k)=>GAME.toast(h,k);
let ON=false, wait=0, pending=false, dest=null, lastMeal=0, lastGrab=0, lastEat=0, walkKey='', walkAt=0;
const needSkip={}, grabSkip={}, waited={};   /* nhu cầu / điểm đến Grab tạm bỏ qua → lúc thử lại · việc đang chờ (tới giờ thì quay lại) */
let CUR=null;   /* việc Auto đang làm (để biết lỗi "X phút nữa" là của việc nào) */
// lỗi từ server lúc Auto đang làm 1 việc: "X phút / giây nữa", "đang no / bữa tới", "hôm nay đủ" → việc đó phải chờ: làm việc khác gần nhất trước, hết giờ chờ quay lại làm nốt
const waitOf=e=>{ const m=/(\d+)\s*phút nữa/i.exec(e), s=/(\d+)\s*giây nữa/i.exec(e); if(m) return +m[1]*60e3+3000; if(s) return +s[1]*1000+1500;
  if(/Đang no|Bữa tới/i.test(e)) return 300e3; if(/hôm nay|mai quay|ngày mai/i.test(e)) return 1800e3; if(/đợi|chờ|chưa lớn|chưa chín|đang nạp|chưa tới giờ/i.test(e)) return 120e3; return 0; };
const waitFor=(id,w,why)=>{ skip.set(id,performance.now()+w); waited[id]=1; const q=Q[id]; log(`chờ ${Math.round(w/1000)}s: ${id} (${String(why).slice(0,40)})`);
  toast(`🤖 <b>${esc(q?q.title:id)}</b> phải chờ ${w>=60e3?Math.round(w/60e3)+' phút':Math.round(w/1000)+' giây'}: làm việc khác trước, tới giờ quay lại làm nốt`,'quest'); };
{ const req0=NET.req; NET.req=async m=>{ const r=await req0(m); if(ON&&CUR&&r&&r.err&&m&&m.t!=='grab'&&m.t!=='nhosac'){ const w=waitOf(r.err); if(w){ waitFor(CUR,w,r.err); CUR=null; } } return r; }; }
// việc gần nhất trước: việc ở map đang đứng, rồi người giao gần mình nhất
const qScene=id=>{ const q=Q[id]; return q.job?q.job.where:sceneOfNpc(q.giver); }, qDist=id=>{ const n=npcHere(Q[id].giver); return n?dist(n):1e6; };
const byNear=ids=>ids.sort((a,b)=>(qScene(a)===GAME.S.kind?0:1)-(qScene(b)===GAME.S.kind?0:1)||qDist(a)-qDist(b));
const back=id=>{ if(waited[id]){ delete waited[id]; toast(`🤖 Hết giờ chờ, quay lại làm nốt <b>${esc(Q[id].title)}</b>`,'quest'); log('quay lại '+id); } };
const hungry=g=>!!(SD.hunger(g.meals,NET.now())||SD.mealStatus(g.meals,NET.now()).some(m=>m.st==='now'));
const tries={}, prog={}, skip=new Map();   /* việc bỏ qua → thời điểm thử lại */
const skipped=id=>(skip.get(id)||0)>performance.now();
// nhật ký 60 việc gần nhất (mở console gõ AUTOQ.log để xem Auto đã làm gì)
const LOG=[], log=s=>{ LOG.push(Math.round(performance.now()/1000)+'s '+(GAME.S?GAME.S.kind:'')+' '+s); if(LOG.length>60) LOG.shift(); };
const npcHere=id=>GAME.npcs.find(n=>n.id===id), dist=n=>Math.hypot(n.x-GAME.P.x,n.y-GAME.P.y);
const nearGiver=q=>{ if(q.giver==='oii'){ const o=GAME.oii; return o&&o.on&&Math.hypot(o.x-GAME.P.x,o.y-GAME.P.y)<56; } const n=npcHere(q.giver); return n&&dist(n)<56; };
const sceneOfNpc=id=>{ if(id==='kenny') return SD.kennyWhere(NET.now()).scene; const d=SD.NPCS.find(n=>n.id===id); return d?(d.scene||'retreat'):null; };
function set(on,why=''){ log((on?'BẬT':'TẮT')+' '+why); ON=on; skip.clear(); CUR=null; for(const k in waited) delete waited[k]; for(const k in tries) delete tries[k]; for(const k in prog) delete prog[k]; wait=0; GAME.renderHUD();
  toast(on?'🤖 <b>Auto nhiệm vụ: BẬT</b> · tự nhận việc, tự đi làm, tự báo cáo. Bấm phím đi để tắt':'🤖 Auto nhiệm vụ: TẮT',on?'quest':'lock'); }
document.addEventListener('click',e=>{ if(!e.target.closest('#qAuto')) return; e.stopPropagation(); e.preventDefault(); set(!ON,'nút'); },true);
addEventListener('keydown',e=>{ if(!ON||!e.isTrusted) return; const a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')) return; if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) set(false,'phím '+e.key); });
// mỗi việc được thử tối đa 6 lần mà không tiến triển (tiến độ không đổi) thì bỏ qua
function attempt(id,title,max=5,quiet=false){ const p=(Q[id]?GAME.questProgress(id)+'|'+GAME.canFinish(id):'')+'|'+GAME.S.kind;
  if(prog[id]===p) tries[id]=(tries[id]||0)+1; else { prog[id]=p; tries[id]=0; }
  if(skipped(id)) return false; if(tries[id]>max){ skip.set(id,performance.now()+180000); tries[id]=0; if(!quiet) toast(`🤖 Tạm bỏ qua <b>${esc(title||id)}</b> (chưa làm tiếp được, 3 phút sau thử lại)`,'lock'); return false; } return true; }
// những thứ không tự bấm E (không phải việc nhiệm vụ, hoặc tốn tiền / đổi chỗ / lên xe)
const SKIP_E=/Grab|Ra khỏi|Thoát|Ra ngoài|Về nhà|Trồng|Tưới|Thu hoạch|Bơi|bể bơi|Ngồi|Ngủ|Tắm|Mua|Thuê|Lên xe|Cưỡi|Lái|Chèo|Câu cá|Đua|Nhảy|Thách đấu|Đổi|dịch chuyển|Cổ vũ|Tập sút|Rao bán|Bảng xếp hạng|Vào sân|D-Day|Làng Meme|sạc nhờ/i;   /* cổng dịch chuyển, việc ở sân bóng: Auto không tự bấm */
// thứ bấm được gần điểm (tx,ty) nhất: tính nearest() như thể đang đứng ở đó
const atDest=d=>{ const P=GAME.P, ox=P.x, oy=P.y; P.x=d[0]*T; P.y=d[1]*T; try{ return GAME.nearest(); } finally{ P.x=ox; P.y=oy; } };
// nhích từng bước bằng phím ảo cho tới sát (x,y), tối đa 1,2 giây
async function approach(x,y){ const K=GAME.keys, dirs=['w','a','s','d'], P=GAME.P;
  for(let i=0;i<24;i++){ const dx=x-P.x, dy=y-P.y; for(const k of dirs) K.delete(k); if(Math.hypot(dx,dy)<9) break;
    if(Math.abs(dx)>4) K.add(dx>0?'d':'a'); if(Math.abs(dy)>4) K.add(dy>0?'s':'w'); await new Promise(r=>setTimeout(r,50)); }
  for(const k of dirs) K.delete(k); }
// việc ở map khác: gọi Grab tới map đó (mỗi 30 giây tối đa 1 lần)
async function grabTo(scene,why){ const dest=SD.SCENE_DEST[scene]||(SD.DEST[scene]?scene:null), t=performance.now(); if(!dest||!SD.DEST[dest]||t-lastGrab<30000||(grabSkip[dest]||0)>t) return false; lastGrab=t;
  const g=GAME.G; if(g.needs.battery<SD.GRAB.minBattery&&!xtOk()){ log('Grab: hết pin → sạc nhờ trước'); return borrow(); }
  log('Grab → '+dest+' ('+why+')'); const r=await GAME.act({t:'grab',to:dest,xt:xtOk()?1:0}); if(r&&!r.err){ toast(`🤖 ${xtOk()?'Xích Thố dịch chuyển':'Gọi Grab'} tới <b>${esc(SD.DEST[dest].name)}</b> để ${esc(why)}`,'quest'); return true; }
  if(r&&/hết pin/i.test(r.err||'')) return borrow(); grabSkip[dest]=t+300000; log('Grab lỗi: '+(r&&r.err)); return false; }
const xtOk=()=>((GAME.G.xt&&GAME.G.xt.lv)||0)>=SD.XICHTHO.tele;   /* Xích Thố cấp 15: dịch chuyển miễn phí, không cần pin */
// xin sạc nhờ người gần nhất (miễn phí, 15 giây, tối đa NEEDS.borrow.perDay lần / ngày) — dùng được ở mọi map
const canBorrow=()=>{ const g=GAME.G, B=SD.NEEDS.borrow; return g.needs.battery<B.max&&((g.daily&&g.daily.nhosac)||0)<B.perDay; };
function borrow(){ if(!canBorrow()) return false; log('sạc nhờ'); GAME.nhoSac(); return true; }
// nhu cầu (ngủ / tắm / sạc) theo chỗ đang đứng: ở phòng / phòng thuê / nhà tắm chung thì làm luôn; pin thì sạc nhờ; còn lại tự Grab về phòng Hà Nội rồi làm
async function needAuto(k,t){ const g=GAME.G, S=GAME.S, today=SD.vnTime(NET.now()).day, stay=g.stay&&g.stay.paid===today&&g.stay.room, own=g.gear||{};
  if(k==='battery'&&own.pbank&&((g.daily||{}).pbank||0)<SD.GEAR.pbank.per&&await GAME.gearUse('pbank')){ log('dùng sạc dự phòng'); return true; }   /* đồ mang theo: dùng tại chỗ trước khi phải về phòng */
  if(k==='energy'&&own.bag&&await GAME.gearUse('bag')){ log('ngủ túi ngủ di động'); return true; }
  const home=S.kind==='room'||(S.kind==='stay'&&S.own), nearStay=stay&&(S.kind==='retreat'||S.kind==='stay'||(SD.INTERIORS[S.kind]&&!SD.INTERIORS[S.kind].map)), bath=k==='clean'&&S.kind==='retreat'&&(!stay||SD.ROOMS[stay].bath==='chung');
  if(k==='battery'&&!home&&S.kind!=='vnpt'&&borrow()) return true;
  if(home||nearStay||bath||(k==='battery'&&S.kind==='vnpt')){ GAME.needGo(k); return true; }
  if(g.needs.battery<SD.GRAB.minBattery&&!xtOk()&&borrow()) return true;   /* hết pin không gọi được Grab: sạc nhờ trước */
  log('Grab về phòng để '+k); if(await GAME.autoGo('home',()=>GAME.needGo(k))) return true;
  needSkip[k]=t+600000; toast(`🤖 Chưa lo được ${k==='battery'?'pin':k==='energy'?'năng lượng':'vệ sinh'} (thiếu tiền Grab?), 10 phút nữa thử lại`,'lock'); return false; }
async function tick(){ if(!ON||!GAME.started) return; const g=GAME.G, S=GAME.S, P=GAME.P, t=performance.now(); if(!g||!S||t<wait) return;
  // hộp thoại NPC: bấm cho qua lời; có lựa chọn thì chọn nhận / đồng ý / báo cáo, tránh lựa chọn tốn tiền (không có thì chọn cái cuối: thường là Thôi / Để sau)
  const dlg=document.getElementById('dialog'); if(dlg&&!dlg.hidden){ const ch=[...document.querySelectorAll('#dlgChoices .choice')];
    if(ch.length){ const ok=ch.findIndex(b=>/Nhận|Đồng ý|Được|OK|Có|Báo cáo|Trả việc|Xong|Đi thôi|Nghe/i.test(b.textContent)&&!/Mua|Nộp|Thuê|Trả tiền|Cược|đ\b|\d\.\d{3}/i.test(b.textContent)); const pick=ch[ok>=0?ok:ch.length-1]; log('chọn: '+pick.textContent.trim()); pick.click(); }
    else dlg.click(); wait=t+350; return; }
  // bảng đang mở (kể cả bảng tự bật giữa đường như quà, hằng ngày: chặn di chuyển): bấm nút nhận / báo cáo việc nếu có, không thì đóng lại
  if(UI.isOpen()&&UI.loAuto&&UI.loAuto()){ wait=t+1000; return; }   /* đang giải toả: tự giữ thanh, chờ xong */
  { const lb=UI.isOpen()&&g.quests.lo==='active'&&!GAME.canFinish('lo')&&g.needs.battery>=SD.LO.battery&&(S.kind==='room'||(S.kind==='stay'&&S.own))&&document.querySelector('#panel [data-a="lo"]'); if(lb){ log('giải toả'); lb.click(); wait=t+1500; return; } }
  if(UI.isOpen()){ const b=document.querySelector('#panel [data-a="qfinish"],#panel [data-a="qstart"]'); if(b&&!skipped(b.dataset.id)){ log('bảng: '+b.textContent.trim()); b.click(); wait=t+900; return; }
    // quán ăn: việc cần ăn món nào thì mua món đó; đang đói / tới bữa thì ăn món đầu tiên còn mua được
    const eatQ=Object.keys(Q).find(id=>g.quests[id]==='active'&&Q[id].eat&&document.querySelector(`#panel [data-a="eat"][data-id="${Q[id].eat.id}"]:not([disabled])`));
    const eb=eatQ?document.querySelector(`#panel [data-a="eat"][data-id="${Q[eatQ].eat.id}"]`):(hungry(g)?[...document.querySelectorAll('#panel [data-a="eat"]:not([disabled])')].find(b=>b.textContent.trim()==='Ăn'):null);   /* đói thì chọn món ăn, không mua đồ uống */
    if(eb&&t-lastEat>2500){ lastEat=t; log('ăn: '+eb.dataset.id); eb.click(); wait=t+1500; return; }
    log('đóng bảng '+(document.getElementById('panelTitle')||{}).textContent); UI.closeAll(); if(!GAME.AUTOWALK) pending=false; wait=t+500; return; }
  if(GAME.AUTOWALK||GAME.TASK){ if(GAME.AUTOWALK){ pending=true; dest=GAME.AUTOWALK.dest; const key=S.kind+':'+(dest||[]).join(','); if(key!==walkKey){ walkKey=key; walkAt=t; } else if(t-walkAt>90000){ log('đi mãi không tới, huỷ'); walkKey=''; pending=false; GAME.walkTo(P.x/T,P.y/T,null,null,{quiet:true}); wait=t+800; } } return; }
  if(g.jail&&g.jail.until>NET.now()) return;
  // vừa đi tới nơi: chưa có gì để bấm thì nhích sát đích thêm, rồi tự tương tác với thứ gần nhất (trừ cửa ra / gọi Grab)
  if(pending){ const d=dest; pending=false; dest=null; const n=d&&atDest(d);   /* thứ nằm đúng ở điểm đích (con bướm, bó củi, người giao...), không phải thứ gần người nhất */
    if(n&&!SKIP_E.test(n.label||'')){ if(Math.hypot(d[0]*T-P.x,d[1]*T-P.y)>12) await approach(d[0]*T,d[1]*T); log('E (tới nơi): '+n.label); GAME.interact(n); wait=t+1200; return; } }
  // 1. nhu cầu: ngủ / tắm / sạc khi dưới 18%, đến giờ ăn hoặc đang đói thì đi ăn
  const nd=g.needs; for(const k of ['battery','energy','clean']) if(nd[k]<18&&!((needSkip[k]||0)>t)){ log('nhu cầu '+k); await needAuto(k,t); wait=t+4000; return; }
  if(hungry(g)&&(g.items.luong_kho||0)>0&&t-lastMeal>30000){ lastMeal=t; if(await GAME.gearUse('luong')){ log('ăn lương khô'); wait=t+1500; return; } }
  if(hungry(g)&&t-lastMeal>90000){ lastMeal=t; const shop=GAME.npcs.some(n=>{ const d=SD.NPCS.find(x=>x.id===n.id), pc=d&&d.place&&SD.PLACES[d.place]; return pc&&(pc.menu||[]).length; });
    if(shop){ log('đi ăn'); GAME.eatGo(); wait=t+4000; return; } lastMeal=t+480000; log('map không có quán ăn, để sau'); }
  // mới vào game: đi gặp Pháp ở cổng Ké trước
  if(S.kind==='retreat'&&!g.flags.hello){ if(attempt('phap','Gặp Pháp',8)){ GAME.walkToNpc('phap'); wait=t+2500; } return; }
  const act=byNear(Object.keys(Q).filter(id=>g.quests[id]==='active'&&!skipped(id)));
  // 2. việc đã đủ: về báo cáo nhận thưởng
  for(const id of act){ if(!GAME.canFinish(id)) continue; const q=Q[id];
    if(nearGiver(q)){ log('báo cáo '+id); await GAME.finishQuest(id); toast(`🤖 Báo cáo xong: <b>${esc(q.title)}</b>`,'quest'); wait=t+1200; return; }
    if(!attempt(id,q.title)) continue; back(id); CUR=id; log('về báo cáo '+id); GAME.questGo(id); pending=true; dest=GAME.AUTOWALK?GAME.AUTOWALK.dest:[GAME.P.x/T,GAME.P.y/T];   /* đã đứng sẵn ở chỗ làm thì bấm ngay tại đây */ wait=t+1500; if(!GAME.AUTOWALK&&!npcHere(q.giver)) await grabTo(sceneOfNpc(q.giver),'báo cáo '+q.title); return; }
  // 3. đang làm dở: đi tiếp tới chỗ làm
  for(const id of act){ const q=Q[id];
    if(q.butterflies){ const now=NET.now(), left=SD.BUTTERFLY.spots.map((s,i)=>[s,i]).filter(([s])=>!(g.items['buom_'+s.k]>0)), ready=left.filter(([,i])=>((g.buom||{})[i]||0)<now);   /* mọi chỗ bướm đang chờ bay lại: chờ tới lượt sớm nhất */
      if(left.length&&!ready.length){ waitFor(id,Math.min(...left.map(([,i])=>g.buom[i]))-now+1500,'bướm chưa bay lại'); continue; } }
    if(q.eat){ const f=SD.FOOD[q.eat.id], now=NET.now(), cd=(g.foodCd||{})[q.eat.id]||0;   /* việc ăn: vừa ăn món này (hồi món) / món là bữa chính mà chưa tới bữa → chờ đúng tới lúc ăn được */
      if(cd>now){ waitFor(id,cd-now+1500,'vừa ăn món này'); continue; }
      if(f&&f.meal){ const st=SD.mealStatus(g.meals,now); if(!st.some(x=>x.st==='now'||x.st==='missed')){ const nx=st.find(x=>x.st==='later'); if(nx){ waitFor(id,((nx.from-SD.vnTime(now).hf+24)%24)*3600e3/SD.RULES.timeScale+2000,'chưa tới bữa'); continue; } } } }
    if(!attempt(id,q.title)) continue; back(id); CUR=id; log('làm '+id+' ('+GAME.questProgress(id)+')'); GAME.questGo(id); pending=true; dest=GAME.AUTOWALK?GAME.AUTOWALK.dest:[GAME.P.x/T,GAME.P.y/T];   /* đã đứng sẵn ở chỗ làm thì bấm ngay tại đây */ wait=t+1500;
    if(!GAME.AUTOWALK){ const sc=q.job?q.job.where:q.lo?null:sceneOfNpc(q.giver);   /* giải toả làm ở phòng mình, không phải map người giao */ if(sc&&sc!==S.kind&&await grabTo(sc,'làm '+q.title)) return; }
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
