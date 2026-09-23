# 投票版本2 空壳应用

**日期：** 2026-08-27  
**状态：** 已确认  
**规范：** `build-ant-design-b2b-app`  
**范围：** 顶栏「全部应用」增加独立应用「投票版本2」。仅导航 + 占位页。不改现有「投票」、store、C 端。

## 背景

现网「投票」已有完整 B 端列表/表单/详情。需要并行应用方便对照迭代。本轮只挂入口。

## 决策

| 项 | 选择 |
|---|---|
| 形态 | 独立应用 `voting-v2`，与 `voting` 并行 |
| 分类 | 员工与组织 |
| 位置 | `voting` 之后、`training` 之前 |
| 顶栏 | 不直显；只在「全部应用」 |
| 图标 | `checkSquare` |
| 默认页 | `vote-v2-list` |
| 侧栏 | 一级×1：投票管理 |
| 页面 | 复用 `PlaceholderPage`，不新建 feature 目录 |
| page key | `vote-v2-list`（禁止复用 `vote-list`，否则会渲染真列表） |

## 路由

- `#/voting-v2/vote-v2-list` → 占位
- `#/voting-v2`、未知页 → `vote-v2-list`
- `#/voting-v2/vote-list` → 不是本应用叶子，回落 `vote-v2-list`
- `#/voting/...` 不变

占位文案：`当前应用「投票版本2」。本页先占位，后续再补列表与详情。`

面包屑：投票版本2 → 投票管理。

`App.tsx` 不为 `vote-v2-list` 增加分支。不改 `extraPages`、`siderSelectedKey`。

## 本轮不做

C 端、权限、mock 数据、列表/表单/详情、规范 JSON。

## 测试

`navigation.test.ts`：注册、分类、顺序、菜单、hash 解析与回落、不进顶栏直显。旧投票 hash 回归仍过。
