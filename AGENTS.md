# AGENTS.md — clo-tool (CLO/PLO Evaluator, Đại học Thành Đông)

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

## Kiến trúc & ràng buộc cốt lõi

- `src/core` là engine **thuần TypeScript, KHÔNG import Electron/React** — core phải chạy được độc lập dưới vitest / vite-node. Alias `@core` = `src/core` (đặt trong `vitest.config.ts` VÀ `vite.demo.config.ts`).
- Mọi tính điểm **phải dùng decimal.js với ROUND_HALF_UP** (dùng sẵn `roundHalfUp`/`roundStep` trong `src/core/rules.ts`, config global đã set ở đầu file). Không dùng số học float thường cho điểm — test golden dễ phát hiện.
- Dòng chảy dữ liệu: `renderer` → `preload` (`window.api`) → IPC (`src/main/ipc.ts`) → core. DTO dùng chung nằm `src/shared/ipc.ts`.
- `docs/ke_hoach_dac_ta_clo_plo.md` = đặc tả + **các Quyết định nghiệp vụ #1–#9 đã chốt** (mục VII). Đổi rule tính điểm ⇒ cập nhật cả doc lẫn comment code theo mã Quyết định.

## Dữ liệu mẫu & artifact sinh ra — đừng sửa tay

- `tests/fixtures/mockClass.ts` là **nguồn duy nhất** của dữ liệu mẫu: `buildMockClass(10)` = 10 SV curated (mỗi SV một ca biên: mã SV prefix 0, VT vắng thi, thiếu điểm, trống toàn bộ, câu thi 0 điểm, chuyên cần kém…), tham số lớn hơn = curated 10 + sinh ngẫu nhiên có seed.
- `resources/templates/*.xlsx` và mọi thứ trong `out/` là **generated** — sinh lại bằng `npm run gen:templates` / `npm run demo`, không sửa file Excel trực tiếp.
- Demo + template đọc cùng mockClass ⇒ sửa mock/config mẫu phải chạy lại cả hai lệnh trên và test e2e/io (mỗi cái assert số SV, index ca biên, tên cột, số đếm sheet).

## Nghiệp vụ dễ nhầm (lỗi tốn test xanh)

- Quyết định #9: **cột điểm trống = 0 điểm**, giữ trọng số trong mẫu số mọi cấp (`cellScoreCalculator` tạo ô điểm 0, vẫn set `hasMissingData` + warning). `VT` = vắng thi → 0 cuối kỳ + `isAbsentFinal` + bị loại khỏi p/d/α.
- Validator bắt buộc **tổng điểm tối đa của mỗi đề (mã đầu điểm + mã đề) bằng 10**.
- `maDe` semantics: `ALL` = SV làm mọi đề (tính vào mọi đề khi phân tích psychometrics); SV có mã đề riêng chỉ tính vào đề đó.
- Bug đã ghi nhận, chưa sửa (xem `note.txt`): validator bắt buộc mọi đầu điểm phải có câu hỏi trong `CAU_HOI`, nhưng `calculateCellScores` hỗ trợ cột điểm trực tiếp (CC, TD thang 10) — mâu thuẫn thiết kế, chờ chốt cách phân giải.

## Ngôn ngữ

- Toàn bộ comment, string UI, nội dung Excel là **tiếng Việt**. Không dịch sang tiếng Anh khi sửa code hiện có.
