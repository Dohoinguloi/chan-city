// Lưu trữ bằng SQLite có sẵn trong Node (node:sqlite): tài khoản, phiên đăng nhập, hồ sơ nhân vật, ô rau, nhân viên Everfit.
'use strict';
const {DatabaseSync}=require('node:sqlite');
const path=require('path'), fs=require('fs'), crypto=require('crypto');

const DIR=process.env.DATA_DIR||path.join(__dirname,'data');
fs.mkdirSync(DIR,{recursive:true});
const db=new DatabaseSync(path.join(DIR,'chancity.db'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, provider TEXT, email TEXT, name TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, uid TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS profiles(uid TEXT PRIMARY KEY, data TEXT, updated INTEGER);
CREATE TABLE IF NOT EXISTS plots(i TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS jobs(uid TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS market(id INTEGER PRIMARY KEY AUTOINCREMENT, seller TEXT, sname TEXT, item TEXT, n INTEGER, price INTEGER, at INTEGER);
CREATE TABLE IF NOT EXISTS loans(id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT);`);   // loans: người chơi cho nhau vay (haosang.js)
try{ db.exec('ALTER TABLE users ADD COLUMN pw TEXT'); }catch(e){}   // mật khẩu cho đăng nhập bằng tên
try{ db.exec('ALTER TABLE users ADD COLUMN alias TEXT'); }catch(e){}   // bí danh: đăng nhập bằng tên này thì vào tài khoản khác (người chơi quên tên đăng nhập, gõ nhầm tên nhân vật)

const SESSION_DAYS=30;
const st={
  getUser:db.prepare('SELECT * FROM users WHERE id=?'),
  addUser:db.prepare('INSERT INTO users(id,provider,email,name,created) VALUES(?,?,?,?,?)'),
  addSession:db.prepare('INSERT INTO sessions(token,uid,created) VALUES(?,?,?)'),
  setPw:db.prepare('UPDATE users SET pw=? WHERE id=?'),
  getSession:db.prepare('SELECT * FROM sessions WHERE token=?'),
  delSession:db.prepare('DELETE FROM sessions WHERE token=?'),
  oldSessions:db.prepare('DELETE FROM sessions WHERE created<?'),
  getProfile:db.prepare('SELECT data FROM profiles WHERE uid=?'),
  allProfiles:db.prepare('SELECT uid,data FROM profiles'),
  putProfile:db.prepare('INSERT INTO profiles(uid,data,updated) VALUES(?,?,?) ON CONFLICT(uid) DO UPDATE SET data=excluded.data, updated=excluded.updated'),
  allPlots:db.prepare('SELECT i,data FROM plots'),
  putPlot:db.prepare('INSERT INTO plots(i,data) VALUES(?,?) ON CONFLICT(i) DO UPDATE SET data=excluded.data'),
  delPlot:db.prepare('DELETE FROM plots WHERE i=?'),
  allJobs:db.prepare('SELECT uid,data FROM jobs'),
  putJob:db.prepare('INSERT INTO jobs(uid,data) VALUES(?,?) ON CONFLICT(uid) DO UPDATE SET data=excluded.data'),
  delJob:db.prepare('DELETE FROM jobs WHERE uid=?'),
  allMarket:db.prepare('SELECT * FROM market ORDER BY id DESC'),
  addMarket:db.prepare('INSERT INTO market(seller,sname,item,n,price,at) VALUES(?,?,?,?,?,?)'),
  delMarket:db.prepare('DELETE FROM market WHERE id=?'),
  allLoans:db.prepare('SELECT id,data FROM loans'),
  addLoan:db.prepare('INSERT INTO loans(data) VALUES(?)'),
  putLoan:db.prepare('UPDATE loans SET data=? WHERE id=?'),
  delLoan:db.prepare('DELETE FROM loans WHERE id=?'),
};
st.oldSessions.run(Date.now()-SESSION_DAYS*864e5);

module.exports={
  user(id){ return st.getUser.get(id)||null; },
  ensureUser(id,provider,email,name){ const u=st.getUser.get(id); if(u) return u; st.addUser.run(id,provider,email||'',name||'',Date.now()); return st.getUser.get(id); },
  setPw(id,hash){ st.setPw.run(hash,id); },
  newSession(uid){ const t=crypto.randomBytes(24).toString('base64url'); st.addSession.run(t,uid,Date.now()); return t; },
  sessionUid(token){ if(typeof token!=='string'||token.length>64) return null; const s=st.getSession.get(token);
    if(!s) return null; if(s.created<Date.now()-SESSION_DAYS*864e5){ st.delSession.run(token); return null; } return s.uid; },
  endSession(token){ st.delSession.run(token); },
  profile(uid){ const r=st.getProfile.get(uid); return r?JSON.parse(r.data):null; },
  allProfiles(){ return st.allProfiles.all().map(r=>({...JSON.parse(r.data),_uid:r.uid})); },
  saveProfile(uid,p){ st.putProfile.run(uid,JSON.stringify(p),Date.now()); },
  plots(){ const out={}; for(const r of st.allPlots.all()) out[r.i]=JSON.parse(r.data); return out; },
  savePlot(i,p){ if(p) st.putPlot.run(i,JSON.stringify(p)); else st.delPlot.run(i); },
  jobs(){ const out={}; for(const r of st.allJobs.all()) out[r.uid]=JSON.parse(r.data); return out; },
  saveJob(uid,j){ if(j) st.putJob.run(uid,JSON.stringify(j)); else st.delJob.run(uid); },
  market(){ return st.allMarket.all(); },
  addListing(seller,sname,item,n,price){ return Number(st.addMarket.run(seller,sname,item,n,price,Date.now()).lastInsertRowid); },
  delListing(id){ st.delMarket.run(id); },
  loans(){ return st.allLoans.all().map(r=>({...JSON.parse(r.data),id:Number(r.id)})); },
  addLoan(L){ return Number(st.addLoan.run(JSON.stringify(L)).lastInsertRowid); },
  saveLoan(L){ if(L.st==='done') st.delLoan.run(L.id); else st.putLoan.run(JSON.stringify(L),L.id); },
  // cộng tiền cho người đang offline (sửa thẳng hồ sơ đã lưu): đền tiền chủ vườn, trả nợ cho người cho vay
  addMoney(uid,v){ v=Math.round(v); if(!Number.isFinite(v)||v<=0) return false; const r=st.getProfile.get(uid);   // chỉ cộng tiền (số âm / NaN từ chỗ gọi lỗi không được trừ tiền người offline)
    if(!r) return false; const p=JSON.parse(r.data); p.money=(p.money||0)+Math.round(v); st.putProfile.run(uid,JSON.stringify(p),Date.now()); return true; },
  // sao lưu cả DB ra 1 file (VACUUM INTO, không khoá lâu): trước khi reset server
  backup(file){ db.exec(`VACUUM INTO '${String(file).replace(/'/g,"''")}'`); },
  // chạy nhiều lệnh trong 1 giao dịch (mua bán chợ online)
  tx(fn){ db.exec('BEGIN'); try{ const r=fn(); db.exec('COMMIT'); return r; }catch(e){ db.exec('ROLLBACK'); throw e; } },
};
