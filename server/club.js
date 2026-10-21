// Nhà giải trí cạnh Deck: bàn cờ vua, poker Texas Hold'em, ma sói. Server giữ tiền cược và trả cho người thắng.
'use strict';
const C=require('./core'), PK=require('./poker');
const CHESS=require('../chande-bootcamp/shared/chess.js');
const crypto=require('crypto');
const {S,on,hook,send,now,near,take,give,reward,note,players}=C;
const CL=S.CLUB, fmt=S.fmt;
const rnd=n=>crypto.randomInt(n);

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
    for(const s of this.seats){ if(take(s.pl,this.bet)) paid.push(s); else { for(const p of paid) give(p.pl,this.bet); note(s.pl,'Không đủ tiền cược, rời bàn'); this.leave(s.pl); return; } }
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
    if(m.op==='rematch'){ if(this.st!=='end'||i<0) return {}; this.rematch[i]=true; if(this.rematch.every(Boolean)&&this.seats.every(Boolean)) this.start(); else this.push(); return {}; }
    return {err:'?'}; }
  end(w,why){ this.st='end'; const pot=this.bet*2;
    if(w<0){ for(const s of this.seats) if(s){ give(s.pl,this.bet); reward(s.pl,{exp:CL.chess.drawExp,kind:'game'},'Cờ vua: hoà ('+why+')'); } this.say('Hoà: '+why); }
    else { const W=this.seats[w], L=this.seats[1-w]; if(W){ give(W.pl,pot); reward(W.pl,{exp:CL.chess.winExp,kind:'game'},`Thắng cờ vua (${why})${pot?' · +'+fmt(pot):''}`); }
      if(L&&L.pl.ws) note(L.pl,`Thua cờ vua (${why})${this.bet?' · -'+fmt(this.bet):''}`,'lock'); this.say(`${W?W.name:'?'} thắng: ${why}`); }
    this.result={w,why}; this.push(); }
  leave(pl){ const i=this.seatOf(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ if(this.st==='play') this.end(1-i,`${this.seats[i].name} rời bàn`); this.seats[i]=null; this.say(`${pl.prof.name} rời bàn`);
      this.st='wait'; this.rematch=[false,false]; if(!this.seats.some(Boolean)){ this.bet=0; this.g=null; this.result=null; } }
    this.push(); }
  tick(t){ if(this.st!=='play') return; const i=this.g.turn==='w'?0:1; if(this.clock[i]-(t-this.turnAt)<=0){ this.clock[i]=0; this.end(1-i,'hết giờ'); } }
  view(pl){ const t=now(), i=this.g?(this.g.turn==='w'?0:1):-1, cl=this.clock.map((c,k)=>this.st==='play'&&k===i?c-(t-this.turnAt):c);
    return {id:this.id,game:'chess',name:this.def.name,st:this.st,bet:this.bet,seats:this.seats.map(s=>s&&{name:s.name,id:s.pl.pid}),me:this.seatOf(pl),
      b:this.g&&this.g.b,turn:this.g&&this.g.turn,castle:this.g&&this.g.castle,ep:this.g?this.g.ep:-1,last:this.g&&this.g.last,check:this.g&&this.st==='play'&&CHESS.inCheck(this.g),
      clock:cl,draw:this.draw,result:this.result,rematch:this.rematch,watchers:this.watch.size,moves:this.moves||[],log:this.log}; } }

