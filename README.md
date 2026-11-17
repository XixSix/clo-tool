# Clove — Hướng dẫn sử dụng

Clove là phần mềm desktop của **Đại học Thành Đông** dùng để **đo lường và đánh giá chuẩn
đầu ra học phần (CLO/PLO)** theo **QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024**.

Ứng dụng chạy **hoàn toàn offline trên máy giảng viên**: không cần mạng, không gửi dữ liệu
sinh viên ra ngoài. Mọi file Excel đọc vào và báo cáo xuất ra đều nằm trên máy bạn.

> **⬇️ [Tải bản mới nhất](https://github.com/XixSix/clo-tool/releases/latest)** &nbsp;·&nbsp;
> **📥 [Hướng dẫn cài đặt](#1-tải-và-cài-đặt)** &nbsp;·&nbsp;
> **❓ [Câu hỏi thường gặp](#7-câu-hỏi-thường-gặp)**

---

## 1. Tải và cài đặt

Tải file mới nhất tại trang **Releases** của dự án.

| Hệ điều hành | File cần tải | Ghi chú |
| :--- | :--- | :--- |
| Windows 10/11 64-bit | **`Clove-<phiên bản>-setup.exe`** | Khuyến nghị — tự cập nhật bản mới |
| Windows (không cần cài) | `Clove-<phiên bản>-portable.exe` | Chạy trực tiếp, **không** tự cập nhật |
| macOS Apple Silicon (M1 trở lên) | `Clove-<phiên bản>-arm64.dmg` | |
| macOS Intel | `Clove-<phiên bản>-x64.dmg` | |

Các file `.zip` và `latest.yml` để ứng dụng tự cập nhật — **không cần tải tay**.

### Cài trên Windows

1. Bấm đúp `Clove-<phiên bản>-setup.exe`.
2. Nếu Windows hiện **"Windows protected your PC"**: bấm **More info** → **Run anyway**.
   Bản cài chưa ký số nên SmartScreen cảnh báo — đây là bình thường.
3. Chọn thư mục cài (mặc định `%LOCALAPPDATA%\Programs\Clove`) → **Install**.
4. Mở **Clove** từ Start Menu hoặc biểu tượng ngoài Desktop.

### Cài trên macOS

1. Mở file `.dmg`, kéo **Clove** vào thư mục **Applications**.
2. Lần đầu mở, nếu macOS báo *"không xác định được nhà phát triển"*: chuột phải vào Clove
   → **Open** → **Open**, hoặc vào **System Settings → Privacy & Security → Open Anyway**.
3. Nếu vẫn bị chặn, chạy trong Terminal:

   ```bash
   xattr -dr com.apple.quarantine /Applications/Clove.app
   ```

### Bản portable (Windows)

Chạy thẳng `Clove-<phiên bản>-portable.exe`, không cần quyền quản trị, không ghi vào Start
Menu. Bản này **không tự cập nhật** — có bản mới phải tải lại.

> **Nâng cấp từ bản cũ:** cứ cài đè bằng `setup.exe` mới. Dữ liệu môn học, cấu hình và
> lịch sử chạy **được giữ nguyên**; không cần gỡ bản cũ trước.

---

## 2. Quy trình đánh giá một học phần

1. **Tạo môn học** — màn **Môn học** → **Thêm môn học**, nhập mã môn, tên môn, số tín chỉ.
2. **Cấu hình học phần** — trong chi tiết môn:
   - thông tin chung và **CLO** (mỗi CLO có nội dung, bậc năng lực, PLO tương ứng);
   - **kế hoạch đánh giá**: đầu điểm, trọng số, câu hỏi và mã đề;
   - **ma trận PLO**.

   Cấu hình đang sửa được **tự lưu nháp** sau mỗi lần thay đổi, kể cả khi còn lỗi — đóng
   app rồi mở lại vẫn tiếp tục từ chỗ cũ. Nút **Lưu cấu hình** chỉ bật khi cấu hình **hết
   lỗi**; lỗi và cảnh báo hiện ngay cạnh trường/bảng tương ứng.
3. **Chuẩn bị file điểm** — bấm **Tạo bộ file mẫu** để sinh `Template_DiemTho.xlsx` rồi
   điền điểm thô vào đó, hoặc dùng file Excel có sẵn đúng cấu trúc cột (mục 3).
4. **Nhập điểm và tính** — chọn file điểm thô, chọn thư mục lưu báo cáo, bấm
   **Tính toán & xuất báo cáo**. Kết quả mỗi lần chạy được lưu vào **Lịch sử** của môn.
5. **Xem báo cáo** — mở file kết quả ngay trong app, hoặc xem thống kê CLO/PLO ở màn
   **Báo cáo**.

---

## 3. File điểm thô cần những cột gì

App **dò tiêu đề theo tên cột**, không theo vị trí; chấp nhận lệch dấu, khoảng trắng và
chữ hoa/thường, và sẽ gợi ý nếu tên cột gần giống.

- Sheet `NHAP_LIEU` (hoặc `NHAP_LIEU_GV`) với các cột: `TT`, `Mã SV`, `Họ`, `Tên`,
  `Ngày sinh`, `Buổi 1..N` (điểm danh), các cột điểm trùng mã đầu điểm/câu hỏi trong
  `CAU_HOI`, `Ghi chú`.
- Giữ **Mã SV ở dạng văn bản** để không mất số `0` ở đầu.
- Ô điểm trống được tính **0 điểm** (đúng Quyết định #9) và có cảnh báo riêng.
- `VT` = **vắng thi cuối kỳ** → 0 điểm cuối kỳ, đánh dấu vắng thi.
- Chấp nhận cả dấu phẩy và dấu chấm thập phân (`2,5` và `2.5`).
- Điểm chuyên cần **tự tính** từ điểm danh: `CC = (Σ hệ số buổi đã diễn ra / số buổi đã
  diễn ra) × 10`.

---

## 4. Báo cáo xuất ra gồm những gì

File `final_grades_report.xlsx`:

| Sheet | Nội dung |
| :--- | :--- |
| `BANG_DIEM_QUA_TRINH` | Phụ lục 3 — bản **Quá trình** (CC + GK), TBC CLO bằng số và bằng chữ |
| `BANG_DIEM_CUOI_KY` | Phụ lục 3 — bản **Cuối kỳ** (CK) |
| `BANG_DIEM_HOC_VU` | Điểm danh từng buổi, số buổi vắng, CC/GK/CK, điểm học phần |
| `CHI_TIET_CLO` | Truy xuất từng ô (đầu điểm, CLO) → CLO → PLO |
| `TONG_HOP_LO` | % đạt CLO/PLO, TB/min/max, 2 biểu đồ, ô đề xuất cải tiến |
| `CANH_BAO` | Lỗi dữ liệu, sinh viên vắng thi/thiếu điểm, CLO dưới ngưỡng |

Biểu đồ trong Excel là **ảnh PNG**; số liệu nguồn nằm trong bảng ngay cạnh biểu đồ.

---

## 5. Dữ liệu lưu ở đâu

| Loại | Vị trí |
| :--- | :--- |
| Danh sách môn, cấu hình, lịch sử chạy | `%APPDATA%\clo-tool` (Windows) · `~/Library/Application Support/clo-tool` (macOS) |
| Bản nháp cấu hình đang sửa | Lưu trên máy, theo từng môn |
| File điểm thô & báo cáo | Thư mục bạn chọn — app không tự xoá |

- **Sao lưu:** sao chép thư mục dữ liệu ở trên là đủ để khôi phục toàn bộ môn học.
- **Gỡ cài đặt:** vào Settings → Apps → Clove. Gỡ cài đặt **không** xoá dữ liệu; muốn xoá
  sạch thì xoá thêm thư mục dữ liệu.

---

## 6. Tuỳ chỉnh giao diện

Trong **Cài đặt**:

- Chuyển nhanh **Sáng / Tối** bằng nút ở góc phải thanh tiêu đề.
- Chọn **bảng màu**: Mặc định, Cappuccino, Night sands, Amber obsidian, Magma obsidian.
  Bảng màu áp cho cả chế độ sáng và tối, thanh tiêu đề đổi màu theo.

---

## 7. Câu hỏi thường gặp

**Windows cảnh báo "Windows protected your PC" khi cài?**
Bản cài chưa ký số. Bấm **More info** → **Run anyway**.

**Mở app chỉ thấy tiến trình trong Task Manager, không thấy cửa sổ?**
Lỗi này có ở bản **1.0.7 trở về trước** trên Windows. Cài đè bằng `setup.exe` từ **1.0.8**
trở đi là hết; dữ liệu vẫn nguyên.

**App có tự cập nhật không?**
Bản cài `setup.exe` tự tải và cài bản mới khi mở app. Bản `portable` phải tải lại tay.

**Không có mạng thì dùng được không?**
Được. Mọi tính toán chạy trên máy; mạng chỉ cần cho bước tự cập nhật.

**Có cần cài Microsoft Excel không?**
Không. App tự đọc/ghi file `.xlsx`.

**Cập nhật phần mềm có mất dữ liệu môn học không?**
Không. Dữ liệu nằm ngoài thư mục cài đặt và được giữ nguyên khi nâng cấp.

**Điểm học phần tính thế nào?**
Theo QĐ 450: **20% chuyên cần + 30% giữa kỳ + 50% cuối kỳ**. Ngưỡng đạt mặc định 4,0 cho
CLO, PLO và học phần; làm tròn half-up theo từng bước.

---

## 8. Phiên bản

Xem lịch sử thay đổi trong [`CHANGELOG.md`](CHANGELOG.md). Bản mới nhất nằm ở mục
**Releases** của kho mã nguồn.
