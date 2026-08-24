# 兴趣小组 · 活动管理 B 端设计

**日期：** 2026-08-23  
**状态：** 已确认（2026-08-23）  
**范围：** 兴趣小组应用 `interest-groups` 下「活动管理」菜单（列表 / 新建编辑 / 详情与子页签）。不含 C 端、不含样式像素还原。  
**规范：** `build-ant-design-b2b-app` + 本项目【活动】应用页面结构。  
**参考：** `康尼/public/interest-group` PC 管理端（`?embed=pc`）：`ActivitiesSection` / `ActForm` / `AdminActDetail` / `SignupsView` / `addAct`·`updateAct`·`delAct`·`terminateAct`。

---

## 1. 参考项目分析（活动管理）

### 1.1 信息架构与子页面

| 子页面 | 参考形态 | 进入 | 职责 |
|---|---|---|---|
| 活动列表 | `section: 'activities'` | 侧栏「活动管理」 | 搜活动名/小组名、按类型筛、新建、进详情 |
| 新建活动 | `ActForm` 弹层或整页；另有 AI 策划流 | 列表「新建活动」、小组详情「新建活动」 | 填表后**直接发布** |
| 编辑活动 | 同一 `ActForm`，类型/周期规则只读 | 详情「编辑」、移动端卡片编辑 | 改标题、时间、地点、名额、介绍等 |
| 活动详情 | `section: 'actDetail'` | 点列表行 | 概况 + 描述 / 报名 / 评论 / 精彩瞬间 |
| 报名/评论/瞬间独立页 | 参考侧栏另有全局页 | 本应用**不做**独立菜单 | 能力收进活动详情 Tab |

参考 PC 列表另有「AI 策划」（对话生成整份方案）。本项目**只留按钮入口**，不实现对话流。

### 1.2 活动实体字段（`DB.acts`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 系统 | 新建 `a` + 时间戳 |
| `gid` | string | 是 | 所属小组；改小组时默认带入该组 `cat` |
| `title` | string | 是 | 活动标题 |
| `type` | `once` / `recurring` / `series` | 是 | **创建后不可改** |
| `cat` | string | 否 | 分类 key，可与小组分类不同 |
| `cover` | string | 新建必填 | 单张封面 |
| `date` / `endDate` / `spanDays` | 展示串 / 跨天 | 按类型 | 单次、系列场次用起止日；周期用规则文案 |
| `time` | 时段串 | 是 | `HH:mm - HH:mm`；结束早于开始视为次日 |
| `loc` | string | 否 | 集合地点 |
| `cap` | number | 是 | 人数上限 |
| `signed` | number | 系统 | 已报名；新建 0 |
| `desc` | HTML | 否 | 活动介绍，可 AI 帮写 |
| `host` | string | 系统 | 默认取小组负责人 |
| `status` | `upcoming` / `ongoing` / `ended` / `cancelled` | 系统 | 见状态机 |
| `repeatMode` / `repeatWeekdays` | 周期 | 周期必填 | **恰好选 1 个周几**（与参考校验一致） |
| `sessions[]` | 场次 | 系列必填 | 每场起止日+时间 |
| `series` / `seriesIdx` / `seriesTotal` / `seriesSignupMode` | 系列 | 系列 | `independent` 按场次 / `all` 整场 |
| `deadlineMode` / `deadlineDate` / `deadlineTime` / `deadlineHours` / `signupDeadline` | 报名截止 | 否 | `none` / `fixed` / `hours_before` |
| `tags` / `likes` / `liked` / `joinedByMe` / `ai` | 其它 | — | 点赞与 C 端态；B 端列表不编 `joinedByMe` |

**列表展示状态（参考 pill，与存储 status 不完全相同）：** 已终止 / 已结束 / 已满员（`signed >= cap` 且未结束） / 报名中。

### 1.3 三种活动类型逻辑

| 类型 | 创建填什么 | 编辑限制 | 列表聚合 |
|---|---|---|---|
| 单次 `once` | 开始日+时、结束日+时（可跨天） | 可改时间 | 一行一活动 |
| 周期 `recurring` | 周几重复 + 每日时段 | **重复规则只读**，可改时段 | 一行；报名看下场次 |
| 系列 `series` | ≥1 场次；报名方式：按场次 / 整场 | 参考编辑走单次时间控件，系列结构创建后基本冻结 | 多条记录合成一行（共 N 期） |

### 1.4 列表页逻辑

