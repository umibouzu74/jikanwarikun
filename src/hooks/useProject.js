import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_INITIAL_TEACHERS,
  DEFAULT_TAB_CONFIG_BASE,
  STORAGE_KEY_PROJECT,
  STORAGE_KEY_USER_DEFAULTS,
  cleanSchedule,
} from '../utils/constants';

function loadInitialProject() {
  try {
    const savedProject = localStorage.getItem(STORAGE_KEY_PROJECT);
    if (savedProject) return JSON.parse(savedProject);

    const savedDefaults = localStorage.getItem(STORAGE_KEY_USER_DEFAULTS);
    if (savedDefaults) {
      const defaults = JSON.parse(savedDefaults);
      return {
        teachers: defaults.teachers || DEFAULT_INITIAL_TEACHERS,
        activeTabId: 1,
        tabs: [{ id: 1, name: "メイン", config: defaults.config || DEFAULT_TAB_CONFIG_BASE, schedule: {} }]
      };
    }
  } catch (e) { console.error("Load failed", e); }

  return {
    teachers: DEFAULT_INITIAL_TEACHERS,
    activeTabId: 1,
    tabs: [
      {
        id: 1,
        name: "中３",
        config: { ...DEFAULT_TAB_CONFIG_BASE, classes: ["３S", "３A", "３B", "３C"] },
        schedule: {}
      },
      {
        id: 2,
        name: "中１・２",
        config: { ...DEFAULT_TAB_CONFIG_BASE, classes: ["１S", "１AB", "１附属", "２S", "２AB", "２C", "２附属"] },
        schedule: {}
      }
    ]
  };
}

