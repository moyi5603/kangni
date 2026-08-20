# 我的报名：待审核 / 已驳回 Tab + 按名称搜索

**日期：** 2026-08-19  
**状态：** 已确认，待实现  
**范围：** H5 / PC「我的报名」五个 pill tab（待审核、待参加、进行中、已结束、已驳回）+ 当前 tab 内按活动名称即时搜索。  
**关联：** `docs/superpowers/specs/2026-08-19-my-signups-tabs-design.md`（三 tab 已落地，本规格替换其 tab 集合与分组规则；首页预览规则仍以该文档为准。）

## 背景与目标

三 tab 按活动状态分组后，待审核和已驳回混在待参加 / 已结束里，不好找。要单独成组，并在列表页加按活动名称搜索。

首页「我的活动」预览和「查看全部」**完全不动**。

## 方案

有报名记录时，搜索框在 tab **上方**，五个 pill 无数量角标：

`待审核` | `待参加` | `进行中` | `已结束` | `已驳回`

默认选中 **待参加**（不是待审核）。点 tab 只换当前列表，不改 hash。切 tab **保留**搜索关键词。空 tab 仍显示搜索框 + 五个 tab + 一句空文案，不自动跳到有数据的 tab。

完全没有报名时，保持整页空态（还没有报名活动 + 去看看活动），不出现搜索框，不出现 tab。

## 分组规则

在 `clientVisibleActivities` 关联之后，**互斥**：

| Tab | id | 条件 |
|---|---|---|
| 待审核 | `pending` | `signup.status === '待审核'` |
| 待参加 | `waiting` | 有已发布活动，且 `activityStatus === '未开始'`，且 `signup.status === '已通过'` |
| 进行中 | `ongoing` | 有已发布活动，且 `activityStatus === '进行中'`，且 `signup.status === '已通过'` |
| 已结束 | `ended` | `signup.status === '已通过'`，且（无关联活动，或 `activityStatus === '已结束'`） |
| 已驳回 | `rejected` | `signup.status === '已驳回'` |

待审核 / 已驳回 **不管**活动状态（含失效卡）。待参加 / 进行中 / 已结束只收 **已通过**。

排序仍按 `createdAt` 倒序。卡片 UI（封面、状态行、报名类型、日期地点）不变。

### 首页 `upcoming`（不动）

`groupClientSignups` 必须继续返回 `upcoming`：有已发布活动且 `activityStatus !== '已结束'`，**不筛审核状态**。首页预览仍 `upcoming.slice(0, HOME_SIGNUP_PREVIEW_LIMIT)`。「查看全部」仍是 `upcoming.length > 2 || ended.length > 0`，不因 pending / rejected 改变。

Demo 预览仍是训练营 + 体检。体检在「我的报名」里进待审核，但首页预览仍出现。

## 搜索

有报名才渲染搜索框，位置在五个 tab 上方。H5 / PC 同一套规则。

| 项 | 规则 |
|---|---|
| 范围 | 只筛 **当前 tab** 的 `signupsForTab` 结果 |
| 时机 | 输入即筛（受控 input，无「搜索」按钮） |
| 匹配 | 查询 `trim`；两侧 `toLowerCase` 后，标题 `includes` 查询 |
| 失效卡 | 标题按文案「活动已失效」匹配 |
| 空查询 | `trim` 后为空（含只打空格）则不额外过滤，等于该 tab 全量 |
| 切 tab | 保留关键词，用同一查询筛新 tab |
| URL | 不写 hash / query |

placeholder 与 `aria-label`：`搜索活动名称`。原生 `<input>`，不用 antd。`SignupGroup` / `PcSignupGroup` 的 `title` 并入「待审核」「已驳回」。

空结果：

- 有关键词且当前 tab 无命中：`未找到相关活动`
- 无关键词且当前 tab 无数据：该 tab 空文案（见下表）

搜索框和 tab 栏在两种空结果下都保留。

## 空文案

| Tab | 文案 |
|---|---|
| 待审核 | 暂无待审核活动 |
| 待参加 | 暂无待参加活动 |
| 进行中 | 暂无进行中活动 |
| 已结束 | 暂无已结束活动 |
| 已驳回 | 暂无已驳回活动 |

## 表面

H5 `#/c/h5/my`、PC `#/c/pc/my`。PC 顶栏仍是「员工活动」+ 返回列表。H5 顶栏仍是「我的报名」。

Tab：`role="group"` + `aria-pressed`，可点区域 ≥ 44px。五个 pill 沿用 `.c-tabs` 横向滚动。

页面增加可选 `initialTab` / `initialQuery`，供 `renderToStaticMarkup` 测默认态与筛选态（不测真实 keystroke）。

搜索实现放 `clientActivity.ts` 导出函数（例如 `filterSignupsByTitle(items, query)`），H5 / PC 共用，不要两处各写一份 includes。

## Demo 期望（`loadDemoSignups()`）

| Tab | 可见 |
|---|---|
| 待审核 | 年度体检安排 |
| 待参加（默认） | 中秋员工晚会 |
| 进行中 | 新员工入职训练营 |
| 已结束 | 空文案「暂无已结束活动」 |
| 已驳回 | 春季员工开放日 |

默认页不见训练营、体检、开放日。搜「晚会」且停在待参加：可见晚会。同一关键词切到待审核：`未找到相关活动`。

## 测试

- 无报名：无 tab、无搜索框，仍是整页空态。
- 五个 tab 文案出现；无数量角标。
- 默认待参加：晚会；不见体检 / 训练营 / 开放日。
- `initialTab` 覆盖待审核 / 进行中 / 已结束 / 已驳回（含已结束空文案）。
- `groupClientSignups`：pending / rejected 互斥；waiting / ongoing / ended 只有已通过；失效+待审核进 pending；失效+已通过进 ended；`upcoming` 仍含待审核的未结束活动。
- `filterSignupsByTitle`：trim、包含匹配、空查询不过滤、失效卡「活动已失效」。
- `initialQuery="晚会"` 默认 tab：可见晚会；`initialTab="pending"` + 同一 query：未找到。
- 首页 H5 / PC 现有预览与「查看全部」测试必须仍绿。

## 不做

- Tab / 搜索不带数字、不写 URL。
- 不改首页预览条数、「查看全部」公式、发现活动、详情、后台。
- 不做跨 tab 搜索、不做搜索按钮、切 tab 不清空关键词。
- 不为了 pending / rejected 改「查看全部」。
