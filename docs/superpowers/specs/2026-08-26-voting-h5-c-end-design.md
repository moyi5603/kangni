# 投票 H5 C 端（普通投票）

**日期：** 2026-08-26  
**状态：** 已确认（对话内锁定方案 1，用户要求一次写完不再分段确认）  
**关联：** `2026-08-25-voting-app-design.md`、`2026-08-25-voting-ordinary-questions-design.md`  
**规范：** C 端沿用现有 H5 壳与 token（`H5ActivityShell`、`src/features/c-end/activities/styles.css`），不套 B 端 Ant Design 后台规范。  
**范围：** 独立投票应用的员工端 H5：列表、详情（答卷 / 结果同页）、我的投票记录。只做普通投票。  
**不做：** 评选投票、PC、登录鉴权、奖励积分、分享海报、与评优打通、管理端代投、按题计次、问答题公开他人原文。

## 背景

B 端投票已能配置普通投票（问卷：单选 / 多选 / 图片单选 / 图片多选 / 问答 / 打分）与评选投票。普通投票提交模型是 `VoteResponse` + `VoteAnswer`，每日额度按整卷次数。C 端此前缺页。本轮补员工 H5，让张悦这类演示员工能看见范围内的普通投票、整卷提交、立刻看实时占比，并按后台 `dailyQuota` 当天累加多次。

## 决策摘要

| 项 | 选择 |
|---|---|
| 应用 | 独立投票，不挂评优、不挂活动 |
| 题型 | 仅普通投票；评选投票列表过滤掉 |
| 页面 | 列表 + 详情 + 我的记录（快照子页） |
| 提交 | 整卷一次提交，不是边选边出条、不是一题一屏 |
| 结果 | 提交后立刻看实时汇总；进行中也看 |
| 额度 | 跟 B 端 `dailyQuota`：每人每天可交 X 次 |
| 计票 | 每次提交都算一张票，占比按提交次数累加；不覆盖旧卷 |
| 当前人 | mock `DEMO_VOTE_USER` = 张悦 / 前端组 |
| 壳 | `H5ActivityShell`；门户加「投票 H5」，隐藏「评优 H5」「评优 H5 管理」 |
| 数据 | 读写现有 `voteStore`，新增提交 API |

## 路由

| Hash | `h5Page` | 页 |
|---|---|---|
| `#/c/h5/votes` | `votes` | 列表，返回门户 |
| `#/c/h5/vote-:id` | `vote-detail` | 详情，返回列表 |
| `#/c/h5/vote-:id/take` | `vote-taking` | 作答，返回详情 |
| `#/c/h5/votes/mine` | `vote-records` | 我的记录，返回列表 |
| `#/c/h5/votes/mine/:responseId` | `vote-record` | 单次答案快照，返回我的记录 |

解析对齐考试：`rawId === 'votes'` 走列表 / 记录；`/^vote-(\d+)$/` 走详情。`voteId` / `voteResponseId` 加进 `CEndLocation`。非法数字当不存在。

C 端门户增加入口：标题「投票 H5」，hint「普通投票 · 手机」，href `#/c/h5/votes`。门户不再展示「评优 H5」「评优 H5 管理」；评优路由仍可用直链打开。

## 当前员工与可见范围

```ts
DEMO_VOTE_USER = { id: '张悦', name: '张悦', department: '前端组' }
```

`id` 对应 `VoteResponse.voterId`。部门取活动通讯录 `personDepartment`，与种子一致。

可见规则（列表与详情共用）：

| `visibility` | 可见条件 |
|---|---|
| `全员` | 可见 |
| `按部门` | 员工部门或其祖先部门落在 `departments` 里（选「研发中心」则前端组可见） |
| `自定义人员` | `people` 含 `DEMO_VOTE_USER.id` |

另须 `type === '普通投票'`。评选投票、范围外投票：列表不出；直链详情给无权限空态。

按部门匹配用 `orgDepartmentTree`：把勾选节点及其全部子孙 `value` 收成集合，再看员工叶子部门是否在集合中。

种子对照（张悦）：

| id | 名称 | 状态（相对 now） | 可见 | 列表默认「进行中」 |
|---|---|---|---|---|
| 1 | 午餐口味征集 | 未开始 | 是（全员） | 否，在「未开始」 |
| 2 | 部门团建目的地 | 进行中 | 是（研发中心 ⊃ 前端组） | 是 |
| 5 | 工装颜色连投测试 | 已结束 | 否（生产中心） | 否 |

张悦在 id=2 有一条昨日答卷，今日已投 0 / 可投 2，列表 CTA 为「去投票」。我的记录仍能看到昨日那条。

## 页面

### 列表 `#/c/h5/votes`

- 顶栏标题「投票」；右侧文字按钮「我的记录」（触控区 ≥44px）。
- 状态胶囊：进行中 / 未开始 / 已结束，默认进行中。无搜索、无分类。
- 卡片：名称、开始～结束时间（`MM-DD HH:mm`）、状态。进行中且今日剩余次数 >0：剩余=额度时写「去投票」，否则写「今日还可投 n 次」；剩余=0 写「看结果」。未开始写「未开始」。已结束写「看结果」。点整卡进详情。
- 排序：开始时间新到旧。
- 空：「暂无投票」。
- 样式：复用考试列表卡片密度与 `c-tabs` / `c-empty`，不新开视觉体系。