export function useProject() {
  const [project, setProject] = useState(loadInitialProject);
  const [history, setHistory] = useState(() => [project]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState("✅ 保存済");

  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isInitialMount = useRef(true);

  // localStorage 自動保存
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(project));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 保存ステータス表示のため意図的に使用
    setSaveStatus("💾 保存中...");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("✅ 保存済"), 800);
  }, [project]);

  const pushHistory = useCallback((newProject) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newProject);
      if (newHistory.length > 50) newHistory.shift();
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    setProject(newProject);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // 派生データ
  const activeTab = project.tabs.find(t => t.id === project.activeTabId) || project.tabs[0];
  const currentSchedule = activeTab.schedule;
  const currentConfig = activeTab.config;
  const commonSubjects = Object.keys(currentConfig.subjectCounts);

  // --- タブ管理 ---
  const handleAddTab = useCallback((name) => {
    if (!name) return;
    const newId = Math.max(...project.tabs.map(t => t.id)) + 1;
    const configToCopy = JSON.parse(JSON.stringify(activeTab.config));
    const newTab = { id: newId, name, config: configToCopy, schedule: {} };
    pushHistory({ ...project, tabs: [...project.tabs, newTab], activeTabId: newId });
  }, [project, activeTab, pushHistory]);

  const handleDeleteTab = useCallback((id) => {
    if (project.tabs.length <= 1) return;
    const newTabs = project.tabs.filter(t => t.id !== id);
    pushHistory({ ...project, tabs: newTabs, activeTabId: newTabs[0].id });
  }, [project, pushHistory]);

  const handleRenameTab = useCallback((id, newName) => {
    if (newName) pushHistory({ ...project, tabs: project.tabs.map(t => t.id === id ? { ...t, name: newName } : t) });
  }, [project, pushHistory]);

  const switchTab = useCallback((id) => {
    setProject({ ...project, activeTabId: id });
  }, [project]);

  // --- 設定変更 ---
  const handleListConfigChange = useCallback((key, value) => {
    const arr = value.split(',').map(s => s.trim()).filter(s => s);
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, config: { ...t.config, [key]: arr } } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, pushHistory]);

  const handleSubjectCountChange = useCallback((subj, val) => {
    const newCounts = { ...currentConfig.subjectCounts, [subj]: parseInt(val) || 0 };
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, config: { ...t.config, subjectCounts: newCounts } } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentConfig, pushHistory]);

  // --- 講師管理 ---
  const addTeacher = useCallback((name) => {
    if (name) pushHistory({ ...project, teachers: [...project.teachers, { name, subjects: [], ngSlots: [], ngClasses: [], priorityClasses: [] }] });
  }, [project, pushHistory]);

  const removeTeacher = useCallback((idx) => {
    const targetName = project.teachers[idx].name;
    const newTeachers = project.teachers.filter((_, i) => i !== idx);
    const newTabs = project.tabs.map(tab => {
      const newSch = { ...tab.schedule };
      Object.keys(newSch).forEach(k => { if (newSch[k].teacher === targetName) newSch[k] = { ...newSch[k], teacher: "" }; });
      return { ...tab, schedule: newSch };
    });
    pushHistory({ ...project, teachers: newTeachers, tabs: newTabs });
  }, [project, pushHistory]);

  const toggleTeacherSubject = useCallback((idx, subj) => {
    const newTeachers = [...project.teachers];
    const t = { ...newTeachers[idx] };
    if (t.subjects.includes(subj)) t.subjects = t.subjects.filter(s => s !== subj);
    else t.subjects = [...t.subjects, subj];
    newTeachers[idx] = t;
    pushHistory({ ...project, teachers: newTeachers });
  }, [project, pushHistory]);

  const toggleTeacherNg = useCallback((idx, d, p) => {
    const newTeachers = [...project.teachers];
    const t = { ...newTeachers[idx] };
    const k = `${d}-${p}`;
    if (!t.ngSlots) t.ngSlots = [];
    if (t.ngSlots.includes(k)) t.ngSlots = t.ngSlots.filter(x => x !== k);
    else t.ngSlots = [...t.ngSlots, k];
    newTeachers[idx] = t;
    pushHistory({ ...project, teachers: newTeachers });
  }, [project, pushHistory]);

  const toggleTeacherClassPriority = useCallback((idx, className) => {
    const newTeachers = [...project.teachers];
    const t = { ...newTeachers[idx] };
    if (!t.ngClasses) t.ngClasses = [];
    if (!t.priorityClasses) t.priorityClasses = [];
    const isNg = t.ngClasses.includes(className);
    const isPri = t.priorityClasses.includes(className);
    if (!isNg && !isPri) { t.priorityClasses = [...t.priorityClasses, className]; }
    else if (isPri) { t.priorityClasses = t.priorityClasses.filter(c => c !== className); t.ngClasses = [...t.ngClasses, className]; }
    else { t.ngClasses = t.ngClasses.filter(c => c !== className); }
    newTeachers[idx] = t;
    pushHistory({ ...project, teachers: newTeachers });
  }, [project, pushHistory]);

  // --- スケジュール操作 ---
  const handleAssign = useCallback((d, p, c, type, val) => {
    const k = `${d}-${p}-${c}`;
    if (currentSchedule[k]?.locked) return;
    const e = { ...(currentSchedule[k] || {}) };
    if (type === 'subject') { e.subject = val; e.teacher = ""; } else { e[type] = val; }
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: { ...t.schedule, [k]: e } } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentSchedule, pushHistory]);

  const toggleLock = useCallback((d, p, c) => {
    const k = `${d}-${p}-${c}`;
    const e = { ...(currentSchedule[k] || {}) };
    e.locked = !e.locked;
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: { ...t.schedule, [k]: e } } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentSchedule, pushHistory]);

  const handleRenameHeader = useCallback((type, oldVal, newVal) => {
    if (!newVal || newVal === oldVal) return;
    const newConfig = { ...currentConfig };
    if (type === 'date') newConfig.dates = newConfig.dates.map(d => d === oldVal ? newVal : d);
    else if (type === 'period') newConfig.periods = newConfig.periods.map(p => p === oldVal ? newVal : p);
    else if (type === 'class') newConfig.classes = newConfig.classes.map(c => c === oldVal ? newVal : c);

    const newSchedule = {};
    Object.keys(currentSchedule).forEach(k => {
      let newKey = k;
      if (type === 'date' && k.startsWith(`${oldVal}-`)) {
        newKey = k.replace(`${oldVal}-`, `${newVal}-`);
      } else if (type === 'class' && k.endsWith(`-${oldVal}`)) {
        newKey = k.substring(0, k.lastIndexOf(`-${oldVal}`)) + `-${newVal}`;
      } else if (type === 'period') {
        if (k.includes(`-${oldVal}-`)) newKey = k.replace(`-${oldVal}-`, `-${newVal}-`);
      }
      newSchedule[newKey] = currentSchedule[k];
    });

    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, config: newConfig, schedule: newSchedule } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentConfig, currentSchedule, pushHistory]);

  const handleBulkAction = useCallback((action, type, val) => {
    const ns = { ...currentSchedule };
    let upd = false;
    currentConfig.dates.forEach(date => currentConfig.periods.forEach(per => currentConfig.classes.forEach(cls => {
      if ((type === 'date' && date === val) || (type === 'class' && cls === val) || (type === 'period' && per === val)) {
        const k = `${date}-${per}-${cls}`;
        if (!ns[k]) ns[k] = {};
        if (action === 'lock-all') { ns[k] = { ...ns[k], locked: true }; upd = true; }
        if (action === 'unlock-all') { ns[k] = { ...ns[k], locked: false }; upd = true; }
        if (action === 'clear-all' && !ns[k].locked) { delete ns[k]; upd = true; }
      }
    })));
    if (upd) {
      const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: ns } : t);
      pushHistory({ ...project, tabs: newTabs });
    }
  }, [project, currentConfig, currentSchedule, pushHistory]);

  const handleCellCopy = useCallback((d, p, c) => {
    const k = `${d}-${p}-${c}`;
    const curr = currentSchedule[k] || {};
    if (curr.subject) return { subject: curr.subject, teacher: curr.teacher };
    return null;
  }, [currentSchedule]);

  const handleCellPaste = useCallback((d, p, c, clipboard) => {
    const k = `${d}-${p}-${c}`;
    const curr = currentSchedule[k] || {};
    if (clipboard && !curr.locked) {
      const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: { ...t.schedule, [k]: { ...curr, subject: clipboard.subject, teacher: clipboard.teacher } } } : t);
      pushHistory({ ...project, tabs: newTabs });
    }
  }, [project, currentSchedule, pushHistory]);

  const handleCellClear = useCallback((d, p, c) => {
    const k = `${d}-${p}-${c}`;
    const curr = currentSchedule[k] || {};
    if (!curr.locked) {
      const ns = { ...currentSchedule };
      delete ns[k];
      const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: ns } : t);
      pushHistory({ ...project, tabs: newTabs });
    }
  }, [project, currentSchedule, pushHistory]);

  const handleSetNg = useCallback((d, p, c) => {
    const k = `${d}-${p}-${c}`;
    const curr = currentSchedule[k] || {};
    if (curr.teacher && curr.teacher !== "未定") {
      const teacherIdx = project.teachers.findIndex(t => t.name === curr.teacher);
      if (teacherIdx >= 0) toggleTeacherNg(teacherIdx, d, p);
    }
  }, [currentSchedule, project.teachers, toggleTeacherNg]);

  const handleClearUnlocked = useCallback(() => {
    const ns = {};
    Object.keys(currentSchedule).forEach(k => { if (currentSchedule[k].locked) ns[k] = currentSchedule[k]; });
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: ns } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentSchedule, pushHistory]);

  const handleExternalCountChange = useCallback((d, t, v) => {
    const counts = { ...project.externalCounts, [`${d}-${t}`]: parseInt(v) || 0 };
    pushHistory({ ...project, externalCounts: counts });
  }, [project, pushHistory]);

  const handleSwapCells = useCallback((sourceKey, sourceData, targetKey, targetData) => {
    if (targetData.locked) return;
    const ns = { ...currentSchedule };
    ns[sourceKey] = { ...targetData, locked: false };
    ns[targetKey] = { ...sourceData, locked: false };
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: ns } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, currentSchedule, pushHistory]);

  // --- 保存/読込 ---
  const handleSaveAsDefault = useCallback(() => {
    const defaults = { teachers: project.teachers, config: activeTab.config };
    localStorage.setItem(STORAGE_KEY_USER_DEFAULTS, JSON.stringify(defaults));
  }, [project, activeTab]);

  const handleResetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_PROJECT);
    window.location.reload();
  }, []);

  const applyPattern = useCallback((pat) => {
    const newTabs = project.tabs.map(t => t.id === project.activeTabId ? { ...t, schedule: pat } : t);
    pushHistory({ ...project, tabs: newTabs });
  }, [project, pushHistory]);

  const handleLoadJson = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        pushHistory(cleanSchedule(data));
        alert("読込完了");
      } catch { alert("エラー"); }
    };
    r.readAsText(f);
    e.target.value = '';
  }, [pushHistory]);

  const handleSaveJson = useCallback(() => {
    const cleaned = cleanSchedule(project);
    const b = new Blob([JSON.stringify(cleaned, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u;
    a.download = `schedule_project_v45.json`;
    a.click();
  }, [project]);

  return {
    project,
    setProject,
    history,
    historyIndex,
    saveStatus,
    fileInputRef,
    activeTab,
    currentSchedule,
    currentConfig,
    commonSubjects,
    pushHistory,
    undo,
    redo,
    // タブ管理
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
    switchTab,
    // 設定
    handleListConfigChange,
    handleSubjectCountChange,
    // 講師
    addTeacher,
    removeTeacher,
    toggleTeacherSubject,
    toggleTeacherNg,
    toggleTeacherClassPriority,
    // スケジュール
    handleAssign,
    toggleLock,
    handleRenameHeader,
    handleBulkAction,
    handleCellCopy,
    handleCellPaste,
    handleCellClear,
    handleSetNg,
    handleClearUnlocked,
    handleExternalCountChange,
    handleSwapCells,
    // 保存/読込
    handleSaveAsDefault,
    handleResetAll,
    applyPattern,
    handleLoadJson,
    handleSaveJson,
  };
}
