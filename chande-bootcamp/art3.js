/* Chan City — sprite vẽ theo lưới (giống ảnh mẫu người dùng gửi): ngựa, bò sữa, lợn, gà, cá + tôm, bướm, 4 mẫu xe máy.
   Mỗi hàng lưới là các đoạn "x0-x1C" (hoặc "xC") cách nhau dấu cách; viền đen 1px tự thêm như các sprite khác. */
(function(){
const A=ART, cv=A.cv, OUT='#1c1516';
const S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
// vẽ lưới; mirror>0 thì lật đối xứng quanh cột mirror (dùng cho bướm)
function rows(P,R,pal,ox=0,oy=0,mirror=0){ R.forEach((r,y)=>{ if(!r) return; for(const tk of r.split(' ')){ const m=/^(\d+)(?:-(\d+))?(.)$/.exec(tk); if(!m) continue;
  const a=+m[1], b=m[2]?+m[2]:a, c=pal[m[3]]; if(!c) continue; P.rect(ox+a,oy+y,b-a+1,1,c); if(mirror) P.rect(ox+mirror*2-b,oy+y,b-a+1,1,c); } }); }
// chân 4 con vật: L=[[x,xa]...] (far-back, near-back, far-front, near-front), chạy theo khung fr
const WALK_DX=[[-1,1,1,-1],[0,0,0,0],[1,-1,-1,1],[0,0,0,0]], WALK_UP=[[0,0,0,0],[0,1,1,0],[0,0,0,0],[1,0,0,1]];
const RUN_DX=[[-3,-2,3,4],[2,1,-1,-2],[-1,0,2,1],[1,2,-2,-1]], RUN_UP=[[1,1,1,1],[0,0,1,0],[0,1,0,0],[1,0,0,0]];
function legs(P,xs,top,bot,fr,run,near,far,hoof,w=2){ const DX=(run?RUN_DX:WALK_DX)[fr%4], UP=(run?RUN_UP:WALK_UP)[fr%4];
  xs.forEach((x0,i)=>{ const col=i%2?near:far, end=bot-2-UP[i], dx=DX[i];
    for(let y=top;y<=end;y++){ const k=(y-top)/Math.max(1,end-top); P.rect(x0+Math.round(dx*k),y,w,1,col); }
    P.rect(x0+dx,end+1,w,2,hoof); }); }

/* ---------- ngựa (theo ảnh mẫu: nâu, bờm + đuôi nâu đậm, mõm trắng) ---------- */
const HORSE_BODY=['24m 25B','23m 24M 25-26B','22m 23M 24-27B','21m 22-23M 24-25B 26E 27B 28h','20m 21-22M 23-29B','19m 20-21M 22-28B 29-30W',
  '18m 19-20M 21-22B 23-24b 26-27B 28-29W 30w','17m 18-19M 20-22B 23b 28b 29W 30w','16m 17M 18-21B 22b','3-4m 5-16h 17M 18-22B 23b','2m 3M 4m 5-23B 24b',
  '1m 2M 3m 5-23B 24b','0m 1M 5-22B 23b','0-1m 5b 6-21B 22b','1m 6-8b 9-18B 19-22b','2m'];
const SADDLE=['','','','','','','','','11L 14L','10-15S','10-15s','12-13L','12-13L','12-13L'];
const COATS=[{B:'#c47a45',b:'#9c5a30',h:'#e29a52',M:'#6a3424',m:'#48201a'},{B:'#6b4632',b:'#4e3224',h:'#8a5e44',M:'#2a1c18',m:'#1a1210'},
  {B:'#d9a066',b:'#b07a46',h:'#efc08a',M:'#f1e6cc',m:'#cdbf9f'},{B:'#d6d2ca',b:'#aea89e',h:'#f2efe8',M:'#7a746c',m:'#5a5550'}];
// khung 40×30, neo (20,28) như sprite cũ; coat: số bộ màu hoặc mã màu cũ
function horse(fr=0,coat=0,gallop=false,saddle=false){ if(typeof coat==='string') coat=Math.max(0,['#8a5a36','#3a2c24','#c9a87a','#5a3a22'].indexOf(coat));
  const C=COATS[coat%COATS.length], pal={...C,W:'#ece6dc',w:'#c8c0b4',E:OUT,S:'#4f7a3a',s:'#3a5c2c',L:'#6e3a22'}, bob=gallop&&fr%2?1:0;
  return S(40,30,20,28,(g,P)=>{ const ox=3, oy=5-bob; legs(P,[ox+6,ox+9,ox+18,ox+21],oy+15,28,fr,gallop,C.B,C.b,'#3a2418'); rows(P,HORSE_BODY,pal,ox,oy); if(saddle) rows(P,SADDLE,pal,ox,oy); }); }
// toạ độ yên ngựa so với điểm neo (để vẽ người ngồi): x lệch, y mặt yên
horse.seat={dx:-4,dy:-15}; horse.mouth={dx:13,dy:-17};

/* ---------- bò sữa (trắng đốm đen, mõm hồng), lợn hồng, gà ta ---------- */
// bò sữa theo ảnh mẫu: đầu to, mõm hồng to, đốm đen, vú hồng (vẽ quay trái rồi lật cho quay phải)
const COW=['3H 9H','0-2K 3-8W 9-11K','1-2K 3-5W 6-8K 9-10K','2-4W 5E 6-8K 9-19W','2-5W 6-8K 9-12W 13-17K 18-19W','1-6P 7-8K 9-12W 13-17K 18-19W 20w',
  '1P 2E 3P 4E 5-6P 7-11W 12-16K 17-19W 20w','1-6p 7-9W 10-11K 12-14W 15-17K 18-19W 20-21K','2-6W 7-8w 9-10K 11-13W 14-16K 17-19W 20-21K','3-8w 9-11W 12-13K 14-19W','4-6W 7-9w 10-18W 19w','4-8W 9-12w 13-15P 16-19W','13-15p'];
const flipC=c=>{ const o=cv(c.width,c.height), g=o.getContext('2d'); g.translate(c.width,0); g.scale(-1,1); g.drawImage(c,0,0); return o; };
function cow(fr=0){ const sp=S(30,22,15,20,(g,P)=>{ legs(P,[18,21,11,8],15,21,fr,false,'#f6f3ec','#d8d2c6','#3a3a40');
  rows(P,COW,{W:'#f6f3ec',w:'#d8d2c6',K:'#2c2c32',P:'#f4a7a2',p:'#d98079',H:'#e6dcc0',E:OUT},4,4); },false); const c=flipC(sp.c); A.outline(c); return {c,ax:15,ay:20}; }
// lợn theo ảnh mẫu: đầu to, tai vểnh, mõm tròn 2 lỗ, đuôi xoăn
const PIG=['1-3P 11-13P','1-2P 3p 4-10P 11p 12-13P','0-12P 14-19P 21p','0-19P 20-21p','0-9P 10E 11-19P','0-4n 5-19P','0n 1E 2n 3E 4n 5-11P 12p 13-19P','0-4n 5-19P','1-9P 10p 11-19P','2-8p 9-19P','3-19P','3-6p 7-17P 18-19p'];
function pig(fr=0){ const sp=S(24,17,12,15,(g,P)=>{ legs(P,[15,18,7,4],12,16,fr,false,'#f4a8a8','#e07a80','#8a3a44');
  rows(P,PIG,{P:'#f7a8a8',p:'#e07a80',n:'#e07a86',E:'#8a3a44'},1,1); },false); const c=flipC(sp.c); A.outline(c); return {c,ax:12,ay:15}; }
// vịt trời (mallard) theo ảnh mẫu: đầu xanh, mỏ vàng, cổ trắng, ngực nâu, thân xám be; swim: không vẽ chân, có gợn nước
const DUCK=['4-6G','3-7G 5g','0-2Y 3-4G 5E 6-7G','0-3Y 4-7G','4-6C','2-5B 6-11S','1-5B 6-11S','1-4B 5-10S 11s','2-5b 6-10s','3-9b'];
function duck(fr=0,swim=false){ const sp=S(14,13,7,12,(g,P)=>{ rows(P,DUCK,{G:'#4f9a3e',g:'#8fd060',Y:'#f2b33d',E:OUT,C:'#f4f1ea',B:'#7a5444',b:'#5a3a30',S:'#c8bca8',s:'#9a9088'},1,(swim?2:0)+(fr%2&&!swim?1:0));
  if(swim){ g.fillStyle='#bfe6fa'; g.fillRect(0,11,14,1); g.fillRect(2+fr%2,12,9,1); } else { P.rect(5,10,1,2,'#e0743a'); P.rect(8,10,1,2,'#e0743a'); P.rect(4,12,2,1,'#e0743a'); P.rect(7,12,2,1,'#e0743a'); } },false);
  const c=flipC(sp.c); A.outline(c); return {c,ax:7,ay:12}; }
// 9 giống chó (theo ảnh mẫu), vẽ quay trái rồi lật: tai (nhọn/cụp/dơi), đuôi (xoăn/thẳng/lông/cụt), chân (thường/ngắn)
const DOG_BASE=['','','1-6B','0-2B 3E 4-6B','0E 1-6B 7-13B','0-3W 4-14B','1-3W 4-14B','3-4W 5-14B','4-13b'];
const DOGS={shiba:{B:'#e8823a',b:'#c0602a',W:'#f6e8d0',ear:'up',tail:'curl'},becgie:{B:'#c08040',b:'#8a5a2a',W:'#d8a060',K:'#2a2228',ear:'up',tail:'long',saddle:true,mask:true},
  pug:{B:'#e8d0a0',b:'#c8a878',W:'#f0e0c0',K:'#3a3038',ear:'small',tail:'curl',mask:true},dalmatian:{B:'#f4f1ea',b:'#d8d2c6',W:'#ffffff',K:'#2a2a30',ear:'flop',earC:'#2a2a30',tail:'long',spots:true},
  golden:{B:'#e8b04a',b:'#c08a30',W:'#f0cc78',ear:'flop',tail:'feather'},beagle:{B:'#c0782a',b:'#8a5420',W:'#f4f1ea',K:'#2a2228',ear:'flop',earC:'#8a5420',tail:'long',saddle:true},
  yorkie:{B:'#c8904a',b:'#a0703a',W:'#d8a868',K:'#2a3048',ear:'up',tail:'stub',saddle:true,small:true},bulldog:{B:'#3a3640',b:'#26222c',W:'#c8c0d0',ear:'bat',tail:'stub',chest:true},
  corgi:{B:'#e8823a',b:'#c0602a',W:'#f6f1ea',ear:'big',tail:'stub',short:true}};
function dog(k,fr=0){ const D=DOGS[k]||DOGS.shiba, pal={B:D.B,b:D.b,W:D.W,K:D.K||OUT,E:OUT,R:D.earC||D.b};
  const sp=S(18,14,9,13,(g,P)=>{ const bot=D.short?12:13; legs(P,[12,14,5,7],8,bot,fr,false,D.W,D.b,D.b,2); rows(P,DOG_BASE,pal,1,0);
    const ears={up:['2B 5B','1-2B 5-6B'],small:['','1-2K 5-6K'],flop:['','','5-7R','6-7R','6-7R'],bat:['1-2B 5-6B','1-2B 5-6B'],big:['1-2B 5-6B','1-2B 5-6B','']}[D.ear]||[];
    rows(P,ears,pal,1,0);
    const tails={curl:['','13-14B','14-15B','15B'],long:['','','','','15B','15-16B','16B','16B'],feather:['','','','','15-16B','15-16W','16B'],stub:['','','','','15B']}[D.tail]||[];
    rows(P,tails,pal,1,0);
    if(D.saddle) rows(P,['','','','','8-13K','7-14K','9-13K'],pal,1,0);
    if(D.mask) rows(P,['','','0-2K','0-1K','0K'],pal,1,0);
    if(D.spots) rows(P,['','','','','9K 12K','6K 11K 14K','8K 13K','10K'],pal,1,0);
    if(D.chest) rows(P,['','','','','','2-3W','2-4W'],pal,1,0);
    if(D.small) g.clearRect(0,0,18,2); },false);
  const c=flipC(sp.c); A.outline(c); return {c,ax:9,ay:13}; }
const HEN=['7-8R','7-9R','6-9O','6-7O 8E 9O 10Y','1T 6-9O 10-11Y','0-1T 2-8O 9R','0-1t 2-9O','1t 2-3O 4-7F 8-9O','2-9o','3-8o'];
function chicken(fr=0){ return S(12,12,6,11,(g,P)=>{ const f=fr%2; rows(P,HEN,{R:'#e23b2e',Y:'#f2b33d',O:'#c8642e',o:'#9c4620',F:'#e89a52',T:'#2f3a2a',t:'#3f6a3a',E:OUT},0,f&&fr%4===3?1:0);
  P.rect(4+(f?-1:0),10,1,1,'#e8a23a'); P.rect(7+(f?1:0),10,1,1,'#e8a23a'); P.rect(3+(f?-1:0),11,2,1,'#e8a23a'); P.rect(7+(f?1:0),11,2,1,'#e8a23a'); }); }

/* ---------- cá + tôm (theo ảnh mẫu hải sản: thân tròn, vây đậm, mắt to) ---------- */
// khung 12×8 quay phải: A lưng, B bụng, D vây, S sọc, E mắt, W mắt trắng
const FISH_BASE=['4-7D','0D 3-9A','0-1D 2-10A 9W','0-1D 2-11A 9E','0-1D 2-10B','0D 3-9B','4-6D'];
const FISHES={
  ca_ro:{A:'#7a8a4a',B:'#c8c890',D:'#4a5a2a',S:'#4a5a2a',x:['1-4S','2-4S 7S','3S 7S','4S 7S']},
  ca_chep:{A:'#e0902a',B:'#f4d070',D:'#d04a2a',S:'#f6b84a',x:['','','4-6S']},
  ca_lang:{A:'#6a7a8a',B:'#c8d0d8',D:'#4a5866',K:'#2c3440',x:['','','','10-11A','10-11B 11K','11K']},
  ca_ro_phi:{A:'#7a8aa0',B:'#c8d0dc',D:'#c84a3a',S:'#56647a',x:['','4S 6S 8S','4S 6S 8S','4S 6S']},
  ca_tam:{A:'#5a6470',B:'#b8c0c8',D:'#3e4650',S:'#e0e4e8',x:['','3S 5S 7S','','10-11A','','','']},
  ca_hoi:{A:'#6a8aa0',B:'#eef2f4',D:'#4e6c80',S:'#f09a86',x:['','','','2-9S']},
};
function fishPaint(P,k,ox=0,oy=0){ const F=FISHES[k]||FISHES.ca_ro; const pal={A:F.A,B:F.B,D:F.D,S:F.S||F.D,E:OUT,W:'#ffffff',K:F.K||OUT}; rows(P,FISH_BASE,pal,ox,oy); rows(P,F.x,pal,ox,oy); }
const PRAWN=['5-10a','7-9O 10-12C','4-9O 8E 11-12C','2-3o 4-9O 10C','1o 2-3O 4o 5-6O 7o 8-9O','0-1D 2o 3-6O 7p 9p','0-1D 4p 6p'];
function prawnPaint(P,ox=0,oy=0){ rows(P,PRAWN,{O:'#f07a4a',o:'#c85a32',C:'#3a74d0',D:'#e0583a',a:'#f0a080',p:'#e06a3a',E:OUT},ox,oy); }
// sprite cá lớn cho màn câu cá (khung 14×10)
function fish(k){ return S(14,10,7,5,(g,P)=>{ if(k==='tom') prawnPaint(P,1,1); else fishPaint(P,k,1,1); }); }

/* ---------- bướm (9 loài, theo ảnh mẫu): cánh đối xứng, thân đen ---------- */
const WING_OPEN=['0-2B','0B 1-3A 4B','0B 1-2A 3C 4-5A','0-5A','1-5A','2-5D','1-2D 3C 4-5D','1-4D','2-3D'];
const WING_HALF=['3-4B','3B 4-5A','3-4A 5C','3-5A','4-5A','4-5D','3-4D 5C','3-5D','4D'];
const BUTTERFLIES={
  la_xanh:{name:'Bướm lá xanh',A:'#5fa83a',B:'#3e7a2a',C:'#8fd060',D:'#4a8a30'},
  vua_cam:{name:'Bướm vua cam',A:'#f07a2a',B:'#3a2450',C:'#2a1a40',D:'#e05a1a'},
  phuong_ngoc:{name:'Bướm phượng ngọc',A:'#2a9a9a',B:'#7a3a24',C:'#e0a040',D:'#6a3420'},
  gi_sat:{name:'Bướm gỉ sắt',A:'#c8502a',B:'#9a3a1a',C:'#f0a070',D:'#e07a40'},
  tim_pha_le:{name:'Bướm tím pha lê',A:'#7a5ad0',B:'#4a3aa0',C:'#e0c0ff',D:'#5a48b8'},
  hong_dao:{name:'Bướm hồng đào',A:'#f29ab0',B:'#e07a96',C:'#8ac070',D:'#f6c0d0'},
  nau_vang:{name:'Bướm nâu vàng',A:'#8a4a2a',B:'#5a2e1a',C:'#f0c070',D:'#c07a3a'},
  lam_ngoc:{name:'Bướm lam ngọc',A:'#3ac0c0',B:'#2a8a9a',C:'#f0b040',D:'#2a9aa8'},
  tim_than:{name:'Bướm tím than',A:'#9a4aa0',B:'#6a2a7a',C:'#c070c8',D:'#7a3a88'},
};
// khung 13×10, neo giữa; fr 0 cánh mở, 1 cánh khép
function butterfly(k,fr=0){ const B=BUTTERFLIES[k]||BUTTERFLIES.la_xanh; return S(13,10,6,9,(g,P)=>{ rows(P,fr%2?WING_HALF:WING_OPEN,{A:B.A,B:B.B,C:B.C,D:B.D},0,1,6);
  P.rect(6,2,1,8,'#2a1e24'); P.px(5,0,'#2a1e24'); P.px(7,0,'#2a1e24'); P.px(5,1,'#2a1e24'); P.px(7,1,'#2a1e24'); }); }

/* ---------- 4 mẫu xe máy (nhìn nghiêng, quay phải): Wave đỏ, Dream Thái, Exciter, SH ---------- */
// khung 40×26, neo (16,24); mode: '' chạy thường · 'wheelie' bốc đầu (xoay quanh bánh sau) · 'fallen' đổ xe
const BIKE_MODELS={
  wave:{body:'#d0282a',dark:'#2a2a2f',trim:'#f2c43d',rim:'spoke'},
  dream:{body:'#6a1e2a',dark:'#2a2a2f',trim:'#efeae0',rim:'spoke',shield:'#efeae0',basket:true},
  exciter:{body:'#2a4ad0',dark:'#1e2230',trim:'#c8d0e0',rim:'#2a4ad0',sport:true},
  sh:{body:'#eeeef0',dark:'#3a3a42',trim:'#9aa0a8',rim:'#b8bcc4',scooter:true},
};
function bikeBase(P,M,f){ const wheel=(x,y)=>{ P.disc(x,y,5,'#2a2a2f'); if(M.rim==='spoke'){ P.disc(x,y,3,'#c8ccd2'); P.disc(x,y,2,'#2a2a2f'); P.px(x,y,'#c8ccd2'); P.px(x+(f?2:-2),y-(f?1:-1),'#c8ccd2'); P.px(x-(f?2:-2),y+(f?1:-1),'#c8ccd2'); }
    else { P.disc(x,y,3,M.rim); P.disc(x,y,1,'#2a2a2f'); P.px(x+(f?2:0),y+(f?0:2),'#2a2a2f'); } };
  wheel(7,19); wheel(32,19);
  if(M.scooter){ P.rect(3,9,15,7,M.body); P.rect(4,9,13,1,'#ffffff'); P.rect(6,7,11,2,M.dark); P.rect(14,15,9,2,M.dark); P.rect(22,5,6,12,M.body); P.rect(26,3,3,3,M.trim); P.rect(28,5,2,2,'#ffd86b');
    P.rect(27,8,2,9,M.trim); P.rect(29,15,3,3,M.trim); P.rect(1,11,3,2,'#e04a3a'); P.rect(12,16,3,3,M.trim); return; }
  if(M.sport){ P.rect(5,11,14,4,M.body); P.rect(17,8,8,5,M.body); P.rect(18,8,6,1,'#5a7af0'); P.rect(6,9,12,2,M.dark); P.rect(3,9,4,2,M.dark); P.rect(24,6,6,6,M.body); P.rect(28,7,3,2,'#ffd86b');
    P.rect(25,4,2,3,M.dark); P.rect(27,9,2,8,M.trim); P.rect(30,13,3,6,M.trim); P.rect(13,15,7,4,'#5a5e68'); P.rect(4,16,10,2,'#9aa0a8'); P.rect(1,10,2,2,'#e04a3a'); return; }
  P.rect(4,10,14,5,M.body); P.rect(5,10,12,1,M.trim); P.rect(6,8,13,2,M.dark); P.rect(18,12,6,3,M.dark); P.rect(13,15,7,3,'#c8ccd2'); P.rect(3,16,12,2,'#c8ccd2'); P.rect(2,11,2,2,'#e04a3a');
  P.rect(22,6,5,10,M.shield||M.body); P.rect(26,3,2,5,M.dark); P.rect(24,3,6,2,M.dark); P.rect(27,6,3,3,M.body); P.rect(29,7,2,2,'#ffd86b'); P.rect(28,9,2,8,'#c8ccd2'); P.rect(30,14,3,4,'#c8ccd2');
  if(M.basket){ P.rect(29,2,7,5,'#2a2a2f'); for(let x=30;x<35;x+=2) P.px(x,3,'#5a5a66'); } }
function rotateCanvas(src,ang,cx,cy){ const w=src.width, h=src.height, out=cv(w,h), sg=src.getContext('2d').getImageData(0,0,w,h).data, og=out.getContext('2d'), im=og.createImageData(w,h), co=Math.cos(-ang), si=Math.sin(-ang);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const dx=x-cx, dy=y-cy, sx=Math.round(cx+dx*co-dy*si), sy=Math.round(cy+dx*si+dy*co); if(sx<0||sy<0||sx>=w||sy>=h) continue; const i=(sy*w+sx)*4, j=(y*w+x)*4; for(let k=0;k<4;k++) im.data[j+k]=sg[i+k]; }
  og.putImageData(im,0,0); return out; }
function motorbike(fr=0,model='wave',mode=''){ const M=BIKE_MODELS[model]||{...BIKE_MODELS.wave,body:model}, f=fr%2;
  if(mode==='fallen') return S(40,26,16,24,(g,P)=>{ P.rect(4,17,30,5,M.body); P.disc(8,21,4,'#2a2a2f'); P.disc(31,20,4,'#2a2a2f'); P.rect(14,15,10,3,M.dark); });
  const base=S(40,26,16,24,(g,P)=>bikeBase(P,M,f),false);
  if(mode==='wheelie'){ const c=rotateCanvas(base.c,-.32,7,23); A.outline(c); return {c,ax:16,ay:24}; }
  A.outline(base.c); return base; }
motorbike.seat={dx:-4,dy:-16}; motorbike.bar={dx:10,dy:-20}; motorbike.peg={dx:1,dy:-8}; motorbike.rear={dx:-9,dy:0};

/* ---------- icon 14×14: cá, tôm, bướm, vợt ---------- */
const oldIcon=A.icon, ICON3={
  fish:P=>fishPaint(P,'ca_ro',0,2), fish2:P=>fishPaint(P,'ca_chep',0,2), fish3:P=>fishPaint(P,'ca_lang',0,2),
  fish_rophi:P=>fishPaint(P,'ca_ro_phi',0,2), fish_tam:P=>fishPaint(P,'ca_tam',0,2), fish_hoi:P=>fishPaint(P,'ca_hoi',0,2), shrimp:P=>prawnPaint(P,0,2),
  net:P=>{ P.rect(1,10,6,1,'#8a5a36'); P.rect(5,9,2,1,'#8a5a36'); P.disc(8,5,3,'#f4f1ea'); P.disc(8,5,2,'rgba(0,0,0,0)'); P.rect(7,4,3,3,'#dfe6ea'); },
};
for(const k of Object.keys(BUTTERFLIES)) ICON3['buom_'+k]=P=>{ const B=BUTTERFLIES[k]; rows(P,WING_OPEN,{A:B.A,B:B.B,C:B.C,D:B.D},0,1,6); P.rect(6,2,1,8,'#2a1e24'); };
A.icon=function(name,scale=1){ if(!ICON3[name]) return oldIcon(name,scale); const c=cv(14,14), g=c.getContext('2d'); g.translate(0,0); ICON3[name](A.painter(g)); A.outline(c);
  if(scale===1) return c; const s=cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };

/* ---------- DAS (TP.HCM): sàn trắng bóng, tường vàng đục lỗ, chữ D.AS lớn, quầy trắng sọc vàng, kệ cong, bục giảng ---------- */
const TE=A.TILE_EXT; A.WALKABLE.add('m'); A.WALKABLE.add('F');   // F: thảm cỏ rừng, đi vào được (bắt bướm, đi tắt tới vườn)
TE.m=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,A.T,A.T,'#f2f2ef'); P.rect(X,Y+A.T-1,A.T,1,'#e2e2de'); P.rect(X+A.T-1,Y,1,A.T,'#e2e2de'); if((tx*7+ty*3)%5===0) P.px(X+4,Y+4,'#ffffff'); };
TE.y=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,A.T,A.T,'#ffd400'); for(let y=2;y<A.T;y+=4) for(let x=2+(y/4%2)*2;x<A.T;x+=4) P.px(X+x,Y+y,'#f4f1ea'); if(nb(0,1)!=='y') P.rect(X,Y+A.T-2,A.T,2,'#c9a800'); };
const dasLogo=()=>S(64,30,32,29,(g,P)=>{ const k=cv(16,6), kg=k.getContext('2d'); A.drawText(kg,'D.AS',1,0,'#1c1516'); g.imageSmoothingEnabled=false; g.drawImage(k,0,0,64,24); },false);
const dasDesk=(w=150)=>S(w,30,w/2,28,(g,P)=>{ P.rect(1,6,w-2,20,'#f4f4f1'); P.rect(1,6,w-2,3,'#ffffff'); P.rect(1,22,w-2,4,'#ffd400');
  for(let x=4;x<w-4;x+=4) for(let y=11;y<20;y+=3) P.px(x+(y%2),y,'#d4d4cf'); P.rect(1,26,w-2,2,'#c9c9c4'); });
