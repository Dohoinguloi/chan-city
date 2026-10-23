# Chan City (game)

Game top-down pixel art nhiều người chơi, chạy theo giờ Việt Nam thật. Cần server trong [`../server`](../server) (xem README gốc để chạy và gửi link).

## Vào game

1. Đăng nhập bằng Google (nếu server có `GOOGLE_CLIENT_ID`) hoặc tên + mật khẩu.
2. Tạo nhân vật: giới tính, tên, kiểu tóc, màu tóc, màu da, bộ đồ khởi đầu.
3. Bắt đầu ở phòng riêng tại Hà Nội. Pháp gọi điện, mở Grab (G) đi Ké Retreat, chuyến đầu Pháp bao.

## Điều khiển

| Phím | Việc |
| --- | --- |
| WASD / ↑↓←→ | Đi · Shift chạy (sau khi có skill) |
| E | Nói chuyện, nhặt đồ, vào nhà, dùng đồ, tương tác với người chơi khác |
| Enter | Chat với người xung quanh |
| G | Gọi Grab đi map khác (mất phí, cần pin điện thoại) |
| P | Chụp ảnh sống ảo ở chỗ đẹp, về phòng up lấy like |
| I | Túi đồ · M bản đồ · N thanh kỹ năng · Esc menu (bật/tắt tiếng bằng nút loa) |
| H | Lên/xuống ngựa (nông trại Đà Lạt) |
| T Q R K V Space | Skill: nói "VÃI Ò", quẩy, gồng, hoá Hokage, soi xu, lướt |
| Space / J / X | Vật tay (bấm liên tục) · đấm khi đánh nhau · buông tay / bỏ cuộc |

## Luật chính

- **Giờ thật:** giờ trong game là giờ Việt Nam. Ngày đêm đổi theo giờ thật.
- **Ăn uống:** mỗi ngày 3 bữa (6–10h, 11–14h, 17–21h). Bỏ bữa thì đói, đi chậm và nhận ít EXP hơn; ăn bù được. Trà đá, cafe tăng EXP vài phút.
- **Nhu cầu:** năng lượng, sạch sẽ, pin điện thoại giảm dần. Về phòng để nghỉ, tắm, sạc.
- **Phòng:** mỗi người thuê 1 phòng ở Ké qua lễ tân ở Nhà Rếch 2. Phòng trả tiền theo ngày, rẻ nhất 100.000đ. Gõ cửa phòng người khác thì chủ phải đang ở trong và đồng ý; được chủ cho ngủ lại thì mới dùng giường, nhà tắm, ổ sạc.
- **Phòng riêng (Hà Nội):** dùng laptop để vào chợ online (mua bán đồ với người khác), học kỹ năng, chat online, làm remote.
- **Ké Retreat:** 6 nhiệm vụ của cả hội, quán ăn, cafe, shop quần áo, tiệm nông sản, câu cá, kayak (150.000đ/giờ), hái hoa lá cho cô Ké.
  - Vườn rau: mua hạt, gieo, bán cho cô Ké. Rau chín mà quá 90 giây chưa thu thì người khác cướp được 50%.
  - Nhà giải trí cạnh Deck: cờ vua, poker, ma sói có cược tiền.
- **Everfit (Hà Nội):** nộp đơn, phỏng vấn 3 câu, công ty tối đa 10 người. Mỗi ngày làm 3 task, 3 ngày nhận lương 1 lần. Nghỉ Thứ Bảy, Chủ Nhật; 2 ngày remote.
- **Nông trại bác Trang (Đà Lạt):**
  - Trồng rau, hoa, dâu tây, cà phê, cây ăn quả, cao su.
  - Nuôi bò sữa, gà, lợn, cá hồi, tôm.
  - Phụ cô Lan đi chợ mua nguyên liệu rồi nấu.
  - Chăn ngựa, cưỡi ngựa chở hàng.
  - Trường đua: thuê ngựa, cá cược, đua kiểu Audition.

## File

- `shared/data.js`: luật, giá, map, nhiệm vụ. Dùng chung cho server và trình duyệt. `shared/chess.js`: luật cờ vua.
- `game.js`: engine (cảnh, di chuyển, người chơi khác, HUD, ngày đêm). `ui.js`: các bảng giao diện. `lobby.js`: đăng nhập + tạo nhân vật. `net.js`: kết nối server.
- `avatar.js`: dựng nhân vật người chơi từ template của `pixel-sprite-forge`.
- `world.js`, `world2.js`: các map. `art.js`, `art2.js`: pixel art vẽ bằng code. `audio/`: nhạc, tiếng do Magnific tạo.
