# 论坛 H5 / 管理后台数据联动

**日期：** 2026-09-20  
**状态：** 已确认，待实现  
**范围：** 论坛 H5 与管理后台共用 `forumStore`；补可见性与改名级联；H5 发楼层回复写同一帖。

## 背景与目标

H5 与后台已读同一 `src/features/forum/model/forumStore.ts`。缺口：

- H5 详情不挡下架 / 待审 / 已驳回帖。
- 后台改论坛名不改帖子 `boardName`，H5 板内列表会空。
- H5 不能写回复，后台评论区看不到员工发言。

目标：同一 SPA 内，后台改板块/帖子，H5 立刻对；H5 发帖、编辑、楼层回复，后台立刻有。

## 决策

| 项 | 选择 |
|---|---|
| 主数据 | 继续 `forumStore`，不新建第二份列表 |
| 持久化 | 不写 localStorage，不上真实后端 |
| H5 回复 | 只发楼层评论，作者固定 `forumClientSelf`（周敏） |
| 嵌套回复 | 不做 |
| 信箱 / PC 论坛 | 不做 |

## 可见性

`clientForum.visibleClientForumTopics` 已过滤 `shelfStatus === 'off'` 与审核 `待审核` / `已驳回`。列表继续用它。

H5 详情 `H5ForumTopic`：找不到帖，或帖不符合上述可见规则，或所属板块不是 `kind === 'forum' && status === 'enabled'` → 文案「帖子不存在」。作者自己的待审帖也不在 H5 露出（与列表一致）。

首页 `H5ForumHome`：只列启用中的论坛板块（已有）。后台 `setForumBoardStatus(..., 'disabled')` 后首页不含该板；直接打开板页继续「论坛不存在或已停用」。

## 改名级联

`saveForumBoard` 更新已有板块且 `name` 变化时：所有 `topics[].boardName === oldName` 改为新名。H5 按 `board.id` 进板，用当前 `board.name` 筛帖，改名后帖仍在该板。

不级联标签改名（`upsertForumTag` 已有）。

## 写路径

| 动作 | API | 结果 |
|---|---|---|
| H5 发帖 | 现有 `publishClientTopic` | 后台主题列表出现；`auditStatus` 仍为「直接发布」 |
| H5 编辑自己的帖 | 现有 `updateClientTopic` | 后台详情标题/正文/图/标签变 |
| 后台置顶 / 下架 / 管理员回复 | 现有 `setTopicPin` / `setTopicShelf` / `addTopicComment` | H5 列表置顶；下架后 H5 不可见；管理员回复 H5 只读展示 |
| H5 楼层回复 | 新 `addClientTopicComment(id, content)` | 走 `withTopicComment(topic, content, forumClientSelf, nowText())`，**不**走 `isForumCommentReplyAccount` |

`addClientTopicComment`：

1. 帖不存在 → `{ ok: false, error: '帖子不存在' }`。
2. `validateForumComment`：空或超过 `FORUM_COMMENT_MAX`（200）→ 对应错误。
3. `mutes` 中存在 `user === forumClientSelf && active` → `{ ok: false, error: '你已被禁言' }`。
4. 否则写入楼层，`commentCount` 用 `topicCommentCount`。

种子 `initialMutes` 里周敏是生效禁言。默认打开 H5 回复失败并 toast「你已被禁言」。成功路径测试先 `releaseMute(1)`（或等价解除周敏）。发帖/编辑本次**不**加禁言拦截，避免扩大现有发帖用例。

H5 详情评论区底栏：输入 + 发送。成功清空输入并刷新列表（store tick）。失败 toast `error`。不提供「回复某某」。

后台 `ForumTopicDetailPage` 已 `useForumTopics()`，周敏楼层自然出现。

## 测试

- `publishClientTopic` 后后台 `filterTopics` / `getForumTopic` 含新标题。
- `setTopicShelf(id, 'off')` 后 H5 板列表与详情都不含该帖。
- `setForumBoardStatus` 停用后首页无该板名。
- 改板块名后 `H5ForumBoard` 仍列出原帖（新 `boardName`）。
- `releaseMute` 后 `addClientTopicComment` 成功；`getForumTopic.comments` 末条 `author === '周敏'`；H5 详情 HTML 含该正文；后台详情 SSR 含周敏。
- 未解除禁言时 `addClientTopicComment` 失败且不追加 comments。
- 现有 H5 发帖/编辑/结构单测仍绿。

## 不做

- 嵌套 `addTopicReply`、审核工作流、跨窗口、PC 论坛、信箱 C 端。
- 浏览数自增、点赞收藏持久化到新实体（已写 `forumStore` 的保持原样）。
- 发帖禁言拦截、改 `forumClientSelf` 身份。
