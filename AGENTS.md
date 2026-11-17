# AGENTS.md — Clove (CLO/PLO, Đại học Thành Đông; repo clo-tool)

## Lệnh & thứ tự verify

- `npm test` (vitest run). Một file: `npx vitest run tests/io.test.ts`. Toàn bộ test phải xanh trước khi kết thúc thay đổi;
  golden tests (`tests/goldenQd450.test.ts`) đối chiếu **số liệu ví dụ đã tính tay theo QĐ450** — không "sửa" expected cho khớp sai.
- `npm run typecheck` chạy **2 tsconfig riêng biệt**: `typecheck:node` (main/preload/core) và `typecheck:web` (renderer) — chỉ chạy 1 cái là bỏ sót nửa dự án.
- `npm run build` = typecheck + electron-vite build.
- Thứ tự khuyến nghị khi sửa core: `npm run typecheck` → `npm test` → `npm run lint`.
- `npm run demo` và `npm run gen:templates` **bắt buộc chạy qua `vite.demo.config.ts`** (vite-node) vì cần alias `@core` — dùng đúng npm script, không gọi `node scripts/...` trực tiếp (script là TS + import alias).
- Windows/PowerShell; demo in nhiều dòng debug `check ...` từ console.log còn sót trong `src/core` — bỏ qua khi đọc output.

## Phát hành

- `main` chỉ nhận **PR từ nhánh `release/x.y.z`** (ruleset `protect-main` + workflow `guard-main.yml`), không push thẳng; công việc hằng ngày đi vào `develop`.
- Tag `vX.Y.Z` (khớp `version` trong `package.json`) kích hoạt `.github/workflows/release.yml`: chạy test, build và publish GitHub Release. Tự cập nhật trong app đọc `latest.yml` từ Release đó.
- Auto-update chỉ chạy với bản cài `setup.exe` (`app.isPackaged`); bản `portable.exe` phải tải lại tay. Build chưa ký số nên SmartScreen có thể cảnh báo.
- `electron-updater` là CommonJS: trong main (ESM) **phải dùng default import** (`import electronUpdater from 'electron-updater'`) rồi destructure — named import làm app crash ngay khi khởi động.
- Artifact: `Clove-<version>-setup.exe` (NSIS, tự cập nhật), `Clove-<version>-portable.exe`, `Clove-<version>-<arch>.dmg` / `.zip` cho macOS (zip là bắt buộc để auto-update), `latest.yml` + `.blockmap`. Tên file đặt trong `electron-builder.yml`.

### Quy trình phát hành chi tiết

1. Trên `develop`: chạy `npm run typecheck && npm run lint && npm test`, cập nhật `CHANGELOG.md`.
2. Tăng version bằng `npm version x.y.z --no-git-tag-version`, commit `chore(release): vX.Y.Z` trên `develop`, push.
3. Tạo nhánh phát hành **tuyến tính trên `origin/main`** rồi squash toàn bộ `develop`:
   ```bash
   git switch -c release/x.y.z origin/main
   git merge --squash -X theirs develop
   git diff develop --stat   # phải rỗng
   git commit -m "fix|feat: <tóm tắt>"
   git push -u origin release/x.y.z
   ```
   `-X theirs` để né conflict khi `main` đã bị rebase; nhớ squash từ **nhánh `develop` local** chứ không phải `origin/develop` (ref remote có thể còn cũ).
4. PR `release/x.y.z` → `main`, chọn **Rebase and merge**. Nếu trang compare của GitHub báo *"This comparison is taking too long to generate"* (lỗi phía GitHub, không phải nhánh hỏng) thì tạo/merge PR bằng REST API `POST /repos/:owner/:repo/pulls` với token Git Credential Manager — đừng chờ.
5. Merge xong mới tag trên `main`, rồi push tag để kích hoạt workflow:
   ```bash
   git fetch origin && git tag vX.Y.Z <sha-main> && git push origin vX.Y.Z
   ```
   Ruleset `protect-tags` cấm xoá/sửa tag ⇒ tag sai chỉ sửa được bằng quyền admin, kiểm tra kỹ trước khi push.
6. Chép commit version + CHANGELOG ngược về `develop` (`git cherry-pick`), không merge nhánh release vào `develop`.

