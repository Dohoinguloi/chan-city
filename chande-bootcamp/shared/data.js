/* Chan City — dữ liệu dùng chung cho server (Node) và client (trình duyệt).
   Server dùng file này để kiểm tra mọi thứ ảnh hưởng tới tiền, EXP, đồ, bữa ăn; client dùng để vẽ và hiện menu.
   Toạ độ theo ô 16px. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.SHARED=factory(); })(this,function(){
const T=16;

/* ---------- Quy tắc ---------- */
const RULES={
  tzOffsetH:7,                       // giờ Việt Nam
  walk:70, run:118, dash:250,        // px/giây
  startMoney:150000,
  levels:[0,100,250,450,700,1000,1400,2000,2700,3500,4500,6000,8000],
  // 3 bữa/ngày; quá giờ mà chưa ăn thì bị đói (ăn bù được)
  meals:[{id:'sang',name:'Bữa sáng',from:6,to:10},{id:'trua',name:'Bữa trưa',from:11,to:14},{id:'toi',name:'Bữa tối',from:17,to:21}],
  hungrySpeed:[1,.85,.7,.55],        // theo số bữa đã bỏ
  hungryExp:[1,.75,.5,.35],
  nearPx:44,                          // khoảng cách tối đa để tương tác
  viewRadius:560,                     // chỉ gửi người chơi trong bán kính này
  tickHz:10,
  gameExpCap:400,                     // EXP tối đa mỗi ngày từ bàn chơi + tương tác
};

/* ---------- Ngoại hình ---------- */
const LOOK={
  genders:[{id:'nam',name:'Nam'},{id:'nu',name:'Nữ'}],
  hair:{nam:[['swept','Vuốt lệch'],['messy','Rối'],['fringe','Mái dày'],['undercut','Undercut'],['fade','Phồng fade'],['buzz','Đầu đinh'],['bald','Trọc']],
        nu:[['ponytail','Đuôi ngựa'],['long','Dài xoã'],['bun','Búi'],['bowl','Tóc nấm'],['shag','Rối dài'],['fringe','Mái dày']]},
  hairColors:['211c21','3a2f37','6b4128','8a3a3a','c98a45','e8c07a','f26b24','8ee3d2','b7a8e8','e7e2da'],
  skins:['f8cdb0','f3b194','e8a882','d99a78','b97a58','8f5a3c'],
  starters:[
    {id:'nangdong',name:'Năng động',items:{top:'tee_trang',bottom:'jean',shoes:'giay_trang'}},
    {id:'thanhlich',name:'Thanh lịch',items:{top:'somi_dai',bottom:'kaki',shoes:'giay_den'}},
    {id:'matme',name:'Mát mẻ',items:{top:'tee_xanh',bottom:'short_xam',shoes:'dep_to_ong'},nu:{top:'tee_hong',bottom:'vay_do',shoes:'giay_trang'}},
  ],
};

/* ---------- Shop quần áo ---------- */
// mỗi món: ô mặc (slot), giá, opts/colors ghép vào template nhân vật
const SLOTS=[['top','Áo'],['bottom','Quần / váy'],['shoes','Giày'],['eyes','Kính'],['head','Mũ'],['neck','Cổ'],['wrist','Cổ tay']];
const CLOTHES={
  tee_trang:{name:'Áo thun trắng',slot:'top',price:80000,opts:{top:'tee'},colors:{top:'f1f1ee'}},
  tee_den:{name:'Áo thun đen',slot:'top',price:80000,opts:{top:'tee'},colors:{top:'2b282e'}},
  tee_xanh:{name:'Áo thun xanh rêu',slot:'top',price:90000,opts:{top:'tee'},colors:{top:'5a7d4a'}},
  tee_hong:{name:'Áo thun hồng',slot:'top',price:90000,opts:{top:'tee'},colors:{top:'f2a6b8'}},
  tee_do:{name:'Áo thun đỏ',slot:'top',price:90000,opts:{top:'tee'},colors:{top:'c4382e'}},
  somi_dai:{name:'Sơ mi tay dài',slot:'top',price:150000,opts:{top:'long'},colors:{top:'dfe6ef'}},
  somi_hoa:{name:'Sơ mi hoa',slot:'top',price:220000,opts:{top:'tee',floral:true},colors:{top:'2e2740',print:'8fc4c6',line:'e2b98a'}},
  somi_caro:{name:'Sơ mi caro',slot:'top',price:200000,opts:{top:'long',plaid:true},colors:{top:'c8a77d',print:'b4473c',line:'554850'}},
  khoac_jean:{name:'Khoác jean',slot:'top',price:320000,opts:{top:'jacket'},colors:{top:'4d6f99',inner:'f1f1ee'}},
  cardigan:{name:'Cardigan + cổ lọ',slot:'top',price:380000,opts:{top:'cardigan',turtle:true},colors:{top:'2b282c',inner:'e4e9eb'}},
  vest:{name:'Vest + cà vạt',slot:'top',price:600000,opts:{top:'suit'},colors:{top:'26252b',shirt:'eef1f2',tie:'8e2b2c'}},
  len_colo:{name:'Áo len cổ lọ',slot:'top',price:260000,opts:{top:'long',turtle:true},colors:{top:'b9a27a'}},
  jean:{name:'Quần jean',slot:'bottom',price:180000,opts:{bottom:'pants'},colors:{pants:'4d6a8a'}},
  jean_rach:{name:'Jean rách gối',slot:'bottom',price:240000,opts:{bottom:'pants',rips:true},colors:{pants:'6d90bb'}},
  kaki:{name:'Quần kaki be',slot:'bottom',price:160000,opts:{bottom:'pants'},colors:{pants:'c2a77d'}},
  quan_da:{name:'Quần da',slot:'bottom',price:420000,opts:{bottom:'pants',leather:true},colors:{pants:'2a282e'}},
  short_xam:{name:'Quần short xám',slot:'bottom',price:120000,opts:{bottom:'shorts'},colors:{pants:'6b7280'}},
  vay_do:{name:'Váy đỏ',slot:'bottom',price:200000,opts:{bottom:'skirt'},colors:{pants:'c45a6a'}},
  vay_den:{name:'Váy đen',slot:'bottom',price:200000,opts:{bottom:'skirt'},colors:{pants:'2b282e'}},
  giay_trang:{name:'Giày trắng',slot:'shoes',price:150000,colors:{shoes:'ebeae6'}},
  giay_den:{name:'Giày đen',slot:'shoes',price:150000,colors:{shoes:'2a2a2f'}},
  giay_luoi:{name:'Giày lười đỏ',slot:'shoes',price:280000,colors:{shoes:'a5302b'}},
  dep_to_ong:{name:'Dép tổ ong',slot:'shoes',price:40000,colors:{shoes:'5fb7a0'}},
  kinh_can:{name:'Kính cận',slot:'eyes',price:120000,opts:{glasses:'yes'}},
  kinh_ram:{name:'Kính râm',slot:'eyes',price:180000,opts:{glasses:'sun'}},
  mu_be:{name:'Mũ lưỡi trai be',slot:'head',price:150000,opts:{hair:'cap',capPattern:true},colors:{cap:'b49b78'}},
  mu_do:{name:'Mũ lưỡi trai đỏ',slot:'head',price:150000,opts:{hair:'cap'},colors:{cap:'c4382e'}},
  day_vang:{name:'Dây chuyền vàng',slot:'neck',price:500000,opts:{chain:true},colors:{gold:'e8b83a'}},
  day_bac:{name:'Dây chuyền bạc',slot:'neck',price:300000,opts:{chain:true},colors:{gold:'a8aeb6'}},
  dong_ho:{name:'Đồng hồ',slot:'wrist',price:350000,opts:{watch:true},colors:{watch:'2a2a2f'}},
  vong_vang:{name:'Vòng tay vàng',slot:'wrist',price:250000,opts:{bracelet:true},colors:{gold:'e8b83a'}},
};

