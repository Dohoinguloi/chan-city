/* Chan City — vẽ lại 5 boss MU (Luffy Gear 5, Naruto Cửu Vĩ, Quỷ Cưa, Dươngg Vũ bóng ma tím, Rồng Dải Xanh) bằng "khối có đổ bóng":
   mỗi khối (elip, ống thuôn theo đường gấp khúc, đa giác) tô theo dải 4 tông màu tính từ pháp tuyến giả 3D, ánh sáng chiếu từ trên-trái;
   khối vẽ sau đè lên khối vẽ trước thì mép chỗ đè tô tông tối nhất (tách mảng rõ như pixel art vẽ tay), cuối cùng viền ngoài đen.
   Mỗi boss 2 khung (thở / vung tay) + bản chớp trắng khi trúng đòn. Ghi đè A.muBossSprite của art12. */
(function(){
const A=ART;
const hex=c=>{ c=c.replace('#',''); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16),c.length>6?parseInt(c.slice(6,8),16):255]; };
const R=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v.map(hex)]));
// dải màu: sáng nhất → sáng → vừa → tối
const RP=R({white:['#ffffff','#f0f2f6','#ccd0dc','#9a9eb2'],skin:['#ffdcb6','#f6bc8a','#da9462','#a8663e'],purple:['#dcbcff','#ac7eec','#7c4cca','#4e2a8c'],
  yellow:['#fff6a8','#ffd84a','#e2a222','#a46a12'],red:['#ff9282','#ea442e','#b8221c','#781212'],orange:['#ffc878','#ff8c2c','#da5c12','#94380a'],
  blue:['#acccff','#4c7cea','#2c4cba','#1a2a7a'],black:['#70707e','#484852','#2c2c34','#18181e'],metal:['#ffffff','#dadee6','#9ca2b0','#5c6272'],
  brown:['#dca474','#aa724a','#7c4c2c','#4c2e1a'],ghost:['#ccacf4','#9c74da','#7048b2','#46287c'],green:['#90f2a6','#40ba62','#24864c','#105432'],
  chakra:['#ffe0a0e0','#ffa040d8','#f0502ad0','#b0202ac8'],shade:['#5a3a8a90','#4a2a7a90','#3a1a6a90','#2a0a5a90'],straw:['#fff2a6','#f4d460','#d6aa34','#9c7420']});
