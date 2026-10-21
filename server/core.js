// Lõi server: người chơi đang online, cảnh, gửi tin, tiền/đồ/EXP, chuyển cảnh. Các module tính năng dùng chung file này.
'use strict';
const S=require('../chande-bootcamp/shared/data.js');
const db=require('./db');
const T=S.T;

const players=new Map();       // pid → người chơi
const byUid=new Map();         // uid → người chơi
const scenes=new Map();        // id cảnh → Set người chơi
const handlers={};             // loại tin → hàm xử lý
const hooks={leave:[],enter:[],tick:[],slow:[],login:[],logout:[],day:[]};
let nextPid=1;

const on=(t,fn)=>{ handlers[t]=fn; };
const hook=(k,fn)=>hooks[k].push(fn);
const today=()=>S.vnTime().day;
const now=()=>Date.now();

function send(pl,obj){ if(pl.ws&&pl.ws.readyState===1) pl.ws.send(JSON.stringify(obj)); }
function sceneOf(id){ let s=scenes.get(id); if(!s){ s=new Set(); scenes.set(id,s); } return s; }
const kindOf=id=>id.split(':')[0];
// người chơi cùng cảnh trong bán kính r (px); cảnh nhỏ thì cả cảnh
function nearby(pl,r=S.RULES.viewRadius,self=true){ const out=[], big=kindOf(pl.scene)==='retreat'||kindOf(pl.scene)==='dalat';
  for(const q of sceneOf(pl.scene)){ if(q===pl&&!self) continue; if(!big||Math.hypot(q.x-pl.x,q.y-pl.y)<=r) out.push(q); } return out; }
function broadcastNear(pl,obj,r,self=true){ const s=JSON.stringify(obj); for(const q of nearby(pl,r,self)) if(q.ws&&q.ws.readyState===1) q.ws.send(s); }
function broadcastScene(id,obj){ const s=JSON.stringify(obj); for(const q of sceneOf(id)) if(q.ws&&q.ws.readyState===1) q.ws.send(s); }
function broadcastAll(obj){ const s=JSON.stringify(obj); for(const q of players.values()) if(q.ws&&q.ws.readyState===1) q.ws.send(s); }
// khoảng cách tới điểm (toạ độ ô)
const dist=(pl,x,y)=>Math.hypot(pl.x-x*T,pl.y-y*T);
const near=(pl,x,y,r=44)=>dist(pl,x,y)<=r;

/* ---------- hồ sơ ---------- */
function defaults(name){ return {v:2,name,look:null,owned:{},money:S.RULES.startMoney,exp:0,level:1,items:{},skills:{noi:true},quests:{},
  flags:{called:false,arrived:false,hello:false,beagleFollow:false,fire:false,spots:{},coins:{},picked:{},chicken:false,phapForm:'xanh',freeRide:false,rented:false,applyAt:0},
  meals:{day:'',eaten:{}},buff:null,rbuff:null,daily:{day:'',done:{},buoys:{},gameExp:0,tiktok:0,posts:0,herd:0,crates:0,cook:0,slept:false},forage:{},
  needs:{energy:100,clean:100,battery:100},stay:null,sleep:null,photos:[],animals:[],horse:null,cookOrder:null,kayakUntil:0,
  scene:'home',pos:null,opts:{noSocial:false},inbox:[]}; }
function fixProfile(p,name){ const d=defaults(name); for(const k in d){ if(p[k]===undefined) p[k]=d[k]; else if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k])&&p[k]&&typeof p[k]==='object') for(const j in d[k]) if(p[k][j]===undefined) p[k][j]=d[k][j]; } return p; }
function markDirty(pl){ pl.dirty=true; if(!pl.saveAt) pl.saveAt=now()+4000; }
function save(pl){ db.saveProfile(pl.uid,pl.prof); pl.saveAt=0; }
// gửi hồ sơ cho chính người đó (kèm phần tính sẵn)
function publicProfile(pl){ return {...pl.prof,pub:pl.pub,pid:pl.pid,extra:pl.extra?pl.extra():null}; }

