/* Chande Bootcamp — engine top-down.
   Mèn Mén thức dậy trong phòng → Pháp gọi → đi xe lên Ké Retreat → giúp 6 người, nhận EXP, tiền VNĐ, đồ, skill. */
(function(){
const A=ART, Wd=WORLD, T=A.T, $=s=>document.querySelector(s);
const SPR='../pixel-sprite-forge/characters/';

/* ---------- canvas ---------- */
const cvs=$('#game'), ctx=cvs.getContext('2d');
let VW=400, VH=225, SCALE=3;
function resize(){ SCALE=Math.max(2,Math.round(Math.min(innerHeight/240,innerWidth/400))); VW=Math.ceil(innerWidth/SCALE); VH=Math.ceil(innerHeight/SCALE);
  cvs.width=VW; cvs.height=VH; cvs.style.width=VW*SCALE+'px'; cvs.style.height=VH*SCALE+'px'; ctx.imageSmoothingEnabled=false; }
addEventListener('resize',resize); resize();

/* ---------- âm thanh (Magnific tạo, file trong ./audio) ---------- */
const AUD={muted:false,files:{},music:null,cur:''};
try{ AUD.muted=localStorage.getItem('chande-mute')==='1'; }catch(e){}
async function loadAudio(){ try{ const m=await (await fetch('audio/manifest.json')).json();
  for(const [k,f] of Object.entries(m)){ const a=new Audio('audio/'+f); a.preload='auto'; AUD.files[k]=a; } }catch(e){ /* chưa có âm thanh thì chơi im lặng */ } }
const MONO={blip:1,step1:1,step2:1}, monoNode={};
function sfx(k,vol=.55){ if(AUD.muted) return; const a=AUD.files[k]; if(!a) return;
  if(MONO[k]){ const n=monoNode[k]||(monoNode[k]=a.cloneNode()); n.volume=vol; n.currentTime=0; n.play().catch(()=>{}); return n; }   // tiếng lặp nhanh: phát lại 1 kênh, không chồng
  const n=a.cloneNode(); n.volume=vol; n.play().catch(()=>{}); return n; }
function music(k){ if(AUD.cur===k) return; AUD.cur=k; const old=AUD.music;
  if(old){ const o=old; let v=o.volume; const t=setInterval(()=>{ v-=.05; if(v<=0){ o.pause(); clearInterval(t); } else o.volume=v; },60); }
  const a=AUD.files[k]; if(!a){ AUD.music=null; return; } const n=a.cloneNode(); n.loop=true; n.volume=0; AUD.music=n; if(!AUD.muted) n.play().catch(()=>{});
  let v=0; const t=setInterval(()=>{ v+=.04; if(v>=.38){ v=.38; clearInterval(t); } n.volume=v; },60); }
function setMute(m){ AUD.muted=m; try{ localStorage.setItem('chande-mute',m?'1':'0'); }catch(e){} if(AUD.music){ if(m) AUD.music.pause(); else AUD.music.play().catch(()=>{}); } $('#btnSound').textContent=m?'Âm thanh: tắt':'Âm thanh: bật';
  for(const b of [$('#btnMuteHud'),$('#titleMute')]){ b.classList.toggle('off',m); b.setAttribute('aria-pressed',String(!m)); }
  $('#muteLbl').textContent=m?'Tiếng: tắt':'Tiếng: bật'; $('#titleMute .lbl').textContent=m?'Tiếng: tắt':'Tiếng: bật'; }
for(const id of ['#btnMuteHud','#titleMute']) $(id).addEventListener('click',e=>{ setMute(!AUD.muted); e.currentTarget.blur(); });
addEventListener('keydown',e=>{ if(e.key.toLowerCase()==='n'&&!e.repeat) setMute(!AUD.muted); });

/* ---------- sprite nhân vật ---------- */
const SHEETS={}, PORTRAIT={};
async function loadSheet(path){ const [img,json]=await Promise.all([new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=SPR+path+'_sheet.png'; }), fetch(SPR+path+'_sheet.json').then(r=>r.json())]);
  const {frameWidth:fw,frameHeight:fh}=json.meta.grid, out={fw,fh,anims:{}};
  for(const t of json.meta.frameTags){ const fr=[]; for(let i=0;i<=t.to-t.from;i++){ const c=A.cv(fw,fh); c.getContext('2d').drawImage(img,i*fw,t.row*fh,fw,fh,0,0,fw,fh); fr.push(c); } out.anims[t.name]={frames:fr,fps:t.fps||6,loop:t.loop}; }
  return out; }
function gridCanvas(grid,pal,extra,top,bob){ const c=A.cv(32,48), g=c.getContext('2d'), im=g.createImageData(32,48);
  grid.forEach((row,gy)=>row.forEach((ch,gx)=>{ if(ch==='.') return; const v=(extra&&extra[ch])||pal[ch]; if(!v) return; const y=13-top+gy+bob; if(y<0||y>=48||gx>=32) return; const i=(y*32+gx)*4; im.data[i]=v[0]; im.data[i+1]=v[1]; im.data[i+2]=v[2]; im.data[i+3]=255; }));
  g.putImageData(im,0,0); return c; }
function buildMenSkills(){ // skill của Mèn Mén sinh trực tiếp từ template nhân vật
  const RT=RefTemplate, pd=RT.presetData('menmen'), cols={}; for(const k in pd.colors) cols[k]=RT.hx(pd.colors[k]); const pal=RT.palette(cols);
  const o={...pd.opts,brows:true,mouth:'line',quay:true,noi:true,hokage:true}, out={};
  const mk=(name,fr,skipTop)=>{ out[name]=fr.map(f=>{ const grid=skipTop?f.grid.map((r,y)=>y<f.padTop?r.map(()=>'.'):r):f.grid; return gridCanvas(grid,pal,f.palExtra,f.padTop||0,f.bob||0); }); };
  mk('quay',RT.poseFrames('quay',o)); mk('hokage',RT.poseFrames('hokage',o)); mk('noi',RT.poseFrames('noi',o),true);
  mk('gong',RT.poseFrames('saiyan',{...o,saiyan:{toOpts:{hair:o.hair,beard:o.beard,mouth:'line'},toHair:cols.hair}}));
  // khung chat VÃI Ò vẽ riêng để không bị lật chữ khi quay trái
  const B=RT.bubble('VÃI Ò'), bc=A.cv(B[0].length,B.length), bg=bc.getContext('2d');
  B.forEach((r,y)=>r.forEach((ch,x)=>{ if(ch==='.') return; const v=pal[ch]; bg.fillStyle=`rgb(${v})`; bg.fillRect(x,y,1,1); })); out.bubble=bc;
  return out; }
