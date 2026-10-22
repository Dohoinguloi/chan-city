/* Kết nối server: đăng nhập, WebSocket, gửi/nhận tin, đồng bộ giờ server, đệm vị trí người chơi khác để nội suy mượt. */
(function(){
const NET={ws:null,rid:1,wait:{},off:0,on:{},pid:0,pub:'',token:'',up:false};
NET.listen=(t,fn)=>{ (NET.on[t]=NET.on[t]||[]).push(fn); };
const fire=(t,m)=>{ for(const f of NET.on[t]||[]) try{ f(m); }catch(e){ console.error(t,e); } };
NET.api=async(path,body)=>{ const r=await fetch('/api/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}); return r.json(); };
NET.connect=token=>new Promise((ok,bad)=>{ NET.token=token; const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws?t=${encodeURIComponent(token)}`); NET.ws=ws;
  let welcomed=false;
  ws.onmessage=e=>{ const m=JSON.parse(e.data);
    if(m.t==='re'){ const w=NET.wait[m.rid]; if(w){ delete NET.wait[m.rid]; w(m); } return; }
    if(m.t==='png'){ NET.send({t:'pong',s:m.s}); NET.off=m.s-Date.now(); return; }
    if(m.t==='welcome'){ welcomed=true; NET.up=true; NET.pid=m.pid; NET.pub=m.pub; NET.off=m.now-Date.now(); ok(m); }
    if(m.t==='auth'){ bad(new Error(m.err)); return; }
    fire(m.t,m); };
  ws.onclose=()=>{ NET.up=false; if(!welcomed) bad(new Error('Không kết nối được server')); else fire('close',{}); };
  ws.onerror=()=>{}; });
NET.send=o=>{ if(NET.ws&&NET.ws.readyState===1) NET.ws.send(JSON.stringify(o)); };
NET.req=o=>new Promise(res=>{ const rid=NET.rid++; NET.wait[rid]=res; NET.send({...o,rid}); setTimeout(()=>{ if(NET.wait[rid]){ delete NET.wait[rid]; res({err:'Server không phản hồi'}); } },9000); });
NET.now=()=>Date.now()+NET.off;
// có bản cập nhật (file game trên server đổi) thì hiện nút tải lại, không tự tải để khỏi mất ván đang chơi
let VER=null; setInterval(async()=>{ try{ const r=await NET.api('ver'); if(VER===null) VER=r.v; else if(r.v!==VER&&!document.getElementById('newVer')){ const b=document.createElement('button'); b.id='newVer'; b.className='btn pri';
  b.textContent='Có bản cập nhật mới · bấm để tải lại'; b.onclick=()=>location.reload(); document.body.appendChild(b); } }catch(e){} },30000);
NET.api('ver').then(r=>{ VER=r.v; }).catch(()=>{});
window.NET=NET;
})();
