/* Template nhân vật theo ref (20×35 px, 3/4 nhìn phải, viền đen 1px, mắt 1×2).
   Mỗi ký tự là một vật liệu + tông; màu thật được tô lại từ kết quả phân tích ảnh.
   O viền · S/s/d/L/n/m da (nền/bóng/sâu/sáng/mũi/miệng) · E mắt
   H/h/X/J tóc (nền/bóng/sâu/sáng) · C/c mũ · T/t/q áo · I/i áo trong · W/w sơ mi · R/r cà vạt
   U khoá thắt lưng · P/p/j quần (nền/bóng/bóng da) · F/f giày · G kính · K/k khẩu trang · Y/y vàng · V bạc
   B/b hình in · D đường caro · M/N mực xăm · v/Z sọc xanh-đỏ · Q/u điếu thuốc/khói · l chỉ rách
   Lớp phủ: '.' = giữ nguyên lớp dưới, '_' = xoá. */
(function(){
const W=20, H=35;

// tóc: hàng 0–9 của đầu
const HAIR={
  swept:[ // tóc vuốt lệch như nhân vật vest trong ref
    '......OOOOOOOOO.....',
    '....OOHHHHHHHHHOO...',
    '...OHHHHHHHHHhhHHO..',
    '..OhHHHhhhHHHhhhHO..',
    '.OhHHHhXXXXXhXXhOOO.',
    '.OhhhhhOOOOOOXXOOOO.',
    'OhhhhhOOSSSSSSSSSsO.',
    'OXXXhOOsSSSSSSSSSSO.',
    'OXXXXOOsSSSSSSSSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  messy:[ // tóc rối mái lởm chởm như nhân vật đeo kính
    '......OOOOOOOO......',
    '....OOHHHHHHHOOOO...',
    '...OHHHHHHHHHHHHO...',
    '..OHHHHHJJHHHHHHHOO.',
    '.OhhhhHHHHHHHHHhhhhO',
    '.OhHHhhOHhhhhHHhhhOO',
    'OhHHHHhhHhhhhhhhhhO.',
    'OhhhhhOOhSSShSShSSO.',
    'OhhhhOOsSSSSSSSSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  undercut:[ // trên dày, hai bên cạo ngắn
    '......OOOOOOOOOO....',
    '....OOHHHHHHHHHHOO..',
    '...OHHHJJHHHHHHHHHO.',
    '..OhHHHHHHHHhhHHHhO.',
    '.OhhhHHHhhhhhhhhhhO.',
    '.OXhXhXOOOOOOXXOOOO.',
    'OXhXhXOOSSSSSSSSSsO.',
    'OhXhXOOsSSSSSSSSSSO.',
    'OXhXhOOsSSSSSSSSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  fringe:[ // mái rối dày tới chân mày, hai bên cạo ngắn, một lọn bay trên đỉnh
    '....OO.OOOOOOOO.....',
    '...OHHOOHHHHHHHHO...',
    '...OHHHHHHHJHHHHHO..',
    '..OhHHHHHHHHHHHHHHO.',
    '.OhhHHHHHHHHHHHHhhO.',
    '.OXhhhHHHHHHHHhhhhO.',
    'OXXhXhhhhHHHhhhhhhO.',
    'OXhXXOhhhhhhhOhhShO.',
    'OhXXOOsXhXXhSShSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  fade:[ // khối tóc tròn mượt, đỉnh phẳng, vệt sáng phía sau; fade lộ da sáng ngay trên tai (như Kenny Ho)
    '.....OOOOOOOOOOO....',
    '...OOHJJHHHHHHHHOO..',
    '..OHHHHHHHHHHHHHHO..',
    '.OHHHHHHHHHHHHHHHHO.',
    '.OXSXHHHHHHHHHHHHhO.',
    '.OSXSXhhhhhhhhhhhhO.',
    'OXSXSXSSSSSSSSSSSsO.',
    'OSXSXSsSSSSSSSSSSSO.',
    'OXSXSOsSSSSSSSSSSSO.',
    '.OSXSOOsSSSSSSSSSSO.'],
  bowl:[ // tóc nấm, mái bằng dày phủ trán tới chân mày (như Pháp đầu cam)
    '......OOOOOOOOO.....',
    '....OOHHHHHHHHHOO...',
    '...OHHHJJHHHHHHHHO..',
    '..OHHHHHHHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHO.',
    '.OhHHHHHHHHHHHHHHHO.',
    'OhHHHHHHHHHHHHHHHHO.',
    'OhhHHhHHhHHhHHhHHhO.',
    'OhhhhOOhhhhhhhhhhhO.',
    'OhhhhOOsSSSSSSSSSSO.'],
  shag:[ // tóc rối dài: đỉnh phồng, mái lởm chởm hở trán, hai bên dài phủ tai (như Pháp đầu cam)
    '.....OOOOOOOOOOO....',
    '...OOHHHHJHHHHHHOO..',
    '..OHHHHJJHHHHHHHHHO.',
    '.OHHHHHHHHHHHHHHHHHO',
    '.OhHHHHHHHHHHHHHHHHO',
    'OhHHHHhHHHHhHHHHHhO.',
    'OhHHHhhHHhHHhHHHhhO.',
    'OhhHhOOhSShhShhShhO.',
    'OhhhhOOhSShSShSShSO.',
    'OhhhhOOsSSSSSSSSShO.'],
  buzz:[ // đầu đinh: sọ sau gọn (tai nhô ra khỏi đường sọ), tóc ngắn bám sát đầu
    '.......OOOOOOO......',
    '.....OOhhhhhhhOO....',
    '....OHHhHHHhHHHhO...',
    '...OHhHHHhHHHHhHHO..',
    '..OhHHHHhHHHHhHHhhO.',
    '..OhhHhhhhhhhhhhhhO.',
    '..OhhhSSSSSSSSSSSSO.',
    '..OhhhsSSSSSSSSSSSO.',
    '..OhhssSSSSSSSSSSSO.',
    '..OhsSSSSSSSSSSSSSO.'],
  bald:[ // sọ gọn phía sau, đỉnh tròn, sáng trên-trái
    '.......OOOOOOO......',
    '.....OOLLSSSSSOO....',
    '....OLLSSSSSSSSSO...',
    '...OLSSSSSSSSSSSSO..',
    '..OsSSSSSSSSSSSSSSO.',
    '..OsSSSSSSSSSSSSSSO.',
    '..OssSSSSSSSSSSSSSO.',
    '..OsSSSSSSSSSSSSSSO.',
    '..OssSSSSSSSSSSSSSO.',
    '..OsdSSSSSSSSSSSSSO.'],
  cap:[ // mũ lưỡi trai, vành chìa sang phải
    '.....OOOOOOOO.......',
    '...OOCCCCCCCCOO.....',
    '..OCCCCCCCCCCCCO....',
    '.OcCCCCCCCCCCCCCO...',
    '.OcCCCCCCCCCCCCCCOO.',
    '.OcccccccccccccccccO',
    'OhhhhhOOOOOOOOOOOOO.',
    'OXXXhOOsssssssssssO.',
    'OXXXXOOsSSSSSSSSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  ponytail:[ // mái lệch + đuôi ngựa sau gáy như nhân vật y tá
    '......OOOOOOOO......',
    '....OOHHHHHHHHOO....',
    '...OHHHHHHHHHHHHO...',
    '..OHHHhhhHHHHHHHHO..',
    '.OhHHhhhhhhhHHHHHHO.',
    '.OhHhhhhhhhhhhhHHHO.',
    'OhhhhhhhhhhhhhhhhhO.',
    'OhhhhhXXhhhhOSSShhO.',
    'OhhhhOOXXXOOSSSSSSO.',
    'OhhhOOsSSSSSSSSSSSO.'],
  long:[ // tóc dài xoã
    '......OOOOOOOO......',
    '....OOHHHHHHHHOO....',
    '...OHHHHJJHHHHHHO...',
    '..OHHHhhhHHHHHHHHO..',
    '.OhHHhhhhhhhHHHHHHO.',
    '.OhHhhhhhhhhhhhHHHO.',
    'OhhhhhhhhhhhhhhhhhO.',
    'OhhhhhXXhhhhOSSShhO.',
    'OhhhhOOXXXOOSSSShhO.',
    'OhhhOOsSSSSSSSSShhO.'],
  bun:[ // búi tóc trên đỉnh
    '..OOO.OOOOOOOOO.....',
    '.OHHHOOHHHHHHHHOO...',
    '.OHhhOHHHHHHHhhHHO..',
    '..OOOHHhhhHHHhhhHO..',
    '.OhHHHhXXXXXhXXhOOO.',
    '.OhhhhhOOOOOOXXOOOO.',
    'OhhhhhOOSSSSSSSSSsO.',
    'OXXXhOOsSSSSSSSSSSO.',
    'OXXXXOOsSSSSSSSSSSO.',
    'OOOOOOOsSSSSSSSSSSO.'],
  afro:[
    '....OOOOOOOOOOO.....',
    '..OOHhHhHhHhHhHOO...',
    '.OHhHhHhHhHhHhHhHO..',
    'OHhHhHhHhHhHhHhHhHO.',
    'OhHhHhHhHhHhHhHhHhO.',
    'OHhHhHhHhHhHhHhHhHO.',
    'OhHhHhOOSSSSSSSSShO.',
    'OHhHhOOsSSSSSSSSShO.',
    'OhHhHOOsSSSSSSSSShO.',
    'OHhhOOOsSSSSSSSSSSO.'],
};

// mặt: hàng 10–17 (tai bên trái, mắt 1×2 ở cột 10 và 15, mũi cột 16, miệng 3px)
const FACE=[
  '.OssdOOSSXXXSSXXXSO.',
  '.OSsdOOSSSESSSSESSO.',
  '.OsSdOSSSSESSSSESsO.',
  '..OdsSSSSSSSSSSSnSO.',
  '...OOSSSSSSSSSSSSSO.',
  '...OsSSSSSSSmmmSSsO.',
  '....OsSSSSSSSSSSSO..',
  '.....OOddSSSSSSdO...'];
const NOBROW=['.OssdOOSSSSSSSSSSSO.'];

// thân: hàng 18–26. Tay gần (trái ảnh) 3px, tay xa 2px như góc 3/4 của ref.
const TOP_PARTS={
  tee:[
    '.....OOdddddddOO....',
    '....OTqTTTSSTTqTO...',
    '...OTTTTqqSqTTTTtO..',
    '...OTTTqTTTTqTTTtO..',
    '..OtTTTqTTTTqTTTTtO.',
    '..OqqqqqTTTTqTTqqqO.',
    '...OSSsOtTTTqTTOSsO.',
    '...OSSsOtTTTqTTOSsO.',
    '...OSSsOOOUUUOOOSsO.'],
  long:[
    '.....OOdddddddOO....',
    '....OTqTTTSSTTqTO...',
    '...OTTTTqqSqTTTTtO..',
    '...OTTTqTTTTqTTTtO..',
    '..OtTTTqTTTTqTTTTtO.',
    '..OtTTtOTTTqTTTOTtO.',
    '...OTTtOtTTTqTTOTtO.',
    '...OqqqOtTTTqTTOqqO.',
    '...OSSsOOOUUUOOOSsO.'],
  jacket:[
    '.....OOdddddddOO....',
    '....OTqTTOIIIOqTO...',
    '...OTTTTqOIIIOqTTtO.',
    '...OTTTTTOIIIOTTtO..',
    '..OtTTTTTOIIIOTTTtO.',
    '..OtTTtOTOIiIOTOTtO.',
    '...OTTtOTOIiIOTOTtO.',
    '...OqqqOTOIiIOTOqqO.',
    '...OSSsOOOUUUOOOSsO.'],
  cardigan:[ // áo khoác mở rộng, lộ áo trong
    '.....OOdddddddOO....',
    '....OTTOIIIIIIOTO...',
    '...OTTTOIIIIIIOTtO..',
    '...OTTTOIIIIIIOTtO..',
    '..OtTTTOIIIiIIOTTtO.',
    '..OtTTtOTIIiIITOTtO.',
    '...OTTtOTIIiIITOTtO.',
    '...OqqqOTIIiIITOqqO.',
    '...OSSsOTOUUUOTOSsO.'],
  suit:[
    '.....OOdddddddOO....',
    '....OTqTTOWRWOqTO...',
    '...OTTTTqOWRWOqTTtO.',
    '...OTTTTTOWRWOTTtO..',
    '..OtTTTTTOWRWOTTTtO.',
    '..OtTTtOTOWrWOTOTtO.',
    '...OTTtOTTOrOTTOTtO.',
    '...OqqqOtTTqTTTOqqO.',
    '...OSSsOOOUUUOOOSsO.'],
};

// chân: hàng 27–34 (gồm cả đáy bàn tay)
const BOTTOM={
  pants:[
    '...OdSdOPPPPPPPOSdO.',
    '....OdPPPPPOPPPPdO..',
    '.....OPPPPpOPPPpO...',
    '.....OPPPPpOPPPpO...',
    '.....OpPPPpOpPPpO...',
    '.....OFFFFOOFFFFFO..',
    '.....OffffOOfffffO..',
    '.....OOOOOOOOOOOOO..'],
  shorts:[
    '...OdSdOPPPPPPPOSdO.',
    '....OdPPPPPOPPPPdO..',
    '.....OpPPPpOpPPpO...',
    '......OSsO.OSsO.....',
    '......OSsO.OSsO.....',
    '.....OFFFFOOFFFFFO..',
    '.....OffffOOfffffO..',
    '.....OOOOOOOOOOOOO..'],
  skirt:[
    '...OdSdOPPPPPPPOSdO.',
    '....OdPPPPPPPPPPdO..',
    '....OPPPPpPPPPpPPO..',
    '....OppppppppppppO..',
    '......OSsO.OSsO.....',
    '.....OFFFFOOFFFFFO..',
    '.....OffffOOfffffO..',
    '.....OOOOOOOOOOOOO..'],
};

// lớp phủ: [hàng bắt đầu, các hàng]
const OVER={
  glasses:[10,[
    '........GGGG..GGGG..',
    '......GGS.SGGGGS.G..',
    '........G..G..G..G..',
    '.........GG....GG...']],
  tintglasses:[10,[                             // kính vuông gọng đen, tròng xanh nhạt nhìn thấy mắt (skin Kaixa)
    '........GGGG..GGGG..',
    '......GG4E4GGGG4EG..',
    '........G455..G45G..',
    '........GGGG..GGGG..']],
  sunglasses:[10,[                              // kính râm: tròng tối, chấm loá
    '........GGGG..GGGG..',
    '......GGGuGGGGGuGG..',
    '........GGGG..GGGG..',
    '.........GG....GG...']],
  tieTee:[19,[                                  // cổ áo + cà vạt trên áo thun/áo dài tay
    '.........WRRW.......',
    '.........WRW........',
    '..........R.........',
    '..........R.........',
    '..........r.........',
    '..........r.........']],
  shagL:[10,[                                   // hai bên tóc rối phủ tai
    'OhhhhO..............',
    'OhHhhO..............',
    'OhHhhO..............',
    'OhhhXO..............',
    '.OhhXO..............',
    '.OOXO...............']],
  shagR:[10,[
    '.................h..',
    '.................h..',
    '.................h..']],
  idcard:[19,[                                  // dây đeo tối + thẻ nhân viên đỏ nhỏ
    '........D....D......',
    '.........D..D.......',
    '..........DD........',
    '..........ZZ........',
    '..........Zg........']],
  mask:[12,[                                    // khẩu trang kín từ mũi tới cằm, có nếp gấp
    '......k.............',
    '.....kKKKKKKKKKKKS..',
    '.....KKKKKKKKKKKKK..',
    '.....kkkkkkkkkkkkk..',
    '.....KKKKKKKKKKKK...',
    '.......kkkkkkkkk....']],
  chain:[19,[                                   // chữ V từ cổ xuống giữa ngực + mặt nhỏ
    '........Y....Y......',
    '.........Y..Y.......',
    '..........YY........',
    '..........y.........']],
  chainIn:[19,[ // dây chuyền trong áo khoác, mặt thanh dài
    '..........Y.Y.......',
    '..........Y.Y.......',
    '...........Y........',
    '...........y........',
    '...........y........']],
  coatTail:[27,[ // vạt áo dài phủ xuống đùi
    '........T.....T.....',
    '.......Tq....qT.....']],
  turtle:[18,[ // cổ lọ: che cổ, gân len
    '.....OIiIiIiIiIO....']],
  earring:[13,['...V................']],
  watch:[26,['................AA..']],          // đồng hồ cổ tay xa (phải ảnh)
  bracelet:[26,['....YYY.........YY..']],       // vòng vàng hai cổ tay
  tattoo:[24,[                                  // xăm kín cẳng tay (áo tay ngắn)
    '....MNM.........NM..',
    '....NMN.........MN..']],
  print:[22,[                                   // hình in phượng dưới dây chuyền
    '........BB...BB.....',
    '.........BBbBB......',
    '..........BbB.......',
    '.........B.B.B......']],
  rips:[29,[                                    // jean rách gối
    '.......lS....l......',
    '.......Ss....Sl.....']],
  leather:[28,[                                 // vệt sáng quần da
    '.......j.....j......',
    '.......j.....j......',
    '........j.....j.....']],
  capWeb:[3,[                                   // sọc xanh-đỏ-xanh bên hông mũ
    '..vZv...............',
    '..vZv...............']],
  cigarette:[23,[                               // điếu thuốc kẹp ở tay gần + khói
    '.u..................',
    'u...................',
    '.u..................',
    '....................',
    'ZQQ.................']],
  ponytail:[13,[
    'OHhO................',
    'OHhhO...............',
    'OHhhO...............',
    'OhhXO...............',
    '.OXXO...............',
    '.OOO................']],
  longL:[10,[
    'OhhhhO..............',
    'OhHhhO..............',
    'OhHhhO..............',
    'OhHhhO..............',
    'OhhhhO..............',
    'OhhhXO..............',
    '.OhhXO..............',
    '.OhhXO..............',
    '.OhXXO..............',
    '..OXXO..............',
    '..OXO...............']],
  longR:[10,[
    '.................h..',
    '.................h..',
    '.................h..',
    '.................h..']],
};

const DEFAULT={ // màu gốc lấy từ ref
  O:'1c1516',E:'1c1516',G:'1c1516',
  S:'f3b194',s:'e2856a',d:'b6544a',L:'f8cdb5',n:'cb6d5c',m:'9d4a3b',
  H:'3a3039',h:'282025',X:'1e171b',J:'4f4450',
  C:'b59a74',c:'8a7458',
  T:'3d797b',t:'2f6064',q:'233f4a',
  I:'e6e2da',i:'b9b6c2',
  W:'eef1f2',w:'b3c3ca',R:'8e2b2c',r:'5e1a1e',
  U:'8a8178',P:'3a3c50',p:'26283a',F:'4a2c22',f:'2e1b16',
  K:'c3c6cb',k:'8f949b',Y:'e8b83a',y:'a8761e',V:'d4d8dc',g:'fbfaf6',A:'d4d8dc','1':'ffd84a','2':'ff9f2e','3':'fff7d6',z:'3b2b27',e:'c8352c',x:'8c231f',o:'d6d9df',
  B:'e5b53a',b:'a87a1c',D:'2f2b38',M:'3f7f6f',N:'c4563c',j:'6a6d82',v:'2f6b3a',Z:'b8342e',Q:'f2efe8',u:'a3a3aa',l:'ecebe6','4':'bfe2f2','5':'e8f8ff','6':'f2c43d','7':'d23a2e','8':'3f9a4a'};

function validate(){
  const bad=[]; const chk=(name,rows)=>rows.forEach((r,i)=>{ if(r.length!==W) bad.push(`${name}[${i}] dài ${r.length}`); });
  for(const k in HAIR) chk('hair.'+k,HAIR[k]); chk('face',FACE); chk('nobrow',NOBROW);
  for(const k in TOP_PARTS) chk('top.'+k,TOP_PARTS[k]); for(const k in BOTTOM) chk('bottom.'+k,BOTTOM[k]);
  for(const k in OVER) chk('over.'+k,OVER[k][1]);
  if(bad.length) console.warn('Template lỗi độ dài:',bad);
  return bad;
}

// mũ thổ cẩm vùng cao (Ộ i i): chỏm theo màu mũ, dải thêu đỏ - vàng - xanh quanh trán, bỏ vành lưỡi trai
function mongCap(R,side,back){ for(let y=3;y<=6;y++) for(let x=0;x<W;x++){ const c=R[y][x]; if(c!=='C'&&c!=='c') continue;
    R[y][x]=y===3||y===6?'7':y===4?((x+y)%3?'6':'7'):(x%2?'8':'6'); }
  if(side){ R[5][18]='O'; R[5][19]='.'; }
  if(back) for(let y=7;y<=12;y++) for(let x=0;x<W;x++) if('Ssd'.includes(R[y][x])) R[y][x]=x>=13?'h':'H'; }   // sau gáy: tóc đen dưới mũ
// ghép các phần thành lưới ký tự 20×35
function compose(o){
  const rows=[...(HAIR[o.hair]||HAIR.swept), ...FACE, ...(TOP_PARTS[o.top]||TOP_PARTS.tee), ...(BOTTOM[o.bottom]||BOTTOM.pants)].map(r=>r.split(''));
  if(!o.brows) rows[10]=NOBROW[0].split('');
  if(o.hair==='bald'||o.hair==='buzz'){ rows[10][6]='s'; rows[11][6]='s'; }   // tóc sát/trọc: tai chỉ cần nét 1px   // đầu trọc: tai chỉ cần nét 1px, không có tóc mai
  if(o.hair==='ponytail') overlay(rows,'ponytail');
  if(o.hair==='long'){ overlay(rows,'longL'); overlay(rows,'longR'); }
  if(o.hair==='shag'){ overlay(rows,'shagL'); overlay(rows,'shagR'); }
  if(o.mask){ overlay(rows,'mask'); for(let x=0;x<W;x++) if(rows[18][x]==='d') rows[18][x]='s'; }   // cổ dưới khẩu trang: bỏ bóng đỏ sẫm
  if(o.glasses) overlay(rows,o.glasses==='sun'?'sunglasses':o.glasses==='tint'?'tintglasses':'glasses');
  if(o.glasses==='tint'&&o.lensO) for(let y=8;y<=14;y++) for(let x=0;x<W;x++){ if(rows[y][x]==='4') rows[y][x]='2'; else if(rows[y][x]==='5') rows[y][x]='3'; }   // tròng cam (QNT)
  const open=o.top==='jacket'||o.top==='suit'||o.top==='cardigan';
  if(o.top==='cardigan') overlay(rows,'coatTail');
  if(o.turtle){ overlay(rows,'turtle');
    if(!open){ for(let x=0;x<W;x++){ const c=rows[18][x]; if(c==='I') rows[18][x]='T'; else if(c==='i') rows[18][x]='t'; }
      for(const [x,y] of [[10,19],[11,19],[10,20]]) rows[y][x]='T'; } }
  if(o.earring&&o.hair!=='long'&&o.hair!=='shag') overlay(rows,'earring');
  if(o.plaid) plaid(rows);
  if(o.floral) floral(rows);
  if(o.polka) polka(rows);
  if(o.vstripe) vstripe(rows);
  if(o.polo&&!open){ rows[19][10]=rows[19][11]='B'; rows[20][10]='T'; for(const x of [3,4,5,6,7,15,16,17]) if(rows[23][x]==='q') rows[23][x]='B'; }   // áo polo: cổ bẻ + viền tay màu print
  if(o.logo&&!open){ rows[21][13]=rows[21][14]='B'; rows[22][14]='b'; }   // logo nhỏ trên ngực (đồng phục VNPT)
  if(o.tie&&(o.top==='tee'||o.top==='long')) overlay(rows,'tieTee');
  if(o.capPattern&&o.hair==='cap') for(let y=1;y<=5;y++) for(let x=0;x<W;x++) if(rows[y][x]==='C'&&(x*2+y)%4===0) rows[y][x]='c';
  if(o.capWeb&&o.hair==='cap') overlay(rows,'capWeb');
  if(o.mongCap&&o.hair==='cap') mongCap(rows,true);
  if(o.print&&!open) overlay(rows,'print');
  if(o.tattoo&&o.top==='tee') overlay(rows,'tattoo');
  if(o.chain&&o.top!=='suit') overlay(rows,open||o.turtle?'chainIn':'chain');
  if(o.bracelet) overlay(rows,'bracelet');
  if(o.watch) overlay(rows,'watch');
  if(o.leather&&o.bottom==='pants') overlay(rows,'leather');
  if(o.rips&&o.bottom==='pants') overlay(rows,'rips');
  if(o.cigarette) overlay(rows,'cigarette');
  if(o.beard&&!o.mask){ for(const x of [11,12,13,14]) rows[14][x]='z';                     // ria mép mỏng
    if(o.beard==='goatee'){ for(const x of [12,13,14]) rows[16][x]='z'; rows[17][13]='z'; } }  // chòm râu cằm
  if(o.idcard&&!o.chain) overlay(rows,'idcard');
  if(o.mouth==='smirk'&&!o.mask){ rows[15][14]='S'; rows[14][14]='m'; }
  if(o.mouth==='smile'&&!o.mask){ for(const x of [12,13,14]){ rows[15][x]='g'; rows[16][x]='m'; } rows[15][11]='m'; rows[15][15]='m'; }   // cười tươi lộ răng
  return rows;
}
// hoa: chấm hoa 2 màu rải đều trên vải áo (sơ mi hoa)
// sọc dọc: vải áo kẻ sọc màu print xen sọc tối (áo len QNT)
function vstripe(rows,y0=19,y1=26){ for(let y=y0;y<=y1;y++) for(let x=0;x<W;x++){ const c=rows[y]&&rows[y][x]; if(!c||!'Ttq'.includes(c)) continue; if(x%4===0) rows[y][x]='B'; else if(x%4===2) rows[y][x]='D'; } }
// chấm bi: chấm màu print thưa đều trên vải áo + váy (váy Diệp)
function polka(rows,y0=19,y1=31){ for(let y=y0;y<=y1;y++) for(let x=0;x<W;x++){ const c=rows[y]&&rows[y][x]; if(!c||!'TtqPp'.includes(c)) continue; if((x+(y>>1)*2)%4===0&&y%2===1) rows[y][x]='B'; } }
function floral(rows){
  for(let y=19;y<=25;y++) for(let x=0;x<W;x++){ const c=rows[y][x]; if(c!=='T'&&c!=='t'&&c!=='q') continue;
    if((x*3+y*2)%7===0) rows[y][x]='B'; else if((x*5+y*3)%9===4) rows[y][x]='D'; }
}
// caro: đường tối dọc/ngang + chỉ đỏ, chỉ phủ lên vải áo (T/t/q)
function plaid(rows){
  for(let y=19;y<=25;y++) for(let x=0;x<W;x++){ const c=rows[y][x]; if(c!=='T'&&c!=='t'&&c!=='q') continue;
    if(x%5===2||y===21||y===24) rows[y][x]='D'; else if(x%5===4&&y%2===0&&c==='T') rows[y][x]='B'; }
}
function overlay(rows,name){ const [y0,ov]=OVER[name];
  ov.forEach((r,dy)=>{ const y=y0+dy; if(!rows[y]) return; for(let x=0;x<W;x++){ const ch=r[x]; if(!ch||ch==='.') continue; rows[y][x]=ch==='_'?'.':ch; } }); }

/* ---------- Tư thế đặc biệt (vẽ lại tay/chân, không chỉ dịch khối) ----------
   Lưới tư thế rộng W+12 (thêm 6px mỗi bên cho tay vươn ra), cao bằng H. */
const PAD=6;
// đường tay: danh sách điểm (toạ độ sprite) từ vai tới cổ tay; bàn tay vẽ ở điểm cuối
const ARMS={
  high:{L:[[3,20],[2,19],[1,18],[0,17],[-1,16],[-2,15],[-2,14],[-3,13],[-3,12]], R:[[16,20],[17,19],[18,18],[19,17],[20,16],[21,15],[21,14],[22,13],[22,12]]},
  mid: {L:[[3,20],[2,20],[1,19],[0,19],[-1,18],[-2,17],[-3,16],[-3,15],[-3,14]], R:[[16,20],[17,20],[18,19],[19,19],[20,18],[21,17],[22,16],[22,15],[22,14]]},
};
function quayFrame(o,left,right){
  const rows=compose(o), GW=W+PAD*2, G=Array.from({length:H},()=>Array(GW).fill('.'));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) G[y][x+PAD]=rows[y][x];
  const at=(x,y)=>G[y]&&G[y][x+PAD], put=(x,y,c)=>{ if(y>=0&&y<H&&x+PAD>=0&&x+PAD<GW) G[y][x+PAD]=c; };
  // gỡ cẳng tay + bàn tay đang buông (hàng 24–28), trả lại viền hông áo
  for(let y=24;y<=28;y++){ for(let x=0;x<=6;x++) put(x,y,'.'); for(let x=16;x<W;x++) put(x,y,'.'); }
  for(let y=24;y<=27;y++){ put(7,y,'O'); put(15,y,'O'); }
  put(5,28,'O'); put(16,28,'O');
  // dạng chân: chân gần lùi trái 1px, chân xa sang phải 1px (từ hàng 29)
  for(let y=29;y<H;y++){ const row=G[y].slice(); const mid=11+PAD;
    for(let x=0;x<GW;x++) G[y][x]='.';
    for(let x=0;x<GW;x++){ const c=row[x]; if(c==='.') continue; if(x<mid) G[y][x-1]=c; else if(x+1<GW) G[y][x+1]=c; } }
  // vẽ tay: tay áo ngắn 2 điểm đầu, còn lại là da (có mực xăm nếu bật)
  const sleeveN=o.top==='tee'?2:6;
  const arm=(pts,far)=>{
    pts.forEach(([x,y],i)=>{
      const cloth=i<sleeveN, ink=o.tattoo&&!cloth&&i<pts.length-1, wrist=i===pts.length-2;
      // xăm: mực rải xen da, không phủ kín (nhìn ra tay trần có hình xăm)
      const inkC=(i+(far?1:0))%2?'M':'N';
      const base=cloth?'T':'S', shade=cloth?'t':'s';
      put(x,y,ink&&i%2===0?inkC:base); put(x+1,y,base); put(x,y+1,ink?inkC:base); put(x+1,y+1,ink&&i%2?inkC:shade);
      if(wrist&&far&&o.watch){ put(x,y,'A'); put(x+1,y,'A'); }
      if(wrist&&o.bracelet){ put(x,y,'Y'); put(x+1,y,'Y'); } });
    const [hx,hy]=pts[pts.length-1];               // bàn tay xoè 2×3 + ngón cái
    for(let dy=-2;dy<=0;dy++){ put(hx,hy+dy,'S'); put(hx+1,hy+dy,'S'); }
    put(far?hx+1:hx,hy-3,'S'); put(far?hx+2:hx-1,hy-1,'s');
    if(far&&o.prop) put(hx+1,hy-1,'Z');              // vật đỏ cầm ở tay xa như trong ảnh
  };
  arm(ARMS[left].L,false); arm(ARMS[right].R,true);
  // viền 1px quanh phần mới lộ ra
  const src=G.map(r=>r.slice());
  for(let y=0;y<H;y++) for(let x=0;x<GW;x++){ if(src[y][x]!=='.') continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=src[y+dy]&&src[y+dy][x+dx]; if(c&&c!=='.'&&c!=='O'&&c!=='Q'&&c!=='u'&&c!=='Z'){ G[y][x]='O'; break; } } }
  return G;
}
// mỗi frame: [tay trái, tay phải, nhún]
/* ---------- Khung chat pixel ----------
   Font 3×5 vẽ tay, dấu tiếng Việt nằm 2 hàng phía trên chữ. Chữ và viền dùng 'O', nền 'g'. */
