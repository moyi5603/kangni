# 技能大赛 · 赛事管理（管理端）

**日期：** 2026-09-10  
**规范：** `build-ant-design-b2b-app`（列表四层、复杂表单独立页、详情独立页、主操作在左）  
**范围：** 管理端赛事 CRUD、报名信息收集、报名管理 Tab、分阶段闯关配置、区域配置、H5/PC 页面占位与可见范围。不做 C 端报名/答题、不做审核/导入导出、不做成绩、不改打卡。

## 背景

技能大赛应用已有入口，菜单目前是占位：赛事管理、报名、成绩、打卡。本轮把赛事做成可配置实体：名称/Logo/时间/阶段、报名收集（对标活动应用）、创建后在详情管理报名资格与分阶段闯关。区域是应用级名录，报名时选手选所属区域。页面关联只占位，供后续 C 端接线。

## 决策

| 项 | 选择 |
|---|---|
| 模块 | 独立 `src/features/skills-contest`，不并入活动应用 |
| 本轮表面 | 仅管理端 |
| 闯关绑定 | 每个阶段各自一套闯关规则 |
| 报名入口 | 只在赛事详情 Tab；删除左侧「报名」菜单 |
| 区域 | 应用级扁平名录；报名字段固定「所属区域」 |
| 页面可见 | 整场大赛一个开关：公开 / 仅租户成员；H5、PC 共用 |
| H5/PC | 下拉占位，不渲染真实 C 端页 |
| 习题来源 | 考试应用「习题库」`getQuestionStore('practice')`，不用试题库 |
| 权限 | 本轮不加 |

## 信息架构

技能大赛左侧一级菜单（顺序）：

| 顺序 | key | 说明 |
|---|---|---|
| 1 | `contest-list` | 赛事管理（默认页） |
| 2 | `region-list` | 区域配置 |
| 3 | `score-list` | 成绩，继续 `PlaceholderPage` |
| 4 | `contest-checkin` | 打卡，现有跳转，不改 |

删除 `signup-list`。旧 hash `#/skills-contest/signup-list` 重定向到 `contest-list`。

隐藏页（侧栏高亮 `contest-list`）：

| key | Hash |
|---|---|
| `contest-create` | `#/skills-contest/contest-create` |
| `contest-edit` | `#/skills-contest/contest-edit/:id` |
| `contest-detail` | `#/skills-contest/contest-detail/:id/:tab` |

详情 Tab：

| tab | 文案 |
|---|---|
| `detail` | 基本信息（默认） |
| `signups` | 报名管理 |
| `challenges` | 闯关 |

区域：`#/skills-contest/region-list`。新建/编辑区域用弹窗（字段少）。

面包屑：`技能大赛 > 赛事管理`；表单/详情再加当前页标题。区域页：`技能大赛 > 区域配置`。

## 赛事列表

查询：名称（模糊）、状态（全部 / 未开始 / 进行中 / 已结束）、可见范围。点查询生效。

列：Logo 缩略 + 名称、举办时间、阶段数、可见范围、状态、操作。

状态不落库：`now < startAt` 未开始；`startAt ≤ now ≤ endAt` 进行中；`now > endAt` 已结束。

行操作：详情、编辑、删除（Popconfirm）。页操作：新建赛事。

删除有报名的赛事：允许，连带删除该赛事报名（原型）。二次确认文案写明会删报名。

## 赛事表单

独立页，一块高级表单，不分步。新建保存后进入该赛事详情 `detail` Tab。

### 基本信息

| 字段 | 必填 | 规则 |
|---|---|---|
| 大赛名称 | 是 | ≤50 字，应用内不重名 |
| Logo | 是 | 单图上传，存 url（原型可用本地 object URL / 占位图） |
| 描述 | 否 | 多行文本，≤500 字 |
| 举办时间 | 是 | 日期时间范围，`endAt ≥ startAt` |

### 阶段

