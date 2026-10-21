// Kiểm tra Google ID token (Sign in with Google) bằng khoá công khai của Google, không cần thư viện ngoài.
'use strict';
const crypto=require('crypto');

let JWKS={keys:[],exp:0};
async function googleKeys(force){
  if(!force&&JWKS.keys.length&&Date.now()<JWKS.exp) return JWKS.keys;
  const r=await fetch('https://www.googleapis.com/oauth2/v3/certs'); if(!r.ok) throw new Error('Không lấy được khoá Google');
  const j=await r.json(), m=/max-age=(\d+)/.exec(r.headers.get('cache-control')||'');
  JWKS={keys:j.keys||[],exp:Date.now()+(m?+m[1]*1000:3600e3)}; return JWKS.keys;
}
const b64=s=>Buffer.from(s,'base64url');

async function verifyGoogle(idToken,clientId){
  if(typeof idToken!=='string'||idToken.length>4096) throw new Error('Token không hợp lệ');
  const parts=idToken.split('.'); if(parts.length!==3) throw new Error('Token không hợp lệ');
  const [h,p,sig]=parts, head=JSON.parse(b64(h)), pay=JSON.parse(b64(p));
  if(head.alg!=='RS256') throw new Error('Sai thuật toán ký');
  let jwk=(await googleKeys()).find(k=>k.kid===head.kid);
  if(!jwk) jwk=(await googleKeys(true)).find(k=>k.kid===head.kid);           // Google vừa xoay khoá
  if(!jwk) throw new Error('Không tìm thấy khoá ký');
  const ok=crypto.verify('RSA-SHA256',Buffer.from(h+'.'+p),crypto.createPublicKey({key:jwk,format:'jwk'}),b64(sig));
  if(!ok) throw new Error('Chữ ký sai');
  if(!['accounts.google.com','https://accounts.google.com'].includes(pay.iss)) throw new Error('Sai nơi cấp');
  if(pay.aud!==clientId) throw new Error('Token không dành cho game này');
  if(!pay.exp||pay.exp*1000<Date.now()) throw new Error('Token hết hạn');
  return {sub:pay.sub,email:pay.email||'',name:pay.name||'',verified:!!pay.email_verified};
}
module.exports={verifyGoogle};
