import React, { useState, useMemo, useRef } from 'react';

// --- 設定データ ---
const DATES = ["12/25(木)", "12/26(金)", "12/27(土)", "12/28(日)"];
const PERIODS = ["1限 (13:00~)", "2限 (14:10~)", "3限 (15:20~)"];
const CLASSES = ["Sクラス", "Aクラス", "Bクラス", "Cクラス"];
const TEACHERS = ["未定", "堀上", "片岡", "井上", "半田", "松川", "野口", "三宮", "杉原", "小松", "石原", "高松", "滝澤"];
const SUBJECTS = ["英語", "数学", "国語", "理科", "社会"];

export default function ScheduleApp() {
  const [schedule, setSchedule] = useState({});
  const fileInputRef = useRef(null);

  const handleAssign = (date, period, className, type, value) => {
    const key = `${date}-${period}-${className}`;
    setSchedule(prev => ({ ...prev, [key]: { ...prev[key], [type]: value } }));
  };

  const conflicts = useMemo(() => {
    const conflictMap = {}; 
    DATES.forEach(date => {
      PERIODS.forEach(period => {
        const teacherCounts = {};
        CLASSES.forEach(cls => {
          const key = `${date}-${period}-${cls}`;
          const teacher = schedule[key]?.teacher;
          if (teacher && teacher !== "未定") {
             teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1;
          }
        });
        Object.keys(teacherCounts).forEach(t => {
          if (teacherCounts[t] > 1) conflictMap[`${date}-${period}-${t}`] = true;
        });
      });
    });
    return conflictMap;
  }, [schedule]);

  const handleSaveJson = () => {
    const dataStr = JSON.stringify(schedule, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setSchedule(JSON.parse(e.target.result));
        alert("復元しました");
      } catch (error) {
        alert("エラー：正しいJSONファイルではありません");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">冬期講習 時間割エディタ</h1>
        <div className="flex gap-4">
          <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-green-600 text-white rounded shadow">📂 開く</button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadJson} className="hidden" />
          <button onClick={handleSaveJson} className="px-4 py-2 bg-blue-600 text-white rounded shadow">💾 保存</button>
        </div>
      </div>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="border-collapse w-full bg-white text-sm text-left">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 w-24 border-r border-gray-600">日付</th>
              <th className="p-3 w-24 border-r border-gray-600">時限</th>
              {CLASSES.map(cls => <th key={cls} className="p-3 min-w-[150px] border-r border-gray-600">{cls}</th>)}
            </tr>
          </thead>
          <tbody>
            {DATES.map(date => (
              PERIODS.map((period, pIndex) => (
                <tr key={`${date}-${period}`} className="border-b hover:bg-gray-50">
                  {pIndex === 0 && <td rowSpan={PERIODS.length} className="p-3 font-bold align-top bg-gray-100 border-r">{date}</td>}
                  <td className="p-3 border-r bg-gray-50">{period}</td>
                  {CLASSES.map(cls => {
                    const key = `${date}-${period}-${cls}`;
                    const currentTeacher = schedule[key]?.teacher;
                    const isConflict = currentTeacher && conflicts[`${date}-${period}-${currentTeacher}`];
                    return (
                      <td key={cls} className={`p-2 border-r ${isConflict ? "bg-red-50" : ""}`}>
                        <div className={`flex flex-col gap-2 p-2 rounded ${isConflict ? "border-2 border-red-400" : "border border-gray-200"}`}>
                          <select className="w-full bg-transparent focus:outline-none" onChange={(e) => handleAssign(date, period, cls, 'subject', e.target.value)} value={schedule[key]?.subject || ""}>
                            <option value="">- 科目 -</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select className={`w-full p-1 rounded font-bold ${isConflict ? "text-red-600 bg-red-100" : "text-blue-900 bg-blue-50"}`} onChange={(e) => handleAssign(date, period, cls, 'teacher', e.target.value)} value={currentTeacher || ""}>
                            <option value="">- 講師 -</option>
                            {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {isConflict && <div className="text-xs text-red-600 font-bold text-center">⚠️ 重複</div>}
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