const GLYPH={
  A:['.X.','X.X','XXX','X.X','X.X'], O:['.X.','X.X','X.X','X.X','.X.'], V:['X.X','X.X','X.X','X.X','.X.'],
  I:['X','X','X','X','X'], ' ':['..','..','..','..','..'], '!':['X','X','X','.','X']};
const ACCENT={'Ã':['A',['.X.X','X.X.']],'Ò':['O',['X..','.X.']],'Ó':['O',['..X','.X.']],'Á':['A',['..X','.X.']],'À':['A',['X..','.X.']]};
function bubble(text){
  const glyphs=[...text.toUpperCase()].map(ch=>ACCENT[ch]?{rows:GLYPH[ACCENT[ch][0]],acc:ACCENT[ch][1]}:{rows:GLYPH[ch]||GLYPH[' ']});
  const tw=glyphs.reduce((s,g,i)=>s+g.rows[0].length+(i?1:0),0);
  const bw=tw+6, bh=11, G=Array.from({length:bh+2},()=>Array(bw).fill('.'));
  for(let y=0;y<bh;y++) for(let x=0;x<bw;x++){ const edge=y===0||y===bh-1||x===0||x===bw-1;
    const corner=(x===0||x===bw-1)&&(y===0||y===bh-1); if(!corner) G[y][x]=edge?'O':'g'; }
  G[1][1]='O'; G[1][bw-2]='O'; G[bh-2][1]='O'; G[bh-2][bw-2]='O';          // bo góc
  let cx=3; for(const g of glyphs){ const w=g.rows[0].length;
    if(g.acc) g.acc.forEach((r,dy)=>[...r].forEach((c,dx)=>{ if(c==='X') G[1+dy][cx+dx]='O'; }));
    g.rows.forEach((r,dy)=>[...r].forEach((c,dx)=>{ if(c==='X') G[3+dy][cx+dx]='O'; }));
    cx+=w+1; }
  G[bh-1][9]='g'; G[bh][8]='O'; G[bh][9]='g'; G[bh][10]='O'; G[bh+1][8]='O';   // đuôi chỉ xuống phía miệng
  return G;
}
// nói: miệng mở/khép + khung chat phía trên đầu (lưới cao thêm TOP hàng)
const TOP=13;
function talkFrame(o,mouth,text,bx){
  const rows=compose(o), GW=W+PAD*2, G=Array.from({length:H+TOP},()=>Array(GW).fill('.'));
  if(!o.mask){ if(mouth==='open'){ rows[15][12]='m'; rows[15][13]='E'; rows[15][14]='m'; rows[16][13]='m'; }
    if(mouth==='wide'){ for(const x of [12,13,14]){ rows[15][x]='E'; rows[16][x]='m'; } } }
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) G[y+TOP][x+PAD]=rows[y][x];
  const B=bubble(text); B.forEach((r,y)=>r.forEach((c,x)=>{ if(c!=='.'&&y<TOP&&x+bx<GW) G[y][x+bx]=c; }));
  return G;
}
/* ---------- Hoá Hokage Awwwards ----------
   Nón lá đỏ có ô trắng in chữ 火, khăn trắng rủ hai bên mặt, áo choàng trắng viền lửa đỏ, dây đỏ vắt ngực.
   Biến hình bằng cụm khói kiểu ninja. e/x đỏ (nền/bóng), g/o trắng (nền/bóng), u xám khói. */
