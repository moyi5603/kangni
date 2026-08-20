# 训练营评论加种 + 仅已结束可发瞬间

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** 活动 2「新员工入职训练营」评论种子加到 6 条主评（含两层回复）；C 端发布精彩瞬间改为仅已结束且报名已通过。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 仍两套壳。

## 背景与目标

训练营评论只有 1 主评 + 1 回复，详情/全页太空。发布瞬间目前「进行中或已结束 + 已通过」都能发；产品改为**只有已结束**且**报名已通过**才能发。

## 决策摘要

| 项 | 选择 |
|---|---|
| 训练营评论 | 保留王芳/李明，补到 **6 主评** + 若干两层回复（含陈产品） |
| 计数 | 仍按主评：`commentCount(2) === 6` |
| 发布资格 | `已通过报名 && activityStatus === '已结束'` |
| 进行中 | 可看瞬间（已有种子则 tab 仍在），无「发布瞬间」 |
| 文案 | 未开始 / 进行中 / 未通过 三条，见下 |
| 不做 | 不改活动 2 状态、不改瞬间种子条数、不改评论树算法、后台表结构 |

## 发布规则

`src/features/activities/model/moment.ts`：

```ts
export function canSubmitMoment(activityStatus: ActivityStatus, approvedSignup: boolean): boolean {
  return approvedSignup && activityStatus === '已结束';
}

export function submitBlockReason(activityStatus: ActivityStatus, approvedSignup: boolean): string | undefined {
  if (activityStatus !== '已结束') {
    return activityStatus === '未开始' ? '活动未开始，暂不能发布瞬间' : '活动结束后才能发布瞬间';
  }
  if (!approvedSignup) return '报名通过后才能发布瞬间';
  return undefined;
}
```

`momentStore.ts` 里两处失败文案改为 `submitBlockReason(...)`，不要自己 `未开始 ? … : 报名通过后…`（进行中会误报「报名通过后」）。

| 场景 | 能发 | 瞬间 tab | 「发布瞬间」 |
|---|---|---|---|
| 活动 1 已结束 + 陈产品已通过 | 是 | 有（有种子） | 有 |
| 活动 2 进行中 + 陈产品已通过 | 否 | 有（有种子） | 无 |
| 活动 12 未开始 + 已驳回 + 无瞬间 | 否 | 无 | 无 |

## 训练营评论种子

保留：

```ts
{ id: 3, activityId: 2, content: '实操课节奏合适。', author: '王芳', createdAt: '2026-08-18 12:30:00', likedBy: [] }
{ id: 13, activityId: 2, content: '讲义能下载就更好。', author: '李明', createdAt: '2026-08-18 13:00:00', parentId: 3, likedBy: [] }
```

在 `related.ts` `comments` 追加（id 15 起，勿复用 1–14）：

```ts
{ id: 15, activityId: 2, content: '导师带教很细。', author: '张悦', createdAt: '2026-08-18 12:40:00', likedBy: ['李明'] }
{ id: 16, activityId: 2, content: '安全课能不能录像？', author: '苏然', createdAt: '2026-08-18 13:10:00', likedBy: [] }
{ id: 17, activityId: 2, content: '团体报名流程顺。', author: '周工', createdAt: '2026-08-18 13:40:00', likedBy: [] }
{ id: 18, activityId: 2, content: '结业证书什么时候发？', author: '赵人事', createdAt: '2026-08-18 14:00:00', likedBy: [] }
{ id: 19, activityId: 2, content: '食堂窗口排队有点长。', author: '钱会', createdAt: '2026-08-18 14:20:00', likedBy: [] }
{ id: 20, activityId: 2, content: '同感，下午跟岗也清楚。', author: '陈产品', createdAt: '2026-08-18 12:55:00', parentId: 15, likedBy: [] }
{ id: 21, activityId: 2, content: '可以问一下培训组。', author: '王芳', createdAt: '2026-08-18 13:20:00', parentId: 16, likedBy: [] }
{ id: 22, activityId: 2, content: '我去群里问。', author: '陈产品', createdAt: '2026-08-18 13:28:00', parentId: 21, likedBy: [] }
{ id: 23, activityId: 2, content: '一般结业当天发。', author: '张悦', createdAt: '2026-08-18 14:08:00', parentId: 18, likedBy: [] }
```

主评 6：`19, 18, 17, 16, 15, 3`（按 `createdAt` 新→旧，与现网建树一致）。

两层示例：全页可见「王芳 回复 苏然」「陈产品 回复 王芳」「陈产品 回复 张悦」「李明 回复 王芳」「张悦 回复 赵人事」。

详情预览（slice 2 主评、无回复）：钱会「食堂窗口排队有点长。」+ 赵人事「结业证书什么时候发？」。因主评 > 2 且有回复 → 「查看全部」。标题 / 底栏 / tab「评论 6」。

## 测试

- 新建 `moment.test.ts`：`canSubmitMoment('已结束', true) === true`；进行中/未开始即使 `true` 报名也为 false；`submitBlockReason('进行中', true) === '活动结束后才能发布瞬间'`；未开始文案不变；已结束未通过 → 「报名通过后才能发布瞬间」。
- `commentCount(2) === 6`。
- H5 详情 `id={2}`：`评论 6`、预览含食堂/结业证书、不含「实操课节奏合适」（第 3 条及以后）、不含「王芳 回复 苏然」。
- H5 评论全页 `id={2}`：`陈产品 回复 王芳`、`实操课节奏合适`。
- `ActivitySocialTabs` 活动 2 `tab="moments"`：有瞬间正文，**无**「发布瞬间」。活动 1 `tab="moments"` 仍有「发布瞬间」。
- `momentStore` 进行中投稿失败走 `submitBlockReason`（若已有提交测试则改断言）。

## 文件

- 改：`related.ts` 评论种子
- 改：`moment.ts` `canSubmitMoment` / `submitBlockReason`
- 改：`momentStore.ts` 失败文案
- 新建：`moment.test.ts`
- 改：评论计数 / H5 详情或全页测试、`ActivitySocialTabs.test.tsx`

## 不做

- 不把训练营改成已结束。
- 不改 `commentTree` / 预览条数 / 头像。
- 不给评论全页加瞬间 tab。
- C 端不用 antd。