const INK=hex('#1c1516');
const LV=(()=>{ const x=-.5,y=-.62,z=.6, n=Math.hypot(x,y,z); return [x/n,y/n,z/n]; })();
function vol(w,h){ const N=w*h, ord=new Int32Array(N).fill(-1), grp=new Array(N), ramp=new Array(N), tone=new Uint8Array(N), ink=new Uint8Array(N), det=[]; let k=0;
  const put=(x,y,r,nx,ny,nz,o)=>{ if(x<0||y<0||x>=w||y>=h) return; const i=y*w+x; let d=nx*LV[0]+ny*LV[1]+nz*LV[2]; if(o.flat) d=d*(1-o.flat)+LV[2]*o.flat; d+=o.lift||0;
    ord[i]=k; grp[i]=o.g??k; ramp[i]=r; tone[i]=Math.max(o.min||0,Math.min(o.max??3,d>.86?0:d>.5?1:d>.08?2:3)); ink[i]=o.ink?1:0; };
  const V={w,h,
    ell(cx,cy,rx,ry,r,o={}){ k++; for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){ const u=(x+.5-cx)/rx, v=(y+.5-cy)/ry, q=u*u+v*v; if(q<=1) put(x,y,r,u,v,Math.sqrt(1-q),o); } return V; },
    // ống thuôn: đi qua các điểm, bán kính từng điểm (số hoặc mảng), tô như hình trụ
    tube(pts,rad,r,o={}){ k++; const Rd=i=>Array.isArray(rad)?rad[i]:rad; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      pts.forEach((p,i)=>{ const q=Rd(i); x0=Math.min(x0,p[0]-q); y0=Math.min(y0,p[1]-q); x1=Math.max(x1,p[0]+q); y1=Math.max(y1,p[1]+q); });
      for(let y=Math.floor(y0);y<=Math.ceil(y1);y++) for(let x=Math.floor(x0);x<=Math.ceil(x1);x++){ const px=x+.5, py=y+.5; let best=null;
        for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1], dx=b[0]-a[0], dy=b[1]-a[1], l2=dx*dx+dy*dy||1, t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/l2)), qx=a[0]+dx*t, qy=a[1]+dy*t, rr=Rd(i)+(Rd(i+1)-Rd(i))*t, dd=Math.hypot(px-qx,py-qy);
          if(rr>0&&dd<=rr&&(!best||dd/rr<best.f)) best={f:dd/rr,nx:(px-qx)/rr,ny:(py-qy)/rr}; }
        if(best){ const q=Math.min(1,best.nx*best.nx+best.ny*best.ny); put(x,y,r,best.nx,best.ny,Math.sqrt(1-q),o); } } return V; },
    // đa giác phẳng (mảnh áo, lưỡi cưa, mắt): o.n là pháp tuyến cố định
    poly(pts,r,o={}){ k++; const n=o.n||[-.25,-.3,.92]; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(const p of pts){ x0=Math.min(x0,p[0]); y0=Math.min(y0,p[1]); x1=Math.max(x1,p[0]); y1=Math.max(y1,p[1]); }
      for(let y=Math.floor(y0);y<=Math.ceil(y1);y++) for(let x=Math.floor(x0);x<=Math.ceil(x1);x++){ const px=x+.5, py=y+.5; let inside=false;
        for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const a=pts[i], b=pts[j]; if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0]) inside=!inside; }
        if(inside) put(x,y,r,n[0],n[1],n[2],o); } return V; },
    px(x,y,c){ det.push(['r',x,y,1,1,c]); return V; }, rect(x,y,w2,h2,c){ det.push(['r',x,y,w2,h2,c]); return V; },
    line(x0,y0,x1,y1,c){ const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1; for(let i=0;i<=n;i++) det.push(['r',Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1,c]); return V; },
    // ra canvas: mép chỗ đè → tông tối (ink thì đen), chi tiết vẽ thẳng, glow quanh viền (hào quang chakra...), viền đen ngoài, chớp trắng khi trúng đòn
    done(hit,o={}){ const c=A.cv(w,h), g=c.getContext('2d'), im=g.createImageData(w,h), d=im.data;
      for(let i=0;i<N;i++){ if(ord[i]<0) continue; const x=i%w; let t=tone[i], inked=false;
        for(const j of [i-1,i+1,i-w,i+w]){ if(j<0||j>=N||(j===i-1&&x===0)||(j===i+1&&x===w-1)) continue; if(ord[j]>=0&&ord[j]<ord[i]&&grp[j]!==grp[i]){ t=3; if(ink[i]) inked=true; } }
        d.set(inked?[...INK.slice(0,3),255]:ramp[i][t],i*4); }
      g.putImageData(im,0,0); for(const [,x,y,w2,h2,col] of det){ g.fillStyle=col; g.fillRect(x,y,w2,h2); }
      if(o.glow){ const m=g.getImageData(0,0,w,h), md=m.data, gl=A.cv(w,h), gg=gl.getContext('2d'); gg.fillStyle=o.glow;
        for(let y=0;y<h;y++) for(let x=0;x<w;x++){ if(md[(y*w+x)*4+3]>40) continue; let near=false; for(let dy=-o.gr;dy<=o.gr&&!near;dy++) for(let dx=-o.gr;dx<=o.gr;dx++){ const X=x+dx, Y=y+dy; if(X>=0&&Y>=0&&X<w&&Y<h&&dx*dx+dy*dy<=o.gr*o.gr&&md[(Y*w+X)*4+3]>40){ near=true; break; } } if(near) gg.fillRect(x,y,1,1); }
        A.outline(c); g.globalCompositeOperation='destination-over'; g.drawImage(gl,0,0); g.globalCompositeOperation='source-over'; }
      else A.outline(c);
      if(hit){ const m=g.getImageData(0,0,w,h), md=m.data; for(let i=0;i<md.length;i+=4){ if(!md[i+3]) continue; md[i]+=(255-md[i])*.72; md[i+1]+=(255-md[i+1])*.72; md[i+2]+=(255-md[i+2])*.72; } g.putImageData(m,0,0); }
      return c; } };
  return V; }
const spr=(c,ax,ay)=>({c,ax,ay});
const arc=(cx,cy,rx,ry,a0,a1,n)=>Array.from({length:n},(_,i)=>{ const a=(a0+(a1-a0)*i/(n-1))*Math.PI/180; return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]; });

