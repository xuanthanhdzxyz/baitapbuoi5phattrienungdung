# CourseSpace — Quản lý khóa học

**Sinh viên: Đào Xuân Thành_BIT240215**  
Bài tập Mobile App, React Native + Expo + TypeScript, backend MockAPI.io.

## 1. Chạy ứng dụng

Yêu cầu Node.js 22.13+ hoặc bản LTS mới hơn, npm và điện thoại Android/iOS có Expo Go tương thích **SDK 57** (hoặc Android Emulator).

### Nếu đã tải bản SDK 58 trước đó

Tải lại mã nguồn mới nhất từ GitHub hoặc giải nén bản ZIP SDK 57 vào thư mục mới, mở terminal tại thư mục có `package.json`, sau đó chạy:

```bash
npm.cmd ci
npx.cmd expo start --clear
```

Nếu terminal Expo cũ còn chạy, nhấn `Ctrl+C` để dừng trước khi khởi động bản mới. Quét mã QR mới bằng Expo Go hỗ trợ SDK 57. Không chỉ sao chép `package.json`: cần cả `package-lock.json` mới để cài đúng các thư viện tương thích.

```bash
npm ci
npm start
```

Quét QR bằng Expo Go. Điện thoại và máy tính cần cùng mạng. Nhấn `a` để mở Android Emulator đã cài và khởi động. Nếu mạng LAN chặn kết nối, dùng `npx expo start --tunnel` (CLI có thể yêu cầu cài công cụ tunnel).

```bash
npm run android        # mở bằng Android Emulator
npm run web            # xem thêm bản web
npm run typecheck
npm test
npm run export:android # kiểm tra đóng gói JS/assets Android, không phải APK
```

Nguồn này là ứng dụng di động React Native; bản web chỉ phục vụ xem thử. Để tạo APK bằng dịch vụ Expo EAS: đăng nhập tài khoản Expo, chạy `npx eas-cli@latest build:configure`, sau đó `npx eas-cli@latest build -p android --profile preview`. File `eas.json` đã cung cấp profile APK. Quyền truy cập EAS và môi trường build do người chạy cấu hình.

## 2. Project/API MockAPI

- Trang quản trị: https://mockapi.io/projects/6ad740fd95e98f36aef221f2
- **Base URL:** https://6ad740fd95e98f36aef221f1.mockapi.io
- Danh mục: https://6ad740fd95e98f36aef221f1.mockapi.io/categories
- Khóa học: https://6ad740fd95e98f36aef221f1.mockapi.io/courses

ID trang quản trị và hostname API khác nhau. API hiện có 3 danh mục và 10 khóa học mẫu, lấy trực tiếp từ backend; ứng dụng không dùng mảng mẫu để thay thế API. Ảnh và video được lưu bằng URL chuỗi. Video mẫu công khai minh họa khả năng phát, không phải video giảng dạy của khóa học.

Không cần tạo `.env` để chạy với project đã cấu hình. Khi dùng project khác, sao chép `.env.example` thành `.env` và đổi `EXPO_PUBLIC_API_BASE_URL`, sau đó khởi động lại Expo. Có thể đổi ngay bằng nút **⚙ API → Kiểm tra và lưu kết nối**. Cấu hình lưu trên thiết bị có ưu tiên hơn biến môi trường. Giá trị EXPO_PUBLIC được đưa vào bundle và không dùng để chứa bí mật.

## 3. Đối chiếu yêu cầu đề bài

