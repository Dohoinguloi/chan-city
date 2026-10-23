/* Chande Bootcamp — dữ liệu map, nhân vật, nhiệm vụ.
   Map 1 "Chande Bootcamp" dựng theo mặt bằng thật của Ké Retreat (Đà Bắc, Hoà Bình):
   hồ Hoà Bình phía Nam → đường ven hồ → Cổng → khu dưới (Nhà Ngói, Nhà Rếch 1-2-3, bể bơi, Lều 1-2)
   → Đường bộ lên đồi (~10 phút) → khu trên (Nhà ăn, Deck ngắm cảnh, Bể bơi dự kiến, Nhà Ngủ 1-2-3,
   Nhà Chiềng 1-2, Nhà Mái Đá) → Nền khu cắm trại. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;

/* ---------- Phòng Mèn Mén ---------- */
// căn hộ riêng ở Hà Nội: khung nhà theo cấp (SD.homeGrid) + nội thất người chơi tự đặt (SD.HOME, server home.js). Thiếu dữ liệu thì dùng bố cục có sẵn (giống căn hộ cũ 26×16)
const FLIP=new Map();
function sprOf(d,f){ const key=d.art+'|'+JSON.stringify(d.args||[]); let s=FLIP.get(key); if(!s){ s=A[d.art](...(d.args||[])); FLIP.set(key,s); } if(!f) return s;
  let m=FLIP.get(key+'|f'); if(!m){ const c=A.cv(s.c.width,s.c.height), g=c.getContext('2d'); g.translate(s.c.width,0); g.scale(-1,1); g.drawImage(s.c,0,0); m={c,ax:s.c.width-s.ax,ay:s.ay}; FLIP.set(key+'|f',m); } return m; }
// bóng đổ mờ dưới chân đồ đứng (như game pixel đồng quê), theo bề ngang chân đồ
const SHADOW=new Map(); function shadowOf(fw){ let s=SHADOW.get(fw); if(s) return s; const w=fw*T+4, c=A.cv(w,10), g=c.getContext('2d'); g.fillStyle='rgba(20,12,10,.28)'; g.beginPath(); g.ellipse(w/2,5,w/2,4,0,0,Math.PI*2); g.fill(); s={c,ax:Math.floor(w/2),ay:5}; SHADOW.set(fw,s); return s; }
function buildRoom(home){
  const h=home||SD.homeDefault(), {W,H,g}=SD.homeGrid(h.lv||0), D=SD.HOME.items, obj=[], solid=[], inter=[]; let ph=null;
  if(A.homeTheme) A.homeTheme({f:SD.HOME.floors[h.floor]||null,w:SD.HOME.walls[h.wall]||null});
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:tx*T,y:ty*T,...o}; obj.push(it); return it; };
  h.items.forEach((it,i)=>{ const d=D[it.k]; if(!d) return; const F=SD.homeFoot(d,it), [ax,ay]=SD.homeAnchor(d,it), fl=it.f?-1:1;
    if(d.rug){ for(let y=F.y0;y<=F.y1;y++) for(let x=F.x0;x<=F.x1;x++) if(g[y]&&g[y][x]==='O') g[y][x]='M'; return; }   /* thảm ô: tô sàn thành thảm */
    const sp=sprOf(d,it.f);
    if(d.flat){ const cx=(F.x0+d.fw/2)*T, cy=(F.y0+(d.fh||1)/2)*T; obj.push({spr:sp,x:Math.round(cx-sp.c.width/2+sp.ax),y:Math.round(cy-sp.c.height/2+sp.ay),flat:true,hi:i}); }   /* đồ trải sàn: căn giữa ô chân */
    else { if(!d.wall) put(shadowOf(d.fw),ax,ay-.1,{flat:true}); put(sp,ax,ay,{flat:!!d.wall,hi:i}); }
    if(SD.homeSolid(d)) solid.push([F.x0,F.y0,F.x1,F.y1]);
    for(const [art,args,dx,dy,sk,id] of d.extra||[]){ const o=put(A[art](...args),ax+dx*fl,ay+dy,sk==='flat'?{flat:true}:{sort:(ay+sk)*T,...(id?{id,name:'Điện thoại'}:{})}); if(id==='phone') ph=o; }
    for(const a of [].concat(d.act||[])){ if(a.bed){ inter.push({id:'bed',x:ax*T,y:(ay+.2)*T,label:'Nghỉ ngơi',r:22,do:'ra',act:'nghi',bed:{x:ax,y:ay-1.6}}); continue; }
      inter.push({id:a.id||'hk'+i,x:(ax+(a.dx||0)*fl)*T,y:(ay+(a.dy||0))*T,label:a.label,r:22,...(a.do?{do:a.do}:{}),...(a.act?{act:a.act}:{}),...(a.say?{say:a.say}:{}),...(it.k==='bon_tam'?{bath:1}:{})}); } });
  put(A.doorTile(),12.5,H,{id:'door',flat:true}); inter.push({id:'door',x:12.5*T,y:(H-.7)*T,label:'Ra cửa (gọi Grab)',r:22,do:'grab'});
  return {name:h.name?'Nhà của '+h.name+' · Hà Nội':'Căn hộ của bạn · Hà Nội',W,H,grid:g,obj,solid,inter,spawn:{x:12.5*T,y:12.5*T},indoor:true,phone:ph,music:'music_room',home:h};
}