function portrait(id){ if(PORTRAIT[id]) return PORTRAIT[id];
  const c=A.cv(84,84), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,84,84);
  if(id==='beagle'){ const f=PETS.anims.idle.frames[0]; g.drawImage(f,10,1,14,12,0,8,84,72); }
  else { const sh=id==='me'?SHEETS.menmen:(id==='phap'&&G.flags.phapForm==='cam'?SHEETS.phap2:SHEETS[id]); if(sh) g.drawImage(sh.anims.idle.frames[0],5,12,22,20,0,2,88,80); }
  return PORTRAIT[id]=c; }
let PETS=null, MEN=null;

/* ---------- trạng thái game ---------- */
const NEW={scene:'room',money:120000,exp:0,level:1,items:{},skills:{noi:true},quests:{},flags:{called:false,hello:false,beagleFollow:false,fire:false,phapForm:'xanh',spots:{},coins:{},picked:{},chicken:false,finale:false},minutes:8*60};
let G=JSON.parse(JSON.stringify(NEW));
function save(){ try{ localStorage.setItem('chande-save',JSON.stringify(G)); }catch(e){} }
function loadSave(){ try{ const s=localStorage.getItem('chande-save'); return s?JSON.parse(s):null; }catch(e){ return null; } }
const LEVELS=[0,100,250,450,700,1000,1400,2000];
const fmt=v=>v.toLocaleString('vi-VN')+'đ';

/* ---------- scene ---------- */
let S=null;                                         // scene hiện tại
const P={x:0,y:0,face:1,view:'side',anim:'idle',t:0,act:null,actT:0,moving:false,dashT:0,dashCD:0,stepT:0,hok:0};
const pet={x:0,y:0,face:1,anim:'sit',t:0,still:0};
const chick={x:0,y:0,face:1,t:0,tx:0,ty:0,wait:0};
let npcs=[], soiT=0, fx=[], zoneName='', flash=0;
function buildScene(name){
  const m=name==='room'?Wd.buildRoom():Wd.buildRetreat(), W=m.W, H=m.H;
  const solid=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!A.WALKABLE.has(m.grid[y][x])) solid[y*W+x]=1;
  for(const [x0,y0,x1,y1] of m.solid) for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(x>=0&&y>=0&&x<W&&y<H) solid[y*W+x]=1;
  const ground=[0,1].map(fr=>{ const c=A.cv(W*T,H*T), g=c.getContext('2d');
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) A.drawTile(g,m.grid[y][x],x,y,(dx,dy)=>{ const yy=y+dy, xx=x+dx; return yy>=0&&yy<H&&xx>=0&&xx<W?m.grid[yy][xx]:(name==='room'?'H':'F'); },fr);
    for(const o of m.obj) if(o.flat) g.drawImage(o.spr.c,o.x-o.spr.ax,o.y-o.spr.ay);
    return c; });
  const objs=m.obj.filter(o=>!o.flat).sort((a,b)=>(a.sort??a.y)-(b.sort??b.y));
  S={name,map:m,W,H,solid,ground,objs}; miniBase=null;
  if(name==='retreat'){
    npcs=Wd.NPCS.map(n=>({...n,view:'down',x:n.x*T,y:n.y*T,home:{x:n.x*T,y:n.y*T},anim:'idle',t:Math.random()*2,act:null,actT:0}));
    pet.x=Wd.BEAGLE_SPOT.x*T; pet.y=Wd.BEAGLE_SPOT.y*T;
    if(G.quests.beagle==='done'){ const ph=npcs.find(n=>n.id==='phap'); pet.x=ph.x+18; pet.y=ph.y+2; }
    chick.x=chick.tx=Wd.CHICKEN_HOME.x*T; chick.y=chick.ty=Wd.CHICKEN_HOME.y*T;
  } else npcs=[];
}
function solidAt(px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); if(tx<0||ty<0||tx>=S.W||ty>=S.H) return true; return S.solid[ty*S.W+tx]===1; }
function blocked(x,y){ const hw=5, h=4; if(solidAt(x-hw,y-h)||solidAt(x+hw,y-h)||solidAt(x-hw,y)||solidAt(x+hw,y)) return true;
  for(const n of npcs){ if(Math.hypot(n.x-x,(n.y-y)*1.6)<9) return true; } return false; }
function move(o,dx,dy){ if(dx&&!blocked(o.x+dx,o.y)) o.x+=dx; if(dy&&!blocked(o.x,o.y+dy)) o.y+=dy; }

/* ---------- input ---------- */
const keys=new Set(); let pressed=new Set();
addEventListener('keydown',e=>{ const k=e.key.toLowerCase(); if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k)) e.preventDefault(); if(!keys.has(k)) pressed.add(k); keys.add(k); });
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());
const down=(...ks)=>ks.some(k=>keys.has(k)), hit=(...ks)=>ks.some(k=>pressed.has(k));

