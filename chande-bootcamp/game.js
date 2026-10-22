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
/* ---------- âm thanh tổng hợp WebAudio (không cần file): máy xe, rú ga bốc đầu, xoè xe, còi CSGT ---------- */
const SYN={ctx:null,eng:null,sir:null};
function synCtx(){ if(!SYN.ctx){ try{ SYN.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(SYN.ctx.state==='suspended') SYN.ctx.resume().catch(()=>{}); return SYN.ctx; }
function engineSet(rpm,vol){ const c=synCtx(); if(!c) return; if(!SYN.eng){ const o=c.createOscillator(), o2=c.createOscillator(), f=c.createBiquadFilter(), g=c.createGain();
    o.type='sawtooth'; o2.type='square'; f.type='lowpass'; g.gain.value=0; o.connect(f); o2.connect(f); f.connect(g); g.connect(c.destination); o.start(); o2.start(); SYN.eng={o,o2,f,g}; }
  const e=SYN.eng, t=c.currentTime; e.o.frequency.setTargetAtTime(rpm,t,.08); e.o2.frequency.setTargetAtTime(rpm*2.02,t,.08); e.f.frequency.setTargetAtTime(260+rpm*7,t,.1); e.g.gain.setTargetAtTime(vol,t,.12); }
function engineOff(){ const e=SYN.eng; if(!e) return; SYN.eng=null; e.g.gain.setTargetAtTime(0,SYN.ctx.currentTime,.08); setTimeout(()=>{ try{ e.o.stop(); e.o2.stop(); }catch(x){} },500); }
function tone(type,f0,f1,dur,vol,lp=2000){ const c=synCtx(); if(!c||AUD.muted) return; const o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter(), t=c.currentTime; o.type=type; f.type='lowpass'; f.frequency.value=lp;
  o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur*.45); o.frequency.exponentialRampToValueAtTime(Math.max(30,f1*.55),t+dur);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.06); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(f); f.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+.05); }
const revSnd=()=>tone('sawtooth',60,280,1.2,.2,1500);
// biến hình: tiếng mô-tơ rít lên xuống + loạt tiếng khớp kim loại lách cách
function clank(f,vol,at){ const c=synCtx(); if(!c||AUD.muted) return; const n=c.sampleRate*.09, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=c.createBufferSource(), bp=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=6; g.gain.value=vol; s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(c.currentTime+at); }
function transformSnd(){ if(AUD.muted) return; tone('sawtooth',180,980,.7,.12,3000); setTimeout(()=>tone('square',900,260,.6,.08,2200),420);
  [[0,1800],[.12,1200],[.22,2600],[.36,900],[.5,2100],[.62,1500],[.78,3000],[.9,1100],[1.05,2400]].forEach(([at,f],i)=>clank(f,.5+(i%3)*.15,at)); }
function sayLine(text){ try{ if(AUD.muted||!window.speechSynthesis) return; const u=new SpeechSynthesisUtterance(text), vs=speechSynthesis.getVoices(), v=vs.find(v=>/en-(US|GB)/i.test(v.lang)&&/male|daniel|fred|alex|google uk english male/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang));
  if(v) u.voice=v; u.lang=v?v.lang:'en-US'; u.pitch=.1; u.rate=.82; u.volume=1; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }                                                    // rú ga bốc đầu
function crashSnd(){ const c=synCtx(); if(!c||AUD.muted) return; const n=c.sampleRate*.6, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
  const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; f.type='lowpass'; f.frequency.value=900; g.gain.value=.35; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); tone('square',180,60,.5,.12,600); }
function whistleSnd(){ for(const [d,len] of [[0,.18],[.26,.5]]) setTimeout(()=>tone('sine',2900,3100,len,.12,6000),d*1000); }       // tuýt tuýt
function sirenSet(vol){ const c=synCtx(); if(!c) return; if(!SYN.sir){ if(vol<=.001) return; const o=c.createOscillator(), l=c.createOscillator(), lg=c.createGain(), f=c.createBiquadFilter(), g=c.createGain();
    o.type='square'; o.frequency.value=700; l.type='square'; l.frequency.value=1.4; lg.gain.value=170; l.connect(lg); lg.connect(o.frequency); f.type='lowpass'; f.frequency.value=1600; g.gain.value=0; o.connect(f); f.connect(g); g.connect(c.destination); o.start(); l.start(); SYN.sir={o,l,g}; }
  SYN.sir.g.gain.setTargetAtTime(vol,c.currentTime,.25); }
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
  if(kind==='das') return Wd.buildDas();
  if(kind==='everfit') return Wd.buildOffice(); if(kind==='dalat') return Wd.buildDalat(); if(kind==='track') return Wd.buildTrack(); if(kind==='deo') return Wd.buildDeo(); return Wd.buildInterior(kind); }
function prep(m,kind){ const W=m.W, H=m.H, solid=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!A.WALKABLE.has(m.grid[y][x])) solid[y*W+x]=1;
  for(const [x0,y0,x1,y1] of m.solid) for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(x>=0&&y>=0&&x<W&&y<H) solid[y*W+x]=1;
  const edge=kind==='room'||m.indoor?'H':'F';
  const objs=m.obj.filter(o=>!o.flat&&!o.over).sort((a,b)=>(a.sort??a.y)-(b.sort??b.y)), CS=CHUNK*T, ob=new Map();
  for(const o of objs){ const k=Math.floor(o.x/CS)+'_'+Math.floor(o.y/CS); if(!ob.has(k)) ob.set(k,[]); ob.get(k).push(o); }   // đồ vật chia theo khối để map to chỉ duyệt khối gần
  return {map:m,W,H,solid,ground:makeGround(m,edge),objs,objB:ob,over:m.obj.filter(o=>o.over)}; }
// nền map vẽ theo khối 32×32 ô khi khối lọt vào màn hình (giữ tối đa ~40 khối): map to cỡ 340×240 ô không tốn RAM, vào map nhanh
const CHUNK=32;
function makeGround(m,edge){ const W=m.W, H=m.H, CS=CHUNK*T, NI=Math.ceil(W/CHUNK), NJ=Math.ceil(H/CHUNK), cache=new Map(), flats=m.obj.filter(o=>o.flat);
  const nb=(x,y)=>(dx,dy)=>{ const yy=y+dy, xx=x+dx; return yy>=0&&yy<H&&xx>=0&&xx<W?m.grid[yy][xx]:edge; };
  const chunk=(i,j,fr)=>{ const key=i+'_'+j+'_'+fr; let c=cache.get(key); if(c){ cache.delete(key); cache.set(key,c); return c; }
    c=A.cv(CS,CS); const g=c.getContext('2d'); g.translate(-i*CS,-j*CS);
    for(let y=j*CHUNK;y<Math.min(H,(j+1)*CHUNK);y++) for(let x=i*CHUNK;x<Math.min(W,(i+1)*CHUNK);x++) A.drawTile(g,m.grid[y][x],x,y,nb(x,y),fr);
    for(const o of flats){ const x0=o.x-o.spr.ax, y0=o.y-o.spr.ay; if(x0>=(i+1)*CS||y0>=(j+1)*CS||x0+o.spr.c.width<=i*CS||y0+o.spr.c.height<=j*CS) continue; g.drawImage(o.spr.c,x0,y0); }
    cache.set(key,c); while(cache.size>40) cache.delete(cache.keys().next().value); return c; };
  const range=(cx,cy,vw,vh,pad=0)=>[Math.max(0,Math.floor(cx/CS)-pad),Math.min(NI-1,Math.floor((cx+vw)/CS)+pad),Math.max(0,Math.floor(cy/CS)-pad),Math.min(NJ-1,Math.floor((cy+vh)/CS)+pad)];
  return {chunk,range,
    draw(ctx,cx,cy,vw,vh,fr){ const [i0,i1,j0,j1]=range(cx,cy,vw,vh); for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) ctx.drawImage(chunk(i,j,fr),i*CS-cx,j*CS-cy);
      // vẽ trước 1 khối kế bên mỗi khung hình cho khỏi giật khi đi sang khối mới
      const [a0,a1,b0,b1]=range(cx,cy,vw,vh,1); for(let j=b0;j<=b1;j++) for(let i=a0;i<=a1;i++) if(!cache.has(i+'_'+j+'_'+fr)){ chunk(i,j,fr); return; } }}; }
function sceneData(kind,room){ const key=kind==='stay'?'stay:'+room:kind; return MAPS[key]||(MAPS[key]=prep(buildMap(kind,room),kind)); }
function officeOpen(){ const t=vn(), wd=!SD.isWeekend(t.day); if(wd&&t.hf>=SD.JOB.hours[0]&&t.hf<SD.JOB.hours[1]) return true;
  const j=G&&G.extra&&G.extra.job; return !!(j&&j.hired&&j.today&&j.today.ot&&!j.today.otDone&&t.hf>=SD.JOB.ot.from&&t.hf<SD.JOB.ot.to); }
function sceneNpcs(kind){ const open=kind==='everfit'?officeOpen():true; if(S) S.closed=!open;
  return SD.NPCS.filter(n=>(n.scene||'retreat')===kind&&(kind!=='everfit'||!!n.closed===!open)).map(n=>({...n,x:n.x*T,y:n.y*T,view:'down',face:1,t:Math.random()*2,act:null,actT:0,av:STORY[n.id]?null:AVATAR.build(SD.NPC_LOOKS[n.id].look)})); }
let CSGT_POST=null, CSGT_STOP=null, IMPOUNDS=[], CRASHES=[], OPT_ON=0, MEGA=null, ramAt=0; const OPT_FORM={}, MGS={}; const megaSpr=(v,f)=>MGS[v+f]||(MGS[v+f]=A.megatron(v,f)); const OPTS={}; const optSpr=(k,v,f)=>OPTS[k+v+f]||(OPTS[k+v+f]=k==='truck'?A.optimusTruck(v,f):A.optimus(v,f));
const isKaixa=()=>G&&String(G.name||'').toLowerCase()===SD.OPTIMUS.owner; const CSGT_AV={};
let PCAR=null, STAYS={}, STUNT=null, DANCE=null, danceAudio=null, LANDS=[], HERDS=[], DOGLIST=[], ANITAGS=[];
function enterScene(m){ const d=sceneData(m.s,m.room);
  S={kind:m.s,id:m.id,room:m.room,host:m.host,hostPid:m.hostPid,own:m.own,...d}; miniBase=null;
  P.x=m.x; P.y=m.y; P.kayak=false; P.riding=false; P.moto=null; P.pcar=false; P.incar=false; P.act=null; TASK=null; FISH=null; REM.clear(); SOCS.clear(); fx=[]; zoneName='';
  npcs=sceneNpcs(m.s); STUNT=m.stunt?{...m.stunt,res:{},wheelieT:0,fallT:0,last:'',cues:m.stunt.cues||[]}:null; if(STUNT&&STUNT.pick) setTimeout(()=>UI.garage(),400); if(m.s!=='phongbay'){ DANCE=null; stopDance(); } if(m.s!=='track') document.body.classList.remove('racing');
  if(m.s==='retreat'){ pet.x=SD.BEAGLE_SPOT.x*T; pet.y=SD.BEAGLE_SPOT.y*T; { const ph=npcs.find(n=>n.id==='phap'); if(ph){ pet.x=ph.x+18; pet.y=ph.y+2; } }
    if(G.flags.beagleFollow){ pet.x=P.x-14; pet.y=P.y; } chick.x=chick.tx=SD.CHICKEN_HOME.x*T; chick.y=chick.ty=SD.CHICKEN_HOME.y*T; }
  for(const k of Object.keys(PLOTS)) if((k[0]==='k')!==(m.s==='retreat')||(k[0]==='d')!==(m.s==='dalat')) delete PLOTS[k];
  music(S.map.music||'music_retreat');
  banner(m.s==='stay'?(m.own?'Phòng của bạn · ':'Phòng của '+m.host+' · ')+S.map.name:S.map.name);
  if(m.s==='room'&&!G.flags.called) ringTimer=2.2;
  if(m.ride) travelAnim(m.ride);
  AUTO=null; if(ROUTE) setTimeout(runRoute,500); if(homeAfterExit&&m.s==='retreat'){ homeAfterExit=false; setTimeout(goHome,300); } else homeAfterExit=false;
  UI.closeAll&&UI.closeAll(); renderHUD(); }

/* ---------- va chạm ---------- */
function solidAt(px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); if(tx<0||ty<0||tx>=S.W||ty>=S.H) return true;
  if(P.kayak){ const t=S.map.grid[ty][tx]; return !(t==='W'||t==='Q'); } return S.solid[ty*S.W+tx]===1; }
function blocked(x,y){ const hw=5, h=4;
  if(S.kind==='everfit'&&S.closed&&(x>6.9*T||y<15*T)) return true;            // ngoài giờ: chỉ đứng ở sảnh thang máy
  if(solidAt(x-hw,y-h)||solidAt(x+hw,y-h)||solidAt(x-hw,y)||solidAt(x+hw,y)) return true;
  if(S.kind==='retreat'){ const K=SD.PARK, tx=x/T, ty=y/T; if(tx>K.x0&&tx<K.x1&&ty>K.y0&&ty<K.y1&&!(G.park&&G.park.day===vn().day)){ if(!blocked.warn||performance.now()-blocked.warn>3000){ blocked.warn=performance.now(); toast('Mua vé tham quan ở cổng vườn quốc gia (chú kiểm lâm) mới vào được','lock'); } return true; } }
  for(const n of npcs) if(!n.pass&&Math.hypot(n.x-x,(n.y-y)*1.6)<9) return true; return false; }   // pass: NPC đứng chỗ đông người (sinh viên, bot nhảy, Pháp) không chặn đường
function move(o,dx,dy){ if(blocked(o.x,o.y)){ o.x+=dx; o.y+=dy; return; }   // đang kẹt trong vật cản: cho bước ra
  if(dx&&!blocked(o.x+dx,o.y)) o.x+=dx; if(dy&&!blocked(o.x,o.y+dy)) o.y+=dy; }
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
  if(q.spots) return `Đã chụp ${q.spots.filter(s=>G.flags.spots[s]).length}/${q.spots.length}`;
  if(q.eat) return `Đã ăn ${Math.min(q.eat.n,(G.qprog||{})[id]||0)}/${q.eat.n}`; if(q.dance) return `Tốt nhất ${(G.qprog||{})[id]||0}/${q.dance} PERFECT`;
  if(q.butterflies) return `Đã bắt ${buomKinds()}/${q.butterflies} loài bướm`; if(q.lo) return 'Về phòng, mở điện thoại (Esc → Điện thoại)'; return ''; }
const buomKinds=()=>Object.keys(SD.BUTTERFLY.kinds).filter(k=>(G.items['buom_'+k]||0)>0).length;
function canFinish(id){ const q=Q[id]; if(id==='beagle') return G.flags.beagleFollow&&Math.hypot(pet.x-P.x,pet.y-P.y)<70;
  if(q.need) return Object.entries(q.need).every(([k,n])=>(G.items[k]||0)>=n); if(q.spots) return q.spots.every(s=>G.flags.spots[s]);
  if(q.eat) return ((G.qprog||{})[id]||0)>=q.eat.n; if(q.dance) return ((G.qprog||{})[id]||0)>=q.dance;
  if(q.butterflies) return buomKinds()>=q.butterflies; if(q.lo) return ((G.qprog||{})[id]||0)>=q.lo; return false; }
async function startQuest(id){ const r=await act({t:'quest',id,op:'start'}); if(!r.err){ sfx('quest_accept',.5); toast(`Nhận nhiệm vụ: <b>${Q[id].title}</b>`,'quest'); } }
async function finishQuest(id,after){ const r=await act({t:'quest',id,op:'finish'}); if(!r.err){ sfx('quest_complete',.6); after&&after(); } }
function talk(n){ faceToward(n); const id=n.id, D=Wd.DIALOG;
  if(!STORY[id]) return UI.place(n.place,n);
  if(id==='phap'){   // Pháp: chào lần đầu rồi giao việc bắt bướm, sau đó việc "giải toả"
    if(!G.flags.hello){ NET.send({t:'hello'}); say(D.phap_hello); return; }
    if(Object.keys(Q).every(q=>G.quests[q]==='done')){ say(D.finale); return; } }
  const qs=Object.keys(Q).filter(k=>Q[k].giver===id), first=id==='phap'?null:qs[0];
  if(id==='donche'&&G.quests[first]==='done') return UI.donche(n);
  const qid=qs.find(k=>G.quests[k]!=='done'&&(!Q[k].after||G.quests[Q[k].after]==='done'))||qs[qs.length-1], st=G.quests[qid];
  if(qid!==first){ const q=Q[qid];   // việc thứ 2 trở đi: hội thoại chung theo mô tả nhiệm vụ
    if(!st) return say([[id,q.desc]],()=>ask(`Nhận "${q.title}"?`,id,['Nhận nhiệm vụ','Để sau'],i=>{ if(i===0) startQuest(qid); }));
    if(st==='active') return canFinish(qid)?say([[id,'Đỉnh! Thưởng nóng cho mày đây.']],()=>finishQuest(qid,()=>{ if(id==='khabanh'){ n.act='quay'; n.actT=0; } })):say([[id,'Mới tới đâu rồi? '+questProgress(qid)]]);
    return say(D[id+'_after']); }
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
  for(const n of npcs){ const d=dist(n.x,n.y); if(d<(STORY[n.id]?28:46)) consider(d*.5,{type:'npc',n,label:STORY[n.id]?'Nói chuyện':speakerName(n.id).split(' (')[0]}); }
  for(const r of REM.values()){ const d=dist(r.x,r.y); if(d<24&&r.name) consider(d*.6,{type:'player',r,label:'Tương tác với '+r.name}); }
  for(const it of S.map.inter){ const d=dist(it.x,it.y); if(d<it.r) consider(d,{type:'obj',it,label:it.label}); }
  for(const o of S.map.obj||[]) if(o.grab){ const d=dist(o.x,o.y+4); if(d<30) consider(d+1,{type:'grab',label:'Gọi Grab (G) · đi map khác / về phòng'}); }   // đứng gần biển Grab
  if(k==='retreat'){
    for(const [key,pc] of Object.entries(SD.PLACES)) if(pc.door&&(pc.map||'retreat')===S.kind){ const d=dist(pc.door.x*T,pc.door.y*T); if(d<26) consider(d,pc.scene?{type:'enter',place:key,label:'Vào '+pc.name}:{type:'place',place:key,label:pc.name}); }
    SD.PARK.spots.forEach((sp,i)=>{ const d=dist(sp.x*T,sp.y*T); if(d<30) consider(d,{type:'parkspot',i,label:'Quan sát: '+sp.name}); });
    if(P.pcar) return {type:'pcarpark',label:'Đỗ xe xuống'}; if(P.incar) return {type:'pcarleave',label:'Xuống xe'};
    if(PCAR&&PCAR.driving&&PCAR.driving!==NET.pid){ const dr=REM.get(PCAR.driving); if(dr&&dist(dr.x,dr.y)<60) consider(1,{type:'pcarride',label:'Lên xe Chika Phú (ghế phụ)'}); }
    for(const st of SD.BIKESHARE.stations) if(st.map===S.kind){ const d=dist(st.x*T,st.y*T); if(d<40) consider(d,{type:'bikeshare',label:`Thuê xe đạp công cộng · ${fmt(SD.MOTO.models.xedap.price)}/${SD.BIKESHARE.min} phút`}); }
    if(S.kind==='retreat'&&P.opt==='robot'&&CSGT_POST){ const c=CSGT_POST, tx=(c.kind==='chot'?c.x+2.1:c.x)*T, ty=(c.kind==='chot'?c.y-1.4:c.y)*T, d=dist(tx,ty);
      if(!c.wreck&&d<64) consider(d-4,{type:'riot',op:'smash',label:'Đập xe CSGT 💥'}); if(c.kind==='chot'&&!c.ko){ const d2=dist(c.x*T,c.y*T); if(d2<48) consider(d2-6,{type:'riot',op:'punch',label:'Đánh CSGT 👊 (có thể bị bắt)'}); } }
    if(S.kind==='retreat'){ const d=dist(SD.OPTIMUS.park.x*T,SD.OPTIMUS.park.y*T); if(d<72&&(!OPT_ON||P.opt)) consider(d-8,{type:'optimus',label:!isKaixa()?'Xe tải Optimus Prime (của Kaixa)':P.opt?'Cất xe, thôi biến hình':'Biến hình Optimus Prime'}); }
    if(PCAR&&!PCAR.driving){ const d=dist(PCAR.x*T,PCAR.y*T); if(d<56) consider(d-6,{type:'pcar',label:G.name.toLowerCase()===SD.PCAR.owner?'Lái xe của bạn':'Xe riêng của Chika Phú'}); }
    for(const [rk,r] of Object.entries(SD.ROOMS)) if(r.doors) for(const [x,y] of r.doors){ const d=dist(x*T,y*T); if(d<24) consider(d,{type:'roomDoor',room:rk,label:G.stay&&G.stay.room===rk?'Vào phòng của bạn':'Gõ cửa '+r.name}); }
    { const d=dist(SD.BATHHOUSE.x*T,SD.BATHHOUSE.y*T); if(d<26) consider(d,{type:'bath',label:'Tắm ở nhà tắm chung'}); }
    { const Pq=SD.POOL, cx=Math.max(Pq.x0,Math.min(Pq.x1+1,P.x/T)), cy=Math.max(Pq.y0,Math.min(Pq.y1+1,P.y/T)), d=Math.hypot(P.x/T-cx,P.y/T-cy)*T; if(tileAt(P.x,P.y)==='L') consider(4,{type:'pool',label:'Bể bơi'}); else if(d<26) consider(d+4,{type:'swim',label:'Xuống bể bơi (+sạch sẽ, +năng lượng)'}); }
    { const ke=G.extra&&G.extra.ke; if(ke&&ke.staff&&ke.today) for(const tk of ke.today.tasks){ if(ke.today.done.includes(tk)) continue; const D=SD.KE_JOB.tasks[tk], d=dist(D.x*T,D.y*T); if(d<30) consider(d-3,{type:'kejob',task:tk,label:'Việc nhân viên: '+D.name}); } }
    { const Y=SD.KE_YARD, d=dist(Y.x*T,Y.y*T); if(d<40&&(G.animals||[]).some(a=>a.loc==='ke')) consider(d+6,{type:'kepen',label:'Sân gà Ké'}); }
    { const d=dist(SD.KAYAK_SPOT.x*T,SD.KAYAK_SPOT.y*T); if(d<30) consider(d,{type:'kayak',label:'Chèo kayak (150.000đ/giờ)'}); }
    SD.PICKUPS.forEach((p,i)=>{ if(G.quests[p.quest]!=='active'||f.picked[i]) return; const d=dist(p.x*T,p.y*T); if(d<18) consider(d,{type:'pick',k:'pickup',i,label:'Nhặt '+SD.ITEMS[p.item].name}); });
    if(G.quests.anh==='active') for(const s of SD.SPOTS){ if(f.spots[s.id]) continue; const d=dist(s.x*T,s.y*T); if(d<18) consider(d,{type:'pick',k:'spot',i:s.id,label:'Chụp ảnh check-in'}); }
    if(G.quests.beagle==='active'&&!f.beagleFollow){ const d=dist(pet.x,pet.y); if(d<26) consider(d,{type:'pick',k:'beagle',label:'Gọi beagle'}); }
    if(G.quests.co==='active'&&!f.chicken){ const d=dist(chick.x,chick.y); if(d<18) consider(d,{type:'pick',k:'chicken',label:'Bắt gà đồi'}); }
    for(const fo of SD.FORAGE){ if(G.forage[fo.id]&&t-G.forage[fo.id]<fo.respawn*1000) continue; const d=dist(fo.x*T,fo.y*T); if(d<16) consider(d,{type:'pick',k:'forage',i:fo.id,label:'Hái '+SD.ITEMS[fo.item].name.toLowerCase()}); }
    SD.FARM.plots.forEach((p,i)=>{ const d=dist(p.x*T,p.y*T); if(d<11) consider(d+2,{type:'plot',id:'k'+i,label:plotLabel('k'+i)}); });
    if(G.items.vot_buom) SD.BUTTERFLY.spots.forEach((sp,i)=>{ if(((G.buom||{})[i]||0)>t) return; const [bx,by]=bflyPos(sp,i,t), d=dist(bx,by+10); if(d<26) consider(d-4,{type:'net',i,label:'Vồ '+SD.BUTTERFLY.names[sp.k].toLowerCase()}); });
    if(P.y>=SD.LAKE_Y*T&&(tileAt(P.x,P.y+12)==='W'||tileAt(P.x+12*P.face,P.y)==='W')) consider(30,{type:'fish',label:'Câu cá'});
  }
  if(k==='dalat'){ SD.DALAT.plots.forEach((p,i)=>{ const d=dist(p.x*T,p.y*T); if(d<11) consider(d+2,{type:'plot',id:'d'+i,label:plotLabel('d'+i)}); });
    const L=SD.DALAT.lake, nx=(P.x/T-L.x)/(L.rx+1.4), ny=(P.y/T-L.y)/(L.ry+1.4); if(nx*nx+ny*ny<=1) consider(30,{type:'fish',label:'Câu cá'}); }
  return best; }
