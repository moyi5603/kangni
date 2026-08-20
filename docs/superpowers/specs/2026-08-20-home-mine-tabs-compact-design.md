# 首页「我的活动 / 我的收藏」合并与压缩

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** H5 / PC 员工活动**首页**上的「我的活动」与「我的收藏」两块。全页我的报名、全页我的收藏、发现活动、详情、B 端不改。  
**关联：** `docs/superpowers/specs/2026-08-19-pc-employee-activity-portal-design.md`、`docs/superpowers/specs/2026-08-20-activity-like-favorite-comment-design.md`、`docs/superpowers/specs/2026-08-19-signup-status-row-and-demo-data-design.md`

## 背景与目标

首页先叠「我的活动」再叠「我的收藏」，每块最多 2 张预览卡，空态也占一整段。两块都有数据时纵向过长；没数据时空 CTA 仍挡发现活动。

目标：空了不占位；两边都有时合成一块 tab，一次只展开一组；预览卡本身变矮。预览条数、查看全部公式、发现活动顺序不变。

## 决策摘要

| 项 | 选择 |
|---|---|
| 端 | H5 首页 + PC 首页，规则相同，仍两套页面 |
| 空 | 没报名且没收藏 → 整块不渲染 |
| 合成 | 两边都有 → tab「活动 \| 收藏」；默认活动 |
| 单边 | 只有一侧有数据 → 普通 `h2` 标题，无 tab；空的那侧 tab 也不出现 |
| 记住 tab | 不记；刷新回活动 |
| 预览条数 | 仍最多 2（`HOME_SIGNUP_PREVIEW_LIMIT` / `HOME_FAVORITE_PREVIEW_LIMIT`） |
| 卡片 | 仅首页 `.is-preview` 变矮：方图 72→48 |
| 查看全部 | 跟当前可见面板走；报名公式不变 |
| 不做 | 全页列表压缩、预览改 1 条、H5/PC 合成门户、空态 CTA |

## 出现规则

用现有数据，不改 store。

- **有报名侧：** C 端可见报名 `signups.length > 0`（含只有已结束、首页预览为空）。`已取消` 本来就不在 C 端列表。
- **有收藏侧：** `previewFavorites(...)` 里至少 1 条带可见活动。失效/未发布收藏不计入。

| 报名侧 | 收藏侧 | UI |
|---|---|---|
| 无 | 无 | 不渲染该 section，直接发现活动 |
| 有 | 无 | `h2`「我的活动」+ 报名预览或「暂无待参加活动」 |
| 无 | 有 | `h2`「我的收藏」+ 收藏预览 |
| 有 | 有 | 一块：tab「活动 \| 收藏」，无 `h2`「我的活动/我的收藏」 |

运行中一侧从有变无（例如取消最后一条收藏）：立刻按上表降级。在收藏 tab 时收藏归零 → 变成「只有活动」布局，tab 消失。

「只有已结束报名、预览为空」仍算出报名侧：文案「暂无待参加活动」，并按下面规则出「查看全部」。不要因此把整块藏掉。

## 标题栏与 tab

**单边：** 左 `h2.c-section-title`，右「查看全部」（条件见下）。

**双边：** 左 `role="tablist"` `aria-label="我的活动与收藏"`，两个 `role="tab"` 文案 **活动**、**收藏**（不要写成「我的活动 / 我的收藏」）。当前 tab `aria-selected="true"`。右「查看全部」跟选中 tab 走。点 tab 只换面板，不改 hash。

状态：`useState<'signups' | 'favorites'>`，默认 `'signups'`。不写 localStorage。

测试用 prop：`initialMineTab?: 'signups' | 'favorites'`（对称全页报名 `initialTab`）。仅两边都有时生效；单边忽略。SSR 测收藏面板用 `initialMineTab="favorites"`，不测浏览器 click。

## 查看全部

| 当前面板 | 去哪 | 何时出现 |
|---|---|---|
| 活动 | H5 `goH5MySignups` / PC `goPcMySignups` | 不变：`upcoming.length > HOME_SIGNUP_PREVIEW_LIMIT \|\| ended.length > 0` |
| 收藏 | H5 `goH5Favorites` / PC `goPcFavorites` | 收藏面板可见时**一直**有（这块可见 ⇒ 至少 1 条收藏） |