/* ---------- hội thoại ---------- */
const DLG={open:false,lines:[],i:0,shown:0,done:null,choice:null,sel:0,blipT:0};
function say(lines,done,vars={}){ DLG.open=true; DLG.lines=lines.map(([who,txt])=>[who,txt.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'')]); DLG.i=0; DLG.shown=0; DLG.done=done||null; DLG.choice=null; renderDialog(); $('#dialog').hidden=false; }
function ask(question,who,opts,cb){ say([[who,question]],null); DLG.choice={opts,cb}; DLG.sel=0; }
function speakerName(who){ return who==='me'?'Mèn Mén':who==='beagle'?'Beagle':Wd.CHARS[who]?Wd.CHARS[who].name:who; }
function renderDialog(){ const [who,txt]=DLG.lines[DLG.i]||['','']; $('#dlgName').textContent=speakerName(who);
  const pc=$('#dlgPortrait'), g=pc.getContext('2d'); g.imageSmoothingEnabled=false; g.clearRect(0,0,84,84); g.drawImage(portrait(who),0,0);
  $('#dlgText').textContent=txt.slice(0,Math.floor(DLG.shown));
  const typing=DLG.shown<txt.length, last=DLG.i===DLG.lines.length-1;
  $('#dlgChoices').innerHTML=!typing&&last&&DLG.choice?DLG.choice.opts.map((o,i)=>`<button class="choice${i===DLG.sel?' on':''}" data-i="${i}">${i===DLG.sel?'▶ ':''}${o}</button>`).join(''):'';
  $('#dlgMore').hidden=typing||(last&&!!DLG.choice); }
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
function toast(html,kind=''){ const d=document.createElement('div'); d.className='toast '+kind; d.innerHTML=html; $('#toasts').appendChild(d); setTimeout(()=>d.classList.add('out'),2600); setTimeout(()=>d.remove(),3200); }
function banner(text){ const b=$('#banner'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function bigText(text){ const b=$('#bigtext'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }

/* ---------- phần thưởng / nhiệm vụ ---------- */
function addItem(k,n=1){ G.items[k]=(G.items[k]||0)+n; if(G.items[k]<=0) delete G.items[k]; renderHUD(); }
function reward(r){
  if(r.exp){ G.exp+=r.exp; toast(`<b>+${r.exp} EXP</b>`,'exp'); }
  if(r.vnd){ G.money+=r.vnd; toast(`<b>+${fmt(r.vnd)}</b>`,'vnd'); sfx('coin',.5); }
  if(r.item){ addItem(r.item); toast(`Nhận: <b>${Wd.ITEMS[r.item].name}</b>`,'item'); }
  if(r.skill){ G.skills[r.skill]=true; const s=Wd.SKILLS[r.skill]; setTimeout(()=>{ toast(`Mở khoá skill: <b>${s.name}</b> <kbd>${s.key}</kbd>`,'skill'); },350); }
  let lv=G.level; while(LEVELS[lv]!==undefined&&G.exp>=LEVELS[lv]) lv++;
  if(lv>G.level){ G.level=lv; setTimeout(()=>{ bigText(`LÊN CẤP ${lv}!`); sfx('level_up',.6); P.act='gong'; P.actT=0; },700); }
  renderHUD(); save(); }
function startQuest(id){ G.quests[id]='active'; sfx('quest_accept',.5); toast(`Nhận nhiệm vụ: <b>${Wd.QUESTS[id].title}</b>`,'quest'); renderHUD(); save(); }
function finishQuest(id){ G.quests[id]='done'; sfx('quest_complete',.6); toast(`Hoàn thành: <b>${Wd.QUESTS[id].title}</b>`,'quest'); reward(Wd.QUESTS[id].reward);
  if(Object.keys(Wd.QUESTS).every(q=>G.quests[q]==='done')&&!G.flags.finale){ G.flags.finale=true; setTimeout(()=>say(Wd.DIALOG.finale,()=>showEnd()),2400); } save(); }
function questProgress(id){ const q=Wd.QUESTS[id];
  if(id==='beagle') return G.flags.beagleFollow?'Dẫn beagle về Cổng':'Tìm ở Nền khu cắm trại';
  if(q.need) return Object.entries(q.need).map(([k,n])=>`${Wd.ITEMS[k].name} ${Math.min(G.items[k]||0,n)}/${n}`).join(' · ');
  if(q.spots) return `Đã chụp ${q.spots.filter(s=>G.flags.spots[s]).length}/${q.spots.length}`; return ''; }
function canFinish(id){ const q=Wd.QUESTS[id]; if(id==='beagle') return G.flags.beagleFollow&&Math.hypot(pet.x-P.x,pet.y-P.y)<60;
  if(q.need) return Object.entries(q.need).every(([k,n])=>(G.items[k]||0)>=n); if(q.spots) return q.spots.every(s=>G.flags.spots[s]); return false; }

function talk(n){
  faceToward(n); const id=n.id, D=Wd.DIALOG;
  if(id==='phap'){
    if(!G.flags.hello){ G.flags.hello=true; save(); say(D.phap_hello,()=>ask('Tìm beagle giúp Pháp chứ?','phap',['Ok, để tao lo','Để sau'],i=>{ if(i===0){ startQuest('beagle'); sfx('dog_bark',.5); } }));
      return; }
    if(!G.quests.beagle){ ask('Tìm beagle giúp tao chứ?','phap',['Ok, để tao lo','Để sau'],i=>{ if(i===0) startQuest('beagle'); }); return; }
    if(G.quests.beagle==='active'){ if(canFinish('beagle')){ say(D.phap_done,()=>{ G.flags.beagleFollow=false; finishQuest('beagle'); n.act='saiyan'; n.actT=0; sfx('power_up',.55); }); } else say(D.phap_wait); return; }
    if(Object.keys(Wd.QUESTS).every(q=>G.quests[q]==='done')){ say(D.finale,()=>showEnd()); return; }
    say(D.phap_after); return; }
  const qid=Object.keys(Wd.QUESTS).find(k=>Wd.QUESTS[k].giver===id), st=G.quests[qid], pre=id;
  if(!st){ say(D[pre+'_offer'],()=>ask(`Nhận "${Wd.QUESTS[qid].title}"?`,id,['Nhận nhiệm vụ','Để sau'],i=>{ if(i===0) startQuest(qid); })); return; }
  if(st==='active'){
    if(canFinish(qid)){ say(D[pre+'_done'],()=>{ const need=Wd.QUESTS[qid].need||{}; for(const [k,c] of Object.entries(need)) addItem(k,-c);
      if(qid==='cui'){ G.flags.fire=true; } finishQuest(qid);
      if(id==='khabanh'){ n.act='quay'; n.actT=0; } if(id==='huyphan'){ n.act='hokage'; n.actT=0; sfx('poof',.55); } });
      return; }
    const q=Wd.QUESTS[qid], vars={wood:G.items.wood||0,paper:G.items.paper||0,spots:(q.spots||[]).filter(s=>G.flags.spots[s]).length,
      missing:Object.keys(q.need||{}).filter(k=>!(G.items[k]>0)).map(k=>Wd.ITEMS[k].name).join(', ')};
    say(D[pre+'_wait'],null,vars); return; }
  say(D[pre+'_after']); }

/* ---------- tương tác ---------- */
function nearest(){
  let best=null, bd=1e9; const consider=(d,o)=>{ if(d<bd){ bd=d; best=o; } };
  const dist=(x,y)=>Math.hypot(x-P.x,(y-P.y)*1.3);
  for(const n of npcs){ const d=dist(n.x,n.y); if(d<26) consider(d*.5,{type:'npc',n,label:'Nói chuyện'}); }   // người được ưu tiên hơn đồ vật
  for(const it of S.map.inter){ const d=dist(it.x,it.y); if(d<it.r) consider(d,{type:'obj',it,label:it.label}); }
  if(S.name==='retreat'){
    Wd.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]!=='active'||G.flags.picked[i]) return; const d=dist(p.x*T,p.y*T); if(d<18) consider(d,{type:'pick',p,i,label:'Nhặt '+Wd.ITEMS[p.item].name}); });
    if(G.quests.anh==='active') for(const s of Wd.SPOTS){ if(G.flags.spots[s.id]) continue; const d=dist(s.x*T,s.y*T); if(d<18) consider(d,{type:'spot',s,label:'Chụp ảnh'}); }
    if(G.quests.beagle==='active'&&!G.flags.beagleFollow){ const d=dist(pet.x,pet.y); if(d<26) consider(d,{type:'beagle',label:'Gọi beagle'}); }
    if(G.quests.co==='active'&&!G.flags.chicken){ const d=dist(chick.x,chick.y); if(d<18) consider(d,{type:'chicken',label:'Bắt gà đồi'}); }
  }
  return best; }
