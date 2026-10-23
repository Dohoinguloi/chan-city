/* Chan City — boss Đỉnh Bắc (MU): 6 anh em Siêu Nhân (đồ bó màu, dải kim cương trắng ngang ngực, găng + ủng trắng, đai có Đồng Năng Lượng, mũ kính đen theo linh thú,
   vũ khí riêng: Kiếm Thần Long / Thương / Song Dao / Cung / Rìu / Dao Rồng + giáp vàng của Xanh Lá), Megazord, thần chết Ryuk + Rem, Yasuo, Yone.
   Vẽ khối bằng A.vol như art21: khung 0 / 4 đứng thở, 2 / 3 đi chân so le, 1 ra đòn. Ghi đè A.muBossSprite / A.bossAnim cho các loài này. */
(function(){
const A=ART, vol=A.vol, WH='#ffffff';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const ANIM5={idle:[0,4],walk:[2,3],atk:1}, pose=f=>({st:f===2?1:f===3?-1:0,bob:f===2||f===3||f===4?1:0,atk:f===1});
const B23={};

/* ---------- Siêu Nhân ---------- */
// thân chung: chân + ủng trắng, thân bó màu, dải kim cương trắng ngang ngực, đai xám khoá vàng, tay găng trắng, mũ màu kính đen + miếng bạc che miệng
function ranger(V,f,c,o){ const {st,bob,atk}=pose(f), Su=R(c), Wh=R('#f2f2ee'), Sv=R('#c8ccd8'), Bk=R('#16141c'), y=v=>v+bob;
  for(const [hx0,s] of [[17,-1],[27,1]]){ const ax0=hx0+s*st*3+(atk?s*2:0); V.tube([[hx0,y(39)],[(hx0+ax0)/2,y(48)-bob],[ax0,54]],[4.2,3.8,3.4],Su,{g:'leg'+hx0,flat:.2});
    V.tube([[ax0,52],[ax0,58]],3.8,Wh,{g:'boot'+hx0}); V.ell(ax0+s,59.6,4.6,2.1,Wh,{g:'foot'+hx0,lift:.15}); }
  V.ell(22,y(30),10.5,10.5,Su,{g:'torso'});
  V.rect(12,y(22),21,5,'#f2f2ee'); for(let i=0;i<5;i++){ const x=13+i*4; V.px(x+1,y(23),c).px(x,y(24),c).px(x+2,y(24),c).px(x+1,y(25),c); }   /* dải kim cương trắng */
  V.rect(13,y(36),18,3,'#7a7e8a'); V.rect(19,y(35),6,5,'#e8b830'); V.px(21,y(36),'#fff3b0');   /* đai + Đồng Năng Lượng */
  if(o.gold){ V.poly([[10,y(20)],[34,y(20)],[31,y(29)],[22,y(32)],[13,y(29)]],R('#e8b830'),{n:[-.2,-.3,.93],g:'shield'}); for(const [x,yy] of [[16,24],[22,26],[28,24]]){ V.px(x,y(yy),'#16141c').px(x-1,y(yy+1),'#16141c').px(x+1,y(yy+1),'#16141c').px(x,y(yy+2),'#16141c'); } }   /* giáp vàng Siêu Nhân Xanh Lá */
  const sh=y(22); if(atk){ V.tube([[31,sh],[37,y(27)],[42,y(25)]],[3.6,3.2,3],Su,{g:'armR'}); V.ell(42,y(25),3.2,3.2,Wh,{g:'glvR',lift:.2}); V.tube([[13,sh],[8,y(30)],[10,y(35)]],[3.6,3.2,3],Su,{g:'armL'}); V.ell(10,y(36),3,3,Wh,{g:'glvL',lift:.2}); }
  else { const sw=st*3; V.tube([[13,sh],[10,y(30)],[10+st,y(36)-sw]],[3.6,3.3,3],Su,{g:'armL'}); V.ell(10+st,y(37)-sw,3,3,Wh,{g:'glvL',lift:.2}); V.tube([[31,sh],[34,y(30)],[34-st,y(36)+sw]],[3.6,3.3,3],Su,{g:'armR'}); V.ell(34-st,y(37)+sw,3,3,Wh,{g:'glvR',lift:.2}); }
  V.tube([[22,y(18)],[22,y(21)]],3.2,Su,{g:'neck'}); V.ell(22,y(12),8.4,8.8,Su,{g:'helm'});
  V.poly(o.visor.map(([x,yy])=>[x,y(yy)]),Bk,{n:[-.1,-.2,.97],g:'visor'}); V.px(16,y(9),'#5a5a6a').px(17,y(9),'#5a5a6a');
  V.poly([[18,y(15)],[26,y(15)],[25,y(19)],[19,y(19)]],Sv,{g:'mouth'}); V.line(20,y(17),24,y(17),'#7a7e8a');
  if(o.wep) o.wep(V,atk,y,st); }
// kính mũ theo linh thú: khủng long bạo chúa, voi ma mút, hổ răng kiếm, khủng long ba sừng, dực long, rồng
const VIS={t:[[14,9],[30,9],[28,13],[24,11],[20,11],[16,13]],m:[[14,8],[30,8],[30,11],[25,12],[22,16],[19,12],[14,11]],s:[[15,8],[29,8],[27,13],[22,10],[17,13]],
  tr:[[14,9],[30,9],[30,12],[22,12],[14,12]],p:[[14,8],[30,8],[28,11],[22,14],[16,11]],d:[[14,9],[30,9],[29,12],[22,11],[15,12]]};
const SW=R('#d8dce8'), HI=R('#3a3444');
B23.r_do={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#e8302a',{visor:VIS.t,wep:(V,atk,y)=>{ if(atk){ V.poly([[42,y(24)],[47,y(4)],[48,y(5)],[44,y(25)]],SW,{n:[-.3,-.2,.93],g:'blade'}); V.rect(39,y(24),7,2,'#e8b830'); }   /* Kiếm Thần Long */
  else V.poly([[34,y(38)],[36,y(56)],[35,y(57)],[33,y(39)]],SW,{g:'blade'}); }}); }};
