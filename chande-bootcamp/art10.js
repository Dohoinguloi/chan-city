/* Lính Cát mở rộng: 31 loài mới (sâu → kén → bướm, chim sẻ → chim ưng → đại bàng, chuột, rắn, dơi, đá, võ sĩ, cá chép → long ngư,
   niệm sư, củ hoa, gấu ngủ, 3 thần điểu huyền thoại, Tiểu Thần Cát). Vẽ vào khung 28×28, chân chạm đáy, nhìn chéo sang trái như art9. */
(function(){
const A=ART, D=A.LC_DRAW, {ell,eye,blush}=A.lcKit, K='#1c1516', WH='#ffffff';
const wing=(P,cx,cy,rx,ry,c,e)=>{ ell(P,cx,cy,rx,ry,c); if(e) for(let y=-ry+1;y<ry;y+=2) P.rect(cx-rx+1,cy+y,rx*2-1,1,e); };
/* sâu → kén → bướm (Côn trùng) */
D.sau_nhi=P=>{ for(let i=3;i>=0;i--){ const x=9+i*4, y=22-(i%2); ell(P,x,y,3,3,i%2?'#7ac850':'#8ad860'); P.px(x,y+2,'#f2e07a'); } ell(P,7,18,4,4,'#8ad860'); eye(P,5,17); P.rect(4,20,3,1,'#5a9a3a'); P.rect(6,12,1,3,'#e8302a'); P.rect(9,12,1,3,'#e8302a'); P.px(6,11,'#ff7a5a'); P.px(9,11,'#ff7a5a'); for(const x of [9,13,17]) P.rect(x,25,2,2,'#5a9a3a'); };
D.ken_cat=P=>{ ell(P,14,16,7,10,'#9ad86a'); ell(P,15,16,5,8,'#b8e88a'); for(const y of [10,14,18,22]) P.rect(8,y,13,1,'#7ab84a'); P.rect(9,13,3,1,K); P.rect(15,13,3,1,K); P.rect(13,2,2,5,'#7ab84a'); };
D.buom_tien=P=>{ wing(P,7,10,6,6,'#f4f4f2','#d8d8e0'); wing(P,21,10,6,6,'#f4f4f2','#d8d8e0'); wing(P,8,19,4,4,'#e8e8f0'); wing(P,20,19,4,4,'#e8e8f0'); for(const x of [3,25]) P.rect(x,9,2,2,K);
  ell(P,14,15,3,7,'#6a4ab0'); ell(P,14,8,4,3,'#6a4ab0'); P.rect(11,7,3,3,'#e8302a'); P.rect(15,7,3,3,'#e8302a'); P.px(12,7,WH); P.px(16,7,WH); P.rect(12,2,1,4,K); P.rect(16,2,1,4,K); P.rect(13,22,2,4,'#4a2a88'); };
/* chim sẻ → chim ưng → đại bàng (Bay) */
D.se_nhi=P=>{ ell(P,14,19,7,6,'#a8743e'); ell(P,13,21,4,4,'#f4e0b8'); ell(P,10,13,5,5,'#a8743e'); eye(P,8,12); P.rect(3,14,3,2,'#f2a83a'); P.rect(9,8,3,2,'#6a4228'); ell(P,18,18,4,3,'#6a4228'); P.rect(20,20,5,2,'#6a4228'); P.rect(12,25,1,3,'#f2a83a'); P.rect(16,25,1,3,'#f2a83a'); };
D.chim_ung=P=>{ wing(P,21,13,6,5,'#a8743e','#8a5a32'); ell(P,13,18,6,7,'#c8945a'); ell(P,12,20,4,5,'#f4e0b8'); ell(P,10,10,5,5,'#c8945a'); eye(P,8,9); P.rect(3,11,3,2,'#f2c43d'); P.rect(9,3,5,3,'#e8302a'); P.rect(12,1,3,2,'#e8302a'); P.rect(11,25,1,3,'#f2c43d'); P.rect(15,25,1,3,'#f2c43d'); P.rect(18,23,6,2,'#8a5a32'); };
D.dai_bang=P=>{ wing(P,5,12,5,7,'#c8945a','#a8743e'); wing(P,23,12,5,7,'#c8945a','#a8743e'); ell(P,14,18,6,7,'#d8a868'); ell(P,14,20,4,5,'#f4e0b8'); ell(P,14,8,5,5,'#d8a868'); eye(P,11,7); eye(P,15,7); P.rect(13,10,3,2,'#f2c43d');
  P.rect(11,1,7,3,'#ffd84a'); P.rect(9,2,2,3,'#e8302a'); P.rect(18,2,2,3,'#e8302a'); P.rect(11,25,2,3,'#f2c43d'); P.rect(16,25,2,3,'#f2c43d'); };
/* chuột (Thường) */
D.chuot_nhi=P=>{ ell(P,15,21,7,5,'#a878c8'); ell(P,8,17,5,4,'#a878c8'); P.rect(4,11,4,5,'#a878c8'); P.rect(9,11,4,5,'#a878c8'); P.rect(5,12,2,3,'#f4c8e0'); P.rect(10,12,2,3,'#f4c8e0'); eye(P,6,15,'#e8302a'); P.rect(3,19,2,2,WH); P.px(2,17,'#f4c8e0');
  P.rect(22,18,2,2,'#a878c8'); P.rect(24,15,2,3,'#a878c8'); P.rect(22,13,2,2,'#a878c8'); P.rect(10,25,3,2,'#f4c8e0'); P.rect(17,25,3,2,'#f4c8e0'); };
D.chuot_tuong=P=>{ ell(P,15,19,9,7,'#c8945a'); ell(P,13,21,5,5,'#f4e0b8'); ell(P,8,13,6,5,'#c8945a'); P.rect(3,6,4,5,'#c8945a'); P.rect(11,6,4,5,'#c8945a'); eye(P,5,12); eye(P,10,12); P.rect(6,16,3,3,WH);
  for(const y of [14,16]){ P.rect(0,y,3,1,K); P.rect(13,y,3,1,K); } P.rect(23,17,4,2,'#8a5a32'); P.rect(9,25,3,3,'#8a5a32'); P.rect(18,25,3,3,'#8a5a32'); };
/* rắn → hổ mang (Độc) */
D.ran_nhi=P=>{ for(let i=0;i<3;i++) ell(P,14,23-i*4,8-i*2,3,i%2?'#9a5ac8':'#8a4ab8'); ell(P,10,9,4,4,'#9a5ac8'); eye(P,8,8); P.rect(4,11,3,1,'#e8302a'); P.px(3,12,'#e8302a'); P.rect(20,22,4,2,'#f2c43d'); for(const x of [9,14,19]) P.px(x,23,'#f2c43d'); };
D.ho_mang=P=>{ ell(P,14,23,9,4,'#7a3ab0'); P.rect(11,10,6,13,'#8a4ab8'); ell(P,14,9,8,7,'#8a4ab8'); ell(P,14,10,5,5,'#c8a0e8'); P.rect(11,8,2,2,'#ff4a4a'); P.rect(16,8,2,2,'#ff4a4a'); P.rect(12,12,4,1,K);
  P.rect(13,13,2,2,'#e8302a'); for(const [x,y] of [[8,9],[20,9],[10,14],[18,14]]) P.rect(x,y,2,2,'#f2c43d'); };
/* dơi (Độc, ban đêm) */
D.doi_nhi=P=>{ wing(P,6,12,5,4,'#4a7ab8','#3a5a98'); wing(P,22,12,5,4,'#4a7ab8','#3a5a98'); ell(P,14,13,5,5,'#5a8ac8'); P.rect(10,5,3,4,'#5a8ac8'); P.rect(15,5,3,4,'#5a8ac8'); P.rect(11,16,6,2,K); P.px(12,17,WH); P.px(15,17,WH); P.rect(11,19,2,4,'#3a5a98'); P.rect(15,19,2,4,'#3a5a98'); };
D.doi_dem=P=>{ wing(P,5,11,6,6,'#6a3ab0','#4a2488'); wing(P,23,11,6,6,'#6a3ab0','#4a2488'); ell(P,14,13,7,7,'#7a4ac0'); P.rect(9,3,3,5,'#7a4ac0'); P.rect(16,3,3,5,'#7a4ac0'); eye(P,10,9,'#ffd84a'); eye(P,16,9,'#ffd84a');
  P.rect(9,14,10,5,'#2a1030'); P.rect(9,14,10,1,'#ff9ad0'); P.rect(10,14,2,3,WH); P.rect(16,14,2,3,WH); P.rect(11,20,2,5,'#4a2488'); P.rect(15,20,2,5,'#4a2488'); };
/* đá → đá lăn → núi đá (Đá) */
const rock=(P,cx,cy,rx,ry)=>{ ell(P,cx,cy,rx,ry,'#9a9890'); ell(P,cx-1,cy-1,rx-2,ry-2,'#b8b6ac'); for(const [dx,dy] of [[-3,2],[2,-2],[3,3],[-2,-3]]) P.rect(cx+dx,cy+dy,2,1,'#7a786e'); };
D.da_nhi=P=>{ rock(P,14,17,8,7); eye(P,10,15); eye(P,16,15); P.rect(12,19,4,1,K); for(const x of [3,22]){ P.rect(x,15,4,3,'#9a9890'); P.rect(x+(x<10?-1:3),13,2,5,'#9a9890'); } };
D.da_lan=P=>{ rock(P,14,17,9,8); eye(P,10,14); eye(P,16,14); P.rect(11,19,6,1,K); for(const [x,y] of [[1,12],[23,12],[2,20],[22,20]]){ P.rect(x,y,4,3,'#9a9890'); P.rect(x+1,y-2,2,2,'#9a9890'); } P.rect(9,25,4,3,'#7a786e'); P.rect(16,25,4,3,'#7a786e'); };
D.nui_da=P=>{ ell(P,14,16,11,10,'#8a7a5a'); for(let i=0;i<5;i++) ell(P,6+i*4,10+(i%2)*2,3,3,'#a89a78'); ell(P,14,18,6,5,'#c8a878'); eye(P,11,16); eye(P,16,16); P.rect(12,20,4,1,K);
  P.rect(1,16,4,6,'#c8a878'); P.rect(23,16,4,6,'#c8a878'); P.rect(8,25,4,3,'#8a7a5a'); P.rect(16,25,4,3,'#8a7a5a'); };
/* võ sĩ nhí → võ sĩ → võ lâm tướng (Võ) */
const fighter=(P,s)=>{ const B=['#a8b8c8','#8a9ab8','#7a8ab0'][s], h=[9,12,14][s], top=27-h-9; ell(P,14,top+4,[4,5,5][s],[4,4,5][s],B); eye(P,11,top+3); eye(P,15,top+3); P.rect(12,top+6,4,1,K);
  P.rect(10,top+8,9,h-4,B); P.rect(11,top+9,7,3,'#c8d4e0'); P.rect(9,27-5,4,5,B); P.rect(15,27-5,4,5,B); P.rect(5-s,top+9,4+s,3+s,B); P.rect(19,top+9,4+s,3+s,B); P.rect(3-s,top+8,3+s,4+s,'#e8c8a8'); P.rect(22+s,top+8,3+s,4+s,'#e8c8a8');
  P.rect(10,top+h+1,9,2,s===2?'#f2c43d':'#2a2a32'); if(s>=1) P.rect(12,top-1,4,2,'#d23a2e'); if(s===2){ P.rect(13,top+h+1,3,2,'#e8302a'); } };
D.vo_nhi=P=>fighter(P,0); D.vo_si=P=>fighter(P,1); D.vo_tuong=P=>fighter(P,2);
/* cá chép → long ngư (Nước) */
D.ca_chep=P=>{ ell(P,13,17,9,6,'#ff7a3a'); ell(P,12,19,6,3,'#ffd0a0'); for(const [x,y] of [[9,14],[13,13],[17,14]]) P.rect(x,y,2,2,'#e85a1a'); P.rect(22,12,4,4,'#f2f2f0'); P.rect(22,18,4,4,'#f2f2f0'); P.rect(10,9,6,3,'#f2f2f0');
  eye(P,6,15); P.rect(2,17,3,2,'#ffb0a0'); P.rect(3,20,1,4,'#f2c43d'); P.rect(1,23,2,1,'#f2c43d'); P.rect(11,24,4,3,'#f2f2f0'); };
D.long_ngu=P=>{ for(let i=0;i<6;i++){ const x=8+i*3, y=24-Math.round(Math.sin(i*.8)*3)-i; ell(P,x,y,3,3,'#3a7ad8'); P.px(x,y+2,'#f2e07a'); } ell(P,7,9,6,5,'#3a7ad8'); P.rect(1,11,6,3,'#f2f2f0'); for(let x=2;x<7;x+=2) P.px(x,12,K);
  eye(P,6,6,'#ff4a4a'); P.rect(9,1,2,4,'#f2f2f0'); P.rect(12,2,2,3,'#f2f2f0'); P.rect(3,14,1,5,'#3a7ad8'); P.rect(22,8,4,6,'#5a9ae8'); P.rect(24,6,3,3,'#f2f2f0'); };
/* niệm nhí → niệm sư → đại niệm sư (Tâm linh) */
const psy=(P,s)=>{ const B='#f2c43d', h=[10,13,15][s], top=27-h-8; ell(P,14,top+3,5,4,B); P.rect(9,top-4,3,5,B); P.rect(17,top-4,3,5,B); P.rect(10,top+2,3,1,K); P.rect(15,top+2,3,1,K);
  if(s>=1){ P.rect(10,top+6,8,2,'#8a5a32'); } if(s===2){ P.rect(8,top+6,3,4,'#8a5a32'); P.rect(17,top+6,3,4,'#8a5a32'); }
  P.rect(10,top+8,8,h-3,'#a86a3a'); P.rect(11,top+9,6,h-5,B); P.rect(9,24,4,4,B); P.rect(15,24,4,4,B); P.rect(5,top+10,4,2,B); P.rect(19,top+10,4,2,B);
  for(const [x,on] of [[4,s>=1],[24,s===2]]) if(on){ P.rect(x,top+3,1,8,'#c8ccd2'); P.rect(x-1,top+1,3,3,'#c8ccd2'); } P.rect(20,top+h+3,5,2,B); };
D.niem_nhi=P=>psy(P,0); D.niem_su=P=>psy(P,1); D.dai_niem=P=>psy(P,2);
/* củ nhí → hoa hôi → hoa độc (Độc) */
D.cu_nhi=P=>{ ell(P,14,20,7,6,'#3a5ab8'); ell(P,13,22,5,3,'#4a6ac8'); eye(P,10,19,'#ff4a4a'); eye(P,15,19,'#ff4a4a'); for(const [x,y,w] of [[8,6,3],[13,4,3],[18,6,3],[11,9,2],[16,9,2]]) P.rect(x,y,w,7,'#4ab05a'); P.rect(9,25,3,3,'#2a4a98'); P.rect(16,25,3,3,'#2a4a98'); };
D.hoa_hoi=P=>{ ell(P,14,20,8,6,'#3a5ab8'); P.rect(10,18,3,1,K); P.rect(15,18,3,1,K); P.rect(12,22,4,2,'#e86a8a'); ell(P,14,9,9,5,'#c8402a'); for(const [x,y] of [[8,8],[19,8],[14,6]]) P.rect(x,y,2,2,'#f2a83a'); P.rect(4,12,3,4,'#c8402a'); P.rect(21,12,3,4,'#c8402a'); P.rect(9,25,3,3,'#2a4a98'); P.rect(16,25,3,3,'#2a4a98'); };
D.hoa_doc=P=>{ ell(P,14,20,6,6,'#3a5ab8'); eye(P,11,18); eye(P,15,18); ell(P,14,8,13,6,'#e8302a'); for(const [x,y] of [[6,7],[11,4],[17,4],[22,7],[14,10]]) ell(P,x,y,2,2,'#f4c8c8'); ell(P,14,8,3,2,'#6a2a1a'); P.rect(10,25,3,3,'#2a4a98'); P.rect(16,25,3,3,'#2a4a98'); };
/* gấu ngủ (Thường) */
D.gau_ngu=P=>{ ell(P,14,16,12,11,'#2a6a7a'); ell(P,14,18,8,8,'#f4e8c8'); ell(P,14,6,6,4,'#2a6a7a'); P.rect(9,1,3,3,'#2a6a7a'); P.rect(17,1,3,3,'#2a6a7a'); ell(P,14,7,4,3,'#f4e8c8'); P.rect(11,6,2,1,K); P.rect(16,6,2,1,K); P.rect(13,8,3,1,K);
  P.rect(3,24,7,4,'#f4e8c8'); P.rect(18,24,7,4,'#f4e8c8'); P.rect(1,14,3,6,'#2a6a7a'); P.rect(24,14,3,6,'#2a6a7a'); };
/* 3 thần điểu huyền thoại */
const legend=(P,B,Bd,acc,flame)=>{ for(let i=0;i<4;i++){ P.rect(1+i*2,5+i*2,6,3,flame?(i%2?'#ffd84a':'#ff6a2a'):B); P.rect(21-i*2,5+i*2,6,3,flame?(i%2?'#ffd84a':'#ff6a2a'):B); } ell(P,14,16,5,7,B); ell(P,14,18,3,4,Bd); ell(P,14,8,4,4,B); eye(P,12,7,'#ff4a4a'); P.rect(15,9,4,2,acc);
  for(let i=0;i<3;i++) P.rect(12+i,1+i,2,3,flame?'#ffd84a':acc); P.rect(11,22,2,5,acc); P.rect(15,22,2,5,acc); for(let i=0;i<3;i++) P.rect(18+i*2,20+i*2,3,2,flame?'#ff6a2a':Bd); };
D.phuong_hoang=P=>legend(P,'#f2a83a','#ffd84a','#c8402a',true); D.than_dieu_bang=P=>legend(P,'#7fd8f0','#e8f8ff','#3a8ab8',false); D.loi_dieu=P=>{ legend(P,'#ffd84a','#fff3b0','#2a2026',false); for(const [x,y] of [[3,4],[24,4],[2,9],[25,9]]) P.rect(x,y,2,3,'#2a2026'); };
/* Tiểu Thần Cát (thần thoại): mèo hồng bay lơ lửng, đuôi dài */
D.tieu_than=P=>{ ell(P,13,14,6,5,'#ffb8d8'); ell(P,13,7,6,5,'#ffb8d8'); P.rect(7,1,3,4,'#ffb8d8'); P.rect(16,1,3,4,'#ffb8d8'); eye(P,9,6,'#3a8ad8'); eye(P,14,6,'#3a8ad8'); blush(P,8,9); blush(P,15,9);
  P.rect(9,18,2,3,'#ffb8d8'); P.rect(15,18,2,3,'#ffb8d8'); for(let i=0;i<7;i++) P.rect(18+i,14-Math.round(Math.sin(i*.7)*4),2,2,'#ffb8d8'); P.rect(25,9,3,3,'#ffb8d8'); for(const [x,y] of [[3,20],[22,22],[6,24]]) P.px(x,y,'#e8f4ff'); };
/* dạng 3 mới (tiến hoá cấp 25): Chuột Vương, Mãng Xà Vương, Dạ Dơi Vương, Hải Long Vương — to hơn, đội vương miện vàng */
const crown=(P,x,y,w)=>{ P.rect(x,y+1,w,2,'#ffd84a'); for(let i=0;i<w;i+=Math.max(2,Math.floor((w-1)/2))) P.px(x+i,y,'#ffd84a'); P.px(x+Math.floor(w/2),y+1,'#e8302a'); };
D.chuot_vuong=P=>{ ell(P,10,18,7,6,'#b8282a'); ell(P,16,19,9,7,'#a8743e'); ell(P,14,21,5,5,'#f4e0b8'); ell(P,8,12,6,5,'#a8743e'); P.rect(2,5,5,5,'#a8743e'); P.rect(3,6,3,3,'#f4b8c8'); P.rect(11,5,5,5,'#a8743e'); P.rect(12,6,3,3,'#f4b8c8');
  eye(P,5,11,'#e8302a'); eye(P,10,11,'#e8302a'); P.rect(5,15,4,3,WH); P.px(7,15,K); crown(P,5,1,8); for(const y of [13,15]){ P.rect(0,y,3,1,K); P.rect(14,y,3,1,K); }
  P.rect(24,16,3,2,'#8a5a32'); P.rect(26,11,2,5,'#8a5a32'); P.rect(9,25,4,3,'#6a4228'); P.rect(18,25,4,3,'#6a4228'); };
D.mang_xa=P=>{ ell(P,14,24,11,3,'#5a2a90'); ell(P,14,21,8,3,'#6a3aa0'); P.rect(11,9,6,13,'#7a3ab0'); ell(P,14,10,11,7,'#6a2aa0'); ell(P,14,11,6,5,'#d8b0f0');
  for(const [x,y] of [[5,8],[22,8],[4,12],[23,12],[7,15],[20,15]]) P.rect(x,y,2,2,'#ffd84a'); P.rect(11,8,2,2,'#ff3a3a'); P.rect(16,8,2,2,'#ff3a3a'); P.rect(12,12,5,1,K); P.rect(12,13,1,2,WH); P.rect(16,13,1,2,WH); P.rect(13,14,2,3,'#e8302a'); crown(P,10,0,9); };
D.da_doi=P=>{ wing(P,5,12,6,8,'#4a1a78','#2e0e52'); wing(P,23,12,6,8,'#4a1a78','#2e0e52'); for(const x of [1,4,23,26]) P.rect(x,19,1,3,'#2e0e52'); ell(P,5,13,3,5,'#8a1a3a'); ell(P,23,13,3,5,'#8a1a3a');
  ell(P,14,14,7,8,'#5a2a98'); P.rect(9,2,3,6,'#5a2a98'); P.rect(16,2,3,6,'#5a2a98'); P.px(10,1,'#5a2a98'); P.px(17,1,'#5a2a98'); eye(P,10,10,'#ff3a3a'); eye(P,16,10,'#ff3a3a');
  P.rect(10,15,8,4,'#1a0820'); P.rect(11,15,2,3,WH); P.rect(15,15,2,3,WH); P.rect(11,22,2,5,'#2e0e52'); P.rect(15,22,2,5,'#2e0e52'); };
D.hai_long=P=>{ for(let i=0;i<7;i++){ const x=7+i*3, y=24-Math.round(Math.sin(i*.9)*3); ell(P,x,y,3,3,i%2?'#2a6ad8':'#3a7ae8'); P.px(x,y+2,'#f4e8b0'); } for(const x of [10,16,22]) P.rect(x,18,2,3,'#7fd8ff');
  ell(P,9,12,6,6,'#3a7ae8'); ell(P,7,15,4,3,'#f4e8b0'); eye(P,8,10,'#ffd84a'); P.rect(3,15,4,2,WH); P.rect(4,17,3,1,K); P.rect(0,12,4,1,'#f2c43d'); P.rect(0,14,3,1,'#f2c43d'); crown(P,6,3,7); P.rect(14,6,2,6,'#7fd8ff'); P.rect(16,8,2,4,'#7fd8ff'); };
})();
