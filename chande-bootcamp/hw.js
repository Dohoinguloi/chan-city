/* Chan City — 15 bộ trang phục Halloween vẽ đè lên lưới nhân vật 20×35 của avatar.js. Lưới được nới lề (trái/phải 6, trên 10) để vẽ được mũ chóp,
   sừng, tai, cánh, đuôi, áo choàng ra ngoài người. Toạ độ ghi theo lưới gốc (x 0..19, y 0..34; âm là phần lề). Khung nghiêng nhìn sang phải.
   Mắt: front (6,11)/(13,11) · side (10,11)/(15,11); miệng: front (9..10,15) · side (12..14,15); thân y 19..26, chân y 27..33. */
(function(){
const PX=6, PT=10;
const PAL={'#':[244,242,236],'%':[196,200,212],'@':[24,20,28],'&':[104,48,150],'*':[62,28,96],'+':[242,140,40],'=':[190,92,22],'~':[96,176,72],'^':[40,100,44],'<':[134,86,50],'>':[84,50,28],
  '!':[255,158,204],'?':[178,226,255],'$':[255,214,74],':':[226,40,52],';':[140,20,32],'/':[234,222,192],'|':[192,176,136],',':[200,156,110],'_':[128,134,150]};
const KEYS=new Set(Object.keys(PAL)), BODY_T='Ttq', LEG='PpSsd';
function pad(G){ const w=G[0].length, out=[]; for(let y=0;y<PT;y++) out.push(Array(w+PX*2).fill('.')); for(const r of G) out.push([...Array(PX).fill('.'),...r,...Array(PX).fill('.')]); return out; }
function api(G){ const H=G.length, W=G[0].length, ok=(x,y)=>y+PT>=0&&y+PT<H&&x+PX>=0&&x+PX<W;
  const at=(x,y)=>ok(x,y)?G[y+PT][x+PX]:undefined, put=(x,y,c)=>{ x=Math.round(x); y=Math.round(y); if(ok(x,y)) G[y+PT][x+PX]=c; };
  const rect=(x0,y0,x1,y1,c)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) put(x,y,c); };
  const body=(x,y)=>{ const c=at(x,y); return c!==undefined&&c!=='.'&&c!=='O'; };
  const rows=(y0,y1,f)=>{ for(let y=y0;y<=y1;y++) for(let x=-PX;x<W-PX;x++) if(body(x,y)) f(x,y,at(x,y)); };
  const span=y=>{ let a=99,b=-99; for(let x=-PX;x<W-PX;x++){ const c=at(x,y); if(c!=='.'&&c!==undefined){ a=Math.min(a,x); b=Math.max(b,x); } } return [a,b]; };
  const ell=(cx,cy,rx,ry,f)=>{ for(let y=-ry;y<=ry;y++){ const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry)))); for(let x=-w;x<=w;x++) f(Math.round(cx+x),cy+y,x,y,w); } };
  return {at,put,rect,body,rows,span,ell}; }
