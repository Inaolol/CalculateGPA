import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  GRADE_SCALE,
  GRADE_BY_LETTER,
  standingFor,
  uid,
  calcGPA,
  computeRunningTotals,
  parseTranscriptHTML,
  DEFAULT_DATA,
} from "../utils/gradeData";
import guideStep0 from "../assets/0.png";
import guideStep1 from "../assets/1.jpg";
import guideStep2 from "../assets/2.jpg";
import guideStep3 from "../assets/3.jpg";
import guideStep4 from "../assets/4.jpg";

const STORAGE_KEY = "altinbas_gpa_v1";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function emptyYear(label, startYear) {
  return {
    id: uid(),
    label,
    academic: `${startYear} — ${startYear + 1}`,
    semesters: [
      { id: uid(), kind: "fall",   title: `Fall ${startYear}`,   courses: [] },
      { id: uid(), kind: "spring", title: `Spring ${startYear + 1}`, courses: [] },
    ],
  };
}

function cloneWithFreshIds(years) {
  return years.map((y) => ({
    ...y,
    id: uid(),
    semesters: y.semesters.map((s) => ({
      ...s,
      id: uid(),
      courses: s.courses.map((c) => ({ ...c, id: uid() })),
    })),
  }));
}

// ── Icons ───────────────────────────────────────────────────────
const I = {
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  ),
  printer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="14" y2="17"/>
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/>
      <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z"/>
    </svg>
  ),
};

// ── Top bar ─────────────────────────────────────────────────────
function TopBar({ onImport, onReset, theme, onToggleTheme, showActions }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">α</div>
        <div className="brand-text">
          <div className="brand-title">GPA Calculator</div>
        </div>
      </div>
      <div className="topbar-actions">
        {showActions && (
          <>
            <button className="btn" onClick={onImport}>
              {I.upload}<span>Import transcript</span>
            </button>
            <button className="btn btn-danger" onClick={onReset} title="Clear all data and return to welcome screen">
              {I.trash}<span>Reset</span>
            </button>
          </>
        )}
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === "dark" ? I.sun : I.moon}
        </button>
      </div>
    </header>
  );
}