function plotLabel(id){ const p=PLOTS[id]; if(!p){ if(id[0]==='d'){ const L=LANDS.find(l=>l.plots.includes(id)); if(L&&L.n!==G.name) return 'Đất của '+L.n; if(!L) return 'Ô trống · thuê đất ở bác Trang'; } return 'Trồng ở ô đất này'; } const c=SD.CROPS[p.c], st=plotState(id,p);
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
  if(x.type==='grab') return UI.grab();
  if(x.type==='pcar'){ if(G.name.toLowerCase()!==SD.PCAR.owner){ toast('Xe riêng của Chika Phú, chỉ chủ xe lái được 🚗','lock'); return; } const r=await act({t:'pcar',op:'drive'}); if(!r.err){ P.pcar=true; sfx('car_4wd',.6); toast('Lên xe! Bấm E để đỗ xe xuống','item'); } return; }
  if(x.type==='riot'){ const c=CSGT_POST; if(c) P.face=((x.op==='smash'&&c.kind==='chot'?c.x+2.1:c.x)*T)>P.x?1:-1; P.act='attack'; P.actT=0; P.view='side'; NET.send({t:'act',a:'attack'});
    const r=await act({t:'optimus',op:x.op}); if(r.err) return; if(r.arrested){ P.opt=null; toast(esc(r.msg),'lock'); } else if(r.msg) toast(esc(r.msg),x.op==='smash'?'item':'lock'); return; }
  if(x.type==='optimus'){ if(!isKaixa()){ toast('Optimus Prime chỉ nghe lệnh Kaixa 🤖','lock'); return; }
    const r=await act({t:'optimus',op:P.opt?'human':'robot'}); if(!r.err){ P.opt=r.mode||null; if(P.opt) toast('Đã biến hình Optimus Prime! <kbd>K</kbd> thành xe đầu kéo / robot · <kbd>Z</kbd> gọi Megatron ra đấu · <kbd>J</kbd> đấm. Về đây bấm E để cất xe','quest'); } return; }
  if(x.type==='bikeshare'){ if(P.moto){ toast('Đang đi xe rồi, bấm H để xuống','lock'); return; } const r=await act({t:'moto',op:'bike'}); if(!r.err){ G.moto=r.moto; mountMoto(); } return; }
  if(x.type==='pcarride'){ const r=await act({t:'pcar',op:'ride'}); if(!r.err){ P.incar=true; toast('Đã lên xe, bấm E để xuống','item'); } return; }
  if(x.type==='pcarleave'){ await act({t:'pcar',op:'leave'}); P.incar=false; return; }
  if(x.type==='pcarpark'){ const r=await act({t:'pcar',op:'park'}); if(!r.err){ P.pcar=false; sfx('door',.4); } return; }
  if(x.type==='place') return UI.place(x.place,{id:x.place});
  if(x.type==='parkspot'){ const r=await act({t:'park',op:'visit',i:x.i}); if(r.fact) say([['me',r.fact]]); return; }
  if(x.type==='net'){ P.act='attack'; P.actT=0; sfx('dash',.4); const r=await act({t:'net',i:x.i}); if(r.err) return; if(r.miss){ toast(esc(r.msg),'lock'); return; } sfx('item_pickup',.6); toast(`Bắt được <b>${esc(SD.ITEMS[r.item].name)}</b> · +${r.exp} EXP · đã có ${buomKinds()}/9 loài`,'item'); return; }
  if(x.type==='swim') return act({t:'swim'});
  if(x.type==='pool') return UI.pool();
  if(x.type==='kepen') return UI.pen('ga','ke');
  if(x.type==='kejob') return act({t:'kejob',op:'do',task:x.task});
  if(x.type==='kayak'){ const r=await act({t:'kayak',op:'board'}); if(!r.err){ P.kayak=true; const w=findWater(); if(w){ P.x=w.x; P.y=w.y; } toast('Lên kayak! Chạm đủ 5 phao vàng trên hồ.','quest'); } return; }
  if(x.type==='unkayak'){ await act({t:'kayak',op:'leave'}); P.kayak=false; const s=findSand(); if(s){ P.x=s.x; P.y=s.y; } return; }
  if(x.type==='buoy'){ const r=await act({t:'kayak',op:'buoy',i:x.i}); if(!r.err){ sfx('coin',.5); toast(`Chạm phao ${r.n}/5`,'item'); } return; }
  if(x.type==='plot') return UI.plot(x.id);
  if(x.type==='fish') return UI.fish();
  const it=x.it; if(!it) return;
  if(it.say){ say(it.say.map(t=>['me',t])); return; }
  if(it.id==='phone'){ if(G.flags.called){ say([['me','Pháp gọi rồi. Bấm G mở Grab đi Ké Retreat thôi.']]); return; } if(ringing){ ringing.pause(); ringing=null; }
    say(Wd.DIALOG.call,()=>{ NET.send({t:'call'}); toast('Nhiệm vụ: <b>Mở Grab (G), đi tới Ké Retreat</b>','quest'); }); return; }
  if(it.id==='bonfire'){ say([['me',G.flags.fire?'Lửa cháy tí tách, ấm cả sân Nhà Rếch.':'Đống củi chưa đốt. Đôn Chề đang thiếu củi.']]); return; }
  if(it.id==='car_low'||it.id==='car_top'){ const up=it.id==='car_low', c=SD.CARS[it.id];
    ask(up?'Đi xe 4 bánh lên khu trên? (lên dốc miễn phí)':`Đi xe 4 bánh xuống Cổng? (${fmt(c.price)})`,'me',['Đi','Thôi đi bộ'],async i=>{ if(i!==0) return; const r=await act({t:'car',id:it.id}); if(!r.err){ sfx('car_4wd',.6); fadeOnly(up?'Xe 4 bánh bò lên dốc...':'Xe 4 bánh đổ đèo xuống...'); } }); return; }
  const d=it.do;
  if(d==='exit') return act({t:'exit'});
  if(d==='place') return UI.place(it.place,{id:it.place});
  if(d==='grab') return UI.grab();
  if(d==='ra') return startRoomAct(it.act,undefined,it.bed);
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
  if(d==='bay') return act({t:'enterBay'});
  if(d==='dance') return UI.dance();
  if(d==='dasnpc'){ const n=npcs.find(x=>x.id==='huyta'); return UI.place('das',n); }
  if(d==='dasstudy') return UI.dasStudy();
  if(d==='dasteach'){ const r=await act({t:'das',op:'teach'}); return; }
  if(d==='perk'){ const r=await act({t:'perk',k:it.k}); if(!r.err) toast(esc(r.msg),'exp'); return; }
  if(d==='race') return UI.race();
}
function findWater(){ const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(let r=1;r<5;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const g=S.map.grid[ty+dy]; if(g&&g[tx+dx]==='W') return {x:(tx+dx+.5)*T,y:(ty+dy+.7)*T}; } return null; }
function findSand(){ const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(let r=1;r<4;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const y=ty+dy, x=tx+dx; if(y>=0&&x>=0&&y<S.H&&x<S.W&&!S.solid[y*S.W+x]) return {x:(x+.5)*T,y:(y+.7)*T}; } return null; }
// tắm, nghỉ, sạc... (có thời gian, server tính kết quả)
const bedSpot=()=>{ const b=(S.map.inter||[]).find(i=>i.bed); return b&&Math.hypot(b.x-P.x,b.y-P.y)<64?b.bed:undefined; };
// lên xe máy: xe trượt tới cạnh người kèm khói bụi, người nhảy phắt lên rồi lái luôn
async function mountMoto(){ const r=await act({t:'moto',op:'mount'}); if(r.err) return false; P.moto=r.model; P.mountT=.55; sfx('car_4wd',.5);
  for(let k=0;k<10;k++) fx.push({kind:'dust',x:P.x-P.face*18+(Math.random()-.5)*10,y:P.y,vx:-P.face*(20+Math.random()*30),vy:-Math.random()*14,t:-k*.03,life:.6});
  toast(P.moto==='xedap'?'Lên xe đạp! Bấm <kbd>H</kbd> để xuống':'Lên xe! Bấm <kbd>H</kbd> để xuống · Space 2 lần để bốc đầu'+(G.helmet?'':' · <b>chưa có mũ bảo hiểm!</b>'),'item'); return true; }
async function startRoomAct(a,where,bed){ const r=await act({t:'ra',act:a,where,bx:bed&&bed.x,by:bed&&bed.y}); return r; }
async function fishing(){ if(!FISH){ const r=await act({t:'fish',op:'cast'}); if(!r.err){ FISH={st:'wait',x:P.x+P.face*22,y:P.y+(tileAt(P.x,P.y+12)==='W'?16:0)}; sfx('dash',.3); toast('Thả câu... đợi phao chìm rồi bấm E','item'); } return; }
  const r=await NET.req({t:'fish',op:'hook'}); FISH=null;
  if(r.miss||r.err){ toast(esc(r.msg||r.err),'lock'); return; } sfx('item_pickup',.6); toast(`Câu được <b>${SD.ITEMS[r.item].name}</b> · +${r.exp} EXP`,'vnd'); }

/* ---------- nút Về phòng: tự tìm đường tới cửa phòng đã thuê ---------- */
let AUTO=null, homeAfterExit=false, ROUTE=null;   // ROUTE: các bước đi qua nhiều cảnh (vd vào Nhà giải trí rồi tới cửa Phòng Bay)
function runRoute(){ if(!ROUTE||!ROUTE.length){ ROUTE=null; return; } const st=ROUTE.shift(); if(!ROUTE.length) ROUTE=null;
  if(st.place){ const pc=SD.PLACES[st.place]; walkTo(pc.door.x,pc.door.y,pc.name,()=>act({t:'enter',place:st.place})); return; }
  if(st.npc){ walkToNpc(st.npc); return; } walkTo(st.x,st.y,st.label,st.then); }
// nút ➜ ở bảng Việc cần làm: tự đi tới chỗ làm tiếp nhiệm vụ (hoặc về gặp người giao khi đã xong)
function questGo(id){ const q=Q[id]; if(!q) return; UI.closeAll&&UI.closeAll();
  if(S.kind!=='retreat'&&!(q.dance&&S.kind==='club')){ toast('Nhiệm vụ ở Ké Retreat: bấm G gọi Grab về Ké trước','lock'); return; }
  const near=list=>list.sort((a,b)=>Math.hypot(a.x*T-P.x,a.y*T-P.y)-Math.hypot(b.x*T-P.x,b.y*T-P.y))[0];
  if(canFinish(id)){ if(q.giver==='phap'||npcs.some(n=>n.id===q.giver)) return walkToNpc(q.giver); toast('Quay lại gặp '+speakerName(q.giver),'quest'); return; }
  if(q.dance){ ROUTE=(S.kind==='club'?[]:[{place:'club'}]).concat([{x:SD.DANCE.door.x,y:SD.DANCE.door.y+.4,label:'Phòng Bay',then:()=>act({t:'enterBay'})}]); return runRoute(); }
  if(q.eat){ const n=SD.NPCS.find(x=>x.place===Object.keys(SD.PLACES).find(k=>(SD.PLACES[k].menu||[]).includes(q.eat.id))); if(n) return walkToNpc(n.id); }
  if(q.spots){ const s=near(SD.SPOTS.filter(s=>q.spots.includes(s.id)&&!G.flags.spots[s.id])); if(s) return walkTo(s.x,s.y,s.name); }
  if(q.butterflies){ const t=NET.now(), s=near(SD.BUTTERFLY.spots.filter((sp,i)=>((G.buom||{})[i]||0)<t&&!(G.items['buom_'+sp.k]>0)).map(sp=>({...sp}))); if(s) return walkTo(s.x,s.y+1,SD.BUTTERFLY.names[s.k]); }
  if(q.lo){ if(G.stay&&G.stay.paid===vn().day) return goHome(); toast('Về phòng ở Hà Nội: bấm G gọi Grab · hoặc thuê phòng ở lễ tân Nhà Rếch 2','quest'); return; }
  if(q.need){ if(q.need.chicken&&!(G.items.chicken>0)&&!G.flags.chicken) return walkTo(chick.x/T,chick.y/T,'Gà đồi');
    const p=near(SD.PICKUPS.map((p,i)=>({...p,i})).filter(p=>p.quest===id&&!G.flags.picked[p.i])); if(p) return walkTo(p.x,p.y,SD.ITEMS[p.item].name); }
  toast('Mở bản đồ (M) xem đường nhé','quest'); }
document.addEventListener('click',e=>{ const b=e.target.closest('.qgo'); if(!b) return; e.stopPropagation(); b.blur(); questGo(b.dataset.go); });
// bấm 1 dòng ở Vườn & chuồng: tự đi tới ô rau / chuồng đó
document.addEventListener('click',e=>{ const r=e.target.closest('#hudQuests .frow'); if(!r) return; const d=r.dataset;
  if(S.kind!==d.map){ toast(`${esc(d.n)} ở ${d.map==='dalat'?'nông trại Đà Lạt':'Ké Retreat'}: bấm G gọi Grab tới đó trước`,'lock'); return; } walkTo(+d.x,+d.y,d.n); });
// BFS trên lưới ô (4 hướng); goals: danh sách ô đích, đi tới ô gần nhất theo đường đi
function findPath(goals){ const W=S.W, H=S.H, sx=Math.floor(P.x/T), sy=Math.floor(P.y/T), start=sy*W+sx, gs=new Set(goals.map(([x,y])=>y*W+x)), prev=new Int32Array(W*H).fill(-1), q=[start]; prev[start]=start; let hitAt=-1;
  // NPC đứng yên cũng chắn đường (va chạm trong blocked()), nên coi ô của họ là tường
  for(const n of npcs){ const nx=Math.floor(n.x/T), ny=Math.floor(n.y/T); for(const [ax,ay] of [[0,0],[-1,0],[1,0],[0,-1]]){ const i=(ny+ay)*W+nx+ax; if(i!==start&&!gs.has(i)) prev[i]=-2; } }
  for(let h=0;h<q.length;h++){ const c=q[h]; if(gs.has(c)){ hitAt=c; break; } const x=c%W, y=(c/W)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const n=ny*W+nx; if(prev[n]!==-1||(S.solid[n]&&!gs.has(n))) continue; prev[n]=c; q.push(n); } }
  if(hitAt<0) return null; const path=[]; for(let c=hitAt;c!==start;c=prev[c]) path.push({x:(c%W+.5)*T,y:((c/W|0)+.75)*T}); return path.reverse(); }
// tự tìm đường tới (tx,ty) theo ô; then: chạy khi tới nơi
function walkTo(tx,ty,label,then){ const goals=[]; for(let r=1;r<=4&&!goals.length;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const x=Math.floor(tx)+dx, y=Math.floor(ty)+dy; if(x>=0&&y>=0&&x<S.W&&y<S.H&&!S.solid[y*S.W+x]) goals.push([x,y]); }   // mục tiêu trong nhà/bị chặn thì nới dần ra ô đi được gần nhất
  const path=findPath(goals.length?goals:[[Math.floor(tx),Math.floor(ty)]]); if(!path){ toast('Không tìm được đường tới đó','lock'); return false; }
  AUTO={path,i:0,stuck:0,lx:P.x,ly:P.y,then:then||null,dest:[tx,ty],label}; if(label) toast(`Đang đi tới ${esc(label)}... (bấm phím đi để dừng)`,'item'); return true; }
// đi tới 1 NPC (cùng cảnh) rồi mở luôn chỗ người đó; nếu NPC ở trong tiệm thì đi tới cửa tiệm rồi vào
function walkToNpc(id){ const n=npcs.find(x=>x.id===id); if(n){ UI.closeAll(); return walkTo(n.x/T,n.y/T+1.1,speakerName(id).split(' (')[0],()=>talk(n)); }
  const def=SD.NPCS.find(x=>x.id===id), pc=def&&def.scene&&SD.PLACES[def.scene];
  if(pc&&pc.door&&(pc.map||'retreat')===S.kind){ UI.closeAll(); return walkTo(pc.door.x,pc.door.y,pc.name,()=>act({t:'enter',place:def.scene})); }
  toast('Người này không ở map này','lock'); return false; }
