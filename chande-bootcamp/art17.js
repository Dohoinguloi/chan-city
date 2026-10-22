/* Chan City — 6 thần thú cưỡi được (cường hoá từ ngựa): Thiên Mã, Kỳ Lân, Bạch Hổ, Rồng Xanh, Phượng Hoàng, Hắc Long.
   Vẽ bằng khối có đổ bóng (A.vol của art13), nhìn nghiêng quay phải, khung 64×52 neo ở mặt đất (32,50); 4 khung đi (chân bước so le, cánh vỗ).
   A.mythMount.M[k]: điểm yên (người ngồi) + mõm (dây cương, null = không cương). */
(function(){
const A=ART, vol=A.vol;
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.55),b,mix(b,[20,10,50],.32),mix(b,[10,5,30],.6)].map(v=>[...v,255]); };
const X=x=>32+x, Y=y=>50+y;
const legSw=(f,mv,a)=>mv?Math.sin((f/4+a)*Math.PI*2)*.6:0;
// chân: từ hông xuống móng, bước theo pha a
function leg(V,hipX,hipY,len,f,mv,a,ramp,r0,foot){ const s=legSw(f,mv,a); V.tube([[X(hipX),Y(hipY)],[X(hipX+Math.sin(s)*len*.35),Y(hipY+len*.55)],[X(hipX+Math.sin(s)*len*.5),Y(-1)]],[r0,r0*.8,r0*.7],ramp); if(foot) V.ell(X(hipX+Math.sin(s)*len*.5),Y(-.6),r0*.85,1.3,foot); }
// cánh lông vũ (Thiên Mã, Phượng Hoàng): quạt lông từ gốc, vỗ theo khung
function featherWing(V,rx,ry,ang,len,ramps,g){ for(let i=0;i<6;i++){ const a=(ang-25-i*14)*Math.PI/180, L=len*(1-i*.11); V.tube([[X(rx),Y(ry)],[X(rx+Math.cos(a)*L*.55),Y(ry+Math.sin(a)*L*.55)],[X(rx+Math.cos(a)*L),Y(ry+Math.sin(a)*L)]],[2.6,2.1,.7],ramps[Math.min(ramps.length-1,i>>1)],{g:g+i}); } }
// cánh dơi (Hắc Long, Rồng Xanh): xương + màng
function batWing(V,rx,ry,up,sz,mem,bone){ const H=[rx+sz*.35,ry-sz*.9-up], T=[[rx-sz*.7,ry-sz*1.1-up],[rx-sz,ry-sz*.45-up*.5],[rx-sz*.7,ry]];
  V.poly([[X(rx),Y(ry)],[X(H[0]),Y(H[1])],[X(T[0][0]),Y(T[0][1])],[X(T[1][0]),Y(T[1][1])],[X(T[2][0]),Y(T[2][1])]],mem,{n:[-.2,-.4,.9]});
  V.tube([[X(rx),Y(ry)],[X(H[0]),Y(H[1])]],[1.5,1],bone,{ink:true}); for(const p of T) V.tube([[X(H[0]),Y(H[1])],[X(p[0]),Y(p[1])]],[1,.4],bone,{ink:true}); }
