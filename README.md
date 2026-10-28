# Markdown Viewer

**Firefox extension** — render `.md` files and markdown responses with themes, math, diagrams, and interactive tables.

Fork of [simov/markdown-viewer](https://github.com/simov/markdown-viewer), trimmed to **Firefox only** and extended with extra renderers and copy affordances.

| | |
| --- | --- |
| **Repo** | [github.com/avih7531/markdown-viewer](https://github.com/avih7531/markdown-viewer) |
| **Upstream** | [simov/markdown-viewer](https://github.com/simov/markdown-viewer) |
| **License** | MIT |

---

## Quick start

1. Build or download **`markdown-viewer.zip`** (see [Build](#build)).
2. Open **`about:debugging#/runtime/this-firefox`** → **Load Temporary Add-on…** → pick **`manifest.json`** from the extracted folder.
3. Open a markdown file (`file:///` or allowed origin). Use the toolbar icon for theme, compiler, and **Content** toggles.
4. On install/update the extension asks for **`file:///`** access when needed; allow it for local notes.

Linux `file:///` mime setup and CSP notes: **[firefox.md](firefox.md)**.

---

## Defaults (fresh install)

| Area | Default |
| --- | --- |
| **Compiler** | markdown-it (GFM task lists on) |
| **Theme** | GitHub, auto width |
| **Content** | Syntax, MathJax, Mermaid, Plotly, ABC, Vega-Lite, Graphviz, WaveDrom, CSV/tables — **on** |
| **Content off** | Emoji, ToC, autoreload (opt-in) |

Use **Reset to defaults** in the popup to restore this profile. Existing synced settings are unchanged until you reset.

---

## What you get

**Core (from upstream)** — Multiple compilers, 30+ themes, GFM, Prism highlighting, MathJax, Mermaid, Plotly, emoji, ToC, autoreload, origin controls, raw/rendered views, scroll memory.

**This fork adds**

| Feature | Fence / trigger | Notes |
| --- | --- | --- |
| **ABC.js** | `abc` | Sheet music |
| **Vega-Lite** | `vega-lite`, `vegalite`, `vega` | Charts via vega-embed |
| **Graphviz** | `dot`, `graphviz` | WASM layout |
| **WaveDrom** | `wavedrom` | Timing diagrams |
| **Tables** | `csv`, `tsv`, **GFM `\|…\|` tables** | Hover funnel filter, column sort (asc → desc → original), copy source or visible rows |
| **Copy** | Normal fenced code + CSV/TSV/GFM tables | Not on mermaid, plotly, vega, etc. |

---

## Interactive tables

With **csv** enabled:

- **Filter** — Hover the table; click the funnel in the top-right header cell. Type to filter rows; click outside or press **Esc** to close.
- **Sort** — Click a header: ascending → descending → original order. Hover shows ⇅; active column shows ▲ or ▼.
- **Copy** — Unmodified: original fence or table text. After filter/sort: visible rows (TSV).
- **Reset** — In the filter popover when the view changed.

---

## Options page

**Advanced options** (toolbar → gear): manage **origins**, path/header detection, and synced **Settings** (compiler flags, custom theme upload).

---

## Build

```bash
git clone https://github.com/avih7531/markdown-viewer.git
cd markdown-viewer
sh build/package.sh   # needs node ≥18, npm, git, zip
```

Produces **`markdown-viewer.zip`** and populates **`vendor/`** / **`themes/`** (gitignored; required locally). Details: **[build/README.md](build/README.md)**.

---

## Development

```bash
node --test test/*.test.js
```

**Smoke test:** open [`test/features.md`](test/features.md) via `file:///` with Content toggles enabled.

Load the repo root (or zip contents) as a temporary add-on; **Reload** in `about:debugging` after code changes, then refresh the markdown tab.

---

## Credits

Original extension by [Simeon Velichkov](https://github.com/simov) and [contributors](https://github.com/simov/markdown-viewer/graphs/contributors).

See **[CHANGELOG.md](CHANGELOG.md)** for fork changes vs upstream v5.3.