## Kiến trúc & ràng buộc cốt lõi

- `src/core` là engine **thuần TypeScript, KHÔNG import Electron/React** — core phải chạy được độc lập dưới vitest / vite-node. Alias `@core` = `src/core` (đặt trong `vitest.config.ts` VÀ `vite.demo.config.ts`).
- Mọi tính điểm **phải dùng decimal.js với ROUND_HALF_UP** (dùng sẵn `roundHalfUp`/`roundStep` trong `src/core/rules.ts`, config global đã set ở đầu file). Không dùng số học float thường cho điểm — test golden dễ phát hiện.
- Dòng chảy dữ liệu: `renderer` → `preload` (`window.api`) → IPC (`src/main/ipc.ts`) → core. DTO dùng chung nằm `src/shared/ipc.ts`.
- `docs/ke_hoach_dac_ta_clo_plo.md` = đặc tả + **các Quyết định nghiệp vụ #1–#9 đã chốt** (mục VII). Đổi rule tính điểm ⇒ cập nhật cả doc lẫn comment code theo mã Quyết định.
- Quyết định đang áp dụng: **#1** `hp_method = QD450` (học phần = 20% CC + 30% GK + 50% CK); **#7** CLO chỉ đo bằng chuyên cần/thái độ ⇒ **cảnh báo**, không chặn tính điểm; ngưỡng đạt mặc định 4,0 cho CLO/PLO/học phần; làm tròn half-up từng bước (`rounding_mode = chain`).
- Electron main: `BrowserWindow` dùng `titleBarStyle: 'hidden'` + `titleBarOverlay` + `preload` + `show: false`. Trên Windows tổ hợp này **không bao giờ phát khung hình đầu** ⇒ `ready-to-show` không chạy và app chạy ngầm không cửa sổ (lỗi 1.0.7). Vì vậy `src/main/index.ts` phải giữ fallback hiện cửa sổ ở `did-finish-load` — không bỏ khi refactor.

## Cấu trúc thư mục

```
src/
  core/               # Engine thuần TS, không import Electron/React
    types/            # Kiểu dữ liệu theo miền (course, student, result, …)
    io/               # Đọc bảng điểm thô, sinh template điểm thô
    calculator/       # attendance/ (chuyên cần), clo/ (ô → CLO → nhóm → học phần), plo/
    exporter/         # Xuất Excel + biểu đồ PNG
  main/               # Electron main + IPC xử lý file
  preload/            # Cầu nối an toàn ra window.api
  renderer/           # Giao diện React (themes/, components/, lib/)
  shared/             # DTO dùng chung main ↔ renderer
resources/templates/  # Template_DiemTho*.xlsx (generated)
scripts/              # demo.ts, gen-templates.ts
tests/                # Vitest (golden QĐ450, io, e2e)
docs/                 # Đặc tả & kế hoạch
```

## Hợp đồng I/O Excel

- **Đọc điểm thô**: sheet `NHAP_LIEU` hoặc `NHAP_LIEU_GV`; dò tiêu đề theo **tên cột** (chuẩn hoá dấu/khoảng trắng/hoa thường, gợi ý khi gần giống), không theo vị trí. Cột: `TT`, `Mã SV`, `Họ`, `Tên`, `Ngày sinh`, `Buổi 1..N`, các cột điểm trùng mã đầu điểm/câu hỏi trong `CAU_HOI`, `Ghi chú`.
- `Mã SV` giữ dạng text (không mất `0` đầu); chấp nhận `2,5` và `2.5`; `VT` = vắng thi.
- CC tự tính từ điểm danh: `CC = (Σ hệ số buổi đã diễn ra / số buổi đã diễn ra) × 10`.
- **Báo cáo** `final_grades_report.xlsx` gồm các sheet: `BANG_DIEM_QUA_TRINH` (Phụ lục 3 – quá trình, TBC CLO số + chữ), `BANG_DIEM_CUOI_KY`, `BANG_DIEM_HOC_VU`, `CHI_TIET_CLO`, `TONG_HOP_LO` (% đạt CLO/PLO, TB/min/max, 2 biểu đồ, ô đề xuất cải tiến), `CANH_BAO`.
- Biểu đồ trong Excel là **ảnh PNG** (ExcelJS không tạo chart gốc); số liệu nguồn luôn nằm trong bảng cạnh biểu đồ.
- Cấu hình học phần **không** đọc từ `Template_Config.xlsx` nữa: nhập trong app hoặc **Nhập JSON**.