B23.r_xanh={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#2a5ad8',{visor:VIS.tr,wep:(V,atk,y)=>{ const p=atk?[[4,y(26)],[47,y(22)]]:[[36,y(6)],[36,y(56)]]; V.tube(p,1.1,R('#8a8e9a'),{g:'shaft'});   /* thương 2 đầu */
  for(const [x,yy,d] of atk?[[47,22,1],[4,26,-1]]:[[36,6,0],[36,56,0]]){ if(d) V.poly([[x,y(yy)-2],[x+d*5,y(yy)],[x,y(yy)+2]],SW,{g:'tip'+x}); else V.poly([[x-2,yy<20?y(yy):y(yy)],[x,yy<20?y(yy)-5:y(yy)+5],[x+2,y(yy)]],SW,{g:'tip'+yy}); } }}); }};
B23.r_vang={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#f2c42a',{visor:VIS.s,wep:(V,atk,y)=>{ const d=(x,yy,up)=>V.poly([[x-1,y(yy)],[x+1,y(yy)],[x+(up?3:1),y(yy)+(up?-8:8)]],SW,{g:'dg'+x}); if(atk){ d(42,24,1); d(10,36,0); } else { d(10,37,0); d(34,37,0); } }}); }};   /* song dao */
B23.r_hong={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#ff70b8',{visor:VIS.p,wep:(V,atk,y)=>{ const x0=atk?43:35, yc=atk?y(25):y(36); V.tube([[x0-2,yc-11],[x0+3,yc],[x0-2,yc+11]],1.3,R('#f4f0f4'),{g:'bow'}); V.line(x0-2,yc-11,x0-2,yc+11,'#ffffff');   /* Cung Thiên Nga */
  if(atk){ V.line(26,yc,x0+2,yc,'#e8e0c8'); V.poly([[x0+2,yc-2],[x0+6,yc],[x0+2,yc+2]],SW,{g:'arrow'}); } }}); }};
