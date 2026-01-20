import { defineConfig } from 'vitepress';

const env = process.env.NODE_ENV;

export default defineConfig({
  base: env === 'production' ? '/claude-ketchup/' : '/',
  lang: 'en-US',
  title: 'Claude Ketchup',
  description: 'Husky-style hooks and skills for Claude Code, implementing the Ketchup Technique',

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
    ['meta', { property: 'twitter:card', content: 'summary_large_image' }],
  ],
});
