/* Chan City — dữ liệu dùng chung cho server (Node) và client (trình duyệt).
   Server dùng file này để kiểm tra mọi thứ ảnh hưởng tới tiền, EXP, đồ, bữa ăn; client dùng để vẽ và hiện menu.
   Toạ độ theo ô 16px. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.SHARED=factory(); })(this,function(){
const T=16;

/* ---------- Quy tắc ---------- */
// foodCd: đồ ăn vặt / đồ uống mua xong phải chờ (phút) mới mua lại được; đồ uống có buff thì chờ hết buff
const RULES={foodCd:15,
  tzOffsetH:7,                       // giờ Việt Nam
  timeScale:4, timeEpoch:1792664100000,   // giờ trong game chạy nhanh gấp 4 (1 ngày game = 6 tiếng thật), tính từ mốc này để lúc chuyển ngày giờ không nhảy
  walk:70, run:118, dash:250,        // px/giây
  startMoney:2000000,
  levels:[0,100,250,450,700,1000,1400,2000,2700,3500,4500,6000,8000],maxLevel:200,   // 13 cấp đầu giữ nguyên, từ cấp 14 nối tiếp tới cấp 200 (ngay dưới RULES)
  // 3 bữa/ngày; quá giờ mà chưa ăn thì bị đói (ăn bù được)
  meals:[{id:'sang',name:'Bữa sáng',from:6,to:10},{id:'trua',name:'Bữa trưa',from:11,to:14},{id:'toi',name:'Bữa tối',from:17,to:21}],
  hungrySpeed:[1,.85,.7,.55],        // theo số bữa đã bỏ
  hungryExp:[1,.75,.5,.35],
  nearPx:44,                          // khoảng cách tối đa để tương tác
  viewRadius:560,                     // chỉ gửi người chơi trong bán kính này
  tickHz:10,
  gameExpCap:400,                     // EXP tối đa mỗi ngày từ bàn chơi + tương tác
};
// cấp 14 → 200: mỗi cấp cần thêm 2.000 + 150×(cấp − 13) EXP · cấp 50 ≈ 190 nghìn, cấp 100 ≈ 760 nghìn, cấp 200 ≈ 3 triệu EXP
for(let L=RULES.levels.length+1;L<=RULES.maxLevel;L++) RULES.levels.push(RULES.levels[L-2]+Math.round((2000+150*(L-13))/50)*50);
// mốc cấp tròn chục (từ cấp 20) thưởng tiền: cấp × 10.000đ
RULES.levelGift=lv=>lv>=20&&lv%10===0?lv*10000:0;

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
  tee_trang:{name:'Áo thun trắng',slot:'top',price:150000,opts:{top:'tee'},colors:{top:'f1f1ee'}},
  tee_den:{name:'Áo thun đen',slot:'top',price:150000,opts:{top:'tee'},colors:{top:'2b282e'}},
  tee_xanh:{name:'Áo thun xanh rêu',slot:'top',price:180000,opts:{top:'tee'},colors:{top:'5a7d4a'}},
  tee_hong:{name:'Áo thun hồng',slot:'top',price:180000,opts:{top:'tee'},colors:{top:'f2a6b8'}},
  tee_do:{name:'Áo thun đỏ',slot:'top',price:180000,opts:{top:'tee'},colors:{top:'c4382e'}},
  somi_dai:{name:'Sơ mi tay dài',slot:'top',price:290000,opts:{top:'long'},colors:{top:'dfe6ef'}},
  somi_hoa:{name:'Sơ mi hoa',slot:'top',price:350000,opts:{top:'tee',floral:true},colors:{top:'2e2740',print:'8fc4c6',line:'e2b98a'}},
  somi_caro:{name:'Sơ mi caro',slot:'top',price:320000,opts:{top:'long',plaid:true},colors:{top:'c8a77d',print:'b4473c',line:'554850'}},
  khoac_jean:{name:'Khoác jean',slot:'top',price:550000,opts:{top:'jacket'},colors:{top:'4d6f99',inner:'f1f1ee'}},
  cardigan:{name:'Cardigan + cổ lọ',slot:'top',price:490000,opts:{top:'cardigan',turtle:true},colors:{top:'2b282c',inner:'e4e9eb'}},
  vest:{name:'Vest + cà vạt',slot:'top',price:1500000,opts:{top:'suit'},colors:{top:'26252b',shirt:'eef1f2',tie:'8e2b2c'}},
  len_colo:{name:'Áo len cổ lọ',slot:'top',price:390000,opts:{top:'long',turtle:true},colors:{top:'b9a27a'}},
  jean:{name:'Quần jean',slot:'bottom',price:450000,opts:{bottom:'pants'},colors:{pants:'4d6a8a'}},
  jean_rach:{name:'Jean rách gối',slot:'bottom',price:520000,opts:{bottom:'pants',rips:true},colors:{pants:'6d90bb'}},
  kaki:{name:'Quần kaki be',slot:'bottom',price:350000,opts:{bottom:'pants'},colors:{pants:'c2a77d'}},
  quan_da:{name:'Quần da',slot:'bottom',price:850000,opts:{bottom:'pants',leather:true},colors:{pants:'2a282e'}},
  short_xam:{name:'Quần short xám',slot:'bottom',price:200000,opts:{bottom:'shorts'},colors:{pants:'6b7280'}},
  vay_do:{name:'Váy đỏ',slot:'bottom',price:380000,opts:{bottom:'skirt'},colors:{pants:'c45a6a'}},
  vay_den:{name:'Váy đen',slot:'bottom',price:380000,opts:{bottom:'skirt'},colors:{pants:'2b282e'}},
  giay_trang:{name:'Giày trắng',slot:'shoes',price:650000,colors:{shoes:'ebeae6'}},
  giay_den:{name:'Giày đen',slot:'shoes',price:650000,colors:{shoes:'2a2a2f'}},
  giay_luoi:{name:'Giày lười đỏ',slot:'shoes',price:890000,colors:{shoes:'a5302b'}},
  dep_to_ong:{name:'Dép tổ ong',slot:'shoes',price:60000,colors:{shoes:'5fb7a0'}},
  kinh_can:{name:'Kính cận',slot:'eyes',price:350000,opts:{glasses:'yes'}},
  kinh_ram:{name:'Kính râm',slot:'eyes',price:250000,opts:{glasses:'sun'}},
  mu_be:{name:'Mũ lưỡi trai be',slot:'head',price:120000,opts:{hair:'cap',capPattern:true},colors:{cap:'b49b78'}},
  mu_do:{name:'Mũ lưỡi trai đỏ',slot:'head',price:120000,opts:{hair:'cap'},colors:{cap:'c4382e'}},
  day_vang:{name:'Dây chuyền vàng',slot:'neck',price:8500000,opts:{chain:true},colors:{gold:'e8b83a'}},
  day_bac:{name:'Dây chuyền bạc',slot:'neck',price:1200000,opts:{chain:true},colors:{gold:'a8aeb6'}},
  dong_ho:{name:'Đồng hồ',slot:'wrist',price:2500000,opts:{watch:true},colors:{watch:'2a2a2f'}},
  vong_vang:{name:'Vòng tay vàng',slot:'wrist',price:4500000,opts:{bracelet:true},colors:{gold:'e8b83a'}},
  // đồ NPC, không bán
  dong_phuc_ca:{name:'Đồng phục công an',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'5d6b3c'}},
  mu_ca:{name:'Mũ công an',slot:'head',price:0,hidden:true,opts:{hair:'cap'},colors:{cap:'5d6b3c'}},
  ao_den_chu:{name:'Áo thun đen in chữ',slot:'top',price:0,hidden:true,opts:{top:'tee',print:true},colors:{top:'1c1a20',print:'e8c03a',line:'e05a5a'}},
  ao_navy:{name:'Áo dài tay xanh than (thầy Dương Vũ)',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'1e2436'}},
  // set hot: mặc 1 món là thay cả bộ (Superman giữ đầu nhân vật, Batman trùm kín đầu)
  set_superman:{name:'Set Superman 🔥',slot:'top',price:1990000,hot:true,set:'superman',opts:{top:'long',bottom:'pants'},colors:{top:'2a62c8',pants:'2a62c8',shoes:'c8282a'}},
  set_batman:{name:'Set Batman 🔥',slot:'top',price:2490000,hot:true,set:'batman',opts:{top:'long',bottom:'pants'},colors:{top:'8a8a96',pants:'3a3e4a',shoes:'1c1c22'}},
  // skin riêng của Kaixa (chỉ tài khoản Kaixa có): blazer satin đen hở cổ đeo dây chuyền bạc, quần ống rộng đen, kính vuông tròng xanh nhạt
  blazer_kaixa:{name:'Blazer satin đen · Kaixa',slot:'top',price:0,hidden:true,opts:{top:'jacket',chain:true},colors:{top:'202026',inner:'ecb898',gold:'d0d4da'}},quan_kaixa:{name:'Quần ống rộng satin đen · Kaixa',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'18181e'}},
  kinh_kaixa:{name:'Kính vuông tròng xanh · Kaixa',slot:'eyes',price:0,hidden:true,opts:{glasses:'tint'}},
  ao_cr7:{name:'Áo đỏ số 7',slot:'top',price:0,hidden:true,colors:{top:'a80000'}},quan_cr7:{name:'Quần đùi xanh lá',slot:'bottom',price:0,hidden:true,opts:{bottom:'shorts'},colors:{pants:'48d848'}},
  ao_messi:{name:'Áo sọc xanh trắng số 10',slot:'top',price:0,hidden:true,opts:{floral:true},colors:{top:'4ab8f8',print:'f4f4f4'}},quan_messi:{name:'Quần đùi đen',slot:'bottom',price:0,hidden:true,opts:{bottom:'shorts'},colors:{pants:'1c1c22'}},
  ao_oii:{name:'Áo chàm vùng cao',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'1c1a20'}},quan_oii:{name:'Quần chàm',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'201e26'}},
  mu_oii:{name:'Mũ thêu thổ cẩm',slot:'head',price:0,hidden:true,opts:{hair:'cap',mongCap:true},colors:{cap:'1c1a20'}},vong_oii:{name:'Vòng cổ bạc',slot:'neck',price:0,hidden:true,opts:{chain:true},colors:{gold:'d8dce2'}},
  ao_diep:{name:'Váy trắng chấm bi trễ vai',slot:'top',price:0,hidden:true,opts:{polka:true},colors:{top:'f6f2ea',print:'1c1516'}},vay_diep:{name:'Chân váy trắng',slot:'bottom',price:0,hidden:true,opts:{bottom:'skirt'},colors:{pants:'f6f2ea'}},
  ngoc_diep:{name:'Vòng cổ ngọc trai',slot:'neck',price:0,hidden:true,opts:{chain:true},colors:{gold:'f8f4ec'}},ao_annie:{name:'Áo khoác dạ lạc đà + cổ lọ xanh rêu',slot:'top',price:0,hidden:true,opts:{top:'jacket',turtle:true},colors:{top:'c8964e',inner:'1e4a3a'}},quan_annie:{name:'Quần đen ống đứng',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'26242a'}},
  ao_do:{name:'Áo phông đen anh Độ',slot:'top',price:0,hidden:true,colors:{top:'1c1c22'}},quan_do:{name:'Quần short xám',slot:'bottom',price:0,hidden:true,opts:{bottom:'shorts'},colors:{pants:'5a5e68'}},
  ao_pickle:{name:'Áo thể thao HLV',slot:'top',price:0,hidden:true,colors:{top:'2f9a52'}},
  ao_qnt:{name:'Áo len sọc dọc cam đen',slot:'top',price:0,hidden:true,opts:{vstripe:true},colors:{top:'f2ece0',print:'c8642a'}},kinh_qnt:{name:'Kính lục giác tròng cam',slot:'eyes',price:0,hidden:true,opts:{glasses:'tint',lensO:true}},
  ao_mck:{name:'Áo khoác da đen + ba lỗ trắng',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'1a1a1e',inner:'f0ede6'}},quan_mck:{name:'Quần short đen tua rua',slot:'bottom',price:0,hidden:true,opts:{bottom:'shorts'},colors:{pants:'1c1c20'}},
  ao_csgt:{name:'Áo cảnh sát giao thông',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'e8c860'}},quan_csgt:{name:'Quần CSGT',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'d8b850'}},mu_csgt:{name:'Mũ kê-pi CSGT',slot:'head',price:0,hidden:true,opts:{hair:'cap'},colors:{cap:'e8c860'}},
  ao_kiemlam:{name:'Áo kiểm lâm',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'4f6e3a'}},ao_nau:{name:'Áo nâu nhà chùa',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'8a5a2a'}},
  blazer_be:{name:'Blazer be (thầy Huy Tạ)',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'b8a070',inner:'1c1c22'}},
  ao_tuyen_vn:{name:'Áo khoác đỏ tuyển Việt Nam',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'c8282a',inner:'cfe0f0'}},
  dong_phuc_bv:{name:'Đồng phục bảo vệ',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'2f3b5a'}},
  mu_bv:{name:'Mũ bảo vệ',slot:'head',price:0,hidden:true,opts:{hair:'cap'},colors:{cap:'2f3b5a'}},
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
  banhmi_danto:{name:'Bánh mì Dân Tổ',price:35000,snack:true,exp:4},
  tra_da:{name:'Trà đá',price:5000,drink:true,exp:3,buff:{mul:1.1,min:20}},
  bac_xiu:{name:'Bạc xỉu',price:35000,drink:true,exp:9,buff:{mul:1.2,min:30}},cafe_muoi:{name:'Cà phê muối',price:40000,drink:true,exp:10,buff:{mul:1.25,min:35}},
  tra_dao:{name:'Trà đào cam sả',price:45000,drink:true,exp:8,buff:{mul:1.15,min:40}},banh_ngot:{name:'Bánh croissant',price:30000,snack:true,exp:4},
  lon_man:{name:'Thịt lợn mán nướng',price:150000,meal:true,exp:25},ca_suoi:{name:'Cá suối nướng',price:120000,meal:true,exp:22},xoi_ngu_sac:{name:'Xôi ngũ sắc',price:40000,meal:true,exp:8},
  lau_ca_lang:{name:'Lẩu cá lăng',price:250000,meal:true,exp:35},ruou_can:{name:'Rượu cần',price:80000,drink:true,exp:12,drunk:90,buff:{mul:1.1,min:15}},
  bia_hoi:{name:'Bia hơi',price:15000,drink:true,exp:4,drunk:45,buff:{mul:1.05,min:10}},
  mi_goi:{name:'Mì gói',price:8000,snack:true,exp:2},banh_bao:{name:'Bánh bao',price:15000,snack:true,exp:3},sua_chua:{name:'Sữa chua',price:10000,snack:true,exp:2},
  sting:{name:'Sting dâu',price:12000,drink:true,exp:4,energy:15,buff:{mul:1.08,min:15}},mi_trung:{name:'Mì gói trứng xúc xích',price:25000,meal:true,exp:4},
  nuoc_tang_luc:{name:'Nước tăng lực',price:15000,drink:true,exp:3,energy:20,buff:{mul:1.05,min:10}},
  cafe_den:{name:'Cafe đen',price:25000,drink:true,exp:8,buff:{mul:1.25,min:30}},
  cafe_sua:{name:'Cafe sữa đá',price:30000,drink:true,exp:10,buff:{mul:1.3,min:30}},
  nuoc_dua:{name:'Nước dừa',price:20000,drink:true,exp:5,buff:{mul:1.15,min:20}},
};

/* ---------- Trồng rau ---------- */
// grow: giây tới lúc chín; sau khi chín chủ có `grace` giây để thu, quá thì người khác cướp được 50%
const CROPS={
  rau_muong:{name:'Rau muống',seed:2000,grow:1200,yield:3,sell:8000,exp:5,col:'5fae46'},
  cai_ngot:{name:'Cải ngọt',seed:3000,grow:1500,yield:3,sell:10000,exp:6,col:'8cc95a'},
  ca_chua:{name:'Cà chua',seed:5000,grow:3600,yield:4,sell:18000,exp:12,col:'d9463a'},
  ngo:{name:'Ngô',seed:3000,grow:1320,yield:4,sell:7000,exp:6,col:'f2c43d'},
  bi_do:{name:'Bí đỏ',seed:8000,grow:3900,yield:2,sell:40000,exp:14,col:'e88a2e'},
  dua_hau:{name:'Dưa hấu',seed:10000,grow:5400,yield:2,sell:55000,exp:20,col:'3f8a3a'},
  // thêm rau củ quả cho vườn Ké (giá hạt / thời gian lớn / giá bán tăng dần)
  hanh_la:{name:'Hành lá',seed:2000,grow:1200,yield:3,sell:8500,exp:5,col:'6cc04a'},
  cu_cai_do:{name:'Củ cải đỏ',seed:2500,grow:1500,yield:3,sell:10000,exp:6,col:'d8304a'},
  dau_que:{name:'Đậu que',seed:3000,grow:1800,yield:3,sell:11000,exp:7,col:'4aa83a'},
  dua_leo:{name:'Dưa leo',seed:3000,grow:1800,yield:4,sell:9000,exp:7,col:'2f8a3a'},
  can_tay:{name:'Cần tây',seed:3000,grow:2100,yield:3,sell:12000,exp:8,col:'9ad46a'},
  toi:{name:'Tỏi',seed:4000,grow:2400,yield:3,sell:15000,exp:9,col:'f0ece0'},
  hanh_tay:{name:'Hành tây',seed:4000,grow:2400,yield:3,sell:14000,exp:9,col:'c8783a'},
  cu_den:{name:'Củ dền',seed:4000,grow:2700,yield:3,sell:16000,exp:10,col:'9a1a3a'},
  khoai_tay:{name:'Khoai tây',seed:4000,grow:3000,yield:4,sell:13000,exp:10,col:'c89a5a'},
  ot:{name:'Ớt',seed:5000,grow:3000,yield:4,sell:15000,exp:11,col:'e2302a'},
  dau_ha_lan:{name:'Đậu Hà Lan',seed:5000,grow:3300,yield:4,sell:16000,exp:12,col:'7ac84a'},
  ca_tim:{name:'Cà tím',seed:6000,grow:3600,yield:3,sell:22000,exp:13,col:'7a3a9a'},
  bong_cai:{name:'Bông cải xanh',seed:6000,grow:3900,yield:2,sell:32000,exp:14,col:'3a8a3a'},
  sup_lo:{name:'Súp lơ trắng',seed:6000,grow:3900,yield:2,sell:32000,exp:14,col:'f4f0dc'},
  ot_chuong:{name:'Ớt chuông',seed:7000,grow:4200,yield:3,sell:26000,exp:15,col:'f2a020'},
  bi_ngoi:{name:'Bí ngòi vàng',seed:7000,grow:4500,yield:2,sell:38000,exp:16,col:'f2d030'},
};
// vườn Ké: không thuê trồng được free ô; thuê đất của chú Ba (trả theo ngày) thì được nhiều ô hơn
const KE_LAND=[{id:'luong',name:'Vài luống',plots:6,price:40000},{id:'vuon',name:'Mảnh vườn',plots:10,price:70000},{id:'trai',name:'Cả khu vườn',plots:16,price:120000}];
const FARM={grace:90,maxPlots:6,free:2,steal:.5,stealExp:3,plots:[],trang:{catch:.25,comp:100000}};   // trang: ở Đà Lạt bác Trang bắt quả tang kẻ cướp rau, bắt đền chủ vườn
for(const y of [77,78,80,81,83,84]) for(const x of [50,51,52,53,54,55,56,57,59,60,61,62,63,64,65,66]) FARM.plots.push({x:x+.5,y:y+.5});
// vườn mở thêm trong rừng: sườn đồi phía Tây (cạnh đường bộ) và phía Đông (dưới đường vòng)
for(const y of [63,64,66,67,69,70]) for(let x=4;x<=13;x++) FARM.plots.push({x:x+.5,y:y+.5});
for(const y of [52,53,55,56]) for(let x=59;x<=66;x++) FARM.plots.push({x:x+.5,y:y+.5});
// sân nuôi gà ở Ké (mua gà, thóc ở tiệm cô Ké)
const KE_YARD={x:63.5,y:46.6,x0:61,y0:44,x1:66,y1:48};

/* ---------- Địa điểm ---------- */
// door: chỗ đứng bấm E để vào; scene: cảnh bên trong
const PLACES={
  quan_com:{name:'Quán cơm Ven Hồ',where:'ngoài homestay',menu:['com_ga','pho','com_rang','banh_mi','tra_da'],buys:['ca_ro','ca_chep','ca_lang'],x:18.5,y:93},
  cafe:{name:'Cafe Bến Hồ',where:'ngoài homestay',menu:['cafe_den','cafe_sua','nuoc_dua','tra_da','banh_mi'],x:24.5,y:93},
  nha_an:{name:'Nhà ăn khu trên',where:'trong homestay',menu:['co_la','ca_nuong','ga_doi','com_lam','tra_da'],x:23.2,y:39.6},
  nongsan:{name:'Tiệm nông sản Ké',where:'ngay cổng',door:{x:51.5,y:92.7},scene:'nongsan'},
  quanao:{name:'Shop Chande',where:'đầu homestay',door:{x:57.5,y:92.7},scene:'quanao'},
  thuexe:{name:'Tiệm thuê xe máy',where:'cạnh Shop Chande',door:{x:63.5,y:92.7},x:63.5,y:92.7},
  cafe2:{name:'Cafe Đà Bắc',where:'thị trấn',door:{x:80.5,y:92.7},scene:'cafe2',menu:['bac_xiu','cafe_muoi','tra_dao','cafe_den','banh_ngot'],x:80.5,y:92.7},
  sieuthi:{name:'Siêu thị Đà Bắc',where:'thị trấn',door:{x:91.5,y:92.7},scene:'sieuthi',menu:['mi_goi','banh_bao','sua_chua','nuoc_tang_luc','banh_mi','tra_da'],x:91.5,y:92.7},
  net:{name:'Tiệm net Cỏ',where:'thị trấn',door:{x:102.5,y:92.7},scene:'net',x:102.5,y:92.7},
  nhau:{name:'Quán nhậu đặc sản Mường',where:'thị trấn',door:{x:111.5,y:92.7},menu:['lon_man','ca_suoi','xoi_ngu_sac','lau_ca_lang','ruou_can','bia_hoi'],x:111.5,y:92.7},
  baotang:{name:'Bảo tàng lịch sử Hoà Bình',where:'thị trấn',door:{x:130.5,y:92.7},x:130.5,y:92.7},
  chua:{name:'Chùa Đà Bắc',where:'đồi phía Bắc thị trấn',door:{x:148.5,y:46.4},x:148.5,y:47},
  park:{name:'Vườn quốc gia Đà Bắc',where:'cuối đường phía Đông',door:{x:216.5,y:94.2},x:216.5,y:94.2},
  club:{name:'Nhà giải trí',where:'cạnh Deck ngắm cảnh',door:{x:16,y:42.7},scene:'club'},
  danto:{name:'Bánh mì Dân Tổ',where:'ngoài cổng, phía Tây',menu:['banhmi_danto','tra_da'],x:11.5,y:91.9},
  doncongan:{name:'Đồn công an Đà Bắc',where:'đầu đường ven hồ',door:{x:5.9,y:92.7},scene:'doncongan'},
};
// cảnh trong nhà: kích thước, chỗ ra vào (spawn) và cửa
const INTERIORS={
  nongsan:{name:'Tiệm nông sản Ké',W:14,H:10,spawn:{x:7,y:8.2},exit:'nongsan'},
  quanao:{name:'Shop Chande',W:14,H:10,spawn:{x:7,y:8.2},exit:'quanao'},
  club:{name:'Nhà giải trí',W:26,H:17,spawn:{x:13,y:15.2},exit:'club'},
  doncongan:{name:'Đồn công an Đà Bắc',W:14,H:10,spawn:{x:7,y:8.2},exit:'doncongan'},
  phongbay:{name:'Phòng Bay',W:20,H:14,spawn:{x:10,y:12.2},exit:'phongbay'},
  sieuthi:{name:'Siêu thị Đà Bắc',W:20,H:14,spawn:{x:10,y:12.2},exit:'sieuthi'},
  net:{name:'Tiệm net Cỏ',W:20,H:13,spawn:{x:10,y:11.2},exit:'net'},
  cafe2:{name:'Cafe Đà Bắc',W:18,H:12,spawn:{x:9,y:10.2},exit:'cafe2'},
  quan_lan:{name:'Quán cơm cô Lan',W:16,H:11,spawn:{x:8,y:9.2},exit:'quan_lan',map:'dalat'},
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
  // bot tiếp khách khi không có người: bot cờ, bot poker, quản trò ma sói (trả tiền nhờ tìm người; thắng ăn pot ×1,5 vì nhà cái bù tiền cho bot)
  // câu cửa miệng của Tú Sena khi ngồi bàn poker
  tuSena:{name:'Tú Sena',join:'Mến chào các con vợ!',raise:'Chan bố mày đê!',fold:'Em Tú sợ đi bệnh viện lắm...',win:'Em Tú chơi để có tiền đóng viện phí cho các bác sĩ!'},
  bots:{masoiHire:80000,masoiSize:6,masoiBonus:1.5,pokerBots:3,pokerChips:300000,names:['Bot Tèo','Bot Tí','Bot Sửu','Bot Dần','Bot Mão','Bot Thìn','Bot Tỵ','Bot Ngọ','Bot Mùi']},
};

/* ---------- Hoạt động ---------- */
const ITEMS={
  bone:{name:'Xương gặm',icon:'bone'},speaker:{name:'Loa bluetooth',icon:'speaker'},wood:{name:'Củi khô',icon:'wood'},
  fish:{name:'Cá sông Đà',icon:'fish'},chicken:{name:'Gà đồi',icon:'chicken'},comlam:{name:'Cơm lam',icon:'comlam'},
  paper:{name:'Wireframe',icon:'paper'},khoga:{name:'Khô gà đè tem',icon:'khoga'},pho_thao:{name:'Phở chị Thảo',icon:'pho'},sunglasses:{name:'Kính râm',icon:'sunglasses'},chain:{name:'Dây chuyền vàng',icon:'chain'},
  hat:{name:'Nón Hokage',icon:'hat'},bracelet:{name:'Vòng tay bạc',icon:'bracelet'},lighter:{name:'Bật lửa',icon:'lighter'},
  hoa:{name:'Hoa rừng',icon:'flower'},la:{name:'Lá trang trí',icon:'leaf'},
  mang:{name:'Măng rừng',icon:'shoot'},rau:{name:'Rau rừng',icon:'greens'},trung:{name:'Trứng gà',icon:'egg'},nam:{name:'Nấm rừng',icon:'mushroom'},
  ca_ro:{name:'Cá rô',icon:'fish'},ca_chep:{name:'Cá chép',icon:'fish2'},ca_lang:{name:'Cá lăng sông Đà',icon:'fish3'},
};
for(const [k,c] of Object.entries(CROPS)){ ITEMS['hat_'+k]={name:'Hạt '+c.name.toLowerCase(),icon:'seed',col:c.col}; ITEMS[k]={name:c.name,icon:'crop_'+k}; }
const SKILLS={
  pickle:{name:'Pickleball',key:'—',desc:'Học với HLV Tuấn ở sân pickleball Cầu Giấy (Hà Nội), mở khoá đấu 2 vs 2'},
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
  buom:{giver:'phap',title:'Bắt bướm',desc:'Cầm vợt Pháp đưa, vào các khu rừng ở Ké (dọc Đường bộ, vườn rau, đồi phía Tây, khu trên) bắt đủ 5 loài bướm khác nhau.',butterflies:5,reward:{exp:80,vnd:200000,skill:'run'}},
  lo:{giver:'phap',after:'buom',title:'Giải toả',desc:'Về phòng của mình (phòng ở Hà Nội hoặc phòng thuê), pin điện thoại trên 50% rồi mở điện thoại xem phim người lớn để giải toả. Làm ngoài đường là bị công an phạt!',lo:1,reward:{exp:60,vnd:100000}},
  loa:{giver:'khabanh',title:'Loa bluetooth',desc:'Lấy cái loa Khá Bảnh để quên ở Lều 1.',need:{speaker:1},reward:{exp:70,vnd:100000,item:'bracelet',skill:'quay'}},
  cui:{giver:'donche',title:'Củi cho lửa trại',desc:'Gom 5 bó củi khô dọc Đường bộ lên đồi.',need:{wood:5},reward:{exp:60,vnd:150000,item:'lighter',skill:'dash'}},
  co:{giver:'phule',title:'Cỗ lá Mường',desc:'Mang về Cá sông Đà (bến hồ), Gà đồi (quanh Nhà Ngủ), Cơm lam (cạnh Nhà Mái Đá).',need:{fish:1,chicken:1,comlam:1},reward:{exp:100,vnd:500000,item:'chain',skill:'gong'}},
  anh:{giver:'kenny',title:'Check-in 3 view',desc:'Chụp ảnh ở Bến hồ Hoà Bình, Cổng Ké Retreat và Nền khu cắm trại.',spots:['ben','cong','camtrai'],reward:{exp:80,vnd:200000,item:'sunglasses',skill:'soi'}},
  banhmi:{giver:'donche',after:'cui',title:'Bánh mì Dân Tổ',desc:'Ăn bánh mì Dân Tổ (quán ngoài cổng, phía Tây) đủ 2 lần.',eat:{id:'banhmi_danto',n:2},reward:{exp:70,vnd:150000}},
  quay2:{giver:'khabanh',after:'loa',title:'Quẩy ở Phòng Bay',desc:'Vào Phòng Bay (cửa bên trái trong Nhà giải trí), nhảy 1 bài đạt ít nhất 8 PERFECT.',dance:8,reward:{exp:120,vnd:250000}},
  khoga:{giver:'oii',title:'Khô gà đè tem',desc:'Ộ i i nhờ gom đủ 10 gói khô gà đè tem rơi rải rác ở mọi map: Ké Retreat, Đà Lạt, DAS, văn phòng Everfit, Nhà giải trí, tiệm net (minimap có chấm cam).',need:{khoga:10},reward:{exp:150,vnd:300000}},
  shisha:{giver:'oii',title:'Shisha với Ộ i i',desc:'Vào Nhà giải trí (cạnh Deck ngắm cảnh), ngồi góc shisha hút cùng Ộ i i. Có người khác trong phòng là dễ bị chụp ảnh báo công an!',shisha:1,reward:{exp:100,vnd:200000}},
  // việc thiết kế của Huy Phan (nối tiếp nhau sau "Wireframe bay mất"): chạy sang Lumen Studio / DAS làm (job), xong về Ké báo Huy Phan
  hp_logo:{giver:'huyphan',after:'web',title:'Logo mới cho Ké Retreat',desc:'Sang Lumen Studio (Hà Nội), ngồi 1 bàn làm việc vẽ logo mới cho Ké.',job:{where:'lumen',at:'desk',dur:20,label:'Vẽ logo Ké Retreat'},prog:1,reward:{exp:300,vnd:800000}},
  hp_ux:{giver:'huyphan',after:'hp_logo',title:'Phỏng vấn người dùng',desc:'Bay vào DAS (TP.HCM), ngồi ghế lớp học phỏng vấn học viên về trải nghiệm đặt phòng Ké.',job:{where:'das',at:'seat',dur:20,label:'Phỏng vấn học viên DAS'},prog:1,reward:{exp:320,vnd:1000000}},
  hp_proto:{giver:'huyphan',after:'hp_ux',title:'Test prototype với Annie',desc:'Mang prototype app đặt phòng Ké sang Lumen Studio cho Annie test thử.',job:{where:'lumen',npc:'lumen_le',dur:15,label:'Cho Annie test prototype'},prog:1,reward:{exp:350,vnd:1200000}},
  hp_mood:{giver:'huyphan',after:'hp_proto',title:'Duyệt moodboard với thầy Huy Tạ',desc:'Bay vào DAS trình moodboard nhận diện mới với thầy Huy Tạ.',job:{where:'das',npc:'huyta',dur:15,label:'Trình moodboard với thầy Huy Tạ'},prog:1,reward:{exp:380,vnd:1500000}},
  hp_ds:{giver:'huyphan',after:'hp_mood',title:'Design system cho Ké',desc:'Cần chứng chỉ DAS "UI Design & Design System". Ngồi bàn Lumen Studio dựng design system hoàn chỉnh cho Ké.',job:{where:'lumen',at:'desk',dur:25,label:'Dựng design system cho Ké',cert:'ui'},prog:1,reward:{exp:500,vnd:3000000}},
  pho:{giver:'do',title:'Phở chị Thảo trong truyền thuyết',desc:'Anh Độ vẽ bản đồ: từ cổng Ké theo đường Thuỵ Khuê về phía Đông, qua Siêu thị Đà Bắc, quán nấp trong con ngõ nhỏ giữa 2 dãy nhà. Mua 1 bát mang về 120 Yên Lãng.',need:{pho_thao:1},reward:{exp:150,vnd:300000}},
  hulk:{giver:'do',title:'Lau mô hình Hulkbuster',desc:'Mô hình Hulkbuster 3 mét ở góc phòng anh Độ bám bụi. Lau đủ 3 lượt (đầu, thân, chân), nhẹ tay kẻo xước sơn.',prog:3,reward:{exp:120,vnd:200000}},
  goioii:{giver:'do',title:'Gọi Ộ i i về ăn cơm',desc:'Ộ i i đi lang thang chưa về. Ra các map tìm Ộ i i, bấm E nói "Anh Độ gọi về ăn cơm", rồi quay lại 120 Yên Lãng báo anh Độ.',prog:1,reward:{exp:120,vnd:200000}},
  web:{giver:'huyphan',title:'Wireframe bay mất',desc:'Nhặt 3 tờ wireframe quanh Nhà Ngủ, Bể bơi dự kiến và đường xuống Deck.',need:{paper:3},reward:{exp:120,vnd:300000,item:'hat',skill:'hokage'}},
};
// việc mỗi ngày cho Cô Ké (làm lại được mỗi ngày)
const DAILY={
  trangtri:{title:'Hoa lá trang trí',desc:'Mang 8 hoa hoặc lá cho Cô Ké trang trí Nhà Rếch.',need:{any:['hoa','la'],count:8},reward:{exp:60,vnd:80000}},
  nauan:{title:'Nguyên liệu nấu cỗ',desc:'Tìm 5 nguyên liệu (măng, rau, trứng, nấm) cho Cô Ké nấu ăn.',need:{any:['mang','rau','trung','nam'],count:5},reward:{exp:80,vnd:120000}},
  kayak:{title:'Chèo kayak 5 phao',desc:'Thuê kayak, chạm đủ 5 phao trên hồ Hoà Bình.',reward:{exp:120,vnd:150000}},
};
const FISH={ca_ro:{w:60,exp:8,price:12000},ca_chep:{w:30,exp:12,price:40000},ca_lang:{w:10,exp:25,price:120000}};
// kayak 150.000đ/giờ (giá thật của khu nghỉ); xe 4 bánh lên dốc miễn phí, xuống dốc 15.000đ/lượt
// câu cá kiểu Dota 2 Crownfall: mặt hồ có 6 bóng cá, chọn con để thả câu → phao chìm thì bấm nhanh → giữ vùng xanh bám theo cá tới khi đầy thanh
// size: 1 nhỏ · 2 vừa · 3 to; con lấp lánh (sparkle) thưởng gấp đôi EXP; reel: số giây kéo tối thiểu
const FISHING={count:6,daily:12,react:2200,sizes:{1:{reel:2,zone:.6,jitter:.3},2:{reel:2.5,zone:.5,jitter:.45},3:{reel:3,zone:.42,jitter:.65}},
  ke:{1:['ca_ro'],2:['ca_chep'],3:['ca_lang']},dl:{1:['ca_ro_phi'],2:['ca_chep'],3:['ca_tam']},sparkle:.12};
