/* Chan City — cổng dịch chuyển MU (data.js MU.portals): vòm đá phát sáng ở lối qua tường Nam (front), 2 trụ đá pha lê + màn sáng ở lối tường dọc (side),
   bệ đá phát sáng giữa mỗi khu quái rừng (pad). Đứng gần bấm E: bảng chọn nơi tới, dịch chuyển tức thì (server muwest.js op 'warp'). */
(function(){
const A=ART, T=A.T, SD=SHARED, M=SD.MU, X=MAPX, esc=s=>GAME.esc(String(s)), K='#1c1516', CR={};
const hx=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)), rgba=(c,a)=>`rgba(${hx(c).join(',')},${a})`, lite=(c,k)=>'#'+hx(c).map(v=>Math.round(v+(255-v)*k).toString(16).padStart(2,'0')).join('');
const STONE=['#5a5462','#77707f','#9a93a2','#3c3844'];
// khối đá xếp có viền sáng / tối
const stone=(P,x,y,w,h)=>{ P.rect(x,y,w,h,STONE[1]); for(let yy=y;yy<y+h;yy+=6){ P.rect(x,yy,w,1,STONE[0]); const o=((yy-y)/6)%2?4:0; for(let xx=x+o;xx<x+w;xx+=8) P.rect(xx,yy,1,6,STONE[0]); }
  P.rect(x,y,w,1,STONE[2]); P.rect(x,y,1,h,STONE[2]); P.rect(x+w-1,y,1,h,STONE[3]); P.rect(x,y+h-1,w,1,STONE[3]); };
// màn xoáy sáng: các vòng elip lệch pha theo khung
function swirl(g,cx,cy,rx,ry,col,f){ g.save(); g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); g.clip();
  const gr=g.createRadialGradient(cx,cy,1,cx,cy,Math.max(rx,ry)); gr.addColorStop(0,rgba(lite(col,.7),.85)); gr.addColorStop(.6,rgba(col,.55)); gr.addColorStop(1,rgba(col,.2)); g.fillStyle=gr; g.fillRect(cx-rx,cy-ry,rx*2,ry*2);
  for(let i=0;i<4;i++){ const k=((i+f/4)%4)/4; g.strokeStyle=rgba(i%2?'#ffffff':lite(col,.5),.55*(1-k)); g.lineWidth=1; g.beginPath(); g.ellipse(cx,cy,rx*(.25+k*.8),ry*(.25+k*.8),f*.4+i,0,Math.PI*2); g.stroke(); }
  g.restore(); }
// vòm chính diện: rộng span + 2 ô (2 trụ đứng trên tường 2 bên lối), cao 5 ô, dầm đá có biển tên
const front=(q,f)=>{ const w=(q.span+2)*T, h=5*T; return A.sprite(w,h,w/2,h-1,(g,P)=>{
  swirl(g,w/2,h*.62,(q.span*T)/2,h*.36,q.col,f);
  stone(P,0,14,16,h-14); stone(P,w-16,14,16,h-14); P.rect(0,h-6,18,6,STONE[3]); P.rect(w-18,h-6,18,6,STONE[3]);   /* 2 trụ + chân trụ */
  stone(P,-2,4,w+4,14); P.rect(2,2,w-4,3,STONE[2]);   /* dầm trên */
  for(let i=0;i<3;i++){ const on=(f+i)%4<2; for(const x of [6,w-10]) P.rect(x,24+i*14,4,6,on?q.col:lite(q.col,.2)); }   /* đá phù văn sáng trên trụ */
  if(q.sign){ const tw=A.textW(q.sign); P.rect(w/2-tw/2-4,6,tw+8,10,K); P.rect(w/2-tw/2-3,7,tw+6,8,'#2a2026'); A.drawText(g,q.sign,Math.round(w/2-tw/2),8,q.col); }
  P.disc(w/2,4,3,q.col); P.px(w/2,3,'#ffffff'); }); };   /* viên pha lê giữa dầm */
