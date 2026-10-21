/* Chan City — engine top-down nhiều người chơi. Server quyết định tiền, EXP, đồ, cảnh; client vẽ, đi lại, hội thoại, menu.
   Map: phòng riêng Hà Nội · Ké Retreat (+ tiệm, shop, Nhà giải trí, phòng thuê) · văn phòng Everfit · nông trại Đà Lạt · trường đua. */
(function(){
const A=ART, Wd=WORLD, SD=SHARED, T=A.T, $=s=>document.querySelector(s), fmt=SD.fmt;
const SPR='../pixel-sprite-forge/characters/';
const STORY={phap:1,phule:1,donche:1,khabanh:1,kenny:1,huyphan:1};

/* ---------- canvas ---------- */
const cvs=$('#game'), ctx=cvs.getContext('2d'), uic=$('#ui'), ug=uic.getContext('2d');
let VW=400, VH=225, SCALE=3, DPR=1;
function resize(){ SCALE=Math.max(2,Math.round(Math.min(innerHeight/240,innerWidth/400))); VW=Math.ceil(innerWidth/SCALE); VH=Math.ceil(innerHeight/SCALE);
  cvs.width=VW; cvs.height=VH; cvs.style.width=VW*SCALE+'px'; cvs.style.height=VH*SCALE+'px'; ctx.imageSmoothingEnabled=false;
  DPR=Math.min(2,devicePixelRatio||1); uic.width=innerWidth*DPR; uic.height=innerHeight*DPR; uic.style.width=innerWidth+'px'; uic.style.height=innerHeight+'px'; }
addEventListener('resize',resize); resize();

/* ---------- âm thanh (Magnific tạo) ---------- */
const AUD={muted:false,files:{},music:null,cur:''};
try{ AUD.muted=localStorage.getItem('chande-mute')==='1'; }catch(e){}
async function loadAudio(){ try{ const m=await (await fetch('audio/manifest.json')).json();
  for(const [k,f] of Object.entries(m)){ const a=new Audio('audio/'+f); a.preload='auto'; AUD.files[k]=a; } }catch(e){} }
const MONO={blip:1,step1:1,step2:1}, monoNode={};
function sfx(k,vol=.55){ if(AUD.muted) return; const a=AUD.files[k]; if(!a) return;
  if(MONO[k]){ const n=monoNode[k]||(monoNode[k]=a.cloneNode()); n.volume=vol; n.currentTime=0; n.play().catch(()=>{}); return n; }
  const n=a.cloneNode(); n.volume=vol; n.play().catch(()=>{}); return n; }
function music(k){ if(AUD.cur===k) return; AUD.cur=k; const old=AUD.music;
  if(old){ let v=old.volume; const t=setInterval(()=>{ v-=.05; if(v<=0){ old.pause(); clearInterval(t); } else old.volume=v; },60); }
  const a=AUD.files[k]; if(!a){ AUD.music=null; return; } const n=a.cloneNode(); n.loop=true; n.volume=0; AUD.music=n; if(!AUD.muted) n.play().catch(()=>{});
  let v=0; const t=setInterval(()=>{ v+=.04; if(v>=.34){ v=.34; clearInterval(t); } n.volume=v; },60); }
function setMute(m){ AUD.muted=m; try{ localStorage.setItem('chande-mute',m?'1':'0'); }catch(e){} if(AUD.music){ if(m) AUD.music.pause(); else AUD.music.play().catch(()=>{}); }
  for(const b of document.querySelectorAll('.muteBtn')){ b.classList.toggle('off',m); b.setAttribute('aria-pressed',String(!m)); const l=b.querySelector('.lbl'); if(l) l.textContent=m?'Tiếng: tắt':'Tiếng: bật'; } }
document.addEventListener('click',e=>{ const b=e.target.closest('.muteBtn'); if(b){ setMute(!AUD.muted); b.blur(); } });

/* ---------- sprite ---------- */
const SHEETS={}; let PETS=null;
async function loadSheet(path){ const [img,json]=await Promise.all([new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=SPR+path+'_sheet.png'; }),fetch(SPR+path+'_sheet.json').then(r=>r.json())]);
  const {frameWidth:fw,frameHeight:fh}=json.meta.grid, out={fw,fh,anims:{}};
  for(const t of json.meta.frameTags){ const fr=[]; for(let i=0;i<=t.to-t.from;i++){ const c=A.cv(fw,fh); c.getContext('2d').drawImage(img,i*fw,t.row*fh,fw,fh,0,0,fw,fh); fr.push(c); } out.anims[t.name]={frames:fr,fps:t.fps||6,loop:t.loop}; }
  return out; }
const PORTRAIT={};
function portrait(who){ if(who==='me') return P.av?P.av.portrait:null;
  if(PORTRAIT[who]) return PORTRAIT[who]; const c=A.cv(84,84), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,84,84);
  if(who==='beagle'&&PETS){ g.drawImage(PETS.anims.idle.frames[0],10,1,14,12,0,8,84,72); }
  else if(STORY[who]){ const sh=who==='phap'&&G&&G.flags.phapForm==='cam'?SHEETS.phap2:SHEETS[who]; if(sh) g.drawImage(sh.anims.idle.frames[0],5,12,22,20,0,2,88,80); }
  else if(SD.NPC_LOOKS[who]) return PORTRAIT[who]=AVATAR.build(SD.NPC_LOOKS[who].look).portrait;
  return PORTRAIT[who]=c; }

/* ---------- trạng thái ---------- */
let G=null;                                  // hồ sơ của mình (server gửi)
const P={x:0,y:0,face:1,view:'down',anim:'idle',t:0,act:null,actT:0,moving:false,dashT:0,dashCD:0,stepT:0,av:null,look:'',kayak:false,riding:false,link:null};
const pet={x:0,y:0,face:1,anim:'sit',t:0,still:0}, chick={x:0,y:0,face:1,t:0,tx:0,ty:0,wait:0};
let S=null, npcs=[], fx=[], zoneName='', flash=0, soiT=0, clock=0;
const REM=new Map(), PLOTS={}, SOCS=new Map();
let TASK=null, FISH=null, HERD=null, TABLE=null, RACE=null, started=false;
const MAPS={};
const ACTS=SD.ACTS, VIEWS=['side','down','up'], ANIMS=['idle','walk','run'];
const vn=()=>SD.vnTime(NET.now());

/* ---------- cảnh ---------- */
function buildMap(kind,room){ if(kind==='room') return Wd.buildRoom(); if(kind==='retreat') return Wd.buildRetreat(); if(kind==='stay') return Wd.buildStay(room);
  if(kind==='everfit') return Wd.buildOffice(); if(kind==='dalat') return Wd.buildDalat(); if(kind==='track') return Wd.buildTrack(); return Wd.buildInterior(kind); }
function prep(m,kind){ const W=m.W, H=m.H, solid=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!A.WALKABLE.has(m.grid[y][x])) solid[y*W+x]=1;
  for(const [x0,y0,x1,y1] of m.solid) for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(x>=0&&y>=0&&x<W&&y<H) solid[y*W+x]=1;
  const edge=kind==='room'||m.indoor?'H':'F';
  const ground=[0,1].map(fr=>{ const c=A.cv(W*T,H*T), g=c.getContext('2d');
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) A.drawTile(g,m.grid[y][x],x,y,(dx,dy)=>{ const yy=y+dy, xx=x+dx; return yy>=0&&yy<H&&xx>=0&&xx<W?m.grid[yy][xx]:edge; },fr);
    for(const o of m.obj) if(o.flat) g.drawImage(o.spr.c,o.x-o.spr.ax,o.y-o.spr.ay); return c; });
  return {map:m,W,H,solid,ground,objs:m.obj.filter(o=>!o.flat&&!o.over).sort((a,b)=>(a.sort??a.y)-(b.sort??b.y)),over:m.obj.filter(o=>o.over)}; }
function sceneData(kind,room){ const key=kind==='stay'?'stay:'+room:kind; return MAPS[key]||(MAPS[key]=prep(buildMap(kind,room),kind)); }
function enterScene(m){ const d=sceneData(m.s,m.room);
  S={kind:m.s,id:m.id,room:m.room,host:m.host,hostPid:m.hostPid,own:m.own,...d}; miniBase=null;
  P.x=m.x; P.y=m.y; P.kayak=false; P.riding=false; P.act=null; TASK=null; FISH=null; REM.clear(); SOCS.clear(); fx=[]; zoneName='';
  npcs=SD.NPCS.filter(n=>(n.scene||'retreat')===m.s).map(n=>({...n,x:n.x*T,y:n.y*T,view:'down',face:1,t:Math.random()*2,act:null,actT:0,av:STORY[n.id]?null:AVATAR.build(SD.NPC_LOOKS[n.id].look)}));
  if(m.s==='retreat'){ pet.x=SD.BEAGLE_SPOT.x*T; pet.y=SD.BEAGLE_SPOT.y*T; if(G.quests.beagle==='done'){ const ph=npcs.find(n=>n.id==='phap'); pet.x=ph.x+18; pet.y=ph.y+2; }
    if(G.flags.beagleFollow){ pet.x=P.x-14; pet.y=P.y; } chick.x=chick.tx=SD.CHICKEN_HOME.x*T; chick.y=chick.ty=SD.CHICKEN_HOME.y*T; }
  for(const k of Object.keys(PLOTS)) if((k[0]==='k')!==(m.s==='retreat')||(k[0]==='d')!==(m.s==='dalat')) delete PLOTS[k];
  music(S.map.music||'music_retreat');
  banner(m.s==='stay'?(m.own?'Phòng của bạn · ':'Phòng của '+m.host+' · ')+S.map.name:S.map.name);
  if(m.s==='room'&&!G.flags.called) ringTimer=2.2;
  if(m.ride) travelAnim(m.ride);
  UI.closeAll&&UI.closeAll(); renderHUD(); }

/* ---------- va chạm ---------- */
function solidAt(px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); if(tx<0||ty<0||tx>=S.W||ty>=S.H) return true;
  if(P.kayak){ const t=S.map.grid[ty][tx]; return !(t==='W'||t==='Q'); } return S.solid[ty*S.W+tx]===1; }
function blocked(x,y){ const hw=5, h=4; if(solidAt(x-hw,y-h)||solidAt(x+hw,y-h)||solidAt(x-hw,y)||solidAt(x+hw,y)) return true;
  for(const n of npcs) if(Math.hypot(n.x-x,(n.y-y)*1.6)<9) return true; return false; }
function move(o,dx,dy){ if(dx&&!blocked(o.x+dx,o.y)) o.x+=dx; if(dy&&!blocked(o.x,o.y+dy)) o.y+=dy; }
const tileAt=(px,py)=>{ const tx=Math.floor(px/T), ty=Math.floor(py/T); return S.map.grid[ty]&&S.map.grid[ty][tx]; };

/* ---------- bàn phím ---------- */
const keys=new Set(); let pressed=new Set();
const typing=()=>{ const a=document.activeElement; return a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'); };
addEventListener('keydown',e=>{ if(typing()) return; const k=e.key.toLowerCase(); if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k)) e.preventDefault();
  if(!keys.has(k)) pressed.add(k); keys.add(k); });
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase())); addEventListener('blur',()=>keys.clear());
const down=(...ks)=>ks.some(k=>keys.has(k)), hit=(...ks)=>ks.some(k=>pressed.has(k));

