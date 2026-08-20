# 活动详情内嵌评论 + 主评滚动分页

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端取消活动评论二级页；详情评论 tab 展示楼层；每次露出 10 条主评，整页近底再加载。详情保留「写评论」。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 两套壳。

## 背景与目标

现详情只预览 2 条主评，「查看全部」进 `#/c/h5/:id/comments`（PC 同路径）。产品不要二级页：详情看全部评论，滚动按主评分页。

## 决策摘要

| 项 | 选择 |
|---|---|
| 二级页 | 删除。旧 `/comments` hash 落到该活动详情（默认评论 tab） |
| 分页 | 主评，`COMMENT_PAGE_SIZE = 10`。回复随已露出主评整楼 |
| 滚动 | 详情整页滚。仅评论 tab 近底加载。瞬间 tab 不加载评论 |
| 写主评 | 评论 tab 内「写评论」，沿用现 H5 底栏 / PC 弹层 |
| 种子 | 不补。活动 1/2 各 6 主评，首屏一次出齐。分页测用 `patchRelated` |
| 不做 | 后台评论、瞬间分页、改建树、antd |

## 模型

`commentTree.ts`：用 `COMMENT_PAGE_SIZE = 10` 替代详情预览常量用途。可删 `HOME_COMMENT_PREVIEW_LIMIT`（仅预览 2 条）及 `previewCommentThreads` 若无其它引用。

`activityComments.ts`：

```ts
export function sliceCommentThreads(threads: CommentThread[], limit: number): CommentThread[] {
  return threads.slice(0, Math.max(0, limit));
}
```

`listActivityCommentThreads` 仍返回全部主评（新→旧）。详情不再调用 `previewActivityCommentThreads` / `shouldShowActivityCommentViewAll`。这两函数删除（或仅测试过渡后删）。

`commentCount` 仍 = 主评条数，tab 文案「评论 N」不变。

## UI

`ActivityCommentList`：

- 入参改：完整 `threads` + 可选 `onCompose`（写主评）。去掉 `showViewAll` / `onViewAll`。
- 内部 `visibleCount`，初值 `min(COMMENT_PAGE_SIZE, threads.length)`。
- 渲染 `sliceCommentThreads(threads, visibleCount)`。
- `threads.length` 变化时（新评插顶）：`visibleCount = max(visibleCount, min(COMMENT_PAGE_SIZE, threads.length))`。
- 底哨兵：还有未露出主评且当前是评论列表时渲染。`IntersectionObserver` 进入视口则 `visibleCount += COMMENT_PAGE_SIZE`（不超过总数）。无 Observer（SSR 测）不抛错、不自动加页。
- 无「查看全部」。
- 评论 tab 内「写评论」按钮，点 `onCompose`。回复仍楼内「回复」。

H5/PC 详情：评论 slot 传全量 threads；写评论打开现 `H5CommentSheet` / PC 评论弹层（与现回复同一套）。瞬间 tab 结构不变。

## 路由

`parseCEndHash`：`extra === 'comments'` 不再设 `h5Page: 'comments'`，与无 extra 一样 `{ kind: 'c-end', surface, activityId }`。

删除：`H5ActivityComments`、`PcActivityComments` 及其测试、`goH5ActivityComments` / `goPcActivityComments` / `toH5ActivityCommentsHash` / `toPcActivityCommentsHash`。`CEndApp` 不再渲染 comments 页。`H5Page` 去掉 `'comments'`（若只用于活动评论）。

课程评论 `course-comments` 不动。

## 测试

- `sliceCommentThreads`：12 条 limit 10 → 前 10；limit 10 且只有 6 → 6。
- 详情 H5/PC：活动 1 无「查看全部」；6 主评全文可见（含预览曾隐藏的楼）。活动 2 全页曾有的「陈产品 回复 王芳」在详情可见。
- `patchRelated` 造 12 主评：首屏 HTML 有第 1～10 楼文案、无第 11～12；把 `visibleCount` 加到 20 的路径若不便测 Observer，至少单测 slice。
- `parseCEndHash('#/c/h5/1/comments')` 无 `h5Page: 'comments'`，有 `activityId: 1`。PC 同理。
- 导航测试不再要求 `toH5ActivityCommentsHash`。
- 列表页「我的报名」里「查看全部」与活动评论无关，不改。

## 范围外

后台、评论树算法、瞬间 feed 分页、真实服务端 cursor。