- 搜索：活动名称、小组名称（子串）。
- 类型 Segmented：全部 / 单次 / 周期性 / 系列。
- 表列：活动（封面+标题+小组名）、类型、时间、报名 `signed/cap`、状态。
- 点击行进详情。PC 无行内删除。
- 页操作：新建活动、AI 策划。

### 1.5 保存 / 删除 / 终止

| 动作 | 规则 |
|---|---|
| 新建 | 写入 `status: upcoming`，`signed: 0`，`host` = 小组负责人；**无审核、无草稿** |
| 系列新建 | 拆成多条 `acts`，标题可带「第 i 场」 |
| 编辑 | 按 id 合并；周期不改重复规则 |
| **删除** | 仅 `signed === 0`；系列删整组同 `series`+`gid` |
| **终止** | 未终止且仍有 `upcoming`（系列：任一期 upcoming）→ 相关记录 `cancelled` |
| 进行中 / 已结束 | 不可终止（参考 `canTerminate`）；已终止不可再编辑 |

### 1.6 详情页逻辑

**头：** 封面、分类、类型、报名方式（系列）、状态、标题、时间、所属小组、小组负责人、地点、报名截止。  
**统计：** 已报名、点赞、评论、精彩瞬间。  
**操作：** 编辑（未终止）、终止、删除（无人报名）。  
**Tab：**

| Tab | 内容 |
|---|---|
| 活动描述 | 富文本只读 |
| 报名情况 | 按场次/期次看 `signed/cap` + 报名人（参考用姓名 mock） |
| 评论&互动 | 该活动（系列=各期）评论，可删 |
| 精彩瞬间 | 按活动过滤 |

### 1.7 与小组管理已确认规则的交叉

删除**小组**时：有 `ongoing` 不可删；可删则活动 `groupId` 置空。活动管理列表须能展示「未归属小组」。

---

## 2. 与【活动】应用的关系

【活动】应用（`features/activities`）是**企业活动**：类型=公司/疗休养/体检/项目；有审核、发布、可见范围、报名表单、审批/问卷/奖品 Tab。

兴趣小组活动是**另一实体**，不能共用 `Activity` 类型与 `activityStore`。

**复用的是结构与零件，不是领域模型：**

| 复用 | 来源 | 用法 |
|---|---|---|
| 列表四层骨架 | `ActivityListPage` + `ListPageHeading` / `SearchPanel` | 查询 + 表格 + 工具栏新建 |
| 独立表单页 + 底栏保存 | `ActivityFormPage` | Card 分组、封面单图、`RichTextField` |
| 独立详情 + URL Tab | `ActivityDetailPage` | Header + Statistic + Tabs 懒挂载 |
| 组织树 / 封面 Upload 模式 | 已有实现 | 本页不选发起人；封面交互对齐 |
| 路由四段 hash | `navigation.ts` | `interest-group-activity-detail/{id}/{tab}` |

**明确不复用：** 审核/发布状态机、可见范围、报名字段编辑器、疗休养规则、奖品/问卷/活动审批 Tab。

---

## 3. 方案对比

| | A. 直接挂企业活动 + `groupId` | B. 兴趣小组域内镜像【活动】页面结构（推荐） | C. Drawer 表单 + 详情页 |
|---|---|---|---|
| 对齐参考类型/周期/系列 | 差 | 好 | 好 |
| 对齐 B 端规范 | 中 | 好 | 表单字段多，Drawer 档不够 |
| 实现量 | 小但扭曲 | 中 | 中，编辑/详情承载不一致 |

采用 **B**。表单与详情均为**独立页**（字段 >16、类型联动、富文本、场次子表、高风险终止/删除）。

---

## 4. 领域模型（扩展现有 `interestGroupActivity.ts`）

现有摘要类型不够支撑表单/详情，扩展如下（仍放 `features/interest-groups/model/`，**不**写入 `features/activities`）。

