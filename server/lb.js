// Bảng xếp hạng toàn game: cấp/EXP, tài sản, câu cá, thu hoạch, Phòng Bay. Gộp hồ sơ trong SQLite với người đang online, làm mới 30 giây/lần.
'use strict';
const C=require('./core');
const {db,on,now,players}=C;
const CATS={exp:p=>p.exp||0,money:p=>p.money||0,fish:p=>(p.stats||{}).fish||0,harvest:p=>(p.stats||{}).harvest||0,dance:p=>(p.stats||{}).dance||0,know:p=>(p.stats||{}).know||0,donate:p=>(p.stats||{}).donate||0};
let cache=null, at=0;
const all=db.allProfiles||(()=>[]);
function build(){ const rows=new Map();
  for(const r of all()) if(r.look) rows.set(r._uid,r);
  for(const pl of players.values()) if(pl.prof.look) rows.set(pl.uid,{...pl.prof,_uid:pl.uid});
  const out={}; for(const [k,f] of Object.entries(CATS)) out[k]=[...rows.values()].map(p=>({n:p.name,lv:p.level||1,v:f(p)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,20);
  out.total=rows.size; return out; }
on('lb',()=>{ const t=now(); if(!cache||t-at>30000){ cache=build(); at=t; } return {lb:cache}; });
