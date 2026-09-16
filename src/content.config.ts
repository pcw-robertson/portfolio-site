import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    // One-line context shown on the homepage card and the project header.
    context: z.string(),
    // Controls homepage grid order (1 = first).
    order: z.number(),
    // Homepage card media: a short muted looping preview, falling back to a still,
    // falling back to a flat placeholder block if neither is set yet.
    coverImage: z.string().optional(),
    coverVideo: z.string().optional(),
    // Unlisted YouTube/Vimeo embed URL for the project page, added once recorded.
    embedUrl: z.string().optional(),
    screenshots: z.array(z.string()).default([]),
    // "default": ProjectLayout renders the standard header/hero/prose/walkthrough
    // scaffold around the body content.
    // "custom": the body (an .mdx file) composes the entire page itself using
    // the grid + AssetFloat/ProjectHero primitives directly — ProjectLayout
    // only supplies the dark theme wrapper and back link.
    // (Named `template`, not `layout` — `layout` is a reserved Astro
    // frontmatter key that auto-imports a layout component and collides
    // with this field.)
    template: z.enum(["default", "custom"]).default("default"),
  }),
});

// Single-document collections — each holds one file, so all site-wide copy
// is a plain markdown file like project pages are, rather than TypeScript
// config or copy hardcoded into a page component. Editing any of these and
// pushing rebuilds and redeploys the site automatically (see
// .github/workflows/deploy.yml) — no separate sync step.
const site = defineCollection({
  loader: glob({ pattern: "index.md", base: "./src/content/site" }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    // A thesis on what you do, not a job title.
    positioningStatement: z.string(),
    // Scope + specialty + what's next. A few sentences, not a full bio.
    summary: z.string(),
    email: z.string(),
    linkedinUrl: z.string(),
    resumeUrl: z.string(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: "index.md", base: "./src/content/about" }),
  // No frontmatter needed — the "How I lead" / "Bio" copy is just the
  // markdown body, rendered as-is (same idea as a project's prose body).
  schema: z.object({}),
});

export const collections = { projects, site, about };
