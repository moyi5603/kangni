# 活动点赞、收藏、评论

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** H5 与 PC 员工活动门户。首页展示赞/藏/评数字；详情可操作；活动评论写回后台；独立「我的收藏」页。  
**关联：** 覆盖 `docs/superpowers/specs/2026-08-18-h5-employee-activity-portal-design.md` 中「首页移除点赞、收藏、评论数字」与 `docs/superpowers/specs/2026-08-19-pc-employee-activity-portal-design.md` 中「移除点赞、收藏、评论数字」。覆盖 `docs/superpowers/specs/2026-08-18-c-end-activity-h5-pc-design.md` 中「赞/星/评只展示，不写回」。

## 背景与目标

员工在活动首页只能看到报名信息，无法判断活动热度，详情底栏/侧栏也只有报名。后台已有活动「评论管理」（`related.comments`），C 端却读一份静态 `SOCIAL` 假数字，两边对不上（例如活动 1 后台 2 条评论，C 端显示 0）。

目标：

1. 首页发现活动卡展示点赞、收藏、评论数量。
2. 详情可点赞、收藏、发评论；详情有活动评论列表。
3. 评论与后台评论管理同一份数据。
4. 独立「我的收藏」页，首页有入口和预览。

演示用户仍是陈产品（`DEMO_SIGNUP_USER`）。赞、藏、评与是否报名无关。

## 决策摘要

| 项 | 选择 |
|---|---|
| 端 | H5 + PC |
| 首页数字 | 只展示，整卡进详情，卡上不能点赞 |
| 详情操作 | 点赞/收藏即时切换可取消；评论打开输入 |
| 评论数据 | `related.comments`，后台评论管理可见 |
| 赞/藏数据 | 新建 `engagementStore`（`likedBy` / `favoritedBy`） |
| 评论列表 | 详情页要有；在介绍之后、精彩瞬间之前 |
| 收藏入口 | 独立页，与「我的报名」并列 |
| 资格 | 未报名也能赞、藏、评 |
| 不做 | 真登录、赞/藏后台页、C 端删评/回复、收藏页 tab/搜索、列表卡上直接点赞 |

## 数据

### 评论

继续用 `src/features/activities/model/related.ts` 的 `comments: CommentRecord[]`。

- C 端发评：`patchRelated('comments', …)`，作者 `陈产品`，`createdAt` 为当前时间字符串（与报名提交同一格式）。
- `id` 取现有列表最大 id + 1。
- 后台删除后 C 端列表和数字立刻少。
- 单测 `afterEach` 增加 `restoreRelatedComments()`，只恢复 comments 种子，对称于 `restoreRelatedSignups()`。

活动评论 ≠ 精彩瞬间评论。两套列表分开，互不写入。

### 点赞 / 收藏

新建 `src/features/c-end/activities/model/engagementStore.ts`：

```text
likedBy: Record<activityId, string[]>
favoritedBy: Record<activityId, string[]>
```

- `toggleLike(activityId)` / `toggleFavorite(activityId)`：当前用户名在数组里则移除，否则追加。`activityStore` 里没有该 id 则忽略、不抛错。没有种子的已发布活动第一次点会新建名单。
- 数字 = 对应数组长度。
- 提供 `useActivityEngagement(activityId)` 与 `useFavoriteActivityIds()`（当前用户收藏的 id 列表）。
- `resetEngagement()` 回到种子，单测 `afterEach` 调用。

废弃 `clientActivity.ts` 里静态 `SOCIAL` 对展示的作用。`toClientActivity` 的 `likes` / `stars` / `comments` 改为现算：

- `likes` ← `likedBy[id].length`
- `stars` ← `favoritedBy[id].length`
- `comments` ← `getRelatedList('comments').filter(c => c.activityId === id).length`

