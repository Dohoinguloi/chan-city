/* Chande Bootcamp — dữ liệu map, nhân vật, nhiệm vụ.
   Map 1 "Chande Bootcamp" dựng theo mặt bằng thật của Ké Retreat (Đà Bắc, Hoà Bình):
   hồ Hoà Bình phía Nam → đường ven hồ → Cổng → khu dưới (Nhà Ngói, Nhà Rếch 1-2-3, bể bơi, Lều 1-2)
   → Đường bộ lên đồi (~10 phút) → khu trên (Nhà ăn, Deck ngắm cảnh, Bể bơi dự kiến, Nhà Ngủ 1-2-3,
   Nhà Chiềng 1-2, Nhà Mái Đá) → Nền khu cắm trại. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T;

/* ---------- Phòng Mèn Mén ---------- */
function buildRoom(){
  const W=14, H=11, g=[];
  for(let y=0;y<H;y++){ g.push([]); for(let x=0;x<W;x++) g[y].push(y<=1||y===H-1||x===0||x===W-1?'H':'O'); }
  for(let y=5;y<=7;y++) for(let x=5;x<=8;x++) g[y][x]='M';
  g[H-1][6]='O'; g[H-1][7]='O';                                   // khe cửa ra ngoài
  const obj=[], solid=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:tx*T,y:ty*T,...o}; obj.push(it); return it; };
  put(A.windowWall(),3.5,2,{flat:true}); put(A.poster(),9.5,2,{flat:true});
  put(A.bed(),2,5,{name:'Giường'}); solid.push([1,2,2,4]);
  put(A.desk(),6.5,4,{name:'Bàn làm việc'}); solid.push([5,2,7,3]);
  const ph=put(A.phone(),5.6,3.2,{name:'Điện thoại',id:'phone',sort:4.05*T});
  put(A.chair(),7,4.6); put(A.wardrobe(),12,4,{name:'Tủ quần áo'}); solid.push([11,2,12,3]);
  put(A.shelf(),10,4,{name:'Kệ sách'}); solid.push([9,2,10,3]);
  put(A.potPlant(),12.5,9.5); solid.push([12,9,12,9]);
  put(A.doorTile(),7,11,{id:'door',flat:true});
  // phòng riêng ở Hà Nội: góc tắm, ổ sạc, laptop (chợ online, học kỹ năng, chat online, làm remote)
  put(A.shower(),2,9.95); solid.push([1,8,2,9]); put(A.charger(false),3.6,2.6,{flat:true}); put(A.laptop(),7.6,3.5,{sort:4.1*T});
  const inter=[
    {id:'phone',x:5.6*T,y:4*T,label:'Nghe máy',r:22},
    {id:'bed',x:2*T,y:5.2*T,label:'Nghỉ ngơi',r:22,do:'ra',act:'nghi'},
    {id:'laptop',x:7.2*T,y:4.4*T,label:'Mở laptop',r:20,do:'hub'},
    {id:'wardrobe',x:12*T,y:4.4*T,label:'Tủ quần áo',r:20,do:'wardrobe'},
    {id:'shelf',x:10*T,y:4.4*T,label:'Xem',r:20,say:['Một chồng sách UX, một cuốn "Đi Hoà Bình mùa nào đẹp".']},
    {id:'shower',x:2.2*T,y:8.6*T,label:'Tắm',r:20,do:'ra',act:'tam'},
    {id:'charger',x:3.6*T,y:3.4*T,label:'Sạc điện thoại',r:18,do:'ra',act:'sac'},
    {id:'door',x:7*T,y:10.3*T,label:'Ra cửa (gọi Grab)',r:22,do:'grab'},
  ];
  return {name:'Phòng của bạn',W,H,grid:g,obj,solid,inter,spawn:{x:4.5*T,y:7*T},indoor:true,phone:ph,music:'music_room'};
}

