# Page Map — 课程管理后台

- Delivery mode: **D. PRD Only**（用户明确只要 HTML PRD，自行选定）
- Slug: `course-admin-prd-only`
- Baseline verification: **Source-derived**（基于 `src/features/training` 源码；未做同视口运行时像素比对）
- Product Design availability: unavailable
- Execution path: native-fallback
- Enhancement skill: none

## Boundary

包含 B 端应用「课程」（`training`）内：

- 概览、课程管理（列表/新建/编辑/详情含 Tab）、课件管理、规则设置
- 一级浮层：分类新建/编辑 Modal、添加课件 Modal、课件表单 Drawer、课件详情 Drawer、评论通过/驳回 Modal、删除/发布确认

不包含：C 端学员学习页、考试题库本身 CRUD、活动/评优等其他应用。

## Target pages

| Route | Page | Source |
|---|---|---|
| `#/training/training-overview` | 概览 | `CourseOverviewPage.tsx` |
| `#/training/training-courses` | 课程管理 | `CourseListPage.tsx` |
| `#/training/course-create` | 新增课程 | `CourseFormPage.tsx` |
| `#/training/course-edit/:id` | 编辑课程 | `CourseFormPage.tsx` |
| `#/training/course-detail/:id[/:tab]` | 课程详情 | `CourseDetailPage.tsx` |
| `#/training/training-courseware` | 课件管理 | `CoursewareListPage.tsx` |
| `#/training/training-rules` | 规则设置 | `TrainingRulesPage.tsx` |

## Status enums (source facts)

- CourseStatus: `草稿` | `已发布` | `已下架`
- CourseType: `视频` | `音频` | `PDF`
- LearningMode: `不限制` | `按序学习`
- CoursewarePublishStatus: `草稿` | `已发布`
- CourseCommentStatus: `待审核` | `已通过` | `已驳回`
- LearningStatus: `未开始` | `学习中` | `已完成`
