# Hướng dẫn kiểm thử

Sinh viên: **Đào Xuân Thành_BIT240215**.

## Kiểm tra tự động

```bash
npm ci
npm run typecheck
npm test
npm run check:api
npm run export:android
```

`npm test` có 10 ca nghiệp vụ/REST client: trường bắt buộc, học phí 0/âm/không hợp lệ, thời lượng, danh mục sai, URL sai, tìm kiếm kết hợp lọc, method và JSON body, chặn xóa danh mục có khóa học, kiểm tra lại dữ liệu trước xóa và lỗi API.

`npm run check:api` chỉ đọc API thật, xác minh số mẫu, quan hệ danh mục và endpoint chi tiết.

Lệnh kiểm thử ghi thực tế (tự tạo và tự xóa bản ghi riêng, không sửa khóa học sẵn có):

```bash
node scripts/check-api.mjs --write
```

Nếu kết nối mất trong lúc dọn dữ liệu, kiểm tra và xóa các bản ghi có tiền tố `KIEM_THU_BIT240215` do script tạo. Không chạy song song nhiều lần. Sao lưu dữ liệu mẫu bằng `node scripts/check-api.mjs --snapshot`.

## Kịch bản kiểm thử thủ công trên điện thoại

| Bước | Thao tác                                   | Kết quả mong đợi                                                    |
| ---- | ------------------------------------------ | ------------------------------------------------------------------- |
| 1    | Mở ứng dụng với mạng hoạt động             | Hiện loading rồi dữ liệu API; ban đầu 10 khóa học, 3 danh mục       |
| 2    | Tìm `lap trinh` hoặc `ANDROID`             | Tìm theo tiêu đề, không phân biệt dấu/hoa thường                    |
| 3    | Chọn danh mục và giữ từ khóa               | Kết hợp cả hai điều kiện                                            |
| 4    | Nhập từ không có kết quả                   | Hiện danh sách rỗng rõ ràng                                         |
| 5    | Mở khóa học                                | Lấy chi tiết từ GET /courses/{id}, đủ trường và tên danh mục        |
| 6    | Xem trailer                                | Video phát trong ứng dụng; tạm dừng, kéo thời gian và toàn màn hình |
| 7    | Đóng trailer, quay về                      | Video được giải phóng khi component unmount                         |
| 8    | Thêm mới, để form trống và lưu             | Báo lỗi tại các trường                                              |
| 9    | Nhập học phí -1 hoặc thời lượng 0          | Không gửi POST                                                      |
| 10   | Nhập URL ảnh hợp lệ                        | Hiện xem trước; URL ảnh lỗi hiện thông báo thay thế                 |
| 11   | Điền đủ trường, chọn danh mục, lưu         | POST thành công, mở chi tiết và tải lại danh sách                   |
| 12   | Sửa mọi trường gồm danh mục/ảnh/trailer    | PUT thành công, hiển thị dữ liệu mới, giữ ngày tạo                  |
| 13   | Xóa khóa học, chọn Hủy                     | Dữ liệu giữ nguyên                                                  |
| 14   | Xóa khóa học vừa tạo, xác nhận             | DELETE thành công, danh sách cập nhật                               |
| 15   | Thêm, sửa danh mục mới                     | Danh sách và Picker khóa học dùng dữ liệu mới                       |
| 16   | Xóa danh mục có khóa học                   | Chặn xóa với thông báo rõ ràng                                      |
| 17   | Xóa danh mục thử không có khóa học         | Xác nhận rồi GET kiểm tra trước DELETE                              |
| 18   | Tắt mạng, kéo xuống tải lại                | Hiện lỗi và nút thử lại; không thay bằng dữ liệu hardcode           |
| 19   | Bật mạng, thử lại                          | Tải được dữ liệu                                                    |
| 20   | Mở ⚙ API, nhập link quản trị thay Base URL | Báo lỗi, không lưu cấu hình sai                                     |

## Phạm vi xác minh

Kết quả thực tế của phiên xây dựng được ghi ở `KET_QUA_KIEM_TRA.md`. Export Android kiểm tra bundle JavaScript/assets, **không tương đương cài/chạy APK trên thiết bị**. Cần chạy các bước trên bằng Expo Go/Android Emulator trước khi quay video nộp bài.

## Gợi ý trình bày khi tự quay video

Giới thiệu họ tên/MSSV → project MockAPI, schema hai resource → chạy ứng dụng → tìm/lọc → chi tiết và trailer → thêm/sửa/xóa khóa học → CRUD danh mục và chặn xóa khi đang có khóa học → giải thích `api.ts`, JSON body, categoryId và các trạng thái lỗi. Đây là hướng dẫn tham khảo, không phải video đã thực hiện.
