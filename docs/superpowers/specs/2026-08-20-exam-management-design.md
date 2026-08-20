# 考试管理（对齐课程管理）

**状态：** 已实现  
**日期：** 2026-08-20  
**范围：** 管理端「考试」应用下的「考试管理」列表 + 新建/编辑独立页 + 左树分类。交互与布局对齐课程管理。本轮不做排行、记录、题库、C 端答题、标签页、概览看板。

## 背景

考试应用此前只有占位菜单。参考截图：左分类树 + 右查询列表 + 批量发布/下架/设分类；字段含开考/结束时间、时长、及格分、积分、发布状态、考试状态。仓库内「课程管理」已有成熟壳（`CourseListPage` + `CategoryTreePanel`），本轮按该规范落地考试管理，而不是照搬截图里另一套侧栏（排行/记录/题库）。

规范依据：`build-ant-design-b2b-app` 搜索列表页四层结构、批量勾选后再出批量栏、同对象详情与编辑承载一致（详情弹窗；新建/编辑独立页，与课程一致：编辑/新建提升为独立页，详情可低于编辑）。

## 决策摘要

| 项 | 选择 |
|---|---|
| 形态 | 对齐课程列表壳，非截图侧栏重组 |
| 字段 | 跟截图：双状态 + 时间/时长/及格分/积分；无类型 Tab |
| 分类 | 仅左树维护；删除侧栏「分类管理」 |
| 默认页 | `exam-list` |
| 详情 | Modal + Descriptions |
| 新建/编辑 | 独立页简表单 |
| 树组件 | `CategoryTreePanel` + `categoryTree` 抽到 `shared` |
| 数据 | `features/exams` 本地 mock store |
| 权限 | 本轮不加 |

## 信息架构

考试侧栏：

| 菜单 key | 文案 | 本轮 |
|---|---|---|
| `exam-overview` | 概览 | 占位 |
| `exam-list` | 考试管理 | 默认；真列表 |
| ~~`exam-categories`~~ | ~~分类管理~~ | **删除** |
| `exam-tags` | 考试标签 | 占位 |
| `exam-rules` | 规则设置 | 占位 |

- 应用 `defaultPage`：`exam-list`
- Hash：`#/exam/exam-list`；新建 `#/exam/exam-create`；编辑 `#/exam/exam-edit/:id`
- `#/exam/exam-categories`（及未知页）→ `exam-list`（`parseLocationHash` 对已知应用非法 page 回 default；额外把 `exam-categories` 记入 legacy 映射或依赖 default 即可）
- 面包屑列表：`考试 > 考试管理`；表单：`考试 > 考试管理 > 新建考试|编辑考试`

## 页面结构 — 考试管理

```
ListPageHeading：考试 > 考试管理 / 标题 / 副标题
list-with-sidebar
  左 CategoryTreePanel
  右 SearchPanel → ListTableCard（工具栏 + 批量栏 + Table）
详情 Modal / 分类 CRUD Modal / 设分类 Modal
```

- 副标题：`维护考试场次与发布状态，按分类筛选和管理。`
- 无类型 Tab。
- 查询三项（≤3，不展开）：考试名称、考试状态、发布状态。左树选中叠加子树过滤。
- 工具栏主按钮：`新增考试`（左对齐）。
- 批量栏：勾选 ≥1 才出现；顺序 批量发布 → 批量下架 → 设置分类 → 取消选择。查询/重置/离开列表清空勾选；跨页保留勾选（`preserveSelectedRowKeys`）。
- 批量只处理符合条件的行；无可执行 → info；部分可执行 → 成功提示含跳过说明（对齐课程与批量说明精神）。

## 数据模型

```text
ExamPublishStatus = 未发布 | 已发布
ExamStatus = 未开始 | 进行中 | 已结束

ExamRecord
  id: number
  name: string
  categoryId: number | null
  startAt: string          // YYYY-MM-DD HH:mm:ss
  endAt: string
  durationMinutes: number
  passScore: number
  points: number
  publishStatus: ExamPublishStatus
  examStatus: ExamStatus   // 本轮种子写死，不随时钟自动跳变
  creator: string
  createdAt: string
  updatedAt: string

ExamCategoryNode = CategoryNode（与课程共用树节点形状）
```

