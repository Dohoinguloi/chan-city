// Poker Texas Hold'em: xào bài, chấm bài mạnh nhất 5/7 lá.
'use strict';
const crypto=require('crypto');
const RANKS='23456789TJQKA', SUITS='shdc';
const NAMES=['Mậu thầu','Một đôi','Hai đôi','Sám cô','Sảnh','Thùng','Cù lũ','Tứ quý','Thùng phá sảnh'];

function deck(){ const d=[]; for(const r of RANKS) for(const s of SUITS) d.push(r+s);
  for(let i=d.length-1;i>0;i--){ const j=crypto.randomInt(i+1); [d[i],d[j]]=[d[j],d[i]]; } return d; }
function eval5(cs){
  const r=cs.map(c=>RANKS.indexOf(c[0])).sort((a,b)=>b-a), flush=cs.every(c=>c[1]===cs[0][1]);
  let straight=-1; if(new Set(r).size===5){ if(r[0]-r[4]===4) straight=r[0]; else if(r[0]===12&&r[1]===3) straight=3; }   // A-2-3-4-5
  const cnt={}; for(const x of r) cnt[x]=(cnt[x]||0)+1;
  const g=Object.entries(cnt).map(([k,v])=>[v,+k]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]), rk=g.map(x=>x[1]);
  if(straight>=0&&flush) return [8,straight];
  if(g[0][0]===4) return [7,...rk];
  if(g[0][0]===3&&g[1][0]===2) return [6,...rk];
  if(flush) return [5,...r];
  if(straight>=0) return [4,straight];
  if(g[0][0]===3) return [3,...rk];
  if(g[0][0]===2&&g[1][0]===2) return [2,...rk];
  if(g[0][0]===2) return [1,...rk];
  return [0,...r];
}
function cmp(a,b){ for(let i=0;i<Math.max(a.length,b.length);i++){ const d=(a[i]??-1)-(b[i]??-1); if(d) return d; } return 0; }
function* comb(arr,k,s=0,cur=[]){ if(cur.length===k){ yield cur.slice(); return; } for(let i=s;i<arr.length;i++){ cur.push(arr[i]); yield* comb(arr,k,i+1,cur); cur.pop(); } }
// bài mạnh nhất từ 5–7 lá
function best(cs){ let top=null, hand=null;
  for(const h of comb(cs,5)){ const s=eval5(h); if(!top||cmp(s,top)>0){ top=s; hand=h; } }
  return {score:top,name:nameOf(top),cards:hand}; }
function nameOf(s){ return s[0]===8&&s[1]===12?'Thùng phá sảnh hoàng gia':NAMES[s[0]]; }
module.exports={deck,eval5,best,cmp,nameOf};
