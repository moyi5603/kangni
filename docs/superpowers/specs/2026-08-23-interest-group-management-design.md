# 兴趣小组 · 小组管理 B 端设计

**日期：** 2026-08-23  
**状态：** 已确认（2026-08-23）  
**范围：** 兴趣小组应用 `interest-groups` 下「小组管理」菜单的完整 B 端能力（列表 / 新建编辑 / 详情与子页签）。不含 C 端、不含样式像素还原。  
**规范：** `build-ant-design-b2b-app` + 本项目既有 `activities` 模块模式。  
**参考：** `康尼/public/interest-group` PC 管理端（`?embed=pc`），核心文件 `5f3ec28e-….js`（小组列表/详情）、`191074b9-….js`（表单/状态/store）、`a91a7bed-….js`（数据模型）。

---

## 1. 参考项目分析（小组管理）

### 1.1 信息架构与子页面

| 子页面 | 参考路由形态 | 进入方式 | 职责 |
|---|---|---|---|
| 小组列表 | `section: 'groups'` | 侧栏「小组管理」 | 浏览、搜索、新建、编辑、删除、进入详情 |
| 新建/编辑小组 | `GroupForm` 弹层（PC）或整页（H5） | 列表「新建」、卡片编辑、详情「编辑」 | 维护小组基础资料 |
| 小组详情 | `section: 'groupDetail', gid` | 点击列表卡片 | 查看概况；下钻活动/成员/评论/精彩瞬间 |

参考项目**未**在小组详情内做入组审核；待审申请集中在「工作台」`PendingJoinsPage`，审核通过会更新 `members` 计数。

### 1.2 小组实体字段（`DB.groups`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 系统 | 新建时 `g` + 时间戳 |
| `name` | string | 是 | 小组名称 |
| `cat` | string | 否 | 分类 key，空为「未分类」；选项来自「分类管理」 |
| `lead` | string | 是 | 小组负责人；B 端按组织架构选人 |
| `members` | number | 系统 | 成员数；新建默认 `1`（含组长）；入组审核通过 +1 |
| `acts` | number | 系统/派生 | 累计活动数；随活动创建维护 |
| `join` | `'free' \| 'approve'` | 是 | 加入方式：自由加入 / 审核加入 |
| `intro` | string | 否 | 小组简介 |
| `tags` | string[] | 否 | 展示标签，可增删 |
| `area` | string | 否 | 活动区域，如「总部 · 滨江园区」 |
| `cover` | string | 新建必填 | 封面图 URL 或 DataURL |
| `joined` | boolean | C 端 | 当前用户是否已入组（B 端列表不展示） |
| `hot` | boolean | 否 | 热门标记（种子数据，B 端列表可不暴露） |

### 1.3 列表页逻辑

- **搜索：** 仅按 `name` 子串过滤（无分类、加入方式筛选）。
- **展示（参考为卡片）：** 封面、分类角标、名称、简介两行、成员数、活动数、加入方式标签。
- **分页：** 默认 15 条，可选 15 / 50 / 100。
- **操作：**
  - 页级：新建小组。
  - 行级：编辑、删除、点击整卡进详情。
- **删除：** 二次确认「删除后不可恢复」；参考实现直接 `filter` 移除，**不校验**是否有关联活动/成员（活动数据可能残留 `gid`）。

### 1.4 新建/编辑表单逻辑

| 字段 | 组件 | 校验与联动 |
|---|---|---|
| 封面图 | 图片上传 | 新建必填；**仅 1 张**；有图时隐藏「+」入口，只可更换/删除 |
| 小组名称 | 文本 | 必填，`trim` 非空 |
| 分类 | 下拉 | 含「未分类」；数据来自分类管理 |
| 小组负责人 | 组织树 TreeSelect | 仅叶子员工可选，数据复用 `orgPeoplePickerTree` |
| 小组简介 | 多行文本 | 可选；**AI 帮写**按当前分类填充模板文案（mock 延迟，可再改） |
| 加入方式 | 二选一卡片 | `free` / `approve` |
| 活动区域 | 文本 | 可选 |
| 标签 | 输入 + 添加按钮 | Enter 添加；去重；可逐个删除 |

**保存：**

- 新建：`{ ...fields, id, members: 1, acts: 0, joined: true }` 插入列表头部。
- 编辑：按 `id` 合并更新。

### 1.5 小组详情逻辑

**头部信息：** 封面、分类、名称、简介、组长、加入方式、活动区域。  
**统计区（参考为 4 卡）：** 成员数、累计活动、本月互动（写死 mock）、精彩瞬间条数。  
**页级操作：** 编辑小组、新建活动（跳转活动模块，带 `gid` 上下文）。

**页签：**

