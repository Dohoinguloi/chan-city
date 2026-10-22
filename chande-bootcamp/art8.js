/* 120 Yên Lãng mở rộng: góc Refund Gaming (máy PUBG, tủ cúp, băng rôn), bếp Haky Food (tủ bếp có bếp ga, bồn rửa, nồi lẩu), bàn DJ.
   Icon túi đồ: tai nghe RF, chìa khoá. */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol), t3=(...a)=>A.text3(...a);
// máy PUBG: 2 màn hình (v: bãi cỏ + vòng bo / ống ngắm / bản đồ thả dù / WINNER), bàn phím RGB, tai nghe treo
const pubgDesk=(v=0)=>S(46,34,23,31,(g,P)=>{ P.rect(2,18,42,5,'#26262c'); P.rect(2,18,42,1,'#3a3a44'); P.rect(2,22,42,1,'#16161c'); P.rect(4,23,2,10,'#3a3a44'); P.rect(40,23,2,10,'#3a3a44');
  for(const [x,k] of [[5,0],[24,1]]){ P.rect(x,3,18,13,'#18181e'); P.rect(x+1,4,16,10,'#101420'); P.rect(x+8,16,2,2,'#3a3a44'); const m=(v+k)%4, X=x+1, Y=4;
    if(m===0){ P.rect(X,Y,16,5,'#6aa8e0'); P.rect(X,Y+5,16,5,'#5a9a4a'); P.rect(X+3,Y+4,3,2,'#3a6a2a'); P.rect(X+10,Y+3,4,3,'#7a5a3a'); P.px(X+8,Y+7,'#f2f2f0'); P.rect(X+7,Y+8,3,1,'#f2f2f0'); }
    else if(m===1){ P.rect(X,Y,16,10,'#101010'); P.disc(X+8,Y+5,4,'#4a7a3a'); P.rect(X+8,Y+1,1,9,'#101010'); P.rect(X+3,Y+5,11,1,'#101010'); P.px(X+8,Y+5,'#ff3a3a'); }
    else if(m===2){ P.rect(X,Y,16,10,'#3a6a3a'); P.rect(X+2,Y+2,5,3,'#5a8a4a'); P.rect(X+9,Y+5,5,3,'#6a5a3a'); P.rect(X,Y+6,16,1,'#2a4a6a'); for(let i=0;i<14;i+=2) P.px(X+1+i,Y+1+Math.floor(i/3),'#ffffff'); }
    else { P.rect(X,Y,16,10,'#1a1a10'); t3(P,X+1,Y+2,'WINNER','#ffd84a'); P.rect(X+2,Y+8,12,1,'#e8b83a'); } }
  for(let i=0;i<14;i++) P.px(12+i,19,['#ff4a4a','#ffb03a','#ffe84a','#5fe06a','#4ab0ff','#a06aff'][i%6]); P.rect(28,19,4,3,'#16161c'); P.px(29,20,'#ff4a8a');
  P.rect(38,8,4,1,'#3a3a44'); P.rect(37,9,1,4,'#e05a5a'); P.rect(42,9,1,4,'#e05a5a'); P.rect(38,8,1,1,'#e05a5a'); P.rect(41,8,1,1,'#e05a5a'); P.rect(39,13,2,5,'#3a3a44'); });
// băng rôn REFUND GAMING (treo tường)
const rfBanner=()=>S(80,18,40,17,(g,P)=>{ P.rect(0,0,80,16,'#120c16'); P.rect(1,1,78,14,'#1c1a20'); P.rect(1,1,78,1,'#e8b83a'); P.rect(1,14,78,1,'#e8b83a'); P.rect(3,4,8,8,'#e8b83a'); P.rect(5,6,4,4,'#1c1a20'); P.px(6,7,'#e8b83a');
  t3(P,14,6,'REFUND GAMING','#f4f1ea'); P.rect(0,16,2,2,'#5a4232'); P.rect(78,16,2,2,'#5a4232'); });
// tủ cúp PUBG: chảo vàng, cúp, huy chương; chữ RF
const trophyCase=()=>S(34,44,17,42,(g,P)=>{ P.rect(0,0,34,42,'#3a2a22'); P.rect(2,2,30,38,'#1a2030'); P.rect(2,2,30,1,'#e8f4ff'); for(const y of [14,27]) P.rect(2,y,30,2,'#5a4232');
  P.disc(9,9,4,'#e8b83a'); P.rect(9,9,6,1,'#a8761e'); P.rect(18,6,6,6,'#f2c43d'); P.rect(20,12,2,2,'#a8761e'); P.rect(19,13,4,1,'#a8761e'); P.rect(26,8,3,5,'#c8ccd2');
  P.rect(6,19,5,7,'#c8ccd2'); P.rect(7,18,3,1,'#e8ecef'); P.rect(15,20,4,6,'#f2c43d'); P.rect(14,19,6,1,'#f2c43d'); P.rect(24,21,5,5,'#cd7f32');
  for(const x of [6,14,22]){ P.rect(x,32,5,6,'#e8b83a'); P.rect(x+1,30,3,2,'#d23a2e'); } P.rect(2,2,1,38,'rgba(255,255,255,.25)'); P.rect(0,40,34,2,'#16161c'); });
