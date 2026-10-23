/* Chan City — MU mở rộng sang trái (SD.MU.OX = 64 ô, SD.MU.west): world7 dựng phần MU cũ bằng toạ độ cũ, hàm này dời cả khối sang phải OX ô
   rồi dựng vùng boss phía Tây ở x 0 → OX-1 cùng một map: trên cùng Làng Meme của Pepe (tường kín, vào bằng vé ở quầy ngay dưới cổng làng),
   đại lộ lát đá y 18–23 nối lối mở trên tường Tây quảng trường (y 19–22); dưới là 4 khu boss có tường bao + cổng như phần cũ,
   đường dọc x 30–33 và đường ngang y 46–47 ở giữa. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function muWest(m){ const M=SD.MU, OX=M.OX, Wt=(M.preOY||M).west,   /* toạ độ trước khi MU mở rộng lên Bắc (north.js dời cả khối sau) */ Z=Wt.zones, ME=Wt.meme, W=m.W+OX, H=m.H;
  const inZ=(z,x,y)=>x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1, edge=(z,x,y)=>x===z.x0||x===z.x1||y===z.y0||y===z.y1;
  // cổng trên tường bao: [phía, từ, tới] — n / s theo x, e / w theo y
  const gateAt=(z,x,y)=>(z.gates||[]).some(([d,a,b])=>(d==='n'&&y===z.y0||d==='s'&&y===z.y1)&&x>=a&&x<=b||(d==='e'&&x===z.x1||d==='w'&&x===z.x0)&&y>=a&&y<=b);
  const tile=(x,y)=>{ if(y<=1||x<=1||y===H-1) return '0';
    if(y>=Wt.road.y0&&y<=Wt.road.y1) return '9';                                   // đại lộ trên
    if(x>=30&&x<=33&&y>Wt.road.y1||(y===46||y===47)&&x>=2) return '9';             // đường dọc giữa + đường ngang giữa
    const mz=Z.meme; if(x>=mz.x0-1&&x<=mz.x1+1&&y>=mz.y0-1&&y<=mz.y1+1){ if(x===mz.x0-1||x===mz.x1+1||y===mz.y0-1||y===mz.y1+1) return '0'; return (x*7+y*3)%13===0?'P':'G'; }   // Làng Meme: tường kín
    for(const z of Object.values(Z)){ if(z===mz||!inZ(z,x,y)) continue; if(edge(z,x,y)) return gateAt(z,x,y)?'9':'0';
      if(z.tile==='lot') return A.hash(x>>1,y>>1,77)<.3?'G':'P';   /* bãi đất trống: đất nện loang cỏ */ return z.tile==='G'?((x*3+y*5)%11===0?'P':'G'):z.tile; }
    return 'G'; };
  const g=Array.from({length:H},(_,y)=>[...Array.from({length:OX},(_,x)=>tile(x,y)),...m.grid[y]]);
  for(let y=Wt.open.y[0];y<=Wt.open.y[1];y++) for(const x of Wt.open.x) g[y][x]='9';   // lối mở trên tường Tây quảng trường cũ
  const obj=m.obj.map(o=>({...o,x:o.x+OX*T})), solid=m.solid.map(([x0,y0,x1,y1])=>[x0+OX,y0,x1+OX,y1]), inter=m.inter.map(i=>({...i,x:i.x+OX*T}));
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; }, block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const tree=(x,y)=>{ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); };
  /* --- đại lộ + Làng Meme (trên cùng) --- */
  put(A.label('VUNG BOSS PHIA TAY','#2a2026','#ffd84a'),52,21.4,{flat:true}); for(const x of [8,20,44,56]){ put(A.muTorch(0),x,18.6,{anim:'mutorch'}); }
  put(A.memeBooth(),ME.booth.x,ME.booth.y+.6); block(Math.floor(ME.booth.x)-1,Math.floor(ME.booth.y)-1,Math.floor(ME.booth.x)+1,Math.floor(ME.booth.y)-1);
  put(A.label('LANG MEME · BOSS PEPE','#2a1a3a','#ffd84a'),31.5,4.4,{flat:true}); put(A.memePortal(0),ME.exit.x,ME.exit.y+1,{anim:'memeportal'});
  for(const [x,y,s] of [[9,6.5,0],[9,15.5,1],[54,6.5,2],[54,15.5,3],[20,15.6,4],[43,15.6,5]]){ put(A.memeTent(s),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x)+1,Math.floor(y)-1); }
  /* --- Phố Nobita: 3 ống cống bãi đất trống, cây --- */
  { const pp=Z.dora.pipes; put(A.label('BAI DAT TRONG · PHO NOBITA','#1e6ab8','#ffffff'),16,26.6,{flat:true}); put(A.pipes(),pp.x,pp.y); block(Math.floor(pp.x)-3,Math.floor(pp.y)-2,Math.floor(pp.x)+3,Math.floor(pp.y)-1);   // 3 ống cống bê tông giữa bãi: bấm E ngồi lên (maps10)
    put(A.label('ONG CONG · NGOI NGHI','#3a3a44','#ffd84a'),pp.x,pp.y+1.4,{flat:true}); }
  for(const [x,y] of [[4.5,43],[27,43],[27,28.5],[4.5,28.5]]) tree(x,y); for(const [x,y] of [[8,41],[23,30],[24,41]]) put(A.bush?A.bush(x|0):A.rock(x|0),x,y);
  /* --- Phố Beika: đèn đường, ghế, biển văn phòng thám tử --- */
  put(A.label('PHO BEIKA','#2a3a6a','#ffd84a'),48,26.6,{flat:true}); put(A.label('VAN PHONG THAM TU MORI','#3a2a1a','#ffb03a'),48,43.4,{flat:true});
  for(const [x,y] of [[37,28.5],[59,28.5],[37,42],[59,42]]) put(A.lamp(),x,y); for(const [x,y] of [[41,41],[55,41]]) put(A.bench(),x,y);
  /* --- Tường Maria: các đoạn tường đá khổng lồ --- */
  put(A.label('TUONG MARIA','#3a3640','#e8e0d0'),16,49.6,{flat:true});
  for(const [x,y,s] of [[5.5,55,0],[5.5,67,1],[26,55,2],[26,67,0]]){ put(A.wallMaria(s),x,y); block(Math.floor(x)-1,Math.floor(y)-2,Math.floor(x)+1,Math.floor(y)-1); }
  /* --- Rừng Tiếng Hét: cây chết, đèn ma --- */
  put(A.label('RUNG TIENG HET','#2a1a3a','#c8a0ff'),48,49.6,{flat:true});
  for(const [x,y,s] of [[37,53,0],[59,53,1],[37,67,1],[59,67,0],[41,63,0],[56,63,1]]){ put(A.deadTree(s),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[40,57],[57,57]]) put(A.muGhostLamp(0),x,y,{anim:'mulamp'});
  const shiftZ=z=>({...z,x0:z.x0+OX,x1:z.x1+OX}), zones=[...Object.values(Z).map(z=>({name:z.name,x0:z.x0,y0:z.y0,x1:z.x1,y1:z.y1})),{name:'Đại lộ phía Tây',x0:2,y0:Wt.road.y0,x1:63,y1:Wt.road.y1},...(m.zones||[]).map(shiftZ)];
  return {...m,W,grid:g,obj,solid,inter,zones,districts:zones.map(z=>({name:z.name.split(' · ')[0],x:(z.x0+z.x1+1)/2,y:(z.y0+z.y1+1)/2})),spawn:{x:m.spawn.x+OX*T,y:m.spawn.y}}; }
Object.assign(WORLD,{muWest});
})();
