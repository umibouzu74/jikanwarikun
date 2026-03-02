import React from 'react';
import { useProjectContext } from '../contexts/projectContextValue';
import { getSubjectColor, toCircleNum } from '../utils/constants';
import { makeKey, makeNgKey, makeExternalKey } from '../utils/scheduleKey';

export default function ScheduleCell({ dIdx, pIdx, cIdx, isCompact, onContextMenu, onDragStart, onDrop }) {
  const {
    project,
    currentSchedule,
    currentConfig,
    commonSubjects,
    analysis,
    handleAssign,
    toggleLock,
  } = useProjectContext();

  const d = currentConfig.dates[dIdx];
  const p = currentConfig.periods[pIdx];

  const key = makeKey(dIdx, pIdx, cIdx);
  const entry = currentSchedule[key] || {};
  const isLocked = entry.locked;
  const isConflict = analysis.conflictMap[`${d}-${p}-${entry.teacher}`];
  const order = analysis.subjectOrders[key] || 0;
  const maxCnt = currentConfig.subjectCounts[entry.subject] || 0;
  const isOver = maxCnt > 0 && order > maxCnt;
  const filteredTeachers = entry.subject ? project.teachers.filter(t => t.subjects.includes(entry.subject)) : project.teachers;

  const subjDupKey = `c${cIdx}-d${dIdx}-${entry.subject}`;
  const isSubjDup = analysis.dailySubjectMap[subjDupKey] > 1;

  const cellColor = isConflict ? "bg-red-200" : getSubjectColor(entry.subject);
  const lockedStyle = isLocked ? "border-2 border-gray-600 opacity-90" : "border border-gray-200";
  const stripeStyle = isLocked ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' } : {};

  const handleCellNavigation = (e, type) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let nextD = dIdx, nextP = pIdx, nextC = cIdx, nextType = type;
      if (e.key === 'ArrowUp') { if (pIdx > 0) nextP--; else if (dIdx > 0) { nextD--; nextP = currentConfig.periods.length - 1; } }
      else if (e.key === 'ArrowDown') { if (pIdx < currentConfig.periods.length - 1) nextP++; else if (dIdx < currentConfig.dates.length - 1) { nextD++; nextP = 0; } }
      else if (e.key === 'ArrowLeft') { if (type === 'teacher') nextType = 'subject'; else if (cIdx > 0) { nextC--; nextType = 'teacher'; } }
      else if (e.key === 'ArrowRight') { if (type === 'subject') nextType = 'teacher'; else if (cIdx < currentConfig.classes.length - 1) { nextC++; nextType = 'subject'; } }
      const nextElement = document.getElementById(`select-${nextD}-${nextP}-${nextC}-${nextType}`);
      if (nextElement) nextElement.focus();
    }
  };

  return (
    <td
      id={`select-${dIdx}-${pIdx}-${cIdx}-cell`}
      className={`border-r last:border-0 ${isCompact ? "p-0.5" : "p-2"}`}
      draggable={!isLocked && !!entry.subject}
      onDragStart={(e) => onDragStart(e, key, entry)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, key, entry)}
      onContextMenu={(e) => onContextMenu(e, dIdx, pIdx, cIdx)}
    >
      <div className={`flex flex-col rounded h-full ${cellColor} ${lockedStyle} ${isCompact ? "gap-0 p-0.5" : "gap-1 p-1.5"}`} style={stripeStyle}>
        <div className="flex justify-between items-center gap-1">
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <select
              id={`select-${dIdx}-${pIdx}-${cIdx}-subject`}
              className={`flex-1 bg-transparent font-bold focus:outline-none cursor-pointer text-gray-800 min-w-0 ${isSubjDup ? "text-red-600 underline" : ""} ${isCompact ? "text-xs" : "text-base"} ${isLocked ? "pointer-events-none" : ""}`}
              value={entry.subject || ""}
              onChange={(e) => handleAssign(dIdx, pIdx, cIdx, 'subject', e.target.value)}
              onKeyDown={(e) => handleCellNavigation(e, 'subject')}
            >
              <option value="">-</option>
              {commonSubjects.map(s => {
                const isAlreadyUsed = analysis.dailySubjectMap[`c${cIdx}-d${dIdx}-${s}`] > 0 && entry.subject !== s;
                return <option key={s} value={s} disabled={isAlreadyUsed} className={isAlreadyUsed ? "bg-gray-200" : ""}>{s}</option>;
              })}
            </select>
            {isSubjDup && <span className="text-[10px] bg-red-600 text-white px-1 rounded shrink-0">⚠️2回</span>}
            {isConflict && <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse shrink-0">⚠️重複</span>}
            {entry.subject && !isSubjDup && <span className={`font-bold shrink-0 ${isOver ? "text-red-600" : "text-gray-700"}`}>{toCircleNum(order)}{isOver && "!"}</span>}
          </div>
          <button onClick={() => toggleLock(dIdx, pIdx, cIdx)} className={`focus:outline-none text-gray-400 hover:text-gray-800 shrink-0 ${isCompact ? "text-[10px]" : "text-sm"}`}>
            {isLocked ? "🔒" : "🔓"}
          </button>
        </div>
        <select
          id={`select-${dIdx}-${pIdx}-${cIdx}-teacher`}
          className={`w-full rounded cursor-pointer ${isConflict ? "text-red-800 font-extrabold" : "text-blue-900"} ${isCompact ? "text-[10px] py-0" : "text-sm py-1"} ${(!entry.subject || isLocked) ? "opacity-50 pointer-events-none" : "bg-white/50 hover:bg-white"}`}
          value={entry.teacher || ""}
          onChange={(e) => handleAssign(dIdx, pIdx, cIdx, 'teacher', e.target.value)}
          onKeyDown={(e) => handleCellNavigation(e, 'teacher')}
        >
          <option value="">-</option>
          {filteredTeachers.map(t => {
            const dayKey = makeExternalKey(d, t.name);
            const daily = analysis.teacherDailyCounts[dayKey] || { total: 0 };
            const isNg = t.ngSlots?.includes(makeNgKey(d, p));
            let label = t.name;
            if (t.name !== "未定") { if (isNg) label += " (NG)"; else label += ` (計${daily.total})`; }
            return <option key={t.name} value={t.name} className={isNg ? "bg-gray-300 text-gray-500" : (daily.total >= 4 ? "bg-yellow-100" : "")} disabled={isNg}>{label}</option>;
          })}
        </select>
        {isConflict && <div className="text-[10px] text-red-700 font-bold text-center bg-red-100 rounded mt-1 border border-red-300">⚠️ 重複</div>}
      </div>
    </td>
  );
}