function goHome(){ const st=G.stay, today=vn().day;
  if(!st||st.paid!==today){ toast('Chưa thuê phòng ở Ké hôm nay. Gọi Grab về phòng ở Hà Nội, hoặc thuê ở lễ tân Nhà Rếch 2.','lock'); UI.grab(); return; }
  if(S.kind==='stay'&&S.own){ toast('Bạn đang ở phòng rồi','item'); return; }
  if(S.kind==='stay'||SD.INTERIORS[S.kind]&&!SD.INTERIORS[S.kind].map){ homeAfterExit=true; act({t:'exit'}); return; }
  if(S.kind!=='retreat'){ toast('Phòng của bạn ở Ké Retreat. Gọi Grab về Ké trước.','lock'); UI.grab(); return; }
  const doors=SD.ROOMS[st.room].doors.map(([x,y])=>[Math.floor(x),Math.floor(y)]), path=findPath(doors);
  if(!path){ toast('Không tìm được đường về phòng','lock'); return; }
  AUTO={path,i:0,stuck:0,lx:P.x,ly:P.y,then:()=>act({t:'enterRoom'})}; toast(`Đang đi về ${SD.ROOMS[st.room].name}... (bấm phím đi để dừng)`,'item'); }
$('#btnHome').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) goHome(); });
// bảng việc cần làm thu gọn được (nhớ lựa chọn)
try{ if(localStorage.getItem('chan-qmin')==='1') document.body.classList.add('qmin'); }catch(e){}
document.addEventListener('click',e=>{ if(!e.target.closest('#qToggle')) return; const on=document.body.classList.toggle('qmin'); try{ localStorage.setItem('chan-qmin',on?'1':'0'); }catch(e){} renderHUD(); });
// thanh kỹ năng: mặc định ẩn, bấm ~ hoặc nút góc dưới trái để hiện
function toggleSkills(){ const on=document.body.classList.toggle('skills'); try{ localStorage.setItem('chan-skills',on?'1':'0'); }catch(e){} }
try{ if(localStorage.getItem('chan-skills')==='1') document.body.classList.add('skills'); }catch(e){}
$('#btnSkills').addEventListener('click',e=>{ e.currentTarget.blur(); toggleSkills(); });
// chuột: phải = tự đi tới chỗ đó; trái = bấm người / cửa / đồ có hành động (rê chuột vào thì sáng lên kèm tên)
let HOVER=null, DEST=null;
const worldAt=e=>[e.clientX/SCALE+cam.x,e.clientY/SCALE+cam.y];
function pickAt(wx,wy){ let best=null, bd=1e9; const c=(d,o)=>{ if(d<bd){ bd=d; best=o; } }, body=(x,y)=>Math.abs(wx-x)<10&&wy>y-40&&wy<y+4;
  for(const n of npcs) if(body(n.x,n.y)) c(Math.hypot(n.x-wx,n.y-18-wy),{kind:'npc',n,x:n.x,y:n.y,label:STORY[n.id]?speakerName(n.id):(SD.NPC_LOOKS[n.id]||{}).name||n.id});
  for(const r of REM.values()) if(r.av&&body(r.x,r.y)) c(Math.hypot(r.x-wx,r.y-18-wy),{kind:'player',r,x:r.x,y:r.y,label:r.name});
  for(const it of S.map.inter||[]) if(it.label){ const d=Math.hypot(it.x-wx,it.y-wy); if(d<Math.max(14,(it.r||20)*.8)) c(d+4,{kind:'spot',x:it.x,y:it.y,label:it.label}); }
  if(S.kind==='retreat'){ for(const pc of Object.values(SD.PLACES)) if(pc.door&&!pc.map){ const d=Math.hypot(pc.door.x*T-wx,(pc.door.y-1)*T-wy); if(d<22) c(d+2,{kind:'spot',x:pc.door.x*T,y:pc.door.y*T,label:pc.name}); }
    for(const r of Object.values(SD.ROOMS)) for(const [x,y] of r.doors||[]){ const d=Math.hypot(x*T-wx,(y-1)*T-wy); if(d<20) c(d+2,{kind:'spot',x:x*T,y:y*T,label:r.name}); } }
  return best; }
const mouseOk=()=>started&&S&&!travelling&&!(UI.blocking&&UI.blocking())&&$('#mapView').hidden&&!(S.kind==='deo'&&STUNT);
cvs.addEventListener('mousemove',e=>{ if(!mouseOk()){ HOVER=null; cvs.style.cursor=''; return; } const [x,y]=worldAt(e); HOVER=pickAt(x,y); cvs.style.cursor=HOVER?'pointer':''; });
cvs.addEventListener('mouseleave',()=>{ HOVER=null; });
cvs.addEventListener('click',e=>{ if(!mouseOk()) return; const [x,y]=worldAt(e), h=pickAt(x,y); if(!h){ clickOut(x,y); return; } DEST={x:h.x,y:h.y,t:performance.now()};
  if(h.kind==='npc') return walkToNpc(h.n.id);
  if(h.kind==='player'){ const r=h.r; return walkTo(r.x/T,r.y/T+.8,r.name,()=>UI.social(r)); }
  walkTo(h.x/T,h.y/T,h.label,()=>{ const t=nearest(); if(t) interact(t); }); });
// bấm chuột ra ngoài khung phòng (dưới tường cửa) thì đi ra cửa rồi ra ngoài luôn
let PROMPT_AT=null; $('#prompt').addEventListener('click',()=>{ if(PROMPT_AT&&!TASK) interact(PROMPT_AT); });   // bấm vào nhãn "E ..." cũng như bấm E
function clickOut(x,y){ if(!S.map.indoor||y<(S.H-1)*T) return false; const ex=(S.map.inter||[]).find(i=>i.do==='exit'||i.do==='grab'); if(!ex) return false;
  DEST={x:ex.x,y:ex.y,t:performance.now()}; walkTo(ex.x/T,ex.y/T-.4,'',()=>{ if(ex.do==='grab') UI.grab(); else act({t:'exit'}); }); return true; }
cvs.addEventListener('contextmenu',e=>{ e.preventDefault(); if(!mouseOk()) return; const [x,y]=worldAt(e); if(clickOut(x,y)) return; DEST={x,y,t:performance.now()}; walkTo(x/T,y/T,''); });
$('#btnLb').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.leaderboard(); });
$('#btnWard').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.wardrobe(); });
$('#btnFarm').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.farm(); });

/* ---------- chuyển cảnh ---------- */
let ringing=null, ringTimer=0, travelling=false;
function fadeOnly(text){ const f=$('#fade'); $('#fadeText').textContent=text||''; f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),900); }
function travelAnim(ride){ travelling=true; const tc=$('#travel'); tc.hidden=false; sfx('car_4wd',.5);
  $('#travelText').textContent=`${(SD.DEST[ride.to]&&SD.DEST[ride.to].plane)||(SD.DEST[ride.from]&&SD.DEST[ride.from].plane)?'✈ Bay':'Grab'}: ${SD.DEST[ride.from]?SD.DEST[ride.from].name:''} → ${SD.DEST[ride.to].name}`+(ride.free?' · Pháp bao':ride.fare?' · '+fmt(ride.fare):'');
  const c=$('#travelCv'), g=c.getContext('2d'), car=A.car().c, t0=performance.now(), city=ride.to==='home'||ride.to==='everfit';
  const anim=()=>{ const t=(performance.now()-t0)/1000; g.imageSmoothingEnabled=false; g.fillStyle=city?'#cfe3ee':'#f6d7a7'; g.fillRect(0,0,240,100);
    if(city){ g.fillStyle='#8fa4b8'; for(let x=0;x<240;x+=14){ const h=30+((x*7)%5)*8; g.fillRect(x,80-h,12,h); g.fillStyle='#e8f4f8'; for(let y=84-h;y<76;y+=6) g.fillRect(x+3,y,2,2); g.fillStyle='#8fa4b8'; } }
    else { g.fillStyle='#9bb7a0'; for(let x=0;x<240;x++){ const h=40+18*Math.sin(x*.035)+8*Math.sin(x*.11); g.fillRect(x,100-h-20,1,h); }
      g.fillStyle=ride.to==='dalat'?'#3a6e46':'#5f8d62'; for(let x=0;x<240;x++){ const h=26+10*Math.sin(x*.06+2)+5*Math.sin(x*.17); g.fillRect(x,100-h-14,1,h); } }
    g.fillStyle='#3b8ed3'; if(!city) g.fillRect(0,86,240,14); g.fillStyle='#c2bcb0'; g.fillRect(0,80,240,city?20:6);
    const fly=(SD.DEST[ride.to]&&SD.DEST[ride.to].plane)||(SD.DEST[ride.from]&&SD.DEST[ride.from].plane);   // đi/về TP.HCM: máy bay bay ngang trời
    if(fly){ const px=(t*110)%320-60, py=30-Math.sin(t*1.5)*4; g.fillStyle='#f4f1ea'; g.fillRect(px,py,40,8); g.fillRect(px+34,py+2,8,4); g.fillStyle='#c4382e'; g.fillRect(px,py-8,6,9); g.fillStyle='#d8d8d2'; g.fillRect(px+14,py+6,14,4); g.fillRect(px+14,py-4,10,4); g.fillStyle='#3a6ea8'; for(let w=0;w<5;w++) g.fillRect(px+10+w*5,py+2,2,2); }
    else { g.drawImage(car,(t*80)%300-50,58+(Math.floor(t*8)%2)); g.fillStyle='#00b14f'; g.fillRect(((t*80)%300-50)+18,60,18,4); }
    if(t<2.4) requestAnimationFrame(anim); else { tc.hidden=true; travelling=false; } };
  anim(); }

/* ---------- cập nhật mỗi khung ---------- */
let sendT=0, lastSent='', officeT=0, leaving=false;
function speed(){ if(P.kayak) return 95; if(S.kind==='retreat'&&tileAt(P.x,P.y)==='L') return 45;   // lội nước chậm
  if(P.opt) return SD.RULES.run*SD.OPTIMUS[P.opt];
  if(P.pcar) return SD.RULES.run*SD.PCAR.speed; if(P.riding) return SD.RULES.run*SD.HORSE.speed; if(P.moto) return SD.RULES.run*SD.MOTO.models[P.moto].speed*(P.speeding?SD.CSGT.speed.mul:1); const h=SD.hunger(G.meals,NET.now()); let s=SD.RULES.hungrySpeed[h]*(G.needs.energy<20?.8:1)*SD.lvSpeed(G.level);
  return ((down('shift')&&G.skills.run)?SD.RULES.run:SD.RULES.walk)*s; }
function update(dt){
  if(ringTimer>0){ ringTimer-=dt; if(ringTimer<=0&&!G.flags.called&&S.kind==='room'){ ringing=sfx('phone_ring',.5); toast('Điện thoại đang reo... (lại bàn, bấm <kbd>E</kbd>)','quest'); } }
  if(ringing&&ringing.ended&&!G.flags.called){ ringing=null; ringTimer=5; }
  for(const f of fx) f.t+=dt; fx=fx.filter(f=>f.t<f.life); if(flash>0) flash=Math.max(0,flash-dt*3); if(soiT>0) soiT-=dt;
  for(const r of REM.values()){ r.t+=dt; r.actT=(r.actT||0)+dt; }
  if(DLG.open){ $('#prompt').hidden=true; updateDialog(dt); return; }
  // đường đèo: xe tự chạy, Space để bốc đầu đúng nhịp
  if(S.kind==='deo'&&STUNT&&STUNT.pick){ if(!UI.blocking()&&!STUNT.reopen){ STUNT.reopen=true; setTimeout(()=>{ if(STUNT&&STUNT.pick){ STUNT.reopen=false; UI.garage(); } },700); }   // lỡ đóng gara thì mở lại
    $('#prompt').hidden=true; P.x=3*T; P.y=(SD.WHEELIE.lane+.5)*T; P.face=1; P.view='side'; P.moving=false; P.t+=dt; return; }
  if(S.kind==='deo'&&STUNT){ $('#prompt').hidden=true; const t=NET.now(), el=Math.max(0,(t-STUNT.start)/1000);
    P.x=Math.min((S.W-6)*T,3*T+STUNT.speed*el); P.y=(SD.WHEELIE.lane+.5)*T; P.face=1; P.view='side'; P.moving=el>0; P.t+=dt; STUNT.wheelieT-=dt; STUNT.fallT-=dt;
    if(hit(' ')){ const i=STUNT.cues.findIndex((c,k)=>!STUNT.res[k]&&t>=c-STUNT.lead&&t<=c+STUNT.window+200); if(i>=0){ STUNT.res[i]='sent'; NET.send({t:'stunt',op:'hit',i,off:t-STUNT.cues[i]}); } }
    if(Math.random()<.3) fx.push({kind:'dust',x:P.x-14,y:P.y,vx:-30-Math.random()*20,vy:-Math.random()*8,t:0,life:.5}); return; }
  if(S.kind==='phongbay'&&DANCE&&DANCE.st==='play'&&DANCE.me>=0){ $('#prompt').hidden=true; UI.keys(pressed,keys); return; }
  if(CSGT_STOP){ $('#prompt').hidden=true; AUTO=null; P.moving=false; P.anim=P.view==='side'?'idle':'idle_'+P.view; P.t+=dt; if(!UI.isOpen()) UI.csgt(CSGT_STOP); return; }
  if(S.kind==='everfit'){ officeT-=dt; if(officeT<=0){ officeT=2; const was=S.closed; npcs=sceneNpcs('everfit'); if(was!==S.closed&&!S.closed) toast('Văn phòng đã mở cửa','item'); } }
  // đang đua ngựa: phím mũi tên + Space dùng để chấm nhịp, không đi lại
  if(S.kind==='track'&&RACE&&RACE.st==='run'&&RACE.me>=0){ $('#prompt').hidden=true; UI.keys(pressed,keys); return; }
  if(UI.blocking&&UI.blocking()){ $('#prompt').hidden=true; if(hit('escape')) UI.closeAll(); UI.keys&&UI.keys(pressed,keys); return; }
  if(hit('m')){ toggleMap(); return; } if(!$('#mapView').hidden){ if(hit('escape','m')) toggleMap(); return; }
  if(hit('escape')){ UI.menu(); return; }
  if(hit('enter')){ UI.chat(); return; }
  if(hit('g')){ UI.grab(); return; } if(hit('i')){ UI.bag(); return; } if(hit('b')){ goHome(); return; } if(hit('l')){ UI.leaderboard(); return; } if(hit('u')){ UI.wardrobe(); return; } if(hit('f')){ UI.farm(); return; }
  if(hit('n','`','~')) toggleSkills();                                 // N: thanh kỹ năng (tiếng bật/tắt bằng nút loa)
  if(hit('p')) act({t:'photo'}).then(r=>{ if(!r.err){ flash=1; sfx('item_pickup',.5); toast(`Đã chụp ảnh sống ảo: <b>${esc(r.name)}</b> · up ảnh ở phòng`,'item'); } });
  { const sp=!!P.moto&&P.moto!=='xedap'&&down('shift')&&(S.kind==='retreat'||S.kind==='dalat'); if(sp!==!!P.speeding){ P.speeding=sp; act({t:'moto',op:'speed',on:sp}); if(sp) toast('Phóng nhanh vượt ẩu! CSGT thấy là bắt, dễ xoè xe đấy','lock'); }
    if(sp&&P.moving&&Math.random()<.5) fx.push({kind:'dust',x:P.x-P.face*16,y:P.y,vx:-P.face*(40+Math.random()*30),vy:-Math.random()*10,t:0,life:.45}); }   /* giữ Shift khi đi xe máy: phóng nhanh */
  // tiếng máy xe theo ga; còi hú to dần khi lại gần xe CSGT
  if(!AUD.muted&&((P.moto&&P.moto!=='xedap')||P.opt==='truck')){ const big=P.opt==='truck', rpm=(big?26:34)+(P.moving?(P.speeding?62:38):0)+(P.act==='wheelie'?45:0); engineSet(rpm,(big?.09:.05)+(P.speeding?.04:0)); } else engineOff();
  { const c=S.kind==='retreat'&&CSGT_POST; let v=0; if(c&&!AUD.muted){ const d=Math.hypot((c.dx==null?c.x:c.dx)*T-P.x,SD.CSGT.y*T-P.y); v=Math.max(0,1-d/(14*T))*.06; } sirenSet(v); }
  if(P.opt&&hit('z')) act({t:'optimus',op:'megatron'}).then(r=>{ if(!r.err&&r.msg) toast(esc(r.msg),'quest'); });   /* Z: gọi Megatron ra đấu */
  if(P.opt==='robot'&&MEGA&&hit('j')){ const M=MEGA; P.face=M.x*T>P.x?1:-1; P.view='side'; P.act='attack'; P.actT=0; NET.send({t:'act',a:'attack'}); act({t:'optimus',op:'mhit',kind:'punch'}); }
  if(P.opt==='truck'&&MEGA&&P.moving&&Math.hypot(MEGA.x*T-P.x,MEGA.y*T-P.y)<2.8*T&&performance.now()-ramAt>900){ ramAt=performance.now(); act({t:'optimus',op:'mhit',kind:'ram'}); }
  if(P.opt&&(hit('k')||hit('o'))) act({t:'optimus',op:P.opt==='robot'?'truck':'robot'}).then(r=>{ if(!r.err) P.opt=r.mode; });   /* K: robot ↔ xe đầu kéo (lái đi được) */
  if(P.moto&&P.moto!=='xedap'&&hit(' ')){ const t2=performance.now(); if(t2-(P.lastSpace||0)<320){ P.act='wheelie'; P.actT=0; NET.send({t:'act',a:'wheelie'}); revSnd(); P.lastSpace=0; } else P.lastSpace=t2; }   /* Space 2 lần: bốc đầu */
  if(hit('h')&&(S.kind==='retreat'||S.kind==='dalat')&&(P.moto||(G.moto&&G.moto.until>NET.now()))&&!P.riding){ if(P.moto) act({t:'moto',op:'dismount'}).then(r=>{ if(!r.err){ P.moto=null; toast('Xuống xe','item'); } }); else mountMoto(); }
  else if(hit('h')&&(S.kind==='dalat'||S.kind==='retreat')) act({t:'horse',op:P.riding?'dismount':'mount'}).then(r=>{ if(!r.err){ P.riding=!P.riding; toast(P.riding?'Lên ngựa! Chạy nhanh hơn, chở được 3 thùng hàng':'Xuống ngựa','item'); } });
  if(hit('x')&&SOC_ME()) NET.send({t:'soc',op:'end'});
  const sock=SOC_ME();
  if(sock&&sock.kind==='vattay'&&hit(' ')) NET.send({t:'soc',op:'mash'});
  if(sock&&sock.kind==='danhnhau'&&hit('j')){ P.act='attack'; P.actT=0; NET.send({t:'soc',op:'hit'}); sfx('dash',.3); }
  // skill
  if(P.mountT>0) P.mountT-=dt;
  if(P.act){ P.actT+=dt; const dur={noi:2,quay:2.4,gong:1.6,hokage:4.4,attack:.35,hurt:.4,kiss:2.6,wheelie:1.2}[P.act]||1; if(P.actT>=dur){ if(P.act==='hokage') sfx('poof',.45); P.act=null; } }
  const sk=G.skills, useSkill=(k,fn)=>{ if(sk[k]) fn(); else toast(`Chưa mở khoá: <b>${SD.SKILLS[k].name}</b>`,'lock'); };
  const fighting=sock&&(sock.kind==='vattay');
  if(!P.act&&!fighting&&!P.kayak&&!P.riding){
    if(hit('t')) useSkill('noi',()=>{ P.act='noi'; P.actT=0; P.view='side'; NET.send({t:'act',a:'noi'}); });
    if(hit('q')) useSkill('quay',()=>{ P.act='quay'; P.actT=0; NET.send({t:'act',a:'quay'}); });
    if(hit('r')) useSkill('gong',()=>{ P.act='gong'; P.actT=0; sfx('power_up',.5); NET.send({t:'act',a:'gong'}); });
    if(hit('k')&&!P.opt) useSkill('hokage',()=>{ P.act='hokage'; P.actT=0; sfx('poof',.55); NET.send({t:'act',a:'hokage'}); });
  }
  if(hit('v')) useSkill('soi',()=>{ soiT=6; toast('Đeo kính râm... soi xu 6 giây','skill'); });
  if(hit(' ')&&!P.act&&!fighting&&!P.moto&&!P.pcar) useSkill('dash',()=>{ if(P.dashCD<=0&&!P.kayak){ P.dashT=.18; P.dashCD=.7; sfx('dash',.45); for(let k=0;k<6;k++) fx.push({kind:'dust',x:P.x,y:P.y,vx:(Math.random()-.5)*30,vy:-Math.random()*12,t:0,life:.4}); } });
  P.dashCD-=dt;
  // di chuyển
  let dx=(down('arrowright','d')?1:0)-(down('arrowleft','a')?1:0), dy=(down('arrowdown','s')?1:0)-(down('arrowup','w')?1:0);
  if(G.drunk>NET.now()&&(dx||dy)){ const an=Math.sin(clock*2.3)*.7, c=Math.cos(an), s_=Math.sin(an); [dx,dy]=[dx*c-dy*s_,dx*s_+dy*c]; }   /* say: lệch hướng đi */
  if(AUTO){ if(dx||dy){ AUTO=null; ROUTE=null; toast('Đã dừng tự đi','lock'); }
    else { const wp=AUTO.path[AUTO.i], end=AUTO.path[AUTO.path.length-1];
      if(Math.hypot(end.x-P.x,end.y-P.y)<24){ const f=AUTO.then; AUTO=null; if(f) f(); }              // tới nơi: vào phòng / mở chỗ người bán
      else if(Math.hypot(wp.x-P.x,wp.y-P.y)<4) AUTO.i=Math.min(AUTO.i+1,AUTO.path.length-1);
      if(AUTO){ const w=AUTO.path[AUTO.i], ddx=w.x-P.x, ddy=w.y-P.y; dx=Math.abs(ddx)>1.5?Math.sign(ddx):0; dy=Math.abs(ddy)>1.5?Math.sign(ddy):0;
        AUTO.stuck=Math.hypot(P.x-AUTO.lx,P.y-AUTO.ly)<.3?AUTO.stuck+dt:0; AUTO.lx=P.x; AUTO.ly=P.y; if(AUTO.stuck>1.2){ const a=AUTO; AUTO=null; if(a.dest) walkTo(a.dest[0],a.dest[1],a.label,a.then); else goHome(); } } } }
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
  // bước qua khe cửa ở mép dưới phòng là tự ra ngoài (không phải tìm nút)
  if(S.map.indoor&&!leaving&&P.y>=(S.H-1)*T+2){ const ex=(S.map.inter||[]).find(i=>(i.do==='exit'||i.do==='grab')&&Math.hypot(i.x-P.x,i.y-P.y)<56);
    if(ex){ leaving=true; P.y=(S.H-1.4)*T; if(ex.do==='grab'){ UI.grab(); leaving=false; } else act({t:'exit'}).finally(()=>{ leaving=false; }); } }
  sendT-=dt; if(sendT<=0&&S.kind!=='deo'){ sendT=.1; const v=VIEWS.indexOf(P.view), a=Math.max(0,ANIMS.indexOf(P.anim.split('_')[0])), key=[Math.round(P.x),Math.round(P.y),P.face,v,a].join();
    if(key!==lastSent){ lastSent=key; NET.send({t:'mv',x:P.x,y:P.y,f:P.face,v,a}); } }
  // tương tác
  const near=nearest(); PROMPT_AT=near; $('#prompt').hidden=!near||!!TASK; if(near) $('#promptLabel').textContent=near.label;
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
  if(ph){ tx=ph.x+18; ty=ph.y+2; }   // beagle luôn quanh quẩn cạnh Pháp
  let a='sit';
  if(tx!==null){ const dx=tx-pet.x, dy=ty-pet.y, d=Math.hypot(dx,dy);
    if(d>4){ const v=d>40?130:75, st=Math.min(d,v*dt); pet.x+=dx/d*st; pet.y+=dy/d*st; if(Math.abs(dx)>.5) pet.face=Math.sign(dx); a=d>40?'run':'walk'; pet.still=0; }
    else { pet.still+=dt; a=pet.still>2.5?'sit':'idle'; } }
  else a='sit';
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
const ANIMSPR={}; const animalSpr=(k,fr)=>ANIMSPR[k+fr]||(ANIMSPR[k+fr]=k==='bo'?A.cow(fr):k==='lon'||k==='nai'?A.pig(fr):k==='ga'?A.chicken(fr):k==='vit'?A.duck(fr,true):A.horse(fr,0,true));
const ANI_NAME={bo:'Bò',ga:'Gà',lon:'Lợn',nai:'Lợn nái',vit:'Vịt',ca:'Cá',tom:'Tôm'};
// vịt trời bơi trên hồ (trang trí), chó giữ vườn ngồi cạnh ô rau của chủ
const DUCKS=[]; const duckSpr=(f,sw)=>DUCKS[f+(sw?2:0)]||(DUCKS[f+(sw?2:0)]=A.duck(f,sw));
const DOGSPR={}; const dogSpr=(k,f)=>DOGSPR[k+f]||(DOGSPR[k+f]=A.dog(k,f));
function drawWildDucks(list,inView,spots){ spots.forEach(([cx,cy,rx,ry],i)=>{ const a=clock*.12+i*1.7, x=(cx+Math.cos(a)*rx)*T, y=(cy+Math.sin(a*1.3)*ry)*T, f=-Math.sin(a)>0?1:-1; if(!inView(x,y)) return;
  list.push({y:y-8,d:()=>{ const s=duckSpr(Math.floor(clock*2+i)%2,true); drawFlip(s.c,x,y,s.ax,s.ay,f<0); }}); }); }
function drawDogs(list){ for(const d of DOGLIST){ const e=Object.entries(PLOTS).find(([id,p])=>id[0]==='k'&&p.o===d.o); if(!e) continue; const pl=SD.FARM.plots[+e[0].slice(1)], x=(pl.x-.9)*T, y=(pl.y+.2)*T;
  list.push({y,d:()=>{ const s=dogSpr(d.k,Math.floor(clock*1.5)%2), b=Math.round(Math.sin(clock*3)*.6); drawFlip(s.c,x,y+b,s.ax,s.ay,false); }}); ANITAGS.push({x,y:y-15,n:d.n,dog:SD.DOGS[d.k].name}); } }
const HORSES=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,c,false))), GALLOP=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,c,true)));
const SADDLED={}; const saddled=(c,f,run)=>{ const k=c+'_'+f+(run?'r':''); return SADDLED[k]||(SADDLED[k]=A.horse(f,c,run,true)); };
// người ngồi trên ngựa / xe máy: dựng chung 1 lớp (con vật/xe + thân trên cắt ngang hông + chân + tay) quay phải,
// rồi lật theo hướng và xoay khi bốc đầu. Màu quần/giày lấy từ chính khung nhân vật.
const COMP=document.createElement('canvas'); COMP.width=80; COMP.height=72; const CG=COMP.getContext('2d'); CG.imageSmoothingEnabled=false;
const RCOL=new WeakMap();
function riderCols(fr){ let c=RCOL.get(fr); if(c) return c; c={pants:'#3a3a48',shoe:'#2a2a2f',shirt:'#c4382e'};
  try{ const d=fr.getContext('2d').getImageData(0,0,32,48).data, at=(x,y)=>{ const i=(y*32+x)*4; return d[i+3]>0?`rgb(${d[i]},${d[i+1]},${d[i+2]})`:null; };
    c.pants=at(15,43)||at(17,43)||c.pants; c.shoe=at(15,47)||at(17,47)||at(15,46)||c.shoe; c.shirt=at(16,37)||at(15,37)||c.shirt; }catch(e){}
  RCOL.set(fr,c); return c; }
