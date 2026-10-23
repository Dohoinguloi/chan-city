/* Chan City — đồ phủ Shopee vẽ đè lên lưới nhân vật 20×35 (cả 3 hướng: nghiêng / nhìn thẳng / nhìn sau), dùng chung bộ vẽ của hw.js (nới lề, viền đen phần vẽ thêm).
   Món đồ chỉ khai báo opts trong data.js: hat (mũ), gl (kính), scarf (khăn / cà vạt / nơ), pat (hoạ tiết áo, logo Lumen / DAS), pat2 (hoạ tiết quần),
   shoe (kiểu giày), hx (kiểu tóc), fc (khuôn mặt). Màu lấy từ colors của món: hat/hat2, frame/lens, scarf/scarf2, acc/acc2, pacc, sacc, fc/fc2.
   Toạ độ theo lưới gốc: mắt nhìn thẳng (6,11)/(13,11), nghiêng (10,11)/(15,11); miệng hàng 15; vai áo hàng 19; quần 27..31; giày 32..33.
   Khung nhìn thẳng / sau nhún người 1 ô: dò hàng vai áo (19 ở khung gốc) để bám theo. */
(function(){
const H=window.HWC; if(!H) return;
/* màu cố định + ký tự màu theo món (gán lúc dựng bảng màu) */
const FIX={'ω':[248,246,240],'Ω':[255,206,64],'Ψ':[26,22,30],'υ':[43,94,78],'φ':[255,243,214],'χ':[255,212,0],'ψ':[28,21,22],'Ж':[232,52,64],'З':[60,210,230],'Ч':[255,150,190]};
const DYN=['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','π','ρ','σ','τ','ϰ','ϱ'];
for(const [k,v] of Object.entries(FIX)){ H.PAL[k]=v; H.KEYS.add(k); } for(const k of DYN) H.KEYS.add(k);
const hx=s=>{ s=String(s||'888888').replace('#',''); return [parseInt(s.slice(0,2),16)||0,parseInt(s.slice(2,4),16)||0,parseInt(s.slice(4,6),16)||0]; };
const dk=(c,k)=>c.map(v=>Math.max(0,Math.min(255,Math.round(v*k)))), mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
function pal(p,c){ const hat=hx(c.hat||'c4382e'), h2=hx(c.hat2||'f4f1ea'), lens=hx(c.lens||'2a3442'), sc=hx(c.scarf||'c4382e');
  Object.assign(p,FIX,{'α':hat,'β':dk(hat,.68),'γ':h2,'δ':dk(h2,.72),'ε':hx(c.frame||'1c1820'),'ζ':lens,'η':mix(lens,[255,255,255],.55),'θ':sc,'ι':dk(sc,.7),'κ':hx(c.scarf2||'f4f1ea'),
    'λ':hx(c.acc||'f4f1ea'),'μ':hx(c.acc2||'1c1820'),'ν':hx(c.pacc||'f4f1ea'),'ξ':hx(c.sacc||'f4f1ea'),'π':dk(hx(c.sacc||'f4f1ea'),.7),'ρ':hx(c.fc||'e8707a'),'σ':dk(hx(c.hair||'211c21'),.9),'τ':hx(c.fc2||'3a78c8'),
    'ϰ':p.H||hx(c.hair||'211c21'),'ϱ':p.h||dk(hx(c.hair||'211c21'),.75)}); }
const need=o=>!o.costume&&!!(o.hat||o.gl||o.scarf||o.pat||o.pat2||o.shoe||o.hx||o.fc);
const TOP='TtqIi', LEG='Pp', SKIN='Ssd';
/* ---------- mũ ---------- */
// phần chóp phủ đỉnh đầu từ hàng y1 lên y0: lấy bề ngang đầu ở hàng y1, lên trên mỗi hàng thu vào 1 ô cho tròn
function dome(g,y0,y1,c,band){ const [l,r]=g.span(y1); let L=l, R=r; for(let y=y1;y>=y0;y--){ g.rect(L,y,R,y,band&&y>=band[0]?band[1]:c); if(y<y1-1){ L++; R--; } if(L>R) break; } }
const brim=(g,y,ext,c,fwd)=>{ const [l,r]=g.span(y); g.rect(l-(fwd?0:ext),y,r+ext+(fwd?2:0),y,c); };
const pair=(g,v,pts,c)=>{ for(const [x,y] of pts){ if(v==='side'){ g.put(x+2,y,c); g.put(16-x,y,c); } else { g.put(x,y,c); g.put(19-x,y,c); } } };
const cx=v=>v==='side'?10:9.5;
const HAT={
  beanie(g,v){ dome(g,-1,5,'α',[4,'β']); },
  beanie_pom(g,v){ dome(g,-1,5,'α',[4,'β']); const x=Math.floor(cx(v)); g.rect(x-1,-3,x+1,-2,'γ'); },
  bucket(g,v){ dome(g,-1,4,'α'); brim(g,5,2,'β'); },
  fedora(g,v){ dome(g,-3,3,'α',[2,'γ']); const x=Math.floor(cx(v)); g.put(x,-3,'β'); brim(g,4,3,'β'); },
  cowboy(g,v){ dome(g,-3,3,'α',[3,'γ']); const [l,r]=g.span(4); g.rect(l-4,4,r+4,4,'β'); g.put(l-4,3,'β'); g.put(r+4,3,'β'); },
  tophat(g,v){ const x0=v==='side'?6:5, x1=v==='side'?15:14; g.rect(x0,-7,x1,3,'α'); g.rect(x0,1,x1,2,'γ'); g.rect(x0-2,4,x1+2,4,'β'); },
  straw(g,v){ dome(g,-2,3,'α',[2,'γ']); brim(g,4,3,'β'); },
  nonla(g,v){ const c=cx(v); for(let y=-6;y<=4;y++){ const w=Math.round((y+7)*1.15); g.rect(Math.round(c-w),y,Math.round(c+w)-1,y,(y+6)%3===2?'β':'α'); } },
  beret(g,v){ const s=v==='side'; dome(g,0,4,'α'); g.rect(s?0:3,1,s?3:17,3,'α'); g.put(Math.floor(cx(v)),-1,'β'); },
  helmet(g,v){ dome(g,-1,6,'α'); const x=Math.floor(cx(v)); g.rect(x-1,-1,x,6,'γ'); if(v==='side') g.rect(14,6,19,7,'β'); },
  hardhat(g,v){ dome(g,-1,3,'α'); const x=Math.floor(cx(v)); g.rect(x,-1,x,3,'β'); brim(g,4,1,'β'); },
  crown(g,v){ const [l,r]=g.span(1); g.rect(l,0,r,1,'Ω'); for(let x=l;x<=r;x+=3){ g.rect(x,-2,x,-1,'Ω'); g.put(x,-3,'Ω'); } for(let x=l+1;x<=r;x+=3) g.put(x,0,'α'); },
  tiara(g,v){ const [l,r]=g.span(3); g.rect(l+1,2,r-1,2,'Ω'); const x=Math.floor(cx(v)); g.rect(x-1,0,x,1,'Ω'); g.put(x,0,'α'); },
  headband(g,v){ const [l,r]=g.span(5); g.rect(l,4,r,5,'α'); if(v==='side'){ g.rect(l-2,5,l-1,8,'α'); } if(v==='back'){ g.rect(9,6,10,9,'α'); } },
  bandana(g,v){ dome(g,-1,5,'α'); g.rows(-1,5,(x,y,c)=>{ if('αβ'.includes(c)&&(x+y)%3===0) g.put(x,y,'γ'); }); if(v==='side') g.rect(-1,4,0,8,'α'); if(v==='back') g.rect(9,6,10,9,'α'); },
  chef(g,v){ const c=cx(v); g.ell(Math.round(c),-3,6,3,(x,y)=>g.put(x,y,'ω')); dome(g,2,4,'ω'); g.rect(Math.round(c)-5,2,Math.round(c)+4,2,'δ'); },
  santa(g,v){ dome(g,-1,3,'α'); const s=v==='side'; for(let i=0;i<4;i++) g.rect((s?11:8)+i,-2-i,(s?14:11)+i,-2-i,'α'); g.rect(s?15:12,-6,s?16:13,-5,'ω'); brim(g,4,0,'ω'); },
  catear(g,v){ pair(g,v,[[3,1],[4,1],[5,1],[3,0],[4,0],[3,-1],[4,-1],[3,-2]],'α'); pair(g,v,[[4,0]],'γ'); const [l,r]=g.span(2); g.rect(l,1,r,1,'α'); },
  bunny(g,v){ pair(g,v,[[5,1],[6,1],[5,0],[6,0],[5,-1],[6,-1],[5,-2],[6,-2],[5,-3],[6,-3],[5,-4],[6,-4],[5,-5],[6,-5],[6,-6]],'α'); pair(g,v,[[6,-1],[6,-2],[6,-3],[6,-4]],'γ'); },
  halo(g,v){ const c=Math.round(cx(v)); for(let x=c-5;x<=c+4;x++){ g.put(x,-4,'Ω'); g.put(x,-2,'Ω'); } g.put(c-6,-3,'Ω'); g.put(c+5,-3,'Ω'); },
  horns(g,v){ pair(g,v,[[4,1],[4,0],[3,-1],[3,-2],[2,-3]],'α'); },
  grad(g,v){ dome(g,1,4,'α'); const [l,r]=g.span(2); g.rect(l-2,-1,r+2,0,'β'); g.rect(l-2,-1,r+2,-1,'α'); const x=r+2; g.rect(x,0,x,4,'γ'); g.put(x,5,'γ'); },
  viking(g,v){ dome(g,-1,4,'α',[4,'γ']); pair(g,v,[[2,2],[1,1],[1,0],[0,-1],[0,-2]],'ω'); },
  sombrero(g,v){ const c=Math.round(cx(v)); g.rect(c-4,-4,c+3,3,'α'); g.rect(c-4,1,c+3,2,'γ'); g.rect(c-11,4,c+10,4,'β'); g.put(c-12,3,'β'); g.put(c+11,3,'β'); },
  snap(g,v){ dome(g,0,5,'α'); if(v==='side') g.rect(12,5,21,5,'β'); if(v==='front'){ const [l,r]=g.span(6); g.rect(l+1,6,r-1,6,'β'); } },
  visor(g,v){ const [l,r]=g.span(5); g.rect(l,4,r,5,'α'); if(v==='side') g.rect(13,5,21,5,'β'); if(v==='front') g.rect(l+1,6,r-1,6,'β'); },
  pirate(g,v){ dome(g,-2,2,'α'); const [l,r]=g.span(3); g.rect(l-2,3,r+2,3,'β'); g.put(l-2,2,'β'); g.put(r+2,2,'β'); if(v==='front') g.rect(9,0,10,1,'ω'); if(v==='side') g.rect(13,0,14,1,'ω'); },
  turban(g,v){ dome(g,-2,5,'α'); g.rows(-2,5,(x,y,c)=>{ if(c==='α'&&(x-y)%4===0) g.put(x,y,'β'); }); if(v==='front') g.rect(9,3,10,4,'γ'); if(v==='side') g.rect(14,3,15,4,'γ'); },
  earmuff(g,v){ const [l,r]=g.span(1); g.rect(l+1,-1,r-1,0,'β'); if(v==='side'){ g.rect(4,8,6,12,'α'); g.rect(5,1,5,7,'β'); } else { g.rect(0,8,2,12,'α'); g.rect(17,8,19,12,'α'); g.rect(1,1,1,7,'β'); g.rect(18,1,18,7,'β'); } },
  flower(g,v){ const [l,r]=g.span(2); for(let x=l;x<=r;x++) g.put(x,1,x%3===0?'γ':x%3===1?'α':'β'); for(let x=l;x<=r;x+=3) g.put(x,0,'γ'); },
  police(g,v){ dome(g,-1,4,'α',[4,'β']); const x=Math.floor(cx(v)); g.rect(x,1,x+1,2,'Ω'); if(v==='front'){ const [l,r]=g.span(5); g.rect(l+2,5,r-2,5,'Ψ'); } if(v==='side') g.rect(13,5,19,5,'Ψ'); } };
/* ---------- kính ---------- */
// 2 tròng quanh mắt: nhìn thẳng mắt ở cột 6 / 13, nghiêng 10 / 15; khung 5 ô ngang (mắt ở giữa), cao hàng 10..13
const EYES=v=>v==='side'?[10,15]:[6,13];
function lensBox(g,x,c,o){ const t=o.t||10, b=o.b||13; for(let y=t;y<=b;y++) for(let dx=-2;dx<=2;dx++){ const xx=x+dx, edge=dx===-2||dx===2||y===t||y===b, corner=(dx===-2||dx===2)&&(y===t||y===b);
    if(o.shape==='round'&&corner) continue; if(o.shape==='avi'&&y===b&&(dx===-2||dx===2)) continue;
    if(edge){ if(!o.rim||(o.rim==='top'&&y===t)) g.put(xx,y,'ε'); else if(o.rim==='none') g.put(xx,y,c); else if(o.rim==='top') g.put(xx,y,c); continue; }
    if(o.clear&&g.at(xx,y)==='E') continue; g.put(xx,y,y===t+1&&dx===-1&&!o.clear?'η':c); } }
function glasses(g,v,o){ const [a,b]=EYES(v), lens=o.clear?'η':'ζ';
  if(v==='back'){ g.put(1,11,'ε'); g.put(18,11,'ε'); return; }
  if(o.kind==='visor'){ g.rect(a-3,10,b+3,12,'ζ'); g.rect(a-3,10,b+3,10,'ε'); g.rect(a-2,11,a,11,'η'); return; }
  if(o.kind==='goggle'){ const [l,r]=g.span(11); g.rect(l,11,r,11,'ε'); lensBox(g,a,lens,{shape:'round',t:9,b:13}); lensBox(g,b,lens,{shape:'round',t:9,b:13}); return; }
  if(o.kind==='mono'){ lensBox(g,b,'η',{shape:'round',clear:1}); g.rect(b+2,13,b+2,16,'Ω'); return; }
  const L=o.kind==='3d'?'Ж':lens, R=o.kind==='3d'?'З':lens;
  if(o.kind==='heart'||o.kind==='star'){ const pat=o.kind==='heart'?[[-2,10],[-1,10],[1,10],[2,10],[-2,11],[-1,11],[0,11],[1,11],[2,11],[-1,12],[0,12],[1,12],[0,13]]:[[0,9],[-1,10],[0,10],[1,10],[-2,11],[-1,11],[0,11],[1,11],[2,11],[-1,12],[1,12],[-2,13],[2,13]];
    for(const [x0,c] of [[a,L],[b,R]]) for(const [dx,y] of pat) g.put(x0+dx,y,c); }
  else { lensBox(g,a,L,o); lensBox(g,b,R,o); if(o.x==='cat'){ g.put(a-3,9,'ε'); g.put(b+3,9,'ε'); g.put(a-2,9,'ε'); g.put(b+2,9,'ε'); } }
  g.rect(a+3,11,b-3,11,'ε'); if(o.tape) g.rect(Math.round((a+b)/2)-1,11,Math.round((a+b)/2),12,'ω');
  if(v==='side') g.rect(5,11,a-3,11,'ε'); else { g.rect(2,11,a-3,11,'ε'); g.rect(b+3,11,17,11,'ε'); } }
const GL={round:{shape:'round'},square:{},cat:{x:'cat'},avi:{shape:'avi'},heart:{kind:'heart'},star:{kind:'star'},visor:{kind:'visor'},mono:{kind:'mono'},'3d':{kind:'3d'},goggle:{kind:'goggle'},
  rimless:{rim:'none',clear:1},half:{rim:'top'},clear:{shape:'round',clear:1},nerd:{tape:1},oval:{shape:'round',t:11,b:12}};
/* ---------- khăn, nơ, cà vạt (cổ hàng 17..19) ---------- */
function scarf(g,v,k){ const st=(x,y)=>k==='stripe'?(x%2?'θ':'κ'):k==='check'?((x+y)%2?'θ':(x%3?'ι':'κ')):k==='knit'?((x+y)%3?'θ':'ι'):'θ';
  if(k==='bow'){ if(v!=='back') { const c=v==='side'?13:9; g.rect(c-2,19,c+3,20,'θ'); g.rect(c,19,c+1,20,'κ'); } return; }
  if(k==='tie'){ if(v==='front'){ g.rect(9,19,10,19,'κ'); g.rect(9,20,10,25,'θ'); g.put(9,26,'θ'); for(let y=21;y<=25;y+=2) g.put(10,y,'ι'); } if(v==='side'){ g.rect(14,19,14,24,'θ'); } return; }
  if(k==='pearl'){ const [l,r]=g.span(19); for(let x=l+2;x<=r-2;x++) if(x%2===0) g.put(x,19,'ω'); return; }
  for(let y=17;y<=19;y++){ const [l,r]=g.span(y); for(let x=Math.max(l,3);x<=Math.min(r,16);x++) g.put(x,y,y===19?'ι':st(x,y)); }
  if(k==='bandana'){ if(v==='front') for(let y=20;y<=23;y++) g.rect(5+(y-20)*1,y,14-(y-20)*1,y,'θ'); return; }
  const n=k==='long'?28:24;
  if(v==='front') for(let y=20;y<=n;y++) g.rect(5,y,6,y,st(5,y));
  if(v==='side') for(let y=18;y<=n-2;y++) g.rect(3-Math.floor((y-18)/3),y,4-Math.floor((y-18)/3),y,st(3,y));
  if(v==='back') for(let y=20;y<=n;y++) g.rect(9,y,10,y,st(9,y)); }
/* ---------- hoạ tiết áo + logo ---------- */
const GLYPH={D:['XX.','X.X','X.X','XX.'],A:['.X.','X.X','XXX','X.X'],S:['.XX','X..','..X','XX.'],L:['X..','X..','X..','XXX'],1:['.X','XX','.X','.X'],0:['XXX','X.X','X.X','XXX']};
function text(g,x,y,s,c){ for(const ch of s){ const G=GLYPH[ch]; if(!G){ x+=2; continue; } G.forEach((row,j)=>[...row].forEach((q,i)=>{ if(q==='X') g.put(x+i,y+j,c); })); x+=G[0].length+1; } }
function pattern(g,v,k){ const front=v==='front', side=v==='side', top=(x,y)=>TOP.includes(g.at(x,y));
  const each=(y0,y1,f)=>g.rows(y0,y1,(x,y,c)=>{ if(TOP.includes(c)) f(x,y,c); });
  if(k==='hs') each(19,26,(x,y)=>{ if(y%2===0) g.put(x,y,'λ'); });
  if(k==='block') each(19,22,(x,y)=>g.put(x,y,'λ'));
  if(k==='low') each(23,26,(x,y)=>g.put(x,y,'λ'));
  if(k==='rag') each(19,26,(x,y,c)=>{ if(c==='t'||c==='q') g.put(x,y,'λ'); });
  if(k==='collar') each(19,19,(x,y)=>g.put(x,y,'λ'));
  if(k==='check') each(19,26,(x,y)=>{ if((Math.floor(x/2)+Math.floor(y/2))%2) g.put(x,y,'λ'); });
  if(k==='camo') each(19,26,(x,y)=>{ const h=(x*7+y*13)%9; if(h<2) g.put(x,y,'λ'); else if(h===4) g.put(x,y,'μ'); });
  if(k==='tiedye') each(19,26,(x,y)=>{ const d=Math.round(Math.hypot(x-(side?11:9.5),y-22)); if(d%3===0) g.put(x,y,'λ'); else if(d%3===1) g.put(x,y,'μ'); });
  if(k==='zip'&&front) for(let y=19;y<=25;y++) if(top(9,y)) g.put(9,y,'μ');
  if(k==='pocket'){ if(front) g.rect(12,21,14,22,'λ'); if(side) g.rect(13,21,15,22,'λ'); }
  if(k==='hood'){ if(v==='back') for(let y=17;y<=20;y++) g.rect(5,y,14,y,y===17?'t':'T'); if(side) for(let y=16;y<=20;y++) g.rect(3,y,6,y,'T'); if(front){ g.rect(3,18,4,19,'T'); g.rect(15,18,16,19,'T'); } }
  if(k==='heart'&&front) for(const [x,y] of [[8,20],[11,20],[7,21],[8,21],[9,21],[10,21],[11,21],[12,21],[8,22],[9,22],[10,22],[11,22],[9,23],[10,23]]) g.put(x,y,'λ');
  if(k==='star'&&front) for(const [x,y] of [[9,20],[10,20],[7,21],[8,21],[9,21],[10,21],[11,21],[12,21],[8,22],[9,22],[10,22],[11,22],[8,23],[11,23]]) g.put(x,y,'λ');
  if(k==='jersey'){ if(v==='back') text(g,6,20,'10','λ'); if(front) text(g,12,20,'10','λ'); if(side) text(g,12,20,'1','λ'); }
  if(k==='lumen'){ if(front){ g.rect(6,20,13,24,'υ'); text(g,7,20,'L','φ'); g.rect(11,21,12,22,'Ω'); } if(v==='back'){ g.rect(5,20,14,24,'υ'); text(g,6,20,'L','φ'); g.rect(10,21,13,22,'Ω'); } if(side) g.rect(12,20,15,23,'υ'); }
  if(k==='das'){ if(front){ g.rect(4,20,15,24,'χ'); text(g,5,20,'DAS','ψ'); } if(v==='back'){ g.rect(4,20,15,24,'χ'); text(g,5,20,'DAS','ψ'); } if(side){ g.rect(11,20,16,24,'χ'); text(g,12,20,'D','ψ'); } } }
/* ---------- hoạ tiết quần ---------- */
function pattern2(g,v,k){ const legs=f=>g.rows(27,34,(x,y,c)=>{ if(LEG.includes(c)) f(x,y,c); }), side=v==='side';
  if(k==='side') legs((x,y)=>{ if(side?(x===6||x===12):(x===5||x===14)) g.put(x,y,'ν'); });
  if(k==='cargo') legs((x,y)=>{ if(y>=28&&y<=29&&(side?(x>=8&&x<=9):(x===6||x===7||x===12||x===13))) g.put(x,y,'ν'); });
  if(k==='check') legs((x,y)=>{ if((x+y)%2===0) g.put(x,y,'ν'); });
  if(k==='wash') legs((x,y)=>{ if(y>=29&&y<=30&&(side?(x===8||x===13):(x===7||x===12))) g.put(x,y,'ν'); });
  if(k==='pleat') legs((x,y)=>{ if(x%2===0) g.put(x,y,'p'); });
  if(k==='cuff'){ const low={}; legs((x,y)=>{ low[x]=Math.max(low[x]||0,y); }); for(const x in low) g.put(+x,low[x],'ν'); } }
/* ---------- kiểu giày (hàng F trên / f đế) ---------- */
function shoe(g,v,k){ const at=(f)=>g.rows(27,34,(x,y,c)=>f(x,y,c));
  if(k==='sole') at((x,y,c)=>{ if(c==='f') g.put(x,y,'ξ'); });
  if(k==='stripe') at((x,y,c)=>{ if(c==='F'&&x%3===1) g.put(x,y,'ξ'); });
  if(k==='lace') at((x,y,c)=>{ if(c==='F'&&x%2===0) g.put(x,y,'ξ'); });
  if(k==='toe') at((x,y,c)=>{ if(c==='f'&&(g.at(x-1,y)!=='f'||g.at(x+1,y)!=='f')) g.put(x,y,'ξ'); });
  if(k==='high'||k==='boot'){ const top={}; at((x,y,c)=>{ if(c==='F') top[x]=Math.min(top[x]??99,y); }); at((x,y,c)=>{ if(LEG.includes(c)&&top[x]!==undefined&&y>=top[x]-(k==='boot'?3:1)) g.put(x,y,y===top[x]-(k==='boot'?3:1)?'π':'F'); }); if(k==='high') at((x,y,c)=>{ if(c==='f') g.put(x,y,'ξ'); }); }
  if(k==='sandal') at((x,y,c)=>{ if(c==='F') g.put(x,y,x%2?'ξ':'S'); if(c==='f') g.put(x,y,'π'); }); }
/* ---------- kiểu tóc (màu tóc của người chơi: ϰ sáng / ϱ tối) ---------- */
function hair(g,v,k){ const s=v==='side', f=v==='front', b=v==='back', c=Math.round(cx(v));
  if(k==='spiky'){ const xs=s?[3,6,9,12,15]:[3,6,9,12,15]; for(const x of xs){ for(let i=0;i<4;i++) g.rect(x-(1-Math.floor(i/2)),-i+1,x+(1-Math.floor(i/2)),-i+1,i>2?'ϱ':'ϰ'); } if(s) for(let i=0;i<3;i++) g.rect(-1-i,4+i,0-i,5+i,'ϰ'); }
  if(k==='mohawk'){ if(s) for(let x=3;x<=14;x++) g.rect(x,-3+Math.abs(x-9)/3,x,1,x%2?'ϰ':'ϱ'); else g.rect(c-1,-4,c,3,'ϰ'); }
  if(k==='twin'){ if(s) for(let y=4;y<=20;y++) g.rect(-1,y,1,y,y%3?'ϰ':'ϱ'); else for(let y=4;y<=20;y++){ g.rect(-1,y,1,y,y%3?'ϰ':'ϱ'); g.rect(18,y,20,y,y%3?'ϰ':'ϱ'); } }
  if(k==='odango'){ const xs=s?[5,13]:[4,15]; for(const x of xs) g.ell(x,-1,2,2,(xx,yy)=>g.put(xx,yy,'ϰ')); }
  if(k==='mullet'){ if(b) g.rect(4,12,15,19,'ϰ'); if(s) g.rect(0,9,5,19,'ϰ'); if(f){ g.rect(1,10,2,15,'ϰ'); g.rect(17,10,18,15,'ϰ'); } }
  if(k==='curly'){ const [l,r]=g.span(2); for(let x=l-1;x<=r+1;x+=2) g.rect(x,-1,x+1,0,(x>>1)%2?'ϰ':'ϱ'); g.rect(l-1,1,l,8,'ϰ'); g.rect(r,1,r+1,8,'ϰ'); }
  if(k==='wavy'){ if(s) for(let y=6;y<=23;y++) g.rect(-1+(y%4>1?1:0),y,3+(y%4>1?1:0),y,'ϰ'); else for(let y=8;y<=23;y++){ const o=y%4>1?1:0; g.rect(o,y,2+o,y,'ϰ'); g.rect(17-o,y,19-o,y,'ϰ'); } if(b) g.rect(3,12,16,23,'ϰ'); }
  if(k==='pomp'){ if(s) for(let y=-3;y<=1;y++) g.rect(9+(y+3),y,18,y,y===-3?'ϱ':'ϰ'); else for(let y=-3;y<=1;y++) g.rect(5,y,14,y,y===-3?'ϱ':'ϰ'); }
  if(k==='bun'){ const x=s?4:c; g.ell(x,-2,2,2,(xx,yy)=>g.put(xx,yy,'ϰ')); g.put(x,-2,'ϱ'); }
  if(k==='dread'){ if(s) for(let x=0;x<=6;x+=2) g.rect(x,8,x,20,x%4?'ϰ':'ϱ'); else for(const x of [1,3,16,18]) g.rect(x,8,x,20,x%4?'ϰ':'ϱ'); if(b) for(let x=4;x<=15;x+=2) g.rect(x,12,x,21,'ϰ'); }
  if(k==='emo'){ if(f) g.rect(9,6,15,12,'ϰ'); if(s) g.rect(11,6,18,10,'ϰ'); }
  if(k==='hime'){ if(f){ g.rect(3,6,16,8,'ϰ'); g.rect(2,9,3,18,'ϰ'); g.rect(16,9,17,18,'ϰ'); } if(s){ g.rect(9,6,18,8,'ϰ'); g.rect(0,8,4,20,'ϰ'); } if(b) g.rect(3,10,16,20,'ϰ'); }
  if(k==='braid'){ if(b) for(let y=12;y<=27;y++) g.rect(9,y,10,y,y%2?'ϰ':'ϱ'); if(s) for(let y=10;y<=25;y++) g.rect(1,y,2,y,y%2?'ϰ':'ϱ'); }
  if(k==='side'){ if(f) g.rect(3,5,9,7,'ϰ'); if(s) g.rect(8,5,17,7,'ϰ'); } }
/* ---------- khuôn mặt (không vẽ ở khung nhìn sau) ---------- */
function face(g,v,k){ if(v==='back') return; const s=v==='side', [ea,eb]=EYES(v), skin=(x,y)=>SKIN.includes(g.at(x,y))||g.at(x,y)==='n';
  const P=(x,y,c)=>{ if(skin(x,y)) g.put(x,y,c); };
  if(k==='blush'){ if(s){ P(15,14,'ρ'); P(16,14,'ρ'); P(9,14,'ρ'); } else { P(4,14,'ρ'); P(5,14,'ρ'); P(14,14,'ρ'); P(15,14,'ρ'); } }
  if(k==='freckle') for(const [x,y] of s?[[14,13],[16,13],[15,14],[9,13]]:[[4,13],[6,13],[5,14],[13,13],[15,13],[14,14]]) P(x,y,'σ');
  if(k==='beard') g.rows(14,18,(x,y,c)=>{ if(SKIN.includes(c)&&(s?x>=6:x>=3&&x<=16)) g.put(x,y,'σ'); });
  if(k==='goatee') g.rows(16,18,(x,y,c)=>{ if(SKIN.includes(c)&&(s?x>=12&&x<=15:x>=8&&x<=11)) g.put(x,y,'σ'); });
  if(k==='stache'){ if(s) g.rect(12,14,15,14,'σ'); else g.rect(7,14,12,14,'σ'); }
  if(k==='stubble') g.rows(14,18,(x,y,c)=>{ if(SKIN.includes(c)&&(x+y)%2&&(s?x>=7:x>=4&&x<=15)) g.put(x,y,'σ'); });
  if(k==='scar'){ if(s){ P(16,10,'ρ'); P(16,12,'ρ'); P(17,13,'ρ'); } else { P(14,9,'ρ'); P(15,10,'ρ'); P(15,12,'ρ'); P(16,13,'ρ'); } }
  if(k==='paint'){ if(s){ P(15,13,'τ'); P(16,13,'τ'); P(15,14,'τ'); P(16,14,'τ'); } else { P(3,13,'τ'); P(4,13,'τ'); P(15,13,'τ'); P(16,13,'τ'); P(3,14,'τ'); P(16,14,'τ'); } }
  if(k==='mole') P(s?16:13,14,'σ');
  if(k==='bandaid'){ if(s){ P(15,13,'ω'); P(16,13,'ω'); } else { P(12,13,'ω'); P(13,13,'ω'); P(14,13,'ω'); } }
  if(k==='whisker'){ if(s) for(const y of [13,15]) g.rect(16,y,18,y,'σ'); else for(const y of [13,15]){ P(3,y,'σ'); P(4,y,'σ'); P(15,y,'σ'); P(16,y,'σ'); } }
  if(k==='tear') P(eb,13,'τ');
  if(k==='lip') g.rows(14,16,(x,y,c)=>{ if(c==='m') g.put(x,y,'ρ'); });
  if(k==='bigeye') for(const x of [ea,eb]){ g.rect(x-1,11,x,12,'Ψ'); g.put(x-1,11,'ω'); }
  if(k==='sleepy') for(const x of [ea,eb]){ if(g.at(x,11)==='E') g.put(x,11,'S'); g.rect(x-1,12,x+1,12,'Ψ'); }
  if(k==='wink'){ if(g.at(eb,11)==='E') g.put(eb,11,'S'); g.rect(eb-1,12,eb+1,12,'Ψ'); }
  if(k==='hearteye') for(const x of [ea,eb]) for(const [dx,y] of [[-1,10],[1,10],[-1,11],[0,11],[1,11],[0,12]]) g.put(x+dx,y,'Ж'); }
/* ---------- vẽ cả bộ: khung nhìn thẳng / sau dò hàng vai để bám theo nhịp nhún ---------- */
function draw(U,o,v){ let dy=0;
  if(v!=='side'){ for(let y=10;y<=24;y++){ const [l,r]=U.span(y); let hit=false; for(let x=l;x<=r;x++) if(TOP.includes(U.at(x,y))){ hit=true; break; } if(hit){ dy=y-19; break; } } }
  const g=dy?{...U,at:(x,y)=>U.at(x,y+dy),put:(x,y,c)=>U.put(x,y+dy,c),rect:(x0,y0,x1,y1,c)=>U.rect(x0,y0+dy,x1,y1+dy,c),span:y=>U.span(y+dy),
    rows:(y0,y1,f)=>U.rows(y0+dy,y1+dy,(x,y,c)=>f(x,y-dy,c)),ell:(cx_,cy,rx,ry,f)=>U.ell(cx_,cy+dy,rx,ry,(x,y,a,b,w)=>f(x,y-dy,a,b,w))}:U;
  if(o.hx) hair(g,v,o.hx);
  if(o.fc) for(const k of String(o.fc).split('+')) face(g,v,k);
  if(o.pat) for(const k of String(o.pat).split('+')) pattern(g,v,k);
  if(o.pat2) pattern2(U,v,o.pat2);
  if(o.shoe) shoe(U,v,o.shoe);
  if(o.scarf) scarf(g,v,o.scarf);
  if(o.gl&&GL[o.gl]) glasses(g,v,{...GL[o.gl],clear:GL[o.gl].clear||o.glClear});
  if(o.hat&&HAT[o.hat]) HAT[o.hat](g,v); }
window.WEAR={need,pal,draw,HATS:Object.keys(HAT),GLASSES:Object.keys(GL)};
})();