`SocialRow` 继续吃 `ClientActivity` 这三个字段。首页/详情必须订阅 `engagementStore` 与 `related.comments` 再调用 `toClientActivity`，不能模块加载时算一次。列表卡目前接收 `Activity`，挂 `SocialRow` 时在渲染里转 `ClientActivity`。

### 种子

点赞：按原 `SOCIAL.likes` 人数填组织内其他人名。人数不够时用 `员工1`、`员工2`… 补齐。陈产品不在任何活动的 `likedBy` 种子里。

收藏：

| 活动 id | 标题 | `favoritedBy` |
|---|---|---|
| 2 | 新员工入职训练营 | `['陈产品']`（原 SOCIAL.stars 为 0，现收藏数为 1） |
| 9 | 中秋员工晚会 | `['陈产品', …]` 凑满原 SOCIAL.stars=4 |
| 其余有 SOCIAL.stars 的活动 | — | 只用其他人名凑原数量，不含陈产品 |

内存数据，刷新回种子。不接真登录，不新建后台赞/藏管理页。

## 路由

| URL | 页面 |
|---|---|
| `#/c/h5/favorites` | H5 我的收藏 |
| `#/c/pc/favorites` | PC 我的收藏 |

`parseCEndHash` 在 `my` / `courses` / `courses-mall` 旁增加 `favorites`。`favorites` 优先于数字 id。`H5Page` 增加 `'favorites'`。`CEndApp` H5 与 PC 都挂收藏页。

现有首页、详情、我的报名路由不变。

## 页面结构

### 首页（H5 / PC 同结构）

顺序：我的活动 → **我的收藏** → 发现活动。

我的收藏区块：

- 标题「我的收藏」。
- 右侧固定「查看全部」，进入对应端 `#/c/{h5\|pc}/favorites`。即使 0 条也显示，保证独立页有入口。
- 预览上限 2（新常量 `HOME_FAVORITE_PREVIEW_LIMIT`，与报名预览条数相同）。只展示仍已发布的收藏。
- 预览卡：封面、标题、日期、地点；点卡进详情。
- 0 条已发布收藏：文案「还没有收藏活动」+「去看看活动」（滚到发现活动目录，不跳页）。

「我的活动」的「查看全部」规则不变（仅待参加 > 2 或有已结束/失效时才出现）。

发现活动卡脚部恢复 `SocialRow`：赞 / 藏 / 评三个数字，只读。整卡仍是一个按钮进详情，卡上不套赞/藏/评按钮。

### 详情操作栏

H5 底栏 `.c-h5-cta-bar`：左三个图标按钮（数字 + 已选 `is-on`），右报名主按钮（`signupCta` 规则不变）。图标不换行，报名按钮占剩余宽度。继续 `safe-area-inset-bottom`。

PC 侧栏 `.c-pc-side`：社交按钮在报名按钮上方，行为与 H5 相同。

| 操作 | 行为 |
|---|---|
| 点赞 | 立刻切换，可取消，无 toast |
| 收藏 | 立刻切换，可取消，无 toast |
| 评论 | 滚到评论区 `#activity-comments`，并打开输入 |

输入：H5 底部 Sheet，PC 弹窗。多行文本 + 发送。内容 `trim()` 后为空则发送禁用。成功关闭输入、toast「评论成功」、列表顶部插入新评（**新在上**）。

图标用已有 `IconLike` / `IconStar` / `IconComment`。

### 详情评论区

位置：活动介绍（疗休养另含行程安排、额外费用规则）之后，「精彩瞬间」`MomentFeed` 之前。

- 标题「评论」+ 当前条数。
- 每条：评论人、时间、正文。
- 空态：「暂无评论」。
- C 端不能删除、不能回复。删除只在后台评论管理。

### 我的收藏页

H5 / PC 各一页，壳与「我的报名」同类。标题「我的收藏」，返回对应端首页。