const KAYAK_PRICE=150000, KAYAK_MIN=60, CAR_PRICE=15000;
// báu vật vớt được khi chèo kayak: cứ chèo đủ `every` px thì tung xúc xắc `chance`; mỗi ngày tối đa `daily` món
// đua xe bốc đầu với Đôn Chề trên đường đèo (nguy hiểm, có thể bị công an bắt)
// 4 xe thuê của Đôn Chề, mỗi xe nhỉnh hơn xe trước: window (ms bấm trúng), fall (tỉ lệ xoè khi trượt), pay (hệ số thưởng), police (cộng thêm tỉ lệ bị bắt)
const BIKES={wave:{name:'Wave đỏ mẹ mua',price:0,window:200,fall:.5,speed:170,pay:1,police:0,desc:'Xe của mẹ, đi êm, không mất tiền thuê'},
  dream:{name:'Dream Thái',price:30000,window:230,fall:.42,speed:180,pay:1.15,police:0,desc:'Bền bỉ, dễ bốc đầu hơn chút'},
  exciter:{name:'Exciter "trộm chó"',price:80000,window:255,fall:.36,speed:200,pay:1.3,police:.05,desc:'Nhanh, bốc đầu ngọt, nhưng công an để ý hơn'},
  sh:{name:'SH đại gia',price:150000,window:280,fall:.3,speed:210,pay:1.5,police:-.05,desc:'Đắt nhất, êm nhất, ít bị nghi ngờ'}};
const WHEELIE={cues:6,gap:3500,lead:1300,window:200,fallChance:.5,energy:15,clean:20,maxFalls:3,policeBase:.12,policePer:.05,policeMax:.45,fine:150000,jail:120,speed:170,daily:3,exp:15,vnd:30000,lane:7};
// Phòng Bay (cửa trong Nhà giải trí): nhảy kiểu Audition theo 10 bài nhạc Magnific tạo. Mỗi lượt = 2 ô nhịp (8 phách), bấm Space ở phách cuối
const SONGS=[{id:'dance01',name:'Bay Lên Ké',bpm:132},{id:'dance02',name:'Đêm Đà Bắc',bpm:128},{id:'dance03',name:'Quẩy Hết Mình',bpm:140},{id:'dance04',name:'Sông Đà Bass',bpm:126},
  {id:'dance05',name:'Lửa Trại',bpm:120},{id:'dance06',name:'Đà Lạt Sương Mù',bpm:124},{id:'dance07',name:'Disco Nông Trại',bpm:118},{id:'dance08',name:'Everfit Workout',bpm:130},
  {id:'dance09',name:'Hokage Drop',bpm:136},{id:'dance10',name:'Saiyan Rave',bpm:150}];
const DANCE={tip:500000,maxDancers:6,rounds:8,lobbyMs:12000,judge:[[50,'PERFECT',1000],[110,'GREAT',700],[190,'COOL',400],[280,'BAD',100]],combo:100,exp:[60,40,30,20,15,10],door:{x:2.2,y:9}};
const TREASURE={every:300,chance:.4,daily:8,items:{dong_xu_co:{name:'Đồng xu cổ',w:55,price:80000},binh_gom:{name:'Bình gốm cổ',w:26,price:300000},
  ngoc_trai:{name:'Ngọc trai sông Đà',w:14,price:500000},ruong_bau:{name:'Rương báu',w:5,price:2000000}}};

/* ---------- Vị trí trên map Ké Retreat ---------- */
// scene: cảnh NPC đứng (mặc định retreat); place: bấm E mở menu của địa điểm
// NPC đi dạo quanh Ké theo lộ trình cố định (tính sẵn theo đường mòn, các đoạn thẳng không xuyên tường), dừng `dwell` giây ở điểm neo.
// Vị trí tính theo giờ server nên máy nào cũng thấy cùng 1 chỗ, server dùng luôn để kiểm tra "đứng gần người giao việc"
const NPC_ROAM={phap:{speed:1.5,pts:[[34.5, 92.7, 8], [39.5, 92.7, 0], [39.5, 84.7, 0], [46.5, 84.7, 0], [46.5, 89.7, 0], [45.5, 89.7, 8], [46.5, 89.7, 0], [46.5, 84.7, 0], [40.5, 84.7, 8], [38.5, 84.7, 0], [38.5, 85.7, 0], [29.5, 87.7, 8], [23.5, 88.7, 0], [21.5, 88.7, 0], [21.5, 94.7, 8], [29.5, 93.7, 0], [33.5, 93.7, 8]]},
  khabanh:{speed:1.5,pts:[[37.5, 80.7, 8], [35.5, 76.7, 0], [28.5, 76.7, 8], [20.5, 75.7, 8], [22.5, 60.7, 8], [16.5, 43.7, 8], [24.5, 43.7, 0], [24.5, 44.7, 8], [23.5, 46.7, 0], [23.5, 48.7, 0], [33.5, 58.7, 8], [36.5, 70.7, 0], [36.5, 76.7, 0]]}};
const ROAM_C={};
function roamPos(id,ms){ const R=NPC_ROAM[id]; if(!R) return null; let C=ROAM_C[id];
  if(!C){ const seg=[]; let t=0; R.pts.forEach((a,i)=>{ const b=R.pts[(i+1)%R.pts.length]; if(a[2]){ seg.push({t0:t,t1:t+a[2],ax:a[0],ay:a[1],bx:a[0],by:a[1]}); t+=a[2]; }
      const d=Math.hypot(b[0]-a[0],b[1]-a[1]); if(d>0){ seg.push({t0:t,t1:t+d/R.speed,ax:a[0],ay:a[1],bx:b[0],by:b[1]}); t+=d/R.speed; } }); C=ROAM_C[id]={seg,total:t}; }
  const t=(ms/1000)%C.total; let lo=0, hi=C.seg.length-1; while(lo<hi){ const m=(lo+hi)>>1; if(C.seg[m].t1<=t) lo=m+1; else hi=m; }
  const s=C.seg[lo], k=s.t1>s.t0?(t-s.t0)/(s.t1-s.t0):0, dx=s.bx-s.ax, dy=s.by-s.ay; return {x:s.ax+dx*k,y:s.ay+dy*k,moving:!!(dx||dy),dx,dy}; }
const NPCS=[
  {id:'phap',pass:true,x:36.4,y:90.8},{id:'khabanh',x:37,y:80.6},{id:'donche',x:28.5,y:89.4},
  {id:'phule',x:25.6,y:40.6},{id:'kenny',x:21.3,y:41.6},{id:'huyphan',x:40,y:36.4},
  {id:'quancom',x:18.5,y:93,place:'quan_com'},{id:'barista',x:24.5,y:93,place:'cafe'},{id:'chibep',x:23.2,y:39.6,place:'nha_an'},
  {id:'coke',scene:'nongsan',x:7,y:3.9,place:'nongsan'},{id:'shopkeeper',scene:'quanao',x:7,y:3.9,place:'quanao'},
  {id:'letan',x:47.6,y:89.4,place:'letan'},{id:'thuexe',x:66.4,y:92.6,place:'thuexe'},{id:'chuongngua',x:160.5,y:88.6,place:'stable'},{id:'kiemlam',x:210.6,y:92.6,place:'park'},{id:'suthay',x:146,y:48,place:'chua'},{id:'huongdan',x:127,y:92.8,place:'baotang'},{id:'chunet',scene:'net',x:16.2,y:3.6,place:'net'},{id:'thungan',scene:'sieuthi',x:15.5,y:9.5,place:'sieuthi'},{id:'barista2',scene:'cafe2',x:5,y:2.7,place:'cafe2'},{id:'huyta',scene:'das',x:7,y:5.2,place:'das'},{id:'duongvu',scene:'das',x:25.4,y:3.4,place:'duongvu',lecture:true},{id:'sunhung',scene:'das',x:17.6,y:14.6,place:'sunhung',lecture:true},{id:'sv1',pass:true,scene:'das',x:21.5,y:7.2,place:'sv'},{id:'sv2',pass:true,scene:'das',x:24.5,y:9.8,place:'sv'},{id:'sv3',pass:true,scene:'das',x:18.5,y:9.8,place:'sv'},{id:'chuba',x:47.4,y:80.6,place:'kennel'},{id:'banhmi',x:11.5,y:91.9,place:'danto'},{id:'congan',scene:'doncongan',x:7,y:3.9,place:'congan'},
  {id:'hr',scene:'everfit',x:8,y:15.6,place:'hr'},{id:'sep',scene:'everfit',x:30.5,y:5.6,place:'sep'},
  {id:'botco',scene:'club',x:3.2,y:6.6,place:'botco'},{id:'botpoker',scene:'club',x:16.6,y:8.4,place:'botpoker'},{id:'quantro',scene:'club',x:23.6,y:10.6,place:'quantro'},
  // Phòng Bay: DJ đứng sau bàn DJ, 4 bot nhảy quanh sàn
  {id:'dj',scene:'phongbay',x:10,y:3.1,place:'dj',dance:true},{id:'hlinh',pass:true,scene:'phongbay',x:4.6,y:7.2,place:'dancebot',dance:true},{id:'lebao',pass:true,scene:'phongbay',x:15.4,y:7.2,place:'dancebot',dance:true},
  {id:'ccmk',pass:true,scene:'phongbay',x:5.2,y:10.4,place:'dancebot',dance:true},{id:'dancer',pass:true,scene:'phongbay',x:14.8,y:10.4,place:'dancer',dance:true},
  {id:'baove',scene:'everfit',x:6.4,y:17.4,place:'baove',closed:true},
  {id:'minh',scene:'everfit',x:6,y:4.2,place:'cowork'},{id:'ha',scene:'everfit',x:12,y:4.2,place:'cowork'},{id:'quan',scene:'everfit',x:8,y:9.2,place:'cowork'},{id:'thao',scene:'everfit',x:24.5,y:4.4,place:'cowork'},
  {id:'lumen_le',scene:'lumen',x:7,y:25.6,place:'lumen'},{id:'diep',scene:'diep',x:19.5,y:5.8,place:'diep'},
  {id:'do',scene:'yenlang',x:4.6,y:6.6,place:'yenlang'},
  {id:'hlv_pickle',scene:'pickle',x:4.4,y:20.4,place:'pickle'},
  {id:'qnt',scene:'yenlang',x:13.2,y:9.6,place:'qnt'},
  {id:'pk_shop',scene:'pickle',x:26.4,y:20.6,place:'pkshop'},
];
// NPC phụ dựng từ template (không có sheet riêng)
const NPC_LOOKS={
  shopkeeper:{name:'Chị Mai (Shop Chande)',look:{gender:'nu',hair:'ponytail',hairColor:'6b4128',skin:'f3b194',outfit:{top:'somi_hoa',bottom:'vay_den',shoes:'giay_den'}}},
  quancom:{name:'Chú Tư (quán cơm)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'d99a78',outfit:{top:'tee_trang',bottom:'kaki',shoes:'dep_to_ong'}}},
  barista:{name:'Linh (barista)',look:{gender:'nu',hair:'long',hairColor:'211c21',skin:'f8cdb0',outfit:{top:'tee_den',bottom:'jean',shoes:'giay_trang'}}},
  chibep:{name:'Chị Hoa (bếp)',look:{gender:'nu',hair:'bun',hairColor:'3a2f37',skin:'e8a882',outfit:{top:'somi_dai',bottom:'kaki',shoes:'dep_to_ong'}}},
  coke:{name:'Cô Ké (chủ tiệm)',look:{gender:'nu',hair:'bun',hairColor:'8a8a8a',skin:'d99a78',outfit:{top:'len_colo',bottom:'vay_den',shoes:'giay_den'}}},
  banhmi:{name:'Anh Tổ (bánh mì Dân Tổ)',look:{gender:'nam',hair:'buzz',hairColor:'211c21',skin:'d99a78',outfit:{top:'tee_trang',bottom:'short_xam',shoes:'dep_to_ong'}}},
  congan:{name:'Chú Dũng (công an)',look:{gender:'nam',hair:'buzz',hairColor:'211c21',skin:'d99a78',outfit:{top:'dong_phuc_ca',bottom:'kaki',shoes:'giay_den',head:'mu_ca'}}},
  letan:{name:'Anh Tùng (lễ tân 24h)',look:{gender:'nam',hair:'swept',hairColor:'211c21',skin:'e8a882',outfit:{top:'somi_dai',bottom:'kaki',shoes:'giay_den'}}},
  hr:{name:'Chị Vy (HR Everfit)',look:{gender:'nu',hair:'long',hairColor:'3a2f37',skin:'f8cdb0',outfit:{top:'khoac_jean',bottom:'vay_den',shoes:'giay_trang',eyes:'kinh_can'}}},
  botco:{name:'Lê Quang Liêm (bot cờ vua)',look:{gender:'nam',hair:'fringe',hairColor:'1c1820',skin:'f3b194',outfit:{top:'ao_tuyen_vn',bottom:'quan_da',shoes:'giay_den',eyes:'kinh_can'}}},
  botpoker:{name:'Tú Sena (bot poker)',look:{gender:'nam',hair:'fringe',hairColor:'1c1820',skin:'e8a882',outfit:{top:'ao_den_chu',bottom:'short_xam',shoes:'dep_to_ong'},opts:{beard:'mustache',tattoo:true}}},
  duongvu:{name:'Thầy Dương Vũ (giảng viên DAS)',look:{gender:'nam',hair:'messy',hairColor:'1c1820',skin:'e0a882',outfit:{top:'ao_navy',bottom:'kaki',shoes:'giay_den',eyes:'kinh_ram',wrist:'dong_ho'},opts:{beard:'mustache'}}},
  sunhung:{name:'Thầy Sun Hung (giảng viên DAS)',look:{gender:'nam',hair:'bun',hairColor:'1c1820',skin:'d89a70',outfit:{top:'tee_den',bottom:'quan_da',shoes:'giay_den',eyes:'kinh_ram'},opts:{earring:true}}},
  huyta:{name:'Thầy Huy Tạ (DAS)',look:{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'f0b890',outfit:{top:'blazer_be',bottom:'quan_da',shoes:'giay_den',eyes:'kinh_can'}}},
  sv1:{name:'Sinh viên DAS',look:{gender:'nu',hair:'bowl',hairColor:'3a2418',skin:'f8cdb0',outfit:{top:'tee_trang',bottom:'jean',shoes:'giay_trang'}}},
  sv2:{name:'Sinh viên DAS',look:{gender:'nam',hair:'messy',hairColor:'211c21',skin:'e8b090',outfit:{top:'tee_den',bottom:'kaki',shoes:'giay_trang'}}},
  sv3:{name:'Sinh viên DAS',look:{gender:'nu',hair:'long',hairColor:'211c21',skin:'f3b194',outfit:{top:'cardigan',bottom:'vay_den',shoes:'giay_den'}}},
  chuongngua:{name:'Chú Hải (trại ngựa Đà Bắc)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'c98a64',outfit:{top:'somi_caro',bottom:'jean',shoes:'giay_den',head:'mu_be'}}},
  thuexe:{name:'Anh Tùng (thuê xe máy)',look:{gender:'nam',hair:'fade',hairColor:'211c21',skin:'d99a78',outfit:{top:'khoac_jean',bottom:'jean',shoes:'giay_den',eyes:'kinh_ram'}}},
  cr7:{name:'CR7',look:{gender:'nam',hair:'fade',hairColor:'14121a',skin:'eeaa88',outfit:{top:'ao_cr7',bottom:'quan_cr7',shoes:'giay_trang'}}},
  messi:{name:'Messi',look:{gender:'nam',hair:'swept',hairColor:'14121a',skin:'f4bca8',outfit:{top:'ao_messi',bottom:'quan_messi',shoes:'giay_trang'},opts:{beard:'goatee'}}},
  diep:{name:'Diệp',look:{gender:'nu',hair:'long',hairColor:'1c1418',skin:'f6d2c0',outfit:{top:'ao_diep',bottom:'vay_diep',shoes:'giay_trang',neck:'ngoc_diep'},opts:{mouth:'smile'}}},
  lumen_le:{name:'Annie (Lumen Studio)',look:{gender:'nu',hair:'long',hairColor:'2a1a18',skin:'f3c8ae',outfit:{top:'ao_annie',bottom:'quan_annie',shoes:'giay_den'},opts:{mouth:'smile'}}},
  do:{name:'Anh Độ (120 Yên Lãng)',look:{gender:'nam',hair:'buzz',hairColor:'1c1820',skin:'e8b08e',outfit:{top:'ao_do',bottom:'quan_do',shoes:'giay_den',eyes:'kinh_can'},opts:{beard:'goatee',mouth:'smile'}}},
  hlv_pickle:{name:'HLV Tuấn (pickleball)',look:{gender:'nam',hair:'cap',hairColor:'1c1820',skin:'d8986e',outfit:{top:'ao_pickle',bottom:'short_xam',shoes:'giay_trang',head:'mu_do'},opts:{mouth:'smile',watch:true}}},
  qnt:{name:'Quang Nịnh Thần (QNT)',look:{gender:'nam',hair:'fade',hairColor:'f0506a',skin:'f0c4a0',outfit:{top:'ao_qnt',bottom:'quan_annie',shoes:'giay_trang',eyes:'kinh_qnt'},opts:{earring:true}}},
  mck:{name:'MCK',look:{gender:'nam',hair:'messy',hairColor:'14121a',skin:'eec4a0',outfit:{top:'ao_mck',bottom:'quan_mck',shoes:'giay_den',neck:'day_bac'},opts:{mouth:'smirk'}}},
  pk_shop:{name:'Chị Hà (shop đồ pickleball)',look:{gender:'nu',hair:'ponytail',hairColor:'3a2418',skin:'f3c4a4',outfit:{top:'ao_pickle',bottom:'short_xam',shoes:'giay_trang',head:'mu_do'},opts:{mouth:'smile'}}},
  oii:{name:'Ộ i i',look:{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'e6b08e',outfit:{top:'ao_oii',bottom:'quan_oii',shoes:'giay_den',head:'mu_oii',neck:'vong_oii'}}},
  csgt:{name:'Cảnh sát giao thông',look:{gender:'nam',hair:'buzz',hairColor:'211c21',skin:'e8a882',outfit:{top:'ao_csgt',bottom:'quan_csgt',shoes:'giay_den',head:'mu_csgt'}}},
  kiemlam:{name:'Chú kiểm lâm (vườn quốc gia)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'c98a64',outfit:{top:'ao_kiemlam',bottom:'kaki',shoes:'giay_den',head:'mu_ca'}}},
  suthay:{name:'Sư thầy chùa Đà Bắc',look:{gender:'nam',hair:'bald',hairColor:'3a2f37',skin:'e8b090',outfit:{top:'ao_nau',bottom:'kaki',shoes:'dep_to_ong'}}},
  huongdan:{name:'Chị hướng dẫn bảo tàng',look:{gender:'nu',hair:'bun',hairColor:'211c21',skin:'f3b194',outfit:{top:'somi_dai',bottom:'vay_den',shoes:'giay_den'}}},
  thungan:{name:'Chị thu ngân siêu thị',look:{gender:'nu',hair:'ponytail',hairColor:'211c21',skin:'f3b194',outfit:{top:'tee_do',bottom:'kaki',shoes:'giay_den'}}},
  barista2:{name:'Anh pha chế',look:{gender:'nam',hair:'fade',hairColor:'3a2f37',skin:'e8a882',outfit:{top:'somi_dai',bottom:'jean',shoes:'giay_den'}}},
  chunet:{name:'Anh chủ tiệm net',look:{gender:'nam',hair:'messy',hairColor:'211c21',skin:'f3b194',outfit:{top:'tee_den',bottom:'short_xam',shoes:'dep_to_ong',eyes:'kinh_can'}}},
  chuba:{name:'Chú Ba (bán chó giữ vườn)',look:{gender:'nam',hair:'buzz',hairColor:'5a5050',skin:'c98a64',outfit:{top:'somi_caro',bottom:'kaki',shoes:'dep_to_ong',head:'mu_be'}}},
  dj:{name:'Bot DJ Thái Hoàng',look:{gender:'nam',hair:'undercut',hairColor:'211c21',skin:'e8b090',outfit:{top:'tee_den',bottom:'jean_rach',shoes:'giay_trang',eyes:'kinh_ram',neck:'day_bac'}}},
  hlinh:{name:'Bot Trần Hà Linh',look:{gender:'nu',hair:'long',hairColor:'3a2418',skin:'f8cdb0',outfit:{top:'tee_hong',bottom:'vay_den',shoes:'giay_trang'}}},
  lebao:{name:'Bot Lê Bảo',look:{gender:'nam',hair:'fade',hairColor:'211c21',skin:'e8b090',outfit:{top:'khoac_jean',bottom:'jean',shoes:'giay_den',neck:'day_vang'}}},
  ccmk:{name:'Bot CCMK',look:{gender:'nu',hair:'bun',hairColor:'211c21',skin:'f3b194',outfit:{top:'somi_hoa',bottom:'short_xam',shoes:'giay_trang',eyes:'kinh_can'}}},
  dancer:{name:'Bot Dancer',look:{gender:'nu',hair:'ponytail',hairColor:'8a3a3a',skin:'f8cdb0',outfit:{top:'tee_do',bottom:'vay_do',shoes:'giay_den',wrist:'vong_vang'}}},
  quantro:{name:'Quản trò Ma Sói',look:{gender:'nam',hair:'long',hairColor:'8a3a3a',skin:'d4d8dc',outfit:{top:'cardigan',bottom:'quan_da',shoes:'giay_luoi'}}},
  baove:{name:'Bác Hùng (bảo vệ)',look:{gender:'nam',hair:'cap',hairColor:'8a8a8a',skin:'b97a58',outfit:{top:'dong_phuc_bv',bottom:'kaki',shoes:'giay_den',head:'mu_bv'}}},
  minh:{name:'Minh (dev)',look:{gender:'nam',hair:'messy',hairColor:'211c21',skin:'f3b194',outfit:{top:'tee_den',bottom:'jean',shoes:'giay_trang',eyes:'kinh_can'}}},
  ha:{name:'Hà (designer)',look:{gender:'nu',hair:'bowl',hairColor:'6b4128',skin:'f8cdb0',outfit:{top:'cardigan',bottom:'vay_den',shoes:'giay_den'}}},
  quan:{name:'Quân (QA)',look:{gender:'nam',hair:'buzz',hairColor:'3a2f37',skin:'e8a882',outfit:{top:'somi_caro',bottom:'kaki',shoes:'giay_den'}}},
  thao:{name:'Thảo (chăm sóc coach)',look:{gender:'nu',hair:'ponytail',hairColor:'211c21',skin:'f3b194',outfit:{top:'tee_hong',bottom:'jean',shoes:'giay_trang'}}},
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
  ...[[38.6,76.4],[37.6,77.2],[27.6,72.6],[20.6,73.4],[30.6,91.6],[36.2,93.2],[46.8,93.6],[38.4,84.2],[33.6,73.4],[24.2,39.6],[28,42.6],[36,39.6],[47.2,36.4],[40.4,31.6],[52.6,29.8],[47,24.6],[30.4,63.8],[24,51.2]]
    .map(([x,y],i)=>({id:'f'+i,item:i%3===2?'la':'hoa',x,y,respawn:240})),
  ...[[24.6,48.6,'mang'],[33.2,65.8,'mang'],[20.4,46.6,'rau'],[27.2,57.8,'rau'],[31.4,66.6,'rau'],[47.6,82.4,'trung'],[38.6,78.6,'trung'],[48.6,38.8,'nam'],[50.4,31.6,'nam'],[55.2,37.6,'nam']]
    .map(([x,y,item],i)=>({id:'g'+i,item,x,y,respawn:360})),
];
const KAYAK_SPOT={x:47.6,y:99.6}, BUOYS=[[27,104.5],[33,108],[40,109.5],[50,107],[57,104]];
const CARS={car_low:{x:64.6,y:101.2,to:{x:47.5,y:43.6},price:0},car_top:{x:49.5,y:42.8,to:{x:62.5,y:102.4},price:CAR_PRICE}};   // xe 4 bánh dưới đỗ ở bãi đỗ trước cổng   // to: chỗ xuống xe ở đầu kia
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
    desc:'Căn hộ riêng ở Hà Nội: góc làm việc có laptop, phòng ngủ, phòng tắm, bếp, phòng khách.'},
  leu:{name:'Lều cắm trại',price:100000,where:'Nền khu cắm trại',rest:50,charge:50,wifi:.5,view:1.2,bath:'chung',
    desc:'Lều dome trên sàn gỗ: đệm hơi, túi ngủ, đèn bão, sạc dự phòng. Tắm ở nhà tắm chung cạnh khu cắm trại.',
    doors:[[47.5,28.3],[50.5,28.3],[53.5,28.3]]},
  leubeboi:{name:'Lều bể bơi (Lều 1 · Lều 2)',price:120000,where:'Ngay trên bể bơi',rest:65,charge:100,wifi:.8,view:1.4,bath:'sen',
    desc:'Lều bạt trên sàn gỗ cạnh bể bơi: đệm hơi + túi ngủ, vòi sen dã ngoại, ổ sạc điện thoại, đèn bão.',doors:[[31.5,75.4],[25.5,74.4]]},
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
for(const [k,s] of Object.entries({tro:[26,16],leu:[10,7],leubeboi:[11,8],nhangu:[11,8],rech:[12,9],ngoi:[12,9],maida:[13,9],chieng:[15,10]})){ ROOMS[k].size=s; ROOMS[k].spawn=k==='tro'?{x:12.5,y:12.5}:{x:s[0]/2,y:s[1]-1.6}; }
const BATHHOUSE={x:56.9,y:28.4};
// bể bơi khu dưới (ô nước x 32–34, y 77–83): bơi 8 giây, +sạch sẽ, +năng lượng, nghỉ 3 phút mới bơi tiếp
const POOL={x0:11,y0:77,x1:34,y1:83,dur:8,clean:40,energy:15,cooldown:180,pee:{clean:15,fine:150000,window:60}};
// thành tích (hidden: chỉ hiện tên khi mở khoá)
const ACH={pee5:{name:'Kẻ phá bĩnh bể bơi',desc:'Tè vào bể bơi 5 lần',stat:'pee',n:5,hidden:true,exp:50},
  fish10:{name:'Cần thủ Đà Bắc',desc:'Câu được 10 con cá',stat:'fish',n:10,exp:40},harvest50:{name:'Nông dân chăm chỉ',desc:'Thu hoạch 50 nông sản',stat:'harvest',n:50,exp:40},
  dance:{name:'Vũ công Phòng Bay',desc:'Đạt 8000 điểm trong 1 bài',stat:'dance',n:8000,exp:40},stunt:{name:'Bốc đầu thần sầu',desc:'Bốc đầu thành công 10 lần',stat:'stunt',n:10,exp:40},
  jail:{name:'Có tiền án',desc:'Bị công an tạm giữ 1 lần',stat:'jail',n:1,hidden:true,exp:20},megatron:{name:'Kẻ diệt Decepticon',desc:'Optimus Prime đánh bại Megatron',stat:'megatron',n:1,hidden:true,exp:100},dino:{name:'Công viên kỷ Jura',desc:'Chụp ảnh khủng long trong rừng',stat:'dino',n:1,hidden:true,exp:60},rich:{name:'Đại gia Chan City',desc:'Có 10.000.000đ trong ví',stat:'money',n:10000000,exp:80}};
// nhân viên Ké Retreat: xin cô Ké, 3 suất, mỗi ngày 3 việc, xong việc nào trả lương việc đó, được ở Nhà Ngủ miễn phí
const KE_JOB={max:3,wage:70000,perDay:3,fireAfter:3,room:'nhangu',minLevel:2,tasks:{
  cho_ca:{name:'Cho cá ăn ở bến hồ',x:42.5,y:103.2,dur:6,exp:15},tuoi_rau:{name:'Tưới vườn rau Ké',x:58,y:86.4,dur:8,exp:18},
  phuc_vu:{name:'Mang trà cho khách ở Nhà Rếch 2',x:45.4,y:94.6,dur:6,exp:15},don_phong:{name:'Dọn phòng Nhà Ngói',x:36.9,y:93.6,dur:8,exp:18},
  quet_san:{name:'Quét sân khu cắm trại',x:49.6,y:29.4,dur:6,exp:12},cho_ga:{name:'Cho gà ăn ở sân gà',x:63.5,y:46.6,dur:6,exp:12},
  don_be:{name:'Vớt lá ở bể bơi',x:33.5,y:86.4,dur:7,exp:15}}};   // nhà tắm chung cạnh khu cắm trại
const RECEPTION={x:47.6,y:89.4};   // lễ tân 24h ở Nhà Rếch 2 (Cộng đồng)
// nhu cầu: mất 1 điểm sau `decay` giây khi đang online
const NEEDS={energy:{name:'Năng lượng',decay:90},clean:{name:'Sạch sẽ',decay:120},battery:{name:'Pin điện thoại',decay:60}};
// hết pin ở ngoài: xin cắm sạc nhờ (sạc ké) người gần đó, không cần về phòng. Pin dưới `max`% mới xin được, +`charge`% (tối đa `cap`%), `perDay` lần/ngày
NEEDS.borrow={max:80,cap:100,charge:80,dur:15,perDay:6};
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
// ngoài giờ (đêm, cuối tuần) văn phòng đóng, chỉ có bác bảo vệ ở sảnh; ai bị sếp xếp OT tối đó thì được lên làm 1 task OT (20:00–23:00, lương ×1,5)
const JOB={company:'Everfit',max:10,wage:600000,payEvery:3,hours:[8,20],tasksPerDay:3,bonusExp:20,fireAfter:3,defaultRemote:[2,4],ot:{chance:25,from:20,to:23,pay:1.5}};
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
// phỏng vấn Everfit: giải câu đố vui có hình minh hoạ (pic: tên hình vẽ trong ui.js). Bốc 7 câu, đúng từ 5 là đỗ.
const INTERVIEW_PICK=7, INTERVIEW_PASS=5;
const INTERVIEW=[
  {q:'Trong hình có bao nhiêu hình tam giác?',a:['4','5','6','8'],ok:2,pic:'tamgiac'},
  {q:'Hình bên có bao nhiêu hình vuông?',a:['4','5','6','9'],ok:1,pic:'vuong'},
  {q:'Táo + táo = 10, táo + chuối = 8. Vậy chuối + chuối = ?',a:['3','6','8','16'],ok:1,pic:'traicay'},
  {q:'Hình tiếp theo trong dãy là gì?',a:['Hình tròn','Hình vuông','Hình tam giác','Ngôi sao'],ok:2,pic:'dayhinh'},
  {q:'Số tiếp theo là số mấy?',a:['18','24','32','64'],ok:2,pic:'dayso'},
  {q:'Đồng hồ đang chỉ 3 giờ. 90 phút nữa là mấy giờ?',a:['4 giờ','4 giờ 30','5 giờ 30','3 giờ 90'],ok:1,pic:'dongho'},
  {q:'Đồng hồ chỉ 9 giờ. Nhìn qua gương sẽ thấy mấy giờ?',a:['9 giờ','6 giờ','3 giờ','12 giờ'],ok:2,pic:'guong'},
  {q:'Con gì càng to càng nhỏ?',a:['Con voi','Con cua','Con kiến','Con cá'],ok:1,pic:'cua'},
  {q:'Cái gì đi thì nằm, đứng cũng nằm, nhưng nằm lại đứng?',a:['Cái ghế','Bàn chân','Con rắn','Cái bóng'],ok:1,pic:'banchan'},
  {q:'Tháng nào có 28 ngày?',a:['Tháng 2','Tháng 2 năm nhuận','Tất cả các tháng','Không tháng nào'],ok:2,pic:'lich'},
  {q:'Cái gì của bạn nhưng người khác dùng nhiều hơn bạn?',a:['Điện thoại','Tên của bạn','Ví tiền','Cái xe'],ok:1,pic:'ten'},
  {q:'Có 3 quả táo, bạn lấy đi 2 quả. Bạn đang có mấy quả?',a:['1 quả','2 quả','3 quả','Không quả nào'],ok:1,pic:'taotay'},
  {q:'Cái gì có cổ nhưng không có miệng?',a:['Cái chai','Cái áo','Con hươu','Cái lọ'],ok:1,pic:'ao'},
  {q:'Con nào không có chân?',a:['Con bò','Con gà','Con lợn','Con cá'],ok:3,pic:'convat'},
];
// mặt bằng văn phòng theo ảnh: kính toàn cảnh phía trên, bàn dài trắng ghế trắng, tường cây xanh giữa phòng,
// bàn gỗ họp, sofa kem + bàn trà hoa đỏ, quầy lễ tân gỗ sáng gần thang máy, phòng sếp vách kính, pantry
// quyền lợi văn phòng: mỗi ngày 1 lần
const OFFICE_PERKS={coffee:{name:'Pha cà phê cho mình ở pantry',buff:{mul:1.15,min:30},energy:10},sofa:{name:'Ngả lưng ở sofa',energy:20}};
// từ khoá gõ khi làm task ở bàn (mini game)
const WORK_WORDS=['workout','macro','habit','coach','client','program','meal plan','check-in','autoflow','progress','reminder','branded app'];
const OFFICE={W:34,H:21,spawn:{x:4.6,y:18.7},
  desks:[[5,6.6],[7,6.6],[9,6.6],[11,6.6],[13,6.6],[5,11.6],[7,11.6],[9,11.6],[11,11.6],[13,11.6]],
  spots:{meeting:{x:22.5,y:7.4,name:'Bàn họp gỗ'},boss:{x:30.5,y:8.6,name:'Phòng sếp'},pantry:{x:30.5,y:16.4,name:'Pantry'},plants:{x:16,y:8.6,name:'Tường cây xanh'}},
  hr:{x:8,y:15.6},sep:{x:30.5,y:5.6}};

/* ---------- Map 3: Nông trại bác Trang (Đà Lạt) ----------
   Dựng theo các nông trại Đà Lạt: đồi chè + cối xay gió + bò sữa thả rông (Cầu Đất Farm), bò sữa Đơn Dương (Đà Lạt Milk),
   nhà kính dâu tây treo, đồn điền cà phê (Mê Linh), ngựa pony (Puppy Farm). Map 80×70 ô, cổng + bến xe ở phía Nam. */
const DALAT={W:80,H:70,spawn:{x:40,y:67.2},fields:{rau:'Rau',hoa:'Hoa',nhakinh:'Nhà kính dâu tây',cafe:'Cà phê',cay:'Cây ăn quả',caosu:'Cao su'},
  farmhouse:{x:40,y:7.4},warehouse:{x:32,y:6.8},market:{x:14,y:60.8},
  shops:{tiem_rau:{name:'Tiệm rau củ',x:8,y:56.8},tiem_thit:{name:'Tiệm thịt cá',x:14,y:56.8},tiem_kho:{name:'Tiệm gia vị, đồ khô',x:20,y:56.8}},
  quan:{x:28.5,y:56.7},stove:{x:11.4,y:4.4},
  pens:{bo:{x:53.5,y:41.8},ga:{x:65.5,y:38.8},lon:{x:72.5,y:39.8},nai:{x:72.5,y:39.8},vit:{x:57.5,y:63.4},ca:{x:50,y:58.6},tom:{x:50,y:64.6}},
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
  xa_lach:{name:'Xà lách',seed:2000,grow:1380,yield:4,sell:8000,exp:5,col:'9bd36a',map:'dalat',kind:'rau'},
  bap_cai:{name:'Bắp cải',seed:3000,grow:2400,yield:3,sell:18000,exp:9,col:'b9e08a',map:'dalat',kind:'rau'},
  ca_rot:{name:'Cà rốt',seed:3000,grow:3600,yield:4,sell:20000,exp:12,col:'f08a2e',map:'dalat',kind:'rau'},
  atiso_cay:{name:'Atiso',seed:8000,grow:4500,yield:3,sell:35000,exp:15,col:'6e9a6a',map:'dalat',kind:'rau'},
  cuc_hoa_mi:{name:'Cúc hoạ mi',seed:2000,grow:1800,yield:5,sell:8000,exp:7,col:'f4f1ea',map:'dalat',kind:'hoa'},
  hoa_hong:{name:'Hoa hồng',seed:3000,grow:2100,yield:6,sell:8000,exp:8,col:'e0445a',map:'dalat',kind:'hoa'},
  cam_tu_cau:{name:'Cẩm tú cầu',seed:8000,grow:3780,yield:3,sell:30000,exp:13,col:'8fa4e8',map:'dalat',kind:'hoa'},
  dau_tay:{name:'Dâu tây',seed:10000,grow:6300,yield:3,sell:50000,exp:20,col:'e2343e',map:'dalat',kind:'nhakinh'},
  ca_phe:{name:'Cà phê Arabica',seed:15000,grow:7200,regrow:3480,yield:3,sell:25000,exp:14,col:'8c231f',map:'dalat',kind:'cafe'},
  bo_034:{name:'Bơ 034',seed:20000,grow:10800,regrow:4620,yield:4,sell:25000,exp:18,col:'4f7a2a',map:'dalat',kind:'cay'},
  hong:{name:'Hồng giòn',seed:15000,grow:10800,regrow:3720,yield:4,sell:20000,exp:16,col:'f28a1e',map:'dalat',kind:'cay'},
  mu_cao_su:{name:'Mủ cao su',seed:12000,grow:14400,regrow:1380,yield:2,sell:15000,exp:8,col:'f4f1ea',map:'dalat',kind:'caosu',verb:'Cạo mủ',plant:'Trồng cao su'},
});
// bướm trong rừng Ké: mỗi chỗ 1 loài, bắt xong (hoặc để sổng) phải đợi bướm khác bay tới; loài hiếm khó bắt hơn
const BUTTERFLY={respawn:120,miss:15,chance:{common:.85,uncommon:.65,rare:.45},
  kinds:{la_xanh:'common',vua_cam:'common',gi_sat:'common',hong_dao:'common',nau_vang:'uncommon',lam_ngoc:'uncommon',tim_than:'uncommon',phuong_ngoc:'rare',tim_pha_le:'rare'},
  names:{la_xanh:'Bướm lá xanh',vua_cam:'Bướm vua cam',phuong_ngoc:'Bướm phượng ngọc',gi_sat:'Bướm gỉ sắt',tim_pha_le:'Bướm tím pha lê',hong_dao:'Bướm hồng đào',nau_vang:'Bướm nâu vàng',lam_ngoc:'Bướm lam ngọc',tim_than:'Bướm tím than'},
  sell:{common:15000,uncommon:30000,rare:60000},
  spots:[{x:24,y:56,k:'la_xanh'},{x:30,y:66,k:'vua_cam'},{x:20,y:50,k:'hong_dao'},{x:33,y:70,k:'gi_sat'},{x:6,y:66,k:'la_xanh'},{x:12,y:72,k:'nau_vang'},{x:4,y:82,k:'hong_dao'},
    {x:60,y:46,k:'vua_cam'},{x:66,y:56,k:'lam_ngoc'},{x:62,y:62,k:'tim_than'},{x:44,y:56,k:'gi_sat'},{x:52,y:58,k:'phuong_ngoc'},{x:14,y:40,k:'nau_vang'},{x:34,y:38,k:'lam_ngoc'},
    {x:46,y:33,k:'tim_than'},{x:57,y:27,k:'tim_pha_le'},{x:50,y:78,k:'hong_dao'},{x:66,y:80,k:'la_xanh'}]};
// chó giữ vườn Ké (mua ở chỗ chú Ba cạnh vườn rau): mỗi giống 1 năng lực; kẻ cướp rau bị chó cắn thì nộp phạt cho chủ vườn
const DOGS={shiba:{name:'Shiba Inu',price:250000,desc:'Doạ trộm: 35% kẻ trộm sợ quá bỏ chạy, không cướp được',block:.35},
  becgie:{name:'Béc-giê Đức',price:400000,desc:'Cắn rất hay: 70% cắn kẻ trộm, phạt 150.000đ',bite:.7,fine:150000},
  pug:{name:'Pug',price:150000,desc:'Lười mà lì: kẻ trộm bị vờn mất 30 năng lượng',drain:30},
  dalmatian:{name:'Đốm Dalmatian',price:300000,desc:'Canh giờ: chủ có 180 giây (thay vì 90) để thu trước khi bị cướp',grace:180},
  golden:{name:'Golden Retriever',price:350000,desc:'Tha rau về: rau chín 80 giây mà chủ chưa thu thì chó tha về túi chủ',fetch:80},
  beagle:{name:'Beagle',price:200000,desc:'Đánh hơi: báo chủ ngay khi có trộm, 40% cắn phạt 80.000đ',bite:.4,fine:80000,alert:true},
  yorkie:{name:'Yorkshire',price:180000,desc:'Sủa inh ỏi: kẻ trộm chỉ lấy được 25% thay vì 50%',steal:.25},
  bulldog:{name:'Bull Pháp',price:500000,desc:'Cắn đau: 50% cắn kẻ trộm, phạt 300.000đ',bite:.5,fine:300000},
  corgi:{name:'Corgi',price:300000,desc:'Chăm vườn: mỗi lần chủ thu hoạch được thêm 1 nông sản',bonus:1}};
// DAS · Design Anthropology School (TP.HCM): đi học lấy chứng chỉ (Everfit nhận dễ hơn, lương cao hơn) hoặc làm giảng viên kiếm tiền
// Lumen Studio (Hà Nội): studio thiết kế làm remote được. Ứng tuyển ở lễ tân cần ≥4 chứng chỉ DAS + cấp 3. Mỗi ngày tối đa 4 việc,
// làm ở bàn trong studio hoặc remote bằng laptop ở phòng; EXP gấp 4 lần việc thường, trả công từng việc. Có phòng nghỉ trưa + máy cà phê
// học bổng của Annie: nhận ở lễ tân Lumen, đi học DAS: 2 khoá đầu Lumen trả hết, 2 khoá sau giảm 50%; đủ 4 chứng chỉ quay lại Annie nhận việc + thưởng
// 120 Yên Lãng (Hà Nội): nhà anh Độ, phòng stream theo ảnh (tường xám xanh treo súng mô hình, bàn 3 màn hình, tủ kính figure, tường gạch, Hulkbuster, sofa da).
// Ộ i i hay về đây: buổi tối 19–23h chỉ ở nhà anh Độ. Lên sóng cùng anh Độ (20h–2h, mỗi ngày 1 lần) ở ghế khách cạnh bàn stream
// Sân pickleball (Hà Nội): HLV Tuấn dạy (mở kỹ năng Pickleball, cần để vào trận). Đấu 2 vs 2 chạm 7 điểm (hơn 2, tối đa 11), tính điểm mỗi pha bóng.
// Bóng rơi vào vòng vàng ở nửa sân đội nhận: chạy tới (WASD / mũi tên), đứng trong tầm vợt `reach` ô, bấm J drive / K dink / L lob (SPACE: cú vừa chọn) đúng lúc.
// Thiếu người thì người bấm bắt đầu thuê bot tuyển thủ (Lý Hoàng Nam + các tuyển thủ pickleball), mỗi bot `hire`đ. Đội A ở nửa dưới (ghế 0,1), đội B nửa trên (2,3)
const PICKLE={W:30,H:24,spawn:{x:15,y:22.4},reach:1.6,botSpeed:4.6,court:{x0:8,y0:3,x1:21,y1:18},net:10.5,slots:[[11.5,16.4],[17.5,16.4],[11.5,5.2],[17.5,5.2]],target:7,cap:11,
  lesson:{price:300000,dur:20,exp:40},hire:40000,win:{exp:120,vnd:200000},lose:{exp:30},
  shots:{serve:{name:'Giao bóng',flight:1400,win:340,bot:1},drive:{name:'Drive',flight:850,win:210,bot:.86},dink:{name:'Dink',flight:1500,win:330,bot:1},lob:{name:'Lob',flight:1750,win:290,bot:.94}},
  bots:[['Lý Hoàng Nam',.9,'nam','c4382e'],['Ben Johns',.93,'nam','2a3a5a'],['Anna Leigh Waters',.92,'nu','e8823a'],['Federico Staksrud',.88,'nam','2f9a52'],
    ['Anna Bright',.87,'nu','a259ff'],['JW Johnson',.86,'nam','3f6fb0'],['Tyson McGuffin',.85,'nam','26242a'],['Catherine Parenteau',.86,'nu','e05a8a']]};
// shop đồ pickleball ở sân Cầu Giấy: 10 set (5 nam, 5 nữ), 2 set premium (giá cao; mặc đủ cả bộ khi thắng trận được ×1,5 EXP). Mua là có cả bộ, mặc được ngay
const PK_SETS=[
  {id:'pk_n1',g:'nam',name:'Court Classic',top:'1f6fb2',bottom:'shorts',pants:'f4f1ea',cap:'f4f1ea',price:450000},
  {id:'pk_n2',g:'nam',name:'Kitchen Green',top:'2f9a52',print:'e8f040',pat:'vstripe',bottom:'shorts',pants:'26242a',price:520000},
  {id:'pk_n3',g:'nam',name:'Dink Master',top:'e8823a',bottom:'shorts',pants:'2a3a5a',cap:'2a3a5a',price:520000},
  {id:'pk_n4',g:'nam',name:'Night Rally',top:'26242a',print:'7fe0ff',pat:'vstripe',bottom:'pants',pants:'26242a',price:600000},
  {id:'pk_n5',g:'nam',name:'Pro Tour Gold',premium:true,top:'f2c43d',print:'1c1516',pat:'vstripe',bottom:'shorts',pants:'1c1516',cap:'1c1516',shoes:'f2c43d',price:3500000},
  {id:'pk_f1',g:'nu',name:'Pastel Pink',top:'f2b8c6',bottom:'skirt',pants:'f4f1ea',price:450000},
  {id:'pk_f2',g:'nu',name:'Mint Rally',top:'7fd8b0',bottom:'skirt',pants:'f4f1ea',cap:'f4f1ea',price:520000},
  {id:'pk_f3',g:'nu',name:'Sunset Drive',top:'ff7a55',print:'f2c43d',pat:'polka',bottom:'skirt',pants:'26242a',price:520000},
  {id:'pk_f4',g:'nu',name:'Lavender Lob',top:'a87ac8',bottom:'shorts',pants:'5a3a8a',price:600000},
  {id:'pk_f5',g:'nu',name:'Champion White',premium:true,top:'fbfaf6',print:'d4a83a',pat:'vstripe',bottom:'skirt',pants:'fbfaf6',cap:'d4a83a',shoes:'d4a83a',price:3500000}];
for(const z of PK_SETS){ const tag=z.premium?' (premium)':'';
  z.items={top:z.id+'_ao',bottom:z.id+'_quan',shoes:z.id+'_giay',...(z.cap?{head:z.id+'_mu'}:{})};
  CLOTHES[z.items.top]={name:`Áo ${z.name}${tag}`,slot:'top',price:0,hidden:true,pk:z.id,opts:z.pat?{[z.pat]:true}:{},colors:{top:z.top,...(z.print?{print:z.print}:{})}};
  CLOTHES[z.items.bottom]={name:`${z.bottom==='skirt'?'Váy':'Quần'} ${z.name}${tag}`,slot:'bottom',price:0,hidden:true,pk:z.id,opts:{bottom:z.bottom},colors:{pants:z.pants}};
  CLOTHES[z.items.shoes]={name:`Giày ${z.name}${tag}`,slot:'shoes',price:0,hidden:true,pk:z.id,colors:{shoes:z.shoes||'f4f1ea'}};
  if(z.cap) CLOTHES[z.items.head]={name:`Mũ lưỡi trai ${z.name}${tag}`,slot:'head',price:0,hidden:true,pk:z.id,opts:{hair:'cap'},colors:{cap:z.cap}}; }
PICKLE.bots.forEach((b,i)=>{ CLOTHES['ao_pk'+i]={name:'Áo thi đấu '+b[0],slot:'top',price:0,hidden:true,colors:{top:b[3]}}; });   // áo thi đấu của từng bot
const YENLANG={W:38,H:18,flatter:{buff:{mul:1.08,min:20},energy:10,lines:['Đẹp trai thế này mà chưa nổi tiếng thì phí quá!','Gu ăn mặc này phải lên bìa tạp chí!','Anh em mà chơi game là auto thắng!','Nhìn thần thái là biết dân chơi hệ sang!']},spawn:{x:12.5,y:16.2},hulk:{x:22.5,y:7.8},guest:{x:7.6,y:6.8},oii:{x:17.4,y:13.6},home:{from:19,to:23},
  pho:{x:106.6,y:90.6,price:50000},lau:{dur:15},stream:{from:20,to:2,dur:20,exp:100,vnd:150000}};
const LUMEN={W:38,H:36,spawn:{x:19,y:33.6},needCerts:4,level:3,expMul:4,daily:4,pay:250000,scholar:{free:2,half:2,reward:{exp:200,vnd:500000}},
  desks:[[25,14.8],[29,14.8],[33,14.8],[25,19.8],[29,19.8],[33,19.8],[8,8.6],[8,19.4]],nap:{x:29,y:7.8,energy:35},coffee:{x:24,y:27.8,energy:10,buff:{mul:1.1,min:30}},
  tasks:{brand:{name:'Bộ nhận diện thương hiệu cho khách',dur:14,exp:30},ui:{name:'Vẽ màn hình app (UI)',dur:12,exp:30},motion:{name:'Motion cho video quảng cáo',dur:12,exp:28},
    research:{name:'Phỏng vấn người dùng (UX research)',dur:12,exp:28},pitch:{name:'Thuyết trình ý tưởng với khách',dur:10,exp:25}}};
// Leno về Lumen xin tiền chị Annie: mỗi ngày 1 lần, chị cho nhưng bắt làm 1 việc vặt trước (đúng chỗ trong studio), xong quay lại lễ tân nhận tiền
LUMEN.annieAsk={who:['n:leno'],pay:[200000,500000],exp:40,jobs:{
  coffee:{name:'Pha 6 ly cà phê muối cho cả team',ask:'pha giúp chị 6 ly cà phê muối cho cả team ở pantry nhé!',at:'coffee',where:'máy pha cà phê ở pantry',dur:10},
  nap:{name:'Dọn phòng nghỉ trưa',ask:'dọn phòng nghỉ trưa, gấp lại chăn gối cho gọn giúp chị!',at:'nap',where:'phòng nghỉ trưa',dur:10},
  figma:{name:'Đặt tên lại 300 layer Figma',ask:'đặt tên lại hết 300 layer "Rectangle copy" trong file Figma của chị đã!',at:'desk',where:'1 bàn làm việc Lumen',dur:14},
  kern:{name:'Căn lại kerning logo khách',ask:'căn lại kerning cái logo khách vừa chê, chữ dính hết vào nhau rồi!',at:'desk',where:'1 bàn làm việc Lumen',dur:12},
  slide:{name:'Làm slide pitching gấp',ask:'làm gấp bộ slide pitching cho buổi họp 3 giờ chiều nay!',at:'desk',where:'1 bàn làm việc Lumen',dur:12},
  icon:{name:'Export bộ icon app 48 cỡ',ask:'export bộ icon app đủ 48 cỡ cho dev, đặt tên file cho chuẩn vào!',at:'desk',where:'1 bàn làm việc Lumen',dur:12}},
  lines:['Cầm lấy mà tiêu, nhưng tiết kiệm thôi nha!','Đây, lần sau chăm làm việc Lumen thì khỏi phải xin chị nhé.','Chị cho đấy, đi ăn bát phở cho có sức rồi về làm tiếp.','Làm tốt lắm! Tiền đây, đừng nạp game hết đấy.']};
// 120 Yên Lãng mở rộng (x 26–36): dàn máy PUBG của Refund Gaming, bếp Haky Food, góc DJ. Nhiệm vụ làm ở "chỗ" (at) trong nhà; nhiệm vụ ẩn (secret) không nhận ở NPC,
// phải tự lục ra: nhìn kỹ 1 chỗ (look), mở nhiều lần (n), chỉ hiện ban đêm giờ game (night), hoặc nói chuyện với 1 người đủ 3 lần trong ngày (talk). Lời thoại của mọi người gợi ý chỗ có nhiệm vụ ẩn.
const RF={desks:[[28,9.4],[31.4,9.4],[34.8,9.4]],spots:{stove:{x:31.6,y:5,label:'Bếp nấu của Haky Food'},fridge:{x:29.4,y:4.7,label:'Tủ lạnh nhà Độ'},cup:{x:27.2,y:4.8,label:'Tủ cúp PUBG'},
    booth:{x:33.6,y:16,label:'Bàn DJ'},cam:{x:9.6,y:7,label:'Máy quay stream'},mic:{x:2.6,y:5.4,label:'Micro bàn stream'},cable:{x:8.4,y:4.4,label:'Ổ điện sau bàn stream'},
    sofa:{x:16.4,y:11.4,label:'Khe ghế sofa'},plant:{x:23.4,y:15.8,label:'Chậu cây góc nhà'},hulk:{x:24.6,y:6.4,label:'Sau lưng Hulkbuster'}},
  night:[22,4],deskDaily:6,
  tasks:{rf_drop:{at:'desk',dur:12,label:'Nhảy dù Pochinki tìm gà',chance:.35},rf_duo:{at:'desk',dur:10,label:'Leo rank duo cùng Pino'},rf_cam:{at:'cam',dur:10,label:'Chỉnh góc máy quay'},
    rf_mic:{at:'mic',dur:8,label:'Test mic, cân âm thanh'},rf_bgm:{at:'booth',dur:10,label:'Chọn nhạc nền buổi stream'},
    hk_trung:{at:'stove',dur:10,label:'Rán trứng',use:{trung:2}},hk_mi:{at:'stove',dur:8,label:'Nấu mì tôm trứng'},hk_lau:{at:'stove',dur:20,label:'Nấu nồi lẩu gà lá é',use:{ga_thit:1,rau_song:1}},
    hk_video:{at:'cam',dur:15,label:'Quay clip nấu ăn Haky Food'},sq_cup:{at:'cup',dur:10,label:'Lau bóng cúp PUBG'},sq_lan:{at:'cable',dur:12,label:'Bấm lại đầu dây mạng'},
    sq_hulk:{at:'hulk',dur:20,label:'Ngồi canh Hulkbuster',night:true},sq_mix:{at:'booth',dur:15,label:'Chơi bản mix bí mật',night:true}},
  secrets:{sofa:{q:'sq_tainghe',how:'look',item:'tai_nghe_rf'},fridge:{q:'sq_banhbao',how:'n',n:3},cup:{q:'sq_cup',how:'look'},cable:{q:'sq_lan',how:'look'},
    hulk:{q:'sq_hulk',how:'night'},plant:{q:'sq_khoa',how:'look',item:'chia_khoa_rf'}},
  talkSecret:{rf_djchip:'sq_mix'},
  look:{stove:'Bếp ga 2 lò, chảo gang đen bóng. Haky Food bảo chảo này "có hồn"',fridge:'Tủ lạnh toàn nước ngọt với trứng. Hình như ai đó vừa lục ở ngăn dưới',cup:'Tủ cúp PUBG của team, bụi bám mờ cả chữ',
    booth:'Bàn DJ 2 mâm đĩa, đèn led nháy theo nhạc',cam:'Máy quay full HD, chân máy hơi lệch',mic:'Micro thu âm có màng lọc, dính tí vụn bánh',cable:'Dây điện, dây mạng chằng chịt sau bàn stream',
    sofa:'Ghế sofa da nâu, khe ghế sâu hun hút',plant:'Chậu cây xanh tốt, đất hơi xới lên',hulk:'Sau lưng Hulkbuster có 1 nút đỏ nhỏ, ban ngày bấm không ăn thua'},
  lines:{rf_rambo:['Cầm Kar98 là phải one tap, không thì về sảnh!','Tủ cúp của team bám bụi lâu lắm rồi, chẳng ai lau...','Ăn gà xong mới được ăn cơm!'],
    rf_pino:['Duo với mình không? Mình giữ máu, bạn đi lên!','Hôm qua nghe Hulkbuster kêu rè rè lúc nửa đêm, sợ vãi','Đói quá, Haky nấu gì chưa?'],
    rf_nhism:['Mạng lag là do dây sau bàn stream đấy, không phải tại mình!','Góc cam lệch thì người xem kêu ngay','Ping 999, cứu!'],
    rf_funky:['Ai thấy tai nghe của mình đâu không? Lúc ngồi sofa còn đeo mà','Mic phải cân lại, tiếng hơi rè','Hôm nay stream tới sáng nhé anh em'],
    rf_djchip:['Nhạc nền stream phải có vibe!','Nghe mình kể chuyện tiếp đi, sắp tới đoạn hay rồi...','Mình có 1 bản mix bí mật, chỉ chơi lúc nửa đêm thôi. Nói nhiều với mình đi rồi mình kể'],
    rf_snake:['Nửa đêm đừng có lại gần Hulkbuster, nghe đồn nó... thức dậy','Jikey hay giấu đồ dưới chậu cây lắm','Tủ lạnh nhà này mở mấy lần là biết ai ăn vụng'],
    rf_jikey:['Bánh bao gì? Mình không biết gì hết nha!','Mất chìa khoá phòng rồi, mà hình như mình giấu ở đâu đó...','Ăn no rồi chơi game mới ngon'],
    haky:['Nấu ăn là nghệ thuật! Nhưng nấu cho team RF thì là... chiến trường','Lửa to, tay nhanh, nêm vừa!','Ăn ngon thì nhớ follow kênh Haky Food nhé']}};
Object.assign(QUESTS,{
  rf_drop:{giver:'rf_rambo',title:'Ăn gà ở Pochinki',desc:'Ngồi 1 máy PUBG trong góc Refund Gaming, nhảy dù Pochinki tới khi ăn được gà (mỗi lượt 12 giây, không phải lượt nào cũng ăn gà).',prog:1,reward:{exp:220,vnd:300000}},
  rf_duo:{giver:'rf_pino',title:'Leo rank duo cùng Pino',desc:'Ngồi máy PUBG chơi duo với Pino 2 trận.',prog:2,reward:{exp:200,vnd:250000}},
  rf_cam:{giver:'rf_nhism',title:'Chỉnh góc máy quay',desc:'Ra máy quay cạnh bàn stream của anh Độ chỉnh lại góc cho chuẩn.',prog:1,reward:{exp:160,vnd:200000}},
  rf_mic:{giver:'rf_funky',title:'Test mic cho buổi stream',desc:'Ra micro bàn stream test tiếng, cân âm thanh 2 lần.',prog:2,reward:{exp:180,vnd:220000}},
  rf_bgm:{giver:'rf_djchip',title:'Chọn nhạc nền buổi stream',desc:'Ra bàn DJ chọn nhạc nền cho buổi stream tối nay.',prog:1,reward:{exp:160,vnd:200000}},
  hk_trung:{giver:'haky',title:'Trứng rán Haky',desc:'Mang 2 quả trứng gà (tiệm thịt Đà Lạt hoặc nhặt trong rừng Ké) tới bếp, rán 2 quả trứng ốp la cho team.',prog:1,reward:{exp:200,vnd:250000}},
  hk_mi:{giver:'haky',after:'hk_trung',title:'Mì tôm trứng đêm khuya',desc:'Nấu 3 nồi mì tôm trứng ở bếp cho anh em đang stream (mỗi nồi 8 giây).',prog:3,reward:{exp:240,vnd:300000}},
  hk_lau:{giver:'haky',after:'hk_mi',title:'Nồi lẩu gà lá é cả nhà',desc:'Kiếm 1 gà làm sẵn và 1 rau sống (xe bà Lụa ở Miếu Hải Phòng, hoặc chợ Đà Lạt), mang về bếp nấu lẩu 20 giây.',prog:1,reward:{exp:380,vnd:500000}},
  hk_video:{giver:'haky',after:'hk_lau',title:'Quay clip Haky Food',desc:'Ra máy quay stream quay clip nồi lẩu cho kênh Haky Food (15 giây).',prog:1,reward:{exp:300,vnd:400000}},
  sq_tainghe:{giver:'rf_funky',secret:true,title:'🔍 Tai nghe thất lạc',desc:'Tìm thấy tai nghe RF trong khe ghế sofa. Mang trả FunkyM.',need:{tai_nghe_rf:1},reward:{exp:220,vnd:300000}},
  sq_banhbao:{giver:'haky',secret:true,title:'🔍 Ai ăn vụng bánh bao?',desc:'Tủ lạnh mất 3 cái bánh bao của Haky. Đi hỏi Jikey xem sao, rồi báo Haky.',prog:1,reward:{exp:240,vnd:300000}},
  sq_cup:{giver:'rf_rambo',secret:true,title:'🔍 Cúp PUBG mờ bụi',desc:'Lau bóng tủ cúp PUBG (10 giây) rồi báo Rambo.',prog:1,reward:{exp:220,vnd:280000}},
  sq_lan:{giver:'rf_nhism',secret:true,title:'🔍 Thủ phạm gây lag',desc:'Đầu dây mạng sau bàn stream lỏng lẻo. Bấm lại (12 giây) rồi báo Nhism.',prog:1,reward:{exp:240,vnd:300000}},
  sq_hulk:{giver:'rf_snake',secret:true,title:'🔍 Hulkbuster thức giấc',desc:'Nửa đêm, nút đỏ sau lưng Hulkbuster sáng lên! Ngồi canh nó 20 giây (chỉ ban đêm) rồi kể Snake nghe.',prog:1,reward:{exp:320,vnd:400000}},
  sq_khoa:{giver:'rf_jikey',secret:true,title:'🔍 Chìa khoá dưới chậu cây',desc:'Dưới chậu cây góc nhà có 1 chìa khoá. Mang trả Jikey.',need:{chia_khoa_rf:1},reward:{exp:200,vnd:250000}},
  sq_mix:{giver:'rf_djchip',secret:true,title:'🔍 Bản mix bí mật',desc:'DjChip tiết lộ bản mix chỉ chơi lúc nửa đêm. Ban đêm ra bàn DJ chơi 15 giây rồi báo DjChip.',prog:1,reward:{exp:300,vnd:350000}}});
NPCS.push({id:'rf_rambo',scene:'yenlang',x:26.8,y:11.2,place:'rf'},{id:'rf_pino',scene:'yenlang',x:30.2,y:11.6,place:'rf'},{id:'rf_nhism',scene:'yenlang',x:33.6,y:11.6,place:'rf'},
  {id:'rf_funky',scene:'yenlang',x:2.4,y:8.8,place:'rf'},{id:'rf_djchip',scene:'yenlang',x:35.6,y:15.4,place:'rf'},{id:'rf_snake',scene:'yenlang',x:27.6,y:15.2,place:'rf'},
  {id:'rf_jikey',scene:'yenlang',x:30.4,y:15.4,place:'rf'},{id:'haky',scene:'yenlang',x:34.8,y:6,place:'haky'});
Object.assign(CLOTHES,{ao_rf:{name:'Áo đấu Refund Gaming (đen)',slot:'top',price:0,hidden:true,opts:{top:'tee',print:true},colors:{top:'1c1a20',print:'e8b83a',line:'e05a5a'}},
  ao_rf_trang:{name:'Áo đấu Refund Gaming (trắng)',slot:'top',price:0,hidden:true,opts:{top:'tee',print:true},colors:{top:'f2f0ea',print:'d23a2e',line:'1c1a20'}},
  hoodie_rf:{name:'Hoodie Refund Gaming',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'4a4e5a',inner:'1c1a20'}},
  ao_bep_haky:{name:'Áo bếp Haky Food',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'f4f2ec'}}});
