import { GRADE_BY_LETTER, GRADE_SCALE, standingFor } from "../../utils/gradeData";

const GRADE_COLORS = {
  AA: "var(--grade-aa)",
  BA: "var(--grade-ba)",
  BB: "var(--grade-bb)",
  CB: "var(--grade-cb)",
  CC: "var(--grade-cc)",
  DC: "var(--grade-dc)",
  DD: "var(--grade-dd)",
  FF: "var(--grade-ff)",
};

function Hero({ data, cgpa, totalEcts, completedEcts, distribution }) {
  const standing = standingFor(cgpa);
  const earnedCourses = data.reduce(
    (acc, year) =>
      acc + year.semesters.reduce(
        (sum, semester) => sum + semester.courses.filter((course) => GRADE_BY_LETTER[course.grade]).length,
        0
      ),
    0
  );
  const totalGraded = Object.values(distribution).reduce((acc, count) => acc + count, 0);

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
          <span className="hero-cell-denominator">/ {totalEcts}</span>
        </div>
        <div className="hero-cell-note">ECTS - {earnedCourses} graded courses</div>
      </div>

      <div className="hero-cell">
        <div className="hero-cell-label">Grade mix</div>
        <div className="distribution">
          {GRADE_SCALE.map((grade) => {
            const count = distribution[grade.letter] || 0;
            if (!count) return null;

            return (
              <div
                key={grade.letter}
                style={{ flex: count, background: GRADE_COLORS[grade.letter] }}
                title={`${grade.letter}: ${count}`}
              />
            );
          })}
          {totalGraded === 0 && <div style={{ flex: 1, background: "var(--line-soft)" }} />}
        </div>
        <div className="distribution-legend">
          {["AA", "BA", "BB", "CB", "CC"].map((letter) =>
            distribution[letter] ? (
              <span key={letter}>
                <i style={{ background: GRADE_COLORS[letter] }} />
                {letter}
                <strong>{distribution[letter]}</strong>
              </span>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
