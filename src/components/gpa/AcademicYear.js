import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GRADE_SCALE, calcGPA, uid } from "../../utils/gradeData";
import { Icons } from "./icons";

function GradePopover({ current, onChange, onClose, anchorRect }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

  useLayoutEffect(() => {
    if (!ref.current || !anchorRect) return;

    const rect = ref.current.getBoundingClientRect();
    const margin = 8;
    let left = anchorRect.left + anchorRect.width / 2 - rect.width / 2;
    let top = anchorRect.bottom + 8;

    if (left < margin) left = margin;
    if (left + rect.width + margin > window.innerWidth) left = window.innerWidth - rect.width - margin;
    if (top + rect.height + margin > window.innerHeight) top = anchorRect.top - rect.height - 8;

    setPosition({ top, left, ready: true });
  }, [anchorRect]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="grade-popover"
      style={{ top: position.top, left: position.left, position: "fixed", opacity: position.ready ? 1 : 0 }}
    >
      {GRADE_SCALE.map((grade) => (
        <button
          key={grade.letter}
          className={`grade-pill ${grade.letter}${current === grade.letter ? " is-selected" : ""}`}
          onClick={() => {
            onChange(grade.letter);
            onClose();
          }}
          title={`${grade.letter} - ${grade.points.toFixed(1)} - ${grade.label}`}
        >
          {grade.letter}
        </button>
      ))}
      <button
        className="grade-popover-clear"
        onClick={() => {
          onChange("");
          onClose();
        }}
      >
        Clear grade
      </button>
    </div>
  );
}

