import { useMemo } from 'react';

export function useAnalysis(project, currentSchedule, currentConfig) {
  const analysis = useMemo(() => {
    const conflictMap = {};
    const subjectOrders = {};
    const dailySubjectMap = {};
    const errorKeys = [];
    const teacherDailyCounts = {};
    const globalUsage = {};

    project.tabs.forEach(tab => {
      Object.keys(tab.schedule).forEach(key => {
        const entry = tab.schedule[key];
        if (!entry || !entry.teacher || entry.teacher === "未定") return;
        const matchedDate = tab.config.dates.find(d => key.startsWith(d));
        const matchedPeriod = tab.config.periods.find(p => key.includes(p));
        if (matchedDate && matchedPeriod) {
          const usageKey = `${matchedDate}-${matchedPeriod}-${entry.teacher}`;
          if (!globalUsage[usageKey]) globalUsage[usageKey] = [];
          globalUsage[usageKey].push({ tabId: tab.id });
          const dayKey = `${matchedDate}-${entry.teacher}`;
          if (!teacherDailyCounts[dayKey]) {
            const ext = (project.externalCounts?.[dayKey] || 0);
            teacherDailyCounts[dayKey] = { current: 0, external: ext, total: ext };
          }
          teacherDailyCounts[dayKey].current++;
          teacherDailyCounts[dayKey].total++;
        }
      });
    });

    currentConfig.dates.forEach(d => {
      currentConfig.periods.forEach(p => {
        currentConfig.classes.forEach(c => {
          const key = `${d}-${p}-${c}`;
          const entry = currentSchedule[key];
          if (entry && entry.subject) {
            const subjKey = `${c}-${d}-${entry.subject}`;
            dailySubjectMap[subjKey] = (dailySubjectMap[subjKey] || 0) + 1;
          }
          if (entry && entry.teacher && entry.teacher !== "未定") {
            const usageKey = `${d}-${p}-${entry.teacher}`;
            if ((globalUsage[usageKey] || []).length > 1) {
              conflictMap[`${d}-${p}-${entry.teacher}`] = true;
              errorKeys.push(key);
            }
          }
        });
      });
    });

    currentConfig.classes.forEach(c => {
      const counts = {};
      currentConfig.dates.forEach(d => {
        currentConfig.periods.forEach(p => {
          const key = `${d}-${p}-${c}`;
          const s = currentSchedule[key]?.subject;
          if (s) { counts[s] = (counts[s] || 0) + 1; subjectOrders[key] = counts[s]; }
        });
      });
    });

    return { conflictMap, subjectOrders, dailySubjectMap, errorKeys, teacherDailyCounts };
  }, [project, currentSchedule, currentConfig]);

  const dashboard = useMemo(() => {
    const total = Object.values(currentConfig.subjectCounts).reduce((a, b) => a + b, 0) * currentConfig.classes.length;
    let filled = 0;
    Object.values(currentSchedule).forEach(v => { if (v.subject) filled++; });
    return { progress: total > 0 ? Math.round((filled / total) * 100) : 0, filled, total };
  }, [currentSchedule, currentConfig]);

  return { analysis, dashboard };
}
