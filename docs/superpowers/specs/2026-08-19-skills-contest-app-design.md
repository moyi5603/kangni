# 技能大赛应用入口

**状态：** 待实现  
**日期：** 2026-08-19  
**范围：** 管理端「全部应用」增加独立应用「技能大赛」。左侧三个一级占位菜单。本轮不做列表、表单、详情、权限、C 端。

## 背景

顶部「全部应用」卡片按分类列出平台应用。员工与组织已有活动、员工体验、培训课程、人文关怀。技能大赛需要独立入口，与培训课程同级，不并入培训或活动。

本轮只挂应用与菜单，页面沿用 `PlaceholderPage`，与培训课程、人文关怀一致。

规范依据：`build-ant-design-b2b-app` 统一应用骨架。应用切换后替换左侧菜单并进入默认页；应用、菜单、默认路由共用一份元数据。顶部直显数量不变（`applicationDirectVisibleMax` = 4）。

## 决策摘要

| 项 | 选择 |
|---|---|
| 形态 | 独立应用，不挂在培训课程下 |
| 分类 | 员工与组织 |
| 顶栏 | 不直显；只出现在「全部应用」 |
| 默认页 | 赛事管理 |
| 左侧菜单 | 三个一级：赛事管理、报名、成绩 |
| 页面 | `PlaceholderPage`，不新建 feature 模块 |
| 图标 | `TrophyOutlined`，扩展 `NavIcon` |
| 权限 | 本轮不加 |

## 信息架构

- 应用 key：`skills-contest`
- 名称：技能大赛
- 分类：员工与组织
- 图标：`trophy`
- 在 `applications` 中插在 `training`（培训课程）之后、`care`（人文关怀）之前

| 菜单 key | 文案 | Hash |
|---|---|---|
| `contest-list` | 赛事管理 | `#/skills-contest/contest-list` |
| `signup-list` | 报名 | `#/skills-contest/signup-list` |
| `score-list` | 成绩 | `#/skills-contest/score-list` |

默认路由：`#/skills-contest/contest-list`。  
面包屑：`技能大赛 > 当前菜单`。  
占位正文：现有文案「当前应用「技能大赛」。本页先占位，后续再补列表与详情。」

三个菜单均为一级叶子，无分组。不进顶栏直显列表（仍为工作台、组织管理、商品管理、订单管理）。

## 架构与组件

不新增 `features/skills-contest`。改两处元数据接线：

| 文件 | 职责 |
|---|---|
| `src/app/navigation.ts` | `NavIcon` 增加 `trophy`；`applications` 增加一条；`applicationMenus['skills-contest']` 三个一级节点 |
| `src/app/App.tsx` | `navIcons` 映射 `trophy` → `TrophyOutlined` |

现有行为复用，不改逻辑：

- `parseLocationHash` / `toLocationHash` 已按 `applications` + 叶子菜单解析
- `App.tsx` 未知页走 `PlaceholderPage`
- 「全部应用」按 `item.category` 分组渲染，新应用自动进「员工与组织」
- `getDirectApplications(max)` 仍 `slice(0, max)`，新应用在第 5 位之后，顶栏不变

不改 `.b2b/b2b-standards.json` 的 `applicationDirectVisibleMax`。

## 数据流

无业务实体、无 store、无 API。切应用 / 切菜单只改 location hash。未知 hash 仍回工作台数据看板（现有 fallback）。

## 异常

与现有占位应用相同：加载/空/失败由 `PlaceholderPage` 不处理；无权限场景本轮不存在。窄屏：应用名显示在顶栏，菜单进抽屉，沿用现壳。

## 测试

在 `src/app/navigation.test.ts`（或同目录新 describe）覆盖：

1. `getApplication('skills-contest')` 存在，label 技能大赛，category 员工与组织，defaultPage `contest-list`
2. `applicationMenus['skills-contest']` 三个一级叶子，key/label 如上，无 children
3. `parseLocationHash('#/skills-contest/signup-list')` → application `skills-contest`，page `signup-list`
4. `parseLocationHash('#/skills-contest')` 或非法 page → 落到 `contest-list`
5. `getDirectApplications(4)` 不含 `skills-contest`（顶栏仍 4 个）

不要求 App 组件测试覆盖 Popover 文案；导航元数据测到即可。

## 验收

- 打开「全部应用」，「员工与组织」分组出现「技能大赛」，图标为奖杯
- 点进去：左侧三个一级菜单，默认选中赛事管理，右侧占位页
- 切报名、成绩：标题与面包屑跟着变，仍占位
- 顶栏直显应用仍为 4 个，不含技能大赛
- 刷新 `#/skills-contest/score-list` 仍停在成绩

## 非范围

- 赛事/报名/成绩的列表、新建、详情、状态机
- 与培训课程、活动的数据复用
- C 端报名或成绩查询
- 权限、审核、导出
- 把技能大赛钉到顶栏
