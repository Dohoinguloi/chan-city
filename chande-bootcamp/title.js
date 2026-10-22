/* Chan City — màn hình chờ: cảnh hồ Hoà Bình vẽ pixel động (trời theo giờ Việt Nam, mây, núi, nước lấp lánh, đom đóm đêm),
   cả hội đứng trên bờ cỏ nhún nhảy, thanh tải + mẹo chơi đổi liên tục. Vẽ ở 384×216 rồi phóng to giữ nét pixel; núi, cây, nhà vẽ sẵn 1 lớp, chỉ vẽ lại khi màu trời đổi. */
(function(){
const $=s=>document.querySelector(s), W=384, H=216, A=window.ART;
const bg=$('#titleBg'), g=bg.getContext('2d'); bg.width=W; bg.height=H; g.imageSmoothingEnabled=false;
const hash=(a,b)=>{ const s=Math.sin(a*127.1+b*311.7)*43758.5453; return s-Math.floor(s); };
const vnHour=()=>{ const d=new Date(Date.now()+7*3600e3); return d.getUTCHours()+d.getUTCMinutes()/60; };
// bảng màu theo giờ: [đỉnh trời, chân trời, núi xa, núi giữa, núi gần, nước, cỏ, sương]
const SKY=[[0,['#0b1030','#26244e','#1e2646','#172038','#121a2c','#14284a','#1f3a26','rgba(120,130,190,.18)']],[5,['#2a2a5a','#e08a6a','#5a5272','#3e4058','#2a3240','#3a4a7a','#2f5a30','rgba(255,200,180,.35)']],
  [7,['#5aa0e0','#f6dca8','#8aa4c0','#6a8aa0','#4f7458','#3b8ed3','#4f9238','rgba(255,255,255,.45)']],[12,['#3a8ae0','#bfe4f8','#8ea8c4','#6c8ea8','#4f7a5a','#3b8ed3','#4f9238','rgba(255,255,255,.35)']],
  [16.5,['#4a78c8','#f6c890','#8a8ea8','#6a7a90','#4a6450','#4a86c0','#4a8a36','rgba(255,230,200,.4)']],[18.3,['#3a3a7a','#ee7a5a','#6a5270','#4a4058','#33303e','#4a4a80','#3a6a30','rgba(255,170,140,.35)']],
  [19.8,['#0b1030','#26244e','#1e2646','#172038','#121a2c','#14284a','#1f3a26','rgba(120,130,190,.18)']],[24,['#0b1030','#26244e','#1e2646','#172038','#121a2c','#14284a','#1f3a26','rgba(120,130,190,.18)']]];
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const mix=(a,b,k)=>{ if(a[0]!=='#') return k<.5?a:b; const A=hex(a), B=hex(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join(''); };
const shade=(c,f)=>'#'+hex(c).map(v=>Math.max(0,Math.min(255,Math.round(v*f))).toString(16).padStart(2,'0')).join('');
function palette(h){ for(let i=0;i<SKY.length-1;i++){ const [h0,c0]=SKY[i], [h1,c1]=SKY[i+1]; if(h>=h0&&h<h1){ const k=(h-h0)/(h1-h0); return c0.map((c,j)=>mix(c,c1[j],k)); } } return SKY[0][1]; }
const CAST=['men_men/men_men','phap/phap_xanh','phu_le/phu_le','don_che/don_che','kha_banh/kha_banh','kenny_ho/kenny_ho','huy_phan/huy_phan'].map(p=>{ const img=new Image(); img.src='../pixel-sprite-forge/characters/'+p+'.png'; return img; });
const clouds=[...Array(8)].map((_,i)=>({x:hash(i,1)*W,y:10+hash(i,2)*46,w:22+hash(i,3)*34,s:1.5+hash(i,4)*3}));
const bugs=[...Array(34)].map((_,i)=>({x:hash(i,5)*W,y:120+hash(i,6)*90,p:hash(i,7)*6}));
const ridgeY=(x,y0,amp,f,ph)=>Math.round(y0-amp*(.55*Math.sin(x*f+ph)+.3*Math.sin(x*f*2.3+ph*1.7)+.15*Math.sin(x*f*5.1+ph*.3)));
// lớp tĩnh (núi, cây, nhà, bờ) vẽ sẵn, chỉ vẽ lại khi màu trời đổi
let STATIC=null, STATIC_KEY='';
function buildStatic(P){ const [top,hor,far,mid,near,water,grass,mist]=P, c=document.createElement('canvas'); c.width=W; c.height=H; const s=c.getContext('2d'), R=(x,y,w,h,col)=>{ s.fillStyle=col; s.fillRect(x,y,w,h); };
  // 3 lớp núi, lớp giữa và gần có chấm cây, sương mờ giữa các lớp
  for(let x=0;x<W;x++){ const y=ridgeY(x,96,26,.017,1.2); R(x,y,1,120-y,far); if(hash(x,1)<.3) R(x,y,1,1,shade(far,1.12)); }
  R(0,98,W,10,mist);
  for(let x=0;x<W;x++){ const y=ridgeY(x,108,16,.029,4.1); R(x,y,1,120-y,mid); for(let yy=y+2;yy<120;yy+=3) if(hash(x,yy)<.22) R(x,yy,1,2,shade(mid,.82)); }
  R(0,110,W,6,mist);
  for(let x=0;x<W;x++){ const y=ridgeY(x,117,7,.05,2.2); R(x,y,1,120-y,near); if(hash(x,3)<.5){ R(x,y-1,1,1,shade(near,.8)); } }
  // nước + bóng núi in xuống hồ
  const wg=s.createLinearGradient(0,119,0,162); wg.addColorStop(0,shade(water,.82)); wg.addColorStop(1,shade(water,1.12)); s.fillStyle=wg; s.fillRect(0,119,W,43);
  for(let x=0;x<W;x++){ const y=ridgeY(x,117,7,.05,2.2), d=120-y; for(let k=0;k<d+6;k++) if((k+x)%3) R(x,120+k,1,1,'rgba(20,40,40,.16)'); }
  // nhà sàn bên kia hồ (mái lá, cột, cửa sổ), bóng in nước
  for(const [x,w] of [[36,22],[70,16],[236,24],[300,18]]){ const y=118; R(x,y-8,w,7,'#4a3424'); for(let k=0;k<w;k+=3) R(x+k,y-8,1,7,'#3a2a1c'); R(x+3,y-6,3,3,'#2a1e16'); R(x+w-7,y-6,3,3,'#2a1e16');
    for(let k=0;k<4;k++) R(x-3+k,y-11-k,w+6-k*2,1,k%2?'#a8844a':'#8a6a3a'); R(x-3,y-11,w+6,1,'#6a4a28'); for(const px of [x+1,x+w/2|0,x+w-2]) R(px,y-1,1,4,'#3a2a1c'); R(x,y+3,w,3,'rgba(20,20,30,.25)'); }
  // bãi cát + sỏi, cỏ có vệt, đường đất có đá
  R(0,160,W,5,'#d8c894'); for(let x=0;x<W;x+=2) if(hash(x,9)<.3) R(x,161+(hash(x,8)*3|0),2,1,'#b8a878'); R(0,160,W,1,'rgba(255,255,255,.35)');
  R(0,165,W,H-165,grass); for(let i=0;i<500;i++){ const x=hash(i,11)*W|0, y=166+(hash(i,12)*50|0); R(x,y,1,2,shade(grass,hash(i,13)<.5?.82:1.15)); }
  R(0,194,W,14,'#c8b088'); R(0,194,W,1,'#a8906a'); R(0,207,W,1,'#a8906a'); for(let i=0;i<40;i++) R(hash(i,14)*W|0,196+(hash(i,15)*10|0),2,1,'#e0cca4');
  // cầu tàu gỗ ra hồ
  for(let k=0;k<6;k++) R(318,128+k*5,20,4,k%2?'#8a5d3b':'#a7744c'); for(const x of [318,336]) R(x,126,2,40,'#5a3a22');
  // cây: bàng tròn 2 bên, thông, khóm tre, bụi hoa
  const round=(x,y,r,col)=>{ R(x-1,y,3,14,'#4a3020'); for(const [dx,dy,rr] of [[0,-r,r],[-r*.7,-r*.6,r*.75],[r*.7,-r*.55,r*.7],[0,-r*1.5,r*.7]]){ s.fillStyle=shade(col,.78); s.beginPath(); s.arc(x+dx+1,y+dy+1,rr,0,7); s.fill(); s.fillStyle=col; s.beginPath(); s.arc(x+dx,y+dy,rr,0,7); s.fill(); }
    for(let i=0;i<14;i++) R(x+(hash(i,x)-.5)*r*2|0,y-r*1.6+(hash(x,i)*r*1.6|0),2,1,shade(col,1.25)); };
  const pine=(x,y,h,col)=>{ R(x,y-3,2,4,'#4a3020'); for(let k=0;k<h;k++){ const w=Math.max(1,Math.round((h-k)*.6)); R(x+1-w,y-4-k,w*2,1,k%3?col:shade(col,.8)); } };
  const tc=grass[0]==='#'?shade(grass,.7):'#2f6a2a';
  round(22,180,16,shade(tc,1.1)); round(360,178,18,shade(tc,1.05)); round(64,174,10,tc); pine(98,176,26,shade(tc,.9)); pine(330,170,30,shade(tc,.9)); pine(286,174,20,tc);
  for(let k=0;k<7;k++){ R(118+k*3,150-(k%3)*6,1,30+(k%3)*6,'#6a9a3a'); for(let y=152;y<180;y+=6) R(117+k*3,y-(k%3)*6,3,1,'#8aba4a'); }
  for(let i=0;i<30;i++){ const x=hash(i,16)*W|0, y=170+(hash(i,17)*22|0); if(y>192&&y<210) continue; R(x,y,1,2,'#3f7a31'); R(x,y-1,1,1,['#ff9fb2','#ffe066','#f4f1ea','#a882ff'][i%4]); }
  // cổng gỗ "KE RETREAT" + đèn đường
  R(150,138,3,58,'#5a3a22'); R(186,138,3,58,'#5a3a22'); R(144,133,51,6,'#8a5d3b'); R(144,133,51,1,'#a7744c'); R(144,138,51,1,'#5a3a22'); R(152,141,35,8,'#efe1c0'); R(152,141,35,1,'#ffffff'); if(A&&A.drawText) A.drawText(s,'KE RETREAT',154,142,'#5a3a22');   // cổng cao hơn đầu cả hội
  R(258,160,2,36,'#3a3a44'); R(254,158,10,3,'#3a3a44');
  return c; }
const birds=[...Array(5)].map((_,i)=>({x:hash(i,30)*W,y:24+hash(i,31)*30,s:12+hash(i,32)*10,p:hash(i,33)*6}));
function frame(t){ const h=vnHour(), P=palette(h), [top,hor]=P, night=h<5.2||h>19.6, dusk=h>17.6||h<6.4, sec=t/1000, key=P.join();
  if(key!==STATIC_KEY){ STATIC=buildStatic(P); STATIC_KEY=key; }
  const gr=g.createLinearGradient(0,0,0,120); gr.addColorStop(0,top); gr.addColorStop(1,hor); g.fillStyle=gr; g.fillRect(0,0,W,120);
  if(night) for(let i=0;i<90;i++){ if(hash(i,9)>.55+.4*Math.sin(sec*2+i)) continue; g.fillStyle=i%7?'#e8e8ff':'#ffe8a0'; g.fillRect(hash(i,10)*W|0,hash(i,11)*90|0,1,1); }
  const k=((h-6+24)%24)/12, sx=Math.round(24+k*(W-48)), sy=Math.round(96-Math.sin(Math.min(1,Math.max(0,k))*Math.PI)*70);
  if(!night&&k<=1){ for(const [r,a] of [[22,.08],[16,.14],[12,.25]]){ g.fillStyle=`rgba(255,240,180,${a})`; g.beginPath(); g.arc(sx,sy,r,0,7); g.fill(); } g.fillStyle='#fff0b0'; g.beginPath(); g.arc(sx,sy,9,0,7); g.fill(); }
  else { const mk=((h-18+24)%24)/12, mx=Math.round(24+mk*(W-48)), my=Math.round(96-Math.sin(Math.min(1,mk)*Math.PI)*70); g.fillStyle='rgba(240,240,220,.12)'; g.beginPath(); g.arc(mx,my,14,0,7); g.fill(); g.fillStyle='#f4f1dc'; g.beginPath(); g.arc(mx,my,7,0,7); g.fill(); g.fillStyle=top; g.beginPath(); g.arc(mx+3,my-2,6,0,7); g.fill(); }
  for(const c of clouds){ c.x=(c.x+c.s*.016)%(W+80); const x=Math.round(c.x-40), y=Math.round(c.y), lit=night?'rgba(150,160,200,.35)':dusk?'rgba(255,210,190,.9)':'rgba(255,255,255,.92)', sh=night?'rgba(90,100,140,.3)':dusk?'rgba(200,140,150,.8)':'rgba(205,220,235,.9)';
    g.fillStyle=sh; g.fillRect(x+2,y+3,c.w-2,4); g.fillStyle=lit; g.fillRect(x,y,c.w,5); g.fillRect(x+5,y-3,c.w-12,3); g.fillRect(x+(c.w*.28|0),y-6,c.w*.32|0,3); g.fillRect(x+(c.w*.55|0),y-4,c.w*.25|0,2); }
  if(!night) for(const b of birds){ const x=Math.round((b.x+sec*b.s)%(W+40))-20, y=Math.round(b.y+Math.sin(sec+b.p)*3), f=Math.floor(sec*4+b.p)%2; g.fillStyle='#2a2a3a'; g.fillRect(x-2,y-(f?1:0),2,1); g.fillRect(x+1,y-(f?1:0),2,1); g.fillRect(x,y,1,1); }
  g.drawImage(STATIC,0,0);
  // nước: vệt sáng lấp lánh, vệt mặt trời/trăng, thuyền câu trôi + gợn sóng, khói bếp nhà sàn
  for(let i=0;i<60;i++){ const x=(hash(i,12)*W+sec*(5+hash(i,13)*8))%W, y=121+hash(i,14)*38; if(Math.sin(sec*3+i)>.15){ g.fillStyle=night?'rgba(200,210,255,.35)':'rgba(255,255,255,.55)'; g.fillRect(x|0,y|0,2+(i%4),1); } }
  for(let y=122;y<160;y+=2){ const w=6+Math.sin(sec*2+y)*3; g.fillStyle=night?'rgba(240,240,210,.18)':'rgba(255,240,190,.28)'; g.fillRect(Math.round((night?W-sx:sx)-w/2),y,Math.round(w),1); }
  const bx=Math.round((sec*6)%(W+60))-30, by=146+Math.round(Math.sin(sec*1.6)*1); g.fillStyle='#4a3020'; g.fillRect(bx,by,22,3); g.fillRect(bx+2,by+3,18,1); g.fillStyle='#6e472c'; g.fillRect(bx+1,by-1,20,1);
  g.fillStyle='#e8d8b4'; g.fillRect(bx+14,by-8,4,7); g.fillStyle='#c8b080'; g.fillRect(bx+13,by-10,6,2); g.fillStyle='#3a2a20'; g.fillRect(bx+7,by-14,1,13); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(bx-4,by+4,30,1);
  for(const [x0] of [[44],[244]]) for(let k=0;k<5;k++){ const a=(sec*.6+k*.2)%1; g.fillStyle=`rgba(220,220,230,${(.5*(1-a)).toFixed(2)})`; g.fillRect(Math.round(x0+Math.sin(sec+k)*2+a*4),Math.round(104-a*18),2,2); }
  if(night||dusk){ g.fillStyle='rgba(255,216,107,.9)'; for(const x of [42,76,244,306]) g.fillRect(x,112,2,2); g.fillStyle='rgba(255,220,120,.25)'; g.beginPath(); g.arc(259,159,9,0,7); g.fill(); g.fillStyle='#ffd86b'; g.fillRect(256,159,6,2); }
  // cả hội đứng trên đường đất, nhún theo nhịp
  CAST.forEach((img,i)=>{ if(!img.complete||!img.naturalWidth) return; const x=Math.round(W/2-(CAST.length*30)/2+i*30), bob=Math.round(Math.max(0,Math.sin(sec*4+i*.9))*2);
    g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x+9,203,14,2); g.drawImage(img,0,0,32,48,x,156-bob,32,48); });
  if(night) for(const b of bugs){ const a=.5+.5*Math.sin(sec*2.2+b.p); g.fillStyle=`rgba(220,255,120,${a.toFixed(2)})`; g.fillRect(Math.round(b.x+Math.sin(sec*.7+b.p)*6),Math.round(b.y+Math.cos(sec*.9+b.p)*4),1,1); }
  else for(let i=0;i<5;i++){ const x=Math.round((hash(i,40)*W+sec*(10+i*3))%W), y=Math.round(172+Math.sin(sec*2+i)*10+i*4), f=Math.floor(sec*8+i)%2; g.fillStyle=['#ffe066','#ff9fb2','#a8d8ff','#f4f1ea','#ffb060'][i]; g.fillRect(x-(f?2:1),y,f?2:1,2); g.fillRect(x+1,y,f?2:1,2); }   // bướm bay
}
let raf=0; function loop(t){ raf=requestAnimationFrame(loop); if($('#title').hidden) return; frame(t); }
raf=requestAnimationFrame(loop);
// mẹo chơi đổi mỗi 3,5 giây
const TIPS=['Giữ Shift khi đi xe máy để phóng nhanh, nhưng CSGT thấy là bắt, lại dễ xoè xe!','Mua mũ bảo hiểm ở tiệm thuê xe, không đội bị phạt 200.000đ.','Chuột phải để nhân vật tự đi tới. Chuột phải trên bản đồ lớn (M) cũng được.',
  'Siêu thị, tiệm net, cafe Đà Bắc giờ vào hẳn bên trong được.','Bấm U mở tủ đồ thay trang phục ở bất cứ đâu.','Level càng cao đi bộ, chạy càng nhanh.','Xe đạp công cộng ở trạm cạnh bến xe buýt, 5.000đ/30 phút.',
  'Đua ngựa ở Đà Lạt: chỉ toàn bot thì bấm bắt đầu luôn khỏi đợi.','Vườn quốc gia Đà Bắc có 10 trạm quan sát thú, xem đủ tăng hiểu biết.','Đi học ở DAS Sài Gòn để xin việc Everfit lương cao hơn.'];
let ti=Math.floor(Math.random()*TIPS.length); const tip=$('#titleTip'); const showTip=()=>{ tip.classList.remove('in'); void tip.offsetWidth; tip.textContent='Mẹo: '+TIPS[ti%TIPS.length]; tip.classList.add('in'); ti++; };
showTip(); setInterval(()=>{ if(!$('#title').hidden) showTip(); },3500);
})();
