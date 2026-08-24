# 兴趣小组分类管理 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 兴趣小组「分类管理」列表：对齐活动分类页，无图标/颜色，删除解绑小组+活动为未分类。

**Spec:** `docs/superpowers/specs/2026-08-23-interest-group-category-management-design.md`

**Architecture:** 扩展 `interestGroupCategory` + store CRUD；新页 `InterestGroupCategoryListPage`；`App.tsx` 挂路由。

## Task 1: 模型与 store

- 测试：删除解绑、上移交换 order、名称校验、禁用不在 enabled 列表
- 实现：`createdAt`、compare/validate、upsert/delete/move/setStatus；delete 同时清 activities

## Task 2: 列表页 + 路由

- 测试：标题、种子名、新建分类、无「图标」「颜色」列文案作字段
- 实现：镜像 `ActivityCategoryListPage`；`App.tsx` 接入

## Task 3: 验证

`npx vitest run src/features/interest-groups`