function hokageGrid(o,form){
  const rows=compose(o), GW=W+PAD*2, G=Array.from({length:H+TOP},()=>Array(GW).fill('.'));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) G[y+TOP][x+PAD]=rows[y][x];
  if(!form) return G;
  const put=(x,y,c)=>{ const gy=y+TOP, gx=x+PAD; if(gy>=0&&gy<G.length&&gx>=0&&gx<GW) G[gy][gx]=c; };
  const get=(x,y)=>{ const r=G[y+TOP]; return r?r[x+PAD]:undefined; };
  for(let y=0;y<=3;y++) for(let x=-PAD;x<W+PAD;x++) put(x,y,'.');      // nón che đỉnh đầu
  // khăn trắng rủ từ dưới vành nón: bên gáy rộng, bên mặt hẹp
  for(let y=4;y<=18;y++){ for(let x=0;x<=4;x++) put(x,y,x===4?'o':'g'); }
  for(let y=4;y<=14;y++){ put(18,y,'o'); put(19,y,'g'); }
  // áo choàng: phủ vai và hai bên thân, mở giữa lộ sơ mi hoa
  for(let y=18;y<=32;y++){
    for(let x=1;x<=7;x++) put(x,y,x===7||x===2&&y%3===0?'o':'g');
    for(let x=15;x<=19;x++) put(x,y,x===15?'o':'g'); }
  const flame=[3,1,2,0,2,3,1,2,0,1,3,2,0,2,1,3,1,2,0,2];             // lửa đỏ gấu áo, cao thấp xen kẽ
  for(let x=1;x<=19;x++){ if(x>7&&x<15) continue; const hgt=flame[x%flame.length];
    for(let y=32-hgt;y<=32;y++) put(x,y,y===32-hgt?'x':'e'); }
  for(const [x,y] of [[8,21],[9,22],[10,23],[11,23],[12,22],[13,21]]) put(x,y,'e');   // dây đỏ
  // nón lá đỏ, ô trắng giữa có chữ 火
  const hat=[[-4,9,11],[-3,7,13],[-2,5,15],[-1,3,17],[0,1,19],[1,-1,21]];
  for(const [y,a,b] of hat) for(let x=a;x<=b;x++) put(x,y,x===a||x===b?'O':'e');
  for(let x=9;x<=11;x++) put(x,-4,'O');
  for(const [y,a,b] of [[-2,10,10],[-1,8,12],[0,7,13],[1,6,14]]) for(let x=a;x<=b;x++) put(x,y,'g');
  for(const [x,y] of [[10,-1],[8,0],[10,0],[12,0],[9,1],[11,1]]) put(x,y,'e');        // 火
  for(let x=-2;x<=22;x++) put(x,2,x===-2||x===22?'O':'g');                         // viền vành trắng
  for(let x=-1;x<=21;x++) put(x,3,'x');                                              // bóng dưới vành
  // viền 1px cho phần mới
  const src=G.map(r=>r.slice());
  for(let y=0;y<G.length;y++) for(let x=0;x<GW;x++){ if(src[y][x]!=='.') continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=src[y+dy]&&src[y+dy][x+dx]; if(c==='g'||c==='o'||c==='e'||c==='x'){ G[y][x]='O'; break; } } }
  return G;
}
function puffs(G,blobs,spark){
  for(const [cx,cy,r] of blobs) for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++){
    const d=Math.hypot(x-cx,y-cy), gy=y+TOP, gx=x+PAD; if(d>r||gy<0||gy>=G.length||gx<0||gx>=G[0].length) continue;
    G[gy][gx]=d>r-1?'u':d>r-2.2?'o':'g'; }
  if(spark) for(const [x,y] of spark){ for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){ const gy=y+dy+TOP, gx=x+dx+PAD; if(G[gy]&&G[gy][gx]!==undefined) G[gy][gx]=dx||dy?'y':'Y'; } }
  return G;
}
const POSES={hokage:[],saiyan:[],quay:[['high','high',0],['mid','mid',1],['high','mid',0],['mid','high',1]],
  noi:[['open'],['closed'],['wide'],['closed']]};