### 详情 `#/c/h5/vote-:id`

介绍页，不作答。点「开始投票 / 再投一票」进 `#/c/h5/vote-:id/take`。

| 条件 | 详情页 |
|---|---|
| 不存在 / 非普通投票 | 空态「投票不存在」，回列表 |
| 不可见 | 空态「无权参与该投票」，回列表 |
| 未开始 | 简介 + 时间 + 额度；底栏禁用「未开始」 |
| 已结束 | 简介 + 实时汇总；无底栏 |
| 进行中且今日已投 =0 | 简介；底栏「开始投票」 |
| 进行中且今日已投 >0 | 简介 + 实时汇总；剩余 >0 底栏「再投一票」，剩余 =0 提示「今日次数已用完」 |

### 投票页 `#/c/h5/vote-:id/take`

整卷作答。返回详情。提交成功回详情看结果。未开始 / 已结束 / 次数用完 / 无权限不出表单。

**作答**

- 头：名称、简介（空则省略）、时间、`今日已投 a / 可投 X`。
- 题按 `sortOrder`。题号 `1.` + 题干 + 题型弱提示。
- 单选：文字 radio 列表，点整行。
- 多选：checkbox 列表，点整行，至少 1 项，无上限。
- 图片单选 / 图片多选：跟题目 `imageLayout`。`上图下文` 纵向卡片；`左图右文` 左图右文案。图必显；无 `label` 只显示图。选中态描边主色。
- 问答：多行，placeholder「请输入」，上限 500 字。
- 打分：`minScore`～`maxScore` 整数点选（不是 5 星写死）。
- 全部必填。底栏固定「提交」，高度 ≥44px，主内容留足 padding 避免被挡。
- `active:scale-95` 或等价按压缩放。

**结果态**

- 头：名称、时间、今日已投 / 可投。
- 选择题：复用 `tallyQuestionChoices`（多选按选项被勾次数计，与 B 端结果页同一口径）条形 + 票数 + 百分比。该题无人选时 `percent` 为 `null`，不写 0%，条为空。标记「本次」用本人**最近一条**答卷（刚交或今日最后一次）。
- 打分：均分（`averageQuestionScore`，无则「暂无」）+ `scoreDistribution`。
- 问答：只显示「已收集 n 条」，不列出任何人原文（含非匿名场）。本人原文只在记录快照里。
- 进行中且剩余 >0：底栏「再投一票」，链到投票页空白新卷，不清旧票。
- 已结束：无再投。

### 我的记录 `#/c/h5/votes/mine`

- 当前人全部普通投票 `VoteResponse`，新到旧。
- 行：投票名称、提交时间、`当天第 n / X 次`（n 为该 `dayKey` 内按时间排序的序号，X 为该场 `dailyQuota`）。点行进快照。
- B 端删除投票会级联删答卷，记录页不会出现孤儿行，不做「已删除的投票」回落。
- 空：「暂无投票记录」。

### 快照 `#/c/h5/votes/mine/:responseId`

- 只读该次 `VoteAnswer`。选择题标出当时选项；问答展示当时原文；打分展示当时分数。
- 不是实时汇总。无提交按钮。
- `responseId` 不是当前人的：空态「记录不存在」。

## 校验与提交

客户端先校验，再调 store。文案：

| 情况 | Toast / 底栏 |
|---|---|
| 单选 / 图片单选未选 | 「请完成全部题目」 |
| 多选 / 图片多选 0 项 | 「请完成全部题目」 |
| 问答 trim 后空 | 「请完成全部题目」 |
| 打分未点 | 「请完成全部题目」 |
| 问答 >500 | 「补充说明不能超过 500 字」 |
| 未开始 | 底栏禁用，不提交 |
| 已结束 | 不展示提交 |
| `wouldExceedSurveyQuota` | 「今日投票次数已用完」 |

答案形状对齐 B 端：

- 单选 / 图片单选：`choiceIds` 长度 1
- 多选 / 图片多选：`choiceIds` ≥1
- 问答：`text` 非空，`choiceIds` 空，`score` null
- 打分：`score` 落在 `[minScore, maxScore]`，其余空

`submitVoteResponse`（新，写在 `voteStore`）：

1. 活动存在、类型普通、状态进行中、当前人可见。
2. `wouldExceedSurveyQuota` 为 false。
3. 题目集合与当前问卷一致（缺题 / 题 id 对不上则失败，「提交失败」）。
4. 追加 `VoteResponse`（`submittedAt` / `dayKey` 用本地 now）和对应 `VoteAnswer`，`emit`。
5. 成功返回新 `responseId`。

时钟与 B 端一致：`dayjs().format('YYYY-MM-DD HH:mm:ss')`，`dayKey` 为日期前 10 位。不另开演示时钟。

匿名：照样写 `voterId` / `voterName`。C 端结果页不展示他人姓名。本轮无「谁投了」列表。

