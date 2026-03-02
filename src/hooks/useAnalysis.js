import { useMemo } from 'react';
import { makeKey, makeExternalKey, parseKey } from '../utils/scheduleKey';

export function useAnalysis(project, currentSchedule, currentConfig) {
  const analysis = useMemo(() => {
    const conflictMap = {};
    const subjectOrders = {};
    const dailySubjectMap = {};
    const errorKeys = [];
    const teacherDailyCounts = {};
    const globalUsage = {};

    // 全タブ横断の重複検出・日別コマ数集計
    project.tabs.forEach(tab => {
      Object.keys(tab.schedule).forEach(key => {
        const entry = tab.schedule[key];
        if (!entry || !entry.teacher || entry.teacher === "未定") return;
        const parsed = parseKey(key);
        if (!parsed) return;
        const { dIdx, pIdx } = parsed;
        const date = tab.config.dates[dIdx];
        const period = tab.config.periods[pIdx];
        if (!date || !period) return;

        const usageKey = `${date}-${period}-${entry.teacher}`;
        if (!globalUsage[usageKey]) globalUsage[usageKey] = [];
        globalUsage[usageKey].push({ tabId: tab.id });

        const dayKey = makeExternalKey(date, entry.teacher);
        if (!teacherDailyCounts[dayKey]) {
          const ext = (project.externalCounts?.[dayKey] || 0);
          teacherDailyCounts[dayKey] = { current: 0, external: ext, total: ext };
        }
        teacherDailyCounts[dayKey].current++;
        teacherDailyCounts[dayKey].total++;
      });
    });

    // 現在タブの分析
    currentConfig.dates.forEach((d, dIdx) => {
      currentConfig.periods.forEach((p, pIdx) => {
        currentConfig.classes.forEach((c, cIdx) => {
          const key = makeKey(dIdx, pIdx, cIdx);
          const entry = currentSchedule[key];
          if (entry && entry.subject) {
            const subjKey = `c${cIdx}-d${dIdx}-${entry.subject}`;
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

    // 科目順序の計算
    currentConfig.classes.forEach((c, cIdx) => {
      const counts = {};
      currentConfig.dates.forEach((d, dIdx) => {
        currentConfig.periods.forEach((p, pIdx) => {
          const key = makeKey(dIdx, pIdx, cIdx);
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