活动面板未满足公式时不显示「查看全部」，即使同一块在收藏 tab 会显示。切换 tab 时按钮显隐跟着变。

## 列表内容

当前面板下：

- 活动：`groups.upcoming.slice(0, HOME_SIGNUP_PREVIEW_LIMIT)`。点卡进详情。状态行 + compact meta 保留。
- 收藏：`previewFavorites` 已有上限 2。点卡进详情。无状态行，有 compact meta。
- 活动预览为空但有报名：`<p class="c-empty">暂无待参加活动</p>`，不出空 CTA「去看看活动」。

`scrollToCatalog` 空态按钮随空块一起删除。

## 压缩样式

只作用首页预览：`.c-h5-signup-card.is-preview` / `.c-h5-fav-card.is-preview` 以及 PC 对应 `.is-preview`。全页报名/收藏卡、发现活动卡的 72px 方图不动。

用「预览卡内的 thumb」覆盖，不要改全局 `.c-signup-thumb`，否则全页列表会被误伤。

| token | 现在（首页预览） | 改成 |
|---|---|---|
| 方图 | 72×72 | 48×48 |
| H5 padding | 12×14 | 8×12 |
| PC padding | 14 | 10 |
| 标题 | 1 行 clamp | 不变 |
| meta 上边距 | 8 | 4 |
| 预览条数 | 2 | 不变 |
| PC 预览网格 | 两列 | 不变 |

H5 预览 `min-height` 跟 48px 图 + padding 对齐，不要再按 72px 图留 76px。状态行保留，允许换行，不要挡图。

## 组件与文件

H5 / PC 不合成一套门户。各自首页把原来两个 `<section>` 收成一个。

建议 class：

- 包裹：`c-h5-mine` / `c-pc-mine`（有这块才出现，且永远在发现活动之上）
- 面板可见时列表 `aria-label` 仍用「待参加活动」/「收藏的活动」

`src/features/c-end/activities/model/clientActivity.ts` 增加纯函数，例如：

- `hasHomeSignupsPane(signups)` → `signups.length > 0`
- `hasHomeFavoritesPane(favoritePreview)` → 至少 1 条 `activity`
- 可选：`homeMineMode(hasSignups, hasFavorites)` → `'hidden' | 'signups' | 'favorites' | 'tabs'`

不改 `groupClientSignups`、`previewFavorites` 上限、报名 store、engagement store。

## 测试

首页测试现在 `resetClientSignups` 但**不** reset 收藏。种子收藏仍在（训练营、中秋）。改完默认首页（报名空 + 种子收藏）应是 **只有「我的收藏」**，没有「我的活动」空态、没有「还没有报名活动」、没有「去看看活动」。

测整块隐藏时：`resetClientSignups()` + `resetEngagement()`（或等价清收藏）。

H5 / PC 各覆盖：

| 夹具 | 期望 |
|---|---|
| 报名 0 + 收藏 0 | 无 `c-*-mine`；有发现活动 |
| 只有报名 | `h2`「我的活动」；无 tab；无「我的收藏」；预览 ≤2；查看全部公式不变 |
| 只有已结束报名 | 「暂无待参加活动」+ 查看全部；无预览卡 |
| 只有收藏 | `h2`「我的收藏」；无 tab |
| `loadDemoSignups`（两边都有） | `tablist`；默认活动面板含训练营、体检、状态行；默认 HTML 无 `h2`「我的收藏」；`initialMineTab="favorites"` 能看到收藏预览标题 |
| 封面 | 预览卡仍有 `c-signup-thumb` + cover `src`，无 `c-cover-type` |

`clientActivity.ts` 单测 helper：四种 mode。发现活动、全页报名/收藏现有断言尽量不动。

## 不做

- 不改全页我的报名 / 我的收藏卡片尺寸与布局。
- 不改发现活动、详情、B 端。
- 不把预览上限改成 1。
- 不记住上次 tab。
- 不把 H5 / PC 合成一个响应式门户。
- 不保留首页空态 CTA（空了整块没了）。
- C 端不用 antd。
