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

- `src/site.config.ts` — name, title, positioning statement, summary, email,
  LinkedIn, resume link. Edit this first.
- `src/content/projects/*.md` — one file per project. Frontmatter holds card
  media + embed URL; the markdown body holds "The problem" / "Role" /
  "Outcome". Editing one of these is a self-contained session.
- `src/pages/about.astro` — About/leadership page copy.
- `src/pages/index.astro`, `src/pages/projects/[id].astro` — homepage and
  project-page templates. Shouldn't need touching often.
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

## Deploying

Push to `main` on GitHub — a GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds the site and deploys it to Bluehost
hosting automatically. See that file for the deploy target and secrets it
expects (`BLUEHOST_HOST`, `BLUEHOST_PORT`, `BLUEHOST_USERNAME`,
`BLUEHOST_SSH_PRIVATE_KEY`, and the `BLUEHOST_DEPLOY_PATH` variable).
