/* Chan City — rừng quái MU: 9 loài quái (Slime Bí Ngô, Bọ Cạp Tím, Pháp Sư Đen, Người Sói, Bóng Ma Hư Không, Quỷ Khổng Lồ, Người Đá Cổ, Linh Hồn Sọ Hươu, Chó Ba Đầu)
   vẽ bằng khối có đổ bóng (A.vol của art13), nhìn nghiêng quay phải; mỗi loài 3 khung: 0 / 1 đứng – bước (nhún, chân so le), 2 vung đòn; bản chớp trắng khi trúng đòn.
   Kèm nền 4 khu rừng mới (1 rừng đêm · 2 đầm rêu · 3 đất đá · 4 đất cháy, z vũng nham thạch), đồ trang trí (pha lê, cột sọ, đống xương, tháp pháp sư, cổng địa ngục),
   quầy Phù Thuỷ Cường Hoá, icon Ngọc Cường Hoá (thường: pha lê xanh · huyền thoại: vàng) và icon 9 chiến lợi phẩm. */
(function(){
const A=ART, T=A.T, vol=A.vol, TE=A.TILE_EXT, hash=A.hash;
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
// dải 4 tông từ 1 màu gốc: sáng → gốc → tối → tối nhất
const R=c=>{ const b=hx(c); return [mix(b,[255,252,240],.5),b,mix(b,[20,10,50],.34),mix(b,[10,5,30],.62)].map(v=>[...v,255]); };
const K='#1c1516';

/* ======================= 9 loài quái ======================= */
const MOB={};
// Slime Bí Ngô: quả bí dẹt có múi, cuống xanh, mắt mồm khoét (lõi lửa vàng), nhún dẹt / vươn cao, lúc đánh bật lên há miệng
MOB.slime={w:28,h:24,ax:14,ay:22,draw(V,f){ const Or=R('#ff8a24'), Dk=R('#c8501a'), St=R('#5a9a2a'), sq=[0,1,-1][f], lift=f===2?3:0, cy=15-lift;
  V.ell(14,21,12.5+sq,2.2,Dk,{g:'goo',flat:.5}); for(const [x,h] of [[5,2],[11,3],[19,2.5],[23,1.5]]) V.tube([[x,cy+4],[x,cy+4+h]],[1.4,1],Dk,{g:'drip'+x});
  V.ell(14,cy,11+sq,7.2-sq*.6,Or); for(const dx of [-6,0,6]) V.ell(14+dx,cy+.3,3.4,6.4-sq*.5,dx?Dk:Or,{g:'rib'+dx,lift:dx?0:.12});
  V.tube([[14,cy-6.5],[15.5,cy-10]],[1.6,1.1],St); V.ell(17.5,cy-9.2,2.2,1.1,R('#7ac83a'));
  V.poly([[8,cy-2.5],[12,cy-1.5],[9,cy+.5]],[[255,216,74,255],[255,216,74,255],[230,150,30,255],[200,110,20,255]],{n:[0,0,1]});
  V.poly([[20,cy-2.5],[16,cy-1.5],[19,cy+.5]],[[255,216,74,255],[255,216,74,255],[230,150,30,255],[200,110,20,255]],{n:[0,0,1]});
  const mo=f===2?2:0; V.poly([[9,cy+2.5],[19,cy+2.5],[17,cy+4.5+mo],[15,cy+3.4],[13,cy+4.5+mo],[11,cy+3.4]],[[255,216,74,255],[255,200,60,255],[230,150,30,255],[200,110,20,255]],{n:[0,0,1]});
  V.px(8,cy-5,'#fff3d0').px(9,cy-6,'#fff3d0'); }};
// Bọ Cạp Tím: thân đốt tím, 3 cặp chân, càng to phía trước, đuôi cong qua lưng ngòi hồng; lúc đánh đuôi bổ tới trước
MOB.scorpion={w:38,h:28,ax:18,ay:25,draw(V,f){ const Pu=R('#6a5aa8'), Dk=R('#463a7a'), Sg=R('#d84ac8'), ph=f===1?1:0;
  for(let i=0;i<3;i++){ const x=10+i*5, s=(i+ph)%2?1.5:-1.5; V.tube([[x,20],[x-2+s,23],[x-3+s,25]],[1.2,1,.8],Dk,{g:'legb'+i}); }
  const tail=f===2?[[8,19],[5,13],[8,7],[15,5],[21,7]]:[[8,19],[4,14],[5,8],[10,4],[15,5]], tr=[3.4,3.1,2.7,2.3,1.9];
  V.tube(tail,tr,Pu,{g:'tail'}); const tip=tail[tail.length-1]; V.tube([tip,[tip[0]+3,tip[1]+(f===2?4:3)]],[1.6,.4],Sg);
  V.ell(15,19,8,4.2,Pu); V.ell(21,18.5,4.2,3.6,Pu,{g:'head'}); for(let i=0;i<4;i++) V.line(10+i*2.5,16,10+i*2.5,20,'#3a2e66');
  const cl=f===2?3:0; V.tube([[22,19],[27+cl,17],[30+cl,19]],[1.7,1.5,1.4],Pu,{g:'arm'}); V.ell(31+cl,18.5,3,2.4,Pu,{g:'claw'}); V.poly([[32+cl,16],[36+cl,15.5],[34+cl,18]],Dk);
  for(let i=0;i<3;i++){ const x=12+i*5, s=(i+ph)%2?-1.5:1.5; V.tube([[x,21],[x+1+s,24],[x+2+s,26]],[1.3,1.1,.9],Pu,{g:'legf'+i}); }
  V.px(22,17,K).px(24,17,K).px(23,16,'#c8b8ff'); }};
// Pháp Sư Đen: áo choàng xanh lam, nón rơm nhọn gập vành rộng, mặt đen chỉ thấy 2 mắt vàng; lúc đánh giơ tay phóng tia lửa
MOB.mage={w:28,h:34,ax:13,ay:32,draw(V,f){ const Bl=R('#2a5ab8'), Dk=R('#1a3a7a'), Hat=R('#e8a830'), HD=R('#a87020'), b=f===1?1:0;
  V.poly([[6,30],[20,30],[18,16+b],[8,16+b]],Bl,{n:[-.3,-.2,.93]}); V.poly([[13,30],[20,30],[18,16+b],[15,17+b]],Dk,{n:[.3,-.1,.95],g:'fold'});
  V.line(9,22,12,29,'#162a5a').line(16,20,18,28,'#162a5a'); V.rect(7,29,13,2,'#162a5a');
  V.ell(13,15+b,5.5,4.5,R('#1a1622'),{g:'face'});
  V.ell(13,11+b,10.5,2.6,Hat,{g:'brim'}); V.poly([[7,11+b],[19,11+b],[17,5+b],[20,1+b],[13,4+b],[9,6+b]],Hat,{n:[-.35,-.3,.89],g:'cone'}); V.poly([[15,10+b],[19,11+b],[17,5+b],[20,1+b],[16,5+b]],HD,{g:'cone2'});
  V.rect(10,14+b,2,2,'#ffd84a').rect(15,14+b,2,2,'#ffd84a');
  const hy=f===2?16:24; V.ell(f===2?22:20,hy,2.2,2.2,R('#e8a830'),{g:'hand'}); V.ell(6,24,2,2,R('#e8a830'),{g:'hand2'});
  if(f===2){ V.ell(25,13,2.6,2.6,[[255,255,230,255],[255,216,74,255],[255,140,40,255],[200,80,20,255]]); V.px(25,10,'#fff3b0').px(27,12,'#fff3b0'); } }};
// Người Sói: lông xám than, áo vải đỏ nâu, đầu sói mõm dài tai nhọn mắt đỏ; bước chân so le, lúc đánh vung vuốt
MOB.wolf={w:32,h:40,ax:15,ay:38,draw(V,f){ const Fu=R('#4a4a52'), FD=R('#2c2c34'), Sh=R('#8a3a2a'), st=f===1?2:0;
  V.tube([[12,27],[11-st,33],[10-st,37]],[3,2.6,2.2],FD,{g:'lb'}); V.ell(9-st,37.5,3,1.5,FD,{g:'fb'});
  V.tube([[10,18],[6,22],[4,26]],[2.4,2.4,2],FD,{g:'tail',lift:-.1});
  V.ell(15,22,7,7.5,Sh,{g:'torso'}); V.ell(15,28,6,3,Fu,{g:'hip'}); V.line(12,17,18,27,'#5a2018'); V.rect(10,26,10,1,'#3a1a10');
  V.tube([[17,27],[18+st,33],[19+st,37]],[3,2.6,2.2],Fu,{g:'lf'}); V.ell(20+st,37.5,3,1.5,Fu,{g:'ff'});
  V.ell(16,15,5,4.5,Fu,{g:'neck'}); V.ell(18,10,5.2,4.6,Fu,{g:'head'}); V.tube([[20,11],[26,12.5]],[2.8,1.8],Fu,{g:'snout'}); V.px(26,12,K).px(27,12,K);
  V.tube([[15,7],[14,1]],[1.8,.4],Fu,{g:'ear1'}); V.tube([[19,6.5],[20,1]],[1.8,.4],Fu,{g:'ear2'}); V.px(15,3,'#8a4a4a');
  V.rect(19,9,2,1,'#ff3a2a').px(21,9,'#ffb0a0'); V.line(22,14,25,14,'#e8e4dc');
  const ar=f===2?[[19,19],[24,14],[28,11]]:[[19,19],[22,24],[22,28]]; V.tube(ar,[2.2,2,1.8],Fu,{g:'arm'}); const h=ar[2]; for(let i=-1;i<=1;i++) V.line(h[0],h[1],h[0]+2,h[1]+i*1.5+(f===2?-1:2),'#e8e4dc'); }};
// Bóng Ma Hư Không: áo choàng mũ trùm xám tối, mặt đen hư không 2 mắt trắng, 2 tay giáp xám lơ lửng hai bên, vạt áo rách; lơ lửng nhấp nhô
MOB.wraith={w:34,h:40,ax:17,ay:38,draw(V,f){ const Cl=R('#4a4a52'), CD=R('#2c2c34'), Ga=R('#6a6e74'), fl=[0,2,-1][f];
  V.poly([[11,14+fl],[23,14+fl],[25,30+fl],[22,34+fl],[20,31+fl],[17,35+fl],[14,31+fl],[12,34+fl],[9,30+fl]],Cl,{n:[-.2,-.2,.96]});
  V.poly([[17,15+fl],[23,14+fl],[25,30+fl],[22,34+fl],[20,31+fl],[17,35+fl]],CD,{g:'fold'}); V.rect(16,18+fl,2,10,'#22222a');
  V.ell(17,10+fl,6.5,6.5,Cl,{g:'hood'}); V.ell(17,11+fl,4.2,4.4,R('#0a0a10'),{g:'void'}); V.rect(14,10+fl,2,2,'#f4f4f8').rect(19,10+fl,2,2,'#f4f4f8');
  const ga=f===2?[[28,12],[4,18]]:[[29,22],[5,22]]; for(const [x,y] of ga){ V.ell(x,y+fl,3.4,3,Ga,{g:'g'+x}); V.rect(x-2,y+fl+2,1,2,'#4a4e54').rect(x+1,y+fl+2,1,2,'#4a4e54'); }
  if(f===2){ V.ell(31,10+fl,2,2,[[230,240,255,255],[180,200,255,255],[120,140,220,255],[70,80,160,255]]); } }};
// Quỷ Khổng Lồ: thân to xanh lam xanh lục, bụng sáng, đầu nhỏ lông mày rậm, khố da nâu, cầm chuỳ gỗ; lúc đánh giơ chuỳ qua đầu
MOB.ogre={w:46,h:50,ax:22,ay:48,draw(V,f){ const Gr=R('#3a8a7a'), GL=R('#6ac89a'), GD=R('#2a5a6a'), Wd=R('#8a5a2a'), st=f===1?1.5:0;
  V.tube([[16,36],[15-st,44],[14-st,47]],[4.4,4,3.6],GD,{g:'lb'}); V.ell(13-st,47.5,4.2,1.8,GD,{g:'fb'});
  if(f!==2){ V.tube([[9,30],[5,38],[6,44]],[3.4,3.2,3],GD,{g:'armb'}); }
  V.ell(22,27,13,13,Gr,{g:'body'}); V.ell(24,31,8.5,7.5,GL,{g:'belly',lift:.1}); V.ell(14,20,6.5,5.5,Gr,{g:'sh1'}); V.ell(30,20,6.5,5.5,Gr,{g:'sh2'});
  V.poly([[12,36],[33,36],[32,42],[27,40],[23,44],[19,40],[13,42]],Wd,{n:[-.2,-.2,.95]});
  V.tube([[27,36],[29+st,44],[30+st,47]],[4.6,4.2,3.8],Gr,{g:'lf'}); V.ell(31+st,47.5,4.4,1.8,Gr,{g:'ff'});
  V.ell(23,12,6.5,6,Gr,{g:'head'}); V.rect(19,9,9,2,'#1e4a50'); V.rect(21,11,2,2,'#f4f4f8').rect(26,11,2,2,'#f4f4f8').px(22,12,K).px(27,12,K); V.line(21,16,27,16,'#1e4a50'); V.px(20,15,'#d8c8a0');
  const club=f===2?[[34,18],[34,8],[30,1]]:[[35,28],[40,36],[42,42]], ar=f===2?[[30,22],[34,14]]:[[31,24],[35,30]];
  V.tube(ar,[3.6,3.2],Gr,{g:'armf'}); V.tube(club,[1.6,3.2,4.2],Wd,{g:'club'}); for(const [x,y] of [[club[2][0]-1,club[2][1]],[club[1][0]+1,club[1][1]+1]]) V.px(x,y,'#5a3a1a'); }};
// Người Đá Cổ: khối đá xếp (vai tảng, đầu khối vuông mắt cam), tay dài chạm gối, rêu xanh trên vai; lúc đánh 2 tay nện xuống
MOB.golem={w:48,h:48,ax:24,ay:46,draw(V,f){ const Sn=R('#8a8478'), SD=R('#5a5450'), SL=R('#b8b0a0'), Ms=R('#5a8a3a'), st=f===1?1:0, up=f===2?-8:0;
  V.tube([[17,36],[16,45]],[4.4,4.6],SD,{g:'lb'}); V.tube([[31,36],[32+st,45]],[4.6,4.8],Sn,{g:'lf'});
  V.ell(24,27,11,10,Sn,{g:'torso'}); V.poly([[15,28],[33,28],[31,34],[17,34]],SD,{g:'belt'}); V.rect(17,31,14,1,'#3a3430');
  V.ell(13,18+up*.2,7,6.5,SL,{g:'sh1'}); V.ell(35,18+up*.2,7,6.5,Sn,{g:'sh2'}); V.ell(12,14+up*.2,4,1.6,Ms,{g:'moss1'}); V.ell(36,14.5+up*.2,3,1.3,Ms,{g:'moss2'});
  V.poly([[19,6],[30,6],[31,15],[18,15]],Sn,{n:[-.3,-.35,.88],g:'head'}); V.rect(21,10,3,2,'#ff9a4a').rect(26,10,3,2,'#ff9a4a').rect(21,13,8,1,'#3a3430');
  for(const [x0,y0] of [[9,22],[39,22]]){ const L=x0<20, pts=f===2?[[x0,y0-4],[x0+(L?2:-2),y0-14],[x0+(L?6:-6),y0-18]]:[[x0,y0],[x0+(L?-1:1),y0+9],[x0+(L?0:0),y0+15]]; V.tube(pts,[3.6,3.4,3.2],L?SL:Sn,{g:'arm'+x0}); V.ell(pts[2][0],pts[2][1],4,3.4,L?SL:SD,{g:'fist'+x0}); }
  for(const [x,y] of [[20,22],[27,25],[23,30]]) V.px(x,y,'#3a3430').px(x+1,y,'#3a3430'); }};
// Linh Hồn Sọ Hươu: sọ hươu trắng xương, gạc to, mắt xanh lục rực, vệt đỏ, thân là bóng tối vụn xanh rêu; mặt dây ngọc lục; lơ lửng
MOB.wendigo={w:38,h:44,ax:19,ay:42,draw(V,f){ const Bo=R('#e8dcc0'), BD=R('#b8a888'), Sh=R('#22303a'), SM=R('#2a5a6a'), fl=[0,1.5,-1][f];
  for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, r=8+hash(i,3,7)*3; V.ell(19+Math.cos(a)*r*.75,28+fl+Math.sin(a)*r*.6,3.2,3.6,i%3?Sh:SM,{g:'sh'+i}); }
  V.ell(19,28+fl,9,9.5,Sh,{g:'core'}); V.poly([[12,34+fl],[16,41+fl],[19,37+fl],[22,42+fl],[26,34+fl]],Sh,{g:'tail'});
  for(const s of [-1,1]){ const bx=19+s*5; V.tube([[bx,10+fl],[bx+s*4,4+fl],[bx+s*9,2+fl]],[1.6,1.3,.8],Bo,{g:'ant'+s}); V.tube([[bx+s*4,4+fl],[bx+s*5,-1+fl]],[1,.5],Bo,{g:'ant2'+s}); V.tube([[bx+s*7,3+fl],[bx+s*10,6+fl]],[.9,.4],Bo,{g:'ant3'+s}); }
  V.poly([[13,10+fl],[25,10+fl],[24,17+fl],[21,23+fl],[17,23+fl],[14,17+fl]],Bo,{n:[-.25,-.3,.92],g:'skull'}); V.poly([[17,18+fl],[21,18+fl],[20,23+fl],[18,23+fl]],BD,{g:'nose'});
  V.rect(15,13+fl,3,2,K).rect(21,13+fl,3,2,K).px(16,13+fl,'#7aff3a').px(22,13+fl,'#7aff3a'); V.px(14,16+fl,'#c8302a').px(24,16+fl,'#c8302a').rect(15,17+fl,1,1,'#c8302a').rect(23,17+fl,1,1,'#c8302a');
  V.line(14,24+fl,24,24+fl,'#a8202a'); V.poly([[17,25+fl],[21,25+fl],[19,29+fl]],[[200,255,170,255],[90,220,60,255],[40,160,40,255],[20,100,30,255]],{g:'gem'});
  if(f===2){ for(const [x,y] of [[31,20],[33,24]]) V.ell(x,y+fl,1.6,1.6,[[220,255,200,255],[120,255,90,255],[60,190,50,255],[30,120,30,255]]); } }};
// Chó Ba Đầu: thân cơ bắp đỏ thẫm, 3 đầu sừng vàng nâu mắt đỏ, vòng cổ gai sắt, bụng nâu nhạt; bước chân so le, lúc đánh 3 đầu cùng chồm tới
MOB.cerberus={w:52,h:42,ax:25,ay:40,draw(V,f){ const Rd=R('#8a2a2a'), RD=R('#5a1a1e'), Bl=R('#b8905a'), Hn=R('#c8a070'), Mt=R('#7a7a84'), st=f===1?2:0, lu=f===2?3:0;
  V.tube([[12,28],[11-st,35],[11-st,39]],[3.6,3.2,3],RD,{g:'lb1'}); V.tube([[33,28],[34+st,35],[34+st,39]],[3.6,3.2,3],RD,{g:'lb2'});
  V.tube([[8,24],[3,20],[2,15]],[2.6,2.2,1.4],RD,{g:'tail'});
  V.ell(22,25,15,9,Rd,{g:'body'}); V.ell(25,29,9,4,Bl,{g:'belly',lift:.1});
  V.tube([[18,29],[17+st,35],[17+st,39]],[3.8,3.4,3.2],Rd,{g:'lf1'}); V.tube([[39,27],[40-st,34],[40-st,39]],[3.8,3.4,3.2],Rd,{g:'lf2'});
  for(const [x,y,s] of [[25,17,'b'],[34,14,'m'],[42,18,'f']]){ const X0=x+lu, D=s==='b'?RD:Rd; V.ell(X0,y,6,5.2,D,{g:'h'+s}); V.tube([[X0+3,y+1],[X0+8,y+2.5]],[3,2],D,{g:'sn'+s}); V.px(X0+8,y+2,K);
    V.tube([[X0-3,y-3],[X0-4,y-8]],[1.5,.4],Hn,{g:'hn1'+s}); V.tube([[X0+1,y-4],[X0+2,y-9]],[1.5,.4],Hn,{g:'hn2'+s}); V.rect(X0+1,y-1,2,2,'#ff2a2a').px(X0+2,y-1,'#ffb0b0');
    if(f===2) V.rect(X0+5,y+4,3,1,'#f4f4e8'); V.ell(X0-1,y+5,5,1.6,Mt,{g:'col'+s}); V.px(X0-4,y+4,'#c8c8d0').px(X0,y+4,'#c8c8d0').px(X0+3,y+5,'#c8c8d0'); } }};
const MC={};
// sprite quái: k loài, f khung (0, 1 đứng / bước, 2 vung đòn), hit = chớp trắng; neo ở chân giữa
A.mob=(k,f=0,hit=false)=>{ const D=MOB[k]; if(!D) return null; const key=k+f+(hit?'h':''); if(MC[key]) return MC[key]; const V=vol(D.w,D.h); D.draw(V,f%3); return MC[key]={c:V.done(hit),ax:D.ax,ay:D.ay}; };

/* ======================= nền 4 khu rừng mới ======================= */
for(const k of ['1','2','3','4']) A.WALKABLE.add(k);
// 1 rừng đêm: đất mùn tối, lá rụng nâu đỏ, rễ cây
TE['1']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#2a3a26'); for(let i=0;i<7;i++){ const h=hash(tx*7+i,ty,201), x=X+Math.floor(h*15), y=Y+Math.floor(hash(tx,ty*7+i,202)*15); P.rect(x,y,h<.3?2:1,1,h<.3?'#5a3a22':h<.6?'#34482e':'#22301e'); }
  if(hash(tx,ty,203)<.12){ const x=X+3+Math.floor(hash(tx,ty,204)*8); P.rect(x,Y+9,5,1,'#4a3020'); P.px(x+5,Y+10,'#4a3020'); } };
