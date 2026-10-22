# CLO/PLO Evaluator — Đại học Thành Đông

Phần mềm desktop (Electron + React + TypeScript) đo lường và đánh giá chuẩn đầu ra học phần
theo **QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024**. Ứng dụng chạy **offline 100%**, không gửi dữ liệu ra ngoài.

> Trạng thái: đã xong **Tuần 0–2** (core engine, đọc/ghi Excel, thống kê đề thi, xuất báo cáo)
> và một **giao diện thử nghiệm** một màn hình để chạy trọn quy trình.

---

## 1. Chạy thử nhanh (khuyến nghị)

```bash
npm install
npm run dev
```

Trong cửa sổ ứng dụng:

1. Bấm **“Tạo bộ file mẫu”** → chọn một thư mục bất kỳ (ví dụ `D:\clo-test`).
2. App tự tạo và nạp sẵn:
   - `Template_Config.xlsx` — cấu hình học phần KTLT101
   - `Template_DiemTho.xlsx` — điểm thô 32 sinh viên + 12 buổi điểm danh
3. Bấm **“Chọn thư mục lưu báo cáo”** (có thể chọn cùng thư mục trên).
4. Bấm **“Tính toán & xuất báo cáo”**.
5. Mở 2 file kết quả ngay trong app:
   - `final_grades_report.xlsx`
   - `exam_analysis_report.xlsx`

Nếu đã có file thật, bỏ qua bước “Tạo bộ file mẫu” và chọn trực tiếp file Config + file điểm thô.

### Chạy demo bằng dòng lệnh (không cần mở app)

```bash
npm run demo
```

Kết quả nằm trong `out/demo/`:

| File                        | Nội dung                                                     |
| :-------------------------- | :----------------------------------------------------------- |
| `Template_Config.xlsx`      | Config mẫu 7 sheet + sheet hướng dẫn                          |
| `Template_DiemTho.xlsx`     | Điểm thô mẫu (điểm danh, CC, TD, KT3, KT4, CK)                |
| `final_grades_report.xlsx`  | Bảng điểm CLO/PLO, điểm học vụ, chi tiết, tổng hợp, cảnh báo |
| `exam_analysis_report.xlsx` | p, d, Cronbach α, gợi ý cải tiến                              |

Sinh lại file mẫu đi kèm app:

```bash
npm run gen:templates
```

---

## 2. Kiểm thử & kiểm tra chất lượng

```bash
npm test          # 67 test: công thức QĐ450, psychometrics, parser, e2e
npm run typecheck # TypeScript toàn bộ main/preload/renderer/core
npm run lint      # ESLint
npm run build     # Build production (electron-vite)
```

---

## 3. Dữ liệu mock đang dùng

Học phần **KTLT101 – Kỹ thuật lập trình**, 3 tín chỉ, 3 CLO:

| Nhóm | Đầu điểm | CLO   | Trọng số |
| :--- | :------- | :---- | -------: |
| CC   | CC       | CLO2  |       5% |
| CC   | CC       | CLO3  |       5% |
| CC   | TD       | CLO4  |      10% |
| GK   | KT3      | CLO3  |      15% |
| GK   | KT4      | CLO4  |      15% |
| CK   | CK (3 câu) | CLO2/CLO3/CLO4 | 20% / 15% / 15% |

- 32 sinh viên, 12 buổi điểm danh (`X`, `OL`, `M`, `V-CP`, `V`).
- Ca biên được cố ý đưa vào: Mã SV bắt đầu bằng `0`, 1 SV vắng thi cuối kỳ (`VT`),
  1 SV còn ô điểm trống, điểm lẻ `0,25`, ô gộp và dấu phẩy thập phân.
- Điểm chuyên cần **tự tính** từ điểm danh:
  `CC = (Σ hệ số buổi đã diễn ra / số buổi đã diễn ra) × 10`.

> Toàn bộ số liệu là **mock**, không phải điểm thật của sinh viên.

---

## 4. Nội dung các sheet xuất ra

`final_grades_report.xlsx`:

| Sheet               | Nội dung                                                                 |
| :------------------ | :----------------------------------------------------------------------- |
| `BANG_GHI_DIEM_CLO` | Phụ lục 3 – bản **Quá trình** (CC + GK), TBC CLO bằng số và bằng chữ      |
| `BANG_GHI_DIEM_CK`  | Phụ lục 3 – bản **Cuối kỳ** (CK)                                          |
| `BANG_DIEM_HOC_VU`  | Điểm danh từng buổi, số buổi vắng, CC/GK/CK, điểm học phần                |
| `CHI_TIET_CLO`      | Truy xuất từng ô (đầu điểm, CLO) → CLO → PLO                              |
| `TONG_HOP_LO`       | % đạt CLO/PLO, TB/min/max, 2 biểu đồ PNG, ô đề xuất cải tiến              |
| `CANH_BAO`          | Lỗi dữ liệu, SV vắng thi/thiếu điểm, CLO dưới ngưỡng                      |