const SPEECH={text:'VÃI Ò', x:10};   // x: cột trái của khung chat trong lưới tư thế (rộng 32)
function poseFrames(name,o){
  if(name==='saiyan') return o.saiyan?saiyanFrames(o):[];
  if(name==='hokage'){ const f=(form,blobs,spark)=>({grid:puffs(hokageGrid(o,form),blobs||[],spark),bob:0,pad:PAD,padTop:TOP});
    return [f(false),
      f(false,[[2,31,3],[18,30,3],[10,34,2]]),
      f(false,[[10,6,8],[3,16,6],[17,16,6],[10,24,8],[3,30,5],[17,30,5],[10,-4,5]]),
      f(true,[[-2,28,3],[22,26,3],[10,-8,3],[-1,8,2],[21,6,2]]),
      f(true,[],[[-3,-6],[23,-2],[-2,20],[23,22]]),
      f(true)]; }
  if(name==='noi') return POSES.noi.map(([m])=>({grid:talkFrame(o,m,o.say||SPEECH.text,SPEECH.x),bob:0,pad:PAD,padTop:TOP,bubbleRows:TOP}));
  return (POSES[name]||[]).map(([l,r,bob])=>({grid:quayFrame(o,l,r),bob,pad:PAD,padTop:0}));
}

