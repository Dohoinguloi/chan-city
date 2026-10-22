/* Chan City — giao diện toàn màn hình cho các trò ở Nhà giải trí và câu cá (theo ảnh mẫu người dùng gửi):
   cờ vua: khung gỗ cam, ô xám xanh / tím than, quân pixel, chấm xanh nước đi hợp lệ · poker: bàn nỉ xanh oval, ghế quanh bàn, lá bài + phỉnh pixel ·
   ma sói: cột trái (pha, vai, chat) + lưới thẻ người chơi trên nền rừng đêm. File này chỉ dựng HTML/vẽ, nút bấm dùng data-a của ui.js. */
(function(){
const A=ART, SD=SHARED, fmt=SD.fmt, esc=s=>GAME.esc(String(s)), OUT='#1c1516';
const btn=(a,label,data={},cls='')=>`<button class="btn sm ${cls}" data-a="${a}" ${Object.entries(data).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const cv=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
const URLS={}; const once=(k,f)=>URLS[k]||(URLS[k]=f());
const up=(c,s)=>{ const o=cv(c.width*s,c.height*s), g=o.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,o.width,o.height); return o; };
const mask=(g,M,x0,y0,col,s=1)=>{ g.fillStyle=col; M.forEach((r,y)=>[...r].forEach((ch,x)=>{ if(ch==='X') g.fillRect(x0+x*s,y0+y*s,s,s); })); };
const clock=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };

/* ---------- chân dung người chơi / bot theo tên ---------- */
const BOT_HAIR={nam:['buzz','fade','messy','swept'],nu:['ponytail','long','bowl','bun']};
function botLook(name){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; const g=h%2?'nu':'nam', p=a=>a[(h>>>3)%a.length];
  return {gender:g,hair:p(BOT_HAIR[g]),hairColor:p(['211c21','6b4128','3a2f37','8a5a36']),skin:p(['f3b194','d99a78','f8cdb0','e8b090']),outfit:{top:p(['tee_do','tee_xanh','somi_caro','tee_hong','khoac_jean','tee_den']),bottom:p(['jean','kaki','short_xam']),shoes:'giay_den'}}; }
function portraitURL(name){ const me=GAME.G&&GAME.G.name===name; if(!me&&URLS['pt:'+name]) return URLS['pt:'+name];
  let av=me?null:GAME.remoteAv(name), pc=null;
  if(me) pc=GAME.portrait('me'); else if(/Lê Quang Liêm/.test(name)) pc=GAME.portrait('botco'); else if(/Tú Sena/.test(name)) pc=GAME.portrait('botpoker');
  else pc=(av||AVATAR.build(botLook(name))).portrait;
  const url=pc?pc.toDataURL():''; if(!me&&!av) URLS['pt:'+name]=url; return url; }
const face=(name,cls='')=>`<img class="pface ${cls}" src="${portraitURL(name)}" alt="">`;

/* ---------- lá bài + phỉnh (pixel) ---------- */
const SUITS={h:['.XX.XX.','XXXXXXX','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'],d:['...X...','..XXX..','.XXXXX.','XXXXXXX','.XXXXX.','..XXX..','...X...'],
  c:['..XXX..','..XXX..','XX.X.XX','XXXXXXX','XX.X.XX','...X...','..XXX..'],s:['...X...','..XXX..','.XXXXX.','XXXXXXX','XXXXXXX','...X...','..XXX..']};
function cardURL(c){ return once('card:'+c,()=>{ const W=22, H=30, k=cv(W,H), g=k.getContext('2d');
  g.fillStyle=OUT; g.fillRect(1,0,W-2,H); g.fillRect(0,1,W,H-2); g.fillStyle='#e8a0a8'; g.fillRect(1,1,W-2,H-2);
  if(c==='??'){ g.fillStyle='#d84050'; g.fillRect(3,3,W-6,H-6); g.fillStyle='#f08090'; for(let y=3;y<H-3;y+=2) for(let x=3+(y/2%2);x<W-3;x+=2) g.fillRect(x,y,1,1); return up(k,3).toDataURL(); }
  g.fillStyle='#fbf6f0'; g.fillRect(2,2,W-4,H-4); const red='hd'.includes(c[1]), col=red?'#e04848':'#2a2438', r=c[0]==='T'?'10':c[0];
  A.drawText(g,r,3,3,col); mask(g,SUITS[c[1]],4,10,col,2); A.drawText(g,r,W-3-A.textW(r),H-8,col); return up(k,3).toDataURL(); }); }
const card=(c,cls='')=>`<img class="pcard ${cls}" src="${cardURL(c)}" alt="${c==='??'?'bài úp':c}">`;
const CHIP_COL=[['#f4f1ea','#c4382e'],['#d84050','#f4f1ea'],['#3a74d0','#f4f1ea'],['#3f9a4a','#f4f1ea'],['#3a3448','#c8c0e0']];
function chipsURL(v){ const tier=v>=500000?4:v>=200000?3:v>=50000?2:v>=10000?1:0, n=Math.max(1,Math.min(6,Math.ceil(Math.log10(Math.max(10,v/1000))*2)));
  return once('chip:'+tier+':'+n,()=>{ const k=cv(14,6+n*2+2), g=k.getContext('2d'), [a,b]=CHIP_COL[tier];
    for(let i=0;i<n;i++){ const y=k.height-6-i*2; g.fillStyle=OUT; g.fillRect(1,y,12,5); g.fillRect(0,y+1,14,3); g.fillStyle=a; g.fillRect(1,y+1,12,3); g.fillStyle=b; g.fillRect(3,y+1,2,3); g.fillRect(9,y+1,2,3); }
    return up(k,3).toDataURL(); }); }

/* ---------- cờ vua ---------- */
// quân cờ 16×18 dáng Staunton: vua có thánh giá, hậu vương miện 5 chấu, xe tháp, tượng mũ có khe, mã đầu ngựa, tốt đầu tròn
const BASE=['4-11A','3-12B','4-11A','2-13A','2-13A','1-14B'];
const PIECES={k:['7-8A','6-9A','7-8A','4-11A','3-12A','3-12A','4-11A','5-10B','6-9A','6-9A','5-10A','5-10A',...BASE],
  q:['2A 7-8A 13A','2A 4A 7-8A 11A 13A','2-5A 7-8A 10-13A','2-13A','3-12A','4-11A','5-10B','6-9A','6-9A','5-10A','5-10A','4-11A',...BASE],
  r:['','3-4A 7-8A 11-12A','3-4A 7-8A 11-12A','3-12A','3-12A','4-11B','5-10A','5-10A','5-10A','5-10A','5-10A','5-10A',...BASE],
  b:['7-8A','6-9A','5-10A','5-7A 8E 9-10A','4-6A 7E 8-11A','4-11A','5-10A','6-9B','6-9A','6-9A','5-10A','5-10A',...BASE],
  n:['7-8A','6-10A','5-11A','4-6A 7E 8-12A','3-12A','2-12A','1-5A 7-12A','1-3A 7-12A','7-12A','6-12A','5-12A','5-11A',...BASE],
  p:['','','','','6-9A','5-10A','5-10A','6-9A','5-10B','6-9A','6-9A','5-10A',...BASE]};
const PCOL={w:{A:'#f4f6f6',B:'#b4bec2',H:'#ffffff',E:'#3a3040'},b:{A:'#3a3040',B:'#221c28',H:'#6e5e78',E:'#d8ccc0'}};
function pieceCanvas(p){ return once('pc2:'+p,()=>{ const w=p===p.toUpperCase()?'w':'b', C=PCOL[w], k=cv(18,20), g=k.getContext('2d'), P=A.painter(g), R=PIECES[p.toLowerCase()];
  A.gridRows(P,R,C,1,1);
  R.forEach((r,y)=>{ if(y>=R.length-6||!r) return; const m=/^(\d+)-(\d+)A/.exec(r.split(' ')[0]); if(m&&+m[2]-+m[1]>=3){ g.fillStyle=C.H; g.fillRect(2+ +m[1],1+y,1,1); } });   // viền sáng bên trái cho nổi khối
  A.outline(k); return k; }); }
const FR=14, SQ=22, BW=SQ*8+FR*2, START=CHESS.newGame().b;   // chưa vào ván vẫn bày quân sẵn                                            // khung 14px + 8 ô 22px
function drawBoard(c,v,sel,legal,drag){ if(!c||!v) return; c.width=BW; c.height=BW; const g=c.getContext('2d');
  const avail=Math.min(innerHeight-196,innerWidth>800?innerWidth-400:innerWidth-30), sc=avail>=BW?Math.floor(avail/BW*2)/2*BW:Math.max(140,avail); c.style.width=c.style.height=sc+'px';   /* vuông, phóng nguyên lần cho nét */
  g.imageSmoothingEnabled=false; const flip=v.me===1;
  g.fillStyle='#946a64'; g.fillRect(0,0,BW,BW); g.fillStyle='#5e5266'; g.fillRect(3,3,BW-6,BW-6); g.fillStyle='#e48c4a'; g.fillRect(5,5,BW-10,BW-10); g.fillStyle='#d0663a'; g.fillRect(FR-1,FR-1,SQ*8+2,SQ*8+2);
  for(let i=0;i<8;i++){ const f=flip?7-i:i, r=flip?i:7-i; A.drawText(g,'ABCDEFGH'[f],FR+i*SQ+10,BW-FR+4,'#b04e2a'); A.drawText(g,String(r+1),5,FR+i*SQ+9,'#b04e2a'); }
  for(let i=0;i<64;i++){ const r=i>>3, f=i&7, X=FR+(flip?7-f:f)*SQ, Y=FR+(flip?7-r:r)*SQ; g.fillStyle=(r+f)%2?'#c8dcd2':'#5e5266'; g.fillRect(X,Y,SQ,SQ);
    if(v.last&&(v.last.from===i||v.last.to===i)){ g.fillStyle='rgba(255,216,74,.45)'; g.fillRect(X,Y,SQ,SQ); }
    if(i===sel){ g.fillStyle='rgba(127,224,255,.55)'; g.fillRect(X,Y,SQ,SQ); }
    const p=(v.b||START)[i];
    if(v.check&&p&&p===(v.turn==='w'?'K':'k')){ g.fillStyle='#e04040'; g.fillRect(X,Y,SQ,SQ); g.fillStyle='#b02a2a'; g.fillRect(X,Y+SQ-2,SQ,2); }
    if(p&&!(drag&&drag.i===i)) g.drawImage(pieceCanvas(p),X+2,Y+1);
    if(legal.includes(i)){ g.fillStyle=OUT; g.fillRect(X+7,Y+8,8,6); g.fillRect(X+8,Y+7,6,8); g.fillStyle='#8edc6a'; g.fillRect(X+8,Y+8,6,6); g.fillStyle='#3fb070'; g.fillRect(X+8,Y+13,6,1); } }
  if(drag&&v.b&&v.b[drag.i]){ const pc=pieceCanvas(v.b[drag.i]); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(Math.round(drag.x)-7,Math.round(drag.y)+8,14,2); g.drawImage(pc,Math.round(drag.x)-9,Math.round(drag.y)-14); } }   // quân đang cầm theo chuột
// ô cờ dưới chuột (theo khung đã phóng to)
// toạ độ chuột theo khung bàn cờ gốc (BW×BW)
function boardXY(c,e){ const rc=c.getBoundingClientRect(); return [(e.clientX-rc.left)*BW/rc.width,(e.clientY-rc.top)*BW/rc.height]; }
// ô cờ dưới chuột: chỉ số 0 = a8 ở hàng trên cùng (giống lúc vẽ), cầm quân đen thì lật cả 2 chiều
function boardSquare(c,e,v){ const [bx,by]=boardXY(c,e), x=bx-FR, y=by-FR; if(x<0||y<0||x>=SQ*8||y>=SQ*8) return -1;
  let f=Math.floor(x/SQ), r=Math.floor(y/SQ); if(v.me===1){ f=7-f; r=7-r; } return r*8+f; }
function chessHtml(v){ const me=v.me, mc=me===0?'w':me===1?'b':null, top=me===1?0:1, bot=me===1?1:0;
  const res=v.result?(v.result.w<0?'HOÀ · '+esc(v.result.why):`${esc(v.seats[v.result.w]?v.seats[v.result.w].name:'?')} THẮNG · ${esc(v.result.why)}`):'';
  const banner=v.st==='wait'?'ĐỢI ĐỐI THỦ...':v.st==='end'?res:v.turn===mc?'TỚI LƯỢT BẠN':me<0?(v.turn==='w'?'TRẮNG ĐI':'ĐEN ĐI'):'ĐỐI THỦ ĐANG NGHĨ';
  const pcard=(i)=>{ const s=v.seats[i], act=v.st==='play'&&v.turn===(i===0?'w':'b'); return `<div class="cpl ${act?'act':''}">${s?face(s.name):'<span class="pface empty"></span>'}
    <div><b>${s?esc(s.name):'(trống)'}</b><small>${i===0?'quân trắng':'quân đen'}${i===me?' · bạn':''}</small></div><span class="cclock ${act?'on':''}">${clock(v.clock[i])}</span></div>`; };
  const mv=(v.moves||[]).map((m,i)=>`<div class="cmv ${i%2?'b':'w'}"><span>${Math.floor(i/2)+1}</span>${i%2?'♟':'♙'} ${esc(m)}</div>`).reverse().join('');
  return `<div class="fsg chessfs"><div class="cmain">${pcard(top)}<canvas id="board"></canvas>${pcard(bot)}</div>
    <aside class="cside2"><div class="cbanner ${v.turn===mc&&v.st==='play'?'mine':''}">${banner}${v.check&&v.st==='play'?' · CHIẾU!':''}</div><p>Cược <b>${fmt(v.bet)}</b> mỗi bên${v.watchers?' · '+v.watchers+' người xem':''}</p>
      <div class="cmoves">${mv||'<p class="muted">Chưa có nước nào</p>'}</div>
      ${v.draw>=0&&v.draw!==me&&v.st==='play'?'<p class="good">Đối thủ xin hoà · bấm Xin hoà để đồng ý</p>':''}
      <div class="col">${me>=0&&v.st==='wait'&&v.seats.filter(Boolean).length===1?btn('cmove','Chơi với Lê Quang Liêm (bot)',{op:'bot'},'pri'):''}${me>=0&&v.st==='play'?btn('cmove','Xin hoà',{op:'draw'})+btn('cmove','Xin thua',{op:'resign'}):''}${me>=0&&v.st==='end'?btn('cmove',v.rematch[me]?'Đã sẵn sàng':'Chơi ván mới',{op:'rematch'},'pri'):''}${btn('tleave','Rời bàn')}</div>
      <div class="tlog">${(v.log||[]).slice(-4).map(l=>`<div>${esc(l)}</div>`).join('')}</div></aside></div>`; }

/* ---------- poker ---------- */
// 6 ghế quanh bàn oval, ghế của mình luôn ở giữa cạnh dưới
const SEAT_POS=[[50,86],[10,66],[13,22],[50,10],[87,22],[90,66]];
// đồng hồ lượt dưới tên người đang tới lượt (xanh → vàng → đỏ), giống Poker Night trên Discord
function timer(v){ const tot=SD.CLUB.poker.turn*1000, k=Math.max(0,Math.min(1,v.left/tot)), col=k>.5?'#7de07a':k>.2?'#ffd84a':'#ff6a55';
  return `<div class="ptimer"><i style="width:${Math.round(k*100)}%;background:${col}"></i><span>${Math.ceil(v.left/1000)}s</span></div>`; }
// dải vòng chơi: Preflop → Flop → Turn → River → Lật bài
function stages(v){ const n=v.board.length, cur=v.st!=='play'&&n===5?4:n>=5?3:n===4?2:n===3?1:0, L=['Preflop','Flop','Turn','River','Lật bài'];
  return `<div class="pstages">${L.map((l,i)=>`<span class="${i<cur?'done':i===cur&&(v.st==='play'||i===4)?'cur':''}">${l}</span>`).join('<b></b>')}</div>`; }
function pokerHtml(v){ const me=v.me, s=v.seats[me], myTurn=v.st==='play'&&v.toAct===me, need=s?v.cur-s.bet:0, n=v.seats.length, base=me>=0?me:0;
  const seat=(x,i)=>{ const [L,T]=SEAT_POS[(i-base+n)%n]; if(!x) return `<div class="pseat empty" style="left:${L}%;top:${T}%"><span class="pname">trống</span></div>`;
    const mine=i===me, cards=(x.cards||[]).map(c=>card(c,mine?'':'sm')).join('');
    return `<div class="pseat ${i===v.toAct&&v.st==='play'?'act':''} ${x.fold?'fold':''} ${mine?'mine':''} ${T<50?'top':''}" style="left:${L}%;top:${T}%">
      <div class="pcards">${mine?'':cards}</div>${face(x.name,'round')}<div class="pname"><b>${esc(x.name)}</b>${fmt(x.chips)}</div>
      ${i===v.dealer?'<span class="pdeal">D</span>':''}${x.allin?'<span class="pbadge">ALL-IN</span>':x.fold?'<span class="pbadge">BỎ</span>':''}${x.hand?`<em class="phand">${esc(x.hand)}</em>`:''}
      ${i===v.toAct&&v.st==='play'?timer(v):''}${x.bet?`<span class="pbet"><img src="${chipsURL(x.bet)}" alt="">${fmt(x.bet)}</span>`:''}</div>`; };
  return `<div class="fsg pokerfs"><div class="ptop">${btn('tleave','⟵ Rời bàn (đổi chip ra tiền)')}${s&&v.st!=='play'&&v.seats.filter(Boolean).length<SD.CLUB.poker.seats?btn('pk','Thêm bot vào bàn',{op:'bots'}):''}${s&&s.chips<v.blinds[1]&&v.st!=='play'?btn('pk','Mua thêm 200.000đ chip',{op:'rebuy'}):''}
      <span class="pinfo">Mù ${fmt(v.blinds[0])}/${fmt(v.blinds[1])}${v.st==='play'?' · lượt còn '+Math.ceil(v.left/1000)+'s':v.st==='wait'?' · đợi đủ 2 người':''}</span></div>
    ${v.st!=='wait'?stages(v):'<div class="pstages"></div>'}<div class="ptable"><div class="pfelt"><div class="pboard">${v.board.map(c=>card(c)).join('')||'<span class="pwait">Chưa lật bài</span>'}</div>
      <div class="ppot">${v.pot?`<img src="${chipsURL(v.pot)}" alt="">`:''}Pot: <b>${fmt(v.pot)}</b></div></div>${v.seats.map(seat).join('')}</div>
    <div class="pbar"><div class="pmine">${s?(s.cards||[]).map(c=>card(c,'big')).join(''):''}${s&&s.hand?`<em>${esc(s.hand)}</em>`:''}</div>
      ${myTurn?`<div class="pact">${btn('pk','Bỏ bài',{op:'fold'})}${need>0?btn('pk','Theo '+fmt(Math.min(need,s.chips)),{op:'call'},'pri'):btn('pk','Xem bài',{op:'check'},'pri')}
        <label class="praise">Tố lên <b id="raiseLbl">${fmt(v.cur+v.minRaise)}</b><input id="raiseTo" type="range" step="5000" min="${v.cur+v.minRaise}" max="${Math.max(v.cur+v.minRaise,s.chips+s.bet)}" value="${v.cur+v.minRaise}" aria-label="Tố lên"></label>${btn('pk','Tố',{op:'raise'})}${btn('pk','All-in',{op:'allin'},'bad')}</div>`:`<div class="pact muted">${v.st==='play'?'Đợi lượt...':''}</div>`}
      <div class="tlog ptl">${(v.log||[]).slice(-6).map(l=>`<div>${esc(l)}</div>`).join('')}</div></div></div>`; }

/* ---------- ma sói ---------- */
const ROLE_INFO={soi:['Sói','Đêm cắn 1 người, ngày giả làm dân'],dan:['Dân làng','Tìm ra sói, treo cổ chúng'],tientri:['Tiên tri','Mỗi đêm soi 1 người xem có phải sói'],baove:['Bảo vệ','Mỗi đêm che chắn 1 người khỏi bị cắn']};
const ROLE_ICON={soi:['..X...X.','.XXX.XXX','.XXXXXXX','XX.XX.XX','XXXXXXXX','.XXXXXX.','..X..X..','...XX...'],dan:['...XX...','..XXXX..','..XXXX..','...XX...','.XXXXXX.','XXXXXXXX','XXXXXXXX','.XX..XX.'],
  tientri:['........','..XXXX..','.X....X.','X..XX..X','X.XXXX.X','X..XX..X','.X....X.','..XXXX..'],baove:['XXXXXXXX','XXXXXXXX','XX.XX.XX','XXXXXXXX','.XXXXXX.','.XXXXXX.','..XXXX..','...XX...']};
const ROLE_COL={soi:'#e04848',dan:'#e8c070',tientri:'#a882ff',baove:'#5ab0f0'};
const roleIcon=r=>once('ri:'+r,()=>{ const k=cv(10,10), g=k.getContext('2d'); mask(g,ROLE_ICON[r]||ROLE_ICON.dan,1,1,ROLE_COL[r]||'#ccc'); A.outline(k); return up(k,3).toDataURL(); });
// nền thẻ: rặng thông + đồi, ban ngày trời xanh, ban đêm trời tối có trăng sao
const forestURL=night=>once('forest'+(night?'n':'d'),()=>{ const W=60, H=48, k=cv(W,H), g=k.getContext('2d'); g.fillStyle=night?'#1e2a48':'#6fa2c8'; g.fillRect(0,0,W,H); g.fillStyle=night?'#26355a':'#8cb8d8'; g.fillRect(0,0,W,10);
  if(night){ g.fillStyle='#f4f1ea'; for(let i=0;i<14;i++) g.fillRect((i*37)%W,(i*13)%22,1,1); g.fillStyle='#f6e8a8'; g.fillRect(46,4,5,5); g.fillStyle='#1e2a48'; g.fillRect(48,4,3,3); }
  else { g.fillStyle='#ffe066'; g.fillRect(47,4,5,5); g.fillStyle='#f4f1ea'; g.fillRect(6,6,9,2); g.fillRect(8,5,5,1); }
  for(let x=0;x<W;x+=7){ const h=10+(x*13)%9; g.fillStyle=night?'#14203a':'#3a5a70'; for(let y=0;y<h;y++){ const w=Math.max(1,Math.round(y*.55)); g.fillRect(x+3-w,H-14-h+y,w*2+1,1); } }
  g.fillStyle=night?'#23382e':'#4a6a58'; g.fillRect(0,H-14,W,14); g.fillStyle=night?'#2c4638':'#5a7c66'; for(let x=0;x<W;x++) g.fillRect(x,H-14-Math.round(Math.sin(x*.2)*2+2),1,3); return up(k,4).toDataURL(); });
// nền bàn ma sói theo pha: đêm trăng tròn sói tru trên vách đá, mắt sói trong rừng, làng sáng đèn, sương; ngày làng + giếng + lửa;
// bỏ phiếu trời đỏ có giá treo cổ, quạ; hết ván sói thắng trăng máu / dân thắng bình minh. Vẽ 320×180 rồi phóng ×4
const wolfSceneURL=ph=>once('ws:'+ph,()=>{ const W=320, H=180, k=cv(W,H), g=k.getContext('2d'), R=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(x,y,w,h); }, D=(x,y,r,c)=>{ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); };
  const h1=(a,b)=>{ const s=Math.sin(a*127.1+b*311.7)*43758.5453; return s-Math.floor(s); }, dark=ph==='night'||ph==='endsoi'||ph==='wait';
  const green=ph==='night'||ph==='wait';   // đêm tông xanh rêu như ảnh mẫu cắm trại
  const SK={night:['#0a241c','#1e5a44'],day:['#7aa8d4','#cfe0ee'],vote:['#3a0e1e','#e0603a'],endsoi:['#1a0408','#6a1418'],enddan:['#f0a050','#ffe8b0'],wait:['#0e2a20','#235442']}[ph]||['#0a241c','#1e5a44'];
  const gr=g.createLinearGradient(0,0,0,120); gr.addColorStop(0,SK[0]); gr.addColorStop(1,SK[1]); g.fillStyle=gr; g.fillRect(0,0,W,H);
  if(dark||ph==='vote') for(let i=0;i<70;i++) R(h1(i,1)*W|0,h1(i,2)*90|0,1,1,green?(i%4?'#5ad08a':'#a8f0c0'):i%5?'#e8e8ff':'#ffe8a0');
  if(green){ for(const [x,y] of [[30,20],[78,46],[140,14],[196,34],[300,24]]){ R(x-2,y,5,1,'#7de0a0'); R(x,y-2,1,5,'#7de0a0'); }   // sao chữ thập
    for(const [y,c,ph2] of [[58,'#1c4e3c',0],[66,'#22583f',2],[84,'#1a4a38',5],[92,'#215a44',1]]) for(let x=0;x<W;x+=4){ const w=Math.round(10+8*Math.sin(x*.035+ph2)); if(h1(x,y)<.75) R(x,y-(Math.sin(x*.05+ph2)*3|0),4,Math.max(2,w/4|0),c); } }   // mây xếp tầng
  // trăng / mặt trời
  if(ph==='night'||ph==='wait'){ D(250,42,26,'rgba(200,240,210,.1)'); D(250,42,20,'#e6f2d8'); for(const [x,y,r] of [[243,36,3],[256,48,4],[252,33,2],[240,50,2]]) D(x,y,r,'#d8d2b0'); }
  else if(ph==='endsoi'){ D(250,42,28,'rgba(200,30,30,.18)'); D(250,42,20,'#c4201a'); for(const [x,y,r] of [[243,36,3],[256,48,4]]) D(x,y,r,'#9a1410'); }
  else if(ph==='vote'){ D(70,96,26,'rgba(255,140,80,.3)'); D(70,96,18,'#ff8a4a'); }
  else if(ph==='enddan'){ D(160,104,30,'rgba(255,240,180,.35)'); D(160,104,20,'#fff0b0'); }
  else { D(262,30,10,'#fff3c0'); }
  // ban ngày (ảnh mẫu thung lũng): mây lớn sau rặng núi xanh 2 lớp có mặt sáng, rồi rừng thông
  if(ph==='day'||ph==='enddan'){ for(const [cx,cy,r] of [[30,52,18],[60,44,22],[96,52,16],[210,50,20],[246,40,24],[286,48,20],[316,56,14]]){ D(cx,cy,r,'#f4ecd8'); D(cx-3,cy-4,r-5,'#ffffff'); }
    const mt=(x,y0,a,f,p)=>Math.round(y0-a*(.6*Math.abs(Math.sin(x*f+p))+.4*Math.sin(x*f*2.7+p)));
    for(let x=0;x<W;x++){ const y=mt(x,92,34,.021,.6); R(x,y,1,100-y,'#6a86b0'); if(Math.sin(x*.021*2+.6)>.2) R(x,y,1,Math.max(2,(100-y)*.35|0),'#a8bcd8'); }
    for(let x=0;x<W;x++){ const y=mt(x,102,20,.033,2.2); R(x,y,1,110-y,'#5a7898'); if((x+y)%5<2) R(x,y+3,1,2,'#7a94b4'); } }
  // vách đá + sói tru in bóng trăng
  if(ph==='night'||ph==='endsoi'||ph==='wait'){ const rock=ph==='endsoi'?'#2a0a0c':'#0e1226'; g.fillStyle=rock; g.beginPath(); g.moveTo(206,92); g.lineTo(226,62); g.lineTo(262,58); g.lineTo(286,70); g.lineTo(300,92); g.fill();
    const wx=244, wy=58; R(wx,wy-8,16,7,rock); R(wx+12,wy-14,5,7,rock); R(wx+14,wy-19,3,6,rock); R(wx+16,wy-20,2,3,rock); R(wx+13,wy-17,1,2,rock); R(wx+1,wy-2,2,4,rock); R(wx+11,wy-2,2,4,rock); R(wx-4,wy-9,5,2,rock); R(wx-6,wy-11,3,2,rock); }   // sói ngửa cổ tru
  // rừng thông 2 lớp
  for(const [y0,col,step] of [[96,green?'#123a2c':dark?'#101a30':ph==='vote'?'#2a1420':'#3e6a54',9],[110,green?'#0c2a20':dark?'#0a1222':ph==='vote'?'#1e0e16':'#2c5040',7]]) for(let x=-4;x<W+8;x+=step){ const h=14+(h1(x,y0)*14|0); for(let y=0;y<h;y++){ const w=Math.max(1,Math.round(y*.5)); R(x-w,y0-h+y,w*2+1,1,col); if(!dark&&ph!=='vote'&&y%4===1&&w>1) R(x-w,y0-h+y,2,1,'#7a9a3a'); } R(x,y0,1,3,col); }   // thông có viền nắng vàng xanh
  if(dark) for(let i=0;i<7;i++){ const x=20+h1(i,7)*280|0, y=100+h1(i,8)*10|0; R(x,y,2,1,'#ff3a2a'); R(x+4,y,2,1,'#ff3a2a'); }   // mắt sói trong rừng
  // mặt đất làng + nhà mái lá, cửa sổ sáng đèn ban đêm
  R(0,112,W,H-112,green?'#16382a':dark?'#1c2418':ph==='vote'?'#2a1a14':'#5a7a3a'); for(let i=0;i<300;i++) R(h1(i,9)*W|0,114+(h1(i,10)*66|0),2+(i%3),1,green?(i%3?'#1e4a34':'#285c3c'):dark?'#28321e':'#6a8a44');   // cỏ có vệt
  for(const [x,w] of [[14,34],[60,26],[234,30],[276,36]]){ const y=124; R(x,y-14,w,14,dark?'#3a2a20':'#8a5d3b'); for(let k=0;k<6;k++) R(x-4+k,y-20-k,w+8-k*2,1,dark?'#4a3a22':'#c8a060'); R(x+w/2-3|0,y-9,6,9,'#2a1e16');
    R(x+4,y-11,5,4,dark?'#ffd86b':'#9fd3e6'); if(dark){ R(x+2,y-13,9,8,'rgba(255,216,107,.18)'); } }
  if(ph==='day'||ph==='enddan'){ for(let i=0;i<260;i++) R(h1(i,21)*W|0,114+(h1(i,22)*66|0),2,1,i%3?'#c8c040':'#8aaa3a');   // đồng cỏ lốm đốm vàng
    for(let y=112;y<H;y++){ const x=Math.round(282+12*Math.sin(y*.07)-(y-112)*.3), w=4+(y-112)*.12|0; R(x-w-1,y,w*2+2,1,'#5a4a3a'); R(x-w,y,w*2,1,'#8ab0d8'); if(y%5===0) R(x-w+2,y,w,1,'#c8dcf0'); }   // sông uốn khúc
    for(const [x,y,w] of [[30,128,14],[236,166,16],[300,128,14],[118,170,16]]){ R(x,y,w,7,'#8a8078'); R(x+2,y,w-6,2,'#b0a89a'); R(x,y+6,w,1,'#5a5248'); } }
  R(118,138,84,26,dark?'#2a2a20':'#a89068'); R(118,138,84,2,dark?'#3a3a2a':'#c8b088');                                       // sân làng đất nện
  // lều cắm trại cạnh đống lửa (ảnh mẫu), đá + khúc gỗ ngồi
  g.fillStyle=dark?'#3a3e44':'#6a6e74'; g.beginPath(); g.moveTo(186,160); g.lineTo(206,128); g.lineTo(244,130); g.lineTo(252,160); g.fill();
  g.fillStyle=dark?'#c07a2a':'#e8a040'; g.beginPath(); g.moveTo(178,160); g.lineTo(204,126); g.lineTo(216,160); g.fill(); R(200,140,4,20,dark?'#1a1416':'#3a2a20'); for(const x of [190,198,206]) R(x,134+(x-190)/2|0,1,26-(x-190)/2|0,dark?'#8a5420':'#b87a30');
  for(const [x,y,w] of [[124,152,10],[132,156,7],[96,154,14]]){ R(x,y,w,5,dark?'#3a4048':'#8a8a8a'); R(x+1,y,w-2,1,dark?'#5a6068':'#b0b0b0'); } R(104,160,22,4,'#5a3a22'); R(104,160,22,1,'#7a5232');
  // đống lửa giữa làng có giá treo nồi
  R(148,128,2,24,'#2a1e16'); R(170,128,2,24,'#2a1e16'); R(148,128,24,2,'#2a1e16'); R(158,130,1,5,'#5a5a5a'); R(155,135,8,5,'#3a3a40');
  R(150,150,20,3,'#5a3a22'); R(154,147,12,3,'#6e472c'); for(const [x,y,c] of [[160,136,'#ff9a2a'],[156,141,'#ff6a1a'],[164,141,'#ff6a1a'],[160,144,'#ffd86b']]) D(x,y,ph==='night'||ph==='wait'?5:4,c);
  D(160,142,24,dark?'rgba(255,150,60,.14)':'rgba(255,200,120,.08)');
  // giếng làng ban ngày / giá treo cổ lúc bỏ phiếu / quạ
  if(ph==='day'||ph==='enddan'){ R(100,140,14,10,'#9b968c'); R(100,140,14,2,'#bdb8ad'); R(100,130,2,10,'#6e472c'); R(112,130,2,10,'#6e472c'); R(98,128,18,3,'#a8322a'); }
  if(ph==='vote'){ R(214,112,3,40,'#2a1410'); R(214,112,26,3,'#2a1410'); R(236,115,1,12,'#c8a060'); R(234,127,5,5,'#c8a060'); R(233,128,1,3,'#2a1410'); R(207,150,18,3,'#2a1410');
    for(const [x,y] of [[60,40],[90,30],[130,52],[280,36]]){ R(x-3,y,3,1,'#1a0a10'); R(x+1,y,3,1,'#1a0a10'); R(x,y+1,1,1,'#1a0a10'); } }
  if(ph==='enddan') for(let i=0;i<12;i++) R(130+h1(i,11)*60|0,96+h1(i,12)*16|0,1,2,'#fff3c0');
  // sương đêm
  if(dark) for(const [y,a] of [[104,.12],[118,.1],[150,.06]]) for(let x=0;x<W;x+=2) if(h1(x,y)<.7) R(x,y+(Math.sin(x*.07)*2|0),2,3,`rgba(190,200,230,${a})`);
  return up(k,4).toDataURL(); });
let msPrev=null;
function masoiSound(v,key){ const S=GAME.snd; if(!S) return; const prev=msPrev; msPrev={key,alive:(v.players||[]).map(p=>p.alive)};
  if(!prev&&v.st==='night') S.nightAmb(true);
  if(prev&&prev.key!==key){ if(v.st==='night'){ S.howl(0); S.howl(.7,.86); S.nightAmb(true); } else S.nightAmb(false);
    if(v.st==='day') S.rooster(); if(v.st==='vote') S.bell(); if(v.st==='end') S.win(v.winner!=='soi'); }
  if(prev&&prev.alive) (v.players||[]).forEach((p,i)=>{ if(prev.alive[i]&&!p.alive) S.death(); }); }
// quản trò dẫn chuyện: ban đêm lần lượt gọi Sói → Tiên tri → Bảo vệ theo thời gian còn lại của đêm
function narrate(v){ const last=(v.log||[]).slice(-1)[0]||'';
  if(v.st==='wait') return ['', 'Quản trò: đợi đủ người là bắt đầu. Ít người thì thuê tôi tìm thêm (bot) nhé!'];
  if(v.st==='night'){ const k=1-(v.left||0)/(v.nightMs||30000); return k<.2?['','Màn đêm buông xuống... cả làng nhắm mắt đi ngủ.']:k<.5?['soi','Sói ơi, hãy thức dậy! Chọn một người để cắn.']:k<.75?['tientri','Tiên tri ơi, hãy thức dậy! Chỉ tay vào người muốn soi.']:['baove','Bảo vệ ơi, hãy thức dậy! Chọn người cần che chở đêm nay.']; }
  if(v.st==='day') return ['','Trời sáng rồi! '+last+' · Cả làng bàn bạc xem ai là sói.'];
  if(v.st==='vote') return ['','Đến giờ bỏ phiếu! Chỉ tay vào người bạn nghi là sói.'];
  return ['',v.winner==='soi'?'Phe SÓI đã thắng! Làng chìm trong bóng tối...':'Phe DÂN LÀNG đã thắng! Sói đã bị diệt sạch.']; }
let lastPhase='';
function masoiHtml(v){ const me=v.me, alive=v.players[me]&&v.players[me].alive, ph={wait:'Đợi người',night:'BAN ĐÊM',day:'BAN NGÀY · bàn bạc',vote:'BỎ PHIẾU TREO CỔ',end:'HẾT VÁN'}[v.st];
  const act=v.st==='night'?{soi:['kill','Cắn'],tientri:['see','Soi'],baove:['guard','Bảo vệ']}[v.role]:v.st==='vote'?['vote','Treo']:null, votes=i=>v.votes?Object.values(v.votes).filter(x=>x===i).length:0;
  const RI=ROLE_INFO[v.role], night=v.st==='night', [calling,say]=narrate(v), key=v.st+v.day;
  const banner=key!==lastPhase&&v.st!=='wait'?`<div class="mphase">${night?'🌙 ĐÊM '+v.day:v.st==='day'?'☀️ TRỜI SÁNG · NGÀY '+v.day:v.st==='vote'?'⚖️ BỎ PHIẾU':v.winner==='soi'?'🐺 SÓI THẮNG':'🏡 DÂN LÀNG THẮNG'}</div>`:''; lastPhase=key;
  const roleKey=name=>Object.keys(ROLE_INFO).find(k=>ROLE_INFO[k][0]===name)||'dan';
  const list=v.st==='end'&&v.reveal?v.reveal.map(r=>({name:r.name,alive:r.alive,role:r.role,win:r.win})):v.players;
  masoiSound(v,key); const scene=wolfSceneURL(v.st==='end'?(v.winner==='soi'?'endsoi':'enddan'):v.st);
  return `<div class="fsg masoifs ph-${v.st}" style="background:url(${scene}) center bottom/cover no-repeat">${banner}<aside class="mside"><div class="mhead"><b>${ph}</b><span>Ngày ${v.day}${v.left?' · '+Math.ceil(v.left/1000)+'s':''}</span></div>
      ${RI?`<div class="mrole"><img src="${roleIcon(v.role)}" alt=""><div><b>Bạn là ${esc(v.roleName||RI[0])}</b><small>${RI[1]}${alive?'':' · bạn đã chết'}</small></div></div>`:''}
      <div class="mroles">${Object.keys(ROLE_INFO).map(r=>`<span class="${calling===r?'call':''}" title="${ROLE_INFO[r][1]}"><img src="${roleIcon(r)}" alt="">${ROLE_INFO[r][0]}</span>`).join('')}</div>
      <p class="muted">Phí ${fmt(v.fee)} · pot ${fmt(v.pot)}${v.seen&&v.seen.length?' · đã soi: '+v.seen.map(s=>esc(s.n)+(s.soi?' (SÓI)':' (dân)')).join(', '):''}</p>
      <div class="mchat">${v.log.slice(-6).map(l=>`<div class="sys">${esc(l)}</div>`).join('')}${v.chat.slice(-10).map(c=>`<div class="${c.to==='soi'?'bad':''}"><b>${esc(c.n)}:</b> ${esc(c.m)}</div>`).join('')}</div>
      ${alive?`<div class="form"><input id="msIn" maxlength="100" placeholder="${night?(v.role==='soi'?'Nói với bầy sói...':'Ban đêm im lặng'):'Nói với cả làng...'}" aria-label="Nói">${btn('mschat','Gửi')}</div>`:''}</aside>
    <div class="mstage"><div class="mnarr"><img src="${GAME.portrait('quantro')?GAME.portrait('quantro').toDataURL():''}" alt=""><div><b>Quản trò</b><p>${esc(say)}</p></div></div>
    <main class="mgrid">${list.map((p,i)=>`<div class="mcard ${p.alive?'':'dead'} ${v.myAct===i?'pick':''} ${i===me?'me':''} ${p.win?'win':''}" style="background-image:url(${forestURL(night)})">
        <div class="mname">${i+1} ${esc(p.name)}</div>${face(p.name,'big')}${p.role?`<span class="mtag"><img src="${roleIcon(roleKey(p.role))}" alt="">${esc(p.role)}</span>`:''}
        ${votes(i)?`<span class="mvote">${votes(i)} phiếu</span>`:''}${p.alive?'':'<span class="mdead">ĐÃ CHẾT</span>'}${p.win?'<span class="mwin">THẮNG</span>':''}
        ${v.st!=='end'&&alive&&act&&p.alive&&i!==me&&!(v.role==='soi'&&p.soi&&night)?btn('ms',act[1],{op:act[0],target:i},'pri'):''}</div>`).join('')||'<p class="muted">Bàn trống</p>'}</main></div>
    <div class="mbar">${v.st==='vote'&&alive?btn('ms','Bỏ qua lượt treo',{op:'vote',target:-1}):''}${(v.st==='wait'||v.st==='end')&&me>=0&&v.players.length<SD.CLUB.bots.masoiSize?btn('ms',`Thuê quản trò tìm người (${fmt(SD.CLUB.bots.masoiHire)} · thắng ×${SD.CLUB.bots.masoiBonus}, thua mất ×${SD.CLUB.bots.masoiBonus})`,{op:'hire'},'pri'):''}${(v.st==='wait'||v.st==='end')&&v.players.length>=v.min?btn('ms','Bắt đầu ván',{op:'start'},'pri'):''}${btn('tleave','Rời bàn')}</div></div>`; }

/* ---------- màn câu cá toàn màn hình ---------- */
// hồ chiếm phần trên, bờ + cầu gỗ ở dưới; logic toạ độ cá vẫn theo khung 360×220 của ui.js, chỉ phóng ra màn hình
const FISHK={1:'ca_ro',2:'ca_chep',3:'ca_lang'};
const shade=k=>once('sh:'+k,()=>{ const s=A.fish(FISHK[k]||'ca_ro').c, c=cv(s.width,s.height), g=c.getContext('2d'); g.drawImage(s,0,0); g.globalCompositeOperation='source-in'; g.fillStyle='rgba(14,36,64,.62)'; g.fillRect(0,0,c.width,c.height); return c; });
function drawRod(g,x,y,s,tip){ const pts=[[0,0],[1,-4],[2,-8],[3,-12],[5,-16],[8,-20],[12,-23],[16,-25],[20,-26]];   // cần câu cong như ảnh mẫu
  for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i], [bx,by]=pts[i+1], n=4; for(let k=0;k<=n;k++){ const px=x+(ax+(bx-ax)*k/n)*s, py=y+(ay+(by-ay)*k/n)*s;
      g.fillStyle=OUT; g.fillRect(Math.round(px)-s,Math.round(py)-s,s*3,s*3); } }
  for(let i=0;i<pts.length-1;i++){ const [ax,ay]=pts[i], [bx,by]=pts[i+1], n=4; for(let k=0;k<=n;k++){ const px=x+(ax+(bx-ax)*k/n)*s, py=y+(ay+(by-ay)*k/n)*s;
      g.fillStyle=i<2?'#7a3a1e':'#b8683a'; g.fillRect(Math.round(px),Math.round(py),s,s); if(i>=2){ g.fillStyle='#e0915a'; g.fillRect(Math.round(px),Math.round(py)-1,s,1); } } }
  g.fillStyle=OUT; g.fillRect(x+s*1-1,y-s*8-1,s*3+2,s*3+2); g.fillStyle='#8aa4d0'; g.fillRect(x+s*1,y-s*8,s*3,s*3); g.fillStyle='#5a6a9a'; g.fillRect(x+s*2,y-s*7,s,s);   // ống cuộn dây
  tip.x=x+20*s; tip.y=y-26*s; }
function drawFishScene(c,FS,t,pos,size){ const W=c.width, H=c.height, g=c.getContext('2d'); g.imageSmoothingEnabled=false; const LH=Math.floor(H*.8), sx=W/360, sy=LH/220;
  for(let y=0;y<LH;y++){ const k=y/LH; g.fillStyle=k<.3?'#2a6aa8':k<.7?'#2e7bc0':'#3a8ad0'; g.fillRect(0,y,W,1); }
  for(let y=6;y<LH;y+=12) for(let x=(y*7+Math.floor(t*14))%40;x<W;x+=40){ g.fillStyle='#6fb6ea'; g.fillRect(x,y,7,1); g.fillRect(x+2,y+1,3,1); }
  for(let i=0;i<5;i++){ const lx=((i*97)%W+20)%W, ly=(i*53)%(LH-30)+12; g.fillStyle=OUT; g.fillRect(lx-7,ly-3,15,7); g.fillStyle='#4f9a3e'; g.fillRect(lx-6,ly-2,13,5); g.fillStyle='#2a6aa8'; g.fillRect(lx,ly-2,2,2); if(i%2){ g.fillStyle='#f29ab0'; g.fillRect(lx+3,ly-3,3,2); } }
  g.fillStyle='#e0c890'; g.fillRect(0,LH,W,4); g.fillStyle='#6aa84a'; g.fillRect(0,LH+4,W,H-LH-4); g.fillStyle='#5a9a3e'; for(let x=0;x<W;x+=5) g.fillRect(x,LH+5+(x%3),1,2);
  const dx0=Math.floor(W*.04); g.fillStyle=OUT; g.fillRect(dx0-1,LH-10,58,H-LH+10); for(let i=0;i<7;i++){ g.fillStyle=i%2?'#a7744c':'#b8855a'; g.fillRect(dx0+i*8,LH-9,7,H-LH+9); }
  // cá
  if(FS.st!=='reel') for(const f of FS.fish){ if(f.gone) continue; let [x,y]=pos(f,t); if(FS.st!=='look'&&FS.target===f.i){ x+=(FS.bx-x)*.85; y+=(FS.by-y)*.85; }
    const s=shade(f.size), X=x*sx, Y=y*sy, sc=f.size===3?3:f.size===2?2:1.5, [px]=pos(f,t-.05), back=px>x; g.save(); g.translate(Math.round(X),Math.round(Y)); if(back) g.scale(-1,1); g.drawImage(s,-s.width*sc/2,-s.height*sc/2,s.width*sc,s.height*sc); g.restore();
    if(f.sparkle&&Math.floor(t*6)%3===0){ g.fillStyle='#fff7a0'; g.fillRect(X-1,Y-12,2,7); g.fillRect(X-4,Y-9,8,2); } }
  // người + cần câu + dây
  const me=GAME.G&&AVATAR.build(GAME.G.look), fr=me&&me.anims.idle.frames[0], ps=2, mx=dx0+6, my=LH+4;
  if(fr) g.drawImage(fr,mx,my-fr.height*ps+6,fr.width*ps,fr.height*ps);
  // tay trước nắm cán cần (khung nghiêng: bàn tay ở cột ~22, hàng ~40 của khung 32×48)
  const fy0=my-fr.height*ps+6, hx=mx+22*ps, hy=fy0+40*ps, tip={}; drawRod(g,hx-3,hy+8,2,tip);
  let skin='#f3b194'; try{ const d=fr.getContext('2d').getImageData(22,40,1,1).data; if(d[3]) skin=`rgb(${d[0]},${d[1]},${d[2]})`; }catch(e){}
  g.fillStyle=OUT; g.fillRect(hx-2,hy-4,8,8); g.fillStyle=skin; g.fillRect(hx-1,hy-3,6,6); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(hx-1,hy+1,6,2);
  const bob=FS.bx!==undefined&&FS.st!=='look'?{x:FS.bx*sx,y:FS.by*sy}:{x:tip.x+6,y:tip.y+30+Math.sin(t*2)*3};
  g.strokeStyle='#f4f1ea'; g.lineWidth=1; g.beginPath(); g.moveTo(tip.x+.5,tip.y+.5); g.quadraticCurveTo((tip.x+bob.x)/2,Math.max(tip.y,bob.y)+12,bob.x+.5,bob.y+.5); g.stroke();
  if(FS.bx!==undefined&&FS.st!=='look'){ const dip=FS.st==='bite'?4:Math.round(Math.sin(t*4)), X=Math.round(bob.x), Y=Math.round(bob.y)+dip;
    g.fillStyle=OUT; g.fillRect(X-4,Y-6,9,11); g.fillStyle='#e23b2e'; g.fillRect(X-3,Y-5,7,5); g.fillStyle='#fbfaf6'; g.fillRect(X-3,Y,7,3);
    g.strokeStyle='rgba(220,240,255,.6)'; g.beginPath(); g.ellipse(X,Y+5,8+Math.sin(t*3)*2,3,0,0,7); g.stroke(); }
  else { g.fillStyle='#9aa0a8'; g.fillRect(Math.round(bob.x)-1,Math.round(bob.y),3,1); g.fillRect(Math.round(bob.x)+1,Math.round(bob.y)-2,1,3); }
  if(FS.st==='look'){ g.strokeStyle='#fff3d6'; const X=FS.mx*sx, Y=FS.my*sy; g.strokeRect(Math.round(X)-10.5,Math.round(Y)-10.5,21,21); g.fillStyle='#fff3d6'; g.fillRect(Math.round(X)-1,Math.round(Y)-1,2,2); }
  return {sx,sy,LH}; }
// thanh kéo cá lớn bên phải (kiểu Stardew/Dota): vùng xanh, con cá, thanh tiến độ vàng
function drawReel(c,FS,F,over){ const W=c.width, H=c.height, g=c.getContext('2d'), BH=Math.floor(H*.72), X=W-70, Y=Math.floor((H-BH)/2)-10;
  g.fillStyle=OUT; g.fillRect(X-4,Y-4,40,BH+8); g.fillStyle='#8a5a36'; g.fillRect(X-2,Y-2,36,BH+4); g.fillStyle='#2a3a50'; g.fillRect(X,Y,32,BH);
  g.fillStyle=over?'#7de07a':'#4fa84a'; g.fillRect(X+2,Y+BH*(1-FS.zone-F.zone/2),28,BH*F.zone); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(X+2,Y+BH*(1-FS.zone-F.zone/2),28,2);
  const f=A.fish(FISHK[FS.size]||'ca_ro').c, fy=Y+BH*(1-FS.fy); g.drawImage(f,X+16-f.width,fy-f.height,f.width*2,f.height*2);
  g.fillStyle=OUT; g.fillRect(X+40,Y-2,14,BH+4); g.fillStyle='#3a2f40'; g.fillRect(X+42,Y,10,BH); g.fillStyle=FS.p>.66?'#7de07a':FS.p>.33?'#ffd84a':'#ff6a55'; g.fillRect(X+42,Y+BH*(1-FS.p),10,BH*FS.p); }

window.GAMES={chessHtml,pokerHtml,masoiHtml,drawBoard,boardSquare,boardXY,drawFishScene,drawReel,portraitURL,cardURL,chipsURL};
})();
