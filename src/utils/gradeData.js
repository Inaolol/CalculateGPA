export const GRADE_SCALE = [
  { letter: "AA", points: 4.0, label: "Excellent" },
  { letter: "BA", points: 3.5, label: "Very good" },
  { letter: "BB", points: 3.0, label: "Good" },
  { letter: "CB", points: 2.5, label: "Above average" },
  { letter: "CC", points: 2.0, label: "Average" },
  { letter: "DC", points: 1.5, label: "Below average" },
  { letter: "DD", points: 1.0, label: "Conditional pass" },
  { letter: "FF", points: 0.0, label: "Fail" },
];

export const GRADE_BY_LETTER = Object.fromEntries(GRADE_SCALE.map((g) => [g.letter, g]));

export const standingFor = (gpa) => {
  if (gpa >= 3.5) return { label: "High Honors" };
  if (gpa >= 3.0) return { label: "Honors" };
  if (gpa >= 2.0) return { label: "Good Standing" };
  if (gpa >= 1.0) return { label: "Probation" };
  return { label: "At Risk" };
};

export const uid = () => Math.random().toString(36).slice(2, 9);

// Strip curriculum-version suffix (e.g. "MATH151.1" -> "MATH151") so a repeat
// across curriculum versions is recognised as the same course.
const dedupKey = (code) => (code || "").replace(/\.[0-9]+$/, "");

const dedupeLatestByCode = (courses) => {
  const byCode = new Map();
  const noCode = [];
  for (const c of courses) {
    if (c.code) byCode.set(dedupKey(c.code), c);
    else noCode.push(c);
  }
  return [...byCode.values(), ...noCode];
};

export const calcGPA = (courses, { dedupeByCode = false } = {}) => {
  const list = dedupeByCode ? dedupeLatestByCode(courses) : courses;
  let totalPts = 0, totalEcts = 0, count = 0;
  for (const c of list) {
    const g = GRADE_BY_LETTER[c.grade];
    if (!g) continue;
    const ects = c.ects || 0;
    totalPts += g.points * ects;
    totalEcts += ects;
    count++;
  }
  return {
    gpa: totalEcts ? totalPts / totalEcts : 0,
    ects: totalEcts,
    count,
  };
};

export const sumUniqueEcts = (courses) => {
  const byCode = new Map();
  let sum = 0;
  for (const c of courses) {
    const e = c.ects || 0;
    if (c.code) byCode.set(dedupKey(c.code), e);
    else sum += e;
  }
  for (const e of byCode.values()) sum += e;
  return sum;
};

export const computeRunningTotals = (data) => {
  const map = new Map();
  // Cumulative store keyed by course code (or fallback id). A later attempt
  // overwrites the prior entry — applying the "R" replacement rule.
  const cumulative = new Map();

  for (const y of data) {
    for (const s of y.semesters) {
      let semReceived = 0, semCompleted = 0, semPts = 0, semEctsForGPA = 0;
      for (const c of s.courses) {
        const g = GRADE_BY_LETTER[c.grade];
        if (!g) continue;
        const ects = c.ects || 0;
        semReceived += ects;
        semPts += g.points * ects;
        semEctsForGPA += ects;
        if (g.points >= 1.0) semCompleted += ects;

        const key = c.code ? dedupKey(c.code) : `__${c.id}`;
        cumulative.set(key, {
          ects,
          points: g.points * ects,
          completed: g.points >= 1.0 ? ects : 0,
        });
      }

      let totReceived = 0, totCompleted = 0, totPts = 0, totEctsForGPA = 0;
      for (const v of cumulative.values()) {
        totReceived += v.ects;
        totCompleted += v.completed;
        totPts += v.points;
        totEctsForGPA += v.ects;
      }

      map.set(s.id, {
        semReceived: +semReceived.toFixed(2),
        semCompleted: +semCompleted.toFixed(2),
        semGPA: semEctsForGPA ? semPts / semEctsForGPA : 0,
        totReceived: +totReceived.toFixed(2),
        totCompleted: +totCompleted.toFixed(2),
        totGPA: totEctsForGPA ? totPts / totEctsForGPA : 0,
      });
    }
  }
  return map;
};

