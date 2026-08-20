# 考试应用入口

**状态：** 已实现  
**日期：** 2026-08-19  
**范围：** 管理端「全部应用」增加独立应用「考试」。左侧五个一级占位菜单（仿活动）。本轮不做列表、表单、详情、权限、C 端。

## 背景

顶部「全部应用」卡片按分类列出平台应用。员工与组织已有活动、员工体验、课程、人文关怀。考试需要独立入口，与课程同级，不并入培训或活动。

本轮只挂应用与菜单，页面沿用 `PlaceholderPage`，与课程、人文关怀一致。菜单信息架构仿活动：五个平级一级叶子。

规范依据：`build-ant-design-b2b-app` 统一应用骨架。应用切换后替换左侧菜单并进入默认页；应用、菜单、默认路由共用一份元数据。顶部直显数量不变（`applicationDirectVisibleMax`）。

## 决策摘要

| 项 | 选择 |
|---|---|
| 形态 | 独立应用，不挂在课程下 |
| 分类 | 员工与组织 |
| 顶栏 | 不直显；只出现在「全部应用」 |
| 默认页 | 概览 |
| 左侧菜单 | 五个一级：概览、考试管理、分类管理、考试标签、规则设置 |
| 页面 | `PlaceholderPage`，不新建 feature 模块 |
| 图标 | 现成 `fileText`，不扩展 `NavIcon` |
| 权限 | 本轮不加 |

## 信息架构

- 应用 key：`exam`
- 名称：考试
- 分类：员工与组织
- 图标：`fileText`
- 在 `applications` 中插在 `training`（课程）之后、`care`（人文关怀）之前

| 菜单 key | 文案 | Hash |
|---|---|---|
| `exam-overview` | 概览 | `#/exam/exam-overview` |
| `exam-list` | 考试管理 | `#/exam/exam-list` |
| `exam-categories` | 分类管理 | `#/exam/exam-categories` |
| `exam-tags` | 考试标签 | `#/exam/exam-tags` |
| `exam-rules` | 规则设置 | `#/exam/exam-rules` |

默认路由：`#/exam/exam-overview`。  
面包屑：`考试 > 当前菜单`。  
占位正文：现有文案「当前应用「考试」。本页先占位，后续再补列表与详情。」

五个菜单均为一级叶子，无分组。不进顶栏直显列表（仍为数组前 `applicationDirectVisibleMax` 个）。

若实现时 `training` 与 `care` 之间已有其他应用（例如技能大赛），考试仍放在 `care` 之前，紧挨该区间末尾，不挤到 `care` 之后。

## 架构与组件

不新增 `features/exams`。只改导航元数据：

| 文件 | 职责 |
|---|---|
| `src/app/navigation.ts` | `applications` 增加一条；`applicationMenus['exam']` 五个一级节点 |
| `src/app/navigation.test.ts` | 覆盖应用存在、分类、顺序、菜单、hash |

`App.tsx` 不改：`fileText` 已在 `navIcons`；未知页已走 `PlaceholderPage`。

现有行为复用：

- `parseLocationHash` / `toLocationHash` 已按 `applications` + 叶子菜单解析
- 「全部应用」按 `item.category` 分组渲染，新应用自动进「员工与组织」
- `getDirectApplications(max)` 仍 `slice(0, max)`，`exam` 在第 5 位之后，顶栏不变

不改 `.b2b/b2b-standards.json` 的 `applicationDirectVisibleMax`。

## 数据流

无业务实体、无 store、无 API。切应用 / 切菜单只改 location hash。

- 未知应用 key：回工作台 `dashboard`（现有 fallback）
- 已知 `exam` + 缺 page 或非法 page：落到 `exam-overview`

## 异常

与现有占位应用相同：加载/空/失败由 `PlaceholderPage` 不处理；无权限场景本轮不存在。窄屏：应用名显示在顶栏，菜单进抽屉，沿用现壳。

## 测试

在 `src/app/navigation.test.ts` 覆盖：

1. `getApplication('exam')` 存在，label 考试，category 员工与组织，defaultPage `exam-overview`，icon `fileText`
2. `applications` 里 `exam` 在 `training` 之后、`care` 之前
3. `applicationMenus['exam']` 五个一级叶子，key/label 如上，无 children
4. `parseLocationHash('#/exam/exam-list')` → application `exam`，page `exam-list`
5. `parseLocationHash('#/exam')` 或非法 page → 落到 `exam-overview`
6. `getDirectApplications(4)` 不含 `exam`

不要求 App 组件测试覆盖 Popover 文案。

## 验收

- 打开「全部应用」，「员工与组织」分组出现「考试」，图标为文档
- 点进去：左侧五个一级菜单，默认选中概览，右侧占位页
- 切考试管理、分类管理、考试标签、规则设置：标题与面包屑跟着变，仍占位
- 顶栏直显应用仍为前 4 个，不含考试
- 刷新 `#/exam/exam-rules` 仍停在规则设置

## 非范围

- 题库、试卷、场次、成绩的列表、新建、详情、状态机
- 与课程、活动的数据复用
- C 端答题或查分
- 权限、审核、导出
- 把考试钉到顶栏
- 新建 `features/exams`
