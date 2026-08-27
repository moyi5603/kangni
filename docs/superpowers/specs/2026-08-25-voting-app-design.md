# 投票应用 B 端设计

**日期：** 2026-08-25  
**状态：** 待用户审阅  
**规范：** `build-ant-design-b2b-app`（列表四层、高级表单独立页、主操作在左、Modal 自定义 footer）  
**范围：** 管理端独立应用「投票」：概览/规则占位；投票管理列表 / 新建编辑 / 详情（配置 + 结果）。不做 C 端、权限、奖励、与评优打通、管理端代投。

## 背景

评优应用已有「投票中」阶段，那是评优流程的一环。本应用是独立的通用投票：管理员发起一场投票，配置选项与规则，员工稍后在 C 端投票。本轮只做 B 端配置与结果查看，选票用种子数据演示。

## 决策摘要

| 项 | 选择 |
|---|---|
| 形态 | 独立应用 `voting`，不挂评优、不挂活动 |
| 分类 | 员工与组织；插在 `awards` 之后、`training` 之前 |
| 顶栏 | 不直显；只出现在「全部应用」 |
| 图标 | 现成 `checkSquare`，不扩展 `NavIcon` |
| 默认页 | 概览 |
| 侧栏 | 一级×3：概览、投票管理、规则设置 |
| 类型 | 列表里的类型字段：普通投票 / 评选投票 |
| 模块 | 新建 `src/features/voting`，内存 mock store |
| 组织树 | 复用活动 `orgDepartmentTree` / `orgPeoplePickerTree` |
| 权限 / C 端 / 奖励 | 本轮不加 |

## 信息架构

| 顺序 | key | 图标 | 本轮 |
|---|---|---|---|
| 1 | `vote-overview` | `dashboard` | 占位 |
| 2 | `vote-list` | `checkSquare` | 真列表 |
| 3 | `vote-rules` | `fileText` | 占位（规则写在每场表单，无全局规则页） |

隐藏页：`vote-create` / `vote-edit` / `vote-detail`，侧栏高亮 `vote-list`。  
默认路由：`#/voting/vote-overview`。

Hash：

- `#/voting/vote-overview` → 概览占位
- `#/voting/vote-list` → 投票管理
- `#/voting/vote-create` → 新建
- `#/voting/vote-edit/:id` → 编辑
- `#/voting/vote-detail/:id` → 详情（默认页签 `detail`）
- `#/voting/vote-detail/:id/results` → 详情 · 结果
- `#/voting/vote-rules` → 规则设置占位
- `#/voting`、未知页 → 回落 `vote-overview`

占位正文沿用现壳：「当前应用「投票」。本页先占位，后续再补列表与详情。」

不改 `.b2b/b2b-standards.json` 的 `applicationDirectVisibleMax`。

## 实体

三份数据：活动 `VoteCampaign`、选项 `VoteOption`、选票 `VoteBallot`。选票本轮只读种子，管理端不写票。

### VoteCampaign

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `id` | number | 系统 | 自增 | |
| `name` | string | 是 | 空 | ≤50 |
| `type` | `普通投票` \| `评选投票` | 是 | `普通投票` | 未开始可改（确认后清空选项）；开始后锁定 |
| `anonymous` | boolean | 是 | `false` | 开或关都按 `voterId` 记每日额度；开只把记录里的姓名显示成「匿名」 |
| `startAt` | string | 是 | 空 | `YYYY-MM-DD HH:mm:ss` |
| `endAt` | string | 是 | 空 | 须晚于 `startAt` |
| `intro` | string | 否 | 空 | ≤500 |
| `dailyQuota` | number | 是 | `1` | 每人每天可投票数，整数 1–99 |
| `allowStackOnSameOption` | boolean | 是 | `false` | 同一选项当天能否连投 |
| `visibility` | `全员` \| `按部门` \| `自定义人员` | 是 | `全员` | 无「导入人群」 |
| `departments` | string[] | 条件 | `[]` | `按部门` 时至少 1 个 |
| `people` | string[] | 条件 | `[]` | `自定义人员` 时至少 1 个 |

无草稿。无置顶。无奖励。

### VoteOption

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | number | 系统 | 活动内自增 |
| `campaignId` | number | 系统 | |
| `sortOrder` | number | 系统 | 表单顺序，从 0 |
| `kind` | `文字` \| `员工` \| `作品` | 是 | 普通投票固定 `文字` |
| `label` | string | 条件 | `文字`：选项文案 ≤40，同行活动内不可重复 |
| `imageUrl` | string | 否 | `文字` 可选配图，本地 data URL |
| `employeeId` | string | 条件 | `员工`：通讯录节点 id |
| `employeeName` | string | 条件 | `员工`：选人时快照 |
| `employeeDept` | string | 否 | `员工`：选人时快照 |
| `workTitle` | string | 条件 | `作品`：≤40 |
| `workCover` | string | 条件 | `作品`：封面 data URL，必填 |
| `workIntro` | string | 否 | `作品`：≤200 |

