# Chan City

Game pixel art top-down nhiều người chơi của hội, cùng tool làm nhân vật.

| Thư mục | Là gì |
| --- | --- |
| [`chande-bootcamp/`](chande-bootcamp/) | Game. 3 map theo giờ Việt Nam thật: Ké Retreat (Đà Bắc, Hoà Bình), văn phòng Everfit (Hà Nội), nông trại bác Trang (Đà Lạt). |
| [`server/`](server/) | Server Node.js: đăng nhập, lưu hồ sơ (SQLite có sẵn trong Node), WebSocket thời gian thực cho 60–100 người. |
| [`pixel-sprite-forge/`](pixel-sprite-forge/) | Tool biến ảnh thành nhân vật pixel theo template ref (20×35, 3 hướng). Game dùng chung template này để dựng nhân vật người chơi. |

## Chạy trên máy

Cần Node.js 22.13 trở lên.

```bash
cd server && npm install && npm start
```

Mở http://localhost:8790. Dữ liệu người chơi nằm trong `server/data/` (không đưa lên GitHub).

## Gửi link cho bạn bè chơi cùng (miễn phí)

Dùng Cloudflare quick tunnel, không cần tài khoản, không mất tiền. Mở thêm 1 cửa sổ terminal, để server vẫn chạy, rồi gõ:

```bash
cloudflared tunnel --url http://localhost:8790
```

Lệnh in ra link dạng `https://xxxx.trycloudflare.com`. Gửi link đó cho mọi người.

- Link chỉ sống khi máy đang bật cả server lẫn lệnh trên. Tắt đi bật lại thì link đổi.
- Cài cloudflared nếu chưa có: `brew install cloudflared`.
- Chưa có Google login thì mọi người vào bằng tên + mật khẩu (lần đầu nhập là tạo tài khoản).

## Bật đăng nhập Google

1. Vào https://console.cloud.google.com, tạo project (miễn phí).
2. **APIs & Services → OAuth consent screen**: chọn External, điền tên app "Chan City", email của mày, lưu.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, loại **Web application**.
4. Ở **Authorized JavaScript origins** thêm `http://localhost:8790` và link công khai (ví dụ `https://xxxx.trycloudflare.com`). Link tunnel đổi thì phải thêm lại.
5. Copy **Client ID** (dạng `1234-abc.apps.googleusercontent.com`) rồi chạy server:

```bash
cd server && GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com npm start
```

Muốn chỉ cho đăng nhập Google, thêm `NAME_LOGIN=0`.

## Biến môi trường của server

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `8790` | Cổng web |
| `GOOGLE_CLIENT_ID` | trống | Bật nút đăng nhập Google |
| `NAME_LOGIN` | `1` | Cho đăng nhập bằng tên + mật khẩu |
| `DATA_DIR` | `server/data` | Chỗ lưu file SQLite |
| `CHAN_TEST` | trống | `1` = bật lệnh thử nghiệm (dịch chuyển, cho tiền). Không bật khi chơi thật |

Điều khiển và luật chơi xem trong [`chande-bootcamp/README.md`](chande-bootcamp/README.md).
