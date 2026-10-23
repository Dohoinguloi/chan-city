// Sự kiện Ngày Mèn Mén Thế Giới (23/10/2026): vào game trong ngày sự kiện thì hiện banner chào mừng,
// mọi tài khoản được tặng 2.000.000đ (nhận 1 lần, đăng nhập tới hết ngày giftUntil vẫn nhận được). Ngày theo giờ Việt Nam thật.
'use strict';
const C=require('./core');
const {S,hook,send,markDirty}=C;
const EV={id:'menmen26',from:'2026-10-23',to:'2026-10-24',giftUntil:'2026-10-30',gift:2000000,
  title:'🎉 Chào mừng Ngày Mèn Mén Thế Giới 🎉',sub:'Toàn dân Chan City được tặng 2.000.000đ'};
// banner đang chạy (thay banner Ngày Mèn Mén): Đại nhiệm vụ Tân Thế Giới Chande, truy tìm 3 món huyền thoại; quà 2.000.000đ vẫn nhận tới hết giftUntil
const BAN={from:'2026-10-23',to:'2026-11-07',title:'🌏 Đại Nhiệm Vụ: Tân Thế Giới Chande 🌏',
  sub:'Truy tìm 3 món đồ huyền thoại: Cái Pod của Kaixa · Cây Bút của Redtype · Airpod của VNPT. Mỗi món ghép từ 15 mảnh rải khắp các map (nhiệm vụ ẩn, giải đố, làm nhóm, thành tựu). Bấm 1 món bên dưới hoặc 3 ô cạnh thanh đồ để xem đường đi'};
hook('login',pl=>{ const p=pl.prof, d=S.realTime().day; let got=0;
  if(d<=EV.giftUntil&&!p.flags[EV.id]){ p.flags[EV.id]=true; p.money+=EV.gift; got=EV.gift; markDirty(pl); }
  // gửi sau khi client nhận welcome và vào cảnh
  if(got||(d>=BAN.from&&d<=BAN.to)) setTimeout(()=>send(pl,{t:'evbanner',title:BAN.title,sub:BAN.sub,legend:1,gift:got,giftWhy:'quà Ngày Mèn Mén'}),1500); });
// quà toàn dân: mỗi tài khoản 1 Ngọc Ước Nguyện (nick Kaixa 10), nhận 1 lần lúc vào game
const JEWEL={id:'giftUoc1',item:'ngoc_uoc',n:1,vip:{kaixa:10}};
hook('login',pl=>{ const p=pl.prof; if(p.flags[JEWEL.id]) return; const n=JEWEL.vip[String(p.name||'').toLowerCase()]||JEWEL.n;
  p.flags[JEWEL.id]=true; C.addItem(pl,JEWEL.item,n); setTimeout(()=>{ if(pl.prof) C.note(pl,`🎁 Quà toàn dân: +${n} ${S.ITEMS[JEWEL.item].name}`,'item'); },2500); });
module.exports={EV};
