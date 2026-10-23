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
  levels:[0,100,250,450,700,1000,1400,2000,2700,3500,4500,6000,8000],maxLevel:1000,   // 13 cấp đầu giữ nguyên, từ cấp 14 nối tiếp tới cấp tối đa 1000 (ngay dưới RULES)
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
    {id:'vnpt',name:'Đồng phục VNPT',items:{top:'polo_vnpt',bottom:'quan_vai_den',shoes:'giay_den'},nu:{top:'polo_vnpt',bottom:'vay_den',shoes:'giay_den'}},   /* polo xanh dương cổ + viền tay trắng, logo VNPT */
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
  polo_vnpt:{name:'Áo polo đồng phục VNPT',slot:'top',price:250000,opts:{top:'tee',polo:true,logo:true},colors:{top:'1f5fcf',print:'f4f6fa',line:'153f8a'}},
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
// đất: thuê theo ngày (price) hoặc mua đứt (buy = 30 ngày thuê, không trừ tiền hằng ngày); đất mua đứt bán lại cho chính NPC đó được sellBack (70% giá mua)
const landDeal=L=>{ for(const t of L){ t.buy=t.price*30; t.sellBack=Math.round(t.buy*.7); } };
landDeal(KE_LAND);
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
  phongbay:{name:'Phòng Bay',where:'phố Đà Bắc, cạnh đường Hà Phạm',door:{x:184.1,y:64.7},scene:'phongbay'},
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
    {id:'p1',game:'poker',name:'Bàn poker bình dân',x:13,y:5.5,stakes:'thuong'},{id:'p2',game:'poker',name:'Bàn poker VIP',x:13,y:11,stakes:'vip'},
    {id:'w1',game:'masoi',name:'Bàn ma sói',x:20.5,y:8.5},
  ],
  chess:{bets:[0,20000,50000,100000,200000,500000],clock:300,winExp:40,drawExp:10},
  poker:{small:5000,big:10000,minBuy:100000,maxBuy:2000000,seats:6,turn:25},
  pokerStakes:{thuong:{name:'Bình dân'},vip:{name:'VIP',small:25000,big:50000,minBuy:500000,maxBuy:10000000}},   /* mỗi bàn poker 1 mức mù riêng */
  masoi:{fees:[0,20000,50000,100000],min:5,max:10,night:35,day:75,vote:30,hunt:20,winExp:50,loseExp:10},
  // bot tiếp khách khi không có người: bot cờ, bot poker, quản trò ma sói (trả tiền nhờ tìm người; thắng ăn pot ×1,5 vì nhà cái bù tiền cho bot)
  // câu cửa miệng của Tú Sena khi ngồi bàn poker
  tuSena:{name:'Tú Sena',join:'Mến chào các con vợ!',raise:'Chan bố mày đê!',fold:'Em Tú sợ đi bệnh viện lắm...',win:'Em Tú chơi để có tiền đóng viện phí cho các bác sĩ!'},
  bots:{masoiHire:80000,masoiSize:8,masoiBonus:1.5,pokerBots:3,pokerChips:300000,names:['Bot Tèo','Bot Tí','Bot Sửu','Bot Dần','Bot Mão','Bot Thìn','Bot Tỵ','Bot Ngọ','Bot Mùi']},
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
/* Nhà giải trí ở mọi map (25/10): mỗi map có 1 cửa vào cùng 1 Nhà giải trí (chung bàn cờ, poker, ma sói), ra cửa thì về đúng map đã vào (p.clubFrom) */
const CLUB_DOORS={dalat:{x:34.5,y:53.7},mu:{x:78.5,y:54.7},epl:{x:74.5,y:50.7},mieu:{x:12.5,y:21.7},das:{x:10.5,y:16.7},bearplus:{x:11.5,y:14.7},lavi:{x:5.5,y:19.7},vnpt:{x:20.5,y:17.7},
  lumen:{x:19.5,y:27.7},everfit:{x:2.5,y:14.7},yenlang:{x:7.5,y:15.7},nghienmotion:{x:21.5,y:12.7},pickle:{x:9.5,y:21.7}};
for(const [m,d] of Object.entries(CLUB_DOORS)) PLACES['club_'+m]={name:'Nhà giải trí',where:'cửa vào Nhà giải trí',map:m,door:{x:d.x,y:d.y},scene:'club',booth:1};
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
const KAYAK_SPOT={x:47.6,y:99.6}, BUOYS=[[27,104.5],[33,108],[40,109.5],[50,107],[58,107.5]];   /* phao 5 dời xuống nước (chỗ cũ bị bãi đỗ xe lấn ra hồ) */
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
   Học "Huấn luyện Lính Cát" ở Trung tâm Lính Cát (cạnh Khu tâm linh, phía Đông chùa Đà Bắc), chọn 1 trong 3 con khởi đầu.
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
  door:{x:171,y:45.7},at:{nurse:[12,6],starter:[5.4,9.8],box:[20.4,5.4],shop:[20.4,10.2]},
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
/* ---------- Lính Cát nâng cấp ----------
   · hồi máu ở quầy y tá tốn tiền: base + perLv × tổng cấp cả đội · Trung tâm Lính Cát thứ 2 ở quảng trường MU (y tá, kệ hàng, máy gửi giữ)
   · Sách Kinh Nghiệm: +1 / +5 cấp (lên đủ cấp thì tự tiến hoá, học chiêu như khi thắng trận)
   · ăn Ngọc Cường Hoá: +1 → +12, mỗi cấp +6% mọi chỉ số; tỉ lệ như khắc đồ (ENH.rate), Ngọc Huyền Thoại 80%; thất bại mất ngọc
   · Đền Lính Cát Huyền Thoại (MU): đập 1 Ngọc Ước Nguyện + 1 Ngọc Tâm Linh + 1 Ngọc Hỗn Nguyên → dạng huyền thoại (×1,35 chỉ số, hào quang vàng)
     + kỹ năng tự động theo hệ khi ở MU: mỗi `every` giây đánh boss / quái gần chủ (mul × công), kèm hiệu ứng: heal / mp (% máu / mana chủ), drain (hút sát thương về chủ),
     chain (giật lan thêm n quái), slow (làm chậm giây), shield (tăng thủ chủ giây) */
LINHCAT.heal={base:3000,perLv:300};
LINHCAT.enh={per:.06}; LINHCAT.myth={cost:{ngoc_uoc:1,ngoc_tam_linh:1,ngoc_hon_nguyen:1},mul:1.35,every:1.4,base:2};
LINHCAT.books={sach_kn:1,sach_kn5:5};
Object.assign(LINHCAT.shop,{sach_kn:80000,sach_kn5:350000});
Object.assign(ITEMS,{sach_kn:{name:'Sách Kinh Nghiệm Lính Cát (+1 cấp)',icon:'book_kn'},sach_kn5:{name:'Đại Sách Kinh Nghiệm (+5 cấp)',icon:'book_kn5'}});
LINHCAT.mythSkill={thuong:{name:'Đột Kích Thần Tốc',mul:1.8},hoa:{name:'Hoả Thần Phún',mul:2.3},thuy:{name:'Thuỷ Triều Hồi Sinh',mul:1.3,heal:.08},moc:{name:'Hồi Xuân Vạn Mộc',mul:1.1,heal:.12},
  loi:{name:'Lôi Xích Liên Hoàn',mul:1.5,chain:3},tien:{name:'Phúc Lành Tiên Giới',mul:1.1,heal:.06,mp:.15},ma:{name:'Hấp Hồn Âm Phủ',mul:1.6,drain:.5},long:{name:'Long Thần Nộ',mul:2.4},
  bang:{name:'Băng Phong Tuyệt Địa',mul:1.5,slow:3},am:{name:'Hắc Ám Nuốt Chửng',mul:1.7,drain:.3},than:{name:'Thần Uy Tâm Linh',mul:2,mp:.1},trung:{name:'Bầy Đàn Cuồng Nộ',mul:1.3,chain:2},
  bay:{name:'Cuồng Phong Thiên Không',mul:1.6,chain:2},doc:{name:'Độc Vụ Hủ Thực',mul:1.9},da:{name:'Thạch Giáp Hộ Thân',mul:1.3,shield:4},vo:{name:'Quyền Vương Liên Kích',mul:2.1}};
// kỹ năng siêu huyền thoại của 3 thần thú (đầu đội, ở MU): đánh mỗi every giây, aoe: trúng mọi quái / boss trong aoe ô quanh mục tiêu; chain: giật lan n con; team: hồi máu cả đội gần
LINHCAT.superSkill={lc_raikou:{name:'Siêu Lôi Thần Giáng Thế',mul:4,chain:6,slow:1.5,every:1},lc_entei:{name:'Siêu Hoả Diệm Sơn',mul:5,aoe:3.5,every:1.2},
  lc_suicune:{name:'Siêu Cực Quang Băng Hà',mul:3.5,aoe:3,slow:2,heal:.12,team:6,every:1.2}};
LINHCAT.badge={item:'huy_hieu_pepe',choices:['lc_raikou','lc_suicune','lc_entei'],lv:30};
const lcHealFee=party=>LINHCAT.heal.base+LINHCAT.heal.perLv*party.reduce((a,m)=>a+m.lv,0);
NPCS.push({id:'mu_lc',scene:'mu',x:37.5,y:18.2,place:'mulc'},{id:'mu_lctemple',scene:'mu',x:29,y:26.8,place:'mulctemple'});
Object.assign(NPC_LOOKS,{mu_lc:{name:'Chị Y tá Cát MU (Trung tâm Lính Cát)',look:{gender:'nu',hair:'bun',hairColor:'ff8ab8',skin:'f6d2b8',outfit:{top:'ao_bep_haky',bottom:'kaki',shoes:'giay_trang'},opts:{mouth:'smile'}}},
  mu_lctemple:{name:'Thủ Đền Lính Cát Huyền Thoại',look:{gender:'nam',hair:'long',hairColor:'f4f0e0',skin:'e8c4a0',outfit:{top:'mu_dw',bottom:'kaki',shoes:'giay_den'},opts:{beard:'full'}}}});
LINHCAT.maps={retreat:{spots:LINHCAT.spots},
  dalat:{spots:[[25.5,3.5,2],[13.5,13.5,1],[49.5,13.5,2],[61.5,5.5,2],[5.5,5.5,1]],pool:['sau_nhi','ken_cat','buom_tien','cu_nhi','hoa_hoi','bong_bong','se_nhi','cat_con','mam_nhi']},
  mieu:{spots:[[3.5,3.5,2],[33.5,7.5,2],[13.5,27.5,1]],pool:['khoi_nhi','bong_ma_binh','niem_nhi','doi_nhi','chuot_nhi','ran_nhi','niem_nhi']},
  deo:{spots:[[31.5,5.5,3],[91.5,5.5,3],[151.5,5.5,3],[211.5,5.5,3]],pool:['da_nhi','da_lan','vo_nhi','vo_si','se_nhi','chim_ung','rong_nhi','ran_nhi','da_nhi']},
  // rừng MU: hàng khu đầu vùng 1, giữa vùng 2, cuối vùng 3 (có thể gặp huyền thoại), đứng giữa 2 ổ quái phía trên
  mu:{spots:[[16.5,34.5,1],[48,34.5,1],[79,34.5,2],[16.5,47.5,2],[48,47.5,2],[79,47.5,3],[16.5,60.5,3],[48,60.5,3],[79,60.5,3]]}};   // không thả ở trường đua (đang đua ngựa)
// cân bằng sức mạnh: mọi loài (trừ vật nuôi / thú rừng) đưa tổng chỉ số gốc về cùng mức theo bậc tiến hoá, giữ nguyên dáng chỉ số của loài
// (bậc 1: 300 · bậc 2 còn tiến hoá: 405 · bậc 2 cuối dòng: 450 · bậc 3: 500 · huyền thoại: 580, vượt trội hẳn)
// tiến hoá kiểu Pokemon: cấp 25 lên dạng 3 (trước 28–40). Chuỗi nào dạng 1 tiến hoá muộn (từ cấp 22) thì dời về cấp 16 cho kịp;
// 4 loài chỉ có 2 dạng (Chuột, Hổ Mang, Dơi, Long Ngư) có thêm dạng 3 mới
Object.assign(LC_SPECIES,{chuot_vuong:{name:'Chuột Vương',t:'thuong',st:3,b:[75,100,80,110],rate:.05},mang_xa:{name:'Mãng Xà Vương',t:'doc',st:3,b:[85,110,90,95],rate:.05},
  da_doi:{name:'Dạ Dơi Vương',t:'doc',st:3,b:[90,95,80,115],rate:.05},hai_long:{name:'Hải Long Vương',t:'thuy',st:3,b:[100,130,90,85],rate:.04},
  // 3 thần thú siêu huyền thoại: chỉ có khi dùng Huy Hiệu Pepe (hạ Pepe ở Làng Meme), chọn 1 trong 3. sl: chỉ số ×15 so với Lính Cát thường
  lc_raikou:{name:'Lôi Thần Thú (Raikou)',t:'loi',st:3,legend:1,sl:15,b:[90,85,75,115],rate:0,desc:'Mây giông trên lưng, gầm một tiếng là sấm sét giáng xuống.'},
  lc_entei:{name:'Hoả Thần Thú (Entei)',t:'hoa',st:3,legend:1,sl:15,b:[115,115,85,100],rate:0,desc:'Mỗi lần gầm là một ngọn núi lửa phun trào.'},
  lc_suicune:{name:'Thuỷ Thần Thú (Suicune)',t:'thuy',st:3,legend:1,sl:15,b:[100,75,115,85],rate:0,desc:'Chạy trên mặt nước, gió bắc theo sau, nước đục hoá trong.'}});
// lời giới thiệu cho Poke Deck (loài nào chưa có desc)
{ const D={hoa_binh:'Thằn lằn lửa tuổi teen, cáu lên là phun lửa, móng cào cháy xém cỏ.',hoa_tuong:'Rồng lửa đầu đàn, cánh rộng che cả sân Ké, hơi thở nóng chảy đá.',
  la_binh:'Ếch lá trưởng thành, nụ hoa trên lưng sắp nở, đi đâu cũng thơm mùi cỏ.',moc_tuong:'Cây đại thụ biết đi, hoa trên lưng nở rộ, rễ quật như roi.',
  thuy_binh:'Rùa nước tai lông xù, lặn giỏi nhất hồ Hoà Bình.',thuy_tuong:'Rùa pháo thủ, hai nòng nước trên mai bắn thủng cả vách đá.',
  set_binh:'Chuột điện đuôi tia chớp, chạy nhanh như sét đánh ngang tai.',loi_tuong:'Tướng sét lông vàng rực, tích điện cả đêm giông rồi tung đòn sấm.',
  bong_hong:'Cục bông biết bay, giọng hát ru cả xóm ngủ say.',tien_bong:'Tiên bông cánh hồng, rắc phấn tiên chữa lành vết thương cho cả đội.',
  bong_ma_binh:'Bóng ma tinh nghịch hay nấp sau lưng người đi đêm rồi doạ "hù".',quy_tuong:'Quỷ bóng cười toe toét, nuốt luôn cái bóng của đối thủ.',
  rong_may:'Rồng con đã biết cưỡi mây, vảy xanh óng ánh sau mưa.',long_vuong:'Vua rồng cát, bay một vòng quanh Ké chỉ mất một nhịp tim.',
  cat_hoa:'Cát Con chạm Đá Lửa: lông đỏ rực, hắt hơi ra tia lửa.',cat_thuy:'Cát Con chạm Đá Nước: đuôi vây cá, bơi lặn như rái cá.',cat_loi:'Cát Con chạm Đá Sấm: lông dựng đứng tích điện, chạm vào là giật.',
  cat_la:'Cát Con chạm Đá Lá: tai lá non, nằm phơi nắng là khoẻ lại.',cat_bang:'Cát Con chạm Đá Băng: lông xanh ngọc, thở ra hơi sương lạnh.',cat_tien:'Cát Con chạm Đá Tiên: ruy băng hồng quấn người, ai nhìn cũng mềm lòng.',
  cat_nguyet:'Cát Con chạm Đá Trăng: vòng sáng vàng trên lông đen, săn mồi trong bóng tối.',cat_than:'Cát Con chạm Đá Tâm Linh: đọc được suy nghĩ, đoán trước đòn đánh.',
  lon:'Lợn nhà béo tròn ở sân Ké, đói là chạy loạn khắp sân.',bo:'Bò vàng hiền lành của trại, nhưng húc một phát là nhớ đời.',ga:'Gà ri gáy sáng đúng giờ, mổ ai lạ vào sân.',vit:'Vịt cỏ lội ao cả ngày, bơi giỏi hơn chạy.',
  huou:'Hươu sao của vườn quốc gia, thú bảo tồn: đấu xong dễ bị kiểm lâm bắt.',raica:'Rái cá ven suối vườn quốc gia, bắt cá khéo nhất vùng, là thú bảo tồn.',gau:'Gấu ngựa ngực có vầng trăng trắng, thú bảo tồn khoẻ như voi.',
  voc:'Voọc leo cây thoăn thoắt, thú bảo tồn quý hiếm của vườn quốc gia.',ken_cat:'Kén cát cứng như vỏ sò, nằm im chờ ngày hoá bướm.',buom_tien:'Bướm tiên cánh óng, rắc phấn ngủ khắp cánh đồng.',
  chim_ung:'Chim ưng mắt tinh, từ trên trời thấy cả con kiến dưới cỏ.',dai_bang:'Đại bàng cát sải cánh che nắng, lao xuống nhanh như mũi tên.',chuot_tuong:'Chuột tướng răng cửa to, gặm đứt cả dây phơi đồ.',
  chuot_vuong:'Chuột vương ria dài, cả bầy chuột trong vùng nghe lệnh.',ho_mang:'Hổ mang cát bành mang doạ đối thủ, nọc độc làm tê tay.',mang_xa:'Mãng xà vương dài như con đường làng, siết một vòng là hết thở.',
  doi_dem:'Dơi đêm bay không một tiếng động, hút sinh lực đối thủ.',da_doi:'Dạ dơi vương cánh như áo choàng, đêm trăng tròn mới lộ mặt.',da_lan:'Đá lăn tròn xuống dốc đèo, va vào là mẻ đầu.',
  nui_da:'Núi đá biết đi, đứng yên thì tưởng một hòn non bộ.',vo_si:'Võ sĩ cát tập quyền mỗi sáng ở sân lửa trại.',vo_tuong:'Võ lâm tướng đai đen, một quyền phá đôi tảng đá.',
  long_ngu:'Cá chép vượt vũ môn thành long ngư, vây vàng như lửa.',hai_long:'Hải long vương cuộn sóng, gầm lên là hồ Hoà Bình nổi bão.',niem_su:'Niệm sư bẻ cong thìa bằng ý nghĩ, nhìn ai người đó nhức đầu.',
  dai_niem:'Đại niệm sư thiền định bay lơ lửng, thấy trước tương lai ba giây.',hoa_hoi:'Hoa hôi nở toang, mùi hôi khiến đối thủ chảy nước mắt.',hoa_doc:'Hoa độc tướng to như cái ô, phấn hoa làm cả trận tê liệt.'};
  for(const [k,d] of Object.entries(D)) if(LC_SPECIES[k]&&!LC_SPECIES[k].desc) LC_SPECIES[k].desc=d; }
/* Lính Cát dưới nước (24/10): cá, hải sản, rồng nước chỉ sống ở sông hồ — đứng sát bờ bấm E để đấu. Điểm ở mép nước: hồ Hoà Bình (gần khu nghỉ: vùng 1, giữa hồ: 2, cuối hồ: 3),
   ao Rừng phía Bắc (2), suối Vườn quốc gia (3). Thuồng Luồng hồ Hoà Bình rất hiếm ở vùng 3. */
Object.assign(LC_SPECIES,{
  tom_nhi:{name:'Tôm Nhí',t:'thuy',st:1,b:[40,55,45,60],evo:{to:'tom_hum',lv:18},rate:.45,water:1,desc:'Tôm con búng nước tanh tách dưới sông, ai lại gần là búng đuôi chạy.'},
  tom_hum:{name:'Tôm Hùm Cát',t:'thuy',st:2,b:[65,95,80,60],rate:.15,water:1,desc:'Tôm hùm càng to như cái kéo, kẹp một phát gãy cả mái chèo.'},
  cua_nhi:{name:'Cua Nhí',t:'thuy',st:1,b:[45,60,70,35],evo:{to:'cua_hoang',lv:26},rate:.4,water:1,desc:'Cua con đi ngang, giơ càng doạ cả cá to hơn mình.'},
  cua_hoang:{name:'Cua Hoàng Đế',t:'thuy',st:3,b:[85,110,125,40],rate:.08,water:1,desc:'Cua hoàng đế vỏ gai như đá, giáp cứng nhất hồ Hoà Bình.'},
  muc_nhi:{name:'Mực Nhí',t:'thuy',st:1,b:[45,50,45,70],evo:{to:'bach_tuoc',lv:22},rate:.4,water:1,desc:'Mực con phun mực đen rồi biến mất dưới làn nước.'},
  bach_tuoc:{name:'Bạch Tuộc Mực Đen',t:'am',st:2,b:[75,90,70,85],rate:.15,water:1,desc:'Tám xúc tu quấn chặt, phun mực che mắt cả trận đấu.'},
  thuong_luong:{name:'Thuồng Luồng Hồ Hoà Bình',t:'long',st:3,b:[120,130,110,105],rate:.03,water:1,rare:1,desc:'Rồng nước trong truyền thuyết hồ Hoà Bình, cuộn sóng lớn mỗi mùa lũ.'}});
for(const k of ['ca_chep','long_ngu','hai_long']) LC_SPECIES[k].water=1;
for(const z of Object.values(LINHCAT.zones)) z.pool=z.pool.filter(k=>!LC_SPECIES[k].water);   /* cá không lên bờ */
LINHCAT.wzones={1:{lv:[2,5],pool:['ca_chep','ca_chep','tom_nhi','tom_nhi','cua_nhi']},2:{lv:[6,12],pool:['ca_chep','tom_nhi','cua_nhi','muc_nhi','long_ngu','tom_hum']},
  3:{lv:[12,22],pool:['long_ngu','tom_hum','cua_nhi','muc_nhi','bach_tuoc','cua_hoang','hai_long']}};
LINHCAT.wRare={sp:'thuong_luong',chance:.03,lv:25};
LINHCAT.water={retreat:[[38.5,100.5,1],[19.5,101.5,1],[84.5,105.5,1],[123.5,106.5,2],[171.5,105.5,2],[210.5,105.5,2],[247.5,105.5,3],[286.5,106.5,3],[326.5,106.5,3],
  [105.5,18.5,2],[94.5,19.5,2],[298.5,5.5,3],[301.5,22.5,3],[301.5,38.5,3],[298.5,52.5,3],[304.5,64.5,3],[300.5,81.5,3]]};
const LCFOREST={npcs:[]};
/* 15 NPC sống rải rác trong rừng Đà Bắc (đường rừng núi mới ở world.js) giao nhiệm vụ ẩn về Lính Cát: nói chuyện mới lộ nhiệm vụ (server lcquest.js),
   tiến độ cộng khi thắng / thu phục / lên cấp / tiến hoá Lính Cát. lcq: k win | catch | lv | evo | dex, t hệ, sp loài, water dưới nước */
{ const F=[
  ['coi','Cụ Cối kiểm lâm',82,46,{gender:'nam',hair:'buzz',hairColor:'d8d4cc',skin:'d8a47a',outfit:{top:'sp_khoac_reu',bottom:'kaki',shoes:'sp_g_boot_bo',head:'sp_m_10'}},
    'Rừng này cụ canh 40 năm rồi. Lính Cát hoang dạo này hung lắm, cháu có dám thử sức không?','🔍 Nhật ký rừng xanh','Thắng 3 trận với Lính Cát hoang ngoài tự nhiên.',{k:'win'},3,{exp:180,vnd:200000,items:{bong_vang:2}}],
  ['meo','Cô Mèo hái nấm',84,30,{gender:'nu',hair:'ponytail',hairColor:'8a5428',skin:'f0c4a0',outfit:{top:'sp_a_caro',bottom:'sp_q_v_jean',shoes:'sp_g_ung_mua',head:'sp_m_05'}},
    'Hôm qua cô thấy một cục bông hồng hát ru trong bụi nấm, cả giỏ nấm rơi hết vì buồn ngủ!','🔍 Bông Bông trong bụi nấm','Thu phục 1 Lính Cát hệ Tiên.',{k:'catch',t:'tien'},1,{exp:200,vnd:220000,items:{thuoc_cat:3}}],
  ['suoi','Anh Suối câu cá',91,26,{gender:'nam',hair:'messy',hairColor:'2b2326',skin:'e0a878',outfit:{top:'sp_a_soc_ngang',bottom:'sp_q_short_kaki',shoes:'sp_g_xo_ngon',head:'sp_m_14'}},
    'Câu cả buổi chẳng được con cá nào, toàn Lính Cát dưới nước giật mồi. Bắt hộ anh một con đi!','🔍 Mồi câu bị cướp','Thu phục 1 Lính Cát sống dưới nước (sông, hồ, ao).',{k:'catch',water:1},1,{exp:220,vnd:250000,items:{bong_vang:2}}],
  ['tom','Bé Tôm ven suối',292,58,{gender:'nu',hair:'bun',hairColor:'2b2326',skin:'f6d2b8',outfit:{top:'sp_a_tim',bottom:'sp_q_short_trang',shoes:'sp_g_sandal_hong',head:'sp_m_34'}},
    'Em muốn nuôi một bạn Tôm Nhí để ngày nào cũng ngắm nó búng nước tanh tách!','🔍 Bạn tôm của bé','Thu phục 1 Tôm Nhí (dưới hồ Hoà Bình hoặc suối).',{k:'catch',sp:'tom_nhi'},1,{exp:200,vnd:220000,items:{sach_kn:2}}],
  ['dem','Bà đồng đêm',36,16,{gender:'nu',hair:'long',hairColor:'f4f0e0',skin:'e8c4a0',outfit:{top:'cardigan',bottom:'vay_den',shoes:'giay_den',neck:'sp_c_ngoc_trai'}},
    'Đêm trăng, bóng ma ở rừng này hay trêu người. Cháu giúp bà dạy chúng một bài học nhé.','🔍 Bóng ma đêm trăng','Thắng 2 trận với Lính Cát hệ Ma (chỉ hiện ban đêm).',{k:'win',t:'ma'},2,{exp:260,vnd:280000,items:{bong_vang:3}}],
  ['set','Thợ điện Sét',190,30,{gender:'nam',hair:'fade',hairColor:'1c1820',skin:'d8a47a',outfit:{top:'sp_a_bomber',bottom:'sp_q_cargo_be',shoes:'sp_g_boot_vang',head:'sp_m_21'}},
    'Trạm điện rừng hết pin dự phòng. Nghe nói Lính Cát hệ Điện tích được điện, bắt giúp tôi 2 con!','🔍 Pin cho trạm rừng','Thu phục 2 Lính Cát hệ Điện.',{k:'catch',t:'loi'},2,{exp:280,vnd:300000,items:{da_sam:1}}],
  ['da','Lão đá núi',128,30,{gender:'nam',hair:'bald',hairColor:'9a9a9a',skin:'c8946a',outfit:{top:'sp_a_gile',bottom:'kaki',shoes:'sp_g_sandal_nau'},opts:{beard:'full'}},
    'Đá lăn từ đèo xuống chắn lối mòn của lão. Đánh bại mấy con Lính Cát hệ Đá cho lão đi qua với!','🔍 Đá lăn chắn lối','Thắng 3 trận với Lính Cát hệ Đá.',{k:'win',t:'da'},3,{exp:300,vnd:320000,items:{sach_kn:3}}],
  ['bay','Chị chim rừng',198,22,{gender:'nu',hair:'long',hairColor:'6a4228',skin:'f0c4a0',outfit:{hairx:'sp_t_wavy',top:'sp_a_tiedye',bottom:'sp_q_v_mint',shoes:'sp_g_bup_be',head:'sp_m_49'}},
    'Chị nghiên cứu các loài biết bay trong rừng. Em bắt giúp chị 1 con để chị vẽ lại nhé.','🔍 Đôi cánh rừng xanh','Thu phục 1 Lính Cát hệ Bay.',{k:'catch',t:'bay'},1,{exp:220,vnd:240000,items:{bong_vang:2}}],
  ['vo','Võ sư ẩn cư',14,22,{gender:'nam',hair:'buzz',hairColor:'1c1820',skin:'d8a47a',outfit:{hairx:'sp_t_bun',top:'set_superman',bottom:'kaki',shoes:'dep_to_ong'}},
    'Ta ở ẩn đã lâu, chỉ truyền võ cho người có Lính Cát đủ mạnh. Luyện một con lên cấp 20 rồi quay lại.','🔍 Quyền pháp Lính Cát','Luyện 1 Lính Cát đạt cấp 20.',{k:'lv',lv:20},1,{exp:400,vnd:400000,items:{sach_kn5:1}}],
  ['tien','Bé Hoa tiên rừng',64,12,{gender:'nu',hair:'long',hairColor:'f29ab0',skin:'f6d2b8',outfit:{hairx:'sp_t_twin',top:'sp_a_hoodie_hong',bottom:'sp_q_v_xep_ly',shoes:'sp_g_bup_be',head:'sp_m_48'}},
    'Tiến hoá là phép màu đẹp nhất của Lính Cát đó! Anh chị cho em xem một lần được không?','🔍 Phép màu tiến hoá','Cho 1 Lính Cát tiến hoá (đủ cấp hoặc dùng đá).',{k:'evo'},1,{exp:300,vnd:300000,items:{da_tien:1}}],
  ['dex','Học giả Poke Deck',116,50,{gender:'nam',hair:'swept',hairColor:'2b2326',skin:'f0c4a0',outfit:{hairx:'sp_t_side',top:'somi_dai',bottom:'sp_q_tay_xam',shoes:'sp_g_oxford',eyes:'kinh_can'}},
    'Tôi đang viết thêm cho cuốn Poke Deck. Ai đã gặp đủ 25 loài Lính Cát thì kể tôi nghe với!','🔍 Sổ tay dày thêm','Gặp đủ 25 loài trong Poke Deck.',{k:'dex',n:25},25,{exp:350,vnd:350000,items:{bong_vang:3}}],
  ['thuoc','Ông lang rừng',196,48,{gender:'nam',hair:'messy',hairColor:'d8d4cc',skin:'c8946a',outfit:{hairx:'sp_t_wavy',top:'sp_a_ringer',bottom:'kaki',shoes:'sp_g_sandal_nau',head:'sp_m_15'},opts:{beard:'full'}},
    'Mấy con thú rừng bị thương nằm ở hang kia. Cháu mang giúp ông 3 lọ thuốc hồi máu Lính Cát nhé.','🔍 Thuốc cho thú bị thương','Mang 3 Thuốc hồi máu Lính Cát cho ông lang.',null,0,{exp:200,vnd:250000,items:{sach_kn:2}},{thuoc_cat:3}],
  ['doc','Người nuôi rắn',240,30,{gender:'nam',hair:'undercut',hairColor:'3a2418',skin:'c8946a',outfit:{top:'sp_a_camo',bottom:'sp_q_cargo_reu',shoes:'sp_g_boot_den',head:'sp_m_26'}},
    'Nọc Lính Cát hệ Độc làm thuốc giải được đấy. Bắt cho tôi một con, đeo găng vào kẻo bị cắn!','🔍 Nọc độc quý','Thu phục 1 Lính Cát hệ Độc.',{k:'catch',t:'doc'},1,{exp:240,vnd:260000,items:{bong_vang:2}}],
  ['rong','Thầy phong thuỷ',256,40,{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'e0a878',outfit:{hairx:'sp_t_braid',top:'vest',bottom:'kaki',shoes:'giay_den',eyes:'sp_k_round_0'}},
    'Long mạch Đà Bắc đang động. Phải có người thắng được Lính Cát hệ Rồng thì mới yên.','🔍 Long mạch rung chuyển','Thắng 1 trận với Lính Cát hệ Rồng.',{k:'win',t:'long'},1,{exp:420,vnd:450000,items:{ngoc_ch:1}}],
  ['luong','Ngư ông hồ Hoà Bình',320,62,{gender:'nam',hair:'buzz',hairColor:'d8d4cc',skin:'b8845a',outfit:{top:'sp_a_soc_do',bottom:'sp_q_short_kaki',shoes:'sp_g_xo_ngon',head:'sp_m_16'},opts:{beard:'full'}},
    'Ông kể cháu nghe truyền thuyết Thuồng Luồng hồ Hoà Bình. Muốn gặp nó thì phải đấu thật nhiều với Lính Cát dưới nước.','🔍 Truyền thuyết Thuồng Luồng','Thắng 5 trận với Lính Cát dưới nước.',{k:'win',water:1},5,{exp:450,vnd:500000,items:{bong_vang:5}}]];
  LCFOREST.npcs=F.map(([k,name,x,y])=>({id:'lcf_'+k,name,x,y}));
  for(const [k,name,x,y,look,say,title,desc,lcq,prog,reward,need] of F){ const id='lcf_'+k, qid='lcq_'+k;
    NPCS.push({id,x,y,place:'lcforest'}); NPC_LOOKS[id]={name,look};
    QUESTS[qid]={giver:id,secret:true,title,desc,say,reward,...(lcq?{lcq,prog}:{}),...(need?{need}:{})}; } }
