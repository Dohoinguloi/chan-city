// Giữ chân người chơi: điểm danh 7 ngày, 3 việc mỗi ngày + Rương ngày, sổ sưu tầm có thưởng khi đủ bộ,
// Lễ hội Bí ngô theo mùa (nhặt bí mọc rải khắp Ké / Đà Lạt, đổi quà với Cô Bí Ngô ở cổng Ké).
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,hook,near,kindOf,markDirty,send,note,reward,addItem,has,take}=C;
const today=()=>S.realTime().day;   // điểm danh, 3 việc hằng ngày đổi theo ngày thật (ngày game chỉ 6 tiếng)
const hsh=s=>{ let h=2166136261; for(const c of String(s)) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0; };
// việc nào đếm theo sự kiện nào (stat / track ở các module khác)
const EV={fish:'fish',harvest:'harvest',forage:'forage',bug:'bug',meal:'meal',grab:'grab',photo:'photo',pickle:'match',treasure:'treasure',pumpkin:'pumpkin',money:'money',exp:'exp'};
const ALBUM_OF={}; for(const [a,z] of Object.entries(S.ALBUM)) for(const k of z.items) ALBUM_OF[k]=a;

/* ---------- 3 việc mỗi ngày ---------- */
function dq(pl){ const p=pl.prof, d=today(); if(p.dq&&p.dq.day===d) return p.dq;
  const ok=([,q])=>(!q.lv||p.level>=q.lv)&&(!q.skill||p.skills[q.skill])&&(!q.item||has(pl,q.item))&&(!q.season||S.seasonOn(q.season));
  let pool=Object.entries(S.DAYQ.pool).filter(ok).map(([id])=>id);
  const first=pool.includes('pumpkin')?['pumpkin']:[]; pool=pool.filter(id=>id!=='pumpkin');   // mùa lễ hội: luôn có việc nhặt bí ngô
  const pick=first.concat(pool.sort((a,b)=>hsh(pl.uid+d+a)-hsh(pl.uid+d+b))).slice(0,S.DAYQ.n);   // mỗi người một bộ, đổi lúc 0h
  p.dq={day:d,list:pick.map(id=>({id,n:0,ok:false,got:false})),chest:false}; markDirty(pl); return p.dq; }

/* ---------- điểm danh ---------- */
function login(pl,touch){ const p=pl.prof, d=today(), L=p.login=p.login||{last:'',streak:0,claimed:''};
  if(touch&&L.last!==d){ L.streak=(L.streak%S.LOGIN30.length)+1; L.last=d; markDirty(pl); }   /* 30 ô, lỡ ngày không mất chuỗi (nhận tiếp ô kế), hết 30 ngày quay vòng */
  return {streak:L.streak||1,claimed:L.claimed===d}; }

function state(pl){ const p=pl.prof; return {t:'dq',dq:dq(pl),login:login(pl,false),seen:p.seen||{},albumGot:p.albumGot||{},season:S.seasonOn('halloween')?'halloween':''}; }
function push(pl){ if(pl._dqT) return; pl._dqT=setTimeout(()=>{ pl._dqT=null; if(pl.prof) send(pl,state(pl)); },350); }

function bump(pl,ev,n=1){ if(!pl.prof) return; const q=dq(pl); let ch=false;
  for(const t of q.list){ const def=S.DAYQ.pool[t.id]; if(!def||t.ok||EV[t.id]!==ev) continue; t.n=Math.min(def.goal,t.n+n); ch=true;
    if(t.n>=def.goal){ t.ok=true; note(pl,`✔ Xong việc hôm nay: ${def.name}. Mở bảng Hằng ngày (nút 📅) để nhận thưởng!`,'quest'); } }
  if(ch){ markDirty(pl); push(pl); } }
hook('stat',(pl,k,n)=>bump(pl,k,n));
hook('money',(pl,v)=>bump(pl,'money',v));
hook('exp',(pl,a)=>bump(pl,'exp',a));