function line(g,x0,y0,x1,y1,w,col){ g.fillStyle=col; const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1); for(let i=0;i<=n;i++){ const x=Math.round(x0+(x1-x0)*i/n), y=Math.round(y0+(y1-y0)*i/n); g.fillRect(x,y,w,w); } }
// kind 'horse' | 'bike'; o: {spr, coat, model, mode, bob}
function drawMounted(av,x,y,face,kind,o){ const AX=40, AY=66, g=CG; g.clearRect(0,0,80,72);
  const spr=o.spr; g.drawImage(spr.c,AX-spr.ax,AY-spr.ay);
  const fr=av&&av.anims&&av.anims.idle&&av.anims.idle.frames[0];
  if(fr&&o.mode!=='fallen'){ const M=kind==='horse'?A.horse:o.model==='xedap'?A.bicycle:A.motorbike, sx=AX+M.seat.dx, sy=AY+M.seat.dy-(o.bob||0), col=riderCols(fr);
    g.drawImage(fr,0,0,32,41,sx-16,sy-41,32,41);                                    // thân trên tới hông
    if(o.helmet) helmetOn(g,fr,sx-16,sy-41);
    if(kind==='horse'){ line(g,sx-1,sy,sx+2,sy+3,2,col.pants); line(g,sx+2,sy+3,sx+1,sy+8,2,col.pants); g.fillStyle=col.shoe; g.fillRect(sx,sy+9,4,2);
      g.fillStyle='#9aa0a8'; g.fillRect(sx,sy+11,4,1);                                 // bàn đạp
      line(g,sx+3,sy-9,sx+6,sy-5,1,col.shirt); g.fillStyle='#f3b194'; g.fillRect(sx+6,sy-5,2,2);
      line(g,sx+7,sy-4,AX+A.horse.mouth.dx,AY+A.horse.mouth.dy-(o.bob||0),1,'#5a3422'); }        // dây cương
    else { const pg=o.model==='xedap'?{dx:A.bicycle.peg.dx+(o.pedal?2:-1),dy:A.bicycle.peg.dy+(o.pedal?1:-1)}:A.motorbike.peg, br=M.bar, sc=o.model==='sh';
      line(g,sx-1,sy,sx+6,sy+(sc?2:0),2,col.pants); line(g,sx+6,sy+(sc?2:0),AX+pg.dx+(sc?2:0),AY+pg.dy+(sc?-1:0),2,col.pants); g.fillStyle=col.shoe; g.fillRect(AX+pg.dx+(sc?2:0),AY+pg.dy+1+(sc?-1:0),4,2);
      line(g,sx+3,sy-9,AX+br.dx-1,AY+br.dy+2,1,col.shirt); g.fillStyle='#f3b194'; g.fillRect(AX+br.dx-1,AY+br.dy+1,2,2); } }
  const X=Math.round(x-cam.x), Y=Math.round(y-cam.y); ctx.save(); ctx.translate(X,Y); if(face<0) ctx.scale(-1,1);
  if(o.mode==='wheelie'){ const r=A.motorbike.rear; ctx.translate(r.dx,r.dy); ctx.rotate(-.3); ctx.translate(-r.dx,-r.dy); }
  ctx.drawImage(COMP,-AX,-AY); ctx.restore();
  if(fr&&o.mode==='fallen') drawFlip(av.anims.hurt?av.anims.hurt.frames[0]:fr,x+14*face,y+4,16,48,face<0); }
// nài ngựa bot ở trường đua: ngoại hình cố định theo số làn
const BOTAVS={}; const BOTAV=i=>BOTAVS[i]||(BOTAVS[i]=AVATAR.build({gender:i%2?'nu':'nam',hair:['buzz','ponytail','fade','bob','messy','long'][i%6]==='bob'?'bowl':['buzz','ponytail','fade','bob','messy','long'][i%6],hairColor:['211c21','6b4128','3a2f37','8a5a36','211c21','c9a87a'][i%6],skin:['f3b194','d99a78','f8cdb0','e8b090','f3b194','d99a78'][i%6],
  outfit:{top:['tee_do','tee_xanh','somi_caro','tee_hong','khoac_jean','tee_den'][i%6],bottom:['jean','kaki','jean_rach','short_xam','jean','kaki'][i%6],shoes:'giay_den'}}));
const BIKEICO={}; const bikeIcon=k=>BIKEICO[k]||(BIKEICO[k]=(()=>{ const s=A.motorbike(0,k,''), c=document.createElement('canvas'); c.width=80; c.height=52; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,80,52); return c.toDataURL(); })());
const BIKE2={}; const bikeOf=(fr,model,mode)=>{ const k=model+mode+(fr%2); return BIKE2[k]||(BIKE2[k]=model==='xedap'?A.bicycle(fr):A.motorbike(fr,model,mode==='wheelie'?'':mode)); };
// mũ bảo hiểm nửa đầu: tìm đỉnh đầu trong khung nhân vật rồi chụp vòm mũ đỏ lên tóc
const HEADY=new WeakMap();
function headBox(fr){ let h=HEADY.get(fr); if(h) return h; h={y:4,x0:9,x1:22};
  try{ const d=fr.getContext('2d').getImageData(0,0,32,48).data, a=(x,y)=>d[(y*32+x)*4+3]>0; for(let y=0;y<24;y++){ let hit=false; for(let x=8;x<25;x++) if(a(x,y)){ hit=true; break; } if(hit){ h.y=y; break; } }
    const r=h.y+4; let x0=31, x1=0; for(let x=0;x<32;x++) if(a(x,r)){ x0=Math.min(x0,x); x1=Math.max(x1,x); } if(x1>x0){ h.x0=x0; h.x1=x1; } }catch(e){}
  HEADY.set(fr,h); return h; }
function helmetOn(g,fr,ox,oy){ const h=headBox(fr), y0=oy+h.y-1;
  for(let r=0;r<6;r++){ const ins=r<2?2-r:0; g.fillStyle=r===0?'#ff6a6a':r===5?'#8c1a24':'#d9263a'; g.fillRect(ox+h.x0-1+ins,y0+r,h.x1-h.x0+3-ins*2,1); }
  g.fillStyle='#ffffff'; g.fillRect(ox+h.x0+3,y0+1,3,1); g.fillStyle='#2a1e24'; g.fillRect(ox+h.x0+2,y0+6,1,6); }
// xe máy / xe đạp nhìn từ trước (đi xuống) hoặc sau (đi lên)
const RIDEV={}; const rideOf=(md,back,fr)=>{ const k=md+back+(fr%2); return RIDEV[k]||(RIDEV[k]=A.rideView(md,back,fr)); };
function drawRideV(av,x,y,view,md,moving,t,hel){ const back=view==='up', g=CG, AX=40, AY=66; g.clearRect(0,0,80,72);
  const an=av.anims['idle_'+view]||av.anims.idle, fr=an.frames[0], col=riderCols(av.anims.idle.frames[0]), spr=rideOf(md,back,Math.floor(t*(moving?12:2))), hy=AY+A.rideView.seatY-(moving&&Math.floor(t*12)%2?1:0);
  const legs=()=>{ for(const s of [-1,1]){ g.fillStyle=col.pants; g.fillRect(AX+s*5-(s<0?2:0),hy,3,6); g.fillRect(AX+s*7-(s<0?2:0),hy+5,3,4); g.fillStyle=col.shoe; g.fillRect(AX+s*7-(s<0?2:0),hy+9,3,2); } };
  const body=()=>{ g.drawImage(fr,0,0,32,41,AX-16,hy-41,32,41); if(hel) helmetOn(g,fr,AX-16,hy-41); };
  const hands=()=>{ g.fillStyle='#f3b194'; g.fillRect(AX-12,AY-26,2,2); g.fillRect(AX+10,AY-26,2,2); g.fillStyle=col.shirt; g.fillRect(AX-11,AY-28,1,2); g.fillRect(AX+10,AY-28,1,2); };
  if(back){ g.drawImage(spr.c,AX-spr.ax,AY-spr.ay); legs(); body(); hands(); } else { legs(); body(); g.drawImage(spr.c,AX-spr.ax,AY-spr.ay); hands(); }
  shadow(x,y,10); ctx.drawImage(COMP,Math.round(x-cam.x)-AX,Math.round(y-cam.y)-AY); }
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
  if(riding){ const moving=anim.startsWith('run')||anim.startsWith('walk'), f=Math.floor(t*(moving?12:3))%4; drawMounted(av,x,y,face,'horse',{spr:saddled(0,f,moving),bob:moving&&f%2?1:0}); return; }
  if(fl&(SD.FL.optimus|SD.FL.otruck)){ const tr=!!(fl&SD.FL.otruck), moving=anim.startsWith('run')||anim.startsWith('walk'), v=view==='side'?'side':view==='up'?'up':'down', f=Math.floor(t*(moving?(tr?12:7):1));
    const pun=!tr&&act==='attack', s=pun?optSpr('robot','punch',0):optSpr(tr?'truck':'robot',v,f%2); shadow(x,y,tr?(v==='side'?46:20):14); drawFlip(s.c,x,y+(tr?4:2),s.ax,s.ay,(pun||v==='side')&&face<0); return; }
  if(fl&SD.FL.incar) return;   /* ngồi trong ô tô: không vẽ người */
  if(fl&SD.FL.car){ const c=PICK.__hatch||(PICK.__hatch=A.hatch()); shadow(x,y,32); drawFlip(c.c,x,y+4,c.ax,c.ay,face<0); return; }   /* lái ô tô: chỉ thấy xe */
  if(fl&SD.FL.moto){ const md=av===P.av&&P.moto||(fl&SD.FL.bike?'xedap':'wave'), moving=anim.startsWith('run')||anim.startsWith('walk'), wh=act==='wheelie', mt=av===P.av&&P.mountT>0?P.mountT/.55:0;
    if(mt>0){ const k=1-mt, bx=x-face*Math.round((1-Math.min(1,k*2))*26), hop=Math.round(Math.sin(Math.min(1,k)*Math.PI)*10);   /* xe trượt tới, người nhảy lên */
      shadow(bx,y,14); drawFlip(bikeOf(0,md,'').c,bx,y+2,16,24,face<0); if(k<.5) drawFlip(fr,x,y,16,48,face<0); else drawMounted(av,x,y+2-hop,face,'bike',{spr:{c:document.createElement('canvas'),ax:0,ay:0},model:md,mode:''}); return; }
    const hel=!!(fl&SD.FL.helmet); if((view==='down'||view==='up')&&!wh){ drawRideV(av,x,y+2,view,md,moving,t,hel&&md!=='xedap'); return; }
    const f=Math.floor(t*(moving?12:2)); shadow(x,y,14); drawMounted(av,x,y+2,face,'bike',{spr:bikeOf(f,md,''),model:md,mode:wh?'wheelie':'',helmet:hel&&md!=='xedap',pedal:moving&&f%2}); return; }
  if(kayak){ const moving=anim.startsWith('walk')||anim.startsWith('run'), bob=Math.round(Math.sin(t*3)*1), kc=PICK.__kayak||(PICK.__kayak=A.kayak().c);
    // thân trên (cắt ngang hông) ngồi lọt vào khoang thuyền, thuyền vẽ đè lên phần hông
    const body=(anims.idle_down||anims.idle).frames[0]; drawFlip(body,x,y+4+bob,16,48,false,40); drawFlip(kc,x,y+bob,18,10,face<0);
    // mái chèo: cán xuyên ngang tầm tay, 2 bản chèo lên xuống so le khi đang chèo
    const ph=moving?t*7:t*1.5, a=Math.sin(ph)*4, hx=Math.round(x-cam.x), hy=Math.round(y-cam.y)-9+bob;
    const L=[hx-15,hy+Math.round(a)], R=[hx+15,hy-Math.round(a)];
    ctx.strokeStyle='#5a3a22'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(L[0]+.5,L[1]+.5); ctx.lineTo(R[0]+.5,R[1]+.5); ctx.stroke();
    for(const [bx,by] of [L,R]){ ctx.fillStyle='#1c1516'; ctx.fillRect(bx-2,by-2,5,4); ctx.fillStyle='#f2c43d'; ctx.fillRect(bx-1,by-1,3,2); }
    ctx.fillStyle='#e8c38a'; ctx.fillRect(hx-6,hy-1+Math.round(a/2),2,2); ctx.fillRect(hx+4,hy-1-Math.round(a/2),2,2);   // 2 bàn tay nắm cán
    if(moving&&Math.random()<.35){ const side=Math.sin(ph)>0?L:R; fx.push({kind:'splash',x:side[0]+cam.x,y:side[1]+cam.y+3,t:0,life:.4}); }
    if(moving&&Math.random()<.2) fx.push({kind:'wake',x:x-face*16+(Math.random()-.5)*4,y:y+2,t:0,life:.9});
    return; }
  if(act==='sleep'){ const head=(anims.idle_down||anims.idle).frames[0], X=Math.round(x-cam.x), Y=Math.round(y-cam.y);
    drawFlip(head,x,y+18,16,48,false,33);                                       // đầu + vai (cắt ngang ngực)
    ctx.fillStyle='#1c1516'; ctx.fillRect(X-10,Y+2,20,22); ctx.fillStyle='#e8d8b4'; ctx.fillRect(X-9,Y+3,18,20); ctx.fillStyle='#d6c3a5'; ctx.fillRect(X-9,Y+3,18,3); ctx.fillRect(X-9,Y+12,18,1); ctx.fillStyle='#c9b48e'; ctx.fillRect(X+5,Y+6,1,15);
    if(Math.random()<.03) fx.push({kind:'z',x:x+8,y:y-6,t:0,life:1.4}); return; }
  if(act==='shower'){ const tub=(S.map.obj||[]).find(o=>o.tub&&Math.hypot(o.x-x,o.y-y)<40), front=(anims.idle_down||anims.idle).frames, X=Math.round(x-cam.x);
    if(tub){ const bob=Math.round(Math.sin(t*2.5)), tx=tub.x, ty=tub.y-9; drawFlip(front[0],tx,ty+bob+14,16,48,false,34);
      ctx.drawImage(tub.spr.c,Math.round(tub.x-tub.spr.ax-cam.x),Math.round(tub.y-tub.spr.ay-cam.y));                      // thành bồn đè lên người
      const TX=Math.round(tx-cam.x), TY=Math.round(ty-cam.y);
      for(let i=0;i<9;i++){ const fx2=TX-16+i*4+Math.round(Math.sin(t*3+i)*1.5), fy=TY-2+Math.round(Math.cos(t*2+i*1.7)); ctx.fillStyle=i%3?'#ffffff':'#e4f6fc'; ctx.fillRect(fx2,fy,3,2); ctx.fillRect(fx2+1,fy-1,1,1); }
      const sc=Math.round(Math.sin(t*9)*3); ctx.fillStyle='#f3b194'; ctx.fillRect(TX-5+sc,TY-6,2,2); ctx.fillRect(TX+4-sc,TY-6,2,2);   // 2 tay kỳ cọ
      if(Math.random()<.12) fx.push({kind:'bubble',x:tx+(Math.random()-.5)*26,y:ty-4,t:0,life:1}); if(Math.random()<.08) fx.push({kind:'steam',x:tx+(Math.random()-.5)*20,y:ty-26,t:0,life:.9}); return; }
    const sc=Math.round(Math.sin(t*8)); drawFlip(front[Math.floor(t*4)%front.length],x,y,16,48,false); const Y=Math.round(y-cam.y);
    ctx.fillStyle='rgba(150,215,240,.85)'; for(let i=0;i<7;i++){ const dx=-8+i*2.6, dy=((t*90+i*13)%34); ctx.fillRect(Math.round(X+dx),Math.round(Y-48+dy),1,3); }      // nước xối
    ctx.fillStyle='#ffffff'; for(let i=0;i<5;i++) ctx.fillRect(X-5+i*2+sc,Y-35-(i%2),2,2);                                  // bọt dầu gội trên tóc
    if(Math.random()<.15) fx.push({kind:'bubble',x:x+(Math.random()-.5)*14,y:y-20,t:0,life:.8}); if(Math.random()<.1) fx.push({kind:'steam',x:x+(Math.random()-.5)*16,y:y-40,t:0,life:.8}); return; }
  // lướt TikTok: nằm trên giường, giơ điện thoại lên mặt, màn hình nhấp nháy
  if(act==='phone'&&(S.map.inter||[]).some(i=>i.bed&&Math.hypot(i.bed.x*T-x,i.bed.y*T-y)<12)){ const head=(anims.idle_down||anims.idle).frames[0], X=Math.round(x-cam.x), Y=Math.round(y-cam.y);
    drawFlip(head,x,y+18,16,48,false,33); ctx.fillStyle='#1c1516'; ctx.fillRect(X-10,Y+8,20,16); ctx.fillStyle='#e8d8b4'; ctx.fillRect(X-9,Y+9,18,14); ctx.fillStyle='#d6c3a5'; ctx.fillRect(X-9,Y+9,18,2);
    const sw=Math.floor(t*1.6)%3, ph=Math.round(Math.sin(t*6)); ctx.fillStyle='#1c1516'; ctx.fillRect(X+3,Y-6,7,10); ctx.fillStyle=['#25f4ee','#fe2c55','#ffffff'][sw]; ctx.fillRect(X+4,Y-5,5,8);
    ctx.fillStyle='#f3b194'; ctx.fillRect(X+2,Y+2,3,2); ctx.fillRect(X+8,Y+2+ph,2,2);                                       // tay cầm máy, ngón cái vuốt
    if(Math.random()<.03) fx.push({kind:'heart',x:x+8,y:y-10,t:0,life:1.2}); return; }
  if(act!=='sleep'&&S&&S.kind==='retreat'&&tileAt(x,y)==='L') act='swim';      // đứng trong nước bể bơi là đang bơi
  if(act==='swim'){ const body=(anims.idle_down||anims.idle).frames[0], bob=Math.round(Math.sin(t*4)); drawFlip(body,x,y+8+bob,16,48,false,36);
    ctx.fillStyle='rgba(143,230,244,.85)'; ctx.fillRect(Math.round(x-cam.x)-9,Math.round(y-cam.y)-5+bob,18,2); if(Math.random()<.25) fx.push({kind:'splash',x:x+(Math.random()-.5)*14,y:y-4,t:0,life:.4}); return; }
  drawFlip(fr,x,y,16,48,flip);
  if(fl&SD.FL.fish){ const bx=x+face*22, by=y+10; ctx.strokeStyle='#3a2c24'; ctx.beginPath(); ctx.moveTo(Math.round(x+face*8-cam.x)+.5,Math.round(y-26-cam.y)+.5); ctx.lineTo(Math.round(bx-cam.x)+.5,Math.round(by-cam.y)+.5); ctx.stroke(); ctx.fillStyle='#e23b2e'; ctx.fillRect(Math.round(bx-cam.x)-1,Math.round(by-cam.y)-1,3,3); }
  if(fl&SD.FL.dirty&&Math.random()<.05) fx.push({kind:'fly',x:x+(Math.random()-.5)*14,y:y-30,t:0,life:.8});
  if(act==='kiss'&&Math.random()<.08) fx.push({kind:'heart',x:x+(Math.random()-.5)*10,y:y-40,t:0,life:1.2});
  if(act==='sleep'&&Math.random()<.03) fx.push({kind:'z',x:x+6,y:y-40,t:0,life:1.4});
  if((act==='work'||act==='phone')&&Math.random()<.04) fx.push({kind:'spark',x:x+face*6,y:y-28,t:0,life:.5});
  if(act==='shower'&&Math.random()<.2) fx.push({kind:'steam',x:x+(Math.random()-.5)*16,y:y-36,t:0,life:.8}); }
