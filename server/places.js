// Địa điểm và hoạt động: nhiệm vụ Ké, nhặt đồ, quán ăn, shop đồ, vào/ra nhà, thuê phòng, gõ cửa, ngủ nhờ,
// hoạt động trong phòng, chụp ảnh sống ảo, câu cá, kayak, việc của cô Ké, học kỹ năng, chợ online.
'use strict';
const C=require('./core'), W=require('./world');
const {S,T,db,on,hook,send,now,today,near,dist,moveTo,markDirty,note,reward,take,give,has,addItem,players,byUid,kindOf,sceneOf,refreshInfo}=C;
const fmt=S.fmt;
const npc=id=>S.NPCS.find(n=>n.id===id);
const inRetreat=pl=>pl.scene==='retreat';
const nearNpc=(pl,id,r=72)=>{ const n=npc(id); return n&&kindOf(pl.scene)===(n.scene||'retreat')&&near(pl,n.x,n.y,r); };

/* ---------- việc có thời gian (tắm, nghỉ, học, làm task...) ---------- */
function startTask(pl,act,sec,done,o={}){ if(pl.task) return {err:'Đang làm việc khác'};
  pl.task={act,end:now()+sec*1000,done,walk:o.walk}; if(o.anim) W.setAct(pl,o.anim,sec); send(pl,{t:'task',act,sec,name:o.name||''}); return {sec}; }
hook('tick',()=>{ const t=now(); for(const pl of players.values()){ const k=pl.task; if(k&&t>=k.end){ pl.task=null; let r; try{ r=k.done(); }catch(e){ console.error(e); }
  send(pl,{t:'task',done:true,act:k.act,...(r||{})}); } } });

/* ---------- cốt truyện: điện thoại, Pháp, nhiệm vụ 6 người ---------- */
on('call',pl=>{ if(kindOf(pl.scene)!=='room') return {err:'Không ở phòng'}; pl.prof.flags.called=true; markDirty(pl); return {}; });
on('hello',pl=>{ if(!nearNpc(pl,'phap')) return {err:'Xa quá'}; pl.prof.flags.hello=true; markDirty(pl); return {}; });
function canFinish(pl,id){ const q=S.QUESTS[id], p=pl.prof;
  if(id==='beagle') return p.flags.beagleFollow;
  if(q.need) return Object.entries(q.need).every(([k,n])=>has(pl,k,n));
  if(q.spots) return q.spots.every(s=>p.flags.spots[s]); return false; }
on('quest',(pl,m)=>{ const q=S.QUESTS[m.id], p=pl.prof; if(!q) return {err:'Không có nhiệm vụ'}; if(!nearNpc(pl,q.giver)) return {err:'Đứng gần người giao việc'};
  if(m.op==='start'){ if(p.quests[m.id]) return {err:'Đã nhận rồi'}; p.quests[m.id]='active'; markDirty(pl); return {}; }
  if(m.op==='finish'){ if(p.quests[m.id]!=='active') return {err:'Chưa nhận'}; if(!canFinish(pl,m.id)) return {err:'Chưa xong'};
    for(const [k,n] of Object.entries(q.need||{})) addItem(pl,k,-n);
    if(m.id==='beagle') p.flags.beagleFollow=false; if(m.id==='cui') p.flags.fire=true;
    p.quests[m.id]='done'; reward(pl,q.reward,'Hoàn thành: '+q.title); markDirty(pl); return {}; }
  return {err:'?'}; });
