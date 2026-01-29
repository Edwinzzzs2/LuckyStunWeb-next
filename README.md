# LuckyStunWeb-next

基于 Next.js 14 开发的现代个人导航页系统，支持多端自适应、动态数据管理及服务端渲染（SSR）。

## 项目特点

- **响应式设计**：完美适配手机、平板及 PC 端，提供优雅的侧边栏导航和分类视图。
- **服务端渲染 (SSR)**：首页数据在服务端预获取，解决客户端加载白屏和 Mock 数据闪烁问题。
- **管理后台 (Console)**：内置全功能管理后台，支持分类管理、网站管理、用户管理。
- **灵活的数据源**：支持通过 `.env.local` 切换 `mock` 或 `api`（数据库）数据源。
- **救援登录机制**：当管理员修改密码后遗忘时，可通过环境变量配置的密码进行强制登录并同步。

## 快速开始

### 1. 环境配置

在根目录创建 `.env.local` 文件，配置如下关键变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db

# 管理员初始化配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456

# 数据源开关 (mock 或 api)
NEXT_PUBLIC_NAV_DATA_SOURCE=api
```

### 2. 安装与运行

```bash
npm install
npm run dev
```

## 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **数据库**: [PostgreSQL](https://www.postgresql.org/) (pg 驱动)
- **图标**: [Lucide React](https://lucide.dev/) + 阿里图标库
- **鉴权**: JWT + Cookies

## 项目结构

- `/app`: 页面路由与 API 接口
- `/app/console`: 管理后台专属路由
- `/components`: 公用 UI 组件
- `/hooks`: 封装的 React Hooks（数据获取、偏好设置等）
- `/lib`: 核心逻辑库（数据库连接、鉴权工具、导航转换逻辑等）
- `/public`: 静态资源（favicon 等）
