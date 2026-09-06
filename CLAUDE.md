# Gates

An interactive site that teaches digital logic — from a push button, through
the basic gates, to latches and flip-flops. Circuits are drawn as live SVG and
you toggle their inputs to watch signals propagate.

Live at **https://gates.jacobingalls.com** (GitHub Pages, `gh-pages` branch).

Create React App + React 18 + react-router 7. No test suite, no linter beyond
the CRA/ESLint defaults baked into `react-scripts`.

## Commands

| | |
|---|---|
| `npm install` | install deps |
| `npm start` | dev server on :3000 |
| `npm run build` | production bundle into `build/` (gitignored) |
| `npm test` | CRA/Jest runner — **no tests exist yet**, see Gotchas |

There is no lint or typecheck script. Before pushing, the meaningful check is
that `npm run build` compiles and the built app renders without console errors.

## Architecture

Four layers, each composing the one below it:

- **`src/Components/`** — leaf primitives, almost all pure SVG `<g>` elements
  positioned by `x`/`y` props. Gates (`Gates/`), inputs (`Buttons/`), outputs
  (`Outputs/Led.js`), memory (`Memory/`), and `Wires.js` / `Block.js` for
  drawing paths and labelled boxes.

  A gate has no state. It takes `input1`/`input2` and an `output` *callback*,
  and pushes its result upward from a `useEffect` keyed on its inputs:

  ```js
  useEffect(() => { output(input1 === true && input2 === true) },
            [input1, input2, output])
  ```

  Signal propagation is therefore just React re-rendering: the owner of the
  state re-renders, children recompute, effects fire. Pass `output` callbacks
  that are stable (`useState` setters, or `useCallback`) or you will loop.

- **`src/Circuits/`** — a wired-up diagram. Holds the `useState` for every wire
  in the circuit, renders components inside `<Circuit>` / `<CircuitSVG>`
  (`Circuit.js`), and sizes the canvas via `width`/`height`. `TruthTable.js`
  renders the same circuit as a table instead of a diagram.

- **`src/Lessons/`** — one file per lesson page. Composes circuits into
  `<div className="section">` blocks and uses `App/SegmentedControl` to let the
  reader swap between representations of the same idea ("Component" vs
  "Using SR Latch" vs "All Gates"). Ends with `<LessonFooter nextLesson=... />`.

- **`src/App/`** — the shell: `App.js` (header + `<Outlet/>`), `Header.js`,
  `LessonFooter.js`, `SegmentedControl.js`.

**Routes live in `src/index.js`**, not in `App.js` — `createBrowserRouter` with
`/` redirecting to `/lessons/logic-gates`. Adding a lesson means adding both the
file and a route entry there.

Styling is plain CSS (`src/index.css` plus per-component files), dark theme, no
CSS framework. Indentation is **tabs** throughout `src/`.

## Deployment

`.github/workflows/main.yml` — npm install, `npm run build`, `cp index.html
404.html`, then `JamesIves/github-pages-deploy-action@v4` publishes `build/` to
the `gh-pages` branch.

Things that will bite you:

- **The workflow is `on: [push]` with no branch filter.** *Every* push to *any*
  branch builds and publishes to `gh-pages` — a feature branch push overwrites
  the live site. Nothing in the repo restricts this today. Be deliberate about
  what you push, and prefer merging to `main` first.
- **`CNAME` exists only on `gh-pages`, not in `public/`.** The custom domain
  survives deploys purely because the deploy action preserves `CNAME` and
  `.nojekyll` by default. Any change to a deploy method that does a clean
  publish (e.g. moving to `actions/deploy-pages`) must add `public/CNAME`
  containing `gates.jacobingalls.com` first, or the domain breaks.
- **No `homepage` field in `package.json`**, so the bundle is built for root
  `/`. That is only correct because of the custom domain; serving from
  `user.github.io/Gates/` would need `homepage` set.
- **`404.html` is the SPA fallback.** The router is a *browser* router, so deep
  links like `/lessons/sequential-circuits` are real 404s to Pages until that
  copy of `index.html` catches them. Keep the `cp` step.
- **A green workflow run does not imply a new deploy.** The action only commits
  when the built output actually differs, so an unchanged bundle produces a
  successful run and no new `gh-pages` commit. Check `gh-pages` history, not
  just the Actions tab, to confirm what is live.

## Gotchas

- **`npm test` has no tests, and adding the first one takes setup.** react-router
  v7 is only reachable through its `react-router/dom` exports subpath, which the
  Jest 27 bundled with react-scripts 5 cannot resolve, and it needs
  `TextEncoder`/`TextDecoder`, which jsdom 16 does not provide. Expect to add a
  `moduleNameMapper` entry and a `src/setupTests.js` polyfill.
- **Do not run `npm audit fix --force`.** Several advisories are pinned behind
  react-scripts 5.0.1 and npm's only "fix" is downgrading react-scripts to
  0.0.0. They are handled instead by the `overrides` block in `package.json`
  (nth-check, resolve-url-loader, serialize-javascript, qs, underscore, uuid,
  http-proxy-agent, @tootallnate/once, @svgr/webpack). Leave it in place.
- Two moderate webpack-dev-server advisories remain open on purpose. The fix
  (5.2.6) drops the `onBeforeSetupMiddleware` / `onAfterSetupMiddleware` options
  that react-scripts 5.0.1 passes, which breaks `npm start`. It is a dev-only
  server and never reaches the deployed bundle; clearing it means moving off
  react-scripts.
