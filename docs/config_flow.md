# Flow đọc và kiểm tra Config

Phạm vi: từ lúc Main process nhận `configPath` đến lúc trả kết quả cho Renderer. Raw grades, calculator và exporter không nằm trong tài liệu này.

```text
Main IPC → Core parser → Excel utilities → CourseConfig → Core validator → Main IPC response
```

## 1. Main bắt đầu flow

File:

```text
src/main/ipc.ts
```

Handler `config:parse` gọi:

```ts
loadConfig(configPath)
```

Main là application orchestrator. Main không tự đọc từng sheet, map cột hay kiểm tra rule CLO/PLO. Main gọi đúng bước, bắt lỗi và chuyển kết quả thành DTO.

## 2. Main gọi Config parser

`loadConfig()` gọi:

```ts
parseCourseConfig(configPath)
```

File:

```text
src/core/io/configParser/index.ts
```

`parseCourseConfig()` điều phối:

```text
readWorkbook(filePath)
→ HOC_PHAN
→ CLO_LIST
→ KE_HOACH_DANH_GIA
→ CAU_HOI
→ MA_TRAN_PLO
→ DIEM_DANH nếu có
→ QUY_TAC nếu có
→ CourseConfig
```

Parser thành công mới tạo `CourseConfig`.

## 3. Mở file Excel

File:

```text
src/core/utils/excel/workbook.ts
```

Hàm `readWorkbook(filePath)` dùng ExcelJS mở file và trả `ExcelJS.Workbook`.

```text
filePath → readWorkbook() → ExcelJS.Workbook
```

`readWorkbook()` không trả workbook rỗng khi lỗi. Nó throw lỗi lên caller theo chuỗi:

```text
readWorkbook()
  → parseCourseConfig() nhận lỗi và không bắt
  → loadConfig() trong src/main/ipc.ts nhận lỗi
  → loadConfig() catch
  → config:parse trả error cho Renderer
```

`readWorkbook()` không biết Main process, IPC hay Renderer. Nó chỉ throw. Main là nơi cuối cùng bắt lỗi vì `loadConfig()` nằm trong Main.

## 4. Parser lỗi thì dừng trước validator

```text
Không mở được file      → throw
Thiếu sheet bắt buộc    → throw
Không tìm thấy header   → throw
Thiếu cột bắt buộc      → throw
Thiếu dữ liệu bắt buộc  → throw

Parser thất bại
→ không tạo CourseConfig
→ không gọi validateConfig()
```

Lỗi cấu trúc dùng:

```text
src/core/io/configParser/errors.ts
```

```ts
ConfigParseError extends Error
```

Sheet bắt buộc:

```text
HOC_PHAN
CLO_LIST
KE_HOACH_DANH_GIA
CAU_HOI
MA_TRAN_PLO
```

Sheet tuỳ chọn:

```text
DIEM_DANH
QUY_TAC
```

Thiếu `DIEM_DANH` thì trả `undefined`. Thiếu `QUY_TAC` thì dùng `DEFAULT_BUSINESS_RULES`. Sheet tuỳ chọn đã tồn tại nhưng sai header/cột vẫn làm parser throw.

## 5. Dò sheet, header và mapping cột

Utility Excel nằm ở:

```text
src/core/utils/excel/
├── cellValue.ts       # đọc giá trị ô
├── workbook.ts         # mở file, tìm sheet, tìm header
└── headerMatcher.ts    # chuẩn hoá và map tên cột
```

Helper Config nằm ở:

```text
src/core/io/configParser/helpers.ts
```

Flow mỗi sheet:

```text
findSheet()
→ findHeaderRow()
→ matchHeaders()
→ mapping tên cột chuẩn → index cột Excel
→ get()
→ đọc từng dòng
```

Mapping không phụ thuộc vị trí cột. Không map được header hoặc thiếu cột bắt buộc thì `readTable()` throw `ConfigParseError`, không trả mapping rỗng để đọc tiếp.

## 6. `readTable()` làm gì

File:

```text
src/core/io/configParser/helpers.ts
```

Hàm:

```ts
readTable(ws, columns, sheetName)
```

`readTable()` là helper dùng chung cho các parser dạng bảng. Nó không parse riêng nghiệp vụ của sheet. Nó chuẩn bị thông tin để parser đọc dữ liệu.

### Input

```text
ws          = worksheet cần đọc
columns     = danh sách tên cột chuẩn
sheetName   = tên sheet dùng trong thông báo lỗi
```