/* ---------- hội thoại ---------- */
const DLG={open:false,lines:[],i:0,shown:0,done:null,choice:null,sel:0,blipT:0};
function say(lines,done,vars={}){ vars={name:G?G.name:'',...vars}; DLG.open=true; DLG.lines=lines.map(([who,txt])=>[who,txt.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'')]); DLG.i=0; DLG.shown=0; DLG.done=done||null; DLG.choice=null; renderDialog(); $('#dialog').hidden=false; }
function ask(question,who,opts,cb){ say([[who,question]],null); DLG.choice={opts,cb}; DLG.sel=0; }
function speakerName(who){ return who==='me'?G.name:who==='beagle'?'Beagle':Wd.CHARS[who]?Wd.CHARS[who].name:SD.NPC_LOOKS[who]?SD.NPC_LOOKS[who].name:who; }
function renderDialog(){ const [who,txt]=DLG.lines[DLG.i]||['','']; $('#dlgName').textContent=speakerName(who);
  const pc=$('#dlgPortrait'), g=pc.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,84,84); const po=portrait(who); if(po) g.drawImage(po,0,0);
  $('#dlgText').textContent=txt.slice(0,Math.floor(DLG.shown));
  const typingT=DLG.shown<txt.length, last=DLG.i===DLG.lines.length-1;
  $('#dlgChoices').innerHTML=!typingT&&last&&DLG.choice?DLG.choice.opts.map((o,i)=>`<button class="choice${i===DLG.sel?' on':''}" data-i="${i}">${i===DLG.sel?'▶ ':''}${o}</button>`).join(''):'';
  $('#dlgMore').hidden=typingT||(last&&!!DLG.choice); }
$('#dlgChoices').addEventListener('click',e=>{ const b=e.target.closest('.choice'); if(!b) return; DLG.sel=+b.dataset.i; finishChoice(); });
function finishChoice(){ const c=DLG.choice, i=DLG.sel; closeDialog(); c.cb(i); }
function closeDialog(){ DLG.open=false; $('#dialog').hidden=true; const d=DLG.done; DLG.done=null; if(d) d(); }
function updateDialog(dt){ const [,txt]=DLG.lines[DLG.i]; if(DLG.shown<txt.length){ DLG.shown=Math.min(txt.length,DLG.shown+dt*46); DLG.blipT-=dt; if(DLG.blipT<=0){ sfx('blip',.16); DLG.blipT=.12; } }
  const last=DLG.i===DLG.lines.length-1;
  if(DLG.choice&&last&&DLG.shown>=txt.length){ if(hit('arrowup','w','arrowleft','a')) DLG.sel=(DLG.sel+DLG.choice.opts.length-1)%DLG.choice.opts.length;
    if(hit('arrowdown','s','arrowright','d')) DLG.sel=(DLG.sel+1)%DLG.choice.opts.length; if(hit('e',' ','enter')){ finishChoice(); return; } }
  else if(hit('e',' ','enter')){ if(DLG.shown<txt.length) DLG.shown=txt.length; else if(!last){ DLG.i++; DLG.shown=0; } else { closeDialog(); return; } }
  renderDialog(); }

/* ---------- thông báo ---------- */
function toast(html,kind=''){ const d=document.createElement('div'); d.className='toast '+kind; d.innerHTML=html; $('#toasts').appendChild(d); setTimeout(()=>d.classList.add('out'),2800); setTimeout(()=>d.remove(),3400);
  while($('#toasts').children.length>6) $('#toasts').firstChild.remove(); }
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function banner(text){ const b=$('#banner'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function bigText(text){ const b=$('#bigtext'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
// gửi lệnh lên server, báo lỗi nếu có
async function act(msg,okMsg){ const r=await NET.req(msg); if(r.err){ toast(esc(r.err),'lock'); sfx('blip',.2); } else if(okMsg) toast(okMsg,'item'); return r; }

/* ---------- cốt truyện Ké: 6 người nhờ việc ---------- */
const Q=SD.QUESTS;
function questProgress(id){ const q=Q[id];
  if(id==='beagle') return G.flags.beagleFollow?'Dẫn beagle về Cổng':'Tìm ở Nền khu cắm trại';
  if(q.need) return Object.entries(q.need).map(([k,n])=>`${SD.ITEMS[k].name} ${Math.min(G.items[k]||0,n)}/${n}`).join(' · ');
  if(q.spots) return `Đã chụp ${q.spots.filter(s=>G.flags.spots[s]).length}/${q.spots.length}`; return ''; }
function canFinish(id){ const q=Q[id]; if(id==='beagle') return G.flags.beagleFollow&&Math.hypot(pet.x-P.x,pet.y-P.y)<70;
  if(q.need) return Object.entries(q.need).every(([k,n])=>(G.items[k]||0)>=n); if(q.spots) return q.spots.every(s=>G.flags.spots[s]); return false; }
async function startQuest(id){ const r=await act({t:'quest',id,op:'start'}); if(!r.err){ sfx('quest_accept',.5); toast(`Nhận nhiệm vụ: <b>${Q[id].title}</b>`,'quest'); } }
async function finishQuest(id,after){ const r=await act({t:'quest',id,op:'finish'}); if(!r.err){ sfx('quest_complete',.6); after&&after(); } }
function talk(n){ faceToward(n); const id=n.id, D=Wd.DIALOG;
  if(!STORY[id]) return UI.place(n.place,n);
  if(id==='phap'){
    if(!G.flags.hello){ NET.send({t:'hello'}); say(D.phap_hello,()=>ask('Tìm beagle giúp Pháp chứ?','phap',['Ok, để tao lo','Để sau'],i=>{ if(i===0){ startQuest('beagle'); sfx('dog_bark',.5); } })); return; }
    if(!G.quests.beagle){ ask('Tìm beagle giúp tao chứ?','phap',['Ok, để tao lo','Để sau'],i=>{ if(i===0) startQuest('beagle'); }); return; }
    if(G.quests.beagle==='active'){ if(canFinish('beagle')) say(D.phap_done,()=>finishQuest('beagle',()=>{ n.act='saiyan'; n.actT=0; sfx('power_up',.55); })); else say(D.phap_wait); return; }
    if(Object.keys(Q).every(q=>G.quests[q]==='done')){ say(D.finale); return; }
    say(D.phap_after); return; }
  const qid=Object.keys(Q).find(k=>Q[k].giver===id), st=G.quests[qid];
  if(!st){ say(D[id+'_offer'],()=>ask(`Nhận "${Q[qid].title}"?`,id,['Nhận nhiệm vụ','Để sau'],i=>{ if(i===0) startQuest(qid); })); return; }
  if(st==='active'){
    if(canFinish(qid)){ say(D[id+'_done'],()=>finishQuest(qid,()=>{ if(id==='khabanh'){ n.act='quay'; n.actT=0; } if(id==='huyphan'){ n.act='hokage'; n.actT=0; sfx('poof',.55); } })); return; }
    const q=Q[qid]; say(D[id+'_wait'],null,{wood:G.items.wood||0,paper:G.items.paper||0,spots:(q.spots||[]).filter(s=>G.flags.spots[s]).length,missing:Object.keys(q.need||{}).filter(k=>!(G.items[k]>0)).map(k=>SD.ITEMS[k].name).join(', ')}); return; }
  say(D[id+'_after']); }

/* ---------- tương tác (E) ---------- */
function nearest(){
  let best=null, bd=1e9; const consider=(d,o)=>{ if(d<bd){ bd=d; best=o; } };
  const dist=(x,y)=>Math.hypot(x-P.x,(y-P.y)*1.3), k=S.kind, f=G.flags, t=NET.now();
  if(P.kayak){ for(const [i,[bx,by]] of SD.BUOYS.entries()) if(!G.daily.buoys[i]){ const d=dist(bx*T,by*T); if(d<22) consider(d,{type:'buoy',i,label:'Chạm phao'}); }
    const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){ const g=S.map.grid[ty+dy]; if(g&&g[tx+dx]==='D') return {type:'unkayak',label:'Lên bờ'}; } return best; }
  for(const n of npcs){ const d=dist(n.x,n.y); if(d<28) consider(d*.5,{type:'npc',n,label:STORY[n.id]?'Nói chuyện':speakerName(n.id).split(' (')[0]}); }
  for(const r of REM.values()){ const d=dist(r.x,r.y); if(d<24&&r.name) consider(d*.6,{type:'player',r,label:'Tương tác với '+r.name}); }
  for(const it of S.map.inter){ const d=dist(it.x,it.y); if(d<it.r) consider(d,{type:'obj',it,label:it.label}); }
  if(k==='retreat'){
    for(const [key,pc] of Object.entries(SD.PLACES)) if(pc.door){ const d=dist(pc.door.x*T,pc.door.y*T); if(d<26) consider(d,{type:'enter',place:key,label:'Vào '+pc.name}); }
    for(const [rk,r] of Object.entries(SD.ROOMS)) if(r.doors) for(const [x,y] of r.doors){ const d=dist(x*T,y*T); if(d<24) consider(d,{type:'roomDoor',room:rk,label:G.stay&&G.stay.room===rk?'Vào phòng của bạn':'Gõ cửa '+r.name}); }
    { const d=dist(SD.BATHHOUSE.x*T,SD.BATHHOUSE.y*T); if(d<26) consider(d,{type:'bath',label:'Tắm ở nhà tắm chung'}); }
    { const d=dist(SD.KAYAK_SPOT.x*T,SD.KAYAK_SPOT.y*T); if(d<30) consider(d,{type:'kayak',label:'Chèo kayak (150.000đ/giờ)'}); }
    SD.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]!=='active'||f.picked[i]) return; const d=dist(p.x*T,p.y*T); if(d<18) consider(d,{type:'pick',k:'pickup',i,label:'Nhặt '+SD.ITEMS[p.item].name}); });
    if(G.quests.anh==='active') for(const s of SD.SPOTS){ if(f.spots[s.id]) continue; const d=dist(s.x*T,s.y*T); if(d<18) consider(d,{type:'pick',k:'spot',i:s.id,label:'Chụp ảnh check-in'}); }
    if(G.quests.beagle==='active'&&!f.beagleFollow){ const d=dist(pet.x,pet.y); if(d<26) consider(d,{type:'pick',k:'beagle',label:'Gọi beagle'}); }
    if(G.quests.co==='active'&&!f.chicken){ const d=dist(chick.x,chick.y); if(d<18) consider(d,{type:'pick',k:'chicken',label:'Bắt gà đồi'}); }
    for(const fo of SD.FORAGE){ if(G.forage[fo.id]&&t-G.forage[fo.id]<fo.respawn*1000) continue; const d=dist(fo.x*T,fo.y*T); if(d<16) consider(d,{type:'pick',k:'forage',i:fo.id,label:'Hái '+SD.ITEMS[fo.item].name.toLowerCase()}); }
    SD.FARM.plots.forEach((p,i)=>{ const d=dist(p.x*T,p.y*T); if(d<11) consider(d+2,{type:'plot',id:'k'+i,label:plotLabel('k'+i)}); });
    if(P.y>=SD.LAKE_Y*T&&(tileAt(P.x,P.y+12)==='W'||tileAt(P.x+12*P.face,P.y)==='W')) consider(30,{type:'fish',label:FISH?'Giật cần':'Câu cá'});
  }
  if(k==='dalat'){ SD.DALAT.plots.forEach((p,i)=>{ const d=dist(p.x*T,p.y*T); if(d<11) consider(d+2,{type:'plot',id:'d'+i,label:plotLabel('d'+i)}); });
    const L=SD.DALAT.lake, nx=(P.x/T-L.x)/(L.rx+1.4), ny=(P.y/T-L.y)/(L.ry+1.4); if(nx*nx+ny*ny<=1) consider(30,{type:'fish',label:FISH?'Giật cần':'Câu cá'}); }
  return best; }