/* ---------- Map 1: Chande Bootcamp (Ké Retreat) ---------- */
function buildRetreat(){
  // map mở rộng 340×240 ô: Ké Retreat ở góc Tây Bắc (x<72, y<100), thị trấn + chùa + vườn quốc gia phía Đông, làng Mường bên kia hồ
  const W=340, H=124, g=Array.from({length:H},()=>Array(W).fill('F'));
  // nhà dân thị trấn xếp thành dãy: dãy Bắc quay ra phố y=73, dãy Nam quay ra phố y=83 (chừa chỗ ủy ban, trường, chợ, bưu điện, sân bóng, khách sạn)
  const ROOFS=['tile','tile_blue','tile_green','thatch','tile_purple','stone','tile_teal'], WALLS=['ochre','cream','white','pink','mint','yellow','brick'];
  const TOWN_HOUSES=[...[76,82,88,94,100,106,166,172,178,184,190].map((x,i)=>[x,66,ROOFS[i%7],WALLS[(i*3)%7]]),...[76,82,98,104,110,166,172,178,184,190,196].map((x,i)=>[x,78,ROOFS[(i+3)%7],WALLS[(i*2+1)%7]])];
  const set=(x,y,t)=>{ if(x>=0&&y>=0&&x<W&&y<H) g[y][x]=t; };
  const get=(x,y)=>x>=0&&y>=0&&x<W&&y<H?g[y][x]:'F';
  const rect=(x0,y0,x1,y1,t,only)=>{ x0=Math.round(x0); x1=Math.round(x1); for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(!only||only.includes(get(x,y))) set(x,y,t); };
  const ell=(cx,cy,rx,ry,t,only)=>{ for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
    const d=((x-cx)/rx)**2+((y-cy)/ry)**2; if(d<=1&&(!only||only.includes(get(x,y)))) set(x,y,t); } };
  const line=(pts,w,t,only)=>{ for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i],[bx,by]=pts[i+1], n=Math.ceil(Math.hypot(bx-ax,by-ay)*3);
    for(let k=0;k<=n;k++){ const x=ax+(bx-ax)*k/n, y=ay+(by-ay)*k/n; for(let dy=-w;dy<=w;dy++) for(let dx=-w;dx<=w;dx++){ if(dx*dx+dy*dy>w*w+.5) continue;
      const X=Math.round(x+dx), Y=Math.round(y+dy); if(!only||only.includes(get(X,Y))) set(X,Y,t); } } } };

  // hồ Hoà Bình + bờ cát + dải cỏ ven hồ + đường ven hồ
  const shore=x=>100+Math.round(1.4*Math.sin(x*.33)+.8*Math.sin(x*.11+1)+(x>50?1:0))+(x>=72?3:x>=66?Math.round((x-65)/2):0);   // từ thị trấn trở đi đường ven hồ rộng gấp đôi nên bờ hồ lùi xuống
  const shore2=x=>118+Math.round(1.6*Math.sin(x*.13)+1.1*Math.sin(x*.37+2));          // bờ Nam của hồ
  for(let x=0;x<W;x++){ const s=shore(x), s2=shore2(x); for(let y=98;y<H;y++) set(x,y,y<s?'G':y===s?'D':y<s2?(y-s>=4&&s2-y>=4?'o':'W'):y===s2?'D':'G'); }
  rect(0,95,W-1,97,'R'); rect(68,98,W-1,100,'R');                                   // đoạn qua thị trấn: 6 làn
  rect(54,98,67,104,'R'); rect(54,105,67,105,'D');                                 // bãi đỗ ô tô trước cổng Ké (xe Chika Phú, xe 4 bánh, xe tải Optimus đỗ ở đây cho khỏi vướng đường)
  // bến xuống hồ: bậc đá + cầu gỗ
  rect(42,98,43,shore(42)-1,'T'); rect(42,shore(42),43,shore(42),'T'); rect(42,shore(42)+1,43,shore(42)+5,'Q');

  // hàng rào kè đá + cổng
  rect(29,94,48,94,'X'); rect(38,94,40,94,'P');
  // khu dưới
  ell(38,84,11,10.5,'G'); ell(30,74.5,6,4,'G'); ell(37,93,8,1.4,'G');
  // đường bộ chính từ cổng lên khu cắm trại
  const MAIN=[[39,95],[39,91],[38,86],[37,81],[36,76],[34,72],[32,67],[30,62],[28,58],[26,54],[23,51],[20,48],[21,45.5],[26,44.8],[31,44.6],[36,44],[41,43.5],[46,43],[51,42],[55,40],[56.5,36],[56,32],[54,29.5],[51,28.5]];
  line(MAIN,1,'P');
  line(MAIN.slice(5,10),1,'T',['P']);                                   // đoạn bậc đá giữa rừng
  // khu trên
  ell(32,37.5,13,6,'G'); ell(44,36.5,5.5,5,'G'); ell(23,38,4,4,'G');
  line([[36,44],[37,40.5],[38.5,37],[38.5,32.5]],1,'P');
  line([[38.5,38],[41,40.5],[45,42.5]],1,'P');
  line([[29,40],[26,40.5],[23,40]],0,'P');
  ell(30,38.5,4.5,3.2,'S');                                              // Bể bơi dự kiến (nền đá)
  rect(20,40,27,42,'K');                                                 // Deck ngắm cảnh
  // nền khu cắm trại
  rect(45,25,55,30,'C'); line([[54,30],[55,32]],1,'P');
  // kè đá chắn taluy dưới đường vòng
  for(let x=24;x<=45;x++) if(get(x,47)==='F') set(x,47,'X');
  for(let x=26;x<=36;x++) if(get(x,70)==='F'&&x%3) set(x,70,'X');

  // bể bơi khu dưới: deck gỗ, viền đá, nước
  // nới rộng gấp 8 về bên trái: nước x 11–34 (24 ô), y 77–83
  rect(9,75,36,85,'K'); rect(10,76,35,84,'E'); rect(11,77,34,83,'L');

  // mặt tiền cổng: quán cơm + cafe (phía Tây), tiệm nông sản + shop quần áo (phía Đông), vườn rau sau tiệm
  rect(1,87,27,94,'G',['F']); rect(47,75,67,94,'G',['F']); line([[54,94],[54,86]],0,'P');
  // vườn sườn đồi phía Tây + sân gà Ké, vườn phía Đông (mở trong rừng)
  rect(2,61,15,74,'G',['F']); rect(2,74,8,86,'G',['F']); line([[31,65],[22,65],[15,65],[14,65]],0,'P');
  rect(57,42,68,58,'G',['F']); line([[56,41],[58,46],[62,50],[62,51]],0,'P');
  // đường mòn xuyên rừng nối các vườn rau với đường bộ chính
  for(const pts of [[[28,58],[38,57],[48,56],[57,55]],[[62,58],[62,66],[60,75]],[[35,74],[44,72],[50,74],[54,76]]]) line(pts,0,'P',['F','G']);
  for(const p of SHARED.FARM.plots) set(Math.floor(p.x),Math.floor(p.y),'Y');
  // Nhà giải trí cạnh Deck ngắm cảnh + lối gỗ từ Deck sang cửa
  rect(11,36,19,44,'G',['F']); rect(15,42,19,43,'K');
  // nhà tắm chung cạnh khu cắm trại
  rect(55,24,59,30,'G',['F']);
  // ===== khu mở rộng =====
  // thị trấn Đà Bắc dọc đường ven hồ (phía Đông Ké): vỉa hè, phố phụ lên chùa
  rect(72,60,206,94,'G',['F']); rect(72,93,206,94,'S'); for(let x=74;x<=206;x+=34) line([[x,92],[x,66]],1,'P');
  line([[72,73],[206,73]],1,'P',['F','G']); line([[72,83],[163,83]],1,'P',['F','G']); line([[177,83],[206,83]],1,'P',['F','G']);
  for(const [x,y] of TOWN_HOUSES) line([[x+2,y+3],[x+2,y+3<=73?73:83]],1,'P',['F','G']);
  line([[56,32],[70,34],[90,40],[110,44],[128,46],[141,48]],1,'P',['F','G']);                                   // đường rừng từ khu cắm trại sang chùa
  line([[155,48],[175,52],[195,58],[206,64]],1,'P',['F','G']); line([[206,64],[209,76],[209,90]],1,'P',['F','G']);   // chùa → thị trấn → cổng vườn
  // chùa trên đồi phía Bắc thị trấn: bậc đá từ đường lên sân chùa
  rect(136,26,162,58,'G',['F']); line([[148,92],[148,58]],2,'P',['F','G']); line([[148,92],[148,53]],0,'T'); rect(141,46,155,52,'S');
  // vườn quốc gia phía Đông: tường đá bao quanh, cổng ở cạnh Nam sát đường
  const Pk=SHARED.PARK, GX=Pk.gate; for(let x=Pk.x0;x<=Pk.x1;x++){ set(x,Pk.y0,'X'); if(Math.abs(x+.5-GX)>2.6) set(x,Pk.y1,'X'); } for(let y=Pk.y0;y<=Pk.y1;y++){ set(Pk.x0,y,'X'); set(Pk.x1,y,'X'); }
  for(const [cx,cy,rx,ry] of [[240,68,10,6],[272,46,13,7],[282,36,7,4],[258,60,6,4],[318,48,8,6],[306,64,7,5],[282,80,9,5],[226,84,8,5],[322,28,7,5],[262,20,9,6],[230,40,10,7]]) ell(cx,cy,rx,ry,'G',['F']);
  line([[300,3],[296,14],[304,30],[296,46],[304,62],[298,78],[302,92]],1,'W');                    // suối chảy qua vườn
  rect(207,93,Pk.x0-1,94,'S'); rect(Pk.x0,94,W-1,94,'S'); rect(GX-2.5,93,GX+1.5,93,'S');                            // vỉa hè dọc tường + nền cổng
  ell(GX,89,5,3.5,'G',['F']); line([[GX-.5,92],[GX-.5,88]],1,'P',['F','G']);                                  // bãi cỏ trống sau cổng, lối vào
  const loop=[[GX-.5,88],[222,84],[232,76],[245,70],[258,62],[268,50],[280,40],[288,28],[300,18],[315,14],[326,26],[322,44],[310,56],[314,64],[308,74],[300,74],[292,78],[270,84],[250,86],[232,88],[GX+1.5,89]];
  line(loop,1,'P',['F','G']); for(const [x,y] of [[300,18],[300,74]]) for(let yy=y-1;yy<=y+1;yy++) for(let xx=x-7;xx<=x+7;xx++) if(get(xx,yy)==='W'||Math.abs(xx-x)<=2) set(xx,yy,'Q');   // cầu gỗ phủ hết bề ngang suối
  for(const sp of Pk.spots) rect(Math.floor(sp.x)-1,Math.floor(sp.y),Math.floor(sp.x)+1,Math.floor(sp.y)+1,'C');   // nền trạm quan sát
  for(let x=300;x<=311;x++){ set(x,60,'X'); set(x,69,'X'); } for(let y=60;y<=69;y++){ set(300,y,'X'); set(311,y,'X'); } set(305,69,'X');   // khu hổ có tường
  // cầu gỗ qua hồ sang làng Mường bên kia hồ; ruộng bậc thang + đường làng
  const BRIDGES=[24,110,190,262,322]; for(const x of BRIDGES) rect(x-2,x<68?98:101,x+3,Math.max(...[0,1,2,3,4,5].map(k=>shore2(x-2+k)))+1,'Q');   // cầu rộng 6 ô cho dễ đi
  for(const x of BRIDGES) rect(x-2,Math.max(...[0,1,2,3,4,5].map(k=>shore2(x-2+k)))+2,x+3,Math.max(...[0,1,2,3,4,5].map(k=>shore2(x-2+k)))+4,'P',['F','G','p','D','W']);
  // ===== lấp đất trống: đường mòn nối nhau (tự bắc cầu khi qua nước), suối + guồng nước ở làng, sân, quảng trường, rừng =====
  const trail=(pts,w=1)=>{ line(pts,w,'P',['F','G','p','C']); line(pts,1,'Q',['W']); };
  const free=(x0,y0,x1,y1,ok=['G','p'])=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(!ok.includes(get(x,y))) return false; return true; };
  const EXTRA_INTER=[], EXTRA_ZONES=[];
  const spot=(x,y,label,lines,r=26)=>EXTRA_INTER.push({x:x*T,y:y*T,label,r,say:lines});
  // Ké ↔ thị trấn (từ cổng Đông vườn rau Ké sang phố)
  line([[67,80.5],[70,81],[72,83]],1,'P',['F','G']);
  // thị trấn: sân trường, chợ, sân bóng, quảng trường đài phun nước, bến xe
  rect(129,64,140,71,'C'); line([[134,71],[134,73]],1,'P',['G']);
  rect(151,65,164,71,'S'); line([[157,71],[157,73]],1,'S',['G','P']);
  rect(114,64,122,66,'S'); line([[118,66],[118,73]],1,'S',['G','P']);
  line([[199.5,65],[199.5,73]],1,'P',['G']); line([[91,79],[91,83]],1,'P',['G']); line([[157,81],[157,83]],1,'P',['G']);
  rect(118,74,134,82,'A'); rect(137,85,145,91,'S'); rect(178,85,205,91,'S');
  // rừng phía Bắc: thác + hồ nhỏ, đồi chè, chòi canh, bãi cắm trại rừng (mỗi chỗ có lối mòn từ đường rừng)
  ell(100,20,12,9,'G',['F']); ell(100,19,8,5.5,'D',['G']); ell(100,19,6,4,'W',['D']); trail([[90,40],[96,30],[100,25]]);
  rect(112,8,132,22,'G',['F']); trail([[110,44],[118,30],[122,23]]);
  ell(185,22,6,5,'G',['F']); trail([[175,52],[180,36],[185,27]]);
  ell(200,40,8,5,'G',['F']); trail([[195,58],[200,46]]);
  trail([[100,25],[112,16]]); trail([[132,16],[150,20],[170,22],[180,22]]); trail([[190,24],[200,35]]);
  // ===== đường rừng núi đi tắt đan xen (24/10): lối mòn ngoằn ngoèo nối các khu rừng, mỏm đá, bãi trống có người ở (15 NPC nhiệm vụ ẩn Lính Cát) =====
  const wind=(pts,amp=1.6)=>{ const out=[]; for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i],[bx,by]=pts[i+1], n=Math.max(2,Math.round(Math.hypot(bx-ax,by-ay)/4)), nx=-(by-ay), ny=bx-ax, L=Math.hypot(nx,ny)||1;
    for(let k=0;k<n;k++){ const t=k/n, w=k?Math.sin((i*n+k)*1.3)*amp:0; out.push([ax+(bx-ax)*t+nx/L*w,ay+(by-ay)*t+ny/L*w]); } } out.push(pts[pts.length-1]); return out; };   /* lắc lư như lối mòn thật, đầu mút giữ nguyên để nối khớp */
  for(const n of SHARED.LCFOREST.npcs) ell(n.x,n.y+.5,3.4,2.6,'G',['F']);                                                    // bãi trống chỗ NPC rừng đứng
  const FOREST_TRAILS=[[[76,54],[82,46],[78,40],[84,30],[80,22],[86,12],[92,5]],[[90,40],[94,48],[104,52],[116,50],[124,54],[132,52]],[[104,52],[104,55]],[[110,44],[106,36],[112,30],[108,24]],[[128,46],[132,38],[128,30],[134,24]],
    [[162,40],[170,34],[176,40],[184,36],[192,30],[198,22],[202,12]],[[163,52],[172,47],[180,48],[188,44],[196,48],[202,52]],[[170,22],[174,14],[168,8],[176,4]],[[136,40],[130,44]],
    [[8,30],[14,22],[10,14],[18,8],[30,6],[40,10],[51,14]],[[24,30],[28,22],[36,16],[44,22],[51,20]],[[60,20],[64,12],[58,6]],[[62,30],[66,24],[66,8]],[[4,58],[8,50],[4,42],[10,36],[8,30]],
    [[226,70],[230,58],[240,48],[230,40],[240,30],[232,20],[244,12]],[[258,60],[248,50],[256,40],[264,32]],[[310,56],[320,62],[326,72],[318,84]],[[292,58],[296,48]]];
  for(const pts of FOREST_TRAILS) trail(wind(pts));
  EXTRA_ZONES.push({name:'Lối mòn Thông Reo',x0:73,y0:3,x1:92,y1:55},{name:'Dốc Đá Xám',x0:124,y0:23,x1:135,y1:46},{name:'Đường mòn Sơn Ca',x0:163,y0:3,x1:203,y1:34},{name:'Rừng trúc Ké',x0:3,y0:3,x1:68,y1:22},
    {name:'Trung tâm Lính Cát',x0:163,y0:33,x1:181,y1:55});
  // Trung tâm Lính Cát cạnh Khu tâm linh: bãi rộng, sân lát đá, lối sang sân chùa + xuống đường Hà Phạm
  rect(163,33,181,55,'G',['F']); rect(164,45,178,50,'C'); line([[163,47.5],[156,48]],1,'P',['F','G']); line([[171,50],[171,55]],1,'P',['F','G']);
  // 15 CLB Lính Cát ở chỗ vắng (rừng phía Bắc, vườn quốc gia, xa khu dân cư): bãi trống, sân lát đá giữa lối mòn · Tế đàn Rồng Thần trên thác Đà Bắc
  const LCCB=SHARED.LCCLUB, CLUB_SITES=[...LCCB.gyms.map(g0=>({x:g0.x,y:g0.y,t:g0.t,name:'Võ đài CLB '+SHARED.LC_TYPES[g0.t].name})),...LCCB.train.map(t0=>({x:t0.x,y:t0.y,t:'',name:t0.name}))];
  for(const c of CLUB_SITES){ ell(c.x,c.y,6.5,4.6,'G',['F']); rect(c.x-4,c.y-1,c.x+4,c.y+2,'C'); EXTRA_ZONES.unshift({name:c.name,x0:c.x-6,y0:c.y-4,x1:c.x+6,y1:c.y+4}); }
  { const A0=SHARED.LINHCAT.dragon.altar, ax=Math.floor(A0.x), ay=Math.floor(A0.y); ell(A0.x,A0.y+1,6,4.4,'G',['F']); rect(ax-3,ay+1,ax+3,ay+3,'C'); EXTRA_ZONES.unshift({name:'Tế đàn Rồng Thần',x0:ax-6,y0:ay-4,x1:ax+6,y1:ay+5}); }
  // vườn quốc gia: lối tắt nối các trạm quan sát + đường vòng sát tường
  for(const pts of [[[GX-.5,88],[226,70],[238,56],[250,40],[262,26],[276,14],[300,10],[315,14]],[[270,48],[290,48],[318,48]],[[257,60],[270,72],[282,80]],[[282,80],[294,70],[305,72]],[[281,38],[300,30],[325,28]],
    [[216,7],[331,7]],[[331,7],[331,90]],[[216,7],[216,84]],[[238,70],[226,70]]]) trail(pts,1);
  // đường vành đai rộng 3 ô chạy quanh 4 cạnh map (qua hồ, suối thì thành cầu) + lối nối từ các khu ra vành đai: không còn ngõ cụt
  const ring=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const t=get(x,y); set(x,y,t==='W'||t==='o'?'Q':'R'); } };
  ring(0,0,W-1,2); ring(0,H-3,W-1,H-1); ring(0,0,2,H-1); ring(W-3,0,W-1,H-1);
  // 6 trục đường lớn 4 làn chia map thành các ô phố, mỗi đường có tên
  const ROADS=[{name:'Đường Thuỵ Khuê',sign:'DUONG THUY KHUE',r:[0,95,W-1,97]},{name:'Đường Long Biên',sign:'DUONG LONG BIEN',r:[69,3,72,94]},{name:'Đường Red Type',sign:'DUONG RED TYPE',r:[204,3,207,92]},
    {name:'Đường Hà Phạm',sign:'DUONG HA PHAM',r:[73,56,203,59]}];
  for(const R of ROADS.slice(1)){ const [x0,y0,x1,y1]=R.r; for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const t=get(x,y); if(t==='X'||t==='B') continue; set(x,y,t==='W'||t==='o'?'Q':'R'); } }
  EXTRA_ZONES.unshift(...ROADS.map(R=>({name:R.name,x0:R.r[0],y0:R.r[1],x1:R.r[2],y1:R.r[3]})),{name:'Đường vành đai',x0:0,y0:0,x1:W-1,y1:2},{name:'Đường vành đai',x0:0,y0:H-3,x1:W-1,y1:H-1},{name:'Đường vành đai',x0:0,y0:0,x1:2,y1:H-1},{name:'Đường vành đai',x0:W-3,y0:0,x1:W-1,y1:H-1});
  for(let x=262;x<=264;x++) set(x,Pk.y0,'P'); for(let y=46;y<=48;y++) set(Pk.x1,y,'P');                               // cổng phụ phía Bắc, phía Đông vườn quốc gia
  for(const pts of [[[51,28],[50,14],[51,3]],[[80,37],[80,3]],[[100,11],[100,3]],[[122,8],[122,3]],[[148,26],[148,3]],[[185,17],[185,3]],[[263,3],[263,7]],[[336,47],[331,47]]]) trail(pts,1);
  EXTRA_ZONES.push({name:'Thác Đà Bắc',x0:88,y0:10,x1:112,y1:30},{name:'Đồi chè',x0:112,y0:8,x1:132,y1:22},{name:'Chòi canh rừng',x0:179,y0:17,x1:191,y1:27},{name:'Bãi cắm trại rừng',x0:192,y0:35,x1:208,y1:45},
    {name:'Sân bóng thị trấn',x0:118,y0:74,x1:134,y1:82},{name:'Quảng trường Đà Bắc',x0:137,y0:85,x1:145,y1:91},{name:'Bến xe Đà Bắc',x0:178,y0:85,x1:205,y1:91},{name:'Chợ Đà Bắc',x0:151,y0:60,x1:164,y1:71},
    {name:'Trường tiểu học Đà Bắc',x0:129,y0:60,x1:140,y1:71});
  // nhà (ô 'B' = chân nhà, không đi qua được)
  const B=[];
  const bld=(name,x0,y0,x1,y1,o)=>{ rect(x0,y0,x1,y1,'B'); B.push({name,x0,y0,x1,y1,o}); };
  bld('Nhà Ngói',33,88,37,91,{roof:'tile',wall:'ochre',doors:[30],windows:[8,52],stoneBase:true});
  bld('Nhà Rếch 1',41,90,45,92,{roof:'thatch',wall:'wood',doors:[34],windows:[8],stilt:true});
  bld('Nhà Rếch 2 (Cộng đồng)',40,85,45,88,{roof:'thatch',wall:'wood',open:true,stilt:true,rail:true});
  bld('Nhà Rếch 3',40,80,43,82,{roof:'thatch',wall:'wood',doors:[24],windows:[6],stilt:true});
  bld('Nhà ăn khu trên',22,35,26,38,{roof:'thatch',wall:'wood',open:true,tables:true});
  bld('Nhà Ngủ 1·2·3',32,32,37,34,{roof:'thatch',wall:'ochre',doors:[8,40,72],windows:[24,56]});
  bld('Nhà Chiềng 1',41,33,43,35,{roof:'thatch',wall:'wood',doors:[18],windows:[4],rail:true,stoneBase:true});
  bld('Nhà Chiềng 2',44,33,46,35,{roof:'thatch',wall:'wood',doors:[18],windows:[4],rail:true,stoneBase:true});
  bld('Nhà Mái Đá',42,37,45,39,{roof:'stone',wall:'stone',doors:[26],windows:[8]});
  bld('Tiệm nông sản Ké',49,89,53,91,{shop:true,roof:'tile',wall:'ochre',doors:[30],windows:[6,50],sign:'NONG SAN',awning:'#5a8d64'});
  bld('Shop Chande',55,89,59,91,{shop:true,roof:'tile',wall:'stone',doors:[30],windows:[6,50],sign:'SHOP',awning:'#c4382e'});
  bld('Quán cơm Ven Hồ',16,89,20,91,{shop:true,roof:'thatch',wall:'wood',open:true,tables:true,sign:'QUAN COM'});
  bld('Cafe Bến Hồ',22,89,26,91,{shop:true,roof:'thatch',wall:'wood',open:true,tables:true,sign:'CAFE',awning:'#3f6e9a'});
  bld('Nhà giải trí',13,38,18,41,{shop:true,roof:'stone',wall:'stone',doors:[40],windows:[8,70],sign:'GIAI TRI',awning:'#8c231f'});
  bld('Nhà tắm chung',56,26,57,27,{shop:true,roof:'thatch',wall:'wood',doors:[8],sign:'TAM'});
  bld('Đồn công an Đà Bắc',3,89,8,91,{shop:true,roof:'tile',wall:'ochre',doors:[40],windows:[8,70],sign:'CONG AN',signBg:'#c4382e',signFg:'#ffd84a'});
  // thị trấn: thuê xe, cafe, siêu thị, net, quán nhậu, bảo tàng; chùa; nhà sàn làng Mường
  bld('Tiệm thuê xe máy',61,89,65,91,{shop:true,roof:'tile',wall:'stone',doors:[30],windows:[6,50],sign:'THUE XE',awning:'#f2c43d'});
  bld('Cafe Đà Bắc',78,89,82,91,{shop:true,roof:'tile',wall:'ochre',doors:[30],windows:[6,50],sign:'CAFE',awning:'#3f6e9a'});
  bld('Siêu thị Đà Bắc',86,88,96,91,{shop:true,roof:'stone',wall:'stone',doors:[80],windows:[10,40,120,150],sign:'SIEU THI',awning:'#e04848'});
  bld('Tiệm net Cỏ',100,89,104,91,{shop:true,roof:'tile',wall:'stone',doors:[30],windows:[6,50],sign:'NET',awning:'#2a2a30'});
  bld('Phòng Bay',180,60,187,63,{shop:true,roof:'stone',wall:'stone',doors:[56],windows:[10,100],sign:'PHONG BAY',awning:'#a259ff'});   /* sàn nhảy Audition: nhà riêng ở phố Đà Bắc, cửa nhìn ra vỉa hè */
  bld('Quán nhậu đặc sản Mường',108,88,115,91,{shop:true,roof:'thatch',wall:'wood',open:true,tables:true,sign:'QUAN NHAU'});
  bld('Trại ngựa Đà Bắc',156,84,163,86,{shop:true,roof:'thatch',wall:'wood',doors:[56],windows:[10,90],sign:'TRAI NGUA',awning:'#8a5a36'});
  // nhà dân trong thị trấn
  for(const [x,y,r,w] of TOWN_HOUSES) bld('Nhà dân',x,y,x+4,y+2,{roof:r,wall:w,doors:[30],windows:[8,52]});
  bld('Bảo tàng lịch sử Hoà Bình',124,84,136,91,{shop:true,roof:'stone',wall:'stone',doors:[96],windows:[12,40,150,180],sign:'BAO TANG',awning:'#8a3a2a'});
  // công trình thị trấn mới
  bld('UBND xã Đà Bắc',114,60,122,63,{roof:'tile',wall:'yellow',doors:[65],windows:[10,28,100,118],sign:'UBND XA DA BAC',stoneBase:true});
  bld('Trường tiểu học Đà Bắc',129,60,140,63,{roof:'tile_blue',wall:'cream',doors:[89],windows:[10,26,42,58,118,134,150,166],sign:'TRUONG TIEU HOC'});
  bld('Chợ Đà Bắc',152,61,163,64,{roof:'tile_green',wall:'white',open:true,tables:true,sign:'CHO DA BAC'});
  bld('Trung tâm Lính Cát',164,39,177,44,{shop:true,roof:'tile',wall:'white',doors:[100],windows:[14,38,62,138,162,186],sign:'TRUNG TAM LINH CAT',signBg:'#d23a2e',signFg:'#ffffff',awning:'#d23a2e'});
  bld('Trạm y tế xã',196,61,203,64,{roof:'tile',wall:'white',doors:[57],windows:[10,96],sign:'TRAM Y TE',awning:'#2f9a52'});
  bld('Bưu điện Đà Bắc',87,75,95,78,{roof:'tile',wall:'yellow',doors:[65],windows:[12,36,96,116],sign:'BUU DIEN',awning:'#f2c43d'});
  bld('Khách sạn Đà Bắc',152,75,162,80,{roof:'tile_purple',wall:'brick',doors:[81],windows:[10,26,42,58,112,128,144],sign:'KHACH SAN',awning:'#7a52b0',wallH:30});
  const tents=[{name:'Lều 1',x0:30,y0:72,x1:32,y1:74},{name:'Lều 2',x0:24,y0:71,x1:26,y1:73}];
  for(const t of tents) rect(t.x0,t.y0,t.x1,t.y1,'B');

  // ---- đồ vật
  const obj=[], solid=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  for(const b of B){ const w=(b.x1-b.x0+1)*T-4, h=(b.y1-b.y0+1)*T;
    put((b.o.shop?A.shop:A.house)({w,wallH:22,roofH:Math.max(22,h-14),...b.o}),(b.x0+b.x1+1)/2,b.y1+1,{name:b.name,house:true}); }
  put(A.tent({w:44,flag:'#c4382e'}),31.5,75,{name:'Lều 1'}); put(A.tent({w:44,flag:'#3f7a8a'}),25.5,74,{name:'Lều 2'});
  put(A.gate(),39.5,95,{name:'Cổng',front:true});
  for(const [x,c] of [[47,'#e07a3c'],[50,'#5a8d64'],[53,'#3f7a8a']]){ put(A.platform(),x+.5,27.6); put(A.domeTent(c),x+.5,27.2); solid.push([x,26,x,26]); }
  // bể bơi: ô dù + ghế nằm + cây lá to như ảnh
  // ô dù, ghế nằm dọc mép dưới bể; cây lá to ở 4 góc
  for(const x of [13,18,23,28]){ put(A.umbrella(),x+.5,86.2); put(A.lounger(),x+2,86.6); }
  for(const [x,y] of [[8.5,76],[8.4,85.4],[37.6,76.5],[37.4,85]]) { put(A.bigleaf(x*7|0),x,y); solid.push([Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1]); }
  // khu dưới
  put(A.bench(),35,93.6); put(A.table(),46.5,84.6); put(A.table(),46.5,87.4);
  for(const [x,y] of [[33,87.6],[37.9,87.4],[40.5,89.6],[44.6,79.6]]) put(A.potPlant(),x,y);
  for(const [x,y] of [[36.5,79],[41.3,93],[36.5,73.5],[34.2,70.2]]) put(A.lamp(),x,y);
  const fire=put(A.bonfire(false),30.5,89.4,{id:'bonfire'}); solid.push([30,88,30,88]);
  // khu trên
  put(A.table(),24.5,40.9); solid.push([24,40,24,40]); put(A.bench(),22.2,42.4); put(A.bench(),26.4,42.4);
  for(const [x,y] of [[31.4,35.1],[38.2,35.2],[41,36.8],[46.8,36.4],[27.2,35.7]]) put(A.potPlant(),x,y);
  for(const [x,y] of [[29,42.3],[36.7,41.5],[40.5,41.8],[33.6,36.5]]) put(A.lamp(),x,y);
  put(A.bench(),31,64.8); put(A.bench(),27,56.6);                         // nghỉ chân dọc bậc đá
  // ven hồ
  put(A.kayak(),46.5,99.6); put(A.kayak(),48.8,100.2); put(A.bench(),37,98.8);
  // xe 4 bánh: dưới cổng và trên bãi đỗ cạnh Nhà Mái Đá
  { const M=SHARED.MCK, A0=M.arena, cx=(A0.x0+A0.x1)/2, cy=(A0.y0+A0.y1)/2;   // đấu trường MCK ở góc rừng Tây Bắc: sân đá bầu dục, sân khấu, đèn, lối mòn xuống Nhà ăn khu trên
    ell(cx,cy+1,(A0.x1-A0.x0)/2,(A0.y1-A0.y0)/2,'S',['F','G']); line([[cx,A0.y1],[cx+.5,M.gate.y],[21,31.5]],1,'P',['F','G']);
    put(A.mckStage(),M.stage.x,M.stage.y+1.6); solid.push([Math.round(M.stage.x)-4,Math.round(M.stage.y)-1,Math.round(M.stage.x)+4,Math.round(M.stage.y)]);
    for(const [x,y,c] of [[A0.x0+2,cy-4,'#ff4fa3'],[A0.x1-2,cy-4,'#7fe0ff'],[A0.x0+3,cy+6,'#ffd84a'],[A0.x1-3,cy+6,'#5fe06a']]){ put(A.stageLight(c),x,y); solid.push([Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1]); }
    put(A.label('DAU TRUONG MCK','#3a2a5a','#ff4fa3'),cx+.5,A0.y1+1.4,{flat:true}); EXTRA_ZONES.push({name:'Đấu trường MCK',x0:A0.x0,y0:A0.y0,x1:A0.x1,y1:A0.y1}); }
  { const Q=SHARED.YENLANG.pho; put(A.stall('#c4382e',['#f4ead8','#e8b860','#5fae46']),Q.x-1,Q.y-.8); solid.push([Math.floor(Q.x)-2,Math.floor(Q.y)-2,Math.floor(Q.x),Math.floor(Q.y)-2]); put(A.label('PHO CHI THAO','#8c231f','#fff3d6'),Q.x-1,Q.y-3.2,{flat:true}); }   // quán phở chị Thảo trong ngõ
  put(A.parkingLines(3,2,72,46),54.4,98.2,{flat:true}); put(A.parkSign(),67.4,98.6); solid.push([67,97,67,97]);
  const carLow=put(A.car(),SHARED.CARS.car_low.x,SHARED.CARS.car_low.y-.6,{id:'car_low',name:'Xe 4 bánh'}), carTop=put(A.car(),49.5,42.2,{id:'car_top',name:'Xe 4 bánh'});
  rect(48,40,51,41,'G',['F']); solid.push([48,41,50,41]);   /* xe dưới đã dời sang bãi đỗ (CARS.car_low): bỏ ô chặn cũ giữa đường ven hồ */
  // vườn rau Ké: hàng rào gỗ, chừa lối vào ở giữa phía Nam
  // cửa vào vườn: giữa cạnh dưới (x 54), cạnh trên (x 57–58), cạnh trái (y 83–84), cạnh phải (y 80–81)
  for(let x=48;x<=67;x++){ if(x!==57&&x!==58){ put(A.fence(false),x+.5,76.2); solid.push([x,76,x,76]); } if(x!==54){ put(A.fence(false),x+.5,86.2); solid.push([x,86,x,86]); } }
  for(let y=77;y<=85;y++){ if(y!==83&&y!==84){ put(A.fence(true),48.5,y+.6); solid.push([48,y,48,y]); } if(y!==80&&y!==81){ put(A.fence(true),67.5,y+.6); solid.push([67,y,67,y]); } }
  put(A.signPost('VUON RAU'),55.6,87.6); put(A.signPost('VUON DOI'),15.6,63.8); put(A.signPost('VUON DONG'),63.6,50.4); put(A.signPost('SAN GA'),61.2,50.2);
  // sân gà Ké (cạnh vườn phía Đông): hàng rào, chừa cổng phía dưới (x 63–64), chuồng gà bên trong
  for(let x=60;x<=67;x++){ put(A.fence(false),x+.5,43.2); solid.push([x,43,x,43]); if(x!==63&&x!==64){ put(A.fence(false),x+.5,49.2); solid.push([x,49,x,49]); } }
  for(let y=44;y<=48;y++){ put(A.fence(true),60.5,y+.6); put(A.fence(true),67.5,y+.6); solid.push([60,y,60,y],[67,y,67,y]); }
  put(A.coop(),65.5,45.6); solid.push([64,44,66,44]);
  // lễ tân 24h ở Nhà Rếch 2 (Cộng đồng)
  put(A.receptionDesk(),47.6,90.4); solid.push([46,90,48,90]); put(A.signPost('LE TAN'),49.4,88.8);
  // bàn ghế trước quán cơm, cafe; biển Grab ở cổng
  put(A.table(),15.0,93.8); put(A.table(),27.6,93.8); put(A.grabSign(),36.6,96.0,{grab:true});
  // quán bánh mì Dân Tổ (xe đẩy) + cờ ở đồn công an
  put(A.stall('#f2c43d',['#d9a14a','#c4382e','#5fae46']),11.5,92.6); solid.push([10,92,12,92]); put(A.signPost('BANH MI DAN TO','#f2c43d'),14,91.6); put(A.flagPole(),9.6,92.2);
  // khu mở rộng: chùa, cổng vườn quốc gia, đèn đường thị trấn, trạm quan sát
  { const unacc=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toUpperCase();   /* CLB Lính Cát: cổng băng rôn + 2 cờ màu hệ, biển tên */
    for(const c of CLUB_SITES){ const col=c.t?SHARED.LC_TYPES[c.t].col:'#e8dcc0'; put(A.lcGate(col),c.x,c.y+3.6); for(const dx of [-5,5]){ put(A.lcFlagT(col),c.x+dx,c.y+.9); solid.push([Math.floor(c.x+dx),Math.floor(c.y),Math.floor(c.x+dx),Math.floor(c.y)]); }
      put(A.signPost(unacc(c.name)),c.x-3.6,c.y-2.6); }
    const A0=SHARED.LINHCAT.dragon.altar; put(A.lcAltar(),A0.x,A0.y+.6); solid.push([Math.floor(A0.x)-1,Math.floor(A0.y)-1,Math.floor(A0.x)+1,Math.floor(A0.y)]); put(A.signPost('TE DAN RONG THAN'),A0.x+4.5,A0.y+2.4); }
  put(A.lcStatue(),171,49.6); solid.push([170,48,172,49]); for(const x of [165,177]) put(A.lcFlag(),x,46.4); solid.push([165,45,165,45],[177,45,177,45]); for(const x of [167.5,174.5]) put(A.flowerBed(),x,51.2,{flat:true});   /* Trung tâm Lính Cát: tượng Bóng Cát, cờ, bồn hoa */
  spot(171,50.8,'Ngắm tượng Bóng Cát',['Tượng Bóng Cát khổng lồ trước Trung tâm Lính Cát. Ai đi ngang cũng xoa đầu bóng lấy may trước khi đi bắt Lính Cát.']);
  put(A.signPost('LINH CAT - LEN KHU TAM LINH'),172.5,64.4);   /* chỗ Trung tâm cũ: biển chỉ đường */
  for(const [x,y] of [[80.5,41],[86.5,15],[133.5,36],[127.5,26],[171.5,12],[193.5,33],[13.5,12],[45.5,19],[236.5,24],[252.5,47],[323.5,77]]) put(A.rock(x|0),x,y);   /* mỏm đá dọc đường rừng núi */
  put(A.pagoda(),148.5,45,{name:'Chùa Đà Bắc',house:true}); rect(143,36,154,44,'B'); put(A.bellTower(),157.5,50.4); solid.push([156,48,158,49]); put(A.urn(),148.5,49.6); solid.push([148,48,148,48]);
  put(A.banyan(),139,52.6); solid.push([138,51,140,51]); put(A.signPost('CHUA DA BAC','#a8322a'),150.5,91.8);
  put(A.parkGate(),SHARED.PARK.gate,94.3,{name:'Vườn quốc gia Đà Bắc',front:true}); put(A.kiosk(),209.5,92.4); solid.push([208,91,210,91]);
  for(const sp of SHARED.PARK.spots) put(A.signPost('QUAN SAT','#4f6e3a'),sp.x+1.6,sp.y+.6);
  for(let x=74;x<=206;x+=8) put(A.lamp(),x+.5,93.4);
  put(A.signPost('THUE NGUA'),157.5,88.4); for(let x=164;x<=176;x++){ put(A.fence(false),x+.5,82.2); put(A.fence(false),x+.5,90.2); } for(let y=83;y<=89;y++) if(y!==86) put(A.fence(true),176.5,y+.6);   // bãi ngựa for(const x of [84,98,118,140,160,180,198]) put(A.bench(),x+.5,94.2);
  put(A.busStop(),119.5,94.6); solid.push([118,93,120,93]); put(A.bikeRack(),123.6,94.2,{name:'Trạm xe đạp công cộng'}); solid.push([122,93,125,93]); put(A.signPost('THI TRAN DA BAC'),72.5,92.4);
  // ---- biển tên đường: mỗi trục vài biển đứng ở mép đường
  for(const R of ROADS){ const [x0,y0,x1,y1]=R.r, vert=y1-y0>x1-x0, n=Math.max(2,Math.floor((vert?y1-y0:x1-x0)/40));
    for(let k=0;k<n;k++){ const u=(k+.5)/n; let x=vert?x0-.6:x0+(x1-x0)*u, y=vert?y0+(y1-y0)*u:y0-.2; x=Math.round(x*2)/2; y=Math.round(y*2)/2+.6;
      const t=get(Math.floor(x),Math.floor(y-.6)); if(t==='W'||t==='o'||t==='Q'||t==='B'||t==='X') continue; put(A.streetSign(R.sign),x,y); } }
  // ---- thị trấn: hòm thư + bồn hoa trước nhà dân, nhà chó, dây phơi
  TOWN_HOUSES.forEach(([x,y],i)=>{ put(A.mailbox(['#c4382e','#3f78c4','#2f9a52'][i%3]),x+4.4,y+3.5); put(A.flowerBed(),x+.9,y+3.6,{flat:true});
    if(i%5===2) put(A.potPlant(i),x+4.6,y+3.2); });
  put(A.flagPole(),118.6,65.6); put(A.noticeBoard('BANG TIN XA'),121,66.6); solid.push([120,65,121,65]);
  spot(121,67.2,'Đọc bảng tin xã',['Bảng tin UBND xã: "Chủ nhật này tổng vệ sinh đường làng. Đội bóng thị trấn tuyển thêm tiền đạo."','"Nhắc nhở: đi xe máy phải đội mũ bảo hiểm, công an xã kiểm tra thường xuyên."']);
  put(A.flagPole(),134.6,66.2); put(A.basketHoop(),130.4,68.6); put(A.basketHoop(),138.6,68.6); put(A.tableTennis(),134.5,70.4); solid.push([133,69,135,69]);
  spot(134.5,64.6,'Cổng trường',['Tiếng trẻ con đọc bài vọng ra: "Bé tập đọc, bé tập viết..." Giờ ra chơi cả sân náo loạn.']);
  for(const [x,c] of [[153.5,'#c4382e'],[157.5,'#2f9a52'],[161.5,'#f2c43d']]){ put(A.stall(c,['#d9665a','#5fae46','#f4ead8']),x,68.6); solid.push([Math.floor(x)-1,67,Math.floor(x)+1,67]); }
  spot(157.5,69.6,'Dạo chợ',['Cô bán rau: "Rau cải mới hái sáng nay đây cháu!" Mùi bánh rán, xôi nóng thơm cả chợ.']);
  spot(199.5,65.6,'Trạm y tế',['Bảng ghi: "Khám miễn phí cho người cao tuổi sáng thứ 7. Tiêm phòng cho trẻ ngày 15 hằng tháng."']);
  put(A.mailbox('#f2c43d'),96.4,79.4); spot(91,79.6,'Bưu điện',['Chú bưu tá: "Gửi thư về Hà Nội 2 ngày là tới. Có bưu thiếp Hồ Hoà Bình đẹp lắm."']);
  put(A.goalPost(),126,75.6); put(A.goalPost(),126,83); for(const x of [116.5,135.5]){ put(A.bench(),x,77); put(A.bench(),x,80.6); }
  spot(126,78.6,'Sân bóng',['Mấy đứa trẻ đang đá bóng, hét ầm: "Sút đi! Sút đi!" Quả bóng lăn tới chân bạn, bạn sút trả một cú.']);
  put(A.fountain(),141,89.4); solid.push([139,88,142,89]); for(const [x,y] of [[138.2,86.4],[143.8,86.4]]) put(A.bench(),x,y); for(const x of [138.6,143.4]) put(A.flowerBed(),x,91.6,{flat:true});
  spot(141,90.6,'Ngắm đài phun nước',['Nước bắn lấp lánh, mấy em bé ném đồng xu ước. Bạn cũng thả một đồng: "Ước giàu to".']);
  put(A.busShelter(),186,89.2); solid.push([184,88,188,88]); put(A.coach(),196.5,90); solid.push([194,89,199,89]); put(A.signPost('DI HA NOI - HOA BINH'),202.6,88.8);
  spot(187,90.2,'Xem lịch xe',['Lịch xe khách: "Đà Bắc → Hà Nội 6h, 13h, 17h". Muốn về nhanh thì gọi Grab ở biển Grab.']);
  spot(156.5,82.2,'Khách sạn Đà Bắc',['Lễ tân: "Khách sạn kín phòng tuần này rồi anh/chị ơi, mai quay lại nhé!"']);
  // ---- rừng phía Bắc
  put(A.waterfall(48),100,15.4); solid.push([98,13,102,14]); for(const [x,y] of [[93.6,18],[106.4,19.6],[95,22.4]]) put(A.rock(x|0),x,y);
  spot(100,23.6,'Ngắm thác',['Thác Đà Bắc đổ ào ào, hơi nước mát lạnh phả vào mặt. Ngồi đây nghe nước chảy một lúc thấy nhẹ cả người.']);
  for(let y=9;y<=21;y+=2) for(let x=113;x<=131;x+=2) put(A.teaBush(),x+.5,y+.6);
  spot(122,22.6,'Hái chè',['Đồi chè xanh mướt. Bác nông dân: "Chè búp hái sáng sớm pha mới ngọt hậu cháu ạ."']);
  put(A.lookout(),185,22.4); solid.push([184,21,186,21]); spot(185,24,'Lên chòi canh',['Đứng trên chòi canh nhìn thấy cả hồ Hoà Bình lấp lánh, thị trấn bé xíu và vườn quốc gia xanh mướt phía Đông.']);
  put(A.tent({w:44,flag:'#f2c43d'}),197,40.4); put(A.tent({w:44,flag:'#2f9a52'}),203.6,41.2); put(A.bonfire(true),200.2,43.6); solid.push([196,39,198,39],[202,40,205,40]);
  spot(200.2,44.6,'Sưởi lửa trại',['Nhóm phượt thủ mời bạn ngồi sưởi: "Đêm qua nghe tiếng khỉ kêu bên vườn quốc gia đó!"']);
  for(const [x,y] of [[76,88],[84,87.4],[98,87.4],[106,87.6],[118,88],[122,84],[138,84]]) put(A.potPlant(x|0),x,y);
  // dây đèn vàng như ảnh thực địa (vẽ lúc render)
  const lights=[[[36.5,78.5],[41.3,92.5]],[[36.5,73],[36.5,78.5]],[[29,41.8],[36.7,41]],[[36.7,41],[40.5,41.3]],[[33.6,36],[29,41.8]]];

  // không đặt đá, tre chắn cửa phòng, cửa tiệm, nhà tắm, bến kayak
  const DOORS=[...Object.values(SHARED.ROOMS).flatMap(r=>r.doors||[]),...Object.values(SHARED.PLACES).filter(p=>p.door).map(p=>[p.door.x,p.door.y]),[SHARED.BATHHOUSE.x,SHARED.BATHHOUSE.y],[SHARED.KAYAK_SPOT.x,SHARED.KAYAK_SPOT.y]];
  const nearDoor=(x,y)=>DOORS.some(([dx,dy])=>Math.abs(x+.5-dx)<=2&&Math.abs(y+.5-dy)<=2);
  // chỗ NPC đứng: không cho cây mọc che (cây ở hàng dưới che người nên chừa rộng hơn phía dưới)
  const NPC_AT=SHARED.NPCS.filter(n=>!n.scene).map(n=>[n.x,n.y]);
  const nearNpc=(x,y)=>NPC_AT.some(([nx,ny])=>Math.abs(x+.5-nx)<=2.5&&y+.5-ny>=-1.5&&y+.5-ny<=3.5);
  // ---- rừng: cây phủ kín ô rừng, rải ở mép bãi cỏ, tre ven đường
  const trees=[...Array(10)].map((_,i)=>A.tree(i,.8+(i%4)*.12)), bam=[0,1,2].map(i=>A.bamboo(i)), bushes=[0,1,2,3].map(i=>A.bush(i));
  const pines=[0,1,2,3].map(i=>A.pine(i)), blos=[['#f29ab0',1],['#f2c43d',4],['#f4f1ea',7],['#e0445a',2]].map(([c,s])=>A.flowerTree(s,c)), reedS=[0,1,2].map(i=>A.reeds(i)), lilyS=[0,1].map(i=>A.lily(i)),
    flw=[['#ff9fb2',1],['#ffe066',2],['#f4f1ea',3],['#a882ff',4],['#ff6a55',5]].map(([c,s])=>A.flowers(s,c)), tufts=[0,1].map(i=>A.tuft(i)), stumpS=A.stump(), logS=A.logs(), mushS=A.mush(0), wrocks=[0,1].map(i=>A.wrock(i));
  const treeOf=(x,y)=>{ const k=A.hash(x,y,5); if(y<60&&x>72) return k<.45?pines[Math.floor(k*8)%4]:trees[Math.floor(k*trees.length)];   // đồi phía Bắc nhiều thông
    if(k<.06) return blos[Math.floor(k*60)%4]; return trees[Math.floor(k*trees.length)]; };
  // cây ven hồ: chừa trống hàng sát mép đường (y 98) và quanh bến kayak, 2 cây cạnh nhau cách ít nhất 2 ô để cưỡi ngựa vẫn lọt qua
  const lakeTree=(x,y)=>g[y][x]==='G'&&y>=99&&y<=104&&A.hash(x,y,99)<.12&&!nearDoor(x,y)&&Math.hypot(x+.5-SHARED.PCAR.park.x,y+.5-SHARED.PCAR.park.y)>4;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const t=g[y][x], h=A.hash(x,y,99), h2=A.hash(x,y,123);
    if(t==='W'&&(nearType(g,x,y,'D')||nearType(g,x,y,'G'))&&h2<.18){ put(reedS[Math.floor(h2*30)%3],x+.5,y+.9); continue; }      // lau sậy ven bờ
    if((t==='W'||t==='o')&&h2>.985){ put(lilyS[Math.floor(h2*400)%2],x+.5,y+.6,{flat:true}); continue; }                       // lá sen
    if(t==='o'&&h2<.006){ put(wrocks[Math.floor(h2*900)%2],x+.5,y+.7); continue; }                                               // đá giữa hồ
    if(t==='G'&&h2<.035&&!nearDoor(x,y)){ put((h2<.015?flw:tufts)[Math.floor(h2*700)%(h2<.015?5:2)],x+.5,y+.8,{flat:true}); continue; }   // hoa cỏ
    if(t==='F'&&h2<.012&&!nearType(g,x,y,'P')){ put([stumpS,logS,mushS][Math.floor(h2*250)%3],x+.5,y+.9); continue; }
    if(t==='F'&&h<.5&&!nearNpc(x,y)&&!nearType(g,x,y,'B')&&!nearType(g,x,y,'P')&&!nearType(g,x,y,'X')) put(treeOf(x,y),x+.5+(A.hash(x,y,6)-.5)*.6,y+1+(A.hash(x,y,7)-.5)*.4,{tree:true});
    else if(t==='F'&&h<.62&&!nearNpc(x,y)) put(bushes[Math.floor(h*40)%4],x+.5,y+.9);
    else if(lakeTree(x,y)&&!lakeTree(x-1,y)&&!lakeTree(x-2,y)) { put(trees[Math.floor(A.hash(x,y,5)*trees.length)],x+.5,y+1,{tree:true}); solid.push([x,y,x,y]); }
    else if(t==='G'&&h<.025&&nearType(g,x,y,'F')&&!nearDoor(x,y)) { put(bam[Math.floor(h*120)%3],x+.5,y+1); solid.push([x,y,x,y]); }
    else if(t==='G'&&h>.985&&!nearType(g,x,y,'P')&&!nearDoor(x,y)) { put(A.rock(x),x+.5,y+.8); solid.push([x,y,x,y]); } }

  // ---- điểm tương tác cố định
  const inter=[
    {id:'car_low',x:SHARED.CARS.car_low.x*T,y:SHARED.CARS.car_low.y*T,label:'Đi xe 4 bánh',r:30},   // theo đúng chỗ xe đỗ (CARS), khớp với server
    {id:'car_top',x:SHARED.CARS.car_top.x*T,y:SHARED.CARS.car_top.y*T,label:'Đi xe 4 bánh',r:30},
    {id:'bonfire',x:30.5*T,y:90.1*T,label:'Xem',r:20},
  ]; inter.push(...EXTRA_INTER);
  // vùng tên địa điểm (hiện băng tên khi bước vào)
  const zones=[...EXTRA_ZONES,
    {name:'Hồ Hoà Bình',x0:0,y0:99,x1:71,y1:111},{name:'Đường ven hồ',x0:0,y0:95,x1:71,y1:98},
    {name:'Cổng Ké Retreat',x0:35,y0:92,x1:43,y1:94},{name:'Sân lửa trại',x0:27,y0:87,x1:32,y1:92},{name:'Nhà Ngói',x0:31,y0:86,x1:37,y1:93},
    {name:'Nhà Rếch',x0:39,y0:78,x1:48,y1:93},{name:'Bể bơi',x0:9,y0:75,x1:37,y1:86},{name:'Lều 1 · Lều 2',x0:22,y0:70,x1:34,y1:74},{name:'Vườn sườn đồi',x0:2,y0:61,x1:15,y1:72},{name:'Vườn phía Đông · Sân gà',x0:57,y0:42,x1:68,y1:58},
    {name:'Đường bộ lên đồi',x0:18,y0:46,x1:36,y1:70},{name:'Nhà ăn khu trên',x0:20,y0:33,x1:27,y1:39},{name:'Deck ngắm cảnh',x0:20,y0:40,x1:27,y1:43},
    {name:'Sân đá khu trên',x0:27,y0:36,x1:33,y1:41},{name:'Nhà Ngủ 1·2·3',x0:31,y0:31,x1:38,y1:36},{name:'Nhà Chiềng',x0:40,y0:31,x1:47,y1:36},
    {name:'Nhà Mái Đá',x0:40,y0:37,x1:47,y1:41},{name:'Nền khu cắm trại',x0:45,y0:24,x1:56,y1:31},{name:'Đường vòng lên đồi',x0:20,y0:42,x1:58,y1:46},
    {name:'Thị trấn Đà Bắc',x0:72,y0:60,x1:206,y1:94},{name:'Chùa Đà Bắc',x0:136,y0:26,x1:162,y1:58},{name:'Vườn quốc gia Đà Bắc',x0:212,y0:2,x1:337,y1:93},{name:'Cầu qua hồ Hoà Bình',x0:108,y0:98,x1:113,y1:121},{name:'Hồ Hoà Bình',x0:72,y0:98,x1:339,y1:121}];
  const districts=[{name:'Khu nghỉ dưỡng Ké',x:34,y:66},{name:'Phố Đà Bắc',x:140,y:80},{name:'Khu tâm linh',x:149,y:34},{name:'⭐ Trung tâm Lính Cát',x:171,y:36,hot:1},{name:'Rừng phía Bắc',x:110,y:30},{name:'Vườn quốc gia',x:272,y:50},
    {name:'Hồ Hoà Bình',x:170,y:110}];
  const labels=[...B.map(b=>({name:b.name,x:(b.x0+b.x1+1)/2,y:b.y0})),{name:'Lều 1',x:31.5,y:72},{name:'Lều 2',x:25.5,y:71},{name:'Cổng',x:39.5,y:94},
    {name:'Bể bơi',x:22,y:76},{name:'Deck ngắm cảnh',x:23.5,y:42},{name:'Vườn rau phía Đông',x:62.5,y:51},{name:'Vườn rau phía Tây',x:8.5,y:62},{name:'Vườn rau Ké',x:58,y:76.5},{name:'Sân gà',x:63.5,y:43},{name:'Nền khu cắm trại',x:50,y:25},
    {name:'Đường bộ (~10 phút)',x:26,y:60},{name:'Bến hồ',x:43,y:104},{name:'Hồ Hoà Bình',x:20,y:106},
    ...ROADS.map(R=>{ const [x0,y0,x1,y1]=R.r, v=y1-y0>x1-x0; return {name:R.name,x:v?(x0+x1+1)/2:x0+(x1-x0)*.62,y:v?y0+(y1-y0)*.35:(y0+y1+1)/2}; }),
    {name:'Thị trấn Đà Bắc',x:140,y:66},{name:'Vườn quốc gia',x:270,y:10},...SHARED.PARK.spots.map(s=>({name:s.name,x:s.x,y:s.y-1}))];
  return {name:'Chande Bootcamp · Ké Retreat',W,H,grid:g,obj,solid,inter,zones,labels,districts,lights,fire,
    spawn:{x:39.5*T,y:96.6*T},carLow:{x:44*T,y:97.6*T},carTop:{x:47.5*T,y:43.6*T},shoreY:shore};
}
function nearType(g,x,y,t){ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const r=g[y+dy]; if(r&&r[x+dx]===t) return true; } return false; }

