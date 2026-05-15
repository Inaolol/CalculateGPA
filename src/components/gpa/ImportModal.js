import { useState } from "react";
import { parseTranscriptHTML } from "../../utils/gradeData";
import { IMPORT_GUIDE_STEPS } from "./importGuide";
import { Icons } from "./icons";

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
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Import transcript</h3>
            <p>Paste the HTML from your university transcript page. Semesters and courses are detected automatically.</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close import dialog">
            {Icons.x}
          </button>
        </div>
        <div className="modal-body">
          <div className="guide-steps">
            {IMPORT_GUIDE_STEPS.map((step, index) => (
              <div key={step.title} className="guide-step">
                <div className="guide-step-label">
                  <span className="guide-step-num">{index + 1}</span>
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
            onChange={(event) => setText(event.target.value)}
          />
          {status && (
            <div className={`paste-status ${status.years.length ? "ok" : "err"}`}>
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

export default ImportModal;