约束：每场至少 2 个选项，最多 20 个。评选投票同一场可混 `员工` 与 `作品`。评选禁止 `文字`。普通投票禁止 `员工`/`作品`。同一场内 `label` 不重复、`employeeId` 不重复、`workTitle` 不重复。

### VoteBallot

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | |
| `campaignId` | number | |
| `optionId` | number | |
| `voterId` | string | 员工 id，匿名时仍保存 |
| `voterName` | string | 真实姓名；展示层按 `anonymous` 打码 |
| `votedAt` | string | |
| `dayKey` | string | `YYYY-MM-DD`，按活动时区用本地日，用于每日额度 |

本轮无「投一票」API。`tally` 由选票聚合，不另存票数字段。

## 状态与编辑权

演示时钟：页面加载时的系统时间 `now`。

| 条件 | 状态 |
|---|---|
| `now < startAt` | 未开始 |
| `startAt ≤ now ≤ endAt` | 进行中 |
| `now > endAt` | 已结束 |

| 操作 | 未开始 | 进行中 | 已结束 |
|---|---|---|---|
| 删除活动 | 允许 | 禁止 | 禁止 |
| 改类型 | 允许（须确认清空选项） | 禁止 | 禁止 |
| 改选项 | 全量 | 可新增；无票选项可改可删；有票选项不可删、不可改 `kind` / 员工 / 作品身份（文字 label / 作品简介仍可改） | 禁止 |
| 改结束时间、简介、每日票数、连投、匿名、范围 | 允许 | 允许 | 禁止 |
| 改开始时间、名称 | 允许 | 禁止 | 禁止 |

删除失败原因文案：`进行中的投票不能删除` / `已结束的投票不能删除`。

## 列表（投票管理）

结构：`ListPageHeading` → `SearchPanel` → `ListTableCard`（工具栏 / 批量栏 / 表）。

副标题：`查询并维护普通投票与评选投票。`

查询（顺序对齐列；>3 默认收起前三项）：投票名称、状态、类型；展开：开始时间、结束时间。日期均为可空 RangePicker。

列：投票名称（链接详情，ellipsis）、状态、类型、开始时间、结束时间、选项数（右对齐）、总票（右对齐）、匿名（是/否）、操作。

状态色：未开始 `default`，进行中 `processing`，已结束 `success`。

工具栏主按钮（左）：创建投票。

行操作：编辑（未结束）；删除（未开始）。超过展示数量收入「更多」。

批量：勾选后出现。仅未开始可删；已选含不可删则提示跳过并列出原因。Footer 主左：确认删除 / 取消。删除确认：「删除后不可恢复」。

空：无数据用规范 `emptyText`；有筛选无结果：「没有符合条件的投票」。

## 新建 / 编辑表单

独立高级表单。面包屑：`投票 > 投票管理 > 新建投票|编辑投票`。底栏固定：保存（左）取消（右）。未保存离开确认。

| 分组 | 字段 | 默认 | 组件 | 必填 / 校验 | 联动 |
|---|---|---|---|---|---|
| 基础 | 投票名称 | 空 | Input ≤50 | 必填 | 无 |
| 基础 | 投票类型 | 普通投票 | Radio | 必填；编辑且已非未开始时禁用 | 切换须确认，确认后清空选项 |
| 基础 | 匿名投票 | 关 | Switch | 否 | 无 |
| 时间 | 开始时间 | 空 | DatePicker showTime | 必填；进行中禁用 | 须早于结束 |
| 时间 | 结束时间 | 空 | DatePicker showTime | 必填 | 须晚于开始 |
| 内容 | 投票简介 | 空 | TextArea ≤500 | 否 | 无 |
| 选项 | 选项列表 | 2 行空 | Form.List | 2–20 | 见下 |
| 规则 | 每人每天可投 | 1 | InputNumber 1–99 | 必填 | 无 |
| 规则 | 允许对同一选项连投 | 关 | Switch | 否 | 无 |
| 范围 | 参与范围 | 全员 | Radio 全员/按部门/自定义人员 | 必填 | 部门树或人员树 |

普通投票选项行：文案必填；可选 Upload 配图（一张，data URL）。

评选投票选项行：先选 `员工` 或 `作品`。员工：TreeSelect 通讯录，必填。作品：标题必填、封面 Upload 必填、简介可选。

主操作在左。不引入 AI 生成。

## 详情

两页签，hash tab：`detail`（默认）、`results`。非法 tab 回落 `detail`。

页头：名称、状态 Tag、类型、返回列表；未结束显示编辑。

