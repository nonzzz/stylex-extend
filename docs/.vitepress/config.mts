import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/stylex-extend/',
  title: 'stylex-extend',
  description: 'An unoffical stylexjs experimental project',
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Guide', link: '/guide/reference', activeMatch: '/guide/' },
      { text: 'Integrations', link: '/integrations/overflow', activeMatch: '/integrations/' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Reference', link: '/guide/reference' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'APIs', link: '/guide/api' }
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Overflow', link: '/integrations/overflow' },
          { text: 'Vite', link: '/integrations/vite' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/nonzzz/stylex-extend' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Kanno'
    },
    lastUpdated: {
      text: 'Last Modified',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    }
  },
  vite: {
    plugins: [
      groupIconVitePlugin()
    ]
  }
})