/* ===== Lính Cát 200 loài (25/10): 41 họ tiến hoá mới phỏng theo Pokemon (vẽ tự động ở art25.js theo `art`), loài 2 hệ (t2: khắc hệ nhân cả 2 hệ, học thêm chiêu hệ 2),
   2 rồng huyền thoại Hắc Long / Bạch Long (triệu hồi bằng 7 Mảnh Triệu Hồi, cả server chỉ 2 người có), thêm điểm Lính Cát hoang ở Ké + trang trại bác Trang ===== */
{ const X=[
  /* [khoá 3 bậc], [tên 3 bậc], hệ, hệ 2, dáng vẽ, màu [thân, tối, sáng, điểm nhấn] (hoặc 3 bộ màu theo bậc), dáng chỉ số [máu, công, thủ, tốc], [lv lên bậc 2, bậc 3], [mô tả 3 bậc], thêm */
  [['cun_lua','hoa_khuyen','than_khuyen'],['Cún Lửa','Hoả Khuyển','Thần Hoả Khuyển'],'hoa','','quad',['e8743a','b8481a','ffe0a0','2a1a1c'],[55,70,48,60],[16,25],
    ['Cún con lông cam, sủa một tiếng là phì ra tia lửa nhỏ.','Chó lửa trung thành, canh cổng nhà ai là trộm không dám bén mảng.','Thần khuyển bờm lửa, chạy một ngày ngàn dặm quanh núi Đà Bắc.'],{f:{ear:'pointy',tail:'fluffy',mane:2,pat3:'stripes'}}],
  [['ga_choi','ga_lua','hoa_ke'],['Gà Chọi Nhí','Gà Chiến Lửa','Hoả Kê Vương'],'hoa','vo','biped',[['f2c43d','c8901a','fff0b0','e8743a'],['e8743a','b8481a','ffe0a0','f2c43d'],['c8302a','8a1a1a','f4e0b0','f2c43d']],[50,70,45,55],[16,25],
    ['Gà con lông vàng, mổ đất cả ngày để tập võ.','Gà chọi chân có cựa lửa, đá một phát cháy cả cọc gỗ.','Vua gà lửa, cổ tay bốc lửa, tung cước nhanh như chớp.'],{f:{beak:1,crest:1,glove3:1}}],
  [['rai_nhi','rai_kiem','thuy_kiem'],['Rái Nhí','Rái Kiếm Sĩ','Thuỷ Kiếm Vương'],'thuy','','quad',['7ab8e8','4a88c8','f4f1ea','f2c43d'],[55,58,45,48],[16,25],
    ['Rái cá con mang vỏ sò trên bụng làm khiên.','Rái kiếm sĩ, rút vỏ sò ra là thành thanh kiếm nước.','Kiếm vương sông nước, một nhát chém tách đôi con sóng.'],{f:{ear:'round',tail:'thin',shell:1,sword3:1}}],
  [['ech_com','ech_ninja','nhan_gia'],['Ếch Cốm','Ếch Ninja','Thuỷ Nhẫn Giả'],'thuy','am','biped',['5ab8e8','2a6ab0','d8f0ff','ff7aa0'],[41,56,40,71],[16,25],
    ['Ếch con bọt nước quanh cổ, nhảy xa gấp 10 lần thân mình.','Ếch ninja ném phi tiêu nước, thoắt ẩn thoắt hiện.','Nhẫn giả lưỡi dài quấn cổ như khăn, phi tiêu nước xuyên đá.'],{f:{frog:1,scarf2:1}}],
  [['map_nhi','map_rang','map_vuong'],['Cá Mập Nhí','Mập Răng Cưa','Mập Hải Vương'],'thuy','am','fish',['3a5a9a','1c3a6a','e8e8f0','f2c43d'],[45,90,25,65],[16,25],
    ['Cá mập con hàm răng tí hon nhưng cắn rất đau.','Răng cưa sắc lẹm, ngửi thấy mùi máu từ cuối hồ.','Hải vương của hồ Hoà Bình, lao nhanh như thuyền máy.'],{water:1,f:{teeth:1,fin:1}}],
  [['khi_la','khi_rung','tinh_tinh'],['Khỉ Lá','Khỉ Rừng Xanh','Đại Tinh Tinh Rừng'],'moc','vo','biped',['6ab84a','3a8a2a','f0d8a8','8a5a32'],[50,68,50,62],[16,25],
    ['Khỉ con cài lá trên đầu, gõ cành cây thành nhạc.','Khỉ rừng đánh trống bằng gậy tre, cả rừng nhún nhảy theo.','Đại tinh tinh vỗ ngực, gốc cây quanh nó mọc lá non.'],{f:{ear:'round',tail:'curl',leaf:1,stick2:1}}],
  [['nai_co','nai_hoa','than_loc'],['Nai Cỏ','Nai Hoa Bốn Mùa','Thần Lộc Rừng'],'moc','tien','quad',['c8a06a','8a6a3a','f4e8d0','ff8ab0'],[60,60,50,75],[16,25],
    ['Nai con đốm trắng, lông đổi màu theo mùa.','Gạc nai nở hoa, mùa xuân hồng, mùa thu vàng.','Thần lộc của rừng Đà Bắc, bước tới đâu cỏ cây xanh tới đó.'],{f:{ear:'pointy',tail:'short',horn:'antler',pat1:'spots'}}],
  [['sen_nhi','sen_hong','lien_hoa'],['Sen Nhí','Sen Hồng','Liên Hoa Tiên'],'moc','thuy','plant',['f29ab8','c8607a','f8e0e8','5fae46'],[55,40,55,45],[16,25],
    ['Mầm sen trôi trên mặt hồ, ngủ trên lá sen to.','Sen hồng nở trên đầu, toả hương thơm cả mặt hồ.','Liên hoa tiên ngồi thiền trên đài sen, nước quanh nó trong veo.'],{water:1,f:{lotus:1}}],
  [['cuu_bong','cuu_set','dien_cuu'],['Cừu Bông Điện','Cừu Sét','Điện Long Cừu'],'loi','','quad',['f2d84a','c8a020','f8f6ee','4a6ad8'],[60,52,45,42],[16,25],
    ['Cừu bông tích điện tĩnh, chạm vào là tóc dựng đứng.','Lông cừu rụng bớt, đuôi sáng đèn như bóng đèn pin.','Đuôi và trán phát sáng như ngọn hải đăng, chiếu xa cả cây số.'],{f:{wool:1,ear:'flop',tail:'bolt'}}],
  [['luon_dien','luon_sam','loi_xa'],['Lươn Điện Nhí','Lươn Sấm','Lôi Xà Vương'],'loi','thuy','serpent',['3a6ab8','1c3a7a','d8e8f8','f2c43d'],[50,70,50,45],[16,25],
    ['Lươn con phát điện yếu, cá nhỏ quanh nó tê rần.','Lươn sấm cuộn mình dưới bùn, quẫy lên là tia điện lan cả khúc sông.','Rắn điện vương miệng hút như giác, phóng điện làm sôi nước.'],{water:1,f:{spots:1}}],
  [['tho_bong','tho_trang','nguyet_tho'],['Thỏ Bông','Thỏ Trăng','Nguyệt Thỏ Tiên'],'tien','','quad',['f4f1ea','c8c0d0','ffd0e0','ffd84a'],[55,45,45,75],[16,25],
    ['Thỏ con lông trắng, đêm rằm hay ngồi ngắm trăng.','Trán có vầng trăng khuyết, nhảy một cái cao ngang mái nhà.','Thỏ ngọc trên cung trăng xuống trần, giã thuốc tiên chữa bệnh.'],{f:{ear:'long',tail:'puff',moon:2}}],
  [['tien_nho','tien_canh','tien_hau'],['Tiên Tí Hon','Tiên Cánh Bướm','Tiên Hậu'],'tien','than','biped',['f4f4f8','c8c8e0','ffffff','5fd08a'],[45,38,42,48],[16,25],
    ['Tiên tí hon tóc xanh lá, cảm nhận được vui buồn của người khác.','Mọc đôi cánh bướm mỏng, múa một vòng là ai cũng vui.','Tiên hậu áo dài trắng, dùng niệm lực che chở cho người mình thương.'],{f:{dress:1,hair:1,wings2:1}}],
  [['bi_ma','bi_quy','bi_vuong'],['Bí Ma','Bí Ngô Quỷ','Bí Vương Đêm'],'ma','moc','blob',['e8843a','a8541a','ffd080','3a2a3a'],[55,65,70,45],[16,25],
    ['Quả bí khoét mắt, đêm rằm lăn ra đồng doạ trẻ con.','Bí ngô quỷ tóc dây leo, hát ru người đi lạc vào rừng.','Vua bí đêm Halloween, ánh nến trong bụng soi đường cho hồn ma.'],{night:1,f:{pumpkin:1}}],
  [['den_ma','long_den','chuc_dang'],['Đèn Ma Trơi','Lồng Đèn Ma','Chúc Đăng Quỷ'],'ma','hoa','float',['f4f1ea','c8c0d0','ffffff','a86ae8'],[50,50,55,40],[16,25],
    ['Ngọn nến nhỏ cháy lửa tím, ai lại gần là thấy lạnh gáy.','Lồng đèn ma lơ lửng trong rừng đêm, dụ người đi theo ánh lửa.','Đèn chùm quỷ nhiều ngọn lửa tím, đốt cháy cả linh hồn đối thủ.'],{night:1,f:{flame:1,arms3:1}}],
  [['rong_dat','sa_long','bao_cat_long'],['Rồng Đất Nhí','Sa Long','Bão Cát Long'],'long','da','dragon',['5a6ab8','3a4a8a','e86a4a','f2c43d'],[58,72,48,48],[16,25],
    ['Rồng con sống trong hang cát, thấy gì cũng cắn thử.','Sa long đào hang nhanh như máy xúc, vây tay sắc như dao.','Bão cát long lao đi như phản lực, cát xoáy theo sau thành bão.'],{f:{fins:1,horn:1}}],
  [['rong_bien','thuy_long','hai_than'],['Rồng Biển Nhí','Thuỷ Long','Hải Long Thần'],'long','thuy','serpent',['6aa8f0','3a6ac8','f4f1ea','ffffff'],[55,62,55,55],[16,25],
    ['Rồng con thân dài như lươn, lột da mấy lần mới lớn.','Thuỷ long có ngọc trên cổ, điều khiển được mưa gió.','Hải long thần, bay lượn trên mặt hồ là trời đổi mưa.'],{water:1,f:{whisker:1,horn:1,orb:2}}],
  [['rong_canh','phi_long','thien_long'],['Rồng Cánh Nhí','Phi Long','Thiên Long Vương'],'long','bay','dragon',['5ab8d8','3a88a8','f2e8c8','e8302a'],[45,78,62,50],[16,25],
    ['Rồng con mơ ước được bay, ngày nào cũng nhảy từ vách đá xuống.','Phi long mai cứng như khiên, chưa bay được nhưng húc rất đau.','Thiên long vương đôi cánh đỏ, bay vút lên mây khi vui sướng.'],{f:{wings3:1,horn:1}}],
  [['cut_nhi','cut_bang','bang_de'],['Cụt Nhí','Cánh Cụt Băng','Băng Đế Vương'],'bang','thuy','bird',['3a6ab0','1c3a6a','f4f4f8','f2c43d'],[53,51,53,42],[16,25],
    ['Chim cánh cụt con kiêu hãnh, ngã cũng không chịu khóc.','Cánh cụt băng trượt bụng trên hồ như ván lướt.','Đế vương băng với vương miện ba chạc, một cái vỗ cánh đóng băng mặt hồ.'],{f:{penguin:1,crown3:1}}],
  [['tuyet_nhi','nguoi_tuyet','tuyet_vuong'],['Tuyết Nhí','Người Tuyết','Tuyết Sơn Vương'],'bang','moc','biped',['f4f8ff','c8d8e8','ffffff','5fae46'],[60,62,52,40],[16,25],
    ['Cục tuyết biết đi, trên đầu mọc mấy lá thông.','Người tuyết vai phủ lá kim, thổi ra bão tuyết nhỏ.','Tuyết sơn vương cao như cây thông, đi tới đâu tuyết rơi tới đó.'],{f:{fluff:1,leafy:1}}],
  [['soi_bang','soi_tuyet','bang_lang'],['Sói Băng Nhí','Sói Tuyết','Băng Lang Vương'],'bang','','quad',['b8e0f8','6aa8d8','f8fcff','4ab0ff'],[55,62,45,70],[16,25],
    ['Sói con lông trắng xanh, hơi thở đọng thành sương.','Sói tuyết săn mồi theo đàn, tru lên là trời trở lạnh.','Băng lang vương lưng mọc gai băng, đứng đâu đất đóng băng tới đó.'],{f:{ear:'pointy',tail:'fluffy',ice3:1}}],
  [['meo_mun','bao_dem','hac_bao'],['Mèo Mun','Báo Đêm','Hắc Báo Vương'],'am','','quad',['3a2a4a','1c1424','8a6aa8','f2c43d'],[45,55,40,70],[16,25],
    ['Mèo mun mắt vàng, thích trộm cá phơi của hàng xóm.','Báo đêm lông đốm tím, đi không một tiếng động.','Hắc báo vương nấp trong bóng tối, vồ một cái là xong trận.'],{f:{ear:'cat',tail:'thin',pat2:'spots'}}],
  [['qua_nhi','qua_dem','qua_chua'],['Quạ Nhí','Quạ Đêm','Quạ Chúa'],'am','bay','bird',['2a2a3a','141420','5a5a7a','f2c43d'],[60,80,45,85],[16,25],
    ['Quạ con thích nhặt đồ lấp lánh về tổ.','Quạ đêm đậu trên mái chùa, kêu một tiếng là mất ngủ cả xóm.','Quạ chúa đội mũ lông như bố già, cả bầy quạ nghe lệnh.'],{night:1,f:{crest3:1}}],
  [['soi_con','soi_xam','lang_vuong'],['Sói Con','Sói Xám','Lang Vương Đêm Trăng'],'am','','quad',['6a6a7a','3a3a46','c8c8d4','e8302a'],[50,72,45,60],[16,25],
    ['Sói con xám, cắn ống quần người lạ không buông.','Sói xám mắt đỏ, đêm trăng tròn tru vang cả núi.','Lang vương bờm đen, cả đàn sói rừng Đà Bắc theo nó.'],{f:{ear:'pointy',tail:'fluffy',mane:2}}],
  [['khi_thien','hau_niem','te_thien'],['Khỉ Thiền','Hầu Niệm Sư','Tề Thiên Đại Thánh'],'than','vo','biped',['c8843a','8a541a','f8e0b0','f2c43d'],[55,75,50,80],[16,25],
    ['Khỉ con ngồi thiền trên tảng đá, nhắm mắt vẫn bắt được ruồi.','Hầu niệm sư nhấc đá bằng ý nghĩ, đánh gậy như múa.','Tề thiên đại thánh vòng kim cô trên đầu, gậy như ý dài ngắn tuỳ ý.'],{f:{ear:'round',tail:'curl',band3:1,staff3:1}}],
  [['cu_meo','cu_dem','cu_than'],['Cú Mèo Nhí','Cú Đêm','Cú Thần Thông'],'than','bay','bird',['8a6a4a','5a4228','e8d0a8','f2c43d'],[70,45,45,55],[16,25],
    ['Cú con đứng một chân, đầu xoay được nửa vòng.','Cú đêm mắt to tròn, đọc được suy nghĩ của con mồi.','Cú thần thông biết trước tương lai, gật đầu ba cái là có chuyện.'],{f:{owl:1}}],
  [['mong_nhi','mong_mo','mong_than'],['Mộng Nhí','Mộng Mơ','Mộng Thần'],'than','','float',['f8c0d8','c890b0','ffe8f0','a86ae8'],[80,40,55,40],[16,25],
    ['Mộng nhí ăn giấc mơ xấu, thở ra khói hồng thơm ngát.','Mộng mơ bay lơ lửng, ngủ cạnh nó là mơ đẹp cả đêm.','Mộng thần dệt giấc mơ cho cả xóm, khói hồng thành hình bông hoa.'],{f:{dream:1}}],
  [['bo_ngua','bo_ngua_kiem','duong_lang'],['Bọ Ngựa Nhí','Bọ Ngựa Kiếm','Đường Lang Vương'],'trung','vo','bug',['6ad84a','3a9a2a','d8f8c0','c8ccd4'],[60,95,65,90],[16,25],
    ['Bọ ngựa con chắp tay như đang cầu nguyện, thật ra là rình mồi.','Hai lưỡi liềm sắc như dao, chém cỏ ngọt như máy cắt.','Đường lang vương múa liềm như kiếm khách, chém gió thành đường.'],{f:{claw:1,wings2:1}}],
  [['ong_nhi','ong_vo','ong_chua'],['Ong Mật Nhí','Ong Võ Vẽ','Ong Chúa'],'trung','doc','bug',['f2c43d','c8901a','fff0a0','2a2228'],[50,72,45,75],[16,25],
    ['Ong con vụng về, hay lạc vào vườn hoa nhà người ta.','Ong võ vẽ đuôi kim độc, cả đàn bay theo như mây đen.','Ong chúa đội vương miện, ra lệnh một tiếng là ngàn ong xông lên.'],{f:{stripe:1,wings:1,stinger:1,crown3:1}}],
  [['bo_hung','bo_sung','kim_giap'],['Bọ Hung Nhí','Bọ Sừng','Kim Giáp Thần Trùng'],'trung','da','bug',['3a5ad8','1c2a8a','8aa8f0','f2c43d'],[80,110,80,70],[16,25],
    ['Bọ hung con lăn viên đất to gấp đôi người.','Bọ sừng nhấc bổng khúc gỗ gấp trăm lần cân nặng.','Thần trùng giáp vàng, sừng hất văng cả tảng đá núi.'],{f:{horn:1,wings2:1}}],
  [['vet_nhi','vet_noi','vet_than'],['Vẹt Nhí','Vẹt Nói','Vẹt Thần Ngũ Sắc'],'bay','thuong','bird',['4ac84a','2a8a2a','f2e84a','e8302a'],[70,65,45,85],[16,25],
    ['Vẹt con bắt chước tiếng người, nói câu nào cũng sai chính tả.','Vẹt nói nhại giọng đối thủ làm họ rối trí.','Vẹt thần năm màu, hót một bài là cả rừng im lặng nghe.'],{f:{crest:1}}],
  [['hac_con','hac_trang','tien_hac'],['Hạc Con','Hạc Trắng','Tiên Hạc'],'bay','tien','bird',['f4f4f8','c8c8d8','2a2a36','e8302a'],[60,58,50,70],[16,25],
    ['Hạc con chân dài lêu nghêu, đứng một chân ngủ gật.','Hạc trắng đỉnh đầu đỏ, múa giữa đồng như tranh thuỷ mặc.','Tiên hạc cõng người tu tiên bay lên núi cao, sống ngàn năm.'],{f:{neck:1,crest:1}}],
  [['cong_con','cong_mua','khong_tuoc'],['Công Con','Công Múa','Khổng Tước Vương'],'bay','than','bird',['2a6ad8','1c3a9a','4ab8a8','f2c43d'],[55,65,55,80],[16,25],
    ['Công con lông còn xám, ngày nào cũng soi gương mong lớn.','Công múa xoè đuôi, ai nhìn vào mắt đuôi là chóng mặt.','Khổng tước vương xoè đuôi ngàn mắt, thôi miên cả trận đấu.'],{f:{fan:2,crest:1}}],
  [['coc_nhi','coc_doc','thiem_thu'],['Cóc Nhí','Cóc Độc','Thiềm Thừ Vương'],'doc','vo','biped',['5a5ab8','3a3a7a','c8c8f0','e8843a'],[50,65,42,52],[16,25],
    ['Cóc con má phồng, phì ra chất nhờn làm tay ngứa ran.','Cóc độc võ sĩ, móng tay có nọc độc làm tê đối thủ.','Thiềm thừ vương ngậm đồng xu, đánh độc như rắn, giàu như thần tài.'],{f:{frog:1,cheek:1}}],
  [['bo_cap','cap_doc','hat_vuong'],['Bọ Cạp Nhí','Bọ Cạp Độc','Hạt Vương Sa Mạc'],'doc','da','bug',['a85ac8','6a2a8a','e8c8f0','2a2228'],[45,60,90,65],[16,25],
    ['Bọ cạp con giơ đuôi doạ ai cũng tưởng là đồ chơi.','Bọ cạp độc càng to như kìm, đuôi chích một phát tê nửa người.','Hạt vương sa mạc giáp tím, kìm kẹp nát cả đá tảng.'],{f:{claw2:1,stinger:1}}],
  [['te_giac','te_giac_da','thach_te'],['Tê Giác Nhí','Tê Giác Đá','Thạch Tê Vương'],'da','thuong','quad',['9a9aa8','6a6a78','c8c8d4','e8e0c8'],[80,85,95,30],[16,25],
    ['Tê giác con da sần như đá, chạy thẳng chẳng biết rẽ.','Tê giác đá sừng như mũi khoan, húc thủng cả vách núi.','Thạch tê vương giáp đá dày, đứng yên như một quả đồi.'],{f:{horn:'nose',ear:'round',tail:'short',plates:1}}],
  [['rua_da','rua_nui','kim_quy'],['Rùa Đá','Rùa Núi','Kim Quy Thần'],'da','moc','shell',[['8ac85a','5a8a3a','f0e0a0','8a5a32'],['6a9a4a','4a6a2a','e0d090','8a5a32'],['f2c43d','b8901a','fff0b0','5fae46']],[60,68,70,32],[16,25],
    ['Rùa con trên mai mọc mầm cây, ngủ đông trong đất.','Rùa núi mai thành vách đá, cây con mọc thành bụi.','Kim Quy thần mai vàng óng, truyền thuyết trả gươm ở hồ Gươm.'],{f:{sprout:1,tree3:1}}],
  [['pha_le','thach_anh','kim_cuong'],['Pha Lê Nhí','Thạch Anh','Kim Cương Thần Thạch'],'da','tien','rock',['e88ac8','a8508a','f8d0ec','7ad8f0'],[50,60,110,50],[16,25],
    ['Viên pha lê biết đi, ánh nắng chiếu qua thành cầu vồng.','Thạch anh hồng mọc thêm nhiều mũi tinh thể.','Thần thạch kim cương, viên đá quý giữa trán sáng như sao.'],{f:{crystal:1,gem3:1}}],
  [['gau_truc','gau_truc_vo','dai_hung_mieu'],['Gấu Trúc Nhí','Gấu Trúc Võ Sĩ','Đại Hùng Miêu Quyền'],'vo','am','biped',['f4f4f2','2a2a30','ffffff','5fae46'],[67,82,62,43],[16,25],
    ['Gấu trúc con ngậm lá tre, cố tỏ ra ngầu nhưng toàn ngã.','Gấu trúc võ sĩ đeo kính đen, đấm phát nào chắc phát đó.','Đại hùng miêu quyền, một tay chặn đứng cả xe tải.'],{f:{panda:1,leaf1:1,ear:'round'}}],
  [['tui_nhi','tui_quyen','quyen_vuong_thu'],['Chuột Túi Nhí','Chuột Túi Quyền Anh','Quyền Vương Đại Thử'],'vo','','biped',['c8945a','8a5a32','f4d8b0','e8302a'],[70,85,60,62],[16,25],
    ['Chuột túi con thò đầu khỏi túi mẹ, tập đấm vào không khí.','Đeo găng quyền anh đỏ, nhảy chân sáo quanh đối thủ.','Quyền vương đại thử, cú đấm móc làm rung cả võ đài.'],{f:{glove:1,ear:'long',tail:'thick'}}],
  [['meo_muop','meo_ba_tu','meo_than_tai'],['Mèo Mướp','Mèo Ba Tư','Mèo Thần Tài'],'thuong','','quad',['e8c88a','b88a4a','fff4dc','f2c43d'],[45,50,40,90],[16,25],
    ['Mèo mướp nhặt đồng xu rơi về dấu dưới gầm giường.','Mèo ba tư lông dài sang chảnh, nhìn đâu là thấy tiền ở đó.','Mèo thần tài đồng xu vàng trên trán, vẫy tay là tiền về.'],{f:{ear:'cat',tail:'thin',pat:'stripes',coin3:1}}],
  [['nghe_con','trau_mong','than_nguu'],['Nghé Con','Trâu Mộng','Thần Ngưu Vương'],'thuong','vo','quad',['5a5a62','3a3a42','8a8a92','f4f1ea'],[75,95,80,65],[16,25],
    ['Nghé con theo mẹ ra đồng, thích đầm mình trong vũng bùn.','Trâu mộng sừng cong như lưỡi liềm, cày một ngày cả mẫu ruộng.','Thần ngưu vương của làng Mường, húc một phát nát cả cổng thành.'],{f:{horn:'buffalo',ear:'round',tail:'thin'}}]];
  for(const [ks,ns,t,t2,plan,cols,b,lv,ds,ex] of X) ks.forEach((k,i)=>{ const c=Array.isArray(cols[0])?cols[i]:cols;
    LC_SPECIES[k]={name:ns[i],t,...(t2?{t2}:{}),st:i+1,b:b.slice(),...(i<2?{evo:{to:ks[i+1],lv:lv[i]}}:{}),rate:[.45,.2,.06][i],desc:ds[i],art:{plan,c,st:i+1,f:ex.f||{}},...(ex.water?{water:1}:{}),...(ex.night?{night:1}:{})}; });
  /* 2 rồng huyền thoại: chỉ triệu hồi được ở Tế đàn Rồng Thần (rừng Bắc Đà Bắc) bằng 7 Mảnh Triệu Hồi; cả server mỗi con chỉ 1 chủ, 1 người chỉ có 1 con */
  Object.assign(LC_SPECIES,{hac_long:{name:'Hắc Long Lôi Đế',t:'long',t2:'loi',st:3,legend:1,sl:18,b:[100,150,120,90],rate:0,desc:'Rồng đen huyền thoại, đuôi là lò phát điện, gầm lên là sấm sét xé trời Đà Bắc.'},
    bach_long:{name:'Bạch Long Viêm Đế',t:'long',t2:'hoa',st:3,legend:1,sl:18,b:[100,150,120,90],rate:0,desc:'Rồng trắng huyền thoại, đuôi là lò lửa, vỗ cánh một cái là cả khu rừng nóng như mùa hè.'}});
  Object.assign(LINHCAT.superSkill,{hac_long:{name:'Hắc Lôi Diệt Thế',mul:5.5,chain:8,slow:2,every:1},bach_long:{name:'Bạch Viêm Thánh Hoả',mul:5.5,aoe:4,heal:.1,team:6,every:1.1}});
  LINHCAT.dragon={item:'manh_trieu_hoi',need:7,chance:.25,choices:['hac_long','bach_long'],lv:50,altar:{x:99.5,y:8.6}};
  ITEMS.manh_trieu_hoi={name:'Mảnh Triệu Hồi Rồng Thần',icon:'lcshard'};
  /* thêm Lính Cát hoang: 40 điểm mới ở Ké (vùng 4 sâu trong vườn quốc gia, Lv20–32), trang trại bác Trang 16 điểm + ao 4 điểm dưới nước */
  const Z=LINHCAT.zones, st1=ks=>ks.filter(k=>LC_SPECIES[k]&&!LC_SPECIES[k].water);
  Z[1].pool.push(...st1(['cun_lua','ga_choi','rai_nhi','khi_la','nai_co','cuu_bong','tho_bong','meo_mun','soi_con','cu_meo','vet_nhi','hac_con','ong_nhi','meo_muop','nghe_con','bo_ngua']));
  Z[2].pool.push(...st1(['cun_lua','ga_choi','ech_com','khi_la','nai_co','cuu_bong','tho_bong','tien_nho','bi_ma','den_ma','cut_nhi','tuyet_nhi','soi_bang','meo_mun','qua_nhi','soi_con','khi_thien','cu_meo','mong_nhi','bo_ngua','ong_nhi','bo_hung','vet_nhi','hac_con','cong_con','coc_nhi','bo_cap','te_giac','rua_da','pha_le','gau_truc','tui_nhi','meo_muop','nghe_con',
    'hoa_khuyen','rai_kiem','cuu_set','nai_hoa']));
  Z[3].pool.push(...st1(['rong_dat','rong_canh','tien_nho','bi_ma','den_ma','cut_nhi','tuyet_nhi','soi_bang','qua_nhi','khi_thien','mong_nhi','bo_hung','cong_con','coc_nhi','bo_cap','te_giac','rua_da','pha_le','gau_truc','tui_nhi',
    'hoa_khuyen','ga_lua','khi_rung','tho_trang','bi_quy','long_den','soi_tuyet','bao_dem','soi_xam','hau_niem','cu_dem','mong_mo','bo_ngua_kiem','ong_vo','bo_sung','vet_noi','hac_trang','cong_mua','coc_doc','cap_doc','te_giac_da','rua_nui','thach_anh','gau_truc_vo','tui_quyen','meo_ba_tu','trau_mong']));
  Z[4]={lv:[20,32],pool:st1(['rong_dat','rong_canh','sa_long','phi_long','tien_canh','qua_dem','ech_ninja','nguoi_tuyet','cut_bang','hoa_khuyen','ga_lua','khi_rung','nai_hoa','cuu_set','tho_trang','bi_quy','long_den','soi_tuyet','bao_dem','soi_xam','hau_niem','cu_dem',
    'mong_mo','bo_ngua_kiem','ong_vo','bo_sung','vet_noi','hac_trang','cong_mua','coc_doc','cap_doc','te_giac_da','rua_nui','thach_anh','gau_truc_vo','tui_quyen','meo_ba_tu','trau_mong','rong_may','chim_ung','vo_si','da_lan','niem_su','hoa_hoi','gau_ngu',
    'than_khuyen','hoa_ke','tinh_tinh','than_loc','dien_cuu','bang_lang','hac_bao','lang_vuong','duong_lang','kim_giap','khong_tuoc'])};
  Object.assign(LINHCAT.wzones[1],{pool:LINHCAT.wzones[1].pool.concat(['map_nhi','sen_nhi','luon_dien'])}); LINHCAT.wzones[2].pool.push('map_nhi','sen_nhi','luon_dien','rong_bien','sen_hong');
  LINHCAT.wzones[3].pool.push('map_rang','sen_hong','luon_sam','rong_bien','thuy_long','map_vuong','lien_hoa','loi_xa');
  LINHCAT.spots.push([31.5,18.5,1],[49.5,18.5,1],[11.5,26.5,1],[64.5,32.5,1],[7.5,38.5,1],[32.5,43.5,1],[20.5,49.5,1],[12.5,61.5,1],
    [107.5,13.5,3],[143.5,17.5,3],[118.5,18.5,3],[193.5,25.5,2],[79.5,29.5,2],[96.5,29.5,2],[182.5,30.5,2],[107.5,34.5,2],[128.5,35.5,2],[77.5,41.5,2],[114.5,44.5,2],[191.5,45.5,2],[97.5,47.5,2],
    [234.5,18.5,3],[273.5,18.5,3],[295.5,21.5,4],[255.5,33.5,3],[290.5,33.5,4],[215.5,34.5,3],[323.5,37.5,4],[266.5,40.5,3],[277.5,45.5,3],[300.5,47.5,4],[240.5,53.5,3],[311.5,54.5,4],[246.5,64.5,3],[227.5,67.5,3],[273.5,73.5,3],
    [220.5,78.5,3],[319.5,78.5,4],[289.5,79.5,4],[265.5,83.5,3]);
  const DL=LINHCAT.maps.dalat; DL.spots.push([33.5,20.5,1],[60.5,15.5,2],[70.5,24.5,2],[47.5,26.5,1],[25.5,27.5,1],[11.5,23.5,1],[70.5,38.5,2],[50.5,40.5,2],[33.5,43.5,1],[20.5,47.5,2],[50.5,47.5,2],[10.5,53.5,1],[33.5,57.5,2],[22.5,63.5,2],[46.5,65.5,2],[35.5,66.5,2]);
  DL.pool.push('nai_co','tho_bong','cuu_bong','ong_nhi','bo_ngua','hac_con','vet_nhi','khi_la','meo_muop','nghe_con','cong_con','tien_nho','mong_nhi','nai_hoa','cuu_set','ong_vo','hac_trang');
  LINHCAT.water.dalat=[[61.5,54.5,1],[49.5,56.5,1],[73.5,58.5,2],[63.5,63.5,2]]; }
/* Mèn Mén: huyền thoại meme của Nghiện Motion, thi thoảng hiện ở rừng Ké (mỗi chu kỳ 12 phút 12% hiện ở 1 bãi rừng xa), mỗi người chỉ thu phục được 1 con.
   Chỉ số ×1,5 và tăng theo cấp chủ: ×(1 + cấp chủ / 50); ở MU công lấy theo công của chủ nếu cao hơn. Chiêu Ném Cứt: độc cộng dồn mỗi lần trúng (tối đa 10 tầng, trừ máu mỗi lượt / mỗi giây), làm chậm, giảm hồi máu */
LC_SPECIES.men_men={name:'Mèn Mén',t:'doc',t2:'thuong',st:3,legend:1,men:1,b:[95,105,85,95],rate:.25,desc:'Huyền thoại của Nghiện Motion: tai nhọn, mũi to, mào xanh. Thấy ai là bốc cứt ném rồi cười khành khạch, dính một cục là thối cả trận.'};
LC_MOVES.nem_cut={name:'Ném Cứt',t:'doc',pow:60,acc:.95,poop:1};
LINHCAT.men={sp:'men_men',cap:1,lv:45,chance:.12,mul:1.5,perLv:1/50,poison:{max:10,per:.03,slow:.7,healCut:.5},mu:{dot:.05,slow:1.5,sec:5},
  spots:[[107.5,13.5],[143.5,17.5],[118.5,18.5],[79.5,29.5],[193.5,25.5],[234.5,18.5],[273.5,18.5],[255.5,33.5],[215.5,34.5],[266.5,40.5],[290.5,33.5],[227.5,67.5]]};
/* Blacknut: mèo trắng trùm khăn kín mặt, hay lảng vảng ở nơi làm việc (Lumen, Bearplus, Everfit, VNPT, Nghiện Motion, Lavi, 120 Yên Lãng, DAS): mỗi chu kỳ 40 giây hiện 10 giây ở 1 nơi rồi biến sang map khác.
   Chỉ Bóng Huyền Thoại bắt được, mỗi người 1 con. Đứng đầu đội: chỉ số MU của chủ ×1,2, mọi tiền + EXP chủ tự kiếm được ×2. Thi thoảng nói "Cũng đúng nhờ" / "Cũng là rỉ luôn đấy chứ" */
LC_SPECIES.blacknut={name:'Blacknut',t:'thuong',t2:'than',st:3,legend:1,bn:1,b:[90,85,90,125],rate:.6,desc:'Mèo trắng trùm khăn kín mặt, chỉ ló đôi mắt hổ phách. Hay lảng vảng ở chỗ làm việc, ở đâu cũng chỉ 10 giây rồi biến. Ai hỏi gì cũng gật gù: "Cũng đúng nhờ".'};
LINHCAT.bn={sp:'blacknut',lv:40,cycle:40e3,stay:10e3,ball:'bong_ht',stat:.2,mul:2,say:['Cũng đúng nhờ','Cũng là rỉ luôn đấy chứ'],
  maps:{lumen:[[8.4,26.4]],bearplus:[[18.8,9.4],[13.8,9.2],[17.4,16.4]],everfit:[[9.4,16.4],[13.4,5],[9.4,10]],vnpt:[[12.4,5.8],[22.4,5.8],[27,16.6]],
    nghienmotion:[[15.4,10.6],[23.8,10.4],[11.8,19.6]],lavi:[[21,13.8],[14.4,14],[10.8,16.8]],yenlang:[[14.6,10.4],[6,7.4],[28.2,12]],das:[[19,15.4],[22.9,8],[8.4,6]]}};
LINHCAT.ball.bong_ht=3; LINHCAT.shop.bong_ht=1500000; ITEMS.bong_ht={name:'Bóng Huyền Thoại',icon:'lcball3'};
for(const sc of Object.keys(LINHCAT.bn.maps)) if(!LINHCAT.maps[sc]) LINHCAT.maps[sc]={spots:[],bn:1};   /* nơi làm việc: không có Lính Cát hoang thường, chỉ Blacknut ghé qua */
function bnWild(ms,scene){ const B=LINHCAT.bn, c=Math.floor(ms/B.cycle); if(ms-c*B.cycle>=B.stay||!B.maps[scene]) return []; let h=(c*2654435761)>>>0; h^=h>>>15; h=Math.imul(h,0x2c1b3c6d)>>>0; h^=h>>>12;
  const ks=Object.keys(B.maps), sc=ks[h%ks.length]; if(sc!==scene) return []; const sp=B.maps[sc][(h>>>8)%B.maps[sc].length]; return [{i:3000,key:'bn:'+c,sp:B.sp,lv:B.lv,x:sp[0],y:sp[1],bn:1,until:c*B.cycle+B.stay}]; }
/* con đứng đầu đội là Blacknut (còn sức) */
const lcLeadBn=p=>{ const m=p&&p.lc&&p.lc.party&&p.lc.party[0]; return !!(m&&m.hp>0&&LC_SPECIES[m.sp]&&LC_SPECIES[m.sp].bn); };
/* dạng Huyền Thoại Lv50 (mọi loài trừ huyền thoại): đủ Lv50 tự thức tỉnh, chỉ số ×1,2 + bộ chỉ số phụ theo lối chơi 1 tướng Dota (mỗi hệ 3 lối: công / thủ / tốc, chọn theo dáng chỉ số loài).
   Lính Cát (khi đấu + đánh quái MU): ls hút máu, shred trừ giáp, root đánh ra trói (mất lượt / choáng 1,2 giây ở MU), dr giảm sát thương đối thủ + quái MU, splash đánh lan.
   Chủ (con đứng đầu đội, ở MU): cdr giảm hồi chiêu, mp mana, atk sát thương, drain hút máu, aspd tốc đánh, bkb kháng phép 2 giây (hồi theo điểm), move chạy nhanh, gold thêm % tiền kiếm được.
   Cân bằng: mỗi loài cùng 10 điểm (loài cuối dòng chỉ số gốc thấp được thêm điểm), mỗi điểm quy đổi theo unit */
const LC_ASC={lv:50,mul:1.2,bkb:{sec:2,cd:22,per:3,min:8},
  unit:{ls:.05,shred:.07,root:.05,dr:.04,splash:.12,cdr:.035,mp:.07,atk:.05,drain:.015,aspd:.05,bkb:1,move:.03,gold:.025},
  pet:['ls','shred','root','dr','splash'],
  names:{ls:'Hút máu',shred:'Trừ giáp',root:'Đánh ra trói',dr:'Giảm sát thương đối thủ / quái MU',splash:'Đánh lan',cdr:'Giảm hồi chiêu',mp:'Tăng mana',atk:'Tăng sát thương',drain:'Tăng hút máu',aspd:'Tăng tốc đánh',bkb:'Kháng phép 2 giây',move:'Chạy nhanh hơn',gold:'Thêm tiền kiếm được'},
  heroes:{hoa:[['Lina',{splash:3,atk:3,cdr:2,shred:1}],['Phoenix',{ls:2,dr:2,splash:2,drain:2,mp:1}],['Ember Spirit',{splash:2,move:3,aspd:2,atk:2}]],
    thuy:[['Morphling',{ls:2,atk:3,aspd:2,shred:2}],['Tidehunter',{dr:3,root:2,splash:2,mp:2}],['Naga Siren',{root:2,aspd:3,move:2,splash:2}]],
    moc:[['Nature\'s Prophet',{splash:2,atk:2,move:3,gold:2}],['Treant Protector',{root:3,dr:3,mp:2,cdr:1}],['Dark Willow',{root:3,cdr:2,move:2,atk:2}]],
    loi:[['Zeus',{splash:3,atk:3,mp:2,cdr:1}],['Razor',{shred:3,drain:2,dr:2,aspd:2}],['Storm Spirit',{splash:2,move:3,mp:2,cdr:2}]],
    tien:[['Enchantress',{ls:2,mp:2,cdr:3,dr:2}],['Oracle',{dr:3,bkb:2,mp:2,cdr:2}],['Dazzle',{ls:2,bkb:2,cdr:2,mp:3}]],
    ma:[['Shadow Fiend',{shred:2,atk:3,drain:2,gold:2}],['Spectre',{ls:2,dr:3,drain:2,move:2}],['Death Prophet',{ls:3,drain:3,splash:2,mp:1}]],
    long:[['Jakiro',{splash:3,root:2,mp:2,cdr:2}],['Dragon Knight',{dr:3,splash:3,drain:2,atk:1}],['Winter Wyvern',{root:2,dr:2,cdr:2,aspd:3}]],
    bang:[['Ancient Apparition',{shred:2,root:2,atk:3,cdr:2}],['Crystal Maiden',{root:3,mp:3,cdr:2,splash:1}],['Drow Ranger',{root:2,aspd:3,atk:2,shred:2}]],
    am:[['Night Stalker',{shred:2,ls:2,atk:2,move:3}],['Slardar',{shred:4,root:2,dr:2,move:1}],['Phantom Assassin',{ls:2,shred:2,atk:3,aspd:2}]],
    than:[['Invoker',{splash:2,cdr:3,mp:2,atk:2}],['Omniknight',{dr:3,bkb:3,ls:2,mp:1}],['Faceless Void',{root:3,aspd:3,bkb:2,ls:1}]],
    thuong:[['Sven',{splash:3,atk:3,dr:2,gold:1}],['Alchemist',{gold:4,dr:2,ls:2,aspd:1}],['Bounty Hunter',{gold:3,shred:2,move:2,atk:2}]],
    trung:[['Broodmother',{ls:3,splash:2,aspd:2,move:2}],['Nyx Assassin',{root:2,dr:3,cdr:2,mp:2}],['Weaver',{aspd:3,move:3,ls:2,shred:1}]],
    bay:[['Skywrath Mage',{shred:3,mp:3,atk:2,cdr:1}],['Batrider',{splash:3,root:2,dr:2,move:2}],['Windranger',{root:2,aspd:3,move:3,cdr:1}]],
    doc:[['Venomancer',{splash:3,shred:2,atk:2,cdr:2}],['Necrophos',{ls:2,drain:2,dr:2,mp:3}],['Viper',{shred:3,dr:2,root:2,drain:2}]],
    da:[['Tiny',{splash:3,atk:3,root:2,shred:1}],['Earthshaker',{root:3,splash:2,dr:2,cdr:2}],['Earth Spirit',{root:2,move:3,splash:2,cdr:2}]],
    vo:[['Ursa',{shred:2,ls:2,aspd:3,atk:2}],['Axe',{dr:3,splash:2,root:2,bkb:2}],['Troll Warlord',{aspd:4,bkb:2,ls:2,move:1}]]}};
/* bộ chỉ số dạng Lv50 của 1 loài (cache): { hero, style 0 công · 1 thủ · 2 tốc, pts {k: điểm}, v {k: giá trị} } */
const ASC_C={}; const lcAsc=sp=>{ if(ASC_C[sp]!==undefined) return ASC_C[sp]; const s=LC_SPECIES[sp]; if(!s||s.legend||s.npc) return ASC_C[sp]=null;
  const b=s.b, style=b[1]>=Math.max(b[0],b[2],b[3])?0:b[3]>=Math.max(b[0],b[2])?2:1, [hero,w]=(LC_ASC.heroes[s.t]||LC_ASC.heroes.thuong)[style], sum=b.reduce((a,v)=>a+v,0), B=Math.min(14,Math.round(10*500/sum)), tw=Object.values(w).reduce((a,v)=>a+v,0);
  const pts={}; let left=B; for(const [k,v] of Object.entries(w).sort((a,c)=>c[1]-a[1])){ const n=Math.max(1,Math.round(v*B/tw)); pts[k]=Math.min(n,left); left-=pts[k]; } if(left>0){ const k0=Object.keys(pts)[0]; pts[k0]+=left; }
  const v={}; for(const [k,n] of Object.entries(pts)) v[k]=k==='bkb'?Math.max(LC_ASC.bkb.min,LC_ASC.bkb.cd-LC_ASC.bkb.per*n):+(n*LC_ASC.unit[k]).toFixed(3); return ASC_C[sp]={hero,style,pts,v}; };
/* con đứng đầu đội đã thức tỉnh Lv50: chỉ số cho chủ (MU, tốc chạy, tiền) */
const lcLeadAsc=p=>{ const m=p&&p.lc&&p.lc.party&&p.lc.party[0]; if(!m||!m.asc||m.hp<=0) return null; const a=lcAsc(m.sp); return a?a.v:null; };
/* khắc hệ với loài 2 hệ: nhân hệ số của cả 2 hệ */
const lcEff=(mt,sp)=>{ const s=LC_SPECIES[sp]||{}, E=LC_EFF[mt]||{}; let e=E[s.t]??1; if(s.t2) e*=E[s.t2]??1; return e; };
/* ---------- 15 câu lạc bộ Lính Cát ở nơi vắng (rừng Bắc, vườn quốc gia): 12 võ đài có huấn luyện viên giỏi (thắng nhận Huy hiệu Chande), 3 CLB luyện tập đấu tập lấy EXP ----------
   Võ đài: đội đối thủ nhiều con (con sau ra khi con trước gục), không ném bóng, bỏ chạy là thua; không nhận thần thú siêu huyền thoại (×15, ×18). Đủ 12 huy hiệu: chọn 1 trong 5 vũ khí tối thượng cho Lính Cát */
