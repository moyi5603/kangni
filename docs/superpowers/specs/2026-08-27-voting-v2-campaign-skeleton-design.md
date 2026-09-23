# 投票版本2 第一包：活动骨架

**日期：** 2026-08-27  
**状态：** 已确认  
**参考：** [人人微投票创建页](https://www.pingxuan520.com/create?id=vj93Bnn) 的基础信息 + 投票规则；不抄皮肤。  
**规范：** `build-ant-design-b2b-app`（列表四层、高级表单独立页、行内编辑→删除）  
**范围：** 独立模块 `src/features/voting-v2`。列表、新建、编辑、独立 mock。不做选手、报名、分组、样式预览、高级、C 端。不改 `features/voting`。

## 决策

| 项 | 选择 |
|---|---|
| 模块 | `voting-v2`，与 v1 零共用 store |
| 页面 | `vote-v2-list` / `vote-v2-create` / `vote-v2-edit` |
| 保存 | 无草稿；主按钮「保存并发布」 |
| 介绍 | 纯文本 ≤2000，无富文本 |
| 票规主语 | 「每人」不写微信 |

后续包：选手 → 报名 → 分组 → 样式预览 → 高级。

## 实体 `VoteV2Campaign`

见会话已确认字段。状态由 `now` 与 `startAt`/`endAt` 推导。`quotaPerContestant` ≤ `quotaPerUser`，两者 1–50。名称 ≤50。

## 列表

查询：活动名称、状态、投票时间（一个范围，按活动区间重叠过滤）。三项，无展开。

列：活动名称（纯文本）、状态、投票时间（`start ～ end`）、规则摘要、操作。

行内：编辑 → 删除。仅未开始可删；进行中/已结束删除禁用。批量删除只处理未开始。

工具栏：左共 N 项，右新增。

种子：1 条未开始、1 条进行中。

## 表单

独立页。卡片：基础信息、规则。未开始全可改；进行中锁名称和时间；已结束只读，底栏仅返回。未保存离开确认。校验失败保留输入。

## 路由

`extraPages` 增加 `vote-v2-create`、`vote-v2-edit`。`siderSelectedKey` 映射到 `vote-v2-list`。`#/voting-v2/vote-list` 仍回落列表占位逻辑改为真列表。
