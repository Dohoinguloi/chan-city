// Test tải: N bot đăng nhập, tạo nhân vật, lên Ké Retreat rồi đi lại quanh Cổng (dồn đông nhất có thể), chat, dùng skill.
// Chạy: node bots.js [số bot] [địa chỉ server] [số giây]   ví dụ: node bots.js 80 http://localhost:8791 60
// Server test phải chạy với CHAN_BOTS=1 (mặc định server chặn đăng nhập tên bot001…, vì mật khẩu bot đoán được)
'use strict';
const WebSocket=require('ws');
const N=+(process.argv[2]||80), BASE=process.argv[3]||'http://localhost:8791', SEC=+(process.argv[4]||60);
const T=16, sleep=ms=>new Promise(r=>setTimeout(r,ms));
const stat={snaps:0,bytes:0,msgs:0,lat:[],errors:0,connected:0,kicked:0}, socks=[]; let wire=0;
const HAIR={nam:['swept','messy','fringe','undercut','fade','buzz'],nu:['ponytail','long','bun','bowl','shag']};
const pick=a=>a[Math.floor(Math.random()*a.length)];

async function bot(i){
  const name='bot'+String(i).padStart(3,'0');
  const r=await fetch(BASE+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,pw:'botpass'+i})}).then(r=>r.json());
  if(!r.token){ stat.errors++; console.log(name,'login lỗi',r.err); return; }
  const ws=new WebSocket(BASE.replace(/^http/,'ws')+'/ws?t='+r.token); let rid=1; const wait={}; let me=null, scene=null;
  const req=o=>new Promise(res=>{ const id=rid++; wait[id]={res,t:Date.now()}; ws.send(JSON.stringify({...o,rid:id})); });
  ws.on('message',d=>{ stat.bytes+=d.length; stat.msgs++; const m=JSON.parse(d);
    if(m.t==='re'&&wait[m.rid]){ stat.lat.push(Date.now()-wait[m.rid].t); wait[m.rid].res(m); delete wait[m.rid]; }
    if(m.t==='s') stat.snaps++; if(m.t==='welcome') me=m.prof; if(m.t==='scene') scene=m; if(m.t==='pos'&&scene){ scene.x=m.x; scene.y=m.y; }
    if(m.t==='png') ws.send(JSON.stringify({t:'pong',s:m.s})); if(m.t==='kick') stat.kicked++; });
  ws.on('error',()=>stat.errors++);
  await new Promise(r=>ws.on('open',r)); stat.connected++; socks.push(ws); while(!me) await sleep(50);
  if(!me.look){ const g=Math.random()<.5?'nam':'nu'; await req({t:'create',name,gender:g,hair:pick(HAIR[g]),hairColor:'211c21',skin:'f3b194',starter:pick(['nangdong','thanhlich','matme'])}); }
  await req({t:'call'}); await req({t:'grab',to:'retreat'}); await sleep(300);
  // đi lại quanh Cổng: chọn điểm ngẫu nhiên, đi 70px/s, gửi vị trí 10 lần/giây
  let x=scene.x, y=scene.y, tx=x, ty=y, f=1; const end=Date.now()+SEC*1000; let nextChat=Date.now()+5000+Math.random()*30000, nextAct=Date.now()+Math.random()*20000;
  while(Date.now()<end&&ws.readyState===1){
    if(Math.hypot(tx-x,ty-y)<4){ tx=(32+Math.random()*16)*T; ty=(86+Math.random()*11)*T; }
    const d=Math.hypot(tx-x,ty-y), st=Math.min(d,7); x+=(tx-x)/d*st; y+=(ty-y)/d*st; f=tx>x?1:-1;
    ws.send(JSON.stringify({t:'mv',x,y,f,v:0,a:1}));
    if(Date.now()>nextChat){ ws.send(JSON.stringify({t:'chat',m:pick(['Chào cả nhà','Đi câu cá không?','VÃI Ò','Ai chơi poker không','Đói quá'])})); nextChat=Date.now()+20000+Math.random()*20000; }
    if(Date.now()>nextAct){ ws.send(JSON.stringify({t:'act',a:'noi'})); req({t:'who'}); nextAct=Date.now()+8000+Math.random()*8000; }
    await sleep(100); }
  ws.close();
}
(async()=>{ console.log(`${N} bot → ${BASE}, ${SEC} giây`); const t0=Date.now();
  const all=[]; for(let i=1;i<=N;i++){ all.push(bot(i).catch(e=>{ stat.errors++; console.log('bot',i,e.message); })); await sleep(40); }
  const tick=setInterval(()=>{ const el=(Date.now()-t0)/1000; const c=Math.max(1,stat.connected); const w=socks.reduce((a,x)=>a+(x._socket?x._socket.bytesRead:0),0); console.log(`[${el.toFixed(0)}s] kết nối ${stat.connected} · gói vị trí/bot/s ${(stat.snaps/c/5).toFixed(1)} · dữ liệu/bot ${(stat.bytes/c/5/1024).toFixed(1)} KB/s · thực nhận qua mạng/bot ${((w-wire)/c/5/1024).toFixed(1)} KB/s · lỗi ${stat.errors}`); wire=w; stat.snaps=0; stat.bytes=0; },5000);
  await Promise.all(all); clearInterval(tick);
  const L=stat.lat.sort((a,b)=>a-b), q=p=>L[Math.min(L.length-1,Math.floor(L.length*p))]||0;
  console.log(`Xong. Độ trễ phản hồi: p50 ${q(.5)}ms · p95 ${q(.95)}ms · max ${L[L.length-1]||0}ms (${L.length} lệnh) · lỗi ${stat.errors} · bị đá ${stat.kicked}`); process.exit(0); })();
