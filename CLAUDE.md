# Homeroom — Master Plan

You are building **Homeroom**, a browser game hub hosted on **GitHub Pages**. This file is the source of truth. Read it fully before starting any phase, and update the **Status** section at the bottom when a phase is done.

**Current scope: the shell only.** Build the app around the games: layout, sidebar, library, game canvas, profile and onboarding. Use the placeholder games defined below. Do not add real games until the owner says so.

---

## 1. Product summary

- Homeroom is the laptop-optimized sibling of the owner's iPhone app *Bloodstream*: the same Apple-like minimalism, built for desktop browsers.
- Layout: a **sidebar** on the left and the **Game Canvas** filling the rest. The canvas is blank (pure black) unless a game or the library is open.
- Three game sources: **Originals**, **Unblocked** and **Embed** (defined in §6).
- All user data is stored locally in the browser. There is no backend and no accounts on a server.

## 2. Hard rules

1. **Vanilla only.** HTML, CSS and JavaScript ES modules. No frameworks, no bundler, no npm runtime dependencies. GitHub Pages serves the repo as-is.
2. **No runtime CDNs.** Anything external (fonts, icons, libraries) is copied into `/vendor` with its license. School filters often block CDNs.
3. **Minimalist icons only.** Inline SVG with a 1.5px stroke, monochrome, `currentColor`. Our own set in `/app/icons.js`, or Lucide (ISC) copied into `/vendor`. No emoji anywhere in the UI or the code.
4. **Desktop and laptop only for now.** Phones and tablets get the gate screen (§12).
5. **Legal guardrails for games (applies later, enforce now in the catalog schema):**
   - *Unblocked* = open-source games only, with code AND asset licenses that allow redistribution. Each game folder keeps its LICENSE file.
   - *Embed* = only official embed sources (developer embed codes, GameDistribution-style publisher embeds). Never rehost proprietary game files.
   - *Originals* are written from scratch: no copied names, characters, art, music or levels.
6. Keep files small and focused (aim for under 300 lines each). Comment the non-obvious parts.
7. Accessibility: every control is keyboard-reachable with a visible focus ring, and `prefers-reduced-motion` is respected.

## 3. Design system

```
--bg:          #000000        /* OLED black: canvas and app background */
--sidebar:     rgba(28,28,30,0.72) over a #121214 base, backdrop-filter: blur(30px) saturate(140%)  /* "mica" dark gray */
--surface:     #1c1c1e        /* popups, menus, rows on hover */
--line:        rgba(255,255,255,0.08)
--text:        #f5f5f7
--text-2:      #a1a1a6
--text-3:      #6e6e73
--accent:      #ffffff        /* monochrome UI; color appears only in avatars and focus rings */
--focus:       #0a84ff
--danger:      #ff453a
--radius-sm 8px, --radius 12px, --radius-lg 16px
--font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif
--mono: "SF Mono", ui-monospace, "Cascadia Mono", Menlo, monospace
```

- Mica effect: semi-transparent dark gray, a backdrop blur, and an optional faint noise texture (a tiny inline SVG `feTurbulence` at 3% opacity).
- Motion: 180–240ms, ease `cubic-bezier(.2,.8,.2,1)`. Popups scale from 0.96 and fade in. Collapsible sections animate height.
- Type scale: 12 / 13 / 15 / 17 / 22 px. Sidebar text is 13px, library rows are 14px.
- Sidebar width is 248px, collapsible to 64px (icon rail) with Ctrl+\\ (nice to have, Phase 7).

### Logo
Placeholder: a minimalist black-and-white comet (circle head with a tapered three-stroke tail) as an inline SVG in `/app/brand.js`. Keep it in one place so it can be swapped later. The comet is also the favicon (white on transparent).

## 4. File structure

```
/
├─ index.html                 # app entry; loads /app/main.js as a module
├─ 404.html                   # copy of index.html (hash routing makes this mostly unnecessary)
├─ CLAUDE.md                  # this file
├─ README.md                  # short public description + credits link
├─ app/
│  ├─ main.js                 # boot: gate check → storage → onboarding or shell
│  ├─ router.js               # hash routes (§5)
│  ├─ state.js                # tiny observable store (subscribe/set), mirrors IndexedDB
│  ├─ storage.js              # IndexedDB wrapper (§9)
│  ├─ catalog.js              # loads /games/catalog.json, filtering/search helpers
│  ├─ icons.js  brand.js
│  ├─ ui/
│  │  ├─ sidebar.js  library.js  canvas.js  player.js
│  │  ├─ profile.js  menu.js  tooltip.js  dialog.js
│  │  ├─ onboarding.js  gate.js
│  └─ styles/
│     ├─ base.css  sidebar.css  library.css  popups.css  onboarding.css
├─ sdk/
│  └─ homeroom-sdk.js         # included by local games; postMessage bridge (§8)
├─ games/
│  ├─ catalog.json            # the single list of games (§6)
│  └─ _placeholder/           # demo game that exercises the SDK
│     └─ index.html
└─ vendor/                    # third-party files + their LICENSE files
```

