/* Chan City — Đất Phía Tây (MU): boss Doraemon, Nobita, Conan, Eren + Titan Tiến Công, Nữ Yêu Tiếng Hét, Pepe (tóc giả chú hề, cầm súng),
   quái con Pepe Con + Trứng Laser (vẽ khối có đổ bóng bằng A.vol như art18, mỗi con 2 khung: 0 đứng / 1 ra đòn + bản chớp trắng khi trúng đòn),
   3 thần thú siêu huyền thoại Raikou / Suicune / Entei (Lính Cát 28×28), đồ trang trí (cổng đá, 3 ống cống bãi đất trống, lều chú hề Làng Meme,
   quầy vé, đoạn Tường Maria, cây chết), icon Huy Hiệu Pepe. Ghi đè A.muBossSprite: loài lạ thì trả về bản cũ (art13). */
(function(){
const A=ART, vol=A.vol, K='#1c1516', WH='#ffffff';
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const SKIN=R('#f2c49a'), SKIN2=R('#e8b088');

/* ======================= boss ======================= */
const B19={};
// khung chung cho boss mới: 0 / 4 đứng thở · 2 / 3 bước đi (chân so le, tay đánh ngược chân) · 1 ra đòn (tư thế riêng từng boss)
const ANIM5={idle:[0,4],walk:[2,3],atk:1}, pose=f=>({st:f===2?1:f===3?-1:0,bob:f===2||f===3||f===4?1:0,atk:f===1});
const leg=(V,x,y0,y1,st,r,C,shoe,g)=>{ V.tube([[x,y0],[x+st*1.5,(y0+y1)/2],[x+st*3,y1-2]],[r,r*.9,r*.8],C,{g:'l'+g}); if(shoe) V.ell(x+st*3+1,y1,r*1.7,r*.9,shoe,{g:'s'+g,lift:.15}); };
const arm=(V,pts,r,C,hand,g)=>{ V.tube(pts,pts.map((_,i)=>r*(1-i*.08)),C,{g:'a'+g}); const e=pts[pts.length-1]; if(hand) V.ell(e[0],e[1]+1,r*1.05,r,hand,{g:'h'+g}); return e; };
// Doraemon: đầu tròn xanh to, mặt trắng, mũi đỏ, ria, vòng cổ chuông vàng, túi thần kỳ; chân ngắn bàn chân trắng; ra đòn: giơ tay rút bảo bối ra ném
B19.doraemon={w:48,h:52,ax:24,ay:50,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Bl=R('#1e9be8'), Wt=R('#f8f8f6'), Rd=R('#e8302a'), Yl=R('#ffd23a');
  leg(V,18,40+bob,49,-st,3.4,Bl,Wt,'L'); leg(V,30,40+bob,49,st,3.4,Bl,Wt,'R');
  V.ell(24,35+bob,12,10,Bl,{g:'body'}); V.ell(24,36+bob,9,8.4,Wt,{g:'belly',lift:.1}); V.ell(24,38+bob,6,3,Wt,{g:'pocket',lift:.2}); V.line(18,38+bob,30,38+bob,'#9aa0a8');
  if(atk){ arm(V,[[35,31],[40,24],[42,16]],3,Bl,Wt,'R'); V.ell(43,11,4,4,R('#ff9ad0'),{g:'gadget',lift:.3}); V.px(42,9,WH); arm(V,[[13,31],[8,35],[6,39]],3,Bl,Wt,'L'); }
  else { arm(V,[[35,31],[39,35+st*2],[40,39+st*2]],3,Bl,Wt,'R'); arm(V,[[13,31],[9,35-st*2],[8,39-st*2]],3,Bl,Wt,'L'); }
  const hy=bob; V.ell(24,16+hy,15,13.5,Bl,{g:'head'}); V.ell(24,19+hy,12,10,Wt,{g:'face',lift:.1});
  V.ell(19.5,12+hy,3.6,4.4,Wt,{g:'eyeL',lift:.25}); V.ell(28.5,12+hy,3.6,4.4,Wt,{g:'eyeR',lift:.25}); V.rect(20,13+hy,2,2,K).rect(27,13+hy,2,2,K);
  V.ell(24,17+hy,2.2,2.2,Rd,{g:'nose',lift:.4}); V.line(24,19+hy,24,22+hy,K); V.poly([[17,23+hy],[31,23+hy],[28,28+hy],[20,28+hy]],Rd,{n:[0,0,1],g:'mouth'});
  for(const [x0,y0,x1,y1] of [[10,18,18,19.5],[10,22,18,21.5],[30,19.5,38,18],[30,21.5,38,22]]) V.line(x0,y0+hy,x1,y1+hy,K);
  V.rect(13,27+hy,22,2,'#d8282a'); V.ell(24,29.5+hy,2.4,2.4,Yl,{g:'bell',lift:.4}); V.px(24,30.5+hy,K); }};
// Nobita: tóc đen, kính tròn, áo phông vàng, quần soóc xanh, tất trắng giày vàng; ra đòn: vung tay ném bánh rán
B19.nobita={w:36,h:60,ax:18,ay:58,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Hr=R('#24202a'), Sh=R('#f2d23a'), Pt=R('#2a5ab8'), Sn=R('#f2c43d');
  leg(V,14,40+bob,57,-st,2.4,SKIN,Sn,'L'); leg(V,22,40+bob,57,st,2.4,SKIN,Sn,'R'); V.rect(12-st*3,50,4,3,'#f4f4f2').rect(20+st*3,50,4,3,'#f4f4f2');
  V.poly([[10,35+bob],[26,35+bob],[26,42+bob],[10,42+bob]],Pt,{n:[-.2,-.2,.95],g:'pants'}); V.poly([[9,23+bob],[27,23+bob],[28,36+bob],[8,36+bob]],Sh,{n:[-.3,-.2,.93],g:'shirt'});
  if(atk){ arm(V,[[27,25],[32,19],[33,13]],2.2,Sh,SKIN,'R'); V.ell(33,9,4,2.4,R('#c8803a'),{g:'dora',lift:.2}); V.line(29,9,37,9,'#7a4a22'); arm(V,[[9,25],[5,30],[4,35]],2.2,Sh,SKIN,'L'); }
  else { arm(V,[[27,25],[29,31+st*2],[30,36+st*2]],2.2,Sh,SKIN,'R'); arm(V,[[9,25],[7,31-st*2],[6,36-st*2]],2.2,Sh,SKIN,'L'); }
  const hy=bob; V.ell(18,14+hy,9,9,SKIN,{g:'head'}); V.ell(18,8+hy,9.4,5.6,Hr,{g:'hair'}); V.rect(9,8+hy,3,6,'#24202a').rect(24,8+hy,3,6,'#24202a');
  for(const x of [14,22]) V.ell(x,14+hy,3,3,R('#dfe8f0'),{g:'gl'+x,lift:.3}); V.line(17,14+hy,19,14+hy,K); V.px(14,14+hy,K).px(22,14+hy,K); V.line(15,19+hy,21,19+hy,'#a85a4a'); }};
