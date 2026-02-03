import { defineConfig } from 'vitepress';

const base = '/';
const siteUrl = 'https://claude.on.auto';

export default defineConfig({
  base,
  lang: 'en-US',
  title: 'Claude Auto',
  description: 'Stop Babysitting. Start Parallelizing. True automation with quality guarantees.',
  appearance: 'dark',

  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },
    nav: [
      {
        text: 'Documentation',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Installation', link: '/installation' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Hooks Guide', link: '/hooks-guide' },
          { text: 'Reminders Guide', link: '/reminders-guide' },
          { text: 'Validators Guide', link: '/validators-guide' },
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
      { text: 'The Quality Stack', link: '/ketchup-technique' },
      { text: 'Origin Story', link: '/origin-story' },
      {
        text: 'GitHub',
        link: 'https://github.com/BeOnAuto/claude-auto',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Installation', link: '/installation' },
        ],
      },
      {
        text: 'The Quality Stack',
        items: [
          { text: 'Methodology', link: '/ketchup-technique' },
          { text: 'Origin Story', link: '/origin-story' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Hooks', link: '/hooks-guide' },
          { text: 'Reminders', link: '/reminders-guide' },
          { text: 'Validators', link: '/validators-guide' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/configuration' },
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/BeOnAuto/claude-auto/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/BeOnAuto/claude-auto' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2025 BeOnAuto, Inc.',
    },
  },

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        href: `${base}favicon-96x96.png`,
        sizes: '96x96',
      },
    ],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['link', { rel: 'shortcut icon', href: `${base}favicon.ico` }],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `${base}apple-touch-icon.png`,
      },
    ],
    ['link', { rel: 'manifest', href: `${base}site.webmanifest` }],
    [
      'meta',
      {
        property: 'og:title',
        content: 'Claude Auto - Stop Babysitting. Start Parallelizing.',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'True automation with quality guarantees. Claude Auto + Git Worktrees = 5-10x productivity. From Babysitter to Bionic.',
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: siteUrl,
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: `${siteUrl}/og-image.png`,
      },
    ],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    [
      'meta',
      {
        property: 'og:image:alt',
        content: 'Claude Auto - Stop Babysitting. Start Parallelizing.',
      },
    ],
    ['meta', { property: 'og:site_name', content: 'Claude Auto' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'meta',
      {
        name: 'twitter:title',
        content: 'Claude Auto - Stop Babysitting. Start Parallelizing.',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          'AI-assisted coding made you a babysitter. Claude Auto makes you Bionic. Supervisor AI validates commits. Auto-continue keeps going. Git worktrees multiply. 5-10 features/week.',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${siteUrl}/og-image.png`,
      },
    ],
  ],
});