## 5. Routing

Use hash routes so GitHub Pages never 404s.

| Route | Canvas shows |
|---|---|
| `#/` | Blank black canvas |
| `#/library` | Library |
| `#/library?genre=racing` | Library with the genre filter applied |
| `#/library?tag=two-player` | Library with the tag filter applied |
| `#/play/<gameId>` | Player with that game loaded |

Onboarding is an overlay, not a route.

## 6. Game catalog

`/games/catalog.json` is an array of entries:

```json
{
  "id": "flop-duel",
  "title": "Flop Duel",
  "genre": "sports",
  "source": "original",
  "tags": ["2d", "two-player", "physics", "short-sessions", "keyboard"],
  "description": "One-button floppy physics duels in five sports.",
  "entry": "games/flop-duel/index.html",
  "embedUrl": null,
  "license": { "code": "MIT", "assets": "Original", "upstream": null },
  "alternativeTo": null,
  "originalAlternative": null,
  "sizeKB": 420,
  "addedAt": "2026-11-08",
  "placeholder": false
}
```

- `source` is one of `"original" | "unblocked" | "embed"`. Embed entries use `embedUrl` instead of `entry`.
- `originalAlternative`: for embeds, the id of an Original that replaces it. The UI shows an "Original available" tag that links to it.
- Genres (fixed list): `racing, action, adventure, sandbox, sports, puzzle, arcade, strategy, horror, rhythm, party, idle, card-board`.
- Tags (fixed vocabulary; add new ones here first): `2d, 3d, singleplayer, two-player, co-op, multiplayer-bots, cars, physics, elimination, endless, story, short-sessions, long-sessions, keyboard, mouse, gamepad, shooting, platformer, building, survival, puzzle-logic, rhythm, retro, chill, hard`.
- **Display names** come from a label map in `catalog.js` (e.g. `two-player` → "Two-player").

**Source tooltips** (shown on hover over the source label, and in Game Info):
- **Original:** "Made for Homeroom. Inspired by popular games, built from scratch, and hosted here. The safest bet."
- **Unblocked:** "An open-source game, hosted by Homeroom exactly as its creators made it. Some advanced filters can still catch these."
- **Embed:** "Loaded from the game's official site, not hosted by Homeroom. Many filters block these, and they may show the publisher's ads."

**Placeholders for the shell phase:** create 8 entries with `"placeholder": true`, spread across genres and sources, all pointing at `games/_placeholder/index.html?title=<name>`. One embed placeholder should point at a harmless local page that simulates an embed: same behavior, but treat it as cross-origin (no SDK) so the unload path can be tested.

## 7. Layout and components

### 7.1 Sidebar (top to bottom)
1. **Comet icon** alone, no wordmark. Clicking it goes to `#/` (blank canvas).
2. **Explore** (collapsible section, open by default)
   - **Library**: goes to `#/library`.
   - **Genres**: a nested list of the 13 genres, each with a small icon. Clicking one goes to `#/library?genre=<g>`. Only genres that have at least one visible game are shown.
3. **Pinned** (collapsible section): games starred in the library, in the order they were starred (newest at the bottom). Clicking one plays it. Shows an empty-state line: "Star a game in the Library to pin it here."
4. **Recents** (collapsible section): the last 10 played games, newest first. Clicking one plays it.
5. **Bottom-left:** the user avatar button (§10).

- Section open/closed state persists in prefs.
- Each game row in Pinned and Recents shows the title only, and a play icon on hover.
- The active route is highlighted with a subtle `--surface` pill.

### 7.2 Library (in the canvas)
A plain list, like a database table. No cards, carousels, images or cover art.

**Top bar:** search field (title + description + tags), Genre dropdown, Source segmented control (All / Originals / Unblocked / Embed), and a tag filter row of toggle chips (multi-select, AND logic). A "Clear filters" text button appears when any filter is active. Results count goes on the right ("42 games").