const LCCLUB={sparDay:12,rematch:.3,
  gyms:[
    {n:1,t:'moc',x:79,y:8,name:'HLV Lá Xanh Thảo My',badge:'Huy hiệu Lá Xanh',bonus:1.05,ai:.75,prize:{vnd:300000,exp:200,items:{sach_kn:2}},team:[['nai_co',12],['khi_la',13],['la_binh',15]],
      say:'CLB Lá Xanh tập ở rừng thông. Muốn qua chị thì nhớ: Cỏ sợ Lửa, Băng, Bay, Độc, Côn trùng!',look:{gender:'nu',hair:'ponytail',hairColor:'3a6a2a',skin:'f0c4a0',outfit:{top:'sp_khoac_reu',bottom:'sp_q_v_mint',shoes:'sp_g_ung_mua',head:'sp_m_05'}}},
    {n:2,t:'bay',x:116,y:31,name:'HLV Phi Công Gió',badge:'Huy hiệu Cánh Gió',bonus:1.07,ai:.78,prize:{vnd:450000,exp:260,items:{bong_vang:3}},team:[['se_nhi',16],['vet_noi',17],['chim_ung',18],['hac_trang',19]],
      say:'Trên trời ai thắng được đội bay của anh? Điện, Băng, Đá là khắc tinh, nhưng đừng mong anh chỉ thêm!',look:{gender:'nam',hair:'swept',hairColor:'2b2326',skin:'e0a878',outfit:{top:'sp_a_bomber',bottom:'sp_q_cargo_be',shoes:'sp_g_boot_den',eyes:'sp_k_avi_0'}}},
    {n:3,t:'trung',x:147,y:8,name:'HLV Côn Trùng Tí Nị',badge:'Huy hiệu Cánh Bướm',bonus:1.09,ai:.8,prize:{vnd:600000,exp:320,items:{sach_kn:3}},team:[['ong_vo',20],['bo_ngua_kiem',21],['bo_sung',22],['buom_tien',23]],
      say:'Côn trùng nhỏ mà có võ! Lửa, Bay, Đá đốt bọn chị đau lắm đấy...',look:{gender:'nu',hair:'bun',hairColor:'2b2326',skin:'f6d2b8',outfit:{top:'sp_a_tiedye',bottom:'sp_q_short_kaki',shoes:'sp_g_sandal_hong',head:'sp_m_34'}}},
    {n:4,t:'thuy',x:175,y:23,name:'HLV Sóng Bạc Hải Nam',badge:'Huy hiệu Sóng Bạc',bonus:1.11,ai:.82,prize:{vnd:800000,exp:400,items:{sach_kn5:1,thuoc_cat:5}},team:[['rai_kiem',24],['ech_ninja',25],['map_rang',26],['thuy_tuong',27]],
      say:'Nước chảy đá mòn. Điện với Cỏ là thứ duy nhất làm đội anh run tay.',look:{gender:'nam',hair:'messy',hairColor:'1c1820',skin:'c8946a',outfit:{top:'sp_a_soc_ngang',bottom:'sp_q_short_kaki',shoes:'sp_g_xo_ngon',head:'sp_m_14'}}},
    {n:5,t:'loi',x:245,y:45,name:'HLV Sấm Sét Volt',badge:'Huy hiệu Tia Chớp',bonus:1.13,ai:.84,prize:{vnd:1000000,exp:480,items:{bong_vang:5,da_sam:1}},team:[['cuu_set',28],['luon_sam',29],['set_binh',30],['loi_tuong',31],['cat_loi',31]],
      say:'Điện áp đội tao cao lắm. Hệ Đá không ăn điện đâu nhé, à mà tao lỡ mồm rồi.',look:{gender:'nam',hair:'fade',hairColor:'f2c43d',skin:'d8a47a',outfit:{top:'sp_a_bomber',bottom:'sp_q_cargo_be',shoes:'sp_g_boot_vang',head:'sp_m_21'}}},
    {n:6,t:'hoa',x:231,y:56,name:'HLV Hoả Diệm Hồng Nhung',badge:'Huy hiệu Ngọn Lửa',bonus:1.15,ai:.86,prize:{vnd:1200000,exp:560,items:{sach_kn5:1,da_lua:1}},team:[['hoa_khuyen',31],['ga_lua',32],['cat_hoa',33],['than_khuyen',34],['hoa_tuong',34]],
      say:'Lửa của chị đốt cháy mọi đội Cỏ, Băng, Bọ. Nước với Đá à? Thử xem chị có sợ không!',look:{gender:'nu',hair:'long',hairColor:'c8302a',skin:'f0c4a0',outfit:{top:'sp_a_soc_do',bottom:'vay_den',shoes:'giay_den',neck:'sp_c_ngoc_trai'}}},
    {n:7,t:'da',x:261,y:26,name:'HLV Thạch Trụ Lão Sơn',badge:'Huy hiệu Đá Tảng',bonus:1.17,ai:.88,prize:{vnd:1400000,exp:640,items:{ngoc_ch:1,sach_kn5:1}},team:[['te_giac_da',34],['rua_nui',35],['thach_anh',36],['nui_da',37],['thach_te',37]],
      say:'Đội của lão cứng như núi. Nước, Cỏ, Võ thì... thôi lão không nói nữa.',look:{gender:'nam',hair:'bald',hairColor:'9a9a9a',skin:'c8946a',outfit:{top:'sp_a_gile',bottom:'kaki',shoes:'sp_g_sandal_nau'},opts:{beard:'full'}}},
    {n:8,t:'vo',x:266,y:67,name:'HLV Thiết Quyền Bá Đạo',badge:'Huy hiệu Nắm Đấm',bonus:1.19,ai:.9,prize:{vnd:1700000,exp:720,items:{ngoc_ch:1,sach_kn5:2}},team:[['gau_truc_vo',37],['tui_quyen',38],['vo_tuong',39],['hoa_ke',40],['quyen_vuong_thu',40]],
      say:'Võ đài này chỉ có một luật: ai đứng cuối cùng là người thắng! Bay, Tâm linh, Tiên làm bọn ta khó chịu lắm.',look:{gender:'nam',hair:'buzz',hairColor:'1c1820',skin:'b8845a',outfit:{top:'set_superman',bottom:'kaki',shoes:'dep_to_ong'}}},
    {n:9,t:'ma',x:255,y:84,name:'HLV Bóng Đêm U Linh',badge:'Huy hiệu U Linh',bonus:1.21,ai:.92,prize:{vnd:2000000,exp:800,items:{ngoc_ch:2,bong_vang:5}},team:[['bi_quy',40,2],['long_den',41,2],['quy_tuong',42,2],['bi_vuong',43,2],['chuc_dang',43,2]],
      say:'Hihihi... hồn ma không sợ đấm đá. Chỉ có Ma và Bóng tối mới chạm được vào bọn chị...',look:{gender:'nu',hair:'long',hairColor:'f4f0e0',skin:'e8d8d0',outfit:{top:'cardigan',bottom:'vay_den',shoes:'giay_den'}}},
    {n:10,t:'bang',x:311,y:28,name:'HLV Băng Giá Tuyết Lan',badge:'Huy hiệu Băng Tuyết',bonus:1.23,ai:.94,prize:{vnd:2400000,exp:900,items:{ngoc_ch:2,sach_kn5:2}},team:[['cut_bang',43,4],['nguoi_tuyet',44,4],['soi_tuyet',45,4],['cat_bang',45,4],['bang_lang',46,4],['bang_de',46,4]],
      say:'Lạnh thấu xương chưa? Lửa, Võ, Đá là ba thứ đội em ghét nhất.',look:{gender:'nu',hair:'bun',hairColor:'b8e0f8',skin:'f6d2b8',outfit:{top:'sp_khoac_reu',bottom:'sp_q_v_xep_ly',shoes:'sp_g_boot_den',head:'sp_m_48'}}},
    {n:11,t:'than',x:292,y:70,name:'HLV Thiền Sư Tâm Không',badge:'Huy hiệu Tâm Nhãn',bonus:1.25,ai:.96,prize:{vnd:2800000,exp:1000,items:{ngoc_ch:3,ngoc_ch_ht:1}},team:[['hau_niem',46,5],['cu_than',47,5],['mong_than',48,5],['dai_niem',48,5],['te_thien',49,5],['tien_hau',49,5]],
      say:'Ta đọc được nước đi của con trước khi con nghĩ ra. Bóng tối, Ma, Côn trùng... con tự hiểu.',look:{gender:'nam',hair:'bald',hairColor:'1c1820',skin:'d8a47a',outfit:{top:'sp_a_ringer',bottom:'kaki',shoes:'sp_g_sandal_nau'},opts:{beard:'full'}}},
    {n:12,t:'long',x:327,y:72,name:'Long Vương Tối Thượng Đại Long',badge:'Huy hiệu Long Vương',bonus:1.3,ai:.98,prize:{vnd:4000000,exp:1500,items:{ngoc_ch_ht:2,sach_kn5:3}},team:[['long_vuong',50,8,1],['bao_cat_long',50,8,1],['hai_than',50,8,1],['thien_long',50,8,1],['thuong_luong',50,8,1],['phi_long',50,8,1]],
      say:'Võ đài cuối cùng. 6 con rồng Lv50 dạng Huyền Thoại, +8 ngọc. Băng, Rồng, Tiên... chỉ kẻ mạnh mới được chạm vào vũ khí tối thượng.',look:{gender:'nam',hair:'swept',hairColor:'1c1820',skin:'e0a878',outfit:{hairx:'sp_t_pomp',top:'vest',bottom:'kaki',shoes:'giay_den',eyes:'sp_k_avi_1'}}}],
  train:[{k:'tanbinh',x:92,y:39,name:'CLB Tân Binh Rừng Thông',coach:'Thầy Tân',off:-2,n:2,mul:1.3,vnd:20000},{k:'luyencong',x:218,y:25,name:'CLB Luyện Công Vườn Quốc Gia',coach:'Cô Luyện',off:1,n:3,mul:1.6,vnd:40000},
    {k:'caothu',x:286,y:47,name:'CLB Cao Thủ Suối Đá',coach:'Võ sư Cao',off:4,n:3,mul:2,vnd:80000}],
  /* 5 vũ khí tối thượng: chọn 1 khi đủ 12 huy hiệu, trao cho Lính Cát nào cũng được (đổi qua lại). all: mọi chỉ số, rồi cộng riêng từng chỉ số */
  weapons:{rapier:{name:'Thần Kiếm Rapier',all:.2,atk:.45,crit:.2,desc:'Mọi chỉ số +20%, công +45%, thêm 20% chí mạng (×1,5)'},
    aegis:{name:'Khiên Aegis Bất Tử',all:.2,def:.4,hp:.2,revive:.5,desc:'Mọi chỉ số +20%, thủ +40%, máu +20%, gục lần đầu mỗi trận thì hồi sinh 50% máu'},
    satanic:{name:'Huyết Kiếm Satanic',all:.2,hp:.4,ls:.25,desc:'Mọi chỉ số +20%, máu +40%, hút 25% sát thương gây ra'},
    butterfly:{name:'Cánh Bướm Butterfly',all:.2,spd:.6,evade:.2,desc:'Mọi chỉ số +20%, tốc +60%, né 20% đòn đánh'},
    aghanim:{name:'Quyền Trượng Aghanim',all:.32,pow:.1,pierce:1,desc:'Mọi chỉ số +32%, chiêu +10% sức mạnh, xuyên kháng hệ (×0,5 thành ×1, miễn nhiễm thành ×0,5)'}}};
for(const G0 of LCCLUB.gyms){ const id='lcg_'+G0.n; NPCS.push({id,x:G0.x,y:G0.y-1.4,place:'lcgym'}); NPC_LOOKS[id]={name:G0.name+' (CLB '+LC_TYPES[G0.t].name+')',look:G0.look}; }
for(const T0 of LCCLUB.train){ const id='lct_'+T0.k; NPCS.push({id,x:T0.x,y:T0.y-1.4,place:'lctrain'}); NPC_LOOKS[id]={name:T0.coach+' ('+T0.name+')',look:{gender:'nam',hair:'buzz',hairColor:'2b2326',skin:'d8a47a',outfit:{top:'sp_a_ringer',bottom:'sp_q_cargo_be',shoes:'sp_g_boot_den',head:'sp_m_26'}}}; }
for(const [k,to] of [['chuot_tuong','chuot_vuong'],['ho_mang','mang_xa'],['doi_dem','da_doi'],['long_ngu','hai_long']]) LC_SPECIES[k].evo={to,lv:25};
for(const s of Object.values(LC_SPECIES)){ const nx=s.evo&&LC_SPECIES[s.evo.to]; if(!nx||s.legend) continue; if(s.st===2&&nx.st===3&&s.evo.lv>25) s.evo.lv=25; else if(s.st===1&&nx.evo&&s.evo.lv>=22) s.evo.lv=16; }
for(const s of Object.values(LC_SPECIES)){ if(s.npc) continue; const tgt=s.legend?580:s.st===1?300:s.st===2?(s.evo?405:450):500, sum=s.b.reduce((a,v)=>a+v,0); s.b=s.b.map(v=>Math.max(15,Math.round(v*tgt/sum))); }
const lcStats=(sp,lv)=>{ const b=LC_SPECIES[sp].b; return {hp:Math.floor(b[0]*2*lv/100)+lv+10,atk:Math.floor(b[1]*2*lv/100)+5,def:Math.floor(b[2]*2*lv/100)+5,spd:Math.floor(b[3]*2*lv/100)+5}; };
// chỉ số thật của 1 con (có cấp ngọc cường hoá enh: mỗi cấp +6% · dạng huyền thoại myth: ×1,35)
const lcStatsOf=m=>{ const b=lcStats(m.sp,m.lv), MN=LINHCAT.men, k=(1+(m.enh||0)*LINHCAT.enh.per)*(m.myth?LINHCAT.myth.mul:1)*(LC_SPECIES[m.sp].sl||1)*(m.asc?LC_ASC.mul:1)*(LC_SPECIES[m.sp].men?MN.mul*(1+(m.ol||0)*MN.perLv):1),   /* Mèn Mén: ×1,5 theo cấp chủ (ol) */ W=(m.held&&LCCLUB.weapons[m.held])||{}, a=W.all||0;   /* sl: thần thú siêu huyền thoại ×15 · asc: dạng Huyền Thoại Lv50 · held: vũ khí tối thượng */
  return {hp:Math.round(b.hp*k*(1+a+(W.hp||0))),atk:Math.round(b.atk*k*(1+a+(W.atk||0))),def:Math.round(b.def*k*(1+a+(W.def||0))),spd:Math.round(b.spd*k*(1+a+(W.spd||0)))}; };
const lcMoves=(sp,lv)=>{ const s=LC_SPECIES[sp]; if(s.men) return ['nem_cut','axit','bom_doc','dam_sam']; const tm=LC_TYPE_MOVES[s.t]||LC_TYPE_MOVES.thuong, out=['hu',tm[0]]; if(lv>=10) out.push(tm[1]); if(lv>=22&&!out.includes(tm[2])) out.push(tm[2]);
  const t2=s.t2&&LC_TYPE_MOVES[s.t2]; if(t2){ if(lv>=16&&!out.includes(t2[1])) out.push(t2[1]); if(lv>=36&&!out.includes(t2[2])) out.push(t2[2]); } return out; };   /* loài 2 hệ: Lv16 học chiêu vừa, Lv36 chiêu mạnh của hệ 2 */
const lcNext=lv=>lv*20;   // EXP lên cấp kế
// Lính Cát hoang đang ở mỗi điểm (đổi loài mỗi `period`, khớp giữa server và máy khách); ban ngày không có hệ Ma
function lcWild(ms=Date.now(),scene='retreat'){ const L=LINHCAT, M=L.maps[scene]; if(!M) return []; const per=Math.floor(ms/L.period), h=vnTime(ms).hf, night=h>=19||h<5, salt=scene.length*977+scene.charCodeAt(0);
  return M.spots.map(([x,y,z],i)=>{ const Z=L.zones[z], r=n=>{ let h=(per*73856093)^(i*19349663)^(n*83492791)^salt; h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; return (h>>>0)/4294967296; };
    let pool=(M.pool||Z.pool).filter(k=>night||!LC_SPECIES[k].night); if(!pool.length) pool=['cat_con']; let sp=pool[Math.floor(r(1)*pool.length)], lv=Z.lv[0]+Math.floor(r(2)*(Z.lv[1]-Z.lv[0]+1));
    if(z>=3&&r(5)<L.legendChance){ sp=L.legend[Math.floor(r(6)*L.legend.length)]; lv=Math.max(lv,30); }   // huyền thoại: rất hiếm, chỉ ở vùng xa
    return {i,key:scene+':'+per+':'+i,sp,lv,x:x+(r(3)-.5)*2,y:y+(r(4)-.5)*1.2}; }).concat(((L.water||{})[scene]||[]).map(([x,y,z],j)=>{ const i=1000+j, Z=L.wzones[z], r=n=>{ let h=(per*73856093)^(i*19349663)^(n*83492791)^salt; h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; return (h>>>0)/4294967296; };
    let sp=Z.pool[Math.floor(r(1)*Z.pool.length)], lv=Z.lv[0]+Math.floor(r(2)*(Z.lv[1]-Z.lv[0]+1)); if(z===3&&r(5)<L.wRare.chance){ sp=L.wRare.sp; lv=Math.max(lv,L.wRare.lv); }   /* dưới nước: lắc rất ít cho khỏi lên bờ */
    return {i,key:scene+':'+per+':w'+j,sp,lv,x:x+(r(3)-.5)*.5,y:y+(r(4)-.5)*.4,water:1}; })).concat(scene==='retreat'?menWild(per,salt):[],bnWild(ms,scene)); }
// Mèn Mén lang thang: mỗi chu kỳ lắc 1 lần xem có hiện không, hiện ở 1 bãi rừng xa
function menWild(per,salt){ const M=LINHCAT.men, out=[], used=new Set(); for(let j=0;j<M.cap;j++){ const r=n=>{ let h=(per*73856093)^((3000+j)*19349663)^(n*83492791)^salt; h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; h=Math.imul(h,0x45d9f3b); h^=h>>>16; return (h>>>0)/4294967296; };
    if(r(1)>=M.chance) continue; let s=Math.floor(r(2)*M.spots.length); while(used.has(s)) s=(s+1)%M.spots.length; used.add(s); const [x,y]=M.spots[s]; out.push({i:2000+j,key:'retreat:'+per+':m'+j,sp:M.sp,lv:M.lv,x,y,men:1}); } return out; }
Object.assign(ITEMS,{bong_cat:{name:'Bóng Cát',icon:'lcball'},bong_vang:{name:'Bóng Cát Vàng',icon:'lcball2'},thuoc_cat:{name:'Thuốc hồi máu Lính Cát',icon:'lcpotion'},
  da_lua:{name:'Đá Lửa',icon:'lcstone_hoa'},da_nuoc:{name:'Đá Nước',icon:'lcstone_thuy'},da_sam:{name:'Đá Sấm',icon:'lcstone_loi'},da_la:{name:'Đá Lá',icon:'lcstone_moc'},
  da_bang:{name:'Đá Băng',icon:'lcstone_bang'},da_tien:{name:'Đá Tiên',icon:'lcstone_tien'},da_trang:{name:'Đá Trăng',icon:'lcstone_am'},da_tam:{name:'Đá Tâm Linh',icon:'lcstone_than'}});
