/* Chan City — các map mới: tiệm nông sản, Shop Chande, Nhà giải trí (chia bàn), 6 loại phòng thuê ở Ké,
   văn phòng Everfit (map 2, theo ảnh văn phòng), nông trại bác Trang ở Đà Lạt (map 3), trường đua ngựa. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;

// khung phòng: tường 2 hàng trên, viền quanh, cửa ở giữa cạnh dưới
function shell(W,H,floor='O',wall='H'){ const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||y===H-1||x===0||x===W-1?wall:floor));
  const m=Math.floor(W/2); g[H-1][m-1]=floor; g[H-1][m]=floor; return g; }
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
const exitAt=(K,W,H,label='Ra ngoài')=>K.act(W/2,H-.7,label,{do:'exit'},24);

/* ---------- tiệm nông sản, shop quần áo, Nhà giải trí ---------- */
function buildInterior(kind){ const I=SD.INTERIORS[kind], W=I.W, H=I.H, K=kit(), {put,block,act}=K;
  const g=shell(W,H,{sieuthi:'q',net:'k',cafe2:'w',quan_lan:'U'}[kind]||'O');
  if(kind==='nongsan'){
    for(let y=5;y<=7;y++) for(let x=4;x<=9;x++) g[y][x]='M';
    put(A.counter(64,'#a7744c'),7,4.7); block(5,4,8,4);
    put(A.shelf2(['#5fae46','#d9463a','#f2c43d','#e88a2e','#e8d8b4','#8cc95a']),2.6,3.2); block(1,2,3,2);
    put(A.shelf2(['#e8d8b4','#c9a35e','#5fae46','#3f8a3a']),11.4,3.2); block(10,2,12,2);
    for(const [x,y,c] of [[2,6.6,'#d9463a'],[2,8.2,'#f2c43d'],[12,6.6,'#5fae46'],[12,8.2,'#e88a2e']]){ put(A.basket(c),x,y); }
    put(A.label('TIEM NONG SAN KE','#2e5b38','#f4e6c4'),7,1.6,{flat:true});
  }
  if(kind==='quanao'){
    for(let y=5;y<=7;y++) for(let x=4;x<=9;x++) g[y][x]='M';
    put(A.counter(56,'#3a3a48'),7,4.7); block(5,4,8,4);
    put(A.rack(['#f1f1ee','#2b282e','#5a7d4a','#f2a6b8','#c4382e']),2.8,4); block(1,3,3,3);
    put(A.rack(['#4d6f99','#26252b','#b9a27a','#c8a77d','#dfe6ef']),11.2,4); block(10,3,12,3);
    put(A.rack(['#4d6a8a','#c2a77d','#6b7280','#c45a6a','#2b282e']),2.8,8.2); block(1,7,3,7);
    put(A.mirror(),12,8.6); block(11,8,12,8);
    put(A.label('SHOP CHANDE','#8c231f','#fff3d6'),7,1.6,{flat:true});
  }
  if(kind==='club'){
    for(let y=3;y<=14;y++) for(let x=9;x<=17;x++) g[y][x]='M';
    for(const t of SD.CLUB.tables){
      if(t.game==='chess'){ put(A.chessTable(),t.x,t.y+.4); block(Math.floor(t.x)-1,Math.floor(t.y),Math.floor(t.x)+1,Math.floor(t.y)); }
      if(t.game==='poker'){ put(A.pokerTable(),t.x,t.y+1); block(Math.floor(t.x)-2,Math.floor(t.y)-1,Math.floor(t.x)+1,Math.floor(t.y)); }
      if(t.game==='masoi'){ put(A.roundTable(),t.x,t.y+1.2); block(Math.floor(t.x)-1,Math.floor(t.y)-1,Math.floor(t.x)+1,Math.floor(t.y)); }
      put(A.label({chess:'CO VUA',poker:'POKER',masoi:'MA SOI'}[t.game]+(t.game==='masoi'?'':' '+t.id.slice(1)),'#2a1a10','#ffd84a'),t.x,t.y-1.4,{flat:true});
      act(t.x,t.y+(t.game==='chess'?.9:1.8),'Ngồi '+t.name.toLowerCase(),{do:'table',id:t.id},40); }
    put(A.barCounter(),20.5,2.9,{flat:false}); block(18,2,23,2);
    put(A.palm(),2.2,8.6);   /* Phòng Bay đã thành nhà riêng ở phố Đà Bắc */
    for(const [x,y] of [[1.6,3],[24.4,3],[1.6,15.4],[24.4,15.4]]) put(A.palm(),x,y);
    put(A.label('NHA GIAI TRI','#8c231f','#fff3d6'),13,1.6,{flat:true});
    const H=SD.SHISHA; put(A.rug(),H.x,H.y+.7,{flat:true}); put(A.pouf(),H.seat.x,H.seat.y+.2); put(A.pouf(),H.oii.x,H.oii.y+.2); put(A.shisha(),H.x,H.y+.2);   // góc shisha của Ộ i i
    block(Math.floor(H.x),Math.floor(H.y),Math.floor(H.x),Math.floor(H.y)); put(A.label('SHISHA','#5a3a9a','#ffd84a'),H.x,H.y-2.4,{flat:true});
    act(H.seat.x,H.seat.y,'Hút shisha cùng Ộ i i',{do:'shisha'},30);
  }
  if(kind==='phongbay'){
    for(let y=4;y<=11;y++) for(let x=3;x<=16;x++) g[y][x]='n';
    put(A.djBooth(),10,3.4); block(8,2,12,2); put(A.speaker(),2,3.4); put(A.speaker(),18,3.4); block(1,2,2,2); block(17,2,18,2);
    put(A.discoBall(),10,6,{over:true}); put(A.label('PHONG BAY','#a259ff','#fff3d6'),10,1.4,{flat:true});
    act(10,4.4,'Bàn DJ: chọn bài, lên sàn',{do:'dance'},40);
  }
  if(kind==='doncongan'){
    put(A.policeDesk(),7,4.8); block(5,4,8,4); put(A.flagPole(),3,3.6,{flat:false}); put(A.label('DON CONG AN DA BAC','#c4382e','#ffd84a'),7,1.6,{flat:true});
    put(A.cellBars(48),11.5,7.6); block(10,6,12,7); put(A.bench(),3,7.6);
  }
  const shop=(x,y,label,place,r=30)=>act(x,y,label,{do:'place',place},r);
  if(kind==='sieuthi'){
    put(A.label('SIEU THI DA BAC','#d9463a','#ffffff'),12.3,1.5,{flat:true}); put(A.label('KHUYEN MAI','#f2c43d','#8c231f'),16.6,1.5,{flat:true});
    ['#d9463a','#2a4ad0','#3f8a3a','#d9463a'].forEach((c,i)=>put(A.drinkFridge(c),2.2+i*2.2,3.5)); block(1,2,9,3); shop(5.5,4.4,'Tủ mát: nước, sữa chua','sieuthi');
    put(A.produceBin(['#d9463a','#f2c43d','#5fae46']),12.4,3.7); put(A.produceBin(['#e88a2e','#8cc95a','#a259ff']),14.7,3.7); put(A.produceBin(['#f2c43d','#d9463a','#e8d8b4']),17,3.7); block(11,3,18,3);
    shop(14.7,4.6,'Quầy rau củ quả','sieuthi');
    for(const [x,y,s] of [[4.6,6.6,1],[8.4,6.6,2],[4.6,10.4,3],[8.4,10.4,4]]){ put(A.gondola(s),x,y); block(Math.floor(x-1.8),Math.floor(y)-1,Math.floor(x+1.7),Math.floor(y)); }
    for(const [x,y] of [[6.5,7.6],[6.5,11.4]]) shop(x,y,'Xem kệ hàng','sieuthi',26);
    put(A.checkout(),15.5,10.6); block(14,10,17,10); shop(15.5,11.5,'Thanh toán ở quầy thu ngân','sieuthi',30);
    put(A.basketStack(),12.6,12.7); put(A.trolley(),17.6,12.6); put(A.trolley(),18.3,12.8); for(const [x,y] of [[1.6,12.6],[12.4,6.2]]) put(A.potPlant(x|0),x,y);
  }
  if(kind==='net'){
    put(A.label('NET CO  GAME ONLINE','#1a1426','#4fd1ff'),10,1.5,{flat:true}); [[2,0],[4,1],[16,2],[18,3]].forEach(([x,s])=>put(A.poster(s),x,1.9,{flat:true}));
    let n=0; for(const [dy,cy] of [[3.7,5],[7.9,9.2]]) for(let i=0;i<5;i++){ const x=2.5+i*2.1; n++;
      put(A.pcStation(n),x,dy); put(A.gamingChair(['#d9263a','#2a4ad0','#3f8a3a','#a259ff','#f2a03a'][n%5]),x,cy); act(x,cy+.4,`Máy số ${n}: chơi game, lướt web`,{do:'place',place:'net'},16); }
    block(1,2,11,3); block(1,6,11,7);
    put(A.netCounter(),16.2,5.2); block(14,4,18,4); shop(16.2,5.9,'Quầy nạp giờ','net');
    put(A.drinkFridge('#2a4ad0'),18.2,9); block(17,7,18,8); put(A.sofa('#3a3a48',40),15.4,11.2); block(14,10,16,10);
  }
  if(kind==='cafe2'){
    for(let x=11;x<=16;x++) g[1][x]='V';
    put(A.cafeBar(128),6,3.9); block(2,3,9,3); put(A.menuBoard('MENU'),6,1.8,{flat:true}); shop(6,4.8,'Gọi món ở quầy','cafe2',34);
    put(A.label('CAFE DA BAC','#3a2414','#f4e6c4'),13.5,0.9,{flat:true});
    [[3,7.4],[7,7.4],[11.4,7.4],[3,10.4],[13.2,10.4]].forEach(([x,y],i)=>{ put(A.cafeTable(i),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); put(A.pendant(),x,y-2.3,{over:true}); });
    put(A.sofa('#c9a87a',48),14.6,4.4); put(A.coffeeTable(true),14.6,5.9); block(13,3,16,3); block(14,5,15,5);
    for(const [x,y] of [[1.6,10.8],[16.4,10.8],[10.6,3.6],[16.4,7.4]]) put(A.potPlant(x|0),x,y);
  }
  if(kind==='quan_lan'){
    put(A.label('QUAN CO LAN','#8c231f','#fff3d6'),8,1.4,{flat:true}); put(A.altar(),1.9,2.4);
    put(A.foodCase(),5,3.9); block(3,3,6,3); shop(5,4.8,'Gọi món · phụ cô Lan nấu','quan_lan',34);
    put(A.ricePot(),8.6,3.7); block(8,3,9,3); put(A.stove(),11.4,3.6); block(10,3,12,3); act(11.4,4.6,'Bếp quán cô Lan',{do:'stove'},26);
    put(A.shelf(['#c4382e','#f2c43d','#5fae46','#e8d8b4']),14,3.4); block(13,2,14,3); put(A.fan(),14.6,6.4);
    for(const [x,y,i] of [[3.6,6.8,0],[11.6,6.8,1],[3.6,9.2,1],[11.6,9.2,0]]){ put(A.eatTable(i),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1);
      for(const [dx,dy,c] of [[-1.8,.1,'#d9263a'],[1.8,.1,'#2a4ad0'],[-.7,.8,'#d9263a'],[.7,.8,'#2a4ad0']]) put(A.stool(c),x+dx,y+dy); }
  }
  exitAt(K,W,H);
  return {name:I.name,W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:I.spawn.x*T,y:I.spawn.y*T},indoor:true,music:kind==='club'?'music_retreat':'music_room'}; }