| Yêu cầu                | Cách thực hiện                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Danh sách khóa học     | GET `/courses` và GET `/categories`; ảnh URL, tên, giảng viên, tên danh mục, học phí                 |
| Tìm kiếm/lọc           | Tìm theo tiêu đề không phân biệt hoa/thường và dấu; kết hợp lọc categoryId                           |
| Chi tiết               | GET `/courses/{id}`, hiển thị đầy đủ thông tin, ngày tạo, thời lượng và ảnh                          |
| Trailer trong ứng dụng | Modal dùng `expo-video`, điều khiển native, toàn màn hình và báo lỗi tải                             |
| Thêm khóa học          | Form + Picker danh mục từ API + xem trước ảnh; POST `/courses`                                       |
| Sửa khóa học           | Điền sẵn toàn bộ trường, giữ createdAt, PUT `/courses/{id}`                                          |
| Xóa khóa học           | Hộp xác nhận trước DELETE; tải lại dữ liệu sau thành công                                            |
| CRUD danh mục          | Danh sách, thêm, sửa, xác nhận xóa; GET/POST/PUT/DELETE                                              |
| Ràng buộc 1–N          | Chặn xóa danh mục có khóa học; GET lại toàn bộ courses trước DELETE                                  |
| Kiểm tra dữ liệu       | Trường bắt buộc, học phí ≥ 0, thời lượng > 0, URL HTTP/HTTPS, categoryId tồn tại                     |
| Trạng thái             | Loading, khóa thao tác khi lưu, thông báo thành công, lỗi mạng/HTTP/timeout, danh sách rỗng, ảnh lỗi |
| Tối thiểu 4 màn hình   | Danh sách; chi tiết; form thêm/sửa; quản lý danh mục; thêm màn hình cấu hình API                     |
| Tên sinh viên          | Header ứng dụng, màn hình cấu hình và README                                                         |

**Không làm video thuyết trình theo yêu cầu của sinh viên. Chức năng phát trailer vẫn được triển khai.**

## 4. Cấu trúc mã nguồn và luồng API

```text
src/app/              Expo Router: chuyển hướng và route động theo màn hình
src/CourseApp.tsx     Các màn hình, trạng thái và điều phối CRUD
src/api.ts           REST client, timeout 15 giây và bảo vệ xóa danh mục
src/domain.ts        Kiểu dữ liệu, kiểm tra form, tìm kiếm và định dạng tiền
src/ui.tsx           Thành phần giao diện và tải ảnh URL bằng expo-image
tests/core.test.mjs   Kiểm thử nghiệp vụ và REST client
data/                Bản sao dữ liệu mẫu từ API để tham khảo/khôi phục thủ công
docs/                Hướng dẫn kiểm thử và giải thích thiết kế
```

Khi mở ứng dụng: đọc cấu hình URL → GET đồng thời courses/categories → nối `courses.categoryId = categories.id` để lấy tên danh mục. Khi chọn khóa học: gọi endpoint chi tiết. Khi lưu: kiểm tra form → GET lại categories để kiểm tra quan hệ → POST/PUT JSON → tải lại hai danh sách. Khi xóa danh mục: kiểm tra danh sách hiện có → xác nhận → GET mới toàn bộ courses → chỉ DELETE nếu không có tham chiếu.

MockAPI không có giao dịch/khóa ngoại đầy đủ. Việc kiểm tra phía ứng dụng đáp ứng đề bài nhưng không đảm bảo tính nguyên tử nếu nhiều thiết bị sửa dữ liệu cùng thời điểm. Khi lỗi tải lại sau ghi, thông báo lỗi được hiển thị và người dùng có thể tải lại; không tự lặp POST để tránh tạo trùng.

## 5. Schema và REST API

`categories`: `id: String` tự sinh, `name: String`, `description: String`.

`courses`: `id: String` tự sinh, `title: String`, `description: String`, `categoryId: String`, `instructor: String`, `price: Number`, `duration: Number`, `thumbnail: String`, `trailerUrl: String`, `createdAt: String`.

| Method             | Endpoint         | Mục đích                      |
| ------------------ | ---------------- | ----------------------------- |
| GET / POST         | /categories      | Lấy danh sách / thêm danh mục |
| PUT / DELETE       | /categories/{id} | Sửa / xóa danh mục            |
| GET / POST         | /courses         | Lấy danh sách / thêm khóa học |
| GET / PUT / DELETE | /courses/{id}    | Chi tiết / sửa / xóa khóa học |

Không bật phân trang ở endpoint danh sách: kiểm tra danh mục cần đọc toàn bộ khóa học. Không tạo nested resource cho hai bảng này. Ưu tiên URL MP4 trực tiếp; form không nhận link trang YouTube vì chưa có trình phát YouTube tương thích.

## 6. Kiểm tra

Xem `docs/KIEM_THU.md` để chạy kịch bản thủ công, kiểm tra chức năng và giới hạn xác minh thực tế. Kiểm thử tự động dùng Node test runner, TypeScript compiler và fetch giả lập; không sửa dữ liệu thật khi chạy `npm test`.

Tài liệu thư viện: [Expo](https://docs.expo.dev/), [expo-video](https://docs.expo.dev/versions/latest/sdk/video/), [MockAPI](https://github.com/mockapi-io/docs/wiki).