function plotLabel(id){ const p=PLOTS[id]; if(!p) return 'Trồng ở ô đất này'; const c=SD.CROPS[p.c], st=plotState(id,p);
  if(st==='growing') return `${c.name} · ${p.o===NET.pub?'của bạn':p.n} · còn ${Math.ceil((p.at+c.grow*1000-NET.now())/1000)}s`;
  if(p.o===NET.pub) return (c.verb||'Thu hoạch')+' '+c.name.toLowerCase(); return st==='open'&&!p.s?`Cướp ${c.name.toLowerCase()} của ${p.n}`:`${c.name} của ${p.n}`; }
function plotState(id,p){ const s=SD.plotState(p,NET.now()); return id[0]==='d'&&s==='open'?'ripe':s; }
async function interact(x){
  if(x.type==='npc') return talk(x.n);
  if(x.type==='player') return UI.social(x.r);
  if(x.type==='pick'){ const r=await act({t:'pick',k:x.k,i:x.i}); if(r.err) return;
    if(x.k==='beagle'){ say(Wd.DIALOG.beagle_found,()=>{ sfx('dog_bark',.6); toast('Beagle đang chạy theo bạn. Dẫn về Cổng cho Pháp.','quest'); }); return; }
    if(x.k==='spot'){ flash=1; sfx('item_pickup',.6); toast('Đã chụp check-in','item'); return; }
    sfx('item_pickup',.5); if(r.item) toast(`Nhặt được <b>${SD.ITEMS[r.item].name}</b>`+(r.exp?` · +${r.exp} EXP`:''),'item'); return; }
  if(x.type==='enter') return act({t:'enter',place:x.place});
  if(x.type==='roomDoor') return UI.roomDoor(x.room);
  if(x.type==='bath') return startRoomAct('tam','chung');
  if(x.type==='kayak'){ const r=await act({t:'kayak',op:'board'}); if(!r.err){ P.kayak=true; const w=findWater(); if(w){ P.x=w.x; P.y=w.y; } toast('Lên kayak! Chạm đủ 5 phao vàng trên hồ.','quest'); } return; }
  if(x.type==='unkayak'){ await act({t:'kayak',op:'leave'}); P.kayak=false; const s=findSand(); if(s){ P.x=s.x; P.y=s.y; } return; }
  if(x.type==='buoy'){ const r=await act({t:'kayak',op:'buoy',i:x.i}); if(!r.err){ sfx('coin',.5); toast(`Chạm phao ${r.n}/5`,'item'); } return; }
  if(x.type==='plot') return UI.plot(x.id);
  if(x.type==='fish') return fishing();
  const it=x.it; if(!it) return;
  if(it.say){ say(it.say.map(t=>['me',t])); return; }
  if(it.id==='phone'){ if(G.flags.called){ say([['me','Pháp gọi rồi. Bấm G mở Grab đi Ké Retreat thôi.']]); return; } if(ringing){ ringing.pause(); ringing=null; }
    say(Wd.DIALOG.call,()=>{ NET.send({t:'call'}); toast('Nhiệm vụ: <b>Mở Grab (G), đi tới Ké Retreat</b>','quest'); }); return; }
  if(it.id==='bonfire'){ say([['me',G.flags.fire?'Lửa cháy tí tách, ấm cả sân Nhà Rếch.':'Đống củi chưa đốt. Đôn Chề đang thiếu củi.']]); return; }
  if(it.id==='car_low'||it.id==='car_top'){ const up=it.id==='car_low', c=SD.CARS[it.id];
    ask(up?'Đi xe 4 bánh lên khu trên? (lên dốc miễn phí)':`Đi xe 4 bánh xuống Cổng? (${fmt(c.price)})`,'me',['Đi','Thôi đi bộ'],async i=>{ if(i!==0) return; const r=await act({t:'car',id:it.id}); if(!r.err){ sfx('car_4wd',.6); fadeOnly(up?'Xe 4 bánh bò lên dốc...':'Xe 4 bánh đổ đèo xuống...'); } }); return; }
  const d=it.do;
  if(d==='exit') return act({t:'exit'});
  if(d==='grab') return UI.grab();
  if(d==='ra') return startRoomAct(it.act);
  if(d==='hub') return UI.hub();
  if(d==='wardrobe') return UI.wardrobe();
  if(d==='phone') return UI.phone();
  if(d==='table') return UI.table(it.id);
  if(d==='desk'||d==='spot') return UI.work(d==='desk'?'desk':it.where,it);
  if(d==='pen') return UI.pen(it.k);
  if(d==='warehouse'){ const r=await act({t:'crate',op:'load'}); if(!r.err) toast(`Chất ${r.n} thùng hàng${P.riding?' lên ngựa':''}. Chở ra điểm nhận hàng ở chợ.`,'item'); return; }
  if(d==='market'){ await act({t:'crate',op:'deliver'}); return; }
  if(d==='stove') return UI.cook();
  if(d==='track') return act({t:'enterTrack'});
  if(d==='race') return UI.race();
}
function findWater(){ const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(let r=1;r<5;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const g=S.map.grid[ty+dy]; if(g&&g[tx+dx]==='W') return {x:(tx+dx+.5)*T,y:(ty+dy+.7)*T}; } return null; }
function findSand(){ const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(let r=1;r<4;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const y=ty+dy, x=tx+dx; if(y>=0&&x>=0&&y<S.H&&x<S.W&&!S.solid[y*S.W+x]) return {x:(x+.5)*T,y:(y+.7)*T}; } return null; }
// tắm, nghỉ, sạc... (có thời gian, server tính kết quả)
async function startRoomAct(a,where){ const r=await act({t:'ra',act:a,where}); return r; }
async function fishing(){ if(!FISH){ const r=await act({t:'fish',op:'cast'}); if(!r.err){ FISH={st:'wait',x:P.x+P.face*22,y:P.y+(tileAt(P.x,P.y+12)==='W'?16:0)}; sfx('dash',.3); toast('Thả câu... đợi phao chìm rồi bấm E','item'); } return; }
  const r=await NET.req({t:'fish',op:'hook'}); FISH=null;
  if(r.miss||r.err){ toast(esc(r.msg||r.err),'lock'); return; } sfx('item_pickup',.6); toast(`Câu được <b>${SD.ITEMS[r.item].name}</b> · +${r.exp} EXP`,'vnd'); }

/* ---------- chuyển cảnh ---------- */
let ringing=null, ringTimer=0, travelling=false;
function fadeOnly(text){ const f=$('#fade'); $('#fadeText').textContent=text||''; f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),900); }
function travelAnim(ride){ travelling=true; const tc=$('#travel'); tc.hidden=false; sfx('car_4wd',.5);
  $('#travelText').textContent=`Grab: ${SD.DEST[ride.from]?SD.DEST[ride.from].name:''} → ${SD.DEST[ride.to].name}`+(ride.free?' · Pháp bao':ride.fare?' · '+fmt(ride.fare):'');
  const c=$('#travelCv'), g=c.getContext('2d'), car=A.car().c, t0=performance.now(), city=ride.to==='home'||ride.to==='everfit';
  const anim=()=>{ const t=(performance.now()-t0)/1000; g.imageSmoothingEnabled=false; g.fillStyle=city?'#cfe3ee':'#f6d7a7'; g.fillRect(0,0,240,100);
    if(city){ g.fillStyle='#8fa4b8'; for(let x=0;x<240;x+=14){ const h=30+((x*7)%5)*8; g.fillRect(x,80-h,12,h); g.fillStyle='#e8f4f8'; for(let y=84-h;y<76;y+=6) g.fillRect(x+3,y,2,2); g.fillStyle='#8fa4b8'; } }
    else { g.fillStyle='#9bb7a0'; for(let x=0;x<240;x++){ const h=40+18*Math.sin(x*.035)+8*Math.sin(x*.11); g.fillRect(x,100-h-20,1,h); }
      g.fillStyle=ride.to==='dalat'?'#3a6e46':'#5f8d62'; for(let x=0;x<240;x++){ const h=26+10*Math.sin(x*.06+2)+5*Math.sin(x*.17); g.fillRect(x,100-h-14,1,h); } }
    g.fillStyle='#3b8ed3'; if(!city) g.fillRect(0,86,240,14); g.fillStyle='#c2bcb0'; g.fillRect(0,80,240,city?20:6);
    g.drawImage(car,(t*80)%300-50,58+(Math.floor(t*8)%2)); g.fillStyle='#00b14f'; g.fillRect(((t*80)%300-50)+18,60,18,4);
    if(t<2.4) requestAnimationFrame(anim); else { tc.hidden=true; travelling=false; } };
  anim(); }

/* ---------- cập nhật mỗi khung ---------- */
let sendT=0, lastSent='';
function speed(){ if(P.kayak) return 95; if(P.riding) return SD.RULES.run*SD.HORSE.speed; const h=SD.hunger(G.meals,NET.now()); let s=SD.RULES.hungrySpeed[h]*(G.needs.energy<20?.8:1);
  return ((down('shift')&&G.skills.run)?SD.RULES.run:SD.RULES.walk)*s; }
