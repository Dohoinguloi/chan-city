/* Chan City — cảnh quan nông trại bác Trang (Đà Lạt) kiểu game nông trại pixel: hàng mai anh đào hai bên đường (cánh hoa rơi), cột đèn Đà Lạt sáng về đêm,
   cổng hoa vòm, cẩm tú cầu viền vườn hoa, đồng hướng dương + hoa dại, tổ ong, bù nhìn, giếng nước, cỏ khô, lá súng + lau sậy + cầu gỗ + thuyền trên hồ,
   góc picnic có dây đèn, khóm cỏ / sỏi / nấm rải khắp; bướm bay quanh vườn hoa. Chỉ trang trí ở ô cỏ trống: không đụng luống, chuồng, NPC, chỗ bấm E. */
(function(){
const A=ART, T=A.T, SD=SHARED, X=MAPX, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), hash=A.hash;
const GR=['#5aa84a','#3e8a3a','#86c85a','#2e6a2e'], PK=['#f4a6c8','#e87aa8','#ffd0e4','#c85a8a'], BR=['#6a4a2e','#4a3020','#8a6440'];
/* ---------- hình ---------- */
// mai anh đào: thân nâu chĩa nhánh, tán hoa hồng nhiều lớp (3 dáng)
const cherry=v=>S(46,54,23,52,(g,P)=>{ P.rect(21,30,5,22,BR[0]); P.rect(21,30,2,22,BR[2]); P.rect(16,30,6,3,BR[0]); P.rect(25,27,7,3,BR[0]); P.rect(20,50,8,3,BR[1]);
  const c=v===2?['#f8d8e8','#e8b0c8','#ffffff','#c890a8']:v===1?['#f8b8d4','#e890b4','#ffe0ee','#c86a94']:PK, bl=[[23,14,13],[12,20,10],[34,20,10],[17,9,9],[30,9,9],[23,24,10],[8,28,7],[38,28,7]];
  for(const [x,y,r] of bl) P.disc(x,y+2,r,c[3]); for(const [x,y,r] of bl) P.disc(x,y,r,c[1]); for(const [x,y,r] of bl) P.disc(x-2,y-2,Math.round(r*.6),c[0]);
  for(let i=0;i<26;i++) P.px(4+Math.floor(hash(i,v,91)*38),2+Math.floor(hash(v,i,92)*32),i%3?c[2]:'#ffffff'); });
// cẩm tú cầu: bụi lá + chùm hoa tròn xanh / tím / hồng
const HYD=[['#7a9ae8','#9ab8f8','#5a78c8'],['#a07ad8','#c09af0','#7a58b8'],['#f0a0c8','#f8c0d8','#d07aa8']];
const hydrangea=v=>S(26,20,13,18,(g,P)=>{ P.disc(13,12,9,GR[1]); P.disc(8,13,6,GR[0]); P.disc(18,13,6,GR[0]); const c=HYD[v%3];
  for(const [x,y] of [[8,8],[17,7],[12,12],[6,13],[20,12]]){ P.disc(x,y,4,c[2]); P.disc(x,y-1,3,c[0]); P.px(x-1,y-2,c[1]); P.px(x+1,y,c[1]); } });
// hướng dương: 3 cành, hoa vàng nhuỵ nâu
const sunflowers=()=>S(24,38,12,36,(g,P)=>{ for(const [x,h] of [[5,24],[12,32],[19,26]]){ P.rect(x,36-h,2,h,GR[1]); P.rect(x-3,36-h*.55,3,2,GR[0]); P.rect(x+2,36-h*.4,3,2,GR[0]);
  const cy=36-h; P.disc(x+1,cy,5,'#f2c43d'); P.disc(x+1,cy,4,'#ffd84a'); P.disc(x+1,cy,2,'#6a3a1a'); P.px(x,cy-1,'#8a5a2a'); } });
// hoa dại, khóm cỏ, sỏi, nấm (trải dưới chân, không vướng)
const FLW=['#ffffff','#ffd84a','#e85a8a','#9a7ae8','#ff8a3a','#7ac8f0'];
const wildflowers=v=>S(16,10,8,6,(g,P)=>{ for(let i=0;i<6;i++){ const x=2+Math.floor(hash(i,v,61)*12), y=2+Math.floor(hash(v,i,62)*6), c=FLW[(v+i)%FLW.length]; P.px(x,y+1,GR[1]); P.px(x,y,c); P.px(x-1,y,c); P.px(x+1,y,c); P.px(x,y-1,c); P.px(x,y,'#ffe890'); } },false);
const tuft=v=>S(10,7,5,6,(g,P)=>{ for(let i=0;i<4;i++){ const x=1+i*2+(v%2), h=3+((i+v)%3); P.rect(x,6-h,1,h,i%2?GR[3]:GR[1]); P.px(x,6-h,GR[2]); } },false);
const pebbles=v=>S(10,6,5,4,(g,P)=>{ for(let i=0;i<3;i++){ const x=1+Math.floor(hash(i,v,71)*7), y=1+Math.floor(hash(v,i,72)*3); P.rect(x,y,2,2,'#9a948a'); P.px(x,y,'#c8c2b8'); P.px(x+1,y+1,'#6a645a'); } },false);
const mushrooms=()=>S(12,9,6,8,(g,P)=>{ for(const [x,y,c] of [[3,4,'#d8302a'],[8,5,'#e8a02a']]){ P.rect(x,y+1,2,3,'#f4ead8'); P.rect(x-2,y-1,6,3,c); P.px(x-1,y-1,'#ffffff'); P.px(x+2,y,'#ffffff'); } },false);
// cột đèn Đà Lạt: cột sắt đen, đèn lồng kính vàng
const lampPost=()=>S(12,42,6,40,(g,P)=>{ P.rect(5,8,2,30,'#2a2630'); P.rect(3,37,6,3,'#3a3640'); P.rect(2,3,8,7,'#2a2630'); P.rect(3,4,6,5,'#ffd84a'); P.rect(4,5,2,3,'#fff8c0'); P.rect(4,1,4,2,'#2a2630'); P.rect(5,0,2,1,'#2a2630'); P.rect(1,10,10,1,'#3a3640'); });
// cổng hoa vòm bắc qua đường vào trại
const arch=()=>S(100,70,50,68,(g,P)=>{ for(const x of [4,90]){ P.rect(x,14,6,54,BR[0]); P.rect(x,14,2,54,BR[2]); } for(let i=0;i<=40;i++){ const t=i/40, x=Math.round(7+86*t), y=Math.round(16-Math.sin(t*Math.PI)*12); P.rect(x-2,y-2,5,6,BR[1]); }
  for(let i=0;i<60;i++){ const t=i/60, x=Math.round(7+86*t+Math.sin(i*1.7)*2), y=Math.round(14-Math.sin(t*Math.PI)*12+Math.cos(i*2.3)*2); P.disc(x,y,2,i%3?GR[0]:GR[1]); P.px(x,y-1,[PK[0],'#ffd84a','#ffffff',HYD[0][0]][i%4]); }
  for(const x of [7,93]) for(let y=18;y<64;y+=5){ P.disc(x+((y/5)%2?2:-1),y,2,GR[0]); P.px(x,y,[PK[0],'#ffd84a','#ffffff'][(y/5)%3|0]); }
  const s='NONG TRAI BAC TRANG', tw=A.textW(s); P.rect(50-tw/2-4,16,tw+8,11,BR[1]); P.rect(50-tw/2-3,17,tw+6,9,'#f4e6c4'); A.drawText(g,s,Math.round(50-tw/2),18,'#2e5b38'); });
// bù nhìn, giếng, tổ ong, xe cút kít, đống củi, bàn picnic
const scarecrow=()=>S(24,36,12,34,(g,P)=>{ P.rect(11,10,2,24,BR[0]); P.rect(2,13,20,2,BR[0]); P.rect(6,12,12,12,'#c8402a'); P.rect(6,12,12,2,'#e2643e'); P.rect(9,18,4,4,'#3a6ad8'); P.disc(12,8,4,'#f2d8a0'); P.px(10,7,'#1c1516'); P.px(14,7,'#1c1516');
  P.rect(5,3,14,3,'#e8c04a'); P.rect(8,0,8,4,'#e8c04a'); P.rect(8,2,8,1,'#c8402a'); for(const x of [3,20]) P.rect(x,15,2,4,'#e8c04a'); P.rect(9,24,2,4,'#e8c04a'); P.rect(13,24,2,4,'#e8c04a'); });
const well=()=>S(32,38,16,36,(g,P)=>{ P.rect(4,2,24,4,'#a8402a'); P.rect(2,5,28,3,'#7a2e1e'); P.rect(6,8,2,14,BR[0]); P.rect(24,8,2,14,BR[0]); P.rect(8,10,16,1,BR[1]); P.rect(15,11,1,6,'#6a6070'); P.rect(13,16,5,4,'#8a5a2a');
  P.rect(3,22,26,13,'#8a8a92'); for(let x=3;x<29;x+=5) for(let y=22;y<35;y+=4) P.rect(x+((y/4)%2?2:0),y,4,3,'#a8a8b0'); P.rect(5,21,22,3,'#3a6ad8'); P.rect(5,21,22,1,'#7ab8f0'); });
const beehive=()=>S(16,22,8,20,(g,P)=>{ P.rect(2,16,12,2,BR[0]); P.rect(3,18,2,3,BR[1]); P.rect(11,18,2,3,BR[1]); for(let i=0;i<3;i++){ P.rect(2,3+i*4,12,4,i%2?'#e8c04a':'#f2d06a'); P.rect(2,6+i*4,12,1,'#b8902a'); } P.rect(1,1,14,3,'#a8743a'); P.rect(7,13,2,1,'#1c1516'); });
const wheelbarrow=()=>S(28,18,14,16,(g,P)=>{ P.rect(4,4,16,7,'#9a9aa2'); P.rect(4,4,16,2,'#c0c0c8'); P.rect(6,2,12,3,'#6a9a3a'); P.disc(9,3,2,'#e85a3a'); P.disc(14,2,2,'#f2c43d'); P.rect(20,6,7,2,BR[0]); P.disc(7,13,3,'#2a2630'); P.disc(7,13,1,'#8a8a92'); P.rect(15,11,2,5,BR[1]); });
const logPile=()=>S(28,16,14,15,(g,P)=>{ for(const [x,y] of [[5,10],[13,10],[21,10],[9,5],[17,5],[13,1]]){ P.disc(x,y,4,BR[0]); P.disc(x,y,3,'#c8945a'); P.disc(x,y,1,BR[2]); } });
const picnic=()=>S(46,30,23,28,(g,P)=>{ P.rect(2,2,42,4,BR[0]); P.rect(2,22,42,4,BR[0]); P.rect(4,6,38,14,'#c8402a'); for(let x=4;x<42;x+=6) P.rect(x,6,3,14,'#f6f2ea'); for(let y=6;y<20;y+=6) P.rect(4,y,38,3,'#f6f2ea'); P.rect(4,19,38,1,'#9a2e1e');
  P.rect(18,8,10,6,'#a8743a'); P.rect(19,6,8,3,'#8a5a2a'); P.disc(24,8,2,'#d8302a'); P.rect(32,9,4,5,'#f6f2ea'); P.rect(6,26,3,3,BR[1]); P.rect(37,26,3,3,BR[1]); });
// trên mặt nước: lá súng (có hoa sen hồng), lau sậy, thuyền chèo
const lily=v=>S(14,9,7,5,(g,P)=>{ P.disc(6,5,4,'#3e8a3a'); P.disc(6,4,3,'#5aa84a'); P.rect(6,4,3,1,'#2e6a2e'); if(v%3===0){ P.disc(10,3,2,'#f4a6c8'); P.px(10,2,'#ffffff'); P.px(10,3,'#ffd84a'); } },false);
const reeds=()=>S(14,22,7,21,(g,P)=>{ for(const [x,h] of [[2,16],[5,20],[8,14],[11,18]]){ P.rect(x,21-h,1,h,'#5a8a3a'); P.rect(x,21-h,2,5,'#8a5a2a'); P.px(x,20-h,'#6a7a3a'); } P.rect(0,18,14,3,'#4a7a3a'); });
const rowboat=()=>S(40,16,20,12,(g,P)=>{ P.rect(4,4,32,8,'#8a5a3a'); P.rect(2,5,36,5,'#9a6440'); P.rect(6,5,28,4,'#c8945a'); P.rect(12,5,2,4,BR[0]); P.rect(24,5,2,4,BR[0]); P.rect(4,11,32,2,'#5a3420'); P.rect(30,0,2,8,BR[1]); P.rect(28,7,8,2,BR[0]); });
// mảng cỏ đậm / nhạt cho mặt đất đỡ phẳng, cỏ lấn mép đường, máng nước cho ngựa
const patch=v=>S(44,28,22,14,(g,P)=>{ const c=v%2?['#4e9a42','#468c3c']:['#6ab452','#62aa4c']; for(let i=0;i<160;i++){ const a=hash(i,v,51)*6.283, r=Math.sqrt(hash(v,i,52)), x=Math.round(22+Math.cos(a)*r*20), y=Math.round(14+Math.sin(a)*r*12); P.rect(x,y,2,1,c[i%2]); } },false);
const edgeTuft=v=>S(16,6,8,5,(g,P)=>{ for(let i=0;i<5;i++){ const x=1+i*3+(v%2), h=2+((i+v)%3); P.rect(x,5-h,2,h,i%2?'#4e9a42':'#5aa84a'); } },false);
const trough=()=>S(34,16,17,14,(g,P)=>{ P.rect(1,4,32,9,'#7a4a2e'); P.rect(1,4,32,2,'#9a6440'); P.rect(3,5,28,4,'#3a8ae8'); P.rect(3,5,28,1,'#7ab8f0'); P.rect(2,12,3,3,'#5a3420'); P.rect(29,12,3,3,'#5a3420'); });
A.farmArt={patch,edgeTuft,trough,cherry,hydrangea,sunflowers,wildflowers,tuft,pebbles,mushrooms,lampPost,arch,scarecrow,well,beehive,wheelbarrow,logPile,picnic,lily,reeds,rowboat};
const CR={}, spr=(k,v=0)=>CR[k+v]||(CR[k+v]=(A.farmArt[k]||A[k])(v));   /* hình riêng của nông trại, không có thì dùng hình chung (cỏ khô...) */

/* ---------- đặt cảnh quan lên map (sau khi world2.js dựng xong) ---------- */
let LAMPS=[], CHERRY=[], FLOWERS=[];
const b0=WORLD.buildDalat; WORLD.buildDalat=()=>{ const m=b0(); try{ decorate(m); }catch(e){ console.error('[farm]',e); } return m; };
function decorate(m){ const W=m.W, H=m.H, g=m.grid, D=SD.DALAT, occ=new Uint8Array(W*H); LAMPS=[]; CHERRY=[]; FLOWERS=[];
  const mark=(x0,y0,x1,y1)=>{ for(let y=Math.max(0,y0);y<=Math.min(H-1,y1);y++) for(let x=Math.max(0,x0);x<=Math.min(W-1,x1);x++) occ[y*W+x]=1; };
  const at=(x,y)=>(g[y]&&g[y][x])||'F', free=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ if(x<0||y<0||x>=W||y>=H||occ[y*W+x]||at(x,y)!=='G') return false; } return true; };
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(g[y][x]!=='G') occ[y*W+x]=1;
  for(const [x0,y0,x1,y1] of m.solid) mark(x0-1,y0-1,x1+1,y1+1);
  for(const o of m.obj){ const s=o.spr; if(!s) continue; const bx0=Math.floor((o.x-s.ax)/T), bx1=Math.floor((o.x-s.ax+s.c.width-1)/T), by=Math.floor(o.y/T);
    if(o.over) mark(bx0,Math.floor((o.y-s.ay)/T),bx1,by); else if(!o.flat) mark(bx0,by-1,bx1,by); }
  for(const i of m.inter){ const ix=Math.floor(i.x/T), iy=Math.floor(i.y/T); mark(ix-2,iy-2,ix+2,iy+2); }
  for(const n of SD.NPCS.filter(n=>n.scene==='dalat')) mark(Math.floor(n.x)-2,Math.floor(n.y)-2,Math.floor(n.x)+2,Math.floor(n.y)+2);
  for(const p of Object.values(D.pens)) mark(Math.floor(p.x)-2,Math.floor(p.y)-2,Math.floor(p.x)+2,Math.floor(p.y)+2);
  mark(Math.floor(D.spawn.x)-3,Math.floor(D.spawn.y)-3,Math.floor(D.spawn.x)+3,Math.floor(D.spawn.y)+2);
  { const c=SD.CLUB_DOORS&&SD.CLUB_DOORS.dalat; if(c) mark(Math.floor(c.x)-4,Math.floor(c.y)-5,Math.floor(c.x)+4,Math.floor(c.y)+1); }   /* quán Nhà giải trí (game.js withClubDoor): cây hoa không mọc đè */
  const PENS=[[46,36,61,44],[62,35,69,40],[70,35,77,41],[57,7,77,25]], inPen=(x,y)=>PENS.some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d);
  const put=(k,v,x,y,o={})=>{ m.obj.push({spr:spr(k,v),x:Math.round(x*T),y:Math.round(y*T),...o}); };
  // đồ đứng: chiếm ô (fw ô ngang, đáy ở hàng y); solid thì chặn đi qua
  const stand=(k,v,tx,ty,fw=1,solid=true,o={})=>{ const x0=tx-Math.floor(fw/2), x1=x0+fw-1; if(!free(x0,ty-1,x1,ty)||inPen(tx,ty)) return false; put(k,v,tx+(fw%2?.5:0),ty+1,o); mark(x0-1,ty-1,x1+1,ty+1); if(solid) m.solid.push([x0,ty,x1,ty]); return true; };
  // 1) mai anh đào 2 bên đường chính + 2 đường ngang
  for(let y=8;y<=58;y+=5){ if(stand('cherry',y%3,37,y,1,true,{tree:true})) CHERRY.push([37.5,y-1]); if(stand('cherry',(y+1)%3,43,y+2,1,true,{tree:true})) CHERRY.push([43.5,y+1]); }
  for(const [yy,xs] of [[27,[6,13,20,27,34,46,53]],[31,[5,12,18,33,45,57,64,71]],[48,[20,27,34,46,53]],[52,[5,12,19,33,46]]]) for(const x of xs) if(stand('cherry',(x+yy)%3,x,yy,1,true,{tree:true})) CHERRY.push([x+.5,yy-1]);
  // 2) cột đèn dọc đường chính (sáng về đêm)
  for(const [x,y] of [[38,11],[42,17],[38,24],[42,34],[38,43],[42,46],[38,55],[42,61]]) if(stand('lampPost',0,x,y,1,true)) LAMPS.push([x+.5,y+1]);
  // 3) cổng hoa vòm bắc qua đường vào (2 chân cột chặn, vòm vẽ đè lên người đi dưới)
  { const ay=62; m.obj.push({spr:spr('arch'),x:40.5*T,y:(ay+1)*T,over:true}); m.solid.push([37,ay,37,ay],[43,ay,43,ay]); mark(36,ay-1,44,ay+1); }
  // 4) cẩm tú cầu viền vườn hoa + vườn rau, bù nhìn giữa 2 vườn
  for(let x=19;x<=30;x+=2) for(const y of [31,38]) if(stand('hydrangea',(x>>1)+y,x,y,1,false)) FLOWERS.push([x+.5,y]);
  for(let x=5;x<=16;x+=3) for(const y of [31,38]) stand('hydrangea',x+1,x,y,1,false);
  stand('scarecrow',0,17,34,1,false); stand('scarecrow',0,18,44,1,false);
  // 5) đồng hướng dương + hoa dại bãi trống phía đông nhà kính, tổ ong cạnh vườn hoa
  for(let y=40;y<=47;y+=3) for(let x=20;x<=35;x+=3) if(hash(x,y,33)<.62&&stand('sunflowers',0,x+(y%2),y,1,false)) FLOWERS.push([x+.5,y-1]);
  for(const [x,y] of [[32,39],[34,39],[36,39]]) stand('beehive',0,x,y,1,true);
  // 6) giếng nước, củi, cỏ khô, xe cút kít quanh nhà + trại
  stand('well',0,46,6,2,true); stand('logPile',0,26,6,2,true); stand('logPile',0,34,46,2,true);
  for(const [x,y] of [[45,34],[56,30],[57,33],[45,46]]) stand('haystack',0,x,y,2,true);
  stand('wheelbarrow',0,44,30,2,false); stand('wheelbarrow',0,22,39,2,false);
  // 7) góc picnic ven hồ + dây đèn
  if(stand('picnic',0,50,52,3,true)){ const a=stand('lampPost',0,48,52,1,true), b=stand('lampPost',0,53,52,1,true); if(a) LAMPS.push([48.5,53]); if(b) LAMPS.push([53.5,53]); if(a&&b) m.lights=[...(m.lights||[]),[[48.5,53],[53.5,53]]]; }   /* dây đèn giữa 2 cột */
  // 8) hồ câu: cầu gỗ ra giữa hồ, thuyền, lá súng trên nước, lau sậy quanh bờ, sỏi quanh ao
  { const L=D.lake, dx=Math.round(L.x); for(let y=Math.round(L.y-L.ry)-1;y<=Math.round(L.y-1);y++) for(const x of [dx,dx+1]) if(g[y]&&(g[y][x]==='W'||g[y][x]==='D')) g[y][x]='Q'; }
  put('rowboat',0,D.lake.x+5,D.lake.y+1.6,{sort:(D.lake.y-3)*T});
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const t=at(x,y), h=hash(x,y,41);
    if(t==='W'&&h<.07&&at(x,y-1)==='W'&&at(x+1,y)==='W') m.obj.push({spr:spr('lily',(x+y)%6),x:x*T+8,y:y*T+10,flat:true});
    else if(t==='D'&&h<.22) m.obj.push({spr:spr('reeds'),x:x*T+8,y:y*T+15,sort:y*T});
    else if(t==='G'&&(at(x+1,y)==='W'||at(x-1,y)==='W'||at(x,y+1)==='W'||at(x,y-1)==='W')&&h<.6) m.obj.push({spr:spr('pebbles',(x*3+y)%5),x:x*T+8,y:y*T+10,flat:true}); }
  // 8b) bồn hoa 2 bên cửa các ngôi nhà, máng nước + hoa trong đồng cỏ ngựa / bò
  for(const o of m.obj.filter(o=>o.house)){ const by=Math.floor(o.y/T)+1, cx=Math.floor(o.x/T); for(const dx of [-3,3]) stand('flowerBed',0,cx+dx,by,2,false); }
  stand('trough',0,60,17,2,true); stand('trough',0,49,40,2,true);
  for(const [a,b,c,d] of PENS) for(let y=b+1;y<d;y++) for(let x=a+1;x<c;x++) if(at(x,y)==='G'&&!occ[y*W+x]&&hash(x,y,23)<.06) m.obj.push({spr:spr('hydrangea',x+y),x:x*T+8,y:(y+1)*T,flat:true});
  // 8c) khoảng trống lớn còn lại: cụm bụi cây / cẩm tú cầu / đào / luống hoa (mỗi 3 ô xét 1 lần, cần trống 5×5)
  for(let y=4;y<H-4;y+=3) for(let x=4;x<W-4;x+=3){ if(inPen(x,y)||!free(x-2,y-2,x+2,y+2)) continue; const h=hash(x,y,29);
    if(h<.3){ stand('bush',0,x,y,1,true); stand('bush',0,x+1,y+1,1,true); } else if(h<.5) stand('hydrangea',x+y,x,y,1,false)&&FLOWERS.push([x+.5,y]); else if(h<.66){ if(stand('cherry',(x+y)%3,x,y,1,true,{tree:true})) CHERRY.push([x+.5,y-1]); } else if(h<.82) stand('flowerBed',0,x,y,2,false); }
  // 9) mặt đất: mảng cỏ đậm nhạt, cỏ lấn mép đường
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const t=at(x,y), h=hash(x,y,11);
    if(t==='G'&&h<.035) m.obj.unshift({spr:spr('patch',(x+y)%4),x:x*T+8,y:y*T+8,flat:true});
    else if(t==='P'){ for(const [dx,dy,ox,oy] of [[-1,0,4,8],[1,0,12,8],[0,-1,8,4],[0,1,8,14]]) if(at(x+dx,y+dy)==='G'&&hash(x*3+dx,y*3+dy,13)<.4) m.obj.push({spr:spr('edgeTuft',(x+y+dx)%3),x:x*T+ox,y:y*T+oy,flat:true}); } }
  // 9b) khóm cỏ, hoa dại, sỏi ven đường, nấm ven rừng (trải phẳng, không vướng)
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ if(at(x,y)!=='G') continue; const h=hash(x,y,17), nP=[at(x+1,y),at(x-1,y),at(x,y+1),at(x,y-1)];
    if(nP.includes('P')&&h<.3) m.obj.push({spr:spr('pebbles',(x+y)%5),x:x*T+4+Math.floor(hash(x,y,3)*8),y:y*T+6+Math.floor(hash(y,x,4)*6),flat:true});
    else if(nP.includes('F')&&h<.14) m.obj.push({spr:spr('mushrooms'),x:x*T+8,y:y*T+12,flat:true});
    else if(h<.13) m.obj.push({spr:spr('tuft',(x+y)%4),x:x*T+Math.floor(hash(x,y,5)*12)+2,y:y*T+Math.floor(hash(y,x,6)*10)+6,flat:true});
    else if(h<.2) m.obj.push({spr:spr('wildflowers',(x*7+y)%6),x:x*T+8,y:y*T+8,flat:true}); }
  m.farmDeco=true; }