// Conan: tóc nâu dựng, kính to, áo vest xanh, nơ đỏ, quần soóc, giày đen; ra đòn: Giày Tăng Lực sút bóng (chân phải đá cao, giày toả sáng, bóng bay ra)
B19.conan={w:40,h:58,ax:18,ay:56,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Hr=R('#5a3a22'), Bz=R('#2a4ab0'), Bd=R('#1e3484'), Pt=R('#2a3a6a'), Rd=R('#e8302a'), Bk=R('#2a2026');
  leg(V,14,40+bob,55,atk?0:-st,2.4,SKIN,Bk,'L');
  if(atk){ V.tube([[22,40],[28,42],[34,39]],[2.4,2.2,2],SKIN,{g:'lR'}); V.ell(35,38,3.4,2,R('#ff9a2a'),{g:'shoe',lift:.4}); V.ell(35,38,6,4,[[255,236,170,120],[255,200,80,80],[255,150,40,40],[200,90,20,20]],{g:'glow'}); V.ell(38,33,3,3,R('#f4f4f2'),{g:'ball'}); V.line(36,33,40,33,'#2a2026'); }
  else leg(V,22,40+bob,55,st,2.4,SKIN,Bk,'R');
  V.poly([[10,35+bob],[26,35+bob],[26,41+bob],[10,41+bob]],Pt,{g:'pants'}); V.poly([[9,22+bob],[27,22+bob],[27,36+bob],[9,36+bob]],Bz,{n:[-.3,-.2,.93],g:'coat'}); V.poly([[19,22+bob],[27,22+bob],[27,36+bob],[20,36+bob]],Bd,{g:'coat2'});
  V.poly([[15,22+bob],[21,22+bob],[20,31+bob],[16,31+bob]],R('#f4f4f2'),{g:'shirt'}); V.poly([[14.5,22+bob],[18,24+bob],[21.5,22+bob],[21.5,26+bob],[18,24+bob],[14.5,26+bob]],Rd,{n:[0,0,1],g:'bow'});
  arm(V,[[27,24+bob],[29,30+(atk?-2:st*2)],[30,35+(atk?-4:st*2)]],2.2,Bz,SKIN,'R'); arm(V,[[9,24+bob],[6,29-(atk?2:st*2)],[5,34-(atk?4:st*2)]],2.2,Bz,SKIN,'L'); V.rect(28,30+bob,3,2,'#c8ccd2');   /* đồng hồ gây mê */
  const hy=bob; V.ell(18,13+hy,8.6,8.4,SKIN,{g:'head'}); V.poly([[9,10+hy],[11,2+hy],[15,6+hy],[18,0+hy],[21,5+hy],[25,1+hy],[27,10+hy],[23,7+hy],[13,7+hy]],Hr,{n:[-.2,-.4,.89],g:'hair'}); V.ell(18,7+hy,8.6,3.2,Hr,{g:'hair2'});
  for(const x of [14,22]) V.ell(x,13.5+hy,3.2,2.8,R('#e8f0f8'),{g:'gl'+x,lift:.3}); V.line(17,13.5+hy,19,13.5+hy,K); V.px(14,13.5+hy,K).px(22,13.5+hy,K); V.line(15,18+hy,20,18+hy,'#a85a4a'); }};