const dasShelf=()=>S(30,44,15,43,(g,P)=>{ for(let i=0;i<3;i++){ const x=2+i*9; P.rect(x,4,7,38,'#f4f4f1'); P.rect(x,4,7,2,'#ffffff'); P.rect(x+1,2,5,2,'#f4f4f1'); P.rect(x,42,7,1,'#c9c9c4');
    for(let y=12;y<40;y+=9){ P.rect(x+1,y,5,1,'#d8d8d2'); P.rect(x+2,y-4,2,4,['#c4382e','#3f6e9a','#ffd400','#2a2a30'][(i+y)%4]); } } });
const podium=()=>S(22,26,11,25,(g,P)=>{ P.rect(2,6,18,18,'#f4f4f1'); P.rect(2,6,18,2,'#ffffff'); P.rect(2,14,18,4,'#ffd400'); P.rect(0,4,22,3,'#2a2a30'); P.rect(9,0,2,5,'#2a2a30'); P.rect(7,0,6,2,'#3a3a40'); });
const projScreen=(w=70)=>S(w,30,w/2,29,(g,P)=>{ P.rect(1,1,w-2,3,'#2a2a30'); P.rect(3,4,w-6,22,'#f8f8f6'); P.rect(6,8,w*.4,3,'#ffd400'); P.rect(6,13,w*.6,2,'#9aa0a8'); P.rect(6,17,w*.5,2,'#9aa0a8'); P.rect(w-24,8,16,12,'#1c1516'); A.drawText(g,'DAS',w-22,11,'#ffd400'); });
const bookTable=()=>S(40,22,20,20,(g,P)=>{ P.rect(2,8,36,10,'#f4f4f1'); P.rect(2,8,36,2,'#ffffff'); P.rect(4,4,10,4,'#c4382e'); P.rect(16,5,8,3,'#3f6e9a'); P.rect(26,4,9,4,'#ffd400'); P.rect(4,18,3,3,'#9aa0a8'); P.rect(33,18,3,3,'#9aa0a8'); });
const filing=()=>S(18,34,9,32,(g,P)=>{ P.rect(1,2,16,30,'#6a6e78'); P.rect(1,2,16,2,'#8a8e98'); for(const y of [6,15,24]){ P.rect(3,y,12,7,'#5a5e68'); P.rect(7,y+3,4,1,'#c8ccd2'); } P.rect(4,0,6,2,'#f4f1ea'); });
const fridge=()=>S(20,40,10,38,(g,P)=>{ P.rect(1,1,18,36,'#e8ecef'); P.rect(1,1,18,2,'#ffffff'); P.rect(1,14,18,1,'#b8c0c8'); P.rect(15,5,2,6,'#9aa0a8'); P.rect(15,18,2,10,'#9aa0a8'); P.rect(4,20,4,4,'#ffd84a'); P.rect(9,22,3,3,'#e04848'); });
const cooler=()=>S(14,34,7,32,(g,P)=>{ P.rect(3,1,8,10,'#8fd3ea'); P.rect(4,2,3,6,'#d8f2fb'); P.rect(2,11,10,20,'#d4d8dc'); P.rect(4,14,2,2,'#3a74d0'); P.rect(8,14,2,2,'#e04848'); P.rect(3,22,8,6,'#9aa0a8'); });
const tvStand=()=>S(46,34,23,32,(g,P)=>{ P.rect(3,1,40,22,'#1c1c22'); P.rect(5,3,36,18,'#3a74d0'); P.rect(7,5,14,6,'#7fd0f0'); P.rect(24,12,14,6,'#ffd84a'); P.rect(1,24,44,8,'#6e472c'); P.rect(1,24,44,2,'#8a5d3b'); P.rect(8,27,10,3,'#4a3424'); P.rect(28,27,10,3,'#4a3424'); });
const blinds=()=>S(40,26,20,25,(g,P)=>{ P.rect(1,1,38,22,'#e8e4dc'); P.rect(3,3,34,18,'#a8dcf0'); for(let y=3;y<16;y+=2) P.rect(3,y,34,1,'#f4f4f1'); P.rect(3,16,34,1,'#9aa0a8'); P.rect(1,22,38,2,'#c8c0b4'); },false);
const calendar=()=>S(20,24,10,23,(g,P)=>{ P.rect(1,1,18,8,'#e04848'); A.drawText(g,'2026',3,3,'#f4f1ea'); P.rect(1,9,18,13,'#f4f1ea'); for(let y=11;y<21;y+=3) for(let x=3;x<18;x+=3) P.px(x,y,'#9aa0a8'); P.px(9,14,'#e04848'); },false);
const nightstand=()=>S(16,22,8,20,(g,P)=>{ P.rect(1,10,14,10,'#8a5d3b'); P.rect(1,10,14,2,'#a7744c'); P.rect(6,14,4,1,'#c9a35e'); P.rect(5,1,6,6,'#ffe9a8'); P.rect(7,7,2,3,'#3a3a48'); });
const sink=()=>S(22,28,11,26,(g,P)=>{ P.rect(4,1,14,12,'#cfe8f2'); P.rect(4,1,14,1,'#9aa0a8'); P.rect(1,14,20,11,'#f4f4f1'); P.rect(4,15,14,4,'#d4e4ec'); P.rect(10,13,2,3,'#9aa0a8'); });
Object.assign(A,{dasLogo,dasDesk,dasShelf,podium,projScreen,bookTable,filing,fridge,cooler,tvStand,blinds,calendar,nightstand,sink});