SKILLS.linhcat={name:'Huấn luyện Lính Cát',key:'—',desc:'Học với Giáo sư Cát ở Trung tâm Lính Cát (cạnh Khu tâm linh, Đà Bắc): thu phục, huấn luyện Lính Cát'};
PLACES.linhcat={name:'Trung tâm Lính Cát',where:'cạnh Khu tâm linh (chùa Đà Bắc)',door:{x:LINHCAT.door.x,y:LINHCAT.door.y},scene:'linhcat'};
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
  cls:{dk:{name:'Chiến Binh Bóng Tối',en:'Dark Knight',hp:300,mp:40,atk:20,def:18,aspd:1,regen:2,reach:4.3,armor:.12,col:'#c8302a',set:'mu_dk',desc:'Giáp đỏ, kiếm lớn, cận chiến. Máu trâu, giáp dày, chém xoáy cực mạnh.'},
    elf:{name:'Tiên Nữ',en:'Fairy Elf',hp:285,mp:90,atk:15,def:13,aspd:1.35,regen:1.8,reach:8.6,armor:.06,shred:.4,slowp:1,gw:.3,stunp:.12,stunDur:.8,move:2,col:'#f2c43d',set:'mu_elf',
      desc:'Áo trắng viền vàng, song kiếm tiên phóng kiếm khí tầm xa gấp đôi. Trừ giáp cao, thi thoảng bắn choáng quái, chạy nhanh gấp 2. Nội tại: phát bắn nào cũng làm chậm + giảm hồi máu. Chiêu 3 phun lửa: giảm hồi máu, giảm sát thương của quái.'},   /* đánh xa: tầm ×2, shred / slowp / gw cộng thẳng vào chỉ số phụ, stunp: tỉ lệ choáng quái mỗi đòn trúng, move: tốc chạy trong MU */
    dw:{name:'Phù Thuỷ Bóng Tối',en:'Dark Wizard',hp:95,mp:130,atk:25,def:6,aspd:.85,regen:1,reach:2.3,col:'#3a6ad8',set:'mu_dw',desc:'Giáp xanh, gậy phép, chưởng lửa chưởng sét áp sát. Máu giấy nhưng sát thương phép to nhất.'},
    dt:{name:'Đại Tượng',en:'War Elephant',hp:3000,mp:60,atk:16,def:90,aspd:.33,regen:2.5,reach:4.3,armor:.6,armorCap:.85,col:'#9aa0b0',set:'mu_dt',
      desc:'Tướng tank: giáp voi chiến bạc, mũ đầu voi ngà trắng, khiên tháp + chuỳ. Máu gấp 10, giáp gấp 5 Chiến Binh, đánh chậm 3 lần. Đập choáng, bật giáp phản đòn, tự hồi máu.'}},   /* tank: máu / thủ / giáp so với Chiến Binh (300 → 3000, 18 → 90, 12% → 60%), trần giáp 85% */
  skills:{dk:[{k:'chem',name:'Chém',mp:0,cd:.8,mul:1,range:4.4},{k:'xoay',name:'Chém Xoáy',mp:12,cd:5,mul:2.1,range:4.8},{k:'gong',name:'Gồng Giáp',mp:20,cd:18,buff:'def',dur:8,heal:.15}],
    elf:[{k:'dam',name:'Kiếm Khí Tiên',mp:0,cd:.8,mul:.95,range:8.8},{k:'tamlien',name:'Tam Liên Trảm',mp:10,cd:4,mul:1.9,range:9.2},{k:'phunlua',name:'Phun Lửa',mp:25,cd:12,mul:2.4,range:9.2,aoe:2.5,gw:.5,weak:.35,wdur:5}],   /* phun lửa: lan 2,5 ô quanh mục tiêu, giảm hồi máu 50% + giảm sát thương quái 35% trong 5 giây */
    dw:[{k:'hoachuong',name:'Hoả Chưởng',mp:4,cd:1.2,mul:1.25,range:7.4},{k:'loichuong',name:'Lôi Chưởng',mp:14,cd:5,mul:2.4,range:7.6},{k:'thienthach',name:'Mưa Thiên Thạch',mp:30,cd:14,mul:3.6,range:8}],   /* tầm chiêu Phù Thuỷ +5 ô */
    dt:[{k:'dapchoang',name:'Đập Choáng',mp:10,cd:6,mul:1.3,range:4.6,stun:1.8},{k:'batgiap',name:'Bật Giáp',mp:20,cd:16,buff:'giap',dur:6,reflect:.4},{k:'hoimau',name:'Hồi Máu',mp:25,cd:14,heal:.4,cleanse:1}]},   /* bật giáp: thủ ×2, giáp +20%, phản 40% sát thương gốc; hồi máu: 40% máu + giải độc / chậm */
  // boss tổng Luffy Gear 5 + boss phụ Naruto Cửu Vĩ (rừng Làng Lá phía Đông). Đòn của boss: single (đánh 1 người), circle (vùng tròn ở chỗ 1 người), multi (n vùng cùng lúc),
  // cone (hình nón trước mặt, nhiều nhát), jump (nhảy tới chỗ 1 người, đáp xuống gây sát thương), ring (sóng quanh boss), chase (vùng tròn bám theo 1 người tới lock giây
  // trước lúc nổ), line (tia thẳng rộng w về phía người gần nhất; dash: boss lao theo tia), trail (n vùng nổ nối đuôi nhau từ boss tới người, cách nhau step ms),
  // cross (n tia toả quanh boss, waves đợt xoay lệch nhau gap ms), donut (vành khuyên r0–r quanh boss: đứng sát boss mới an toàn). then: đòn nối ngay sau khi đòn này nổ
  // (từ giai đoạn phase). move: boss đi áp sát người gần nhất (ô/giây). Boss ngắm đón đầu theo hướng người đang chạy. area: khu của boss,
  // boss chỉ nhắm người đứng trong khu và nhảy cũng không ra khỏi khu (không sang khu boss khác). Mọi đòn có cảnh báo (warn giây), né được:
  // tới lúc nổ mà đã ra khỏi vùng thì không mất máu. phase: chỉ dùng khi máu boss xuống dưới mốc (2: <60%, 3: <30%); giai đoạn 3 boss nổi giận (đánh mạnh + nhanh hơn).
  bosses:{
    luffy:{name:'Luffy Gear 5',sprite:'luffy',every:20*60e3,offset:0,life:10*60e3,hp:3500,perPlayer:2200,def:12,home:{x:22,y:6.6},area:{x0:4,x1:40,y0:3,y1:27},big:1,reach:5,crit:.75,   /* tầm +5 ô, chí mạng 75% (×1,5) */
      attacks:[{k:'pistol',kind:'single',name:'Gomu Gomu Pistol',every:3.2,warn:.7,range:7,r:1.4,dmg:24},{k:'gatling',kind:'cone',name:'Gomu Gomu Gatling',every:9,warn:1,hits:5,tick:.25,range:6,cone:.55,dmg:9,phase:2},
        {k:'gigant',kind:'circle',name:'Gomu Gomu Gigant',every:11,warn:1.8,r:3,dmg:58},{k:'rocket',kind:'jump',name:'Gomu Gomu Rocket',every:19,warn:1.3,r:2.2,dmg:36,then:{kind:'ring',r:3.2,dmg:26,warn:.55,phase:2}},
        {k:'bajrang',kind:'line',name:'Gomu Gomu Bajrang Gun',every:10,warn:1.3,range:12,w:1.3,dmg:48},{k:'sieuxa',kind:'single',name:'Gomu Gomu Đạn Siêu Xa',every:8,warn:.9,range:7,far:10,r:1.6,dmg:44},{k:'kong',kind:'trail',name:'Gomu Gomu Kong Gatling',every:13,warn:1,n:6,step:170,r:1.5,dmg:30,phase:2},
        {k:'dawn',kind:'cross',name:'Dawn Whip',every:16,warn:1.2,n:4,waves:2,gap:650,range:10,w:.9,dmg:40,phase:2},{k:'bounce',kind:'chase',name:'Cao Su Dội Đất',every:12,warn:2.4,lock:.45,r:2.2,dmg:44,phase:3},
        {k:'drum',kind:'ring',name:'Trống Giải Phóng',every:15,warn:1.6,r:7.5,dmg:34,phase:3}],
      phases:[.6,.3],enrage:{mul:1.5,speed:1.35},move:1.4,drops:'luffy'},
    naruto:{name:'Naruto Cửu Vĩ',sprite:'naruto',every:10*60e3,offset:5*60e3,life:7*60e3,hp:1800,perPlayer:1000,def:8,home:{x:57,y:8},area:{x0:45,x1:69,y0:3,y1:14},
      attacks:[{k:'shuriken',kind:'single',name:'Phi Tiêu Gió',every:2.6,warn:.6,range:8,r:1.2,dmg:16},{k:'rasengan',kind:'jump',name:'Rasengan',every:8,warn:1.1,r:1.8,dmg:34,then:{kind:'ring',r:2.8,dmg:22,warn:.5,phase:2}},{k:'rendan',kind:'trail',name:'Uzumaki Rendan',every:10,warn:.9,n:5,step:190,r:1.5,dmg:26},
        {k:'rasenshuriken',kind:'chase',name:'Phong Độn: Rasen Shuriken',every:11,warn:2.2,lock:.5,r:2.3,dmg:40,phase:2},{k:'daidotpha',kind:'donut',name:'Phong Độn: Đại Đột Phá',every:13,warn:1.4,r0:2.2,r:7,dmg:34,phase:2},
        {k:'vithu',kind:'line',name:'Vĩ Thú Ngọc',every:15,warn:1.4,range:13,w:1.5,dmg:50,phase:3},
        {k:'bunshin',kind:'multi',name:'Ảnh Phân Thân Chi Thuật',every:12,warn:1.4,n:3,r:1.8,dmg:22,phase:2},{k:'roar',kind:'ring',name:'Cửu Vĩ Gầm',every:14,warn:1.5,r:6,dmg:28,phase:3},
        {k:'muavithu',kind:'rain',name:'Mưa Bom Vĩ Thú',form:'cuuvi',hpBelow:.25,noSpd:1,every:7,warn:1.2,n:10,r:1.8,pct:.2}],   /* Cửu Vĩ dưới 25% máu: 10 quả bom vĩ thú rơi, mỗi quả trừ 20% máu tối đa (xuyên giáp) */
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.8,drops:'naruto',
      forms:[{k:'cuuvi',when:{hp:.5},name:'Cửu Vĩ Hồ Ly',say:'Sức mạnh Cửu Vĩ... bùng nổ!',spd:20,rangeMul:3,size:2,move:1.5,sprite:'cuuvi',guard:{armor:.25,resist:.25}}]},   /* Cửu Vĩ: giáp +25%, kháng phép +25% */   /* hoá Cửu Vĩ: tầm ×3, đánh nhanh ×20 */
    cuamay:{name:'Quỷ Cưa',sprite:'cuamay',every:12*60e3,offset:3*60e3,life:7*60e3,hp:1700,perPlayer:950,def:9,home:{x:84,y:23},area:{x0:72,x1:94,y0:17,y1:27},
      attacks:[{k:'cua',kind:'single',name:'Cưa Xé',every:2.4,warn:.6,range:5,r:1.4,dmg:18},{k:'lao',kind:'jump',name:'Lao Cưa',every:8,warn:1,r:2,dmg:32},{k:'xegio',kind:'line',name:'Cưa Lao Xé Gió',every:9,warn:1.1,range:10,w:1.1,dash:1,dmg:40},
        {k:'xichcua',kind:'cross',name:'Xích Cưa Tứ Phương',every:14,warn:1.2,n:4,waves:2,gap:600,range:8,w:.9,dmg:34,phase:2},{k:'cuatruy',kind:'chase',name:'Cưa Truy Hồn',every:12,warn:2.2,lock:.45,r:2,dmg:38,phase:3},
        {k:'xoaycua',kind:'ring',name:'Bão Cưa Xoay',every:12,warn:1.4,r:4.5,dmg:30,phase:2},{k:'manh',kind:'multi',name:'Mưa Mảnh Kim Loại',every:11,warn:1.5,n:4,r:1.6,dmg:20,phase:3}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.6,drops:'cuamay',basicOnly:1,
      spin:{hits:8,win:3,dur:3,r:3,tick:.5,dmg:8,mul:4,cd:6,resist:.5},   /* đang xoay cưa: phép chỉ bị kháng 50% (gây nửa sát thương), không xoay thì miễn phép hoàn toàn */call:{k:'reze',hp:.5},pochita:{every:22,dur:6,first:8,nuke:{warn:3,dmg:70,safe:2.6,fx:{stun:1}}}},
    /* Quỷ Cưa: miễn phép, chỉ mất máu vì đánh thường; bị đánh dồn (8 đòn / 3 giây) thì xoay cưa vòng tròn 3 giây, mọi đòn ×4; còn 50% gọi Quỷ Bom Reze;
       có Reze thì cứ 22 giây hoá Pochita 6 giây (đứng im, không đánh), lúc đó Reze thả bom hạt nhân phủ cả khu, chỉ nấp sát Pochita (2,6 ô) là an toàn */
    reze:{name:'Quỷ Bom Reze',sprite:'reze',summon:1,every:12*60e3,life:7*60e3,hp:1700,perPlayer:950,def:9,home:{x:84,y:22},area:{x0:72,x1:94,y0:17,y1:27},
      attacks:[{k:'luudan',kind:'rain',name:'Mưa Lựu Đạn',every:4,warn:.9,n:6,r:1.4,dmg:18,fx:{stun:.5}},{k:'nobom',kind:'single',name:'Bom Hẹn Giờ',every:3,warn:.8,range:8,r:1.6,dmg:24},
        {k:'phaobom',kind:'line',name:'Pháo Bom Xé Gió',every:9,warn:1.2,range:12,w:1.2,dmg:40,phase:2},{k:'nobomvong',kind:'ring',name:'Nổ Bom Toàn Thân',every:13,warn:1.4,r:4.5,dmg:36,phase:2}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.6,drops:'reze'},
    duongvu_ma:{name:'Dươngg Vũ',sprite:'gengar',every:15*60e3,offset:8*60e3,life:7*60e3,hp:1900,perPlayer:1050,def:8,home:{x:84,y:8},area:{x0:72,x1:94,y0:3,y1:14},
      attacks:[{k:'bongma',kind:'ghost',name:'Hoá Bóng Ma',every:5,exact:1,dur:2.5,r:3,tick:.5,dmg:10,fx:{dot:{pct:.03,dur:4,k:'doc'}}},{k:'nuot',kind:'gulp',name:'Nuốt Chửng',hpBelow:.35,noSpd:1,every:15,dur:7,pct:.04},   /* dưới 35% máu: nuốt 1 người bất kỳ 7 giây (đứng im trong bụng, mất 4% máu / giây), hết giờ nhổ ra */{k:'bongden',kind:'single',name:'Cầu Bóng Đêm',every:2.8,warn:.7,range:8,r:1.4,dmg:18},{k:'xuyen',kind:'jump',name:'Xuyên Tường',every:9,warn:1.2,r:2,dmg:30},{k:'bongtruy',kind:'chase',name:'Bóng Ma Truy Đuổi',every:9,warn:2.2,lock:.4,r:2,dmg:34},
        {k:'vongma',kind:'donut',name:'Vòng Ma Ám',every:13,warn:1.4,r0:2.2,r:6.5,dmg:32,phase:2},{k:'xuyenhon',kind:'trail',name:'Xuyên Hồn',every:12,warn:1,n:6,step:170,r:1.5,dmg:26,phase:3},
        {k:'thoimien',kind:'multi',name:'Thôi Miên',every:11,warn:1.5,n:3,r:1.8,dmg:22,phase:2},{k:'nguyenrua',kind:'ring',name:'Lời Nguyền Zen',every:14,warn:1.6,r:6,dmg:30,phase:3}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.5,drops:'duongvu_ma',minAt:{hp:.5,k:'hoangha',n:10}},   /* còn 50% máu gọi 10 Anh tóc dài kakaka */
    rongxanh:{name:'Rồng Dải Xanh',sprite:'rong',every:18*60e3,offset:11*60e3,life:7*60e3,hp:2300,perPlayer:1200,def:10,home:{x:57,y:23},area:{x0:45,x1:69,y0:17,y1:27},big:1,
      attacks:[{k:'longkich',kind:'single',name:'Long Kích',every:3,warn:.8,range:8,r:1.5,dmg:20},{k:'hoithorong',kind:'cone',name:'Hơi Thở Rồng',every:9,warn:1.1,hits:5,tick:.25,range:7,cone:.5,dmg:9},
        {k:'bonhao',kind:'jump',name:'Bổ Nhào',every:12,warn:1.3,r:2.4,dmg:34,then:{kind:'ring',r:3.4,dmg:26,warn:.55,phase:2}},{k:'longtuc',kind:'line',name:'Long Tức Quét',every:10,warn:1.3,range:13,w:1.6,dmg:46},
        {k:'baorong',kind:'donut',name:'Bão Tố Vòng Rồng',every:14,warn:1.5,r0:2.4,r:7,dmg:36,phase:2},{k:'longvi',kind:'cross',name:'Long Vĩ Bát Phương',every:16,warn:1.3,n:8,range:9,w:.8,dmg:40,phase:3},{k:'loc',kind:'ring',name:'Lốc Xoáy Thiên Không',every:14,warn:1.6,r:6.5,dmg:30,phase:2},
        {k:'thienthachrong',kind:'multi',name:'Thiên Thạch Rồng',every:12,warn:1.6,n:4,r:1.8,dmg:24,phase:3}],
      phases:[.6,.3],enrage:{mul:1.45,speed:1.3},move:1.2,drops:'rongxanh',
      call:{k:'songoku',hp:.5},dive:{hp:.25,every:10,dur:2}},   /* còn 50% máu gọi Songoku ra đánh cùng; dưới 25% cứ 10 giây lặn xuống nước 2 giây (không đánh được, không ra đòn) */
    // Songoku: chỉ ra khi Rồng Dải Xanh gọi (summon, không có lịch riêng); còn 50% máu hoá Siêu Saiyan: tóc vàng, đánh nhanh ×2,5, né 20%, có Super Kamehameha
    songoku:{name:'Songoku',sprite:'songoku',summon:1,every:18*60e3,life:7*60e3,hp:2000,perPlayer:1100,def:10,home:{x:57,y:21},area:{x0:45,x1:69,y0:17,y1:27},
      attacks:[{k:'damlh',kind:'single',name:'Đấm Liên Hoàn',every:2.4,warn:.6,range:7,r:1.4,dmg:20},{k:'kame',kind:'line',name:'Kamehameha',every:9,warn:1.5,range:14,w:1.5,dmg:52},
        {k:'dichchuyen',kind:'blink',name:'Dịch Chuyển Tức Thời',every:12,warn:.7,r:1.9,dmg:38},{k:'kaioken',kind:'trail',name:'Kaioken Liên Hoàn Cước',every:11,warn:1,n:6,step:160,r:1.5,dmg:28,phase:2},
        {k:'genki',kind:'circle',name:'Genki Dama',every:20,warn:2.8,r:3.6,dmg:90,phase:2},{k:'superkame',kind:'line',name:'Super Kamehameha',form:'ssj',every:10,warn:1.4,range:18,w:2.6,dmg:70}],
      phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.7,drops:'songoku',
      forms:[{k:'ssj',when:{hp:.5},name:'Siêu Saiyan',say:'Ta là... Siêu Saiyan Son Goku!',spd:2.5,move:1.6,dodge:.2,size:1.15,sprite:'songoku_ssj'}],
      minAt:{hp:.2,k:'ngocrong',n:7}}},   /* còn 20% máu gọi 7 viên Ngọc Rồng */
  // độ khó chung mọi boss MU: máu ×hp, đòn ×dmg, thời gian cảnh báo ×warn (ngắn hơn), vùng đánh ×r (to hơn), hồi chiêu ×cd (ra đòn dày hơn)
  bossHard:{hp:40,dmg:15,warn:.75,r:1.15,cd:.8},   /* máu ×40 (trước ×15), đòn ×15 */
  // mỗi người hạ mỗi boss tối đa bossPerDay lần / ngày (tính lúc boss chết, ai góp sát thương đều tính 1 lần); hạ đủ thì không gây sát thương, không có thưởng nữa: chống đánh hộ
  bossPerDay:0,   /* 0 = không giới hạn (đã bỏ giới hạn 5 lần / ngày) */
  // thưởng hạ boss ×bossRewardX: EXP, tiền, EXP MU, số Ngọc Cường Hoá / ngọc quý (đồ độc nhất như trang phục, vũ khí, Huy Hiệu, Trái Ác Quỷ giữ nguyên)
  bossRewardX:20,bossGemX:5,bossVndX:20/3,   /* giá trị cũ; khối "Cân bằng kinh tế" cuối file đặt lại: tiền ×1,2, EXP ×4, EXP MU ×6, ngọc quý ×3, 10 boss / ngày thưởng đủ */
  // phần thưởng boss phụ: ai góp sức đều có EXP + tiền, có tỉ lệ rơi trang phục / vũ khí riêng của boss, lần đầu hạ được thì lộ nhiệm vụ ẩn
  reward:{luffy:{exp:150,vnd:200000,mu:120,jewel:.35,fruitPer:10},naruto:{exp:100,vnd:120000,mu:80,costume:'mu_naruto',weapon:'vk_kunai',chance:.25,secret:'mu_cuontruc'},
    cuamay:{exp:100,vnd:120000,mu:80,costume:'mu_cuamay',weapon:'vk_cua',chance:.25,secret:'mu_banhmut'},duongvu_ma:{exp:110,vnd:130000,mu:85,costume:'mu_bongma',weapon:'vk_luoihai',chance:.25,secret:'mu_lua_ma'},
    rongxanh:{exp:130,vnd:160000,mu:100,costume:'mu_rongxanh',weapon:'vk_vayrong',chance:.22,secret:'mu_vayrong'},songoku:{exp:150,vnd:180000,mu:110,gems:1,jewels:1},reze:{exp:140,vnd:170000,mu:105,gems:1,jewels:1}},jewels:['ngoc_uoc','ngoc_tam_linh','ngoc_hon_nguyen'],
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
  // đánh thường: đứng gần quái / boss là tự đánh (chọn con đang rê chuột / vừa bấm, không thì con gần nhất), mỗi đòn mul × công, nhịp = 1 / tốc đánh giây
  basic:{mul:.7,range:2.3},   /* tầm đánh thường theo class: cls.reach (đánh gần Chiến Binh / Tiên Nữ xa hơn 2 ô) */
  respawn:8,regen:{hp:.02,mp:.04},duel:{range:14,exp:40,mu:60},lvExp:lv=>60+lv*40,maxLv:1000};   /* cấp MU tối đa 1000 */
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
// cân bằng set legacy: giá đặt lại theo sức mạnh (khối "Giá đồ theo sức mạnh"), cùng bậc 4 (chiêu phím 5 tốn mana / hồi chiêu như nhau); mỗi set 1 chỉ số chính mạnh hẳn + 2 chỉ số bổ trợ nhỏ
{ const LB={lg_shovel:{def:.4,hp:.08,armor:.05},lg_boxer:{aspd:.45,atk:.08,crit:.04},lg_yoshi:{hp:.35,regen:.3,drain:.03},lg_aang:{cdr:.3,mp:.12,slowp:.1},lg_chainsaw:{drain:.3,atk:.1,gw:.15},
    lg_sparta:{armor:.3,def:.08,aura:.02},lg_anubis:{gw:.5,hp:.1,tdmg:.04},lg_samurai:{crit:.4,atk:.1,aspd:.05},lg_piccolo:{regen:1.5,hp:.1,spell:.08},lg_megax:{spell:.5,def:.08,chainp:.08},
    lg_zero:{shred:.45,atk:.1,aspd:.06},lg_king:{aura:.2,hp:.1,def:.06},lg_vader:{atk:.4,def:.08,drain:.04},lg_16typh:{mp:.6,spell:.1,cdr:.05},lg_ranbien:{tdmg:.4,slowp:.1,gw:.1},
    lg_kth:{slowp:.6,mp:.1,crit:.04},lg_zeus:{chainp:.5,atk:.1,spell:.08}};
  for(const [k,L] of Object.entries(MU.legacy)) if(LB[k]){ L.price=8000000; L.tier=4; L.bonus=LB[k]; L.main=Object.keys(LB[k])[0]; } }
// Kamen Rider: 1 set bán ở Premium Store (lg_kr0); khi đánh cứ 5 giây tự biến sang form kế (6 form, mỗi form 1 chỉ số chính mạnh). Form 2–6 ẩn khỏi cửa hàng, dùng chung lượt mua + cường hoá của lg_kr0
{ const KR=[['Build','RabbitTank nửa đỏ nửa xanh',{atk:.3,aspd:.1,crit:.05}],['Ex-Aid','game thủ hồng tóc dựng',{aspd:.4,atk:.08,crit:.05}],['Ghost','áo choàng ma cam đen sừng bạc',{drain:.3,hp:.1,gw:.1}],
    ['Gaim','võ sĩ cam mũ navy sừng vàng',{crit:.35,atk:.1,shred:.1}],['Fourze','phi hành gia tên lửa trắng',{armor:.3,hp:.15,def:.1}],['OOO','đại bàng đỏ, hổ vàng, châu chấu xanh',{chainp:.4,spell:.15,atk:.08}]];
  LG_SKILL.kamen=['Rider Kick',3.4,{}];
  KR.forEach(([nm,ds,b],i)=>{ MU.legacy['lg_kr'+i]={name:i?'Kamen Rider '+nm:'Kamen Rider (6 form)',form:nm,kr:i,base:'lg_kr0',hidden:i>0,tier:4,price:8000000,bonus:b,main:Object.keys(b)[0],fx:'kamen',
    desc:i?`Form ${nm}: ${ds}`:'Biến hình liên tục: khi đánh cứ 5 giây đổi form Build → Ex-Aid → Ghost → Gaim → Fourze → OOO, mỗi form 1 chỉ số mạnh (công, tốc đánh, hút máu, chí mạng, giáp, giật sét). Chiêu phím 5: Rider Kick'}; }); }
for(const L of Object.values(MU.legacy)){ const [name,mul,o]=LG_SKILL[L.fx]; L.skill={k:'lgs_'+L.fx,name,mp:16+L.tier*3,cd:o.summon?22:9+L.tier,mul,range:3,...o}; }
// Min: nhân vật được set 16Typh gọi ra đánh cùng (không bán, chỉ để vẽ)
CLOTHES.mu_min={name:'Đồ của Min',slot:'top',price:0,hidden:true,set:'mu_min',opts:{top:'long'},colors:{top:'e8d0a8',pants:'d8a040',shoes:'8a5a32'}};
for(const [k,L] of Object.entries(MU.legacy)) CLOTHES[k]={name:'Set Legacy · '+L.name,slot:'top',price:0,hidden:true,mu:true,legacy:true,set:k,opts:{top:'long'},colors:{top:'2a2a34',pants:'2a2a34',shoes:'1c1820'}};
// Thợ Kim Hoàn (shop phụ kiện MU): ngoài bộ trang phục chính còn 4 ô phụ kiện tăng lực chiến: cánh (sau lưng), dây chuyền, vật hộ thân (bay lơ lửng cạnh người),
// aura (vòng phép dưới chân kiểu Warcraft, mỗi aura tăng 1 thuộc tính). Mua 1 lần giữ mãi, mỗi ô đeo 1 món, ai cũng thấy phụ kiện của nhau. (đã giảm giá còn 1/3)
// bonus: hp / mp / atk / def (+%), regen (hồi máu mana nhanh thêm), crit (tỉ lệ chí mạng), drain (hút % sát thương thành máu)
MU.slots={wing:'Cánh',neck:'Dây chuyền',charm:'Vật hộ thân',aura:'Aura',feet:'Giày',shield:'Tay trái'};   /* tay trái (khiên, mặt nạ, búa, đao, động cơ, đũa): bán ở Thợ Rèn Huyền Thoại */
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
// Sách nội tại (Pháp sư Cát bán): đọc 1 quyển = +1 cấp nội tại đó, không tốn điểm, cộng thêm tối đa bằng mức trần (max) của nội tại; giữ mãi, đặt lại điểm không mất
MU.pasBook=Object.fromEntries(Object.entries(MU.passive).map(([k,P])=>['snt_'+k,{pas:k,price:P.max>5?1000000:1600000}]));   /* giá ×4 (trước 250k / 400k) */
for(const [b,x] of Object.entries(MU.pasBook)) ITEMS[b]={name:'Sách Nội Tại: '+MU.passive[x.pas].name,icon:'pasbook_'+x.pas};
const muStats=(cls,lv,fruit,wep,lg,ex)=>{ const c=MU.cls[cls], k=1+(lv-1)*.08, f=(fruit&&MU.fruits[fruit]&&MU.fruits[fruit].bonus)||{}, w=(wep&&MU.weapons[wep])||{}, L=(lg&&MU.legacy[lg]&&MU.legacy[lg].bonus)||{}, X=ex||{}, b={hp:(f.hp||0)+(L.hp||0)+(X.hp||0),mp:(f.mp||0)+(L.mp||0)+(X.mp||0),atk:(f.atk||0)+(L.atk||0)+(X.atk||0),def:(f.def||0)+(L.def||0)+(X.def||0)};
  return {hp:Math.round(c.hp*k*(1+b.hp)),mp:Math.round(c.mp*(1+(lv-1)*.05)*(1+b.mp)),atk:Math.round(c.atk*k*(1+b.atk)*(1+(w.atk||0))),def:Math.round(c.def*(1+(lv-1)*.06)*(1+b.def)),
    aspd:Math.min(4,+((c.aspd||1)*(1+(lv-1)*.006)*(1+(X.aspd||0))).toFixed(2))}; };   /* tốc đánh thường: số đòn / giây, tăng theo cấp + đồ (aspd) */
// Ngọc cường hoá (Phù Thuỷ Cường Hoá ở MU): mọi món đồ MU (vũ khí, giáp class, set legacy, cánh, dây chuyền, hộ thân, aura) khắc được 12 lỗ cường hoá (+1 → +12).
// Mỗi lần khắc tốn 1 ngọc + phí; cấp càng cao tỉ lệ càng thấp (lỗ cuối 7%), thất bại mất ngọc. Lính Cát đầu đội cấp cao cộng tỉ lệ (lv × 0,2%, tối đa +15%);
// mỗi loài Lính Cát huyền thoại tặng 1 Ngọc Cường Hoá Huyền Thoại (80% thành công). Ngọc rơi từ boss MU, nhiệm vụ ẩn ở mọi map, vớt dưới hồ Ké khi chèo kayak; Phù Thuỷ cũng bán.
// per: chỉ số cộng thêm mỗi cấp (đã ×3 so với bản đầu); ngọc 1 triệu, gói 5 viên 4,7 triệu
const ENH={max:12,rate:[1,.95,.9,.82,.72,.62,.5,.4,.3,.2,.12,.07].map(v=>v/2),   /* tỉ lệ thành công đã giảm một nửa: +1 50% … +12 3,5% */
  fee:lv=>50000*(lv+1),gemPrice:1000000,gemPack:{n:5,price:4700000},lcPer:.002,lcMax:.15,legendRate:.8,
  per:{weapon:{atk:.075},set:{hp:.06,def:.06},wing:{hp:.045,def:.03},neck:{mp:.06,atk:.03},charm:{atk:.045},aura:{hp:.03,atk:.03},feet:{hp:.03,def:.03},shield:{hp:.04,def:.04}}};
const gemCost=n=>n===ENH.gemPack.n?ENH.gemPack.price:ENH.gemPrice*n;   // giá mua n ngọc (gói 5 viên rẻ hơn)
ITEMS.ngoc_ch={name:'Ngọc Cường Hoá',icon:'gem_enh'}; ITEMS.ngoc_ch_ht={name:'Ngọc Cường Hoá Huyền Thoại',icon:'gem_enh_ht'};
// loại đồ để tính chỉ số mỗi cấp cường hoá: weapon / set (giáp class, set legacy) / wing / neck / charm / aura
const enhKind=k=>MU.weapons[k]?'weapon':(MU.legacy[k]||Object.values(MU.cls).some(c=>c.set===k))?'set':MU.acc[k]?MU.acc[k].slot:null;
/* ---------- Rừng MU (phía Nam quảng trường, y 30–70): 9 khu xếp 3 × 3, mỗi khu 1 loài quái đi theo bầy nhỏ, càng xa quảng trường càng mạnh ----------
   Quái đi lang thang quanh ổ, người lại gần (aggro ô) thì lao vào đánh: vung đòn có báo trước, chạy ra khỏi tầm là né; đuổi xa ổ quá leash ô thì quay về hồi máu.
   Hạ quái: EXP, tiền, EXP MU chia theo phần sát thương; người đánh nhiều nhất được chiến lợi phẩm (bán cho Phù Thuỷ Cường Hoá) và có tỉ lệ rơi Ngọc Cường Hoá.
   Cổng xuống rừng: cổng Nam quảng trường, lối Nam Đầm Rồng, lối Nam Bãi Phế Liệu. Lính Cát hoang cũng sống trong rừng (LINHCAT.maps.mu). */
MU.forest={respawn:30,leash:8,aggro:3.6,windup:.45,mat:.4,gem:t=>.012+t*.004,gemHt:t=>t>=7?.0015:0,
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
/* ---------- Vùng boss phía Tây của map MU (x 0–63, phần MU cũ dời sang phải MU.OX ô, xem cuối file) ----------
   Đi từ quảng trường qua lối mở trên tường Tây (y 19–22). Trên cùng là Làng Meme của Pepe (tường kín: mua vé ở quầy ngay dưới cổng làng, mỗi ngày 3 vé, 1 triệu / vé),
   dưới đại lộ là 4 khu boss có tường bao + cổng như phần MU cũ (luôn có boss, hạ xong perma giây sau mới hồi): Phố Nobita (Doraemon + Nobita), Phố Beika (Conan),
   Tường Maria (Eren → Titan Tiến Công), Rừng Tiếng Hét (Nữ Yêu Tiếng Hét → Bạch Yêu).
   Hiệu ứng đòn lên người chơi (fx): stun giây đứng yên không ra đòn · slow (hệ số tốc độ đi) + aslow (hồi chiêu / đánh thường chậm × lần) trong dur giây ·
   dot {pct mỗi giây, dur giây, k doc / chay}. forms: boss đổi dạng khi máu xuống when.hp hoặc sau when.t giây giao chiến (spd tốc đánh ×, hpMul máu ×, regen % máu / giây,
   move tốc chạy ×, size thân to ×, dodge tỉ lệ né, dot gắn vào mọi đòn, summon gọi quái con). Kiểu đòn mới: blink (dịch chuyển ra sau lưng 1 người rồi đánh),
   buff (tự tăng né dodge trong dur giây, fly bay lên), grab (bắt nuốt: mất swallow tiền + gục), flood (nước độc loang khắp khu từ người boss),
   bullets (n viên đạn toả vòng tròn bay speed ô / giây), summon (gọi n quái con), rain (n vùng nổ rải khắp khu + trúng người).
   ghost: hoá bóng ma dur giây (không bị đánh trúng), mỗi tick giây gây sát thương + hiệu ứng lan r ô quanh người. far (đòn): đánh xa thêm n ô thay cho reach · crit (boss): tỉ lệ chí mạng ×1,5 sát thương. rangeMul (dạng hoá): tầm đánh × lần. reach: boss đánh xa thêm n ô (tầm đòn đơn / tia / nón / bắt + bán kính sóng quanh người) · spd: ra đòn nhanh × lần (nhân cả dạng hoá). */
MU.west={open:{x:[64,65],y:[19,22]},road:{y0:18,y1:23},
  meme:{x0:6,x1:57,y0:3,y1:16,booth:{x:31.5,y:19.4},inside:{x:31.5,y:14.6},exit:{x:36.5,y:14.2},ticket:1000000,perDay:3},
  zones:{meme:{name:'Làng Meme',x0:6,x1:57,y0:3,y1:16,tile:'G'},dora:{name:'Bãi đất trống · Phố Nobita',x0:2,x1:29,y0:25,y1:45,tile:'lot',gates:[['n',14,17],['e',33,36]],pipes:{x:15.5,y:36.6,sit:[[11.5,35.6],[15.5,33.4],[19.5,35.6]]}},
    conan:{name:'Phố Beika',x0:34,x1:61,y0:25,y1:45,tile:'9',gates:[['n',46,49],['w',33,36]]},eren:{name:'Tường Maria',x0:2,x1:29,y0:48,y1:69,tile:'3',gates:[['n',14,17],['e',57,60]]},
    yeunu:{name:'Rừng Tiếng Hét',x0:34,x1:61,y0:48,y1:69,tile:'2',gates:[['n',46,49],['w',57,60]]}}};
{ const Z=MU.west.zones, A=z=>({x0:z.x0+1,x1:z.x1-1,y0:z.y0+1,y1:z.y1-1});   /* khu đánh: trong tường bao */
  Object.assign(MU.bosses,{
    doraemon:{name:'Doraemon',sprite:'doraemon',west:1,perma:240,hp:3800,perPlayer:2000,def:11,home:{x:12,y:35},area:A(Z.dora),
      rage:{hits:8,win:3,cd:10,atk:{k:'muabanhran',kind:'rain',name:'Mưa Bánh Rán',n:9,warn:1,r:1.5,dmg:16,fx:{dot:{pct:.03,dur:4,k:'doc'}}}},   /* bị đánh dồn (8 đòn / 3 giây): gọi mưa bánh rán, trúng là trúng độc */
      attacks:[{k:'baoboi',kind:'single',name:'Ném Bảo Bối',every:2.6,warn:.7,range:9,r:1.4,dmg:24},{k:'canhcua',kind:'blink',name:'Cánh Cửa Thần Kỳ',every:11,warn:.7,r:1.9,dmg:40},
        {k:'chongchong',kind:'buff',name:'Chong Chóng Tre',every:15,dur:6,dodge:.5,fly:1},{k:'sungkhi',kind:'circle',name:'Súng Không Khí',every:7,warn:1,r:2,dmg:30,phase:2},
        {k:'tuithan',kind:'rain',name:'Túi Thần Kỳ Đổ Đồ',every:13,warn:1.3,n:7,r:1.6,dmg:26,phase:3}],phases:[.6,.3],enrage:{mul:1.4,speed:1.3},move:1.2,drops:'doraemon'},
    nobita:{name:'Nobita',sprite:'nobita',west:1,perma:240,hp:39000,perPlayer:21000,def:7,   /* máu ×20 rồi giảm 25% (gốc 2600 / 1400) */
      cup:{hp:.5,every:15,dur:2,r:10,dmg:20,fx:{stun:1.5,dot:{pct:.03,dur:4,k:'doc'}}},   /* còn 50% máu: chui vào cốc mỳ ly phòng thủ 2 giây (miễn sát thương), chui ra nổ choáng + độc 10 ô; dưới 50% cứ 15 giây lại chui */home:{x:20,y:36},area:A(Z.dora),
      attacks:[{k:'banhran',kind:'single',name:'Ném Bánh Rán',every:2.8,warn:.7,range:9,r:1.4,dmg:18,fx:{slow:.5,aslow:1.7,dur:3}},{k:'khocnhe',kind:'ring',name:'Khóc Nhè',every:10,warn:1.2,r:4,dmg:20,fx:{slow:.6,dur:2},phase:2},
        {k:'mabanhran',kind:'multi',name:'Mưa Bánh Rán',every:9,warn:1.1,n:4,r:1.5,dmg:18,fx:{slow:.5,aslow:1.7,dur:3},phase:3}],phases:[.6,.3],enrage:{mul:1.3,speed:1.3},move:1.5,drops:'nobita'},
    conan:{name:'Conan',sprite:'conan',west:1,perma:240,hp:3600,perPlayer:1900,def:10,home:{x:48,y:35},area:A(Z.conan),
      attacks:[{k:'gayme',kind:'single',name:'Súng Gây Mê',every:4,warn:.6,range:10,r:1.2,dmg:6,fx:{stun:2},shot:1},{k:'luot',kind:'line',name:'Lướt Theo Đường Đạn',every:7,warn:.5,range:9,w:.8,dmg:12,dash:1,alongShot:1,noSpd:1,guard:{dur:4,armor:.2,resist:.2}},   /* lướt dọc đường đạn gây mê vừa bắn: giáp +20%, kháng phép +20% trong 4 giây; không nhanh lên theo dạng Áo Đen */{k:'sutbong',kind:'line',name:'Giày Tăng Lực: Sút Bóng',every:6,warn:.9,range:11,w:1,dmg:17},   /* sát thương đòn Conan đã giảm 50% */
        {k:'thatlung',kind:'circle',name:'Thắt Lưng Bơm Bóng',every:8,warn:1,r:2.2,dmg:15,phase:2}],phases:[.6,.3],enrage:{mul:1.3,speed:1.2},move:1.5,drops:'conan',
      forms:[{k:'den',when:{t:10},name:'Hung Thủ Áo Đen',say:'Chân tướng chỉ có một!',spd:10,dodge:.3,dot:{pct:.03,dur:5,k:'chay'},tint:'#120c16'}]},
    eren:{name:'Eren',sprite:'eren',west:1,perma:300,hp:4200,perPlayer:2200,def:12,home:{x:15,y:59},area:A(Z.eren),big:1,reach:2.5,spd:40,   /* tầm đánh +2,5 ô (đã giảm nửa từ +5), ra đòn nhanh ×40 */
      attacks:[{k:'dongdat',kind:'ring',name:'Động Đất',every:8,warn:1.2,r:2.5,dmg:26,fx:{slow:.5,aslow:1.5,dur:3,stunChance:.3,stun:1.2}},{k:'dam',kind:'single',name:'Cú Đấm',every:2.5,warn:.6,range:2.5,r:1.4,dmg:22},   /* phạm vi giảm 50% */
        {k:'goititan',kind:'summon',name:'Gọi Titan Nhỏ',minion:'titannho',n:20,every:40,noSpd:1},   /* gọi 20 Titan Nhỏ, máu mỗi con = 1/40 Eren */
        {k:'giam',kind:'jump',name:'Giẫm Nát',every:12,warn:1.2,r:2.6,dmg:38,fx:{slow:.5,dur:2},phase:2},{k:'nuot',kind:'grab',name:'Bắt & Nuốt',every:9,warn:1.2,r:1.4,swallow:[200000,500000],form:'titan'}],
      phases:[.6,.3],enrage:{mul:1.3,speed:1.2},move:1.3,drops:'eren',
      forms:[{k:'titan',when:{hp:.5},name:'Titan Tiến Công',say:'Tatakae! Tatakae!',spd:8,hpMul:3,regen:.02,move:3,size:3,sprite:'titan'}]},
    yeunu:{name:'Nữ Yêu Tiếng Hét',sprite:'yeunu',west:1,perma:240,hp:7600,perPlayer:4000,def:10,   /* máu ×2 (trước 3800 / 2000) */home:{x:48,y:59},area:A(Z.yeunu),poisonStack:{hits:3,add:5},
      attacks:[{k:'tiethet',kind:'ring',name:'Tiếng Hét Xé Tai',every:6,warn:1,r:5,dmg:24,fx:{slow:.55,dur:3},say:['Á Á Á Á Á!! Điếc tai chưa!','Đừng có lại gần ta!','Nghe ta hát này!']},
        {k:'cao',kind:'single',name:'Cào Móng',every:2.6,warn:.6,range:5,r:1.4,dmg:20},{k:'vungdoc',kind:'flood',name:'Vũng Độc Lan',every:20,first:20,warn:1.5,r:13,dmg:0,fx:{dot:{pct:.03,dur:5,k:'doc'}}}],
      phases:[.6,.3],enrage:{mul:1.3,speed:1.2},move:1.3,drops:'yeunu',
      forms:[{k:'bach',when:{hp:.5},name:'Bạch Yêu',say:'Ta sẽ hét cho cả khu rừng này vỡ vụn!',spd:5,hpMul:4,tint:'#f4f4f2',summon:{k:'egg',n:10}}]},
    pepe:{name:'Pepe',sprite:'pepe',west:1,perma:180,hp:175000,perPlayer:0,def:14,home:{x:31.5,y:9},area:A(Z.meme),big:1,exact:1,
      attacks:[{k:'danvong',kind:'bullets',name:'Đạn Toả Vòng Tròn',every:5,n:18,speed:6,dmg:30},{k:'nhaydie',kind:'jump',name:'Nhảy Đè',every:15,warn:1.2,r:2.2,dmg:40,fx:{stun:2}},
        {k:'pepecon',kind:'summon',name:'Gọi Pepe Con',every:30,n:10,minion:'pepe_con'},{k:'thienthach',kind:'rain',name:'Mưa Thiên Thạch',every:40,warn:1.6,n:16,r:1.9,dmg:50}],
      phases:[.6,.3],enrage:{mul:1.3,speed:1},move:1,drops:'pepe'}});
  // quái con boss gọi ra: hpFrac phần máu so với boss lúc gọi, spd ô / giây (0 = đứng yên), đánh gần range ô mỗi every giây, laser: tia bắn người gần nhất
  MU.minions={pepe_con:{name:'Pepe Con',hpFrac:1/70,spd:4,range:1.3,every:1.1,dmg:18,def:6,sprite:'pepe_con'},egg:{name:'Trứng Laser',hpFrac:1/90,spd:0,def:8,sprite:'egg',laser:{every:3.2,warn:.9,range:10,w:.45,dmg:26}},
    titannho:{name:'Titan Nhỏ',hpFrac:1/40,spd:2.2,range:1.3,every:1.4,dmg:16,def:8,sprite:'titannho'},
    ngocrong:{name:'Ngọc Rồng',hpFrac:1/60,spd:0,def:10,sprite:'ngocrong',stars:1,orb:{every:2,heal:.01,to:['songoku','rongxanh'],r:2.4,fx:{dot:{pct:.02,dur:3,k:'doc'},gw:.5}}},   /* 7 viên: 2 giây 1 lần hồi 1% máu cho Songoku + Rồng Dải Xanh; đứng gần 2,4 ô dính độc + giảm hồi máu 50%. Đập vỡ để cắt hồi máu */
    hoangha:{name:'Anh tóc dài kakaka',hpFrac:1/40,spd:2.4,keep:4.5,def:6,sprite:'hoangha',shoot:{every:2.4,range:9,speed:6.5,dmg:14}}};   /* Dươngg Vũ gọi ra: vây quanh người cách 4,5 ô, bắn đạn tròn đỏ hồng */
  // thưởng: như boss phụ; pas: +cấp sách nội tại ngẫu nhiên (buff chỉ số nội tại); badge: Huy Hiệu Pepe (top 3 chắc chắn, còn lại badgeChance)
  Object.assign(MU.reward,{doraemon:{exp:140,vnd:180000,mu:110,gems:1},nobita:{exp:110,vnd:130000,mu:85,gems:1},conan:{exp:140,vnd:180000,mu:110,gems:1},eren:{exp:170,vnd:220000,mu:130,gems:2},
    yeunu:{exp:150,vnd:190000,mu:115,gems:1},pepe:{exp:600,vnd:2000000,mu:400,gems:3,jewels:2,pas:1,badge:'huy_hieu_pepe',badgeChance:.3}}); }
ITEMS.huy_hieu_pepe={name:'Huy Hiệu Pepe',icon:'pepe_badge'};
/* ---------- Cổng D-Day (nhà sự kiện ở quảng trường MU, toạ độ đã tính phần mở rộng): ghép trận 1-1, 2-2, 3-3 ----------
   Mỗi đội 1 nhà chính ở 2 đầu đấu trường (cảnh riêng 'dday:<trận>'), cứ wave.every giây mỗi nhà chính tung 1 đợt quái chạy dọc đường giữa đánh sang nhà kia.
   Nhà chính tự bắn kẻ địch lại gần (turret). Phá được nhà chính đối thủ trước là thắng; hết time giây thì đội còn nhiều % máu nhà chính hơn thắng.
   Đánh được cả người chơi đội kia (đánh thường / chiêu như ở MU), gục thì hồi sinh cạnh nhà mình. Mỗi ngày mỗi người vào D-Day tối đa perDay trận.
   Thắng: vật phẩm bí mật huyền thoại (bốc ngẫu nhiên trong secret theo trọng số), EXP, tiền, EXP MU, Ngọc Cường Hoá + ngọc quý, 1 Trái Ác Quỷ. Thua: thưởng an ủi. */
MU.dday={gate:{x:89.5,y:21},perDay:2,time:480,W:64,H:28,modes:{1:'1-1',2:'2-2',3:'3-3'},
  bases:[{x:6,y:14,name:'Đội Xanh',col:'#3a8ae8'},{x:58,y:14,name:'Đội Đỏ',col:'#e83a3a'}],spawn:[{x:9.5,y:10.5},{x:54.5,y:10.5}],lane:{y0:9,y1:19,y:14.5},
  base:{hp:12000,per:6000,def:20,r:2},turret:{range:6.5,dmg:150,every:1.3},
  wave:{every:20,first:4,n:3,hp:700,atk:40,def:6,spd:1.6,range:1.5,cd:1.1,aggro:4.5},
  reward:{win:{exp:600,vnd:1000000,mu:500,gems:1,jewels:2,fruit:1},lose:{exp:150,vnd:170000,mu:120}},   /* tiền giảm 3 lần, Ngọc Cường Hoá giảm từ 5 còn 1 */
  secret:[['ngoc_ch_ht',4,1],['huy_hieu_pepe',1,1],['sach_kn5',3,2],['ngoc_uoc',2,1]]};   /* [vật phẩm, trọng số, số lượng] */
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
  sh_skate:{slot:'feet',name:'Ván Trượt Vàng',price:3500000,spd:.32,bonus:{atk:.08,hp:.06,crit:.04},desc:'Đồ mạnh nhất tiệm: ván trượt vàng bánh tím, lướt nhanh nhất game'},
  /* 6 món tay trái đã cân bằng (giá đặt lại theo sức mạnh ở khối "Giá đồ theo sức mạnh"), lực chiến từ chỉ số nền gần bằng nhau (~+200 ở cấp 50), mỗi món 1 hiệu ứng riêng */
  kh_hachoang:{slot:'shield',name:'Khiên của Hắc Hoàng Đế',price:10000000,spd:.1,bonus:{hp:.05,regen:.4,armor:.05},desc:'Khiên đen tuyền viền vàng, mặt quỷ đế vương sừng vàng mắt đỏ. Chạy nhanh +10%, máu + hồi máu + giáp'},
  /* 5 món tay trái có hiệu ứng riêng (server mu.js): rage = cứ every giây nổi cơn dur giây (hút máu lên drain, công / chí mạng cộng thêm); thor = tỉ lệ giật sét trừ pct máu tối đa của quái;
     dbl = tỉ lệ đánh thường liền 2 đòn; pierce = giảm kháng phép của quái; silence = cứ every lần dùng chiêu thì khoá chiêu quái dur giây */
  kh_kotex:{slot:'shield',name:'Mặt Nạ Quỷ Kotex',price:10000000,bonus:{atk:.14,drain:.06,crit:.04},rage:{every:15,dur:5,drain:.4,atk:.2,crit:.1},desc:'Mặt nạ quỷ đỏ nanh trắng. Cứ 15 giây nổi cơn khát máu 5 giây: hút máu lên 40%, công +20%, chí mạng +10%'},
  kh_thor:{slot:'shield',name:'Búa Của Thor',price:10000000,bonus:{atk:.14,crit:.07},thor:{chance:.2,pct:.0025,cap:6},desc:'Búa Mjölnir tay cầm da, toé sét xanh. Đòn đánh 20% giật sét vào quái, trừ thêm 0,25% máu tối đa của quái (tối đa 6 lần công)'},
  kh_inuyasha:{slot:'shield',name:'Đại Đao Của Inuyasha',price:10000000,bonus:{shred:.3,crit:.15,atk:.04},desc:'Tessaiga lưỡi to bản, chuôi lông trắng. Trừ 30% giáp của quái, chí mạng +15%'},
  kh_musk:{slot:'shield',name:'Động Cơ Của Elon Musk',price:10000000,bonus:{aspd:.32,atk:.05},dbl:.1,desc:'Động cơ tên lửa bạc phụt lửa xanh. Tốc đánh +32%, 10% đánh liền 2 đòn'},
  kh_howard:{slot:'shield',name:'Đũa Thần Của Howard Le',price:10000000,bonus:{spell:.3,gw:.3,atk:.1},pierce:.2,silence:{every:5,dur:2},desc:'Đũa phép đầu sao tím lấp lánh. Sức mạnh phép +30%, giảm 20% kháng phép + 30% hồi máu của quái, cứ 5 lần dùng chiêu khoá chiêu quái 2 giây'}});
// hệ số tốc độ đi bộ / chạy của giày + khiên đang đeo (p.mu.acc.feet / .shield)
const shoeSpeed=p=>{ const E=(p&&p.mu&&p.mu.acc)||{}; let s=1; for(const k of [E.feet,E.shield]){ const a=k&&MU.acc[k]; if(a&&a.spd) s+=a.spd; } const LA=lcLeadAsc(p); if(LA&&LA.move) s+=LA.move; return s; };   /* + Lính Cát Lv50 đầu đội chạy nhanh */
NPCS.push({id:'mu_shoes',scene:'mu',x:7.5,y:10.4,place:'mushoes'});
NPC_LOOKS.mu_shoes={name:'Tiệm Giày Lướt Gió',look:{gender:'nam',hair:'swept',hairColor:'ff7a2a',skin:'f0c4a0',outfit:{top:'mu_elf',bottom:'kaki',shoes:'giay_trang'},opts:{mouth:'smile'}}};
// lực chiến: 1 con số gộp chỉ số MU (hiện trên HUD, so set legacy)
// lực chiến: công (theo tốc đánh + chỉ số phụ đánh ra: chí mạng, độc, phép, trừ giáp, giật sét, hút máu, làm chậm), thủ, máu (theo giáp), mana, hồi máu, hào quang
const muPower=(s,x={})=>Math.round(s.atk*10*(.7+.3*(s.aspd||1))*(1+(x.crit||0)*.5+(x.tdmg||0)*.6+(x.spell||0)*.3+(x.shred||0)*.3+(x.chainp||0)*.3+(x.drain||0)*.4+(x.slowp||0)*.1)+s.def*8+s.hp*1.5*(1+(x.armor||0))+s.mp*.6+(x.regen||0)*40+(x.aura||0)*200);
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
  mu_dw:{name:'Giáp Pháp Sư Xanh + Gậy (Phù Thuỷ)',slot:'top',price:0,hidden:true,mu:true,set:'mu_dw',opts:{top:'long'},colors:{top:'2a4ab8',pants:'2a3a8a',shoes:'1c1820'}},
  mu_dt:{name:'Giáp Voi Chiến + Khiên Tháp + Chuỳ (Đại Tượng)',slot:'top',price:0,hidden:true,mu:true,set:'mu_dt',opts:{top:'long'},colors:{top:'8a90a0',pants:'5a6070',shoes:'3a3a44'}}});
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
// boss khó: máu ×40, đòn ×15; ra đòn dày hơn, đạn nhanh hơn để khó né
const BOSS_X=15, BOSS_HP=40;
const MCK={arena:{x0:5,y0:5,x1:30,y1:25},stage:{x:17.5,y:7.4},gate:{x:17.5,y:28},hp:160*BOSS_HP*50,hpPer:90*BOSS_HP*50,   /* máu ×50 (24/10, chủ game yêu cầu) */
  playerHp:100,speed:2.6,melee:9*BOSS_X,meleeCd:900,wave:11*BOSS_X,waveCd:1900,waveSpeed:10,
  punch:5,punchCd:420,idle:20,cd:180,prize:3000000,exp:400,loseEnergy:20,lines:['Ê! Ai là boss ở đây?','Nghe cho rõ này!','Còn non lắm!','Lên sân khấu mà đòi đấu à?','Mic check, một hai!']};
const MEGATRON={hp:110*BOSS_HP,optHp:100,speed:2.4,melee:10*BOSS_X,meleeCd:1000,shot:12*BOSS_X,shotCd:2100,shotSpeed:11,punch:4,punchCd:420,ram:7,ramCd:900,cd:120,winExp:300,prize:3000000,loseEnergy:30};
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
landDeal(DL_LAND);
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
  {k:'haclong',name:'Hắc Long',desc:'Rồng đen cánh dơi, mắt đỏ, vảy ánh tím',price:10000000,jewels:{ngoc_hon_nguyen:2},speed:1.3},
  {k:'thuyquan',name:'Thuỷ Quân',desc:'Thú thần nước xanh băng, bờm mây tím ánh sao, dải lụa trắng bay',price:14000000,jewels:{ngoc_hon_nguyen:3},speed:1.35},
  {k:'tinhvan',name:'Tinh Vân Thần Điểu',desc:'Chim thần trắng mào vàng, cánh đuôi lửa xanh ngọc lấp lánh sao',price:20000000,jewels:{ngoc_hon_nguyen:4,ngoc_uoc:2},speed:1.4}];   /* bậc 7, 8 */
HORSE.myth.forEach((m,i)=>{ m.lv=i+1; m.bonus={hp:.03*(i+1),atk:.02*(i+1)}; });
// Xích Thố của ông Trường Con: ngựa lửa riêng, không nằm trong chuỗi cường hoá thần thú. Mở bằng 4 nhiệm vụ của ông ở Miếu (ông tặng ngựa),
// lên cấp 1 → 10 ở Người Thuần Thú / trại ngựa bằng tiền + ngọc quý; chỉ số = thần thú cùng bậc × 1,3 (nhỉnh hơn 30%); chọn 1 trong 5 hệ (Kim / Mộc / Thuỷ / Hoả / Thổ):
// thêm chỉ số theo hệ + khi cưỡi trong MU cứ 4 giây phun lửa đánh quái / boss gần nhất (hiệu ứng theo hệ). Đổi hệ tốn 1 Ngọc Hỗn Nguyên (lần đầu miễn phí)
const XICHTHO={max:15,tele:15,mul:1.3,quests:['tc_luocga','tc_raubun','tc_antruc','tc_clip'],els:{
    kim:{name:'Kim',col:'#ffd84a',bonus:{crit:.015,shred:.02},fx:'chí mạng + trừ giáp, lửa vàng 30% chí mạng'},moc:{name:'Mộc',col:'#4ad86a',bonus:{regen:.12,drain:.01},fx:'hồi máu + hút máu, lửa xanh hồi 3% máu cho bạn'},
    thuy:{name:'Thuỷ',col:'#3ab8f0',bonus:{mp:.04,slowp:.02},fx:'mana + làm chậm, lửa nước làm chậm quái 2 giây'},hoa:{name:'Hoả',col:'#ff5a1a',bonus:{atk:.03,tdmg:.02},fx:'công + độc, lửa đỏ cháy mạnh gấp rưỡi'},
    tho:{name:'Thổ',col:'#c8902a',bonus:{def:.03,armor:.012},fx:'thủ + giáp, lửa đất 20% làm choáng quái 1 giây'}},
  breath:{every:4,range:6,mul:.5,per:.12},cost:lv=>({vnd:(lv>10?3000000:1500000)*lv,jewels:lv<=3?{ngoc_uoc:lv}:lv<=6?{ngoc_tam_linh:lv-2}:lv<=10?{ngoc_hon_nguyen:lv-5}:{ngoc_hon_nguyen:lv-5,ngoc_uoc:lv-8}})};   /* cấp 11-15 đắt gấp đôi, cấp 15 mở dịch chuyển */