/* ---------- Map 1: Chande Bootcamp (Ké Retreat) ---------- */
function buildRetreat(){
  const W=72, H=112, g=Array.from({length:H},()=>Array(W).fill('F'));
  const set=(x,y,t)=>{ if(x>=0&&y>=0&&x<W&&y<H) g[y][x]=t; };
  const get=(x,y)=>x>=0&&y>=0&&x<W&&y<H?g[y][x]:'F';
  const rect=(x0,y0,x1,y1,t,only)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(!only||only.includes(get(x,y))) set(x,y,t); };
  const ell=(cx,cy,rx,ry,t,only)=>{ for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
    const d=((x-cx)/rx)**2+((y-cy)/ry)**2; if(d<=1&&(!only||only.includes(get(x,y)))) set(x,y,t); } };
  const line=(pts,w,t,only)=>{ for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i],[bx,by]=pts[i+1], n=Math.ceil(Math.hypot(bx-ax,by-ay)*3);
    for(let k=0;k<=n;k++){ const x=ax+(bx-ax)*k/n, y=ay+(by-ay)*k/n; for(let dy=-w;dy<=w;dy++) for(let dx=-w;dx<=w;dx++){ if(dx*dx+dy*dy>w*w+.5) continue;
      const X=Math.round(x+dx), Y=Math.round(y+dy); if(!only||only.includes(get(X,Y))) set(X,Y,t); } } } };

  // hồ Hoà Bình + bờ cát + dải cỏ ven hồ + đường ven hồ
  const shore=x=>100+Math.round(1.4*Math.sin(x*.33)+.8*Math.sin(x*.11+1)+(x>50?1:0));
  for(let x=0;x<W;x++){ const s=shore(x); for(let y=98;y<H;y++) set(x,y,y<s?'G':y===s?'D':'W'); }
  rect(0,95,W-1,97,'R');
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
  rect(30,75,36,85,'K'); rect(31,76,35,84,'E'); rect(32,77,34,83,'L');

  // mặt tiền cổng: quán cơm + cafe (phía Tây), tiệm nông sản + shop quần áo (phía Đông), vườn rau sau tiệm
  rect(14,87,27,94,'G',['F']); rect(47,75,67,94,'G',['F']); line([[54,94],[54,86]],0,'P');
  for(const p of SHARED.FARM.plots) set(Math.floor(p.x),Math.floor(p.y),'Y');
  // Nhà giải trí cạnh Deck ngắm cảnh + lối gỗ từ Deck sang cửa
  rect(11,36,19,44,'G',['F']); rect(15,42,19,43,'K');
  // nhà tắm chung cạnh khu cắm trại
  rect(55,24,59,30,'G',['F']);
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
  const tents=[{name:'Lều 1',x0:30,y0:72,x1:32,y1:74},{name:'Lều 2',x0:26,y0:74,x1:28,y1:76}];
  for(const t of tents) rect(t.x0,t.y0,t.x1,t.y1,'B');

  // ---- đồ vật
  const obj=[], solid=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  for(const b of B){ const w=(b.x1-b.x0+1)*T-4, h=(b.y1-b.y0+1)*T;
    put((b.o.shop?A.shop:A.house)({w,wallH:22,roofH:Math.max(22,h-14),...b.o}),(b.x0+b.x1+1)/2,b.y1+1,{name:b.name,house:true}); }
  put(A.tent({w:44,flag:'#c4382e'}),31.5,75,{name:'Lều 1'}); put(A.tent({w:44,flag:'#3f7a8a'}),27.5,77,{name:'Lều 2'});
  put(A.gate(),39.5,95,{name:'Cổng',front:true});
  for(const [x,c] of [[47,'#e07a3c'],[50,'#5a8d64'],[53,'#3f7a8a']]){ put(A.platform(),x+.5,27.6); put(A.domeTent(c),x+.5,27.2); solid.push([x,26,x,26]); }
  // bể bơi: ô dù + ghế nằm + cây lá to như ảnh
  put(A.umbrella(),30.5,78.5); put(A.umbrella(),36.5,82.5); put(A.lounger(),30.5,81); put(A.lounger(),36.5,79);
  for(const [x,y] of [[29.5,76],[29.4,84],[37.6,76.5],[37.4,85]]) { put(A.bigleaf(x*7|0),x,y); solid.push([Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1]); }
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
  const carLow=put(A.car(),46.2,96.6,{id:'car_low',name:'Xe 4 bánh'}), carTop=put(A.car(),49.5,42.2,{id:'car_top',name:'Xe 4 bánh'});
  rect(48,40,51,41,'G',['F']); solid.push([45,96,47,96],[48,41,50,41]);
  // vườn rau Ké: hàng rào gỗ, chừa lối vào ở giữa phía Nam
  for(let x=48;x<=67;x++){ put(A.fence(false),x+.5,76.2); solid.push([x,76,x,76]); if(x!==54){ put(A.fence(false),x+.5,86.2); solid.push([x,86,x,86]); } }
  for(let y=77;y<=85;y++){ put(A.fence(true),48.5,y+.6); put(A.fence(true),67.5,y+.6); solid.push([48,y,48,y],[67,y,67,y]); }
  put(A.signPost('VUON RAU'),55.6,87.6);
  // lễ tân 24h ở Nhà Rếch 2 (Cộng đồng)
  put(A.receptionDesk(),47.6,90.4); solid.push([46,90,48,90]); put(A.signPost('LE TAN'),49.4,88.8);
  // bàn ghế trước quán cơm, cafe; biển Grab ở cổng
  put(A.table(),15.0,93.8); put(A.table(),27.6,93.8); put(A.grabSign(),36.6,96.0);
  // dây đèn vàng như ảnh thực địa (vẽ lúc render)
  const lights=[[[36.5,78.5],[41.3,92.5]],[[36.5,73],[36.5,78.5]],[[29,41.8],[36.7,41]],[[36.7,41],[40.5,41.3]],[[33.6,36],[29,41.8]]];

  // ---- rừng: cây phủ kín ô rừng, rải ở mép bãi cỏ, tre ven đường
  const trees=[...Array(10)].map((_,i)=>A.tree(i,.8+(i%4)*.12)), bam=[0,1,2].map(i=>A.bamboo(i)), bushes=[0,1,2,3].map(i=>A.bush(i));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const t=g[y][x], h=A.hash(x,y,99);
    if(t==='F'&&h<.5) put(trees[Math.floor(A.hash(x,y,5)*trees.length)],x+.5+(A.hash(x,y,6)-.5)*.6,y+1+(A.hash(x,y,7)-.5)*.4,{tree:true});
    else if(t==='F'&&h<.62) put(bushes[Math.floor(h*40)%4],x+.5,y+.9);
    else if(t==='G'&&y>=98&&h<.12) { put(trees[Math.floor(A.hash(x,y,5)*trees.length)],x+.5,y+1,{tree:true}); solid.push([x,y,x,y]); }
    else if(t==='G'&&h<.025&&nearType(g,x,y,'F')) { put(bam[Math.floor(h*120)%3],x+.5,y+1); solid.push([x,y,x,y]); }
    else if(t==='G'&&h>.985&&!nearType(g,x,y,'P')) { put(A.rock(x),x+.5,y+.8); solid.push([x,y,x,y]); } }

  // ---- điểm tương tác cố định
  const inter=[
    {id:'car_low',x:46.2*T,y:97.2*T,label:'Đi xe 4 bánh',r:30},
    {id:'car_top',x:49.5*T,y:42.8*T,label:'Đi xe 4 bánh',r:30},
    {id:'bonfire',x:30.5*T,y:90.1*T,label:'Xem',r:20},
  ];
  // vùng tên địa điểm (hiện băng tên khi bước vào)
  const zones=[
    {name:'Hồ Hoà Bình',x0:0,y0:99,x1:71,y1:111},{name:'Đường ven hồ',x0:0,y0:95,x1:71,y1:98},
    {name:'Cổng Ké Retreat',x0:35,y0:92,x1:43,y1:94},{name:'Sân lửa trại',x0:27,y0:87,x1:32,y1:92},{name:'Nhà Ngói',x0:31,y0:86,x1:37,y1:93},
    {name:'Nhà Rếch',x0:39,y0:78,x1:48,y1:93},{name:'Bể bơi',x0:29,y0:75,x1:37,y1:86},{name:'Lều 1 · Lều 2',x0:24,y0:70,x1:34,y1:77},
    {name:'Đường bộ lên đồi',x0:18,y0:46,x1:36,y1:70},{name:'Nhà ăn khu trên',x0:20,y0:33,x1:27,y1:39},{name:'Deck ngắm cảnh',x0:20,y0:40,x1:27,y1:43},
    {name:'Bể bơi (dự kiến)',x0:27,y0:36,x1:33,y1:41},{name:'Nhà Ngủ 1·2·3',x0:31,y0:31,x1:38,y1:36},{name:'Nhà Chiềng',x0:40,y0:31,x1:47,y1:36},
    {name:'Nhà Mái Đá',x0:40,y0:37,x1:47,y1:41},{name:'Nền khu cắm trại',x0:45,y0:24,x1:56,y1:31},{name:'Đường vòng lên đồi',x0:20,y0:42,x1:58,y1:46}];
  const labels=[...B.map(b=>({name:b.name,x:(b.x0+b.x1+1)/2,y:b.y0})),{name:'Lều 1',x:31.5,y:72},{name:'Lều 2',x:27.5,y:74},{name:'Cổng',x:39.5,y:94},
    {name:'Bể bơi',x:33.5,y:76},{name:'Deck ngắm cảnh',x:23.5,y:42},{name:'Bể bơi (dự kiến)',x:30,y:37},{name:'Nền khu cắm trại',x:50,y:25},
    {name:'Đường bộ (~10 phút)',x:26,y:60},{name:'Bến hồ',x:43,y:104},{name:'Hồ Hoà Bình',x:20,y:106}];
  return {name:'Chande Bootcamp · Ké Retreat',W,H,grid:g,obj,solid,inter,zones,labels,lights,fire,
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
  {id:'phap',x:38.9,y:90.4,face:1},
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
    ['phap','Lười leo thì có xe 4 bánh ngay ngoài Cổng: lên dốc miễn phí, xuống dốc 150.000đ. Bấm M để xem bản đồ.'],
    ['phap','Nhớ ghé lễ tân ở Nhà Rếch 2 thuê phòng. Đêm không có chỗ ngủ là mệt lắm. Ngày đầu tao bao 100.000đ.'],
    ['phap','Cả hội đang ở rải rác khắp nơi, đứa nào cũng có việc nhờ mày. Làm xong có EXP, tiền với đồ hay.'],
    ['phap','À mà... con beagle nhà tao vừa sổng dây chạy lên đồi rồi! Tìm hộ tao với.']],
  phap_wait:[['phap','Con beagle hay chạy lên Nền khu cắm trại tít trên đỉnh. Bấm M xem đường.']],
  phap_done:[['phap','Ơ về rồi! {name} đỉnh thật. Cầm lấy cái này cho nó gặm.'],['phap','Từ giờ giữ Shift để chạy nhé. Vui quá, tao hoá Saiyan luôn!']],
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
