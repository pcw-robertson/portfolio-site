# Portfolio site

Static Astro site. Built to be edited in short sessions — most content changes
touch only one or two files.

## Commands

| Command           | Action                                  |
| :----------------- | :--------------------------------------- |
| `npm run dev`       | Local dev server at `localhost:4321`     |
| `npm run build`     | Build to `./dist/`                       |
| `npm run preview`   | Preview the production build locally     |
| `npx astro check`   | Type-check                               |

## Where things live

Every piece of copy on the site is a plain markdown file under
`src/content/` — edit any of them and push; the deploy workflow rebuilds
the whole site from whatever's currently in these files, so there's no
separate sync step.

- `src/content/site/index.md` — name, title, the two home-page paragraphs
  (`positioningStatement`, `summary`), email, and the footer's "Download CV"
  target (`resumeUrl`, a PDF in `public/`) — all in the frontmatter, no body.
  Edit this first.
- `src/content/about/index.md` — the About page copy, as the markdown body
  (a backslash at the end of a line is a line break within a paragraph).
- `src/content/projects/*.md` — one file per project. Frontmatter holds card
  media + embed URL; the markdown body holds "The problem" / "Role" /
  "Outcome". Editing one of these is a self-contained session.
- `src/content/projects/*.mdx` — same idea, but for a project whose page
  doesn't fit that generic template (see "Custom project layouts" below).
- `src/data/case-studies.md` — the single source of truth for a custom
  (`.mdx`) project's Opportunity/Role/Outcome/Annotations copy, one `##`
  section per project. `src/lib/case-studies.ts` reads and parses it at
  build time (`getCaseStudy(slug)`, `getAnnotation(caseStudy, title)`); a
  project's `.mdx` file imports from there instead of hardcoding this text,
  so editing this one file is the only way that copy changes — the `.mdx`
  file still owns structure (grid layout, which Marquee rows exist, which
  asset goes where). Currently wired up for `wired-app.mdx` and
  `new-yorker-games.mdx`; Bon Appétit and Pitchfork still hardcode their
  copy in their own file. A missing or
  renamed `###`/`**Title**` heading throws a clear build error rather than
  silently rendering blank — keep the file's existing heading structure
  when editing copy.

Everything else is code, not copy, and shouldn't need touching for routine
content edits:

- `src/pages/index.astro`, `src/pages/about.astro`,
  `src/pages/projects/[id].astro` — page templates.
- `src/components/`, `src/layouts/` — Nav, Footer, ProjectCard, and the two
  page layouts.
- `src/styles/global.css` — typography, spacing, color tokens.

## Adding a 5th project later

Copy an existing file in `src/content/projects/`, give it a new filename and
`order`, and fill in the frontmatter + body. It'll show up on the homepage
grid and get its own `/projects/<filename>` page automatically — no other
file needs to change.

## Media

- Cover images: drop files in `public/images/<project-slug>/` and reference
  them from that project's frontmatter (`coverImage`). Until set, the
  homepage card shows a flat placeholder block instead of a broken image.