/* ---------- phòng thuê ở Ké (nội thất theo từng loại) ---------- */
function buildStay(type){ const R=SD.ROOMS[type], [W,H]=R.size, K=kit(), {put,block,act}=K;
  const tent=type==='leu'||type==='leubeboi', floor={leu:'K',leubeboi:'K',rech:'J',maida:'U'}[type]||'O', g=shell(W,H,floor,tent?'N':'H');
  const ra=(x,y,a,label,r=20,bed)=>act(x,y,label,{do:'ra',act:a,bed},r);
  const bathroom=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) g[y][x]='I'; };
  if(type==='leu'){
    put(A.sleepBag(),3,5.6); block(2,4,3,5); ra(3.6,5.6,'nghi','Chui túi ngủ',20,{x:3,y:3.6});
    put(A.lantern(),6,3.4); put(A.charger(true),7.4,3.6,{flat:true}); ra(7.4,3.8,'sac','Sạc dự phòng',18);
    act(6,5.4,'Điện thoại',{do:'phone'},22);
  }
  if(type==='leubeboi'){                                                                                  // lều cạnh bể bơi: đủ ngủ, tắm, sạc như phòng thường
    bathroom(8,2,9,3); put(A.shower(),9,4.1); block(8,2,9,3); ra(8.6,4.4,'tam','Tắm vòi sen dã ngoại');
    put(A.sleepBag(),3,5.6); block(2,4,3,5); ra(3.6,5.6,'nghi','Ngủ trong túi ngủ',20,{x:3,y:3.6});
    put(A.lantern(),5.4,3.4); put(A.charger(false),6.4,2.6,{flat:true}); ra(6.4,3.4,'sac','Sạc điện thoại',18);
    put(A.towel(),7,5.8,{flat:true}); act(5.6,5.8,'Điện thoại',{do:'phone'},22);
  }
  if(type==='nhangu'){
    bathroom(8,2,9,3); put(A.shower(),9,4.1); block(8,2,9,3); ra(8.6,4.4,'tam','Tắm');
    put(A.bedSingle(),2.4,5.4); block(2,3,2,5); ra(3.4,5,'nghi','Nghỉ ngơi',20,{x:2.4,y:3.4});
    put(A.fan(),5,3.6); put(A.charger(false),4,2.6,{flat:true}); ra(4,3.4,'sac','Sạc điện thoại',18);
    put(A.towel(),6.6,2.8,{flat:true}); act(5.6,5.6,'Điện thoại',{do:'phone'},22);
  }
  if(type==='rech'){
    bathroom(9,2,10,3); put(A.shower(),10,4.1); block(9,2,10,3); ra(9.6,4.4,'tam','Tắm');
    put(A.netBed(),3,6.2); block(2,3,3,5); ra(4.2,5.4,'nghi','Nghỉ ngơi',20,{x:2.6,y:4.4});
    put(A.fan(),5.4,3.6); put(A.kettleTable(),7,6.6); block(6,6,7,6); put(A.charger(false),5.6,2.6,{flat:true}); ra(5.8,3.6,'sac','Sạc điện thoại',18);
    put(A.windowWall(),7.4,2,{flat:true}); act(7,7.4,'Điện thoại',{do:'phone'},22);
  }
  if(type==='ngoi'){
    bathroom(9,2,10,3); put(A.shower(),10,4.1); block(9,2,10,3); ra(9.6,4.4,'tam','Tắm');
    put(A.bedDouble('#c9a87a'),3,6.2); block(2,3,3,5); ra(4.4,5.6,'nghi','Nghỉ ngơi',20,{x:2.5,y:4.2});
    put(A.aircon(),5,1.6,{flat:true}); put(A.wardrobe(),7.2,4); block(6,2,7,3); put(A.charger(false),4.6,2.6,{flat:true}); ra(4.8,3.6,'sac','Sạc điện thoại',18);
    put(A.kettleTable(),7.6,6.8); block(7,6,8,6); act(6.4,7.2,'Điện thoại',{do:'phone'},22);
  }
  if(type==='maida'){
    bathroom(10,2,11,3); put(A.shower(),11,4.1); block(10,2,11,3); ra(10.6,4.4,'tam','Tắm nước nóng');
    put(A.bedDouble('#a9b8c8'),3,6.2); block(2,3,3,5); ra(4.4,5.6,'nghi','Nghỉ ngơi',20,{x:2.5,y:4.2});
    put(A.aircon(),5.4,1.6,{flat:true}); put(A.sofa('#7a6a5a',40),7.6,7.2); block(7,6,8,6); put(A.windowWall(),7.6,2,{flat:true});
    put(A.charger(false),5,2.6,{flat:true}); ra(5.2,3.6,'sac','Sạc điện thoại',18); act(7.6,7.6,'Điện thoại (sofa)',{do:'phone'},24);
  }
  if(type==='chieng'){
    bathroom(1,2,4,3); put(A.lakeWindow(),2.6,2,{flat:true}); put(A.bathtub(),2.6,4.1,{tub:true}); block(1,2,4,3); ra(2.6,4.6,'tam','Ngâm bồn cạnh cửa sổ',24);
    put(A.bedDouble('#e8d8b4'),6.4,6.4); put(A.bedDouble('#e8d8b4'),9.4,6.4); block(5,4,10,5); ra(7.9,7,'nghi','Nghỉ ngơi',26,{x:5.9,y:4.4});
    put(A.aircon(),8,1.6,{flat:true}); put(A.lakeWindow(),8,2,{flat:true}); put(A.kettleTable(),12.4,4.4); block(12,4,12,4);
    put(A.charger(false),5,2.6,{flat:true}); ra(5.4,3.4,'sac','Sạc điện thoại',18);
    for(let y=6;y<=8;y++) for(let x=12;x<=13;x++) g[y][x]='K';
    put(A.balcony(36),12.9,6.1); act(12.8,7.4,'Ban công nhìn hồ (điện thoại)',{do:'phone'},24);
  }
  exitAt(K,W,H,'Ra khỏi phòng');
  return {name:R.name,W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:R.spawn.x*T,y:R.spawn.y*T},indoor:true,music:'music_room',room:type}; }

