/* Lính Cát dưới nước (sông hồ Ké): tôm → tôm hùm, cua → cua hoàng đế, mực → bạch tuộc, Thuồng Luồng hồ Hoà Bình. Khung 28×28, chân / thân chạm đáy, nhìn chéo sang trái như art9. */
(function(){
const A=ART, D=A.LC_DRAW, {ell,eye}=A.lcKit, K='#1c1516', WH='#ffffff';
// tôm: thân cong nhiều đốt, râu dài, đuôi xoè
D.tom_nhi=P=>{ for(let i=0;i<5;i++){ const x=9+i*3, y=18-Math.round(Math.sin(i*.7)*4); ell(P,x,y,3,3,i%2?'#ff9a7a':'#ffb08a'); P.px(x,y+2,'#e86a4a'); } ell(P,7,17,4,3,'#ff9a7a');
  eye(P,5,15); P.rect(1,13,5,1,'#e86a4a'); P.rect(0,11,4,1,'#e86a4a'); P.rect(24,18,3,2,'#ff8a6a'); P.rect(25,20,3,2,'#ffb08a'); for(const x of [9,12,15]) P.rect(x,22,1,4,'#e86a4a'); };
D.tom_hum=P=>{ ell(P,15,18,9,5,'#d8302a'); for(let x=8;x<24;x+=4) P.rect(x,15,1,7,'#a81a1a'); ell(P,7,16,5,4,'#e8402a'); eye(P,5,14); P.rect(0,10,5,1,'#a81a1a'); P.rect(1,8,4,1,'#a81a1a');
  ell(P,4,22,4,3,'#c82a22'); P.rect(0,20,3,1,'#c82a22'); P.rect(0,24,3,1,'#c82a22'); ell(P,10,24,3,2,'#c82a22'); P.rect(23,14,4,3,'#e8402a'); P.rect(24,18,4,4,'#ff6a4a'); for(const x of [12,16,20]) P.rect(x,23,1,4,'#a81a1a'); };
// cua: mai tròn, mắt trên cuống, 2 càng giơ cao, chân hai bên
D.cua_nhi=P=>{ ell(P,14,19,8,5,'#f2802a'); ell(P,14,18,6,3,'#ff9a4a'); P.rect(10,11,1,4,'#c85a1a'); P.rect(17,11,1,4,'#c85a1a'); P.rect(9,10,3,2,WH); P.rect(16,10,3,2,WH); P.px(10,10,K); P.px(17,10,K);
  ell(P,4,14,3,3,'#e8702a'); P.rect(2,12,2,1,'#c85a1a'); ell(P,24,14,3,3,'#e8702a'); P.rect(24,12,2,1,'#c85a1a'); for(const x of [6,8,20,22]) P.rect(x,22,1,4,'#c85a1a'); P.rect(12,21,5,1,'#c85a1a'); };
D.cua_hoang=P=>{ ell(P,14,18,11,7,'#a8283a'); ell(P,14,17,8,4,'#c83a4a'); for(const x of [6,10,14,18,22]) P.rect(x,12,1,2,'#f2c43d'); P.rect(9,8,1,4,'#7a1a28'); P.rect(18,8,1,4,'#7a1a28'); P.rect(8,7,3,2,WH); P.rect(17,7,3,2,WH); P.px(9,7,K); P.px(18,7,K);
  ell(P,2,12,3,4,'#c83a4a'); P.rect(0,9,3,2,'#7a1a28'); ell(P,26,12,3,4,'#c83a4a'); P.rect(25,9,3,2,'#7a1a28'); for(const x of [4,7,21,24]) P.rect(x,23,2,4,'#7a1a28'); P.rect(10,2,8,3,'#f2c43d'); for(const x of [10,13,17]) P.px(x,1,'#f2c43d'); };
// mực: thân thuôn nhọn trên, vây 2 bên, xúc tu dưới
D.muc_nhi=P=>{ ell(P,14,12,5,8,'#f4c8d8'); P.rect(12,3,4,3,'#f4c8d8'); P.rect(8,10,2,5,'#e8a8c0'); P.rect(18,10,2,5,'#e8a8c0'); eye(P,12,16); eye(P,16,16); for(const x of [10,12,14,16,18]) P.rect(x,20,1,6+(x%4?1:0),'#e8a8c0'); P.px(13,8,WH); };
D.bach_tuoc=P=>{ ell(P,14,11,8,8,'#5a2a7a'); ell(P,12,8,3,3,'#7a4a9a'); P.rect(9,12,4,3,WH); P.rect(15,12,4,3,WH); P.rect(10,13,2,2,K); P.rect(16,13,2,2,K);
  for(let i=0;i<6;i++){ const x=5+i*3.5; for(let y=18;y<27;y++) P.px(Math.round(x+Math.sin(y*.8+i)*1.2),y,i%2?'#4a1a6a':'#6a3a8a'); } P.rect(2,22,3,2,'#2a1a30'); };
// Thuồng Luồng: thân rắn dài cuộn sóng, vây lưng, râu, sừng nhỏ, mắt vàng
D.thuong_luong=P=>{ for(let i=0;i<8;i++){ const x=6+i*2.8, y=22-Math.round(Math.sin(i*1.1)*4); ell(P,Math.round(x),y,3,3,i%2?'#1a8a7a':'#2aa88a'); P.px(Math.round(x),y+2,'#c8f0d8'); if(i%2) P.rect(Math.round(x),y-4,1,2,'#7ae8c8'); }
  ell(P,6,9,6,5,'#2aa88a'); P.rect(0,11,6,3,'#c8f0d8'); for(let x=1;x<6;x+=2) P.px(x,12,K); eye(P,5,7,'#f2c43d'); P.rect(7,1,2,4,'#e8e0b0'); P.rect(10,2,2,3,'#e8e0b0');
  P.rect(0,15,1,5,'#7ae8c8'); P.rect(2,15,1,4,'#7ae8c8'); P.rect(23,16,5,3,'#7ae8c8'); for(const [x,y] of [[3,26],[9,27],[16,26],[22,27]]) P.rect(x,y,3,1,'#9ad8f8'); };
// Trung tâm Lính Cát cạnh Khu tâm linh: tượng Bóng Cát trên bệ đá, cờ đỏ in Bóng Cát
A.lcStatue=()=>A.sprite(44,52,22,50,(g,P)=>{ P.rect(6,38,32,12,'#8a8e96'); P.rect(6,38,32,2,'#b8bcc4'); P.rect(9,34,26,5,'#a8acb4'); P.rect(12,44,20,3,'#6a6e76');
  for(let y=0;y<30;y++){ const w=Math.round(14*Math.sqrt(Math.max(0,1-((y-15)/15)**2))); P.rect(22-w,4+y,w*2,1,y<15?(y<4?'#ff5a4a':'#e8302a'):'#f4f4f2'); }
  P.rect(8,18,28,3,'#1c1516'); P.disc(22,19,6,'#1c1516'); P.disc(22,19,4,'#f4f4f2'); P.disc(22,19,2,'#1c1516'); P.rect(14,8,6,3,'#ffb0a8'); P.rect(10,46,24,1,'#f2c43d'); });
A.lcFlag=()=>A.sprite(20,44,4,43,(g,P)=>{ P.rect(3,2,2,41,'#6a6e76'); P.rect(2,1,4,2,'#f2c43d'); P.rect(5,4,14,11,'#d82a2e'); P.rect(5,4,14,2,'#ff5a4a'); P.disc(12,10,3,'#f4f4f2'); P.rect(9,9,7,1,'#1c1516'); P.px(12,10,'#1c1516'); P.rect(1,42,6,2,'#4a4e56'); });
})();