// nhóm màu: mỗi nhóm có một màu nền, các tông khác suy ra theo tỉ lệ của ref
const GROUPS={skin:['S','s','d','L','n','m'],hair:['H','h','X','J'],cap:['C','c'],top:['T','t','q'],inner:['I','i'],
  shirt:['W','w'],tie:['R','r'],pants:['P','p'],shoes:['F','f'],mask:['K','k'],gold:['Y','y'],
  print:['B','b'],line:['D'],tattoo:['M'],tattoo2:['N'],buckle:['U'],watch:['A'],beard:['z']};
const hx=h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
function cool(c,k){ return [c[0]*k*.97,c[1]*k,c[2]*k*1.08+(1-k)*24].map(v=>Math.max(0,Math.min(255,Math.round(v)))); }
function tone(base,refBase,refTone){
  return base.map((u,c)=>{ const b=refBase[c]||1, t=refTone[c];
    const v=t<=b? u*t/b : u+(255-u)*(t-b)/Math.max(1,255-b);
    return Math.max(0,Math.min(255,Math.round(v))); });
}
// colors: {skin:[r,g,b], hair:[..], ...}; thiếu nhóm nào thì dùng màu ref
function palette(colors){
  const out={};
  for(const k in DEFAULT) out[k]=hx(DEFAULT[k]);
  for(const g in GROUPS){ const c=colors[g]; if(!c) continue; const keys=GROUPS[g], rb=hx(DEFAULT[keys[0]]);
    if(g==='skin'||g==='hair'){ for(const k of keys) out[k]=k===keys[0]?c.slice():tone(c,rb,hx(DEFAULT[k])); continue; }
    // vải: bóng nghiêng lạnh (xám xanh) như áo y tá trong ref, không ăn theo màu áo ref
    out[keys[0]]=c.slice(); if(keys[1]) out[keys[1]]=cool(c,.76); if(keys[2]) out[keys[2]]=cool(c,.55);
    if(g==='pants') out.j=c.map(v=>Math.round(v+(255-v)*.32)); }   // vệt sáng quần da
  // tóc/áo/quần rất tối: nâng tông bóng để vẫn tách được khỏi viền
  return out;
}

/* ---------- Hoá Saiyan: đổi form đầu ----------
   Gồng (nắm đấm chĩa xuống, há miệng hét), hào quang vàng-cam bốc lửa nhọn, sét trắng vàng,
   tóc loé sáng rồi chuyển sang tóc của form mới. 1/2 hào quang (ngoài/trong), 3 sét + loé,
   4–7 tóc form mới (nền/bóng/sâu/sáng) — màu do palExtra cấp. */
const HAIR_CH={H:'4',h:'5',X:'6',J:'7'};
function powerGrid(o,fist){
  const rows=compose(o), GW=W+PAD*2, G=Array.from({length:H+TOP},()=>Array(GW).fill('.'));
  if(!o.mask){ for(const x of [12,13,14]){ rows[15][x]='E'; rows[16][x]='m'; } }        // hét
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) G[y+TOP][x+PAD]=rows[y][x];
  const put=(x,y,c)=>{ const gy=y+TOP, gx=x+PAD; if(gy>=0&&gy<G.length&&gx>=0&&gx<GW) G[gy][gx]=c; };
  if(fist){
    for(let y=24;y<=28;y++){ for(let x=0;x<=6;x++) put(x,y,'.'); for(let x=16;x<W;x++) put(x,y,'.'); }
    for(let y=24;y<=27;y++){ put(7,y,'O'); put(15,y,'O'); } put(5,28,'O'); put(16,28,'O');
    // chân dạng
    for(let y=29;y<H;y++){ const gy=y+TOP, row=G[gy].slice(), mid=11+PAD; for(let x=0;x<GW;x++) G[gy][x]='.';
      for(let x=0;x<GW;x++){ const c=row[x]; if(c==='.') continue; if(x<mid) G[gy][x-1]=c; else if(x+1<GW) G[gy][x+1]=c; } }
    const arm=(pts)=>{ pts.forEach(([x,y],i)=>{ const cl=i<2&&o.top==='tee'?'T':i<6&&o.top!=='tee'?'T':'S';
        put(x,y,cl); put(x+1,y,cl); put(x,y+1,cl); put(x+1,y+1,cl==='T'?'t':'s'); });
      const [fx,fy]=pts[pts.length-1]; put(fx,fy+2,'S'); put(fx+1,fy+2,'s'); put(fx,fy+1,'S'); put(fx+1,fy+1,'d'); };
    arm([[3,21],[2,22],[1,23],[0,24],[0,25],[-1,26]]); arm([[16,21],[17,22],[18,23],[18,24],[19,25],[19,26]]);
    const src=G.map(r=>r.slice());
    for(let y=0;y<G.length;y++) for(let x=0;x<GW;x++){ if(src[y][x]!=='.') continue;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=src[y+dy]&&src[y+dy][x+dx]; if(c&&c!=='.'&&c!=='O'){ G[y][x]='O'; break; } } }
  }
  return G;
}
function aura(G,r,seed){
  const Hh=G.length, Ww=G[0].length, M=G.map(row=>row.map(c=>c!=='.'));
  const near=(x,y,d)=>{ for(let dy=-d;dy<=d;dy++) for(let dx=-d;dx<=d;dx++){ if(dx*dx+dy*dy>d*d+1) continue; const yy=y+dy, xx=x+dx; if(M[yy]&&M[yy][xx]) return true; } return false; };
  for(let y=0;y<Hh;y++) for(let x=0;x<Ww;x++){ if(M[y][x]) continue;
    if(near(x,y,1)) G[y][x]='2';
    else if(near(x,y,r)) G[y][x]='1';
    else { // ngọn lửa nhọn bốc lên phía trên người
      let up=0; for(let k=1;k<=r+4;k++) if(M[y+k]&&M[y+k][x]){ up=k; break; }
      if(up&&((x*5+seed*3)%4)<2&&up<=r+((x+seed)%3)+2) G[y][x]='1'; } }
  return G;
}
function bolt(G,pts){ for(const [x,y] of pts){ const gy=y+TOP, gx=x+PAD; if(G[gy]&&G[gy][gx]==='1'||G[gy]&&G[gy][gx]==='.'||G[gy]&&G[gy][gx]==='2') G[gy][gx]='3'; } return G; }
function hairTo(G,ch){ for(let y=0;y<TOP+18;y++) for(let x=0;x<G[0].length;x++){ const c=G[y][x]; if(HAIR_CH[c]) G[y][x]=typeof ch==='function'?ch(x,y,c):ch; } return G; }
function saiyanFrames(o){
  const to={...o,...o.saiyan.toOpts}, palExtra={};
  const tp=palette({hair:o.saiyan.toHair}); for(const k in HAIR_CH) palExtra[HAIR_CH[k]]=tp[k];
  const mk=(G,bob=0)=>({grid:G,bob,pad:PAD,padTop:TOP,palExtra});
  const toHair=G=>hairTo(G,(x,y,c)=>HAIR_CH[c]);
  const L1=[[-3,10],[-4,12],[-3,13],[-5,15],[-4,17]], L2=[[22,8],[23,10],[22,11],[24,13],[23,15]], L3=[[-4,22],[-5,24],[-4,25],[-6,27]], L4=[[23,20],[24,22],[23,23],[25,25]];
  return [
    mk(aura(powerGrid(o,true),1,0)),
    mk(bolt(aura(hairTo(powerGrid(o,true),(x,y)=>(x+y)%2?'3':'1'),2,1),L1)),
    mk(bolt(bolt(aura(toHair(powerGrid(to,true)),3,2),L2),L3),-1),
    mk(bolt(aura(toHair(powerGrid(to,true)),3,3),L4),-1),
    mk(aura(toHair(powerGrid(to,true)),2,4)),
    mk(aura(toHair(powerGrid(to,false)),1,5)),
  ];
}

