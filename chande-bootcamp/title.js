/* Chan City — màn hình chờ: cảnh hồ Hoà Bình vẽ pixel động (trời theo giờ Việt Nam, mây, núi, nước lấp lánh, đom đóm đêm),
   cả hội đứng trên bờ cỏ nhún nhảy, thanh tải + mẹo chơi đổi liên tục. Vẽ ở 320×180 rồi phóng to giữ nét pixel. */
(function(){
const $=s=>document.querySelector(s), W=320, H=180;
const bg=$('#titleBg'), g=bg.getContext('2d'); bg.width=W; bg.height=H; g.imageSmoothingEnabled=false;
const hash=(a,b)=>{ const s=Math.sin(a*127.1+b*311.7)*43758.5453; return s-Math.floor(s); };
const vnHour=()=>{ const d=new Date(Date.now()+7*3600e3); return d.getUTCHours()+d.getUTCMinutes()/60; };
// bảng màu trời theo giờ: [đỉnh, chân trời, núi xa, núi gần, nước]
const SKY=[[0,['#0b1030','#2a2450','#1e2848','#152038','#142a4a']],[5,['#2a2a5a','#e08a6a','#4a4a6a','#2e3a4e','#3a4a7a']],[7,['#5aa0e0','#f4d8a0','#6a8aa8','#4a6a5a','#3b8ed3']],
  [12,['#3a8ae0','#b8e0f8','#7a9ab8','#4f7a5a','#3b8ed3']],[17,['#4a70c0','#f4b070','#7a7a9a','#4a5a4a','#4a7ab0']],[18.6,['#3a3a7a','#e8705a','#5a4a6a','#3a3a48','#3a4a7a']],[20,['#0b1030','#2a2450','#1e2848','#152038','#142a4a']],[24,['#0b1030','#2a2450','#1e2848','#152038','#142a4a']]];
const mix=(a,b,k)=>{ const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)), A=p(a), B=p(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join(''); };
function palette(h){ for(let i=0;i<SKY.length-1;i++){ const [h0,c0]=SKY[i], [h1,c1]=SKY[i+1]; if(h>=h0&&h<h1){ const k=(h-h0)/(h1-h0); return c0.map((c,j)=>mix(c,c1[j],k)); } } return SKY[0][1]; }
// cả hội (ảnh nhân vật 32×48)
const CAST=['men_men/men_men','phap/phap_xanh','phu_le/phu_le','don_che/don_che','kha_banh/kha_banh','kenny_ho/kenny_ho','huy_phan/huy_phan'].map(p=>{ const img=new Image(); img.src='../pixel-sprite-forge/characters/'+p+'.png'; return img; });
const clouds=[...Array(6)].map((_,i)=>({x:hash(i,1)*W,y:8+hash(i,2)*40,w:18+hash(i,3)*30,s:2+hash(i,4)*4}));
const bugs=[...Array(26)].map((_,i)=>({x:hash(i,5)*W,y:96+hash(i,6)*70,p:hash(i,7)*6}));
function ridge(y0,amp,f,ph,col){ g.fillStyle=col; for(let x=0;x<W;x++){ const y=Math.round(y0-amp*(.6*Math.sin(x*f+ph)+.4*Math.sin(x*f*2.3+ph*1.7))); g.fillRect(x,y,1,H-y); } }
function tree(x,y,s,col){ g.fillStyle='#3a2a20'; g.fillRect(x,y-4*s,s,4*s); g.fillStyle=col; for(let k=0;k<3;k++) g.fillRect(x-(3-k)*s,y-(5+k*2)*s,(7-k*2)*s,3*s); }
function frame(t){ const h=vnHour(), [top,hor,far,near,water]=palette(h), night=h<5.2||h>19.6, sec=t/1000;
  const gr=g.createLinearGradient(0,0,0,100); gr.addColorStop(0,top); gr.addColorStop(1,hor); g.fillStyle=gr; g.fillRect(0,0,W,100);
  if(night) for(let i=0;i<60;i++){ if(hash(i,9)>.5+.4*Math.sin(sec*2+i)) continue; g.fillStyle='#e8e8ff'; g.fillRect(hash(i,10)*W|0,hash(i,11)*70|0,1,1); }
  // mặt trời / trăng đi theo giờ
  const k=((h-6+24)%24)/12, sx=Math.round(20+k*(W-40)), sy=Math.round(78-Math.sin(Math.min(1,Math.max(0,k))*Math.PI)*58);
  if(!night&&k<=1){ g.fillStyle='#ffe9a0'; g.beginPath(); g.arc(sx,sy,8,0,7); g.fill(); g.fillStyle='rgba(255,240,180,.25)'; g.beginPath(); g.arc(sx,sy,13,0,7); g.fill(); }
  else { const mk=((h-18+24)%24)/12, mx=Math.round(20+mk*(W-40)), my=Math.round(78-Math.sin(Math.min(1,mk)*Math.PI)*58); g.fillStyle='#f4f1dc'; g.beginPath(); g.arc(mx,my,6,0,7); g.fill(); g.fillStyle=top; g.beginPath(); g.arc(mx+3,my-2,5,0,7); g.fill(); }
  for(const c of clouds){ c.x=(c.x+c.s*.016*(night?.5:1))%(W+60); const x=Math.round(c.x-30), y=Math.round(c.y); g.fillStyle=night?'rgba(120,130,170,.35)':'rgba(255,255,255,.82)';
    g.fillRect(x,y,c.w,5); g.fillRect(x+4,y-3,c.w-10,3); g.fillRect(x+c.w*.3|0,y-6,c.w*.35|0,3); }
  ridge(84,14,.021,1.2,far); ridge(94,10,.034,4.1,near);
  // hồ: dải nước + vệt sáng lấp lánh + thuyền nhỏ trôi
  g.fillStyle=water; g.fillRect(0,98,W,34); g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(0,98,W,2);
  for(let i=0;i<40;i++){ const x=(hash(i,12)*W+sec*(6+hash(i,13)*8))%W, y=101+hash(i,14)*28; if(Math.sin(sec*3+i)>.2){ g.fillStyle=night?'rgba(200,210,255,.35)':'rgba(255,255,255,.55)'; g.fillRect(x|0,y|0,3+(i%3),1); } }
  const bx=Math.round((sec*7)%(W+40))-20; g.fillStyle='#5a3a22'; g.fillRect(bx,114,16,3); g.fillRect(bx+2,117,12,1); g.fillStyle='#e8d8b4'; g.fillRect(bx+7,106,1,8); g.fillRect(bx+8,107,5,5);
  // nhà sàn bên kia hồ + đèn lồng khi tối
  for(const [x,y] of [[34,97],[210,96],[262,98]]){ g.fillStyle='#3a2a20'; g.fillRect(x,y-6,16,6); g.fillRect(x+2,y,1,3); g.fillRect(x+13,y,1,3); g.fillStyle='#8a6a3a'; g.fillRect(x-2,y-9,20,3); g.fillRect(x+2,y-11,12,2);
    if(night||h>17.5){ g.fillStyle='#ffd86b'; g.fillRect(x+6,y-4,2,2); } }
  // bờ cỏ phía trước + cây
  g.fillStyle='#3f7a31'; g.fillRect(0,132,W,H-132); g.fillStyle='#4f9238'; for(let x=0;x<W;x+=2) g.fillRect(x,131+Math.round(Math.sin(x*.4)*1),2,3);
  g.fillStyle='#d6c39b'; g.fillRect(0,150,W,10); g.fillStyle='#c4b089'; for(let x=0;x<W;x+=9) g.fillRect(x+(x%5),153,3,1);
  for(const [x,s] of [[10,3],[300,3],[58,2],[262,2]]) tree(x,132,s,night?'#1f4a2a':'#2f6a2a');
  for(let i=0;i<14;i++){ const x=hash(i,15)*W|0; g.fillStyle=['#ff9fb2','#ffe066','#f4f1ea'][i%3]; g.fillRect(x,140+(hash(i,16)*8|0),1,1); }
  // cả hội đứng trên đường đất, nhún theo nhịp
  CAST.forEach((img,i)=>{ if(!img.complete||!img.naturalWidth) return; const x=Math.round(W/2-(CAST.length*28)/2+i*28), bob=Math.round(Math.max(0,Math.sin(sec*4+i*.9))*2);
    g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x+9,157,14,2); g.drawImage(img,0,0,32,48,x,110-bob,32,48); });
  if(night) for(const b of bugs){ const a=.5+.5*Math.sin(sec*2.2+b.p); g.fillStyle=`rgba(220,255,120,${a.toFixed(2)})`; g.fillRect(Math.round(b.x+Math.sin(sec*.7+b.p)*6),Math.round(b.y+Math.cos(sec*.9+b.p)*4),1,1); }
  else for(let i=0;i<6;i++){ const x=(hash(i,17)*W+sec*14)%W, y=(sec*10+hash(i,18)*H)%60+90; g.fillStyle='#e8c860'; g.fillRect(x|0,y|0,2,1); }   // lá bay
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