function CourseRow({ course, onUpdate, onDelete }) {
  const [picker, setPicker] = useState(null);
  const pillRef = useRef(null);

  const openPicker = () => {
    const rect = pillRef.current.getBoundingClientRect();
    setPicker({
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <div className="tr-row">
      <button
        className={`type-cell ${course.type}`}
        onClick={() => onUpdate({ ...course, type: course.type === "C" ? "E" : "C" })}
        title={course.type === "C" ? "Compulsory" : "Elective"}
      >
        {course.type === "C" ? "Z" : "S"}
      </button>
      <div className="course-cell">
        <span className="course-code">
          <input
            value={course.code}
            onChange={(event) => onUpdate({ ...course, code: event.target.value.toUpperCase() })}
            placeholder="CODE"
          />
        </span>
        <span className="course-name">
          <input
            value={course.name}
            onChange={(event) => onUpdate({ ...course, name: event.target.value })}
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
          onChange={(event) => onUpdate({ ...course, ects: parseFloat(event.target.value || "0") })}
        />
      </div>
      <div className="grade-cell">
        <button ref={pillRef} className={`grade-pill ${course.grade || "ungraded"}`} onClick={openPicker}>
          {course.grade || "-"}
        </button>
      </div>
      <button className="row-del" onClick={onDelete} title="Remove course">
        {Icons.trash}
      </button>
      {picker &&
        createPortal(
          <GradePopover
            current={course.grade}
            onChange={(grade) => onUpdate({ ...course, grade })}
            onClose={() => setPicker(null)}
            anchorRect={picker}
          />,
          document.body
        )}
    </div>
  );
}

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

  const resetForm = () => {
    setCode("");
    setName("");
    setEcts("");
    setType("C");
    setGrade("");
  };

  const submit = () => {
    if (!code && !name) return;

    onAdd({
      id: uid(),
      code: code.toUpperCase(),
      name,
      ects: parseFloat(ects) || 5,
      type,
      grade,
    });
    resetForm();
    codeRef.current?.focus();
  };

  if (!open) {
    return (
      <button className="tr-add" onClick={() => setOpen(true)}>
        {Icons.plus}
        <span>Add course</span>
      </button>
    );
  }

  return (
    <div
      className="tr-row tr-row-add"
      onKeyDown={(event) => {
        if (event.key === "Enter") submit();
        if (event.key === "Escape") setOpen(false);
      }}
    >
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
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="SE101"
          />
        </span>
        <span className="course-name">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Course name" />
        </span>
      </div>
      <div className="ects-cell">
        <input
          type="number"
          value={ects}
          min="0"
          max="30"
          step="0.5"
          onChange={(event) => setEcts(event.target.value)}
          placeholder="ECTS"
        />
      </div>
      <div className="grade-cell">
        <select className="grade-select" value={grade} onChange={(event) => setGrade(event.target.value)}>
          <option value="">-</option>
          {GRADE_SCALE.map((gradeOption) => (
            <option key={gradeOption.letter} value={gradeOption.letter}>
              {gradeOption.letter}
            </option>
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

function Semester({ semester, totals, onUpdate, onDelete }) {
  const updateCourse = (id, nextCourse) =>
    onUpdate({ ...semester, courses: semester.courses.map((course) => (course.id === id ? nextCourse : course)) });
  const deleteCourse = (id) =>
    onUpdate({ ...semester, courses: semester.courses.filter((course) => course.id !== id) });
  const addCourse = (course) => onUpdate({ ...semester, courses: [...semester.courses, course] });

  return (
    <div className="tr-card">
      <div className="tr-title">
        <input
          className="tr-title-input"
          value={semester.title}
          onChange={(event) => onUpdate({ ...semester, title: event.target.value })}
          aria-label="Semester title"
        />
        {onDelete && (
          <button className="tr-title-del" onClick={onDelete} title="Remove semester">
            {Icons.x}
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
          <div className="tr-empty">No courses yet - use Add course below</div>
        )}
        {semester.courses.map((course) => (
          <CourseRow
            key={course.id}
            course={course}
            onUpdate={(nextCourse) => updateCourse(course.id, nextCourse)}
            onDelete={() => deleteCourse(course.id)}
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

function AcademicYear({ year, totalsMap, onUpdate, onDelete, onAddSemester }) {
  const allCourses = year.semesters.flatMap((semester) => semester.courses);
  const stat = calcGPA(allCourses);
  const hasFall = year.semesters.some((semester) => semester.kind === "fall");
  const hasSpring = year.semesters.some((semester) => semester.kind === "spring");
  const canAddSemester = !(hasFall && hasSpring);

  const updateSemester = (id, nextSemester) =>
    onUpdate({ ...year, semesters: year.semesters.map((semester) => (semester.id === id ? nextSemester : semester)) });
  const deleteSemester = (id) =>
    onUpdate({ ...year, semesters: year.semesters.filter((semester) => semester.id !== id) });

  return (
    <section className="year">
      <header className="year-head">
        <div className="year-head-left">
          <input
            className="year-label-input"
            value={year.label}
            onChange={(event) => onUpdate({ ...year, label: event.target.value })}
          />
          <input
            className="year-title-input"
            value={year.academic}
            onChange={(event) => onUpdate({ ...year, academic: event.target.value })}
          />
        </div>
        <div className="year-stats">
          <div className="year-stat"><span>GPA</span><b>{stat.gpa.toFixed(2)}</b></div>
          <div className="year-stat"><span>ECTS</span><b>{stat.ects}</b></div>
          <div className="year-stat"><span>Courses</span><b>{stat.count}</b></div>
          <button className="year-del" onClick={onDelete} title="Remove year">{Icons.trash}</button>
        </div>
      </header>

      <div className={`semesters${year.semesters.length === 1 ? " single" : ""}`}>
        {year.semesters.map((semester) => (
          <Semester
            key={semester.id}
            semester={semester}
            totals={
              totalsMap.get(semester.id) || {
                semReceived: 0,
                semCompleted: 0,
                semGPA: 0,
                totReceived: 0,
                totCompleted: 0,
                totGPA: 0,
              }
            }
            onUpdate={(nextSemester) => updateSemester(semester.id, nextSemester)}
            onDelete={year.semesters.length > 1 ? () => deleteSemester(semester.id) : null}
          />
        ))}
        {canAddSemester && (
          <button className="add-semester" onClick={onAddSemester}>
            {Icons.plus}
            <span>Add semester</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default AcademicYear;
