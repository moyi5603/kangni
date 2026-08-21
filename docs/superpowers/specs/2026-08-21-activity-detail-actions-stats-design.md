# 活动详情页操作区 + 指标统计设计

日期：2026-08-21
状态：已确认

## 背景

活动详情页（Tab 化改造后）顶部操作只有审核/提交审批/编辑/返回。运营需要在详情页直接完成复制创建、删除、截止报名，并一眼看到活动关键数据。

## 页面结构

自上而下：

1. 标题行：标题、类型/审核/发布状态 Tag、时间副标题（不变）
2. **按钮区行**：右对齐，Flex wrap
3. **指标行**：6 张 Statistic 卡
4. Tabs（不变）

## 按钮区

| 按钮 | 显示条件 | 行为 |
|---|---|---|
| 审核 | 现有 `canReviewActivity` | 不变 |
| 提交审批 | 现有 `canSubmitApproval` | 不变 |
| 编辑修改 | 恒显示 | 原「编辑」改文案，跳编辑页不变 |
| 复制创建 | 恒显示 | 见下 |
| 截止报名 | 仅当前处于报名期（now ≤ signupEndAt），不按发布状态隐藏 | 见下 |
| 删除 | 恒显示 | 见下 |
| 返回 | 恒显示 | 不变 |

主次：审核/提交审批为 primary（现有逻辑），其余 default。

### 复制创建

- 跳转 `activity-create/{源活动 id}`（复用现有 recordId 段：`#/activities/activity-create/3`）
- `ActivityFormPage` create 模式：`recordId` 存在时取源活动，预填全部业务字段：
  - 预填：coverUrl、title（原样，用户自改）、type、category、tags、startAt、endAt、location、organizer、phone、detailHtml、visibility、departments、customPeople、visibilityMinSeniorityYears、importFileName、importedPeople、signupStartAt、signupEndAt、signupSettings、itinerary、extraFeeRule
  - 不预填（走新建默认）：id、auditStatus、publishStatus、activityStatus、createdAt、publishedAt、pinned
- 时间字段经现有 `toDateTimeRange` 转 RangePicker 值
- 源活动 type 若已被规则关闭新建：预填值保留，Radio 该项 disabled 显示，保存时现有守卫拦截提示
- 表单 key 已含 recordId（App.tsx `key={page-recordId}`），挂载即读 initialValues，无需响应式处理

### 截止报名

- 确认弹窗：「确认截止「{title}」报名？截止时间将改为现在，C 端立即不可报名。」
- 确认后：`signupEndAt` 设为当前时间（`YYYY-MM-DD HH:mm`），`patchActivities` 更新
- C 端无需改动：现有 `isSignupOpen` / 按钮态按 `now > signupEndAt` 判定，自然显示「报名已截止」
- 恢复路径：编辑页改报名时间（弹窗文案中提示）

### 删除

- 确认弹窗：「确认删除「{title}」？删除后不可恢复。」
- 确认后：`patchActivities` 过滤删除该活动，`message.success` 提示，`onBack()` 返回活动列表
- 关联数据（报名/评论/瞬间/问卷/奖品记录）不清理：按 activityId 悬挂，不影响其他活动；详情页已删除活动走「未找到该活动」分支

## 指标行

6 张 `Statistic` 卡（一行 6 列，窄屏 wrap），全部从现有 store 实时计算：

| 指标 | 口径 | 数据源 |
|---|---|---|
| 报名人数 | 状态 ≠ 已取消 的报名数 | `useRelated('signups', id)` |
| 待审核报名 | 状态 = 待审核 数 | 同上 |
| 报名额使用率 | 报名人数 ÷ Σ 各分组 limit；全部不限（Σ limit = 0）显示 `—`；百分比取整 | signupSettings + signups |
| 评论数 | 评论总数（含回复） | `useRelated('comments', id)` |
| 精彩瞬间数 | 瞬间总数 | momentStore `useMoments`（按 activityId 过滤） |
| 问卷回收数 | Σ responseCount | `useRelated('surveys', id)` |

指标行放在按钮区下、Tabs 上，任何 tab 下恒见。

## 纯函数

新增 `src/features/activities/model/activityStats.ts`（可单测）：

```ts
export type ActivityStats = {
  signupCount: number;      // 状态≠已取消
  pendingSignupCount: number;
  quotaUsage: number | null; // 0-100 取整；null = 名额不限
  commentCount: number;
  momentCount: number;
  surveyResponseCount: number;
};

export function computeActivityStats(input: {
  signups: SignupRecord[];
  comments: CommentRecord[];
  moments: MomentRecord[];
  surveys: SurveyRecord[];
  signupSettings: SignupSetting[];
}): ActivityStats
```

## 不做

- 浏览量（模型无字段，不加 mock）
- 截止报名独立标志字段（采用一次性改时间方案）
- C 端任何改动
- 列表页改动

## 测试

- `activityStats.test.ts`：口径单测（含已取消不计入、名额不限为 null、百分比取整、空数据全 0）
- 回归：`npm test -- src/features/activities src/app`、`npx tsc --noEmit`、`python3 scripts/check_ui_conformance.py --root .`
- 手测：复制创建预填完整；截止后 C 端报名按钮变「报名已截止」；删除后列表无该活动且旧详情 hash 走未找到分支