```ts
export type InterestGroupActivityType = 'once' | 'recurring' | 'series';
export type InterestGroupActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
export type SeriesSignupMode = 'independent' | 'all';
export type DeadlineMode = 'none' | 'fixed' | 'hours_before';

export type InterestGroupActivitySession = {
  id: string;
  startAt: string;   // YYYY-MM-DD HH:mm
  endAt: string;
  capacity: number;
  signedCount: number;
  status: InterestGroupActivityStatus;
};

export type InterestGroupActivity = {
  id: number;
  groupId: number | null;
  title: string;
  type: InterestGroupActivityType;
  categoryKey: string;
  coverUrl: string;
  location: string;
  hostName: string;          // 默认小组负责人，只读展示
  capacity: number;
  signedCount: number;
  status: InterestGroupActivityStatus;
  detailHtml: string;
  likeCount: number;
  // once
  startAt?: string;
  endAt?: string;
  // recurring
  repeatWeekdays?: number[]; // 1–7，至少 1 个
  timeStart?: string;        // HH:mm
  timeEnd?: string;
  sessions?: InterestGroupActivitySession[];
  // series
  seriesKey?: string;
  seriesSignupMode?: SeriesSignupMode;
  // deadline
  deadlineMode: DeadlineMode;
  deadlineAt?: string;
  deadlineHoursBefore?: number;
  createdAt: string;
};
```

系列在本项目用**一条**活动记录 + `sessions[]`（避免参考「拆多行再聚合」）。列表/详情按一场活动处理。

报名名单（详情 Tab）：

```ts
export type InterestGroupSignup = {
  id: number;
  activityId: number;
  sessionId?: string;
  name: string;
  department: string;
  signedAt: string;
};
```

评论/瞬间继续用已有 `InterestGroupComment` / `InterestGroupMoment`（`activityId` 过滤）。

### 4.1 状态与操作

| 状态 | 中文 | 可编辑 | 可终止 | 可删除 |
|---|---|---|---|---|
| `upcoming` | 未开始 | 是 | 是 | 仅 `signedCount===0`（系列看各场合计） |
| `ongoing` | 进行中 | 是（不改类型/周期规则） | 否 | 仅无人报名 |
| `ended` | 已结束 | 否 | 否 | 仅无人报名 |
| `cancelled` | 已终止 | 否 | 否 | 仅无人报名 |

列表「已满员」为展示态：`signedCount >= capacity` 且非 ended/cancelled。

创建成功：`upcoming`，小组 `activityCount + 1`。删除/终止后同步小组计数（终止仍计累计活动）。

---

## 5. B 端页面

### 5.1 列表 `InterestGroupActivityListPage`

**路由：** `#/interest-groups/interest-group-activities`  
**面包屑：** 兴趣小组 > 活动管理

**查询（默认收起前 3 项）：**

| 序 | 字段 | 控件 | 默认 | 数据源 |
|---|---|---|---|---|
| 1 | 活动标题 | Input | 空 | — |
| 2 | 所属小组 | Select | 全部 | 小组 store +「未归属小组」 |
| 3 | 活动类型 | Select | 全部 | 单次 / 周期 / 系列 |
| 4 | 活动状态 | Select | 全部 | 未开始 / 进行中 / 已结束 / 已终止 |
| 5 | 分类 | Select | 全部 | 兴趣小组分类 |

**表列：** 活动名称（封面+链接）、所属小组（空则「未归属小组」）、类型、时间（文案函数）、报名（`n/m` + Progress）、状态、操作（查看、编辑若允许）。

**页操作：** 新建活动、**AI 策划**（入口保留，点了占位提示，不接对话生成）。本期不做批量。

从小组详情「新建活动」带 `?` 或 hash record 预填：`goToPage('interest-group-activity-create', String(groupId))`，表单读 `recordId` 为预填 `groupId`。

### 5.2 表单 `InterestGroupActivityFormPage`（独立页）

**路由：**  
`#/interest-groups/interest-group-activity-create`  
`#/interest-groups/interest-group-activity-create/{groupId}`（预填小组）  
`#/interest-groups/interest-group-activity-edit/{id}`

对齐 `ActivityFormPage`：面包屑返回列表、Card 分组、底栏取消/保存。

**Card「活动信息」**

| 字段 | 组件 | 必填 | 联动 |
|---|---|---|---|
| 封面 | Upload 单图（有图隐藏 +） | 新建必填 | 无 |
| 活动标题 | Input 1～60 | 是 | 无 |
| 所属小组 | Select | 是 | 选组后若分类空则带入小组分类；host 只读刷新 |
| 分类 | Select | 否 | 含未分类 |
| 活动类型 | Radio.button | 是 | 新建可选；编辑只读 |
| 开始/结束 | DatePicker+Time（once） | once 是 | 结束日 < 开始日拦截；结束时 < 开始时标「次日」 |
| 重复规则 | 周一～周日 **单选** | recurring 必选恰好 1 天 | 编辑只读 |
| 每日时段 | TimePicker 起止 | recurring 是 | 可跨日 |
| 报名方式 | Radio | series 是 | independent / all |
| 场次安排 | 子表增删行 | series ≥1 | 每行起止；编辑可改时间不可改类型 |