function update(dt){
  if(ringTimer>0){ ringTimer-=dt; if(ringTimer<=0&&!G.flags.called&&S.kind==='room'){ ringing=sfx('phone_ring',.5); toast('Điện thoại đang reo... (lại bàn, bấm <kbd>E</kbd>)','quest'); } }
  if(ringing&&ringing.ended&&!G.flags.called){ ringing=null; ringTimer=5; }
  for(const f of fx) f.t+=dt; fx=fx.filter(f=>f.t<f.life); if(flash>0) flash=Math.max(0,flash-dt*3); if(soiT>0) soiT-=dt;
  for(const r of REM.values()){ r.t+=dt; r.actT=(r.actT||0)+dt; }
  if(DLG.open){ $('#prompt').hidden=true; updateDialog(dt); return; }
  if(UI.blocking&&UI.blocking()){ $('#prompt').hidden=true; if(hit('escape')) UI.closeAll(); UI.keys&&UI.keys(pressed,keys); return; }
  if(hit('m')){ toggleMap(); return; } if(!$('#mapView').hidden){ if(hit('escape','m')) toggleMap(); return; }
  if(hit('escape')){ UI.menu(); return; }
  if(hit('enter')){ UI.chat(); return; }
  if(hit('g')){ UI.grab(); return; } if(hit('i')){ UI.bag(); return; }
  if(hit('n')) setMute(!AUD.muted);
  if(hit('p')) act({t:'photo'}).then(r=>{ if(!r.err){ flash=1; sfx('item_pickup',.5); toast(`Đã chụp ảnh sống ảo: <b>${esc(r.name)}</b> · up ảnh ở phòng`,'item'); } });
  if(hit('h')&&S.kind==='dalat') act({t:'horse',op:P.riding?'dismount':'mount'}).then(r=>{ if(!r.err){ P.riding=!P.riding; toast(P.riding?'Lên ngựa! Chạy nhanh hơn, chở được 3 thùng hàng':'Xuống ngựa','item'); } });
  if(hit('x')&&SOC_ME()) NET.send({t:'soc',op:'end'});
  const sock=SOC_ME();
  if(sock&&sock.kind==='vattay'&&hit(' ')) NET.send({t:'soc',op:'mash'});
  if(sock&&sock.kind==='danhnhau'&&hit('j')){ P.act='attack'; P.actT=0; NET.send({t:'soc',op:'hit'}); sfx('dash',.3); }
  // skill
  if(P.act){ P.actT+=dt; const dur={noi:2,quay:2.4,gong:1.6,hokage:4.4,attack:.35,hurt:.4,kiss:2.6}[P.act]||1; if(P.actT>=dur){ if(P.act==='hokage') sfx('poof',.45); P.act=null; } }
  const sk=G.skills, useSkill=(k,fn)=>{ if(sk[k]) fn(); else toast(`Chưa mở khoá: <b>${SD.SKILLS[k].name}</b>`,'lock'); };
  const fighting=sock&&(sock.kind==='vattay');
  if(!P.act&&!fighting&&!P.kayak&&!P.riding){
    if(hit('t')) useSkill('noi',()=>{ P.act='noi'; P.actT=0; P.view='side'; NET.send({t:'act',a:'noi'}); });
    if(hit('q')) useSkill('quay',()=>{ P.act='quay'; P.actT=0; NET.send({t:'act',a:'quay'}); });
    if(hit('r')) useSkill('gong',()=>{ P.act='gong'; P.actT=0; sfx('power_up',.5); NET.send({t:'act',a:'gong'}); });
    if(hit('k')) useSkill('hokage',()=>{ P.act='hokage'; P.actT=0; sfx('poof',.55); NET.send({t:'act',a:'hokage'}); });
  }
  if(hit('v')) useSkill('soi',()=>{ soiT=6; toast('Đeo kính râm... soi xu 6 giây','skill'); });
  if(hit(' ')&&!P.act&&!fighting) useSkill('dash',()=>{ if(P.dashCD<=0&&!P.kayak){ P.dashT=.18; P.dashCD=.7; sfx('dash',.45); for(let k=0;k<6;k++) fx.push({kind:'dust',x:P.x,y:P.y,vx:(Math.random()-.5)*30,vy:-Math.random()*12,t:0,life:.4}); } });
  P.dashCD-=dt;
  // di chuyển
  let dx=(down('arrowright','d')?1:0)-(down('arrowleft','a')?1:0), dy=(down('arrowdown','s')?1:0)-(down('arrowup','w')?1:0);
  const busy=P.act==='quay'||P.act==='gong'||(P.act==='hokage'&&P.actT<1)||fighting||(TASK&&!TASK.walk);
  if(busy){ dx=0; dy=0; }
  // nắm tay: người được dắt tự đi theo
  if(P.link){ const L=REM.get(P.link); if(L){ const tx=L.x-L.face*12, ty=L.y+1, ddx=tx-P.x, ddy=ty-P.y, d=Math.hypot(ddx,ddy); if(d>3&&!dx&&!dy){ const st=Math.min(d,135*dt); move(P,ddx/d*st,ddy/d*st); P.face=L.face; P.moving=true; } } }
  let sp=P.dashT>0?SD.RULES.dash:speed(); P.dashT-=dt;
  if(P.dashT>0&&!dx&&!dy){ if(P.view==='down') dy=1; else if(P.view==='up') dy=-1; else dx=P.face; }
  const len=Math.hypot(dx,dy)||1; P.moving=!!(dx||dy)||(P.link&&P.moving);
  if(dx) P.face=Math.sign(dx);
  if(dx||dy) P.view=Math.abs(dy)>Math.abs(dx)?(dy>0?'down':'up'):'side';
  if(dx||dy){ move(P,dx/len*sp*dt,dy/len*sp*dt); if(FISH){ FISH=null; NET.send({t:'fish',op:'stop'}); } }
  const running=down('shift')&&sk.run&&!P.kayak;
  const base=P.act&&P.act!=='noi'?P.act:P.moving?(running||P.riding?'run':'walk'):'idle';
  const name=!P.act&&P.view!=='side'&&P.av&&P.av.anims[base+'_'+P.view]?base+'_'+P.view:base;
  if(P.anim!==name){ P.anim=name; P.t=0; } P.t+=dt;
  if(P.moving&&!P.kayak){ P.stepT-=dt; if(P.stepT<=0){ sfx(Math.random()<.5?'step1':'step2',.14); P.stepT=running?.24:.34; } }
  // gửi vị trí 10 lần/giây
  sendT-=dt; if(sendT<=0){ sendT=.1; const v=VIEWS.indexOf(P.view), a=Math.max(0,ANIMS.indexOf(P.anim.split('_')[0])), key=[Math.round(P.x),Math.round(P.y),P.face,v,a].join();
    if(key!==lastSent){ lastSent=key; NET.send({t:'mv',x:P.x,y:P.y,f:P.face,v,a}); } }
  // tương tác
  const near=nearest(); $('#prompt').hidden=!near||!!TASK; if(near) $('#promptLabel').textContent=near.label;
  if(near&&hit('e')&&!TASK) interact(near);
  if(S.kind==='retreat'){
    const tx=P.x/T, ty=P.y/T, z=S.map.zones&&S.map.zones.find(z=>tx>=z.x0&&tx<=z.x1+1&&ty>=z.y0&&ty<=z.y1+1);
    if(z&&z.name!==zoneName){ zoneName=z.name; banner(z.name); }
    if(soiT>0) SD.COINS.forEach(([x,y],i)=>{ if(G.flags.coins[i]) return; if(Math.hypot(x*T-P.x,y*T-P.y)<12){ G.flags.coins[i]=true; NET.req({t:'pick',k:'coin',i}).then(r=>{ if(!r.err){ sfx('coin',.5); toast('<b>+20.000đ</b> nhặt được xu','vnd'); } }); } });
    if(P.kayak) SD.BUOYS.forEach(([bx,by],i)=>{ if(!G.daily.buoys[i]&&Math.hypot(bx*T-P.x,by*T-P.y)<16){ G.daily.buoys[i]=true; NET.req({t:'kayak',op:'buoy',i}).then(r=>{ if(!r.err){ sfx('coin',.5); toast(`Chạm phao ${r.n}/5`,'item'); } }); } });
    updatePet(dt); updateChicken(dt);
  }
  if(S.kind==='dalat'){ const tx=P.x/T, ty=P.y/T, z=S.map.zones.find(z=>tx>=z.x0&&tx<=z.x1+1&&ty>=z.y0&&ty<=z.y1+1); if(z&&z.name!==zoneName){ zoneName=z.name; banner(z.name); }
    if(HERD&&HERD.phase==='go'&&inPasture()&&!TASK) act({t:'herd',op:'graze'}); }
  updateNpcs(dt);
}
const inPasture=()=>{ const z=SD.DALAT.pasture, x=P.x/T, y=P.y/T; return x>=z.x0&&x<=z.x1+1&&y>=z.y0&&y<=z.y1+1; };
const SOC_ME=()=>{ for(const s of SOCS.values()) if(s.a===NET.pid||s.b===NET.pid) return s; return null; };
function updatePet(dt){ let tx=null, ty=null; const ph=npcs.find(n=>n.id==='phap');
  if(G.flags.beagleFollow){ tx=P.x-P.face*18; ty=P.y+2; } else if(G.quests.beagle==='done'&&ph){ tx=ph.x+18; ty=ph.y+2; }
  let a='sit';
  if(tx!==null){ const dx=tx-pet.x, dy=ty-pet.y, d=Math.hypot(dx,dy);
    if(d>4){ const v=d>40?130:75, st=Math.min(d,v*dt); pet.x+=dx/d*st; pet.y+=dy/d*st; if(Math.abs(dx)>.5) pet.face=Math.sign(dx); a=d>40?'run':'walk'; pet.still=0; }
    else { pet.still+=dt; a=pet.still>2.5?'sit':'idle'; } }
  else a=G.quests.beagle==='active'?'idle':'sit';
  if(pet.anim!==a){ pet.anim=a; pet.t=0; } pet.t+=dt; }
function updateChicken(dt){ if(G.flags.chicken) return; chick.t+=dt; const H=SD.CHICKEN_HOME;
  const dx=chick.tx-chick.x, dy=chick.ty-chick.y, d=Math.hypot(dx,dy);
  if(d<1){ chick.wait-=dt; if(chick.wait<=0){ chick.tx=(H.x+(Math.random()*2-1)*H.r)*T; chick.ty=(H.y+(Math.random()*2-1)*H.r*.6)*T; chick.wait=.6+Math.random()*1.5; } }
  else { const st=Math.min(d,22*dt); chick.x+=dx/d*st; chick.y+=dy/d*st; chick.face=Math.sign(dx)||chick.face; }
  if(Math.hypot(P.x-chick.x,P.y-chick.y)<22&&G.quests.co==='active'){ chick.tx=chick.x+(chick.x-P.x)*.8; chick.ty=chick.y+(chick.y-P.y)*.5; } }
function updateNpcs(dt){ for(const n of npcs){ n.t+=dt; if(n.act){ n.actT+=dt; const sh=npcSheet(n), an=sh&&sh.anims[n.act]; const dur=an?an.frames.length/an.fps+(n.act==='hokage'?1.4:n.act==='quay'?1.6:.3):1;
    if(n.actT>=dur){ if(n.act==='saiyan') delete PORTRAIT.phap; n.act=null; } }
  if(!DLG.open) faceToward(n,Math.hypot(n.x-P.x,n.y-P.y)<52); } }
function faceToward(n,near=true){ if(!near){ n.view='down'; return; } const dx=P.x-n.x, dy=P.y-n.y;
  if(Math.abs(dy)>Math.abs(dx)*1.1) n.view=dy>0?'down':'up'; else { n.view='side'; n.face=dx<0?-1:1; } }
function npcSheet(n){ return n.id==='phap'&&G.flags.phapForm==='cam'?SHEETS.phap2:SHEETS[n.id]; }

