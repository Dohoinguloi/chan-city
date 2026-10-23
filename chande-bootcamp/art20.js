/* Chan City — Cổng D-Day (MU): nhà sự kiện ở quảng trường (cổng đá 2 cờ xanh / đỏ, biển CONG D-DAY), nhà chính 2 đội trong đấu trường
   (tinh thể lớn trên bệ đá, màu đội, 2 khung nhấp nháy), lính quái 2 đội (khiên + giáo, 3 khung: 0 / 1 bước, 2 đâm), cờ đội trang trí. Vẽ khối bằng A.vol như art18. */
(function(){
const A=ART, vol=A.vol, K='#1c1516';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const TEAM=[{c:'#3a8ae8',d:'#1e4a9a',g:'rgba(90,170,255,.45)'},{c:'#e83a3a',d:'#8a1e1e',g:'rgba(255,90,90,.45)'}];
const CR={};
// chữ trên biển: nền tối rộng theo chữ, canh giữa ở cx
const tag=(c,s,cx,y,col)=>{ const g=c.getContext('2d'), w=A.textW(s), x=Math.round(cx-w/2); g.fillStyle=K; g.fillRect(x-2,y-1,w+4,7); A.drawText(g,s,x,y,col); };
// nhà sự kiện Cổng D-Day: 2 trụ đá, vòm, 2 cờ xanh / đỏ bay, đuốc, biển tên
A.ddayGate=f=>CR['dg'+f]||(CR['dg'+f]=(()=>{ const V=vol(64,58), St=R('#8a8478'), Sd=R('#5e5a52');
  V.poly([[4,57],[60,57],[58,50],[6,50]],Sd,{n:[0,-.3,.95],g:'step'});
  V.tube([[12,51],[12,14]],[5,4.4],St,{g:'p1'}); V.tube([[52,51],[52,14]],[5,4.4],St,{g:'p2'}); V.tube([[8,16],[20,8],[32,6],[44,8],[56,16]],[4.5,4.5,4.5,4.5,4.5],Sd,{g:'arch'});
  V.poly([[18,18],[46,18],[46,46],[18,46]],R('#2a2026'),{n:[0,0,1],g:'door'}); for(let i=0;i<5;i++) V.line(20+i*6,20,20+i*6,46,'#3a3036');
  for(const [x,k] of [[6,0],[58,1]]){ const T0=TEAM[k], w=f?2:0; V.tube([[x,49],[x,4]],[.9,.8],R('#5a3a22'),{g:'pole'+k}); V.poly([[x,5],[x+(k?-14:14),7+w],[x+(k?-12:12),12+w],[x,14]],R(T0.c),{n:[0,0,1],g:'flag'+k}); }
  for(const x of [22,42]) V.ell(x,13,2,3,[[255,250,200,255],[255,200,60,255],[255,120,20,255],[200,60,10,255]],{g:'fire'+x});
  const c=V.done(false,{glow:'rgba(255,200,80,.25)',gr:2}); tag(c,'CONG D-DAY',32,21,'#ffd84a'); tag(c,'1-1 · 2-2 · 3-3',32,30,'#ffffff'); return {c,ax:32,ay:57}; })());
// nhà chính: bệ đá + tinh thể màu đội + vòng khiên, khung f nhấp nháy sáng
A.ddayBase=(k,f)=>CR['db'+k+f]||(CR['db'+k+f]=(()=>{ const T0=TEAM[k], V=vol(56,70), St=R('#7a746a'), Cr=R(T0.c), Cd=R(T0.d);
  V.ell(28,64,24,6,St,{g:'pad',flat:.5}); V.poly([[10,64],[46,64],[42,52],[14,52]],St,{n:[0,-.3,.95],g:'plinth'}); V.ell(28,52,14,4,R('#9a948a'),{g:'top',flat:.5});
  V.poly([[28,4],[40,26],[34,52],[22,52],[16,26]],Cr,{n:[-.35,-.25,.9],g:'cr1'}); V.poly([[28,4],[40,26],[34,52],[29,30]],Cd,{n:[.4,-.2,.9],g:'cr2'});
  V.poly([[14,30],[20,22],[22,50],[16,50]],Cr,{g:'sh1'}); V.poly([[42,30],[36,22],[34,50],[40,50]],Cd,{g:'sh2'});
  V.px(24,14,'#ffffff').px(25,15,'#ffffff').px(23,22,'#ffffff');
  return {c:V.done(false,{glow:f?T0.g:T0.g.replace('.45','.28'),gr:4}),ax:28,ay:64}; })());
// lính quái: mũ, giáp màu đội, khiên tròn, giáo; khung 0 / 1 bước, 2 đâm giáo tới trước
A.ddCreep=(k,f)=>CR['dc'+k+f]||(CR['dc'+k+f]=(()=>{ const T0=TEAM[k], V=vol(22,26), Ar=R(T0.c), Ad=R(T0.d), Mt=R('#a8acb4'), st=f===1?1:f===0?-1:0;
  V.tube([[8,18],[7-st,24]],[1.6,1.4],Ad,{g:'lL'}); V.tube([[13,18],[14+st,24]],[1.6,1.4],Ad,{g:'lR'});
  V.poly([[6,10],[15,10],[16,19],[5,19]],Ar,{n:[-.3,-.2,.93],g:'body'}); V.ell(10.5,7,4,3.6,R('#f0c49a'),{g:'head'}); V.ell(10.5,5,4.6,2.8,Mt,{g:'helm'}); V.rect(10,1,1,3,T0.c);
  V.ell(5,14,3.4,4,Mt,{g:'shield'}); V.ell(5,14,1.6,2,Ar,{g:'boss',lift:.3});
  const sx=f===2?5:0; V.tube([[14,13],[19+sx,9]],[.6,.6],R('#8a5a32'),{g:'spear'}); V.poly([[19+sx,9],[22+sx,6],[20+sx,10]],Mt,{g:'tip'});
  return {c:V.done(false),ax:11,ay:25}; })());
// cờ đội cắm dọc đường giữa
A.ddayFlag=k=>CR['df'+k]||(CR['df'+k]=(()=>{ const T0=TEAM[k], V=vol(16,30); V.tube([[3,29],[3,2]],[.8,.7],R('#5a3a22'),{g:'pole'}); V.poly([[3,3],[15,5],[13,10],[3,12]],R(T0.c),{n:[0,0,1],g:'flag'}); return {c:V.done(false),ax:3,ay:29}; })());
A.ddayTeam=TEAM;
// '~' nước nông lội được (Đầm Rồng MU): xanh trong, gợn sóng chạy, đá cuội dưới đáy, viền bọt trắng chỗ giáp bờ
A.WALKABLE.add('~');
A.TILE_EXT['~']=(g,X,Y,tx,ty,nb,fr,P)=>{ const T=A.T, h=A.hash; P.rect(X,Y,T,T,'#5ab4d8'); if(h(tx,ty,61)<.3) P.rect(X+(h(tx,ty,62)*10|0),Y+(h(tx,ty,63)*10|0),4,3,'#4a9cc0');
  for(let y=2;y<T;y+=5) for(let x=0;x<T;x++) if(((x+X)+y*3+fr*3)%13<3) P.px(X+x,Y+y,'#8ad4ef');
  if(nb(0,-1)!=='~'){ P.rect(X,Y,T,2,'#d8f0f8'); if(fr%2) P.px(X+(tx*5)%T,Y+2,'#ffffff'); } if(nb(-1,0)!=='~') P.rect(X,Y,1,T,'#d8f0f8'); if(nb(1,0)!=='~') P.rect(X+T-1,Y,1,T,'#d8f0f8'); if(nb(0,1)!=='~') P.rect(X,Y+T-1,T,1,'#3a8cb0'); };
})();
