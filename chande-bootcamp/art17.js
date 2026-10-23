/* Chan City — 8 thần thú cưỡi được (cường hoá từ ngựa): Thiên Mã, Kỳ Lân, Bạch Hổ, Rồng Xanh, Phượng Hoàng, Hắc Long, Thuỷ Quân, Tinh Vân Thần Điểu.
   Vẽ bằng khối có đổ bóng (A.vol của art13), nhìn nghiêng quay phải, khung 80×64 neo ở mặt đất (40,62); 4 khung: đứng thở / đi (chân 2 khớp gập gối, bờm đuôi bay, cánh vỗ).
   A.mythMount.M[k]: điểm yên (người ngồi) + mõm (dây cương, null = không cương). */
(function(){
const A=ART, vol=A.vol, K='#1c1516', WH='#ffffff';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.55),b,mix(b,[20,10,50],.32),mix(b,[10,5,30],.6)].map(v=>[...v,255]); };
const X=x=>40+x, Y=y=>62+y;
// Xích Thố: màu lửa theo hệ [chính, lõi sáng, viền tối] + màu hào quang
const XT_FC={'':['#ff8a1a','#ffd84a','#ff5a1a'],kim:['#ffd84a','#fff3b0','#e8b030'],moc:['#4ad86a','#c8ffb0','#2a9a4a'],thuy:['#3ab8f0','#bff0ff','#2a6ad8'],hoa:['#ff3a1a','#ffd84a','#ff8a1a'],tho:['#c8902a','#f0d090','#8a5a22']};
// cờ chiến cắm sau yên Xích Thố: chữ Hán theo hệ (chưa chọn hệ: 赤), nền màu hệ, bay phần phật khi chạy
const XT_CH={'':'赤',kim:'金',moc:'木',thuy:'水',hoa:'火',tho:'土'}, XT_FLAG={'':'#c8202a',kim:'#e8b030',moc:'#2a9a4a',thuy:'#2a6ad8',hoa:'#d8302a',tho:'#8a5a22'};
const CHAR={};   /* chữ Hán vẽ 1 lần bằng font máy rồi cắt ngưỡng cho ra pixel sắc */
function hanzi(ch,col){ const key=ch+col; if(CHAR[key]) return CHAR[key]; const c=A.cv(12,12), g=c.getContext('2d'); g.fillStyle=col; g.font='bold 11px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","SimHei",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(ch,6,6.5);
  const d=g.getImageData(0,0,12,12); for(let i=3;i<d.data.length;i+=4) d.data[i]=d.data[i]>90?255:0; g.putImageData(d,0,0); return CHAR[key]=c; }
function xtFlag(c,el,f,mv){ const g=c.getContext('2d'), bb=Math.round(mv?[0,-1,0,-1][f]:[0,0,-.5,0][f]), px=X(-9), top=Y(-61+bb), bg=XT_FLAG[el]||XT_FLAG[''], fc=XT_FC[el]||XT_FC[''];
  g.fillStyle='#4a2a16'; g.fillRect(px,top+2,2,Y(-28+bb)-top-2); g.fillStyle='#ffd84a'; g.fillRect(px-1,top,4,3); g.fillStyle='#fff3b0'; g.fillRect(px,top,1,1);   /* cán cờ + đầu cán vàng */
  for(let y=0;y<18;y++){ const w=mv?Math.round(Math.sin(f*1.57+y*.45)*1.5):Math.round(Math.sin(f*.8+y*.3)*.6), x0=px-13+w-(y>14?Math.abs(y-16)-1:0);   /* lá cờ dọc, đuôi xẻ, gợn sóng */
    g.fillStyle=y===0||y===17?'#1c1516':bg; g.fillRect(x0,top+3+y,13-(y>14&&y<17?2:0),1); g.fillStyle='#1c1516'; g.fillRect(x0-1,top+3+y,1,1); g.fillStyle=fc[1]; if(y>0&&y<17) g.fillRect(x0+1,top+3+y,1,1); }
  g.drawImage(hanzi(XT_CH[el]||XT_CH[''],el==='kim'?'#7a1a1e':'#fff3b0'),px-13+(mv?Math.round(Math.sin(f*1.57+3)*1.5):0)+1,top+6); return c; }