/* ---------- Ăn uống ---------- */
// meal: tính là 1 bữa no; drink: cộng EXP + tăng EXP nhận được trong vài phút
const FOOD={
  com_ga:{name:'Cơm gà',price:45000,meal:true,exp:5},
  pho:{name:'Phở bò',price:40000,meal:true,exp:5},
  com_rang:{name:'Cơm rang',price:35000,meal:true,exp:4},
  co_la:{name:'Mâm cỗ lá Mường',price:120000,meal:true,exp:20},
  ca_nuong:{name:'Cá sông Đà nướng',price:150000,meal:true,exp:25},
  ga_doi:{name:'Gà đồi luộc',price:110000,meal:true,exp:18},
  com_lam:{name:'Cơm lam',price:35000,meal:true,exp:6},
  banh_mi:{name:'Bánh mì',price:20000,meal:true,exp:2},
  tra_da:{name:'Trà đá',price:5000,drink:true,exp:3,buff:{mul:1.1,min:20}},
  cafe_den:{name:'Cafe đen',price:25000,drink:true,exp:8,buff:{mul:1.25,min:30}},
  cafe_sua:{name:'Cafe sữa đá',price:30000,drink:true,exp:10,buff:{mul:1.3,min:30}},
  nuoc_dua:{name:'Nước dừa',price:20000,drink:true,exp:5,buff:{mul:1.15,min:20}},
};

/* ---------- Trồng rau ---------- */
// grow: giây tới lúc chín; sau khi chín chủ có `grace` giây để thu, quá thì người khác cướp được 50%
const CROPS={
  rau_muong:{name:'Rau muống',seed:10000,grow:120,yield:4,sell:6000,exp:4,col:'5fae46'},
  cai_ngot:{name:'Cải ngọt',seed:15000,grow:240,yield:4,sell:9000,exp:6,col:'8cc95a'},
  ca_chua:{name:'Cà chua',seed:25000,grow:420,yield:5,sell:10000,exp:8,col:'d9463a'},
  ngo:{name:'Ngô',seed:30000,grow:600,yield:4,sell:16000,exp:10,col:'f2c43d'},
  bi_do:{name:'Bí đỏ',seed:50000,grow:900,yield:3,sell:35000,exp:15,col:'e88a2e'},
  dua_hau:{name:'Dưa hấu',seed:80000,grow:1500,yield:2,sell:75000,exp:20,col:'3f8a3a'},
};
const FARM={grace:90,maxPlots:4,steal:.5,stealExp:3,plots:[]};
for(const y of [77,78,80,81,83,84]) for(const x of [50,51,52,53,54,55,56,57,59,60,61,62,63,64,65,66]) FARM.plots.push({x:x+.5,y:y+.5});

/* ---------- Địa điểm ---------- */
// door: chỗ đứng bấm E để vào; scene: cảnh bên trong
const PLACES={
  quan_com:{name:'Quán cơm Ven Hồ',where:'ngoài homestay',menu:['com_ga','pho','com_rang','banh_mi','tra_da'],buys:['ca_ro','ca_chep','ca_lang'],x:18.5,y:93},
  cafe:{name:'Cafe Bến Hồ',where:'ngoài homestay',menu:['cafe_den','cafe_sua','nuoc_dua','tra_da','banh_mi'],x:24.5,y:93},
  nha_an:{name:'Nhà ăn khu trên',where:'trong homestay',menu:['co_la','ca_nuong','ga_doi','com_lam','tra_da'],x:23.2,y:39.6},
  nongsan:{name:'Tiệm nông sản Ké',where:'ngay cổng',door:{x:51.5,y:92.7},scene:'nongsan'},
  quanao:{name:'Shop Chande',where:'đầu homestay',door:{x:57.5,y:92.7},scene:'quanao'},
  club:{name:'Nhà giải trí',where:'cạnh Deck ngắm cảnh',door:{x:16,y:42.7},scene:'club'},
};
// cảnh trong nhà: kích thước, chỗ ra vào (spawn) và cửa
const INTERIORS={
  nongsan:{name:'Tiệm nông sản Ké',W:14,H:10,spawn:{x:7,y:8.2},exit:'nongsan'},
  quanao:{name:'Shop Chande',W:14,H:10,spawn:{x:7,y:8.2},exit:'quanao'},
  club:{name:'Nhà giải trí',W:26,H:17,spawn:{x:13,y:15.2},exit:'club'},
};

/* ---------- Nhà giải trí ---------- */
const CLUB={
  tables:[
    {id:'c1',game:'chess',name:'Bàn cờ 1',x:5,y:5},{id:'c2',game:'chess',name:'Bàn cờ 2',x:5,y:9},{id:'c3',game:'chess',name:'Bàn cờ 3',x:5,y:13},
    {id:'p1',game:'poker',name:'Bàn poker 1',x:13,y:5.5},{id:'p2',game:'poker',name:'Bàn poker 2',x:13,y:11},
    {id:'w1',game:'masoi',name:'Bàn ma sói',x:20.5,y:8.5},
  ],
  chess:{bets:[0,20000,50000,100000,200000,500000],clock:300,winExp:40,drawExp:10},
  poker:{small:5000,big:10000,minBuy:100000,maxBuy:2000000,seats:6,turn:25},
  masoi:{fees:[0,20000,50000,100000],min:5,max:10,night:30,day:60,vote:30,winExp:50,loseExp:10},
};

