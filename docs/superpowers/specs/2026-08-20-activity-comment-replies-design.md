# 活动评论回复、点赞、删除与全部页

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** H5 / PC 活动详情评论、独立评论全页；`related.comments` 数据；后台评论管理删除连带。精彩瞬间评论、活动赞/收藏 store 不改。  
**关联：** 覆盖 `docs/superpowers/specs/2026-08-20-activity-like-favorite-comment-design.md` 中「不做：C 端删评/回复」。

## 背景与目标

详情评论现在只有作者、时间和正文，不能回、不能赞、不能删自己的。条数一多详情被拉长，也没有「查看全部」。

目标：

1. 别人能回评论，回复最多 3 层可发。
2. 视觉永远两层：主评一层，所有后代二层，文案「A 回复 B」。
3. 主评和回复都能点赞（可取消）。
4. 只能删自己发的；删一条带走子孙。
5. 详情最多 2 条主评楼，超过进独立评论页。

演示用户仍是陈产品。未报名也能评、回、赞、删自己的。

## 决策摘要

| 项 | 选择 |
|---|---|
| 端 | H5 + PC，规则相同，仍两套壳 |
| 全部页 | `#/c/h5/{id}/comments`、`#/c/pc/{id}/comments` |
| 数据 | 扁平 `CommentRecord` + `parentId` + `likedBy` |
| 可发深度 | 最多 3（楼主=1，回楼主=2，再回=3；再点回复仍挂第 3 层） |
| 视觉 | 主评一层；所有后代二层「A 回复 B」 |
| 详情预览 | 最多 2 条**主评**；赞/回/删都能点；主评数 > 2 出「查看全部」 |
| 删 | 自己的评论和回复；连带子孙 |
| 赞 | 记在评论 `likedBy`，不进 `engagementStore` |
| 评论数 | 该活动全部节点（主评+回复） |
| 后台 | 每行一条；删单条/批量连带子孙；加「回复」列 |
| 不做 | 真登录、瞬间评论改树、删别人的、视觉三层缩进、H5/PC 合成门户 |

## 数据

`src/features/activities/model/related.ts` 的 `CommentRecord`：

```ts
export type CommentRecord = BaseRecord & {
  content: string;
  author: string;
  parentId?: number;   // 楼主省略或 undefined
  likedBy: string[];   // 点过赞的人名，可空数组
};
```

现有种子补 `likedBy: []`（或少量其他人名），`parentId` 不写。再为活动 1 增加：

- 至少 1 条回复（`parentId` 指向活动 1 某条主评），方便二层「A 回复 B」。
- 至少 1 条额外主评，使活动 1 主评数 > 2，详情出现「查看全部」。

`restoreRelatedComments()` 继续整表恢复种子。

深度：从该条沿 `parentId` 走到楼主，节点数。楼主 1，直接回复 2，再回 3。`parentId` 指向不存在的父：当楼主（防御），不要扔异常。

发帖：

- 顶层评论：无 `parentId`，作者陈产品。空白 → `'empty'`，现有行为。
- 回复：`parentId = 被回 id`。若被回深度已 ≥ 3，新帖 `parentId` 仍为被回 id（新帖深度也是 3）。被回不存在或活动不匹配 → 忽略、不写。

删：`deleteActivityComment(id)` 仅当 `author === 陈产品` 才删；否则 no-op。删除集合 = 自己 + 所有 `parentId` 链落到这棵的子孙。后台删除**不**检查作者，但同样连带子孙。

赞：`toggleCommentLike(id)`，陈产品在 `likedBy` 里则去掉，否则追加。没有该 id → 忽略。

`commentCount(activityId)` = 该 `activityId` 下记录条数（含回复）。首页 `SocialRow` / 详情底栏用这个。

`listActivityComments` 改为返回树，或另给 `listActivityCommentThreads`：

