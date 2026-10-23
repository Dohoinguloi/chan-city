// Ngân khố nhà nước = tài khoản kaixa (tag ⚜ Quân triều đình): mọi tiền người chơi trả cho hệ thống (mua đồ, dịch vụ, vé, học phí, tiền thuê, phí sàn chợ đồ cũ, tiền phạt...)
// đổ về ví kaixa, kể cả lúc kaixa offline (cộng thẳng vào hồ sơ đã lưu). Tiền chuyển giữa người chơi với nhau hoặc mất trắng không tính (core.take(pl,v,true)).
// Vay vốn nhà nước (haosang.js op 'state'): tiền giải ngân trừ từ ví kaixa, gốc + lãi trả về lại kaixa.
'use strict';
const fs=require('fs'), path=require('path');
const C=require('./core');
const {db,byUid,hook,markDirty,today}=C;
const DIR=process.env.DATA_DIR||path.join(__dirname,'data'), FILE=path.join(DIR,'treasury.json');
const NAME='kaixa', TAG='⚜ Quân triều đình';
// chủ ngân khố = tài khoản chính chủ (tạo sớm nhất, đã tạo nhân vật) tên Kaixa: không lấy theo tên, ai đặt trùng / tên Google trùng không thành ngân khố
let KX=C.ownerOf([NAME]);
const ST=(()=>{ try{ return {total:0,day:'',today:0,lent:0,...JSON.parse(fs.readFileSync(FILE,'utf8'))}; }catch(e){ return {total:0,day:'',today:0,lent:0}; } })();
let dirty=false; setInterval(()=>{ if(!dirty) return; dirty=false; try{ fs.writeFileSync(FILE,JSON.stringify(ST)); }catch(e){} },15000).unref();
const isKx=uid=>!!KX&&uid===KX;
// cộng (v>0) / trừ (v<0) ví ngân khố: kaixa đang online thì vào ví đang chơi, offline thì sửa hồ sơ đã lưu. Không gọi give() để khỏi tính là kaixa tự kiếm tiền (việc hằng ngày, thành tích)
// kaixa offline: tiền vào / ra cộng dồn trong bộ nhớ (pend), 15 giây ghi hồ sơ 1 lần + lúc kaixa vào game / tắt server
// (trước đây mỗi lần ai mua đồ là đọc + ghi lại cả hồ sơ kaixa trong DB, spam mua đồ rẻ làm server giật)
let pend=0, base=null;   // base: số dư đã lưu của kaixa (đọc DB 1 lần, tới khi kaixa vào / ra game)
const offBase=()=>{ if(base===null){ const p=db.profile(KX); base=p&&Number.isFinite(p.money)?p.money:0; } return base; };
function flush(){ if(!KX||!pend||byUid.has(KX)) return; const p=db.profile(KX); if(!p){ pend=0; return; }
  p.money=Math.max(0,(Number.isFinite(p.money)?p.money:0)+pend); pend=0; base=p.money; db.saveProfile(KX,p); }
setInterval(()=>{ try{ flush(); }catch(e){ console.error('[ngân khố]',e.message); } },15000).unref(); process.on('exit',()=>{ try{ flush(); }catch(e){} });
function move(v){ v=Math.round(v); if(!KX||!Number.isFinite(v)||!v) return false; const q=byUid.get(KX); if(q&&q.prof){ q.prof.money=Math.max(0,q.prof.money+v); markDirty(q); return true; }
  if(offBase()+pend+v<0) return false; pend+=v; return true; }
function balance(){ if(!KX) return 0; const q=byUid.get(KX); if(q&&q.prof) return q.prof.money||0; return Math.max(0,offBase()+pend); }
const roll=()=>{ const d=today(); if(ST.day!==d){ ST.day=d; ST.today=0; } };
hook('spend',(pl,v)=>{ if(!KX) return; move(v); if(pl.uid===KX) return; roll(); ST.today+=v; ST.total+=v; dirty=true; });   /* kaixa tự mua: tiền về lại chính ví kaixa */
hook('login',pl=>{ if(!KX&&pl.prof.look&&String(pl.prof.name||'').normalize('NFC').toLowerCase()===NAME) KX=C.ownerOf([NAME]); if(pl.uid!==KX) return;   /* lúc chạy server chưa có Kaixa: tính lại khi có người tên Kaixa vào */
  if(pend){ pl.prof.money=Math.max(0,(pl.prof.money||0)+pend); pend=0; markDirty(pl); } base=null;   /* tiền dồn lúc offline vào ví đang chơi */
  const t0=pl.tag; pl.tag=()=>{ const x=t0&&t0(); return TAG+(x?' · '+x:''); }; C.refreshInfo(pl); });
hook('logout',pl=>{ if(pl.uid===KX) base=null; });   /* kaixa thoát: lần sau đọc lại số dư đã lưu */
function lend(v){ ST.lent+=v; dirty=true; } function repaid(v){ ST.lent=Math.max(0,ST.lent-v); dirty=true; }
const view=()=>{ roll(); return {bal:balance(),today:ST.today,total:ST.total,lent:ST.lent,name:NAME,tag:TAG}; };
C.on('treasury',()=>({v:view()}));
module.exports={KX:()=>KX,isKx,move,balance,lend,repaid,view,TAG};