/* ---------- Map 2: văn phòng Everfit ---------- */
function buildOffice(){ const O=SD.OFFICE, W=O.W, H=O.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1?'V':(y===H-1||x===0||x===W-1)?'H':'Z'));
  // phòng sếp vách kính góc phải trên
  for(let y=2;y<=9;y++) g[y][27]='g'; for(let x=27;x<W-1;x++) if(x!==30&&x!==31) g[10][x]='g';
  // 2 bàn dài trắng + ghế trắng (chỗ ngồi của 10 nhân viên)
  for(const ty of [5.6,10.6]){ put(A.longTable(176),9.5,ty); block(4,Math.floor(ty)-1,14,Math.floor(ty)-1);
    for(let x=5;x<=13;x+=2){ put(A.whiteChair(),x,ty-1.5); put(A.whiteChair(),x,ty+1.1); } }
  O.desks.forEach(([x,y],i)=>act(x,y,`Bàn làm việc số ${i+1}`,{do:'desk',desk:i},16));
  // tường cây xanh giữa phòng
  put(A.plantWall(100),16.5,8.3); block(16,3,17,7); act(O.spots.plants.x,O.spots.plants.y,'Tường cây xanh',{do:'spot',where:'plants'},22);
  // bàn gỗ dài + ghế (họp)
  put(A.woodTable(88),22.5,6); block(20,5,25,5); act(O.spots.meeting.x,O.spots.meeting.y,'Bàn họp gỗ',{do:'spot',where:'meeting'},26);
  // góc sofa kem + bàn trà hoa đỏ
  put(A.sofa('#ece4d2',64),22,12.6); block(20,11,23,11); put(A.sofa('#ece4d2',48),27,15.4); block(26,14,28,14); put(A.coffeeTable(true),24.6,14.4); block(24,13,25,13);
  put(A.sofa('#c4382e',30),19.6,15.6); act(22,13.8,'Ngả lưng ở sofa (+năng lượng)',{do:'perk',k:'sofa'},30);
  for(const [x,y] of [[2,3],[25.4,3.2],[18.6,3.2],[32,12],[32,18.8],[15.6,18.8]]) { put(A.palm(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  // phòng sếp
  put(A.bossDesk(),30.5,6.8); block(29,6,31,6); act(O.spots.boss.x,O.spots.boss.y,'Phòng sếp',{do:'spot',where:'boss'},24);
  // pantry
  put(A.pantry(),30.5,15.6); block(28,14,32,14); act(O.spots.pantry.x,O.spots.pantry.y,'Pantry',{do:'spot',where:'pantry'},24);
  // lễ tân + thang máy + biển thoát hiểm + máy in
  put(A.counter(64,'#d8c4a2'),8,16.6); block(6,16,9,16); put(A.label('EVERFIT','#1c1516','#f4f1ea'),8,13.4,{flat:true});
  put(A.elevator(),2.6,20.2); block(1,18,2,19); put(A.exitSign(),5.6,17.2,{flat:true}); put(A.printer(),14,16.4); block(13,15,14,15);
  act(3.6,18.8,'Thang máy (gọi Grab)',{do:'grab'},26);
  return {name:'Văn phòng Everfit · Hà Nội',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:O.spawn.x*T,y:O.spawn.y*T},indoor:true,music:'music_room',office:true}; }

/* ---------- Map 3: nông trại bác Trang (Đà Lạt) ---------- */
function buildDalat(){ const D=SD.DALAT, W=D.W, H=D.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},()=>Array(W).fill('G'));
  const set=(x,y,t)=>{ if(x>=0&&y>=0&&x<W&&y<H) g[y][x]=t; }, rect=(x0,y0,x1,y1,t)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) set(x,y,t); };
  // rừng thông bao quanh
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x<3||x>76||y<2) g[y][x]='F';
  rect(62,43,76,48,'F'); rect(3,64,30,69,'F'); rect(50,66,76,69,'F');
  // đường đất
  rect(39,6,41,69,'P'); rect(3,28,77,29,'P'); rect(3,49,77,50,'P'); rect(4,59,38,60,'P'); rect(42,52,43,58,'P');
  // ô trồng (luống đất)
  for(const p of D.plots) set(Math.floor(p.x),Math.floor(p.y),'Y');
  // ao cá hồi, ao tôm, hồ câu
  rect(47,55,53,57,'W'); rect(47,61,53,63,'W');
  for(let y=50;y<69;y++) for(let x=50;x<77;x++){ const d=((x+.5-D.lake.x)/D.lake.rx)**2+((y+.5-D.lake.y)/D.lake.ry)**2; if(d<=1) g[y][x]='W'; else if(d<=1.25) g[y][x]='D'; }
  // nhà (ô B)
  const B=[], bld=(name,x0,y0,x1,y1,o)=>{ rect(x0,y0,x1,y1,'B'); B.push({name,x0,y0,x1,y1,o}); };
  bld('Nhà bác Trang',36,2,44,4,{roof:'tile',wall:'wood',doors:[64],windows:[10,40,100,120],sign:'NHA BAC TRANG'});
  bld('Kho hàng',29,3,33,5,{roof:'stone',wall:'wood',doors:[30],sign:'KHO'});
  bld('Trại bò sữa',48,31,54,33,{roof:'tile',wall:'wood',doors:[44],sign:'TRAI BO SUA',awning:'#c4382e'});
  bld('Chuồng gà',63,31,66,32,{roof:'tile',wall:'wood',doors:[22],sign:'CHUONG GA'});
  bld('Chuồng lợn',70,31,75,33,{roof:'stone',wall:'wood',doors:[38],sign:'CHUONG LON'});
  bld('Trại ngựa',48,8,55,10,{roof:'tile',wall:'wood',doors:[52],windows:[10,90],sign:'TRAI NGUA',awning:'#8a5d3b'});
  bld('Trường đua ngựa',46,18,52,21,{roof:'stone',wall:'stone',doors:[48],sign:'TRUONG DUA',awning:'#f2c43d'});
  bld('Quán cô Lan',25,53,31,55,{roof:'thatch',wall:'wood',doors:[46],windows:[10,80],sign:'QUAN CO LAN',awning:'#c4382e'});
  for(const b of B){ const w=(b.x1-b.x0+1)*T-4, h=(b.y1-b.y0+1)*T; put(A.shop({w,wallH:22,roofH:Math.max(22,h-14),...b.o}),(b.x0+b.x1+1)/2,b.y1+1,{name:b.name,house:true}); }
  // nhà kính dâu tây treo phủ lên luống
  put(A.greenhouse(176,98),11,46.6,{over:true});
  // hàng rào: đồng cỏ bò (cổng phía trên), sân gà, chuồng lợn, đồng cỏ ngựa (cổng bên trái)
  const fenceBox=(x0,y0,x1,y1,gaps,white)=>{ const f=white?A.whiteFence:A.fence;
    for(let x=x0;x<=x1;x++) for(const y of [y0,y1]) if(!gaps.some(([gx,gy])=>gx===x&&gy===y)){ put(f(false),x+.5,y+.2); block(x,y,x,y); }
    for(let y=y0+1;y<y1;y++) for(const x of [x0,x1]) if(!gaps.some(([gx,gy])=>gx===x&&gy===y)){ put(f(true),x+.5,y+.6); block(x,y,x,y); } };
  fenceBox(46,36,61,44,[[50,36],[51,36],[52,36],[53,36]],true); fenceBox(62,35,69,40,[[64,35],[65,35],[66,35]],false); fenceBox(70,35,77,41,[[71,35],[72,35],[73,35]],false);
  fenceBox(57,7,77,25,[[57,11],[57,12],[57,13],[57,14]],true);
  put(A.signPost('CONG'),54.6,36.2); put(A.signPost('CONG'),67.4,35.2); put(A.signPost('CONG'),74.4,35.2);
  put(A.windmill(0),59,34.4,{id:'windmill'}); block(58,33,59,33);
  // cà phê, chè, hoa trang trí
  for(let y=8;y<=26;y+=2) for(let x=33;x<=37;x++) put(A.teaBush(),x+.5,y+.6);
  for(const [x,y,c] of [[18.5,31],[31,31],[18.5,37.6],[31,37.6]]) put(A.crop('hoa',2,'8fa4e8'),x,y);
  // chợ + quầy hàng + bếp
  const sh=D.shops;
  put(A.stall('#5a8d64',['#5fae46','#f08a2e','#6e9a6a']),sh.tiem_rau.x,57.5); block(7,56,9,56);
  put(A.stall('#c4382e',['#d9665a','#f4ead8','#f2b0a8']),sh.tiem_thit.x,57.5); block(13,56,15,56);
  put(A.stall('#f2c43d',['#f4ead8','#c4382e','#e8d8b4']),sh.tiem_kho.x,57.5); block(19,56,21,56);
  put(A.signPost('NHAN HANG'),D.market.x-1.6,60.4); for(const [x,y] of [[12,61.6],[12.9,61.9],[15.6,61.7]]) put(A.crate(),x,y);
  act(D.market.x,D.market.y,'Điểm nhận hàng chợ',{do:'market'},30);
  for(const [x,y] of [[30.6,6.4],[33.6,6.6],[34.4,7.6]]) put(A.crate(),x,y); act(D.warehouse.x,D.warehouse.y,'Kho hàng nông trại',{do:'warehouse'},30);
  act(D.track.x,D.track.y,'Vào trường đua',{do:'track'},30);
  // ao + hồ
  act(D.pens.ca.x,D.pens.ca.y,'Ao cá hồi',{do:'pen',k:'ca'},30); act(D.pens.tom.x,D.pens.tom.y,'Ao tôm càng',{do:'pen',k:'tom'},30);
  act(D.pens.bo.x,D.pens.bo.y,'Đồng cỏ bò sữa',{do:'pen',k:'bo'},34); act(D.pens.ga.x,D.pens.ga.y,'Sân gà',{do:'pen',k:'ga'},30); act(D.pens.lon.x,D.pens.lon.y,'Chuồng lợn',{do:'pen',k:'lon'},30);
  act(D.pens.vit.x,D.pens.vit.y,'Đàn vịt (cho ăn ở mép hồ)',{do:'pen',k:'vit'},44); act(D.pens.vit.x+4,D.pens.vit.y+.8,'Đàn vịt (cho ăn ở mép hồ)',{do:'pen',k:'vit'},44);
  // cổng + bến xe
  put(A.signPost('NONG TRAI BAC TRANG','#2e5b38'),38,64.8); put(A.busStop(),44.6,66.6); block(43,65,45,65); put(A.bikeRack(),48.4,66.4); block(47,65,50,65); put(A.grabSign(),36.4,67,{grab:true});
  // thông
  const pines=[...Array(6)].map((_,i)=>A.pine(i,.9+(i%3)*.12));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const h=A.hash(x,y,77); if(g[y][x]==='F'&&h<.55) put(pines[Math.floor(A.hash(x,y,5)*pines.length)],x+.5,y+1,{tree:true});
    else if(g[y][x]==='G'&&h<.012&&!near(g,x,y)) { put(pines[Math.floor(h*500)%pines.length],x+.5,y+1,{tree:true}); block(x,y,x,y); } }
  function near(g,x,y){ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const r=g[y+dy]; if(!r||r[x+dx]!=='G') return true; } return false; }
  const zones=[{name:'Cổng nông trại',x0:34,y0:61,x1:46,y1:69},{name:'Chợ nông trại',x0:4,y0:51,x1:33,y1:63},{name:'Ao cá hồi · ao tôm',x0:45,y0:53,x1:55,y1:65},{name:'Hồ câu cá',x0:54,y0:52,x1:76,y1:66},
    {name:'Vườn rau',x0:4,y0:30,x1:17,y1:38},{name:'Vườn hoa',x0:18,y0:30,x1:31,y1:38},{name:'Nhà kính dâu tây',x0:4,y0:39,x1:17,y1:48},
    {name:'Trại bò sữa',x0:45,y0:30,x1:61,y1:45},{name:'Chuồng gà',x0:62,y0:30,x1:69,y1:41},{name:'Chuồng lợn',x0:69,y0:30,x1:77,y1:42},
    {name:'Đồi cà phê',x0:4,y0:6,x1:17,y1:27},{name:'Vườn bơ · hồng',x0:18,y0:6,x1:32,y1:17},{name:'Rừng cao su',x0:18,y0:17,x1:32,y1:27},{name:'Đồi chè',x0:32,y0:6,x1:38,y1:27},
    {name:'Nhà bác Trang',x0:28,y0:2,x1:46,y1:8},{name:'Trại ngựa',x0:45,y0:6,x1:56,y1:17},{name:'Đồng cỏ ngựa',x0:57,y0:6,x1:77,y1:26},{name:'Trường đua ngựa',x0:45,y0:17,x1:56,y1:24}];
  const labels=[...B.map(b=>({name:b.name,x:(b.x0+b.x1+1)/2,y:b.y0})),...zones.filter(z=>!B.some(b=>b.name===z.name)).map(z=>({name:z.name,x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2}))];
  return {name:'Nông trại bác Trang · Đà Lạt',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,zones,labels,lights:[],spawn:{x:D.spawn.x*T,y:D.spawn.y*T},music:'music_retreat',outdoor:true}; }