/* ---------- Thú cưng: beagle (nhìn nghiêng sang phải) ----------
   Vẽ phần ruột rồi tự thêm viền 1px như ref. B/b/L nâu (nền/bóng/sáng) · W/w trắng · E mắt · N mũi
   T/t lưỡi · K/k vòng cổ đỏ · O nét trong. Khung 24×18, chân chạm đáy. */
const PET_W=24, PET_H=18;
const BEAGLE_HEAD=[                 // hàng 1–6: đầu, tai cụp nâu, vệt trắng giữa trán, mõm trắng
  '..............LBBB......',
  '..W.........BBBBBBB.....',
  '..W........bBBBWWBBB....',
  '..B........bOBBWWBEBB...',
  '..B........bbOBWWWWWWWN.',
  '...B.......bbOBWWWWWWW..'];
const BEAGLE_STAND=[                // hàng 7–14: thân nâu, bụng ngực trắng, vòng cổ, 4 chân trắng
  '...BBBBBBBBbbOBBWWTTW...',
  '...BBBBBBBBBbbKKKWWT....',
  '...bLBBBBBBBBBBkWWW.....',
  '...bBBBwWWWWWWWWWW......',
  '...bBBwWWWWWWWWWww......',
  '....WW.WW....WW.WW......',
  '....WW.WW....WW.WW......',
  '....ww.ww....ww.ww......'];
const BEAGLE_SIT=[                  // ngồi: mông nâu sát đất, chân trước thẳng, đuôi nằm đất
  '........BBBbbOBBWWTTW...',
  '.......BBBBBbbKKKWWT....',
  '......bLBBBBBBBkWWW.....',
  '......bBBBBBBWWWWW......',
  '......bBBBBBwWWWWW......',
  '.....bBBBBBw.WW.WW......',
  '.WBBbbWWWWw..WW.WW......',
  '......wwww...ww.ww......'];
function petGrid(head,body){
  const G=Array.from({length:PET_H},()=>Array(PET_W).fill('.'));
  [...head,...body].forEach((r,i)=>[...r].forEach((c,x)=>{ if(c!=='.') G[i+2][x]=c; }));
  return G;
}
function petOutline(G){
  const src=G.map(r=>r.slice());
  for(let y=0;y<PET_H;y++) for(let x=0;x<PET_W;x++){ if(src[y][x]!=='.') continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=src[y+dy]&&src[y+dy][x+dx]; if(c&&c!=='.'&&c!=='O'){ G[y][x]='O'; break; } } }
  return G;
}
// biến đổi trên lưới: dịch một nhóm pixel (chân, đuôi, lưỡi) mà không vẽ lại cả con
function petPose(base,{legs=[0,0,0,0],lift=[0,0,0,0],bob=0,tail=0,tongue=1,ear=0}={}){
  const G=Array.from({length:PET_H},()=>Array(PET_W).fill('.'));
  const legCols=[[4,5],[7,8],[13,14],[16,17]];          // chân sau xa, sau gần, trước xa, trước gần
  const legOf=(x,y)=>y>=14?legCols.findIndex(([a,b])=>x>=a&&x<=b):-1;
  for(let y=0;y<PET_H;y++) for(let x=0;x<PET_W;x++){ const c=base[y][x]; if(c==='.') continue;
    const L=legOf(x,y);
    if(L>=0){ const ny=y-lift[L]; if(y>=15&&lift[L]&&y===16) continue; const nx=x+legs[L]; if(G[ny]&&nx>=0&&nx<PET_W) G[ny][nx]=c; continue; }
    let nx=x, ny=y+bob;
    if(y<=7&&x<=3&&tail){ nx=x+(y<=5?tail:0); }                       // vẫy đuôi
    if(ear&&(c==='b'||c==='O')&&x>=11&&x<=13&&y>=5&&y<=10) ny-=ear;    // tai bay khi chạy
    if(G[ny]&&nx>=0&&nx<PET_W) G[ny][nx]=c; }
  if(tongue===2) for(const [x,y] of [[19,10+bob],[20,10+bob]]) if(G[y]&&G[y][x]==='.') G[y][x]='t';   // lưỡi thè dài
  if(tongue===0) for(let y=0;y<PET_H;y++) for(let x=0;x<PET_W;x++) if(G[y][x]==='T') G[y][x]='W';
  return petOutline(G);
}
const PETS={
  beagle:{name:'Beagle',
    palette:{O:'1c1516',B:'c98a45',b:'97612e',L:'e0aa66',W:'f6f1e7',w:'c9c3bd',E:'1c1516',N:'1c1516',T:'e8798a',t:'b9566a',K:'c4382e',k:'8c231f'},
    build(){
      const stand=petGrid(BEAGLE_HEAD,BEAGLE_STAND), sit=petGrid(BEAGLE_HEAD.map(r=>r),BEAGLE_SIT);
      return {
        idle:[petPose(stand,{tongue:1}),petPose(stand,{tail:1,tongue:2}),petPose(stand,{tongue:1,bob:0}),petPose(stand,{tail:1,tongue:2})],
        walk:[petPose(stand,{legs:[1,-1,1,-1]}),petPose(stand,{lift:[0,1,1,0],bob:-1,tail:1}),
              petPose(stand,{legs:[-1,1,-1,1]}),petPose(stand,{lift:[1,0,0,1],bob:-1,tail:1})],
        run:[petPose(stand,{legs:[-2,-2,2,2],bob:-1,ear:1,tongue:2}),petPose(stand,{legs:[1,1,-1,-1],lift:[1,1,1,1],bob:-2,ear:1,tongue:2}),
             petPose(stand,{legs:[2,2,-1,-1],bob:0,tongue:2}),petPose(stand,{legs:[0,0,1,1],lift:[1,1,0,0],bob:-1,ear:1,tongue:2})],
        sit:[petPose(sit,{tongue:1}),petPose(sit,{tongue:2})],
      };
    },
    fps:{idle:6,walk:8,run:12,sit:3}},
};

/* ---------- Mặt trước (nhìn xuống) và sau lưng (nhìn lên) ----------
   Cùng khung 20×35, cùng bảng ký tự với dáng nghiêng. Vẽ phần ruột, viền ngoài 1px tự thêm như ref.
   Đầu: sọ đối xứng, 2 tai ở cột 1 và 18 (hàng 10–12), mắt 1×2 ở cột 6 và 13. */
const SK=[[99,-1],[7,12],[5,14],[4,15],[3,16],[3,16],[2,17],[2,17],[2,17],[2,17],[2,17],[2,17],[2,17],[2,17],[3,16],[3,16],[4,15],[5,14]];
const inSkull=(x,y)=>y>=1&&y<SK.length&&x>=SK[y][0]&&x<=SK[y][1];
const FB={ // thân mặt trước, hàng 18–33 (áo thun, quần dài)
  front:[
    '........dddd........',
    '.....TTTTSSTTTT.....',
    '...TTTTTTSSTTTTTT...',
    '..tTTTTTTTTTTTTTTt..',
    '..tTTTTTTTTTTTTTTt..',
    '..qqTTTTTTTTTTTTqq..',
    '..SSOtTTTTTTTTtOSS..',
    '..SSOtTTTTTTTTtOSS..',
    '..SsOOOOOUUOOOOOsS..',
    '..ddOPPPPPPPPPPOdd..',
    '.....PPPPPPPPPP.....',
    '.....PPPp..pPPP.....',
    '.....PPPp..pPPP.....',
    '.....pPPp..pPPp.....',
    '....FFFFf..fFFFF....',
    '....fffff..fffff....'],
  back:[
    '........dddd........',
    '.....TTTTTTTTTT.....',
    '...TTTTTTTTTTTTTT...',
    '..tTTTTTTTTTTTTTTt..',
    '..tTTTTTTqqTTTTTTt..',
    '..qqTTTTTqqTTTTTqq..',
    '..SSOtTTTTTTTTtOSS..',
    '..SSOtTTTTTTTTtOSS..',
    '..SsOOOOOOOOOOOOsS..',
    '..ddOPPPPPPPPPPOdd..',
    '.....PpPPPPPPpP.....',
    '.....PPPp..pPPP.....',
    '.....PPPp..pPPP.....',
    '.....pPPp..pPPp.....',
    '....fFFFF..FFFFf....',
    '....fffff..fffff....']};

