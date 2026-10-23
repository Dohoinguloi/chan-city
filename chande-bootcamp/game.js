/* Chan City — engine top-down nhiều người chơi. Server quyết định tiền, EXP, đồ, cảnh; client vẽ, đi lại, hội thoại, menu.
   Map: phòng riêng Hà Nội · Ké Retreat (+ tiệm, shop, Nhà giải trí, phòng thuê) · văn phòng Everfit · nông trại Đà Lạt · trường đua. */
(function(){
const A=ART, Wd=WORLD, SD=SHARED, T=A.T, $=s=>document.querySelector(s), fmt=SD.fmt;
const SPR='../pixel-sprite-forge/characters/';
const STORY={phap:1,phule:1,donche:1,khabanh:1,kenny:1,huyphan:1};

/* ---------- canvas ---------- */
const cvs=$('#game'), ctx=cvs.getContext('2d'), uic=$('#ui'), ug=uic.getContext('2d');
let VW=400, VH=225, SCALE=3, DPR=1;
function resize(){ SCALE=Math.max(2,Math.round(Math.min(innerHeight/240,innerWidth/400)));
  VW=Math.ceil(innerWidth/SCALE); VH=Math.ceil(innerHeight/SCALE); // khung nhìn phủ kín màn (dọc, ngang, màn siêu rộng)
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
function roarSnd(fly){ if(fly){ tone('square',1600,900,.7,.1,3000); setTimeout(()=>tone('square',1400,800,.5,.08,3000),350); return; } tone('sawtooth',95,45,1.6,.3,700); crashSnd(); }
// biến hình: tiếng mô-tơ rít lên xuống + loạt tiếng khớp kim loại lách cách
function clank(f,vol,at){ const c=synCtx(); if(!c||AUD.muted) return; const n=c.sampleRate*.09, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=c.createBufferSource(), bp=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; bp.type='bandpass'; bp.frequency.value=f; bp.Q.value=6; g.gain.value=vol; s.connect(bp); bp.connect(g); g.connect(c.destination); s.start(c.currentTime+at); }
function transformSnd(){ if(AUD.muted) return; tone('sawtooth',180,980,.7,.12,3000); setTimeout(()=>tone('square',900,260,.6,.08,2200),420);
  [[0,1800],[.12,1200],[.22,2600],[.36,900],[.5,2100],[.62,1500],[.78,3000],[.9,1100],[1.05,2400]].forEach(([at,f],i)=>clank(f,.5+(i%3)*.15,at)); }
function sayLine(text,pitch,lang){ try{ if(AUD.muted||!window.speechSynthesis) return; const u=new SpeechSynthesisUtterance(text), vs=speechSynthesis.getVoices(), v=lang?vs.find(v=>v.lang.toLowerCase().startsWith(lang)):vs.find(v=>/en-(US|GB)/i.test(v.lang)&&/male|daniel|fred|alex|google uk english male/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang));
  if(v) u.voice=v; u.lang=v?v.lang:lang==='vi'?'vi-VN':'en-US'; u.pitch=pitch!=null?pitch:.1; u.rate=pitch!=null?.9:.82; u.volume=1; speechSynthesis.cancel(); speechSynthesis.resume();
  SAY_KEEP.push(u); u.onend=u.onerror=()=>{ const i=SAY_KEEP.indexOf(u); if(i>=0) SAY_KEEP.splice(i,1); }; setTimeout(()=>speechSynthesis.speak(u),30); }catch(e){} }   // giữ câu đang đọc kẻo bị dọn bộ nhớ (Chrome im luôn), chờ 1 nhịp sau cancel
const SAY_KEEP=[]; try{ speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices(); }catch(e){}                                                    // rú ga bốc đầu
function crashSnd(){ const c=synCtx(); if(!c||AUD.muted) return; const n=c.sampleRate*.6, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
  const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; f.type='lowpass'; f.frequency.value=900; g.gain.value=.35; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); tone('square',180,60,.5,.12,600); }
// ma sói: sói tru, gà gáy, chuông bỏ phiếu, tiếng chết, nhạc thắng thua, dế + gió ban đêm
function howlSnd(delay=0,pitch=1){ const c=synCtx(); if(!c||AUD.muted) return; const t=c.currentTime+delay, o=c.createOscillator(), l=c.createOscillator(), lg=c.createGain(), f=c.createBiquadFilter(), g=c.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(280*pitch,t); o.frequency.exponentialRampToValueAtTime(640*pitch,t+.7); o.frequency.setValueAtTime(640*pitch,t+1.4); o.frequency.exponentialRampToValueAtTime(420*pitch,t+2.4);
  l.frequency.value=5.5; lg.gain.value=14*pitch; l.connect(lg); lg.connect(o.frequency); f.type='lowpass'; f.frequency.value=1800;
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.18,t+.35); g.gain.setValueAtTime(.16,t+1.8); g.gain.exponentialRampToValueAtTime(.0001,t+2.5); o.connect(f); f.connect(g); g.connect(c.destination); o.start(t); l.start(t); o.stop(t+2.6); l.stop(t+2.6); }
function roosterSnd(){ const c=synCtx(); if(!c||AUD.muted) return; let t=c.currentTime; for(const [f0,f1,d] of [[620,980,.14],[900,720,.12],[760,1180,.22],[1150,820,.6]]){ const o=c.createOscillator(), b=c.createBiquadFilter(), g=c.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+d); b.type='bandpass'; b.frequency.value=1400; b.Q.value=2; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.2,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(b); b.connect(g); g.connect(c.destination); o.start(t); o.stop(t+d+.02); t+=d*.92; } }
function bellSnd(){ const c=synCtx(); if(!c||AUD.muted) return; for(const at of [0,.55]) for(const [f,v] of [[660,.16],[990,.08],[1320,.05]]){ const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+at; o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+1.6); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+1.7); } }
function deathSnd(){ tone('sine',90,40,.7,.3,400); setTimeout(()=>tone('triangle',220,110,.9,.08,800),120); }
function winSnd(dan){ if(dan) [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone('square',f,f*1.01,.35,.1,3000),i*160)); else { [440,392,349,330].forEach((f,i)=>setTimeout(()=>tone('sawtooth',f,f*.98,.45,.08,1600),i*220)); howlSnd(.9,.9); } }
const NIGHTAMB={t:0};
function nightAmb(on){ clearInterval(NIGHTAMB.t); NIGHTAMB.t=0; if(!on) return;
  NIGHTAMB.t=setInterval(()=>{ if(!document.querySelector('.masoifs.ph-night')||AUD.muted){ clearInterval(NIGHTAMB.t); NIGHTAMB.t=0; return; }
    const c=synCtx(); if(!c) return; for(let k=0;k<3;k++){ const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+k*.07; o.type='sine'; o.frequency.value=4300+Math.random()*300; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.025,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+.05); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+.06); }   // dế kêu
    if(Math.random()<.18){ const n=c.sampleRate*1.6, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/n); const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; f.type='lowpass'; f.frequency.value=500; g.gain.value=.05; s.connect(f); f.connect(g); g.connect(c.destination); s.start(); }   // gió
    if(Math.random()<.04) howlSnd(0,.8+Math.random()*.3); },900); }
function whistleSnd(){ for(const [d,len] of [[0,.18],[.26,.5]]) setTimeout(()=>tone('sine',2900,3100,len,.12,6000),d*1000); }       // tuýt tuýt
function sirenSet(vol){ const c=synCtx(); if(!c) return; if(!SYN.sir){ if(vol<=.001) return; const o=c.createOscillator(), l=c.createOscillator(), lg=c.createGain(), f=c.createBiquadFilter(), g=c.createGain();
    o.type='square'; o.frequency.value=700; l.type='square'; l.frequency.value=1.4; lg.gain.value=170; l.connect(lg); lg.connect(o.frequency); f.type='lowpass'; f.frequency.value=1600; g.gain.value=0; o.connect(f); f.connect(g); g.connect(c.destination); o.start(); l.start(); SYN.sir={o,l,g}; }
  SYN.sir.g.gain.setTargetAtTime(vol,c.currentTime,.25); }
// cùng 1 tiếng phát dồn (bị đánh liên tục, sét Thor, chuỗi sét...) thì cách nhau tối thiểu SFX_GAP ms cho đỡ ồn
const SFX_GAP={poof:320,power_up:320,dash:220,coin:120,item_pickup:150,blip:90}, SFX_AT={};
function sfx(k,vol=.55){ if(AUD.muted) return; const a=AUD.files[k]; if(!a) return; const tn=performance.now(); if(SFX_GAP[k]&&tn-(SFX_AT[k]||0)<SFX_GAP[k]) return; SFX_AT[k]=tn;
  if(MONO[k]){ const n=monoNode[k]||(monoNode[k]=a.cloneNode()); n.volume=vol; n.currentTime=0; n.play().catch(()=>{}); return n; }
  const n=a.cloneNode(); n.volume=vol; n.play().catch(()=>{}); return n; }
function music(k){ if(AUD.cur===k) return; AUD.cur=k; const old=AUD.music;
  if(old){ let v=old.volume; const t=setInterval(()=>{ v-=.05; if(v<=0){ old.pause(); clearInterval(t); } else old.volume=v; },60); }
  const a=AUD.files[k]; if(!a){ AUD.music=null; return; } const n=a.cloneNode(); n.loop=true; n.volume=0; AUD.music=n; if(!AUD.muted) n.play().catch(()=>{});
  let v=0; const t=setInterval(()=>{ v+=.04; if(v>=.34){ v=.34; clearInterval(t); } n.volume=v; },60); }
// nhạc nền theo khu: bài thu sẵn cho Ké + phòng, còn lại chiptune tự sinh (music.js); đêm ngoài trời đổi sang bài đêm, có Megatron thì nhạc đánh nhau
const BGM_ZONE=[[/Vườn quốc gia|Bãi voi|Rừng khỉ|Vườn công|Tán rừng|Bờ suối|Vách đá|Trạm cứu hộ|Khu hổ|Rừng lợn|Đồi hươu/,'park'],[/Chùa|Khu tâm linh/,'temple'],[/Làng Mường|Nhà văn hoá|Chợ phiên|Suối bản|Cầu sang|Nhà sàn/,'village'],
  [/Hồ Hoà Bình|Bến hồ/,'lake'],[/Thác|Đồi chè|Chòi canh|cắm trại rừng|Rừng/,'forest'],[/Thị trấn|Phố Đà Bắc|Đường|Sân bóng|Quảng trường|Bến xe|Chợ Đà Bắc|Trường tiểu học/,'town']];
const BGM_SCENE={mu:'mu_plaza',lavi:'lavi',nghienmotion:'nmotion',bearplus:'bearplus',vnpt:'vnpt',mieu:'mieu',everfit:'office',lumen:'lumen',diep:'diep',yenlang:'yenlang',pickle:'pickle',epl:'pickle',dalat:'dalat',track:'race',das:'das',club:'club',phongbay:'club',cafe2:'cafe',quan_lan:'cafe',sieuthi:'mall',net:'net',nongsan:'cafe',quanao:'mall',doncongan:'tense',deo:'deo',stay:'room',linhcat:'linhcat'};
let bgmKey='', bgmToastAt=0;
function pickBgm(){ if(!S||!window.MUSIC||danceAudio) return; let k;
  if((MEGA||(MCKB&&inMck()))&&S.kind==='retreat') k='battle';
  else if(S.kind==='room') k='file:music_room';
  else if((S.kind==='mu'||S.kind==='muw')&&window.MU_BGM) k=window.MU_BGM(zoneName||zoneLast);   /* MU: nhạc theo khu, gần boss thì nhạc đánh boss */
  else if(BGM_SCENE[S.kind]) k=BGM_SCENE[S.kind];
  else if(S.kind==='retreat'){ const hit=BGM_ZONE.find(([re])=>re.test(zoneName||zoneLast||'')), h=vn().hf, night=h<5||h>=19.5; k=hit?hit[1]:'file:music_retreat'; if(night&&['town','lake','file:music_retreat'].includes(k)) k='night'; }
  else k='file:music_retreat';
  if(k===bgmKey) return; bgmKey=k;
  if(k.startsWith('file:')){ window.MUSIC.stop(); music(k.slice(5)); }
  else { music('__none'); window.MUSIC.play(k); if(performance.now()-bgmToastAt>15000){ bgmToastAt=performance.now(); toast('♪ '+esc(window.MUSIC.tracks[k].name),'item'); } } }
setInterval(pickBgm,1000);
if(window.MUSIC) window.MUSIC.setMuted(AUD.muted);
function setMute(m){ AUD.muted=m; window.MUSIC&&window.MUSIC.setMuted(m); try{ localStorage.setItem('chande-mute',m?'1':'0'); }catch(e){} if(AUD.music){ if(m) AUD.music.pause(); else AUD.music.play().catch(()=>{}); }
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
let S=null, npcs=[], fx=[], zoneName='', zoneLast='', flash=0, soiT=0, clock=0, shakeA=0, shakeT=0;
const CALM=matchMedia('(prefers-reduced-motion: reduce)').matches;
function shake(a,t=.22){ if(CALM) return; shakeA=Math.max(shakeA,a); shakeT=Math.max(shakeT,t); }   // rung màn nhẹ khi va chạm (tắt nếu máy đặt giảm chuyển động)
const REM=new Map(), PLOTS={}, SOCS=new Map();
let TASK=null, FISH=null, HERD=null, TABLE=null, RACE=null, started=false;
const MAPS={};
const ACTS=SD.ACTS, VIEWS=['side','down','up'], ANIMS=['idle','walk','run'];
const vn=()=>SD.vnTime(NET.now());

/* ---------- cảnh ---------- */
let HOME_NOW=null, HOME_MINE=null;   /* nhà đang đứng (bố cục do server gửi kèm cảnh) + kho đồ / sàn tường đã mua của nhà mình */
function buildMap(kind,room){ if(kind==='room') return Wd.buildRoom(HOME_NOW); if(kind==='retreat') return Wd.buildRetreat(); if(kind==='stay') return Wd.buildStay(room);
  if(kind==='mu') return Wd.buildMU(); if(kind==='dday') return Wd.buildDday();
  if(kind==='lavi') return Wd.buildLavi();
  if(kind==='nghienmotion') return Wd.buildNghienMotion();
  if(kind==='bearplus') return Wd.buildBearplus(); if(kind==='vnpt') return Wd.buildVnpt(); if(kind==='mieu') return Wd.buildMieu();
  if(kind==='das') return Wd.buildDas(); if(kind==='lumen') return Wd.buildLumen(); if(kind==='yenlang') return Wd.buildYenLang(); if(kind==='pickle') return Wd.buildPickle(); if(kind==='epl') return Wd.buildEpl(); if(kind==='diep') return Wd.buildDiep();
  if(kind==='everfit') return Wd.buildOffice(); if(kind==='dalat') return Wd.buildDalat(); if(kind==='track') return Wd.buildTrack(); if(kind==='deo') return Wd.buildDeo(); if(kind==='linhcat') return Wd.buildLinhCat(); return Wd.buildInterior(kind); }
function prep(m,kind){ const W=m.W, H=m.H, solid=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(!A.WALKABLE.has(m.grid[y][x])) solid[y*W+x]=1;
  for(const [x0,y0,x1,y1] of m.solid) for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(x>=0&&y>=0&&x<W&&y<H) solid[y*W+x]=1;
  const edge=kind==='room'||m.indoor?'H':'F';
  const objs=m.obj.filter(o=>!o.flat&&!o.over).sort((a,b)=>(a.sort??a.y)-(b.sort??b.y)), CS=CHUNK*T, ob=new Map();
  for(const o of objs){ const k=Math.floor(o.x/CS)+'_'+Math.floor(o.y/CS); if(!ob.has(k)) ob.set(k,[]); ob.get(k).push(o); }   // đồ vật chia theo khối để map to chỉ duyệt khối gần
  return {map:m,W,H,solid,ground:makeGround(m,edge),objs,objB:ob,over:m.obj.filter(o=>o.over)}; }
// nền map vẽ theo khối 32×32 ô khi khối lọt vào màn hình (giữ tối đa ~40 khối): map to cỡ 340×240 ô không tốn RAM, vào map nhanh.
// Mỗi khối có 2 bản theo nhịp sóng nước (fr 0/1); khối không có ô nào đổi theo nhịp sóng (không có nước) chỉ giữ 1 bản.
// Khối kế bên vẽ trước từ từ, mỗi khung hình vài hàng ô (≤ GROUND_MS ms) nên đi sang khối mới không bị khựng, kể cả máy yếu.
const CHUNK=32, GROUND_MS=2;
function makeGround(m,edge){ const W=m.W, H=m.H, CS=CHUNK*T, NI=Math.ceil(W/CHUNK), NJ=Math.ceil(H/CHUNK), cache=new Map(), flats=m.obj.filter(o=>o.flat);
  const nb=(x,y)=>(dx,dy)=>{ const yy=y+dy, xx=x+dx; return yy>=0&&yy<H&&xx>=0&&xx<W?m.grid[yy][xx]:edge; };
  // ô có đổi theo nhịp sóng không: vẽ thử 2 nhịp lên canvas 1 ô rồi so, nhớ theo loại ô + 4 ô hàng xóm
  const one=A.cv(T,T), og=one.getContext('2d'), sigAnim=new Map(), chunkAnim=new Map();
  const tileAnim=(x,y)=>{ const t=m.grid[y][x], n=nb(x,y), sig=t+n(0,-1)+n(1,0)+n(0,1)+n(-1,0); let v=sigAnim.get(sig); if(v!==undefined) return v;
    const shot=fr=>{ og.setTransform(1,0,0,1,0,0); og.clearRect(0,0,T,T); og.setTransform(1,0,0,1,-x*T,-y*T); A.drawTile(og,t,x,y,n,fr); return new Uint32Array(og.getImageData(0,0,T,T).data.buffer); };
    const a=shot(0), b=shot(1); v=a.some((p,k)=>p!==b[k]); sigAnim.set(sig,v); return v; };
  const anim=(i,j)=>{ const ij=i+'_'+j; let v=chunkAnim.get(ij); if(v!==undefined) return v; v=false;
    for(let y=j*CHUNK;y<Math.min(H,(j+1)*CHUNK)&&!v;y++) for(let x=i*CHUNK;x<Math.min(W,(i+1)*CHUNK);x++) if(tileAnim(x,y)){ v=true; break; }
    chunkAnim.set(ij,v); return v; };
  const keyOf=(i,j,fr)=>i+'_'+j+'_'+(anim(i,j)?fr:0);
  const put=(key,c)=>{ cache.set(key,c); while(cache.size>40) cache.delete(cache.keys().next().value); };
  let job=null;
  const begin=(i,j,fr)=>{ if(!anim(i,j)) fr=0; const c=A.cv(CS,CS), g=c.getContext('2d'); g.translate(-i*CS,-j*CS); return {i,j,fr,c,g,y:j*CHUNK,key:i+'_'+j+'_'+fr}; };
  // vẽ tiếp các hàng ô còn lại của khối; until>0 thì quá giờ là dừng (trả null), khung hình sau vẽ tiếp. Xong thì trả ảnh khối
  const work=(b,until)=>{ const {i,j,fr,g}=b, y1=Math.min(H,(j+1)*CHUNK), x0=i*CHUNK, x1=Math.min(W,(i+1)*CHUNK);
    while(b.y<y1){ const y=b.y++; for(let x=x0;x<x1;x++) A.drawTile(g,m.grid[y][x],x,y,nb(x,y),fr); if(until&&b.y<y1&&performance.now()>until) return null; }
    for(const o of flats){ const ox=o.x-o.spr.ax, oy=o.y-o.spr.ay; if(ox>=(i+1)*CS||oy>=(j+1)*CS||ox+o.spr.c.width<=i*CS||oy+o.spr.c.height<=j*CS) continue; g.drawImage(o.spr.c,ox,oy); }
    if(job===b) job=null; put(b.key,b.c); return b.c; };
  const chunk=(i,j,fr)=>{ const key=keyOf(i,j,fr); let c=cache.get(key); if(c){ cache.delete(key); cache.set(key,c); return c; }
    return work(job&&job.key===key?job:begin(i,j,fr),0); };
  const range=(cx,cy,vw,vh,pad=0)=>[Math.max(0,Math.floor(cx/CS)-pad),Math.min(NI-1,Math.floor((cx+vw)/CS)+pad),Math.max(0,Math.floor(cy/CS)-pad),Math.min(NJ-1,Math.floor((cy+vh)/CS)+pad)];
  // việc vẽ trước tiếp theo: khối đang thấy thiếu bản nhịp sóng kia trước, rồi tới các khối kế bên
  const nextJob=(cx,cy,vw,vh,fr)=>{ const [i0,i1,j0,j1]=range(cx,cy,vw,vh), [a0,a1,b0,b1]=range(cx,cy,vw,vh,1);
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) if(!cache.has(keyOf(i,j,1-fr))) return begin(i,j,1-fr);
    for(const f of [fr,1-fr]) for(let j=b0;j<=b1;j++) for(let i=a0;i<=a1;i++) if(!cache.has(keyOf(i,j,f))) return begin(i,j,f);
    return null; };
  return {chunk,range,
    draw(ctx,cx,cy,vw,vh,fr){ const [i0,i1,j0,j1]=range(cx,cy,vw,vh); for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) ctx.drawImage(chunk(i,j,fr),i*CS-cx,j*CS-cy);
      const [a0,a1,b0,b1]=range(cx,cy,vw,vh,1); if(job&&(job.i<a0||job.i>a1||job.j<b0||job.j>b1||cache.has(keyOf(job.i,job.j,job.fr)))) job=null;   // đi xa / dịch chuyển: bỏ khối đang vẽ dở
      const until=performance.now()+GROUND_MS; while(performance.now()<until){ job=job||nextJob(cx,cy,vw,vh,fr); if(!job||!work(job,until)) break; } }}; }
function sceneData(kind,room){ if(kind==='room') return prep(buildMap(kind,room),kind);   /* nhà riêng mỗi người một kiểu: không giữ bản dựng sẵn */
  const key=kind==='stay'?'stay:'+room:kind; return MAPS[key]||(MAPS[key]=prep(buildMap(kind,room),kind)); }
function officeOpen(){ const t=vn(), wd=!SD.isWeekend(t.day); if(wd&&t.hf>=SD.JOB.hours[0]&&t.hf<SD.JOB.hours[1]) return true;
  const j=G&&G.extra&&G.extra.job; return !!(j&&j.hired&&j.today&&j.today.ot&&!j.today.otDone&&t.hf>=SD.JOB.ot.from&&t.hf<SD.JOB.ot.to); }
function sceneNpcs(kind){ const open=kind==='everfit'?officeOpen():true; if(S) S.closed=!open;
  return SD.NPCS.filter(n=>!n.obj&&(n.scene||'retreat')===kind&&(kind!=='everfit'||!!n.closed===!open)&&(!n.season||SD.seasonOn(n.season,NET.now()))).map(n=>({...n,x:n.x*T,y:n.y*T,view:'down',face:1,t:Math.random()*2,act:null,actT:0,av:STORY[n.id]?null:AVATAR.build(SD.NPC_LOOKS[n.id].look)})); }
let CSGT_POST=null, CSGT_STOP=null, IMPOUNDS=[], CRASHES=[], OPT_ON=0, MEGA=null, ramAt=0, WDINO=null, WCROC=null;
const DINOSPR={}, dinoSpr=(k,f,o)=>DINOSPR[k+f+(o?'o':'')]||(DINOSPR[k+f+(o?'o':'')]=k==='croc'?A.croc(f,o):({bronto:A.dino,trice:A.trice,ptero:A.ptero,rexpink:A.rexPink,rex:A.rexGreen}[k]||A.dino)(f));
// CR7 + Messi đi dạo ngoài phố (vị trí tính theo giờ nên ai cũng thấy giống nhau), lại gần thì ăn mừng / khoe
const STARS=[{id:'cr7',path:[[76,96.6],[200,96.6],[205.5,90],[205.5,62]],speed:2.1,line:'SIUUUU!',voice:'Siuuuuuuu',pitch:1.5},{id:'messi',path:[[76,57.6],[202,57.6],[202,70],[150,73]],speed:1.7,line:"I'm phó GOAT 🐐",voice:"I'm the pho goat",pitch:1.1}];
const STARAV={}, starAv=id=>STARAV[id]||(STARAV[id]=AVATAR.build(SD.NPC_LOOKS[id].look)), STARSAY={};
function starPos(s,t){ const segs=s.path.slice(1).map((b,i)=>{ const a=s.path[i]; return [a,b,Math.hypot(b[0]-a[0],b[1]-a[1])]; }), L=segs.reduce((q,x)=>q+x[2],0); let d=(t*s.speed)%(2*L); const back=d>L; if(back) d=2*L-d;
  for(const [a,b,l] of segs){ if(d<=l){ const k=d/l, dx=b[0]-a[0], dy=b[1]-a[1]; return {x:(a[0]+dx*k)*T,y:(a[1]+dy*k)*T,face:(back?-dx:dx)>=0?1:-1,view:Math.abs(dy)>Math.abs(dx)?((back?-dy:dy)>0?'down':'up'):'side'}; } d-=l; } return {x:s.path[0][0]*T,y:s.path[0][1]*T,face:1,view:'side'}; } const OPT_FORM={}, MGS={}; const megaSpr=(v,f)=>MGS[v+f]||(MGS[v+f]=A.megatron(v,f)); const OPTS={}; const optSpr=(k,v,f)=>OPTS[k+v+f]||(OPTS[k+v+f]=k==='truck'?A.optimusTruck(v,f):A.optimus(v,f));
const isKaixa=()=>G&&String(G.name||'').toLowerCase()===SD.OPTIMUS.owner; const CSGT_AV={};
let SAYS=[], PCAR=null, STAYS={}, STUNT=null, DANCE=null, danceAudio=null, LANDS=[], HERDS=[], DOGLIST=[], ANITAGS=[];
function enterScene(m){ HOME_NOW=m.s==='room'?(m.home||null):null; if(m.mine) HOME_MINE=m.mine; if(m.s!=='room'&&A.homeTheme) A.homeTheme(null);   /* sàn / tường theo theme chỉ trong nhà riêng */
  const d=sceneData(m.s,m.room);
  S={kind:m.s,id:m.id,room:m.room,host:m.host,hostPid:m.hostPid,own:m.own,...d}; miniBase=null;
  P.x=m.x; P.y=m.y; P.kayak=false; P.riding=false; P.moto=null; FOLLOW.clear(); $('#mckBar').hidden=true; P.pcar=false; P.incar=false; P.act=null; TASK=null; FISH=null; REM.clear(); SOCS.clear(); fx=[]; zoneName=''; zoneLast='';
  npcs=sceneNpcs(m.s); STUNT=m.stunt?{...m.stunt,res:{},wheelieT:0,fallT:0,last:'',cues:m.stunt.cues||[]}:null; if(STUNT&&STUNT.pick) setTimeout(()=>UI.garage(),400); if(m.s!=='phongbay'){ DANCE=null; stopDance(); } if(m.s!=='track') document.body.classList.remove('racing');
  if(m.s==='retreat'){ pet.x=SD.BEAGLE_SPOT.x*T; pet.y=SD.BEAGLE_SPOT.y*T; { const ph=npcs.find(n=>n.id==='phap'); if(ph){ pet.x=ph.x+18; pet.y=ph.y+2; } }
    if(G.flags.beagleFollow){ pet.x=P.x-14; pet.y=P.y; } chick.x=chick.tx=SD.CHICKEN_HOME.x*T; chick.y=chick.ty=SD.CHICKEN_HOME.y*T; }
  for(const k of Object.keys(PLOTS)) if((k[0]==='k')!==(m.s==='retreat')||(k[0]==='d')!==(m.s==='dalat')) delete PLOTS[k];
  bgmKey=''; pickBgm();
  banner(m.s==='stay'?(m.own?'Phòng của bạn · ':'Phòng của '+m.host+' · ')+S.map.name:m.s==='room'&&m.host?'Nhà của '+m.host:S.map.name);
  if(m.s==='room'&&m.host) setTimeout(()=>toast(`🏠 Đang chơi ở nhà <b>${esc(m.host)}</b>. Muốn về: bấm R → Về nhà mình`,'quest'),900);   /* được mời về nhà (haosang.js) */
  if(m.s==='room'&&!G.flags.called) ringTimer=2.2;
  if(m.ride) travelAnim(m.ride);
  if(m.xtp) xtArrive(m.xtp); if(m.warp) warpFx(m.warp);   /* cổng dịch chuyển MU */
  if(LEARN_AFTER&&(m.s==='room'||(String(m.s).startsWith('stay')&&m.own))){ LEARN_AFTER=false; setTimeout(learnGo,600); } else if(m.s!=='retreat') LEARN_AFTER=false;
  AUTO=null; if(NEED_AFTER&&(m.s==='room'||String(m.s).startsWith('stay')||(m.s==='retreat'&&NEED_AFTER==='clean'))){ const k=NEED_AFTER; NEED_AFTER=null; setTimeout(()=>needGo(k),600); } else if(m.s!=='retreat') NEED_AFTER=null;
  if(GOAFTER&&destOf(m.s)===destOf(GOAFTER.scene)&&performance.now()-GOAFTER.at<120000){ const g=GOAFTER; GOAFTER=null; setTimeout(()=>g.then&&g.then(),travelling?2600:900); } else if(GOAFTER&&performance.now()-GOAFTER.at>=120000) GOAFTER=null;   /* tới map rồi: tự đi tiếp */
  if(ROUTE) setTimeout(runRoute,500); if(homeAfterExit&&m.s==='retreat'){ homeAfterExit=false; setTimeout(goHome,300); } else homeAfterExit=false;
  UI.closeAll&&UI.closeAll(); renderHUD(); }

/* ---------- va chạm ---------- */
function solidAt(px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); if(tx<0||ty<0||tx>=S.W||ty>=S.H) return true;
  if(P.kayak){ const t=S.map.grid[ty][tx]; return !(t==='W'||t==='Q'||t==='o'); } return S.solid[ty*S.W+tx]===1; }   // kayak chèo được cả nước sâu giữa hồ (o)
