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

- Cover images/video: drop files in `public/images/<project-slug>/` and
  reference them from that project's frontmatter (`coverImage`, `coverVideo`).
  Until set, the homepage card shows a flat placeholder block instead of a
  broken image.
- Project walkthrough videos: host on YouTube/Vimeo (unlisted) and set
  `embedUrl` in the project's frontmatter to the embed URL — don't commit raw
  video files.

## Deploying

Push to GitHub, then import the repo on [Vercel](https://vercel.com/new) or
[Netlify](https://app.netlify.com/start). Both auto-detect Astro — no config
needed. Every push to `main` redeploys.
