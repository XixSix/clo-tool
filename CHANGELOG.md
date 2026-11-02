# Changelog

Mọi thay đổi đáng chú ý của phần mềm được ghi ở đây. Định dạng theo
[Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo
[Semantic Versioning](https://semver.org/lang/vi/).

## [1.0.1] - 2026-11-02

### Thêm

- Tự cập nhật trong app (electron-updater): kiểm tra bản mới khi khởi động, tải ngầm và
  cho phép khởi động lại để cài bản mới.
- Card "Cập nhật phần mềm" trong Cài đặt: hiển thị phiên bản hiện tại, trạng thái kiểm tra/tải.
- Chọn nhanh học kỳ (Học kì 1 / Học kì 2 / Khác) khi thêm môn học.

### Thay đổi

- Tách nhỏ toàn bộ màn hình lớn (Trang chủ, Môn học, Sinh viên, Báo cáo, Nhập điểm) và app shell
  thành các module riêng theo chức năng; không đổi giao diện hay hành vi.
- Dùng chung `ConfirmDialog` cho xoá môn học và xoá toàn bộ dữ liệu.
- Phiên bản trong Cài đặt lấy động từ `package.json` thay vì hardcode.

### Sửa

- Menu thả xuống trong thẻ môn học không mở được (nút thiếu `forwardRef`).

## [1.0.0] - 2026-10-29

- Bản đầu tiên: nhập điểm, tính CLO/PLO theo QĐ 450, báo cáo Excel/PDF, quản lý nhiều môn.
