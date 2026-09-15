# 勋章应用入口

**日期：** 2026-09-15  
**规范：** `build-ant-design-b2b-app` 统一应用骨架  
**范围：** 管理端「全部应用」增加独立应用「勋章」。左侧一个一级占位菜单。本轮不做列表、表单、详情、权限、C 端、装修，也不改活动奖品、打卡勋章、评优、荣誉墙。

## 背景

顶部「全部应用」卡片按分类列出平台应用。员工与组织已有活动、兴趣圈、投票、课程、技能大赛、考试练习、直播、抽奖、打卡、学习计划、即时激励等。勋章素材和发放散落在活动奖品、打卡奖励、评优里，没有独立入口。

本轮只挂应用与菜单。默认页走现有 `PlaceholderPage`。新建/编辑/详情 hash 预留解析与侧栏高亮，页面仍占位。

## 决策

| 项 | 选择 |
|---|---|
| 形态 | 独立应用，不挂在活动、评优、打卡下 |
| 分类 | 员工与组织 |
| 顶栏 | 不直显；只出现在「全部应用」 |
| 名称 | 勋章 |
| key | `medal` |
| 图标 | 现成 `trophy`，不扩展 `NavIcon` |
| 默认页 | 勋章管理 |
| 左侧菜单 | 一个一级叶子：勋章管理 |
| 页面 | `PlaceholderPage`，不新建 feature 目录 |
| 权限 | 本轮不加 |

## 信息架构

在 `applications` 中插在 `incentive`（即时激励）之后、`care`（人文关怀）之前。

| 顺序 | key | 文案 | Hash | 侧栏 |
|---|---|---|---|---|
| 1 | `medal-list` | 勋章管理 | `#/medal/medal-list` | 显示 |
| 隐藏 | `medal-create` | 新建 | `#/medal/medal-create` | 高亮勋章管理 |
| 隐藏 | `medal-edit` | 编辑 | `#/medal/medal-edit/:id` | 高亮勋章管理 |
| 隐藏 | `medal-detail` | 详情 | `#/medal/medal-detail/:id` | 高亮勋章管理 |

默认路由：`#/medal` 与未知页回落 `#/medal/medal-list`。  
面包屑：`勋章 > 勋章管理`（隐藏页标题用菜单映射后的勋章管理）。  
占位正文：现有文案「当前应用「勋章」。本页先占位，后续再补列表与详情。」

不进顶栏直显列表（仍为 `visibleApplications()` 前 `applicationDirectVisibleMax` 个：工作台 / 组织管理 / 商品管理 / 订单管理）。

## 路由

`parseLocationHash` 已按 `applications` + `applicationMenus` 解析叶子。隐藏页加入 `extraPages`：`medal-create`、`medal-edit`、`medal-detail`。

`siderSelectedKey`：上述三页映射到 `medal-list`。

`App.tsx` 未匹配业务页时走现有 `PlaceholderPage`。不新增页面组件。即时激励已让占位面包屑走 `siderSelectedKey`，本轮不改 `App.tsx`，除非测到隐藏页面包屑仍错。

## 测试

`src/app/navigation.test.ts` 增加 `medal application`：

- meta：`key/label/category/icon/defaultPage`
- 顺序：`incentive` 之后、`care` 之前
- 菜单：单一级 `medal-list`
- 叶子 hash 可解析；`#/medal` 与未知页回落默认页
- create/edit/detail hash 可解析；`siderSelectedKey` 均为 `medal-list`
- `visibleApplications` 含「勋章」；`getDirectApplications(4)` 不含 `medal`

## 不做

勋章库 CRUD、发放记录、与活动/打卡/评优的选库打通、权限、C 端荣誉墙、装修、顶栏直显。
