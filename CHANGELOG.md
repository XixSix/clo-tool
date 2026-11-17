# Changelog

Mọi thay đổi đáng chú ý của phần mềm được ghi ở đây. Định dạng theo
[Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo
[Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

## [1.0.8] - 2026-11-17

### Sửa

- **Ứng dụng mở nhưng không hiện cửa sổ** trên Windows (chỉ thấy tiến trình trong Task
  Manager). Nguyên nhân: Electron không phát khung hình đầu cho cửa sổ ẩn khi dùng thanh
  tiêu đề tuỳ biến, nên sự kiện `ready-to-show` không bao giờ chạy. Nay cửa sổ được hiện
  ngay khi trang tải xong, `ready-to-show` chỉ còn là đường tắt.

## [1.0.7] - 2026-11-17

### Thêm

- **Logo Đại học Thành Đông** làm biểu tượng ứng dụng (exe, taskbar, bộ cài) và hiển thị
  trong sidebar cùng góc phải thanh tiêu đề.
- **Bảng màu giao diện** trong Cài đặt: Mặc định, Cappuccino, Night sands, Amber obsidian,
  Magma obsidian; áp cho cả chế độ Sáng/Tối và đổi màu thanh tiêu đề theo bảng màu.
- Thanh cuộn mảnh, tự đổi độ đậm theo nền sáng/tối.

### Sửa

- Tên hiển thị thống nhất **Clove** ở tiêu đề cửa sổ, sidebar, báo cáo in và tài liệu.
- Cảnh báo CLO thiếu nội dung / thiếu bậc năng lực gọn hơn, bỏ tiền tố `CLO` bị lặp.

## [1.0.6] - 2026-11-16

### Thêm

- Màn **Học phần** được làm lại: ba tab cấp cao Thông tin & CLO / Kế hoạch & Đề thi /
  Ma trận PLO, thanh Lưu cố định, lỗi và cảnh báo hiển thị ngay cạnh trường/bảng kèm bảng
  tóm tắt toàn bộ vấn đề của cấu hình.
- **Bản nháp cấu hình môn** tự lưu trên máy sau mỗi lần sửa, kể cả khi cấu hình còn lỗi;
  mở lại màn sẽ tiếp tục từ bản nháp, còn nút Lưu chỉ ghi cấu hình chính thức khi hết lỗi.
- Màn **Lịch sử** trong sidebar xem lịch sử chạy của mọi môn.
- Modal thêm môn kiểm tra lỗi ngay khi nhập và cảnh báo mã môn trùng.

### Sửa

- File điểm thô hai giai đoạn: parser nhận đúng cột Họ/Tên tách riêng, cột `Mã đề` chỉ bắt
  buộc ở giai đoạn cuối kỳ.
- Không còn ghi file build `tsconfig.node.tsbuildinfo` vào kho mã nguồn.

### Bỏ

- **Nhập cấu hình từ Excel**: gỡ `Template_Config.xlsx` và đường IPC `config:parse`; cấu
  hình học phần chỉ khai báo trong app.
- **Kiểm định đề thi / psychometrics**: gỡ độ khó p, độ phân biệt d, Cronbach α, báo cáo
  `exam_analysis_report.xlsx` cùng màn hình/nút xuất tương ứng. Ứng dụng chỉ còn tính điểm
  CLO/PLO theo QĐ450 (xem `AGENTS.md`, mục "Tính năng đã bị loại bỏ").

## [1.0.5] - 2026-11-12

### Thêm

- **Nhập điểm 2 giai đoạn** (tùy chọn): giai đoạn quá trình nhập CC/GK và xuất báo cáo
  quá trình để duyệt; giai đoạn cuối kỳ nhập CK (kèm Mã đề khi có nhiều đề), ghép với dữ
  liệu quá trình theo Mã SV rồi tính lại toàn bộ CLO/PLO, điểm học phần và phân tích đề thi.
- Template điểm thô riêng `Template_DiemTho_QuaTrinh.xlsx` (CC/GK + điểm danh) và
  `Template_DiemTho_CuoiKy.xlsx` (CK + Mã đề), đi kèm nút tạo file mẫu.
- Snapshot lần chạy quá trình được lưu lại để mở app sau vẫn chạy tiếp được giai đoạn cuối kỳ.

### Sửa

- File điểm thô có thể thiếu cột của giai đoạn còn lại: parser chỉ đòi cột bắt buộc theo
  giai đoạn, cột `Mã đề` là tùy chọn trừ khi Config có nhiều đề CK.
- `Mã đề` của câu hỏi CK giờ được đọc và kiểm tra đúng (trước đây bị bỏ qua do thiếu cột).

## [1.0.4] - 2026-11-10

### Sửa

- Job build macOS: cài bổ sung binary `@napi-rs/canvas` cho kiến trúc còn lại bằng
  `npm install --force` (npm mặc định chặn cài chéo os/cpu), nhờ đó đóng gói được cả
  `arm64` và `x64`. Bản 1.0.3 chỉ phát hành được file Windows vì bước này lỗi.

## [1.0.3] - 2026-11-10

### Thêm

- Hỗ trợ **macOS**: build GitHub Actions trên `macos-latest` cho cả Apple Silicon (`arm64`)
  và Intel (`x64`), phát hành `.dmg` (cài tay) và `.zip` (tự cập nhật) kèm `latest-mac.yml`.
- Script `npm run build:mac` để build macOS tại máy.

### Ghi chú

- Bản macOS chưa ký số/notarize: lần mở đầu phải chuột phải → **Open**, và tự cập nhật chỉ
  hoạt động sau khi có Apple Developer ID.

## [1.0.2] - 2026-11-10

### Thay đổi

- Chuẩn hoá bộ đọc/kiểm tra Config: mỗi sheet một parser/validator riêng, validator nhận đúng
  dữ liệu cần thay vì cả `CourseConfig`.
- Tách bộ đọc điểm thô thành các bước riêng (header, meta, điểm danh, điểm tối đa, sinh viên)
  và validator điểm thô thành các nhóm rule độc lập.
- Thứ tự xử lý file điểm thô: đọc → kiểm tra → mới tính điểm chuyên cần.

### Sửa

- Cột chỉ "gần giống" tên chuẩn không còn bị coi là đã tìm thấy, chỉ dùng làm gợi ý sửa tên.

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