function horseLike(V,f,mv,o){ const B=R(o.body), D=R(o.dark), Hf=R(o.hoof||'#c8a040');
  if(o.wings) featherWing(V,-2,-24,-70+(mv?[0,28,0,-18][f]:[0,8,0,8][f]),17,o.wings.map(R).map(x=>x).reverse().map(x=>D),'fw');   // cánh xa (tối)
  leg(V,-11,-16,15,f,mv,.5,D,2.3,Hf); leg(V,9,-16,15,f,mv,0,D,2.3,Hf);
  const tw=mv?[0,1.5,0,-1.5][f]:0; V.tube([[X(-14),Y(-21)],[X(-20),Y(-17+tw)],[X(-23),Y(-9)]],[3,2.4,1],R(o.tail||o.mane),{g:'tail'});
  V.ell(X(0),Y(-19),15,7.5,B); leg(V,-8,-16,15,f,mv,0,B,2.5,Hf); leg(V,12,-16,15,f,mv,.5,B,2.5,Hf);
  V.tube([[X(10),Y(-22)],[X(15),Y(-30)]],[5.5,4.2],B); V.ell(X(17),Y(-32),5.5,4.6,B); V.tube([[X(18),Y(-31)],[X(25),Y(-27)]],[3.7,2.6],B); V.tube([[X(15),Y(-35)],[X(14),Y(-40)]],[1.5,.4],B);
  const manes=o.rainbow?['#ff5a5a','#ffb03a','#ffe066','#6ad86a','#5aa0ff','#b070ff']:[o.mane]; for(let i=0;i<5;i++) V.tube([[X(9+i*1.4),Y(-24-i*1.9)],[X(6+i*1.4),Y(-20-i*1.9+(mv?f%2:0))]],[2,.6],R(manes[i%manes.length]),{g:'mane'});
  V.px(X(19),Y(-33),'#1c1516').px(X(24),Y(-27),'#3a3a44');
  if(o.horn){ V.tube([[X(19),Y(-36)],[X(25),Y(-45)]],[1.6,.3],R('#ffd84a')); V.px(X(21),Y(-39),'#fff6a8').px(X(23),Y(-42),'#fff6a8'); }
  if(o.wings) featherWing(V,0,-25,-62+(mv?[0,28,0,-18][f]:[0,8,0,8][f]),19,o.wings.map(R),'fn');
  if(o.rainbow) for(let i=0;i<3;i++) V.tube([[X(-15),Y(-20+i)],[X(-22-i),Y(-12+i*2)]],[1.2,.5],R(['#ff5a5a','#ffe066','#5aa0ff'][i]),{g:'rt'+i}); }