B23.r_den={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#2a2a34',{visor:VIS.m,wep:(V,atk,y)=>{ const [hx0,hy]=atk?[44,y(14)]:[36,y(44)]; V.tube([[atk?42:34,atk?y(26):y(36)],[hx0,hy]],1.3,R('#6a6e7a'),{g:'haft'});   /* Rìu Voi Ma Mút */
  V.poly([[hx0-5,hy-3],[hx0+5,hy-5],[hx0+6,hy+4],[hx0-4,hy+3]],SW,{n:[-.3,-.2,.93],g:'axe'}); V.rect(hx0-1,hy-1,2,2,'#e8302a'); }}); }};
B23.r_xanhla={w:48,h:64,ax:22,ay:62,anim:ANIM5,draw(V,f){ ranger(V,f,'#2ab85a',{visor:VIS.d,gold:1,wep:(V,atk,y)=>{ const [x,yy]=atk?[42,y(25)]:[34,y(37)]; V.tube([[x,yy],[x+(atk?5:0),yy-(atk?0:-9)]],[1.6,1.2],R('#e8ecf2'),{g:'dd'});   /* Dao Rồng: chuôi sáo vàng */
  V.rect(x-1,yy-1,3,3,'#e8b830'); V.px(x,yy+1,'#e8302a'); }}); }};

/* ---------- Megazord: đầu bạc sừng vàng, ngực khủng long đỏ, cổ giáp hồng dực long, vai đen voi ma mút, chân xanh + vàng, Kiếm Thần Megazord ---------- */
B23.megazord={w:120,h:132,ax:56,ay:129,anim:ANIM5,glow:'rgba(255,216,74,.25)',draw(V,f){ const {st,bob,atk}=pose(f), Rd=R('#d8302a'), Sv=R('#c8ccd8'), Gd=R('#e8b830'), Bl=R('#2a5ad8'), Ye=R('#f2c42a'), Bk=R('#2a2a34'), Pk=R('#ff70b8'), y=v=>v+bob;
  for(const [hx0,s,C] of [[44,-1,Ye],[68,1,Bl]]){ const ax0=hx0+s*st*5+(atk?s*4:0); V.poly([[hx0-10,y(80)],[hx0+10,y(80)],[ax0+9,116],[ax0-9,116]],C,{n:[-.25,-.2,.94],g:'leg'+hx0}); V.rect(ax0-11,116,22,12,'#5a5e6a'); V.rect(ax0-11,116,22,2,'#8a8e9a'); V.rect(hx0-6,y(92),12,6,'#1c1a22'); }
  V.poly([[34,y(42)],[78,y(42)],[74,y(82)],[38,y(82)]],Rd,{n:[-.25,-.25,.93],g:'chest'}); V.poly([[40,y(46)],[72,y(46)],[56,y(60)]],R('#a8201e'),{g:'tooth'});
  for(let i=0;i<5;i++) V.rect(42+i*6,y(48),3,4,'#f4f0e8');   /* răng khủng long trên ngực */
  V.rect(44,y(70),24,6,'#5a5e6a'); V.rect(52,y(68),8,10,'#e8b830');
  V.poly([[38,y(38)],[74,y(38)],[68,y(46)],[44,y(46)]],Pk,{g:'collar'});
  for(const [sx,s] of [[30,-1],[82,1]]){ V.ell(sx,y(44),12,10,Bk,{g:'pad'+sx}); V.rect(sx-6,y(40),12,2,'#e8b830'); }
  if(atk){ V.tube([[86,y(48)],[98,y(56)],[106,y(50)]],[7,6,5],Sv,{g:'armR'}); V.ell(106,y(50),6,6,Sv,{g:'fistR'}); V.poly([[102,y(46)],[118,y(2)],[120,y(4)],[108,y(50)]],R('#e8ecf4'),{n:[-.3,-.2,.93],g:'sword'}); V.rect(100,y(46),12,4,'#e8b830');
    V.tube([[26,y(48)],[18,y(62)],[22,y(74)]],[7,6,5],Sv,{g:'armL'}); V.ell(22,y(75),6,6,Sv,{g:'fistL'}); }
  else { const sw=st*3; V.tube([[26,y(48)],[20,y(64)],[20+st,y(78)-sw]],[7,6,5.5],Sv,{g:'armL'}); V.ell(20+st,y(79)-sw,6,6,Sv,{g:'fistL'}); V.tube([[86,y(48)],[92,y(64)],[92-st,y(78)+sw]],[7,6,5.5],Sv,{g:'armR'}); V.ell(92-st,y(79)+sw,6,6,Sv,{g:'fistR'});
    V.poly([[96,y(82)],[98,y(126)],[95,y(127)],[93,y(83)]],R('#e8ecf4'),{g:'sword'}); V.rect(89,y(80),10,3,'#e8b830'); }
  V.ell(56,y(30),11,11,Sv,{g:'head'}); V.poly([[47,y(24)],[65,y(24)],[63,y(33)],[49,y(33)]],R('#1c1a22'),{g:'face'}); V.rect(50,y(27),4,2,'#ff3a3a').rect(58,y(27),4,2,'#ff3a3a');
  V.poly([[50,y(20)],[56,y(4)],[62,y(20)]],Gd,{g:'crest'}); V.poly([[44,y(24)],[38,y(14)],[46,y(20)]],Gd,{g:'hornL'}); V.poly([[68,y(24)],[74,y(14)],[66,y(20)]],Gd,{g:'hornR'}); }};