function draw(){
  const mw=S.W*T, mh=S.H*T;
  // đang đua: camera bám đàn ngựa trên đường đua thay vì người đứng ở khán đài
  const racing=S.kind==='track'&&RACE&&(RACE.st==='run'||RACE.st==='done')&&RACE.riders.length, rx=racing?RACE.riders.reduce((a,r)=>a+(r._x||Wd.TRACK.x0*T),0)/RACE.riders.length:0;
  const fx_=racing?rx:P.x, fy_=racing?14.5*T+20:P.y;
  cam.x=mw<=VW?(mw-VW)/2:Math.max(0,Math.min(mw-VW,fx_-VW/2)); cam.y=mh<=VH?(mh-VH)/2:Math.max(0,Math.min(mh-VH,fy_-20-VH/2));
  const cx=Math.round(cam.x), cy=Math.round(cam.y), k=S.kind, now=NET.now();
  ctx.fillStyle=S.map.indoor?'#1c1516':'#3f7a31'; ctx.fillRect(0,0,VW,VH);
  S.ground.draw(ctx,cx,cy,VW,VH,waterFrame);
  const list=[], inView=(x,y,m=80)=>x>cx-m&&x<cx+VW+m&&y>cy-40&&y<cy+VH+m+40, [oi0,oi1,oj0,oj1]=S.ground.range(cx,cy,VW,VH,1), near=[];
  for(let j=oj0;j<=oj1;j++) for(let i=oi0;i<=oi1;i++){ const b=S.objB.get(i+'_'+j); if(b) for(const o of b) near.push(o); }
  for(const o of near){ if(!inView(o.x,o.y)) continue; list.push({y:o.sort??o.y,d:()=>{ let spr=o.spr;
    if(o.id==='bonfire') spr=A.bonfire(G.flags.fire,Math.floor(clock*6));
    if(o.id==='phone'&&!G.flags.called&&ringTimer<=0) spr=A.phone(true,Math.floor(clock*8));
    if(o.id==='windmill') spr=windmillFrame();
    // cây đứng che nhân vật thì mờ đi để vẫn thấy người phía sau
    const X=Math.round(o.x-spr.ax-cx), Y=Math.round(o.y-spr.ay-cy), hide=o.tree&&P.y<o.y&&P.x>o.x-spr.ax&&P.x<o.x-spr.ax+spr.c.width&&P.y>o.y-spr.ay;
    if(hide) ctx.globalAlpha=.45; ctx.drawImage(spr.c,X,Y); if(hide) ctx.globalAlpha=1; }}); }
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
  if(k==='dalat'){ drawFarmLife(list,inView,now); drawWildDucks(list,inView,[[66,58,5,2],[62,60,4,1.5],[69,61,3,1]]); }
  if(k==='retreat'&&!OPT_ON){ const s=optSpr('truck','side',0), X=SD.OPTIMUS.park.x*T, Y=SD.OPTIMUS.park.y*T; list.push({y:Y,d:()=>{ shadow(X,Y,46); drawFlip(s.c,X,Y+4,s.ax,s.ay,true); }}); }
  ANITAGS=[]; if(k==='retreat'&&PCAR&&!PCAR.driving){ const c=PICK.__hatch||(PICK.__hatch=A.hatch()), X=PCAR.x*T, Y=PCAR.y*T; list.push({y:Y,d:()=>{ shadow(X,Y,32); drawFlip(c.c,X,Y+4,c.ax,c.ay,false); }}); ANITAGS.push({x:X,y:Y-32,n:'Chika Phú',car:true}); }
  if(k==='dalat') drawCsgt(list,now);
  if(k==='retreat'){ drawCsgt(list,now);
    drawWild(list,inView); drawKeYard(list,now); drawButterflies(list,inView,now); drawDogs(list); drawWildDucks(list,inView,[[20,106,6,1.2],[30,108,5,1],[52,106,7,1.5],[60,109,4,1],[10,108,4,1],[38,110,6,1.2]]); }
  if(k==='track') drawRace(list);
  for(const n of npcs) list.push({y:n.y,d:()=>drawNpc(n)});
  const dancing=k==='phongbay'&&DANCE&&DANCE.st==='play', dn=dancing?new Set(DANCE.dancers.map(d=>d.name)):null;
  for(const r of REM.values()){ interp(r); if(!r.av||!inView(r.x,r.y)) continue; const ac=dancing&&dn.has(r.name)?'quay':r.act; list.push({y:r.y,d:()=>drawChar(ctx,r.av,r.x,r.y,r.face,r.view,r.anim,ac,r.t,ac==='quay'?r.t:r.actT,r.fl)}); }
  if(k==='deo'&&STUNT){ const mode=STUNT.fallT>0?'fallen':STUNT.wheelieT>0?'wheelie':''; const dx=P.x+26+Math.sin(clock*.7)*18, dc=SHEETS.donche;
    const dm=!STUNT.pick&&Math.sin(clock*1.3)>.6?'wheelie':'', bk=STUNT.bike||STUNT.preview||'wave';
    list.push({y:P.y+19,d:()=>{ shadow(dx,P.y+18,14); drawMounted(dc,dx,P.y+18,1,'bike',{spr:bikeOf(Math.floor(clock*12),'exciter',dm),model:'exciter',mode:dm}); }});
    list.push({y:P.y+8,d:()=>{ shadow(P.x,P.y+8,14); drawMounted(P.av,P.x,P.y+8,1,'bike',{spr:bikeOf(Math.floor(clock*12),bk,mode),model:bk,mode}); }}); }
  else if(P.av) list.push({y:P.y,d:()=>drawChar(ctx,P.av,P.x,P.y,P.face,P.view,P.anim,P.act||(TASK&&TASK.anim)||(k==='phongbay'&&DANCE&&DANCE.st==='play'&&DANCE.me>=0?'quay':''),P.act?P.t:P.t,P.act?P.actT:P.t,(P.riding?SD.FL.ride:0)|(P.pcar?SD.FL.car:0)|(P.incar?SD.FL.incar:0)|(P.moto?SD.FL.moto:0)|(P.moto&&G.helmet&&P.moto!=='xedap'?SD.FL.helmet:0)|(P.opt==='robot'?SD.FL.optimus:0)|(P.opt==='truck'?SD.FL.otruck:0)|(P.kayak?SD.FL.kayak:0)|(FISH?SD.FL.fish:0)|(G.needs.clean<20?SD.FL.dirty:0))});
  for(const f of fx) if(f.ground) drawFx(f,cx,cy);                       // vệt dưới chân (nước vàng loang...)
  list.sort((a,b)=>a.y-b.y); for(const it of list) it.d();
  for(const o of S.over) ctx.drawImage(o.spr.c,Math.round(o.x-o.spr.ax-cx),Math.round(o.y-o.spr.ay-cy));
  // ban đêm không làm tối màn hình (theo yêu cầu); chỉ bật dây đèn vàng ở Ké theo giờ Việt Nam
  if(k==='retreat') drawLights(cx,cy);
  for(const f of fx) if(!f.ground) drawFx(f,cx,cy);
  if(soiT>0){ ctx.fillStyle='rgba(20,30,50,.25)'; ctx.fillRect(0,0,VW,VH); }
  if(flash>0){ ctx.fillStyle=`rgba(255,255,255,${flash})`; ctx.fillRect(0,0,VW,VH); }
  drawOverlay();
}
const BIKES={}; function bikeSpr(fr,col,mode){ const k=col+mode+(fr%2); return (BIKES[k]||(BIKES[k]=A.motorbike(fr,col,mode))).c; }
let wmT=-1, wmSpr=null; function windmillFrame(){ const f=Math.floor(clock*4)%18; if(f!==wmT){ wmT=f; wmSpr=A.windmill(f); } return wmSpr; }
function drawNpc(n){ if(n.av){ if(n.lecture&&!n.act){ drawChar(ctx,n.av,n.x,n.y,n.face,'side','idle','noi',n.t,(clock+n.t)%2.4,0); return; }   // giảng viên nói suốt
    const dn=S.kind==='phongbay'&&n.dance&&!n.act; drawChar(ctx,n.av,n.x,n.y,n.face,n.view,n.view!=='side'?'idle_'+n.view:'idle',dn?'quay':n.act||'',n.t,dn?clock+n.t:n.actT,0);   // bot Phòng Bay nhảy suốt
    if(n.act&&(n.actT+=1/60)>2) n.act=null; return; }
  shadow(n.x,n.y,8); const sh=npcSheet(n); if(!sh) return; const v=!n.act&&n.view&&n.view!=='side'?'idle_'+n.view:null;
  let an=sh.anims[n.act||v||'idle']||sh.anims.idle, k=Math.floor((n.act?n.actT:n.t)*an.fps);
  const f=n.act&&!an.loop?an.frames[Math.min(an.frames.length-1,k)]:an.frames[k%an.frames.length]; drawFlip(f,n.x,n.y,16,48,n.face<0&&!v);
  const qs=Object.keys(Q).filter(q=>Q[q].giver===n.id), qid=qs.find(k=>G.quests[k]!=='done'&&(!Q[k].after||G.quests[Q[k].after]==='done'))||qs[qs.length-1], st=G.quests[qid];
  if(n.id==='phap'&&!G.flags.hello) marker(n.x,n.y-44,'!'); else if(!st) marker(n.x,n.y-44,'!'); else if(st==='active'&&canFinish(qid)) marker(n.x,n.y-44,'?'); }
// vật nuôi của mình + bò, ngựa trang trí
// mảnh đất thuê ở Đà Lạt: viền quanh các ô + biển gỗ cắm ở góc (tên vẽ ở lớp chữ)
function landBox(L){ const ps=L.plots.map(id=>SD.DALAT.plots[+id.slice(1)]).filter(Boolean); if(!ps.length) return null;
  return {x0:Math.min(...ps.map(p=>p.x))-.5,y0:Math.min(...ps.map(p=>p.y))-.5,x1:Math.max(...ps.map(p=>p.x))+.5,y1:Math.max(...ps.map(p=>p.y))+.5}; }
function drawLands(list){ for(const L of LANDS){ const b=landBox(L); if(!b) continue; const mine=L.n===G.name, col=mine?'#ffd84a':'#f4f1ea';
  list.push({y:b.y0*T-1,d:()=>{ const X0=Math.round(b.x0*T-cam.x), Y0=Math.round(b.y0*T-cam.y), X1=Math.round(b.x1*T-cam.x), Y1=Math.round(b.y1*T-cam.y);
    ctx.fillStyle=col; for(let x=X0;x<X1;x+=4){ ctx.fillRect(x,Y0,2,1); ctx.fillRect(x,Y1,2,1); } for(let y=Y0;y<Y1;y+=4){ ctx.fillRect(X0,y,1,2); ctx.fillRect(X1,y,1,2); }
    const sx=X0-3, sy=Y0-2; ctx.fillStyle='#1c1516'; ctx.fillRect(sx-1,sy-13,14,10); ctx.fillRect(sx+4,sy-4,3,8); ctx.fillStyle='#c08552'; ctx.fillRect(sx,sy-12,12,8); ctx.fillStyle='#8a5d3b'; ctx.fillRect(sx+5,sy-4,1,7);
    ctx.fillStyle=mine?'#c4382e':'#3a2c24'; ctx.fillRect(sx+2,sy-10,8,1); ctx.fillRect(sx+2,sy-8,6,1); }}); } }
function drawFarmLife(list,inView,now){ drawLands(list); const D=SD.DALAT, wander=(i,x0,y0,w,h,sp)=>{ const t=clock*sp+i*7.3; return [x0+(Math.sin(t*.7+i)*.5+.5)*w,y0+(Math.cos(t*.53+i*2)*.5+.5)*h,Math.cos(t*.7+i)>0?1:-1]; };
  const pens={bo:[47,37.5,13,6],ga:[63,36.5,5,3],lon:[71,36.5,5,4],nai:[71,36.5,5,4],vit:[56,58.5,10,3]};
  // vật nuôi của người khác (kèm tên chủ ở lớp chữ)
  HERDS.forEach((h,hi)=>{ if(h.pid===NET.pid) return; h.a.forEach((a,i)=>{ const pen=pens[a.k]; if(!pen||a.loc==='ke') return; const [x,y,f]=wander(i+hi*13+40,...pen,.25), s=animalSpr(a.k,Math.floor(clock*4+i)%2);
    list.push({y:y*T,d:()=>{ drawFlip(s.c,x*T,y*T,s.ax,s.ay,f<0); }}); ANITAGS.push({x:x*T,y:y*T-s.ay-2,n:h.n,k:a.k}); }); });
  const swim=(i,[x0,y0,w,h])=>{ const fx=(i*.618034)%1, fy=(i*.381966+.2)%1, a=clock*.35+i*2.4; return [x0+fx*w+Math.cos(a)*1.2,y0+fy*h+Math.sin(a*1.3)*.5,-Math.sin(a)>0?1:-1]; };
  (G.animals||[]).forEach((a,i)=>{ const pen=pens[a.k]; if(!pen||a.loc==='ke') return; const [x,y,f]=a.k==='vit'?swim(i,pen):wander(i,...pen,.25), ready=a.cyc&&now>=a.cyc;
    const s=animalSpr(a.k,Math.floor(clock*4)%2); ANITAGS.push({x:x*T,y:y*T-s.ay-2,n:'bạn',k:a.k,me:true});
    list.push({y:y*T,d:()=>{ drawFlip(s.c,x*T,y*T,s.ax,s.ay,f<0); if(ready) marker(x*T,y*T-s.ay-8,'?'); else if(!a.cyc) marker(x*T,y*T-s.ay-8,'!','#7fe0ff'); }}); });
  for(const k of ['ca','tom']){ const has=(G.animals||[]).find(a=>a.k===k); if(!has) continue; const p=D.pens[k], ready=has.cyc&&now>=has.cyc;
    if(Math.random()<.05) fx.push({kind:'bubble',x:(p.x+(Math.random()-.5)*5)*T,y:(p.y-2.4)*T,t:0,life:.8}); if(ready) list.push({y:p.y*T,d:()=>marker(p.x*T,p.y*T-30,'?')}); }
  for(let i=0;i<3;i++){ const [x,y,f]=wander(i+10,48,38,10,5,.18); if(inView(x*T,y*T)) list.push({y:y*T,d:()=>drawFlip(animalSpr('bo',Math.floor(clock*3+i)%2).c,x*T,y*T,15,20,f<0)}); }
  for(let i=0;i<4;i++){ const [x,y,f]=wander(i+20,59,9,15,14,.22); if(inView(x*T,y*T)) list.push({y:y*T,d:()=>drawFlip(HORSES[i][Math.floor(clock*3+i)%4].c,x*T,y*T,20,28,f<0)}); }
  if(HERD&&HERD.phase!=='done') for(let i=0;i<3;i++){ const tx=P.x-P.face*(22+i*16), ty=P.y+(i-1)*8; list.push({y:ty,d:()=>drawFlip(HORSES[(i+1)%4][Math.floor(clock*8)%4].c,tx,ty,20,28,P.face<0)}); } }