// Eren: tóc nâu sẫm chấm vai, mắt xanh ngọc, áo khoác đen, áo trong xám, quần đen; ra đòn: đấm thẳng tới trước
B19.eren={w:40,h:62,ax:18,ay:60,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Hr=R('#3a2a22'), Jk=R('#2a2630'), In=R('#a8a8b0'), Pt=R('#1e1c24'), Bt=R('#141218'), Ey='#3aa8a0';
  leg(V,14,40+bob,59,-st,2.8,Pt,Bt,'L'); leg(V,22,40+bob,59,st,2.8,Pt,Bt,'R');
  V.poly([[8,22+bob],[28,22+bob],[28,42+bob],[8,42+bob]],Jk,{n:[-.3,-.2,.93],g:'coat'}); V.poly([[14,22+bob],[22,22+bob],[21,34+bob],[15,34+bob]],In,{g:'in'}); V.line(18,24+bob,18,34+bob,'#5a3a22');
  if(atk){ arm(V,[[28,25],[34,25],[39,24]],2.6,Jk,SKIN,'R'); V.ell(39,25,3,3,SKIN,{g:'fist',lift:.3}); for(const y of [21,25,29]) V.line(33,y,30,y,'#e8e0d0'); arm(V,[[8,25],[5,31],[6,36]],2.6,Jk,SKIN,'L'); }
  else { arm(V,[[28,25+bob],[30,32+st*2],[31,37+st*2]],2.6,Jk,SKIN,'R'); arm(V,[[8,25+bob],[6,32-st*2],[5,37-st*2]],2.6,Jk,SKIN,'L'); }
  const hy=bob; V.ell(18,13+hy,8.4,8.8,SKIN,{g:'head'}); V.ell(18,8+hy,9.6,6,Hr,{g:'hair'}); V.poly([[8,8+hy],[10,24+hy],[13,14+hy]],Hr,{g:'hairL'}); V.poly([[28,8+hy],[26,24+hy],[23,14+hy]],Hr,{g:'hairR'});
  V.rect(13,13+hy,4,2,Ey).rect(19,13+hy,4,2,Ey); V.px(13,13+hy,WH).px(19,13+hy,WH); V.line(13,11+hy,17,10.5+hy,K).line(19,10.5+hy,23,11+hy,K); V.line(15,18+hy,21,18+hy,'#7a3a2a'); }};
// Titan Tiến Công: cao gấp 3, cơ bắp da trần, tóc đen dài, mắt xanh lục sáng, hàm răng nhe; bước đi nặng nề; ra đòn: chồm tới vươn tay chộp người
B19.titan={w:90,h:126,ax:45,ay:124,glow:'rgba(120,255,90,.25)',anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Sk=R('#e8a888'), Mu=R('#c87868'), Hr=R('#141218'), Gr='#7aff5a', b2=bob*2;
  leg(V,36,80+b2,122,-st*2,8,Sk,Mu,'L'); leg(V,54,80+b2,122,st*2,8,Sk,Mu,'R');
  V.ell(45,76+b2,15,8,Mu,{g:'hip'}); V.poly([[27,40+b2],[63,40+b2],[59,78+b2],[31,78+b2]],Sk,{n:[-.25,-.2,.95],g:'torso'});
  for(const y of [52,60,68]){ V.line(38,y+b2,44,y+1+b2,'#b86858'); V.line(46,y+1+b2,52,y+b2,'#b86858'); } V.line(45,44+b2,45,76+b2,'#b86858'); V.line(33,46+b2,43,50+b2,'#b86858').line(57,46+b2,47,50+b2,'#b86858');
  if(atk){ arm(V,[[27,44],[16,40],[6,34]],7,Sk,Sk,'L'); arm(V,[[63,44],[74,40],[84,34]],7,Sk,Sk,'R'); for(const x of [3,8,82,87]) V.tube([[x,33],[x+(x<45?-1:1),27]],[1.6,1.2],Sk,{g:'fg'+x}); }   /* hai tay vươn ra chộp */
  else { arm(V,[[27,44+b2],[21,60+st*3],[21,74+st*3]],7,Sk,Sk,'L'); arm(V,[[63,44+b2],[69,60-st*3],[69,74-st*3]],7,Sk,Sk,'R'); }
  V.ell(35,42+b2,10,6,Sk,{g:'shL'}); V.ell(55,42+b2,10,6,Sk,{g:'shR'});
  const hy=b2+(atk?3:0); V.ell(45,24+hy,13,14,Sk,{g:'head'}); V.ell(45,14+hy,15,9,Hr,{g:'hair'}); V.poly([[30,16+hy],[28,44+hy],[36,28+hy]],Hr,{g:'hairL'}); V.poly([[60,16+hy],[62,44+hy],[54,28+hy]],Hr,{g:'hairR'});
  V.rect(37,21+hy,6,3,Gr).rect(48,21+hy,6,3,Gr); V.px(37,21+hy,WH).px(48,21+hy,WH); V.line(36,19+hy,43,20+hy,K).line(48,20+hy,55,19+hy,K);
  const jaw=atk?6:2; V.rect(37,28+hy,16,3+jaw,'#2a1014'); for(let x=37;x<53;x+=2){ V.rect(x,28+hy,1,2,WH); V.rect(x,29+jaw+hy,1,2,WH); }
  for(let i=0;i<6;i++) V.px(28+i*7,4+(i%2)*2,'#d8d8d8'); }};
