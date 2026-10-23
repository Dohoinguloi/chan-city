/* Chan City — nhạc nền chiptune tự sinh bằng WebAudio (không cần file, miễn phí): mỗi khu 1 bài riêng.
   Mỗi bài có nhịp, gam, vòng hợp âm, nhạc cụ, kiểu trống; giai điệu sinh theo hạt giống cố định (A A' B A') nên nghe có chủ đề,
   bass + rải hợp âm + trống chạy theo hợp âm. Đổi bài thì mờ dần bài cũ, hiện dần bài mới. */
(function(){
// gam (bán cung so với nốt gốc)
const MAJ=[0,2,4,5,7,9,11], MIN=[0,2,3,5,7,8,10], DOR=[0,2,3,5,7,9,10], PENTA=[0,2,4,7,9], NGUCUNG=[0,2,5,7,9], MINP=[0,3,5,7,10], LYD=[0,2,4,6,7,9,11];
const TR={
  town:   {name:'Phố Đà Bắc',bpm:118,root:60,scale:MAJ,prog:[0,4,5,3],lead:'p25',arp:'p12',bass:'tri',drums:'pop',seed:11},
  forest: {name:'Rừng phía Bắc',bpm:78,root:57,scale:MINP,prog:[0,3,2,4],lead:'tri',arp:'p12',bass:'tri',drums:'',seed:23,sparse:true,vib:true},
  lake:   {name:'Hồ Hoà Bình',bpm:70,root:62,scale:LYD,prog:[0,1,4,0],lead:'sine',arp:'tri',bass:'sine',drums:'',seed:31,sparse:true,pad:true},
  village:{name:'Bản Mường',bpm:92,root:62,scale:NGUCUNG,prog:[0,3,4,0],lead:'flute',arp:'pluck',bass:'tri',drums:'gong',seed:47,vib:true},
  park:   {name:'Vườn quốc gia',bpm:108,root:55,scale:MAJ,prog:[0,3,4,0,5,3,4,4],lead:'p25',arp:'p12',bass:'tri',drums:'march',seed:53},
  temple: {name:'Chùa Đà Bắc',bpm:60,root:57,scale:PENTA,prog:[0,2,3,0],lead:'bell',arp:'',bass:'sine',drums:'bell',seed:61,sparse:true,pad:true},
  night:  {name:'Đêm Hoà Bình',bpm:68,root:52,scale:MIN,prog:[0,5,2,6],lead:'tri',arp:'sine',bass:'sine',drums:'',seed:71,sparse:true,pad:true},
  dalat:  {name:'Đà Lạt mộng mơ',bpm:92,root:62,scale:MAJ,prog:[0,5,3,4],lead:'flute',arp:'pluck',bass:'tri',drums:'soft',seed:83,vib:true},
  hcm:    {name:'Sài Gòn',bpm:112,root:58,scale:DOR,prog:[0,3,0,4],lead:'p50',arp:'p25',bass:'saw',drums:'funk',seed:97},
  studio: {name:'Studio Khánh Hội',bpm:84,root:62,scale:MINP,prog:[0,5,3,4],lead:'tri',arp:'p12',bass:'sine',drums:'lofi',seed:171,pad:true},
  vnpt:   {name:'Điểm giao dịch',bpm:96,root:64,scale:MAJ,prog:[0,4,5,3],lead:'p25',arp:'tri',bass:'tri',drums:'soft',seed:181},
  mieu:   {name:'Sân miếu Hải Phòng',bpm:56,root:55,scale:PENTA,prog:[0,3,2,0],lead:'bell',arp:'',bass:'sine',drums:'bell',seed:191,sparse:true,pad:true},
  office: {name:'Everfit',bpm:104,root:60,scale:MAJ,prog:[0,3,5,4],lead:'p25',arp:'tri',bass:'tri',drums:'soft',seed:101},
  room:   {name:'Phòng trọ lofi',bpm:76,root:60,scale:[0,2,4,7,9,11],prog:[0,3,1,4],lead:'tri',arp:'sine',bass:'sine',drums:'lofi',seed:113,pad:true},
  cafe:   {name:'Cà phê chiều',bpm:86,root:62,scale:MAJ,prog:[1,4,0,5],lead:'flute',arp:'pluck',bass:'tri',drums:'bossa',seed:127,vib:true},
  mall:   {name:'Siêu thị',bpm:100,root:65,scale:MAJ,prog:[0,5,3,4],lead:'p25',arp:'tri',bass:'tri',drums:'soft',seed:131},
  club:   {name:'Nhà giải trí',bpm:124,root:57,scale:MIN,prog:[0,5,6,4],lead:'saw',arp:'p12',bass:'saw',drums:'dance',seed:137},
  tense:  {name:'Đồn công an',bpm:84,root:50,scale:MIN,prog:[0,0,5,4],lead:'p12',arp:'tri',bass:'saw',drums:'tick',seed:149,sparse:true},
  race:   {name:'Trường đua',bpm:144,root:60,scale:MAJ,prog:[0,4,5,3],lead:'p25',arp:'p12',bass:'tri',drums:'gallop',seed:151},
  battle: {name:'Optimus đấu Megatron',bpm:152,root:52,scale:MIN,prog:[0,6,5,4],lead:'saw',arp:'p25',bass:'saw',drums:'battle',seed:163},
  // bài riêng cho từng map
  lavi:    {name:'Lavi Studio Sài Gòn',bpm:96,root:63,scale:MAJ,prog:[0,5,3,4],lead:'flute',arp:'pluck',bass:'tri',drums:'lofi',seed:201,pad:true},
  nmotion: {name:'Nghiện Motion · arcade',bpm:132,root:60,scale:MAJ,prog:[0,4,5,3],lead:'p25',arp:'p12',bass:'p50',drums:'pop',seed:211},
  bearplus:{name:'bear+ pastel',bpm:100,root:65,scale:PENTA,prog:[0,3,4,0],lead:'sine',arp:'pluck',bass:'tri',drums:'soft',seed:221,vib:true},
  lumen:   {name:'Lumen Studio',bpm:88,root:62,scale:LYD,prog:[0,1,4,5],lead:'tri',arp:'sine',bass:'sine',drums:'lofi',seed:231,pad:true},
  yenlang: {name:'120 Yên Lãng · Refund Gaming',bpm:128,root:57,scale:MIN,prog:[0,5,6,4],lead:'p25',arp:'p12',bass:'saw',drums:'dance',seed:241},
  pickle:  {name:'Sân Pickleball',bpm:120,root:62,scale:MAJ,prog:[0,3,4,4],lead:'p50',arp:'tri',bass:'tri',drums:'funk',seed:251},
  diep:    {name:'Quán ramen của Diệp',bpm:80,root:60,scale:[0,1,5,7,8],prog:[0,3,4,0],lead:'flute',arp:'pluck',bass:'sine',drums:'soft',seed:261,vib:true},
  das:     {name:'DAS · giờ học',bpm:94,root:64,scale:MAJ,prog:[0,4,1,5],lead:'tri',arp:'p12',bass:'tri',drums:'soft',seed:271},
  net:     {name:'Quán net 2007',bpm:140,root:57,scale:MIN,prog:[0,5,3,4],lead:'p12',arp:'p25',bass:'p50',drums:'battle',seed:281},
  deo:     {name:'Đèo cao gió hú',bpm:110,root:55,scale:DOR,prog:[0,6,5,6],lead:'saw',arp:'p25',bass:'tri',drums:'gallop',seed:291},
  linhcat: {name:'Trung tâm Lính Cát',bpm:116,root:65,scale:MAJ,prog:[0,4,3,4],lead:'p25',arp:'p12',bass:'tri',drums:'pop',seed:301},
  // MU Online: mỗi khu 1 bài, đứng gần boss đang ra thì chuyển nhạc đánh boss
  mu_plaza:{name:'Lục Địa Cát · quảng trường',bpm:104,root:57,scale:MIN,prog:[0,5,3,4],lead:'saw',arp:'p25',bass:'tri',drums:'march',seed:311},
  mu_forest:{name:'Rừng Làng Lá',bpm:96,root:62,scale:[0,2,3,7,8],prog:[0,3,4,0],lead:'flute',arp:'pluck',bass:'tri',drums:'gong',seed:321,vib:true},
  mu_lake: {name:'Đầm Rồng',bpm:72,root:60,scale:LYD,prog:[0,1,4,0],lead:'sine',arp:'tri',bass:'sine',drums:'',seed:331,sparse:true,pad:true},
  mu_grave:{name:'Nghĩa địa Bóng Ma',bpm:66,root:50,scale:[0,1,3,6,7,10],prog:[0,1,0,5],lead:'tri',arp:'sine',bass:'saw',drums:'tick',seed:341,sparse:true,pad:true,vib:true},
  mu_junk: {name:'Bãi Phế Liệu',bpm:118,root:52,scale:MINP,prog:[0,0,3,4],lead:'p12',arp:'saw',bass:'saw',drums:'funk',seed:351},
  mu_boss: {name:'Đại chiến boss MU',bpm:160,root:50,scale:[0,1,3,5,7,8,10],prog:[0,1,5,4],lead:'saw',arp:'p25',bass:'saw',drums:'battle',seed:361},
};
const DRUMS={ // 16 ô / ô nhịp: K trống cái, S trống lẫy, H hi-hat
  pop:   {K:'1000000010100000',S:'0000100000001000',H:'1010101010101010'},
  march: {K:'1000100010001000',S:'0000100000001011',H:'1111111111111111'},
  soft:  {K:'1000000010000000',S:'0000100000001000',H:'0010001000100010'},
  funk:  {K:'1000001010010000',S:'0000100000001001',H:'1011101110111011'},
  lofi:  {K:'1000000001100000',S:'0000100000001000',H:'1010101010101010'},
  bossa: {K:'1001000010010000',S:'0010010000100100',H:'1111111111111111'},
  dance: {K:'1000100010001000',S:'0000100000001000',H:'0010001000100010'},
  tick:  {K:'1000000000000000',S:'0000000000000000',H:'1000100010001000'},
  gallop:{K:'1001001010010010',S:'0000100000001000',H:'1011011010110110'},
  battle:{K:'1010101010101010',S:'0000100000001000',H:'1111111111111111'},
  gong:  {K:'1000000000000000',S:'0000000010000000',H:'0000001000000010'},
  bell:  {K:'',S:'',H:''},
};
let ctx=null, muted=false, vol=.06, cur=null, timer=0, NOISE=null, WAVES={};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function rngOf(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>17; s^=s<<5; s>>>=0; return (s%10000)/10000; }; }
function ensure(){ if(!ctx){ try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
    const n=ctx.sampleRate, b=ctx.createBuffer(1,n,n), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; NOISE=b;
    for(const [k,duty] of [['p12',.125],['p25',.25],['p50',.5]]){ const N=32, re=new Float32Array(N), im=new Float32Array(N); for(let i=1;i<N;i++){ re[i]=4/(i*Math.PI)*Math.sin(Math.PI*i*duty); } WAVES[k]=ctx.createPeriodicWave(re,im); } }
  if(ctx.state==='suspended') ctx.resume().catch(()=>{}); return ctx; }
// 1 nốt: nhạc cụ khác nhau theo dạng sóng + đường bao
function note(dest,inst,m,t,dur,v,vib){ const o=ctx.createOscillator(), g=ctx.createGain();
  if(WAVES[inst]) o.setPeriodicWave(WAVES[inst]); else o.type=inst==='tri'||inst==='flute'?'triangle':inst==='saw'?'sawtooth':inst==='pluck'?'square':'sine';
  o.frequency.setValueAtTime(mtof(m),t);
  if(vib){ const l=ctx.createOscillator(), lg=ctx.createGain(); l.frequency.value=5.2; lg.gain.value=mtof(m)*.012; l.connect(lg); lg.connect(o.frequency); l.start(t+.08); l.stop(t+dur+.1); }
  const a=inst==='bell'?.002:inst==='pluck'?.003:.01, rel=inst==='bell'?Math.max(dur,1.2):inst==='pluck'?.18:.06, sus=inst==='bell'||inst==='pluck'?.0001:v*.7;
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); if(inst==='bell'||inst==='pluck') g.gain.exponentialRampToValueAtTime(.0001,t+rel); else { g.gain.setValueAtTime(sus,t+Math.max(a,dur-.02)); g.gain.exponentialRampToValueAtTime(.0001,t+dur+rel); }
  if(inst==='bell'){ const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=mtof(m)*2.76; o2.connect(g); o2.start(t); o2.stop(t+rel+.05); }
  o.connect(g); g.connect(dest); o.start(t); o.stop(t+(inst==='bell'?rel:dur+rel)+.05); }
