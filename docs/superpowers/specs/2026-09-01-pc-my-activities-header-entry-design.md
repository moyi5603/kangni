# PC 活动首页顶栏「我的活动」入口

**日期：** 2026-09-01  
**状态：** 已确认，待实现  
**范围：** 活动应用 C 端 **PC** 首页顶栏 + 既有报名全页。H5、B 端、我的收藏、详情、全部活动、搜索不改入口。  
**关联：** `docs/superpowers/specs/2026-08-19-pc-employee-activity-portal-design.md`、`docs/superpowers/specs/2026-08-19-my-signups-audit-tabs-and-search-design.md`

## 背景与目标

报名全页已存在：`#/c/pc/my` → `PcMySignups`。PC 首页测试明确禁止「我的活动」文案，员工无法从首页进入自己的报名。

目标：PC 首页顶栏标题右侧增加「我的活动」，进入已报名活动列表。不重做列表。

## 决策摘要

| 项 | 选择 |
|---|---|
| 入口位置 | 顶栏标题右侧（`.c-pc-header` 第三列） |
| 出现页 | 仅首页 `PcActivityHome variant="preview"` |
| 不出现 | 全部活动、搜索、详情、往期瞬间、我的报名、我的收藏 |
| 目标路由 | 复用 `#/c/pc/my` / `goPcMySignups` |
| 报名页标题 | `PcActivityShell title="我的活动"`（现默认「员工活动」） |
| 列表行为 | 不变：待审核 / 待参加 / 进行中 / 已结束 / 已驳回 + 搜索 |
| 本轮不做 | 我的收藏入口、H5 入口、首页内嵌报名预览 |

## 入口

`PcActivityShell` 增加可选 `headerActions?: ReactNode`，放在 `.c-pc-header-actions`，`justify-self: end`，对齐已有三列 grid（品牌 | 标题 | 操作）。

首页 preview 传入：

- 控件：`<button type="button">我的活动</button>`（或 `a` + `toPcMySignupsHash()`）
- 点击：`goPcMySignups()`
- 文案固定「我的活动」，不跟报名条数变化，空报名也显示

样式对齐投票 PC「我的记录」密度：文字链/次按钮，不抢主品牌。可复用或贴近 `.c-pc-vote-mine`。

## 报名全页

- 顶栏 `h1`：「我的活动」
- 返回仍回 PC 首页（`goCEnd('pc')`）
- 卡片、tab、空态、搜索：沿用 `PcMySignups`，不改分组规则

## 测试

- `PcActivityHome`：preview 含「我的活动」；`variant="all"` / `search` 不含
- `PcActivityShell`：无 `headerActions` 时仍无该文案
- `PcMySignups`：`h1` 为「我的活动」
- 既有报名 tab / 搜索用例保持绿

## 非目标

- 不恢复首页「我的活动与收藏」预览块
- 不改 H5 首页
- 不改报名数据源