/* ---------- người chơi khác ---------- */
function remote(id){ let r=REM.get(id); if(!r){ r={id,name:'',look:null,lv:1,tag:'',av:null,buf:[],x:0,y:0,face:1,view:'down',anim:'idle',act:'',fl:0,t:Math.random(),chat:null}; REM.set(id,r); } return r; }
function interp(r){ const rt=performance.now()-110, b=r.buf; if(!b.length) return;
  let i=b.length-1; while(i>0&&b[i-1].tm>rt) i--; const n=b[i], p=b[i-1];
  if(p&&n.tm>rt){ const k=(rt-p.tm)/Math.max(1,n.tm-p.tm); r.x=p.x+(n.x-p.x)*Math.max(0,Math.min(1,k)); r.y=p.y+(n.y-p.y)*Math.max(0,Math.min(1,k)); } else { r.x=n.x; r.y=n.y; }
  r.face=n.f; r.view=VIEWS[n.v]; const a=ANIMS[n.a]||'idle', ac=ACTS[n.act]||'';
  if(ac!==r.act){ r.act=ac; r.actT=0; } r.fl=n.fl; const nm=(a)+(r.view!=='side'&&!ac?'_'+r.view:''); if(nm!==r.anim){ r.anim=nm; r.t=0; } }

/* ---------- vẽ ---------- */
let cam={x:0,y:0}, waterFrame=0;
const PICK={}; function pick(k){ return PICK[k]||(PICK[k]=A.icon(SD.ITEMS[k]?SD.ITEMS[k].icon:k)); }
const CROPSPR={}; function cropSprite(c,stage){ const key=c+stage; if(CROPSPR[key]) return CROPSPR[key]; const d=SD.CROPS[c];
  return CROPSPR[key]=(d.kind==='cay'||d.kind==='caosu'||d.kind==='cafe')?A.bush2(d.col,stage,d.kind==='cay'?'tree':d.kind):A.crop(d.kind==='hoa'?'hoa':c,stage,d.col); }
const ANIMSPR={}; const animalSpr=(k,fr)=>ANIMSPR[k+fr]||(ANIMSPR[k+fr]=k==='bo'?A.cow(fr):k==='lon'?A.pig(fr):k==='ga'?A.chicken(fr):A.horse(fr,['#8a5a36','#3a2c24','#c9a87a','#f4f1ea'][fr>>2],true));
const HORSES=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,['#8a5a36','#3a2c24','#c9a87a','#5a3a22'][c],false))), GALLOP=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,['#8a5a36','#3a2c24','#c9a87a','#5a3a22'][c],true)));
function shadow(x,y,r=8){ ctx.fillStyle='rgba(20,30,20,.28)'; ctx.beginPath(); ctx.ellipse(Math.round(x-cam.x),Math.round(y-cam.y),r,2.5,0,0,7); ctx.fill(); }
function drawFlip(c,x,y,ax,ay,flip,clipH){ const X=Math.round(x-ax-cam.x), Y=Math.round(y-ay-cam.y), h=clipH||c.height;
  if(!flip){ ctx.drawImage(c,0,0,c.width,h,X,Y,c.width,h); return; } ctx.save(); ctx.translate(X+c.width,Y); ctx.scale(-1,1); ctx.drawImage(c,0,0,c.width,h,0,0,c.width,h); ctx.restore(); }
function marker(x,y,ch,col){ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y+Math.sin(clock*4)*1.5);
  ctx.fillStyle='#1c1516'; ctx.fillRect(X-4,Y-8,9,10); ctx.fillStyle=col||(ch==='?'?'#7de07a':'#ffd84a'); ctx.fillRect(X-3,Y-7,7,8);
  ctx.fillStyle='#1c1516'; if(ch==='!'){ ctx.fillRect(X,Y-6,1,4); ctx.fillRect(X,Y-1,1,1); } else { ctx.fillRect(X-1,Y-6,3,1); ctx.fillRect(X+1,Y-5,1,2); ctx.fillRect(X,Y-3,1,1); ctx.fillRect(X,Y-1,1,1); } }
function sparkle(x,y){ const k=Math.floor(clock*6)%4; ctx.fillStyle='#fff7d6'; ctx.fillRect(Math.round(x-cam.x+(k-2)*2),Math.round(y-cam.y-k),1,1); }
// vẽ 1 nhân vật: av = sprite dựng từ template, sheet = sheet NPC
function drawChar(c,av,x,y,face,view,anim,act,t,actT,fl){ const anims=av.anims;
  const riding=fl&SD.FL.ride, kayak=fl&SD.FL.kayak;
  shadow(x,y,riding?14:8);
  let an, k, fr;
  if(act&&anims[act==='gong'?'gong':act]){ an=anims[act==='gong'?'gong':act]; k=Math.floor(actT*an.fps); fr=an.loop?an.frames[k%an.frames.length]:an.frames[Math.min(an.frames.length-1,k)]; }
  else { an=anims[anim]||anims[anim&&anim.split('_')[0]]||anims.idle; fr=an.frames[Math.floor(t*an.fps)%an.frames.length]; }
  const flip=face<0&&(!!act||view==='side'||!anims[anim]);
  if(riding){ const moving=anim.startsWith('run')||anim.startsWith('walk'), h=(moving?GALLOP:HORSES)[0][Math.floor(t*(moving?12:3))%4]; drawFlip(h.c,x,y,20,28,face<0); drawFlip(fr,x+face*2,y-12,16,48,flip,34); return; }
  if(kayak){ const ky=A.kayak(); drawFlip(fr,x,y+4,16,48,flip,34); const kc=PICK.__kayak||(PICK.__kayak=ky.c); drawFlip(kc,x,y+6,18,10,face<0); return; }
  drawFlip(fr,x,y,16,48,flip);
  if(fl&SD.FL.fish){ const bx=x+face*22, by=y+10; ctx.strokeStyle='#3a2c24'; ctx.beginPath(); ctx.moveTo(Math.round(x+face*8-cam.x)+.5,Math.round(y-26-cam.y)+.5); ctx.lineTo(Math.round(bx-cam.x)+.5,Math.round(by-cam.y)+.5); ctx.stroke(); ctx.fillStyle='#e23b2e'; ctx.fillRect(Math.round(bx-cam.x)-1,Math.round(by-cam.y)-1,3,3); }
  if(fl&SD.FL.dirty&&Math.random()<.05) fx.push({kind:'fly',x:x+(Math.random()-.5)*14,y:y-30,t:0,life:.8});
  if(act==='kiss'&&Math.random()<.08) fx.push({kind:'heart',x:x+(Math.random()-.5)*10,y:y-40,t:0,life:1.2});
  if(act==='sleep'&&Math.random()<.03) fx.push({kind:'z',x:x+6,y:y-40,t:0,life:1.4});
  if((act==='work'||act==='phone')&&Math.random()<.04) fx.push({kind:'spark',x:x+face*6,y:y-28,t:0,life:.5});
  if(act==='shower'&&Math.random()<.2) fx.push({kind:'steam',x:x+(Math.random()-.5)*16,y:y-36,t:0,life:.8}); }
function draw(){
  const mw=S.W*T, mh=S.H*T;
  cam.x=mw<=VW?(mw-VW)/2:Math.max(0,Math.min(mw-VW,P.x-VW/2)); cam.y=mh<=VH?(mh-VH)/2:Math.max(0,Math.min(mh-VH,P.y-20-VH/2));
  const cx=Math.round(cam.x), cy=Math.round(cam.y), k=S.kind, now=NET.now();
  ctx.fillStyle=S.map.indoor?'#1c1516':'#3f7a31'; ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(S.ground[waterFrame],-cx,-cy);
  const list=[], inView=(x,y,m=80)=>x>cx-m&&x<cx+VW+m&&y>cy-40&&y<cy+VH+m+40;
  for(const o of S.objs){ if(!inView(o.x,o.y)) continue; list.push({y:o.sort??o.y,d:()=>{ let spr=o.spr;
    if(o.id==='bonfire') spr=A.bonfire(G.flags.fire,Math.floor(clock*6));
    if(o.id==='phone'&&!G.flags.called&&ringTimer<=0) spr=A.phone(true,Math.floor(clock*8));
    if(o.id==='windmill') spr=windmillFrame();
    ctx.drawImage(spr.c,Math.round(o.x-spr.ax-cx),Math.round(o.y-spr.ay-cy)); }}); }
  // ô trồng
  if(k==='retreat'||k==='dalat'){ const defs=k==='retreat'?SD.FARM.plots:SD.DALAT.plots, pre=k==='retreat'?'k':'d';
    defs.forEach((d,i)=>{ const p=PLOTS[pre+i]; if(!p||!inView(d.x*T,d.y*T)) return; const c=SD.CROPS[p.c]; if(!c) return; const el=(now-p.at)/1000, st=plotState(pre+i,p), stage=el<0?1:el<c.grow*.35?0:st==='growing'?1:2;
      const x=d.x*T, y=d.y*T+6; list.push({y,d:()=>{ const s=cropSprite(p.c,stage); ctx.drawImage(s.c,Math.round(x-s.ax-cx),Math.round(y-s.ay-cy));
        if(stage===2&&p.o===NET.pub) marker(x,y-s.ay-2,'?'); else if(st==='open'&&!p.s&&p.o!==NET.pub) marker(x,y-s.ay-2,'!','#ff6a55'); }}); }); }
  if(k==='retreat'){
    SD.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]!=='active'||G.flags.picked[i]) return; const x=p.x*T, y=p.y*T; list.push({y,d:()=>{ ctx.drawImage(pick(p.item),Math.round(x-7-cx),Math.round(y-13-cy+Math.sin(clock*3+i)*1.5)); sparkle(x,y-14); }}); });
    if(G.quests.anh==='active') for(const s of SD.SPOTS){ if(G.flags.spots[s.id]) continue; const x=s.x*T, y=s.y*T; list.push({y:y-8,d:()=>{ ctx.strokeStyle='#ffd84a'; ctx.globalAlpha=.6+.4*Math.sin(clock*4); ctx.beginPath(); ctx.ellipse(x-cx,y-cy,9,4,0,0,7); ctx.stroke(); ctx.globalAlpha=1; ctx.drawImage(pick('photo'),Math.round(x-7-cx),Math.round(y-22-cy)); }}); }
    for(const fo of SD.FORAGE){ if(G.forage[fo.id]&&now-G.forage[fo.id]<fo.respawn*1000) continue; const x=fo.x*T, y=fo.y*T; if(!inView(x,y)) continue; list.push({y,d:()=>{ ctx.drawImage(pick(fo.item),Math.round(x-7-cx),Math.round(y-12-cy)); }}); }
    if(soiT>0) SD.COINS.forEach(([x,y],i)=>{ if(G.flags.coins[i]) return; list.push({y:y*T,d:()=>ctx.drawImage(pick('coin'),Math.round(x*T-7-cx),Math.round(y*T-13-cy-Math.abs(Math.sin(clock*5+i))*3))}); });
    if(P.kayak) SD.BUOYS.forEach(([bx,by],i)=>{ if(G.daily.buoys[i]) return; list.push({y:by*T,d:()=>{ ctx.fillStyle='#1c1516'; ctx.fillRect(Math.round(bx*T-cx)-3,Math.round(by*T-cy)-7,7,8); ctx.fillStyle='#ffd84a'; ctx.fillRect(Math.round(bx*T-cx)-2,Math.round(by*T-cy)-6+Math.round(Math.sin(clock*3+i)),5,6); }}); });
    if(!G.flags.chicken) list.push({y:chick.y,d:()=>drawFlip(A.chicken(Math.floor(chick.t*6)).c,chick.x,chick.y,6,10,chick.face<0)});
    if(PETS) list.push({y:pet.y,d:()=>{ shadow(pet.x,pet.y,7); const an=PETS.anims[pet.anim], f=an.frames[Math.floor(pet.t*an.fps)%an.frames.length]; drawFlip(f,pet.x,pet.y,12,17,pet.face<0);
      if(G.quests.beagle==='active'&&!G.flags.beagleFollow) marker(pet.x,pet.y-22,'?'); }});
  }
  if(k==='dalat') drawFarmLife(list,inView,now);
  if(k==='track') drawRace(list);
  for(const n of npcs) list.push({y:n.y,d:()=>drawNpc(n)});
  for(const r of REM.values()){ interp(r); if(!r.av||!inView(r.x,r.y)) continue; list.push({y:r.y,d:()=>drawChar(ctx,r.av,r.x,r.y,r.face,r.view,r.anim,r.act,r.t,r.actT,r.fl)}); }
  if(P.av) list.push({y:P.y,d:()=>drawChar(ctx,P.av,P.x,P.y,P.face,P.view,P.anim,P.act||(TASK&&TASK.anim)||'',P.t,P.actT,(P.riding?SD.FL.ride:0)|(P.kayak?SD.FL.kayak:0)|(FISH?SD.FL.fish:0)|(G.needs.clean<20?SD.FL.dirty:0))});
  list.sort((a,b)=>a.y-b.y); for(const it of list) it.d();
  for(const o of S.over) ctx.drawImage(o.spr.c,Math.round(o.x-o.spr.ax-cx),Math.round(o.y-o.spr.ay-cy));
  // ngày đêm theo giờ Việt Nam (ngoài trời)
  if(!S.map.indoor){ const h=vn().hf; let a=0, col='20,24,60'; if(h>=17&&h<19){ a=(h-17)/2*.42; col='70,40,60'; } else if(h>=19||h<5) a=.46; else if(h>=5&&h<6.5){ a=(6.5-h)/1.5*.42; col='60,40,70'; }
    if(a>0){ ctx.fillStyle=`rgba(${col},${a})`; ctx.fillRect(0,0,VW,VH); } }
  if(k==='retreat') drawLights(cx,cy);
  for(const f of fx) drawFx(f,cx,cy);
  if(soiT>0){ ctx.fillStyle='rgba(20,30,50,.25)'; ctx.fillRect(0,0,VW,VH); }
  if(flash>0){ ctx.fillStyle=`rgba(255,255,255,${flash})`; ctx.fillRect(0,0,VW,VH); }
  drawOverlay();
}
let wmT=-1, wmSpr=null; function windmillFrame(){ const f=Math.floor(clock*4)%18; if(f!==wmT){ wmT=f; wmSpr=A.windmill(f); } return wmSpr; }
function drawNpc(n){ if(n.av){ drawChar(ctx,n.av,n.x,n.y,n.face,n.view,n.view!=='side'?'idle_'+n.view:'idle','',n.t,0,0); return; }
  shadow(n.x,n.y,8); const sh=npcSheet(n); if(!sh) return; const v=!n.act&&n.view&&n.view!=='side'?'idle_'+n.view:null;
  let an=sh.anims[n.act||v||'idle']||sh.anims.idle, k=Math.floor((n.act?n.actT:n.t)*an.fps);
  const f=n.act&&!an.loop?an.frames[Math.min(an.frames.length-1,k)]:an.frames[k%an.frames.length]; drawFlip(f,n.x,n.y,16,48,n.face<0&&!v);
  const qid=Object.keys(Q).find(q=>Q[q].giver===n.id), st=G.quests[qid];
  if(n.id==='phap'&&!G.flags.hello) marker(n.x,n.y-44,'!'); else if(!st) marker(n.x,n.y-44,'!'); else if(st==='active'&&canFinish(qid)) marker(n.x,n.y-44,'?'); }
