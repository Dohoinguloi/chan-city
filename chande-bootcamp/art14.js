/* Chan City — rau củ quả vẽ lại bằng khối có đổ bóng (A.vol của art13): icon 14×14 cho túi đồ / quán, và cây ngoài ruộng 3 giai đoạn
   (mầm · đang lớn · chín). Mỗi loại có dáng riêng: củ (lá trên, củ nhô khỏi đất), quả trên cây, bắp / búp, dây bò (quả nằm đất), thân cao (ngô, cần tây). */
(function(){
const A=ART, vol=A.vol;
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)], mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
// dải 4 tông từ 1 màu gốc: sáng ngả vàng ấm, tối ngả tím lạnh (kiểu pixel art)
const R=c=>{ const b=hx(c); return [mix(b,[255,250,226],.5),b,mix(b,[30,12,60],.32),mix(b,[16,6,40],.58)].map(v=>[...v,255]); };
const LEAF=R('#4caa48'), LEAFD=R('#2e7a3a'), LEAFL=R('#8ad45a'), STEM=R('#6aa848');
// mỗi loại: ic(V) vẽ icon trên lưới 14×14; type + màu để vẽ cây ngoài ruộng
const VEG={
  ca_chua:{type:'fruit',col:'#e2402e',ic:V=>{ V.ell(7,8,5.5,4.8,R('#e2402e')); V.tube([[4,4],[10,4]],1,LEAF).tube([[7,4],[7,1]],[1,.6],STEM); V.px(7,5,'#2e7a3a'); }},
  ca_rot:{type:'root',col:'#f08a2e',top:'#f08a2e',ic:V=>{ for(const [x,y] of [[3,1],[5,0],[7,1]]) V.tube([[5,4],[x,y]],[1.2,.5],LEAF,{g:'l'}); V.tube([[5,4],[11,12]],[3.2,.7],R('#f08a2e')); for(const [x,y] of [[7,7],[8,9],[6,6]]) V.px(x,y,'#b85a1a'); }},
  cu_cai_do:{type:'root',col:'#d8304a',top:'#d8304a',ic:V=>{ for(const [x,y] of [[4,1],[7,0],[10,1]]) V.tube([[7,5],[x,y]],[1.2,.5],LEAF,{g:'l'}); V.ell(7,8.5,4.5,4,R('#d8304a')); V.tube([[7,12],[8,13.5]],[1,.4],R('#f4f0e0')); V.px(5,7,'#ffd0d8'); }},
  cu_den:{type:'root',col:'#9a1a3a',top:'#9a1a3a',ic:V=>{ for(const [x,y] of [[4,1],[7,0],[10,1]]) V.tube([[7,5],[x,y]],[1.2,.5],R('#b83a4a'),{g:'l'}); V.ell(7,8.5,4.6,4.2,R('#9a1a3a')); V.tube([[7,12.5],[7,13.8]],[.9,.3],R('#9a1a3a')); }},
  hanh_tay:{type:'root',col:'#c8783a',top:'#c8783a',ic:V=>{ V.tube([[7,5],[7,1]],[1.4,.4],R('#c8a06a')); V.ell(7,8.5,4.8,4.3,R('#c8783a')); V.line(5,6,5,11,'#8a4a1a').line(9,6,9,11,'#8a4a1a'); V.px(6,13,'#e8d8b0').px(8,13,'#e8d8b0'); }},
  toi:{type:'root',col:'#f0ece0',top:'#f0ece0',ic:V=>{ V.tube([[7,5],[7,1]],[1.3,.4],R('#e0d8c0')); V.ell(7,9,4.8,4,R('#f0ece0')); V.line(5,7,5,11,'#b8b098').line(7,6,7,12,'#b8b098').line(9,7,9,11,'#b8b098'); V.px(6,13,'#c8b898'); }},
  khoai_tay:{type:'root',col:'#c89a5a',top:'#c89a5a',ic:V=>{ V.ell(7,7.5,5.6,4.4,R('#c89a5a')); for(const [x,y] of [[5,6],[9,8],[7,10],[4,9]]) V.px(x,y,'#7a5a2a'); }},
  bap_cai:{type:'head',col:'#a8d878',ic:V=>{ V.ell(7,8,5.8,5,R('#7ab84a')); V.ell(7,7.5,4,3.6,R('#b8e088')); V.line(7,4,7,11,'#7ab84a').line(4,8,6,6,'#7ab84a').line(10,8,8,6,'#7ab84a'); }},
  xa_lach:{type:'head',col:'#9bd36a',ic:V=>{ for(const [x,y,r] of [[4,8,3.4],[10,8,3.4],[7,6,3.6],[7,9.5,3.8]]) V.ell(x,y,r,r*.9,R('#9bd36a'),{g:'h'}); V.line(7,6,7,11,'#5a9a3a').line(4,7,6,9,'#5a9a3a').line(10,7,8,9,'#5a9a3a'); }},
  bong_cai:{type:'head',col:'#3a8a3a',ic:V=>{ V.tube([[7,8],[7,13]],[1.6,2.2],R('#8ac85a')); for(const [x,y] of [[4.5,6],[9.5,6],[7,3.8],[6,7.5],[8.5,7.6]]) V.ell(x,y,3,2.8,R('#3a8a3a'),{g:'f'}); }},
  sup_lo:{type:'head',col:'#f4f0dc',ic:V=>{ V.ell(3.5,10,3,2.5,LEAF).ell(10.5,10,3,2.5,LEAF); for(const [x,y] of [[5,7],[9,7],[7,5],[7,8.5]]) V.ell(x,y,2.8,2.6,R('#f4f0dc'),{g:'f'}); }},
  atiso_cay:{type:'head',col:'#6e9a6a',ic:V=>{ V.tube([[7,11],[7,13.5]],1.2,STEM); for(const [y,r] of [[10,5],[7.5,4.2],[5,3.2],[3,2]]) V.ell(7,y,r,2.6,R('#6e9a6a')); V.px(7,1,'#8a5aa8'); }},
  ot:{type:'fruit',col:'#e2302a',ic:V=>{ V.tube([[4,3],[6,6],[8,9],[11,12]],[1.6,2.2,1.8,.5],R('#e2302a')); V.tube([[4,3],[2,1]],[1,.6],STEM); V.px(5,5,'#ffb0a0'); }},
  ot_chuong:{type:'fruit',col:'#f2a020',ic:V=>{ V.ell(5,8,3,4.5,R('#f2a020'),{g:'p'}).ell(9,8,3,4.5,R('#f2a020'),{g:'p'}).ell(7,8.5,2.6,4.6,R('#f8b830'),{g:'p'}); V.tube([[7,4],[8,1]],[1.2,.8],STEM); }},
  ca_tim:{type:'fruit',col:'#7a3a9a',ic:V=>{ V.tube([[4,4],[7,7],[10,11]],[2,3,3.4],R('#7a3a9a')); for(const [x,y] of [[2,4],[4,2],[6,4]]) V.tube([[4,4],[x,y]],[1.3,.5],LEAF,{g:'c'}); V.px(6,6,'#c8a0e0'); }},
  dau_ha_lan:{type:'fruit',col:'#7ac84a',ic:V=>{ V.tube([[2,10],[7,8],[12,4]],[1.4,2.6,1.2],R('#5aa83a')); for(const [x,y] of [[4.5,9],[7,7.8],[9.5,6.2]]) V.ell(x,y,1.5,1.5,R('#9ae06a'),{g:'pea'}); V.tube([[12,4],[13,2]],[.8,.4],STEM); }},
  dau_que:{type:'fruit',col:'#4aa83a',ic:V=>{ for(const [x0,x1] of [[3,6],[6,9],[9,12]]) V.tube([[x0,2],[x0+.5,7],[x1,12]],[.6,1.3,.6],R('#4aa83a'),{g:'b'+x0}); }},
  dua_leo:{type:'vine',col:'#2f8a3a',ic:V=>{ V.tube([[2.5,10.5],[11.5,3.5]],[2.4,2.8],R('#2f8a3a')); for(const [x,y] of [[5,9],[8,6],[10,5],[4,8]]) V.px(x,y,'#9ad46a'); V.tube([[11.5,3.5],[13,2]],[.8,.4],R('#c8a040')); }},
  bi_ngoi:{type:'vine',col:'#f2d030',ic:V=>{ V.tube([[2.5,11],[11,4]],[2.4,3],R('#f2d030')); V.tube([[11,4],[12.5,2]],[1.2,.8],STEM); V.line(4,9,9,5,'#fff6a8'); }},
  bi_do:{type:'vine',col:'#e88a2e',ic:V=>{ V.ell(7,8.5,6,4.6,R('#e88a2e')); V.line(5,5,5,12,'#b85a1a').line(9,5,9,12,'#b85a1a').line(7,4,7,13,'#c8701e'); V.tube([[7,4],[8,1.5]],[1.2,.8],R('#6a8a2a')); }},
  dua_hau:{type:'vine',col:'#3f8a3a',ic:V=>{ V.ell(7,8,6,5,R('#3f8a3a')); for(const x of [4,7,10]) V.line(x,3.5,x+(x-7)*.3,12.5,'#1e5a2a'); V.px(4,5,'#a8e088'); }},
  ngo:{type:'tall',col:'#f2c43d',ic:V=>{ V.tube([[4,12],[3,3]],[1.5,.6],LEAF,{g:'hu'}).tube([[10,12],[12,4]],[1.5,.6],LEAF,{g:'hu'}); V.tube([[7,12],[7,2.5]],[2.6,1.8],R('#f2c43d')); for(let y=4;y<=11;y+=2) V.px(6,y,'#c8901a').px(8,y+1,'#c8901a'); V.tube([[5,13],[9,13]],1.4,LEAFD); }},
  can_tay:{type:'tall',col:'#9ad46a',ic:V=>{ for(const x of [5,7,9]) V.tube([[7,13],[x,4]],[1.4,1],R('#b8e088'),{g:'s'}); for(const [x,y] of [[4,3],[7,2],[10,3]]) V.ell(x,y,2,1.6,LEAF,{g:'lf'}); }},
  hanh_la:{type:'tall',col:'#6cc04a',ic:V=>{ for(const [x,y] of [[4,1],[7,0.5],[10,1.5]]) V.tube([[7,10],[x,y]],[1.1,.6],R('#6cc04a'),{g:'s'}); V.ell(7,11.2,2.2,2,R('#f4f0e0')); V.px(6,13,'#c8b898').px(8,13,'#c8b898'); }},
  rau_muong:{type:'leafy',col:'#5fae46',ic:V=>{ for(const [x,y] of [[3,2],[7,1],[11,2]]) V.tube([[7,13],[x,y]],[.9,.6],R('#8ac85a'),{g:'s'}); for(const [x,y] of [[3.5,3],[7,2],[10.5,3],[5,7],[9,7]]) V.ell(x,y,2,1.3,R('#5fae46'),{g:'lf'}); }},
  cai_ngot:{type:'leafy',col:'#8cc95a',ic:V=>{ V.tube([[7,13],[5,6]],[1.4,1.2],R('#d8f0b8'),{g:'s'}).tube([[7,13],[9,6]],[1.4,1.2],R('#d8f0b8'),{g:'s'}); V.ell(4.5,4.5,3,3.4,R('#3a8a3a'),{g:'lf'}).ell(9.5,4.5,3,3.4,R('#3a8a3a'),{g:'lf'}).ell(7,3,2.6,3,R('#4caa48'),{g:'lf'}); V.px(6,9,'#f2d030'); }},
  dau_tay:{type:'fruit',col:'#e2343e',ic:V=>{ V.ell(7,8,4.8,4,R('#e2343e')); V.tube([[4,9],[7,13]],[2.5,.8],R('#e2343e')).tube([[10,9],[7,13]],[2.5,.8],R('#e2343e')); for(const [x,y] of [[5,7],[8,6],[9,9],[6,10],[7,8]]) V.px(x,y,'#ffe066'); for(const [x,y] of [[4,4],[7,3],[10,4]]) V.tube([[7,5],[x,y]],[1.2,.5],LEAF,{g:'c'}); }},
};
// icon 14×14
const ICN={}; const oldIcon=A.icon;
A.icon=function(name,scale=1){ const k=name.startsWith('crop_')&&name.slice(5); if(!k||!VEG[k]) return oldIcon(name,scale);
  const c=ICN[k]||(ICN[k]=(()=>{ const V=vol(14,14); VEG[k].ic(V); return V.done(false); })()); if(scale===1) return c;
  const s=A.cv(14*scale,14*scale), g=s.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(c,0,0,s.width,s.height); return s; };
