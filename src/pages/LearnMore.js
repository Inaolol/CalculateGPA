import { Link } from "react-router-dom";
import ReactGA from "react-ga4";
import { IMPORT_GUIDE_STEPS } from "../components/gpa/importGuide";

function LearnMore() {
  ReactGA.send({
    hitType: "learnmore",
    page: "/learn-more",
    title: "Learn More",
  });

  return (
    <main className="learnMoreContainer">
      <h1>
        <mark>How to import a transcript</mark>
      </h1>
      <Link to="/">Back</Link>

      {IMPORT_GUIDE_STEPS.map((step, index) => {
        const isLastItem = index === IMPORT_GUIDE_STEPS.length - 1;

        return (
          <div key={step.title} className="learnMoreSubContainer">
            <p>{step.title}</p>
            {step.img && <img src={step.img} alt={step.title} width={400} />}

            {!isLastItem && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M8.037 11.166L14.5 22.36c.825 1.43 2.175 1.43 3 0l6.463-11.195c.826-1.43.15-2.598-1.5-2.598H9.537c-1.65 0-2.326 1.17-1.5 2.6z"
                />
              </svg>
            )}
          </div>
        );
      })}
    </main>
  );
}

export default LearnMore;