function interact(x){
  if(x.type==='npc') return talk(x.n);
  if(x.type==='pick'){ G.flags.picked[x.i]=true; addItem(x.p.item); sfx('item_pickup',.5); toast(`Nhặt được <b>${Wd.ITEMS[x.p.item].name}</b> · ${questProgress(x.p.quest)}`,'item'); save(); return; }
  if(x.type==='spot'){ G.flags.spots[x.s.id]=true; flash=1; sfx('item_pickup',.6); toast(`Đã chụp: <b>${x.s.name}</b> · ${questProgress('anh')}`,'item'); save(); return; }
  if(x.type==='beagle'){ say(Wd.DIALOG.beagle_found,()=>{ G.flags.beagleFollow=true; sfx('dog_bark',.6); toast('Beagle đang chạy theo Mén. Dẫn về Cổng cho Pháp.','quest'); save(); }); return; }
  if(x.type==='chicken'){ G.flags.chicken=true; addItem('chicken'); sfx('item_pickup',.5); toast(`Bắt được <b>Gà đồi</b> · ${questProgress('co')}`,'item'); save(); return; }
  const it=x.it;
  if(it.say){ say(it.say.map(t=>['me',t])); return; }
  if(it.id==='phone'){ if(G.flags.called){ say([['me','Pháp gọi rồi. Ra cửa thôi.']]); return; } if(ringing){ ringing.pause(); ringing=null; }
    say(Wd.DIALOG.call,()=>{ G.flags.called=true; toast('Nhiệm vụ: <b>Ra cửa, lên đường tới Ké Retreat</b>','quest'); renderHUD(); save(); }); return; }
  if(it.id==='door'){ if(!G.flags.called){ say([['me','Thứ Bảy mà, chưa có kèo đi đâu cả...'],['me','Hình như điện thoại đang rung kìa.']]); return; } sfx('door',.6); travel(); return; }
  if(it.id==='bonfire'){ say([['me',G.flags.fire?'Lửa cháy tí tách, ấm cả sân Nhà Rếch.':'Đống củi chưa đốt. Đôn Chề đang thiếu củi.']]); return; }
  if(it.id==='car_low'||it.id==='car_top'){ const up=it.id==='car_low';
    if(G.money<150000){ say([['me','Đi xe 4 bánh mất 150.000đ một lượt. Trong túi còn '+fmt(G.money)+' thôi.']]); return; }
    ask(up?'Đi xe 4 bánh lên khu trên? (150.000đ)':'Đi xe 4 bánh xuống Cổng? (150.000đ)','me',['Đi','Thôi đi bộ'],i=>{ if(i!==0) return; G.money-=150000; renderHUD(); sfx('car_4wd',.6);
      fade(()=>{ const d=up?S.map.carTop:S.map.carLow; P.x=d.x; P.y=d.y; if(G.flags.beagleFollow){ pet.x=P.x-14; pet.y=P.y; } },up?'Xe 4 bánh bò lên dốc...':'Xe 4 bánh đổ đèo xuống...'); save(); }); }
}

/* ---------- chuyển cảnh ---------- */
let ringing=null, ringTimer=0, travelling=false;
function fade(mid,text){ const f=$('#fade'); $('#fadeText').textContent=text||''; f.classList.add('on'); setTimeout(()=>{ mid&&mid(); setTimeout(()=>f.classList.remove('on'),350); },650); }
function enterRoom(){ G.scene='room'; buildScene('room'); P.x=S.map.spawn.x; P.y=S.map.spawn.y; P.face=1; music('music_room'); banner('Phòng của Mèn Mén');
  if(!G.flags.called) ringTimer=2.2; renderHUD(); }
function enterRetreat(fromTravel){ G.scene='retreat'; buildScene('retreat'); if(fromTravel||!G._pos){ P.x=S.map.spawn.x; P.y=S.map.spawn.y; } else { P.x=G._pos.x; P.y=G._pos.y; }
  P.face=-1; if(G.flags.beagleFollow){ pet.x=P.x-14; pet.y=P.y; } music('music_retreat'); banner('Chande Bootcamp · Ké Retreat'); if(fromTravel&&G.minutes<10*60+30) G.minutes=10*60+30; renderHUD(); save(); }
function travel(){ travelling=true; const tc=$('#travel'); tc.hidden=false; sfx('car_4wd',.5); let t0=performance.now();
  const c=$('#travelCv'), g=c.getContext('2d'), car=A.car().c;
  const anim=()=>{ const t=(performance.now()-t0)/1000; g.imageSmoothingEnabled=false; g.fillStyle='#f6d7a7'; g.fillRect(0,0,240,100);
    g.fillStyle='#9bb7a0'; for(let x=0;x<240;x++){ const h=40+18*Math.sin(x*.035)+8*Math.sin(x*.11); g.fillRect(x,100-h-20,1,h); }
    g.fillStyle='#5f8d62'; for(let x=0;x<240;x++){ const h=26+10*Math.sin(x*.06+2)+5*Math.sin(x*.17); g.fillRect(x,100-h-14,1,h); }
    g.fillStyle='#3b8ed3'; g.fillRect(0,86,240,14); g.fillStyle='#c2bcb0'; g.fillRect(0,80,240,6);
    g.drawImage(car,(t*70)%300-50,58+(Math.floor(t*8)%2));
    if(t<3.6) requestAnimationFrame(anim); else { tc.hidden=true; travelling=false; G.flags.arrived=true; enterRetreat(true); } };
  anim(); }

