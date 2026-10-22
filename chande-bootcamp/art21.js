/* Chan City — Đầm Rồng (MU): boss Songoku (Rồng Dải Xanh gọi ra) + dạng Siêu Saiyan, Luffy Gear 5 vẽ lại 5 khung (đứng thở 0 / 4, đi 2 / 3 chân so le tay đánh ngược chân,
   1 ra đòn: Luffy duỗi tay cao su đấm thẳng, Songoku chụm 2 tay bắn Kamehameha). Vẽ khối có đổ bóng bằng A.vol như art19. Ghi đè A.muBossSprite / A.bossAnim cho các loài này. */
(function(){
const A=ART, vol=A.vol, K='#1c1516', WH='#ffffff';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const SKIN=R('#f2c49a'), ANIM5={idle:[0,4],walk:[2,3],atk:1}, pose=f=>({st:f===2?1:f===3?-1:0,bob:f===2||f===3||f===4?1:0,atk:f===1});
const B21={};

// Luffy Gear 5: tóc trắng bốc như lửa (lay động theo khung), khăn mây quấn vai, áo khoác trắng mở ngực sẹo chữ X, đai tím, quần trắng ống rộng, dép, mũ rơm đeo sau lưng,
// mắt vòng đỏ cười toe. Đi: nhún + vung tay; ra đòn: Gomu Gomu Pistol, tay phải duỗi dài tới trước, nắm đấm to, tay trái kéo về sau lấy đà
B21.luffy={w:100,h:116,ax:50,ay:113,glow:'rgba(255,255,255,.35)',anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Wt=R('#f8f6f2'), Pu=R('#8a4ad8'), Br=R('#7a4a2a'), St=R('#e8c860'), lean=atk?2:0, fl=f%2;
  for(let i=0;i<9;i++){ const a=(-172+i*20.5)*Math.PI/180; V.ell(50+Math.cos(a)*30,57+Math.sin(a)*12-bob,9,7,Wt,{g:'cloud',lift:.1}); }   /* khăn mây sau vai */
  V.ell(70,51,13,4.5,St,{g:'brim',flat:.2}); V.ell(70,47,8,5,St,{g:'crown'}); V.rect(62,48,16,2,'#c82a2a');   /* mũ rơm sau lưng */
  const legs=atk?[[43,36,-1],[57,64,1]]:[[43,40-st*5,-st],[57,60+st*5,st]];
  for(const [hx0,ax0,s] of legs){ const kx=(hx0+ax0)/2; V.tube([[hx0,84+bob],[kx,98]],[8,7],Wt,{g:'pant'+hx0,flat:.25}); V.tube([[kx,99],[ax0,108]],[3.6,3.2],SKIN,{g:'shin'+hx0}); V.ell(ax0-s,110.5,6.5,2.6,Br,{g:'sandal'+hx0,lift:.15}); }
  V.ell(50+lean,67+bob,12,14,SKIN,{g:'chest'}); V.line(45+lean,61+bob,55+lean,70+bob,'#a8663e').line(55+lean,61+bob,45+lean,70+bob,'#a8663e');   /* sẹo chữ X */
  V.tube([[38+lean,54+bob],[37,70+bob],[38,84]],[6,7,7],Wt,{g:'coatL',flat:.2}); V.tube([[62+lean,54+bob],[63,70+bob],[62,84]],[6,7,7],Wt,{g:'coatR',flat:.2});
  V.tube([[37,84],[63,84]],4.5,Pu,{g:'sash'}); V.tube([[60,86],[64,97]],[3,2],Pu,{g:'knot'});
  const sh=57+bob;
  if(atk){ V.tube([[61+lean,sh],[76,54],[90,52]],[5,3.6,3.4],SKIN,{g:'armR'}); V.ell(94,51,7.5,7,SKIN,{g:'fist',lift:.3}); V.line(92,47,96,47,'#c8945a').line(92,51,96,51,'#c8945a');
    for(const [y,l] of [[45,10],[51,14],[57,9]]) V.line(78-l,y,74,y,'#e8e4dc');   /* vệt duỗi tay */
    V.tube([[39+lean,sh],[31,61],[27,55]],[5,4.6,4.2],SKIN,{g:'armL'}); V.ell(26,53,6,6,SKIN,{g:'fistL',lift:.2}); }
  else { const sw=st*4, dr=f===4?1:0; V.tube([[39,sh],[33,68+dr],[31+st*2,78-sw+dr]],[5.4,5,4.4],SKIN,{g:'armL'}); V.ell(31+st*2,80-sw+dr,6,6,SKIN,{g:'fistL',lift:.2});
    V.tube([[61,sh],[67,68+dr],[69-st*2,78+sw+dr]],[5.4,5,4.4],SKIN,{g:'armR'}); V.ell(69-st*2,80+sw+dr,6,6,SKIN,{g:'fistR',lift:.2}); }
  for(const [x,y] of [[37,55],[63,55]]) V.ell(x+lean,y-bob,8,6,Wt,{g:'cloud2',lift:.15});
  const hx1=50+lean; V.tube([[hx1,50+bob],[hx1,56+bob]],5,SKIN,{g:'neck'}); V.ell(hx1,41+bob,13.5,14,SKIN,{g:'head'});
  const hy=24+bob, w=fl?1:-1; V.ell(hx1,hy,18,10,Wt,{g:'hair',lift:.1});
  for(const [x,y,rx,ry] of [[-10,2,8,8],[10,2,8,8],[-6,-9,8,9],[6,-9,8,9],[0,-13,9,10],[-16,-6,6,7],[16,-6,6,7],[-8,-19,5,6],[9,-18,5,6]]) V.ell(hx1+x+(y<-10?w:0),hy+y,rx,ry,Wt,{g:'hair',lift:.1});
  for(const [x0,y0,x1,y1] of [[-16,-8,-22,-16+w],[16,-8,23,-15-w],[-6,-19,-9+w,-24],[7,-18,10-w,-24],[0,-21,1+w,-25]]) V.tube([[hx1+x0,hy+y0],[hx1+x1,hy+y1]],[4.5,1.6],Wt,{g:'hair',lift:.1});   /* ngọn tóc lửa lay động */
  const fy=40+bob; for(const ex of [hx1-9,hx1+3]){ V.rect(ex+1,fy-2,4,5,WH).rect(ex,fy-1,6,3,WH).rect(ex+1,fy-1,4,3,'#ea2a2a').rect(ex+2,fy,2,1,WH); V.line(ex,fy-4,ex+5,fy-4,'#f4f2ec'); }   /* mắt tròng đỏ, lông mày trắng */
  V.line(hx1-10,fy+4,hx1-8,fy+6,'#8a4a2a').line(hx1-9,fy+3,hx1-9,fy+4,'#8a4a2a');   /* sẹo dưới mắt trái */
  const mw=atk?15:13, mx=hx1-Math.floor(mw/2); V.rect(mx,fy+7,mw,atk?6:5,'#5a1418').rect(mx+1,fy+7,mw-2,1,WH).rect(mx+3,fy+(atk?11:10),mw-6,2,'#e8506a'); V.px(mx-1,fy+6,'#8a4a2a').px(mx+mw,fy+6,'#8a4a2a'); }};   /* cười toe, khoé miệng nhếch */

// Songoku: tóc đen dựng nhọn, võ phục cam áo trong xanh, chữ trên ngực, đai xanh, cổ tay xanh, ủng xanh viền đỏ. Siêu Saiyan (ssj): tóc vàng dựng cao hơn, mắt xanh ngọc,
// hào quang vàng. Ra đòn: chụm 2 tay về phía trước, quả cầu Kamehameha xanh sáng giữa 2 bàn tay
function goku(V,f,ssj){ const {st,bob,atk}=pose(f), O=7, Or=R('#f08a24'), Od=R('#c8601a'), Bu=R('#2a4ab8'), Hr=ssj?R('#ffd23a'):[[74,68,86,255],[36,32,44,255],[22,18,30,255],[12,10,18,255]], y=v=>v+O+bob;
  for(const [hx0,s] of [[19,-1],[29,1]]){ const ax0=hx0+s*st*3+(atk?s*2:0); V.tube([[hx0,y(35)],[(hx0+ax0)/2+s,y(44)-bob],[ax0,y(51)-bob]],[4.2,3.8,3.4],s<0?Or:Od,{g:'leg'+hx0,flat:.2});
    V.tube([[ax0,y(50)-bob],[ax0,y(56)-bob]],3.5,Bu,{g:'boot'+hx0}); V.ell(ax0+s,y(57.5)-bob,4.2,2,Bu,{g:'foot'+hx0,lift:.15}); V.line(ax0-3,y(51)-bob,ax0+3,y(51)-bob,'#c8302a'); }
  V.poly([[13,y(18)],[35,y(18)],[33,y(36)],[15,y(36)]],Or,{n:[-.3,-.2,.93],g:'gi'}); V.poly([[25,y(18)],[35,y(18)],[33,y(36)],[26,y(36)]],Od,{g:'gi2'});
  V.poly([[20,y(18)],[28,y(18)],[24,y(26)]],Bu,{n:[0,0,1],g:'under'}); V.ell(29,y(24),2.6,2.6,R('#f4f2ec'),{g:'kanji',lift:.3}); V.rect(28,y(23),2,1,K).rect(29,y(23),1,3,K).rect(28,y(25),2,1,K);
  V.tube([[14,y(35)],[34,y(35)]],2.6,Bu,{g:'belt'}); V.tube([[31,y(36)],[33,y(41)]],[1.6,1.2],Bu,{g:'knot'});
  if(atk){ V.tube([[35,y(20)],[40,y(24)],[45,y(26)]],[3,2.8,2.6],SKIN,{g:'armR'}); V.tube([[13,y(20)],[28,y(25)],[43,y(28)]],[3,2.8,2.6],SKIN,{g:'armL'}); V.rect(41,y(24),3,4,'#2a4ab8').rect(40,y(27),3,3,'#2a4ab8');
    V.ell(47,y(27),4.6,4.6,[[240,252,255,255],[150,230,255,255],[60,170,255,255],[30,90,220,255]],{g:'kame',lift:.5}); V.px(46,y(26),WH); }
  else { const sw=st*3; V.tube([[13,y(20)],[10,y(27)],[9,y(33)-sw]],[3,2.8,2.6],SKIN,{g:'armL'}); V.rect(7,y(30)-sw,4,2,'#2a4ab8'); V.ell(9,y(34)-sw,2.8,2.6,SKIN,{g:'hL'});
    V.tube([[35,y(20)],[38,y(27)],[39,y(33)+sw]],[3,2.8,2.6],SKIN,{g:'armR'}); V.rect(37,y(30)+sw,4,2,'#2a4ab8'); V.ell(39,y(34)+sw,2.8,2.6,SKIN,{g:'hR'}); }
  for(const x of [13,35]) V.ell(x,y(19),3.6,3,Or,{g:'sh'+x});   /* vai áo */
  V.tube([[24,y(13)],[24,y(18)]],3,SKIN,{g:'neck'}); V.ell(24,y(9),7.6,8.2,SKIN,{g:'head'}); V.ell(16.5,y(10),1.6,2.2,SKIN,{g:'earL'}); V.ell(31.5,y(10),1.6,2.2,SKIN,{g:'earR'});
  V.ell(24,y(3),8.4,4.6,Hr,{g:'hair'});
  const sp=ssj?[[[16,4],[8,-6],[18,0]],[[18,1],[15,-9],[22,-1]],[[21,-1],[24,-10],[27,-1]],[[26,-1],[33,-8],[30,1]],[[30,2],[39,-3],[32,6]],[[17,5],[10,2],[17,8]]]
    :[[[16,4],[8,-2],[17,0]],[[18,1],[13,-6],[21,-1]],[[21,-1],[24,-8],[27,-1]],[[27,-1],[34,-5],[30,1]],[[31,2],[39,1],[32,6]],[[17,5],[9,6],[17,9]]];
  for(const pts of sp) V.poly(pts.map(([px,py])=>[px,y(py)]),Hr,{n:[-.2,-.4,.89],g:'hair'});
  for(const pts of [[[19,4],[20,9],[22,4]],[[24,4],[26,8],[27,4]]]) V.poly(pts.map(([px,py])=>[px,y(py)]),Hr,{g:'bang'});   /* tóc mái */
  const ey=ssj?'#2ab8a8':K; V.rect(19,y(9),3,2,WH).rect(26,y(9),3,2,WH).rect(20,y(9),2,2,ey).rect(27,y(9),2,2,ey); V.line(18,y(7),22,y(8),ssj?'#c8901a':K).line(26,y(8),30,y(7),ssj?'#c8901a':K);
  V.line(22,y(14),26,y(14),atk?'#7a2a2a':'#a85a4a'); if(atk) V.rect(23,y(14),2,1,'#5a1418'); }
B21.songoku={w:52,h:74,ax:24,ay:72,anim:ANIM5,draw(V,f){ goku(V,f,false); }};
B21.songoku_ssj={w:52,h:74,ax:24,ay:72,glow:'rgba(255,220,80,.45)',anim:ANIM5,draw(V,f){ goku(V,f,true); }};

// Phạm Hoàng Hà (lính Dươngg Vũ gọi ra): tóc đen buộc chỏm dựng nhọn, áo giáp lưới xanh lá có túi, áo trong đen, quần xám tối quấn ống, dép xanh, mặt lười biếng.
// khung: 0 đứng / 1 bước / 2 bắn (2 tay chụm đẩy tới, quả cầu đỏ hồng)
B21.hoangha={w:24,h:32,ax:11,ay:31,draw(V,f){ const Gn=R('#4a9a3a'), Gd=R('#2e6a26'), Pt=R('#3a3a44'), Sd=R('#2a4ab8'), Hr=[[70,64,80,255],[30,26,36,255],[18,14,24,255],[10,8,14,255]], st=f===1?1:0, sh=f===2;
  for(const [x,s] of [[8,-1],[13,1]]){ const ax=x+s*st*1.5; V.tube([[x,20],[ax,27]],[2,1.8],Pt,{g:'leg'+x}); V.rect(ax-1,25,3,1,'#d8d4c8'); V.ell(ax+s*.5,29.5,2.4,1.2,Sd,{g:'sd'+x,lift:.15}); }
  V.poly([[5,12],[16,12],[16,21],[5,21]],R('#24202a'),{g:'in'}); V.poly([[5,12],[10,12],[10,21],[5,21]],Gn,{n:[-.3,-.2,.93],g:'vestL'}); V.poly([[11,12],[16,12],[16,21],[11,21]],Gd,{g:'vestR'});
  V.rect(6,16,3,2,'#2e6a26').rect(12,16,3,2,'#24501e'); V.ell(10.5,12,4.6,1.6,Gn,{g:'collar',lift:.2});
  if(sh){ V.tube([[16,13],[19,15],[21,16]],[1.5,1.4,1.3],SKIN,{g:'aR'}); V.tube([[5,13],[13,16],[20,17]],[1.5,1.4,1.3],SKIN,{g:'aL'}); V.ell(22,16,2.6,2.6,[[255,230,240,255],[255,120,170,255],[230,40,110,255],[150,20,70,255]],{g:'orb',lift:.5}); }
  else { V.tube([[16,13],[17.5,17],[17,20+st]],[1.5,1.4,1.3],SKIN,{g:'aR'}); V.tube([[5,13],[3.5,17],[4,20-st]],[1.5,1.4,1.3],SKIN,{g:'aL'}); }
  V.ell(10.5,8,4.6,4.8,SKIN,{g:'head'}); V.ell(10.5,4.6,4.8,2.6,Hr,{g:'hair'}); V.poly([[8,4],[10,-2+3],[12,4]],Hr,{g:'knot'});
  for(const pts of [[[9,3],[7,0],[10,2]],[[10,2],[10.5,0],[11.5,2]],[[11,3],[14,0],[12,4]]]) V.poly(pts,Hr,{g:'spk'});   /* chỏm tóc dựng nhọn */
  V.rect(6,5,1,4,'#1c1820').rect(14,5,1,4,'#1c1820'); V.line(8,8,10,8,K).line(12,8,14,8,K); V.line(9.5,11,11.5,11,'#a85a4a'); }};   /* mắt lim dim chán đời */

// Cửu Vĩ Hồ Ly (Naruto hoá): cáo khổng lồ lông cam, 9 đuôi xù xoè sau lưng uốn lượn theo khung, tai dài trong nâu đỏ, vệt đen quanh mắt kéo lên trán,
// mắt đỏ đồng tử dọc, mõm dài nhe nanh, tay trước có vuốt đen, hào quang chakra đỏ. Ra đòn: chồm tới vung vuốt, há mõm
B21.cuuvi={w:124,h:106,ax:62,ay:102,glow:'rgba(255,60,20,.45)',anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Or=R('#ff7a1a'), Od=R('#d8560e'), Ol=R('#ffa04a'), In=R('#5a1a0a'), Bk='#1c0c08', ph=f*.9, hy=bob-(atk?2:0), lx=atk?4:0;
  for(let i=0;i<9;i++){ const a=-2.95+i*.24, L=44+(i%3)*5, b0=[52,62+bob], dx=Math.cos(a), dy=Math.sin(a), px=-dy, py=dx, w=Math.sin(i*1.7+ph)*6;
    const pt=(k,ww)=>[b0[0]+dx*L*k+px*ww,b0[1]+dy*L*k+py*ww];   /* đuôi xù: dày giữa, nhọn ngọn, uốn chữ S lay theo khung, có vệt lông sáng dọc đuôi */
    V.tube([b0,pt(.25,w),pt(.5,-w*.6),pt(.75,w*.8),pt(1,w*1.2)],[6,9,10,7,1.5],i%2?Or:Od,{g:'tail'+i,flat:.15}); V.tube([pt(.3,w*.9),pt(.5,-w*.6),pt(.72,w*.7)],[2.4,3,2],Ol,{g:'tl'+i,lift:.2}); }
  V.tube([[56,82],[54,92],[58,99]],[5,4.2,3.6],Od,{g:'hlF'}); V.ell(59,100,5.5,2.2,In,{g:'hpF'});
  V.ell(46,74+bob,16,13,Or,{g:'haunch'}); V.tube([[44,80],[38-st*2,91],[42-st*3,99]],[7,6,5],Or,{g:'hl'}); V.ell(43-st*3,100,6.5,2.4,Od,{g:'hp'}); for(const x of [38,41,44]) V.px(x-st*3,101,Bk);
  V.ell(64+lx/2,68+bob,25,15,Or,{g:'body'}); V.ell(81+lx,64+bob,13,14,Ol,{g:'chest',lift:.1});
  V.tube([[78+lx,72],[82+st*2,86],[86+st*3,99]],[6.5,5.5,4.6],Od,{g:'armF'}); V.ell(87+st*3,100,5.5,2.2,In,{g:'pawF'});
  if(atk){ V.tube([[86,70],[99,64],[109,58]],[6,5,4.4],Or,{g:'arm'}); V.ell(111,57,5,4.6,Or,{g:'paw',lift:.2}); for(const [x0,y0,x1,y1] of [[113,53,118,49],[115,56,121,54],[114,60,119,62]]) V.line(x0,y0,x1,y1,Bk); }
  else { V.tube([[86,72],[90-st*2,86],[92-st*3,99]],[7,6,5],Or,{g:'arm'}); V.ell(93-st*3,100,6,2.4,Or,{g:'paw',lift:.2}); for(const x of [90,93,96]) V.line(x-st*3,100,x-st*3+1,102,Bk); }
  const hx0=88+lx; V.ell(hx0,43+hy,18,15,Or,{g:'head'}); V.ell(hx0-6,50+hy,9,6,Ol,{g:'cheek',lift:.05}); V.ell(hx0+15,51+hy,12,atk?8:7,Or,{g:'snout'}); V.ell(hx0+26,48+hy,2.8,2.2,R('#1c0c08'),{g:'nose',lift:.4});
  if(atk){ V.poly([[hx0+6,53+hy],[hx0+24,51+hy],[hx0+20,60+hy],[hx0+8,59+hy]],R('#3a0806'),{n:[0,0,1],g:'jaw'}); for(let x=hx0+8;x<hx0+23;x+=3){ V.rect(x,52+hy,1,3,'#ffffff'); V.rect(x+1,57+hy,1,2,'#ffffff'); } }
  else { V.line(hx0+6,55+hy,hx0+22,53+hy,Bk); V.rect(hx0+10,55+hy,1,2,'#ffffff').rect(hx0+18,54+hy,1,2,'#ffffff'); }
  V.poly([[hx0-12,37+hy],[hx0-16,6+hy],[hx0-1,32+hy]],Or,{n:[0,0,1],g:'earL'}); V.poly([[hx0-10,34+hy],[hx0-14,13+hy],[hx0-4,31+hy]],In,{n:[0,0,1],g:'earLi'});   /* tai dài, lòng nâu đỏ */
  V.poly([[hx0+1,32+hy],[hx0+7,4+hy],[hx0+13,33+hy]],Od,{n:[0,0,1],g:'earR'}); V.poly([[hx0+4,31+hy],[hx0+7,11+hy],[hx0+10,31+hy]],In,{n:[0,0,1],g:'earRi'});
  V.poly([[hx0+1,42+hy],[hx0-3,30+hy],[hx0+5,40+hy]],R('#1c0c08'),{g:'mark1'}); V.poly([[hx0+11,41+hy],[hx0+10,31+hy],[hx0+14,40+hy]],R('#1c0c08'),{g:'mark2'});   /* vệt đen quanh mắt kéo lên trán */
  for(const ex of [hx0+1,hx0+10]){ V.rect(ex,41+hy,6,3,'#ff2a1a').rect(ex+1,40+hy,4,1,'#ff2a1a'); V.rect(ex+3,40+hy,1,4,Bk); V.px(ex+1,41+hy,'#ffe066'); V.line(ex-1,39+hy,ex+6,40+hy,Bk); }
  for(const [x,y] of [[hx0+8,48],[hx0+9,50],[hx0+10,52]]) V.line(x,y+hy,x+5,y+hy,Bk);   /* vệt râu trên má */
  for(let i=0;i<7;i++){ const a=i*.9+ph, r=30+(i%3)*6; V.px(Math.round(64+Math.cos(a)*r*1.4),Math.round(62+Math.sin(a)*r*.8),i%2?'#ff4a2a':'#ffb050'); } }};   /* bọt chakra */

