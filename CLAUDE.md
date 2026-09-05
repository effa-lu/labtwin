# CLAUDE.md — LabTwin v0.2

本文件是 Claude Code 在本仓库工作的常驻上下文。每次会话先读完再动手。产品定义与设计决策的权威文档是 `docs/plan/LabTwin_v0.2_执行计划.md`；本文件只放"写代码时必须知道的事"。

## 1. 这是什么

LabTwin 是一个 **Data-first Spatial Twin**：让不会 BIM 软件的实验室管理员在浏览器里把一张平面图变成可搜索、可维护的实验室空间索引。核心原则：

- **几何与信息完全解耦。** 数据库只存多边形、变换和参数；3D 在客户端运行时由数据派生。仓库里永远不会出现网格文件（.glb/.obj/.ifc）作为数据源。
- **Spatial Entity = Identity + Location + Information。** 每个空间对象有唯一 `code`（Location ID，如 `CAB-01`、`CAB-01-S2`），它是跨 2D / 3D / QR / 数据库的主键。
- **3D 只是界面。** 任何功能必须在 2D 列表或平面视图中同样可达。默认编辑视图是**俯视正交**，3D 透视是预览。
- **精度要求：拓扑与 ID 映射 100% 正确，几何尺寸 ±10 cm 可接受。** 不要为几何精度做任何额外工作。

## 2. 技术栈与版本锁定（2026-09-05 定，不升级除非有专门任务）

| 层 | 选择 | 版本 |
| --- | --- | --- |
| 前端 | React + TypeScript + Vite | react 19.2.8 · typescript 5.9.3 · vite 7.3.6 |
| 3D | three.js + @react-three/fiber + @react-three/drei | three 0.185.1 · r3f 9.7.0 · drei 10.7.8 |
| 2D 编辑 | SVG + 自写指针逻辑 | —（不引入 Konva，除非任务明说） |
| 状态 | zustand | 5.0.15 |
| i18n | i18next + react-i18next | 26.4.2 / 17.0.13 |
| PDF | pdfjs-dist | 6.3.289 |
| 后端 | Supabase（Postgres + Auth + Storage + RLS + Edge Functions） | supabase-js 2.115.0 |
| 测试 | vitest · @playwright/test | 4.1.11 · 1.63.0 |
| Lint | eslint 10 + typescript-eslint 8 | 见 `eslint.config.js` |
| 部署 | Vercel（前端）、Supabase 托管 | — |

引用任何不在 `package.json` 里的包或 drei helper 之前，先 `npm view <pkg> version` 确认存在，再问我是否要加依赖。**不要凭记忆引用 drei 的 API**——先看 `node_modules/@react-three/drei` 里的实际导出。

## 3. 目录约定

```
src/
  api/            # 前端唯一接触 Supabase 的地方。按领域分文件：workspaces.ts（已有）plans.ts spaces.ts entities.ts items.ts events.ts
  store/          # zustand stores：auth, workspace, editor（只放 UI 状态）
  features/
    plan/         # Plan Studio（2D）：上传、标定、多边形、门
    space/        # Space Studio：geometry/（纯函数）、scene/（R3F）、components/（构件注册表）、commands/（命令模式）、demo.ts（硬编码演示数据）
    viewer/       # 浏览与搜索
    inventory/    # 物品与库存
  theme/tokens.ts # 设计 token，由 Effa 的 Figma 导出，不手改
  i18n/           # zh.json en.json
supabase/
  migrations/     # 纯 SQL，按时间戳命名。已应用的文件只增不改
  functions/      # Edge Functions（LLM 代理、CSV 校验、邮件周报）
docs/
e2e/              # Playwright
```

## 4. 铁律（违反任何一条 = PR 不合并）

1. **只有 `src/api/` 能 import Supabase client。** ESLint `no-restricted-imports` 会拦（同时拦 `@supabase/supabase-js` 与 `@/api/client`），不要绕。feature 代码调用 `api.entities.place(...)` 这类领域函数，拿到的是领域类型，不是数据库行。
2. **已应用的迁移文件永不修改。** 要改表就新建一个迁移文件。
3. **密钥不进仓库、不进前端。** 只用 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。service role key 在任何情况下都不出现在前端代码或 `VITE_` 变量里。
4. **所有编辑操作走命令模式。** `src/features/space/commands/` 里每个 Command 有 `do()` / `undo()`（已实现，目前只改内存 store；接数据库时在同一处加 `api.*` 调用并写 `events` 表）。不允许在组件里直接调 `useEntitiesStore` 的 `_insert/_remove/_patch`，唯一例外是 `Floor.tsx` 拖动时的实时预览，松手后仍以命令提交。
5. **`code`（Location ID）一旦生成永不修改、永不复用。** 编号在数据库端原子分配（Postgres 函数），前端不计算下一个编号。可改的是 `label`。
6. **几何是纯函数。** `src/features/space/geometry/` 里不 import three.js 的场景对象，只做数学，每个函数都有 vitest 测试。`scene/` 里的 R3F 组件只负责把这些描述画出来。
7. **墙体方案固定：** 每条边一个盒子（厚 0.15 m），门用"左段 + 上梁 + 右段"三个盒子。不做多边形整体偏移，不用 CSG。
8. **每张表带 `workspace_id` 并启用 RLS**（orgs 除外）。新表没有 RLS 策略不允许合并。
9. **文案走 `t()`。** 不写硬编码中文或英文到 JSX。
10. **一个 PR 做一件事。** 发现范围外的问题，开 issue，不顺手做。

