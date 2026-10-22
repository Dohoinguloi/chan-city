// Ưu đãi học viên / nhân viên: học ở DAS (có khoá học hoặc chứng chỉ), làm ở Bearplus (đã nhận việc với anh Khoa), Lumen (thành viên) hoặc Everfit (đang được tuyển)
// thì mua đồ giảm 20%: quần áo, đồ ăn uống, hạt giống, vật nuôi, đồ Lính Cát, ngựa, đồ MU... Tiền thuê, học phí, tiền phạt, chip, chợ người chơi không giảm.
'use strict';
const C=require('./core');
const OFF=.2;
// nơi người chơi đang học / làm (job.js nạp sau core nên đọc lúc gọi)
function perkOf(pl){ const p=pl.prof, out=[];
  if(p.das&&((p.das.certs||[]).length||Object.keys(p.das.c||{}).length)) out.push('DAS');
  if(p.quests&&p.quests.bp_brief==='done') out.push('Bearplus');
  if(p.lumen&&p.lumen.hired) out.push('Lumen');
  if(require('./job').JOBS[pl.uid]) out.push('Everfit');
  return out; }
const priceFor=(pl,v)=>Math.round(perkOf(pl).length?v*(1-OFF):v);
// trừ tiền mua đồ (đã giảm nếu có ưu đãi) và báo số tiền tiết kiệm; false nếu không đủ tiền
function shopPay(pl,v){ const pay=priceFor(pl,v); if(!C.take(pl,pay)) return false;
  if(pay<v) C.note(pl,`Ưu đãi ${perkOf(pl).join(' · ')}: giảm ${Math.round(OFF*100)}%, tiết kiệm ${C.S.fmt(v-pay)}`,'vnd'); return true; }
module.exports={shopPay,priceFor,perkOf,OFF};
