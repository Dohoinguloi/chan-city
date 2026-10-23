/* Chan City — bộ nội thất "nhà ấm" cho nhà riêng (data.js HOME.items có isNew), vẽ theo kiểu game pixel đồng quê nhìn nghiêng 3/4:
   gỗ nâu ấm có tay nắm, gối trắng, chăn kẻ ô, ghế đệm xanh, tủ bếp + gạch ốp, bếp lò có ấm, chậu cây lá to, đèn tường, tranh núi, đồng hồ quả lắc, thảm xám viền chấm.
   Khung theo ô 16px, neo giữa mép dưới; viền đen tự động (A.sprite). */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const WD=['#9a6440','#7a4a2e','#b8804e','#5a3420'], WL=['#d8a46a','#b8844e','#eac08a'], BL=['#4a7ab8','#36609a','#7aa6dc'], RD=['#c8402a','#9a2e1e','#e2643e'],
  WH=['#f6f2ea','#d8d2c8','#ffffff'], MT=['#9aa2ac','#767e8a','#c6ccd4','#5a626c'], GR=['#4aa84a','#2e7a36','#86d46a','#1e5a2a'], TC=['#b85a3a','#8a3e28','#d87a50'];
// mặt gỗ có vân + tay nắm ngăn kéo
const drawer=(P,x,y,w,h,c=WD)=>{ P.rect(x,y,w,h,c[0]); P.rect(x,y,w,1,c[2]); P.rect(x,y+h-1,w,1,c[1]); P.rect(x+Math.floor(w/2)-2,y+Math.floor(h/2),4,1,'#e8d8b0'); P.px(x+Math.floor(w/2)-2,y+Math.floor(h/2)+1,c[3]); P.px(x+Math.floor(w/2)+1,y+Math.floor(h/2)+1,c[3]); };
const legs=(P,x,y,w,c=WD)=>{ P.rect(x,y,2,3,c[3]); P.rect(x+w-2,y,2,3,c[3]); };
// giường kẻ ô: đầu giường gỗ, 2 gối trắng, chăn đỏ kẻ ô, chân gỗ
const bedPlaid=()=>S(34,52,17,50,(g,P)=>{ P.rect(1,0,32,12,WD[0]); P.rect(1,0,32,2,WD[2]); for(let x=5;x<30;x+=6) P.rect(x,3,1,8,WD[1]); P.rect(1,10,32,2,WD[3]);
  P.rect(2,12,30,36,WD[1]); P.rect(3,12,28,10,WH[0]); P.rect(4,13,12,7,WH[2]); P.rect(18,13,12,7,WH[2]); P.rect(4,19,12,1,WH[1]); P.rect(18,19,12,1,WH[1]); P.rect(9,15,3,1,'#9ab8d8'); P.rect(23,15,3,1,'#9ab8d8');
  P.rect(3,22,28,24,RD[0]); P.rect(3,22,28,2,RD[2]); for(let x=8;x<31;x+=7) P.rect(x,24,2,22,RD[1]); for(let y=29;y<46;y+=7) P.rect(3,y,28,2,RD[1]); P.rect(3,44,28,2,'#7a2416'); P.disc(23,33,2,'#e2643e');
  legs(P,3,47,28); });
// tủ đầu giường: đèn chao đỏ hoặc đồng hồ + sách
const standLamp=()=>S(18,36,9,34,(g,P)=>{ P.rect(7,10,4,6,'#5a3420'); P.rect(4,2,10,9,RD[0]); P.rect(4,2,10,2,RD[2]); P.rect(4,9,10,2,RD[1]); P.rect(6,4,1,5,'#ffd890');
  P.rect(1,16,16,15,WL[0]); P.rect(1,16,16,2,WL[2]); drawer(P,2,21,14,5,WD); drawer(P,2,26,14,4,WD); legs(P,1,31,16,WD); });
const standClock=()=>S(18,32,9,30,(g,P)=>{ P.disc(6,7,4,'#4a7ab8'); P.disc(6,7,3,'#f6f2ea'); P.rect(6,5,1,3,'#1c1516'); P.rect(6,7,2,1,'#1c1516'); P.rect(11,4,5,8,BL[1]); P.rect(11,4,5,1,BL[2]); P.rect(12,5,1,6,'#f6f2ea');
  P.rect(1,12,16,15,WL[0]); P.rect(1,12,16,2,WL[2]); drawer(P,2,17,14,5,WD); drawer(P,2,22,14,4,WD); legs(P,1,27,16,WD); });
