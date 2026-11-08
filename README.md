# Homeroom

A minimalist browser game hub for desktop and laptop browsers, hosted on GitHub Pages.

- Plain HTML, CSS and JavaScript modules: no frameworks, no build step, no CDNs.
- Everything you do (pins, hidden games, recents, stats, saves, profile) is stored only in
  your own browser, in IndexedDB. There is no server and no account.
- Three kinds of games: **Originals** (made for Homeroom), **Unblocked** (open-source games
  hosted with their licenses) and **Embed** (loaded from a game's official site).

The shell is done; the games are placeholders for now. `CLAUDE.md` is the full plan.

## Run it locally

Any static file server works. From the repository root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk will not work,
because browsers block ES modules on `file://` URLs.

## Deploy

In the repository settings, under Pages, choose "Deploy from a branch" and pick the branch
and the root folder. The `.nojekyll` file matters: without it, GitHub Pages hides folders
that start with an underscore, such as `games/_placeholder`.

## Adding a game (later)

Add one entry to `games/catalog.json` (the schema is in `CLAUDE.md` section 6). Local games
can include `sdk/homeroom-sdk.js` to report scores and keep save data. The catalog loader
skips entries that break the rules: unknown genres or tags, an Unblocked game without code
and asset licenses, or an Embed that points at local files.

## Credits

- Code, icons, the comet mark and the placeholder games: original work for Homeroom.
- Fonts: the system font stack (SF Pro, Segoe UI and so on); nothing is bundled.
- Third-party files: none yet. Anything added later goes in `vendor/` next to its license.