// 2 đầm rêu: bùn xanh rêu, vệt nước lấp loáng, cụm cỏ
TE['2']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#3a4a3a'); for(let i=0;i<6;i++){ const h=hash(tx*6+i,ty,211); P.px(X+Math.floor(h*16),Y+Math.floor(hash(tx,ty*6+i,212)*16),h<.5?'#4a5e44':'#2e3c30'); }
  if(hash(tx,ty,213)<.22){ const x=X+2+Math.floor(hash(tx,ty,214)*9), y=Y+3+Math.floor(hash(tx,ty,215)*9); P.rect(x,y,4,1,'#5a7a6a'); P.rect(x+1,y+1,2,1,'#4a6a5a'); }
  if(hash(tx,ty,216)<.1){ const x=X+5; P.rect(x,Y+8,1,4,'#6a8a3a'); P.rect(x+2,Y+9,1,3,'#6a8a3a'); } };
// 3 đất đá: nền xám nâu, sỏi đá rải, vết nứt
TE['3']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#7a7064'); for(let i=0;i<8;i++){ const h=hash(tx*8+i,ty,221), x=X+Math.floor(h*15), y=Y+Math.floor(hash(tx,ty*8+i,222)*15); P.rect(x,y,h<.25?2:1,h<.25?2:1,h<.4?'#9a9082':h<.7?'#6a6056':'#5a5248'); }
  if(hash(tx,ty,223)<.1) for(let i=0;i<5;i++) P.px(X+4+i,Y+6+(i%2),'#4a423a'); };
