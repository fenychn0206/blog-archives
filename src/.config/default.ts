import type { ThemeConfig } from '~/types'

// This is the default configuration for the template, please do not modify it directly.
// You can override this configuration in the `.config/user.ts` file.

export const defaultConfig: ThemeConfig = {
  site: {
    title: '风的许多故事',
    subtitle: '没有牙齿的小怪兽',
    author: 'Frederick Chen',
    description: '欢迎来到 Frederick 的博客，这里有我的竞赛生涯、APP 推荐、项目分享等内容。希望你能在这里找到你想要的内容。联系我：contact@ohdragonboi.cn',
    website: 'https://ohdragonboi.cn',
    pageSize: 7,
    socialLinks: [
      {
        name: 'github',
        href: 'https://github.com/ToothlessHaveBun',
      },
      {
        name: 'rss',
        href: '/atom.xml',
      },
      {
        name: 'twitter',
        href: 'https://x.com/wczffL_503',
      },
    ],
    navLinks: [
      {
        name: '文章',
        href: '/',
      },
      {
        name: '归档',
        href: '/archive',
      },
      {
        name: '分类',
        href: '/categories',
      },
      {
        name: '关于',
        href: '/about',
      },
      {
        name: '🚇开往',
        href: 'https://www.travellings.cn/go.html',
      }
    ],
    categoryMap: [{ name: '胡适', path: 'hu-shi' }],
    footer: [
      '© %year <a target="_blank" href="%website">%author</a>',
      'PV: <span id="vercount_value_page_pv">Loading</span> | UV: <span id="vercount_value_site_uv">Loading</span>',
      'Powered by <a target="_blank" href="https://astro.build/">Astro</a>.',
    ],
  },
  appearance: {
    theme: 'light',
    locale: 'zh-cn',
    colorsLight: {
      primary: '#2e405b',
      background: '#ffffff',
    },
    colorsDark: {
      primary: '#FFFFFF',
      background: '#232222',
    },
    fonts: {
      header:
        '"HiraMinProN-W6","Source Han Serif CN","Source Han Serif SC","Source Han Serif TC",serif',
      ui: '"LXGW Wenkai","Source Sans Pro","Roboto","Helvetica","Helvetica Neue","Source Han Sans SC","Source Han Sans TC","PingFang SC","PingFang HK","PingFang TC",sans-serif',
    },
  },
  seo: {
    twitter: '@wczffL_503',
    meta: [],
    link: [],
  },
  rss: {
    fullText: true,
  },
  comment: {
  },
  analytics: {
    googleAnalyticsId: '',
    umamiAnalyticsId: '',
  },
  latex: {
    katex: true,
  },
}