const M={
  thienma:{seat:{dx:-2,dy:-25},mouth:{dx:25,dy:-27},draw:(V,f,mv)=>horseLike(V,f,mv,{body:'#f4f6fa',dark:'#b8c0d0',mane:'#ffd84a',wings:['#ffffff','#e8f0ff','#c8d8f0']})},
  kylan:{seat:{dx:-2,dy:-25},mouth:{dx:25,dy:-27},draw:(V,f,mv)=>horseLike(V,f,mv,{body:'#fbf8ff',dark:'#c8bcd8',mane:'#ff9ac8',rainbow:true,horn:true,hoof:'#ffd84a'})},
  bacho:{seat:{dx:-3,dy:-20},mouth:{dx:23,dy:-17},draw:(V,f,mv)=>{ const W=R('#f4f2ec'), D=R('#c8c4bc'), K='#1c1516';
    leg(V,-11,-12,11,f,mv,.5,D,2.6,D); leg(V,9,-12,11,f,mv,0,D,2.6,D); const tw=mv?[0,2,0,-2][f]:0;
    V.tube([[X(-14),Y(-15)],[X(-21),Y(-18+tw)],[X(-25),Y(-26+tw)],[X(-23),Y(-30+tw)]],[2.4,2.2,1.9,1.2],W,{g:'t'}); for(const [x,y] of [[-19,-17],[-23,-22],[-24,-27]]) V.px(X(x),Y(y+tw),K).px(X(x+1),Y(y+tw),K);
    V.ell(X(0),Y(-15),15,6.8,W); for(const x of [-9,-5,-1,3,7]){ V.line(X(x),Y(-21),X(x+1),Y(-17),K).line(X(x+1),Y(-17),X(x),Y(-13),K); }
    leg(V,-8,-12,11,f,mv,0,W,2.8,W); leg(V,12,-12,11,f,mv,.5,W,2.8,W);
    V.ell(X(17),Y(-19),6.5,5.8,W); V.ell(X(22),Y(-16.5),3.6,2.8,R('#fbf8f4')); V.tube([[X(14),Y(-24)],[X(13),Y(-27)]],[2,.8],W).tube([[X(19),Y(-24)],[X(20),Y(-27)]],[2,.8],W);
    V.rect(X(18),Y(-21),2,1,'#3ac8e8').px(X(18),Y(-21),'#1c1516'); V.line(X(13),Y(-21),X(15),Y(-19),K).line(X(12),Y(-18),X(14),Y(-17),K); V.px(X(25),Y(-17),'#e8708a'); }},
  rongxanh:{seat:{dx:-3,dy:-26},mouth:null,draw:(V,f,mv)=>{ const G=R('#2a9a5a'), D=R('#1e6a44'), Ly=R('#a8d83a'), Hn=R('#e8e0a0'); const up=mv?[0,3,0,-2][f]:[0,1,0,1][f];
    batWing(V,-4,-26,up,11,Ly,D); leg(V,-10,-12,11,f,mv,.5,D,3.2,D); leg(V,8,-12,11,f,mv,0,D,3.2,D); const tw=mv?[0,1.5,0,-1.5][f]:0;
    V.tube([[X(-12),Y(-13)],[X(-19),Y(-9+tw)],[X(-26),Y(-5)],[X(-29),Y(-10+tw)]],[5,4,2.5,1],G,{g:'t'}); for(const [x,y] of [[-18,-14],[-23,-10],[-27,-8]]) V.tube([[X(x),Y(y+tw)],[X(x-1),Y(y-3+tw)]],[1.2,.3],Ly,{g:'sp'});
    V.ell(X(0),Y(-17),15,9.5,G); V.ell(X(4),Y(-14),8.5,6.5,Ly); for(let i=0;i<4;i++) V.line(X(-2+i*3),Y(-11-i%2),X(6+i*2),Y(-11-i%2),'#7aa82a');
    leg(V,-7,-12,11,f,mv,0,G,3.4,G); leg(V,11,-12,11,f,mv,.5,G,3.4,G);
    V.tube([[X(9),Y(-22)],[X(13),Y(-31)]],[6.2,5.2],G); V.ell(X(15),Y(-34),7,6,G); V.tube([[X(17),Y(-33)],[X(25),Y(-31)]],[4.8,3.6],G);
    V.tube([[X(12),Y(-39)],[X(10),Y(-45)]],[1.8,.5],Hn).tube([[X(17),Y(-39)],[X(18),Y(-45)]],[1.8,.5],Hn); for(let i=0;i<4;i++) V.px(X(-6+i*4),Y(-27+Math.abs(i-1.5)),'#a8d83a');
    V.line(X(15),Y(-35),X(18),Y(-36),'#1c1516'); V.px(X(24),Y(-32),'#1e6a44'); V.line(X(19),Y(-29),X(25),Y(-30),'#1c4a2a'); batWing(V,-1,-27,up,12,Ly,D); }},
  phuong:{seat:{dx:-2,dy:-29},mouth:null,draw:(V,f,mv)=>{ const hov=mv?[0,1,2,1][f]:[0,1,1,0][f], Rd=R('#e8402a'), Or=R('#ff9a2a'), Ye=R('#ffe066'), y0=-8-hov, fl=[0,26,8,-16][f];
    featherWing(V,-2,y0-17,-75+fl,18,['#ff9a2a','#e8402a','#a82a1a'].map(R),'fw');
    for(let i=0;i<4;i++){ const ty=y0-12+i*3, cur=mv?Math.sin(f+i)*2:0; V.tube([[X(-10),Y(y0-14)],[X(-20),Y(ty+cur)],[X(-30),Y(ty-4+i*2+cur)]],[2.6,2,1],[Rd,Or,Ye,Or][i],{g:'tl'+i}); V.ell(X(-30),Y(ty-4+i*2+cur),1.8,1.8,Ye,{g:'te'+i}); }
    V.ell(X(0),Y(y0-14),12,7,Rd); V.ell(X(5),Y(y0-13),7,5,Ye); V.tube([[X(-3),Y(y0-8)],[X(-1),Y(y0-3)]],[1,.6],Ye).tube([[X(3),Y(y0-8)],[X(5),Y(y0-3)]],[1,.6],Ye);
    V.tube([[X(8),Y(y0-17)],[X(13),Y(y0-24)]],[4.2,3.2],Or); V.ell(X(14),Y(y0-26),4.6,4,Or); V.poly([[X(17),Y(y0-27)],[X(23),Y(y0-25)],[X(17),Y(y0-24)]],Ye,{n:[-.3,-.3,.9]});
    for(const [dx,dy] of [[-2,-6],[0,-8],[2,-6]]) V.tube([[X(13),Y(y0-29)],[X(13+dx),Y(y0-29+dy)]],[1.5,.4],Ye,{g:'cr'}); V.px(X(15),Y(y0-27),'#1c1516');
    featherWing(V,0,y0-18,-66+fl,20,['#ffe066','#ff9a2a','#e8402a'].map(R),'fn'); }},
  haclong:{seat:{dx:-3,dy:-27},mouth:null,draw:(V,f,mv)=>{ const Bk=R('#2e2440'), D=R('#1a1426'), Pu=R('#7a3ac8'), Mb=R('#4a2a6a'), Hn=R('#c8c0d8'); const up=mv?[0,4,0,-3][f]:[0,1,0,1][f];
    batWing(V,-4,-27,up,14,Mb,D); leg(V,-10,-12,11,f,mv,.5,D,3.3,D); leg(V,8,-12,11,f,mv,0,D,3.3,D); const tw=mv?[0,1.5,0,-1.5][f]:0;
    V.tube([[X(-12),Y(-13)],[X(-20),Y(-9+tw)],[X(-27),Y(-6)],[X(-30),Y(-11+tw)]],[5.2,4,2.4,.8],Bk,{g:'t'}); V.poly([[X(-30),Y(-11+tw)],[X(-33),Y(-15+tw)],[X(-29),Y(-14+tw)]],Pu,{n:[-.3,-.3,.9]});
    V.ell(X(0),Y(-17),15.5,9.5,Bk); V.ell(X(4),Y(-14),8.5,6,Mb); for(let i=0;i<5;i++) V.tube([[X(-8+i*4),Y(-25+Math.abs(i-2))],[X(-9+i*4),Y(-29+Math.abs(i-2))]],[1.4,.3],Pu,{g:'sp'});
    leg(V,-7,-12,11,f,mv,0,Bk,3.5,Bk); leg(V,11,-12,11,f,mv,.5,Bk,3.5,Bk);
    V.tube([[X(9),Y(-22)],[X(13),Y(-32)]],[6.4,5.2],Bk); V.ell(X(15),Y(-35),7,6,Bk); V.tube([[X(17),Y(-34)],[X(26),Y(-31)]],[4.8,3.4],Bk);
    V.tube([[X(12),Y(-40)],[X(8),Y(-46)],[X(5),Y(-46)]],[1.9,1,.4],Hn).tube([[X(17),Y(-40)],[X(17),Y(-47)]],[1.8,.4],Hn);
    V.rect(X(15),Y(-36),3,1,'#ff2a3a').px(X(18),Y(-36),'#ffd0d0'); V.line(X(19),Y(-30),X(26),Y(-31),'#7a3ac8'); batWing(V,-1,-28,up,15,Mb,D); }}};
