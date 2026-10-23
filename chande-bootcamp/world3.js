/* Chan City — 3 map mới: Bearplus Studio (TP.HCM), VNPT điểm giao dịch (Hà Nội), Miếu ông Trường Con (Hải Phòng). Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function shell(W,H,floor,wall){ const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y<=1||y===H-1||x===0||x===W-1?wall:floor)); const m=Math.floor(W/2); g[H-1][m-1]=floor; g[H-1][m]=floor; return g; }
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
const plant=(K,x,y)=>{ K.put(A.pottedFern(),x,y); K.block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); };

/* ---------- Bearplus Studio ----------
   trên: neon bear+, tường moodboard, cửa sổ lớn nhìn sông Sài Gòn · trái: 6 bàn iMac · phải: góc motion, trạm render, tủ giải
   dưới phải: phòng họp kính · dưới trái: quầy cà phê, sofa, ghế lười · giữa: Bé Gấu, thảm logo ở cửa */
function buildBearplus(){ const B=SD.BEARPLUS, W=B.W, H=B.H, K=kit(), {put,block,act}=K, g=shell(W,H,'a','i');
  put(A.bpNeon(),5.2,1.7,{flat:true}); put(A.moodWall(),B.mood.x,B.mood.y,{flat:true}); put(A.riverWindow(176),25.6,1.9,{flat:true});
  act(B.mood.x,3.2,'Tường moodboard',{do:'bp:mood'},34);
  B.desks.forEach(([x,y],i)=>{ put(A.bpDesk(i),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); put(A.meshChair(i%2?'#26262c':'#3a3a44'),x,y+1.3); act(x,y+.9,'Bàn iMac',{do:'bp:desk',i},18); });
  put(A.motionDesk(),B.motion.x,B.motion.y); block(21,5,23,5); act(B.motion.x,B.motion.y+.9,'Góc motion (bảng vẽ + đèn vòng)',{do:'bp:motion'},22);
  put(A.renderStation(0),B.render.x,B.render.y,{anim:'render'}); block(25,5,28,5); act(B.render.x,B.render.y+.9,'Trạm render 3D',{do:'bp:render'},24);
  put(A.awardShelf(),B.cups.x,B.cups.y); block(30,3,32,4); act(B.cups.x,B.cups.y+.9,'Tủ giải Awwwards · FWA · CSSDA',{do:'bp:cups'},24);
  // phòng họp kính: vách ngang trên, vách dọc trái (lối vào dưới), bàn họp + TV
  put(A.glassWall(192),26.9,11.2); block(21,10,32,10); put(A.glassWallV(64),20.7,15.1); block(20,11,20,14);
  put(A.bpTV(),27,12.4,{flat:true}); put(A.meetTable(),B.meet.x,B.meet.y); block(25,13,29,14); act(B.meet.x,B.meet.y+1.2,'Ngồi họp với khách',{do:'bp:meet'},26);
  put(A.coffeeBar(),B.coffee.x,B.coffee.y); block(3,13,7,14); act(B.coffee.x,B.coffee.y+.9,'Quầy cà phê (25.000đ/ly)',{do:'bp:coffee'},24);
  put(A.sofa('#3a3a44',64),10.6,17.6); block(9,16,12,16); put(A.beanbag('#ff5fa8'),8.6,19.6); put(A.beanbag('#7fd0ff'),12.6,19.8); put(A.coffeeTable(false),10.6,19.2);
  put(A.logoRug(),17,19.4,{flat:true});
  put(A.pingPong(),16.6,12.2); block(15,10,18,11); put(A.designShelf(),2,4.6); block(1,3,2,3);
  for(const [x,y] of [[19.8,4.6],[32.3,9.4]]){ put(A.monstera(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.photoCorner(),29,20.4); block(28,19,30,19); act(29,20.6,'Góc chụp ảnh bear+',{do:'bp:photo'},24);
  for(const [x,y] of [[1.8,20.4],[32.2,20.4],[1.8,12.6],[24.4,20.4]]) plant(K,x,y);
  put(A.label('BEARPLUS · SMALL TEAM, SHARP WORK','#26262c','#ff5fa8'),17,21.4,{flat:true}); act(17,21.3,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'Bearplus Studio · Khánh Hội, TP.HCM',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:B.spawn.x*T,y:B.spawn.y*T},indoor:true}; }

/* ---------- VNPT điểm giao dịch ----------
   trên: bảng LED số đang phục vụ, logo · 4 quầy giao dịch · giữa: 3 dãy ghế chờ · góc dưới trái: máy lấy số
   phải trên: tủ SIM số đẹp, standee gói cước, bình nước · phải giữa: phòng máy chủ sau vách kính · phải dưới: bàn tổng đài */
function buildVnpt(){ const V=SD.VNPT, W=V.W, H=V.H, K=kit(), {put,block,act}=K, g=shell(W,H,'l','r');
  put(A.queueBoard(),V.board.x,V.board.y,{flat:true,anim:'queue'}); put(A.vnptLogo(),28.6,1.9,{flat:true});
  V.counters.forEach(([x,y],i)=>{ put(A.vnptCounter(i+1),x,y); block(Math.floor(x)-2,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); act(x,y+.9,'Quầy '+(i+1),{do:'vn:counter',i},20); });
  for(const y of [11.6,14.2,16.8]) for(const x of [9,15.6]){ put(A.waitChairs(4),x,y); block(Math.floor(x)-2,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); }
  put(A.chargeStation(0),V.charger.x,V.charger.y,{anim:'charger'}); block(2,12,4,12); act(V.charger.x,V.charger.y+.9,'Trạm sạc điện thoại miễn phí',{do:'vn:charge'},24);
  put(A.ticketKiosk(),V.kiosk.x,V.kiosk.y); block(3,17,3,17); act(V.kiosk.x+.2,V.kiosk.y+.9,'Máy lấy số thứ tự',{do:'vn:ticket'},22);
  put(A.simCabinet(),V.sim.x,V.sim.y); block(25,4,27,5); act(V.sim.x,V.sim.y+.9,'Tủ SIM số đẹp',{do:'vn:sim'},22);
  put(A.packStand(),V.pack.x,V.pack.y); block(30,5,30,5); act(V.pack.x,V.pack.y+.9,'Gói cước data',{do:'vn:pack'},20); put(A.waterCooler(),33.2,6.4); block(33,5,33,5); act(33.2,7.2,'Bình nước (+5 năng lượng)',{do:'vn:water'},18);
  for(const x of V.racks){ put(A.serverRack(0),x,12.6,{anim:'rack'}); block(x,10,x,11); } put(A.glassWall(144),29.9,14.2); block(25,13,34,13); act(V.server.x,V.server.y+.3,'Phòng máy chủ',{do:'vn:server'},30);
  V.desks.forEach(([x,y],i)=>{ put(A.callDesk(),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); act(x,y+.9,'Bàn tổng đài',{do:'vn:call',i},20); });
  put(A.myTV(),4.2,2.1,{flat:true}); put(A.poster5G(),21,2.0,{flat:true});
  for(const x of [12,24]){ put(A.brochureRack(),x,20.6); block(x,19,x,19); act(x,21.3,'Kệ tờ rơi gói cước',{do:'vn:pack'},18); }
  put(A.sofa('#0b6bc2',64),7.6,21.2); block(6,20,9,20); put(A.coffeeTable(false),7.6,22.6); put(A.label('KHACH UU TIEN','#0a3e74','#ffe680'),7.6,19.0,{flat:true});
  for(const [x,y] of [[1.8,4.6],[23.4,4.6],[34.2,22.4],[24.4,12.2]]) plant(K,x,y);
  put(A.label('VNPT · DIEM GIAO DICH HA NOI','#0a3e74','#ffffff'),18,23.4,{flat:true}); act(18,23.3,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'VNPT · điểm giao dịch Hà Nội',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:V.spawn.x*T,y:V.spawn.y*T},indoor:true}; }

