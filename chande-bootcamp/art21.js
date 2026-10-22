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

const C21={}, old=A.muBossSprite, oldAnim=A.bossAnim;
A.bossAnim=sp=>B21[sp]?B21[sp].anim:oldAnim?oldAnim(sp):null;
A.muBossSprite=(sp,fr,hit)=>{ const d=B21[sp]; if(!d) return old(sp,fr,hit); const k=sp+fr+!!hit; if(C21[k]) return C21[k]; const V=vol(d.w,d.h); d.draw(V,fr|0);
  return C21[k]={c:V.done(!!hit,d.glow?{glow:d.glow,gr:2}:undefined),ax:d.ax,ay:d.ay}; };
})();
