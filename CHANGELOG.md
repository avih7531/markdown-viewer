# Changelog

## Firefox fork

Based on upstream **v5.3**. One squashed release line on `main`.

### Highlights

- **Firefox only** — single manifest, event-page background; Chromium paths removed.
- **Renderers** — ABC.js, Vega-Lite, Graphviz (WASM), WaveDrom, CSV/TSV; copy on fences and widgets.
- **Tables** — GFM pipe tables plus CSV/TSV; Excel-style hover filter; three-step column sort.
- **Reliability** — `file:///` optional permission on install; inject/reload fixes for local files; Vega CSP polyfill; MDC CSS build (dart sass).
- **Defaults** — markdown-it with task lists; content toggles on for syntax, math, diagrams, charts, and interactive tables (emoji, ToC, autoreload stay off).

### Upstream history

Older releases are in [simov/markdown-viewer CHANGELOG](https://github.com/simov/markdown-viewer/blob/master/CHANGELOG.md).