// 4 đất cháy: đen đỏ, khe nứt nham thạch phát sáng (đổi nhịp theo sóng nước)
TE['4']=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#2a1a1a'); for(let i=0;i<6;i++){ const h=hash(tx*6+i,ty,231); P.px(X+Math.floor(h*16),Y+Math.floor(hash(tx,ty*6+i,232)*16),h<.5?'#3a2420':'#1e1212'); }
  if(hash(tx,ty,233)<.3){ const x=X+2+Math.floor(hash(tx,ty,234)*8), y=Y+4+Math.floor(hash(tx,ty,235)*8), c=fr?'#ff7a2a':'#e8502a'; P.rect(x,y,3,1,c); P.px(x+3,y+1,c); P.px(x+4,y+1,'#a8301a'); } };
// z vũng nham thạch (không đi vào được): cam đỏ, bọt vàng nổi theo nhịp
TE.z=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,T,T,'#e8502a'); for(let i=0;i<5;i++){ const h=hash(tx*5+i,ty,241); P.rect(X+Math.floor(h*14),Y+Math.floor(hash(tx,ty*5+i,242)*14),2,1,(i+fr)%2?'#ffb03a':'#c8301a'); }
  if(hash(tx,ty,243+fr)<.4) P.rect(X+6,Y+6,2,2,'#ffe066');
  for(const [dx,dy,x,y,w,h] of [[0,-1,0,0,T,1],[0,1,0,T-1,T,1],[-1,0,0,0,1,T],[1,0,T-1,0,1,T]]) if(nb(dx,dy)!=='z') P.rect(X+x,Y+y,w,h,'#3a1a14'); };

