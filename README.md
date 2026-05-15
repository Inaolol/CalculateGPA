# CalculateGPA

A React app for calculating GPA from course grades and ECTS credits. The current design is intentionally lightweight so the UI can be rebuilt while keeping the calculator logic intact.

## Core Functionality

- Add courses with a course name, ECTS credit value, and letter grade.
- Calculate GPA automatically as course data changes.
- Include previous GPA and previous credits for cumulative GPA calculations.
- Import course data from an HTML table.
- Toggle between light and dark mode.
- View a guided import help page.

## Grade Scale

| Grade | Points |
| ----- | ------ |
| AA    | 4.0    |
| BA    | 3.5    |
| BB    | 3.0    |
| CB    | 2.5    |
| CC    | 2.0    |
| DC    | 1.5    |
| DD    | 1.0    |
| FF    | 0.0    |

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## Available Scripts

```bash
npm start
```

Runs the app in development mode.

```bash
npm run build
```

Creates a production build in the `build` folder.

```bash
npm test
```

Runs the Create React App test runner. The project currently does not include custom tests.
