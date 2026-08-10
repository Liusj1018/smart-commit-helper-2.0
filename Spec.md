1.需求规格：
1.1产品名称
smart dashboard
1.2
路由地址                                核心页面内容                                            组件渲染模式
'/'(根路径)                             项目首页：产品介绍+引导跳转至Dashboard                   RSC(服务端组件)
'/dashboard'                            总览看板：四张核心指标卡(commit/PR/耗时/Plan)            RSC
'dashboard/commits'                     提交记录：commit列表+提交类型分布图                      RSC+Client(交互图表)
'dashboard/members/[id]'                 成员详情：个人贡献数据+本周代码热力图                    RSC+Client(动态交互)
1.3项目核心能力
  1.commit类型分布统计(feat/fix)
  2.PR实时评审状态追踪(待审/已批)
  3.成员周提交热力图与活跃度
  4.Plan Mode任务完成度自动核算
1.4项目背景
Smart Commit Helper CLI已成为团队标配，有效规范了提交信息。Lead敏锐洞察到需求升级:将“隐形的规范”转化为可视化的工程效能看板，让协作状态透明化、数据化。
2.技术栈和交付标准
限时1天独立交付挑战:采用Nextjs14AppRouter架构，利用RSC实现服务端组件高效渲染，最终部署至Vercel并生成Preview URL，实现即开即用的生产级交付。框架 Next,js 14+(App Router)语言 TypeScript(strict 模式) Tailwind CSS v4+ shadcn/ui状态管理 优先RSC，必要时用 Zustand数据获取 RSC直接async/await (禁止useEffect +fetch)图表Recharts(仅 Client组件)包管理 pnpm部署Vercel
3.禁止项
"use client"总数≤3个数据仅允许从lib/data.ts读取严禁使用 useEffect+fetch 取数禁止出现未处理的TS语法报错
4.验收标准
CLAUDE.md文档不少于50行说明研发计划拆解≥8个关键步骤全局配置loading/error兜底页必须提供Vercel Preview预览地址


