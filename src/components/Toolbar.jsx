import React from 'react';
import { useProjectContext } from '../contexts/projectContextValue';

export default function Toolbar({
  isCompact,
  setIsCompact,
  showSummary,
  setShowSummary,
  setShowConfig,
  isGenerating,
  onGenerate,
}) {
  const {
    analysis,
    dashboard,
    currentConfig,
    historyIndex,
    history,
    undo,
    redo,
    handleClearUnlocked,
  } = useProjectContext();

  const scrollToFirstError = () => {
    if (analysis.errorKeys.length === 0) return;
    const firstKey = analysis.errorKeys[0];
    let targetId = null;
    currentConfig.dates.some((d, dIdx) => {
      return currentConfig.periods.some((p, pIdx) => {
        return currentConfig.classes.some((c, cIdx) => {
          if (`${d}-${p}-${c}` === firstKey) {
            targetId = `select-${dIdx}-${pIdx}-${cIdx}-cell`;
            return true;
          }
          return false;
        });
      });
    });
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-2 bg-slate-50 border border-slate-200 rounded no-print">
      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[250px]">
        <div className="text-xs font-bold text-gray-500">進捗</div>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative">
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${dashboard.progress}%` }}></div>
        </div>
        <div className="text-sm font-bold text-blue-600 w-12 text-right">{dashboard.progress}%</div>
        {analysis.errorKeys.length > 0 ? (
          <button onClick={scrollToFirstError} className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 font-bold animate-pulse hover:bg-red-200">
            ⚠️ {analysis.errorKeys.length}件
          </button>
        ) : <span className="ml-2 text-xs text-green-600 font-bold">✨ OK</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setIsCompact(!isCompact)} className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 shadow-sm text-sm">
          {isCompact ? "🔍 標準" : "📏 縮小"}
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button onClick={undo} disabled={historyIndex === 0} className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 border rounded shadow-sm">↩️</button>
        <button onClick={redo} disabled={historyIndex === history.length - 1} className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 border rounded shadow-sm">↪️</button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button onClick={() => setShowSummary(!showSummary)} className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm text-sm font-bold">📊 集計</button>
        <button onClick={() => setShowConfig(true)} className="flex items-center gap-1 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 shadow-sm text-sm font-bold">⚙️ 設定</button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button onClick={() => { if (window.confirm("ロックされていないセルを全てクリアしますか？")) handleClearUnlocked(); }} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 border border-red-200 rounded hover:bg-red-200 shadow-sm text-sm font-bold">🗑️ 生成クリア</button>
        <button onClick={onGenerate} disabled={isGenerating} className={`flex items-center gap-1 px-4 py-2 text-white rounded shadow-sm text-sm font-bold transition-colors ${isGenerating ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}>
          {isGenerating ? "🔮 生成中..." : "🧙‍♂️ 自動作成"}
        </button>
      </div>
    </div>
  );
}
