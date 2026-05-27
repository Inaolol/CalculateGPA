import { Icons } from "./icons";
import gpaLogo from "../../assets/gpa-logo.svg";
import landingHero from "../../assets/landing-hero.png";

function EmptyState({ onImport, onAddFirstYear }) {
  return (
    <section className="landing" style={{ "--landing-bg": `url(${landingHero})` }}>
      <div className="landing-shell">
        <div className="landing-center">
          <img className="landing-logo" src={gpaLogo} alt="" aria-hidden="true" />
          <h1 className="landing-title">
            <span>GPA</span> <span>Calculator</span>
          </h1>
          <p className="landing-sub">
            <span>Calculate semesters, track ECTS,</span>
            <span>and keep your GPA clear.</span>
          </p>
        </div>

        <div className="landing-options">
          <button className="landing-option primary" onClick={onAddFirstYear}>
            <span className="landing-option-icon">{Icons.edit}</span>
            <span>
              <strong>Start calculating</strong>
              <small>Add courses manually</small>
            </span>
          </button>

          <button className="landing-option" onClick={onImport}>
            <span className="landing-option-icon">{Icons.doc}</span>
            <span>
              <strong>Import transcript</strong>
              <small>Paste portal HTML</small>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default EmptyState;