/* ---------- thiên nhiên chi tiết hơn: nước sâu, ruộng lúa, cây thông, cây hoa, cây đa, lau sậy, lá sen, đá giữa nước, hoa cỏ, gốc cây, nấm ---------- */
A.WALKABLE.add('p');
TE.o=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,A.T,A.T,'#2a6eb0'); for(let y=2;y<A.T;y+=6) for(let x=0;x<A.T;x++){ const w=(x+X+y*5+fr*4)%19; if(w<2) P.px(X+x,Y+y,'#4f8fd0'); } if(A.hash(tx,ty,21)<.04&&fr) P.px(X+7,Y+7,'#bfe6fa'); };
TE.p=(g,X,Y,tx,ty,nb,fr,P)=>{ P.rect(X,Y,A.T,A.T,'#8fc4c8'); for(let y=1;y<A.T;y+=4) for(let x=1+(y%8?2:0);x<A.T;x+=4){ P.rect(X+x,Y+y,1,3,'#5a9a3a'); P.px(X+x+1,Y+y,'#7fc050'); }
  if(nb(0,-1)!=='p') P.rect(X,Y,A.T,2,'#8a6a3a'); if(nb(-1,0)!=='p') P.rect(X,Y,2,A.T,'#8a6a3a'); if((tx+ty+fr)%7===0) P.px(X+9,Y+10,'#e8f8fb'); };
