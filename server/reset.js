// Reset toàn server (chủ game yêu cầu 23/10): tới R.at mọi tài khoản trừ Kaixa về như tài khoản mới: cấp 10, 3.000.000đ, giữ tên + ngoại hình (bộ đồ khởi đầu),
// xoá túi đồ, ngọc, đồ MU, quần áo, thú cưỡi, Xích Thố, Lính Cát, vật nuôi, nhà, đất, cấp MU + class, nhiệm vụ, thành tựu, mảnh huyền thoại, hảo sảng; ô ruộng, việc làm, hàng đăng chợ, khoản vay của họ.
// Giữ cờ quà 1 lần (khỏi phát lại quà / chạy lại điều chỉnh tài khoản). Chạy đúng 1 lần (file data/reset-<id>.done), trước khi chạy sao lưu DB (data/backup-<id>-<giờ>.db).
// Trình tự: báo + ngắt kết nối người đang online (server lưu + dọn dẹp như lúc thoát game) → 3,5 giây sau ghi hồ sơ mới cho mọi tài khoản trong DB (ai lỡ vào lại thì thay luôn hồ sơ đang chơi)
// → hook 'reset' để các module dọn bộ nhớ theo người chơi. Đếm ngược trên topbar (t:'reset') + báo kênh chat lúc còn 60 / 30 / 10 / 5 / 1 phút.
'use strict';
const fs=require('fs'), path=require('path');
const C=require('./core');
const {S,hook,hooks,send,now,players,db}=C;
const TEST=process.env.CHAN_TEST==='1';   /* chạy thử ở server test: RESET_AT (ms) + RESET_ID đặt giờ / mã khác */
const R={id:TEST&&process.env.RESET_ID||'2026-10-23-1640',at:TEST&&+process.env.RESET_AT||Date.parse('2026-10-23T16:40:00+07:00'),keep:['kaixa'],level:10,money:3000000};
const DIR=process.env.DATA_DIR||path.join(__dirname,'data'), DONE=path.join(DIR,`reset-${R.id}.done`);
let done=fs.existsSync(DONE);
// giữ theo tài khoản chính chủ (tạo sớm nhất) của tên Kaixa, không theo tên: ai đặt trùng tên Kaixa từ trước vẫn bị reset
const keepers=()=>new Set(R.keep.map(n=>C.ownerOf([n])).filter(Boolean));
// quà / điều chỉnh 1 lần của admin + đã qua phần mở đầu: giữ để khỏi phát lại. Quà sự kiện tài khoản mới cũng có (trang phục Halloween, ngọc Lính Cát) thì nhận lại như người mới
const KEEP_FLAGS=['hello','called','arrived','freeRide','topup2m','menmen26','giftUoc1','gift10m','vip100','kaixaSkin','gemTest10','gift3m','gift2mBen','gift3mLeno','annieAsk'];
const msg=`🔄 Server Chan City đã reset: bạn bắt đầu lại ở cấp ${R.level} với ${S.fmt(R.money)}. Game sẽ tải lại...`;
// hồ sơ mới: mặc định + tên, ngoại hình (đồ khởi đầu), cài đặt, hộp thư, dấu quà 1 lần
function fresh(p){ const d=C.defaults(p.name), L=S.LOOK, g=(p.look&&p.look.gender)||'nam', st=L.starters[0], outfit={...(g==='nu'&&st.nu?st.nu:st.items)}, exp=S.RULES.levels[R.level-1];
  const flags={...d.flags}; for(const k of KEEP_FLAGS) if(p.flags&&p.flags[k]!==undefined) flags[k]=p.flags[k];
  const n={...d,name:p.name,look:p.look?{gender:g,hair:p.look.hair,hairColor:p.look.hairColor,skin:p.look.skin,outfit,...(p.look.opts?{opts:p.look.opts}:{})}:null,owned:Object.fromEntries(Object.values(outfit).map(id=>[id,1])),
    opts:p.opts||d.opts,inbox:p.inbox||[],flags,money:R.money,exp,level:S.levelOf(exp),muOX:S.MU.OX,muOY:S.MU.OY||0,reset:R.id};
  if(p.giftMount) n.giftMount=p.giftMount; if(p.adjDone) n.adjDone=p.adjDone; return n; }