// nhặt đồ / chụp check-in / xu / beagle / gà / hoa lá
on('pick',(pl,m)=>{ const p=pl.prof, t=now(); if(!inRetreat(pl)) return {err:'Không ở Ké Retreat'};
  if(m.k==='pickup'){ const it=S.PICKUPS[m.i|0]; if(!it||p.quests[it.quest]!=='active'||p.flags.picked[m.i|0]) return {err:'Không nhặt được'};
    if(!near(pl,it.x,it.y,32)) return {err:'Xa quá'}; p.flags.picked[m.i|0]=true; addItem(pl,it.item); return {item:it.item}; }
  if(m.k==='spot'){ const s=S.SPOTS.find(s=>s.id===m.i); if(!s||p.quests.anh!=='active') return {err:'Không chụp được'};
    if(!near(pl,s.x,s.y,32)) return {err:'Xa quá'}; p.flags.spots[s.id]=true; markDirty(pl); return {spot:s.id}; }
  if(m.k==='coin'){ const c=S.COINS[m.i|0]; if(!c||!p.skills.soi||p.flags.coins[m.i|0]) return {err:'Không có xu'}; if(!near(pl,c[0],c[1],28)) return {err:'Xa quá'};
    p.flags.coins[m.i|0]=true; give(pl,20000); return {vnd:20000}; }
  if(m.k==='beagle'){ if(p.quests.beagle!=='active'||!near(pl,S.BEAGLE_SPOT.x,S.BEAGLE_SPOT.y,64)) return {err:'Không thấy beagle'}; p.flags.beagleFollow=true; markDirty(pl); return {}; }
  if(m.k==='chicken'){ const h=S.CHICKEN_HOME; if(p.quests.co!=='active'||p.flags.chicken||!near(pl,h.x,h.y,(h.r+3)*T)) return {err:'Gà chạy mất'};
    p.flags.chicken=true; addItem(pl,'chicken'); return {item:'chicken'}; }
  if(m.k==='forage'){ const f=S.FORAGE.find(f=>f.id===m.i); if(!f) return {err:'?'}; if(p.forage[f.id]&&t-p.forage[f.id]<f.respawn*1000) return {err:'Chưa mọc lại'};
    if(!near(pl,f.x,f.y,28)) return {err:'Xa quá'}; p.forage[f.id]=t; addItem(pl,f.item); const g=C.gainExp(pl,2); return {item:f.item,exp:g.exp}; }
  return {err:'?'}; });

/* ---------- xe 4 bánh trong Ké (lên dốc miễn phí, xuống dốc 150.000đ) ---------- */
on('car',(pl,m)=>{ const c=S.CARS[m.id]; if(!c||!inRetreat(pl)||!near(pl,c.x,c.y,44)) return {err:'Lại gần xe đã'};
  if(c.price&&!take(pl,c.price)) return {err:`Xuống dốc ${fmt(c.price)}/lượt, không đủ tiền`};
  pl.x=c.to.x*T; pl.y=c.to.y*T; pl.budget=0; send(pl,{t:'pos',x:pl.x,y:pl.y,ride:true}); return {price:c.price}; });

/* ---------- vào/ra nhà ---------- */
on('enter',(pl,m)=>{ const pc=S.PLACES[m.place]; if(!pc||!pc.door) return {err:'Không có cửa'}; if(!inRetreat(pl)||!near(pl,pc.door.x,pc.door.y,44)) return {err:'Đứng trước cửa đã'};
  const I=S.INTERIORS[pc.scene]; moveTo(pl,pc.scene,I.spawn.x,I.spawn.y); return {}; });
function doorOf(kind,stayType){ if(kind==='stay'){ const d=S.ROOMS[stayType].doors[0]; return {x:d[0],y:d[1]+.6}; }
  if(kind==='track') return {x:S.DALAT.track.x,y:S.DALAT.track.y+.7};
  const pc=S.PLACES[kind]; return pc&&pc.door?{x:pc.door.x,y:pc.door.y+.7}:S.SPAWN.retreat; }
on('exit',pl=>{ const k=kindOf(pl.scene); if(!['nongsan','quanao','club','stay','track'].includes(k)) return {err:'Không ở trong nhà'};
  const d=doorOf(k,pl.stayType); moveTo(pl,k==='track'?'dalat':'retreat',d.x,d.y); return {}; });

