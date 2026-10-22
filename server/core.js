// Lõi server: người chơi đang online, cảnh, gửi tin, tiền/đồ/EXP, chuyển cảnh. Các module tính năng dùng chung file này.
'use strict';
const S=require('../chande-bootcamp/shared/data.js');
const db=require('./db');
const T=S.T;

const players=new Map();       // pid → người chơi
const byUid=new Map();         // uid → người chơi
const scenes=new Map();        // id cảnh → Set người chơi
const handlers={};             // loại tin → hàm xử lý
const hooks={leave:[],enter:[],tick:[],slow:[],login:[],logout:[],day:[],item:[],money:[],exp:[],stat:[]};   // item/money/exp/stat: việc mỗi ngày, sổ sưu tầm đếm theo
let nextPid=1;

const on=(t,fn)=>{ handlers[t]=fn; };
const hook=(k,fn)=>hooks[k].push(fn);
const today=()=>S.vnTime().day;
const now=()=>Date.now();

const stats={bytes:0,msgs:0};
function raw(pl,s){ if(pl.ws&&pl.ws.readyState===1){ pl.ws.send(s); stats.bytes+=s.length; stats.msgs++; } }
function send(pl,obj){ raw(pl,JSON.stringify(obj)); }
function sceneOf(id){ let s=scenes.get(id); if(!s){ s=new Set(); scenes.set(id,s); } return s; }
const kindOf=id=>id?id.split(':')[0]:'';
// người chơi cùng cảnh trong bán kính r (px); cảnh nhỏ thì cả cảnh
function nearby(pl,r=S.RULES.viewRadius,self=true){ const out=[], big=kindOf(pl.scene)==='retreat'||kindOf(pl.scene)==='dalat';
  for(const q of sceneOf(pl.scene)){ if(q===pl&&!self) continue; if(!big||Math.hypot(q.x-pl.x,q.y-pl.y)<=r) out.push(q); } return out; }
function broadcastNear(pl,obj,r,self=true){ const s=JSON.stringify(obj); for(const q of nearby(pl,r,self)) raw(q,s); }
function broadcastScene(id,obj){ const s=JSON.stringify(obj); for(const q of sceneOf(id)) raw(q,s); }
function broadcastAll(obj){ const s=JSON.stringify(obj); for(const q of players.values()) raw(q,s); }
// khoảng cách tới điểm (toạ độ ô)
const dist=(pl,x,y)=>Math.hypot(pl.x-x*T,pl.y-y*T);
const near=(pl,x,y,r=44)=>dist(pl,x,y)<=r;

/* ---------- hồ sơ ---------- */
function defaults(name){ return {v:3,name,look:null,owned:{},money:S.RULES.startMoney,exp:0,level:1,items:{},skills:{noi:true},quests:{},
  flags:{called:false,arrived:false,hello:false,beagleFollow:false,fire:false,spots:{},coins:{},picked:{},chicken:false,phapForm:'xanh',freeRide:false,rented:false,applyAt:0},
  meals:{day:'',eaten:{}},buff:null,rbuff:null,daily:{day:'',done:{},buoys:{},gameExp:0,tiktok:0,posts:0,herd:0,crates:0,cook:0,slept:false},forage:{},
  needs:{energy:100,clean:100,battery:100},stay:null,sleep:null,photos:[],animals:[],horse:null,cookOrder:null,kayakUntil:0,
  scene:'home',pos:null,opts:{noSocial:false},inbox:[]}; }
