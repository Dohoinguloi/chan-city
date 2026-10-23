/* Chan City — boss Đỉnh Bắc (MU), vẽ khối bằng A.vol như art21: khung 0 / 4 đứng thở, 2 / 3 đi chân so le, 1 ra đòn. Ghi đè A.muBossSprite / A.bossAnim cho các loài này.
   6 anh em Siêu Nhân: đồ bó màu, chuỗi kim cương trắng ngang ngực + dọc tay / đùi, găng + ủng trắng viền màu, đai bạc khoá Đồng Năng Lượng vàng, mũ kính đen hình linh thú
   (khủng long bạo chúa / ba sừng / hổ răng kiếm / dực long / voi ma mút / rồng), miếng bạc che miệng, 2 chị em có váy ngắn; vũ khí riêng to rõ; Xanh Lá có giáp vai vàng.
   Yasuo: đuôi tóc tím đen to bay ra sau từ búi buộc vòng vàng, khăn choàng xanh che miệng + vai, ngực trần, giáp vai trái nhiều lớp, đai thừng bện thõng dây, quần ống rộng chàm,
   quấn ống chân, chân đất, katana chuôi quấn nâu đỏ. Yone: mặt nạ quỷ đỏ 2 sừng, tóc đen dài thõng trước ngực, thân trần quấn băng tay + vai, váy hakama xanh đen hoa văn đỏ,
   đai đỏ thắt nút, 2 kiếm (Azakana đen viền đỏ + kiếm mảnh xanh nhạt). Ryuk: đầu to tóc đen dựng tua tủa, mắt tròn vàng con ngươi đỏ, miệng cười rộng tới mang tai môi đỏ răng nhọn,
   cổ áo lông vũ đen, đai đầu lâu + xích, tay chân dài gầy, cánh dơi xương, cầm táo. Rem: thần chết trắng xương cao gầy, bờm gai xương vuốt ra sau, 1 mắt vàng, sườn xương, dải vải rách. */
