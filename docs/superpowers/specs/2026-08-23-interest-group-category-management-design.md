# 兴趣小组 · 分类管理 B 端设计

**日期：** 2026-08-23  
**状态：** 已确认（方案 C，2026-08-23）  
**范围：** 兴趣小组应用 `interest-groups` 下「分类管理」菜单。分类同时服务于**小组**与**小组活动**。不含 C 端、不含样式像素还原。  
**规范：** `build-ant-design-b2b-app` + 本项目【活动】应用 `ActivityCategoryListPage` 结构。  
**参考：** `康尼/public/interest-group` PC 管理端 `CategoriesSection` / `CatFormFields` / `saveCat`·`delCat`·`moveCat`（`191074b9-….js`、`a91a7bed-….js`）。

> 需求原文「设计本项目的活动管理」按上下文理解为：**设计兴趣小组的分类管理**（不是再做一遍企业【活动】模块）。

---

## 1. 参考项目分析（分类管理）

### 1.1 信息架构与子页面

| 子页面 | 参考形态 | 进入 | 职责 |
|---|---|---|---|
| 分类列表 | `section: 'categories'` | 侧栏「分类管理」 | 排序、计数、新建、编辑、上移/下移、删除 |
| 新建/编辑 | PC：`Modal` + `CatFormFields`；H5：`CatFormPage` 整页 | 列表「新建分类」/ 行「编辑」 | 名称、图标、颜色、排序 |
| 独立详情页 | **无** | — | 点击行即编辑，无只读详情 |

报名/评论/瞬间**不**挂在分类下。无启用/禁用。

### 1.2 分类实体（`CATS` / `store.cats`）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `key` | string | 系统 | 新建 `c` + 时间戳；小组/活动用 `cat` 引用 |
| `label` | string | 是 | 展示名；`trim` 非空，**≤12 字** |
| `icon` | string | 参考必填 | 图标名（本项目**去掉**） |
| `color` | string | 参考必填 | CSS token（本项目**去掉**） |
| `order` | number | 是 | 升序；同 order 按 `createdAt` 倒序（新在前） |
| `createdAt` | number | 系统 | 新建 `Date.now()`；编辑保留 |

内置种子：运动健身 / 学习充电 / 职场成长 / 团队拓展 / 公益志愿 / 桌游电竞 / 电影音乐 / 其他。  
空 `cat` 走系统项「未分类」（`key: ''`），**不是**可删的分类行。

### 1.3 列表逻辑

- **无搜索。** 表列：排序、分类（图标+名）、颜色、小组数、活动数、操作。
- **计数：** `groups.filter(g => g.cat === key)`、`acts.filter(a => a.cat === key)`。
- **操作：** 新建；行：编辑、上移、下移（首尾禁用）、删除。
- **上移/下移：** 与相邻项交换 `order`；若 `order` 相同则交换 `createdAt`。

### 1.4 表单逻辑

- 名称必填 ≤12。
- 图标网格、颜色色板、排序数字、预览条。
- 保存：存在 `key` 则合并，否则追加。

### 1.5 删除逻辑（与【活动】分类不同）

**允许删除已被使用的分类。** 删除后：

- 分类从列表移除；
- `groups.cat === key` → `''`（未分类）；
- `acts.cat === key` → `''`（未分类）。

确认文案带计数：「将有 N 个小组、M 个活动变为未分类」。

### 1.6 下游影响

小组表单、活动表单下拉：`catsList()` +「未分类」。C 端卡片用 icon/color 装饰（本项目 B 端不做、C 端本期不做）。

---

## 2. 与【活动】分类管理的关系

【活动】`ActivityCategoryListPage`：查询名称+状态、表格、新建弹窗、行编辑/删除/启用禁用、批量启用禁用。删除**拦截**「已被活动使用」。改名同步活动 `category` 字符串。无排序、无图标颜色。

兴趣小组分类是**另一实体**（`key` 引用，同时绑小组+活动），不能写入 `features/activities` 的 `categoryStore`。

**复用结构，不复用领域模型：**

| 复用 | 来源 | 用法 |
|---|---|---|
| 列表四层骨架 | `ActivityCategoryListPage` + `ListPageHeading` / `SearchPanel` | 查询 + 表格 + 工具栏新建 |
| 新建/编辑 Modal | 同页 `Modal` + 横向 `Form` | 字段少、低风险 |
| 启用/禁用 + 批量 | 同行操作 + 勾选批量条 | 【活动】已有，参考项目没有；本项目保留 |
| 危险删除确认 | `modal.confirm` | 文案用参考的解绑计数，不拦截 |

**明确不复用：** 按名称拦截删除、把分类名当活动字段值（本域用稳定 `key`）。

---

## 3. 方案对比

| | A. 原样抄参考（无状态、无查询、有 icon/color） | B. 原样抄【活动】（拦截删除、无排序） | C. 【活动】页骨架 + 参考解绑/排序（推荐） |
|---|---|---|---|
| 对齐参考删除/排序 | 好 | 差 | 好 |
| 对齐 B 端规范与【活动】页 | 差 | 好 | 好 |
| 图标颜色 | 有（已否决） | 无 | 无 |