// quà theo tên chỉ tính khi đã tạo nhân vật (tên nhân vật không trùng, xem handlers.create);
// trước khi tạo, tên tạm lấy từ tên đăng nhập / tên Google nên ai cũng có thể đặt trùng
const giftName=p=>p.look?String(p.name||''):'';
function fixProfile(p,name){ const d=defaults(name); for(const k in d){ if(p[k]===undefined) p[k]=d[k]; else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&p[k]&&typeof p[k]==='object') for(const j in d[k]) if(p[k][j]===undefined) p[k][j]=d[k][j]; }
  // dọn dữ liệu hỏng do lỗi cũ: tiền / EXP thành NaN, đồ số lượng sai, khoá kiểu "constructor"
  if(!Number.isFinite(p.money)) p.money=0; if(!Number.isFinite(p.exp)) p.exp=0;
  for(const [k,n] of Object.entries(p.items)) if(k in Object.prototype||!Number.isFinite(n)||n<=0) delete p.items[k];
  for(const k of Object.keys(p.owned)) if(k in Object.prototype) delete p.owned[k];
  if(p.wish&&!Object.hasOwn(S.MIEU.wishes,p.wish.k)) p.wish=null; if(p.stay&&!Object.hasOwn(S.ROOMS,p.stay.room)) p.stay=null;
  // tiền khởi đầu tăng từ 150.000đ lên 1.000.000đ: tài khoản tạo trước đó được bù 1 lần
  if((p.v||1)<3){ if(p.v) p.money+=1000000-150000; p.v=3; }
  // tiền khởi điểm lên 2.000.000đ: tài khoản cũ dưới 2 triệu được nâng lên 2 triệu (1 lần)
  if(!(p.flags&&p.flags.topup2m)){ p.money=Math.max(p.money||0,2000000); p.flags.topup2m=true; }
  // quà admin: tài khoản Mèn mén được cộng 3.000.000đ (1 lần)
  if(giftName(p).normalize('NFC').toLowerCase()==='mèn mén'.normalize('NFC')&&!(p.flags&&p.flags.gift3m)){ p.money+=3000000; p.flags.gift3m=true; }
  // quà admin: tài khoản Ben Jr được cộng 2.000.000đ (1 lần)
  if(giftName(p).normalize('NFC').toLowerCase()==='ben jr'&&!(p.flags&&p.flags.gift2mBen)){ p.money+=2000000; p.flags.gift2mBen=true; }
  // quà admin: tài khoản Leno được cộng 3.000.000đ (1 lần)
  if(giftName(p).normalize('NFC').toLowerCase()==='leno'&&!(p.flags&&p.flags.gift3mLeno)){ p.money+=3000000; p.flags.gift3mLeno=true; }
  // quà admin đợt 2: Leno và Ben Jr mỗi người được cộng 10.000.000đ (1 lần)
  { const nm=giftName(p).normalize('NFC').toLowerCase(); if((nm==='leno'||nm==='ben jr')&&!(p.flags&&p.flags.gift10m)){ p.money+=10000000; p.flags.gift10m=true; } }
  // người chơi tên Kaixa: tài khoản có 100 triệu (nạp 1 lần)
  if(giftName(p).toLowerCase()==='kaixa'&&!(p.flags&&p.flags.vip100)){ p.money=Math.max(p.money,100000000); p.flags.vip100=true; }
  // skin riêng Kaixa theo ảnh: tóc xám tro dựng, kính vuông tròng xanh, blazer satin đen + dây chuyền, quần ống rộng, đồng hồ (mặc 1 lần, sau tự đổi trong tủ đồ)
  if(giftName(p).toLowerCase()==='kaixa'&&p.look&&!(p.flags&&p.flags.kaixaSkin)){ p.flags.kaixaSkin=true;
    for(const id of ['blazer_kaixa','quan_kaixa','kinh_kaixa','dong_ho','giay_den']) p.owned[id]=1;
    Object.assign(p.look,{gender:'nam',hair:'messy',hairColor:'a59c9a',skin:'eeb896'}); p.look.outfit={...(p.look.outfit||{}),top:'blazer_kaixa',bottom:'quan_kaixa',eyes:'kinh_kaixa',wrist:'dong_ho',shoes:'giay_den'}; }
  p.level=Math.max(p.level||1,S.levelOf(p.exp||0));   // bảng cấp nối dài tới 200: ai đủ EXP thì lên luôn
  return p; }