**Card「报名与地点」**

| 字段 | 组件 | 必填 |
|---|---|---|
| 报名截止 | Radio：不限制 / 指定时间 / 开始前 N 小时 | 否 |
| 截止时间 | DateTime | `fixed` 时必填 |
| N 小时 | InputNumber ≥1 | `hours_before` 时必填 |
| 地点 | Input ≤80 | 否 |
| 人数上限 | InputNumber ≥1 | 是 |

**Card「活动介绍」**

`RichTextField` + **AI 帮写**（按分类+标题+时间+地点拼 HTML 模板，mock 延迟；对齐小组简介）。

保存：新建「发布活动」；编辑「保存修改」。成功回列表或详情。

### 5.3 详情 `InterestGroupActivityDetailPage`

**路由：** `#/interest-groups/interest-group-activity-detail/{id}`  
`#/interest-groups/interest-group-activity-detail/{id}/{tab}`  
`tab ∈ detail | signups | comments | moments`

对齐 `ActivityDetailPage`：面包屑回列表；Header 左标识+状态+关键报名数，右操作（主在左）：编辑 / 终止 / 删除。

**统计：** 已报名、点赞、评论、精彩瞬间。

**Tabs：**

- **详情：** Descriptions（小组、类型、分类、时间、地点、负责人、截止、名额）+ 富文本介绍；系列/周期下列场次表。
- **报名：** Table：姓名、部门、场次（单次可隐藏）、报名时间。只读。空态「暂无报名」。
- **评论：** 复用小组详情评论列（活动名可省），删除 `modal.confirm`。
- **瞬间：** 按 `activityId` 过滤。

侧栏选中：`interest-group-activities`。

---

## 6. 路由与导航

`extraPages` 增加：

- `interest-group-activity-create`
- `interest-group-activity-edit`
- `interest-group-activity-detail`

`siderSelectedKey`：上述三者 → `interest-group-activities`。

小组详情「新建活动」改为 `goToPage('interest-group-activity-create', String(groupId))`。  
小组详情活动 Tab 行点击 → `interest-group-activity-detail`。

---

## 7. 代码结构

```text
src/features/interest-groups/
  model/
    interestGroupActivity.ts          # 扩展类型、文案、时间格式、删除/终止纯函数
    interestGroupActivity.test.ts
    interestGroupSignup.ts
    interestGroupStore.ts             # 增加 upsert/delete/terminate activity
  pages/
    InterestGroupActivityListPage.tsx
    InterestGroupActivityFormPage.tsx
    InterestGroupActivityDetailPage.tsx
    + 对应 *.test.tsx
  components/
    不新建公共壳；RichTextField 从 activities/components 引用
```

---

## 8. 验收

- [ ] 列表查询标题/小组/类型生效；未归属小组可筛出。
- [ ] 新建三种类型校验与保存；创建后即未开始。
- [ ] 编辑：类型只读；周期规则只读。
- [ ] 有报名不可删；无报名可删并回列表。
- [ ] 未开始可终止；进行中不可终止。
- [ ] 详情四 Tab；评论可删。
- [ ] 小组详情「新建活动」带入 `groupId`。
- [ ] 封面仅一张；介绍可 AI 帮写。
- [ ] `npx vitest run src/features/interest-groups` 通过。

---

## 9. 本期不做

- AI 策划完整对话生成（列表/表单保留按钮入口，点了占位提示即可）。
- 企业活动的审核/发布/可见范围/报名自定义字段/奖品/问卷/审批。
- 后台代报名、取消报名（参考报名页只读）。
- 周期「按月几号」重复。
- C 端先入组再报名（已有小组 `joinMode`，本菜单不实现 C 端）。

---

## 10. 默认决策（无异议按此实现）

| 项 | 决策 |
|---|---|
| 页面结构 | 对齐【活动】：列表 + 独立表单 + 独立详情 Tab |
| 发布 | 创建即发布，无草稿/审核 |
| 周期周几 | **只能选 1 天** |
| 系列存储 | 一条活动 + `sessions[]`，不拆成多条活动行 |
| AI | 介绍帮写可用；**AI 策划只留入口** |
| 删除 | 合计报名人数为 0 才可删 |
| 终止 | 仅未开始（系列：仍有未开始场次） |

评审若要改默认决策，直接改上表即可。