// tóc theo kiểu, trả ký tự cho ô (x,y) hoặc null. front=true mặt trước, false sau lưng
function hairAt(st,x,y,front){
  const skull=inSkull(x,y), side=x<=3||x>=16, sh=(x>=13?'h':'H'), stub=(x+y)%2?'H':'h';
  const hi=(y===1||y===2)&&(x===6||x===7);
  if(!front){ // sau lưng
    switch(st){
      case 'bald': return null;
      case 'buzz': return skull&&y<=11?((x*3+y*5)%7===0?'h':sh):null;   // sau gáy: tóc sát, chấm lởm chởm thưa
      case 'fade': return skull&&y<=12?(y>=9?((x+y)%2?'X':'S'):(hi?'J':sh)):null;
      case 'undercut': return skull&&y<=11?(y>=9?((x+y)%3?'X':'S'):(hi?'J':sh)):null;   // gáy cạo: tóc tối xen da
      case 'cap': if(skull&&y<=5) return y===5&&(x===9||x===10)?'h':(x>=13?'c':'C'); if(y===6&&skull) return 'c'; return skull&&y<=9?'h':null;
      case 'shag': if(skull&&y<=15) return y>=13&&x%2?'X':(hi?'J':sh); return (x===1||x===18)&&y>=7&&y<=15?'h':null;
      case 'long': if(skull&&y<=16) return hi?'J':sh; if(y>=17&&y<=25&&x>=4&&x<=15) return y===25&&x%2?null:(x>=12?'h':'H'); return (x===1||x===18)&&y>=7&&y<=14?'h':null;
      case 'ponytail': if(skull&&y<=12) return hi?'J':sh; if(y===13&&x>=8&&x<=11) return 'D'; return y>=14&&y<=22&&x>=8&&x<=11?(x>=10?'h':'H'):null;
      case 'bun': if(y>=1&&y<=2&&x>=6&&x<=13&&!skull) return 'H'; return skull&&y<=12?(hi?'J':sh):null;
      case 'afro': { const d=((x-9.5)/10)**2+((y-6.5)/8)**2; return d<=1&&y>=1&&y<=13?((x+y)%2?'H':'h'):null; }
      default: { const tips=st==='messy'||st==='fringe'; if(skull&&y<=13) return y===13&&tips&&x%2?null:(y>=12?'X':(hi?'J':sh)); return null; }
    }
  }
  switch(st){ // mặt trước
    case 'bald': return null;
    case 'buzz': if(skull&&y<=3) return (x*3+y*5)%7===0?'h':sh; if(skull&&y===4&&x>=4&&x<=15) return 'h'; return skull&&side&&y<=6?'h':null;
    case 'fade': if(skull&&y<=4) return hi?'J':sh; if(skull&&y===5) return 'h'; return skull&&side&&y<=9?((x+y)%2?'X':'S'):null;
    case 'swept': if(skull&&y<=5) return hi?'J':sh; if(skull&&y>=6&&y<=8&&x<=11-(y-6)*3) return y===8||x===11-(y-6)*3?'X':'h'; return skull&&side&&y<=9?'h':null;
    case 'messy': if(skull&&y<=6) return hi||(x===11&&y===3)?'J':sh; if(skull&&y===7&&x%3!==1) return 'h'; if(skull&&y===8&&x%3===0) return 'X'; return skull&&side&&y<=9?'h':null;
    case 'fringe': if(x===13&&y===1) return 'H'; if(skull&&y<=7) return hi?'J':sh; if(skull&&y===8) return x%2?'X':'h'; if(skull&&y===9&&x%3===1&&!side) return 'X'; return skull&&side&&y<=10?'X':null;
    case 'undercut': if(skull&&y<=5) return hi?'J':sh; if(skull&&y===6&&x<=9&&!side) return 'X'; return skull&&side&&y<=10?'X':null;
    case 'bowl': if(skull&&y<=7) return hi?'J':sh; if(skull&&y===8) return 'X'; return skull&&side&&y<=11?'h':null;
    case 'shag': if(skull&&y<=6) return hi?'J':sh; if(skull&&y>=7&&y<=9&&!side&&(x+y)%3!==0) return y===9?'X':'h'; if(skull&&side&&y<=14) return x<=2||x>=17?'X':'h'; return (x===1||x===18)&&y>=7&&y<=14?'h':null;
    case 'long': if(skull&&y<=5) return hi?'J':sh; if(skull&&y>=6&&y<=8&&x<=11-(y-6)*3) return 'h'; if((skull||x===1||x===18)&&side&&y<=24&&y>=6) return x<=2||x>=17?'X':'h'; return (x>=1&&x<=3||x>=16&&x<=18)&&y>=18&&y<=24?'h':null;
    case 'ponytail': if(skull&&y<=6) return hi?'J':sh; if(skull&&y===7&&x>=4&&x<=8) return 'X'; return skull&&side&&y<=9?'h':null;
    case 'bun': if(y>=1&&y<=3&&x>=12&&x<=15&&!skull) return 'H'; if(skull&&y<=6) return hi?'J':sh; return skull&&side&&y<=9?'h':null;
    case 'afro': { const d=((x-9.5)/10)**2+((y-6)/7.5)**2; if(d<=1&&y>=1&&(y<=7||!skull)) return (x+y)%2?'H':'h'; return null; }
    case 'cap': if(skull&&y<=4) return x>=13?'c':'C'; if(y===5&&x>=2&&x<=17) return 'C'; if(y===6&&x>=2&&x<=17) return 'c'; return skull&&side&&y>=7&&y<=9?'h':null;
    default: if(skull&&y<=6) return hi?'J':sh; if(skull&&y===7&&!side) return 'X'; return skull&&side&&y<=9?'h':null;
  }
}
function composeView(o,view){
  const front=view==='front', R=Array.from({length:H},()=>Array(W).fill('.'));
  // sọ + tai + bóng da (sáng trên-trái, bóng phải-dưới)
  for(let y=1;y<SK.length;y++) for(let x=SK[y][0];x<=SK[y][1];x++) R[y][x]=x>=15&&y>=5?'s':y===17?(x===5||x===14?'d':'s'):'S';
  for(const y of [10,11,12]){ R[y][1]=y===12?'d':'s'; R[y][18]=y===12?'d':'s'; } R[11][1]='d'; R[11][18]='d';
  if(!front) for(let y=13;y<=17;y++) for(let x=SK[y][0];x<=SK[y][1];x++) R[y][x]=x>=14?'d':'s';      // gáy
  if(o.hair==='bald'){ R[1][7]='L'; R[1][8]='L'; R[2][6]='L'; }
  // tóc
  for(let y=0;y<26;y++) for(let x=0;x<W;x++){ const c=hairAt(o.hair,x,y,front); if(c) R[y][x]=c; }
  // ngay dưới chân tóc: bóng da
  if(front) for(let x=2;x<=17;x++) for(let y=4;y<12;y++){ if('HhXJCc'.includes(R[y][x])&&R[y+1][x]==='S'){ R[y+1][x]='s'; break; } }
  // thân
  const rows=FB[front?'front':'back'].map(r=>r.split(''));
  const top=o.top||'tee', open=top==='jacket'||top==='suit'||top==='cardigan';
  if(top!=='tee'){ for(const [a,b] of [[2,3],[16,17]]){ R; rows[5][a]='t'; rows[5][b]='T'; for(const y of [6,7]){ rows[y][a]='T'; rows[y][b]='t'; } } for(const x of [2,3,16,17]) rows[7][x]='q'; }
  if(front&&open){ const [a,b,ch]=top==='cardigan'?[7,12,'I']:top==='suit'?[8,11,'W']:[8,11,'I'];
    for(let y=1;y<=7;y++){ for(let x=a;x<=b;x++) rows[y][x]=ch==='I'&&y>=4&&(x===Math.floor((a+b)/2))?'i':ch; rows[y][a-1]='O'; rows[y][b+1]='O'; }
    if(top==='suit'){ rows[1][9]='R'; rows[1][10]='R'; for(let y=2;y<=6;y++){ rows[y][9]='R'; rows[y][10]=y>=5?'r':'R'; } } }
  if(top==='cardigan') for(const y of [9,10]){ rows[y][5]='T'; rows[y][14]='T'; }
  if(o.turtle){ for(let x=7;x<=12;x++) rows[0][x]=(x%2?'i':'I'); if(!open){ for(let x=7;x<=12;x++) rows[0][x]=x%2?'t':'T'; rows[1][9]=rows[1][10]=rows[2][9]=rows[2][10]='T'; } else { rows[1][9]=rows[1][10]='I'; } }
  if(o.bottom==='shorts'){ for(const y of [12,13]){ rows[y][5]='.'; rows[y][14]='.'; rows[y][6]='S'; rows[y][7]='S'; rows[y][8]='s'; rows[y][11]='s'; rows[y][12]='S'; rows[y][13]='S'; } for(const x of [5,6,7,8,11,12,13,14]) rows[11][x]=rows[11][x]==='.'?'.':'p'; }
  if(o.bottom==='skirt'){ for(let y=10;y<=12;y++) for(let x=4;x<=15;x++) rows[y][x]=y===12?'p':'P'; rows[13]=('......SS....SS......').split(''); }
  rows.forEach((r,i)=>{ R[18+i]=r.map((c,x)=>c==='.'&&R[18+i][x]!=='.'?R[18+i][x]:c); });
  // hoạ tiết áo + phụ kiện
  if(o.plaid) plaid(R); if(o.floral) floral(R); if(o.polka) polka(R,18,34); if(o.vstripe) vstripe(R,18,26);
  const put=(pts,ch)=>{ for(const [x,y] of pts) if(R[y]) R[y][x]=ch; };
  if(o.polo&&!open){ if(front){ put([[7,19],[8,19],[11,19],[12,19],[8,20],[11,20]],'B'); put([[9,20],[10,20]],'T'); put([[9,21]],'D'); } else put([[6,19],[7,19],[8,19],[9,19],[10,19],[11,19],[12,19],[13,19]],'B'); put([[2,23],[3,23],[16,23],[17,23]],'B'); }   // polo: cổ bẻ, nẹp cúc, viền tay
  if(o.logo&&!open){ if(front) put([[12,21],[13,21],[13,22]],'B'),put([[12,22]],'b'); else put([[9,21],[10,21],[8,22],[11,22],[9,23]],'B'),put([[10,23]],'b'); }   // logo: ngực trái, sau lưng to hơn
  if(o.hair==='cap'&&o.capPattern) for(let y=0;y<=5;y++) for(let x=0;x<W;x++) if(R[y][x]==='C'&&(x*2+y)%4===0) R[y][x]='c';
  if(o.hair==='cap'&&o.mongCap) mongCap(R,false,!front);
  if(front){
    if(o.hair==='cap'&&o.capWeb) put([[4,2],[4,3]],'v'),put([[5,2],[5,3]],'Z'),put([[6,2],[6,3]],'v');
    if(o.brows!==false) put([[5,10],[6,10],[7,10],[12,10],[13,10],[14,10]],'X');
    put([[6,11],[6,12],[13,11],[13,12]],'E'); put([[10,13]],'n');
    if(o.mouth==='smile') { put([[8,15],[11,15]],'m'); put([[9,15],[10,15]],'g'); put([[9,16],[10,16]],'m'); }
    else if(o.mouth==='smirk') { put([[9,15],[10,15]],'m'); put([[11,14]],'m'); }
    else put([[9,15],[10,15]],'m');
    if(o.beard&&!o.mask){ put([[8,14],[9,14],[10,14],[11,14]],'z'); if(o.beard==='goatee') put([[9,16],[10,16],[9,17],[10,17]],'z'); }
    if(o.mask){ for(let y=13;y<=17;y++) for(let x=0;x<W;x++) if(inSkull(x,y)) R[y][x]=y===15||y===17?'k':'K'; put([[2,12],[17,12]],'k'); }
    if(o.glasses){ put([[5,10],[6,10],[7,10],[12,10],[13,10],[14,10],[4,11],[4,12],[8,11],[8,12],[11,11],[11,12],[15,11],[15,12],[5,13],[6,13],[7,13],[12,13],[13,13],[14,13],[9,11],[10,11],[3,11],[16,11]],'G');
      if(o.glasses==='sun'){ put([[5,11],[6,11],[7,11],[5,12],[6,12],[7,12],[12,11],[13,11],[14,11],[12,12],[13,12],[14,12]],'G'); put([[5,11],[12,11]],'u'); }
      if(o.glasses==='tint'){ put([[5,11],[7,11],[5,12],[7,12],[12,11],[14,11],[12,12],[14,12]],o.lensO?'2':'4'); put([[5,11],[12,11]],o.lensO?'3':'5'); put([[4,10],[15,10],[8,10],[11,10]],'G'); } }
    if(o.earring) put([[18,13]],'V');
    if(o.chain&&top!=='suit') { if(open||o.turtle) put([[8,19],[11,19],[9,20],[10,20]],'Y'),put([[9,21],[9,22]],'y'); else put([[7,19],[12,19],[8,20],[11,20],[9,21],[10,21]],'Y'),put([[9,22],[10,22]],'y'); }
    if(o.idcard&&!o.chain) put([[8,19],[11,19],[9,20],[10,20]],'D'),put([[9,21],[10,21],[9,22]],'Z'),put([[10,22]],'g');
    if(o.tie&&(top==='tee'||top==='long')) put([[8,19],[11,19]],'W'),put([[9,19],[10,19],[9,20],[9,21],[9,22],[9,23]],'R'),put([[9,24]],'r');
    if(o.print&&!open) put([[7,21],[12,21],[7,22],[8,22],[11,22],[12,22],[8,23],[9,23],[10,23],[11,23],[8,24],[11,24]],'B'),put([[9,22],[10,22]],'b');
    if(o.rips&&(o.bottom||'pants')==='pants') put([[6,30],[13,30]],'l'),put([[7,30],[12,29]],'S');
    if(o.cigarette) put([[0,27]],'Z'),put([[1,27]],'Q'),put([[0,24],[1,23]],'u');
  }
  if(o.tattoo&&top==='tee') put([[2,24],[3,25],[17,24],[16,25]],'M'),put([[3,24],[2,25],[16,24],[17,25]],'N');
  if(o.bracelet) put([[2,26],[3,26],[16,26],[17,26]],'Y');
  if(o.watch) put([[16,26],[17,26]],'A');
  if(o.leather&&(o.bottom||'pants')==='pants') put([[6,28],[6,29],[6,30],[13,28],[13,29],[13,30]],'j');
  return R;
}
function outlineGrid(G){ const src=G.map(r=>r.slice());
  for(let y=0;y<G.length;y++) for(let x=0;x<G[0].length;x++){ if(src[y][x]!=='.') continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=src[y+dy]&&src[y+dy][x+dx]; if(c&&c!=='.'&&c!=='O'&&c!=='u'&&c!=='Q'&&c!=='Z'){ G[y][x]='O'; break; } } }
  return G; }
