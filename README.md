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

## Hash Lab

Open `public/hash-lab.html` through the same static server, or choose **Open Hash Lab** in the presentation.

- Three hash functions: division, mid-square, and multiplication.
- Four collision strategies: separate chaining, linear probing, quadratic probing, and double hashing.
- Enter initial keys, step through probes, then insert, find, or delete. Open addressing uses tombstones so deletion preserves lookups. Duplicate insertions keep set semantics.
- Keys range from -9999 to 9999, with up to 12 initial keys and 2–31 slots. Quadratic/double probing require a prime size. Resize explicitly to rehash live keys and clear tombstones; quadratic probing can exhaust its sequence before the table fills.
- Mid-square uses digits 4–5 of an eight-digit padded square. Multiplication uses the absolute key. These conventions are identical in JavaScript and C++.

### Standalone C++17 demo

```bash
g++ -std=c++17 -Wall -Wextra -pedantic public/code/hash_demo.cpp -o hash_demo
./hash_demo
```

Choose a hash function, collision strategy and size, then enter `insert 22`, `find 22`, `delete 22`, `resize 23`, `print`, or `quit`. The source can also be downloaded from Hash Lab.

### Algorithm checks (no npm install required)

```bash
node --test tests/demo-engine.test.mjs tests/hash-engine.test.mjs
```

### PowerPoint coverage

| Hash topic | Runnable demo |
| --- | --- |
| Division, mid-square, multiplication | Hash function selector and per-key calculation |
| Chaining, linear probing, quadratic probing, double hashing | Collision strategy selector and probe trace |
| Lookup and deletion | Find/Delete actions, including tombstones |
| Load factor and resizing | Live n/m indicator and Resize & rehash |
| Collision strategy comparison | Switch strategies and rebuild with the same keys |

The C++17 program supports the same hash functions, collision strategies, and operations.