// lửa rực quanh Xích Thố: lưỡi lửa bốc sau lưng, cổ, mông, quanh 4 chân (vẽ ra sau thân) + tàn lửa bay lên phía trước, nhấp nháy theo khung
function xtFlame(c,el,f,mv){ const g=c.getContext('2d'), fc=XT_FC[el]||XT_FC[''], bb=Math.round(mv?[0,-1,0,-1][f]:[0,0,-.5,0][f]);
  const tongue=(x0,y0,h,w,sway)=>{ for(const [col,ins] of [[fc[2],0],[fc[0],1],[fc[1],2]]){ g.fillStyle=col; for(let k=ins;k<h-ins;k++){ const t=k/h, ww=Math.max(1,Math.round((w-ins*2)*(1-t*t))), dx=Math.round(Math.sin(t*3+sway)*t*2); g.fillRect(X(x0)+dx-(ww>>1),Y(y0)-k,ww,1); } } };
  g.save(); g.globalCompositeOperation='destination-over';
  const pts=[[-15,-28,7,4],[-11,-30,9,4],[-7,-31,11,5],[-3,-31,10,5],[1,-31,9,4],[5,-31,8,4],[9,-32,7,4],[14,-37,7,4],[18,-41,6,3],[-19,-27,8,4],[-21,-20,6,3],[-13,-4,5,3],[-9,-4,5,3],[7,-4,5,3],[11,-4,5,3],[-4,-18,4,6],[4,-18,4,6]];
  pts.forEach(([x,y,h,w],i)=>tongue(x,y+bb,h+((i+f)%3)-1+(mv?1:0),w,f*1.6+i));
  g.restore(); g.save();
  for(let i=0;i<7;i++){ const k=(f+i*3)%8; g.fillStyle=[fc[1],fc[0],fc[1]][i%3]; g.globalAlpha=1-k/9; g.fillRect(X(-16+i*5+((i*7+f)%3)),Y(-36-k*2.5+bb),1+(i%2),1+(i%2)); }   /* tàn lửa */
  g.restore(); return c; }
const sw=(f,mv,a)=>mv?Math.sin((f/4+a)*Math.PI*2):0;
// chân ngựa 2 khớp: đùi → gối → móng; nhấc chân thì gối gập, móng co lên
function hoof(V,hx0,hy0,len,f,mv,a,ramp,r,hf){ const s=sw(f,mv,a), lift=Math.max(0,s)*3, kx=hx0+s*3.5, ky=hy0+len*.5-lift, fx=hx0+s*5.5+(lift?1.5:0), fy=-1-lift*.6;
  V.tube([[X(hx0),Y(hy0)],[X(kx),Y(ky)],[X(fx),Y(fy)]],[r,r*.62,r*.5],ramp); if(hf) V.ell(X(fx+.4),Y(fy+.4),r*.78,1.2,hf); }
// chân thú (hổ, rồng): bắp to, bàn chân tròn có vuốt
function paw(V,hx0,hy0,len,f,mv,a,ramp,r,claw){ const s=sw(f,mv,a), lift=Math.max(0,s)*2.5, fx=hx0+s*4.5, fy=-1.4-lift;
  V.tube([[X(hx0),Y(hy0)],[X(hx0+s*2.5),Y(hy0+len*.55-lift)],[X(fx),Y(fy)]],[r,r*.78,r*.7],ramp); V.ell(X(fx+1),Y(fy+.4),r*.95,r*.55,ramp); if(claw) for(let i=0;i<3;i++) V.px(X(fx+1.4+i),Y(fy+1),claw); }
// cánh lông vũ 2 lớp (lông bay dài + lông phủ ngắn), vỗ theo góc ang
function wing(V,rx,ry,ang,len,cols,g,n=8){ for(let i=0;i<n;i++){ const a=(ang-16-i*(72/n))*Math.PI/180, L=len*(1-i*.065), c=cols[Math.min(cols.length-1,Math.floor(i*cols.length/n))];
    V.tube([[X(rx),Y(ry)],[X(rx+Math.cos(a)*L*.5),Y(ry+Math.sin(a)*L*.5)],[X(rx+Math.cos(a)*L),Y(ry+Math.sin(a)*L)]],[2.8,2.2,.6],c,{g:g+i}); }
  for(let i=0;i<5;i++){ const a=(ang-8-i*13)*Math.PI/180, L=len*.44; V.tube([[X(rx),Y(ry)],[X(rx+Math.cos(a)*L),Y(ry+Math.sin(a)*L)]],[3.2,1.2],cols[0],{g:g+'c'+i,lift:.15}); } }