// Quỷ Bom Reze: cô gái áo hai dây đen, quần soóc đen, tay chân trần; đầu là quả bom tròn xám đen mắt cam sáng, ngòi cháy toé lửa trên đỉnh, chốt lựu đạn tròn bạc ở cổ.
// đi: chân so le tay vung; ra đòn: giơ tay ném quả lựu đạn xanh rút chốt
B21.reze={w:48,h:66,ax:22,ay:64,glow:'rgba(255,150,40,.3)',anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Bk=R('#24202a'), Bd=R('#16121c'), Bm=R('#4a4652'), Gr=R('#4a8a3a'), Ag=R('#c8ccd8');
  for(const [x,s] of [[17,-1],[25,1]]){ const ax=x+s*st*3; V.tube([[x,40+bob],[(x+ax)/2,51],[ax,60]],[3,2.6,2.3],SKIN,{g:'leg'+x}); V.ell(ax+s*.5,62,3.4,1.6,Bd,{g:'shoe'+x,lift:.15}); }
  V.poly([[14,36+bob],[28,36+bob],[29,43+bob],[13,43+bob]],Bk,{n:[-.3,-.2,.93],g:'shorts'}); V.poly([[14,22+bob],[28,22+bob],[29,37+bob],[13,37+bob]],Bk,{n:[-.3,-.2,.93],g:'top'});
  V.line(16,22+bob,17,18+bob,'#16121c').line(26,22+bob,25,18+bob,'#16121c');   /* 2 dây áo */
  if(atk){ V.tube([[28,23],[33,15],[35,8]],[2.2,2,1.8],SKIN,{g:'armR'}); V.ell(36,5,3.6,3.6,Gr,{g:'gren',lift:.3}); V.rect(35,1,2,2,'#c8ccd8'); V.ell(39,2,1.6,1.6,Ag,{g:'pin'}); V.tube([[14,23],[9,28],[7,33]],[2.2,2,1.8],SKIN,{g:'armL'}); }
  else { const sw=st*3; V.tube([[28,23+bob],[31,30],[32,36+sw]],[2.2,2,1.8],SKIN,{g:'armR'}); V.tube([[14,23+bob],[11,30],[10,36-sw]],[2.2,2,1.8],SKIN,{g:'armL'}); }
  V.tube([[21,17+bob],[21,22+bob]],2.4,SKIN,{g:'neck'}); V.ell(21,19+bob,3.4,1.6,Ag,{g:'ring',lift:.3}); V.px(24,19+bob,'#ffffff');   /* chốt lựu đạn ở cổ */
  V.ell(21,10+bob,9,8.6,Bm,{g:'bomb'}); V.line(13,10+bob,29,10+bob,'#2a2630').line(21,2+bob,21,18+bob,'#2a2630');   /* đầu bom có đường ghép */
  V.rect(16,9+bob,3,2,'#ffb030').rect(23,9+bob,3,2,'#ffb030'); V.px(17,9+bob,'#fff3b0').px(24,9+bob,'#fff3b0'); V.rect(17,14+bob,8,1,'#1c1516');
  V.tube([[24,3+bob],[27,0+bob]],[1,.8],R('#8a6a3a'),{g:'fuse'}); const sp=f%2; V.px(27+sp,0,'#ffe066').px(28-sp,1,'#ff8a2a').px(26,0+sp,'#ffffff'); }};   /* ngòi cháy toé lửa */
