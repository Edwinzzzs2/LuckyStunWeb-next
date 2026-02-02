import type { MenuGroup, Section } from '@/data/navigation/types'

export const SITE_ICON_PLACEHOLDER = 'https://web.example.top:18580/assets/images/favicon.png'

export const demoSections: Section[] = [
  {
    id: 'fav',
    name: '常用推荐',
    icon: 'icon-changyongfuwu',
    sites: [
      {
        title: '导航后台管理',
        desc: '管理导航网址、添加/删除、分类等',
        logo: SITE_ICON_PLACEHOLDER,
        url: 'https://example.com/console',
        backup_url: 'https://backup.example.com/console',
        internal_url: 'http://192.168.1.2:3000/console',
      },
      {
        title: 'web导航',
        desc: '导航站本体站',
        logo: SITE_ICON_PLACEHOLDER,
        url: 'https://example.com',
        backup_url: 'https://backup.example.com',
        internal_url: 'http://192.168.1.2:3000',
      },
    ],
  },
  {
    id: 'docker',
    name: 'Docker 应用',
    icon: 'icon-docker',
    sites: [
      {
        title: 'memos',
        desc: 'memos 便签式笔记',
        logo: SITE_ICON_PLACEHOLDER,
        url: 'https://memos.example.com',
        internal_url: 'http://192.168.1.10:5230',
      },
      {
        title: 'lucky反代',
        desc: '反向代理神器',
        logo: SITE_ICON_PLACEHOLDER,
        url: 'https://lucky.example.com',
        internal_url: 'http://192.168.1.10:16601',
      },
      {
        title: 'qbit下载',
        desc: '下载器管理',
        logo: SITE_ICON_PLACEHOLDER,
        url: 'https://qbit.example.com',
        internal_url: 'http://192.168.1.10:8081',
      },
    ],
  },
  {
    id: 'media',
    name: '媒体资讯',
    icon: 'icon-yuedu',
    sites: [
      { title: 'Hacker News', desc: '科技资讯与讨论', logo: SITE_ICON_PLACEHOLDER, url: 'https://news.ycombinator.com' },
      { title: 'Reddit', desc: '社区论坛与内容聚合', logo: SITE_ICON_PLACEHOLDER, url: 'https://www.reddit.com' },
      { title: 'Product Hunt', desc: '发现优秀产品', logo: SITE_ICON_PLACEHOLDER, url: 'https://www.producthunt.com' },
    ],
  },
  {
    id: 'ai',
    name: 'AI工具包',
    icon: 'icon-jishufuwu',
    sites: [
      { title: 'ChatGPT', desc: '智能对话与写作助手', logo: SITE_ICON_PLACEHOLDER, url: 'https://chat.openai.com' },
      { title: 'Claude', desc: '高质量对话与长文本理解', logo: SITE_ICON_PLACEHOLDER, url: 'https://claude.ai' },
      { title: 'Gemini', desc: 'Google 生成式 AI 助手', logo: SITE_ICON_PLACEHOLDER, url: 'https://gemini.google.com' },
    ],
  },
]

export const demoMenuGroups: MenuGroup[] = [
  {
    label: '导航',
    items: [
      { id: 'fav', label: '常用推荐', icon: 'icon-changyongfuwu', sectionId: 'fav' },
      { id: 'docker', label: 'Docker 应用', icon: 'icon-docker', sectionId: 'docker' },
      {
        id: 'tools',
        label: '开发者工具',
        icon: 'icon-daohang2',
        children: [
          { id: 'media', label: '媒体资讯', sectionId: 'media' },
          { id: 'ai', label: 'AI工具包', sectionId: 'ai' },
        ],
      },
    ],
  },
  {
    label: '系统',
    items: [{ id: 'console', label: '进入控制台', icon: 'icon-tuchuangguanli', action: 'console' }],
  },
]

