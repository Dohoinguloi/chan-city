/* Chan City — không khí sống động cho từng map.
   Thời tiết theo lịch chung (mọi máy cùng thấy, đổi mỗi 75 phút theo giờ server): nắng, nhiều mây, mưa, giông; sương sớm Đà Lạt.
   Ngoài trời: bóng mây trôi, chim sẻ / bồ câu đáp xuống mổ thóc rồi vụt bay khi người tới gần, lá và cánh hoa rơi từ tán cây,
   đom đóm ban đêm, mưa rơi có giọt bắn, chớp và sấm. Trong phòng: nắng xiên qua cửa sổ, bụi li ti bay trong vệt nắng.
   Dấu chân in trên cát, đất rồi mờ dần. Mọi thứ chỉ để ngắm, không ảnh hưởng server. */
(function(){
const T=16, rnd=Math.random;
const H=n=>{ n=(n^61)^(n>>>16); n=n+(n<<3); n=n^(n>>>4); n=Math.imul(n,0x27d4eb2d); n=n^(n>>>15); return (n>>>0)/4294967296; };
const CITY_SEED={hn:11,hb:23,dl:37,hcm:53,hp:71}, BLOCK=75*60e3;
const RAIN=[0,0,.6,1], CLOUD=[.12,.65,.9,1];
const WX=[{icon:'☀',name:'Nắng đẹp'},{icon:'⛅',name:'Nhiều mây'},{icon:'🌧',name:'Mưa'},{icon:'⛈',name:'Giông'}];
function wAt(city,b){ const h=H(b*131+(CITY_SEED[city]||5)), pr=city==='dl'?[.44,.27,.23]:[.58,.24,.14]; let a=0; for(let i=0;i<3;i++){ a+=pr[i]; if(h<a) return i; } return 3; }
// 10% đầu mỗi khung chuyển dần từ thời tiết khung trước sang (không giật)
let FORCE=null;
function weather(now,city,hf){ const b=Math.floor(now/BLOCK), f=FORCE!=null?.5:(now%BLOCK)/BLOCK, cur=FORCE!=null?FORCE:wAt(city,b), prev=FORCE!=null?FORCE:wAt(city,b-1), k=f<.1?f/.1:1, e=k*k*(3-2*k);
  const mix=a=>a[prev]+(a[cur]-a[prev])*e, rain=mix(RAIN), cloud=mix(CLOUD);
  const fog=(city==='dl'?Math.max(0,1-Math.abs(hf-6.6)/2.2):0)+(rain>.3&&hf>4.5&&hf<8?.35:0);
  const night=hf>=18.5||hf<5.2, w=WX[cur];
  return {rain,cloud,fog:Math.min(1,fog),storm:cur===3&&e>.9,kind:cur,icon:night&&cur<2?'🌙':w.icon,name:night&&cur===0?'Trời quang':w.name}; }

/* ---------- âm thanh mưa, sấm, chim vỗ cánh (WebAudio tự tạo, không cần file) ---------- */
const AU={c:null,rain:null};
function ac(){ if(!AU.c){ try{ AU.c=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(AU.c.state==='suspended') AU.c.resume().catch(()=>{}); return AU.c; }
function noiseBuf(c,sec){ const n=c.sampleRate*sec, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); let last=0; for(let i=0;i<n;i++){ const w=Math.random()*2-1; last=(last+.04*w)/1.04; d[i]=w*.15+last*3; } return b; }   /* nhiễu trầm (ít nhiễu trắng): mưa, sấm, cánh chim đỡ rè */
function rainSound(vol){ const c=AU.c; if(!c) return; if(!AU.rain){ if(vol<.002) return; const s=c.createBufferSource(), f=c.createBiquadFilter(), hp=c.createBiquadFilter(), g=c.createGain();
    s.buffer=noiseBuf(c,2.5); s.loop=true; f.type='lowpass'; f.frequency.value=1700; hp.type='highpass'; hp.frequency.value=300; g.gain.value=0; s.connect(hp); hp.connect(f); f.connect(g); g.connect(c.destination); s.start(); AU.rain={s,g}; }
  AU.rain.g.gain.setTargetAtTime(vol,c.currentTime,.6); }
function thunder(vol){ const c=ac(); if(!c) return; const t=c.currentTime, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=noiseBuf(c,3);
  f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(90,t+2.6); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.08);
  g.gain.setTargetAtTime(vol*.5,t+.3,.25); g.gain.exponentialRampToValueAtTime(.0001,t+2.9); s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t+3); }
function flutter(vol){ const c=ac(); if(!c) return; const t=c.currentTime; for(let i=0;i<3;i++){ const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(), at=t+i*.05+Math.random()*.02;
    s.buffer=noiseBuf(c,.06); f.type='bandpass'; f.frequency.value=700+Math.random()*400; f.Q.value=.9; g.gain.setValueAtTime(vol,at); g.gain.exponentialRampToValueAtTime(.0001,at+.05); s.connect(f); f.connect(g); g.connect(c.destination); s.start(at); s.stop(at+.07); } }
function chirp(vol){ const c=ac(); if(!c) return; const t=c.currentTime, o=c.createOscillator(), g=c.createGain(), f0=2600+Math.random()*1400; o.type='sine';
  o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f0*1.35,t+.05); o.frequency.exponentialRampToValueAtTime(f0*.9,t+.11);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+.13); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+.15); }