/* ---------- cập nhật ---------- */
function update(dt){
  if(G.scene==='retreat') G.minutes+=dt; if(G.minutes>=24*60) G.minutes-=24*60;
  if(ringTimer>0){ ringTimer-=dt; if(ringTimer<=0&&!G.flags.called){ ringing=sfx('phone_ring',.5); toast('Điện thoại đang reo... (đến bàn, bấm <kbd>E</kbd>)','quest'); } }
  if(ringing&&ringing.ended&&!G.flags.called){ ringing=null; ringTimer=4; }
  for(const f of fx){ f.t+=dt; } fx=fx.filter(f=>f.t<f.life); if(flash>0) flash=Math.max(0,flash-dt*3); if(soiT>0) soiT-=dt;
  if(DLG.open){ $('#prompt').hidden=true; updateDialog(dt); return; }
  if(hit('m')){ toggleMap(); return; }
  if(!$('#mapView').hidden){ if(hit('escape','m')) toggleMap(); return; }
  if(hit('escape')){ toggleMenu(); return; }
  if(!$('#menu').hidden) return;
  // hành động skill
  if(P.act){ P.actT+=dt; const dur={noi:2,quay:2.4,gong:1.6,hokage:4.4}[P.act]||1; if(P.actT>=dur){ if(P.act==='hokage') sfx('poof',.45); P.act=null; } }
  const sk=G.skills, useSkill=(k,fn)=>{ if(sk[k]) fn(); else toast(`Chưa mở khoá: <b>${Wd.SKILLS[k].name}</b>`,'lock'); };
  if(!P.act){
    if(hit('t')) useSkill('noi',()=>{ P.act='noi'; P.actT=0; P.view='side'; });
    if(hit('q')) useSkill('quay',()=>{ P.act='quay'; P.actT=0; });
    if(hit('r')) useSkill('gong',()=>{ P.act='gong'; P.actT=0; sfx('power_up',.5); });
    if(hit('k')) useSkill('hokage',()=>{ P.act='hokage'; P.actT=0; sfx('poof',.55); });
  }
  if(hit('v')) useSkill('soi',()=>{ soiT=6; toast('Đeo kính râm... soi xu 6 giây','skill'); });
  if(hit(' ')&&!P.act) useSkill('dash',()=>{ if(P.dashCD<=0){ P.dashT=.18; P.dashCD=.7; sfx('dash',.45); for(let k=0;k<6;k++) fx.push({kind:'dust',x:P.x,y:P.y,vx:(Math.random()-.5)*30,vy:-Math.random()*12,t:0,life:.4}); } });
  P.dashCD-=dt;
  // di chuyển
  let dx=(down('arrowright','d')?1:0)-(down('arrowleft','a')?1:0), dy=(down('arrowdown','s')?1:0)-(down('arrowup','w')?1:0);
  const busy=P.act==='quay'||P.act==='gong'||(P.act==='hokage'&&P.actT<1);
  if(busy){ dx=0; dy=0; }
  const running=down('shift')&&sk.run, sp=(P.dashT>0?250:running?118:70);
  P.dashT-=dt;
  if(P.dashT>0&&!dx&&!dy){ if(P.view==='down') dy=1; else if(P.view==='up') dy=-1; else dx=P.face; }
  const len=Math.hypot(dx,dy)||1; P.moving=!!(dx||dy);
  if(dx) P.face=Math.sign(dx);
  if(dx||dy) P.view=Math.abs(dy)>Math.abs(dx)?(dy>0?'down':'up'):'side';      // đi dọc → nhìn lên/xuống, đi ngang/chéo → nghiêng
  move(P,dx/len*sp*dt,dy/len*sp*dt);
  const base=P.act&&P.act!=='noi'?P.act:P.moving?(running?'run':'walk'):'idle';
  const name=!P.act&&P.view!=='side'&&SHEETS.menmen.anims[base+'_'+P.view]?base+'_'+P.view:base;
  if(P.anim!==name){ P.anim=name; P.t=0; } P.t+=dt;
  if(P.moving){ P.stepT-=dt; if(P.stepT<=0){ sfx(Math.random()<.5?'step1':'step2',.16); P.stepT=running?.24:.34; } }
  // tương tác
  const near=nearest(); $('#prompt').hidden=!near; if(near) $('#promptLabel').textContent=near.label;
  if(near&&hit('e','enter')) interact(near);
  if(S.name==='retreat'){
    // vùng địa điểm
    const tx=P.x/T, ty=P.y/T, z=S.map.zones.find(z=>tx>=z.x0&&tx<=z.x1+1&&ty>=z.y0&&ty<=z.y1+1);
    if(z&&z.name!==zoneName){ zoneName=z.name; banner(z.name); }
    // xu ẩn
    if(soiT>0) Wd.COINS.forEach(([x,y],i)=>{ if(G.flags.coins[i]) return; if(Math.hypot(x*T-P.x,y*T-P.y)<12){ G.flags.coins[i]=true; G.money+=20000; sfx('coin',.5); toast('<b>+20.000đ</b> nhặt được xu','vnd'); renderHUD(); save(); } });
    updatePet(dt); updateChicken(dt); updateNpcs(dt);
  }
  G._pos={x:P.x,y:P.y};
}
function updatePet(dt){
  let tx=null, ty=null; const ph=npcs.find(n=>n.id==='phap');
  if(G.flags.beagleFollow){ tx=P.x-P.face*18; ty=P.y+2; }
  else if(G.quests.beagle==='done'&&ph){ tx=ph.x+18; ty=ph.y+2; }
  let a='sit';
  if(tx!==null){ const dx=tx-pet.x, dy=ty-pet.y, d=Math.hypot(dx,dy);
    if(d>4){ const v=d>40?130:75, st=Math.min(d,v*dt); pet.x+=dx/d*st; pet.y+=dy/d*st; if(Math.abs(dx)>.5) pet.face=Math.sign(dx); a=d>40?'run':'walk'; pet.still=0; }
    else { pet.still+=dt; a=pet.still>2.5?'sit':'idle'; } }
  else a=G.quests.beagle==='active'?'idle':'sit';
  if(pet.anim!==a){ pet.anim=a; pet.t=0; } pet.t+=dt; }
function updateChicken(dt){ if(G.flags.chicken) return; chick.t+=dt; const H=Wd.CHICKEN_HOME;
  const dx=chick.tx-chick.x, dy=chick.ty-chick.y, d=Math.hypot(dx,dy);
  if(d<1){ chick.wait-=dt; if(chick.wait<=0){ chick.tx=(H.x+(Math.random()*2-1)*H.r)*T; chick.ty=(H.y+(Math.random()*2-1)*H.r*.6)*T; chick.wait=.6+Math.random()*1.5; } }
  else { const st=Math.min(d,22*dt); chick.x+=dx/d*st; chick.y+=dy/d*st; chick.face=Math.sign(dx)||chick.face; }
  if(Math.hypot(P.x-chick.x,P.y-chick.y)<22&&G.quests.co==='active'){ chick.tx=chick.x+(chick.x-P.x)*.8; chick.ty=chick.y+(chick.y-P.y)*.5; } }
function updateNpcs(dt){
  for(const n of npcs){ n.t+=dt; if(n.act){ n.actT+=dt; const sh=npcSheet(n), an=sh&&sh.anims[n.act]; const dur=an?an.frames.length/an.fps+(n.act==='hokage'?1.4:n.act==='quay'?1.6:.3):1;
      if(n.actT>=dur){ if(n.act==='saiyan'){ G.flags.phapForm='cam'; delete PORTRAIT.phap; save(); } n.act=null; } }
    if(!DLG.open) faceToward(n,Math.hypot(n.x-P.x,n.y-P.y)<52); } }
function faceToward(n,near=true){ if(!near){ n.view='down'; return; } const dx=P.x-n.x, dy=P.y-n.y;
  if(Math.abs(dy)>Math.abs(dx)*1.1) n.view=dy>0?'down':'up'; else { n.view='side'; n.face=dx<0?-1:1; } }
function npcSheet(n){ return n.id==='phap'&&G.flags.phapForm==='cam'?SHEETS.phap2:SHEETS[n.id]; }

