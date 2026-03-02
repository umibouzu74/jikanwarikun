// 自動生成ロジック（MRV法 + バックトラッキング）
// 純粋関数として抽出。UI依存なし。
import { makeKey, makeNgKey, makeExternalKey } from '../utils/scheduleKey';

// シード付き疑似乱数生成器 (Mulberry32)
function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// シード付きシャッフル（Fisher-Yates）
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_ITERATIONS = 500000;

/**
 * 単一パターンを生成する（シード指定可能）
 * @returns {{ solution: object|null, bestPartial: object, filledCount: number, totalSlots: number }}
 */
export function generateSinglePattern({ project, activeTabId, seed = 0 }) {
  const rng = mulberry32(seed);
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

  let solution = null;
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

  const totalSlots = slots.length;

  // MRV: 候補者が少ないコマから優先（シード付きランダムでタイブレーク）
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
    slot.tieBreaker = rng();
  });

  slots.sort((a, b) => {
    if (a.score === b.score) return a.tieBreaker - b.tieBreaker;
    return a.score - b.score;
  });

  // 部分解の追跡
  let bestPartial = null;
  let bestFilledCount = -1;

  const solve = (idx, tempSch, tempCnt, tempDaily, iter = { c: 0 }) => {
    if (iter.c++ > MAX_ITERATIONS || solution !== null) return;

    // 部分解の更新（現在の充填度が最高なら保存）
    if (idx > bestFilledCount) {
      bestFilledCount = idx;
      bestPartial = JSON.parse(JSON.stringify(tempSch));
    }

    if (idx >= slots.length) {
      solution = JSON.parse(JSON.stringify(tempSch));
      return;
    }

    const { dIdx, pIdx, cIdx, d, p, c, k, fixedSubject } = slots[idx];
    const subjectsToTry = fixedSubject ? [fixedSubject] : seededShuffle(commonSubjects, rng);

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
        ...seededShuffle(priorityGroup, rng),
        ...seededShuffle(neutralGroup, rng)
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
        if (solution !== null) return;

        if (fixedSubject) tempSch[k] = { subject: fixedSubject, teacher: "" };
        else { delete tempSch[k]; tempCnt[cIdx][s]--; }
        tempDaily[dayKey]--;
      }
    }
  };

  const initialDaily = {};
  solve(0, JSON.parse(JSON.stringify(currentSchedule)), JSON.parse(JSON.stringify(currentCounts)), initialDaily);

  return {
    solution,
    bestPartial,
    filledCount: bestFilledCount,
    totalSlots,
  };
}

/**
 * 複数パターンを生成する（後方互換のためのラッパー）
 * onProgress コールバックで進捗を通知可能
 */
export function generateSchedule({ project, activeTabId, numPatterns = 3 }) {
  const results = [];
  const baseSeed = Date.now();

  for (let i = 0; i < numPatterns; i++) {
    const seed = baseSeed + i * 7919; // 素数でオフセットして多様性を確保
    const result = generateSinglePattern({ project, activeTabId, seed });
    results.push(result);
  }

  return results;
}