/* ---------- trạng thái từng cảnh ---------- */
let bats=[], key='', birds=[], leaves=[], flies=[], drops=[], splashes=[], prints=[], motes=[], beams=[], clouds=[], fogs=[], boltT=8, boltFlash=0, thunderAt=0, chirpT=3, W=null;
const CLOUD_PX={};
function cloudShape(seed,w,h,col){ const k=seed+'_'+w+col; if(CLOUD_PX[k]) return CLOUD_PX[k]; const q=4, cw=Math.ceil(w/q), ch=Math.ceil(h/q), c=document.createElement('canvas'); c.width=cw; c.height=ch; const g=c.getContext('2d');
  g.fillStyle=col; const n=5+Math.floor(H(seed)*3); for(let i=0;i<n;i++){ const a=H(seed*7+i), b=H(seed*13+i*3), r=(.22+.18*H(seed*17+i))*ch*1.6;
    g.beginPath(); g.ellipse(cw*(.18+.64*a),ch*(.3+.4*b),r*1.25,r*.8,0,0,7); g.fill(); }
  // gom về pixel cứng (không mờ viền) cho hợp tranh pixel
  const d=g.getImageData(0,0,cw,ch); for(let i=3;i<d.data.length;i+=4) d.data[i]=d.data[i]>110?255:0; g.putImageData(d,0,0); return CLOUD_PX[k]=c; }
function reset(st){ key=st.key; bats=[]; ripples=[]; jumps=[]; birds=[]; leaves=[]; flies=[]; splashes=[]; prints=[]; motes=[]; boltT=6+rnd()*10;
  const s=H(st.key.length*97+st.W*7+st.H);
  const nc=Math.max(4,Math.min(40,Math.round(st.W*st.H*T*T/160000))); clouds=[]; for(let i=0;i<nc;i++){ const sd=Math.floor(H(s*1e4+i)*1e6), w=220+Math.floor(H(sd)*260), h=110+Math.floor(H(sd+1)*110); clouds.push({sd,w,h,y:H(sd+2)*(st.H*T+120)-60,ph:H(sd+3),sp:5+H(sd+4)*7,lv:H(sd+5)}); }
  fogs=[]; for(let i=0;i<6;i++){ const sd=Math.floor(H(s*3e3+i)*1e6); fogs.push({sd,w:260+H(sd)*200,h:60+H(sd+1)*40,y:H(sd+2)*(st.H*T),ph:H(sd+3),sp:3+H(sd+4)*4}); }
  // nắng xiên trong phòng: 2–3 vệt từ phía cửa sổ trên tường
  beams=[]; if(st.indoor){ const n=2+Math.floor(H(s*77)*2); for(let i=0;i<n;i++) beams.push({x:(.15+.7*(i+.3+H(s*31+i)*.4)/n)*st.W*T,w:12+H(s*41+i)*18}); } }
const tileAt=(st,x,y)=>{ const g=st.grid, r=g&&g[Math.floor(y/T)]; return r?r[Math.floor(x/T)]:''; };
const GRASSY=new Set(['G','B','C','D','S','P','T','E','O']);