// bướm: bay lượn quanh chỗ của nó; bắt rồi / để sổng thì chỗ đó trống tới khi bướm khác bay tới
const BFLY={}; const bflySpr=(k,f)=>BFLY[k+f]||(BFLY[k+f]=A.butterfly(k,f));
const bflyPos=(sp,i,t)=>{ const a=t*.0006+i*2.1; return [sp.x*T+Math.sin(a)*14+Math.sin(a*2.7)*5,sp.y*T+Math.cos(a*.8)*8-10+Math.sin(a*5)*2]; };
function drawButterflies(list,inView,now){ const B=SD.BUTTERFLY, cd=G.buom||{};
  B.spots.forEach((sp,i)=>{ if((cd[i]||0)>now) return; const [x,y]=bflyPos(sp,i,now); if(!inView(x,y)) return; list.push({y:y+14,d:()=>{ const f=Math.floor(clock*8+i)%2, s=bflySpr(sp.k,f); ctx.drawImage(s.c,Math.round(x-s.ax-cam.x),Math.round(y-s.ay-cam.y)); }}); }); }
// thú hoang ở vườn quốc gia: mỗi trạm 1–3 con đi lại quanh trạm (hổ trong khu có tường)
const WILDSPR={}; const wildSpr=(k,f)=>WILDSPR[k+f]||(WILDSPR[k+f]=A.wild(k,f));
function drawWild(list,inView){ SD.PARK.spots.forEach((sp,i)=>{ const n=sp.k==='voi'||sp.k==='ho'||sp.k==='gau'?2:3;
  for(let j=0;j<n;j++){ const a=clock*.12+i*3.1+j*2.2, cx=sp.k==='ho'?305.5:sp.x+(j-1)*3, cy=sp.k==='ho'?64.5:sp.y-3.5, x=(cx+Math.sin(a)*(sp.k==='ho'?4:3))*T, y=(cy+Math.cos(a*.7)*(sp.k==='ho'?3:1.5))*T, f=Math.cos(a)>0?1:-1;
    if(!inView(x,y)) continue; const fr=Math.floor(clock*4+j)%4; list.push({y,d:()=>{ const s=wildSpr(sp.k,fr); drawFlip(s.c,x,y,s.ax,s.ay,f<0); }}); } }); }
// gà nuôi ở sân gà Ké Retreat
const PTRUCK={}; const ptruck=(cargo,l,dmg=0)=>{ const k=cargo+l+'d'+dmg; return PTRUCK[k]||(PTRUCK[k]=A.policeTruck(cargo,dmg>=5?0:l,dmg)); }; const CONE=()=>PTRUCK.cone||(PTRUCK.cone=A.cone());
function csgtAv(){ return CSGT_AV.a||(CSGT_AV.a=AVATAR.build(SD.NPC_LOOKS.csgt.look)); }
function drawMega(list){ const M=MEGA; if(!M||S.kind!=='retreat') return; if(M.dx==null){ M.dx=M.x; M.dy=M.y; } const ox=M.dx, oy=M.dy; M.dx+=(M.x-M.dx)*.25; M.dy+=(M.y-M.dy)*.25;
  const moving=Math.hypot(M.dx-ox,M.dy-oy)>.004, el=NET.now()-(M.actAt||0), v=M.act==='punch'&&el<350?'punch':M.act==='fire'&&el<450?'fire':'side', x=M.dx*T, y=M.dy*T;
  list.push({y,d:()=>{ const s=megaSpr(v,moving?Math.floor(clock*7)%2:0); shadow(x,y,16); drawFlip(s.c,x,y+2,s.ax,s.ay,M.face<0); }});
  for(const [sx,sy] of M.shots||[]) list.push({y:sy*T+20,d:()=>{ const s=PTRUCK.shot||(PTRUCK.shot=A.megaShot()); drawFlip(s.c,sx*T,sy*T,s.ax,s.ay,false); if(Math.random()<.5) fx.push({kind:'glint',x:sx*T,y:sy*T,t:0,life:.3}); }}); }
function bossBar(){ const b=$('#bossBar'), M=MEGA; if(!b) return; const on=!!M&&S&&S.kind==='retreat'; b.hidden=!on; if(!on) return;
  b.querySelector('.mg i').style.width=Math.max(0,M.hp/M.max*100)+'%'; b.querySelector('.op i').style.width=Math.max(0,M.opt/M.optMax*100)+'%'; b.querySelector('.mg b').textContent=Math.max(0,M.hp)+'/'+M.max; b.querySelector('.op b').textContent=Math.max(0,M.opt)+'/'+M.optMax; }
function drawCsgt(list,now){ drawMega(list); bossBar(); const lt=Math.floor(clock*4)%2, c=S.kind==='retreat'&&CSGT_POST;
  if(c){ if(c.dx==null) c.dx=c.x; c.dx+=(c.x-c.dx)*Math.min(1,.05*60*(1/60)); const x=c.dx*T, y=SD.CSGT.y*T;
    const dmg=SD.CSGT.riot.truckHp-(c.hp==null?SD.CSGT.riot.truckHp:c.hp); if(dmg>=3&&Math.random()<(c.wreck?.5:.15)) fx.push({kind:'dust',x:(c.kind==='chot'?x+34:x)+(Math.random()-.5)*30,y:(c.kind==='chot'?y-40:y-18),vx:(Math.random()-.5)*8,vy:-20-Math.random()*20,t:0,life:1.4});   // khói bốc từ xe móp
    if(c.kind==='chot'){ list.push({y:y-26,d:()=>{ const s=ptruck('',lt,dmg); shadow(x+34,y-24,30); drawFlip(s.c,x+34,y-22,s.ax,s.ay,false); }});
      for(const dx of [-44,-22,22]) list.push({y:y+10,d:()=>{ const s=CONE(); drawFlip(s.c,x+dx,y+10,s.ax,s.ay,false); }});
      if(c.ko) list.push({y,d:()=>{ const fr=csgtAv().anims.idle.frames[0], X=Math.round(x-cam.x), Y=Math.round(y-cam.y); ctx.save(); ctx.translate(X,Y-6); ctx.rotate(-Math.PI/2); ctx.drawImage(fr,-24,-16); ctx.restore();   /* chú CSGT nằm đo đất */
        for(let k=0;k<3;k++){ const a=clock*4+k*2.1; ctx.fillStyle='#ffd84a'; ctx.fillRect(Math.round(X+Math.cos(a)*10),Math.round(Y-22+Math.sin(a)*3),2,2); } }});
      else list.push({y,d:()=>{ drawChar(ctx,csgtAv(),x,y,P.x<x?-1:1,'side','idle','',clock,clock,0); ctx.fillStyle='#f4f4f1'; ctx.fillRect(Math.round(x-cam.x+(P.x<x?-9:7)),Math.round(y-cam.y-22),2,9); }}); }
    else list.push({y,d:()=>{ const s=ptruck('',lt,dmg); shadow(x,y,30); drawFlip(s.c,x,y+2,s.ax,s.ay,c.dir<0); }}); }
  CRASHES=CRASHES.filter(m=>now-m.t0<3500); for(const m of CRASHES) list.push({y:m.y-1,d:()=>{ const b=bikeOf(0,m.model,'fallen'); drawFlip(b.c,m.x+m.face*10,m.y+2,b.ax,b.ay,m.face<0); }});   // xe đổ nằm lăn ra đường
  IMPOUNDS=IMPOUNDS.filter(m=>now-m.t0<7000); for(const m of IMPOUNDS){ const k=(now-m.t0)/1000, tx=k<1?m.x-36-(1-k)*260:k<2?m.x-36:m.x-36+(k-2)*110;
    list.push({y:m.y-2,d:()=>{ const s=ptruck(k>=1.6?m.model:'',lt); shadow(tx,m.y-2,30); drawFlip(s.c,tx,m.y,s.ax,s.ay,false);
      if(k>=1&&k<1.6){ const b=bikeOf(0,m.model,''), u=(k-1)/.6; drawFlip(b.c,m.x+(tx-28-m.x)*u,m.y-u*26,b.ax,b.ay,false); } }}); } }
function drawKeYard(list,now){ const Y=SD.KE_YARD;
  (G.animals||[]).forEach((a,i)=>{ if(a.loc!=='ke') return; const t=clock*.25+i*7.3, x=Y.x0+.5+(Math.sin(t*.7+i)*.5+.5)*(Y.x1-Y.x0-1), y=Y.y0+.8+(Math.cos(t*.53+i*2)*.5+.5)*(Y.y1-Y.y0-1.4), f=Math.cos(t*.7+i)>0?1:-1, ready=a.cyc&&now>=a.cyc;
    list.push({y:y*T,d:()=>{ drawFlip(animalSpr('ga',Math.floor(clock*4+i)%2).c,x*T,y*T,6,10,f<0); if(ready) marker(x*T,y*T-20,'?'); else if(!a.cyc) marker(x*T,y*T-20,'!','#7fe0ff'); }}); }); }
function drawRace(list){ const TR=Wd.TRACK; if(!RACE) return; const v=RACE;
  v.riders.forEach((r,i)=>{ const lane=TR.lanes[i]; if(lane===undefined) return; r._x=r._x??TR.x0*T; const tx=(TR.x0+(TR.x1-TR.x0)*r.dist/v.track)*T; r._x+=(tx-r._x)*.08;
    const x=r._x, y=(lane+1)*T, run=v.st==='run'&&Math.abs(tx-r._x)>1;
    const av=i===v.me?P.av:([...REM.values()].find(q=>q.name===r.name)||{}).av;
    list.push({y,d:()=>{ const gal=run||v.st==='run', f=Math.floor(clock*(run?12:3))%4; shadow(x,y,14); drawMounted(av||r.bot&&BOTAV(i),x,y,1,'horse',{spr:saddled(i%4,f,gal),bob:gal&&f%2?1:0});
      ctx.fillStyle=['#c4382e','#3f6e9a','#f2c43d','#5a8d64','#f2a6b8','#f4f1ea'][i]; ctx.fillRect(Math.round(x-cam.x)-12,Math.round(y-cam.y)-18,4,5); }}); }); }
function drawLights(cx,cy){ const h=vn().hf, on=h>=17.5||h<6;
  for(const [[ax,ay],[bx,by]] of S.map.lights||[]){ const x0=ax*T-cx, y0=ay*T-26-cy, x1=bx*T-cx, y1=by*T-26-cy, n=Math.ceil(Math.hypot(x1-x0,y1-y0)/5);
    ctx.fillStyle='rgba(40,30,20,.7)'; for(let i=0;i<=n*2;i++){ const t=i/(n*2); ctx.fillRect(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6),1,1); }
    for(let i=1;i<n;i++){ const t=i/n, x=Math.round(x0+(x1-x0)*t), y=Math.round(y0+(y1-y0)*t+Math.sin(t*Math.PI)*6)+1;
      ctx.fillStyle=on||(i+Math.floor(clock*2))%3?'#ffd86b':'#c9a84a'; ctx.fillRect(x,y,1,2); if(on){ ctx.fillStyle='rgba(255,216,107,.22)'; ctx.fillRect(x-2,y-1,5,5); } } } }
function drawFx(f,cx,cy){ const k=f.t/f.life, X=Math.round(f.x-cx), Y=Math.round(f.y-cy);
  if(f.kind==='num'){ if(f.t<0) return; ctx.font='16px VT323, monospace'; ctx.textAlign='center'; const y=Math.round(Y-f.t*22); ctx.fillStyle=`rgba(28,21,22,${1-k})`; ctx.fillText(f.txt,X+1,y+1); ctx.fillStyle=f.col||'#ffd84a'; ctx.globalAlpha=1-k; ctx.fillText(f.txt,X,y); ctx.globalAlpha=1; return; }
  if(f.kind==='pee'){ if(f.t<0) return; const g=Math.min(1,f.t/2.5), a=.55*(k<.6?1:(1-k)/.4); for(let i=0;i<5;i++){ const ox=Math.round(Math.cos(i*1.3+f.s)*g*9), oy=Math.round(Math.sin(i*1.9+f.s)*g*4), r=Math.round(3+g*(7+i%3*2));
      ctx.fillStyle=`rgba(232,212,64,${a})`; ctx.beginPath(); ctx.ellipse(X+ox,Y+oy,r,Math.max(1,Math.round(r*.5)),0,0,Math.PI*2); ctx.fill(); } return; }
  if(f.kind==='dust'){ ctx.fillStyle=`rgba(230,220,200,${1-k})`; ctx.fillRect(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),2,2); }
  if(f.kind==='note'){ ctx.fillStyle=`rgba(255,216,74,${1-k})`; const x=Math.round(X+Math.sin(f.t*6)*3), y=Math.round(Y-f.t*16); ctx.fillRect(x,y,2,2); ctx.fillRect(x+1,y-4,1,4); ctx.fillRect(x+1,y-4,2,1); }
  if(f.kind==='heart'){ ctx.fillStyle=`rgba(255,90,120,${1-k})`; const y=Math.round(Y-f.t*14); ctx.fillRect(X-2,y,2,2); ctx.fillRect(X+1,y,2,2); ctx.fillRect(X-2,y+1,5,2); ctx.fillRect(X-1,y+3,3,1); ctx.fillRect(X,y+4,1,1); }
  if(f.kind==='z'){ ctx.fillStyle=`rgba(240,240,255,${1-k})`; const y=Math.round(Y-f.t*10); ctx.fillRect(X,y,3,1); ctx.fillRect(X+1,y+1,1,1); ctx.fillRect(X,y+2,3,1); }
  if(f.kind==='spark'){ ctx.fillStyle=`rgba(127,224,255,${1-k})`; ctx.fillRect(X,Y-Math.round(f.t*8),1,1); }
  if(f.kind==='fly'){ ctx.fillStyle=`rgba(40,40,30,${1-k})`; ctx.fillRect(X+Math.round(Math.sin(f.t*20)*3),Y-Math.round(f.t*6),1,1); }
  if(f.kind==='splash'){ ctx.fillStyle=`rgba(240,250,255,${1-k})`; ctx.fillRect(X-1,Y-Math.round(k*4),1,1); ctx.fillRect(X+2,Y-Math.round(k*3),1,1); ctx.fillRect(X,Y,2,1); }
  if(f.kind==='wake'){ ctx.fillStyle=`rgba(216,239,255,${(1-k)*.8})`; ctx.fillRect(X-Math.round(k*6),Y,2+Math.round(k*10),1); }
  if(f.kind==='glint'){ ctx.fillStyle=`rgba(255,240,140,${1-k})`; const r=Math.round(2+k*8); ctx.fillRect(X-r,Y,r*2+1,1); ctx.fillRect(X,Y-r,1,r*2+1); }
  if(f.kind==='steam'||f.kind==='bubble'){ ctx.fillStyle=`rgba(255,255,255,${(1-k)*.7})`; ctx.fillRect(X,Y-Math.round(f.t*10),2,2); }
  if(f.kind==='dmg'){ ug.save(); } }
// tên, khung chat, thanh máu/vật tay vẽ ở độ phân giải màn hình
function drawOverlay(){ ug.setTransform(DPR,0,0,DPR,0,0); ug.clearRect(0,0,innerWidth,innerHeight); ug.font='16px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom';
  const sx=x=>(x-cam.x)*SCALE, sy=y=>(y-cam.y)*SCALE, t=performance.now();
  const tag=(x,y,name,sub,col)=>{ const w=ug.measureText(name).width+8; ug.fillStyle='rgba(28,22,30,.72)'; ug.fillRect(x-w/2,y-16,w,16); ug.fillStyle=col||'#fff3d6'; ug.fillText(name,x,y-1); if(sub){ ug.fillStyle='#ffd84a'; ug.fillText(sub,x,y-17); } };
  const bubble=(x,y,text)=>{ const lines=wrap(text,26), w=Math.max(...lines.map(l=>ug.measureText(l).width))+14, h=lines.length*15+8, X=x-w/2, Y=y-h-6;
    ug.fillStyle='#1c1516'; ug.fillRect(X-2,Y-2,w+4,h+4); ug.fillStyle='#fbfaf6'; ug.fillRect(X,Y,w,h); ug.fillRect(x-3,Y+h,6,4); ug.fillStyle='#1c1516'; lines.forEach((l,i)=>ug.fillText(l,x,Y+15+i*15)); };
  for(const r of REM.values()){ if(!r.av||(r.fl&SD.FL.incar)) continue; const X=sx(r.x), Y=sy(r.y-46); if(X<-60||Y<-40||X>innerWidth+60||Y>innerHeight+40) continue;
    tag(X,Y,r.name+' · '+r.lv,r.tag,r.tag?'#9fe0ff':'#fff3d6'); if(r.chat&&t<r.chat.until) bubble(X,Y-18,r.chat.m); }
  if(P.av&&P.chat&&t<P.chat.until) bubble(sx(P.x),sy(P.y-46)-2,P.chat.m);
  for(const n of npcs) if(!STORY[n.id]&&Math.hypot(n.x-P.x,n.y-P.y)<90) tag(sx(n.x),sy(n.y-46),SD.NPC_LOOKS[n.id].name,'','#ffd84a');
  // ô tô đang chạy: ảnh mặt tài xế + người ngồi ghế phụ trên nóc xe, kèm số người
  if(S.kind==='retreat'&&PCAR&&PCAR.driving){ const dr=PCAR.driving===NET.pid?P:REM.get(PCAR.driving); if(dr){ const ids=[PCAR.driving,...(PCAR.pass||[])], fs=26, X=sx(dr.x)-ids.length*(fs+4)/2, Y=sy(dr.y)-50*SCALE/3-fs;
    ug.imageSmoothingEnabled=false; ids.forEach((id,i)=>{ const who=id===NET.pid?P:REM.get(id), pc=who&&who.av&&who.av.portrait; ug.fillStyle='#1c1516'; ug.fillRect(X+i*(fs+4)-2,Y-2,fs+4,fs+4); ug.fillStyle=i?'#f3ecdc':'#ffd84a'; ug.fillRect(X+i*(fs+4),Y,fs,fs); if(pc) ug.drawImage(pc,X+i*(fs+4),Y,fs,fs); });
    ug.font='15px VT323, monospace'; tag(sx(dr.x),Y-4,`🚗 ${ids.length}/${SD.PCAR.seats+1} người`,'','#ffd84a'); ug.font='16px VT323, monospace'; } }
  // tên người đang thuê ngoài cửa từng nhà ở Ké
  if(S.kind==='retreat') for(const [rk,names] of Object.entries(STAYS)){ const R=SD.ROOMS[rk]; if(!R||!R.doors||!names.length) continue; const [dx,dy]=R.doors[0]; if(Math.hypot(dx*T-P.x,dy*T-P.y)>220) continue;
    ug.font='14px VT323, monospace'; tag(sx(dx*T),sy(dy*T-30),'🏠 '+names.slice(0,3).join(', ')+(names.length>3?` +${names.length-3}`:''),'',names.includes(G.name)?'#ffd84a':'#fff3d6'); } ug.font='16px VT323, monospace';
  if(HOVER){ const X=sx(HOVER.x), Y=sy(HOVER.y), p=2+Math.sin(t/150)*2; ug.strokeStyle='#ffd84a'; ug.lineWidth=2; ug.beginPath(); ug.ellipse(X,Y,14*SCALE/3+p,5*SCALE/3+p/2,0,0,7); ug.stroke(); ug.font='16px VT323, monospace'; tag(X,Y-44*SCALE/3,'🖱 '+HOVER.label,'','#ffd84a'); }
  if(DEST&&t-DEST.t<900){ const k=(t-DEST.t)/900, X=sx(DEST.x), Y=sy(DEST.y), a=1-k*k, r=(1-k)*26+8, s=SCALE*2.2;
    ug.strokeStyle=`rgba(127,224,255,${a})`; ug.lineWidth=2; ug.beginPath(); ug.ellipse(X,Y,r,r*.4,0,0,7); ug.stroke();
    ug.fillStyle=`rgba(127,224,255,${a})`; for(let q=0;q<4;q++){ const an=q*Math.PI/2+Math.PI/4, px=X+Math.cos(an)*r, py=Y+Math.sin(an)*r*.4; ug.save(); ug.translate(px,py); ug.rotate(an+Math.PI); ug.beginPath(); ug.moveTo(s,0); ug.lineTo(-s*.6,-s*.7); ug.lineTo(-s*.6,s*.7); ug.closePath(); ug.fill(); ug.restore(); }
    const by=Y-34-Math.abs(Math.sin(k*Math.PI*3))*10; ug.fillStyle=`rgba(255,216,74,${a})`; ug.strokeStyle=`rgba(28,21,22,${a})`; ug.beginPath(); ug.moveTo(X,by+12); ug.lineTo(X-9,by); ug.lineTo(X-3,by); ug.lineTo(X-3,by-10); ug.lineTo(X+3,by-10); ug.lineTo(X+3,by); ug.lineTo(X+9,by); ug.closePath(); ug.fill(); ug.stroke(); }
  for(const t of ANITAGS){ if(Math.hypot(t.x-P.x,t.y-P.y)>150) continue; ug.font='14px VT323, monospace'; tag(sx(t.x),sy(t.y),t.car?'🚗 Xe của Chika Phú':t.dog?`${t.dog} của ${t.n}`:`${ANI_NAME[t.k]||''} của ${t.n}`,'',t.me?'#ffd84a':'#fff3d6'); } ug.font='16px VT323, monospace';
  if(S.kind==='dalat') for(const L of LANDS){ const b=landBox(L); if(!b) continue; const X=sx(b.x0*T+3), Y=sy(b.y0*T-15); if(X<-80||Y<-30||X>innerWidth+80||Y>innerHeight+30) continue; tag(X,Y,'Đất thuê: '+L.n,'',L.n===G.name?'#ffd84a':'#fff3d6'); }
  // vật tay / đánh nhau
  for(const s of SOCS.values()){ const a=s.a===NET.pid?{x:P.x,y:P.y}:REM.get(s.a), b=s.b===NET.pid?{x:P.x,y:P.y}:REM.get(s.b); if(!a||!b) continue;
    const X=sx((a.x+b.x)/2), Y=sy(Math.min(a.y,b.y)-58);
    if(s.kind==='vattay'&&s.score){ const tot=s.score.a+s.score.b||1, k=s.score.a/tot; ug.fillStyle='#1c1516'; ug.fillRect(X-62,Y-12,124,12); ug.fillStyle='#ff6a55'; ug.fillRect(X-60,Y-10,120*k,8); ug.fillStyle='#7fe0ff'; ug.fillRect(X-60+120*k,Y-10,120*(1-k),8);
      ug.fillStyle='#fff3d6'; ug.fillText(`VẬT TAY ${Math.ceil(s.left||0)}s · bấm SPACE liên tục`,X,Y-14); }
    if(s.kind==='danhnhau'&&s.hp){ for(const [p,hp,dx] of [[a,s.hp.a,-1],[b,s.hp.b,1]]){ const x=sx(p.x), y=sy(p.y-50); ug.fillStyle='#1c1516'; ug.fillRect(x-22,y-8,44,7); ug.fillStyle=hp>40?'#7de07a':'#ff6a55'; ug.fillRect(x-21,y-7,42*Math.max(0,hp)/100,5); } ug.fillStyle='#fff3d6'; ug.fillText('ĐÁNH NHAU · J đấm · X bỏ cuộc',X,Y-2); } }
  if(FISH&&FISH.st==='bite'){ ug.fillStyle='#ff6a55'; ug.font='32px VT323, monospace'; ug.fillText('! E',sx(P.x),sy(P.y-50)); }
  if(TASK){ const k=Math.min(1,(performance.now()-TASK.start)/(TASK.end-TASK.start)), X=innerWidth/2, Y=innerHeight-170; ug.fillStyle='#1c1516'; ug.fillRect(X-122,Y-12,244,26); ug.fillStyle='#3a2f40'; ug.fillRect(X-120,Y-10,240,22); ug.fillStyle='#7de07a'; ug.fillRect(X-120,Y-10,240*k,22); ug.fillStyle='#fff3d6'; ug.font='18px VT323, monospace'; ug.fillText(TASK.name||'Đang làm...',X,Y+9); }
  if(S.kind==='deo'&&STUNT&&!STUNT.pick){ const now=NET.now(), W=innerWidth, Y=innerHeight-170;
    STUNT.cues.forEach((c,i)=>{ if(now<c-STUNT.lead||now>c+STUNT.window+250||STUNT.res[i]&&STUNT.res[i]!=='sent') return; const k=(now-(c-STUNT.lead))/(STUNT.lead+STUNT.window), mk=STUNT.lead/(STUNT.lead+STUNT.window);
      ug.fillStyle='rgba(28,22,30,.85)'; ug.fillRect(W/2-210,Y-46,420,76); ug.font='30px VT323, monospace'; ug.fillStyle='#ffd84a'; ug.fillText('CHUẨN BỊ BỐC ĐẦU! bấm SPACE',W/2,Y-14);
      ug.fillStyle='#3a2f40'; ug.fillRect(W/2-180,Y,360,14); ug.fillStyle='#ff6a55'; ug.fillRect(W/2-180+mk*360-5,Y-4,10,22); ug.fillStyle='#7fe0ff'; ug.fillRect(W/2-180+Math.min(1,k)*360-2,Y-2,4,18); });
    if(STUNT.msgT>performance.now()){ ug.font='44px VT323, monospace'; ug.fillStyle=STUNT.last==='ok'?'#7de07a':'#ff6a55'; ug.fillText(STUNT.last==='ok'?'BỐC ĐẦU!':STUNT.last==='fall'?'XOÈ XE!':'TRƯỢT...',W/2,innerHeight*.3); }
    ug.font='18px VT323, monospace'; ug.fillStyle='#fff3d6'; ug.fillText(`Bốc đầu ${Object.values(STUNT.res).filter(x=>x==='ok').length}/${STUNT.cues.length} · đường đèo nguy hiểm, có thể bị công an bắt`,W/2,60); }
  if(S.kind==='phongbay'&&DANCE) UI.danceOverlay&&UI.danceOverlay(ug);
  if(S.kind==='track'&&RACE){ RACE.riders.forEach((r,i)=>{ const lane=Wd.TRACK.lanes[i]; if(lane===undefined||r._x===undefined) return; tag(sx(r._x),sy((lane+1)*T-30),`#${i+1} ${r.name}`,r.j||'',i===RACE.me?'#7de07a':'#fff3d6'); }); UI.raceOverlay&&UI.raceOverlay(ug,sx,sy); } }