// Nữ Yêu Tiếng Hét (ma nữ hư cấu): tóc đen dài tới hông có lọn bay, áo dài tím than 2 vạt dài phấp phới, quần lụa trắng mờ thành khói (lơ lửng),
// da trắng xanh, mắt đỏ; đi: lượn lờ, tóc và vạt áo bay theo; ra đòn: giang tay, ngửa mặt há miệng hét, toả vòng sóng âm
B19.yeunu={w:48,h:66,ax:24,ay:64,anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Ad=R('#3a2a5a'), Ad2=R('#2a1e44'), Tr=R('#c890b8'), Pn=R('#e8eef4'), Hr=R('#141018'), Pl=R('#e8eef6'), sw=st*2, fl=bob?1:0;
  // khói dưới chân (lơ lửng) + ống quần lụa
  for(let i=0;i<4;i++) V.ell(17+i*5+sw*(i%2?1:-1),61-(i%2),3.4,2,[[236,240,248,150],[210,216,232,110],[170,176,200,70],[120,120,150,40]],{g:'mist'+i});
  V.tube([[19,44+fl],[18+sw,52],[17+sw*1.5,58]],[3,3.2,3.4],Pn,{g:'pL'}); V.tube([[27,44+fl],[28-sw,52],[29-sw*1.5,58]],[3,3.2,3.4],Pn,{g:'pR'});
  // vạt sau + vạt trước áo dài bay
  V.poly([[15,34+fl],[31,34+fl],[34+sw*2,58],[12+sw*2,58]],Ad2,{n:[-.2,-.2,.96],g:'flapB'}); V.poly([[17,36+fl],[29,36+fl],[30-sw*2,56],[16-sw*2,56]],Ad,{n:[-.3,-.2,.93],g:'flapF'}); V.line(23,37+fl,23-sw*2,55,'#5a4a7a');
  // thân áo dài ôm, cổ cao, viền hồng
  V.poly([[16,20+bob],[30,20+bob],[31,37+fl],[15,37+fl]],Ad,{n:[-.3,-.2,.93],g:'body'}); V.poly([[23,20+bob],[30,20+bob],[31,37+fl],[24,37+fl]],Ad2,{g:'body2'});
  V.rect(20,18+bob,6,3,'#3a2a5a'); V.line(20,21+bob,26,21+bob,'#c890b8'); V.line(23,22+bob,28,27+bob,'#c890b8');   /* cổ áo + đường cúc chéo */
  // tay
  if(atk){ arm(V,[[16,23],[9,16],[4,9]],2.3,Ad,Pl,'L'); arm(V,[[30,23],[37,16],[42,9]],2.3,Ad,Pl,'R'); for(let r=0;r<3;r++) V.ell(23,15,10+r*5,7+r*3.4,[[255,255,255,46],[235,220,255,34],[200,170,255,22],[160,130,230,12]],{g:'wave'+r}); }
  else { arm(V,[[16,23+bob],[13,30+sw],[12,36+sw]],2.3,Ad,Pl,'L'); arm(V,[[30,23+bob],[33,30-sw],[34,36-sw]],2.3,Ad,Pl,'R'); }
  // tóc dài sau lưng + lọn bay
  V.poly([[14,8+bob],[10,44+sw],[16,40+fl],[18,14+bob]],Hr,{g:'hairL'}); V.poly([[32,8+bob],[36,44-sw],[30,40+fl],[28,14+bob]],Hr,{g:'hairR'}); V.tube([[13,20],[8+sw*2,32],[6+sw*3,44]],[1.6,1.2,.8],Hr,{g:'strand'});
  // mặt
  const hy=bob+(atk?-1:0); V.ell(23,13+hy,7.4,8.4,Pl,{g:'head'}); V.ell(23,7+hy,8.6,5.4,Hr,{g:'hair'}); V.poly([[15,8+hy],[19,7+hy],[17,18+hy],[15,16+hy]],Hr,{g:'bangL'}); V.poly([[31,8+hy],[27,7+hy],[29,18+hy],[31,16+hy]],Hr,{g:'bangR'});
  V.rect(19,12+hy,3,2,'#ff2a4a').rect(24,12+hy,3,2,'#ff2a4a'); V.px(19,12+hy,'#ffd0d8').px(24,12+hy,'#ffd0d8'); V.line(19,11+hy,22,11.5+hy,K).line(24,11.5+hy,27,11+hy,K);
  V.ell(23,17.6+hy,atk?2.6:1.2,atk?3.2:.9,R('#3a0a1a'),{g:'mouth'}); V.px(22,16+hy,'#e8a8b8'); }};