/* ---------- đường đèo Đà Bắc (đua xe bốc đầu) ---------- */
function buildDeo(){ const W=240, H=14, K=kit(), {put,block}=K, lane=SD.WHEELIE.lane;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<3?'F':y===3||y===11?'G':y<=10?'R':'F'));
  for(let x=0;x<W;x+=12) put(A.mountain(220,64,x),x+6,2.6,{flat:true});
  const pines=[...Array(4)].map((_,i)=>A.pine(i,.8)); for(let x=1;x<W;x+=3) put(pines[x%4],x+.5,2.9);
  for(let x=0;x<W;x++){ put(A.rail(16),x+.5,4.2,{flat:true}); if(x%2) put(A.rail(16),x+.5,11.2,{flat:true}); }
  for(let x=2;x<W;x+=4) put(A.label('-','#f4f1ea','#f4f1ea'),x,lane+.2,{flat:true});
  put(A.finishLine(7*T),4,10.9,{flat:true}); put(A.finishLine(7*T),226,10.9,{flat:true}); put(A.signPost('DEO DA BAC','#2e5b38'),6,3.6);
  return {name:'Đường đèo Đà Bắc',W,H,grid:g,obj:K.obj,solid:K.solid,inter:[],spawn:{x:3*T,y:(lane+.5)*T},music:'music_retreat',deo:true}; }

