# Mockbook

An English-only, local-first Java full-stack interview study app. Built with React, TypeScript, and Vite. No backend, account, paid API, or runtime AI service is required.

## Run locally

Requires Node.js 20.19+ or 22+ and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173). Do not open index.html directly: the application loads local JSON through HTTP.

```sh
npm test
npm run build
npm run preview
```

## Included content

- **187 consolidated topics**: 186 practice topics plus one project-context reference.
- Primary titles and answers follow the **2026** bank. Duplicate 2025 questions are integrated as examples/clarifications, not separate library rows.
- **49 topics unique to 2025** remain, including the complete Stream operations reference.
- **205 authored concept exercises**, up from 72: single choice, multiple choice, ordering, and matching. Every one of the 186 practice topics has at least one concept exercise. There are 15 dedicated Stream-reference exercises and four OOP exercises.
- **186 source-recall exercises**, one per practice topic. These associate a passage with a topic; they are distinct from concept assessment.
- All **304 numbered original questions and three original supplementary entries** remain traceable through expandable source excerpts. Consolidation removes 120 duplicate library entries without dropping their provenance.
- Six categories follow the June 2026 Question Bank.

`public/data/merge-map.json` records every source-to-topic grouping; `public/data/coverage.json` records concept coverage. The map is explicitly reviewed, not fuzzy-title clustering. Related but different questions (for example HashMap versus HashSet, or Stream coding versus the full operation reference) remain separate.

The main study answer uses 2026 content plus targeted 2025 additions. Sanitized historical passages are available separately under **Sanitized source excerpts** and may retain outdated technical claims or code. Private project evidence is removed before consolidation and recall generation; fictional schemas replace internal examples. Selected errors in the study answer have been corrected: Stream type order and reduction overloads, Hibernate session/merge semantics, thread states, semaphore cleanup, SQL salary ties, and RabbitMQ routing. See [content review](docs/content-review.md).

Original source files stay local and are ignored by Git. The English presentation translates Chinese passages, and the Chinese thread-state illustration is represented by an English table. Public examples are fictional and do not describe real project deployments. There is no code execution or automatic coding assessment.

The PDF confirmed the six-category structure; it is not required at runtime or bundled into deployment.

## Practice and progress

- Single choice checks immediately. Other formats check after explicit submission.
- Multiple choice uses exact-set scoring. Ordering checks the full sequence. Matching requires every pair to be correct.
- Ordering supports both dragging and keyboard-accessible move buttons. Matching uses click/tap pairs.
- Missed questions stay in Review mistakes until the latest answer is correct.
- Both questions and source notes can be bookmarked.
- Attempts, bookmarks, and the active session are stored under `mockbook-v1` in localStorage.
- Export/import progress from Settings (the top-right J button also opens Settings on mobile).
- Import validates data, maps old source bookmarks to consolidated topics, merges bookmarks, and keeps the latest timestamped record for each question. It does not add overlapping counts. Exported backups contain records and bookmarks, not the active session.
- Existing concept IDs and answer history are retained. Retired recall items remain accessible from old mistakes/bookmarks but are excluded from new sessions. An active session from the old bank is ended with a notice because recall options changed; completed answers remain saved.
- Progress is specific to the current browser and site origin. Export before clearing browser data or moving from localhost to GitHub Pages. There is no cross-device sync or guaranteed offline first visit.

## Rebuild the question data

Requires Python 3, with no third-party packages.

```sh
npm run content
npm test
```

`build_content.py` parses both original Markdown files. `english_source.py` holds source-line English overrides, which must be checked if the original file changes. `consolidate.py` contains the explicit grouping map and reviewed additions, `stream_reference.py` holds the combined Stream reference, and `curated.py` plus `more_concepts.py` hold authored exercises. Generated JSON is committed so deployment requires only Node.js. `public/data/coverage.json` records coverage counts.

## Browser checks

```sh
npx playwright install chromium
npm run dev
# In a second terminal:
npm run test:e2e
```

To use an installed Chrome instead of downloading Chromium:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

Set `APP_URL` to test another local or deployed address. Browser tests cover the four formats, feedback, persistence, mistake recovery, search, source provenance, bookmarks, backups, and mobile layout.

## GitHub Pages

1. Push this project to a GitHub repository on the `main` branch (or adjust the workflow's branch filter).
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. The included workflow runs the unit/content checks, builds the site, and publishes **only `dist/`**.
4. Open the URL shown by the deployment, usually `https://USERNAME.github.io/REPOSITORY/`.

Vite uses a relative base, so root domains and repository subpaths both work. Navigation does not depend on server-side route rewrites. Build output includes the study content and answers; a deployed site serves these to visitors. The workflow publishes the committed build after a push to the configured branch.

## Structure

- `src/main.tsx`: UI and local session management.
- `src/engine.mjs`: grading, shuffling, backup validation, and progress merging.
- `src/style.css`: responsive styling with no remote font dependency.
- `public/data/`: generated question bank and coverage report.
- `public/images/`: source-note illustrations.
- `scripts/`: repeatable content generation and English presentation translations.
- `tests/`: content, grading, persistence, and browser checks.
- `.github/workflows/deploy.yml`: GitHub Pages build and deployment.