// Cửu Vĩ Hồ Ly (Naruto hoá): cáo lửa cam to, 9 đuôi xoè sau lưng phấp phới, mắt đỏ, vân đen quanh mắt, hào quang lửa; ra đòn: há miệng gầm, chân trước vồ tới
B19.cuuvi={w:96,h:84,ax:48,ay:80,glow:'rgba(255,120,40,.35)',anim:ANIM5,draw(V,f){ const {st,bob,atk}=pose(f), Or=R('#ff7a1a'), Od=R('#c84a10'), Bl=R('#2a1408'), Rd='#ff2a1a';
  for(let i=0;i<9;i++){ const a=-2.6+i*.4+Math.sin(i+st)*.06, L=34+(i%3)*5, x0=48, y0=46+bob, x1=x0+Math.cos(a)*L*.55, y1=y0+Math.sin(a)*L*.55, x2=x0+Math.cos(a+(i%2?.15:-.15))*L, y2=y0+Math.sin(a+(i%2?.15:-.15))*L;
    V.tube([[x0,y0],[x1,y1],[x2,y2]],[5,4.2,2.4],i%2?Or:Od,{g:'tail'+i}); V.ell(x2,y2,2.4,2.4,R('#ffd0a0'),{g:'tip'+i}); }
  leg(V,36,62+bob,79,-st,4.4,Or,Bl,'BL'); leg(V,60,62+bob,79,st,4.4,Or,Bl,'BR');
  V.ell(48,56+bob,20,12,Or,{g:'body'}); V.ell(48,60+bob,13,7,R('#ffc890'),{g:'belly',lift:.1});
  const fr=atk?6:0; leg(V,30-fr,56+bob,79,st,4,Or,Bl,'FL'); leg(V,66+fr,56+bob,79,-st,4,Or,Bl,'FR');
  const hy=bob-(atk?3:0); V.ell(48,36+hy,15,12,Or,{g:'head'}); V.poly([[36,30+hy],[32,14+hy],[42,26+hy]],Or,{g:'earL'}); V.poly([[60,30+hy],[64,14+hy],[54,26+hy]],Or,{g:'earR'});
  V.poly([[34,30+hy],[33,18+hy],[39,27+hy]],Bl,{g:'earLi'}); V.poly([[62,30+hy],[63,18+hy],[57,27+hy]],Bl,{g:'earRi'});
  V.ell(48,42+hy,8,5,R('#ffc890'),{g:'muzzle',lift:.1}); V.rect(39,32+hy,5,3,Rd).rect(52,32+hy,5,3,Rd); V.line(37,31+hy,44,33+hy,K).line(52,33+hy,59,31+hy,K); V.px(40,32+hy,'#ffffff').px(53,32+hy,'#ffffff');
  if(atk){ V.rect(42,44+hy,12,5,'#3a0a0a'); for(let x=42;x<54;x+=2){ V.rect(x,44+hy,1,2,'#ffffff'); V.rect(x,47+hy,1,2,'#ffffff'); } } else V.line(44,45+hy,52,45+hy,K);
  for(let i=0;i<6;i++) V.px(30+i*7,6+(i%2)*3,'#ffb050'); }};
// Pepe chú hề: đầu ếch to tóc giả 7 màu, mũi đỏ, mắt lim dim, môi nâu; vest xanh nơ chấm bi, quần xanh đậm, giày chú hề đỏ to; tay trái cầm súng lục.
// khung: 0 / 4 đứng thở · 2 / 3 bước đi (chân so le, tay đánh theo) · 1 bắn (tay súng giơ thẳng, giật nòng, chớp lửa, tay kia giơ lên)
B19.pepe={w:66,h:80,ax:33,ay:78,anim:{idle:[0,4],walk:[2,3],atk:1},draw(V,f){ const Gn=R('#5aa83a'), Gd=R('#3a7a2a'), Su=R('#1e4ad8'), Sd=R('#16348a'), Pt=R('#1a2a6a'), Sh=R('#e8302a'), Lp=R('#a8583a'), Bw=R('#a8d8ff'), Gu=R('#5a5a66');
  const st=f===2?1:f===3?-1:0, bob=f===4||f===2||f===3?1:0, shoot=f===1;
  // chân + giày chú hề (bước đi: chân trước / sau đổi chỗ)
  V.tube([[27,58+bob],[26-st*3,66],[25-st*4,72]],[3.6,3.2,3],Pt,{g:'lL'}); V.tube([[39,58+bob],[40+st*3,66],[41+st*4,72]],[3.6,3.2,3],Pt,{g:'lR'});
  V.ell(23-st*4,75,7,3,Sh,{g:'sL',lift:.2}); V.ell(43+st*4,75,7,3,Sh,{g:'sR',lift:.2}); V.px(19-st*4,74,'#ff9a8a').px(39+st*4,74,'#ff9a8a');
  // thân vest + áo sơ mi + nơ chấm bi
  V.poly([[19,40+bob],[47,40+bob],[49,60+bob],[17,60+bob]],Su,{n:[-.25,-.2,.95],g:'suit'}); V.poly([[33,41+bob],[47,40+bob],[49,60+bob],[34,60+bob]],Sd,{g:'suit2'});
  V.poly([[29,40+bob],[37,40+bob],[35,52+bob],[31,52+bob]],R('#f4f4f2'),{g:'shirt'}); for(const y of [46,50,54]) V.px(33,y+bob,'#2a2026');
  V.poly([[24,41+bob],[33,45+bob],[42,41+bob],[42,49+bob],[33,45+bob],[24,49+bob]],Bw,{n:[0,0,1],g:'bow'}); for(const [x,y] of [[26,43],[27,47],[39,43],[40,47],[33,45]]) V.px(x,y+bob,WH);
  // tay phải (bên phải hình): đánh theo bước / giơ lên lúc bắn
  const rA=shoot?[[47,43+bob],[54,36],[57,28]]:[[47,43+bob],[51,51+st*2],[52,58+st*2]]; V.tube(rA,[3.4,3,2.8],Su,{g:'aR'}); const rh=rA[2]; V.ell(rh[0],rh[1]+2,3.4,3.2,Gn,{g:'hR'});
  // tay trái cầm súng: hạ xuống lúc đứng / đi, giơ thẳng ra trước lúc bắn (giật nòng)
  const gx=shoot?4:9, gy=shoot?38:50+st, lA=shoot?[[19,43+bob],[11,40],[gx+3,gy]]:[[19,43+bob],[14,48],[gx+2,gy+1]]; V.tube(lA,[3.4,3,2.8],Su,{g:'aL'}); V.ell(lA[2][0],lA[2][1],3.4,3.2,Gn,{g:'hL'});
  V.poly([[gx-6,gy-3],[gx+1,gy-3],[gx+1,gy+1],[gx-2,gy+1],[gx-2,gy+5],[gx-5,gy+5],[gx-5,gy+1],[gx-6,gy+1]],Gu,{n:[-.3,-.3,.9],g:'gun'}); V.rect(gx-6,gy-3,2,2,'#141218');
  if(shoot){ V.ell(gx-9,gy-2,3.6,3,[[255,255,220,255],[255,230,90,255],[255,150,40,255],[220,80,20,255]],{g:'flash'}); V.px(gx-13,gy-2,'#fff3b0').px(gx-11,gy-5,'#fff3b0'); }
  // đầu ếch + mặt
  const hy=bob; V.ell(33,26+hy,19,14,Gn,{g:'head'}); V.ell(33,32+hy,16,7,Gn,{g:'jaw',lift:.1});
  V.ell(25,22+hy,6.4,4.6,R('#f4f4f2'),{g:'eL',lift:.25}); V.ell(41,22+hy,6.4,4.6,R('#f4f4f2'),{g:'eR',lift:.25}); V.ell(26,23+hy,2.8,2.8,R('#141218'),{g:'pL'}); V.ell(40,23+hy,2.8,2.8,R('#141218'),{g:'pR'});
  V.px(25,22+hy,WH).px(39,22+hy,WH); V.poly([[18,19+hy],[32,20+hy],[32,22+hy],[18,21+hy]],Gd,{g:'lidL'}); V.poly([[34,20+hy],[48,19+hy],[48,21+hy],[34,22+hy]],Gd,{g:'lidR'});   /* mí mắt lim dim */
  V.poly([[20,33+hy],[46,33+hy],[44,37+hy],[22,37+hy]],Lp,{n:[0,-.3,.95],g:'lip'}); V.line(22,35+hy,44,35+hy,'#6a2a1a');
  V.ell(38,29+hy,4.2,4.2,R('#e8201a'),{g:'nose',lift:.5}); V.px(37,27+hy,WH);
  // tóc giả chú hề 7 màu
  const C=['#e8202a','#ff8a1a','#f2e23a','#2aa83a','#2a6ae8','#8a3ab0']; for(let i=0;i<6;i++) V.ell(13+i*8,11-Math.abs(i-2.5)*1.2+hy,6,7,R(C[i]),{g:'wig'+i,lift:.15});
  V.ell(10,19+hy,5,6,R(C[0]),{g:'wigL'}); V.ell(56,19+hy,5,6,R(C[5]),{g:'wigR'}); }};
