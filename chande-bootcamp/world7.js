/* Chan City — MU Online · Lục Địa Cát (96×30): quảng trường lát đá (x 2–41: đền Luffy phía Bắc, đài phun nước, Vệ binh, Pháp sư Cát, cổng Nam ra ngoài),
   rừng Làng Lá (x 44–69: Bắc là bãi tập ninja của Naruto với cổng torii, cọc tập, quán ramen; Nam là Đầm Rồng có hồ cho Rồng Dải Xanh),
   phía Đông (x 72–93: Bắc nghĩa địa bóng ma của Dươngg Vũ, Nam bãi phế liệu của Quỷ Cưa). Các khu nối bằng cổng trên tường thành. Toạ độ theo ô 16px. */
(function(){
const A=ART, T=A.T, SD=SHARED;
function kit(){ const obj=[], solid=[], inter=[];
  const put=(spr,tx,ty,o={})=>{ const it={spr,x:Math.round(tx*T),y:Math.round(ty*T),...o}; obj.push(it); return it; };
  const block=(x0,y0,x1,y1)=>solid.push([x0,y0,x1,y1]);
  const act=(x,y,label,o,r=20)=>inter.push({x:x*T,y:y*T,label,r,...o});
  return {obj,solid,inter,put,block,act}; }
function buildMU(){ const M=SD.MU, W=M.W, H=M.H, Z=M.zones, K=kit(), {put,block,act}=K;
  const g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{
    if(y<=1||x<=1||x>=W-2||y===H-1) return '0';
    if(x===42||x===43||x===70||x===71) return (y>=Z.gateN.y0&&y<=Z.gateN.y1)||(y>=Z.gateS.y0&&y<=Z.gateS.y1)?'9':'0';
    if(x<42) return (x<5||x>38||y>H-5)?'G':'9';
    if(x<70){ if(y===Z.split||y===Z.split+1) return x>=Z.gapF[0]&&x<=Z.gapF[1]?'G':'0'; const L=Z.lake; if(y>Z.split&&((x-L.x)/L.rx)**2+((y-L.y)/L.ry)**2<=1) return 'W'; return y<Z.split&&(x+y)%7===0?'P':'G'; }
    if(y===Z.split||y===Z.split+1) return x>=Z.gapE[0]&&x<=Z.gapE[1]?(y===Z.split?'%':'&'):'0';
    return y<Z.split?'%':'&'; }));
  for(let x=19;x<=24;x++) g[H-1][x]='9';
  /* --- quảng trường: đền Luffy, đuốc, đài phun nước, cờ, quầy Pháp sư, cây --- */
  const al=M.altar; put(A.muAltar(0),al.x,al.y+2.5,{flat:true,anim:'mualtar'});
  for(const [x,y] of [[13,4],[31,4],[13,11],[31,11]]){ put(A.muTorch(0),x,y,{anim:'mutorch'}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.muFountain(0),M.fountain.x,M.fountain.y,{anim:'mufount'}); block(20,13,23,15);
  [['#c8302a',9],['#f2c43d',22],['#3a6ad8',35]].forEach(([c,x])=>put(A.muBanner(c),x,3.2,{flat:true}));
  put(A.muStall(),30.6,19.2); block(29,17,32,18);
  put(A.muPremium(),11.5,19.4); block(10,17,13,18);
  put(A.muSmithStall(),6.5,14.2); block(5,12,8,13);   // quầy Thợ Rèn Huyền Thoại (50 vũ khí)
  put(A.muJewelStall(),35.5,11.6); block(34,9,37,10);   // quầy Thợ Kim Hoàn (phụ kiện: cánh, dây chuyền, hộ thân, aura)   // quầy Premium Store (Thương nhân Huyền Thoại đứng trước)
  const tree=(x,y)=>{ put(A.tree((x*7+y)|0,.9),x,y,{tree:true}); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); };
  for(const [x,y] of [[3,6],[3,12],[3,18],[40,6],[40,18],[3,24]]) tree(x,y);
  put(A.label('MU ONLINE · LUC DIA CAT','#2a2026','#ffd84a'),22,26.4,{flat:true}); act(22,28.4,'Ra khỏi game (gọi Grab)',{do:'grab'},26);
  put(A.label('→ LANG LA · DAM RONG','#2a2026','#ff9a3a'),37,13.2,{flat:true});
  /* --- rừng Làng Lá phía Bắc: cổng torii, cọc tập, quán ramen, bia đá --- */
  put(A.muTorii(),46.5,9.6); block(45,9,45,9); block(48,9,48,9); put(A.label('LANG LA','#c8302a','#ffffff'),46.5,4.6,{flat:true});
  for(const [x,y] of [[52,5],[54,5.2],[63,12],[65,12.2]]){ put(A.muPost(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  put(A.muRamen(),64,5.2); block(62,3,66,4); for(const [x,y] of [[45,13],[68,3],[68,13],[50,13.5],[60,3]]) tree(x,y);
  /* --- Đầm Rồng phía Nam: đá quanh hồ, sậy, tổ rồng --- */
  for(const [x,y] of [[49,21],[65,21],[50,26],[64,26.5],[57,19],[57,27.2]]){ put(A.rock?A.rock(x|0):A.pottedFern(),x,y); }
  for(const [x,y] of [[46,19],[68,19],[46,28],[68,28]]) tree(x,y); put(A.label('DAM RONG','#1a5a30','#9ae8a0'),57,17.9,{flat:true});
  /* --- nghĩa địa phía Đông Bắc: bia mộ, cây khô, đèn ma, quan tài --- */
  put(A.label('NGHIA DIA BONG MA','#2a1a3a','#c8a0ff'),83,2.6,{flat:true});
  let gi=0; for(let y=4;y<=13;y+=3) for(let x=74;x<=92;x+=4){ if(Math.abs(x-84)<4&&Math.abs(y-8)<4) continue; put(A.muGrave(gi++),x+(y%2),y); block(x+(y%2),y-1,x+(y%2),y-1); }
  for(const [x,y] of [[73,3.5],[93,13],[77,13.5]]){ put(A.muDeadTree(),x,y); block(Math.floor(x),Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[79,8],[89,8]]) put(A.muGhostLamp(0),x,y,{anim:'mulamp'}); put(A.muCoffin(),84,12.6,{flat:true});
  /* --- bãi phế liệu phía Đông Nam: đống sắt vụn, lốp xe, thùng phuy, biển cưa máy --- */
  put(A.label('BAI PHE LIEU','#3a2a1a','#ffb03a'),83,18.2,{flat:true});
  for(const [x,y,v] of [[75,21,0],[92,21,1],[75,27,2],[92,27,0],[79,25,1],[89,19.5,2]]){ put(A.muJunk(v),x,y); block(Math.floor(x)-1,Math.floor(y)-1,Math.floor(x),Math.floor(y)-1); }
  for(const [x,y] of [[77,19],[90,24],[86,27.6]]) put(A.muBarrel(),x,y); for(const [x,y] of [[81,27.4],[73,24]]) put(A.muTires(),x,y);
  // khu (hiện tên khi đi vào + trên minimap / bản đồ lớn)
  const zones=[{name:'Quảng trường Lục Địa Cát',x0:2,y0:2,x1:41,y1:28},{name:'Rừng Làng Lá',x0:44,y0:2,x1:69,y1:14},{name:'Đầm Rồng',x0:44,y0:17,x1:69,y1:28},
    {name:'Nghĩa địa Bóng Ma',x0:72,y0:2,x1:93,y1:14},{name:'Bãi Phế Liệu',x0:72,y0:17,x1:93,y1:28}], districts=zones.map(z=>({name:z.name,x:(z.x0+z.x1+1)/2,y:(z.y0+z.y1+1)/2}));
  return {name:'MU Online · Lục Địa Cát',W,H,grid:g,obj:K.obj,solid:K.solid,inter:K.inter,zones,districts,spawn:{x:M.spawn.x*T,y:M.spawn.y*T}}; }
Object.assign(WORLD,{buildMU});
})();