// trụ đá pha lê đứng trên tường dọc (2 đầu lối)
const obel=(q,f)=>A.sprite(16,44,8,43,(g,P)=>{ stone(P,3,14,10,30); P.rect(1,38,14,6,STONE[3]); P.rect(2,12,12,3,STONE[2]);
  const on=f%2; P.rect(6,0,4,12,q.col); P.rect(5,3,6,6,q.col); P.rect(7,1,1,9,'#ffffff'); if(on){ P.px(4,2,lite(q.col,.6)); P.px(11,8,lite(q.col,.6)); }
  for(let i=0;i<2;i++) P.rect(7,20+i*10,2,4,(f+i)%2?q.col:lite(q.col,.25)); });
// màn sáng nằm ngang trên lối tường dọc (2 ô tường × span ô)
const strip=(q,f)=>{ const w=2*T, h=q.span*T; return A.sprite(w,h,w/2,h,(g)=>{ const gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,rgba(q.col,.05)); gr.addColorStop(.5,rgba(lite(q.col,.5),.55)); gr.addColorStop(1,rgba(q.col,.05)); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.fillStyle=rgba('#ffffff',.6); for(let i=0;i<6;i++){ const y=((i*13+f*5)%h); g.fillRect(4+((i*7)%(w-8)),h-y,2,2); } },false); };
// bệ dịch chuyển trong khu quái: vòng phù văn sáng + viên pha lê lơ lửng
const pad=(q,f)=>A.sprite(48,40,24,34,(g,P)=>{ g.fillStyle=rgba('#000000',.25); g.beginPath(); g.ellipse(24,32,22,7,0,0,Math.PI*2); g.fill();
  P.rect(4,28,40,6,STONE[0]); P.rect(6,27,36,2,STONE[2]); swirl(g,24,30,18,5,q.col,f);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+f*.2; P.px(24+Math.cos(a)*17,30+Math.sin(a)*5,(i+f)%2?'#ffffff':q.col); }
  const fy=12+[0,-1,-2,-1][f%4]; P.rect(21,fy,6,10,q.col); P.rect(23,fy-3,2,16,q.col); P.rect(23,fy,1,8,'#ffffff'); g.fillStyle=rgba(q.col,.25); g.beginPath(); g.ellipse(24,fy+5,9,9,0,0,Math.PI*2); g.fill(); });
const SPR={front,obel,strip,pad};
const spr=(o,f)=>CR[o.pq.id+o.part+f]||(CR[o.pq.id+o.part+f]=SPR[o.part](o.pq,f));
// đặt 1 cổng q lên map r (toạ độ của q); north.js dùng lại cho cổng Đỉnh Bắc
function addPortal(r,q){ const add=(part,x,y,o={})=>{ r.obj.push({spr:SPR[part](q,0),x:Math.round(x*T),y:Math.round(y*T),anim:'portal',pq:q,part,...o}); };
  if(q.kind==='front') add('front',q.x,q.y);
  else if(q.kind==='side'){ const y0=q.y-q.span/2; add('strip',q.x,y0+q.span,{sort:(y0-1)*T}); add('obel',q.x,y0); add('obel',q.x,y0+q.span+1); if(q.sign) r.obj.push({spr:A.label(q.sign,'#2a2026',q.col),x:Math.round(q.x*T),y:Math.round((y0-2.9)*T),flat:true}); }   /* biển tên nơi tới trên trụ */
  else add('pad',q.x,q.y+.4,{sort:(q.y-1)*T}); }
