# GPA Calculator

I built this project to automate GPA tracking. My university only shows a transcript on its website—already graded courses, no GPA calculator. For in-progress or future courses you have to work out semester and cumulative GPA yourself.

The app takes the raw HTML from the transcript page (copy from the browser), parses it, and recalculates GPA as you add or change grades. I use it to try different grades on current courses and see what I need this semester to reach a target GPA, without doing the math by hand.

## Run locally

```bash
npm install
npm run build
npm start
```

Open http://localhost:3000


## Project layout

- `src/components/gpa/` — UI components
- `src/utils/gradeData.js` — GPA math and transcript parsing

