# 课程独立详情页 Implementation Plan

> **For agentic workers:** 当前会话已按 TDD 直接实现，不另开 subagent。

**Goal:** B 端课程详情升为独立页，展示与编辑页对齐的完整只读信息。

**Architecture:** 新 `CourseDetailPage` + 路由 `course-detail`；列表去掉 Modal。时长格式抽到 `training.ts` 与表单共用。

**Tech Stack:** React、TypeScript、antd 6、vitest `renderToStaticMarkup`

## Files

- `src/features/training/pages/CourseDetailPage.tsx` 新建
- `src/features/training/pages/CourseDetailPage.test.tsx` 新建
- `src/features/training/model/training.ts` 导出 `formatCoursewareDuration`
- `src/features/training/pages/CourseFormPage.tsx` 改用共享时长格式
- `src/features/training/pages/CourseListPage.tsx` 导航进详情页
- `src/app/navigation.ts` extraPages + sider
- `src/app/navigation.test.ts` 解析/高亮
- `src/app/App.tsx` 挂页面