/* ---------- ăn uống ---------- */
on('eat',(pl,m)=>{ const pc=S.PLACES[m.place], f=S.FOOD[m.id], p=pl.prof; if(!pc||!pc.menu||!f||!pc.menu.includes(m.id)) return {err:'Quán không có món này'};
  const sc=pc.map||'retreat'; if(pl.scene!==sc||!near(pl,pc.x,pc.y,72)) return {err:'Lại gần quán đã'};
  let meal=null;
  if(f.meal){ const st=S.mealStatus(p.meals), slot=st.find(s=>s.st==='now')||st.find(s=>s.st==='missed');
    if(!slot){ const nx=st.find(s=>s.st==='later'); return {err:nx?`Đang no. Bữa tới: ${nx.name} từ ${nx.from}:00`:'Hôm nay ăn đủ 3 bữa rồi'}; }
    meal=slot; }
  if(!take(pl,f.price)) return {err:`Món này ${fmt(f.price)}, không đủ tiền`};
  if(meal){ const d=today(); if(p.meals.day!==d) p.meals={day:d,eaten:{}}; p.meals.eaten[meal.id]=true; }
  if(f.buff) p.buff={mul:f.buff.mul,until:now()+f.buff.min*60e3};
  const r=reward(pl,{exp:f.exp},(meal?(meal.st==='missed'?'Ăn bù ':'')+meal.name.toLowerCase()+': ':'')+f.name);
  markDirty(pl); return {meal:meal&&meal.id,exp:r.exp}; });

/* ---------- shop quần áo ---------- */
on('buy',(pl,m)=>{ const it=S.CLOTHES[m.id], p=pl.prof; if(!it) return {err:'Không có món này'}; if(pl.scene!=='quanao') return {err:'Vào Shop Chande để mua'};
  if(p.owned[m.id]) return {err:'Đã có rồi'}; if(!take(pl,it.price)) return {err:`${it.name} giá ${fmt(it.price)}, không đủ tiền`};
  p.owned[m.id]=1; markDirty(pl); return {}; });
on('equip',(pl,m)=>{ const p=pl.prof, slot=String(m.slot||''); if(!S.SLOTS.some(s=>s[0]===slot)) return {err:'?'};
  if(m.id){ const it=S.CLOTHES[m.id]; if(!it||it.slot!==slot||!p.owned[m.id]) return {err:'Chưa có món này'}; p.look.outfit[slot]=m.id; }
  else { if(['top','bottom','shoes'].includes(slot)) return {err:'Không cởi được món này'}; delete p.look.outfit[slot]; }
  markDirty(pl); refreshInfo(pl); return {look:p.look}; });

/* ---------- thuê phòng ---------- */
const todayRent=r=>S.ROOMS[r].price;
function rentRoll(pl){ const p=pl.prof, d=today(); if(!p.stay||p.stay.paid===d) return;
  const r=S.ROOMS[p.stay.room];
  if(take(pl,r.price)){ p.stay.paid=d; note(pl,`Đã trừ tiền phòng ${r.name}: ${fmt(r.price)}`,'vnd'); }
  else { note(pl,`Không đủ ${fmt(r.price)} tiền phòng ${r.name}, lễ tân đã trả phòng giúp bạn`,'lock'); p.stay=null;
    if(pl.scene==='stay:'+pl.uid){ const dd=doorOf('stay',pl.stayType); moveTo(pl,'retreat',dd.x,dd.y); } }
  markDirty(pl); }
hook('login',rentRoll); hook('slow',()=>{ for(const pl of players.values()) rentRoll(pl); });
on('rent',(pl,m)=>{ const p=pl.prof; if(!nearNpc(pl,'letan')) return {err:'Gặp lễ tân ở Nhà Rếch 2'};
  if(m.op==='checkout'){ if(!p.stay) return {err:'Bạn chưa thuê phòng'}; const n=S.ROOMS[p.stay.room].name; p.stay=null; markDirty(pl); return {msg:'Đã trả '+n}; }
  const r=S.ROOMS[m.room]; if(!r||r.home) return {err:'Không có phòng này'}; if(p.stay&&p.stay.room===m.room&&p.stay.paid===today()) return {err:'Bạn đang ở phòng này rồi'};
  let price=r.price, gift=0; if(!p.flags.rented){ gift=Math.min(price,100000); price-=gift; }
  if(!take(pl,price)) return {err:`${r.name} giá ${fmt(r.price)}/ngày, không đủ tiền`};
  p.stay={room:m.room,paid:today(),since:today()}; p.flags.rented=true; markDirty(pl);
  return {msg:`Đã thuê ${r.name}`+(gift?` (Pháp bao ${fmt(gift)} ngày đầu)`:''),paid:price}; });
