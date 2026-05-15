# GPA Calculator

Track courses by academic year and semester, enter letter grades and ECTS credits, and see semester and cumulative GPA. Data is stored in your browser (localStorage).

## What it does

- Add years with Fall and Spring semesters (Summer optional)
- Add courses manually or import from university transcript HTML
- Semester GPA, cumulative GPA, and credit totals
- Light and dark theme

## Grade scale

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

Non-letter grades from transcripts (e.g. M, P, S) are shown without a GPA value.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Build

```bash
npm run build
```

Output goes to `build/`.

## Project layout

- `src/components/gpa/` — UI components
- `src/utils/gradeData.js` — GPA math and transcript parsing

