import { defineConfig } from 'vitepress'

const repo = 'https://github.com/cnaallotey/mailnest'

export default defineConfig({
  title: 'Mailnest',
  description: 'A modern, local email catcher for development. SMTP in, live inbox out.',
  base: '/mailnest/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/mailnest/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#6d5efc' }],
    ['meta', { property: 'og:title', content: 'Mailnest: local email catcher for development' }],
    ['meta', { property: 'og:description', content: 'Point your app at localhost:1025 and every email lands in a live inbox. Open source, MIT licensed.' }],
  ],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'Reference', link: '/reference/cli', activeMatch: '/reference/' },
      { text: 'Roadmap', link: '/roadmap' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Contributing', link: '/guide/contributing' },
          { text: 'Releases', link: `${repo}/releases` },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Connect your app', link: '/guide/connect-your-app' },
          { text: 'Run with Docker', link: '/guide/docker' },
          { text: 'The inbox', link: '/guide/inbox' },
          { text: 'Email checks', link: '/guide/checks' },
          { text: 'Testing with Mailnest', link: '/guide/testing' },
          { text: 'Release to a real inbox', link: '/guide/release' },
          { text: 'Security', link: '/guide/security' },
          { text: 'Contributing', link: '/guide/contributing' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI and environment', link: '/reference/cli' },
          { text: 'REST API', link: '/reference/api' },
          { text: 'Webhooks', link: '/reference/webhooks' },
          { text: 'JavaScript client', link: '/reference/client' },
        ],
      },
      {
        text: 'Project',
        items: [
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: repo }],
    editLink: { pattern: `${repo}/edit/main/website/:path`, text: 'Edit this page on GitHub' },
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Mailnest contributors',
    },
  },
})
