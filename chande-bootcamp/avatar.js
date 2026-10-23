/* Dựng sprite nhân vật người chơi từ template 20×35 (pixel-sprite-forge/templates.js), giống hệt cách tool xuất sheet:
   khung 32×48, nghiêng (idle/walk/run/attack/hurt), nhìn xuống, nhìn lên, Quẩy, Hoá Hokage, Gồng, Nói. Có cache theo ngoại hình. */
(function(){
const RT=RefTemplate, SD=SHARED, FW=32, FH=48, OX=6, OY=13, WAIST=28, SPLIT=11;
const SIDE={idle:{fps:4,f:[{},{},{up:1},{up:1}]},walk:{fps:8,f:[{lL:{dy:-1}},{up:1},{lR:{dy:-1}},{up:1}]},run:{fps:12,f:[{lL:{dy:-2},dy:-1},{up:1},{lR:{dy:-2},dy:-1},{up:1}]},
  attack:{fps:12,f:[{upDx:-1},{upDx:3,lL:{dx:1}},{upDx:1}]},hurt:{fps:8,f:[{tint:'w',dx:-1},{tint:'r',dx:-1},{}]}};
const CACHE=new Map();
function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
// khung nghiêng: dịch khối thân trên / 2 chân như animDefs của tool
// px/pt: lề trái / trên của lưới đã nới (đồ Halloween vẽ ra ngoài người)
function side(rows,pal,f,px=0,pt=0){ const c=canvas(FW,FH), g=c.getContext('2d'), im=g.createImageData(FW,FH), L=f.lL||{}, R=f.lR||{}, gdx=f.dx||0, gdy=f.dy||0;
  const put=(x,y,v)=>{ if(x<0||y<0||x>=FW||y>=FH) return; const i=(y*FW+x)*4; im.data[i]=v[0]; im.data[i+1]=v[1]; im.data[i+2]=v[2]; im.data[i+3]=255; };
  rows.forEach((row,yy)=>row.forEach((ch,xx)=>{ if(ch==='.') return; let v=pal[ch]; if(!v) return; const x=xx-px, y=yy-pt;
    if(f.tint){ const [tr,tg,tb,m]=f.tint==='w'?[255,255,255,.8]:[255,60,60,.5]; v=[v[0]+(tr-v[0])*m|0,v[1]+(tg-v[1])*m|0,v[2]+(tb-v[2])*m|0]; }
    if(y>=WAIST){ const p=x<SPLIT?L:R; put(OX+x+(p.dx||0)+gdx,OY+y+(p.dy||0)+gdy,v); } else put(OX+x+gdx+(f.upDx||0),OY+y+gdy+(f.up||0),v); }));
  g.putImageData(im,0,0); return c; }
// lưới ký tự → canvas (khung nhìn xuống/lên rộng 20, tư thế rộng 32 có sẵn lề)
function grid(G,pal,xoff,top,bob,extra){ const c=canvas(FW,FH), g=c.getContext('2d'), im=g.createImageData(FW,FH);
  G.forEach((row,gy)=>row.forEach((ch,gx)=>{ if(ch==='.') return; const v=(extra&&extra[ch])||pal[ch]; if(!v) return; const x=xoff+gx, y=OY-top+gy+bob; if(x<0||y<0||x>=FW||y>=FH) return;
    const i=(y*FW+x)*4; im.data[i]=v[0]; im.data[i+1]=v[1]; im.data[i+2]=v[2]; im.data[i+3]=255; }));
  g.putImageData(im,0,0); return c; }
// set hot: vẽ đè lên lưới nhân vật (20×35). Superman: logo, thắt lưng vàng, quần lót đỏ, áo choàng đỏ.
// Batman: mặt nạ trùm đầu có tai, hở miệng, logo dơi, găng tay, áo choàng tối.
const COSTUME_PAL={'1':[200,40,42],'2':[150,28,30],'3':[242,196,61],'5':[58,64,80],'6':[244,241,234],'7':[28,24,30],'8':[42,46,58],'9':[30,32,42]};
function costume(R,set,view){ const at=(x,y)=>R[y]&&R[y][x], put=(x,y,c)=>{ if(R[y]&&R[y][x]!==undefined) R[y][x]=c; }, empty=(x,y,c)=>{ if(at(x,y)==='.') put(x,y,c); };
  const cape=set==='batman'?'8':'1', fold=set==='batman'?'9':'2', hood=set==='batman';
  for(let y=0;y<R.length;y++) for(let x=0;x<R[y].length;x++){ const c=R[y][x]; if(c==='U') R[y][x]='3';
    if(hood&&y<=(view==='back'?13:12)&&c!=='.'&&c!=='O') R[y][x]=c==='E'?'6':'5';                                   // mặt nạ trùm, chừa mắt trắng
    if(hood&&y>=24&&y<=27&&(c==='S'||c==='s'||c==='d')&&(x<=4||x>=15)) R[y][x]='5'; }                                 // găng tay
  if(hood){ put(view==='side'?8:7,0,'5'); put(view==='side'?12:12,0,'5'); }                                          // 2 tai dơi
  if(!hood&&view!=='back') for(let x=0;x<R[27].length;x++) if(R[27][x]==='P') R[27][x]='1';                         // quần lót đỏ
  if(view==='side'){ if(hood){ put(13,20,'7'); put(14,20,'7'); put(13,21,'7'); } else { put(13,20,'1'); put(12,21,'1'); put(13,21,'3'); put(14,21,'1'); put(13,22,'1'); }
    for(let y=19;y<=32;y++){ const xs=y<22?[2,3]:[0,1,2]; for(const x of xs) empty(x,y,cape); const l=xs[0]-1; if(l>=0) empty(l,y,'O'); } for(const x of [0,1,2]) empty(x,33,'O'); }
  if(view==='front'){ if(hood){ for(const x of [7,9,10,12]) put(x,20,'7'); for(let x=8;x<=11;x++) put(x,21,'7'); } else { for(let x=8;x<=11;x++) put(x,20,'1'); put(8,21,'1'); put(9,21,'3'); put(10,21,'3'); put(11,21,'1'); put(9,22,'1'); put(10,22,'1'); }
    for(let y=19;y<=32;y++){ empty(0,y,cape); empty(19,y,cape); } }
  if(view==='back') for(let y=19;y<=31;y++) for(let x=3;x<=16;x++){ const c=R[y][x]; if(c!=='.'&&c!=='O') R[y][x]=x===7||x===12?fold:cape; } }
function portrait(frame){ const c=canvas(84,84), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,84,84); g.drawImage(frame,5,12,22,20,0,2,88,80); return c; }
function build(look){ const key=JSON.stringify(look); if(CACHE.has(key)) return CACHE.get(key);
  const t=SD.lookToTemplate(look), cols={}; for(const k in t.colors) cols[k]=RT.hx(t.colors[k]);
  const pal=RT.palette(cols), o={...t.opts,quay:true,noi:true,hokage:true}, rows=RT.compose(o).map(r=>[...r]), anims={};
  const hw=o.costume&&window.HWC&&HWC.C[o.costume];   // đồ Halloween / full set: lưới nới lề, bảng màu riêng
  const wr=!hw&&!o.costume&&window.WEAR&&window.WEAR.need(o), padd=hw||wr;   /* đồ phủ Shopee (wear.js): mũ, kính, khăn, hoạ tiết, kiểu tóc, khuôn mặt */
  if(hw) Object.assign(pal,HWC.PAL); else if(o.costume){ Object.assign(pal,COSTUME_PAL); costume(rows,o.costume,'side'); }
  if(wr) window.WEAR.pal(pal,t.colors);
  const ap=(G,view)=>hw?HWC.apply(G,o.costume,view,o.nowep):HWC.over(G,view,u=>window.WEAR.draw(u,o,view));
  const sr=padd?ap(rows,'side'):rows, spx=padd?HWC.PX:0, spt=padd?HWC.PT:0;
  for(const [name,d] of Object.entries(SIDE)) anims[name]={fps:d.fps,loop:name!=='attack'&&name!=='hurt',frames:d.f.map(f=>side(sr,pal,f,spx,spt))};
  for(const [view,suf] of [['front','down'],['back','up']]){ const vf=RT.viewFrames(o,view); for(const k of ['idle','walk','run']) anims[k+'_'+suf]={fps:SIDE[k].fps,loop:true,frames:vf[k].map(G=>{ if(padd) return grid(ap(G,view),pal,OX-HWC.PX,HWC.PT,0); if(o.costume) costume(G,o.costume,view); return grid(G,pal,OX,0,0); })}; }
  const pose=(name,opts,skipTop)=>RT.poseFrames(name,opts).map(f=>grid(skipTop?f.grid.map((r,y)=>y<f.padTop?r.map(()=>'.'):r):f.grid,pal,0,f.padTop||0,f.bob||0,f.palExtra));
  anims.quay={fps:8,loop:true,frames:pose('quay',o)}; anims.hokage={fps:8,loop:false,frames:pose('hokage',o)}; anims.noi={fps:6,loop:true,frames:pose('noi',o,true)};
  anims.gong={fps:8,loop:false,frames:pose('saiyan',{...o,saiyan:{toOpts:{hair:o.hair,beard:o.beard,mouth:o.mouth},toHair:cols.hair}})};
  const out={anims,pal,portrait:portrait(anims.idle.frames[0]),fw:FW,fh:FH}; CACHE.set(key,out); if(CACHE.size>400) CACHE.delete(CACHE.keys().next().value); return out; }
window.AVATAR={build,FW,FH};
})();
