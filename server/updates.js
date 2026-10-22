// Thông báo bản cập nhật lên kênh chat tổng: server khởi động với bản mới (mục đầu LOG khác bản đã báo, lưu ở DATA_DIR/announced.txt)
// thì 12 giây sau (đợi mọi người kết nối lại) đăng các dòng của bản đó lên kênh tổng. Khởi động lại mà không có bản mới thì chỉ để lại trong lịch sử kênh.
// Mỗi lần đưa bản mới lên: thêm 1 mục vào ĐẦU danh sách LOG.
'use strict';
const fs=require('fs'), path=require('path'), W=require('./world');
const LOG=[
  {v:'2026-10-24b',title:'24/10 · Xích Thố + Đại nhiệm vụ Tân Thế Giới Chande',items:[
    'Đại nhiệm vụ Tân Thế Giới Chande: truy tìm 3 món huyền thoại (Cái Pod của Kaixa, Cây Bút của Redtype, Airpod của VNPT), mỗi món 15 mảnh. Banner lúc vào game bấm vào từng món để xem đường đi',
    'Xích Thố của ông Trường Con: ngựa lửa thần thoại MẠNH HƠN mọi thú cưỡi thường (chỉ số hơn thần thú cùng bậc 30%). Làm xong 4 nhiệm vụ của ông ở Miếu (Hải Phòng) rồi gặp ông xin ngựa',
    'Xích Thố có 6 dáng: lửa gốc + 5 hệ Kim / Mộc / Thuỷ / Hoả / Thổ, toàn thân rực lửa theo màu hệ, mỗi hệ cộng chỉ số riêng và lửa phun có hiệu ứng riêng. Cưỡi trong MU tự phun lửa vào quái / boss gần nhất',
    'Lên cấp Xích Thố bằng tiền + ngọc (Ước Nguyện → Tâm Linh → Hỗn Nguyên), tối đa cấp 15. Cấp 15 mở DỊCH CHUYỂN: ở đâu cũng tới ngay mọi map, không cần gọi Grab, không tốn tiền / pin',
    'Người Thuần Thú hiện thẻ Xích Thố: chưa mở thì khoá kèm danh sách nhiệm vụ, bấm ➜ tự đi làm',
    'Mảnh Airpod mới: cường hoá Xích Thố lên cấp 5']},
  {v:'2026-10-24a',title:'24/10 · 3 item huyền thoại',items:[
    '3 ô item huyền thoại cạnh thanh đồ: Cái Pod của Kaixa (+150% mọi chỉ số MU), Cây Bút của Redtype (phím 6: hoá gà quái 2 giây + mọi chiêu hồi về 0, 10 giây dùng lại), Airpod của VNPT (cứ 10 giây bất tử 3 giây, chiêu +500%)',
    'Mỗi món ghép từ 15 mảnh: thành tựu cày (1000 quái rừng, 200 lần hạ Luffy, Everfit 20 ngày, hết chứng chỉ DAS, cờ vua, Poker, CSGT, trồng cây, nuôi lợn vịt, stream anh Độ...), nhiệm vụ ẩn, câu đố logic ở phiến đá cổ, nhiệm vụ nhóm ở vòng sáng. Bấm vào ô để xem hướng dẫn',
    'Nút ➜ ở bảng Việc cần làm và bảng mảnh: nhiệm vụ ở map khác thì tự gọi Grab sang rồi tự đi tới người giao / chỗ làm · Miếu ông Trường Con có hòm công đức']},
  {v:'2026-10-23u',title:'23/10 (thần thú)',items:['Vẽ lại 6 thần thú cưỡi đẹp hơn: chân 2 khớp gập gối khi chạy, bờm đuôi bay, cánh 2 lớp lông, hổ vằn mới, rồng gai lưng vảy bụng','Thêm 2 bậc thần thú: bậc 7 Thuỷ Quân (bờm mây tím ánh sao, dải lụa trắng), bậc 8 Tinh Vân Thần Điểu (chim thần cánh lửa xanh ngọc lấp lánh sao). Cường hoá ở Người Thuần Thú']},
  {v:'2026-10-23t',title:'23/10 · Tay trái + Kamen Rider + cân bằng set',items:[
    'Ô Tay trái (Thợ Rèn, 10 triệu mỗi món, đã cân bằng): Khiên Hắc Hoàng Đế · Mặt Nạ Quỷ Kotex (cứ 15 giây khát máu: hút máu 40%) · Búa Của Thor (20% giật sét theo % máu quái) · Đại Đao Của Inuyasha (trừ giáp + chí mạng) · Động Cơ Của Elon Musk (tốc đánh, 10% đánh liền 2 đòn) · Đũa Thần Của Howard Le (phép mạnh, giảm kháng phép + hồi máu quái, cứ 5 chiêu khoá chiêu quái 2 giây)',
    'Set legacy đồng giá 8 triệu, cân bằng lại: mỗi set 1 chỉ số chính mạnh hẳn + 2 chỉ số bổ trợ. Set mới Kamen Rider: khi đánh cứ 5 giây biến form (Build, Ex-Aid, Ghost, Gaim, Fourze, OOO), mỗi form 1 chỉ số mạnh, chiêu Rider Kick',
    'Phù Thuỷ: tầm ra chiêu +5 ô · Bỏ giới hạn số lần hạ boss mỗi ngày']},
  {v:'2026-10-23s',title:'23/10 (Quỷ Cưa)',items:['Quỷ Cưa lúc đang xoay cưa chỉ kháng 50% phép: chiêu đánh vào được nửa sát thương (lúc không xoay vẫn miễn phép, chỉ đánh thường mới mất máu)']},
  {v:'2026-10-23r',title:'23/10 (Nobita + Eren)',items:['Nobita: máu giảm 25%; còn 50% máu chui vào cốc mỳ ly phòng thủ 2 giây (đánh không xi nhê), chui ra nổ choáng + độc trong 10 ô, cứ 15 giây lại chui','Eren: phạm vi đánh giảm một nửa, có chiêu gọi 20 Titan Nhỏ (máu mỗi con = 1/40 Eren)']},
  {v:'2026-10-23q',title:'23/10 (Dươngg Vũ)',items:['Dươngg Vũ dưới 35% máu: cứ 15 giây nuốt chửng 1 người bất kỳ 7 giây (đứng im trong bụng, mất 4% máu mỗi giây), hết giờ mới nhổ ra. Hạ boss sớm là cứu được đồng đội!']},
  {v:'2026-10-23p',title:'23/10 · Quỷ Cưa + Reze, Ngọc Rồng, Mưa Vĩ Thú',items:[
    'Quỷ Cưa miễn phép, chỉ mất máu vì đánh thường; bị đánh dồn thì xoay cưa vòng tròn (đòn ×4). Còn 50% máu gọi Quỷ Bom Reze ném lựu đạn gây choáng; có Reze thì Quỷ Cưa thi thoảng hoá Pochita, Reze thả BOM HẠT NHÂN cả khu: nấp sát Pochita mới sống!',
    'Doraemon bị đánh dồn gọi mưa bánh rán gây độc · Conan lướt theo đường đạn gây mê: giáp + kháng phép +20% · Songoku còn 20% gọi 7 viên Ngọc Rồng hồi máu cho Songoku + Rồng (đập vỡ ngọc, đứng gần bị độc + giảm hồi máu)',
    'Cửu Vĩ: giáp + kháng phép +25%, dưới 25% máu gọi Mưa Bom Vĩ Thú trừ 20% máu mỗi quả · Nobita máu ×20, Nữ Yêu máu ×2',
    'Minimap hiện rõ người chơi khác (chấm to, ở xa thì có mũi tên + tên ở mép) · MU / D-Day hiện thanh máu đồng đội trên đầu · nghĩa địa Dươngg Vũ đi xuyên qua bia mộ được']},
  {v:'2026-10-23o',title:'23/10 (Thợ Rèn + boss)',items:['Thợ Rèn Huyền Thoại bán Khiên của Hắc Hoàng Đế (ô Khiên riêng, đeo cùng vũ khí): máu +20%, hồi máu +80%, giáp +15%, chạy nhanh +15%','Dươngg Vũ còn 50% máu gọi ra 10 Phạm Hoàng Hà vây quanh bắn đạn tròn đỏ hồng','Cửu Vĩ Hồ Ly (Naruto hoá) vẽ lại: 9 đuôi xù như lửa, tai dài, mắt đỏ, nhe nanh vung vuốt']},
  {v:'2026-10-23n',title:'23/10 (cân bằng thưởng)',items:['Thưởng hạ boss MU: Ngọc Cường Hoá giảm 4 lần (×5 thay vì ×20), tiền thưởng giảm 3 lần. D-Day: tiền thưởng giảm 3 lần, thắng được 1 Ngọc Cường Hoá']},
  {v:'2026-10-23m',title:'23/10 · Cổng D-Day + class Đại Tượng + Songoku',items:[
    'Cổng D-Day ở quảng trường MU: đấu 1-1 / 2-2 / 3-3, mỗi đội 1 nhà chính + quái ra theo đợt, phá nhà chính đội kia là thắng. Mỗi ngày 2 trận; thắng được item bí mật huyền thoại, EXP, tiền, ngọc, Trái Ác Quỷ',
    'Class mới Đại Tượng (tank, đổi ở Vệ binh): máu gấp 10, giáp gấp 5 Chiến Binh, đánh chậm 3 lần. Chiêu: Đập Choáng, Bật Giáp (giáp dày + phản 40% đòn), Hồi Máu',
    'Tiên Nữ thành đánh xa: tầm gấp đôi, trừ giáp cao, thi thoảng bắn choáng quái, chạy nhanh gấp 2, phát bắn nào cũng làm chậm + giảm hồi máu. Chiêu 3 đổi thành Phun Lửa: giảm hồi máu, giảm sát thương của quái',
    'Rồng Dải Xanh còn 50% máu gọi Songoku ra (Songoku còn 50% hoá Siêu Saiyan, có Kamehameha); dưới 25% rồng lặn xuống nước 2 giây. Đầm Rồng giờ lội ra được tận chỗ rồng tắm',
    'Boss MU: thưởng gấp 20, mỗi ngày hạ mỗi boss tối đa 5 lần, boss nào cũng rơi đủ loại ngọc; ngọc quý chắc chắn cho người top sát thương còn cần ngọc (đủ rồi thì nhường top 2, 3) + 20% cho 1 người bất kỳ',
    'Eren tầm +5 ô, đánh nhanh gấp 40 · Naruto hoá Cửu Vĩ (tầm ×3, đánh nhanh ×20) · Dươngg Vũ cứ 5 giây hoá bóng ma (không đánh được, toả độc 3 ô) · Luffy tạo hình + animation mới, tầm +5, thi thoảng đánh xa 10 ô, chí mạng 75% · Conan giảm nửa sát thương chiêu',
    'Đồ MU có thêm hiệu ứng Giảm hồi máu · MU có Quán Ăn và Phòng Nghỉ Trưa (hồi năng lượng) · bảng chỉ số và danh sách boss có nút thu gọn / ẩn']},
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