/* ---------- Luffy Gear 5: tóc trắng bốc như lửa, khăn mây quấn vai, áo khoác trắng mở ngực, đai tím, cười toe, mắt vòng đỏ ---------- */
function luffy(fr,hit){ const V=vol(110,120), cx=55, b=fr?1:0, Wt=RP.white, Sk=RP.skin;
  // mây sau lưng + mũ rơm đeo sau lưng
  for(const [x,y] of arc(cx,60,34,17,-172,-8,8)) V.ell(x,y-b,10,8,Wt,{g:'cloud',lift:.1});
  V.ell(80,47,15,5,RP.straw,{flat:.2}).ell(80,43,9,6,RP.straw);
  // chân: ống chân trần, quần trắng ống rộng tới gối, dép
  V.tube([[44,101],[40,113]],[4,3.5],Sk).tube([[68,101],[71,113]],[4,3.5],Sk);
  V.ell(39,115,7,3,RP.brown).ell(72,115,7,3,RP.brown);
  V.tube([[48,86],[42,101]],[9,7.5],Wt,{flat:.25}).tube([[62,86],[68,101]],[9,7.5],Wt,{flat:.25});
  // thân: ngực trần, 2 vạt áo trắng, đai tím thắt nút
  V.ell(cx,68-b,13,15,Sk).tube([[43,55-b],[44,82]],[6,7],Wt,{flat:.2}).tube([[67,55-b],[66,82]],[6,7],Wt,{flat:.2});
  V.tube([[41,84],[69,84]],4.5,RP.purple).tube([[62,86],[66,97]],[3,2],RP.purple);
  // tay: 1 tay giơ nắm đấm, 1 tay dang (đổi bên theo khung)
  const L=fr?[[41,57],[27,65],[15,60]]:[[41,57],[31,47],[27,33]], Rr=fr?[[69,57],[79,47],[83,33]]:[[69,57],[83,65],[95,59]];
  V.tube(L,[5.5,5,4.5],Sk).ell(L[2][0]+(fr?-3:0),L[2][1]+(fr?-1:-3),6,6,Sk).tube(Rr,[5.5,5,4.5],Sk).ell(Rr[2][0]+(fr?0:3),Rr[2][1]+(fr?-3:-1),6,6,Sk);
  for(const [x,y] of [[37,55],[73,55]]) V.ell(x,y-b,8,6,Wt,{g:'cloud2',lift:.15});
  // đầu, tóc trắng xoăn bốc lên
  V.tube([[cx,50-b],[cx,56-b]],5,Sk).ell(cx,41-b,13,14,Sk);
  const hy=27-b; V.ell(cx,hy,18,10,Wt,{g:'hair',lift:.1});
  for(const [x,y,rx,ry] of [[40,hy+2,8,8],[70,hy+2,8,8],[44,hy-9,8,9],[66,hy-9,8,9],[cx,hy-13,9,10],[34,hy-6,6,7],[76,hy-6,6,7],[cx-8,hy-19,5,6],[cx+9,hy-18,5,6]]) V.ell(x,y,rx,ry,Wt,{g:'hair',lift:.1});
  for(const [x0,y0,x1,y1] of [[34,hy-8,26,hy-20],[76,hy-8,86,hy-19],[cx-6,hy-20,cx-12,hy-26],[cx+7,hy-19,cx+12,hy-26],[cx,hy-22,cx+1,hy-27]]) V.tube([[x0,y0],[x1,y1]],[5,1],Wt,{g:'hair',lift:.1});
  // mặt: lông mày trắng, mắt trắng tròng đỏ, sẹo dưới mắt trái, miệng cười toe
  const fy=41-b; for(const ex of [46,59]){ V.rect(ex+1,fy-2,4,5,'#ffffff').rect(ex,fy-1,6,3,'#ffffff').rect(ex+1,fy-1,4,3,'#ea2a2a').rect(ex+2,fy,2,1,'#ffffff').line(ex,fy-4,ex+5,fy-5,'#a8663e'); }
  V.line(45,fy+4,48,fy+6,'#8a4a2a').line(46,fy+3,46,fy+4,'#8a4a2a');
  V.rect(45,fy+6,21,6,'#5a1418').rect(46,fy+6,19,2,'#ffffff').rect(47,fy+10,17,1,'#ffffff').rect(52,fy+8,7,2,'#e8506a');
  V.line(50,61-b,59,70-b,'#a8663e').line(59,61-b,50,70-b,'#a8663e');
  V.rect(72,45,17,2,'#c82a2a');   // dải đỏ mũ rơm
  return spr(V.done(hit,{glow:'#ffffff55',gr:2}),55,117); }

