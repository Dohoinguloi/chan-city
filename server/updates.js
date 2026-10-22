// Thông báo bản cập nhật lên kênh chat tổng: server khởi động với bản mới (mục đầu LOG khác bản đã báo, lưu ở DATA_DIR/announced.txt)
// thì 12 giây sau (đợi mọi người kết nối lại) đăng các dòng của bản đó lên kênh tổng. Khởi động lại mà không có bản mới thì chỉ để lại trong lịch sử kênh.
// Mỗi lần đưa bản mới lên: thêm 1 mục vào ĐẦU danh sách LOG.
'use strict';
const fs=require('fs'), path=require('path'), W=require('./world');
const LOG=[
  {v:'2026-10-23j',title:'23/10 (bổ sung)',items:['Bảng Phù Thuỷ Cường Hoá và Người Thuần Thú có mục "Tìm ngọc ở đâu?": mỗi loại ngọc rơi ở đâu, tỉ lệ bao nhiêu, giờ boss Luffy ra, bấm ➜ Tới để tự đi tới chỗ đó','Báo "không đủ ngọc" khi khắc lỗ cũng hiện to giữa màn hình']},
  {v:'2026-10-23i',title:'23/10 (cường hoá)',items:['Cường hoá mạnh gấp 3: mỗi cấp vũ khí +7,5% công, giáp / set +6% máu và thủ, phụ kiện, giày cũng ×3 (tỉ lệ thành công giữ nguyên)','Ngọc Cường Hoá 1.000.000đ/viên, mua gói 5 viên chỉ 4.700.000đ','Báo kết quả cường hoá to giữa màn hình: thành công / thất bại nhìn thấy ngay']},
  {v:'2026-10-23h',title:'23/10 (quà + sửa lỗi)',items:['Quà toàn dân: mỗi người được tặng 1 Ngọc Ước Nguyện (vào game là nhận, xem trong túi đồ)','Sửa lỗi bảng Phù Thuỷ Cường Hoá trống trơn khi trong túi có vũ khí rơi từ boss','Sửa lỗi màn hình game có lúc bị trắng xoá (chỉ còn giao diện)']},
  {v:'2026-10-23g',title:'23/10 (chỉnh)',items:['Quái rừng MU ra lại sau 30 giây (hạ xong 30 giây là con mới xuất hiện ở ổ cũ)']},
  {v:'2026-10-23f',title:'23/10 (bổ sung)',items:['Quái rừng MU ra lại nhanh hơn: hạ xong 12 giây là con mới xuất hiện ở ổ cũ']},
  {v:'2026-10-23e',title:'23/10 · Rừng quái MU + Ngọc Cường Hoá',items:['MU mở rộng rừng quái phía Nam (đi cổng Nam quảng trường, lối Nam Đầm Rồng / Bãi Phế Liệu): 9 khu, 9 loài quái đi theo bầy (Slime Bí Ngô, Bọ Cạp Tím, Pháp Sư Đen, Người Sói, Bóng Ma, Quỷ Khổng Lồ, Người Đá, Linh Hồn Sọ Hươu, Chó Ba Đầu), càng sâu càng mạnh. Đánh quái được tiền, EXP, EXP MU, chiến lợi phẩm, có thể rơi Ngọc Cường Hoá. Trong rừng có cả Lính Cát hoang',
    'Ngọc Cường Hoá: Phù Thuỷ Cường Hoá (góc Tây Nam quảng trường MU) khắc 12 lỗ cho vũ khí, giáp, set legacy, phụ kiện, giày. Lỗ càng sâu càng khó (lỗ cuối 7%), Lính Cát đầu đội cấp cao cộng tỉ lệ, mỗi loài Lính Cát huyền thoại tặng 1 Ngọc Huyền Thoại (80%). Ngọc rơi từ boss, quái rừng, nhiệm vụ ẩn, vớt dưới hồ Ké',
    'Tiệm Giày Lướt Gió (góc Tây Bắc quảng trường MU): 15 đôi giày đi nhanh hơn ở mọi map + chỉ số đánh boss, Ván Trượt Vàng mạnh nhất (+32% tốc độ)',
    'Vũ khí Thợ Rèn giờ cầm trên tay nhân vật, ai cũng thấy; cường hoá từ +7 vũ khí phát sáng theo hệ',
    'Top 1 / 2 / 3 đại gia có lửa rực vàng / đỏ / xanh lá trên đầu. Bảng xếp hạng thêm tab Lực chiến MU',
    'Sổ sưu tầm có gợi ý tìm đủ Kỷ vật Bearplus. Chưa được cúp Site of the Day thì mỗi ngày nộp lại Awwwards 1 lần']},
  {v:'2026-10-23d',title:'23/10 (sửa lỗi)',items:['Sửa lỗi Lính Cát báo "Đang đấu rồi" mà không thấy trận nào: giờ bấm lại là mở đúng trận đang dở để đánh tiếp hoặc bỏ chạy']},
  {v:'2026-10-23c',title:'23/10 (bổ sung)',items:['Ưu đãi học viên & nhân viên: học ở DAS hoặc làm ở Bearplus, Lumen, Everfit thì mua đồ giảm 20% (quần áo, đồ ăn uống, hạt giống, vật nuôi, đồ Lính Cát, ngựa, đồ MU). HUD hiện 🎓 -20% mua đồ']},
  {v:'2026-10-23b',title:'23/10 · Ngày Mèn Mén Thế Giới 🎉',items:['Chào mừng Ngày Mèn Mén Thế Giới: toàn dân Chan City mỗi người được tặng 2.000.000đ (vào game là nhận, tới hết 30/10)','Set 16Typh: chiêu 5 gọi Min ra được cả khi chưa có boss, Min tự hát đánh boss trong 9 ô','Lính Cát đi theo cả khi cưỡi ngựa / thần thú','MU: mua / thuê ngựa ngay ở Người Thuần Thú','Game mượt hơn: hết giật mỗi giây, đi sang khu mới của map không bị khựng, vào lại game tải nhanh hơn (trình duyệt giữ sẵn file game)']},
  {v:'2026-10-23a',title:'23/10',items:['Sạc ké (🔌 Xin sạc nhờ) mạnh hơn: +80% pin, sạc đầy được 100%, pin dưới 80% là xin được, 6 lần/ngày','Màn tạo nhân vật có nút Quay lại màn đăng nhập. Gõ nhầm tên đăng nhập (vào phải tài khoản mới) thì game báo để quay lại đăng nhập đúng tên']},
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
