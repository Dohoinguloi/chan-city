// Nhà giải trí cạnh Deck: bàn cờ vua, poker Texas Hold'em, ma sói. Server giữ tiền cược và trả cho người thắng.
'use strict';
const C=require('./core'), PK=require('./poker');
const CHESS=require('../chande-bootcamp/shared/chess.js');
const crypto=require('crypto');
const {S,on,hook,send,now,near,take,give,reward,note,players}=C;
const CL=S.CLUB, fmt=S.fmt;
const rnd=n=>crypto.randomInt(n);
let botSeq=1;
const mkBot=name=>({pid:-(botSeq++),bot:true,ws:null,prof:{name,money:1e12,daily:{gameExp:0}}});
const isBot=pl=>pl&&pl.bot;
// tiền/thưởng: bot dùng tiền nhà cái nên bỏ qua
const takeP=(pl,v)=>isBot(pl)?true:take(pl,v,true), giveP=(pl,v)=>{ if(!isBot(pl)) give(pl,v); }, rewardP=(pl,r,m)=>{ if(!isBot(pl)) reward(pl,r,m); }, noteP=(pl,m,k)=>{ if(!isBot(pl)) note(pl,m,k); };
const BN=()=>CL.bots.names[rnd(CL.bots.names.length)];
// tiền thắng từ bot (nhà cái bỏ ra): mỗi người tối đa CL.botWinDaily / ngày, phần vượt nhà cái giữ lại
const botPay=(pl,gain)=>{ if(!pl||isBot(pl)||!pl.prof||gain<=0) return Math.max(0,gain); const d=pl.prof.daily, v=Math.max(0,Math.min(gain,(CL.botWinDaily||1e12)-(d.botWin||0))); d.botWin=(d.botWin||0)+v; if(v<gain) note(pl,`🎰 Hôm nay đã ăn của bot đủ ${fmt(CL.botWinDaily)}: phần thắng thêm ${fmt(gain-v)} nhà cái giữ lại`,'lock'); return v; };
const PV={p:1,n:3,b:3,r:5,q:9,k:0};

class Table{ constructor(def){ this.def=def; this.id=def.id; this.watch=new Set(); this.log=[]; }
  say(msg){ this.log.push(msg); if(this.log.length>14) this.log.shift(); }
  members(){ return [...this.seated(),...this.watch]; }
  push(){ for(const pl of new Set(this.members())) send(pl,{t:'tbl',v:this.view(pl)}); }
  watchOnly(pl){ this.watch.add(pl); pl.table=this; this.push(); return {watch:true}; } }

/* ---------- cờ vua ---------- */
class Chess extends Table{
  constructor(d){ super(d); this.seats=[null,null]; this.bet=0; this.st='wait'; this.g=null; this.clock=[0,0]; this.turnAt=0; this.result=null; this.rematch=[false,false]; this.draw=-1; }
  seated(){ return this.seats.filter(Boolean).map(s=>s.pl); }
  seatOf(pl){ return this.seats.findIndex(s=>s&&s.pl===pl); }
  join(pl,o){ if(this.seatOf(pl)>=0) return {}; const free=this.seats.indexOf(null);
    if(free<0||this.st==='play') return this.watchOnly(pl);
    if(!this.seats.some(Boolean)){ const bet=o.bet|0; if(!CL.chess.bets.includes(bet)) return {err:'Mức cược không hợp lệ'}; if(pl.prof.money<bet) return {err:'Không đủ tiền cược'}; this.bet=bet; }
    else if(pl.prof.money<this.bet) return {err:`Bàn này cược ${fmt(this.bet)}, bạn không đủ tiền`};
    this.seats[free]={pl,name:pl.prof.name}; this.watch.delete(pl); pl.table=this; this.say(`${pl.prof.name} ngồi vào bàn`);
    if(this.seats.every(Boolean)) this.start(); else this.push(); return {}; }
  start(){ const paid=[];
    for(const s of this.seats){ if(takeP(s.pl,this.bet)) paid.push(s); else { for(const p of paid) giveP(p.pl,this.bet); noteP(s.pl,'Không đủ tiền cược, rời bàn'); this.leave(s.pl); return; } }
    if(rnd(2)) this.seats.reverse();
    this.g=CHESS.newGame(); this.clock=[CL.chess.clock*1000,CL.chess.clock*1000]; this.turnAt=now(); this.st='play'; this.result=null; this.rematch=[false,false]; this.draw=-1; this.moves=[];
    this.say(`Ván mới: ${this.seats[0].name} cầm Trắng, ${this.seats[1].name} cầm Đen · cược ${fmt(this.bet)} mỗi bên`); this.push(); }
  act(pl,m){ const i=this.seatOf(pl);
    if(m.op==='move'){ if(this.st!=='play'||i<0) return {err:'Chưa chơi'}; if(i!==(this.g.turn==='w'?0:1)) return {err:'Chưa tới lượt'};
      const n=CHESS.move(this.g,{from:m.from|0,to:m.to|0,promo:['q','r','b','n'].includes(m.promo)?m.promo:'q'}); if(!n) return {err:'Nước đi không hợp lệ'};
      const t=now(); this.clock[i]-=t-this.turnAt; this.turnAt=t; this.g=n; this.draw=-1; this.moves.push(CHESS.sqName(m.from|0)+'-'+CHESS.sqName(m.to|0)); if(this.moves.length>40) this.moves.shift();
      const st=CHESS.status(n);
      if(st==='mate') this.end(i,'chiếu hết');
      else if(['stale','draw50','material'].includes(st)) this.end(-1,{stale:'hết nước đi (pat)',draw50:'50 nước không ăn quân',material:'không đủ quân để chiếu hết'}[st]);
      else this.push(); return {}; }
    if(m.op==='resign'){ if(this.st==='play'&&i>=0) this.end(1-i,`${this.seats[i].name} xin thua`); return {}; }
    if(m.op==='draw'){ if(this.st!=='play'||i<0) return {}; if(this.draw===1-i) this.end(-1,'hai bên đồng ý hoà'); else { this.draw=i; this.say(`${this.seats[i].name} xin hoà`); this.push(); } return {}; }
    if(m.op==='rematch'){ if(this.st!=='end'||i<0) return {}; this.rematch[i]=true; this.seats.forEach((s,k)=>{ if(s&&isBot(s.pl)) this.rematch[k]=true; }); this.botLeaveAt=0; if(this.rematch.every(Boolean)&&this.seats.every(Boolean)) this.start(); else this.push(); return {}; }
    if(m.op==='bot'){ if(this.st==='play'||i<0) return {err:'Đang chơi'}; const free=this.seats.indexOf(null); if(free<0) return {err:'Bàn đủ người'};
      this.seats[free]={pl:mkBot('Lê Quang Liêm'),name:'Lê Quang Liêm'}; this.say('Lê Quang Liêm ngồi vào bàn'); this.start(); return {}; }
    return {err:'?'}; }
  end(w,why){ this.st='end'; const pot=this.bet*2;
    if(w<0){ for(const s of this.seats) if(s){ giveP(s.pl,this.bet); rewardP(s.pl,{exp:CL.chess.drawExp,kind:'game'},'Cờ vua: hoà ('+why+')'); } this.say('Hoà: '+why); }
    else { const W=this.seats[w], L=this.seats[1-w]; if(W){ if(W.pl&&!isBot(W.pl)) require('./places').stat(W.pl,'chessW',1); giveP(W.pl,L&&isBot(L.pl)?this.bet+botPay(W.pl,this.bet):pot);   /* thắng bot: tiền của bot tính vào trần mỗi ngày */ rewardP(W.pl,{exp:CL.chess.winExp,kind:'game'},`Thắng cờ vua (${why})${pot?' · +'+fmt(pot):''}`); }
      if(L&&L.pl.ws) noteP(L.pl,`Thua cờ vua (${why})${this.bet?' · -'+fmt(this.bet):''}`,'lock'); this.say(`${W?W.name:'?'} thắng: ${why}`); }
    for(const s of this.seats) if(s&&isBot(s.pl)) this.botLeaveAt=now()+4000;
    this.result={w,why}; this.push(); }
  leave(pl){ const i=this.seatOf(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ if(this.st==='play') this.end(1-i,`${this.seats[i].name} rời bàn`); this.seats[i]=null; this.say(`${pl.prof.name} rời bàn`);
      this.st='wait'; this.rematch=[false,false]; if(!this.seats.some(Boolean)){ this.bet=0; this.g=null; this.result=null; } }
    this.push(); }
  tick(t){ if(this.st==='end'&&this.botLeaveAt&&t>this.botLeaveAt){ this.botLeaveAt=0; const b=this.seats.findIndex(s=>s&&isBot(s.pl)); if(b>=0&&!this.rematch.every(Boolean)){} }
    if(this.st!=='play') return; const i=this.g.turn==='w'?0:1; if(this.clock[i]-(t-this.turnAt)<=0){ this.clock[i]=0; this.end(1-i,'hết giờ'); return; }
    const s=this.seats[i]; if(s&&isBot(s.pl)&&t-this.turnAt>900) this.botMove(i); }
  // bot cờ: ưu tiên ăn quân to, chiếu tướng; trừ điểm nước để mất quân
  botMove(i){ const g=this.g, ms=CHESS.legal(g); let best=null, bs=-1e9;
    for(const m of ms){ const cap=g.b[m.to]?PV[g.b[m.to].toLowerCase()]:m.ep?1:0, n=CHESS.move(g,m); if(!n) continue;
      let sc=cap+(m.promo?8:0)+Math.random()*.4; if(CHESS.status(n)==='mate') sc+=100; else if(CHESS.inCheck(n)) sc+=.3;
      let worst=0; for(const r of CHESS.legal(n)) if(n.b[r.to]) worst=Math.max(worst,PV[n.b[r.to].toLowerCase()]); sc-=worst*.9;
      if(sc>bs){ bs=sc; best=m; } }
    if(best) this.act(this.seats[i].pl,{op:'move',from:best.from,to:best.to,promo:best.promo||'q'}); }
  view(pl){ const t=now(), i=this.g?(this.g.turn==='w'?0:1):-1, cl=this.clock.map((c,k)=>this.st==='play'&&k===i?c-(t-this.turnAt):c);
    return {id:this.id,game:'chess',name:this.def.name,st:this.st,bet:this.bet,seats:this.seats.map(s=>s&&{name:s.name,id:s.pl.pid}),me:this.seatOf(pl),
      b:this.g&&this.g.b,turn:this.g&&this.g.turn,castle:this.g&&this.g.castle,ep:this.g?this.g.ep:-1,last:this.g&&this.g.last,check:this.g&&this.st==='play'&&CHESS.inCheck(this.g),
      clock:cl,draw:this.draw,result:this.result,rematch:this.rematch,watchers:this.watch.size,moves:this.moves||[],log:this.log}; } }