Ví dụ với `HOC_PHAN`:

```ts
;['Ma_HP', 'Ten_HP', 'So_Tin_Chi', 'Hinh_Thuc_Thi', 'Loai_HP']
```

### Các bước

```text
readTable()
  → findHeaderRow()
  → lấy mapping cột
  → quét các dòng bên dưới header
  → bỏ dòng hoàn toàn rỗng
  → trả headers + rows
```

### Tìm header

`readTable()` gọi `findHeaderRow()`. `findHeaderRow()` quét các hàng đầu sheet và chọn hàng có nhiều tên cột khớp nhất với `columns`.

Ví dụ:

```text
Hàng 1: Học phần: KTLT101
Hàng 2: Người nhập: Nguyễn Văn A
Hàng 3: Mã HP | Tên HP | Số tín chỉ | Hình thức thi | Loại HP
```

Hàng 3 được chọn làm header.

### Kiểm tra cột

Nếu không tìm thấy header:

```text
readTable() → throw ConfigParseError
```

Nếu header có nhưng thiếu cột bắt buộc:

```text
readTable() → throw ConfigParseError
```

Không còn hành vi cũ là push `ValidationIssue` rồi trả `headers: {}`.

Lý do: thiếu mapping khiến parser không thể tạo dữ liệu đáng tin cậy. Đây là lỗi cấu trúc, không phải lỗi nghiệp vụ để validator gom.

### Lấy dòng dữ liệu

Sau header, `readTable()` quét các dòng còn lại. Dòng có ít nhất một ô khác rỗng được đưa vào `rows`.

Kết quả:

```ts
{
  headers: {
    Ma_HP: 0,
    Ten_HP: 1,
    So_Tin_Chi: 2
  },
  rows: [4, 5, 6]
}
```

`headers` dùng index 0-based. `rows` dùng số dòng Excel 1-based.

Parser sau đó gọi:

```ts
get(ws, rowNumber, headers, 'Ma_HP')
```

`get()` lấy đúng ô theo mapping và trả text đã đọc bởi `cellText()`.

## 7. Parser từng sheet

```text
src/core/io/configParser/hocPhanParser.ts
src/core/io/configParser/cloListParser.ts
src/core/io/configParser/keHoachParser.ts
src/core/io/configParser/cauHoiParser.ts
src/core/io/configParser/maTranPloParser.ts
src/core/io/configParser/diemDanhParser.ts
src/core/io/configParser/quyTacParser.ts
```

Mapping kết quả:

```text
HOC_PHAN          → courseInfo
CLO_LIST          → cloList
KE_HOACH_DANH_GIA → keHoachDanhGia
CAU_HOI           → cauHoi
MA_TRAN_PLO       → maTranPlo
DIEM_DANH         → diemDanh
QUY_TAC           → quyTac
```

Parser chỉ đọc và chuyển dữ liệu:

- đọc text ô;
- chuyển chuỗi số thành `number`;
- ô trống thành giá trị tuỳ chọn phù hợp;
- mã đề trống thành `ALL`;
- dựng object theo type Core.

Parser không kiểm tra đầy đủ nghiệp vụ QĐ450.

### `HOC_PHAN`

File:

```text
src/core/io/configParser/hocPhanParser.ts
```

Sheet bắt buộc. Parser làm các bước:

```text
findSheet('HOC_PHAN')
→ readTable()
→ lấy dòng dữ liệu đầu tiên
→ đọc Ma_HP
→ đọc Ten_HP
→ parseNumber(So_Tin_Chi)
→ đọc Hinh_Thuc_Thi
→ đọc Loai_HP
→ trả CourseInfo
```

Kết quả:

```ts
{
  ;(maHp, tenHp, soTinChi, hinhThucThi, loaiHp)
}
```

Sheet không có, thiếu header/cột hoặc không có dòng dữ liệu → throw `ConfigParseError`.

Parser không kiểm tra ở đây các rule như tín chỉ phải là số nguyên hay loại học phần có thuộc enum hợp lệ không. Các rule đó thuộc `hocPhanValidator.ts`.

### `CLO_LIST`

File:

```text
src/core/io/configParser/cloListParser.ts
```

Sheet bắt buộc. Parser đọc tất cả dòng có dữ liệu:

```text
findSheet('CLO_LIST')
→ readTable()
→ lặp từng dòng
→ đọc Ma_CLO
→ đọc Noi_Dung
→ đọc Bac_Nang_Luc
→ parseNumber(Trong_So_CLO)
→ tạo CLODefinition
```

