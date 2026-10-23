// Group Nghiện Motion (Hà Nội): việc motion của Giáo chủ Trọng Motion, lắp Gunpla với Gundam, đấu game với Evangelion, phòng xông hơi chung.
'use strict';
const C=require('./core'), P=require('./places');
const {S,on,now,near,markDirty,note,give,addItem}=C;
const pr=p=>p.qprog=p.qprog||{}, active=(p,id)=>p.quests[id]==='active';

// phòng xông hơi: đứng / ngồi trong phòng là tự lên EXP, liên tục càng lâu EXP / phút càng tăng; mỗi ngày game tối đa N.steam.capSec giây thật
const inSauna=pl=>{ if(pl.scene!=='nghienmotion') return false; const Z=S.NMOTION.sauna, x=pl.x/C.T, y=pl.y/C.T; return x>=Z.x0&&x<=Z.x1+1&&y>=Z.y0&&y<=Z.y1+1; };
C.hook('slow',()=>{ const t=now(), H=S.NMOTION.steam; for(const pl of C.players.values()){ const p=pl.prof; if(!p||!p.daily) continue;
  if(!inSauna(pl)){ if(pl.steam){ pl.steam=null; C.send(pl,{t:'steam',off:1}); } continue; }
  const d=p.daily, s=pl.steam||(pl.steam={at:t,exp:0,acc:0}), used=d.steam||0;
  if(used>=H.capSec){ C.send(pl,{t:'steam',full:1,used,cap:H.capSec,exp:s.exp}); continue; }
  d.steam=used+1; const min=(t-s.at)/60000, rate=Math.min(H.max,H.base+H.ramp*min); s.acc+=rate/60;
  if(s.acc>=1){ const n=Math.floor(s.acc); s.acc-=n; s.exp+=C.gainExp(pl,n,'steam').exp; }
  markDirty(pl); C.send(pl,{t:'steam',min,rate,used:d.steam,cap:H.capSec,exp:s.exp}); } });