function update(dt,st){ if(st.key!==key) reset(st); W=weather(st.now,st.city,st.hf); const v=st.view, out=!st.indoor, x0=v.cx, y0=v.cy, x1=v.cx+v.w, y1=v.cy+v.h;
  // chim: tối đa 2 đàn quanh khung nhìn, không ra lúc mưa / ban đêm
  const night=st.hf>=18.6||st.hf<5.3;
  if(out&&st.birds&&!night&&W.rain<.2&&birds.filter(b=>b.st==='peck').length<10&&rnd()<dt*.22){
    for(let tries=0;tries<6;tries++){ const fx=x0+30+rnd()*(v.w-60), fy=y0+30+rnd()*(v.h-60), t=tileAt(st,fx,fy);
      if(!GRASSY.has(t)||(st.free&&!st.free(fx,fy))||Math.hypot(fx-st.px,fy-st.py)<110) continue; const pig=t==='P'||t==='T'||t==='E'||rnd()<.3, n=3+Math.floor(rnd()*4), fid=rnd();
      for(let i=0;i<n;i++){ const bx=fx+(rnd()-.5)*36, by=fy+(rnd()-.5)*20; if(!GRASSY.has(tileAt(st,bx,by))||(st.free&&!st.free(bx,by))) continue;
        birds.push({x:bx,y:by,z:60+rnd()*40,vz:-70,vx:(rnd()-.5)*20,vy:0,face:rnd()<.5?1:-1,st:'land',t:rnd()*3,pk:0,hop:0,pig,fid,d:rnd()*.4}); }
      break; } }
  const scare=st.fast?64:38;
  for(const b of birds){ b.t+=dt;
    if(b.st==='land'){ if(b.d>0){ b.d-=dt; continue; } b.z=Math.max(0,b.z+b.vz*dt); b.x+=b.vx*dt; b.vz=Math.min(-18,b.vz+60*dt); if(b.z<=0){ b.st='peck'; b.t=rnd()*2; } continue; }
    if(b.st==='peck'){ b.pk=Math.max(0,b.pk-dt); if(b.hop>0){ b.hop-=dt; b.x+=b.face*22*dt; b.z=Math.sin((1-b.hop/.18)*Math.PI)*2.5; } else b.z=0;
      if(rnd()<dt*.9) b.pk=.22; if(rnd()<dt*.5){ b.hop=.18; if(rnd()<.4) b.face=-b.face; }
      let near=Math.hypot(b.x-st.px,b.y-st.py)<scare; if(!near&&st.others) for(const o of st.others) if(Math.hypot(b.x-o.x,b.y-o.y)<34){ near=true; break; }
      if(near||W.rain>.35||night){ const fid=b.fid; let n=0; for(const c of birds) if(c.fid===fid&&c.st==='peck'){ const a=Math.atan2(c.y-st.py,c.x-st.px)+(rnd()-.5)*.9, sp=70+rnd()*50;
          c.st='fly'; c.vx=Math.cos(a)*sp; c.vy=Math.sin(a)*sp*.6-12; c.vz=55+rnd()*30; c.face=c.vx>0?1:-1; c.d=rnd()*.18; n++; }
        if(n&&!st.muted) flutter(.02); } continue; }
    if(b.st==='fly'){ if(b.d>0){ b.d-=dt; continue; } b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.vz=Math.max(22,b.vz-30*dt); } }
  birds=birds.filter(b=>b.st!=='fly'||(b.z<260&&b.x>x0-200&&b.x<x1+200&&b.y>y0-260&&b.y<y1+200));
  if(out&&!night&&!st.muted&&birds.some(b=>b.st==='peck')&&(chirpT-=dt)<=0){ chirpT=1.5+rnd()*4; chirp(.018); }
  // lá rơi từ tán cây đang thấy (gió giông thì rụng nhiều, bay ngang)
  const wind=W.storm?60:W.rain>.3?22:8;
  if(out&&st.trees) for(const o of st.trees){ if(leaves.length>46) break; if(rnd()>dt*(W.storm?.5:.07)) continue; const s=o.spr, w=s.c.width, h=s.c.height;
    const pink=st.city==='dl'&&rnd()<.55, cols=pink?['#f6a6c1','#ffd0e0','#f08fb0']:['#7cbf4a','#a8d65a','#e3bd4f','#d98a3a','#8fcf55'];
    leaves.push({x:o.x-s.ax+w*(.2+.6*rnd()),y:o.y-s.ay+h*(.15+.35*rnd()),gy:o.y-4+rnd()*12,vy:9+rnd()*7,ph:rnd()*7,sw:4+rnd()*5,col:cols[Math.floor(rnd()*cols.length)],t:0,rest:0,petal:pink}); }
  for(const l of leaves){ l.t+=dt; if(l.rest>0){ l.rest+=dt; continue; } l.y+=l.vy*dt; l.x+=(Math.sin(l.t*2.4+l.ph)*l.sw+wind)*dt; if(l.y>=l.gy){ l.y=l.gy; l.rest=.001; } }
  leaves=leaves.filter(l=>l.rest<4.5&&l.x>x0-60&&l.x<x1+60);
  // mùa Halloween: dơi bay lượn qua khung nhìn ban đêm
  if(out&&st.season&&night&&bats.length<6&&rnd()<dt*.35){ const L=rnd()<.5; bats.push({x:L?x0-10:x1+10,y:y0+20+rnd()*v.h*.5,vx:(L?1:-1)*(45+rnd()*35),ph:rnd()*7,amp:6+rnd()*10,t:0}); }
  for(const b of bats){ b.t+=dt; b.x+=b.vx*dt; } bats=bats.filter(b=>b.x>x0-30&&b.x<x1+30);
  // đom đóm ban đêm (ngoài trời, không mưa to)
  const want=out&&night&&W.rain<.5?16:0;
  while(flies.length<want) flies.push({bx:x0+rnd()*v.w,by:y0+rnd()*v.h,ph:rnd()*7,a:.6+rnd()*.8,b:.5+rnd()*.7,t:rnd()*10});
  if(flies.length>want) flies.length=want;
  for(const f of flies){ f.t+=dt; f.bx+=Math.sin(f.t*.3+f.ph)*6*dt; f.by+=Math.cos(f.t*.27+f.ph)*4*dt; if(f.bx<x0-40||f.bx>x1+40||f.by<y0-40||f.by>y1+40){ f.bx=x0+rnd()*v.w; f.by=y0+rnd()*v.h; } }
  // mưa: hạt trong toạ độ màn hình, chạm "đất" thì bắn tung toé
  const nd=out?Math.round(W.rain*150):0;
  while(drops.length<nd) drops.push({x:rnd()*(v.w+60),y:rnd()*v.h-v.h,gy:rnd()*v.h,sp:240+rnd()*100,l:4+Math.floor(rnd()*3)});
  if(drops.length>nd) drops.length=nd;
  for(const d of drops){ d.y+=d.sp*dt; d.x-=d.sp*.22*dt; if(d.y>=d.gy){ if(splashes.length<60) splashes.push({x:d.x+x0,y:d.gy+y0,t:0}); d.y=-6-rnd()*40; d.x=rnd()*(v.w+60); d.gy=rnd()*v.h; } }
  for(const s of splashes) s.t+=dt; splashes=splashes.filter(s=>s.t<.28);
  // chớp & sấm khi giông
  boltFlash=Math.max(0,boltFlash-dt*2.6);
  if(W.storm&&(boltT-=dt)<=0){ boltT=9+rnd()*16; if(out) boltFlash=.55+rnd()*.3; thunderAt=st.now+500+rnd()*1600; }
  if(thunderAt&&st.now>=thunderAt){ thunderAt=0; if(!st.muted) thunder(out?.32:.16); }
  if(!st.muted&&W.rain>.02){ if(ac()) rainSound(W.rain*(out?.045:.018)); } else if(AU.rain) rainSound(0);
  // bụi trong vệt nắng trong phòng (ban ngày, trời không mưa)
  const sunny=st.indoor&&st.hf>7&&st.hf<17.3&&W.rain<.3;
  if(sunny&&beams.length&&motes.length<22) motes.push({b:Math.floor(rnd()*beams.length),u:rnd(),v:rnd(),t:0,ph:rnd()*7});
  if(!sunny) motes.length=0;
  for(const m of motes){ m.t+=dt; m.v+=dt*.025; m.u+=Math.sin(m.t*.7+m.ph)*.02*dt; if(m.v>1) m.v=0; }
  for(const p of prints) p.t+=dt; prints=prints.filter(p=>p.t<9); }