const pine=(seed=0)=>{ const h=34+Math.floor(A.hash(seed,3)*10); return S(24,h+6,12,h+4,(g,P)=>{ P.rect(11,h-6,3,10,'#5a3a22');
  for(let k=0;k<4;k++){ const y0=2+k*(h-10)/4, w=4+k*3; for(let r=0;r<(h-10)/4+3;r++){ const ww=Math.round(w*r/((h-10)/4+3)); P.rect(12-ww,y0+r,ww*2+1,1,k%2?'#2c5a36':'#356a40'); } P.px(12-w/2,y0+(h-10)/4,'#4f8a58'); } }); };
const flowerTree=(seed,col)=>{ const t=A.tree(seed,1), c=cv(t.c.width,t.c.height), g=c.getContext('2d'); g.drawImage(t.c,0,0); const d=g.getImageData(0,0,c.width,c.height).data;
  for(let i=0;i<70;i++){ const x=Math.floor(A.hash(seed,i)*c.width), y=Math.floor(A.hash(seed,i+99)*c.height*.65), k=(y*c.width+x)*4; if(d[k+3]>0&&d[k]+d[k+1]+d[k+2]>120&&d[k+1]>d[k]){ g.fillStyle=col; g.fillRect(x,y,2,2); g.fillStyle='#ffffff'; g.fillRect(x,y,1,1); } }
  return {c,ax:t.ax,ay:t.ay}; };
