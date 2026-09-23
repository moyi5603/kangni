# 技能大赛 · 赛事详情学习计划 Tab（管理端）

**日期：** 2026-09-14  
**规范：** `build-ant-design-b2b-app`（详情独立页 Tab、弹窗主操作在左、表格操作列在右）  
**范围：** 管理端赛事详情绑定学习计划。不做 C 端展示/进入、不新建计划、不改计划内容。

## 背景

学习计划已是独立应用。赛事分阶段闯关，运营需要按阶段挂多个已有计划，供后续 C 端使用。本轮只落绑定关系。

## 决策

| 项 | 选择 |
|---|---|
| 表面 | 仅管理端 |
| 存储 | `ContestStage.learningPlanIds: number[]`，有序、阶段内去重 |
| 入口 | 赛事详情 Tab「学习计划」，key `plans` |
| 选择 | 弹窗表格多选已发布计划，确定即保存 |
| 跨阶段 | 同一计划可绑多个阶段 |
| 草稿 | 不进弹窗；已绑后改草稿仍展示，可移除 |

## 信息架构

详情 Tab 顺序：

| 顺序 | key | 文案 |
|---|---|---|
| 1 | `detail` | 基本信息 |
| 2 | `signups` | 报名管理 |
| 3 | `challenges` | 闯关设置 |
| 4 | `plans` | 学习计划 |
| 5 | `challenge-logs` | 闯关记录 |

Hash：`#/skills-contest/contest-detail/:id/plans`

## 数据

`ContestStage` 增加：

- `learningPlanIds: number[]`，默认 `[]`
- 指向学习计划应用 `LearningPlan.id`
- 新增阶段（表单 `emptyStage`）为空数组
- 编辑赛事保存时 `mergeStages` 保留原阶段的 `learningPlanIds`
- 删除阶段：该阶段绑定一并消失

纯函数：

- `appendStagePlanIds(existing, added)`：追加未出现过的 id，保持原顺序
- `removeStagePlanId(existing, planId)`：去掉一个 id
- `publishedPlansForPicker(plans, already)`：`status === 'published'` 且不在 `already`

## 界面

每个阶段一张 Card，标题 `阶段一 · 初赛`（复用 `stageOrdinalLabel`）。

卡头右侧主按钮「添加学习计划」。

表：名称、状态、计划时间。操作列「移除」（解绑，不删计划，无需二次确认）。计划已不存在：名称显示「计划已删除」，状态「—」。已绑后变草稿：状态「草稿」。

空表：`Empty`「暂无学习计划」。

弹窗标题「选择学习计划」。查询：名称模糊，点查询生效（一个字段，不必展开）。表格多选；本阶段已绑的不出现。确定：`Ok` 在左、`Cancel` 在右。无勾选点确定：提示「请选择学习计划」，不关窗。成功：`message.success('已添加学习计划')`，立刻 `saveContest`。

## 种子

`2026 技能公开赛` 初赛（`s1`）预绑计划 id `1`（安全日练）。复赛空。

## 非目标

- C 端赛事/首页按阶段露出计划
- 计划排序拖拽（数组追加顺序即可）
- 从大赛内新建学习计划

## 验收

- 详情 Tab 可见「学习计划」，公开赛初赛列出「安全日练」
- 弹窗只能勾选已发布、且本阶段未绑的计划；可一次加多条
- 移除后该阶段不再显示该计划，计划应用列表仍在
- C 端页面本轮无变化