// lộc của SIM số đẹp đang dùng (VNPT)
const simPerk=p=>(p.sim&&S.VNPT.simPerks[p.sim.cat])||{};
function markDirty(pl){ pl.dirty=true; if(!pl.saveAt) pl.saveAt=now()+4000; }
function save(pl){ db.saveProfile(pl.uid,pl.prof); pl.saveAt=0; }
// gửi hồ sơ cho chính người đó (kèm phần tính sẵn)
function publicProfile(pl){ return {...pl.prof,pub:pl.pub,pid:pl.pid,extra:pl.extra?pl.extra():null}; }

/* ---------- tiền, đồ, EXP ---------- */
// số không hợp lệ (NaN, chuỗi, Infinity) bị từ chối: trước đây take(NaN) trả true và biến tiền thành NaN
function take(pl,v){ v=Math.round(v); if(!Number.isFinite(v)||v<0||!(pl.prof.money>=v)) return false; pl.prof.money-=v; markDirty(pl); return true; }
function give(pl,v){ v=Math.round(v); if(Number.isFinite(v)&&v>0){ pl.prof.money+=v; markDirty(pl); for(const f of hooks.money) f(pl,v); } }
function has(pl,k,n=1){ return (pl.prof.items[k]||0)>=n; }
function addItem(pl,k,n=1){ n=Math.round(n); if(typeof k!=='string'||k in Object.prototype||!Number.isFinite(n)||!n) return; const it=pl.prof.items; it[k]=(it[k]||0)+n; if(it[k]<=0) delete it[k]; markDirty(pl); if(n>0) for(const f of hooks.item) f(pl,k,n); }
// báo một việc vừa làm (đi Grab, ăn bữa, chụp ảnh...) cho các module đếm tiến độ
function track(pl,k,n=1){ for(const f of hooks.stat) f(pl,k,n); }
function hungerLevel(pl){ return S.hunger(pl.prof.meals); }
function expMul(pl){ const p=pl.prof, t=now(); let m=S.RULES.hungryExp[hungerLevel(pl)];
  if(p.buff&&p.buff.until>t) m*=p.buff.mul; if(p.rbuff&&p.rbuff.until>t) m*=p.rbuff.mul; if(p.lbuff&&p.lbuff.until>t) m*=p.lbuff.mul; /* lbuff: phúc ở chùa */ if(p.mbuff&&p.mbuff.until>t) m*=p.mbuff.mul; /* mbuff: cầu an ở miếu ông Trường Con */ m*=1+(simPerk(p).exp||0); /* SIM số đẹp */ if(p.sbuff&&p.sbuff.until>t) m*=p.sbuff.mul; /* xông hơi tập thể */ if(p.needs.clean<20) m*=.85; return m; }
function speedMul(pl){ return S.RULES.hungrySpeed[hungerLevel(pl)]*(pl.prof.needs.energy<20?.8:1)*S.lvSpeed(pl.prof.level); }
// cộng EXP; kind 'game' bị giới hạn mỗi ngày
function gainExp(pl,base,kind){ const p=pl.prof; let a=base*expMul(pl);
  if(kind==='game'){ a=Math.max(0,Math.min(S.RULES.gameExpCap-p.daily.gameExp,a)); p.daily.gameExp+=a; }
  a=Math.round(a); if(a<=0) return {exp:0};
  p.exp+=a; for(const f of hooks.exp) f(pl,a); const lv=S.levelOf(p.exp), out={exp:a};
  if(lv>p.level){ for(let L=p.level+1;L<=lv;L++){ const g=S.RULES.levelGift(L); if(g){ give(pl,g); note(pl,`🎉 Mốc cấp ${L}: thưởng ${S.fmt(g)}`,'quest'); } } p.level=lv; out.level=lv; } markDirty(pl); return out; }
