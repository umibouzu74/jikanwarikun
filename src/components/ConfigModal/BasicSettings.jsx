import React from 'react';
import { useProjectContext } from '../../contexts/projectContextValue';

export default function BasicSettings() {
  const {
    activeTab,
    currentConfig,
    commonSubjects,
    handleListConfigChange,
    handleSubjectCountChange,
    handleSaveAsDefault,
  } = useProjectContext();

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-blue-800 border-b pb-1">📅 カレンダー設定 ({activeTab.name})</h3>
      <div className="bg-blue-50 p-2 text-xs text-blue-800 border border-blue-200 rounded">
        <strong>便利機能:</strong> カレンダーの日付やクラス名を右クリックすると、名称を変更できます（データも引き継がれます）。<br />
        現在の設定を保存したい場合は、下の「現在の設定を初期値にする」ボタンを押してください。
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500">日付 (カンマ区切り)</label>
        <textarea className="w-full border p-2 text-sm h-20 rounded" value={currentConfig.dates.join(", ")} onChange={(e) => handleListConfigChange('dates', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500">時限 (カンマ区切り)</label>
        <textarea className="w-full border p-2 text-sm h-16 rounded" value={currentConfig.periods.join(", ")} onChange={(e) => handleListConfigChange('periods', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500">クラス (カンマ区切り)</label>
        <textarea className="w-full border p-2 text-sm h-16 rounded" value={currentConfig.classes.join(", ")} onChange={(e) => handleListConfigChange('classes', e.target.value)} />
      </div>
      <div className="bg-orange-50 p-2 rounded border border-orange-100">
        <label className="text-xs font-bold text-orange-800">必要コマ数 (目標)</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {commonSubjects.map(s => (
            <div key={s} className="flex justify-between bg-white p-1 border rounded">
              <span className="text-xs font-bold">{s}</span>
              <input type="number" className="w-12 text-right text-sm" value={currentConfig.subjectCounts[s] || 0} onChange={(e) => handleSubjectCountChange(s, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
      <div className="pt-2">
        <button onClick={() => { if (window.confirm("現在の「講師設定」と「カレンダー構成」を初期値として保存しますか？\n次回リセット時にこの設定が読み込まれます。")) { handleSaveAsDefault(); alert("✅ 保存しました。\n次回からこの設定が初期値になります。"); } }} className="w-full py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 shadow-sm text-sm">
          💾 現在の設定を初期値にする
        </button>
      </div>
    </div>
  );
}
