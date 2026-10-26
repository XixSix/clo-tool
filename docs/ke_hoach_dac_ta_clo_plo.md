# KẾ HOẠCH BÀI BẢN & ĐẶC TẢ KỸ THUẬT DỰ ÁN

## PHẦN MỀM ĐO LƯỜNG & ĐÁNH GIÁ CHUẨN ĐẦU RA HỌC PHẦN (CLO/PLO)

**Đơn vị áp dụng quy chuẩn:** Trường Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
**Hình thức phần mềm:** Desktop Application, chạy offline 100%, không có backend/server
**Công nghệ chủ đạo:** Electron | Node.js | TypeScript | React | ExcelJS | decimal.js (chi tiết ở mục VIII.2)

**Tài liệu căn cứ:**

1. QĐ 450 và các phụ lục (viết tắt: **QĐ450**)
2. "Một số lưu ý trong đo lường CĐR học phần" của P.QLCL (viết tắt: **Lưu ý QLCL**)
3. `Mẫu_CLO_ĐIỂM_DANH_GHI_ĐIỂM.xlsx`, mẫu Excel học kỳ 2026-2027 (viết tắt: **Mẫu Excel 2026**)
4. `Mẫu_Danh_sách_điểm_danh___ghi_điểm_CLOxls.xls` (viết tắt: **Mẫu xls**)

**Quy ước:** `[v1]` làm ngay, `[v1.1]` làm sau khi v1 chạy ổn, `[v2]` để sau. `[Quyết định #n]` trỏ tới danh sách các quyết định nghiệp vụ đã chốt ở mục VII (những chỗ văn bản chưa nói rõ).

---

## I. TỔNG QUAN DỰ ÁN & PHẠM VI

### 1. Mục tiêu

- Tự động hóa tính điểm CLO, TBC CLO, điểm học phần, PI/PLO thành phần của một học phần, và các chỉ số chất lượng đề thi (độ khó, độ phân biệt, độ tin cậy).
- Không để giảng viên phải tự lập công thức Excel dễ gãy.
- Xuất bảng ghi điểm theo Phụ lục 3 và các báo cáo mà QĐ450 / P.QLCL yêu cầu nộp (tỷ lệ SV đạt CLO, phân tích đề thi, định hướng cải tiến).

### 2. Nguyên tắc vận hành

- **Offline 100%:** dữ liệu điểm chỉ nằm trên máy giảng viên. Không server, không database, không tài khoản.
- **Đơn giản tối đa:** giảng viên chọn **2 file Excel** (Config học phần + Điểm thô của lớp) rồi bấm "Xử lý". File Config làm một lần cho mỗi học phần, dùng lại các học kỳ sau.
- **Không hard-code quy tắc nghiệp vụ.** Cách làm tròn, ngưỡng đạt, cách tính điểm học phần đều nằm trong sheet `QUY_TAC` của Config. Lý do: QĐ450 ghi rõ có thể điều chỉnh, và một số chỗ văn bản chưa nói rõ nên phải chọn quy ước (mục VII).
- **Linh hoạt:** số CLO, số bài kiểm tra, số câu hỏi, trọng số đều đọc từ Config.

### 3. Phạm vi theo phiên bản

| Hạng mục                                                               | v1  | v1.1 | v2  |
| :--------------------------------------------------------------------- | :-: | :--: | :-: |
| Đọc 2 file Excel, kiểm tra hợp lệ, báo lỗi theo từng ô                 |  ✔  |      |     |
| App tự sinh `Template_DiemTho.xlsx` từ file Config                     |  ✔  |      |     |
| Tính CLO, TBC CLO, điểm học phần, PI/PLO thành phần (trong 1 học phần) |  ✔  |      |     |
| Bảng ghi điểm **Quá trình** và **Cuối kỳ** (Phụ lục 3)                 |  ✔  |      |     |
| Thống kê % SV đạt từng CLO/PLO + 2 biểu đồ (Phụ lục 4, tr.33)          |  ✔  |      |     |
| Độ khó p, độ phân biệt d, độ tin cậy α, "α nếu bỏ câu"                 |  ✔  |      |     |
| Xuất Excel                                                             |  ✔  |      |     |
| Nhiều mã đề trong một lớp (QĐ450 Điều 3.4: mỗi ca thi ≥ 2 đề)          |     |  ✔   |     |
| Rà soát điểm bất thường theo Điều 5.3 (so điểm quá trình với điểm thi) |     |  ✔   |     |
| Đọc trực tiếp sheet `NHAP_LIEU_GV` của Mẫu Excel 2026                  |     |  ✔   |     |
| Xuất PDF báo cáo                                                       |     |  ✔   |     |
| Nhập điểm trực tiếp trong app                                          |     |      |  ✔  |
| Tổng hợp PLO/CĐR CTĐT cho từng SV qua nhiều học phần (Phụ lục 4 mục 2) |     |      |  ✔  |
| So sánh kết quả với học kỳ trước (câu hỏi số 5 trong Lưu ý QLCL)       |     |      |  ✔  |
| Đồng bộ/thu báo cáo tập trung (lúc đó mới cần backend)                 |     |      |  ✔  |

_Vì sao nhập điểm trực tiếp trong app để v2:_ giảng viên đã có điểm trong Excel hoặc Google Sheets (xuất `.xlsx` được), còn tự dựng bảng tính trong app (dán nhiều ô, undo, lưu nháp) là phần tốn công nhất. v1 thay bằng hai thứ: app tự sinh file nhập điểm có sẵn tiêu đề cột và điểm tối đa, và cho **sửa ô lỗi ngay trong bảng preview** (chỉ sửa trong bộ nhớ, không ghi đè file gốc).

---

## II. QUY TẮC NGHIỆP VỤ

### 1. Thang điểm và làm tròn

