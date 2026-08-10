# CLAUDE.md — Smart Dashboard 项目规范文件

> 本文件基于项目根目录 `Spec.md` 现场生成，为 Smart Dashboard 项目的 AI 协作与开发规范。
> 项目定位：将 Smart Commit Helper CLI 产出的"隐形规范"转化为可视化的团队工程效能看板。

---

## 一、项目概述

- **项目名称**：Smart Dashboard
- **交付周期**：限时 1 天独立交付挑战
- **项目背景**：Smart Commit Helper CLI 已成为团队标配，Lead 洞察到需求升级——将"隐形规范"转化为可视化工程效能看板，让协作透明化、数据化。
- **核心能力**：
  1. Commit 类型分布统计（feat / fix / chore / docs 聚合）
  2. PR 实时评审状态追踪（待审 / 已批 / 已合并）
  3. 成员周提交热力图与活跃度
  4. Plan Mode 任务完成度自动核算
- **路由结构**：
  - `/` 项目首页（RSC）
  - `/dashboard` 总览四张核心指标卡（RSC）
  - `/dashboard/commits` 提交记录 + 类型分布图（RSC + Client）
  - `/dashboard/members/[id]` 成员详情 + 周热力图（RSC + Client）
- **最终交付物**：Vercel Preview URL、完整源码仓库、本 CLAUDE.md 研发文档。

---

## 二、技术栈约束

| 分类 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 14+ | 必须使用 App Router，禁止使用 Pages Router |
| 语言 | TypeScript | 必须开启 strict 模式 |
| 样式 | Tailwind CSS v4+ | 优先使用工具类，避免写自定义 CSS |
| 组件库 | shadcn/ui | 优先使用官方组件，避免造轮子 |
| 图表 | Recharts | 仅可在 Client 组件中使用 |
| 状态管理 | 优先 RSC | 必要时使用 Zustand，禁止引入 Redux |
| 数据获取 | RSC async/await | 禁止 SWR / React Query 等取数库 |
| 包管理 | pnpm | 统一 lockfile，禁止混用 npm / yarn |
| 部署 | Vercel | 通过 GitHub 集成自动构建 |

---

## 三、目录结构与文件命名约定

```
smart-dashboard/
├── app/
│   ├── layout.tsx
│   ├── loading.tsx           # 全局加载兜底
│   ├── error.tsx             # 全局错误兜底
│   ├── page.tsx              # 首页
│   └── dashboard/
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       ├── page.tsx          # /dashboard 总览
│       ├── commits/
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   └── page.tsx
│       └── members/[id]/
│           ├── loading.tsx
│           ├── error.tsx
│           └── page.tsx
├── components/
│   ├── ui/                   # shadcn/ui 生成组件
│   ├── charts/               # 图表 Client 组件
│   └── dashboard/            # 业务组件
├── lib/
│   ├── data.ts               # 唯一数据源
│   └── utils.ts
├── types/index.ts            # 全局类型定义
├── .env.local                # 本地环境变量（.gitignore）
└── .env.example              # 变量模板（入库）
```

**文件命名约定**：
- 文件夹：kebab-case，例：`member-heatmap/`
- React 组件文件：PascalCase.tsx，例：`CommitTypePieChart.tsx`
- 工具/数据文件：camelCase.ts，例：`data.ts`、`formatDate.ts`
- 路由文件：Next.js 约定名（`page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx`）

---

## 四、核心代码铁律 ⚔️

> 以下为**硬性红线**，违反即打回。

1. 🔴 **`"use client"` 全项目不超过 3 个**。预算分配：
   - `components/charts/CommitTypePieChart.tsx`
   - `components/charts/MemberHeatmap.tsx`
   - 预留 1 个（如全局主题切换按钮）
2. 🔴 **禁止用 `useEffect` 拉数据**。所有数据获取必须走 RSC 的 `async/await` + `lib/data.ts`，杜绝瀑布加载与页面闪烁。
3. 🔴 **数据源唯一**：业务数据只允许从 `lib/data.ts` 读取，禁止组件内直接 `fetch('/api/...')`；需要交互写入时使用 Server Actions。
4. 🔴 **TypeScript strict**：禁止 `any` / `@ts-ignore` / 未处理类型报错。
5. 🔴 **`"use client"` 下沉原则**：客户端指令只能出现在叶子组件，禁止在页面根节点声明。
6. 🔴 **图表懒加载**：Recharts 组件必须通过 `next/dynamic` + `ssr: false` 引入服务端页面。

---

## 五、命名规范

| 类型 | 规则 | 示例 |
| --- | --- | --- |
| 文件夹 | kebab-case | `member-heatmap/` |
| 组件文件 | PascalCase.tsx | `CommitTypePieChart.tsx` |
| 工具/数据文件 | camelCase.ts | `data.ts` |
| React 组件 | PascalCase | `OverviewCard` |
| Hook | `use` + camelCase | `useCommitFilter` |
| 常量 | UPPER_SNAKE_CASE | `MAX_COMMIT_LIMIT` |
| 类型/接口 | PascalCase，不加 `I` 前缀 | `type Commit` |
| Server Action | 动词开头 camelCase | `approvePullRequest` |
| CSS 类 | 优先 Tailwind class | `className="flex gap-4"` |

导入顺序约定：**外部依赖 → `@/` 别名 → 相对路径 → 样式文件**；组件使用默认导出，工具函数使用具名导出。

---

## 六、Git 协作与提交规范

- **分支模型**：
  - `main`：生产分支，受保护，仅通过 PR 合入。
  - `dev`：日常集成分支。
  - 功能：`feat/<scope>`；修复：`fix/<scope>`；文档：`docs/<scope>`。