## Dữ liệu mẫu & artifact sinh ra — đừng sửa tay

- `tests/fixtures/mockClass.ts` là **nguồn duy nhất** của dữ liệu mẫu: `buildMockClass(10)` = 10 SV curated (mỗi SV một ca biên: mã SV prefix 0, VT vắng thi, thiếu điểm, trống toàn bộ, câu thi 0 điểm, chuyên cần kém…), tham số lớn hơn = curated 10 + sinh ngẫu nhiên có seed.
- `resources/templates/*.xlsx` và mọi thứ trong `out/` là **generated** — sinh lại bằng `npm run gen:templates` / `npm run demo`, không sửa file Excel trực tiếp.
- Demo + template đọc cùng mockClass ⇒ sửa mock/config mẫu phải chạy lại cả hai lệnh trên và test e2e/io (mỗi cái assert số SV, index ca biên, tên cột, số đếm sheet).
- Học phần mẫu **KTLT101 – Kỹ thuật lập trình**, 3 tín chỉ, 3 CLO; trọng số: CC→CLO2 5%, CC→CLO3 5%, TD→CLO4 10%, KT3→CLO3 15%, KT4→CLO4 15%, CK 3 câu→CLO2/CLO3/CLO4 20%/15%/15%; 32 SV, 12 buổi điểm danh (`X`, `OL`, `M`, `V-CP`, `V`). Toàn bộ là số liệu mock.

## Nghiệp vụ dễ nhầm (lỗi tốn test xanh)

- Quyết định #9: **cột điểm trống = 0 điểm**, giữ trọng số trong mẫu số mọi cấp (`cellScoreCalculator` tạo ô điểm 0, vẫn set `hasMissingData` + warning). `VT` = vắng thi → 0 cuối kỳ + `isAbsentFinal`.
- Validator bắt buộc **tổng điểm tối đa của mỗi đề (mã đầu điểm + mã đề) bằng 10**.
- `maDe` semantics: `ALL` = câu áp dụng cho mọi đề; SV có mã đề riêng chỉ nhận điểm câu thuộc đề đó.

## Tính năng đã bị loại bỏ — KHÔNG tạo lại

- **Kiểm định đề thi / psychometrics đã bị gỡ khỏi sản phẩm** (quyết định của chủ dự án, 2026-11-16): không có độ khó p, độ phân biệt d, Cronbach α, "α nếu bỏ câu", báo cáo `exam_analysis_report.xlsx`, sheet `P_D_TUNG_CAU` / `DO_TIN_CAY`, tab/màn "Kiểm định đề thi", `examReportPath` trong DTO, và không có module `psychometrics` trong `src/core`.
- **Why:** app chỉ phục vụ tính điểm CLO/PLO theo QĐ450; phần thống kê đề thi đã bị chủ dự án yêu cầu bỏ hẳn, không phải tạm ẩn.
- **How to apply:** không thêm lại file, hàm, hằng số, cột Excel, UI, test hay tài liệu cho các mục trên. Dữ liệu p/d/α trong QĐ450 không cần cài đặt. `maDe` vẫn tồn tại nhưng chỉ để chọn câu theo đề khi tính điểm.
- Bug đã ghi nhận, chưa sửa (xem `note.txt`): validator bắt buộc mọi đầu điểm phải có câu hỏi trong `CAU_HOI`, nhưng `calculateCellScores` hỗ trợ cột điểm trực tiếp (CC, TD thang 10) — mâu thuẫn thiết kế, chờ chốt cách phân giải.

## Ngôn ngữ

- Toàn bộ comment, string UI, nội dung Excel là **tiếng Việt**. Không dịch sang tiếng Anh khi sửa code hiện có.
- `README.md` là **hướng dẫn cho người dùng cuối** (cài đặt, quy trình dùng, FAQ) — không đưa lệnh dev/quy trình phát hành vào đó; thông tin kỹ thuật ghi ở đây hoặc `docs/`.