- **[Căn cứ: QĐ450 Điều 1.8, Điều 6.3]** Điểm học phần, CLO, PI, PLO đều thang 10, làm tròn **1 chữ số thập phân**, làm tròn **lên** khi đúng nửa (half-up).
- **Dùng `decimal.js` với chế độ `ROUND_HALF_UP`, không tính bằng số thực của JavaScript.** Số thực nhị phân làm một số giá trị đúng nửa bị làm tròn sai (ví dụ `(1.005).toFixed(2)` ra `1.00`). Bằng chứng ngay trong QĐ450 (tr.32): SV Nguyễn Văn Hùng được 2,5/4 điểm, tức 6,25, và QĐ ghi **6,3**; cách làm tròn kiểu "chẵn" sẽ cho 6,2.
- **Làm tròn từng bước [Quyết định #4].** Kết quả của mỗi cấp tính toán được làm tròn 1 chữ số thập phân và **số đã làm tròn được dùng cho cấp tiếp theo**, đúng như cách các ví dụ trong QĐ450 trình bày (ví dụ (8,8 + 6,7)/2 = 7,75 → 7,8 ở tr.32). Các cấp: điểm từng ô (đầu điểm, CLO) → điểm CLO học phần → điểm từng nhóm (CC/GK/CK) → TBC CLO → điểm học phần. PI/PLO tính từ các CLO đã làm tròn.
- Tham số `rounding_mode = chain` (mặc định). Chế độ `final_only` (giữ số gốc, chỉ làm tròn khi xuất) để dự phòng nếu sau này trường yêu cầu khác.
- Mẫu Excel 2026 làm tròn 2 chữ số ở từng bước, nên kết quả có thể lệch 0,1 so với mẫu đó ở một số SV. Đối chiếu bằng dữ liệu thật ở Tuần 0.
- Các chỉ số p, d, α hiển thị 2 chữ số thập phân (như ví dụ QĐ450: 0,62; 0,25; 0,65), tính và phân loại trên số gốc.

### 2. Luồng xử lý dữ liệu

```
[Config học phần (.xlsx)] ──┐
                            ├─► [ VALIDATOR ] ─► [ CORE ENGINE ] ──► [ Excel: bảng điểm Phụ lục 3 + điểm học vụ + tổng hợp ]
[Điểm thô của lớp (.xlsx)] ─┘                   (CLO/PLO + psychometrics) ──► [ Excel: báo cáo phân tích đề thi ]
                                                                        ──► [ Preview trong app + biểu đồ ]
```

### 3. Công thức tính điểm

**Khái niệm:**

- **Đầu điểm** `j`: một thành phần đánh giá có mã riêng, ví dụ `CC` (điểm danh), `TD` (thái độ), `KT1`, `KT2`, `CK`.
- **Nhóm:** `CC` (chuyên cần + thái độ, 20%), `GK` (kiểm tra giữa kỳ/thường xuyên, 30%), `CK` (thi cuối kỳ, 50%), theo QĐ450 Điều 9.3. Trọng số nhóm nằm trong Config.
- **Ô (j, k):** cặp đầu điểm `j` đo CLO `k`. Mỗi ô có một trọng số `w(j,k)` theo kế hoạch đánh giá, giống bảng "Bảng 4" của Mẫu Excel 2026 (CC–CLO2: 5%, CC–CLO3: 5%, ...).

#### A. Điểm CLO thành phần (thang 10) cho từng ô (j, k)

$$s_{j,k} = \frac{1}{n}\sum_{i=1}^{n}\frac{d_i}{t_i}\times 10$$

- $d_i$: điểm SV đạt ở cột điểm $i$ thuộc đầu điểm $j$ và gắn với CLO $k$.
- $t_i$: điểm tối đa của cột đó.
- $n$: số cột điểm thuộc ô (j, k).
- Căn cứ: QĐ450 Điều 9.3 (trung bình của các tỷ lệ) **[Quyết định #3]**. Mỗi cột điểm trong `CAU_HOI` được tính là một "câu" (câu 3 tách thành 3a, 3b thì là hai câu); cột thang 10 như CC, thái độ có $n = 1$.
- Lưu ý QLCL diễn đạt theo tổng điểm ($10\times\sum d/\sum t$). Hai cách trùng nhau khi mọi câu có cùng điểm tối đa (như đề 40 câu × 0,25 trong Phụ lục 4) và chỉ khác khi điểm tối đa các câu không đều. Tham số `clo_bo_phan = mean_of_ratios` (mặc định); có thể đổi sang `ratio_of_sums`.

_Trường hợp một cột đo nhiều CLO:_

- Cột thang 10 như CC, thái độ: mỗi CLO nhận **nguyên điểm cột đó** (Mẫu Excel 2026 làm vậy cho CC → CLO2 và CLO3).
- Câu hỏi đo nhiều CLO: **tách thành nhiều cột** (Câu 3a, Câu 3b), mỗi cột một CLO, khớp với đáp án theo "ý" mà Phụ lục 01a yêu cầu ghi rõ CLO từng ý. Lưu ý QLCL cũng yêu cầu phân bổ điểm rõ ràng cho từng CLO. Việc app tự chia điểm câu theo tỷ lệ để `[v2]`.

#### B. Điểm CLO cả học phần

$$\text{CLO}_k = \frac{\sum_{j} w_{j,k}\, s_{j,k}}{\sum_{j} w_{j,k}}$$

- Tổng chạy trên **các đầu điểm có đo CLO $k$**; chỗ thiếu dữ liệu tính 0 nhưng giữ nguyên trọng số trong mẫu số **[Quyết định #9]**. CLO chỉ đo ở cuối kỳ thì mẫu số chỉ có trọng số cuối kỳ.
- Khớp ví dụ Hùng (QĐ450 tr.32): $\text{CLO}_{1.1} = \frac{7{,}5\times 0{,}3 + 7{,}1\times 0{,}5}{0{,}8} = 7{,}3$.
- Bảng ghi điểm **Quá trình** (nộp trước khi thi, theo Mẫu xls): chỉ lấy các đầu điểm thuộc nhóm `CC` và `GK`, cùng công thức.
- Lưu ý QLCL cho phép đặt trọng số khác nhau cho CLO ở các lần đo (ví dụ 0,4 cho bài kiểm tra và 0,6 cho thi cuối kỳ khi CK đòi mức năng lực cao hơn). Việc này nằm sẵn trong `w(j,k)`.

#### C. TBC CLO

$$\text{TBC CLO} = \frac{\sum_{k=1}^{n} v_k\,\text{CLO}_k}{\sum_{k=1}^{n} v_k}$$

$v_k$ là cột `Trọng số CLO` trong `CLO_LIST` (bỏ trống = 1, tức trung bình cộng thuần như Phụ lục 3 ghi "Trung bình cộng các CLO"). Ví dụ Hùng: TBC CLO = 6,6.

#### D. Điểm học phần (điểm học vụ)

**[Quyết định #1]** Điểm học phần tính theo QĐ450 Điều 9.3:

$$C_{hp} = 0{,}2\,C_{cc} + 0{,}3\,C_{gk} + 0{,}5\,C_{ck}$$

- $C_{cc}$, $C_{gk}$, $C_{ck}$ là điểm của từng nhóm, mỗi điểm = **trung bình cộng điểm các CLO** thuộc nhóm đó (mỗi CLO đã quy về thang 10 theo công thức A).
- Ví dụ SV Hùng (QĐ450 tr.32): $C_{cc} = 8{,}8$; $C_{gk} = 6{,}7$ (TB 6 CLO của hai bài kiểm tra); $C_{ck} = 5{,}9$ (TB 6 CLO của đề thi cuối kỳ) → $C_{hp} = 0{,}2\times 8{,}8 + 0{,}3\times 6{,}7 + 0{,}5\times 5{,}9 = \mathbf{6{,}7}$, đúng như QĐ ghi ("Điểm tổng kết học vụ").
- **Đừng nhầm hai đại lượng cùng xuất hiện ở tr.32–33:** "Tổng kết học vụ" (**6,7**, tính như trên, là điểm học phần) và "Tổng kết CLO" (**6,6**, là TBC của 7 CLO sau khi tính lẻ từng CLO theo công thức B, là số điền vào Phụ lục 3). Chúng gần nhau nhưng là hai đại lượng riêng.
- Số 7,8 (TB của 8,8 và 6,7) có in trong bảng ở tr.32 nhưng không dùng ở bước nào sau đó; app không cần tính.
- Học phần thực hành, thực tế chuyên môn, đồ án, thực tập tốt nghiệp, khóa luận (QĐ450 Điều 9.3): $C_{hp} = \sum_k \text{CLO}_k \times \text{trọng số CLO}_k$. Chọn bằng `Loai_HP = thuc_hanh` trong Config; dùng cột `Trọng số CLO` (tổng phải bằng 100%).

_Phương án dự phòng:_ nếu P.QLCL cho biết trường vẫn nhập điểm học vụ bằng cách **cộng điểm thô** theo trọng số 20/30/50 (không qua trung bình CLO), đổi `hp_method` thành `RAW_POINTS`. Với dữ liệu của Hùng, cách này cho khoảng 6,9 (số tự tính, không có trong QĐ450). Mặc định là `QD450`.

#### E. PI và PLO thành phần của một học phần

- **[Căn cứ: QĐ450 Điều 9.5, 9.6; ví dụ PLO3 ở tr.33]** PI và PLO thành phần đều là **trung bình cộng trực tiếp các CLO** được ánh xạ tới chúng trong `MA_TRAN_PLO`. Ví dụ Hùng: PLO3 = (CLO1.1 + CLO1.2 + CLO1.3 + CLO1.4)/4 = 6,6.
- Có thể gia quyền bằng `Trọng số CLO` (QĐ450 tr.32–33 cho phép "nếu có hệ số quan trọng hoặc mức năng lực").
- Điểm CĐR của CTĐT (trung bình các PLO thành phần, Điều 9.7) chỉ tính được khi có dữ liệu nhiều học phần, nên thuộc `[v2]`. v1 chỉ xuất điểm PI/PLO của học phần đang xử lý.

#### F. Điều kiện Đạt và cảnh báo

| Đối tượng          |                  Ngưỡng                  | Căn cứ                                                                                                  |
| :----------------- | :--------------------------------------: | :------------------------------------------------------------------------------------------------------ |
| PLO thành phần đạt |                  ≥ 4,0                   | QĐ450 Điều 10                                                                                           |
| CĐR CTĐT đạt       |                  ≥ 5,0                   | QĐ450 Điều 10 (`[v2]`)                                                                                  |
| SV bị cảnh báo     | PLO thành phần < 4,0 hoặc CĐR CTĐT < 5,0 | QĐ450 Điều 12                                                                                           |
| **CLO đạt**        |                **≥ 4,0**                 | **[Quyết định #2]** (văn bản không nêu; chọn bằng ngưỡng PLO thành phần; đặt trong `QUY_TAC`, đổi được) |
| Học phần đạt       |               mặc định 4,0               | cần đối chiếu Quy chế đào tạo của Trường                                                                |

### 4. Chỉ số chất lượng đề thi (Psychometrics)

_Căn cứ: QĐ450 Điều 5. Tính riêng cho từng đợt (giữa kỳ, cuối kỳ) và từng mã đề; **không gộp các đợt**._

- **Độ khó:** $p = \dfrac{\bar{x}}{M}$ ($\bar{x}$: điểm trung bình của tất cả SV ở câu đó; $M$: điểm tối đa của câu).
  QĐ450 còn có cách $p = n/N$ cho trắc nghiệm, nhưng với câu chấm 0/điểm tối đa thì hai cách cho kết quả **giống hệt nhau**, nên chỉ cần cài một công thức.
- **Độ phân biệt:** $d = \dfrac{\bar{x}_t - \bar{x}_d}{M}$, trong đó nhóm trên và nhóm dưới mỗi nhóm có $g = \text{làm tròn}(27\% \times N)$ SV, xếp theo **tổng điểm toàn bài**. Ví dụ QĐ450: 15 SV → 4 SV mỗi nhóm.
  QĐ450 không nói cách xử lý điểm bằng nhau tại ranh giới nhóm. Quy ước tạm: sắp xếp ổn định theo tổng điểm giảm dần, hòa thì theo Mã SV; ghi quy ước này vào báo cáo.
- **Độ tin cậy Cronbach's α:** của **cả đề** (một giá trị cho mỗi đề/đợt), không phải của từng câu.
  $$\alpha = \frac{n}{n-1}\left(1 - \frac{\sum \sigma_i^2}{\sigma_c^2}\right)$$
  Phương sai là phương sai mẫu (chia cho $m-1$) như công thức (*) trong QĐ450. Dùng phương sai tổng thể cho mọi số hạng thì α không đổi, nhưng phải dùng thống nhất. Thêm cột **"α nếu bỏ câu này"** cho từng câu (với đề ví dụ 5: bỏ câu 3 làm α tăng từ 0,645 lên 0,705, tức câu 3 làm giảm độ tin cậy).
- Nếu một câu gồm nhiều ý/cột điểm thì gộp theo cột `Câu` trong Config trước khi tính p, d, α.

**Bảng phân loại** (QĐ450 cho phép Khoa điều chỉnh, nên đặt trong `QUY_TAC`):

| Độ khó p    | Mức           | Độ phân biệt d | Mức             | Độ tin cậy α  | Mức                 |
| :---------- | :------------ | :------------- | :-------------- | :------------ | :------------------ |
| ≥ 0,8       | Dễ            | 0,7 ≤ d ≤ 1    | Rất tốt         | ≥ 0,85        | Rất cao             |
| 0,6 – < 0,8 | Trung bình    | 0,4 – < 0,7    | Tốt             | 0,80 – < 0,85 | Cao                 |
| 0,4 – < 0,6 | Tương đối khó | 0,2 – < 0,4    | Đủ độ phân biệt | 0,70 – < 0,80 | Đủ độ tin cậy       |
| 0,2 – < 0,4 | Khó           | 0 – < 0,2      | Yếu             | 0,60 – < 0,70 | Yếu                 |
| < 0,2       | Rất khó       | < 0            | Nên loại bỏ     | ≤ 0,60        | Không đủ độ tin cậy |

Với α, QĐ450 ghi chồng lấn tại đúng 0,60 (vừa "Yếu" vừa "Không đủ"); áp dụng **"≤ 0,60 là Không đủ độ tin cậy"**.

**Cảnh báo cỡ mẫu:** lớp ít SV thì d và α kém tin cậy (30 SV → mỗi nhóm 27% chỉ khoảng 8 người; chia 2 mã đề thì còn ít hơn). In cảnh báo khi $N < 30$ (đặt trong `QUY_TAC`).

---

## III. THIẾT KẾ ĐẦU VÀO (INPUT)

### 1. Input 1: File Config học phần (`config_course.xlsx`)

Làm một lần cho mỗi học phần. Gồm 7 sheet:

| Sheet               | Nội dung                                                   | Cột chính                                                                                                                                |
| :------------------ | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| `HOC_PHAN`          | Thông tin chung                                            | Mã HP, Tên HP, Số tín chỉ, Hình thức thi, `Loai_HP` (`thuong` / `thuc_hanh`)                                                             |
| `CLO_LIST`          | Danh sách CLO                                              | Mã CLO, Nội dung, Bậc năng lực dạng `bậc/thang` (ví dụ `3/6`, `3/5`), `Trọng số CLO` (tùy chọn)                                          |
| `KE_HOACH_DANH_GIA` | Kế hoạch đánh giá (Bảng 3/4 trong QĐ450 và Mẫu Excel 2026) | Nhóm (`CC`/`GK`/`CK`), Thành phần, **Mã đầu điểm**, CLO, **Trọng số %**, Hình thức. **Một dòng cho mỗi cặp (đầu điểm, CLO).** |
| `CAU_HOI`           | Ma trận cột điểm ↔ CLO                                     | **Mã cột điểm**, Mã đầu điểm, Câu (để gộp ý), CLO, Điểm tối đa, Mã đề (tùy chọn, mặc định `ALL`), Loại (`TL`/`TN`)                       |
| `MA_TRAN_PLO`       | Ánh xạ CLO → PI → PLO (Bảng 2 trong QĐ450)                 | PLO, PI, CLO                                                                                                                             |
| `DIEM_DANH`         | Mã điểm danh và hệ số (mặc định lấy từ Mẫu Excel 2026)     | `X`=1, `OL`=1, `M`=0,5, `V-CP`=0,5, `V`=0                                                                                                |
| `QUY_TAC`           | Tham số nghiệp vụ                                          | `rounding_mode`, `clo_bo_phan`, `hp_method`, ngưỡng đạt CLO/HP/PLO, tỷ lệ nhóm 27%, ngưỡng cỡ mẫu, các bảng phân loại p/d/α              |

**Ghi chú thiết kế:**

- Chuyên cần và thái độ học tập được gắn CLO như mọi đầu điểm khác (QĐ450: CC → CLO3.1; Mẫu Excel 2026: CC → CLO2 và CLO3, thái độ → CLO4), nên nằm trong `KE_HOACH_DANH_GIA`.
- `CAU_HOI` xử lý câu hỏi đo nhiều CLO bằng cách tách cột (mỗi cột một CLO) và hỗ trợ đề thi nhiều mã đề.
- "Trình độ năng lực" có dạng `bậc/thang` (QĐ450 dùng 3/6, 3/5, 4/5), không phải một số đơn.

### 2. Input 2: File điểm thô của lớp (`raw_grades.xlsx`, sheet `NHAP_LIEU`)

| Nhóm cột                                     | Nội dung                                                                                  | Ghi chú                                                                          |
| :------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| Thông tin lớp (các ô có nhãn phía trên bảng) | Lớp, Giảng viên, Học kỳ, Năm học                                                          | Tên học phần lấy từ Config, không nhập lại                                       |
| Cột cố định                                  | `TT`, `Mã SV`, `Họ`, `Tên` (hoặc `Họ và tên`), `Ngày sinh`, `Mã đề` (tùy chọn), `Ghi chú` | **`Mã SV` đọc dạng văn bản** (tránh mất số 0 đầu)                                |
| Điểm danh                                    | `Buổi 1` … `Buổi N`, với một hàng ngày học bên trên                                       | Ký hiệu theo `DIEM_DANH`. CC = Σ hệ số / số buổi đã diễn ra × 10                 |
| Thái độ, chuyên cần nhập sẵn                 | Cột thang 10 theo `Mã cột điểm`                                                           | GV có thể nhập điểm CC sẵn thay vì điểm danh                                     |
| Điểm kiểm tra, điểm thi                      | Mỗi cột đúng một `Mã cột điểm` trong `CAU_HOI`                                            | Hàng "Điểm tối đa" nằm ngay dưới hàng tiêu đề, do app điền sẵn khi sinh template |

**Cách giảm lỗi gõ sai tên cột:** app **sinh file `Template_DiemTho.xlsx` từ Config** (tiêu đề cột, điểm tối đa, ô nhập màu vàng, ràng buộc nhập), giảng viên chỉ dán điểm vào. Khi đọc file, app dò tiêu đề theo **tên cột** chứ không theo vị trí hàng/cột cố định, và gợi ý tên gần giống nếu lệch.

### 3. Quy ước ô trống và giá trị đặc biệt

Sinh viên vắng thi, bỏ trống câu, hay được 0 điểm là ba trường hợp khác nhau, ảnh hưởng đến cả điểm lẫn p, d, α:

| Ô nhập       | Ý nghĩa       | Xử lý                                                                                                                                                                         |
| :----------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Số (kể cả 0) | Điểm thật     | Tính bình thường. Chấp nhận cả `2,5` và `2.5`                                                                                                                                 |
| Trống        | **Chưa nhập** | SV bị đánh dấu "thiếu dữ liệu", các chỉ số phụ thuộc ô đó để trống (giống Mẫu Excel 2026), cảnh báo trên preview                                                              |
| `VT`         | Vắng thi      | Điểm = 0 trong CLO/HP; **loại khỏi p, d, α** (không phản ánh chất lượng đề). **Tính vào mẫu số % đạt (cả lớp)** **[Quyết định #5]**; cuối bảng thống kê ghi rõ số SV vắng thi |

---

## IV. THIẾT KẾ ĐẦU RA (OUTPUT)

### 1. Output 1: `final_grades_report.xlsx`

| Sheet               | Nội dung                                                                                                                                                                                                                                                                                 |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BANG_DIEM_QUA_TRINH` | **Đúng mẫu Phụ lục 3 (bản Quá trình):** Học kỳ/Năm học, ô chọn ☑ Quá trình / ☐ Cuối kỳ, tên và mã học phần, lớp, hình thức thi, số tín chỉ; bảng TT, Mã SV, Họ tên, Ngày sinh, CLO1…CLOn, **TBC CLO (bằng số, bằng chữ)**, Ghi chú; chỗ ký Giảng viên. |
| `BANG_DIEM_CUOI_KY`   | **Đúng mẫu Phụ lục 3 (bản Cuối kỳ):** Tương tự bản Quá trình nhưng với ô chọn ☐ Quá trình / ☑ Cuối kỳ, lấy điểm từ bài thi kết thúc học phần (CK). |
| `BANG_DIEM_HOC_VU`  | Theo mẫu "Danh sách điểm danh và ghi điểm" (Mẫu xls/2026): điểm danh từng buổi, số buổi nghỉ quy đổi, điểm ý thức, điểm kiểm tra, điểm thi, Tổng (điểm học phần). Mẫu xls ghi rõ cần **hai loại bảng**: một bảng tính điểm học vụ theo cách cũ, một bảng theo CLO                        |
| `CHI_TIET_CLO`      | Từng SV: điểm $s_{j,k}$ của mọi ô, CLO$_k$, PI, PLO. Dùng để truy xuất minh chứng (Lưu ý QLCL: phương pháp tính phải "có khả năng truy xuất")                                                                                                                                            |
| `TONG_HOP_LO`       | Bảng Đạt / % / Không đạt / % theo từng CLO, "Tổng kết CLO", "Tổng kết học vụ" và PLO (đúng bảng ở tr.33); điểm TB, thấp nhất, cao nhất mỗi CLO; **tô nổi CLO có kết quả thấp**; 2 biểu đồ cột (% SV đạt theo CLO, theo PLO); ô trống "Phân tích và đề xuất cải tiến" cho giảng viên điền |
| `CANH_BAO`          | Danh sách SV thiếu dữ liệu, SV có CLO/PLO dưới ngưỡng (tô màu), các cảnh báo dữ liệu                                                                                                                                                                                                     |

**Ghi chú:**

- Phụ lục 3 không có cột điểm chữ. Cột "Bằng chữ" của TBC CLO được hiểu là **đọc số thành chữ** (6,7 → "Sáu phẩy bảy"; 10 → "Mười"; 0,5 → "Không phẩy năm"), cần tự viết hàm đọc số tiếng Việt **[Quyết định #6]**. Điểm chữ A/B/C để tùy chọn, mặc định tắt.
- Địa danh/ngày ở chân bảng (Mẫu xls ghi "Hải Phòng") để cấu hình được.
- Biểu đồ trong file Excel là **ảnh PNG** do app vẽ bằng Chart.js rồi chèn vào bằng ExcelJS (ExcelJS không tạo được biểu đồ Excel gốc). Dữ liệu nguồn của biểu đồ vẫn nằm ở bảng bên cạnh.

### 2. Output 2: `exam_analysis_report.xlsx` (PDF để `[v1.1]`)

| Sheet                 | Nội dung                                                                                                                                                                                      |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P_D_TUNG_CAU`        | Theo đề/đợt: câu, điểm tối đa, điểm TB, **p + mức độ**, **d + mức độ**, cờ cảnh báo (d < 0, p bất thường)                                                                                     |
| `DO_TIN_CAY`          | α của cả đề + mức độ, "α nếu bỏ câu", số SV, cảnh báo cỡ mẫu nhỏ                                                                                                                              |
| `BAT_THUONG` `[v1.1]` | Theo bảng dấu hiệu bất thường (QĐ450 Điều 5.3): nhiều câu quá dễ/quá khó; điểm thi lệch hẳn điểm quá trình (hệ số tương quan, danh sách SV lệch lớn); kết quả đồng loạt cao/thấp; câu có d âm |
| `GOI_Y_CAI_TIEN`      | Khung theo 5 câu hỏi của Lưu ý QLCL: CLO đo ở đâu, câu nào đo CLO nào và ở mức năng lực nào, bao nhiêu % SV đạt và CLO nào thấp, cần cải tiến gì (GV điền), kết quả sau cải tiến (kỳ sau)     |

Báo cáo này phục vụ QĐ450 Điều 16.2: cuối mỗi học kỳ giảng viên gửi khoa và P.QLCL kết quả phân tích đề thi theo từng lớp, mức đáp ứng CĐR và định hướng cải tiến.

---

## V. KIỂM TRA HỢP LỆ & XỬ LÝ NGOẠI LỆ

Phân biệt **Lỗi** (không cho tính tiếp) và **Cảnh báo** (vẫn tính, ghi vào `CANH_BAO`). Mỗi thông báo phải chỉ rõ vị trí, ví dụ: _"Dòng 12, cột Câu 3: 4,5 > điểm tối đa 3"_.

### 1. Kiểm tra file Config (tính hợp lệ của kế hoạch đánh giá)

|         Loại          | Quy tắc                                                                                        | Căn cứ                                                                                                                                                                         |
| :-------------------: | :--------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|          Lỗi          | Tổng trọng số `KE_HOACH_DANH_GIA` ≠ 100%                                                       | QĐ450 Điều 9.3                                                                                                                                                                 |
|          Lỗi          | Mã CLO ở bất kỳ sheet nào không có trong `CLO_LIST`                                            |                                                                                                                                                                                |
|          Lỗi          | Cặp (đầu điểm, CLO) có trong `CAU_HOI` nhưng không có trong `KE_HOACH_DANH_GIA` (và ngược lại) |                                                                                                                                                                                |
|          Lỗi          | CLO không được đầu điểm nào đo                                                                 | Lưu ý QLCL: mỗi CLO đo ít nhất 1 lần                                                                                                                                           |
|          Lỗi          | Tổng điểm tối đa của một đề thi không bằng thang khai báo (thường 10)                          |                                                                                                                                                                                |
| Cảnh báo (không chặn) | CLO chỉ được đo bằng các đầu điểm thuộc nhóm `CC` (chuyên cần/thái độ)                         | Lưu ý QLCL mục 4: chưa phù hợp với CLO tự chủ, tự học, trách nhiệm. **[Quyết định #7]**: không chặn vì ví dụ Hùng của QĐ450 (CLO3.1) cũng ở trường hợp này; ghi vào `CANH_BAO` |
|       Cảnh báo        | CLO chưa gắn PI/PLO nào trong `MA_TRAN_PLO`                                                    | Lưu ý QLCL; Phụ lục 01 cho phép CLO không tham gia đánh giá PLO                                                                                                                |
|       Cảnh báo        | Điểm tối đa của câu không là bội của 0,25                                                      | QĐ450 Điều 3.1: thang điểm chia nhỏ đến 0,25                                                                                                                                   |
|       Cảnh báo        | Tổng điểm các câu đo CLO tham gia đánh giá PLO ≤ 50% điểm bài thi                              | QĐ450 Điều 3.4                                                                                                                                                                 |

### 2. Kiểm tra file điểm thô

|   Loại   | Quy tắc                                                                                         |
| :------: | :---------------------------------------------------------------------------------------------- |
|   Lỗi    | Thiếu cột điểm đã khai báo trong Config, hoặc có cột lạ; tên cột lệch (kèm gợi ý tên gần giống) |
|   Lỗi    | Điểm nhập > điểm tối đa ($d_i > t_i$) hoặc < 0                                                  |
|   Lỗi    | Thiếu/trùng Mã SV, thiếu họ tên                                                                 |
|   Lỗi    | Ô điểm không phải số (ngoài ký hiệu hợp lệ `VT`)                                                |
| Cảnh báo | Ô trống (chưa nhập); mã điểm danh lạ không có trong `DIEM_DANH`                                 |
| Cảnh báo | Điểm không là bội của 0,25 (với điểm thi)                                                       |
| Cảnh báo | $N < 30$, hoặc nhóm 27% dưới 5 SV (p, d, α kém tin cậy)                                         |

---

## VI. BỘ TEST CHUẨN (GOLDEN TESTS) LẤY TỪ QĐ450

Mọi số dưới đây đã được tính lại độc lập và **khớp với văn bản** ở chế độ `rounding_mode = chain`. Engine chỉ được coi là đúng khi chạy ra các số này.

|  #  | Nguồn                         | Đầu vào                                                    | Kết quả phải ra                                                                                                                                       |
| :-: | :---------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | QĐ450 tr.4, Ví dụ 1–2         | 62/100 SV đúng; câu max 3, TB 2,4                          | p = 0,62; p = 0,8                                                                                                                                     |
| T2  | tr.5, Ví dụ 3                 | 15 SV, nhóm 27% = 4 SV, nhóm trên đúng 4, nhóm dưới đúng 2 | d = 0,5                                                                                                                                               |
| T3  | tr.6, Ví dụ 4                 | Điểm câu 3 của 15 SV, max 2                                | d = 0,25                                                                                                                                              |
| T4  | tr.7–8, Ví dụ 5               | Ma trận điểm 15 SV × 5 câu                                 | TB câu: 2,47 / 2,37 / 1,43 / 0,67 / 0,53; phương sai: 0,1952 / 0,1595 / 0,1738 / 0,1667 / 0,1595; tổng 0,8548; σ²tổng = 1,7667; **α = 0,65** (0,6452) |
| T5  | tr.32–33, SV Hùng (quá trình) | CC 10, tự học 7,5, KT1 và KT2 như bảng                     | CLO thành phần quá trình: 8,8 / 7,5 / 6,3 / 7,3 / 6,7 / 5,0 / 7,5                                                                                     |
| T6  | tr.32, SV Hùng (cuối kỳ)      | Điểm đạt và điểm tối đa từng CLO                           | 7,1 / 6,0 / 7,3 / 5,0 / 7,5 / 2,5 (TB 5,9)                                                                                                            |
| T7  | tr.32–33                      | Trọng số GK 0,3, CK 0,5                                    | CLO1.1…CLO3.1 = 7,3 / 6,1 / 7,3 / 5,6 / 6,6 / 4,4 / 8,8; **TBC CLO = 6,6**                                                                            |
| T8  | tr.32–33                      | $C_{cc}=8{,}8$; $C_{gk}=6{,}7$; $C_{ck}=5{,}9$             | **Điểm HP = 6,7** (`QD450`)                                                                                                                           |
| T9  | tr.33                         |                                                            | PLO3 = 6,6; PLO5 = 6,6; PLO6 = 4,4; PLO9 = 8,8                                                                                                        |
| T10 | Làm tròn                      | 6,25; 8,75                                                 | 6,3; 8,8 (`decimal.js` HALF_UP)                                                                                                                       |
| T11 | Mẫu xls, bảng quá trình       | KT1 câu 2: 2/5 (CLO2); KT2 câu 1: 3/4 (CLO2)               | CLO2 = (4,0 + 7,5)/2 = 5,75 trước khi làm tròn → **5,8** theo chế độ `chain` (file xls hiển thị 2 chữ số)                                             |
| T12 | tr.32, TB quá trình của Hùng  | (8,8 + 6,7)/2                                              | 7,75 → **7,8** (dùng số đã làm tròn)                                                                                                                  |

**Lưu ý khi dùng Mẫu xls làm test:** sheet "Cách tính CLO" ghi CLO3 của SV Nguyễn Văn A là **8,3**, nhưng theo chính trọng số 0,4/0,6 của ví dụ đó thì phải là 0,4 × 6,667 + 0,6 × 10 = **8,7** (8,3 là kết quả của trọng số 0,5/0,5). Coi đây là ví dụ nhầm; không dùng làm test **[Quyết định #8]**.

---

## VII. CÁC QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ CHỐT

Những chỗ văn bản chưa nói rõ đã được chọn như sau. Tất cả đều là tham số trong `QUY_TAC` nên đổi sau không phải sửa code.

|  #  | Vấn đề                               | Quyết định                                                                                                                           | Ghi chú                                                                                          |
| :-: | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
|  1  | Cách tính điểm học phần              | Theo QĐ450 Điều 9.3: $0{,}2\,C_{cc} + 0{,}3\,C_{gk} + 0{,}5\,C_{ck}$, mỗi $C$ là trung bình cộng các CLO của nhóm (ví dụ Hùng = 6,7) | `hp_method = QD450`. Nên hỏi P.QLCL xem hệ thống nhập điểm của trường có tính đúng như vậy không |
|  2  | Ngưỡng "Đạt" của một CLO             | ≥ 4,0                                                                                                                                | Văn bản không nêu; chọn bằng ngưỡng PLO thành phần (Điều 10)                                     |
|  3  | Gộp nhiều câu thành điểm CLO bộ phận | Trung bình các tỷ lệ $d_i/t_i$ (QĐ450 Điều 9.3)                                                                                      | `clo_bo_phan = mean_of_ratios`                                                                   |
|  4  | Làm tròn                             | Từng bước, 1 chữ số, dùng số đã làm tròn cho bước sau                                                                                | `rounding_mode = chain`; khớp ví dụ Hùng và số 7,8                                               |
|  5  | SV vắng thi trong tỷ lệ % đạt        | Tính vào mẫu số (cả lớp), điểm 0; loại khỏi p, d, α                                                                                  | Tạm; ghi số SV vắng thi ở cuối bảng                                                              |
|  6  | "Bằng chữ" ở Phụ lục 3               | Đọc số thành chữ (6,7 → "Sáu phẩy bảy")                                                                                              |                                                                                                  |
|  7  | CLO chỉ đo bằng chuyên cần           | Chỉ cảnh báo, không chặn                                                                                                             | Nên hỏi P.QLCL xem Quyết định 39/2026 có yêu cầu hình thức đánh giá khác không                   |
|  8  | Ví dụ CLO3 = 8,3 trong Mẫu xls       | Coi là ví dụ nhầm                                                                                                                    | Không dùng làm test                                                                              |
|  9  | Sinh viên thiếu điểm (cột trống)     | "Thiếu ở cấp nào thành 0 ở cấp đó": câu trống trong đề nhiều câu = 0 điểm câu (góp tỷ lệ 0 vào TB của ô, ô vẫn được tính); cột trống thang 10 = 0 cả ô. **Giữ nguyên trọng số trong mẫu số** ở mọi cấp (Cbp, CLO, nhóm); vẫn cảnh báo ở CANH_BAO | Nhất quán với cách chấm "câu không trả lời = 0" của trắc nghiệm; kèm cờ `hasMissingData` |

---

## VIII. LỘ TRÌNH THỰC HIỆN & CÔNG NGHỆ

### 1. Các giai đoạn

```
[Tuần 0: Chốt quy tắc + dữ liệu mẫu] → [Tuần 1: Core Engine + Test chuẩn] → [Tuần 2: Thống kê đề thi + Xuất Excel]
                                    → [Tuần 3: Giao diện] → [Tuần 4: Kiểm thử + Đóng gói]
```

**Tuần 0: Chốt quy tắc và dữ liệu (chưa viết code ứng dụng)**

- [x] Chốt tạm quyết định #1 (`hp_method = QD450`) và #7 (CLO chỉ đo bằng CC → cảnh báo, không chặn); vẫn cần P.QLCL xác nhận chính thức.
- [x] Làm `Template_Config.xlsx` (7 sheet + hướng dẫn) và tự sinh `Template_DiemTho.xlsx` từ Config.
- [x] Dùng **dữ liệu mock** (KTLT101, 32 SV, 12 buổi, 3 CLO) thay cho điểm thật đã ẩn danh.
- [x] Dựng khung dự án (Electron + TypeScript + React) và chạy được cửa sổ.

**Tuần 1: Core Engine (chạy bằng test, chưa cần giao diện)**

- [x] `models`, `rules` (đọc `QUY_TAC`, làm tròn `decimal.js`), `excelParser`, `validator`.
- [x] `cloCalculator`: gom điểm theo ô (đầu điểm, CLO), CLO học phần, TBC CLO, điểm học phần (`QD450`, kèm tùy chọn `RAW_POINTS`), PI/PLO.
- [x] **Bộ test T5–T12 chạy xanh** trước khi sang bước sau.

**Tuần 2: Thống kê và xuất file**

- [x] `psychometrics`: p, d, α, "α nếu bỏ câu", cảnh báo cỡ mẫu. Bộ test T1–T4 chạy xanh.
- [x] `exporter`: `BANG_DIEM_QUA_TRINH` (bản Quá trình) + `BANG_DIEM_CUOI_KY` (bản Cuối kỳ) theo Phụ lục 3, `BANG_DIEM_HOC_VU`, `CHI_TIET_CLO`, `TONG_HOP_LO`, `CANH_BAO`; tô màu SV cảnh báo.
- [x] Biểu đồ: vẽ PNG bằng `@napi-rs/canvas` (offline), chèn vào sheet `TONG_HOP_LO`.
- [x] Hàm đọc số thành chữ tiếng Việt cho cột "Bằng chữ".

**Tuần 3: Giao diện**

- [ ] Màn hình chính: thanh bên với các tab (`1. Lập bảng điểm`, `2. Kiểm định đề thi`, `3. Hướng dẫn / Cài đặt`).
- [x] Màn "Lập bảng điểm": chọn file Config, chọn file điểm thô, khung tóm tắt (tên HP, số tín chỉ, số SV, số CLO phát hiện được, danh sách cảnh báo), nút **[ TÍNH TOÁN & THỐNG KÊ ]**.
- [ ] Preview kết quả: bảng SV × CLO/điểm HP, biểu đồ % đạt, **bảng lỗi theo ô và cho sửa trực tiếp**.
- [x] Nút xuất: `[ XUẤT EXCEL BẢNG ĐIỂM ]`, `[ XUẤT BÁO CÁO PHÂN TÍCH ĐỀ THI ]`, `[ TẠO FILE MẪU ]`.

**Tuần 4: Kiểm thử, tối ưu, đóng gói**

- [ ] Chạy lại toàn bộ test chuẩn; đối soát với bảng tính tay của 1–2 giảng viên trên dữ liệu thật.
- [ ] Thử các trường hợp biên: lớp rất ít SV, CLO chỉ đo ở một đợt, SV vắng thi, file có ô gộp (merge cells), số thập phân dùng dấu phẩy.
- [ ] Đóng gói bằng `electron-builder` và **thử trên máy chưa cài Node/công cụ lập trình**.

### 2. Công nghệ (techstack)

| Thành phần                | Lựa chọn                                           | Dùng để làm gì                                                                         |
| :------------------------ | :------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Khung ứng dụng desktop    | **Electron** (Node.js LTS)                         | Chạy app trên máy giảng viên, mở hộp thoại chọn file, đọc/ghi file                     |
| Ngôn ngữ                  | **TypeScript**                                     | Bắt lỗi kiểu dữ liệu sớm, quan trọng khi tính điểm                                     |
| Khung dự án & build       | **electron-vite**                                  | Dựng sẵn cấu trúc main/preload/renderer, chạy thử nhanh                                |
| Giao diện                 | **React**                                          | Các màn hình, bảng, form                                                               |
| Bảng dữ liệu có sửa ô     | **AG Grid Community**                              | Bảng preview điểm, sửa ô lỗi tại chỗ                                                   |
| Biểu đồ                   | **@napi-rs/canvas** (vẽ PNG), Chart.js dự phòng cho UI | Biểu đồ trong app; xuất PNG để chèn vào Excel                                          |
| Đọc/ghi Excel             | **ExcelJS**                                        | Đọc Config và điểm thô; ghi file kết quả đúng mẫu (định dạng, tô màu, ô gộp, chèn ảnh) |
| Làm tròn, tính toán số    | **decimal.js**                                     | Làm tròn half-up chính xác theo QĐ450                                                  |
| Kiểm tra cấu trúc dữ liệu | **zod**                                            | Kiểm tra Config đọc vào đúng cấu trúc trước khi tính                                   |
| Kiểm thử                  | **Vitest**                                         | Chạy bộ test chuẩn T1–T12                                                              |
| Đóng gói                  | **electron-builder**                               | Tạo file cài đặt/`.exe` cho Windows                                                    |
| Xuất PDF `[v1.1]`         | `printToPDF` có sẵn của Electron                   | In trang báo cáo HTML ra PDF                                                           |
| Lưu cài đặt nhỏ           | File JSON trong thư mục dữ liệu người dùng của app | Nhớ thư mục/file lần trước, không cần database                                         |

**Không cần backend.** Electron gồm hai phần chạy trong cùng một app:

- **Main process** (Node.js): được phép đọc/ghi file trên máy, mở hộp thoại, gọi engine.
- **Renderer** (React): chỉ hiển thị và nhận thao tác. Hai phần nói chuyện qua cơ chế gọi hàm nội bộ (IPC), không có cổng mạng hay API.

**Nguyên tắc cấu trúc quan trọng hơn việc chọn thư viện:** thư mục `core/` chỉ chứa hàm thuần (nhận dữ liệu vào, trả kết quả ra), **không import gì của Electron hay React**. Nhờ vậy test được bằng Vitest ngay từ Tuần 1, và đổi giao diện sau này không phải viết lại phần tính.

```text
clo-plo-app/
├── src/
│   ├── core/                  # Engine thuần TypeScript, không phụ thuộc Electron/React
│   │   ├── models.ts          # Course, CLO, Plan, Student...
│   │   ├── rules.ts           # Đọc QUY_TAC, làm tròn decimal.js HALF_UP
│   │   ├── excelParser.ts     # Đọc Config + điểm thô (dò tiêu đề theo tên cột)
│   │   ├── validator.ts       # Các quy tắc ở mục V
│   │   ├── cloCalculator.ts   # s(j,k), CLO, TBC CLO, điểm HP, PI/PLO
│   │   ├── psychometrics.ts   # p, d, alpha
│   │   └── exporter.ts        # Xuất Excel theo mẫu
│   ├── main/                  # Electron main: hộp thoại file, đọc/ghi file, IPC
│   ├── preload/               # Cầu nối an toàn main ↔ renderer
│   └── renderer/              # Giao diện React (views/, components/)
├── resources/                 # Template_Config.xlsx, mẫu Phụ lục 3, icon
├── tests/
│   ├── goldenQd450.test.ts    # T1–T12 ở mục VI
│   └── fixtures/              # Dữ liệu ví dụ trong QĐ450
└── package.json
```

Cần xác nhận hệ điều hành của giảng viên (chỉ Windows hay có cả macOS) trước khi đóng gói.

---

## IX. QUẢN LÝ RỦI RO

| STT | Rủi ro                                          | Nguyên nhân                                                                         | Biện pháp                                                                                  |
| :-: | :---------------------------------------------- | :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
|  1  | Lỗi định dạng Excel                             | GV xóa cột, thêm hàng trống, gộp ô, đổi tên cột                                     | Dò tiêu đề theo tên; app tự sinh template; báo lỗi theo ô kèm gợi ý                        |
|  2  | Sai lệch làm tròn 0,1 điểm                      | Số thực nhị phân của JavaScript; các nguồn làm tròn khác nhau                       | `decimal.js` HALF_UP; tham số `rounding_mode`; test T10, T12                               |
|  3  | Sai kiểu dữ liệu khi dán từ Google Sheets/Excel | Số thập phân dùng dấu phẩy ("2,5"); Mã SV bị đọc thành số (mất số 0); ngày dạng chữ | Chấp nhận cả dấu phẩy và dấu chấm; đọc Mã SV dạng văn bản; kiểm tra ở bước validate        |
|  4  | Quy tắc không thống nhất giữa các tài liệu      | Mẫu Excel 2026 làm tròn 2 chữ số, ngưỡng đạt CLO không có văn bản                   | Các quyết định ở mục VII; mọi tham số đặt trong `QUY_TAC`; đối chiếu dữ liệu thật ở Tuần 0 |
|  5  | Quy định thay đổi                               | QĐ450 có thể điều chỉnh; Lưu ý QLCL mới dẫn Quyết định 39/2026                      | Không hard-code ngưỡng/công thức; ghi phiên bản `QUY_TAC` vào mỗi báo cáo                  |
|  6  | Cỡ mẫu nhỏ làm d, α thiếu tin cậy               | Lớp ít SV, hoặc chia nhiều mã đề                                                    | Cảnh báo $N<30$ trong báo cáo                                                              |
|  7  | Windows Defender cảnh báo nhầm file cài đặt     | File đóng gói mới, chưa ký số                                                       | Ký số (nếu có điều kiện) hoặc hướng dẫn "Run anyway" / thêm ngoại lệ lần đầu               |
|  8  | File cài nặng, tốn RAM                          | Đặc điểm của Electron (bản đóng gói thường vài trăm MB)                             | Chấp nhận được cho máy giảng viên; không nhúng thêm runtime khác                           |

---

## X. SẢN PHẨM BÀN GIAO

- [ ] File cài đặt/chạy của ứng dụng (tên dự kiến `CLO_PLO_Evaluator`), không cần cài thêm gì.
- [ ] `Template_Config.xlsx` kèm một học phần mẫu đã điền; `Template_DiemTho.xlsx` (do app sinh từ Config).
- [ ] Bộ dữ liệu ví dụ SV Nguyễn Văn Hùng (QĐ450 Phụ lục 4) và các ví dụ p, d, α để GV và P.QLCL tự kiểm tra.
- [ ] Bảng quy tắc tính (1–2 trang) đã được P.QLCL xác nhận, ứng với `QUY_TAC` mặc định.
- [ ] Hướng dẫn sử dụng (`.pdf`, có hình minh họa).
- [ ] Mã nguồn và bộ test chuẩn trên Git repository.