// cánh dơi (rồng): 3 nan xương + màng, gập / xoè theo up
function batWing(V,rx,ry,up,sz,mem,bone){ const H=[rx+sz*.35,ry-sz*.95-up], T=[[rx-sz*.75,ry-sz*1.15-up],[rx-sz*1.05,ry-sz*.5-up*.5],[rx-sz*.7,ry+1]];
  V.poly([[X(rx),Y(ry)],[X(H[0]),Y(H[1])],[X(T[0][0]),Y(T[0][1])],[X(T[1][0]),Y(T[1][1])],[X(T[2][0]),Y(T[2][1])]],mem,{n:[-.2,-.4,.9]});
  V.tube([[X(rx),Y(ry)],[X(H[0]),Y(H[1])]],[1.6,1],bone,{ink:true}); for(const p of T) V.tube([[X(H[0]),Y(H[1])],[X(p[0]),Y(p[1])]],[1,.4],bone,{ink:true}); V.px(X(H[0]),Y(H[1]-1),'#e8e0d0'); }
// lấp lánh sao trong bờm / lông (Thuỷ Quân, Tinh Vân)
const stars=(V,pts,f)=>{ pts.forEach(([x,y],i)=>{ if((i+f)%3===0){ V.px(X(x),Y(y),WH); V.px(X(x-1),Y(y),'#d8f0ff').px(X(x+1),Y(y),'#d8f0ff').px(X(x),Y(y-1),'#d8f0ff').px(X(x),Y(y+1),'#d8f0ff'); } else V.px(X(x),Y(y),'#fff6c0'); }); };

// thân ngựa chung (Thiên Mã, Kỳ Lân, Thuỷ Quân): mông + thân + ngực, cổ cong, đầu thon có mõm, tai, bờm nhiều dải bay sóng, đuôi nhiều dải
function horse(V,f,mv,o){ const B=R(o.body), D=R(o.dark), Hf=R(o.hoof||'#c8a040'), bb=mv?[0,-1,0,-1][f]:[0,0,-.5,0][f], ph=f*1.57, wa=mv?[0,30,6,-20][f]:[0,6,10,6][f];
  if(o.wing) wing(V,-1,-27+bb,-62+wa,19,o.wing.map(()=>D),'wf');   /* cánh xa (tối) */
  hoof(V,-12,-19+bb,18,f,mv,.5,D,2.6,Hf); hoof(V,8,-19+bb,18,f,mv,0,D,2.4,Hf);   /* chân xa */
  (o.tail||[o.mane]).forEach((c,i)=>{ const w=Math.sin(ph+i)*(mv?2:1); V.tube([[X(-15),Y(-25+bb)],[X(-21),Y(-23+w+bb)],[X(-25),Y(-15+w)],[X(-24-i),Y(-7+i)]],[2.8,2.6,1.8,.6],R(c),{g:'tail'+i}); });
  V.ell(X(-9),Y(-22+bb),8.5,7.5,B,{g:'hip'}); V.ell(X(0),Y(-22+bb),13,6.8,B,{g:'barrel'}); V.ell(X(9),Y(-22+bb),7.5,7.6,B,{g:'chest'});
  hoof(V,-8,-19+bb,18,f,mv,0,B,2.9,Hf); hoof(V,11,-19+bb,18,f,mv,.5,B,2.7,Hf);   /* chân gần */
  V.tube([[X(10),Y(-25+bb)],[X(14),Y(-32+bb)],[X(16),Y(-37+bb)]],[6,4.8,4],B,{g:'neck'}); V.ell(X(19),Y(-38+bb),5,4.2,B,{g:'head'}); V.tube([[X(20),Y(-37+bb)],[X(26),Y(-33+bb)]],[3.6,2.4],B,{g:'muzzle'});
  V.tube([[X(16),Y(-41+bb)],[X(15),Y(-46+bb)]],[1.4,.4],B).tube([[X(18),Y(-41+bb)],[X(18),Y(-46+bb)]],[1.3,.4],B);
  V.px(X(20),Y(-39+bb),K).px(X(21),Y(-39+bb),WH).px(X(25),Y(-33+bb),'#4a4a54'); V.line(X(23),Y(-31+bb),X(26),Y(-32+bb),'#8a8a94');
  const mc=o.manes||[o.mane]; for(let i=0;i<7;i++){ const w=Math.sin(ph+i*.8)*(mv?1.8:.9), rx=7+i*1.5, ry=-29-i*2.1+bb; V.tube([[X(rx),Y(ry)],[X(rx-3.5),Y(ry+1.5+w)],[X(rx-7),Y(ry+4+w*1.5)]],[2.7,2,.6],R(mc[i%mc.length]),{g:'mane'+i,lift:.12}); }   /* bờm mọc trên gáy, bay ngược ra sau */
  V.tube([[X(18),Y(-42+bb)],[X(21),Y(-40+bb)]],[1.6,.6],R(mc[0]),{g:'fl'});   /* chỏm bờm trước trán */
  if(o.horn){ V.tube([[X(20),Y(-42+bb)],[X(26),Y(-52+bb)]],[1.8,.3],R(o.horn)); for(let i=1;i<4;i++) V.px(X(20+i*1.5),Y(-42-i*2.5+bb),'#fff6c0'); }
  if(o.x) o.x(V,f,mv,bb,ph);
  if(o.wing) wing(V,1,-28+bb,-56+wa,21,o.wing.map(R),'wn'); }