// dấu chân: gọi mỗi bước, chỉ in trên cát / đất / sân đất
const SOFT=new Set(['S','D','C']);
function step(st,x,y,face,view,flip){ if(st.indoor||!SOFT.has(tileAt(st,x,y))||prints.length>80) return; const side=flip?1:-1;
  if(view==='side') prints.push({x,y:y-1+(flip?1:0),t:0,h:true}); else prints.push({x:x+side*2,y,t:0,h:false}); }

function ground(ctx,cx,cy){ for(const p of prints){ const a=.28*(1-p.t/9); ctx.fillStyle=`rgba(70,45,30,${a})`; const X=Math.round(p.x-cx), Y=Math.round(p.y-cy); if(p.h) ctx.fillRect(X-1,Y,2,1); else ctx.fillRect(X,Y-1,1,2); }
  for(const s of splashes){ const k=s.t/.28, X=Math.round(s.x-cx), Y=Math.round(s.y-cy), r=Math.round(1+k*3); ctx.fillStyle=`rgba(210,228,255,${.55*(1-k)})`; ctx.fillRect(X-r,Y,1,1); ctx.fillRect(X+r,Y,1,1); if(k<.4) ctx.fillRect(X,Y-1-Math.round(k*6),1,1); } }

/* ---------- cỏ lay, hoa dại, mặt nước sống ----------
   Cỏ cao và hoa mọc theo hạt giống ô (cố định mỗi lần vào), lay theo gió; người đi sát thì cỏ rạp sang hai bên.
   Hồ: lấp lánh nắng, gợn tròn chỗ cá đớp mồi, thỉnh thoảng một con cá quẫy lên khỏi mặt nước. */