function blocked(x,y){ const hw=5, h=4;
  if(S.kind==='everfit'&&S.closed&&(x>6.9*T||y<15*T)) return true;            // ngoài giờ: chỉ đứng ở sảnh thang máy
  if(solidAt(x-hw,y-h)||solidAt(x+hw,y-h)||solidAt(x-hw,y)||solidAt(x+hw,y)) return true;
  if((P.riding||P.moto||P.pcar||P.opt)&&[[x-hw,y-h],[x+hw,y-h],[x-hw,y],[x+hw,y]].some(([a,b])=>tileAt(a,b)==='L')){   // ngựa / xe / robot không lội xuống bể bơi
    if(!blocked.wet||performance.now()-blocked.wet>3000){ blocked.wet=performance.now(); toast(P.riding?'Ngựa không xuống nước được, xuống ngựa (H) rồi hãy bơi':'Xe không đi xuống nước được','lock'); } return true; }
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
// cảm ứng (điện thoại, máy tính bảng): cần điều khiển ảo bên trái (kéo xa = chạy), nút hành động bên phải giả lập phím; chạm đất trống thì tự đi tới đó
const TOUCH=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
if(TOUCH){ document.body.classList.add('touch'); const joy=$('#joy'), knob=$('#joyKnob'); let jid=null, jx=0, jy=0;
  const dir=(dx,dy)=>{ for(const k of ['w','a','s','d','shift']) keys.delete(k); const d=Math.hypot(dx,dy); if(d<14) return; const a=Math.atan2(dy,dx);
    if(Math.abs(Math.cos(a))>.38) keys.add(dx>0?'d':'a'); if(Math.abs(Math.sin(a))>.38) keys.add(dy>0?'s':'w'); if(d>50) keys.add('shift'); };
  const jmove=e=>{ if(e.pointerId!==jid) return; e.preventDefault(); let dx=e.clientX-jx, dy=e.clientY-jy; const d=Math.hypot(dx,dy), R=46; dir(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } knob.style.transform=`translate(${dx}px,${dy}px)`; };
  const jup=e=>{ if(e.pointerId!==jid) return; jid=null; knob.style.transform=''; dir(0,0); };
  joy.addEventListener('pointerdown',e=>{ e.preventDefault(); jid=e.pointerId; try{ joy.setPointerCapture(jid); }catch(_){} const r=joy.getBoundingClientRect(); jx=r.left+r.width/2; jy=r.top+r.height/2; AUTO=null; jmove(e); });
  joy.addEventListener('pointermove',jmove); joy.addEventListener('pointerup',jup); joy.addEventListener('pointercancel',jup);
  for(const b of document.querySelectorAll('#tbtns [data-k]')){ const k=b.dataset.k, rel=()=>{ b.classList.remove('on'); keys.delete(k); };
    b.addEventListener('pointerdown',e=>{ e.preventDefault(); b.classList.add('on'); if(!keys.has(k)) pressed.add(k); keys.add(k); if(navigator.vibrate&&navigator.userActivation&&navigator.userActivation.hasBeenActive) navigator.vibrate(8); });
    b.addEventListener('pointerup',rel); b.addEventListener('pointercancel',rel); b.addEventListener('pointerleave',rel); } }
const down=(...ks)=>ks.some(k=>keys.has(k)), hit=(...ks)=>ks.some(k=>pressed.has(k));
// phím mở bảng; bấm lại đúng phím khi bảng nó mở còn đang hiện thì đóng
const HOTKEYS=[['g',()=>UI.grab()],['i',()=>UI.bag()],['l',()=>UI.leaderboard()],['u',()=>UI.wardrobe()],['f',()=>UI.farm()],['y',()=>UI.daily()]]; let HK_OPEN='';   // HK_OPEN = 'phím|tiêu đề bảng'
function hotkey(k,f){ f(); HK_OPEN=k+'|'+$('#panelTitle').textContent; }

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
$('#dialog').addEventListener('click',e=>{ if(DLG.open&&!e.target.closest('.choice')) pressed.add('e'); });
function finishChoice(){ const c=DLG.choice, i=DLG.sel; closeDialog(); c.cb(i); }
function closeDialog(){ DLG.open=false; DLG.closedAt=clock; $('#dialog').hidden=true; const d=DLG.done; DLG.done=null; if(d) d(); }
function updateDialog(dt){ const [,txt]=DLG.lines[DLG.i]; if(DLG.shown<txt.length){ DLG.shown=Math.min(txt.length,DLG.shown+dt*46); DLG.blipT-=dt; if(DLG.blipT<=0){ sfx('blip',.16); DLG.blipT=.12; } }
  const last=DLG.i===DLG.lines.length-1;
  if(DLG.choice&&last&&DLG.shown>=txt.length){ if(hit('arrowup','w','arrowleft','a')) DLG.sel=(DLG.sel+DLG.choice.opts.length-1)%DLG.choice.opts.length;
    if(hit('arrowdown','s','arrowright','d')) DLG.sel=(DLG.sel+1)%DLG.choice.opts.length; if(hit('e',' ','enter')){ finishChoice(); return; } }
  else if(hit('e',' ','enter')){ if(DLG.shown<txt.length) DLG.shown=txt.length; else if(!last){ DLG.i++; DLG.shown=0; } else { closeDialog(); return; } }
  renderDialog(); }

/* ---------- thông báo ---------- */
// toast trùng nội dung với cái đang hiện (spam "Chat chậm thôi"...) thì gộp làm 1, hiện số lần ×2 ×3 và tính lại giờ tắt
function toast(html,kind=''){ const box=$('#toasts'), live=()=>[...box.children].find(t=>t.dataset.h===html&&!t.classList.contains('out')), out=d=>{ clearTimeout(d._t1); clearTimeout(d._t2); d._t1=setTimeout(()=>d.classList.add('out'),2800); d._t2=setTimeout(()=>d.remove(),3400); };
  const same=live(); if(same){ same.dataset.n=(+same.dataset.n||1)+1; out(same); return; }
  const d=document.createElement('div'); d.className='toast '+kind; d.innerHTML=html; d.dataset.h=html; box.appendChild(d); while(box.children.length>3) box.firstChild.remove(); out(d);
  while($('#toasts').children.length>6) $('#toasts').firstChild.remove(); }
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function banner(text){ const b=$('#banner'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
// banner sự kiện (server gửi khi vào game trong ngày sự kiện, kèm quà nếu vừa nhận): tự ẩn sau 12 giây, bấm ✕ để tắt
// còn ở màn tiêu đề / tạo nhân vật (tin tới ngay lúc đăng nhập) thì chờ vào game 1,5 giây rồi mới hiện, không đè màn tạo nhân vật
NET.listen('evbanner',m=>{ if(!started){ const w=setInterval(()=>{ if(started){ clearInterval(w); setTimeout(()=>evBanner(m),1500); } },300); return; } evBanner(m); });
function evBanner(m){ const b=$('#evBanner'); b.querySelector('b').textContent=m.title; b.querySelector('span').textContent=m.sub+(m.gift?` · bạn vừa nhận ${fmt(m.gift)}${m.giftWhy?' ('+m.giftWhy+')':''}`:'');
  const lg=b.querySelector('.evlg'); lg.innerHTML=m.legend&&window.LEGUI?window.LEGUI.banner():''; lg.hidden=!lg.innerHTML;   /* 3 món huyền thoại: bấm để xem đường đi */
  b.hidden=false; b.classList.remove('in'); void b.offsetWidth; b.classList.add('in'); clearTimeout(b._t); b._t=setTimeout(()=>{ b.hidden=true; },m.legend?24000:12000); if(m.gift) sfx('coin',.6); }
document.addEventListener('click',e=>{ if(e.target.closest('#evBanner button')) $('#evBanner').hidden=true; });
function bigText(text){ const b=$('#bigtext'); b.textContent=text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
// gửi lệnh lên server, báo lỗi nếu có
async function act(msg,okMsg){ const r=await NET.req(msg); if(r.err){ const learn=/Chưa học /.test(r.err)&&!/HLV/.test(r.err);   // thiếu kỹ năng: kèm nút tự về phòng mở laptop học
    toast(esc(r.err)+(learn?'<br><button class="learnGo" type="button">📚 Về phòng học ➜</button> <small>laptop ở phòng → Học kỹ năng</small>':''),'lock'); sfx('blip',.2); } else if(okMsg) toast(okMsg,'item'); return r; }

/* ---------- cốt truyện Ké: 6 người nhờ việc ---------- */
const Q=SD.QUESTS;
function questProgress(id){ const q=Q[id];
  if(id==='beagle') return G.flags.beagleFollow?'Dẫn beagle về Cổng':'Tìm ở Nền khu cắm trại';
  if(q.need) return Object.entries(q.need).map(([k,n])=>`${SD.ITEMS[k].name} ${Math.min(G.items[k]||0,n)}/${n}`).join(' · ');
  if(q.spots) return `Đã chụp ${q.spots.filter(s=>G.flags.spots[s]).length}/${q.spots.length}`;
  if(q.shisha) return ((G.qprog||{})[id]||0)>=q.shisha?'Đã hút xong, về gặp Ộ i i':'Vào Nhà giải trí hút shisha';
  if(q.job) return (G.qprog||{})[id]?'Xong rồi, về Ké báo Huy Phan':`${q.job.label} · ${SD.DEST[q.job.where].name}`;
  if(q.prog){ const n=(G.qprog||{})[id]||0; return id==='goioii'?(n?'Đã gọi Ộ i i, về báo anh Độ':'Tìm Ộ i i ở các map, bấm E nói chuyện'):`Đã làm ${Math.min(n,q.prog)}/${q.prog}`; }
  if(q.eat) return `Đã ăn ${Math.min(q.eat.n,(G.qprog||{})[id]||0)}/${q.eat.n}`; if(q.dance) return `Tốt nhất ${(G.qprog||{})[id]||0}/${q.dance} PERFECT`;
  if(q.butterflies) return `Đã bắt ${buomKinds()}/${q.butterflies} loài bướm`; if(q.lo) return 'Về phòng, mở điện thoại (Esc → Điện thoại)'; return ''; }
const buomKinds=()=>Object.keys(SD.BUTTERFLY.kinds).filter(k=>(G.items['buom_'+k]||0)>0).length;
function canFinish(id){ const q=Q[id]; if(id==='beagle') return G.flags.beagleFollow&&Math.hypot(pet.x-P.x,pet.y-P.y)<70;
  if(q.need) return Object.entries(q.need).every(([k,n])=>(G.items[k]||0)>=n); if(q.spots) return q.spots.every(s=>G.flags.spots[s]);
  if(q.eat) return ((G.qprog||{})[id]||0)>=q.eat.n; if(q.dance) return ((G.qprog||{})[id]||0)>=q.dance; if(q.shisha) return ((G.qprog||{})[id]||0)>=q.shisha; if(q.prog) return ((G.qprog||{})[id]||0)>=q.prog;
  if(q.butterflies) return buomKinds()>=q.butterflies; if(q.lo) return ((G.qprog||{})[id]||0)>=q.lo; return false; }
async function startQuest(id){ const r=await act({t:'quest',id,op:'start'}); if(!r.err){ sfx('quest_accept',.5); toast(`Nhận nhiệm vụ: <b>${Q[id].title}</b>`,'quest'); } }
async function finishQuest(id,after){ const r=await act({t:'quest',id,op:'finish'}); if(!r.err){ sfx('quest_complete',.6); after&&after(); } }
function talk(n){ faceToward(n); const id=n.id, D=Wd.DIALOG;
  const job=Object.keys(Q).find(k=>{ const j=Q[k].job; return j&&j.npc===id&&j.where===S.kind&&G.quests[k]==='active'&&!(G.qprog||{})[k]; });
  if(job) return interact({type:'design',id:job,label:Q[job].job.label});   // bấm/chạm thẳng vào NPC có việc Huy Phan (Annie, thầy Huy Tạ...) cũng làm việc luôn, không mở bảng thường
  if(!STORY[id]) return UI.place(n.place,n);
  if(id==='phap'){   // Pháp: chào lần đầu rồi giao việc bắt bướm, sau đó việc "giải toả"
    if(!G.flags.hello){ NET.send({t:'hello'}); say(D.phap_hello); return; }
    if(Object.keys(Q).every(q=>G.quests[q]==='done')){ say(D.finale); return; } }
  const qs=Object.keys(Q).filter(k=>Q[k].giver===id), first=id==='phap'?null:qs[0];
  if(id==='donche'&&G.quests[first]==='done') return UI.donche(n);
  if(id==='huyphan'&&G.quests.web==='done') return UI.huyphan(n);   // xong wireframe: Huy Phan giao chuỗi việc thiết kế
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

// giây → "45 giây" / "19:59" (khớp kiểu "phút" ở khung nhiệm vụ, khỏi hiện "1199s")
const mmss=t=>t<60?t+' giây':Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
/* ---------- tương tác (E) ---------- */
function nearest(){
  let best=null, bd=1e9; const consider=(d,o)=>{ if(d<bd){ bd=d; best=o; } };
  const dist=(x,y)=>Math.hypot(x-P.x,(y-P.y)*1.3), k=S.kind, f=G.flags, t=NET.now();
  if(P.kayak){ for(const [i,[bx,by]] of SD.BUOYS.entries()) if(!G.daily.buoys[i]){ const d=dist(bx*T,by*T); if(d<22) consider(d,{type:'buoy',i,label:'Chạm phao'}); }
    const tx=Math.floor(P.x/T), ty=Math.floor(P.y/T); for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){ const g=S.map.grid[ty+dy]; if(g&&g[tx+dx]==='D') return {type:'unkayak',label:'Lên bờ'}; } return best; }
  for(const n of npcs){ const d=dist(n.x,n.y); if(d<(STORY[n.id]?28:46)) consider(d*.5,{type:'npc',n,label:STORY[n.id]?'Nói chuyện với '+speakerName(n.id).split(' (')[0]:speakerName(n.id).split(' (')[0]}); }
  /* người chơi khác: không bắt phím E nữa (hay đè lên hành động khác, bấm nhầm), muốn tương tác thì bấm thẳng vào người đó */
  if(window.MAPX) MAPX.consider(consider,dist);
  if(OIS.on){ const d=dist(OIS.x,OIS.y); if(d<28) consider(d*.5,{type:'oii',label:G.quests.goioii==='active'&&S.kind!=='yenlang'&&!(G.qprog||{}).goioii?'Nói: "Anh Độ gọi về ăn cơm"':'Nói chuyện với Ộ i i'}); }
  for(const [id,q] of Object.entries(Q)) if(q.job&&q.job.where===k&&G.quests[id]==='active'&&!(G.qprog||{})[id]){ const j=q.job, pts=j.npc?npcs.filter(n=>n.id===j.npc).map(n=>[n.x,n.y]):(j.at==='desk'?SD.LUMEN.desks:SD.DAS.seats).map(([x,y])=>[x*T,y*T]);   // việc thiết kế của Huy Phan
    for(const [x,y] of pts){ const d=dist(x,y); if(d<(j.npc?40:24)) consider(d*.35,{type:'design',id,label:'Việc Huy Phan: '+j.label}); } }
  if(k==='retreat'&&!MCKB){ const M=SD.MCK.stage, d=dist(M.x*T,(M.y+2)*T); if(d<56) consider(d,{type:'mckcall',label:'🎤 Thách đấu boss MCK'}); }
  if(k==='retreat'){ const Q=SD.YENLANG.pho, d=dist(Q.x*T,Q.y*T); if(d<26) consider(d,{type:'pho',label:G.quests.pho==='active'?'Mua phở chị Thảo ('+fmt(Q.price)+')':'Quán phở chị Thảo'}); }
  for(const s of khogaHere()){ const d=dist(s.x*T,s.y*T); if(d<18) consider(d,{type:'khoga',i:s.i,label:'Nhặt khô gà đè tem'}); }
  for(const s of pumpkinsHere()){ const d=dist(s.x*T,s.y*T); if(d<20) consider(d,{type:'pumpkin',i:s.i,label:'Hái bí ngô'}); }
  if(k==='club') for(const r of REM.values()) if(r.act==='shisha'){ const d=dist(r.x,r.y); if(d<9*T) consider(d*.3,{type:'report',r,label:'📸 Chụp ảnh '+r.name+' báo công an'}); }
  for(const c of FOLLOW.values()) if(!c.hide){ const d=dist(c.x,c.y); if(d<(c.f.kind==='cat'?20:26)) consider(d*.55,{type:'follow',c,label:c.f.kind==='cat'?'Vuốt ve '+c.f.name:'Nghe '+c.f.name+' nói'}); }
  for(const it of S.map.inter){ const d=dist(it.x,it.y); if(d<it.r) consider(d,{type:'obj',it,label:it.label}); }
  for(const o of S.map.obj||[]) if(o.grab){ const d=dist(o.x,o.y+4); if(d<30) consider(d+1,{type:'grab',label:'Gọi Grab (G) · đi map khác / về phòng'}); }   // đứng gần biển Grab
  for(const st of SD.BIKESHARE.stations) if(st.map===k){ const d=dist(st.x*T,st.y*T); if(d<40) consider(d,{type:'bikeshare',label:`Thuê xe đạp công cộng · ${fmt(SD.MOTO.models.xedap.price)}/${SD.BIKESHARE.min} phút`}); }   // trạm ở Ké và nông trại bác Trang (Đà Lạt)
  if(k==='retreat'){
    for(const [key,pc] of Object.entries(SD.PLACES)) if(pc.door&&(pc.map||'retreat')===S.kind){ const d=dist(pc.door.x*T,pc.door.y*T); if(d<26) consider(d,pc.scene?{type:'enter',place:key,label:'Vào '+pc.name}:{type:'place',place:key,label:pc.name}); }
    SD.PARK.spots.forEach((sp,i)=>{ const d=dist(sp.x*T,sp.y*T); if(d<30) consider(d,{type:'parkspot',i,label:'Quan sát: '+sp.name}); });
    if(P.pcar) return {type:'pcarpark',label:'Đỗ xe xuống'}; if(P.incar) return {type:'pcarleave',label:'Xuống xe'};
    if(PCAR&&PCAR.driving&&PCAR.driving!==NET.pid){ const dr=REM.get(PCAR.driving); if(dr&&dist(dr.x,dr.y)<60) consider(1,{type:'pcarride',label:'Lên xe Chika Phú (ghế phụ)'}); }
    if(S.kind==='retreat'&&WDINO){ const K=SD.WILDLIFE.dino.kinds[WDINO.k]||{}, d=dist((WDINO.dx||WDINO.x)*T,(WDINO.dy||WDINO.y)*T); if(d<(K.fly?7:5)*T) consider(d-20,{type:'dinophoto',label:`Chụp ảnh ${K.name} 📸`}); }
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
  if(st==='growing') return `${c.name} · ${p.o===NET.pub?'của bạn':p.n} · còn ${mmss(Math.ceil((p.at+c.grow*1000-NET.now())/1000))}`;
  if(p.o===NET.pub) return (c.verb||'Thu hoạch')+' '+c.name.toLowerCase(); return st==='open'&&!p.s?`Cướp ${c.name.toLowerCase()} của ${p.n}`:`${c.name} của ${p.n}`; }
function plotState(id,p){ return SD.plotState(p,NET.now()); }   // Đà Lạt cũng cướp được rau để quá giờ
async function interact(x){
  if(x.type==='npc') return talk(x.n);
  if(x.type==='mapx') return MAPX.pick(x);
  if(x.type==='player') return UI.social(x.r);
  if(x.type==='follow') return followSay(x.c);
  if(x.type==='oii'){ OIS.face=P.x>OIS.x?1:-1; oiiSay(); if(G.quests.goioii==='active'&&S.kind!=='yenlang'&&!(G.qprog||{}).goioii){ const r=await act({t:'yl',op:'goioii'}); if(!r.err) toast(esc(r.msg),'quest'); } return UI.oii(); }
  if(x.type==='mckcall'){ const r=await act({t:'mck',op:'call'}); if(!r.err) toast(esc(r.msg),'quest'); return; }
  if(x.type==='design'){ const r=await act({t:'design',id:x.id}); return; }
  if(x.type==='pho'){ const r=await act({t:'yl',op:'pho'}); if(!r.err){ sfx('item_pickup',.5); toast(esc(r.msg),'item'); } return; }
  if(x.type==='pumpkin'){ const r=await act({t:'pumpkin',i:x.i}); if(!r.err){ sfx('item_pickup',.5); for(let k=0;k<8;k++) fx.push({kind:'glint',x:P.x+(Math.random()-.5)*20,y:P.y-14+(Math.random()-.5)*12,t:-k*.04,life:.6}); toast(`Hái được <b>Bí ngô</b> · có ${r.n} quả, đổi quà với Cô Bí Ngô ở cổng Ké`,'item'); } return; }
  if(x.type==='khoga'){ const r=await act({t:'khoga',i:x.i}); if(!r.err){ sfx('item_pickup',.5); toast(`Nhặt được <b>Khô gà đè tem</b> (${Math.min(r.n,10)}/10)`,'item'); } return; }
  if(x.type==='report'){ const r=await act({t:'shisha',op:'report',id:x.r.id}); if(!r.err){ flash=.6; tone('square',1900,700,.05,.07); toast(esc(r.msg),'quest'); } return; }
  if(x.type==='pick'){ const r=await act({t:'pick',k:x.k,i:x.i}); if(r.err) return;
    if(x.k==='beagle'){ say(Wd.DIALOG.beagle_found,()=>{ sfx('dog_bark',.6); toast('Beagle đang chạy theo bạn. Dẫn về Cổng cho Pháp.','quest'); }); return; }
    if(x.k==='spot'){ flash=1; sfx('item_pickup',.6); toast('Đã chụp check-in','item'); return; }
    sfx('item_pickup',.5); if(r.item) toast(`Nhặt được <b>${SD.ITEMS[r.item].name}</b>`+(r.exp?` · +${r.exp} EXP`:''),'item'); return; }
  if(x.type==='enter') return act({t:'enter',place:x.place});
  if(x.type==='roomDoor') return UI.roomDoor(x.room);
  if(x.type==='bath') return startRoomAct('tam','chung');
  if(x.type==='grab') return UI.grab();
  if(x.type==='pcar'){ if(G.name.toLowerCase()!==SD.PCAR.owner){ toast('Xe riêng của Chika Phú, chỉ chủ xe lái được 🚗','lock'); return; } const r=await act({t:'pcar',op:'drive'}); if(!r.err){ P.pcar=true; sfx('car_4wd',.6); toast('Lên xe! Bấm E để đỗ xe xuống','item'); } return; }
  if(x.type==='dinophoto'){ const r=await act({t:'wild',op:'photo'}); if(!r.err){ flash=.6; sfx('blip',.5); toast(esc(r.msg),'quest'); } return; }
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
  if(x.type==='kayak'){ const r=await act({t:'kayak',op:'board'}); if(!r.err){ P.kayak=true; const w=findWater(); if(w){ P.x=w.x; P.y=w.y; } toast(`Lên kayak! Chạm đủ 5 phao vàng trên hồ · chèo càng xa càng dễ mò được đồ cổ (${Math.min((G.daily.treasure||0),SD.TREASURE.daily)}/${SD.TREASURE.daily} hôm nay)`,'quest'); } return; }
  if(x.type==='unkayak'){ await act({t:'kayak',op:'leave'}); P.kayak=false; const s=findSand(); if(s){ P.x=s.x; P.y=s.y; } return; }
  if(x.type==='buoy'){ const r=await act({t:'kayak',op:'buoy',i:x.i}); if(!r.err){ sfx('coin',.5); toast(`Chạm phao ${r.n}/5`,'item'); } return; }
  if(x.type==='plot') return UI.plot(x.id);
  if(x.type==='fish') return UI.fish();
  const it=x.it; if(!it) return;
  if(it.say){ say(it.say.map(t=>['me',t])); return; }
  if(it.id==='phone'){ if(G.flags.called){ say([['me','Pháp gọi rồi. Bấm G mở Grab đi Ké Retreat thôi.']]); return; } if(ringing){ ringing.pause(); ringing=null; } for(const d of $('#toasts').children) if(d.textContent.startsWith('Điện thoại đang reo')) d.remove();
    say(Wd.DIALOG.call,()=>{ NET.send({t:'call'}); toast('Nhiệm vụ: <b>Mở Grab (G), đi tới Ké Retreat</b>','quest'); }); return; }
  if(it.id==='bonfire'){ say([['me',G.flags.fire?'Lửa cháy tí tách, ấm cả sân Nhà Rếch.':'Đống củi chưa đốt. Đôn Chề đang thiếu củi.']]); return; }
  if(it.id==='car_low'||it.id==='car_top'){ const up=it.id==='car_low', c=SD.CARS[it.id];
    ask(up?'Đi xe 4 bánh lên khu trên? (lên dốc miễn phí)':`Đi xe 4 bánh xuống Cổng? (${fmt(c.price)})`,'me',['Đi','Thôi đi bộ'],async i=>{ if(i!==0) return; const r=await act({t:'car',id:it.id}); if(!r.err){ sfx('car_4wd',.6); fadeOnly(up?'Xe 4 bánh bò lên dốc...':'Xe 4 bánh đổ đèo xuống...'); } }); return; }
  const d=it.do;
  if(d&&d.indexOf(':')>0&&window.MAPX){ const [ns,op]=d.split(':'); if(MAPX[ns]) return MAPX[ns](op,it); }   // 3 map mới: bp:… vn:… mieu:… xử lý ở maps3.js
  if(d==='exit') return act({t:'exit'});
  if(d==='place') return UI.place(it.place,{id:it.place});
  if(d==='grab') return UI.grab();
  if(d==='ylhulk'){ const r=await act({t:'yl',op:'lau'}); return; }
  if(d==='ylstream'){ const r=await act({t:'yl',op:'stream'}); if(!r.err) toast('Anh Độ: "Chào anh em, hôm nay có khách quý lên sóng nhé!"','quest'); return; }
  if(d==='pickle') return UI.pickle();
  if(d==='pkwater'){ const r=await act({t:'pk',op:'water'}); if(!r.err) toast(esc(r.msg),'item'); return; }
  if(d==='lumennpc'){ const n=npcs.find(x=>x.id==='lumen_le'); return UI.place('lumen',n); }
  if(d==='lumendesk') return UI.lumen();
  if(d==='lumennap'||d==='lumencoffee'){ const r=await act({t:'lumen',op:d==='lumennap'?'nap':'coffee'}); if(!r.err) toast(esc(r.msg),'item'); return; }
  if(d==='diepcook'){ const r=await act({t:'diep',op:'cook'}); if(!r.err){ P.face=1; toast('Diệp: "Ngồi đó chờ chút, mình nấu ramen cho ăn nè!"','quest'); } return; }
  if(d==='arcade'){ revSnd(); toast(['Diệp: "Chơi thua rồi kìa, haha!"','Diệp: "Kỷ lục máy này là của mình đó nha"','Diệp: "Chơi xong nhớ khen đồ ăn ngon nhé"'][Math.floor(Math.random()*3)],'quest'); return; }
  if(d==='ra') return startRoomAct(it.act,undefined,it.bed,it.bath);
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
  if(d==='shisha'){ const r=await act({t:'shisha'}); if(!r.err){ P.face=1; P.view='side'; if(r.others) toast(`Có ${r.others} người khác trong phòng, coi chừng bị chụp ảnh báo công an 📸`,'lock'); } return; }
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
async function startRoomAct(a,where,bed,bath){ const r=await act({t:'ra',act:a,where,bx:bed&&bed.x,by:bed&&bed.y,bath:bath?1:0}); return r; }
async function fishing(){ if(!FISH){ const r=await act({t:'fish',op:'cast'}); if(!r.err){ FISH={st:'wait',x:P.x+P.face*22,y:P.y+(tileAt(P.x,P.y+12)==='W'?16:0)}; sfx('dash',.3); toast('Thả câu... đợi phao chìm rồi bấm E','item'); } return; }
  const r=await NET.req({t:'fish',op:'hook'}); FISH=null;
  if(r.miss||r.err){ toast(esc(r.msg||r.err),'lock'); return; } sfx('item_pickup',.6); toast(`Câu được <b>${SD.ITEMS[r.item].name}</b> · +${r.exp} EXP`,'vnd'); }

/* ---------- nút Về phòng: tự tìm đường tới cửa phòng đã thuê ---------- */
let AUTO=null, homeAfterExit=false, ROUTE=null;   // ROUTE: các bước đi qua nhiều cảnh (vd vào Nhà giải trí rồi tới cửa Phòng Bay)
function runRoute(){ if(!ROUTE||!ROUTE.length){ ROUTE=null; return; } const st=ROUTE.shift(); if(!ROUTE.length) ROUTE=null;
  if(st.place){ const pc=SD.PLACES[st.place]; walkTo(pc.door.x,pc.door.y,pc.name,()=>act({t:'enter',place:st.place})); return; }
  if(st.npc){ walkToNpc(st.npc); return; } walkTo(st.x,st.y,st.label,st.then); }
// đi tới map khác: cùng điểm đến (đang ở trong nhà / quán của map đó) thì làm luôn, khác thì tự gọi Grab, tới nơi chạy tiếp then()
let GOAFTER=null;
const destOf=sc=>SD.SCENE_DEST[sc]||(SD.DEST[sc]?sc:null), npcScene=id=>{ const n=SD.NPCS.find(x=>x.id===id); return n?(n.scene||'retreat'):null; };
async function autoGo(scene,then){ const want=destOf(scene); if(!want||destOf(S.kind)===want){ then&&then(); return true; }
  const xt=(G.xt&&G.xt.lv||0)>=SD.XICHTHO.tele;   /* Xích Thố cấp 15: dịch chuyển thay Grab */
  const r=await act({t:'grab',to:want,xt:xt?1:0}); if(r&&!r.err){ GOAFTER={scene,then,at:performance.now()}; if(!xt) toast(`🚕 Tự gọi Grab tới <b>${esc(SD.DEST[want].name)}</b>, tới nơi tự đi tiếp`,'quest'); return true; } return false; }
// nút ➜ ở bảng Việc cần làm: tự đi tới chỗ làm tiếp nhiệm vụ (hoặc về gặp người giao khi đã xong); nhiệm vụ ở map khác thì tự gọi Grab sang rồi đi tiếp
function questGo(id){ if(id==='herd') return herdGo(); if(id==='lumenscholar') return scholarGo(); const q=Q[id]; if(!q) return; UI.closeAll&&UI.closeAll();
  { const sc=q.job?null:npcScene(q.giver); if(sc&&destOf(sc)&&destOf(S.kind)!==destOf(sc)&&!(q.dance&&S.kind==='club')&&(canFinish(id)||G.quests[id]!=='active'||sc==='retreat')){ autoGo(sc,()=>questGo(id)); return; } }   /* về gặp người giao (nhận / trả việc, việc ở Ké); việc đang làm ở map khác để module map tự dẫn */
  if(window.MAPX&&MAPX.go(id)) return; if(q.giver==='oii') return oiiGo(id); if(q.giver==='do') return doGo(id); if(q.job) return hpGo(id);
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
// năng lượng / sạch sẽ / pin sắp cạn, đến giờ ăn: báo 1 lần mỗi mốc (dưới 25, dưới 10; hồi trên 35 thì reset) + nút tự đi làm ở bảng chỉ số
const NEED_HELP={energy:{low:'Năng lượng sắp cạn',how:'về phòng ngủ một giấc (giường / túi ngủ), hoặc uống nước tăng lực, bơi ở bể bơi Ké',act:'nghi',btn:'😴 Đi ngủ'},
  clean:{low:'Người bẩn rồi',how:'tắm ở phòng, nhà tắm chung cạnh khu cắm trại, hoặc bơi ở bể bơi Ké',act:'tam',btn:'🚿 Đi tắm'},
  battery:{low:'Pin điện thoại sắp hết',how:'về phòng cắm sạc ở ổ cạnh giường',act:'sac',btn:'🔋 Sạc pin'}};
let NEED_AFTER=null; const NEED_LV={};
function needsCheck(n){ const acts=[], t=NET.now();
  for(const k of Object.keys(NEED_HELP)){ const v=n[k], H=NEED_HELP[k], lv=v<10?2:v<25?1:0, was=NEED_LV[k]||0;
    if(lv>was){ toast(`${lv>1?'⚠️ ':''}<b>${H.low}</b> (${Math.round(v)}%): ${H.how}. Bấm <b>${H.btn}</b> ở bảng chỉ số để tự đi.`,'lock'); if(lv>1) sfx('blip',.4); }
    NEED_LV[k]=v>=35?0:Math.max(was,lv); if(v<25) acts.push([k,H.btn,v<10]); }
  if(n.battery<25&&!chargeHere()) acts.push(['nhosac',S&&S.kind==='vnpt'?'🔌 Trạm sạc miễn phí':'🔌 Xin sạc nhờ',n.battery<SD.GRAB.minBattery]);
  const ms=SD.mealStatus(G.meals,t), now=ms.find(m=>m.st==='now'), hung=SD.hunger(G.meals,t), key=now?now.name:hung?'doi'+hung:'';
  if(key&&NEED_LV.meal!==key) toast(now?`🍚 Đến giờ <b>${now.name.toLowerCase()}</b> (${now.from}:00–${now.to}:00): ra quán ăn kẻo đói. Bấm <b>🍚 Đi ăn</b> để tự đi tới quán gần nhất.`:`🍚 <b>Đang đói</b> (bỏ ${hung} bữa): ăn bù ở quán. Bấm <b>🍚 Đi ăn</b>.`,'lock');
  NEED_LV.meal=key; if(key) acts.push(['eat','🍚 Đi ăn',hung>1]);
  const html=acts.map(([k,label,crit])=>`<button class="needGo${crit?' crit':''}" type="button" data-k="${k}">${label} ➜</button>`).join('');
  if(html!==needsCheck.h){ needsCheck.h=html; $('#hudNeedsAct').innerHTML=html; } }
// ở phòng mình (phòng Hà Nội / phòng đã thuê) thì có ổ cắm; ở ngoài hết pin thì xin sạc nhờ người gần nhất trong map
const chargeHere=()=>S&&(S.kind==='room'||(S.kind==='stay'&&S.own));
function nhoSac(){ UI.closeAll&&UI.closeAll(); if(TASK) return toast('Đang làm việc khác, xong đã rồi xin sạc','lock');
  if(S.kind==='vnpt'){ const C=SD.VNPT.charger; toast('VNPT có <b>trạm sạc miễn phí</b> cạnh máy lấy số: sạc đầy 100%','quest'); return walkTo(C.x,C.y+.9,'Trạm sạc VNPT',()=>MAPX.vn('charge')); }   // nhà mạng có trạm sạc riêng
  const go=id=>act({t:'nhosac',npc:id}).then(r=>{ if(r&&!r.err){ P.face=1; toast('🔌 Đang cắm sạc nhờ, đứng yên 15 giây nhé','quest'); } });
  const near=npcs.filter(n=>!n.obj).map(n=>[n,Math.hypot(n.x-P.x,n.y-P.y)]).sort((a,b)=>a[1]-b[1]);
  if(!near.length) return go('');                                                                   // map không có ai: nhờ người qua đường
  const [n,d]=near[0], name=speakerName(n.id).split(' (')[0]; if(d<60) return go(n.id);
  toast(`Pin yếu: tới chỗ <b>${esc(name)}</b> xin cắm sạc nhờ`,'quest'); walkTo(n.x/T,n.y/T+1.1,name,()=>go(n.id)); }
function needGo(k){ UI.closeAll&&UI.closeAll(); if(k==='eat') return eatGo(); if(k==='nhosac'||(k==='battery'&&S.kind==='vnpt')) return nhoSac(); const H=NEED_HELP[k], today=vn().day, stay=G.stay&&G.stay.paid===today&&G.stay.room;
  if(S.kind==='room'||(S.kind==='stay'&&S.own)){ const it=(S.map.inter||[]).find(i=>i.do==='ra'&&i.act===H.act);
    if(it) return walkTo(it.x/T,it.y/T,it.label,()=>interact({type:'obj',it,label:it.label}));   // gọi đúng việc (ngủ/tắm/sạc), không lấy điểm gần nhất (dễ trúng điện thoại)
    if(k==='clean'){ toast('Lều không có chỗ tắm: ra nhà tắm chung cạnh khu cắm trại','quest'); NEED_AFTER=k; homeAfterExit=false; return act({t:'exit'}); } }
  if(k==='clean'&&S.kind==='retreat'&&(!stay||SD.ROOMS[stay].bath==='chung')){ const B=SD.BATHHOUSE; return walkTo(B.x,B.y+.6,'Nhà tắm chung',()=>interact({type:'bath',label:'Tắm ở nhà tắm chung'})); }
  if(stay&&S.kind!=='room'&&(S.kind==='retreat'||S.kind==='stay'||(SD.INTERIORS[S.kind]&&!SD.INTERIORS[S.kind].map))){ NEED_AFTER=k; return goHome(); }
  if(k==='battery'&&G.needs.battery<SD.GRAB.minBattery){ toast('Hết pin không gọi được Grab về phòng: xin cắm sạc nhờ người gần đây trước','lock'); return nhoSac(); }
  NEED_AFTER=k; toast(`${H.low}: ${H.how}. Gọi Grab về phòng ở Hà Nội (hoặc phòng đã thuê ở Ké)`,'quest'); UI.grab(); }
// học kỹ năng: ở phòng Hà Nội thì tới laptop mở tab Học; ở phòng thuê thì mở bằng điện thoại; ở ngoài thì về phòng trước (thuê ở Ké hoặc Grab về Hà Nội)
let LEARN_AFTER=false;
function learnGo(){ UI.closeAll&&UI.closeAll(); const today=vn().day, stay=G.stay&&G.stay.paid===today;
  if(S.kind==='room'){ const it=(S.map.inter||[]).find(i=>i.do==='hub'); return it?walkTo(it.x/T,it.y/T,'Laptop',()=>UI.learn()):UI.learn(); }
  if(S.kind==='stay'&&S.own) return UI.learn();
  LEARN_AFTER=true; if(stay&&(S.kind==='retreat'||S.kind==='stay'||(SD.INTERIORS[S.kind]&&!SD.INTERIORS[S.kind].map))) return goHome();
  toast('Về phòng ở Hà Nội để học: chọn "Phòng của bạn" trong Grab','quest'); UI.grab(); }
document.addEventListener('click',e=>{ const b=e.target.closest('.learnGo'); if(!b) return; e.stopPropagation(); learnGo(); });
// đi ăn: quán gần nhất ở map này (NPC bán hàng có thực đơn)
function eatGo(){ const shops=npcs.filter(n=>{ const d=SD.NPCS.find(x=>x.id===n.id), pc=d&&d.place&&SD.PLACES[d.place]; return pc&&(pc.menu||[]).length; }).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
  if(shops.length) return walkToNpc(shops[0].id);
  toast('Map này không có quán ăn. Về Ké (quán cơm, nhà ăn khu trên, bánh mì Dân Tổ) hoặc thị trấn Đà Lạt: bấm G gọi Grab','quest'); }
document.addEventListener('click',e=>{ const b=e.target.closest('.needGo'); if(!b) return; e.stopPropagation(); b.blur(); needGo(b.dataset.k); });
// các xe / ngựa đang có để chọn đi (bảng Chọn xe, phím H): xe đang chọn + xe cất trong gara + ngựa (thuê / của mình)
function rideChoices(){ const t=NET.now(), out=[]; if(G.moto&&G.moto.until>t) out.push({kind:'moto',model:G.moto.model,until:G.moto.until,cur:true});
  for(const [k,u] of Object.entries(G.garage||{})) if(u>t) out.push({kind:'moto',model:k,until:u}); const h=G.horse; if(h&&(h.own||h.until>t)) out.push({kind:'horse',own:h.own,until:h.until}); return out; }
async function rideGo(o){ UI.closeAll&&UI.closeAll(); if(tileAt(P.x,P.y)==='L'){ toast('Đang ở dưới nước, lên bờ đã','lock'); return; }
  if(o.kind==='horse'){ const c=await act({t:'horse',op:'coat',c:o.coat}); if(c.err) return; G.horseCoat=o.coat; if(P.riding) return toast('Đổi sang '+SD.HORSE.coats[o.coat],'item');
    if(P.moto){ const r=await act({t:'moto',op:'dismount'}); if(r.err) return; P.moto=null; } const r=await act({t:'horse',op:'mount'}); if(!r.err){ P.riding=true; toast('Lên '+SD.HORSE.coats[o.coat]+'! Chạy nhanh hơn, chở được 3 thùng hàng','item'); } return; }
  if(P.riding){ const r=await act({t:'horse',op:'dismount'}); if(r.err) return; P.riding=false; }
  const r=await act({t:'moto',op:'pick',model:o.model}); if(r.err) return; G.moto=r.moto; if(r.riding){ P.moto=o.model; toast('Đổi sang '+(MOTO_NAME[o.model]||o.model),'item'); } else mountMoto(); }
const MOTO_NAME={wave:'Wave',dream:'Dream Thái',exciter:'Exciter',sh:'SH',xedap:'Xe đạp'};
// chăn ngựa: chưa ăn cỏ thì tự dắt ra giữa đồng cỏ (vào tới nơi là tự cho ăn), ăn xong thì dắt về anh Phong
function herdGo(){ UI.closeAll&&UI.closeAll(); if(!HERD) return; if(S.kind!=='dalat'){ toast('Đàn ngựa ở trại anh Phong, Đà Lạt: bấm G gọi Grab','quest'); return; }
  if(HERD.phase==='go'){ const z=SD.DALAT.pasture; if(inPasture()){ toast('Đứng yên trong đồng cỏ cho ngựa gặm cỏ '+SD.HORSE.herd.dur+' giây','quest'); return; } return walkTo((z.x0+z.x1)/2,(z.y0+z.y1)/2,'Đồng cỏ'); }
  walkToNpc('anhphong'); }
// học bổng Lumen: chưa đủ chứng chỉ thì tới thầy Huy Tạ ở DAS, đủ rồi thì về gặp Annie ở Lumen Studio
function scholarGo(){ UI.closeAll&&UI.closeAll(); const ok=((G.das||{}).certs||[]).length>=SD.LUMEN.needCerts, [to,npc]=ok?['lumen','lumen_le']:['das','huyta'];
  if(S.kind===to) return walkToNpc(npc); autoGo(to,()=>walkToNpc(npc)); }   /* tự gọi Grab tới Lumen / DAS */
/* ---------- trận pickleball 2 vs 2: bot ở ô của mình, bóng bay theo đường cong (lob cao, drive thấp), vòng ngắm co dần ở người phải đỡ ---------- */
let PK=null, PKSHOT='drive', PKJUDGE=null; function pkView(){ return !!(S&&S.kind==='pickle'&&PK&&(PK.st==='play'||PK.st==='end')&&PK.me>=0); } const PKSWING={}, PKAV={}, PKBALL={};
NET.listen('pk',m=>{ const old=PK; PK=m.v; if(PK.ball&&(!old||!old.ball||old.ball.t0!==PK.ball.t0)) PKSWING[PK.ball.from]=performance.now();
  if(PK.st==='play'&&(!old||old.st!=='play')){ UI.closeAll&&UI.closeAll(); PKSHOT='drive'; } if(UI.isOpen&&UI.isOpen()) UI.refresh&&UI.refresh(); });
// ảnh mặt ở bảng vào sân: bot lấy hình tuyển thủ, mình lấy nhân vật mình, người khác lấy nhân vật đang thấy trên sân (lưu sẵn theo tên)
const PKFACE={}; function pkFace(s){ if(!s) return ''; const key=s.bot?'b:'+s.name:'p:'+s.name+(s.pid===NET.pid?JSON.stringify(G.look):((REM.get(s.pid)||{}).look||'')); if(PKFACE[key]) return PKFACE[key];   // đổi đồ thì ảnh đổi theo
  let av=null; try{ av=s.bot?pkBotAv(s):s.pid===NET.pid?(P.av||AVATAR.build(G.look)):(REM.get(s.pid)||{}).av; }catch(e){} if(!av||!av.portrait) return ''; return PKFACE[key]=av.portrait.toDataURL(); }
function pkBotAv(s){ if(PKAV[s.name]) return PKAV[s.name]; const i=Math.max(0,SD.PICKLE.bots.findIndex(b=>b[0]===s.name)), nu=s.g==='nu';
  return PKAV[s.name]=AVATAR.build({gender:nu?'nu':'nam',hair:nu?'ponytail':'fade',hairColor:'2a1c18',skin:'eec0a0',outfit:{top:'ao_pk'+i,bottom:'short_xam',shoes:'giay_trang'},opts:{mouth:'smile'}}); }
// bot đứng theo vị trí server gửi (nội suy cho mượt); người thật vẽ ở vị trí thật; ai cũng cầm vợt, đánh thì vung vợt
const PKPOS={};
function drawPaddle(x,y,face,view,e,col){ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y), sw=e<.35, side=view==='side'?face:1, a=sw?(-1.4+e/.35*2.4)*side:.35*side;   // cán vợt nằm trong bàn tay (ngang hông), mặt vợt chĩa lên ra ngoài
  ctx.save(); ctx.translate(X+side*8,Y-12); ctx.rotate(a); ctx.fillStyle='#26262c'; ctx.fillRect(-1,-4,3,6); ctx.fillStyle=col; ctx.fillRect(-3,-12,7,8); ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(-2,-11,2,2); ctx.strokeStyle='#1c1516'; ctx.lineWidth=1; ctx.strokeRect(-3.5,-12.5,8,9); ctx.restore(); }
function drawPickle(list){ if(S.kind!=='pickle'||!PK||PK.st==='idle') return; const K=SD.PICKLE, now=NET.now(), b=PK.ball;
  PK.seats.forEach((s,i)=>{ if(!s) return; const e=(performance.now()-(PKSWING[i]||0))/1000, col=['#ff6a55','#ffd84a','#7fe0ff','#7de07a'][i], net=i<2?'up':'down';
    if(s.pid===NET.pid){ list.push({y:P.y+1,d:()=>drawPaddle(P.x,P.y,P.face,P.view,e,col)}); return; }
    let x, y, mv=false, face=1, view=net, av;
    if(s.bot){ const t=PK.pos&&PK.pos[i]||K.slots[i], c=PKPOS[i]||(PKPOS[i]={x:t[0],y:t[1]}), dx=t[0]-c.x, dy=t[1]-c.y; c.x+=dx*.25; c.y+=dy*.25; mv=Math.hypot(dx,dy)>.08; if(Math.abs(dx)>.02) c.f=dx>0?1:-1; face=c.f||1; x=c.x*T; y=c.y*T; av=pkBotAv(s); }
    else { const r=REM.get(s.pid); if(!r||!r.av) return; x=r.x; y=r.y; mv=r.anim&&r.anim.startsWith('run')||r.anim&&r.anim.startsWith('walk'); face=r.face; av=r.av; }
    if(mv) view='side'; const anim=mv?'run':'idle_'+net;
    list.push({y,d:()=>{ drawChar(ctx,av,x,y,face,view,av.anims[anim]?anim:mv?'walk':'idle',e<.35&&!mv?'attack':'',clock,e,0); drawPaddle(x,y,face,view,e,col); }}); if(s.bot) SAYS.push({x,y:y-46,name:s.name+' 🤖',text:''}); });
  if(!b||PK.st!=='play') return; const k=Math.max(0,Math.min(1,(now-b.t0)/(b.at-b.t0))), X=(b.fx+(b.tx-b.fx)*k)*T, Yg=(b.fy+(b.ty-b.fy)*k)*T, Z=Math.sin(k*Math.PI)*({lob:52,dink:16,serve:26,drive:10}[b.shot]||12)+16, bs=PKBALL.s||(PKBALL.s=A.pkBall());
  list.push({y:Yg+2,d:()=>{ shadow(X,Yg,3); ctx.drawImage(bs.c,Math.round(X-3-cam.x),Math.round(Yg-Z-3-cam.y)); }});
  const mine=PK.me>=0&&(PK.me<2?0:1)===b.team, R=K.reach*T, rr=6+(1-k)*(R-6);
  list.push({y:b.ty*T-30,d:()=>{ const cx=Math.round(b.tx*T-cam.x), cy=Math.round(b.ty*T-cam.y); ctx.lineWidth=mine?2:1;   // vòng ngoài = tầm vợt, vòng trong co dần tới lúc bóng tới
    ctx.strokeStyle=mine?'rgba(255,216,74,.55)':'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(cx,cy,R,R*.45,0,0,7); ctx.stroke();
    ctx.strokeStyle=mine?'#ffd84a':'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(cx,cy,rr,rr*.45,0,0,7); ctx.stroke(); }}); }
/* ---------- boss MCK ở đấu trường góc Tây Bắc Ké ---------- */
let MCKB=null; NET.listen('mck',m=>{ const old=MCKB; MCKB=m.v; if(MCKB&&old){ MCKB.dx=old.dx; MCKB.dy=old.dy; } });
const inMck=()=>{ const a=SD.MCK.arena, x=P.x/T, y=P.y/T; return S&&S.kind==='retreat'&&x>=a.x0&&x<=a.x1+1&&y>=a.y0&&y<=a.y1+1; };
function drawMck(list){ const M=MCKB; if(!M||S.kind!=='retreat') return; if(M.dx==null){ M.dx=M.x; M.dy=M.y; } const ox=M.dx, oy=M.dy; M.dx+=(M.x-M.dx)*.2; M.dy+=(M.y-M.dy)*.2;
  const x=M.dx*T, y=M.dy*T, mv=Math.hypot(M.dx-ox,M.dy-oy)>.003, e=Math.max(0,(NET.now()-M.actAt)/1000), sc=1.5;
  list.push({y,d:()=>{ shadow(x,y,14); const X=Math.round(x-cam.x), Y=Math.round(y-cam.y); ctx.save(); ctx.translate(X,Y); ctx.scale(sc,sc); ctx.translate(-X,-Y);
    drawChar(ctx,starAv('mck'),x,y,M.face,'side',mv?'walk':'idle',M.act==='punch'&&e<.4?'attack':'',clock,e,0);
    ctx.fillStyle='#18181c'; ctx.fillRect(X+M.face*7-1,Y-24,3,6); ctx.fillStyle='#5a5a66'; ctx.fillRect(X+M.face*7-1,Y-27,3,3); ctx.restore(); }});   // tay cầm mic
  for(const [wx,wy] of M.waves){ const X0=wx*T, Y0=wy*T; list.push({y:Y0+20,d:()=>{ const X=Math.round(X0-cam.x), Y=Math.round(Y0-cam.y); ctx.lineWidth=2;
    for(let r=0;r<3;r++){ ctx.strokeStyle=`rgba(194,112,255,${.9-r*.25})`; ctx.beginPath(); ctx.arc(X,Y,4+r*4+Math.sin(clock*12)*1,0,7); ctx.stroke(); } ctx.fillStyle='#ff4fa3'; ctx.fillRect(X-1,Y-1,3,3); }}); }
  SAYS.push({x,y:y-74,name:`MCK · ${Math.ceil(M.hp)}/${M.max}`,text:M.line&&NET.now()-M.lineAt<2600?M.line:''}); }
function mckBar(){ const b=$('#mckBar'), M=MCKB, on=!!M&&inMck(); b.hidden=!on; if(!on) return; const me=(M.hps&&M.hps[NET.pid]!=null)?M.hps[NET.pid]:SD.MCK.playerHp;
  b.querySelector('.mg i').style.width=Math.max(0,M.hp/M.max*100)+'%'; b.querySelector('.mg b').textContent=Math.ceil(M.hp)+'/'+M.max;
  b.querySelector('.op i').style.width=Math.max(0,me/SD.MCK.playerHp*100)+'%'; b.querySelector('.op b').textContent=Math.ceil(me)+'/'+SD.MCK.playerHp; }
// việc thiết kế của Huy Phan: tới đúng map (Lumen / DAS) rồi tới bàn, ghế lớp hoặc người cần gặp; xong thì về Ké gặp Huy Phan
function hpGo(id){ const j=Q[id].job; if(canFinish(id)){ if(S.kind==='retreat') return walkToNpc('huyphan'); autoGo('retreat',()=>questGo(id)); return; }
  if(S.kind!==j.where){ autoGo(j.where,()=>questGo(id)); return; }
  if(j.npc) return walkToNpc(j.npc); const pts=(j.at==='desk'?SD.LUMEN.desks:SD.DAS.seats).slice().sort((a,b)=>Math.hypot(a[0]*T-P.x,a[1]*T-P.y)-Math.hypot(b[0]*T-P.x,b[1]*T-P.y));
  walkTo(pts[0][0],pts[0][1],j.label,()=>act({t:'design',id})); }
// việc của anh Độ: xong thì về 120 Yên Lãng; phở thì tới ngõ phố Đà Bắc (Ké), lau Hulkbuster ở nhà anh Độ, gọi Ộ i i thì tới chỗ Ộ i i
function doGo(id){ const Y=SD.YENLANG; if(canFinish(id)){ if(S.kind==='yenlang') return walkToNpc('do'); autoGo('yenlang',()=>questGo(id)); return; }
  if(id==='pho'){ if(S.kind==='retreat') return walkTo(Y.pho.x,Y.pho.y,'Quán phở chị Thảo'); autoGo('retreat',()=>questGo(id)); return; }
  if(id==='hulk'){ if(S.kind==='yenlang') return walkTo(Y.hulk.x-.4,Y.hulk.y+.2,'Mô hình Hulkbuster',()=>act({t:'yl',op:'lau'})); toast('Mô hình ở nhà anh Độ: bấm G gọi Grab về 120 Yên Lãng','quest'); UI.grab(); return; }
  if(OIS.on&&S.kind!=='yenlang') return walkTo(OIS.x/T,OIS.y/T+.8,'Ộ i i',()=>{ const x=nearest(); if(x) interact(x); }); toast('Ộ i i đang lang thang ở map khác (buổi tối thì ở nhà anh Độ). Ra Ké, Đà Lạt, DAS... tìm nhé','quest'); }
// việc của Ộ i i: xong thì đi tìm Ộ i i (map nào cũng có), khô gà thì tới gói gần nhất ở map này, shisha thì vào góc shisha Nhà giải trí
const OII_MAPS={retreat:'Ké Retreat',dalat:'Đà Lạt',das:'DAS',everfit:'Everfit',club:'Nhà giải trí',net:'tiệm net Đà Lạt'};
// nút → ở bảng Hằng ngày: chỉ đường / mở đúng bảng cho từng việc
function dqGo(id){ UI.closeAll();
  if(id==='pumpkin'){ const here=pumpkinsHere().sort((a,b)=>Math.hypot(a.x*T-P.x,a.y*T-P.y)-Math.hypot(b.x*T-P.x,b.y*T-P.y)); if(here.length) return walkTo(here[0].x,here[0].y,'Bí ngô'); toast('Bí ngô mọc ở Ké Retreat và Đà Lạt (chấm cam trên minimap), mỗi giờ đổi chỗ','quest'); return; }
  if(id==='harvest') return UI.farm(); if(id==='grab') return UI.grab(); if(id==='meal'&&typeof eatGo==='function') return eatGo();
  const tip={fish:'Ra mép hồ ở Ké hoặc Đà Lạt, đứng sát nước bấm E để câu',forage:'Hoa lá, măng, nấm mọc ven rừng ở Ké, lại gần bấm E để hái',bug:'Cầm vợt vào rừng ở Ké, thấy bướm bay thì bấm E để vồ',
    photo:'Tới chỗ cảnh đẹp (cổng Ké, bến hồ, khu cắm trại...) bấm P để chụp',pickle:'Bấm G gọi Grab tới Sân pickleball (Hà Nội), vào sân đấu 2 vs 2',treasure:'Thuê kayak ở bãi cát cạnh bến Ké, chèo vòng quanh hồ là vớt được đồ cổ',
    money:'Làm việc, bán nông sản, cá, đồ cổ cho cô Ké đều ra tiền',exp:'Làm nhiệm vụ, học ở DAS, làm việc đều có EXP'}[id]; if(tip) toast(tip,'quest'); }
function oiiGo(id){ const H=SD.SHISHA;
  if(canFinish(id)){ if(OIS.on) return walkTo(OIS.x/T,OIS.y/T+.8,'Ộ i i',()=>{ oiiSay(); UI.oii(); }); toast('Ra ngoài tìm Ộ i i, map nào cũng có','quest'); return; }
  if(id==='khoga'){ const here=khogaHere().sort((a,b)=>Math.hypot(a.x*T-P.x,a.y*T-P.y)-Math.hypot(b.x*T-P.x,b.y*T-P.y)); if(here.length) return walkTo(here[0].x,here[0].y,'Khô gà đè tem');
    const left=[...new Set(OI.khoga.filter((s,i)=>!(G.flags.khoga||{})[i]).map(s=>OII_MAPS[s.scene]))]; toast('Map này hết khô gà. Còn ở: '+left.join(', ')+' (bấm G gọi Grab)','quest'); return; }
  if(S.kind==='club') return walkTo(H.seat.x,H.seat.y,'Góc shisha',()=>{ const t=nearest(); if(t) interact(t); });
  if(S.kind==='retreat'){ ROUTE=[{place:'club'},{x:H.seat.x,y:H.seat.y,label:'Góc shisha'}]; return runRoute(); }
  toast('Nhà giải trí ở Ké Retreat: bấm G gọi Grab về Ké','quest'); }
document.addEventListener('click',e=>{ const b=e.target.closest('.qgo'); if(!b) return; e.stopPropagation(); b.blur(); questGo(b.dataset.go); });
// bấm 1 dòng ở Vườn & chuồng: tự đi tới ô rau / chuồng đó
document.addEventListener('click',e=>{ const r=e.target.closest('#hudQuests .frow'); if(!r) return; const d=r.dataset;
  if(S.kind!==d.map){ toast(`${esc(d.n)} ở ${d.map==='dalat'?'nông trại Đà Lạt':'Ké Retreat'}: bấm G gọi Grab tới đó trước`,'lock'); return; } walkTo(+d.x,+d.y,d.n); });
// BFS trên lưới ô (4 hướng); goals: danh sách ô đích, đi tới ô gần nhất theo đường đi
function findPath(goals){ const W=S.W, H=S.H, sx=Math.floor(P.x/T), sy=Math.floor(P.y/T), start=sy*W+sx, gs=new Set(goals.map(([x,y])=>y*W+x)), prev=new Int32Array(W*H).fill(-1), q=[start]; prev[start]=start; let hitAt=-1;
  // NPC đứng yên cũng chắn đường (va chạm trong blocked()), nên coi ô của họ là tường
  for(const n of npcs){ const nx=Math.floor(n.x/T), ny=Math.floor(n.y/T); for(const [ax,ay] of [[0,0],[-1,0],[1,0],[0,-1]]){ const i=(ny+ay)*W+nx+ax; if(i!==start&&!gs.has(i)) prev[i]=-2; } }
  // nước bể bơi: ngựa / xe không lội được nên tìm đường vòng; đi bộ cũng tránh, trừ khi đích nằm trong bể
  const grid=S.map.grid, vehicle=P.riding||P.moto||P.pcar||P.opt, goalWet=goals.some(([x,y])=>grid[y]&&grid[y][x]==='L'), wet=n=>grid[(n/W)|0][n%W]==='L'&&(vehicle||!goalWet);
  for(let h=0;h<q.length;h++){ const c=q[h]; if(gs.has(c)){ hitAt=c; break; } const x=c%W, y=(c/W)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const n=ny*W+nx; if(prev[n]!==-1||((S.solid[n]||wet(n))&&!gs.has(n))) continue; prev[n]=c; q.push(n); } }
  if(hitAt<0) return null; const path=[]; for(let c=hitAt;c!==start;c=prev[c]) path.push({x:(c%W+.5)*T,y:((c/W|0)+.75)*T}); return path.reverse(); }
// tự tìm đường tới (tx,ty) theo ô; then: chạy khi tới nơi
// tên khu đang đứng: nhiều khu chồng nhau (đường Thuỵ Khuê chạy ngang cả cổng Ké) thì lấy khu nhỏ nhất = cụ thể nhất;
// ra ngoài mọi khu thì minimap về tên map, còn nhạc vẫn giữ theo khu vừa đi qua (zoneLast) để khỏi đổi bài liên tục ở mép khu
function zoneAt(zones,tx,ty){ let best=null, ba=1/0; for(const z of zones||[]) if(tx>=z.x0&&tx<=z.x1+1&&ty>=z.y0&&ty<=z.y1+1){ const a=(z.x1-z.x0+1)*(z.y1-z.y0+1); if(a<ba){ ba=a; best=z; } } return best; }
function enterZone(){ const z=zoneAt(S.map.zones,P.x/T,P.y/T); if(!z){ zoneName=''; return; } if(z.name!==zoneName){ const was=zoneName||zoneLast; zoneName=zoneLast=z.name; if(z.name!==was) banner(z.name); } }
function walkTo(tx,ty,label,then,opt={}){ const goals=[]; for(let r=1;r<=4&&!goals.length;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const x=Math.floor(tx)+dx, y=Math.floor(ty)+dy; if(x>=0&&y>=0&&x<S.W&&y<S.H&&!S.solid[y*S.W+x]&&!((P.riding||P.moto||P.pcar||P.opt)&&S.map.grid[y][x]==='L')) goals.push([x,y]); }   // mục tiêu trong nhà/bị chặn thì nới dần ra ô đi được gần nhất (đang cưỡi ngựa / đi xe thì không lấy ô nước bể bơi)
  const path=findPath(goals.length?goals:[[Math.floor(tx),Math.floor(ty)]]); if(!path){ toast('Không tìm được đường tới đó','lock'); return false; }
  if(!path.length){ AUTO=null; if(then) then(); return true; }   /* đã đứng ở đích */
  AUTO={path,i:0,stuck:0,lx:P.x,ly:P.y,then:then||null,dest:[tx,ty],label,retries:opt.retries||0}; if(label&&!opt.quiet) toast(`Đang đi tới ${esc(label)}... (bấm phím đi để dừng)`,'item'); return true; }
// đoạn thẳng (ax,ay)→(bx,by) có đi lọt không: thân rộng hơn hitbox 1 chút, không đụng tường / nước bể bơi / NPC (soát 4px một lần)
function clearLine(ax,ay,bx,by,wetOk){ const n=Math.ceil(Math.hypot(bx-ax,by-ay)/4), grid=S.map.grid, veh=P.riding||P.moto||P.pcar||P.opt;
  for(let k=1;k<=n;k++){ const x=ax+(bx-ax)*k/n, y=ay+(by-ay)*k/n;
    for(const [cx,cy] of [[x-6,y-5],[x+6,y-5],[x-6,y],[x+6,y]]){ if(solidAt(cx,cy)) return false; if(!P.kayak&&grid[Math.floor(cy/T)][Math.floor(cx/T)]==='L'&&(veh||!wetOk)) return false; }
    for(const m of npcs) if(!m.pass&&Math.hypot(m.x-x,(m.y-y)*1.6)<10) return false; }
  return true; }
// chuột phải / chạm đất trống: đi đúng tới điểm bấm; thấy đường thẳng thì đi thẳng luôn, không thì tìm đường theo ô (vòng lặp di chuyển sẽ cắt góc)
function walkPoint(x,y,opt={}){ let tx=Math.floor(x/T), ty=Math.floor(y/T); const veh=P.riding||P.moto||P.pcar||P.opt, grid=S.map.grid;
  const ok=tx>=0&&ty>=0&&tx<S.W&&ty<S.H&&!S.solid[ty*S.W+tx]&&!(veh&&grid[ty][tx]==='L'); if(!ok) return walkTo(x/T,y/T,'',null,opt);
  if([[x-5,y-4],[x+5,y-4],[x-5,y],[x+5,y]].some(([a,b])=>solidAt(a,b))){ x=(tx+.5)*T; y=(ty+.75)*T; }   /* bấm sát mép tường: đứng giữa ô */
  const wetOk=!veh&&grid[ty][tx]==='L', mk=path=>{ AUTO={path,i:0,stuck:0,lx:P.x,ly:P.y,then:null,dest:[x/T,y/T],pt:[x,y],label:'',retries:opt.retries||0,exact:true,wetOk}; return true; };
  if(clearLine(P.x,P.y,x,y,wetOk)) return mk([{x,y}]);
  const path=findPath([[tx,ty]]); if(!path) return walkTo(x/T,y/T,'',null,opt);
  if(path.length) path[path.length-1]={x,y}; else path.push({x,y}); return mk(path); }
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
try{ const q=localStorage.getItem('chan-qmin'); if(q==='1'||TOUCH) document.body.classList.add('qmin'); }catch(e){}
document.addEventListener('click',e=>{ if(e.target.closest('#mStat')){ if(document.body.classList.toggle('mstat')) document.body.classList.add('qmin'); renderHUD(); return; }   /* mobile: mở bảng này thì gập bảng kia */ if(!e.target.closest('#qToggle')&&!(TOUCH&&e.target.closest('#hudQuests h4'))) return; const on=document.body.classList.toggle('qmin'); if(!on) document.body.classList.remove('mstat'); try{ localStorage.setItem('chan-qmin',on?'1':'0'); }catch(e){} renderHUD(); });
// thanh kỹ năng: mặc định ẩn, bấm ~ hoặc nút góc dưới trái để hiện
function toggleSkills(){ const on=document.body.classList.toggle('skills'); try{ localStorage.setItem('chan-skills',on?'1':'0'); }catch(e){} }
try{ if(localStorage.getItem('chan-skills')==='1') document.body.classList.add('skills'); }catch(e){}
$('#btnSkills').addEventListener('click',e=>{ e.currentTarget.blur(); toggleSkills(); });
// chuột: phải = tự đi tới chỗ đó; trái = bấm người / cửa / đồ có hành động (rê chuột vào thì sáng lên kèm tên)
let HOVER=null, DEST=null;
const worldAt=e=>[e.clientX/SCALE+cam.x,e.clientY/SCALE+cam.y];
function pickAt(wx,wy){ let best=null, bd=1e9; const c=(d,o)=>{ if(d<bd){ bd=d; best=o; } }, body=(x,y)=>Math.abs(wx-x)<10&&wy>y-40&&wy<y+4;
  for(const n of npcs) if(body(n.x,n.y)) c(Math.hypot(n.x-wx,n.y-18-wy),{kind:'npc',n,x:n.x,y:n.y,label:STORY[n.id]?speakerName(n.id):(SD.NPC_LOOKS[n.id]||{}).name||n.id});
  for(const r of REM.values()) if(r.av&&body(r.x,r.y)) c(Math.hypot(r.x-wx,r.y-18-wy)+14,{kind:'player',r,x:r.x,y:r.y,label:r.name});   // xếp sau NPC/đồ vật để khỏi bấm nhầm
  if(OIS.on&&Math.abs(wx-OIS.x)<10&&wy>OIS.y-40&&wy<OIS.y+4) c(Math.hypot(OIS.x-wx,OIS.y-18-wy),{kind:'oii',x:OIS.x,y:OIS.y,label:'Ộ i i'});
  for(const f of FOLLOW.values()) if(!f.hide&&Math.abs(wx-f.x)<9&&wy>f.y-(f.f.kind==='cat'?14:40)&&wy<f.y+3) c(Math.hypot(f.x-wx,f.y-8-wy)-2,{kind:'follow',x:f.x,y:f.y,label:f.f.name});
  for(const it of S.map.inter||[]) if(it.label){ const d=Math.hypot(it.x-wx,it.y-wy); if(d<Math.max(14,(it.r||20)*.8)) c(d+4,{kind:'spot',x:it.x,y:it.y,label:it.label}); }
  if(S.kind==='retreat'){ for(const pc of Object.values(SD.PLACES)) if(pc.door&&!pc.map){ const d=Math.hypot(pc.door.x*T-wx,(pc.door.y-1)*T-wy); if(d<22) c(d+2,{kind:'spot',x:pc.door.x*T,y:pc.door.y*T,label:pc.name}); }
    for(const r of Object.values(SD.ROOMS)) for(const [x,y] of r.doors||[]){ const d=Math.hypot(x*T-wx,(y-1)*T-wy); if(d<20) c(d+2,{kind:'spot',x:x*T,y:y*T,label:r.name}); } }
  return best; }
const mouseOk=()=>started&&S&&!travelling&&!(UI.blocking&&UI.blocking())&&$('#mapView').hidden&&!(S.kind==='deo'&&STUNT);
cvs.addEventListener('mousemove',e=>{ if(!mouseOk()){ HOVER=null; cvs.style.cursor=''; return; } const [x,y]=worldAt(e); HOVER=pickAt(x,y); cvs.style.cursor=HOVER?'var(--cur-hand)':''; });
cvs.addEventListener('mouseleave',()=>{ HOVER=null; });
cvs.addEventListener('click',e=>{ if(!mouseOk()) return; const bc=document.body.classList; if(TOUCH&&(!bc.contains('qmin')||bc.contains('mstat'))){ bc.add('qmin'); bc.remove('mstat'); renderHUD(); return; }   /* cảm ứng: chạm màn chơi là gập bảng đang mở */
  const [x,y]=worldAt(e), h=pickAt(x,y); if(!h){ if(!clickOut(x,y)&&TOUCH){ DEST={x,y,t:performance.now()}; walkPoint(x,y); } return; }   /* cảm ứng: chạm đất trống là đi tới */ DEST={x:h.x,y:h.y,t:performance.now()};
  if(h.kind==='npc') return walkToNpc(h.n.id);
  if(h.kind==='player'){ const r=h.r; return walkTo(r.x/T,r.y/T+.8,r.name,()=>UI.social(r)); }
  if(h.kind==='oii') return walkTo(OIS.x/T,OIS.y/T+.8,'Ộ i i',()=>{ oiiSay(); UI.oii(); });
  walkTo(h.x/T,h.y/T,h.label,()=>{ const t=nearest(); if(t) interact(t); }); });
// bấm chuột ra ngoài khung phòng (dưới tường cửa) thì đi ra cửa rồi ra ngoài luôn
let PROMPT_AT=null; $('#prompt').addEventListener('click',()=>{ if(PROMPT_AT&&!TASK) interact(PROMPT_AT); });   // bấm vào nhãn "E ..." cũng như bấm E
function clickOut(x,y){ if(!S.map.indoor||y<(S.H-1)*T) return false; const ex=(S.map.inter||[]).find(i=>i.do==='exit'||i.do==='grab'); if(!ex) return false;
  DEST={x:ex.x,y:ex.y,t:performance.now()}; walkTo(ex.x/T,ex.y/T-.4,'',()=>{ if(ex.do==='grab') UI.grab(); else act({t:'exit'}); }); return true; }
// chuột phải: bấm là đi ngay lúc nhấn xuống; giữ chuột thì nhân vật cứ đi theo con trỏ (như MU), 0,12s tính lại đường 1 lần
let RHOLD=null, RSEEN=false;
// phím R: người chơi khác đứng gần (3 ô) → menu cho vay / donate / mời về nhà (haosang.js); trong nhà mà không ai gần → menu của mình (Sửa nhà, Thích nhà...); còn lại R vẫn là gồng
function rMenu(){ if(!UI.pmenu) return false; const at=(x,y)=>[(x-cam.x)*SCALE,(y-48-cam.y)*SCALE];
  let best=null, bd=3*T; for(const r of REM.values()){ if(!r.name) continue; const d=Math.hypot(r.x-P.x,r.y-P.y); if(d<bd){ bd=d; best=r; } }
  if(best){ const [sx,sy]=at(best.x,best.y); UI.pmenu(best,sx,sy); return true; } if(S.kind==='room'){ const [sx,sy]=at(P.x,P.y); UI.pmenu(null,sx,sy); return true; } return false; }
cvs.addEventListener('mousedown',e=>{ if(e.button!==2||!mouseOk()) return; RSEEN=true; const [x,y]=worldAt(e); if(clickOut(x,y)) return; DEST={x,y,t:performance.now()}; walkPoint(x,y); RHOLD={cx:e.clientX,cy:e.clientY,k:.12}; });
addEventListener('mousemove',e=>{ if(RHOLD){ RHOLD.cx=e.clientX; RHOLD.cy=e.clientY; } });
addEventListener('mouseup',e=>{ if(e.button===2) RHOLD=null; }); addEventListener('blur',()=>{ RHOLD=null; });
cvs.addEventListener('contextmenu',e=>{ e.preventDefault(); if(RSEEN){ RSEEN=false; return; } if(!mouseOk()) return; const [x,y]=worldAt(e); if(clickOut(x,y)) return; DEST={x,y,t:performance.now()}; walkPoint(x,y); });   /* Ctrl+bấm trên Mac không có nút phải */
$('#btnLb').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.leaderboard(); });
$('#btnWard').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.wardrobe(); });
$('#btnFarm').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.farm(); });
$('#btnShop').addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.shop(); });
for(const id of ['#btnDaily','#mDaily']) $(id).addEventListener('click',e=>{ e.currentTarget.blur(); if(started) UI.daily(); });

/* ---------- chuyển cảnh ---------- */
let ringing=null, ringTimer=0, travelling=false;
function fadeOnly(text){ const f=$('#fade'); $('#fadeText').textContent=text||''; f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),900); }
/* ---------- màn chờ di chuyển: cảnh nhiều lớp chạy lệch tốc độ theo điểm đến, trời đổi màu theo giờ thật,
   xe Grab (đi tỉnh) / GrabBike (trong phố) / máy bay (TP.HCM), thanh tiến trình + mẹo chơi ---------- */
