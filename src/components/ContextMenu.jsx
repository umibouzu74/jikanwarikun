import React from 'react';
import { useProjectContext } from '../contexts/projectContextValue';
import { makeKey } from '../utils/scheduleKey';

export default function ContextMenu({ contextMenu, clipboard, onClose }) {
  const {
    currentSchedule,
    handleRenameHeader,
    handleBulkAction,
    handleCellCopy,
    handleCellPaste,
    handleCellClear,
    handleSetNg,
    toggleLock,
  } = useProjectContext();

  if (!contextMenu) return null;

  const { dIdx, pIdx, cIdx, type, val } = contextMenu;

  const handleAction = (action) => {
    if (action === 'rename') {
      const newVal = prompt(`「${val}」の新しい名称を入力:`, val);
      handleRenameHeader(type, val, newVal);
      onClose();
      return;
    }

    if (type) {
      handleBulkAction(action, type, val);
    } else {
      if (action === 'copy') {
        const copied = handleCellCopy(dIdx, pIdx, cIdx);
        if (copied) onClose(copied);
        return;
      }
      if (action === 'paste') { handleCellPaste(dIdx, pIdx, cIdx, clipboard); }
      if (action === 'lock') { toggleLock(dIdx, pIdx, cIdx); }
      if (action === 'clear') { handleCellClear(dIdx, pIdx, cIdx); }
      if (action === 'set-ng') { handleSetNg(dIdx, pIdx, cIdx); }
    }
    onClose();
  };

  const cellKey = (dIdx !== undefined && pIdx !== undefined && cIdx !== undefined)
    ? makeKey(dIdx, pIdx, cIdx) : null;

  return (
    <div className="fixed bg-white border border-gray-200 shadow-xl rounded z-50 text-sm overflow-hidden animate-fade-in" style={{ top: contextMenu.y, left: contextMenu.x }}>
      {type ? (
        <>
          <div className="px-4 py-2 bg-gray-50 border-b font-bold text-gray-500 text-xs">{val} の一括操作</div>
          <button onClick={() => handleAction('rename')} className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 font-bold border-b">✏️ 名称を変更</button>
          <button onClick={() => handleAction('lock-all')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b">🔒 一括ロック</button>
          <button onClick={() => handleAction('unlock-all')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b">🔓 一括解除</button>
          <button onClick={() => handleAction('clear-all')} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">🗑️ 一括クリア</button>
        </>
      ) : (
        <>
          <button onClick={() => handleAction('copy')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b">📝 コピー</button>
          <button onClick={() => handleAction('paste')} className={`block w-full text-left px-4 py-2 border-b ${!clipboard ? "text-gray-300" : "hover:bg-gray-100"}`}>📋 貼り付け</button>
          {cellKey && currentSchedule[cellKey]?.teacher && (
            <button onClick={() => handleAction('set-ng')} className="block w-full text-left px-4 py-2 hover:bg-yellow-100 border-b text-yellow-800">🚫 この時間をNG登録</button>
          )}
          <button onClick={() => handleAction('lock')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b">🔒 ロック切替</button>
          <button onClick={() => handleAction('clear')} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">🗑️ クリア</button>
        </>
      )}
    </div>
  );
}