const TH=(x,y,s)=>H(Math.imul(x,73856093)^Math.imul(y,19349663)^Math.imul(s,83492791));
const FLOWER=[['#fff6e8','#f2c94c'],['#ffd84a','#e08a2a'],['#f6a6c1','#fff3d6'],['#b48ad8','#ffe680'],['#ff8a7a','#fff3d6']];
let ripples=[], jumps=[];
function decor(L,ctx,cx,cy,st){ if(st.indoor||!st.grid) return; const g=st.grid, t=st.now/1000, wind=W?(W.storm?2.6:W.rain>.3?1.6:1):1,
    tx0=Math.max(0,Math.floor(cx/T)), ty0=Math.max(0,Math.floor(cy/T)), tx1=Math.min(st.W-1,Math.floor((cx+st.view.w)/T)), ty1=Math.min(st.H-1,Math.floor((cy+st.view.h)/T)+1);
  for(let ty=ty0;ty<=ty1;ty++){ const row=g[ty]; if(!row) continue; for(let tx=tx0;tx<=tx1;tx++){ const k=row[tx];
    if(k==='G'){ const h=TH(tx,ty,41); if(h>.2) continue; const x=tx*T+3+Math.floor(TH(tx,ty,42)*10), y=ty*T+6+Math.floor(TH(tx,ty,43)*9); if(st.free&&!st.free(x,y)) continue;
      const flower=h<.05, dx=x-st.px, dy=y-st.py, near=Math.abs(dx)<9&&dy>-6&&dy<5, push=near?(dx>=0?2:-2):0, sw=Math.sin(t*1.7*wind+tx*.9+ty*.4)*wind;
      L.push({y,d:()=>{ const X=Math.round(x-cx), Y=Math.round(y-cy);
        if(flower){ const [pc,cc]=FLOWER[Math.floor(TH(tx,ty,44)*FLOWER.length)], b=Math.round(sw*.6)+push; ctx.fillStyle='#4f8a34'; ctx.fillRect(X,Y-3,1,3); ctx.fillRect(X+(b>0?1:0),Y-4,1,1);
          ctx.fillStyle=pc; ctx.fillRect(X-1+b,Y-6,3,1); ctx.fillRect(X+b,Y-7,1,3); ctx.fillStyle=cc; ctx.fillRect(X+b,Y-6,1,1); return; }
        // bụi cỏ: thân thẫm, ngọn sáng, ngọn uốn theo gió (2 khúc) để thấy rõ đang lay
        const blades=4+Math.floor(TH(tx,ty,45)*3); ctx.fillStyle='rgba(40,70,30,.25)'; ctx.fillRect(X-blades,Y,blades*2,1);
        for(let i=0;i<blades;i++){ const bx=X+i*2-blades+1, hgt=4+((i*7+tx)%3), side=bx<X?-1:1, bend=Math.max(-2,Math.min(2,Math.round(sw*(.5+i*.18))+(push?push+side:0))), mid=Math.trunc(bend/2);
          ctx.fillStyle=i%2?'#3f7a2a':'#4b8a39'; ctx.fillRect(bx,Y-Math.ceil(hgt/2)+1,1,Math.ceil(hgt/2)); ctx.fillStyle=i%2?'#5e9637':'#6aa13e'; ctx.fillRect(bx+mid,Y-hgt+2,1,Math.floor(hgt/2)-1);
          ctx.fillStyle=i%2?'#a8e070':'#9bd36a'; ctx.fillRect(bx+bend,Y-hgt+1,1,1); } }}); }
    else if(k==='W'&&TH(tx,ty,51)<.18){ const ph=TH(tx,ty,52)*7, tw=Math.sin(t*2.3+ph); if(tw<.82) continue; const x=tx*T+2+Math.floor(TH(tx,ty,53)*12), y=ty*T+2+Math.floor(TH(tx,ty,54)*12);
      L.push({y:ty*T,d:()=>{ const X=Math.round(x-cx), Y=Math.round(y-cy); ctx.fillStyle='#f4fbff'; ctx.fillRect(X,Y,1,1); if(tw>.94){ ctx.fillStyle='rgba(244,251,255,.6)'; ctx.fillRect(X-1,Y,3,1); ctx.fillRect(X,Y-1,1,3); } }}); } } }
  // cá đớp mồi (gợn tròn) và cá quẫy
  if(rnd()<.03){ const x=cx+rnd()*st.view.w, y=cy+rnd()*st.view.h, k=(g[Math.floor(y/T)]||'')[Math.floor(x/T)]; if(k==='W'||k==='o'){ ripples.push({x,y,t:0}); if(rnd()<.35) jumps.push({x,y,t:0,f:rnd()<.5?1:-1}); } }
  for(const r of ripples){ r.t+=1/60; const X=Math.round(r.x-cx), Y=Math.round(r.y-cy); L.push({y:r.y-T,d:()=>{ for(let j=0;j<2;j++){ const k=r.t-j*.35; if(k<0||k>1.4) continue; const rr=2+k*9, a=.5*(1-k/1.4);
      ctx.strokeStyle=`rgba(225,244,255,${a})`; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(X+.5,Y+.5,rr,rr*.45,0,0,7); ctx.stroke(); } }}); }
  ripples=ripples.filter(r=>r.t<1.9);
  for(const j of jumps){ j.t+=1/60; if(j.t>.7) continue; const k=j.t/.7, X=Math.round(j.x-cx+j.f*k*12), Y=Math.round(j.y-cy-Math.sin(k*Math.PI)*9);
    L.push({y:j.y,d:()=>{ ctx.fillStyle='#b8c4c8'; ctx.fillRect(X-2,Y,4,2); ctx.fillStyle='#7d8b92'; ctx.fillRect(X-2-j.f,Y,1,1); ctx.fillRect(X+2*j.f,Y-1+(k>.5?2:0),1,1); }}); }
  jumps=jumps.filter(j=>j.t<.75); }