(function(){
const A=ART, vol=A.vol, WH='#ffffff', K='#1c1516';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const lite=(c,k)=>'#'+mix(hx(c),[255,255,255],k).map(v=>v.toString(16).padStart(2,'0')).join(''), dark=(c,k)=>'#'+mix(hx(c),[0,0,0],k).map(v=>v.toString(16).padStart(2,'0')).join('');
const ANIM5={idle:[0,4],walk:[2,3],atk:1}, pose=f=>({st:f===2?1:f===3?-1:0,bob:f===2||f===3||f===4?1:0,atk:f===1});
const B23={};
// kim cương đặc bán kính r (cao 2r+1)
const dia=(V,cx,cy,r,col)=>{ for(let i=-r;i<=r;i++){ const w=r-Math.abs(i); V.rect(cx-w,cy+i,2*w+1,1,col); } };

/* ---------- 6 anh em Siêu Nhân (khung 60×80, chân chạm đất ở y 77) ---------- */
function ranger(V,f,c,o){ const {st,bob,atk}=pose(f), Su=R(c), Sd=R(dark(c,.18)), Wh=R('#f4f4ef'), Sv=R('#c8ccd8'), Bk=R('#14121a'), y=v=>v+bob, dc=c==='#2a2a34'?'#f4f4ef':'#ffffff';
  for(const [hx0,s] of [[23,-1],[33,1]]){ const ax0=hx0+s*st*3+(atk?s*3:0);
    V.tube([[hx0,y(49)],[(hx0+ax0)/2+s*.5,61],[ax0,67]],[4.8,4.2,3.8],s<0?Su:Sd,{g:'leg'+s,flat:.15});
    V.tube([[ax0,64],[ax0,73]],[4.1,4.3],Wh,{g:'boot'+s}); V.ell(ax0+s*1.4,75.4,5.2,2.4,Wh,{g:'foot'+s,lift:.1}); V.rect(ax0-4,64,9,2,c); dia(V,hx0+s*2.5,y(56),2,dc); }
  if(o.skirt) V.poly([[18,y(46)],[38,y(46)],[42,y(53)],[14,y(53)]],Su,{n:[-.2,-.3,.93],g:'skirt'});
  V.poly([[15,y(26)],[41,y(26)],[37,y(48)],[19,y(48)]],Su,{n:[-.25,-.22,.94],g:'torso'}); V.ell(28,y(31),12,7.5,Su,{g:'torso'});
  if(o.skirt) V.rect(14,y(52),29,1,'#f4f4ef');
  if(o.gold){ V.poly([[14,y(24)],[42,y(24)],[39,y(35)],[28,y(39)],[17,y(35)]],R('#e8b830'),{n:[-.2,-.3,.93],g:'shield'}); for(const [x,yy] of [[20,29],[28,32],[36,29]]) dia(V,x,y(yy),2,'#14121a'); V.rect(14,y(24),28,1,'#fff3b0'); }
  else for(const x of [18,23,28,33,38]) dia(V,x,y(30),2,dc);   /* chuỗi kim cương trắng ngang ngực */
  V.rect(18,y(45),20,3,'#8a8e9a'); V.rect(18,y(45),20,1,'#d8dce4'); V.rect(23,y(43),10,7,'#c8ccd8'); V.rect(24,y(44),8,5,'#e8b830'); V.rect(26,y(45),4,3,'#fff3b0'); V.px(27,y(46),'#c8902a');   /* đai bạc + Đồng Năng Lượng */
  for(const x of [15,41]) V.ell(x,y(28),4.6,4.2,Su,{g:'sh'+x});
  const glove=(x,yy,g)=>{ V.tube([[x,yy-3],[x,yy+1]],3.3,Wh,{g:'g'+g}); V.ell(x,yy+2.5,3.3,3,Wh,{g:'h'+g,lift:.15}); V.rect(x-3,yy-4,7,2,c); };
  if(atk){ V.tube([[41,y(29)],[48,y(33)],[53,y(31)]],[3.8,3.4,3.1],Su,{g:'armR'}); glove(54,y(31),'R'); V.tube([[15,y(29)],[10,y(36)],[13,y(42)]],[3.8,3.4,3.1],Su,{g:'armL'}); glove(13,y(43),'L'); dia(V,11,y(34),1,dc); }
  else { const sw=st*3; V.tube([[15,y(29)],[11,y(37)],[11+st,y(43)-sw]],[3.8,3.4,3.1],Su,{g:'armL'}); glove(11+st,y(44)-sw,'L'); V.tube([[41,y(29)],[45,y(37)],[45-st,y(43)+sw]],[3.8,3.4,3.1],Su,{g:'armR'}); glove(45-st,y(44)+sw,'R');
    dia(V,11,y(35),1,dc); dia(V,45,y(35),1,dc); }
  V.tube([[28,y(21)],[28,y(26)]],3.6,Su,{g:'neck'}); V.ell(28,y(14),9.8,10.6,Su,{g:'helm',lift:.05});
  V.rect(27,y(4),2,5,lite(c,.45)); V.rect(21,y(7),2,1,lite(c,.35)); V.rect(33,y(7),2,1,lite(c,.35));   /* gờ sáng trên mũ */
  V.poly([[21,y(18)],[35,y(18)],[34,y(24)],[22,y(24)]],Sv,{n:[-.2,-.2,.96],g:'mouth'}); V.line(23,y(20),33,y(20),'#7a7e8a'); V.line(24,y(22),32,y(22),'#7a7e8a');
  V.poly(o.visor.map(([x,yy])=>[x,y(yy)]),Bk,{n:[-.1,-.2,.97],g:'visor'}); V.px(21,y(12),'#6a6a7e').px(22,y(12),'#8a8aa0').px(22,y(13),'#5a5a6e');
  if(o.teeth) for(const x of o.teeth) V.px(x,y(16),'#e8ecf4');
  if(o.wep) o.wep(V,atk,y,st); }
// kính mũ theo linh thú (toạ độ trước khi nhún)
const VIS={rex:[[19,11],[37,11],[37,15],[33,17],[28,15],[23,17],[19,15]],
  tri:[[19,12],[22,12],[23,7],[25,12],[31,12],[33,7],[34,12],[37,12],[36,16],[20,16]],
  saber:[[19,11],[37,11],[36,15],[31,15],[30,19],[29,15],[27,15],[26,19],[25,15],[20,15]],
  ptera:[[19,10],[24,12],[28,11],[32,12],[37,10],[36,15],[28,18],[20,15]],
  mast:[[20,11],[36,11],[36,14],[31,15],[30,22],[26,22],[25,15],[20,14]],
  drag:[[19,11],[23,9],[28,12],[33,9],[37,11],[36,15],[32,16],[28,14],[24,16],[20,15]]};
const SW=R('#dfe3ec'), HI=R('#3a2a22'), GD=R('#e8b830');
const blade=(V,pts,w,g)=>{ V.tube(pts,w,SW,{g}); V.line(pts[0][0],pts[0][1],pts[pts.length-1][0],pts[pts.length-1][1],'#ffffff'); };
B23.r_do={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#e3262a',{visor:VIS.rex,teeth:[24,27,29,32],wep:(V,atk,y)=>{   /* Kiếm Thần Long: lưỡi bạc to, chắn vàng */
  if(atk){ blade(V,[[55,y(28)],[60,y(2)]],[2.4,1.2],'blade'); V.rect(51,y(28),9,2,'#e8b830'); V.rect(54,y(30),3,4,'#5a3a2a'); } else { blade(V,[[47,y(48)],[51,y(74)]],[2.4,1],'blade'); V.rect(42,y(47),8,2,'#e8b830'); } }}); }};
B23.r_xanh={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#2a52d0',{visor:VIS.tri,wep:(V,atk,y)=>{ const p=atk?[[24,y(33)],[61,y(29)]]:[[46,y(4)],[46,y(74)]]; V.tube(p,1.3,R('#5a5e6e'),{g:'shaft'});   /* Thương 2 đầu */
  const tip=(x0,y0,dx,dy)=>V.poly([[x0-dy*2,y0+dx*2],[x0+dx*7,y0+dy*7],[x0+dy*2,y0-dx*2]],SW,{g:'tip'+x0+y0}); if(atk){ tip(61,y(29),1,-.1); tip(24,y(33),-1,.1); } else { tip(46,y(4),0,-1); tip(46,y(74),0,1); } V.rect(atk?42:44,atk?y(30):y(38),4,3,'#e8b830'); }}); }};