/* ======================= đồ trang trí rừng ======================= */
const CR={};
// cụm pha lê nhọn (màu theo khu)
A.crystal=(col='#7fd8ff')=>CR['c'+col]||(CR['c'+col]=(()=>{ const V=vol(18,22), Rc=R(col); V.tube([[9,20],[9,4]],[3.2,.6],Rc,{g:'a'}); V.tube([[5,20],[3,10]],[2.2,.5],Rc,{g:'b'}); V.tube([[13,20],[15,11]],[2.4,.5],Rc,{g:'c'});
  V.ell(9,20,7,1.6,R('#4a4450'),{g:'base'}); V.px(8,7,'#ffffff').px(8,8,'#ffffff'); return {c:V.done(false),ax:9,ay:21}; })());
// cột sọ: cọc gỗ, sọ trâu sừng cong, dây treo lông vũ
A.skullTotem=()=>CR.st||(CR.st=(()=>{ const V=vol(20,34), W=R('#6a4a2a'), Bo=R('#e8dcc0'); V.tube([[10,33],[10,10]],[1.8,1.6],W); V.ell(10,10,5,4.2,Bo,{g:'sk'});
  V.tube([[6,8],[2,5],[2,1]],[1.4,1,.5],Bo,{g:'h1'}); V.tube([[14,8],[18,5],[18,1]],[1.4,1,.5],Bo,{g:'h2'}); V.rect(7,9,2,2,K).rect(11,9,2,2,K).rect(9,12,2,1,K);
  V.line(7,15,5,22,'#a8302a').line(13,15,15,22,'#a8302a'); V.ell(5,23,1.2,1.8,R('#d8d0b0')); V.ell(15,23,1.2,1.8,R('#d8d0b0')); return {c:V.done(false),ax:10,ay:33}; })());
