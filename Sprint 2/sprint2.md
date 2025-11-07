# Sprint 2 Worksheet

## Regression Testing

Since our test suite is compact and runs quite quickly we run the entire test suite when we want to test existing featues.
The way to run our test suites in root, frontend or backend directories is:

```
npm run test 
```

If running in root make sure the front and backend are booted up since the acceptance tests access the database.
---

## Changes to the Testinging Plan

Our testing plan has remained largely the same, with a few changes:

Mainly we have less coverage on the frontend pages due to how rapidly the development has outpaced testing due to the time constaints of this sprint.

---

## What Parts We Are Not Testing

Updated system diagram
Give % of coverage with each layer

---

## Profiler

We need to run a profiler on our api to test every end point for speed and which can be sped up and why or why not.
Also a pic of the profiler output

---

## Last Sprint

Between sprints 1 & 2 the most challenging aspects of development have changed. At the beginning of the project it was defining what we are capable of finishing in time for submission, due to the structure of the project needing to be setup first. For sprint 2 we have spent a larger amount of time on fixing issues with our rapidly expading feature set & infrastructure, like tests working locally but not through github actions, or the way that docker doesnt setup the same way between ARM and x64 processors. As weve taken on more tech-debt we have had to devote a larger amount of time to testing & debugging than previously and we will likely lessen this trend for sprint 3. Due to how Docker will soon host our testing suite and the goals in terms of final funtionality have become clearly visible, we dont expect scope creep to be a contributing factor to our tech debt and we can really hone in the tests all passing & code being cleaner.

---

## Code Gallery

Each of us put our best code forward with a link to the commit where it came from (they will check)

### Anna Pavlova

### Noah McInnes

### Sudipta Sarker