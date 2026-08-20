# 评论点赞图标与删除二次确认

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端活动评论操作行（详情预览 + 评论全页，H5 / PC）。  
**关联：** 覆盖 `docs/superpowers/specs/2026-08-20-activity-comment-replies-design.md` 中「赞 {n}」文案，以及「点删除立刻调 `onDelete`」。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 仍两套壳。

## 背景与目标

评论操作行现在是文字「赞 {n}」；点「删除」立刻删，无确认。

目标：

1. 赞改成与活动底栏相同的拇指图标 + 数字。
2. 删自己的评论 / 回复要二次确认；取消或点遮罩不删。

## 决策摘要

| 项 | 选择 |
|---|---|
| 赞 | 复用 `IconLike` + `likedBy.length`（含 0）；已赞 `is-on` |
| 赞无障碍 | `aria-label="点赞"`，`aria-pressed` |
| 删确认 | H5 `c-sheet`，PC `c-modal` |
| 确认内容 | 共享 `ActivityDeleteConfirm` |
| 列表 | `ActivityCommentList` 加 `surface: 'h5' \| 'pc'`，内部持 `pendingId` |
| 数据 | `deleteActivityComment` / `toggleCommentLike` 不改 |
| 后台 | 已有确认，不改 |
| 种子 | 不加陈产品评论；先发一条才看得到删除 |
| 不做 | antd 上 C 端、`window.confirm`、改瞬间评论、改活动底栏、改后台 |

## 赞

操作行赞按钮：

```
<IconLike /> {n}
```

- `n = item.likedBy.length`，0 也显示。
- 已赞：`c-comment-like is-on`（与现有选中态一致）。
- 可见文字「赞」去掉。数字保留。
- 切换逻辑仍走 `onLike` → `toggleCommentLike`。

底栏 `DetailEngageBar` 不改。

## 删除确认

点「删除」：

1. 列表设 `pendingId = item.id`。
2. **不**调用 `onDelete`。
3. 按 `surface` 弹出确认层。

确认层文案（主评无回复也同一句）：

- 标题：`删除评论`
- 正文：`删除后将同时删除其下回复，且无法恢复。`
- 按钮：`取消`、`确认删除`

确认删除：`onDelete(pendingId)`，清 `pendingId`。  
取消 / 点遮罩：只清 `pendingId`，store 不变。

「删除」按钮仍仅 `author === 陈产品`。确认层不负责鉴权。

## 组件

- `ActivityDeleteConfirm`：标题、正文、两按钮。`onCancel` / `onConfirm`。
- `H5DeleteSheet`：`c-sheet-backdrop` + `c-sheet`，`role="dialog"`，`aria-label="删除评论"`。
- `PcDeleteModal`：`c-modal-backdrop` + `c-modal`，同样 dialog。
- `ActivityCommentList`：`surface: 'h5' | 'pc'`。从 `../h5/H5DeleteSheet` 与 `../pc/PcDeleteModal` 引入壳。`pendingId` 有值时渲染对应壳。
- 详情 / 全页四处调用处补 `surface`（H5 `'h5'`，PC `'pc'`）。

样式：确认层沿用现有 sheet/modal 和 `c-signup-actions` / `c-btn`。赞按钮内图标尺寸对齐底栏 `c-icon`。

## 测试

- 活动 1 详情评论块：含 like svg（`c-icon` / `viewBox`），**不含**文案「赞 0」或「赞 2」；仍含「回复」。
- 陈产品 `submitActivityComment` 后再渲染详情：出现「删除」。默认关闭确认层，无「确认删除」。
- `ActivityDeleteConfirm` / `H5DeleteSheet` 单独 SSR：含「删除评论」「无法恢复」「确认删除」；点确认的回调在组件测试里用函数断言（SSR 点不了 click，测 markup + 数据层 cascade 已有）。
- 现有 `deleteActivityComment` 级联测试不动。
- 瞬间评论、后台评论页现有测试不动。

## 文件

全部放 C 端活动目录，列表从 `components/` 引用壳（避免列表依赖页面）：

- 新建：`src/features/c-end/activities/components/ActivityDeleteConfirm.tsx`
- 新建：`src/features/c-end/activities/h5/H5DeleteSheet.tsx`
- 新建：`src/features/c-end/activities/pc/PcDeleteModal.tsx`
- 改：`ActivityCommentList.tsx`（`surface`、`pendingId`、赞图标、弹确认）
- 改：H5/PC 详情与两个评论全页，传入 `surface`
- 改：`styles.css`（赞按钮内图标对齐，必要时确认层间距）
- 改：`H5ActivityDetail.test.tsx`（「赞 」→ 图标/数字）
- 新建：`ActivityDeleteConfirm.test.tsx`（确认文案）

## 不做

- 不把确认逻辑复制到四个页面。
- 不改 `related.ts` 种子。
- 不改后台 `CommentList` 确认。
- C 端不用 antd。
- 不改精彩瞬间评论。
- 不把赞写入 `engagementStore`。