/* ---------- Nhân vật ---------- */
// sheet: thư mục + tên file trong pixel-sprite-forge/characters
const CHARS={
  menmen:{name:'Mèn Mén',sheet:'men_men/men_men',preset:'menmen'},
  phap:{name:'Pháp',sheet:'phap/phap_xanh',sheet2:'phap/phap_cam',preset:'phap',form:'xanh'},
  phule:{name:'Phú Lê',sheet:'phu_le/phu_le'},
  donche:{name:'Đôn Chề',sheet:'don_che/don_che'},
  khabanh:{name:'Khá Bảnh',sheet:'kha_banh/kha_banh'},
  kenny:{name:'Kenny Ho',sheet:'kenny_ho/kenny_ho'},
  huyphan:{name:'Huy Phan',sheet:'huy_phan/huy_phan'},
};
const NPCS=[
  {id:'phap',x:36.4,y:90.8,face:1},
  {id:'khabanh',x:37,y:80.6,face:-1},
  {id:'donche',x:28.5,y:89.4,face:1},
  {id:'phule',x:25.6,y:40.6,face:-1},
  {id:'kenny',x:21.3,y:41.6,face:1},
  {id:'huyphan',x:42.6,y:36.9,face:1},
];

/* ---------- Skill ---------- */
const SKILLS={
  noi:{name:'Nói "VÃI Ò"',key:'T',desc:'Hiện khung chat VÃI Ò'},
  run:{name:'Chạy nhanh',key:'Shift',desc:'Giữ Shift để chạy'},
  quay:{name:'Quẩy',key:'Q',desc:'Quẩy theo điệu của Khá Bảnh'},
  dash:{name:'Lướt',key:'Space',desc:'Lướt nhanh một đoạn ngắn'},
  gong:{name:'Gồng',key:'R',desc:'Bùng hào quang thần thái'},
  soi:{name:'Soi xu',key:'V',desc:'Đeo kính râm, thấy xu rơi quanh khu (6 giây)'},
  hokage:{name:'Hoá Hokage',key:'K',desc:'Hoá Hokage Awwwards'},
};
const ITEMS={
  bone:{name:'Xương gặm',icon:'bone'},speaker:{name:'Loa bluetooth',icon:'speaker',quest:true},wood:{name:'Củi khô',icon:'wood',quest:true},
  fish:{name:'Cá sông Đà',icon:'fish',quest:true},chicken:{name:'Gà đồi',icon:'chicken',quest:true},comlam:{name:'Cơm lam',icon:'comlam',quest:true},
  paper:{name:'Wireframe',icon:'paper',quest:true},sunglasses:{name:'Kính râm',icon:'sunglasses'},chain:{name:'Dây chuyền vàng',icon:'chain'},
  hat:{name:'Nón Hokage',icon:'hat'},bracelet:{name:'Vòng tay bạc',icon:'bracelet'},lighter:{name:'Bật lửa',icon:'lighter'},
};

