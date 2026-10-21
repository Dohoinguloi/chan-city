/* Cờ vua: sinh nước đi hợp lệ (nhập thành, bắt tốt qua đường, phong cấp), chiếu, chiếu hết, hoà.
   Dùng chung: server kiểm tra nước đi, client tô các ô đi được. Ô 0 = a8, ô 63 = h1. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.CHESS=factory(); })(this,function(){
const ix=(r,c)=>r*8+c, on=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const col=p=>p?(p===p.toUpperCase()?'w':'b'):null;
const KN=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]], KG=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const DIAG=[[1,1],[1,-1],[-1,1],[-1,-1]], ORTH=[[1,0],[-1,0],[0,1],[0,-1]];
const sqName=i=>'abcdefgh'[i&7]+(8-(i>>3));

function newGame(){ const b=Array(64).fill(''), back='rnbqkbnr';
  for(let c=0;c<8;c++){ b[c]=back[c]; b[8+c]='p'; b[48+c]='P'; b[56+c]=back[c].toUpperCase(); }
  return {b,turn:'w',castle:'KQkq',ep:-1,half:0,full:1,last:null}; }
// ô sq có bị bên `by` tấn công không
function attacked(b,sq,by){ const r=sq>>3, c=sq&7, own=p=>p&&col(p)===by;
  const pr=by==='w'?r+1:r-1, pp=by==='w'?'P':'p';
  for(const dc of [-1,1]) if(on(pr,c+dc)&&b[ix(pr,c+dc)]===pp) return true;
  for(const [dr,dc] of KN){ const R=r+dr,C=c+dc; if(on(R,C)){ const p=b[ix(R,C)]; if(own(p)&&p.toLowerCase()==='n') return true; } }
  for(const [dr,dc] of KG){ const R=r+dr,C=c+dc; if(on(R,C)){ const p=b[ix(R,C)]; if(own(p)&&p.toLowerCase()==='k') return true; } }
  const ray=(dirs,kinds)=>{ for(const [dr,dc] of dirs){ let R=r+dr,C=c+dc; while(on(R,C)){ const p=b[ix(R,C)]; if(p){ if(own(p)&&kinds.includes(p.toLowerCase())) return true; break; } R+=dr; C+=dc; } } return false; };
  return ray(DIAG,'bq')||ray(ORTH,'rq'); }
function pseudo(s){ const {b}=s, me=s.turn, opp=me==='w'?'b':'w', out=[];
  for(let i=0;i<64;i++){ const p=b[i]; if(!p||col(p)!==me) continue; const r=i>>3, c=i&7, k=p.toLowerCase(), add=(to,x)=>out.push({from:i,to,...x});
    if(k==='p'){ const d=me==='w'?-1:1, start=me==='w'?6:1, last=me==='w'?0:7;
      const push=(to,x)=>{ if((to>>3)===last) for(const pr of 'qrbn') add(to,{...x,promo:pr}); else add(to,x); };
      if(on(r+d,c)&&!b[ix(r+d,c)]){ push(ix(r+d,c)); if(r===start&&!b[ix(r+2*d,c)]) add(ix(r+2*d,c),{dbl:true}); }
      for(const dc of [-1,1]){ const R=r+d, C=c+dc; if(!on(R,C)) continue; const t=ix(R,C);
        if(b[t]&&col(b[t])===opp) push(t); else if(t===s.ep) add(t,{ep:true}); } }
    else if(k==='n'||k==='k'){
      for(const [dr,dc] of (k==='n'?KN:KG)){ const R=r+dr, C=c+dc; if(!on(R,C)) continue; const t=ix(R,C); if(!b[t]||col(b[t])===opp) add(t); }
      if(k==='k'){ const row=me==='w'?7:0, [KS,QS]=me==='w'?['K','Q']:['k','q'], rook=me==='w'?'R':'r';
        if(i===ix(row,4)&&!attacked(b,i,opp)){
          if(s.castle.includes(KS)&&!b[ix(row,5)]&&!b[ix(row,6)]&&b[ix(row,7)]===rook&&!attacked(b,ix(row,5),opp)&&!attacked(b,ix(row,6),opp)) add(ix(row,6),{castle:'k'});
          if(s.castle.includes(QS)&&!b[ix(row,3)]&&!b[ix(row,2)]&&!b[ix(row,1)]&&b[ix(row,0)]===rook&&!attacked(b,ix(row,3),opp)&&!attacked(b,ix(row,2),opp)) add(ix(row,2),{castle:'q'}); } } }
    else { const dirs=k==='b'?DIAG:k==='r'?ORTH:[...DIAG,...ORTH];
      for(const [dr,dc] of dirs){ let R=r+dr, C=c+dc; while(on(R,C)){ const t=ix(R,C); if(b[t]){ if(col(b[t])===opp) add(t); break; } add(t); R+=dr; C+=dc; } } } }
  return out; }
function apply(s,m){ const b=s.b.slice(), p=b[m.from], me=s.turn; let castle=s.castle, ep=-1;
  const cap=b[m.to]||(m.ep?'p':'');
  b[m.to]=m.promo?(me==='w'?m.promo.toUpperCase():m.promo):p; b[m.from]='';
  if(m.ep) b[m.to+(me==='w'?8:-8)]='';
  if(m.castle){ const row=me==='w'?7:0; if(m.castle==='k'){ b[ix(row,5)]=b[ix(row,7)]; b[ix(row,7)]=''; } else { b[ix(row,3)]=b[ix(row,0)]; b[ix(row,0)]=''; } }
  if(m.dbl) ep=(m.from+m.to)/2;
  for(const [sq,ch] of [[60,'KQ'],[4,'kq'],[63,'K'],[56,'Q'],[7,'k'],[0,'q']]) if(m.from===sq||m.to===sq) for(const x of ch) castle=castle.replace(x,'');
  return {b,turn:me==='w'?'b':'w',castle,ep,half:(p.toLowerCase()==='p'||cap)?0:s.half+1,full:s.full+(me==='b'?1:0),last:{from:m.from,to:m.to,cap:!!cap}}; }
const kingSq=(b,c)=>b.indexOf(c==='w'?'K':'k');
function legal(s){ return pseudo(s).filter(m=>{ const n=apply(s,m); return !attacked(n.b,kingSq(n.b,s.turn),n.turn); }); }
function move(s,{from,to,promo}){ const m=legal(s).find(m=>m.from===from&&m.to===to&&(!m.promo||m.promo===(promo||'q'))); return m?apply(s,m):null; }
function inCheck(s){ return attacked(s.b,kingSq(s.b,s.turn),s.turn==='w'?'b':'w'); }
// play / check / mate / stale / draw50 / material
function status(s){ const chk=inCheck(s);
  if(!legal(s).length) return chk?'mate':'stale';
  if(s.half>=100) return 'draw50';
  const rest=s.b.filter(p=>p&&p.toLowerCase()!=='k'); if(!rest.length||(rest.length===1&&'nbNB'.includes(rest[0]))) return 'material';
  return chk?'check':'play'; }
return {newGame,legal,move,status,inCheck,sqName,col};
});