/* ---------- poker Texas Hold'em (no-limit) ----------
   Mỗi bàn có mức mù riêng (CLUB.pokerStakes theo def.stakes). Ghi hành động gần nhất của từng ghế (bong bóng trên ghế), bài mạnh nhất hiện tại của mình,
   người thắng + 5 lá tạo nên bài lúc lật. Bot: ước lượng sức bài (preflop theo đôi / đồng chất / liền; sau flop theo bộ, kicker, bài chờ thùng / sảnh),
   so với tỉ lệ pot phải bỏ ra, thỉnh thoảng tố lừa */
const RV={T:'10',J:'J',Q:'Q',K:'K',A:'A'}, rv=r=>RV[r]||r, RK='23456789TJQKA';
// tên bài kèm quân: Đôi K, Hai đôi A và 7, Sám cô 9, Sảnh tới 10, Cù lũ 9 đầy 4...
const hname=b=>{ const s=b.score, R=k=>rv(RK[k]); return [`Mậu thầu ${R(s[1])}`,`Đôi ${R(s[1])}`,`Hai đôi ${R(s[1])} và ${R(s[2])}`,`Sám cô ${R(s[1])}`,`Sảnh tới ${R(s[1])}`,`Thùng ${R(s[1])} cao nhất`,`Cù lũ ${R(s[1])} đầy ${R(s[2])}`,`Tứ quý ${R(s[1])}`,b.name][s[0]]; };
class Poker extends Table{
  constructor(d){ super(d); this.P={...CL.poker,...((CL.pokerStakes||{})[d.stakes]||{})}; this.seats=Array(this.P.seats).fill(null); this.st='wait'; this.dealer=-1; this.board=[]; this.next=0; this.toAct=-1; this.cur=0; this.minRaise=0; this.show=null; this.hand=0; this.winners=null; }
  seated(){ return this.seats.filter(s=>s&&s.pl).map(s=>s.pl); }
  seatOf(pl){ return this.seats.findIndex(s=>s&&s.pl===pl); }
  join(pl,o){ if(this.seatOf(pl)>=0) return {}; const free=this.seats.indexOf(null); if(free<0) return this.watchOnly(pl);
    const P=this.P, buy=Math.round(o.buy||0); if(buy<P.minBuy||buy>P.maxBuy) return {err:`Bàn này mua chip từ ${fmt(P.minBuy)} tới ${fmt(P.maxBuy)}`};
    if(!take(pl,buy,true)) return {err:'Không đủ tiền mua chip'};
    this.seats[free]={pl,name:pl.prof.name,chips:buy,buy,bet:0,tot:0,cards:null,fold:true,allin:false,acted:false,inHand:false,act:null}; this.watch.delete(pl); pl.table=this;
    this.say(`${pl.prof.name} vào bàn với ${fmt(buy)}`); if(this.st==='wait') this.next=now()+3000; this.push(); return {}; }
  live(){ return this.seats.map((s,i)=>[s,i]).filter(([s])=>s&&s.inHand&&!s.fold); }
  nextIdx(from,pred){ for(let k=1;k<=this.seats.length;k++){ const i=(from+k)%this.seats.length, s=this.seats[i]; if(s&&pred(s,i)) return i; } return -1; }
  startHand(){ const P=this.P; for(const [i,s] of this.seats.entries()) if(s&&!s.pl){ this.seats[i]=null; }
    if(this.seats.some(x=>x&&isBot(x.pl))) for(const x of this.seats) if(x&&!isBot(x.pl)) x.botSeen=true;   /* ván có bot: lãi lúc rời bàn tính vào trần thắng bot */
    const ready=this.seats.filter(s=>s&&s.chips>=P.big); if(ready.length<2){ this.st='wait'; this.push(); return; }
    this.deck=PK.deck(); this.board=[]; this.show=null; this.winners=null; this.hand++;
    for(const s of this.seats) if(s){ const ok=s.chips>=P.big; Object.assign(s,{bet:0,tot:0,fold:!ok,allin:false,acted:false,inHand:ok,cards:ok?[this.deck.pop(),this.deck.pop()]:null,best:null,act:null}); }
    this.dealer=this.nextIdx(this.dealer,s=>s.inHand);
    const heads=ready.length===2, sb=heads?this.dealer:this.nextIdx(this.dealer,s=>s.inHand), bb=this.nextIdx(sb,s=>s.inHand);
    this.put(this.seats[sb],Math.min(P.small,this.seats[sb].chips)); this.put(this.seats[bb],Math.min(P.big,this.seats[bb].chips)); this.seats[sb].act={k:'sb',v:this.seats[sb].bet}; this.seats[bb].act={k:'bb',v:this.seats[bb].bet};
    this.cur=P.big; this.minRaise=P.big; this.street=0; this.st='play';
    this.toAct=this.nextIdx(bb,s=>s.inHand&&!s.fold&&!s.allin); this.turnAt=now(); this.say(`Ván #${this.hand} · ${this.seats[sb].name} mù nhỏ, ${this.seats[bb].name} mù lớn`); this.push(); }
  put(s,v){ v=Math.min(v,s.chips); s.chips-=v; s.bet+=v; s.tot+=v; if(s.chips===0) s.allin=true; }
  act(pl,m){ const i=this.seatOf(pl), s=this.seats[i], P=this.P;
    if(m.op==='bots'){ if(i<0) return {err:'Ngồi vào bàn trước'}; return this.addBots()?{}:{err:'Bàn đủ người'}; }
    if(m.op==='rebuy'){ if(!s||s.inHand&&!s.fold&&this.st==='play') return {err:'Đang trong ván'}; const buy=Math.round(m.buy||0);
      if(buy<P.big||s.chips+buy>P.maxBuy) return {err:`Mua thêm tối đa tới ${fmt(P.maxBuy)} chip`}; if(!take(pl,buy,true)) return {err:'Không đủ tiền'}; s.chips+=buy; s.buy+=buy; if(this.st==='wait') this.next=now()+2000; this.say(`${s.name} mua thêm ${fmt(buy)} chip`); this.push(); return {}; }
    if(this.st!=='play'||i!==this.toAct) return {err:'Chưa tới lượt'};
    const need=this.cur-s.bet;
    if(m.op==='fold'){ s.fold=true; s.act={k:'fold'}; this.say(`${s.name} bỏ bài`); }
    else if(m.op==='check'){ if(need>0) return {err:'Phải theo hoặc bỏ'}; s.act={k:'check'}; this.say(`${s.name} xem bài`); }
    else if(m.op==='call'){ if(need<=0) return {err:'Không có gì để theo'}; const v=Math.min(need,s.chips); this.put(s,need); s.act={k:s.allin?'allin':'call',v}; this.say(`${s.name} theo ${fmt(v)}`); }
    else if(m.op==='raise'||m.op==='allin'){ const max=s.bet+s.chips, to=m.op==='allin'?max:Math.round(m.to||0);
      if(!Number.isFinite(to)) return {err:'Số chip không hợp lệ'}; if(to>max) return {err:'Không đủ chip'}; if(to<=this.cur){ if(m.op==='allin'){ this.put(s,s.chips); s.act={k:'allin',v:s.bet}; this.say(`${s.name} all-in`); } else return {err:'Phải tố cao hơn mức hiện tại'}; }
      else { if(to<this.cur+this.minRaise&&to<max) return {err:`Tố ít nhất tới ${fmt(this.cur+this.minRaise)}`};
        if(to-this.cur>=this.minRaise) this.minRaise=to-this.cur; this.cur=to; this.put(s,to-s.bet); s.act={k:s.allin?'allin':'raise',v:to};
        for(const o of this.seats) if(o&&o!==s&&o.inHand&&!o.fold&&!o.allin) o.acted=false; this.say(`${s.name} ${s.allin?'all-in':'tố lên'} ${fmt(to)}`); } }
    else return {err:'?'};
    s.acted=true; this.advance(); return {}; }
  advance(){ const live=this.live(); if(live.length===1){ this.win([[live[0][0],this.potTotal()]],false); return; }
    // xong vòng cược: ai còn chip đều đã hành động và bằng mức cược; còn đúng 1 người có chip thì chỉ cần đã theo đủ
    const need=live.map(x=>x[0]).filter(s=>!s.allin);
    const done=need.length===0||(need.length===1?need[0].bet>=this.cur:need.every(s=>s.acted&&s.bet===this.cur));
    if(!done){ this.toAct=this.nextIdx(this.toAct,s=>s.inHand&&!s.fold&&!s.allin&&(!s.acted||s.bet<this.cur)); this.turnAt=now(); this.push(); return; }
    for(const s of this.seats) if(s){ s.bet=0; s.acted=false; if(s.act&&s.act.k!=='fold'&&s.act.k!=='allin') s.act=null; } this.cur=0; this.minRaise=this.P.big;   /* vòng mới: xoá bong bóng hành động (giữ Bỏ / All-in) */
    const canAct=live.filter(([s])=>!s.allin).length;
    if(this.street>=3){ this.showdown(); return; }
    this.street++; if(this.street===1) this.board.push(this.deck.pop(),this.deck.pop(),this.deck.pop()); else this.board.push(this.deck.pop());
    if(canAct<=1){ while(this.board.length<5) this.board.push(this.deck.pop()); this.showdown(); return; }
    this.toAct=this.nextIdx(this.dealer,s=>s.inHand&&!s.fold&&!s.allin); this.turnAt=now(); this.push(); }
  potTotal(){ return this.seats.reduce((a,s)=>a+(s?s.tot:0),0); }
  showdown(){ const live=this.live(); for(const [s] of live) s.best=PK.best([...s.cards,...this.board]);
    // chia pot chính + pot phụ theo mức đã góp
    const all=this.seats.filter(s=>s&&s.inHand), levels=[...new Set(all.map(s=>s.tot))].sort((a,b)=>a-b); let prev=0; const pays=new Map();
    for(const lv of levels){ const pot=all.reduce((a,s)=>a+Math.max(0,Math.min(s.tot,lv)-prev),0); const el=live.map(x=>x[0]).filter(s=>s.tot>=lv); prev=lv; if(!pot||!el.length) continue;
      let top=[]; for(const s of el){ if(!top.length) top=[s]; else { const c=PK.cmp(s.best.score,top[0].best.score); if(c>0) top=[s]; else if(c===0) top.push(s); } }
      const share=Math.floor(pot/top.length); top.forEach((s,k)=>pays.set(s,(pays.get(s)||0)+share+(k===0?pot-share*top.length:0))); }
    this.win([...pays.entries()],true); }
  win(list,show){
    for(const [s,v] of list){ s.chips+=v; const profit=v-s.tot; this.say(`🏆 ${s.name} ăn ${fmt(v)}${show&&s.best?' · '+hname(s.best):''}`); if(s.name===CL.tuSena.name) this.say(`Tú Sena: "${CL.tuSena.win}"`);
      if(s.pl&&!isBot(s.pl)&&profit>0) require('./places').stat(s.pl,'pokerWon',profit); if(s.pl&&!isBot(s.pl)&&profit>0) reward(s.pl,{exp:5+Math.min(45,Math.floor(profit/20000)),kind:'game'},`Poker: ăn ${fmt(v)}`); }
    this.winners=list.map(([s,v])=>({i:this.seats.indexOf(s),v,profit:v-s.tot,hand:show&&s.best?hname(s.best):'',best:show&&s.best?s.best.cards:null}));
    this.show=show?this.seats.map(s=>s&&s.inHand&&!s.fold&&s.best?{cards:s.cards,name:hname(s.best)}:null):null;
    this.st='show'; this.toAct=-1; this.next=now()+(show?7000:3500); this.push(); }
  leave(pl){ const i=this.seatOf(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ const s=this.seats[i]; if(s.chips>0) give(pl,s.botSeen&&s.chips>s.buy?s.buy+botPay(pl,s.chips-s.buy):s.chips); this.say(`${s.name} rời bàn, đổi ${fmt(s.chips)} chip ra tiền`);   /* bàn có bot: phần lãi tính vào trần thắng bot */ s.chips=0;
      if(this.st==='play'&&s.inHand){ s.pl=null; if(!s.fold){ s.fold=true; if(this.toAct===i||this.live().length<=1) this.advance(); } }   // giữ ghế tới hết ván để tính pot
      else this.seats[i]=null; }
    this.push(); }
  // bài mạnh nhất hiện tại của 1 ghế (cho chính người đó xem): trước flop đọc đôi / bài cao, sau flop chấm 5 lá
  handOf(s){ if(!s||!s.cards||s.cards[0]==='??') return null; if(this.board.length>=3){ const b=PK.best([...s.cards,...this.board]); return {name:hname(b),cat:b.score[0],best:b.cards}; }
    const [a,b]=s.cards; if(a[0]===b[0]) return {name:`Đôi ${rv(a[0])}`,best:s.cards}; const hi=RK.indexOf(a[0])>RK.indexOf(b[0])?a[0]:b[0];
    return {name:`Bài cao ${rv(hi)}${a[1]===b[1]?' · đồng chất':''}${Math.abs(RK.indexOf(a[0])-RK.indexOf(b[0]))===1?' · liền nhau':''}`,best:[]}; }
  botStrength(s){ const [a,b]=s.cards, ra=RK.indexOf(a[0]), rb=RK.indexOf(b[0]), hi=Math.max(ra,rb), lo=Math.min(ra,rb), suited=a[1]===b[1];
    if(this.board.length<3){ if(ra===rb) return .52+ra/26; return Math.min(.75,(hi+lo)/30+(suited?.07:0)+(hi-lo===1?.05:hi-lo===2?.03:0)+(hi>=11?.06:0)); }
    const cs=[...s.cards,...this.board], h=PK.best(cs), cat=h.score[0]; let v=[.1,.35,.58,.68,.76,.8,.9,.96,.99][cat];
    if(cat===1){ const pr=h.score[1], top=Math.max(...this.board.map(c=>RK.indexOf(c[0]))); if(pr>=top) v+=.12; if(![a,b].some(c=>RK.indexOf(c[0])===pr)) v-=.2; }   /* đôi trên cao / đôi chỉ nằm trên bàn */
    if(this.board.length<5){ const su={}; for(const c of cs) su[c[1]]=(su[c[1]]||0)+1; if([a,b].some(c=>su[c[1]]===4)) v=Math.max(v,.45);   /* chờ thùng */
      const rs=[...new Set(cs.map(c=>RK.indexOf(c[0])))].sort((x,y)=>x-y); for(let k=0;k+3<rs.length;k++) if(rs[k+3]-rs[k]===3) v=Math.max(v,.42); }   /* chờ sảnh 2 đầu */
    return Math.min(.99,v); }
  botAct(i){ const s=this.seats[i], need=this.cur-s.bet, pot=this.potTotal(), P=this.P, tu=s.name===CL.tuSena.name, st=this.botStrength(s)+Math.random()*.12-.06;
    const odds=need>0?need/(pot+need):0, liveN=this.live().length, max=s.bet+s.chips, canRaise=s.chips>need+this.minRaise;
    const to=f=>Math.min(max,Math.max(this.cur+this.minRaise,Math.round((this.cur+pot*f)/P.small)*P.small));
    if(canRaise&&(st>.8||st>.62&&Math.random()<.3||need===0&&liveN<=3&&Math.random()<.08)){ if(tu) this.say(`Tú Sena: "${CL.tuSena.raise}"`); return this.act(s.pl,{op:'raise',to:to(st>.9?1:.6)}); }   /* bài mạnh tố, thỉnh thoảng tố lừa khi ít người */
    if(need<=0) return this.act(s.pl,{op:'check'});
    if(st>odds+.12||need<=P.big&&st>.3) return this.act(s.pl,{op:need>=s.chips?'allin':'call'});
    if(tu&&rnd(2)) this.say(`Tú Sena: "${CL.tuSena.fold}"`); return this.act(s.pl,{op:'fold'}); }
  addBots(){ let n=0; const chips=Math.max(CL.bots.pokerChips,this.P.minBuy); for(let k=0;k<this.seats.length&&n<CL.bots.pokerBots;k++) if(!this.seats[k]){ const nm=this.seats.some(s=>s&&s.name===CL.tuSena.name)?BN():CL.tuSena.name; if(nm===CL.tuSena.name) this.say(`Tú Sena: "${CL.tuSena.join}"`); this.seats[k]={pl:mkBot(nm),name:nm,chips,buy:chips,bet:0,tot:0,cards:null,fold:true,allin:false,acted:false,inHand:false,act:null}; n++; }
    if(n){ this.say(`${n} bot vào bàn`); if(this.st==='wait') this.next=now()+2000; } return n; }
  tick(t){ if(this.st==='play'&&this.toAct>=0){ const s=this.seats[this.toAct]; if(s&&isBot(s.pl)&&t-this.turnAt>1100){ this.botAct(this.toAct); return; } }
    // không còn người thật thì bot đứng dậy
    if(this.st!=='play'&&this.seats.some(s=>s&&isBot(s.pl))&&!this.seats.some(s=>s&&s.pl&&!isBot(s.pl))) this.seats=this.seats.map(s=>s&&isBot(s.pl)?null:s);
    if(this.st==='play'&&t-this.turnAt>this.P.turn*1000){ const s=this.seats[this.toAct]; if(s){ if(this.cur-s.bet>0){ s.fold=true; s.act={k:'fold'}; } else s.act={k:'check'}; s.acted=true; this.say(`${s.name} hết giờ`); this.advance(); } }
    if((this.st==='show'||this.st==='wait')&&this.next&&t>=this.next){ this.next=0; this.startHand(); } }
  view(pl){ const me=this.seatOf(pl), P=this.P;
    return {id:this.id,game:'poker',name:this.def.name,stakes:P.name||'',st:this.st,me,dealer:this.dealer,toAct:this.toAct,cur:this.cur,minRaise:this.minRaise,board:this.board,pot:this.potTotal(),hand:this.hand,
      left:this.st==='play'?Math.max(0,P.turn*1000-(now()-this.turnAt)):0,turn:P.turn,blinds:[P.small,P.big],buy:[P.minBuy,P.maxBuy],mine:this.st!=='wait'?this.handOf(this.seats[me]):null,winners:this.st==='show'?this.winners:null,
      seats:this.seats.map((s,i)=>s&&{name:s.name,chips:s.chips,bet:s.bet,fold:s.fold,allin:s.allin,inHand:s.inHand,act:s.act,cards:i===me&&s.cards?s.cards:(this.show&&this.show[i]?this.show[i].cards:(s.inHand&&s.cards?['??','??']:null)),hand:this.show&&this.show[i]?this.show[i].name:''}),
      log:this.log,watchers:this.watch.size}; } }

