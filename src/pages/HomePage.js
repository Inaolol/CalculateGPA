import React from "react";
import GpaCalculator from "../components/GpaCalculator";
import ReactGA from "react-ga4";

const HomePage = () => {
  ReactGA.send({ hitType: "homepage", page: "/", title: "Home Page" });
  return <GpaCalculator />;
};

export default HomePage;