/* chim: vẽ theo pixel, mặt phải; lật khi bay / đứng quay trái */
const BIRD={se:{body:'#8a6040',wing:'#5a3c26',streak:'#c9a070',belly:'#eadcbc',head:'#7a5232',cap:'#4e3420',cheek:'#efe4cc',beak:'#3a2a20',leg:'#c98a45',tail:'#4e3624'},
  pig:{body:'#9aa1b2',wing:'#7f879a',streak:'#4d5466',belly:'#b9bec9',head:'#707a93',cap:'#5f6982',cheek:'#6fb890',beak:'#e8e0d0',leg:'#d0605a',tail:'#4d5466'}};
function bird(ctx,b,X,Y){ const f=b.face, c=b.pig?BIRD.pig:BIRD.se, px=(x,y,w,h,col)=>{ ctx.fillStyle=col; ctx.fillRect(f>0?X+x:X-x-w+1,Y+y,w,h); };
  const fly=b.st!=='peck'&&b.z>.5, flap=Math.floor(b.t*16)%2, hx=b.pk>0?1:0, hy=b.pk>0?2:0, big=b.pig?1:0;
  px(-5-big,-5,2,1,c.tail); px(-6-big,-6,1,1,c.tail);                                   // đuôi vểnh
  px(-3-big,-5,5+big,3,c.body); px(-2,-3,4+big,1,c.belly); px(-1,-2,3,1,c.belly);         // thân, bụng
  if(!fly){ px(-3-big,-5,3+big,2,c.wing); px(-2,-5,1,1,c.streak); px(-3-big,-4,1,1,c.streak); if(b.pig) px(-1,-4,1,1,c.streak); }
  px(1+hx+big,-7+hy,3,3,c.head); px(1+hx+big,-7+hy,2,1,c.cap); px(2+hx+big,-5+hy,1,1,c.cheek); px(3+hx+big,-6+hy,1,1,'#1c1516'); px(4+hx+big,-6+hy,1,1,c.beak);
  if(fly){ if(flap){ px(-2,-9,3,4,c.wing); px(-1,-10,2,1,c.wing); px(-1,-8,1,1,c.streak); } else { px(-4-big,-3,5+big,2,c.wing); px(-3,-2,2,1,c.streak); } }
  else { px(-1,-1,1,1,c.leg); px(1,-1,1,1,c.leg); } }