/* ---------- tiền, đồ, EXP ---------- */
function take(pl,v){ v=Math.round(v); if(v<0||pl.prof.money<v) return false; pl.prof.money-=v; markDirty(pl); return true; }
function give(pl,v){ v=Math.round(v); if(v>0){ pl.prof.money+=v; markDirty(pl); } }
function has(pl,k,n=1){ return (pl.prof.items[k]||0)>=n; }
function addItem(pl,k,n=1){ const it=pl.prof.items; it[k]=(it[k]||0)+n; if(it[k]<=0) delete it[k]; markDirty(pl); }
function hungerLevel(pl){ return S.hunger(pl.prof.meals); }
function expMul(pl){ const p=pl.prof, t=now(); let m=S.RULES.hungryExp[hungerLevel(pl)];
  if(p.buff&&p.buff.until>t) m*=p.buff.mul; if(p.rbuff&&p.rbuff.until>t) m*=p.rbuff.mul; if(p.needs.clean<20) m*=.85; return m; }
function speedMul(pl){ return S.RULES.hungrySpeed[hungerLevel(pl)]*(pl.prof.needs.energy<20?.8:1); }
// cộng EXP; kind 'game' bị giới hạn mỗi ngày
function gainExp(pl,base,kind){ const p=pl.prof; let a=base*expMul(pl);
  if(kind==='game'){ a=Math.max(0,Math.min(S.RULES.gameExpCap-p.daily.gameExp,a)); p.daily.gameExp+=a; }
  a=Math.round(a); if(a<=0) return {exp:0};
  p.exp+=a; const lv=S.levelOf(p.exp), out={exp:a}; if(lv>p.level){ p.level=lv; out.level=lv; } markDirty(pl); return out; }
// thưởng + báo cho client hiện thông báo
function reward(pl,r,msg){ const out={t:'rw',msg:msg||''};
  if(r.exp){ const g=gainExp(pl,r.exp,r.kind); out.exp=g.exp; if(g.level){ out.level=g.level; levelUp(pl); } }
  if(r.vnd){ give(pl,r.vnd); out.vnd=r.vnd; }
  if(r.items) for(const [k,n] of Object.entries(r.items)){ addItem(pl,k,n); (out.items=out.items||{})[k]=n; }
  if(r.item){ addItem(pl,r.item,1); (out.items=out.items||{})[r.item]=1; }
  if(r.skill){ pl.prof.skills[r.skill]=true; out.skill=r.skill; markDirty(pl); }
  send(pl,out); return out; }
function levelUp(pl){ for(const q of nearby(pl,400)) send(q,{t:'ev',k:'lvl',id:pl.pid,lv:pl.prof.level}); refreshInfo(pl); }
function note(pl,msg,kind){ send(pl,{t:'note',msg,kind:kind||''}); }

/* ---------- cảnh ---------- */
// thông tin hiển thị của 1 người (gửi cho người khác lần đầu thấy, hoặc khi đổi đồ)
function info(pl){ return {t:'pj',id:pl.pid,n:pl.prof.name,l:pl.prof.look,lv:pl.prof.level,tag:pl.tag?pl.tag():''}; }
function refreshInfo(pl){ for(const q of players.values()) if(q.sent&&q.sent.has(pl.pid)) q.sent.delete(pl.pid); }
// chuyển người chơi sang cảnh khác; x,y theo ô
function moveTo(pl,id,x,y,extra={}){
  const old=pl.scene;
  if(old){ for(const f of hooks.leave) f(pl,old,id); sceneOf(old).delete(pl); }
  pl.scene=id; pl.x=x*T; pl.y=y*T; pl.budget=0; pl.mvAt=now(); pl.task=null; pl.fishing=null; pl.act=0; pl.actUntil=0;
  sceneOf(id).add(pl); pl.sent=new Map();
  const k=kindOf(id); pl.prof.scene=k==='room'?'home':k==='stay'&&id!=='stay:'+pl.uid?'retreat':k; pl.prof.pos={x,y}; markDirty(pl);
  send(pl,{t:'scene',s:k,id,x:pl.x,y:pl.y,...extra});
  for(const f of hooks.enter) f(pl,id,old);
}

module.exports={S,T,db,players,byUid,scenes,handlers,hooks,on,hook,today,now,send,sceneOf,kindOf,nearby,broadcastNear,broadcastScene,broadcastAll,dist,near,
  defaults,fixProfile,markDirty,save,publicProfile,take,give,has,addItem,hungerLevel,expMul,speedMul,gainExp,reward,note,info,refreshInfo,moveTo,
  newPid:()=>nextPid++};
