import { Icons } from "./icons";

function EmptyState({ onImport, onAddFirstYear }) {
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
            <div className="empty-card-icon">{Icons.doc}</div>
            <div className="empty-card-title">Paste transcript HTML</div>
            <div className="empty-card-sub">
              Fastest: auto-fills every semester from your university's student portal.
            </div>
            <div className="empty-card-cta">Import -&gt;</div>
          </button>

          <button className="empty-card" onClick={onAddFirstYear}>
            <div className="empty-card-icon">{Icons.edit}</div>
            <div className="empty-card-title">Start from scratch</div>
            <div className="empty-card-sub">Create your first year and add courses manually.</div>
            <div className="empty-card-cta">New year -&gt;</div>
          </button>
        </div>
      </div>
    </section>
  );
}

export default EmptyState;