// vật nuôi của mình + bò, ngựa trang trí
function drawFarmLife(list,inView,now){ const D=SD.DALAT, wander=(i,x0,y0,w,h,sp)=>{ const t=clock*sp+i*7.3; return [x0+(Math.sin(t*.7+i)*.5+.5)*w,y0+(Math.cos(t*.53+i*2)*.5+.5)*h,Math.cos(t*.7+i)>0?1:-1]; };
  const pens={bo:[47,36,13,7],ga:[63,35,5,4],lon:[70,36,6,4]};
  (G.animals||[]).forEach((a,i)=>{ const pen=pens[a.k]; if(!pen) return; const [x,y,f]=wander(i,...pen,.25), ready=a.cyc&&now>=a.cyc;
    list.push({y:y*T,d:()=>{ drawFlip(animalSpr(a.k,Math.floor(clock*4)%2).c,x*T,y*T,a.k==='bo'?15:a.k==='lon'?11:6,a.k==='bo'?20:a.k==='lon'?14:10,f<0); if(ready) marker(x*T,y*T-24,'?'); else if(!a.cyc) marker(x*T,y*T-24,'!','#7fe0ff'); }}); });
  for(const k of ['ca','tom']){ const has=(G.animals||[]).find(a=>a.k===k); if(!has) continue; const p=D.pens[k], ready=has.cyc&&now>=has.cyc;
    if(Math.random()<.05) fx.push({kind:'bubble',x:(p.x+(Math.random()-.5)*5)*T,y:(p.y-2.4)*T,t:0,life:.8}); if(ready) list.push({y:p.y*T,d:()=>marker(p.x*T,p.y*T-30,'?')}); }
  for(let i=0;i<3;i++){ const [x,y,f]=wander(i+10,48,37,10,6,.18); if(inView(x*T,y*T)) list.push({y:y*T,d:()=>drawFlip(animalSpr('bo',Math.floor(clock*3+i)%2).c,x*T,y*T,15,20,f<0)}); }
  for(let i=0;i<4;i++){ const [x,y,f]=wander(i+20,59,9,15,14,.22); if(inView(x*T,y*T)) list.push({y:y*T,d:()=>drawFlip(HORSES[i][Math.floor(clock*3+i)%4].c,x*T,y*T,20,28,f<0)}); }
  if(HERD&&HERD.phase!=='done') for(let i=0;i<3;i++){ const tx=P.x-P.face*(22+i*16), ty=P.y+(i-1)*8; list.push({y:ty,d:()=>drawFlip(HORSES[(i+1)%4][Math.floor(clock*8)%4].c,tx,ty,20,28,P.face<0)}); } }
function drawRace(list){ const TR=Wd.TRACK; if(!RACE) return; const v=RACE;
  v.riders.forEach((r,i)=>{ const lane=TR.lanes[i]; if(lane===undefined) return; r._x=r._x??TR.x0*T; const tx=(TR.x0+(TR.x1-TR.x0)*r.dist/v.track)*T; r._x+=(tx-r._x)*.08;
    const x=r._x, y=(lane+1)*T, run=v.st==='run'&&Math.abs(tx-r._x)>1;
    list.push({y,d:()=>{ const h=(run||v.st==='run'?GALLOP:HORSES)[i%4][Math.floor(clock*(run?12:3))%4]; drawFlip(h.c,x,y,20,28,false); ctx.fillStyle=['#c4382e','#3f6e9a','#f2c43d','#5a8d64','#f2a6b8','#f4f1ea'][i]; ctx.fillRect(Math.round(x-cam.x)-3,Math.round(y-cam.y)-30,7,6); }}); }); }
function drawLights(cx,cy){ const h=vn().hf, on=h>=17.5||h<6;
  for(const [[ax,ay],[bx,by]] of S.map.lights||[]){ const x0=ax*T-cx, y0=ay*T-26-cy, x1=bx*T-cx, y1=by*T-26-cy, n=Math.ceil(Math.hypot(x1-x0,y1-y0)/5);
    ctx.fillStyle='rgba(40,30,20,.7)'; for(let i=0;i<=n*2;i++){ const t=i/(n*2); ctx.fillRect(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6),1,1); }
    for(let i=1;i<n;i++){ const t=i/n, x=Math.round(x0+(x1-x0)*t), y=Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6)+1;
      ctx.fillStyle=on||(i+Math.floor(clock*2))%3?'#ffd86b':'#c9a84a'; ctx.fillRect(x,y,1,2); if(on){ ctx.fillStyle='rgba(255,216,107,.22)'; ctx.fillRect(x-2,y-1,5,5); } } } }
function drawFx(f,cx,cy){ const k=f.t/f.life, X=Math.round(f.x-cx), Y=Math.round(f.y-cy);
  if(f.kind==='dust'){ ctx.fillStyle=`rgba(230,220,200,${1-k})`; ctx.fillRect(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),2,2); }
  if(f.kind==='note'){ ctx.fillStyle=`rgba(255,216,74,${1-k})`; const x=Math.round(X+Math.sin(f.t*6)*3), y=Math.round(Y-f.t*16); ctx.fillRect(x,y,2,2); ctx.fillRect(x+1,y-4,1,4); ctx.fillRect(x+1,y-4,2,1); }
  if(f.kind==='heart'){ ctx.fillStyle=`rgba(255,90,120,${1-k})`; const y=Math.round(Y-f.t*14); ctx.fillRect(X-2,y,2,2); ctx.fillRect(X+1,y,2,2); ctx.fillRect(X-2,y+1,5,2); ctx.fillRect(X-1,y+3,3,1); ctx.fillRect(X,y+4,1,1); }
  if(f.kind==='z'){ ctx.fillStyle=`rgba(240,240,255,${1-k})`; const y=Math.round(Y-f.t*10); ctx.fillRect(X,y,3,1); ctx.fillRect(X+1,y+1,1,1); ctx.fillRect(X,y+2,3,1); }
  if(f.kind==='spark'){ ctx.fillStyle=`rgba(127,224,255,${1-k})`; ctx.fillRect(X,Y-Math.round(f.t*8),1,1); }
  if(f.kind==='fly'){ ctx.fillStyle=`rgba(40,40,30,${1-k})`; ctx.fillRect(X+Math.round(Math.sin(f.t*20)*3),Y-Math.round(f.t*6),1,1); }
  if(f.kind==='steam'||f.kind==='bubble'){ ctx.fillStyle=`rgba(255,255,255,${(1-k)*.7})`; ctx.fillRect(X,Y-Math.round(f.t*10),2,2); }
  if(f.kind==='dmg'){ ug.save(); } }
