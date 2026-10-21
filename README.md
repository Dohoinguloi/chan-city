# Chan City

Game pixel art top-down của hội, cùng tool làm nhân vật.

| Thư mục | Là gì |
| --- | --- |
| [`chande-bootcamp/`](chande-bootcamp/) | Game top-down. Map 1 "Chande Bootcamp" dựng theo mặt bằng thật của Ké Retreat (Đà Bắc, Hoà Bình). Chơi Mèn Mén, giúp 6 người để nhận EXP, tiền VNĐ, đồ và skill. |
| [`pixel-sprite-forge/`](pixel-sprite-forge/) | Tool biến ảnh thành nhân vật pixel theo template ref (20×35, 3 hướng), xuất sprite sheet + JSON. Có sẵn Mèn Mén, Phú Lê, Đôn Chề, Khá Bảnh, Kenny Ho, Huy Phan, Pháp (2 form) và chó beagle. |

## Chạy

Game đọc sprite từ `pixel-sprite-forge/characters/`, nên mở qua server ở thư mục gốc:

```bash
python3 -m http.server 8780
```

- Game: http://localhost:8780/chande-bootcamp/
- Tool nhân vật: http://localhost:8780/pixel-sprite-forge/

Điều khiển và danh sách nhiệm vụ xem trong [`chande-bootcamp/README.md`](chande-bootcamp/README.md).