const banyan=()=>S(72,64,36,62,(g,P)=>{ for(const [x,y,r] of [[22,22,16],[48,20,17],[36,12,15],[14,30,11],[58,30,12],[36,28,16]]) P.disc(x,y,r,'#3f7a31'); for(const [x,y,r] of [[30,12,8],[46,14,7],[20,20,6]]) P.disc(x,y,r,'#5aa84a');
  P.rect(30,34,12,26,'#6e472c'); P.rect(32,34,3,26,'#8a5d3b'); for(const x of [16,22,50,56,26,46]) P.rect(x,34,1,20+(x%5)*2,'#7a5434'); P.rect(22,58,28,3,'#5a3a22'); });
const reeds=(seed=0)=>S(14,22,7,21,(g,P)=>{ for(let k=0;k<5;k++){ const x=2+k*2+Math.floor(A.hash(seed,k)*2), h=12+Math.floor(A.hash(seed,k+7)*7); P.rect(x,21-h,1,h,k%2?'#6a9a3a':'#7fae46'); P.rect(x,21-h,1,3,'#8a5a36'); } });
const lily=(seed=0)=>S(16,9,8,7,(g,P)=>{ P.disc(5,4,3,'#4f9a3e'); P.rect(5,3,3,1,'#2a6aa8'); P.disc(11,5,3,'#5aa84a'); if(A.hash(seed,1)<.5){ P.px(11,3,'#f29ab0'); P.px(10,4,'#f29ab0'); P.px(12,4,'#f29ab0'); P.px(11,4,'#ffe066'); } },false);
const wrock=(seed=0)=>S(16,9,8,7,(g,P)=>{ P.rect(1,6,14,1,'#bfe6fa'); P.disc(8,4,4,'#8f8a82'); P.disc(6,3,2,'#aaa59b'); P.rect(2,7,12,1,'#d8f2fb'); });
const flowers=(seed,col)=>S(12,8,6,7,(g,P)=>{ for(let k=0;k<4;k++){ const x=1+Math.floor(A.hash(seed,k)*9), y=1+Math.floor(A.hash(seed,k+4)*5); P.rect(x,y+1,1,2,'#3f8a32'); P.px(x,y,col); } },false);
const tuft=(seed=0)=>S(10,7,5,6,(g,P)=>{ for(let k=0;k<4;k++){ const x=1+k*2; P.rect(x,2+(k%2),1,4-(k%2),k%2?'#5a9a3a':'#6aae4a'); } },false);
const stump=()=>S(14,11,7,9,(g,P)=>{ P.rect(2,3,10,6,'#7a5434'); P.rect(2,2,10,2,'#c8a070'); P.px(6,2,'#8a6a3a'); P.px(7,3,'#8a6a3a'); P.rect(1,8,12,1,'#5a3a22'); });
const logs=()=>S(28,10,14,8,(g,P)=>{ P.rect(2,2,24,6,'#7a5434'); P.rect(2,2,24,1,'#9a7048'); P.disc(25,5,3,'#c8a070'); P.px(25,5,'#8a6a3a'); P.rect(9,3,1,4,'#5a3a22'); });
const mush=(seed=0)=>S(12,9,6,8,(g,P)=>{ for(const [x,c] of [[3,'#e04848'],[8,'#f2a05a']]){ P.rect(x,4,2,3,'#f4f1ea'); P.rect(x-1,2,4,2,c); P.px(x,2,'#ffffff'); } });
/* ---------- chùa, cổng vườn quốc gia, chuông, lư hương ---------- */
const pagoda=()=>S(180,124,90,122,(g,P)=>{ P.rect(8,104,164,18,'#a49e93'); P.rect(8,104,164,3,'#bdb7ab'); for(let k=0;k<4;k++) P.rect(74+k*2,108+k*3,32-k*4,3,'#8b857b');
  P.rect(20,62,140,42,'#e8d8b0'); for(const x of [24,48,72,104,128,152]) P.rect(x,62,6,42,'#a8322a'); P.rect(78,72,24,32,'#6a1e1a'); P.rect(80,74,9,30,'#8a2a22'); P.rect(91,74,9,30,'#8a2a22');
  P.rect(36,74,14,14,'#6a1e1a'); P.rect(130,74,14,14,'#6a1e1a');
  const roof=(y,x0,x1,h)=>{ for(let r=0;r<h;r++) P.rect(x0+r,y+r,x1-x0-r*2,1,r%3?'#8a3a2a':'#a84a34'); P.rect(x0-6,y+h-2,10,3,'#8a3a2a'); P.rect(x1-4,y+h-2,10,3,'#8a3a2a'); P.rect(x0-8,y+h-5,4,4,'#e0b040'); P.rect(x1+4,y+h-5,4,4,'#e0b040'); P.rect(x0+4,y-2,x1-x0-8,3,'#e0b040'); };
  roof(44,6,174,18); P.rect(46,30,88,16,'#e8d8b0'); for(const x of [52,88,124]) P.rect(x,30,5,16,'#a8322a'); roof(14,34,146,18); P.rect(84,2,12,12,'#e0b040'); P.disc(90,4,3,'#ffd84a');
  P.rect(62,50,56,10,'#e0b040'); A.drawText(g,'CHUA DA BAC',70,52,'#6a1e1a'); });
