/* Chan City — 50 vũ khí của Thợ Rèn Huyền Thoại (MU): 10 loại × 5 hệ, vẽ bằng khối có đổ bóng (A.vol của art13) trên trục chéo
   (chuôi dưới trái → mũi trên phải) để xoay được khi vung. Mỗi hệ có màu lưỡi / màu đốc / ngọc riêng. Icon 14×14 cho túi đồ, sprite 24×24 cho bảng + hiệu ứng vung.
   Kèm quầy Thợ Rèn: mái ngói, giá treo vũ khí, đe, lò lửa. */
(function(){
const A=ART, vol=A.vol, SD=SHARED;
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.55),b,mix(b,[20,10,50],.32),mix(b,[10,5,30],.6)].map(v=>[...v,255]); };
// màu theo hệ: lưỡi, đốc / phụ kiện, ngọc, cán
const EL={poison:{blade:'#7ae05a',guard:'#6a3a9a',gem:'#d8ff6a',grip:'#3a2a3a'},ice:{blade:'#9ae8ff',guard:'#c8ccd8',gem:'#3a8ae8',grip:'#2a3a5a'},
  fire:{blade:'#ff7a2a',guard:'#e8b030',gem:'#e8202a',grip:'#5a2a1a'},thunder:{blade:'#ffe066',guard:'#2c2c5c',gem:'#b070ff',grip:'#1c1c34'},void:{blade:'#9a4ae8',guard:'#2a1830',gem:'#ff4ab8',grip:'#140a1a'}};
// vẽ 1 vũ khí lên lưới N×N; toạ độ theo trục chéo: u 0 (cuối chuôi) → 1 (mũi), v lệch vuông góc (đơn vị theo lưới 24)
function draw(type,el,N){ const V=vol(N,N), k=N/24, c=EL[el], B=R(c.blade), G=R(c.guard), M=R(c.grip), Gm=R(c.gem);
  const P=(u,v=0)=>[(3+18*u+v*.707)*k,(21-18*u+v*.707)*k], r=x=>Math.max(.45,x*k), T=(us,vs,rs,ramp,o)=>V.tube(us.map((u,i)=>P(u,vs[i]||0)),rs.map(r),ramp,o);
  const gem=(u,v,rr)=>V.ell(...P(u,v),r(rr),r(rr),Gm), poly=(pts,ramp)=>V.poly(pts.map(([u,v])=>P(u,v)),ramp,{n:[-.3,-.35,.88]});
  switch(type){
  case 'sword': T([.1,.34],[0,0],[1.5,1.5],M); T([.34,.98],[0,0],[2.5,.6],B); T([.34,.34],[-5.5,5.5],[1.8,1.8],G); gem(.07,0,2); gem(.34,0,1.2); break;
  case 'greatsword': T([.08,.3],[0,0],[1.6,1.6],M); T([.3,1],[0,0],[4,1],B); T([.31,.31],[-7.5,7.5],[2.1,2.1],G); gem(.32,0,1.8); gem(.05,0,2.1); break;
  case 'dagger': T([.2,.42],[0,0],[1.4,1.4],M); T([.42,.92],[0,0],[2.4,.5],B); T([.4,.46,.4],[-4.5,0,4.5],[1.5,1.6,1.5],G); gem(.16,0,1.8); break;
  case 'katana': { const us=[.34,.5,.65,.8,.99]; T(us,us.map(u=>2.2*Math.sin(Math.PI*(u-.34)/.65)),[1.8,1.7,1.5,1.1,.5],B); T([.08,.32],[0,0],[1.4,1.4],M); V.ell(...P(.33,0),r(3),r(3),G); gem(.05,0,1.4); break; }
  case 'axe': T([.03,.92],[0,0],[1.3,1.1],M); poly([[.55,-1.5],[.95,-1.5],[1.04,-7],[.84,-12],[.58,-9]],B); poly([[.66,1.3],[.88,1.3],[.82,5]],G); gem(.78,0,1.7); break;
  case 'hammer': T([.03,.78],[0,0],[1.4,1.3],M); poly([[.66,-7],[.99,-7],[.99,7],[.66,7]],B); T([.66,.99],[0,0],[2.2,2.2],G); gem(.83,0,2); break;
  case 'scythe': T([.02,.92],[0,0],[1.2,1.2],M); T([.92,1,.95,.8,.55],[0,-4,-8.5,-11.5,-12],[3.1,2.8,2.3,1.5,.5],B); gem(.92,0,1.8); break;
  case 'spear': T([.02,.76],[0,0],[1.15,1.1],M); poly([[.7,0],[.84,-3.8],[1.04,0],[.84,3.8]],B); T([.72,.62],[1.4,4.6],[1.1,.4],G); T([.72,.62],[-1.4,-4.6],[1.1,.4],G); gem(.72,0,1.5); break;
  case 'bow': { const us=[.03,.25,.5,.75,.97]; T(us,us.map(u=>7.5*Math.sin(Math.PI*u)),[1.1,1.8,2.2,1.8,1.1],G); V.line(...P(.03,0).map(Math.round),...P(.97,0).map(Math.round),'#f4f0e0');
    T([.44,.56],[7,7.6],[1.6,1.6],M); T([.12,.92],[2,2],[.6,.6],R('#c8a070')); poly([[.88,.4],[.99,2],[.88,3.6]],B); gem(.5,7.4,1.3); break; }
  case 'staff': T([.02,.76],[0,0],[1.4,1.2],M); T([.72,.93],[0,-4.6],[1.2,.5],G); T([.72,.93],[0,4.6],[1.2,.5],G); V.ell(...P(.89,0),r(3.9),r(3.9),B); gem(.91,0,1.8); V.px(...P(.84,-1.5).map(Math.round),'#ffffff'); break; }
  return V.done(false); }