- 主评：`parentId` 空，按 `createdAt` 新→旧（并列 `id`）。
- 每条主评的 `replies`：全部后代展平，按 `createdAt` **旧→新**。
- 每条回复带展示名：`A 回复 B`（A=`author`，B=父评论 `author`；父缺失则只显示 A）。

预览：`threads.slice(0, 2)`。`HOME_COMMENT_PREVIEW_LIMIT = 2`。

## 展示

### 一条楼

```
{主评作者}                    {时间}
{正文}
赞 {n}   回复   [删除?]

  {A 回复 B}                  {时间}
  {正文}
  赞 {n}   回复   [删除?]
```

- 一层：主评，名字不加「回复」。
- 二层：该主评所有后代，缩进，格式 **「A 回复 B」**。直接回楼主也是「李明 回复 张悦」。
- 二层不按树再缩进。
- 「删除」仅作者是陈产品。
- 赞为切换；已赞有选中态。数字 0 仍可显示「赞」或「赞 0」，两端统一用「赞 {n}」。

### 详情

评论块仍在介绍之后、精彩瞬间之前。最多 2 条主评楼（楼内二层全展示）。主评总数 > 2 时标题旁或列表下「查看全部」。0 条仍「暂无评论」，无查看全部。底栏评论图标继续滚到 `#activity-comments`。

顶层发评：现有 H5 sheet / PC 表单。回复：同一表单，`aria-label` / 标题「回复 @B」。

### 全页

壳标题「评论」，返回该活动详情。列出该活动全部主评楼（同样两层视觉）。活动未发布/不存在：与详情相同的缺失页。也能顶层发评、回、赞、删。

## 路由

`H5Page` 增加 `'comments'`。

`parseCEndHash('#/c/h5/1/comments')` → `{ kind: 'c-end', surface: 'h5', activityId: 1, h5Page: 'comments' }`。PC 同理。`#/c/h5/my` 等现有解析不变。第四段只有精确等于 `comments` 才进全页；其它多余段忽略，仍当活动详情。

`CEndApp`：`h5Page === 'comments'` 且有 `activityId` → 评论全页；不要落到详情。

导航：`goH5ActivityComments(id)` / `goPcActivityComments(id)`。

## 后台

评论管理表格增加列「回复」：楼主「—」，否则「A 回复 B」。删除确认文案可写「将同时删除其下回复」。`deleteOne` / `deleteSelected` 用同一套「id 并子孙」过滤，与 C 端子树规则一致。

## 组件与文件

- 改：`related.ts`（类型+种子）
- 改：`activityComments.ts`（树、预览、回、删、赞、深度）
- 改：`ActivityCommentList.tsx`（两层 UI + 操作；预览/全页用 props 区分条数）
- 改：H5/PC 详情
- 新建：H5/PC 评论全页
- 改：`navigation.ts`、`CEndApp.tsx`、`navigation.test.ts`
- 改：后台 `ActivityRelatedListPage.tsx` 评论删除与列
- 样式：`styles.css` 二层缩进，C 端不用 antd

H5 / PC 不合成一个响应式门户。列表 markup 可各自包一层壳，交互逻辑走 `activityComments.ts`。

## 测试

- 建树：主评新→旧；后代旧→新；文案「A 回复 B」。
- 深度 3 后再回：`parentId` 仍为被回那条。
- 删陈产品一条：子孙没；删别人的：列表不变。
- 赞切换；`commentCount` 含回复。
- 预览只切 2 条主评。
- hash `comments`。
- 详情：活动 1 有查看全部；回复行含「回复」。
- 全页 `CEndApp` `h5Page="comments"` 能挂。
- 后台删带子：子孙条数下降。
- 瞬间评论现有测试不动。

SSR 测赞/删用直接调 store 再 `renderToStaticMarkup`，或测函数；不强制浏览器 click。可用 `previewThreads` 纯函数测预览。

## 不做

- 不改精彩瞬间评论模型。
- 不删别人的评论。
- 不把赞写入 `engagementStore`。
- 不做视觉三层缩进。
- 不把 H5 / PC 合成一个门户。
- C 端不用 antd。