/* ---------- trường đua ngựa ---------- */
const TRACK={W:60,H:30,x0:5,x1:54,lanes:[9,11,13,15,17,19]};
function buildTrack(){ const {W,H}=TRACK, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<1||x<1||x>=W-1?'F':y<7?'A':y<=21?'C':'G'));
  for(let x=1;x<W-1;x++){ put(A.rail(16),x+.5,7.4); put(A.rail(16),x+.5,22.4); block(x,7,x,7); block(x,22,x,22); }
  put(A.grandstand(W*T-40),W/2,6.4); block(1,1,W-2,5);
  put(A.finishLine(14*T),TRACK.x1+.3,21.9,{flat:true});
  for(const y of TRACK.lanes) put(A.label(String(TRACK.lanes.indexOf(y)+1),'#f4f1ea','#1c1516'),3.2,y+.6,{flat:true});
  put(A.signPost('DANG KY DUA'),24,24.4); put(A.signPost('CUOC'),36,24.4);
  act(24,25,'Đăng ký đua / cược',{do:'race'},40); act(36,25,'Đăng ký đua / cược',{do:'race'},40);
  for(let x=1;x<W-1;x++){ if(x===29||x===30) continue; put(A.fence(false),x+.5,28.2); block(x,28,x,28); }
  act(29.5,28.6,'Ra nông trại',{do:'exit'},28);
  return {name:'Trường đua ngựa · Đà Lạt',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:30*T,y:25.5*T},music:'music_retreat',outdoor:true,track:TRACK}; }