// tên, khung chat, thanh máu/vật tay vẽ ở độ phân giải màn hình
function drawOverlay(){ ug.setTransform(DPR,0,0,DPR,0,0); ug.clearRect(0,0,innerWidth,innerHeight); ug.font='16px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom';
  const sx=x=>(x-cam.x)*SCALE, sy=y=>(y-cam.y)*SCALE, t=performance.now();
  const tag=(x,y,name,sub,col)=>{ const w=ug.measureText(name).width+8; ug.fillStyle='rgba(28,22,30,.72)'; ug.fillRect(x-w/2,y-16,w,16); ug.fillStyle=col||'#fff3d6'; ug.fillText(name,x,y-1); if(sub){ ug.fillStyle='#ffd84a'; ug.fillText(sub,x,y-17); } };
  const bubble=(x,y,text)=>{ const lines=wrap(text,26), w=Math.max(...lines.map(l=>ug.measureText(l).width))+14, h=lines.length*15+8, X=x-w/2, Y=y-h-6;
    ug.fillStyle='#1c1516'; ug.fillRect(X-2,Y-2,w+4,h+4); ug.fillStyle='#fbfaf6'; ug.fillRect(X,Y,w,h); ug.fillRect(x-3,Y+h,6,4); ug.fillStyle='#1c1516'; lines.forEach((l,i)=>ug.fillText(l,x,Y+15+i*15)); };
  for(const r of REM.values()){ if(!r.av) continue; const X=sx(r.x), Y=sy(r.y-46); if(X<-60||Y<-40||X>innerWidth+60||Y>innerHeight+40) continue;
    tag(X,Y,r.name+' · '+r.lv,r.tag,r.tag?'#9fe0ff':'#fff3d6'); if(r.chat&&t<r.chat.until) bubble(X,Y-18,r.chat.m); }
  if(P.av&&P.chat&&t<P.chat.until) bubble(sx(P.x),sy(P.y-46)-2,P.chat.m);
  for(const n of npcs) if(!STORY[n.id]&&Math.hypot(n.x-P.x,n.y-P.y)<90) tag(sx(n.x),sy(n.y-46),SD.NPC_LOOKS[n.id].name,'','#ffd84a');
  // vật tay / đánh nhau
  for(const s of SOCS.values()){ const a=s.a===NET.pid?{x:P.x,y:P.y}:REM.get(s.a), b=s.b===NET.pid?{x:P.x,y:P.y}:REM.get(s.b); if(!a||!b) continue;
    const X=sx((a.x+b.x)/2), Y=sy(Math.min(a.y,b.y)-58);
    if(s.kind==='vattay'&&s.score){ const tot=s.score.a+s.score.b||1, k=s.score.a/tot; ug.fillStyle='#1c1516'; ug.fillRect(X-62,Y-12,124,12); ug.fillStyle='#ff6a55'; ug.fillRect(X-60,Y-10,120*k,8); ug.fillStyle='#7fe0ff'; ug.fillRect(X-60+120*k,Y-10,120*(1-k),8);
      ug.fillStyle='#fff3d6'; ug.fillText(`VẬT TAY ${Math.ceil(s.left||0)}s · bấm SPACE liên tục`,X,Y-14); }
    if(s.kind==='danhnhau'&&s.hp){ for(const [p,hp,dx] of [[a,s.hp.a,-1],[b,s.hp.b,1]]){ const x=sx(p.x), y=sy(p.y-50); ug.fillStyle='#1c1516'; ug.fillRect(x-22,y-8,44,7); ug.fillStyle=hp>40?'#7de07a':'#ff6a55'; ug.fillRect(x-21,y-7,42*Math.max(0,hp)/100,5); } ug.fillStyle='#fff3d6'; ug.fillText('ĐÁNH NHAU · J đấm · X bỏ cuộc',X,Y-2); } }
  if(FISH&&FISH.st==='bite'){ ug.fillStyle='#ff6a55'; ug.font='32px VT323, monospace'; ug.fillText('! E',sx(P.x),sy(P.y-50)); }
  if(TASK){ const k=Math.min(1,(performance.now()-TASK.start)/(TASK.end-TASK.start)), X=innerWidth/2, Y=innerHeight-170; ug.fillStyle='#1c1516'; ug.fillRect(X-122,Y-12,244,26); ug.fillStyle='#3a2f40'; ug.fillRect(X-120,Y-10,240,22); ug.fillStyle='#7de07a'; ug.fillRect(X-120,Y-10,240*k,22); ug.fillStyle='#fff3d6'; ug.font='18px VT323, monospace'; ug.fillText(TASK.name||'Đang làm...',X,Y+9); }
  if(S.kind==='track') UI.raceOverlay&&UI.raceOverlay(ug,sx,sy); }
function wrap(s,n){ const w=String(s).split(' '), out=[]; let cur=''; for(const x of w){ if((cur+' '+x).trim().length>n&&cur){ out.push(cur); cur=x; } else cur=(cur+' '+x).trim(); } if(cur) out.push(cur); return out.slice(0,4); }

/* ---------- HUD ---------- */
function renderHUD(){ if(!G) return; const t=vn(), d=SD.WEEKDAYS[t.wd];
  $('#hudDay').textContent=d; $('#hudTime').textContent=`${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}`;
  $('#hudMoney').textContent=fmt(G.money);
  const L=SD.RULES.levels, lo=L[G.level-1]||0, hi=L[G.level]||lo+1; $('#hudLevel').textContent='Cấp '+G.level+' · '+G.name;
  $('#hudExp').style.width=Math.min(100,(G.exp-lo)/(hi-lo)*100)+'%'; $('#hudExpTxt').textContent=`${G.exp}/${hi} EXP`;
  const n=G.needs; for(const [k,id] of [['energy','#barEnergy'],['clean','#barClean'],['battery','#barBattery']]){ const v=Math.round(n[k]); $(id).style.width=v+'%'; $(id).classList.toggle('low',v<20); $(id+'T').textContent=v; }
  const ms=SD.mealStatus(G.meals,NET.now()); $('#hudMeals').innerHTML=ms.map(m=>`<span class="meal ${m.st}" title="${m.name} ${m.from}:00–${m.to}:00">${m.name.replace('Bữa ','')}</span>`).join('');
  const h=SD.hunger(G.meals,NET.now()), bf=[]; if(h) bf.push(`<span class="bad">Đói: -${Math.round((1-SD.RULES.hungrySpeed[h])*100)}% tốc độ, -${Math.round((1-SD.RULES.hungryExp[h])*100)}% EXP</span>`);
  if(n.energy<20) bf.push('<span class="bad">Mệt: chậm hơn</span>'); if(n.clean<20) bf.push('<span class="bad">Bẩn: -15% EXP</span>');
  for(const b of [G.buff,G.rbuff]) if(b&&b.until>NET.now()) bf.push(`<span class="good">+${Math.round((b.mul-1)*100)}% EXP · ${Math.ceil((b.until-NET.now())/60000)}'</span>`);
  $('#hudBuffs').innerHTML=bf.join('');
  // việc cần làm
  const li=[]; const job=G.extra&&G.extra.job;
  if(S&&S.kind==='room'&&!G.flags.called) li.push(`<li><b>Ở nhà</b><span>${ringTimer>0?'Ngủ thêm tí...':'Nghe điện thoại trên bàn'}</span></li>`);
  else if(G.flags.called&&!G.flags.arrived) li.push('<li><b>Đi Ké Retreat</b><span>Bấm G mở Grab (Pháp bao)</span></li>');
  else if(S&&S.kind==='retreat'&&!G.flags.hello) li.push('<li><b>Tìm Pháp</b><span>Pháp đang đợi ở Cổng</span></li>');
  for(const q of Object.keys(Q).filter(q=>G.quests[q]==='active')) li.push(`<li class="${canFinish(q)?'ready':''}"><b>${Q[q].title}</b><span>${canFinish(q)?'Quay lại gặp '+Wd.CHARS[Q[q].giver].name:questProgress(q)}</span></li>`);
  if(job&&job.hired&&job.today.workday) li.push(`<li><b>Everfit ${job.today.remote?'(remote)':''}</b><span>${job.today.done.length}/${job.today.tasks.length} task · ${job.today.inHours?'trong giờ làm':'ngoài giờ'}</span></li>`);
  if(G.cookOrder){ const r=SD.RECIPES[G.cookOrder.r]; li.push(`<li><b>Nấu ${r.name}</b><span>${Object.entries(r.need).map(([k,c])=>`${SD.ITEMS[k].name} ${Math.min(G.items[k]||0,c)}/${c}`).join(' · ')}</span></li>`); }
  if(HERD) li.push(`<li><b>Chăn ngựa</b><span>${HERD.phase==='go'?'Dắt đàn ra đồng cỏ':'Dắt về chuồng anh Phong'}</span></li>`);
  li.push(`<li><b>Chỗ ngủ</b><span>${G.stay?SD.ROOMS[G.stay.room].name+(G.stay.paid===t.day?' · đã trả hôm nay':' · chưa trả'):'Chưa thuê phòng ở Ké'}</span></li>`);
  const done=Object.keys(Q).filter(q=>G.quests[q]==='done').length;
  $('#hudQuests').innerHTML=`<h4>Việc cần làm <small>Ké ${done}/6</small></h4><ul>${li.join('')}</ul>`;
  const inv=Object.entries(G.items); $('#hudItems').innerHTML=[...Array(8)].map((_,i)=>{ const it=inv[i]; if(!it) return '<div class="slot"></div>';
    return `<div class="slot" title="${SD.ITEMS[it[0]]?SD.ITEMS[it[0]].name:it[0]}"><img src="${icon64(it[0])}" alt="">${it[1]>1?`<i>${it[1]}</i>`:''}</div>`; }).join('')+`<button class="slot more" id="btnBag" title="Túi đồ (I)">I<br>túi</button>`;
  $('#hudSkills').innerHTML=Object.entries(SD.SKILLS).filter(([k])=>G.skills[k]).map(([k,s])=>`<div class="sk" title="${s.name}: ${s.desc}"><kbd>${s.key}</kbd><span>${s.name}</span></div>`).join('');
  $('#hudOnline').textContent=REM.size?`${REM.size} người quanh đây`:''; }
const ICO={}; function icon64(k){ return ICO[k]||(ICO[k]=A.icon(SD.ITEMS[k]?SD.ITEMS[k].icon:k,3).toDataURL()); }
document.addEventListener('click',e=>{ if(e.target.closest('#btnBag')) UI.bag(); });

/* ---------- minimap + bản đồ ---------- */
const MINI_COL={G:'#79b34a',F:'#3f7a31',P:'#d6c39b',T:'#d6c39b',S:'#cbc6ba',R:'#b9b3a7',D:'#e3d2a2',W:'#3b8ed3',K:'#a26c40',L:'#43c5e3',E:'#e6e0d2',X:'#8d8880',C:'#c9a877',Q:'#a26c40',B:'#b0643c',Y:'#8a5a3a'};
let miniBase=null;
function buildMini(){ const m=S.map, c=A.cv(S.W,S.H), g=c.getContext('2d'); for(let y=0;y<S.H;y++) for(let x=0;x<S.W;x++){ g.fillStyle=MINI_COL[m.grid[y][x]]||'#3f7a31'; g.fillRect(x,y,1,1); } miniBase=c; }
function drawMini(){ const box=$('#minimap'); if(!S||(S.kind!=='retreat'&&S.kind!=='dalat')){ box.hidden=true; return; } box.hidden=false; if(!miniBase) buildMini();
  const c=$('#miniCv'), g=c.getContext('2d'), TW=40, TH=28, k=c.width/TW, sx=Math.max(0,Math.min(S.W-TW,P.x/T-TW/2)), sy=Math.max(0,Math.min(S.H-TH,P.y/T-TH/2));
  g.imageSmoothingEnabled=false; g.drawImage(miniBase,sx,sy,TW,TH,0,0,c.width,c.height);
  const dot=(x,y,col,r=2)=>{ const X=(x/T-sx)*k, Y=(y/T-sy)*k; if(X<-3||Y<-3||X>c.width+3||Y>c.height+3) return; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=col; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2); };
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea');
  for(const r of REM.values()) dot(r.x,r.y,'#7fe0ff',1);
  if(Math.floor(clock*3)%3) dot(P.x,P.y,'#ff4a3d',2);
  $('#miniZone').textContent=zoneName||S.map.name; }