const atDoor=(pl,room)=>inRetreat(pl)&&S.ROOMS[room].doors.some(([x,y])=>near(pl,x,y,40));
on('enterRoom',pl=>{ const p=pl.prof; if(!p.stay||p.stay.paid!==today()) return {err:'Bạn chưa thuê phòng hôm nay. Gặp lễ tân ở Nhà Rếch 2.'};
  if(!atDoor(pl,p.stay.room)) return {err:'Đây không phải phòng của bạn'};
  const r=S.ROOMS[p.stay.room]; pl.stayType=p.stay.room; moveTo(pl,'stay:'+pl.uid,r.spawn.x,r.spawn.y,{room:p.stay.room,host:p.name,own:true}); return {}; });
// gõ cửa phòng người khác (chủ phải đang ở trong và đồng ý)
const knocks=new Map(); let knockSeq=1;
on('knock',(pl,m)=>{ const room=String(m.room||''); if(!S.ROOMS[room]||S.ROOMS[room].home||!atDoor(pl,room)) return {err:'Đứng trước cửa nhà đó'};
  const inside=[...players.values()].filter(q=>q!==pl&&q.scene==='stay:'+q.uid&&q.stayType===room);
  if(!m.to) return {list:inside.map(q=>({id:q.pid,n:q.prof.name}))};
  const q=inside.find(q=>q.pid===(m.to|0)); if(!q) return {err:'Người đó không có trong phòng'};
  const id=knockSeq++; knocks.set(id,{id,from:pl,to:q,room,kind:'visit',exp:now()+20000}); send(q,{t:'knockAsk',inv:id,name:pl.prof.name,kind:'visit'}); return {sent:true}; });
on('sleepAsk',pl=>{ const k=kindOf(pl.scene), host=k==='stay'&&byUid.get(pl.scene.slice(5)); if(!host||host===pl) return {err:'Bạn đang không ở phòng người khác'};
  const id=knockSeq++; knocks.set(id,{id,from:pl,to:host,kind:'sleep',exp:now()+20000}); send(host,{t:'knockAsk',inv:id,name:pl.prof.name,kind:'sleep'}); return {sent:true}; });
on('knockAns',(pl,m)=>{ const k=knocks.get(m.inv|0); if(!k||k.to!==pl) return {err:'Đã hết hạn'}; knocks.delete(k.id); const v=k.from;
  if(!players.has(v.pid)) return {};
  if(!m.yes){ note(v,`${pl.prof.name} chưa tiện ${k.kind==='sleep'?'cho ngủ lại':'mở cửa'}`); return {}; }
  if(k.kind==='visit'){ if(pl.scene!=='stay:'+pl.uid) return {err:'Bạn không còn ở phòng'}; if(!atDoor(v,k.room)) return {err:v.prof.name+' đã đi rồi'};
    const r=S.ROOMS[k.room]; v.stayType=k.room; moveTo(v,pl.scene,r.spawn.x,r.spawn.y,{room:k.room,host:pl.prof.name,hostPid:pl.pid}); }
  else { if(v.scene!==pl.scene) return {}; v.prof.sleep={day:today(),host:pl.uid}; markDirty(v); note(v,`${pl.prof.name} cho bạn ngủ lại đêm nay`,'quest'); }
  return {}; });
hook('tick',()=>{ const t=now(); for(const [id,k] of knocks) if(t>k.exp) knocks.delete(id); });
// chủ rời phòng → khách ra theo
hook('leave',(pl,old,to)=>{ if(old==='stay:'+pl.uid&&to!==old) for(const q of [...sceneOf(old)]) if(q!==pl){ const d=doorOf('stay',q.stayType); note(q,'Chủ phòng đã ra ngoài'); moveTo(q,'retreat',d.x,d.y); } });