// tủ thấp nhiều ngăn kéo (kê sát tường)
const chest=()=>S(34,32,17,30,(g,P)=>{ P.rect(1,2,32,4,WL[0]); P.rect(1,2,32,1,WL[2]); P.rect(1,6,32,22,WD[0]); for(let i=0;i<3;i++) drawer(P,3,7+i*7,13,6,WD), drawer(P,18,7+i*7,13,6,WD); legs(P,2,28,30,WD); });
// đèn tường (treo tường): chụp đen, bóng vàng toả sáng
const sconce=()=>S(16,22,8,21,(g,P)=>{ g.fillStyle='rgba(255,220,120,.25)'; g.beginPath(); g.ellipse(8,13,8,8,0,0,Math.PI*2); g.fill(); P.rect(7,1,2,4,'#3a3036'); P.rect(4,5,8,3,'#4a4248'); P.rect(3,8,10,2,'#2a2228');
  P.rect(5,10,6,5,'#ffd84a'); P.rect(6,11,2,2,'#fff8c0'); P.rect(4,15,8,2,'#4a4248'); P.rect(6,17,4,2,'#3a3036'); },false);
// tranh núi đồi khung gỗ (treo tường)
const painting=()=>S(64,26,32,25,(g,P)=>{ P.rect(0,0,64,26,WD[1]); P.rect(1,1,62,24,WD[2]); P.rect(3,3,58,20,'#5ab0e8'); P.rect(3,3,58,6,'#78c4f0');
  for(const [x,y,w] of [[10,6,10],[30,9,12],[46,5,9]]){ P.rect(x,y,w,3,'#ffffff'); P.rect(x+2,y-1,w-4,1,'#ffffff'); P.rect(x+1,y+3,w-2,1,'#d8e8f4'); }
  for(let x=3;x<61;x++){ const h=Math.round(8+Math.sin(x*.18)*3+Math.sin(x*.07+1)*2); P.rect(x,23-h,1,h,x%9<5?'#4aa84a':'#3a9a42'); } for(let x=3;x<61;x++){ const h=Math.round(4+Math.sin(x*.25+2)*2); P.rect(x,23-h,1,h,'#2e8a3a'); } });
// tủ bếp dưới: mặt gỗ sáng, gạch ốp trắng phía sau, ngăn kéo + cánh tủ có tay nắm
const kCounter=()=>S(34,38,17,36,(g,P)=>{ P.rect(1,0,32,10,WH[0]); for(let x=1;x<33;x+=6) P.rect(x,0,1,10,WH[1]); P.rect(1,5,32,1,WH[1]); P.rect(1,10,32,5,WL[0]); P.rect(1,10,32,1,WL[2]); P.rect(1,14,32,1,WL[1]);
  P.rect(1,15,32,19,WD[0]); drawer(P,2,16,14,5,WD); drawer(P,18,16,14,5,WD); P.rect(2,22,14,11,WD[0]); P.rect(18,22,14,11,WD[0]); P.rect(9,26,1,4,'#e8d8b0'); P.rect(24,26,1,4,'#e8d8b0'); P.rect(16,22,2,11,WD[1]); P.rect(1,33,32,2,WD[3]); });
// bếp lò: 4 họng, ấm trà, cửa lò có kính + khăn
const kStove=()=>S(34,40,17,38,(g,P)=>{ P.rect(1,0,32,10,WH[0]); for(let x=1;x<33;x+=6) P.rect(x,0,1,10,WH[1]); P.rect(1,10,32,10,'#2a2630'); for(const [x,y] of [[8,13],[24,13],[8,17],[24,17]]){ P.disc(x,y,2,'#4a4650'); P.px(x,y,'#1c1516'); }
  P.rect(19,4,10,8,MT[2]); P.rect(20,3,8,2,MT[0]); P.rect(23,1,2,2,MT[3]); P.rect(28,6,3,2,MT[1]); P.rect(20,10,8,1,MT[1]);
  P.rect(1,20,32,16,MT[0]); P.rect(1,20,32,2,MT[2]); P.rect(4,23,26,10,MT[3]); P.rect(6,25,22,6,'#2a2630'); P.rect(7,25,6,2,'#4a4650'); P.rect(10,22,14,1,'#1c1516'); P.rect(13,23,6,8,WH[0]); P.rect(13,26,6,1,RD[0]); P.rect(1,36,32,2,MT[3]); });
// bồn rửa bếp: mặt tủ có chậu trắng + vòi, cánh tủ bên dưới
const kSink=()=>S(34,38,17,36,(g,P)=>{ P.rect(1,0,32,10,WH[0]); for(let x=1;x<33;x+=6) P.rect(x,0,1,10,WH[1]); P.rect(1,10,32,6,WL[0]); P.rect(1,10,32,1,WL[2]); P.rect(9,11,16,5,'#f8f8f8'); P.rect(10,12,14,3,'#c8d4dc'); P.rect(16,6,2,6,MT[2]); P.rect(14,6,6,2,MT[0]); P.px(13,7,'#4aa84a');
  P.rect(1,16,32,18,WD[0]); P.rect(2,17,14,16,WD[0]); P.rect(18,17,14,16,WD[0]); P.rect(16,17,2,16,WD[1]); P.rect(13,23,1,4,'#e8d8b0'); P.rect(20,23,1,4,'#e8d8b0'); P.rect(1,33,32,2,WD[3]); });