/* ---------- vẽ ---------- */
let cam={x:0,y:0}, waterFrame=0, clock=0;
function draw(){
  const mw=S.W*T, mh=S.H*T;
  cam.x=mw<=VW?(mw-VW)/2:Math.max(0,Math.min(mw-VW,P.x-VW/2)); cam.y=mh<=VH?(mh-VH)/2:Math.max(0,Math.min(mh-VH,P.y-20-VH/2));
  const cx=Math.round(cam.x), cy=Math.round(cam.y);
  ctx.fillStyle=S.name==='room'?'#1c1516':'#3f7a31'; ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(S.ground[waterFrame],-cx,-cy);
  // các vật thể sắp theo chiều sâu
  const list=[];
  const inView=(x,y,m=80)=>x>cx-m&&x<cx+VW+m&&y>cy-40&&y<cy+VH+m+40;
  for(const o of S.objs){ if(!inView(o.x,o.y)) continue; list.push({y:o.sort??o.y,d:()=>{ let spr=o.spr;
      if(o.id==='bonfire') spr=A.bonfire(G.flags.fire,Math.floor(clock*6));
      if(o.id==='phone'&&!G.flags.called&&ringTimer<=0) spr=A.phone(true,Math.floor(clock*8));
      ctx.drawImage(spr.c,Math.round(o.x-spr.ax-cx),Math.round(o.y-spr.ay-cy)); }}); }
  if(S.name==='retreat'){
    Wd.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]!=='active'||G.flags.picked[i]) return; const x=p.x*T, y=p.y*T; list.push({y,d:()=>{ const c=pick(p.item); ctx.drawImage(c,Math.round(x-7-cx),Math.round(y-13-cy+Math.sin(clock*3+i)*1.5)); sparkle(x,y-14); }}); });
    if(G.quests.anh==='active') for(const s of Wd.SPOTS){ if(G.flags.spots[s.id]) continue; const x=s.x*T, y=s.y*T; list.push({y:y-8,d:()=>{ ctx.strokeStyle='#ffd84a'; ctx.globalAlpha=.6+.4*Math.sin(clock*4); ctx.beginPath(); ctx.ellipse(x-cx,y-cy,9,4,0,0,7); ctx.stroke(); ctx.globalAlpha=1; ctx.drawImage(pick('photo'),Math.round(x-7-cx),Math.round(y-22-cy)); }}); }
    if(soiT>0) Wd.COINS.forEach(([x,y],i)=>{ if(G.flags.coins[i]) return; list.push({y:y*T,d:()=>{ ctx.drawImage(pick('coin'),Math.round(x*T-7-cx),Math.round(y*T-13-cy-Math.abs(Math.sin(clock*5+i))*3)); }}); });
    if(!G.flags.chicken) list.push({y:chick.y,d:()=>drawFlip(A.chicken(Math.floor(chick.t*6)).c,chick.x,chick.y,6,10,chick.face<0)});
    list.push({y:pet.y,d:()=>{ shadow(pet.x,pet.y,7); const an=PETS.anims[pet.anim], f=an.frames[Math.floor(pet.t*an.fps)%an.frames.length]; drawFlip(f,pet.x,pet.y,12,17,pet.face<0);
      if(G.quests.beagle==='active'&&!G.flags.beagleFollow) marker(pet.x,pet.y-22,'?'); }});
    for(const n of npcs) list.push({y:n.y,d:()=>drawNpc(n)});
  }
  list.push({y:P.y,d:drawPlayer});
  list.sort((a,b)=>a.y-b.y); for(const it of list) it.d();
  if(S.name==='retreat') drawLights(cx,cy);
  for(const f of fx) drawFx(f,cx,cy);
  if(P.act==='noi'&&MEN.bubble){ const b=MEN.bubble, flip=P.face<0, X=Math.round(P.x-16-cx), Y=Math.round(P.y-48-cy); ctx.drawImage(b,flip?X+32-10-b.width:X+10,Y); }
  if(soiT>0){ ctx.fillStyle='rgba(20,30,50,.25)'; ctx.fillRect(0,0,VW,VH); }
  if(flash>0){ ctx.fillStyle=`rgba(255,255,255,${flash})`; ctx.fillRect(0,0,VW,VH); }
}
const PICK={}; function pick(k){ return PICK[k]||(PICK[k]=A.icon(Wd.ITEMS[k]?Wd.ITEMS[k].icon:k)); }
function shadow(x,y,r=8){ ctx.fillStyle='rgba(20,30,20,.28)'; ctx.beginPath(); ctx.ellipse(Math.round(x-cam.x),Math.round(y-cam.y),r,2.5,0,0,7); ctx.fill(); }
function drawFlip(c,x,y,ax,ay,flip){ const X=Math.round(x-ax-cam.x), Y=Math.round(y-ay-cam.y); if(!flip){ ctx.drawImage(c,X,Y); return; } ctx.save(); ctx.translate(X+c.width,Y); ctx.scale(-1,1); ctx.drawImage(c,0,0); ctx.restore(); }
function sparkle(x,y){ const k=Math.floor(clock*6)%4; ctx.fillStyle='#fff7d6'; const X=Math.round(x-cam.x+(k-2)*2), Y=Math.round(y-cam.y-k); ctx.fillRect(X,Y,1,1); }
function marker(x,y,ch){ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y+Math.sin(clock*4)*1.5);
  ctx.fillStyle='#1c1516'; ctx.fillRect(X-4,Y-8,9,10); ctx.fillStyle=ch==='?'?'#7de07a':'#ffd84a'; ctx.fillRect(X-3,Y-7,7,8);
  ctx.fillStyle='#1c1516'; if(ch==='!'){ ctx.fillRect(X,Y-6,1,4); ctx.fillRect(X,Y-1,1,1); } else { ctx.fillRect(X-1,Y-6,3,1); ctx.fillRect(X+1,Y-5,1,2); ctx.fillRect(X,Y-3,1,1); ctx.fillRect(X,Y-1,1,1); } }
function drawPlayer(){ shadow(P.x,P.y,8); const sh=SHEETS.menmen; let f;
  if(P.act==='noi'){ f=MEN.noi[Math.floor(P.actT*6)%MEN.noi.length]; }
  else if(P.act==='quay'){ f=MEN.quay[Math.floor(P.actT*8)%MEN.quay.length]; for(let k=0;k<2;k++) if(Math.random()<.04) fx.push({kind:'note',x:P.x+(Math.random()-.5)*24,y:P.y-40,t:0,life:1}); }
  else if(P.act==='gong'){ const n=MEN.gong.length, k=Math.floor(P.actT*8); f=MEN.gong[k<n-1?k:2+(k%2)]; }
  else if(P.act==='hokage'){ const n=MEN.hokage.length, k=Math.floor(P.actT*8); f=MEN.hokage[Math.min(n-1,k)]; if(P.actT>3.9) f=MEN.hokage[2]; }
  else { const an=sh.anims[P.anim]||sh.anims.idle; f=an.frames[Math.floor(P.t*an.fps)%an.frames.length]; }
  drawFlip(f,P.x,P.y,16,48,P.face<0&&(P.act||P.view==='side')); }
function drawNpc(n){ shadow(n.x,n.y,8); const sh=npcSheet(n); if(!sh) return; const v=!n.act&&n.view&&n.view!=='side'?'idle_'+n.view:null;
  let an=sh.anims[n.act||v||'idle']||sh.anims.idle, k=Math.floor((n.act?n.actT:n.t)*an.fps);
  const f=n.act&&!an.loop?an.frames[Math.min(an.frames.length-1,k)]:an.frames[k%an.frames.length]; drawFlip(f,n.x,n.y,16,48,n.face<0&&!v);
  const qid=Object.keys(Wd.QUESTS).find(q=>Wd.QUESTS[q].giver===n.id), st=G.quests[qid];
  if(n.id==='phap'&&!G.flags.hello) marker(n.x,n.y-44,'!');
  else if(!st) marker(n.x,n.y-44,'!'); else if(st==='active'&&canFinish(qid)) marker(n.x,n.y-44,'?'); }