/* ---------- hoạt động trong phòng ---------- */
// phòng đang đứng: tro (nhà Hà Nội) hoặc phòng thuê; guest: đang ở phòng người khác
function roomCtx(pl){ const k=kindOf(pl.scene);
  if(k==='room') return {room:S.ROOMS.tro,own:true};
  if(k==='stay'){ const own=pl.scene==='stay:'+pl.uid, hostUid=pl.scene.slice(5), p=pl.prof;
    return {room:S.ROOMS[pl.stayType],own,allowed:own||(p.sleep&&p.sleep.day===today()&&p.sleep.host===hostUid)}; }
  return null; }
on('ra',(pl,m)=>{ const act=String(m.act||''), def=S.ROOM_ACTS[act], p=pl.prof, n=p.needs; if(!def) return {err:'?'};
  if(act==='tam'&&m.where==='chung'){ if(!inRetreat(pl)||!near(pl,S.BATHHOUSE.x,S.BATHHOUSE.y,44)) return {err:'Lại nhà tắm chung'};
    return startTask(pl,'tam',def.dur,()=>{ n.clean=100; markDirty(pl); return {msg:'Tắm xong, thơm tho'}; },{anim:'shower',name:'Tắm ở nhà tắm chung'}); }
  const c=roomCtx(pl); if(!c) return {err:'Vào phòng đã'};
  if(def.host&&!c.own&&!c.allowed) return {err:'Phòng người ta, xin ngủ lại đã'};
  const r=c.room;
  if(act==='tam'){ if(r.bath==='chung') return {err:'Lều không có chỗ tắm, ra nhà tắm chung cạnh khu cắm trại'};
    return startTask(pl,'tam',def.dur,()=>{ n.clean=100; let msg='Tắm xong, thơm tho';
      if(r.bath==='bontam'){ p.rbuff={mul:1.1,until:now()+20*60e3}; msg='Ngâm bồn cạnh cửa sổ ngắm hồ Hoà Bình: +10% EXP 20 phút'; }
      if(r.bath==='nonglanh'){ n.energy=Math.min(100,n.energy+10); msg='Tắm nước nóng: +10 năng lượng'; }
      markDirty(pl); return {msg}; },{anim:'shower',name:'Tắm'}); }
  if(act==='nghi') return startTask(pl,'nghi',def.dur,()=>{ n.energy=Math.min(100,n.energy+r.rest); let msg=`Ngủ một giấc: +${r.rest} năng lượng`;
      if(r.buff&&!p.daily.slept){ p.rbuff={mul:r.buff.mul,until:now()+r.buff.min*60e3}; msg+=` · Ngủ ngon: +${Math.round((r.buff.mul-1)*100)}% EXP ${r.buff.min} phút`; }
      p.daily.slept=true; markDirty(pl); return {msg}; },{anim:'sleep',name:'Nghỉ ngơi'});
  if(act==='sac') return startTask(pl,'sac',def.dur,()=>{ n.battery=Math.min(100,n.battery+r.charge); markDirty(pl); return {msg:`Pin ${Math.round(n.battery)}%`}; },{name:r.charge<100?'Sạc bằng sạc dự phòng':'Sạc điện thoại'});
  if(act==='tiktok'){ if(n.battery<def.battery) return {err:'Hết pin rồi, sạc đã'}; if(p.daily.tiktok>=def.daily) return {err:'Lướt đủ hôm nay rồi, mỏi mắt'};
    return startTask(pl,'tiktok',def.dur,()=>{ n.battery-=def.battery; p.daily.tiktok++; const g=C.gainExp(pl,def.exp*r.wifi); markDirty(pl);
      return {msg:`Lướt TikTok${r.wifi<1?' (wifi yếu)':''}: +${g.exp} EXP`,exp:g.exp}; },{anim:'phone',name:'Lướt TikTok'}); }
  if(act==='songao'){ if(n.battery<def.battery) return {err:'Hết pin rồi, sạc đã'}; if(p.daily.posts>=def.daily) return {err:'Hôm nay đăng 3 ảnh rồi, đăng nữa bị chê spam'};
    const i=m.photo|0, ph=p.photos[i]; if(!ph) return {err:'Chưa có ảnh nào. Ra mấy chỗ đẹp bấm P để chụp'};
    return startTask(pl,'songao',def.dur,()=>{ p.photos.splice(i,1); n.battery-=def.battery; p.daily.posts++;
      const outfit=Object.values(p.look.outfit||{}).reduce((a,id)=>a+(S.CLOTHES[id]?S.CLOTHES[id].price:0),0);
      const likes=Math.round((15+p.level*6+outfit/20000+Math.random()*20)*ph.mul*(.8+r.wifi*.2));
      const vnd=likes*250, g=C.gainExp(pl,likes/4); give(pl,vnd); markDirty(pl);
      return {msg:`Ảnh "${ph.name}" được ${likes} like · nhãn hàng tài trợ ${fmt(vnd)} · +${g.exp} EXP`,likes,vnd,exp:g.exp}; },{anim:'phone',name:'Up ảnh sống ảo'}); }
  return {err:'?'}; });