| Tab | 内容 | 数据来源 | 行操作 |
|---|---|---|---|
| 活动 | 该组活动表格 | `acts.filter(a => a.gid === gid)` | 点击行进活动详情（活动管理模块） |
| 成员 | 头像网格，组长置顶标「组长」 | 参考用 `DB.NAMES` mock；展示姓名 + 部门 | 只读 |
| 评论 | 该组活动下评论列表 | `comments` 按活动 id 过滤 | 可删评论（`delComment`） |
| 精彩瞬间 | 图片卡片网格 | `moments.filter(m => m.gid === gid)` | 点击进瞬间详情 |

**成员部门：** 优先 `employees` 表匹配姓名，否则按姓名 hash 回落部门名。

### 1.6 与小组管理相关、但不在同一菜单的联动

| 能力 | 位置 | 对小组的影响 |
|---|---|---|
| 分类管理 | 侧栏「分类管理」 | 删除分类 → 关联小组 `cat` 置空 |
| 入组审核 | 工作台待办 | 通过 → `members + 1`；拒绝 → 清申请者 `pending` |
| 活动管理 | 侧栏「活动管理」 | 创建活动 → 可增 `acts`；活动归属 `gid` |
| 员工端入组 | C 端 | `free` 直接入组；`approve` 产生 `joinRequests` |

---

## 2. 本项目设计目标

在 `康尼2` 的 **兴趣小组** 应用中实现与参考等价的「小组管理」业务能力，交互对齐 `build-ant-design-b2b-app` 与现有 **活动** 模块（`ActivityListPage` / `ActivityDetailPage` / `ActivityCategoryListPage`），数据层采用 `features/*/model/*Store` + Vitest 模式。

**本期交付：** B 端小组 CRUD + 详情四页签（活动/成员/评论/精彩瞬间只读或轻量管理）。  
**本期不做：** C 端、AI 帮写简介、工作台待办、入组审核独立页（可在概览后续迭代）、真实接口与权限体系。

---

## 3. 领域模型（`src/features/interest-groups/model/`）

### 3.1 `InterestGroup`

```ts
export type InterestGroupJoinMode = 'free' | 'approve';

export type InterestGroup = {
  id: number;
  name: string;
  categoryKey: string;        // 空字符串 = 未分类
  leadName: string;
  leadEmployeeId?: string;    // 对接组织员工
  memberCount: number;
  activityCount: number;
  joinMode: InterestGroupJoinMode;
  intro: string;
  tags: string[];
  area: string;
  coverUrl: string;
  createdAt: string;          // YYYY-MM-DD HH:mm:ss
};
```

### 3.2 关联实体（详情 Tab 只读/轻量操作用）

```ts
export type InterestGroupMember = {
  groupId: number;
  employeeId: string;
  name: string;
  department: string;
  role: 'lead' | 'member';
  joinedAt: string;
};

export type InterestGroupJoinRequest = {
  id: number;
  groupId: number;
  applicantName: string;
  department: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
};
```

活动、评论、精彩瞬间复用兴趣小组域内后续模块类型；小组详情「活动」Tab 仅消费 `InterestGroupActivity` 摘要字段（与参考 `ActTable` 列对齐）。

```ts
/** 与参考项目一致；`ongoing` = 进行中，为删除小组的阻断条件 */
export type InterestGroupActivityStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

export type InterestGroupActivity = {
  id: number;
  groupId: number | null;   // 小组删除后置 null（未归属）
  title: string;
  type: 'once' | 'recurring' | 'series';
  status: InterestGroupActivityStatus;
  // …详情 Tab 展示所需摘要字段
};
```

周期活动若存在任一场次 `status === 'ongoing'`，整组活动视为「进行中」，同样阻断删除小组。

### 3.3 派生与一致性规则

| 规则 | 说明 |
|---|---|
| `activityCount` | 优先 store 内按 `groupId` 计数；创建/删除活动时同步 |
| `memberCount` | 成员表计数；新建小组初始为 1（组长） |
| **删除小组** | 见下节「删除小组规则」 |
| 分类删除 | 与参考一致：小组 `categoryKey` → `''` |

#### 删除小组规则（已确认）

1. **阻断条件：** 该小组下存在 **进行中**（`status === 'ongoing'`）的活动；周期活动任一场次为 `ongoing` 亦视为进行中。此时禁止删除，`message.warning` 提示「存在进行中的活动，无法删除小组」。
2. **允许删除：** 无进行中活动；关联活动仅为 **未开始**（`upcoming`）、**已结束**（`ended`）、**已终止**（`cancelled`），或小组无任何活动。
3. **删除后处理（方案 A）：** 移除小组记录；将该组下所有活动的 `groupId` 置为 `null`，活动管理侧展示为「未归属小组」。`activityCount` 随小组移除不再统计，活动实体保留。
4. **确认文案：** 有可删除的关联活动时，补充说明「N 个活动将变为未归属小组」；无关联活动时仅提示不可恢复。