// đống xương nằm đất (không chặn đường)
A.boneHeap=()=>CR.bh||(CR.bh=(()=>{ const V=vol(20,10), Bo=R('#e0d4b8'); V.tube([[3,7],[13,5]],[1,1],Bo,{g:'a'}); V.ell(3,7,1.4,1.4,Bo,{g:'a1'}); V.ell(13,5,1.4,1.4,Bo,{g:'a2'});
  V.tube([[8,8],[17,8]],[.9,.9],Bo,{g:'b'}); V.ell(15,5,3,2.4,Bo,{g:'sk'}); V.px(14,5,K).px(16,5,K); return {c:V.done(false),ax:10,ay:8}; })());
// tháp pháp sư đen: tháp đá tím nóc nhọn, cửa sổ vàng
A.mageTower=()=>CR.mt||(CR.mt=(()=>{ const V=vol(60,84), St=R('#4a4258'), SD=R('#2e2a3a'), Rf=R('#2a3a8a');
  V.poly([[14,82],[46,82],[42,30],[18,30]],St,{n:[-.3,-.2,.93]}); V.poly([[32,82],[46,82],[42,30],[34,30]],SD,{g:'side'}); for(let y=36;y<80;y+=7) V.line(17+(82-y)*.06,y,43-(82-y)*.06,y,'#26222e');
  V.poly([[12,32],[48,32],[30,2]],Rf,{n:[-.35,-.3,.89],g:'roof'}); V.poly([[30,32],[48,32],[30,2]],R('#1a2a6a'),{g:'roof2'});
  V.rect(26,64,8,18,'#1a1418').rect(27,65,6,1,'#3a3040'); for(const [x,y] of [[24,40],[33,40],[28,52]]){ V.rect(x,y,4,6,'#1a1418').rect(x+1,y+1,2,4,'#ffd84a'); }
  V.px(30,4,'#fff3b0'); return {c:V.done(false),ax:30,ay:82}; })());
// cổng địa ngục: 2 trụ đá sừng, vòm đá, lòng cổng xoáy lửa (2 khung)
A.hellGate=f=>CR['hg'+f]||(CR['hg'+f]=(()=>{ const V=vol(110,92), St=R('#3a2a2e'), SD=R('#241a1e'), Hn=R('#c8a070');
  V.ell(55,52,30,34,[[255,230,120,255],[255,140,40,255],[220,60,30,255],[120,20,20,255]],{g:'fire',flat:.3});
  for(let i=0;i<5;i++){ const a=(i/5+f*.1)*Math.PI*2; V.tube([[55,52],[55+Math.cos(a)*20,52+Math.sin(a)*24]],[4,1],[[255,240,160,255],[255,200,80,255],[255,120,40,255],[200,60,20,255]],{g:'sw'+i}); }
  for(const x of [16,94]){ V.tube([[x,90],[x,22]],[9,8],St,{g:'p'+x}); V.poly([[x-10,26],[x+10,26],[x+8,18],[x-8,18]],SD,{g:'cap'+x}); V.tube([[x,18],[x+(x<55?-6:6),8],[x+(x<55?-4:4),1]],[3,2,.6],Hn,{g:'hn'+x}); }
  V.tube([[16,22],[35,8],[55,4],[75,8],[94,22]],[6,6,6,6,6],St,{g:'arch'}); V.ell(55,8,7,6,R('#e8dcc0'),{g:'skull'}); V.rect(51,7,3,2,'#ff2a2a').rect(56,7,3,2,'#ff2a2a');
  return {c:V.done(false,{glow:'rgba(255,120,40,.35)',gr:3}),ax:55,ay:90}; })());
