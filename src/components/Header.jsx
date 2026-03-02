import React from 'react';
import { useProjectContext } from '../contexts/projectContextValue';
import { downloadScheduleExcel, downloadTeacherExcel } from '../utils/excelExport';

export default function Header() {
  const {
    project,
    saveStatus,
    fileInputRef,
    handleSaveJson,
    handleLoadJson,
  } = useProjectContext();

  return (
    <div className="flex justify-between items-center mb-2 no-print bg-white p-3 rounded shadow-sm border-b border-gray-200">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-700">📅 時間割作成くん v45</h1>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">{saveStatus}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSaveJson} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow text-sm font-bold">💾 プロジェクト保存</button>
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 shadow text-sm font-bold">📂 開く</button>
        <button onClick={() => downloadScheduleExcel(project)} className="flex items-center gap-1 px-3 py-1.5 bg-green-800 text-white rounded hover:bg-green-900 shadow text-sm font-bold">📊 全Excel</button>
        <button onClick={() => downloadTeacherExcel(project)} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 shadow text-sm font-bold">👤 個人Excel</button>
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadJson} className="hidden" />
      </div>
    </div>
  );
}