const TRAVEL_TIPS=['Bấm Y mở Hằng ngày: điểm danh, 3 việc nhỏ và rương mỗi ngày','Hết pin ngoài đường? Bấm 🔌 Xin sạc nhờ người gần đó','Top 10 đại gia có danh hiệu óng ánh trên đầu',
  'Thuê chó canh chuồng ở chú Sáu / chú Ba để khỏi bị trộm vật nuôi','Thắp hương ở miếu ông Trường Con: +10% EXP, mùng 1 và rằm gấp đôi','VNPT có trạm sạc điện thoại miễn phí cạnh máy lấy số',
  'Sổ sưu tầm: lần đầu có món mới là được ghi, đủ bộ nhận thưởng lớn','Lên cấp tròn chục từ cấp 20 được thưởng tiền','Mỗi giờ bí ngô mọc chỗ mới ở Ké và Đà Lạt','Bearplus Studio nhận việc freelance, làm đêm EXP gấp đôi'];
function skyPal(h){ if(h>=5&&h<6.5) return {top:'#3a4a8a',bot:'#f6a878',sun:'#ffb070',night:0,dusk:1}; if(h>=6.5&&h<16.5) return {top:'#5aa8e8',bot:'#d8f0f8',sun:'#fff6c8',night:0,dusk:0};
  if(h>=16.5&&h<18.6) return {top:'#5a4a9a',bot:'#ff9a68',sun:'#ff8a4a',night:0,dusk:1}; return {top:'#0c1430',bot:'#2a3a6a',sun:'#f4f0d8',night:1,dusk:0}; }
