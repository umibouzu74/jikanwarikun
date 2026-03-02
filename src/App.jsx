import React, { useState, useEffect } from 'react';
import { ProjectProvider } from './contexts/ProjectContext';
import { UIProvider } from './contexts/UIContext';
import { useUI } from './contexts/uiContextValue';
import { useProjectContext } from './contexts/projectContextValue';
import { generateSchedule } from './logic/autoGenerator';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Toolbar from './components/Toolbar';
import ScheduleTable from './components/ScheduleTable';
import SummaryPanel from './components/SummaryPanel';
import ContextMenu from './components/ContextMenu';
import ConfigModal from './components/ConfigModal';

function ScheduleApp() {
  const { project } = useProjectContext();
  const { showToast } = useUI();

  useEffect(() => {
    document.title = project.name ? `${project.name} - 時間割作成くん` : "時間割作成くん";
  }, [project.name]);

  const [showConfig, setShowConfig] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [generatedPatterns, setGeneratedPatterns] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [isCompact, setIsCompact] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const solutions = generateSchedule({
        project,
        activeTabId: project.activeTabId,
      });
      if (solutions.length > 0) {
        setGeneratedPatterns(solutions);
      } else {
        showToast("完全なパターンが見つかりませんでした。条件を緩和して、可能な範囲で埋めた案を提示します。", "warning", 5000);
      }
      setIsGenerating(false);
    }, 100);
  };

  const handleContextMenu = (e, dIdx, pIdx, cIdx, type = null, val = null) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, dIdx, pIdx, cIdx, type, val });
  };

  const handleContextMenuClose = (copiedData) => {
    if (copiedData && copiedData.subject) {
      setClipboard(copiedData);
    }
    setContextMenu(null);
  };

  const printStyle = `@media print { @page { size: landscape; } .no-print { display: none !important; } .print-container { max-height: none !important; border: none !important; overflow: visible !important; } }`;

  return (
    <div className="p-4 bg-gray-100 min-h-screen font-sans" onClick={() => setContextMenu(null)}>
      <style>{printStyle}</style>

      <Header />
      <TabBar />

      <div className="bg-white p-4 rounded-b-lg rounded-tr-lg shadow-md min-h-[600px]">
        <Toolbar
          isCompact={isCompact}
          setIsCompact={setIsCompact}
          showSummary={showSummary}
          setShowSummary={setShowSummary}
          setShowConfig={setShowConfig}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />

        <SummaryPanel
          showSummary={showSummary}
          generatedPatterns={generatedPatterns}
          setGeneratedPatterns={setGeneratedPatterns}
        />

        {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}

        <ScheduleTable isCompact={isCompact} onContextMenu={handleContextMenu} />
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        clipboard={clipboard}
        onClose={handleContextMenuClose}
      />
    </div>
  );
}

export default function App() {
  return (
    <UIProvider>
      <ProjectProvider>
        <ScheduleApp />
      </ProjectProvider>
    </UIProvider>
  );
}