/* ---------- DAS · Design Anthropology School (TP.HCM) ---------- */
// sảnh trắng bên trái (quầy + thầy Huy Tạ, chữ D.AS, kệ cong), lớp học sau vách kính bên phải (tường vàng, màn chiếu, bục giảng), góc sofa dưới
function buildDas(){ const D=SD.DAS, W=D.W, H=D.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>(y<=1||y===H-1||x===0||x===W-1)?'H':'m'));
  for(let x=16;x<W-1;x++){ g[0][x]='y'; g[1][x]='y'; } for(let y=2;y<=11;y++) g[y][15]='g'; for(const y of [8,9]) g[y][15]='m';   // vách kính lớp học, cửa ở giữa
  for(let y=2;y<=11;y++) for(let x=16;x<W-1;x++) g[y][x]='Z';
  g[H-1][14]='m'; g[H-1][15]='m';                                                                     // cửa chính dưới
  put(A.dasLogo(),5.5,1.9,{flat:true}); put(A.label('DESIGN ANTHROPOLOGY SCHOOL','#1c1516','#ffd400'),9.5,3.1,{flat:true});
  put(A.dasDesk(150),7,7.2); block(2,6,11,6); act(7,7.8,'Thầy Huy Tạ: đăng ký học, đứng lớp',{do:'dasnpc'},30);
  put(A.dasShelf(),1.9,14.6); block(1,12,2,13); put(A.dasShelf(),1.9,18.4); block(1,16,2,17); put(A.bookTable(),6,12.4); block(5,11,7,11);
  for(const [x,y] of [[13.6,3.2],[13.6,12],[28,13.4],[16.8,18.8],[2,4.4]]){ put(A.palm(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.projScreen(80),22,2.2,{flat:true}); put(A.podium(),22,4.4); block(21,3,22,3); act(D.podium.x,D.podium.y,'Bục giảng: đứng lớp (giảng viên)',{do:'dasteach'},26);
  for(const ty of [6.6,9.2]){ put(A.longTable(140),21.5,ty); block(17,Math.floor(ty)-1,26,Math.floor(ty)-1); }
  D.seats.forEach(([x,y])=>{ put(A.whiteChair(),x,y+.2); act(x,y,'Ngồi học',{do:'dasstudy'},18); });
  put(A.sofa('#2a2a30',64),21,15.6); block(19,14,22,14); put(A.coffeeTable(false),21,17.4); block(20,16,21,16); put(A.sofa('#ffd400',30),25.6,16.6);
  act(15,18.6,'Ra sân bay (gọi xe / mua vé)',{do:'grab'},26);
  return {name:'DAS · Design Anthropology School · TP.HCM',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:D.spawn.x*T,y:D.spawn.y*T},indoor:true,music:'music_room'}; }
/* ---------- Lumen Studio (Hà Nội) ----------
   bố cục theo ảnh mẫu: hành lang dọc giữa; trái: phòng quay (phông xanh, máy quay), thư viện tư liệu, sảnh lễ tân; phải: phòng nghỉ trưa (2 giường),
   khu bàn làm việc (6 máy), pantry + lounge (máy bán nước, TV, ghế). Lối vào ở dưới giữa */
