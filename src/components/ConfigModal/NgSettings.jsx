import React from 'react';
import { useProjectContext } from '../../contexts/projectContextValue';
import { makeNgKey } from '../../utils/scheduleKey';

export default function NgSettings() {
  const {
    project,
    currentConfig,
    toggleTeacherNg,
  } = useProjectContext();

  return (
    <div className="overflow-x-auto">
      <div className="bg-red-50 p-3 mb-4 rounded text-sm text-red-800 border border-red-200">
        <strong>NG一括設定:</strong><br />
        クリックしてNG（赤）/ OK（白）を切り替えます。全タブ共通の設定です。
      </div>
      <table className="w-full border-collapse text-xs whitespace-nowrap">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-100 sticky left-0 z-20">講師名</th>
            {currentConfig.dates.map(d => (
              currentConfig.periods.map(p => (
                <th key={makeNgKey(d, p)} className="border p-1 bg-gray-50 font-normal min-w-[40px] text-center">
                  {d}<br />{p}
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {project.teachers.map((t, idx) => (
            <tr key={t.name}>
              <td className="border p-2 font-bold bg-gray-50 sticky left-0 z-10">{t.name}</td>
              {currentConfig.dates.map(d => (
                currentConfig.periods.map(p => {
                  const k = makeNgKey(d, p);
                  const isNg = t.ngSlots?.includes(k);
                  return (
                    <td
                      key={k}
                      onClick={() => toggleTeacherNg(idx, d, p)}
                      className={`border p-1 text-center cursor-pointer hover:opacity-80 transition-colors ${isNg ? "bg-red-500 text-white font-bold" : "bg-white"}`}
                    >
                      {isNg ? "NG" : ""}
                    </td>
                  );
                })
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