// chụp ảnh sống ảo (P)
on('photo',(pl,m)=>{ const p=pl.prof; if(p.needs.battery<5) return {err:'Hết pin'}; let spot=null; const k=kindOf(pl.scene);
  if(k==='retreat'||k==='dalat'){ spot=S.PHOTO_SPOTS.find(s=>(s.map||'retreat')===k&&near(pl,s.x,s.y,48));
    if(!spot&&k==='dalat') spot={name:'Nông trại bác Trang',mul:1.3}; }
  else { const c=roomCtx(pl); if(c) spot={name:c.room.name,mul:c.room.view}; }
  if(!spot) return {err:'Chỗ này chụp không ăn ảnh. Ra bến hồ, deck, cổng, khu cắm trại...'};
  p.needs.battery-=5; p.photos.push({name:spot.name,mul:spot.mul,at:now()}); if(p.photos.length>6) p.photos.shift(); markDirty(pl); return {name:spot.name}; });

/* ---------- câu cá ---------- */
const lakeSide=pl=>{ const k=kindOf(pl.scene); if(k==='retreat') return pl.y>=S.LAKE_Y*T?'ke':null;
  if(k==='dalat'){ const L=S.DALAT.lake, dx=(pl.x/T-L.x)/(L.rx+1.6), dy=(pl.y/T-L.y)/(L.ry+1.6); return dx*dx+dy*dy<=1?'dl':null; } return null; };
on('fish',(pl,m)=>{ const p=pl.prof, t=now();
  if(m.op==='cast'){ if(!p.skills.cauca) return {err:'Chưa học Câu cá (học online ở phòng)'}; const where=lakeSide(pl); if(!where) return {err:'Ra mép hồ mới câu được'};
    if(pl.kayak||pl.riding) return {err:'Xuống đã'}; pl.fishing={where,bite:t+2500+Math.random()*4500,st:'wait'}; W.setAct(pl,'fish'); return {}; }
  if(m.op==='hook'){ const f=pl.fishing; if(!f) return {err:'Chưa thả câu'}; pl.fishing=null; pl.act=0;
    if(f.st!=='bite') return {miss:true,msg:'Giật sớm quá, cá chạy mất'}; if(t>f.bite+1400) return {miss:true,msg:'Chậm quá, cá ăn mồi rồi chạy'};
    const table=f.where==='dl'?S.DL_FISH:S.FISH, tot=Object.values(table).reduce((a,x)=>a+x.w,0); let r=Math.random()*tot, k;
    for(const [id,x] of Object.entries(table)){ r-=x.w; if(r<=0){ k=id; break; } } k=k||Object.keys(table)[0];
    addItem(pl,k); const g=C.gainExp(pl,table[k].exp); return {item:k,exp:g.exp}; }
  if(m.op==='stop'){ pl.fishing=null; pl.act=0; return {}; } });
hook('tick',()=>{ const t=now(); for(const pl of players.values()){ const f=pl.fishing; if(f&&f.st==='wait'&&t>=f.bite){ f.st='bite'; send(pl,{t:'bite'}); } } });

