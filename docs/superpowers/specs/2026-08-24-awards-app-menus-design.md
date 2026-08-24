# 评优应用侧栏三菜单

**日期：** 2026-08-24  
**范围：** 评优应用（`awards`）侧栏由单页扩为三个一级菜单；三页均占位。不做 CRUD、不做规则真页、不做 C 端。  
**关联：** 在 `2026-08-23-interest-groups-awards-apps-design.md` 评优侧栏之上增量调整；兴趣小组与应用入口本身不变。

## 决策

| 项 | 选择 |
|---|---|
| 菜单 | 概览、评优管理、规则设置（一级×3，无子菜单） |
| 默认页 | 概览（对齐活动 / 课程 / 兴趣小组） |
| 页面实现 | 全部走现有 `PlaceholderPage` |
| 代码范围 | 只改 `navigation.ts` + `navigation.test.ts` |
| feature 目录 | 不新建 |

## 信息架构

| 顺序 | key | 图标 | label |
|---|---|---|---|
| 1 | `award-overview` | `dashboard` | 概览 |
| 2 | `award-list` | `trophy` | 评优管理 |
| 3 | `award-rules` | `fileText` | 规则设置 |

应用 meta：`defaultPage` 从 `award-list` 改为 `award-overview`。应用 key / 标签 / 分类 / 图标不变（`awards` / 评优 / 员工与组织 / `trophy`）。

Hash：

- `#/awards/award-overview` → 概览
- `#/awards/award-list` → 评优管理
- `#/awards/award-rules` → 规则设置
- `#/awards`、未知页 → 回落 `award-overview`

`#/awards/award-list` 仍为合法叶子，不重定向。

## 路由与占位

`parseLocationHash` 已按 `applications` + `applicationMenus` 解析；菜单补齐后自动生效。

`App.tsx` 未匹配业务页时继续 `PlaceholderPage`：面包屑与标题为菜单名，文案「当前应用「评优」。本页先占位，后续再补列表与详情。」

## 测试

`src/app/navigation.test.ts` 评优相关用例更新为：

- 菜单元数据为上述三项，顺序固定
- `defaultPage` / 缺页 / 未知页回落 `award-overview`
- 三个叶子 hash 均可解析
- 仍不进 `getDirectApplications(4)`

## 不做

概览看板、评优列表/表单、申报审批、规则设置真表单、C 端入口、兴趣小组菜单变更。