/* ---------- Hoạt động ---------- */
const ITEMS={
  bone:{name:'Xương gặm',icon:'bone'},speaker:{name:'Loa bluetooth',icon:'speaker'},wood:{name:'Củi khô',icon:'wood'},
  fish:{name:'Cá sông Đà',icon:'fish'},chicken:{name:'Gà đồi',icon:'chicken'},comlam:{name:'Cơm lam',icon:'comlam'},
  paper:{name:'Wireframe',icon:'paper'},sunglasses:{name:'Kính râm',icon:'sunglasses'},chain:{name:'Dây chuyền vàng',icon:'chain'},
  hat:{name:'Nón Hokage',icon:'hat'},bracelet:{name:'Vòng tay bạc',icon:'bracelet'},lighter:{name:'Bật lửa',icon:'lighter'},
  hoa:{name:'Hoa rừng',icon:'flower'},la:{name:'Lá trang trí',icon:'leaf'},
  mang:{name:'Măng rừng',icon:'shoot'},rau:{name:'Rau rừng',icon:'greens'},trung:{name:'Trứng gà',icon:'egg'},nam:{name:'Nấm rừng',icon:'mushroom'},
  ca_ro:{name:'Cá rô',icon:'fish'},ca_chep:{name:'Cá chép',icon:'fish2'},ca_lang:{name:'Cá lăng sông Đà',icon:'fish3'},
};
for(const [k,c] of Object.entries(CROPS)){ ITEMS['hat_'+k]={name:'Hạt '+c.name.toLowerCase(),icon:'seed',col:c.col}; ITEMS[k]={name:c.name,icon:'crop_'+k}; }
const SKILLS={
  noi:{name:'Nói "VÃI Ò"',key:'T',desc:'Hiện khung chat VÃI Ò'},
  run:{name:'Chạy nhanh',key:'Shift',desc:'Giữ Shift để chạy (thưởng của Pháp)'},
  quay:{name:'Quẩy',key:'Q',desc:'Thưởng của Khá Bảnh'},
  dash:{name:'Lướt',key:'Space',desc:'Thưởng của Đôn Chề'},
  gong:{name:'Gồng',key:'R',desc:'Thưởng của Phú Lê'},
  soi:{name:'Soi xu',key:'V',desc:'Thưởng của Kenny Ho'},
  hokage:{name:'Hoá Hokage',key:'K',desc:'Thưởng của Huy Phan'},
  cauca:{name:'Câu cá',key:'E',desc:'Mở ở cấp 2: đứng ở mép hồ bấm E',level:2},
  kayak:{name:'Chèo kayak',key:'E',desc:'Mở ở cấp 3: thuê kayak ở bãi cát cạnh bến',level:3},
};
const QUESTS={
  beagle:{giver:'phap',title:'Beagle chạy lạc',desc:'Tìm con beagle của Pháp ở Nền khu cắm trại rồi dẫn về Cổng.',reward:{exp:80,vnd:200000,item:'bone',skill:'run'}},
  loa:{giver:'khabanh',title:'Loa bluetooth',desc:'Lấy cái loa Khá Bảnh để quên ở Lều 1.',need:{speaker:1},reward:{exp:70,vnd:100000,item:'bracelet',skill:'quay'}},
  cui:{giver:'donche',title:'Củi cho lửa trại',desc:'Gom 5 bó củi khô dọc Đường bộ lên đồi.',need:{wood:5},reward:{exp:60,vnd:150000,item:'lighter',skill:'dash'}},
  co:{giver:'phule',title:'Cỗ lá Mường',desc:'Mang về Cá sông Đà (bến hồ), Gà đồi (quanh Nhà Ngủ), Cơm lam (cạnh Nhà Mái Đá).',need:{fish:1,chicken:1,comlam:1},reward:{exp:100,vnd:500000,item:'chain',skill:'gong'}},
  anh:{giver:'kenny',title:'Check-in 3 view',desc:'Chụp ảnh ở Bến hồ Hoà Bình, Cổng Ké Retreat và Nền khu cắm trại.',spots:['ben','cong','camtrai'],reward:{exp:80,vnd:200000,item:'sunglasses',skill:'soi'}},
  web:{giver:'huyphan',title:'Wireframe bay mất',desc:'Nhặt 3 tờ wireframe quanh Nhà Ngủ, Bể bơi dự kiến và đường xuống Deck.',need:{paper:3},reward:{exp:120,vnd:300000,item:'hat',skill:'hokage'}},
};
// việc mỗi ngày cho Cô Ké (làm lại được mỗi ngày)
const DAILY={
  trangtri:{title:'Hoa lá trang trí',desc:'Mang 8 hoa hoặc lá cho Cô Ké trang trí Nhà Rếch.',need:{any:['hoa','la'],count:8},reward:{exp:60,vnd:80000}},
  nauan:{title:'Nguyên liệu nấu cỗ',desc:'Tìm 5 nguyên liệu (măng, rau, trứng, nấm) cho Cô Ké nấu ăn.',need:{any:['mang','rau','trung','nam'],count:5},reward:{exp:80,vnd:120000}},
  kayak:{title:'Chèo kayak 5 phao',desc:'Thuê kayak, chạm đủ 5 phao trên hồ Hoà Bình.',reward:{exp:120,vnd:150000}},
};
const FISH={ca_ro:{w:60,exp:8,price:20000},ca_chep:{w:30,exp:12,price:35000},ca_lang:{w:10,exp:25,price:90000}};
// giá thật của khu nghỉ: kayak 150.000đ/giờ; xe 4 bánh lên dốc miễn phí, xuống dốc 150.000đ/lượt
const KAYAK_PRICE=150000, KAYAK_MIN=60, CAR_PRICE=150000;