// rồng (Rồng Xanh, Hắc Long): cánh dơi, đuôi dài gai, gai lưng, vảy bụng, cổ cong, đầu sừng, mắt sáng
function dragon(V,f,mv,o){ const B=R(o.body), D=R(o.dark), Bl=R(o.belly), Hn=R(o.horn), up=mv?[0,4,0,-3][f]:[0,1,0,1][f], bb=mv?[0,-1,0,-1][f]:0, tw=mv?[0,1.6,0,-1.6][f]:[0,.6,0,-.6][f];
  batWing(V,-4,-28+bb,up,14,R(o.mem),D); paw(V,-11,-14+bb,13,f,mv,.5,D,3.3,'#e8e0d0'); paw(V,8,-14+bb,13,f,mv,0,D,3.1,'#e8e0d0');
  V.tube([[X(-12),Y(-16+bb)],[X(-20),Y(-12+tw)],[X(-28),Y(-8)],[X(-33),Y(-12+tw)]],[5.4,4.2,2.6,.8],B,{g:'tail'}); V.poly([[X(-33),Y(-12+tw)],[X(-37),Y(-17+tw)],[X(-32),Y(-16+tw)]],R(o.spike),{n:[-.3,-.3,.9]});   /* đuôi + mũi giáo */
  for(const [x,y] of [[-18,-17],[-24,-13],[-29,-11]]) V.tube([[X(x),Y(y+tw)],[X(x-1),Y(y-3+tw)]],[1.3,.3],R(o.spike),{g:'ts'});
  V.ell(X(-6),Y(-19+bb),10,9,B,{g:'hip'}); V.ell(X(3),Y(-19+bb),13,9.5,B,{g:'body'}); V.ell(X(5),Y(-15+bb),9,6,Bl,{g:'belly',lift:.1}); for(let i=0;i<4;i++) V.line(X(-1+i*3),Y(-12-i%2+bb),X(7+i*2),Y(-12-i%2+bb),o.plate);
  for(let i=0;i<6;i++) V.tube([[X(-12+i*4),Y(-27+Math.abs(i-2.5)*.7+bb)],[X(-13+i*4),Y(-31+Math.abs(i-2.5)*.7+bb)]],[1.5,.3],R(o.spike),{g:'sp'+i});   /* gai lưng */
  paw(V,-7,-14+bb,13,f,mv,0,B,3.6,'#e8e0d0'); paw(V,11,-14+bb,13,f,mv,.5,B,3.4,'#e8e0d0');
  V.tube([[X(11),Y(-24+bb)],[X(15),Y(-31+bb)],[X(16),Y(-36+bb)]],[6.4,5.4,4.6],B,{g:'neck'}); V.ell(X(18),Y(-38+bb),7,5.8,B,{g:'head'}); V.tube([[X(20),Y(-37+bb)],[X(28),Y(-34+bb)]],[4.6,3.2],B,{g:'snout'});
  V.tube([[X(21),Y(-33+bb)],[X(27),Y(-31+bb)]],[2.4,1.6],D,{g:'jaw'}); V.line(X(21),Y(-34+bb),X(28),Y(-33+bb),K); V.px(X(27),Y(-36+bb),K);
  V.tube([[X(15),Y(-42+bb)],[X(11),Y(-48+bb)],[X(8),Y(-49+bb)]],[1.9,1.1,.4],Hn).tube([[X(19),Y(-43+bb)],[X(20),Y(-50+bb)]],[1.8,.4],Hn);
  V.rect(X(18),Y(-40+bb),3,1,o.eye).px(X(21),Y(-40+bb),'#ffffff'); if(o.x) o.x(V,f,mv,bb); batWing(V,-1,-29+bb,up,15,R(o.mem),D); }