// tủ lạnh xanh bạc, nam châm + giấy note
const fridgeMint=()=>S(30,46,15,44,(g,P)=>{ P.rect(1,0,28,43,'#a8c8c0'); P.rect(1,0,28,2,'#c8e4dc'); P.rect(1,15,28,2,'#7a9a94'); P.rect(25,5,2,7,'#6a8a84'); P.rect(25,20,2,12,'#6a8a84'); P.rect(1,41,28,2,'#6a8a84');
  P.rect(5,20,8,9,'#f6f2ea'); P.rect(6,22,6,1,'#9a9a9a'); P.rect(6,24,5,1,'#9a9a9a'); P.rect(15,5,7,5,'#e85a3a'); P.rect(16,6,5,1,'#ffd84a'); P.disc(8,7,2,'#ffd84a'); P.rect(15,24,4,4,'#3a8ae8'); legs(P,2,43,26,MT); });
// tủ bếp treo tường
const wallCab=()=>S(48,22,24,21,(g,P)=>{ P.rect(0,0,48,3,WL[0]); P.rect(0,3,48,17,WD[0]); for(const x of [1,17,33]){ P.rect(x,4,14,15,WD[0]); P.rect(x,4,14,1,WD[2]); P.rect(x,18,14,1,WD[1]); P.rect(x+6,15,3,1,'#e8d8b0'); } P.rect(0,20,48,2,WD[3]); });
// giỏ trái cây
const fruits=()=>S(20,16,10,15,(g,P)=>{ P.rect(2,8,16,7,'#8a5a2a'); for(let x=3;x<17;x+=3) P.rect(x,9,1,5,'#6a3e1a'); P.rect(2,8,16,1,'#a8743a'); for(const [x,y,c] of [[5,6,'#d8302a'],[10,4,'#5ac83a'],[14,6,'#d8302a'],[8,7,'#e8a02a']]){ P.disc(x,y,3,c); P.px(x-1,y-1,'#ffffff'); } });
// bàn ăn gỗ + 4 ghế đệm xanh + chậu cây, cốc
const chairBlue=(P,x,y,up)=>{ if(up){ P.rect(x,y,10,8,WD[0]); P.rect(x+1,y+1,8,6,BL[0]); P.rect(x+1,y+1,8,2,BL[2]); } else { P.rect(x,y,10,4,WD[0]); P.rect(x+1,y,8,3,BL[0]); P.rect(x+1,y+3,8,4,BL[1]); P.rect(x,y+7,2,4,WD[3]); P.rect(x+8,y+7,2,4,WD[3]); } };
const dining=()=>S(64,58,32,56,(g,P)=>{ chairBlue(P,14,0,true); chairBlue(P,40,0,true); P.rect(4,8,56,30,WL[0]); P.rect(4,8,56,2,WL[2]); P.rect(4,36,56,2,WL[1]); for(let x=12;x<58;x+=14) P.px(x,20,WL[1]); P.rect(6,38,4,10,WD[1]); P.rect(54,38,4,10,WD[1]); P.rect(4,38,56,2,WD[3]);
  P.rect(30,22,8,7,TC[0]); P.rect(30,22,8,2,TC[2]); for(const [dx,h] of [[-3,8],[0,11],[3,9],[-1,6],[2,7]]) P.rect(33+dx,22-h,2,h,GR[(dx+3)%3]); P.rect(16,22,5,5,'#3a6ad8'); P.rect(21,23,2,2,'#3a6ad8'); P.rect(17,22,3,1,'#6a9ae8');
  chairBlue(P,14,42,false); chairBlue(P,40,42,false); });
// chậu cây lá to
const bigPlant=()=>S(34,42,17,40,(g,P)=>{ for(const [x,y,w,h,c,s] of [[4,12,12,6,1,-1],[18,12,12,6,1,1],[6,4,9,9,0,-1],[19,4,9,9,0,1],[13,0,8,14,2,0],[2,20,11,5,0,-1],[21,20,11,5,0,1]]){ P.rect(x,y,w,h,GR[c]); P.rect(x+1,y+1,w-2,1,GR[2]); P.rect(x+Math.floor(w/2),y,1,h,GR[3]); }
  P.rect(9,26,16,14,TC[0]); P.rect(8,26,18,3,TC[2]); P.rect(9,36,16,2,TC[1]); P.rect(11,38,12,2,TC[1]); });