// chim xếp lớp theo chiều sâu như mọi vật; bay càng cao càng nổi lên trước (đậu sau nhà thì bị mái che, đúng phối cảnh)
function list(L,ctx,cx,cy){ for(const b of birds){ if(b.d>0&&b.st==='land') continue; const X=Math.round(b.x-cx), Y=Math.round(b.y-cy);
    L.push({y:b.st==='fly'?b.y+b.z*1.3:b.y,d:()=>bird(ctx,b,X,Y-Math.round(b.z))});
    if(b.z>0&&b.z<140) L.push({y:b.y-1,d:()=>{ ctx.fillStyle=`rgba(28,21,22,${.22*(1-b.z/140)})`; ctx.fillRect(X-2,Y-1,5,1); }}); } }   // bóng dưới đất cho chim đang bay thấp

function front(ctx,cx,cy,vw,vh,st){ if(!W) return 0;
  // lá & cánh hoa
  for(const l of leaves){ const X=Math.round(l.x-cx), Y=Math.round(l.y-cy), a=l.rest>0?Math.max(0,1-l.rest/4.5):1, fr=Math.floor(l.t*5+l.ph)%4; ctx.globalAlpha=a; ctx.fillStyle=l.col;
    if(l.rest>0) ctx.fillRect(X,Y,2,1); else if(fr===0) ctx.fillRect(X,Y,2,1); else if(fr===1){ ctx.fillRect(X,Y,1,1); ctx.fillRect(X+1,Y+1,1,1); } else if(fr===2) ctx.fillRect(X,Y,1,2); else { ctx.fillRect(X+1,Y,1,1); ctx.fillRect(X,Y+1,1,1); } }
  ctx.globalAlpha=1;
  if(!st.indoor){
    // bóng mây trôi
    const cov=W.cloud, n=Math.round(clouds.length*(.3+cov*.7)), mw=st.W*T;
    for(let i=0;i<n&&i<clouds.length;i++){ const c=clouds[i], span=mw+c.w*2+200, x=((c.ph*span+st.now/1000*c.sp*(W.storm?2.2:1))%span)-c.w-100, y=c.y;
      if(x+c.w<cx||x>cx+vw||y+c.h<cy||y>cy+vh) continue; ctx.globalAlpha=.08+cov*.07; ctx.drawImage(cloudShape(c.sd,c.w,c.h,'#14203a'),Math.round(x-cx),Math.round(y-cy),c.w,c.h); }
    ctx.globalAlpha=1; }
  // dơi: thân tím thẫm, mắt đỏ, cánh vỗ 2 nhịp
  for(const b of bats){ const X=Math.round(b.x-cx), Y=Math.round(b.y-cy+Math.sin(b.t*5+b.ph)*b.amp), up=Math.floor(b.t*12)%2; ctx.fillStyle='#2b1a2e';
    ctx.fillRect(X-1,Y-1,3,3); ctx.fillRect(X,Y-2,1,1); if(up){ ctx.fillRect(X-4,Y-3,3,1); ctx.fillRect(X+2,Y-3,3,1); ctx.fillRect(X-2,Y-2,1,1); ctx.fillRect(X+2,Y-2,1,1); } else { ctx.fillRect(X-4,Y,3,1); ctx.fillRect(X+2,Y,3,1); ctx.fillRect(X-5,Y+1,1,1); ctx.fillRect(X+5,Y+1,1,1); }
    ctx.fillStyle='#ff4a4a'; ctx.fillRect(X+(b.vx>0?1:-1),Y-1,1,1); }
  // đom đóm
  if(flies.length){ ctx.globalCompositeOperation='lighter'; for(const f of flies){ const x=Math.round(f.bx+Math.sin(f.t*f.a+f.ph)*14-cx), y=Math.round(f.by+Math.cos(f.t*f.b+f.ph)*9-cy), g=Math.max(0,Math.sin(f.t*2.2+f.ph)); if(g<.08) continue;
      ctx.fillStyle=`rgba(190,255,110,${.22*g})`; ctx.fillRect(x-2,y-1,5,3); ctx.fillRect(x-1,y-2,3,5); } ctx.globalCompositeOperation='source-over';
    // lõi sáng có viền thẫm để vẫn nổi trên nền cỏ sáng (game không làm tối ban đêm)
    for(const f of flies){ const x=Math.round(f.bx+Math.sin(f.t*f.a+f.ph)*14-cx), y=Math.round(f.by+Math.cos(f.t*f.b+f.ph)*9-cy), g=Math.max(0,Math.sin(f.t*2.2+f.ph)); if(g<.08) continue;
      ctx.globalAlpha=g; ctx.fillStyle='#2c4a14'; ctx.fillRect(x-1,y,1,1); ctx.fillRect(x+2,y,1,1); ctx.fillRect(x,y-1,2,1); ctx.fillRect(x,y+2,2,1); ctx.fillStyle='#f2ff7a'; ctx.fillRect(x,y,2,2); ctx.fillStyle='#ffffff'; ctx.fillRect(x,y,1,1); } ctx.globalAlpha=1; }
  // nắng xiên + bụi trong phòng
  if(st.indoor&&st.hf>7&&st.hf<17.3&&W.rain<.3&&beams.length){ const rh=st.H*T, warm=st.hf<9||st.hf>15.5?'255,214,150':'255,244,210', fl=.055+Math.sin(st.now/2300)*.008;
    ctx.save(); ctx.beginPath(); ctx.rect(-cx,-cy,st.W*T,rh); ctx.clip();   // nắng chỉ rơi trong phòng
    for(const b of beams){ const gr=ctx.createLinearGradient(0,-cy,0,rh-cy); gr.addColorStop(0,`rgba(${warm},${fl*2})`); gr.addColorStop(.7,`rgba(${warm},${fl*1.2})`); gr.addColorStop(1,`rgba(${warm},0)`); ctx.fillStyle=gr;
      ctx.beginPath(); ctx.moveTo(b.x-cx,-cy); ctx.lineTo(b.x+b.w-cx,-cy); ctx.lineTo(b.x+b.w+rh*.55-cx,rh-cy); ctx.lineTo(b.x+rh*.55-cx,rh-cy); ctx.fill(); }
    for(const m of motes){ const b=beams[m.b]; if(!b) continue; const y=m.v*rh, x=b.x+m.u*b.w+y*.55, tw=.35+.35*Math.sin(m.t*3+m.ph); ctx.fillStyle=`rgba(255,250,225,${tw})`; ctx.fillRect(Math.round(x-cx),Math.round(y-cy),1,1); }
    ctx.restore(); }
  // mưa
  if(drops.length){ ctx.fillStyle='rgba(214,228,255,.62)'; for(const d of drops){ const x=Math.round(d.x), y=Math.round(d.y); for(let i=0;i<d.l;i++) ctx.fillRect(x+Math.round(i*.22),y-i,1,1); }
    ctx.fillStyle=`rgba(30,48,78,${.1*W.rain})`; ctx.fillRect(0,0,vw,vh); }
  // sương sớm
  if(W.fog>.02&&!st.indoor){ for(const f of fogs){ const span=st.W*T+f.w*2, x=((f.ph*span+st.now/1000*f.sp)%span)-f.w; if(x+f.w<cx||x>cx+vw||f.y+f.h<cy||f.y>cy+vh) continue;
      ctx.globalAlpha=.16*W.fog; ctx.drawImage(cloudShape(f.sd,Math.round(f.w),Math.round(f.h),'#f2f5fa'),Math.round(x-cx),Math.round(f.y-cy),Math.round(f.w),Math.round(f.h)); }
    ctx.globalAlpha=1; ctx.fillStyle=`rgba(236,240,246,${.1*W.fog})`; ctx.fillRect(0,0,vw,vh); }
  if(boltFlash>0){ ctx.fillStyle=`rgba(235,240,255,${boltFlash*.6})`; ctx.fillRect(0,0,vw,vh); }
  return boltFlash; }

window.AMB={weather,update,step,ground,list,decor,front,force(k){ FORCE=k; },
  get birds(){ return birds; }, get flies(){ return flies; }, get leaves(){ return leaves; }, get W(){ return W; } };
})();