// thưởng + báo cho client hiện thông báo
function reward(pl,r,msg){ const out={t:'rw',msg:msg||''};
  if(r.exp){ const g=gainExp(pl,r.exp,r.kind); out.exp=g.exp; if(g.level){ out.level=g.level; levelUp(pl); } }
  if(r.vnd){ give(pl,r.vnd); out.vnd=r.vnd; }
  if(r.items) for(const [k,n] of Object.entries(r.items)){ addItem(pl,k,n); (out.items=out.items||{})[k]=n; }
  if(r.item){ addItem(pl,r.item,1); (out.items=out.items||{})[r.item]=1; }
  if(r.skill){ pl.prof.skills[r.skill]=true; out.skill=r.skill; markDirty(pl); }
  send(pl,out); return out; }
function levelUp(pl){ for(const q of nearby(pl,400)) send(q,{t:'ev',k:'lvl',id:pl.pid,lv:pl.prof.level}); refreshInfo(pl); }
// độ lệch nhịp (ms) của 1 lần bấm: server đo theo lúc nhận tin trừ nửa ping; client gửi độ lệch tự đo (mượt hơn khi mạng giật)
// nhưng chỉ được lệch khỏi số server đo tối đa ±100ms (trước đây ±450ms: gửi off:0 là lần nào cũng PERFECT)
function beatOff(pl,t,beat,claim){ const srv=t-beat-(pl.rtt||80)/2, c=+claim; return Number.isFinite(c)?Math.max(srv-100,Math.min(srv+100,c)):srv; }
function note(pl,msg,kind){ send(pl,{t:'note',msg,kind:kind||''}); }

/* ---------- cảnh ---------- */
// thông tin hiển thị của 1 người (gửi cho người khác lần đầu thấy, hoặc khi đổi đồ)
function info(pl){ return {t:'pj',id:pl.pid,n:pl.prof.name,l:pl.prof.look,lv:pl.prof.level,tag:pl.tag?pl.tag():'',bn:(pl.prof.items.den_bingo||0)>0?1:0,rk:module.exports.rankOf?module.exports.rankOf(pl.uid):0}; }   // rk: hạng top 10 đại gia (lb.js)   // bn: có đèn bí ngô theo chân
function refreshInfo(pl){ for(const q of players.values()) if(q.sent&&q.sent.has(pl.pid)) q.sent.delete(pl.pid); }
// chuyển người chơi sang cảnh khác; x,y theo ô
function moveTo(pl,id,x,y,extra={}){
  const old=pl.scene;
  if(old){ for(const f of hooks.leave) runHook(f,pl,old,id); sceneOf(old).delete(pl); }
  pl.scene=id; pl.x=x*T; pl.y=y*T; pl.budget=0; pl.mvAt=now(); pl.task=null; pl.fishing=null; pl.act=0; pl.actUntil=0;
  sceneOf(id).add(pl); pl.sent=new Map();
  const k=kindOf(id); pl.prof.scene=k==='room'?'home':k==='stay'&&id!=='stay:'+pl.uid?'retreat':k; pl.prof.pos={x,y}; markDirty(pl);
  send(pl,{t:'scene',s:k,id,x:pl.x,y:pl.y,...extra});
  for(const f of hooks.enter) runHook(f,pl,id,old);
}
// 1 hook lỗi không được làm hỏng các hook sau hay làm sập server (vd. dữ liệu cũ hỏng trong hồ sơ)
function runHook(f,...a){ try{ f(...a); }catch(e){ console.error('[hook]',e); } }

module.exports={stats,S,T,db,players,byUid,scenes,handlers,hooks,on,hook,today,now,send,sceneOf,kindOf,nearby,broadcastNear,broadcastScene,broadcastAll,dist,near,
  simPerk,defaults,fixProfile,runHook,markDirty,save,publicProfile,take,give,has,addItem,track,hungerLevel,expMul,speedMul,gainExp,reward,note,beatOff,info,refreshInfo,moveTo,
  newPid:()=>nextPid++};
