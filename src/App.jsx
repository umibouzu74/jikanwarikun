import React, { useState, useMemo, useRef } from 'react';

// --- 初期設定データ (リセットした時のデフォルト値) ---
const DEFAULT_CONFIG = {
  dates: ["12/25(木)", "12/26(金)", "12/27(土)", "12/28(日)"],
  periods: ["1限 (13:00~)", "2限 (14:10~)", "3限 (15:20~)"],
  classes: ["Sクラス", "Aクラス", "Bクラス", "Cクラス"],
  teachers: ["未定", "堀上", "片岡", "井上", "半田", "松川", "野口", "三宮", "杉原", "小松", "石原", "高松", "滝澤"],
  subjects: ["英語", "数学", "国語", "理科", "社会"]
};

export default function ScheduleApp() {
  // スケジュールデータ
  const [schedule, setSchedule] = useState({});
  // 設定データ（日付や講師リストなど）もStateで管理する
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  // 設定画面の表示ON/OFF
  const [showConfig, setShowConfig] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- データの操作関数 ---
  const handleAssign = (date, period, className, type, value) => {
    const key = `${date}-${period}-${className}`;
    setSchedule(prev => ({
      ...prev,
      [key]: { ...prev[key], [type]: value }
    }));
  };

  // --- 設定変更用関数 ---
  const handleConfigChange = (key, valueString) => {
    // カンマ区切りの文字列を配列に変換して保存
    const newArray = valueString.split(',').map(s => s.trim()).filter(s => s !== "");
    setConfig(prev => ({ ...prev, [key]: newArray }));
  };

  // --- 重複チェックロジック ---
  const conflicts = useMemo(() => {
    const conflictMap = {}; 
    config.dates.forEach(date => {
      config.periods.forEach(period => {
        const teacherCounts = {};
        config.classes.forEach(cls => {
          const key = `${date}-${period}-${cls}`;
          const teacher = schedule[key]?.teacher;
          if (teacher && teacher !== "未定" && config.teachers.includes(teacher)) {
             teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1;
          }
        });
        Object.keys(teacherCounts).forEach(t => {
          if (teacherCounts[t] > 1) {
            conflictMap[`${date}-${period}-${t}`] = true;
          }
        });
      });
    });
    return conflictMap;
  }, [schedule, config]);

  // --- 保存機能 (設定も含めて保存するように変更) ---
  const handleSaveJson = () => {
    // スケジュールと現在の設定をセットにして保存
    const saveData = {
      version: 2, // バージョン管理用
      config: config,
      schedule: schedule
    };
    const dataStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_v2_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- 読込機能 (設定があればそれも復元) ---
  const handleLoadJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        
        // 新しい形式（設定入り）か、古い形式（スケジュールのみ）か判定
        if (loadedData.version === 2 || loadedData.config) {
          setConfig(loadedData.config);
          setSchedule(loadedData.schedule);
        } else {
          // 古いファイルの場合はスケジュールのみ読み込む
          setSchedule(loadedData);
          alert("古い形式のファイルを読み込みました。設定（講師リストなど）は初期値のままです。");
        }
      } catch (error) {
        alert("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      {/* ヘッダーエリア */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">冬期講習 時間割エディタ v2</h1>
          <p className="text-sm text-gray-600">設定変更＆保存対応版</p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow flex items-center gap-2"
          >
            ⚙️ 設定
          </button>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
          >
            📂 開く
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleLoadJson} 
            className="hidden" 
          />
          <button 
            onClick={handleSaveJson}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            💾 保存
          </button>
        </div>
      </div>

      {/* 設定エリア (開閉式) */}
      {showConfig && (
        <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-gray-700">⚙️ マスタ設定（カンマ区切りで入力）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">日付リスト</label>
              <textarea 
                className="w-full border p-2 rounded text-sm h-20"
                value={config.dates.join(", ")}
                onChange={(e) => handleConfigChange('dates', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">時限リスト</label>
              <textarea 
                className="w-full border p-2 rounded text-sm h-20"
                value={config.periods.join(", ")}
                onChange={(e) => handleConfigChange('periods', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">クラスリスト</label>
              <textarea 
                className="w-full border p-2 rounded text-sm h-20"
                value={config.classes.join(", ")}
                onChange={(e) => handleConfigChange('classes', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">講師リスト</label>
              <textarea 
                className="w-full border p-2 rounded text-sm h-20"
                value={config.teachers.join(", ")}
                onChange={(e) => handleConfigChange('teachers', e.target.value)}
              />
            </div>
             <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">科目リスト</label>
              <input 
                className="w-full border p-2 rounded text-sm"
                value={config.subjects.join(", ")}
                onChange={(e) => handleConfigChange('subjects', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-red-500">
            ※注意：日付やクラス名を変更すると、すでに入力済みのコマと紐付けが切れて表示されなくなる場合があります。
          </div>
        </div>
      )}
      
      {/* 時間割テーブル */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="border-collapse w-full bg-white text-sm text-left">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 w-24 border-r border-gray-600">日付</th>
              <th className="p-3 w-24 border-r border-gray-600">時限</th>
              {config.classes.map(cls => <th key={cls} className="p-3 min-w-[150px] border-r border-gray-600 last:border-0">{cls}</th>)}
            </tr>
          </thead>
          <tbody>
            {config.dates.map(date => (
              config.periods.map((period, pIndex) => (
                <tr key={`${date}-${period}`} className="border-b hover:bg-gray-50">
                  {pIndex === 0 && (
                    <td rowSpan={config.periods.length} className="p-3 font-bold align-top bg-gray-100 border-r">{date}</td>
                  )}
                  <td className="p-3 border-r bg-gray-50 text-gray-700">{period}</td>
                  
                  {config.classes.map(cls => {
                    const key = `${date}-${period}-${cls}`;
                    const currentTeacher = schedule[key]?.teacher;
                    const isConflict = currentTeacher && conflicts[`${date}-${period}-${currentTeacher}`];

                    return (
                      <td key={cls} className={`p-2 border-r last:border-0 ${isConflict ? "bg-red-50" : ""}`}>
                        <div className={`flex flex-col gap-2 p-2 rounded ${isConflict ? "border-2 border-red-400" : "border border-gray-200"}`}>
                          
                          <select 
                            className="w-full bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
                            onChange={(e) => handleAssign(date, period, cls, 'subject', e.target.value)}
                            value={schedule[key]?.subject || ""}
                          >
                            <option value="" className="text-gray-400">- 科目 -</option>
                            {config.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          
                          <select 
                            className={`w-full p-1 rounded font-bold cursor-pointer ${isConflict ? "text-red-600 bg-red-100" : "text-blue-900 bg-blue-50"}`}
                            onChange={(e) => handleAssign(date, period, cls, 'teacher', e.target.value)}
                            value={currentTeacher || ""}
                          >
                            <option value="">- 講師 -</option>
                            {config.teachers.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          
                          {isConflict && <div className="text-xs text-red-600 font-bold text-center bg-red-100 rounded">⚠️ 重複</div>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}