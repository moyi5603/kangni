# 全部应用：培训课程改名为课程

**状态：** 已批准  
**日期：** 2026-08-19  
**范围：** 管理端「全部应用」展示名。不改路由、菜单树、页面。

## 背景

顶部「全部应用」卡片按 `applications` 元数据列出应用。现有条目 `key: training` 的 `label` 为「培训课程」。产品要求该入口名为「课程」，并去掉「培训课程」文案。

## 决策摘要

| 项 | 选择 |
|---|---|
| 做法 | 只改应用名，不换 key |
| 应用 key | `training`（不变） |
| 展示名 | 课程 |
| 分类 / 图标 / 默认页 | 员工与组织 / `book` / `training-courses` |
| Hash | `#/training/...`（不变） |
| 左侧菜单 | 课程运营、学习运营及子项（不变） |

## 改动

`src/app/navigation.ts` 中：

```ts
{ key: 'training', label: '课程', category: '员工与组织', icon: 'book', defaultPage: 'training-courses' }
```

顶部直显与「全部应用」均读该字段，无需改 `App.tsx`。

## 验收

- 「全部应用」出现「课程」，不出现「培训课程」。
- 进入后仍是课程管理（默认页 `training-courses`）。
- 旧链接 `#/training/training-courses` 仍可用。

## 非目标

- 不改应用 key、不迁 hash。
- 不改左侧菜单文案与页面实现。
- 不做权限、C 端。