/* ---------- Naruto Cửu Vĩ: áo chakra đỏ cam phát sáng, 4 đuôi lửa, tóc vàng dựng, băng trán Làng Lá, mắt cáo đỏ, ria mèo ---------- */
function naruto(fr,hit){ const V=vol(96,104), cx=48, w=fr?2:0, Ch=RP.chakra, Or=RP.orange, Sk=RP.skin;
  V.tube([[cx,74],[34,68],[20,56],[15,42],[21,30+w]],[7,7,6,4.5,3],Ch,{g:'tail',lift:.15}).tube([[cx,74],[62,66],[76,54],[81,40],[75,28-w]],[7,7,6,4.5,3],Ch,{g:'tail',lift:.15});
  V.tube([[cx,76],[28,80],[13,74],[8,62-w]],[6,6,5,3],Ch,{g:'tail',lift:.15}).tube([[cx,76],[68,82],[83,76],[88,64+w]],[6,6,5,3],Ch,{g:'tail',lift:.15});
  // chân quần cam, dép xanh, quấn băng
  V.tube([[42,76],[37,89],[34,96]],[6.5,5.5,4.5],Or,{flat:.2}).tube([[54,76],[59,89],[62,96]],[6.5,5.5,4.5],Or,{flat:.2});
  V.ell(33,99,6,3,RP.blue).ell(63,99,6,3,RP.blue); V.rect(58,86,5,1,'#f4f2ec').rect(58,88,5,1,'#f4f2ec');
  // thân: áo khoác cam vai đen, khoá kéo
  V.ell(cx,62,13,14,Or,{flat:.15}).ell(cx,51,14,6,RP.black,{flat:.2}); V.rect(cx,52,1,20,'#e8e8f0').rect(cx-1,52,3,2,'#e8e8f0');
  // tay: thế thủ, 1 tay trước ngực nắm đấm (tụ Rasengan ở khung 2)
  const L=fr?[[36,55],[27,62],[22,54]]:[[36,55],[26,64],[20,60]], Rr=fr?[[60,55],[69,63],[72,72]]:[[60,55],[70,62],[75,68]];
  V.tube([L[0],L[1]],[5.5,5],Or).tube([L[1],L[2]],[5,4],Sk).ell(L[2][0],L[2][1],4.5,4.5,Sk);
  V.tube([Rr[0],Rr[1]],[5.5,5],Or).tube([Rr[1],Rr[2]],[5,4],Sk).ell(Rr[2][0],Rr[2][1],4.5,4.5,Sk);
  if(fr){ V.ell(L[2][0],L[2][1]-8,6,6,RP.blue,{lift:.3}); V.px(L[2][0]-2,L[2][1]-10,'#ffffff').px(L[2][0]+1,L[2][1]-7,'#ffffff'); }
  // đầu, tóc vàng nhọn
  V.ell(cx,37,11,11,Sk);
  for(let a=-170;a<=-10;a+=20){ const r=a*Math.PI/180, l=a<-150||a>-30?12:17; V.tube([[cx+Math.cos(r)*5,31+Math.sin(r)*4],[cx+Math.cos(r)*(l+4),30+Math.sin(r)*(l-2)]],[5.5,1],RP.yellow,{g:'hair'}); }
  V.ell(cx,29,12,8,RP.yellow,{g:'hair'}); V.tube([[cx-11,32],[cx-14,42]],[3,1],RP.yellow,{g:'hair2'}).tube([[cx+11,32],[cx+14,42]],[3,1],RP.yellow,{g:'hair2'});
  // băng trán + phù hiệu lá
  V.tube([[cx-12,31],[cx+12,31]],2.5,RP.blue).tube([[cx+11,31],[cx+19,36]],[2,1],RP.blue);
  V.rect(cx-6,29,13,5,'#dadee6').rect(cx-6,29,13,1,'#ffffff').rect(cx-6,33,13,1,'#9ca2b0').rect(cx-1,30,3,1,'#5c6272').rect(cx-2,31,1,2,'#5c6272').rect(cx+1,31,2,2,'#5c6272');
  // mắt cáo đỏ, ria mèo, miệng nhe nanh
  for(const ex of [cx-7,cx+3]){ V.rect(ex,36,5,3,'#ffffff').rect(ex+1,36,3,3,'#e8302a').rect(ex+2,36,1,3,'#1c1516'); }
  for(const s of [-1,1]) for(let i=0;i<3;i++) V.line(cx+s*6,40+i*2,cx+s*10,40+i*2-1+i,'#7a3a20');
  V.rect(cx-3,44,7,2,'#5a1418').px(cx-3,44,'#ffffff').px(cx+3,44,'#ffffff');
  return spr(V.done(hit,{glow:'#ff7a2a66',gr:3}),48,101); }