// cây ngoài ruộng 14×16, neo gốc ở (7,14): 0 mầm · 1 đang lớn · 2 chín (thấy rõ củ / quả)
const oldCrop=A.crop;
A.crop=function(kind,stage,col){ const d=VEG[kind]; if(!d||stage===0) return oldCrop(kind,stage,col); const V=vol(16,18), C=R(d.col), ripe=stage===2, s=ripe?1:.75;
  const tufts=(n,h,cl=LEAF)=>{ for(let i=0;i<n;i++){ const a=-Math.PI/2+(i-(n-1)/2)*.55; V.tube([[8,15],[8+Math.cos(a)*h*.55,15+Math.sin(a)*h]],[1.2,.5],cl,{g:'tf'}); } };
  if(d.type==='root'){ tufts(ripe?5:4,ripe?8:6,kind==='cu_den'?R('#b83a4a'):LEAF); if(ripe) V.ell(8,14.5,3.4,2.6,C); }
  else if(d.type==='fruit'){ V.ell(8,11,5*s+1,4.5*s+.5,LEAF,{g:'b'}).ell(6,9,3*s,2.6*s,LEAFL,{g:'b'}).ell(10.5,10,2.8*s,2.4*s,LEAFD,{g:'b'});
    if(ripe){ const pts=kind==='ca_tim'?[[5,13],[11,13]]:kind==='dau_que'||kind==='dau_ha_lan'?[[5,12],[9,13],[12,11]]:[[5,12],[10,13],[8,9],[12,10]];
      for(const [x,y] of pts){ if(kind==='ca_tim') V.tube([[x,y-3],[x,y+1]],[1.2,2],C); else if(kind==='dau_que'||kind==='dau_ha_lan') V.tube([[x,y-3],[x+.5,y+1]],[.8,.8],R('#7ac84a')); else if(kind==='ot') V.tube([[x,y-2],[x+1,y+1]],[1,.5],C); else V.ell(x,y,1.8,1.7,C); } } }
  else if(d.type==='head'){ if(ripe){ V.ell(4,14,3,2,LEAFD).ell(12,14,3,2,LEAFD); VEG[kind].ic(V); } else { V.ell(8,12,5,3.6,LEAF).ell(8,10.5,3,2.4,LEAFL); } }
  else if(d.type==='vine'){ V.ell(5,12,3.4*s+.6,2.6*s+.4,LEAF,{g:'v'}).ell(11,11,3*s,2.4*s,LEAFD,{g:'v'}).tube([[2,13],[14,12]],.7,STEM,{g:'v'}); if(ripe){ if(kind==='bi_do'||kind==='dua_hau') V.ell(8.5,14,4.6,3,C); else V.tube([[4,15],[12,13]],[2,2.4],C); } }
  else if(d.type==='tall'){ if(kind==='ngo'){ V.tube([[8,16],[8,2]],[1.2,.6],STEM).tube([[8,10],[3,7]],[1,.4],LEAF,{g:'l'}).tube([[8,7],[13,4]],[1,.4],LEAF,{g:'l'}).tube([[8,13],[13,11]],[1,.4],LEAF,{g:'l'}); if(ripe){ V.tube([[9.5,12],[10.5,7]],[1.6,1.1],C); V.px(10,6,'#c9a35e'); } }
    else { tufts(ripe?5:3,ripe?11:7,kind==='can_tay'?R('#b8e088'):C); if(kind==='hanh_la'&&ripe) V.ell(8,15,2,1.6,R('#f4f0e0')); if(kind==='can_tay'&&ripe) for(const [x,y] of [[4,5],[8,4],[12,5]]) V.ell(x,y,1.8,1.4,LEAF,{g:'lf'}); } }
  else { tufts(ripe?6:4,ripe?8:6,C); if(ripe) V.ell(8,13,4,2.4,C,{g:'tf'}); }
  return {c:V.done(false),ax:8,ay:16}; };
})();
