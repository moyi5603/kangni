# 即时激励应用入口

**日期：** 2026-09-15  
**规范：** `build-ant-design-b2b-app` 统一应用骨架  
**范围：** 管理端「全部应用」增加独立应用「即时激励」。左侧一个一级占位菜单。本轮不做列表、表单、详情、权限、C 端、装修。

## 背景

顶部「全部应用」卡片按分类列出平台应用。员工与组织已有活动、兴趣圈、投票、课程、技能大赛、考试练习、直播、抽奖、打卡、学习计划等。即时激励需要独立入口，与抽奖、打卡同级，不并入评优或人文关怀。

本轮只挂应用与菜单。默认页走现有 `PlaceholderPage`。新建/编辑/详情 hash 预留解析与侧栏高亮，页面仍占位。

## 决策

| 项 | 选择 |
|---|---|
| 形态 | 独立应用，不挂在抽奖、评优、打卡下 |
| 分类 | 员工与组织 |
| 顶栏 | 不直显；只出现在「全部应用」 |
| 名称 | 即时激励 |
| key | `incentive` |
| 图标 | 现成 `rocket`，不扩展 `NavIcon` |
| 默认页 | 激励管理 |
| 左侧菜单 | 一个一级叶子：激励管理 |
| 页面 | `PlaceholderPage`，不新建 feature 目录 |
| 权限 | 本轮不加 |

## 信息架构

在 `applications` 中插在 `learning-plan`（学习计划）之后、`care`（人文关怀）之前。

| 顺序 | key | 文案 | Hash | 侧栏 |
|---|---|---|---|---|
| 1 | `incentive-list` | 激励管理 | `#/incentive/incentive-list` | 显示 |
| 隐藏 | `incentive-create` | 新建 | `#/incentive/incentive-create` | 高亮激励管理 |
| 隐藏 | `incentive-edit` | 编辑 | `#/incentive/incentive-edit/:id` | 高亮激励管理 |
| 隐藏 | `incentive-detail` | 详情 | `#/incentive/incentive-detail/:id` | 高亮激励管理 |

默认路由：`#/incentive` 与未知页回落 `#/incentive/incentive-list`。  
面包屑：`即时激励 > 激励管理`（隐藏页标题用菜单映射后的激励管理）。  
占位正文：现有文案「当前应用「即时激励」。本页先占位，后续再补列表与详情。」

不进顶栏直显列表（仍为 `visibleApplications()` 前 `applicationDirectVisibleMax` 个：工作台 / 组织管理 / 商品管理 / 订单管理）。

## 路由

`parseLocationHash` 已按 `applications` + `applicationMenus` 解析叶子。隐藏页加入 `extraPages`：`incentive-create`、`incentive-edit`、`incentive-detail`。

`siderSelectedKey`：上述三页映射到 `incentive-list`。

`App.tsx` 未匹配业务页时走现有 `PlaceholderPage`。不新增页面组件。

## 测试

`src/app/navigation.test.ts` 增加 `incentive application`：

- meta：`key/label/category/icon/defaultPage`
- 顺序：`learning-plan` 之后、`care` 之前
- 菜单：单一级 `incentive-list`
- 叶子 hash 可解析；`#/incentive` 与未知页回落默认页
- create/edit/detail hash 可解析；`siderSelectedKey` 均为 `incentive-list`
- `visibleApplications` 含「即时激励」；`getDirectApplications(4)` 不含 `incentive`

## 不做

激励规则、发放记录、积分账本、权限、C 端门户、装修、顶栏直显。
