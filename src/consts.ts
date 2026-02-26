import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Frederick\'s Blog',
  description:
    '欢迎来到 Frederick 的博客！这里有生活记录、项目分享、闲聊杂谈，还有文章转载、文章翻译、科技资讯，希望你能在这里找到你想要的内容！',
  href: 'https://blog.ohdragonboi.cn',
  author: 'fenychn0206',
  locale: 'zh-CN',
  featuredPostCount: 2,
  postsPerPage: 5,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/blog',
    label: '文章列表',
  },
  {
    href: '/friends',
    label: '友情链接',
  },
  {
    href: '/about',
    label: '关于我',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/fenychn0206',
    label: 'GitHub',
  },
  {
    href: 'https://twitter.com/wczffL_503',
    label: 'Twitter',
  },
  {
    href: 'mailto:hey@ohdragonboi.cn',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
  {
    href: 'https://travellings.cn/go.html',
    label: 'Travel',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
  Travel: 'lucide:tram-front',
}