/* ---------- Quỷ Cưa: đầu cưa máy cam đỏ, lưỡi cưa trên trán, hàm răng nhọn, sơ mi trắng cà vạt đen, 2 tay mọc lưỡi cưa ---------- */
function cuamay(fr,hit){ const V=vol(100,108), cx=50, sw=fr?4:0, Mt=RP.metal;
  const blade=(x0,y0,x1,y1,r)=>{ const n=Math.hypot(x1-x0,y1-y0), ux=(x1-x0)/n, uy=(y1-y0)/n;
    for(let i=3;i<n-1;i+=3) for(const s of [-1,1]) V.tube([[x0+ux*i-uy*s*r*.6,y0+uy*i+ux*s*r*.6],[x0+ux*(i+1.5)-uy*s*(r+2.6),y0+uy*(i+1.5)+ux*s*(r+2.6)]],[1.6,.6],Mt,{g:'teeth'+x0});
    V.tube([[x0,y0],[x1,y1]],[r,r*.85],Mt,{flat:.15});
    for(let i=1;i<n;i++) for(const s of [-1,1]) V.px(Math.round(x0+ux*i-uy*s*(r-1)),Math.round(y0+uy*i+ux*s*(r-1)),i%2?'#3a3a44':'#5c6272');
    V.line(Math.round(x0+ux*2),Math.round(y0+uy*2),Math.round(x1-ux*2),Math.round(y1-uy*2),'#ffffff'); };
  // chân quần đen, giày
  V.tube([[44,76],[37,92],[33,101]],[6.5,5.5,4.5],RP.black,{flat:.2}).tube([[56,76],[63,92],[67,101]],[6.5,5.5,4.5],RP.black,{flat:.2});
  V.ell(31,104,7,3,RP.brown).ell(69,104,7,3,RP.brown);
  // lưỡi cưa ở tay (sau người)
  blade(23,64,5,44-sw,3.5); blade(77,64,95,44+sw,3.5);
  // thân sơ mi trắng, cà vạt đen, vết máu
  V.ell(cx,62,13,15,RP.white,{flat:.2}); V.poly([[cx-2,49],[cx+2,49],[cx+3,68],[cx,71],[cx-3,68]],RP.black,{n:[0,-.2,.98]});
  V.rect(cx-9,58,2,1,'#c8202a').rect(cx+7,64,1,2,'#c8202a').rect(cx+5,70,2,1,'#c8202a');
  // tay áo trắng, cẳng tay
  V.tube([[38,53],[29,62],[25,66]],[5.5,5,4],RP.white,{flat:.2}).tube([[62,53],[71,62],[75,66]],[5.5,5,4],RP.white,{flat:.2});
  V.ell(25,66,5,5,RP.red).ell(75,66,5,5,RP.red); V.rect(23,64,3,1,'#ffc878').rect(73,64,3,1,'#ffc878');
  // đầu cưa máy: lưỡi cưa dựng trên trán
  blade(cx,24,cx,3-sw/2,4.5);
  V.ell(cx,35,14,13,RP.orange).ell(cx,27,8,4,RP.red,{lift:.1}).ell(cx-13,37,3,4,RP.black).ell(cx+13,37,3,4,RP.black);
  V.rect(cx-11,37,23,9,'#2a0a0a'); for(let x=cx-11;x<=cx+10;x+=3){ V.rect(x,37,2,2,'#ffffff').px(x,39,'#ffffff').rect(x+1,44,2,2,'#ffffff').px(x+2,43,'#ffffff'); }
  V.rect(cx-7,31,4,3,'#ffffff').rect(cx+4,31,4,3,'#ffffff').rect(cx-6,32,2,2,'#1c1516').rect(cx+5,32,2,2,'#1c1516').line(cx-8,29,cx-3,30,'#94380a').line(cx+8,29,cx+3,30,'#94380a');
  return spr(V.done(hit,{glow:'#ff4a2a44',gr:2}),50,105); }