// tủ bếp dài: bếp ga 2 lò (lửa nhấp nháy theo fr), nồi lẩu bốc hơi, thớt, bồn rửa, kệ gia vị; chữ HAKY FOOD
const kitchenRow=(fr=0)=>S(100,40,50,38,(g,P)=>{ P.rect(0,4,100,8,'#e8ecef'); for(let x=0;x<100;x+=6) P.rect(x,4,1,8,'#c8d0d8');
  for(const [x,c] of [[4,'#d23a2e'],[10,'#f2c43d'],[16,'#5fae46'],[22,'#8a5a32']]){ P.rect(x,0,4,4,c); P.rect(x,0,4,1,'#f4f2ec'); }
  P.rect(0,12,100,26,'#8a5a32'); P.rect(0,12,100,3,'#c8945a'); P.rect(0,14,100,1,'#a8743e'); for(const x of [2,34,66]) { P.rect(x,18,30,18,'#7a4a28'); P.rect(x+14,24,2,4,'#c8a23a'); }
  P.rect(6,12,24,3,'#26262c'); for(const cx of [12,24]){ P.disc(cx,13,3,'#3a3a44'); P.px(cx-1,12,fr%2?'#4ab0ff':'#7fd0ff'); P.px(cx+1,12,fr%2?'#7fd0ff':'#4ab0ff'); }
  P.rect(8,6,9,7,'#9aa0aa'); P.rect(7,6,11,1,'#c8ccd2'); P.rect(9,7,7,2,'#d2463a'); P.px(10,7,'#5fae46'); P.px(13,8,'#f2c43d'); P.rect(21,9,8,3,'#16161c'); P.rect(28,10,5,1,'#16161c');
  P.rect(40,11,16,3,'#c8945a'); P.rect(40,11,16,1,'#e0b07a'); P.rect(44,10,3,1,'#d23a2e'); P.rect(48,10,3,1,'#5fae46');
  P.rect(66,11,20,4,'#c8ccd2'); P.rect(68,12,16,2,'#7fb8d8'); P.rect(76,6,2,6,'#9aa0aa'); P.rect(76,6,5,1,'#9aa0aa');
  t3(P,58,30,'HAKY FOOD','#ffd84a'); });
// bàn DJ: 2 mâm đĩa quay, mixer có đèn nháy
const djBooth=(fr=0)=>S(48,32,24,30,(g,P)=>{ P.rect(0,10,48,20,'#1c1a20'); P.rect(0,10,48,2,'#3a3a44'); P.rect(2,14,44,1,'#a06aff');
  for(const cx of [10,38]){ P.disc(cx,6,6,'#26262c'); P.disc(cx,6,4,'#16161c'); P.disc(cx,6,1,'#e8b83a'); const a=(fr*Math.PI/2)+(cx>20?1:0); P.px(Math.round(cx+Math.cos(a)*3),Math.round(6+Math.sin(a)*3),'#c8ccd2'); }
  P.rect(18,1,12,9,'#2a2a32'); for(let i=0;i<4;i++){ P.rect(20+i*3,3,1,5,'#3a3a44'); P.px(20+i*3,3+((fr+i)%5),'#f2f2f0'); P.px(20+i*3,8,(fr+i)%2?'#5fe06a':'#ff4a8a'); }
  for(let i=0;i<10;i++) P.px(4+i*4,20,((i+fr)%3)===0?'#ff4a8a':((i+fr)%3)===1?'#4ab0ff':'#5fe06a'); t3(P,14,24,'DJCHIP','#a06aff'); });
// icon túi đồ
const ICONS8={headset:P=>{ P.rect(3,2,8,2,'#26262c'); P.rect(2,3,2,5,'#26262c'); P.rect(10,3,2,5,'#26262c'); P.rect(1,7,4,5,'#d23a2e'); P.rect(9,7,4,5,'#d23a2e'); P.rect(2,8,2,3,'#1c1a20'); P.rect(10,8,2,3,'#1c1a20'); P.rect(11,11,2,2,'#e8b83a'); },
  key:P=>{ P.disc(4,5,3,'#e8b83a'); P.disc(4,5,1,'#1c1a20'); P.rect(6,5,7,2,'#e8b83a'); P.rect(10,7,1,2,'#e8b83a'); P.rect(12,7,1,3,'#e8b83a'); P.px(3,3,'#fff3b0'); }};
const oldIcon8=A.icon; A.icon=function(name,scale=1){ const f=ICONS8[name]; if(!f) return oldIcon8(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
Object.assign(A,{pubgDesk,rfBanner,trophyCase,kitchenRow,djBooth});
})();