/* ---------- ma sói ----------
   Vai: Sói, Tiên tri (soi 1 người / đêm), Bảo vệ (che 1 người, không 2 đêm liền), Phù thuỷ (1 bình cứu người bị sói cắn + 1 bình độc, từ 7 người),
   Thợ săn (chết thì được bắn 1 người, từ 9 người), Dân làng. Ban ngày cả làng bấm Sẵn sàng là bỏ phiếu sớm; phiếu công khai (ai chỉ ai).
   Người chết nói chuyện ở kênh Hồn ma. Bot: sói dồn cùng 1 mục tiêu, tiên tri soi người chưa soi, thấy sói là ban ngày lên tiếng, cả làng dồn phiếu theo */
const ROLE={soi:'Sói',tientri:'Tiên tri',baove:'Bảo vệ',phuthuy:'Phù thuỷ',thosan:'Thợ săn',dan:'Dân làng'};
class MaSoi extends Table{
  constructor(d){ super(d); this.ps=[]; this.fee=0; this.st='wait'; this.end_=0; this.day=0; this.chat=[]; }
  seated(){ return this.ps.filter(p=>p.pl).map(p=>p.pl); }
  idx(pl){ return this.ps.findIndex(p=>p.pl===pl); }
  join(pl,o){ if(this.idx(pl)>=0) return {}; const M=CL.masoi; if(this.st!=='wait'&&this.st!=='end'||this.ps.length>=M.max) return this.watchOnly(pl);
    if(!this.ps.length){ const f=o.fee|0; if(!M.fees.includes(f)) return {err:'Phí không hợp lệ'}; this.fee=f; }
    if(pl.prof.money<this.fee) return {err:`Bàn này phí ${fmt(this.fee)}, không đủ tiền`};
    this.ps.push({pl,name:pl.prof.name,role:null,alive:true}); this.watch.delete(pl); pl.table=this; this.say(`${pl.prof.name} vào bàn (${this.ps.length}/${M.max})`); this.push(); return {}; }
  talk(i,m,to){ const p=this.ps[i]; this.chat.push({n:p.name,m,to}); if(this.chat.length>50) this.chat.shift(); }
  rolesFor(n){ const r=['soi',...(n>=8?['soi']:[]),'tientri','baove',...(n>=7?['phuthuy']:[]),...(n>=9?['thosan']:[])]; while(r.length<n) r.push('dan'); return r; }
  act(pl,m){ const i=this.idx(pl), me=this.ps[i], M=CL.masoi; if(i<0) return {err:'Chưa vào bàn'};
    if(m.op==='hire'){ if(this.st!=='wait'&&this.st!=='end') return {err:'Đang chơi'}; const B=CL.bots, need=Math.max(0,B.masoiSize-this.ps.length); if(!need) return {err:'Bàn đủ người rồi'};
      if(!take(pl,B.masoiHire)) return {err:`Thuê quản trò tìm người ${fmt(B.masoiHire)}, không đủ tiền`};
      for(let k=0;k<need;k++) this.ps.push({pl:mkBot(BN()+' '+(k+1)),name:'',role:null,alive:true}); this.ps.forEach(p=>{ if(isBot(p.pl)) p.name=p.pl.prof.name; });
      this.say(`Quản trò tìm được ${need} người (bot) vào bàn`); this.withBots=true; return this.act(pl,{op:'start'}); }
    if(m.op==='start'){ if(this.st!=='wait'&&this.st!=='end') return {}; if(this.ps.length<M.min) return {err:`Cần ít nhất ${M.min} người · hoặc thuê quản trò tìm người`};
      for(const p of [...this.ps]) if(!takeP(p.pl,this.fee)){ note(p.pl,'Không đủ phí, rời bàn'); this.leave(p.pl); }
      if(this.ps.length<M.min) return {err:'Không đủ người'};
      const n=this.ps.length, roles=this.rolesFor(n); for(let k=roles.length-1;k>0;k--){ const j=rnd(k+1); [roles[k],roles[j]]=[roles[j],roles[k]]; }
      this.ps.forEach((p,k)=>{ p.role=roles[k]; p.alive=true; p.seen=[]; p.why=''; p.shot=false; }); this.potion={save:true,poison:true}; this.claim=-1; this.seerClaim=-1; this.reveal=null; this.winner=null; this.lastNight=null;
      this.pot=this.fee*n; this.day=0; this.chat=[]; this.lastGuard=-1; this.log=[]; this.say(`Bắt đầu! ${n} người · vai: ${[...new Set(roles)].map(r=>ROLE[r]+(roles.filter(x=>x===r).length>1?' ×'+roles.filter(x=>x===r).length:'')).join(', ')} · pot ${fmt(this.pot)}`); this.night(); return {}; }
    if(m.op==='chat'){ const msg=String(m.m||'').replace(/[<>]/g,'').slice(0,100).trim(); if(!msg) return {};
      if(!me.alive){ this.talk(i,msg,'dead'); this.push(); return {}; }   /* kênh hồn ma: chỉ người chết thấy */
      if(this.st==='night'){ if(me.role!=='soi') return {err:'Ban đêm chỉ sói nói chuyện được'}; this.talk(i,msg,'soi'); }
      else this.talk(i,msg,'all'); this.push(); return {}; }
    const tg=m.target|0, T_=this.ps[tg];
    if(this.st==='hunt'&&m.op==='shoot'){ if(!this.hunt||this.hunt.i!==i) return {err:'Không phải lượt bắn của bạn'}; if(!T_||!T_.alive||tg===i) return {err:'Chọn 1 người còn sống'}; return this.shoot(tg); }
    if(!me.alive) return {err:'Bạn đã chết'};
    if(this.st==='night'){
      if(m.op==='kill'&&me.role==='soi'){ if(!T_||!T_.alive||T_.role==='soi') return {err:'Chọn dân làng còn sống'}; this.acts.kill[i]=tg; this.target=this.wolfTarget(); }
      else if(m.op==='see'&&me.role==='tientri'){ if(!T_||!T_.alive||tg===i||this.acts.see!==null) return {err:'Chọn 1 người khác'}; this.acts.see=tg; me.seen.push({n:T_.name,i:tg,soi:T_.role==='soi'}); }
      else if(m.op==='guard'&&me.role==='baove'){ if(!T_||!T_.alive||tg===this.lastGuard) return {err:'Không bảo vệ cùng 1 người 2 đêm liền'}; this.acts.guard=tg; }
      else if(me.role==='phuthuy'&&['save','poison','wskip'].includes(m.op)){ const W=this.acts.witch; if(W.done) return {err:'Đêm nay bạn đã quyết rồi'};
        if(m.op==='save'){ if(!this.potion.save) return {err:'Đã dùng bình cứu'}; if(this.target<0) return {err:'Sói chưa chọn ai'}; W.save=true; }
        if(m.op==='poison'){ if(!this.potion.poison) return {err:'Đã dùng bình độc'}; if(!T_||!T_.alive||tg===i) return {err:'Chọn 1 người còn sống'}; W.poison=tg; }
        W.done=true; }
      else return {err:'Không phải lượt của bạn'};
      if(this.nightDone()) this.resolveNight(); else this.push(); return {}; }
    if(this.st==='day'&&m.op==='ready'){ this.ready[i]=1; this.checkReady(); return {}; }
    if(this.st==='vote'&&m.op==='vote'){ if(tg!==-1&&(!T_||!T_.alive)) return {err:'Chọn người còn sống'}; this.votes[i]=tg; if(this.alive().every(p=>this.votes[this.ps.indexOf(p)]!==undefined)) this.resolveVote(); else this.push(); return {}; }
    return {err:'Chưa tới lúc'}; }
  alive(role){ return this.ps.filter(p=>p.alive&&(!role||p.role===role)); }
  // mục tiêu của bầy sói: người nhiều sói chọn nhất (hoà thì người được chọn trước)
  wolfTarget(){ const tally={}, order=[]; for(const t of Object.values(this.acts.kill)){ if(tally[t]===undefined) order.push(t); tally[t]=(tally[t]||0)+1; } let top=-1, best=0; for(const t of order) if(tally[t]>best){ best=tally[t]; top=+t; } return top; }
  night(){ this.st='night'; this.day++; this.acts={kill:{},see:null,guard:null,witch:{save:false,poison:-1,done:false}}; this.target=-1; this.end_=now()+CL.masoi.night*1000; this.say(`Đêm ${this.day}: cả làng đi ngủ, sói thức dậy`); this.push(); }
  witchBusy(){ const w=this.alive('phuthuy')[0]; return !!w&&!this.acts.witch.done&&(this.potion.save||this.potion.poison); }
  nightDone(){ const w=this.alive('soi'); return w.every(p=>this.acts.kill[this.ps.indexOf(p)]!==undefined)&&(!this.alive('tientri').length||this.acts.see!==null)&&(!this.alive('baove').length||this.acts.guard!==null)&&!this.witchBusy(); }
  kill(k,why){ const p=this.ps[k]; if(!p||!p.alive) return; p.alive=false; p.why=why; (this.dead=this.dead||[]).push({i:k,name:p.name,role:ROLE[p.role],why}); }
  resolveNight(){ const t=this.wolfTarget(), W=this.acts.witch; this.lastGuard=this.acts.guard??-1; this.dead=[];
    if(t>=0&&t!==this.acts.guard&&!W.save) this.kill(t,'bị sói cắn'); else if(t>=0) this.say(W.save?'Đêm qua Phù thuỷ đã cứu được người bị sói cắn':'Đêm qua sói ra tay nhưng Bảo vệ đã che chắn kịp');
    if(W.save) this.potion.save=false; if(W.poison>=0){ this.potion.poison=false; this.kill(W.poison,'trúng độc của Phù thuỷ'); }
    this.lastNight=this.dead.slice(); if(this.dead.length) for(const d of this.dead) this.say(`☠ Sáng ra, ${d.name} đã ${d.why} (${d.role})`); else if(t<0) this.say('Đêm qua bình yên');
    this.afterDeaths('day'); }
  // có Thợ săn vừa chết thì cho bắn trước, rồi kiểm tra thắng thua, rồi sang pha kế
  afterDeaths(then){ const h=(this.dead||[]).find(d=>this.ps[d.i].role==='thosan'&&!this.ps[d.i].shot); this.dead=[];
    if(h&&!this.check(true)){ this.ps[h.i].shot=true; this.hunt={i:h.i,then}; this.st='hunt'; this.end_=now()+CL.masoi.hunt*1000; this.say(`🏹 Thợ săn ${h.name} gục xuống, giương cung lần cuối...`); this.push(); return; }
    if(this.check()) return; if(then==='day'){ this.st='day'; this.ready={}; this.end_=now()+CL.masoi.day*1000; this.push(); } else this.night(); }
  shoot(tg){ const H=this.hunt; this.hunt=null; if(tg>=0){ this.kill(tg,'trúng tên Thợ săn'); this.say(`🏹 Thợ săn bắn chết ${this.ps[tg].name} (${ROLE[this.ps[tg].role]})`); } else this.say('Thợ săn buông cung, không bắn ai'); this.dead=[]; this.afterDeaths(H?H.then:'day'); return {}; }
  checkReady(){ const al=this.alive(), n=al.filter(p=>this.ready[this.ps.indexOf(p)]).length; if(n>=Math.ceil(al.length*.6)){ this.toVote(); return; } this.push(); }
  toVote(){ this.st='vote'; this.votes={}; this.end_=now()+CL.masoi.vote*1000; this.say('Bỏ phiếu treo cổ! Phiếu công khai, đổi được tới hết giờ'); this.push(); }
  resolveVote(){ const tally={}; for(const t of Object.values(this.votes)) if(t>=0) tally[t]=(tally[t]||0)+1;
    const arr=Object.entries(tally).sort((a,b)=>b[1]-a[1]); this.dead=[];
    if(arr.length&&(arr.length===1||arr[0][1]>arr[1][1])){ const k=+arr[0][0], p=this.ps[k]; this.kill(k,'bị cả làng treo cổ'); this.say(`⚖ Cả làng treo cổ ${p.name} (${arr[0][1]} phiếu): là ${ROLE[p.role]}`); if(this.claim===k) this.claim=-1; }
    else this.say('Phiếu hoà, không ai bị treo cổ'); this.afterDeaths('night'); }
  check(peek){ const w=this.alive('soi').length, o=this.alive().length-w; let team=null;
    if(w===0) team='dan'; else if(w>=o) team='soi'; if(!team||peek) return !!team;
    const win=this.ps.filter(p=>(p.role==='soi')===(team==='soi')), lose=this.ps.filter(p=>!win.includes(p)), here=win.filter(p=>p.pl&&!isBot(p.pl));
    const pot=Math.round(this.pot*(this.withBots?CL.bots.masoiBonus:1)), share=here.length?Math.floor(pot/here.length):0;    // chơi với bot: nhà cái bù, ăn nhiều hơn
    for(const p of here){ give(p.pl,this.withBots&&share>this.fee?this.fee+botPay(p.pl,share-this.fee):share);   /* bàn có bot: phần lãi tính vào trần thắng bot */ reward(p.pl,{exp:CL.masoi.winExp+(p.alive?10:0),kind:'game'},`Ma sói: phe ${team==='soi'?'Sói':'Dân làng'} thắng${share?' · +'+fmt(share):''}`); }
    for(const p of lose) if(p.pl&&!isBot(p.pl)){ const extra=this.withBots?Math.min(p.pl.prof.money,Math.round(this.fee*(CL.bots.masoiBonus-1))):0; if(extra) take(p.pl,extra);   // chơi với bot: thua mất thêm
      reward(p.pl,{exp:CL.masoi.loseExp,kind:'game'},`Ma sói: thua rồi${extra?' · mất thêm '+fmt(extra)+' (bàn có bot)':''}`); }
    this.reveal=this.ps.map(p=>({name:p.name,role:ROLE[p.role],alive:p.alive,win:win.includes(p),why:p.why||''}));   // lật bài cả bàn sau ván
    this.say(team==='soi'?'🐺 Sói đã thắng!':'🏡 Dân làng đã diệt hết sói!'); this.st='end'; this.winner=team; this.end_=0; this.hunt=null; this.push();
    this.ps=this.ps.filter(p=>p.pl&&!isBot(p.pl)); this.withBots=false; return true; }
  leave(pl){ const i=this.idx(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ const p=this.ps[i]; this.say(`${p.name} rời bàn`);
      if(['night','day','vote','hunt'].includes(this.st)){ p.pl=null; if(p.alive){ p.alive=false; p.why='bỏ làng ra đi'; this.say(`${p.name} bỏ làng ra đi (${ROLE[p.role]})`); } if(this.hunt&&this.hunt.i===i) this.shoot(-1); else this.check(); }
      else this.ps.splice(i,1); }
    this.push(); }
  // bot ma sói: sói dồn 1 mục tiêu (ưu tiên người tự nhận tiên tri), tiên tri soi người chưa soi và lên tiếng khi thấy sói, phù thuỷ cứu người / đầu độc sói bị lộ,
  // ban ngày nói chuyện, bấm sẵn sàng, bỏ phiếu theo người bị tố là sói / theo số đông; thợ săn bắn người bị tố
  botsAct(t){ if(!this.ps.some(p=>isBot(p.pl))) return; const alive=this.alive(), idx=p=>this.ps.indexOf(p), pick=a=>a[rnd(a.length)], claimed=this.claim>=0&&this.ps[this.claim]&&this.ps[this.claim].alive?this.claim:-1;
    for(const p of this.ps){ if(!isBot(p.pl)||(p.next&&t<p.next)) continue; p.next=t+1500+rnd(3000); const i=idx(p);
      if(this.st==='hunt'&&this.hunt&&this.hunt.i===i){ const c=alive.filter(x=>x!==p); this.act(p.pl,{op:'shoot',target:claimed>=0?claimed:c.length?idx(pick(c)):-1}); continue; }
      if(!p.alive) continue;
      if(this.st==='night'){ if(p.role==='soi'&&this.acts.kill[i]===undefined){ const seer=this.seerClaim>=0&&this.ps[this.seerClaim].alive&&this.ps[this.seerClaim].role!=='soi'?this.seerClaim:-1, cur=this.wolfTarget(), c=alive.filter(x=>x.role!=='soi');
          if(c.length) this.act(p.pl,{op:'kill',target:cur>=0?cur:seer>=0?seer:idx(pick(c))}); }
        if(p.role==='tientri'&&this.acts.see===null){ const c=alive.filter(x=>x!==p&&!p.seen.some(s=>s.i===idx(x))); if(c.length) this.act(p.pl,{op:'see',target:idx(pick(c))}); }
        if(p.role==='baove'&&this.acts.guard===null){ const c=alive.filter(x=>idx(x)!==this.lastGuard); if(c.length) this.act(p.pl,{op:'guard',target:idx(c.find(x=>idx(x)===this.seerClaim)||pick(c))}); }
        if(p.role==='phuthuy'&&!this.acts.witch.done&&(this.target>=0||t>this.end_-12000)){ if(this.potion.save&&this.target>=0&&(this.target===i||rnd(2))) this.act(p.pl,{op:'save'}); else if(this.potion.poison&&claimed>=0&&claimed!==i) this.act(p.pl,{op:'poison',target:claimed}); else this.act(p.pl,{op:'wskip'}); } }
      else if(this.st==='day'){ const sw=p.role==='tientri'&&p.seen.find(s=>s.soi&&this.ps[s.i].alive);
        if(sw&&this.claim!==sw.i){ this.claim=sw.i; this.seerClaim=i; this.act(p.pl,{op:'chat',m:`Tôi là Tiên tri! Đêm qua tôi soi ${sw.n}: là SÓI!`}); continue; }
        if(rnd(3)===0){ const o=pick(alive.filter(x=>x!==p)); if(o) this.act(p.pl,{op:'chat',m:claimed>=0&&p.role!=='soi'?pick([`Treo ${this.ps[claimed].name} đi mọi người!`,`Tin tiên tri, ${this.ps[claimed].name} là sói`]):p.role==='soi'&&claimed>=0?pick(['Tiên tri đó là giả đấy, đừng tin',`${o.name} mới đáng nghi`]):pick([`Tôi thấy ${o.name} đáng nghi lắm`,'Tôi là dân thường thôi','Đêm qua tôi ngủ say','Ai là tiên tri lên tiếng đi',`${o.name} im lặng quá`])}); }
        const humans=alive.filter(x=>!isBot(x.pl)), hReady=humans.every(x=>this.ready[idx(x)]);   /* bot chỉ sẵn sàng sau nửa ban ngày, hoặc khi mọi người thật đã sẵn sàng */
        if(!this.ready[i]&&(hReady||t>this.end_-CL.masoi.day*500)&&rnd(2)) this.act(p.pl,{op:'ready'}); }
      else if(this.st==='vote'&&this.votes[i]===undefined){ const tally={}; for(const v of Object.values(this.votes)) if(v>=0) tally[v]=(tally[v]||0)+1; const lead=+(Object.entries(tally).sort((a,b)=>b[1]-a[1])[0]||[-1])[0];
        let tg=-1; if(p.role==='soi'){ const c=alive.filter(x=>x.role!=='soi'); tg=this.seerClaim>=0&&this.ps[this.seerClaim].alive&&this.ps[this.seerClaim].role!=='soi'?this.seerClaim:c.length?idx(pick(c)):-1; }
        else if(claimed>=0&&claimed!==i) tg=claimed; else if(rnd(4)===0&&this.alive('soi').length) tg=idx(pick(this.alive('soi')));   /* dân bot thỉnh thoảng đoán trúng sói: cân bằng 2 phe */
        else if(lead>=0&&lead!==i&&rnd(2)) tg=lead; else { const c=alive.filter(x=>x!==p); tg=c.length?idx(pick(c)):-1; }
        this.act(p.pl,{op:'vote',target:tg}); } } }
  tick(t){ if(['night','day','vote','hunt'].includes(this.st)) this.botsAct(t);
    if(!this.end_||t<this.end_) return;
    if(this.st==='night') this.resolveNight();
    else if(this.st==='day') this.toVote();
    else if(this.st==='vote') this.resolveVote();
    else if(this.st==='hunt') this.shoot(-1); }
  view(pl){ const i=this.idx(pl), me=this.ps[i], over=this.st==='end', ghost=!!me&&!me.alive,   /* chỉ người chơi đã chết thấy kênh Hồn ma (người xem / peek không thấy, người chết hay lộ vai) */ M=CL.masoi, wolf=me&&me.role==='soi';
    return {id:this.id,game:'masoi',name:this.def.name,st:this.st,fee:this.fee,pot:this.pot||0,day:this.day,me:i,left:this.end_?Math.max(0,this.end_-now()):0,winner:this.winner||null,
      phaseMs:(M[{night:'night',day:'day',vote:'vote',hunt:'hunt'}[this.st]]||0)*1000,roles:this.st!=='wait'&&this.ps.length?this.rolesFor(this.ps.length).map(r=>ROLE[r]):[],
      role:me&&me.role,roleName:me&&me.role&&ROLE[me.role],seen:me&&me.role==='tientri'?me.seen:[],lastGuard:me&&me.role==='baove'?this.lastGuard:-1,
      witch:me&&me.role==='phuthuy'&&this.st==='night'?{save:!!(this.potion&&this.potion.save),poison:!!(this.potion&&this.potion.poison),target:this.target,targetName:this.target>=0?this.ps[this.target].name:'',done:!!(this.acts&&this.acts.witch.done)}:me&&me.role==='phuthuy'?{save:!!(this.potion&&this.potion.save),poison:!!(this.potion&&this.potion.poison)}:null,
      wolfTarget:wolf&&this.st==='night'?this.target:-1,hunt:this.st==='hunt'&&this.hunt?{i:this.hunt.i,name:this.ps[this.hunt.i].name,me:this.hunt.i===i}:null,
      lastNight:this.lastNight||null,ready:this.st==='day'&&this.ready?Object.keys(this.ready).length:0,readyNeed:this.st==='day'?Math.ceil(this.alive().length*.6):0,iReady:!!(this.st==='day'&&this.ready&&this.ready[i]),
      players:this.ps.map((p,k)=>({name:p.name,alive:p.alive,here:!!p.pl,why:p.alive?'':p.why||'',role:(over||!p.alive||k===i||(wolf&&p.role==='soi'))&&p.role?ROLE[p.role]:'',soi:(over||k===i||wolf)&&p.role==='soi'})),
      myAct:this.st==='night'&&this.acts&&me?(me.role==='soi'?this.acts.kill[i]:me.role==='tientri'?this.acts.see:me.role==='baove'?this.acts.guard:me.role==='phuthuy'?this.acts.witch.poison:null):null,
      votes:this.st==='vote'?this.votes:null,reveal:over?this.reveal||null:null,nightMs:M.night*1000,
      chat:this.chat.filter(c=>c.to==='all'||(c.to==='soi'&&wolf)||(c.to==='dead'&&ghost)),ghost,log:this.log,min:M.min,max:M.max}; } }