$('#minimap').addEventListener('click',()=>toggleMap());
function toggleMap(){ const v=$('#mapView'); if(S.kind!=='retreat'&&S.kind!=='dalat'){ toast('Bản đồ có ở Ké Retreat và nông trại Đà Lạt','lock'); return; } v.hidden=!v.hidden; if(!v.hidden) drawMap(); }
function drawMap(){ const c=$('#mapCv'), g=c.getContext('2d'), m=S.map, ret=S.kind==='retreat', sx=ret?10*T:0, sy=ret?20*T:0, sw=ret?60*T:S.W*T, sh=ret?92*T:S.H*T, k=Math.min((innerHeight*.82)/sh,(innerWidth*.6)/sw);
  c.width=Math.round(sw*k); c.height=Math.round(sh*k); g.imageSmoothingEnabled=false; g.drawImage(S.ground[0],sx,sy,sw,sh,0,0,c.width,c.height);
  g.fillStyle='rgba(30,60,30,.3)'; g.fillRect(0,0,c.width,c.height);
  for(const o of S.objs) if(o.house){ const s=o.spr; g.drawImage(s.c,(o.x-s.ax-sx)*k,(o.y-s.ay-sy)*k,s.c.width*k,s.c.height*k); }
  g.font=`${Math.max(12,Math.round(13*k*2.4))}px VT323, monospace`; g.textAlign='center';
  for(const l of m.labels||[]){ const x=(l.x*T-sx)*k, y=(l.y*T-sy)*k-4; g.fillStyle='rgba(28,21,22,.75)'; const w=g.measureText(l.name).width+8; g.fillRect(x-w/2,y-12,w,15); g.fillStyle='#fff3d6'; g.fillText(l.name,x,y); }
  const dot=(x,y,col,r=4)=>{ g.fillStyle='#1c1516'; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r+1.5,0,7); g.fill(); g.fillStyle=col; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r,0,7); g.fill(); };
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea',3); for(const r of REM.values()) dot(r.x,r.y,'#7fe0ff',3); dot(P.x,P.y,'#ff4a3d',5);
  $('#mapTitle').textContent=ret?'Ké Retreat':'Nông trại bác Trang';
  $('#mapLegend').innerHTML='<span><i style="background:#ff4a3d"></i>Bạn</span><span><i style="background:#ffd84a"></i>Cả hội</span><span><i style="background:#f4f1ea"></i>Chủ quán, chủ trại</span><span><i style="background:#7fe0ff"></i>Người chơi khác</span>'; }

/* ---------- tin từ server ---------- */
NET.listen('me',m=>{ const old=G; G=m.p; window.CHANDE&&(CHANDE._g=G);
  const lk=JSON.stringify(G.look||{}); if(lk!==P.look&&G.look){ P.look=lk; P.av=AVATAR.build(G.look); delete PORTRAIT.me; }
  if(old&&old.level<G.level){ bigText(`LÊN CẤP ${G.level}!`); sfx('level_up',.6); }
  if(G.flags.phapForm==='cam') delete PORTRAIT.phap; renderHUD(); UI.refresh&&UI.refresh(); });
NET.listen('scene',m=>{ if(!started) return; enterScene(m); });
NET.listen('pos',m=>{ P.x=m.x; P.y=m.y; if(m.ride) fadeOnly(''); });
NET.listen('nd',m=>{ if(G){ Object.assign(G.needs,m.n); renderHUD(); } });
NET.listen('pj',m=>{ const r=remote(m.id); r.name=m.n; r.lv=m.lv; r.tag=m.tag; const lk=JSON.stringify(m.l); if(lk!==r.look&&m.l){ r.look=lk; r.av=AVATAR.build(m.l); } });
NET.listen('s',m=>{ const tm=performance.now();
  for(const e of m.u){ const [id,x,y,f,v,a,ac,fl]=e, r=remote(id), last=r.buf[r.buf.length-1];
    if(last&&tm-last.tm>250) r.buf.push({...last,tm:tm-100});
    if(!last){ r.x=x; r.y=y; } r.buf.push({tm,x,y,f,v,a,act:ac,fl}); if(r.buf.length>8) r.buf.splice(0,r.buf.length-8); }
  for(const id of m.g) REM.delete(id); });
NET.listen('chat',m=>{ const who=m.id===NET.pid?P:REM.get(m.id); if(who) who.chat={m:m.m,until:performance.now()+5000}; UI.chatLog&&UI.chatLog((m.id===NET.pid?G.name:(who&&who.name)||'?'),m.m); });
NET.listen('rw',m=>{ if(m.msg) toast(esc(m.msg),'quest'); if(m.exp) toast(`<b>+${m.exp} EXP</b>`,'exp'); if(m.vnd){ toast(`<b>+${fmt(m.vnd)}</b>`,'vnd'); sfx('coin',.5); }
  if(m.items) for(const [k,n] of Object.entries(m.items)) toast(`Nhận: <b>${SD.ITEMS[k]?SD.ITEMS[k].name:k}</b>${n>1?' ×'+n:''}`,'item');
  if(m.skill){ const s=SD.SKILLS[m.skill]; setTimeout(()=>toast(`Mở khoá: <b>${s.name}</b> <kbd>${s.key}</kbd>`,'skill'),350); } });
NET.listen('note',m=>toast(esc(m.msg),m.kind||''));
NET.listen('task',m=>{ if(m.cancel){ TASK=null; toast('Đã dừng việc đang làm','lock'); return; }
  if(m.done){ TASK=null; if(m.msg) toast(esc(m.msg),'item'); if(m.act==='herd'&&HERD) HERD.phase='back'; return; }
  TASK={act:m.act,name:m.name,start:performance.now(),end:performance.now()+m.sec*1000,anim:{nghi:'sleep',tam:'shower',tiktok:'phone',songao:'phone',work:'work',hoc:'work',cook:'cook',herd:''}[m.act]||'',walk:m.act==='herd'}; });
NET.listen('bite',()=>{ if(FISH){ FISH.st='bite'; sfx('blip',.5); } });
NET.listen('plots',m=>{ for(const [id,p] of Object.entries(m.list)) PLOTS[id]=p; });
NET.listen('plot',m=>{ if(m.p) PLOTS[m.id]=m.p; else delete PLOTS[m.id]; });
NET.listen('soc',m=>{ const key=m.a+':'+m.b;
  if(m.k==='start'){ SOCS.set(key,{kind:m.kind,a:m.a,b:m.b}); if(m.kind==='namtay'&&m.b===NET.pid) P.link=m.a; const mine=m.a===NET.pid||m.b===NET.pid;
    if(mine) toast({namtay:'Đang nắm tay · X để buông',hon:'Chụt! ♥',vattay:'Vật tay! Bấm SPACE thật nhanh',danhnhau:'Đánh nhau! J để đấm, X bỏ cuộc'}[m.kind],'quest'); }
  if(m.k==='prog'){ const s=SOCS.get(key); if(s){ s.score=m.score; s.left=m.left; } }
  if(m.k==='end'){ SOCS.delete(key); if(P.link===m.a&&m.b===NET.pid) P.link=null; if((m.a===NET.pid||m.b===NET.pid)&&m.kind!=='namtay'&&m.kind!=='hon') toast(m.win===NET.pid?'Bạn thắng!':m.win?'Bạn thua rồi':'Hoà!',m.win===NET.pid?'exp':''); } });
NET.listen('ev',m=>{ if(m.k==='hit'){ for(const s of SOCS.values()) if((s.a===m.from&&s.b===m.to)||(s.b===m.from&&s.a===m.to)) s.hp=m.hp; if(m.to===NET.pid){ P.act='hurt'; P.actT=0; sfx('dash',.4); } }
  if(m.k==='lvl'){ const r=REM.get(m.id); if(r){ r.lv=m.lv; fx.push({kind:'note',x:r.x,y:r.y-40,t:0,life:1}); } } });
NET.listen('socAsk',m=>UI.socAsk(m)); NET.listen('knockAsk',m=>UI.knockAsk(m));
NET.listen('och',m=>UI.och&&UI.och(m));
NET.listen('tbl',m=>{ TABLE=m.v; UI.tableView&&UI.tableView(m.v); });
NET.listen('race',m=>{ RACE=m.v; UI.raceView&&UI.raceView(m.v); }); NET.listen('raceHit',m=>{ if(RACE&&RACE.riders[m.i]){ RACE.riders[m.i].dist=m.dist; RACE.riders[m.i].j=m.j; UI.raceHit&&UI.raceHit(m); } });
NET.listen('kick',m=>{ started=false; alert(m.msg); location.reload(); });
NET.listen('close',()=>{ if(started){ toast('Mất kết nối server. Đang thử lại...','lock'); setTimeout(()=>location.reload(),2500); } });

/* ---------- vòng lặp ---------- */
let last=0, hudT=0;
function frame(t){ requestAnimationFrame(frame); const dt=Math.min(.05,(t-last)/1000||0); last=t; clock+=dt;
  if(!started||!S||travelling){ pressed.clear(); return; }
  waterFrame=Math.floor(clock*2)%2; update(dt); draw(); drawMini(); pressed.clear(); hudT-=dt; if(hudT<=0){ renderHUD(); hudT=1; } }
async function boot(){ await loadAudio(); setMute(AUD.muted);
  const jobs=Object.entries(Wd.CHARS).filter(([id])=>id!=='menmen').map(async([id,c])=>{ SHEETS[id]=await loadSheet(c.sheet); if(c.sheet2) SHEETS.phap2=await loadSheet(c.sheet2); });
  jobs.push((async()=>{ PETS=await loadSheet('phap/beagle'); })());
  await Promise.all(jobs); requestAnimationFrame(frame); }
// lobby gọi khi đã đăng nhập + có nhân vật
function start(prof,sceneMsg){ G=prof; P.look=JSON.stringify(G.look); P.av=AVATAR.build(G.look); started=true; document.body.classList.add('playing'); if(sceneMsg) enterScene(sceneMsg); renderHUD(); }
window.GAME={boot,start,toast,esc,act,say,ask,sfx,setMute,AUD,banner,bigText,renderHUD,portrait,icon64,
  get G(){return G;},get P(){return P;},get S(){return S;},get REM(){return REM;},get PLOTS(){return PLOTS;},get TABLE(){return TABLE;},get RACE(){return RACE;},
  set HERD(v){HERD=v;},get HERD(){return HERD;},get FISH(){return FISH;},plotState,canFinish,startRoomAct,interact,nearest,keys,
  get started(){return started;}};
// hook kiểm thử: chạy mô phỏng theo bước khi tab bị ẩn (rAF bị hãm)
window.CHANDE={get G(){return G;},get P(){return P;},get S(){return S;},REM,nearest,interact,
  step(sec,hold=[],tap=[]){ for(const k of hold) keys.add(k); let first=true; for(let t=0;t<sec;t+=1/60){ if(first) for(const k of tap) pressed.add(k); first=false; clock+=1/60; update(1/60); pressed.clear(); }
    for(const k of hold) keys.delete(k); draw(); drawMini(); renderHUD(); }};
})();
