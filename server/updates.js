// Thông báo bản cập nhật lên kênh chat tổng: server khởi động với bản mới (mục đầu LOG khác bản đã báo, lưu ở DATA_DIR/announced.txt)
// thì 12 giây sau (đợi mọi người kết nối lại) đăng các dòng của bản đó lên kênh tổng. Khởi động lại mà không có bản mới thì chỉ để lại trong lịch sử kênh.
// Mỗi lần đưa bản mới lên: thêm 1 mục vào ĐẦU danh sách LOG.
'use strict';
const fs=require('fs'), path=require('path'), W=require('./world');
const LOG=[
  {v:'2026-10-23l',title:'23/10 (boss)',items:['Máu mọi boss tăng lên gấp 40 so với gốc (trước gấp 15), đòn vẫn gấp 15: Luffy ~140.000 máu / 1 người, Pepe 7.000.000 máu, MCK, Megatron cũng trâu hơn. Rủ thêm người đánh cùng nhé!']},
  {v:'2026-10-23k',title:'23/10 · Vùng boss phía Tây MU + Pepe + chỉ số mới',items:[
    'MU mở rộng sang trái (đi lối mở tường Tây quảng trường): Làng Meme của Pepe ở trên cùng, 4 khu boss có tường thành: Bãi đất trống Phố Nobita (Doraemon + Nobita, ngồi được trên ống cống), Phố Beika (Conan), Tường Maria (Eren hoá Titan Tiến Công), Rừng Tiếng Hét (Nữ Yêu Tiếng Hét)',
    'Boss Pepe: máu gấp 50 boss thường, 5 giây toả đạn vòng tròn, 15 giây nhảy đè choáng, 30 giây gọi 10 Pepe Con, 40 giây mưa thiên thạch. Vé vào làng 1.000.000đ, mỗi ngày 3 vé. Hạ Pepe rơi Huy Hiệu Pepe: đổi 1 trong 3 thần thú siêu huyền thoại Raikou / Suicune / Entei (chỉ số ×15, kỹ năng siêu huyền thoại)',
    'Mọi boss máu gấp 40, đòn gấp 15, nhiều kiểu đòn mới (vùng đuổi theo, tia thẳng, chữ thập, chuỗi nổ, vành khuyên), ngắm đón đầu, đi áp sát; thanh máu trên đầu boss, tên đòn hiện trước khi ra. Mỗi người đánh mỗi boss tối đa 3 lần / ngày',
    'Đánh thường tự động khi đứng gần quái / boss theo chỉ số Tốc đánh; rê chuột vào quái sáng viền, bấm để khoá mục tiêu; tay / kiếm vung khi đánh',
    'Vũ khí, phụ kiện, giày, set legacy, thần thú có thêm chỉ số: tốc đánh, hút máu, chí mạng, giáp (giảm % sát thương quái), độc, làm chậm, giật sét, trừ giáp, giảm hồi chiêu, sức mạnh phép, hào quang hút máu. Bảng nhân vật MU hiện đủ chỉ số',
    'Chiến Binh, Tiên Nữ: máu gấp 3 Phù Thuỷ, có giáp sẵn, hồi máu nhanh, tầm đánh xa thêm 2 ô. Cấp tối đa 1000 (nhân vật và MU). Điểm nội tại: 3 cấp được 1 điểm (điểm cũ đã hoàn lại để cộng lại). Sách nội tại giá ×4, mua là đọc luôn, tính vào lực chiến',
    'Lính Cát: cấp 25 tiến hoá dạng 3 (thêm Chuột Vương, Mãng Xà Vương, Dạ Dơi Vương, Hải Long Vương); Trung tâm Lính Cát ở MU (hồi máu có phí, Sách Kinh Nghiệm, cho ăn Ngọc Cường Hoá), Đền Lính Cát Huyền Thoại; bảng 🐾 hiện cả con trong máy gửi giữ',
    'Tỉ lệ cường hoá (đập đồ) giảm một nửa · Pháp sư Cát bán sách nội tại, có nút Bán hết · Thách đấu: 1 người hết máu là kết thúc, cả 2 hồi đầy máu',
    'Nút 🛒 Cửa hàng online (phím C): xem và mua đồ mọi người đăng bán ở bất cứ đâu · Đất ở Ké / Đà Lạt mua đứt được, cần tiền bán lại cho chú Ba / bác Trang',
    'Chuột phải đi chính xác hơn, giữ chuột phải để đi theo con trỏ · Bàn cờ vua mới kiểu chess.com (nét ở mọi mức zoom, chấm gợi ý nước đi, quân trượt mượt) · Gục ở MU có hiệu ứng hồn ma + đếm ngược · Thông đường xuống bến kayak Ké']},
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