/* ---------- Ryuk: thần chết cao gầy, da xám xanh, tóc đen dựng, mắt vàng con ngươi đỏ, miệng cười rộng môi đỏ, áo lông vũ đen, đôi cánh xương, cầm táo ---------- */
B23.ryuk={w:96,h:116,ax:48,ay:113,anim:ANIM5,glow:'rgba(120,60,200,.3)',draw(V,f){ const {st,bob,atk}=pose(f), Sk=R('#b4c0ce'), Bk=R('#1e1a24'), Fe=R('#2a2432'), Wg=R('#3a3040'), Ap=R('#d8202a'), y=v=>v+bob, fl=f%2;
  for(const s of [-1,1]){ const bx=48+s*14; V.tube([[bx,y(44)],[bx+s*26,y(18)-fl],[bx+s*40,y(30)]],[2.2,1.8,1.4],Wg,{g:'wbone'+s}); for(let i=0;i<4;i++){ const k=i/3, x1=bx+s*(14+k*26), y1=y(24)-fl+k*8; V.poly([[x1,y1],[x1+s*6,y1+3],[bx+s*(10+k*20),y(58)+k*6]],Fe,{n:[s*.2,-.2,.95],g:'wing'+s+i}); } }   /* cánh xương rách */
  for(const [hx0,s] of [[42,-1],[54,1]]){ const ax0=hx0+s*st*4+(atk?s*3:0); V.tube([[hx0,y(76)],[(hx0+ax0)/2,y(92)-bob],[ax0,108]],[3.6,3,2.6],Bk,{g:'leg'+hx0}); V.ell(ax0+s*2,110.5,5,2.2,Bk,{g:'foot'+hx0,lift:.1}); }
  V.poly([[34,y(42)],[62,y(42)],[66,y(78)],[30,y(78)]],Fe,{n:[-.2,-.25,.94],g:'coat'}); for(let i=0;i<6;i++) V.line(32+i*6,y(64),30+i*6,y(78),'#3a3444');   /* áo lông vũ */
  V.tube([[34,y(60)],[62,y(56)]],1.6,R('#5a4a3a'),{g:'belt'}); V.ell(40,y(60),2.6,2.6,R('#e8dcc0'),{g:'skull',lift:.2});
  if(atk){ V.tube([[60,y(46)],[76,y(54)],[90,y(50)]],[3.2,2.6,2.2],Sk,{g:'armR'}); for(let i=0;i<4;i++) V.line(90,y(50),94,y(46+i*2),'#d8dce4');   /* vuốt dài */
    V.tube([[36,y(46)],[28,y(62)],[32,y(72)]],[3.2,2.6,2.2],Sk,{g:'armL'}); }
  else { const sw=st*3; V.tube([[36,y(46)],[28,y(64)],[28+st,y(78)-sw]],[3.2,2.6,2.2],Sk,{g:'armL'}); V.tube([[60,y(46)],[68,y(64)],[68-st,y(76)+sw]],[3.2,2.6,2.2],Sk,{g:'armR'}); V.ell(68-st,y(80)+sw,4,4,Ap,{g:'apple',lift:.3}); V.px(67-st,y(78)+sw,'#ff8a8a').px(68-st,y(75)+sw,'#5a3a22'); }   /* cầm táo */
  V.tube([[48,y(36)],[48,y(42)]],3,Sk,{g:'neck'}); V.ell(48,y(28),11,11,Sk,{g:'head'});
  for(let i=0;i<9;i++){ const a=(-170+i*20)*Math.PI/180, L=12+(i%2)*5; V.tube([[48+Math.cos(a)*7,y(22)+Math.sin(a)*6],[48+Math.cos(a)*(7+L),y(22)+Math.sin(a)*(5+L*.8)]],[3,1],Bk,{g:'hair'}); }   /* tóc đen dựng nhọn */
  V.ell(43,y(26),3.2,3.6,R('#ffe066'),{g:'eyeL',lift:.4}); V.ell(53,y(26),3.2,3.6,R('#ffe066'),{g:'eyeR',lift:.4}); V.rect(43,y(26),1,2,'#c8202a').rect(53,y(26),1,2,'#c8202a');
  const mw=atk?18:16; V.rect(48-mw/2,y(33),mw,4,'#3a0a14'); V.rect(48-mw/2,y(32),mw,1,'#c8202a'); V.rect(48-mw/2,y(37),mw,1,'#c8202a'); for(let x=49-mw/2;x<48+mw/2;x+=2) V.px(x,y(33),'#f4f0e8').px(x+1,y(36),'#f4f0e8'); }};   /* cười rộng răng nhọn */