- **Conventional Commits 格式**：`<type>(<scope>): <subject>`
  - type：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `build` / `ci`
  - subject：祈使句、≤ 50 字符、末尾不加句号
  - 示例：`feat(dashboard): add overview four-card layout`
- **PR 规则**：
  - PR 标题遵循 Conventional Commits
  - 描述必含：背景 / 变更点 / UI 截图 / 自测清单
  - 单 PR ≤ 400 行 diff，超出请拆分
  - 合并策略：`Squash and merge`

---

## 七、用户体验与性能指标

### 7.1 路由兜底（**硬性**）

🔴 **每个路由必须提供 `loading.tsx` 和 `error.tsx`**。清单如下：

- `app/loading.tsx` / `app/error.tsx`
- `app/dashboard/loading.tsx` / `app/dashboard/error.tsx`
- `app/dashboard/commits/loading.tsx` / `error.tsx`
- `app/dashboard/members/[id]/loading.tsx` / `error.tsx`

`loading.tsx` 统一使用 shadcn/ui 的 `Skeleton`，防止布局抖动；`error.tsx` 必须为 Client 组件（框架强制约定），但**不计入 `"use client"` 预算**。

### 7.2 性能预算

| 指标 | 目标 |
| --- | --- |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| 首页 JS gzip | < 120KB |
| Lighthouse Performance | ≥ 90 |

### 7.3 优化手段

- 图片统一 `next/image`，配置 `sizes`、`priority`。
- 图表懒加载：`dynamic(() => import('...'), { ssr: false })`。
- 缓存策略：静态 `cache: 'force-cache'`，动态 `revalidate: 60`。

---

## 八、环境变量与安全

- **文件规范**：
  - `.env.local`：本地开发变量，**必须加入 `.gitignore`**。
  - `.env.example`：入库，仅保留变量名与占位说明。
- **前缀规范**：
  - 服务端专用：无前缀，例 `DATABASE_URL`、`GITHUB_TOKEN`。
  - 客户端可读：必须 `NEXT_PUBLIC_` 前缀，例 `NEXT_PUBLIC_APP_NAME`。
- **访问方式**：仅允许 `process.env.XXX`，禁止字符串拼接注入。
- **安全底线**：
  - Secrets 严禁写入代码、提交历史、前端 bundle。
  - 一旦泄露：立刻在 Vercel 后台 rotate + 使用 `git filter-repo` 清理历史。
  - 三方 API Key 一律在 RSC / Server Action 中调用，不暴露到客户端。

---

## 九、AI 协作约定

- 🔴 **改 3 个以上文件前，必须先出 Plan**：AI（Cline / Claude / Copilot 等）需先在对话中输出「文件清单 + 变更目的 + 影响面 + 回滚策略」，经用户明确确认后再进入编辑阶段。
- **一次一步（One Step at a Time）**：每完成一个 Step，运行 `pnpm tsc --noEmit` + `pnpm build` 验证再进入下一步。
- **优先 RSC**：默认 Server Component，仅在必要交互处抽出 Client 子组件。
- **禁止扩权**：不新增第三方数据源，不引入 SWR / React Query 等取数库，不修改 §四 的红线。
- **提交纪律**：遵循 §六 的 Conventional Commits，每次提交聚焦一件事。
- **越界即停**：AI 若发现即将违反 §四 的红线，立刻停止编辑并向用户报告，等待人工确认后再继续。

---

## 十、常见已踩坑记录 🐛

- 🐛 **Recharts 必须在 `"use client"` 里用，否则报 `window is not defined`**。图表组件文件顶部必须写明：
  ```tsx
  "use client";
  import { PieChart, Pie, ResponsiveContainer } from "recharts";
  ```
  若要在服务端页面内嵌入图表，请配合 `next/dynamic` + `ssr: false`：
  ```tsx
  const CommitTypePieChart = dynamic(
    () => import("@/components/charts/CommitTypePieChart"),
    { ssr: false }
  );
  ```
- 🐛 **`useEffect + fetch` 取数**在 App Router 下是反模式，会导致瀑布加载与页面闪烁——一律改为 RSC `async` 组件从 `lib/data.ts` 拉取。
- 🐛 **`"use client"` 具有传染性**：一旦父组件声明 `"use client"`，其内所有子组件都会被打进客户端 bundle。请把 `"use client"` 尽量下沉到叶子节点。
- 🐛 **shadcn/ui 组件是 RSC 友好的**，但带交互的（如 `Dialog` / `DropdownMenu`）内部已经声明了 `"use client"`，这类组件**不算入项目 3 个客户端组件预算**。
- 🐛 **Tailwind v4 与 v3 语法差异**：v4 使用 `@import "tailwindcss";` 单行导入，不再需要 `@tailwind base/components/utilities` 三段式。
- 🐛 **Vercel 构建失败**：若 `pnpm-lock.yaml` 与 `package.json` 不一致，Vercel 会直接构建失败。本地务必 `pnpm install` 后再提交 lockfile。
- 🐛 **动态路由参数 `params`**：Next.js 14 部分小版本已 Promise 化，使用前需 `await params`，并给出精准 TS 类型定义。
- 🐛 **`error.tsx` 必须写 `"use client"`**（框架强制约定），但**不计入 3 个客户端组件预算**，可放心使用。
- 🐛 **环境变量泄露**：客户端可读变量必须加 `NEXT_PUBLIC_` 前缀，且不要把 Secret 放到该前缀下，否则会被打包进浏览器 bundle。