export const parseTranscriptHTML = (html) => {
  const result = { years: [], warnings: [] };
  if (!html || !html.trim()) {
    result.warnings.push("Empty input");
    return result;
  }
  let doc;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch (e) {
    result.warnings.push("Couldn't parse HTML: " + e.message);
    return result;
  }

  // Only real GPA grades — everything else (M, S, P, EX…) is skipped
  const VALID = new Set(["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FF"]);

  // Accepts both orderings: "Fall 2022", "Spring 2022-2023", "2022-2023 Fall Semester".
  const SEM_RE =
    /(?:([0-9]{4})(?:\s*[-–/]\s*[0-9]{2,4})?\s*)?(fall|spring|summer|autumn|winter|g[üu]z|bahar|yaz)(?:\s*([0-9]{4})(?:\s*[-–/]\s*[0-9]{2,4})?)?/i;
  // Matches codes like PHYS101, MATH151, ENG101.2, SWE227
  const CODE_RE = /^[A-ZÇĞİÖŞÜ]{2,6}[0-9]{2,4}[A-Z]?(?:\.[0-9]+)?$/;
  // Matches "CODE COURSE NAME" (with optional leading "[1] " footnote) in one cell
  const CODE_NAME_RE = /^(?:\[\d+\]\s*)?([A-ZÇĞİÖŞÜ]{2,6}[0-9]{2,4}[A-Z]?(?:\.[0-9]+)?)\s+(\S.*)/;
  const ECTS_RE = /^([0-9]{1,2})([.,][0-9]+)?$/;
  // Handles Z, ZY, ZYR, ZR (compulsory variants), U, P, F (elective variants), C, E, S
  const TYPE_RE = /^(Z[YRDT]*|U|P|F|C|E|S|comp|elect|zorunlu|seçmeli|secmeli)$/i;

  const normSem = (s) => {
    if (!s) return null;
    const m = SEM_RE.exec(s);
    if (!m) return null;
    let term = m[2].toLowerCase();
    if (term.startsWith("g") || term === "autumn") term = "fall";
    else if (term.startsWith("b")) term = "spring";
    else if (term === "yaz") term = "summer";
    const yearBefore = m[1] ? parseInt(m[1], 10) : null;
    const yearAfter = m[3] ? parseInt(m[3], 10) : null;
    let yearStart, semYear;
    if (yearBefore != null) {
      // "2022-2023 Fall": academic year starts in the first year listed;
      // the Fall semester is in that year, Spring is in the next.
      yearStart = yearBefore;
      semYear = term === "fall" ? yearBefore : yearBefore + 1;
    } else if (yearAfter != null) {
      // "Fall 2022" or "Spring 2023": yearStart groups the academic year.
      semYear = yearAfter;
      yearStart = term === "fall" ? yearAfter : yearAfter - 1;
    } else return null;
    return {
      kind: term,
      title: term[0].toUpperCase() + term.slice(1) + " " + semYear,
      yearStart,
    };
  };

  const rows = Array.from(doc.querySelectorAll("tr"));
  let currentSem = null;
  const buckets = new Map();

  const ensureSem = (sem) => {
    const k = sem.kind + ":" + sem.yearStart;
    if (!buckets.has(k)) buckets.set(k, { ...sem, courses: [] });
    return buckets.get(k);
  };

  for (const tr of rows) {
    const text = (tr.textContent || "").replace(/\s+/g, " ").trim();
    const sm = normSem(text);
    if (sm && text.length < 60) {
      currentSem = sm;
      ensureSem(currentSem);
      continue;
    }

    // ── Structured format (Altınbaş university portal CSS classes) ──
    const zsEl    = tr.querySelector(".tra-donem-col-ders-zs");
    const dersEl  = tr.querySelector(".tra-donem-col-ders-ders");
    const ectsEl  = tr.querySelector(".tra-donem-col-ders-ects");
    const gradeEl = tr.querySelector(".tra-donem-col-ders-harfnotu");

    if (zsEl && dersEl && gradeEl) {
      // Strip footnote markers like "[1]" that appear before some codes
      const dersText = dersEl.textContent.replace(/\[\d+\]\s*/g, "").replace(/\s+/g, " ").trim();
      const gradeText = gradeEl.textContent.trim().toUpperCase();
      const ectsVal = ectsEl ? parseFloat(ectsEl.textContent.replace(",", ".")) || 0 : 0;

      const cnMatch = CODE_NAME_RE.exec(dersText);
      if (!cnMatch) continue;
      const code = cnMatch[1];
      const name = cnMatch[2].trim();

      // Z/ZY/ZR = compulsory; U/P/F = elective
      const rawType = zsEl.textContent.trim().toUpperCase();
      const type = (rawType[0] === "U" || rawType[0] === "P" || rawType[0] === "F") ? "E" : "C";

      // Skip non-GPA grades (M, S, P, EX…); store as empty grade
      const grade = VALID.has(gradeText) ? gradeText : "";

      const sem = currentSem || { kind: "fall", title: "Imported", yearStart: 2024 };
      ensureSem(sem).courses.push({ id: uid(), code, name, ects: ectsVal, type, grade });
      continue;
    }

    // ── Generic fallback parser ──────────────────────────────────
    const cells = Array.from(tr.querySelectorAll("td, th")).map((td) =>
      td.textContent.replace(/\s+/g, " ").trim()
    );
    if (cells.length < 3) continue;

    let code = "", name = "", ects = null, type = "", grade = "";
    for (const c of cells) {
      // Check type before grade so "P" (dept-elective column) isn't consumed as a grade
      if (!type && TYPE_RE.test(c)) {
        const t = c.toUpperCase();
        type = (t[0] === "U" || t[0] === "P" || t[0] === "F" ||
                t.startsWith("ELECT") || t.startsWith("SE")) ? "E" : "C";
        continue;
      }
      if (!code) {
        if (CODE_RE.test(c.replace(/\s/g, ""))) { code = c.replace(/\s/g, ""); continue; }
        const m = CODE_NAME_RE.exec(c);
        if (m) { code = m[1]; if (!name) name = m[2].trim(); continue; }
      }
      if (!grade && VALID.has(c.toUpperCase())) { grade = c.toUpperCase(); continue; }
      if (ects === null && ECTS_RE.test(c)) {
        const v = parseFloat(c.replace(",", "."));
        if (v > 0 && v <= 30) { ects = v; continue; }
      }
    }
    if (code && !name) {
      const used = new Set([code, grade]);
      let best = "";
      for (const c of cells) {
        if (used.has(c) || ECTS_RE.test(c) || TYPE_RE.test(c)) continue;
        if (c.length > best.length) best = c;
      }
      name = best || code;
    }
    if (!code) continue;
    if (ects === null) ects = 5;
    if (!type) type = "C";

    const sem = currentSem ||
      normSem(text) || { kind: "fall", title: "Imported", yearStart: 2024 };
    ensureSem(sem).courses.push({ id: uid(), code, name, ects, type, grade });
  }

  const kindRank = { fall: 0, spring: 1, summer: 2 };
  const sorted = [...buckets.values()].sort(
    (a, b) => a.yearStart - b.yearStart || (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9)
  );
  const yearMap = new Map();
  for (const b of sorted) {
    if (!yearMap.has(b.yearStart)) yearMap.set(b.yearStart, []);
    yearMap.get(b.yearStart).push(b);
  }
  let i = 1;
  for (const [yearStart, sems] of yearMap) {
    result.years.push({
      id: uid(),
      label: "Year " + i,
      academic: yearStart + " — " + (yearStart + 1),
      semesters: sems.map((s) => ({
        id: uid(),
        kind: s.kind,
        title: s.title,
        courses: s.courses,
      })),
    });
    i++;
  }

  if (result.years.length === 0) {
    result.warnings.push(
      "No courses detected. Make sure you pasted the full transcript HTML (right-click the table → Copy outerHTML)."
    );
  } else {
    const total = result.years.reduce(
      (a, y) => a + y.semesters.reduce((b, s) => b + s.courses.length, 0),
      0
    );
    result.warnings.push(
      `Imported ${total} course${total === 1 ? "" : "s"} across ${result.years.length} year${result.years.length === 1 ? "" : "s"}.`
    );
  }
  return result;
};