Dòng không có `Ma_CLO` được bỏ qua vì không xác định được bản ghi CLO.

Kết quả:

```ts
CLODefinition[]
```

Parser chỉ chuyển `Trong_So_CLO` thành số. Nó không kiểm tra tổng trọng số, format `CLO1`, bậc năng lực hay CLO bị trùng. Việc đó thuộc `cloListValidator.ts`.

### `KE_HOACH_DANH_GIA`

File:

```text
src/core/io/configParser/keHoachParser.ts
```

Sheet bắt buộc. Parser đọc:

```text
Nhom
Thanh_Phan
Ma_Dau_Diem
CLO
Trong_So_Phan_Tram
Hinh_Thuc
```

Flow:

```text
findSheet('KE_HOACH_DANH_GIA')
→ readTable()
→ lặp từng dòng
→ chuẩn hoá Nhom thành uppercase
→ đọc Ma_Dau_Diem và CLO
→ parseNumber(Trong_So_Phan_Tram)
→ đọc Hinh_Thuc
→ tạo EvaluationPlanItem
```

Dòng không có cả `Ma_Dau_Diem` và `CLO` được bỏ qua.

Parser không quyết định tổng phần trăm có bằng 100%, nhóm có phải `CC/GK/CK`, hay đầu điểm có bị dùng trùng nhóm không. Các rule đó thuộc `keHoachValidator.ts`.

### `CAU_HOI`

File:

```text
src/core/io/configParser/cauHoiParser.ts
```

Sheet bắt buộc. Parser đọc:

```text
Ma_Cot_Diem
Ma_Dau_Diem
Cau
CLO
Diem_Toi_Da
Ma_De
Loai
```

Flow:

```text
findSheet('CAU_HOI')
→ readTable()
→ lặp từng dòng
→ đọc mã cột điểm, mã đầu điểm, câu và CLO
→ parseNumber(Diem_Toi_Da)
→ Ma_De rỗng thành ALL
→ Loai được đổi thành TN/TL hoặc undefined
→ tạo QuestionColumn
```

Dòng không có cả `Ma_Cot_Diem` và `Ma_Dau_Diem` được bỏ qua.

Parser không kiểm tra câu trùng, cột điểm dùng đè, tổng điểm đề bằng 10 hay CLO có được khai báo đúng không. Các rule đó thuộc `cauHoiValidator.ts` và `crossSheetValidator.ts`.

### `MA_TRAN_PLO`

File:

```text
src/core/io/configParser/maTranPloParser.ts
```

Sheet hiện được xem là bắt buộc trong flow Config. Parser đọc:

```text
PLO
PI
CLO
```

Flow:

```text
findSheet('MA_TRAN_PLO')
→ readTable()
→ lặp từng dòng
→ đọc PLO, PI, CLO
→ tạo PLOMapping
```

Dòng thiếu `PLO` hoặc `CLO` được bỏ qua.

Parser không kiểm tra CLO tham chiếu có tồn tại, PLO có hợp lệ hay mapping có bị trùng. Các rule đó thuộc `maTranPloValidator.ts` và `crossSheetValidator.ts`.

### `DIEM_DANH`

File:

```text
src/core/io/configParser/diemDanhParser.ts
```

Sheet tuỳ chọn. Nếu không có sheet:

```ts
diemDanh = undefined
```

Nếu có sheet:

```text
findSheet('DIEM_DANH')
→ readTable()
→ lặp từng dòng
→ đọc Ky_Hieu
→ parseNumber(He_So)
→ đọc Dien_Giai
→ tạo AttendanceRule
```

Dòng không có `Ky_Hieu` được bỏ qua. Nếu sheet tồn tại nhưng sai header/cột, parser throw. Nếu sheet rỗng, kết quả là `undefined`.

Parser không kiểm tra hệ số có nằm trong khoảng hợp lệ, ký hiệu có trùng hay không. Việc đó thuộc `diemDanhValidator.ts`.

### `QUY_TAC`

File:

```text
src/core/io/configParser/quyTacParser.ts
```

Sheet tuỳ chọn. Nếu không có sheet, parser tạo bản sao:

```ts
{ ...DEFAULT_BUSINESS_RULES }
```

Nếu có sheet:

```text
findSheet('QUY_TAC')
→ readTable()
→ bắt đầu từ DEFAULT_BUSINESS_RULES
→ lặp từng dòng
→ đọc Ma_Quy_Tac và Gia_Tri
→ ghi đè các key được hỗ trợ
→ trả BusinessRules
```