const bellTower=()=>S(40,56,20,54,(g,P)=>{ P.rect(6,16,4,38,'#a8322a'); P.rect(30,16,4,38,'#a8322a'); for(let r=0;r<12;r++) P.rect(1+r,4+r,38-r*2,1,'#8a3a2a'); P.rect(0,14,40,3,'#e0b040'); P.rect(15,20,10,14,'#b08a3a'); P.rect(13,32,14,3,'#8a6a2a'); P.rect(19,17,2,3,'#3a3a40'); P.rect(4,52,32,3,'#8b857b'); });
const urn=()=>S(22,22,11,20,(g,P)=>{ P.rect(3,8,16,10,'#8a6a2a'); P.rect(3,8,16,2,'#b08a3a'); P.rect(1,6,20,3,'#6a5020'); P.rect(5,18,3,3,'#6a5020'); P.rect(14,18,3,3,'#6a5020'); for(const x of [8,11,14]){ P.rect(x,1,1,6,'#c8a070'); P.px(x,1,'#ff6a3a'); } });
const parkGate=()=>S(110,64,55,62,(g,P)=>{ P.rect(6,14,8,48,'#6e472c'); P.rect(96,14,8,48,'#6e472c'); P.rect(8,14,2,48,'#8a5d3b'); P.rect(98,14,2,48,'#8a5d3b');
  P.rect(0,4,110,16,'#2f5a36'); P.rect(0,4,110,2,'#4f8a58'); P.rect(0,18,110,2,'#1f3a24'); A.drawText(g,'VUON QUOC GIA DA BAC',14,9,'#ffd84a'); for(const x of [0,104]) P.rect(x,0,6,6,'#3f7a31'); });
