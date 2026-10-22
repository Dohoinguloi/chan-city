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
function drawBoard(c,v,sel,legal){ if(!c||!v) return; c.width=BW; c.height=BW; const g=c.getContext('2d');
  const avail=Math.min(innerHeight-196,innerWidth>800?innerWidth-400:innerWidth-30), sc=avail>=BW?Math.floor(avail/BW*2)/2*BW:Math.max(140,avail); c.style.width=c.style.height=sc+'px';   /* vuông, phóng nguyên lần cho nét */
  g.imageSmoothingEnabled=false; const flip=v.me===1;
  g.fillStyle='#946a64'; g.fillRect(0,0,BW,BW); g.fillStyle='#5e5266'; g.fillRect(3,3,BW-6,BW-6); g.fillStyle='#e48c4a'; g.fillRect(5,5,BW-10,BW-10); g.fillStyle='#d0663a'; g.fillRect(FR-1,FR-1,SQ*8+2,SQ*8+2);
  for(let i=0;i<8;i++){ const f=flip?7-i:i, r=flip?i:7-i; A.drawText(g,'ABCDEFGH'[f],FR+i*SQ+10,BW-FR+4,'#b04e2a'); A.drawText(g,String(r+1),5,FR+i*SQ+9,'#b04e2a'); }
  for(let i=0;i<64;i++){ const r=i>>3, f=i&7, X=FR+(flip?7-f:f)*SQ, Y=FR+(flip?7-r:r)*SQ; g.fillStyle=(r+f)%2?'#c8dcd2':'#5e5266'; g.fillRect(X,Y,SQ,SQ);
    if(v.last&&(v.last.from===i||v.last.to===i)){ g.fillStyle='rgba(255,216,74,.45)'; g.fillRect(X,Y,SQ,SQ); }
    if(i===sel){ g.fillStyle='rgba(127,224,255,.55)'; g.fillRect(X,Y,SQ,SQ); }
    const p=(v.b||START)[i];
    if(v.check&&p&&p===(v.turn==='w'?'K':'k')){ g.fillStyle='#e04040'; g.fillRect(X,Y,SQ,SQ); g.fillStyle='#b02a2a'; g.fillRect(X,Y+SQ-2,SQ,2); }
    if(p) g.drawImage(pieceCanvas(p),X+2,Y+1);
    if(legal.includes(i)){ g.fillStyle=OUT; g.fillRect(X+7,Y+8,8,6); g.fillRect(X+8,Y+7,6,8); g.fillStyle='#8edc6a'; g.fillRect(X+8,Y+8,6,6); g.fillStyle='#3fb070'; g.fillRect(X+8,Y+13,6,1); } } }
// ô cờ dưới chuột (theo khung đã phóng to)
function boardSquare(c,e,v){ const rc=c.getBoundingClientRect(), s=rc.width/BW, x=(e.clientX-rc.left)/s-FR, y=(e.clientY-rc.top)/s-FR; if(x<0||y<0||x>=SQ*8||y>=SQ*8) return -1;
  let f=Math.floor(x/SQ), r=7-Math.floor(y/SQ); if(v.me===1){ f=7-f; r=7-r; } return r*8+f; }
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
  return `<div class="fsg masoifs ph-${v.st}">${banner}<aside class="mside"><div class="mhead"><b>${ph}</b><span>Ngày ${v.day}${v.left?' · '+Math.ceil(v.left/1000)+'s':''}</span></div>
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

window.GAMES={chessHtml,pokerHtml,masoiHtml,drawBoard,boardSquare,drawFishScene,drawReel,portraitURL,cardURL,chipsURL};
})();
