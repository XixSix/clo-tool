# CHECKLIST ĐỌC CODE THEO DÒNG CHẢY DỮ LIỆU

> Duyệt code theo thứ tự pipeline thật: **parse → validate → điểm danh → tính điểm → psychometrics → export → cầu Electron**.
> Mỗi mục: file + những gì cần soi. Đọc mục nào tích mục đó.

## Sơ đồ dòng chảy (học thuộc trước khi đọc)

```text
Template_Config.xlsx ─parse→ CourseConfig ─validate→ issues (error/warning)
Template_DiemTho.xlsx ─parse→ RawGradesFile ─validate→ applyAttendance → students[]
        │
        └→ calculateEvaluation(config, students)
              cellScores s(j,k) → điểm SV từng CLO → điểm nhóm CC/GK/CK
              → TBC CLO → Điểm HP (QD450) → PLO → summary cả lớp
        └→ calculateAllExamPsychometrics (p / d / α theo từng đề)
        └→ exporter → final_grades_report.xlsx + exam_analysis_report.xlsx

IPC: config:parse → raw:parse → pipeline:run (CHẶN CỨNG khi điểm thô còn lỗi)
```

## Pha 0 — Bản đồ tổng

- [ ] `docs/ke_hoach_dac_ta_clo_plo.md` — mục VI (dòng chảy) + **mục VII: Quyết định #1–#12** (mọi con số/liệu quyết có nguồn ở đây)
- [x] `src/core/index.ts` — facade, mọi public API của `@core`

## Pha 1 — Types (khâu giao kèo giữa các module)

- [x] `src/core/types/course.ts` — CourseConfig, QuestionColumn (maDe/loai tuỳ chọn), BusinessRules, EvaluationPlanItem
- [x] `src/core/types/student.ts` — RawStudentRow (maSv dạng văn bản giữ số 0 đầu, maDe?, diemCacCot = number | 'VT' | null)
- [ ] `src/core/types/validation.ts` — ValidationIssue, ParseResult<T></t>, ConfigParseResult, RawGradesFile
- [ ] `src/core/types/result.ts` — CellScoreDetail, ProcessedStudentResult (shape kết quả này quyết định mọi thứ phía dưới)
- [ ] `src/core/types/psychometrics.ts` — ExamPsychometrics / ItemPsychometrics

## Pha 2 — Tiện ích Excel (nền cho cả hai bước parse)

- [x] `src/core/utils/excel/cellValue.ts` — **⚠️ có lỗi đã ghi nhận trong `note.txt`: `parseNumber` nuốt im lặng cả ô trống lẫn gõ sai ("6a") → đều trả null → `??` về mặc định không một cảnh báo**
- [x] `src/core/utils/excel/workbook.ts` — mở/ghi workbook, dò sheet theo tên, dò hàng tiêu đề
- [x] `src/core/utils/excel/headerMatcher.ts` — dò tiêu đề theo TÊN cột, gợi ý tên gần giống khi lệch

## Pha 3 — Parse Config (`io/configParser/` — mỗi sheet một file, đồng bộ với validator)

- [ ] `helpers.ts` — `get`, `readTable` (thiếu cột → lỗi + gợi ý tên gần), `CONFIG_SHEET_COLUMNS`
- [ ] `hocPhanParser.ts` → `cloListParser.ts` → `keHoachParser.ts` → `cauHoiParser.ts` (maDe trống → 'ALL', loai lạ → undefined) → `maTranPloParser.ts` → `diemDanhParser.ts` (sheet tuỳ chọn) → `quyTacParser.ts` (merge DEFAULT_BUSINESS_RULES, key lạ → warning)
- [ ] `index.ts` — orchestrator: thứ tự 7 parser, thiếu sheet → lỗi văn bản giữ nguyên

## Pha 4 — Parse điểm thô

- [ ] `src/core/io/rawGradesParser.ts` — meta lớp, hàng "Điểm tối đa", dò cột theo tên, điểm danh (Buổi 1..N), SV thiếu mã → prefix `__MISSING_`

## Pha 5 — Validate (`src/core/validator/` — mỗi sheet một file)

- [ ] `helpers.ts` — EPSILON (chỉ còn dùng cho tổng đề = 10), `examMaxScores` (không cộng trùng cột)
- [ ] Sheets: `hocPhan` (tín chỉ bắt buộc nguyên) → `cloList` (format CLOx(.y), bậc/thang) → `keHoach` (nguyên %, tổng 100% SAU vòng for, GK-CK trùng) → `cauHoi` (cột dùng đè, câu trùng tên, ≤50% PLO) → `maTranPlo` → `diemDanh` → `quyTac` (enum + khoảng giá trị thay vì rơi về mặc định im lặng)
- [ ] `crossSheetValidator.ts` — tham chiếu CLO, cặp khớp 2 chiều, CLO treo, tổng đề = 10, chưa ánh xạ PLO
- [ ] `rawGradesValidator.ts` — mã SV trùng/thiếu, điểm âm/vượt max, bội 0,25, N < ngưỡng cỡ mẫu
- [ ] `index.ts` — `validateConfig` = thông báo trộn 8 validator; `hasErrors` chặn tính

