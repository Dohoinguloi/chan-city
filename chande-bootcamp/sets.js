/* Chan City — 50 full set nhân vật anime / hoạt hình / phim (Shopee Chande → tab Full set), vẽ đè lên lưới 20×35 bằng bộ vẽ đồ Halloween (hw.js: HWC.LG).
   Mỗi set 1 hàm (U, view): view là 'side' (nhìn sang phải) / 'front' / 'back'. Toạ độ theo lưới gốc: mắt nhìn thẳng (6,11)/(13,11), nghiêng (10,11)/(15,11);
   miệng hàng 15; thân 19..26; tay 24..27 (thẳng: cột 2..3 / 16..17); chân 27..31; giày 32..33. Màu đặt tên trong NC, ký tự màu tự gán (Latin mở rộng, không trùng template). */
(function(){
const H=window.HWC; if(!H) return; const LG=H.LG;
const NC={red:[214,40,48],dred:[140,22,30],orange:[242,128,32],dorange:[196,90,20],yellow:[248,206,48],dyellow:[200,156,24],gold:[232,184,58],dgold:[170,124,30],
  green:[60,160,70],dgreen:[30,96,44],lime:[150,214,60],teal:[40,150,150],blue:[46,98,200],dblue:[28,56,130],navy:[24,32,64],sky:[120,190,240],ice:[190,226,250],dice:[130,180,220],
  purple:[120,60,170],dpurple:[70,34,110],pink:[248,150,190],dpink:[210,90,140],hotpink:[236,60,140],white:[244,242,236],grey:[150,154,162],dgrey:[86,88,98],black:[30,26,32],
  brown:[130,84,48],dbrown:[84,52,30],tan:[206,170,120],cream:[242,226,190],skin:[240,196,160],dskin:[214,160,124],shrek:[140,190,70],dshrek:[96,140,46],hulk:[90,170,60],dhulk:[54,116,38],
  silver:[196,200,210],dsilver:[130,136,148],cyan:[90,220,240],ink:[18,16,22],denim:[74,104,150],ddenim:[50,72,110],olive:[110,116,60],straw:[232,200,110],dstraw:[190,150,70],maroon:[110,30,40]};
const c={}; let code=0x100; for(const [k,v] of Object.entries(NC)){ const ch=String.fromCharCode(code++); c[k]=ch; H.PAL[ch]=v; H.KEYS.add(ch); }
const F=v=>v==='front', Sd=v=>v==='side', Bk=v=>v==='back', EYE=v=>Sd(v)?[10,15]:[6,13];
/* ---------- bộ vẽ chung ---------- */
const hair=(U,a,b)=>LG.hair(U,[a,b||a]);
const torso=(U,a,b,k)=>LG.torso(U,[a,b||a,k||b||a]);
const legs=(U,a,b,s,s2)=>LG.legs(U,[a,b||a],[s,s2||s]);
const hands=(U,col)=>LG.hands(U,col);
const belt=(U,col,y)=>LG.belt(U,col,y);
const cape=(U,v,a,b,fur)=>LG.cape(U,v,[a,b||a],fur);
const skinTo=(U,a,b)=>U.rows(-10,34,(x,y,ch)=>{ if('SsdnA'.includes(ch)) U.put(x,y,ch==='S'?a:b||a); });
const bald=U=>U.rows(-10,12,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,ch==='h'||ch==='X'?'s':'S'); });
const eyes=(U,v,col,h)=>{ if(Bk(v)) return; for(const x of EYE(v)) U.rect(x,11,x,10+(h||2),col); };
const head=(U,a,b,k,y0,y1)=>LG.head(U,[a,b||a,k||b||a],y0,y1);
// mặt nạ / mũ trùm kín đầu hàng y0..y1, chừa 2 mắt
const mask=(U,v,a,b,eye,y0,y1)=>{ head(U,a,b,b,y0??1,y1??18); if(eye) eyes(U,v,eye); };
const shorts=(U,a,b)=>{ legs(U,a,b,'F','f'); U.rows(30,31,(x,y,ch)=>{ if(ch===a||ch===(b||a)) U.put(x,y,'S'); }); };
const sleevesSkin=U=>U.rows(19,27,(x,y,ch)=>{ if('Ttq'.includes(ch)&&(x<=3||x>=16)) U.put(x,y,'S'); });
const bare=(U,v,sk)=>U.rows(19,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,sk); });
// gai tóc dựng: các chóp nhọn từ hàng 3 lên h ô
const spikes=(U,v,col,col2,h,xs)=>{ for(const x of xs||(Sd(v)?[3,6,9,12,15]:[3,6,9,12,15])) for(let i=0;i<h;i++){ const w=Math.max(0,1-Math.floor(i*2/h)); U.rect(x-w,2-i,x+w,2-i,i>=h-1?col2:col); } };
const backSpikes=(U,v,col,col2)=>{ if(Sd(v)) for(let i=0;i<4;i++) U.rect(-2-i,4+i*2,0-i,5+i*2,i%2?col2:col); if(Bk(v)) for(const x of [3,7,12,16]) U.rect(x,10,x+1,13,col); };
const dome=(U,y0,y1,col,band)=>{ const [l,r]=U.span(y1); let L=l,R=r; for(let y=y1;y>=y0;y--){ U.rect(L,y,R,y,band&&y>=band[0]?band[1]:col); if(y<y1-1){ L++; R--; } if(L>R) break; } };
const cap=(U,v,col,brimC,logo)=>{ dome(U,-1,5,col); if(Sd(v)) U.rect(12,5,21,5,brimC||col); if(F(v)){ const [l,r]=U.span(6); U.rect(l+1,6,r-1,6,brimC||col); if(logo) U.rect(9,1,10,3,logo); } };
const wideHat=(U,v,col,band,ext)=>{ dome(U,-3,3,col,[2,band]); const [l,r]=U.span(4); U.rect(l-(ext||3),4,r+(ext||3),4,col); };
const pair=(U,v,pts,col)=>{ for(const [x,y] of pts){ if(Sd(v)){ U.put(x+2,y,col); U.put(16-x,y,col); } else { U.put(x,y,col); U.put(19-x,y,col); } } };
const chest=(U,v,pts,col)=>{ if(F(v)) for(const [x,y] of pts) U.put(x,y,col); if(Sd(v)) for(const [x,y] of pts) if(x>=8) U.put(x+3,y,col); };
const back=(U,v,pts,col)=>{ if(Bk(v)) for(const [x,y] of pts) U.put(x,y,col); };
const stache=(U,v,col)=>{ if(Bk(v)) return; if(Sd(v)) U.rect(12,14,16,14,col); else U.rect(6,14,13,14,col); };
const headband=(U,v,col,plate)=>{ const [l,r]=U.span(6); U.rect(l,6,r,6,col); if(F(v)&&plate) U.rect(7,5,12,7,plate); if(Sd(v)&&plate) U.rect(13,5,16,7,plate); if(Sd(v)) U.rect(l-2,7,l-1,10,col); };
const sword=(U,v,blade,hilt)=>{ if(Sd(v)){ U.rect(1,15,1,27,blade); U.rect(0,26,2,26,hilt); U.rect(1,27,1,29,hilt); } if(Bk(v)){ for(let i=0;i<12;i++) U.put(5+i,26-i*1,blade); U.rect(4,27,5,27,hilt); } };
const W=v=>LG.wx(v);
const C={
  /* ===== anime ===== */
  fs_goku(U,v){ torso(U,c.orange,c.orange,c.dorange); U.rows(19,20,(x,y,ch)=>{ if(ch===c.orange&&(x<=4||x>=15)) U.put(x,y,c.blue); }); belt(U,c.blue,26); hands(U,c.blue); legs(U,c.orange,c.dorange,c.blue,c.dblue);
    hair(U,c.black,c.ink); spikes(U,v,c.black,c.ink,5); backSpikes(U,v,c.black,c.ink); chest(U,v,[[5,21],[6,21],[5,22],[6,22]],c.white); back(U,v,[[8,21],[9,21],[10,21],[11,21],[8,22],[11,22],[8,23],[9,23],[10,23],[11,23]],c.white); },
  fs_vegeta(U,v){ torso(U,c.blue,c.blue,c.dblue); U.rows(20,23,(x,y,ch)=>{ if(ch===c.blue&&x>=5&&x<=14) U.put(x,y,c.white); }); U.rows(19,20,(x,y,ch)=>{ if((x<=4||x>=15)&&ch!=='O') U.put(x,y,c.yellow); });
    hands(U,c.white); legs(U,c.blue,c.dblue,c.white,c.yellow); hair(U,c.black,c.ink); for(let i=0;i<6;i++){ const w=Math.max(1,5-i); const x0=Sd(v)?10:9; U.rect(x0-w,1-i,x0+w,1-i,i>4?c.ink:c.black); } },
  fs_naruto(U,v){ torso(U,c.orange,c.orange,c.dorange); U.rows(19,21,(x,y,ch)=>{ if(ch!=='O'&&(x<=5||x>=14)) U.put(x,y,c.black); }); if(F(v)) U.rect(9,19,10,25,c.white); legs(U,c.orange,c.dorange,c.navy,c.ink);
    hair(U,c.yellow,c.dyellow); spikes(U,v,c.yellow,c.dyellow,4); headband(U,v,c.dblue,c.silver); },
  fs_sasuke(U,v){ torso(U,c.white,c.white,c.grey); belt(U,c.purple,25); belt(U,c.purple,26); legs(U,c.navy,c.ink,c.navy,c.ink); hair(U,c.black,c.navy); backSpikes(U,v,c.black,c.navy); headband(U,v,c.dblue,c.silver);
    if(Bk(v)){ U.rect(8,20,11,21,c.red); U.rect(8,22,11,23,c.white); } },
  fs_kakashi(U,v){ torso(U,c.olive,c.olive,c.dgreen); U.rows(19,27,(x,y,ch)=>{ if(ch===c.olive&&(x<=4||x>=15)) U.put(x,y,c.navy); }); legs(U,c.navy,c.ink,c.navy,c.ink);
    hair(U,c.silver,c.dsilver); for(let i=0;i<5;i++) U.rect((Sd(v)?3:4)+i*2,-1-i%2,(Sd(v)?4:5)+i*2,2,i%2?c.dsilver:c.silver);
    if(!Bk(v)) U.rows(13,18,(x,y,ch)=>{ if('Ssdnm'.includes(ch)) U.put(x,y,c.navy); }); headband(U,v,c.dblue,c.silver); if(F(v)) U.rect(4,7,8,12,c.dblue); },
  fs_luffy(U,v){ torso(U,c.red,c.red,c.dred); if(F(v)) U.rows(20,25,(x,y,ch)=>{ if(x>=8&&x<=11) U.put(x,y,'S'); }); shorts(U,c.blue,c.dblue); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,ch==='F'?'S':c.brown); });
    hair(U,c.black,c.ink); wideHat(U,v,c.straw,c.red,3); if(F(v)){ U.put(5,13,c.dred); U.put(6,14,c.dred); } },
  fs_zoro(U,v){ torso(U,c.white,c.white,c.grey); U.rows(24,26,(x,y,ch)=>{ if(ch!=='O'&&x>=4&&x<=15) U.put(x,y,c.green); }); legs(U,c.black,c.ink,c.black,c.ink); hair(U,c.green,c.dgreen);
    if(Sd(v)){ U.rect(2,22,2,30,c.white); U.rect(3,23,3,30,c.dred); U.rect(1,21,1,29,c.black); } if(F(v)){ U.rect(17,23,17,30,c.white); U.rect(18,23,18,30,c.black); } },
  fs_sailormoon(U,v){ torso(U,c.white,c.white,c.grey); U.rows(19,20,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,c.blue); }); chest(U,v,[[8,21],[9,21],[10,21],[11,21],[9,22],[10,22]],c.red); belt(U,c.yellow,26);
    U.rows(27,28,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,c.blue); }); U.rows(29,31,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,'S'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,c.red); });
    hair(U,c.yellow,c.dyellow); for(const x of Sd(v)?[5,13]:[4,15]) U.ell(x,0,2,2,(xx,yy)=>U.put(xx,yy,c.yellow)); if(Sd(v)) for(let y=6;y<=24;y++) U.rect(-1,y,1,y,y%3?c.yellow:c.dyellow); else for(let y=6;y<=24;y++){ U.rect(-1,y,0,y,c.yellow); U.rect(19,y,20,y,c.yellow); } },
  fs_conan(U,v){ torso(U,c.blue,c.blue,c.dblue); if(F(v)){ U.rect(8,19,11,22,c.white); U.rect(8,19,11,19,c.red); U.put(9,20,c.red); U.put(10,20,c.red); } shorts(U,c.grey,c.dgrey); hair(U,c.dbrown,c.black);
    if(!Bk(v)) for(const x of EYE(v)){ U.rect(x-2,10,x+2,10,c.ink); U.rect(x-2,13,x+2,13,c.ink); U.put(x-2,11,c.ink); U.put(x-2,12,c.ink); U.put(x+2,11,c.ink); U.put(x+2,12,c.ink); } },
  fs_ash(U,v){ torso(U,c.blue,c.blue,c.dblue); U.rows(19,27,(x,y,ch)=>{ if(ch===c.blue&&(x<=4||x>=15)) U.put(x,y,c.black); }); hands(U,c.green); legs(U,c.denim,c.ddenim,c.black,c.red); hair(U,c.black,c.ink); cap(U,v,c.red,c.white,c.green);
    if(F(v)) U.rows(-1,2,(x,y,ch)=>{ if(ch===c.red&&(x<=6||x>=13)) U.put(x,y,c.white); }); },
  fs_pikachu(U,v){ head(U,c.yellow,c.yellow,c.dyellow); torso(U,c.yellow,c.yellow,c.dyellow); hands(U,c.yellow); legs(U,c.yellow,c.dyellow,c.yellow,c.dyellow); eyes(U,v,c.ink);
    pair(U,v,[[4,0],[4,-1],[3,-2],[3,-3],[3,-4],[2,-5],[2,-6]],c.yellow); pair(U,v,[[2,-5],[2,-6],[3,-4]],c.ink); if(F(v)){ U.rect(3,14,4,15,c.red); U.rect(15,14,16,15,c.red); } if(Sd(v)) U.rect(16,14,17,15,c.red);
    if(Bk(v)){ U.rect(5,21,14,21,c.brown); U.rect(5,23,14,23,c.brown); for(const [x,y] of [[16,22],[17,21],[18,20],[18,19],[17,18],[18,17],[19,16],[19,15]]) U.put(x,y,c.yellow); } if(Sd(v)) for(const [x,y] of [[3,25],[2,24],[1,23],[1,22],[0,21],[0,20],[-1,19]]) U.put(x,y,c.yellow); },
  fs_totoro(U,v){ head(U,c.grey,c.grey,c.dgrey); torso(U,c.grey,c.grey,c.dgrey); hands(U,c.grey); legs(U,c.grey,c.dgrey,c.dgrey,c.dgrey); eyes(U,v,c.ink,1); pair(U,v,[[5,0],[5,-1],[5,-2],[6,-3],[6,0],[6,-1]],c.grey);
    if(F(v)){ U.rect(5,20,14,26,c.cream); for(const x of [7,10,13]){ U.put(x,21,c.dgrey); U.put(x-1,22,c.dgrey); U.put(x+1,22,c.dgrey); } U.rect(9,13,10,13,c.ink); for(const y of [13,15]){ U.rect(1,y,3,y,c.ink); U.rect(16,y,18,y,c.ink); } }
    if(Sd(v)) U.rect(11,20,16,26,c.cream); },
  fs_doraemon(U,v){ head(U,c.blue,c.blue,c.dblue); torso(U,c.blue,c.blue,c.dblue); hands(U,c.white); legs(U,c.blue,c.dblue,c.white,c.grey);
    if(F(v)){ U.rect(4,8,15,17,c.white); eyes(U,v,c.ink); U.rect(9,12,10,13,c.red); U.rect(9,14,10,17,c.ink); U.rect(6,16,13,16,c.ink); U.rect(4,18,15,18,c.red); U.rect(9,19,10,20,c.yellow); U.rect(6,21,13,25,c.white); U.rect(7,23,12,23,c.grey); }
    if(Sd(v)){ U.rect(10,8,18,17,c.white); eyes(U,v,c.ink); U.rect(17,12,18,13,c.red); U.rect(5,18,17,18,c.red); U.rect(14,19,15,20,c.yellow); U.rect(11,21,16,25,c.white); } if(Bk(v)){ U.rect(4,18,15,18,c.red); U.rect(9,27,10,28,c.red); } },
  fs_saitama(U,v){ bald(U); torso(U,c.yellow,c.yellow,c.dyellow); belt(U,c.black,26); hands(U,c.red); legs(U,c.yellow,c.dyellow,c.red,c.dred); cape(U,v,c.white,c.grey); if(F(v)) U.rect(8,19,11,19,c.black); },
  fs_tanjiro(U,v){ torso(U,c.black,c.black,c.ink); U.rows(19,26,(x,y,ch)=>{ if(ch===c.black&&(x<=6||x>=13||Bk(v))&&(Math.floor(x/2)+Math.floor(y/2))%2) U.put(x,y,c.green); else if(ch===c.black&&(x<=6||x>=13||Bk(v))) U.put(x,y,c.ink); });
    belt(U,c.white,26); legs(U,c.black,c.ink,c.white,c.grey); hair(U,c.dred,c.black); if(F(v)){ U.rect(1,13,1,15,c.red); U.rect(18,13,18,15,c.red); U.put(12,8,c.dred); U.put(13,9,c.dred); } if(Sd(v)) U.rect(5,13,5,15,c.red); },
  fs_nezuko(U,v){ torso(U,c.pink,c.pink,c.dpink); U.rows(19,26,(x,y,ch)=>{ if(ch===c.pink&&(x+y*2)%5===0) U.put(x,y,c.white); }); belt(U,c.dred,25); belt(U,c.dred,26); legs(U,c.pink,c.dpink,c.white,c.dbrown);
    hair(U,c.black,c.black); U.rows(8,12,(x,y,ch)=>{ if(ch===c.black&&(x<=2||x>=17)) U.put(x,y,c.orange); }); if(Sd(v)) for(let y=8;y<=24;y++) U.rect(0,y,2,y,y>18?c.orange:c.black); if(Bk(v)) U.rect(4,12,15,24,c.black);
    if(F(v)){ U.rect(4,15,15,15,c.dgreen); U.rect(7,14,12,16,c.green); } if(Sd(v)){ U.rect(9,15,18,15,c.dgreen); U.rect(11,14,16,16,c.green); } },
  fs_gojo(U,v){ torso(U,c.navy,c.navy,c.ink); if(F(v)||Sd(v)) U.rows(17,19,(x,y,ch)=>{ if('Ssd'.includes(ch)) U.put(x,y,c.navy); }); legs(U,c.navy,c.ink,c.black,c.ink); hair(U,c.white,c.silver); spikes(U,v,c.white,c.silver,4,Sd(v)?[4,8,12]:[4,8,12,16]);
    if(F(v)) U.rect(3,10,16,12,c.black); if(Sd(v)) U.rect(8,10,19,12,c.black); if(Bk(v)) U.rect(2,11,17,11,c.black); },
  fs_levi(U,v){ torso(U,c.brown,c.brown,c.dbrown); if(F(v)){ U.rect(8,19,11,25,c.white); U.rect(5,21,6,22,c.blue); U.put(4,21,c.white); } legs(U,c.white,c.cream,c.dbrown,c.black); U.rows(27,30,(x,y,ch)=>{ if(ch===c.white&&(x===6||x===13)) U.put(x,y,c.black); });
    hair(U,c.black,c.ink); cape(U,v,c.dgreen,c.green); if(Bk(v)){ U.rect(7,21,12,24,c.white); U.rect(8,22,9,23,c.blue); U.rect(10,22,11,23,c.white); } },
  fs_ichigo(U,v){ torso(U,c.black,c.black,c.ink); U.rows(19,21,(x,y,ch)=>{ if(ch===c.black&&x>=8&&x<=11&&F(v)) U.put(x,y,c.white); }); belt(U,c.white,26); legs(U,c.black,c.ink,c.white,c.dbrown); hair(U,c.orange,c.dorange); spikes(U,v,c.orange,c.dorange,3);
    if(Bk(v)){ for(let i=0;i<14;i++) U.rect(4+i,26-i,5+i,26-i,c.silver); U.rect(2,27,4,28,c.black); } if(Sd(v)){ U.rect(1,10,2,28,c.silver); U.rect(0,27,3,27,c.black); } },
  fs_L(U,v){ torso(U,c.white,c.white,c.grey); legs(U,c.denim,c.ddenim,'S','s'); hair(U,c.black,c.ink); for(const x of Sd(v)?[2,5,8,11,14,17]:[2,5,8,11,14,17]) U.rect(x,0,x+1,1,c.black); if(Sd(v)) U.rect(1,8,3,12,c.black);
    if(!Bk(v)) for(const x of EYE(v)) U.rect(x-1,13,x+1,13,c.dgrey); },
  fs_edward(U,v){ torso(U,c.red,c.red,c.dred); if(F(v)) U.rect(7,19,12,25,c.black); hands(U,c.white); legs(U,c.black,c.ink,c.black,c.ink); hair(U,c.yellow,c.dyellow); if(Bk(v)) for(let y=12;y<=22;y++) U.rect(9,y,10,y,y%2?c.yellow:c.dyellow);
    if(Sd(v)) for(let y=10;y<=20;y++) U.rect(1,y,2,y,y%2?c.yellow:c.dyellow); U.rows(27,31,(x,y,ch)=>{ if(ch===c.black&&(x<=4||x>=15)) U.put(x,y,c.red); }); if(Sd(v)) for(let y=27;y<=31;y++) U.rect(2,y,4,y,c.red); if(Bk(v)) for(let y=27;y<=31;y++){ U.rect(4,y,5,y,c.red); U.rect(14,y,15,y,c.red); } },
  fs_kirito(U,v){ torso(U,c.black,c.black,c.ink); hands(U,c.black); legs(U,c.black,c.ink,c.ink,c.black); hair(U,c.black,c.ink); U.rows(27,31,(x,y,ch)=>{ if(ch===c.black&&(x<=5||x>=14)) U.put(x,y,c.ink); });
    if(Sd(v)) for(let y=27;y<=32;y++) U.rect(2,y,4,y,c.black); if(Bk(v)){ for(let i=0;i<12;i++){ U.put(4+i,26-i,c.dgrey); U.put(15-i,26-i,c.ice); } } if(F(v)) U.rect(9,19,10,26,c.dgrey); },
  fs_gon(U,v){ torso(U,c.green,c.green,c.dgreen); shorts(U,c.green,c.dgreen); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,c.orange); }); hair(U,c.black,c.dgreen); spikes(U,v,c.black,c.dgreen,6,Sd(v)?[5,9,13]:[4,8,11,15]);
    if(Sd(v)) U.rect(18,12,18,27,c.brown); if(F(v)) U.rect(18,6,18,27,c.brown); },
  /* ===== hoạt hình ===== */
  fs_mickey(U,v){ torso(U,c.black,c.black,c.ink); hands(U,c.white); U.rows(27,29,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,c.red); }); U.rows(30,31,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,c.black); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,c.yellow); });
    if(F(v)){ U.rect(7,27,7,28,c.white); U.rect(12,27,12,28,c.white); } hair(U,c.black,c.ink); for(const [x0] of Sd(v)?[[3],[11]]:[[1],[14]]) U.ell(x0+2,-1,2,2,(x,y)=>U.put(x,y,c.black)); },
  fs_mario(U,v){ torso(U,c.red,c.red,c.dred); U.rows(23,26,(x,y,ch)=>{ if(ch===c.red&&x>=5&&x<=14) U.put(x,y,c.blue); }); if(F(v)){ U.rect(6,19,7,22,c.blue); U.rect(12,19,13,22,c.blue); U.put(7,23,c.yellow); U.put(12,23,c.yellow); }
    hands(U,c.white); legs(U,c.blue,c.dblue,c.brown,c.dbrown); hair(U,c.dbrown,c.black); cap(U,v,c.red,c.dred); if(F(v)){ U.rect(8,1,11,3,c.white); U.put(9,2,c.red); U.put(10,2,c.red); } stache(U,v,c.black); },
  fs_luigi(U,v){ torso(U,c.green,c.green,c.dgreen); U.rows(23,26,(x,y,ch)=>{ if(ch===c.green&&x>=5&&x<=14) U.put(x,y,c.dblue); }); if(F(v)){ U.rect(6,19,7,22,c.dblue); U.rect(12,19,13,22,c.dblue); }
    hands(U,c.white); legs(U,c.dblue,c.navy,c.brown,c.dbrown); hair(U,c.dbrown,c.black); cap(U,v,c.green,c.dgreen); if(F(v)){ U.rect(8,1,11,3,c.white); U.rect(9,2,9,3,c.green); } stache(U,v,c.black); },
  fs_spongebob(U,v){ torso(U,c.yellow,c.yellow,c.dyellow); U.rows(19,24,(x,y,ch)=>{ if(ch===c.yellow&&(x*5+y*3)%11===0) U.put(x,y,c.dyellow); }); if(F(v)){ U.rect(6,24,13,25,c.white); U.rect(9,24,10,26,c.red); }
    shorts(U,c.brown,c.dbrown); U.rows(31,31,(x,y,ch)=>{ if(ch==='S') U.put(x,y,c.white); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,c.black); }); belt(U,c.black,26); hands(U,c.yellow); if(F(v)) U.rect(9,16,10,16,c.white); },
  fs_patrick(U,v){ bare(U,v,c.pink); skinTo(U,c.pink,c.dpink); shorts(U,c.lime,c.green); U.rows(27,29,(x,y,ch)=>{ if(ch===c.lime&&(x+y)%3===0) U.put(x,y,c.purple); }); bald(U); skinTo(U,c.pink,c.dpink); pair(U,v,[[8,0],[9,-1],[9,-2]],c.pink); },
  fs_shin(U,v){ torso(U,c.red,c.red,c.dred); shorts(U,c.yellow,c.dyellow); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,c.white); }); hair(U,c.black,c.ink); if(F(v)){ U.rect(4,9,8,9,c.ink); U.rect(11,9,15,9,c.ink); } if(Sd(v)){ U.rect(9,9,11,9,c.ink); U.rect(14,9,16,9,c.ink); } },
  fs_elsa(U,v){ torso(U,c.ice,c.ice,c.dice); U.rows(19,33,(x,y,ch)=>{ if('PpUjFf'.includes(ch)) U.put(x,y,(x+y)%5?c.ice:c.white); }); U.rows(19,26,(x,y,ch)=>{ if(ch===c.ice&&(x*3+y)%7===0) U.put(x,y,c.white); });
    hair(U,c.white,c.cream); if(F(v)) for(let y=10;y<=24;y++) U.rect(15,y,16,y,y%2?c.white:c.cream); if(Sd(v)) for(let y=10;y<=22;y++) U.rect(15,y,16,y,y%2?c.white:c.cream); if(Bk(v)) for(let y=10;y<=24;y++) U.rect(14,y,15,y,y%2?c.white:c.cream); cape(U,v,c.sky,c.dice); },
  fs_snowwhite(U,v){ torso(U,c.dblue,c.dblue,c.navy); U.rows(19,22,(x,y,ch)=>{ if(ch!=='O'&&(x<=4||x>=15)) U.put(x,y,c.red); }); U.rows(27,33,(x,y,ch)=>{ if('PpUjFf'.includes(ch)) U.put(x,y,c.yellow); }); U.rows(33,33,(x,y,ch)=>{ if(ch===c.yellow) U.put(x,y,c.dyellow); });
    hair(U,c.black,c.ink); const [l,r]=U.span(4); U.rect(l,3,r,3,c.red); if(F(v)) U.rect(14,1,16,3,c.red); if(Sd(v)) U.rect(3,1,5,3,c.red); if(F(v)) U.rect(4,17,15,18,c.white); },
  fs_buzz(U,v){ torso(U,c.white,c.white,c.grey); if(F(v)){ U.rect(6,20,13,24,c.green); U.put(7,21,c.red); U.put(9,21,c.blue); U.put(11,21,c.white); U.rect(7,23,12,23,c.silver); } hands(U,c.green); legs(U,c.white,c.purple,c.green,c.purple); U.rows(28,28,(x,y,ch)=>{ if(ch===c.white) U.put(x,y,c.purple); });
    U.rows(1,9,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,c.purple); }); if(F(v)) U.rect(2,8,17,8,c.purple); if(Sd(v)){ U.rect(0,20,3,22,c.white); U.rect(0,21,1,23,c.red); } if(Bk(v)){ U.rect(1,20,4,23,c.white); U.rect(15,20,18,23,c.white); U.rect(2,22,3,23,c.red); U.rect(16,22,17,23,c.red); } },
  fs_woody(U,v){ torso(U,c.yellow,c.yellow,c.dyellow); U.rows(19,26,(x,y,ch)=>{ if(ch===c.yellow&&(x%3===0||y%3===0)) U.put(x,y,c.dred); }); U.rows(20,25,(x,y,ch)=>{ if((F(v)&&(x<=6||x>=13))||Bk(v)) if(ch!=='O'&&x>=3&&x<=16) U.put(x,y,(x*7+y*3)%5?c.white:c.black); });
    if(F(v)) U.rect(5,21,6,22,c.gold); legs(U,c.denim,c.ddenim,c.brown,c.dbrown); belt(U,c.dbrown,26); hair(U,c.dbrown,c.black); wideHat(U,v,c.brown,c.dbrown,3); if(F(v)) U.rect(8,17,11,18,c.red); },
  fs_shrek(U,v){ skinTo(U,c.shrek,c.dshrek); torso(U,c.cream,c.cream,c.tan); U.rows(19,26,(x,y,ch)=>{ if(ch===c.cream&&(x<=6||x>=13)) U.put(x,y,c.dbrown); }); belt(U,c.brown,26); legs(U,c.brown,c.dbrown,c.dbrown,c.black); bald(U); skinTo(U,c.shrek,c.dshrek);
    if(F(v)){ U.rect(0,9,1,10,c.shrek); U.put(-1,8,c.shrek); U.rect(18,9,19,10,c.shrek); U.put(20,8,c.shrek); } if(Sd(v)){ U.rect(4,8,5,9,c.shrek); U.put(4,7,c.shrek); } },
  fs_minion(U,v){ head(U,c.yellow,c.yellow,c.dyellow); torso(U,c.yellow,c.yellow,c.dyellow); U.rows(23,26,(x,y,ch)=>{ if(ch===c.yellow||ch===c.dyellow) U.put(x,y,c.blue); }); hands(U,c.black); legs(U,c.blue,c.dblue,c.black,c.ink);
    const [l,r]=U.span(10); U.rect(l,10,r,11,c.black); const x=Sd(v)?13:9; if(!Bk(v)){ U.ell(x,11,2,2,(xx,yy)=>U.put(xx,yy,c.silver)); U.rect(x-1,10,x,12,c.white); U.put(x,11,c.ink); } if(F(v)) U.rect(7,15,12,15,c.ink); },
  fs_kitty(U,v){ head(U,c.white,c.white,c.grey); torso(U,c.pink,c.pink,c.dpink); legs(U,c.pink,c.dpink,c.white,c.grey); hands(U,c.white); eyes(U,v,c.ink,1); pair(U,v,[[4,1],[4,0],[3,-1],[3,0],[5,1]],c.white);
    if(F(v)){ U.rect(13,1,16,3,c.red); U.put(14,2,c.yellow); U.rect(9,13,10,13,c.yellow); for(const y of [13,15]){ U.rect(1,y,3,y,c.ink); U.rect(16,y,18,y,c.ink); } } if(Sd(v)) U.rect(10,1,13,3,c.red); },
  fs_pooh(U,v){ head(U,c.gold,c.gold,c.dgold); skinTo(U,c.gold,c.dgold); torso(U,c.red,c.red,c.dred); U.rows(25,26,(x,y,ch)=>{ if(ch===c.red||ch===c.dred) U.put(x,y,c.gold); }); legs(U,c.gold,c.dgold,c.gold,c.dgold); eyes(U,v,c.ink,1);
    pair(U,v,[[4,1],[4,0],[5,0],[3,1]],c.gold); if(F(v)) U.rect(8,13,11,15,c.cream); if(F(v)) U.rect(9,13,10,13,c.ink); },
  /* ===== phim ===== */
  fs_spider(U,v){ mask(U,v,c.red,c.dred,null); torso(U,c.red,c.red,c.dred); U.rows(22,26,(x,y,ch)=>{ if((ch===c.red||ch===c.dred)&&(x<=5||x>=14)) U.put(x,y,c.blue); }); legs(U,c.blue,c.dblue,c.red,c.dred); hands(U,c.red);
    U.rows(1,26,(x,y,ch)=>{ if((ch===c.red||ch===c.dred)&&((x+y)%4===0||(x-y)%4===0)) U.put(x,y,c.black); });
    if(F(v)){ U.rect(4,10,7,12,c.white); U.rect(12,10,15,12,c.white); U.rect(4,9,7,9,c.black); U.rect(12,9,15,9,c.black); chest(U,v,[[9,21],[10,21],[8,22],[11,22],[9,23],[10,23]],c.black); }
    if(Sd(v)){ U.rect(9,10,11,12,c.white); U.rect(14,10,17,12,c.white); } if(Bk(v)) back(U,v,[[9,21],[10,21],[9,22],[10,22],[8,23],[11,23]],c.red); },
  fs_ironman(U,v){ mask(U,v,c.red,c.dred,null); torso(U,c.red,c.red,c.dred); hands(U,c.gold); legs(U,c.red,c.gold,c.gold,c.dgold); U.rows(19,26,(x,y,ch)=>{ if(ch===c.red&&(x<=4||x>=15)&&y%3===0) U.put(x,y,c.gold); });
    if(F(v)){ U.rect(5,8,14,16,c.gold); U.rect(5,10,8,10,c.cyan); U.rect(11,10,14,10,c.cyan); U.rect(8,14,11,14,c.dgold); U.rect(9,21,10,22,c.cyan); U.put(8,21,c.white); }
    if(Sd(v)){ U.rect(10,8,18,16,c.gold); U.rect(14,10,17,10,c.cyan); U.put(15,21,c.cyan); } },
  fs_captain(U,v){ mask(U,v,c.blue,c.dblue,null,1,9); torso(U,c.blue,c.blue,c.dblue); U.rows(24,26,(x,y,ch)=>{ if(ch===c.blue||ch===c.dblue) U.put(x,y,y%2?c.red:c.white); }); hands(U,c.red); legs(U,c.blue,c.dblue,c.red,c.dred);
    if(F(v)){ chest(U,v,[[9,20],[10,20],[8,21],[9,21],[10,21],[11,21],[9,22],[10,22],[8,23],[11,23]],c.white); U.rect(9,3,10,5,c.white); } if(Sd(v)) U.rect(14,3,15,5,c.white);
    if(Bk(v)||Sd(v)){ const x=Bk(v)?9.5:1; U.ell(Math.round(x),23,4,4,(xx,yy,dx,dy)=>{ const d=Math.hypot(dx,dy); U.put(xx,yy,d<1.5?c.white:d<2.5?c.blue:d<3.5?c.white:c.red); }); } },
  fs_hulk(U,v){ skinTo(U,c.hulk,c.dhulk); bare(U,v,c.hulk); torso(U,c.hulk,c.hulk,c.dhulk); hands(U,c.hulk); U.rows(27,30,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,c.purple); }); U.rows(31,33,(x,y,ch)=>{ if('PpUjFf'.includes(ch)) U.put(x,y,c.hulk); });
    U.rows(31,31,(x,y,ch)=>{ if(ch===c.hulk&&x%2) U.put(x,y,c.purple); }); hair(U,c.dhulk,c.black); if(F(v)){ U.rect(6,21,7,21,c.dhulk); U.rect(12,21,13,21,c.dhulk); U.rect(9,23,10,25,c.dhulk); } },
  fs_thor(U,v){ torso(U,c.dgrey,c.dgrey,c.black); chest(U,v,[[6,21],[8,21],[11,21],[13,21],[6,23],[8,23],[11,23],[13,23]],c.silver); hands(U,c.dgrey); legs(U,c.black,c.ink,c.dgrey,c.black); hair(U,c.yellow,c.dyellow);
    if(Sd(v)) for(let y=10;y<=20;y++) U.rect(1,y,4,y,c.yellow); if(Bk(v)) U.rect(4,10,15,19,c.yellow); cape(U,v,c.red,c.dred); if(F(v)){ U.rect(17,25,17,28,c.brown); U.rect(16,29,19,31,c.silver); } if(Sd(v)){ U.rect(17,25,17,28,c.brown); U.rect(16,29,19,31,c.silver); } },
  fs_harry(U,v){ torso(U,c.black,c.black,c.ink); if(F(v)){ U.rect(8,19,11,22,c.white); U.rect(9,19,10,25,c.red); U.put(9,21,c.gold); U.put(10,23,c.gold); } U.rows(27,31,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,c.black); }); legs(U,c.black,c.ink,c.black,c.ink);
    hair(U,c.black,c.ink); cape(U,v,c.black,c.ink); if(!Bk(v)) for(const x of EYE(v)){ U.rect(x-1,10,x+1,10,c.ink); U.rect(x-1,13,x+1,13,c.ink); U.put(x-2,11,c.ink); U.put(x-2,12,c.ink); U.put(x+2,11,c.ink); U.put(x+2,12,c.ink); }
    if(F(v)){ U.put(11,7,c.dred); U.put(12,8,c.dred); U.put(11,9,c.dred); } if(F(v)) U.rect(4,17,15,18,c.red); },
  fs_vader(U,v){ mask(U,v,c.black,c.ink,null,0,18); torso(U,c.black,c.black,c.ink); hands(U,c.black); legs(U,c.black,c.ink,c.black,c.ink); cape(U,v,c.black,c.ink);
    if(F(v)){ U.rect(4,10,8,12,c.dgrey); U.rect(11,10,15,12,c.dgrey); U.rect(8,14,11,17,c.dgrey); U.rect(7,21,12,23,c.dgrey); U.put(8,22,c.red); U.put(9,22,c.lime); U.put(11,22,c.blue); U.rect(6,26,13,26,c.silver); }
    if(Sd(v)){ U.rect(10,10,13,12,c.dgrey); U.rect(14,14,17,17,c.dgrey); } dome(U,-2,4,c.black); },
  fs_trooper(U,v){ mask(U,v,c.white,c.grey,null,0,18); torso(U,c.white,c.white,c.grey); hands(U,c.black); legs(U,c.white,c.grey,c.white,c.grey); U.rows(19,33,(x,y,ch)=>{ if((ch===c.white||ch===c.grey)&&(y===22||y===26||y===29)) U.put(x,y,c.black); });
    if(F(v)){ U.rect(4,10,8,12,c.black); U.rect(11,10,15,12,c.black); U.rect(8,15,11,16,c.dgrey); U.rect(6,16,7,17,c.black); U.rect(12,16,13,17,c.black); } if(Sd(v)){ U.rect(10,10,13,12,c.black); U.rect(15,15,17,16,c.dgrey); } dome(U,-2,3,c.white); },
  fs_sparrow(U,v){ torso(U,c.white,c.white,c.cream); U.rows(19,26,(x,y,ch)=>{ if(ch!=='O'&&(x<=5||x>=14)&&y<=25) U.put(x,y,c.brown); }); U.rows(25,26,(x,y,ch)=>{ if(ch!=='O'&&x>=3&&x<=16) U.put(x,y,c.red); }); legs(U,c.dbrown,c.black,c.black,c.ink);
    hair(U,c.dbrown,c.black); if(Sd(v)) for(const x of [0,2,4]) U.rect(x,10,x,20,c.dbrown); if(F(v)) for(const x of [1,3,16,18]) U.rect(x,10,x,19,c.dbrown); if(Bk(v)) for(let x=4;x<=15;x+=2) U.rect(x,12,x,21,c.dbrown);
    const [l,r]=U.span(5); U.rect(l,4,r,6,c.red); dome(U,-2,3,c.black); const [a,b]=U.span(3); U.rect(a-2,3,b+2,3,c.black); U.put(a-2,2,c.black); U.put(b+2,2,c.black); if(!Bk(v)) for(const x of EYE(v)) U.rect(x-1,13,x+1,13,c.ink); },
  fs_joker(U,v){ torso(U,c.purple,c.purple,c.dpurple); if(F(v)){ U.rect(7,19,12,25,c.lime); U.rect(9,19,10,22,c.orange); } legs(U,c.purple,c.dpurple,c.brown,c.dbrown); hair(U,c.lime,c.green); skinTo(U,c.white,c.grey);
    if(F(v)){ U.rect(7,15,12,15,c.red); U.put(6,14,c.red); U.put(13,14,c.red); for(const x of [6,13]){ U.put(x,10,c.dgrey); U.put(x,13,c.dgrey); } } if(Sd(v)) U.rect(12,15,17,15,c.red); },
  fs_wonder(U,v){ torso(U,c.red,c.red,c.dred); chest(U,v,[[6,20],[7,20],[8,21],[9,21],[10,21],[11,21],[12,20],[13,20]],c.gold); belt(U,c.gold,26); U.rows(27,28,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,(x+y)%3?c.blue:c.white); });
    U.rows(29,31,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,'S'); }); U.rows(30,33,(x,y,ch)=>{ if('PpUjFfS'.includes(ch)&&y>=31) U.put(x,y,c.red); }); hands(U,c.silver); hair(U,c.black,c.ink);
    if(Sd(v)) for(let y=8;y<=22;y++) U.rect(0,y,3,y,c.black); if(Bk(v)) U.rect(3,10,16,22,c.black); if(F(v)){ U.rect(5,5,14,6,c.gold); U.rect(9,4,10,4,c.red); } if(Sd(v)) U.rect(9,5,17,6,c.gold); },
  fs_neo(U,v){ torso(U,c.black,c.black,c.ink); legs(U,c.black,c.ink,c.black,c.ink); U.rows(27,31,(x,y,ch)=>{ if(ch===c.black&&(x<=5||x>=14)) U.put(x,y,c.ink); }); if(Sd(v)) for(let y=27;y<=32;y++) U.rect(1,y,4,y,c.black); if(Bk(v)) for(let y=27;y<=32;y++){ U.rect(3,y,5,y,c.black); U.rect(14,y,16,y,c.black); }
    hair(U,c.black,c.ink); if(F(v)){ U.rect(4,11,8,12,c.ink); U.rect(11,11,15,12,c.ink); U.rect(9,11,10,11,c.ink); } if(Sd(v)){ U.rect(9,11,11,12,c.ink); U.rect(14,11,16,12,c.ink); U.rect(5,11,8,11,c.ink); } },
  fs_chaplin(U,v){ torso(U,c.black,c.black,c.ink); legs(U,c.dgrey,c.black,c.black,c.ink); hair(U,c.black,c.ink); dome(U,-3,3,c.black); const [l,r]=U.span(4); U.rect(l-1,4,r+1,4,c.black); stache(U,v,c.black); if(F(v)) U.rect(9,14,10,14,c.black);
    if(F(v)){ U.rect(17,25,17,32,c.brown); U.rect(17,24,19,24,c.brown); } if(Sd(v)){ U.rect(18,25,18,32,c.brown); U.rect(16,24,18,24,c.brown); } if(F(v)) U.rect(9,19,10,20,c.white); },
  fs_456(U,v){ torso(U,c.teal,c.teal,c.dgreen); U.rows(19,33,(x,y,ch)=>{ if((ch===c.teal||ch===c.dgreen)&&(x===4||x===15)) U.put(x,y,c.white); }); legs(U,c.teal,c.dgreen,c.white,c.grey); U.rows(27,31,(x,y,ch)=>{ if((ch===c.teal||ch===c.dgreen)&&(x===5||x===14)) U.put(x,y,c.white); });
    if(F(v)) for(const [x,y] of [[11,21],[12,21],[13,21],[11,22],[13,22]]) U.put(x,y,c.white); if(Bk(v)) for(const [x,y] of [[6,21],[7,21],[8,21],[10,21],[11,21],[12,21],[14,21],[6,22],[8,22],[10,22],[12,22],[14,22]]) U.put(x,y,c.white); },
  fs_guard(U,v){ mask(U,v,c.black,c.ink,null,0,18); torso(U,c.hotpink,c.hotpink,c.dpink); hands(U,c.black); legs(U,c.hotpink,c.dpink,c.black,c.ink); belt(U,c.black,26); dome(U,-1,6,c.hotpink);
    if(F(v)) U.ell(9,12,2,2,(x,y,dx,dy)=>{ const d=Math.hypot(dx,dy); if(d>1.2&&d<2.4) U.put(x,y,c.white); }); if(Sd(v)) U.ell(15,12,2,2,(x,y,dx,dy)=>{ const d=Math.hypot(dx,dy); if(d>1.2&&d<2.4) U.put(x,y,c.white); }); },
  fs_heist(U,v){ torso(U,c.red,c.red,c.dred); hands(U,c.black); legs(U,c.red,c.dred,c.black,c.ink); belt(U,c.black,26); if(F(v)) U.rect(9,19,10,26,c.black);
    if(!Bk(v)){ U.rows(7,17,(x,y,ch)=>{ if('SsdnmE'.includes(ch)) U.put(x,y,c.white); }); eyes(U,v,c.ink); stache(U,v,c.black); if(F(v)){ U.put(5,13,c.black); U.put(14,13,c.black); U.rect(7,16,12,16,c.red); } } hair(U,c.black,c.ink); },
  fs_deadpool(U,v){ mask(U,v,c.red,c.dred,null); torso(U,c.red,c.red,c.dred); U.rows(19,26,(x,y,ch)=>{ if((ch===c.red||ch===c.dred)&&(x<=4||x>=15)) U.put(x,y,c.black); }); hands(U,c.black); legs(U,c.red,c.dred,c.black,c.ink); belt(U,c.black,26);
    if(F(v)){ U.rect(3,9,8,13,c.black); U.rect(11,9,16,13,c.black); U.rect(5,11,6,11,c.white); U.rect(13,11,14,11,c.white); U.put(9,26,c.gold); U.put(10,26,c.gold); } if(Sd(v)){ U.rect(9,9,12,13,c.black); U.rect(14,9,17,13,c.black); U.put(10,11,c.white); U.put(15,11,c.white); }
    if(Bk(v)){ for(let i=0;i<10;i++){ U.put(5+i,26-i,c.silver); U.put(14-i,26-i,c.silver); } } },
  fs_batgirl(U,v){ mask(U,v,c.purple,c.dpurple,'E',1,10); torso(U,c.dpurple,c.purple,c.dpurple); chest(U,v,[[7,21],[8,21],[9,22],[10,22],[11,21],[12,21]],c.yellow); belt(U,c.yellow,26); hands(U,c.purple); legs(U,c.dpurple,c.purple,c.purple,c.dpurple);
    pair(U,v,[[6,0],[6,-1],[7,0]],c.purple); hair(U,c.red,c.dred); if(Sd(v)) for(let y=9;y<=22;y++) U.rect(0,y,3,y,c.red); cape(U,v,c.dpurple,c.purple); },
  fs_ninjaturtle(U,v){ skinTo(U,c.green,c.dgreen); bare(U,v,c.lime); torso(U,c.lime,c.lime,c.green); if(Bk(v)) U.rect(4,19,15,26,c.brown); if(Sd(v)) U.rect(3,19,6,26,c.brown); legs(U,c.green,c.dgreen,c.green,c.dgreen); hands(U,c.green); bald(U); skinTo(U,c.green,c.dgreen);
    const [l,r]=U.span(11); U.rect(l,10,r,12,c.blue); eyes(U,v,c.white,1); if(Sd(v)) U.rect(l-3,11,l-1,14,c.blue); belt(U,c.brown,26); },
  fs_mulan(U,v){ torso(U,c.red,c.red,c.dred); U.rows(19,26,(x,y,ch)=>{ if(ch===c.red&&(x===9||x===10)) U.put(x,y,c.gold); }); belt(U,c.gold,24); U.rows(27,33,(x,y,ch)=>{ if('PpUjFf'.includes(ch)) U.put(x,y,y>31?c.black:c.dred); }); hair(U,c.black,c.ink); U.ell(Sd(v)?5:9,-1,2,2,(x,y)=>U.put(x,y,c.black)); U.put(Sd(v)?5:9,-1,c.gold); } };
Object.assign(H.C,C);
window.FSETS=Object.keys(C);
})();