// biển tên quầy: nền tối rộng theo chữ, canh giữa ở cx
const tag=(g,s,cx,y,col)=>{ const w=A.textW(s), x=Math.round(cx-w/2); g.fillStyle=K; g.fillRect(x-2,y,w+4,6); A.drawText(g,s,x,y,col); };
// quầy Phù Thuỷ Cường Hoá: lều vải tím sao vàng, bàn đá có cầu pha lê xanh và ngọc
A.enchantStall=f=>CR['es'+f]||(CR['es'+f]=(()=>{ const V=vol(60,52), Cl=R('#6a3ab8'), CD=R('#3a1a7a'), St=R('#5a5466'), Cr=R(f?'#9af0ff':'#6ad0ff');
  V.poly([[4,22],[56,22],[48,4],[12,4]],Cl,{n:[-.25,-.35,.9]}); for(let i=0;i<5;i++) V.poly([[6+i*10,22],[16+i*10,22],[11+i*10,27]],i%2?CD:Cl,{g:'fr'+i});
  V.tube([[8,22],[8,48]],[1.6,1.6],R('#5a3a22'),{g:'p1'}); V.tube([[52,22],[52,48]],[1.6,1.6],R('#5a3a22'),{g:'p2'});
  V.poly([[14,36],[46,36],[44,48],[16,48]],St,{g:'tb'}); V.rect(14,36,32,2,'#7a7488');
  V.ell(30,30,6,6,Cr,{g:'orb',lift:.15}); V.ell(30,36,5,1.6,R('#a88a3a'),{g:'stand'}); V.px(28,27,'#ffffff').px(29,26,'#ffffff');
  for(const [x,c] of [[20,'#7fe8ff'],[40,'#ffd84a']]){ V.poly([[x-2,35],[x+2,35],[x+3,32],[x,29],[x-3,32]],R(c),{g:'gem'+x}); }
  for(const [x,y] of [[18,10],[30,8],[42,12],[24,16],[38,17]]) V.px(x,y,'#ffd84a');
  const s=V.done(false,{glow:f?'rgba(140,220,255,.45)':'rgba(140,220,255,.25)',gr:2}), g=s.getContext('2d'); tag(g,'CUONG HOA',30,0,'#c8a0ff'); return {c:s,ax:30,ay:48}; })());

/* ======================= giày MU (Tiệm Giày Lướt Gió) ======================= */
// giày thể thao nhìn nghiêng quay phải: đế, thân, mũi, mảng phối màu, dây, cổ giày (hi = cổ cao)
function sneaker(V,o){ const U=R(o.up), Ac=R(o.ac), So=R(o.sole), top=o.hi?4:10;
  V.poly([[3,20],[29,20],[30,17],[3,17]],So,{n:[0,-.3,.95],g:'sole'}); V.line(3,18,29,18,o.line||'#ffffff');
  V.poly([[4,17],[29,17],[28,14],[21,12],[15,top+1],[10,top],[4,top+1]],U,{n:[-.3,-.35,.88],g:'up'}); V.ell(26,15,4,2.4,U,{g:'toe'});
  V.poly(o.panel||[[8,16],[19,16],[13,11]],Ac,{g:'ac'}); for(let i=0;i<4;i++) V.line(15+i*2,top+3+i*1.6,17+i*2,top+2+i*1.6,o.lace||'#f4f4f4');
  V.ell(7,top+1,3.2,1.5,R(o.col||o.ac),{g:'col'}); }
const SHOE={
  sh_flip:V=>{ for(const [x,r] of [[10,-.3],[22,.3]]){ V.ell(x,12,5,9,R('#f0a030'),{g:'s'+x}); V.line(x-4,6,x,10,'#2ab8d8').line(x+4,6,x,10,'#2ab8d8').line(x,10,x,4,'#2ab8d8'); V.px(x+2,4,'#fff3b0'); } },
  sh_heel:V=>{ V.poly([[4,17],[20,17],[26,10],[28,10],[28,13],[22,19],[4,19]],R('#2a5ad8'),{g:'b'}); V.ell(7,17,4,2,R('#e8b040'),{g:'toe'}); V.tube([[27,13],[28,21]],[1.2,.8],R('#2a5ad8'),{g:'heel'}); V.line(9,15,22,12,'#e8b040'); },
  sh_rain:V=>{ for(const x of [9,19]){ V.poly([[x-3,3],[x+4,3],[x+4,19],[x+9,19],[x+9,22],[x-4,22],[x-4,15],[x-3,15]],R(x<10?'#4aa82a':'#6ac83a'),{g:'b'+x}); V.rect(x-3,6,7,2,'#ff6a1a'); V.rect(x-4,21,13,1,'#6a4a2a'); } },
  sh_blue:V=>sneaker(V,{up:'#3a6a90',ac:'#c8582a',sole:'#a8d4ee',line:'#d8eef8'}),
  sh_black:V=>sneaker(V,{up:'#1e1e22',ac:'#ffffff',sole:'#8a5a3a',line:'#5a3a22',panel:[[16,16],[27,16],[27,13],[19,12]],col:'#c87a2a'}),
  sh_lolita:V=>{ for(const x of [9,22]){ V.ell(x,16,6,4.5,R('#7a3a9a'),{g:'b'+x}); V.ell(x,14,3.5,2.2,R('#f4f0f4'),{g:'h'+x}); V.ell(x,9,3.2,2.2,R('#f05aa8'),{g:'bow'+x}); V.line(x-2,7,x-2,4,'#7a3a9a').line(x+2,7,x+2,4,'#7a3a9a'); } },
  sh_work:V=>sneaker(V,{up:'#8a3a1a',ac:'#a8601a',sole:'#5a3a1a',hi:1,col:'#c88a3a',line:'#3a2010',lace:'#1c1516'}),
  sh_timber:V=>sneaker(V,{up:'#f0c070',ac:'#d87a4a',sole:'#3a2a3a',hi:1,col:'#2a1a2a',line:'#5a4a5a',lace:'#5a3a22'}),
  sh_fire:V=>sneaker(V,{up:'#e8502a',ac:'#f0c030',sole:'#1a6a7a',line:'#0a3a4a',lace:'#0a3a3a'}),
  sh_pinkhi:V=>sneaker(V,{up:'#c8306a',ac:'#5a1a5a',sole:'#f4d4a8',hi:1,col:'#f0a070',lace:'#f4e4d0'}),
  sh_jordan:V=>sneaker(V,{up:'#f4a050',ac:'#5a6ad8',sole:'#fff3e0',hi:1,col:'#e8702a',panel:[[7,16],[16,16],[16,9],[9,8]]}),
  sh_runner:V=>{ sneaker(V,{up:'#f0d4b8',ac:'#2aa88a',sole:'#2a4a8a',line:'#a8d4ee',lace:'#8a3ac8'}); V.tube([[6,9],[6,21]],[2.4,2.4],R('#d82a2a'),{g:'bottle'}); V.rect(5,13,2,1,'#ffffff').rect(5,16,2,1,'#ffffff'); },
  sh_rollor:V=>{ sneaker(V,{up:'#f8a850',ac:'#ff5aa8',sole:'#e8601a',hi:1,col:'#fff3a0',lace:'#7ff8ff'}); for(const x of [8,25]) V.ell(x,22,2.6,2.2,R('#ff7ab8'),{g:'w'+x}); },
  sh_rollbl:V=>{ sneaker(V,{up:'#6ad8f8',ac:'#3a5ad8',sole:'#6a1a1a',hi:1,col:'#a8f0ff',lace:'#c86ad8'}); for(const x of [8,25]) V.ell(x,22,2.6,2.2,R('#5ad8a0'),{g:'w'+x}); },
  sh_skate:V=>{ V.poly([[2,17],[8,10],[30,4],[31,7],[26,12],[4,20]],R('#f4b030'),{n:[-.3,-.35,.88],g:'deck'}); V.line(5,17,28,7,'#d8301a'); V.ell(16,11,3,2,R('#8a5ad8'),{g:'logo'});
    for(const [x,y] of [[7,21],[13,19],[25,12],[29,10]]) V.ell(x,y,2,1.8,R('#b88af0'),{g:'w'+x}); }};