/* ---------- kayak (150.000đ/giờ như giá thật) ---------- */
on('kayak',(pl,m)=>{ const p=pl.prof, t=now(), K=S.KAYAK_SPOT; if(!inRetreat(pl)) return {err:'Không ở Ké'};
  if(m.op==='board'){ if(!p.skills.kayak) return {err:'Chưa học Chèo kayak (học online ở phòng)'}; if(!near(pl,K.x,K.y,52)) return {err:'Ra bãi cát cạnh bến'};
    if(p.kayakUntil<t){ if(!take(pl,S.KAYAK_PRICE)) return {err:`Thuê kayak ${fmt(S.KAYAK_PRICE)}/giờ, không đủ tiền`}; p.kayakUntil=t+S.KAYAK_MIN*60e3; markDirty(pl); }
    pl.kayak=true; return {until:p.kayakUntil}; }
  if(m.op==='leave'){ pl.kayak=false; return {}; }
  if(m.op==='buoy'){ const i=m.i|0, b=S.BUOYS[i]; if(!pl.kayak||!b||!near(pl,b[0],b[1],26)) return {err:'Chưa tới phao'};
    const d=p.daily; if(d.buoys[i]) return {}; d.buoys[i]=true; markDirty(pl); const n=Object.keys(d.buoys).length;
    if(n>=S.BUOYS.length&&!d.done.kayak){ d.done.kayak=true; reward(pl,S.DAILY.kayak.reward,'Chèo đủ 5 phao'); } return {n}; } });
hook('tick',()=>{ const t=now(); for(const pl of players.values()) if(pl.kayak&&pl.prof.kayakUntil<t){ pl.kayak=false; send(pl,{t:'pos',x:S.KAYAK_SPOT.x*T,y:S.KAYAK_SPOT.y*T}); pl.x=S.KAYAK_SPOT.x*T; pl.y=S.KAYAK_SPOT.y*T; note(pl,'Hết giờ thuê kayak, đã đưa bạn về bãi cát'); } });
hook('leave',pl=>{ pl.kayak=false; });

/* ---------- việc mỗi ngày cho cô Ké + mua bán ở tiệm nông sản ---------- */
on('daily',(pl,m)=>{ const d=S.DAILY[m.id], p=pl.prof; if(!d||!d.need) return {err:'?'}; if(!nearNpc(pl,'coke')) return {err:'Gặp cô Ké ở tiệm nông sản'};
  if(p.daily.done[m.id]) return {err:'Hôm nay xong việc này rồi'}; let left=d.need.count;
  const total=d.need.any.reduce((a,k)=>a+(p.items[k]||0),0); if(total<left) return {err:`Cần ${left} món, mới có ${total}`};
  for(const k of d.need.any){ const n=Math.min(left,p.items[k]||0); if(n){ addItem(pl,k,-n); left-=n; } }
  p.daily.done[m.id]=true; reward(pl,d.reward,'Cô Ké cảm ơn: '+d.title); return {}; });
// ai thu mua món gì
function buyerOk(pl,item){ if(nearNpc(pl,'coke')) return item in S.CROPS||['trung','sua'].includes(item);
  if(nearNpc(pl,'quancom')) return item in S.FISH; if(nearNpc(pl,'bactrang')) return item in S.SELL; return false; }
on('sell',(pl,m)=>{ const item=String(m.item||''), p=pl.prof, n=Math.min(p.items[item]||0,Math.max(1,m.n|0||p.items[item]||0));
  if(!(item in S.SELL)) return {err:'Món này không ai mua'}; if(!buyerOk(pl,item)) return {err:'Người này không mua món đó'}; if(!n) return {err:'Không có'};
  const price=Math.round(S.SELL[item]*(p.skills.damphan?1.1:1)), v=price*n; addItem(pl,item,-n); give(pl,v); return {n,vnd:v}; });
// hạt giống: rau Ké ở tiệm cô Ké, cây Đà Lạt ở bác Trang
on('seed',(pl,m)=>{ const c=S.CROPS[m.crop], n=Math.max(1,Math.min(20,m.n|0||1)); if(!c) return {err:'?'};
  const ok=c.map==='dalat'?nearNpc(pl,'bactrang'):nearNpc(pl,'coke'); if(!ok) return {err:c.map==='dalat'?'Mua ở chỗ bác Trang':'Mua ở tiệm cô Ké'};
  if((c.kind==='cay'||c.kind==='caosu'||c.kind==='cafe')&&!pl.prof.skills.lamvuon) return {err:'Chưa học Làm vườn lâu năm'};
  if(!take(pl,c.seed*n)) return {err:`${n} × ${fmt(c.seed)} = ${fmt(c.seed*n)}, không đủ tiền`}; addItem(pl,'hat_'+m.crop,n); return {n}; });

