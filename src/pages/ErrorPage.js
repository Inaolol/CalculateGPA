import React from "react";
import { Link } from "react-router-dom";
const ErrorPage = () => {
  return (
    <div>
      Ops, looks like there is an error!
      <Link to={"/"}> Go Back</Link>
    </div>
  );
};

export default ErrorPage;