采用 **C**。

---

## 4. 领域模型

扩展现有 `interestGroupCategory.ts`（已有 `key/label/order/status`），**不加** `icon`/`color`。

```ts
export type InterestGroupCategory = {
  key: string;                 // 稳定引用；新建 `c` + 时间戳
  label: string;
  order: number;
  status: '启用' | '禁用';
  createdAt: string;           // YYYY-MM-DD HH:mm:ss
};
```

小组、活动继续存 `categoryKey`。改**名称**只改 `label`，不改 `key`，下游无需级联改名。

禁用后：小组/活动表单下拉只出「启用」+「未分类」；已绑禁用分类的存量记录仍显示原 `label`（或「未分类」若 key 已删）。

---

## 5. B 端页面

**仅一页。** 路由已有：`#/interest-groups/interest-group-categories`。  
无独立详情、无 extraPages。

页面：`InterestGroupCategoryListPage`，对齐 `ActivityCategoryListPage`。

### 5.1 查询（2 项，无需展开）

| 序 | 字段 | 控件 | 默认 | 数据源 |
|---|---|---|---|---|
| 1 | 分类名称 | Input | 空 | `label` 子串 |
| 2 | 状态 | Select | 全部 | 启用 / 禁用 |

### 5.2 表格

按 `order` 升序，同 order 按 `createdAt` 新在前。

| 列 | 说明 |
|---|---|
| 分类名称 | 纯文本，无图标无色块 |
| 排序 | `order` |
| 小组数 | `groups.filter(g => g.categoryKey === key).length` |
| 活动数 | `activities.filter(a => a.categoryKey === key).length` |
| 状态 | Tag 启用/禁用 |
| 操作 | 编辑、上移、下移、删除、启用/禁用 |

页操作：新建分类。勾选后：批量启用、批量禁用、取消选择。不做批量删除。

上移/下移：对**当前完整列表排序结果**（不受筛选影响更稳：对 store 全量排序后交换相邻）交换 `order`；首行禁上移、末行禁下移。筛选中仍对全量相邻交换，避免筛后「相邻」错位。

### 5.3 新建/编辑 Modal

字段 ≤3，用弹窗（与【活动】分类一致）。

| 字段 | 组件 | 必填 | 校验 / 联动 |
|---|---|---|---|
| 分类名称 | Input ≤12，showCount | 是 | trim；全表 `label` 去重（不含自身） |
| 排序 | InputNumber ≥0 | 否 | 新建默认 `max(order)+10`；无则 10 |
| 状态 | 仅新建默认启用；编辑不在弹窗改（用行列/批量） | — | 无 |

**不要**图标选择、颜色选择、预览色条。

### 5.4 删除

始终可删。确认：

- 无引用：`确认删除分类「X」？删除后不可恢复。`
- 有引用：`确认删除分类「X」？将有 N 个小组、M 个活动变为未分类，删除后不可恢复。`

执行：`deleteInterestGroupCategory(key)` → 移除分类；小组/活动 `categoryKey === key` 置 `''`。已有 `clearInterestGroupCategory` 可复用。

与删除**小组**规则独立（小组删看进行中活动）。

### 5.5 启用/禁用

与【活动】相同交互。禁用不改已有 `categoryKey`，只影响下拉可选集：`listEnabledInterestGroupCategories`。

---

## 6. 代码结构

```text
src/features/interest-groups/
  model/interestGroupCategory.ts        # 加 createdAt、校验、排序比较
  model/interestGroupStore.ts           # upsert / delete / move / setStatus
  pages/InterestGroupCategoryListPage.tsx
  pages/InterestGroupCategoryListPage.test.tsx
src/app/App.tsx                         # 替换 Placeholder
```

不改 `features/activities`。

---

## 7. 验收

- [ ] 列表可按名称、状态查；列无图标、无颜色。
- [ ] 新建/编辑弹窗只有名称+排序；名称 ≤12、不可重名。
- [ ] 上移/下移交换排序；首尾按钮禁用。
- [ ] 删除有引用时小组+活动变为未分类，分类行消失。
- [ ] 禁用后新建小组/活动选不到该分类。
- [ ] 批量启用/禁用生效。
- [ ] `npx vitest run src/features/interest-groups` 通过。

---

## 8. 本期不做

- 分类图标、颜色、预览条。
- 分类独立详情页。
- 批量删除。
- C 端分类筛选视觉。
- 与企业【活动】分类数据打通。

---

## 9. 默认决策

| 项 | 决策 |
|---|---|
| 页面 | 单列表 + Modal，对齐【活动】分类 |
| 图标/颜色 | **去掉** |
| 删除 | 参考：解绑为未分类，不拦截 |
| 启用禁用 | 对齐【活动】，参考没有也做 |
| 排序 | 参考：`order` + 上移下移 |
| 名称长度 | 参考 12 字（【活动】是 10） |
| key | 稳定；改名不改 key |