/* ---------- Miếu ông Trường Con (ngoài trời) ----------
   miếu mái cong phía Bắc, sân gạch đỏ có lư hương, mâm lễ, ống xăm, rùa đội bia · cây đa cổ thụ phía Tây · ao sen phía Đông
   đường đá xanh xuyên cổng tam quan · ngoài cổng: xe bánh đa cua, ghế nhựa, góc quay TikTok của Trường Con */
function buildMieu(){ const M=SD.MIEU, W=M.W, H=M.H, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x===0||y===0||x===W-1||y===H-1?'F':'G'));
  for(let y=10;y<=23;y++) for(let x=4;x<=36;x++) g[y][x]='s';                                    // sân gạch
  for(let y=13;y<=20;y++) for(let x=30;x<=35;x++) if(!((y===13||y===20)&&(x===30||x===35))) g[y][x]='u';   // ao sen bo góc
  for(let y=15;y<=30;y++) for(const x of [19,20]) g[y][x]='v';                                    // đường đá xanh
  for(let x=4;x<=36;x++){ if(x<18||x>21) g[24][x]='X'; } for(let y=10;y<=24;y++){ g[y][3]='X'; g[y][37]='X'; }   // tường bao đá ong thấp
  for(let y=25;y<=30;y++) for(let x=24;x<=37;x++) g[y][x]=g[y][x]==='G'?'D':g[y][x];             // sân đất quán bánh đa
  g[H-1][19]='v'; g[H-1][20]='v';
  put(A.shrine(0),M.shrine.x,M.shrine.y,{anim:'shrine'}); block(9,3,30,8); block(13,9,26,9); act(M.altar.x,M.altar.y,'Vào lễ trong miếu',{do:'mieu:altar'},30);
  put(A.luHuong(),M.burner.x,M.burner.y,{anim:'incense'}); block(19,13,20,14); act(M.burner.x,M.burner.y+.9,'Lư hương: thắp hương cầu an',{do:'mieu:incense'},26); act(M.altar.x+2.2,M.altar.y+1.2,'Hòm công đức: công đức cho miếu',{do:'mieu:congduc'},22);
  put(A.offerTable(),M.offer.x,M.offer.y); block(14,12,16,12); put(A.fortuneTable(),M.fortune.x,M.fortune.y); block(24,12,25,12); act(M.fortune.x,M.fortune.y+.9,'Ống xăm: xin quẻ',{do:'mieu:que'},22);
  put(A.turtleStele(),M.stele.x,M.stele.y); block(27,15,28,15); act(M.stele.x,M.stele.y+.9,'Rùa đá đội bia',{do:'mieu:stele'},22);
  put(A.banyan(),M.banyan.x,M.banyan.y,{tree:true}); block(5,14,9,16); act(M.wish.x,M.wish.y,'Cây đa: buộc dải lụa ước nguyện',{do:'mieu:wish'},26);
  for(const [x,y,v] of [[31.4,14.6,0],[33.6,15.4,1],[32.2,17.2,0],[34.6,18,0],[31,19,1],[34.2,16.6,1]]) put(A.lotus(v),x,y);
  for(const [x,y] of [[16.6,22.4],[23.4,22.4],[16.6,18.4],[23.4,18.4]]) put(A.flag5(0),x,y,{anim:'flag'});
  put(A.mieuGate(0),M.gate.x,M.gate.y,{anim:'gate'});   /* cổng Miếu riêng tên, không đè cổng Ké Retreat (art.js gate) */ block(15,22,18,23); block(22,22,25,23); block(10,23,14,23); block(26,23,30,23);
  for(const [x,y] of [[6,21.8],[34,21.8]]){ put(A.plumeria(),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[17.6,12.4],[22.4,12.4]]){ put(A.stoneLantern(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[11.6,11.4],[28.4,11.4],[5.2,11.6],[35,11.6]]){ put(A.bonsaiPot('#4f8a3a'),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[3.4,5.2],[4.8,7.4],[6.4,4.6],[33.4,4.8],[35,7.2],[36.6,4.6],[2.6,9.4],[37.4,9.2]]) put(A.bamboo(Math.floor(x*3)),x,y,{tree:true});
  put(A.foodCart(),M.cart.x,M.cart.y,{anim:'cart'}); block(29,26,34,27); act(M.cart.x,M.cart.y+.9,'Bánh đa cua bà Lụa',{do:'mieu:food'},28);
  for(const [x,y,c] of [[27,29.4,'#d23a2e'],[29.4,29.6,'#2a5ab8'],[33.6,29.6,'#d23a2e'],[36,29.4,'#2a5ab8']]) put(A.plasticStool(c),x,y); put(A.lowTable(),28.2,30.2); put(A.lowTable(),34.8,30.2);
  put(A.stove(0),M.stove.x,M.stove.y,{anim:'stove'}); block(24,26,25,26); act(M.stove.x,M.stove.y+.9,'Bếp củi: luộc gà',{do:'mieu:luoc'},24);
  put(A.tripodRing(),M.tiktok.x,M.tiktok.y); block(11,27,11,27); act(M.tiktok.x+.8,M.tiktok.y+.6,'Góc quay TikTok của Trường Con',{do:'mieu:clip'},22);
  for(const [x,y] of [[2.6,28],[7,30.4],[37.4,26],[2.6,14],[2.6,20]]) put(A.tree(Math.floor(x*7+y)%3),x,y,{tree:true});
  put(A.label('MIEU ONG TRUONG CON · HAI PHONG','#6a1812','#ffe680'),20,31.3,{flat:true}); act(20,31.2,'Ra đường (gọi Grab)',{do:'grab'},24);
  return {name:'Miếu ông Trường Con · Hải Phòng',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,spawn:{x:M.spawn.x*T,y:M.spawn.y*T},indoor:false}; }

Object.assign(WORLD,{buildBearplus,buildVnpt,buildMieu});
})();
