export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  ssr: false,
  devtools: { enabled: false },
  app: { head: { title: 'Mailnest', link: [{ rel: 'icon', href: '/favicon.svg' }] } },
  css: ['~/assets/main.css'],
  nitro: { experimental: { asyncContext: false } },
})