function buildLumen(){ const L=SD.LUMEN, W=L.W, H=L.H, K=kit(), {put,block,act}=K, g=shell(W,H,'b','h');
  const wall=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) g[y][x]='h'; }, gap=(x,y0,y1)=>{ for(let y=y0;y<=y1;y++) g[y][x]='b'; };
  wall(16,2,16,23); wall(21,2,21,23); wall(1,10,15,11); wall(22,10,36,11); wall(1,22,15,23); wall(22,22,36,23);
  gap(16,6,7); gap(16,16,17); gap(21,5,6); gap(21,15,16);                                                  // cửa các phòng ra hành lang; sảnh + lounge (y≥24) mở thông hành lang
  // phòng quay
  put(A.glassWall(96),8,2.2,{flat:true}); put(A.glassWall(96),29,2.2,{flat:true});                                     // cửa kính lớn tường trên như ảnh mẫu
  put(A.greenScreen(),8,4.9,{flat:true}); put(A.cameraRig(),8,7.6); block(8,7,8,7); put(A.gamingChair('#3a6ad0'),3.4,7.4); put(A.gamingChair('#3a6ad0'),12.4,7.4);
  put(A.wardrobe(),14.2,4.8); block(13,3,14,3); put(A.label('PHONG QUAY','#2b5e4e','#f4f1ea'),8,9.6,{flat:true}); act(8,8.6,'Quay motion / video cho khách (việc Lumen)',{do:'lumendesk'},24);
  // thư viện tư liệu
  put(A.shelf2(['#4d6f99','#c4382e','#e8b83a','#4f9a3e','#f4f1ea']),3,14.4); block(2,13,3,13); put(A.shelf2(['#2b5e4e','#f4f1ea','#c8964e','#5f9e84']),6.6,14.4); block(6,13,7,13);
  put(A.shelf2(['#e8823a','#5aa9d6','#8a5aaa','#f2c43d']),10.4,14.4); block(9,13,11,13); put(A.shelf2(['#c4384a','#f2c43d','#2b5e4e','#bfe2f2']),13.8,14.4); block(13,13,14,13);
  put(A.workTable(),8,18.4); block(7,17,9,17); put(A.loungeChair('#5f9e84'),5.4,18.8); put(A.loungeChair('#5f9e84'),10.6,18.8); put(A.label('THU VIEN','#2b5e4e','#f4f1ea'),8,21.6,{flat:true});
  act(8,19.4,'Bàn tư liệu: UX research (việc Lumen)',{do:'lumendesk'},24);
  // phòng nghỉ trưa
  put(A.bedSingle('#bfe2f2','#9aa0a8'),25.4,6.6); block(25,4,25,6); put(A.bedSingle('#f2b8c6','#9aa0a8'),33.4,6.6); block(33,4,33,6);
  put(A.bedside('#ff7a8a'),27.6,5.2); block(27,4,27,4); put(A.bedside('#ffd84a'),31.2,5.2); block(31,4,31,4); put(A.label('PHONG NGHI TRUA','#2b5e4e','#f4f1ea'),29,9.6,{flat:true});
  act(L.nap.x,L.nap.y,'Ngả lưng ở phòng nghỉ trưa (+năng lượng)',{do:'lumennap'},26);
  // khu bàn làm việc
  for(const [x,y] of L.desks.slice(0,6)){ put(A.pcStation((x*7+y)|0),x,y-1.4); block(Math.floor(x)-1,Math.floor(y)-2,Math.floor(x),Math.floor(y)-2); put(A.gamingChair(['#d9263a','#3a6ad0','#4f9a3e'][Math.floor(x/4)%3]),x,y-.2);
    act(x,y,'Bàn làm việc Lumen',{do:'lumendesk'},22); }
  put(A.label('STUDIO','#2b5e4e','#f4f1ea'),35,21.6,{flat:true});
  // sảnh lễ tân
  put(A.label('LUMEN STUDIO','#2b5e4e','#fff3d6'),11.6,24.4,{flat:true}); put(A.noticeBoard('LUMEN'),3.4,26.2); block(2,25,4,25);
  put(A.counter(112,'#c89a5a'),8,27.8); block(4,27,11,27); put(A.laptop(),6,26.6); put(A.laptop(),10,26.6);
  act(7,28.8,'Lễ tân Lumen: ứng tuyển, xem việc hôm nay',{do:'lumennpc'},30);
  for(const [x,y] of [[1.8,31.4],[14.6,25.2],[14.6,33.4],[17.6,21.4],[35.6,25.2]]){ put(A.pottedFern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  // pantry + lounge
  put(A.drinkFridge('#3f6fb0'),24,26.6); block(23,25,24,25); act(L.coffee.x,L.coffee.y,'Máy pha cà phê lạnh (miễn phí 1 lần/ngày)',{do:'lumencoffee'},24);
  put(A.wallTV(),30,25.2,{flat:true}); for(const [i,x] of [27,29,31,33].entries()) put(A.loungeChair(i%2?'#3a6ad0':'#c4384a'),x,27.6);
  put(A.coffeeTable(true),30.2,30.6); block(29,29,30,29); for(const [i,x] of [27,29.4,31.8,34.2].entries()) put(A.loungeChair(i%2?'#c4384a':'#3a6ad0'),x,33.4);
  put(A.sofa('#3a6ad0',40),35,30.6); block(34,29,35,29);
  act(18.5,34.6,'Ra đường (gọi Grab)',{do:'grab'},26);
  return {name:'Lumen Studio · Hà Nội',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:L.spawn.x*T,y:L.spawn.y*T},indoor:true,music:'music_room'}; }

/* ---------- Phòng của Diệp (Hà Nội) ----------
   theo ảnh mẫu: sàn gỗ, thảm xanh giữa phòng, 2 máy game thùng bên trái, ghế bành tím + bàn trải khăn đỏ có chân nến ở giữa (chỗ ngồi ăn),
   kệ sách + bàn TV máy game cổ + đèn dung nham dọc tường trên, 2 sofa tím bên phải, góc bếp của Diệp ở góc trên bên phải */
function buildDiep(){ const D=SD.DIEP, W=D.W, H=D.H, K=kit(), {put,block,act}=K, g=shell(W,H,'O','H');
  put(A.greenRug(192,132),9.4,9.2,{flat:true}); put(A.greenRug(48,22),11.9,16.4,{flat:true});
  put(A.bonsaiPot('#e86a2a'),1.8,3.6); block(1,2,1,2); put(A.retroShelf('terra'),4.4,3.6); block(3,2,5,2); put(A.retroShelf('gold'),7.6,3.6); block(6,2,8,2);
  put(A.consoleTable(),13,3.8); block(11,2,15,2); put(A.bonsaiPot('#3f9a4a'),16.6,3.6); block(16,2,16,2);
  put(A.counter(60,'#c08552'),19.2,3.6); block(18,2,20,2); put(A.stove(),22,3.5); block(21,2,22,2); put(A.label('BEP CUA DIEP','#5a2a4a','#f2b8c6'),20.2,5.2,{flat:true});
  put(A.arcade('#d9463a'),2.4,8.8); put(A.arcade('#3a6ad0'),4.2,8.8); block(1,7,4,8); act(3.3,9.8,'Chơi máy game thùng',{do:'arcade'},22);
  put(A.armchair('#8a5aaa'),9.6,8.4); block(9,7,10,7); put(A.redTable(true),9.6,11); block(8,10,11,10); act(D.seat.x,D.seat.y,'Ngồi vào bàn, nhờ Diệp nấu cho ăn',{do:'diepcook'},24);
  put(A.sofaSide('#8a5aaa'),21.2,9.6); block(21,7,22,8); put(A.sofaSide('#8a5aaa'),21.2,14); block(21,12,22,13);
  act(11.5,16.6,'Về thôi (gọi Grab)',{do:'grab'},24);
  return {name:'Phòng của Diệp · Hà Nội',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:D.spawn.x*T,y:D.spawn.y*T},indoor:true,music:'music_room'}; }
/* ---------- 120 Yên Lãng · nhà anh Độ (Hà Nội) ----------
   theo ảnh phòng stream: tường xám xanh đậm viền LED, sàn gỗ xương cá; tường trên: giá súng mô hình, 3 tủ kính figure, mảng gạch đỏ + kệ figure;
   góc trên bên phải mô hình Hulkbuster đỏ 3 mét; bàn stream 3 màn hình dọc tường trái (anh Độ ngồi, có ghế khách lên sóng); sofa da nâu + đôn đen giữa phòng */