/* ---------- học kỹ năng online (ở phòng) ---------- */
on('learn',(pl,m)=>{ const c=S.COURSES[m.skill], p=pl.prof; if(!c) return {err:'?'}; if(!W.inOwnRoom(pl)) return {err:'Học bằng laptop ở phòng của bạn'};
  if(p.skills[m.skill]) return {err:'Đã học rồi'}; if(p.level<c.level) return {err:`Cần cấp ${c.level}`};
  if(!take(pl,c.price)) return {err:`Khoá học ${fmt(c.price)}, không đủ tiền`};
  return startTask(pl,'hoc',c.dur,()=>{ p.skills[m.skill]=true; markDirty(pl); send(pl,{t:'rw',skill:m.skill,msg:'Học xong: '+c.name}); return {}; },{anim:'work',name:'Học online: '+c.name}); });

/* ---------- chợ online (mua bán đồ với người chơi khác, ở phòng) ---------- */
let LIST=db.market();
const listView=()=>LIST.slice(0,80).map(l=>({id:l.id,s:l.sname,item:l.item,n:l.n,price:l.price,mine:false,seller:l.seller}));
on('mk',(pl,m)=>{ const p=pl.prof;
  if(m.op==='list') return {list:listView().map(l=>({...l,mine:l.seller===pl.uid,seller:undefined}))};
  if(!W.inOwnRoom(pl)) return {err:'Mở chợ online bằng laptop ở phòng của bạn'};
  if(m.op==='sell'){ const item=String(m.item||''), n=Math.max(1,m.n|0), price=Math.round(+m.price||0);
    if(!S.ITEMS[item]||!has(pl,item,n)) return {err:'Không đủ đồ'}; if(price<1000||price>S.MARKET.maxPrice) return {err:'Giá từ 1.000đ'};
    if(LIST.filter(l=>l.seller===pl.uid).length>=S.MARKET.maxListings) return {err:`Tối đa ${S.MARKET.maxListings} món đang bán`};
    addItem(pl,item,-n); const id=db.addListing(pl.uid,p.name,item,n,price); C.save(pl); LIST=db.market(); return {id}; }
  if(m.op==='cancel'){ const l=LIST.find(l=>l.id===(m.id|0)); if(!l||l.seller!==pl.uid) return {err:'Không phải món của bạn'};
    db.delListing(l.id); addItem(pl,l.item,l.n); C.save(pl); LIST=db.market(); return {}; }
  if(m.op==='buy'){ const l=LIST.find(l=>l.id===(m.id|0)); if(!l) return {err:'Món này vừa bán mất rồi'}; if(l.seller===pl.uid) return {err:'Món của bạn'};
    if(p.money<l.price) return {err:`Giá ${fmt(l.price)}, không đủ tiền`};
    const net=Math.round(l.price*(1-S.MARKET.fee));
    db.tx(()=>{ db.delListing(l.id); take(pl,l.price); addItem(pl,l.item,l.n); C.save(pl);
      const sp=byUid.get(l.seller); if(sp){ give(sp,net); C.save(sp); note(sp,`${p.name} đã mua ${l.n} ${S.ITEMS[l.item].name} của bạn: +${fmt(net)}`,'vnd'); }
      else { const prof=db.profile(l.seller); if(prof){ prof.money+=net; (prof.inbox=prof.inbox||[]).push(`${p.name} đã mua ${l.n} ${S.ITEMS[l.item].name}: +${fmt(net)}`); db.saveProfile(l.seller,prof); } } });
    LIST=db.market(); return {item:l.item,n:l.n}; } });
hook('login',pl=>{ const ib=pl.prof.inbox; if(ib&&ib.length){ for(const m of ib) note(pl,m,'vnd'); pl.prof.inbox=[]; markDirty(pl); } });

module.exports={startTask,canFinish,roomCtx,doorOf,nearNpc,rentRoll};