/* ---------- Rem: thần chết trắng xương, thân như băng quấn, 1 mắt vàng, gai xương trên đầu, đuôi xương ---------- */
B23.rem={w:84,h:110,ax:42,ay:107,anim:ANIM5,glow:'rgba(220,220,255,.3)',draw(V,f){ const {st,bob,atk}=pose(f), Bn=R('#e8e4dc'), Bd=R('#c8c0b0'), y=v=>v+bob;
  V.tube([[50,y(74)],[66,y(88)],[74,y(100)],[80,y(96)]],[3,2.4,1.8,1.2],Bd,{g:'tail'});
  for(const [hx0,s] of [[36,-1],[48,1]]){ const ax0=hx0+s*st*4+(atk?s*3:0); V.tube([[hx0,y(70)],[(hx0+ax0)/2,y(86)-bob],[ax0,103]],[3.6,3,2.6],Bn,{g:'leg'+hx0}); V.ell(ax0+s*2,105,4.6,2,Bd,{g:'foot'+hx0}); }
  V.ell(42,y(56),12,16,Bn,{g:'body'}); for(let i=0;i<6;i++) V.line(31,y(44+i*5),53,y(46+i*5),'#a8a094');   /* băng quấn */
  if(atk){ V.tube([[52,y(44)],[66,y(50)],[80,y(46)]],[3,2.6,2],Bn,{g:'armR'}); V.poly([[78,y(42)],[84,y(46)],[78,y(50)]],R('#f8f4ec'),{g:'claw'}); V.tube([[32,y(44)],[24,y(60)],[28,y(70)]],[3,2.6,2],Bn,{g:'armL'}); }
  else { const sw=st*3; V.tube([[32,y(44)],[24,y(60)],[24+st,y(74)-sw]],[3,2.6,2],Bn,{g:'armL'}); V.tube([[52,y(44)],[60,y(60)],[60-st,y(74)+sw]],[3,2.6,2],Bn,{g:'armR'}); }
  V.ell(42,y(28),10,12,Bn,{g:'head'}); for(const [x,yy,dx] of [[34,18,-6],[38,14,-3],[46,14,3],[50,18,6],[42,12,0]]) V.tube([[x,y(yy)],[x+dx,y(yy)-10]],[2.4,.8],Bd,{g:'spike'});   /* gai xương */
  V.ell(46,y(28),3.4,3,R('#ffe066'),{g:'eye',lift:.5}); V.rect(46,y(28),2,1,'#c8202a'); V.line(35,y(27),40,y(29),'#5a5048'); V.rect(38,y(35),9,2,'#3a2a2a'); for(let x=38;x<47;x+=2) V.px(x,y(35),'#f4f0e8'); }};