function drawLights(cx,cy){ const on=G.minutes>17*60||G.minutes<6*60;
  for(const [[ax,ay],[bx,by]] of S.map.lights){ const x0=ax*T-cx, y0=ay*T-26-cy, x1=bx*T-cx, y1=by*T-26-cy, n=Math.ceil(Math.hypot(x1-x0,y1-y0)/5);
    ctx.fillStyle='rgba(40,30,20,.7)'; for(let i=0;i<=n*2;i++){ const t=i/(n*2); ctx.fillRect(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6),1,1); }
    for(let i=1;i<n;i++){ const t=i/n, x=Math.round(x0+(x1-x0)*t), y=Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6)+1;
      ctx.fillStyle=on||(i+Math.floor(clock*2))%3?'#ffd86b':'#c9a84a'; ctx.fillRect(x,y,1,2); if(on){ ctx.fillStyle='rgba(255,216,107,.18)'; ctx.fillRect(x-2,y-1,5,5); } } } }
function drawFx(f,cx,cy){ const k=f.t/f.life;
  if(f.kind==='dust'){ ctx.fillStyle=`rgba(230,220,200,${1-k})`; ctx.fillRect(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),2,2); }
  if(f.kind==='note'){ ctx.fillStyle=`rgba(255,216,74,${1-k})`; const x=Math.round(f.x-cx+Math.sin(f.t*6)*3), y=Math.round(f.y-cy-f.t*16); ctx.fillRect(x,y,2,2); ctx.fillRect(x+1,y-4,1,4); ctx.fillRect(x+1,y-4,2,1); } }

/* ---------- HUD ---------- */
function renderHUD(){
  const h=Math.floor(G.minutes/60)%24, m=Math.floor(G.minutes%60);
  $('#hudTime').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  $('#hudMoney').textContent=fmt(G.money);
  const lo=LEVELS[G.level-1]||0, hi=LEVELS[G.level]||lo+1; $('#hudLevel').textContent='Cấp '+G.level;
  $('#hudExp').style.width=Math.min(100,(G.exp-lo)/(hi-lo)*100)+'%'; $('#hudExpTxt').textContent=`${G.exp}/${hi} EXP`;
  // nhiệm vụ đang làm
  const act=Object.keys(Wd.QUESTS).filter(q=>G.quests[q]==='active');
  let html='';
  if(G.scene==='room') html=G.flags.called?`<li><b>Lên đường tới Ké Retreat</b><span>Ra cửa phòng</span></li>`:`<li><b>Sáng thứ Bảy</b><span>${ringTimer>0?'Ngủ thêm tí...':'Nghe điện thoại trên bàn'}</span></li>`;
  else if(!G.flags.hello) html='<li><b>Tìm Pháp</b><span>Pháp đang đợi ở Cổng</span></li>';
  for(const q of act) html+=`<li class="${canFinish(q)?'ready':''}"><b>${Wd.QUESTS[q].title}</b><span>${canFinish(q)?'Quay lại gặp '+Wd.CHARS[Wd.QUESTS[q].giver].name:questProgress(q)}</span></li>`;
  const done=Object.keys(Wd.QUESTS).filter(q=>G.quests[q]==='done').length;
  $('#hudQuests').innerHTML=`<h4>Nhiệm vụ <small>${done}/6</small></h4><ul>${html||'<li><span>Đi dạo và nói chuyện với mọi người</span></li>'}</ul>`;
  // túi đồ
  const inv=Object.entries(G.items); $('#hudItems').innerHTML=[...Array(8)].map((_,i)=>{ const it=inv[i]; if(!it) return '<div class="slot"></div>';
    return `<div class="slot" title="${Wd.ITEMS[it[0]].name}"><img src="${icon64(it[0])}" alt="${Wd.ITEMS[it[0]].name}">${it[1]>1?`<i>${it[1]}</i>`:''}</div>`; }).join('');
  $('#hudSkills').innerHTML=Object.entries(Wd.SKILLS).map(([k,s])=>`<div class="sk${G.skills[k]?'':' locked'}" title="${s.name}: ${s.desc}"><kbd>${s.key}</kbd><span>${G.skills[k]?s.name:'???'}</span></div>`).join('');
}
const ICO={}; function icon64(k){ return ICO[k]||(ICO[k]=A.icon(Wd.ITEMS[k].icon,3).toDataURL()); }

/* ---------- minimap góc phải dưới ---------- */
const MINI_COL={G:'#79b34a',F:'#3f7a31',P:'#d6c39b',T:'#d6c39b',S:'#cbc6ba',R:'#b9b3a7',D:'#e3d2a2',W:'#3b8ed3',K:'#a26c40',L:'#43c5e3',E:'#e6e0d2',X:'#8d8880',C:'#c9a877',Q:'#a26c40',B:'#b0643c'};
let miniBase=null;
function buildMini(){ const m=S.map, c=A.cv(S.W,S.H), g=c.getContext('2d');
  for(let y=0;y<S.H;y++) for(let x=0;x<S.W;x++){ g.fillStyle=MINI_COL[m.grid[y][x]]||'#3f7a31'; g.fillRect(x,y,1,1); } miniBase=c; }
function drawMini(){ const box=$('#minimap'); if(!S||S.name!=='retreat'){ box.hidden=true; return; } box.hidden=false; if(!miniBase) buildMini();
  const c=$('#miniCv'), g=c.getContext('2d'), TW=40, TH=28, k=c.width/TW;
  const sx=Math.max(0,Math.min(S.W-TW,P.x/T-TW/2)), sy=Math.max(0,Math.min(S.H-TH,P.y/T-TH/2));
  g.imageSmoothingEnabled=false; g.drawImage(miniBase,sx,sy,TW,TH,0,0,c.width,c.height);
  const dot=(x,y,col,r=2)=>{ const X=(x/T-sx)*k, Y=(y/T-sy)*k; if(X<-3||Y<-3||X>c.width+3||Y>c.height+3) return; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=col; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2); };
  for(const n of npcs){ const qid=Object.keys(Wd.QUESTS).find(q=>Wd.QUESTS[q].giver===n.id), st=G.quests[qid], ready=st==='active'&&canFinish(qid);
    dot(n.x,n.y,ready?'#7de07a':st==='done'?'#9aa0a8':'#ffd84a'); }
  Wd.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]==='active'&&!G.flags.picked[i]) dot(p.x*T,p.y*T,'#7fe0ff',1); });
  if(G.quests.anh==='active') for(const s of Wd.SPOTS) if(!G.flags.spots[s.id]) dot(s.x*T,s.y*T,'#ff9fb2',1);
  if(G.quests.beagle==='active'&&!G.flags.beagleFollow) dot(pet.x,pet.y,'#e0aa66',2);
  if(Math.floor(clock*3)%3) dot(P.x,P.y,'#ff4a3d',2);
  $('#miniZone').textContent=zoneName||'Ké Retreat'; }
