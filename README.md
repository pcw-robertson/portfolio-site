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

- `src/content/site/index.md` — name, title, positioning statement, summary,
  email, LinkedIn, resume link (all in the frontmatter — no body). Edit this
  first.
- `src/content/about/index.md` — About/leadership page copy, as the markdown
  body ("How I lead" / "Bio" sections).
- `src/content/projects/*.md` — one file per project. Frontmatter holds card
  media + embed URL; the markdown body holds "The problem" / "Role" /
  "Outcome". Editing one of these is a self-contained session.
- `src/content/projects/*.mdx` — same idea, but for a project whose page
  doesn't fit that generic template (see "Custom project layouts" below).

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

- `<Marquee items={[...]} />` — one row of device-shaped assets that scrolls
  slowly and continuously across the full viewport width, looping
  seamlessly (`speed` in px/s, default 20). Every item is drawn at the same
  `height` (default 888px desktop, matching the single-device frames;
  mobile follows the column width), width following its own `aspectRatio`.
  `wired-app.mdx` passes 628px so the frames match the scale of the
  full-screen phones inside its intro video. Corners `radius`
  30px, 48px apart. Videos are muted/looping and only play while visible;
  pauses when scrolled out of view. Put several in the same column wrapper
  to stack rows (48px apart); add `reverse` to a row to scroll it
  left-to-right, so stacked rows read as deliberately contrasting rather
  than slightly out of sync. Used in `wired-app.mdx`.

`AssetFloat` defaults to a 9:16 aspect ratio (most captures are vertical
phone screens) but takes an `aspectRatio` prop for anything else — e.g. a
wide/tall full-page scroll capture — and an `eager` prop for the one video
that should preload immediately (typically whatever's above the fold).

Whichever template is used, `ProjectLayout` wraps the whole page (excluding
Nav/Footer, which stay on the site-wide light theme) in a dark theme — see
`.project-theme` in `ProjectLayout.astro` if that ever needs adjusting.

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
