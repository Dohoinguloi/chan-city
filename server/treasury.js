// Ngân khố nhà nước = tài khoản kaixa (tag ⚜ Quân triều đình): mọi tiền người chơi trả cho hệ thống (mua đồ, dịch vụ, vé, học phí, tiền thuê, phí sàn chợ đồ cũ, tiền phạt...)
// đổ về ví kaixa, kể cả lúc kaixa offline (cộng thẳng vào hồ sơ đã lưu). Tiền chuyển giữa người chơi với nhau hoặc mất trắng không tính (core.take(pl,v,true)).
// Vay vốn nhà nước (haosang.js op 'state'): tiền giải ngân trừ từ ví kaixa, gốc + lãi trả về lại kaixa.
'use strict';
const fs=require('fs'), path=require('path');
const C=require('./core');
const {db,byUid,hook,markDirty,today}=C;
const DIR=process.env.DATA_DIR||path.join(__dirname,'data'), FILE=path.join(DIR,'treasury.json');
const NAME='kaixa', TAG='⚜ Quân triều đình';
let KX=null; for(const p of db.allProfiles()) if(String(p.name||'').toLowerCase()===NAME){ KX=p._uid; break; }
const ST=(()=>{ try{ return {total:0,day:'',today:0,lent:0,...JSON.parse(fs.readFileSync(FILE,'utf8'))}; }catch(e){ return {total:0,day:'',today:0,lent:0}; } })();
let dirty=false; setInterval(()=>{ if(!dirty) return; dirty=false; try{ fs.writeFileSync(FILE,JSON.stringify(ST)); }catch(e){} },15000).unref();
const isKx=uid=>!!KX&&uid===KX;
// cộng (v>0) / trừ (v<0) ví ngân khố: kaixa đang online thì vào ví đang chơi, offline thì sửa hồ sơ đã lưu. Không gọi give() để khỏi tính là kaixa tự kiếm tiền (việc hằng ngày, thành tích)
function move(v){ v=Math.round(v); if(!KX||!v) return false; const q=byUid.get(KX); if(q&&q.prof){ q.prof.money=Math.max(0,q.prof.money+v); markDirty(q); return true; } return db.addMoney(KX,v); }
function balance(){ if(!KX) return 0; const q=byUid.get(KX); if(q&&q.prof) return q.prof.money||0; const p=db.profile(KX); return p&&p.money||0; }
const roll=()=>{ const d=today(); if(ST.day!==d){ ST.day=d; ST.today=0; } };
hook('spend',(pl,v)=>{ if(!KX) return; move(v); if(pl.uid===KX) return; roll(); ST.today+=v; ST.total+=v; dirty=true; });   /* kaixa tự mua: tiền về lại chính ví kaixa */
hook('login',pl=>{ if(!KX&&String(pl.prof.name||'').toLowerCase()===NAME) KX=pl.uid; if(pl.uid!==KX) return;
  const t0=pl.tag; pl.tag=()=>{ const x=t0&&t0(); return TAG+(x?' · '+x:''); }; C.refreshInfo(pl); });
function lend(v){ ST.lent+=v; dirty=true; } function repaid(v){ ST.lent=Math.max(0,ST.lent-v); dirty=true; }
const view=()=>{ roll(); return {bal:balance(),today:ST.today,total:ST.total,lent:ST.lent,name:NAME,tag:TAG}; };
C.on('treasury',()=>({v:view()}));
module.exports={KX:()=>KX,isKx,move,balance,lend,repaid,view,TAG};
