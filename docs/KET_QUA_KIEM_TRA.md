# Kết quả kiểm tra — 21/10/2026

## Cập nhật tương thích Expo Go SDK 57

Đã chuyển dự án từ SDK 58 về SDK 57 theo phiên bản Expo Go của sinh viên. Bộ phiên bản hiện tại: Expo **57.0.30**, React Native **0.86.3**, React/React DOM **19.2.3**, Expo Router **57.0.28**, expo-video **57.0.5**. Những thư viện native và kiểu React được đồng bộ bằng `expo install --fix`; `package-lock.json` đã cập nhật đầy đủ.

Các kiểm tra sau khi chuyển phiên bản đều đạt:

- `npm run typecheck`, `npm run lint`.
- `npm test`: **10/10** ca đạt.
- `expo install --check`: **Dependencies are up to date**.
- `npm ci --ignore-scripts --dry-run --no-audit`: lockfile hợp lệ.
- `expo config --type public`: **sdkVersion = 57.0.0**, platforms = ios/android/web.
- `expo export --platform android --platform ios --platform web --max-workers 2`: thành công cả ba nền tảng, có Hermes bundle Android và iOS.

Chưa kiểm thử trực tiếp trên điện thoại của sinh viên. Khi dùng bản mới: dừng terminal cũ bằng Ctrl+C, tải lại mã nguồn, chạy `npm.cmd ci` rồi `npx.cmd expo start --clear` và quét QR mới bằng Expo Go hỗ trợ SDK 57. Hướng dẫn đã cập nhật trong README.

## Kết quả kiểm tra chức năng

Sinh viên: **Đào Xuân Thành_BIT240215**.

| Hạng mục                  | Kết quả xác minh                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| TypeScript                | `npm run typecheck`: thành công                                                                                 |
| ESLint                    | `npm run lint`: thành công, không lỗi/cảnh báo                                                                  |
| Nghiệp vụ và REST client  | `npm test`: 10/10 ca đạt                                                                                        |
| Phiên bản thư viện native | `npx expo install --check`: Dependencies are up to date                                                         |
| Đóng gói Android          | `expo export --platform android --platform web --max-workers 2`: thành công, có Hermes bundle Android           |
| Đóng gói web              | Thành công, giao diện chạy bằng bundle export trên localhost                                                    |
| GET MockAPI thật          | 3 danh mục, 10 khóa học, tất cả categoryId tồn tại; endpoint chi tiết hoạt động                                 |
| CRUD MockAPI thật         | Tạo/sửa/đọc/xóa khóa học và danh mục thử đều thành công; dọn bản ghi thử sau kiểm tra                           |
| Bảo vệ danh mục           | `deleteCategory` từ chối xóa khi có khóa học; chỉ gửi DELETE sau khi đọc courses thành công                     |
| UI danh sách              | Hiện đủ 10 khóa học/3 danh mục, ảnh và tên danh mục lấy từ API                                                  |
| UI tìm kiếm/lọc           | `lap trinh` + Lập trình Mobile: 2 kết quả; cùng từ khóa + Lập trình Web: trạng thái rỗng                        |
| UI chi tiết               | GET khóa 1, hiển thị đúng dữ liệu; chuyển màn hình giữ trạng thái                                               |
| UI form sửa               | Điền sẵn tên, mô tả, giảng viên, danh mục, học phí, thời lượng, ảnh và trailer                                  |
| UI form trống             | Lưu bị chặn; báo lỗi tất cả trường bắt buộc, danh mục, học phí và thời lượng                                    |
| Trailer trên web          | MP4 tải được metadata, readyState=4, thời lượng 10,026667 giây; sau thao tác Play, currentTime đi đến hết video |

## Sửa dữ liệu mẫu để trailer hoạt động

10 URL ban đầu tại `commondatastorage.googleapis.com/gtv-videos-bucket/sample/` đều trả về HTTP 403 AccessDenied tại thời điểm kiểm tra. Đã thay **trường trailerUrl** của 10 khóa học bằng URL MP4 mẫu có thể truy cập:

https://www.w3schools.com/html/mov_bbb.mp4

Nguồn MP4 này trả HTTP 200, Content-Type `video/mp4`, và đã được phát thử trong giao diện. Những trường dữ liệu khác được giữ nguyên. File `data/courses.json` là bản sao sau sửa. Video là mẫu trình diễn kỹ thuật, không phải trailer giảng dạy chính thức của từng khóa.

## Giới hạn xác minh

- Chưa cài/chạy APK trên điện thoại hoặc Android Emulator trong phiên này. Export Android xác minh đóng gói mã JavaScript/assets, không thay thế kiểm thử native thực tế.
- Trình duyệt có thể chặn tự phát video có âm thanh. Nhấn Play trên thanh điều khiển để phát; điều khiển video đã kiểm tra hoạt động.
- URL ảnh/trailer là nguồn công khai bên ngoài, khả năng truy cập có thể thay đổi. Khi cần thay URL, dùng chức năng sửa khóa học.
- `npm audit` còn cảnh báo ở các phụ thuộc gián tiếp của Expo/Metro và công cụ phát triển. Cập nhật không phá vỡ tương thích đã được thử; không dùng `npm audit fix --force` vì đề xuất hạ Expo về SDK cũ làm hỏng tương thích. Đây không phải kết quả chứng nhận an toàn bảo mật.
- Phần video thuyết trình không thực hiện theo yêu cầu của sinh viên; có hướng dẫn kịch bản trong `KIEM_THU.md`.