**详情页签：** Descriptions：时间、匿名、每日票数、连投、参与范围、简介、选项只读列表（评选显示封面缩略图或姓名/部门）。

**结果页签：**

1. 排名表：名次、选项（普通=文案；员工=姓名；作品=封面+标题）、票数（右对齐）、占比（票数/总票，总票为 0 时显示 `—`）。排序：票数降序，票数相同按 `optionId` 升序。名次并列：同票同名次，下一名次跳号（1、1、3）。
2. 投票记录表：时间、投票人、选项。`anonymous === true` 时投票人列固定「匿名」，不展示 `voterName`。无记录：「暂无投票记录」。未开始且无种子票：排名表空态「尚未开始，暂无投票」。

管理端始终能看结果页签，不因匿名隐藏票数。

## 数据流

| 文件 | 职责 |
|---|---|
| `src/app/navigation.ts` | 应用、菜单、`extraPages`、`siderSelectedKey` |
| `src/app/navigation.test.ts` | 应用存在、顺序、菜单、hash、sider |
| `src/app/App.tsx` | 接线 List / Form / Detail；未知页仍 Placeholder |
| `src/features/voting/model/voting.ts` | 类型、状态、校验、排名、匿名展示 |
| `src/features/voting/model/voteStore.ts` | campaign + option + ballot 内存 store，`useVotes` 订阅 |
| `src/features/voting/pages/VoteListPage.tsx` | 列表 |
| `src/features/voting/pages/VoteFormPage.tsx` | 新建编辑 |
| `src/features/voting/pages/VoteDetailPage.tsx` | 详情 + 结果 |

纯函数（`voting.ts`，无 UI）：

- `resolveVoteStatus(campaign, now)`
- `validateVoteTimeOrder(startAt, endAt)`
- `canDeleteVote(status)`
- `canEditVoteField(status, field)`，`field` 为 `'type' | 'name' | 'startAt' | 'endAt' | 'intro' | 'dailyQuota' | 'allowStackOnSameOption' | 'anonymous' | 'visibility' | 'options'`
- `canMutateVoteOption(status, hasBallots, action)`，`action` 为 `'add' | 'delete' | 'changeIdentity' | 'changeCopy'`（`changeIdentity` = 改 kind / 员工 / 作品标题；`changeCopy` = 改文字 label / 作品简介 / 配图封面）
- `tallyVoteResults(options, ballots)` → 含名次、票数、占比（整数百分比四舍五入；总票为 0 则占比空，不强制总和 100%）
- `displayVoterName(anonymous, voterName)` → `匿名` 或原名
- `wouldExceedDailyQuota(campaign, ballots, voterId, optionId, dayKey)`：当天该人已投次数 ≥ `dailyQuota` 则超额；若 `allowStackOnSameOption === false` 且当天已对该 `optionId` 投过，也超额。本轮只测不接线（给 C 端预留）

Store 行为对齐评优：模块级数组 + listener；`__resetVoteStoreForTests`；刷新页面恢复种子。不写 localStorage。删活动时级联删该活动的选项和选票。

未知 `id`：`message.error` 后回列表。

## 种子

至少 5 场，覆盖：

1. 未开始 · 普通 · 匿名关 · 无票
2. 进行中 · 普通 · 匿名关 · `dailyQuota ≥ 2` · 连投关 · 有票（含同一人同一天投不同选项）
3. 进行中 · 评选 · 混员工+作品 · 匿名开 · 有票
4. 已结束 · 评选 · 匿名关 · 有票，含并列第一
5. 已结束 · 普通 · 每日票数>1 且允许连投 · 有同一选项连投票

参与范围至少各出现：全员、按部门、自定义人员。

## 异常

- 加载：store 同步，无独立 loading。
- 空列表 / 筛选无结果：见列表。
- 校验失败：字段旁报错，保留输入。
- 删除非未开始：不删除，Toast 原因。
- 进行中删除有票选项：表单内禁用删除或提交时报「已有投票的选项不能删除」。
- 无权限：本轮不存在。
- 窄屏：沿用现壳顶栏应用名 + 菜单抽屉。

## 测试

- `voting.test.ts`：状态、时间校验、删除资格、字段编辑权、排名并列、匿名展示、每日额度函数
- `voteStore.test.ts`：增删改；不能删进行中/已结束；删活动级联选项和选票
- 列表 / 表单 / 详情页：渲染关键文案（创建投票、普通投票、评选投票、匿名、每人每天可投、结果页签）
- `navigation.test.ts`：应用 meta、三菜单、隐藏页解析、缺页回落概览、不进 `getDirectApplications(4)`

## 不做

C 端投票页、管理端代投/补票、权限、奖励/积分、与评优或活动关联、概览看板真页、规则设置真页、导入人群、草稿、置顶、localStorage 持久化。