const CACHE={};
A.mythMount=(k,f=0,mv=false)=>{ const m=M[k]; if(!m) return null; const key=k+(f%4)+(mv?'m':''); if(CACHE[key]) return CACHE[key]; const V=vol(64,52); m.draw(V,f%4,mv); return CACHE[key]={c:V.done(false),ax:32,ay:50}; };
A.mythMount.M=Object.fromEntries(Object.entries(M).map(([k,m])=>[k,{seat:m.seat,mouth:m.mouth}]));
// chuồng thần thú ở MU: mái lá, rào gỗ, máng cỏ, tượng rồng nhỏ
A.mythStable=()=>A.sprite(56,46,28,44,(g,P)=>{ for(let i=0;i<8;i++) P.rect(2+Math.round(i*6.5),6,7,10,i%2?'#3a8a4a':'#c8a040'); P.rect(2,16,52,2,'#5a3a22');
  P.rect(4,18,2,26,'#6a4a2a'); P.rect(50,18,2,26,'#6a4a2a'); for(let x=6;x<50;x+=6) P.rect(x,32,2,12,'#8a5a32'); P.rect(6,34,44,2,'#a87040'); P.rect(6,40,44,2,'#a87040');
  P.rect(10,27,14,5,'#5a3a22'); P.rect(11,25,12,3,'#c8c060'); P.disc(36,26,5,'#2a9a5a'); P.rect(33,20,2,3,'#e8e0a0'); P.rect(38,20,2,3,'#e8e0a0'); P.px(38,25,'#1c1516');
  P.rect(12,0,32,7,'#1c1516'); A.drawText(g,'THAN THU',13,1,'#a8e86a'); });
})();