/* ---------- Dươngg Vũ: bóng ma tím tròn, gai lưng, tai nhọn, mắt đỏ xếch, cười nhe răng, bóng tối dưới chân ---------- */
function gengar(fr,hit){ const V=vol(100,96), cx=50, cy=52+(fr?1:0), Gh=RP.ghost;
  V.ell(cx,90,30,5,RP.shade,{flat:1});
  for(const a of [-150,-128,-106,-74,-52,-30]){ const r=a*Math.PI/180; V.tube([[cx+Math.cos(r)*22,cy+Math.sin(r)*22],[cx+Math.cos(r)*38,cy+Math.sin(r)*36]],[7,1],Gh,{g:'spike'}); }
  V.tube([[cx-14,cy-22],[cx-26,cy-44]],[9,1],Gh,{g:'ear'}).tube([[cx+14,cy-22],[cx+26,cy-44]],[9,1],Gh,{g:'ear'});
  V.ell(cx-14,86,8,5,Gh).ell(cx+14,86,8,5,Gh);
  V.ell(cx,cy,29,29,Gh);
  const ay=fr?-4:0; V.tube([[cx-25,cy+6],[cx-36,cy+10+ay],[cx-40,cy+6+ay]],[6,5,4],Gh).tube([[cx+25,cy+6],[cx+36,cy+2-ay],[cx+40,cy-3-ay]],[6,5,4],Gh);
  for(const [x,y] of [[cx-41,cy+3+ay],[cx-43,cy+7+ay],[cx+41,cy-6-ay],[cx+43,cy-2-ay]]) V.px(x,y,'#46287c');
  // mắt đỏ xếch, đồng tử trắng
  V.poly([[cx-20,cy-14],[cx-5,cy-8],[cx-6,cy-2],[cx-18,cy-5]],RP.red,{n:[-.1,-.4,.9],g:'eye'}).poly([[cx+20,cy-14],[cx+5,cy-8],[cx+6,cy-2],[cx+18,cy-5]],RP.red,{n:[-.1,-.4,.9],g:'eye'});
  V.rect(cx-12,cy-7,3,2,'#ffffff').rect(cx+9,cy-7,3,2,'#ffffff');
  // cười nhe răng
  V.poly([[cx-20,cy+4],[cx+20,cy+4],[cx+14,cy+15],[cx-14,cy+15]],RP.white,{n:[-.2,-.3,.93]});
  for(let x=cx-16;x<=cx+16;x+=5) V.line(x,cy+5,x,cy+13,'#9a9eb2'); V.rect(cx-17,cy+9,35,1,'#9a9eb2');
  return spr(V.done(hit,{glow:'#8a5ad855',gr:3}),50,93); }