const xtCol=el=>(SD.XICHTHO.els[el]||{}).col||'#ff8a1a';
// cổng dịch chuyển MU: vòng sáng toả ra chỗ vừa tới
function warpFx(c){ sfx('dash',.5); for(let i=0;i<36;i++){ const a=i/36*6.283; fx.push({kind:'ember',c:i%3?c:'#ffffff',x:P.x+Math.cos(a)*6,y:P.y-8+Math.sin(a)*3,vx:Math.cos(a)*50,vy:Math.sin(a)*22-10,t:-Math.random()*.15,life:.5+Math.random()*.3,s:1+(i%4===0)}); } }
// Xích Thố cấp 15 dịch chuyển tới: cột lửa theo màu hệ bùng lên chỗ đứng
function xtArrive(el){ const c=xtCol(el); sfx('dash',.6); shake(4,.25); for(let i=0;i<46;i++){ const a=Math.random()*6.283, r=Math.random()*14; fx.push({kind:'ember',c:[c,'#fff3b0',c,'#ffd84a'][i%4],x:P.x+Math.cos(a)*r,y:P.y-Math.random()*8,vx:Math.cos(a)*(10+Math.random()*30),vy:-30-Math.random()*70,t:-Math.random()*.25,life:.6+Math.random()*.6,s:1+(i%3===0)}); }
  toast('🔥 Xích Thố dịch chuyển tới <b>'+esc(S.map.name)+'</b>','item'); }
function travelAnim(ride){ travelling=true; const tc=$('#travel'); tc.hidden=false; const D=SD.DEST, to=D[ride.to]||{}, from=D[ride.from]||{}, fly=!!(to.plane||from.plane), city=to.city||'hn', same=from.city&&from.city===to.city;
  const mode=fly?'plane':same?'bike':'car'; sfx(fly?'dash':'car_4wd',.12);   /* tiếng xe / máy bay nhỏ nhẹ lúc chờ */
  $('#tvMode').textContent=fly?'✈ BAY':mode==='bike'?'🛵 GRABBIKE':'🚗 GRABCAR'; $('#tvTo').textContent=to.name||''; $('#tvRoute').textContent=`${from.name?from.name.split(' (')[0]:''} → ${(to.name||'').split(' (')[0]}`;
  $('#travelText').textContent=ride.free?'Pháp bao chuyến này':ride.fare?'Cước '+fmt(ride.fare):''; $('#tvTip').textContent='💡 '+TRAVEL_TIPS[Math.floor(Math.random()*TRAVEL_TIPS.length)];
  const c=$('#travelCv'), g=c.getContext('2d'), W=c.width, H=c.height, t0=performance.now(), DUR=2.8, pal=skyPal(vn().hf), fill=$('#tvFill'), icon=$('#tvIcon'); icon.textContent=fly?'✈':mode==='bike'?'🛵':'🚗';
  const R=(x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
  const hsh=n=>{ n=Math.imul(n^0x9e3779b9,2654435761); return ((n^(n>>>15))>>>0)/4294967296; };
  const anim=()=>{ const t=(performance.now()-t0)/1000, k=Math.min(1,t/DUR); g.imageSmoothingEnabled=false;
    // trời + mặt trời / trăng + sao
    for(let y=0;y<H;y++){ const q=y/H; g.fillStyle=`color-mix(in srgb, ${pal.bot} ${Math.round(q*100)}%, ${pal.top})`; g.fillRect(0,y,W,1); }
    if(pal.night){ for(let i=0;i<40;i++){ const x=hsh(i)*W, y=hsh(i+99)*H*.55, tw=Math.sin(t*3+i)>.3; if(tw) R(x,y,1,1,'#fff8e0'); } g.fillStyle='#f4f0d8'; g.beginPath(); g.arc(W*.8,26,9,0,7); g.fill(); g.fillStyle=pal.top; g.beginPath(); g.arc(W*.8+4,23,8,0,7); g.fill(); }
    else { g.fillStyle=pal.sun; g.beginPath(); g.arc(W*.78,pal.dusk?H*.5:30,pal.dusk?14:10,0,7); g.fill(); g.globalAlpha=.25; g.beginPath(); g.arc(W*.78,pal.dusk?H*.5:30,pal.dusk?22:16,0,7); g.fill(); g.globalAlpha=1; }
    // mây trôi (bay thì mây nhiều, chạy nhanh)
    for(let i=0;i<(fly?9:5);i++){ const sp=fly?60+i*14:6+i*3, x=((hsh(i+7)*W*1.5-t*sp)%(W+80)+W+80)%(W+80)-60, y=8+hsh(i+3)*(fly?H*.8:40), cw=26+hsh(i+5)*30;
      g.fillStyle=pal.night?'rgba(120,140,190,.35)':'rgba(255,255,255,.85)'; R(x,y,cw,6,g.fillStyle); R(x+5,y-4,cw*.55,5,g.fillStyle); R(x+cw*.45,y-6,cw*.35,6,g.fillStyle); }
    if(fly){ // trên mây: thảm mây dưới thân máy bay, máy bay giữa khung lắc nhẹ, vệt khói
      g.fillStyle=pal.night?'#3a4a7a':'#f4f8fc'; for(let x=0;x<W;x+=2){ const yy=H-22+Math.sin((x+t*90)*.06)*4+Math.sin((x+t*50)*.15)*2; g.fillRect(x,yy,2,H-yy); }
      const px=W*.32+Math.sin(t*1.3)*6, py=H*.42+Math.sin(t*2.1)*3; g.globalAlpha=.6; for(let i=0;i<10;i++) R(px-8-i*9-((t*120)%9),py+6+Math.sin(i)*1,8,2,'#ffffff'); g.globalAlpha=1;
      R(px,py,64,11,'#f4f1ea'); R(px+60,py+2,8,7,'#f4f1ea'); R(px+64,py+3,6,4,'#cfd8e0'); R(px+4,py+9,58,2,'#c8ccd2'); R(px,py-12,8,13,'#1f6fb2'); R(px+2,py-10,4,9,'#ffd84a');
      for(let w=0;w<9;w++) R(px+14+w*5,py+3,3,3,'#3a6ea8'); R(px+60,py+3,4,3,'#2a3a5a'); R(px+20,py+8,26,4,'#d8d8d2'); R(px+28,py+12,10,4,'#a8acb2'); R(px+22,py-3,14,3,'#d8d8d2');
      if(pal.night&&Math.floor(t*3)%2) R(px+44,py+10,2,2,'#ff3a3a'); }
    else { const far=(sp,col,fn)=>{ g.fillStyle=col; for(let x=0;x<W;x++) fn(x+t*sp,x); };
      // lớp xa theo thành phố đích
      if(city==='hb'||city==='dl'){ far(8,pal.night?'#2a3a5a':'#8aa8b8',(u,x)=>{ const h=46+20*Math.sin(u*.03)+9*Math.sin(u*.09); g.fillRect(x,H-46-h,1,h+46); });
        far(18,pal.night?'#1f3a3a':(city==='dl'?'#2f6a46':'#4f8a56'),(u,x)=>{ const h=24+12*Math.sin(u*.05+2)+5*Math.sin(u*.21); g.fillRect(x,H-38-h,1,h+38); });
        if(city==='dl') for(let i=0;i<14;i++){ const x=((i*37-t*30)%(W+40)+W+40)%(W+40)-20, y=H-50-((i*13)%10); R(x+3,y-14,2,16,'#5a3a22'); for(let r=0;r<4;r++) R(x+3-r*2,y-14+r*4,4+r*4,3,'#1f5a36'); }
        if(city==='hb'){ R(0,H-40,W,8,pal.night?'#2a4a7a':'#5aa0d8'); for(let x=0;x<W;x+=9) R((x+t*25)%W,H-37,4,1,'#bfe2f8'); } }
      else if(city==='hp'){ R(0,H-44,W,12,pal.night?'#1a3a6a':'#4a8ac0'); for(let x=0;x<W;x+=11) R((x+t*20)%W,H-40,5,1,'#cfe8f8');
        for(let i=0;i<5;i++){ const x=((i*90-t*14)%(W+90)+W+90)%(W+90)-40; R(x,H-96,4,52,'#c84a2a'); R(x-18,H-96,52,4,'#c84a2a'); R(x+28,H-92,2,22,'#7a2a1a'); R(x+24,H-72,10,6,'#3a6aa8'); }
        for(let i=0;i<10;i++){ const x=((i*41-t*40)%(W+40)+W+40)%(W+40)-20; R(x+5,H-52,3,14,'#5a3a22'); g.fillStyle='#d8281e'; g.beginPath(); g.ellipse(x+6,H-56,11,7,0,0,7); g.fill(); R(x+1,H-60,3,2,'#ff6a3a'); R(x+9,H-57,3,2,'#ff8a4a'); } }
      else { // phố: dãy nhà cao tầng, đêm sáng đèn; TP.HCM có Bitexco + Landmark 81
        for(let i=0;i<26;i++){ const bw=16+hsh(i)*16, bh=30+hsh(i+50)*60, x=((i*26-t*14)%(W+60)+W+60)%(W+60)-40, y=H-38-bh; R(x,y,bw,bh+4,pal.night?'#1f2a44':'#8a9ab0'); R(x,y,bw,2,pal.night?'#2a3a5a':'#a8b8cc');
          for(let wy=y+5;wy<H-42;wy+=6) for(let wx=x+3;wx<x+bw-3;wx+=5) if(hsh(i*97+wy*7+wx)>.45) R(wx,wy,2,3,pal.night?'#ffd86a':'#d8e8f4'); }
        if(city==='hcm'){ const bx=((140-t*14)%(W+60)+W+60)%(W+60)-40; R(bx,H-128,10,90,pal.night?'#2a3550':'#5a6a80'); R(bx-5,H-104,20,3,'#7a8a98'); const lx=((250-t*14)%(W+60)+W+60)%(W+60)-40; for(let y=0;y<100;y++) R(lx+Math.floor(y/18),H-138+y,12-Math.floor(y/18)*2+Math.floor(y/6),1,pal.night?'#26304a':'#6a7a8c'); } }
      // cây / cột đèn bên đường chạy nhanh
      for(let i=0;i<8;i++){ const x=((i*60-t*120)%(W+60)+W+60)%(W+60)-30; R(x,H-60,2,26,'#4a4a52'); R(x-3,H-62,8,2,'#4a4a52'); if(pal.night){ g.globalAlpha=.3; g.fillStyle='#ffd86a'; g.beginPath(); g.arc(x+1,H-58,10,0,7); g.fill(); g.globalAlpha=1; R(x-1,H-61,4,2,'#fff3a0'); } }
      // đường + vạch kẻ + lan can
      R(0,H-34,W,34,'#4a4e56'); R(0,H-34,W,2,'#6a6e76'); for(let x=0;x<W+20;x+=24) R(((x-t*160)%(W+24)+W+24)%(W+24)-12,H-18,12,2,'#f4f4f2'); R(0,H-36,W,2,'#9aa0a8'); for(let x=0;x<W+14;x+=14) R(((x-t*160)%(W+14)+W+14)%(W+14)-7,H-40,2,6,'#9aa0a8');
      const bob=Math.floor(t*10)%2, vx=W*.34+Math.sin(t*1.6)*4, vy=H-28-bob;
      if(mode==='car'){ // GrabCar: thân xanh, kính, tài xế, đèn, bánh quay
        g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(vx+2,H-14,62,3);
        R(vx,vy-8,64,12,'#00a84a'); R(vx+2,vy-9,60,2,'#2ac86a'); for(let r=0;r<10;r++) R(vx+16+Math.max(0,8-r),vy-18+r,34-Math.max(0,8-r)-Math.max(0,r-6)*0,1,'#00a84a');
        R(vx+20,vy-16,12,7,'#bfe8ff'); R(vx+34,vy-16,12,7,'#bfe8ff'); R(vx+37,vy-14,5,5,'#26262c'); R(vx+38,vy-16,3,2,'#1c1820'); R(vx,vy-4,64,2,'#f4f4f2'); R(vx+32,vy-8,1,10,'#008a3a');
        R(vx+61,vy-7,3,3,'#fff3a0'); R(vx,vy-7,2,3,'#d23a2e'); if(pal.night){ g.globalAlpha=.25; g.fillStyle='#fff3a0'; g.beginPath(); g.moveTo(vx+64,vy-6); g.lineTo(vx+110,vy-14); g.lineTo(vx+110,vy+4); g.fill(); g.globalAlpha=1; }
        for(const wx of [vx+14,vx+50]){ g.fillStyle='#1c1820'; g.beginPath(); g.arc(wx,vy+4,6,0,7); g.fill(); g.fillStyle='#8a8a94'; g.beginPath(); g.arc(wx,vy+4,3,0,7); g.fill(); const a=t*18; R(wx+Math.cos(a)*2-1,vy+4+Math.sin(a)*2-1,2,2,'#26262c'); }
        if(Math.floor(t*8)%2) R(vx-6,vy-1,4,3,'rgba(220,220,220,.6)'); }
      else { // GrabBike: xe máy, tài xế áo + mũ xanh, khách ngồi sau
        g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(vx-2,H-14,40,3); for(const wx of [vx+4,vx+30]){ g.fillStyle='#1c1820'; g.beginPath(); g.arc(wx,vy+4,6,0,7); g.fill(); g.fillStyle='#8a8a94'; g.beginPath(); g.arc(wx,vy+4,2,0,7); g.fill(); }
        R(vx+4,vy-4,28,5,'#3a3a42'); R(vx+22,vy-10,10,7,'#d23a2e'); R(vx+30,vy-14,2,8,'#5a5a66'); R(vx+31,vy-15,4,2,'#3a3a42');
        R(vx+18,vy-24,8,12,'#00a84a'); R(vx+19,vy-30,7,6,'#00a84a'); R(vx+25,vy-28,2,3,'#1c1820'); R(vx+20,vy-12,3,8,'#2a2a30'); R(vx+24,vy-20,6,2,'#00a84a');
        R(vx+8,vy-22,8,11,'#3a6ea8'); R(vx+9,vy-28,6,6,'#f4f4f2'); R(vx+9,vy-12,3,8,'#2a2a30');
        if(Math.floor(t*8)%2) R(vx-4,vy,3,2,'rgba(220,220,220,.6)'); } }
    // vệt sáng tốc độ
    g.globalAlpha=.35; for(let i=0;i<6;i++){ const y=10+hsh(i+33)*(H-50), x=W-((t*(260+i*40)+i*70)%(W+60)); R(x,y,30,1,'#ffffff'); } g.globalAlpha=1;
    fill.style.width=(k*100)+'%'; icon.style.left=(k*100)+'%';
    if(t<DUR) requestAnimationFrame(anim); else { tc.hidden=true; travelling=false; } };
  anim(); }

/* ---------- cập nhật mỗi khung ---------- */
let sendT=0, lastSent='', officeT=0, leaving=false;
function speed(){ if(P.kayak) return 95; if(S.kind==='retreat'&&tileAt(P.x,P.y)==='L') return 45;   // lội nước chậm
  if(P.opt) return SD.RULES.run*SD.OPTIMUS[P.opt];
  if(P.pcar) return SD.RULES.run*SD.PCAR.speed; if(P.riding){ const my=SD.mythIdx(G)?SD.mythOf(G.look&&G.look.mount,G):null; return SD.RULES.run*SD.HORSE.speed*(my?my.speed:1); }   /* thần thú chạy nhanh hơn */ if(P.moto) return SD.RULES.run*SD.MOTO.models[P.moto].speed*(P.speeding?SD.CSGT.speed.mul:1); const h=SD.hunger(G.meals,NET.now()); let s=SD.RULES.hungrySpeed[h]*(G.needs.energy<20?.8:1)*SD.lvSpeed(G.level)*SD.shoeSpeed(G);   /* giày MU: đi bộ / chạy nhanh hơn */
  return ((down('shift')&&G.skills.run)?SD.RULES.run:SD.RULES.walk)*s; }
// trạng thái gửi sang ambient.js (thời tiết, chim, lá rơi, đom đóm, nắng trong phòng)
let AMB_ST=null; const TREES=[], AMB_NO=new Set(['deo']);
const ambFree=(x,y)=>{ const tx=Math.floor(x/T), ty=Math.floor(y/T); return tx>=0&&ty>=0&&tx<S.W&&ty<S.H&&S.solid[ty*S.W+tx]!==1; };
function ambSt(){ const t=vn(); return {key:S.kind+'|'+(S.id||'')+'|'+(S.room||''),W:S.W,H:S.H,grid:S.map.grid,indoor:!!S.map.indoor,city:(SD.DEST[SD.SCENE_DEST[S.kind]]||{}).city||'hn',now:NET.now(),hf:t.hf,
  px:P.x,py:P.y,fast:!!(down('shift')||P.moto||P.riding||P.pcar),muted:AUD.muted,view:{cx:cam.x,cy:cam.y,w:VW,h:VH},trees:TREES,free:ambFree,others:REM.size?[...REM.values()]:null,birds:!AMB_NO.has(S.kind),season:SD.seasonOn('halloween',NET.now())}; }
function update(dt){
  if(ringTimer>0){ ringTimer-=dt; if(ringTimer<=0&&!G.flags.called&&S.kind==='room'){ ringing=sfx('phone_ring',.5); toast('Điện thoại đang reo... (lại bàn, bấm <kbd>E</kbd>)','quest'); } }
  if(ringing&&ringing.ended&&!G.flags.called){ ringing=null; ringTimer=5; }
  if(window.AMB&&S&&S.map) AMB.update(dt,AMB_ST=ambSt());
  for(const f of fx) f.t+=dt; fx=fx.filter(f=>f.t<f.life); if(flash>0) flash=Math.max(0,flash-dt*3); if(shakeT>0&&(shakeT-=dt)<=0) shakeA=0; if(soiT>0) soiT-=dt;
  for(const r of REM.values()){ r.t+=dt; r.actT=(r.actT||0)+dt; }
  if(G){ updateFollow(dt); oiiUpdate(); }
  if(DLG.open){ $('#prompt').hidden=true; updateDialog(dt); return; }
  if(clock-DLG.closedAt<.35) for(const k of ['e',' ','enter']) pressed.delete(k);   // bấm dồn để qua thoại thì phím thừa ngay sau khi đóng không lọt sang game (Lướt, tương tác...)
  // đường đèo: xe tự chạy, Space để bốc đầu đúng nhịp
  if(S.kind==='deo'&&STUNT&&STUNT.pick){ if(!UI.blocking()&&!STUNT.reopen){ STUNT.reopen=true; setTimeout(()=>{ if(STUNT&&STUNT.pick){ STUNT.reopen=false; UI.garage(); } },700); }   // lỡ đóng gara thì mở lại
    $('#prompt').hidden=true; P.x=3*T; P.y=(SD.WHEELIE.lane+.5)*T; P.face=1; P.view='side'; P.moving=false; P.t+=dt; return; }
  if(S.kind==='deo'&&STUNT){ $('#prompt').hidden=true; const t=NET.now(), el=Math.max(0,(t-STUNT.start)/1000);
    P.x=Math.min((S.W-6)*T,3*T+STUNT.speed*el); P.y=(SD.WHEELIE.lane+.5)*T; P.face=1; P.view='side'; P.moving=el>0; P.t+=dt; STUNT.wheelieT-=dt; STUNT.fallT-=dt;
    if(hit(' ')){ const i=STUNT.cues.findIndex((c,k)=>!STUNT.res[k]&&t>=c-STUNT.lead&&t<=c+STUNT.window+200); if(i>=0){ STUNT.res[i]='sent'; NET.send({t:'stunt',op:'hit',i,off:t-STUNT.cues[i]}); } }
    if(Math.random()<.3) fx.push({kind:'dust',x:P.x-14,y:P.y,vx:-30-Math.random()*20,vy:-Math.random()*8,t:0,life:.5}); return; }
  if(S.kind==='pickle'&&PK&&PK.st==='play'&&PK.me>=0){ $('#prompt').hidden=true; AUTO=null; const K=SD.PICKLE, C=K.court, team=PK.me<2?0:1;   // đấu pickleball: tự chạy trong nửa sân của mình, J/K/L đánh
    const y0=team===0?K.net+.8:C.y0-1.2, y1=team===0?C.y1+1.6:K.net-.8, dx=(down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0), dy=(down('s','arrowdown')?1:0)-(down('w','arrowup')?1:0), len=Math.hypot(dx,dy)||1, sp=SD.RULES.run;
    P.moving=!!(dx||dy); if(dx) P.face=Math.sign(dx); if(P.moving){ P.view=Math.abs(dy)>Math.abs(dx)?(dy>0?'down':'up'):'side'; P.x=Math.max((C.x0-1)*T,Math.min((C.x1+2)*T,P.x+dx/len*sp*dt)); P.y=Math.max(y0*T,Math.min(y1*T,P.y+dy/len*sp*dt)); }
    else P.view=team===0?'up':'down';
    const base=P.act?P.act:P.moving?'run':'idle', name=!P.act&&P.view!=='side'&&P.av&&P.av.anims[base+'_'+P.view]?base+'_'+P.view:base; if(P.anim!==name){ P.anim=name; P.t=0; } P.t+=dt;
    const shot=hit('j')?'drive':hit('k')?'dink':hit('l')?'lob':hit(' ')?PKSHOT:''; if(shot){ PKSHOT=shot; P.act='attack'; P.actT=0; sfx('dash',.3); NET.req({t:'pk',op:'hit',shot}).then(r=>{ PKJUDGE={ok:r.ok,why:r.why,t:performance.now()}; }); }
    if(P.act){ P.actT+=dt; if(P.actT>=.35) P.act=null; }
    sendT-=dt; if(sendT<=0){ sendT=.1; const v=VIEWS.indexOf(P.view), a=Math.max(0,ANIMS.indexOf(P.anim.split('_')[0])), key=[Math.round(P.x),Math.round(P.y),P.face,v,a].join(); if(key!==lastSent){ lastSent=key; NET.send({t:'mv',x:P.x,y:P.y,f:P.face,v,a}); } }
    return; }
  if(S.kind==='phongbay'&&DANCE&&DANCE.st==='play'&&DANCE.me>=0){ $('#prompt').hidden=true; UI.keys(pressed,keys); return; }
  if(CSGT_STOP){ $('#prompt').hidden=true; AUTO=null; P.moving=false; P.anim=P.view==='side'?'idle':'idle_'+P.view; P.t+=dt; if(!UI.isOpen()) UI.csgt(CSGT_STOP); return; }
  if(S.kind==='everfit'){ officeT-=dt; if(officeT<=0){ officeT=2; const was=S.closed; npcs=sceneNpcs('everfit'); if(was!==S.closed&&!S.closed) toast('Văn phòng đã mở cửa','item'); } }
  // đang đua ngựa: phím mũi tên + Space dùng để chấm nhịp, không đi lại
  if(S.kind==='track'&&RACE&&RACE.st==='run'&&RACE.me>=0){ $('#prompt').hidden=true; UI.keys(pressed,keys); return; }
  // đang mở bảng thường (không phải minigame / ô đang gõ): phím tắt bảng khác thì đổi sang bảng đó, bấm lại đúng phím vừa mở thì đóng
  if(UI.blocking&&UI.blocking()){ $('#prompt').hidden=true; if(hit('escape')) UI.closeAll();
    else if(UI.swappable&&UI.swappable()) for(const [k,f] of HOTKEYS) if(hit(k)){ const same=HK_OPEN===k+'|'+$('#panelTitle').textContent; UI.closeAll(); HK_OPEN=''; if(!same) hotkey(k,f); return; }
    UI.keys&&UI.keys(pressed,keys); return; }
  if(hit('m')){ toggleMap(); return; } if(!$('#mapView').hidden){ if(hit('escape','m')) toggleMap(); return; }
  if(hit('escape')){ UI.menu(); return; }
  if(hit('enter','c')){ UI.wchat(); return; }   // Enter: chat (kênh tổng + bong bóng trên đầu cho người ở gần)
  if(hit('r')&&rMenu()) return;
  for(const [k,f] of HOTKEYS) if(hit(k)){ hotkey(k,f); return; } if(hit('b')){ goHome(); return; } if(hit('c')){ UI.shop(); return; }
  if(hit('n','`','~')) toggleSkills();                                 // N: thanh kỹ năng (tiếng bật/tắt bằng nút loa)
  if(hit('p')) act({t:'photo'}).then(r=>{ if(!r.err){ flash=1; sfx('item_pickup',.5); toast(`Đã chụp ảnh sống ảo: <b>${esc(r.name)}</b> · up ảnh ở phòng`,'item'); } });
  { const sp=!!P.moto&&P.moto!=='xedap'&&down('shift')&&(S.kind==='retreat'||S.kind==='dalat'); if(sp!==!!P.speeding){ P.speeding=sp; act({t:'moto',op:'speed',on:sp}); if(sp) toast('Phóng nhanh vượt ẩu! CSGT thấy là bắt, dễ xoè xe đấy','lock'); }
    if(sp&&P.moving&&Math.random()<.5) fx.push({kind:'dust',x:P.x-P.face*16,y:P.y,vx:-P.face*(40+Math.random()*30),vy:-Math.random()*10,t:0,life:.45}); }   /* giữ Shift khi đi xe máy: phóng nhanh */
  // tiếng máy xe theo ga; còi hú to dần khi lại gần xe CSGT
  if(!AUD.muted&&((P.moto&&P.moto!=='xedap')||P.opt==='truck')){ const big=P.opt==='truck', rpm=(big?26:34)+(P.moving?(P.speeding?62:38):0)+(P.act==='wheelie'?45:0); engineSet(rpm,(big?.09:.05)+(P.speeding?.04:0)); } else engineOff();
  { const c=S.kind==='retreat'&&CSGT_POST; let v=0; if(c&&!AUD.muted){ const d=Math.hypot((c.dx==null?c.x:c.dx)*T-P.x,SD.CSGT.y*T-P.y); v=Math.max(0,1-d/(14*T))*.06; } sirenSet(v); }
  if(P.opt&&hit('z')) act({t:'optimus',op:'megatron'}).then(r=>{ if(!r.err&&r.msg) toast(esc(r.msg),'quest'); });   /* Z: gọi Megatron ra đấu */
  if(MCKB&&!P.opt&&!SOC_ME()&&hit('j')&&inMck()){ P.face=MCKB.x*T>P.x?1:-1; P.view='side'; P.act='attack'; P.actT=0; sfx('dash',.3); NET.req({t:'mck',op:'hit'}).then(r=>{ if(r&&r.err&&performance.now()-(P.mckErrAt||0)>3000){ P.mckErrAt=performance.now(); toast(esc(r.err),'lock'); } }); }   // J: đấm MCK
  if(P.opt==='robot'&&MEGA&&hit('j')){ const M=MEGA; P.face=M.x*T>P.x?1:-1; P.view='side'; P.act='attack'; P.actT=0; NET.send({t:'act',a:'attack'}); act({t:'optimus',op:'mhit',kind:'punch'}); }
  if(P.opt==='truck'&&MEGA&&P.moving&&Math.hypot(MEGA.x*T-P.x,MEGA.y*T-P.y)<2.8*T&&performance.now()-ramAt>900){ ramAt=performance.now(); act({t:'optimus',op:'mhit',kind:'ram'}); }
  if(P.opt&&(hit('k')||hit('o'))) act({t:'optimus',op:P.opt==='robot'?'truck':'robot'}).then(r=>{ if(!r.err) P.opt=r.mode; });   /* K: robot ↔ xe đầu kéo (lái đi được) */
  if(P.moto&&P.moto!=='xedap'&&hit(' ')){ const t2=performance.now(); if(t2-(P.lastSpace||0)<320){ P.act='wheelie'; P.actT=0; NET.send({t:'act',a:'wheelie'}); revSnd(); P.lastSpace=0; } else P.lastSpace=t2; }   /* Space 2 lần: bốc đầu */
  if(hit('h')&&!P.moto&&!P.riding&&(S.kind==='retreat'||S.kind==='dalat')&&rideChoices().length>1){ if(tileAt(P.x,P.y)==='L') toast('Đang ở dưới nước, lên bờ đã','lock'); else UI.rides(); }   // có nhiều xe / ngựa: mở bảng chọn
  else if(hit('h')&&(S.kind==='retreat'||S.kind==='dalat')&&(P.moto||(G.moto&&G.moto.until>NET.now()))&&!P.riding){ if(P.moto) act({t:'moto',op:'dismount'}).then(r=>{ if(!r.err){ P.moto=null; toast('Xuống xe','item'); } }); else mountMoto(); }
  else if(hit('h')&&!P.riding&&tileAt(P.x,P.y)==='L') toast('Đang ở dưới nước, lên bờ rồi mới lên ngựa được','lock');
  else if(hit('h')&&(S.kind==='dalat'||S.kind==='retreat'||S.kind==='mu'||S.kind==='muw')) act({t:'horse',op:P.riding?'dismount':'mount'}).then(r=>{ if(!r.err){ P.riding=!P.riding; toast(P.riding?'Lên ngựa! Chạy nhanh hơn, chở được 3 thùng hàng':'Xuống ngựa','item'); } });
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
  if(RHOLD){ if(dx||dy||!mouseOk()) RHOLD=null; else if((RHOLD.k-=dt)<=0){ RHOLD.k=.12; const x=RHOLD.cx/SCALE+cam.x, y=RHOLD.cy/SCALE+cam.y; if(Math.hypot(x-P.x,y-P.y)>8) walkPoint(x,y,{quiet:true}); } }
  if(AUTO){ if(dx||dy){ const a=AUTO; AUTO=null; ROUTE=null; if(!a.exact) toast('Đã dừng tự đi','lock'); }
    else { const wp=AUTO.path[AUTO.i], end=AUTO.path[AUTO.path.length-1], stp=Math.max(4,speed()*dt*1.25);
      if(Math.hypot(end.x-P.x,end.y-P.y)<(AUTO.exact?stp:24)){ const f=AUTO.then; AUTO=null; if(f) f(); }              // tới nơi: vào phòng / mở chỗ người bán (bấm chuột phải thì tới đúng điểm bấm)
      else { if((AUTO.look=(AUTO.look||0)-dt)<=0){ AUTO.look=.1; for(let j=Math.min(AUTO.path.length-1,AUTO.i+8);j>AUTO.i;j--) if(clearLine(P.x,P.y,AUTO.path[j].x,AUTO.path[j].y,AUTO.wetOk)){ AUTO.i=j; break; } }   /* cắt góc: nhắm thẳng điểm xa nhất nhìn thấy, khỏi đi bậc thang theo ô */
        if(Math.hypot(wp.x-P.x,wp.y-P.y)<stp) AUTO.i=Math.min(AUTO.i+1,AUTO.path.length-1); }
      if(AUTO){ const w=AUTO.path[AUTO.i], ddx=w.x-P.x, ddy=w.y-P.y, dd=Math.hypot(ddx,ddy)||1; dx=Math.abs(ddx)>1?ddx/dd:0; dy=Math.abs(ddy)>1?ddy/dd:0;
        const held=P.act==='quay'||P.act==='gong'||(P.act==='hokage'&&P.actT<1)||fighting||(TASK&&!TASK.walk);   // đang bận thì đứng yên là bình thường, không tính là kẹt
        AUTO.stuck=!held&&Math.hypot(P.x-AUTO.lx,P.y-AUTO.ly)<.3?AUTO.stuck+dt:0; AUTO.lx=P.x; AUTO.ly=P.y;
        if(AUTO.stuck>1.2){ const a=AUTO; AUTO=null; if(a.exact&&Math.hypot(end.x-P.x,end.y-P.y)<16){ /* sát điểm bấm rồi, coi như tới */ } else if(a.pt&&a.retries<3) walkPoint(a.pt[0],a.pt[1],{quiet:true,retries:a.retries+1}); else if(a.dest&&a.retries<3) walkTo(a.dest[0],a.dest[1],a.label,a.then,{quiet:true,retries:a.retries+1}); else if(a.dest) toast('Bị chặn đường rồi, đi tay vòng qua một chút nhé','lock'); else goHome(); } } } }
  const busy=P.act==='quay'||P.act==='gong'||(P.act==='hokage'&&P.actT<1)||fighting||(TASK&&!TASK.walk);
  if(busy){ dx=0; dy=0; }
  if(window.MU8&&window.MU8.stunned&&window.MU8.stunned()){ dx=0; dy=0; AUTO=null; }
  if(P.seat&&(dx||dy||AUTO)) P.seat=null;   /* đang ngồi trên ống cống: đi là xuống */   /* MU: bị choáng thì đứng yên */
  // nắm tay: người được dắt tự đi theo
  if(P.link){ const L=REM.get(P.link); if(L){ const tx=L.x-L.face*12, ty=L.y+1, ddx=tx-P.x, ddy=ty-P.y, d=Math.hypot(ddx,ddy); if(d>3&&!dx&&!dy){ const st=Math.min(d,135*dt); move(P,ddx/d*st,ddy/d*st); P.face=L.face; P.moving=true; } } }
  let sp=(P.dashT>0?SD.RULES.dash:speed())*((window.MU8&&window.MU8.moveMul)?window.MU8.moveMul():1); P.dashT-=dt;   /* MU: dính đòn làm chậm */
  if(P.dashT>0&&!dx&&!dy){ if(P.view==='down') dy=1; else if(P.view==='up') dy=-1; else dx=P.face; }
  const len=Math.hypot(dx,dy)||1; P.moving=!!(dx||dy)||(P.link&&P.moving);
  if(dx) P.face=Math.sign(dx);
  if(dx||dy) P.view=Math.abs(dy)>Math.abs(dx)?(dy>0?'down':'up'):'side';
  if(dx||dy){ move(P,dx/len*sp*dt,dy/len*sp*dt); if(FISH){ FISH=null; NET.send({t:'fish',op:'stop'}); } }
  const running=down('shift')&&sk.run&&!P.kayak;
  const base=P.act&&P.act!=='noi'?P.act:P.moving?(running||P.riding?'run':'walk'):'idle';
  const name=!P.act&&P.view!=='side'&&P.av&&P.av.anims[base+'_'+P.view]?base+'_'+P.view:base;
  if(P.anim!==name){ P.anim=name; P.t=0; } P.t+=dt;
  if(P.moving&&!P.kayak){ P.stepT-=dt; if(P.stepT<=0){ sfx(Math.random()<.5?'step1':'step2',.07); P.stepT=running?.24:.34; if(window.AMB&&AMB_ST&&!P.moto&&!P.pcar&&!P.riding) AMB.step(AMB_ST,P.x,P.y,P.face,P.view,(P.stepN=(P.stepN||0)+1)%2);
    if((running||P.riding)&&!P.moto&&!P.pcar) for(let i=0;i<(P.riding?3:2);i++) fx.push({kind:'puff',x:P.x-P.face*(P.riding?14:4)+(Math.random()-.5)*6,y:P.y+1,vx:-P.face*(6+Math.random()*10),vy:-4-Math.random()*6,t:-i*.04,life:.42+Math.random()*.15}); } }   /* chạy, phi ngựa: bụi tung sau gót */
  if(P.riding&&SD.mythIdx(G)>=9&&Math.random()<(P.moving?.7:.2)){ const c=xtCol(G.xt&&G.xt.el); fx.push({kind:'ember',c:Math.random()<.4?'#fff3b0':c,x:P.x-P.face*(4+Math.random()*24),y:P.y-10-Math.random()*26,vx:-P.face*(P.moving?20:2)+(Math.random()-.5)*8,vy:-14-Math.random()*22,t:0,life:.5+Math.random()*.4,s:1+(Math.random()<.4)}); }   /* Xích Thố: tàn lửa bay theo màu hệ */
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
    enterZone();
    if(soiT>0) SD.COINS.forEach(([x,y],i)=>{ if(G.flags.coins[i]) return; if(Math.hypot(x*T-P.x,y*T-P.y)<12){ G.flags.coins[i]=true; NET.req({t:'pick',k:'coin',i}).then(r=>{ if(!r.err){ sfx('coin',.5); toast('<b>+20.000đ</b> nhặt được xu','vnd'); } }); } });
    if(P.kayak) SD.BUOYS.forEach(([bx,by],i)=>{ if(!G.daily.buoys[i]&&Math.hypot(bx*T-P.x,by*T-P.y)<16){ G.daily.buoys[i]=true; NET.req({t:'kayak',op:'buoy',i}).then(r=>{ if(!r.err){ sfx('coin',.5); toast(`Chạm phao ${r.n}/5`,'item'); } }); } });
    updatePet(dt); updateChicken(dt);
  }
  if((S.kind==='mu'||S.kind==='muw')&&S.map.zones) enterZone();
  if(S.kind==='dalat'){ enterZone();
    if(HERD&&HERD.phase==='go'&&inPasture()&&!TASK) act({t:'herd',op:'graze'}); }
  updateNpcs(dt);
}
const inPasture=()=>{ const z=SD.DALAT.pasture, x=P.x/T, y=P.y/T; return x>=z.x0&&x<=z.x1+1&&y>=z.y0&&y<=z.y1+1; };
const SOC_ME=()=>{ for(const s of SOCS.values()) if(s.a===NET.pid||s.b===NET.pid) return s; return null; };
// đang đánh nhau / vật tay / đấu Megatron: hiện dải phím bấm ở giữa dưới màn hình (phím chính nhấp nháy)
let KEYHINT='';
function keyHint(){ const s=SOC_ME(); let t='', k=[];
  if(s&&s.kind==='danhnhau'){ t='Đánh nhau'; k=[['J','Đấm',1],['X','Bỏ cuộc']]; }
  else if(s&&s.kind==='vattay'){ t='Vật tay'; k=[['SPACE','Bấm liên tục',1],['X','Bỏ cuộc']]; }
  else if(S&&S.kind==='pickle'&&PK&&PK.st==='play'&&PK.me>=0){ t='Pickleball'; k=[['WASD','Chạy tới vòng vàng',1],['J','Drive'+(PKSHOT==='drive'?' ✓':'')],['K','Dink'+(PKSHOT==='dink'?' ✓':'')],['L','Lob'+(PKSHOT==='lob'?' ✓':'')],['SPACE','Cú vừa chọn']]; }
  else if(MCKB&&S&&S.kind==='retreat'&&inMck()&&!P.opt){ t='Đấu MCK'; k=[['J','Đấm',1],['WASD','Né sóng âm tím'],['Shift','Chạy']]; }
  else if(MEGA&&P.opt&&S&&S.kind==='retreat'){ t='Đấu Megatron'; k=P.opt==='robot'?[['J','Đấm',1],['WASD','Né đạn tím'],['K','Hoá xe tải húc']]:[['WASD','Lao vào húc',1],['K','Hoá lại robot']]; }
  const html=t?`<b>${t}</b>`+k.map(([key,label,hot])=>`<span class="${hot?'hot':''}"><kbd>${key}</kbd>${label}</span>`).join(''):'';
  if(html===KEYHINT) return; KEYHINT=html; const el=$('#keyHint'); el.innerHTML=html; el.hidden=!html; }
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
function updateNpcs(dt){ const now=NET.now(); for(const n of npcs){ n.t+=dt; const R=SD.roamPos(n.id,now);   // Pháp, Khá Bảnh đi dạo theo lộ trình (giờ server)
  if(R){ n.x=R.x*T; n.y=R.y*T; n.moving=R.moving; if(R.moving){ if(Math.abs(R.dy)>Math.abs(R.dx)) n.view=R.dy>0?'down':'up'; else { n.view='side'; n.face=R.dx>0?1:-1; } } }
  if(n.act){ n.actT+=dt; const sh=npcSheet(n), an=sh&&sh.anims[n.act]; const dur=an?an.frames.length/an.fps+(n.act==='hokage'?1.4:n.act==='quay'?1.6:.3):1;
    if(n.actT>=dur){ if(n.act==='saiyan') delete PORTRAIT.phap; n.act=null; } }
  if(!DLG.open&&!n.moving) faceToward(n,Math.hypot(n.x-P.x,n.y-P.y)<52); } }
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
/* ---------- người / thú đi theo: Bụi & Bặm theo Dvu, Ộ i i theo Mèn Mén (mô phỏng ở máy khách, so tên không dấu) ---------- */
const foldName=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase().trim();
const FOLLOW=new Map(), CATSPR={}, catSpr=(k,p,f)=>CATSPR[k+p+f]||(CATSPR[k+p+f]=A.cat(k,p,f));
function updateFollow(dt){ const live=new Set(), hideFl=SD.FL.kayak|SD.FL.incar|SD.FL.optimus|SD.FL.otruck;
  const owners=[{id:'me',x:P.x,y:P.y,face:P.face,name:G&&G.name,hide:P.kayak||P.incar||P.opt}];
  for(const r of REM.values()) if(r.av) owners.push({id:r.id,x:r.x,y:r.y,face:r.face,name:r.name,hide:r.fl&hideFl});
  for(const o of owners){ const on=foldName(o.name); for(const f of SD.FOLLOWERS){ if(f.owner!==on) continue; const k=o.id+':'+f.id; live.add(k);
    const tx=o.x-(o.face||1)*f.gap, ty=o.y+f.side; let c=FOLLOW.get(k);
    if(!c||o.hide){ c={x:tx,y:ty,face:o.face||1,view:'side',still:9,wt:0,f,owner:o.name,sayAt:0,away:true}; FOLLOW.set(k,c); }
    c.hide=o.hide; const dx=tx-c.x, dy=ty-c.y, d=Math.hypot(dx,dy);
    if(d>320){ c.x=tx; c.y=ty; }
    else if(d>5){ const st=Math.min(Math.max(d*3.2,40),230)*dt; c.x+=dx/d*Math.min(st,d); c.y+=dy/d*Math.min(st,d); if(Math.abs(dx)>1) c.face=dx>0?1:-1;
      c.view=Math.abs(dy)>Math.abs(dx)*1.4?(dy>0?'down':'up'):'side'; c.still=0; c.wt+=dt*(f.kind==='cat'?9:6); }
    else c.still+=dt;
    if(f.lines&&!c.hide){ const pd=Math.hypot(c.x-P.x,c.y-P.y); if(pd>4*T) c.away=true;                        // lại gần thì Ộ i i lên tiếng
      if(pd<2.4*T&&c.away&&performance.now()-c.sayAt>15000){ c.away=false; followSay(c); } } } }
  for(const k of FOLLOW.keys()) if(!live.has(k)) FOLLOW.delete(k); }