B23.r_vang={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#f2c42a',{visor:VIS.saber,skirt:1,wep:(V,atk,y,st)=>{ const dg=(x,yy,dx,dy)=>{ V.tube([[x,yy],[x+dx*9,yy+dy*9]],[1.8,.6],SW,{g:'dg'+x}); V.rect(x-2,yy-1,4,2,'#e8b830'); };   /* Song Dao */
  if(atk){ dg(55,y(31),.7,-.7); dg(13,y(44),-.3,1); } else { dg(11+st,y(46),0,1); dg(45-st,y(46),0,1); } }}); }};
B23.r_hong={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#ff6fb4',{visor:VIS.ptera,skirt:1,wep:(V,atk,y)=>{ const x0=atk?57:48, yc=atk?y(31):y(44);   /* Cung Thiên Nga: thân cong trắng hồng, dây sáng */
  V.tube([[x0-4,yc-15],[x0+2,yc-6],[x0+3,yc],[x0+2,yc+6],[x0-4,yc+15]],[1.8,1.5,2,1.5,1.8],R('#f8e8f0'),{g:'bow'}); V.line(x0-4,yc-15,x0-4,yc+15,'#ffffff'); V.rect(x0+1,yc-1,3,3,'#ff6fb4');
  if(atk){ V.line(30,yc,x0+3,yc,'#e8e0c8'); V.poly([[x0+3,yc-2],[x0+5,yc],[x0+3,yc+2]],SW,{g:'arrow'}); } }}); }};
B23.r_den={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#2a2a34',{visor:VIS.mast,wep:(V,atk,y)=>{ const [hx0,hy]=atk?[57,y(10)]:[49,y(66)];   /* Rìu Voi Ma Mút: cán đen, lưỡi bạc to + nòng pháo */
  V.tube([[atk?54:45,atk?y(31):y(44)],[hx0,hy]],1.5,R('#4a4e5a'),{g:'haft'}); V.poly([[hx0-6,hy-4],[hx0+5,hy-7],[hx0+7,hy+5],[hx0-5,hy+4]],SW,{n:[-.3,-.2,.93],g:'axe'}); V.rect(hx0-1,hy-1,3,3,'#e3262a'); V.line(hx0+5,hy-6,hx0+7,hy+4,'#ffffff'); }}); }};
B23.r_xanhla={w:62,h:80,ax:28,ay:77,anim:ANIM5,draw(V,f){ ranger(V,f,'#22a852',{visor:VIS.drag,gold:1,wep:(V,atk,y)=>{ const [x,yy]=atk?[55,y(31)]:[45,y(46)];   /* Dao Rồng: chuôi sáo vàng, lưỡi bạc */
  V.tube([[x,yy],[x+(atk?9:0),yy+(atk?-6:11)]],[1.9,1],SW,{g:'dd'}); V.rect(x-2,yy-2,5,4,'#e8b830'); V.px(x,yy,'#e3262a').px(x+1,yy+1,'#14121a'); }}); }};

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