// quái con: Pepe Con (ếch nhỏ đội tóc giả, chạy nhanh) · Trứng Laser (trứng trắng nứt, mắt đỏ sáng giữa vết nứt)
B19.pepe_con={w:20,h:20,ax:10,ay:19,draw(V,f){ const Gn=R('#6ab84a'), Gd=R('#3a7a2a'), b=f===1?1:0;
  V.ell(6,18,3,1.4,Gd,{g:'fL'}); V.ell(14,18,3,1.4,Gd,{g:'fR'}); V.ell(10,13-b,7,5,Gn,{g:'body'}); V.ell(7,11-b,2.2,1.8,R('#f4f4f2'),{g:'eL',lift:.3}); V.ell(13,11-b,2.2,1.8,R('#f4f4f2'),{g:'eR',lift:.3});
  V.px(7,11-b,K).px(13,11-b,K); V.line(6,15-b,14,15-b,'#a8583a'); V.ell(11.5,13.5-b,1.3,1.3,R('#e8201a'),{g:'nose'});
  for(let i=0;i<4;i++) V.ell(5+i*3.4,7-b,2.4,2.4,R(['#e8202a','#f2e23a','#2aa83a','#2a6ae8'][i]),{g:'w'+i}); }};
B19.egg={w:16,h:20,ax:8,ay:19,glow:'rgba(255,60,120,.35)',draw(V,f){ V.ell(8,12,6,7.5,R('#f4f0e8'),{g:'egg'}); V.line(3,10,6,12,K).line(6,12,8,9,K).line(8,9,10,12,K).line(10,12,13,10,K);
  V.ell(8,11,1.6,1.2,[[255,220,230,255],[255,60,120,255],[200,20,80,255],[120,10,50,255]],{g:'eye',lift:.5}); if(f===1) V.ell(8,11,3,2.4,[[255,200,220,150],[255,80,140,100],[220,30,90,60],[140,10,50,30]],{g:'beam'}); V.ell(8,19,5,1,R('#8a8478'),{g:'base',flat:.5}); }};
const C19={}, old=A.muBossSprite;
// khung hoạt ảnh của boss mới: đứng / đi / ra đòn (boss chỉ có 2 khung thì 0 đứng + đi, 1 ra đòn)
A.bossAnim=sp=>B19[sp]?B19[sp].anim||{idle:[0],walk:[0],atk:1}:null;
A.muBossSprite=(sp,fr,hit)=>{ const d=B19[sp]; if(!d) return old(sp,fr,hit); const k=sp+fr+!!hit; if(C19[k]) return C19[k]; const V=vol(d.w,d.h); d.draw(V,fr|0);
  return C19[k]={c:V.done(!!hit,d.glow?{glow:d.glow,gr:2}:undefined),ax:d.ax,ay:d.ay}; };