// chim thần bay lơ lửng (Phượng Hoàng, Tinh Vân Thần Điểu): đuôi nhiều dải dài, cánh vỗ, mào, mỏ, chân co
function bird(V,f,mv,o){ const hov=mv?[0,1,2,1][f]:[0,1,1,0][f], y0=-9-hov, fl=[0,26,8,-16][f], Bd=R(o.body), Bl=R(o.belly), Bk=R(o.beak);
  wing(V,-2,y0-17,-76+fl,20,o.wf.map(R),'wf',7);
  o.tail.forEach((c,i)=>{ const ty=y0-12+i*2.6, cur=Math.sin(f*1.4+i)*(mv?2.2:1); V.tube([[X(-10),Y(y0-14)],[X(-20),Y(ty+cur)],[X(-30),Y(ty-3+i*1.6+cur)],[X(-37),Y(ty-6+i*2.4+cur*1.4)]],[2.8,2.3,1.6,.5],R(c),{g:'tl'+i}); });
  V.ell(X(0),Y(y0-14),12,7.4,Bd,{g:'body'}); V.ell(X(5),Y(y0-13),7,5,Bl,{g:'belly',lift:.1});
  V.tube([[X(-3),Y(y0-8)],[X(-2),Y(y0-3)]],[1.1,.7],Bk).tube([[X(3),Y(y0-8)],[X(4),Y(y0-3)]],[1.1,.7],Bk); V.px(X(-3),Y(y0-2),Bk[2]?'#a87018':'#a87018').px(X(5),Y(y0-2),'#a87018');   /* chân co */
  V.tube([[X(8),Y(y0-17)],[X(13),Y(y0-24)]],[4.4,3.4],Bd,{g:'neck'}); V.ell(X(15),Y(y0-26),4.8,4.2,Bd,{g:'head'}); V.poly([[X(18),Y(y0-28)],[X(25),Y(y0-25)],[X(18),Y(y0-24)]],Bk,{n:[-.3,-.3,.9]});
  for(const [dx,dy] of [[-3,-7],[-1,-9],[1,-8],[3,-6]]) V.tube([[X(14),Y(y0-30)],[X(14+dx),Y(y0-30+dy)]],[1.5,.4],R(o.crest),{g:'cr'});   /* mào */
  V.px(X(16),Y(y0-27),K).px(X(17),Y(y0-27),o.eye||'#ffffff'); if(o.x) o.x(V,f,mv,y0);
  wing(V,0,y0-18,-66+fl,22,o.wn.map(R),'wn',8); }