Object.assign(NPC_LOOKS,{rf_rambo:{name:'Rambo (Refund Gaming)',look:{gender:'nam',hair:'undercut',hairColor:'1c1820',skin:'e8b48a',outfit:{top:'ao_rf',bottom:'jean',shoes:'giay_den'},opts:{mouth:'line'}}},
  rf_pino:{name:'Pino (Refund Gaming)',look:{gender:'nam',hair:'fringe',hairColor:'3a2a22',skin:'f0c4a0',outfit:{top:'hoodie_rf',bottom:'kaki',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  rf_nhism:{name:'Nhism (Refund Gaming)',look:{gender:'nam',hair:'messy',hairColor:'5a3a2a',skin:'f3c4a4',outfit:{top:'ao_rf_trang',bottom:'jean',shoes:'giay_trang'},opts:{mouth:'smile'}}},
  rf_funky:{name:'FunkyM (Refund Gaming)',look:{gender:'nam',hair:'fade',hairColor:'1c1820',skin:'e8b08e',outfit:{top:'ao_rf',bottom:'quan_da',shoes:'giay_trang'},opts:{earring:true,mouth:'smile'}}},
  rf_djchip:{name:'DjChip (Refund Gaming)',look:{gender:'nam',hair:'shag',hairColor:'c8a060',skin:'f0c4a0',outfit:{top:'hoodie_rf',bottom:'jean',shoes:'giay_den',eyes:'kinh_ram'},opts:{mouth:'smile'}}},
  rf_snake:{name:'Snake (Refund Gaming)',look:{gender:'nam',hair:'buzz',hairColor:'2a2026',skin:'e0a888',outfit:{top:'ao_rf',bottom:'kaki',shoes:'giay_den'},opts:{tattoo:true,mouth:'line'}}},
  rf_jikey:{name:'Jikey (Refund Gaming)',look:{gender:'nam',hair:'swept',hairColor:'2a2240',skin:'f3c4a4',outfit:{top:'ao_rf_trang',bottom:'kaki',shoes:'giay_trang'},opts:{mouth:'smile'}}},
  haky:{name:'Haky Food',look:{gender:'nam',hair:'swept',hairColor:'2a1c16',skin:'f0c0a0',outfit:{top:'ao_bep_haky',bottom:'quan_da',shoes:'giay_den'},opts:{mouth:'smile'}}}});
ITEMS.tai_nghe_rf={name:'Tai nghe Refund Gaming',icon:'headset'}; ITEMS.chia_khoa_rf={name:'Chìa khoá phòng Jikey',icon:'key'};
/* ---------- Lính Cát (sinh vật đồng hành, kiểu thú bỏ túi) ----------
   Học "Huấn luyện Lính Cát" ở Trung tâm Lính Cát (thị trấn Đà Bắc, cạnh đường lớn phía Đông chợ), chọn 1 trong 3 con khởi đầu.
   Mang theo tối đa 5 con, còn lại gửi ở máy gửi giữ trong Trung tâm. Muốn thu phục con hoang thì cho Lính Cát của mình đấu, đánh yếu rồi ném Bóng Cát.
   Đấu theo lượt (server tính), chỉ số theo cấp: máu = base×2×lv/100+lv+10, chỉ số khác = base×2×lv/100+5. Chiêu học theo hệ ở cấp 1 / 10 / 22. */
const LC_TYPES={thuong:{name:'Thường',col:'#b8b0a0'},hoa:{name:'Lửa',col:'#ff7a3a'},thuy:{name:'Nước',col:'#4ab0ff'},moc:{name:'Cỏ',col:'#5fae46'},loi:{name:'Điện',col:'#f2c43d'},
  tien:{name:'Tiên',col:'#ff8ad2'},ma:{name:'Ma',col:'#8a5ad8'},long:{name:'Rồng',col:'#6a7ae8'},bang:{name:'Băng',col:'#7fd8f0'},am:{name:'Bóng tối',col:'#5a4a6a'},than:{name:'Tâm linh',col:'#e86ab8'}};
// hệ chiêu → hệ bị đánh: hệ số (không ghi là 1)
const LC_EFF={hoa:{moc:2,bang:2,thuy:.5,hoa:.5,long:.5},thuy:{hoa:2,thuy:.5,moc:.5,long:.5},moc:{thuy:2,hoa:.5,moc:.5,long:.5},loi:{thuy:2,moc:.5,loi:.5,long:.5},
  bang:{moc:2,long:2,hoa:.5,thuy:.5,bang:.5},tien:{long:2,am:2,hoa:.5},ma:{ma:2,than:2,thuong:0,am:.5},long:{long:2,tien:0},am:{than:2,ma:2,tien:.5,am:.5},than:{am:0,than:.5},thuong:{ma:0}};
const LC_MOVES={hu:{name:'Húc',t:'thuong',pow:40,acc:1},
  than_lua:{name:'Than Lửa',t:'hoa',pow:40,acc:1},phun_lua:{name:'Phun Lửa',t:'hoa',pow:70,acc:.92},hoa_nguc:{name:'Hoả Ngục',t:'hoa',pow:95,acc:.8},
  ban_nuoc:{name:'Bắn Nước',t:'thuy',pow:40,acc:1},voi_rong:{name:'Vòi Rồng',t:'thuy',pow:70,acc:.92},song_than:{name:'Sóng Thần',t:'thuy',pow:95,acc:.8},
  la_bay:{name:'Lá Bay',t:'moc',pow:40,acc:1},roi_day:{name:'Roi Dây',t:'moc',pow:70,acc:.92},bao_la:{name:'Bão Lá',t:'moc',pow:95,acc:.8},
  tia_dien:{name:'Tia Điện',t:'loi',pow:40,acc:1},sam_set:{name:'Sấm Sét',t:'loi',pow:70,acc:.92},loi_dinh:{name:'Lôi Đình',t:'loi',pow:95,acc:.8},
  hon_gio:{name:'Hôn Gió',t:'tien',pow:40,acc:1},anh_trang:{name:'Ánh Trăng',t:'tien',pow:70,acc:.92},phep_tien:{name:'Phép Tiên',t:'tien',pow:95,acc:.8},
  liem:{name:'Liếm Hồn',t:'ma',pow:35,acc:1},bong_ma:{name:'Bóng Ma',t:'ma',pow:70,acc:.92},ac_mong:{name:'Ác Mộng',t:'ma',pow:95,acc:.8},
  vuot_rong:{name:'Vuốt Rồng',t:'long',pow:45,acc:1},hoi_tho_rong:{name:'Hơi Thở Rồng',t:'long',pow:70,acc:.92},long_no:{name:'Long Nộ',t:'long',pow:100,acc:.78},
  gio_bang:{name:'Gió Băng',t:'bang',pow:40,acc:1},tia_bang:{name:'Tia Băng',t:'bang',pow:70,acc:.92},bao_tuyet:{name:'Bão Tuyết',t:'bang',pow:95,acc:.8},
  can_trom:{name:'Cắn Trộm',t:'am',pow:40,acc:1},vuot_dem:{name:'Vuốt Đêm',t:'am',pow:70,acc:.92},bong_dem:{name:'Bóng Đêm',t:'am',pow:95,acc:.8},
  niem_luc:{name:'Niệm Lực',t:'than',pow:40,acc:1},tam_than:{name:'Tâm Thần',t:'than',pow:70,acc:.92},vu_tru:{name:'Vũ Trụ',t:'than',pow:95,acc:.8},
  cao:{name:'Cào Cấu',t:'thuong',pow:55,acc:.95},dam_sam:{name:'Đâm Sầm',t:'thuong',pow:80,acc:.85}};
const LC_TYPE_MOVES={hoa:['than_lua','phun_lua','hoa_nguc'],thuy:['ban_nuoc','voi_rong','song_than'],moc:['la_bay','roi_day','bao_la'],loi:['tia_dien','sam_set','loi_dinh'],
  tien:['hon_gio','anh_trang','phep_tien'],ma:['liem','bong_ma','ac_mong'],long:['vuot_rong','hoi_tho_rong','long_no'],bang:['gio_bang','tia_bang','bao_tuyet'],
  am:['can_trom','vuot_dem','bong_dem'],than:['niem_luc','tam_than','vu_tru'],thuong:['cao','dam_sam','dam_sam']};
// loài: t hệ, st cấp tiến hoá, b chỉ số gốc [máu, công, thủ, tốc], evo {to, lv} | stone {đá: loài} (Cát Con), rate dễ bắt (0..1), ex EXP khi hạ
const LC_SPECIES={
  lua_nhi:{name:'Lửa Nhí',t:'hoa',st:1,b:[39,52,43,65],evo:{to:'hoa_binh',lv:16},rate:.3,starter:1,desc:'Thằn lằn lửa nhí, đuôi cháy bập bùng. Đuôi tắt là ốm.'},
  hoa_binh:{name:'Hoả Binh',t:'hoa',st:2,b:[58,64,58,80],evo:{to:'hoa_tuong',lv:32},rate:.15},
  hoa_tuong:{name:'Hoả Long Tướng',t:'hoa',st:3,b:[78,84,78,100],rate:.05},
  mam_nhi:{name:'Mầm Nhí',t:'moc',st:1,b:[45,49,49,45],evo:{to:'la_binh',lv:16},rate:.3,starter:1,desc:'Ếch con cõng mầm cây trên lưng, phơi nắng là no.'},
  la_binh:{name:'Lá Binh',t:'moc',st:2,b:[60,62,63,60],evo:{to:'moc_tuong',lv:32},rate:.15},
  moc_tuong:{name:'Đại Thụ Tướng',t:'moc',st:3,b:[80,82,83,80],rate:.05},
  rua_nhi:{name:'Rùa Nhí',t:'thuy',st:1,b:[44,48,65,43],evo:{to:'thuy_binh',lv:16},rate:.3,starter:1,desc:'Rùa con mai xanh, thích bơi ở hồ Hoà Bình.'},
  thuy_binh:{name:'Thuỷ Binh',t:'thuy',st:2,b:[59,63,80,58],evo:{to:'thuy_tuong',lv:32},rate:.15},
  thuy_tuong:{name:'Thuỷ Pháo Tướng',t:'thuy',st:3,b:[79,83,100,78],rate:.05},
  ti_set:{name:'Tí Sét',t:'loi',st:1,b:[35,55,40,90],evo:{to:'set_binh',lv:14},rate:.5,desc:'Chuột điện má hồng, giật mình là tóe lửa điện.'},
  set_binh:{name:'Sét Binh',t:'loi',st:2,b:[50,70,50,100],evo:{to:'loi_tuong',lv:28},rate:.25},
  loi_tuong:{name:'Lôi Tướng',t:'loi',st:3,b:[60,90,55,110],rate:.08},
  bong_bong:{name:'Bông Bông',t:'tien',st:1,b:[70,45,48,35],evo:{to:'bong_hong',lv:14},rate:.6,desc:'Cục bông hồng biết hát ru, ai nghe cũng buồn ngủ.'},
  bong_hong:{name:'Bông Hồng',t:'tien',st:2,b:[95,65,63,45],evo:{to:'tien_bong',lv:28},rate:.3},
  tien_bong:{name:'Tiên Bông',t:'tien',st:3,b:[115,80,73,60],rate:.08},
  khoi_nhi:{name:'Khói Nhí',t:'ma',st:1,b:[30,35,30,80],evo:{to:'bong_ma_binh',lv:16},rate:.45,night:1,desc:'Cụm khói tím chỉ hiện ban đêm, cười khúc khích.'},
  bong_ma_binh:{name:'Bóng Ma Binh',t:'ma',st:2,b:[45,50,45,95],evo:{to:'quy_tuong',lv:32},rate:.2,night:1},
  quy_tuong:{name:'Quỷ Bóng Tướng',t:'ma',st:3,b:[60,65,60,110],rate:.06,night:1},
  rong_nhi:{name:'Rồng Nhí',t:'long',st:1,b:[41,64,45,50],evo:{to:'rong_may',lv:24},rate:.15,desc:'Rồng con hiếm gặp ở vùng xa, lột da mấy lần mới lớn.'},
  rong_may:{name:'Rồng Mây',t:'long',st:2,b:[61,84,65,70],evo:{to:'long_vuong',lv:40},rate:.08},
  long_vuong:{name:'Long Vương Cát',t:'long',st:3,b:[91,114,95,80],rate:.03},
  cat_con:{name:'Cát Con',t:'thuong',st:1,b:[55,55,50,55],stone:{da_lua:'cat_hoa',da_nuoc:'cat_thuy',da_sam:'cat_loi',da_la:'cat_la',da_bang:'cat_bang',da_tien:'cat_tien',da_trang:'cat_nguyet',da_tam:'cat_than'},stoneLv:15,rate:.35,desc:'Cáo cát tai to, gene linh hoạt: cho chạm đá nguyên tố là tiến hoá ra 8 hệ khác nhau.'},
  cat_hoa:{name:'Cát Hoả',t:'hoa',st:2,b:[65,110,60,65],rate:.1},cat_thuy:{name:'Cát Thuỷ',t:'thuy',st:2,b:[110,65,60,65],rate:.1},cat_loi:{name:'Cát Lôi',t:'loi',st:2,b:[65,65,60,110],rate:.1},
  cat_la:{name:'Cát Lá',t:'moc',st:2,b:[65,95,110,85],rate:.1},cat_bang:{name:'Cát Băng',t:'bang',st:2,b:[65,105,65,65],rate:.1},cat_tien:{name:'Cát Tiên',t:'tien',st:2,b:[95,85,65,60],rate:.1},
  cat_nguyet:{name:'Cát Nguyệt',t:'am',st:2,b:[95,65,110,65],rate:.1},cat_than:{name:'Cát Thần',t:'than',st:2,b:[65,110,60,110],rate:.1},
  // đối thủ không bắt được: vật nuôi, thú vườn quốc gia (bảo tồn)
  lon:{name:'Lợn nhà',t:'thuong',st:1,b:[70,50,55,30],npc:1},bo:{name:'Bò vàng',t:'thuong',st:2,b:[85,65,65,25],npc:1},ga:{name:'Gà ri',t:'thuong',st:1,b:[40,50,35,65],npc:1},vit:{name:'Vịt cỏ',t:'thuy',st:1,b:[45,40,40,50],npc:1},
  huou:{name:'Hươu sao',t:'thuong',st:2,b:[60,60,55,85],npc:1,wild:1},raica:{name:'Rái cá',t:'thuy',st:2,b:[60,65,50,80],npc:1,wild:1},gau:{name:'Gấu ngựa',t:'thuong',st:3,b:[95,95,70,40],npc:1,wild:1},
  voc:{name:'Voọc',t:'thuong',st:2,b:[55,60,50,95],npc:1,wild:1}};
const LINHCAT={party:5,box:60,learnFee:200000,starters:['lua_nhi','mam_nhi','rua_nhi'],startLv:6,startBalls:5,startPotions:3,
  shop:{bong_cat:20000,bong_vang:60000,thuoc_cat:30000,da_lua:150000,da_nuoc:150000,da_sam:150000,da_la:150000,da_bang:150000,da_tien:150000,da_trang:150000,da_tam:150000},
  ball:{bong_cat:1,bong_vang:1.8},potion:40,period:12*60e3,jail:{chance:.2,sec:60,fine:150000},trainerExp:12,
  door:{x:176.5,y:64.7},at:{nurse:[12,6],starter:[5.4,9.8],box:[20.4,5.4],shop:[20.4,10.2]},
  // vật nuôi thả rông quanh sân Ké (đấu lấy EXP, không bắt được) · thú vườn quốc gia: điểm PARK.spots có loài tương ứng
  farm:[[59.4,45.6,'bo'],[59.4,48.8,'lon'],[63,51.2,'ga'],[66.6,51.2,'vit']],park:{huou:'huou',raica:'raica',gau:'gau',vooc:'voc'},
  // điểm có Lính Cát hoang ở Ké: z vùng (1 gần, 2 giữa, 3 xa) quyết định cấp và loài
  spots:[[89.5,20.5,1],[110.5,23.5,1],[62.5,47.5,1],[47.5,38.5,1],[20.5,38.5,1],[74.5,62.5,1],[104.5,62.5,1],[41.5,77.5,1],[29.5,119.5,1],
    [137.5,29.5,2],[158.5,29.5,2],[137.5,53.5,2],[200.5,38.5,2],[164.5,77.5,2],[185.5,62.5,2],[125.5,119.5,2],[224.5,119.5,2],
    [236.5,38.5,3],[263.5,17.5,3],[278.5,35.5,3],[314.5,44.5,3],[236.5,65.5,3],[308.5,65.5,3],[230.5,83.5,3],[314.5,119.5,3]],
  zones:{1:{lv:[2,5],pool:['cat_con','cat_con','bong_bong','bong_bong','ti_set','ti_set','khoi_nhi']},2:{lv:[6,12],pool:['cat_con','bong_bong','ti_set','ti_set','khoi_nhi','set_binh','bong_hong']},
    3:{lv:[12,22],pool:['ti_set','set_binh','bong_hong','khoi_nhi','bong_ma_binh','rong_nhi','cat_con','rong_nhi']}}};
// Lính Cát mở rộng: 5 hệ mới (Côn trùng, Bay, Độc, Đá, Võ), 31 loài mới (vẽ ở art10.js), Lính Cát hoang ở cả Đà Lạt, Miếu, đèo, trường đua (ít hơn Ké)
Object.assign(LC_TYPES,{trung:{name:'Côn trùng',col:'#9ac83a'},bay:{name:'Bay',col:'#9ab8f0'},doc:{name:'Độc',col:'#a85ac8'},da:{name:'Đá',col:'#b8a070'},vo:{name:'Võ',col:'#c8503a'}});
Object.assign(LC_EFF,{trung:{moc:2,than:2,am:2,hoa:.5,bay:.5,vo:.5,doc:.5,ma:.5},bay:{moc:2,vo:2,trung:2,loi:.5,da:.5},doc:{moc:2,tien:2,doc:.5,da:.5,ma:.5},
  da:{hoa:2,bang:2,bay:2,trung:2,vo:.5},vo:{thuong:2,bang:2,da:2,am:2,doc:.5,bay:.5,than:.5,tien:.5,trung:.5,ma:0}});
Object.assign(LC_EFF.thuy,{da:2}); Object.assign(LC_EFF.moc,{da:2,bay:.5,doc:.5,trung:.5}); Object.assign(LC_EFF.loi,{bay:2}); Object.assign(LC_EFF.bang,{bay:2}); Object.assign(LC_EFF.hoa,{trung:2,da:.5});
Object.assign(LC_EFF.than,{vo:2,doc:2}); Object.assign(LC_EFF.tien,{vo:2,doc:.5}); Object.assign(LC_EFF.thuong,{da:.5});
Object.assign(LC_MOVES,{dot_kim:{name:'Đốt Kim',t:'trung',pow:40,acc:1},to_bao:{name:'Tơ Bão',t:'trung',pow:70,acc:.92},bay_bo:{name:'Bầy Bọ',t:'trung',pow:95,acc:.8},
  mo:{name:'Mổ',t:'bay',pow:40,acc:1},canh_gio:{name:'Cánh Gió',t:'bay',pow:70,acc:.92},loc_xoay:{name:'Lốc Xoáy',t:'bay',pow:95,acc:.8},
  khi_doc:{name:'Khí Độc',t:'doc',pow:40,acc:1},axit:{name:'Axit',t:'doc',pow:70,acc:.92},bom_doc:{name:'Bom Độc',t:'doc',pow:95,acc:.8},
  nem_da:{name:'Ném Đá',t:'da',pow:40,acc:1},da_lo:{name:'Đá Lở',t:'da',pow:70,acc:.92},thien_thach:{name:'Thiên Thạch',t:'da',pow:100,acc:.78},
  dam:{name:'Đấm Thẳng',t:'vo',pow:40,acc:1},da_xoay:{name:'Đá Xoáy',t:'vo',pow:70,acc:.92},quyen_vuong:{name:'Quyền Vương',t:'vo',pow:100,acc:.78}});
Object.assign(LC_TYPE_MOVES,{trung:['dot_kim','to_bao','bay_bo'],bay:['mo','canh_gio','loc_xoay'],doc:['khi_doc','axit','bom_doc'],da:['nem_da','da_lo','thien_thach'],vo:['dam','da_xoay','quyen_vuong']});
Object.assign(LC_SPECIES,{
  sau_nhi:{name:'Sâu Nhí',t:'trung',st:1,b:[45,30,35,45],evo:{to:'ken_cat',lv:7},rate:.8,desc:'Sâu xanh tham ăn, gặm lá cả ngày.'},ken_cat:{name:'Kén Cát',t:'trung',st:2,b:[50,20,55,30],evo:{to:'buom_tien',lv:10},rate:.6},
  buom_tien:{name:'Bướm Tiên',t:'trung',st:3,b:[60,65,50,70],rate:.3},
  se_nhi:{name:'Sẻ Nhí',t:'bay',st:1,b:[40,45,40,56],evo:{to:'chim_ung',lv:18},rate:.7,desc:'Chim sẻ nhanh nhảu, hay đậu trên mái nhà Ké.'},chim_ung:{name:'Chim Ưng',t:'bay',st:2,b:[63,60,55,71],evo:{to:'dai_bang',lv:36},rate:.35},
  dai_bang:{name:'Đại Bàng Cát',t:'bay',st:3,b:[83,80,75,101],rate:.1},
  chuot_nhi:{name:'Chuột Nhí',t:'thuong',st:1,b:[30,56,35,72],evo:{to:'chuot_tuong',lv:20},rate:.8,desc:'Chuột tím răng to, gặm gì cũng đứt.'},chuot_tuong:{name:'Chuột Tướng',t:'thuong',st:2,b:[55,81,60,97],rate:.35},
  ran_nhi:{name:'Rắn Nhí',t:'doc',st:1,b:[35,60,44,55],evo:{to:'ho_mang',lv:22},rate:.55,desc:'Rắn tím cuộn tròn, lè lưỡi doạ người.'},ho_mang:{name:'Hổ Mang Cát',t:'doc',st:2,b:[60,85,69,80],rate:.2},
  doi_nhi:{name:'Dơi Nhí',t:'doc',st:1,b:[40,45,35,55],evo:{to:'doi_dem',lv:22},rate:.6,night:1,desc:'Dơi xanh không có mắt, bay bằng tiếng vang ban đêm.'},doi_dem:{name:'Dơi Đêm',t:'doc',st:2,b:[75,80,70,90],rate:.25,night:1},
  da_nhi:{name:'Đá Nhí',t:'da',st:1,b:[40,80,100,20],evo:{to:'da_lan',lv:25},rate:.55,desc:'Hòn đá có tay, nằm lẫn ven đèo, giẫm phải là bị đấm.'},da_lan:{name:'Đá Lăn',t:'da',st:2,b:[55,95,115,35],evo:{to:'nui_da',lv:40},rate:.25},
  nui_da:{name:'Núi Đá Tướng',t:'da',st:3,b:[80,120,130,45],rate:.08},
  vo_nhi:{name:'Võ Sĩ Nhí',t:'vo',st:1,b:[70,80,50,35],evo:{to:'vo_si',lv:28},rate:.5,desc:'Võ sĩ tí hon tập đấm cả ngày, không biết mệt.'},vo_si:{name:'Võ Sĩ Cát',t:'vo',st:2,b:[80,100,70,45],evo:{to:'vo_tuong',lv:40},rate:.2},
  vo_tuong:{name:'Võ Lâm Tướng',t:'vo',st:3,b:[90,130,80,55],rate:.06},
  ca_chep:{name:'Cá Chép Cát',t:'thuy',st:1,b:[20,10,55,80],evo:{to:'long_ngu',lv:20},rate:.9,desc:'Cá chép yếu xìu chỉ biết quẫy... nhưng vượt vũ môn là hoá rồng.'},long_ngu:{name:'Long Ngư',t:'thuy',st:2,b:[95,125,79,81],rate:.06},
  niem_nhi:{name:'Niệm Nhí',t:'than',st:1,b:[25,20,15,90],evo:{to:'niem_su',lv:16},rate:.5,desc:'Ngủ 18 tiếng/ngày, đang ngủ vẫn dịch chuyển được.'},niem_su:{name:'Niệm Sư',t:'than',st:2,b:[40,35,30,105],evo:{to:'dai_niem',lv:36},rate:.2},
  dai_niem:{name:'Đại Niệm Sư',t:'than',st:3,b:[55,50,45,120],rate:.06},
  cu_nhi:{name:'Củ Nhí',t:'doc',st:1,b:[45,50,55,30],evo:{to:'hoa_hoi',lv:21},rate:.7,desc:'Củ xanh có lá mọc trên đầu, ban ngày chôn mình dưới đất.'},hoa_hoi:{name:'Hoa Hôi',t:'doc',st:2,b:[60,65,70,40],evo:{to:'hoa_doc',lv:34},rate:.3},
  hoa_doc:{name:'Hoa Độc Tướng',t:'doc',st:3,b:[75,80,85,50],rate:.1},
  gau_ngu:{name:'Gấu Ngủ',t:'thuong',st:3,b:[160,110,65,30],rate:.08,desc:'Ăn xong là ngủ, nằm chắn cả lối đi. Hiếm gặp ở vùng xa.'},
  phuong_hoang:{name:'Phượng Hoàng Lửa',t:'hoa',st:3,b:[90,100,90,90],rate:.03,legend:1,desc:'Thần điểu huyền thoại, cánh rực lửa.'},
  than_dieu_bang:{name:'Thần Điểu Băng',t:'bang',st:3,b:[90,85,100,85],rate:.03,legend:1,desc:'Thần điểu huyền thoại, bay qua là tuyết rơi.'},
  loi_dieu:{name:'Lôi Điểu',t:'loi',st:3,b:[90,90,85,100],rate:.03,legend:1,desc:'Thần điểu huyền thoại, vỗ cánh là sấm nổ.'},
  tieu_than:{name:'Tiểu Thần Cát',t:'than',st:3,b:[100,100,100,100],rate:.02,legend:1,desc:'Thần thoại: mèo hồng biết mọi chiêu thức, chỉ hiện cho người may mắn.'}});
LINHCAT.legend=['phuong_hoang','than_dieu_bang','loi_dieu','tieu_than']; LINHCAT.legendChance=.012;
LINHCAT.zones={1:{lv:[2,5],pool:['cat_con','cat_con','bong_bong','bong_bong','ti_set','ti_set','khoi_nhi','sau_nhi','sau_nhi','se_nhi','se_nhi','chuot_nhi','chuot_nhi','cu_nhi']},
  2:{lv:[6,12],pool:['cat_con','bong_bong','ti_set','set_binh','khoi_nhi','sau_nhi','ken_cat','se_nhi','chim_ung','chuot_tuong','ran_nhi','doi_nhi','cu_nhi','hoa_hoi','vo_nhi','niem_nhi','ca_chep','da_nhi']},
  3:{lv:[12,22],pool:['set_binh','bong_hong','bong_ma_binh','rong_nhi','chim_ung','ho_mang','doi_dem','da_lan','vo_si','niem_su','hoa_hoi','buom_tien','gau_ngu','ca_chep','rong_nhi','ti_set','cat_con']}};
// mỗi map: điểm [x, y, vùng]; pool riêng thì ghi đè pool của vùng
LINHCAT.maps={retreat:{spots:LINHCAT.spots},
  dalat:{spots:[[25.5,3.5,2],[13.5,13.5,1],[49.5,13.5,2],[61.5,5.5,2],[5.5,5.5,1]],pool:['sau_nhi','ken_cat','buom_tien','cu_nhi','hoa_hoi','bong_bong','se_nhi','cat_con','mam_nhi']},
  mieu:{spots:[[3.5,3.5,2],[33.5,7.5,2],[13.5,27.5,1]],pool:['khoi_nhi','bong_ma_binh','niem_nhi','doi_nhi','chuot_nhi','ran_nhi','niem_nhi']},
  deo:{spots:[[31.5,5.5,3],[91.5,5.5,3],[151.5,5.5,3],[211.5,5.5,3]],pool:['da_nhi','da_lan','vo_nhi','vo_si','se_nhi','chim_ung','rong_nhi','ran_nhi','da_nhi']},
  // rừng MU: hàng khu đầu vùng 1, giữa vùng 2, cuối vùng 3 (có thể gặp huyền thoại), đứng giữa 2 ổ quái phía trên
  mu:{spots:[[16.5,34.5,1],[48,34.5,1],[79,34.5,2],[16.5,47.5,2],[48,47.5,2],[79,47.5,3],[16.5,60.5,3],[48,60.5,3],[79,60.5,3]]}};   // không thả ở trường đua (đang đua ngựa)
// cân bằng sức mạnh: mọi loài (trừ vật nuôi / thú rừng) đưa tổng chỉ số gốc về cùng mức theo bậc tiến hoá, giữ nguyên dáng chỉ số của loài
// (bậc 1: 300 · bậc 2 còn tiến hoá: 405 · bậc 2 cuối dòng: 450 · bậc 3: 500 · huyền thoại: 580, vượt trội hẳn)
for(const s of Object.values(LC_SPECIES)){ if(s.npc) continue; const tgt=s.legend?580:s.st===1?300:s.st===2?(s.evo?405:450):500, sum=s.b.reduce((a,v)=>a+v,0); s.b=s.b.map(v=>Math.max(15,Math.round(v*tgt/sum))); }
const lcStats=(sp,lv)=>{ const b=LC_SPECIES[sp].b; return {hp:Math.floor(b[0]*2*lv/100)+lv+10,atk:Math.floor(b[1]*2*lv/100)+5,def:Math.floor(b[2]*2*lv/100)+5,spd:Math.floor(b[3]*2*lv/100)+5}; };
const lcMoves=(sp,lv)=>{ const tm=LC_TYPE_MOVES[LC_SPECIES[sp].t]||LC_TYPE_MOVES.thuong, out=['hu',tm[0]]; if(lv>=10) out.push(tm[1]); if(lv>=22&&!out.includes(tm[2])) out.push(tm[2]); return out; };
const lcNext=lv=>lv*20;   // EXP lên cấp kế
// Lính Cát hoang đang ở mỗi điểm (đổi loài mỗi `period`, khớp giữa server và máy khách); ban ngày không có hệ Ma
function lcWild(ms=Date.now(),scene='retreat'){ const L=LINHCAT, M=L.maps[scene]; if(!M) return []; const per=Math.floor(ms/L.period), h=vnTime(ms).hf, night=h>=19||h<5, salt=scene.length*977+scene.charCodeAt(0);
  return M.spots.map(([x,y,z],i)=>{ const Z=L.zones[z], r=n=>{ let h=(per*73856093)^(i*19349663)^(n*83492791)^salt; h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; return (h>>>0)/4294967296; };
    let pool=(M.pool||Z.pool).filter(k=>night||!LC_SPECIES[k].night); if(!pool.length) pool=['cat_con']; let sp=pool[Math.floor(r(1)*pool.length)], lv=Z.lv[0]+Math.floor(r(2)*(Z.lv[1]-Z.lv[0]+1));
    if(z===3&&r(5)<L.legendChance){ sp=L.legend[Math.floor(r(6)*L.legend.length)]; lv=Math.max(lv,30); }   // huyền thoại: rất hiếm, chỉ ở vùng xa
    return {i,key:scene+':'+per+':'+i,sp,lv,x:x+(r(3)-.5)*2,y:y+(r(4)-.5)*1.2}; }); }
Object.assign(ITEMS,{bong_cat:{name:'Bóng Cát',icon:'lcball'},bong_vang:{name:'Bóng Cát Vàng',icon:'lcball2'},thuoc_cat:{name:'Thuốc hồi máu Lính Cát',icon:'lcpotion'},
  da_lua:{name:'Đá Lửa',icon:'lcstone_hoa'},da_nuoc:{name:'Đá Nước',icon:'lcstone_thuy'},da_sam:{name:'Đá Sấm',icon:'lcstone_loi'},da_la:{name:'Đá Lá',icon:'lcstone_moc'},
  da_bang:{name:'Đá Băng',icon:'lcstone_bang'},da_tien:{name:'Đá Tiên',icon:'lcstone_tien'},da_trang:{name:'Đá Trăng',icon:'lcstone_am'},da_tam:{name:'Đá Tâm Linh',icon:'lcstone_than'}});
SKILLS.linhcat={name:'Huấn luyện Lính Cát',key:'—',desc:'Học với Giáo sư Cát ở Trung tâm Lính Cát (thị trấn Đà Bắc): thu phục, huấn luyện Lính Cát'};
PLACES.linhcat={name:'Trung tâm Lính Cát',where:'thị trấn Đà Bắc, phía Đông chợ',door:{x:LINHCAT.door.x,y:LINHCAT.door.y},scene:'linhcat'};
INTERIORS.linhcat={name:'Trung tâm Lính Cát',W:24,H:16,spawn:{x:12,y:14.2},exit:'linhcat'};
NPCS.push({id:'gs_cat',scene:'linhcat',x:5.4,y:6.4,place:'lcgs'},{id:'yta_cat',scene:'linhcat',x:12,y:3.6,place:'lcyta'});
Object.assign(NPC_LOOKS,{gs_cat:{name:'Giáo sư Cát',look:{gender:'nam',hair:'swept',hairColor:'c8c0b0',skin:'f0c4a0',outfit:{top:'ao_bep_haky',bottom:'kaki',shoes:'giay_den',eyes:'kinh_can'},opts:{beard:'mustache',mouth:'smile'}}},
  yta_cat:{name:'Chị Y tá Cát',look:{gender:'nu',hair:'bun',hairColor:'e86a9a',skin:'f3c8ae',outfit:{top:'ao_bep_haky',bottom:'kaki',shoes:'giay_trang'},opts:{mouth:'smile'}}}});
// 15 bộ trang phục Halloween (vẽ trong hw.js): mùa lễ hội mỗi người được chọn miễn phí 1 bộ (bảng hiện ra lúc vào game), mặc như áo (đè cả quần, giày)
const HW_SETS=[['hw_witch','Phù thuỷ',{top:'long',bottom:'skirt'},{top:'5b2a86',pants:'3a1a5a',shoes:'1c1820'}],
  ['hw_vampire','Ma cà rồng',{top:'suit'},{top:'1c1820',shirt:'f2f0ea',tie:'c8282a',pants:'1c1820',shoes:'1c1820',hair:'16121a',skin:'e8e0ee'}],
  ['hw_ghost','Bóng ma',{top:'long'},{}],['hw_frank','Frankenstein',{top:'jacket',hair:'buzz'},{skin:'8fc77a',hair:'1c1820',top:'3a3a44',inner:'2a2a30',pants:'2a2a30',shoes:'1c1820'}],
  ['hw_mummy','Xác ướp',{top:'long'},{}],['hw_skel','Bộ xương',{top:'long',hair:'bald'},{skin:'eeeae0',top:'1c1820',pants:'1c1820',shoes:'1c1820'}],
  ['hw_cat','Cô mèo đen',{top:'long'},{top:'1c1820',pants:'1c1820',shoes:'1c1820'}],['hw_pirate','Cướp biển',{top:'tee'},{top:'f4f2ec',pants:'2a2030',shoes:'3a2418'}],
  ['hw_nurse','Y tá',{top:'long',bottom:'skirt'},{top:'f4f2ec',pants:'f4f2ec',shoes:'f4f2ec'}],['hw_wolf','Người sói',{top:'tee',hair:'shag'},{skin:'9a7454',hair:'5a4030',top:'a8322e',pants:'4a6a9a',shoes:'5a4030'}],
  ['hw_fairy','Tiên nữ',{top:'tee',bottom:'skirt'},{top:'ffb8e0',pants:'ffb8e0',shoes:'f4f2ec'}],['hw_devil','Ác quỷ',{top:'long'},{top:'c8282a',pants:'8a1a1a',shoes:'1c1820'}],
  ['hw_pumpkin','Bí ngô',{top:'long'},{top:'3a7a3a',pants:'2a4a2a',shoes:'1c2a1c'}],['hw_zombie','Thây ma',{top:'tee'},{skin:'9ab890',hair:'3a4a30',top:'5a7a9a',pants:'6a5040',shoes:'3a3030'}],
  ['hw_cowboy','Cao bồi',{top:'tee'},{top:'c84a3a',pants:'4a6a9a',shoes:'6a4228'}]];
for(const [id,name,opts,colors] of HW_SETS) CLOTHES[id]={name:'Đồ Halloween: '+name,slot:'top',price:0,hidden:true,hw:true,set:id,opts,colors};
/* ---------- Lavi Studio (TP.HCM): studio thiết kế của Linh Manh + 2 bé cún Gấu (Malamute) và Luna (Golden) ----------
   Linh Manh giao việc typography, layout, vibe code: làm ở đúng chỗ trong studio, có câu đố kiến thức (đúng ≥2/3 mới qua).
   2 bé cún giấu nhiệm vụ bí mật: vuốt ve Gấu đủ 3 lần trong ngày, lục kệ sách mẫu chữ, ban đêm ngồi cạnh bát ăn. */
const LAVI={W:32,H:22,spawn:{x:16,y:20},desks:[[11,9.6],[15,9.6],[19,9.6]],muc:{x:9.4,y:16},bo:{x:23.6,y:15.6},night:[22,4],
  spots:{type:{x:7.6,y:4.8,label:'Tường chữ: bảng kerning'},grid:{x:15.6,y:4.8,label:'Bảng lưới layout 12 cột'},specimen:{x:24,y:4.8,label:'Kệ sách mẫu chữ'},
    vibe:{x:26.4,y:11.4,label:'Góc vibe code'},screen:{x:4.6,y:11.4,label:'Màn chiếu thuyết trình'},bowl:{x:12.6,y:17.6,label:'Bát ăn của 2 bé cún'},sofa:{x:20,y:18,label:'Khe ghế sofa'}},
  tasks:{lv_kern:{at:'type',dur:10,label:'Căn kerning chữ LAVI',quiz:'typo'},lv_grid:{at:'grid',dur:12,label:'Dựng lưới 12 cột',quiz:'layout'},lv_vibe:{at:'vibe',dur:12,label:'Vibe code landing page'},
    lv_launch:{at:'screen',dur:15,label:'Thuyết trình ra mắt website Lavi'},sq_bua_khuya:{at:'bowl',dur:10,label:'Đổ hạt cho 2 bé ăn khuya',night:true}},
  secrets:{sofa:{q:'sq_xuong',item:'xuong_muc'},specimen:{q:'sq_no_bo',item:'no_bo'},bowl:{q:'sq_bua_khuya',how:'night'}},
  vibeSteps:['Viết prompt cho AI dựng khung landing page','Sửa lỗi nút bấm bị lệch trên điện thoại','Deploy lên mạng, chạy ngon lành'],
  quiz:{typo:[{q:'Kerning là chỉnh cái gì?',a:['Khoảng cách giữa từng cặp chữ','Độ đậm của chữ','Khoảng cách giữa các dòng'],ok:0},
      {q:'Đoạn văn dài trên web nên dùng line-height khoảng bao nhiêu?',a:['1.0','1.4 đến 1.6','2.5'],ok:1},
      {q:'Font serif khác sans-serif ở đâu?',a:['Serif có chân ở đầu nét chữ','Serif luôn in nghiêng','Sans-serif chỉ có chữ hoa'],ok:0},
      {q:'Một trang nên dùng tối đa mấy họ font?',a:['1 đến 2 họ font','5 họ font','Càng nhiều càng đẹp'],ok:0},
      {q:'Chữ quá dài 1 dòng (hơn 90 ký tự) thì sao?',a:['Mắt khó dò dòng, nên giữ 50 đến 75 ký tự','Càng dài càng dễ đọc','Không ảnh hưởng gì'],ok:0}],
    layout:[{q:'Lưới 12 cột phổ biến vì sao?',a:['Chia được 2, 3, 4, 6 cột linh hoạt','Vì 12 là số may mắn','Vì màn hình rộng 12 inch'],ok:0},
      {q:'Khoảng trắng (whitespace) để làm gì?',a:['Cho nội dung thở, dễ nhìn hơn','Để tiết kiệm mực','Không để làm gì, nên lấp đầy'],ok:0},
      {q:'Muốn làm nổi tiêu đề nhất trang thì?',a:['To, đậm, nhiều khoảng trắng quanh','Cùng cỡ với chữ thường','Viết bằng màu trùng nền'],ok:0},
      {q:'Gutter trong lưới layout là gì?',a:['Khe hở giữa các cột','Lề trên cùng','Tên một loại font'],ok:0},
      {q:'Căn chỉnh (alignment) đều tay giúp gì?',a:['Bố cục gọn, có trật tự','Làm chậm trang web','Không giúp gì'],ok:0}]},
  lines:{be_muc:['Gâu! (Gấu vẫy đuôi, áo sơ mi caro hơi xộc xệch)','Gâu gâu! (Gấu đánh hơi quanh ghế sofa)','Ư ử... (Gấu nhìn về phía sofa như muốn nói gì đó)'],
    be_bo:['Gâu~ (Luna xoay một vòng khoe váy)','(Luna dụi đầu vào tay bạn, chiếc nơ trên đầu đâu mất rồi?)','Gâu! (Luna chạy ra phía kệ sách rồi quay lại nhìn bạn)']}};
Object.assign(QUESTS,{
  lv_kern:{giver:'linhmanh',title:'Kerning chữ LAVI',desc:'Ra tường chữ căn kerning cho logo LAVI (10 giây), rồi trả lời 3 câu typography của Linh Manh.',prog:1,reward:{exp:240,vnd:300000}},
  lv_grid:{giver:'linhmanh',after:'lv_kern',title:'Lưới layout 12 cột',desc:'Ra bảng lưới dựng layout 12 cột cho landing page (12 giây), trả lời 3 câu về layout.',prog:1,reward:{exp:280,vnd:350000}},
  lv_vibe:{giver:'linhmanh',after:'lv_grid',title:'Vibe code landing page',desc:'Ra góc vibe code làm 3 bước: viết prompt cho AI, sửa lỗi giao diện điện thoại, deploy (mỗi bước 12 giây).',prog:3,reward:{exp:360,vnd:450000}},
  lv_launch:{giver:'linhmanh',after:'lv_vibe',title:'Ra mắt website Lavi',desc:'Thuyết trình website mới trên màn chiếu cho cả studio (15 giây).',prog:1,reward:{exp:500,vnd:800000}},
  sq_xuong:{giver:'be_muc',secret:true,title:'🔍 Khúc xương bí mật của Gấu',desc:'Tìm thấy khúc xương Gấu giấu trong khe ghế sofa. Mang trả Gấu.',need:{xuong_muc:1},reward:{exp:220,vnd:250000}},
  sq_no_bo:{giver:'be_bo',secret:true,title:'🔍 Chiếc nơ của Luna',desc:'Chiếc nơ trắng của Luna rơi sau kệ sách mẫu chữ. Mang trả Luna.',need:{no_bo:1},reward:{exp:220,vnd:250000}},
  sq_bua_khuya:{giver:'linhmanh',secret:true,title:'🔍 Bữa khuya của 2 bé',desc:'Nửa đêm 2 bé cún ngồi chầu bát ăn. Đổ hạt cho 2 bé (10 giây, chỉ ban đêm) rồi báo Linh Manh.',prog:1,reward:{exp:300,vnd:350000}},
  sq_dao:{giver:'be_bo',secret:true,title:'🔍 Đi dạo với Gấu và Luna',desc:'Vuốt ve Gấu đủ 3 lần, 2 bé đòi đi dạo! Dắt 2 bé ra cửa studio đứng hóng gió 15 giây rồi về báo Luna.',prog:1,reward:{exp:280,vnd:300000}}});
LAVI.spots.door={x:16,y:20.4,label:'Cửa studio'}; LAVI.tasks.sq_dao={at:'door',dur:15,label:'Dắt 2 bé đi dạo hóng gió'}; LAVI.talkSecret={be_muc:'sq_dao'};
NPCS.push({id:'linhmanh',scene:'lavi',x:19.6,y:13,place:'linhmanh'},{id:'lv_mem',scene:'lavi',x:13,y:13.2,place:'lvmem'},
  {id:'be_muc',scene:'lavi',x:LAVI.muc.x,y:LAVI.muc.y,place:'lvdog',obj:true},{id:'be_bo',scene:'lavi',x:LAVI.bo.x,y:LAVI.bo.y,place:'lvdog',obj:true});
Object.assign(CLOTHES,{blazer_lm:{name:'Blazer xanh navy oversize + polo đen',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'1e2a4a',inner:'1c1820'}},
  quan_lm:{name:'Quần âu xếp ly xanh navy',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'1e2a4a',buckle:'1c1820'}}});
Object.assign(NPC_LOOKS,{linhmanh:{name:'Linh Manh (Lavi Studio)',look:{gender:'nam',hair:'messy',hairColor:'1c1820',skin:'f0c4a0',outfit:{top:'blazer_lm',bottom:'quan_lm',shoes:'giay_den'},opts:{mouth:'smile'}}},
  lv_mem:{name:'Designer Lavi',look:{gender:'nu',hair:'long',hairColor:'5a3a2a',skin:'f3c8ae',outfit:{top:'ao_rf_trang',bottom:'kaki',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  be_muc:{name:'Gấu (Alaskan)',look:null},be_bo:{name:'Luna (Golden)',look:null}});
ITEMS.xuong_muc={name:'Khúc xương của Gấu',icon:'bone'}; ITEMS.no_bo={name:'Nơ trắng của Luna',icon:'bow'};
/* ---------- Dương Vũ: đi khắp các map quảng cáo Zen Design System, giao nhiệm vụ ẩn ----------
   Mỗi `period` chuyển sang 1 map trong `stops` (máy khách và server tính giống nhau). Gặp lần đầu lộ ra nhiệm vụ ẩn: đuổi theo anh ở 3 map,
   nhặt 5 Zen Token giấu ở 5 studio; gặp ở 2 map thì có bài kiểm tra Zen; qua bài kiểm tra thì có việc áp dụng Zen vào file thật ở bàn studio. */
const DUONGVU={period:8*60e3,stops:[['retreat',43.5,95.6],['lumen',21.5,31.4],['das',17.5,15.4],['bearplus',19.5,17.8],['vnpt',20.5,19.8],['nghienmotion',19.5,19.6],['lavi',18.5,17.8],['yenlang',15,14.4],['mieu',22.5,27.4],['dalat',42.5,65]],
  lines:['Zen Design System: 1 bộ token, mọi sản phẩm đồng bộ!','Button, Input, Card... đủ 60 component, kéo thả trên Figma là xong!','Đổi màu thương hiệu? Sửa 1 token là cả hệ thống đổi theo!','Dark mode có sẵn, khỏi vẽ lại từng màn hình!','Thiết kế nhanh gấp 3 với Zen Design System. Lại đây mình chỉ cho!'],
  tokens:[['lumen',17,31.6],['das',12.5,15.6],['bearplus',14.5,17.8],['lavi',13.5,17.6],['nghienmotion',14.5,19.6]],
  quiz:[{q:'Design token là gì?',a:['Biến lưu màu, cỡ chữ, khoảng cách dùng chung','Một loại tiền ảo','Tên file Figma'],ok:0},
    {q:'Component có variant để làm gì?',a:['Gộp các trạng thái (thường, hover, tắt) vào 1 component','Để file nặng hơn','Để đổi tên layer'],ok:0},
    {q:'Đổi màu chủ đạo cho cả sản phẩm nhanh nhất là?',a:['Sửa token màu primary 1 lần','Tô lại từng nút bằng tay','Vẽ lại từ đầu'],ok:0},
    {q:'Khoảng cách (spacing) nên theo bước nào cho đều?',a:['Bội số của 4 hoặc 8 (4, 8, 16, 24...)','Số ngẫu nhiên','Càng lẻ càng đẹp'],ok:0}],
  figma:['lumen','lavi','bearplus'],figmaDur:15};
function dvWhere(ms=Date.now()){ const D=DUONGVU, i=Math.floor(ms/D.period)%D.stops.length, [scene,x,y]=D.stops[i], ph=ms/1000*.35;
  return {scene,x:x+Math.sin(ph)*1.2,y,bx:x,by:y,next:D.stops[(i+1)%D.stops.length][0],left:D.period-ms%D.period}; }
Object.assign(QUESTS,{
  dv_follow:{giver:'duongvu',secret:true,title:'🔍 Đuổi theo Dương Vũ',desc:'Dương Vũ đi khắp nơi quảng cáo Zen Design System. Gặp anh ở 3 map khác nhau (Ké, Lumen, DAS, Bearplus, VNPT, Nghiện Motion, Lavi, Yên Lãng, Miếu, Đà Lạt).',prog:3,reward:{exp:300,vnd:400000}},
  dv_token:{giver:'duongvu',secret:true,title:'🔍 5 Zen Token thất lạc',desc:'Dương Vũ đánh rơi 5 Zen Token ở 5 studio: Lumen, DAS, Bearplus, Lavi, Nghiện Motion. Nhặt đủ rồi trả anh.',need:{zen_token:5},reward:{exp:400,vnd:600000}},
  dv_quiz:{giver:'duongvu',secret:true,title:'🔍 Bài kiểm tra Zen',desc:'Trả lời 4 câu về design system của Dương Vũ, đúng từ 3 câu là qua.',prog:1,reward:{exp:300,vnd:350000}},
  dv_figma:{giver:'duongvu',secret:true,title:'🔍 Áp dụng Zen vào file thật',desc:'Ngồi 1 bàn thiết kế ở Lumen, Lavi hoặc Bearplus, áp dụng Zen Design System vào file Figma của khách (15 giây).',prog:1,reward:{exp:450,vnd:700000}}});
Object.assign(CLOTHES,{ao_zen:{name:'Áo thun Zen Design System',slot:'top',price:0,hidden:true,opts:{top:'tee',print:true},colors:{top:'f4f2ec',print:'2a2436',line:'7a9a6a'}}});
NPC_LOOKS.duongvu={name:'Dương Vũ (Zen Design System)',look:{gender:'nam',hair:'fringe',hairColor:'1c1820',skin:'f0c4a0',outfit:{top:'ao_zen',bottom:'kaki',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}};
ITEMS.zen_token={name:'Zen Token',icon:'zentoken'};
/* ---------- MU Online · Lục Địa Cát: thế giới game MU trong Chan City ----------
   Gặp Vệ binh chọn 1 trong 3 class, được tặng free 1 bộ giáp + vũ khí (mặc như trang phục). Đánh nhau theo thời gian thực: phím 1 / 2 / 3 dùng chiêu
   (tốn mana, có hồi chiêu; mọi class đều đánh gần: phải áp sát mục tiêu 2–3 ô). Thách đấu 1 vs 1 với người chơi khác; cứ 20 phút boss Luffy Gear 5 xuất hiện ở đền phía Bắc,
   cả server cùng đánh, ai gây sát thương đều có thưởng (EXP, tiền, ngọc). Gục thì 8 giây sau hồi sinh ở cổng thành. Máu / mana / cấp MU riêng. */
const MU={W:96,H:72,town:30,spawn:{x:22,y:27.4},altar:{x:22,y:6.6},arena:{x0:12,y0:2,x1:32,y1:12},fountain:{x:22,y:16},
  cls:{dk:{name:'Chiến Binh Bóng Tối',en:'Dark Knight',hp:160,mp:40,atk:20,def:12,col:'#c8302a',set:'mu_dk',desc:'Giáp đỏ, kiếm lớn, cận chiến. Máu trâu, giáp dày, chém xoáy cực mạnh.'},
    elf:{name:'Tiên Nữ',en:'Fairy Elf',hp:115,mp:90,atk:15,def:8,col:'#f2c43d',set:'mu_elf',desc:'Áo trắng viền vàng, song kiếm tiên, cận chiến nhanh nhẹn. Hồi máu cho cả đội, rất được việc khi đánh boss.'},
    dw:{name:'Phù Thuỷ Bóng Tối',en:'Dark Wizard',hp:95,mp:130,atk:25,def:6,col:'#3a6ad8',set:'mu_dw',desc:'Giáp xanh, gậy phép, chưởng lửa chưởng sét áp sát. Máu giấy nhưng sát thương phép to nhất.'}},
  skills:{dk:[{k:'chem',name:'Chém',mp:0,cd:.8,mul:1,range:2.4},{k:'xoay',name:'Chém Xoáy',mp:12,cd:5,mul:2.1,range:2.8},{k:'gong',name:'Gồng Giáp',mp:20,cd:18,buff:'def',dur:8,heal:.15}],
    elf:[{k:'dam',name:'Đâm Kiếm Tiên',mp:0,cd:.8,mul:.95,range:2.4},{k:'tamlien',name:'Tam Liên Trảm',mp:10,cd:4,mul:1.9,range:2.6},{k:'hoi',name:'Hồi Máu',mp:25,cd:12,heal:.35,team:6}],
    dw:[{k:'hoachuong',name:'Hoả Chưởng',mp:4,cd:1.2,mul:1.25,range:2.4},{k:'loichuong',name:'Lôi Chưởng',mp:14,cd:5,mul:2.4,range:2.6},{k:'thienthach',name:'Mưa Thiên Thạch',mp:30,cd:14,mul:3.6,range:3}]},
  // boss tổng Luffy Gear 5 + boss phụ Naruto Cửu Vĩ (rừng Làng Lá phía Đông). Đòn của boss: single (đánh 1 người), circle (vùng tròn ở chỗ 1 người), multi (n vùng cùng lúc),
  // cone (hình nón trước mặt, nhiều nhát), jump (nhảy tới chỗ 1 người, đáp xuống gây sát thương), ring (sóng quanh boss). area: khu của boss,
  // boss chỉ nhắm người đứng trong khu và nhảy cũng không ra khỏi khu (không sang khu boss khác). Mọi đòn có cảnh báo (warn giây), né được:
  // tới lúc nổ mà đã ra khỏi vùng thì không mất máu. phase: chỉ dùng khi máu boss xuống dưới mốc (2: <60%, 3: <30%); giai đoạn 3 boss nổi giận (đánh mạnh + nhanh hơn).
  bosses:{
    luffy:{name:'Luffy Gear 5',sprite:'luffy',every:20*60e3,offset:0,life:10*60e3,hp:3500,perPlayer:2200,def:12,home:{x:22,y:6.6},area:{x0:4,x1:40,y0:3,y1:27},big:1,
      attacks:[{k:'pistol',kind:'single',name:'Gomu Gomu Pistol',every:3.2,warn:.7,range:7,r:1.4,dmg:24},{k:'gatling',kind:'cone',name:'Gomu Gomu Gatling',every:9,warn:1,hits:5,tick:.25,range:6,cone:.55,dmg:9,phase:2},
        {k:'gigant',kind:'circle',name:'Gomu Gomu Gigant',every:11,warn:1.8,r:3,dmg:58},{k:'rocket',kind:'jump',name:'Gomu Gomu Rocket',every:19,warn:1.3,r:2.2,dmg:36},
        {k:'drum',kind:'ring',name:'Trống Giải Phóng',every:15,warn:1.6,r:7.5,dmg:34,phase:3}],
      phases:[.6,.3],enrage:{mul:1.5,speed:1.35},drops:'luffy'},
    naruto:{name:'Naruto Cửu Vĩ',sprite:'naruto',every:10*60e3,offset:5*60e3,life:7*60e3,hp:1800,perPlayer:1000,def:8,home:{x:57,y:8},area:{x0:45,x1:69,y0:3,y1:14},
      attacks:[{k:'shuriken',kind:'single',name:'Phi Tiêu Gió',every:2.6,warn:.6,range:8,r:1.2,dmg:16},{k:'rasengan',kind:'jump',name:'Rasengan',every:8,warn:1.1,r:1.8,dmg:34},
        {k:'bunshin',kind:'multi',name:'Ảnh Phân Thân Chi Thuật',every:12,warn:1.4,n:3,r:1.8,dmg:22,phase:2},{k:'roar',kind:'ring',name:'Cửu Vĩ Gầm',every:14,warn:1.5,r:6,dmg:28,phase:3}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},drops:'naruto'},
    cuamay:{name:'Quỷ Cưa',sprite:'cuamay',every:12*60e3,offset:3*60e3,life:7*60e3,hp:1700,perPlayer:950,def:9,home:{x:84,y:23},area:{x0:72,x1:94,y0:17,y1:27},
      attacks:[{k:'cua',kind:'single',name:'Cưa Xé',every:2.4,warn:.6,range:5,r:1.4,dmg:18},{k:'lao',kind:'jump',name:'Lao Cưa',every:8,warn:1,r:2,dmg:32},
        {k:'xoaycua',kind:'ring',name:'Bão Cưa Xoay',every:12,warn:1.4,r:4.5,dmg:30,phase:2},{k:'manh',kind:'multi',name:'Mưa Mảnh Kim Loại',every:11,warn:1.5,n:4,r:1.6,dmg:20,phase:3}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},drops:'cuamay'},
    duongvu_ma:{name:'Dươngg Vũ',sprite:'gengar',every:15*60e3,offset:8*60e3,life:7*60e3,hp:1900,perPlayer:1050,def:8,home:{x:84,y:8},area:{x0:72,x1:94,y0:3,y1:14},
      attacks:[{k:'bongden',kind:'single',name:'Cầu Bóng Đêm',every:2.8,warn:.7,range:8,r:1.4,dmg:18},{k:'xuyen',kind:'jump',name:'Xuyên Tường',every:9,warn:1.2,r:2,dmg:30},
        {k:'thoimien',kind:'multi',name:'Thôi Miên',every:11,warn:1.5,n:3,r:1.8,dmg:22,phase:2},{k:'nguyenrua',kind:'ring',name:'Lời Nguyền Zen',every:14,warn:1.6,r:6,dmg:30,phase:3}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},drops:'duongvu_ma'},
    rongxanh:{name:'Rồng Dải Xanh',sprite:'rong',every:18*60e3,offset:11*60e3,life:7*60e3,hp:2300,perPlayer:1200,def:10,home:{x:57,y:23},area:{x0:45,x1:69,y0:17,y1:27},big:1,
      attacks:[{k:'longkich',kind:'single',name:'Long Kích',every:3,warn:.8,range:8,r:1.5,dmg:20},{k:'hoithorong',kind:'cone',name:'Hơi Thở Rồng',every:9,warn:1.1,hits:5,tick:.25,range:7,cone:.5,dmg:9},
        {k:'bonhao',kind:'jump',name:'Bổ Nhào',every:12,warn:1.3,r:2.4,dmg:34},{k:'loc',kind:'ring',name:'Lốc Xoáy Thiên Không',every:14,warn:1.6,r:6.5,dmg:30,phase:2},
        {k:'thienthachrong',kind:'multi',name:'Thiên Thạch Rồng',every:12,warn:1.6,n:4,r:1.8,dmg:24,phase:3}],
      phases:[.6,.3],enrage:{mul:1.45,speed:1.3},drops:'rongxanh'}},
  // phần thưởng boss phụ: ai góp sức đều có EXP + tiền, có tỉ lệ rơi trang phục / vũ khí riêng của boss, lần đầu hạ được thì lộ nhiệm vụ ẩn
  reward:{luffy:{exp:150,vnd:200000,mu:120,jewel:.35,fruitPer:10},naruto:{exp:100,vnd:120000,mu:80,costume:'mu_naruto',weapon:'vk_kunai',chance:.25,secret:'mu_cuontruc'},
    cuamay:{exp:100,vnd:120000,mu:80,costume:'mu_cuamay',weapon:'vk_cua',chance:.25,secret:'mu_banhmut'},duongvu_ma:{exp:110,vnd:130000,mu:85,costume:'mu_bongma',weapon:'vk_luoihai',chance:.25,secret:'mu_lua_ma'},
    rongxanh:{exp:130,vnd:160000,mu:100,costume:'mu_rongxanh',weapon:'vk_vayrong',chance:.22,secret:'mu_vayrong'}},jewels:['ngoc_uoc','ngoc_tam_linh','ngoc_hon_nguyen'],
  // bố cục: quảng trường (x 2–41) · rừng Làng Lá (x 44–69: Bắc Naruto, Nam Đầm Rồng) · phía Đông (x 72–95: Bắc nghĩa địa, Nam bãi phế liệu); cổng ở hàng gateN / gateS, tường ngang y 15–16 có lối giữa
  zones:{gateN:{y0:6,y1:9},gateS:{y0:21,y1:25},split:15,gapF:[55,58],gapE:[82,85],lake:{x:57,y:23,rx:8,ry:4}},
  // đồ nhiệm vụ ẩn giấu trong từng khu: cuộn trục (rừng Làng Lá), bánh mì phết mứt (bãi phế liệu), đốm lửa ma (nghĩa địa, chỉ hiện ban đêm)
  hidden:{vay_rong:[[47.5,19.5],[67.5,19.5],[48.5,27.5],[66.5,27.5]],cuon_truc:[[48.5,4.5],[66.5,11.5],[52.5,12.5]],banh_mut:[[75.5,19.5],[92.5,20.5],[78.5,27.5],[90.5,27.5],[86.5,19.5]],lua_ma:[[76.5,4.5],[92.5,5.5],[80.5,13.5]]},
  weapons:{vk_kunai:{name:'Kunai Phi Lôi Thần',atk:.12,desc:'Rơi từ Naruto: công MU +12%'},vk_cua:{name:'Cưa Máy Quỷ',atk:.15,desc:'Rơi từ Quỷ Cưa: công MU +15%'},vk_luoihai:{name:'Lưỡi Hái Bóng Đêm',atk:.14,desc:'Rơi từ Dươngg Vũ: công MU +14%'},vk_vayrong:{name:'Thương Vảy Rồng',atk:.16,desc:'Rơi từ Rồng Dải Xanh: công MU +16%'}},
  // Trái Ác Quỷ: hạ Luffy rơi ra (số trái = 1/10 số người góp sức, tối thiểu 1). Ăn vào được chiêu thứ 4 (phím 4) + chỉ số cộng thêm, mỗi người chỉ ăn được 1 trái
  fruits:{mera:{name:'Trái Lửa (Mera Mera)',col:'#ff6a2a',skill:{k:'hoaquyen',name:'Hoả Quyền',mp:18,cd:9,mul:3.2,range:3},bonus:{atk:.12},desc:'Hoá thân lửa: tung nắm đấm lửa khổng lồ. Công +12%'},
    hie:{name:'Trái Băng (Hie Hie)',col:'#7fd8f0',skill:{k:'kybanghao',name:'Kỷ Băng Hà',mp:18,cd:11,mul:2.6,range:3,slow:3},bonus:{def:.15},desc:'Đóng băng đất trời, làm boss ra đòn chậm lại 3 giây. Thủ +15%'},
    goro:{name:'Trái Sấm (Goro Goro)',col:'#ffd84a',skill:{k:'loithan',name:'Lôi Thần',mp:22,cd:12,mul:3.6,range:3},bonus:{atk:.08,mp:.15},desc:'Gọi sấm sét thần linh giáng xuống. Công +8%, mana +15%'},
    gomu:{name:'Trái Cao Su (Gomu Gomu)',col:'#c8402a',skill:{k:'gomupistol',name:'Gomu Gomu Pistol',mp:10,cd:5,mul:2.6,range:4},bonus:{hp:.2},desc:'Người cao su: tay dài ra đấm cực xa. Máu +20%'},
    yami:{name:'Trái Bóng Tối (Yami Yami)',col:'#5a2a8a',skill:{k:'hoden',name:'Hố Đen',mp:20,cd:12,mul:2.8,range:3,drain:.35},bonus:{hp:.08,atk:.06},desc:'Mở hố đen nuốt chửng kẻ địch, hút 35% sát thương thành máu. Máu +8%, công +6%'},
    chiyu:{name:'Trái Chữa Lành (Chiyu Chiyu)',col:'#5fe06a',skill:{k:'chualanh',name:'Chữa Lành Vạn Vật',mp:24,cd:14,heal:.5,team:8},bonus:{mp:.2},desc:'Hồi 50% máu cho mình và đồng đội quanh 8 ô. Mana +20%'}},
  respawn:8,regen:{hp:.02,mp:.04},duel:{range:14,exp:40,mu:60},lvExp:lv=>60+lv*40,maxLv:50};
// tương thích code cũ: MU.boss = boss tổng Luffy (đánh thường + chưởng vùng kiểu cũ)
MU.boss={...MU.bosses.luffy,hit:{every:2.5,dmg:20,range:5},aoe:{every:10,warn:1.8,r:3,dmg:55},reward:MU.reward.luffy,jewels:MU.jewels};
// Premium Store (Thương nhân Huyền Thoại ở quảng trường MU): set legacy mua 1 lần giữ mãi, mặc vào (áo) thì tăng chỉ số MU = lực chiến, mỗi set có hiệu ứng đòn riêng khi ra chiêu.
// Chỉ set đang mặc có tác dụng; cởi ra mặc lại giáp class ở Thương nhân. tier: 1–5 sao (giá + chỉ số tăng dần; đã giảm giá 60%)
MU.legacy={lg_shovel:{name:'Shovel Knight',tier:1,price:1200000,bonus:{def:.14,hp:.08},fx:'shovel',desc:'Giáp xanh sừng ngà, xẻng thép. Mỗi đòn hất tung đất đá, toé ngọc xanh'},
  lg_boxer:{name:'Quyền Vương',tier:1,price:1200000,bonus:{atk:.12,hp:.04},fx:'pow',desc:'Găng đỏ, quần đùi đỏ. Đấm trúng là nổ chữ POW!'},
  lg_yoshi:{name:'Yoshi',tier:1,price:1400000,bonus:{hp:.15,mp:.06},fx:'egg',desc:'Bộ khủng long xanh mõm trắng. Ném trứng đốm xanh nổ ra sao'},
  lg_aang:{name:'Aang Tiết Khí Sư',tier:2,price:2000000,bonus:{mp:.15,atk:.08,def:.05},fx:'air',desc:'Áo cam vàng, gậy lượn. Mỗi đòn cuốn lốc khí xoáy'},
  lg_chainsaw:{name:'Chainsaw Man',tier:2,price:2400000,bonus:{atk:.16},fx:'chainsaw',desc:'Đầu cưa máy, 2 tay mọc cưa. Đòn cưa toé lửa, toé máu'},
  lg_sparta:{name:'Sparta Sư Tử',tier:2,price:2400000,bonus:{atk:.1,def:.1},fx:'lion',desc:'Mũ chùm lông đỏ, găng đầu sư tử vàng. Đòn ra kèm sóng gầm vàng'},
  lg_anubis:{name:'Nasus Thần Cát',tier:3,price:3200000,bonus:{hp:.12,atk:.1},fx:'sand',desc:'Đầu chó rừng khăn vàng, quyền trượng. Đòn cuốn bão cát, chữ thần vàng bay lên'},
  lg_samurai:{name:'Samurai Quỷ Đỏ',tier:3,price:3200000,bonus:{atk:.18,def:.04},fx:'oni',desc:'Mặt nạ quỷ, giáp lá đỏ đen, katana. Chém ra vầng trăng đỏ'},
  lg_piccolo:{name:'Piccolo',tier:3,price:3600000,bonus:{hp:.1,mp:.1,atk:.08},fx:'beam',desc:'Áo choàng trắng vai độn, khăn turban. Đòn bắn tia xoáy Makankosappo'},
  lg_megax:{name:'Mega Man X',tier:3,price:3600000,bonus:{def:.12,atk:.1},fx:'buster',desc:'Giáp xanh, súng tay X-Buster. Tích lực rồi bắn cầu plasma'},
  lg_zero:{name:'Zero Kiếm Đỏ',tier:4,price:4800000,bonus:{atk:.2,def:.06},fx:'zsaber',desc:'Giáp đỏ, tóc vàng dài, Z-Saber. Chém vầng trăng xanh lá'},
  lg_king:{name:'King Knight',tier:4,price:4800000,bonus:{hp:.15,def:.12,atk:.04},fx:'king',desc:'Giáp vàng vương miện, áo choàng lông. Đòn tung mưa vàng, vương miện loé sáng'},
  lg_vader:{name:'Darth Vader',tier:5,price:8000000,bonus:{atk:.18,def:.12,hp:.08},fx:'force',desc:'Mũ giáp đen, kiếm ánh sáng đỏ. Đòn kèm sóng Thần Lực bóp nghẹt'},
  lg_16typh:{name:'16Typh',tier:4,price:5000000,bonus:{atk:.14,mp:.1},fx:'note',desc:'Tóc bạch kim xanh, blazer đen, sơ mi hoạ tiết, chuỗi ngọc trai. Chiêu 5 gọi Min ra hát đánh cùng 12 giây'},
  lg_ranbien:{name:'Rắn Biển',tier:4,price:10000000,bonus:{atk:.12,hp:.1},fx:'snake',desc:'Đồ bơi thể thao, hình xăm rắn quấn cánh tay. Đòn ra có rắn độc lao tới cắn, chiêu 5 hút máu'},
  lg_kth:{name:'Khúc Thị Hương',tier:4,price:10000000,bonus:{atk:.12,mp:.1,hp:.04},fx:'selfie',desc:'Tóc đen dài, bikini đen, hình xăm 2 tay, khuyên rốn, tay cầm điện thoại. Đòn ra có tim hồng, chiêu 5 Selfie Chói Loá làm boss choáng'},
  lg_zeus:{name:'Zeus Thần Sấm',tier:5,price:8000000,bonus:{atk:.2,mp:.12,hp:.06},fx:'zeus',desc:'Râu tóc bạc, áo choàng thần. Mỗi đòn gọi sét vàng giáng xuống'}};
// chiêu riêng của set legacy (phím 5, chỉ khi đang mặc set đó): hiệu ứng theo kiểu ra đòn của set, đánh 3 nhịp
const LG_SKILL={shovel:['Xẻng Bổ Đất',3,{}],pow:['Liên Hoàn Quyền',3.2,{}],egg:['Mưa Trứng Yoshi',2.8,{heal:.1}],air:['Lốc Xoáy Khí Thần',2.6,{slow:2}],chainsaw:['Cưa Xé Toạc',3.4,{}],
  lion:['Sư Tử Gầm Vang',3,{}],sand:['Bão Cát Sa Mạc',3,{drain:.2}],oni:['Nhất Đao Quỷ Trảm',3.6,{}],beam:['Makankosappo',3.6,{range:4}],buster:['X-Buster Tích Lực',3.4,{range:4}],
  zsaber:['Z-Saber Liên Trảm',3.8,{}],note:['Gọi Min',2,{summon:12}],snake:['Rắn Độc Quấn',3.4,{drain:.15}],selfie:['Selfie Chói Loá',3.2,{slow:2.5}],king:['Vương Quyền Hoàng Kim',3,{heal:.15}],force:['Thần Lực Bóp Nghẹt',4,{slow:2}],zeus:['Thiên Lôi Zeus',4.2,{}]};
for(const L of Object.values(MU.legacy)){ const [name,mul,o]=LG_SKILL[L.fx]; L.skill={k:'lgs_'+L.fx,name,mp:16+L.tier*3,cd:o.summon?22:9+L.tier,mul,range:3,...o}; }
// Min: nhân vật được set 16Typh gọi ra đánh cùng (không bán, chỉ để vẽ)
CLOTHES.mu_min={name:'Đồ của Min',slot:'top',price:0,hidden:true,set:'mu_min',opts:{top:'long'},colors:{top:'e8d0a8',pants:'d8a040',shoes:'8a5a32'}};
for(const [k,L] of Object.entries(MU.legacy)) CLOTHES[k]={name:'Set Legacy · '+L.name,slot:'top',price:0,hidden:true,mu:true,legacy:true,set:k,opts:{top:'long'},colors:{top:'2a2a34',pants:'2a2a34',shoes:'1c1820'}};
// Thợ Kim Hoàn (shop phụ kiện MU): ngoài bộ trang phục chính còn 4 ô phụ kiện tăng lực chiến: cánh (sau lưng), dây chuyền, vật hộ thân (bay lơ lửng cạnh người),
// aura (vòng phép dưới chân kiểu Warcraft, mỗi aura tăng 1 thuộc tính). Mua 1 lần giữ mãi, mỗi ô đeo 1 món, ai cũng thấy phụ kiện của nhau. (đã giảm giá còn 1/3)
// bonus: hp / mp / atk / def (+%), regen (hồi máu mana nhanh thêm), crit (tỉ lệ chí mạng), drain (hút % sát thương thành máu)
MU.slots={wing:'Cánh',neck:'Dây chuyền',charm:'Vật hộ thân',aura:'Aura',feet:'Giày'};
MU.acc={w_angel:{slot:'wing',name:'Cánh Thiên Thần',price:1330000,bonus:{hp:.06,def:.04}},w_pinkbat:{slot:'wing',name:'Cánh Dơi Hồng',price:1330000,bonus:{mp:.08,atk:.02}},
  w_bat:{slot:'wing',name:'Cánh Dơi Huyết',price:1500000,bonus:{atk:.06,hp:.02}},w_fairy:{slot:'wing',name:'Cánh Tiên Hồng',price:1670000,bonus:{mp:.06,def:.04}},
  w_monarch:{slot:'wing',name:'Cánh Bướm Chúa',price:2000000,bonus:{atk:.05,mp:.05}},w_sky:{slot:'wing',name:'Cánh Thiên Thanh',price:2670000,bonus:{hp:.08,def:.06}},
  w_demon:{slot:'wing',name:'Cánh Quỷ Vương',price:3330000,bonus:{atk:.1,hp:.04}},
  n_bead:{slot:'neck',name:'Chuỗi Ngọc Tím',price:670000,bonus:{mp:.08}},n_ruby:{slot:'neck',name:'Mặt Hồng Ngọc',price:830000,bonus:{hp:.06}},
  n_amethyst:{slot:'neck',name:'Mặt Thạch Anh',price:1000000,bonus:{mp:.06,def:.03}},n_gold:{slot:'neck',name:'Dây Chuyền Vàng Hiphop',price:1330000,bonus:{atk:.06}},
  n_pharaoh:{slot:'neck',name:'Kiềng Vàng Pharaoh',price:1670000,bonus:{def:.06,hp:.04}},n_star:{slot:'neck',name:'Chuỗi Sao Hoàng Gia',price:2000000,bonus:{atk:.05,mp:.05,hp:.03}},
  c_fire:{slot:'charm',name:'Thiên Thạch Lửa',price:1000000,bonus:{atk:.05}},c_comet:{slot:'charm',name:'Sao Chổi Băng',price:1000000,bonus:{def:.05}},
  c_bolt:{slot:'charm',name:'Tia Sét Vàng',price:1000000,bonus:{mp:.07}},c_cat:{slot:'charm',name:'Mèo Mây',price:1170000,bonus:{hp:.06}},
  c_pad:{slot:'charm',name:'Tay Cầm Game',price:1170000,bonus:{atk:.03,mp:.03}},c_tv:{slot:'charm',name:'Robot TV',price:1330000,bonus:{def:.04,mp:.03}},
  c_code:{slot:'charm',name:'Bạch Tuộc Code',price:1330000,bonus:{mp:.05,atk:.02}},c_eye:{slot:'charm',name:'Mắt Bí Ẩn',price:1670000,bonus:{atk:.04,def:.03}},
  c_walle:{slot:'charm',name:'Robot Wall-E',price:1670000,bonus:{hp:.05,def:.03}},c_sonic:{slot:'charm',name:'Nhím Xanh Tốc Độ',price:2000000,bonus:{atk:.06,hp:.02}},
  c_ghost:{slot:'charm',name:'Bóng Ma Hồng',price:2000000,bonus:{atk:.05,mp:.04}},c_tank:{slot:'charm',name:'Khủng Long Lái Tăng',price:2330000,bonus:{def:.06,hp:.04}},
  c_crown:{slot:'charm',name:'Vương Miện Tím',price:2670000,bonus:{hp:.04,mp:.04,atk:.04}},
  a_devotion:{slot:'aura',name:'Hào quang Thủ Hộ',price:1670000,bonus:{def:.15},col:'#ffd84a'},a_endurance:{slot:'aura',name:'Hào quang Bền Bỉ',price:1670000,bonus:{hp:.15},col:'#5fe06a'},
  a_brilliance:{slot:'aura',name:'Hào quang Trí Tuệ',price:1670000,bonus:{mp:.25},col:'#5aa0ff'},a_command:{slot:'aura',name:'Hào quang Chiến Ý',price:2000000,bonus:{atk:.12},col:'#ff4a4a'},
  a_unholy:{slot:'aura',name:'Hào quang Hắc Ám',price:2330000,bonus:{regen:1},col:'#b070ff'},a_vampiric:{slot:'aura',name:'Hào quang Huyết Tộc',price:3000000,bonus:{drain:.08},col:'#e8203a'},
  a_crit:{slot:'aura',name:'Hào quang Sát Thủ',price:3000000,bonus:{crit:.08},col:'#ff9a2a'}};
// nội tại: mỗi lần lên cấp MU được 1 điểm nội tại, cộng vào để tăng chỉ số (mỗi nội tại tối đa max cấp)
MU.passive={cuongluc:{name:'Cường Lực',stat:'atk',per:.03,max:10,desc:'Công'},thietbi:{name:'Thiết Bì',stat:'def',per:.04,max:10,desc:'Thủ'},sinhluc:{name:'Sinh Lực',stat:'hp',per:.04,max:10,desc:'Máu'},
  linhluc:{name:'Linh Lực',stat:'mp',per:.05,max:10,desc:'Mana'},hoiphuc:{name:'Hồi Phục',stat:'regen',per:.2,max:5,desc:'Tốc độ hồi máu / mana'},chimang:{name:'Chí Mạng',stat:'crit',per:.02,max:5,desc:'Tỉ lệ chí mạng'},
  hutmau:{name:'Hút Máu',stat:'drain',per:.02,max:5,desc:'Hút sát thương thành máu'}};
const muStats=(cls,lv,fruit,wep,lg,ex)=>{ const c=MU.cls[cls], k=1+(lv-1)*.08, f=(fruit&&MU.fruits[fruit]&&MU.fruits[fruit].bonus)||{}, w=(wep&&MU.weapons[wep])||{}, L=(lg&&MU.legacy[lg]&&MU.legacy[lg].bonus)||{}, X=ex||{}, b={hp:(f.hp||0)+(L.hp||0)+(X.hp||0),mp:(f.mp||0)+(L.mp||0)+(X.mp||0),atk:(f.atk||0)+(L.atk||0)+(X.atk||0),def:(f.def||0)+(L.def||0)+(X.def||0)};
  return {hp:Math.round(c.hp*k*(1+b.hp)),mp:Math.round(c.mp*(1+(lv-1)*.05)*(1+b.mp)),atk:Math.round(c.atk*k*(1+b.atk)*(1+(w.atk||0))),def:Math.round(c.def*(1+(lv-1)*.06)*(1+b.def))}; };
// Ngọc cường hoá (Phù Thuỷ Cường Hoá ở MU): mọi món đồ MU (vũ khí, giáp class, set legacy, cánh, dây chuyền, hộ thân, aura) khắc được 12 lỗ cường hoá (+1 → +12).
// Mỗi lần khắc tốn 1 ngọc + phí; cấp càng cao tỉ lệ càng thấp (lỗ cuối 7%), thất bại mất ngọc. Lính Cát đầu đội cấp cao cộng tỉ lệ (lv × 0,2%, tối đa +15%);
// mỗi loài Lính Cát huyền thoại tặng 1 Ngọc Cường Hoá Huyền Thoại (80% thành công). Ngọc rơi từ boss MU, nhiệm vụ ẩn ở mọi map, vớt dưới hồ Ké khi chèo kayak; Phù Thuỷ cũng bán.
const ENH={max:12,rate:[1,.95,.9,.82,.72,.62,.5,.4,.3,.2,.12,.07],fee:lv=>50000*(lv+1),gemPrice:400000,lcPer:.002,lcMax:.15,legendRate:.8,
  per:{weapon:{atk:.025},set:{hp:.02,def:.02},wing:{hp:.015,def:.01},neck:{mp:.02,atk:.01},charm:{atk:.015},aura:{hp:.01,atk:.01},feet:{hp:.01,def:.01}}};
ITEMS.ngoc_ch={name:'Ngọc Cường Hoá',icon:'gem_enh'}; ITEMS.ngoc_ch_ht={name:'Ngọc Cường Hoá Huyền Thoại',icon:'gem_enh_ht'};
// loại đồ để tính chỉ số mỗi cấp cường hoá: weapon / set (giáp class, set legacy) / wing / neck / charm / aura
const enhKind=k=>MU.weapons[k]?'weapon':(MU.legacy[k]||Object.values(MU.cls).some(c=>c.set===k))?'set':MU.acc[k]?MU.acc[k].slot:null;
/* ---------- Rừng MU (phía Nam quảng trường, y 30–70): 9 khu xếp 3 × 3, mỗi khu 1 loài quái đi theo bầy nhỏ, càng xa quảng trường càng mạnh ----------
   Quái đi lang thang quanh ổ, người lại gần (aggro ô) thì lao vào đánh: vung đòn có báo trước, chạy ra khỏi tầm là né; đuổi xa ổ quá leash ô thì quay về hồi máu.
   Hạ quái: EXP, tiền, EXP MU chia theo phần sát thương; người đánh nhiều nhất được chiến lợi phẩm (bán cho Phù Thuỷ Cường Hoá) và có tỉ lệ rơi Ngọc Cường Hoá.
   Cổng xuống rừng: cổng Nam quảng trường, lối Nam Đầm Rồng, lối Nam Bãi Phế Liệu. Lính Cát hoang cũng sống trong rừng (LINHCAT.maps.mu). */
MU.forest={respawn:12,leash:8,aggro:3.6,windup:.45,mat:.4,gem:t=>.012+t*.004,gemHt:t=>t>=7?.0015:0,
  // tile: nền khu (1 rừng đêm · 2 đầm rêu · 3 đất đá · 4 đất cháy); kind: melee / ranged (bắn đạn, né được) / float (lơ lửng xuyên vật cản)
  mobs:{
    slime:{name:'Slime Bí Ngô',lv:3,spd:1.2,range:1.3,every:2.2,hpM:.9,atkM:.9,n:3,mat:'vo_bi_ngo',kind:'melee',zone:{name:'Đồi Bí Ngô',x0:2,x1:31,y0:31,y1:43,tile:'G'}},
    scorpion:{name:'Bọ Cạp Tím',lv:8,spd:2,range:1.4,every:1.8,hpM:.95,atkM:1,n:3,mat:'ngoi_bo_cap',kind:'melee',zone:{name:'Hang Bọ Cạp',x0:32,x1:63,y0:31,y1:43,tile:'S'}},
    mage:{name:'Pháp Sư Đen',lv:13,spd:1.3,range:5,every:2.6,hpM:.8,atkM:1.1,n:3,mat:'mu_phap_su',kind:'ranged',zone:{name:'Tháp Pháp Sư Đen',x0:64,x1:93,y0:31,y1:43,tile:'%'}},
    wolf:{name:'Người Sói',lv:18,spd:2.4,range:1.4,every:1.6,hpM:1,atkM:1,n:3,mat:'nanh_soi',kind:'melee',zone:{name:'Rừng Trăng Sói',x0:2,x1:31,y0:44,y1:56,tile:'1'}},
    wraith:{name:'Bóng Ma Hư Không',lv:23,spd:1.7,range:3.2,every:2.2,hpM:.85,atkM:1.05,n:3,mat:'tinh_chat_ma',kind:'float',zone:{name:'Đầm Sương Ma',x0:32,x1:63,y0:44,y1:56,tile:'2'}},
    ogre:{name:'Quỷ Khổng Lồ',lv:28,spd:1.1,range:1.8,every:2.8,hpM:1.6,atkM:1.25,n:2,mat:'rang_quy',kind:'melee',big:1,zone:{name:'Trại Quỷ Khổng Lồ',x0:64,x1:93,y0:44,y1:56,tile:'C'}},
    golem:{name:'Người Đá Cổ',lv:33,spd:.9,range:1.8,every:3,hpM:1.8,atkM:1.2,defM:1.5,n:2,mat:'loi_da',kind:'melee',big:1,zone:{name:'Mỏ Đá Cổ',x0:2,x1:31,y0:57,y1:69,tile:'3'}},
    wendigo:{name:'Linh Hồn Sọ Hươu',lv:38,spd:2,range:4,every:2.2,hpM:1,atkM:1.1,n:3,mat:'sung_huou',kind:'ranged',zone:{name:'Rừng Sọ Hươu',x0:32,x1:63,y0:57,y1:69,tile:'1'}},
    cerberus:{name:'Chó Ba Đầu',lv:44,spd:1.9,range:2,every:2,hpM:2,atkM:1.3,n:2,mat:'long_lua',kind:'melee',big:1,zone:{name:'Cổng Địa Ngục',x0:64,x1:93,y0:57,y1:69,tile:'4'}}}};
// chỉ số + phần thưởng theo cấp, 3 ổ mỗi khu (2 ổ phía trên, 1 ổ phía dưới), giá bán chiến lợi phẩm theo bậc
Object.entries(MU.forest.mobs).forEach(([k,m],i)=>{ const L=m.lv, z=m.zone; m.k=k; m.tier=i+1; m.hp=Math.round(90*(1+.13*(L-1))*m.hpM); m.atk=Math.round(13*(1+.09*(L-1))*m.atkM); m.def=Math.round((3+L*.7)*(m.defM||1));
  m.exp=Math.round(4+L*1.2); m.vnd=200+L*80; m.mu=Math.round(3+L*1.1); m.packs=[[z.x0+7.5,z.y0+4.5],[z.x1-6.5,z.y0+5.5],[(z.x0+z.x1+1)/2,z.y1-3]]; });
Object.assign(ITEMS,{vo_bi_ngo:{name:'Vỏ Bí Ngô Ma',icon:'mob_slime'},ngoi_bo_cap:{name:'Ngòi Bọ Cạp',icon:'mob_scorpion'},mu_phap_su:{name:'Mũ Pháp Sư Rách',icon:'mob_mage'},
  nanh_soi:{name:'Nanh Người Sói',icon:'mob_wolf'},tinh_chat_ma:{name:'Tinh Chất Bóng Ma',icon:'mob_wraith'},rang_quy:{name:'Răng Quỷ Khổng Lồ',icon:'mob_ogre'},
  loi_da:{name:'Lõi Đá Cổ',icon:'mob_golem'},sung_huou:{name:'Sừng Hươu Ma',icon:'mob_wendigo'},long_lua:{name:'Lông Lửa Địa Ngục',icon:'mob_cerberus'}});
MU.matPrice=Object.fromEntries(Object.values(MU.forest.mobs).map(m=>[m.mat,1500+m.tier*m.tier*400]));
// Phù Thuỷ Cường Hoá đứng góc Tây Nam quảng trường (cạnh tháp pha lê): khắc lỗ cường hoá, bán ngọc, thu mua chiến lợi phẩm rừng
NPCS.push({id:'mu_enchant',scene:'mu',x:7.5,y:25.2,place:'muenchant'});
NPC_LOOKS.mu_enchant={name:'Phù Thuỷ Cường Hoá',look:{gender:'nu',hair:'long',hairColor:'8a5ad8',skin:'f0d0c0',outfit:{top:'mu_dw',bottom:'kaki',shoes:'giay_den'},opts:{mouth:'smile'}}};
// Tiệm Giày (MU, góc Tây Bắc quảng trường): ô trang bị thứ 5 "Giày". Đi bộ / chạy nhanh hơn ở mọi map (spd: +% tốc độ, không tính lúc cưỡi ngựa, đi xe)
// + chỉ số MU như phụ kiện. Ván Trượt Vàng mạnh nhất. Cường hoá được như phụ kiện (ENH.per.feet).
Object.assign(MU.acc,{
  sh_flip:{slot:'feet',name:'Dép Tông Biển',price:120000,spd:.05,bonus:{hp:.02},desc:'Dép tông cam quai xanh, lẹp xẹp mà nhanh'},
  sh_heel:{slot:'feet',name:'Giày Cao Gót Lam',price:180000,spd:.04,bonus:{atk:.03,crit:.02},desc:'Cao gót xanh lam mũi vàng, đạp là đau'},
  sh_rain:{slot:'feet',name:'Ủng Cao Su Xanh',price:200000,spd:.05,bonus:{def:.04},desc:'Ủng xanh lá viền cam, lội đầm không sợ ướt'},
  sh_blue:{slot:'feet',name:'Sneaker Xanh Biển',price:350000,spd:.08,bonus:{hp:.03,atk:.02},desc:'Sneaker xanh da trời phối cam, đế êm'},
  sh_black:{slot:'feet',name:'Sneaker Đen Đế Gỗ',price:380000,spd:.08,bonus:{def:.04},desc:'Đen tuyền vạch trắng, đế nâu chắc chắn'},
  sh_lolita:{slot:'feet',name:'Giày Lolita Tím',price:420000,spd:.07,bonus:{mp:.06},desc:'Giày búp bê tím nơ hồng, mana dồi dào'},
  sh_work:{slot:'feet',name:'Boot Da Nâu',price:650000,spd:.1,bonus:{def:.06,hp:.04},desc:'Boot công nhân da nâu, bền như đá'},
  sh_timber:{slot:'feet',name:'Boot Vàng Timber',price:700000,spd:.1,bonus:{hp:.07},desc:'Boot vàng bò cổ đen, đi rừng cả ngày'},
  sh_fire:{slot:'feet',name:'Sneaker Lửa Cổ Thấp',price:750000,spd:.12,bonus:{atk:.05},desc:'Cam vàng đế xanh két, chạy như lửa'},
  sh_pinkhi:{slot:'feet',name:'Sneaker Hồng Cổ Cao',price:1100000,spd:.14,bonus:{atk:.05,crit:.03},desc:'Cổ cao hồng mận dây trắng, bật nhảy tốt'},
  sh_jordan:{slot:'feet',name:'Sneaker Cam Xanh Cổ Cao',price:1200000,spd:.15,bonus:{hp:.05,def:.04},desc:'Cổ cao cam phối xanh tím, huyền thoại sân bóng'},
  sh_runner:{slot:'feet',name:'Giày Chạy Bộ + Bình Nước',price:1300000,spd:.17,bonus:{hp:.04,regen:.3},desc:'Giày chạy marathon kèm bình nước: hồi máu nhanh hơn'},
  sh_rollor:{slot:'feet',name:'Giày Patin Cam',price:1800000,spd:.22,bonus:{atk:.06},desc:'Patin cam bánh hồng, lướt vèo vèo'},
  sh_rollbl:{slot:'feet',name:'Giày Patin Xanh',price:1900000,spd:.22,bonus:{def:.06,mp:.05},desc:'Patin xanh băng bánh ngọc, êm như trượt băng'},
  sh_skate:{slot:'feet',name:'Ván Trượt Vàng',price:3500000,spd:.32,bonus:{atk:.08,hp:.06,crit:.04},desc:'Đồ mạnh nhất tiệm: ván trượt vàng bánh tím, lướt nhanh nhất game'}});
// hệ số tốc độ đi bộ / chạy của giày đang mang (p.mu.acc.feet)
const shoeSpeed=p=>{ const k=p&&p.mu&&p.mu.acc&&p.mu.acc.feet, a=k&&MU.acc[k]; return 1+(a&&a.spd||0); };
NPCS.push({id:'mu_shoes',scene:'mu',x:7.5,y:10.4,place:'mushoes'});
NPC_LOOKS.mu_shoes={name:'Tiệm Giày Lướt Gió',look:{gender:'nam',hair:'swept',hairColor:'ff7a2a',skin:'f0c4a0',outfit:{top:'mu_elf',bottom:'kaki',shoes:'giay_trang'},opts:{mouth:'smile'}}};
// lực chiến: 1 con số gộp chỉ số MU (hiện trên HUD, so set legacy)
const muPower=s=>Math.round(s.atk*10+s.def*8+s.hp*1.5+s.mp*.6);
for(const [k,f] of Object.entries(MU.fruits)) ITEMS['taq_'+k]={name:f.name,icon:'fruit_'+k};
// Thợ Rèn Huyền Thoại (store vũ khí MU): 50 vũ khí = 10 loại × 5 hệ. Loại quyết định kiểu vung khi ra chiêu + 1 chỉ số phụ, hệ quyết định hiệu ứng nổ ở mục tiêu.
// Công +8%…+24% theo bậc hệ + bậc loại; sao 1–5 (5 sao = Huyền Thoại). Mua xong vào túi và cầm luôn, đổi vũ khí ở Thợ Rèn hoặc Vệ binh.
MU.wtypes={dagger:{name:'Dao Găm',tier:0,bonus:{crit:.04},swing:'stab',desc:'đâm nhanh 2 nhát'},sword:{name:'Kiếm',tier:0,bonus:{hp:.03},swing:'slash',desc:'chém vòng cung'},
  bow:{name:'Cung',tier:0,bonus:{mp:.05},swing:'shoot',desc:'bắn tên'},spear:{name:'Giáo',tier:1,bonus:{def:.03},swing:'thrust',desc:'đâm thẳng'},
  axe:{name:'Rìu Chiến',tier:1,bonus:{hp:.04},swing:'chop',desc:'bổ từ trên xuống'},hammer:{name:'Búa Tạ',tier:1,bonus:{def:.05},swing:'slam',desc:'nện đất toả sóng'},
  katana:{name:'Katana',tier:2,bonus:{crit:.06},swing:'iai',desc:'rút đao chém chớp nhoáng'},scythe:{name:'Lưỡi Hái',tier:2,bonus:{drain:.04},swing:'sweep',desc:'quét vòng rộng'},
  staff:{name:'Gậy Phép',tier:2,bonus:{mp:.1},swing:'cast',desc:'phóng cầu phép'},greatsword:{name:'Đại Kiếm',tier:2,bonus:{hp:.06},swing:'cleave',desc:'chém nặng toé đá'}};
MU.welems={poison:{name:'Kịch Độc',tier:1,col:'#7ae05a',desc:'bọt độc'},ice:{name:'Băng Giá',tier:2,col:'#7fd8ff',desc:'băng vỡ'},fire:{name:'Hoả Ngục',tier:3,col:'#ff8a2a',desc:'lửa nổ'},
  thunder:{name:'Lôi Thần',tier:4,col:'#ffe066',desc:'sét giật'},void:{name:'Hư Không',tier:5,col:'#c86aff',desc:'khe nứt hư không'}};
MU.wrank=['','Thường','Thường','Hiếm','Sử thi','Huyền thoại'];
for(const [tk,ty] of Object.entries(MU.wtypes)) for(const [ek,el] of Object.entries(MU.welems)){ const atk=Math.round((.05+el.tier*.03+ty.tier*.015)*100)/100, sc=el.tier+ty.tier, star=sc<=2?1:sc<=3?2:sc<=5?3:sc===6?4:5;
  MU.weapons['vw_'+tk+'_'+ek]={name:ty.name+' '+el.name,atk,bonus:ty.bonus,type:tk,el:ek,star,price:Math.round((400000+atk*28e6)/10000)*10000,store:true,desc:`${MU.wrank[star]} · công MU +${Math.round(atk*100)}% · ra chiêu ${ty.desc}, ${el.desc}`};
  ITEMS['vw_'+tk+'_'+ek]={name:ty.name+' '+el.name,icon:'wpn_'+tk+'_'+ek}; }
ITEMS.vk_kunai={name:'Kunai Phi Lôi Thần',icon:'kunai'}; ITEMS.vk_cua={name:'Cưa Máy Quỷ',icon:'chainsaw'}; ITEMS.vk_luoihai={name:'Lưỡi Hái Bóng Đêm',icon:'scythe'}; ITEMS.vk_vayrong={name:'Thương Vảy Rồng',icon:'spear'}; ITEMS.vay_rong={name:'Vảy Rồng Dải Xanh',icon:'scale'};
ITEMS.cuon_truc={name:'Cuộn trục Hokage',icon:'scroll'}; ITEMS.banh_mut={name:'Bánh mì phết mứt',icon:'jambread'}; ITEMS.lua_ma={name:'Đốm lửa ma',icon:'ghostfire'};
Object.assign(CLOTHES,{mu_naruto:{name:'Đồ ninja cam (Naruto)',slot:'top',price:0,hidden:true,mu:true,set:'mu_naruto',opts:{top:'jacket',hair:'messy'},colors:{top:'f2802a',inner:'1c1820',pants:'f2802a',shoes:'2a4ab8',hair:'ffd84a'}},
  mu_hokage:{name:'Áo choàng Hokage',slot:'top',price:0,hidden:true,mu:true,set:'mu_hokage',opts:{top:'long'},colors:{top:'f4f2ec',pants:'2a2a34',shoes:'2a4ab8'}},
  mu_cuamay:{name:'Đồ thợ săn quỷ (Quỷ Cưa)',slot:'top',price:0,hidden:true,mu:true,set:'mu_cuamay',opts:{top:'suit'},colors:{top:'1c1820',shirt:'f4f2ec',tie:'1c1820',pants:'1c1820',shoes:'1c1820'}},
  mu_bongma:{name:'Áo choàng bóng ma tím (Dươngg Vũ)',slot:'top',price:0,hidden:true,mu:true,set:'mu_bongma',opts:{top:'long'},colors:{top:'6a4ab0',pants:'4a2a8a',shoes:'2a1a4a'}},
  mu_rongxanh:{name:'Giáp vảy Rồng Dải Xanh',slot:'top',price:0,hidden:true,mu:true,set:'mu_rongxanh',opts:{top:'long'},colors:{top:'2a8a4a',pants:'1a5a30',shoes:'1c1820'}},
  mu_chu_cua:{name:'Mũ lưỡi cưa (thưởng nhiệm vụ)',slot:'top',price:0,hidden:true,mu:true,set:'mu_chu_cua',opts:{top:'tee'},colors:{top:'f2802a',pants:'1c1820',shoes:'1c1820'}}});
Object.assign(QUESTS,{mu_cuontruc:{giver:'mu_guard',secret:true,title:'🔍 3 cuộn trục Hokage',desc:'Hạ Naruto xong, cậu ấy để lộ bí mật: 3 cuộn trục Hokage giấu trong rừng Làng Lá phía Đông. Tìm đủ 3 cuộn mang về cho Vệ binh (thưởng Áo choàng Hokage).',need:{cuon_truc:3},reward:{exp:400,vnd:500000},cloth:'mu_hokage'},
  mu_banhmut:{giver:'mu_guard',secret:true,title:'🔍 Bữa sáng của Quỷ Cưa',desc:'Quỷ Cưa mê bánh mì phết mứt. Nhặt đủ 5 lát giấu quanh bãi phế liệu mang về cho Vệ binh (thưởng mũ lưỡi cưa).',need:{banh_mut:5},reward:{exp:380,vnd:450000},cloth:'mu_chu_cua'},
  mu_vayrong:{giver:'mu_guard',secret:true,title:'🔍 4 vảy Rồng Dải Xanh',desc:'Rồng Dải Xanh rụng 4 chiếc vảy quanh Đầm Rồng. Nhặt đủ 4 vảy mang về cho Vệ binh.',need:{vay_rong:4},reward:{exp:450,vnd:600000}},
  mu_lua_ma:{giver:'mu_guard',secret:true,title:'🔍 Đốm lửa của Dươngg Vũ',desc:'Nửa đêm nghĩa địa có 3 đốm lửa ma lập loè. Gom đủ 3 đốm (chỉ hiện ban đêm giờ game) mang về cho Vệ binh.',need:{lua_ma:3},reward:{exp:420,vnd:550000}}});
Object.assign(CLOTHES,{mu_dk:{name:'Giáp Rồng Đỏ + Kiếm (Chiến Binh)',slot:'top',price:0,hidden:true,mu:true,set:'mu_dk',opts:{top:'long'},colors:{top:'a8282a',pants:'7a1a1e',shoes:'3a3a44'}},
  mu_elf:{name:'Áo Tiên Thánh + Song Kiếm (Tiên Nữ)',slot:'top',price:0,hidden:true,mu:true,set:'mu_elf',opts:{top:'long',bottom:'skirt'},colors:{top:'f4f2ec',pants:'f4f2ec',shoes:'c8a23a'}},
  mu_dw:{name:'Giáp Pháp Sư Xanh + Gậy (Phù Thuỷ)',slot:'top',price:0,hidden:true,mu:true,set:'mu_dw',opts:{top:'long'},colors:{top:'2a4ab8',pants:'2a3a8a',shoes:'1c1820'}}});
Object.assign(ITEMS,{ngoc_uoc:{name:'Ngọc Ước Nguyện',icon:'jewel_bless'},ngoc_tam_linh:{name:'Ngọc Tâm Linh',icon:'jewel_soul'},ngoc_hon_nguyen:{name:'Ngọc Hỗn Nguyên',icon:'jewel_chaos'}});
NPCS.push({id:'mu_guard',scene:'mu',x:19.4,y:23.4,place:'muguard'},{id:'mu_mage',scene:'mu',x:30.6,y:20.6,place:'mumage'},{id:'mu_shop',scene:'mu',x:11.5,y:20.6,place:'mushop'},{id:'mu_acc',scene:'mu',x:35.5,y:12.8,place:'muacc'},{id:'mu_smith',scene:'mu',x:6.5,y:15.4,place:'musmith'},{id:'mu_tamer',scene:'mu',x:34.5,y:24.2,place:'mutamer'});
Object.assign(NPC_LOOKS,{mu_guard:{name:'Vệ binh Lục Địa Cát',look:{gender:'nam',hair:'buzz',hairColor:'3a2a22',skin:'e8b48a',outfit:{top:'mu_dk',bottom:'kaki',shoes:'giay_den'},opts:{beard:'goatee'}}},
  mu_shop:{name:'Thương nhân Huyền Thoại (Premium Store)',look:{gender:'nam',hair:'swept',hairColor:'2a2026',skin:'e8b48a',outfit:{top:'lg_king',bottom:'kaki',shoes:'giay_den'}}},
  mu_acc:{name:'Thợ Kim Hoàn (cánh · dây chuyền · hộ thân · aura)',look:{gender:'nu',hair:'long',hairColor:'f2c43d',skin:'f3c8a8',outfit:{top:'mu_elf',bottom:'kaki',shoes:'giay_den'}}},
  mu_min:{name:'Min',look:{gender:'nu',hair:'long',hairColor:'ff7a2a',skin:'f6d2b8',outfit:{top:'mu_min',bottom:'kaki',shoes:'giay_den'}}},
  mu_tamer:{name:'Người Thuần Thú (cường hoá ngựa)',look:{gender:'nu',hair:'ponytail',hairColor:'3a2a22',skin:'d8a070',outfit:{top:'mu_rongxanh',bottom:'kaki',shoes:'giay_den'}}},
  mu_smith:{name:'Thợ Rèn Huyền Thoại (50 vũ khí)',look:{gender:'nam',hair:'buzz',hairColor:'5a3a22',skin:'c8885a',outfit:{top:'mu_dk',bottom:'kaki',shoes:'giay_den'},opts:{beard:'full'}}},
  mu_mage:{name:'Pháp sư Cát (cửa hàng)',look:{gender:'nam',hair:'long',hairColor:'e8e4dc',skin:'f0c4a0',outfit:{top:'mu_dw',bottom:'kaki',shoes:'giay_den'},opts:{beard:'mustache'}}}});
// Phòng của Diệp (Hà Nội): Diệp nấu ăn cho khách sang chơi. Chỉ tiếp người cấp ≥4 và trong người từ 1 triệu; đang ở mà tiền tụt dưới 1 triệu là Diệp đuổi về.
// Ăn đồ Diệp nấu: EXP theo tiền đang có (30 × √số triệu, tối đa 400), +năng lượng, tính là 1 bữa; mỗi ngày Diệp nấu tối đa 2 lần
const DIEP={W:24,H:18,spawn:{x:12,y:16.2},level:4,money:1000000,kick:1000000,seat:{x:9.6,y:12.2},
  cook:{dur:15,daily:2,expK:30,expMax:400,energy:40},dishes:['ramen Tonkotsu xương heo','ramen Shoyu','ramen Miso bơ ngô','ramen cay kiểu Diệp','ramen gà trứng lòng đào']};   // Diệp nấu ramen
const DAS={W:30,H:20,level:2,spawn:{x:15,y:17.6},podium:{x:22,y:4.6},seats:[[18.5,7.4],[21.5,7.4],[24.5,7.4],[18.5,10],[21.5,10],[24.5,10]],
  courses:{dt:{name:'Design Thinking',fee:2000000,sessions:2,dur:25,exp:50,boost:.1},ux:{name:'UX Research cơ bản',fee:2500000,sessions:3,dur:30,exp:60,boost:.15},
    ui:{name:'UI Design & Design System',fee:3000000,sessions:3,dur:30,exp:60,boost:.15},motion:{name:'Motion & Prototype',fee:2800000,sessions:3,dur:30,exp:60,boost:.15},
    anth:{name:'Nhân học thiết kế (Design Anthropology)',fee:3500000,sessions:4,dur:35,exp:80,boost:.2}},
  gapH:2,maxBoost:.6,skipInterview:3,teach:{pay:450000,daily:2,needCerts:2,level:5,dur:40,exp:40}};
// xe máy thuê ở Ké (cạnh Shop Chande): thuê theo giờ, bấm H lên/xuống xe, chạy nhanh gấp mấy lần đi bộ
const MOTO={min:60,helmet:150000,models:{wave:{price:30000,speed:1.6},dream:{price:40000,speed:1.7},sh:{price:80000,speed:1.9},exciter:{price:60000,speed:2.1},xedap:{price:5000,speed:1.3,bike:true}}};
// xe đạp công cộng: quẹt thẻ ở trạm cạnh bến xe buýt, 5.000đ/30 phút, không cần mũ
const BIKESHARE={min:30,stations:[{map:'retreat',x:123.6,y:94.6},{map:'dalat',x:48.4,y:66.8}]};
// cảnh sát giao thông: thỉnh thoảng lập chốt hoặc đi tuần trên đường ven hồ; chặn người đi xe máy
// không mũ bảo hiểm: phạt (hoặc đút lót nửa giá, 50% được, bị từ chối thì phạt thêm); có mũ: 50% bị hỏi 5 câu luật, sai mỗi câu phạt, sai cả 5 thì xe lên xe thùng về đồn
// phóng nhanh vượt ẩu (giữ Shift khi đi xe máy): nhanh ×1,5; CSGT nhìn thấy trong 7 ô là bắt; cứ 4 giây phóng nhanh có 30% xoè xe
const CSGT={every:[150,300],stay:160,y:97.6,x:[76,330],r:44,cool:90,fine:150000,bribe:100000,bribeOk:.5,extra:100000,quiz:.5,n:5,wrongFine:50000,impound:300000,
  speed:{mul:1.5,fine:150000,bribe:100000,sight:7,every:4,crash:.3,repair:100000,energy:15},
  // Optimus dạng robot đập xe / đánh CSGT: mỗi cú có % bị bắt về đồn (tạm giữ + phạt), xe chịu 5 cú thì nát
  riot:{truckHp:5,smashJail:.15,punchJail:.35,jail:90,fine:150000,cd:600,wreck:25,ko:15},
  Q:[['Đèn vàng bật sáng thì người lái xe phải làm gì?',['Tăng ga vượt qua cho kịp','Dừng trước vạch dừng, trừ khi đã đi quá vạch','Bấm còi rồi đi tiếp'],1],
    ['Nồng độ cồn cho phép khi đi xe máy là bao nhiêu?',['Dưới 2 lon bia là được','Không được có cồn trong máu, hơi thở','Uống xong nghỉ 15 phút là được'],1],
    ['Đang chạy xe máy có được dùng điện thoại không?',['Được nếu đeo tai nghe','Được nếu đi chậm','Không được dùng điện thoại, ô dù khi đang lái'],2],
    ['Xe máy được chở tối đa mấy người (trừ trường hợp đặc biệt)?',['Chở 1 người, tổng 2 người trên xe','Chở 2 người lớn','Chở bao nhiêu cũng được'],0],
    ['Biển hình tròn, viền đỏ, nền trắng là loại biển gì?',['Biển chỉ dẫn','Biển cấm','Biển cảnh báo nguy hiểm'],1],
    ['Biển hình tam giác, viền đỏ, nền vàng là loại biển gì?',['Biển cảnh báo nguy hiểm','Biển hiệu lệnh','Biển cấm'],0],
    ['Xe cứu thương hú còi phía sau, bạn làm gì?',['Đi tiếp bình thường','Chạy theo sau cho nhanh','Giảm tốc, đi sát lề nhường đường'],2],
    ['Đội mũ bảo hiểm thế nào là đúng?',['Đội hờ cho mát đầu','Cài quai chắc chắn dưới cằm','Treo ở tay lái cho tiện'],1],
    ['Trong khu dân cư (đường đôi), xe máy chạy tối đa bao nhiêu?',['60 km/h','80 km/h','100 km/h'],0],
    ['Vạch liền màu trắng giữa hai làn đường có nghĩa là gì?',['Được lấn làn thoải mái','Không được đè lên hoặc vượt qua vạch','Chỉ để trang trí'],1],
    ['Muốn rẽ trái ở ngã tư thì phải làm gì?',['Bật xi nhan trái, quan sát rồi mới rẽ','Rẽ luôn cho nhanh','Bấm còi liên tục'],0],
    ['Đi xe máy dàn hàng ngang 3 xe trở lên có được không?',['Được nếu đường vắng','Không được phép','Được nếu đi chậm'],1],
    ['Bao nhiêu tuổi thì được lái xe máy trên 50cc?',['15 tuổi','16 tuổi','Đủ 18 tuổi'],2],
    ['Đi xe máy vào ban đêm phải làm gì?',['Bật đèn chiếu sáng','Tắt đèn cho đỡ chói','Bật đèn pha liên tục khi có xe ngược chiều'],0],
    ['Bốc đầu, lạng lách trên đường thì bị xử lý thế nào?',['Không sao nếu không va chạm','Bị phạt nặng, có thể tước bằng, tạm giữ xe','Chỉ bị nhắc nhở'],1]]};
// ô tô riêng của Chika Phú: đỗ ở đầu cổng Ké, chỉ đúng nhân vật này lái được; đỗ chỗ nào thì xe nằm lại chỗ đó
const PCAR={owner:'chika phú',name:'Xe của Chika Phú',speed:2.8,seats:3,park:{x:58.6,y:101}};   // đỗ ở bãi đỗ trước cổng Ké
// Optimus Prime: xe đầu kéo đỗ cạnh xe Chika Phú, chỉ Kaixa biến hình được (robot đi nhanh hơn người, dạng xe tải chạy rất nhanh)
// Megatron: Optimus (Kaixa) bấm Z gọi ra đánh nhau. Megatron đuổi theo đấm khi gần, bắn pháo khi xa; Optimus đấm (J) hoặc hoá xe húc
// Đấu trường MCK (góc Tây Bắc map Ké, trong rừng phía trên Nhà ăn khu trên): bấm E ở sân khấu thách đấu, ai đứng trong đấu trường cũng đánh được (J đấm).
// MCK vung mic cận chiến, phóng sóng âm từ xa; máu boss tăng theo số người đánh; hạ được thì chia thưởng theo sát thương; gục thì mất năng lượng, bị đẩy ra cổng đấu trường
const MCK={arena:{x0:5,y0:5,x1:30,y1:25},stage:{x:17.5,y:7.4},gate:{x:17.5,y:28},hp:160,hpPer:90,playerHp:100,speed:2.3,melee:9,meleeCd:1200,wave:11,waveCd:2600,waveSpeed:8,
  punch:5,punchCd:420,idle:20,cd:180,prize:3000000,exp:400,loseEnergy:20,lines:['Ê! Ai là boss ở đây?','Nghe cho rõ này!','Còn non lắm!','Lên sân khấu mà đòi đấu à?','Mic check, một hai!']};
const MEGATRON={hp:110,optHp:100,speed:2.1,melee:10,meleeCd:1300,shot:12,shotCd:2800,shotSpeed:9,punch:4,punchCd:420,ram:7,ramCd:900,cd:120,winExp:300,prize:3000000,loseEnergy:30};
// thú hoang ngẫu nhiên: khủng long trong rừng (5 loài, chụp ảnh được thưởng, bạo chúa đến gần thì bị đớp), cá sấu dưới hồ đớp người chèo kayak
// Ộ i i: NPC đi lang thang ở mọi map (tuyến tự sinh phía máy khách), lại gần thì nói; giao 2 việc: gom khô gà đè tem, hút shisha ở Nhà giải trí
const OII={lines:['Alo Hải à em','Thôi em đừng có chối'],speed:1.5,dwell:5,skip:['room','stay','track','deo','phongbay','doncongan'],
  khoga:[['retreat',110,20],['retreat',175,40],['retreat',95,70],['retreat',194,104],['retreat',297,103],['dalat',3,45],['dalat',25,27],['dalat',1,7],
    ['das',22,11],['das',5,17],['everfit',17,11],['everfit',10,11],['club',16,5],['net',5,9]].map(([scene,x,y])=>({scene,x:x+.5,y:y+.6}))};
// góc shisha trong Nhà giải trí: ngồi đệm trái hút cùng Ộ i i; người khác cùng phòng chụp ảnh báo công an được trong lúc đang hút
const SHISHA={x:21.5,y:12.6,seat:{x:19.9,y:13.3},oii:{x:23.1,y:13.3},dur:12,price:80000,report:{chance:.6,fine:150000,jail:90,bounty:50000,cd:20}};
// người / thú đi theo 1 người chơi (so tên không dấu, chữ thường); chỉ hiển thị phía máy khách. gap: đi sau chủ bao nhiêu px, side: lệch xuống dưới
const FOLLOWERS=[{owner:'dvu',id:'bui',name:'Bụi',kind:'cat',rest:'lie',gap:18,side:-4,line:'Meoo~'},{owner:'dvu',id:'bam',name:'Bặm',kind:'cat',rest:'sit',gap:32,side:6,line:'Meo meo 😽'}];
const WILDLIFE={dino:{every:[360,720],stay:180,photoKnow:2,bite:{r:1.7,cd:3500,energy:10,push:3},
  kinds:{bronto:{name:'Khủng long cổ dài',speed:.7,exp:40},trice:{name:'Khủng long ba sừng',speed:.9,exp:50},ptero:{name:'Thằn lằn bay',speed:2.6,exp:60,fly:true},
    rexpink:{name:'Khủng long bạo chúa hồng',speed:1.1,exp:80,bite:true},rex:{name:'Khủng long bạo chúa',speed:1.3,exp:90,bite:true}},
  spots:[[100,30],[124,40],[180,30],[110,14],[160,20],[262,30],[230,56]]},
  croc:{every:[180,360],stay:150,y:[105,114],x:[6,330],speed:1.4,stalk:12,r:1.6,energy:20,drop:.1,dropMax:200000}};
const OPTIMUS={owner:'kaixa',park:{x:60.4,y:104},robot:1.25,truck:2.6};
// vườn quốc gia: mua vé ở cổng (theo ngày), mỗi trạm quan sát xem thú 1 lần/ngày được EXP + hiểu biết; quyên góp cho vườn
const PARK={x0:212,y0:4,x1:335,y1:93,gate:216.5,ticket:50000,visitExp:15,donate:[20000,100000,500000,2000000],
  spots:[{k:'huou',name:'Đồi hươu sao',x:238,y:70,fact:'Hươu sao đực có gạc, mỗi năm rụng gạc rồi mọc lại. Đốm trắng trên lưng giúp nó lẩn trong nắng rừng.'},
    {k:'khi',name:'Rừng khỉ vàng',x:257,y:60,fact:'Khỉ vàng sống theo bầy do khỉ đầu đàn dẫn dắt, ăn quả, lá non và côn trùng.'},
    {k:'voi',name:'Bãi voi',x:270,y:48,fact:'Voi châu Á nặng tới 5 tấn, ăn 150 kg cỏ mỗi ngày và nhớ đường đi rất giỏi.'},
    {k:'cong',name:'Vườn công',x:281,y:38,fact:'Công xanh là loài chim quý hiếm ở Việt Nam. Công đực xoè đuôi để thu hút công cái.'},
    {k:'honghoang',name:'Tán rừng chim',x:290,y:26,fact:'Hồng hoàng có mũ sừng vàng trên mỏ, sống theo cặp gần như suốt đời.'},
    {k:'raica',name:'Bờ suối rái cá',x:309,y:16,fact:'Rái cá bơi lặn rất giỏi, thích sống ven suối nước sạch. Thấy rái cá là suối còn trong lành.'},
    {k:'vooc',name:'Vách đá voọc',x:325,y:28,fact:'Voọc chà vá chân nâu được gọi là "nữ hoàng linh trưởng" vì bộ lông nhiều màu.'},
    {k:'gau',name:'Trạm cứu hộ gấu',x:318,y:48,fact:'Gấu ngựa có vệt chữ V trắng ở ngực. Nhiều con ở đây được cứu từ trại nuôi lấy mật.'},
    {k:'ho',name:'Khu hổ Đông Dương',x:305,y:71,fact:'Hổ Đông Dương còn rất ít ngoài tự nhiên. Vằn trên mỗi con hổ là duy nhất như vân tay.'},
    {k:'lonrung',name:'Rừng lợn rừng',x:282,y:80,fact:'Lợn rừng dùng mõm đào đất tìm củ, có răng nanh cong và rất khoẻ.'}]};
// bảo tàng lịch sử: vé theo ngày, mỗi hiện vật tìm hiểu 1 lần/ngày được hiểu biết
const MUSEUM={ticket:30000,exhibits:[{name:'Trống đồng Đông Sơn',fact:'Trống đồng Đông Sơn có từ hơn 2.000 năm trước, mặt trống khắc hình mặt trời và chim Lạc.'},
  {name:'Nhà sàn Mường',fact:'Nhà sàn Mường dựng bằng gỗ, mái lá cọ, gầm sàn để nuôi gia súc và cất nông cụ.'},{name:'Mo Mường',fact:'Mo Mường là sử thi được thầy mo hát trong tang lễ, kể chuyện đẻ đất đẻ nước.'},
  {name:'Cồng chiêng',fact:'Cồng chiêng Mường được đánh trong lễ hội, mỗi chiếc một thanh âm khác nhau.'},{name:'Công trình thuỷ điện Hoà Bình',fact:'Thuỷ điện Hoà Bình khởi công năm 1979, tạo nên hồ Hoà Bình rộng lớn trên sông Đà.'},
  {name:'Văn hoá Hoà Bình',fact:'Văn hoá Hoà Bình thời đồ đá cách đây khoảng 10.000 năm, nổi tiếng với rìu đá ghè đẽo.'}]};
// chùa: thắp hương miễn phí mỗi ngày, công đức nhận phúc (tăng EXP), xin quẻ
const TEMPLE={pray:{exp:10,mul:1.05,min:30},donate:[{v:10000,mul:1.08,min:30},{v:50000,mul:1.12,min:45},{v:200000,mul:1.18,min:60},{v:1000000,mul:1.25,min:120}],
  fortunes:['Quẻ cát: tiền vào như nước sông Đà.','Quẻ trung bình: làm việc chăm chỉ ắt có quả ngọt.','Quẻ cát: tình duyên nở hoa như cẩm tú cầu Đà Lạt.','Quẻ hung nhẹ: đừng đua xe bốc đầu hôm nay.','Quẻ đại cát: câu cá trúng cá lăng to.','Quẻ cát: gặp quý nhân ở Everfit.']};
// tiệm net: thuê máy chơi game (EXP) hoặc lướt web học hỏi (hiểu biết)
const NETCAFE={game:{fee:10000,dur:20,exp:25,energy:5},web:{fee:5000,dur:15,know:1,daily:3}};
// lọ: mini game giữ thanh "phê" trong vùng xanh đủ lâu; làm ngoài phòng riêng là bị phạt
const LO={battery:50,hold:6,fine:150000,energy:20,clean:15,exp:40};
// thuê đất ở nông trại bác Trang (trả theo ngày như phòng): càng nhiều ô càng đắt
const DL_LAND=[{id:'nho',name:'Mảnh nhỏ',plots:2,price:60000},{id:'vua',name:'Mảnh vừa',plots:4,price:110000},{id:'lon',name:'Mảnh lớn',plots:6,price:160000},{id:'trai',name:'Cả một trang trại',plots:10,price:250000}];
const DL_FARM={maxPlots:10};
// vật nuôi: mua con giống ở trại, cho ăn để bắt đầu 1 lứa, xong lứa thì thu sản phẩm
// trộm lợn chuồng người khác (đang online) ở trại chú Sáu: 40% trót lọt, hỏng thì đền chủ; nhà có chó thì chó canh trước (block/bite của giống chó, không có thì dogGuard)
// bị chủ bắt quả tang: vào đồn tạm giữ `jail` giây (nộp `fine` để về sớm) và bồi thường `comp` cho chủ lợn
const PIG_STEAL={kinds:['lon','nai','bo','ga','vit'],chance:.4,comp:300000,jail:90,fine:150000,cd:90,dogGuard:.3,loot:{lon:'lon_thit',nai:'lon_thit',bo:'sua',ga:'ga_thit',vit:'trung_vit'}};
// dịch vụ chó canh chuồng trại (chú Sáu ở Đà Lạt, chú Ba ở Ké): canh mọi vật nuôi của bạn (lợn, bò, gà, vịt) khỏi kẻ trộm, kể cả khi bạn offline
const GUARD={plans:{ngay:{name:'Chó canh 1 ngày',price:60000,h:24,block:.6,dog:'shiba'},tuan:{name:'Chó canh 7 ngày',price:350000,h:168,block:.6,dog:'shiba'},
  k9:{name:'Đội Béc-giê K9 · 1 ngày',price:180000,h:24,block:.9,bite:200000,dog:'becgie'}}};
const ANIMALS={
  bo:{name:'Bò sữa (bê cái)',price:3000000,max:2,feed:'co_kho',cycle:3600,product:'sua',yield:4,exp:14,keep:true},
  ga:{name:'Gà ta',price:50000,max:6,feed:'thoc',cycle:1800,product:'trung',yield:2,exp:4,keep:true},
  lon:{name:'Lợn',price:1500000,max:6,feed:'cam',cycle:7200,feeds:3,product:'lon_thit',yield:1,exp:40},
  // lợn nái: ăn đủ 2 lứa thì đẻ 2–4 lợn con (vào chuồng nuôi tiếp, chuồng đầy thì thành lợn con để bán), nái giữ lại đẻ tiếp
  vit:{name:'Vịt',price:70000,max:8,feed:'thoc',cycle:2400,product:'trung_vit',yield:2,exp:5,keep:true},
  nai:{name:'Lợn nái',price:3500000,max:1,feed:'cam',cycle:7200,feeds:2,product:'lon_con',yield:2,exp:50,keep:true,birth:'lon'},
  ca:{name:'Ao cá hồi',price:2000000,max:1,feed:'cam',cycle:7200,product:'ca_hoi',yield:1,exp:20},
  tom:{name:'Ao tôm càng',price:1500000,max:1,feed:'cam',cycle:7200,product:'tom',yield:1,exp:18},
};
const FEED={co_kho:{name:'Cỏ khô',price:5000},thoc:{name:'Thóc',price:2000},cam:{name:'Cám',price:20000}};
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
const DL_FISH={ca_ro_phi:{w:55,exp:8,price:15000},ca_chep:{w:30,exp:12,price:40000},ca_tam:{w:15,exp:30,price:150000}};
// ngựa: thuê theo giờ hoặc mua; cưỡi nhanh hơn, chở được 3 thùng hàng
const HORSE={rent:150000,rentMin:60,buy:2000000,speed:1.8,carry:3,coats:['Ngựa hồng (nâu đỏ)','Ngựa ô (đen tuyền)','Ngựa vàng kem','Ngựa nâu sẫm'],herd:{dur:20,exp:30,vnd:40000,daily:5}};
// cường hoá ngựa (ngựa mua, không tính ngựa thuê) thành thần thú, lên lần lượt từng bậc ở Người Thuần Thú (MU) / trại ngựa: tốn tiền + ngọc rơi từ boss MU.
// Mỗi bậc chạy nhanh hơn và cộng chỉ số MU (lực chiến) khi đang chọn con đó. Đã mở bậc nào thì đổi qua lại con nào cũng được (look.mount, ai cũng thấy).
HORSE.myth=[{k:'thienma',name:'Thiên Mã',desc:'Ngựa trắng cánh lông vũ, bờm vàng',price:1500000,jewels:{},speed:1.05},
  {k:'kylan',name:'Kỳ Lân',desc:'Ngựa trắng sừng vàng, bờm đuôi cầu vồng',price:2500000,jewels:{ngoc_uoc:1},speed:1.1},
  {k:'bacho',name:'Bạch Hổ',desc:'Hổ trắng vằn đen, mắt xanh băng',price:3500000,jewels:{ngoc_tam_linh:1},speed:1.15},
  {k:'rongxanh',name:'Rồng Xanh',desc:'Rồng xanh lá bụng vàng chanh, sừng ngà, cánh nhỏ',price:5000000,jewels:{ngoc_tam_linh:2},speed:1.2},
  {k:'phuong',name:'Phượng Hoàng',desc:'Chim lửa cánh rực, đuôi lông vũ dài, bay lơ lửng',price:7000000,jewels:{ngoc_hon_nguyen:1},speed:1.25},
  {k:'haclong',name:'Hắc Long',desc:'Rồng đen cánh dơi, mắt đỏ, vảy ánh tím',price:10000000,jewels:{ngoc_hon_nguyen:2},speed:1.3}];
HORSE.myth.forEach((m,i)=>{ m.lv=i+1; m.bonus={hp:.03*(i+1),atk:.02*(i+1)}; });
const mythOf=k=>HORSE.myth.find(m=>m.k===k)||null;
// số thứ tự thần thú đang chọn (1…6) nếu ngựa đã mua và đã cường hoá tới bậc đó, không thì 0
const mythIdx=p=>{ const i=HORSE.myth.findIndex(m=>m.k===(p&&p.look&&p.look.mount)); return i>=0&&p.horse&&p.horse.own&&(p.horse.myth||0)>i?i+1:0; };
const CRATES={vnd:25000,exp:8,daily:12};
// trường đua: thuê ngựa đua, cá cược; đua kiểu Audition (gõ đúng chuỗi mũi tên rồi bấm Space đúng nhịp)
// every: cứ chừng ấy giây chốt danh sách 1 lần, ghế trống bot vào đủ 6 ngựa cho mọi người cược; botMul: trận có bot thì phí thuê + tiền thưởng ×1,5
const RACE={every:150,botMul:1.5,houseBonus:.2,bots:['Bot Xích Thố','Bot Bạch Mã','Bot Ô Vân','Bot Tia Chớp','Bot Gió Lốc','Bot Kim Mã','Bot Hoàng Phong','Bot Đen Huyền'],rent:100000,maxRiders:6,minRiders:2,lobbyMs:20000,rounds:8,roundMs:4400,beatAt:3600,track:100,betMin:10000,betMax:1000000,winExp:50,
  judge:[[60,'PERFECT',14],[130,'GREAT',10],[220,'COOL',7],[330,'BAD',3]]};
Object.assign(ITEMS,{
  sua:{name:'Sữa bò tươi',icon:'milk'},lon_thit:{name:'Lợn xuất chuồng',icon:'pig'},lon_con:{name:'Lợn con',icon:'pig'},trung_vit:{name:'Trứng vịt',icon:'egg'},vot_buom:{name:'Vợt bắt bướm',icon:'net'},ca_hoi:{name:'Cá hồi',icon:'fish3'},tom:{name:'Tôm càng',icon:'shrimp'},
  ca_ro_phi:{name:'Cá rô phi',icon:'fish'},ca_tam:{name:'Cá tầm',icon:'fish3'},thung_hang:{name:'Thùng hàng nông trại',icon:'crate'},
});
for(const [k,f] of Object.entries(FEED)) ITEMS[k]={name:f.name,icon:'feed'};
for(const [k,g] of Object.entries(INGREDIENTS)) if(!ITEMS[k]) ITEMS[k]={name:g.name,icon:'ing_'+g.shop};
for(const [k,r] of Object.entries(RECIPES)) ITEMS['mon_'+k]={name:r.name,icon:'dish'};
for(const [k,c] of Object.entries(CROPS)) if(!ITEMS[k]){ ITEMS['hat_'+k]={name:(c.plant?'Cây giống ':'Hạt ')+c.name.toLowerCase(),icon:c.kind==='cay'||c.kind==='caosu'||c.kind==='cafe'?'sapling':'seed',col:c.col}; ITEMS[k]={name:c.name,icon:'crop_'+k}; }
// giá thu mua (bác Trang, cô Ké): rau quả + sản phẩm chăn nuôi
const SELL={};
for(const [k,c] of Object.entries(CROPS)) SELL[k]=c.sell;
Object.assign(SELL,{sua:25000,trung:4000,trung_vit:5000,lon_thit:2400000,lon_con:800000,ca_hoi:250000,tom:200000});
for(const [k,f] of Object.entries(DL_FISH)) SELL[k]=f.price;
for(const [k,f] of Object.entries(FISH)) SELL[k]=f.price;
for(const [k,t] of Object.entries(TREASURE.items)){ ITEMS[k]={name:t.name,icon:'tr_'+k}; SELL[k]=t.price; }
for(const [k,r] of Object.entries(BUTTERFLY.kinds)){ ITEMS['buom_'+k]={name:BUTTERFLY.names[k],icon:'buom_'+k}; SELL['buom_'+k]=BUTTERFLY.sell[r]; }
Object.assign(TRAVEL,{dalatFare:250000,dalatHours:'khoảng 1 tiếng 45 phút bay + xe'});
Object.assign(FOOD,{
  banh_can_an:{name:'Bánh căn',price:30000,meal:true,exp:5},lau_ga_an:{name:'Lẩu gà lá é',price:90000,meal:true,exp:15},
  nem_an:{name:'Nem nướng',price:45000,meal:true,exp:8},sua_dau:{name:'Sữa đậu nành nóng',price:10000,drink:true,exp:4,buff:{mul:1.1,min:20}},
  cafe_dl:{name:'Cà phê Cầu Đất',price:30000,drink:true,exp:10,buff:{mul:1.3,min:30}},
});
PLACES.quan_lan={name:'Quán cơm cô Lan',where:'chợ nông trại',menu:['banh_can_an','lau_ga_an','nem_an','sua_dau','cafe_dl'],map:'dalat',door:{x:DALAT.quan.x,y:DALAT.quan.y},scene:'quan_lan',x:DALAT.quan.x,y:DALAT.quan.y};
NPCS.push({id:'bactrang',scene:'dalat',x:40,y:7.4,place:'bactrang'},{id:'colan',scene:'quan_lan',x:5,y:2.7,place:'quan_lan'},
  {id:'chusau',scene:'dalat',x:48.5,y:35.2,place:'barn'},{id:'anhphong',scene:'dalat',x:51.5,y:12.6,place:'stable'},
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
const DEST={home:{name:'Phòng của bạn (Hà Nội)',city:'hn'},everfit:{name:'Văn phòng Everfit (Hà Nội)',city:'hn'},lumen:{name:'Lumen Studio (Hà Nội)',city:'hn'},yenlang:{name:'120 Yên Lãng · nhà anh Độ (Hà Nội)',city:'hn'},pickle:{name:'Sân pickleball Cầu Giấy (Hà Nội)',city:'hn'},diep:{name:'Phòng của Diệp (Hà Nội)',city:'hn'},
  retreat:{name:'Ké Retreat (Đà Bắc, Hoà Bình)',city:'hb'},dalat:{name:'Nông trại bác Trang (Đà Lạt)',city:'dl'},
  das:{name:'DAS · Design Anthropology School (TP.HCM)',city:'hcm',plane:true},bearplus:{name:'Bearplus Studio (Khánh Hội, TP.HCM)',city:'hcm',plane:true},
  vnpt:{name:'VNPT · điểm giao dịch (Hà Nội)',city:'hn'},nghienmotion:{name:'Group Nghiện Motion (Hà Nội)',city:'hn'},lavi:{name:'Lavi Studio (TP.HCM)',city:'hcm',plane:true},mu:{name:'MU Online · Lục Địa Cát (vào game)',city:'mu'},mieu:{name:'Miếu ông Trường Con (Hải Phòng)',city:'hp'}};
const GRAB={hn_hn:1000,hb_hn:6000,hb_hb:0,dl_hn:16000,dl_hb:16000,dl_dl:0,hcm_hn:50000,hb_hcm:53000,dl_hcm:30000,hcm_hcm:0,hn_hp:7000,hb_hp:9000,dl_hp:22000,hcm_hp:52000,hp_hp:0,minBattery:5};   // tới TP.HCM phải mua vé máy bay   // khoá: 2 thành phố xếp theo abc
function grabFare(from,to){ return GRAB[[DEST[from].city,DEST[to].city].sort().join('_')]??0; }
// khoá học online ở phòng: mất tiền + thời gian, cần đủ cấp
const COURSES={
  cauca:{name:'Câu cá',price:300000,level:2,dur:20,desc:'Câu ở mép hồ Ké Retreat và hồ nông trại Đà Lạt.'},
  nauan:{name:'Nấu ăn',price:300000,level:2,dur:20,desc:'Nhận đơn nấu món Đà Lạt ở quán cô Lan.'},
  channuoi:{name:'Chăn nuôi',price:500000,level:2,dur:25,desc:'Mua và nuôi bò sữa, gà, lợn, cá hồi, tôm ở nông trại.'},
  kayak:{name:'Chèo kayak',price:400000,level:3,dur:25,desc:'Thuê kayak ở bãi cát cạnh bến hồ Hoà Bình.'},
  cuoingua:{name:'Cưỡi ngựa',price:800000,level:3,dur:30,desc:'Cưỡi ngựa ở Đà Lạt, chạy nhanh, chở 3 thùng hàng, được đua ngựa.'},
  lamvuon:{name:'Làm vườn lâu năm',price:600000,level:4,dur:30,desc:'Trồng cà phê, bơ, hồng, cao su (thu hoạch nhiều lần).'},
  damphan:{name:'Đàm phán',price:1200000,level:5,dur:40,desc:'Bán nông sản, cá, sản phẩm chăn nuôi được thêm 10%.'},
};
Object.assign(SKILLS,{cauca:{name:'Câu cá',key:'E',desc:COURSES.cauca.desc},kayak:{name:'Chèo kayak',key:'E',desc:COURSES.kayak.desc},
  nauan:{name:'Nấu ăn',key:'E',desc:COURSES.nauan.desc},channuoi:{name:'Chăn nuôi',key:'E',desc:COURSES.channuoi.desc},
  cuoingua:{name:'Cưỡi ngựa',key:'H',desc:COURSES.cuoingua.desc},lamvuon:{name:'Làm vườn lâu năm',key:'E',desc:COURSES.lamvuon.desc},
  damphan:{name:'Đàm phán',key:'-',desc:COURSES.damphan.desc}});
const MARKET={maxListings:8,fee:.05,maxPrice:50000000};   // phí sàn 5% trên giá bán
// mã hành động trong gói vị trí (server ⇄ client)
const ACTS=['','noi','quay','gong','hokage','kiss','attack','hurt','fish','sleep','ko','work','phone','shower','cook','herd','wrestle','swim','wheelie','shisha'];
const ACT_DUR={noi:2,quay:2.4,gong:1.6,hokage:4.4,kiss:2.6,attack:.35,hurt:.4,ko:3};
// cờ trong gói vị trí
const FL={kayak:1,fish:2,dirty:4,tired:8,ride:16,moto:32,drunk:64,car:128,incar:256,helmet:512,bike:1024,optimus:2048,otruck:4096,coat:8192,mount:32768};   // coat: 2 bit màu ngựa (×8192) · mount: 3 bit thần thú đang cưỡi (×32768, 0 = ngựa thường)
// cảnh → điểm đến Grab
const SCENE_DEST={mu:'mu',lavi:'lavi',nghienmotion:'nghienmotion',bearplus:'bearplus',vnpt:'vnpt',mieu:'mieu',das:'das',lumen:'lumen',yenlang:'yenlang',pickle:'pickle',diep:'diep',room:'home',everfit:'everfit',retreat:'retreat',nongsan:'retreat',quanao:'retreat',club:'retreat',stay:'retreat',doncongan:'retreat',deo:'retreat',phongbay:'retreat',dalat:'dalat',track:'dalat',sieuthi:'retreat',net:'retreat',cafe2:'retreat',quan_lan:'dalat'};
const SCENE_SIZE={mu:[96,72],lavi:[32,22],nghienmotion:[34,24],bearplus:[34,22],vnpt:[36,24],mieu:[40,32],das:[30,20],lumen:[38,36],yenlang:[38,18],linhcat:[24,16],pickle:[30,24],diep:[24,18],retreat:[340,124],dalat:[80,70],everfit:[34,21],track:[60,30],nongsan:[14,10],quanao:[14,10],club:[26,17],doncongan:[14,10],deo:[240,14],phongbay:[20,14],sieuthi:[20,14],net:[20,13],cafe2:[18,12],quan_lan:[16,11]};

/* ---------- Thời gian Việt Nam ---------- */
// giờ trong game: sáng/tối, thứ, bữa ăn, giới hạn mỗi ngày, tiền thuê, lương. realTime: lịch thật (điểm danh, việc hằng ngày, lễ hội, giờ chat)
const gameMs=(ms=Date.now())=>{ const E=RULES.timeEpoch; return ms<E?ms:E+(ms-E)*RULES.timeScale; };
function realTime(ms=Date.now()){ const d=new Date(ms+RULES.tzOffsetH*3600e3);
  return {day:d.toISOString().slice(0,10),h:d.getUTCHours(),m:d.getUTCMinutes(),hf:d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600,wd:d.getUTCDay()}; }
function vnTime(ms=Date.now()){ const d=new Date(gameMs(ms)+RULES.tzOffsetH*3600e3);
  return {day:d.toISOString().slice(0,10),h:d.getUTCHours(),m:d.getUTCMinutes(),hf:d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600,wd:d.getUTCDay()}; }
const WEEKDAYS=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
// trạng thái 3 bữa: eaten (đã ăn) / now (đang giờ ăn) / missed (bỏ bữa) / later (chưa tới giờ)
function mealStatus(meals,ms=Date.now()){ const t=vnTime(ms), eaten=(meals&&meals.day===t.day)?meals.eaten||{}:{};
  return RULES.meals.map(m=>({...m,st:eaten[m.id]?'eaten':t.hf>=m.to?'missed':t.hf>=m.from?'now':'later'})); }
// level cao đi bộ/chạy nhanh hơn: +1,5% mỗi cấp, tối đa +30%
const lvSpeed=lv=>1+Math.min(.3,Math.max(0,((lv|0)-1)*.015));
function hunger(meals,ms){ return Math.min(3,mealStatus(meals,ms).filter(m=>m.st==='missed').length); }
function levelOf(exp){ let l=1; while(RULES.levels[l]!==undefined&&exp>=RULES.levels[l]) l++; return l; }
const fmt=v=>Math.round(v).toLocaleString('vi-VN')+'đ';
// tình trạng 1 ô rau lúc ms: empty / growing / ripe (chỉ chủ thu) / open (người khác cướp được)
function plotState(p,ms=Date.now()){ if(!p||!p.c||!CROPS[p.c]) return 'empty'; const c=CROPS[p.c], ripe=p.at+c.grow*1000;
  if(ms<ripe) return 'growing'; if(ms<ripe+(p.g||FARM.grace)*1000) return 'ripe'; return 'open'; }   // g: thời gian chủ được thu riêng (chó Đốm canh giờ)

// ngoại hình → opts/colors (hex) cho RefTemplate
function lookToTemplate(look){
  const opts={hair:look.hair||'swept',top:'tee',bottom:'pants',brows:true,mouth:look.gender==='nu'?'smile':'line'}, colors={hair:look.hairColor||'211c21',skin:look.skin||'f3b194'};
  for(const [slot] of SLOTS){ const id=look.outfit&&look.outfit[slot], it=id&&CLOTHES[id]; if(!it) continue; Object.assign(opts,it.opts||{}); Object.assign(colors,it.colors||{}); }
  const top=look.outfit&&CLOTHES[look.outfit.top]; if(top&&top.set){ Object.assign(opts,top.opts); Object.assign(colors,top.colors); opts.costume=top.set; }   // set hot đè lên quần/giày
  if(look.opts) Object.assign(opts,look.opts);          // chỉ NPC dùng (ria mép, hình xăm...)
  if(look.wep) opts.nowep=1;                           // đang cầm vũ khí Thợ Rèn (vẽ riêng trên tay): bỏ vũ khí vẽ sẵn trong bộ đồ
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
// tối nay có bị xếp OT không (cố định theo uid + ngày), trả về task OT hoặc null
function otTask(uid,day){ if(isWeekend(day)) return null; let h=2166136261; for(const ch of 'ot'+uid+day){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } h>>>=0;
  if(h%100>=JOB.ot.chance) return null; const pool=Object.keys(WORK_TASKS).filter(k=>WORK_TASKS[k].where==='desk'); return pool[(h>>8)%pool.length]; }

/* ---------- Group Nghiện Motion (Hà Nội): làm motion, lắp mô hình, chơi game, phòng xông hơi chung ---------- */
const NMOTION={W:34,H:24,spawn:{x:17,y:22},desks:[[9,7.4],[13.4,7.4],[17.8,7.4],[9,12],[13.4,12],[17.8,12]],tv:{x:5.6,y:2.1},kanban:{x:24,y:5.6},shelf:{x:30.6,y:5.4},
  model:{x:26.4,y:11.4},game:{x:6,y:18.6},snack:{x:15.4,y:18.3},gundam:{x:29.4,y:11.6},eva:{x:10.4,y:18.8},sauna:{x0:22,y0:15,x1:32,y1:22},benches:[[27,17.2],[27,19.6]],heater:{x:30.6,y:21.2},
  saunaDur:15,saunaMax:3,saunaEnergy:30,crowd:{n:2,mul:1.1,min:30}};
Object.assign(QUESTS,{
  nm_ball:{giver:'trong',title:'Quả bóng nảy',desc:'Bài nhập môn của Giáo chủ: ngồi 1 bàn làm animation quả bóng nảy đúng 12 nguyên tắc (15 giây).',prog:1,reward:{exp:200,vnd:250000}},
  nm_easing:{giver:'trong',after:'nm_ball',title:'Easing mượt như bơ',desc:'Chỉnh graph editor 3 lần cho chuyển động mượt (mỗi lần 6 giây ở bàn làm việc).',prog:3,reward:{exp:240,vnd:300000}},
  nm_logo:{giver:'trong',after:'nm_easing',title:'Logo animation 3 giây',desc:'Làm logo animation cho khách: ngồi bàn 20 giây.',prog:1,reward:{exp:300,vnd:400000}},
  nm_reel:{giver:'trong',after:'nm_logo',title:'Trình chiếu showreel',desc:'Chiếu showreel lên TV lớn cho cả group xem (15 giây). Giáo chủ duyệt thì thành đệ tử chính thức.',prog:1,reward:{exp:500,vnd:800000}},
  gp_build:{giver:'gundam',title:'Lắp Gunpla RX-78',desc:'Ở bàn lắp mô hình: cắt runner, lắp khung, dán decal (3 bước, mỗi bước 8 giây).',prog:3,reward:{exp:220,vnd:250000,item:'gunpla'}},
  gp_panel:{giver:'gundam',after:'gp_build',title:'Kẻ lằn chìm',desc:'Kẻ lằn chìm và phủ mờ cho mô hình thật nét (12 giây ở bàn lắp mô hình).',prog:1,reward:{exp:200,vnd:250000}},
  ev_win:{giver:'eva',title:'Thắng Eva 2 ván game',desc:'Ra góc game đấu đối kháng với Eva. Mỗi ván 10 giây, thắng đủ 2 ván.',prog:2,reward:{exp:220,vnd:250000}}});
PLACES.nm_tuck={name:'Pantry Nghiện Motion · Sting & mì gói',where:'Group Nghiện Motion',menu:['sting','mi_goi','mi_trung','tra_da'],map:'nghienmotion',x:NMOTION.snack.x,y:NMOTION.snack.y};
NPCS.push({id:'trong',scene:'nghienmotion',x:14,y:9.8,place:'trong'},{id:'nm_mem',scene:'nghienmotion',x:22.4,y:9.6,place:'nmmem'},
  {id:'gundam',scene:'nghienmotion',x:29.4,y:11.6,place:'gundam',obj:true},{id:'eva',scene:'nghienmotion',x:10.4,y:18.8,place:'eva',obj:true});
Object.assign(CLOTHES,{ao_trong:{name:'Áo khoá kéo đen trắng',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'1c1820',inner:'f4f4f2'}},
  hoodie_nm:{name:'Hoodie Nghiện Motion',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'2a3352',inner:'7fd0ff'}}});
Object.assign(NPC_LOOKS,{trong:{name:'Trọng Motion',title:{name:'Giáo chủ',fx:'thunder',edge:'#b48aff',pre:'☯ '},look:{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'e8b48a',outfit:{top:'ao_trong',bottom:'quan_vai_den',shoes:'giay_den',eyes:'kinh_ram',wrist:'dong_ho'},opts:{mouth:'smile',watch:true}}},
  nm_mem:{name:'Thành viên Nghiện Motion',look:{gender:'nu',hair:'bowl',hairColor:'2a1c16',skin:'f3c4a4',outfit:{top:'hoodie_nm',bottom:'jean',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  gundam:{name:'Gundam (RX-78-2)',look:null},eva:{name:'Evangelion (Unit-01)',look:null}});
ITEMS.gunpla={name:'Mô hình Gunpla RX-78',icon:'gunpla'};

/* ---------- danh hiệu top 10 đại gia (bảng xếp hạng tài sản): hiện óng ánh trên đầu, mỗi hạng 1 hiệu ứng ---------- */
const TOP_TITLES=[{name:'Minh chủ võ lâm',fx:'gold',edge:'#ffd84a'},{name:'Anh lớn Chande',fx:'silver',edge:'#cfe6ff'},{name:'Hai ngón mạnh nhất',fx:'bronze',edge:'#f0a060'},
  {name:'Tứ đại thiên vương',fx:'thunder',edge:'#b48aff'},{name:'Ngũ đại tông môn',fx:'rainbow',edge:'#ff8ad8'},{name:'Lục mạch thần kiếm',fx:'sword',edge:'#7fe0ff'},
  {name:'GOAT',fx:'glitch',edge:'#5fe06a'},{name:'Bát quái thai',fx:'yinyang',edge:'#f4f4f2'},{name:'Cửu trùng thiên',fx:'heaven',edge:'#bfe8ff'},{name:'Thập đại vĩ thú',fx:'fire',edge:'#ff7a1a'}];
/* ---------- 3 map mới: Bearplus Studio (TP.HCM) · VNPT điểm giao dịch (Hà Nội) · Miếu ông Trường Con (Hải Phòng) ---------- */
// Bearplus: studio thiết kế nhỏ ở Khánh Hội, Q.4 ("small team, sharp work, no filler"): web, thương hiệu, 3D & motion, UI/UX; nhân vật trong game là hư cấu
const BEARPLUS={W:34,H:22,level:4,spawn:{x:17,y:20},
  desks:[[4,6.4],[7.4,6.4],[10.8,6.4],[4,10.4],[7.4,10.4],[10.8,10.4]],motion:{x:22.5,y:6.4},render:{x:27,y:6.4},cups:{x:31.2,y:5.2},mood:{x:14.6,y:1.9},
  meet:{x:27,y:15.4},coffee:{x:5,y:15.4},bear:{x:16,y:15.6},head:{scene:'das',x:23.6,y:17.2},
  coffeePrice:25000,gig:{dur:25,vnd:150000,exp:90,max:3},night:{from:22,to:4},sotd:.55,sotdBonus:{vnd:1000000,exp:300}};
const VNPT={W:36,H:24,spawn:{x:18,y:22},kiosk:{x:3.4,y:18.6},charger:{x:3.4,y:13.6,dur:12},counters:[[6,6.6],[11,6.6],[16,6.6],[21,6.6]],board:{x:13.5,y:3.1},sim:{x:26.4,y:6.4},pack:{x:30.4,y:6.6},
  racks:[27,29,31,33],server:{x:30,y:15.2},desks:[[27.5,18.6],[31.5,18.6]],step:6000,
  sims:[{num:'0886.68.68.68',cat:'Lộc phát',price:25000000},{num:'0915.888.999',cat:'Tam hoa kép',price:30000000},{num:'0919.39.79.79',cat:'Thần tài',price:18000000},
    {num:'0943.456.789',cat:'Sảnh tiến',price:12000000},{num:'0812.345.678',cat:'Sảnh 7',price:8000000},{num:'0818.181.818',cat:'Lặp kép',price:6500000},
    {num:'0889.22.11.22',cat:'Gánh đảo',price:2500000},{num:'0911.11.02.97',cat:'Năm sinh',price:900000},{num:'random',cat:'Sim thường',price:50000}],
  // SIM số đẹp mang lộc (mỗi loại 1 công dụng); SIM nào cũng nhắn tin / gọi được cho bạn bè có SIM
  simPerks:{'Lộc phát':{sell:.05,desc:'+5% tiền bán nông sản, cá, đồ cổ'},'Thần tài':{daily:{vnd:39000},desc:'Mỗi ngày vào game nhận 39.000đ lộc thần tài'},'Tam hoa kép':{exp:.05,desc:'+5% EXP mọi việc'},
    'Sảnh tiến':{exp:.03,sell:.03,desc:'+3% EXP, +3% tiền bán hàng'},'Sảnh 7':{exp:.03,desc:'+3% EXP mọi việc'},'Lặp kép':{grab:.2,desc:'Đi Grab rẻ hơn 20%'},'Gánh đảo':{battery:.15,desc:'Pin hao chậm hơn 15%'},
    'Năm sinh':{daily:{exp:30},desc:'Mỗi ngày vào game +30 EXP'},'Sim thường':{desc:'Nhắn tin, gọi điện cho bạn bè'}},sms:{price:500,cd:8},
  packs:{ngay:{name:'Gói ngày D1',price:10000,h:24},tuan:{name:'Gói tuần D7',price:50000,h:168},thang:{name:'Gói tháng D30',price:150000,h:720}},packMul:.6,
  fiber:{price:300000,mul:1.6},keWifi:1.3,
  fiberPts:[{x:49.6,y:86.8,name:'Hộp cáp cạnh lễ tân Ké'},{x:61.5,y:69.6,name:'Cột điện trước Nhà giải trí'},{x:36.5,y:80.6,name:'Hộp cáp cạnh Lều bể bơi'}],
  shift:5,callPay:{vnd:40000,exp:25},shifts:2,
  calls:[['Alo tổng đài ơi, mạng nhà chị chậm quá, xem phim cứ quay vòng vòng!','Chị tắt modem 30 giây rồi bật lại giúp em, em kiểm tra đường truyền ngay ạ','Chị chịu khó xem ít phim thôi ạ','Tại phim dở đấy chị'],
    ['Sao tháng này cước điện thoại của tôi cao thế hả em?','Em kiểm tra chi tiết cước và gửi tin nhắn cho anh ngay ạ','Tại anh gọi người yêu nhiều quá ạ','Do trời mưa anh ạ'],
    ['Cho chị hỏi mật khẩu wifi nhà hàng xóm là gì thế em?','Dạ em không hỗ trợ được ạ, chị đăng ký gói riêng em lắp trong ngày nhé','12345678, chị thử xem','Hàng xóm nhà chị là ai ạ?'],
    ['Điện thoại tôi rơi xuống hồ ở Ké, làm lại SIM được không?','Được ạ, anh mang căn cước ra điểm giao dịch làm lại SIM, giữ nguyên số','Anh lặn xuống hồ tìm thử xem','Anh mua điện thoại chống nước nhé'],
    ['Sim số đẹp 6868 có mang lại may mắn không em?','Dạ số đẹp dễ nhớ, còn may mắn là do mình chăm chỉ anh ạ','Có ạ, trúng xổ số luôn','Không, xui lắm anh'],
    ['Wifi nhà bác cứ tối là yếu, sáng lại khoẻ là sao cháu?','Tối nhiều người dùng, bác đặt modem chỗ thoáng hoặc nâng gói ạ','Wifi cũng cần đi ngủ bác ạ','Chắc nhà bác có ma'],
    ['Chị muốn chặn mấy số gọi quảng cáo làm phiền.','Em đăng ký chặn giúp chị ngay ạ, chị đọc giúp em số đó','Chị đổi số khác đi','Chị nghe máy nói chuyện cho vui'],
    ['Mạng ở Ké Retreat trên núi có sóng không em?','Có ạ, anh kỹ thuật vừa kéo cáp quang lên tận Ké rồi','Trên núi làm gì có sóng','Em chịu ạ'],
    ['Alo... (im lặng, chỉ nghe tiếng thở)','Dạ tổng đài xin nghe, quý khách cần hỗ trợ gì ạ?','Cúp máy luôn','Ai đấy?!'],
    ['Ông Trường Con đây, mạng ở Hải Phòng có nhanh không cháu?','Dạ nhanh lắm ông ạ, cáp quang về tận miếu rồi','Ông hỏi làm gì ạ','Không biết đâu ông'],
    ['Chị nạp nhầm thẻ cho số người khác, lấy lại được không?','Em ghi nhận và hướng dẫn chị liên hệ người nhận ngay ạ','Mất rồi chị ơi','Chị nạp thêm thẻ nữa nhé'],
    ['Em ơi đăng ký 4G thế nào?','Anh ra quầy hoặc soạn tin theo cú pháp gói, em hướng dẫn từng bước ạ','Anh ra quán net cho nhanh','4G là gì ạ?']]};
// Miếu ông Trường Con (Hải Phòng): sân gạch đỏ, cây đa, ao sen; lễ cầu an mùng 6 âm lịch hằng tháng
const MIEU={W:40,H:32,spawn:{x:20,y:29.6},shrine:{x:20,y:9.8},altar:{x:20,y:10.8},burner:{x:20,y:14.6},offer:{x:15.4,y:12.8},fortune:{x:24.6,y:12.6},stele:{x:27.6,y:16.2},
  banyan:{x:7.4,y:17},wish:{x:9.8,y:17.6},gate:{x:20,y:24.6},cart:{x:31.5,y:28.2},tiktok:{x:11.5,y:27.6},stove:{x:24.8,y:27.6},shop:{ga_thit:45000,rau_song:5000,bun:10000},
  incense:{price:10000,dur:5,mul:1.1,min:120,holy:{mul:1.2,min:180}},wishPrice:20000,banhda:{price:35000,energy:25},nem:{price:60000,energy:35},clip:{dur:8,exp:60},
  que:[['Thượng cát','Trời quang mây tạnh đường xa / Gieo hạt hôm nay mai được mùa','good'],['Thượng cát','Thuyền về bến cũ gió êm / Lộc vào cửa trước bình yên cửa sau','good'],
    ['Trung bình','Việc nhỏ làm kỹ thành to / Đừng ham nhanh vội mà lo nhỡ thì','mid'],['Trung bình','Nước chảy đá mòn từ từ / Chăm làm mỗi bữa ắt dư mỗi ngày','mid'],['Trung bình','Có bạn đồng hành vững tâm / Việc khó chia đôi nhẹ phần đôi vai','mid'],
    ['Hạ','Mây che một chút rồi tan / Nghỉ ngơi dăm bữa lại sang đường dài','low'],['Hạ','Đi đâu nhớ mũ, nhớ phanh / Chậm mà chắc chắn còn nhanh hơn liều','low']],
  wishes:{binhan:{name:'Bình an',gift:{energy:30}},tailoc:{name:'Tài lộc',gift:{vnd:60000}},hochanh:{name:'Học hành',gift:{exp:80}},tinhduyen:{name:'Tình duyên',gift:{item:'hoa'}}},
  jokes:['Đi chùa thì phải mặc lịch sự, chứ mặc quần đùi lên đây ông cũng phải cười. Mới Trường Con là như vậy!','Cháu hỏi sao ông nói giọng già? Tại ông tập giọng từ hồi còn bé đấy. Mới Trường Con là như vậy!',
    'Ăn bánh đa cua Hải Phòng mà không húp nước thì coi như chưa về Hải Phòng nhé!','Thắp hương xong thì cất bật lửa vào túi, đừng để quên trên lư hương như ông hôm qua.','Cầu tài lộc thì cũng phải đi làm nữa cháu ạ, ông cầu mãi mà ví vẫn mỏng!',
    'Quay video với ông thì cháu cứ tự nhiên, cười to lên, view nó mới về. Mới Trường Con là như vậy!']};
// lịch âm Việt Nam (thuật toán Hồ Ngọc Đức, múi giờ +7): mùng 1, rằm, mùng 6 là ngày lễ ở miếu
function jdFromDate(dd,mm,yy){ const a=Math.floor((14-mm)/12), y=yy+4800-a, m=mm+12*a-3; let jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045; if(jd<2299161) jd=dd+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-32083; return jd; }
function newMoonJd(k){ const T=k/1236.85, T2=T*T, T3=T2*T, dr=Math.PI/180; let Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3; Jd1+=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*dr);
  const M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3, Mpr=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3, F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
  let C1=(0.1734-0.000393*T)*Math.sin(M*dr)+0.0021*Math.sin(2*dr*M); C1=C1-0.4068*Math.sin(Mpr*dr)+0.0161*Math.sin(dr*2*Mpr); C1=C1-0.0004*Math.sin(dr*3*Mpr); C1=C1+0.0104*Math.sin(dr*2*F)-0.0051*Math.sin(dr*(M+Mpr));
  C1=C1-0.0074*Math.sin(dr*(M-Mpr))+0.0004*Math.sin(dr*(2*F+M)); C1=C1-0.0004*Math.sin(dr*(2*F-M))-0.0006*Math.sin(dr*(2*F+Mpr)); C1=C1+0.0010*Math.sin(dr*(2*F-Mpr))+0.0005*Math.sin(dr*(2*Mpr+M));
  const dt=T<-11?0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3:-0.000278+0.000265*T+0.000262*T2; return Jd1+C1-dt; }
const nmDay=(k,tz)=>Math.floor(newMoonJd(k)+0.5+tz/24);
function sunLong(jdn,tz){ const T=(jdn-2451545.5-tz/24)/36525, T2=T*T, dr=Math.PI/180, M=357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2, L0=280.46645+36000.76983*T+0.0003032*T2;
  let DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(dr*M); DL=DL+(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.000290*Math.sin(dr*3*M); let L=(L0+DL)*dr; L=L-Math.PI*2*Math.floor(L/(Math.PI*2)); return Math.floor(L/Math.PI*6); }
function month11(yy,tz){ const off=jdFromDate(31,12,yy)-2415021, k=Math.floor(off/29.530588853); let nm=nmDay(k,tz); if(sunLong(nm,tz)>=9) nm=nmDay(k-1,tz); return nm; }
function leapOff(a11,tz){ const k=Math.floor((a11-2415021.076998695)/29.530588853+0.5); let last=0, i=1, arc=sunLong(nmDay(k+i,tz),tz); do{ last=arc; i++; arc=sunLong(nmDay(k+i,tz),tz); }while(arc!==last&&i<14); return i-1; }
function lunarDate(ms=Date.now()){ const d=new Date(ms+7*3600e3), dd=d.getUTCDate(), mm=d.getUTCMonth()+1, yy=d.getUTCFullYear(), tz=7, day=jdFromDate(dd,mm,yy), k=Math.floor((day-2415021.076998695)/29.530588853);
  let start=nmDay(k+1,tz); if(start>day) start=nmDay(k,tz); let a11=month11(yy,tz), b11=a11, ly; if(a11>=start){ ly=yy; a11=month11(yy-1,tz); } else { ly=yy+1; b11=month11(yy+1,tz); }
  const ld=day-start+1, diff=Math.floor((start-a11)/29); let leap=0, lm=diff+11; if(b11-a11>365){ const lo=leapOff(a11,tz); if(diff>=lo){ lm=diff+10; if(diff===lo) leap=1; } }
  if(lm>12) lm-=12; if(lm>=11&&diff<4) ly-=1; return {d:ld,m:lm,y:ly,leap}; }
const holyDay=(ms=Date.now())=>{ const l=lunarDate(ms); return l.d===6?'Lễ cầu an mùng 6':l.d===1?'Mùng 1':l.d===15?'Ngày rằm':''; };
const vnptServing=(ms=Date.now())=>100+Math.floor(ms/VNPT.step)%900;

Object.assign(QUESTS,{
  bp_brief:{giver:'bp_lead',title:'Nghe khách brief dự án',desc:'Vào phòng họp kính ở Bearplus, ngồi nghe khách brief website mới (15 giây).',prog:1,reward:{exp:200,vnd:300000}},
  bp_mood:{giver:'bp_lead',after:'bp_brief',title:'Moodboard 3 hướng',desc:'Ghim 3 hướng hình ảnh lên tường moodboard (mỗi lần 6 giây).',prog:3,reward:{exp:220,vnd:300000}},
  bp_wire:{giver:'bp_lead',after:'bp_mood',title:'Wireframe trang chủ',desc:'Ngồi 1 bàn iMac dựng wireframe trang chủ cho khách (20 giây).',prog:1,reward:{exp:260,vnd:400000}},
  bp_3d:{giver:'bp_lead',after:'bp_wire',title:'Render Bé Gấu 3D',desc:'Ra trạm render cùng chị My chạy render Bé Gấu 3D (25 giây).',prog:1,reward:{exp:320,vnd:500000}},
  bp_motion:{giver:'bp_lead',after:'bp_3d',title:'Motion intro 5 giây',desc:'Ở góc motion, làm đoạn intro Bé Gấu vẫy tay chào (20 giây).',prog:1,reward:{exp:320,vnd:500000}},
  bp_aww:{giver:'bp_lead',after:'bp_motion',title:'Nộp Awwwards',desc:'Tới tủ giải thưởng bấm nộp dự án lên Awwwards. Hội đồng chấm: Site of the Day (thưởng thêm 1 triệu + cúp) hay Honorable Mention?',prog:1,reward:{exp:400,vnd:800000}},
  bp_coffee:{giver:'bp_lead',title:'Cà phê cho cả team',desc:'Mua 4 ly cà phê sữa đá ở quầy (25.000đ/ly), mời chị My, Tín, Ngân và Bé Gấu mỗi người 1 ly.',prog:4,reward:{exp:180,vnd:250000}},
  bp_head:{giver:'bp_bear',title:'Bé Gấu mất đầu',desc:'Bé Gấu đi workshop ở DAS về thì để quên cái đầu gấu! Bay vào DAS tìm (cạnh sofa ở sảnh), mang về trả.',need:{dau_gau:1},reward:{exp:260,vnd:400000}},
  bp_fix:{giver:'bp_dev',title:'Fix bug lúc 2 giờ sáng',desc:'Từ 22h tới 4h sáng, ngồi bàn iMac deploy bản vá gấp cho khách (15 giây).',prog:1,reward:{exp:300,vnd:350000}},
  vn_fiber:{giver:'vn_tuan',title:'Kéo cáp quang lên Ké',desc:'Theo anh Tuấn lên Ké Retreat hàn nối 3 hộp cáp quang: cạnh lễ tân, cột điện trước Nhà giải trí, cạnh Lều bể bơi (mỗi hộp 6 giây). Xong thì wifi ở Ké mạnh hơn cho bạn.',prog:3,reward:{exp:300,vnd:400000}},
  vn_call:{giver:'vn_thu',title:'Ca trực tổng đài',desc:'Ngồi bàn tổng đài nghe 5 cuộc gọi, trả lời đúng ít nhất 4 cuộc.',prog:1,reward:{exp:220,vnd:250000}},
  mieu_cauan:{giver:'mieu_tu',title:'Lễ cầu an',desc:'Thắp hương ở lư hương, xin một quẻ ở ống xăm và buộc dải lụa ước nguyện lên cây đa.',prog:3,reward:{exp:200,vnd:200000}},
  tc_luocga:{giver:'truongcon',title:'Luộc gà cúng',desc:'Ông Trường Con nhờ luộc con gà: mua 1 gà làm sẵn ở xe bà Lụa (hoặc mang gà đồi từ Ké), ra bếp củi cạnh xe bánh đa luộc (10 giây).',prog:1,reward:{exp:180,vnd:200000}},
  tc_raubun:{giver:'truongcon',title:'Mua tý rau tý bún',desc:'Ra xe bà Lụa mua tý rau sống với tý bún tươi mang về cho ông.',need:{rau_song:1,bun:1},reward:{exp:120,vnd:150000}},
  tc_antruc:{giver:'truongcon',after:'tc_raubun',title:'Đi ăn trực',desc:'Ông bảo: "Sang 120 Yên Lãng nhà anh Độ ăn trực một bữa, nhớ khen đồ ăn ngon!" Gặp anh Độ chọn Ăn trực.',prog:1,reward:{exp:220,vnd:250000}},
  tc_clip:{giver:'truongcon',title:'Quay TikTok cùng Trường Con',desc:'Đứng trước đèn vòng quay 3 clip hài cùng Trường Con (mỗi clip 8 giây).',prog:3,reward:{exp:250,vnd:300000}}});
NPCS.push({id:'bp_lead',scene:'bearplus',x:17.4,y:8.6,place:'bearplus'},{id:'bp_my',scene:'bearplus',x:28.4,y:8.2,place:'bpstaff'},{id:'bp_dev',scene:'bearplus',x:12.4,y:8.4,place:'bpstaff'},
  {id:'bp_ngan',scene:'bearplus',x:11.6,y:3.8,place:'bpstaff'},{id:'bp_bear',scene:'bearplus',x:16,y:15.6,place:'bpbear',obj:true},
  {id:'vn_hang',scene:'vnpt',x:11,y:5.0,place:'vnpt'},{id:'vn_minh',scene:'vnpt',x:21,y:5.0,place:'vnpt'},{id:'vn_tuan',scene:'vnpt',x:25.6,y:15.8,place:'vntuan'},
  {id:'vn_thu',scene:'vnpt',x:33.6,y:17.4,place:'vnthu'},{id:'vn_guard',scene:'vnpt',x:14.2,y:20.6,place:'vnguard'},
  {id:'mieu_tu',scene:'mieu',x:16.8,y:14.4,place:'mieu'},{id:'truongcon',scene:'mieu',x:13.2,y:27.8,place:'truongcon'},{id:'banhda',scene:'mieu',x:34.4,y:27.4,place:'banhda'});
Object.assign(CLOTHES,{hoodie_bp:{name:'Hoodie Bearplus',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'2b282e',inner:'ff5fa8'}},
  ao_soc_bp:{name:'Áo sọc dọc',slot:'top',price:0,hidden:true,opts:{top:'tee',vstripe:true},colors:{top:'f4f4f2',print:'26262c'}},
  ao_vnpt:{name:'Áo đồng phục VNPT',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'1a6fc4'}},
  ao_kythuat:{name:'Áo khoác kỹ thuật',slot:'top',price:0,hidden:true,opts:{top:'jacket'},colors:{top:'0b5aa8',inner:'f4f4f2'}},
  mu_vnpt:{name:'Mũ lưỡi trai xanh',slot:'head',price:0,hidden:true,opts:{hair:'cap'},colors:{cap:'0b6bc2'}},
  ao_baove:{name:'Áo bảo vệ',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'5a6a4a'}},
  ao_nau:{name:'Áo nâu',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'7a5232'}},
  ao_tc:{name:'Áo sơ mi nâu nhạt',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'b8864a'}},
  mu_trang_tc:{name:'Mũ lưỡi trai trắng',slot:'head',price:0,hidden:true,opts:{hair:'cap'},colors:{cap:'f2f0ea'}},
  quan_vai_den:{name:'Quần vải đen',slot:'bottom',price:0,hidden:true,opts:{bottom:'pants'},colors:{pants:'2a2420'}}});
Object.assign(NPC_LOOKS,{
  bp_lead:{name:'Anh Khoa (Creative Director · Bearplus)',look:{gender:'nam',hair:'fade',hairColor:'1c1820',skin:'e0a882',outfit:{top:'tee_den',bottom:'jean',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  bp_my:{name:'Chị My (3D & Motion · Bearplus)',look:{gender:'nu',hair:'bowl',hairColor:'e86a9a',skin:'f3c4a4',outfit:{top:'hoodie_bp',bottom:'jean',shoes:'giay_trang'},opts:{mouth:'smile'}}},
  bp_dev:{name:'Tín (Front-end Dev · Bearplus)',look:{gender:'nam',hair:'messy',hairColor:'2a2420',skin:'e8b48a',outfit:{top:'tee_xanh',bottom:'short_xam',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  bp_ngan:{name:'Ngân (Brand Designer · Bearplus)',look:{gender:'nu',hair:'bun',hairColor:'3a2418',skin:'f3c4a4',outfit:{top:'ao_soc_bp',bottom:'vay_den',shoes:'giay_den'},opts:{mouth:'smile'}}},
  bp_bear:{name:'Bé Gấu Plus (linh vật)',look:null},
  vn_hang:{name:'Chị Hằng (giao dịch viên · quầy 2)',look:{gender:'nu',hair:'bun',hairColor:'2a1c16',skin:'f3c4a4',outfit:{top:'ao_vnpt',bottom:'vay_den',shoes:'giay_den'},opts:{mouth:'smile'}}},
  vn_minh:{name:'Anh Minh (giao dịch viên · quầy 4)',look:{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'e0a882',outfit:{top:'ao_vnpt',bottom:'quan_vai_den',shoes:'giay_den'},opts:{mouth:'smile'}}},
  vn_tuan:{name:'Anh Tuấn (kỹ thuật cáp quang)',look:{gender:'nam',hair:'cap',hairColor:'1c1820',skin:'d8986e',outfit:{top:'ao_kythuat',bottom:'jean',shoes:'giay_den',head:'mu_vnpt'},opts:{mouth:'smile'}}},
  vn_thu:{name:'Chị Thu (trưởng ca tổng đài)',look:{gender:'nu',hair:'long',hairColor:'2a1c16',skin:'f3c4a4',outfit:{top:'ao_vnpt',bottom:'vay_den',shoes:'giay_den',eyes:'kinh_can'},opts:{mouth:'smile'}}},
  vn_guard:{name:'Bác bảo vệ',look:{gender:'nam',hair:'buzz',hairColor:'9a9a9a',skin:'d8986e',outfit:{top:'ao_baove',bottom:'quan_vai_den',shoes:'giay_den'}}},
  mieu_tu:{name:'Ông Từ (giữ miếu)',look:{gender:'nam',hair:'bald',hairColor:'d8d8d8',skin:'d8a070',outfit:{top:'ao_nau',bottom:'quan_vai_den',shoes:'giay_den'}}},
  truongcon:{name:'Ông Trường Con',look:{gender:'nam',hair:'cap',hairColor:'1c1820',skin:'e8b48a',outfit:{top:'tee_do',bottom:'jean',shoes:'giay_trang',head:'mu_trang_tc',eyes:'kinh_ram',neck:'day_vang',wrist:'dong_ho'},opts:{beard:'mustache',tattoo:true,watch:true}}},
  vn_caller:{name:'Khách gọi tổng đài',look:{gender:'nu',hair:'ponytail',hairColor:'3a2418',skin:'f3c4a4',outfit:{top:'tee_hong',bottom:'jean',shoes:'giay_trang'},opts:{mouth:'smile'}}},
  banhda:{name:'Bà Lụa (bánh đa cua Hải Phòng)',look:{gender:'nu',hair:'bun',hairColor:'8a8a8a',skin:'e0a882',outfit:{top:'somi_hoa',bottom:'quan_vai_den',shoes:'giay_den'},opts:{mouth:'smile'}}}});
Object.assign(ITEMS,{bun:{name:'Bún tươi',icon:'dish'},cafe_bp:{name:'Cà phê sữa đá Bearplus',icon:'cafe'},dau_gau:{name:'Đầu Bé Gấu',icon:'bearhead'},cup_sotd:{name:'Cúp Site of the Day',icon:'cup'},banh_da_cua:{name:'Bánh đa cua Hải Phòng',icon:'bowl'}});

/* ---------- Giữ chân người chơi (học từ game mobile, Stardew Valley, Animal Crossing) ----------
   Điểm danh 7 ngày: vào game mỗi ngày nhận quà, quà to dần, ngày 7 mở Rương vàng; lỡ 1 ngày thì quay lại ngày 1.
   Việc mỗi ngày: 3 việc nhỏ đổi lúc 0h giờ VN (mỗi người một bộ khác nhau), xong đủ 3 việc mở Rương ngày.
   Sổ sưu tầm: lần đầu có 1 món là đánh dấu vào sổ; đủ một bộ nhận thưởng lớn.
   Sự kiện mùa: Lễ hội Bí ngô (20/10 – 3/11 hằng năm), bí ngô mọc rải khắp Ké & Đà Lạt, đổi quà với Cô Bí Ngô. */
const LOGIN7=[{vnd:30000,label:'30K'},{items:{hat_rau_muong:3},label:'3 hạt rau muống'},{vnd:60000,exp:40,label:'60K · 40 EXP'},{items:{trung:2,nam:2},label:'Trứng & nấm'},
  {vnd:120000,label:'120K'},{items:{khoga:1},exp:80,label:'Khô gà · 80 EXP'},{vnd:300000,exp:150,chest:true,label:'Rương vàng'}];
const DAYQ={n:3,pool:{
  fish:{name:'Câu được 3 con cá',goal:3,rw:{vnd:60000,exp:40},lv:2},
  harvest:{name:'Thu hoạch 4 lần ngoài vườn',goal:4,rw:{vnd:60000,exp:40}},
  forage:{name:'Hái 4 món hoa lá, rau rừng',goal:4,rw:{vnd:50000,exp:35}},
  bug:{name:'Bắt 2 con bướm',goal:2,rw:{vnd:60000,exp:40},item:'vot_buom'},
  money:{name:'Kiếm được 300.000đ',goal:300000,rw:{exp:60}},
  exp:{name:'Nhận 250 EXP',goal:250,rw:{vnd:80000}},
  meal:{name:'Ăn đủ 3 bữa trong ngày',goal:3,rw:{vnd:50000,exp:50}},
  grab:{name:'Đi Grab 2 chuyến',goal:2,rw:{vnd:60000,exp:30}},
  photo:{name:'Chụp 2 tấm ảnh check-in',goal:2,rw:{vnd:40000,exp:40}},
  pickle:{name:'Đánh 1 trận pickleball',goal:1,rw:{vnd:80000,exp:60},skill:'pickle'},
  treasure:{name:'Vớt 1 món đồ cổ dưới hồ',goal:1,rw:{vnd:70000,exp:50},lv:3},
  pumpkin:{name:'Nhặt 5 quả bí ngô',goal:5,rw:{vnd:60000,exp:50},season:'halloween'}},
  chest:{vnd:[120000,320000],exp:120,items:['khoga','hat_ca_chua','nam','trung','dong_xu_co']}};
const ALBUM={
  ca:{name:'Cá',items:[...new Set(['fish',...Object.keys(FISH),...Object.keys(DL_FISH)])],rw:{vnd:300000,exp:200}},
  buom:{name:'Bướm',items:Object.keys(BUTTERFLY.kinds).map(k=>'buom_'+k),rw:{vnd:400000,exp:300}},
  vuon:{name:'Nông sản',items:Object.keys(CROPS),rw:{vnd:300000,exp:200}},
  rung:{name:'Lộc rừng',items:['hoa','la','mang','rau','trung','nam'],rw:{vnd:150000,exp:120}},
  co:{name:'Đồ cổ dưới hồ',items:Object.keys(TREASURE.items),rw:{vnd:500000,exp:300}},
  hp:{name:'Quà Halloween',items:['bi_ngo','mu_phuthuy','ao_bingo','den_bingo'],rw:{vnd:250000,exp:200}},
  ky:{name:'Kỷ vật Bearplus · Hải Phòng',items:['cafe_bp','dau_gau','cup_sotd','banh_da_cua'],rw:{vnd:300000,exp:250},
    hints:{cafe_bp:'Bay vào Bearplus Studio (TP.HCM, từ cấp 3), mua 1 ly ở quầy cà phê (25.000đ)',dau_gau:'Nhận việc "Bé Gấu mất đầu" với Bé Gấu ở Bearplus, rồi bay vào DAS nhặt đầu gấu cạnh sofa ở sảnh',
      cup_sotd:'Làm chuỗi việc của anh Khoa ở Bearplus tới bước "Nộp Awwwards", bấm tủ giải. Chưa được Site of the Day thì mỗi ngày nộp lại 1 lần',banh_da_cua:'Ra Miếu (Hải Phòng), ăn 1 bát bánh đa cua ở xe bà Lụa gần cổng'}}};
// ô đặt bí ngô: chỉ ô cỏ / đường đi được (sinh từ bản đồ), mỗi giờ VN đổi bộ ô
const SEASON={halloween:{name:'Lễ hội Bí ngô',from:'10-20',to:'11-03',perHour:{retreat:12,dalat:5},
  spots:{retreat:[[181.5,118.6],[239.5,72.6],[202.5,75.6],[161.5,49.6],[124.5,63.6],[280.5,36.6],[39.5,118.6],[95.5,70.6],[261.5,62.6],[131.5,71.6],[274.5,42.6],[106.5,84.6],[226.5,7.6],[46.5,78.6],[178.5,71.6],[113.5,93.6],[225.5,40.6],[85.5,83.6],[216.5,83.6],[39.5,36.6],[330.5,104.6],[331.5,80.6],[92.5,119.6],[193.5,74.6],[171.5,102.6],[113.5,16.6],[276.5,81.6],[263.5,21.6],[189.5,84.6],[229.5,88.6],[12.5,9.6],[254.5,7.6],[162.5,21.6],[57.5,29.6],[196.5,82.6],[85.5,63.6],[22.5,22.6],[140.5,36.6],[45.5,41.6],[138.5,83.6],[282.5,77.6],[267.5,7.6],[261.5,47.6],[305.5,73.6],[317.5,27.6],[86.5,39.6]],
    dalat:[[51.5,27.6],[65.5,23.6],[31.5,46.6],[35.5,61.6],[23.5,40.6],[42.5,21.6],[17.5,51.6],[36.5,13.6],[21.5,7.6],[34.5,22.6],[10.5,5.6],[40.5,43.6],[4.5,35.6],[5.5,61.6]]},
  // đèn bí ngô trang trí quanh cổng Ké, sáng lập loè buổi tối
  decor:[[36.6,95.2],[42.6,95.2],[33.4,90.6],[45.8,90.6],[39.5,86.8],[52.6,93.6],[28.6,93.4]],
  shop:[{id:'keo',name:'Túi kẹo Halloween',cost:5,rw:{vnd:80000,exp:60},again:true,desc:'80.000đ + 60 EXP, đổi bao nhiêu lần cũng được'},
    {id:'mu',name:'Mũ tím phù thuỷ',cost:12,cloth:'mu_phuthuy',desc:'Mũ tím đội đi chơi lễ, mặc trong Tủ đồ'},
    {id:'ao',name:'Áo bí ngô chấm bi',cost:20,cloth:'ao_bingo',desc:'Áo cam chấm bi đen, chỉ có mùa lễ'},
    {id:'den',name:'Đèn bí ngô theo chân',cost:30,item:'den_bingo',desc:'Quả bí ngô phát sáng lon ton theo sau bạn, ai cũng thấy'}]}};
function seasonOn(id,ms=Date.now()){ const z=SEASON[id]; if(!z) return false; const md=realTime(ms).day.slice(5); return z.from<=z.to?md>=z.from&&md<=z.to:md>=z.from||md<=z.to; }
// bộ bí ngô đang mọc trong giờ hiện tại (giống nhau ở mọi máy)
function pumpkinsNow(scene,ms=Date.now()){ const z=SEASON.halloween, sp=z.spots[scene], n=z.perHour[scene]; if(!sp||!seasonOn('halloween',ms)) return {hour:0,list:[]};
  const hour=Math.floor((ms+RULES.tzOffsetH*3600e3)/3600e3), idx=sp.map((p,i)=>[i,((Math.imul(hour+1,2654435761)^Math.imul(i+7,40503))>>>0)%9973]).sort((a,b)=>a[1]-b[1]).slice(0,n).map(a=>a[0]);
  return {hour,list:idx.map(i=>({i,x:sp[i][0],y:sp[i][1]}))}; }
ITEMS.bi_ngo={name:'Bí ngô',icon:'pumpkin'}; ITEMS.den_bingo={name:'Đèn bí ngô theo chân',icon:'jack'}; ITEMS.mu_phuthuy={name:'Mũ tím phù thuỷ',icon:'hat'}; ITEMS.ao_bingo={name:'Áo bí ngô chấm bi',icon:'pumpkin'};
CLOTHES.mu_phuthuy={name:'Mũ tím phù thuỷ',slot:'head',price:0,hidden:true,opts:{hair:'cap',capPattern:true},colors:{cap:'5b2a86'}};
CLOTHES.ao_bingo={name:'Áo bí ngô chấm bi',slot:'top',price:0,hidden:true,opts:{top:'tee',polka:true},colors:{top:'e8742a',print:'2b1a2e'}};
CLOTHES.ao_phuthuy={name:'Áo choàng tím',slot:'top',price:0,hidden:true,opts:{top:'long'},colors:{top:'4a2470'}};
NPCS.push({id:'bingo',scene:'retreat',x:44.2,y:93.6,place:'bingo',season:'halloween'});
NPC_LOOKS.bingo={name:'Cô Bí Ngô (Lễ hội Halloween)',look:{gender:'nu',hair:'long',hairColor:'2b1a2e',skin:'f3c4a4',outfit:{top:'ao_phuthuy',bottom:'vay_den',shoes:'giay_den',head:'mu_phuthuy'},opts:{mouth:'smile'}}};

return {T,RULES,LOOK,SLOTS,CLOTHES,FOOD,CROPS,FARM,PLACES,INTERIORS,CLUB,ITEMS,SKILLS,QUESTS,DAILY,FISH,KAYAK_PRICE,KAYAK_MIN,CAR_PRICE,TREASURE,FISHING,NPCS,NPC_LOOKS,PICKUPS,SPOTS,COINS,FORAGE,
  KAYAK_SPOT,BUOYS,CARS,BEAGLE_SPOT,CHICKEN_HOME,LAKE_Y,SPAWN,SOCIAL,ROOMS,BATHHOUSE,POOL,ACH,KE_JOB,WHEELIE,BIKES,SONGS,DANCE,RECEPTION,NEEDS,ROOM_ACTS,PHOTO_SPOTS,TRAVEL,JOB,WORK_TASKS,OFFICE_PERKS,WORK_WORDS,INTERVIEW,INTERVIEW_PICK,INTERVIEW_PASS,OFFICE,
  lvSpeed,OPTIMUS,MEGATRON,MCK,WILDLIFE,FOLLOWERS,OII,SHISHA,NPC_ROAM,roamPos,PIG_STEAL,LUMEN,DIEP,YENLANG,PICKLE,PK_SETS,DALAT,DL_FARM,DL_LAND,KE_LAND,MOTO,BIKESHARE,CSGT,PCAR,PARK,MUSEUM,TEMPLE,NETCAFE,BUTTERFLY,LO,DOGS,DAS,KE_YARD,ANIMALS,FEED,INGREDIENTS,RECIPES,COOK,DL_FISH,HORSE,CRATES,RACE,SELL,DEST,GRAB,grabFare,COURSES,MARKET,ACTS,ACT_DUR,FL,SCENE_DEST,SCENE_SIZE,
  MU,muStats,muPower,mythOf,mythIdx,ENH,enhKind,shoeSpeed,DUONGVU,dvWhere,LAVI,HW_SETS,LC_TYPES,LC_EFF,LC_MOVES,LC_TYPE_MOVES,LC_SPECIES,LINHCAT,lcStats,lcMoves,lcNext,lcWild,RF,NMOTION,GUARD,TOP_TITLES,BEARPLUS,VNPT,MIEU,lunarDate,holyDay,vnptServing,LOGIN7,DAYQ,ALBUM,SEASON,seasonOn,pumpkinsNow,vnTime,WEEKDAYS,mealStatus,hunger,levelOf,fmt,plotState,lookToTemplate,gameMs,realTime,addDays,dayOfWeek,isWeekend,dailyTasks,otTask};
});
