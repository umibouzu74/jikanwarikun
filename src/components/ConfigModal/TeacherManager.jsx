import React from 'react';
import { useProjectContext } from '../../contexts/projectContextValue';

export default function TeacherManager() {
  const {
    project,
    commonSubjects,
    addTeacher,
    removeTeacher,
    toggleTeacherSubject,
  } = useProjectContext();

  return (
    <div className="border-l pl-6 space-y-4">
      <div className="flex justify-between items-center border-b pb-1">
        <h3 className="font-bold text-green-800">👤 講師マスタ (全タブ共通)</h3>
        <button onClick={() => { const n = prompt("講師名:"); if (n) addTeacher(n); }} className="text-xs bg-green-600 text-white px-2 py-1 rounded shadow">+ 追加</button>
      </div>
      <div className="overflow-y-auto max-h-[400px] border rounded bg-gray-50 p-2">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-1">氏名</th>
              <th className="text-left p-1">担当科目</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {project.teachers.map((t, i) => (
              <tr key={i} className="border-b bg-white last:border-0">
                <td className="p-2 font-bold">{t.name}</td>
                <td className="p-2 flex flex-wrap gap-1">
                  {commonSubjects.map(s => (
                    <label key={s} className={`px-2 py-0.5 border rounded cursor-pointer text-xs select-none transition-colors ${t.subjects.includes(s) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-200"}`}>
                      <input type="checkbox" className="hidden" checked={t.subjects.includes(s)} onChange={() => toggleTeacherSubject(i, s)} />
                      {s}
                    </label>
                  ))}
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => { if (window.confirm("この講師を削除しますか？")) removeTeacher(i); }} className="text-gray-400 hover:text-red-500">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
