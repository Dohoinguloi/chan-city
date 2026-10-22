/* Lễ hội Bí ngô: icon bí ngô, quả bí mọc dưới đất (3 dáng), đèn bí ngô khắc mặt có lửa lập loè, dơi.
   Vẽ tay từng pixel: thân cam có múi, gân thẫm, ánh sáng bên trái, cuống xanh xoắn + lá. */
(function(){
const A=ART, S=(w,h,ax,ay,fn,ol=true)=>A.sprite(w,h,ax,ay,fn,ol);
const OR=['#f08a32','#e0701e','#b8521a','#ffb060','#8a3a12'];   // cam, cam thẫm (múi), gân, ánh sáng, đáy
// thân bí: các hàng [y, x0, x1] tạo hình dẹt tròn; múi = cột thẫm chạy dọc
function body(P,ox,oy,rows,ribs,face){ for(const [y,x0,x1] of rows){ P.rect(ox+x0,oy+y,x1-x0+1,1,OR[0]); }
  const yb=rows[rows.length-1][0], yt=rows[0][0];
  for(const [y,x0,x1] of rows){ for(const rx of ribs) if(rx>x0&&rx<x1) P.px(ox+rx,oy+y,OR[1]); P.px(ox+x0,oy+y,OR[1]); P.px(ox+x1,oy+y,OR[2]);
    if(y>=yb-1) P.rect(ox+x0+1,oy+y,x1-x0-1,1,OR[1]); }
  for(const [y,x0] of rows) if(y>yt&&y<yt+4) P.px(ox+x0+1,oy+y,OR[3]);                     // ánh sáng mép trái
  P.px(ox+rows[1][1]+2,oy+yt+1,OR[3]); P.px(ox+rows[2][1]+2,oy+yt+2,'#ffd090');
  if(face){ const L=face; P.rect(ox+3,oy+yt+3,2,2,L[0]); P.px(ox+4,oy+yt+2,L[0]); P.rect(ox+rows[3][2]-4,oy+yt+3,2,2,L[0]); P.px(ox+rows[3][2]-4,oy+yt+2,L[0]);   // mắt tam giác
    P.px(ox+7,oy+yt+5,L[1]);                                                                                                        // mũi
    const my=oy+yt+6; for(let x=3;x<=rows[4][2]-3;x++) P.px(ox+x,my+(x%2),L[0]); P.px(ox+5,my,L[1]); P.px(ox+9,my,L[1]); } }
function stem(P,x,y,curl){ P.rect(x,y,2,3,'#5a6a24'); P.px(x,y,'#7a8a34'); if(curl) { P.px(x+2,y-1,'#5a6a24'); P.px(x+3,y-1,'#5a6a24'); }
  P.rect(x+2,y+1,3,2,'#5f9a34'); P.px(x+4,y+1,'#8cc04a'); P.px(x+5,y+2,'#4a7a28'); }

const ROWS_BIG=[[3,3,12],[4,2,13],[5,1,14],[6,1,14],[7,1,14],[8,1,14],[9,1,14],[10,1,14],[11,2,13],[12,4,11]];
const ROWS_SM=[[5,3,10],[6,2,11],[7,1,12],[8,1,12],[9,1,12],[10,1,12],[11,2,11],[12,3,10]];
const ROWS_TALL=[[2,4,10],[3,3,11],[4,2,12],[5,2,12],[6,2,12],[7,2,12],[8,2,12],[9,2,12],[10,2,12],[11,3,11],[12,4,10]];
// quả bí mọc dưới đất: 3 dáng (bóng vẽ ở game)
const pumpkin=(v=0)=>S(18,16,9,14,(g,P)=>{
  if(v===1){ body(P,2,1,ROWS_SM,[5,8]); stem(P,7,3,true); }
  else if(v===2){ body(P,1,1,ROWS_TALL,[5,7,9]); stem(P,7,0,false); }
  else { body(P,1,1,ROWS_BIG,[4,7,10]); stem(P,7,1,true); } });
// đèn bí ngô khắc mặt: fr 0..2 lửa bên trong đổi độ sáng
const jack=(fr=0)=>S(18,18,9,16,(g,P)=>{
  const L=fr===0?['#ffd84a','#fff3a0']:fr===1?['#ffb02a','#ffe070']:['#ffe46a','#ffffff'];
  body(P,1,3,ROWS_BIG,[4,10],L); stem(P,7,3,true); });
// icon túi đồ 14×14
const iconP=P=>{ body(P,0,0,[[3,3,10],[4,2,11],[5,1,12],[6,1,12],[7,1,12],[8,1,12],[9,1,12],[10,2,11],[11,3,10]],[4,6,9]); stem(P,6,0,true); };
const iconJ=P=>{ body(P,0,0,[[3,3,10],[4,2,11],[5,1,12],[6,1,12],[7,1,12],[8,1,12],[9,1,12],[10,2,11],[11,3,10]],[],['#ffd84a','#fff3a0']); stem(P,6,0,true); };
const ICONS={pumpkin:iconP,jack:iconJ};
const oldIcon=A.icon; A.icon=function(name,scale=1){ const f=ICONS[name]; if(!f) return oldIcon(name,scale); const c=A.cv(14,14); f(A.painter(c.getContext('2d'))); A.outline(c);
  if(scale===1) return c; const s=A.cv(14*scale,14*scale), sg=s.getContext('2d'); sg.imageSmoothingEnabled=false; sg.drawImage(c,0,0,s.width,s.height); return s; };
Object.assign(A,{pumpkin,jack});
})();