/* ---------- Ryuk (khung 104×124, chân chạm đất ở y 120) ---------- */
B23.ryuk={w:104,h:124,ax:52,ay:120,anim:ANIM5,glow:'rgba(120,60,200,.28)',draw(V,f){ const {st,bob,atk}=pose(f), Sk=R('#b6c6d2'), Bk=R('#1c1822'), Fe=R('#26222e'), Mb=R('#2e2838'), Bo=R('#4e4658'), y=v=>v+bob, fl=f%2;
  for(const s of [-1,1]){ const sx=52+s*12, jx=52+s*36, jy=y(16)-fl*2;   /* cánh dơi: xương cánh + màng rách */
    V.tube([[sx,y(46)],[52+s*24,y(26)-fl],[jx,jy]],[2.4,2,1.6],Bo,{g:'wb'+s}); const tips=[[52+s*50,y(34)],[52+s*48,y(56)],[52+s*40,y(72)],[52+s*28,y(76)]];
    tips.forEach(([tx,ty],i)=>{ const nx=i<3?tips[i+1]:[sx,y(60)]; V.poly([[jx,jy],[tx,ty],[(tx+nx[0])/2+s*2,(ty+nx[1])/2-3],[nx[0],nx[1]]],Mb,{n:[s*.25,-.15,.95],g:'wm'+s+i}); V.tube([[jx,jy],[tx,ty]],[1.4,.7],Bo,{g:'wf'+s+i}); }); }
  for(const [hx0,s] of [[46,-1],[58,1]]){ const ax0=hx0+s*st*4+(atk?s*3:0); V.tube([[hx0,y(82)],[(hx0+ax0)/2,y(98)-bob],[ax0,112]],[4.2,3.4,3],Bk,{g:'leg'+s}); V.poly([[ax0-3,113],[ax0+3,113],[ax0+s*9,118],[ax0-3,119]],Bk,{g:'boot'+s}); V.line(ax0-3,104,ax0+3,104,'#5a5262'); }
  V.poly([[38,y(48)],[66,y(48)],[63,y(84)],[41,y(84)]],Fe,{n:[-.2,-.25,.94],g:'body'}); for(let i=0;i<5;i++) V.line(42,y(54+i*5),62,y(54+i*5),'#3a3444');   /* áo bó đai ngang */
  V.tube([[40,y(78)],[64,y(78)]],2.6,R('#5a4a3e'),{g:'belt'}); V.ell(52,y(78),3.4,3.2,R('#ece4d0'),{g:'skull',lift:.3}); V.rect(50,y(77),1,2,K).rect(53,y(77),1,2,K).rect(51,y(80),2,1,K);
  for(const [x0,x1] of [[44,40],[60,64]]) for(let i=0;i<5;i++) V.px(Math.round(x0+(x1-x0)*i/5),y(81+i*2),i%2?'#9aa0b0':'#d8dce6');   /* xích bạc thõng */
  const arm=(pts,g)=>V.tube(pts,[3.4,2.8,2.4],Sk,{g});
  if(atk){ arm([[64,y(52)],[78,y(58)],[92,y(54)]],'armR'); V.rect(78,y(56),4,3,'#1c1822'); for(let i=0;i<4;i++) V.line(92,y(54),101,y(48+i*3),'#e8ecf4');   /* vuốt dài */
    arm([[40,y(52)],[30,y(66)],[34,y(76)]],'armL'); V.rect(30,y(68),4,3,'#1c1822'); }
  else { const sw=st*3; arm([[40,y(52)],[31,y(68)],[30+st,y(82)-sw]],'armL'); V.rect(29,y(72)-sw,4,3,'#1c1822'); for(let i=0;i<3;i++) V.line(30+st,y(83)-sw,27+st+i*2,y(89)-sw,'#e8ecf4');
    arm([[64,y(52)],[73,y(66)],[72-st,y(78)+sw]],'armR'); V.rect(71,y(70)+sw,4,3,'#1c1822'); V.ell(72-st,y(83)+sw,4.6,4.4,R('#d8202a'),{g:'apple',lift:.3}); V.px(70-st,y(81)+sw,'#ff9a9a').rect(72-st,y(77)+sw,1,3,'#5a3a22').rect(73-st,y(77)+sw,3,1,'#3ac85a'); }   /* cầm táo */
  for(let i=0;i<11;i++){ const a=(200+i*14)*Math.PI/180, cx=52+Math.cos(a)*15, cy=y(47)+Math.sin(a)*5;   /* cổ áo lông vũ đen */
    V.poly([[cx-3,cy],[cx+3,cy],[cx+Math.cos(a)*9,cy+Math.sin(a)*4+6]],R('#3a3448'),{n:[Math.cos(a)*.3,-.2,.93],g:'ruff'}); V.line(Math.round(cx),Math.round(cy),Math.round(cx+Math.cos(a)*8),Math.round(cy+Math.sin(a)*4+5),'#6a6080'); }
  V.tube([[52,y(40)],[52,y(46)]],3.4,Sk,{g:'neck'}); V.ell(52,y(30),13,13,Sk,{g:'head'});
  for(let i=0;i<13;i++){ const a=(-195+i*17.5)*Math.PI/180, L=13+(i%3)*5; V.tube([[52+Math.cos(a)*9,y(25)+Math.sin(a)*8],[52+Math.cos(a)*(9+L),y(25)+Math.sin(a)*(8+L*.85)+(i%2?2:0)]],[3.6,.7],Bk,{g:'hair'}); }   /* tóc đen dựng tua tủa */
  V.ell(52,y(19),12,6,Bk,{g:'hair'});
  for(const ex of [45,59]){ V.ell(ex,y(28),6,6.4,Bk,{g:'ring'+ex}); V.ell(ex,y(28),4.6,5,R('#ffe14a'),{g:'eye'+ex,lift:.5}); V.rect(ex-1,y(28),2,2,'#c8202a'); V.px(ex-2,y(26),'#ffffff'); V.line(ex-4,y(34),ex+3,y(34),'#7a8a9a'); }   /* mắt tròn vàng, quầng thâm */
  const mw=atk?28:25, mx=52-mw/2, cy0=y(36), sag=x=>Math.round(Math.sin((x-mx)/mw*Math.PI)*(atk?5:4));   /* cười cong rộng tới mang tai, môi đỏ, răng nhọn */
  for(let x=mx;x<=mx+mw;x++){ const d=sag(x); V.rect(x,cy0+Math.round(d*.4),1,Math.max(1,d+2),'#3a0a14'); V.px(x,cy0+Math.round(d*.4)-1,'#d8202a'); V.px(x,cy0+d+2,'#d8202a'); if(x%2===0&&x>mx&&x<mx+mw){ V.px(x,cy0+Math.round(d*.4),'#f4f0e8'); if(d>1) V.px(x+1,cy0+d+1,'#f4f0e8'); } }
  V.px(mx-1,cy0-2,'#d8202a').px(mx+mw+1,cy0-2,'#d8202a'); }};