- Homepage cards pour each project's hero (the same asset that opens the case
  study) into a 530x390 box. Per project, in the frontmatter: `cardFit`
  (`cover`, the default, fills the box and crops; `contain` shows all of the
  asset centered), `cardBackground` (the box colour — set it to the asset's
  own background so a `contain`ed video and its box read as one surface;
  Wired is `contain` on black, New Yorker Games is `cover` on its yellow), and
  `cardTitle` (the label under the card, when it differs from the case
  study's own title).
- Screen recording videos: see "Video pipeline" below — compress raw `.mov`
  files first, then point `coverVideo` (homepage card + project hero) at the
  compressed output in `public/videos/`.
- Longer walkthrough videos too big to self-host: host on YouTube/Vimeo
  (unlisted) instead and set `embedUrl` in the project's frontmatter.

## Video pipeline

Raw screen recordings need compressing before they go in `public/videos/` —
don't commit `.mov` files directly.

```bash
export PATH="$HOME/bin:$PATH"   # ffmpeg/ffprobe live in ~/bin, not on PATH by default
scripts/compress-video.sh "/path/to/raw recording.mov" project-slug-name
```

This produces `public/videos/project-slug-name.mp4` (H.264, no audio, capped
at 720px wide/30fps, ~CRF 28) and `project-slug-name-poster.jpg` (a still
frame for the `poster` attribute, so there's no blank flash before the video
loads). It prints a warning if the output is still over ~3MB — at that point
consider external hosting (YouTube/Vimeo unlisted + `embedUrl`) instead of
self-hosting. Tunable via env vars: `MAX_WIDTH`, `FPS`, `CRF`,
`WARN_SIZE_MB`, `POSTER_TIME`.

Then in a project's frontmatter:

```yaml
coverImage: "/videos/project-slug-name-poster.jpg"
coverVideo: "/videos/project-slug-name.mp4"
```

Every video rendered through `AssetFloat` (cards, project hero, walkthrough)
only plays while scrolled into view and pauses otherwise — not all
autoplaying at once on page load. `ProjectHero` preloads eagerly by default
since it's above the fold; everything else lazy-loads.

## Custom project layouts

Most projects use the generic template (header → optional hero video →
prose → optional 2/3-up walkthrough). A project can opt out of that and
compose its own page instead — see `wired-app.mdx` for a worked example —
by:

1. Naming the file `.mdx` instead of `.md`
2. Setting `template: "custom"` in its frontmatter (not `layout` — that's a
   reserved Astro key that auto-imports a layout component and will break
   the build if reused)
3. Composing the body directly with the grid system: wrap each section in
   `<div class="grid">`, place content in `<div class="col-N">` (1–12,
   defaults to full-width below the desktop breakpoint), and drop in
   `<AssetFloat>` for any image/video. Import components you use at the top
   of the file, e.g. `import AssetFloat from "../../components/AssetFloat.astro"`.

For a group of assets instead of one, more components are available
(`new-yorker-games.mdx` uses the first two, `wired-app.mdx` the last):

- `<ImageCollage images={[...]} />` — a fixed-height cropped grid (like a
  masked Figma frame taller than its container — top/bottom rows peek in
  partially cropped). Static, no JS. Takes `columns`/`mobileColumns`,
  `height`/`mobileHeight`, `aspectRatio`, `gap`, `radius`.
- `<SlideShow images={[...]} />` — a set of sequential screens. Where they
  fit, they sit in a static row (48px apart). Otherwise they become an
  autoplay carousel: full viewport width, active screen centered, neighbors
  peeking in at the edges. That's always the case below the desktop
  breakpoint, and at desktop whenever the static row would squeeze slides
  under `minSlideWidth` (default 220px — so 4 across fits, a 5th tips it
  over; narrower columns tip sooner). Autoplay only, gated the same way as
  video (only runs while scrolled into view). Takes `aspectRatio`,
  `mobileSlideWidth` (under 100% so neighbors show), `minSlideWidth`,
  `pauseMs`, `transitionMs`, `radius`.

- `<Marquee items={[...]} />` — one row of device-shaped assets. Every
  screen gallery across the site follows the same rules automatically, with
  no props required beyond `items`:
  - **Frame size.** Every item is drawn at the same height, `--frame-height`
    (defined in `grid.css`) — the height that makes exactly 4 standard
    phone-ratio (9:19.5) frames plus their gaps fill the grid's own
    (capped) content width. It's a single constant shared by every case
    study, so a row on one page is always the same size as a row on
    another, and it stays constant across the whole desktop range (the
    grid's content width doesn't grow past 1280px, so there's nothing to
    keep shrinking as the window narrows past that). Override with a
    `height` prop only for a deliberate exception.
  - **Scroll vs. still.** 4 items or fewer sit still, centered, aligned with
    the same margins as everything else on the page (this is `shrinkToFit`,
    on by default for ≤4 items — pass `shrinkToFit={false}` to force a
    small row to scroll anyway). More than 4 scrolls slowly and
    continuously (`speed` in px/s, default 20), looping seamlessly. If a
    page mixes both kinds of row, every `<Marquee>` on it shares the same
    frame height regardless — a six-item row that has to scroll still
    renders at the same size as a four-item row sitting still next to it.
  - **Mobile.** Below the desktop breakpoint, every row is a swipeable
    one-at-a-time carousel with dot pagination by default
    (`mobileCarousel`) that also autoplays (`autoplay`) — the active dot
    elongates into a pill and fills left to right as a countdown, timed to
    that slide's own video length automatically (falling back to
    `autoplayMs`, default 4000, for an image or before a video's metadata
    has loaded — the point being that autoplay never rushes past a slide
    before its own clip has actually played). Any swipe or dot click takes
    over immediately and restarts the timer from wherever it lands; the
    row loops seamlessly past the last slide back to the first. Pauses
    entirely while scrolled out of view. Pass `mobileCarousel={false}`
    and/or `autoplay={false}` to opt a row out.
  - Corners `radius` 30px by default. Put several `<Marquee>`s in the same
    column wrapper to stack rows (96px apart; put a `<p class="caption">`
    after a row for a label 24px below it — wrap the heading line in
    `<span class="caption-title">` for the brighter title, with a `<br />`
    and grey description after it); add `reverse` to a row to scroll it
    left-to-right, so stacked rows read as deliberately contrasting rather
    than slightly out of sync. Used throughout `wired-app.mdx`.