const SHC={};
// hình giày 32×24 (bảng Tiệm Giày, ô Giày trong tủ đồ)
A.muShoe=k=>SHC[k]||(SHC[k]=SHOE[k]?(()=>{ const V=vol(32,24); SHOE[k](V); return V.done(false); })():null);
// dưới chân nhân vật: ván trượt (nhìn nghiêng) / bánh patin
A.footGear=(k,fr=0)=>SHC['fg'+k+fr]||(SHC['fg'+k+fr]=(()=>{ if(k==='sh_skate'){ const V=vol(28,8); V.poly([[1,3],[27,3],[26,5],[2,5]],R('#f4b030'),{n:[0,-.6,.8]}); V.line(2,4,26,4,'#d8301a');
    for(const x of [6,21]) V.ell(x,6.5,1.8,1.6,R('#b88af0'),{g:'w'+x}); return {c:V.done(false),ax:14,ay:4}; }
  if(k==='sh_rollor'||k==='sh_rollbl'){ const V=vol(18,5), c=k==='sh_rollor'?'#ff7ab8':'#5ad8a0'; for(const x of [3,7,11,15]) V.ell(x,2.5,1.6,1.6,R(c),{g:'w'+x}); return {c:V.done(false),ax:9,ay:1}; } return null; })());
// quầy Tiệm Giày: mái sọc xanh trắng, kệ 3 đôi giày, biển tên
A.shoeStall=()=>CR.ss||(CR.ss=(()=>{ const V=vol(60,50); for(let i=0;i<8;i++) V.poly([[2+i*7,18],[9+i*7,18],[9+i*7,6],[2+i*7,6]],R(i%2?'#f4f4f8':'#2a8ad8'),{n:[-.2,-.4,.9],g:'aw'+i});
  for(let i=0;i<8;i++) V.ell(5.5+i*7,18,3.5,2,R(i%2?'#f4f4f8':'#2a8ad8'),{g:'sc'+i});
  V.tube([[5,19],[5,48]],[1.5,1.5],R('#6a4a2a'),{g:'p1'}); V.tube([[55,19],[55,48]],[1.5,1.5],R('#6a4a2a'),{g:'p2'}); V.poly([[8,30],[52,30],[52,46],[8,46]],R('#8a6a4a'),{g:'shelf'}); V.line(8,38,52,38,'#5a3a22');
  const c=V.done(false), g=c.getContext('2d'); g.imageSmoothingEnabled=false; for(const [k,x,y] of [['sh_skate',10,21],['sh_jordan',28,22],['sh_rollbl',12,32],['sh_fire',30,32]]){ const sh=A.muShoe(k); g.drawImage(sh,x,y,20,15); }
  tag(g,'TIEM GIAY',30,0,'#7fd8ff'); return {c,ax:30,ay:48}; })());

/* ======================= Lính Cát ở MU: Trung tâm + Đền Lính Cát Huyền Thoại ======================= */
// quầy Trung tâm Lính Cát: mái đỏ trắng, biển bóng cát, máy hồi máu trên quầy
A.lcCenterStall=()=>CR.lcc||(CR.lcc=(()=>{ const V=vol(60,50); for(let i=0;i<8;i++) V.poly([[2+i*7,18],[9+i*7,18],[9+i*7,6],[2+i*7,6]],R(i%2?'#f4f4f8':'#e8402a'),{n:[-.2,-.4,.9],g:'aw'+i});
  for(let i=0;i<8;i++) V.ell(5.5+i*7,18,3.5,2,R(i%2?'#f4f4f8':'#e8402a'),{g:'sc'+i}); V.tube([[5,19],[5,48]],[1.5,1.5],R('#6a4a2a'),{g:'p1'}); V.tube([[55,19],[55,48]],[1.5,1.5],R('#6a4a2a'),{g:'p2'});
  V.poly([[8,32],[52,32],[52,46],[8,46]],R('#f0ece4'),{g:'desk'}); V.rect(8,32,44,2,'#c8302a'); V.poly([[30,24],[44,24],[44,32],[30,32]],R('#8ac8e8'),{g:'heal'});
  for(let i=0;i<3;i++) V.ell(33+i*4.5,27.5,1.8,1.8,R(['#ff6a8a','#ffd84a','#7fe8ff'][i]),{g:'b'+i}); V.ell(17,26,6,6,R('#f4f4f8'),{g:'ball'}); V.poly([[11,26],[23,26],[23,20],[11,20]],R('#e8402a'),{g:'ballt'}); V.rect(11,25,12,2,K); V.ell(17,26,2,2,R('#ffffff'),{g:'btn'});
  const c=V.done(false), g=c.getContext('2d'); tag(g,'LINH CAT',30,0,'#ff8ab8'); return {c,ax:30,ay:48}; })());
