// Thông báo bản cập nhật lên kênh chat tổng: server khởi động với bản mới (mục đầu LOG khác bản đã báo, lưu ở DATA_DIR/announced.txt)
// thì 12 giây sau (đợi mọi người kết nối lại) đăng các dòng của bản đó lên kênh tổng. Khởi động lại mà không có bản mới thì chỉ để lại trong lịch sử kênh.
// Mỗi lần đưa bản mới lên: thêm 1 mục vào ĐẦU danh sách LOG.
'use strict';
const fs=require('fs'), path=require('path'), W=require('./world');
const LOG=[
  {v:'2026-10-22i',title:'22/10 (sửa lỗi)',items:['Server gửi dữ liệu game dạng nén + dùng lại file đã tải: vào game nhanh hơn nhiều, bớt lỗi "Server không phản hồi" khi mạng chậm','Quà admin: Leno và Ben Jr mỗi người +10.000.000đ']},
  {v:'2026-10-22h',title:'22/10 (bổ sung)',items:['Cường hoá ngựa thành thần thú ở Người Thuần Thú (MU) hoặc trại ngựa: Thiên Mã, Kỳ Lân, Bạch Hổ, Rồng Xanh, Phượng Hoàng, Hắc Long. Mỗi bậc chạy nhanh hơn + tăng máu, công MU','MU: thanh máu boss chuyển xuống góc dưới trái, ngay trên khung chiêu']},
  {v:'2026-10-22g',title:'22/10 (bổ sung)',items:['MU: Thợ Rèn Huyền Thoại bán 50 vũ khí (10 loại × 5 hệ Kịch Độc, Băng Giá, Hoả Ngục, Lôi Thần, Hư Không), có vũ khí 5 sao Huyền thoại. Cầm vào tăng công + chỉ số phụ, ra chiêu có hiệu ứng vung và nổ theo hệ']},
  {v:'2026-10-22f',title:'22/10 (bổ sung)',items:['MU Online cưỡi ngựa được: bấm H để lên / xuống ngựa (cần có ngựa thuê hoặc mua ở trại ngựa)']},
  {v:'2026-10-22e',title:'22/10 (bổ sung)',items:['MU Premium Store thêm set Khúc Thị Hương: tóc đen dài, bikini đen, hình xăm 2 tay, chiêu phím 5 Selfie Chói Loá làm boss choáng','MU: boss hạ xong (hoặc bỏ đi) phải hồi đủ thời gian mới ra lại (Luffy 20 phút, boss phụ 10–18 phút), xem đếm ngược ở thanh boss']},
  {v:'2026-10-22d',title:'22/10 (bổ sung)',items:['MU Premium Store thêm set Rắn Biển: đồ bơi thể thao, hình xăm rắn trên tay, chiêu phím 5 Rắn Độc Quấn hút máu']},
  {v:'2026-10-22c',title:'22/10',items:[
    'MU: map rộng gấp đôi, 5 boss vẽ lại: Luffy Gear 5 (rơi Trái Ác Quỷ), Naruto, Quỷ Cưa, Dươngg Vũ, Rồng Dải Xanh. Đòn boss có vòng cảnh báo, chạy ra là né được',
    'MU: 3 class đều đánh gần, hiệu ứng chiêu mới, icon chiêu mới, minimap + nhạc riêng từng khu, bảng chiến lợi phẩm khi hạ boss',
    'MU: Premium Store 15 set legacy (giảm 60%), mỗi set thêm chiêu phím 5 (16Typh gọi Min ra đánh cùng)',
    'MU: Thợ Kim Hoàn bán cánh, dây chuyền, vật hộ thân, aura dưới chân; nút ⭐ Nội tại cộng điểm khi lên cấp',
    'Nút 🤖 Auto ở bảng Việc cần làm: tự nhận việc, tự đi làm, tự bấm E, tự báo cáo',
    'Vườn Ké thêm 16 loại rau củ, vẽ lại toàn bộ rau quả · thêm 17 bài nhạc cho các map · tiếng chờ đi xe nhỏ lại',
    'Sửa màn hình đen khi đánh boss MCK; MCK mỗi ngày tối đa 2 lượt (thua lượt 1 được đánh lại, thắng là hết)']}];
const FILE=path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'announced.txt');
let last=''; try{ last=fs.readFileSync(FILE,'utf8').trim(); }catch(e){ /* chưa báo bản nào */ }
const U=LOG[0], lines=[`Bản cập nhật ${U.title} đã lên:`,...U.items.map(s=>'• '+s)];
if(U.v!==last) setTimeout(()=>{ for(const m of lines) W.sysChat(m); try{ fs.writeFileSync(FILE,U.v); }catch(e){ console.error('announced.txt',e.message); } },12000);
else for(const m of lines) W.sysChat(m,true);
module.exports={LOG};