function followSay(c){ const f=c.f; c.sayAt=performance.now(); c.face=P.x>c.x?1:-1;
  if(f.kind==='cat'){ tone('triangle',620,1050,.14,.07); setTimeout(()=>tone('triangle',1050,560,.3,.07),130); for(let i=0;i<6;i++) fx.push({kind:'heart',x:c.x+(Math.random()-.5)*12,y:c.y-10,t:-i*.12,life:1.2}); }
  else sayLine(f.lines.join('. ')+'.',1,f.lang); }
function followLine(c){ const f=c.f, e=performance.now()-c.sayAt; if(!c.sayAt) return '';
  if(f.lines){ if(e<2400) return f.lines[0]; return e<5200?f.lines[1]:''; } return e<2200?f.line:''; }
function drawFollow(list,inView){ for(const c of FOLLOW.values()){ if(c.hide||!inView(c.x,c.y)) continue; const f=c.f, line=followLine(c);
  if(f.kind==='cat'){ const rest=c.still>1.6, blink=Math.floor(clock*.8+f.gap)%6===0, s=catSpr(f.id,rest?f.rest:'walk',rest?(blink?1:0):Math.floor(c.wt)%2);
    list.push({y:c.y,d:()=>{ shadow(c.x,c.y,7); drawFlip(s.c,c.x,c.y,s.ax,s.ay,c.face<0); }});
    ANITAGS.push({x:c.x,y:c.y-13,n:c.owner,pet:f.name}); if(line) SAYS.push({x:c.x,y:c.y-16,text:line}); }
  else { list.push({y:c.y,d:()=>{ const mv=c.still<.25; drawChar(ctx,starAv(f.id),c.x,c.y,c.face,c.view,(mv?'walk':'idle')+(c.view!=='side'?'_'+c.view:''),'',clock,clock,0); }});
    SAYS.push({x:c.x,y:c.y-46,name:f.name,text:line}); } } }
/* ---------- Ộ i i: NPC đi lang thang ở mọi map ---------- */
// tuyến vòng tự sinh cho từng map: từ chỗ xuất hiện nối BFS qua tối đa 8 điểm tương tác (chọn theo hash), dừng mỗi điểm vài giây.
// vị trí tính theo giờ server nên ai cũng thấy Ộ i i ở cùng 1 chỗ; trong Nhà giải trí thì ngồi góc shisha.
const OI=SD.OII, OIS={key:'',R:null,sayAt:0,away:true,x:0,y:0,face:1,view:'side',moving:false,on:false};
function oiiBuild(){ const W=S.W, H=S.H, sol=S.solid;
  const snap=(x,y)=>{ for(let r=0;r<=3;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const X=Math.floor(x)+dx, Y=Math.floor(y)+dy; if(X>0&&Y>0&&X<W-1&&Y<H-1&&!sol[Y*W+X]) return Y*W+X; } return -1; };
  const flood=s=>{ const prev=new Int32Array(W*H).fill(-1), q=[s]; prev[s]=s; for(let h=0;h<q.length;h++){ const c=q[h], x=c%W, y=(c/W)|0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const n=ny*W+nx; if(prev[n]!==-1||sol[n]) continue; prev[n]=c; q.push(n); } } return prev; };
  const start=snap(S.map.spawn.x/T,S.map.spawn.y/T); if(start<0) return null; const reach=flood(start), tx=i=>i%W, ty=i=>(i/W)|0;
  const pts=[...new Set((S.map.inter||[]).map(it=>snap(it.x/T,it.y/T)).filter(i=>i>=0&&i!==start&&reach[i]!==-1))].sort((a,b)=>A.hash(tx(a),ty(a),77)-A.hash(tx(b),ty(b),77)).slice(0,8);
  for(let k=0;k<600&&pts.length<4;k++){ const i=Math.floor(A.hash(k,W,H)*W*H); if(reach[i]!==-1&&i!==start&&!pts.includes(i)) pts.push(i); }
  const tour=[start], left=pts.slice(); while(left.length){ const c=tour[tour.length-1]; left.sort((a,b)=>Math.hypot(tx(a)-tx(c),ty(a)-ty(c))-Math.hypot(tx(b)-tx(c),ty(b)-ty(c))); tour.push(left.shift()); }
  tour.push(start); const xs=[], ys=[], cum=[]; let t=0; const add=(i,dt)=>{ t+=dt; xs.push((tx(i)+.5)*T); ys.push((ty(i)+.75)*T); cum.push(t); };
  add(start,0); for(let k=1;k<tour.length;k++){ const a=tour[k-1], b=tour[k], prev=flood(b); if(prev[a]===-1) continue; for(let c=a;c!==b;){ c=prev[c]; add(c,1/OI.speed); } add(b,OI.dwell); }
  return t>0?{xs,ys,cum,total:t}:null; }
function oiiUpdate(){ OIS.on=false; if(!S||OI.skip.includes(S.kind)) return;
  const YL=SD.YENLANG, h=vn().hf; if(S.kind!=='yenlang'&&h>=YL.home.from&&h<YL.home.to) return;                      // tối Ộ i i về 120 Yên Lãng
  if(S.kind==='yenlang') Object.assign(OIS,{x:YL.oii.x*T,y:YL.oii.y*T,face:-1,view:'side',moving:false,on:true});
  else if(S.kind==='club'){ const H=SD.SHISHA; Object.assign(OIS,{x:H.oii.x*T,y:H.oii.y*T,face:-1,view:'side',moving:false,on:true}); }
  else { const key=S.kind+':'+S.W+'x'+S.H; if(OIS.key!==key){ OIS.key=key; try{ OIS.R=oiiBuild(); }catch(e){ OIS.R=null; } }
    const R=OIS.R; if(!R) return; const t=(NET.now()/1000)%R.total; let lo=0, hi=R.cum.length-1; while(lo<hi-1){ const m=(lo+hi)>>1; if(R.cum[m]<=t) lo=m; else hi=m; }
    const b=hi, a=lo, k=R.cum[b]>R.cum[a]?Math.min(1,(t-R.cum[a])/(R.cum[b]-R.cum[a])):0, dx=R.xs[b]-R.xs[a], dy=R.ys[b]-R.ys[a];
    OIS.x=R.xs[a]+dx*k; OIS.y=R.ys[a]+dy*k; OIS.moving=!!(dx||dy); if(dx) OIS.face=dx>0?1:-1; OIS.view=dy&&!dx?(dy>0?'down':'up'):'side'; OIS.on=true; }
  const d=Math.hypot(OIS.x-P.x,OIS.y-P.y); if(d>4*T) OIS.away=true;                                                  // lại gần thì Ộ i i lên tiếng
  if(d<2.4*T&&OIS.away&&performance.now()-OIS.sayAt>15000){ OIS.away=false; oiiSay(); } }
// giọng Ộ i i: file thu sẵn (giọng nam miền Bắc), không dựa vào bộ đọc chữ của trình duyệt (hay bị kẹt, máy không có giọng Việt); lỗi mới đọc bằng speechSynthesis
function oiiSay(){ OIS.sayAt=performance.now(); }   // Ộ i i chỉ hiện bong bóng chữ, không phát tiếng
function drawOii(list,inView){ if(!OIS.on||!inView(OIS.x,OIS.y)) return; const x=OIS.x, y=OIS.y, e=performance.now()-OIS.sayAt, line=!OIS.sayAt?'':e<2800?OI.lines[0]:e<6600?OI.lines[1]:'';
  list.push({y,d:()=>{ drawChar(ctx,starAv('oii'),x,y,OIS.face,OIS.view,(OIS.moving?'walk':'idle')+(OIS.view!=='side'?'_'+OIS.view:''),'',clock,clock,0); }});
  if(S.kind==='club'&&Math.random()<.05) fx.push({kind:'smoke',x:x-7,y:y-28,t:0,life:1.8});
  SAYS.push({x,y:y-46,name:'Ộ i i',text:line}); }
// khô gà đè tem rơi ở các map (khi đang nhận việc của Ộ i i)
/* ---------- Lễ hội Bí ngô: bí mọc đổi chỗ mỗi giờ, đèn bí khắc mặt trang trí cổng Ké, đèn bí lon ton theo chân người đã đổi quà ---------- */
function pumpkinsHere(){ if(!G||!S||(S.kind!=='retreat'&&S.kind!=='dalat')) return []; const cur=SD.pumpkinsNow(S.kind,NET.now()), got=G.pk&&G.pk.h===cur.hour?G.pk.got:{}; return cur.list.filter(s=>!got[S.kind+s.i]); }
const PUMP={}, pumpSpr=v=>PUMP[v]||(PUMP[v]=A.pumpkin(v)), JACK={}, jackSpr=f=>JACK[f]||(JACK[f]=A.jack(f));
function warmGlow(x,y,r,a){ const X=x-cam.x, Y=y-cam.y, g=ctx.createRadialGradient(X,Y,1,X,Y,r); g.addColorStop(0,`rgba(255,190,80,${a})`); g.addColorStop(1,'rgba(255,150,40,0)');
  ctx.globalCompositeOperation='lighter'; ctx.fillStyle=g; ctx.fillRect(X-r,Y-r,r*2,r*2); ctx.globalCompositeOperation='source-over'; }
function drawPumpkins(list){ if(!G||!S) return;
  for(const s of pumpkinsHere()){ const x=s.x*T, y=s.y*T, sp=pumpSpr(s.i%3); list.push({y,d:()=>{ shadow(x,y,7); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y)); }});
    if(Math.random()<.012) fx.push({kind:'glint',x:x+(Math.random()-.5)*12,y:y-8,t:0,life:.6}); }
  if(S.kind==='retreat'&&SD.seasonOn('halloween',NET.now())){ const h=vn().hf, night=h>=17.5||h<6;
    SD.SEASON.halloween.decor.forEach(([jx,jy],i)=>{ const x=jx*T, y=jy*T; list.push({y,d:()=>{ shadow(x,y,7); const sp=jackSpr(Math.floor(clock*5+i*1.7)%3); ctx.drawImage(sp.c,Math.round(x-sp.ax-cam.x),Math.round(y-sp.ay-cam.y));
      warmGlow(x,y-7,night?26:14,(night?.32:.12)+Math.sin(clock*9+i)*.04); }}); }); }
  // đèn bí theo chân: của mình + người khác có quà
  const owners=[]; if((G.items.den_bingo||0)>0) owners.push(['me',P]); for(const r of REM.values()) if(r.bn&&r.av) owners.push([r.id,r]);
  for(const [id,o] of owners){ let L=LANT.get(id); const tx=o.x-(o.face||1)*15, ty=o.y+2; if(!L){ L={x:tx,y:ty,t:Math.random()*5}; LANT.set(id,L); }
    const dx=tx-L.x, dy=ty-L.y, d=Math.hypot(dx,dy); if(d>200){ L.x=tx; L.y=ty; } else { L.x+=dx*.08; L.y+=dy*.08; } L.t+=d>4?.22:.05;
    const hop=d>4?Math.abs(Math.sin(L.t*2.4))*4:Math.sin(L.t)*1, X=L.x, Y=L.y; list.push({y:Y,d:()=>{ shadow(X,Y,5); const sp=jackSpr(Math.floor(clock*6)%3); ctx.drawImage(sp.c,Math.round(X-sp.ax-cam.x),Math.round(Y-sp.ay-cam.y-hop)); warmGlow(X,Y-8-hop,18,.22); }}); }
  for(const id of LANT.keys()) if(!owners.some(o=>o[0]===id)) LANT.delete(id); }
const LANT=new Map();
// chó canh chuồng thuê (dịch vụ chú Sáu / chú Ba): ngồi canh ở góc chuồng có vật nuôi của chủ thuê, thỉnh thoảng vẫy đuôi
const GUARD_PEN={bo:[52.1,42.4],ga:[64.1,39.4],lon:[71.1,40.4],nai:[71.1,40.4],vit:[56.1,64]};   // cạnh cửa chuồng (điểm cho ăn) ở trại chú Sáu
function drawGuards(list){ if(!S||(S.kind!=='dalat'&&S.kind!=='retreat')) return; const own=[], now=NET.now();
  if(G.guard&&G.guard.until>now) own.push([G.guard.k,G.animals||[]]); for(const h of HERDS) if(h.pid!==NET.pid&&h.gd) own.push([h.gd,h.a]);
  const spots=new Map(); for(const [k,an] of own){ const plan=SD.GUARD.plans[k]; if(!plan) continue; for(const a of an){ const ke=a.loc==='ke';
      if(S.kind==='retreat'&&ke){ const Y=SD.KE_YARD; spots.set('ke',[Y.x0-.6,Y.y1+.8,plan.dog]); } else if(S.kind==='dalat'&&!ke&&GUARD_PEN[a.k]){ const [x,y]=GUARD_PEN[a.k]; spots.set(a.k==='nai'?'lon':a.k,[x,y,plan.dog]); } } }
  let i=0; for(const [x,y,dk] of spots.values()){ const X=x*T, Y=y*T, f=Math.floor(clock*2+i)%2, sp=dogSpr(dk,f); i++;
    list.push({y:Y,d:()=>{ shadow(X,Y,7); drawFlip(sp.c,X,Y,sp.ax,sp.ay,false); }}); ANITAGS.push({x:X,y:Y-sp.ay-2,pet:'Chó canh chuồng'}); } }
function khogaHere(){ if(!G||G.quests.khoga!=='active') return []; const got=G.flags.khoga||{}; return OI.khoga.map((s,i)=>({...s,i})).filter(s=>s.scene===S.kind&&!got[s.i]); }
function drawKhoga(list){ for(const s of khogaHere()){ const x=s.x*T, y=s.y*T; list.push({y,d:()=>{ shadow(x,y,6); ctx.drawImage(pick('khoga'),Math.round(x-7-cam.x),Math.round(y-15-cam.y+Math.sin(clock*3+s.i)*1.5)); }});
  if(Math.random()<.02) fx.push({kind:'glint',x:x+(Math.random()-.5)*10,y:y-10,t:0,life:.7}); } }
function drawDogs(list){ for(const d of DOGLIST){ const e=Object.entries(PLOTS).find(([id,p])=>id[0]==='k'&&p.o===d.o); if(!e) continue; const pl=SD.FARM.plots[+e[0].slice(1)], x=(pl.x-.9)*T, y=(pl.y+.2)*T;
  list.push({y,d:()=>{ const s=dogSpr(d.k,Math.floor(clock*1.5)%2), b=Math.round(Math.sin(clock*3)*.6); drawFlip(s.c,x,y+b,s.ax,s.ay,false); }}); ANITAGS.push({x,y:y-15,n:d.n,dog:SD.DOGS[d.k].name}); } }
const HORSES=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,c,false))), GALLOP=[0,1,2,3].map(c=>[0,1,2,3].map(f=>A.horse(f,c,true)));
const SADDLED={}; const saddled=(c,f,run)=>{ const k=c+'_'+f+(run?'r':''); return SADDLED[k]||(SADDLED[k]=A.horse(f,c,run,true)); };
// người ngồi trên ngựa / xe máy: dựng chung 1 lớp (con vật/xe + thân trên cắt ngang hông + chân + tay) quay phải,
// rồi lật theo hướng và xoay khi bốc đầu. Màu quần/giày lấy từ chính khung nhân vật.
const COMP=document.createElement('canvas'); COMP.width=96; COMP.height=84;   /* khung ghép người + xe / ngựa / thần thú (đủ chỗ cho thần thú to + người ngồi cao) */ const CG=COMP.getContext('2d'); CG.imageSmoothingEnabled=false;
const RCOL=new WeakMap();
function riderCols(fr){ let c=RCOL.get(fr); if(c) return c; c={pants:'#3a3a48',shoe:'#2a2a2f',shirt:'#c4382e'};
  try{ const d=fr.getContext('2d').getImageData(0,0,32,48).data, at=(x,y)=>{ const i=(y*32+x)*4; return d[i+3]>0?`rgb(${d[i]},${d[i+1]},${d[i+2]})`:null; };
    c.pants=at(15,43)||at(17,43)||c.pants; c.shoe=at(15,47)||at(17,47)||at(15,46)||c.shoe; c.shirt=at(16,37)||at(15,37)||c.shirt; }catch(e){}
  RCOL.set(fr,c); return c; }