- 一张列表，无 tab、无搜索。
- 有效活动：封面、标题、日期、地点；点进详情。
- 关联活动未发布或已删除：卡上「活动已失效」，不能点进。不保存标题快照。
- 空态（当前用户收藏 id 长度为 0）：「还没有收藏活动」+「去看看活动」回首页。若只剩失效卡，仍列出失效卡，不算空态。
- 取消收藏只在详情点星，本页不放取消按钮。

## 组件与文件边界

| 文件 | 职责 |
|---|---|
| `engagementStore.ts` | 赞/藏种子、toggle、hooks、reset |
| `related.ts` | 增加 `restoreRelatedComments`；发评仍 `patchRelated` |
| `clientActivity.ts` | 删 `SOCIAL`；`toClientActivity` 现算三数；收藏预览分组函数 |
| `SocialRow.tsx` | 首页只读数字行（已有，挂回列表卡） |
| 详情操作栏 | H5 底栏 / PC 侧栏内联或小组件，三个 `button` |
| 评论列表 + H5 Sheet / PC Modal | 详情页组合 |
| `H5MyFavorites.tsx` / `PcMyFavorites.tsx` | 收藏列表页 |
| `navigation.ts` / `CEndApp.tsx` | `favorites` 路由 |
| `H5ActivityCards.tsx` / `PcActivityHome.tsx` | 卡上挂 `SocialRow` |
| `H5ActivityHome.tsx` / `PcActivityHome.tsx` | 我的收藏区块 |
| `styles.css` | 底栏双区、评论列表、收藏区块 |

不改后台评论管理页行为。不把赞/藏写入 `related.ts`。

## 异常

- 评论只 trim，空串不发。
- 点赞/收藏对 `activityStore` 里不存在的 id 忽略。
- 收藏的活动被下架或删除：收藏页出失效卡；首页预览只出仍已发布的。
- 后台删评论后，详情列表和各处评论数字立刻少。
- 报名 CTA 状态机不动。
- 赞/藏/评不拦未报名。

## 无障碍与窄屏

- 三个操作是真 `button`。
- `aria-label`：「点赞」/「取消点赞」、「收藏」/「取消收藏」、「评论」。
- 赞和藏带 `aria-pressed`。
- 首页 `SocialRow` 在整卡按钮里，只读，不另套按钮。
- H5 底栏图标区不换行挤掉报名按钮。

## 测试

现有首页测用整页 `not.toContain('查看全部')` 会误伤「我的收藏」的固定入口，改为只断言「我的活动」区块内有没有「查看全部」。

PC 首页「无 `c-social`」改为：发现活动卡要有 `c-social`。

至少覆盖：

1. `parseCEndHash('#/c/h5/favorites')` / PC 同等，不是活动 id。
2. `engagementStore`：toggle 加减自己；重复点取消；不存在的活动 id 不炸；无种子活动第一次点会建名单；reset 回种子。
3. 发评写入 `related.comments`，作者陈产品；空内容不写。
4. H5/PC 首页有「我的收藏」和 `c-social`；种子预览含训练营、中秋晚会。
5. 详情底栏/侧栏有三个操作按钮和报名按钮。
6. 收藏页渲染种子两条；取消收藏后列表少一条。
7. `npx tsc --noEmit` 通过。

## 验收

1. H5/PC 首页：发现活动卡有赞/藏/评数字；「我的收藏」在「我的活动」和「发现活动」之间；种子 2 条能预览。
2. `#/c/h5/favorites`、`#/c/pc/favorites` 进收藏页；详情取消收藏后首页预览和本页同步少一条。
3. 详情可赞可藏可评；新评出现在详情列表顶部，后台评论管理同一条。
4. 空评论发不出；未报名也能赞藏评。
5. 相关 vitest 与 `npx tsc --noEmit` 通过。

## 非目标

- Showcase / 真登录 / RBAC
- 赞、藏的后台管理页
- C 端删除或回复活动评论
- 收藏页搜索、tab
- 列表卡上直接点赞或收藏
- 把赞/藏写入 `related.ts`
- 精彩瞬间赞评逻辑改动
