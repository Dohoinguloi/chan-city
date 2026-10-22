/* Chan City — đăng nhập (Google hoặc chơi thử bằng tên) + tạo nhân vật (giới tính, tên, tóc, màu tóc, da, bộ đồ khởi đầu). */
(function(){
const SD=SHARED, $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let CFG={google:null,name:true}, firstScene=null, prof=null, fresh=false;   // fresh: tên đăng nhập vừa được tạo mới
NET.listen('scene',m=>{ if(!GAME.started) firstScene=m; });
NET.listen('me',m=>{ prof=m.p; });
const msg=t=>{ $('#loginMsg').textContent=t||''; };
// ?guest: lưu phiên riêng cho tab này (thử nhiều tài khoản trên cùng trình duyệt)
const store=new URLSearchParams(location.search).has('guest')?sessionStorage:localStorage;

async function init(){
  $('#loading').textContent='Đang tải nhân vật...';
  try{ CFG=await NET.api('config'); }catch(e){ $('#loading').textContent='Không kết nối được server. Chạy: cd server && npm start (xem README).'; return; }
  try{ await GAME.boot(); }catch(e){ console.error(e); }
  $('#loading').hidden=true;
  const saved=store.getItem('chan-token'); if(saved&&await connect(saved,true)) return;
  showLogin(); }
function showLogin(){ $('#login').hidden=false; $('#devBox').hidden=!CFG.name;
  if(CFG.google){ const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true;
    s.onload=()=>{ google.accounts.id.initialize({client_id:CFG.google,callback:async r=>{ msg('Đang đăng nhập...'); const res=await NET.api('login',{credential:r.credential}); if(res.err) return msg(res.err); store.setItem('chan-token',res.token); connect(res.token); }});
      google.accounts.id.renderButton($('#gBtn'),{theme:'filled_black',size:'large',text:'signin_with',locale:'vi'}); }; document.head.appendChild(s); }
  else $('#gBtn').innerHTML='<p class="muted">Đăng nhập Google chưa bật (server chưa có GOOGLE_CLIENT_ID). Xem README để tạo Client ID.</p>'; }
$('#devGo').onclick=async()=>{ const n=$('#devName').value.trim(), pw=$('#devPw').value; if(n.length<2) return msg('Tên từ 2 ký tự'); if(pw.length<4) return msg('Mật khẩu từ 4 ký tự'); msg('Đang vào...');
  const r=await NET.api('login',{name:n,pw}); if(r.err) return msg(r.err);
  store.setItem('chan-token',r.token); fresh=!!r.created; connect(r.token); };
$('#devPw').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#devGo').click(); });
async function connect(token,silent){ let w; try{ w=await NET.connect(token); }catch(e){ store.removeItem('chan-token'); if(!silent) msg(e.message); return false; }
  prof=w.prof; $('#login').hidden=true;
  if(!prof.look) creator(); else { await waitScene(); go(); } return true; }
const waitScene=()=>new Promise(r=>{ const t=setInterval(()=>{ if(firstScene){ clearInterval(t); r(); } },50); });
function go(){ $('#title').hidden=true; GAME.start(prof,firstScene); }

/* ---------- tạo nhân vật ---------- */
const C={gender:'nam',name:'',hair:'swept',hairColor:'211c21',skin:'f3b194',starter:'nangdong'};
function look(){ const st=SD.LOOK.starters.find(s=>s.id===C.starter); return {gender:C.gender,hair:C.hair,hairColor:C.hairColor,skin:C.skin,outfit:{...(C.gender==='nu'&&st.nu?st.nu:st.items)}}; }
function creator(){ C.name=prof.name&&prof.name!=='Khách'?prof.name.slice(0,16):''; $('#creator').hidden=false; $('#cNew').hidden=!fresh; $('#title').classList.add('creating'); renderC(); anim(); }
function renderC(){ const L=SD.LOOK;
  $('#cGender').innerHTML=L.genders.map(g=>`<button class="tab ${C.gender===g.id?'on':''}" data-g="${g.id}">${g.name}</button>`).join('');
  $('#cHair').innerHTML=L.hair[C.gender].map(([k,n])=>`<button class="tab ${C.hair===k?'on':''}" data-h="${k}">${n}</button>`).join('');
  $('#cHairCol').innerHTML=L.hairColors.map(c=>`<button class="sw ${C.hairColor===c?'on':''}" data-hc="${c}" style="background:#${c}" aria-label="Màu tóc #${c}"></button>`).join('');
  $('#cSkin').innerHTML=L.skins.map(c=>`<button class="sw ${C.skin===c?'on':''}" data-sk="${c}" style="background:#${c}" aria-label="Màu da #${c}"></button>`).join('');
  $('#cOutfit').innerHTML=L.starters.map(s=>{ const it=C.gender==='nu'&&s.nu?s.nu:s.items; return `<button class="ocard ${C.starter===s.id?'on':''}" data-st="${s.id}"><b>${s.name}</b><span>${Object.values(it).map(k=>SD.CLOTHES[k].name).join(' · ')}</span></button>`; }).join('');
  $('#cName').value=C.name; }
$('#creator').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; const d=b.dataset;
  if(d.g){ C.gender=d.g; if(!SD.LOOK.hair[C.gender].some(h=>h[0]===C.hair)) C.hair=SD.LOOK.hair[C.gender][0][0]; }
  if(d.h) C.hair=d.h; if(d.hc) C.hairColor=d.hc; if(d.sk) C.skin=d.sk; if(d.st) C.starter=d.st; renderC(); });
$('#cName').addEventListener('input',e=>{ C.name=e.target.value; });
let raf=0;
function anim(){ cancelAnimationFrame(raf); const c=$('#cPreview'), g=c.getContext('2d'); g.imageSmoothingEnabled=false; let key='', av=null;
  const loop=t=>{ raf=requestAnimationFrame(loop); const lk=JSON.stringify(look()); if(lk!==key){ key=lk; av=AVATAR.build(look()); }
    const views=['walk_down','walk','walk_up','idle'], vi=Math.floor(t/1600)%4, an=av.anims[views[vi]], f=an.frames[Math.floor(t/125)%an.frames.length];
    g.fillStyle='#f3ecdc'; g.fillRect(0,0,c.width,c.height); g.fillStyle='rgba(20,30,20,.2)'; g.beginPath(); g.ellipse(c.width/2,c.height-14,40,8,0,0,7); g.fill();
    g.drawImage(f,0,0,32,48,c.width/2-64,c.height-14-192+4*13-52,128,192); };
  raf=requestAnimationFrame(loop); }
// nhầm tên đăng nhập (vào phải tài khoản mới): đăng xuất, về lại màn đăng nhập
$('#cBack').onclick=async()=>{ try{ await NET.api('logout',{token:NET.token}); }catch(e){} store.removeItem('chan-token'); location.reload(); };
$('#cGo').onclick=async()=>{ const n=$('#cName').value.trim(); if(n.length<2){ $('#cMsg').textContent='Đặt tên từ 2 tới 16 ký tự'; return; }
  const r=await NET.req({t:'create',name:n,...look(),outfit:undefined,starter:C.starter}); if(r.err){ $('#cMsg').textContent=r.err; return; }
  prof=r.prof; cancelAnimationFrame(raf); $('#creator').hidden=true; await waitScene(); go(); };
init();
})();