/* ---------- Rem (khung 96×122, chân chạm đất ở y 118) ---------- */
B23.rem={w:96,h:122,ax:48,ay:118,anim:ANIM5,glow:'rgba(220,215,255,.3)',draw(V,f){ const {st,bob,atk}=pose(f), Bn=R('#e6e1d8'), Bd=R('#c8c0cc'), Lv='#9a8eb4', y=v=>v+bob, fl=f%2;
  for(const [pts,r] of [[[[48,y(16)],[36,y(8)],[22,y(8)],[10,y(14)]],[4.6,4,3,1]],[[[47,y(20)],[34,y(18)],[20,y(24)],[12,y(36)+fl]],[4.4,3.8,2.6,.8]],[[[47,y(24)],[36,y(28)],[28,y(40)],[24,y(54)-fl]],[4,3.4,2.2,.7]],[[[49,y(14)],[42,y(5)],[30,y(2)]],[3.2,2.4,.7]]])
    V.tube(pts,r,Bd,{g:'mane'});   /* bờm gai xương dày vuốt ra sau */
  for(const [x0,y0,x1,y1] of [[40,10,20,10],[38,20,20,26],[38,28,28,44]]) V.line(x0,y(y0),x1,y(y1),Lv);
  for(const [hx0,s] of [[43,-1],[53,1]]){ const ax0=hx0+s*st*4+(atk?s*3:0); V.tube([[hx0,y(78)],[(hx0+ax0)/2+s,y(96)-bob],[ax0,112]],[4,3.2,2.6],Bn,{g:'leg'+s}); V.poly([[ax0-2,112],[ax0+2,112],[ax0+s*7,117],[ax0-2,118]],Bd,{g:'foot'+s}); V.line(ax0-3,y(96)-bob,ax0+3,y(96)-bob,Lv); }
  for(let i=0;i<7;i++){ const x=38+i*3.3, L=12+(i*7)%9; V.poly([[x,y(74)],[x+3,y(74)],[x+2+(i%2?1:-1)*fl,y(74)+L],[x,y(74)+L-2]],i%2?Bd:Bn,{g:'strip'+i}); }   /* dải vải rách thõng */
  V.ell(48,y(58),10.5,17,Bn,{g:'body'}); for(let i=0;i<5;i++){ const yy=y(48+i*4); V.line(40+i*.5,yy,46,yy+1,Lv); V.line(50,yy+1,56-i*.5,yy,Lv); } V.line(48,y(46),48,y(66),Lv);   /* sườn xương */
  const arm=(pts,g)=>V.tube(pts,[3.2,2.6,2.1],Bn,{g});
  if(atk){ arm([[57,y(46)],[70,y(52)],[84,y(48)]],'armR'); for(let i=0;i<4;i++) V.line(84,y(48),94,y(43+i*3),'#f8f6f0'); arm([[39,y(46)],[30,y(62)],[33,y(72)]],'armL'); }
  else { const sw=st*3; arm([[39,y(46)],[31,y(62)],[30+st,y(78)-sw]],'armL'); for(let i=0;i<4;i++) V.line(30+st,y(79)-sw,27+st+i*2,y(88)-sw,'#f8f6f0'); arm([[57,y(46)],[65,y(62)],[66-st,y(78)+sw]],'armR'); for(let i=0;i<4;i++) V.line(66-st,y(79)+sw,63-st+i*2,y(88)+sw,'#f8f6f0'); }   /* ngón xương dài */
  for(const x of [39,57]) V.ell(x,y(45),4.4,3.6,Bd,{g:'sh'+x});
  V.tube([[48,y(36)],[48,y(42)]],3,Bn,{g:'neck'}); V.ell(48,y(26),9.4,12,Bn,{g:'head'}); for(const [x,yy,dx] of [[42,15,-4],[46,13,-1],[51,13,2],[55,16,5]]) V.tube([[x,y(yy)],[x+dx,y(yy)-9]],[2.2,.6],Bd,{g:'crown'});
  V.poly([[39,y(22)],[47,y(20)],[46,y(31)],[40,y(30)]],Bd,{g:'cover'}); V.line(41,y(23),45,y(29),Lv);   /* nửa mặt che bằng mảnh xương */
  V.ell(52,y(26),3.8,3,R('#ffe066'),{g:'eye',lift:.5}); V.rect(52,y(25),1,3,'#1c1516'); V.line(48,y(23),56,y(22),'#7a6e8a');   /* 1 mắt vàng con ngươi dọc */
  V.rect(45,y(33),7,2,'#3a2a3a'); for(let x=45;x<52;x+=2) V.px(x,y(32),'#f4f0e8').px(x,y(35),'#f4f0e8'); }};