function drum(dest,kind,t,v){ if(kind==='K'){ const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.12); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+.18); o.connect(g); g.connect(dest); o.start(t); o.stop(t+.2); return; }
  const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=NOISE; f.type=kind==='S'?'bandpass':'highpass'; f.frequency.value=kind==='S'?1500:6000; const d=kind==='S'?.11:.02;   /* hi-hat ngắn + nhỏ lại, đỡ tiếng sẹt sẹt */
  g.gain.setValueAtTime(v*(kind==='S'?.45:.1),t); g.gain.exponentialRampToValueAtTime(.0001,t+d); s.connect(f); f.connect(g); g.connect(dest); s.start(t,Math.random()*.5); s.stop(t+d+.02); }
// giai điệu 4 ô nhịp theo hạt giống: ưu tiên nốt trong hợp âm, bước liền bậc, có nghỉ; ráp thành câu A A' B A'
function chordOf(tr,bar){ const sc=tr.scale, n=sc.length, d=tr.prog[bar%tr.prog.length], pick=k=>{ const i=d+k; return sc[i%n]+12*Math.floor(i/n); }; return [pick(0),pick(2),pick(n>5?4:3)]; }
function makeBar(tr,rng,bar){ const sc=tr.scale, n=sc.length, ch=chordOf(tr,bar), out=Array(16).fill(null), rhythm=tr.sparse?'1000001000100000':['1010101010101000','1000101010001010','1010001010100010','1001001010101010'][Math.floor(rng()*4)];
  let deg=Math.floor(rng()*n)+n;
  for(let i=0;i<16;i++){ if(rhythm[i]!=='1') continue; if(rng()<.12) continue;
    if(i%4===0){ const tgt=ch[Math.floor(rng()*3)], cands=[]; for(let k=n;k<n*3;k++){ const m=sc[k%n]+12*Math.floor(k/n); if(m%12===tgt%12) cands.push(k); } if(cands.length) deg=cands.reduce((a,b)=>Math.abs(b-deg)<Math.abs(a-deg)?b:a); }
    else deg+=rng()<.5?(rng()<.5?-1:1):(rng()<.5?-2:2); deg=Math.max(n,Math.min(n*3-1,deg));
    let len=1; while(i+len<16&&rhythm[i+len]!=='1'&&len<4) len++; out[i]={m:sc[deg%n]+12*Math.floor(deg/n),len}; }
  return out; }
