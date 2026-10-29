import React from 'react'
import { formatDateTime, formatPercent, formatScore } from '@renderer/lib/format'
import type { RunHistoryEntryDto, RunSnapshotDto, SessionDto } from '../../../shared/ipc'

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="mt-5 mb-1.5 border-b border-neutral-400 pb-0.5 text-[12px] font-bold tracking-wide uppercase">
      {children}
    </h2>
  )
}

const th = 'border border-neutral-400 bg-neutral-100 px-1.5 py-1 text-left font-semibold'
const td = 'border border-neutral-400 px-1.5 py-1 align-top'

/**
 * Báo cáo chỉ hiển thị khi in (Ctrl/⌘+P hoặc xuất PDF).
 * Nội dung dùng bảng thuần để in ổn định, không phụ thuộc biểu đồ SVG.
 */
export function PrintReport({
  snapshot,
  session,
  run
}: {
  snapshot: RunSnapshotDto
  session: SessionDto
  run: RunHistoryEntryDto
}): React.ReactElement {
  const { config, summary, students } = snapshot
  const now = new Date()
  const cloRows = Object.values(summary.cloStats)
  const ploRows = Object.values(summary.ploStats)

  return (
    <div className="print-report hidden text-[11px] leading-relaxed text-black print:block">
      {/* ===== Tiêu đề ===== */}
      <div className="border-b-2 border-black pb-3 text-center">
        <p className="text-[10px] font-semibold tracking-wide uppercase">
          Trường Đại học Thành Đông
        </p>
        <h1 className="mt-1 text-[18px] font-bold uppercase">
          Báo cáo đánh giá chuẩn đầu ra học phần
        </h1>
        <p className="mt-0.5 text-[10px]">
          Theo Quyết định số 450/QĐ-ĐHTĐ ngày 07/8/2024 — Hệ thống clo-tool
        </p>
      </div>

      {/* ===== I. Thông tin học phần ===== */}
      <SectionTitle>I. Thông tin học phần</SectionTitle>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className={`${th} w-32`}>Mã học phần</td>
            <td className={td}>{session.maHp}</td>
            <td className={`${th} w-32`}>Lớp</td>
            <td className={td}>{session.lop ?? '—'}</td>
          </tr>
          <tr>
            <td className={th}>Tên học phần</td>
            <td className={td} colSpan={3}>
              {session.courseName}
            </td>
          </tr>
          <tr>
            <td className={th}>Số tín chỉ</td>
            <td className={td}>{session.soTinChi}</td>
            <td className={th}>Hình thức thi</td>
            <td className={td}>{config.courseInfo.hinhThucThi || '—'}</td>
          </tr>
          <tr>
            <td className={th}>Học kỳ</td>
            <td className={td}>{session.hocKy ?? '—'}</td>
            <td className={th}>Năm học</td>
            <td className={td}>{session.namHoc ?? '—'}</td>
          </tr>
          <tr>
            <td className={th}>Giảng viên</td>
            <td className={td}>{session.giangVien ?? '—'}</td>
            <td className={th}>Ngày xuất</td>
            <td className={td}>{formatDateTime(run.ts)}</td>
          </tr>
          <tr>
            <td className={th}>Ngưỡng đạt CLO</td>
            <td className={td}>{formatScore(config.quyTac.nguong_dat_clo)}</td>
            <td className={th}>Ngưỡng đạt PLO</td>
            <td className={td}>{formatScore(config.quyTac.nguong_dat_plo)}</td>
          </tr>
          <tr>
            <td className={th}>Ngưỡng đạt HP</td>
            <td className={td}>{formatScore(config.quyTac.nguong_dat_hp)}</td>
            <td className={th}>Phương thức tính</td>
            <td className={td}>{config.quyTac.hp_method}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== II. Kết quả chung ===== */}
      <SectionTitle>II. Kết quả chung</SectionTitle>
      <table className="w-full table-fixed border-collapse text-center text-[11px]">
        <colgroup>
          {Array.from({ length: 8 }).map((_, index) => (
            <col key={index} style={{ width: '12.5%' }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={th}>Sĩ số</th>
            <th className={th}>Đạt học phần</th>
            <th className={th}>Tỷ lệ đạt</th>
            <th className={th}>Điểm TB</th>
            <th className={th}>Thấp nhất</th>
            <th className={th}>Cao nhất</th>
            <th className={th}>Vắng thi</th>
            <th className={th}>Thiếu điểm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={td}>{summary.totalStudents}</td>
            <td className={td}>{summary.courseStat.passedCount}</td>
            <td className={td}>{formatPercent(summary.courseStat.passedPercent)}</td>
            <td className={td}>{formatScore(summary.courseStat.mean)}</td>
            <td className={td}>{formatScore(summary.courseStat.min)}</td>
            <td className={td}>{formatScore(summary.courseStat.max)}</td>
            <td className={td}>{summary.absentStudents}</td>
            <td className={td}>{summary.missingDataStudents}</td>
          </tr>
        </tbody>
      </table>

      {summary.generalWarnings.length > 0 ? (
        <ul className="mt-1.5 list-disc pl-5 text-[10.5px]">
          {summary.generalWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {/* ===== III. CLO ===== */}
      <div className="break-inside-avoid">
        <SectionTitle>III. Tỷ lệ đạt theo chuẩn đầu ra học phần (CLO)</SectionTitle>
        <table className="w-full table-fixed border-collapse text-[11px]">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '21%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={`${th} w-14`}>CLO</th>
              <th className={th}>Nội dung</th>
              <th className={`${th} w-16 text-center`}>Đạt</th>
              <th className={`${th} w-16 text-center`}>% đạt</th>
              <th className={`${th} w-14 text-center`}>TB</th>
              <th className={`${th} w-14 text-center`}>Min</th>
              <th className={`${th} w-14 text-center`}>Max</th>
              <th className={`${th} w-24`}>Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {cloRows.map((stat) => {
              const content = config.cloList.find((clo) => clo.maClo === stat.maClo)?.noiDung ?? '—'
              return (
                <tr key={stat.maClo}>
                  <td className={`${td} font-mono`}>{stat.maClo}</td>
                  <td className={td}>{content}</td>
                  <td className={`${td} text-center`}>{stat.passedCount}</td>
                  <td className={`${td} text-center`}>{formatPercent(stat.passedPercent)}</td>
                  <td className={`${td} text-center`}>{formatScore(stat.mean)}</td>
                  <td className={`${td} text-center`}>{formatScore(stat.min)}</td>
                  <td className={`${td} text-center`}>{formatScore(stat.max)}</td>
                  <td className={td}>
                    {stat.isBelowThreshold
                      ? `Dưới ngưỡng ${formatPercent(config.quyTac.ty_le_dat_clo_canh_bao)}`
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ===== IV. PLO ===== */}
      <div className="break-inside-avoid">
        <SectionTitle>IV. Tỷ lệ đạt theo chuẩn đầu ra chương trình (PLO)</SectionTitle>
        {ploRows.length === 0 ? (
          <p className="text-[10.5px] italic">Học phần chưa khai báo PLO.</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-[11px]">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={`${th} w-20`}>PLO</th>
                <th className={`${th} w-20 text-center`}>Đạt</th>
                <th className={`${th} w-20 text-center`}>% đạt</th>
                <th className={`${th} w-20 text-center`}>TB</th>
              </tr>
            </thead>
            <tbody>
              {ploRows.map((stat) => (
                <tr key={stat.plo}>
                  <td className={`${td} font-mono`}>{stat.plo}</td>
                  <td className={`${td} text-center`}>{stat.passedCount}</td>
                  <td className={`${td} text-center`}>{formatPercent(stat.passedPercent)}</td>
                  <td className={`${td} text-center`}>{formatScore(stat.mean)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== V. Đề thi ===== */}
      <div className="break-inside-avoid">
        <SectionTitle>V. Độ tin cậy đề thi (Cronbach Alpha)</SectionTitle>
        {snapshot.exams.length === 0 ? (
          <p className="text-[10.5px] italic">Không có dữ liệu phân tích đề thi.</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-[11px]">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '39%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={th}>Đầu điểm</th>
                <th className={th}>Mã đề</th>
                <th className={`${th} text-center`}>Số SV</th>
                <th className={`${th} text-center`}>Số câu</th>
                <th className={`${th} text-center`}>Cronbach α</th>
                <th className={th}>Mức độ tin cậy</th>
                <th className={th}>Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.exams.map((exam) => (
                <tr key={`${exam.maDauDiem}-${exam.maDe}`}>
                  <td className={td}>{exam.maDauDiem}</td>
                  <td className={td}>{exam.maDe}</td>
                  <td className={`${td} text-center`}>{exam.soSinhVien}</td>
                  <td className={`${td} text-center`}>{exam.soCauHoi}</td>
                  <td className={`${td} text-center`}>{formatScore(exam.cronbachAlpha)}</td>
                  <td className={td}>{exam.mucDoTinCay}</td>
                  <td className={td}>{exam.canhBaoCoMauN ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== Chữ ký ===== */}
      <div className="mt-6 flex break-inside-avoid justify-end">
        <div className="text-center text-[11px]">
          <p className="italic">
            Ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
          </p>
          <p className="mt-1 font-semibold">Giảng viên phụ trách</p>
          <p className="mt-14">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>

      {/* ===== Phụ lục: danh sách sinh viên ===== */}
      <section className="break-before-page">
        <SectionTitle>Phụ lục. Danh sách sinh viên</SectionTitle>
        <table className="w-full table-fixed border-collapse text-[10.5px]">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={`${th} w-8 text-center`}>TT</th>
              <th className={`${th} w-20`}>Mã SV</th>
              <th className={th}>Họ tên</th>
              <th className={`${th} w-12 text-center`}>CC</th>
              <th className={`${th} w-12 text-center`}>GK</th>
              <th className={`${th} w-12 text-center`}>CK</th>
              <th className={`${th} w-16 text-center`}>TBC CLO</th>
              <th className={`${th} w-16 text-center`}>Điểm HP</th>
              <th className={`${th} w-24 text-center`}>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.maSv} className="break-inside-avoid">
                <td className={`${td} text-center`}>{student.tt}</td>
                <td className={`${td} font-mono`}>{student.maSv}</td>
                <td className={td}>{student.hoTen}</td>
                <td className={`${td} text-center`}>
                  {formatScore(student.groupScores.CC?.score)}
                </td>
                <td className={`${td} text-center`}>
                  {formatScore(student.groupScores.GK?.score)}
                </td>
                <td className={`${td} text-center`}>
                  {formatScore(student.groupScores.CK?.score)}
                </td>
                <td className={`${td} text-center`}>{formatScore(student.tbcClo)}</td>
                <td className={`${td} text-center font-semibold`}>
                  {formatScore(student.courseScore)}
                </td>
                <td className={`${td} text-center`}>
                  {student.isPassedHp ? 'Đạt' : 'Không đạt'}
                  {student.isAbsentFinal ? ' (vắng thi)' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] italic">
          Tổng cộng: {students.length} sinh viên. Điểm hiển thị theo thang 10, làm tròn half-up.
        </p>
      </section>
    </div>
  )
}
