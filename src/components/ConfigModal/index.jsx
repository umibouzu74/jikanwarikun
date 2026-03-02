import React, { useState } from 'react';
import { useProjectContext } from '../../contexts/projectContextValue';
import BasicSettings from './BasicSettings';
import TeacherManager from './TeacherManager';
import ClassPriority from './ClassPriority';
import ExternalCounts from './ExternalCounts';
import NgSettings from './NgSettings';

export default function ConfigModal({ onClose }) {
  const [configTab, setConfigTab] = useState('basic');
  const { handleResetAll } = useProjectContext();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 no-print">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-700">⚙️ 設定メニュー</h2>
          <button onClick={onClose} className="text-2xl font-bold text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="flex gap-4 px-6 pt-4 border-b">
          <button onClick={() => setConfigTab('basic')} className={`pb-2 font-bold ${configTab === 'basic' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>基本設定</button>
          <button onClick={() => setConfigTab('classes')} className={`pb-2 font-bold ${configTab === 'classes' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>🏫 クラス優先度</button>
          <button onClick={() => setConfigTab('external')} className={`pb-2 font-bold ${configTab === 'external' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>📅 他学年・午前</button>
          <button onClick={() => setConfigTab('ng')} className={`pb-2 font-bold ${configTab === 'ng' ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}>🚫 日時NG</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {configTab === 'external' ? (
            <ExternalCounts />
          ) : configTab === 'ng' ? (
            <NgSettings />
          ) : configTab === 'classes' ? (
            <ClassPriority />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <BasicSettings />
              <TeacherManager />
            </div>
          )}
          <div className="mt-6 border-t pt-4 text-right">
            <button onClick={() => { if (window.confirm("全データ削除しますか？")) handleResetAll(); }} className="text-xs text-red-500 hover:text-red-700 underline">⚠️ すべてのデータをリセット</button>
          </div>
        </div>
      </div>
    </div>
  );
}
