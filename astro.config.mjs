// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Used for canonical and social-share URLs.
  site: 'https://peter-robertson.co.uk',
  integrations: [mdx()],
});