## 5. 领域约定

- **单位：米。** 数据库、几何函数、three.js 场景全部米制。像素只存在于 Plan Studio 的画布层，经 `plans.px_per_m` 换算后立即变成米。
- **坐标系：** 平面图左上角为原点，x 向右，y 向下（2D）；three.js 中 y 向上，**平面图的 y 映射到 +z**（俯视相机 up = −z，这样俯视图与平面图方向一致、不镜像）。换算函数在 `geometry/coords.ts`，别处不重复写。
- **层级：** Workspace → Plan → Space(ROOM-NN) → Entity(CAB-NN) → Sub-location(CAB-NN-S<n>) → Item。子位置是 `entities` 表里 `parent_id` 指向父的行。
- **ID 前缀：** CAB SHF BCH FHD FRZ SAF SNK EQP，房间 ROOM。
- **网格吸附 0.05 m，旋转只允许 90° 步进。**
- **构件不能落在任何 Space 多边形之外。**

## 6. 常用命令

```
npm run dev                 # 本地
npm run lint && npm run test
npm run e2e                 # Playwright（首次先 npx playwright install chromium）
supabase start / supabase db reset      # 本地库从零重建（验证迁移）
supabase gen types typescript --local > src/api/database.types.ts
supabase db push            # 迁移到远端（只在 main 合并后手动执行）
```

## 7. 怎么协作

- **先写测试再写实现**——对几何纯函数和 ID 规则尤其如此。
- **你看不见画布。** 需要看渲染结果时用 Playwright 截图到 `e2e/__screenshots__/` 再读图。不要猜测视觉结果。
- **卡住超过 3 次尝试就停下**，写清你试了什么、现象是什么、你的两个假设，然后问我。
- **不要过度设计。** 没要重试就不写重试，没要动画就不写动画，没要抽象就不抽象。三处重复再考虑抽取。
- **小步提交。** 每个可运行的中间状态就 commit，消息用英文一句话。
- **迁移与 RLS 变更要单独列出来告诉我**，合并前人工过一遍。
- 中英文都可以，代码注释和 commit 用英文，讨论用中文。

## 8. 当前状态（2026-09-05 晚）

已完成：前端骨架、`src/api/` 层（workspaces）、四个 store（auth / workspace / editor / entities）、i18n、几何纯函数、**构件注册表**（8 种参数化基元 + 自定义 GLB 通道，`components/registry.ts`）、**参数化外观**（`components/meshes/basic.tsx`）、**命令模式**（放置 / 移动 / 旋转 / 删除 / 改尺寸 / 改参数，含 undo/redo）、**Space Studio 交互**（左侧构件面板点选 → 点地面放置、俯视拖动、R / Del / Ctrl+Z）、**模型库展厅页**、墙体 dollhouse 剔除、**门洞（左段 + 上梁 + 右段）**、构件离地高度（`transform.z`，用于吊柜/挂柜）、GLB 缺失时的线框占位（不崩溃）、Playwright 4 条 e2e。场景数据来自 `features/space/demo.ts` 的两个示例（L 形合成场景、Effa 手绘走廊型实验室），顶栏下拉切换；尚未连接数据库。

约定：Effa 负责 `theme/tokens.ts`（颜色）、`theme/icons.ts`（图标）、自定义 GLB 模型（规范 `docs/models.md`）；基础家具全部参数化，不做 GLB。**视觉系统已定（Effa《LABTWIN Color System v1.0》，2026-09-05）：深炭灰底（#2D3133 / #3A3E40 / #454A4D），Primary Blue #59B4C5（品牌/主导 60%）、Secondary Blue #88C5CF（界面元素 20%）、Active Cyan #2AAABC（按钮/链接/悬停）、Accent Orange #D16736（选中/警示 10%）、Neutral Gray #9A9A9A（次要文字 7%）、Light Neutral #D3BAB4（3%）；扩展色 Deep Teal / Sage / Lavender / Sand / Coral / Yellow / Stone / Plum 用于构件区分与图表。字标 LAB 白 + TWIN 青，字体 Montserrat。全部在 `theme/tokens.ts`，按钮变体在 `ui/primitives.tsx`（primary 实心青 / secondary 描边青 / ghost / accent 橙）。** 手套箱（Etelux Lab2000 式：架腿 + 前窗 + 手套口 + 侧过渡舱）已做成参数化基元 `glovebox`（`params.ports` 1–4）。

未开始：Supabase 迁移与 RLS、Plan Studio、子位置展开、库存。下一步由创始人决定，不预设顺序。
