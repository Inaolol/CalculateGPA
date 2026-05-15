import { Link } from "react-router-dom";

function ErrorPage() {
  return (
    <main className="error-page">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="btn btn-primary" to="/">Go back home</Link>
    </main>
  );
}

export default ErrorPage;
