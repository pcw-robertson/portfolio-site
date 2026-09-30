// Reads and parses src/data/case-studies.md at build time — the single
// source of truth for a project page's Opportunity/Role/Outcome/Annotations
// copy, so editing that one file is the only way this text changes (a
// project's .mdx file still owns the structure: grid layout, which Marquee
// rows exist, which asset goes where — just not the words).
//
// The file is a loosely-formatted working draft, not a strict schema, so
// this parser is deliberately permissive about surrounding prose but throws
// clearly if a project or field a page asks for isn't found — silently
// rendering blank copy would defeat the point of a single source of truth.
import fs from "node:fs";
import path from "node:path";

export interface CaseStudyAnnotation {
  title: string;
  body: string;
  quote?: { text: string; citation: string };
}

export interface CaseStudy {
  title: string;
  subtitle: string;
  opportunity: string;
  role: string;
  outcome: string[] | null;
  takeaways: string[] | null;
  annotations: CaseStudyAnnotation[];
}

// Project section titles in case-studies.md don't match the .mdx filenames
// word for word, so map them explicitly rather than guessing at a slug.
const SLUG_BY_TITLE: Record<string, string> = {
  "The Wired App": "wired-app",
  "New Yorker Games — Shuffalo & Catalogues": "new-yorker-games",
  "Bon Appétit App": "bon-appetit-app",
  "Pitchfork Subscription": "pitchfork-subscription",
};

const FILE_PATH = path.resolve(process.cwd(), "src/data/case-studies.md");

let cache: Map<string, CaseStudy> | null = null;

function parseAnnotations(sectionBody: string): CaseStudyAnnotation[] {
  // "Open items" is a to-do list for the draft itself, not page copy.
  const cutIndex = sectionBody.indexOf("**Open items:**");
  const content =
    cutIndex === -1 ? sectionBody : sectionBody.slice(0, cutIndex);

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const annotations: CaseStudyAnnotation[] = [];
  for (const para of paragraphs) {
    // A **Title** starts the paragraph, but its body often sits right on
    // the next line rather than as a separate blank-line-separated block —
    // so match just the leading bold run, not the whole paragraph.
    const titleMatch = para.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/);
    if (titleMatch) {
      annotations.push({
        title: titleMatch[1].trim(),
        body: titleMatch[2].trim(),
      });
      continue;
    }
    const current = annotations[annotations.length - 1];
    if (!current) continue; // stray text before any **Title** — ignore

    const quoteMatch = para.match(/^\*"(.+)"\*\s*—\s*(.+)$/s);
    if (quoteMatch) {
      current.quote = {
        text: quoteMatch[1].trim(),
        citation: quoteMatch[2].trim(),
      };
    } else if (!current.body) {
      current.body = para;
    } else {
      current.body += "\n\n" + para;
    }
  }
  return annotations;
}

function parseBulletList(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function parseProjectBlock(rawBlock: string): CaseStudy {
  const lines = rawBlock.split("\n");
  const title = (lines.shift() ?? "").trim();

  while (lines.length && lines[0].trim() === "") lines.shift();

  let subtitle = "";
  if (lines.length) {
    const m = lines[0].trim().match(/^\*(.+)\*$/);
    if (m) {
      subtitle = m[1].trim();
      lines.shift();
    }
  }

  const body = lines.join("\n");
  const fieldSections = body.split(/\n### /).slice(1);

  let opportunity = "";
  let role = "";
  let outcome: string[] | null = null;
  let takeaways: string[] | null = null;
  let annotations: CaseStudyAnnotation[] = [];

  for (const section of fieldSections) {
    const [headingLine, ...restLines] = section.split("\n");
    const heading = headingLine.trim();
    const content = restLines.join("\n").trim();

    if (heading === "Opportunity") {
      opportunity = content;
    } else if (heading === "Role") {
      role = content;
    } else if (heading === "Outcome") {
      outcome = parseBulletList(content);
    } else if (heading === "Takeaways") {
      takeaways = parseBulletList(content);
    } else if (heading.startsWith("Annotations")) {
      annotations = parseAnnotations(content);
    }
  }

  return { title, subtitle, opportunity, role, outcome, takeaways, annotations };
}

function loadAll(): Map<string, CaseStudy> {
  if (cache) return cache;

  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  const projectBlocks = raw.split(/\n## /).slice(1);

  const bySlug = new Map<string, CaseStudy>();
  for (const block of projectBlocks) {
    const caseStudy = parseProjectBlock(block);
    const slug = SLUG_BY_TITLE[caseStudy.title];
    if (!slug) {
      throw new Error(
        `case-studies.md: no slug mapping for project title "${caseStudy.title}" — add it to SLUG_BY_TITLE in src/lib/case-studies.ts.`,
      );
    }
    bySlug.set(slug, caseStudy);
  }

  cache = bySlug;
  return bySlug;
}

// Returns a project's parsed copy by slug (matching its filename under
// src/content/projects/), or throws if the file doesn't have a matching
// section — a missing/renamed heading in the draft should fail the build
// loudly, not render a blank page.
export function getCaseStudy(slug: string): CaseStudy {
  const caseStudy = loadAll().get(slug);
  if (!caseStudy) {
    throw new Error(
      `case-studies.md: no project section found for "${slug}". Check the ## heading and SLUG_BY_TITLE in src/lib/case-studies.ts still match.`,
    );
  }
  return caseStudy;
}

// Looks up one annotation by its **Bold Title** within a case study, or
// throws — same "fail loudly on drift" reasoning as getCaseStudy.
export function getAnnotation(
  caseStudy: CaseStudy,
  title: string,
): CaseStudyAnnotation {
  const annotation = caseStudy.annotations.find((a) => a.title === title);
  if (!annotation) {
    throw new Error(
      `case-studies.md: no "${title}" annotation found under "${caseStudy.title}". Check the **${title}** heading still matches.`,
    );
  }
  return annotation;
}
