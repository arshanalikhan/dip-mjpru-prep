# DIP End-Sem Prep · MJPRU CS-403T

Study site for **MJPRU Bareilly · B.Tech VII Semester · Digital Image Processing (CS-403T)**.

**[Open the site](https://arshanalikhan.github.io/dip-mjpru-prep/)**

## What's inside

| Page | What it gives you |
|---|---|
| **PYQ analysis** | Six MJPRU DIP papers (2017, 2018, 2019, 2025-26 end-sem; 2025 Mid-1 and Mid-2) ranked by topic, with a predicted paper |
| **All past papers** | Every question typed out and tagged by unit |
| **How to write answers** | The MJPRU long-answer template: 4–5 pages per question, at least one diagram |
| **Video lectures** | YouTube lectures for every syllabus topic, unit by unit: a short exam-style video and, where one exists, a full lecture. Tap to play on the page |
| **Unit notes 1–5** | The full CS-403T syllabus, with exam definitions, formulas and diagrams |
| **Mock papers 1–3** | 70-mark papers in the MJPRU pattern (any 5 of 8) with full answers in MJPRU style; every numerical checked |
| **Last-night sheet** | Definitions, formulas, masks and the diagrams to practise |

## How it works

A static site with no build step, using the same design as [iitm-stats2-prep](https://github.com/arshanalikhan/iitm-stats2-prep): sidebar on desktop, top bar and bottom tabs on phones, light and dark themes. `index.html` holds the shell and the home page; every other page is `content/<page>.md`, loaded for the page in the URL hash and rendered with [marked](https://marked.js.org/). ` ```mermaid ` blocks are drawn with [Mermaid](https://mermaid.js.org/), and `::: ans` / `::: tip` / `::: warn` blocks become styled boxes. Progress ("mark as done") and exam mode are saved in the browser only.

```text
index.html          shell (sidebar, phone tabs) and the home page
assets/base.css     design tokens, shell and home styles shared with iitm-stats2-prep
assets/dip.css      DIP additions: Markdown pages, diagrams, answer boxes, topic bars
assets/app.js       router, Markdown + diagrams, progress, exam mode, hero animation
content/*.md        every other page
```

To edit content, change the Markdown in `content/` and push to `main`; GitHub Actions publishes to GitHub Pages. When you change `assets/`, bump the `?v=` number in `index.html` so browsers fetch the new files.

Preview locally:

```bash
python -m http.server 8793
```

## Sources

Unit 1 follows the class Mid-1 notes; the rest follows R.C. Gonzalez & R.E. Woods, *Digital Image Processing*, 3rd ed. The 2017–2019 papers are from mjpruonline.com (EC-458T, the same subject in the older syllabus); the 2025-26 papers are from our batch. MJPRU DIP papers for 2020–2024 could not be found online.

Not an official MJPRU resource. If anything here disagrees with your class notes, trust your teacher.
