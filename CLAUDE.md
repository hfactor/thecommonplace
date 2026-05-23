# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Build & Dev

```bash
hugo server          # local dev at localhost:1313
hugo --minify        # production build → public/
```

No npm, no build pipeline. Pure Hugo + vanilla JS + CSS.

---

## Architecture Overview

Hugo static site. Hugo handles data aggregation and page generation at build time. JavaScript handles interactivity (filtering, view switching, sheet panels). CSS is token-driven with no framework.

### Directory structure

```
content/          # Markdown content per type
data/             # YAML data files (things, newsletter, views, etc.)
layouts/          # Hugo templates
  _default/       # Fallback layouts (uses.html, now.html, antilibrary.html, etc.)
  partials/       # Reusable template pieces
  index.html      # Homepage
  notes/          # Notes-specific layouts
  projects/       # Projects-specific layouts
assets/
  css/            # All styles, loaded as bundle
  js/             # All scripts, loaded as bundle
  img/            # Static images
```

---

## Content Types

### Reading (`content/reading/`)
Markdown files, one per book/item read.

| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `localTitle` | string | Optional, e.g. Malayalam title |
| `author` | string | |
| `date` | date | Publish/finish date |
| `language` | string | English, Malayalam, etc. |
| `genre` | string | Fiction, Non-Fiction, Comics, Memoir, etc. |
| `recommended` | bool/string | `true` or `"yes"` — shows ✦ badge |
| `image` | URL | Cover image |
| `link` | URL | External link (Amazon etc.) |
| `status` | string | `"reading"` = currently reading (shown on /now) |

### Bookmarks (`content/bookmarks/`)
Markdown files. Body = summary/notes.

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `domain` | string | Optional, extracted from href if missing |
| `href` | URL | The bookmarked URL |
| `date` | date | |

### Notes (`content/notes/`)
Markdown files, written in Obsidian. Supports `[[wikilinks]]` syntax.

| Field | Notes |
|---|---|
| `title` | |
| `date` | |
| `pinned` | Pinned notes bubble to top of list |

Folder structure controls visibility:
- `00-Inbox/` — excluded from build (ignored in config.toml)
- `20-Outbox/` — published
- `30-Log/` — excluded
- `40-Private/` — excluded

### Projects (`content/projects/`)
Markdown files. Currently `render = false` in config — not public yet.

| Field | Notes |
|---|---|
| `order` | Sort order (ascending) |
| `title` | |
| `date` | Year |
| `href` | External link (optional) |
| `cover` | Cover image URL (optional) |
| `tagline` | One-liner for gallery card |
| `summary` | Lead paragraph on detail page |
| `with` | Collaborators (text) |

### Things / Uses (`data/things.yaml`)
YAML-driven, not markdown content files.

| Field | Notes |
|---|---|
| `title` | |
| `subCategory` | Brewing / Analog / Carry / Audio / Device / Other |
| `date` | When added |
| `href` | Product link |
| `image` | Product image URL |
| `recommended` | `yes` / `no` |
| `note` | Short description, shown on hover |

---

## Data Files

| File | Used by |
|---|---|
| `data/types.yaml` | Type system config — drives Explore panel, card rendering, and list routing |
| `data/things.yaml` | `/uses` page |
| `data/newsletter.yaml` | Newsletter entries in Everything view |
| `data/antilibrary.yml` | `/antilibrary` page |
| `data/uxfoss.yml` | `/uxfoss` page |
| `data/colophon.yaml` | `/colophon` page |

---

## Key Layouts

### `layouts/partials/calendar-page.html`
The core of the Everything view. Renders three view modes:
- **Mobile** (`mWrap` / `mTrack`): horizontal scroll, one month per panel
- **Desktop columns** (`dCols`): multi-column flex, one column per month
- **List view** (`lView`): chronological rows

### `layouts/partials/page-data.html`
Critical partial. Aggregates all reading + bookmark + newsletter entries, groups them by month (YYYY-MM), and injects as a JS constant:
```js
const DATA = { "2026-05": [ { uid, type, day, title, ... }, ... ], ... }
```
This is the data bridge between Hugo and JavaScript.

### `layouts/partials/views-data.html`
Injects two JS constants from `data/types.yaml`:
- `TYPES_CFG` — full type config array (id, label, card_template, view_mode, on_click, in_everything)
- `VIEWS_CFG` — filtered to `in_everything: true` types + the "Everything" entry; used by `search.js` to build the Explore panel

### `layouts/partials/sheet.html`
The slide-in side panel. Used for reading and bookmark detail views. Rendered empty in HTML; content is injected by `sheet.js` when a card is clicked.

### `layouts/_default/uses.html`
Gallery grid layout for `/uses`. Reads from `hugo.Data.things`, builds category filter buttons from the active categories found in data, renders cards. Filter is pure JS (toggles `hidden` attribute).

### `layouts/projects/list.html`
Gallery grid for `/projects`. Reads Hugo pages sorted by `order` param. Same visual grid as uses.

---

## JavaScript Files (`assets/js/`)