on('nm',(pl,m)=>{ const p=pl.prof, N=S.NMOTION, q=pr(p), op=m.op, d=p.daily; if(pl.scene!=='nghienmotion') return {err:'Việc này ở Group Nghiện Motion (Hà Nội)'};
  const job=(id,sec,label,anim='work',fin)=>P.startTask(pl,'work',sec,()=>{ q[id]=(q[id]||0)+1; markDirty(pl); return fin?fin():{msg:`Xong: ${label}. Báo lại người giao việc nhé`}; },{anim,name:label});
  if(op==='desk'){ const dk=N.desks[m.i|0]; if(!dk||!near(pl,dk[0],dk[1]+.9,40)) return {err:'Ngồi vào 1 bàn làm motion'};
    if(active(p,'nm_ball')&&!q.nm_ball) return job('nm_ball',15,'Animation quả bóng nảy');
    if(active(p,'nm_easing')&&(q.nm_easing||0)<3) return job('nm_easing',6,`Chỉnh graph editor lần ${(q.nm_easing||0)+1}/3`,'work',()=>({msg:(q.nm_easing||0)>=3?'Đường cong mượt như bơ! Báo Giáo chủ':`Chỉnh xong lần ${q.nm_easing}/3`}));
    if(active(p,'nm_logo')&&!q.nm_logo) return job('nm_logo',20,'Logo animation 3 giây');
    if((d.nmdesk||0)>=3) return {err:'Hôm nay ngồi làm đủ rồi, ra xông hơi thư giãn đi'};
    return P.startTask(pl,'work',12,()=>{ d.nmdesk=(d.nmdesk||0)+1; const g=C.gainExp(pl,45); C.earn(pl,60000); markDirty(pl); return {msg:`Render xong 1 clip ngắn cho khách: +60.000đ, +${g.exp} EXP (${d.nmdesk}/3 hôm nay)`}; },{anim:'work',name:'Làm motion cho khách'}); }
  if(op==='tv'){ if(!near(pl,N.tv.x,3.4,56)) return {err:'Lại gần TV lớn'}; if(!active(p,'nm_reel')||q.nm_reel) return {msg:'TV đang chiếu showreel của group, ai cũng gật gù'};
    return job('nm_reel',15,'Chiếu showreel cho cả group','',()=>{ p.flags.nmDisciple=true; p.owned.hoodie_nm=1; return {msg:'Cả group vỗ tay rần rần! Giáo chủ gật đầu: chính thức là đệ tử Nghiện Motion, tặng bạn Hoodie Nghiện Motion (mở Tủ đồ U để mặc). Báo Giáo chủ nhận thưởng'}; }); }
  if(op==='model'){ if(!near(pl,N.model.x,N.model.y+.9,40)) return {err:'Lại gần bàn lắp mô hình'};
    if(active(p,'gp_build')&&(q.gp_build||0)<3){ const st=['Cắt runner, gọt bavia','Lắp khung xương','Dán decal'][q.gp_build||0]; return job('gp_build',8,st,'work',()=>({msg:(q.gp_build||0)>=3?'Gunpla RX-78 đứng sừng sững! Báo Gundam':`Xong bước: ${st} (${q.gp_build}/3)`})); }
    if(active(p,'gp_panel')&&!q.gp_panel) return job('gp_panel',12,'Kẻ lằn chìm + phủ mờ');
    return {msg:'Bàn lắp mô hình bày đầy runner, kìm cắt và lọ sơn. Hỏi Gundam xem có việc gì không'}; }
  // góc game: đấu đối kháng thật với Eva ở máy khách (fight.js), xong gửi kết quả; mỗi ngày game 6 ván
  if(op==='game'){ if(!near(pl,N.game.x,N.game.y+.9,44)) return {err:'Ngồi vào góc game'}; if(pl.task) return {err:'Đang làm việc khác'}; if((d.nmgame||0)>=6) return {err:'Chơi nhiều quá rồi, mỏi tay. Mai chơi tiếp'};
    pl.nmFight={at:now()}; return {fight:true,lv:Math.min(2,q.ev_win||0)}; }
  if(op==='gameEnd'){ const f=pl.nmFight; pl.nmFight=null; if(!f) return {err:'Chưa vào trận'}; const el=now()-f.at; if(el<5000||el>180000) return {err:'Ván đấu không hợp lệ'};
    d.nmgame=(d.nmgame||0)+1; const win=!!m.win; if(win) P.stat(pl,'nmWin',1); const g=C.gainExp(pl,win?25:10); if(win&&active(p,'ev_win')&&(q.ev_win||0)<2) q.ev_win=(q.ev_win||0)+1; markDirty(pl);
    return {win,msg:win?`🏆 Hạ gục Eva! +${g.exp} EXP${active(p,'ev_win')?` (thắng Eva ${Math.min(2,q.ev_win||0)}/2)`:''} · ván ${d.nmgame}/6 hôm nay`:`Eva thắng ván này. +${g.exp} EXP, luyện thêm rồi phục thù! · ván ${d.nmgame}/6 hôm nay`}; }
  if(op==='sauna'){ const Z=N.sauna, x=pl.x/C.T, y=pl.y/C.T; if(x<Z.x0||x>Z.x1+1||y<Z.y0||y>Z.y1+1) return {err:'Vào phòng xông hơi đã'}; if((d.sauna||0)>=N.saunaMax) return {err:`Hôm nay xông ${N.saunaMax} lần rồi, uống nước đi`};
    return P.startTask(pl,'sauna',N.saunaDur,()=>{ d.sauna=(d.sauna||0)+1; p.needs.energy=Math.min(100,p.needs.energy+N.saunaEnergy); p.needs.clean=Math.min(100,p.needs.clean+10);
      // xông hơi tập thể: có thêm người trong phòng thì được buff EXP
      let n=0; for(const o of C.players.values()) if(o.scene==='nghienmotion'){ const ox=o.x/C.T, oy=o.y/C.T; if(ox>=Z.x0&&ox<=Z.x1+1&&oy>=Z.y0&&oy<=Z.y1+1) n++; }
      let extra=''; if(n>=N.crowd.n){ const cur=p.sbuff&&p.sbuff.until>now()?p.sbuff.mul:1; p.sbuff={mul:Math.max(cur,N.crowd.mul),until:now()+N.crowd.min*60e3}; extra=` · Xông hơi tập thể ${n} người: +${Math.round((N.crowd.mul-1)*100)}% EXP ${N.crowd.min} phút`; }
      markDirty(pl); return {msg:`Toát mồ hôi, người nhẹ bẫng: +${N.saunaEnergy} năng lượng, +10 sạch sẽ${extra}`}; },{name:'Xông hơi'}); }
  if(op==='kanban') return {msg:'Bảng kanban: TODO "Render 4K cho khách", DOING "Showreel 2026", DONE "Logo lễ hội". Ai đó vẽ thêm hình Giáo chủ đội vương miện ở góc'};
  return {err:'?'}; });
module.exports={};