**Columns:** `Title | Genre | Source | [Play] | ☆ | ⋯`
- **Title:** on row hover, a small gray downward chevron fades in after the title. Clicking it, or the title, expands the row inline to show the description plus tag pills. Tag pills are clickable and add that tag to the filter. Only one row expands at a time.
- **Source:** a text label with a dotted underline that shows the tooltip from §6 on hover or focus.
- **Play:** a quiet outlined button that goes to `#/play/<id>`.
- **Star:** toggles pin. Outline when off, filled when on.
- **⋯ menu:** *Game Info* (opens the Game Info popup), *Star / Unstar*, *Hide game*.
- **Sort:** clicking a column header sorts by it (Title A–Z by default; also Genre, Source).
- **Hidden games:** removed from the list. At the very bottom of the list, a small text link reads "Show hidden (N)". It toggles a section listing hidden games, grayed out, whose ⋯ menu offers *Unhide*.
- Keyboard: arrow keys move through rows, Enter plays, Space expands, S stars.

### 7.3 Game Info popup
A centered dialog with: title, source (with explanation), genre, tags, full description, license line (for Unblocked: code/asset license + upstream link), "Original available" link if any, and **your stats**: total playtime, times played, last played, best score (if the game reports scores). Buttons: Play, Star/Unstar, Hide.

### 7.4 Player (canvas)
- The game loads in an iframe that fills the canvas.
  - Local games (original/unblocked): `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen"`.
  - Embeds: `sandbox="allow-scripts allow-same-origin allow-popups allow-fullscreen"`, `referrerpolicy="strict-origin-when-cross-origin"`.
  - Implementation note: `allow-fullscreen` is not a valid sandbox token (Chrome logs an error for it), so it is left out of `sandbox` and fullscreen is granted with `allow="fullscreen; gamepad; autoplay"` on the iframe instead.
- A slim top-right overlay (it fades in on mouse move and hides after 2s idle) has Fullscreen, Game Info and Close (back to the last library view or blank).
- On load: add to Recents, increment times played, start the playtime timer.

## 8. Game SDK (`/sdk/homeroom-sdk.js`)

Local games include this script. It's a postMessage bridge with an origin check (same origin only).

Host → game: `{type:"hr:pause"}`, `{type:"hr:resume"}`, `{type:"hr:mute", value:true|false}`
Game → host: `{type:"hr:ready"}`, `{type:"hr:score", value:Number}`, `{type:"hr:save", data:Object}`, `{type:"hr:load"}` → host replies `{type:"hr:loaded", data}`.

- Games without the SDK still run. They just get no saves or scores.
- **Playtime** only counts while the player is visible, the document is visible (`visibilitychange`) and the window is focused. Flush to storage every 15s and on close.

## 9. Storage (`/app/storage.js`)

IndexedDB database `homeroom`, version 1, with object stores:

| Store | Key | Value |
|---|---|---|
| `profile` | `"me"` | `{name, avatar:{bg, symbol}, joinedAt}` |
| `prefs` | key | e.g. `sections`, `onboarded` |
| `pins` | gameId | `{pinnedAt}` |
| `hidden` | gameId | `{hiddenAt}` |
| `recents` | gameId | `{playedAt}`; trim to the 10 newest |
| `stats` | gameId | `{playMs, plays, lastPlayed, bestScore}` |
| `saves` | gameId | arbitrary game save data |

- On first run, call `navigator.storage.persist()` and record the result.
- If IndexedDB is unavailable (some private windows), fall back to an in-memory store and set `storageMode = "session"`.
- Everything goes through `state.js` so the UI updates reactively.

## 10. Profile popup

- The bottom-left avatar button opens a popover anchored above it.
- Contents:
  - Avatar preview with editor: a background color (12 basic colors) plus a symbol (about 24 options: geometric shapes, simple vectors like comet, star, moon, bolt, leaf, wave, triangle, hexagon, initials). Stored as data and rendered as SVG.
  - Name field (optional, 24 characters max).
  - **First joined:** date.
  - **Stats:** total playtime, games played, most-played game.
  - **Save status:** "Saved on this browser" when IndexedDB is available and persistence was granted. "Saved, but your browser may clear it" when IndexedDB works but persistence was denied. "Not saved, private window" in session mode.
  - Settings: "Replay onboarding", "Wipe Homeroom" (confirmation dialog, clears all stores).

## 11. Onboarding

