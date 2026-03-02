import React from 'react';
import { useProjectContext } from '../contexts/projectContextValue';

export default function TabBar() {
  const {
    project,
    switchTab,
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
  } = useProjectContext();

  return (
    <div className="flex items-end gap-1 px-2 no-print overflow-x-auto">
      {project.tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => switchTab(tab.id)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const newName = prompt("タブ名を変更:", tab.name);
            if (newName) handleRenameTab(tab.id, newName);
          }}
          className={`px-4 py-2 rounded-t-lg cursor-pointer flex items-center gap-2 select-none transition-all ${project.activeTabId === tab.id ? "bg-white text-blue-700 font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.05)] pt-3" : "bg-gray-200 text-gray-500 hover:bg-gray-300 mt-1"}`}
        >
          {tab.name}
          {project.tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("このタブを削除しますか？")) handleDeleteTab(tab.id);
              }}
              className="text-xs ml-2 hover:text-red-500"
            >×</span>
          )}
        </div>
      ))}
      <button
        onClick={() => {
          const name = prompt("新しいタブの名前:");
          if (name) handleAddTab(name);
        }}
        className="px-3 py-2 text-gray-500 hover:text-blue-600 font-bold text-sm"
      >+ タブ追加</button>
    </div>
  );
}
