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
  hw_cowboy(U,v){ const s=v==='side', x0=s?-1:-2, x1=s?20:21; U.rect(x0+2,1,x1-2,2,'<'); U.put(x0,0,'<'); U.put(x0+1,1,'<'); U.put(x1,0,'<'); U.put(x1-1,1,'<'); U.rect(x0+2,2,x1-2,2,'>');
    const c0=4, c1=s?14:15; U.rect(c0,-4,c1,0,'<'); U.rect(c0,-1,c1,-1,'>'); U.put(Math.round((c0+c1)/2),-4,'.');
    if(v==='front'){ U.rect(6,17,13,18,':'); U.rect(8,19,11,19,':'); U.rect(9,20,10,20,':'); } if(s){ U.rect(9,17,16,18,':'); U.rect(13,19,15,19,':'); }
    U.rows(19,25,(x,y,c)=>{ if(BODY_T.includes(c)&&(x%4===0||y%4===0)) U.put(x,y,';'); }); U.rows(33,33,(x,y,c)=>{ if('Ff'.includes(c)&&(x===4||x===15||(s&&x===6))) U.put(x,y,'$'); }); }};
// trả về lưới đã nới lề + vẽ trang phục + viền
function apply(G,set,view){ const P=pad(G), f=C[set]; if(f) f(api(P),view); outline(P); return P; }
window.HWC={PX,PT,PAL,C,apply};
})();