/* ---------- poker Texas Hold'em (no-limit) ---------- */
class Poker extends Table{
  constructor(d){ super(d); this.seats=Array(CL.poker.seats).fill(null); this.st='wait'; this.dealer=-1; this.board=[]; this.next=0; this.toAct=-1; this.cur=0; this.minRaise=0; this.show=null; }
  seated(){ return this.seats.filter(s=>s&&s.pl).map(s=>s.pl); }
  seatOf(pl){ return this.seats.findIndex(s=>s&&s.pl===pl); }
  join(pl,o){ if(this.seatOf(pl)>=0) return {}; const free=this.seats.indexOf(null); if(free<0) return this.watchOnly(pl);
    const P=CL.poker, buy=Math.round(o.buy||0); if(buy<P.minBuy||buy>P.maxBuy) return {err:`Mua chip từ ${fmt(P.minBuy)} tới ${fmt(P.maxBuy)}`};
    if(!take(pl,buy)) return {err:'Không đủ tiền mua chip'};
    this.seats[free]={pl,name:pl.prof.name,chips:buy,bet:0,tot:0,cards:null,fold:true,allin:false,acted:false,inHand:false}; this.watch.delete(pl); pl.table=this;
    this.say(`${pl.prof.name} vào bàn với ${fmt(buy)}`); if(this.st==='wait') this.next=now()+3000; this.push(); return {}; }
  live(){ return this.seats.map((s,i)=>[s,i]).filter(([s])=>s&&s.inHand&&!s.fold); }
  nextIdx(from,pred){ for(let k=1;k<=this.seats.length;k++){ const i=(from+k)%this.seats.length, s=this.seats[i]; if(s&&pred(s,i)) return i; } return -1; }
  startHand(){ const P=CL.poker; for(const [i,s] of this.seats.entries()) if(s&&!s.pl){ this.seats[i]=null; }
    const ready=this.seats.filter(s=>s&&s.chips>=P.big); if(ready.length<2){ this.st='wait'; this.push(); return; }
    this.deck=PK.deck(); this.board=[]; this.show=null;
    for(const s of this.seats) if(s){ const ok=s.chips>=P.big; Object.assign(s,{bet:0,tot:0,fold:!ok,allin:false,acted:false,inHand:ok,cards:ok?[this.deck.pop(),this.deck.pop()]:null,best:null}); }
    this.dealer=this.nextIdx(this.dealer,s=>s.inHand);
    const heads=ready.length===2, sb=heads?this.dealer:this.nextIdx(this.dealer,s=>s.inHand), bb=this.nextIdx(sb,s=>s.inHand);
    this.put(this.seats[sb],Math.min(P.small,this.seats[sb].chips)); this.put(this.seats[bb],Math.min(P.big,this.seats[bb].chips));
    this.cur=P.big; this.minRaise=P.big; this.street=0; this.st='play';
    this.toAct=this.nextIdx(bb,s=>s.inHand&&!s.fold&&!s.allin); this.turnAt=now(); this.say(`Ván mới · ${this.seats[sb].name} mù nhỏ, ${this.seats[bb].name} mù lớn`); this.push(); }
  put(s,v){ v=Math.min(v,s.chips); s.chips-=v; s.bet+=v; s.tot+=v; if(s.chips===0) s.allin=true; }
  act(pl,m){ const i=this.seatOf(pl), s=this.seats[i];
    if(m.op==='rebuy'){ if(!s||s.inHand&&!s.fold&&this.st==='play') return {err:'Đang trong ván'}; const buy=Math.round(m.buy||0), P=CL.poker;
      if(buy<P.big||s.chips+buy>P.maxBuy) return {err:'Số chip không hợp lệ'}; if(!take(pl,buy)) return {err:'Không đủ tiền'}; s.chips+=buy; if(this.st==='wait') this.next=now()+2000; this.push(); return {}; }
    if(this.st!=='play'||i!==this.toAct) return {err:'Chưa tới lượt'};
    const need=this.cur-s.bet;
    if(m.op==='fold'){ s.fold=true; this.say(`${s.name} bỏ bài`); }
    else if(m.op==='check'){ if(need>0) return {err:'Phải theo hoặc bỏ'}; this.say(`${s.name} xem bài`); }
    else if(m.op==='call'){ if(need<=0) return {err:'Không có gì để theo'}; this.put(s,need); this.say(`${s.name} theo ${fmt(Math.min(need,s.bet))}`); }
    else if(m.op==='raise'||m.op==='allin'){ const max=s.bet+s.chips, to=m.op==='allin'?max:Math.round(m.to||0);
      if(to>max) return {err:'Không đủ chip'}; if(to<=this.cur){ if(m.op==='allin'){ this.put(s,s.chips); this.say(`${s.name} all-in`); } else return {err:'Phải tố cao hơn mức hiện tại'}; }
      else { if(to<this.cur+this.minRaise&&to<max) return {err:`Tố ít nhất tới ${fmt(this.cur+this.minRaise)}`};
        if(to-this.cur>=this.minRaise) this.minRaise=to-this.cur; this.cur=to; this.put(s,to-s.bet);
        for(const o of this.seats) if(o&&o!==s&&o.inHand&&!o.fold&&!o.allin) o.acted=false; this.say(`${s.name} ${s.allin?'all-in':'tố lên'} ${fmt(to)}`); } }
    else return {err:'?'};
    s.acted=true; this.advance(); return {}; }
  advance(){ const live=this.live(); if(live.length===1){ this.win([[live[0][0],this.potTotal()]],false); return; }
    // xong vòng cược: ai còn chip đều đã hành động và bằng mức cược; còn đúng 1 người có chip thì chỉ cần đã theo đủ
    const need=live.map(x=>x[0]).filter(s=>!s.allin);
    const done=need.length===0||(need.length===1?need[0].bet>=this.cur:need.every(s=>s.acted&&s.bet===this.cur));
    if(!done){ this.toAct=this.nextIdx(this.toAct,s=>s.inHand&&!s.fold&&!s.allin&&(!s.acted||s.bet<this.cur)); this.turnAt=now(); this.push(); return; }
    for(const s of this.seats) if(s){ s.bet=0; s.acted=false; } this.cur=0; this.minRaise=CL.poker.big;
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
  win(list,show){ const P=CL.poker;
    for(const [s,v] of list){ s.chips+=v; const profit=v-s.tot; this.say(`${s.name} ăn ${fmt(v)}${show&&s.best?' · '+s.best.name:''}`);
      if(s.pl&&profit>0) reward(s.pl,{exp:5+Math.min(45,Math.floor(profit/20000)),kind:'game'},`Poker: ăn ${fmt(v)}`); }
    this.show=show?this.seats.map(s=>s&&s.inHand&&!s.fold&&s.best?{cards:s.cards,name:s.best.name}:null):null;
    this.st='show'; this.toAct=-1; this.next=now()+(show?6000:3000); this.push(); }
  leave(pl){ const i=this.seatOf(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ const s=this.seats[i]; if(s.chips>0) give(pl,s.chips); this.say(`${s.name} rời bàn, đổi ${fmt(s.chips)} chip ra tiền`); s.chips=0;
      if(this.st==='play'&&s.inHand){ s.pl=null; if(!s.fold){ s.fold=true; if(this.toAct===i||this.live().length<=1) this.advance(); } }   // giữ ghế tới hết ván để tính pot
      else this.seats[i]=null; }
    this.push(); }
  tick(t){ if(this.st==='play'&&t-this.turnAt>CL.poker.turn*1000){ const s=this.seats[this.toAct]; if(s){ if(this.cur-s.bet>0) s.fold=true; s.acted=true; this.say(`${s.name} hết giờ`); this.advance(); } }
    if((this.st==='show'||this.st==='wait')&&this.next&&t>=this.next){ this.next=0; this.startHand(); } }
  view(pl){ const me=this.seatOf(pl);
    return {id:this.id,game:'poker',name:this.def.name,st:this.st,me,dealer:this.dealer,toAct:this.toAct,cur:this.cur,minRaise:this.minRaise,board:this.board,pot:this.potTotal(),
      left:this.st==='play'?Math.max(0,CL.poker.turn*1000-(now()-this.turnAt)):0,blinds:[CL.poker.small,CL.poker.big],
      seats:this.seats.map((s,i)=>s&&{name:s.name,chips:s.chips,bet:s.bet,fold:s.fold,allin:s.allin,inHand:s.inHand,cards:i===me&&s.cards?s.cards:(this.show&&this.show[i]?this.show[i].cards:(s.inHand&&s.cards?['??','??']:null)),hand:this.show&&this.show[i]?this.show[i].name:''}),
      log:this.log,watchers:this.watch.size}; } }

/* ---------- ma sói ---------- */
const ROLE={soi:'Sói',tientri:'Tiên tri',baove:'Bảo vệ',dan:'Dân làng'};
class MaSoi extends Table{
  constructor(d){ super(d); this.ps=[]; this.fee=0; this.st='wait'; this.end_=0; this.day=0; this.chat=[]; }
  seated(){ return this.ps.filter(p=>p.pl).map(p=>p.pl); }
  idx(pl){ return this.ps.findIndex(p=>p.pl===pl); }
  join(pl,o){ if(this.idx(pl)>=0) return {}; const M=CL.masoi; if(this.st!=='wait'||this.ps.length>=M.max) return this.watchOnly(pl);
    if(!this.ps.length){ const f=o.fee|0; if(!M.fees.includes(f)) return {err:'Phí không hợp lệ'}; this.fee=f; }
    if(pl.prof.money<this.fee) return {err:`Bàn này phí ${fmt(this.fee)}, không đủ tiền`};
    this.ps.push({pl,name:pl.prof.name,role:null,alive:true}); this.watch.delete(pl); pl.table=this; this.say(`${pl.prof.name} vào bàn (${this.ps.length}/${M.max})`); this.push(); return {}; }
  talk(i,m,to){ const p=this.ps[i]; this.chat.push({n:p.name,m,to}); if(this.chat.length>40) this.chat.shift(); }
  act(pl,m){ const i=this.idx(pl), me=this.ps[i], M=CL.masoi; if(i<0) return {err:'Chưa vào bàn'};
    if(m.op==='start'){ if(this.st!=='wait'&&this.st!=='end') return {}; if(this.ps.length<M.min) return {err:`Cần ít nhất ${M.min} người`};
      for(const p of [...this.ps]) if(!take(p.pl,this.fee)){ note(p.pl,'Không đủ phí, rời bàn'); this.leave(p.pl); }
      if(this.ps.length<M.min) return {err:'Không đủ người'};
      const n=this.ps.length, roles=['soi',...(n>=8?['soi']:[]),'tientri','baove']; while(roles.length<n) roles.push('dan');
      roles.sort(()=>rnd(3)-1); this.ps.forEach((p,k)=>{ p.role=roles[k]; p.alive=true; p.seen=[]; });
      this.pot=this.fee*n; this.day=0; this.chat=[]; this.lastGuard=-1; this.log=[]; this.say(`Bắt đầu! ${n} người · ${roles.filter(r=>r==='soi').length} sói · pot ${fmt(this.pot)}`); this.night(); return {}; }
    if(m.op==='chat'){ const msg=String(m.m||'').replace(/[<>]/g,'').slice(0,100).trim(); if(!msg||!me.alive) return {};
      if(this.st==='night'){ if(me.role!=='soi') return {err:'Ban đêm chỉ sói nói chuyện được'}; this.talk(i,msg,'soi'); }
      else if(this.st==='day'||this.st==='vote'||this.st==='wait'||this.st==='end') this.talk(i,msg,'all'); this.push(); return {}; }
    const tg=m.target|0, T_=this.ps[tg]; if(!me.alive) return {err:'Bạn đã chết'};
    if(this.st==='night'){
      if(m.op==='kill'&&me.role==='soi'){ if(!T_||!T_.alive||T_.role==='soi') return {err:'Chọn dân làng còn sống'}; this.acts.kill[i]=tg; }
      else if(m.op==='see'&&me.role==='tientri'){ if(!T_||!T_.alive||tg===i||this.acts.see!==null) return {err:'Chọn 1 người khác'}; this.acts.see=tg; me.seen.push({n:T_.name,soi:T_.role==='soi'}); }
      else if(m.op==='guard'&&me.role==='baove'){ if(!T_||!T_.alive||tg===this.lastGuard) return {err:'Không bảo vệ cùng 1 người 2 đêm liền'}; this.acts.guard=tg; }
      else return {err:'Không phải lượt của bạn'};
      if(this.nightDone()) this.resolveNight(); else this.push(); return {}; }
    if(this.st==='vote'&&m.op==='vote'){ if(tg!==-1&&(!T_||!T_.alive)) return {err:'Chọn người còn sống'}; this.votes[i]=tg; if(this.ps.filter(p=>p.alive).every((p,k)=>this.votes[this.ps.indexOf(p)]!==undefined)) this.resolveVote(); else this.push(); return {}; }
    return {err:'Chưa tới lúc'}; }
  alive(role){ return this.ps.filter(p=>p.alive&&(!role||p.role===role)); }
  night(){ this.st='night'; this.day++; this.acts={kill:{},see:null,guard:null}; this.end_=now()+CL.masoi.night*1000; this.say(`Đêm ${this.day}: cả làng đi ngủ, sói thức dậy`); this.push(); }
  nightDone(){ const w=this.alive('soi'); return w.every(p=>this.acts.kill[this.ps.indexOf(p)]!==undefined)&&(!this.alive('tientri').length||this.acts.see!==null)&&(!this.alive('baove').length||this.acts.guard!==null); }
  resolveNight(){ const tally={}; for(const t of Object.values(this.acts.kill)) tally[t]=(tally[t]||0)+1; let top=-1, best=0;
    for(const [t,n] of Object.entries(tally)){ if(n>best||(n===best&&rnd(2))){ best=n; top=+t; } }
    this.lastGuard=this.acts.guard??-1;
    if(top>=0&&top!==this.acts.guard){ this.ps[top].alive=false; this.say(`Sáng ra, ${this.ps[top].name} đã bị sói cắn (${ROLE[this.ps[top].role]})`); }
    else this.say(top>=0?'Đêm qua sói ra tay nhưng Bảo vệ đã cứu được người':'Đêm qua bình yên');
    if(this.check()) return; this.st='day'; this.end_=now()+CL.masoi.day*1000; this.push(); }
  resolveVote(){ const tally={}; for(const t of Object.values(this.votes)) if(t>=0) tally[t]=(tally[t]||0)+1;
    const arr=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    if(arr.length&&(arr.length===1||arr[0][1]>arr[1][1])){ const p=this.ps[+arr[0][0]]; p.alive=false; this.say(`Cả làng treo cổ ${p.name}: là ${ROLE[p.role]}`); }
    else this.say('Phiếu hoà, không ai bị treo cổ');
    if(this.check()) return; this.night(); }
  check(){ const w=this.alive('soi').length, o=this.alive().length-w; let team=null;
    if(w===0) team='dan'; else if(w>=o) team='soi'; if(!team) return false;
    const win=this.ps.filter(p=>(p.role==='soi')===(team==='soi')), lose=this.ps.filter(p=>!win.includes(p)), here=win.filter(p=>p.pl);
    const share=here.length?Math.floor(this.pot/here.length):0;
    for(const p of here){ give(p.pl,share); reward(p.pl,{exp:CL.masoi.winExp,kind:'game'},`Ma sói: phe ${team==='soi'?'Sói':'Dân làng'} thắng${share?' · +'+fmt(share):''}`); }
    for(const p of lose) if(p.pl) reward(p.pl,{exp:CL.masoi.loseExp,kind:'game'},'Ma sói: thua rồi');
    this.say(team==='soi'?'Sói đã thắng!':'Dân làng đã diệt hết sói!'); this.st='end'; this.winner=team; this.end_=0; this.push();
    this.ps=this.ps.filter(p=>p.pl); return true; }
  leave(pl){ const i=this.idx(pl); this.watch.delete(pl); if(pl.table===this) pl.table=null;
    if(i>=0){ const p=this.ps[i]; this.say(`${p.name} rời bàn`);
      if(['night','day','vote'].includes(this.st)){ p.pl=null; if(p.alive){ p.alive=false; this.say(`${p.name} bỏ làng ra đi (${ROLE[p.role]})`); } this.check(); }
      else this.ps.splice(i,1); }
    this.push(); }
  tick(t){ if(!this.end_||t<this.end_) return;
    if(this.st==='night') this.resolveNight();
    else if(this.st==='day'){ this.st='vote'; this.votes={}; this.end_=t+CL.masoi.vote*1000; this.say('Hết giờ bàn bạc, bỏ phiếu treo cổ!'); this.push(); }
    else if(this.st==='vote') this.resolveVote(); }
  view(pl){ const i=this.idx(pl), me=this.ps[i], over=this.st==='end';
    return {id:this.id,game:'masoi',name:this.def.name,st:this.st,fee:this.fee,pot:this.pot||0,day:this.day,me:i,left:this.end_?Math.max(0,this.end_-now()):0,winner:this.winner||null,
      role:me&&me.role,roleName:me&&me.role&&ROLE[me.role],seen:me&&me.role==='tientri'?me.seen:[],lastGuard:me&&me.role==='baove'?this.lastGuard:-1,
      players:this.ps.map((p,k)=>({name:p.name,alive:p.alive,here:!!p.pl,role:(over||!p.alive||k===i||(me&&me.role==='soi'&&p.role==='soi'))&&p.role?ROLE[p.role]:'',soi:(over||k===i||(me&&me.role==='soi'))&&p.role==='soi'})),
      myAct:this.st==='night'&&this.acts&&me?(me.role==='soi'?this.acts.kill[i]:me.role==='tientri'?this.acts.see:me.role==='baove'?this.acts.guard:null):null,
      votes:this.st==='vote'?this.votes:null,chat:this.chat.filter(c=>c.to==='all'||(me&&me.role==='soi')),log:this.log,min:CL.masoi.min,max:CL.masoi.max}; } }

const TABLES={}; for(const d of CL.tables) TABLES[d.id]=d.game==='chess'?new Chess(d):d.game==='poker'?new Poker(d):new MaSoi(d);
on('tbl',(pl,m)=>{ const t=TABLES[m.id];
  if(m.op==='leave'){ if(pl.table) pl.table.leave(pl); return {}; }
  if(!t) return {err:'Không có bàn này'}; if(pl.scene!=='club') return {err:'Vào Nhà giải trí đã'};
  if(m.op==='join'){ if(!near(pl,t.def.x,t.def.y,56)) return {err:'Lại gần bàn đã'}; if(pl.table&&pl.table!==t) pl.table.leave(pl); return t.join(pl,m); }
  if(m.op==='peek') return {v:t.view(pl)};
  if(pl.table!==t) return {err:'Chưa ngồi bàn này'}; return t.act(pl,m); });
hook('tick',()=>{ const t=now(); for(const tb of Object.values(TABLES)) tb.tick(t); });
// đồng hồ cờ / thời gian lượt chạy nên đẩy lại mỗi giây
hook('slow',()=>{ for(const tb of Object.values(TABLES)) if(tb.st==='play'||tb.st==='night'||tb.st==='day'||tb.st==='vote') tb.push(); });
hook('leave',(pl,old)=>{ if(old==='club'&&pl.table) pl.table.leave(pl); });
module.exports={TABLES};