Các giá trị số dùng `parseNumber()`. Các giá trị boolean dùng `parseBoolean()`. Các enum được nhận diện khi parse; rule về khoảng và tính hợp lệ cuối cùng thuộc `quyTacValidator.ts`.

## 8. Parser tạo CourseConfig

Khi tất cả parser thành công:

```ts
const config: CourseConfig = {
  courseInfo,
  cloList,
  keHoachDanhGia,
  cauHoi,
  maTranPlo,
  diemDanh,
  quyTac
}
```

Kết quả parser:

```ts
{
  config,
  issues: [],
  hasErrors: false
}
```

Lỗi cấu trúc không còn được gom vào `issues`; nó throw ngay.

## 9. Main gọi validator

Sau khi parser thành công, `loadConfig()` gọi:

```ts
const issues = [...parsed.issues, ...validateConfig(parsed.config)]
```

Facade:

```text
src/core/validator/index.ts
```

Validator con:

```text
validateHocPhan
validateCloList
validateKeHoach
validateCauHoi
validateMaTranPlo
validateDiemDanh
validateQuyTac
validateCrossSheet
```

Validator nhận `CourseConfig`, không đọc Excel.

## 10. Validator gom lỗi nghiệp vụ

Validator kiểm tra:

- required business value;
- enum và khoảng giá trị;
- tổng trọng số;
- kế hoạch đánh giá;
- câu hỏi và mã cột điểm;
- tham chiếu CLO/PLO giữa sheet;
- tổng điểm tối đa của đề;
- rule QĐ450.

Mỗi validator trả `ValidationIssue[]`. `validateConfig()` nối toàn bộ mảng lỗi. Validator không throw cho lỗi nghiệp vụ thông thường, để user thấy nhiều lỗi trong một lần kiểm tra.

```text
Validator con → ValidationIssue[]
→ validateConfig() → ValidationIssue[] tổng
```

## 11. Main xử lý hai loại lỗi

### Lỗi đọc file hoặc lỗi cấu trúc parser

```text
readWorkbook() / parser throw
→ loadConfig() catch
→ không có config
→ không gọi validator
→ trả error:string
```

Kết quả `config:parse`:

```ts
{
  ok: false,
  filePath,
  cloList: [],
  planCount: 0,
  totalWeight: 0,
  ploCount: 0,
  issues: [],
  hasErrors: true,
  error
}
```

### Lỗi nghiệp vụ

```text
Parser thành công
→ tạo CourseConfig
→ validator chạy hết
→ gom ValidationIssue[]
```

Kết quả:

```ts
{
  config,
  issues,
  error: undefined
}
```

## 12. Main tạo response cho Renderer

`src/main/ipc.ts` dùng `toIssueDto()` đổi `ValidationIssue` thành `IssueDto`, sau đó trả `ConfigSummaryDto`.

```text
CourseConfig + ValidationIssue[]
→ ConfigSummaryDto
→ Renderer
```

Trong response:

```text
ok         = file đã mở và parser thành công
hasErrors  = validator phát hiện error
issues     = lỗi/cảnh báo nghiệp vụ
error      = lỗi đọc file hoặc lỗi parser
```

`ok: true` và `hasErrors: true` là trạng thái có thể xảy ra: file đọc được, nhưng Config sai nghiệp vụ.

## 13. Sơ đồ tổng hợp

```text
src/main/ipc.ts
  loadConfig(configPath)
      ↓
src/core/io/configParser/index.ts
  parseCourseConfig(configPath)
      ↓
src/core/utils/excel/workbook.ts
  readWorkbook(filePath)
      ↓
src/core/io/configParser/*.ts
  parse từng sheet
      ↓
CourseConfig
      ↓
src/core/validator/index.ts
  validateConfig(config)
      ↓
ValidationIssue[]
      ↓
src/main/ipc.ts
  toIssueDto() + ConfigSummaryDto
      ↓
Renderer
```

## Nguyên tắc chốt

```text
readWorkbook lỗi        → throw, stop
Parser cấu trúc lỗi     → throw, stop
Parser thành công       → tạo CourseConfig
Validator lỗi nghiệp vụ → gom ValidationIssue
Validator xong          → Main quyết định trả UI hoặc chặn pipeline
```

Project có dependency `zod`, nhưng hiện chưa dùng Zod/Joi để validate DTO. Flow hiện tại dùng TypeScript type, parser và validator thủ công.