const kick=pl=>{ send(pl,{t:'reset',done:1,msg}); setTimeout(()=>{ try{ pl.ws&&pl.ws.close(4000,'reset'); }catch(e){} },1500); };
let retryAt=0;
function run(){ if(done||now()<retryAt) return;
  // sao lưu trước, hỏng (đầy ổ, quyền ghi...) thì hoãn 1 phút rồi thử lại, chưa xoá gì cả
  const bk=path.join(DIR,`backup-${R.id}-${Date.now()}.db`); try{ db.backup(bk); if(!(fs.statSync(bk).size>0)) throw new Error('file sao lưu rỗng'); }catch(e){ console.error('[reset] sao lưu lỗi, hoãn reset 1 phút:',e.message); retryAt=now()+60e3; return; }
  done=true; try{ fs.writeFileSync(DONE,new Date().toISOString()); }catch(e){ console.error('[reset] done file',e.message); }
  const keep=keepers(); for(const pl of [...players.values()]) if(pl.prof&&!keep.has(pl.uid)) kick(pl);
  setTimeout(wipe,3500); }
function wipe(){ const all=db.allProfiles(), keepU=keepers(); let n=0;
  const online=new Map(); for(const pl of players.values()) if(pl.prof&&!keepU.has(pl.uid)) online.set(pl.uid,pl);
  for(const p of all){ const uid=p._uid; if(keepU.has(uid)) continue; delete p._uid; const q=online.get(uid);
    try{ if(q){ q.prof=fresh(q.prof); q.mus=null; q.riding=false; C.save(q); kick(q); } else db.saveProfile(uid,fresh(p)); n++; }catch(e){ console.error('[reset] hồ sơ',uid,e.message); } }   /* 1 hồ sơ lỗi không làm dừng giữa chừng */   /* ai lỡ vào lại trong lúc chờ: thay hồ sơ đang chơi rồi cho tải lại */
  const gone=uid=>!!uid&&!keepU.has(uid); for(const f of hooks.reset) try{ f(gone); }catch(e){ console.error('[reset] hook',e.message); }   /* ô ruộng, đất, chó, phòng thuê, chợ, việc làm, khoản vay */
  console.log(`[reset] ${R.id}: reset ${n} tài khoản, giữ ${keepU.size}`);
  require('./world').sysChat(`🔄 Server Chan City đã reset! Mọi người bắt đầu lại từ cấp ${R.level} với ${S.fmt(R.money)}. Chúc cả nhà chơi vui! 🎉`); }
// đếm ngược: gửi lúc vào game, báo kênh chat + topbar ở các mốc
const view=()=>({t:'reset',at:R.at,id:R.id,level:R.level,money:R.money});
hook('login',pl=>{ if(!done&&R.at-now()<24*3600e3) setTimeout(()=>{ if(pl.prof) send(pl,view()); },2000); });
const MARKS=[60,30,10,5,1], said=new Set();
{ const left=R.at-now(); for(const mn of MARKS) if(left<mn*60e3-60e3) said.add(mn); }   /* mốc đã qua lúc khởi động lại thì không báo lại */
setInterval(()=>{ if(done) return; const left=R.at-now(); if(left<=0){ run(); return; }
  for(const mn of MARKS) if(left<=mn*60e3&&!said.has(mn)){ said.add(mn); require('./world').sysChat(`⏳ Còn ${mn} phút nữa server reset: mọi người (trừ Kaixa) về cấp ${R.level}, ${S.fmt(R.money)}, xoá hết đồ`); C.broadcastAll(view()); } },5000);
module.exports={R};