/* ---------- Vị trí trên map Ké Retreat ---------- */
// scene: cảnh NPC đứng (mặc định retreat); place: bấm E mở menu của địa điểm
const NPCS=[
  {id:'phap',x:38.9,y:90.4},{id:'khabanh',x:37,y:80.6},{id:'donche',x:28.5,y:89.4},
  {id:'phule',x:25.6,y:40.6},{id:'kenny',x:21.3,y:41.6},{id:'huyphan',x:40,y:36.4},
  {id:'quancom',x:18.5,y:93,place:'quan_com'},{id:'barista',x:24.5,y:93,place:'cafe'},{id:'chibep',x:23.2,y:39.6,place:'nha_an'},
  {id:'coke',scene:'nongsan',x:7,y:3.9,place:'nongsan'},{id:'shopkeeper',scene:'quanao',x:7,y:3.9,place:'quanao'},
  {id:'letan',x:47.6,y:89.4,place:'letan'},
  {id:'hr',scene:'everfit',x:8,y:15.6,place:'hr'},{id:'sep',scene:'everfit',x:30.5,y:5.6,place:'sep'},
];
// NPC phụ dựng từ template (không có sheet riêng)
const NPC_LOOKS={
  shopkeeper:{name:'Chị Mai (Shop Chande)',look:{gender:'nu',hair:'ponytail',hairColor:'6b4128',skin:'f3b194',outfit:{top:'somi_hoa',bottom:'vay_den',shoes:'giay_den'}}},
  quancom:{name:'Chú Tư (quán cơm)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'d99a78',outfit:{top:'tee_trang',bottom:'kaki',shoes:'dep_to_ong'}}},
  barista:{name:'Linh (barista)',look:{gender:'nu',hair:'long',hairColor:'211c21',skin:'f8cdb0',outfit:{top:'tee_den',bottom:'jean',shoes:'giay_trang'}}},
  chibep:{name:'Chị Hoa (bếp)',look:{gender:'nu',hair:'bun',hairColor:'3a2f37',skin:'e8a882',outfit:{top:'somi_dai',bottom:'kaki',shoes:'dep_to_ong'}}},
  coke:{name:'Cô Ké (chủ tiệm)',look:{gender:'nu',hair:'bun',hairColor:'8a8a8a',skin:'d99a78',outfit:{top:'len_colo',bottom:'vay_den',shoes:'giay_den'}}},
  letan:{name:'Anh Tùng (lễ tân 24h)',look:{gender:'nam',hair:'swept',hairColor:'211c21',skin:'e8a882',outfit:{top:'somi_dai',bottom:'kaki',shoes:'giay_den'}}},
  hr:{name:'Chị Vy (HR Everfit)',look:{gender:'nu',hair:'long',hairColor:'3a2f37',skin:'f8cdb0',outfit:{top:'khoac_jean',bottom:'vay_den',shoes:'giay_trang',eyes:'kinh_can'}}},
  sep:{name:'Anh Khoa (sếp Everfit)',look:{gender:'nam',hair:'undercut',hairColor:'211c21',skin:'f3b194',outfit:{top:'vest',bottom:'quan_da',shoes:'giay_luoi',wrist:'dong_ho'}}},
};
const PICKUPS=[
  {item:'speaker',quest:'loa',x:31.5,y:75.9},
  ...[[33.4,69],[29.6,61],[24.6,52.4],[21.2,47.4],[27.6,45.2]].map(([x,y])=>({item:'wood',quest:'cui',x,y})),
  {item:'fish',quest:'co',x:42.9,y:104.4},{item:'comlam',quest:'co',x:46.6,y:40.3},
  {item:'paper',quest:'web',x:34.4,y:36.2},{item:'paper',quest:'web',x:28.2,y:38.4},{item:'paper',quest:'web',x:25.2,y:44.6},
];
const SPOTS=[{id:'ben',name:'Bến hồ Hoà Bình',x:42.5,y:103.2},{id:'cong',name:'Cổng Ké Retreat',x:39.5,y:96.4},{id:'camtrai',name:'Nền khu cắm trại',x:49.6,y:29.4}];
const COINS=[[24,40.2],[30.5,35.6],[47.8,30],[52,26.3],[55.6,35],[44.6,43.3],[22.4,49.6],[30.6,63.4],[35.4,74],[29.5,85.6],[44.2,93.4],[33,97.3],[62,96.4],[44.2,101.6]];
// hoa lá, nguyên liệu: mọc lại sau vài phút (riêng từng người)
const FORAGE=[
  ...[[29.4,79.6],[37.6,77.2],[27.6,72.6],[25.2,78.8],[30.6,91.6],[36.2,93.2],[46.8,93.6],[38.4,84.2],[33.6,73.4],[24.2,39.6],[28,42.6],[36,39.6],[47.2,36.4],[40.4,31.6],[52.6,29.8],[47,24.6],[30.4,63.8],[24,51.2]]
    .map(([x,y],i)=>({id:'f'+i,item:i%3===2?'la':'hoa',x,y,respawn:240})),
  ...[[24.6,48.6,'mang'],[33.2,65.8,'mang'],[20.4,46.6,'rau'],[27.2,57.8,'rau'],[31.4,66.6,'rau'],[47.6,82.4,'trung'],[38.6,78.6,'trung'],[48.6,38.8,'nam'],[50.4,31.6,'nam'],[55.2,37.6,'nam']]
    .map(([x,y,item],i)=>({id:'g'+i,item,x,y,respawn:360})),
];
const KAYAK_SPOT={x:47.6,y:99.6}, BUOYS=[[27,104.5],[33,108],[40,109.5],[50,107],[57,104]];
const CARS={car_low:{x:46.2,y:97.2,to:{x:47.5,y:43.6},price:0},car_top:{x:49.5,y:42.8,to:{x:44,y:97.6},price:CAR_PRICE}};   // to: chỗ xuống xe ở đầu kia
const BEAGLE_SPOT={x:51.4,y:28.8}, CHICKEN_HOME={x:35.5,y:36.6,r:2.4}, LAKE_Y=98.5;
const SPAWN={retreat:{x:39.5,y:96.6},room:{x:4.5,y:7}};

/* ---------- Tương tác người chơi ---------- */
const SOCIAL={
  namtay:{name:'Nắm tay',ask:'muốn nắm tay bạn'},
  hon:{name:'Hôn',ask:'muốn hôn bạn',dur:2.6},
  vattay:{name:'Vật tay',ask:'thách vật tay',dur:6,winExp:20},
  danhnhau:{name:'Đánh nhau',ask:'thách đánh nhau (vui thôi)',dur:30,hp:100,winExp:30},
};

/* ---------- Phòng ở ----------
   Mỗi người thuê 1 phòng ở Ké Retreat, trả tiền theo ngày (trừ tự động khi sang ngày mới theo giờ VN).
   Nhà Chiềng lấy theo thông tin thật (35m², bồn tắm cạnh cửa sổ, ban công nhìn hồ Hoà Bình, điều hoà 2 chiều,
   ấm siêu tốc, cafe + nước miễn phí, giá thật 1.400.000đ/đêm). Các nhà khác suy theo kiểu nhà sàn Mường trên mặt bằng.
   rest: + năng lượng khi nghỉ · charge: + pin khi sạc · wifi: hệ số EXP lướt TikTok · view: hệ số like ảnh chụp từ phòng
   bath: sen / nonglanh / bontam / chung (đi nhà tắm chung) · buff: tăng EXP sau giấc ngủ đầu tiên trong ngày */
const ROOMS={
  tro:{name:'Phòng trọ Hà Nội',home:true,price:0,where:'Hà Nội',rest:60,charge:100,wifi:1,view:.8,bath:'sen',
    desc:'Phòng riêng ở Hà Nội: giường, bàn làm việc có laptop, tủ quần áo, góc tắm vòi sen.'},
  leu:{name:'Lều cắm trại',price:100000,where:'Nền khu cắm trại',rest:50,charge:50,wifi:.5,view:1.2,bath:'chung',
    desc:'Lều dome trên sàn gỗ: đệm hơi, túi ngủ, đèn bão, sạc dự phòng. Tắm ở nhà tắm chung cạnh khu cắm trại.',
    doors:[[47.5,28.3],[50.5,28.3],[53.5,28.3]]},
  nhangu:{name:'Nhà Ngủ 1·2·3',price:150000,where:'Khu trên',rest:70,charge:100,wifi:1,view:1,bath:'sen',
    desc:'Phòng gỗ mộc: giường đơn, quạt cây, móc treo đồ, ổ điện, phòng tắm nhỏ vòi sen.',doors:[[34.9,35.5]]},
  rech:{name:'Nhà Rếch (nhà sàn)',price:200000,where:'Khu dưới',rest:80,charge:100,wifi:1,view:1.2,bath:'sen',tea:true,
    desc:'Nhà sàn tre kiểu Mường: đệm thổ cẩm + màn, quạt, bàn trà thấp, ấm siêu tốc, phòng tắm riêng.',doors:[[43.6,93.4],[41.9,83.4]]},
  ngoi:{name:'Nhà Ngói',price:300000,where:'Ngay sau Cổng',rest:90,charge:100,wifi:1.2,view:1.3,bath:'sen',ac:true,
    desc:'Nhà ngói tường vàng đất: giường gỗ, điều hoà, bàn trà, tủ đồ, phòng tắm riêng.',doors:[[35.3,92.4]]},
  maida:{name:'Nhà Mái Đá',price:450000,where:'Khu trên',rest:100,charge:100,wifi:1.3,view:1.5,bath:'nonglanh',ac:true,buff:{mul:1.15,min:45},
    desc:'Tường đá, mái đá: giường đôi, sofa, điều hoà, vòi sen nóng lạnh, cửa sổ nhìn đồi.',doors:[[44.1,40.4]]},
  chieng:{name:'Nhà Chiềng (view hồ)',price:600000,where:'Điểm cao nhất khu nghỉ',rest:100,charge:100,wifi:1.5,view:2,bath:'bontam',ac:true,tea:true,buff:{mul:1.3,min:60},
    desc:'35m², 2 giường đôi, bồn tắm cạnh cửa sổ, ban công nhìn hồ Hoà Bình và núi, điều hoà 2 chiều, ấm siêu tốc, cafe + nước miễn phí, dép, khăn, máy sấy tóc.',
    doors:[[42.6,36.3],[45.6,36.3]]},
};
for(const [k,s] of Object.entries({tro:[14,11],leu:[10,7],nhangu:[11,8],rech:[12,9],ngoi:[12,9],maida:[13,9],chieng:[15,10]})){ ROOMS[k].size=s; ROOMS[k].spawn=k==='tro'?{x:4.5,y:7}:{x:s[0]/2,y:s[1]-1.6}; }
const BATHHOUSE={x:56.9,y:28.4};   // nhà tắm chung cạnh khu cắm trại
const RECEPTION={x:47.6,y:89.4};   // lễ tân 24h ở Nhà Rếch 2 (Cộng đồng)
// nhu cầu: mất 1 điểm sau `decay` giây khi đang online
const NEEDS={energy:{name:'Năng lượng',decay:90},clean:{name:'Sạch sẽ',decay:120},battery:{name:'Pin điện thoại',decay:60}};
const ROOM_ACTS={
  tam:{name:'Tắm',dur:6,host:true},nghi:{name:'Nghỉ ngơi',dur:8,host:true},sac:{name:'Sạc điện thoại',dur:5,host:true},
  tiktok:{name:'Lướt TikTok',dur:5,battery:10,exp:4,daily:10},songao:{name:'Up ảnh sống ảo',dur:4,battery:12,daily:3},
  work:{name:'Làm việc remote',dur:10},
};
// chỗ chụp ảnh sống ảo (bấm P), mul: độ "ăn like"
const PHOTO_SPOTS=[{id:'ben',name:'Bến hồ Hoà Bình',x:42.5,y:103.2,mul:1.5},{id:'cong',name:'Cổng Ké Retreat',x:39.5,y:96.4,mul:1.1},{id:'camtrai',name:'Nền khu cắm trại',x:49.6,y:29.4,mul:1.3},
  {id:'deck',name:'Deck ngắm cảnh',x:23.5,y:41.4,mul:1.4},{id:'beboi',name:'Bể bơi',x:33.5,y:86.4,mul:1.2},{id:'vuon',name:'Vườn rau',x:58,y:86.4,mul:1}];
// xe khách Hà Nội ⇄ Ké Retreat (Pháp bao lượt đầu)
const TRAVEL={fare:80000,hours:'khoảng 2 tiếng 30 phút'};

/* ---------- Map 2: văn phòng Everfit (Hà Nội) ----------
   Everfit: nền tảng cho huấn luyện viên fitness (AI Workout Builder, thực đơn MacroSnap, habit tracking, nhắn tin 1-1, app gắn thương hiệu).
   Tuyển tối đa 10 người. Thứ Hai–Thứ Sáu đi làm (2 ngày remote tự chọn), nghỉ Thứ Bảy, Chủ Nhật.
   Mỗi ngày làm 3 task sếp giao, xong task có EXP; lương tính theo task, 3 ngày trả 1 lần. */
const JOB={company:'Everfit',max:10,wage:270000,payEvery:3,hours:[8,20],tasksPerDay:3,bonusExp:20,fireAfter:3,defaultRemote:[2,4]};
const WORK_TASKS={
  code:{name:'Code màn hình AI Workout Builder',where:'desk',dur:10,exp:30,remote:true},
  bug:{name:'Fix bug MacroSnap ghi nhầm calo',where:'desk',dur:10,exp:30,remote:true},
  ticket:{name:'Trả lời 3 ticket của coach',where:'desk',dur:8,exp:25,remote:true},
  design:{name:'Thiết kế màn hình Habit tracking',where:'desk',dur:10,exp:30,remote:true},
  content:{name:'Viết bài cho fanpage Everfit Việt Nam',where:'desk',dur:8,exp:25,remote:true},
  qa:{name:'Test app iOS/Android trước khi release',where:'desk',dur:8,exp:25,remote:true},
  standup:{name:'Họp daily standup',where:'meeting',dur:8,exp:20},
  demo:{name:'Demo tính năng mới cho sếp',where:'boss',dur:8,exp:30},
  coffee:{name:'Pha cà phê cho cả team',where:'pantry',dur:6,exp:15},
  plant:{name:'Tưới tường cây xanh',where:'plants',dur:6,exp:15},
};
// câu hỏi phỏng vấn (đúng 2/3 là đỗ)
const INTERVIEW=[
  {q:'Everfit làm phần mềm cho ai?',a:['Huấn luyện viên fitness, dinh dưỡng','Quán cà phê','Hãng xe buýt'],ok:0},
  {q:'MacroSnap trong Everfit dùng để làm gì?',a:['Chụp ảnh hội nghị','Ghi lại bữa ăn và dinh dưỡng','Chỉnh ảnh sống ảo'],ok:1},
  {q:'Coach dùng AI Workout Builder để...',a:['Dựng giáo án tập luyện','Đặt vé máy bay','Viết nhạc'],ok:0},
  {q:'Ứng dụng gắn thương hiệu riêng của coach gọi là gì?',a:['App gắn thương hiệu (branded app)','App ngân hàng','App gọi xe'],ok:0},
  {q:'Habit tracking giúp học viên...',a:['Theo dõi thói quen hằng ngày','Tìm nhà trọ','Chơi game'],ok:0},
];
// mặt bằng văn phòng theo ảnh: kính toàn cảnh phía trên, bàn dài trắng ghế trắng, tường cây xanh giữa phòng,
// bàn gỗ họp, sofa kem + bàn trà hoa đỏ, quầy lễ tân gỗ sáng gần thang máy, phòng sếp vách kính, pantry
const OFFICE={W:34,H:21,spawn:{x:3.5,y:18.6},
  desks:[[5,6.6],[7,6.6],[9,6.6],[11,6.6],[13,6.6],[5,11.6],[7,11.6],[9,11.6],[11,11.6],[13,11.6]],
  spots:{meeting:{x:22.5,y:7.4,name:'Bàn họp gỗ'},boss:{x:30.5,y:8.6,name:'Phòng sếp'},pantry:{x:30.5,y:16.4,name:'Pantry'},plants:{x:16,y:8.6,name:'Tường cây xanh'}},
  hr:{x:8,y:15.6},sep:{x:30.5,y:5.6}};

/* ---------- Map 3: Nông trại bác Trang (Đà Lạt) ----------
   Dựng theo các nông trại Đà Lạt: đồi chè + cối xay gió + bò sữa thả rông (Cầu Đất Farm), bò sữa Đơn Dương (Đà Lạt Milk),
   nhà kính dâu tây treo, đồn điền cà phê (Mê Linh), ngựa pony (Puppy Farm). Map 80×70 ô, cổng + bến xe ở phía Nam. */
const DALAT={W:80,H:70,spawn:{x:40,y:67.2},
  farmhouse:{x:40,y:7.4},warehouse:{x:32,y:6.8},market:{x:14,y:60.8},
  shops:{tiem_rau:{name:'Tiệm rau củ',x:8,y:56.8},tiem_thit:{name:'Tiệm thịt cá',x:14,y:56.8},tiem_kho:{name:'Tiệm gia vị, đồ khô',x:20,y:56.8}},
  quan:{x:28,y:57.8},stove:{x:31.4,y:57.8},
  pens:{bo:{x:53.5,y:41.8},ga:{x:65.5,y:38.8},lon:{x:72.5,y:39.8},ca:{x:50,y:58.6},tom:{x:50,y:64.6}},
  barn:{x:51.5,y:35.6},stable:{x:51.5,y:12.6},pasture:{x0:58,y0:8,x1:76,y1:24},
  track:{x:49,y:22.6},lake:{x:64,y:59,rx:10,ry:5},
  plots:[]};
// ô trồng: kind quyết định loại cây trồng được
for(const y of [32,33,35,36]) for(let x=6;x<=15;x++) DALAT.plots.push({x:x+.5,y:y+.5,kind:'rau'});
for(const y of [32,33,35,36]) for(let x=20;x<=29;x++) DALAT.plots.push({x:x+.5,y:y+.5,kind:'hoa'});
for(const y of [41,42,44,45]) for(let x=6;x<=15;x++) DALAT.plots.push({x:x+.5,y:y+.5,kind:'nhakinh'});
for(const y of [10,12,14,16]) for(let x=6;x<=15;x++) DALAT.plots.push({x:x+.5,y:y+.5,kind:'cafe'});
for(const y of [9.5,12.5,15.5]) for(let x=20;x<=30;x+=2) DALAT.plots.push({x:x+.5,y,kind:'cay'});
for(const y of [19.5,22.5,25.5]) for(let x=20;x<=30;x+=2) DALAT.plots.push({x:x+.5,y,kind:'caosu'});
// cây ở Đà Lạt; regrow: cây lâu năm, thu xong vẫn còn, `regrow` giây sau thu tiếp
Object.assign(CROPS,{
  xa_lach:{name:'Xà lách',seed:8000,grow:150,yield:4,sell:7000,exp:4,col:'9bd36a',map:'dalat',kind:'rau'},
  bap_cai:{name:'Bắp cải',seed:15000,grow:300,yield:3,sell:16000,exp:7,col:'b9e08a',map:'dalat',kind:'rau'},
  ca_rot:{name:'Cà rốt',seed:18000,grow:420,yield:4,sell:13000,exp:8,col:'f08a2e',map:'dalat',kind:'rau'},
  atiso_cay:{name:'Atiso',seed:30000,grow:600,yield:3,sell:30000,exp:11,col:'6e9a6a',map:'dalat',kind:'rau'},
  cuc_hoa_mi:{name:'Cúc hoạ mi',seed:12000,grow:180,yield:5,sell:7000,exp:5,col:'f4f1ea',map:'dalat',kind:'hoa'},
  hoa_hong:{name:'Hoa hồng',seed:25000,grow:480,yield:5,sell:14000,exp:9,col:'e0445a',map:'dalat',kind:'hoa'},
  cam_tu_cau:{name:'Cẩm tú cầu',seed:40000,grow:720,yield:4,sell:28000,exp:13,col:'8fa4e8',map:'dalat',kind:'hoa'},
  dau_tay:{name:'Dâu tây',seed:35000,grow:600,yield:6,sell:15000,exp:12,col:'e2343e',map:'dalat',kind:'nhakinh'},
  ca_phe:{name:'Cà phê Arabica',seed:60000,grow:1200,regrow:600,yield:4,sell:30000,exp:14,col:'8c231f',map:'dalat',kind:'cafe'},
  bo_034:{name:'Bơ 034',seed:120000,grow:1500,regrow:700,yield:3,sell:45000,exp:18,col:'4f7a2a',map:'dalat',kind:'cay'},
  hong:{name:'Hồng giòn',seed:100000,grow:1500,regrow:700,yield:4,sell:30000,exp:16,col:'f28a1e',map:'dalat',kind:'cay'},
  mu_cao_su:{name:'Mủ cao su',seed:150000,grow:1800,regrow:300,yield:2,sell:40000,exp:10,col:'f4f1ea',map:'dalat',kind:'caosu',verb:'Cạo mủ',plant:'Trồng cao su'},
});
const DL_FARM={maxPlots:6};
// vật nuôi: mua con giống ở trại, cho ăn để bắt đầu 1 lứa, xong lứa thì thu sản phẩm
const ANIMALS={
  bo:{name:'Bò sữa',price:1500000,max:2,feed:'co_kho',cycle:300,product:'sua',yield:2,exp:10,keep:true},
  ga:{name:'Gà ta',price:80000,max:6,feed:'thoc',cycle:180,product:'trung',yield:2,exp:3,keep:true},
  lon:{name:'Lợn',price:400000,max:2,feed:'cam',cycle:400,feeds:3,product:'lon_thit',yield:1,exp:30},
  ca:{name:'Ao cá hồi',price:150000,max:1,feed:'cam',cycle:900,product:'ca_hoi',yield:4,exp:20},
  tom:{name:'Ao tôm càng',price:120000,max:1,feed:'cam',cycle:720,product:'tom',yield:5,exp:18},
};
const FEED={co_kho:{name:'Cỏ khô',price:5000},thoc:{name:'Thóc',price:2000},cam:{name:'Cám',price:6000}};
// nguyên liệu nấu ăn ở chợ
const INGREDIENTS={
  la_e:{name:'Lá é',price:8000,shop:'tiem_rau'},rau_song:{name:'Rau sống',price:6000,shop:'tiem_rau'},atiso:{name:'Bông atiso',price:20000,shop:'tiem_rau'},
  hanh:{name:'Hành lá',price:3000,shop:'tiem_rau'},dau_nanh:{name:'Đậu nành',price:6000,shop:'tiem_rau'},
  ga_thit:{name:'Gà làm sẵn',price:45000,shop:'tiem_thit'},thit_heo:{name:'Thịt heo',price:35000,shop:'tiem_thit'},gio_heo:{name:'Giò heo',price:40000,shop:'tiem_thit'},trung:{name:'Trứng gà',price:4000,shop:'tiem_thit'},
  bot_gao:{name:'Bột gạo',price:8000,shop:'tiem_kho'},banh_trang:{name:'Bánh tráng',price:5000,shop:'tiem_kho'},sa_ot:{name:'Sả ớt',price:5000,shop:'tiem_kho'},
  tuong_ot:{name:'Tương ớt',price:6000,shop:'tiem_kho'},duong:{name:'Đường',price:4000,shop:'tiem_kho'},
};
// món đặc sản Đà Lạt cô Lan nhờ nấu; pay: tiền công khi nấu xong
const RECIPES={
  banh_can:{name:'Bánh căn',need:{bot_gao:1,trung:2,hanh:1},pay:60000,exp:25},
  lau_ga:{name:'Lẩu gà lá é',need:{ga_thit:1,la_e:1,sa_ot:1},pay:120000,exp:40},
  nem_nuong:{name:'Nem nướng',need:{thit_heo:1,banh_trang:1,rau_song:1},pay:90000,exp:30},
  banh_trang_nuong:{name:'Bánh tráng nướng',need:{banh_trang:1,trung:1,tuong_ot:1},pay:50000,exp:20},
  atiso_ham:{name:'Atiso hầm giò',need:{atiso:1,gio_heo:1,hanh:1},pay:110000,exp:35},
  sua_dau_nanh:{name:'Sữa đậu nành nóng',need:{dau_nanh:1,duong:1},pay:35000,exp:15},
};
const COOK={daily:6,steps:3};
const DL_FISH={ca_ro_phi:{w:55,exp:8,price:18000},ca_chep:{w:30,exp:12,price:35000},ca_tam:{w:15,exp:30,price:120000}};
// ngựa: thuê theo giờ hoặc mua; cưỡi nhanh hơn, chở được 3 thùng hàng
const HORSE={rent:100000,rentMin:60,buy:2500000,speed:1.8,carry:3,herd:{dur:20,exp:30,vnd:40000,daily:5}};
const CRATES={vnd:25000,exp:8,daily:12};
// trường đua: thuê ngựa đua, cá cược; đua kiểu Audition (gõ đúng chuỗi mũi tên rồi bấm Space đúng nhịp)
const RACE={rent:50000,maxRiders:6,minRiders:2,lobbyMs:20000,rounds:8,roundMs:4400,beatAt:3600,track:100,betMin:10000,betMax:1000000,winExp:50,
  judge:[[60,'PERFECT',14],[130,'GREAT',10],[220,'COOL',7],[330,'BAD',3]]};
Object.assign(ITEMS,{
  sua:{name:'Sữa bò tươi',icon:'milk'},lon_thit:{name:'Lợn xuất chuồng',icon:'pig'},ca_hoi:{name:'Cá hồi',icon:'fish3'},tom:{name:'Tôm càng',icon:'shrimp'},
  ca_ro_phi:{name:'Cá rô phi',icon:'fish'},ca_tam:{name:'Cá tầm',icon:'fish3'},thung_hang:{name:'Thùng hàng nông trại',icon:'crate'},
});
for(const [k,f] of Object.entries(FEED)) ITEMS[k]={name:f.name,icon:'feed'};
for(const [k,g] of Object.entries(INGREDIENTS)) if(!ITEMS[k]) ITEMS[k]={name:g.name,icon:'ing_'+g.shop};
for(const [k,r] of Object.entries(RECIPES)) ITEMS['mon_'+k]={name:r.name,icon:'dish'};
for(const [k,c] of Object.entries(CROPS)) if(!ITEMS[k]){ ITEMS['hat_'+k]={name:(c.plant?'Cây giống ':'Hạt ')+c.name.toLowerCase(),icon:c.kind==='cay'||c.kind==='caosu'||c.kind==='cafe'?'sapling':'seed',col:c.col}; ITEMS[k]={name:c.name,icon:'crop_'+k}; }
// giá thu mua (bác Trang, cô Ké): rau quả + sản phẩm chăn nuôi
const SELL={};
for(const [k,c] of Object.entries(CROPS)) SELL[k]=c.sell;
Object.assign(SELL,{sua:25000,trung:4000,lon_thit:900000,ca_hoi:60000,tom:30000});
for(const [k,f] of Object.entries(DL_FISH)) SELL[k]=f.price;
for(const [k,f] of Object.entries(FISH)) SELL[k]=f.price;
Object.assign(TRAVEL,{dalatFare:250000,dalatHours:'khoảng 1 tiếng 45 phút bay + xe'});
Object.assign(FOOD,{
  banh_can_an:{name:'Bánh căn',price:30000,meal:true,exp:5},lau_ga_an:{name:'Lẩu gà lá é',price:90000,meal:true,exp:15},
  nem_an:{name:'Nem nướng',price:45000,meal:true,exp:8},sua_dau:{name:'Sữa đậu nành nóng',price:10000,drink:true,exp:4,buff:{mul:1.1,min:20}},
  cafe_dl:{name:'Cà phê Cầu Đất',price:30000,drink:true,exp:10,buff:{mul:1.3,min:30}},
});
PLACES.quan_lan={name:'Quán cơm cô Lan',where:'chợ nông trại',menu:['banh_can_an','lau_ga_an','nem_an','sua_dau','cafe_dl'],map:'dalat',x:DALAT.quan.x,y:DALAT.quan.y};
NPCS.push({id:'bactrang',scene:'dalat',x:40,y:7.4,place:'bactrang'},{id:'colan',scene:'dalat',x:28,y:57.8,place:'quan_lan'},
  {id:'chusau',scene:'dalat',x:51.5,y:35.6,place:'barn'},{id:'anhphong',scene:'dalat',x:51.5,y:12.6,place:'stable'},
  {id:'tiem_rau',scene:'dalat',x:8,y:56.8,place:'tiem_rau'},{id:'tiem_thit',scene:'dalat',x:14,y:56.8,place:'tiem_thit'},{id:'tiem_kho',scene:'dalat',x:20,y:56.8,place:'tiem_kho'});
Object.assign(NPC_LOOKS,{
  bactrang:{name:'Bác Trang (chủ nông trại)',look:{gender:'nam',hair:'cap',hairColor:'8a8a8a',skin:'b97a58',outfit:{top:'somi_caro',bottom:'kaki',shoes:'dep_to_ong',head:'mu_be'}}},
  colan:{name:'Cô Lan (quán cơm)',look:{gender:'nu',hair:'bun',hairColor:'211c21',skin:'e8a882',outfit:{top:'tee_do',bottom:'kaki',shoes:'dep_to_ong'}}},
  chusau:{name:'Chú Sáu (trại chăn nuôi)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'b97a58',outfit:{top:'tee_xanh',bottom:'jean',shoes:'giay_den'}}},
  anhphong:{name:'Anh Phong (trại ngựa)',look:{gender:'nam',hair:'messy',hairColor:'6b4128',skin:'d99a78',outfit:{top:'khoac_jean',bottom:'jean',shoes:'giay_den'}}},
  tiem_rau:{name:'Chị Ba (rau củ)',look:{gender:'nu',hair:'ponytail',hairColor:'3a2f37',skin:'e8a882',outfit:{top:'tee_xanh',bottom:'vay_den',shoes:'dep_to_ong'}}},
  tiem_thit:{name:'Anh Tư (thịt cá)',look:{gender:'nam',hair:'fade',hairColor:'211c21',skin:'d99a78',outfit:{top:'tee_trang',bottom:'short_xam',shoes:'dep_to_ong'}}},
  tiem_kho:{name:'Dì Năm (gia vị)',look:{gender:'nu',hair:'bun',hairColor:'6b4128',skin:'f3b194',outfit:{top:'somi_hoa',bottom:'kaki',shoes:'giay_den'}}},
});

/* ---------- Đi lại bằng Grab + phòng riêng là trung tâm ----------
   Rời map nào cũng phải gọi Grab trên điện thoại (cần pin ≥ 5%), phí theo quãng đường. Pháp bao chuyến đầu lên Ké.
   Ở phòng riêng: chợ online (mua bán đồ với người chơi khác), học kỹ năng, chat online. */
const DEST={home:{name:'Phòng của bạn (Hà Nội)',city:'hn'},everfit:{name:'Văn phòng Everfit (Hà Nội)',city:'hn'},
  retreat:{name:'Ké Retreat (Đà Bắc, Hoà Bình)',city:'hb'},dalat:{name:'Nông trại bác Trang (Đà Lạt)',city:'dl'}};
const GRAB={hn_hn:35000,hb_hn:200000,hb_hb:0,dl_hn:600000,dl_hb:600000,dl_dl:0,minBattery:5};   // khoá: 2 thành phố xếp theo abc
function grabFare(from,to){ return GRAB[[DEST[from].city,DEST[to].city].sort().join('_')]??0; }
// khoá học online ở phòng: mất tiền + thời gian, cần đủ cấp
const COURSES={
  cauca:{name:'Câu cá',price:150000,level:2,dur:20,desc:'Câu ở mép hồ Ké Retreat và hồ nông trại Đà Lạt.'},
  nauan:{name:'Nấu ăn',price:150000,level:2,dur:20,desc:'Nhận đơn nấu món Đà Lạt ở quán cô Lan.'},
  channuoi:{name:'Chăn nuôi',price:250000,level:2,dur:25,desc:'Mua và nuôi bò sữa, gà, lợn, cá hồi, tôm ở nông trại.'},
  kayak:{name:'Chèo kayak',price:250000,level:3,dur:25,desc:'Thuê kayak ở bãi cát cạnh bến hồ Hoà Bình.'},
  cuoingua:{name:'Cưỡi ngựa',price:400000,level:3,dur:30,desc:'Cưỡi ngựa ở Đà Lạt, chạy nhanh, chở 3 thùng hàng, được đua ngựa.'},
  lamvuon:{name:'Làm vườn lâu năm',price:350000,level:4,dur:30,desc:'Trồng cà phê, bơ, hồng, cao su (thu hoạch nhiều lần).'},
  damphan:{name:'Đàm phán',price:800000,level:5,dur:40,desc:'Bán nông sản, cá, sản phẩm chăn nuôi được thêm 10%.'},
};
Object.assign(SKILLS,{cauca:{name:'Câu cá',key:'E',desc:COURSES.cauca.desc},kayak:{name:'Chèo kayak',key:'E',desc:COURSES.kayak.desc},
  nauan:{name:'Nấu ăn',key:'E',desc:COURSES.nauan.desc},channuoi:{name:'Chăn nuôi',key:'E',desc:COURSES.channuoi.desc},
  cuoingua:{name:'Cưỡi ngựa',key:'H',desc:COURSES.cuoingua.desc},lamvuon:{name:'Làm vườn lâu năm',key:'E',desc:COURSES.lamvuon.desc},
  damphan:{name:'Đàm phán',key:'-',desc:COURSES.damphan.desc}});
const MARKET={maxListings:8,fee:.05,maxPrice:50000000};   // phí sàn 5% trên giá bán
// mã hành động trong gói vị trí (server ⇄ client)
const ACTS=['','noi','quay','gong','hokage','kiss','attack','hurt','fish','sleep','ko','work','phone','shower','cook','herd','wrestle'];
const ACT_DUR={noi:2,quay:2.4,gong:1.6,hokage:4.4,kiss:2.6,attack:.35,hurt:.4,ko:3};
// cờ trong gói vị trí
const FL={kayak:1,fish:2,dirty:4,tired:8,ride:16};
// cảnh → điểm đến Grab
const SCENE_DEST={room:'home',everfit:'everfit',retreat:'retreat',nongsan:'retreat',quanao:'retreat',club:'retreat',stay:'retreat',dalat:'dalat',track:'dalat'};
const SCENE_SIZE={retreat:[72,112],dalat:[80,70],everfit:[34,21],track:[60,30],nongsan:[14,10],quanao:[14,10],club:[26,17]};

/* ---------- Thời gian Việt Nam ---------- */
function vnTime(ms=Date.now()){ const d=new Date(ms+RULES.tzOffsetH*3600e3);
  return {day:d.toISOString().slice(0,10),h:d.getUTCHours(),m:d.getUTCMinutes(),hf:d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600,wd:d.getUTCDay()}; }
const WEEKDAYS=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
// trạng thái 3 bữa: eaten (đã ăn) / now (đang giờ ăn) / missed (bỏ bữa) / later (chưa tới giờ)
function mealStatus(meals,ms=Date.now()){ const t=vnTime(ms), eaten=(meals&&meals.day===t.day)?meals.eaten||{}:{};
  return RULES.meals.map(m=>({...m,st:eaten[m.id]?'eaten':t.hf>=m.to?'missed':t.hf>=m.from?'now':'later'})); }
function hunger(meals,ms){ return Math.min(3,mealStatus(meals,ms).filter(m=>m.st==='missed').length); }
function levelOf(exp){ let l=1; while(RULES.levels[l]!==undefined&&exp>=RULES.levels[l]) l++; return l; }
const fmt=v=>Math.round(v).toLocaleString('vi-VN')+'đ';
// tình trạng 1 ô rau lúc ms: empty / growing / ripe (chỉ chủ thu) / open (người khác cướp được)
function plotState(p,ms=Date.now()){ if(!p||!p.crop) return 'empty'; const c=CROPS[p.crop], ripe=p.at+c.grow*1000;
  if(ms<ripe) return 'growing'; if(p.stolen||ms<ripe+FARM.grace*1000) return 'ripe'; return 'open'; }

// ngoại hình → opts/colors (hex) cho RefTemplate
function lookToTemplate(look){
  const opts={hair:look.hair||'swept',top:'tee',bottom:'pants',brows:true,mouth:look.gender==='nu'?'smile':'line'}, colors={hair:look.hairColor||'211c21',skin:look.skin||'f3b194'};
  for(const [slot] of SLOTS){ const id=look.outfit&&look.outfit[slot], it=id&&CLOTHES[id]; if(!it) continue; Object.assign(opts,it.opts||{}); Object.assign(colors,it.colors||{}); }
  return {opts,colors};
}

// ngày VN (YYYY-MM-DD) cộng n ngày
function addDays(day,n){ const d=new Date(day+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
const dayOfWeek=day=>new Date(day+'T00:00:00Z').getUTCDay();
const isWeekend=day=>{ const w=dayOfWeek(day); return w===0||w===6; };
// 3 task của 1 người trong 1 ngày (cố định theo uid + ngày)
function dailyTasks(uid,day,remote){ let h=2166136261; for(const ch of uid+day){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  const pool=Object.keys(WORK_TASKS).filter(k=>!remote||WORK_TASKS[k].remote), out=[];
  while(out.length<JOB.tasksPerDay&&pool.length){ h=Math.imul(h^(h>>>15),2246822507)>>>0; out.push(pool.splice(h%pool.length,1)[0]); }
  return out; }

return {T,RULES,LOOK,SLOTS,CLOTHES,FOOD,CROPS,FARM,PLACES,INTERIORS,CLUB,ITEMS,SKILLS,QUESTS,DAILY,FISH,KAYAK_PRICE,KAYAK_MIN,CAR_PRICE,NPCS,NPC_LOOKS,PICKUPS,SPOTS,COINS,FORAGE,
  KAYAK_SPOT,BUOYS,CARS,BEAGLE_SPOT,CHICKEN_HOME,LAKE_Y,SPAWN,SOCIAL,ROOMS,BATHHOUSE,RECEPTION,NEEDS,ROOM_ACTS,PHOTO_SPOTS,TRAVEL,JOB,WORK_TASKS,INTERVIEW,OFFICE,
  DALAT,DL_FARM,ANIMALS,FEED,INGREDIENTS,RECIPES,COOK,DL_FISH,HORSE,CRATES,RACE,SELL,DEST,GRAB,grabFare,COURSES,MARKET,ACTS,ACT_DUR,FL,SCENE_DEST,SCENE_SIZE,
  vnTime,WEEKDAYS,mealStatus,hunger,levelOf,fmt,plotState,lookToTemplate,addDays,dayOfWeek,isWeekend,dailyTasks};
});