$('#minimap').addEventListener('click',()=>toggleMap());

/* ---------- bản đồ (M) ---------- */
function toggleMap(){ const v=$('#mapView'); if(S.name!=='retreat'){ toast('Bản đồ chỉ có ở Ké Retreat','lock'); return; } v.hidden=!v.hidden; if(!v.hidden) drawMap(); }
function drawMap(){ const c=$('#mapCv'), g=c.getContext('2d'), m=S.map, sx=17*T, sy=22*T, sw=42*T, sh=88*T, k=Math.min((innerHeight*.82)/sh,(innerWidth*.6)/sw);
  c.width=Math.round(sw*k); c.height=Math.round(sh*k); g.imageSmoothingEnabled=false; g.drawImage(S.ground[0],sx,sy,sw,sh,0,0,c.width,c.height);
  g.fillStyle='rgba(30,60,30,.35)'; g.fillRect(0,0,c.width,c.height);
  for(const o of S.objs) if(o.house||o.name){ const s=o.spr; g.drawImage(s.c,(o.x-s.ax-sx)*k,(o.y-s.ay-sy)*k,s.c.width*k,s.c.height*k); }
  g.font=`${Math.max(11,Math.round(13*k*2.4))}px VT323, monospace`; g.textAlign='center';
  for(const l of m.labels){ const x=(l.x*T-sx)*k, y=(l.y*T-sy)*k-4; g.fillStyle='rgba(28,21,22,.75)'; const w=g.measureText(l.name).width+8; g.fillRect(x-w/2,y-12,w,15); g.fillStyle='#fff3d6'; g.fillText(l.name,x,y); }
  const dot=(x,y,col,r=4)=>{ g.fillStyle='#1c1516'; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r+1.5,0,7); g.fill(); g.fillStyle=col; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r,0,7); g.fill(); };
  for(const n of npcs){ const qid=Object.keys(Wd.QUESTS).find(q=>Wd.QUESTS[q].giver===n.id); dot(n.x,n.y,G.quests[qid]==='done'?'#9aa0a8':'#ffd84a'); }
  Wd.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]==='active'&&!G.flags.picked[i]) dot(p.x*T,p.y*T,'#7fe0ff',3); });
  if(G.quests.anh==='active') for(const s of Wd.SPOTS) if(!G.flags.spots[s.id]) dot(s.x*T,s.y*T,'#ff9fb2',3);
  if(G.quests.beagle==='active'&&!G.flags.beagleFollow) dot(pet.x,pet.y,'#e0aa66',3);
  dot(P.x,P.y,'#ff4a3d',5);
  $('#mapLegend').innerHTML='<span><i style="background:#ff4a3d"></i>Mèn Mén</span><span><i style="background:#ffd84a"></i>Người nhờ việc</span><span><i style="background:#7fe0ff"></i>Đồ cần nhặt</span><span><i style="background:#ff9fb2"></i>Điểm chụp ảnh</span>'; }

/* ---------- menu / kết thúc ---------- */
function toggleMenu(){ const m=$('#menu'); m.hidden=!m.hidden; }
$('#btnResume').onclick=()=>toggleMenu();
$('#btnSound').onclick=()=>setMute(!AUD.muted);
$('#btnRestart').onclick=()=>{ $('#confirm').hidden=false; };
$('#btnRestartNo').onclick=()=>{ $('#confirm').hidden=true; };
$('#btnRestartYes').onclick=()=>{ try{ localStorage.removeItem('chande-save'); }catch(e){} location.reload(); };
function showEnd(){ const e=$('#endcard'); e.hidden=false;
  $('#endStats').innerHTML=`<li>Cấp <b>${G.level}</b> · ${G.exp} EXP</li><li>Tiền: <b>${fmt(G.money)}</b></li><li>Skill: ${Object.keys(G.skills).map(k=>Wd.SKILLS[k].name).join(', ')}</li><li>Đồ: ${Object.keys(G.items).map(k=>Wd.ITEMS[k].name).join(', ')}</li>`; sfx('level_up',.5); }
$('#btnEndClose').onclick=()=>{ $('#endcard').hidden=true; };

/* ---------- vòng lặp ---------- */
let last=0, started=false, hudT=0;
function frame(t){ requestAnimationFrame(frame); const dt=Math.min(.05,(t-last)/1000||0); last=t; clock+=dt;
  if(!started||!S||travelling){ pressed.clear(); return; }
  waterFrame=Math.floor(clock*2)%2;
  update(dt); draw(); drawMini(); pressed.clear(); hudT-=dt; if(hudT<=0){ renderHUD(); hudT=.5; } }
async function boot(){
  $('#loading').textContent='Đang tải nhân vật...';
  await loadAudio(); setMute(AUD.muted);
  const jobs=Object.entries(Wd.CHARS).map(async([id,c])=>{ SHEETS[id]=await loadSheet(c.sheet); if(c.sheet2) SHEETS.phap2=await loadSheet(c.sheet2); });
  jobs.push((async()=>{ PETS=await loadSheet('phap/beagle'); })());
  try{ await Promise.all(jobs); }catch(e){ $('#loading').textContent='Không tải được sprite nhân vật. Mở game qua server (xem README).'; console.error(e); return; }
  MEN=buildMenSkills();
  const sv=loadSave(); $('#btnContinue').hidden=!sv; $('#loading').hidden=true; $('#titleBtns').hidden=false;
  const start=fresh=>{ $('#title').hidden=true; started=true; if(!fresh&&sv) G=sv; else G=JSON.parse(JSON.stringify(NEW));
    setMute(AUD.muted); if(G.scene==='retreat') enterRetreat(false); else enterRoom(); };
  $('#btnNew').onclick=()=>start(true); $('#btnContinue').onclick=()=>start(false);
  requestAnimationFrame(frame);
}
// hook kiểm thử: chạy mô phỏng theo bước (khi tab bị ẩn, rAF bị hãm)
window.CHANDE={get G(){return G;},get P(){return P;},get S(){return S;},get DLG(){return DLG;},get pet(){return pet;},get chick(){return chick;},get npcs(){return npcs;},reward,startQuest,finishQuest,enterRetreat,enterRoom,nearest,interact,
  step(sec,hold=[],tap=[]){ for(const k of hold) keys.add(k); let first=true; for(let t=0;t<sec;t+=1/60){ if(first) for(const k of tap) pressed.add(k); first=false; clock+=1/60; update(1/60); pressed.clear(); }
    for(const k of hold) keys.delete(k); draw(); renderHUD(); },
  get started(){return started;}};
boot();
})();