function wrap(s,n){ const w=String(s).split(' '), out=[]; let cur=''; for(const x of w){ if((cur+' '+x).trim().length>n&&cur){ out.push(cur); cur=x; } else cur=(cur+' '+x).trim(); } if(cur) out.push(cur); return out.slice(0,4); }

/* ---------- HUD ---------- */
function renderHUD(){ if(!G) return; const t=vn(), d=SD.WEEKDAYS[t.wd];
  $('#hudDay').textContent=d; $('#hudTime').textContent=`${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}`;
  $('#hudMoney').textContent=fmt(G.money);
  const L=SD.RULES.levels, lo=L[G.level-1]||0, hi=L[G.level]||lo+1; $('#hudLevel').textContent='Cấp '+G.level+' · '+G.name+' · 📚 '+((G.stats||{}).know||0);
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
  for(const q of Object.keys(Q).filter(q=>G.quests[q]==='active')) li.push(`<li class="${canFinish(q)?'ready':''}"><b>${Q[q].title} <button class="qgo" type="button" data-go="${q}" title="Tự đi tới">➜</button></b><span>${canFinish(q)?'Quay lại gặp '+speakerName(Q[q].giver):questProgress(q)}</span></li>`);
  if(job&&job.hired&&job.today.workday) li.push(`<li><b>Everfit ${job.today.remote?'(remote)':''}</b><span>${job.today.done.length}/${job.today.tasks.length} task · ${job.today.inHours?'trong giờ làm':'ngoài giờ'}</span></li>`);
  if(G.cookOrder){ const r=SD.RECIPES[G.cookOrder.r]; li.push(`<li><b>Nấu ${r.name}</b><span>${Object.entries(r.need).map(([k,c])=>`${SD.ITEMS[k].name} ${Math.min(G.items[k]||0,c)}/${c}`).join(' · ')}</span></li>`); }
  if(G.jail&&G.jail.until>NET.now()) li.push(`<li><b class="bad">Đang bị tạm giữ</b><span>Còn ${Math.ceil((G.jail.until-NET.now())/1000)} giây · nộp phạt ${fmt(G.jail.fine)} để về sớm</span></li>`);
  if(job&&job.hired&&job.today&&job.today.ot&&!job.today.otDone) li.push(`<li><b>OT tối nay</b><span>${SD.WORK_TASKS[job.today.ot].name} · ${SD.JOB.ot.from}:00–${SD.JOB.ot.to}:00 ở văn phòng</span></li>`);
  if(HERD) li.push(`<li><b>Chăn ngựa</b><span>${HERD.phase==='go'?'Dắt đàn ra đồng cỏ':'Dắt về chuồng anh Phong'}</span></li>`);
  li.push(`<li><b>Chỗ ngủ</b><span>${G.stay?SD.ROOMS[G.stay.room].name+(G.stay.paid===t.day?' · đã trả hôm nay':' · chưa trả'):'Chưa thuê phòng ở Ké'}</span></li>`);
  const done=Object.keys(Q).filter(q=>G.quests[q]==='done').length;
  // vườn & chuồng thu gọn ngay dưới việc cần làm: mỗi dòng 1 ô rau / 1 con, thanh thời gian tới lúc thu / cho ăn
  const now=NET.now(), fl=[], bar=(k,col)=>`<i class="fbar"><i style="width:${Math.round(Math.max(0,Math.min(1,k))*100)}%;background:${col}"></i></i>`, mm=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return s>=3600?Math.floor(s/3600)+'g'+String(Math.floor(s%3600/60)).padStart(2,'0'):s>=60?Math.floor(s/60)+'p':s+'s'; };
  const go=(map,x,y,n)=>`data-map="${map}" data-x="${x}" data-y="${y}" data-n="${esc(n)}"`, grp=new Map();
  // gộp cùng loại + cùng trạng thái thành 1 dòng (Vịt ×8 · đói), đang lớn thì lấy con xong sớm nhất
  const add=(key,t,n,html)=>{ const e=grp.get(key); if(!e) grp.set(key,{t,n:1,name:n,html}); else { e.n++; if(t<e.t){ e.t=t; e.html=html; } } };
  for(const [id,p] of Object.entries(PLOTS)){ if(p.o!==NET.pub) continue; const c=SD.CROPS[p.c]; if(!c) continue; const ripe=p.at+c.grow*1000, gr=(p.g||SD.FARM.grace)*1000, ke=id[0]==='k', d=ke?SD.FARM.plots[+id.slice(1)]:SD.DALAT.plots[+id.slice(1)];
    add(p.c+(now<ripe?':g':ke&&now<ripe+gr?':r':':o')+(ke?'k':'d'),ripe,c.name,`<li class="frow ${now>=ripe?'ready':''}" ${go(ke?'retreat':'dalat',d.x,d.y+1,c.name)}><b>${c.name}@@</b>${now<ripe?bar(1-(ripe-now)/(c.grow*1000),'#7de07a')+`<span>${mm(ripe-now)}</span>`:ke&&now<ripe+gr?bar(1,'#ffd84a')+`<span>thu ngay · ${mm(ripe+gr-now)}</span>`:bar(1,ke?'#ff6a55':'#ffd84a')+`<span>${ke?'bị cướp được!':'chín'}</span>`}</li>`); }
  for(const a of G.animals||[]){ const A=SD.ANIMALS[a.k]; if(!A) continue; const t=a.cyc||0, ke=a.loc==='ke', pen=ke?SD.KE_YARD:SD.DALAT.pens[a.k]||{x:0,y:0};
    add(a.k+(!t?':h':now<t?':g':':r')+(ke?'k':'d'),t||0,A.name,`<li class="frow ${t&&now>=t?'ready':''}" ${go(ke?'retreat':'dalat',pen.x,pen.y+(ke?3:1),A.name)}><b>${A.name}@@</b>${!t?bar(0,'#ff6a55')+'<span>đói</span>':now<t?bar(1-(t-now)/(A.cycle*1000),'#7fe0ff')+`<span>${mm(t-now)}</span>`:bar(1,'#ffd84a')+'<span>thu</span>'}</li>`); }
  for(const e of grp.values()) fl.push([e.t,e.html.replace('@@',e.n>1?` ×${e.n}`:'')]);
  const farm=fl.length?`<h4 class="fhead"><span>Vườn & chuồng <small>${fl.length}</small></span><button id="fOpen" type="button" aria-label="Mở bảng vườn và chuồng">F</button></h4><ul class="flist">${fl.sort((a,b)=>a[0]-b[0]).slice(0,8).map(x=>x[1]).join('')}</ul>`:'';
  $('#hudQuests').innerHTML=`<h4><span>Việc cần làm <small>Ké ${done}/${Object.keys(Q).length}</small></span><button id="qToggle" type="button" aria-label="Thu gọn bảng việc">${document.body.classList.contains('qmin')?'▸':'▾'}</button></h4><ul>${li.join('')}</ul>${farm}`;
  const inv=Object.entries(G.items); $('#hudItems').innerHTML=[...Array(8)].map((_,i)=>{ const it=inv[i]; if(!it) return '<div class="slot"></div>';
    return `<div class="slot" title="${SD.ITEMS[it[0]]?SD.ITEMS[it[0]].name:it[0]}"><img src="${icon64(it[0])}" alt="">${it[1]>1?`<i>${it[1]}</i>`:''}</div>`; }).join('')+`<button class="slot more" id="btnBag" title="Túi đồ (I)">I<br>túi</button>`;
  const hot=Object.entries(SD.SKILLS).filter(([k,s])=>G.skills[k]&&s.key!=='E'&&s.key!=='-'), learned=Object.entries(SD.SKILLS).filter(([k,s])=>G.skills[k]&&(s.key==='E'||s.key==='-'));
  $('#hudSkills').innerHTML=hot.map(([k,s])=>`<div class="sk" title="${s.name}: ${s.desc}"><kbd>${s.key}</kbd><span>${s.name}</span></div>`).join('');   // kỹ năng học được (dùng E) xem trong menu Esc / túi đồ
  $('#hudOnline').textContent=REM.size?`${REM.size} người quanh đây`:'';
  $('#btnHome').hidden=!(G.stay&&G.stay.paid===t.day)||(S&&S.kind==='stay'&&S.own); }
const ICO={}; function icon64(k){ return ICO[k]||(ICO[k]=A.icon(SD.ITEMS[k]?SD.ITEMS[k].icon:k,3).toDataURL()); }
document.addEventListener('click',e=>{ if(e.target.closest('#btnBag')) UI.bag(); });

/* ---------- minimap + bản đồ ---------- */
// dấu tích xanh trong ô vuông viền đen (phòng đã thuê)
function tick(g,X,Y,small){ const r=small?4:5; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=small?'#4fbf5a':'#7de07a'; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2);
  g.fillStyle='#1c1516'; const x=Math.round(X-3), y=Math.round(Y); g.fillRect(x,y,2,2); g.fillRect(x+2,y+1,1,2); g.fillRect(x+3,y-1,1,2); g.fillRect(x+4,y-2,1,2); g.fillRect(x+5,y-3,1,2); }
const MINI_COL={q:'#eef0ee',k:'#23263a',w:'#946542',o:'#2a6eb0',p:'#8fc4c8',m:'#f2f2ef',y:'#ffd400',M:'#b84a3a',Z:'#e2c9a2',I:'#e9f0f2',O:'#a7744c',H:'#5a4a40',U:'#a9a49a',J:'#c9a35e',A:'#4fa84a',n:'#2a2236',g:'#9fc7d9',G:'#79b34a',F:'#3f7a31',P:'#d6c39b',T:'#d6c39b',S:'#cbc6ba',R:'#55555c',D:'#e3d2a2',W:'#3b8ed3',K:'#a26c40',L:'#43c5e3',E:'#e6e0d2',X:'#8d8880',C:'#c9a877',Q:'#a26c40',B:'#b0643c',Y:'#8a5a3a'};
let miniBase=null;
function buildMini(){ const m=S.map, c=A.cv(S.W,S.H), g=c.getContext('2d'); for(let y=0;y<S.H;y++) for(let x=0;x<S.W;x++){ g.fillStyle=MINI_COL[m.grid[y][x]]||'#3f7a31'; g.fillRect(x,y,1,1); } miniBase=c; }
function drawMini(){ const box=$('#minimap'); if(!S||(S.kind!=='retreat'&&S.kind!=='dalat')){ box.hidden=true; document.body.classList.add('nomini'); return; } box.hidden=false; document.body.classList.remove('nomini'); if(!miniBase) buildMini();
  const c=$('#miniCv'), g=c.getContext('2d'), TW=40, TH=28, k=c.width/TW, sx=Math.max(0,Math.min(S.W-TW,P.x/T-TW/2)), sy=Math.max(0,Math.min(S.H-TH,P.y/T-TH/2));
  g.imageSmoothingEnabled=false; g.drawImage(miniBase,sx,sy,TW,TH,0,0,c.width,c.height);
  const dot=(x,y,col,r=2)=>{ const X=(x/T-sx)*k, Y=(y/T-sy)*k; if(X<-3||Y<-3||X>c.width+3||Y>c.height+3) return; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=col; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2); };
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea');
  for(const r of REM.values()) dot(r.x,r.y,'#7fe0ff',1);
  // người chơi ở gần (trong khung minimap): hiện tên nhỏ trên chấm
  g.font='10px VT323, monospace'; g.textAlign='center'; for(const r of REM.values()){ if(!r.name) continue; const X=(r.x/T-sx)*k, Y=(r.y/T-sy)*k; if(X<0||Y<8||X>c.width||Y>c.height) continue;
    const w=g.measureText(r.name).width+4; g.fillStyle='rgba(28,21,22,.8)'; g.fillRect(Math.round(X-w/2),Math.round(Y-12),Math.ceil(w),9); g.fillStyle='#7fe0ff'; g.fillText(r.name,Math.round(X),Math.round(Y-4)); }
  // dấu tích phòng đã thuê; nằm ngoài khung thì ghim ở mép chỉ hướng
  if(S.kind==='retreat'&&G.stay&&G.stay.paid===vn().day){ const [dx_,dy_]=SD.ROOMS[G.stay.room].doors[0]; let X=(dx_-sx)*k, Y=(dy_-sy)*k; const out=X<4||Y<4||X>c.width-4||Y>c.height-4;
    X=Math.max(5,Math.min(c.width-5,X)); Y=Math.max(5,Math.min(c.height-5,Y)); tick(g,X,Y,out); }
  if(Math.floor(clock*3)%3) dot(P.x,P.y,'#ff4a3d',2);
  $('#miniZone').textContent=zoneName||S.map.name; }
$('#minimap').addEventListener('click',()=>toggleMap());
$('#mapClose').addEventListener('click',()=>{ $('#mapView').hidden=true; });
$('#mapView').addEventListener('click',e=>{ if(e.target.id==='mapView') $('#mapView').hidden=true; });   // bấm ra ngoài cũng đóng
let MAPHIT=[], MAPHOV='';
$('#mapCv').addEventListener('mousemove',e=>{ const rc=e.target.getBoundingClientRect(), x=(e.clientX-rc.left)*e.target.width/rc.width, y=(e.clientY-rc.top)*e.target.height/rc.height, h=MAPHIT.find(m=>x>=m.x0&&x<=m.x1&&y>=m.y0&&y<=m.y1);
  const n=h?h.name:''; e.target.style.cursor=h?'pointer':''; e.target.title=h?'Bấm để tự đi tới '+h.name:''; if(n!==MAPHOV){ MAPHOV=n; drawMap(); } });
$('#mapCv').addEventListener('click',e=>{ const h=MAPHIT.find(m=>m.name===MAPHOV); if(!h) return; e.stopPropagation(); $('#mapView').hidden=true; MAPHOV=''; walkTo(h.tx,h.ty,h.name); });
// chuột phải bất kỳ chỗ nào trên bản đồ lớn: tự đi tới đó (có mũi tên đích như ngoài màn chơi)
$('#mapCv').addEventListener('contextmenu',e=>{ e.preventDefault(); e.stopPropagation(); const c=e.target, rc=c.getBoundingClientRect(), k=c.width/(S.W*T), wx=(e.clientX-rc.left)*c.width/rc.width/k, wy=(e.clientY-rc.top)*c.height/rc.height/k;
  $('#mapView').hidden=true; MAPHOV=''; DEST={x:wx,y:wy,t:performance.now()}; walkTo(wx/T,wy/T,'chỗ đã chọn'); });