- `canDeleteExam`：仅 `publishStatus === 未发布`
- 发布：未发布 → 已发布；下架：已发布 → 未发布（截图「批量下架」对应课程「批量撤销」语义，文案用「下架」）
- 种子：若干考试 + 一棵多级分类树（含「全部」虚拟根由面板提供，与课程一致）

## 表格与行操作

| 列 | 说明 |
|---|---|
| 考试名称 | link → 详情；超长 ellipsis + Tooltip |
| 开考时间 / 结束时间 | 文本 |
| 考试总时长(分) | 数字 |
| 及格分数 / 获得积分 | 数字 |
| 发布状态 / 考试状态 | Tag |
| 操作 | 详情；编辑；发布（未发布时）或下架（已发布时确认）；更多：设置分类、删除 |

详情 Modal：上述字段 + 分类名 + 创建人/时间。底栏可放「编辑」进表单页。

## 表单页

`ExamFormPage` mode `create` | `edit`。高级表单底栏：保存左、取消右。

| 字段 | 控件 | 规则 |
|---|---|---|
| 考试名称 | Input | 必填，≤50 |
| 分类 | TreeSelect | 可选，允许清空 |
| 开考～结束 | RangePicker `showTime` | 必填；结束晚于开考 |
| 总时长（分） | InputNumber | 必填，整数 ≥1 |
| 及格分数 | InputNumber | 必填，≥0 |
| 获得积分 | InputNumber | 必填，整数 ≥0 |
| 发布状态 | Select | 默认未发布 |
| 考试状态 | Select | 默认未开始 |

- 保存：upsert store，`message.success`，回 `exam-list`
- 编辑 id 无效：warning + 回列表
- 不做组卷、考生范围、防作弊、封面

## 分类树

对齐课程：

- 搜分类、展开/收起、选中筛右侧
- 新增根 / 子分类；编辑；上移/下移；删除（子树或占用考试不可删）
- 同级名唯一，≤10 字
- 底部按钮文案：`新增考试分类`

## 文件边界

| 路径 | 职责 |
|---|---|
| `src/shared/category-tree/categoryTree.ts` | 从 `training/model/categoryTree` 迁入 |
| `src/shared/category-tree/CategoryTreePanel.tsx` | 从 `training/components` 迁入；沿用已有 `createLabel`（考试传「新增考试分类」，课程保持默认「新建分类」） |
| `src/features/training/**` | 改 import 指向 shared；行为不变 |
| `src/features/exams/model/exam.ts` | 类型、字典、种子、`canDeleteExam` |
| `src/features/exams/model/examStore.ts` | 考试 CRUD、状态/分类批量、分类树 CRUD、hooks |
| `src/features/exams/pages/ExamListPage.tsx` | 列表 |
| `src/features/exams/pages/ExamFormPage.tsx` | 新建编辑 |
| `src/app/navigation.ts` | 菜单、defaultPage、extraPages `exam-create`/`exam-edit`、`siderSelectedKey` |
| `src/app/App.tsx` | 挂载列表与表单；去掉对 `exam-categories` 的特殊依赖（若无则不动） |
| `src/app/navigation.test.ts` | 默认页、无 categories、hash |

## 异常与窄屏

- 空：无数据用标准 emptyText；有筛选无结果：「没有符合条件的考试」
- 批量无可执行：info，勾选保留
- 删除已发布：info「请先下架」
- 窄屏：`list-with-sidebar is-narrow`，树在上、表在下（同课程）

## 测试与验收

1. `getApplication('exam').defaultPage === 'exam-list'`；菜单无 `exam-categories`
2. `parseLocationHash('#/exam/exam-create')` / `exam-edit` 可用；非法 page → `exam-list`
3. examStore：筛选子树、发布/下架、删除约束、分类占用不可删
4. `npm test`、`npx tsc --noEmit` 通过

手工：全部应用 → 考试 → 考试管理；左树筛选；查询；新增保存回列表；编辑；详情；批量发布/下架/设分类；侧栏无分类管理。

## 非范围

- 考试排行、考试记录、题库管理
- C 端答题与成绩
- 考试标签、概览、规则设置真页
- 真后端 API、权限矩阵
- 按当前时间自动改写 `examStatus`
