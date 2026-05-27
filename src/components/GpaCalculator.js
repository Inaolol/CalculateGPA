import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GRADE_BY_LETTER,
  calcGPA,
  computeRunningTotals,
  sumUniqueCompletedEcts,
  sumUniqueEcts,
  uid,
} from "../utils/gradeData";
import AcademicYear from "./gpa/AcademicYear";
import EmptyState from "./gpa/EmptyState";
import Hero from "./gpa/Hero";
import ImportModal from "./gpa/ImportModal";
import TopBar from "./gpa/TopBar";
import { Icons } from "./gpa/icons";
import {
  loadThemePreference,
  loadTranscriptData,
  saveThemePreference,
  saveTranscriptData,
} from "./gpa/storage";

function createEmptyYear(label, startYear) {
  return {
    id: uid(),
    label,
    academic: `${startYear} - ${startYear + 1}`,
    semesters: [
      { id: uid(), kind: "fall", title: `Fall ${startYear}`, courses: [] },
      { id: uid(), kind: "spring", title: `Spring ${startYear + 1}`, courses: [] },
    ],
  };
}

function getDefaultAcademicYearStart() {
  const now = new Date();
  return now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
}

function getNextAcademicYearStart(years) {
  if (!years.length) return new Date().getFullYear();

  const lastYear = years[years.length - 1];
  const match = /([0-9]{4})/.exec(lastYear.academic || "");
  return match ? parseInt(match[1], 10) + 1 : new Date().getFullYear();
}

function getNextSemester(year) {
  const hasFall = year.semesters.some((semester) => semester.kind === "fall");
  const hasSpring = year.semesters.some((semester) => semester.kind === "spring");
  const hasSummer = year.semesters.some((semester) => semester.kind === "summer");

  if (!hasFall) return { kind: "fall", title: `Fall ${year.academic || ""}` };
  if (!hasSpring) return { kind: "spring", title: `Spring ${year.academic || ""}` };
  if (!hasSummer) return { kind: "summer", title: `Summer ${year.academic || ""}` };

  return null;
}

function GpaCalculator() {
  const [dark, setDark] = useState(loadThemePreference);
  const [data, setData] = useState(loadTranscriptData);
  const [importing, setImporting] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    saveTranscriptData(data);
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    saveThemePreference(dark);
  }, [dark]);

  const allCourses = useMemo(
    () => data.flatMap((year) => year.semesters.flatMap((semester) => semester.courses)),
    [data]
  );
  const overall = useMemo(() => calcGPA(allCourses, { dedupeByCode: true }), [allCourses]);
  const totalEcts = useMemo(() => sumUniqueEcts(allCourses), [allCourses]);
  const completedEcts = useMemo(() => sumUniqueCompletedEcts(allCourses), [allCourses]);
  const totalsMap = useMemo(() => computeRunningTotals(data), [data]);

  const distribution = useMemo(() => {
    const counts = {};

    for (const course of allCourses) {
      if (GRADE_BY_LETTER[course.grade]) {
        counts[course.grade] = (counts[course.grade] || 0) + 1;
      }
    }

    return counts;
  }, [allCourses]);

  const updateYear = useCallback((id, nextYear) => {
    setData((years) => years.map((year) => (year.id === id ? nextYear : year)));
  }, []);

  const deleteYear = useCallback((id) => {
    if (!window.confirm("Remove this year and all its courses?")) return;
    setData((years) => years.filter((year) => year.id !== id));
  }, []);

  const addYear = useCallback(() => {
    setData((years) => [
      ...years,
      createEmptyYear(`Year ${years.length + 1}`, getNextAcademicYearStart(years)),
    ]);
  }, []);

  const addSemesterToYear = useCallback((yearId) => {
    setData((years) =>
      years.map((year) => {
        if (year.id !== yearId) return year;

        const nextSemester = getNextSemester(year);
        if (!nextSemester) return year;

        return {
          ...year,
          semesters: [...year.semesters, { id: uid(), ...nextSemester, courses: [] }],
        };
      })
    );
  }, []);

  const startCalculating = useCallback(() => {
    if (data.length === 0) {
      setData([createEmptyYear("Year 1", getDefaultAcademicYearStart())]);
    }

    setShowLanding(false);
  }, [data.length]);

  const resetAll = useCallback(() => {
    if (window.confirm("Clear all data and return to the welcome screen?")) {
      setData([]);
      setShowLanding(true);
    }
  }, []);

  return (
    <div className={`app${showLanding ? " app-landing" : ""}`}>
      {!showLanding && (
        <TopBar
          onImport={() => setImporting(true)}
          onReset={resetAll}
          theme={dark ? "dark" : "light"}
          onToggleTheme={() => setDark((value) => !value)}
          showActions
        />
      )}

      {showLanding ? (
        <EmptyState onImport={() => setImporting(true)} onAddFirstYear={startCalculating} />
      ) : (
        <>
          <Hero
            data={data}
            cgpa={overall.gpa}
            totalEcts={totalEcts}
            completedEcts={completedEcts}
            distribution={distribution}
          />

          {data.map((year) => (
            <AcademicYear
              key={year.id}
              year={year}
              totalsMap={totalsMap}
              onUpdate={(nextYear) => updateYear(year.id, nextYear)}
              onDelete={() => deleteYear(year.id)}
              onAddSemester={() => addSemesterToYear(year.id)}
            />
          ))}

          <button className="add-year" onClick={addYear}>
            {Icons.plus}
            <span>Add academic year</span>
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
          onImport={(years) => {
            setData(years);
            setShowLanding(false);
          }}
        />
      )}
    </div>
  );
}

export default GpaCalculator;