`exam_analysis_report.xlsx`:

| Sheet            | Nội dung                                                       |
| :--------------- | :------------------------------------------------------------- |
| `P_D_TUNG_CAU`   | Độ khó `p`, độ phân biệt `d`, mức độ, α nếu bỏ câu, cảnh báo   |
| `DO_TIN_CAY`     | Cronbach α theo từng đợt / mã đề, cảnh báo cỡ mẫu              |
| `GOI_Y_CAI_TIEN` | 5 câu hỏi định hướng cải tiến + độ phủ CLO                     |

---

## 5. Dùng dữ liệu thật

Chỉ cần file Excel đúng cấu trúc cột như file mẫu. App dò tiêu đề theo **tên cột**
(không theo vị trí), chấp nhận lệch dấu/khoảng trắng/hoa thường và sẽ gợi ý nếu tên cột gần giống.

- **Config**: 7 sheet `HOC_PHAN`, `CLO_LIST`, `KE_HOACH_DANH_GIA`, `CAU_HOI`,
  `MA_TRAN_PLO`, `DIEM_DANH`, `QUY_TAC`. Xem sheet `HUONG_DAN` trong file mẫu.
- **Điểm thô**: sheet `NHAP_LIEU` hoặc `NHAP_LIEU_GV`, có các cột `TT`, `Mã SV`, `Họ`, `Tên`,
  `Ngày sinh`, `Buổi 1..N`, các cột điểm trùng mã với `CAU_HOI`, `Ghi chú`.
- Giữ **Mã SV ở dạng văn bản** để không mất số `0` đầu.
- Ô trống = chưa nhập; `VT` = vắng thi; chấp nhận cả `2,5` và `2.5`.

---

## 6. Cấu trúc thư mục

```
src/
  core/               # Engine thuần TypeScript, không import Electron/React
    types/            # Kiểu dữ liệu theo miền (course, student, result, …)
    io/               # Đọc Config / điểm thô, sinh template Excel
    calculator/       # Điểm ô → CLO → nhóm → điểm học phần, thống kê lớp
    exporter/         # Xuất Excel + biểu đồ PNG
    attendance.ts     # Điểm chuyên cần từ ký hiệu điểm danh
    validator.ts      # Mục V – kiểm tra hợp lệ dữ liệu
    psychometrics.ts  # p, d, α, α nếu bỏ câu
  main/               # Electron main + IPC xử lý file
  preload/            # Cầu nối an toàn ra window.api
  renderer/           # Giao diện React
  shared/             # DTO dùng chung main ↔ renderer
resources/templates/  # Template_Config.xlsx, Template_DiemTho.xlsx
scripts/              # demo.ts, gen-templates.ts
tests/                # Vitest (golden QĐ450, psychometrics, io, e2e)
docs/                 # Đặc tả & kế hoạch
```

---

## 7. Quyết định nghiệp vụ đang áp dụng

- **#1**: `hp_method = QD450` (điểm học phần = 20% CC + 30% GK + 50% CK).
- **#7**: CLO chỉ được đo bằng chuyên cần/thái độ → **cảnh báo**, không chặn tính điểm.
- Ngưỡng đạt mặc định: CLO = 4,0; PLO = 4,0; học phần = 4,0 (đổi trong sheet `QUY_TAC`).
- Làm tròn half-up từng bước (`rounding_mode = chain`) bằng `decimal.js`.
- Cronbach α: `≤ 0,60` là **Không đủ độ tin cậy**; đề chỉ có 1 câu sẽ ghi chú “không tính được α”.

---

## 8. Ghi chú / giới hạn hiện tại

- Giao diện mới là **một màn hình chạy trọn quy trình**, chưa có bảng preview sửa ô trực tiếp
  và chưa có thanh tab (dự kiến Tuần 3).
- Biểu đồ trong Excel là **ảnh PNG** (ExcelJS không tạo chart gốc); số liệu nguồn vẫn nằm
  trong bảng cạnh biểu đồ.
- Chưa đóng gói `.exe` (Tuần 4). Chạy bằng `npm run dev` hoặc `npm run build`.