// Pochita: chú chó cam nhỏ, lưỡi cưa bạc răng cưa mọc giữa trán, mắt đen tròn, 4 chân ngắn, đuôi là dây giật có tay cầm. Ra đòn: cưa rú lên toé lửa
B21.pochita={w:40,h:34,ax:18,ay:32,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Or=R('#f28a2a'), Od=R('#c8601a'), Ag=R('#c8ccd8');
  V.tube([[6,20+bob],[2,16],[1,11]],[1.2,1,1],R('#3a3a44'),{g:'cord'}); V.rect(-1+1,8,3,3,'#e8302a');   /* đuôi dây giật */
  for(const [x,s] of [[9,-1],[13,1],[21,-1],[25,1]]){ const ax=x+s*st*1.5; V.tube([[x,24+bob],[ax,30]],[2,1.8],x%2?Od:Or,{g:'leg'+x}); V.ell(ax,31,2.2,1.1,Od,{g:'paw'+x,lift:.1}); }
  V.ell(17,22+bob,11,6.5,Or,{g:'body'}); V.ell(25,14+bob,8.5,7.5,Or,{g:'head'}); V.ell(30,17+bob,4,3,Or,{g:'snout'}); V.ell(33.5,16+bob,1.4,1.1,R('#1c1516'),{g:'nose',lift:.3});
  V.rect(24,12+bob,2,2,'#1c1516').rect(29,12+bob,2,2,'#1c1516'); V.px(24,12+bob,'#ffffff').px(29,12+bob,'#ffffff'); V.line(30,19+bob,33,19+bob,'#7a3a1a');
  const rv=atk?1:0; V.poly([[23,8+bob],[27,8+bob],[33-rv,2+rv],[29,2]],Ag,{n:[0,-.3,.95],g:'saw'}); for(let i=0;i<4;i++) V.px(28+i*1.4,(6-i*2)+bob,'#5a5e6a');   /* lưỡi cưa trên trán + răng */
  V.ell(19,11+bob,3,2.4,Od,{g:'earL'}); if(atk) V.px(33,2,'#ffe066').px(35,3,'#ff8a2a').px(31,1,'#ffffff'); }};