// đứng / đi / chạy cho 2 hướng: chân nhấc xen kẽ, tay vung lên xuống, người nhún
function viewPose(R,{lift=[0,0],arm=[0,0],bob=0}={}){
  const G=Array.from({length:H},()=>Array(W).fill('.'));
  const legL=x=>x<=9;
  for(let y=29;y<H;y++) for(let x=0;x<W;x++){ const c=R[y][x]; if(c==='.') continue; const ny=y-lift[legL(x)?0:1]; if(G[ny]) G[ny][x]=c; }
  for(let y=0;y<29;y++) for(let x=0;x<W;x++){ const c=R[y][x]; if(c==='.') continue;
    const hand=y>=24&&(x<=3||x>=16), ny=y+bob+(hand?arm[x<=3?0:1]:0); if(G[ny]&&ny<H) G[ny][x]=c; }
  return outlineGrid(G);
}
function viewFrames(o,view){
  const R=composeView(o,view);
  return {
    idle:[viewPose(R),viewPose(R),viewPose(R,{bob:1}),viewPose(R,{bob:1})],
    walk:[viewPose(R,{lift:[1,0],arm:[0,1]}),viewPose(R,{bob:1}),viewPose(R,{lift:[0,1],arm:[1,0]}),viewPose(R,{bob:1})],
    run:[viewPose(R,{lift:[2,0],arm:[0,1],bob:-1}),viewPose(R,{bob:1}),viewPose(R,{lift:[0,2],arm:[1,0],bob:-1}),viewPose(R,{bob:1})],
  };
}

// nhân vật dựng sẵn (màu hex, không cần ảnh nguồn)
const PRESETS={
  menmen:{name:'Mèn Mén',file:'men_men',
    opts:{hair:'fringe',top:'cardigan',bottom:'pants',brows:true,turtle:true,chain:true,noi:true},
    colors:{hair:'211c21',skin:'f5bf9e',top:'2b282c',inner:'e4e9eb',pants:'2c2e38',shoes:'ebeae6',gold:'a8aeb6'}},
  phule:{name:'Phú Lê',file:'phu_le',
    opts:{hair:'bald',top:'tee',bottom:'pants',brows:true,chain:true,print:true,tattoo:true,bracelet:true,leather:true,mouth:'smirk'},
    colors:{skin:'eeaa88',hair:'2a2226',top:'2b282e',print:'e2b13a',gold:'e8b83a',tattoo:'3f8070',tattoo2:'c75a3a',pants:'2a282e',shoes:'1f1d22'}},
  donche:{name:'Đôn Chề',file:'don_che',
    opts:{hair:'cap',capPattern:true,capWeb:true,mask:true,top:'long',plaid:true,bottom:'pants',cigarette:true,brows:true},
    colors:{skin:'d99a78',hair:'2b2326',cap:'b49b78',top:'c8a77d',print:'b4473c',line:'554850',pants:'303846',shoes:'a5302b',mask:'9ea1a7'}},
  khabanh:{name:'Khá Bảnh',file:'kha_banh',
    opts:{hair:'undercut',top:'tee',bottom:'pants',brows:true,earring:true,tattoo:true,watch:true,rips:true,mouth:'smirk',quay:true,prop:true},
    colors:{skin:'e6ab8a',hair:'7a4630',top:'f1f1ee',tattoo:'3d4844',tattoo2:'56635d',pants:'6d90bb',shoes:'efefea',buckle:'c9ccd0'}},
  kennyho:{name:'Kenny Ho',file:'kenny_ho',
    opts:{hair:'fade',glasses:'sun',top:'tee',tie:true,bottom:'shorts',brows:true,mouth:'line'},
    colors:{hair:'1e1a1f',skin:'f1b896',top:'26252b',shirt:'a9b4c4',tie:'6f7d93',pants:'2c3446',shoes:'eeeeea'}},
  huyphan:{name:'Huy Phan',file:'huy_phan',
    opts:{hair:'undercut',glasses:'yes',top:'tee',floral:true,bottom:'shorts',brows:true,mouth:'smile',watch:true,hokage:true},
    colors:{hair:'1d1a1e',skin:'eab08c',top:'2e2740',print:'8fc4c6',line:'e2b98a',pants:'e8e0cf',shoes:'efede7',watch:'2a2a2f'}},
  phap:{name:'Pháp',file:'phap',
    opts:{top:'tee',bottom:'pants',brows:true,tattoo:true,bracelet:true,idcard:true,pet:'beagle'},
    colors:{skin:'eebc9e',top:'ede6d8',tattoo:'3d4a52',tattoo2:'5c3a3a',gold:'9e3a30',line:'2b2d3a',pants:'394a5e',shoes:'d6d6d2'},
    forms:{
      xanh:{label:'Đầu xanh bạc hà',opts:{hair:'buzz',beard:'goatee',mouth:'line'},colors:{hair:'8ee3d2'}},
      cam:{label:'Đầu cam tóc rối',opts:{hair:'shag',beard:'goatee',mouth:'line'},colors:{hair:'f26b24'}}}},
};
// gộp preset gốc với form đang chọn
function presetData(key,form){ const p=PRESETS[key]; if(!p) return null;
  const fk=p.forms?(p.forms[form]?form:Object.keys(p.forms)[0]):null, f=fk?p.forms[fk]:{};
  return {name:p.name+(fk?' · '+f.label:''),file:p.file+(fk?'_'+fk:''),folder:p.file,form:fk,forms:p.forms||null,
    opts:{...p.opts,...(f.opts||{})},colors:{...p.colors,...(f.colors||{})}}; }

window.RefTemplate={W,H,PETS,PET_W,PET_H,composeView,viewFrames,HAIR,TOP:TOP_PARTS,BOTTOM,OVER,DEFAULT,GROUPS,PRESETS,POSES,SPEECH,presetData,compose,poseFrames,bubble,palette,validate,hx,
  hairStyles:Object.keys(HAIR),tops:Object.keys(TOP_PARTS),bottoms:Object.keys(BOTTOM)};
})();
