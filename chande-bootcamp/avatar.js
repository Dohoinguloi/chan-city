/* Dựng sprite nhân vật người chơi từ template 20×35 (pixel-sprite-forge/templates.js), giống hệt cách tool xuất sheet:
   khung 32×48, nghiêng (idle/walk/run/attack/hurt), nhìn xuống, nhìn lên, Quẩy, Hoá Hokage, Gồng, Nói. Có cache theo ngoại hình. */
(function(){
const RT=RefTemplate, SD=SHARED, FW=32, FH=48, OX=6, OY=13, WAIST=28, SPLIT=11;
const SIDE={idle:{fps:4,f:[{},{},{up:1},{up:1}]},walk:{fps:8,f:[{lL:{dy:-1}},{up:1},{lR:{dy:-1}},{up:1}]},run:{fps:12,f:[{lL:{dy:-2},dy:-1},{up:1},{lR:{dy:-2},dy:-1},{up:1}]},
  attack:{fps:12,f:[{upDx:-1},{upDx:3,lL:{dx:1}},{upDx:1}]},hurt:{fps:8,f:[{tint:'w',dx:-1},{tint:'r',dx:-1},{}]}};
const CACHE=new Map();
function canvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
// khung nghiêng: dịch khối thân trên / 2 chân như animDefs của tool
function side(rows,pal,f){ const c=canvas(FW,FH), g=c.getContext('2d'), im=g.createImageData(FW,FH), L=f.lL||{}, R=f.lR||{}, gdx=f.dx||0, gdy=f.dy||0;
  const put=(x,y,v)=>{ if(x<0||y<0||x>=FW||y>=FH) return; const i=(y*FW+x)*4; im.data[i]=v[0]; im.data[i+1]=v[1]; im.data[i+2]=v[2]; im.data[i+3]=255; };
  rows.forEach((row,y)=>row.forEach((ch,x)=>{ if(ch==='.') return; let v=pal[ch]; if(!v) return;
    if(f.tint){ const [tr,tg,tb,m]=f.tint==='w'?[255,255,255,.8]:[255,60,60,.5]; v=[v[0]+(tr-v[0])*m|0,v[1]+(tg-v[1])*m|0,v[2]+(tb-v[2])*m|0]; }
    if(y>=WAIST){ const p=x<SPLIT?L:R; put(OX+x+(p.dx||0)+gdx,OY+y+(p.dy||0)+gdy,v); } else put(OX+x+gdx+(f.upDx||0),OY+y+gdy+(f.up||0),v); }));
  g.putImageData(im,0,0); return c; }
// lưới ký tự → canvas (khung nhìn xuống/lên rộng 20, tư thế rộng 32 có sẵn lề)
function grid(G,pal,xoff,top,bob,extra){ const c=canvas(FW,FH), g=c.getContext('2d'), im=g.createImageData(FW,FH);
  G.forEach((row,gy)=>row.forEach((ch,gx)=>{ if(ch==='.') return; const v=(extra&&extra[ch])||pal[ch]; if(!v) return; const x=xoff+gx, y=OY-top+gy+bob; if(x<0||y<0||x>=FW||y>=FH) return;
    const i=(y*FW+x)*4; im.data[i]=v[0]; im.data[i+1]=v[1]; im.data[i+2]=v[2]; im.data[i+3]=255; }));
  g.putImageData(im,0,0); return c; }
function portrait(frame){ const c=canvas(84,84), g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.fillStyle='#f3ecdc'; g.fillRect(0,0,84,84); g.drawImage(frame,5,12,22,20,0,2,88,80); return c; }
function build(look){ const key=JSON.stringify(look); if(CACHE.has(key)) return CACHE.get(key);
  const t=SD.lookToTemplate(look), cols={}; for(const k in t.colors) cols[k]=RT.hx(t.colors[k]);
  const pal=RT.palette(cols), o={...t.opts,quay:true,noi:true,hokage:true}, rows=RT.compose(o).map(r=>[...r]), anims={};
  for(const [name,d] of Object.entries(SIDE)) anims[name]={fps:d.fps,loop:name!=='attack'&&name!=='hurt',frames:d.f.map(f=>side(rows,pal,f))};
  for(const [view,suf] of [['front','down'],['back','up']]){ const vf=RT.viewFrames(o,view); for(const k of ['idle','walk','run']) anims[k+'_'+suf]={fps:SIDE[k].fps,loop:true,frames:vf[k].map(G=>grid(G,pal,OX,0,0))}; }
  const pose=(name,opts,skipTop)=>RT.poseFrames(name,opts).map(f=>grid(skipTop?f.grid.map((r,y)=>y<f.padTop?r.map(()=>'.'):r):f.grid,pal,0,f.padTop||0,f.bob||0,f.palExtra));
  anims.quay={fps:8,loop:true,frames:pose('quay',o)}; anims.hokage={fps:8,loop:false,frames:pose('hokage',o)}; anims.noi={fps:6,loop:true,frames:pose('noi',o,true)};
  anims.gong={fps:8,loop:false,frames:pose('saiyan',{...o,saiyan:{toOpts:{hair:o.hair,beard:o.beard,mouth:o.mouth},toHair:cols.hair}})};
  const out={anims,pal,portrait:portrait(anims.idle.frames[0]),fw:FW,fh:FH}; CACHE.set(key,out); if(CACHE.size>400) CACHE.delete(CACHE.keys().next().value); return out; }
window.AVATAR={build,FW,FH};
})();