function buildYenLang(){ const Y=SD.YENLANG, W=Y.W, H=Y.H, K=kit(), {put,block,act}=K, g=shell(W,H,'e','f');
  put(A.plainRug(144,96,'#6a6e76','#4a4e56'),5.6,7.6,{flat:true}); put(A.plainRug(112,64,'#5a3a2a','#3a2418'),16.4,11.4,{flat:true});
  put(A.gunRack(116),5,2.6,{flat:true}); for(const [i,x] of [11,13.4,15.8].entries()){ put(A.displayCase(i*2),x,3.9); block(Math.floor(x)-1,2,Math.floor(x),3); }
  put(A.brickWall(96),20.6,3.2,{flat:true}); put(A.hulkbuster(),Y.hulk.x,Y.hulk.y-1.2); block(21,4,23,6); act(Y.hulk.x-.4,Y.hulk.y+.2,'Lau mô hình Hulkbuster',{do:'ylhulk'},28);
  put(A.streamDesk(128),5,4.6); block(1,3,8,3); put(A.cameraRig(),9.6,6.2); block(9,5,9,5);
  put(A.gamingChair('#26262c'),4.6,5.8); put(A.gamingChair('#d9263a'),Y.guest.x,Y.guest.y-.4); act(Y.guest.x,Y.guest.y+.2,'Ghế khách: lên sóng cùng anh Độ',{do:'ylstream'},22);
  put(A.sofa('#7a4428',72),16.4,10.4); block(14,9,18,9); put(A.sofaSide('#7a4428'),24.2,12.2); block(24,10,24,11); put(A.ottoman(),16.4,12.6); block(15,12,17,12);
  for(const [x,y] of [[1.8,15.6],[24.2,15.6]]){ put(A.pottedFern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.label('120 YEN LANG','#1e282d','#7fe0ff'),12.5,15.4,{flat:true}); act(12.5,16.6,'Ra ngõ (gọi Grab)',{do:'grab'},24);
  // khu mở rộng bên phải: góc Refund Gaming (3 máy PUBG, tủ cúp, băng rôn), bếp Haky Food, bàn DJ, ghế lười
  const R=SD.RF, sp=R.spots;
  put(A.rfBanner(),27.6,1.5,{flat:true}); put(A.trophyCase(),27.2,4); block(26,2,28,3);
  put(A.drinkFridge('#3f6fb0'),29.4,3.9); block(28,2,30,3); put(A.kitchenRow(0),33.4,4.2,{anim:'rfstove'}); block(30,2,36,3);
  R.desks.forEach(([x,y],i)=>{ put(A.pubgDesk(i),x,y,{anim:'rfdesk'+i}); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); put(A.gamingChair(i%2?'#26262c':'#d9263a'),x,y+1.3); act(x,y+.8,'Máy PUBG của Refund Gaming',{do:'rf:desk',i},18); });
  put(A.djBooth(0),sp.booth.x,sp.booth.y-.6,{anim:'rfbooth'}); block(Math.floor(sp.booth.x)-1,Math.floor(sp.booth.y)-2,Math.floor(sp.booth.x)+1,Math.floor(sp.booth.y)-2);
  put(A.beanbag('#d9263a'),27.6,16.2); put(A.beanbag('#e8b83a'),30.4,16.4); put(A.pottedFern(),36.2,7.6); block(36,6,36,6);
  for(const [k,o] of Object.entries(sp)) act(o.x,o.y,o.label,{do:'rf:spot',k},k==='booth'||k==='stove'?26:20);
  return {name:'120 Yên Lãng · nhà anh Độ',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:Y.spawn.x*T,y:Y.spawn.y*T},indoor:true,music:'music_room'}; }
/* ---------- Sân pickleball Cầu Giấy (Hà Nội, trong nhà) ----------
   sân giữa phòng (đội A nửa dưới, đội B nửa trên, lưới ở giữa), ghế + giá vợt + bình nước 2 bên, HLV Tuấn đứng góc dưới trái, bảng điểm trên tường */
function buildPickle(){ const K=SD.PICKLE, W=K.W, H=K.H, C=K.court, Kt=kit(), {put,block,act}=Kt, g=shell(W,H,'d','h');
  for(let y=C.y0;y<=C.y1;y++) for(let x=C.x0;x<=C.x1;x++) g[y][x]='c';
  const w=(C.x1-C.x0+1)*T, h=(C.y1-C.y0+1)*T, net=(K.net-C.y0)*T;
  put(A.courtLines(w,h,net,T*2.2),C.x0,C.y0,{flat:true}); put(A.pkNet(w),C.x0-.25,K.net+.4); put(A.scoreBoard(),(C.x0+C.x1+1)/2,2.2,{flat:true});
  put(A.label('PICKLEBALL CAU GIAY','#1e4a3a','#e8f040'),(C.x0+C.x1+1)/2,20.2,{flat:true});
  for(const y of [6,9.5,13]){ put(A.bench(),4.2,y); put(A.bench(),25.8,y); }
  put(A.paddleRack(),4.4,16.2); block(3,15,5,15); put(A.drinkFridge('#3f9a4a'),26,16.6); block(25,15,26,15); act(26,17.6,'Bình nước miễn phí (+5 năng lượng)',{do:'pkwater'},22);
  for(const [x,y] of [[1.8,3.6],[28.2,3.6],[1.8,21.6],[28.2,21.6]]){ put(A.pottedFern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  act((C.x0+C.x1+1)/2,19.4,'Vào sân đấu 2 vs 2',{do:'pickle'},40);
  put(A.rack(['#1f6fb2','#2f9a52','#e8823a','#f2b8c6','#f2c43d']),23.4,21.4); block(22,20,24,20); put(A.counter(40,'#c89a5a'),26.4,21.8); block(25,21,27,21); put(A.label('DO PICKLEBALL','#1e4a3a','#e8f040'),25,19.2,{flat:true});   // quầy đồ pickleball của chị Hà
  act(14.5,22.6,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'Sân pickleball Cầu Giấy · Hà Nội',W,H,grid:g,obj:Kt.obj,solid:Kt.solid,inter:Kt.inter,spawn:{x:K.spawn.x*T,y:K.spawn.y*T},indoor:true,music:'music_room'}; }
Object.assign(WORLD,{buildInterior,buildStay,buildOffice,buildDalat,buildTrack,buildDeo,buildDas,buildLumen,buildDiep,buildYenLang,buildPickle,TRACK});
})();