---

## 4. B 端页面设计（build-ant-design-b2b-app）

### 4.1 页面模式选型

| 场景 | 参考承载 | 本项目承载 | 理由 |
|---|---|---|---|
| 小组列表 | 卡片网格 | **搜索列表页 + Table** | 与 `ActivityListPage` 一致，符合 B 端规范 |
| 新建/编辑 | Modal / 整页 | **Drawer（宽 720）** | 8 字段 + 封面上传 + 标签，7～16 字段区间；新建与编辑同承载 |
| 小组详情 | 整页 + Tab | **独立详情页 + Tabs** | 多 Tab、统计区、跨模块跳转，字段与操作超过抽屉上限 |

详情与编辑统一复杂度：**详情为独立页；编辑为 Drawer**（详情内点「编辑」打开同一 Drawer，与活动模块「列表 + 详情页 + 表单页」略有不同，因编辑字段含上传仍适合 Drawer，详情信息量适合独立页——符合规范「分别评估后取较高档」）。

### 4.2 小组列表页 `InterestGroupListPage`

**路由：** `#/interest-groups/interest-group-list`  
**面包屑：** 兴趣小组 > 小组管理

**查询区（默认收起 3 项）：**

| 顺序 | 字段 | 控件 | 默认值 | 数据源 |
|---|---|---|---|---|
| 1 | 小组名称 | Input | 空 | — |
| 2 | 分类 | Select | 全部 | `interestGroupCategoryStore` 启用项 +「全部」 |
| 3 | 加入方式 | Select | 全部 | 全部 / 自由加入 / 审核加入 |

**表格列：**

| 列 | 说明 |
|---|---|
| 小组名称 | 链接 → 详情；左侧 48×48 封面缩略图 |
| 分类 | Tag，未分类显示「—」 |
| 小组负责人 | 文本 |
| 成员数 | 右对齐 |
| 活动数 | 右对齐 |
| 加入方式 | Tag：自由加入 / 审核加入 |
| 活动区域 | 超长 Tooltip |
| 创建时间 | — |
| 操作 | 编辑、删除（危险，Popconfirm；有进行中活动时删除按钮 `disabled` + Tooltip） |

**页级操作：** 新建小组（打开 Drawer）。  
**批量操作：** 本期不做。  
**分页：** `b2bStandards.table` 默认 pageSize；URL 同步 `page`、`pageSize`、查询条件。

**空态：** 无数据 / 无匹配分别文案。

### 4.3 新建/编辑 Drawer `InterestGroupFormDrawer`

**触发：** 列表「新建」、行「编辑」、详情「编辑」。  
**标题：** 新建兴趣小组 / 编辑小组。

**表单项（标签与控件同行）：**

| 字段 | 组件 | 必填 | 校验 |
|---|---|---|---|
| 封面 | Upload（picture-card，`maxCount=1`，有图隐藏上传格） | 新建必填 | 仅 1 张；JPG/PNG；建议 16:9 |
| 小组名称 | Input | 是 | 1～40 字 |
| 分类 | Select | 否 | 含「未分类」 |
| 小组负责人 | TreeSelect | 是 | `orgPeoplePickerTree`，部门节点不可选 |
| 加入方式 | Radio.Group | 是 | free / approve |
| 活动区域 | Input | 否 | ≤ 60 字 |
| 标签 | Select mode=tags | 否 | 每项 ≤ 12 字，最多 8 个 |
| 小组简介 | Input.TextArea +「AI 帮写」 | 否 | ≤ 500 字；按钮按分类写入模板，可覆盖后继续编辑 |

**底部：** 取消 / 保存（主按钮）。保存成功 `message.success` 并刷新列表或详情。

### 4.4 小组详情页 `InterestGroupDetailPage`

**路由：**

- `#/interest-groups/interest-group-detail/{id}`
- `#/interest-groups/interest-group-detail/{id}/{tab}`，`tab ∈ acts | members | comments | moments`

**面包屑：** 兴趣小组 > 小组管理 > {小组名称}  
**返回：** 回列表，保留列表 URL 查询状态（与活动详情一致）。

**详情 Header（高级详情）：**

- 左：名称、分类 Tag、加入方式 Tag、组长、活动区域、简介摘要。
- 右：**编辑**（次）、**新建活动**（主，跳转 `#/interest-groups/interest-group-activities` 创建流并带 `groupId`，活动模块未就绪时 `message.info` 占位）。

**统计行（`Statistic` × 4）：** 成员数、累计活动、评论数（组内活动聚合）、精彩瞬间数。

**Tabs：**

#### Tab `acts` — 活动

