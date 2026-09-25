// Plays each opted-in video only while it's scrolled into view and pauses it
// otherwise, instead of every video autoplaying on page load. Shared by every
// component that renders such videos (opt in with `data-autoplay-in-view`).
const videos = document.querySelectorAll<HTMLVideoElement>(
  "video[data-autoplay-in-view]",
);

if (videos.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.25 },
  );

  for (const video of videos) {
    observer.observe(video);
  }
}