/* ---------- Yasuo: tóc nâu đen búi đuôi ngựa, râu lún phún, áo xanh chàm 1 vai giáp da, đai trắng, chuỗi hạt, quần nâu, kiếm dài ---------- */
function samurai(V,f,o){ const {st,bob,atk}=pose(f), Sk=R('#e8b890'), Rb=R(o.robe), Rd=R(o.robe2), Pa=R(o.pant), Hr=R(o.hair), y=v=>v+bob;
  for(const [hx0,s] of [[20,-1],[30,1]]){ const ax0=hx0+s*st*4+(atk?s*4:0); V.tube([[hx0,y(42)],[(hx0+ax0)/2,y(52)-bob],[ax0,61]],[4.4,3.8,3],Pa,{g:'leg'+hx0,flat:.2}); V.tube([[ax0,60],[ax0,64]],2.8,R('#3a2a22'),{g:'boot'+hx0}); V.ell(ax0+s,65.4,4,1.8,R('#3a2a22'),{g:'foot'+hx0}); }
  V.poly([[14,y(22)],[36,y(22)],[38,y(46)],[12,y(46)]],Rb,{n:[-.25,-.25,.93],g:'robe'}); V.poly([[25,y(22)],[36,y(22)],[38,y(46)],[27,y(46)]],Rd,{g:'robe2'});
  V.tube([[13,y(38)],[37,y(38)]],2.2,R(o.sash),{g:'sash'}); V.tube([[33,y(39)],[37,y(48)]],[1.6,1],R(o.sash),{g:'sashT'});
  if(o.pad) { V.ell(35,y(23),6,4.4,R('#8a6a4a'),{g:'pad'}); V.line(31,y(23),39,y(23),'#5a4030'); }
  if(o.beads) for(let i=0;i<7;i++){ const a=(.15+i*.12)*Math.PI; V.px(Math.round(25+Math.cos(a)*7),Math.round(y(22)+Math.sin(a)*6),i%2?'#8a3a2a':'#c8a060'); }
  const sh=y(24); if(atk){ V.tube([[34,sh],[42,y(30)],[48,y(28)]],[3.2,2.8,2.4],o.bare?Sk:Rb,{g:'armR'}); V.ell(48,y(28),2.6,2.6,Sk,{g:'handR'}); V.tube([[16,sh],[10,y(32)],[14,y(38)]],[3.2,2.8,2.4],Rb,{g:'armL'}); V.ell(14,y(38),2.4,2.4,Sk,{g:'handL'}); o.blade(V,true,y); }
  else { const sw=st*3; V.tube([[16,sh],[12,y(33)],[12+st,y(40)-sw]],[3.2,2.8,2.4],Rb,{g:'armL'}); V.ell(12+st,y(41)-sw,2.4,2.4,Sk,{g:'handL'}); V.tube([[34,sh],[38,y(33)],[38-st,y(40)+sw]],[3.2,2.8,2.4],o.bare?Sk:Rb,{g:'armR'}); V.ell(38-st,y(41)+sw,2.4,2.4,Sk,{g:'handR'}); o.blade(V,false,y); }
  V.tube([[25,y(18)],[25,y(22)]],2.6,Sk,{g:'neck'}); V.ell(25,y(12),7.4,8,Sk,{g:'face'}); V.ell(25,y(5.5),8,3.6,Hr,{g:'hair',lift:.1}); V.ell(18.6,y(10),1.8,4.6,Hr,{g:'side'}); o.head(V,y); }
