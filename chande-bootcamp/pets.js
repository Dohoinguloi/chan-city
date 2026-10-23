/* Chan City — thú cưng (client): vẽ 30 loài theo SD.PETS[k].art (khung 20×16 nhìn nghiêng sang phải, 2 nhịp chân), con đang theo chạy lẽo đẽo sau chủ,
   thấy cả thú cưng của người chơi khác (tin 'pj' có pt). Đói thì hiện bong bóng 🍖, dỗi (quá 24 giờ) thì ở nhà. Nối vào MAPX.draw như các map khác. */
(function(){
const SD=SHARED, A=ART, T=A.T, X=window.MAPX;
const CACHE={}, hx=s=>'#'+String(s||'888888').replace('#','');
// vẽ 1 con: thân B, bóng b, bụng / mõm W, mắt mũi K; tai, đuôi, hoạ tiết theo art; fr 0/1: nhịp chân
function draw(P,a,fr){ const B=hx(a.B), b=hx(a.b), W=hx(a.W), K=a.K?hx(a.K):'#1c1516', oy=a.ear==='rabbit'?2:0, sm=a.small?1:0, lg=a.long?2:0, bg=a.big?1:0;
  const R=(x,y,w,h,c)=>P.rect(x,y+oy,w,h,c), D=(x,y,c)=>P.px(x,y+oy,c);
  if(a.kind==='hamster'){ P.disc(10,10,5,B); P.disc(11,11,3,W); P.rect(13,7,2,2,B); D(14,9,K); D(16,10,'#e8607a'); P.rect(8,14,2,1,b); P.rect(12,14,2,1,b); if(fr) P.rect(10,14,2,1,b); P.disc(13,6,1,b); return; }
  if(a.kind==='hedgehog'){ for(let x=3;x<=13;x++) for(let y=5;y<=11;y++){ const d=Math.hypot(x-8,(y-10)*1.4); if(d<6) P.px(x,y,(x+y)%2?b:B); } for(let x=4;x<=13;x+=2) P.px(x,4,b); P.rect(12,8,5,4,W); D(15,9,K); D(17,10,K); P.rect(6,12,2,2,b); P.rect(11,12,2,2,b); if(fr){ P.rect(8,12,1,2,b); } return; }
  if(a.kind==='turtle'){ for(let x=3;x<=13;x++) for(let y=5;y<=11;y++){ const d=Math.hypot(x-8,(y-11)*1.3); if(d<6) P.px(x,y,(x%4===0||y===8)?b:B); } P.rect(3,11,11,1,hx(a.W)); P.rect(14,8,3,3,W); D(16,8,K); P.rect(4,12,2,2,W); P.rect(11,12,2,2,W); if(fr) P.rect(14,12,2,1,W); return; }
  if(a.kind==='parrot'){ const hop=fr?-1:0; P.rect(7,6+hop,5,6,B); P.rect(11,3+hop,4,4,hx(a.W)); D(15,4+hop,K); P.rect(15,5+hop,1,2,'#f2c43d'); D(13,4+hop,'#ffffff'); P.rect(5,8+hop,3,3,b); P.rect(3,11+hop,4,1,'#2a62c8'); P.rect(1,12+hop,3,1,'#2a62c8'); P.rect(8,12+hop,1,2,'#c8a050'); P.rect(10,12+hop,1,2,'#c8a050'); return; }
  if(a.kind==='penguin'){ const w=fr?1:0; P.rect(6,3,7,11,B); P.rect(9,5,4,8,W); P.rect(10,3,3,3,B); D(12,4,'#ffffff'); P.rect(13,5,2,1,K); P.rect(5,7-w,2,5,b); P.rect(7,14,3,1,K); P.rect(11,14,3,1,K); if(fr) P.rect(11,13,3,1,K); return; }
  // thú 4 chân: thân, đầu bên phải, chân trước / sau đổi nhịp
  const bx0=4+sm, bx1=13+lg, bw=bx1-bx0+1, hy=3-bg;
  R(bx0,7-bg,bw,5+bg,B); R(bx0+1,10,bw-2,2,W); R(bx1-1,hy,6,5,B); if(a.snout!=='short') R(bx1+4,hy+2,2,2,W); D(bx1+3,hy+1,K); D(a.snout==='short'?bx1+4:bx1+5,hy+2,a.cat?'#e8708a':K);
  const leg=(x,up)=>R(x,12,1,up?2:3,b); leg(bx0+1,fr); leg(bx0+2,!fr); leg(bx1-2,!fr); leg(bx1-1,fr); if(a.pat==='socks'||a.pat==='tan') for(const x of [bx0+1,bx0+2,bx1-2,bx1-1]) D(x,14,a.pat==='tan'?W:'#2a2228');
  const ex=bx1, ey=hy; const E={up:()=>{ R(ex,ey-2,1,2,B); R(ex+3,ey-2,1,2,B); },big:()=>{ R(ex-1,ey-2,2,2,B); R(ex+3,ey-2,2,2,B); },small:()=>{ D(ex,ey-1,b); D(ex+3,ey-1,b); },flop:()=>{ R(ex-1,ey,2,4,b); },
    cat:()=>{ D(ex,ey-2,B); R(ex,ey-1,2,1,B); D(ex+3,ey-2,B); R(ex+2,ey-1,2,1,B); },round:()=>{ R(ex,ey-1,2,1,a.pat==='panda'?'#1c1516':b); R(ex+3,ey-1,2,1,a.pat==='panda'?'#1c1516':b); },
    rabbit:()=>{ R(ex,ey-5,1,5,B); R(ex+2,ey-5,1,5,B); D(ex,ey-4,'#f2a6b8'); D(ex+2,ey-4,'#f2a6b8'); }}; (E[a.ear]||E.up)();
  const tx=bx0-1, ty=7-bg; const TL={curl:()=>{ D(tx,ty,B); D(tx-1,ty-1,B); D(tx,ty-2,B); },long:()=>{ R(tx-2,ty+1,3,1,B); D(tx-3,ty,B); },longdark:()=>{ R(tx-2,ty+1,3,1,'#4a3a32'); D(tx-3,ty,'#4a3a32'); },stub:()=>D(tx,ty,B),
    fluffy:()=>{ R(tx-2,ty-2,3,4,B); D(tx-2,ty-2,W); },puff:()=>{ R(tx-1,ty,2,2,W); },fox:()=>{ R(tx-3,ty,4,3,B); R(tx-3,ty+2,2,1,W); },squirrel:()=>{ R(tx-2,ty-5,3,7,B); R(tx-1,ty-6,2,1,B); R(tx-2,ty-5,1,3,W); },
    ring:()=>{ for(let i=0;i<4;i++) D(tx-i,ty+1-Math.floor(i/2),i%2?'#2a2630':B); }}; (TL[a.tail]||TL.stub)();
  if(a.pat==='spots') for(const [x,y] of [[bx0+2,8],[bx0+5,9],[bx0+7,7],[bx1-3,8],[bx1+1,hy+1]]) D(x,y,K);
  if(a.pat==='stripes') for(let x=bx0+1;x<bx1;x+=2) R(x,7,1,3,b);
  if(a.pat==='calico'){ R(bx0+1,7,3,2,'#e8943a'); R(bx0+6,8,3,2,'#2a2630'); R(bx1,hy,2,2,'#e8943a'); }
  if(a.pat==='siamese'){ R(bx1+2,hy+1,4,3,'#6a4a3a'); D(bx1+3,hy+1,'#7fd0ff'); for(const x of [bx0+1,bx0+2,bx1-2,bx1-1]) R(x,13,1,2,'#6a4a3a'); }
  if(a.pat==='mask'){ R(bx1+3,hy+1,3,2,'#3a3038'); D(bx1+3,hy+1,'#f4f1ea'); }
  if(a.pat==='mask2'){ R(bx1,hy,3,2,b); R(bx1+3,hy+3,3,2,W); }
  if(a.pat==='raccoon'){ R(bx1+2,hy+1,4,2,'#2a2630'); D(bx1+3,hy+1,'#f4f1ea'); }
  if(a.pat==='panda'){ R(bx1-3,7-bg,3,5+bg,'#1c1516'); for(const x of [bx0+1,bx0+2,bx1-2,bx1-1]) R(x,12,1,3,'#1c1516'); R(bx1+2,hy+1,3,2,'#1c1516'); D(bx1+3,hy+1,'#f4f1ea'); }
  if(a.pat==='curly'||a.pat==='fluff') for(let x=bx0;x<=bx1;x+=2) D(x,6-bg,B); if(a.pat==='curly') R(bx1,hy-1,4,1,B);
  if(a.pat==='tan'){ R(bx1+3,hy+3,3,2,W); D(bx1+2,hy,W); } }
function sprite(k,fr){ const key=k+fr; if(CACHE[key]) return CACHE[key]; const P=SD.PETS[k]; if(!P) return null; const s=A.sprite(20,16,10,15,(g,Pn)=>draw(Pn,P.art,fr)); return CACHE[key]=s; }
// ảnh thẻ Shopee: con vật phóng to trên nền kem
const ICON={}; function icon(k){ if(ICON[k]) return ICON[k]; const s=sprite(k,0); if(!s) return ''; const c=document.createElement('canvas'); c.width=c.height=60; const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
  g.fillStyle='#f3ecdc'; g.fillRect(0,0,60,60); g.drawImage(s.c,0,0,20,16,0,6,60,48); return ICON[k]=c.toDataURL(); }
/* ---------- đi theo: con của mình + của người khác ---------- */
const mine={x:0,y:0,face:1,t:0,kind:'',scene:''}, rem=new Map(); let last=performance.now();
NET.listen('pj',m=>{ const r=GAME.REM&&GAME.REM.get(m.id); if(r) r.pt=m.pt||''; });
function follow(f,tx,ty,face,dt){ const bx=tx+face*18, by=ty+4,   /* đi phía trước chủ: Lính Cát đầu đội đi phía sau (lc.js), 2 con không đè nhau */ dx=bx-f.x, dy=by-f.y, d=Math.hypot(dx,dy);
  if(d>220){ f.x=bx; f.y=by; } else if(d>4){ const sp=Math.min(d,(d>40?160:70)*dt); f.x+=dx/d*sp; f.y+=dy/d*sp; f.t+=dt; if(Math.abs(dx)>1) f.face=dx>0?1:-1; } return d>4; }
function put(list,ctx,k,f,moving,hungry){ const s=sprite(k,moving?Math.floor(f.t*8)%2:0); if(!s) return; const cam=GAME.cam;
  list.push({y:f.y,d:()=>{ GAME.shadow(f.x,f.y,6); const X0=Math.round(f.x-cam.x), Y0=Math.round(f.y-cam.y); ctx.save(); if(f.face<0){ ctx.translate(X0*2,0); ctx.scale(-1,1); } ctx.drawImage(s.c,X0-s.ax,Y0-s.ay); ctx.restore();
    if(hungry){ ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('🍖',X0,Y0-18+Math.sin(performance.now()/300)*1.5); } }}); }
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); const S=GAME.S, G=GAME.G, P=GAME.P; if(!S||!G||!P) return; const t=performance.now(), dt=Math.min(.05,(t-last)/1000); last=t;
  const st=SD.petState(G,NET.now()), k=G.pet;
  if(k&&st!=='sulk'&&!P.riding&&!P.moto&&!P.pcar&&!P.kayak){ if(mine.kind!==k||mine.scene!==S.kind){ mine.kind=k; mine.scene=S.kind; mine.x=P.x+18; mine.y=P.y+4; } const mv=follow(mine,P.x,P.y,P.face||1,dt); put(list,ctx,k,mine,mv,st==='hungry'); }
  else mine.kind='';
  for(const r of (GAME.REM||new Map()).values()){ if(!r.pt||!SD.PETS[r.pt]||r.scene&&r.scene!==S.kind) continue; let f=rem.get(r.id); if(!f||f.kind!==r.pt){ f={x:r.x+18,y:r.y+4,face:1,t:0,kind:r.pt}; rem.set(r.id,f); }
    const mv=follow(f,r.x,r.y,r.face||1,dt); put(list,ctx,r.pt,f,mv,false); } };
window.PETART={sprite,icon};
})();