// viền đen quanh phần vẽ thêm (giống viền của template)
function outline(G){ const H=G.length, W=G[0].length, add=[]; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(G[y][x]==='.'){ for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=(G[y+dy]||[])[x+dx]; if(c&&KEYS.has(c)){ add.push([x,y]); break; } } } for(const [x,y] of add) G[y][x]='O'; }
const hat=(U,s,x0,x1)=>{ U.rect(s?x0+1:x0,1,s?x1+1:x1,2,'@'); };
const C={
  // phù thuỷ: mũ chóp tím vành rộng, chóp gập ra sau, dải cam khoá vàng; tất sọc tím đen
  hw_witch(U,v){ const s=v==='side', cx=s?8:10; U.rect(s?-1:-2,1,s?20:21,2,'*'); U.rect(s?0:-1,1,s?19:20,1,'&');
    for(let i=0;i<10;i++){ const w=Math.max(1,Math.round(5.5-i*.6)), sh=i>5?(s?-(i-5):(i-5)):0; U.rect(cx-w+sh,-i,cx+w-1+sh,-i,i%4===3?'*':'&'); }
    U.rect(cx-5,0,cx+4,0,'+'); U.put(cx-1,0,'$'); U.put(cx,0,'$'); U.rows(28,31,(x,y,c)=>{ if(LEG.includes(c)) U.put(x,y,y%2?'@':'&'); }); },
  // ma cà rồng: áo choàng đen lót đỏ, cổ áo dựng, nanh trắng, gi lê đỏ
  hw_vampire(U,v){ if(v==='front'){ for(let y=16;y<=33;y++){ U.put(-1,y,'@'); U.put(20,y,'@'); U.put(0,y,y<19?'@':';'); U.put(19,y,y<19?'@':';'); } U.rect(0,13,2,17,';'); U.rect(17,13,19,17,';'); U.put(9,16,'#'); U.put(10,16,'#'); U.rect(8,20,11,25,':'); }
    if(v==='side'){ for(let y=14;y<=33;y++){ const w=y<19?1:Math.min(5,1+((y-17)>>1)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,x===2-w?'@':';'); } U.rect(3,13,5,18,';'); U.put(14,16,'#'); }
    if(v==='back'){ U.rows(16,33,(x,y)=>U.put(x,y,(x===4||x===15)?';':'@')); U.rect(0,12,19,15,';'); } },
  // bóng ma: tấm khăn trắng trùm kín, mắt và miệng đen to, gấu khăn lượn sóng
  hw_ghost(U,v){ const [a,b]=U.span(26), mid=(a+b)/2;
    for(let y=-PT;y<=34;y++) for(let x=-PX;x<26;x++){ const c=U.at(x,y); if(c===undefined||c==='.'||c==='O') continue; U.put(x,y,x>mid+4?'%':'#'); }
    for(let y=26;y<=33;y++) for(let x=a;x<=b;x++) U.put(x,y,x>mid+4?'%':'#'); for(let x=a;x<=b;x++) U.put(x,34,(x-a)%4<2?'#':'.');
    if(v==='front'){ U.rect(5,10,7,13,'@'); U.rect(12,10,14,13,'@'); U.rect(9,15,10,17,'@'); } if(v==='side'){ U.rect(10,10,11,13,'@'); U.rect(15,10,16,13,'@'); U.rect(13,15,14,17,'@'); } },
  // Frankenstein: da xanh, sẹo khâu trên trán, bu lông ở cổ, quầng mắt
  hw_frank(U,v){ if(v==='front'){ U.rect(5,9,14,9,'>'); for(const x of [6,8,10,12]){ U.put(x,8,'@'); U.put(x,10,'@'); } U.rect(-1,16,0,17,'_'); U.rect(19,16,20,17,'_'); U.rect(5,13,7,13,'^'); U.rect(12,13,14,13,'^'); }
    if(v==='side'){ U.rect(8,9,16,9,'>'); for(const x of [9,11,13,15]){ U.put(x,8,'@'); U.put(x,10,'@'); } U.rect(3,16,5,17,'_'); U.rect(9,13,11,13,'^'); U.rect(14,13,16,13,'^'); }
    if(v==='back'){ U.rect(-1,16,0,17,'_'); U.rect(19,16,20,17,'_'); } },
  // xác ướp: băng vải quấn kín (sọc chéo), mắt vàng phát sáng, 1 dải băng lòng thòng
  hw_mummy(U,v){ for(let y=-PT;y<=34;y++) for(let x=-PX;x<26;x++){ const c=U.at(x,y); if(c===undefined||c==='.'||c==='O') continue; U.put(x,y,c==='E'&&v!=='back'?'$':((x+y*2)%6===0)?'|':((x*3+y)%11===0)?'%':'/'); }
    if(v==='front'){ U.rect(19,25,19,30,'/'); U.put(20,30,'/'); } if(v==='side'){ U.rect(18,24,18,30,'/'); U.put(19,30,'/'); } },
  // bộ xương: đồ bó đen vẽ xương trắng, đầu lâu (hốc mắt, mũi, răng)
  hw_skel(U,v){ const f=v==='front', s=v==='side';
    if(f){ U.rect(5,10,7,12,'@'); U.rect(12,10,14,12,'@'); U.put(9,13,'@'); U.put(10,13,'@'); for(let x=6;x<=13;x++) U.put(x,15,x%2?'#':'@'); U.rect(6,16,13,16,'@');
      U.rect(9,19,10,26,'#'); for(const y of [20,22,24]) U.rect(5,y,14,y,'#'); U.rect(1,21,1,24,'#'); U.rect(18,21,18,24,'#'); for(const x of [7,12]) U.rect(x,27,x,31,'#'); }
    if(s){ U.rect(9,10,11,12,'@'); U.rect(14,10,16,12,'@'); U.put(13,13,'@'); for(let x=11;x<=16;x++) U.put(x,15,x%2?'#':'@');
      U.rect(6,19,6,26,'#'); for(const y of [20,22,24]) U.rect(7,y,14,y,'#'); U.rect(8,27,8,31,'#'); U.rect(13,27,13,31,'#'); }
    if(v==='back'){ U.rect(9,19,10,26,'#'); for(const y of [20,22,24]) U.rect(5,y,14,y,'#'); U.rect(7,27,7,31,'#'); U.rect(12,27,12,31,'#'); } },
  // cô mèo: tai mèo đen lót hồng, mặt nạ đen quanh mắt (mắt vàng), đuôi cong
  hw_cat(U,v){ const ear=(xs,pk)=>{ xs.forEach(([y,a,b])=>U.rect(a,y,b,y,'@')); pk.forEach(([x,y])=>U.put(x,y,'!')); };
    if(v!=='side'){ ear([[1,3,7],[0,3,6],[-1,3,5],[-2,3,4]],[[4,0],[4,1],[5,1]]); ear([[1,12,16],[0,13,16],[-1,14,16],[-2,15,16]],[[15,0],[15,1],[14,1]]); }
    else { ear([[1,6,9],[0,6,8],[-1,6,7]],[[7,0]]); ear([[1,11,14],[0,12,14],[-1,13,14]],[[13,0]]); }
    if(v==='front'){ U.rows(10,12,(x,y,c)=>{ if(x>=4&&x<=15) U.put(x,y,c==='E'?'$':'@'); }); U.rect(19,26,20,26,'@'); U.rect(20,27,21,30,'@'); U.rect(20,31,20,32,'@'); }
    if(v==='side'){ U.rows(10,12,(x,y,c)=>{ if(x>=8&&x<=17) U.put(x,y,c==='E'?'$':'@'); }); for(const [x,y] of [[3,26],[2,27],[1,28],[0,29],[-1,30],[-1,31],[0,32],[1,32],[2,31]]){ U.put(x,y,'@'); U.put(x-1,y,'@'); } }
    if(v==='back'){ U.rect(9,26,10,30,'@'); U.rect(10,31,12,32,'@'); U.put(12,30,'@'); } },
  // cướp biển: mũ 3 góc đen viền vàng có đầu lâu, bịt 1 mắt, áo sọc đỏ trắng, đai đỏ
  hw_pirate(U,v){ const s=v==='side';
    U.rows(19,25,(x,y,c)=>{ if(BODY_T.includes(c)&&y%2===0) U.put(x,y,':'); }); U.rows(26,26,(x,y,c)=>{ if(c==='U'||BODY_T.includes(c)) U.put(x,y,';'); });
    const x0=s?0:0, x1=s?18:19; U.rect(x0,0,x1,1,'@'); U.rect(x0+1,1,x1-1,1,'$'); U.rect(x0+3,-3,x1-3,-1,'@'); U.put(x0-1,-1,'@'); U.put(x0-1,0,'@'); U.put(x1+1,-1,'@'); U.put(x1+1,0,'@');
    if(v==='front'){ U.put(9,-2,'#'); U.put(10,-2,'#'); U.rect(5,10,7,12,'@'); U.rect(1,9,17,9,'@'); }
    if(s){ U.put(10,-2,'#'); U.put(11,-2,'#'); U.rect(14,10,16,12,'@'); U.rect(6,9,17,9,'@'); } },
  // y tá: mũ trắng chữ thập đỏ, đồ trắng, chữ thập trên ngực
  hw_nurse(U,v){ const s=v==='side', x0=s?6:5, x1=s?13:14, cx=Math.round((x0+x1)/2); U.rect(x0,-2,x1,1,'#'); U.rect(x0,1,x1,1,'%'); U.rect(cx,-2,cx,0,':'); U.rect(cx-1,-1,cx+1,-1,':');
    if(v==='front'){ U.rect(9,20,10,23,':'); U.rect(8,21,11,22,':'); } if(s){ U.rect(13,20,13,23,':'); U.rect(12,21,14,22,':'); } },
  // người sói: tai sói, mõm sáng có mũi đen + nanh, áo kẻ caro rách, quần ống tua, móng vuốt
  hw_wolf(U,v){ if(v!=='side'){ U.rect(2,-2,4,1,'<'); U.put(3,0,'!'); U.put(3,-3,'<'); U.rect(15,-2,17,1,'<'); U.put(16,0,'!'); U.put(16,-3,'<'); }
    else { U.rect(6,-2,8,1,'<'); U.put(7,0,'!'); U.put(7,-3,'<'); U.rect(11,-2,13,1,'<'); U.put(12,0,'!'); U.put(12,-3,'<'); }
    if(v==='front'){ U.rect(7,13,12,16,','); U.rect(9,13,10,13,'@'); U.rect(9,15,10,15,'@'); U.put(8,16,'#'); U.put(11,16,'#'); }
    if(v==='side'){ U.rect(14,12,19,16,','); U.rect(19,12,20,13,'@'); U.put(16,16,'#'); U.put(18,16,'#'); }
    U.rows(19,25,(x,y,c)=>{ if(BODY_T.includes(c)&&(x%3===0||y%3===0)) U.put(x,y,'>'); }); U.rows(31,31,(x,y,c)=>{ if('Pp'.includes(c)&&x%2) U.put(x,y,','); });
    U.rows(27,27,(x,y,c)=>{ if('Ssd'.includes(c)) U.put(x,y,'#'); }); },
  // tiên nữ: cánh trong xanh viền trắng, vòng hoa trên đầu, đũa phép sao vàng
  hw_fairy(U,v){ const wing=(cx,cy,rx,ry,over)=>U.ell(cx,cy,rx,ry,(x,y,dx,dy,w)=>{ if(over||!U.body(x,y)) U.put(x,y,(Math.abs(dy)===ry||Math.abs(dx)===w)?'#':'?'); });
    if(v==='front'){ wing(-3,19,3,5); wing(-2,26,2,3); wing(22,19,3,5); wing(21,26,2,3); }
    if(v==='side'){ wing(0,18,4,6); wing(1,26,3,3); } if(v==='back'){ wing(4,21,5,7,true); wing(15,21,5,7,true); }
    const a=v==='side'?5:3, b=v==='side'?15:16; for(let x=a;x<=b;x++) U.put(x,1,['!','$','~'][x%3]);
    if(v==='front'){ U.rect(19,19,19,25,'$'); for(const [x,y] of [[19,17],[18,18],[19,18],[20,18],[19,16]]) U.put(x,y,'$'); } },
  // ác quỷ: sừng đỏ, đồ đỏ, đuôi có mũi tên
  hw_devil(U,v){ const horn=(x,dx)=>{ U.rect(x,0,x+1,1,':'); U.rect(x+dx,-1,x+dx+1,-1,':'); U.put(x+dx+(dx>0?1:0),-2,';'); };
    if(v!=='side'){ horn(3,-1); horn(15,1); } else { horn(7,1); horn(12,1); }
    const tail=pts=>pts.forEach(([x,y])=>{ U.put(x,y,':'); });
    if(v==='side'){ tail([[3,27],[2,28],[1,29],[0,30],[0,31],[-1,32]]); U.rect(-3,32,-1,33,';'); U.put(-2,31,';'); }
    if(v==='front'){ tail([[19,27],[20,28],[21,29],[21,30],[22,31]]); U.rect(21,32,23,33,';'); U.put(22,31,';'); }
    if(v==='back'){ tail([[10,27],[10,28],[11,29],[12,30],[13,31]]); U.rect(12,32,14,33,';'); } },
  // bí ngô: thân quả bí cam tròn có múi, mặt đèn lồng khoét, cuống lá xanh trên đầu
  hw_pumpkin(U,v){ const s=v==='side', cx=s?10:9.5, rx=s?11:12;
    U.ell(cx,24,rx,7,(x,y,dx)=>{ const rid=Math.abs(dx)%4===0&&Math.abs(dx)>1; U.put(x,y,rid?'=':(dx>rx*.45?'=':'+')); });
    if(v!=='back'){ const fx=s?3:0; for(const ex of [6+fx,12+fx]){ U.put(ex,21,'@'); U.rect(ex-1,22,ex+1,22,'@'); } for(let x=5+fx;x<=14+fx;x++) U.put(x,26+(x%2),'@'); U.rect(9+fx,24,10+fx,24,'@'); }
    U.rect(8,-2,10,0,'^'); U.rect(11,-1,13,-1,'~'); U.put(13,-2,'~'); U.rect(s?20:-4,23,s?21:-3,24,'S'); if(!s) U.rect(22,23,23,24,'S'); },
  // thây ma: da xanh xám, áo rách lỗ chỗ dính vết đỏ, quầng mắt thâm, tóc rối
  hw_zombie(U,v){ U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)){ const h=(x*7+y*13)%17; if(h===0||h===9) U.put(x,y,'S'); else if(h===5) U.put(x,y,';'); } });
    U.rows(31,31,(x,y,c)=>{ if('Pp'.includes(c)&&x%2===0) U.put(x,y,'S'); });
    if(v==='front'){ U.rect(5,13,7,13,'*'); U.rect(12,13,14,13,'*'); U.put(15,14,';'); U.put(4,17,';'); U.rect(3,8,7,8,'@'); }
    if(v==='side'){ U.rect(9,13,11,13,'*'); U.rect(14,13,16,13,'*'); U.put(17,14,';'); U.rect(9,8,13,8,'@'); } },
  // cao bồi: mũ nâu vành cong, khăn đỏ quàng cổ, áo kẻ caro, ủng nâu có cựa vàng
  // MU Online · Chiến Binh: giáp đỏ viền vàng, giáp vai thép, mũ sắt chóp lông đỏ, kiếm lớn cầm tay trước
  mu_dk(U,v){ const s=v==='side', f=v==='front';
    U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)&&(y===19||x%5===0)) U.put(x,y,';'); }); U.rows(26,26,(x,y,c)=>{ if(c==='U'||BODY_T.includes(c)) U.put(x,y,'$'); });
    if(f){ U.rect(0,18,4,20,'_'); U.rect(15,18,19,20,'_'); U.rect(0,20,4,20,'$'); U.rect(15,20,19,20,'$'); U.rect(4,0,15,3,'_'); U.rect(4,3,15,3,'$'); U.rect(8,-3,11,0,':'); U.rect(9,-5,10,-3,':');
      if(!U.nowep){ U.rect(20,9,21,26,'%'); U.rect(20,9,20,26,'#'); U.rect(18,25,23,26,'$'); U.rect(20,27,21,30,'>'); U.rect(20,31,21,31,'$'); } }
    if(s){ U.rect(12,18,16,20,'_'); U.rect(12,20,16,20,'$'); U.rect(5,0,15,3,'_'); U.rect(5,3,15,3,'$'); U.rect(8,-3,11,0,':'); U.rect(7,-4,9,-3,':');
      if(!U.nowep){ U.rect(18,9,19,25,'%'); U.rect(19,9,19,25,'#'); U.rect(16,24,21,25,'$'); U.rect(18,26,19,29,'>'); } }
    if(v==='back'){ U.rect(0,18,4,20,'_'); U.rect(15,18,19,20,'_'); U.rect(4,0,15,3,'_'); U.rect(8,-3,11,0,':'); U.rows(19,27,(x,y)=>{ if(x>=6&&x<=13) U.put(x,y,':'); }); } },
  // MU Online · Tiên Nữ: áo trắng viền vàng, vương miện lá vàng, tai nhọn, song kiếm tiên lưỡi xanh băng
  mu_elf(U,v){ const s=v==='side', f=v==='front';
    U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)&&(y===19||y===23)) U.put(x,y,'$'); }); U.rows(27,30,(x,y,c)=>{ if('Pp'.includes(c)&&y===30) U.put(x,y,'$'); });
    const cx=s?10:9.5; for(let x=Math.round(cx)-5;x<=Math.round(cx)+5;x++) U.put(x,1,x%2?'$':'~'); U.put(Math.round(cx),0,'$'); U.put(Math.round(cx),-1,'?');
    if(f){ U.rect(-1,9,0,10,'S'); U.put(-2,8,'S'); U.rect(19,9,20,10,'S'); U.put(21,8,'S');
      if(!U.nowep) for(const x of [21,-2]){ U.rect(x,15,x,26,'?'); U.put(x,14,'#'); U.rect(x,16,x,25,x>0?'#':'?'); U.rect(x-1,27,x+1,27,'$'); U.rect(x,28,x,30,'<'); } }
    if(s){ U.put(5,9,'S'); U.put(4,8,'S'); } if(s&&!U.nowep){ U.rect(19,14,19,26,'?'); U.put(19,13,'#'); U.rect(20,15,20,25,'#'); U.rect(18,27,21,27,'$'); U.rect(19,28,20,30,'<'); }
    if(v==='back'){ U.rect(-1,9,0,10,'S'); U.rect(19,9,20,10,'S'); U.rect(8,19,11,30,'$'); } },
  // MU Online · Phù Thuỷ: giáp xanh lam viền bạc, mũ trùm xanh đính ngọc, áo choàng xanh thẫm, gậy phép gỗ đầu quả cầu sáng
  mu_dw(U,v){ const s=v==='side', f=v==='front';
    U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)&&(y===19||x%4===0)) U.put(x,y,'%'); });
    if(v!=='side'){ for(let y=17;y<=32;y++){ U.put(-1,y,'*'); U.put(20,y,'*'); } } else { for(let y=16;y<=32;y++){ const w=y<20?1:Math.min(4,1+((y-18)>>1)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,'*'); } }
    U.rect(s?5:4,0,s?15:15,2,'&'); U.rect(s?6:5,-2,s?14:14,-1,'&'); U.put(s?10:9,0,'?'); U.put(s?10:10,0,'?');
    if(f&&!U.nowep){ U.rect(20,4,20,31,'<'); U.rect(19,1,21,3,'?'); U.put(20,0,'#'); U.put(18,2,'?'); U.put(22,2,'?'); }
    if(s&&!U.nowep){ U.rect(18,4,18,30,'<'); U.rect(17,1,19,3,'?'); U.put(18,0,'#'); }
    if(v==='back'){ U.rows(17,32,(x,y)=>U.put(x,y,(x===5||x===14)?'&':'*')); } },
  // MU Online · Đại Tượng: giáp voi chiến thép xám viền vàng, mũ đầu voi (vòi giữa trán, 2 tai lớn trong hồng, ngà trắng), giáp vai to, khiên tháp tay trái, chuỳ gai tay phải
  mu_dt(U,v){ const s=v==='side', f=v==='front';
    U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)) U.put(x,y,(y===19||y===22)?'%':'_'); }); U.rows(26,26,(x,y,c)=>{ if(c==='U'||BODY_T.includes(c)) U.put(x,y,'$'); });
    U.rows(27,33,(x,y,c)=>{ if(LEG.includes(c)&&(y===29||y===33)) U.put(x,y,'_'); });
    if(f){ U.rect(3,-1,16,3,'_'); U.rect(5,-2,14,-2,'_'); U.rect(3,3,16,3,'$'); U.rect(8,-1,11,-1,'%');   /* mũ đầu voi */
      U.rect(-1,3,2,12,'_'); U.rect(0,5,1,10,'!'); U.rect(17,3,20,12,'_'); U.rect(18,5,19,10,'!');   /* 2 tai voi */
      U.rect(9,4,10,8,'_'); U.put(9,9,'_'); U.put(10,9,'%'); U.put(4,13,'/'); U.put(3,14,'/'); U.put(15,13,'/'); U.put(16,14,'/');   /* vòi + ngà */
      U.rect(-2,17,4,21,'_'); U.rect(15,17,21,21,'_'); U.rect(-2,21,4,21,'$'); U.rect(15,21,21,21,'$'); U.rect(-1,17,3,17,'%'); U.rect(16,17,20,17,'%');   /* giáp vai */
      U.rect(-5,15,-1,31,'_'); U.rect(-5,15,-1,15,'$'); U.rect(-5,31,-1,31,'$'); U.rect(-5,15,-5,31,'$'); U.rect(-1,15,-1,31,'$'); U.rect(-3,20,-3,25,'/'); U.rect(-4,21,-2,22,'%');   /* khiên tháp */
      if(!U.nowep){ U.rect(21,14,21,30,'>'); U.rect(19,9,23,13,'%'); U.rect(19,9,23,9,'_'); U.put(18,11,'_'); U.put(24,11,'_'); U.put(21,8,'_'); U.rect(19,11,23,11,'$'); } }   /* chuỳ gai */
    if(s){ U.rect(4,-1,16,3,'_'); U.rect(6,-2,14,-2,'_'); U.rect(4,3,16,3,'$'); U.rect(3,3,6,12,'_'); U.rect(4,5,5,10,'!');   /* mũ + tai voi phía sau */
      U.rect(17,3,18,9,'_'); U.rect(18,10,19,12,'_'); U.put(19,13,'%'); U.put(16,13,'/'); U.put(17,14,'/'); U.put(18,14,'/');   /* vòi cong xuống trước mặt + ngà */
      U.rect(8,17,14,21,'_'); U.rect(8,21,14,21,'$'); U.rect(9,17,13,17,'%');   /* giáp vai */
      U.rect(16,15,20,31,'_'); U.rect(16,15,20,15,'$'); U.rect(16,31,20,31,'$'); U.rect(20,15,20,31,'$'); U.rect(18,20,18,25,'/'); }   /* khiên tháp đưa ra trước */
    if(v==='back'){ U.rect(3,-1,16,3,'_'); U.rect(5,-2,14,-2,'_'); U.rect(-1,3,2,12,'_'); U.rect(17,3,20,12,'_'); U.rect(-2,17,4,21,'_'); U.rect(15,17,21,21,'_'); U.rect(-2,21,4,21,'$'); U.rect(15,21,21,21,'$');
      U.rows(19,26,(x,y)=>{ if(x>=6&&x<=13&&(y===20||y===24)) U.put(x,y,'$'); }); } },
  // đồ ninja cam: vai + hông đen, băng đeo trán xanh có tấm kim loại, khoá kéo trắng
  mu_naruto(U,v){ const s=v==='side'; U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)&&(y<=20||y>=25)) U.put(x,y,'@'); });
    if(v==='front'){ U.rect(9,21,10,26,'#'); U.rect(3,8,16,9,'?'); U.rect(7,8,12,9,'%'); U.rect(8,8,11,8,'_'); U.rect(0,8,2,9,'?'); }
    if(s){ U.rect(6,8,17,9,'?'); U.rect(12,8,16,9,'%'); U.rect(2,8,5,8,'?'); U.put(1,9,'?'); U.put(0,10,'?'); }
    if(v==='back'){ U.rect(2,8,17,9,'?'); U.put(9,10,'?'); U.put(10,11,'?'); U.rect(7,21,12,24,':'); U.rect(9,22,10,23,'+'); } },
  // áo choàng Hokage: choàng trắng viền lửa đỏ ở gấu, mũ nón trắng đỏ
  mu_hokage(U,v){ const s=v==='side';
    if(v!=='side'){ for(let y=17;y<=32;y++){ U.put(-1,y,'#'); U.put(20,y,'#'); } for(let x=-1;x<=20;x++) U.put(x,33,x%3?':':'+'); } else { for(let y=16;y<=32;y++){ const w=y<20?1:Math.min(4,1+((y-18)>>1)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,'#'); } for(let x=-2;x<=3;x++) U.put(x,33,x%2?':':'+'); }
    const x0=s?3:2, x1=s?17:17; U.rect(x0-2,1,x1+2,2,'#'); U.rect(x0-2,2,x1+2,2,':'); for(let i=0;i<5;i++) U.rect(x0+i*1+1,-i,x1-i*1-1,-i,i%2?':':'#'); if(v==='back'){ U.rect(6,19,13,26,'#'); U.rect(8,21,11,24,':'); } },
  // thợ săn quỷ: vest đen sơ mi trắng + lưỡi cưa thò ra trên đầu (Quỷ Cưa)
  mu_cuamay(U,v){ const s=v==='side', x0=s?8:8; for(let i=0;i<6;i++){ U.rect(x0+i,-5+i,x0+i+2,-4+i,'%'); U.put(x0+i,-6+i,'#'); } for(let i=0;i<6;i+=2) U.put(x0+i+3,-5+i,'@');
    if(v==='front') U.rect(9,19,10,24,'#'); },
  // áo choàng bóng ma tím: mũ trùm gai, mắt đỏ phát sáng ở vành mũ, gấu áo răng cưa
  mu_bongma(U,v){ const s=v==='side';
    if(v!=='side'){ for(let y=17;y<=32;y++){ U.put(-1,y,'&'); U.put(20,y,'&'); } for(let x=-1;x<=20;x++) if(x%2) U.put(x,33,'&'); } else { for(let y=16;y<=32;y++){ const w=y<20?1:Math.min(4,1+((y-18)>>1)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,'&'); } }
    U.rect(s?4:2,-1,s?16:17,2,'&'); for(const x of (s?[5,9,13]:[3,7,12,16])) U.rect(x,-3,x+1,-2,'&'); if(v==='front'){ U.put(6,2,':'); U.put(13,2,':'); } if(s) U.put(15,2,':'); },
  // giáp vảy rồng xanh: vảy vàng trên ngực, mũ có 2 vây sừng
  mu_rongxanh(U,v){ U.rows(19,26,(x,y,c)=>{ if(BODY_T.includes(c)&&((x+y)%3===0)) U.put(x,y,'~'); if(BODY_T.includes(c)&&y===22&&x%4===1) U.put(x,y,'$'); });
    const s=v==='side'; U.rect(s?5:4,0,s?15:15,2,'^'); for(let i=0;i<4;i++){ U.put((s?6:4)-i,-1-i,'~'); U.put((s?14:15)+i,-1-i,'~'); } if(v==='front'){ U.put(9,1,'$'); U.put(10,1,'$'); } },
  // mũ lưỡi cưa (thưởng nhiệm vụ bữa sáng Quỷ Cưa)
  mu_chu_cua(U,v){ const s=v==='side', x0=s?7:8; U.rect(s?5:4,0,s?15:15,2,'+'); for(let i=0;i<6;i++){ U.rect(x0+i,-5+i,x0+i+2,-4+i,'%'); U.put(x0+i,-6+i,'#'); } },
  hw_cowboy(U,v){ const s=v==='side', x0=s?-1:-2, x1=s?20:21; U.rect(x0+2,1,x1-2,2,'<'); U.put(x0,0,'<'); U.put(x0+1,1,'<'); U.put(x1,0,'<'); U.put(x1-1,1,'<'); U.rect(x0+2,2,x1-2,2,'>');
    const c0=4, c1=s?14:15; U.rect(c0,-4,c1,0,'<'); U.rect(c0,-1,c1,-1,'>'); U.put(Math.round((c0+c1)/2),-4,'.');
    if(v==='front'){ U.rect(6,17,13,18,':'); U.rect(8,19,11,19,':'); U.rect(9,20,10,20,':'); } if(s){ U.rect(9,17,16,18,':'); U.rect(13,19,15,19,':'); }
    U.rows(19,25,(x,y,c)=>{ if(BODY_T.includes(c)&&(x%4===0||y%4===0)) U.put(x,y,';'); }); U.rows(33,33,(x,y,c)=>{ if('Ff'.includes(c)&&(x===4||x===15||(s&&x===6))) U.put(x,y,'$'); }); }};
