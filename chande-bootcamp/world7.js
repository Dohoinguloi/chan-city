/* Chan City — MU Online · Lục Địa Cát (96×72): quảng trường lát đá (x 2–41: đền Luffy phía Bắc, đài phun nước, Vệ binh, Pháp sư Cát, cổng Nam xuống rừng),
   rừng Làng Lá (x 44–69: Bắc là bãi tập ninja của Naruto với cổng torii, cọc tập, quán ramen; Nam là Đầm Rồng có hồ cho Rồng Dải Xanh),
   phía Đông (x 72–93: Bắc nghĩa địa bóng ma của Dươngg Vũ, Nam bãi phế liệu của Quỷ Cưa). Các khu nối bằng cổng trên tường thành.
   Dưới tường Nam (y 30–70) là rừng quái 3 × 3 khu (MU.forest): mỗi khu nền + đồ trang trí riêng, đường mòn nối 3 lối xuống, chừa trống quanh ổ quái. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
// phần MU cũ dựng bằng toạ độ cũ (SD.MU.local, 96 ô ngang) rồi world8 (WORLD.muWest) dời sang phải MU.OX ô và ghép vùng boss phía Tây
function buildMU(){ return WORLD.muWest(buildOld()); }
function buildOld(){ const M=SD.MU.local, W=M.W, H=M.H, H0=M.town, Z=M.zones, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{
    if(y<=1||x<=1||x>=W-2||y===H-1) return '0';
    if(y>=H0) return forestTile(x,y);
    if(y===H0-1) return x>=19&&x<=24?'9':x>=Z.gapF[0]&&x<=Z.gapF[1]?'G':x>=Z.gapE[0]&&x<=Z.gapE[1]?'&':'0';   // tường Nam: 3 lối xuống rừng
    if(x===42||x===43||x===70||x===71) return (y>=Z.gateN.y0&&y<=Z.gateN.y1)||(y>=Z.gateS.y0&&y<=Z.gateS.y1)?'9':'0';
    if(x<42) return (x<5||x>38||y>H0-5)?'G':'9';
    if(x<70){ if(y===Z.split||y===Z.split+1) return x>=Z.gapF[0]&&x<=Z.gapF[1]?'G':'0'; const L=Z.lake; if(y>Z.split&&((x-L.x)/L.rx)**2+((y-L.y)/L.ry)**2<=1) return '~';   /* Đầm Rồng: nước nông lội ra được tới chỗ rồng tắm */ return y<Z.split&&(x+y)%7===0?'P':'G'; }
    if(y===Z.split||y===Z.split+1) return x>=Z.gapE[0]&&x<=Z.gapE[1]?(y===Z.split?'%':'&'):'0';
    return y<Z.split?'%':'&'; }));
  /* --- quảng trường: đền Luffy, đuốc, đài phun nước, cờ, quầy Pháp sư, cây --- */
  const al=M.altar; put(A.muAltar(0),al.x,al.y+2.5,{flat:true,anim:'mualtar'});
  for(const [x,y] of [[13,4],[31,4],[13,11],[31,11]]){ put(A.muTorch(0),x,y,{anim:'mutorch'}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.muFountain(0),M.fountain.x,M.fountain.y,{anim:'mufount'}); block(20,13,23,15);
  [['#c8302a',9],['#f2c43d',22],['#3a6ad8',35]].forEach(([c,x])=>put(A.muBanner(c),x,3.2,{flat:true}));
  put(A.muStall(),30.6,19.2); block(29,17,32,18);
  put(A.muPremium(),11.5,19.4); block(10,17,13,18);
  put(A.muSmithStall(),6.5,14.2); block(5,12,8,13);
  put(A.mythStable(),34.5,23); block(33,21,36,22);   // chuồng thần thú (Người Thuần Thú cường hoá ngựa)   // quầy Thợ Rèn Huyền Thoại (50 vũ khí)
  put(A.muJewelStall(),35.5,11.6); block(34,9,37,10);
  put(A.enchantStall(0),7.5,23.6,{anim:'muenchant'}); block(6,21,9,22);   // quầy Phù Thuỷ Cường Hoá (khắc lỗ cường hoá, bán ngọc, thu mua chiến lợi phẩm rừng)
  put(A.shoeStall(),7.5,8.6); block(6,6,9,7);
  put(A.lcCenterStall(),37.5,16.6); block(36,14,38,15);   // Trung tâm Lính Cát MU (y tá hồi máu, kệ hàng, máy gửi giữ)
  put(A.lcTemple(0),29,25.8,{anim:'lctemple'}); block(27,24,31,25);   // Đền Lính Cát Huyền Thoại (đập 3 ngọc quý → dạng huyền thoại)   // Tiệm Giày Lướt Gió (ô Giày: đi nhanh hơn + chỉ số MU)   // quầy Thợ Kim Hoàn (phụ kiện: cánh, dây chuyền, hộ thân, aura)   // quầy Premium Store (Thương nhân Huyền Thoại đứng trước)
  const tree=(x,y)=>{ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); };
  for(const [x,y] of [[3,6],[3,12],[3,18],[40,6],[40,18],[3,24]]) tree(x,y);
  put(A.label('← VUNG BOSS · LANG MEME','#2a2026','#ffd84a'),7,18.4,{flat:true});
  put(A.stall('#d8742a',['#f4ead8','#e8b860','#5fae46']),15.5,15.6); block(14,13,16,14); put(A.label('QUAN AN','#5a2a10','#ffd84a'),15.5,13.2,{flat:true});   // Quán Ăn Lục Địa Cát (Bác Bếp Cát đứng trước quầy)
  put(A.tent({w:44,flag:'#3a8ae8'}),27.5,15.2); block(26,13,29,14); put(A.label('PHONG NGHI TRUA','#1e4a9a','#ffffff'),27.5,11.6,{flat:true});   // Phòng Nghỉ Trưa: hồi năng lượng (maps10)
  { const G=SD.MU.dday.gate, gx=G.x-SD.MU.OX; put(A.ddayGate(0),gx,G.y+.6,{anim:'ddgate'}); block(Math.floor(gx)-1,Math.floor(G.y)-1,Math.floor(gx)+1,Math.floor(G.y)-1); }   // nhà sự kiện Cổng D-Day (toạ độ cũ = gate.x - OX)   // lối mở trên tường Tây (y 19–22) sang vùng boss phía Tây
  put(A.label('MU ONLINE · LUC DIA CAT','#2a2026','#ffd84a'),22,24.2,{flat:true}); act(22,28.4,'Ra khỏi game (gọi Grab)',{do:'grab'},26);
  put(A.label('→ LANG LA · DAM RONG','#2a2026','#ff9a3a'),37,13.2,{flat:true});
  /* --- rừng Làng Lá phía Bắc: cổng torii, cọc tập, quán ramen, bia đá --- */
  put(A.muTorii(),46.5,9.6); block(45,9,45,9); block(48,9,48,9); put(A.label('LANG LA','#c8302a','#ffffff'),46.5,4.6,{flat:true});
  for(const [x,y] of [[52,5],[54,5.2],[63,12],[65,12.2]]){ put(A.muPost(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.muRamen(),64,5.2); block(62,3,66,4); for(const [x,y] of [[45,13],[68,3],[68,13],[50,13.5],[60,3]]) tree(x,y);
  /* --- Đầm Rồng phía Nam: đá quanh hồ, sậy, tổ rồng --- */
  for(const [x,y] of [[49,21],[65,21],[50,26],[64,26.5],[57,19],[57,27.2]]){ put(A.rock?A.rock(x|0):A.pottedFern(),x,y); }
  for(const [x,y] of [[46,19],[68,19],[46,28],[68,28]]) tree(x,y); put(A.label('DAM RONG','#1a5a30','#9ae8a0'),57,17.9,{flat:true});
  /* --- nghĩa địa phía Đông Bắc: bia mộ, cây khô, đèn ma, quan tài --- */
  put(A.label('NGHIA DIA BONG MA','#2a1a3a','#c8a0ff'),83,2.6,{flat:true});
  let gi=0; for(let y=4;y<=13;y+=3) for(let x=74;x<=92;x+=4){ if(Math.abs(x-84)<4&&Math.abs(y-8)<4) continue; put(A.muGrave(gi++),x+(y%2),y); }   /* bia mộ đi xuyên qua được (không chặn đường) */
  for(const [x,y] of [[73,3.5],[93,13],[77,13.5]]){ put(A.muDeadTree(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[79,8],[89,8]]) put(A.muGhostLamp(0),x,y,{anim:'mulamp'}); put(A.muCoffin(),84,12.6,{flat:true});
  /* --- bãi phế liệu phía Đông Nam: đống sắt vụn, lốp xe, thùng phuy, biển cưa máy --- */
  put(A.label('BAI PHE LIEU','#3a2a1a','#ffb03a'),83,18.2,{flat:true});
  for(const [x,y,v] of [[75,21,0],[92,21,1],[75,27,2],[92,27,0],[79,25,1],[89,19.5,2]]){ put(A.muJunk(v),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[77,19],[90,24],[86,27.6]]) put(A.muBarrel(),x,y); for(const [x,y] of [[81,27.4],[73,24]]) put(A.muTires(),x,y);
  forestDecor(g,K);
  /* lối xuống rừng quái: vòm cổng dịch chuyển có biển RUNG QUAI (portal.js) */
  // khu (hiện tên khi đi vào + trên minimap / bản đồ lớn)
  const zones=[{name:'Quảng trường Lục Địa Cát',x0:2,y0:2,x1:41,y1:28},{name:'Rừng Làng Lá',x0:44,y0:2,x1:69,y1:14},{name:'Đầm Rồng',x0:44,y0:17,x1:69,y1:28},
    {name:'Nghĩa địa Bóng Ma',x0:72,y0:2,x1:93,y1:14},{name:'Bãi Phế Liệu',x0:72,y0:17,x1:93,y1:28},
    ...Object.values(M.forest.mobs).map(m=>({name:`${m.zone.name} · ${m.name} Lv${m.lv}`,x0:m.zone.x0,y0:m.zone.y0,x1:m.zone.x1,y1:m.zone.y1}))], districts=zones.map(z=>({name:z.name.split(' · ')[0],x:(z.x0+z.x1+1)/2,y:(z.y0+z.y1+1)/2}));
  return {name:'MU Online · Lục Địa Cát',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,zones,districts,spawn:{x:M.spawn.x*T,y:M.spawn.y*T}}; }
/* ---------- rừng quái (y 30–70) ---------- */
const hsh=(x,y,s)=>A.hash(x,y,s);
const mobAt=(x,y)=>Object.values(SD.MU.local.forest.mobs).find(m=>x>=m.zone.x0&&x<=m.zone.x1&&y>=m.zone.y0&&y<=m.zone.y1);
// đường mòn: 3 trục dọc từ 3 lối xuống + 2 trục ngang giữa các hàng khu
const onPath=(x,y)=>{ const w=hsh(x>>2,y>>2,61)<.5?0:1; return x>=20+w&&x<=22+w||x>=55&&x<=57||x>=82&&x<=84||y===43||y===44||y===56||y===57; };
// chừa trống: quanh ổ quái (bán kính 4.5), điểm Lính Cát hoang, sát lối xuống
const clear=(x,y)=>{ for(const m of Object.values(SD.MU.local.forest.mobs)) for(const [px,py] of m.packs) if(Math.hypot(x+.5-px,y+.5-py)<4.5) return false;
  for(const [lx,ly] of SD.MU.local.lcSpots) if(Math.hypot(x+.5-lx,y+.5-ly)<2.5) return false; return y>31; };
function forestTile(x,y){ const m=mobAt(x,Math.min(y,SD.MU.local.H-3)), base=m?m.zone.tile:'G';   /* hàng sát tường đáy lấy nền của khu ngay trên */
  if(onPath(x,y)) return base==='%'||base==='4'?'9':'P';
  if(m&&m.k==='wraith'){ for(const [cx,cy,rx,ry] of [[40,49,3.5,2],[52,53,4,1.8],[60,47,2.5,1.5]]) if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1) return 'W'; }   // ao đầm sương
  if(m&&m.k==='cerberus'&&hsh(x>>1,y>>1,77)<.06&&clear(x,y)) return 'z';   // vũng nham thạch
  return base; }
// đồ trang trí theo khu: [hàm vẽ, mật độ, chặn đường?]
const DECOR={slime:[[s=>A.tree(s,.95),.05,1],[s=>A.pumpkin(s%3),.04,0],[()=>A.haystack(),.008,1],[s=>A.bush(s),.03,0]],
  scorpion:[[s=>A.rock(s),.05,1],[()=>A.boneHeap(),.02,0],[s=>A.wrock?A.wrock(s):A.rock(s),.02,1],[()=>A.muDeadTree(),.012,1]],
  mage:[[()=>A.muDeadTree(),.035,1],[()=>A.muGhostLamp(0),.01,1,'mulamp'],[s=>A.muGrave(s),.02,1],[()=>A.crystal('#8a5ad8'),.015,1]],
  wolf:[[s=>A.pine(s,1),.08,1],[s=>A.rock(s),.02,1],[()=>A.stump(),.015,1],[s=>A.mush?A.mush(s):A.bush(s),.02,0]],
  wraith:[[()=>A.muDeadTree(),.03,1],[s=>A.reeds?A.reeds(s):A.bush(s),.05,0],[()=>A.muGhostLamp(0),.008,1,'mulamp'],[()=>A.stump(),.01,1]],
  ogre:[[s=>A.tree(s,1.05),.04,1],[()=>A.tent({}),.006,1],[()=>A.bonfire(true,0),.008,1,'bonfire'],[()=>A.boneHeap(),.02,0],[()=>A.logs?A.logs():A.stump(),.012,1]],
  golem:[[s=>A.rock(s),.06,1],[()=>A.crystal('#7fd8ff'),.03,1],[()=>A.crystal('#c8ffd0'),.012,1],[s=>A.pine(s,.9),.015,1]],
  wendigo:[[s=>A.pine(s,1.1),.07,1],[()=>A.skullTotem(),.012,1],[()=>A.boneHeap(),.015,0],[()=>A.muDeadTree(),.015,1]],
  cerberus:[[()=>A.muTorch(0),.012,1,'mutorch'],[()=>A.skullTotem(),.012,1],[()=>A.boneHeap(),.025,0],[s=>A.rock(s),.025,1]]};
function forestDecor(g,K){ const M=SD.MU.local, {put,block}=K, cache={};
  for(let y=M.town+1;y<M.H-1;y++) for(let x=2;x<M.W-2;x++){ const m=mobAt(x,y); if(!m||!clear(x,y)||onPath(x,y)||g[y][x]==='W'||g[y][x]==='z') continue; if(onPath(x-1,y)||onPath(x+1,y)||onPath(x,y-1)) continue;
    const L=DECOR[m.k], r=hsh(x,y,91); let acc=0;
    for(let i=0;i<L.length;i++){ const [fn,dens,solid,anim]=L[i]; acc+=dens; if(r>=acc) continue; const seed=(x*7+y*13)%9, key=m.k+i+':'+seed, spr=cache[key]||(cache[key]=fn(seed)), tall=spr.c.height>30;
      put(spr,x+.5,y+.9,{tree:!!solid&&tall,anim}); if(solid){ const hw=tall?0:Math.max(0,Math.round(spr.c.width/T/2)-1); block(x-hw,y,x+hw,y); } break; } }
  // cổng địa ngục phía Nam khu Chó Ba Đầu, tháp pháp sư giữa khu Pháp Sư Đen
  put(A.hellGate(0),79,68.6,{anim:'hellgate'}); block(76,67,82,68);
  put(A.mageTower(),79,36.6); block(77,34,81,36);
  for(const m of Object.values(M.forest.mobs)) put(A.label(m.zone.name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'D'),'#1c1516','#ffd84a'),(m.zone.x0+m.zone.x1+1)/2,m.zone.y0+1.2,{flat:true}); }
Object.assign(WORLD,{buildMU});
})();
