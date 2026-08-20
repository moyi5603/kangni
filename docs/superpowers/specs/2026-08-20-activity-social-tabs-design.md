# 活动详情：评论 / 精彩瞬间 Tab

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端活动详情（H5 / PC）把评论与精彩瞬间收成一行 tab；结束后仍可发瞬间；无内容且不能发则藏瞬间 tab。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 仍两套壳。评论全页、后台瞬间管理不做。

## 背景与目标

详情页评论和精彩瞬间上下堆。要同一行 tab 切换。活动结束后报名已通过的人仍能发瞬间。没有可见瞬间且当前用户不能发时，不露「精彩瞬间」tab。

## 决策摘要

| 项 | 选择 |
|---|---|
| 结构 | 共享 `ActivitySocialTabs`，H5/PC 详情共用 |
| 默认 tab | 评论 |
| 瞬间 tab 显示 | 有可见瞬间 **或** `canSubmitMoment` |
| 都没有 | 不画 tab 条，只渲染评论（保留「评论 N」标题） |
| 非当前 tab | 不挂载 |
| 发布资格 | 不变：报名已通过 +（进行中 **或** 已结束） |
| 活动 1 种子 | 陈产品报名改为已通过，方便开放日演示结束后发布 |
| 已驳回演示 | 挪到活动 12「秋季消防演练」 |
| 不做 | URL `?tab=`、评论全页加 tab、后台改、合并 H5/PC、antd |

## 显示规则

```ts
export function shouldShowMomentsTab(momentCount: number, canSubmit: boolean): boolean {
  return momentCount > 0 || canSubmit;
}
```

`momentCount` = `useClientMoments(activity.id).length`（已通过 + 自己的待审核/已驳回）。  
`canSubmit` = `useCanSubmitMoment(activity)`，内部仍是 `canSubmitMoment(activityStatus, approvedSignup)`。

| 场景 | 瞬间 tab | 「发布瞬间」 |
|---|---|---|
| 活动 1 开放日：已结束、有瞬间、陈产品已通过 | 有 | 有（在瞬间面板） |
| 活动 12 消防演练：未开始、无瞬间、陈产品已驳回 | 无 | 无 |
| 能发但 0 条可见瞬间 | 有 | 有，空态「还没有精彩瞬间」 |
| 不能发且 0 条 | 无 tab 条 | 无 |

未开始仍不能发（`submitBlockReason` 文案不变）。

## UI

有瞬间 tab 时：

```
[评论 6]  [精彩瞬间]
查看全部                         ← 仅评论面板
（评论列表，两列头像布局不变）

[评论 6]  [精彩瞬间]     [发布瞬间]  ← 仅瞬间面板且 canSubmit
（MomentFeed 卡片）
```

- Tab 文案：`评论 {commentCount}`（根评论数，与现网一致）、`精彩瞬间`（不加数量）。
- Tab 内 **去掉** 列表/Feed 的 h2，避免双标题。`hideTitle` 只在画出 tab 条时为 true。
- 「查看全部」仍进 `#/c/h5/{id}/comments` / `#/c/pc/{id}/comments`。全页不加瞬间 tab。
- 底栏/侧栏「评论」：切到评论 tab → 滚到 `#activity-social` → 仍打开写评/回复 sheet（现有行为保留）。
- `role="tablist"` / `role="tab"` / `aria-selected`。触控最小高度 44px。C 端不用 antd。

无瞬间 tab 时：现有 `ActivityCommentList` 原样（有 h2「评论 N」）。

## 组件

新建 `src/features/c-end/activities/components/ActivitySocialTabs.tsx`：

```tsx
export function ActivitySocialTabs({
  activity,
  tab,
  onTabChange,
  comments,
  moments,
}: {
  activity: Activity;
  tab: 'comments' | 'moments';
  onTabChange: (tab: 'comments' | 'moments') => void;
  comments: ReactNode;
  moments: ReactNode;
})
```

详情页持有 `tab` 状态，默认 `'comments'`。若 `shouldShowMomentsTab` 为 false 而 `tab === 'moments'`，当作评论面板渲染。

`ActivityCommentList` / `MomentFeed` 增加 `hideTitle?: boolean`。`id="activity-comments"` 留在评论 section。包一层 `id="activity-social"`。

H5 / PC `*ActivityDetail`：用 `ActivitySocialTabs` 包现有两块，不再上下叠放。

CSS（`styles.css`）：`.c-social-tabs`、`.c-social-tab-list` 一行、选中底边品牌色。不改评论/瞬间内部卡片样式。

## 种子

`related.ts` 报名 `id: 14`（活动 1 / 陈产品）：`已驳回` → `已通过`。

新增报名 `id: 17`：

```ts
{ id: 17, activityId: 12, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已驳回', createdAt: '2026-04-12 10:00:00' }
```

`signupStore.ts`：

- `DEMO_CLIENT_SIGNUPS` 里活动 1 改为 `已通过`；原已驳回那条改为 `activityId: 12`，状态仍 `已驳回`。
- `DEMO_RELATED_IDS` 增加 `12: 17`。

「我的报名」后果：

| Tab | 现在 | 改后 |
|---|---|---|
| 已驳回 | 春季员工开放日 | 秋季消防演练 |
| 已结束 | 空 | 春季员工开放日 |

同步改：`signupStore.test.ts`、`related.test.ts`、`H5MySignups.test.tsx`、`PcMySignups.test.tsx`。`clientActivity.test.ts` 里自造 fixture 的 `rejected → [1]` 保持不动（不是种子）。

## 测试

新建 `shouldShowMomentsTab` 单测（或放 `ActivitySocialTabs.test.tsx` 同文件）：有瞬间 / 能发 / 两者皆无。

`ActivitySocialTabs.test.tsx`（`renderToStaticMarkup`）：

- 活动 1：`role="tablist"`，含「评论 6」「精彩瞬间」；默认面板有「开放日讲解很清楚」「查看全部」，无瞬间正文「开场致辞很有感染力」。
- 活动 1 且 `tab="moments"`：有「发布瞬间」、有「开场致辞很有感染力」。
- 活动 12：无 tablist、无「精彩瞬间」、有「评论」。

改 `H5ActivityDetail.test.tsx`：不要再用「评论块 slice 到精彩瞬间」。改断言：默认有 `c-social-tab` + 评论预览；`精彩瞬间` 只作为 tab 文案出现时，预览里仍无「王芳 回复 张悦」。Engage 栏顺序用例：评论 tab 文案出现在 `#activity-social` 内即可，不再要求瞬间 Feed 排在评论 DOM 之后。

`PcActivityDetail.test.tsx`：活动 1 含 tab；活动 2（有瞬间、进行中、已通过）同样有 tab。

`MomentFeed.test.tsx` 头像用例仍直接渲染 Feed，不经 tab。

`npm test` 全绿。`tsc -b` 本需求文件无新错。

## 文件

- 新建：`ActivitySocialTabs.tsx` + 测试；`shouldShowMomentsTab`（可与 tabs 同文件或 `model/activitySocialTabs.ts`）
- 改：`ActivityCommentList.tsx`、`MomentFeed.tsx`、`styles.css`
- 改：`H5ActivityDetail.tsx`、`PcActivityDetail.tsx` 及对应测试
- 改：`related.ts`、`signupStore.ts` 及报名/我的报名测试

## 不做

- 不改 `canSubmitMoment` 公式。
- 不给评论全页加瞬间。
- 不改后台瞬间/报名表结构（只改两条种子状态/归属）。
- C 端不用 antd。不合并 H5/PC 门户。
- 不把 tab 写入 hash。