// Đền Lính Cát Huyền Thoại: nền đá trắng 3 bậc, mái cong vàng, 3 bệ đặt 3 ngọc quý (Ước Nguyện xanh, Tâm Linh vàng, Hỗn Nguyên hồng) toả sáng theo nhịp
A.lcTemple=f=>CR['lt'+f]||(CR['lt'+f]=(()=>{ const V=vol(80,70), St=R('#e8e4dc'), SD=R('#b8b0a0'), Go=R('#f0c040'), Rd=R('#c8302a');
  for(let i=0;i<3;i++) V.poly([[6+i*4,68-i*4],[74-i*4,68-i*4],[74-i*4,64-i*4],[6+i*4,64-i*4]],i%2?SD:St,{g:'step'+i,n:[0,-.6,.8]});
  for(const x of [18,62]) V.tube([[x,56],[x,26]],[3,3],Rd,{g:'col'+x}); V.poly([[14,56],[66,56],[66,30],[14,30]],R('#5a2a3a'),{g:'wall'});
  V.poly([[4,28],[76,28],[68,16],[12,16]],Go,{n:[-.3,-.4,.86],g:'roof'}); V.poly([[0,30],[8,24],[10,29]],Go,{g:'eave1'}); V.poly([[80,30],[72,24],[70,29]],Go,{g:'eave2'}); V.poly([[30,16],[50,16],[40,6]],Go,{g:'top'});
  V.ell(40,5,3,3,R('#fff3b0'),{g:'pearl',lift:.2});
  for(const [x,c] of [[26,'#9ad8ff'],[40,'#ffd84a'],[54,'#ff6ab8']]){ V.poly([[x-4,56],[x+4,56],[x+3,48],[x-3,48]],SD,{g:'ped'+x}); V.ell(x,44-(f&&x===40?1:0),3.2,4,R(c),{g:'gem'+x,lift:.15}); V.px(x-1,42,'#ffffff'); }
  const c=V.done(false,{glow:f?'rgba(255,216,74,.55)':'rgba(255,216,74,.3)',gr:3}), g=c.getContext('2d'); tag(g,'DEN HUYEN THOAI',40,58,'#ffd84a'); return {c,ax:40,ay:68}; })());
// icon sách: bìa màu theo loại + ký hiệu (sách nội tại MU: màu nội tại; sách kinh nghiệm Lính Cát: xanh / tím)
const BOOK_COL={cuongluc:'#e8402a',thietbi:'#8a96a4',sinhluc:'#5fe06a',linhluc:'#4a8ae8',hoiphuc:'#7fe8ff',chimang:'#ffb03a',hutmau:'#b02a4a',kn:'#3a9ad8',kn5:'#8a5ad8'};
function bookIcon(col,big){ const V=vol(14,14), C=R(col); V.poly([[2,3],[11,1],[12,11],[3,13]],C,{n:[-.3,-.35,.88],g:'cov'}); V.poly([[3,13],[12,11],[12,12],[3,14]],R('#f4f0e0'),{g:'pg'}); V.line(4,4,4,12,'#1c1516');
  V.ell(7.5,7,2.2,2.2,R(big?'#ffd84a':'#fff3d0'),{g:'em'}); if(big) V.px(7,4,'#ffffff').px(9,9,'#ffffff'); return V.done(false); }

/* ======================= icon: ngọc cường hoá + chiến lợi phẩm ======================= */
const ICO={};
// pha lê bát giác 2 tầng có mặt cắt + lấp lánh (thường: xanh băng, huyền thoại: vàng kim + hào quang)
function gemIcon(ht){ const V=vol(14,14), Rc=ht?R('#ffd84a'):R('#5ad0ff'), Rd=ht?R('#e8902a'):R('#2a8ad8');
  V.poly([[7,1],[12,5],[10,12],[4,12],[2,5]],Rc,{n:[-.3,-.35,.88]}); V.poly([[7,1],[12,5],[7,6]],Rd,{g:'f1',n:[.4,-.4,.82]}); V.poly([[7,6],[12,5],[10,12]],Rd,{g:'f2',n:[.5,.1,.86]});
  V.line(2,5,12,5,ht?'#fff3b0':'#c8f4ff'); V.px(5,3,'#ffffff').px(4,4,'#ffffff'); return V.done(false,ht?{glow:'rgba(255,216,74,.5)',gr:1}:{}); }
// chiến lợi phẩm: hình thu nhỏ của bộ phận con quái
const MAT={mob_slime:V=>{ const O=R('#ff8a24'); V.ell(7,8,6,4.5,O); V.ell(7,8,2,4.2,R('#c8501a'),{g:'r'}); V.tube([[7,4],[8,1]],[1,.6],R('#5a9a2a')); },
  mob_scorpion:V=>{ V.tube([[2,12],[5,7],[9,4],[12,5]],[1.8,1.6,1.3,1],R('#6a5aa8')); V.tube([[12,5],[13,9]],[1.2,.3],R('#d84ac8')); },
  mob_mage:V=>{ V.ell(7,10,6.5,2,R('#e8a830')); V.poly([[3,10],[11,10],[9,5],[12,1],[7,3]],R('#e8a830'),{g:'c'}); },
  mob_wolf:V=>{ V.tube([[4,12],[8,6],[10,2]],[2.2,1.6,.4],R('#ece4d4')); V.tube([[9,12],[11,8]],[1.4,.4],R('#ece4d4'),{g:'b'}); },
  mob_wraith:V=>{ V.ell(7,7,5,5,[[200,200,230,255],[140,140,190,255],[90,90,140,255],[50,50,90,255]]); V.px(5,6,'#ffffff').px(8,6,'#ffffff'); },
  mob_ogre:V=>{ V.poly([[3,2],[10,2],[11,8],[7,13],[3,8]],R('#e8dcc0')); V.line(4,4,9,4,'#b8a888'); },
  mob_golem:V=>{ V.poly([[3,3],[11,2],[12,10],[4,12]],R('#8a8478')); V.rect(5,6,2,2,'#ff9a4a').rect(9,6,2,2,'#ff9a4a'); },
  mob_wendigo:V=>{ V.tube([[3,13],[5,7],[3,2]],[1.4,1.1,.5],R('#e8dcc0')); V.tube([[5,7],[10,4],[12,1]],[1.1,.9,.4],R('#e8dcc0'),{g:'b'}); V.tube([[8,5],[9,9]],[.8,.3],R('#e8dcc0'),{g:'c'}); },
  mob_cerberus:V=>{ for(let i=0;i<3;i++) V.tube([[3+i*3,13],[5+i*3,6],[4+i*3,1]],[1.4,1,.4],R(['#ff7a2a','#ffb03a','#e8402a'][i]),{g:'f'+i}); }};
const oldIcon=A.icon;
A.icon=function(name,scale=1){ let c=ICO[name]; if(!c){ if(name==='gem_enh'||name==='gem_enh_ht') c=gemIcon(name==='gem_enh_ht'); else if(MAT[name]){ const V=vol(14,14); MAT[name](V); c=V.done(false); }
    else if(name.startsWith('pasbook_')||name.startsWith('book_')){ const k=name.slice(name.indexOf('_')+1); c=bookIcon(BOOK_COL[k]||'#3a9ad8',k==='kn5'); } if(c) ICO[name]=c; }
  if(!c) return oldIcon(name,scale); if(scale===1) return c; const s=A.cv(14*scale,14*scale), g=s.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,s.width,s.height); return s; };
})();
