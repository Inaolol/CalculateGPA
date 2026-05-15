export const GRADE_SCALE = [
  { letter: "AA", points: 4.0, label: "Excellent" },
  { letter: "BA", points: 3.5, label: "Very good" },
  { letter: "BB", points: 3.0, label: "Good" },
  { letter: "CB", points: 2.5, label: "Above average" },
  { letter: "CC", points: 2.0, label: "Average" },
  { letter: "DC", points: 1.5, label: "Below average" },
  { letter: "DD", points: 1.0, label: "Conditional pass" },
  { letter: "FD", points: 0.5, label: "Fail" },
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

export const calcGPA = (courses) => {
  let totalPts = 0, totalEcts = 0;
  for (const c of courses) {
    const g = GRADE_BY_LETTER[c.grade];
    if (!g) continue;
    totalPts += g.points * c.ects;
    totalEcts += c.ects;
  }
  return {
    gpa: totalEcts ? totalPts / totalEcts : 0,
    ects: totalEcts,
    count: courses.filter((c) => GRADE_BY_LETTER[c.grade]).length,
  };
};

export const computeRunningTotals = (data) => {
  let totReceived = 0, totCompleted = 0, totPts = 0, totEctsForGPA = 0;
  const map = new Map();
  for (const y of data) {
    for (const s of y.semesters) {
      let semReceived = 0, semCompleted = 0, semPts = 0, semEctsForGPA = 0;
      for (const c of s.courses) {
        const g = GRADE_BY_LETTER[c.grade];
        if (!g) continue;
        semReceived += c.ects;
        semPts += g.points * c.ects;
        semEctsForGPA += c.ects;
        if (g.points >= 1.0) semCompleted += c.ects;
      }
      totReceived += semReceived;
      totCompleted += semCompleted;
      totPts += semPts;
      totEctsForGPA += semEctsForGPA;
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

  const VALID = new Set(["AA", "BA", "BB", "CB", "CC", "DC", "DD", "FD", "FF"]);
  const SEM_RE =
    /(fall|spring|summer|autumn|winter|g[üu]z|bahar|yaz)\s*[-–\s]*([0-9]{4})\s*[-–/]?\s*([0-9]{2,4})?/i;
  const CODE_RE = /^[A-ZÇĞİÖŞÜ]{2,5}\s*[-]?\s*[0-9]{2,4}[A-Z]?$/;
  const ECTS_RE = /^([0-9]{1,2})([.,][0-9]+)?$/;
  const TYPE_RE = /^(c|e|z|s|comp|elect|zorunlu|seçmeli|secmeli)$/i;

  const normSem = (s) => {
    const m = SEM_RE.exec(s || "");
    if (!m) return null;
    let term = m[1].toLowerCase();
    if (term.startsWith("g") || term === "autumn") term = "fall";
    else if (term.startsWith("b")) term = "spring";
    else if (term === "yaz") term = "summer";
    const y1 = parseInt(m[2], 10);
    let y2 = m[3] ? parseInt(m[3], 10) : null;
    if (y2 && y2 < 100) y2 = 2000 + y2;
    if (!y2) y2 = term === "fall" ? y1 + 1 : y1;
    const yearStart = term === "fall" ? y1 : y1 - 1;
    return { kind: term, title: term[0].toUpperCase() + term.slice(1) + " " + y1, yearStart };
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

    const cells = Array.from(tr.querySelectorAll("td, th")).map((td) =>
      td.textContent.replace(/\s+/g, " ").trim()
    );
    if (cells.length < 3) continue;

    let code = "", name = "", ects = null, type = "", grade = "";
    for (const c of cells) {
      if (!code && CODE_RE.test(c.replace(/\s/g, ""))) { code = c.replace(/\s/g, ""); continue; }
      if (!grade && VALID.has(c.toUpperCase())) { grade = c.toUpperCase(); continue; }
      if (ects === null && ECTS_RE.test(c)) {
        const v = parseFloat(c.replace(",", "."));
        if (v > 0 && v <= 30) { ects = v; continue; }
      }
      if (!type && TYPE_RE.test(c)) {
        const t = c.toLowerCase();
        type = t === "e" || t.startsWith("elect") || t.startsWith("se") ? "E" : "C";
        continue;
      }
    }
    if (code) {
      const used = new Set([code, grade]);
      let best = "";
      for (const c of cells) {
        if (used.has(c) || ECTS_RE.test(c) || TYPE_RE.test(c)) continue;
        if (c.length > best.length) best = c;
      }
      name = best || code;
    }
    if (!code) continue;
    if (!ects) ects = 5;
    if (!type) type = "C";

    const sem = currentSem ||
      normSem(text) || { kind: "fall", title: "Imported", yearStart: 2024 };
    const bucket = ensureSem(sem);
    bucket.courses.push({ id: uid(), code, name, ects, type, grade });
  }

  const sorted = [...buckets.values()].sort(
    (a, b) => a.yearStart - b.yearStart || (a.kind === "fall" ? -1 : 1)
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

