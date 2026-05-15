import gpaLogo from "../../assets/gpa-logo.svg";
import { Icons } from "./icons";

function TopBar({ onImport, onReset, theme, onToggleTheme, showActions }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src={gpaLogo} alt="" aria-hidden="true" />
        <div className="brand-text">
          <div className="brand-title">GPA Calculator</div>
        </div>
      </div>
      <div className="topbar-actions">
        {showActions && (
          <>
            <button className="btn" onClick={onImport}>
              {Icons.upload}
              <span>Import transcript</span>
            </button>
            <button className="btn btn-danger" onClick={onReset} title="Clear all data and return to welcome screen">
              {Icons.trash}
              <span>Reset</span>
            </button>
          </>
        )}
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === "dark" ? Icons.sun : Icons.moon}
        </button>
      </div>
    </header>
  );
}

export default TopBar;