const kiosk=()=>S(40,40,20,38,(g,P)=>{ P.rect(4,14,32,24,'#c08552'); P.rect(4,14,32,3,'#dca170'); P.rect(10,20,20,10,'#a8dcf0'); for(let x=0;x<40;x+=8) P.rect(x,6,8,8,(x/8)%2?'#f4f1ea':'#3f7a46'); P.rect(0,13,40,2,'#1c1516'); A.drawText(g,'VE',15,32,'#1c1516'); });
// ô tô riêng (hatchback xanh) theo ảnh mẫu, quay phải
const hatch=()=>S(50,24,25,22,(g,P)=>{ P.rect(4,10,42,8,'#5a9ae8'); P.rect(12,4,24,7,'#5a9ae8'); P.rect(8,8,6,3,'#5a9ae8'); P.rect(36,6,6,5,'#5a9ae8'); P.rect(4,10,42,1,'#8cc0f8');
  P.rect(14,5,9,5,'#2a2440'); P.rect(25,5,9,5,'#2a2440'); P.rect(24,5,1,12,'#3a6ab8'); P.rect(20,12,4,1,'#3a6ab8'); P.rect(32,12,4,1,'#3a6ab8'); P.rect(44,11,2,3,'#c8504a'); P.rect(4,12,2,3,'#ffffff'); P.rect(6,16,40,2,'#3a6ab8');
  for(const x of [12,38]){ P.disc(x,18,4,'#2a2a30'); P.disc(x,18,2,'#6a6a72'); } });