| File | Responsibility |
|---|---|
| `main.js` | Renders cards/columns/list from DATA; handles view switching; rebuild on filter change |
| `search.js` | Filter pills, recommended toggle, search query, URL sync with History API |
| `sheet.js` | Side panel open/close, renders reading/bookmark detail, parses wikilinks |
| `notes.js` | Notes index navigation and pinned sorting |
| `panel.js` | Notes side panel (different from sheet — used within notes section) |
| `theme.js` | Dark/light mode toggle, persists to localStorage |

All JS is concatenated and minified into a single bundle via Hugo Pipes in `baseof.html`.

### Data flow
```
Hugo (views-data.html) → TYPES_CFG + VIEWS_CFG injected into HTML
Hugo (page-data.html)  → DATA = { "YYYY-MM": [{uid, type, ...}] } injected into HTML
→ main.js reads DATA
→ search.js filters it; Explore panel built from VIEWS_CFG
→ main.js renders entries: typeCfg(e.type) → card_template → named render fn
→ click → on_click: "sheet" → sheet.js | "external" → new tab | "page" → navigate
```

### Filter logic
```
entryMatches(e) =
  activeFilter(e)          // type pill: all / reading / bookmarks / newsletter
  AND (NOT recOnly OR e.recommended)
  AND (NOT searchQuery OR title/author/domain includes query)
```
URL reflects active state: `/reading/`, `/bookmarks/`, `/everything/`, etc. History API keeps back button working.

---

## CSS System (`assets/css/`)

### `tokens.css`
Single source of truth for all design tokens.

**Type scale** (Major Second, 14px base, responsive clamp):
`--text-sm` → `--text-base` → `--text-md` → `--text-lg` → `--text-xl` → `--text-2xl` → `--text-3xl`

**Weights**: `--weight-normal: 400`, `--weight-semibold: 500`
Note: `--weight-semibold` is actually 500 (medium) — naming predates a heavier semibold being added.

**Colors** (two themes, `data-theme="chalk"` / `data-theme="ink"`):
- `--ink` — primary text
- `--ink2` — secondary/muted text (no `--ink3`, it does not exist)
- `--bg`, `--surface`, `--surface2` — backgrounds, lightest to darkest
- `--accent` — interactive highlight colour
- `--accent-subtle` — light accent tint for inline link backgrounds
- `--border`, `--border-light`

### Link/hover conventions
- Nav and content links: `--ink2` default → `--ink` on hover
- Inline text links: `--ink` + `background: var(--accent-subtle)` → `--accent` on hover
- Interactive accent: `--accent` (filter active states, wikilinks, backlinks)
- Cards: image `scale(1.05)` on hover + title → `--accent`
- No `text-decoration: underline` on any link (removed for consistency)

### File breakdown
| File | Covers |
|---|---|
| `tokens.css` | All design tokens |
| `layout.css` | Base layout, app shell, mobile/desktop column structure |
| `header.css` | Top nav, filter UI, FAB, search, notes navigation, sheet panels |
| `cards.css` | Reading/bookmark/newsletter cards used in Everything view |
| `pages.css` | Gallery grid (uses + projects), gallery header, card styles for both |
| `panel.css` | Single-item reading view, notes content, colophon, antilibrary, now page |
| `sheet.css` | Sheet/overlay panel styles |
| `list.css` | List view rows (Everything list mode) |
| `home.css` | Homepage only |
| `animations.css` | Shared transitions and animations |

---

## Config (`config.toml`)

```toml
[params.sections.{name}]
  render = true/false   # controls whether section is built and linked
```

Current state:
- `notes`, `reading`, `uses` → `render = true`
- `bookmarks`, `things` → `render = false`
- `projects` → `render = false` (content needs cleanup before going public)

`disableKinds = ["taxonomy", "term"]` — no tag/category pages generated.

Ignored content (excluded from build):
```toml
ignoreFiles = [
  "/content/notes/00-Inbox/.*",
  "/content/notes/30-Log/.*",
  "/content/notes/40-Private/.*",
  ...
]
```

---

## Type System (`data/types.yaml`)

Each entry drives rendering end-to-end. Fields:

| Field | Values | Effect |
|---|---|---|
| `id` | slug string | URL + filter key |
| `label` | string | Explore panel label |
| `in_everything` | bool | Whether it appears in Explore dropdown |
| `card_template` | `book` \| `browser` \| `newsletter` \| `product` | Which named render function in `cardHTML()` |
| `view_mode` | `cal` \| `gallery` | Dedicated page layout |
| `on_click` | `sheet` \| `external` \| `page` | Click behaviour for cards and list rows |

**Adding a new type** (e.g. cinema):
1. Add entry to `data/types.yaml` with the right `card_template` and `on_click`
2. Add data file or content section with entries (each entry needs `type: cinema`)
3. Add loading block in `page-data.html` for the new data source
4. Create `content/cinema/_index.md` with `layout: listing` frontmatter
5. If the card visuals differ enough to need a new template, add a named branch in `cardHTML()` and the matching CSS

No JS changes needed for routing — `typeCfg()` resolves config at runtime from `TYPES_CFG`.