Runs on first visit (`prefs.onboarded` is not set) and from "Replay onboarding". It takes place **in the sidebar**: the sidebar content is temporarily replaced by step cards with a Next button and a step dot indicator, and the canvas illustrates each step. Back and Skip are available. Copy can be polished, but keep the meaning:

1. "Welcome to Homeroom. Let's get you set up."
2. "Homeroom is a collection of browser games you can play right here: some made just for Homeroom, some open-source classics, and some loaded from their official sites."
3. "To your right is the Game Canvas. It stays blank until you open a game or the Library." (The canvas briefly pulses its edge.)
4. Canvas shows a **non-interactive sample library** (a static render of the library component with placeholder data). "This is the Library: the full roster of games on Homeroom. Filter by genre, tags and source, or search for a title."
5. Sidebar highlights the Genres list. "Genres sort games by type. Tags are more specific, like Cars, Elimination, 3D or Two-player, and you'll find them as filters in the Library."
6. "Every game comes from one of three sources:" followed by the three source descriptions from §6 (Original / Unblocked / Embed), each with its label styled as in the library. For Originals add: "Since they're new, you may not have heard of them, and quality varies while we build them out." For Embeds add: "If we've made an Original alternative, the game will say so."
7. "What should we call you? (optional)" Name field + avatar quick-pick. Below it: "Homeroom saves your pins, preferences and stats, like playtime, in this browser. You'll find them in Game Info and your profile. Browsers can clear this data, so don't depend on it."
8. "You're all set. Have fun." Finish sets `prefs.onboarded = true`, records `profile.joinedAt` if missing, and shows the normal sidebar.

## 12. Device gate

On boot, if the viewport is narrower than 900px or the primary pointer is coarse (`matchMedia("(pointer: coarse)")`) with no fine pointer available, show a full-screen black page with the comet and the line: "Homeroom is built for desktop computers and laptops, but we're working on it." No other UI loads.

## 13. Build phases

Commit at the end of each phase with a clear message, then update §14.

**Phase 0: Scaffold**
- File structure from §4, base CSS tokens, `index.html`, module boot, comet placeholder + favicon, empty `catalog.json` with the 8 placeholders, placeholder game page.
- Done when: the site loads on GitHub Pages with a black canvas and an empty sidebar frame, with no console errors.

**Phase 1: Sidebar + routing**
- Sidebar with all sections from §7.1 (Pinned and Recents read from in-memory state for now), collapsible sections, hash router, active states.
- Done when: genre links route to `#/library?genre=…` and the comet returns to `#/`.

**Phase 2: Library**
- Everything in §7.2: list, search, genre dropdown, source control with tooltips, tag chips, sorting, expandable rows, star, ⋯ menu, hide/unhide, keyboard navigation, empty states.
- Done when: all filters combine correctly and hidden games only show behind "Show hidden (N)".

**Phase 3: Player + SDK**
- §7.4 and §8: iframe player, overlay controls, the SDK, scores/saves round-trip with the placeholder game, embed placeholder handled with no SDK.
- Done when: the placeholder game reports a score that shows in Game Info.

**Phase 4: Storage, profile, stats**
- §9 and §10: IndexedDB wrapper, state mirroring, playtime tracking, Recents trimming, profile popover with avatar editor, save-status logic, Wipe.
- Done when: a reload keeps pins, hidden games, recents, profile and stats, and Wipe resets everything.

**Phase 5: Onboarding**
- §11 in full, including the static sample library.
- Done when: a first visit runs onboarding once, and "Replay onboarding" works.

**Phase 6: Gate, polish, accessibility**
- §12, focus rings, reduced motion, keyboard paths, empty and error states (catalog failed to load, game failed to load), README with credits section.
- Done when: the full app is usable by keyboard alone.

**Phase 7: Nice-to-haves (only if asked)**
- Sidebar collapse to an icon rail, a command palette (Ctrl+K) for quick game search.

## 14. Status

- [x] Phase 0
- [x] Phase 1
- [x] Phase 2
- [x] Phase 3
- [x] Phase 4
- [ ] Phase 5
- [ ] Phase 6

### Later (not in shell scope)
- Real games from the roster: 20 open-source (Unblocked), 17 rebuilds and 42 Originals.
- Shared engine kit in `/engine` for Originals (game loop, input, synth audio, physics wrapper).
- A `tools/` script that validates `catalog.json` against the schema and checks every Unblocked game folder has a LICENSE file.
