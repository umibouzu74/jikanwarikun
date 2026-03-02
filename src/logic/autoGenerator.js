// 自動生成ロジック（MRV法 + バックトラッキング）
// 純粋関数として抽出。UI依存なし。
import { makeKey, makeNgKey, makeExternalKey } from '../utils/scheduleKey';

export function generateSchedule({ project, activeTabId }) {
  const activeTab = project.tabs.find(t => t.id === activeTabId) || project.tabs[0];
  const currentSchedule = activeTab.schedule;
  const currentConfig = activeTab.config;
  const commonSubjects = Object.keys(currentConfig.subjectCounts);

  const baseDailyCounts = {};
  project.teachers.forEach(t => {
    currentConfig.dates.forEach(d => {
      const key = makeExternalKey(d, t.name);
      baseDailyCounts[key] = project.externalCounts?.[key] || 0;
    });
  });

  const currentTabFixedCounts = {};
  currentConfig.dates.forEach((d, dIdx) => {
    currentConfig.periods.forEach((p, pIdx) => {
      currentConfig.classes.forEach((c, cIdx) => {
        const k = makeKey(dIdx, pIdx, cIdx);
        const entry = currentSchedule[k];
        if (entry && entry.teacher && entry.teacher !== "未定") {
          const dayKey = makeExternalKey(d, entry.teacher);
          currentTabFixedCounts[dayKey] = (currentTabFixedCounts[dayKey] || 0) + 1;
        }
      });
    });
  });

  const solutions = [];
  const slots = [];
  const currentCounts = {};
  currentConfig.classes.forEach((c, cIdx) => {
    currentCounts[cIdx] = {};
    commonSubjects.forEach(s => currentCounts[cIdx][s] = 0);
  });

  // 既存の科目カウントを集計
  currentConfig.dates.forEach((d, dIdx) => {
    currentConfig.periods.forEach((p, pIdx) => {
      currentConfig.classes.forEach((c, cIdx) => {
        const k = makeKey(dIdx, pIdx, cIdx);
        const e = currentSchedule[k];
        if (e?.subject) {
          if (currentCounts[cIdx]) currentCounts[cIdx][e.subject] = (currentCounts[cIdx][e.subject] || 0) + 1;
        }
      });
    });
  });

  // 未充填スロットを構築
  currentConfig.dates.forEach((d, dIdx) => currentConfig.periods.forEach((p, pIdx) => currentConfig.classes.forEach((c, cIdx) => {
    const k = makeKey(dIdx, pIdx, cIdx);
    const entry = currentSchedule[k];
    if (!entry || !entry.subject || !entry.teacher) {
      slots.push({ dIdx, pIdx, cIdx, d, p, c, k, fixedSubject: entry?.subject });
    }
  })));

  // MRV: 候補者が少ないコマから優先
  slots.forEach(slot => {
    let validCandidates = 0;
    const subjectsToCheck = slot.fixedSubject ? [slot.fixedSubject] : commonSubjects;
    subjectsToCheck.forEach(subj => {
      project.teachers.forEach(t => {
        if (t.subjects.includes(subj) &&
          !t.ngSlots?.includes(makeNgKey(slot.d, slot.p)) &&
          !t.ngClasses?.includes(slot.c)) {
          validCandidates++;
        }
      });
    });
    slot.score = validCandidates;
  });

  slots.sort((a, b) => {
    if (a.score === b.score) return Math.random() - 0.5;
    return a.score - b.score;
  });

  const solve = (idx, tempSch, tempCnt, tempDaily, iter = { c: 0 }) => {
    if (iter.c++ > 500000 || solutions.length >= 1) return;
    if (idx >= slots.length) { solutions.push(JSON.parse(JSON.stringify(tempSch))); return; }

    const { dIdx, pIdx, cIdx, d, p, c, k, fixedSubject } = slots[idx];
    const subjectsToTry = fixedSubject ? [fixedSubject] : commonSubjects.sort(() => Math.random() - 0.5);

    for (const s of subjectsToTry) {
      if (!fixedSubject && (tempCnt[cIdx][s] || 0) >= currentConfig.subjectCounts[s]) continue;
      // 同日・同クラスに同じ科目があるかチェック
      if (!fixedSubject && currentConfig.periods.some((per, pi) => tempSch[makeKey(dIdx, pi, cIdx)]?.subject === s)) continue;

      const validT = project.teachers.filter(t =>
        t.subjects.includes(s) &&
        !t.ngSlots?.includes(makeNgKey(d, p)) &&
        !t.ngClasses?.includes(c)
      );

      const priorityGroup = [];
      const neutralGroup = [];
      validT.forEach(t => {
        if (t.priorityClasses?.includes(c)) priorityGroup.push(t);
        else neutralGroup.push(t);
      });

      const shuffledT = [
        ...priorityGroup.sort(() => Math.random() - 0.5),
        ...neutralGroup.sort(() => Math.random() - 0.5)
      ];

      for (const tObj of shuffledT) {
        const tName = tObj.name;
        const dayKey = makeExternalKey(d, tName);

        // 同じ日付・時限で他クラスに同じ講師がいるかチェック（ダブルブッキング防止）
        if (currentConfig.classes.some((oc, oci) => oci !== cIdx && tempSch[makeKey(dIdx, pIdx, oci)]?.teacher === tName)) continue;

        tempSch[k] = { subject: s, teacher: tName };
        if (!fixedSubject) tempCnt[cIdx][s]++;
        if (!tempDaily[dayKey]) tempDaily[dayKey] = 0; tempDaily[dayKey]++;

        solve(idx + 1, tempSch, tempCnt, tempDaily, iter);
        if (solutions.length >= 1) return;

        if (fixedSubject) tempSch[k] = { subject: fixedSubject, teacher: "" };
        else { delete tempSch[k]; tempCnt[cIdx][s]--; }
        tempDaily[dayKey]--;
      }
    }
  };

  const initialDaily = {};
  solve(0, JSON.parse(JSON.stringify(currentSchedule)), JSON.parse(JSON.stringify(currentCounts)), initialDaily);

  return solutions;
}
