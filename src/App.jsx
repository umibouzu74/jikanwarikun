import React, { useState, useMemo, useRef } from 'react';

// --- 初期データ定義 ---
// 講師データは単純なリストではなく、「名前」と「担当科目リスト」を持つオブジェクトにします
const INITIAL_CONFIG = {
  dates: ["12/25(木)", "12/26(金)", "12/27(土)", "12/28(日)"],
  periods: ["1限 (13:00~)", "2限 (14:10~)", "3限 (15:20~)"],
  classes: ["Sクラス", "Aクラス", "Bクラス", "Cクラス"],
  subjects: ["英語", "数学", "国語", "理科", "社会"],
  // 講師情報 (名前と教えられる科目のペア)
  teachers: [
    { name: "堀上", subjects: ["英語"] },
    { name: "片岡", subjects: ["数学"] },
    { name: "井上", subjects: ["社会"] },
    { name: "半田", subjects: ["数学", "理科"] },
    { name: "松川", subjects: ["国語"] },
    { name: "未定", subjects: ["英語", "数学", "国語", "理科", "社会"] } // 未定は全部OKにしておく
  ]
};

export default function ScheduleApp() {
  const [schedule, setSchedule] = useState({});
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  
  const fileInputRef = useRef(null);

  // --- 操作関数 ---
  const handleAssign = (date, period, className, type, value) => {
    const key = `${date}-${period}-${className}`;
    
    // 科目が変更されたら、講師の選択をリセットする（矛盾を防ぐため）
    if (type === 'subject') {
      setSchedule(prev => ({
        ...prev,
        [key]: { subject: value, teacher: "" } // 講師を空にする
      }));
    } else {
      setSchedule(prev => ({
        ...prev,
        [key]: { ...prev[key], [type]: value }
      }));
    }
  };

  // --- 設定変更用関数 (単純なリスト) ---
  const handleListConfigChange = (key, valueString) => {
    const newArray = valueString.split(',').map(s => s.trim()).filter(s => s !== "");
    setConfig(prev => ({ ...prev, [key]: newArray }));
  };

  // --- 講師情報の追加・変更 ---
  // 新しい講師を追加
  const addTeacher = () => {
    const name = prompt("新しい講師の名前を入力してください:");
    if (name) {
      setConfig(prev => ({
        ...prev,
        teachers: [...prev.teachers, { name, subjects: [] }]
      }));
    }
  };

  // 講師の科目を変更 (チェックボックス操作)
  const toggleTeacherSubject = (teacherIndex, subject) => {
    setConfig(prev => {
      const newTeachers = [...prev.teachers];
      const teacher = newTeachers[teacherIndex];
      // 科目がすでにあれば削除、なければ追加
      if (teacher.subjects.includes(subject)) {
        teacher.subjects = teacher.subjects.filter(s => s !== subject);
      } else {
        teacher.subjects = [...teacher.subjects, subject];
      }
      return { ...prev, teachers: newTeachers };
    });
  };

  // 講師を削除
  const removeTeacher = (index) => {
    if (window.confirm("この講師を削除しますか？")) {
      setConfig(prev => ({
        ...prev,
        teachers: prev.teachers.filter((_, i) => i !== index)
      }));
    }
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
          // 未定は重複チェックの対象外
          if (teacher && teacher !== "未定") {
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

  // --- 保存・読込 ---
  const handleSaveJson = () => {
    const saveData = { version: 3, config, schedule }; // version 3へ
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_v3_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.config && data.schedule) {
          setConfig(data.config);
          setSchedule(data.schedule);
        } else {
          alert("データ形式が古いため読み込めません（旧バージョンとは互換性がありません）");
        }
      } catch (error) { alert("読込エラー"); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">冬期講習 時間割エディタ v3</h1>
          <p className="text-sm text-gray-600">科目・講師紐づけ機能搭載</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 shadow flex items-center gap-2">⚙️ 設定</button>
          <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow">📂 開く</button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadJson} className="hidden" />
          <button onClick={handleSaveJson} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow">💾 保存</button>
        </div>
      </div>

      {/* 設定エリア */}
      {showConfig && (
        <div className="mb-6 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
          <h2 className="font-bold text-lg mb-4 text-gray-700">⚙️ マスタ設定</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 基本リスト設定 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">日付 (カンマ区切り)</label>
                <textarea className="w-full border p-2 rounded text-sm h-20" value={config.dates.join(", ")} onChange={(e) => handleListConfigChange('dates', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">時限 (カンマ区切り)</label>
                <textarea className="w-full border p-2 rounded text-sm h-20" value={config.periods.join(", ")} onChange={(e) => handleListConfigChange('periods', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">クラス (カンマ区切り)</label>
                <textarea className="w-full border p-2 rounded text-sm h-20" value={config.classes.join(", ")} onChange={(e) => handleListConfigChange('classes', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">科目 (カンマ区切り)</label>
                <textarea className="w-full border p-2 rounded text-sm h-20" value={config.subjects.join(", ")} onChange={(e) => handleListConfigChange('subjects', e.target.value)} />
              </div>
            </div>

            {/* 講師と科目の紐づけ設定 */}
            <div className="md:col-span-2 border-l pl-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">👤 講師ごとの担当科目設定</label>
                <button onClick={addTeacher} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">+ 講師追加</button>
              </div>
              <div className="overflow-y-auto max-h-[400px] border rounded bg-gray-50 p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-2">氏名</th>
                      <th className="p-2">担当可能科目</th>
                      <th className="p-2 w-10">削除</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.teachers.map((teacher, tIndex) => (
                      <tr key={tIndex} className="border-b bg-white">
                        <td className="p-2 font-bold">{teacher.name}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            {config.subjects.map(subject => (
                              <label key={subject} className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input 
                                  type="checkbox" 
                                  checked={teacher.subjects.includes(subject)}
                                  onChange={() => toggleTeacherSubject(tIndex, subject)}
                                />
                                <span className="text-xs">{subject}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <button onClick={() => removeTeacher(tIndex)} className="text-red-500 hover:text-red-700">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">※ ここでチェックを入れた科目の授業でのみ、その講師が選択肢に表示されます。</p>
            </div>
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
                    const currentData = schedule[key] || {};
                    const currentSubject = currentData.subject || "";
                    const currentTeacher = currentData.teacher || "";
                    const isConflict = currentTeacher && conflicts[`${date}-${period}-${currentTeacher}`];

                    // ★重要: 科目が選ばれていたら、その科目を担当できる先生だけをフィルタリング
                    const filteredTeachers = currentSubject 
                      ? config.teachers.filter(t => t.subjects.includes(currentSubject))
                      : config.teachers;

                    return (
                      <td key={cls} className={`p-2 border-r last:border-0 ${isConflict ? "bg-red-50" : ""}`}>
                        <div className={`flex flex-col gap-2 p-2 rounded ${isConflict ? "border-2 border-red-400" : "border border-gray-200"}`}>
                          
                          {/* 科目選択 */}
                          <select 
                            className="w-full bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
                            onChange={(e) => handleAssign(date, period, cls, 'subject', e.target.value)}
                            value={currentSubject}
                          >
                            <option value="" className="text-gray-400">- 科目 -</option>
                            {config.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          
                          {/* 講師選択 (科目に連動して中身が変わる) */}
                          <select 
                            className={`w-full p-1 rounded font-bold cursor-pointer ${isConflict ? "text-red-600 bg-red-100" : "text-blue-900 bg-blue-50"} 
                              ${!currentSubject ? "opacity-50" : ""}`} // 科目未選択なら薄くする
                            onChange={(e) => handleAssign(date, period, cls, 'teacher', e.target.value)}
                            value={currentTeacher}
                            disabled={!currentSubject} // 科目を選ばないと講師を選べないようにする
                          >
                            <option value="">
                              {currentSubject ? "- 講師を選択 -" : "(科目を先に選択)"}
                            </option>
                            {filteredTeachers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
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