/* ---------- Rồng Dải Xanh: thân rắn xanh lục cuộn chữ S, vòng vàng dọc thân, vây lưng, đầu dài mép vàng, 2 vây đầu dài, mắt vàng ---------- */
function rong(fr,hit){ const V=vol(168,128), w=fr?2:0, Gr=RP.green, Y='#ffd84a', Yd='#c89a1a';
  const path=[[156,98+w],[144,108],[124,114],[100,116],[76,114],[56,106],[47,92],[52,78],[68,71],[88,72],[103,64],[108,50],[102,38],[90,30],[78,27]];
  const rad=[1.5,4,6,7.5,8.5,9.5,10,10,10,10,9.5,9,8.5,8,8];
  // vây lưng (sau thân)
  for(const i of [3,5,7,9,11]){ const p=path[i], q=path[i+1], dx=q[0]-p[0], dy=q[1]-p[1], n=Math.hypot(dx,dy), nx=dy/n, ny=-dx/n, s=ny>0?-1:1;
    V.tube([[p[0],p[1]],[p[0]+nx*s*15+dx*.3,p[1]+ny*s*15+dy*.3]],[5,1],Gr,{g:'fin'}); V.px(Math.round(p[0]+nx*s*14+dx*.3),Math.round(p[1]+ny*s*14+dy*.3),'#ea442e'); }
  // vây đầu dài (sau đầu)
  V.tube([[82,16],[104,4+w],[128,2+w]],[5.5,3.5,1.5],Gr,{g:'hf'}).tube([[86,24],[112,20],[136,24-w]],[5.5,3.5,1.5],Gr,{g:'hf'});
  V.poly([[150,94+w],[166,82+w],[160,100+w],[167,112+w],[150,104+w]],Gr,{n:[-.3,-.2,.93],g:'tail'}); V.line(152,96+w,164,84+w,Y).line(153,102+w,165,111+w,Y);
  V.line(104,4+w,127,2+w,Y).line(112,20,135,24-w,Y).px(128,2+w,'#ea442e').px(136,24-w,'#ea442e');
  V.tube(path,rad,Gr,{g:'body'});
  // vòng vàng dọc thân
  const ring=(x,y,r)=>{ for(let a=0;a<360;a+=12){ const t=a*Math.PI/180; V.px(Math.round(x+Math.cos(t)*r),Math.round(y+Math.sin(t)*r*.8),Y); } V.px(Math.round(x),Math.round(y-r*.8),'#fff6a8'); };
  for(let i=2;i<path.length-2;i++){ const p=path[i]; ring(p[0],p[1],Math.max(2,rad[i]*.42)); }
  // tay nhỏ có vuốt
  V.tube([[98,62],[110,68],[114,64]],[3.5,3,2],Gr).tube([[56,100],[44,104],[40,100]],[3.5,3,2],Gr);
  for(const [x,y] of [[116,63],[115,66],[39,98],[38,101]]) V.px(x,y,'#f4f2ec');
  // đầu: sọ + mõm dài, mép vàng, mắt vàng, lỗ mũi
  V.tube([[80,32],[94,44]],[5,1],Gr,{g:'cheek'}).tube([[62,37],[42,38]],[5.5,4],Gr);
  V.ell(74,25,18,13,Gr).tube([[64,29],[36,31]],[9.5,6.5],Gr).ell(74,15,9,4,Gr,{lift:.2});
  V.line(36,35,64,35,Y).line(64,35,72,31,Y).line(40,40,60,40,Yd).line(44,25,62,22,'#105432'); V.px(38,28,'#105432').px(41,27,'#105432');
  V.rect(66,20,8,5,Y).rect(69,21,4,3,'#1c1516').px(66,20,'#ffffff').px(67,20,'#ffffff').line(64,18,76,16,'#105432').line(65,26,74,26,'#105432');
  V.line(78,12,94,10,Y).line(84,20,100,22,Y); V.px(92,43,'#ea442e').px(93,44,'#ea442e');
  return spr(V.done(hit,{glow:'#6ad88a44',gr:2}),92,124); }

const CACHE13={};
A.muBossSprite=(sprite,fr,hit)=>{ const k=sprite+fr+!!hit; if(CACHE13[k]) return CACHE13[k];
  const f=sprite==='naruto'?naruto:sprite==='cuamay'?cuamay:sprite==='gengar'?gengar:sprite==='rong'?rong:luffy; return CACHE13[k]=f(fr%2,!!hit); };
// quầy Premium Store ở quảng trường MU: mái sọc tím vàng, bảng PREMIUM, kệ trưng 3 mũ giáp huyền thoại
A.muPremium=()=>A.sprite(56,46,28,44,(g,P)=>{ for(let i=0;i<8;i++) P.rect(2+Math.round(i*6.5),6,7,10,i%2?'#ffd84a':'#7a3ac8'); P.rect(2,16,52,2,'#c8901a');
  P.rect(4,18,2,26,'#8a5a32'); P.rect(50,18,2,26,'#8a5a32'); P.rect(4,30,48,14,'#3a2a4a'); P.rect(4,30,48,2,'#5a4a6a'); P.rect(6,34,44,8,'#2a1e36'); P.rect(6,38,44,1,'#c8901a');
  for(const [x,c,d] of [[14,'#4c7cea','#2c4cba'],[28,'#ffd84a','#c8901a'],[42,'#ea442e','#781212']]){ P.disc(x,25,4,c); P.rect(x-1,24,2,4,'#1c1516'); P.rect(x-4,29,9,2,d); }
  P.rect(12,0,32,7,'#1c1516'); A.drawText(g,'PREMIUM',14,1,'#ffd84a'); });
A.vol=vol; A.volRamp=RP;   // cho set legacy / boss khác dùng lại
})();