`AssetFloat` defaults to a 9:16 aspect ratio (most captures are vertical
phone screens) but takes an `aspectRatio` prop for anything else — e.g. a
wide/tall full-page scroll capture — and an `eager` prop for the one video
that should preload immediately (typically whatever's above the fold). For a
single edge-to-edge phone screen capture (not part of a `<Marquee>` row),
pass `maxHeight="var(--frame-height)"` so it matches the same shared frame
size — see the real screen captures in `new-yorker-games.mdx`. Below the
desktop breakpoint that same value also draws it at 88% of its column,
left-aligned (`mobileScale`, same default as `<Marquee>`), so a solo frame is
the same size as a carousel frame. The one
deliberate exception is a hero/context shot that shows a device inside a
wider frame rather than edge-to-edge (`wired-app.mdx`'s intro walkthrough
video) — that keeps its own `maxWidth`, sized to taste, since it isn't
trying to match the phone-frame family at all.

- `<FullBleedReveal src mobileSrc [poster] [mobilePoster] [alt] [holdVh]>` — a
  full-viewport-width video used as a pacing beat between sections. It sits
  motionless while the content above scrolls away to uncover it, holds
  fullscreen, then the content below slides up and covers it. Pure CSS (a
  `position: sticky` video in a clipped stage), no scroll JS. `src` is the
  16:9 cut for desktop, `mobileSrc` the 9:16 cut below 1280px; `holdVh`
  (default 60) is how much extra scroll the video holds fullscreen once
  uncovered. It owns two slots — pass the "before" content as normal
  children and the "after" content with `slot="exit-cover"` (the first named
  slot in the codebase):

  ```mdx
  <FullBleedReveal src="/videos/x-16x9.mp4" mobileSrc="/videos/x-9x16.mp4">
    <div class="grid">…row the video is revealed from under…</div>
    <div class="grid" slot="exit-cover">…row that covers it again…</div>
  </FullBleedReveal>
  ```

  Both slots are wrapped in full-width, opaque panels, so any `.grid` content
  inside can keep its normal width. Constraints: no ancestor of the component
  may set `overflow` other than `visible`/`clip` (it silently breaks
  `sticky`; true today for every project page), and `overflow: clip` needs
  Safari 16+. Used in `pitchfork-subscription.mdx`.

- `<ResultCardSwap base={...} cards={[...]} cardTop={...} cardLeft={...} cardWidth={...} cardHeight={...} />`
  — a fixed screen with one small region on it (a result card) that cycles
  through a sequence of states, each sliding in over the last, while
  everything else on screen stays put. `base` is the full screenshot used
  as the static backdrop; `cards` are that same region pre-cropped from each
  state's own screenshot — get `cardTop`/`cardLeft`/`cardWidth`/`cardHeight`
  (percentages) from the actual crop rectangle divided by the base image's
  own pixel dimensions, not by eye, so every card lands in exactly the same
  spot regardless of render size. `intervalMs` (default 2800) sets the hold
  per state; only cycles while scrolled into view. Sized like a solo
  `AssetFloat` screen capture (`maxHeight`, default `var(--frame-height)`).
  Used for New Yorker Games' Catalogues results card.

The top row of every custom-layout case study is a fixed-height "hero stage"
so they all open with the same footprint whatever the media shape: put
`hero-stage` on the `.grid` and `hero-media` on the column holding the
media (see `grid.css`). At desktop the row is `--hero-height` (710px,
roughly one screen — set by Wired's tall walkthrough) and the media sits
vertically centered in it, so a square or a mascot panel gets the same
footprint as a phone video and the first row of screens never peeks in
beneath it. Size the media to its column (`maxWidth="100%"` for a square);
below desktop the row just stacks. Used in `wired-app.mdx`,
`new-yorker-games.mdx` and `pitchfork-subscription.mdx`.

Items that fall back to stacked full-width below desktop (e.g. two `col-6`s)
sit only the 16px column gutter apart by default; add `stack-gap` to the
`.grid` for 48px on mobile.

The whole site is one theme — white type on true black (`:root` in
`global.css`; black matches the video footage exactly). Nav and footer follow
the Figma (24/28 nav, 18/28 footer, `--text-l`/`--text-s` in `global.css`), as
do the home and about pages (the 530px `.copy` block and the 530x390 card
grid). `.project-theme` in `ProjectLayout.astro` is just the hook for the
case-study type rules and the full-bleed wrapper.

All type is Söhne Buch (Klim Type Foundry, licensed), self-hosted from
`public/fonts/soehne-buch.woff2` via the `@font-face` in `global.css` and
preloaded in `BaseLayout`. It's a single regular weight with no italic, so
headings are set at 400 and `font-synthesis: none` stops the browser faking
bold/italic. To add a weight, drop its `.woff2` next to it and add a second
`@font-face` for it. The file is covered by Klim's licence agreement — check
its terms before making the repository public or sharing the repo.

Astro reserves `<style>` tags for scoped CSS in `.astro` files, but **not**
in `.mdx` — a raw `<style>` block in an `.mdx` file will fail to build
(MDX tries to parse its contents as JSX). Add project-specific CSS to
`src/styles/global.css` or `grid.css` instead.

## Deploying

Push to `main` on GitHub — a GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds the site and deploys it to Bluehost
hosting automatically. See that file for the deploy target and secrets it
expects (`BLUEHOST_HOST`, `BLUEHOST_PORT`, `BLUEHOST_USERNAME`,
`BLUEHOST_SSH_PRIVATE_KEY`, and the `BLUEHOST_DEPLOY_PATH` variable).
