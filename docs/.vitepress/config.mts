import { defineConfig } from 'vitepress';

const env = process.env.NODE_ENV;

export default defineConfig({
  base: env === 'production' ? '/claude-ketchup/' : '/',
  lang: 'en-US',
  title: 'Claude Ketchup',
  description: 'Husky-style hooks and skills for Claude Code, implementing the Ketchup Technique',
  appearance: 'dark',

  themeConfig: {
    logo: '/logo.png',
    nav: [
      {
        text: 'Documentation',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Hooks Guide', link: '/hooks-guide' },
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
      { text: 'The Technique', link: '/ketchup-technique' },
      { text: 'Origin Story', link: '/origin-story' },
      {
        text: 'GitHub',
        link: 'https://github.com/BeOnAuto/claude-ketchup',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'The Ketchup Technique',
        items: [
          { text: 'Methodology', link: '/ketchup-technique' },
          { text: 'Origin Story', link: '/origin-story' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Hooks Guide', link: '/hooks-guide' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/BeOnAuto/claude-ketchup/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BeOnAuto/claude-ketchup' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2025 Sam Hatoum',
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['meta', { property: 'og:title', content: 'Claude Ketchup' }],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Husky-style hooks and skills for Claude Code, implementing the Ketchup Technique',
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: 'https://BeOnAuto.github.io/claude-ketchup',
      },
    ],
    ['meta', { property: 'og:image', content: 'https://beonauto.github.io/claude-ketchup/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'Claude Ketchup - Controlled Bursts for Claude Code' }],
    ['meta', { property: 'og:site_name', content: 'Claude Ketchup' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Claude Ketchup' }],
    ['meta', { name: 'twitter:description', content: 'Husky-style hooks and skills for Claude Code, implementing the Ketchup Technique' }],
    ['meta', { name: 'twitter:image', content: 'https://beonauto.github.io/claude-ketchup/og-image.png' }],
  ],
});