/* ---------- sổ sưu tầm: lần đầu có món nào là ghi vào sổ ---------- */
function see(pl,k,quiet){ const a=ALBUM_OF[k]; if(!a) return; const p=pl.prof, s=p.seen=p.seen||{}; if(s[k]) return; s[k]=1; markDirty(pl);
  if(quiet) return; const z=S.ALBUM[a], have=z.items.filter(i=>s[i]).length, nm=(S.ITEMS[k]||S.CLOTHES[k]||{name:k}).name;
  note(pl,`📖 Sổ sưu tầm · ${z.name}: thêm ${nm} (${have}/${z.items.length})${have===z.items.length?' · ĐỦ BỘ! Mở sổ nhận thưởng':''}`,'quest'); push(pl); }
hook('item',(pl,k)=>see(pl,k));

hook('login',pl=>{ const p=pl.prof; login(pl,true); dq(pl); for(const k of Object.keys(p.items||{})) see(pl,k,true); for(const k of Object.keys(p.owned||{})) see(pl,k,true);
  // kỷ vật đã trả / dùng mất trước khi có sổ: làm xong Bé Gấu mất đầu = đã có Đầu Bé Gấu, từng được Site of the Day = đã có cúp
  if(p.quests&&p.quests.bp_head==='done') see(pl,'dau_gau',true); if(p.flags&&p.flags.bpAward==='sotd') see(pl,'cup_sotd',true); setTimeout(()=>{ if(pl.prof) send(pl,state(pl)); },1200); });
// qua 0h khi đang online: đổi việc mới, mở điểm danh ngày mới
hook('slow',()=>{ const d=today(); for(const pl of C.players.values()){ if(!pl.prof||pl._dqDay===d) continue; const first=!pl._dqDay; pl._dqDay=d; if(!first){ login(pl,true); push(pl); } } });

on('dq',(pl,m)=>{ const p=pl.prof, op=m.op;
  if(op==='state'){ send(pl,state(pl)); return {ok:true}; }
  if(op==='login'){ const L=login(pl,true); if(L.claimed) return {err:'Hôm nay điểm danh rồi, mai quay lại nhé'}; const r=S.LOGIN30[L.streak-1]||S.LOGIN30[0];
    p.login.claimed=today(); const out=reward(pl,{vnd:r.vnd,exp:r.exp,items:r.items},`Điểm danh ngày ${L.streak}/${S.LOGIN30.length}: ${r.label}`); let chest=null; if(r.chest) chest=openChest(pl,`Rương ngày ${L.streak}`);
    if(r.buff){ p.dbuff={mul:r.buff.mul,until:C.now()+r.buff.min*60e3}; C.note(pl,`⚡ EXP ×${r.buff.mul} trong ${r.buff.min} phút`,'quest'); }   /* buff EXP điểm danh */
    if(r.cloth&&S.CLOTHES[r.cloth]&&!p.owned[r.cloth]){ p.owned[r.cloth]=1; C.note(pl,`👕 Nhận ${S.CLOTHES[r.cloth].name}! Mở Tủ đồ (U) để mặc`,'item'); }
    markDirty(pl); push(pl); return {ok:true,day:L.streak,chest}; }
  if(op==='get'){ const q=dq(pl), t=q.list[m.i|0]; if(!t) return {err:'?'}; if(!t.ok) return {err:'Việc này chưa xong'}; if(t.got) return {err:'Nhận rồi'};
    const def=S.DAYQ.pool[t.id]; t.got=true; reward(pl,def.rw,`Thưởng việc hôm nay: ${def.name}`); markDirty(pl); push(pl); return {ok:true}; }
  if(op==='chest'){ const q=dq(pl); if(q.chest) return {err:'Rương hôm nay mở rồi'}; if(!q.list.every(t=>t.got)) return {err:`Nhận đủ thưởng ${q.list.length} việc trước đã`};
    q.chest=true; const chest=openChest(pl,'Rương ngày'); markDirty(pl); push(pl); return {ok:true,chest}; }
  // quà Halloween: chọn miễn phí 1 bộ trang phục (1 lần), mặc luôn
  if(op==='hwclaim'){ if(!S.seasonOn('halloween')) return {err:'Hết mùa Halloween rồi'}; const k=String(m.k||''), it=S.CLOTHES[k]; if(!it||!it.hw) return {err:'?'};
    if(p.flags.hwFree) return {err:'Bạn đã nhận trang phục Halloween rồi'}; p.owned[k]=1; p.flags.hwFree=k; if(p.look&&p.look.outfit) p.look.outfit.top=k; see(pl,k); markDirty(pl); C.refreshInfo(pl);
    return {msg:`Nhận bộ ${it.name.replace('Đồ Halloween: ','')}! Đã mặc luôn, muốn đổi lại thì mở Tủ đồ (U)`,look:p.look}; }
  if(op==='album'){ const z=S.ALBUM[m.a], s=p.seen||{}; if(!z) return {err:'?'}; const got=p.albumGot=p.albumGot||{}; if(got[m.a]) return {err:'Bộ này nhận thưởng rồi'};
    if(!z.items.every(k=>s[k])) return {err:'Chưa đủ bộ'}; got[m.a]=Date.now(); reward(pl,z.rw,`Đủ bộ sưu tầm ${z.name}!`); P.stat(pl,'album',1); markDirty(pl); push(pl); return {ok:true}; }
  return {err:'?'}; });

