# DSA Web Presentation — Hướng dẫn chạy

Đây là toàn bộ mã nguồn của bài trình chiếu web DSA.

## Cách 1 — Chạy nhanh, không cần cài Node.js

Yêu cầu: Python 3.

### macOS / Linux / WSL

```bash
cd dsa-web-presentation-source/public
python3 -m http.server 8080
```

### Windows PowerShell

```powershell
cd dsa-web-presentation-source\public
py -m http.server 8080
```

Sau đó mở:

```text
http://localhost:8080/presentation.html
```

Nhấn `Ctrl + C` trong terminal để dừng máy chủ.

## Cách 2 — Chạy toàn bộ ứng dụng Vinext

Yêu cầu: Node.js `22.13.0` trở lên và npm.

```bash
cd dsa-web-presentation-source
npm ci
npm run dev
```

Mở địa chỉ mà terminal hiển thị, thường là:

```text
http://localhost:5173
```

## Build và chạy bản production

```bash
npm ci
npm run build
npm run start
```

## Tự host dạng website tĩnh

Chỉ cần tải toàn bộ nội dung thư mục `public/` lên hosting. Trang trình chiếu chính là `presentation.html`; các tệp `app.css` và `app.js` phải nằm cùng cấp ở thư mục gốc của website.

## Điều khiển trình chiếu

- `←` / `→`, `Page Up` / `Page Down`: chuyển slide.
- `Home` / `End`: tới slide đầu / cuối.
- `F`: bật hoặc tắt toàn màn hình.
- Có thể dùng nút điều hướng và mục lục trên màn hình.

Lưu ý: font Google sẽ tự chuyển sang font dự phòng nếu máy chạy ngoại tuyến.
