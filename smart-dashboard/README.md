# Smart Dashboard｜团队研发数据智能看板 + AI Copilot

一个可视化展示团队研发活动的仪表盘：**提交（Commits）、Pull Requests、成员表现、活跃度热力图** 一屏尽览。
右下角内嵌 **Smart Commits AI Copilot**：自然语言提问 → 流式回答 → 自动调工具查数据 → 自动画柱状图。

> 🌐 **线上演示地址**：https://smart-dashboard-swart.vercel.app/
> 手机、平板、电脑浏览器均可直接打开，无需登录。
> 📽️ **30 秒 Demo**：`docs/demo.mp4`（首次 clone 后本地录制，见文末"交付材料"节）

---

## 📖 一、内容简介 / 作用

Smart Dashboard 是一个面向研发团队 Leader / PM / 工程师的**只读型数据看板**，用于快速回答以下问题：

- 本周团队一共合并了多少 PR？主要类型分布如何（feat / fix / chore / docs …）？
- 每位成员最近的提交量、代码增删量、活跃时段？
- 哪些 PR 停留时间过长、需要跟进 Review？
- 一周中哪些时段是团队的高产出时段（热力图）？

项目包含 4 个主要页面：

| 页面 | 路径 | 主要内容 |
|------|------|----------|
| 总览 Overview | `/` | 关键指标卡片、提交趋势、PR 类型饼图、周活跃热力图 |
| 提交 Commits | `/commits` | 全量提交列表，可按作者 / 类型筛选 |
| PR 列表 | `/prs` | 所有 Pull Request 及状态、耗时；点击进详情页 |
| 成员 Members | `/members` | 所有成员卡片，点击查看个人详情 |

Dashboard 使用 **内置的模拟数据（mock data）** 演示，尚未接入真实 GitHub/GitLab API。
右下角 **AI Copilot** 支持两种运行模式（见 §六）：
- **真实模型模式**（默认）：填 `OPENAI_API_KEY` 后接入 OpenAI / 阿里百炼 / DeepSeek 等；
- **Mock 演示模式**：`MOCK_MODE=1` 走内置剧本，不消耗任何 Key，也无需网络。

---

## 🛠 二、技术栈