const XT_ELS=['','kim','moc','thuy','hoa','tho'];
const xtBonus=p=>{ const x=p&&p.xt; if(!x||!x.lv) return null; const L=x.lv*XICHTHO.mul, b={hp:.03*L,atk:.02*L,aspd:.025*L,regen:.08*L,drain:.005*L,armor:.01*L}, E=XICHTHO.els[x.el];
  if(E) for(const [k,v] of Object.entries(E.bonus)) b[k]=(b[k]||0)+v*x.lv; return b; };
// thần thú theo mã (look.mount): 'xichtho' tính theo hồ sơ p (cấp, hệ) nên cần truyền p
const mythOf=(k,p)=>k==='xichtho'?(p&&p.xt&&p.xt.lv?{k,name:'Xích Thố',lv:0,speed:1+.05*Math.min(10,p.xt.lv)*XICHTHO.mul,bonus:xtBonus(p),xt:1}:null):HORSE.myth.find(m=>m.k===k)||null;
// số thứ tự thần thú đang cưỡi gửi cho người khác (cờ FL.mount, 4 bit): 1…8 thần thú đã cường hoá tới bậc đó, 9…14 Xích Thố (theo hệ), không thì 0
const mythIdx=p=>{ const k=p&&p.look&&p.look.mount; if(k==='xichtho') return p.xt&&p.xt.lv&&p.horse&&p.horse.own?9+Math.max(0,XT_ELS.indexOf(p.xt.el||'')):0;
  const i=HORSE.myth.findIndex(m=>m.k===k); return i>=0&&p.horse&&p.horse.own&&(p.horse.myth||0)>i?i+1:0; };
// mã hình vẽ thần thú từ số thứ tự (art17: Xích Thố mỗi hệ 1 hình)
const mountKey=mi=>mi>=9?'xichtho_'+(XT_ELS[mi-9]||''):mi&&HORSE.myth[mi-1]?HORSE.myth[mi-1].k:'';
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
const SCENE_DEST={mu:'mu',dday:'mu',lavi:'lavi',nghienmotion:'nghienmotion',bearplus:'bearplus',vnpt:'vnpt',mieu:'mieu',das:'das',lumen:'lumen',yenlang:'yenlang',pickle:'pickle',diep:'diep',room:'home',everfit:'everfit',retreat:'retreat',nongsan:'retreat',quanao:'retreat',club:'retreat',stay:'retreat',doncongan:'retreat',deo:'retreat',phongbay:'retreat',dalat:'dalat',track:'dalat',sieuthi:'retreat',net:'retreat',cafe2:'retreat',quan_lan:'dalat'};
const SCENE_SIZE={mu:[96,72],dday:[64,28],lavi:[32,22],nghienmotion:[34,24],bearplus:[34,22],vnpt:[36,24],mieu:[40,32],das:[30,20],lumen:[38,36],yenlang:[38,18],linhcat:[24,16],pickle:[30,24],diep:[24,18],retreat:[340,124],dalat:[80,70],everfit:[34,21],track:[60,30],nongsan:[14,10],quanao:[14,10],club:[26,17],doncongan:[14,10],deo:[240,14],phongbay:[20,14],sieuthi:[20,14],net:[20,13],cafe2:[18,12],quan_lan:[16,11]};

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
  saunaDur:15,saunaMax:3,saunaEnergy:30,crowd:{n:2,mul:1.1,min:30},
  // ngồi lâu trong phòng xông hơi: EXP tự lên mỗi giây, xông liên tục càng lâu mỗi phút càng nhiều (base + ramp × phút, trần max), ra khỏi phòng là tính lại từ đầu.
  // Mỗi ngày game tối đa 6 giờ game = 90 phút thật (timeScale 4); xông đủ 90 phút liền ≈ 1.100 EXP gốc (trước buff)
  steam:{base:4,ramp:.2,max:20,capSec:5400}};
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
// điểm danh 30 ngày: vào game mỗi ngày nhận 1 ô (lỡ ngày không mất chuỗi, quay lại nhận tiếp ô kế), hết 30 ngày quay vòng. Quà gấp 5 lần bản 7 ngày cũ rồi tăng dần;
// ngày 7 / 14 / 21 / 30 là mốc lớn (rương + quà to), ngày 30 có Áo khoác Vàng Kim độc quyền. buff: EXP ×mul trong min phút (p.dbuff)
const LOGIN30=[
  {vnd:150000,label:'150K'},{items:{hat_dua_hau:5,hat_dau_tay:5},label:'10 hạt quý'},{vnd:300000,exp:200,label:'300K · 200 EXP'},{items:{bong_vang:3,thuoc_cat:3},label:'3 Bóng Vàng + thuốc'},
  {vnd:600000,label:'600K'},{items:{ngoc_ch:2},label:'2 Ngọc Cường Hoá'},{vnd:1500000,exp:750,chest:true,big:1,label:'Rương vàng · 1,5 triệu'},
  {items:{khoga:3,trung:6,nam:6},exp:150,label:'Giỏ quà quê'},{vnd:400000,buff:{mul:1.2,min:60},icon:'cup',label:'EXP ×1,2 · 1 giờ'},{items:{ngoc_uoc:1},label:'Ngọc Ước Nguyện'},
  {items:{snt_cuongluc:1,snt_sinhluc:1},label:'2 sách nội tại'},{vnd:700000,exp:300,label:'700K · 300 EXP'},{items:{da_lua:1,da_nuoc:1,da_la:1},label:'3 đá tiến hoá'},
  {vnd:2000000,exp:1000,items:{ngoc_ch:3},chest:true,big:1,label:'Rương vàng · 2 triệu'},
  {items:{sach_kn5:2},label:'2 Đại Sách KN'},{vnd:800000,label:'800K'},{items:{ngoc_tam_linh:1},label:'Ngọc Tâm Linh'},{items:{ngoc_ch:3},label:'3 Ngọc Cường Hoá'},
  {exp:500,buff:{mul:1.3,min:60},icon:'cup',label:'EXP ×1,3 · 1 giờ'},{vnd:1000000,label:'1 triệu'},
  {vnd:2500000,exp:1500,items:{ngoc_hon_nguyen:1},chest:true,big:1,label:'Rương vàng · 2,5 triệu'},
  {items:{bong_vang:5,sach_kn:3},label:'5 Bóng Vàng + 3 sách'},{items:{ngoc_ch_ht:1},label:'Ngọc CH Huyền Thoại'},{vnd:1200000,exp:600,label:'1,2 triệu · 600 EXP'},
  {items:{snt_hoiphuc:2},label:'2 sách Hồi Phục'},{items:{ngoc_uoc:2,ngoc_tam_linh:1},label:'3 ngọc quý'},{vnd:1500000,label:'1,5 triệu'},{items:{ngoc_ch:5},label:'5 Ngọc Cường Hoá'},
  {exp:1000,buff:{mul:1.5,min:120},icon:'cup',label:'EXP ×1,5 · 2 giờ'},
  {vnd:5000000,exp:3000,items:{ngoc_hon_nguyen:2,ngoc_ch_ht:1},cloth:'ao_vangkim30',chest:true,big:2,label:'Rương kim cương · 5 triệu + áo Vàng Kim'}];
const LOGIN7=LOGIN30;   /* tên cũ (bảng Hằng ngày, daily.js) */
CLOTHES.ao_vangkim30={name:'Áo khoác Vàng Kim (điểm danh 30 ngày)',slot:'top',price:0,hidden:true,opts:{top:'jacket',chain:true},colors:{top:'e8b830',inner:'1c1516',gold:'fff3b0'}};
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

/* ---------- chỉ số phụ + hiệu ứng cho mọi món MU (vũ khí Thợ Rèn, vũ khí boss, phụ kiện, giày, set legacy, thần thú) ----------
   aspd tốc đánh · drain hút máu · crit chí mạng · regen hồi máu · slowp % làm chậm mục tiêu 2 giây · chainp % giật sét lan 3 mục tiêu gần (60% sát thương)
   aura: đồng đội trong 6 ô hồi máu = aura × sát thương bạn gây · shred bỏ qua % giáp mục tiêu · tdmg % công thành sát thương chuẩn (vào thẳng máu, không trừ giáp)
   cdr giảm hồi chiêu · spell sức mạnh chiêu · gw giảm hồi máu: mục tiêu trúng đòn bị giảm % hồi máu / hút máu trong 3 giây (boss tự hồi, người chơi D-Day / thách đấu) · armor giáp: giảm % sát thương quái / boss đánh vào (class đánh gần có sẵn giáp gốc). Vũ khí: loại cho 1 chỉ số riêng, hệ cho 1 hiệu ứng tăng theo bậc hệ. Phụ kiện theo ô, mạnh theo giá. Có trần ở server (mu.js st). */
MU.statVI={hp:'Máu',mp:'Mana',atk:'Công',def:'Thủ',armor:'Giáp',crit:'Chí mạng',regen:'Hồi máu',drain:'Hút máu',aspd:'Tốc đánh',slowp:'Làm chậm',chainp:'Giật sét',aura:'Hào quang hút máu',shred:'Trừ giáp',tdmg:'Độc (vào thẳng máu)',cdr:'Giảm hồi chiêu',spell:'Sức mạnh phép',gw:'Giảm hồi máu'};
{ const r3=v=>Math.round(v*1000)/1000, add=(b,x)=>{ for(const [k,v] of Object.entries(x)) b[k]=r3((b[k]||0)+v); return b; };
  const TY={dagger:{aspd:.1},sword:{drain:.03},bow:{aspd:.08,crit:.02},spear:{shred:.08,armor:.04},axe:{tdmg:.04,gw:.25},hammer:{slowp:.08,armor:.05},katana:{aspd:.06,gw:.15},scythe:{aura:.03},staff:{spell:.12,cdr:.05},greatsword:{tdmg:.05,armor:.04}};
  const EL={poison:t=>({tdmg:.02*t,gw:.06*t}),ice:t=>({slowp:.05*t}),fire:t=>({spell:.04*t,crit:.01*t}),thunder:t=>({chainp:.04*t}),void:t=>({shred:.03*t,drain:.01*t})};
  for(const [k,ty] of Object.entries(MU.wtypes)) add(ty.bonus=ty.bonus||{},TY[k]||{});
  for(const w of Object.values(MU.weapons)){ if(w.type&&w.el){ w.bonus=add({...MU.wtypes[w.type].bonus},EL[w.el](MU.welems[w.el].tier)); continue; }
    const t=Math.max(1,Math.round((w.atk||.1)*20)); w.bonus=add({...(w.bonus||{})},{aspd:.02*t,crit:.008*t,tdmg:.01*t}); }   /* vũ khí rơi từ boss */
  const SL={wing:k=>({aspd:.03*k,cdr:.02*k}),neck:k=>({spell:.04*k,crit:.01*k}),charm:k=>({regen:.12*k,aura:.012*k,armor:.02*k}),aura:k=>({drain:.012*k,tdmg:.012*k,gw:.03*k}),feet:k=>({aspd:.025*k})};
  for(const a of Object.values(MU.acc)){ const k=Math.max(.5,Math.min(4,(a.price||1e6)/1e6)); if(SL[a.slot]) add(a.bonus=a.bonus||{},SL[a.slot](k)); }
  // set legacy: mỗi set 2–3 chỉ số phụ hợp tính cách nhân vật, mạnh dần theo số sao
  const LG={lg_shovel:{shred:.06,slowp:.06,armor:.08},lg_boxer:{aspd:.1,crit:.03},lg_yoshi:{drain:.04,regen:.2},lg_aang:{cdr:.08,slowp:.1},lg_chainsaw:{tdmg:.06,drain:.04,gw:.2},lg_sparta:{shred:.08,aura:.02,armor:.06},
    lg_anubis:{drain:.06,tdmg:.04,regen:.15,gw:.15},lg_samurai:{crit:.06,aspd:.08},lg_piccolo:{spell:.12,regen:.3},lg_megax:{spell:.1,chainp:.08},lg_zero:{aspd:.12,crit:.05,shred:.05},
    lg_king:{aura:.05,cdr:.06,regen:.2,armor:.08},lg_vader:{spell:.15,shred:.1,drain:.05,armor:.05},lg_16typh:{spell:.12,aura:.03,cdr:.05},lg_ranbien:{tdmg:.05,slowp:.1,drain:.03,gw:.25},lg_kth:{crit:.05,spell:.1,aspd:.05},lg_zeus:{chainp:.14,spell:.12,crit:.04}};
  for(const [k,L] of Object.entries(MU.legacy)) if(!L.main) add(L.bonus=L.bonus||{},LG[k]||{crit:.01*(L.tier||1),spell:.03*(L.tier||1)});   /* set đã cân bằng (có L.main) giữ nguyên chỉ số */
  for(const m of HORSE.myth){ const l=m.lv||1; add(m.bonus=m.bonus||{},{aspd:.025*l,regen:.08*l,drain:.005*l,armor:.01*l}); } }
/* ---------- 3 item huyền thoại (3 ô luôn hiện cạnh thanh đồ): mỗi món ghép từ 15 mảnh, lấy ở các map ngoài MU qua nhiệm vụ (có nhiệm vụ ẩn),
   câu đố logic (phiến đá cổ, đáp án chỉ server biết) và nhiệm vụ nhóm (đủ n người cùng đứng vòng sáng bấm trong 15 giây). Nhiệm vụ đã làm xong từ trước vẫn tính mảnh ---------- */
const LEGEND={need:15,
  items:{pod:{name:'Cái Pod của Kaixa',col:'#b070ff',desc:'Bị động: +150% mọi chỉ số MU (máu, mana, công, thủ)',map:'Ké Retreat · Đà Lạt · Lavi'},
    but:{name:'Cây Bút của Redtype',col:'#e8302a',key:'6',desc:'Bấm dùng (phím 6): hoá gà quái / boss gần nhất 2 giây (đứng im, không đánh được) và mọi chiêu hồi về 0 giây; 10 giây dùng lại',cd:10,chick:2,range:8,map:'DAS · Everfit · Lumen · Nghiện Motion · Yên Lãng · nhà Diệp · Ké'},
    airpod:{name:'Airpod của VNPT',col:'#3a8ae8',desc:'Bị động: cứ 10 giây tự bật 3 giây bất tử; sức mạnh chiêu +500%',every:10,dur:3,spell:5,map:'MU · Pickleball · Miếu · VNPT · Yên Lãng'}},
  tasks:[
    /* Cái Pod của Kaixa: đời sống Ké / Đà Lạt (nhân viên, poker, CSGT, trồng cây, nuôi lợn vịt, bướm, rau) + nhiệm vụ ẩn + câu đố + nhóm */
    {id:'pod_a1',it:'pod',t:'ach',st:'kestaff',need:6,label:'Làm nhân viên Ké Retreat 6 ngày (đủ việc mỗi ngày)',where:'Ké Retreat · nhận việc nhân viên',go:{sc:'retreat'}},
    {id:'pod_a2',it:'pod',t:'ach',st:'pokerWon',need:10000000,money:1,label:'Ăn được 10 triệu tiền chơi Poker',where:'Ké Retreat · Nhà giải trí',go:{sc:'retreat',place:'club'}},
    {id:'pod_a3',it:'pod',t:'ach',st:'fine',need:10000000,money:1,label:'Nộp phạt cho công an tổng 10 triệu',where:'Ké Retreat · CSGT / đồn công an',go:{sc:'retreat'}},
    {id:'pod_a4',it:'pod',t:'ach',st:'csgt',need:10,label:'Bị CSGT bắt dừng xe 10 lần',where:'Ké Retreat · đường lớn (đi xe máy)',go:{sc:'retreat'}},
    {id:'pod_a5',it:'pod',t:'ach',st:'trees',need:50,label:'Trồng 50 cây cà phê hoặc cao su',where:'Đà Lạt · đồi cà phê / rừng cao su',go:{sc:'dalat'}},
    {id:'pod_a6',it:'pod',t:'ach',st:'piglets',need:20,label:'Nuôi lợn nái đẻ ra 20 lợn con',where:'Đà Lạt · trại chú Sáu (mua lợn nái)',go:{sc:'dalat',npc:'chusau'}},
    {id:'pod_a7',it:'pod',t:'ach',st:'ducks',need:40,label:'Nuôi thành công 40 lứa vịt',where:'Chuồng vịt (Đà Lạt / Ké)',go:{sc:'dalat',npc:'chusau'}},
    {id:'pod_a8',it:'pod',t:'ach',st:'bugSold',need:30,label:'Bán cho bác Trang 30 con bướm',where:'Bắt bướm ở Ké · bán ở Đà Lạt',go:{sc:'dalat',npc:'bactrang'}},
    {id:'pod_a9',it:'pod',t:'ach',st:'vegSold',need:5000000,money:1,label:'Bán được 5 triệu tiền rau',where:'Vườn rau Ké / nông trại Đà Lạt',go:{sc:'dalat',npc:'bactrang'}},
    {id:'pod_a10',it:'pod',t:'ach',st:'stolenVeg',need:20,label:'Cướp được 20 bó rau từ vườn người khác',where:'Vườn rau người khác (Ké / Đà Lạt)',go:{sc:'dalat'}},
    {id:'pod_q0',it:'pod',t:'q',q:'sq_bua_khuya'},
    {id:'pod_q1',it:'pod',t:'q',q:'sq_xuong'},
    {id:'pod_p1',it:'pod',t:'puz',sc:'retreat',x:38.4,y:92.6,where:'Ké Retreat · cạnh Pháp ở cổng',q:'Cái gì càng lấy đi thì càng to ra?'},
    {id:'pod_a11',it:'pod',t:'ach',st:'raceW',need:5,label:'Thắng đua ngựa 5 lần',where:'Đà Lạt · trường đua ngựa',go:{sc:'dalat'}},
    {id:'pod_g1',it:'pod',t:'grp',sc:'retreat',x:23.2,y:43.2,n:2,where:'Ké Retreat · cạnh Kenny',label:'Cùng nhấc tảng đá cổ'},
    /* Cây Bút của Redtype: học, làm việc, sáng tạo (DAS, Everfit, Lumen, Nghiện Motion, stream anh Độ, nhà Diệp, cờ vua) */
    {id:'but_a1',it:'but',t:'ach',st:'das',need:Object.keys(DAS.courses).length,label:'Học hết toàn bộ chứng chỉ DAS',where:'DAS (TP.HCM) · thầy Huy Tạ',go:{sc:'das',npc:'huyta'}},
    {id:'but_a2',it:'but',t:'ach',st:'everfit',need:20,label:'Làm việc ở Everfit 20 ngày (đủ việc mỗi ngày)',where:'Văn phòng Everfit (Hà Nội)',go:{sc:'everfit',npc:'hr'}},
    {id:'but_a3',it:'but',t:'ach',st:'lumen',need:3,label:'Làm việc ở Lumen Studio 3 ngày (đủ việc mỗi ngày)',where:'Lumen Studio (Hà Nội)',go:{sc:'lumen',npc:'lumen_le'}},
    {id:'but_a4',it:'but',t:'ach',st:'quests',need:40,label:'Hoàn thành 40 nhiệm vụ',where:'Mọi map (bảng Việc cần làm)'},
    {id:'but_a5',it:'but',t:'ach',st:'lc40',need:2,label:'Có 2 Lính Cát (pokemon) lên cấp 40',where:'Bắt + luyện Lính Cát ở mọi map'},
    {id:'but_a6',it:'but',t:'ach',st:'nmWin',need:10,label:'Thắng 10 game ở Group Nghiện Motion',where:'Nghiện Motion · góc game (đấu Eva)',go:{sc:'nghienmotion'}},
    {id:'but_a7',it:'but',t:'ach',st:'stream',need:2,label:'2 lần lên sóng stream cùng anh Độ Mixi',where:'120 Yên Lãng · ghế khách (buổi tối)',go:{sc:'yenlang',npc:'do'}},
    {id:'but_a8',it:'but',t:'ach',st:'diepDays',need:6,label:'Qua nhà Diệp ăn đều 2 bữa / ngày trong 6 ngày',where:'Phòng của Diệp (Hà Nội)',go:{sc:'diep',npc:'diep'}},
    {id:'but_a9',it:'but',t:'ach',st:'chessW',need:20,label:'Thắng 20 ván cờ vua',where:'Ké Retreat · Nhà giải trí',go:{sc:'retreat',place:'club'}},
    {id:'but_q0',it:'but',t:'q',q:'dv_follow'},
    {id:'but_q1',it:'but',t:'q',q:'dv_quiz'},
    {id:'but_p1',it:'but',t:'puz',sc:'das',x:9,y:6.8,where:'DAS · cạnh thầy Huy Tạ',q:'Có 3 quả táo, bạn lấy đi 2 quả. Bạn có mấy quả?'},
    {id:'but_p3',it:'but',t:'puz',sc:'yenlang',x:15,y:11.2,where:'120 Yên Lãng · cạnh Quang Nịnh Thần',q:'Nếu 1 = 5, 2 = 25, 3 = 125, 4 = 625 thì 5 = ?'},
    {id:'but_g1',it:'but',t:'grp',sc:'das',x:19.6,y:15.8,n:2,where:'DAS · cạnh thầy Sun Hung',label:'Cùng chấm bài cho học viên'},
    {id:'but_g2',it:'but',t:'grp',sc:'nghienmotion',x:16,y:11.4,n:2,where:'Nghiện Motion · cạnh Trọng Motion',label:'Cùng render cảnh 3D'},
    /* Airpod của VNPT: cày MU (quái, Luffy, boss, cấp, D-Day, thần thú) + pickleball, Miếu, VNPT */
    {id:'ap_a1',it:'airpod',t:'ach',st:'mobs',need:1000,label:'Hạ 1000 quái rừng MU',where:'MU · rừng phía Nam',go:{sc:'mu'}},
    {id:'ap_a2',it:'airpod',t:'ach',st:'luffy',need:200,label:'Hạ thành công Luffy Gear 5 200 lần',where:'MU · đền phía Bắc',go:{sc:'mu'}},
    {id:'ap_a3',it:'airpod',t:'ach',st:'boss',need:500,label:'Hạ 500 boss MU',where:'MU · mọi khu boss',go:{sc:'mu'}},
    {id:'ap_a4',it:'airpod',t:'ach',st:'mulv',need:100,label:'Lên cấp MU 100',where:'MU Online',go:{sc:'mu'}},
    {id:'ap_a5',it:'airpod',t:'ach',st:'ddayW',need:20,label:'Thắng 20 trận D-Day',where:'MU · Cổng D-Day',go:{sc:'mu'}},
    {id:'ap_a6',it:'airpod',t:'ach',st:'myth',need:6,label:'Cường hoá thú cưỡi lên bậc 6 (Hắc Long)',where:'MU · Người Thuần Thú',go:{sc:'mu',npc:'mu_tamer'}},
    {id:'ap_a7',it:'airpod',t:'ach',st:'pickle',need:10,label:'Thắng 10 trận pickleball',where:'Sân pickleball Cầu Giấy',go:{sc:'pickle',npc:'hlv_pickle'}},
    {id:'ap_a8',it:'airpod',t:'ach',st:'donateMieu',need:20000000,money:1,label:'Công đức cho Miếu ông Trường Con 20 triệu',where:'Miếu (Hải Phòng) · ban thờ',go:{sc:'mieu',npc:'mieu_tu'}},
    {id:'ap_a9',it:'airpod',t:'ach',st:'simVip',need:2,label:'Mua 2 SIM số đẹp ở VNPT',where:'VNPT · quầy giao dịch (bốc số trước)',go:{sc:'vnpt',npc:'vn_hang'}},
    {id:'ap_q0',it:'airpod',t:'q',q:'sq_tainghe'},
    {id:'ap_q1',it:'airpod',t:'q',q:'sq_mix'},
    {id:'ap_p1',it:'airpod',t:'puz',sc:'vnpt',x:11,y:7.4,where:'VNPT · trước quầy chị Hằng',q:'Số nào khi lộn ngược lại thì tăng thêm 3?'},
    {id:'ap_a10',it:'airpod',t:'ach',st:'xtlv',need:5,label:'Cường hoá Xích Thố của ông Trường Con lên level 5',where:'Miếu (nhận ngựa) · Người Thuần Thú (lên cấp)',go:{sc:'mieu',npc:'truongcon'}},
    {id:'ap_g1',it:'airpod',t:'grp',sc:'vnpt',x:31.6,y:18.8,n:2,where:'VNPT · cạnh chị Thu trưởng ca',label:'Cùng nối đường truyền'},
    {id:'ap_g2',it:'airpod',t:'grp',sc:'pickle',x:6.6,y:21.6,n:2,where:'Sân Pickleball · cạnh HLV Tuấn',label:'Cùng đánh bóng qua lại'}]};
// thành tựu cày (t:'ach'): giá trị hiện tại theo hồ sơ (MU, DAS, Lính Cát, thú cưỡi, nhiệm vụ đã xong; còn lại đếm ở p.stats qua places.stat)
const legendAch=(p,k)=>{ if(!p) return 0; const s=p.stats||{}, mu=p.mu||{};
  switch(k){ case 'mobs': return mu.mobs||0; case 'luffy': return (mu.bossK||{}).luffy||0; case 'boss': return mu.boss||0; case 'mulv': return mu.lv||0; case 'das': return ((p.das||{}).certs||[]).length;
    case 'quests': return Object.values(p.quests||{}).filter(v=>v==='done').length; case 'myth': return (p.horse&&p.horse.myth)||0; case 'xtlv': return (p.xt&&p.xt.lv)||0;
    case 'lc40': { const lc=p.lc||{}; return [...(lc.party||[]),...(lc.box||[])].filter(m=>(m.lv||0)>=40).length; } default: return s[k]||0; } };
const legendDone=(p,t)=>t.t==='q'?!!(p&&p.quests&&p.quests[t.q]==='done'):t.t==='ach'?legendAch(p,t.st)>=t.need:!!(p&&p.legend&&p.legend.f&&p.legend.f[t.id]);
const legendCount=(p,it)=>LEGEND.tasks.filter(t=>t.it===it&&legendDone(p,t)).length;
const legendOwn=(p,it)=>!!(p&&p.legend&&p.legend.force&&p.legend.force[it])||legendCount(p,it)>=LEGEND.need;   /* force: chỉ server test (dbgown) */
/* ---------- MU mở rộng sang trái MU.OX ô: vùng boss mới ở x 0 → OX-1, phần MU cũ (quảng trường, Làng Lá, phía Đông, rừng quái) dời sang phải ----------
   MU.local giữ toạ độ cũ để world7 dựng phần cũ như trước rồi dời cả khối. Vị trí MU đã lưu kiểu cũ: server dời khi vào game (p.muOX). */
{ const OX=MU.OX=64;
  MU.local=JSON.parse(JSON.stringify({W:MU.W,H:MU.H,town:MU.town,spawn:MU.spawn,altar:MU.altar,fountain:MU.fountain,zones:MU.zones,lcSpots:LINHCAT.maps.mu.spots,
    forest:{mobs:Object.fromEntries(Object.entries(MU.forest.mobs).map(([k,m])=>[k,{k:m.k,name:m.name,lv:m.lv,zone:m.zone,packs:m.packs}]))}}));
  const px=o=>{ if(o) o.x+=OX; }, pr=a=>{ if(a){ a.x0+=OX; a.x1+=OX; } };
  for(const o of [MU.spawn,MU.altar,MU.fountain]) px(o); pr(MU.arena);
  for(const b of Object.values(MU.bosses)) if(!b.west){ px(b.home); pr(b.area); }
  MU.zones.gapF=MU.zones.gapF.map(v=>v+OX); MU.zones.gapE=MU.zones.gapE.map(v=>v+OX); px(MU.zones.lake);
  for(const L of Object.values(MU.hidden)) for(const p of L) p[0]+=OX;
  for(const m of Object.values(MU.forest.mobs)){ pr(m.zone); m.packs=m.packs.map(([x,y])=>[x+OX,y]); }
  for(const n of NPCS) if(n.scene==='mu') n.x+=OX;
  LINHCAT.maps.mu.spots=LINHCAT.maps.mu.spots.map(([x,y,...r])=>[x+OX,y,...r]);
  MU.W+=OX; SCENE_SIZE.mu=[MU.W,MU.H]; }
// quán ăn + phòng nghỉ trưa ở quảng trường MU (toạ độ đã tính phần mở rộng: cũ + OX). Ăn như mọi quán (tính bữa), ngủ trưa: trả tiền, +energy năng lượng, cd phút mới nghỉ tiếp được
PLACES.mu_quan={name:'Quán Ăn Lục Địa Cát',where:'quảng trường MU',menu:['com_ga','pho','banh_mi','com_rang','tra_da','cafe_sua'],map:'mu',x:15.5+MU.OX,y:16.6};
NPCS.push({id:'mu_cook',scene:'mu',x:15.5+MU.OX,y:17.4,place:'mu_quan'});
NPC_LOOKS.mu_cook={name:'Bác Bếp Cát',look:{gender:'nam',hair:'swept',hairColor:'5a4a3a',skin:'f0c49a',outfit:{top:'ao_bep_haky',bottom:'kaki',shoes:'giay_den'},opts:{mouth:'smile'}}};
MU.nap={x:27.5+MU.OX,y:15.6,price:50000,energy:50,cd:30};
/* ======================= Cân bằng kinh tế (24/10): không cách nào kiếm tiền / EXP quá nhanh =======================
   Mốc: cày liên tục (quái MU bậc cao, vườn, chuồng, bướm, đua ngựa) tối đa khoảng 1,5–2 triệu / giờ; việc hằng ngày cộng lại khoảng 3–5 triệu / ngày;
   boss MU chỉ 10 lần hạ đầu mỗi ngày được thưởng đủ; tiền thắng bot (đua ngựa, pickleball, nhà giải trí) có trần mỗi ngày; tiền phạt tăng theo tiền trong ví */
const ECON={questVnd:.6,cropSell:.6,fineRate:.01,fineMax:10,botWinDaily:1000000};
// boss MU: tiền ×1,2 (trước ×6,7), EXP ×4 (trước ×20), EXP MU ×6 (trước ×20), ngọc quý ×3 (trước ×20), Ngọc Cường Hoá giữ ×5; hạ quá 10 boss / ngày thì thưởng còn 20%, không nhân ngọc
Object.assign(MU,{bossVndX:1.2,bossExpX:4,bossMuX:6,bossJewelX:3,bossFull:10,bossTired:.2});
Object.assign(MU.dday.reward.win,{vnd:500000,exp:400}); Object.assign(MU.dday.reward.lose,{vnd:80000,exp:100});
// quái rừng: tiền rơi, EXP, EXP MU, giá chiến lợi phẩm, tỉ lệ rơi đều giảm (Chó Ba Đầu: 3,7k → 1,4k tiền, 57 → 25 EXP, Lông Lửa 33,9k → 6k)
MU.forest.mat=.35; for(const m of Object.values(MU.forest.mobs)){ const L=m.lv; m.exp=Math.round(3+L*.5); m.vnd=100+L*30; m.mu=Math.round(2+L*.7); }
MU.matPrice=Object.fromEntries(Object.values(MU.forest.mobs).map(m=>[m.mat,400+m.tier*m.tier*70]));
MU.jewelSell={ngoc_uoc:50000,ngoc_tam_linh:70000,ngoc_hon_nguyen:120000};   /* Pháp sư Cát thu mua ngọc quý (trước 150k / 200k / 400k) */
// nông sản bán còn 60% (hạt giống giữ giá: lãi mỗi ô từ ~78k xuống ~45k / giờ)
for(const [k,c] of Object.entries(CROPS)){ c.sell=Math.round(c.sell*ECON.cropSell/500)*500; SELL[k]=c.sell; }
// lợn: mua 350k (trước 1,5 triệu), thịt 500k (trước 2,4 triệu), lợn con 120k (trước 800k), lợn nái 2,5 triệu
ANIMALS.lon.price=350000; ANIMALS.nai.price=2500000; Object.assign(SELL,{lon_thit:500000,lon_con:120000});
// bướm bán 5k / 10k / 20k (trước 15k / 30k / 60k), 5 phút mới bay lại (trước 2 phút)
BUTTERFLY.respawn=300; BUTTERFLY.sell={common:5000,uncommon:10000,rare:20000}; for(const [k,r] of Object.entries(BUTTERFLY.kinds)) SELL['buom_'+k]=BUTTERFLY.sell[r];
// đồ cổ dưới hồ (8 món / ngày): kỳ vọng ~290k → ~120k mỗi món
for(const [k,v] of Object.entries({dong_xu_co:40000,binh_gom:120000,ngoc_trai:200000,ruong_bau:800000})){ TREASURE.items[k].price=v; SELL[k]=v; }
// trò chơi có bot / boss mini: tiền thưởng có trần mỗi ngày
RACE.botWins=5; RACE.houseBonus=0;   /* đua với bot: thưởng = phí × (số người + 1), 5 lần thắng có thưởng mỗi ngày; cược không còn nhà cái bù 20% (cược đủ 6 ngựa là chắc lãi) */
PICKLE.win.vnd=120000; PICKLE.paidWins=5;   /* pickleball: 5 trận thắng có tiền mỗi ngày */
MEGATRON.prize=1000000; MEGATRON.daily=1; MCK.prize=1000000;   /* Megatron trước 3 triệu mỗi 2 phút: giờ 1 triệu, 1 lần / ngày; MCK 3 triệu → 1 triệu */
WHEELIE.vnd=15000; LUMEN.pay=180000; DAS.teach.pay=300000;
CLUB.botWinDaily=ECON.botWinDaily;   /* nhà giải trí: tiền thắng bot (cờ, poker, ma sói) tối đa 1 triệu / ngày */
// nhiệm vụ: tiền thưởng còn 60% (tổng ~30,7 triệu → ~18 triệu), EXP giữ nguyên
for(const q of Object.values(QUESTS)) if(q.reward&&q.reward.vnd) q.reward.vnd=Math.max(10000,Math.round(q.reward.vnd*ECON.questVnd/10000)*10000);
// tiền phạt theo ví: phạt gốc + 1% tiền đang có (tối đa gấp 10 phạt gốc), làm tròn chục nghìn
const fineOf=(base,money)=>base+Math.min(base*ECON.fineMax,Math.round(Math.max(0,money||0)*ECON.fineRate/10000)*10000);
RULES.expMulCap=2;   /* tổng các buff EXP cộng dồn tối đa ×2 */
/* ======================= Hảo sảng: chuột phải người chơi khác → donate tiền, cho vay, mời về nhà =======================
   Điểm = tiền cho đi RÒNG (donate đi trừ donate nhận, cứ 200k là 1 điểm: 2 nick chuyển qua lại không lên điểm) + tiếp khách tới nhà (1 điểm / khách / ngày, tối đa 3 / ngày, tổng 30)
   + cho vay được trả đủ (1 điểm / 1 triệu gốc, tối đa 3 / ngày, tổng 30). Bậc càng cao: +EXP, mua đồ rẻ hơn, bán đồ được giá hơn (tối đa 10%, cân với ưu đãi học viên 20% và buff EXP trần ×2) */
const HAOSANG={perPts:200000,hostDay:3,hostMax:30,loanDay:3,loanMax:30,giftMin:10000,giftMax:50000000,range:12,
  tiers:[{pts:10,name:'Hảo sảng',b:.02},{pts:30,name:'Hào phóng',b:.04},{pts:60,name:'Hào hiệp',b:.06},{pts:100,name:'Đại hiệp',b:.08},{pts:200,name:'Mạnh Thường Quân',b:.1}],
  loan:{min:100000,max:50000000,minRate:.01,maxRate:.1,maxDays:7,maxActive:3,capDays:30}};   /* lãi đơn theo ngày (tính tròn ngày, ít nhất 1 ngày), tối đa capDays ngày lãi */
const hsPts=p=>{ const h=p&&p.hs; if(!h) return 0; return Math.max(0,Math.floor(((h.give||0)-(h.got||0))/HAOSANG.perPts))+Math.min(HAOSANG.hostMax,h.host||0)+Math.min(HAOSANG.loanMax,h.loan||0); };
const hsTier=p=>{ const n=hsPts(p); let t=null, i=0; HAOSANG.tiers.forEach((x,k)=>{ if(n>=x.pts){ t=x; i=k+1; } }); return t?{...t,lv:i,n}:{lv:0,n,b:0,name:''}; };
const hsBonus=p=>hsTier(p).b;
const loanOwed=(L,t)=>{ const days=Math.min(HAOSANG.loan.capDays,Math.max(1,Math.ceil((t-L.start)/864e5))); return Math.max(0,Math.round(L.amt*(1+L.rate*days)/1000)*1000-(L.paid||0)); };
/* ======================= Cổng dịch chuyển MU: vòm đá phát sáng ở mọi lối qua tường + bệ dịch chuyển giữa mỗi khu quái rừng =======================
   kind front: vòm nhìn chính diện trên tường Nam (x giữa lối, y mép dưới tường); side: 2 trụ đá + màn sáng trên tường dọc (x giữa tường, y giữa lối); pad: bệ đá trong khu quái.
   Đứng gần cổng / bệ bấm E chọn nơi tới (server muwest.js op 'warp'). Toạ độ khung MU mới (đã dời OX). */
MU.portals=[
  {id:'town',name:'Quảng trường · lối xuống Rừng Quái',kind:'front',x:86,y:30,span:6,col:'#ff7a3a',sign:'RUNG QUAI'},
  {id:'lang',name:'Rừng Làng Lá',kind:'side',x:107,y:8,span:4,col:'#5ae86a',sign:'LANG LA'},
  {id:'dam',name:'Đầm Rồng',kind:'side',x:107,y:23.5,span:5,col:'#3ab8f0',sign:'DAM RONG'},
  {id:'ma',name:'Nghĩa địa Bóng Ma',kind:'side',x:135,y:8,span:4,col:'#b07aff',sign:'NGHIA DIA'},
  {id:'phe',name:'Bãi Phế Liệu',kind:'side',x:135,y:23.5,span:5,col:'#ffb03a',sign:'BAI PHE LIEU'},
  {id:'tay',name:'Vùng Boss phía Tây',kind:'side',x:65,y:21,span:4,col:'#ffd84a',sign:'VUNG BOSS TAY'},
  {id:'rung2',name:'Đầm Rồng · lối xuống rừng',kind:'front',x:121,y:30,span:4,col:'#ff7a3a',sign:'RUNG QUAI'},
  {id:'rung3',name:'Bãi Phế Liệu · lối xuống rừng',kind:'front',x:148,y:30,span:4,col:'#ff7a3a',sign:'RUNG QUAI'},
  ...Object.values(MU.forest.mobs).map(m=>({id:'f_'+m.k,name:`${m.zone.name} · ${m.name} Lv${m.lv}`,kind:'pad',x:(m.zone.x0+m.zone.x1+1)/2,y:m.zone.y0+(m.k==='mage'?1.2:2.2),col:'#c8a0ff',lv:m.lv}))];
MU.portalR=2.8;   /* đứng trong bán kính này (ô) quanh cổng mới dịch chuyển được */
/* ======================= Nhà riêng (Hà Nội): mua nội thất, đặt / dời / cất đồ, đổi sàn + tường, mở rộng nhà, độ ấm cúng, bảng xếp hạng nhà đẹp =======================
   Đồ đặt theo ô: x = cột trái, y = hàng dưới cùng của chân đồ (fw × fh ô). Đồ treo tường (wall) nằm trên tường trên cùng (y bỏ qua). Thảm ô (rug) tô ô sàn thành thảm.
   art: tên hàm vẽ ART + args; extra: vẽ thêm (điện thoại, laptop, sạc, ấm) lệch [dx,dy] ô so với điểm neo; act: chỗ bấm E (ngủ, tủ đồ, laptop, tắm, sạc, câu nói).
   req: đồ bắt buộc (dời được, không cất / bán được). cozy: điểm ấm cúng (mỗi loại tính tối đa sameMax món). */
