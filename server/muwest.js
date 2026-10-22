// Vùng boss phía Tây của map MU (x 0–63): Làng Meme trên cùng có tường kín. Mua vé ở quầy ngay dưới cổng làng (mỗi ngày 3 vé, 1 triệu / vé)
// thì được đưa vào đánh Pepe; ra bằng cổng cầu vồng trong làng, gục thì hồi sinh ở cổng thành MU như thường.
'use strict';
const C=require('./core'), MU=require('./mu');
const {S,T,on,take,markDirty}=C, ME=S.MU.west.meme;
const near=(pl,x,y,r)=>Math.hypot(pl.x/T-x,pl.y/T-y)<=r;
const inMeme=(x,y)=>x>=ME.x0-1&&x<=ME.x1+1&&y>=ME.y0-1&&y<=ME.y1+1;
const ticketOf=p=>{ const day=S.realTime().day; if(!p.memeT||p.memeT.day!==day) p.memeT={day,n:0}; return p.memeT; };
on('muw',(pl,m)=>{ const p=pl.prof; if(!p) return {err:'?'}; const op=m.op, tk=ticketOf(p);
  if(op==='info') return {left:ME.perDay-tk.n,price:ME.ticket};
  if(op==='ticket'){ if(pl.scene!=='mu'||!near(pl,ME.booth.x,ME.booth.y,2.8)) return {err:'Tới quầy vé Làng Meme (dưới cổng làng, cuối đại lộ phía Tây MU)'}; if(!MU.rec(p).cls) return {err:'Chọn class MU ở Vệ binh (quảng trường) trước đã'};
    if(tk.n>=ME.perDay) return {err:`Hôm nay bạn đã dùng đủ ${ME.perDay} vé, mai quay lại nhé`}; if(!take(pl,ME.ticket)) return {err:`Vé ${S.fmt(ME.ticket)}, không đủ tiền`};
    tk.n++; markDirty(pl); C.moveTo(pl,'mu',ME.inside.x,ME.inside.y); return {ok:1,left:ME.perDay-tk.n,msg:`Vào Làng Meme! Hôm nay còn ${ME.perDay-tk.n} vé`}; }
  if(op==='out'){ if(pl.scene!=='mu'||!inMeme(pl.x/T,pl.y/T)||!near(pl,ME.exit.x,ME.exit.y,2.6)) return {err:'Tới cổng ra của làng'}; C.moveTo(pl,'mu',ME.booth.x+1.5,ME.booth.y+1.4); return {ok:1}; }
  return {err:'?'}; });
module.exports={inMeme,ticketOf};