const M={
  thienma:{seat:{dx:-2,dy:-27},mouth:{dx:26,dy:-33},draw:(V,f,mv)=>horse(V,f,mv,{body:'#f4f6fa',dark:'#b8c0d0',manes:['#ffd84a','#ffe9a0'],tail:['#ffd84a','#ffe9a0'],wing:['#ffffff','#eef4ff','#d8e4f4','#c0d0e8']})},
  kylan:{seat:{dx:-2,dy:-27},mouth:{dx:26,dy:-33},draw:(V,f,mv)=>horse(V,f,mv,{body:'#fbf8ff',dark:'#c8bcd8',manes:['#ff5a5a','#ffb03a','#ffe066','#6ad86a','#5aa0ff','#b070ff'],tail:['#ff5a5a','#ffe066','#6ad86a','#5aa0ff','#b070ff'],horn:'#ffd84a',hoof:'#ffd84a',
    x:(V,f,mv,bb)=>{ for(let i=0;i<4;i++) V.px(X(-4+i*5),Y(-30+(i+f)%2+bb),'#fff6c0'); }})},
  bacho:{seat:{dx:-3,dy:-23},mouth:{dx:25,dy:-22},draw:(V,f,mv)=>{ const W=R('#f6f4ee'), D=R('#c8c4bc'), Sk='#2a2630', bb=mv?[0,-1,0,-1][f]:0, tw=mv?[0,2,0,-2][f]:[0,.6,0,-.6][f];   /* Bạch Hổ: thân trắng vằn đen nhọn dài ngắn so le, bàn chân to, đầu to bờm má xù, mắt xanh băng sáng */
    paw(V,-11,-13+bb,12,f,mv,.5,D,3,'#3a3a44'); paw(V,9,-13+bb,12,f,mv,0,D,2.9,'#3a3a44');
    V.tube([[X(-14),Y(-18+bb)],[X(-21),Y(-21+tw)],[X(-26),Y(-29+tw)],[X(-24),Y(-34+tw)]],[2.8,2.5,2.1,1.4],W,{g:'t'}); for(const [x,y] of [[-20,-21],[-24,-25],[-26,-30]]) V.line(X(x-1),Y(y-1+tw),X(x+1.5),Y(y+1+tw),Sk); V.ell(X(-24),Y(-34+tw),1.6,1.4,R('#2a2630'),{g:'tt'});
    V.ell(X(-7),Y(-19+bb),9.5,8,W,{g:'hip'}); V.ell(X(3),Y(-19+bb),13,7.6,W,{g:'body'}); V.ell(X(6),Y(-14+bb),9,4,R('#ffffff'),{g:'belly',lift:.1});
    [[-13,5],[-9.5,7],[-6,5.5],[-2.5,8],[1,6],[4.5,7.5],[8,5]].forEach(([x,l],i)=>{ const top=-26.5+Math.abs(x+2)*.06+bb, tilt=i%2?1.2:-.6; V.poly([[X(x-1.3),Y(top)],[X(x+1.3),Y(top)],[X(x+tilt),Y(top+l)]],R(Sk),{n:[0,0,1],g:'st'+i}); });   /* vằn nhọn so le */
    paw(V,-8,-13+bb,12,f,mv,0,W,3.3,'#3a3a44'); paw(V,12,-13+bb,12,f,mv,.5,W,3.1,'#3a3a44'); V.line(X(-9),Y(-9+bb),X(-7),Y(-8+bb),Sk).line(X(11),Y(-9+bb),X(13),Y(-8+bb),Sk);
    V.ell(X(18),Y(-25+bb),8,7.2,W,{g:'head'}); V.ell(X(13),Y(-22+bb),4.4,5,R('#ffffff'),{g:'ruff',lift:.12}); V.ell(X(23),Y(-21.5+bb),4.4,3.4,R('#ffffff'),{g:'muzzle'});
    V.tube([[X(14),Y(-31+bb)],[X(13),Y(-34+bb)]],[2.4,.9],W).tube([[X(20),Y(-31+bb)],[X(21),Y(-34+bb)]],[2.4,.9],W); V.px(X(14),Y(-32+bb),'#e8a0b0').px(X(20),Y(-32+bb),'#e8a0b0');
    V.line(X(16),Y(-30+bb),X(20),Y(-30+bb),Sk).line(X(17),Y(-29+bb),X(19),Y(-29+bb),Sk).line(X(18),Y(-31+bb),X(18),Y(-28+bb),Sk);   /* vằn trán */
    V.rect(X(19),Y(-26+bb),3,1,'#3ae0ff').px(X(21),Y(-26+bb),WH).px(X(19),Y(-25+bb),Sk); V.line(X(13),Y(-26+bb),X(16),Y(-24+bb),Sk).line(X(12),Y(-22+bb),X(15),Y(-21+bb),Sk);
    V.ell(X(26.5),Y(-22.5+bb),1.3,1,R('#e8708a'),{g:'nose'}); V.line(X(22),Y(-19+bb),X(26),Y(-19+bb),'#8a8a94'); V.px(X(24),Y(-20+bb),Sk).px(X(25),Y(-20+bb),Sk); }},
  rongxanh:{seat:{dx:-3,dy:-27},mouth:null,draw:(V,f,mv)=>dragon(V,f,mv,{body:'#2a9a5a',dark:'#1e6a44',belly:'#a8d83a',horn:'#e8e0a0',spike:'#a8d83a',mem:'#8ac83a',plate:'#7aa82a',eye:'#ffe066'})},
  phuong:{seat:{dx:-2,dy:-30},mouth:null,draw:(V,f,mv)=>bird(V,f,mv,{body:'#e8402a',belly:'#ffe066',beak:'#ffd84a',crest:'#ffe066',tail:['#e8402a','#ff9a2a','#ffe066','#ff9a2a','#e8402a'],wf:['#ff9a2a','#e8402a','#a82a1a'],wn:['#ffe066','#ff9a2a','#e8402a'],
    x:(V,f,mv,y0)=>{ for(let i=0;i<5;i++) V.px(X(-36+((i*7+f*3)%10)),Y(y0-14+i*2),['#fff3b0','#ffd84a','#ff8a2a'][i%3]); }})},
  haclong:{seat:{dx:-3,dy:-27},mouth:null,draw:(V,f,mv)=>dragon(V,f,mv,{body:'#2e2440',dark:'#1a1426',belly:'#4a2a6a',horn:'#c8c0d8',spike:'#7a3ac8',mem:'#4a2a6a',plate:'#6a3aa8',eye:'#ff2a3a',
    x:(V,f,mv,bb)=>{ if(f%2) V.px(X(29),Y(-33+bb),'#b070ff').px(X(30),Y(-34+bb),'#d8a0ff'); }})},
  // Xích Thố (ông Trường Con): ngựa chiến đỏ rực, bờm + đuôi như lửa đổi màu theo hệ (chưa chọn hệ: lửa cam), lửa liếm quanh móng, yên vàng
  ...Object.fromEntries(Object.entries(XT_FC).map(([el,fc])=>['xichtho_'+el,{seat:{dx:-2,dy:-27},mouth:{dx:26,dy:-33},
    draw:(V,f,mv)=>horse(V,f,mv,{body:'#c8302a',dark:'#7a1a1e',manes:fc,tail:[fc[0],fc[2],fc[1],fc[0]],hoof:'#2a2026',
      x:(V,f,mv,bb)=>{ V.rect(X(-5),Y(-29+bb),9,2,'#c8a23a').rect(X(-4),Y(-28+bb),7,2,'#7a4a22'); for(let i=0;i<4;i++){ const hx0=[-12,-8,8,11][i], fy=-1-((f+i)%2); V.px(X(hx0+(i%2)),Y(fy-1),fc[1]).px(X(hx0+1-(i%2)),Y(fy-2),fc[0]); }   /* yên vàng + lửa liếm móng */
        V.px(X(20),Y(-39+bb),'#ffd84a'); }})}])),
  // Thuỷ Quân: thú thần nước xanh băng, bờm mây tím → xanh ngọc ánh sao bay ngược ra sau, 2 dải lụa trắng, mào trắng trên trán
  thuyquan:{seat:{dx:-2,dy:-27},mouth:null,draw:(V,f,mv)=>horse(V,f,mv,{body:'#d0f0f8',dark:'#7ac0dc',manes:['#7a5ad8','#3a8ae8','#3ad8e8'],tail:['#6a4ad8','#3a8ae8','#3ad8e8'],hoof:'#9adcec',
    x:(V,f,mv,bb,ph)=>{ const cl=['#6a4ad8','#5a5ae8','#3a8ae8','#3ab8e8','#3ad8e8'];
      for(let i=0;i<7;i++){ const w=Math.sin(ph+i*.9)*(mv?1.8:.9); V.ell(X(8-i*4.6),Y(-34+i*1.6+w+bb),6.4-i*.35,4.6-i*.2,R(cl[Math.min(4,i>>1)]),{g:'cloud'+i,lift:.15}); }   /* bờm mây */
      stars(V,[[6,-36],[1,-34],[-4,-33],[-9,-31],[-14,-30],[-19,-28],[3,-31],[-8,-35]],f);
      for(const [k,dy] of [[0,0],[1,3]]){ const w=Math.sin(ph+k*2)*(mv?2:1); V.tube([[X(12),Y(-24+bb)],[X(4),Y(-16+dy+w)],[X(-8),Y(-14+dy+w)],[X(-18),Y(-20+dy+w*1.4)]],[1.1,1,.9,.6],R('#f8fcff'),{g:'rib'+k,lift:.3}); }   /* 2 dải lụa trắng */
      V.poly([[X(18),Y(-44+bb)],[X(21),Y(-49+bb)],[X(22),Y(-43+bb)]],R('#ffffff'),{n:[-.2,-.3,.93],g:'crest'}); V.rect(X(20),Y(-39+bb),2,1,'#e8302a'); }})},
  // Tinh Vân Thần Điểu: chim trắng mào + mỏ + vuốt vàng, cánh và đuôi như ngọn lửa xanh ngọc tím than lấp lánh sao
  tinhvan:{seat:{dx:-2,dy:-30},mouth:null,draw:(V,f,mv)=>bird(V,f,mv,{body:'#f4f8fc',belly:'#ffffff',beak:'#ffc83a',crest:'#ffd84a',eye:'#3ad8e8',tail:['#1e5a8a','#2a9ac8','#3ad8e8','#2a9ac8','#1e5a8a','#3ad8e8'],wf:['#2a9ac8','#1e5a8a','#123a5a'],wn:['#5ae8f0','#2ab8c8','#1e6a9a','#143a6a'],
    x:(V,f,mv,y0)=>stars(V,[[-14,y0-14],[-22,y0-12],[-30,y0-10],[-26,y0-6],[-34,y0-8],[-6,y0-30],[-10,y0-26],[2,y0-34],[-2,y0-38]],f)})}};