const SPR={}, ICN={};
// sprite 24×24 kèm điểm xoay (cuối chuôi) để vung
A.muWeapon=(k,N=24)=>{ const key=k+N; if(SPR[key]) return SPR[key]; const w=SD.MU.weapons[k]; if(!w||!w.store) return null; const c=draw(w.type,w.el,N), s=N/24; return SPR[key]={c,px:Math.round((3+18*.08)*s),py:Math.round((21-18*.08)*s)}; };
const oldIcon=A.icon;
A.icon=function(name,scale=1){ const k=name.startsWith('wpn_')&&'vw_'+name.slice(4), w=k&&SD.MU.weapons[k]; if(!w) return oldIcon(name,scale);
  const c=ICN[k]||(ICN[k]=draw(w.type,w.el,14)); if(scale===1) return c; const s=A.cv(14*scale,14*scale), g=s.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,s.width,s.height); return s; };
// quầy Thợ Rèn: mái ngói đỏ xám, giá treo 3 vũ khí, đe sắt, lò lửa
A.muSmithStall=()=>A.sprite(56,46,28,44,(g,P)=>{ for(let i=0;i<8;i++) P.rect(2+Math.round(i*6.5),6,7,10,i%2?'#8a8a94':'#a8302a'); P.rect(2,16,52,2,'#5a3a22');
  P.rect(4,18,2,26,'#5a3a22'); P.rect(50,18,2,26,'#5a3a22'); P.rect(8,19,40,10,'#4a3428'); P.rect(8,19,40,1,'#6a4a38');
  for(const [x,c] of [[14,'#9ae8ff'],[24,'#ff7a2a'],[34,'#9a4ae8']]){ for(let i=0;i<9;i++) P.rect(x+i-4,27-i,2,2,c); P.rect(x-5,24,4,1,'#e8b030'); P.rect(x-6,27,2,2,'#5a3a22'); }
  P.rect(40,22,6,6,'#2a2a32'); P.rect(41,22,4,2,'#ff8a2a'); P.rect(42,21,2,1,'#ffe066');
  P.rect(14,34,18,4,'#3a3a44'); P.rect(12,33,22,2,'#5a5a66'); P.rect(19,38,8,6,'#3a3a44'); P.rect(4,32,6,12,'#6a4a38');
  P.rect(12,0,32,7,'#1c1516'); A.drawText(g,'THO REN',15,1,'#ff9a3a'); });
})();