表格列对齐参考：活动名（含封面）、类型（单次/周期/系列）、时间、报名（signed/cap + 进度）、状态（报名中/已满/已结束/已终止）。  
行点击 → 兴趣小组活动详情（后续 `interest-group-activities` 模块）；本期可 Modal 摘要或占位。

#### Tab `members` — 成员

Table：姓名、部门、角色（组长/成员）、加入时间。组长行高亮。本期只读，不提供移除成员。

#### Tab `comments` — 评论

Table：活动名称、评论人、内容摘要、时间、点赞数。行操作「删除」→ `modal.confirm`（与参考 `delComment` 一致）。

#### Tab `moments` — 精彩瞬间

Table 或卡片列表：缩略图、作者、文案摘要、关联活动、时间。点击进瞬间详情（后续模块）。

**懒加载 Tab：** 与 `ActivityDetailPage` 相同，首次访问才挂载 Tab 内容。

### 4.5 导航与 `siderSelectedKey`

| page key | 侧栏选中 |
|---|---|
| `interest-group-list` | 小组管理 |
| `interest-group-detail` | 小组管理 |
| `interest-group-create` / `interest-group-edit` | 小组管理 |

`parseLocationHash` 扩展 `extraPages`：`interest-group-detail`。  
`toLocationHash('interest-groups', 'interest-group-detail', id, tab)` 四段 hash。

---

## 5. 代码结构

```text
src/features/interest-groups/
  model/
    interestGroup.ts           # 类型、常量、校验纯函数
    interestGroupCategory.ts   # 分类（与「分类管理」菜单共用）
    interestGroupStore.ts      # 小组 CRUD + hooks
    interestGroupStore.test.ts
    interestGroupMember.ts     # 成员种子与查询
    interestGroupStats.ts      # 详情统计聚合
  pages/
    InterestGroupListPage.tsx
    InterestGroupDetailPage.tsx
    InterestGroupListPage.test.tsx
    InterestGroupDetailPage.test.tsx
  components/
    InterestGroupFormDrawer.tsx
    InterestGroupFormDrawer.test.tsx
```

`App.tsx` 接入上述页面；分类管理、活动管理、概览仍可为占位或后续任务。

---

## 6. 种子数据

对齐参考 8～10 个小组：含 `free` / `approve` 各若干、不同分类、封面路径用项目 `public` 静态图或色块占位。  
至少 1 个 `approve` 组带 pending `JoinRequest`（供后续概览待办，本期详情可不展示）。  
每个组 2～5 名 mock 成员，组长与 `leadName` 一致。

---

## 7. 验收标准

- [ ] 侧栏「小组管理」进入列表，查询名称/分类/加入方式生效，URL 可分享筛选状态。
- [ ] 新建小组：封面+名称+小组负责人+加入方式校验；保存后列表可见，成员数 = 1。
- [ ] 编辑小组：Drawer 回显；修改加入方式不影响历史成员数。
- [ ] 删除小组：存在 `ongoing` 活动时不允许删除并提示；仅 `upcoming` / `ended` / `cancelled` 时可删，确认后活动 `groupId` 置空。
- [ ] 详情四 Tab 数据与参考逻辑一致（组内过滤）；评论可删。
- [ ] 「新建活动」携带 `groupId` 意图（占位或真实跳转）。
- [ ] `npx vitest run src/features/interest-groups` 通过。

---

## 8. 分期建议

| 阶段 | 内容 |
|---|---|
| **P1（本规格）** | 模型 + Store + 列表 + Drawer + 详情四 Tab |
| P2 | 分类管理菜单与小组分类联动 |
| P3 | 活动管理菜单 + 详情「活动」Tab 真实跳转 |
| P4 | 概览待办（入组审核）与 `approve` 联动 |
| P5 | C 端读写同一 store |

---

## 9. 明确不做（本期）

- 参考项目卡片网格布局、本月互动 mock 指标的真实统计。
- 真实 LLM（AI 帮写为分类模板 + 延迟 mock）。
- 成员增删、转让组长、批量导入成员。
- 小组「热门」运营字段的后台编辑。
- 服务端 API、角色权限、导出。

---

## 10. 已确认决策

| 项 | 决策 |
|---|---|
| 删除后活动归属 | 方案 A：`groupId` 置 `null`，展示「未归属小组」 |
| 删除前置校验 | **有进行中活动不可删**；未开始 / 已结束 / 已终止可删 |
| 活动状态枚举 | `upcoming` 未开始 · `ongoing` 进行中 · `ended` 已结束 · `cancelled` 已终止 |

实现时在 `interestGroupStore` 提供 `canDeleteGroup(groupId)` 与 `deleteGroup(groupId)`，单测覆盖阻断与置空两种路径。
