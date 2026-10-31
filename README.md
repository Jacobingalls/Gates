# Gates

Interactive lessons on digital logic, built with React and [Vite](https://vite.dev/).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).\
The page updates when you make changes.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run preview`

Serves the production build locally.

## Editor

The Editor link opens a circuit editor at `/editor`. It opens and saves the `Circuit.json` style files
under `src/Lessons`.

## Document format

Pages and parts are React. Diagrams are JSON files kept next to the `Section.jsx` that shows them,
under `src/Lessons`. See [docs/format.md](docs/format.md).

## Deployment

Pushes to `main` build the app and deploy it to GitHub Pages.
