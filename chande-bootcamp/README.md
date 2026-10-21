# Chande Bootcamp

Game top-down pixel art. Map 1 dựng theo mặt bằng thật của Ké Retreat (Đà Bắc, Hoà Bình).

## Chạy game

Game đọc sprite nhân vật từ `../pixel-sprite-forge/characters/`, nên phải mở qua server từ thư mục gốc dự án:

```bash
python3 -m http.server 8780 --directory /Users/kaixa/Projects/Kaixa-Poster
```

Rồi mở http://localhost:8780/chande-bootcamp/

## Điều khiển

| Phím | Việc |
| --- | --- |
| WASD / ↑↓←→ | Đi |
| E / Enter | Nói chuyện, nhặt đồ, chụp ảnh, đi xe |
| M | Bản đồ Ké Retreat (hoặc bấm vào minimap góc phải dưới) |
| N | Bật/tắt tiếng (cũng có nút cạnh đồng hồ) |
| Esc | Menu (âm thanh, chơi lại) |
| T | Nói "VÃI Ò" (có từ đầu) |
| Shift | Chạy nhanh (thưởng của Pháp) |
| Q | Quẩy (Khá Bảnh) |
| Space | Lướt (Đôn Chề) |
| R | Gồng (Phú Lê) |
| V | Soi xu 6 giây (Kenny Ho) |
| K | Hoá Hokage Awwwards (Huy Phan) |

## Cốt truyện demo

1. Mèn Mén ở phòng riêng, điện thoại reo. Pháp rủ lên Ké Retreat.
2. Ra cửa → xe đưa từ Hà Nội lên Đà Bắc → tới Cổng Ké Retreat.
3. Pháp chào ở Cổng rồi nhờ tìm con beagle chạy lạc lên Nền khu cắm trại.
4. Năm người còn lại mỗi người một nhiệm vụ. Hoàn thành nhận EXP, tiền VNĐ, đồ và skill:

| Người giao | Ở đâu | Nhiệm vụ | Thưởng |
| --- | --- | --- | --- |
| Pháp | Cổng | Tìm beagle ở Nền khu cắm trại | 80 EXP · 200.000đ · Xương gặm · Chạy nhanh |
| Khá Bảnh | Bể bơi | Lấy loa bluetooth ở Lều 1 | 70 EXP · 100.000đ · Vòng tay bạc · Quẩy |
| Đôn Chề | Sân lửa trại | Gom 5 bó củi dọc Đường bộ | 60 EXP · 150.000đ · Bật lửa · Lướt (đốt lửa trại) |
| Phú Lê | Nhà ăn khu trên | Cá sông Đà, Gà đồi, Cơm lam | 100 EXP · 500.000đ · Dây chuyền vàng · Gồng |
| Kenny Ho | Deck ngắm cảnh | Chụp 3 view: Bến hồ, Cổng, Nền cắm trại | 80 EXP · 200.000đ · Kính râm · Soi xu |
| Huy Phan | Nhà Chiềng | Nhặt 3 tờ wireframe | 120 EXP · 300.000đ · Nón Hokage · Hoá Hokage |

Xe 4 bánh ở ngoài Cổng và cạnh Nhà Mái Đá: 150.000đ/lượt (giá thật của khu nghỉ). Xong cả 6 việc là hết Ngày 1.

## File

- `art.js`: toàn bộ pixel art (tile, nhà, cây, đồ vật, icon) vẽ bằng code, viền đen 1px như ref.
- `world.js`: map phòng + map Ké Retreat (toạ độ theo mặt bằng), NPC, nhiệm vụ, hội thoại, skill, đồ.
- `game.js`: engine (di chuyển 3 hướng, va chạm, camera, hội thoại, nhiệm vụ, HUD, minimap, bản đồ, âm thanh, lưu game vào localStorage).

Nhân vật có sprite 3 hướng (nghiêng, nhìn xuống, nhìn lên), lấy từ sheet trong `pixel-sprite-forge/characters` (tag `idle/walk/run`, `*_down`, `*_up`). NPC quay mặt về phía Mèn Mén khi đến gần.
- `audio/`: nhạc nền và hiệu ứng do Magnific tạo.