/* ---------- Yasuo (khung 88×94, chân chạm đất ở y 90) ---------- */
B23.yasuo={w:88,h:94,ax:40,ay:90,anim:ANIM5,glow:'rgba(160,210,255,.3)',draw(V,f){ const {st,bob,atk}=pose(f), Sk=R('#d9a272'), Hr=R('#3a2a4e'), Hl='#5e4a78', Bu=R('#4c6cae'), Bd=R('#3a548e'), Pn=R('#33427a'), Pd=R('#28356a'), St=R('#6c7c9c'), Rp=R('#8a5a32'), y=v=>v+bob, fl=f%2;
  V.tube([[46,y(6)],[37,y(6)-fl],[24,y(7)],[13,y(13)+fl],[6,y(24)+fl]],[3,5.4,6.4,5,1.6],Hr,{g:'tail'});   /* đuôi tóc to bay ra sau */
  V.tube([[33,y(7)],[20,y(4)+fl],[8,y(8)]],[2.8,2.6,1],Hr,{g:'tail'}); V.tube([[28,y(9)],[17,y(15)],[11,y(28)-fl]],[3,2.4,.8],Hr,{g:'tail'});
  for(const [x0,y0,x1,y1] of [[40,5,22,4],[30,9,12,13],[26,12,14,23]]) V.line(x0,y(y0),x1,y(y1)+fl,Hl);
  for(const [hx0,s] of [[35,-1],[47,1]]){ const ax0=hx0+s*st*4+(atk?s*4:0), kx=(hx0+ax0)/2+s*2;   /* quần ống rộng + quấn ống chân + chân đất */
    V.tube([[hx0,y(60)],[kx,y(72)-bob],[ax0,80]],[7.6,7.4,5],s<0?Pn:Pd,{g:'leg'+s,flat:.2}); V.tube([[ax0,79],[ax0,86]],[3.6,3.2],R('#26263a'),{g:'wrap'+s}); for(const yy of [80,82,84]) V.line(ax0-3,yy,ax0+3,yy+1,'#4a4a62');
    V.ell(ax0+s*2,88.2,5.2,2.2,Sk,{g:'foot'+s,lift:.1}); }
  V.ell(41,y(47),11,12.5,Sk,{g:'chest'}); V.line(41,y(44),41,y(56),'#a8704a'); for(const yy of [48,52]) { V.line(36,y(yy),40,y(yy),'#b87e54'); V.line(42,y(yy),46,y(yy),'#b87e54'); } V.line(34,y(41),40,y(43),'#b87e54'); V.line(42,y(43),48,y(41),'#b87e54');   /* ngực trần, cơ bụng */
  V.poly([[29,y(37)],[35,y(36)],[36,y(58)],[30,y(60)]],Bd,{n:[-.3,-.2,.93],g:'shirt'});   /* vạt áo xanh rủ bên vai phải */
  V.tube([[28,y(58)],[55,y(58)]],3.6,Rp,{g:'rope'}); for(let x=29;x<55;x+=3) V.line(x,y(56),x+2,y(60),'#5a3a1e'); V.ell(32,y(59),3.4,3.2,Rp,{g:'knot'});   /* đai thừng bện */
  V.tube([[31,y(61)],[28,y(70)],[29,y(78)+fl]],[2,1.8,1.4],Rp,{g:'ropeA'}); V.tube([[34,y(61)],[33,y(70)],[35,y(76)]],[1.8,1.6,1.2],Rp,{g:'ropeB'});
  const bare=(pts)=>V.tube(pts,[4.2,3.6,3.2],Sk,{g:'armL'}), hand=(x,yy,g)=>V.ell(x,yy,3,3,Sk,{g,lift:.15});
  if(atk){ bare([[28,y(38)],[23,y(48)],[27,y(55)]]); V.rect(24,y(51),5,3,'#26263a'); hand(27,y(56),'hL');
    V.tube([[54,y(38)],[62,y(42)],[69,y(39)]],[4.2,3.8,3.4],St,{g:'armR'}); hand(71,y(39),'hR'); V.rect(66,y(37),4,4,'#5a2a22');
    V.poly([[71,y(37)],[86,y(10)],[87,y(12)],[73,y(40)]],R('#e6eaf2'),{n:[-.3,-.2,.93],g:'kat'}); V.line(72,y(37),86,y(11),'#ffffff'); V.rect(69,y(37),5,2,'#c8a040'); }   /* chém tới, lưỡi vút lên */
  else { const sw=st*3; bare([[28,y(38)],[24,y(49)],[25+st,y(57)-sw]]); V.rect(22+st,y(52)-sw,5,3,'#26263a'); hand(25+st,y(58)-sw,'hL');
    V.tube([[54,y(38)],[58,y(49)],[57-st,y(56)+sw]],[4.2,3.8,3.4],St,{g:'armR'}); hand(57-st,y(58)+sw,'hR');
    V.tube([[57-st,y(56)+sw],[60-st,y(64)+sw]],1.6,R('#5a2a22'),{g:'hilt'}); for(let i=0;i<3;i++) V.px(58-st,y(58+i*2)+sw,'#c8a040'); V.rect(58-st,y(64)+sw,5,2,'#c8a040');
    V.poly([[60-st,y(65)+sw],[63-st,y(65)+sw],[77-st,88],[75-st,88]],R('#e6eaf2'),{g:'kat'}); V.line(61-st,y(66)+sw,76-st,87,'#ffffff'); }   /* katana chĩa xuống */
  for(const [pts,i] of [[[[46,y(30)],[60,y(31)],[64,y(40)],[52,y(43)]],0],[[[52,y(38)],[65,y(40)],[66,y(47)],[55,y(47)]],1],[[[55,y(45)],[66,y(47)],[64,y(52)],[56,y(51)]],2]]){   /* giáp vai trái nhiều lớp */
    V.poly(pts,St,{n:[.2,-.35,.91],g:'pad'+i}); V.line(pts[0][0],pts[0][1],pts[1][0],pts[1][1],'#e4ecfa'); V.line(pts[3][0],pts[3][1],pts[2][0],pts[2][1],'#3a4660'); V.px(pts[0][0]+2,pts[0][1]+1,'#e8b830').px(pts[1][0]-2,pts[1][1]+2,'#e8b830'); }
  V.ell(40,y(34),10,4.2,Bu,{g:'scarf'}); V.tube([[30,y(35)],[27,y(43)],[28,y(50)+fl]],[4,3.2,1.4],Bu,{g:'scarf'});   /* khăn choàng quấn vai */
  V.tube([[42,y(27)],[42,y(32)]],3.4,Sk,{g:'neck'}); V.ell(42,y(19),9,10,Sk,{g:'head'}); V.ell(33.2,y(20),1.6,2.4,Sk,{g:'ear'}); V.ell(50.8,y(20),1.6,2.4,Sk,{g:'ear2'});
  V.ell(42,y(11),9.4,4.4,Hr,{g:'hair'}); V.ell(34,y(15),2,4.4,Hr,{g:'hair'}); V.ell(50,y(15),2,4,Hr,{g:'hair'}); V.ell(46,y(6),3.6,3.2,Hr,{g:'bun'}); V.rect(43,y(7),6,2,'#e8b830'); V.px(45,y(7),'#fff3b0');   /* tóc vuốt ngược, búi buộc vòng vàng */
  V.tube([[39,y(11)],[36,y(17)],[35,y(23)]],[1.5,1.1,.5],Hr,{g:'bang'}); V.tube([[45,y(11)],[47,y(15)],[47,y(19)]],[1.2,.9,.4],Hr,{g:'bang2'});   /* lọn tóc mái rủ trước mặt */
  V.line(37,y(15),41,y(17),'#2a1c30'); V.line(43,y(17),47,y(15),'#2a1c30'); V.rect(37,y(18),4,2,'#f4f0e8'); V.rect(43,y(18),4,2,'#f4f0e8'); V.rect(39,y(18),2,2,'#1c1516'); V.rect(43,y(18),2,2,'#1c1516');   /* mày xếch, mắt sắc */
  V.px(42,y(21),'#b8805a'); V.poly([[33,y(23)],[51,y(23)],[49,y(32)],[35,y(32)]],Bu,{n:[-.2,-.2,.96],g:'scarf'}); V.line(35,y(24),49,y(24),'#7a9ad8'); V.line(36,y(27),48,y(27),'#3a548e'); }};   /* khăn che từ mũi xuống */   /* khăn che miệng */