## Pha 6 — Điểm danh

- [ ] `src/core/calculator/attendanceCalculator.ts` — `computeAttendanceScores` (Σ hệ số / số buổi đã diễn ra × 10), `applyAttendance` (ký hiệu lạ → hệ số 0 + warning; tương tác cột CC nhập sẵn)

## Pha 7 — Tính điểm (trọng tâm lớn nhất, theo cấp từ nhỏ đến lớn)

- [ ] `calculator/cloCalculator.ts` — orchestrator + `cellQuestionsMap` (gộp câu theo ô `{maDauDiem}_{clo}`)
- [ ] `calculator/cellScoreCalculator.ts` — **⚠️ điểm ô s(j,k)**: lọc câu theo mã đề của SV (QĐ #10), QĐ #9 cấp câu (câu trống = 0, tỷ lệ 0 vẫn vào trung bình), nhánh cột điểm trực tiếp (fallback — QĐ #12), `clo_bo_phan` mean_of_ratios vs ratio_of_sums
- [ ] `calculator/studentCalculator.ts` — ghép cellScores → điểm từng CLO của 1 SV, cờ `hasMissingData`/`isAbsentFinal`
- [ ] `calculator/cloScoreCalculator.ts` — CLO quá trình/cuối kỳ/TBC (trongSoClo ?? 1), điểm nhóm (Quyết định #1)
- [ ] `calculator/courseScoreCalculator.ts` — `hp_method` QD450: `0,2·C_cc + 0,3·C_gk + 0,5·C_ck` (so ví dụ Hùng = 6,7); nhánh RAW_POINTS
- [ ] `calculator/classSummaryCalculator.ts` — thống kê lớp, % đạt ngưỡng, SV vắng thi (QĐ #5: vẫn tính mẫu số)

## Pha 8 — Psychometrics

- [ ] `calculator/psychometrics.ts` — gộp câu theo `cau`, lọc SV theo đề (maDe khác với ô điểm!), p, d (nhóm 27%), Cronbach α, alpha-if-dropped, cảnh báo cỡ mẫu N < 30
- [ ] `rules/classification.ts` — bảng phân loại p/d/α (QĐ450 Điều 5)

## Pha 9 — Số học & luật (số liệu trông lạ → soi nơi này trước)

- [ ] `rules/rounding.ts` — Decimal.set toàn cục ROUND_HALF_UP, `roundHalfUp`/`roundStep` (chain vs final_only)
- [ ] `rules/defaults.ts` — 12 Quyết định dưới dạng giá trị QUY_TAC

## Pha 10 — Export

- [ ] `exporter/finalGradesReport.ts` (658 dòng — lớn nhất) + `examReport.ts` + `chartRenderer.ts` + `style.ts`
- [ ] Phụ lục 3 dùng `utils/numberToWordsVi.ts` (đọc số thành chữ)

## Pha 11 — Cầu Electron

- [ ] `src/main/ipc.ts` — flow `config:parse` → `raw:parse` → `pipeline:run` (chặn cứng qua `hasErrors(issues)`)
- [ ] `src/preload/index.ts` + `src/renderer/src/App.tsx` — UI (đang WIP của t)

## Anchor xác minh (dùng để soi bất kỳ stage nào)

| Anchor                                        | Đối chiếu                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `tests/goldenQd450.test.ts` (T1–T12)          | số đã tính tay theo QĐ450; ví dụ Hùng CLO3 = 8,7 (không phải 8,3 — QĐ #8) |
| `tests/validator.test.ts`, `tests/io.test.ts` | thông báo lỗi cố định từng validator                                      |
| `tests/multiDe.test.ts`                       | bẫy bug lọc maDe cấp ô điểm (SV làm 1 trong 2 đề)                         |
| `npm run demo`                                | SV0 = {9.6, 7.3, 7.6, 7.3, 7.1}                                           |

## Điểm dễ nhầm đã chốt (tra nhanh)

| #           | 선                                                                                               | Vị trí                                    |
| ----------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| QĐ #9       | câu trống = 0 điểm câu, giữ trọng số trong mẫu số mọi cấp                                        | cellScoreCalculator                       |
| QĐ #10      | lọc câu theo maDe của SV ở cấp ô (≠ ALL sẽ chỉ tính đề đó)                                       | cellScoreCalculator + psychometrics       |
| QĐ #11      | điểm thô còn error → pipeline không tính                                                         | main/ipc.ts                               |
| QĐ #12      | mọi cặp đuôi đầu-CLO bắt buộc khai CAU_HOI (cột trực tiếp chỉ fallback)                          | crossSheetValidator + cellScoreCalculator |
| EPSILON     | chỉ còn dùng cho "tổng đề = 10" (vì diemToiDa cho phép lẻ); tổng trọng số 100% so cứng vì nguyên | validator/helpers + crossSheet            |
| parseNumber | nuốt im lặng gõ sai — chờ chốt (note.txt)                                                        | utils/excel/cellValue.ts                  |