const HOME={levels:[{name:'Căn hộ 1 phòng ngủ',W:26,H:16,cap:36,price:0},{name:'Căn hộ mở rộng',W:32,H:18,cap:50,price:8000000},{name:'Căn hộ penthouse',W:38,H:20,cap:70,price:20000000},{name:'Biệt thự mini',W:44,H:24,cap:95,price:40000000}],
  sellBack:.5,cozyMax:100,sameMax:3,likePts:2,likeLv:3,
  cats:[['ngu','Phòng ngủ'],['khach','Phòng khách'],['bep','Bếp & ăn'],['lam','Làm việc'],['tam','Phòng tắm'],['cay','Cây & hoa'],['tuong','Treo tường'],['tham','Thảm'],['vui','Giải trí'],['suu','Sưu tầm']],
  floors:{go:{name:'Sàn gỗ sồi',price:0,style:'plank',col:['#b98a5c','#a37548','#c99a6a','#8e6239'],cozy:0},go_oc:{name:'Sàn gỗ óc chó',price:600000,style:'plank',col:['#7a5234','#5e3e26','#93653f','#4a301c'],cozy:4},
    go_trang:{name:'Sàn gỗ sồi trắng',price:800000,style:'plank',col:['#d8c4a0','#c2ab84','#e8d8b8','#a8906a'],cozy:5},gach:{name:'Gạch men trắng',price:400000,style:'tile',col:['#e8e6e0','#c8c4bc','#f8f6f0','#a8a49c'],cozy:2},
    caro:{name:'Gạch caro đen trắng',price:700000,style:'check',col:['#ece8e0','#9a968e','#34303a','#6a6670'],cozy:3},da:{name:'Đá cẩm thạch',price:2000000,style:'marble',col:['#ece8e4','#c8c0b8','#f8f6f4','#a8a098'],cozy:6},
    tham_xam:{name:'Thảm trải sàn xám',price:1200000,style:'carpet',col:['#8a8a94','#7a7a84','#9a9aa4','#6a6a74'],cozy:7},tham_hong:{name:'Thảm trải sàn hồng',price:1200000,style:'carpet',col:['#e8b4c0','#d8a0b0','#f4c8d2','#c88ea0'],cozy:7},
    van_to:{name:'Sàn ván gỗ to',price:900000,style:'plank2',col:['#a8683e','#8a5030','#c08050','#6a3a20'],cozy:6,isNew:1},kim_cuong:{name:'Gạch caro kim cương',price:1000000,style:'diamond',col:['#f8f6f0','#d8d4cc','#2a2630','#e8e4dc'],cozy:5,isNew:1}},
  walls:{kem:{name:'Sơn kem',price:0,style:'paint',col:['#eadfca','#d7c8ad','#8c6b4a','#4a3c34'],cozy:0},mint:{name:'Sơn xanh mint',price:300000,style:'paint',col:['#cdebdc','#b5d9c6','#5e8a74','#33463e'],cozy:2},
    hong:{name:'Sơn hồng phấn',price:300000,style:'paint',col:['#f2d4d8','#e2bcc2','#8a5e66','#4a343a'],cozy:2},xanh:{name:'Sơn xanh dương',price:300000,style:'paint',col:['#c4d8f0','#a8c0e0','#4a6488','#2a3448'],cozy:2},
    gach_do:{name:'Tường gạch đỏ',price:1000000,style:'brick',col:['#b5523c','#e0c8b0','#6a3428','#3a2a26'],cozy:4},soc:{name:'Giấy dán tường sọc',price:800000,style:'stripe',col:['#efe2c8','#d8c098','#8c6b4a','#4a3c34'],cozy:4},
    go_op:{name:'Tường ốp gỗ',price:1500000,style:'panel',col:['#9a6a42','#7e5434','#5a3a22','#3a2a20'],cozy:5},
    go_xanh:{name:'Ván xanh + ốp gỗ chân tường',price:1800000,style:'wains',col:['#4a7ab8','#3a64a0','#9a6440','#2a2630','#7a4a2e'],cozy:7,isNew:1},
    kem_op:{name:'Ván kem + ốp gỗ chân tường',price:1400000,style:'wains',col:['#efe2c8','#d8c8a8','#9a6440','#4a3c34','#7a4a2e'],cozy:6,isNew:1},
    van_nau:{name:'Ván gỗ dọc nâu',price:1200000,style:'vplank',col:['#8a5a3a','#6e4428','#a8744c','#3a2a20'],cozy:6,isNew:1}},
  items:{
    giuong:{name:'Giường gỗ',cat:'ngu',price:1200000,art:'bed',fw:2,fh:3,cozy:4,req:1,act:{bed:1}},
    giuong_don:{name:'Giường đơn',cat:'ngu',price:600000,art:'bedSingle',fw:2,fh:2,cozy:3,act:{bed:1}},
    giuong_doi:{name:'Giường đôi',cat:'ngu',price:2500000,art:'bedDouble',fw:3,fh:2,cozy:8,act:{bed:1}},
    tu_dau_giuong:{name:'Tủ đầu giường + sạc',cat:'ngu',price:300000,art:'nightstand',fw:1,fh:2,dy:-.4,cozy:1,req:1,extra:[['charger',[false],-.1,-1,'flat']],act:{id:'charger',label:'Sạc điện thoại',do:'ra',act:'sac',dy:.6}},
    tu_do:{name:'Tủ quần áo',cat:'ngu',price:1000000,art:'wardrobe',fw:2,fh:2,cozy:2,req:1,act:{id:'wardrobe',label:'Tủ quần áo',do:'wardrobe',dy:.4}},
    ban_canh:{name:'Tủ đầu giường gỗ',cat:'ngu',price:300000,art:'bedside',fw:1,fh:2,cozy:2},
    den_cay:{name:'Đèn cây',cat:'ngu',price:250000,art:'lamp',fw:1,fh:1,cozy:3},
    quat:{name:'Quạt cây',cat:'ngu',price:150000,art:'fan',fw:1,fh:1,cozy:1},
    den_bao:{name:'Đèn bão',cat:'ngu',price:120000,art:'lantern',fw:1,fh:1,solid:false,cozy:2},
    sofa_nau:{name:'Sofa nâu',cat:'khach',price:1500000,art:'sofa',args:['#7a6a5a',64],fw:4,fh:2,dy:-.2,cozy:5},
    sofa_xanh:{name:'Sofa xanh',cat:'khach',price:1800000,art:'sofa',args:['#3f6f8a',64],fw:4,fh:2,dy:-.2,cozy:6},
    sofa_do:{name:'Sofa đỏ',cat:'khach',price:1800000,art:'sofa',args:['#a8403a',64],fw:4,fh:2,dy:-.2,cozy:6},
    sofa_kem:{name:'Sofa kem 2 chỗ',cat:'khach',price:1200000,art:'sofa',args:['#d8c8a8',48],fw:3,fh:2,dy:-.2,cozy:5},
    ghe_banh:{name:'Ghế bành',cat:'khach',price:900000,art:'armchair',fw:2,fh:2,cozy:4},
    ghe_luoi:{name:'Ghế lười',cat:'khach',price:350000,art:'loungeChair',fw:1,fh:1,solid:false,cozy:2},
    gau_luoi:{name:'Ghế hạt xốp',cat:'khach',price:400000,art:'beanbag',fw:2,fh:1,solid:false,cozy:3},
    ban_tra:{name:'Bàn trà',cat:'khach',price:400000,art:'coffeeTable',args:[true],fw:2,fh:1,dy:-.4,cozy:2},
    ban_thap:{name:'Bàn thấp',cat:'khach',price:300000,art:'lowTable',fw:2,fh:1,cozy:2},
    tv:{name:'Kệ TV',cat:'khach',price:2000000,art:'tvStand',fw:4,fh:2,dy:-.4,cozy:4,act:{label:'Xem TV',dy:.6,say:['Thời sự: "Đà Lạt vào mùa dâu tây, giá 50.000đ/hộp"... Tắt TV đi làm việc thôi.']}},
    tv_lon:{name:'TV màn hình lớn',cat:'khach',price:4000000,art:'myTV',fw:4,fh:2,cozy:6,act:{label:'Xem TV',dy:.6,say:['Đang chiếu phim bom tấn, âm thanh vòm rung cả nhà!']}},
    ke_sach:{name:'Kệ sách',cat:'khach',price:800000,art:'shelf',fw:2,fh:2,dy:-.6,cozy:3,act:{label:'Xem kệ sách',dy:.6,say:['Một chồng sách UX, một cuốn "Đi Hoà Bình mùa nào đẹp".']}},
    ke_retro:{name:'Kệ đồ cổ điển',cat:'khach',price:1200000,art:'retroShelf',fw:2,fh:2,cozy:4},
    loa:{name:'Loa thùng',cat:'khach',price:700000,art:'speaker',fw:1,fh:1,cozy:3},
    tu_lanh:{name:'Tủ lạnh',cat:'bep',price:1500000,art:'fridge',fw:1,fh:2,dy:-.2,cozy:2,act:{label:'Mở tủ lạnh',dy:.6,say:['Tủ lạnh còn hộp sữa với mấy quả trứng. Đi ăn ngoài cho nhanh.']}},
    ke_bep:{name:'Kệ bếp + ấm siêu tốc',cat:'bep',price:2000000,art:'counter',args:[80,'#e8e4dc'],fw:5,fh:2,dy:-.4,cozy:3,extra:[['kettleTable',[],-.1,-1,.1]]},
    bep_ga:{name:'Bếp ga',cat:'bep',price:1200000,art:'stove',fw:2,fh:2,cozy:3},
    cay_nuoc:{name:'Cây nước',cat:'bep',price:300000,art:'cooler',fw:1,fh:2,dy:-.4,cozy:1,act:{label:'Uống nước',dy:.6,say:['Ực ực... mát cả người.']}},
    ban_tron:{name:'Bàn ăn tròn',cat:'bep',price:900000,art:'roundTable',fw:3,fh:2,cozy:3},
    ban_an:{name:'Bàn ăn dài',cat:'bep',price:800000,art:'eatTable',fw:3,fh:1,cozy:3},
    ban_cafe:{name:'Bàn cà phê',cat:'bep',price:600000,art:'cafeTable',fw:2,fh:2,cozy:3},
    ghe_dau:{name:'Ghế đẩu',cat:'bep',price:80000,art:'stool',fw:1,fh:1,solid:false,cozy:1},
    ban_lv:{name:'Bàn làm việc + laptop',cat:'lam',price:1500000,art:'desk',fw:3,fh:2,cozy:2,req:1,extra:[['phone',[],-.9,-.8,.05,'phone'],['laptop',[],1.1,-.5,.1]],
      act:[{id:'phone',label:'Nghe máy',dx:-.9},{id:'laptop',label:'Mở laptop',do:'hub',dx:.9,dy:.4}]},
    ghe_xoay:{name:'Ghế xoay',cat:'lam',price:150000,art:'chair',fw:1,fh:1,dy:-.4,solid:false,cozy:1},
    tu_ho_so:{name:'Tủ hồ sơ',cat:'lam',price:300000,art:'filing',fw:1,fh:2,dy:.4,cozy:1},
    ban_imac:{name:'Bàn iMac',cat:'lam',price:3000000,art:'imacDesk',fw:3,fh:2,cozy:4},
    pc_game:{name:'Dàn PC chơi game',cat:'lam',price:2500000,art:'pcStation',fw:2,fh:2,cozy:4,act:{label:'Chơi PC',dy:.6,say:['Vào trận rank... thua 3 trận liền. Thôi đi ngủ.']}},
    ghe_gaming:{name:'Ghế gaming',cat:'lam',price:900000,art:'gamingChair',fw:1,fh:1,solid:false,cozy:2},
    voi_sen:{name:'Vòi sen',cat:'tam',price:800000,art:'shower',fw:2,fh:2,dy:.1,cozy:1,req:1,act:{id:'shower',label:'Tắm',do:'ra',act:'tam',dx:.2,dy:.5}},
    bon_rua:{name:'Bồn rửa mặt',cat:'tam',price:500000,art:'sink',fw:2,fh:2,dy:-.2,cozy:1},
    bon_tam:{name:'Bồn tắm',cat:'tam',price:4000000,art:'bathtub',fw:3,fh:2,cozy:6,act:{label:'Ngâm bồn tắm',do:'ra',act:'tam',dy:.5}},
    cay_1:{name:'Chậu cây xanh',cat:'cay',price:120000,art:'potPlant',args:[0],fw:1,fh:1,dy:-.6,cozy:2},
    cay_2:{name:'Chậu cây lá to',cat:'cay',price:150000,art:'potPlant',args:[1],fw:1,fh:1,dy:.4,cozy:2},
    cay_3:{name:'Chậu cây cao',cat:'cay',price:180000,art:'potPlant',args:[2],fw:1,fh:1,dy:-.6,cozy:2},
    cay_4:{name:'Chậu hoa',cat:'cay',price:200000,art:'potPlant',args:[3],fw:1,fh:1,dy:-.6,cozy:2},
    bonsai:{name:'Cây bonsai',cat:'cay',price:1500000,art:'bonsaiPot',fw:1,fh:1,cozy:5},
    duong_xi:{name:'Chậu dương xỉ',cat:'cay',price:400000,art:'pottedFern',fw:1,fh:1,cozy:3},
    luong_hoa:{name:'Luống hoa',cat:'cay',price:350000,art:'flowerBed',fw:2,fh:1,solid:false,cozy:3},
    rem:{name:'Rèm cửa sổ',cat:'tuong',price:300000,art:'blinds',fw:3,wall:1,cozy:1},
    lich:{name:'Lịch treo tường',cat:'tuong',price:50000,art:'calendar',fw:1,wall:1,cozy:1},
    cua_so:{name:'Cửa sổ',cat:'tuong',price:800000,art:'windowWall',fw:3,wall:1,cozy:3},
    poster:{name:'Poster',cat:'tuong',price:150000,art:'poster',fw:1,wall:1,cozy:1},
    khan:{name:'Khăn tắm',cat:'tuong',price:50000,art:'towel',fw:1,wall:1,dy:.6,cozy:1},
    guong:{name:'Gương',cat:'tuong',price:300000,art:'mirror',fw:1,wall:1,dy:.4,cozy:1},
    tv_tuong:{name:'TV treo tường',cat:'tuong',price:2500000,art:'wallTV',fw:3,wall:1,cozy:4},
    cua_so_ho:{name:'Cửa sổ nhìn hồ',cat:'tuong',price:3000000,art:'lakeWindow',fw:3,wall:1,cozy:6},
    cua_so_dem:{name:'Cửa kính toàn cảnh đêm',cat:'tuong',price:6000000,art:'nightWindow',fw:8,wall:1,cozy:8},
    tham_ngu:{name:'Thảm đỏ 7×4',cat:'tham',price:300000,fw:7,fh:4,rug:1,cozy:2},
    tham_khach:{name:'Thảm đỏ 8×4',cat:'tham',price:350000,fw:8,fh:4,rug:1,cozy:2},
    tham_nho:{name:'Thảm hoa văn',cat:'tham',price:400000,art:'rug',fw:5,fh:2,flat:1,cozy:2},
    tham_xanh:{name:'Thảm xanh lớn',cat:'tham',price:900000,art:'plainRug',fw:8,fh:6,flat:1,cozy:3},
    tham_logo:{name:'Thảm logo',cat:'tham',price:700000,art:'logoRug',fw:5,fh:2,flat:1,cozy:3},
    tham_co:{name:'Thảm cỏ khổng lồ',cat:'tham',price:1500000,art:'greenRug',fw:13,fh:8,flat:1,cozy:4},
    may_game:{name:'Máy game thùng',cat:'vui',price:3000000,art:'arcade',fw:2,fh:2,cozy:5,act:{label:'Chơi game thùng',dy:.6,say:['Đạt điểm cao mới! Ghi tên vào bảng: AAA.']}},
    bong_ban:{name:'Bàn bóng bàn',cat:'vui',price:2000000,art:'tableTennis',fw:3,fh:2,cozy:4},
    co_vua:{name:'Bàn cờ vua',cat:'vui',price:1200000,art:'chessTable',fw:3,fh:2,cozy:3},
    goc_game:{name:'Góc chơi game',cat:'vui',price:4000000,art:'gameCorner',fw:4,fh:2,cozy:6},
    tu_do_choi:{name:'Tủ đồ chơi',cat:'vui',price:3000000,art:'toyCabinet',fw:3,fh:2,cozy:5},
    den_sk:{name:'Đèn sân khấu',cat:'vui',price:600000,art:'stageLight',fw:1,fh:1,cozy:2},
    tuong_zaku:{name:'Tượng Zaku',cat:'suu',price:6000000,art:'zakuStatue',fw:2,fh:2,cozy:7},
    tuong_optimus:{name:'Tượng Optimus Prime',cat:'suu',price:8000000,art:'optimusStatue',fw:2,fh:2,cozy:8},
    tu_cup:{name:'Tủ cúp',cat:'suu',price:3500000,art:'trophyCase',fw:2,fh:2,cozy:5},
    ke_figure:{name:'Kệ figure',cat:'suu',price:4000000,art:'figShelf',fw:3,fh:2,cozy:6},
    ban_mo_hinh:{name:'Bàn mô hình',cat:'suu',price:2500000,art:'modelTable',fw:3,fh:2,cozy:4},
    den_da:{name:'Đèn đá Nhật',cat:'suu',price:1200000,art:'stoneLantern',fw:1,fh:1,cozy:4},
    nem_cho:{name:'Nệm cho cún',cat:'suu',price:500000,art:'dogBed',fw:2,fh:1,solid:false,cozy:3},
    // bộ "nhà ấm" vẽ theo kiểu game pixel đồng quê (art22.js)
    giuong_ke:{name:'Giường chăn kẻ ô',cat:'ngu',price:2200000,art:'bedPlaid',fw:2,fh:3,cozy:7,isNew:1,act:{bed:1}},
    tu_den:{name:'Tủ đầu giường + đèn ngủ',cat:'ngu',price:450000,art:'standLamp',fw:1,fh:2,cozy:3,isNew:1},
    tu_dong_ho:{name:'Tủ đầu giường + đồng hồ',cat:'ngu',price:400000,art:'standClock',fw:1,fh:2,cozy:3,isNew:1},
    tu_keo:{name:'Tủ ngăn kéo gỗ',cat:'ngu',price:900000,art:'chest',fw:2,fh:2,cozy:3,isNew:1},
    den_tuong:{name:'Đèn tường',cat:'tuong',price:350000,art:'sconce',fw:1,wall:1,cozy:3,isNew:1},
    tranh_nui:{name:'Tranh đồi núi',cat:'tuong',price:1500000,art:'painting',fw:4,wall:1,cozy:5,isNew:1},
    tu_bep_go:{name:'Tủ bếp gỗ + gạch ốp',cat:'bep',price:900000,art:'kCounter',fw:2,fh:2,cozy:3,isNew:1},
    bep_lo:{name:'Bếp lò + ấm trà',cat:'bep',price:1400000,art:'kStove',fw:2,fh:2,cozy:4,isNew:1,act:{label:'Đun nước',dy:.6,say:['Ấm nước reo ù ù... pha ấm trà nóng thôi.']}},
    bon_bep:{name:'Bồn rửa bát',cat:'bep',price:900000,art:'kSink',fw:2,fh:2,cozy:3,isNew:1},
    tu_lanh_xanh:{name:'Tủ lạnh xanh bạc hà',cat:'bep',price:1800000,art:'fridgeMint',fw:2,fh:2,cozy:4,isNew:1,act:{label:'Mở tủ lạnh',dy:.6,say:['Đầy ắp rau củ, trứng, sữa. Hôm nay nấu bữa ngon ở nhà!']}},
    tu_bep_treo:{name:'Tủ bếp treo tường',cat:'tuong',price:800000,art:'wallCab',fw:3,wall:1,cozy:3,isNew:1},
    gio_qua:{name:'Giỏ trái cây',cat:'bep',price:150000,art:'fruits',fw:1,fh:1,cozy:2,isNew:1},
    ban_an_go:{name:'Bàn ăn gỗ 4 ghế',cat:'bep',price:2500000,art:'dining',fw:4,fh:3,cozy:7,isNew:1},
    cay_la_to:{name:'Chậu cây lá to',cat:'cay',price:900000,art:'bigPlant',fw:2,fh:1,cozy:5,isNew:1},
    cay_treo_gio:{name:'Giỏ cây treo',cat:'tuong',price:600000,art:'hangPlant',fw:2,wall:1,cozy:4,isNew:1},
    dong_ho_lac:{name:'Đồng hồ quả lắc',cat:'khach',price:2000000,art:'grandClock',fw:1,fh:1,cozy:5,isNew:1,act:{label:'Xem giờ',dy:.6,say:['Tích tắc... tích tắc... Boong! Đã đến giờ đi làm rồi.']}},
    ke_hu:{name:'Kệ hũ thuỷ tinh',cat:'bep',price:1100000,art:'jarShelf',fw:2,fh:2,cozy:4,isNew:1},
    thung_ngo:{name:'Thùng ngô',cat:'bep',price:250000,art:'cornCrate',fw:2,fh:1,cozy:2,isNew:1},
    tham_xam_cham:{name:'Thảm xám viền chấm',cat:'tham',price:800000,art:'grayRug',fw:6,fh:4,flat:1,cozy:4,isNew:1},
    ban_hoc:{name:'Bàn học gỗ',cat:'lam',price:700000,art:'studyDesk',fw:2,fh:2,cozy:3,isNew:1},
    ghe_dem:{name:'Ghế đệm xanh',cat:'lam',price:250000,art:'cushionChair',fw:1,fh:1,solid:false,cozy:2,isNew:1}},
  // bộ sưu tập: đặt đủ cả bộ trong nhà thì cộng thêm điểm ấm cúng
  sets:{ngu_que:{name:'Phòng ngủ đồng quê',items:['giuong_ke','tu_den','tu_dong_ho','tu_keo','den_tuong','tranh_nui','tham_xam_cham'],bonus:12},
    bep_que:{name:'Bếp đồng quê',items:['tu_bep_go','bep_lo','bon_bep','tu_lanh_xanh','tu_bep_treo','gio_qua'],bonus:12},
    an_am:{name:'Góc ăn ấm áp',items:['ban_an_go','cay_la_to','dong_ho_lac','ke_hu','thung_ngo','cay_treo_gio'],bonus:12},
    hoc:{name:'Góc học bài',items:['ban_hoc','ghe_dem','den_tuong','ke_sach'],bonus:6}},
  tiers:[[0,'Trống trải'],[20,'Gọn gàng'],[40,'Ấm áp'],[60,'Ấm cúng'],[80,'Tổ ấm mơ ước']],
  // bố cục có sẵn (giống căn hộ cũ): [món, x, y]
  base:[['rem',2,2],['lich',7,2],['tu_ho_so',1,3],['ban_lv',4,3],['ghe_xoay',5,4],['cay_2',8,2],['cua_so',11,2],['giuong',10,4],['tu_dau_giuong',13,3],['tu_do',16,3],['poster',14,2],
    ['voi_sen',20,3],['bon_rua',23,3],['khan',22,2],['guong',24,2],['tu_lanh',1,10],['ke_bep',2,10],['cay_nuoc',7,10],['ban_tron',3,13],['tv',18,10],['ke_sach',15,10],['sofa_nau',18,14],
    ['ban_tra',19,12],['cay_3',24,10],['cay_4',9,14],['cay_1',14,14],['tham_ngu',9,7],['tham_khach',16,14]]};
const homeDefault=()=>({lv:0,floor:'go',wall:'kem',items:HOME.base.map(([k,x,y])=>({k,x,y,f:0})),inv:{},own:{floor:{go:1},wall:{kem:1}},likes:{},open:true});
// khung nhà theo cấp: tường bao 2 hàng trên, phòng tắm góc phải trên (cửa x 21–22), cửa ra x 12–13 ở tường dưới
const homeGrid=lv=>{ const L=HOME.levels[lv]||HOME.levels[0], W=L.W, H=L.H, g=[];
  for(let y=0;y<H;y++){ const r=[]; for(let x=0;x<W;x++) r.push(y<=1||y===H-1||x===0||x===W-1?'H':'O'); g.push(r); }
  for(let y=2;y<=7;y++){ g[y][19]='H'; for(let x=20;x<=24;x++) g[y][x]='I'; if(W>26) g[y][25]='H'; }
  for(let x=19;x<=(W>26?25:24);x++) g[8][x]='H'; g[8][21]='I'; g[8][22]='I'; g[H-1][12]='O'; g[H-1][13]='O'; return {W,H,g}; };
const homeFoot=(d,it)=>d.wall?{x0:it.x,y0:1,x1:it.x+d.fw-1,y1:1}:{x0:it.x,y0:it.y-(d.fh||1)+1,x1:it.x+d.fw-1,y1:it.y};
const homeSolid=d=>!d.wall&&!d.flat&&!d.rug&&d.solid!==false;
// điểm neo vẽ (đơn vị ô): giữa chân đồ, mép dưới hàng cuối (+dy); đồ treo tường neo ở hàng 2
const homeAnchor=(d,it)=>[it.x+d.fw/2,(d.wall?2:it.y+1)+(d.dy||0)];
// đặt được không: '' là được, còn lại là lý do. skip: vị trí món đang dời (bỏ qua chính nó); me: ô người chủ đang đứng [x,y]
function homeFits(home,it,skip,me){ const d=HOME.items[it.k]; if(!d) return 'Không có món này'; const {W,H,g}=homeGrid(home.lv||0), F=homeFoot(d,it);
  if(!Number.isInteger(it.x)||!Number.isInteger(it.y)) return '?'; if(F.x0<1||F.x1>W-2) return 'Ra ngoài tường rồi';
  if(d.wall){ for(const [i,o] of (home.items||[]).entries()){ if(i===skip) continue; const e=HOME.items[o.k]; if(e&&e.wall&&o.x<=F.x1&&o.x+e.fw-1>=F.x0) return 'Chỗ tường này treo đồ khác rồi'; } return ''; }
  if(F.y0<2||F.y1>H-2) return 'Ra ngoài tường rồi'; for(let y=F.y0;y<=F.y1;y++) for(let x=F.x0;x<=F.x1;x++) if(g[y][x]==='H') return 'Vướng tường';
  if(!homeSolid(d)) return '';
  const keep=[[12,H-2],[13,H-2],[22,9],[22,7]]; for(const [x,y] of keep) if(x>=F.x0&&x<=F.x1&&y>=F.y0&&y<=F.y1) return 'Để trống lối đi ở cửa';
  if(me&&me[0]>=F.x0&&me[0]<=F.x1&&me[1]>=F.y0&&me[1]<=F.y1) return 'Bạn đang đứng chỗ đó';
  for(const [i,o] of (home.items||[]).entries()){ if(i===skip) continue; const e=HOME.items[o.k]; if(!e||!homeSolid(e)) continue; const G=homeFoot(e,o); if(G.x0<=F.x1&&G.x1>=F.x0&&G.y0<=F.y1&&G.y1>=F.y0) return 'Vướng '+e.name.toLowerCase(); }
  return ''; }
// độ ấm cúng 0–100: cộng điểm từng món (mỗi loại tối đa sameMax món) + sàn + tường
function homeCozy(home){ if(!home) return 0; const n={}; let c=(HOME.floors[home.floor]||{}).cozy||0; c+=(HOME.walls[home.wall]||{}).cozy||0;
  for(const o of home.items||[]){ const d=HOME.items[o.k]; if(!d) continue; n[o.k]=(n[o.k]||0)+1; if(n[o.k]<=HOME.sameMax) c+=d.cozy||0; }
  for(const st of Object.values(HOME.sets)) if(st.items.every(k=>n[k])) c+=st.bonus; return Math.min(HOME.cozyMax,c); }   /* đủ bộ sưu tập: + thưởng */
const homeTier=c=>{ let t=HOME.tiers[0]; for(const x of HOME.tiers) if(c>=x[0]) t=x; return t[1]; };
const homeScore=home=>home?homeCozy(home)+Object.keys(home.likes||{}).length*HOME.likePts:0;
// ngủ ở nhà mình: ấm cúng ≥ 10 thì +EXP (tối đa +15% trong 60 phút, kém phòng Nhà Chiềng thuê 600k/ngày) và hồi thêm năng lượng
const homeBuff=cozy=>cozy>=10?{mul:1+Math.min(.15,Math.round(cozy*.15)/100),min:Math.min(60,Math.round(20+cozy*.4))}:null;
/* ======================= Giải Ngoại Hạng Anh (map 'epl', bay sang nước Anh bằng Grab): 6 sân của 6 CLB, giải đấu chạy suốt ngày =======================
   Mỗi EPL.every phút (giờ thật) 1 vòng đấu 3 trận (6 CLB chia cặp xoay vòng, đổi sân nhà / khách), mỗi trận EPL.dur giây = 90 phút bóng đá, bàn thắng tính theo sức mạnh 2 đội.
   4 vai, gắn với cả game:
   · Cầu thủ: ký hợp đồng ở Giám đốc CLB (từ cấp contract.lv), tập sút ở chấm phạt đền (tốn năng lượng, lên chỉ số Sút bóng), đứng trên sân nhà / khách lúc trận diễn ra:
     đội mạnh hơn theo số người + chỉ số, thỉnh thoảng có Cơ hội dứt điểm (bấm đúng lúc) → bàn thắng. Lương mỗi trận + thưởng thắng + thưởng bàn.
   · Huấn luyện viên: học Chứng chỉ HLV bóng đá (laptop ở phòng) + đủ chỉ số / số trận, nhận ghế HLV 1 CLB (mỗi CLB 1 người), chọn chiến thuật, có mặt ở sân lúc trận diễn ra thì nhận lương.
   · Cổ động viên: chọn CLB yêu thích, mua vé, vào sân cổ vũ (mặc áo đấu đúng đội cổ vũ mạnh gấp rưỡi) → sân nóng lên, đội nhà mạnh thêm; đội mình thắng thì có thưởng + buff EXP.
   · Người bán hàng: thuê sạp trước cổng sân theo ngày, nhập hàng ở Tổng kho quảng trường, rao bán cho fan (bot); có trận ở sân đó + sân càng nóng bán càng được giá, có trần lãi mỗi ngày.
   Lương / thưởng tiền mỗi ngày: tối đa paidPerDay trận có tiền (gộp mọi vai), tiền bán hàng có trần riêng: khớp khối "Cân bằng kinh tế" (cày tối đa ~1,5–2 triệu / giờ).
   Mùa giải = 1 tuần thật (thứ Hai → Chủ nhật): bảng xếp hạng 3 điểm thắng / 1 điểm hoà, hết tuần CLB vô địch thưởng cầu thủ + HLV + fan chăm đi xem, Vua phá lưới có thưởng riêng.
   Huy Phan (fan Arsenal) đứng trước sân Emirates giao chuỗi nhiệm vụ Pháo Thủ. */
const EPL={W:158,H:100,spawn:{x:79,y:56.4},every:20,dur:180,join:60,
  clubs:{
    ars:{name:'Arsenal',short:'ARS',stadium:'Emirates',col:'#ef0107',col2:'#ffffff',rating:87,coach:'Mikel Arteta',stars:['Saka','Ødegaard','Rice','Martinelli','Gyökeres'],bx:4,by:3},
    mci:{name:'Manchester City',short:'MCI',stadium:'Etihad',col:'#6cabdd',col2:'#1c2c5b',rating:88,coach:'Pep Guardiola',stars:['Haaland','Foden','Rodri','Doku','Marmoush'],bx:56,by:3},
    liv:{name:'Liverpool',short:'LIV',stadium:'Anfield',col:'#c8102e',col2:'#f6eb61',rating:86,coach:'Arne Slot',stars:['Salah','Wirtz','Van Dijk','Szoboszlai','Isak'],bx:108,by:3},
    mu:{name:'Manchester United',short:'MUN',stadium:'Old Trafford',col:'#da291c',col2:'#fbe122',rating:81,coach:'Ruben Amorim',stars:['Bruno Fernandes','Mbeumo','Cunha','Mainoo','Šeško'],bx:4,by:65},
    che:{name:'Chelsea',short:'CHE',stadium:'Stamford Bridge',col:'#034694',col2:'#ffffff',rating:84,coach:'Enzo Maresca',stars:['Palmer','Enzo','Caicedo','João Pedro','Estêvão'],bx:56,by:65},
    new:{name:'Newcastle',short:'NEW',stadium:"St James' Park",col:'#241f20',col2:'#ffffff',rating:82,coach:'Eddie Howe',stars:['Gordon','Bruno Guimarães','Tonali','Joelinton','Wissa'],bx:108,by:65}},
  bw:46,bh:32,gate:[20,25],   /* khối sân 46×32 ô, cổng ở cạnh nhìn ra quảng trường */
  contract:{lv:5,transfer:500000,cd:24},   /* đổi CLB: phí chuyển nhượng + đợi cd giờ */
  coachReq:{course:'hlvbd',sk:25,apps:12},
  train:{energy:6,exp:12,cd:20,perDay:30,gain:[1.4,.35]},   /* mỗi buổi tập: chỉ số Sút bóng +gain[0] (lúc 0) giảm dần còn gain[1] (lúc 100) × độ chuẩn cú sút */
  match:{energy:10,goalRate:2.7,home:2,heatMax:40,heatPer:10,human:[.6,40],chance:[32,50],window:6,tac:{tancong:{name:'Tấn công tổng lực',me:1.25,opp:1.12},canbang:{name:'Cân bằng',me:1,opp:1},phongngu:{name:'Phòng ngự phản công',me:.82,opp:.72}}},
  pay:{player:{wage:40000,win:60000,goal:30000,exp:40,goalExp:25},coach:{wage:70000,win:100000,exp:60},fan:{ticket:30000,win:40000,exp:25,cheers:3,buff:{mul:1.1,min:30}},paidPerDay:6},
  vendor:{rent:100000,goods:{khan:{name:'Khăn cổ động',cost:20000},hotdog:{name:'Hot dog',cost:15000},bia:{name:'Bia Anh',cost:12000},aonhai:{name:'Áo đấu nhái',cost:90000}},mul:[1.5,2.2],quiet:1.25,perMatch:15,perIdle:3,cd:3,dailyCap:600000,maxStock:40},
  season:{player:1500000,coach:2000000,fan:500000,fanMin:5,boot:1000000,bootMin:3},
  kitPrice:250000};
const EPL_CLUBS=Object.keys(EPL.clubs);
// hình học mỗi sân (ô): khối sân, mặt cỏ, chấm phạt đền 2 đầu, sạp hàng trước cổng. Sân hàng trên mở cổng xuống dưới, hàng dưới mở cổng lên trên
Object.assign(EPL,{top:k=>EPL.clubs[k].by<30,block:k=>{ const c=EPL.clubs[k]; return {x0:c.bx,y0:c.by,x1:c.bx+EPL.bw-1,y1:c.by+EPL.bh-1}; },
  pitch:k=>{ const c=EPL.clubs[k], t=c.by<30; return {x0:c.bx+5,x1:c.bx+40,y0:c.by+(t?7:6),y1:c.by+(t?25:24)}; },
  spots:k=>{ const P=EPL.pitch(k), my=(P.y0+P.y1+1)/2; return [[P.x0+4.5,my],[P.x1-3.5,my]]; },
  stall:k=>{ const c=EPL.clubs[k]; return {x:c.bx+36.5,y:c.by<30?c.by+EPL.bh+1.6:c.by-1.4}; },
  clubAt:(x,y)=>EPL_CLUBS.find(k=>{ const B=EPL.block(k); return x>=B.x0&&x<=B.x1+1&&y>=B.y0&&y<=B.y1+1; })||''});
DEST.epl={name:'Ngoại Hạng Anh · 6 sân bóng (nước Anh)',city:'uk',plane:true};
Object.assign(GRAB,{hb_uk:125000,dl_uk:135000,hcm_uk:120000,hn_uk:120000,hp_uk:122000,mu_uk:120000,uk_uk:0});
SCENE_DEST.epl='epl'; SCENE_SIZE.epl=[EPL.W,EPL.H];
COURSES.hlvbd={name:'Chứng chỉ HLV bóng đá (UEFA C)',price:1500000,level:10,dur:45,desc:'Mở vai Huấn luyện viên ở Giải Ngoại Hạng Anh (cần thêm chỉ số Sút bóng + số trận đã đá).'};
SKILLS.hlvbd={name:'HLV bóng đá',key:'-',desc:COURSES.hlvbd.desc};
// áo đấu 6 CLB (bán ở quầy vé & áo đấu mỗi sân), áo Pháo Thủ Huyền Thoại: thưởng chuỗi nhiệm vụ của Huy Phan
/* đội hâm mộ (25/10): chọn 1 CLB yêu thích (ở bảng giải / quầy vé / dòng tỉ số trên thanh trên cùng, đổi 1 lần mỗi ngày), mỗi ngày 7 nhiệm vụ riêng cho đội đó:
   thưởng tiền + EXP + điểm trung thành (lp). Trung thành lên bậc thì có danh hiệu, đội thắng được thêm % tiền thưởng cổ động viên */
EPL.fanq=[{k:'kit',name:'Mặc áo đấu của đội',n:1,vnd:20000,exp:20,lp:2},{k:'cheer',name:'Cổ vũ cho đội trên khán đài',n:15,vnd:40000,exp:40,lp:4},{k:'watch',name:'Xem trọn 1 trận của đội (đủ lượt cổ vũ)',n:1,vnd:50000,exp:50,lp:5},
  {k:'win',name:'Có mặt khi đội thắng (cổ động viên / cầu thủ / HLV)',n:1,vnd:80000,exp:60,lp:6},{k:'goal',name:'Ghi bàn cho đội (cầu thủ của đội)',n:1,vnd:80000,exp:60,lp:6},
  {k:'sell',name:'Bán đồ cổ động ở sạp sân nhà của đội',n:5,vnd:30000,exp:30,lp:3},{k:'train',name:'Tập sút ở sân nhà của đội',n:3,vnd:30000,exp:30,lp:3}];
EPL.loyal=[{lp:0,name:'Fan mới',bonus:0},{lp:30,name:'Fan cứng',bonus:.1},{lp:100,name:'Ultras',bonus:.2},{lp:250,name:'Huyền thoại khán đài',bonus:.35}];
EPL.loyalOf=lp=>EPL.loyal.filter(x=>(lp||0)>=x.lp).pop();
for(const [k,c] of Object.entries(EPL.clubs)) CLOTHES['kit_'+k]={name:'Áo đấu '+c.name,slot:'top',price:EPL.kitPrice,hidden:true,opts:{top:'tee',polo:true,logo:true,...(k==='new'?{vstripe:true}:{})},colors:{top:c.col.slice(1),print:c.col2.slice(1),line:k==='new'?'f4f4f0':'1c1516'}};
{ const AWAY={ars:['f6d84a','1e3a8a'],mci:['1c2c5b','6cabdd'],liv:['f4f2ec','c8102e'],mu:['f4f4f0','da291c'],che:['f4f4f0','034694'],new:['3ab0c8','241f20']};   /* áo sân khách: đổi khi màu 2 đội gần nhau */
  for(const [k,[a,b]] of Object.entries(AWAY)) CLOTHES['kit_'+k+'_away']={name:'Áo sân khách '+EPL.clubs[k].name,slot:'top',price:0,hidden:true,opts:{top:'tee',polo:true,logo:true},colors:{top:a,print:b,line:'1c1516'}}; }