### 核心框架
- **[Next.js 16](https://nextjs.org/)**（App Router 架构）—— 支持 **服务端渲染（SSR）** 与静态化
- **[React 19](https://react.dev/)** —— UI 库
- **[TypeScript 5](https://www.typescriptlang.org/)** —— 类型安全

### 样式与 UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** —— 原子化 CSS
- **[shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/)** —— 无样式可组合组件
- **[lucide-react](https://lucide.dev/)** —— 图标库
- **tw-animate-css / tailwind-merge / clsx / class-variance-authority** —— 样式增强

### 数据可视化
- **[Recharts 3](https://recharts.org/)** —— 图表库（饼图 / 折线图 / 热力图 / Copilot 柱状图）
- **[date-fns 4](https://date-fns.org/)** —— 日期处理

### AI Copilot
- **[Vercel AI SDK 5](https://ai-sdk.dev/)** —— `streamText` / `useChat` / `tool`，SSE 流式对话
- **[@ai-sdk/openai](https://ai-sdk.dev/providers/ai-sdk-providers/openai)** —— 通过 `openaiProvider.chat()` 强制走 `/chat/completions`，兼容阿里百炼 compatible-mode / DeepSeek
- **[Zod 4](https://zod.dev/)** —— 工具入参 Schema
- **[react-markdown + remark-gfm](https://github.com/remarkjs/react-markdown)** —— 流式 Markdown 渲染

### 部署与工程
- **[Vercel](https://vercel.com/)** —— 一键部署、自动 CI/CD
- **[pnpm](https://pnpm.io/)** —— 高效包管理器
- **ESLint 9** —— 代码规范

---

## 🚀 三、本地一分钟运行（复制两行命令）

> 前置条件：已安装 [Node.js ≥ 20](https://nodejs.org/) 和 [pnpm](https://pnpm.io/installation)（`npm i -g pnpm`）。

```bash
git clone https://github.com/liusj1018/smart-dashboard.git && cd smart-dashboard/smart-dashboard && pnpm install
cp .env.example .env.local        # 首次运行必需；填入你的 AI Key，或保留 MOCK_MODE=1 走演示模式
pnpm dev
```

启动后打开浏览器访问 👉 **http://localhost:3000**，点右下角气泡即可打开 Copilot。

如果你没装 pnpm，也可以用 npm：

```bash
git clone https://github.com/liusj1018/smart-dashboard.git && cd smart-dashboard/smart-dashboard && npm install
npm run dev
```

### 其它常用命令

```bash
pnpm build   # 构建生产版本
pnpm start   # 以生产模式启动（需先 build）
pnpm lint    # 运行 ESLint 检查
```

---

## 🖥 四、服务端 vs. 浏览器交互 —— 哪些在哪里跑？

Next.js 采用**混合渲染**架构，理解每部分在哪执行有助于调试和优化。

### 🖧 服务端执行（Node.js / Vercel Serverless）

以下代码运行在**服务器**上，用户浏览器看不到：

| 内容 | 位置 | 说明 |
|------|------|------|
| 页面首次 HTML 渲染 | `src/app/**/page.tsx`（React Server Components）| 首屏 SSR，返回已渲染的 HTML |
| 模拟数据加载 | `src/lib/data.ts` | 目前是内置常量，未来若换成真实 API 请求，将在服务端发起 |
| API 调试路由 | `src/app/api/debug/route.ts` | 部署后的接口，以 `/api/debug` 访问 |
| 布局壳 | `src/app/(dashboard)/layout.tsx` | 服务端渲染的整体布局与导航 |
| 加载 / 错误占位 | `loading.tsx` / `error.tsx` | Next.js 特殊约定文件，服务端首次渲染时使用 |

**服务端的好处**：
- 首屏更快（用户拿到的直接是 HTML，不用等 JS 下载执行）
- SEO 友好
- 敏感逻辑（未来的 API Key、数据库查询）不暴露给浏览器

### 🌐 浏览器交互执行（Client-side）

以下代码运行在**用户浏览器**里，负责所有交互体验：

| 内容 | 位置 | 说明 |
|------|------|------|
| 图表交互 | `src/components/charts/*.tsx`（含 `"use client"`）| 鼠标悬停 tooltip、图例点击、动画等 |
| 侧边栏导航 | `src/components/layout/sidebar.tsx` | 高亮当前页、折叠展开 |
| 错误重试按钮 | `src/components/ui/error-retry.tsx` | 点击后重新拉数据 |
| 路由跳转 | Next.js `<Link>` | 首次进入是 SSR，之后页面切换走客户端软路由 |
| 响应式布局 / 手机适配 | Tailwind 断点类 | 浏览器根据窗口宽度自动切换布局 |

### 📐 完整请求流程示意

```
用户访问 https://smart-dashboard-swart.vercel.app/commits
        │
        ▼
┌─────────────────────────────────────────────┐
│  Vercel 边缘节点收到请求                    │
│  ─────────────────────────                  │
│  1) 服务端运行 page.tsx (RSC) 拉取数据      │  ← 服务端
│  2) 生成 HTML + 序列化后的初始状态          │
│  3) 返回给浏览器                            │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  浏览器接收                                 │
│  ─────────────────                          │
│  4) 立即显示 HTML（首屏无白屏）              │
│  5) 下载 JS，React "水合"（hydrate）        │  ← 客户端
│  6) 图表可交互、按钮可点、路由可切换        │
└─────────────────────────────────────────────┘
```

---

## 📂 项目结构

```
smart-dashboard/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # 主要页面路由分组
│   │   │   ├── page.tsx          # 总览首页
│   │   │   ├── commits/          # 提交列表
│   │   │   ├── prs/              # PR 列表 + 详情
│   │   │   └── members/          # 成员列表 + 详情
│   │   └── api/debug/            # 服务端 API 路由
│   ├── components/
│   │   ├── charts/               # 图表组件（客户端）
│   │   ├── layout/               # 布局组件
│   │   └── ui/                   # 基础 UI（按钮、骨架屏等）
│   ├── lib/
│   │   ├── data.ts               # 模拟数据源
│   │   └── utils.ts              # 工具函数
│   └── types/                    # TypeScript 类型定义
├── public/                       # 静态资源
├── next.config.ts                # Next.js 配置
├── tailwind.config / postcss     # 样式配置
└── package.json
```

---

## 🤖 六、AI Copilot 使用说明

### 6.1 交互形态
- **入口**：所有页面右下角固定悬浮气泡（`fixed bottom-6 right-6 z-50`），无侵入
- **面板**：点击后从右侧滑出 Drawer，聊天区 + 输入框 + 停止按钮
- **能力**：
  1. **流式对话**：SSE 打字机效果，逐 token 输出
  2. **自动调工具**：`queryCommits` 查提交、`queryStats` 查分组统计
  3. **自动画图**：当 `queryStats` 返回带 `chart` 字段时，卡片下自动挂 Recharts 柱状图
  4. **一键停止**：点停止按钮 → 前端 `useChat().stop()` + 服务端 `req.signal` 双向中断
  5. **全中文兜底**：网络/超时/401/429/额度超限/工具失败 每类都有独立中文文案

### 6.2 试试这些问题
| 场景 | 输入 | 期望结果 |
|---|---|---|
| 纯对话 | `你好，你是谁？` | 逐字流式回答 |
| 单工具 | `查李默的提交` | 出现"正在调用 queryCommits…"卡片 → 中文总结 |
| 图表 | `展示各类型提交分布` | 出现柱状图 + 中文解读 |
| 停止 | 任意长回答生成中点停止按钮 | 立即停下，出现琥珀色"已停止生成 / 继续" |

### 6.3 两种运行模式

| 模式 | 触发条件 | 用途 |
|---|---|---|
| **真实模型** | `MOCK_MODE` 未设置或 `=0`，且 `OPENAI_API_KEY` 有值 | 生产 / 面试 Demo，接入真实大模型 |
| **Mock 演示** | `MOCK_MODE=1` | 首次 clone 后零成本预览；AI 服务停摆 / 断网时的兜底演示 |

Mock 模式下 `/api/chat` 会走内置剧本，命中关键字（"提交"、"分布"、"报错"）返回预置的工具调用 + 图表数据，前端渲染路径与真实模式完全一致，因此可以只做前端演示。

---

## ⚙️ 七、环境变量说明

完整模板见 [`.env.example`](./.env.example)。**所有变量都只在服务端读取，绝不加 `NEXT_PUBLIC_` 前缀**（红线 1）。

| 变量 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅（除非 `MOCK_MODE=1`）| — | 大模型服务凭证，仅 `src/lib/ai/**` 和 `src/app/api/chat/route.ts` 读取 |
| `OPENAI_BASE_URL` | ⬜ | OpenAI 官方 | 兼容层地址；国内推荐阿里百炼 / DeepSeek，见 `.env.example` 内注释 |
| `OPENAI_MODEL` | ⬜ | `gpt-4o-mini` | 模型 ID；换兼容层时必须同步改（如 `qwen-plus` / `deepseek-chat`） |
| `MOCK_MODE` | ⬜ | `0` | `1` = 强制走内置演示剧本，不消耗 Key、不需网络 |

### 快速切换示例

```bash
# ① 走 OpenAI 官方
OPENAI_API_KEY=sk-xxx

# ② 走阿里百炼（推荐国内使用）
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-plus

# ③ 走 DeepSeek
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# ④ 无 Key / 离线演示
MOCK_MODE=1
```

---

## ☁️ 八、部署到 Vercel

1. **导入项目**：在 Vercel 控制台 → New Project → 选中本仓库 → Root Directory 选 `smart dashboard/smart-dashboard`
2. **配置环境变量**（Settings → Environment Variables，作用域勾选 Production / Preview / Development）：

   | Name | Value | Sensitive |
   |---|---|---|
   | `OPENAI_API_KEY` | 你的真实 Key | ✅ 必勾 |
   | `OPENAI_BASE_URL` | （可选）兼容层地址 | ⬜ |
   | `OPENAI_MODEL` | （可选）模型 ID | ⬜ |

3. **无需改任何代码**：`app/api/chat/route.ts` 顶部已声明 `export const maxDuration = 60`，Vercel Serverless 会自动应用 60 秒超时上限（Hobby 计划最高 60s，够用）。
4. **触发部署**：push 到 `main` 分支即自动构建，1-2 分钟出线上 URL。
5. **上线自测**：按 [`agent.md` §8 对照检查表](../../agent.md#8-对照检查表交付前通扫) 的 7 项在生产 URL 逐条过一遍。

> ⚠️ **不要**把 `OPENAI_API_KEY` 直接写进代码或 push 到仓库。`.gitignore` 已屏蔽所有 `.env*`（`.env.example` 例外）。

---

## ❓ 九、常见问题（FAQ）

### Q1: 打开页面，Copilot 显示"演示模式"提示，怎么切换到真实模型？
把 `.env.local` 里的 `MOCK_MODE` 改为 `0`（或删除该行），并确保 `OPENAI_API_KEY` 已填写。Next.js dev server 会自动 reload 环境变量，无需重启；生产环境需在 Vercel 后台改环境变量并 redeploy。

### Q2: 报错 `getaddrinfo ENOTFOUND xxx.aliyuncs.com` 或 `Failed after 2 attempts`
你的 `OPENAI_BASE_URL` 域名在当前网络下无法解析。三种解决方式：
1. 换成能连通的兼容层地址（如 DeepSeek 或 Cloudflare Worker 代理）
2. 检查是否需要走公司 VPN / 代理
3. 临时设 `MOCK_MODE=1` 回退到演示模式，先跑通 UI

### Q3: 生产 Vercel 报 `maxDuration` 超限？
Hobby 计划单函数超时 60s。本项目已经卡在这条线上；若你需要更长上下文，需升级 Pro 计划并把 `route.ts` 里的 `maxDuration` 调至 `300`。

### Q4: 前端能不能直接调 OpenAI？
**绝对不行**（红线 1）。Key 一旦下发前端就会被抓包泄漏。所有对模型的调用都必须走 `/api/chat` 服务端路由。

### Q5: 停止按钮点了没反应？
检查两点：① 前端 `chat-panel.tsx` 的按钮是否调了 `useChat().stop()`；② 服务端 `route.ts` 里 `streamText` 是否传入了 `abortSignal: req.signal`。两者缺一不可（红线 3）。

### Q6: 我想接入真实 GitHub API 而不是 mock data？
改 `src/lib/data.ts` 里的 `getCommits()` / `getStats()` 实现即可，函数签名保持不变，Copilot 的工具层无需改动。建议先加 in-memory cache 避免刷爆 API rate limit。

---

## 📦 十、交付材料

| 材料 | 位置 | 说明 |
|---|---|---|
| 规格书 | [`../Sepc.md`](../Sepc.md) | Spec v2，唯一权威规格 |
| Agent 手册 | [`../../agent.md`](../../agent.md) | 六阶段施工清单 + 红线 + 对照检查表 |
| 环境变量模板 | [`.env.example`](./.env.example) | 拷贝为 `.env.local` |
| Demo 视频 | `docs/demo.mp4`（30s 内） | 录制流程见 agent.md §S6 |
| 线上地址 | https://smart-dashboard-swart.vercel.app/ | push 到 `main` 后 Vercel 自动 redeploy（约 1-2 分钟） |
| GitHub 仓库 | https://github.com/liusj1018/smart-dashboard | — |

---

## 📄 License

MIT © 2025 liusj1018