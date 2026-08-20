# 评论数按主评论统计

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端活动评论数字（首页 `SocialRow`、详情底栏、详情/全页标题「评论 N」）。  
**关联：** 覆盖 `docs/superpowers/specs/2026-08-20-activity-comment-replies-design.md` 中「评论数 = 该活动全部节点」。  
**演示用户：** 陈产品。C 端不用 antd。

## 背景与目标

`commentCount` 现在数全部评论记录（主评+回复）。活动 1 显示 10。产品要按**主评论**计，与详情「只出主评」一致。

## 决策摘要

| 项 | 选择 |
|---|---|
| 计数 | `commentCount(id) = listActivityCommentThreads(id).length` |
| 主评定义 | 与建树相同：`parentId` 空，或父不在该活动列表（孤儿当楼主） |
| 覆盖 | 首页气泡、详情底栏、详情/全页「评论 N」（都走现有 `commentCount`） |
| 活动 1 | 6 |
| 不做 | 后台表格改计数、瞬间评论、改预览条数、改查看全部规则 |

## 实现

`src/features/c-end/activities/model/activityComments.ts`：

```ts
export function commentCount(activityId: number): number {
  return listActivityCommentThreads(activityId).length;
}
```

不新增 API。调用点不用改。`toClientActivity.comments` 自动变成主评数。

## 测试

- `commentCount(1) === 6`（改现有「counts replies」用例，标题改成 counts root threads）。
- `toClientActivity` 活动 1 `comments === 6`。
- `patchRelated` 只滤掉 id 1：`comments === 6`（王芳 `parentId: 1` 升楼主；总主评仍 6）。
- H5 详情含 `评论 6`，不再含 `评论 10`。
- 全页仍渲染回复行（「王芳 回复 张悦」），只是标题数字是 6。

## 文件

- 改：`activityComments.ts` 的 `commentCount`
- 改：`activityComments.test.ts`、`clientActivity.test.ts`、`H5ActivityDetail.test.tsx`

## 不做

- 不改 `related.ts` 种子。
- 不改 `shouldShowActivityCommentViewAll`、`previewCommentThreads`。
- 不改后台 `CommentList`。
- 不改精彩瞬间评论计数。
- C 端不用 antd。
