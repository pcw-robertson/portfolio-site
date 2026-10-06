// How each project appears as a full-screen "screen" in the stacked project
// list (see ProjectStack.astro): on the home page and at the foot of every
// case study. Wired uses the device reveal from its case study; the others
// fill the frame with their hero; anything not listed becomes a flat
// placeholder screen.
export interface ScreenConfig {
  mode: "fill" | "device" | "none";
  src?: string;
  poster?: string;
  background?: string;
}

const wiredGradient = "linear-gradient(to bottom right, #2a1fff, #9a0bff)";

const screens: Record<string, ScreenConfig> = {
  "wired-app": {
    mode: "device",
    src: "/videos/wired-nav-zoom.mp4",
    poster: "/videos/wired-nav-zoom-poster.jpg",
    background: wiredGradient,
  },
  "new-yorker-games": {
    mode: "fill",
    src: "/videos/new-yorker-games-hero-large.mp4",
    poster: "/videos/new-yorker-games-hero-large-poster.jpg",
    background: "#ffe27f",
  },
  "bon-appetit-app": {
    mode: "fill",
    src: "/videos/ba-hero.mp4",
    poster: "/videos/ba-hero-poster.jpg",
    background: "#000000",
  },
  "pitchfork-subscription": {
    mode: "fill",
    src: "/videos/pitchfork-hero-large.mp4",
    poster: "/videos/pitchfork-hero-large-poster.jpg",
  },
};

const placeholder: ScreenConfig = { mode: "none", background: "#2b2b29" };

export function screenFor(projectId: string): ScreenConfig {
  return screens[projectId] ?? placeholder;
}