// rương: tiền ngẫu nhiên + EXP + 1 món (món hiếm thì hiện to)
function openChest(pl,name){ const c=S.DAYQ.chest, [a,b]=c.vnd, vnd=Math.round((a+Math.random()*(b-a))/10000)*10000, item=c.items[Math.floor(Math.random()*c.items.length)];
  reward(pl,{vnd,exp:c.exp,item},`${name}: ${S.fmt(vnd)} + ${c.exp} EXP + ${(S.ITEMS[item]||{name:item}).name}`); return {vnd,exp:c.exp,item}; }

/* ---------- Lễ hội Bí ngô ---------- */
on('pumpkin',(pl,m)=>{ const p=pl.prof, k=kindOf(pl.scene), cur=S.pumpkinsNow(k), s=cur.list.find(z=>z.i===(m.i|0));
  if(!s) return {err:'Quả bí này không còn ở đây'}; if(!near(pl,s.x,s.y,30)) return {err:'Lại gần hơn chút'};
  const g=p.pk&&p.pk.h===cur.hour?p.pk:(p.pk={h:cur.hour,got:{}}), key=k+s.i; if(g.got[key]) return {err:'Quả này bạn hái rồi, giờ sau bí mọc chỗ khác'};
  g.got[key]=1; addItem(pl,'bi_ngo'); P.stat(pl,'pumpkin',1); markDirty(pl); return {item:'bi_ngo',n:p.items.bi_ngo||0}; });

on('bingo',(pl,m)=>{ const p=pl.prof, z=S.SEASON.halloween, it=z.shop.find(x=>x.id===m.id); if(!S.seasonOn('halloween')) return {err:'Lễ hội Bí ngô đã kết thúc, hẹn năm sau!'};
  if(!it) return {err:'?'}; if(!P.nearNpc(pl,'bingo')) return {err:'Gặp Cô Bí Ngô ở cổng Ké đã'};
  const got=p.flags.bingo=p.flags.bingo||{}; if(!it.again&&got[it.id]) return {err:'Món này bạn đổi rồi'};
  if((p.items.bi_ngo||0)<it.cost) return {err:`Cần ${it.cost} quả bí ngô, bạn có ${p.items.bi_ngo||0}`};
  addItem(pl,'bi_ngo',-it.cost); got[it.id]=(got[it.id]||0)+1;
  if(it.rw) reward(pl,it.rw,`Cô Bí Ngô tặng ${it.name}`);
  if(it.cloth){ p.owned[it.cloth]=1; see(pl,it.cloth); note(pl,`Nhận ${it.name}! Mở Tủ đồ (U) để mặc`,'quest'); }
  if(it.item){ addItem(pl,it.item); note(pl,`Nhận ${it.name}! Từ giờ có quả bí ngô sáng đèn lon ton theo chân bạn`,'quest'); C.refreshInfo(pl); }
  markDirty(pl); return {ok:true,left:p.items.bi_ngo||0}; });

module.exports={dq,state,bump,see};
