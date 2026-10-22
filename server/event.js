// Sự kiện Ngày Mèn Mén Thế Giới (23/10/2026): vào game trong ngày sự kiện thì hiện banner chào mừng,
// mọi tài khoản được tặng 2.000.000đ (nhận 1 lần, đăng nhập tới hết ngày giftUntil vẫn nhận được). Ngày theo giờ Việt Nam thật.
'use strict';
const C=require('./core');
const {S,hook,send,markDirty}=C;
const EV={id:'menmen26',from:'2026-10-23',to:'2026-10-24',giftUntil:'2026-10-30',gift:2000000,
  title:'🎉 Chào mừng Ngày Mèn Mén Thế Giới 🎉',sub:'Toàn dân Chan City được tặng 2.000.000đ'};
hook('login',pl=>{ const p=pl.prof, d=S.realTime().day; let got=0;
  if(d<=EV.giftUntil&&!p.flags[EV.id]){ p.flags[EV.id]=true; p.money+=EV.gift; got=EV.gift; markDirty(pl); }
  // gửi sau khi client nhận welcome và vào cảnh
  if(got||(d>=EV.from&&d<=EV.to)) setTimeout(()=>send(pl,{t:'evbanner',title:EV.title,sub:EV.sub,gift:got}),1500); });
module.exports={EV};