/* ---------- set legacy (Premium Store MU): phủ kín đầu thành mũ giáp / mặt nạ, tô lại thân + chân, vũ khí cầm tay phải (cột 20 nhìn thẳng, 18 nhìn nghiêng) ---------- */
const LGPAL={'0':[76,124,234],'9':[40,70,180],'[':[176,206,255],']':[24,26,40],'{':[255,240,150],'}':[196,136,28],'(':[156,96,56],')':[100,60,34],'-':[255,64,64],'`':[124,226,110],'"':[255,255,255],"'":[150,96,210],'a':[255,166,46],
  '1':[232,48,160],'2':[168,230,48],'3':[255,140,30],'4':[36,180,90],'5':[62,62,72],'6':[34,54,130],'7':[248,208,40],'8':[214,36,48]};   /* màu Kamen Rider: hồng cánh sen, xanh chanh, cam, xanh lá, xám đậm, navy, vàng, đỏ thẫm */
for(const [k,v] of Object.entries(LGPAL)){ PAL[k]=v; KEYS.add(k); }
const LG={
  // đầu: tô mọi pixel đầu (tóc + mặt) theo 3 tông sáng / vừa / tối, sáng ở góc trên trái
  head(U,c,y0=1,y1=18){ U.rows(y0,y1,(x,y)=>U.put(x,y,x<7&&y<9?c[0]:x>13||y>15?c[2]:c[1])); },
  hair(U,c){ U.rows(-10,12,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,x<8?c[0]:c[1]); }); },
  skin(U,c){ U.rows(0,19,(x,y,ch)=>{ if('Ssdn'.includes(ch)) U.put(x,y,ch==='S'?c[0]:c[1]); }); },
  torso(U,c){ U.rows(20,26,(x,y,ch)=>{ if('TtqIiS'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'||ch==='i'?c[2]:x<5?c[0]:c[1]); }); },
  belt(U,c,y=26){ U.rows(y,y,(x,yy,ch)=>{ if(ch!=='O') U.put(x,yy,c); }); },
  hands(U,c){ U.rows(27,28,(x,y,ch)=>{ if('SsdA'.includes(ch)) U.put(x,y,c); }); },
  legs(U,c,b){ U.rows(27,33,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,ch==='p'?c[1]:c[0]); if('Ff'.includes(ch)) U.put(x,y,ch==='f'?b[1]:b[0]); }); },
  // cặp vật đối xứng (sừng, tai, vây): nhìn thẳng / sau vẽ 2 bên, nhìn nghiêng vẽ bên phải + bên trái lùi vào
  pair(U,v,pts,c){ for(const [x,y] of pts){ if(v==='side'){ U.put(x+1,y,c); U.put(19-x-3,y,c); } else { U.put(x,y,c); U.put(19-x,y,c); } } },
  cape(U,v,c,fur){ if(v==='back'){ U.rows(18,33,(x,y)=>U.put(x,y,y<20&&fur?fur:(x===4||x===15)?c[1]:c[0])); return; }
    if(v==='side'){ for(let y=17;y<=33;y++){ const w=y<20?1:Math.min(5,1+((y-17)>>1)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,x===2-w?c[1]:c[0]); } if(fur) U.rect(2,18,6,19,fur); return; }
    for(let y=18;y<=33;y++){ U.put(-1,y,c[0]); U.put(20,y,c[0]); U.put(-2,y,y>24?c[1]:'.'); U.put(21,y,y>24?c[1]:'.'); } if(fur){ U.rect(-1,18,3,19,fur); U.rect(16,18,20,19,fur); } },
  wx:v=>v==='side'?18:20 };
// Kamen Rider: mũ giáp kín mặt, mắt kính to, đai Driver bạc ở eo; 6 form khác màu / mũ (lg_kr0…5, đổi mỗi 5 giây khi đánh)
const KRF=(U,v,o)=>{ const s=v==='side', f=v==='front';
  LG.head(U,o.h); LG.torso(U,o.t); LG.legs(U,o.l,o.b); LG.hands(U,o.hand||']'); LG.belt(U,'%'); if(f){ U.rect(8,26,11,26,o.core||'-'); U.put(9,26,'"'); }
  if(o.eye&&v!=='back') o.eye(U,s); if(o.x) o.x(U,v,s,f); };
Object.assign(C,{
  lg_kr0(U,v){ KRF(U,v,{h:['8','8',';'],t:['8','8',';'],l:['8',';'],b:['0','9'],core:'-',x:(U,v,s,f)=>{ const half=x=>(s?x<12:x<10);   /* Build RabbitTank: nửa đỏ thỏ, nửa xanh xe tăng */
      U.rows(1,18,(x,y,ch)=>{ if(ch!=='O'&&!half(x)) U.put(x,y,y<4?'[':'0'); }); U.rows(19,33,(x,y,ch)=>{ if(ch!=='O'&&!half(x)&&!'%"-'.includes(ch)) U.put(x,y,y>30?'8':'0'); });
      if(f){ U.rect(4,9,8,12,'-'); U.rect(5,8,7,8,'-'); U.rect(11,9,15,12,'['); U.rect(11,9,15,9,'"'); U.rect(5,-2,6,3,'8'); U.put(4,-3,'8'); U.rect(13,-1,15,2,'0'); U.rect(9,1,10,18,']'); U.rect(9,19,10,25,']'); }
      if(s){ U.rect(12,9,16,12,'['); U.rect(13,-1,15,2,'0'); } } }); },
  lg_kr1(U,v){ KRF(U,v,{h:['!','1','1'],t:['!','1','1'],l:['1','2'],b:['1','2'],core:'2',x:(U,v,s,f)=>{   /* Ex-Aid: tóc dựng hồng, mặt đen mắt cam to kiểu game, viền xanh chanh */
      for(let x=s?5:3;x<=(s?16:16);x+=2){ U.rect(x,-4+(x%4),x+1,1,'1'); U.put(x,-4+(x%4),'!'); }
      if(f){ U.rect(3,7,16,15,']'); U.rect(4,8,8,13,'3'); U.rect(11,8,15,13,'3'); U.rect(5,9,6,11,']'); U.rect(13,9,14,11,']'); U.rect(3,7,16,7,'"'); U.rect(6,21,13,24,'_'); U.rect(7,22,8,23,'0'); U.rect(11,22,12,23,'-'); }
      if(s){ U.rect(9,7,17,15,']'); U.rect(12,8,16,13,'3'); U.rect(13,9,14,11,']'); }
      U.rows(27,33,(x,y,ch)=>{ if('PpUj'.includes(ch)&&y%2) U.put(x,y,'2'); }); } }); },
  lg_kr2(U,v){ KRF(U,v,{h:[']',']','5'],t:[']',']','5'],l:[']','5'],b:['5',']'],core:'3',hand:'5',x:(U,v,s,f)=>{   /* Ghost: mũ trùm đen, mặt cam, sừng bạc giữa trán, sọc cam trên áo */
      if(f){ U.rect(4,6,15,15,'3'); U.rect(4,6,15,6,'a'); U.rect(7,9,12,13,']'); U.rect(9,-3,10,8,'%'); U.put(9,-4,'"'); U.rect(4,19,6,25,'3'); U.rect(13,19,15,25,'3'); }
      if(s){ U.rect(10,6,17,15,'3'); U.rect(12,9,15,13,']'); U.rect(13,-3,14,8,'%'); U.rect(9,19,11,25,'3'); }
      if(v==='back'){ U.rows(19,33,(x,y)=>{ if(x>=4&&x<=15) U.put(x,y,y%4?']':'3'); }); } } }); },
  lg_kr3(U,v){ KRF(U,v,{h:['0','6','6'],t:['0','6','6'],l:['6','9'],b:['7','}'],core:'3',hand:'6',x:(U,v,s,f)=>{   /* Gaim: mũ navy samurai sừng vàng, mặt cam lát cam, viền vàng */
      LG.pair(U,v,[[3,3],[2,2],[1,1],[0,0],[-1,-1],[4,4]],'$'); U.rect(s?13:9,-2,s?14:10,2,'$');
      if(f){ U.rect(5,7,14,15,'3'); U.rect(5,7,14,7,'a'); for(const x of [7,9,11]) U.rect(x,8,x,15,'a'); U.rect(9,7,10,7,'-'); U.rect(-1,18,4,21,'$'); U.rect(15,18,20,21,'$'); U.rect(6,20,13,23,'3'); }
      if(s){ U.rect(11,7,17,15,'3'); U.rect(8,18,15,21,'$'); }
      U.rows(19,33,(x,y,ch)=>{ if((y===19||y===27)&&ch!=='O') U.put(x,y,'$'); }); } }); },
  lg_kr4(U,v){ KRF(U,v,{h:['"','"','_'],t:['"','"','_'],l:['"','_'],b:['0','7'],core:'7',hand:'_',x:(U,v,s,f)=>{   /* Fourze: mũ tên lửa trắng chóp nhọn, kính cam to, đai 4 công tắc màu */
      for(let y=-4;y<=0;y++){ const w=2+(y+4); U.rect((s?11:9)-w+1,y,(s?11:10)+w-1,y,'"'); }
      if(f){ U.rect(4,8,15,14,'3'); U.rect(4,8,15,8,'a'); U.rect(6,10,8,12,'['); U.rect(11,10,13,12,'['); U.rect(4,26,5,26,'-'); U.rect(6,26,7,26,'0'); U.rect(12,26,13,26,'7'); U.rect(14,26,15,26,'"'); U.rect(7,20,12,23,'_'); }
      if(s){ U.rect(10,8,17,14,'3'); U.rect(13,10,15,12,'['); } } }); },
  lg_kr5(U,v){ KRF(U,v,{h:['-','8','8'],t:['-','8','8'],l:['4','4'],b:['4','5'],core:'7',hand:']',x:(U,v,s,f)=>{   /* OOO: mũ đại bàng đỏ mào nhọn, mắt xanh lá to; ngực đỏ, giữa vàng hổ, dưới xanh châu chấu */
      for(let i=0;i<6;i++){ const x=(s?6:3)+i*(s?2:3); U.rect(x,-3+(i%2),x+1,1,'8'); U.put(x,-3+(i%2),'-'); }
      if(f){ U.rect(4,8,15,14,'4'); U.rect(4,8,15,8,'`'); U.rect(9,9,10,14,']'); U.rect(-1,19,4,24,'7'); U.rect(15,19,20,24,'7'); }
      if(s){ U.rect(10,8,17,14,'4'); U.rect(9,19,14,24,'7'); }
      U.rows(19,26,(x,y,ch)=>{ if(ch==='O'||'%"-'.includes(ch)) return; if(y>=22&&y<=23) U.put(x,y,'7'); else if(y>=24) U.put(x,y,'4'); }); if(f) U.rect(8,20,11,21,'7'); } }); },
  // Shovel Knight: mũ giáp xanh sừng ngà cong, khe chữ T, vai tròn, đai vàng, xẻng cán nâu lưỡi bạc
  lg_shovel(U,v){ const s=v==='side'; LG.head(U,['[','0','9']); LG.torso(U,['[','0','9']); LG.legs(U,['0','9'],['9',']']); LG.hands(U,'9'); LG.belt(U,'$');
    LG.pair(U,v,[[2,5],[1,4],[0,3],[-1,2],[-2,1],[-2,0],[-2,-1],[-1,-2],[1,5],[0,4],[-1,3]],'/'); LG.pair(U,v,[[-2,-2],[-1,-3],[0,-3]],'{');
    if(v==='front'){ U.rect(5,10,14,11,']'); U.rect(9,10,10,16,']'); } if(s){ U.rect(11,10,18,11,']'); U.rect(14,10,15,16,']'); }
    if(!s){ U.rect(-1,19,5,21,'0'); U.rect(14,19,20,21,'0'); U.rect(-1,19,5,19,'['); U.rect(14,19,20,19,'['); U.put(2,21,'$'); U.put(17,21,'$'); } else { U.rect(8,19,15,21,'0'); U.rect(8,19,15,19,'['); }
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,9,X,26,'<'); U.rect(X-1,26,X+1,26,'$'); U.rect(X-1,27,X+1,31,'%'); U.rect(X+1,27,X+1,31,'_'); U.put(X,32,'%'); } },
  // King Knight: giáp vàng, vương miện có thánh giá, khe mũ dọc, áo choàng đỏ lông trắng, quyền trượng ngọc đỏ
  lg_king(U,v){ const s=v==='side'; LG.cape(U,v,[':',';'],'#'); LG.head(U,['{','$','}']); LG.torso(U,['{','$','}']); LG.legs(U,[':',';'],['$','}']); LG.hands(U,'$');
    U.rows(23,25,(x,y,ch)=>{ if(ch!=='O'&&x>=7&&x<=12&&v==='front') U.put(x,y,':'); });
    const c0=s?5:4, c1=s?15:15; U.rect(c0,0,c1,0,'$'); for(const x of [c0,Math.round((c0+c1)/2),c1]){ U.put(x,-1,'$'); U.put(x,-2,'{'); } U.rect(Math.round((c0+c1)/2)-1,-4,Math.round((c0+c1)/2)+1,-4,'$'); U.put(Math.round((c0+c1)/2),-5,'$'); U.put(c0+3,0,':'); U.put(c1-3,0,':');
    if(v==='front') U.rect(9,9,10,16,']'); if(s) U.rect(14,9,15,16,']');
    if(v==='back') U.rows(20,32,(x,y)=>{ if((x*3+y*5)%11===0) U.put(x,y,'@'); });
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,12,X,29,'$'); U.rect(X-1,8,X+1,11,':'); U.put(X,9,'-'); U.put(X,7,'$'); U.put(X,6,'$'); U.rect(X-1,12,X+1,12,'}'); } },
  // Sparta Sư Tử: mũ đồng che má, chùm lông đỏ viền xanh, ngực trần, găng đầu sư tử vàng, váy da tua, dép quai
  lg_sparta(U,v){ const s=v==='side'; U.rows(1,10,(x,y)=>U.put(x,y,y<4?'%':'_')); U.rows(11,17,(x,y)=>{ if(s?(x<7):(x<5||x>14)) U.put(x,y,'_'); });
    if(v==='front'){ U.rect(9,3,10,10,'%'); U.rect(8,8,11,8,'@'); } if(s) U.rect(12,3,13,9,'%');
    const cr=s?[2,16]:[3,16]; U.rect(cr[0],-3,cr[1],0,':'); U.rect(cr[0]+2,-5,cr[1]-2,-4,':'); U.rect(cr[0],0,cr[1],0,';'); U.put(cr[0]-1,-1,'0'); U.put(cr[1]+1,-1,'0'); U.rect(cr[0]+2,-6,cr[1]-2,-6,'0');
    U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'?'s':'S'); }); if(v==='front'){ U.rect(9,22,10,25,'d'); U.rect(7,23,12,23,'d'); }
    if(!s){ U.rect(-2,23,4,28,'$'); U.rect(15,23,21,28,'$'); for(const x of [-2,15]){ U.rect(x,23,x+6,23,'}'); U.rect(x+1,27,x+5,28,'@'); U.put(x+2,27,'#'); U.put(x+4,27,'#'); U.put(x+1,25,'@'); U.put(x+5,25,'@'); } }
    else { U.rect(15,22,21,27,'$'); U.rect(15,22,21,22,'}'); U.rect(19,25,21,27,'@'); U.put(20,25,'#'); U.put(18,24,'@'); U.rect(3,24,7,27,'}'); }
    U.rows(27,29,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,y===27?'$':x%2?'<':'>'); }); U.rows(30,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,'S'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,(x+y)%2?'<':'S'); }); },
  // Nasus Thần Cát: đầu chó rừng nâu, khăn vàng, tai dài, mắt xanh phát sáng, vòng cổ vàng, váy xanh lá đai tím, quyền trượng
  lg_anubis(U,v){ const s=v==='side'; LG.head(U,['(',')',')']); U.rows(1,6,(x,y)=>U.put(x,y,y%2?'$':'}'));
    LG.pair(U,v,[[3,0],[3,-1],[4,-1],[3,-2],[4,-2],[4,-3],[4,-4],[5,-5]],'$'); LG.pair(U,v,[[4,0],[4,-1],[5,-2]],':');
    if(v==='front'){ U.rect(6,10,7,10,'?'); U.rect(12,10,13,10,'?'); U.rect(6,13,13,17,'('); U.rect(9,13,10,13,'@'); U.rect(8,16,11,16,'@'); }
    if(s){ U.rect(14,10,15,10,'?'); U.rect(14,13,22,16,'('); U.rect(22,13,22,14,'@'); U.rect(16,16,21,16,')'); }
    if(v==='back') U.rect(7,7,12,18,'$');
    U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'?')':'('); }); U.rows(19,21,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,y===21?'}':'$'); }); if(v==='front') U.rect(9,20,10,21,'?');
    U.rows(24,24,(x,y,ch)=>{ if(ch!=='O'&&(x<6||x>13)) U.put(x,y,'$'); }); LG.hands(U,')'); LG.belt(U,'&');
    U.rows(27,30,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,y===27?'&':x%3?'~':'^'); }); U.rows(31,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,')'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,y===32?'$':'}'); });
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,8,X,33,'^'); for(const y of [14,22,30]) U.put(X,y,'$'); U.rect(X-1,3,X+1,7,'$'); U.put(X,2,'$'); U.put(X,5,'~'); U.put(X,4,'?'); } },
  // Samurai Quỷ Đỏ: mũ kabuto đen sừng trăng lưỡi liềm vàng, mặt nạ quỷ đỏ mắt vàng nanh trắng, giáp lá đỏ đen, vai to, katana
  lg_samurai(U,v){ const s=v==='side'; LG.head(U,[']','@','@'],1,9); U.rows(9,9,(x,y)=>U.put(x,y,':'));
    LG.pair(U,v,[[5,0],[4,-1],[3,-2],[2,-3],[2,-4],[1,-5],[4,0],[3,-1]],'$'); LG.pair(U,v,[[1,-6],[2,-5]],'a');
    U.rows(10,18,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,y>16?']':(x<5||x>14)&&!s?';':':'); });
    if(v==='front'){ U.rect(4,11,7,12,'$'); U.rect(12,11,15,12,'$'); U.rect(5,12,6,12,'@'); U.rect(13,12,14,12,'@'); U.rect(6,15,13,16,'@'); U.put(6,15,'#'); U.put(13,15,'#'); U.put(8,16,'#'); U.put(11,16,'#'); U.rect(8,8,11,9,'$'); }
    if(s){ U.rect(12,11,16,12,'$'); U.rect(14,12,15,12,'@'); U.rect(12,15,18,16,'@'); U.put(17,15,'#'); U.put(13,16,'#'); }
    U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,y%2?']':(ch==='t'||ch==='q'?';':':')); }); LG.hands(U,']');
    if(!s){ U.rect(-2,19,4,23,':'); U.rect(15,19,21,23,':'); for(const y of [20,22]){ U.rect(-2,y,4,y,']'); U.rect(15,y,21,y,']'); } } else { U.rect(7,19,15,23,':'); U.rect(7,21,15,21,']'); }
    LG.legs(U,[']','@'],[';',']']); U.rows(27,29,(x,y,ch)=>{ if(ch!=='O'&&(x<7||x>12)) U.put(x,y,y%2?':':';'); });
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,7,X,25,'%'); U.rect(X+1,8,X+1,24,'#'); U.put(X,6,'#'); U.rect(X-1,26,X+1,26,'$'); U.rect(X,27,X,30,']'); U.put(X,28,':'); } },
  // Chainsaw Man: đầu cưa máy cam, lưỡi cưa dựng trên trán, hàm răng nhọn, sơ mi trắng cà vạt đen, 2 tay mọc lưỡi cưa
  lg_chainsaw(U,v){ const s=v==='side'; LG.head(U,['a','+','=']); const bx=s?10:9; U.rect(bx-1,-8,bx+1,0,'%'); U.rect(bx,-8,bx,0,'#'); for(let y=-7;y<=0;y+=2){ U.put(bx-2,y,'@'); U.put(bx+2,y+1,'@'); }
    if(v==='front'){ U.rect(4,12,15,16,'@'); for(let x=4;x<=15;x+=2){ U.put(x,12,'#'); U.put(x+1,16,'#'); } U.rect(5,9,6,10,'#'); U.rect(13,9,14,10,'#'); }
    if(s){ U.rect(11,12,18,16,'@'); for(let x=11;x<=18;x+=2){ U.put(x,12,'#'); U.put(x+1,16,'#'); } U.rect(14,9,15,10,'#'); }
    LG.torso(U,['#','#','%']); if(v==='front'){ U.rect(9,20,10,25,'@'); U.put(9,26,'@'); } if(s) U.rect(14,20,15,25,'@'); LG.legs(U,[']','@'],['<','>']); LG.hands(U,'s');
    if(v!=='back'){ const xs=s?[18]:[-2,20]; for(const X of xs){ U.rect(X,14,X+1,27,'%'); U.rect(X,14,X,27,'#'); for(let y=15;y<=27;y+=2){ U.put(X+(X<0?-1:2),y,'@'); } U.rect(X,27,X+1,28,'+'); } } },
  // Yoshi: mũ khủng long xanh mõm trắng to, mắt tròn trắng, gai đỏ sau lưng, bụng trắng, mai yên đỏ, giày đỏ
  lg_yoshi(U,v){ const s=v==='side'; LG.head(U,['~','~','^']);
    if(v==='front'){ U.rect(4,12,15,17,'#'); U.rect(4,17,15,17,'%'); U.put(7,13,'@'); U.put(12,13,'@'); U.rect(4,3,8,8,'#'); U.rect(11,3,15,8,'#'); U.rect(6,5,7,7,'@'); U.rect(12,5,13,7,'@'); }
    if(s){ U.rect(13,10,22,16,'#'); U.rect(13,10,22,10,'~'); U.rect(13,16,22,16,'%'); U.put(21,12,'@'); U.rect(10,2,15,7,'#'); U.rect(13,4,14,6,'@'); for(const y of [3,7,11,15]) U.rect(0,y,1,y+1,':'); }
    if(v==='back') for(const y of [2,6,10,14,18]) U.rect(9,y,10,y+1,':');
    LG.torso(U,['~','~','^']); if(v==='front') U.rows(20,26,(x,y,ch)=>{ if(x>=7&&x<=12&&ch!=='O') U.put(x,y,'#'); });
    if(v==='back'){ U.rect(5,20,14,25,':'); U.rect(5,20,14,20,'#'); U.rect(5,25,14,25,'#'); } if(s){ U.rect(3,20,8,25,':'); U.rect(3,20,8,20,'#'); }
    LG.hands(U,'~'); LG.legs(U,['~','^'],[':',';']); },
  // Aang Tiết Khí Sư: đầu trọc mũi tên xanh, áo cam cổ vàng, ống tay vàng, quần vàng xà cạp nâu, gậy lượn dài
  lg_aang(U,v){ const s=v==='side'; U.rows(-10,12,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,x>12?'s':'S'); });
    if(v==='front'){ U.rect(9,1,10,8,'0'); U.rect(8,8,11,8,'0'); U.rect(9,9,10,9,'0'); } if(s){ for(let i=0;i<10;i++) U.put(3+i,Math.max(1,6-Math.abs(i-4))>>0,'0'); U.rect(12,6,13,8,'0'); } if(v==='back') U.rect(9,1,10,14,'0');
    LG.torso(U,['$','a','=']); U.rows(19,21,(x,y,ch)=>{ if(ch!=='O'&&x>=5&&x<=14) U.put(x,y,'$'); }); LG.belt(U,'=',25); LG.hands(U,'S');
    U.rows(23,26,(x,y,ch)=>{ if(ch!=='O'&&(x<5||x>14)) U.put(x,y,'$'); });
    LG.legs(U,['$','}'],['<','>']); U.rows(30,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,'<'); });
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,2,X,33,'<'); for(const y of [8,9,26,27]) U.put(X,y,'>'); U.put(X,1,'$'); } },
  // Quyền Vương: ngực trần, găng đỏ to cổ găng trắng, quần đùi đỏ cạp trắng, giày boxing trắng cao cổ
  lg_boxer(U,v){ const s=v==='side'; U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'?'s':'S'); }); if(v==='front'){ U.rect(9,22,10,25,'d'); U.rect(7,24,12,24,'d'); }
    if(!s){ for(const x of [-2,15]){ U.rect(x,23,x+6,29,':'); U.rect(x+4,24,x+6,29,';'); U.rect(x,23,x+6,23,'#'); U.put(x+1,25,'-'); U.put(x+2,24,'-'); } }
    else { U.rect(15,21,21,27,':'); U.rect(19,22,21,27,';'); U.rect(15,21,15,27,'#'); U.put(17,22,'-'); U.rect(3,23,8,28,';'); U.rect(8,23,8,28,'#'); }
    U.rows(27,30,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,y===27?'#':(x===5||x===14)?'#':ch==='p'?';':':'); }); U.rows(31,33,(x,y,ch)=>{ if('PpFf'.includes(ch)) U.put(x,y,y===33?'%':'#'); }); },
  // Zeus Thần Sấm: tóc + râu bạc dài, áo choàng thần màu kem lệch vai, giáp vai vàng, vòng tay vàng, đai vàng, cầm tia sét vàng
  lg_zeus(U,v){ const s=v==='side'; LG.hair(U,['#','%']); U.rows(-10,4,(x,y,ch)=>{ if(ch!=='O'&&ch!=='.') U.put(x,y,'#'); });
    if(v==='front'){ U.rect(3,14,16,19,'#'); U.rect(5,19,14,21,'#'); U.rect(8,15,11,15,'S'); U.rect(9,16,10,16,'@'); for(const x of [5,8,11,14]) U.rect(x,17,x,20,'%'); U.rect(4,10,7,10,'#'); U.rect(12,10,15,10,'#'); }
    if(s){ U.rect(9,14,18,19,'#'); U.rect(11,19,17,22,'#'); U.rect(15,15,17,15,'S'); for(const x of [11,14,17]) U.rect(x,17,x,21,'%'); U.rect(2,6,5,22,'#'); U.rect(13,10,16,10,'#'); }
    if(v==='back') U.rows(5,24,(x,y,ch)=>{ if(x>=4&&x<=15) U.put(x,y,x%3?'#':'%'); });
    U.rows(20,26,(x,y,ch)=>{ if(!'TtqIi'.includes(ch)) return; const bare=s?x<8:x<6; U.put(x,y,bare?(ch==='t'?'s':'S'):(x+y)%5===0?'|':'/'); }); if(!s){ U.rect(14,19,19,21,'$'); U.rect(14,19,19,19,'{'); } else U.rect(9,19,15,21,'$');
    U.rows(24,24,(x,y,ch)=>{ if(ch!=='O'&&(s?x<8:x<6)) U.put(x,y,'$'); }); LG.belt(U,'$'); LG.hands(U,'S');
    LG.legs(U,['/','|'],['$','}']); U.rows(30,31,(x,y,ch)=>{ if('Pp'.includes(ch)&&x%3===0) U.put(x,y,'S'); });
    if(v!=='back'){ const X=LG.wx(v), zz=[0,1,1,0,-1,-1]; for(let y=8;y<=30;y++){ U.put(X+zz[y%6],y,y%4?'$':'{'); } U.put(X+1,7,'"'); U.put(X-1,31,'"'); } },
  // Piccolo: da xanh lá tai nhọn, khăn turban trắng chóp tím, áo choàng trắng vai độn to, võ phục tím đai xanh, giày nâu
  lg_piccolo(U,v){ const s=v==='side'; LG.cape(U,v,['#','%']); U.rows(1,9,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,x>13?'%':'#'); }); U.rect(s?8:8,-1,s?12:11,0,'&'); U.rect(s?9:9,-2,s?11:10,-2,'*');
    LG.skin(U,['`','~']); U.rows(10,19,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,'`'); }); if(v!=='side'){ U.put(-1,11,'`'); U.put(-2,10,'`'); U.put(20,11,'`'); U.put(21,10,'`'); } else { U.put(4,10,'`'); U.put(3,9,'`'); }
    LG.torso(U,['&','&','*']); LG.belt(U,'0'); LG.hands(U,'`'); LG.legs(U,['&','*'],['<','>']);
    if(!s){ U.rect(-3,18,5,21,'#'); U.rect(14,18,22,21,'#'); U.rect(-3,21,5,21,'%'); U.rect(14,21,22,21,'%'); } else { U.rect(6,18,16,21,'#'); U.rect(6,21,16,21,'%'); } },
  // Mega Man X: mũ xanh sọc xanh nhạt ngọc đỏ trán, tai nghe tròn, giáp xanh, súng tay X-Buster, ủng to
  lg_megax(U,v){ const s=v==='side'; U.rows(1,9,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,(s?x>=10&&x<=12:x>=8&&x<=11)&&y<8?'[':x<6?'[':'0'); }); U.rect(s?13:9,7,s?14:10,8,':');
    U.rows(10,17,(x,y,ch)=>{ if(ch!=='O'&&(s?x<8:(x<4||x>15))) U.put(x,y,'0'); }); if(v!=='side'){ U.rect(0,12,2,15,'9'); U.rect(17,12,19,15,'9'); } else U.rect(4,12,6,15,'9');
    if(v==='back') LG.head(U,['[','0','9']);
    LG.torso(U,['[','0','9']); if(v==='front') U.rect(7,20,12,22,'['); LG.hands(U,'0'); LG.legs(U,['0','9'],['[','0']); U.rows(30,33,(x,y,ch)=>{ if('PpFf'.includes(ch)) U.put(x,y,y>=32?'9':'0'); });
    if(v==='front'){ U.rect(15,23,21,29,'0'); U.rect(15,23,21,23,'['); U.rect(19,27,21,29,'@'); U.put(20,28,'?'); }
    if(s){ U.rect(14,22,22,26,'0'); U.rect(14,22,22,22,'['); U.rect(22,23,22,25,'@'); U.put(22,24,'?'); } },
  // Zero: mũ đỏ ngọc xanh, vây trắng 2 bên, tóc vàng dài bay sau lưng, giáp đỏ viền trắng, Z-Saber lưỡi xanh lá
  lg_zero(U,v){ const s=v==='side';
    if(v==='back') U.rows(8,31,(x,y,ch)=>{ if(x>=5&&x<=14) U.put(x,y,x%3?'$':'}'); }); if(s){ for(let y=6;y<=29;y++){ const w=Math.min(4,1+(y>>3)); for(let x=2-w;x<=2;x++) if(!U.body(x,y)) U.put(x,y,y%3?'$':'}'); } } if(v==='front'){ for(let y=12;y<=27;y++){ U.put(-1,y,'$'); U.put(20,y,'$'); } }
    U.rows(1,9,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,x<6?'-':':'); }); U.rect(s?12:9,6,s?13:10,7,'?'); if(v!=='side'){ U.rect(0,4,2,9,'#'); U.rect(17,4,19,9,'#'); } else U.rect(4,4,6,9,'#');
    U.rows(10,17,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,'$'); });
    LG.torso(U,['-',':',';']); if(v==='front'){ U.rect(7,20,12,21,'#'); U.rect(9,22,10,25,'%'); } LG.belt(U,'%'); LG.hands(U,'#'); LG.legs(U,[':',';'],[':',';']); U.rows(29,29,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,'#'); });
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,5,X,24,'`'); U.rect(X+1,6,X+1,23,'"'); U.rect(X-1,25,X+1,25,'_'); U.rect(X,26,X,29,'%'); } },
  // 16Typh: tóc bạch kim xanh dựng, blazer đen ve xám, sơ mi hoạ tiết hình học vàng đen, chuỗi ngọc trai, khuyên tai bạc
  lg_16typh(U,v){ const s=v==='side'; U.rows(-10,12,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,x<8||(x+y)%4===0?'?':'_'); }); for(const x of (s?[4,7,10,13]:[3,6,9,12,15])){ U.put(x,0,'?'); U.put(x+1,-1,'?'); U.put(x+1,-2,'_'); }
    U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='I'||ch==='i'?((x+y)%3===0?'$':(x*2+y)%5===0?'/':'@'):ch==='t'||ch==='q'?'@':']'); });
    if(v==='front'){ U.rect(6,20,7,24,'_'); U.rect(12,20,13,24,'_'); for(let x=7;x<=12;x++) if(x%2) U.put(x,19,'#'); else U.put(x,20,'#'); U.put(1,13,'%'); U.put(18,13,'%'); }
    if(s){ U.rect(13,20,13,24,'_'); for(let x=12;x<=16;x+=2) U.put(x,19,'#'); U.put(6,14,'%'); }
    if(v==='back') U.rows(20,26,(x,y,ch)=>{ if(ch!=='O') U.put(x,y,x===9||x===10?'@':']'); });
    LG.hands(U,'S'); LG.legs(U,[']','@'],['@',']']); },
  // Rắn Biển: áo bơi thể thao đen viền ngọc, quần short bơi xanh dây rút trắng, hình xăm rắn xanh quấn 2 cánh tay, dép tông quai đỏ
  lg_ranbien(U,v){ const s=v==='side', f=v==='front';
    U.rows(20,26,(x,y,ch)=>{ if(!'TtqIi'.includes(ch)) return; const top=y<=22&&(s?x>=8:x>=5&&x<=14); U.put(x,y,top?(y===20?'?':']'):ch==='t'||ch==='q'?'s':'S'); });
    const snake=pts=>{ for(const [x,y] of pts) if(U.body(x,y)) U.put(x,y,'^'); };
    if(f){ snake([[2,20],[3,21],[4,22],[3,23],[2,24],[3,25],[4,26],[17,20],[16,21],[15,22],[16,23],[17,24],[16,25]]); U.put(4,27,'~'); U.put(15,26,'~'); }
    if(s){ snake([[14,20],[15,21],[16,22],[15,23],[14,24],[15,25],[16,26],[5,21],[6,22],[5,23]]); U.put(16,27,'~'); }
    if(v==='back'){ U.rows(21,22,(x,y,ch)=>{ if(ch!=='O'&&x>=3&&x<=16) U.put(x,y,']'); }); snake([[2,20],[3,21],[4,22],[3,23],[2,24],[17,20],[16,21],[15,22]]); }
    LG.hands(U,'S'); U.rows(27,30,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,y===27&&(x===9||x===10)&&!s?'#':ch==='p'?'9':'0'); });
    U.rows(31,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,'S'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,y===32?'-':'S'); }); },
  // Khúc Thị Hương: tóc đen dài thả 2 bên vai, bikini đen có khoen bạc giữa, hình xăm rắn tay phải + hoa tay trái, khuyên rốn, dép quai đen, tay cầm điện thoại trắng
  lg_kth(U,v){ const s=v==='side', f=v==='front', b=v==='back';
    U.rows(-10,19,(x,y,ch)=>{ if('HhJX'.includes(ch)) U.put(x,y,(x+y)%5===0?']':'@'); });
    if(f){ for(let y=10;y<=26;y++){ U.put(0,y,'@'); U.put(19,y,'@'); if(y<22){ U.put(-1,y,y%3?'@':']'); U.put(20,y,y%3?'@':']'); } } }
    if(s) for(let y=8;y<=26;y++){ const w=y<12?2:3; for(let x=2-w;x<=2;x++) if(!U.body(x,y)||x<4) U.put(x,y,(x+y)%4?'@':']'); }
    if(b) U.rows(6,26,(x,y,ch)=>{ if(ch!=='O'&&x>=3&&x<=16) U.put(x,y,(x*3+y)%7===0?']':'@'); });
    U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'?'s':'S'); });
    if(f){ U.rect(5,21,8,22,'@'); U.rect(11,21,14,22,'@'); U.put(6,20,'@'); U.put(13,20,'@'); U.rect(9,22,10,22,'%'); U.put(9,25,'%');
      for(const [x,y] of [[17,20],[16,21],[15,22],[16,23],[17,24],[16,25],[15,26]]) if(U.body(x,y)) U.put(x,y,'@');
      for(const [x,y] of [[2,21],[3,21],[2,22],[4,23],[3,24],[2,25],[3,26]]) if(U.body(x,y)) U.put(x,y,'_');
      U.rect(19,23,20,27,'%'); U.rect(20,24,20,26,'#'); }
    if(s){ U.rect(9,21,15,22,'@'); U.put(14,20,'@'); for(const [x,y] of [[14,20],[15,21],[16,22],[15,23],[14,24],[15,25]]) if(U.body(x,y)&&y>22) U.put(x,y,'@'); U.rect(17,22,18,26,'%'); U.rect(18,23,18,25,'#'); }
    if(b) U.rows(21,21,(x,y,ch)=>{ if(ch!=='O'&&x>=2&&x<=17) U.put(x,y,'@'); });
    LG.hands(U,'S');
    U.rows(27,28,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,y===27||(x>=7&&x<=12)?'@':'S'); }); if(!s){ U.put(5,27,'%'); U.put(14,27,'%'); }
    U.rows(29,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,ch==='p'?'s':'S'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,y===32?'@':'S'); }); },
  // Min (được 16Typh gọi ra): áo lưới màu kem tay dài, quần short ánh vàng, giày nâu
  mu_min(U,v){ U.rows(20,26,(x,y,ch)=>{ if('TtqIi'.includes(ch)) U.put(x,y,ch==='t'||ch==='q'?'|':(y%2&&(x<5||x>14))?'S':'/'); }); U.rows(27,30,(x,y,ch)=>{ if('PpUj'.includes(ch)) U.put(x,y,ch==='p'?'}':'$'); });
    U.rows(31,31,(x,y,ch)=>{ if('Pp'.includes(ch)) U.put(x,y,'S'); }); U.rows(32,33,(x,y,ch)=>{ if('Ff'.includes(ch)) U.put(x,y,ch==='f'?'>':'<'); }); },
  // Darth Vader: mũ giáp đen loe vành, mặt nạ mắt kính tối miệng lưới xám, bảng điều khiển ngực, áo choàng đen, kiếm ánh sáng đỏ
  lg_vader(U,v){ const s=v==='side'; LG.cape(U,v,['@',']']); LG.head(U,['_',']','@']); if(v!=='side'){ U.rect(0,15,19,17,'@'); U.rect(-1,16,0,17,'@'); U.rect(19,16,20,17,'@'); } else U.rect(1,15,9,17,'@');
    if(v==='front'){ U.rect(4,10,7,12,'@'); U.rect(12,10,15,12,'@'); U.rect(5,10,6,10,'_'); U.rect(13,10,14,10,'_'); U.rect(8,13,11,17,'_'); U.rect(9,14,10,16,'@'); U.put(8,17,'%'); U.put(11,17,'%'); }
    if(s){ U.rect(12,10,15,12,'@'); U.rect(13,10,14,10,'_'); U.rect(14,13,18,17,'_'); U.rect(15,14,17,16,'@'); }
    LG.torso(U,[']','@','@']); if(v==='front'){ U.rect(7,21,12,23,'_'); U.put(8,22,'-'); U.put(9,22,'0'); U.put(10,22,'$'); U.put(11,22,'-'); } LG.belt(U,'%'); if(v==='front') U.rect(9,26,10,26,'_');
    LG.hands(U,'@'); LG.legs(U,['@',']'],['@',']']);
    if(v!=='back'&&!U.nowep){ const X=LG.wx(v); U.rect(X,4,X,24,'-'); U.rect(X,5,X,23,'"'); U.put(X-1,4,'-'); U.put(X+1,4,'-'); U.rect(X,25,X,29,'%'); U.put(X,27,']'); } } });
// trả về lưới đã nới lề + vẽ trang phục + viền
// nw: người chơi đang cầm vũ khí của Thợ Rèn → không vẽ vũ khí có sẵn trong bộ đồ (vũ khí thật vẽ riêng trên tay)
function apply(G,set,view,nw){ const P=pad(G), f=C[set]; if(f){ const u=api(P); u.nowep=!!nw; f(u,view); } outline(P); return P; }
// đồ phủ thường (wear.js: mũ, kính, khăn, hoạ tiết...): nới lề rồi để fn vẽ, viền đen phần vẽ thêm
function over(G,view,fn){ const P=pad(G); fn(api(P),view); outline(P); return P; }
window.HWC={PX,PT,PAL,KEYS,C,LG,apply,over};   /* KEYS, LG: wear.js / sets.js thêm màu, dùng chung bộ vẽ */
})();