## 数据流

```
voteStore (campaigns / questions / responses / answers)
        ↑ submitVoteResponse
clientVote.ts
  DEMO_VOTE_USER
  canSeeOrdinaryVote
  listVisibleOrdinaryVotes(status)
  remainingQuota / todayCount
  buildResultView
        ↑
H5VoteList / H5VoteDetail / H5VoteTaking / H5VoteRecords / H5VoteRecord
```

不复制一份投票主数据。C 端只加过滤、额度、结果拼装和提交封装。`useVotes()` 订阅 store，提交后列表 / 详情 / 记录一起刷新。

部门匹配、额度计算放 `clientVote.ts`（或薄封装 `voting.ts` 的纯函数），单测覆盖。

## 异常

| 场景 | 表现 |
|---|---|
| 列表无可见场 | 「暂无投票」 |
| 详情 id 无效 / 评选 | 「投票不存在」 |
| 详情不可见 | 「无权参与该投票」 |
| 记录空 | 「暂无投票记录」 |
| 快照越权 | 「记录不存在」 |
| 提交中 | 按钮 loading，防连点；mock 同步无骨架全屏 |
| 提交失败 | Toast「提交失败」，留在表单，已填内容保留 |

无独立网络层。无权限登录页。

## 视觉与交互

- Mobile first，单列，`H5ActivityShell` 最大宽度居中（现壳已有）。
- Token：`--c-bg` / `--c-card` / `--c-text` / `--c-muted` / `--c-orange` / `--c-ongoing` / `--c-ended`。
- 模块间距 8–16px，卡片 padding 12–16px。
- 主操作在底栏拇指区。图标按钮要有 `aria-label`（返回、我的记录若只图标）。
- 选择题选中：描边 + 浅底，不要只靠颜色。
- 占比条：轨道浅灰，填充主色，数字右对齐。对比度正文 ≥ 4.5:1。
- 新样式写 `src/features/c-end/voting/styles.css`，`CEndApp` 引入。不改活动 / 考试样式文件来「顺便」改投票。

## 文件

| 路径 | 职责 |
|---|---|
| `src/features/c-end/voting/model/clientVote.ts` | 当前人、可见、列表、额度、结果拼装 |
| `src/features/c-end/voting/model/clientVote.test.ts` | 纯函数 |
| `src/features/c-end/voting/h5/H5VoteList.tsx` + test | 列表 |
| `src/features/c-end/voting/h5/H5VoteDetail.tsx` + test | 详情介绍 / 结果 |
| `src/features/c-end/voting/h5/H5VoteTaking.tsx` + test | 作答 |
| `src/features/c-end/voting/h5/H5VoteRecords.tsx` + test | 记录 + 快照可同文件或拆 `H5VoteRecord.tsx` |
| `src/features/c-end/voting/styles.css` | 投票 H5 |
| `src/features/voting/model/voteStore.ts` | `submitVoteResponse` 及按 response 取答案 |
| `src/features/voting/model/voteStore.test.ts` | 提交 / 超额 |
| `src/app/navigation.ts` + test | hash |
| `src/app/CEndApp.tsx` | 挂页 |
| `src/features/c-end/portal/CEndPortal.tsx` | 入口 |

种子：不强制新增场次。六种题型里种子已有单选 / 问答 / 打分 / 图片单选。多选、图片多选仍必须能渲染（组件按 `type` 分支）；可用详情测试夹具覆盖，不必为演示改 B 端种子。

## 验收

1. 门户能进投票列表。张悦默认「进行中」只看到「部门团建目的地」。
2. 「未开始」能看到「午餐口味征集」，底栏「未开始」禁用，不能进投票页作答。
3. 「已结束」看不到工装场（生产中心）。
4. 打开团建详情点「开始投票」进投票页：四题可填；缺题提交 toast「请完成全部题目」。
5. 提交成功回详情看结果：目的地 / 海报有占比条；满意度有均分；补充目的地只显示已收集条数。
6. 再投一票进空白新卷；再交一次后今日 2/2，不能再交；两次都计入占比。
7. 我的记录能看到张悦的历史 + 新提交；点进快照看到当时答案，不是最新汇总。
8. 直链评选 id 或不存在 id 为空态。
9. 相关 vitest 通过。

## 测试要点

- `canSeeOrdinaryVote`：全员 / 本中心叶子部门 / 外中心 / 自定义名单内外 / 评选过滤。
- `wouldExceedSurveyQuota` 经 `submitVoteResponse`：第 X 次成功，第 X+1 次失败。
- 列表 tab 过滤与 CTA 文案（剩余 2 / 剩余 1 / 用完）。
- 详情：开始投票进 take；提交后结果文案；再投一票链到 take；已结束无作答入口。
- 投票页：未开始 / 无权限 / 超额拦截；表单提交回详情。
- 记录：按时间倒序；快照只读。
- navigation：四个 hash 解析与生成。

## 不做（再列一次）

评选 H5、PC 投票、改票覆盖旧卷、问答题广场、匿名开关的 C 端设置、推送、分享、未开始倒计时组件、搜索、与活动/评优跳转。