function line(g,x0,y0,x1,y1,w,col){ g.fillStyle=col; const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1); for(let i=0;i<=n;i++){ const x=Math.round(x0+(x1-x0)*i/n), y=Math.round(y0+(y1-y0)*i/n); g.fillRect(x,y,w,w); } }
// kind 'horse' | 'bike'; o: {spr, coat, model, mode, bob}
function drawMounted(av,x,y,face,kind,o){ const AX=48, AY=78, g=CG; g.clearRect(0,0,96,84);
  const spr=o.spr; g.drawImage(spr.c,AX-spr.ax,AY-spr.ay);
  const fr=av&&av.anims&&av.anims.idle&&av.anims.idle.frames[0];
  if(fr&&o.mode!=='fallen'){ const M=kind==='horse'?A.horse:kind==='myth'?o.M:o.model==='xedap'?A.bicycle:A.motorbike, sx=AX+M.seat.dx, sy=AY+M.seat.dy-(o.bob||0), col=riderCols(fr);
    g.drawImage(fr,0,0,32,41,sx-16,sy-41,32,41);                                    // thân trên tới hông
    if(o.helmet) helmetOn(g,fr,sx-16,sy-41);
    if(kind==='horse'||kind==='myth'){ line(g,sx-1,sy,sx+2,sy+3,2,col.pants); line(g,sx+2,sy+3,sx+1,sy+8,2,col.pants); g.fillStyle=col.shoe; g.fillRect(sx,sy+9,4,2);
      g.fillStyle='#9aa0a8'; g.fillRect(sx,sy+11,4,1);                                 // bàn đạp
      line(g,sx+3,sy-9,sx+6,sy-5,1,col.shirt); g.fillStyle='#f3b194'; g.fillRect(sx+6,sy-5,2,2);
      if(M.mouth) line(g,sx+7,sy-4,AX+M.mouth.dx,AY+M.mouth.dy-(o.bob||0),1,'#5a3422'); }        // dây cương
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
let drawErrAt=0; const drawErr=e=>{ const t=performance.now(); if(t-drawErrAt>5000){ drawErrAt=t; console.error(e); } };
function drawFlip(c,x,y,ax,ay,flip,clipH){ if(!c) return; const X=Math.round(x-ax-cam.x), Y=Math.round(y-ay-cam.y), h=clipH||c.height;
  if(!flip){ ctx.drawImage(c,0,0,c.width,h,X,Y,c.width,h); return; } ctx.save(); ctx.translate(X+c.width,Y); ctx.scale(-1,1); ctx.drawImage(c,0,0,c.width,h,0,0,c.width,h); ctx.restore(); }
function marker(x,y,ch,col){ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y+Math.sin(clock*4)*1.5);
  ctx.fillStyle='#1c1516'; ctx.fillRect(X-4,Y-8,9,10); ctx.fillStyle=col||(ch==='?'?'#7de07a':'#ffd84a'); ctx.fillRect(X-3,Y-7,7,8);
  ctx.fillStyle='#1c1516'; if(ch==='!'){ ctx.fillRect(X,Y-6,1,4); ctx.fillRect(X,Y-1,1,1); } else { ctx.fillRect(X-1,Y-6,3,1); ctx.fillRect(X+1,Y-5,1,2); ctx.fillRect(X,Y-3,1,1); ctx.fillRect(X,Y-1,1,1); } }
function sparkle(x,y){ const k=Math.floor(clock*6)%4; ctx.fillStyle='#fff7d6'; ctx.fillRect(Math.round(x-cam.x+(k-2)*2),Math.round(y-cam.y-k),1,1); }
// vẽ 1 nhân vật: av = sprite dựng từ template, sheet = sheet NPC
// MU: đang vung kiếm đánh thường thì vẽ bản bỏ kiếm có sẵn trong bộ giáp class (maps8 vẽ thanh kiếm đang vung), khỏi thành 2 thanh kiếm
const NOWEP=new Map(); function swAv(pid,av,look){ const sw=window.MU8&&window.MU8.swinging&&window.MU8.swinging(pid); if(!sw||!look||look.wep) return av; let a=NOWEP.get(pid);
  if(!a||a.look!==look){ try{ a={look,av:AVATAR.build({...look,wep:'_'})}; }catch(e){ return av; } NOWEP.set(pid,a); } return a.av; }
// MU: người đang gục vẽ mờ như hồn ma
function drawCharA(pid,c,...a){ const k=window.MU8&&window.MU8.deadAlpha?window.MU8.deadAlpha(pid):1; if(k<1){ c.save(); c.globalAlpha=k; drawChar(c,...a); c.restore(); } else drawChar(c,...a); }
// Xích Thố (cả người khác cưỡi): cứ ~3,2 giây phun lửa ra trước mõm 0,65 giây, lửa liếm móng khi chạy, móng để lại vết cháy đen mờ dần trên đất
const XTS=new WeakMap();
function xtFx(av,x,y,face,moving,el){ const now=performance.now(), st=XTS.get(av)||(XTS.set(av,{br:now-Math.random()*3000,sc:0,h:0}),XTS.get(av)), fc=(A.XT_FC&&A.XT_FC[el])||['#ff8a1a','#ffd84a','#ff5a1a'];
  if(now-st.br>3200) st.br=now;
  if(now-st.br<650) for(let i=0;i<2;i++) fx.push({kind:'ember',c:[fc[0],fc[1],'#fff3b0',fc[2]][Math.floor(Math.random()*4)],x:x+face*(26+Math.random()*3),y:y-33+Math.random()*3,vx:face*(70+Math.random()*60),vy:-8+Math.random()*16,t:0,life:.3+Math.random()*.25,s:2+(Math.random()<.4)});
  if(moving){ if(Math.random()<.5){ const hx=[-12,-8,8,11][Math.floor(Math.random()*4)]; fx.push({kind:'ember',c:Math.random()<.5?fc[0]:fc[1],x:x+face*hx,y:y-1,vx:-face*8+(Math.random()-.5)*10,vy:-14-Math.random()*18,t:0,life:.3+Math.random()*.3,s:1+(Math.random()<.3)}); }
    if(now-st.sc>120){ st.sc=now; st.h^=1; const hx=st.h?-10:9; fx.push({kind:'scorch',ground:true,x:x+face*hx+(Math.random()-.5)*2,y:y+1,t:0,life:5,s:2+Math.random()}); } } }
function drawChar(c,av,x,y,face,view,anim,act,t,actT,fl){ const anims=av.anims;
  const riding=fl&SD.FL.ride, kayak=fl&SD.FL.kayak;
  shadow(x,y,riding?14:8);
  let an, k, fr;
  if(act&&anims[act==='gong'?'gong':act]){ an=anims[act==='gong'?'gong':act]; k=Math.max(0,Math.floor(actT*an.fps)); fr=an.loop?an.frames[k%an.frames.length]:an.frames[Math.min(an.frames.length-1,k)]; }
  else { an=anims[anim]||anims[anim&&anim.split('_')[0]]||anims.idle; fr=an.frames[Math.floor(t*an.fps)%an.frames.length]; }
  const flip=face<0&&(!!act||view==='side'||!anims[anim]);
  if(riding){ const moving=anim.startsWith('run')||anim.startsWith('walk'), f=Math.floor(t*(moving?12:3))%4, mi=Math.floor((fl||0)/SD.FL.mount)&15, mk=SD.mountKey(mi),   /* 9…14: Xích Thố theo hệ */ my=mk&&A.mythMount?A.mythMount(mk,f,moving):null;
    if(my){ drawMounted(av,x,y,face,'myth',{spr:my,M:A.mythMount.M[mk],bob:0}); if(mi>=9) xtFx(av,x,y,face,moving,mk.slice(8)); return; }   /* thần thú (cường hoá ngựa); Xích Thố: phun lửa, lửa móng, vết cháy */
    drawMounted(av,x,y,face,'horse',{spr:saddled(Math.floor((fl||0)/SD.FL.coat)&3,f,moving),bob:moving&&f%2?1:0}); return; }   // màu ngựa theo loại người cưỡi chọn
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
  if(act==='shisha'&&Math.random()<.05) fx.push({kind:'smoke',x:x+face*6,y:y-30,t:0,life:1.8});
  if(act==='shower'&&Math.random()<.2) fx.push({kind:'steam',x:x+(Math.random()-.5)*16,y:y-36,t:0,life:.8}); }
function draw(){
  // đặt lại trạng thái canvas mỗi khung: 1 chỗ vẽ lỗi giữa save()/restore() không làm lệch / mờ / lật cả thế giới về sau (trắng màn hình)
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.shadowBlur=0; ctx.shadowColor='transparent'; ctx.filter='none';
  const mw=S.W*T, mh=S.H*T;
  // đang đua: camera bám đàn ngựa trên đường đua thay vì người đứng ở khán đài
  const racing=S.kind==='track'&&RACE&&(RACE.st==='run'||RACE.st==='done')&&RACE.riders.length, rx=racing?RACE.riders.reduce((a,r)=>a+(r._x||Wd.TRACK.x0*T),0)/RACE.riders.length:0;
  const pkc=pkView()&&SD.PICKLE.court, fx_=racing?rx:pkc?(pkc.x0+pkc.x1+1)/2*T:P.x, fy_=racing?14.5*T+20:pkc?(pkc.y0+pkc.y1+1)/2*T+12:P.y;   // đấu pickleball: camera đứng giữa sân thấy cả 2 đội
  // camera được lố qua mép map một khoảng bằng phần HUD che (khung nhiệm vụ / chat bên trái, cột nút bên phải...) để đồ ở góc map
  // (điện thoại nhiệm vụ đầu, thang máy Everfit) không nằm khuất dưới HUD; map nhỏ hơn màn thì vẫn căn giữa như cũ
  const ax=(m,V,f,a,b)=>{ if(m<=V) return (m-V)/2; const lo=-a, hi=m-V+b; return Math.max(lo,Math.min(hi,f)); };
  const hpad=racing||pkc?{l:0,r:0,t:0,b:0}:HUDPAD;
  cam.x=ax(mw,VW,fx_-VW/2,hpad.l,hpad.r); cam.y=ax(mh,VH,fy_-20-VH/2,hpad.t,hpad.b);
  const sk=shakeT>0?shakeA*Math.min(1,shakeT/.15):0, cx=Math.round(cam.x+(Math.random()-.5)*2*sk), cy=Math.round(cam.y+(Math.random()-.5)*2*sk), k=S.kind, now=NET.now();
  cam.x=cx; cam.y=cy;   // 1 camera số nguyên cho mọi thứ: nhân vật / bóng / hiệu ứng (vẽ theo cam) khớp nền (vẽ theo cx), rung màn rung cả người
  ctx.fillStyle=S.map.indoor?'#1c1516':'#3f7a31'; ctx.fillRect(0,0,VW,VH);
  S.ground.draw(ctx,cx,cy,VW,VH,waterFrame); if(window.AMB&&AMB_ST) AMB.ground(ctx,cx,cy); TREES.length=0;
  const list=[], inView=(x,y,m=80)=>x>cx-m&&x<cx+VW+m&&y>cy-40&&y<cy+VH+m+40, [oi0,oi1,oj0,oj1]=S.ground.range(cx,cy,VW,VH,1), near=[];
  for(let j=oj0;j<=oj1;j++) for(let i=oi0;i<=oi1;i++){ const b=S.objB.get(i+'_'+j); if(b) for(const o of b) near.push(o); }
  for(const o of near){ if(!inView(o.x,o.y)) continue; if(o.tree) TREES.push(o); list.push({y:o.sort??o.y,d:()=>{ let spr=o.spr;
    if(o.id==='bonfire') spr=A.bonfire(G.flags.fire,Math.floor(clock*6));
    if(o.id==='phone'&&!G.flags.called&&ringTimer<=0) spr=A.phone(true,Math.floor(clock*8));
    if(o.id==='windmill') spr=windmillFrame(); if(o.anim&&window.MAPX) spr=MAPX.anim(o,clock)||spr;
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
  ANITAGS=[]; SAYS=[]; if(k==='retreat'&&PCAR&&!PCAR.driving){ const c=PICK.__hatch||(PICK.__hatch=A.hatch()), X=PCAR.x*T, Y=PCAR.y*T; list.push({y:Y,d:()=>{ shadow(X,Y,32); drawFlip(c.c,X,Y+4,c.ax,c.ay,false); }}); ANITAGS.push({x:X,y:Y-32,n:'Chika Phú',car:true}); }
  if(k==='dalat') drawCsgt(list,now);
  if(k==='retreat'){ drawCsgt(list,now);
    drawWild(list,inView); drawKeYard(list,now); drawButterflies(list,inView,now); drawDogs(list); drawWildDucks(list,inView,[[20,106,6,1.2],[30,108,5,1],[52,106,7,1.5],[60,109,4,1],[10,108,4,1],[38,110,6,1.2]]); }
  if(k==='track') drawRace(list);
  for(const n of npcs) list.push({y:n.y,d:()=>drawNpc(n)});
  const dancing=k==='phongbay'&&DANCE&&DANCE.st==='play', dn=dancing?new Set(DANCE.dancers.map(d=>d.name)):null;
  drawFollow(list,inView); drawOii(list,inView); drawKhoga(list); drawPumpkins(list); drawGuards(list); drawPickle(list); if(window.MAPX){ try{ MAPX.draw(list,ctx); }catch(e){ drawErr(e); } }
  const pkSeated=k==='pickle'&&PK&&PK.st==='play'?new Set(PK.seats.filter(s=>s&&!s.bot).map(s=>s.pid)):null;   // người đang đấu pickleball vẽ ở drawPickle (chạy theo bóng)
  for(const r of REM.values()){ interp(r); if(!r.av||!inView(r.x,r.y)||(pkSeated&&pkSeated.has(r.id))) continue; const ac=dancing&&dn.has(r.name)?'quay':r.act; list.push({y:r.y,d:()=>drawCharA(r.id,ctx,swAv(r.id,r.av,r.look),r.x,r.y,r.face,r.view,r.anim,ac,r.t,ac==='quay'?r.t:r.actT,r.fl)}); }
  if(k==='deo'&&STUNT){ const mode=STUNT.fallT>0?'fallen':STUNT.wheelieT>0?'wheelie':''; const dx=P.x+26+Math.sin(clock*.7)*18, dc=SHEETS.donche;
    const dm=!STUNT.pick&&Math.sin(clock*1.3)>.6?'wheelie':'', bk=STUNT.bike||STUNT.preview||'wave';
    list.push({y:P.y+19,d:()=>{ shadow(dx,P.y+18,14); drawMounted(dc,dx,P.y+18,1,'bike',{spr:bikeOf(Math.floor(clock*12),'exciter',dm),model:'exciter',mode:dm}); }});
    list.push({y:P.y+8,d:()=>{ shadow(P.x,P.y+8,14); drawMounted(P.av,P.x,P.y+8,1,'bike',{spr:bikeOf(Math.floor(clock*12),bk,mode),model:bk,mode}); }}); }
  else if(P.av) list.push({y:P.y+(P.seat?40:0),d:()=>drawCharA(NET.pid,ctx,swAv(NET.pid,P.av,G.look),P.x,P.y-(P.seat?P.seat.lift:0),P.face,P.view,P.anim,P.act||(TASK&&TASK.anim)||(k==='phongbay'&&DANCE&&DANCE.st==='play'&&DANCE.me>=0?'quay':''),P.act?P.t:P.t,P.act?P.actT:P.t,(P.riding?SD.FL.ride+((G.horseCoat||0)&3)*SD.FL.coat+SD.mythIdx(G)*SD.FL.mount:0)|(P.pcar?SD.FL.car:0)|(P.incar?SD.FL.incar:0)|(P.moto?SD.FL.moto:0)|(P.moto&&G.helmet&&P.moto!=='xedap'?SD.FL.helmet:0)|(P.opt==='robot'?SD.FL.optimus:0)|(P.opt==='truck'?SD.FL.otruck:0)|(P.kayak?SD.FL.kayak:0)|(FISH?SD.FL.fish:0)|(G.needs.clean<20?SD.FL.dirty:0))});
  for(const f of fx) if(f.ground) drawFx(f,cx,cy);                       // vệt dưới chân (nước vàng loang...)
  if(window.AMB&&AMB_ST){ AMB.list(list,ctx,cx,cy); AMB.decor(list,ctx,cx,cy,AMB_ST); }
  const hp=plotTarget(); if(hp){ ctx.fillStyle=`rgba(255,216,74,${.16+.08*Math.sin(clock*6)})`; ctx.fillRect(hp.X-cx,hp.Y-cy,T,T); }   // ô đất đang chọn: tô nền
  list.sort((a,b)=>a.y-b.y); for(const it of list){ try{ it.d(); }catch(e){ drawErr(e); } }   /* 1 thứ vẽ lỗi thì bỏ qua thứ đó, không làm đen cả màn hình */
  for(const o of S.over) ctx.drawImage(o.spr.c,Math.round(o.x-o.spr.ax-cx),Math.round(o.y-o.spr.ay-cy));
  if(hp){ const X=hp.X-cx, Y=hp.Y-cy, o=Math.floor(clock*4)%2, L=5, x0=X-1-o, y0=Y-1-o, x1=X+T+o, y1=Y+T+o;   // ô đất đang chọn: 4 góc vàng nhấp nháy
    const corner=(x,y,sx,sy,c)=>{ ctx.fillStyle=c; ctx.fillRect(sx>0?x:x-L+1,y,L,1); ctx.fillRect(x,sy>0?y:y-L+1,1,L); };
    for(const [x,y,sx,sy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){ corner(x+1,y+1,sx,sy,'#1c1516'); corner(x,y,sx,sy,'#ffd84a'); }
  }
  // ban đêm không làm tối màn hình (theo yêu cầu); chỉ bật dây đèn vàng ở Ké theo giờ Việt Nam
  if(k==='retreat') drawLights(cx,cy);
  if(window.AMB&&AMB_ST) AMB.front(ctx,cx,cy,VW,VH,AMB_ST);
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
  shadow(n.x,n.y,8); const sh=npcSheet(n); if(!sh) return; const base=n.moving&&!n.act?'walk':'idle', v=!n.act&&n.view&&n.view!=='side'?base+'_'+n.view:null;   // đang đi dạo thì dùng động tác đi
  let an=sh.anims[n.act||v||base]||sh.anims.idle, k=Math.floor((n.act?n.actT:n.t)*an.fps);
  const f=n.act&&!an.loop?an.frames[Math.min(an.frames.length-1,k)]:an.frames[k%an.frames.length]; drawFlip(f,n.x,n.y,16,48,n.face<0&&!v);
  const qs=Object.keys(Q).filter(q=>Q[q].giver===n.id), qid=qs.find(k=>G.quests[k]!=='done'&&(!Q[k].after||G.quests[Q[k].after]==='done'))||qs[qs.length-1], st=G.quests[qid];
  n._mk=(n.id==='phap'&&!G.flags.hello)||!st||(st==='active'&&canFinish(qid));   // có dấu !/? trên đầu: tên NPC đẩy lên trên dấu, không vẽ đè
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
// ảnh thumbnail điểm đến Grab: chụp 1 góc map thật (ô đất + đồ vật) quanh chỗ đặc trưng, dựng dần từng map rồi lưu lại
const THUMB={}, THUMB_AT={epl:['epl',79,48],mu:['mu',22+(SD.MU.OX||0),14+(SD.MU.OY||0)],lavi:['lavi',16,11],nghienmotion:['nghienmotion',14,10],bearplus:['bearplus',17,10],vnpt:['vnpt',13,10],mieu:['mieu',20,13],home:['room'],everfit:['everfit'],retreat:['retreat',39.5,91],dalat:['dalat',24,56],das:['das',16,8],lumen:['lumen',19,26],yenlang:['yenlang',13,9],pickle:['pickle',15,11],diep:['diep',11,9]}; let thumbBusy=false;
function snapMap(m,cx,cy){ const VW=12, VH=7, c=A.cv(VW*T,VH*T), g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  const x0=Math.max(0,Math.min(m.W-VW,Math.round(cx-VW/2))), y0=Math.max(0,Math.min(m.H-VH,Math.round(cy-VH/2))), nb=(x,y)=>(dx,dy)=>{ const yy=y+dy, xx=x+dx; return yy>=0&&yy<m.H&&xx>=0&&xx<m.W?m.grid[yy][xx]:'F'; };
  g.translate(-x0*T,-y0*T); for(let y=y0;y<y0+VH;y++) for(let x=x0;x<x0+VW;x++) A.drawTile(g,m.grid[y][x],x,y,nb(x,y),0);
  const inView=o=>{ const s=o.spr; return s&&o.x-s.ax<(x0+VW)*T&&o.x-s.ax+s.c.width>x0*T&&o.y-s.ay<(y0+VH)*T&&o.y-s.ay+s.c.height>y0*T; };
  for(const o of m.obj.filter(o=>o.flat&&inView(o))) g.drawImage(o.spr.c,o.x-o.spr.ax,o.y-o.spr.ay);
  for(const o of m.obj.filter(o=>!o.flat&&inView(o)).sort((a,b)=>a.y-b.y)) g.drawImage(o.spr.c,o.x-o.spr.ax,o.y-o.spr.ay);
  return c.toDataURL(); }
function destThumb(k){ if(THUMB[k]) return THUMB[k]; const at=THUMB_AT[k]; if(!at||thumbBusy) return '';
  thumbBusy=true; setTimeout(()=>{ try{ const m=S&&S.kind===at[0]?S.map:buildMap(at[0]); THUMB[k]=snapMap(m,at[1]!=null?at[1]:m.spawn.x/T,at[2]!=null?at[2]:m.spawn.y/T-2); }catch(e){ THUMB[k]='data:,'; console.error(e); } thumbBusy=false; UI.refresh(); },30);
  return ''; }
function drawMega(list){ const M=MEGA; if(!M||S.kind!=='retreat') return; if(M.dx==null){ M.dx=M.x; M.dy=M.y; } const ox=M.dx, oy=M.dy; M.dx+=(M.x-M.dx)*.25; M.dy+=(M.y-M.dy)*.25;
  const moving=Math.hypot(M.dx-ox,M.dy-oy)>.004, el=NET.now()-(M.actAt||0), v=M.act==='punch'&&el<350?'punch':M.act==='fire'&&el<450?'fire':'side', x=M.dx*T, y=M.dy*T;
  list.push({y,d:()=>{ const s=megaSpr(v,moving?Math.floor(clock*7)%2:0); shadow(x,y,16); drawFlip(s.c,x,y+2,s.ax,s.ay,M.face<0); }});
  for(const [sx,sy] of M.shots||[]) list.push({y:sy*T+20,d:()=>{ const s=PTRUCK.shot||(PTRUCK.shot=A.megaShot()); drawFlip(s.c,sx*T,sy*T,s.ax,s.ay,false); if(Math.random()<.5) fx.push({kind:'glint',x:sx*T,y:sy*T,t:0,life:.3}); }}); }
function bossBar(){ const b=$('#bossBar'), M=MEGA; if(!b) return; const on=!!M&&S&&S.kind==='retreat'; b.hidden=!on; if(!on) return;
  b.querySelector('.mg i').style.width=Math.max(0,M.hp/M.max*100)+'%'; b.querySelector('.op i').style.width=Math.max(0,M.opt/M.optMax*100)+'%'; b.querySelector('.mg b').textContent=Math.max(0,M.hp)+'/'+M.max; b.querySelector('.op b').textContent=Math.max(0,M.opt)+'/'+M.optMax; }
function drawWildlife(list){ if(S.kind!=='retreat') return; const lerp=(o,k)=>{ if(o.dx==null){ o.dx=o.x; o.dy=o.y; } const ox=o.dx, oy=o.dy; o.dx+=(o.x-o.dx)*k; o.dy+=(o.y-o.dy)*k; return Math.hypot(o.dx-ox,o.dy-oy)>.002; };
  const D=WDINO; if(D){ const mv=lerp(D,.12), K=SD.WILDLIFE.dino.kinds[D.k]||{}, x=D.dx*T, y=D.dy*T, f=Math.floor(clock*(K.fly?6:mv?5:1))%2;
    list.push({y:K.fly?y+999:y,d:()=>{ const s=dinoSpr(D.k,f), lift=K.fly?44+Math.round(Math.sin(clock*2)*4):0; if(K.fly){ ctx.fillStyle='rgba(20,30,20,.22)'; ctx.beginPath(); ctx.ellipse(Math.round(x-cam.x),Math.round(y-cam.y),18,4,0,0,7); ctx.fill(); } else shadow(x,y,20);
      const sc={bronto:1.5,trice:1.25,ptero:1.2,rexpink:1.4,rex:1.5}[D.k]||1; ctx.save(); ctx.translate(Math.round(x-cam.x),Math.round(y-lift-cam.y)); ctx.scale(D.face<0?-sc:sc,sc); ctx.drawImage(s.c,-s.ax,-s.ay); ctx.restore(); }}); }   // khủng long to hơn người
  const C=WCROC; if(C){ lerp(C,.14); const x=C.dx*T, y=C.dy*T;
    list.push({y,d:()=>{ const X=Math.round(x-cam.x), Y=Math.round(y-cam.y); if(!C.dive){ const s=dinoSpr('croc',Math.floor(clock*3)%2,Math.sin(clock*2)>.6), cut=11;   // nổi nửa người: chỉ vẽ phần trên mặt nước
        ctx.save(); ctx.translate(X,Y); if(C.face<0) ctx.scale(-1,1); ctx.drawImage(s.c,0,0,s.c.width,cut,-s.ax,-s.ay+4,s.c.width,cut); ctx.restore(); }
      ctx.fillStyle='rgba(255,255,255,.5)'; for(let k=0;k<3;k++){ const r=8+((clock*14+k*7)%18); ctx.fillRect(X-r,Y+4+k%2,2,1); ctx.fillRect(X+r-2,Y+4+k%2,2,1); } }}); }
  const t=NET.now()/1000; for(const st of STARS){ const p=starPos(st,t), say=STARSAY[st.id], hop=say&&performance.now()-say<1400&&st.id==='cr7'?Math.round(Math.abs(Math.sin((performance.now()-say)/1400*Math.PI*2))*10):0;
    list.push({y:p.y,d:()=>{ drawChar(ctx,starAv(st.id),p.x,p.y-hop,p.face,p.view,(say&&performance.now()-say<1400?'idle':'walk')+(p.view!=='side'?'_'+p.view:''),'',clock,clock,0);
    }}); SAYS.push({x:p.x,y:p.y-46-hop,name:SD.NPC_LOOKS[st.id].name,text:say&&performance.now()-say<2600?st.line:''});
    if(Math.hypot(p.x-P.x,p.y-P.y)<2.6*T&&(!say||performance.now()-say>20000)){ STARSAY[st.id]=performance.now(); sayLine(st.voice,st.pitch); if(st.id==='cr7') for(let k=0;k<10;k++) fx.push({kind:'glint',x:p.x+(Math.random()-.5)*24,y:p.y-30+(Math.random()-.5)*20,t:-k*.05,life:.8}); } } }
function drawCsgt(list,now){ drawWildlife(list); drawMega(list); bossBar(); drawMck(list); mckBar(); const lt=Math.floor(clock*4)%2, c=S.kind==='retreat'&&CSGT_POST;
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
  if(f.kind==='puff'){ if(f.t<0) return; const r=1+k*2.6, a=.55*(1-k); ctx.fillStyle=`rgba(236,226,204,${a})`; ctx.beginPath(); ctx.arc(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),r,0,7); ctx.fill(); return; }
  if(f.kind==='pop'){ if(f.t<0) return; const e=Math.min(1,f.t/.32), back=1+2.2*Math.pow(e-1,3)+1.2*Math.pow(e-1,2), y=Math.round(Y-back*14-f.t*5), a=k>.7?(1-k)/.3:1, ic=pick(f.icon);
    ctx.globalAlpha=a; ctx.fillStyle='rgba(28,21,22,.35)'; ctx.beginPath(); ctx.ellipse(X,Y+2,5*(1-e*.4),2,0,0,7); ctx.fill(); ctx.drawImage(ic,X-7,y-7);
    if(f.t<.25){ ctx.fillStyle='#fff3d6'; for(let i=0;i<4;i++){ const an=i*1.57+.78, rr=6+f.t*40; ctx.fillRect(Math.round(X+Math.cos(an)*rr),Math.round(y+Math.sin(an)*rr),1,1); } }
    ctx.font='14px VT323, monospace'; ctx.textAlign='left'; ctx.fillStyle='#1c1516'; ctx.fillText('+'+f.n,X+8,y+6); ctx.fillStyle='#ffd84a'; ctx.fillText('+'+f.n,X+7,y+5); ctx.globalAlpha=1; return; }
  if(f.kind==='scorch'){ ctx.globalAlpha=.5*(1-k); ctx.fillStyle='#1c1210'; ctx.beginPath(); ctx.ellipse(X,Y,f.s+1.5,f.s*.55,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#3a2418'; ctx.fillRect(X-1,Y-1,2,1); ctx.globalAlpha=1; return; }   /* vết cháy móng Xích Thố */
  if(f.kind==='ember'){ if(f.t<0) return; ctx.globalAlpha=1-k; ctx.fillStyle=f.c; const z=f.s||2; ctx.fillRect(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),z,z); ctx.globalAlpha=1; }   /* tàn lửa có màu (Xích Thố) */
  if(f.kind==='dust'){ ctx.fillStyle=`rgba(230,220,200,${1-k})`; ctx.fillRect(Math.round(f.x+f.vx*f.t-cx),Math.round(f.y+f.vy*f.t-cy),2,2); }
  if(f.kind==='note'){ ctx.fillStyle=`rgba(255,216,74,${1-k})`; const x=Math.round(X+Math.sin(f.t*6)*3), y=Math.round(Y-f.t*16); ctx.fillRect(x,y,2,2); ctx.fillRect(x+1,y-4,1,4); ctx.fillRect(x+1,y-4,2,1); }
  if(f.kind==='heart'){ ctx.fillStyle=`rgba(255,90,120,${1-k})`; const y=Math.round(Y-f.t*14); ctx.fillRect(X-2,y,2,2); ctx.fillRect(X+1,y,2,2); ctx.fillRect(X-2,y+1,5,2); ctx.fillRect(X-1,y+3,3,1); ctx.fillRect(X,y+4,1,1); }
  if(f.kind==='z'){ ctx.fillStyle=`rgba(240,240,255,${1-k})`; const y=Math.round(Y-f.t*10); ctx.fillRect(X,y,3,1); ctx.fillRect(X+1,y+1,1,1); ctx.fillRect(X,y+2,3,1); }
  if(f.kind==='spark'){ ctx.fillStyle=`rgba(127,224,255,${1-k})`; ctx.fillRect(X,Y-Math.round(f.t*8),1,1); }
  if(f.kind==='fly'){ ctx.fillStyle=`rgba(40,40,30,${1-k})`; ctx.fillRect(X+Math.round(Math.sin(f.t*20)*3),Y-Math.round(f.t*6),1,1); }
  if(f.kind==='splash'){ ctx.fillStyle=`rgba(240,250,255,${1-k})`; ctx.fillRect(X-1,Y-Math.round(k*4),1,1); ctx.fillRect(X+2,Y-Math.round(k*3),1,1); ctx.fillRect(X,Y,2,1); }
  if(f.kind==='wake'){ ctx.fillStyle=`rgba(216,239,255,${(1-k)*.8})`; ctx.fillRect(X-Math.round(k*6),Y,2+Math.round(k*10),1); }
  if(f.kind==='glint'){ ctx.fillStyle=`rgba(255,240,140,${1-k})`; const r=Math.round(2+k*8); ctx.fillRect(X-r,Y,r*2+1,1); ctx.fillRect(X,Y-r,1,r*2+1); }
  if(f.kind==='smoke'){ const r=1+Math.round(k*3); ctx.fillStyle=`rgba(236,236,242,${(1-k)*.6})`; ctx.fillRect(X-r+Math.round(Math.sin(f.t*3)*3),Y-Math.round(f.t*12)-r,r*2,r*2); }
  if(f.kind==='steam'||f.kind==='bubble'){ ctx.fillStyle=`rgba(255,255,255,${(1-k)*.7})`; ctx.fillRect(X,Y-Math.round(f.t*10),2,2); }
  if(f.kind==='dmg'){ ug.save(); } }
// tên, khung chat, thanh máu/vật tay vẽ ở độ phân giải màn hình
/* danh hiệu top 10 đại gia: khung tối viền màu + chữ óng ánh, mỗi hạng 1 hiệu ứng (vàng quét sáng, bạc, đồng, sấm tím, cầu vồng,
   kiếm khí xanh, GOAT nhiễu sóng, bát quái đen trắng, mây trời bồng bềnh, lửa vĩ thú bốc tàn) */
// top 1 / 2 / 3 đại gia: ngọn lửa rực trên đầu (vàng / đỏ / xanh lá), lập loè + tàn lửa bay lên; vẽ ngay trên danh hiệu
const FLAME=[['#fff8c0','#ffd84a','#ff9a1a'],['#ffd8b0','#ff4a2a','#a8101a'],['#eaffc8','#6aff4a','#1a8a2a']];
function drawFlame(x,y,rk,t){ const C=FLAME[rk-1]; if(!C) return; const g=ug; g.save(); g.shadowColor=C[2]; g.shadowBlur=8;
  for(let i=0;i<5;i++){ const ph=t/170+i*1.7, ox=(i-2)*8+Math.sin(ph)*2, h=22+(i===2?12:i%2?3:7)+Math.sin(ph*1.3)*5, bx=x+ox, by=y;
    const gr=g.createLinearGradient(bx,by,bx,by-h); gr.addColorStop(0,C[2]); gr.addColorStop(.4,C[1]); gr.addColorStop(.85,C[0]); gr.addColorStop(1,C[0]+'00'); g.fillStyle=gr; g.globalAlpha=.95;
    g.beginPath(); g.moveTo(bx-7,by); g.quadraticCurveTo(bx-7,by-h*.5,bx+Math.sin(ph*1.7)*3,by-h); g.quadraticCurveTo(bx+7,by-h*.5,bx+7,by); g.closePath(); g.fill(); }
  g.globalAlpha=.9; g.fillStyle=C[0]; g.beginPath(); g.ellipse(x,y-6,10,4.5,0,0,7); g.fill();
  for(let k=0;k<6;k++){ const p=((t/900)+k*.17)%1, sx_=x+Math.sin(k*2.3+t/400)*14, sy_=y-8-p*36; g.globalAlpha=1-p; g.fillStyle=C[k%2]; g.fillRect(Math.round(sx_),Math.round(sy_),2,2); }
  g.restore(); }
function drawTitle(x,y,rk,t,DX){ const D=DX||SD.TOP_TITLES[rk-1]; if(!D) return; const g=ug, txt=(D.pre||(rk===1?'♛ ':rk===7?'🐐 ':''))+D.name; g.save(); g.font='17px VT323, monospace'; g.textAlign='left'; g.textBaseline='alphabetic';
  const w=g.measureText(txt).width, x0=Math.round(x-w/2), by=Math.round(y), L=x0-6, R=x0+w+6, chars=[...txt];
  g.fillStyle='rgba(14,10,20,.86)'; g.fillRect(L,by-15,R-L,19); g.strokeStyle=D.edge; g.globalAlpha=.55+.35*Math.sin(t/300); g.lineWidth=1; g.strokeRect(L+.5,by-14.5,R-L-1,18); g.globalAlpha=1;
  const each=(fn)=>{ let cx=x0; chars.forEach((ch,i)=>{ const cw=g.measureText(ch).width; fn(ch,cx,i,cw); cx+=cw; }); };
  const sweep=(c0,c1,c2,speed)=>{ const p=((t/speed)%1.6)-.3, gr=g.createLinearGradient(x0,0,x0+w,0); gr.addColorStop(0,c0); gr.addColorStop(Math.max(0,Math.min(1,p-.15)),c1); gr.addColorStop(Math.max(0,Math.min(1,p)),c2); gr.addColorStop(Math.max(0,Math.min(1,p+.15)),c1); gr.addColorStop(1,c0); return gr; };
  const out=()=>{ g.lineWidth=3; g.strokeStyle='#120c16'; g.strokeText(txt,x0,by); };
  const fx=D.fx;
  if(fx==='gold'||fx==='silver'||fx==='bronze'){ const C={gold:['#c8901a','#ffd84a','#fffbe0','#ffb400'],silver:['#8a96a4','#dfe8f2','#ffffff','#7fd0ff'],bronze:['#a8522a','#f0a060','#ffe4c8','#ff6a2a']}[fx];
    out(); g.shadowColor=C[3]; g.shadowBlur=fx==='bronze'?4+4*Math.sin(t/220):7; g.fillStyle=sweep(C[0],C[1],C[2],fx==='gold'?1300:fx==='silver'?1600:2000); g.fillText(txt,x0,by); g.shadowBlur=0;
    if(fx!=='bronze') for(let k=0;k<3;k++){ const ph=t/700+k*2.1, a=Math.max(0,Math.sin(ph)), sx_=L+((k*37+Math.floor(ph/6.28)*53)%(R-L)), sy_=by-15+((k*11)%18); g.fillStyle=`rgba(255,255,240,${a})`; g.fillRect(sx_-2,sy_,5,1); g.fillRect(sx_,sy_-2,1,5); } }
  else if(fx==='thunder'){ const fl=Math.sin(t*.011)+Math.sin(t*.027)>1.6; out(); g.shadowColor='#b48aff'; g.shadowBlur=fl?16:6; g.fillStyle=fl?'#ffffff':'#c8a8ff'; g.fillText(txt,x0,by); g.shadowBlur=0;
    if(fl){ g.strokeStyle='#f0e0ff'; g.lineWidth=1; g.beginPath(); let zx=L-2, zy=by-16; g.moveTo(zx,zy); for(let i=0;i<4;i++){ zx+=3; zy+=(i%2?-3:5); g.lineTo(zx,zy); } g.stroke(); } }
  else if(fx==='rainbow'){ each((ch,cx,i)=>{ const yy=by+Math.round(Math.sin(t/220+i*.6)); g.lineWidth=3; g.strokeStyle='#120c16'; g.strokeText(ch,cx,yy); g.fillStyle=`hsl(${(t/7+i*28)%360},95%,66%)`; g.fillText(ch,cx,yy); }); }
  else if(fx==='sword'){ out(); g.shadowColor='#2ab0ff'; g.shadowBlur=6; g.fillStyle='#bff0ff'; g.fillText(txt,x0,by); g.shadowBlur=0;
    for(let k=0;k<2;k++){ const p=((t/650+k*.5)%1), hx=L+p*(R-L), hy=by-11+k*7, gr=g.createLinearGradient(hx-18,0,hx,0); gr.addColorStop(0,'rgba(127,224,255,0)'); gr.addColorStop(1,'rgba(230,250,255,.95)'); g.fillStyle=gr; g.fillRect(hx-18,hy,18,1); } }
  else if(fx==='glitch'){ const gl=(Math.floor(t/90)%17)<2; if(gl){ g.fillStyle='rgba(255,60,90,.8)'; g.fillText(txt,x0-2,by); g.fillStyle='rgba(60,160,255,.8)'; g.fillText(txt,x0+2,by-1); }
    out(); g.shadowColor='#2aff6a'; g.shadowBlur=8; g.fillStyle=gl?'#e8ffe8':'#6cf07a'; g.fillText(txt,x0+(gl?1:0),by); g.shadowBlur=0; }
  else if(fx==='yinyang'){ const sw=Math.floor(t/650)%2; each((ch,cx,i)=>{ const wh=(i+sw)%2===0; g.lineWidth=3; g.strokeStyle=wh?'#120c16':'#f4f4f2'; g.strokeText(ch,cx,by); g.fillStyle=wh?'#f4f4f2':'#120c16'; g.fillText(ch,cx,by); });
    g.shadowBlur=0; for(const [k,cx] of [[0,L-1],[1,R+1]]){ const r=4; g.fillStyle=k?'#120c16':'#f4f4f2'; g.beginPath(); g.arc(cx,by-6,r,0,7); g.fill(); g.fillStyle=k?'#f4f4f2':'#120c16'; g.beginPath(); g.arc(cx,by-6,r,(t/300)%6.28,(t/300)%6.28+Math.PI); g.fill(); } }
  else if(fx==='heaven'){ for(let k=0;k<2;k++){ const cx=(k?R:L)+Math.sin(t/900+k)*3; g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx,by-4,6,3,0,0,7); g.fill(); g.beginPath(); g.ellipse(cx+(k?3:-3),by-7,4,3,0,0,7); g.fill(); }
    each((ch,cx,i)=>{ const yy=by+Math.round(Math.sin(t/380+i*.45)*1.6); g.lineWidth=3; g.strokeStyle='#14223a'; g.strokeText(ch,cx,yy); g.shadowColor='#9fd8ff'; g.shadowBlur=6; g.fillStyle=i%3===0?'#ffffff':'#cfeeff'; g.fillText(ch,cx,yy); g.shadowBlur=0; }); }
  else if(fx==='fire'){ const gr=g.createLinearGradient(0,by-12,0,by+1); gr.addColorStop(0,'#fff3a0'); gr.addColorStop(.45,'#ff9a2a'); gr.addColorStop(1,'#d2281e');
    each((ch,cx,i)=>{ const yy=by-((Math.floor(t/90)+i*7)%5===0?1:0); g.lineWidth=3; g.strokeStyle='#1c0a06'; g.strokeText(ch,cx,yy); g.shadowColor='#ff5a1a'; g.shadowBlur=5+3*Math.sin(t/120+i); g.fillStyle=gr; g.fillText(ch,cx,yy); g.shadowBlur=0; });
    for(let k=0;k<5;k++){ const ph=(t/900+k*.37)%1, ex=L+((k*29)%(R-L))+Math.sin(t/200+k)*2, ey=by-14-ph*12; g.fillStyle=`rgba(255,${150+k*20},60,${1-ph})`; g.fillRect(Math.round(ex),Math.round(ey),1,1); } }
  g.restore(); }
// ô đất mà phím E sẽ tác động (trồng / tưới / thu): lấy từ đích tương tác gần nhất
function plotTarget(){ const x=PROMPT_AT; if(!x||x.type!=='plot'||TASK) return null; const d=(x.id[0]==='k'?SD.FARM.plots:SD.DALAT.plots)[+x.id.slice(1)]; return d?{X:Math.round((d.x-.5)*T),Y:Math.round((d.y-.5)*T)}:null; }
function drawOverlay(){ ug.setTransform(DPR,0,0,DPR,0,0); ug.clearRect(0,0,innerWidth,innerHeight); ug.font='16px VT323, monospace'; ug.textAlign='center'; ug.textBaseline='bottom';
  const sx=x=>(x-cam.x)*SCALE, sy=y=>(y-cam.y)*SCALE, t=performance.now(); keyHint();
  const tag=(x,y,name,sub,col)=>{ const w=ug.measureText(name).width+8; ug.fillStyle='rgba(28,22,30,.72)'; ug.fillRect(x-w/2,y-16,w,16); ug.fillStyle=col||'#fff3d6'; ug.fillText(name,x,y-1); if(sub){ ug.fillStyle='#ffd84a'; ug.fillText(sub,x,y-17); } };
  if(window.MAPX&&MAPX.overlay){ ug.save(); MAPX.overlay(ug,sx,sy,tag); ug.restore(); }   // nhãn của các module (Lính Cát hoang...) vẽ nét ở lớp giao diện
  const bubble=(x,y,text)=>{ const lines=wrap(text,26), w=Math.max(...lines.map(l=>ug.measureText(l).width))+14, h=lines.length*15+8, X=x-w/2, Y=y-h-6;
    ug.fillStyle='#1c1516'; ug.fillRect(X-2,Y-2,w+4,h+4); ug.fillStyle='#fbfaf6'; ug.fillRect(X,Y,w,h); ug.fillRect(x-3,Y+h,6,4); ug.fillStyle='#1c1516'; lines.forEach((l,i)=>ug.fillText(l,x,Y+15+i*15)); };
  for(const r of REM.values()){ if(!r.av||(r.fl&SD.FL.incar)) continue; const X=sx(r.x), Y=sy(r.y-46); if(X<-60||Y<-40||X>innerWidth+60||Y>innerHeight+40) continue;
    tag(X,Y,r.name+' · '+r.lv,r.tag,r.tag?'#9fe0ff':'#fff3d6'); if(r.rk){ if(r.rk<=3) drawFlame(X,Y-(r.tag?36:20)-15,r.rk,t); drawTitle(X,Y-(r.tag?36:20),r.rk,t); } if(r.chat&&t<r.chat.until) bubble(X,Y-(r.rk?38:18),r.chat.m); }
  if(MYRANK&&P.av&&!P.incar){ if(MYRANK<=3) drawFlame(sx(P.x),sy(P.y-46)-19,MYRANK,t); drawTitle(sx(P.x),sy(P.y-46)-4,MYRANK,t); }
  if(P.av&&P.chat&&t<P.chat.until) bubble(sx(P.x),sy(P.y-46)-2,P.chat.m);
  for(const n of npcs) if(Math.hypot(n.x-P.x,n.y-P.y)<90){ const L=SD.NPC_LOOKS[n.id], ty=sy(n.y-(STORY[n.id]&&n._mk?57:46)); tag(sx(n.x),ty,STORY[n.id]?speakerName(n.id).split(' (')[0]:L.name,'',STORY[n.id]?'#7fe0ff':'#ffd84a'); if(L&&L.title) drawTitle(sx(n.x),ty-20,0,t,L.title); }   // NPC cốt truyện (Pháp...) cũng có tên, màu xanh cho dễ nhận   // NPC có danh hiệu (Giáo chủ...)
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
  if(HERD&&HERD.phase==='go'&&S.kind==='dalat'&&!(TASK&&TASK.act==='herd')){ const z=SD.DALAT.pasture, x0=sx(z.x0*T), y0=sy(z.y0*T), x1=sx((z.x1+1)*T), y1=sy((z.y1+1)*T), pul=.5+Math.sin(t/220)*.3;   // ngựa chưa ăn cỏ: viền + mũi tên dẫn tới đồng cỏ
    ug.strokeStyle=`rgba(255,216,74,${pul})`; ug.lineWidth=3; ug.setLineDash([10,6]); ug.strokeRect(x0,y0,x1-x0,y1-y0); ug.setLineDash([]);
    if(!inPasture()){ const cx=((z.x0+z.x1+1)/2)*T, cy=((z.y0+z.y1+1)/2)*T, an=Math.atan2(cy-P.y,cx-P.x), X=sx(P.x)+Math.cos(an)*70, Y=sy(P.y-20)+Math.sin(an)*70;
      ug.save(); ug.translate(X,Y); ug.rotate(an); ug.fillStyle='#ffd84a'; ug.strokeStyle='#1c1516'; ug.lineWidth=2; ug.beginPath(); ug.moveTo(16,0); ug.lineTo(-8,-11); ug.lineTo(-3,0); ug.lineTo(-8,11); ug.closePath(); ug.fill(); ug.stroke(); ug.restore();
      ug.font='14px VT323, monospace'; tag(X,Y-14,`🐎 Đồng cỏ ${Math.round(Math.hypot(cx-P.x,cy-P.y)/T)}m`,'','#ffd84a'); } }
  if(S.kind==='pickle'&&PK&&PK.st!=='idle'){ const X=innerWidth/2, Y=34, nm=i=>PK.seats[i]?PK.seats[i].name:'trống';   // bảng điểm pickleball gọn ở trên cùng
    ug.fillStyle='rgba(28,21,22,.82)'; ug.fillRect(X-200,Y-22,400,44); ug.textAlign='center'; ug.font='24px VT323, monospace';
    ug.fillStyle='#ff6a55'; ug.fillText('A  '+PK.score[0],X-46,Y); ug.fillStyle='#fff3d6'; ug.fillText('–',X,Y); ug.fillStyle='#7fe0ff'; ug.fillText(PK.score[1]+'  B',X+46,Y);
    ug.font='14px VT323, monospace'; ug.fillStyle='#ffd84a'; ug.fillText(PK.st==='lobby'?'Chờ vào sân · bấm "Bắt đầu" (thiếu người thì thuê bot)':PK.log||`${nm(0)} · ${nm(1)}  vs  ${nm(2)} · ${nm(3)}`,X,Y+16);
    const b=PK.ball; if(PK.st==='play'&&b&&PK.me>=0&&(PK.me<2?0:1)===b.team){ ug.font='22px VT323, monospace'; ug.fillStyle='#ffd84a'; ug.fillText('Bóng sang sân bạn! Chạy vào vòng vàng, bấm J / K / L đúng lúc',X,Y+42); }
    if(PKJUDGE&&performance.now()-PKJUDGE.t<800){ ug.font='34px VT323, monospace'; ug.fillStyle=PKJUDGE.ok?'#7de07a':'#ff6a55'; ug.fillText(PKJUDGE.ok?'CHUẨN!':{xa:'XA QUÁ',sớm:'SỚM QUÁ',muộn:'MUỘN RỒI'}[PKJUDGE.why]||'TRƯỢT',sx(P.x),sy(P.y-60)); } }
  for(const t of SAYS){ const X=sx(t.x), Y=sy(t.y); if(X<-90||Y<-60||X>innerWidth+90||Y>innerHeight+60) continue;   // tên NPC đi lại + bong bóng thoại (vẽ ở lớp giao diện cho chữ không bị phóng to)
    if(t.name){ ug.font='14px VT323, monospace'; tag(X,Y,t.name,'','#ffd84a'); }
    if(t.text){ ug.font='18px VT323, monospace'; const w=ug.measureText(t.text).width+14, by=Y-(t.name?22:4); ug.fillStyle='#fff3d6'; ug.fillRect(X-w/2,by-20,w,20); ug.fillStyle='#1c1516'; ug.fillRect(X-w/2,by,w,2); ug.fillRect(X-3,by,6,4); ug.fillText(t.text,X,by-5); } }
  for(const t of ANITAGS){ if(Math.hypot(t.x-P.x,t.y-P.y)>150) continue; ug.font='14px VT323, monospace'; tag(sx(t.x),sy(t.y),t.car?'🚗 Xe của Chika Phú':t.pet?`🐾 ${t.pet}`:t.dog?`${t.dog} của ${t.n}`:`${ANI_NAME[t.k]||''} của ${t.n}`,'',t.me?'#ffd84a':'#fff3d6'); } ug.font='16px VT323, monospace';
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
// HUD vẽ lại mỗi giây: chỉ gán innerHTML khi nội dung đổi. Gán lại y nguyên vẫn bắt trình duyệt dựng lại DOM, giải mã lại icon túi đồ (giật ~15ms mỗi giây)
const hudEl=sel=>{ const el=$(sel); return {set innerHTML(h){ if(el.__h!==h){ el.__h=h; el.innerHTML=h; } }}; };
// phần màn bị HUD che ở 4 phía (đơn vị pixel art), đo lại mỗi giây cùng HUD; camera dùng để chừa chỗ ở mép map
let HUDPAD={l:0,r:0,t:0,b:0};
function measureHudPad(){ const vis=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',   /* HUD là position:fixed nên offsetParent luôn null, không dùng được */ R=sel=>{ const e=$(sel); return vis(e)?e.getBoundingClientRect():null; };
  const q=R('#hudQuests'), c=R('#chatBox'), hr=R('#hudRight'), nav=R('#hudNav'), bot=R('#hudBottom'), W=innerWidth, H=innerHeight;
  const l=Math.max(q?q.right:0,c&&c.left<W/3?c.right:0), r=Math.max(hr?W-hr.left:0,nav?W-nav.left:0), b=bot?H-bot.top:0;
  // chừa 55% bề rộng HUD: đủ để vật ở góc lộ ra mà không để trống mép map quá nhiều
  HUDPAD={l:Math.min(VW*.3,l*.55/SCALE),r:Math.min(VW*.3,r*.55/SCALE),t:0,b:Math.min(VH*.25,b*.6/SCALE)}; }
function renderHUD(){ if(!G) return; measureHudPad(); const t=vn(), d=SD.WEEKDAYS[t.wd];
  $('#hudDay').textContent=d; $('#hudTime').textContent=`${String(t.h).padStart(2,'0')}:${String(t.m).padStart(2,'0')}`;
  if(window.AMB&&AMB.W&&S){ const w=AMB.W, el=$('#hudWx'); if(el.textContent!==w.icon) el.textContent=w.icon; el.title=w.name+(S.map.indoor?' (ngoài trời)':''); }
  $('#hudMoney').textContent=fmt(G.money);
  // tiền đổi: số +/− bay ra ngay dưới ô tiền (thấy được cả khi đang mở bảng shop / Grab che mất nhân vật)
  if(HUD_MONEY!==null&&G.money!==HUD_MONEY){ const dm=G.money-HUD_MONEY, e=document.createElement('span'); e.className='mdelta '+(dm>0?'up':'down'); e.textContent=(dm>0?'+':'−')+fmt(Math.abs(dm)); $('#hudMoneyBox').appendChild(e); setTimeout(()=>e.remove(),1600); }
  HUD_MONEY=G.money;
  const L=SD.RULES.levels, lo=L[G.level-1]||0, hi=L[G.level]||lo+1; $('#hudLevel').textContent='Cấp '+G.level+' · '+G.name; $('#hudLevel').title=G.name; $('#hudLvlBox').dataset.know='📚 Hiểu biết '+((G.stats||{}).know||0);
  const max=G.level>=SD.RULES.maxLevel; $('#hudExp').style.width=(max?100:Math.min(100,(G.exp-lo)/(hi-lo)*100))+'%'; $('#hudExpTxt').textContent=max?`MAX · ${fmt(G.exp).replace('đ','')} EXP`:`${G.exp}/${hi} EXP`;
  needsCheck(G.needs);
  const n=G.needs; for(const [k,id] of [['energy','#barEnergy'],['clean','#barClean'],['battery','#barBattery']]){ const v=Math.round(n[k]); $(id).style.width=v+'%'; $(id).classList.toggle('low',v<20); $(id+'T').textContent=v; }
  if(TOUCH){ let low=false; for(const [k,id] of [['energy','#mbE'],['clean','#mbC'],['battery','#mbB']]){ const v=Math.round(n[k]); $(id).style.height=Math.max(6,v)+'%'; $(id).classList.toggle('low',v<20); if(v<20) low=true; } $('#mLv').textContent='Cấp '+G.level; $('#mStat').classList.toggle('warn',low); }
  const ms=SD.mealStatus(G.meals,NET.now()); const MICO={eaten:'✓',missed:'✗',now:'●'}, MTIP={eaten:'đã ăn',missed:'bỏ bữa',now:'đang tới giờ ăn'};
  hudEl('#hudMeals').innerHTML=`<span class="mealLbl">Bữa</span>`+ms.map(m=>`<span class="meal ${m.st}" title="${m.name} ${m.from}:00–${m.to}:00${MTIP[m.st]?' · '+MTIP[m.st]:''}">${MICO[m.st]?MICO[m.st]+' ':''}${m.name.replace('Bữa ','')}</span>`).join('');
  const h=SD.hunger(G.meals,NET.now()), bf=[]; if(h) bf.push(`<span class="bad">Đói: -${Math.round((1-SD.RULES.hungrySpeed[h])*100)}% tốc độ, -${Math.round((1-SD.RULES.hungryExp[h])*100)}% EXP</span>`);
  if(n.energy<20) bf.push('<span class="bad">Mệt: chậm hơn</span>'); if(n.clean<20) bf.push('<span class="bad">Bẩn: -15% EXP</span>');
  for(const b of [G.buff,G.rbuff,G.lbuff,G.mbuff,G.sbuff]) if(b&&b.until>NET.now()) bf.push(`<span class="good">+${Math.round((b.mul-1)*100)}% EXP · ${Math.ceil((b.until-NET.now())/60000)}'</span>`);
  if(G.data&&G.data.until>NET.now()) bf.push('<span class="good">📶 4G: pin hao chậm</span>');
  // ưu đãi học viên DAS / nhân viên Bearplus, Lumen, Everfit: mua đồ giảm 20% (server tính, perks.js)
  { const at=[]; if(G.das&&((G.das.certs||[]).length||Object.keys(G.das.c||{}).length)) at.push('DAS'); if(G.quests.bp_brief==='done') at.push('Bearplus'); if(G.lumen&&G.lumen.hired) at.push('Lumen'); if(G.extra&&G.extra.job&&G.extra.job.hired) at.push('Everfit');
    if(at.length) bf.push(`<span class="good" title="Ưu đãi ${at.join(', ')}">🎓 -20% mua đồ</span>`); }
  if(window.HSUI){ const c=window.HSUI.chip(); if(c) bf.push(c); }   /* bậc hảo sảng */
  hudEl('#hudBuffs').innerHTML=bf.join('');
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
  if(P.kayak){ const tr=G.daily.treasure||0, left=Math.max(0,Math.ceil(((G.kayakUntil||0)-NET.now())/60000));   // đang chèo: phao, đồ cổ mò được hôm nay, giờ thuê còn lại
    li.push(`<li><b>Chèo kayak</b><span>Phao ${Object.keys(G.daily.buoys||{}).length}/${SD.BUOYS.length} · đồ cổ ${Math.min(tr,SD.TREASURE.daily)}/${SD.TREASURE.daily}${tr>=SD.TREASURE.daily?' (đủ hôm nay)':' · cứ chèo là có thể vớt được'} · còn ${left} phút</span></li>`); }
  { const sc=G.lumen&&G.lumen.scholar; if(sc&&!sc.done){ const n=((G.das||{}).certs||[]).length, ok=n>=SD.LUMEN.needCerts;   // học bổng Lumen của Annie
    li.push(`<li class="${ok?'ready':''}"><b>Học bổng Lumen <button class="qgo" type="button" data-go="lumenscholar" title="Tự đi tới">➜</button></b><span>${ok?'Đủ chứng chỉ, về Lumen gặp Annie nhận việc':`Học ở DAS: ${n}/${SD.LUMEN.needCerts} chứng chỉ · còn ${sc.free} khoá miễn phí, ${sc.half} khoá −50%`}</span></li>`); } }
  if(HERD) li.push(`<li class="${HERD.phase==='go'?'':'ready'}"><b>Chăn ngựa <button class="qgo" type="button" data-go="herd" title="Tự đi tới">➜</button></b><span>${HERD.phase==='go'?(TASK&&TASK.act==='herd'?'Ngựa đang gặm cỏ, đứng yên trong đồng cỏ':'🐎 Ngựa chưa ăn cỏ: dắt ra đồng cỏ phía Đông Bắc (theo mũi tên vàng)'):'Ngựa no rồi, dắt về chuồng anh Phong'}</span></li>`);
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
  hudEl('#hudQuests').innerHTML=`<h4><span>Việc cần làm <small class="qcount" title="Đã xong ${done} / ${Object.keys(Q).length} việc">✓ ${done}/${Object.keys(Q).length}</small></span><span class="qbtns"><button id="qAuto" class="${window.AUTOQ&&AUTOQ.on?'on':''}" type="button" title="Tự động làm nhiệm vụ">🤖 Auto</button><button id="qToggle" type="button" aria-label="Thu gọn bảng việc">${document.body.classList.contains('qmin')?'▸':'▾'}</button></span></h4><ul>${li.join('')}</ul>${farm}`;
  const inv=Object.entries(G.items); hudEl('#hudItems').innerHTML=[...Array(8)].map((_,i)=>{ const it=inv[i]; if(!it) return '<div class="slot"></div>';
    return `<div class="slot" title="${SD.ITEMS[it[0]]?SD.ITEMS[it[0]].name:it[0]}"><img src="${icon64(it[0])}" alt="">${it[1]>1?`<i>${it[1]}</i>`:''}</div>`; }).join('')+`<button class="slot more" id="btnBag" title="Túi đồ (I)">I<br>túi</button>`+(window.LEGUI?window.LEGUI.slots():'');   /* 3 ô item huyền thoại */
  const hot=Object.entries(SD.SKILLS).filter(([k,s])=>G.skills[k]&&s.key!=='E'&&s.key!=='-'), learned=Object.entries(SD.SKILLS).filter(([k,s])=>G.skills[k]&&(s.key==='E'||s.key==='-'));
  hudEl('#hudSkills').innerHTML=hot.map(([k,s])=>`<div class="sk" title="${s.name}: ${s.desc}"><kbd>${s.key}</kbd><span>${s.name}</span></div>`).join('');   // kỹ năng học được (dùng E) xem trong menu Esc / túi đồ
  $('#hudOnline').textContent=REM.size?`${REM.size} người quanh đây`:'';
  $('#btnHome').hidden=!(G.stay&&G.stay.paid===t.day)||(S&&S.kind==='stay'&&S.own); }
const ICO={}; function icon64(k){ return ICO[k]||(ICO[k]=A.icon(SD.ITEMS[k]?SD.ITEMS[k].icon:k,3).toDataURL()); }
document.addEventListener('click',e=>{ if(e.target.closest('#btnBag')) UI.bag(); });

/* ---------- minimap + bản đồ ---------- */
// dấu tích xanh trong ô vuông viền đen (phòng đã thuê)
function tick(g,X,Y,small){ const r=small?4:5; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=small?'#4fbf5a':'#7de07a'; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2);
  g.fillStyle='#1c1516'; const x=Math.round(X-3), y=Math.round(Y); g.fillRect(x,y,2,2); g.fillRect(x+2,y+1,1,2); g.fillRect(x+3,y-1,1,2); g.fillRect(x+4,y-2,1,2); g.fillRect(x+5,y-3,1,2); }
const MINI_COL={q:'#eef0ee',k:'#23263a',w:'#946542',o:'#2a6eb0',p:'#8fc4c8',m:'#f2f2ef',y:'#ffd400',M:'#b84a3a',Z:'#e2c9a2',I:'#e9f0f2',O:'#a7744c',H:'#5a4a40',U:'#a9a49a',J:'#c9a35e',A:'#4fa84a',n:'#2a2236',g:'#9fc7d9',G:'#79b34a',F:'#3f7a31',P:'#d6c39b',T:'#d6c39b',S:'#cbc6ba',R:'#55555c',D:'#e3d2a2',W:'#3b8ed3',K:'#a26c40',L:'#43c5e3',E:'#e6e0d2',X:'#8d8880',C:'#c9a877',Q:'#a26c40',B:'#b0643c',Y:'#8a5a3a','<':'#55a43e','>':'#4a9636','$':'#8a3a3a','|':'#5a5a64','9':'#b8ad9a'};
let miniBase=null; const MINI_MU={'9':'#b8ad9a','0':'#3a3036','%':'#4e425e','&':'#7a6650','~':'#5ab4d8','+':'#3a4a6a','*':'#6ab84a','=':'#3a2e44'};   // map MU: đá lát, tường thành, nghĩa địa, bãi phế liệu
const hasMini=()=>S&&(S.kind==='retreat'||S.kind==='dalat'||S.kind==='mu'||S.kind==='muw'||S.kind==='dday');
// zoom minimap: số ô ngang hiển thị (ít ô = phóng to); nút +/− và lăn chuột trên minimap, nhớ mức zoom trên máy
const MINI_TW=[16,24,40,64,100,150]; let miniZ=2; try{ const z=+localStorage.getItem('chande-minizoom'); if(z>=0&&z<MINI_TW.length) miniZ=z; }catch(e){}
function miniZoom(d){ miniZ=Math.max(0,Math.min(MINI_TW.length-1,miniZ-d)); try{ localStorage.setItem('chande-minizoom',miniZ); }catch(e){}
  $('#miniIn').disabled=miniZ===0; $('#miniOut').disabled=miniZ===MINI_TW.length-1; }
function buildMini(){ const m=S.map, c=A.cv(S.W,S.H), g=c.getContext('2d'), col=S.kind==='mu'||S.kind==='muw'||S.kind==='dday'?{...MINI_COL,...MINI_MU}:MINI_COL; for(let y=0;y<S.H;y++) for(let x=0;x<S.W;x++){ g.fillStyle=col[m.grid[y][x]]||'#3f7a31'; g.fillRect(x,y,1,1); } miniBase=c; }
if(window.ResizeObserver) new ResizeObserver(()=>{ const h=$('#minimap').offsetHeight; if(h) document.documentElement.style.setProperty('--miniH',h+'px'); }).observe($('#minimap'));   // nút Tủ đồ/Xếp hạng luôn nằm ngay trên minimap dù minimap cao thêm
function drawMini(){ const box=$('#minimap'); if(!hasMini()){ box.hidden=true; document.body.classList.add('nomini'); return; } box.hidden=false; document.body.classList.remove('nomini'); if(!miniBase) buildMini();
  const c=$('#miniCv'), g=c.getContext('2d'), TW=Math.min(MINI_TW[miniZ],S.W,S.H*c.width/c.height), TH=TW*c.height/c.width, k=c.width/TW, sx=Math.max(0,Math.min(S.W-TW,P.x/T-TW/2)), sy=Math.max(0,Math.min(S.H-TH,P.y/T-TH/2));
  g.imageSmoothingEnabled=false; g.drawImage(miniBase,sx,sy,TW,TH,0,0,c.width,c.height);
  const dot=(x,y,col,r=2)=>{ const X=(x/T-sx)*k, Y=(y/T-sy)*k; if(X<-3||Y<-3||X>c.width+3||Y>c.height+3) return; g.fillStyle='#1c1516'; g.fillRect(Math.round(X-r-1),Math.round(Y-r-1),r*2+2,r*2+2); g.fillStyle=col; g.fillRect(Math.round(X-r),Math.round(Y-r),r*2,r*2); };
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea');
  const EDGE=[]; for(const r of REM.values()){ const X=(r.x/T-sx)*k, Y=(r.y/T-sy)*k; if(X>=0&&Y>=0&&X<=c.width&&Y<=c.height){ g.strokeStyle='#7fe0ff'; g.globalAlpha=.4+.4*Math.abs(Math.sin(clock*3)); g.lineWidth=1; g.beginPath(); g.arc(Math.round(X),Math.round(Y),5,0,7); g.stroke(); g.globalAlpha=1; dot(r.x,r.y,'#7fe0ff',3); continue; }   /* người chơi khác: chấm to + vòng nhấp nháy */
    const cx=Math.max(5,Math.min(c.width-5,X)), cy=Math.max(5,Math.min(c.height-5,Y)), a=Math.atan2(Y-c.height/2,X-c.width/2); g.save(); g.translate(cx,cy); g.rotate(a); g.fillStyle='#1c1516'; g.beginPath(); g.moveTo(6,0); g.lineTo(-5,-5); g.lineTo(-5,5); g.closePath(); g.fill(); g.fillStyle='#7fe0ff'; g.beginPath(); g.moveTo(4,0); g.lineTo(-3.5,-3); g.lineTo(-3.5,3); g.closePath(); g.fill(); g.restore(); if(r.name) EDGE.push([cx,cy,r.name]); }   /* ngoài khung: mũi tên ở mép chỉ hướng + tên */
  g.font='10px VT323, monospace'; for(const [cx,cy,nm] of EDGE){ const t=nm.length>9?nm.slice(0,8)+'…':nm, w=g.measureText(t).width+4, X=Math.max(w/2+1,Math.min(c.width-w/2-1,cx-Math.sign(cx-c.width/2)*(w/2+5))), Y=Math.max(10,Math.min(c.height-2,cy+3));
    g.fillStyle='rgba(16,40,56,.85)'; g.fillRect(Math.round(X-w/2),Math.round(Y-8),Math.ceil(w),9); g.fillStyle='#7fe0ff'; g.textAlign='center'; g.fillText(t,Math.round(X),Math.round(Y)); }
  for(const s of khogaHere()) dot(s.x*T,s.y*T,'#ff9f2e',1); for(const s of pumpkinsHere()) dot(s.x*T,s.y*T,'#ff7a1a',1); if(S.kind==='retreat'&&MCKB) dot(MCKB.x*T,MCKB.y*T,'#c070ff',3);
  if(window.MAPX&&MAPX.mini) MAPX.mini(dot,S.kind);   /* chấm riêng của từng map (boss MU...) */
  if(S.kind==='retreat'&&WDINO) dot(WDINO.x*T,WDINO.y*T,'#b6ff3a',2); if(S.kind==='retreat'&&WCROC&&!WCROC.dive) dot(WCROC.x*T,WCROC.y*T,'#3a6a2a',1);
  // người chơi ở gần (trong khung minimap): hiện tên nhỏ trên chấm
  g.font='10px VT323, monospace'; g.textAlign='center'; for(const r of REM.values()){ if(!r.name) continue; const X=(r.x/T-sx)*k, Y=(r.y/T-sy)*k; if(X<0||Y<8||X>c.width||Y>c.height) continue;
    const w=g.measureText(r.name).width+4; g.fillStyle='rgba(28,21,22,.8)'; g.fillRect(Math.round(X-w/2),Math.round(Y-12),Math.ceil(w),9); g.fillStyle='#7fe0ff'; g.fillText(r.name,Math.round(X),Math.round(Y-4)); }
  // dấu tích phòng đã thuê; nằm ngoài khung thì ghim ở mép chỉ hướng
  if(S.kind==='retreat'&&G.stay&&G.stay.paid===vn().day){ const [dx_,dy_]=SD.ROOMS[G.stay.room].doors[0]; let X=(dx_-sx)*k, Y=(dy_-sy)*k; const out=X<4||Y<4||X>c.width-4||Y>c.height-4;
    X=Math.max(5,Math.min(c.width-5,X)); Y=Math.max(5,Math.min(c.height-5,Y)); tick(g,X,Y,out); }
  if(Math.floor(clock*3)%3) dot(P.x,P.y,'#ff4a3d',2);
  $('#miniZone').textContent=zoneName||S.map.name; miniWho(); }
// danh sách người ở map khác dưới minimap (hỏi server vài giây 1 lần)
let WHO=[], whoAt=0, whoHtml='';
function miniWho(){ const t=performance.now(); if(t-whoAt>6000){ whoAt=t; NET.req({t:'who'}).then(r=>{ WHO=r.list||[]; }).catch(()=>{}); }
  const far=WHO.filter(w=>w.id!==NET.pid&&!REM.has(w.id)), html=far.length?far.slice(0,5).map(w=>`<div>• ${esc(w.n)} <span>${esc((w.where||'').split(' (')[0])}</span></div>`).join('')+(far.length>5?`<div>+${far.length-5} người nữa</div>`:''):'';
  if(html!==whoHtml){ whoHtml=html; $('#miniWho').innerHTML=html; } }
$('#minimap').addEventListener('click',()=>toggleMap());
$('#miniIn').addEventListener('click',e=>{ e.stopPropagation(); miniZoom(1); }); $('#miniOut').addEventListener('click',e=>{ e.stopPropagation(); miniZoom(-1); });
$('#miniCv').addEventListener('wheel',e=>{ e.preventDefault(); miniZoom(e.deltaY<0?1:-1); },{passive:false}); miniZoom(0);
$('#mapClose').addEventListener('click',()=>{ $('#mapView').hidden=true; });
$('#mapView').addEventListener('click',e=>{ if(e.target.id==='mapView') $('#mapView').hidden=true; });   // bấm ra ngoài cũng đóng
let MAPHIT=[], MAPHOV='';
$('#mapCv').addEventListener('mousemove',e=>{ const rc=e.target.getBoundingClientRect(), x=(e.clientX-rc.left)*e.target.width/rc.width, y=(e.clientY-rc.top)*e.target.height/rc.height, h=MAPHIT.find(m=>x>=m.x0&&x<=m.x1&&y>=m.y0&&y<=m.y1);
  const n=h?h.name:''; e.target.style.cursor=h?'pointer':''; e.target.title=h?'Bấm để tự đi tới '+h.name:''; if(n!==MAPHOV){ MAPHOV=n; drawMap(); } });
$('#mapCv').addEventListener('click',e=>{ const h=MAPHIT.find(m=>m.name===MAPHOV); if(!h) return; e.stopPropagation(); $('#mapView').hidden=true; MAPHOV=''; walkTo(h.tx,h.ty,h.name); });
// chuột phải bất kỳ chỗ nào trên bản đồ lớn: tự đi tới đó (có mũi tên đích như ngoài màn chơi)
$('#mapCv').addEventListener('contextmenu',e=>{ e.preventDefault(); e.stopPropagation(); const c=e.target, rc=c.getBoundingClientRect(), k=c.width/(S.W*T), wx=(e.clientX-rc.left)*c.width/rc.width/k, wy=(e.clientY-rc.top)*c.height/rc.height/k;
  $('#mapView').hidden=true; MAPHOV=''; DEST={x:wx,y:wy,t:performance.now()}; walkTo(wx/T,wy/T,'chỗ đã chọn'); });
function toggleMap(){ const v=$('#mapView'); if(!hasMini()){ toast('🗺 Chỗ này không có bản đồ. Bản đồ (M) dùng được ở Ké Retreat, nông trại Đà Lạt và MU Online','quest'); return; } v.hidden=!v.hidden; if(!v.hidden) drawMap(); }
// chỗ cần tới của các việc đang làm (cùng cảnh), để ghim lên bản đồ M. Chỉ tính, không đi: các loại đơn giản như nút ➜ (questGo)
function questPins(){ if(!S||!G) return []; const out=[], npcAt=id=>{ const n=npcs.find(x=>x.id===id); return n?{x:n.x/T,y:n.y/T}:null; },
    near=list=>list.sort((a,b)=>Math.hypot(a.x*T-P.x,a.y*T-P.y)-Math.hypot(b.x*T-P.x,b.y*T-P.y))[0], ret=S.kind==='retreat', fl=G.flags||{};
  if(ret&&!fl.hello){ const p=npcAt('phap'); if(p) out.push({...p,label:'Tìm Pháp'}); }
  for(const id of Object.keys(Q).filter(q=>G.quests[q]==='active')){ const q=Q[id]; let t=null;
    try{ if(canFinish(id)) t=npcAt(q.giver);
      else if(ret&&q.spots) t=near(SD.SPOTS.filter(s=>q.spots.includes(s.id)&&!(fl.spots||{})[s.id]));
      else if(ret&&q.need) t=near(SD.PICKUPS.map((p,i)=>({...p,i})).filter(p=>p.quest===id&&!(fl.picked||{})[p.i])); }catch(e){ t=null; }
    if(t) out.push({x:t.x,y:t.y,label:q.title}); }
  return out.slice(0,4); }
function drawMap(){ const c=$('#mapCv'), g=c.getContext('2d'), m=S.map, ret=S.kind==='retreat', sx=0, sy=0, sw=S.W*T, sh=S.H*T, k=Math.min((innerHeight*.8)/sh,(innerWidth*.94)/sw);   // cả map (Ké + thị trấn + vườn quốc gia + làng)
  c.width=Math.round(sw*k); c.height=Math.round(sh*k); g.imageSmoothingEnabled=false; if(!miniBase) buildMini(); g.drawImage(miniBase,sx/T,sy/T,sw/T,sh/T,0,0,c.width,c.height);
  g.fillStyle='rgba(30,60,30,.3)'; g.fillRect(0,0,c.width,c.height);
  for(const o of S.objs) if(o.house){ const s=o.spr; g.drawImage(s.c,(o.x-s.ax-sx)*k,(o.y-s.ay-sy)*k,s.c.width*k,s.c.height*k); }
  g.font=`${Math.max(13,Math.min(20,Math.round(13*k*2.4)))}px VT323, monospace`; g.textAlign='center';
  MAPHIT=[]; const doors=[...Object.values(SD.PLACES).filter(p=>p.door&&(p.map||'retreat')===S.kind).map(p=>p.door),...(ret?Object.values(SD.ROOMS).flatMap(r=>(r.doors||[]).map(([x,y])=>({x,y}))):[])];
  const fs=Math.max(13,Math.min(20,Math.round(13*k*2.4)));
  const PLACED=[], hitAny=r=>PLACED.some(q=>r.x0<q.x1&&r.x1>q.x0&&r.y0<q.y1&&r.y1>q.y0);
  for(const dz of m.districts||[]){ const x=(dz.x*T-sx)*k, y=(dz.y*T-sy)*k, f=Math.max(22,Math.min(40,Math.round(22*k*2.2))); g.font=`${f}px VT323, monospace`; g.lineWidth=4; g.strokeStyle='rgba(28,21,22,.85)'; g.strokeText(dz.name,x,y); g.fillStyle='#ffe066'; g.fillText(dz.name,x,y);
    const w=g.measureText(dz.name).width; PLACED.push({x0:x-w/2,x1:x+w/2,y0:y-f*.8,y1:y+f*.2}); }   // tên khu to
  g.font=`${Math.max(13,Math.min(20,Math.round(13*k*2.4)))}px VT323, monospace`;
  const dot=(x,y,col,r=4)=>{ g.fillStyle='#1c1516'; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r+1.5,0,7); g.fill(); g.fillStyle=col; g.beginPath(); g.arc((x-sx)*k,(y-sy)*k,r,0,7); g.fill(); };
  // chấm người vẽ trước nhãn để nhãn không bị chấm đè mất chữ
  for(const n of npcs) dot(n.x,n.y,STORY[n.id]?'#ffd84a':'#f4f1ea',3); for(const r of REM.values()) dot(r.x,r.y,'#7fe0ff',3); if(ret&&WDINO) dot(WDINO.x*T,WDINO.y*T,'#b6ff3a',5);
  // ghim việc cần làm: ô cam có dấu "!" ở chỗ phải tới (gặp người giao, chỗ chụp ảnh, đồ cần nhặt) + tên việc.
  // đặt trước các nhãn khác để nhãn khác phải né nó; tên việc thử bên phải, bên trái rồi phía trên
  const pins=questPins(); g.font=`${Math.max(12,fs-2)}px VT323, monospace`;
  for(const q of pins){ const X=Math.round((q.x*T-sx)*k), Y=Math.round((q.y*T-sy)*k), tw=g.measureText(q.label).width+8;
    g.fillStyle='#1c1516'; g.fillRect(X-8,Y-26,16,18); g.fillRect(X-2,Y-9,4,7); g.fillStyle='#ff9a3d'; g.fillRect(X-6,Y-24,12,14); g.fillRect(X-1,Y-10,2,6);
    g.fillStyle='#1c1516'; g.fillRect(X-1,Y-22,2,6); g.fillRect(X-1,Y-14,2,2); PLACED.push({x0:X-8,x1:X+8,y0:Y-26,y1:Y-2});
    const lx=[[X+10,Y-25],[X-10-tw,Y-25],[X-tw/2,Y-44]].find(([x,y])=>!hitAny({x0:x,x1:x+tw,y0:y,y1:y+15}))||[X+10,Y-25];
    PLACED.push({x0:lx[0],x1:lx[0]+tw,y0:lx[1],y1:lx[1]+15}); g.fillStyle='rgba(28,21,22,.88)'; g.fillRect(lx[0],lx[1],tw,15); g.fillStyle='#ffb46a'; g.textAlign='left'; g.fillText(q.label,lx[0]+4,lx[1]+12); g.textAlign='center'; }
  // nhãn: tên riêng (quán, nhà, chỗ làm việc) xếp trước, nhãn lặp kiểu "Nhà dân" xếp sau. Đè lên nhãn đã đặt thì thử dời xuống / lên / sang ngang,
  // vẫn đè thì ẩn (rê chuột vào chỗ đó vẫn hiện, bấm vẫn tự đi tới). Nhãn đang rê chuột vẽ sau cùng cho nằm trên
  const CNT={}; for(const l of m.labels||[]) CNT[l.name]=(CNT[l.name]||0)+1;
  const OFFS=[[0,0],[0,1],[0,-1],[0,2],[0,-2],[.55,0],[-.55,0],[.55,1],[-.55,1],[.55,-1],[-.55,-1]], HIDDEN=[]; let HOV=null;
  const drawLbl=(name,x,y,w,h,hov)=>{ g.font=`${hov?fs+4:fs}px VT323, monospace`; g.fillStyle=hov?'#ffd84a':'rgba(28,21,22,.8)'; g.fillRect(x-w/2,y-h+3,w,h); if(hov){ g.strokeStyle='#1c1516'; g.lineWidth=2; g.strokeRect(x-w/2,y-h+3,w,h); } g.fillStyle=hov?'#1c1516':'#fff3d6'; g.fillText(name,x,y); };
  for(const l of [...(m.labels||[])].sort((a,b)=>(CNT[a.name]>1)-(CNT[b.name]>1))){ const x0=(l.x*T-sx)*k, y0=(l.y*T-sy)*k-4, hov=MAPHOV===l.name; g.font=`${hov?fs+4:fs}px VT323, monospace`; const w=g.measureText(l.name).width+8, h=hov?19:15;
    const d=doors.map(o=>({o,d:Math.hypot(o.x-l.x,(o.y-l.y)*.6)})).filter(z=>z.d<6&&z.o.y>=l.y-1).sort((a,b)=>a.d-b.d)[0];   // nhà có cửa gần nhãn thì đi tới cửa
    let at=null; for(const [ox,oy] of OFFS){ const x=Math.max(w/2+2,Math.min(c.width-w/2-2,x0+ox*w)), y=y0+oy*(h+2);   /* sát mép thì kéo vào, không cắt chữ */ if(!hitAny({x0:x-w/2,x1:x+w/2,y0:y-h+3,y1:y+3})){ at=[x,y]; break; } }
    const hit=at?{x0:at[0]-w/2,y0:at[1]-h+3,x1:at[0]+w/2,y1:at[1]+3}:{x0:x0-w/2,y0:y0-h+3,x1:x0+w/2,y1:y0+3}, tgt={name:l.name,...hit,tx:d?d.o.x:l.x,ty:d?d.o.y+.6:l.y+1.5};
    if(hov){ HOV={l,x:at?at[0]:x0,y:at?at[1]:y0,w,h}; if(at) PLACED.push(hit); MAPHIT.push(tgt); continue; }
    if(!at){ HIDDEN.push(tgt); continue; } PLACED.push(hit); drawLbl(l.name,at[0],at[1],w,h,false); MAPHIT.push(tgt); }
  MAPHIT.push(...HIDDEN);   // nhãn bị ẩn vẫn bấm được, xét sau nhãn đang hiện
  g.font=`${fs}px VT323, monospace`;
  g.font=`${Math.max(12,fs-2)}px VT323, monospace`; for(const r of REM.values()){ if(!r.name) continue; const X=(r.x-sx)*k, Y=(r.y-sy)*k-8, w=g.measureText(r.name).width+6;   // tên người chơi khác trên bản đồ lớn
    g.fillStyle='rgba(16,40,56,.88)'; g.fillRect(X-w/2,Y-12,w,14); g.fillStyle='#7fe0ff'; g.fillText(r.name,X,Y-1); }
  g.font=`${fs}px VT323, monospace`;
  const stayOk=ret&&G.stay&&G.stay.paid===vn().day; if(stayOk) for(const [x,y] of SD.ROOMS[G.stay.room].doors){ const X=(x*T-sx)*k, Y=(y*T-sy)*k; g.save(); g.scale(2,2); tick(g,X/2,Y/2,false); g.restore(); }
  if(HOV){ drawLbl(HOV.l.name,HOV.x,HOV.y,HOV.w,HOV.h,true); g.font=`${fs}px VT323, monospace`; }
  dot(P.x,P.y,'#ff4a3d',5);
  $('#mapTitle').textContent=ret?'Ké Retreat':'Nông trại bác Trang';
  $('#mapLegend').innerHTML='<span><i style="background:#ff4a3d"></i>Bạn</span><span><i style="background:#ffd84a"></i>Cả hội</span><span><i style="background:#f4f1ea"></i>Chủ quán, chủ trại</span><span><i style="background:#7fe0ff"></i>Người chơi khác</span>'+(pins.length?'<span><i style="background:#ff9a3d;border-radius:0"></i>Việc cần làm</span>':'')+(document.body.classList.contains('touch')?'<span>Chạm tên chỗ để tự đi tới</span>':'<span>Bấm tên chỗ để tự đi tới · chuột phải: đi tới chỗ bất kỳ</span>')+
    (stayOk?`<span><i style="background:#7de07a;border-radius:0"></i>Phòng của bạn: ${SD.ROOMS[G.stay.room].name} (bấm B để tự đi về)</span>`:''); }

/* ---------- tin từ server ---------- */
NET.listen('me',m=>{ const old=G; G=m.p; window.CHANDE&&(CHANDE._g=G); if(old&&started) gainPops(old,G);
  const lk=JSON.stringify(G.look||{}); if(lk!==P.look&&G.look){ P.look=lk; P.av=AVATAR.build(G.look); delete PORTRAIT.me; }
  if(old&&old.level<G.level){ bigText(`LÊN CẤP ${G.level}!`); sfx('level_up',.6); }
  if(G.flags.phapForm==='cam') delete PORTRAIT.phap; renderHUD(); UI.refresh&&UI.refresh(); });
NET.listen('scene',m=>{ if(!started) return; enterScene(m); });
// có người gọi điện: nghe máy (nói chuyện) hoặc nghe rồi Grab tới chỗ người gọi
NET.listen('ring',m=>{ if(!started) return; const ring=sfx('phone_ring',.5); const opts=m.come?[`Nghe + Grab tới ${m.where.split(' (')[0]}${m.fare?' ('+fmt(m.fare)+')':''}`,'Nghe máy','Từ chối']:['Nghe máy','Từ chối'];
  ask(`📞 ${m.name} (${m.num}) đang gọi cho bạn${m.come?': "Qua đây chơi với tao đi!"':''}`,'me',opts,async i=>{ if(ring&&ring.pause) ring.pause(); const go=m.come&&i===0, talk=m.come?i===1:i===0; if(!go&&!talk) return; const r=await act({t:'pickup',go}); if(r&&!r.err&&r.msg) toast(esc(r.msg),'item'); }); });
NET.listen('sms',m=>{ sfx('blip',.5); });
// tin hạng đầu tiên sau khi vào game chỉ ghi nhận, không ăn mừng (không thì lần đăng nhập nào cũng hiện chữ to + toast danh hiệu)
let MYRANK=0, RK_SEEN=false; NET.listen('rk',m=>{ const up=RK_SEEN&&m.rk&&(!MYRANK||m.rk<MYRANK); RK_SEEN=true; MYRANK=m.rk||0; if(up&&started){ bigText(SD.TOP_TITLES[MYRANK-1].name.toUpperCase()); sfx('level_up',.6); toast(`🏆 Top ${MYRANK} đại gia: nhận danh hiệu <b>${SD.TOP_TITLES[MYRANK-1].name}</b>`,'item'); } });
// bảng Hằng ngày: điểm danh, việc hôm nay, sổ sưu tầm. Vào game lần đầu trong ngày thì tự mở trang điểm danh (kiểu game mobile)
let DQ=null, DQ_OPENED='';
function dqBadge(){ if(!DQ) return 0; let n=DQ.login&&!DQ.login.claimed?1:0; const L=DQ.dq.list; n+=L.filter(t=>t.ok&&!t.got).length; if(L.length&&L.every(t=>t.got)&&!DQ.dq.chest) n++;
  for(const [a,z] of Object.entries(SD.ALBUM)) if(!DQ.albumGot[a]&&z.items.every(k=>DQ.seen[k])) n++; return n; }
NET.listen('dq',m=>{ DQ=m; const n=dqBadge(); for(const id of ['#btnDaily','#mDaily']){ const b=$(id); b.classList.toggle('hot',n>0); b.dataset.n=n||''; }
  if(m.login&&!m.login.claimed&&DQ_OPENED!==m.dq.day){   /* hàng đợi tự chờ vào game xong (cả người mới: tin dq tới trước khi bắt đầu) */ DQ_OPENED=m.dq.day; UI.autoOpen('daily',()=>{ if(!TASK&&DQ&&DQ.login&&!DQ.login.claimed) UI.daily('login'); }); }
  if(UI.refresh) UI.refresh(); });
// đồ mới vào túi bật lên trên đầu như nhặt được (kiểu Stardew), tiền / EXP thì số bay lên
let HUD_MONEY=null;
function gainPops(o,n){ let d=0; const oi=o.items||{}, ni=n.items||{}; const got=[];
  for(const k in ni){ const g=(ni[k]||0)-(oi[k]||0); if(g>0&&SD.ITEMS[k]){ if(d<3){ fx.push({kind:'pop',icon:k,n:g,x:P.x,y:P.y-34,t:-d*.2,life:1.2}); d++; } got.push(`+${g} ${esc(SD.ITEMS[k].name)}`); } }
  if(got.length&&UI.isOpen()) toast('🎒 '+got.slice(0,3).join(' · ')+(got.length>3?' …':''),'item');   // đang mở bảng (mua ở shop) thì hình bay trên đầu bị che: báo bằng toast
  const dm=(n.money||0)-(o.money||0); if(Math.abs(dm)>=1000) fx.push({kind:'num',txt:(dm>0?'+':'-')+fmt(Math.abs(dm)),x:P.x,y:P.y-(d?58:44),t:-d*.15,life:1.3,col:dm>0?'#ffd84a':'#ff7a6a'});
  const de=(n.exp||0)-(o.exp||0); if(de>0&&n.level===o.level) fx.push({kind:'num',txt:'+'+de+' EXP',x:P.x,y:P.y-(d?58:44)-(Math.abs(dm)>=1000?14:0),t:-.12-d*.15,life:1.3,col:'#9cf0a0'}); }
NET.listen('pos',m=>{ P.x=m.x; P.y=m.y; if(m.ride) fadeOnly(''); });
NET.listen('nd',m=>{ if(G){ Object.assign(G.needs,m.n); renderHUD(); } });
NET.listen('pj',m=>{ const r=remote(m.id); r.name=m.n; r.lv=m.lv; r.tag=m.tag; r.bn=m.bn; r.rk=m.rk||0; const lk=JSON.stringify(m.l); if(lk!==r.look&&m.l){ r.look=lk; r.av=AVATAR.build(m.l); } });
NET.listen('s',m=>{ const tm=performance.now();
  for(const e of m.u){ const [id,x,y,f,v,a,ac,fl]=e, r=remote(id), last=r.buf[r.buf.length-1];
    if(last&&tm-last.tm>250) r.buf.push({...last,tm:tm-100});
    if(!last){ r.x=x; r.y=y; } r.buf.push({tm,x,y,f,v,a,act:ac,fl}); if(r.buf.length>8) r.buf.splice(0,r.buf.length-8); }
  for(const id of m.g) REM.delete(id); });
NET.listen('chat',m=>{ const who=m.id===NET.pid?P:REM.get(m.id); if(who) who.chat={m:m.m,until:performance.now()+5000}; if(m.w) return; UI.chatLog&&UI.chatLog((m.id===NET.pid?G.name:(who&&who.name)||'?'),m.m); });
// nhà riêng đổi bố cục / sàn tường / cấp (home.js): đang đứng trong nhà đó thì dựng lại ngay, giữ nguyên chỗ đứng
NET.listen('home',m=>{ if(m.mine) HOME_MINE=m.mine; if(!m.away&&S&&S.kind==='room'){ HOME_NOW=m.home; Object.assign(S,sceneData('room')); miniBase=null; } if(window.HOMEUI) window.HOMEUI.changed(m); });
NET.listen('rw',m=>{ if(m.msg) toast(esc(m.msg),'quest'); if(m.exp) toast(`<b>+${m.exp} EXP</b>`,'exp'); if(m.vnd){ toast(`<b>+${fmt(m.vnd)}</b>`,'vnd'); sfx('coin',.5); }
  if(m.items) for(const [k,n] of Object.entries(m.items)) toast(`Nhận: <b>${SD.ITEMS[k]?SD.ITEMS[k].name:k}</b>${n>1?' ×'+n:''}`,'item');
  if(m.skill){ const s=SD.SKILLS[m.skill]; setTimeout(()=>toast(`Mở khoá: <b>${s.name}</b> <kbd>${s.key}</kbd>`,'skill'),350); } });
NET.listen('note',m=>toast(esc(m.msg),m.kind||''));
NET.listen('task',m=>{ if(m.cancel){ TASK=null; toast('Đã dừng việc đang làm','lock'); return; }
  if(m.done){ TASK=null; if(m.msg) toast(esc(m.msg),'item'); if(m.act==='herd'&&HERD) HERD.phase='back'; return; }
  TASK={act:m.act,name:m.name,start:performance.now(),end:performance.now()+m.sec*1000,anim:{nghi:'sleep',tam:'shower',tiktok:'phone',songao:'phone',shisha:'shisha',work:'work',hoc:'work',cook:'cook',herd:'',swim:'swim'}[m.act]||'',walk:m.act==='herd'}; });
NET.listen('bite',()=>{ UI.fishBite&&UI.fishBite(); });
NET.listen('online',m=>{ $('#hudPlayersN').textContent=m.n; });
// reset server (server/reset.js): đếm ngược trên topbar theo giờ server gửi; reset xong thì báo rồi tải lại game
let RESET=null; NET.listen('reset',m=>{ if(m.done){ UI.open('🔄 Server đã reset',()=>`<p>${esc(m.msg||'')}</p>`); setTimeout(()=>location.reload(),4500); return; } RESET=m; $('#hudReset').title=`Server reset: mọi người (trừ Kaixa) về cấp ${m.level}, ${fmt(m.money)}, xoá hết đồ`; resetTick(); });
function resetTick(){ const el=$('#hudReset'), left=RESET?RESET.at-NET.now():0; if(left<=0){ el.hidden=true; return; } el.hidden=false; const s=Math.ceil(left/1000), h=Math.floor(s/3600), p2=v=>String(v).padStart(2,'0');
  $('#hudResetT').textContent=`Reset sau ${h?h+':':''}${p2(Math.floor(s%3600/60))}:${p2(s%60)}`; el.classList.toggle('soon',left<600e3); }
setInterval(resetTick,1000); $('#hudPlayers').addEventListener('click',e=>{ e.currentTarget.blur(); UI.online(); });
NET.listen('lands',m=>{ LANDS=m.list||[]; }); NET.listen('stays',m=>{ STAYS=m.v||{}; }); NET.listen('pcar',m=>{ PCAR=m; if(m.driving!==NET.pid&&P.pcar){ P.pcar=false; } if(m.out||!m.driving) P.incar=false; }); NET.listen('moto',m=>{ if(m.off){ P.moto=null; } }); NET.listen('herds',m=>{ HERDS=m.list||[]; }); NET.listen('dogs',m=>{ DOGLIST=m.list||[]; });
NET.listen('wild',m=>{ const od=WDINO, oc=WCROC; WDINO=m.dino; WCROC=m.croc; if(WDINO&&od&&od.k===WDINO.k){ WDINO.dx=od.dx; WDINO.dy=od.dy; } if(WCROC&&oc){ WCROC.dx=oc.dx; WCROC.dy=oc.dy; } });
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
NET.listen('ev',m=>{ if(m.k==='treasure'){ sfx('level_up',.5); flash=.4; shake(1.5,.2); for(let i=0;i<6;i++) fx.push({kind:'glint',x:m.x+(Math.random()-.5)*20,y:m.y-6+(Math.random()-.5)*10,t:-i*.08,life:.7}); }
  if(m.k==='hit'){ for(const s of SOCS.values()) if((s.a===m.from&&s.b===m.to)||(s.b===m.from&&s.a===m.to)) s.hp=m.hp; if(m.to===NET.pid){ P.act='hurt'; P.actT=0; sfx('dash',.4); shake(2.2,.18); } else if(m.from===NET.pid) shake(1,.1); }
  if(m.k==='lvl'){ const r=REM.get(m.id); if(r){ r.lv=m.lv; fx.push({kind:'note',x:r.x,y:r.y-40,t:0,life:1}); } }
  if(m.k==='csgtStop'){ whistleSnd(); bigText('TUÝT TUÝT! DỪNG XE KIỂM TRA'); }
  if(m.k==='dinoCall'){ const K=SD.WILDLIFE.dino.kinds[m.kind]||{}, z=S&&S.map.zones&&S.map.zones.find(z=>m.x>=z.x0&&m.x<=z.x1&&m.y>=z.y0&&m.y<=z.y1); toast(`🦖 Có tiếng gầm trong rừng... <b>${esc(K.name)}</b> xuất hiện${z?' ở '+esc(z.name):''}! Ra chụp ảnh đi`,'quest');
    if(S&&S.kind==='retreat'&&Math.hypot(m.x*T-P.x,m.y*T-P.y)<40*T) roarSnd(K.fly); }
  if(m.k==='dinoBite'){ crashSnd(); if(m.id===NET.pid){ flash=.5; P.act='hurt'; P.actT=0; bigText('BỊ ĐỚP!'); } }
  if(m.k==='crocCall'&&P.kayak) toast('🐊 Có gì đó vừa trườn xuống hồ... Chèo cẩn thận!','lock');
  if(m.k==='crocBite'){ shake(3,.3); for(let k=0;k<14;k++) fx.push({kind:'dust',x:m.x*T+(Math.random()-.5)*30,y:m.y*T+(Math.random()-.5)*10,vx:(Math.random()-.5)*60,vy:-Math.random()*50,t:0,life:.8});
    if(m.id===NET.pid){ P.kayak=false; const s=findSand(); if(s){ P.x=s.x; P.y=s.y; } crashSnd(); flash=.6; bigText('CÁ SẤU ĐỚP! LẬT THUYỀN!'); } }
  if(m.k==='megaCall'){ flash=.8; bigText('MEGATRON XUẤT HIỆN!'); crashSnd(); for(let k=0;k<24;k++) fx.push({kind:k%2?'glint':'dust',x:m.x*T+(Math.random()-.5)*60,y:m.y*T-20+(Math.random()-.5)*40,vx:(Math.random()-.5)*90,vy:-Math.random()*50,t:-k*.02,life:.9});
    if(Math.hypot(m.x*T-P.x,m.y*T-P.y)<30*T) setTimeout(()=>sayLine('Optimus Prime! Your end has come!'),700); }
  if(m.k==='megaHit'||m.k==='megaBoom'){ const X=m.x*T, Y=m.y*T-(m.k==='megaBoom'?0:20); shake(m.k==='megaBoom'?4:2,m.k==='megaBoom'?.4:.18); fx.push({kind:'num',txt:'-'+m.n,x:X,y:Y-24,t:0,life:1,col:'#ff6a6a'}); for(let k=0;k<(m.k==='megaBoom'?14:6);k++) fx.push({kind:k%2?'glint':'dust',x:X+(Math.random()-.5)*26,y:Y+(Math.random()-.5)*20,vx:(Math.random()-.5)*70,vy:-Math.random()*40,t:0,life:.6});
    if(m.id===NET.pid){ flash=.3; P.act='hurt'; P.actT=0; } if(m.k==='megaBoom') crashSnd(); else tone('square',200,70,.25,.25,900); }
  if(m.k==='megaDmg'){ const X=m.x*T, Y=m.y*T-40; fx.push({kind:'num',txt:'-'+m.n,x:X,y:Y,t:0,life:1,col:'#ffd84a'}); for(let k=0;k<8;k++) fx.push({kind:'glint',x:X+(Math.random()-.5)*20,y:Y+10+(Math.random()-.5)*20,t:0,life:.5}); m.kind==='ram'?crashSnd():tone('square',260,90,.2,.25,1100); }
  if(m.k==='megaEnd'){ if(m.win){ flash=1; for(let k=0;k<40;k++) fx.push({kind:k%3?'dust':'glint',x:m.x*T+(Math.random()-.5)*70,y:m.y*T-24+(Math.random()-.5)*50,vx:(Math.random()-.5)*140,vy:-Math.random()*90,t:-k*.015,life:1.2}); crashSnd(); setTimeout(crashSnd,250);
      if(m.id===NET.pid){ bigText('ĐÁNH BẠI MEGATRON!'); setTimeout(()=>sayLine('Autobots, we are victorious!'),900); } } else if(m.id===NET.pid) bigText('OPTIMUS GỤC NGÃ...'); }
  if(m.k==='riot'){ flash=.25; for(let k=0;k<12;k++) fx.push({kind:k%2?'glint':'dust',x:m.x+(Math.random()-.5)*30,y:m.y-10+(Math.random()-.5)*20,vx:(Math.random()-.5)*80,vy:-Math.random()*40,t:-k*.02,life:.6});
    if(Math.hypot(m.x*T-P.x,m.y*T-P.y)<24*T){ if(m.op==='smash'){ crashSnd(); if(m.wreck&&m.id===NET.pid) bigText('XE CSGT NÁT BÉT!'); } else tone('square',220,80,.25,.25,900); } }
  if(m.k==='pigBust'){ whistleSnd(); if(m.id===NET.pid) bigText('TRỘM LỢN BỊ BẮT!'); else toast(`🚓 ${esc(m.name)} trộm lợn của ${esc(m.by)} bị bắt quả tang, giải lên đồn!`,'lock'); }
  if(m.k==='mckCall'){ sfx('power_up',.5); toast(`🎤 ${esc(m.name)} thách đấu <b>MCK</b>! Vào Đấu trường MCK (góc Tây Bắc Ké) đánh cùng`,'quest'); }
  if(m.k==='mckHit'){ const X=m.x*T, Y=m.y*T-20; shake(2,.18); fx.push({kind:'num',txt:'-'+m.n,x:X,y:Y-24,t:0,life:1,col:'#ff6a6a'}); for(let k=0;k<6;k++) fx.push({kind:'glint',x:X+(Math.random()-.5)*16,y:Y+(Math.random()-.5)*16,t:0,life:.5}); if(m.id===NET.pid){ flash=.35; clank(); } }
  if(m.k==='mckDmg'){ fx.push({kind:'num',txt:'-'+m.n,x:m.x*T,y:m.y*T-58,t:0,life:1,col:'#ffd84a'}); }
  if(m.k==='mckEnd'&&inMck()) bigText(m.win?'HẠ GỤC MCK!':'MCK THẮNG');
  if(m.k==='mckLeave'&&S.kind==='retreat') toast('MCK: "Không ai đấu thì tôi về!" (bỏ đi rồi)','item');
  if(m.k==='diepKick'){ bigText('BỊ DIỆP ĐUỔI VỀ!'); sfx('blip',.5); }
  if(m.k==='shishaBust'){ whistleSnd(); if(m.id===NET.pid) bigText('BỊ CHỤP ẢNH BÁO CÔNG AN!'); else toast(`🚓 ${esc(m.name)} bị ${esc(m.by)} chụp ảnh báo công an, bị bắt về đồn!`,'lock'); }
  if(m.k==='arrest'){ if(m.id===NET.pid){ P.opt=null; whistleSnd(); bigText('BỊ BẮT! VỀ ĐỒN'); } else toast(`${esc(m.name)} (Optimus Prime) bị lực lượng cơ động bắt về đồn!`,'lock'); }
  if(m.k==='transform'){ const near=Math.hypot(m.x-P.x,m.y-P.y)<26*T, was=OPT_FORM[m.id]||'human'; OPT_FORM[m.id]=m.to; if(near){ transformSnd(); if(m.to==='robot'&&was==='human') setTimeout(()=>sayLine('I am Optimus Prime'),1150); }
    flash=.5; for(let k=0;k<16;k++) fx.push({kind:'glint',x:m.x+(Math.random()-.5)*44,y:m.y-24+(Math.random()-.5)*44,t:-k*.03,life:.8}); sfx('power_up',.6);
    if(m.id===NET.pid) bigText(m.to==='truck'?'XE ĐẦU KÉO!':m.to==='robot'?'AUTOBOTS, ROLL OUT!':'TRỞ LẠI LÀ KAIXA'); }
  if(m.k==='crash'){ if(Math.hypot(m.x-P.x,m.y-P.y)<160) shake(3,.3); CRASHES.push({x:m.x,y:m.y,model:m.model||'wave',face:m.face||1,t0:NET.now()}); for(let k=0;k<10;k++) fx.push({kind:'dust',x:m.x+(Math.random()-.5)*24,y:m.y,vx:(Math.random()-.5)*60,vy:-Math.random()*30,t:-k*.02,life:.7});
    const who=m.id===NET.pid?P:REM.get(m.id); if(who){ who.act='hurt'; who.actT=0; } if(m.id===NET.pid){ P.moto=null; P.speeding=false; crashSnd(); bigText('XOÈ XE!'); flash=.3; } }
  if(m.k==='impound'){ IMPOUNDS.push({x:m.x,y:m.y,model:m.model||'wave',t0:NET.now()}); if(m.id===NET.pid){ P.moto=null; bigText('XE BỊ CẨU VỀ ĐỒN!'); toast('Sai cả 5 câu: xe lên xe thùng CSGT về đồn công an. Lên đồn nộp phạt để lấy lại xe.','lock'); } }
  if(m.k==='pee'){ const r=m.id===NET.pid?P:REM.get(m.id); if(r) fx.push({kind:'pee',x:r.x,y:r.y+2,t:0,life:12,s:Math.random()*6,ground:true}); }
  if(m.k==='ach'){ sfx('level_up',.55); flash=.3; }
  if(m.k==='bite'){ sfx('dog_bark',.6); const r=m.id===NET.pid?P:REM.get(m.id); if(r){ for(let i=0;i<5;i++) fx.push({kind:'dust',x:r.x,y:r.y-10,vx:(Math.random()-.5)*50,vy:-Math.random()*20,t:0,life:.6}); if(r===P){ P.act='hurt'; P.actT=0; shake(2,.2); } } }
  if(m.k==='shame'){ const r=m.id===NET.pid?P:REM.get(m.id); if(r) for(let i=0;i<4;i++) fx.push({kind:'note',x:r.x+(i-1.5)*6,y:r.y-44,t:-i*.15,life:1.5}); if(m.id!==NET.pid) toast(`${esc(m.name)} vừa bị công an phạt vì làm chuyện đồi bại ngoài đường 😳`,'lock'); }
  if(m.k==='kiss'){ const n=npcs.find(x=>x.id===m.npc), r=m.id===NET.pid?P:REM.get(m.id); if(n){ n.act='kiss'; n.actT=0; } if(r){ if(r===P){ P.act='kiss'; P.actT=0; } for(let i=0;i<10;i++) fx.push({kind:'heart',x:(n?n.x:r.x)+(Math.random()-.5)*24,y:(n?n.y:r.y)-30-Math.random()*16,t:-i*.1,life:1.4}); } sfx('blip',.5); } });
NET.listen('peeSeen',m=>UI.peeSeen&&UI.peeSeen(m));
NET.listen('stunt',m=>{ if(m.k==='go'){ STUNT={...m.v,res:{},wheelieT:0,fallT:0,last:''}; UI.closeAll(); bigText('XUẤT PHÁT!'); sfx('car_4wd',.6); return; } if(!STUNT&&m.k!=='end') return;
  if(m.k==='ok'){ STUNT.res[m.i]='ok'; STUNT.wheelieT=1; STUNT.last='ok'; STUNT.msgT=performance.now()+700; sfx('power_up',.45); }
  if(m.k==='fall'){ shake(3,.3); STUNT.res[m.i]='fall'; STUNT.fallT=1.2; STUNT.last='fall'; STUNT.msgT=performance.now()+900; sfx('dash',.6); for(let k=0;k<10;k++) fx.push({kind:'dust',x:P.x+10,y:P.y+6,vx:(Math.random()-.5)*60,vy:-Math.random()*25,t:0,life:.7}); }
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
document.addEventListener('visibilitychange',()=>{ if(document.hidden||!started||!S) return; const g0=S.ground.chunk(0,0,0), g=g0.getContext('2d').getImageData(Math.floor(Math.min(g0.width,S.W*T)/2),Math.floor(Math.min(g0.height,S.H*T)/2),1,1).data;   // lấy điểm nằm trong map (map nhỏ hơn 1 khối nền thì giữa khối là chỗ trống)
  if(g[3]===0) location.reload(); });
// nhạc Phòng Bay: phát đúng lúc bài bắt đầu theo giờ server
function playDance(v){ stopDance(); if(AUD.muted||!v.song) return; window.MUSIC&&window.MUSIC.stop(); bgmKey=''; const a=new Audio('audio/'+v.song+'.mp3'); a.volume=.6; a.loop=true; danceAudio=a; if(AUD.music) AUD.music.pause();
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
window.GAME={get HOME(){ return HOME_NOW; },get HOME_MINE(){ return HOME_MINE; },pickAt,autoGo,npcScene,shake,worldAt,get PK(){ return PK; },get DQ(){ return DQ; },dqGo,nhoSac,get cam(){ return cam; },get clock(){ return clock; },get fx(){ return fx; },shadow,pick,sayLine,pkFace,walkTo,walkToNpc,destThumb,rideChoices,rideGo,MOTO_NAME,get oii(){ return OIS; },get herds(){ return HERDS; },get dogs(){ return DOGLIST; },snd:{howl:howlSnd,rooster:roosterSnd,bell:bellSnd,death:deathSnd,win:winSnd,nightAmb},get DANCE(){return DANCE;},get STUNT(){return STUNT;},officeOpen,boot,start,toast,esc,act,say,ask,sfx,setMute,AUD,banner,bigText,renderHUD,portrait,icon64,
  get G(){return G;},get P(){return P;},get S(){return S;},get REM(){return REM;},get PLOTS(){return PLOTS;},get TABLE(){return TABLE;},get RACE(){return RACE;},
  set HERD(v){HERD=v;},get HERD(){return HERD;},get FISH(){return FISH;},get lands(){return LANDS;},mountMoto,get plots(){return PLOTS;},bikeIcon,remoteAv:n=>{ for(const r of REM.values()) if(r.name===n&&r.av) return r.av; return null; },plotState,canFinish,startRoomAct,bedSpot,interact,nearest,keys,questGo,questProgress,finishQuest,needGo,eatGo,get AUTOWALK(){return AUTO;},get TASK(){return TASK;},get npcs(){return npcs;},
  get started(){return started;}};
// hook kiểm thử: chạy mô phỏng theo bước khi tab bị ẩn (rAF bị hãm)
window.CHANDE={get G(){return G;},get P(){return P;},get S(){return S;},REM,nearest,interact,
  step(sec,hold=[],tap=[]){ for(const k of hold) keys.add(k); let first=true; for(let t=0;t<sec;t+=1/60){ if(first) for(const k of tap) pressed.add(k); first=false; clock+=1/60; update(1/60); pressed.clear(); }
    for(const k of hold) keys.delete(k); draw(); drawMini(); renderHUD(); }};
})();