function makeSong(tr){ const r=rngOf(tr.seed), A=[0,1].map(b=>makeBar(tr,r,b)), B=[2,3].map(b=>makeBar(tr,r,b)), A2=A.map(x=>x.map(y=>y&&{...y})); if(A2[1][12]) A2[1][12]={...A2[1][12],m:chordOf(tr,1)[0]+12};
  return [...A,...B,...A2,...B.map((x,i)=>i===1?makeBar(tr,r,7):x)]; }   // 8 ô nhịp rồi lặp lại
function start(key){ const tr=TR[key]; if(!tr||!ensure()) return null; const bus=ctx.createGain(), soft=ctx.createBiquadFilter(); bus.gain.value=.0001; soft.type='lowpass'; soft.frequency.value=3600; soft.Q.value=.4; bus.connect(soft); soft.connect(ctx.destination);   /* lọc bớt tiếng rít cao của sóng vuông + hi-hat */ bus.gain.exponentialRampToValueAtTime(muted?.0001:vol,ctx.currentTime+1.6);
  return {key,tr,bus,song:makeSong(tr),step:0,t:ctx.currentTime+.12}; }
function tick(){ const P=cur; if(!P||!ctx) return; const tr=P.tr, sd=60/tr.bpm/4, horizon=ctx.currentTime+.35, D=DRUMS[tr.drums]||null;
  while(P.t<horizon){ const s=P.step, bar=Math.floor(s/16)%P.song.length, i=s%16, t=P.t, ch=chordOf(tr,bar), root=tr.root;
    const ln=P.song[bar][i]; if(ln) note(P.bus,tr.lead,root+12+ln.m,t,sd*ln.len*.92,.22,tr.vib);
    if(tr.arp&&(!tr.sparse||i%2===0)&&!(i%2&&tr.bpm>130)) note(P.bus,tr.arp==='p12'?'p25':tr.arp,root+ch[(i>>(tr.sparse?1:0))%3]+(i%8<4?0:12),t,sd*.8,.045);   /* arp xung 12,5% rất rè: đổi 25%, nhỏ lại */
    if(i%(tr.sparse?8:4)===0) note(P.bus,tr.bass,root-12+ch[0]+(i===8&&!tr.sparse?7:0),t,sd*(tr.sparse?7:3),.2);
    if(tr.pad&&i===0) for(const c of ch) note(P.bus,'sine',root+c,t,sd*15,.045);
    if(D) for(const k of ['K','S','H']) if(D[k][i]==='1') drum(P.bus,k,t,.35);
    if(tr.drums==='bell'&&i===0&&bar%2===0) note(P.bus,'bell',root-12,t,2,.12);
    if(tr.drums==='gong'&&i===0&&bar%4===0) note(P.bus,'bell',root-24,t,2.5,.16);
    P.t+=sd*(tr.drums==='bossa'||tr.drums==='lofi'?(i%2?.9:1.1):1); P.step++; } }
function stopP(P,fade=1.2){ if(!P) return; try{ P.bus.gain.cancelScheduledValues(ctx.currentTime); P.bus.gain.setValueAtTime(Math.max(.0001,P.bus.gain.value),ctx.currentTime); P.bus.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+fade); setTimeout(()=>{ try{ P.bus.disconnect(); }catch(e){} },fade*1000+800); }catch(e){} }
for(const ev of ['pointerdown','keydown']) addEventListener(ev,()=>{ if(ctx&&ctx.state==='suspended') ctx.resume().catch(()=>{}); },{passive:true});   // trình duyệt chỉ cho phát tiếng sau thao tác đầu
window.MUSIC={tracks:TR,
  play(key){ if(cur&&cur.key===key) return false; const old=cur; cur=start(key); if(old) stopP(old); if(!timer) timer=setInterval(tick,90); return !!cur; },
  stop(){ stopP(cur); cur=null; },
  current(){ return cur&&cur.key; },
  setMuted(m){ muted=m; if(cur&&ctx){ cur.bus.gain.cancelScheduledValues(ctx.currentTime); cur.bus.gain.setTargetAtTime(m?.0001:vol,ctx.currentTime,.2); } },
  setVolume(v){ vol=v; this.setMuted(muted); } };
})();
