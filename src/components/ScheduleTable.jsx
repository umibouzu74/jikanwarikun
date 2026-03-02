import React, { useState } from 'react';
import { useProjectContext } from '../contexts/projectContextValue';
import ScheduleCell from './ScheduleCell';

export default function ScheduleTable({ isCompact, onContextMenu }) {
  const { currentConfig, handleSwapCells } = useProjectContext();
  const [dragSource, setDragSource] = useState(null);

  const handleDragStart = (e, k, d) => {
    if (d.locked || !d.subject) { e.preventDefault(); return; }
    setDragSource({ key: k, data: d });
    e.dataTransfer.effectAllowed = "move";
    e.target.style.opacity = '0.5';
  };

  const handleDrop = (e, tk, td) => {
    e.preventDefault();
    if (!dragSource || dragSource.key === tk || td.locked) return;
    handleSwapCells(dragSource.key, dragSource.data, tk, td);
    setDragSource(null);
    e.target.style.opacity = '1';
  };

  return (
    <div className={`overflow-auto shadow border border-gray-300 max-h-[70vh] bg-gray-50 print-container ${isCompact ? "text-xs" : "text-sm"}`}>
      <table className="w-full border-collapse text-left relative">
        <thead className="sticky top-0 z-30 bg-gray-800 text-white shadow-md">
          <tr>
            <th className={`border-r border-gray-600 sticky left-0 z-40 bg-gray-800 ${isCompact ? "p-1 w-12" : "p-3 w-20"}`}>日付</th>
            <th className={`border-r border-gray-600 sticky left-12 z-30 bg-gray-800 ${isCompact ? "p-1 w-12" : "p-3 w-20"}`} style={{ left: isCompact ? '3rem' : '5rem' }}>時限</th>
            {currentConfig.classes.map(c => (
              <th key={c} className={`border-r border-gray-600 cursor-context-menu hover:bg-gray-700 ${isCompact ? "p-1 min-w-[80px]" : "p-3 min-w-[140px]"}`}
                onContextMenu={(e) => onContextMenu(e, null, null, null, 'class', c)}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentConfig.dates.map((d, dIdx) => (
            currentConfig.periods.map((p, pIdx) => {
              const isDayEnd = pIdx === currentConfig.periods.length - 1;
              return (
                <tr key={`${d}-${p}`} className={`bg-white ${isDayEnd ? "border-b-4 border-gray-400" : "border-b hover:bg-gray-200"}`}>
                  {pIdx === 0 && (
                    <td rowSpan={currentConfig.periods.length}
                      className={`font-bold align-top bg-gray-100 border-r sticky left-0 z-20 border-b-4 border-gray-400 cursor-context-menu hover:bg-gray-200 ${isCompact ? "p-1" : "p-3"}`}
                      onContextMenu={(e) => onContextMenu(e, null, null, null, 'date', d)}>
                      {d}
                    </td>
                  )}
                  <td className={`border-r bg-gray-50 text-gray-700 sticky z-10 ${isDayEnd ? "border-b-4 border-gray-400" : ""} ${isCompact ? "p-1 left-12" : "p-3 left-20"}`}
                    style={{ left: isCompact ? '3rem' : '5rem' }}
                    onContextMenu={(e) => onContextMenu(e, null, null, null, 'period', p)}>
                    {p}
                  </td>
                  {currentConfig.classes.map((c, cIdx) => (
                    <ScheduleCell
                      key={c}
                      dIdx={dIdx} pIdx={pIdx} cIdx={cIdx}
                      isCompact={isCompact}
                      onContextMenu={onContextMenu}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  ))}
                </tr>
              );
            })
          ))}
        </tbody>
      </table>
    </div>
  );
}
