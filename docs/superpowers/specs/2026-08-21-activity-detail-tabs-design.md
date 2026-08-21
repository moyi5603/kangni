# 活动详情页 Tab 化设计

日期：2026-08-21
状态：已确认

## 背景

管理后台「活动详情」页目前只有纯详情（活动信息 + 报名设置）。报名名单、评论、精彩瞬间、审批记录、满意度调查、奖品发放是六个独立页面，从活动列表「更多」菜单进入，页面间跳转层级深、上下文割裂。

## 目标

详情页改为 Tab 结构，一个页面内完成活动相关的全部管理操作。

## 页面结构

详情页顶部保持不变：

- 面包屑：活动 > 活动管理 > {活动标题}
- 标题行：标题、类型/审核/发布状态 Tag、时间副标题
- 操作区：审核、提交审批、编辑、返回（按现有权限逻辑显示）

下方加 `Tabs`，共 7 个：

| Tab | key | 内容来源 |
|---|---|---|
| 详情 | `detail` | 现有「活动信息」Card +「报名设置」Card |
| 报名 | `signups` | `SignupList`（ActivityRelatedListPage 内） |
| 评论 | `comments` | `CommentList`（ActivityRelatedListPage 内） |
| 精彩瞬间 | `moments` | `ActivityMomentListPage` 内容区 |
| 审批记录 | `approvals` | `ApprovalList`（ActivityRelatedListPage 内） |
| 满意度调查 | `surveys` | `SurveyList`（ActivityRelatedListPage 内） |
| 奖品发放 | `prizes` | `ActivityPrizeListPage` 内容区 |

## 复用方式：去壳

独立路由废弃后双模式（embedded on/off）是死代码，不做。直接删除各列表的页面外壳：

- `SignupList`、`CommentList`、`ApprovalList`、`SurveyList`（现位于 `ActivityRelatedListPage.tsx`）：删除 `RelatedHeading`（面包屑/标题）、`onBack` prop 及透传，只保留搜索区 + 工具栏 + 表格 + 弹窗，导出供详情页引用。
- `ActivityMomentListPage`、`ActivityPrizeListPage`：同样删除面包屑、标题行、返回按钮与 `onBack` prop。
- 列表内部功能（搜索、新增、导入、审核、批量操作、分页）完整保留。

Tab 懒加载：切到才挂载（`Tabs` items 按需渲染），避免进详情页一次挂 7 个列表。切走后保留状态。

## 导航变更

- 活动列表「更多」菜单：移除 6 个相关入口（奖品发放、满意度调查、审批记录、报名管理、评论管理、精彩瞬间管理）。菜单其余项（编辑、提交审批、删除等）不变。
- 详情页路由支持 tab 参数：`goToPage('activity-detail', recordId, tab?)`，切 tab 同步更新当前地址 state，刷新/返回后保持当前 tab。无 tab 参数默认 `detail`。
- 独立路由 `activity-signups`、`activity-comments`、`activity-approvals`、`activity-surveys`、`activity-moments`、`activity-prizes` 废弃：`App.tsx` 移除对应分支，`relatedPages` 类型清理。`ActivityRelatedListPage` 路由外壳删除；其内联的 `SignupList`、`CommentList`、`ApprovalList`、`SurveyList` 四个组件及共享件（`RelatedTable`、`RelatedHeading` 等）保留并导出，`ActivityMomentListPage`、`ActivityPrizeListPage` 两个独立文件保留，均改为供详情页 embedded 引用。

## 文案

Tab 名：详情、报名、评论、精彩瞬间、审批记录、满意度调查、奖品发放。
列表组件内部文案不变（含上一轮「分组名称」改名成果）。

## 不做

- 不改 C 端。
- 不改各列表组件的业务逻辑与数据结构。
- 不合并/精简 tab 内列表的功能。

## 测试

- 回归：`npm test -- src/features/activities` 全绿。
- UI 规范：`python3 scripts/check_ui_conformance.py --root .` 通过。
- 手测路径：列表 → 详情 → 逐 tab 切换验证功能；刷新保持 tab；更多菜单无相关入口；详情页操作按钮在任意 tab 可用。