CLOTHES.kit_ars_legend={name:'Áo Pháo Thủ Huyền Thoại (Arsenal 2003–04)',slot:'top',price:0,hidden:true,opts:{top:'tee',polo:true,logo:true},colors:{top:'b8001c',print:'e8c35a',line:'1c1516'}};
Object.assign(FOOD,{fish_chips:{name:'Fish & chips',price:65000,meal:true,exp:8},pie_anh:{name:'Bánh pie thịt bò',price:55000,meal:true,exp:7},tra_anh:{name:'Trà sữa kiểu Anh',price:30000,drink:true,exp:3,buff:{mul:1.1,min:20}},hotdog_san:{name:'Hot dog sân bóng',price:35000,exp:3}});
PLACES.epl_food={name:'Xe đồ ăn Premier',where:'quảng trường Ngoại Hạng Anh',menu:['fish_chips','pie_anh','hotdog_san','tra_anh'],map:'epl',x:92.5,y:52.6};
// NPC: Giám đốc CLB (ký hợp đồng, ghế HLV, chiến thuật) + quầy vé & áo đấu trước mỗi cổng, Tổng kho hàng cổ động, xe đồ ăn, Huy Phan áo Arsenal
{ const side=c=>c.by<30, gx=c=>c.bx+EPL.gate[0]-3, gy=c=>side(c)?c.by+EPL.bh+1.4:c.by-1.6;
  for(const [k,c] of Object.entries(EPL.clubs)){ NPCS.push({id:'epl_mgr_'+k,scene:'epl',x:gx(c),y:gy(c),place:'epl_mgr',club:k},{id:'epl_shop_'+k,scene:'epl',x:c.bx+EPL.gate[1]+3.5,y:gy(c),place:'epl_shop',club:k});
    NPC_LOOKS['epl_mgr_'+k]={name:`Giám đốc ${c.name}`,look:{gender:'nam',hair:'swept',hairColor:'3a2f37',skin:'f0c49a',outfit:{top:'vest',bottom:'quan_vai_den',shoes:'giay_den'},opts:{mouth:'line'}}};
    NPC_LOOKS['epl_shop_'+k]={name:`Quầy vé & áo đấu ${c.short}`,look:{gender:'nu',hair:'ponytail',hairColor:'6b4128',skin:'f8cdb0',outfit:{top:'kit_'+k,bottom:'jean',shoes:'giay_trang'},opts:{mouth:'smile'}}}; } }
NPCS.push({id:'epl_kho',scene:'epl',x:66.5,y:53.4,place:'epl_kho'},{id:'epl_food',scene:'epl',x:92.5,y:53.4,place:'epl_food'},{id:'huyphan_epl',scene:'epl',x:31.5,y:38.6,place:'epl_hp'});
NPC_LOOKS.epl_kho={name:'Ông Tony (Tổng kho đồ cổ động)',look:{gender:'nam',hair:'bald',hairColor:'3a2f37',skin:'f3c4a4',outfit:{top:'khoac_jean',bottom:'jean',shoes:'giay_den'},opts:{mouth:'smile',beard:'goatee'}}};
NPC_LOOKS.epl_food={name:'Cô Emma (xe đồ ăn Premier)',look:{gender:'nu',hair:'bun',hairColor:'c98a45',skin:'f8cdb0',outfit:{top:'somi_dai',bottom:'vay_den',shoes:'giay_den'},opts:{mouth:'smile'}}};
NPC_LOOKS.huyphan_epl={name:'Huy Phan (fan cứng Arsenal)',look:{gender:'nam',hair:'undercut',hairColor:'1d1a1e',skin:'eab08c',outfit:{top:'kit_ars',bottom:'short_xam',shoes:'giay_trang',eyes:'kinh_can'},opts:{mouth:'smile',watch:true}}};
// chuỗi nhiệm vụ Pháo Thủ của Huy Phan (prog đếm ở server/epl.js)
Object.assign(QUESTS,{
  ars_kit:{giver:'huyphan_epl',title:'Gunner nhập môn',desc:'Huy Phan: "Muốn làm Gooner thì phải có áo!" Mua áo đấu Arsenal ở quầy vé & áo đấu trước sân Emirates rồi mặc vào.',prog:1,reward:{exp:150,vnd:150000}},
  ars_fan:{giver:'huyphan_epl',after:'ars_kit',title:'Lửa Emirates',desc:'Mua vé xem 2 trận có Arsenal (sân nhà hay sân khách đều được), vào sân cổ vũ ít nhất 3 lần mỗi trận cho Pháo Thủ.',prog:2,reward:{exp:250,vnd:300000}},
  ars_big:{giver:'huyphan_epl',after:'ars_fan',title:'Hạ đại gia',desc:'Có mặt (cầu thủ, HLV hoặc cổ động viên có vé) trong 1 trận Arsenal thắng Man City, Liverpool hoặc Chelsea.',prog:1,reward:{exp:350,vnd:500000}},
  ars_goal:{giver:'huyphan_epl',after:'ars_big',title:'Sút tung lưới cho Pháo Thủ',desc:'Ký hợp đồng cầu thủ Arsenal, ghi đủ 3 bàn cho Arsenal trong các trận đấu.',prog:3,reward:{exp:500,vnd:800000}},
  ars_coach:{giver:'huyphan_epl',after:'ars_goal',title:'Arteta mới của Emirates',desc:'Lấy Chứng chỉ HLV bóng đá, ngồi ghế HLV Arsenal và thắng 1 trận. Huy Phan tặng Áo Pháo Thủ Huyền Thoại (mùa Bất Bại 2003–04).',prog:1,cloth:'kit_ars_legend',reward:{exp:800,vnd:1500000}}});
Object.assign(ACH,{epl_goal10:{name:'Sát thủ vòng cấm',desc:'Ghi 10 bàn ở Giải Ngoại Hạng Anh',stat:'goals',n:10,exp:150},epl_goal50:{name:'Vua phá lưới',desc:'Ghi 50 bàn ở Giải Ngoại Hạng Anh',stat:'goals',n:50,exp:400},
  epl_apps30:{name:'Trụ cột đội bóng',desc:'Ra sân 30 trận',stat:'eplApps',n:30,exp:200},epl_fan20:{name:'Cổ động viên số 12',desc:'Đi xem 20 trận có vé',stat:'eplFan',n:20,exp:150},epl_champ:{name:'Nhà vô địch Ngoại Hạng Anh',desc:'Vô địch 1 mùa giải cùng CLB',stat:'eplChamp',n:1,exp:500}});
// Việc hôm nay ×2 (24/10): tiền + EXP mỗi việc và rương ngày (mở khi nhận đủ 3 việc; rương mốc điểm danh dùng chung) gấp đôi
for(const d of Object.values(DAYQ.pool)){ if(d.rw.vnd) d.rw.vnd*=2; if(d.rw.exp) d.rw.exp*=2; }
DAYQ.chest.vnd=DAYQ.chest.vnd.map(v=>v*2); DAYQ.chest.exp*=2;
/* ======================= Giá đồ theo sức mạnh (23/10): đồ càng mạnh càng đắt, tính theo tiền kiếm được =======================
   Sức mạnh của 1 món = % tăng của trung bình nhân (sát thương ra đòn × độ trâu: máu, thủ, giáp, hút máu, hồi máu) ở cấp MU 40, trung bình 4 class.
   Giá = 170.000đ × (% tăng)^1,25 (1% ≈ 6 phút cày; món mạnh 10% ≈ 3 triệu, 20% ≈ 7 triệu), làm tròn. Giày cộng giá trị tốc chạy, món tay trái cộng giá trị cơ chế riêng
   (sét Thor, khoá chiêu Howard, đánh đôi Musk, khát máu Kotex), set legacy cộng chiêu riêng. Thần thú / Xích Thố: giá mỗi bậc theo phần sức mạnh tăng thêm (Xích Thố ×1,5 vì phun lửa + dịch chuyển).
   Sách nội tại: giá 1 quyển = giá cả bộ đọc tới trần / số cấp. Ngọc quý vẫn giữ để lên bậc thần thú, Xích Thố. */
{ const W={vw_dagger_poison:3450000,vw_dagger_ice:3750000,vw_dagger_fire:5300000,vw_dagger_thunder:5900000,vw_dagger_void:8450000,vw_sword_poison:2500000,vw_sword_ice:2750000,vw_sword_fire:4200000,vw_sword_thunder:4750000,vw_sword_void:7100000,vw_bow_poison:2900000,vw_bow_ice:3150000,vw_bow_fire:4650000,vw_bow_thunder:5250000,vw_bow_void:7750000,vw_spear_poison:2900000,vw_spear_ice:3100000,vw_spear_fire:4650000,vw_spear_thunder:5250000,vw_spear_void:7600000,vw_axe_poison:3400000,vw_axe_ice:3600000,vw_axe_fire:5200000,vw_axe_thunder:5800000,vw_axe_void:8250000,vw_hammer_poison:2800000,vw_hammer_ice:3000000,vw_hammer_fire:4550000,vw_hammer_thunder:5100000,vw_hammer_void:7450000,vw_katana_poison:3900000,vw_katana_ice:4150000,vw_katana_fire:5800000,vw_katana_thunder:6450000,vw_katana_void:8950000,vw_scythe_poison:3350000,vw_scythe_ice:3600000,vw_scythe_fire:5200000,vw_scythe_thunder:5800000,vw_scythe_void:8150000,vw_staff_poison:3000000,vw_staff_ice:3250000,vw_staff_fire:4800000,vw_staff_thunder:5400000,vw_staff_void:7800000,vw_greatsword_poison:3950000,vw_greatsword_ice:4200000,vw_greatsword_fire:5900000,vw_greatsword_thunder:6500000,vw_greatsword_void:9050000}, AC={w_angel:1300000,w_pinkbat:850000,w_bat:1950000,w_fairy:960000,w_monarch:1800000,w_sky:2600000,w_demon:4400000,n_bead:130000,n_ruby:650000,n_amethyst:270000,n_gold:1000000,n_pharaoh:820000,n_star:1450000,c_fire:1400000,c_comet:790000,c_bolt:690000,c_cat:1500000,c_pad:1300000,c_tv:1100000,c_code:1250000,c_eye:2050000,c_walle:2000000,c_sonic:2950000,c_ghost:2500000,c_tank:2650000,c_crown:3700000,a_devotion:970000,a_endurance:2300000,a_brilliance:740000,a_command:2600000,a_unholy:5100000,a_vampiric:3100000,a_crit:1750000,sh_flip:400000,sh_heel:710000,sh_rain:330000,sh_blue:880000,sh_black:440000,sh_lolita:330000,sh_work:1000000,sh_timber:1150000,sh_fire:1300000,sh_pinkhi:1850000,sh_jordan:1600000,sh_runner:2750000,sh_rollor:2550000,sh_rollbl:1750000,sh_skate:5600000,kh_hachoang:4900000,kh_kotex:7350000,kh_thor:11100000,kh_inuyasha:4650000,kh_musk:10800000,kh_howard:10500000}, LG={lg_shovel:5900000,lg_boxer:14100000,lg_yoshi:10400000,lg_aang:5450000,lg_chainsaw:14900000,lg_sparta:10100000,lg_anubis:5750000,lg_samurai:9700000,lg_piccolo:12400000,lg_megax:6100000,lg_zero:8400000,lg_king:7300000,lg_vader:12400000,lg_16typh:4000000,lg_ranbien:7450000,lg_kth:3600000,lg_zeus:8050000,lg_kr0:11200000}, MY=[1350000, 2000000, 2300000, 2500000, 2900000, 3000000, 3200000, 3650000], BK={snt_cuongluc:460000,snt_thietbi:150000,snt_sinhluc:460000,snt_linhluc:150000,snt_hoiphuc:740000,snt_chimang:150000,snt_hutmau:400000}, XT=[5800000, 7050000, 8300000, 8800000, 10600000, 11100000, 11800000, 14100000, 14700000, 15500000, 17500000, 18200000, 19700000, 21900000];
  for(const [k,v] of Object.entries(W)) if(MU.weapons[k]) MU.weapons[k].price=v; for(const [k,v] of Object.entries(AC)) if(MU.acc[k]) MU.acc[k].price=v; for(const [k,v] of Object.entries(LG)) if(MU.legacy[k]) MU.legacy[k].price=v;
  HORSE.myth.forEach((m,i)=>{ if(MY[i]) m.price=MY[i]; }); for(const [k,v] of Object.entries(BK)) if(MU.pasBook[k]) MU.pasBook[k].price=v;
  const c0=XICHTHO.cost; XICHTHO.cost=lv=>({...c0(lv),vnd:XT[lv-2]||c0(lv).vnd}); }   /* cấp 2 → 15 */
/* ======================= MU mở rộng lên phía Bắc MU.OY ô: Đỉnh Bắc có 3 đấu trường boss (Căn cứ Siêu Nhân · Thung lũng Gió · Thế giới Thần Chết) ở y 0 → OY-1 =======================
   Toàn bộ MU cũ dời xuống OY ô. MU.preOY giữ toạ độ trước khi dời cho world7 / world8 / portal.js dựng map như cũ, dựng xong north.js dời cả khối và dựng Đỉnh Bắc.
   Cảnh D-Day (dday:<trận>) là cảnh riêng nên không dời. Vị trí MU đã lưu kiểu cũ: server dời khi vào game (p.muOY). */
{ const OY=MU.OY=30;
  MU.preOY=JSON.parse(JSON.stringify({west:MU.west,portals:MU.portals,ddayGate:MU.dday.gate}));
  const seen=new Set(), py=o=>{ if(o&&!seen.has(o)){ seen.add(o); o.y+=OY; } }, pr=a=>{ if(a&&!seen.has(a)){ seen.add(a); a.y0+=OY; a.y1+=OY; } };
  for(const o of [MU.spawn,MU.altar,MU.fountain,MU.nap,MU.dday.gate]) py(o); pr(MU.arena);
  for(const b of [...Object.values(MU.bosses),MU.boss]){ py(b.home); pr(b.area); }
  const Z=MU.zones; pr(Z.gateN); pr(Z.gateS); Z.split+=OY; py(Z.lake);
  for(const L of Object.values(MU.hidden)) for(const q of L) q[1]+=OY;
  for(const m of Object.values(MU.forest.mobs)){ pr(m.zone); m.packs=m.packs.map(([x,y])=>[x,y+OY]); }
  const Wt=MU.west; pr(Wt.road); Wt.open.y=Wt.open.y.map(v=>v+OY); pr(Wt.meme); for(const k of ['booth','inside','exit']) py(Wt.meme[k]);
  for(const z of Object.values(Wt.zones)){ pr(z); if(z.pipes){ py(z.pipes); z.pipes.sit=z.pipes.sit.map(([x,y])=>[x,y+OY]); } if(z.gates) z.gates=z.gates.map(([d,a,b])=>d==='e'||d==='w'?[d,a+OY,b+OY]:[d,a,b]); }
  for(const q of MU.portals) py(q);
  for(const n of NPCS) if(n.scene==='mu') n.y+=OY;
  LINHCAT.maps.mu.spots=LINHCAT.maps.mu.spots.map(([x,y,...r])=>[x,y+OY,...r]);
  if(PLACES.mu_quan) PLACES.mu_quan.y+=OY;
  MU.town+=OY; MU.H+=OY; SCENE_SIZE.mu=[MU.W,MU.H]; }
// Đỉnh Bắc (toạ độ đã là khung mới): lối lên ở tường trên quảng trường x 79–82, đại lộ y 24–27, 3 đấu trường có tường bao + cổng phía Nam
MU.north={open:{x:[79,82]},road:{y0:24,y1:27},
  arenas:{ranger:{name:'Căn cứ Siêu Nhân',x0:4,x1:50,y0:3,y1:21,gate:[25,29],tile:'+'},yasuo:{name:'Thung lũng Gió Ionia',x0:56,x1:104,y0:3,y1:21,gate:[79,82],tile:'*'},ryuk:{name:'Thế giới Thần Chết',x0:110,x1:155,y0:3,y1:21,gate:[130,134],tile:'='}}};
{ const NA=a=>({x0:a.x0+1,x1:a.x1-1,y0:a.y0+1,y1:a.y1-1}), AR=MU.north.arenas, RA=NA(AR.ranger), YA=NA(AR.yasuo), KA=NA(AR.ryuk);
  const ranger=(k,name,x,y,atk,o={})=>[k,{name,sprite:k,north:1,zoneName:AR.ranger.name,perma:o.perma||0,summon:o.summon?1:0,life:1800,leash:30,group:'ranger',hp:o.hp||2600,perPlayer:o.pp||1400,def:10,home:{x,y},area:RA,move:1.6,minor:o.major?0:1,shareExp:o.major?300:60,shareVnd:o.major?300000:50000,shareMu:o.major?200:40,phases:[.6,.3],enrage:{mul:1.3,speed:1.2},drops:o.drops||'sieunhan',attacks:atk,...(o.extra||{})}];
  Object.assign(MU.bosses,Object.fromEntries([
    ranger('r_do','Siêu Nhân Đỏ',27,8,[{k:'kiemdo',kind:'cone',name:'Kiếm Thần Long',every:4,warn:.6,range:3,cone:.7,hits:2,tick:.25,dmg:10},{k:'chemlua',kind:'line',name:'Chém Lửa',every:9,warn:.9,range:8,w:.9,dmg:14,phase:2}],{perma:300}),
    ranger('r_xanh','Siêu Nhân Xanh Dương',17,10,[{k:'giao',kind:'line',name:'Thương Sấm',every:5,warn:.7,range:7,w:.6,dmg:12},{k:'quetgiao',kind:'ring',name:'Quét Thương',every:10,warn:1,r:2.4,dmg:12}],{summon:1}),
    ranger('r_vang','Siêu Nhân Vàng',37,10,[{k:'daogam',kind:'multi',name:'Song Dao',every:5,warn:.6,n:3,r:1.1,dmg:9},{k:'nhayvang',kind:'jump',name:'Nhảy Bổ',every:9,warn:1,r:2,dmg:12}],{summon:1}),
    ranger('r_hong','Siêu Nhân Hồng',13,15,[{k:'cung',kind:'single',name:'Cung Thiên Nga',every:3,warn:.7,range:10,r:1,dmg:10,shot:1},{k:'muaten',kind:'rain',name:'Mưa Tên',every:11,warn:1.1,n:8,r:1.3,dmg:9}],{summon:1}),
    ranger('r_den','Siêu Nhân Đen',41,15,[{k:'riu',kind:'circle',name:'Rìu Voi Ma Mút',every:6,warn:1,r:2.2,dmg:15},{k:'dapdat',kind:'ring',name:'Dậm Đất',every:10,warn:1.2,r:3,dmg:12,fx:{slow:.6,dur:2}}],{summon:1}),
    ranger('r_xanhla','Siêu Nhân Xanh Lá',27,14,[{k:'daorong',kind:'single',name:'Dao Rồng',every:3,warn:.5,range:3,r:1.2,dmg:12},{k:'sao',kind:'ring',name:'Sáo Rồng Gọi Gió',every:9,warn:1,r:3,dmg:8,fx:{stun:1}}],{summon:1,hp:3000,pp:1600,drops:'sieunhan6'}),
    ranger('megazord','Megazord',27,10,[{k:'kiemlon',kind:'line',name:'Kiếm Thần Megazord',every:6,warn:1.2,range:12,w:1.6,dmg:28},{k:'dapmz',kind:'ring',name:'Dậm Chân Robot',every:9,warn:1.3,r:3.5,dmg:22,fx:{stun:1}},{k:'tenlua',kind:'rain',name:'Tên Lửa Vai',every:12,warn:1.2,n:12,r:1.4,dmg:14}],
      {summon:1,major:1,hp:9000,pp:4500,drops:'megazord',extra:{big:1,reach:2,def:16,move:1.1}}),
    ['ryuk',{name:'Thần Chết Ryuk',sprite:'ryuk',north:1,zoneName:AR.ryuk.name,perma:300,leash:30,focusDmg:.35,hp:7000,perPlayer:3600,def:12,home:{x:132,y:11},area:KA,big:1,move:1.8,phases:[.6,.3],enrage:{mul:1.3,speed:1.2},drops:'ryuk',
      dnote:{every:5,delay:2,pct:.5,focus:5},call:{hp:.5,k:'rem'},pair:'rem',focusX:10,
      attacks:[{k:'vuotryuk',kind:'single',name:'Vuốt Thần Chết',every:1.6,warn:.4,range:2.4,r:1.2,dmg:7,focus:1},{k:'muatao',kind:'rain',name:'Mưa Táo',every:10,warn:1.1,n:14,r:1.4,dmg:7,fx:{slow:.55,gw:.5,dur:4,dot:{pct:.02,dur:4,k:'tao'}}}]}],
    ['rem',{name:'Thần Chết Rem',sprite:'rem',north:1,zoneName:AR.ryuk.name,perma:0,summon:1,life:1800,leash:30,focusDmg:.35,hp:4500,perPlayer:2400,def:12,home:{x:126,y:11},area:KA,move:1.8,phases:[.6,.3],enrage:{mul:1.3,speed:1.2},drops:'rem',pair:'ryuk',focusX:10,
      attacks:[{k:'vuotrem',kind:'single',name:'Móng Xương',every:1.6,warn:.4,range:2.4,r:1.2,dmg:6,focus:1},{k:'xuong',kind:'line',name:'Giáo Xương',every:8,warn:.9,range:9,w:.7,dmg:12}]}],
    ['yasuo',{name:'Yasuo',sprite:'yasuo',north:1,zoneName:AR.yasuo.name,perma:300,leash:30,hp:6500,perPlayer:3400,def:12,home:{x:80,y:11},area:YA,move:2.2,crit:.35,phases:[.6,.3],enrage:{mul:1.3,speed:1.2},drops:'yasuo',call:{hp:.15,k:'yone'},trueWith:'yone',
      attacks:[{k:'luotyas',kind:'blink',name:'Quét Kiếm',every:2.4,warn:.35,r:1.1,dmg:8},{k:'chemyas',kind:'cone',name:'Bão Kiếm',every:3.2,warn:.45,range:2.8,cone:.6,hits:1,tick:.1,dmg:18,combo:{n:2,k:'locxoay'},fast:1},
        {k:'locxoay',kind:'line',name:'Lốc Xoáy',manual:1,warn:.5,range:10,w:1.1,dmg:16,fx:{stun:1.3}},{k:'tuonggio',kind:'buff',name:'Tường Gió',every:14,dur:3,dodge:1,windwall:1},
        {k:'tuyetkiem',kind:'ult',name:'Trăn Trối',hpBelow:.5,every:20,n:2,dur:2,hits:5,dmg:10,buff:{dur:6,armor:.45,resist:.45,fast:10,dmg:.5},noSpd:1}]}],
    ['yone',{name:'Yone',sprite:'yone',north:1,zoneName:AR.yasuo.name,perma:0,summon:1,life:1800,leash:30,hp:5000,perPlayer:2600,def:12,home:{x:88,y:11},area:YA,move:2,phases:[.6,.3],enrage:{mul:1.3,speed:1.2},drops:'yone',trueWith:'yone',
      attacks:[{k:'songchem',kind:'line',name:'Song Kiếm Truy Hồn',every:7,warn:.8,range:9,w:1,dmg:16,dash:1,dense:1,fx:{stun:1},then:{kind:'ring',r:4,dmg:14,warn:.35}},{k:'chemyone',kind:'cone',name:'Đoạt Hồn',every:3,warn:.5,range:3,cone:.7,hits:2,tick:.2,dmg:12},
        {k:'phanthan',kind:'clone',name:'Phân Thân',every:22,clone:'yone_bong',hpPct:.4,life:20}]}],
    ['yone_bong',{name:'Bóng Yone',sprite:'yone',north:1,zoneName:AR.yasuo.name,perma:0,summon:1,clone:1,minor:1,shareExp:20,shareVnd:10000,shareMu:10,leash:30,hp:2000,perPlayer:1000,def:8,home:{x:90,y:13},area:YA,move:2,phases:[.6,.3],enrage:{mul:1,speed:1},drops:'yone_bong',trueWith:'yone',tint:'#3a2a5a',
      attacks:[{k:'songchem',kind:'line',name:'Song Kiếm Truy Hồn',every:7,warn:.8,range:9,w:1,dmg:8,dash:1,dense:1,fx:{stun:1},then:{kind:'ring',r:4,dmg:7,warn:.35}},{k:'chemyone',kind:'cone',name:'Đoạt Hồn',every:3,warn:.5,range:3,cone:.7,hits:2,tick:.2,dmg:6}]}]]));
  MU.groups={ranger:{lead:'r_do',members:['r_xanh','r_vang','r_hong','r_den'],calls:[[.75,'r_xanhla'],[.5,'megazord']]}};   /* tổng máu cả nhóm còn 75% gọi Siêu Nhân Xanh Lá, còn 50% gọi Megazord */
  Object.assign(MU.reward,{sieunhan:{exp:30,vnd:30000,mu:25},sieunhan6:{exp:40,vnd:40000,mu:30},megazord:{exp:130,vnd:160000,mu:100,jewels:1},ryuk:{exp:140,vnd:180000,mu:110,jewels:1},
    rem:{exp:90,vnd:100000,mu:70},yasuo:{exp:140,vnd:180000,mu:110,jewels:1},yone:{exp:110,vnd:130000,mu:85},yone_bong:{exp:10,vnd:5000,mu:5}});   /* Luffy 200k là mốc cao nhất */
  MU.portals.push({id:'bac',north:1,name:'Đỉnh Bắc · lối lên 3 đấu trường boss mới',kind:'front',x:81,y:32,span:4,col:'#ffd84a',sign:'DINH BAC'},
    {id:'n_ranger',north:1,name:'Căn cứ Siêu Nhân · 5 anh em Siêu Nhân',kind:'pad',x:27,y:25.2,col:'#e8302a'},{id:'n_yasuo',north:1,name:'Thung lũng Gió · Yasuo',kind:'pad',x:93,y:25.2,col:'#7ab8f0'},{id:'n_ryuk',north:1,name:'Thế giới Thần Chết · Ryuk',kind:'pad',x:132,y:25.2,col:'#9a5ae8'}); }
/* ---------- Shopee Chande: shop online trong Chợ đồ cũ (nút C), mua ở đâu cũng được, freeship ----------
   Bán đồ Shop Chande + hàng độc quyền Shopee (ẩn ở Shop Chande, mua rồi thì hiện trong tủ đồ) + đồ phụ trợ. Flash Sale: mỗi 3 tiếng 4 món -30%, chọn theo khung giờ (máy khách và server tính giống nhau).
   Sau giá flash vẫn trừ tiếp ưu đãi DAS / Bearplus / Lumen / Everfit -20% và hảo sảng (perks.js). */
const SHOPEE={flashH:3,flashN:4,flashOff:.3,perPage:15,   /* 15 món / trang: 5 cột × 3 hàng (màn hẹp 3 × 5), trang chưa cuối luôn kín ô */
 
  tabs:[['hot','🔥 Nổi bật'],['full','🦸 Full set'],['pet','🐾 Thú cưng'],['top','👕 Áo'],['bottom','👖 Quần / váy'],['shoes','👟 Giày dép'],['head','🧢 Mũ'],['eyes','🕶 Kính'],['acc','💍 Phụ kiện'],['hairx','💇 Kiểu tóc'],['face','🙂 Khuôn mặt'],['aux','🧰 Phụ trợ'],['mine','🧺 Đã mua']],
  aux:{bong_cat5:{name:'Combo 5 Bóng Cát',item:'bong_cat',n:5,price:5*LINHCAT.shop.bong_cat,desc:'Ném bắt Lính Cát hoang'},
    bong_vang3:{name:'Combo 3 Bóng Cát Vàng',item:'bong_vang',n:3,price:3*LINHCAT.shop.bong_vang,desc:'Bắt dễ gấp '+LINHCAT.ball.bong_vang+' lần'},
    thuoc5:{name:'Combo 5 Thuốc hồi máu Lính Cát',item:'thuoc_cat',n:5,price:5*LINHCAT.shop.thuoc_cat,desc:'Mỗi lọ hồi '+LINHCAT.potion+' máu'},
    helmet:{name:'Mũ bảo hiểm',helmet:1,price:MOTO.helmet,icon:'sp_helmet',desc:'Lên xe máy tự đội, khỏi bị CSGT phạt lỗi mũ'},
    data_ngay:{name:'4G VNPT '+VNPT.packs.ngay.name,pack:'ngay',price:VNPT.packs.ngay.price,icon:'sp_4g',desc:'Pin hao chậm trong 1 ngày · cần SIM VNPT'},
    data_tuan:{name:'4G VNPT '+VNPT.packs.tuan.name,pack:'tuan',price:VNPT.packs.tuan.price,icon:'sp_4g',desc:'Pin hao chậm trong 7 ngày · cần SIM VNPT'},
    data_thang:{name:'4G VNPT '+VNPT.packs.thang.name,pack:'thang',price:VNPT.packs.thang.price,icon:'sp_4g',desc:'Pin hao chậm trong 30 ngày · cần SIM VNPT'}}};
for(const [k,name,slot,price,opts,colors] of [
  ['sp_tee_cam','Áo thun cam Shopee Chande','top',129000,{top:'tee',print:true},{top:'ee4d2d',print:'fff3e8',line:'b8331a'}],
  ['sp_tee_tim','Áo thun tím lavender','top',159000,{top:'tee'},{top:'c8b6e8'}],
  ['sp_tee_chu','Áo thun be in chữ','top',189000,{top:'tee',print:true},{top:'e9dcc4',print:'3a2f2a',line:'c4382e'}],
  ['sp_chambi','Áo chấm bi đen trắng','top',219000,{top:'tee',polka:true},{top:'1e1c22',print:'f2f0ea'}],
  ['sp_soc_navy','Áo sọc dọc navy','top',239000,{top:'tee',vstripe:true},{top:'f2f4f8',print:'1f3a6b'}],
  ['sp_somi_baby','Sơ mi xanh baby','top',279000,{top:'long'},{top:'b9d3ee'}],
  ['sp_len_mint','Áo len cổ lọ xanh mint','top',360000,{top:'long',turtle:true},{top:'9fd6c2'}],
  ['sp_cardigan_kem','Cardigan kem + cổ lọ nâu','top',450000,{top:'cardigan',turtle:true},{top:'e8dcc2',inner:'6b4a3a'}],
  ['sp_khoac_reu','Khoác kaki xanh rêu','top',590000,{top:'jacket'},{top:'6b7350',inner:'f1f1ee'}],
  ['sp_khoac_biker','Khoác da biker đen','top',890000,{top:'jacket'},{top:'1c1b20',inner:'8e2b2c'}],
  ['sp_jogger','Quần jogger đen','bottom',290000,{bottom:'pants'},{pants:'2a2a30'}],
  ['sp_jean_den','Jean đen rách gối','bottom',480000,{bottom:'pants',rips:true},{pants:'2b2c33'}],
  ['sp_short_jean','Quần short jean','bottom',220000,{bottom:'shorts'},{pants:'6d90bb'}],
  ['sp_vay_hong','Chân váy hồng pastel','bottom',320000,{bottom:'skirt'},{pants:'f2b8c6'}],
  ['sp_vay_kem','Chân váy kem','bottom',320000,{bottom:'skirt'},{pants:'e8dcc2'}],
  ['sp_sneaker_cam','Sneaker cam','shoes',590000,null,{shoes:'ee4d2d'}],
  ['sp_sneaker_navy','Sneaker xanh navy','shoes',590000,null,{shoes:'2b3f6b'}],
  ['sp_boot_nau','Boot da nâu','shoes',990000,null,{shoes:'6b4a32'}],
  ['sp_dep_lao','Dép lào xanh','shoes',49000,null,{shoes:'3a78c8'}],
  ['sp_mu_cam','Mũ lưỡi trai cam Shopee','head',99000,{hair:'cap',capPattern:true},{cap:'ee4d2d'}],
  ['sp_mu_den','Mũ lưỡi trai đen','head',119000,{hair:'cap'},{cap:'1e1d22'}],
  ['sp_mu_reu','Mũ lưỡi trai xanh rêu','head',119000,{hair:'cap'},{cap:'5a7d4a'}],
  ['sp_kinh_mau','Kính tròng màu','eyes',290000,{glasses:'tint'},null],
  ['sp_kinh_cam','Kính tròng cam','eyes',320000,{glasses:'tint',lensO:true},null],
  ['sp_day_hong','Dây chuyền vàng hồng','neck',2200000,{chain:true},{gold:'e8a08a'}],
  ['sp_dongho_trang','Đồng hồ dây trắng','wrist',1200000,{watch:true},{watch:'f0eee8'}],
  ['sp_vong_bac','Vòng tay bạc','wrist',900000,{bracelet:true},{gold:'c0c6ce'}]])
  CLOTHES[k]={name,slot,price,hidden:true,shopee:true,...(opts?{opts}:{}),...(colors?{colors}:{})};