const TABLES={}; for(const d of CL.tables) TABLES[d.id]=d.game==='chess'?new Chess(d):d.game==='poker'?new Poker(d):new MaSoi(d);
on('tbl',(pl,m)=>{ const t=TABLES[m.id];
  if(m.op==='leave'){ if(pl.table) pl.table.leave(pl); return {}; }
  if(!t) return {err:'Không có bàn này'}; if(pl.scene!=='club') return {err:'Vào Nhà giải trí đã'};
  if(m.op==='join'){ if(!near(pl,t.def.x,t.def.y,56)) return {err:'Lại gần bàn đã'}; if(pl.table&&pl.table!==t) pl.table.leave(pl); return t.join(pl,m); }
  if(m.op==='peek') return {v:t.view(pl)};
  if(pl.table!==t) return {err:'Chưa ngồi bàn này'}; return t.act(pl,m); });
hook('tick',()=>{ const t=now(); for(const tb of Object.values(TABLES)) tb.tick(t); });
// đồng hồ cờ / thời gian lượt chạy nên đẩy lại mỗi giây
hook('slow',()=>{ for(const tb of Object.values(TABLES)) if(['play','night','day','vote','hunt'].includes(tb.st)) tb.push(); });
hook('leave',(pl,old)=>{ if(old==='club'&&pl.table) pl.table.leave(pl); });
module.exports={TABLES};