WORLD.addPortal=addPortal;
// gắn vào map MU sau khi world8 ghép vùng phía Tây, bằng toạ độ trước khi mở rộng lên Bắc (north.js dời cả khối sau)
const mw=WORLD.muWest; WORLD.muWest=m=>{ const r=mw(m); for(const q of (M.preOY||M).portals) addPortal(r,q); return r; };
const a0=X.anim; X.anim=(o,clock)=>{ if(o.anim==='portal') return spr(o,Math.floor(clock*6)%4); return a0?a0(o,clock):null; };
// bấm E ở gần cổng
const spot=q=>[q.x*T,(q.kind==='front'?q.y-1:q.y)*T];
const here=()=>GAME.S&&GAME.S.kind==='mu';
const atNow=()=>{ const P=GAME.P; return M.portals.find(q=>{ const [x,y]=spot(q); return Math.hypot(P.x-x,P.y-y)<=M.portalR*T; }); };
const c0=X.consider; X.consider=(consider,dist)=>{ c0(consider,dist); if(!here()) return; for(const q of M.portals){ const [x,y]=spot(q), d=dist(x,y); if(d<M.portalR*T) consider(d*.5+2,{type:'mapx',k:'portal',id:q.id,label:'🌀 Cổng dịch chuyển · '+q.name.split(' · ')[0]}); } };
const p0=X.pick; X.pick=async x=>{ if(x.k!=='portal') return p0(x); menu(); };
function menu(){ const cur=atNow(); if(!cur) return; const lv=(window.MU8&&window.MU8.me&&window.MU8.me.lv)||0;
  UI.open('🌀 Cổng dịch chuyển',()=>{ const row=q=>`<div class="row"><span style="color:${q.col}">●</span><span><b>${esc(q.name)}</b>${q.lv&&lv&&lv<q.lv?` <small class="bad">quái cấp ${q.lv}, bạn cấp ${lv}</small>`:''}</span>${q.id===cur.id?'<small class="muted">đang ở đây</small>':UI.btn('pwarp','Đi',{to:q.id},'pri')}</div>`;
    return `<p class="muted">Bước vào cổng là tới ngay, không tốn tiền. Cổng tím trong rừng đặt giữa mỗi khu quái.</p><h5>Lối trong thành</h5><div class="list">${M.portals.filter(q=>q.kind!=='pad'&&!q.north).map(row).join('')}</div>
      <h5>Bệ dịch chuyển rừng quái</h5><div class="list">${M.portals.filter(q=>q.kind==='pad'&&!q.north).map(row).join('')}</div>
      <h5>Đỉnh Bắc · 3 đấu trường boss</h5><div class="list">${M.portals.filter(q=>q.north).map(row).join('')}</div>`; },{wide:true}); }
UI.onAct('pwarp',async d=>{ const r=await GAME.act({t:'muw',op:'warp',to:d.to}); if(r&&!r.err){ UI.closeAll(); GAME.sfx('poof',.5); } });
// tự đi xa trong MU (nút ➜, Auto, bấm chuột phải): nếu đi bộ tới cổng gần mình + dịch chuyển tới cổng gần đích ngắn hơn hẳn thì đi đường cổng
const useAt=q=>[q.x,q.kind==='front'?q.y-.6:q.kind==='side'?q.y:q.y+.9], landAt=q=>q.kind==='front'?[q.x,q.y-1.6]:q.kind==='side'?[q.x-1.6,q.y]:[q.x,q.y+1.2];   /* đứng dùng cổng · chỗ đáp khi tới (server muwest.js) */
window.MUPORTAL={route(tx,ty,label,then){ if(!here()) return false; const P=GAME.P, px=P.x/T, py=P.y/T, D=Math.hypot(tx-px,ty-py), ME=M.west.meme, inMeme=(x,y)=>x>=ME.x0&&x<=ME.x1&&y>=ME.y0&&y<=ME.y1; if(D<40||inMeme(px,py)||inMeme(tx,ty)) return false;
  let best=null; for(const a of M.portals) for(const b of M.portals){ if(a===b) continue; const [ax,ay]=useAt(a), [bx,by]=landAt(b), cost=Math.hypot(ax-px,ay-py)+Math.hypot(tx-bx,ty-by)+8; if(cost<D*.7&&(!best||cost<best.cost)) best={a,b,cost}; }
  if(!best) return false; const [ax,ay]=useAt(best.a);
  return GAME.walkTo(ax,ay,'Cổng dịch chuyển · '+best.a.name.split(' · ')[0],async()=>{ const r=await GAME.act({t:'muw',op:'warp',to:best.b.id}); if(r&&!r.err) GAME.sfx('poof',.4);
    setTimeout(()=>GAME.walkTo(tx,ty,label,then,{noPortal:true,quiet:true}),r&&!r.err?1200:250); },{noPortal:true,quiet:!label}); }};
// minimap: chấm tím ở mỗi cổng
const mi0=X.mini; X.mini=(dot,k)=>{ if(mi0) mi0(dot,k); if(k!=='mu') return; for(const q of M.portals) dot(q.x*T,(q.kind==='front'?q.y-1:q.y)*T,q.kind==='pad'?'#c8a0ff':'#7fe8ff',2); };
})();
