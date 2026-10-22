// Chan City server: phục vụ file game, đăng nhập (Google / tên thử), WebSocket thời gian thực.
// Chạy: cd server && npm install && npm start  →  http://localhost:8790
'use strict';
const http=require('http'), fs=require('fs'), path=require('path');
const {WebSocketServer}=require('ws');
const C=require('./core');
require('./world'); const P=require('./places'); require('./farm'); require('./job'); require('./club'); require('./race'); require('./stunt'); require('./dance'); require('./lb'); require('./kejob'); require('./das'); require('./town'); require('./wild'); require('./oii'); require('./lumen'); require('./yenlang'); require('./pickle'); require('./design'); require('./mck'); const DIEP=require('./diep'); require('./daily'); require('./maps3');
const {verifyGoogle}=require('./auth');
const {S,db,players,byUid,handlers,hooks,send,now,today,moveTo,markDirty,save,publicProfile}=C;
const {clean}=require('./world');
const FARM=require('./farm');

const PORT=+process.env.PORT||8790;
const GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID||'';
const NAME_LOGIN=(process.env.NAME_LOGIN??'1')==='1';             // đăng nhập bằng tên + mật khẩu (khi chưa có Google)
const crypto=require('crypto');
// băm mật khẩu bằng scrypt chạy nền (không chặn vòng lặp game khi nhiều người đăng nhập cùng lúc)
const scrypt=(pw,salt)=>new Promise((ok,bad)=>crypto.scrypt(pw,salt,32,(e,k)=>e?bad(e):ok(k)));
const hashPw=async pw=>{ const salt=crypto.randomBytes(16).toString('hex'); return salt+':'+(await scrypt(pw,salt)).toString('hex'); };
const checkPw=async(pw,h)=>{ const [salt,hex]=String(h).split(':'); if(!hex) return false; const a=await scrypt(pw,salt), b=Buffer.from(hex,'hex'); return b.length===a.length&&crypto.timingSafeEqual(a,b); };
// chặn dò mật khẩu: tối đa 10 lần nhập sai/phút theo IP thật và theo tên tài khoản.
// Qua Cloudflare Tunnel mọi kết nối đều từ 127.0.0.1, IP thật nằm ở header CF-Connecting-IP.
const fails=new Map();
const clientIp=req=>{ const r=req.socket.remoteAddress||''; return /^(::1|127\.|::ffff:127\.)/.test(r)?(req.headers['cf-connecting-ip']||String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||r):r; };
const blocked=k=>{ const f=fails.get(k); return f&&Date.now()-f.t<60000&&f.n>=10; };
const fail=k=>{ const t=Date.now(), f=fails.get(k); if(!f||t-f.t>60000) fails.set(k,{n:1,t}); else f.n++; };
const ROOT=path.resolve(__dirname,'..');
const PUBLIC=['chande-bootcamp','pixel-sprite-forge'];             // chỉ phục vụ 2 thư mục này (không lộ server/data)
const TYPES={'.svg':'image/svg+xml','.ico':'image/x-icon','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp',
  '.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};

// "phiên bản" client = thời điểm sửa mới nhất của các file game (đọc lại tối đa 10 giây 1 lần)
let verAt=0, verVal='';
function clientVer(){ const t=Date.now(); if(t-verAt<10000) return verVal; verAt=t; let m=0;
  for(const d of ['chande-bootcamp','chande-bootcamp/shared']) for(const f of fs.readdirSync(path.join(ROOT,d))) if(/\.(js|html)$/.test(f)) m=Math.max(m,fs.statSync(path.join(ROOT,d,f)).mtimeMs);
  return verVal=String(Math.floor(m)); }
/* ---------- HTTP ---------- */
function json(res,code,obj){ res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(obj)); }
function body(req){ return new Promise((ok,bad)=>{ let s=''; req.on('data',c=>{ s+=c; if(s.length>8192){ bad(new Error('quá lớn')); req.destroy(); } }); req.on('end',()=>{ try{ ok(JSON.parse(s||'{}')); }catch(e){ bad(e); } }); }); }
const nameOk=n=>{ n=clean(n).replace(/[^\p{L}\p{N} ._-]/gu,'').slice(0,16).trim(); return n.length>=2?n:null; };
async function api(req,res,url){
  if(url.pathname==='/api/config') return json(res,200,{google:GOOGLE_CLIENT_ID||null,name:NAME_LOGIN});
  if(url.pathname==='/api/ver') return json(res,200,{v:clientVer()});   // client hỏi định kỳ: file game đổi thì hiện nút tải lại
  if(req.method!=='POST') return json(res,405,{err:'POST'});
  let b; try{ b=await body(req); }catch(e){ return json(res,400,{err:'Dữ liệu hỏng'}); }
  if(url.pathname==='/api/login'){ const ip=clientIp(req); if(blocked('ip:'+ip)) return json(res,429,{err:'Nhập sai nhiều quá, đợi 1 phút'});
    if(b.credential){ if(!GOOGLE_CLIENT_ID) return json(res,400,{err:'Server chưa cấu hình GOOGLE_CLIENT_ID'});
      try{ const g=await verifyGoogle(b.credential,GOOGLE_CLIENT_ID); const u=db.ensureUser('g:'+g.sub,'google',g.email,g.name);
        return json(res,200,{token:db.newSession(u.id),name:g.name}); }catch(e){ return json(res,401,{err:'Đăng nhập Google thất bại: '+e.message}); } }
    if(b.name!==undefined){ if(!NAME_LOGIN) return json(res,403,{err:'Đăng nhập bằng tên đang tắt, dùng Google'}); const n=nameOk(b.name); if(!n) return json(res,400,{err:'Tên từ 2 tới 16 ký tự'});
      const pw=String(b.pw||''); if(pw.length<4||pw.length>64) return json(res,400,{err:'Mật khẩu từ 4 ký tự'});
      const id='n:'+n.toLowerCase().normalize('NFC'), old=db.user(id);
      if(blocked('id:'+id)) return json(res,429,{err:'Tài khoản này nhập sai nhiều quá, đợi 1 phút'});
      if(old&&old.pw&&!(await checkPw(pw,old.pw))){ fail('ip:'+ip); fail('id:'+id); return json(res,401,{err:'Sai mật khẩu (tên này đã có người dùng)'}); }
      const u=old||db.ensureUser(id,'name','',n); if(!u.pw) db.setPw(id,await hashPw(pw));
      return json(res,200,{token:db.newSession(u.id),name:n,created:!old}); }
    return json(res,400,{err:'Thiếu thông tin đăng nhập'}); }
  if(url.pathname==='/api/logout'){ if(typeof b.token==='string') db.endSession(b.token); return json(res,200,{}); }
  json(res,404,{err:'?'});
}
function serveStatic(req,res,url){
  let p; try{ p=decodeURIComponent(url.pathname); }catch(e){ res.writeHead(400); return res.end(); }
  // link gọn: game chạy thẳng ở "/", link cũ /chande-bootcamp/... chuyển về (giữ query); file game tìm trong chande-bootcamp trước
  if(p==='/chande-bootcamp'||p.startsWith('/chande-bootcamp/')){ res.writeHead(301,{Location:(p.slice(16)||'/')+(url.search||'')}); return res.end(); }
  if(p.endsWith('/')) p+='index.html';
  const top=p.split('/')[1]; let file=path.normalize(path.join(ROOT,PUBLIC.includes(top)?'':'chande-bootcamp',p)); const rel=path.relative(ROOT,file);
  if(rel.startsWith('..')||!PUBLIC.includes(rel.split(path.sep)[0])){ res.writeHead(404); return res.end('Không tìm thấy'); }
  fs.stat(file,(e,st)=>{ if(e||!st.isFile()){ res.writeHead(404); return res.end('Không tìm thấy'); }
    const ext=path.extname(file).toLowerCase(), dyn=['.html','.js','.json','.css'].includes(ext);
    if(rel===path.join('chande-bootcamp','index.html')){   // ảnh xem trước link (og:image) cần đường dẫn tuyệt đối theo tên miền đang chạy
      const host=String(req.headers['x-forwarded-host']||req.headers.host||'localhost'), proto=String(req.headers['x-forwarded-proto']||(/^(localhost|127\.|\[::1\])/.test(host)?'http':'https')).split(',')[0];
      const html=Buffer.from(fs.readFileSync(file,'utf8').replace(/__ORIGIN__/g,proto+'://'+host));
      res.writeHead(200,{'Content-Type':TYPES['.html'],'Content-Length':html.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}); return res.end(html); }
    res.writeHead(200,{'Content-Type':TYPES[ext]||'application/octet-stream','Content-Length':st.size,'Cache-Control':dyn?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(file).pipe(res); }); }
const server=http.createServer((req,res)=>{ const url=new URL(req.url,'http://x');
  if(url.pathname.startsWith('/api/')) return api(req,res,url).catch(e=>{ console.error(e); json(res,500,{err:'Lỗi server'}); });
  if(req.method!=='GET'&&req.method!=='HEAD'){ res.writeHead(405); return res.end(); }
  serveStatic(req,res,url); });

/* ---------- vào game ---------- */
// đặt người chơi vào cảnh đã lưu lần trước
function place(pl){ const p=pl.prof, pos=p.pos, sc=p.scene;
  const at=(id,sp)=>moveTo(pl,id,pos&&pos.x?pos.x:sp.x,pos&&pos.y?pos.y:sp.y);
  if(sc==='retreat') return pos&&pos.y>S.SCENE_SIZE.retreat[1]-4?moveTo(pl,'retreat',S.SPAWN.retreat.x,S.SPAWN.retreat.y):at('retreat',S.SPAWN.retreat);   // map Ké đã thu gọn: ai đứng ở khu làng cũ thì về chỗ xuất hiện
  if(sc==='everfit') return at('everfit',S.OFFICE.spawn);
  if(sc==='dalat') return at('dalat',S.DALAT.spawn);
  if(sc==='das') return at('das',S.DAS.spawn);
  if(sc==='bearplus') return at('bearplus',S.BEARPLUS.spawn); if(sc==='vnpt') return at('vnpt',S.VNPT.spawn); if(sc==='mieu') return at('mieu',S.MIEU.spawn);
  if(sc==='lumen') return at('lumen',S.LUMEN.spawn); if(sc==='yenlang') return at('yenlang',S.YENLANG.spawn); if(sc==='pickle') return moveTo(pl,'pickle',S.PICKLE.spawn.x,S.PICKLE.spawn.y);
  if(sc==='diep'&&!DIEP.canVisit(p)) return at('diep',S.DIEP.spawn);
  if(sc==='track') return moveTo(pl,'dalat',S.DALAT.track.x,S.DALAT.track.y);
  if(sc==='phongbay'){ const I=S.INTERIORS.club; return moveTo(pl,'club',I.spawn.x,I.spawn.y); }
  if(sc==='deo') return moveTo(pl,'retreat',S.NPCS.find(n=>n.id==='donche').x+1,90.4);
  if(S.INTERIORS[sc]){ const I=S.INTERIORS[sc]; return moveTo(pl,sc,I.spawn.x,I.spawn.y); }
  if(sc==='stay'){ if(p.stay&&p.stay.paid===today()){ const r=S.ROOMS[p.stay.room]; pl.stayType=p.stay.room; return moveTo(pl,'stay:'+pl.uid,r.spawn.x,r.spawn.y,{room:p.stay.room,host:p.name,own:true}); }
    return moveTo(pl,'retreat',S.SPAWN.retreat.x,S.SPAWN.retreat.y); }
  return at('room:'+pl.uid,S.ROOMS.tro.spawn); }
handlers.create=(pl,m)=>{ const p=pl.prof; if(p.look) return {err:'Đã tạo nhân vật'};
  const L=S.LOOK, g=L.genders.some(x=>x.id===m.gender)?m.gender:null, name=nameOk(m.name);
  if(!g||!name) return {err:'Chọn giới tính và đặt tên (2–16 ký tự)'};
  if(!L.hair[g].some(h=>h[0]===m.hair)||!L.hairColors.includes(m.hairColor)||!L.skins.includes(m.skin)) return {err:'Kiểu tóc / màu không hợp lệ'};
  const st=L.starters.find(s=>s.id===m.starter); if(!st) return {err:'Chọn 1 bộ đồ'};
  const outfit={...(g==='nu'&&st.nu?st.nu:st.items)};
  p.name=name; p.look={gender:g,hair:m.hair,hairColor:m.hairColor,skin:m.skin,outfit}; for(const id of Object.values(outfit)) p.owned[id]=1;
  markDirty(pl); save(pl); place(pl); return {prof:publicProfile(pl)}; };
handlers.pong=(pl,m)=>{ if(m.s) pl.rtt=Math.max(10,Math.min(1000,now()-m.s)); };
// chỉ dùng khi chạy thử tự động (CHAN_TEST=1): dịch chuyển, cho tiền/đồ/skill
if(process.env.CHAN_TEST==='1') handlers.dbg=(pl,m)=>{ const p=pl.prof;
  if(m.money) p.money+=m.money|0; if(m.items) for(const [k,n] of Object.entries(m.items)) C.addItem(pl,k,n|0);
  if(m.skills) for(const k of m.skills) p.skills[k]=true; if(m.level){ p.exp=S.RULES.levels[m.level-1]||0; p.level=m.level; }
  if(m.needs) Object.assign(p.needs,m.needs); if(m.flags) Object.assign(p.flags,m.flags); if(m.stayType) pl.stayType=m.stayType;
  if(m.plot) FARM.agePlot(m.plot.id,m.plot.ago);
  if(m.tp){ if(!m.tp.scene||m.tp.scene===pl.scene){ pl.x=m.tp.x*C.T; pl.y=m.tp.y*C.T; pl.budget=0; send(pl,{t:'pos',x:pl.x,y:pl.y}); } else moveTo(pl,m.tp.scene,m.tp.x,m.tp.y); }
  markDirty(pl); return {ok:true}; };

/* ---------- WebSocket ---------- */
// nén permessage-deflate: gói vị trí JSON lặp nhiều nên nén được mấy lần, giảm băng thông khi chạy qua tunnel
const wss=new WebSocketServer({server,path:'/ws',maxPayload:8*1024,perMessageDeflate:{threshold:1024,zlibDeflateOptions:{level:1,memLevel:7},concurrencyLimit:64}});
wss.on('connection',(ws,req)=>{
  const url=new URL(req.url,'http://x'), uid=db.sessionUid(url.searchParams.get('t'));
  if(!uid){ ws.send(JSON.stringify({t:'auth',err:'Phiên đăng nhập hết hạn, đăng nhập lại nhé'})); return ws.close(); }
  const old=byUid.get(uid); if(old){ send(old,{t:'kick',msg:'Tài khoản vừa đăng nhập ở nơi khác'}); old.ws.close(); drop(old); }
  const u=db.user(uid), prof=C.fixProfile(db.profile(uid)||C.defaults(u?u.name:'Khách'),u?u.name:'Khách');
  const pl={pid:C.newPid(),uid,pub:FARM.pubOf(uid),ws,prof,scene:null,x:0,y:0,face:1,view:1,anim:0,act:0,actUntil:0,budget:0,mvAt:now(),sent:new Map(),
    lastChat:0,bucket:{n:40,t:now()},rtt:80,over:0};
  players.set(pl.pid,pl); byUid.set(uid,pl);
  const d=today(); if(prof.daily.day!==d){ prof.daily={day:d,done:{},buoys:{},gameExp:0,tiktok:0,posts:0,herd:0,crates:0,cook:0,slept:false}; }
  for(const f of hooks.login) f(pl);
  send(pl,{t:'welcome',pid:pl.pid,pub:pl.pub,prof:publicProfile(pl),now:now(),online:players.size});
  if(prof.look) place(pl);
  ws.on('message',raw=>{
    const b=pl.bucket, t=now(); b.n=Math.min(40,b.n+(t-b.t)*.03); b.t=t;                  // 30 tin/giây, dồn tối đa 40
    if(b.n<1){ if(++pl.over>200) ws.close(); return; } b.n--; pl.over=0; perf.in++;
    let m; try{ m=JSON.parse(raw); }catch(e){ return; } if(!m||typeof m.t!=='string') return;
    const h=handlers[m.t]; if(!h) return;
    if(!pl.prof.look&&m.t!=='create'&&m.t!=='pong') return;
    let r; try{ r=h(pl,m); }catch(e){ console.error('['+m.t+']',e); r={err:'Lỗi server'}; }
    if(m.rid) send(pl,{t:'re',rid:m.rid,...(r||{})}); });
  ws.on('close',()=>drop(pl));
});
function drop(pl){ if(!players.has(pl.pid)) return; for(const f of hooks.logout) f(pl);
  if(pl.scene){ for(const f of hooks.leave) f(pl,pl.scene,null); C.sceneOf(pl.scene).delete(pl); }
  save(pl); players.delete(pl.pid); if(byUid.get(pl.uid)===pl) byUid.delete(pl.uid); }

/* ---------- vòng lặp ---------- */
let lastDay=today();
const perf={n:0,sum:0,max:0,in:0};
setInterval(()=>{ const t=now(), t0=process.hrtime.bigint();
  for(const f of hooks.tick) try{ f(); }catch(e){ console.error(e); }
  for(const pl of players.values()){ if(pl.dirty){ pl.dirty=false; send(pl,{t:'me',p:publicProfile(pl)}); } if(pl.saveAt&&t>=pl.saveAt) save(pl); }
  const ms=Number(process.hrtime.bigint()-t0)/1e6; perf.n++; perf.sum+=ms; perf.max=Math.max(perf.max,ms); },1000/S.RULES.tickHz);
// CHAN_STATS=1: in tải server mỗi 10 giây
if(process.env.CHAN_STATS==='1') setInterval(()=>{ const st=C.stats, mem=process.memoryUsage().rss/1048576;
  console.log(`[tải] ${players.size} người · tick tb ${(perf.sum/Math.max(1,perf.n)).toFixed(2)}ms, max ${perf.max.toFixed(1)}ms · gửi ${(st.bytes/10240).toFixed(0)} KB/s, ${Math.round(st.msgs/10)} tin/s · nhận ${Math.round(perf.in/10)} tin/s · RAM ${mem.toFixed(0)} MB`);
  st.bytes=0; st.msgs=0; perf.n=0; perf.sum=0; perf.max=0; perf.in=0; },10000);
setInterval(()=>{ const d=today();
  if(d!==lastDay){ lastDay=d; for(const pl of players.values()){ pl.prof.daily={day:d,done:{},buoys:{},gameExp:0,tiktok:0,posts:0,herd:0,crates:0,cook:0,slept:false}; markDirty(pl); } }
  for(const f of hooks.slow) try{ f(); }catch(e){ console.error(e); } },1000);
setInterval(()=>{ for(const pl of players.values()) send(pl,{t:'png',s:now()}); },5000);
function shutdown(){ console.log('Đang lưu…'); for(const pl of players.values()) save(pl); process.exit(0); }
process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);

server.listen(PORT,()=>console.log(`Chan City server: http://localhost:${PORT}  (Google: ${GOOGLE_CLIENT_ID?'bật':'chưa cấu hình'}, đăng nhập bằng tên: ${NAME_LOGIN?'bật':'tắt'})`));