/* ---------- hiệu ứng: đèn sáng về đêm, cánh hoa đào rơi, bướm bay quanh vườn hoa ---------- */
const here=()=>GAME.S&&GAME.S.kind==='dalat';
const PET=[], BUT=[]; let lastT=performance.now();
const BCOL=[['#ffd84a','#f2a02a'],['#ffffff','#c8c8d8'],['#9ab8f8','#5a78c8'],['#f4a6c8','#c85a8a'],['#ff8a3a','#c84a1a']];
const d0=X.draw; X.draw=(list,ctx)=>{ d0(list,ctx); if(!here()||!GAME.S.map.farmDeco) return; const now=performance.now(), dt=Math.min(.05,(now-lastT)/1000); lastT=now; const cam=GAME.cam, cl=GAME.clock;
  const hf=SD.vnTime(NET.now()).hf, night=hf>=17.8||hf<5.8, vw=ctx.canvas.width, vh=ctx.canvas.height, vis=(x,y,m=40)=>x>cam.x-m&&x<cam.x+vw+m&&y>cam.y-m&&y<cam.y+vh+m;
  // cánh đào rơi chầm chậm, lắc lư theo gió
  for(const [x,y] of CHERRY) if(vis(x*T,y*T,60)&&Math.random()<dt*.9) PET.push({x:x*T+(Math.random()-.5)*36,y:y*T-28-Math.random()*16,vx:6+Math.random()*10,vy:10+Math.random()*8,t:0,life:2.5+Math.random()*1.5,ph:Math.random()*6,c:Math.random()<.5?'#f4a6c8':'#ffd0e4'});
  for(let i=PET.length-1;i>=0;i--){ const p=PET[i]; p.t+=dt; if(p.t>p.life){ PET.splice(i,1); continue; } p.x+=(p.vx+Math.sin(p.t*3+p.ph)*12)*dt; p.y+=p.vy*dt; }
  // bướm: 12 con quanh vườn hoa / đồng hướng dương, bay lượn quanh điểm của mình (ban ngày)
  if(!BUT.length&&FLOWERS.length) for(let i=0;i<12;i++){ const f=FLOWERS[Math.floor(Math.random()*FLOWERS.length)]; BUT.push({hx:f[0]*T,hy:f[1]*T-10,x:f[0]*T,y:f[1]*T,ph:Math.random()*6,c:BCOL[i%BCOL.length]}); }
  for(const b of BUT){ b.ph+=dt; b.x=b.hx+Math.sin(b.ph*.7)*22+Math.sin(b.ph*1.9)*6; b.y=b.hy+Math.cos(b.ph*.9)*10+Math.sin(b.ph*2.3)*4; }
  list.push({y:99980,d:()=>{ ctx.save();
    for(const p of PET){ const X0=Math.round(p.x-cam.x), Y0=Math.round(p.y-cam.y); ctx.globalAlpha=Math.min(1,(p.life-p.t)); ctx.fillStyle=p.c; ctx.fillRect(X0,Y0,2,1); ctx.fillRect(X0+(Math.sin(p.t*6)>0?1:0),Y0+1,1,1); }
    ctx.globalAlpha=1; if(!night) for(const b of BUT){ if(!vis(b.x,b.y)) continue; const X0=Math.round(b.x-cam.x), Y0=Math.round(b.y-cam.y), up=Math.floor(cl*12+b.ph*3)%2; ctx.fillStyle=b.c[0]; ctx.fillRect(X0-2,Y0-(up?2:1),2,up?2:1); ctx.fillRect(X0+1,Y0-(up?2:1),2,up?2:1); ctx.fillStyle=b.c[1]; ctx.fillRect(X0-1,Y0,1,1); ctx.fillRect(X0+1,Y0,1,1); ctx.fillStyle='#1c1516'; ctx.fillRect(X0,Y0-1,1,2); }
    if(night){ ctx.globalCompositeOperation='lighter'; for(const [x,y] of LAMPS){ const X0=x*T-cam.x, Y0=y*T-36-cam.y; if(!vis(x*T,y*T,90)) continue; const gr=ctx.createRadialGradient(X0,Y0,1,X0,Y0,46); gr.addColorStop(0,'rgba(255,210,120,.55)'); gr.addColorStop(.4,'rgba(255,180,90,.18)'); gr.addColorStop(1,'rgba(255,160,60,0)'); ctx.fillStyle=gr; ctx.fillRect(X0-46,Y0-46,92,92); } }
    ctx.restore(); }}); };
})();