// cây treo giỏ (treo tường)
const hangPlant=()=>S(30,34,15,33,(g,P)=>{ P.rect(14,0,2,6,'#6a4a2a'); P.rect(9,4,1,8,'#a8844e'); P.rect(20,4,1,8,'#a8844e'); P.rect(8,11,14,6,'#8a5a2a'); P.rect(8,11,14,1,'#a8743a');
  for(let i=0;i<9;i++){ const x=3+i*3, h=6+((i*5)%9); P.rect(x,10-(i%3),3,3,GR[i%3]); P.rect(x+1,13,1,h,GR[1]); P.rect(x,13+h,3,2,GR[i%2?0:2]); } P.px(21,9,'#ffd84a'); P.px(7,12,'#e85a8a'); },true);
// đồng hồ quả lắc
const grandClock=()=>S(18,46,9,44,(g,P)=>{ P.rect(2,0,14,4,WD[2]); P.rect(1,3,16,14,WD[0]); P.disc(9,10,5,'#f6f2ea'); P.rect(9,6,1,4,'#1c1516'); P.rect(9,10,3,1,'#1c1516'); P.rect(3,17,12,22,WD[1]); P.rect(5,19,8,18,'#3a2418'); P.rect(9,19,1,12,'#c8a23a'); P.disc(9,32,2,'#ffd84a'); P.rect(1,39,16,4,WD[0]); P.rect(1,43,16,2,WD[3]); });
// kệ hũ thuỷ tinh
const jarShelf=()=>S(34,40,17,38,(g,P)=>{ P.rect(1,0,32,36,WD[0]); P.rect(3,2,28,14,WD[1]); P.rect(3,19,28,14,WD[1]); P.rect(1,16,32,3,WD[2]);
  for(const [x,y,c] of [[5,6,'#9a8ad8'],[13,4,'#c8e4f0'],[21,7,'#9ad88a'],[26,8,'#e8b8d8'],[6,23,'#ffd890'],[14,24,'#9a8ad8'],[22,22,'#c8e4f0']]){ P.rect(x,y,6,16-(y%3)-(y>18?4:0)-6,c); P.rect(x+1,y-1,4,1,'#6a6070'); P.px(x+1,y+1,'#ffffff'); } P.rect(1,36,32,2,WD[3]); });
// thùng ngô
const cornCrate=()=>S(26,22,13,21,(g,P)=>{ for(let i=0;i<5;i++){ P.rect(3+i*4,1+(i%2),4,9,'#f2c43d'); P.rect(4+i*4,2+(i%2),2,7,'#ffe070'); P.rect(2+i*4,7,3,4,GR[i%2]); }
  P.rect(1,8,24,12,WL[0]); P.rect(1,8,24,2,WL[2]); P.rect(1,13,24,1,WL[1]); P.rect(1,8,2,13,WD[0]); P.rect(23,8,2,13,WD[0]); });
// thảm xám viền chấm (trải sàn)
const grayRug=()=>S(96,64,48,32,(g,P)=>{ P.rect(0,0,96,64,'#5a5660'); P.rect(2,2,92,60,'#4a4650'); for(let x=3;x<93;x+=3){ P.px(x,3,'#7a7680'); P.px(x,60,'#7a7680'); } for(let y=3;y<61;y+=3){ P.px(3,y,'#7a7680'); P.px(92,y,'#7a7680'); }
  for(const [x,y] of [[18,16],[70,22],[40,44],[80,50],[12,48],[56,10]]){ P.px(x,y,'#3a3640'); P.px(x+2,y,'#3a3640'); P.px(x+1,y-1,'#3a3640'); } },false);
// bàn gỗ học bài có chồng sách + ghế đệm xanh
const studyDesk=()=>S(34,34,17,32,(g,P)=>{ P.rect(1,6,32,16,WL[0]); P.rect(1,6,32,2,WL[2]); P.rect(1,20,32,2,WL[1]); P.rect(3,2,9,7,RD[0]); P.rect(3,2,9,2,RD[2]); P.rect(4,5,8,1,'#f6f2ea'); P.rect(14,7,7,5,'#f6f2ea'); P.rect(15,8,5,1,'#9a9a9a');
  P.rect(2,22,3,10,WD[1]); P.rect(29,22,3,10,WD[1]); P.rect(24,10,4,3,'#6a4a2a'); });
const cushionChair=()=>S(14,22,7,20,(g,P)=>{ P.rect(2,0,10,10,WD[0]); P.rect(3,1,8,8,BL[0]); P.rect(3,1,8,2,BL[2]); P.rect(1,10,12,5,BL[1]); P.rect(1,10,12,1,BL[2]); P.rect(1,15,2,6,WD[3]); P.rect(11,15,2,6,WD[3]); });
Object.assign(A,{bedPlaid,standLamp,standClock,chest,sconce,painting,kCounter,kStove,kSink,fridgeMint,wallCab,fruits,dining,bigPlant,hangPlant,grandClock,jarShelf,cornCrate,grayRug,studyDesk,cushionChair});
})();