// Ngọc Rồng 1–7 sao: quả cầu pha lê cam trong suốt, sao đỏ bên trong, ánh sáng loé (khung 1 sáng hơn)
for(let n=1;n<=7;n++) B21['ngocrong'+n]={w:16,h:16,ax:8,ay:15,glow:'rgba(255,190,60,.45)',draw(V,f){ V.ell(8,8,6.6,6.6,[[255,246,200,255],[255,180,60,255],[230,120,20,255],[170,70,10,255]],{g:'ball'}); V.ell(6,5.5,2,1.4,[[255,255,240,255],[255,250,220,255],[255,240,200,255],[255,230,180,255]],{g:'hl',lift:.6});
  const P=[[8,8],[5,10],[11,10],[6,6],[10,6],[8,11],[8,5]]; for(let i=0;i<n;i++){ const [x,y]=P[i]; V.px(x,y,'#e8202a').px(x-1,y,'#ff4a3a').px(x+1,y,'#ff4a3a').px(x,y-1,'#ff4a3a'); } if(f) V.px(4,4,'#ffffff').px(12,4,'#ffffff'); }};
// Khiên của Hắc Hoàng Đế: khiên đen tuyền viền vàng, mặt quỷ sừng vàng mắt đỏ, ngọc đỏ giữa trán. big: hình to cho quầy Thợ Rèn, không thì bản nhỏ đeo trên tay
const SHIELD={}; A.muShield=(k,big)=>SHIELD[k+!!big]||(SHIELD[k+!!big]=(()=>{ const V=vol(26,30), Bk=R('#2a2234'), Gd=R('#e8b830');
  V.poly([[2,3],[24,3],[24,14],[13,28],[2,14]],Bk,{n:[-.2,-.3,.93],g:'face'}); for(const pts of [[[2,3],[24,3]],[[24,3],[24,14],[13,28]],[[2,3],[2,14],[13,28]]]) V.tube(pts,1.3,Gd,{g:'rim'});
  V.poly([[7,10],[4,3],[10,8]],Gd,{g:'hornL'}); V.poly([[19,10],[22,3],[16,8]],Gd,{g:'hornR'}); V.rect(7,12,4,2,'#ff2a2a').rect(15,12,4,2,'#ff2a2a'); V.px(8,12,'#ffe8a0').px(16,12,'#ffe8a0');
  V.line(7,11,11,12,'#0c0810').line(15,12,19,11,'#0c0810'); V.ell(13,9,1.8,1.8,R('#e8302a'),{g:'gem',lift:.5}); for(const x of [9,12,15]) V.rect(x,18,2,3,'#f4f0e8'); V.rect(8,17,10,1,'#0c0810');
  const c=V.done(false,{glow:'rgba(255,60,60,.3)',gr:1}); if(big) return {c,ax:13,ay:28}; const sm=A.cv(13,15), g=sm.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,13,15); return {c:sm,ax:6,ay:14}; })());

const C21={}, old=A.muBossSprite, oldAnim=A.bossAnim;
A.bossAnim=sp=>B21[sp]?B21[sp].anim:oldAnim?oldAnim(sp):null;
A.muBossSprite=(sp,fr,hit)=>{ const d=B21[sp]; if(!d) return old(sp,fr,hit); const k=sp+fr+!!hit; if(C21[k]) return C21[k]; const V=vol(d.w,d.h); d.draw(V,fr|0);
  return C21[k]={c:V.done(!!hit,d.glow?{glow:d.glow,gr:2}:undefined),ax:d.ax,ay:d.ay}; };
})();