/* ---------- Shopee mở rộng (24/10): áo, quần / váy, giày dép, mũ, kính, khăn, kiểu tóc, khuôn mặt — vẽ bằng đồ phủ wear.js (opts hat / gl / scarf / pat / pat2 / shoe / hx / fc) ---------- */
SLOTS.push(['hairx','Kiểu tóc'],['face','Khuôn mặt']);
{ const add=(k,name,slot,price,opts,colors)=>{ CLOTHES[k]={name,slot,price,hidden:true,shopee:true,opts:opts||{},colors:colors||{}}; };
  /* 30 áo: [id, tên, giá, dáng, hoạ tiết, màu áo, màu phụ, màu phụ 2, thêm opts] */
  for(const [k,n,p,top,pat,c,a,a2,x] of [
    ['soc_ngang','Áo thun sọc ngang navy',160000,'tee','hs','f4f4f2','1f3a6b'],['soc_do','Áo thun sọc đỏ đen',160000,'tee','hs','2b282e','c4382e'],
    ['block','Áo thun phối 2 màu',180000,'tee','block','2a62c8','f2c43d'],['raglan','Áo raglan tay đen',180000,'tee','rag','f1f1ee','2b282e'],
    ['baseball','Áo baseball số 10',220000,'tee','rag+jersey','f1f1ee','c4382e'],['jersey','Áo bóng đá số 10',250000,'tee','jersey+collar','2a62c8','f4f1ea'],
    ['caro','Sơ mi caro đỏ đen',280000,'long','check','c4382e','1c1820'],['camo','Áo rằn ri',260000,'tee','camo','5a6a3a','3a4a2a','8a7a4a'],
    ['tiedye','Áo loang tie-dye',230000,'tee','tiedye','f2a6b8','7fd0ff','ffe27a'],['tim','Áo thun in tim',170000,'tee','heart','f1f1ee','e8304a'],
    ['sao','Áo thun ngôi sao',170000,'tee','star','2b282e','ffd84a'],['tui','Áo thun túi ngực',170000,'tee','pocket','7a9a6a','5a7a4a'],
    ['ringer','Áo cổ viền ringer',170000,'tee','collar','f4f1ea','c4382e'],['hoodie_xam','Hoodie xám',380000,'long','hood+pocket','8a8e96','6a6e76'],
    ['hoodie_den','Hoodie đen',380000,'long','hood','2a2a30','4a4a52'],['hoodie_hong','Hoodie hồng pastel',380000,'long','hood','f2b8c6','e898ae'],
    ['the_thao','Áo khoác thể thao kéo khoá',420000,'long','zip+rag','2a62c8','f4f1ea','c8ccd4'],['bomber','Áo bomber xanh rêu',650000,'jacket','collar','4a5a3a','2b282e',null,{inner:'f2802a'}],
    ['varsity','Áo varsity đỏ đô',700000,'jacket','rag','7a1a2a','f4f1ea',null,{inner:'f4f1ea'}],['gile','Áo len gile caro',450000,'cardigan','check','8a6a4a','6a4a2a',null,{inner:'f1f1ee'}],
    ['polo_soc','Áo polo sọc xanh',230000,'tee','hs','f4f1ea','2a8a6a',null,{polo:true}],['breton','Áo dài tay sọc Breton',260000,'long','hs','f1f1ee','2b282e'],
    ['lumen','Áo thun Lumen Studio',200000,'tee','lumen','fff3d6'],['lumen_den','Áo thun Lumen Studio (đen)',200000,'tee','lumen','1c1a20'],
    ['das','Áo thun DAS',200000,'tee','das','1c1516'],['das_trang','Áo thun DAS (trắng)',200000,'tee','das','f4f2ec'],
    ['hoodie_lumen','Hoodie Lumen Studio',420000,'long','hood+lumen','2b5e4e'],['hoodie_das','Hoodie DAS',420000,'long','hood+das','1c1516'],
    ['phoi_tang','Áo phối 2 tầng xanh',190000,'tee','low','7fd0ff','2a62c8'],['ke_doc','Sơ mi kẻ sọc dọc xanh',290000,'long','','f4f6fa',null,null,{vstripe:true,print:'2a62c8'}]])
    add('sp_a_'+k,n,'top',p,{top,...(pat?{pat}:{}),...(x&&x.polo?{polo:true}:{}),...(x&&x.vstripe?{vstripe:true}:{})},{top:c,...(a?{acc:a}:{}),...(a2?{acc2:a2}:{}),...(x&&x.inner?{inner:x.inner}:{}),...(x&&x.print?{print:x.print}:{})});
  /* 30 quần / váy: [id, tên, giá, dáng, hoạ tiết, màu, màu phụ, rách / da] */
  for(const [k,n,p,b,pat,c,a,m] of [
    ['track_den','Quần thể thao đen sọc trắng',260000,'pants','side','1c1820','f4f1ea'],['track_navy','Quần thể thao navy sọc đỏ',260000,'pants','side','1f3a6b','c4382e'],
    ['cargo_be','Quần túi hộp be',320000,'pants','cargo','b8a07a','8a7a5a'],['cargo_reu','Quần túi hộp xanh rêu',320000,'pants','cargo','5a6a3a','3a4a2a'],
    ['caro','Quần caro xám',300000,'pants','check','6a6a7a','3a3a48'],['jean_bac','Jean bạc gối',400000,'pants','wash','4d6a8a','8aa8c8'],
    ['jean_xan','Jean xắn gấu',380000,'pants','cuff','4d6a8a','7a98b8'],['jean_trang','Jean trắng',380000,'pants','','e8e6e0'],
    ['kaki_den','Kaki đen xắn gấu',300000,'pants','cuff','2a2a30','4a4a52'],['tay_xam','Quần tây xám',350000,'pants','','6b6e76'],
    ['do_do','Quần đỏ đô',300000,'pants','','7a1a2a'],['mu_tat','Quần vàng mù tạt',300000,'pants','','c8a032'],
    ['ong_rong','Quần ống rộng kem',330000,'pants','cuff','e8dcc2','d4c4a2'],['jogger_xam','Jogger xám sọc đen',260000,'pants','side','8a8e96','2b282e'],
    ['da_nau','Quần da nâu',650000,'pants','','6b4a32',null,'leather'],['short_tt','Short thể thao sọc',170000,'shorts','side','2a62c8','f4f1ea'],
    ['short_kaki','Short kaki be',160000,'shorts','','c2a77d'],['short_caro','Short caro xanh',180000,'shorts','check','5a7d4a','3a5a2a'],
    ['short_rach','Short đen rách',190000,'shorts','','2b282e',null,'rips'],['short_tui','Short túi hộp',190000,'shorts','cargo','6a6a5a','4a4a3a'],
    ['short_trang','Short trắng',160000,'shorts','','f1f1ee'],['v_xep_ly','Chân váy xếp ly navy',280000,'skirt','pleat','1f3a6b'],
    ['v_caro_do','Chân váy caro đỏ',300000,'skirt','check','c4382e','7a1a2a'],['v_caro_xam','Chân váy caro xám đồng phục',300000,'skirt','check','6a6e7a','3a3e4a'],
    ['v_jean','Chân váy jean',280000,'skirt','','6d90bb'],['v_da','Chân váy da đen',450000,'skirt','','1c1820',null,'leather'],
    ['v_trang','Chân váy trắng',260000,'skirt','','f4f1ea'],['v_vang','Chân váy vàng',260000,'skirt','','f2c43d'],
    ['v_mint','Chân váy xanh mint',260000,'skirt','','9fd6c2'],['v_tim','Chân váy tím xếp ly',280000,'skirt','pleat','8a6ac8']])
    add('sp_q_'+k,n,'bottom',p,{bottom:b,...(pat?{pat2:pat}:{}),...(m?{[m]:true}:{})},{pants:c,...(a?{pacc:a}:{})});
  /* 30 giày dép: [id, tên, giá, màu, kiểu, màu phụ] */
  for(const [k,n,p,c,s,a] of [
    ['den_de_trang','Sneaker đen đế trắng',450000,'2a2a30','sole','f4f1ea'],['do_de_trang','Sneaker đỏ đế trắng',450000,'c4382e','sole','f4f1ea'],
    ['xanh_de_trang','Sneaker xanh dương đế trắng',450000,'2a62c8','sole','f4f1ea'],['hong_de_trang','Sneaker hồng đế trắng',450000,'f2a6b8','sole','f4f1ea'],
    ['vang_soc','Sneaker vàng sọc đen',480000,'f2c43d','stripe','2b282e'],['trang_3soc','Sneaker trắng 3 sọc',480000,'f4f1ea','stripe','2b282e'],
    ['den_3soc','Sneaker đen 3 sọc trắng',480000,'2b282e','stripe','f4f1ea'],['day_nau','Giày buộc dây nâu',420000,'8a5a32','lace','e8dcc2'],
    ['vai_xanh','Giày vải xanh buộc dây',300000,'3a5a8a','lace','f4f1ea'],['high_do','Giày cổ cao đỏ',520000,'c4382e','high','f4f1ea'],
    ['high_den','Giày cổ cao đen',520000,'2b282e','high','f4f1ea'],['high_trang','Giày cổ cao trắng',520000,'f1f1ee','high','c8ccd4'],
    ['boot_den','Boot đen',750000,'1c1820','boot','3a3a40'],['boot_bo','Boot da bò nâu',800000,'7a4a2a','boot','5a3a1e'],
    ['boot_vang','Boot vàng đi rừng',780000,'c8902a','boot','8a5a1a'],['boot_do','Boot đỏ',780000,'8a1a22','boot','5a1016'],
    ['sandal_nau','Sandal nâu',220000,'8a5a32','sandal','6a4222'],['sandal_den','Sandal đen',220000,'2b282e','sandal','1c1820'],
    ['sandal_hong','Sandal hồng',220000,'f2a6b8','sandal','c87a8a'],['xo_ngon','Dép xỏ ngón xanh',90000,'3a78c8','sandal','2a5898'],
    ['mui_trang','Giày đen mũi trắng',480000,'2b282e','toe','f4f1ea'],['oxford','Giày oxford nâu',650000,'6b4a32','toe','8a6a4a'],
    ['loafer','Giày lười đen đế nâu',600000,'1c1820','sole','6b4a32'],['cam_de_den','Giày thể thao cam đế đen',450000,'ee4d2d','sole','2b282e'],
    ['xanh_la','Sneaker xanh lá đế trắng',450000,'4aa84a','sole','f4f1ea'],['tim_day','Giày tím buộc dây trắng',420000,'8a6ac8','lace','f4f1ea'],
    ['bac','Sneaker bạc sọc xám',520000,'c8ccd4','stripe','6a6e76'],['gold','Sneaker vàng gold',700000,'e8b83a','sole','8a6a1a'],
    ['ung_mua','Ủng đi mưa vàng',260000,'f2d23a','boot','c8a020'],['bup_be','Giày búp bê hồng',380000,'f2b8c6','toe','f4f1ea']])
    add('sp_g_'+k,n,'shoes',p,{shoe:s},{shoes:c,sacc:a});
  /* 50 mũ: [kiểu, tên, giá, màu, màu phụ] */
  const HT=[['beanie','Mũ len đỏ',150000,'c4382e'],['beanie','Mũ len xám',150000,'8a8e96'],['beanie_pom','Mũ len quả bông xanh',180000,'2a62c8','f4f1ea'],['beanie_pom','Mũ len quả bông hồng',180000,'f2a6b8','f4f1ea'],
    ['bucket','Mũ bucket be',160000,'c2a77d'],['bucket','Mũ bucket đen',160000,'2b282e'],['bucket','Mũ bucket xanh rêu',160000,'5a6a3a'],['fedora','Mũ phớt nâu',280000,'6b4a32','2b282e'],['fedora','Mũ phớt đen',280000,'1c1820','c4382e'],
    ['cowboy','Mũ cao bồi nâu',300000,'8a5a32','3a2418'],['cowboy','Mũ cao bồi đen',300000,'1c1820','c8a24a'],['tophat','Mũ chóp cao đen',350000,'1c1820','c4382e'],['tophat','Mũ chóp cao tím',350000,'5a3a8a','f2c43d'],
    ['straw','Mũ rơm băng đỏ',150000,'e8c070','c4382e'],['straw','Mũ rơm băng xanh',150000,'e8c070','2a62c8'],['nonla','Nón lá Việt Nam',90000,'e8d090'],['beret','Mũ nồi đỏ',200000,'c4382e'],['beret','Mũ nồi đen',200000,'1c1820'],
    ['helmet','Mũ bảo hiểm thời trang trắng',250000,'f4f1ea','c4382e'],['helmet','Mũ bảo hiểm thời trang đen',250000,'2b282e','f2c43d'],['hardhat','Mũ công trường vàng',160000,'f2c43d'],['crown','Vương miện vàng',1500000,'c4382e'],
    ['tiara','Vương miện công chúa',800000,'7fd0ff'],['headband','Băng đô đỏ',90000,'c4382e'],['headband','Băng đô trắng',90000,'f4f1ea'],['bandana','Khăn bandana đỏ',120000,'c4382e','f4f1ea'],['bandana','Khăn bandana xanh',120000,'2a62c8','f4f1ea'],
    ['chef','Mũ đầu bếp',200000,'f4f1ea'],['santa','Mũ ông già Noel',150000,'c4382e'],['catear','Tai mèo đen',160000,'1c1820','f2a6b8'],['catear','Tai mèo hồng',160000,'f2b8c6','ffffff'],
    ['bunny','Tai thỏ trắng',170000,'f4f1ea','f2a6b8'],['bunny','Tai thỏ hồng',170000,'f2a6b8','ffffff'],['halo','Vòng hào quang thiên thần',400000,'ffd84a'],['horns','Sừng ác quỷ đỏ',220000,'c4382e'],
    ['grad','Mũ tốt nghiệp',250000,'1c1820','f2c43d'],['viking','Mũ Viking',450000,'8a8e96','c8a24a'],['sombrero','Mũ Sombrero Mexico',350000,'e8c070','c4382e'],['snap','Mũ snapback đen',180000,'1c1820','c4382e'],
    ['snap','Mũ snapback đỏ',180000,'c4382e','f4f1ea'],['snap','Mũ snapback xanh',180000,'2a62c8','f4f1ea'],['visor','Mũ nửa đầu trắng',120000,'f4f1ea'],['visor','Mũ nửa đầu hồng',120000,'f2a6b8'],
    ['pirate','Mũ hải tặc',300000,'1c1820'],['turban','Khăn turban trắng',220000,'f4f1ea','c4382e'],['turban','Khăn turban tím',220000,'6a3a8a','f2c43d'],['earmuff','Bịt tai lông hồng',160000,'f2b8c6','8a5a6a'],
    ['flower','Vòng hoa cài tóc',180000,'f2a6b8','ffd84a'],['police','Mũ cảnh sát',300000,'1f2a4a','1c1820'],['bucket','Mũ bucket xanh mint',160000,'9fd6c2']];
  HT.forEach(([h,n,p,c,a],i)=>add('sp_m_'+String(i+1).padStart(2,'0'),n,'head',p,{hat:h},{hat:c,...(a?{hat2:a}:{})}));
  /* 30 kính: 15 kiểu × 2 màu [kiểu, tên, giá, gọng, tròng, tròng trong] */
  const GLS=[['round','Kính tròn',220000],['square','Kính vuông',220000],['cat','Kính mắt mèo',260000],['avi','Kính phi công',320000],['heart','Kính trái tim',200000],['star','Kính ngôi sao',200000],
    ['visor','Kính chắn liền',300000],['mono','Kính một mắt quý tộc',350000],['3d','Kính 3D',150000],['goggle','Kính bơi / trượt tuyết',280000],['rimless','Kính không gọng',300000],['half','Kính nửa gọng',260000],
    ['clear','Kính tròn trong suốt',220000],['nerd','Kính mọt sách dán băng',180000],['oval','Kính oval mảnh',240000]];
  const GCOL=[['đen','1c1820','2a3442'],['màu','c4382e','e87a2a']];
  GLS.forEach(([s,n,p],i)=>GCOL.forEach(([cn,fr,ln],j)=>add(`sp_k_${s}_${j}`,`${n} ${s==='3d'?(j?'đỏ':'trắng'):cn==='màu'?({heart:'hồng',star:'vàng',visor:'cam',goggle:'xanh'}[s]||'đỏ'):'đen'}`,'eyes',p,{gl:s},{frame:s==='3d'&&!j?'f4f1ea':fr,lens:s==='heart'&&j?'e8304a':s==='star'&&j?'f2c43d':s==='goggle'&&j?'3a78c8':ln})));
  /* khăn, nơ, cà vạt, chuỗi ngọc (ô Cổ) */
  for(const [k,n,p,s,c,a] of [['quang_do','Khăn quàng đỏ',180000,'wrap','c4382e'],['quang_xam','Khăn quàng len xám',200000,'knit','8a8e96'],['quang_soc','Khăn quàng sọc đỏ trắng',220000,'stripe','c4382e','f4f1ea'],
    ['quang_caro','Khăn quàng caro be',280000,'check','c2a77d','7a1a2a'],['quang_dai','Khăn len dài xanh',240000,'long','2a62c8','f4f1ea'],['quang_nau','Khăn len nâu đan',220000,'knit','8a5a32'],
    ['bandana_co','Khăn bandana cổ đỏ',120000,'bandana','c4382e'],['no_den','Nơ cổ đen',150000,'bow','1c1820','3a3a40'],['no_do','Nơ cổ đỏ',150000,'bow','c4382e','8a1a22'],
    ['cavat_do','Cà vạt đỏ',200000,'tie','c4382e','f2c43d'],['cavat_xanh','Cà vạt xanh navy',200000,'tie','1f3a6b','c8ccd4'],['ngoc_trai','Chuỗi ngọc trai',900000,'pearl','f4f1ea']])
    add('sp_c_'+k,n,'neck',p,{scarf:s},{scarf:c,...(a?{scarf2:a}:{})});
  /* kiểu tóc (màu theo tóc của bạn) */
  for(const [k,n,p,base] of [['spiky','Tóc dựng anime',300000],['mohawk','Tóc mohican',280000,'buzz'],['twin','Tóc buộc 2 bên',260000],['odango','Tóc búi 2 củ tỏi',260000],
    ['mullet','Tóc mullet',250000],['curly','Tóc xoăn bồng',280000],['wavy','Tóc dài gợn sóng',320000],['pomp','Tóc pompadour',300000],['bun','Tóc búi củ hành',220000],
    ['dread','Tóc tết dreadlock',350000],['emo','Tóc emo che mắt',240000],['hime','Tóc mái bằng công chúa',300000],['braid','Tóc tết đuôi sam',260000],['side','Tóc mái lệch',200000]])
    add('sp_t_'+k,n,'hairx',p,{hx:k,...(base?{hair:base}:{})});
  /* khuôn mặt */
  for(const [k,n,p,c,c2] of [['blush','Má hồng',80000,'f08a96'],['freckle','Tàn nhang',60000],['beard','Râu quai nón',150000],['goatee','Râu dê',120000],['stache','Ria mép',100000],['stubble','Râu lún phún',90000],
    ['scar','Vết sẹo ngầu',100000,'a83a3a'],['paint','Vẽ mặt cổ động',90000,null,'3a78c8'],['mole','Nốt ruồi duyên',50000],['bandaid','Băng cá nhân',50000],['whisker','Ria mèo',70000],
    ['tear','Hình xăm giọt lệ',120000,null,'2a62c8'],['lip','Son môi đỏ',90000,'d8283a'],['bigeye','Mắt to long lanh',180000],['sleepy','Mắt lim dim',120000],['wink','Nháy mắt',120000],['hearteye','Mắt trái tim',160000]])
    add('sp_f_'+k,n,'face',p,{fc:k},{...(c?{fc:c}:{}),...(c2?{fc2:c2}:{})}); }
/* 57 full set nhân vật (sets.js vẽ, tab Full set): [id, tên, giá, màu áo, quần, giày] — màu nền dưới lớp vẽ set */
for(const [k,n,p,t,pa,sh] of [['goku','Set Goku (Dragon Ball)',2200000,'f2802a','f2802a','2e62c8'],['vegeta','Set Vegeta giáp Saiyan',2400000,'2e62c8','2e62c8','f4f2ec'],['naruto','Set Naruto ninja làng Lá',2000000,'f2802a','f2802a','18203f'],
  ['sasuke','Set Sasuke',2000000,'f4f2ec','18203f','18203f'],['kakashi','Set Kakashi thầy ninja',2100000,'6e743c','18203f','18203f'],['luffy','Set Luffy mũ rơm',2000000,'d62830','2e62c8','f0c4a0'],
  ['zoro','Set Zoro tam kiếm',2100000,'f4f2ec','1e1a20','1e1a20'],['sailormoon','Set Thuỷ thủ Mặt Trăng',2200000,'f4f2ec','2e62c8','d62830'],['conan','Set Thám tử Conan',1800000,'2e62c8','969aa2','3c2a20'],
  ['ash','Set Nhà huấn luyện Pokémon',1800000,'2e62c8','4a6896','1e1a20'],['pikachu','Bộ đồ Pikachu',1900000,'f8ce30','f8ce30','f8ce30'],['totoro','Bộ đồ Totoro',1900000,'969aa2','969aa2','565862'],
  ['doraemon','Bộ đồ Doraemon',2000000,'2e62c8','2e62c8','f4f2ec'],['saitama','Set Saitama anh hùng 1 đấm',2000000,'f8ce30','f8ce30','d62830'],['tanjiro','Set Kiếm sĩ Tanjiro',2300000,'1e1a20','1e1a20','f4f2ec'],
  ['nezuko','Set Nezuko',2300000,'f896be','f896be','f4f2ec'],['gojo','Set Thầy Gojo',2500000,'18203f','18203f','1e1a20'],['levi','Set Trinh sát binh Levi',2400000,'825430','f4f2ec','54341e'],
  ['ichigo','Set Thần chết Ichigo',2300000,'1e1a20','1e1a20','f4f2ec'],['L','Set Thám tử L',1600000,'f4f2ec','4a6896','f0c4a0'],['edward','Set Giả kim thuật sư Edward',2300000,'d62830','1e1a20','1e1a20'],
  ['kirito','Set Kiếm sĩ áo đen Kirito',2400000,'1e1a20','1e1a20','121016'],['gon','Set Thợ săn Gon',1900000,'3ca046','3ca046','f2802a'],['mickey','Bộ đồ Chuột Mickey',1900000,'1e1a20','d62830','f8ce30'],
  ['mario','Set Thợ sửa ống nước Mario',2000000,'d62830','2e62c8','825430'],['luigi','Set Luigi',2000000,'3ca046','1c3882','825430'],['spongebob','Set Bọt Biển vui vẻ',1800000,'f8ce30','825430','1e1a20'],
  ['patrick','Set Sao Biển hồng',1600000,'f896be','96d63c','f896be'],['shin','Set Cậu bé bút chì',1500000,'d62830','f8ce30','f4f2ec'],['elsa','Set Nữ hoàng băng giá',2600000,'bee2fa','bee2fa','bee2fa'],
  ['snowwhite','Set Bạch Tuyết',2400000,'1c3882','f8ce30','f8ce30'],['buzz','Set Phi hành gia Buzz',2500000,'f4f2ec','f4f2ec','3ca046'],['woody','Set Cao bồi Woody',2300000,'f8ce30','4a6896','825430'],
  ['shrek','Set Chằn tinh xanh Shrek',2200000,'f2e2be','825430','54341e'],['minion','Bộ đồ Minion',1900000,'f8ce30','2e62c8','1e1a20'],['kitty','Bộ đồ Mèo Kitty',1900000,'f896be','f896be','f4f2ec'],
  ['pooh','Bộ đồ Gấu Pooh',1900000,'d62830','e8b83a','e8b83a'],['spider','Set Người Nhện',2800000,'d62830','2e62c8','d62830'],['ironman','Giáp Người Sắt',3500000,'d62830','d62830','e8b83a'],
  ['captain','Set Đội trưởng Mỹ',2800000,'2e62c8','2e62c8','d62830'],['hulk','Set Người khổng lồ xanh',2600000,'5aaa3c','783caa','5aaa3c'],['thor','Set Thần Sấm',3000000,'565862','1e1a20','565862'],
  ['harry','Set Phù thuỷ Harry',2500000,'1e1a20','1e1a20','1e1a20'],['vader','Set Chúa tể bóng tối',3200000,'1e1a20','1e1a20','1e1a20'],['trooper','Giáp lính áo trắng',2600000,'f4f2ec','f4f2ec','f4f2ec'],
  ['sparrow','Set Thuyền trưởng Jack',2600000,'f4f2ec','54341e','1e1a20'],['joker','Set Gã hề Joker',2600000,'783caa','783caa','825430'],['wonder','Set Nữ chiến binh',2800000,'d62830','2e62c8','d62830'],
  ['neo','Set Neo Ma trận',2400000,'1e1a20','1e1a20','1e1a20'],['chaplin','Set Vua hề Chaplin',1800000,'1e1a20','565862','1e1a20'],['456','Set Người chơi 456',1700000,'289696','289696','f4f2ec'],
  ['guard','Set Lính hồng trò chơi',1900000,'ec3c8c','ec3c8c','1e1a20'],['heist','Set Phi vụ triệu đô',2000000,'d62830','d62830','1e1a20'],['deadpool','Set Lính đánh thuê mồm to',2800000,'d62830','d62830','1e1a20'],
  ['batgirl','Set Nữ hiệp dơi',2600000,'46226e','46226e','783caa'],['ninjaturtle','Set Ninja rùa',2200000,'96d63c','3ca046','3ca046'],['mulan','Set Nữ tướng Mộc Lan',2600000,'d62830','8c161e','1e1a20']])
  CLOTHES['fs_'+k]={name:n,slot:'top',price:p,hidden:true,shopee:true,full:1,set:'fs_'+k,opts:{top:'long',bottom:'pants'},colors:{top:t,pants:pa,shoes:sh}};
/* đồ của Đôn Chề (NPC Ké): mũ lưới, khẩu trang, điếu thuốc, sơ mi caro, quần, giày đỏ — mua đủ là mặc giống y Đôn Chề */
Object.assign(CLOTHES,{sp_dc_mu:{name:'Mũ lưỡi trai lưới (Đôn Chề)',slot:'head',price:180000,hidden:true,shopee:true,dc:1,opts:{hair:'cap',capPattern:true,capWeb:true},colors:{cap:'b49b78'}},
  sp_dc_somi:{name:'Sơ mi caro (Đôn Chề)',slot:'top',price:280000,hidden:true,shopee:true,dc:1,opts:{top:'long',plaid:true},colors:{top:'c8a77d',print:'b4473c',line:'554850'}},
  sp_dc_quan:{name:'Quần xanh đen (Đôn Chề)',slot:'bottom',price:300000,hidden:true,shopee:true,dc:1,opts:{bottom:'pants'},colors:{pants:'303846'}},
  sp_dc_giay:{name:'Giày đỏ (Đôn Chề)',slot:'shoes',price:450000,hidden:true,shopee:true,dc:1,colors:{shoes:'a5302b'}},
  sp_dc_khau:{name:'Khẩu trang xám (Đôn Chề)',slot:'face',price:60000,hidden:true,shopee:true,dc:1,opts:{mask:true},colors:{mask:'9ea1a7'}},
  sp_dc_thuoc:{name:'Khẩu trang + điếu thuốc (Đôn Chề)',slot:'face',price:90000,hidden:true,shopee:true,dc:1,opts:{mask:true,cigarette:true},colors:{mask:'9ea1a7'}}});
/* giá quần áo theo thu nhập (24/10): người mới kiếm ~0,5–0,8 triệu/giờ, người cày ~1,5 triệu/giờ (đo trên server sau reset).
   Đồ cơ bản ≈ 10 phút chơi, đồ đẹp ≈ 20–40 phút, đồ xịn ≈ 1 giờ, trang sức / set hot là đồ chơi sang ≈ 2–6 giờ. Áp cho Shop Chande và Shopee */
{ const PR={tee_trang:120000,tee_den:120000,tee_xanh:150000,tee_hong:150000,tee_do:150000,polo_vnpt:200000,somi_dai:250000,somi_hoa:300000,somi_caro:280000,khoac_jean:550000,cardigan:450000,vest:1200000,len_colo:350000,
    jean:380000,jean_rach:420000,kaki:280000,quan_da:700000,short_xam:150000,vay_do:300000,vay_den:300000,giay_trang:480000,giay_den:480000,giay_luoi:650000,dep_to_ong:40000,
    kinh_can:250000,kinh_ram:200000,mu_be:100000,mu_do:100000,day_vang:5000000,day_bac:900000,dong_ho:1500000,vong_vang:3000000,set_superman:1990000,set_batman:2490000,
    sp_tee_cam:99000,sp_tee_tim:130000,sp_tee_chu:180000,sp_chambi:200000,sp_soc_navy:200000,sp_somi_baby:250000,sp_len_mint:330000,sp_cardigan_kem:420000,sp_khoac_reu:550000,sp_khoac_biker:780000,
    sp_jogger:250000,sp_jean_den:400000,sp_short_jean:180000,sp_vay_hong:280000,sp_vay_kem:280000,sp_sneaker_cam:450000,sp_sneaker_navy:450000,sp_boot_nau:800000,sp_dep_lao:35000,
    sp_mu_cam:79000,sp_mu_den:100000,sp_mu_reu:100000,sp_kinh_mau:250000,sp_kinh_cam:280000,sp_day_hong:2000000,sp_dongho_trang:1200000,sp_vong_bac:700000};
  for(const [k,v] of Object.entries(PR)) if(CLOTHES[k]) CLOTHES[k].price=v; }
// Kenny Ho đi quay content: mỗi giờ (giờ thật) đứng ở Ké Retreat (khu trên) hoặc Bearplus Studio (góc họp), chọn theo khung giờ nên máy khách và server tính giống nhau
const KENNY={h:1,ke:{scene:'retreat',x:21.3,y:41.6},bp:{scene:'bearplus',x:24.6,y:15.6}};
const kennyWhere=(ms=Date.now())=>{ const slot=Math.floor(ms/(KENNY.h*3600e3)); let x=Math.imul(slot^(slot>>>16),0x45d9f3b); x=Math.imul(x^(x>>>16),0x45d9f3b); const bp=((x^(x>>>16))&1)===1; return {...(bp?KENNY.bp:KENNY.ke),end:(slot+1)*KENNY.h*3600e3}; };
/* thú cưng (Shopee tab Pet): đi theo chủ khắp map, mỗi loài ăn đúng 1 loại hạt (gói 10 bữa). Cho ăn no: +3% EXP trong 6 giờ, quá 6 giờ thì đói (hết buff),
   quá 24 giờ không ăn thì dỗi ở nhà không theo nữa, cho ăn lại là theo. Hình vẽ ở pets.js theo art (màu B thân / b bóng / W bụng / K mắt mũi, tai, đuôi, hoạ tiết) */
const PETCFG={full:6,leave:24,buff:1.03};
const PETFOOD={cho:{name:'Gói hạt cho chó',n:10,price:60000},meo:{name:'Gói hạt cho mèo',n:10,price:60000},nho:{name:'Gói hạt thú nhỏ (thỏ, chuột, sóc...)',n:10,price:50000},
  chim:{name:'Gói hạt cho chim',n:10,price:45000},dac:{name:'Gói thức ăn đặc biệt (gấu trúc, cáo, rùa...)',n:10,price:90000}};
for(const [k,f] of Object.entries(PETFOOD)){ ITEMS['petfood_'+k]={name:f.name,icon:'sp_food'}; SHOPEE.aux['food_'+k]={name:f.name,item:'petfood_'+k,n:f.n,price:f.price,icon:'sp_food',desc:`${f.n} bữa cho thú cưng`}; }
const PETS={
  corgi:{name:'Chó Corgi',price:1800000,food:'cho',art:{B:'e8823a',b:'c0602a',W:'f6f1ea',ear:'up',tail:'stub',short:1}},
  shiba:{name:'Chó Shiba Inu',price:1800000,food:'cho',art:{B:'e09a4a',b:'b8763a',W:'f6ecd8',ear:'up',tail:'curl'}},
  husky:{name:'Chó Husky',price:2200000,food:'cho',art:{B:'7a808c',b:'565c68',W:'f4f2ec',ear:'up',tail:'fluffy',pat:'mask2'}},
  poodle:{name:'Chó Poodle trắng',price:2000000,food:'cho',art:{B:'f4f1ea',b:'d8d2c6',W:'ffffff',ear:'flop',tail:'puff',pat:'curly'}},
  golden:{name:'Chó Golden',price:2000000,food:'cho',art:{B:'e8b04a',b:'c08a30',W:'f0cc78',ear:'flop',tail:'fluffy'}},
  dalmatian:{name:'Chó đốm Dalmatian',price:2000000,food:'cho',art:{B:'f4f1ea',b:'d8d2c6',W:'ffffff',K:'2a2a30',ear:'flop',tail:'long',pat:'spots'}},
  pug:{name:'Chó Pug',price:1600000,food:'cho',art:{B:'e8d0a0',b:'c8a878',W:'f0e0c0',ear:'small',tail:'curl',pat:'mask',snout:'short'}},
  chihuahua:{name:'Chó Chihuahua',price:1400000,food:'cho',art:{B:'d8a868',b:'b8884a',W:'f0dcb8',ear:'big',tail:'long',small:1}},
  samoyed:{name:'Chó Samoyed',price:2600000,food:'cho',art:{B:'fbfaf6',b:'e0dccf',W:'ffffff',ear:'up',tail:'fluffy',pat:'fluff'}},
  doberman:{name:'Chó Doberman',price:2400000,food:'cho',art:{B:'2a2228',b:'1a1418',W:'b8743a',ear:'up',tail:'stub',pat:'tan'}},
  muop:{name:'Mèo mướp',price:900000,food:'meo',art:{B:'b8a07a',b:'8a7454',W:'e8dcc2',ear:'cat',tail:'long',pat:'stripes',cat:1}},
  meoden:{name:'Mèo mun đen',price:1000000,food:'meo',art:{B:'2a2630',b:'1a1620',W:'3a3642',K:'f2c43d',ear:'cat',tail:'long',cat:1}},
  meotrang:{name:'Mèo trắng',price:1000000,food:'meo',art:{B:'f4f2ec',b:'dcd8cc',W:'ffffff',ear:'cat',tail:'long',cat:1}},
  tamthe:{name:'Mèo tam thể',price:1200000,food:'meo',art:{B:'f4f2ec',b:'dcd8cc',W:'ffffff',ear:'cat',tail:'long',pat:'calico',cat:1}},
  xiem:{name:'Mèo Xiêm',price:1500000,food:'meo',art:{B:'eedcbe',b:'d4bc98',W:'f8ecd8',ear:'cat',tail:'longdark',pat:'siamese',cat:1}},
  aln:{name:'Mèo Anh lông ngắn',price:1800000,food:'meo',art:{B:'8a90a0',b:'6a7080',W:'a8aebc',K:'e8a83a',ear:'round',tail:'long',cat:1}},
  meocam:{name:'Mèo cam',price:1000000,food:'meo',art:{B:'f0943a',b:'c8702a',W:'f8d8a8',ear:'cat',tail:'long',pat:'stripes',cat:1}},
  batu:{name:'Mèo Ba Tư',price:2200000,food:'meo',art:{B:'e8dccc',b:'c8bcaa',W:'f8f2ea',ear:'cat',tail:'fluffy',pat:'fluff',cat:1,snout:'short'}},
  thotrang:{name:'Thỏ trắng',price:700000,food:'nho',art:{B:'f6f4ee',b:'dcd8ce',W:'ffffff',K:'e8607a',ear:'rabbit',tail:'puff',small:1,hop:1}},
  thonau:{name:'Thỏ nâu',price:700000,food:'nho',art:{B:'a87a54',b:'86603e',W:'e8d8c0',ear:'rabbit',tail:'puff',small:1,hop:1}},
  hamster:{name:'Chuột hamster',price:400000,food:'nho',art:{kind:'hamster',B:'e8a85a',b:'c88a40',W:'f8f0e0'}},
  soc:{name:'Sóc nâu',price:800000,food:'nho',art:{B:'b8743a',b:'8a5428',W:'f0dcb8',ear:'round',tail:'squirrel',small:1,hop:1}},
  nhim:{name:'Nhím kiểng',price:900000,food:'nho',art:{kind:'hedgehog',B:'8a6a4a',b:'5a4430',W:'f0dcc0'}},
  chon:{name:'Chồn sương',price:1200000,food:'nho',art:{B:'e8dcc4',b:'c0b090',W:'f8f2e6',ear:'round',tail:'long',pat:'mask',long:1}},
  gautruc:{name:'Gấu trúc',price:5000000,food:'dac',art:{B:'f4f2ec',b:'d8d4ca',W:'ffffff',ear:'round',tail:'stub',pat:'panda',big:1}},
  cao:{name:'Cáo đỏ',price:2800000,food:'dac',art:{B:'e8702a',b:'c0501a',W:'f8f0e4',ear:'up',tail:'fox',pat:'socks'}},
  gaumeo:{name:'Gấu mèo',price:2500000,food:'dac',art:{B:'8a8e96',b:'6a6e76',W:'d8dce2',ear:'round',tail:'ring',pat:'raccoon'}},
  vet:{name:'Vẹt đuôi dài',price:1800000,food:'chim',art:{kind:'parrot',B:'3aa84a',b:'2a7a36',W:'e8402a',K:'f2c43d'}},
  canhcut:{name:'Chim cánh cụt',price:3000000,food:'dac',art:{kind:'penguin',B:'2a2630',b:'1a1620',W:'f4f2ec',K:'f29a2a'}},
  rua:{name:'Rùa cảnh',price:900000,food:'dac',art:{kind:'turtle',B:'5aa84a',b:'3a7a32',W:'c8b878',K:'2a3a22'}}};
const petState=(p,t=Date.now())=>{ const e=p&&p.pets&&p.pets[p.pet]; if(!e) return ''; const h=(t-(e.fed||0))/3600e3; return h<PETCFG.full?'full':h<PETCFG.leave?'hungry':'sulk'; };   /* pet đang theo: no / đói / dỗi */
// vay vốn nhà nước (bảng Vườn & chuồng): tiền lấy từ ngân khố = ví kaixa, để mua hạt giống, vật nuôi, thuê đất. Hạn mức 500K × cấp, tối đa 10 triệu, 1 khoản 1 lúc, lãi 1%/ngày
const STATE_LOAN={minLv:3,per:500000,max:10000000,amts:[500000,1000000,2000000,5000000,10000000],rate:.01,days:[3,7]};
STATE_LOAN.cap=lv=>Math.min(STATE_LOAN.max,STATE_LOAN.per*lv);
// đồ mang theo (Shopee tab Phụ trợ, server gear.js): sạc dự phòng 10 lượt / ngày, túi ngủ di động ngủ ở đâu cũng được, lương khô mỗi gói 4 bữa (ăn ở đâu cũng tính bữa chính)
const GEAR={pbank:{name:'Sạc dự phòng 20.000mAh',price:350000,per:10,charge:40,sec:4},bag:{name:'Túi ngủ di động',price:450000,rest:45,sec:10},luong:{name:'Lương khô (gói 4 bữa)',price:120000,n:4,exp:8,energy:10}};
ITEMS.luong_kho={name:'Lương khô (1 bữa)',icon:'sp_ration'};
Object.assign(SHOPEE.aux,{pbank:{name:GEAR.pbank.name,gear:'pbank',price:GEAR.pbank.price,icon:'sp_pbank',desc:`Mang theo sạc ở đâu cũng được: ${GEAR.pbank.per} lần / ngày, mỗi lần +${GEAR.pbank.charge}% pin`},
  sleepbag:{name:GEAR.bag.name,gear:'bag',price:GEAR.bag.price,icon:'sp_sleep',desc:`Lôi ra ngủ ở bất cứ đâu: +${GEAR.bag.rest} năng lượng mỗi giấc`},
  luong:{name:GEAR.luong.name,item:'luong_kho',n:GEAR.luong.n,price:GEAR.luong.price,icon:'sp_ration',desc:`Ăn ở đâu cũng tính là bữa chính, mỗi gói ${GEAR.luong.n} bữa`}});
// món bán trên Shopee: đồ Shop Chande (có giá, không ẩn) + hàng độc quyền; đồ phụ trợ có tiền tố aux:
SHOPEE.ids=()=>Object.keys(CLOTHES).filter(k=>CLOTHES[k].price>0&&(!CLOTHES[k].hidden||CLOTHES[k].shopee)).concat(Object.keys(SHOPEE.aux).map(k=>'aux:'+k));
SHOPEE.item=k=>String(k).startsWith('aux:')?SHOPEE.aux[String(k).slice(4)]:CLOTHES[k];
SHOPEE.flash=(ms=Date.now())=>{ const slot=Math.floor(ms/(SHOPEE.flashH*3600e3)), ids=SHOPEE.ids(), out=[]; let s=slot%2147483646+1;
  for(let i=0;i<60&&out.length<Math.min(SHOPEE.flashN,ids.length);i++){ s=s*16807%2147483647; const k=ids[s%ids.length]; if(!out.includes(k)) out.push(k); }
  return {ids:out,end:(slot+1)*SHOPEE.flashH*3600e3}; };
SHOPEE.base=(k,ms)=>{ const c=SHOPEE.item(k); if(!c) return 0; return SHOPEE.flash(ms).ids.includes(k)?Math.round(c.price*(1-SHOPEE.flashOff)/1000)*1000:c.price; };   /* giá sau flash sale, trước ưu đãi */
// thú cưng bán trên Shopee: tiền tố pet:
{ const ids0=SHOPEE.ids, item0=SHOPEE.item; SHOPEE.ids=()=>ids0().concat(Object.keys(PETS).map(k=>'pet:'+k)); SHOPEE.item=k=>String(k).startsWith('pet:')?PETS[String(k).slice(4)]:item0(k); }
/* giảm máu mọi boss 40% (24/10, chủ game yêu cầu), trừ Pepe: mọi boss MU (cả 5 anh em Siêu Nhân, Megazord, Đỉnh Bắc), MCK ở Ké, Megatron. Máu đổi dạng (hpMul) vẫn tính theo máu mới */
{ const K=.6; for(const [k,b] of Object.entries(MU.bosses)) if(k!=='pepe'){ b.hp=Math.round(b.hp*K); b.perPlayer=Math.round((b.perPlayer||0)*K); }
  MU.boss.hp=MU.bosses.luffy.hp; MU.boss.perPlayer=MU.bosses.luffy.perPlayer; MCK.hp=Math.round(MCK.hp*K); MCK.hpPer=Math.round(MCK.hpPer*K); MEGATRON.hp=Math.round(MEGATRON.hp*K); }
return {CLUB_DOORS,LC_ASC,lcAsc,lcLeadAsc,lcLeadBn,lcEff,LCCLUB,GEAR,LCFOREST,PETS,PETFOOD,PETCFG,petState,KENNY,kennyWhere,STATE_LOAN,SHOPEE,EPL,EPL_CLUBS,T,RULES,LOOK,SLOTS,CLOTHES,FOOD,CROPS,FARM,PLACES,INTERIORS,CLUB,ITEMS,SKILLS,QUESTS,DAILY,FISH,KAYAK_PRICE,KAYAK_MIN,CAR_PRICE,TREASURE,FISHING,NPCS,NPC_LOOKS,PICKUPS,SPOTS,COINS,FORAGE,
  KAYAK_SPOT,BUOYS,CARS,BEAGLE_SPOT,CHICKEN_HOME,LAKE_Y,SPAWN,SOCIAL,ROOMS,BATHHOUSE,POOL,ACH,KE_JOB,WHEELIE,BIKES,SONGS,DANCE,RECEPTION,NEEDS,ROOM_ACTS,PHOTO_SPOTS,TRAVEL,JOB,WORK_TASKS,OFFICE_PERKS,WORK_WORDS,INTERVIEW,INTERVIEW_PICK,INTERVIEW_PASS,OFFICE,
  lvSpeed,OPTIMUS,MEGATRON,MCK,WILDLIFE,FOLLOWERS,OII,SHISHA,NPC_ROAM,roamPos,PIG_STEAL,LUMEN,DIEP,YENLANG,PICKLE,PK_SETS,DALAT,DL_FARM,DL_LAND,KE_LAND,MOTO,BIKESHARE,CSGT,PCAR,PARK,MUSEUM,TEMPLE,NETCAFE,BUTTERFLY,LO,DOGS,DAS,KE_YARD,ANIMALS,FEED,INGREDIENTS,RECIPES,COOK,DL_FISH,HORSE,CRATES,RACE,SELL,DEST,GRAB,grabFare,COURSES,MARKET,ACTS,ACT_DUR,FL,SCENE_DEST,SCENE_SIZE,
  ECON,fineOf,HOME,homeTier,homeDefault,homeGrid,homeFoot,homeSolid,homeAnchor,homeFits,homeCozy,homeScore,homeBuff,HAOSANG,hsPts,hsTier,hsBonus,loanOwed,LEGEND,legendDone,legendCount,legendOwn,legendAch,MU,muStats,muPower,mythOf,mythIdx,mountKey,XICHTHO,XT_ELS,xtBonus,ENH,gemCost,enhKind,shoeSpeed,DUONGVU,dvWhere,LAVI,HW_SETS,LC_TYPES,LC_EFF,LC_MOVES,LC_TYPE_MOVES,LC_SPECIES,LINHCAT,lcStats,lcStatsOf,lcHealFee,lcMoves,lcNext,lcWild,RF,NMOTION,GUARD,TOP_TITLES,BEARPLUS,VNPT,MIEU,lunarDate,holyDay,vnptServing,LOGIN7,LOGIN30,DAYQ,ALBUM,SEASON,seasonOn,pumpkinsNow,vnTime,WEEKDAYS,mealStatus,hunger,levelOf,fmt,plotState,lookToTemplate,gameMs,realTime,addDays,dayOfWeek,isWeekend,dailyTasks,otTask};
});