// ô tô to gấp đôi (phóng pixel 2 lần cho đúng tỉ lệ người)
const hatchBig=()=>{ const k=1.4, s=hatch(), c=cv(Math.round(s.c.width*k),Math.round(s.c.height*k)), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(s.c,0,0,c.width,c.height); return {c,ax:Math.round(s.ax*k),ay:Math.round(s.ay*k)}; };
Object.assign(A,{hatch:hatchBig,pine,flowerTree,banyan,reeds,lily,wrock,flowers,tuft,stump,logs,mush,pagoda,bellTower,urn,parkGate,kiosk});

/* ---------- thú hoang dã ở vườn quốc gia (vẽ quay phải) ---------- */
const WILD={
  huou:{w:20,h:16,top:10,bot:15,xs:[4,6,11,13],lw:2,near:'#b07a42',far:'#8a5a30',hoof:'#3a2418',pal:{A:'#c8a070',B:'#b07a42',b:'#8a5a30',W:'#f4ecd8',E:OUT,n:'#3a2418'},
    R:['14A 17A','14-15A 16A 17A','15-16A','14-16B','13-17B 16E','13-17B 18n','3-14B','2-15B 5W 9W 12W','2-14B 7W 11W','3-13b']},
  khi:{w:14,h:14,top:9,bot:13,xs:[3,5,8,10],lw:1,near:'#a87a3a',far:'#8a5a2a',hoof:'#5a3a22',pal:{B:'#a87a3a',b:'#8a5a2a',F:'#f0b890',E:OUT},R:['9-11B','8-12B','8-9B 10-11F 12B','8B 9E 10F 11E 12B','9-11F','3-10B','2-11B','0-1B 3-10B','0B 4-9b']},
  voi:{w:32,h:22,top:11,bot:21,xs:[4,8,17,21],lw:3,near:'#8a8a96',far:'#6e6e7a',hoof:'#4a4a54',pal:{G:'#8a8a96',g:'#6e6e7a',W:'#f4f1ea',E:OUT},
    R:['17-25G','15-27G','3-14G 15-28G 18-21g','2-28G 24E 18-21g','1-29G 18-21g','1-27G 28-29G 18-21g','1-26G 27-28G','1-25G 26-27G 22-23W','2-24g 26-27G','3-23g 26G','26-27G']},
  cong:{w:22,h:14,top:9,bot:13,xs:[11,11,13,13],lw:1,near:'#c8a070',far:'#a8804a',hoof:'#8a6a3a',pal:{C:'#3a74d0',B:'#2a5ab8',b:'#1e4a90',T:'#3f9a4a',Y:'#f2c43d',E:OUT,e:'#f2c43d'},
    R:['15-16C','15-17B 17E','16-17B 18Y','16-17B','15-17B','0-6T 7-16B','0-8T 2e 6e 9-16B','1-9T 10-15b','3-9T']},
  honghoang:{w:18,h:12,top:8,bot:11,xs:[6,6,8,8],lw:1,near:'#3a3a40',far:'#2a2a30',hoof:'#2a2a30',pal:{K:'#2a2a30',Y:'#f2c43d',W:'#f4f1ea',E:'#e04848'},R:['11-14Y','10-11K 12-16Y','9-11K 10E 12-17Y','9-12K','3-12K','1-11K 9-10W','0-2W 3-10K','0-2W 4-9K']},
  raica:{w:20,h:9,top:5,bot:8,xs:[6,8,13,15],lw:1,near:'#7a5434',far:'#5a3a22',hoof:'#3a2418',pal:{B:'#7a5434',b:'#5a3a22',W:'#c8b090',E:OUT,n:'#2a1e18'},R:['14-17B','13-18B 17E','4-12B 13-19B 19n','0-3B 4-17B 15-17W','1-2B 5-16b']},
  vooc:{w:14,h:15,top:9,bot:14,xs:[3,5,8,10],lw:1,near:'#8a2a2a',far:'#6a1e1e',hoof:'#2a2a30',pal:{G:'#9aa0a8',K:'#2a2a30',O:'#f0a040',W:'#f4f1ea',E:OUT},R:['8-11G','7-12G','7-8G 9-11O 12G','7G 8E 9O 10E 11O 12G','8-11W','4-11G','3-11K','3-10G','0-1W 2-9G']},
  gau:{w:22,h:16,top:9,bot:15,xs:[4,7,13,16],lw:3,near:'#2a2428',far:'#1c181c',hoof:'#141014',pal:{K:'#2a2428',k:'#1c181c',W:'#f4f1ea',E:'#e0d0b0',n:'#6a5a50'},
    R:['15-16K 19-20K','14-20K','14-17K 18E 19-20K','14-20K 21n','3-16K 17-20K','2-19K 15-17W','2-18K 16W','2-17K','3-16k']},
  ho:{w:26,h:15,top:9,bot:14,xs:[4,7,14,17],lw:2,near:'#e8823a',far:'#c0602a',hoof:'#2a2a30',pal:{O:'#e8823a',K:'#2a2a30',W:'#f6f1ea',w:'#f0d8b8',E:'#3a8a3a'},
    R:['20-21O 23O','19-24O','19-21O 22E 23-24O','19-25O 22-23W','3-19O 20-24W','2-20O 5K 9K 13K 17K','1-19O 6K 10K 14K','0-1O 2-18O 7K 11K 15K','3-17w']},
  lonrung:{w:20,h:13,top:7,bot:12,xs:[4,6,12,14],lw:2,near:'#5a3a2a',far:'#3e281c',hoof:'#2a1e18',pal:{K:'#2a1e18',B:'#5a3a2a',b:'#3e281c',W:'#f4f1ea',E:OUT,n:'#8a6a5a'},R:['4-12K','3-14B 15-16B','2-17B 15E','1-18B 18-19n','1-17B 17W','2-16B','3-14b']}};
function wild(k,fr=0){ const D=WILD[k]; return S(D.w,D.h,Math.floor(D.w/2),D.h-1,(g,P)=>{ legs(P,D.xs,D.top,D.bot,fr,false,D.near,D.far,D.hoof,D.lw); rows(P,D.R,D.pal,0,0); }); }
Object.assign(A,{wild,WILD});
Object.assign(A,{horse,cow,pig,chicken,duck,dog,DOGS,fish,butterfly,motorbike,BUTTERFLIES,BIKE_MODELS,FISHES,gridRows:rows});
})();