至少 1 条，`Form.List`，可增删、上移下移。展示「阶段一 / 阶段二 …」按数组下标，名称另填。

| 字段 | 必填 | 规则 |
|---|---|---|
| 名称 | 是 | ≤20 字，如「初赛」；同一赛事内不重名 |
| 开始–结束 | 是 | 必须落在举办时间内；`stage.endAt ≥ stage.startAt` |

阶段时间可首尾相接（上一场 `endAt` = 下一场 `startAt`），不可重叠（开区间相交即冲突）。

编辑时删除某阶段：保存后所有报名的 `eligibleStageIds` 去掉该 id。

### 报名信息收集

复用活动应用字段模型与编辑器能力（预设姓名/手机号/部门等 + 自定义文本/单选/多选 + 分组/同行人）。

额外固定预设 **所属区域**：

- `key`: `所属区域`
- `inputType`: `region`
- `fixed: true`，默认 `required: true`，不可从画板移除
- 选项运行时读区域配置中 `enabled === true` 的项，按 `sort` 升序

活动应用的 `SignupFieldInputType` 不强制改；技能大赛侧扩展 `region`，编辑器在 contest 模块内适配（可包一层活动编辑器，区域字段单独只读展示或内嵌 Select 预览）。默认带上固定「姓名」+「所属区域」。

### 页面与可见

| 字段 | 规则 |
|---|---|
| 关联 H5 页面 | 下拉：`none` 不关联 / `home` 技能大赛首页 / `detail` 赛事详情 / `signup` 报名页 / `challenge` 闯关页 |
| 关联 PC 页面 | 同上 |
| 页面可见 | 单选 `tenant` 仅租户成员（默认） / `public` 公开。H5、PC 共用 |

本轮只存字段，不根据选项跳转 C 端。

## 赛事详情

页头：Logo、名称、举办时间、状态 Tag、可见范围。操作：编辑、返回列表。

`detail` Tab：只读展示表单各段（基本信息、阶段表、报名字段摘要、H5/PC、可见范围）。不在详情里直接改闯关（去 `challenges`）。

## 报名管理 Tab

种子报名数据（每场至少 3 人），无 C 端写入。

查询：姓名、所属区域、可参与阶段。点查询生效。

列：姓名、手机号（未收集则 —）、所属区域、可参与阶段（多 Tag）、收集信息摘要、报名时间、操作。

可参与阶段：

- 选项 = 该赛事当前全部阶段
- 新报名默认 `eligibleStageIds = [stages[0].id]`
- 行操作「设置阶段」：弹窗多选 Checkbox，可清空
- 批量：勾选多人 →「批量设置阶段」→ 覆盖写成弹窗所选阶段（不是追加）
- 空阶段数组：人留在名单，无闯关资格（本轮只展示）

不做审核、添加人员、导入、导出。

## 闯关 Tab

每个阶段一张 Card，标题「阶段n · {名称}」。整 Tab 一次保存。

数据源：`getQuestionStore('practice')` 分类树与启用题目。

| 字段 | 规则 |
|---|---|
| 出题方式 | `random` 随机出题 / `picked` 指定题目 |
| 习题分类 | 必填，TreeSelect 多选，含子类题目 |
| 指定题目 | 仅 `picked`。多选：分类子树内 `status === 启用` 的题。数量 ≥ `questionsPerGate` |
| 每日关卡数量 | 整数 1–20 |
| 每关题数 | 整数 1–50 |
| 答对题数过关 | 整数，`1 ≤ passCorrectCount ≤ questionsPerGate` |

随机出题：不选手动题目，`questionIds` 存空数组。真正抽题留给 C 端。指定题目：存题目 id 池；C 端每关从池中取 `questionsPerGate` 道（本轮不抽、不记通关）。

每个阶段都必须配齐才能保存。分类 id 在保存时必须仍存在于习题库树；打开 Tab 时失效分类标红并阻止保存直到改掉。