/* ======================= 3 thần thú siêu huyền thoại (Lính Cát 28×28, nhìn chéo sang trái như art9) ======================= */
const D=A.LC_DRAW, {ell,eye}=A.lcKit;
const legs=(P,c,cc)=>{ for(const x of [5,10,16,21]) P.rect(x,21,3,6,c); for(const x of [5,10,16,21]) P.rect(x,26,3,1,cc||'#f4ead8'); };
D.lc_raikou=P=>{ const Y='#f2c43a', Yd='#c8962a'; legs(P,Y,'#f4ead8'); ell(P,14,17,10,5,Y); for(const x of [9,13,17,21]){ P.rect(x,14,1,4,'#2a2026'); P.rect(x+1,13,1,2,'#2a2026'); }
  ell(P,16,11,6,4,'#a878a8'); ell(P,12,9,4,3,'#c890c0'); ell(P,20,9,3,3,'#c890c0');   /* mây giông tím trên lưng */
  ell(P,6,13,5,4,'#f4f4f2'); P.rect(1,9,9,3,'#3a3640'); P.rect(2,8,6,1,'#5a5662'); eye(P,4,12,'#e8302a'); P.rect(1,15,1,3,'#f4f4f2'); P.rect(4,15,1,3,'#f4f4f2');
  for(const [x,y] of [[0,12],[1,13],[9,12],[10,13]]) P.px(x,y,'#7fd8ff'); P.rect(23,14,2,2,'#7fd8ff'); P.rect(25,10,1,4,'#7fd8ff'); P.rect(26,6,1,4,'#7fd8ff'); P.rect(25,5,3,1,'#7fd8ff'); P.rect(9,20,10,1,Yd); };
D.lc_suicune=P=>{ const B='#7fd0e8'; legs(P,B,'#f4f4f2'); ell(P,14,17,10,5,B); for(const [x,y] of [[9,16],[14,18],[19,16]]){ P.rect(x,y,2,1,WH); P.px(x+1,y-1,WH); P.px(x+1,y+1,WH); }
  ell(P,16,12,9,3,'#9a6ac8'); P.rect(18,9,8,2,'#9a6ac8'); P.rect(22,7,5,2,'#b890e0');   /* bờm tím bay */
  for(const [x0,y0] of [[6,20],[22,19]]) for(let i=0;i<5;i++) P.px(x0+i,y0-Math.round(Math.sin(i)*2),WH);   /* dải lụa trắng */
  ell(P,6,12,4,4,B); P.rect(4,4,3,6,'#4a9ab8'); P.rect(6,3,2,3,'#4a9ab8'); eye(P,4,11,'#c8302a'); P.rect(1,13,3,2,'#e8f4f8'); };
D.lc_entei=P=>{ const Br='#8a4a22', Bd='#6a3418'; legs(P,Br,'#a8a8b0'); for(const x of [5,10,16,21]) P.rect(x,22,3,1,'#3a3640'); ell(P,14,16,10,6,Br); ell(P,13,19,8,3,Bd);
  for(const [x,y] of [[12,8],[16,7],[20,9]]){ P.rect(x,y,2,4,'#a8a8b0'); P.px(x,y-1,'#c8c8d0'); }   /* gai xám trên lưng */
  ell(P,22,12,4,3,'#c8d8b0'); P.px(24,10,'#e8f0d8');   /* khói */
  ell(P,6,12,5,5,Br); P.rect(2,9,7,3,'#a8a8b0'); P.rect(3,5,4,4,'#f2c43a'); P.px(5,4,'#ffe07a'); P.rect(2,12,5,3,'#c8302a'); eye(P,4,11,'#ffd84a'); P.rect(1,16,4,2,'#f4ead8'); };

/* ======================= đồ trang trí ======================= */
const CR={};
// chữ trên biển: nền tối rộng theo chữ, canh giữa ở cx
const tag=(c,s,cx,y,col)=>{ const g=c.getContext('2d'), w=A.textW(s), x=Math.round(cx-w/2); g.fillStyle=K; g.fillRect(x-2,y-1,w+4,7); A.drawText(g,s,x,y,col); };
// cổng đá Đất Phía Tây: 2 cột đá, vòm, bảng gỗ, đuốc 2 bên (dir: 0 cổng trên tường trái MU, 1 cổng Đông của Đất Phía Tây)
A.westGate=()=>CR.wg||(CR.wg=(()=>{ const V=vol(40,44), St=R('#8a8478'), Sd=R('#6a6458'), Wd=R('#8a5a32');
  V.tube([[7,43],[7,10]],[4.5,4],St,{g:'p1'}); V.tube([[33,43],[33,10]],[4.5,4],St,{g:'p2'}); V.tube([[5,11],[12,5],[20,3],[28,5],[35,11]],[4,4,4,4,4],Sd,{g:'arch'});
  V.poly([[3,12],[37,12],[37,19],[3,19]],Wd,{n:[0,-.2,.98],g:'sign'}); for(const x of [3,37]){ V.rect(x-1,20,2,6,'#5a3a22'); V.ell(x,18,2,3,[[255,250,200,255],[255,200,60,255],[255,120,20,255],[200,60,10,255]],{g:'fire'+x}); }
  const c=V.done(false,{glow:'rgba(255,180,60,.3)',gr:2}); tag(c,'PHIA TAY',20,13,'#ffd84a'); return {c,ax:20,ay:43}; })());
