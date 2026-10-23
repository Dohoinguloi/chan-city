// Vùng boss phía Tây của map MU (x 0–63): Làng Meme trên cùng có tường kín. Mua vé ở quầy ngay dưới cổng làng (mỗi ngày 3 vé, 1 triệu / vé)
// thì được đưa vào đánh Pepe; ra bằng cổng cầu vồng trong làng, gục thì hồi sinh ở cổng thành MU như thường.
'use strict';
const C=require('./core'), MU=require('./mu'), {shopPay}=require('./perks');   // ngủ trưa: giảm 20% cho học viên / nhân viên
const {S,T,on,take,markDirty}=C, ME=S.MU.west.meme;
const near=(pl,x,y,r)=>Math.hypot(pl.x/T-x,pl.y/T-y)<=r;
const inMeme=(x,y)=>x>=ME.x0-1&&x<=ME.x1+1&&y>=ME.y0-1&&y<=ME.y1+1;
const ticketOf=p=>{ const day=S.realTime().day; if(!p.memeT||p.memeT.day!==day) p.memeT={day,n:0}; return p.memeT; };
on('muw',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const op=m.op, tk=ticketOf(p);
  if(op==='info') return {left:ME.perDay-tk.n,price:ME.ticket};
  // cổng dịch chuyển (data.js MU.portals): đứng gần 1 cổng / bệ, chọn cổng tới; ra khỏi bệ thì đứng lệch xuống dưới cho khỏi kẹt trong vòm
  if(op==='warp'){ const P=S.MU.portals, at=P.find(q=>pl.scene==='mu'&&near(pl,q.x,q.kind==='front'?q.y-1:q.y,S.MU.portalR)), to=P.find(q=>q.id===m.to); if(!at) return {err:'Đứng gần cổng dịch chuyển đã'};
    if(!to||to===at) return {err:'?'}; if(inMeme(pl.x/T,pl.y/T)) return {err:'Ra khỏi Làng Meme bằng cổng cầu vồng'}; const t=C.now(); if((pl.warpAt||0)>t) return {err:'Cổng đang nạp năng lượng, đợi chút'}; pl.warpAt=t+2500;
    const [x,y]=to.kind==='front'?[to.x,to.y-1.6]:to.kind==='side'?[to.x-1.6,to.y]:[to.x,to.y+1.2]; C.moveTo(pl,'mu',x,y,{warp:to.col}); return {ok:1,msg:'🌀 Dịch chuyển tới '+to.name}; }
  if(op==='ticket'){ if(pl.scene!=='mu'||!near(pl,ME.booth.x,ME.booth.y,2.8)) return {err:'Tới quầy vé Làng Meme (dưới cổng làng, cuối đại lộ phía Tây MU)'}; if(!MU.rec(p).cls) return {err:'Chọn class MU ở Vệ binh (quảng trường) trước đã'};
    if(tk.n>=ME.perDay) return {err:`Hôm nay bạn đã dùng đủ ${ME.perDay} vé, mai quay lại nhé`}; if(!take(pl,ME.ticket)) return {err:`Vé ${S.fmt(ME.ticket)}, không đủ tiền`};
    tk.n++; markDirty(pl); C.moveTo(pl,'mu',ME.inside.x,ME.inside.y); return {ok:1,left:ME.perDay-tk.n,msg:`Vào Làng Meme! Hôm nay còn ${ME.perDay-tk.n} vé`}; }
  if(op==='out'){ if(pl.scene!=='mu'||!inMeme(pl.x/T,pl.y/T)||!near(pl,ME.exit.x,ME.exit.y,2.6)) return {err:'Tới cổng ra của làng'}; C.moveTo(pl,'mu',ME.booth.x+1.5,ME.booth.y+1.4); return {ok:1}; }
  return {err:'?'}; });
// Phòng Nghỉ Trưa ở quảng trường MU: trả tiền, nằm nghỉ là hồi năng lượng ngay, 30 phút mới nghỉ tiếp được
on('munap',pl=>{ const p=pl.prof, N=S.MU.nap, t=C.now(); if(!p) return {err:'?'}; if(pl.scene!=='mu'||!near(pl,N.x,N.y,2.8)) return {err:'Vào Phòng Nghỉ Trưa ở quảng trường MU'};
  if((p.muNapAt||0)>t) return {err:`Vừa ngủ trưa xong, ${Math.ceil((p.muNapAt-t)/60e3)} phút nữa mới nghỉ tiếp được`}; if(p.needs.energy>=99) return {err:'Đang đầy năng lượng rồi'};
  if(!shopPay(pl,N.price)) return {err:`Ngủ trưa ${S.fmt(N.price)}, không đủ tiền`}; p.muNapAt=t+N.cd*60e3; const before=p.needs.energy; p.needs.energy=Math.min(100,p.needs.energy+N.energy); markDirty(pl);
  C.send(pl,{t:'nd',n:{energy:+p.needs.energy.toFixed(1)}}); return {msg:`Ngủ trưa một giấc: +${Math.round(p.needs.energy-before)} năng lượng`}; });
module.exports={inMeme,ticketOf};