## 区域配置

列表：名称、排序、状态（启用/停用）、操作。

弹窗字段：名称（必填，≤20，应用内不重名）、排序（整数，默认追加到末尾）、启用（默认开）。

停用：新报名/已启用区域下拉不再出现该项；已填该区域的报名仍显示原名称。

删除：若任一 `ContestSignup.regionId` 引用该区域，禁止删除并提示改用停用。无引用可删。

## 领域模型

### Region

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | |
| name | string | 应用内唯一 |
| sort | number | 升序 |
| enabled | boolean | |

### Contest

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | |
| name | string | |
| logoUrl | string | |
| description | string | |
| startAt | datetime | |
| endAt | datetime | |
| stages | ContestStage[] | ≥1 |
| signupFields | SignupField[] | 含固定所属区域 |
| h5Page | `none` \| `home` \| `detail` \| `signup` \| `challenge` | 默认 `none` |
| pcPage | 同 h5Page | 默认 `none` |
| access | `public` \| `tenant` | 默认 `tenant` |

### ContestStage

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 赛事内唯一 |
| name | string | |
| startAt | datetime | |
| endAt | datetime | |
| drawMode | `random` \| `picked` | 闯关 |
| categoryIds | number[] | 习题分类 |
| questionIds | number[] | 仅 picked |
| dailyGateCount | number | 1–20 |
| questionsPerGate | number | 1–50 |
| passCorrectCount | number | ≤ 每关题数 |

新建赛事时阶段带闯关默认值：`random`，分类空，每日关卡 1，每关 5 题，答对 3 题。保存赛事表单不强制闯关配齐；闯关 Tab 保存才强制分类与数值合法。

### ContestSignup

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | |
| contestId | number | |
| answers | Record<string, string> | 收集字段 |
| regionId | number \| null | 所属区域 |
| eligibleStageIds | string[] | 可参与阶段 |
| createdAt | datetime | |

## 数据流

- `contestStore`：赛事 CRUD、按 id 读、删赛事时级联报名
- `regionStore`：区域 CRUD、启用列表给下拉
- `signupStore`：按 contestId 查、改 `eligibleStageIds`
- 闯关字段写在 `ContestStage` 上，随 `contestStore.update` 保存
- 习题分类/题目只读练习 store，不改考试模块写入逻辑

无 API。刷新页面种子回初始数据，与现有活动/打卡内存 store 一致。

## 异常

| 场景 | 行为 |
|---|---|
| 举办时间缩短导致阶段越界 | 赛事表单保存失败，提示调整阶段时间 |
| 阶段时间重叠 | 保存失败 |
| 区域全部停用 | 所属区域下拉为空，表单仍可存；报名种子若区域失效显示原名+已停用 |
| 删被引用区域 | 拒绝 |
| 习题分类被删 | 闯关 Tab 标红，保存失败 |
| 指定题目数量 < 每关题数 | 保存失败 |
| 未知赛事 id | 详情/编辑空态 + 返回列表 |
| 旧报名菜单 hash | 进赛事列表 |
| 窄屏 | 沿用应用壳：菜单进抽屉 |

## 测试

- 导航：`applicationMenus['skills-contest']` 无 `signup-list`，有 `region-list`；`signup-list` hash 解析落到 `contest-list`
- 赛事表单：重名、阶段越界、阶段重叠、过关题数 > 每关题数（闯关 Tab）
- 所属区域固定且不可移除
- 报名：默认阶段一；批量设置覆盖而非追加；删阶段后资格 id 被剔除
- 区域：重名；有引用不可删；停用后启用列表不含该项
- 列表状态随举办时间计算

## 非目标

- C 端报名、闯关答题、每日关卡发放与通关记录
- 成绩菜单真实功能
- 打卡逻辑（仅保留现菜单跳转）
- 报名审核、导入、导出、添加人员
- 真实文件上传服务、多租户鉴权实现（`access` 只存枚举）
