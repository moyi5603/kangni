# 兴趣小组 / 评优 应用入口

**日期：** 2026-08-23  
**范围：** B 端顶部应用切换新增两个独立应用；侧栏各一个占位页。不做 CRUD、不做 C 端。

## 决策

| 项 | 选择 |
|---|---|
| 层级 | 与「员工体验」同级的独立应用，不是塞进现有应用侧栏 |
| 第一期 | 应用入口 + 侧栏 + `PlaceholderPage` |
| 员工体验旧菜单 | 删除「社群运营 / 兴趣小组」整组 |
| 旧 hash | `#/experience/experience-interest-groups` 回落到员工体验默认页（文章管理） |
| C 端 | 不做 |

## 信息架构

分类均为「员工与组织」。顺序：员工体验 → **兴趣小组** → **评优** → 课程。

| 应用 | key | 图标 | 默认页 | 侧栏 |
|---|---|---|---|---|
| 兴趣小组 | `interest-groups` | `team` | `interest-group-list` | 小组管理（一级，无子菜单） |
| 评优 | `awards` | `trophy` | `award-list` | 评优管理（一级，无子菜单） |

Hash：`#/interest-groups/interest-group-list`、`#/awards/award-list`。

不进顶部直显 4 个应用（工作台 / 组织管理 / 商品管理 / 订单管理）。出现在「全部应用」卡片「员工与组织」分组。

## 路由与占位

`parseLocationHash` 已按 `applications` + `applicationMenus` 解析。未知页回落到该应用 `defaultPage`。

`App.tsx` 未匹配业务页时走现有 `PlaceholderPage`：面包屑、标题为菜单名，文案「当前应用「{应用名}」。本页先占位，后续再补列表与详情。」

不新建 feature 目录，不新增页面组件。

## 测试

`src/app/navigation.test.ts`：

- 两个应用的 meta、菜单元数据
- 插在员工体验与课程之间
- 叶子 hash 可解析；缺页 / 未知页回落默认页
- 不进 `getDirectApplications(4)`
- 员工体验菜单不再含 `experience-groups` / `experience-interest-groups`
- 旧兴趣小组 hash 回落 `experience-articles`

## 不做

小组/评优列表与表单、成员、申报、审批、C 端门户入口、员工体验内跳转。