// ── Empty state ─────────────────────────────────────────────────
function EmptyState({ onImport, onAddFirstYear, onLoadSample }) {
  return (
    <section className="empty">
      <div className="empty-inner">
        <div className="empty-eyebrow">Welcome</div>
        <h1 className="empty-title">Build your GPA.</h1>
        <p className="empty-sub">
          Add your courses, semester by semester. Track every grade, plan what's next,
          and see your cumulative GPA recalculate as you type.
        </p>

        <div className="empty-options">
          <button className="empty-card primary" onClick={onImport}>
            <div className="empty-card-icon">{I.doc}</div>
            <div className="empty-card-title">Paste transcript HTML</div>
            <div className="empty-card-sub">
              Fastest — auto-fills every semester from your university's student portal.
            </div>
            <div className="empty-card-cta">Import →</div>
          </button>

          <button className="empty-card" onClick={onAddFirstYear}>
            <div className="empty-card-icon">{I.edit}</div>
            <div className="empty-card-title">Start from scratch</div>
            <div className="empty-card-sub">Create your first year and add courses manually.</div>
            <div className="empty-card-cta">New year →</div>
          </button>

          <button className="empty-card subtle" onClick={onLoadSample}>
            <div className="empty-card-icon">{I.sparkles}</div>
            <div className="empty-card-title">Try sample curriculum</div>
            <div className="empty-card-sub">
              Pre-filled Software Engineering plan — explore the calculator first.
            </div>
            <div className="empty-card-cta">Load sample →</div>
          </button>
        </div>

        <div className="empty-scale">
          <div className="empty-scale-row">
            {GRADE_SCALE.map((g) => (
              <div key={g.letter} className="empty-scale-cell">
                <span className={`grade-pill ${g.letter}`}>{g.letter}</span>
                <span className="empty-scale-pts">{g.points.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Hero stat strip ─────────────────────────────────────────────
function Hero({ data, cgpa, totalEcts, completedEcts, semesterSeries, distribution }) {
  const standing = standingFor(cgpa);
  const earnedCourses = data.reduce(
    (a, y) =>
      a + y.semesters.reduce((b, s) => b + s.courses.filter((c) => GRADE_BY_LETTER[c.grade]).length, 0),
    0
  );

  const colors = {
    AA: "var(--grade-aa)", BA: "var(--grade-ba)", BB: "var(--grade-bb)",
    CB: "var(--grade-cb)", CC: "var(--grade-cc)", DC: "var(--grade-dc)",
    DD: "var(--grade-dd)", FD: "var(--grade-fd)", FF: "var(--grade-ff)",
  };
  const totalGraded = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <section className="hero">
      <div className="hero-cell">
        <div className="hero-cell-label">Cumulative GPA</div>
        <div className="hero-cell-value">{cgpa.toFixed(2)}</div>
        <div className="hero-cell-note">
          <span className="standing">{standing.label}</span>
        </div>
      </div>

      <div className="hero-cell">
        <div className="hero-cell-label">Credits earned</div>
        <div className="hero-cell-value small">
          {completedEcts}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-3)", marginLeft: 6 }}>
            / {totalEcts}
          </span>
        </div>
        <div className="hero-cell-note">ECTS · {earnedCourses} graded courses</div>
      </div>

      <div className="hero-cell">
        <div className="hero-cell-label">Latest semester</div>
        <div className="hero-cell-value small">
          {semesterSeries.length ? semesterSeries[semesterSeries.length - 1].gpa.toFixed(2) : "—"}
        </div>
        <div className="hero-cell-note">
          {semesterSeries.length ? (
            <strong>{semesterSeries[semesterSeries.length - 1].title}</strong>
          ) : (
            "no data yet"
          )}
        </div>
      </div>

      <div className="hero-cell">
        <div className="hero-cell-label">Trend</div>
        <div className="sparkline" title="GPA per semester">
          {semesterSeries.map((s, i) => {
            const h = Math.max(8, (s.gpa / 4) * 100);
            const isLast = i === semesterSeries.length - 1;
            return (
              <div
                key={i}
                className={`spark-bar${isLast ? " current" : ""}`}
                style={{ height: `${h}%` }}
                title={`${s.title}: ${s.gpa.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="hero-cell-note">
          {semesterSeries.length >= 2 && (() => {
            const d =
              semesterSeries[semesterSeries.length - 1].gpa -
              semesterSeries[semesterSeries.length - 2].gpa;
            const sign = d > 0 ? "▲" : d < 0 ? "▼" : "—";
            return (
              <span>
                <span style={{ color: d > 0 ? "var(--grade-aa)" : d < 0 ? "var(--grade-fd)" : "var(--ink-3)" }}>
                  {sign} {Math.abs(d).toFixed(2)}
                </span>
                <span> vs previous</span>
              </span>
            );
          })()}
        </div>
      </div>

      <div className="hero-cell">
        <div className="hero-cell-label">Grade mix</div>
        <div className="distribution">
          {GRADE_SCALE.map((g) => {
            const n = distribution[g.letter] || 0;
            if (!n) return null;
            return (
              <div
                key={g.letter}
                style={{ flex: n, background: colors[g.letter] }}
                title={`${g.letter}: ${n}`}
              />
            );
          })}
          {totalGraded === 0 && <div style={{ flex: 1, background: "var(--line-soft)" }} />}
        </div>
        <div className="distribution-legend">
          {["AA", "BA", "BB", "CB", "CC"].map((L) =>
            distribution[L] ? (
              <span key={L}>
                <i style={{ background: colors[L] }} />
                {L}{" "}
                <strong style={{ color: "var(--ink-2)", fontWeight: 600, marginLeft: 2 }}>
                  {distribution[L]}
                </strong>
              </span>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

// ── Grade picker popover ────────────────────────────────────────
function GradePopover({ current, onChange, onClose, anchorRect }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

  useLayoutEffect(() => {
    if (!ref.current || !anchorRect) return;
    const r = ref.current.getBoundingClientRect();
    let left = anchorRect.left + anchorRect.width / 2 - r.width / 2;
    let top = anchorRect.bottom + 8;
    const margin = 8;
    if (left < margin) left = margin;
    if (left + r.width + margin > window.innerWidth) left = window.innerWidth - r.width - margin;
    if (top + r.height + margin > window.innerHeight) top = anchorRect.top - r.height - 8;
    setPos({ top, left, ready: true });
  }, [anchorRect]);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="grade-popover"
      style={{ top: pos.top, left: pos.left, position: "fixed", opacity: pos.ready ? 1 : 0 }}
    >
      {GRADE_SCALE.map((g) => (
        <button
          key={g.letter}
          className={`grade-pill ${g.letter}${current === g.letter ? " is-selected" : ""}`}
          onClick={() => { onChange(g.letter); onClose(); }}
          title={`${g.letter} · ${g.points.toFixed(1)} · ${g.label}`}
        >
          {g.letter}
        </button>
      ))}
      <button
        className="grade-popover-clear"
        onClick={() => { onChange(""); onClose(); }}
      >
        Clear grade
      </button>
    </div>
  );
}

// ── Course row ──────────────────────────────────────────────────
function CourseRow({ course, onUpdate, onDelete }) {
  const [picker, setPicker] = useState(null);
  const pillRef = useRef(null);

  const openPicker = () => {
    const r = pillRef.current.getBoundingClientRect();
    setPicker({ left: r.left, top: r.top, bottom: r.bottom, right: r.right, width: r.width, height: r.height });
  };
  const toggleType = () => onUpdate({ ...course, type: course.type === "C" ? "E" : "C" });

  return (
    <div className="tr-row">
      <button
        className={`type-cell ${course.type}`}
        onClick={toggleType}
        title={course.type === "C" ? "Compulsory (Zorunlu)" : "Elective (Seçmeli)"}
      >
        {course.type === "C" ? "Z" : "S"}
      </button>
      <div className="course-cell">
        <span className="course-code">
          <input
            value={course.code}
            onChange={(e) => onUpdate({ ...course, code: e.target.value.toUpperCase() })}
            placeholder="CODE"
          />
        </span>
        <span className="course-name">
          <input
            value={course.name}
            onChange={(e) => onUpdate({ ...course, name: e.target.value })}
            placeholder="Course name"
          />
        </span>
      </div>
      <div className="ects-cell">
        <input
          type="number"
          value={course.ects}
          min="0"
          max="30"
          step="0.5"
          onChange={(e) => onUpdate({ ...course, ects: parseFloat(e.target.value || "0") })}
        />
      </div>
      <div className="grade-cell">
        <button
          ref={pillRef}
          className={`grade-pill ${course.grade || "empty"}`}
          onClick={openPicker}
        >
          {course.grade || "—"}
        </button>
      </div>
      <button className="row-del" onClick={onDelete} title="Remove course">
        {I.trash}
      </button>
      {picker && (
        <GradePopover
          current={course.grade}
          onChange={(g) => onUpdate({ ...course, grade: g })}
          onClose={() => setPicker(null)}
          anchorRect={picker}
        />
      )}
    </div>
  );
}

// ── Inline add-course form ──────────────────────────────────────
function AddCourseInline({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [ects, setEcts] = useState("");
  const [type, setType] = useState("C");
  const [grade, setGrade] = useState("");
  const codeRef = useRef(null);

  useEffect(() => {
    if (open && codeRef.current) codeRef.current.focus();
  }, [open]);

  const submit = () => {
    if (!code && !name) return;
    onAdd({ id: uid(), code: code.toUpperCase(), name, ects: parseFloat(ects) || 5, type, grade });
    setCode(""); setName(""); setEcts(""); setType("C"); setGrade("");
    codeRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") setOpen(false);
  };

  if (!open) {
    return (
      <button className="tr-add" onClick={() => setOpen(true)}>
        {I.plus}<span>Add course</span>
      </button>
    );
  }

  return (
    <div className="tr-row tr-row-add" onKeyDown={onKey}>
      <button
        className={`type-cell ${type}`}
        onClick={() => setType(type === "C" ? "E" : "C")}
        title={type === "C" ? "Compulsory" : "Elective"}
      >
        {type === "C" ? "Z" : "S"}
      </button>
      <div className="course-cell">
        <span className="course-code">
          <input
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SE101"
          />
        </span>
        <span className="course-name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Course name" />
        </span>
      </div>
      <div className="ects-cell">
        <input
          type="number"
          value={ects}
          min="0"
          max="30"
          step="0.5"
          onChange={(e) => setEcts(e.target.value)}
          placeholder="ECTS"
        />
      </div>
      <div className="grade-cell">
        <select className="grade-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">—</option>
          {GRADE_SCALE.map((g) => (
            <option key={g.letter} value={g.letter}>{g.letter}</option>
          ))}
        </select>
      </div>
      <div className="tr-add-actions">
        <button className="btn btn-primary btn-sm" onClick={submit}>Add</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Done</button>
      </div>
    </div>
  );
}

// ── Semester card ───────────────────────────────────────────────
function Semester({ semester, totals, onUpdate, onDelete }) {
  const updateCourse = (id, next) =>
    onUpdate({ ...semester, courses: semester.courses.map((c) => (c.id === id ? next : c)) });
  const deleteCourse = (id) =>
    onUpdate({ ...semester, courses: semester.courses.filter((c) => c.id !== id) });
  const addCourse = (course) =>
    onUpdate({ ...semester, courses: [...semester.courses, course] });

  return (
    <div className="tr-card">
      <div className="tr-title">
        <input
          className="tr-title-input"
          value={semester.title}
          onChange={(e) => onUpdate({ ...semester, title: e.target.value })}
          aria-label="Semester title"
        />
        {onDelete && (
          <button className="tr-title-del" onClick={onDelete} title="Remove semester">
            {I.x}
          </button>
        )}
      </div>

      <div className="tr-head">
        <div className="th-type">C/E</div>
        <div className="th-course">Course</div>
        <div className="th-ects">Ects</div>
        <div className="th-grade">Grade</div>
        <div className="th-del" aria-hidden="true" />
      </div>

      <div className="tr-body">
        {semester.courses.length === 0 && (
          <div className="tr-empty">No courses yet · use Add course below</div>
        )}
        {semester.courses.map((c) => (
          <CourseRow
            key={c.id}
            course={c}
            onUpdate={(next) => updateCourse(c.id, next)}
            onDelete={() => deleteCourse(c.id)}
          />
        ))}
        <AddCourseInline onAdd={addCourse} />
      </div>

      <div className="tr-foot">
        <div className="tr-foot-head">
          <div />
          <div>Ects Received</div>
          <div>Ects Completed</div>
          <div>Cumulative GPA</div>
        </div>
        <div className="tr-foot-row">
          <div className="tr-foot-label">Semester</div>
          <div>{totals.semReceived}</div>
          <div>{totals.semCompleted}</div>
          <div className="tr-foot-gpa">{totals.semGPA.toFixed(2)}</div>
        </div>
        <div className="tr-foot-row tr-foot-total">
          <div className="tr-foot-label">Total</div>
          <div>{totals.totReceived}</div>
          <div>{totals.totCompleted}</div>
          <div className="tr-foot-gpa">{totals.totGPA.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Year section ────────────────────────────────────────────────
function Year({ year, totalsMap, onUpdate, onDelete, onAddSemester }) {
  const allCourses = year.semesters.flatMap((s) => s.courses);
  const stat = calcGPA(allCourses);

  const updateSem = (id, next) =>
    onUpdate({ ...year, semesters: year.semesters.map((s) => (s.id === id ? next : s)) });
  const deleteSem = (id) =>
    onUpdate({ ...year, semesters: year.semesters.filter((s) => s.id !== id) });

  return (
    <section className="year">
      <header className="year-head">
        <div className="year-head-left">
          <input
            className="year-label-input"
            value={year.label}
            onChange={(e) => onUpdate({ ...year, label: e.target.value })}
          />
          <input
            className="year-title-input"
            value={year.academic}
            onChange={(e) => onUpdate({ ...year, academic: e.target.value })}
          />
        </div>
        <div className="year-stats">
          <div className="year-stat"><span>GPA</span><b>{stat.gpa.toFixed(2)}</b></div>
          <div className="year-stat"><span>ECTS</span><b>{stat.ects}</b></div>
          <div className="year-stat"><span>Courses</span><b>{stat.count}</b></div>
          <button className="year-del" onClick={onDelete} title="Remove year">{I.trash}</button>
        </div>
      </header>

      <div className={`semesters${year.semesters.length === 1 ? " single" : ""}`}>
        {year.semesters.map((s) => (
          <Semester
            key={s.id}
            semester={s}
            totals={
              totalsMap.get(s.id) || {
                semReceived: 0, semCompleted: 0, semGPA: 0,
                totReceived: 0, totCompleted: 0, totGPA: 0,
              }
            }
            onUpdate={(next) => updateSem(s.id, next)}
            onDelete={year.semesters.length > 1 ? () => deleteSem(s.id) : null}
          />
        ))}
        {year.semesters.length < 3 && (
          <button className="add-semester" onClick={onAddSemester}>
            {I.plus}<span>Add semester</span>
          </button>
        )}
      </div>
    </section>
  );
}

// ── Import modal ────────────────────────────────────────────────
const SAMPLE_TRANSCRIPT = `<table>
  <tr><th colspan="5">Fall 2022-2023</th></tr>
  <tr><td>PHYS101</td><td>Physics I</td><td>7</td><td>Z</td><td>CC</td></tr>
  <tr><td>MATH151</td><td>Differential and Integral Mathematics I</td><td>7</td><td>Z</td><td>CC</td></tr>
  <tr><td>ENG100</td><td>Basic English</td><td>0</td><td>Z</td><td>AA</td></tr>
  <tr><td>ENG101</td><td>Communication Skills and Academic Report Writing I</td><td>3</td><td>Z</td><td>CB</td></tr>
  <tr><td>SWE111</td><td>Introduction to Software Engineering</td><td>6</td><td>Z</td><td>BB</td></tr>
  <tr><td>IES100</td><td>Introduction to Engineering Sciences</td><td>2</td><td>Z</td><td>BA</td></tr>
  <tr><td>SWE101</td><td>Computer Programming I</td><td>5</td><td>Z</td><td>FF</td></tr>
  <tr><th colspan="5">Spring 2022-2023</th></tr>
  <tr><td>MATH152</td><td>Differential and Integral Mathematics II</td><td>7</td><td>Z</td><td>BA</td></tr>
  <tr><td>ENG102</td><td>Communication Skills and Academic Report Writing II</td><td>3</td><td>Z</td><td>BB</td></tr>
  <tr><td>ESP102</td><td>Social Responsibility Project and Career Planning</td><td>2</td><td>Z</td><td>AA</td></tr>
  <tr><td>SWE104</td><td>Data Structure and Algorithms</td><td>6</td><td>Z</td><td>CB</td></tr>
  <tr><td>SWE102</td><td>Computer Programming II</td><td>5</td><td>Z</td><td>BB</td></tr>
  <tr><td>PHYS102</td><td>Physics II</td><td>7</td><td>Z</td><td>AA</td></tr>
  <tr><td>USD133</td><td>Data Driven Marketing and CRM</td><td>4</td><td>S</td><td>AA</td></tr>
</table>`;

const GUIDE_STEPS = [
  { title: "Navigate to Transcript inside your university website", img: guideStep0 },
  { title: "Right-click anywhere on the page and choose Inspect", img: guideStep1 },
  { title: "Search for 'container-fluid' class, then right-click → Edit as HTML", img: guideStep2 },
  { title: "Select all and copy the HTML", img: guideStep3 },
  { title: "Paste the content into the box below", img: guideStep4 },
];

function ImportModal({ onClose, onImport }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);

  const handleParse = () => {
    const result = parseTranscriptHTML(text);
    setStatus(result);
    if (result.years.length > 0) {
      onImport(result.years);
      setTimeout(onClose, 600);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Import transcript</h3>
            <p>Paste the HTML from your university transcript page — it'll auto-fill semesters and courses.</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>{I.x}</button>
        </div>
        <div className="modal-body">
          <div className="guide-steps">
            {GUIDE_STEPS.map((step, i) => (
              <div key={i} className="guide-step">
                <div className="guide-step-label">
                  <span className="guide-step-num">{i + 1}</span>
                  <span>{step.title}</span>
                </div>
                <img src={step.img} alt={step.title} className="guide-step-img" />
              </div>
            ))}
          </div>
          <textarea
            className="paste-area"
            placeholder={`<table>\n  <tr><td>SE101</td><td>Intro to Programming</td><td>7</td><td>C</td><td>AA</td></tr>\n  ...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {status && (
            <div
              className={`paste-status ${status.years.length ? "ok" : "err"}`}
              style={{ marginTop: 10 }}
            >
              {status.warnings.join(" ")}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <div />
          <div className="right">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleParse}>
              Parse &amp; import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main GPA Calculator ─────────────────────────────────────────
function GpaCalculator() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("altinbas_theme") === "dark"; } catch (e) { return false; }
  });
  const [data, setData] = useState(loadData);
  const [importing, setImporting] = useState(false);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("altinbas_theme", dark ? "dark" : "light"); } catch (e) {}
  }, [dark]);

  const isEmpty = data.length === 0;

  const allCourses = useMemo(
    () => data.flatMap((y) => y.semesters.flatMap((s) => s.courses)),
    [data]
  );
  const overall = useMemo(() => calcGPA(allCourses), [allCourses]);
  const totalEcts = useMemo(() => allCourses.reduce((a, c) => a + (c.ects || 0), 0), [allCourses]);
  const totalsMap = useMemo(() => computeRunningTotals(data), [data]);

  const semesterSeries = useMemo(() => {
    const out = [];
    for (const y of data) {
      for (const s of y.semesters) {
        const st = calcGPA(s.courses);
        if (st.count > 0) out.push({ title: s.title, gpa: st.gpa });
      }
    }
    return out;
  }, [data]);

  const distribution = useMemo(() => {
    const d = {};
    for (const c of allCourses) if (GRADE_BY_LETTER[c.grade]) d[c.grade] = (d[c.grade] || 0) + 1;
    return d;
  }, [allCourses]);

  const updateYear = useCallback(
    (id, next) => setData((d) => d.map((y) => (y.id === id ? next : y))),
    []
  );
  const deleteYear = useCallback((id) => {
    if (!window.confirm("Remove this year and all its courses?")) return;
    setData((d) => d.filter((y) => y.id !== id));
  }, []);
  const addYear = useCallback(() => {
    setData((d) => {
      let nextStart = new Date().getFullYear();
      if (d.length) {
        const last = d[d.length - 1];
        const m = /([0-9]{4})/.exec(last.academic || "");
        if (m) nextStart = parseInt(m[1], 10) + 1;
      }
      return [...d, emptyYear("Year " + (d.length + 1), nextStart)];
    });
  }, []);
  const addSemesterToYear = useCallback((yearId) => {
    setData((d) =>
      d.map((y) => {
        if (y.id !== yearId) return y;
        const hasFall   = y.semesters.some((s) => s.kind === "fall");
        const hasSpring = y.semesters.some((s) => s.kind === "spring");
        const hasSummer = y.semesters.some((s) => s.kind === "summer");
        let kind = "summer", title = "Summer";
        if (!hasFall)        { kind = "fall";   title = "Fall "   + (y.academic || ""); }
        else if (!hasSpring) { kind = "spring"; title = "Spring " + (y.academic || ""); }
        else if (!hasSummer) { kind = "summer"; title = "Summer " + (y.academic || ""); }
        return { ...y, semesters: [...y.semesters, { id: uid(), kind, title, courses: [] }] };
      })
    );
  }, []);

  const startFromScratch = useCallback(() => {
    const now = new Date();
    const yearStart = now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
    setData([emptyYear("Year 1", yearStart)]);
  }, []);

  const loadSample = useCallback(() => {
    setData(cloneWithFreshIds(DEFAULT_DATA));
  }, []);

  const resetAll = useCallback(() => {
    if (window.confirm("Clear all data and return to the welcome screen?")) {
      setData([]);
    }
  }, []);

  return (
    <div className="app">
      <TopBar
        onImport={() => setImporting(true)}
        onReset={resetAll}
        theme={dark ? "dark" : "light"}
        onToggleTheme={() => setDark((v) => !v)}
        showActions={!isEmpty}
      />

      {isEmpty ? (
        <EmptyState
          onImport={() => setImporting(true)}
          onAddFirstYear={startFromScratch}
          onLoadSample={loadSample}
        />
      ) : (
        <>
          <Hero
            data={data}
            cgpa={overall.gpa}
            totalEcts={totalEcts}
            completedEcts={overall.ects}
            semesterSeries={semesterSeries}
            distribution={distribution}
          />

          {data.map((y) => (
            <Year
              key={y.id}
              year={y}
              totalsMap={totalsMap}
              onUpdate={(next) => updateYear(y.id, next)}
              onDelete={() => deleteYear(y.id)}
              onAddSemester={() => addSemesterToYear(y.id)}
            />
          ))}

          <button className="add-year" onClick={addYear}>
            {I.plus}<span>Add academic year</span>
          </button>

          <div className="footnote">
            <span>GPA Calculator</span>
            <span className="dots"><i /><i /><i /></span>
            <span>Data saved locally on this device</span>
          </div>
        </>
      )}

      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={(years) => setData(years)}
        />
      )}
    </div>
  );
}

export default GpaCalculator;