/* ---------- Nhiệm vụ ---------- */
const QUESTS={
  beagle:{giver:'phap',title:'Beagle chạy lạc',desc:'Tìm con beagle của Pháp ở Nền khu cắm trại rồi dẫn về Cổng.',
    reward:{exp:80,vnd:200000,item:'bone',skill:'run'}},
  loa:{giver:'khabanh',title:'Loa bluetooth',desc:'Lấy cái loa Khá Bảnh để quên ở Lều 1.',need:{speaker:1},
    reward:{exp:70,vnd:100000,item:'bracelet',skill:'quay'}},
  cui:{giver:'donche',title:'Củi cho lửa trại',desc:'Gom 5 bó củi khô dọc Đường bộ lên đồi.',need:{wood:5},
    reward:{exp:60,vnd:150000,item:'lighter',skill:'dash'}},
  co:{giver:'phule',title:'Cỗ lá Mường',desc:'Mang về Cá sông Đà (bến hồ), Gà đồi (quanh Nhà Ngủ), Cơm lam (cạnh Nhà Mái Đá).',need:{fish:1,chicken:1,comlam:1},
    reward:{exp:100,vnd:500000,item:'chain',skill:'gong'}},
  anh:{giver:'kenny',title:'Check-in 3 view',desc:'Chụp ảnh ở Bến hồ Hoà Bình, Cổng Ké Retreat và Nền khu cắm trại.',spots:['ben','cong','camtrai'],
    reward:{exp:80,vnd:200000,item:'sunglasses',skill:'soi'}},
  web:{giver:'huyphan',title:'Wireframe bay mất',desc:'Nhặt 3 tờ wireframe quanh Nhà Ngủ, Bể bơi dự kiến và đường xuống Deck.',need:{paper:3},
    reward:{exp:120,vnd:300000,item:'hat',skill:'hokage'}},
};
// đồ nằm trên map (chỉ hiện khi nhiệm vụ tương ứng đang làm)
const PICKUPS=[
  {item:'speaker',quest:'loa',x:31.5,y:75.9},
  ...[[33.4,69],[29.6,61],[24.6,52.4],[21.2,47.4],[27.6,45.2]].map(([x,y])=>({item:'wood',quest:'cui',x,y})),
  {item:'fish',quest:'co',x:42.9,y:104.4},{item:'comlam',quest:'co',x:46.6,y:40.3},
  {item:'paper',quest:'web',x:34.4,y:36.2},{item:'paper',quest:'web',x:28.2,y:38.4},{item:'paper',quest:'web',x:25.2,y:44.6},
];
const BEAGLE_SPOT={x:51.4,y:28.8}, CHICKEN_HOME={x:35.5,y:36.6,r:2.4};
const SPOTS=[{id:'ben',name:'Bến hồ Hoà Bình',x:42.5,y:103.2},{id:'cong',name:'Cổng Ké Retreat',x:39.5,y:96.4},{id:'camtrai',name:'Nền khu cắm trại',x:49.6,y:29.4}];
const COINS=[[24,40.2],[30.5,35.6],[47.8,30],[52,26.3],[55.6,35],[44.6,43.3],[22.4,49.6],[30.6,63.4],[35.4,74],[29.5,85.6],[44.2,93.4],[33,97.3],[56,96.4],[44.2,101.6]];