/* ---------- Yone (khung 88×98, chân chạm đất ở y 94) ---------- */
function yoneBody(V,f){ const {st,bob,atk}=pose(f), Sk=R('#eadfd2'), Bw=R('#c8ccd2'), Hb=R('#17151d'), Hk=R('#1f3442'), Hd=R('#172834'), Rd=R('#b01e36'), y=v=>v+bob, fl=f%2;
  V.tube([[42,y(14)],[39,y(32)],[37,y(52)]],[10,9,5],Hb,{g:'hairB'});   /* tóc đen dài sau lưng */
  const hem=[24-st*2,60+st*2]; V.poly([[30,y(57)],[54,y(57)],[hem[1],90],[hem[0],90]],Hk,{n:[-.22,-.2,.95],g:'skirt'}); V.poly([[42,y(57)],[54,y(57)],[hem[1],90],[43,90]],Hd,{n:[.35,.05,.94],g:'skirt2'});   /* váy hakama xanh đen */
  for(const [pts] of [[[[33,y(64)],[30,y(72)],[34,y(80)],[29,y(88)]]],[[[50,y(62)],[54,y(72)],[50,y(82)],[55,y(88)]]],[[[40,y(70)],[37,y(78)],[41,y(86)]]]]) for(let i=0;i<pts.length-1;i++) V.line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],'#c8203a');   /* hoa văn đỏ */
  for(const x of [hem[0]+8,hem[1]-8]) V.ell(x,92,4.4,2,R('#1c1a22'),{g:'boot'+x});
  V.tube([[30,y(57)],[54,y(57)]],3.4,Rd,{g:'sash'}); V.ell(39,y(58),3.4,3,Rd,{g:'knot'}); V.tube([[38,y(60)],[36,y(70)],[37,y(77)+fl]],[2,1.8,1.2],Rd,{g:'tailA'}); V.tube([[41,y(60)],[43,y(69)],[42,y(74)]],[1.8,1.6,1],Rd,{g:'tailB'});
  V.ell(42,y(44),11.5,13.5,Sk,{g:'chest'}); V.line(42,y(41),42,y(55),'#c4b4a4'); for(const yy of [46,50]){ V.line(37,y(yy),41,y(yy),'#cdbcac'); V.line(43,y(yy),47,y(yy),'#cdbcac'); }
  const wrap=(pts,g)=>{ V.tube(pts,[4,3.4,3],Bw,{g}); for(let i=0;i<pts.length-1;i++) for(let k=1;k<4;k++){ const t=k/4, x=pts[i][0]+(pts[i+1][0]-pts[i][0])*t, yy=pts[i][1]+(pts[i+1][1]-pts[i][1])*t; V.line(Math.round(x-3),Math.round(yy),Math.round(x+3),Math.round(yy+1),'#8a909a'); } };   /* tay quấn băng */
  const hand=(x,yy,g)=>V.ell(x,yy,2.8,2.8,Sk,{g,lift:.15}), aza=(x0,y0,x1,y1)=>{ V.tube([[x0,y0],[x1,y1]],[1.8,1],R('#1c1418'),{g:'aza'}); V.line(x0+1,y0,x1+1,y1,'#ff3a4a'); V.rect(x0-2,y0-1,4,2,'#b01e36'); },
    blue=(x0,y0,x1,y1)=>{ V.tube([[x0,y0],[x1,y1]],[1.3,.6],R('#a8e0d8'),{g:'blue'}); V.line(x0,y0,x1,y1,'#e8fff8'); V.rect(x0-2,y0-1,4,2,'#2a2a3a'); };
  if(atk){ wrap([[30,y(37)],[24,y(48)],[22,y(58)]],'armL'); hand(22,y(60),'hL'); aza(21,y(61),4,90);
    wrap([[54,y(37)],[63,y(41)],[71,y(38)]],'armR'); hand(73,y(38),'hR'); blue(74,y(37),87,y(8)); }
  else { const sw=st*2; wrap([[30,y(37)],[25,y(48)],[24+st,y(58)-sw]],'armL'); hand(24+st,y(60)-sw,'hL'); aza(23+st,y(61)-sw,5,92);
    wrap([[54,y(37)],[59,y(48)],[60-st,y(58)+sw]],'armR'); hand(60-st,y(60)+sw,'hR'); blue(61-st,y(61)+sw,80,92); }
  for(const x of [30,54]){ V.ell(x,y(36),5,4.2,Bw,{g:'sh'+x}); V.line(x-4,y(35),x+4,y(37),'#8a909a'); }   /* băng quấn vai */
  V.tube([[42,y(28)],[42,y(33)]],3.2,Sk,{g:'neck'}); V.ell(42,y(21),8.2,9.6,Sk,{g:'head',lift:.35}); V.ell(42,y(13),9.4,5.4,Hb,{g:'hair'});
  V.tube([[36,y(15)],[34,y(34)],[33,y(52)+fl]],[1.8,1.5,1],Hb,{g:'strL'}); V.tube([[48,y(15)],[50,y(34)],[51,y(50)+fl]],[1.8,1.5,1],Hb,{g:'strR'});   /* lọn tóc dài thõng trước ngực */
  V.poly([[33,y(12)],[51,y(12)],[50,y(21)],[46,y(25)],[42,y(23)],[38,y(25)],[34,y(21)]],R('#c8203a'),{n:[-.2,-.25,.95],g:'mask'});   /* mặt nạ quỷ đỏ */
  V.poly([[36,y(13)],[31,y(1)],[39,y(11)]],R('#c8203a'),{g:'hornL'}); V.poly([[48,y(13)],[53,y(1)],[45,y(11)]],R('#c8203a'),{g:'hornR'}); V.poly([[41,y(12)],[42,y(5)],[43,y(12)]],R('#e04a5a'),{g:'crest'});
  V.rect(36,y(18),4,1,'#ffe8a0'); V.rect(44,y(18),4,1,'#ffe8a0'); V.line(34,y(16),40,y(17),'#6a0a1a'); V.line(44,y(17),50,y(16),'#6a0a1a'); V.rect(40,y(27),4,1,'#9a6a5a'); }
B23.yone={w:88,h:98,ax:42,ay:94,anim:ANIM5,glow:'rgba(200,40,70,.3)',draw(V,f){ yoneBody(V,f); }};

const C23={}, old=A.muBossSprite, oldAnim=A.bossAnim;
A.bossAnim=sp=>B23[sp]?B23[sp].anim:oldAnim?oldAnim(sp):null;
A.muBossSprite=(sp,fr,hit)=>{ const d=B23[sp]; if(!d) return old(sp,fr,hit); const k=sp+fr+!!hit; if(C23[k]) return C23[k]; const V=vol(d.w,d.h); d.draw(V,fr|0);
  return C23[k]={c:V.done(!!hit,d.glow?{glow:d.glow,gr:2}:undefined),ax:d.ax,ay:d.ay}; };
})();