const katana=(col,hilt)=>(V,atk,y)=>{ if(atk){ V.poly([[47,y(27)],[64,y(9)],[65,y(10)],[49,y(29)]],R(col),{n:[-.3,-.2,.93],g:'kat'}); V.rect(45,y(27),4,3,hilt); } else { V.poly([[39,y(42)],[44,y(64)],[43,y(65)],[38,y(43)]],R(col),{g:'kat'}); V.rect(37,y(40),4,3,hilt); } };
B23.yasuo={w:66,h:70,ax:25,ay:67,anim:ANIM5,glow:'rgba(160,220,255,.3)',draw(V,f){ samurai(V,f,{robe:'#3a4a7a',robe2:'#2a3660',pant:'#6a4a32',hair:'#3a2a22',sash:'#e8e4dc',pad:1,beads:1,bare:1,blade:katana('#e8ecf4','#3a2a22'),
  head:(V,y)=>{ V.tube([[30,y(5)],[38,y(2)],[44,y(8)],[42,y(16)]],[3,2.6,2.2,1.4],R('#3a2a22'),{g:'tail'}); V.ell(28,y(3),3,2.6,R('#3a2a22'),{g:'bun'}); V.rect(25,y(5),5,1,'#c8302a');   /* búi tóc đuôi ngựa dài, dây đỏ */
    V.rect(21,y(12),2,1,'#1c1516').rect(27,y(12),2,1,'#1c1516'); V.line(20,y(10),23,y(11),'#3a2a22').line(26,y(11),29,y(10),'#3a2a22'); for(const [x,yy] of [[22,16],[24,17],[26,17],[28,16],[23,18],[27,18]]) V.px(x,y(yy),'#8a6a52'); V.rect(23,y(15),4,1,'#a8604a'); } }); }};
/* ---------- Yone: tóc đen dài buộc, mặt nạ quỷ đỏ trắng che nửa mặt, áo trắng viền đỏ, 2 kiếm (Azakana đỏ + kiếm xanh) ---------- */
B23.yone={w:68,h:70,ax:25,ay:67,anim:ANIM5,glow:'rgba(200,60,90,.3)',draw(V,f){ samurai(V,f,{robe:'#e8e4dc',robe2:'#c8c0b8',pant:'#2a2236',hair:'#1c1a24',sash:'#c8202a',
  blade:(V,atk,y)=>{ katana('#ff4a5a','#1c1516')(V,atk,y); if(atk) V.poly([[14,y(38)],[2,y(56)],[3,y(57)],[16,y(39)]],R('#7ab8ff'),{g:'kat2'}); else V.poly([[11,y(42)],[6,y(63)],[7,y(64)],[12,y(43)]],R('#7ab8ff'),{g:'kat2'}); },   /* kiếm thứ 2 xanh */
  head:(V,y)=>{ V.tube([[19,y(8)],[12,y(16)],[10,y(28)]],[3,2.4,1.6],R('#1c1a24'),{g:'tail'}); V.rect(17,y(6),2,8,'#e8e4dc');   /* tóc dài, lọn trắng */
    V.poly([[25,y(6)],[33,y(8)],[32,y(18)],[25,y(19)]],R('#c8202a'),{n:[-.2,-.2,.96],g:'mask'}); V.poly([[30,y(6)],[34,y(1)],[32,y(8)]],R('#f4f0e8'),{g:'horn'}); V.rect(28,y(11),3,2,'#ffe066'); V.rect(26,y(16),6,1,'#f4f0e8');   /* mặt nạ quỷ nửa mặt */
    V.rect(21,y(12),2,1,'#1c1516'); V.line(20,y(10),23,y(11),'#1c1a24'); V.rect(22,y(16),3,1,'#a8604a'); } }); }};

const C23={}, old=A.muBossSprite, oldAnim=A.bossAnim;
A.bossAnim=sp=>B23[sp]?B23[sp].anim:oldAnim?oldAnim(sp):null;
A.muBossSprite=(sp,fr,hit)=>{ const d=B23[sp]; if(!d) return old(sp,fr,hit); const k=sp+fr+!!hit; if(C23[k]) return C23[k]; const V=vol(d.w,d.h); d.draw(V,fr|0);
  return C23[k]={c:V.done(!!hit,d.glow?{glow:d.glow,gr:2}:undefined),ax:d.ax,ay:d.ay}; };
})();