const CACHE={};
A.mythMount=(k,f=0,mv=false)=>{ const m=M[k]; if(!m) return null; const key=k+(f%4)+(mv?'m':''); if(CACHE[key]) return CACHE[key]; const V=vol(80,64); m.draw(V,f%4,mv);
  if(k.startsWith('xichtho')){ const el=k.slice(8), col=hx((XT_FC[el]||XT_FC[''])[0]); return CACHE[key]={c:xtFlag(xtFlame(V.done(false,{glow:`rgba(${col.join(',')},.4)`,gr:3}),el,f%4,mv),el,f%4,mv),ax:40,ay:62}; }
  return CACHE[key]={c:V.done(false,k==='tinhvan'?{glow:'rgba(90,220,240,.35)',gr:2}:k==='thuyquan'?{glow:'rgba(140,120,255,.3)',gr:2}:undefined),ax:40,ay:62}; };
A.XT_FC=XT_FC;   /* màu lửa theo hệ cho hiệu ứng phun lửa / vết cháy (game.js) */
A.mythMount.M=Object.fromEntries(Object.entries(M).map(([k,m])=>[k,{seat:m.seat,mouth:m.mouth}]));
// chuồng thần thú ở MU: mái lá, rào gỗ, máng cỏ, tượng rồng nhỏ
A.mythStable=()=>A.sprite(56,46,28,44,(g,P)=>{ for(let i=0;i<8;i++) P.rect(2+Math.round(i*6.5),6,7,10,i%2?'#3a8a4a':'#c8a040'); P.rect(2,16,52,2,'#5a3a22');
  P.rect(4,18,2,26,'#6a4a2a'); P.rect(50,18,2,26,'#6a4a2a'); for(let x=6;x<50;x+=6) P.rect(x,32,2,12,'#8a5a32'); P.rect(6,34,44,2,'#a87040'); P.rect(6,40,44,2,'#a87040');
  P.rect(10,27,14,5,'#5a3a22'); P.rect(11,25,12,3,'#c8c060'); P.disc(36,26,5,'#2a9a5a'); P.rect(33,20,2,3,'#e8e0a0'); P.rect(38,20,2,3,'#e8e0a0'); P.px(38,25,'#1c1516');
  P.rect(12,0,32,7,'#1c1516'); A.drawText(g,'THAN THU',13,1,'#a8e86a'); });
})();
