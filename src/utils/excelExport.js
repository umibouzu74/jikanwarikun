import * as XLSX from 'xlsx';
import { cleanSchedule } from './constants';

// 全体Excel出力
export function downloadScheduleExcel(project) {
  const cleaned = cleanSchedule(project);
  const wb = XLSX.utils.book_new();
  cleaned.tabs.forEach(tab => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["日付", "時限", ...tab.config.classes],
      ...tab.config.dates.flatMap(d =>
        tab.config.periods.map(p => [
          d, p,
          ...tab.config.classes.map(c => {
            const e = tab.schedule[`${d}-${p}-${c}`];
            return e && e.subject ? `${e.subject}\n${e.teacher}` : "";
          })
        ])
      )
    ]);
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }, ...tab.config.classes.map(() => ({ wch: 20 }))];
    XLSX.utils.book_append_sheet(wb, ws, tab.name);
  });
  XLSX.writeFile(wb, "時間割全体.xlsx");
}

// 講師別Excel出力
export function downloadTeacherExcel(project) {
  const wb = XLSX.utils.book_new();
  const allRows = [["講師名", "日付", "時限", "クラス", "科目", "タブ名"]];
  project.teachers.forEach(t => {
    const personalRows = [["日付", "時限", "クラス", "科目", "場所(タブ)"]];
    project.tabs.forEach(tab => {
      tab.config.dates.forEach(d => {
        tab.config.periods.forEach(p => {
          tab.config.classes.forEach(c => {
            const k = `${d}-${p}-${c}`;
            const entry = tab.schedule[k];
            if (entry && entry.teacher === t.name) {
              const row = [d, p, c, entry.subject, tab.name];
              personalRows.push(row);
              allRows.push([t.name, ...row]);
            }
          });
        });
      });
    });
    if (personalRows.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(personalRows);
      ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }];
      const safeName = t.name.replace(/[\\/:?*[\]]/g, "").substring(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    }
  });
  const wsAll = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, wsAll, "全講師リスト");
  XLSX.writeFile(wb, "講師別時間割.xlsx");
}