/* ---------- Hội thoại ---------- */
// mỗi dòng: [người nói ('me' = Mèn Mén, id NPC), câu]
const DIALOG={
  call:[['phap','Alo {name} à? Dậy chưa?'],['me','VÃI Ò... mới sáng ra mà.'],['phap','Cả hội lên Ké Retreat ở Đà Bắc, Hoà Bình hết rồi. Hôm nay khai mạc Chande Bootcamp đấy!'],
    ['phap','Mở app Grab (bấm G) gọi xe, chuyến này tao bao. Lên tới Cổng thì tìm tao.'],['me','Ok ok, 2 tiếng rưỡi nữa gặp.']],
  phap_hello:[['phap','{name}! Lên tới rồi à. Chào mừng tới Chande Bootcamp ở Ké Retreat.'],
    ['phap','Đây là Cổng. Đi thẳng lên là Nhà Ngói, mấy Nhà Rếch với bể bơi. Theo Đường bộ chừng 10 phút là lên khu trên.'],
    ['phap','Trên đó có Nhà ăn, Deck ngắm cảnh, Nhà Ngủ, Nhà Chiềng, Nhà Mái Đá. Xa nhất là Nền khu cắm trại.'],
    ['phap','Lười leo thì có xe 4 bánh ngay ngoài Cổng: lên dốc miễn phí, xuống dốc 15.000đ. Bấm M để xem bản đồ.'],
    ['phap','Nhớ ghé lễ tân ở Nhà Rếch 2 thuê phòng. Đêm không có chỗ ngủ là mệt lắm. Ngày đầu tao bao 100.000đ.'],
    ['phap','Cả hội đang ở rải rác khắp nơi, đứa nào cũng có việc nhờ mày. Làm xong có EXP, tiền với đồ hay.'],
    ['phap','Rảnh thì nói chuyện với tao lần nữa, tao có mấy việc nhờ mày đấy.']],
  phap_after:[['phap','Đôn Chề ở chỗ lửa trại, Khá Bảnh ở bể bơi. Phú Lê, Kenny với Huy Phan thì ở khu trên.']],
  beagle_found:[['me','Ê beagle! Về thôi, Pháp đang lo sốt vó kìa.'],['beagle','Gâu! Gâu!']],
  khabanh_offer:[['khabanh','Ê {name}! Bể bơi đẹp thế này mà không có nhạc thì quẩy kiểu gì?'],['khabanh','Tao để quên cái loa bluetooth ở Lều 1 rồi. Lấy hộ tao cái.']],
  khabanh_wait:[['khabanh','Loa ở trước Lều 1 ấy, ngay trên bể bơi.']],
  khabanh_done:[['khabanh','Lên nhạc! Nhìn tao này...'],['khabanh','QUẨY! Học được rồi đấy, bấm Q mà quẩy.']],
  khabanh_after:[['khabanh','Quẩy lên {name} ơi!']],
  donche_offer:[['donche','Tối nay đốt lửa trại ở sân Nhà Rếch. Mà thiếu củi.'],['donche','Gom giúp tao 5 bó củi khô dọc Đường bộ lên đồi nhé.']],
  donche_wait:[['donche','Mới có {wood}/5 bó thôi à? Đi dọc bậc đá giữa rừng ấy.']],
  donche_done:[['donche','Đủ củi rồi. Tối nay cháy to.'],['donche','Mẹo của tao: bấm Space để lướt cho nhanh.']],
  donche_after:[['donche','Lửa lên rồi kìa. Đừng có nhìn tao, tao không hút thuốc trong khu nghỉ đâu.']],
  phule_offer:[['phule','Chú em, trưa nay anh đãi cả hội cỗ lá kiểu Mường ở Nhà ăn khu trên.'],
    ['phule','Còn thiếu 3 món: Cá sông Đà ở bến hồ, Gà đồi chạy quanh Nhà Ngủ, Cơm lam nướng cạnh Nhà Mái Đá.']],
  phule_wait:[['phule','Còn thiếu: {missing}.']],
  phule_done:[['phule','Chuẩn vị Hoà Bình! Anh thưởng nóng.'],['phule','Học anh cái thần thái này: bấm R để gồng.']],
  phule_after:[['phule','Ăn chưa? Cá sông Đà nướng là hết nước chấm.']],
  kenny_offer:[['kenny','Content hôm nay: 3 góc check-in đẹp nhất Ké.'],
    ['kenny','Ra Bến hồ Hoà Bình, Cổng Ké Retreat với Nền khu cắm trại. Đứng vào chỗ có máy ảnh rồi bấm E để chụp.']],
  kenny_wait:[['kenny','Mới chụp {spots}/3 chỗ. Kéo bản đồ (M) xem còn chỗ nào.']],
  kenny_done:[['kenny','Ảnh đẹp đấy! Tặng mày cái kính râm.'],['kenny','Đeo vào rồi bấm V là soi được mấy đồng xu người ta đánh rơi quanh khu.']],
  kenny_after:[['kenny','Kính râm không phải để che nắng đâu, để che... à thôi.']],
  huyphan_offer:[['huyphan','Tao đang làm web cho Ké Retreat, quyết ẵm Awwwards!'],
    ['huyphan','Mà gió trên đồi thổi bay 3 tờ wireframe mất rồi. Quanh Nhà Ngủ, Bể bơi dự kiến với đường xuống Deck.']],
  huyphan_wait:[['huyphan','Mới có {paper}/3 tờ. Gió thổi mạnh lắm.']],
  huyphan_done:[['huyphan','Đủ rồi! Site này phải lên Site of the Day.'],['huyphan','Tặng mày bí kíp: bấm K... HOÁ HOKAGE AWWWARDS!']],
  huyphan_after:[['huyphan','Awwwards ơi chờ anh.']],
  finale:[['phap','{name} làm xong hết việc của cả hội rồi!'],['phap','Ngày 1 của Chande Bootcamp coi như thành công. Tối nay lửa trại ở sân Nhà Rếch nhé!'],['phap','Mai rảnh thì nộp đơn vào Everfit ở Hà Nội, hoặc bay vào nông trại bác Trang ở Đà Lạt chơi.']],
};

window.WORLD={buildRoom,buildRetreat,CHARS,NPCS,SKILLS,ITEMS,QUESTS,PICKUPS,SPOTS,COINS,DIALOG,BEAGLE_SPOT,CHICKEN_HOME};
})();