// 3 ống cống bê tông chồng nhau (bãi đất trống của Nobita)
A.pipes=()=>CR.pp||(CR.pp=(()=>{ const V=vol(60,34), Cn=R('#a8a49c'), In=R('#5a564e');
  for(const [x,y] of [[13,24],[35,24],[24,12]]){ V.ell(x,y,11,9,Cn,{g:'p'+x+y}); V.ell(x-3,y,6,7,In,{g:'h'+x+y,lift:-.2}); } return {c:V.done(false),ax:30,ay:33}; })());
// lều chú hề 7 màu (Làng Meme)
A.memeTent=s=>CR['mt'+s]||(CR['mt'+s]=(()=>{ const V=vol(48,46), C=['#e8202a','#f2e23a','#2aa83a','#2a6ae8','#ff8a1a','#8a3ab0'];
  for(let i=0;i<6;i++){ const x0=4+i*6.7; V.poly([[x0,44],[x0+6.7,44],[24,6]],R(C[(i+s)%6]),{n:[-.3+i*.12,-.2,.93],g:'s'+i}); }
  V.poly([[19,44],[29,44],[26,30],[22,30]],R('#2a1a2a'),{g:'door'}); V.tube([[24,6],[24,1]],[.8,.6],R('#8a8478'),{g:'pole'}); V.poly([[24,1],[31,3],[24,5]],R(C[s%6]),{g:'flag'});
  return {c:V.done(false),ax:24,ay:45}; })());
// quầy vé Làng Meme: quầy gỗ sọc đỏ trắng, mái bạt, bảng VE 1 TRIEU
A.memeBooth=()=>CR.mb||(CR.mb=(()=>{ const V=vol(40,42), Wd=R('#a8743e');
  V.poly([[4,40],[36,40],[36,22],[4,22]],Wd,{n:[0,-.2,.98],g:'base'}); for(let i=0;i<4;i++) V.rect(6+i*8,24,4,15,i%2?'#f4f4f2':'#e8302a');
  for(let i=0;i<5;i++) V.poly([[2+i*7.2,14],[9.2+i*7.2,14],[5.6+i*7.2,20]],R(i%2?'#f4f4f2':'#e8302a'),{g:'f'+i}); V.poly([[1,14],[39,14],[34,4],[6,4]],R('#e8302a'),{n:[0,-.5,.87],g:'roof'});
  const c=V.done(false); tag(c,'VE MEME',20,16,'#ffd84a'); return {c,ax:20,ay:41}; })());
// đoạn Tường Maria: khối đá xám cao có mép vỡ
A.wallMaria=s=>CR['wm'+s]||(CR['wm'+s]=(()=>{ const V=vol(40,52), St=R('#9a948a'), Sd=R('#7a7468');
  V.poly([[2,51],[38,51],[38,10+s%3*2],[30,6],[22,9],[14,4],[6,8],[2,12]],St,{n:[-.2,-.2,.96],g:'w'}); for(let y=16;y<50;y+=8){ V.line(2,y,38,y,'#6a6458'); for(let x=(y/8%2)*6+4;x<38;x+=12) V.line(x,y,x,y+8,'#6a6458'); }
  V.poly([[26,51],[38,51],[38,30],[30,26]],Sd,{g:'sh'}); return {c:V.done(false),ax:20,ay:51}; })());
// cây chết cong queo (Rừng Tiếng Hét)
A.deadTree=s=>CR['dt'+s]||(CR['dt'+s]=(()=>{ const V=vol(36,48), Bk=R('#4a3a3a');
  V.tube([[18,47],[17,30],[19,18]],[3.4,2.6,2],Bk,{g:'t'}); V.tube([[17,30],[9,22],[5,14]],[1.8,1.4,1],Bk,{g:'b1'}); V.tube([[19,22],[27,14],[31,8]],[1.6,1.2,.9],Bk,{g:'b2'}); V.tube([[19,18],[20,8],[17,3]],[1.4,1,.8],Bk,{g:'b3'});
  if(s%2) V.tube([[9,22],[4,24]],[1,.7],Bk,{g:'b4'}); return {c:V.done(false),ax:18,ay:47}; })());
// cổng ra trong Làng Meme: vòng xoáy cầu vồng
A.memePortal=f=>CR['mp'+f]||(CR['mp'+f]=(()=>{ const V=vol(30,34); const C=['#e8202a','#f2e23a','#2aa83a','#2a6ae8','#8a3ab0'];
  for(let i=0;i<5;i++) V.ell(15,17,13-i*2.4,15-i*2.8,R(C[(i+f)%5]),{g:'r'+i,lift:.05*i}); return {c:V.done(false,{glow:'rgba(255,255,255,.35)',gr:3}),ax:15,ay:33}; })());

/* ======================= icon Huy Hiệu Pepe ======================= */
const oldIcon=A.icon; let BADGE=null;
A.icon=function(name,scale=1){ if(name!=='pepe_badge') return oldIcon(name,scale);
  if(!BADGE){ const V=vol(14,14); V.ell(7,7,6,6,R('#f2c43a'),{g:'rim'}); V.ell(7,7.5,4.4,3.6,R('#5aa83a'),{g:'f',lift:.2}); V.px(5,6,WH).px(9,6,WH).px(5,7,K).px(9,7,K); V.line(5,9.5,9,9.5,'#a8583a');
    for(let i=0;i<3;i++) V.px(5+i*2,2,['#e8202a','#2aa83a','#2a6ae8'][i]); BADGE=V.done(false); }
  if(scale===1) return BADGE; const s=A.cv(14*scale,14*scale), g=s.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(BADGE,0,0,s.width,s.height); return s; };
})();