function toggleMap(){ const v=$('#mapView'); if(S.kind!=='retreat'&&S.kind!=='dalat'){ toast('Bản đồ có ở Ké Retreat và nông trại Đà Lạt','lock'); return; } v.hidden=!v.hidden; if(!v.hidden) drawMap(); }
function drawMap(){ const c=$('#mapCv'), g=c.getContext('2d'), m=S.map, ret=S.kind==='retreat', sx=0, sy=0, sw=S.W*T, sh=S.H*T, k=Math.min((innerHeight*.84)/sh,(innerWidth*.9)/sw);   // cả map (Ké + thị trấn + vườn quốc gia + làng)
  c.width=Math.round(sw*k); c.height=Math.round(sh*k); g.imageSmoothingEnabled=false; if(!miniBase) buildMini(); g.drawImage(miniBase,sx/T,sy/T,sw/T,sh/T,0,0,c.width,c.height);
  g.fillStyle='rgba(30,60,30,.3)'; g.fillRect(0,0,c.width,c.height);
  for(const o of S.objs) if(o.house){ const s=o.spr; g.drawImage(s.c,(o.x-s.ax-sx)*k,(o.y-s.ay-sy)*k,s.c.width*k,s.c.height*k); }
  g.font=`${Math.max(13,Math.min(20,Math.round(13*k*2.4)))}px VT323, monospace`; g.textAlign='center';
  MAPHIT=[]; const doors=[...Object.values(SD.PLACES).filter(p=>p.door&&(p.map||'retreat')===S.kind).map(p=>p.door),...(ret?Object.values(SD.ROOMS).flatMap(r=>(r.doors||[]).map(([x,y])=>({x,y}))):[])];
  const fs=Math.max(13,Math.min(20,Math.round(13*k*2.4)));
  for(const dz of m.districts||[]){ const x=(dz.x*T-sx)*k, y=(dz.y*T-sy)*k, f=Math.max(22,Math.min(40,Math.round(22*k*2.2))); g.font=`${f}px VT323, monospace`; g.lineWidth=4; g.strokeStyle='rgba(28,21,22,.85)'; g.strokeText(dz.name,x,y); g.fillStyle='#ffe066'; g.fillText(dz.name,x,y); }   // tên khu to
  g.font=`${Math.max(13,Math.min(20,Math.round(13*k*2.4)))}px VT323, monospace`;
  for(const l of m.labels||[]){ const x=(l.x*T-sx)*k, y=(l.y*T-sy)*k-4, hov=MAPHOV===l.name; g.font=`${hov?fs+4:fs}px VT323, monospace`; const w=g.measureText(l.name).width+8, h=hov?19:15;
    g.fillStyle=hov?'#ffd84a':'rgba(28,21,22,.75)'; g.fillRect(x-w/2,y-h+3,w,h); if(hov){ g.strokeStyle='#1c1516'; g.lineWidth=2; g.strokeRect(x-w/2,y-h+3,w,h); } g.fillStyle=hov?'#1c1516':'#fff3d6'; g.fillText(l.name,x,y);
    const d=doors.map(o=>({o,d:Math.hypot(o.x-l.x,(o.y-l.y)*.6)})).filter(z=>z.d<6&&z.o.y>=l.y-1).sort((a,b)=>a.d-b.d)[0];   // nhà có cửa gần nhãn thì đi tới cửa
    MAPHIT.push({name:l.name,x0:x-w/2,y0:y-h+3,x1:x+w/2,y1:y+3,tx:d?d.o.x:l.x,ty:d?d.o.y+.6:l.y+1.5}); }
  g.font=`${fs}px VT323, monospace`;
  const dot=(x,y,col,r=4)=>{ g.fillStyle='#1c1516'; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r+1.5,0,7); g.fill(); g.fillStyle=col; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r,0,7); g.fill(); };
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea',3); for(const r of REM.values()) dot(r.x,r.y,'#7fe0ff',3);
  g.font=`${Math.max(12,fs-2)}px VT323, monospace`; for(const r of REM.values()){ if(!r.name) continue; const X=(r.x-sx)*k, Y=(r.y-sy)*k-8, w=g.measureText(r.name).width+6;   // tên người chơi khác trên bản đồ lớn
    g.fillStyle='rgba(16,40,56,.88)'; g.fillRect(X-w/2,Y-12,w,14); g.fillStyle='#7fe0ff'; g.fillText(r.name,X,Y-1); }
  g.font=`${fs}px VT323, monospace`;
  const stayOk=ret&&G.stay&&G.stay.paid===vn().day; if(stayOk) for(const [x,y] of SD.ROOMS[G.stay.room].doors){ const X=(x*T-sx)*k, Y=(y*T-sy)*k; g.save(); g.scale(2,2); tick(g,X/2,Y/2,false); g.restore(); }
  dot(P.x,P.y,'#ff4a3d',5);
  $('#mapTitle').textContent=ret?'Ké Retreat':'Nông trại bác Trang';
  $('#mapLegend').innerHTML='<span><i style="background:#ff4a3d"></i>Bạn</span><span><i style="background:#ffd84a"></i>Cả hội</span><span><i style="background:#f4f1ea"></i>Chủ quán, chủ trại</span><span><i style="background:#7fe0ff"></i>Người chơi khác</span><span>Chuột phải để tự đi tới chỗ bất kỳ</span>'+
    (stayOk?`<span><i style="background:#7de07a;border-radius:0"></i>Phòng của bạn: ${SD.ROOMS[G.stay.room].name} (bấm B để tự đi về)</span>`:''); }

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
  TASK={act:m.act,name:m.name,start:performance.now(),end:performance.now()+m.sec*1000,anim:{nghi:'sleep',tam:'shower',tiktok:'phone',songao:'phone',work:'work',hoc:'work',cook:'cook',herd:'',swim:'swim'}[m.act]||'',walk:m.act==='herd'}; });
NET.listen('bite',()=>{ UI.fishBite&&UI.fishBite(); });
NET.listen('lands',m=>{ LANDS=m.list||[]; }); NET.listen('stays',m=>{ STAYS=m.v||{}; }); NET.listen('pcar',m=>{ PCAR=m; if(m.driving!==NET.pid&&P.pcar){ P.pcar=false; } if(m.out||!m.driving) P.incar=false; }); NET.listen('moto',m=>{ if(m.off){ P.moto=null; } }); NET.listen('herds',m=>{ HERDS=m.list||[]; }); NET.listen('dogs',m=>{ DOGLIST=m.list||[]; });
NET.listen('mega',m=>{ const old=MEGA; MEGA=m.v; if(MEGA&&old){ MEGA.dx=old.dx; MEGA.dy=old.dy; } });
NET.listen('optimus',m=>{ OPT_ON=m.on||0; if(!m.on) P.opt=null; });
NET.listen('moto',m=>{ if(m.off){ P.moto=null; P.mountT=0; P.speeding=false; } });
NET.listen('csgt',m=>{ if('post' in m){ const old=CSGT_POST; CSGT_POST=m.post; if(m.post&&old) CSGT_POST.dx=old.dx; }
  if('stop' in m){ const was=CSGT_STOP; CSGT_STOP=m.stop; if(m.stop) UI.csgt(m.stop); else if(was) UI.closeAll(); } });
NET.listen('plots',m=>{ for(const [id,p] of Object.entries(m.list)) PLOTS[id]=p; });
NET.listen('plot',m=>{ if(m.p) PLOTS[m.id]=m.p; else delete PLOTS[m.id]; });
NET.listen('soc',m=>{ const key=m.a+':'+m.b;
  if(m.k==='start'){ SOCS.set(key,{kind:m.kind,a:m.a,b:m.b}); if(m.kind==='namtay'&&m.b===NET.pid) P.link=m.a; const mine=m.a===NET.pid||m.b===NET.pid;
    if(mine) toast({namtay:'Đang nắm tay · X để buông',hon:'Chụt! ♥',vattay:'Vật tay! Bấm SPACE thật nhanh',danhnhau:'Đánh nhau! J để đấm, X bỏ cuộc'}[m.kind],'quest'); }
  if(m.k==='prog'){ const s=SOCS.get(key); if(s){ s.score=m.score; s.left=m.left; } }
  if(m.k==='end'){ SOCS.delete(key); if(P.link===m.a&&m.b===NET.pid) P.link=null; if((m.a===NET.pid||m.b===NET.pid)&&m.kind!=='namtay'&&m.kind!=='hon') toast(m.win===NET.pid?'Bạn thắng!':m.win?'Bạn thua rồi':'Hoà!',m.win===NET.pid?'exp':''); } });
NET.listen('ev',m=>{ if(m.k==='treasure'){ sfx('level_up',.5); flash=.4; for(let i=0;i<6;i++) fx.push({kind:'glint',x:m.x+(Math.random()-.5)*20,y:m.y-6+(Math.random()-.5)*10,t:-i*.08,life:.7}); }
  if(m.k==='hit'){ for(const s of SOCS.values()) if((s.a===m.from&&s.b===m.to)||(s.b===m.from&&s.a===m.to)) s.hp=m.hp; if(m.to===NET.pid){ P.act='hurt'; P.actT=0; sfx('dash',.4); } }
  if(m.k==='lvl'){ const r=REM.get(m.id); if(r){ r.lv=m.lv; fx.push({kind:'note',x:r.x,y:r.y-40,t:0,life:1}); } }
  if(m.k==='csgtStop'){ whistleSnd(); bigText('TUÝT TUÝT! DỪNG XE KIỂM TRA'); }
  if(m.k==='megaCall'){ flash=.8; bigText('MEGATRON XUẤT HIỆN!'); crashSnd(); for(let k=0;k<24;k++) fx.push({kind:k%2?'glint':'dust',x:m.x*T+(Math.random()-.5)*60,y:m.y*T-20+(Math.random()-.5)*40,vx:(Math.random()-.5)*90,vy:-Math.random()*50,t:-k*.02,life:.9});
    if(Math.hypot(m.x*T-P.x,m.y*T-P.y)<30*T) setTimeout(()=>sayLine('Optimus Prime! Your end has come!'),700); }
  if(m.k==='megaHit'||m.k==='megaBoom'){ const X=m.x*T, Y=m.y*T-(m.k==='megaBoom'?0:20); fx.push({kind:'num',txt:'-'+m.n,x:X,y:Y-24,t:0,life:1,col:'#ff6a6a'}); for(let k=0;k<(m.k==='megaBoom'?14:6);k++) fx.push({kind:k%2?'glint':'dust',x:X+(Math.random()-.5)*26,y:Y+(Math.random()-.5)*20,vx:(Math.random()-.5)*70,vy:-Math.random()*40,t:0,life:.6});
    if(m.id===NET.pid){ flash=.3; P.act='hurt'; P.actT=0; } if(m.k==='megaBoom') crashSnd(); else tone('square',200,70,.25,.25,900); }
  if(m.k==='megaDmg'){ const X=m.x*T, Y=m.y*T-40; fx.push({kind:'num',txt:'-'+m.n,x:X,y:Y,t:0,life:1,col:'#ffd84a'}); for(let k=0;k<8;k++) fx.push({kind:'glint',x:X+(Math.random()-.5)*20,y:Y+10+(Math.random()-.5)*20,t:0,life:.5}); m.kind==='ram'?crashSnd():tone('square',260,90,.2,.25,1100); }
  if(m.k==='megaEnd'){ if(m.win){ flash=1; for(let k=0;k<40;k++) fx.push({kind:k%3?'dust':'glint',x:m.x*T+(Math.random()-.5)*70,y:m.y*T-24+(Math.random()-.5)*50,vx:(Math.random()-.5)*140,vy:-Math.random()*90,t:-k*.015,life:1.2}); crashSnd(); setTimeout(crashSnd,250);
      if(m.id===NET.pid){ bigText('ĐÁNH BẠI MEGATRON!'); setTimeout(()=>sayLine('Autobots, we are victorious!'),900); } } else if(m.id===NET.pid) bigText('OPTIMUS GỤC NGÃ...'); }
  if(m.k==='riot'){ flash=.25; for(let k=0;k<12;k++) fx.push({kind:k%2?'glint':'dust',x:m.x+(Math.random()-.5)*30,y:m.y-10+(Math.random()-.5)*20,vx:(Math.random()-.5)*80,vy:-Math.random()*40,t:-k*.02,life:.6});
    if(Math.hypot(m.x*T-P.x,m.y*T-P.y)<24*T){ if(m.op==='smash'){ crashSnd(); if(m.wreck&&m.id===NET.pid) bigText('XE CSGT NÁT BÉT!'); } else tone('square',220,80,.25,.25,900); } }
  if(m.k==='arrest'){ if(m.id===NET.pid){ P.opt=null; whistleSnd(); bigText('BỊ BẮT! VỀ ĐỒN'); } else toast(`${esc(m.name)} (Optimus Prime) bị lực lượng cơ động bắt về đồn!`,'lock'); }
  if(m.k==='transform'){ const near=Math.hypot(m.x-P.x,m.y-P.y)<26*T, was=OPT_FORM[m.id]||'human'; OPT_FORM[m.id]=m.to; if(near){ transformSnd(); if(m.to==='robot'&&was==='human') setTimeout(()=>sayLine('I am Optimus Prime'),1150); }
    flash=.5; for(let k=0;k<16;k++) fx.push({kind:'glint',x:m.x+(Math.random()-.5)*44,y:m.y-24+(Math.random()-.5)*44,t:-k*.03,life:.8}); sfx('power_up',.6);
    if(m.id===NET.pid) bigText(m.to==='truck'?'XE ĐẦU KÉO!':m.to==='robot'?'AUTOBOTS, ROLL OUT!':'TRỞ LẠI LÀ KAIXA'); }
  if(m.k==='crash'){ CRASHES.push({x:m.x,y:m.y,model:m.model||'wave',face:m.face||1,t0:NET.now()}); for(let k=0;k<10;k++) fx.push({kind:'dust',x:m.x+(Math.random()-.5)*24,y:m.y,vx:(Math.random()-.5)*60,vy:-Math.random()*30,t:-k*.02,life:.7});
    const who=m.id===NET.pid?P:REM.get(m.id); if(who){ who.act='hurt'; who.actT=0; } if(m.id===NET.pid){ P.moto=null; P.speeding=false; crashSnd(); bigText('XOÈ XE!'); flash=.3; } }
  if(m.k==='impound'){ IMPOUNDS.push({x:m.x,y:m.y,model:m.model||'wave',t0:NET.now()}); if(m.id===NET.pid){ P.moto=null; bigText('XE BỊ CẨU VỀ ĐỒN!'); toast('Sai cả 5 câu: xe lên xe thùng CSGT về đồn công an. Lên đồn nộp phạt để lấy lại xe.','lock'); } }
  if(m.k==='pee'){ const r=m.id===NET.pid?P:REM.get(m.id); if(r) fx.push({kind:'pee',x:r.x,y:r.y+2,t:0,life:12,s:Math.random()*6,ground:true}); }
  if(m.k==='ach'){ sfx('level_up',.55); flash=.3; }
  if(m.k==='bite'){ sfx('dog_bark',.6); const r=m.id===NET.pid?P:REM.get(m.id); if(r){ for(let i=0;i<5;i++) fx.push({kind:'dust',x:r.x,y:r.y-10,vx:(Math.random()-.5)*50,vy:-Math.random()*20,t:0,life:.6}); if(r===P){ P.act='hurt'; P.actT=0; } } }
  if(m.k==='shame'){ const r=m.id===NET.pid?P:REM.get(m.id); if(r) for(let i=0;i<4;i++) fx.push({kind:'note',x:r.x+(i-1.5)*6,y:r.y-44,t:-i*.15,life:1.5}); if(m.id!==NET.pid) toast(`${esc(m.name)} vừa bị công an phạt vì làm chuyện đồi bại ngoài đường 😳`,'lock'); }
  if(m.k==='kiss'){ const n=npcs.find(x=>x.id===m.npc), r=m.id===NET.pid?P:REM.get(m.id); if(n){ n.act='kiss'; n.actT=0; } if(r){ if(r===P){ P.act='kiss'; P.actT=0; } for(let i=0;i<10;i++) fx.push({kind:'heart',x:(n?n.x:r.x)+(Math.random()-.5)*24,y:(n?n.y:r.y)-30-Math.random()*16,t:-i*.1,life:1.4}); } sfx('blip',.5); } });
NET.listen('peeSeen',m=>UI.peeSeen&&UI.peeSeen(m));
NET.listen('stunt',m=>{ if(m.k==='go'){ STUNT={...m.v,res:{},wheelieT:0,fallT:0,last:''}; UI.closeAll(); bigText('XUẤT PHÁT!'); sfx('car_4wd',.6); return; } if(!STUNT&&m.k!=='end') return;
  if(m.k==='ok'){ STUNT.res[m.i]='ok'; STUNT.wheelieT=1; STUNT.last='ok'; STUNT.msgT=performance.now()+700; sfx('power_up',.45); }
  if(m.k==='fall'){ STUNT.res[m.i]='fall'; STUNT.fallT=1.2; STUNT.last='fall'; STUNT.msgT=performance.now()+900; sfx('dash',.6); for(let k=0;k<10;k++) fx.push({kind:'dust',x:P.x+10,y:P.y+6,vx:(Math.random()-.5)*60,vy:-Math.random()*25,t:0,life:.7}); }
  if(m.k==='miss'){ STUNT.res[m.i]='miss'; STUNT.last='miss'; STUNT.msgT=performance.now()+600; }
  if(m.k==='end'&&!m.caught&&!m.crash) toast(`Về đích: bốc đầu ${m.ok}/${SD.WHEELIE.cues}, xoè xe ${m.falls} lần`,'item'); });
NET.listen('dance',m=>{ const old=DANCE; DANCE=m.v; if(DANCE.st==='play'&&(!old||old.st!=='play')) playDance(DANCE); if(DANCE.st!=='play'&&old&&old.st==='play') stopDance(); UI.danceView&&UI.danceView(DANCE); });
NET.listen('danceHit',m=>{ if(DANCE&&DANCE.dancers[m.i]){ Object.assign(DANCE.dancers[m.i],{score:m.score,j:m.j,combo:m.combo}); UI.danceHit&&UI.danceHit(m); } });
NET.listen('socAsk',m=>UI.socAsk(m)); NET.listen('knockAsk',m=>UI.knockAsk(m));
NET.listen('och',m=>UI.och&&UI.och(m));
NET.listen('tbl',m=>{ TABLE=m.v; UI.tableView&&UI.tableView(m.v); });
NET.listen('race',m=>{ RACE=m.v; document.body.classList.toggle('racing',m.v.st==='run'&&S&&S.kind==='track'); UI.raceView&&UI.raceView(m.v); }); NET.listen('raceHit',m=>{ if(RACE&&RACE.riders[m.i]){ RACE.riders[m.i].dist=m.dist; RACE.riders[m.i].j=m.j; UI.raceHit&&UI.raceHit(m); } });
// bị đăng nhập ở nơi khác: dừng lại, cho bấm vào lại (không tự tải lại để 2 tab không đá nhau mãi)
NET.listen('kick',m=>{ started=false; $('#kickMsg').textContent=m.msg; $('#kicked').hidden=false; });
NET.listen('close',()=>{ if(started){ toast('Mất kết nối server. Đang thử lại...','lock'); setTimeout(()=>location.reload(),2500); } });

// phòng hờ: nếu trình duyệt vẫn xoá mất hình đã vẽ sẵn khi tab chạy nền thì tải lại trang (server giữ nguyên tiến trình)
document.addEventListener('visibilitychange',()=>{ if(document.hidden||!started||!S) return; const g0=S.ground.chunk(0,0,0), g=g0.getContext('2d').getImageData(Math.floor(g0.width/2),Math.floor(g0.height/2),1,1).data;
  if(g[3]===0) location.reload(); });
// nhạc Phòng Bay: phát đúng lúc bài bắt đầu theo giờ server
function playDance(v){ stopDance(); if(AUD.muted||!v.song) return; const a=new Audio('audio/'+v.song+'.mp3'); a.volume=.6; a.loop=true; danceAudio=a; if(AUD.music) AUD.music.pause();
  const wait=Math.max(0,v.startAt-NET.now()); setTimeout(()=>{ if(danceAudio===a) a.play().catch(()=>{}); },wait); }
function stopDance(){ if(danceAudio){ danceAudio.pause(); danceAudio=null; if(AUD.music&&!AUD.muted) AUD.music.play().catch(()=>{}); } }
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
window.GAME={walkTo,walkToNpc,get DANCE(){return DANCE;},get STUNT(){return STUNT;},officeOpen,boot,start,toast,esc,act,say,ask,sfx,setMute,AUD,banner,bigText,renderHUD,portrait,icon64,
  get G(){return G;},get P(){return P;},get S(){return S;},get REM(){return REM;},get PLOTS(){return PLOTS;},get TABLE(){return TABLE;},get RACE(){return RACE;},
  set HERD(v){HERD=v;},get HERD(){return HERD;},get FISH(){return FISH;},get lands(){return LANDS;},mountMoto,get plots(){return PLOTS;},bikeIcon,remoteAv:n=>{ for(const r of REM.values()) if(r.name===n&&r.av) return r.av; return null; },plotState,canFinish,startRoomAct,bedSpot,interact,nearest,keys,
  get started(){return started;}};
// hook kiểm thử: chạy mô phỏng theo bước khi tab bị ẩn (rAF bị hãm)
window.CHANDE={get G(){return G;},get P(){return P;},get S(){return S;},REM,nearest,interact,
  step(sec,hold=[],tap=[]){ for(const k of hold) keys.add(k); let first=true; for(let t=0;t<sec;t+=1/60){ if(first) for(const k of tap) pressed.add(k); first=false; clock+=1/60; update(1/60); pressed.clear(); }
    for(const k of hold) keys.delete(k); draw(); drawMini(); renderHUD(); }};
})();
