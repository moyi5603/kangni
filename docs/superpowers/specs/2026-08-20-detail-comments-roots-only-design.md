# 详情只出主评，并加厚评论种子

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端活动详情评论预览；`related.comments` 种子。全页两层展示不改。  
**关联：** 覆盖 `docs/superpowers/specs/2026-08-20-activity-comment-replies-design.md` 中「详情预览楼内二层全展示」。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 仍两套壳。

## 背景与目标

详情预览 2 条主评时，楼下回复一并展开，详情被拉长。种子也偏少，全页不好演示多层回复。

目标：

1. 详情最多 2 条主评，**不展示回复**。
2. 有回复或主评超过 2 条时出「查看全部」。
3. 活动 1 加厚主评/回复（含二层、三层、一条陈产品），活动 2、6 各加 1 条回复。
4. 全页仍两层「A 回复 B」。

## 决策摘要

| 项 | 选择 |
|---|---|
| 详情预览 | 最新 2 条主评，`replies: []` |
| 查看全部 | 主评 > 2 **或** 该活动存在任意 `parentId` |
| 全页 | `listActivityCommentThreads`，带回复 |
| 种子 | 保留 id 1–6；活动 1 加 7–12；活动 2 加 13；活动 6 加 14 |
| 详情仍见 | 李明「下午场次人有点多。」、张悦「开放日讲解很清楚…」 |
| 详情不见 | 「王芳 回复 张悦」、苏然「希望增加名额。」及更旧主评 |
| 数据层 | `submit` / `delete` / `like` / 深度封顶不改 |
| 后台 | 不改交互；多出来的行自然出现 |
| 不做 | 改瞬间评论、antd 上 C 端、改预览条数 2、详情另做组件 |

## 预览

`previewActivityCommentThreads(activityId)`：

1. `buildCommentThreads` / `listActivityCommentThreads` 得到主评新→旧。
2. `slice(0, HOME_COMMENT_PREVIEW_LIMIT)`（仍为 2）。
3. 每条 `{ ...thread, replies: [] }`。

新建：

```ts
export function shouldShowActivityCommentViewAll(activityId: number): boolean {
  const threads = listActivityCommentThreads(activityId);
  if (threads.length > HOME_COMMENT_PREVIEW_LIMIT) return true;
  return threads.some((item) => item.replies.length > 0);
}
```

H5/PC 详情：`showViewAll={shouldShowActivityCommentViewAll(id)}`。不要再用 `allThreads.length > 2`。

全页、列表组件 markup 不改（详情传入的 threads 已无 replies，自然不渲染二层）。

详情主评仍有赞 / 回复 / 删除。点回复仍开 composer，发成功后详情仍看不见楼下（需进全页）。

## 种子

保留现有 id 1–6 内容、作者、时间、`likedBy`、`parentId`。追加：

活动 1：

| id | content | author | createdAt | parentId | likedBy |
|---|---|---|---|---|---|
| 7 | 带家属参观体验很好。 | 赵人事 | 2026-04-12 18:00:00 | — | `[]` |
| 8 | 园区指引牌再大一点。 | 钱会 | 2026-04-12 16:40:00 | — | `[]` |
| 9 | 希望有英文导览。 | 吴工 | 2026-04-12 17:30:00 | — | `[]` |
| 10 | 谢谢认可。 | 陈产品 | 2026-04-12 18:50:00 | 5 | `[]` |
| 11 | 分流可以再明确。 | 苏然 | 2026-04-12 19:15:00 | 2 | `[]` |
| 12 | 同意，孩子也喜欢。 | 王芳 | 2026-04-12 18:10:00 | 7 | `[]` |

活动 2：`{ id: 13, activityId: 2, content: '讲义能下载就更好。', author: '李明', createdAt: '2026-08-18 13:00:00', parentId: 3, likedBy: [] }`

活动 6：`{ id: 14, activityId: 6, content: '周六场次我们内部排一下。', author: '张悦', createdAt: '2026-08-16 15:00:00', parentId: 4, likedBy: [] }`

活动 1 主评新→旧：`2, 1, 7, 9, 6, 8`。  
`commentCount(1) === 10`。  
`listActivityComments(1)` id 新→旧：`[11, 2, 10, 5, 1, 12, 7, 9, 6, 8]`。

`restoreRelatedComments` 仍深拷贝 `likedBy`。

## 测试

- `previewActivityCommentThreads(1)` 的 root id 仍 `[2, 1]`，且 `replies` 皆 `[]`。
- `shouldShowActivityCommentViewAll(1) === true`。
- `listActivityCommentThreads(1)` 张悦楼仍含「王芳 回复 张悦」和陈产品「谢谢认可。」（`陈产品 回复 王芳`）。
- `commentCount(1) === 10`；`toClientActivity` 活动 1 `comments === 10`。
- 只滤掉 id 1、不连带：`comments === 9`。
- H5/PC 详情评论块：有李明/张悦正文；无「王芳 回复 张悦」；无「希望增加名额」；有「查看全部」；标题 `评论 10`。
- 全页仍含「希望增加名额」「王芳 回复 张悦」。
- `activityComments.test.ts` 最新序列 `[11, 2, 10, 5, 1, 12, 7, 9, 6, 8]`。

## 文件

- 改：`src/features/activities/model/related.ts` 种子
- 改：`src/features/activities/model/commentTree.ts` — `previewCommentThreads` 在 slice 之后把每条 `replies` 置 `[]`
- 改：`src/features/c-end/activities/model/activityComments.ts` — 新增 `shouldShowActivityCommentViewAll`
- 改：H5/PC 详情 `showViewAll={shouldShowActivityCommentViewAll(id)}`
- 改：测试 — `commentTree.test.ts`、`activityComments.test.ts`、`clientActivity.test.ts`、H5/PC 详情测试

`previewActivityCommentThreads` 继续调用 `previewCommentThreads`，详情与纯函数同一条路径。

## 不做

- 不改 `HOME_COMMENT_PREVIEW_LIMIT`（仍 2）。
- 不改全页 UI、确认删除、点赞图标。
- 不改精彩瞬间评论。
- 不改后台删除逻辑。
- C 端不用 antd。
