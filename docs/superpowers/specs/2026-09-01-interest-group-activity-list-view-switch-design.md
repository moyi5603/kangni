# 兴趣小组 · 活动列表视图切换

**日期：** 2026-09-01  
**状态：** 待实现（对话已确认交互）  
**范围：** B 端兴趣小组应用「活动管理」列表页（`InterestGroupActivityListPage`，含小组详情活动 Tab 嵌入同一组件）。  
**不含：** C 端 H5/PC、企业【活动】应用、兴趣小组分类/小组列表、新接口。

**已选决策：**

| 项 | 选择 |
|---|---|
| 范围 | 仅 B 端活动管理 |
| 卡片操作 | 「更多」菜单承载行操作；批量勾选只在列表模式 |
| 默认 / 记忆 | localStorage 记上次；无记录或非法值用列表 |

---

## 1. 目标

管理员在同一套筛选结果上，在**表格列表**与**封面卡片**之间切换。列表适合批量与密集字段；卡片适合靠封面识别活动。

成功标准：一切换即换布局；刷新后仍是上次视图；卡片能完成与表格相同的单条操作；列表批量能力不被卡片模式破坏。

---

## 2. 交互与布局

### 2.1 切换控件

- 位置：结果区 `Card` 顶部工具栏。
- 左：`共 N 条`（两种视图都显示）。
- 右按钮组顺序：`展示形式 Segmented` → `新建活动` → `AI 策划`。
- 控件：Ant Design `Segmented`，选项图标 `UnorderedListOutlined`（列表）、`AppstoreOutlined`（卡片）。`aria-label`：`展示形式`。
- 视图切换不是业务主动作，放在新建之前。

### 2.2 列表模式（现状）

- 表格、行勾选、批量操作条、行内 `TableRowActions` 保持现行为。
- 筛选区、查询/重置不变。
- 分页：沿用表格现有 `pageSize` / `showSizeChanger` / `showTotal`。两种视图共用当前页与 pageSize；切视图不重置页码（超出总页时落到最后一页）。卡片模式用 Ant Design `Pagination` 放在网格下方，参数与表格一致。

### 2.3 卡片模式

- 响应式网格：宽屏约 4 列，中屏 3，窄屏 2，更窄 1。卡片之间用规范间距，不写死整页宽度。
- 图文卡遵循 `DESIGN.md`：紧凑密度；封面区域与文字约 2:1；标题单行省略（Tooltip/title 给全文）；摘要最多两行。
- 卡片内容：
  - 封面 `coverUrl`
  - 标题
  - 摘要行：所属兴趣圈名称（`groupId` 嵌入详情 Tab 时可不重复兴趣圈名，只留时间）、活动时间 `startAt ~ endAt`
  - Tag：审核状态、生命周期状态（色值与表格列一致）
  - 置顶活动在网格中仍排在前面（沿用现排序），可用小 Tag「置顶」
- 点击封面或标题：进入活动详情（与现「详情」相同导航）。
- 卡脚仅一个 `Dropdown`「更多」，菜单项为该行全部操作，顺序与表格一致：详情 → 编辑 → 复制 → 状态动作（提交审批 / 审核 / 撤销 / 发布）→ 置顶/取消置顶 → 截止报名 / 恢复报名（按规则出现）→ 终止活动 → 删除。危险项分组与禁用/Tooltip 与表格相同。
- 无 checkbox、无批量操作条。从列表切到卡片时清空 `selectedRowKeys`。从卡片切回列表不恢复勾选。

### 2.4 空态

两种视图共用现有 `Empty` 与筛选空结果文案。

---

## 3. 状态与数据

- 界面状态 `view: 'list' | 'card'`。
- 持久化 key：`interest-group-activity-list-view`，值仅 `list` 或 `card`。活动管理独立页与小组详情活动 Tab **共用**该 key。
- 初始化：读 storage；缺 key、非预期字符串、抛错 → `list`。
- 切换：立刻 `setItem`。
- 不进 URL。筛选、排序、活动实体、权限函数零改动。
- 实现上抽出 `buildInterestGroupActivityRowActions(record)`（或同页纯函数），表格操作列与卡片菜单共用，禁止复制两套 `can*` 分支。

---

## 4. 非目标

- 不为「以后活动应用也要切」抽 `src/shared` 通用开关。
- 不改卡片规范 Token；不改 C 端活动卡样式。
- 不在卡片模式做多选批量。

---

## 5. 测试与验收

- 现有 `InterestGroupActivityListPage.test.tsx` 默认列表路径继续通过（标题、种子数据、行操作顺序、嵌入 `groupId` 锁定）。
- 新增：storage 为 `card` 时渲染封面网格、出现「展示形式」、不出现表格行选择控件；非法 storage 回落到表格。
- 手工：切视图、刷新仍记住、卡片「更多」能进详情/编辑、切卡片后批量条消失。

---

## 6. 主要改动文件

- `src/features/interest-groups/pages/InterestGroupActivityListPage.tsx`
- `src/features/interest-groups/pages/InterestGroupActivityListPage.test.tsx`
- 如卡片样式无法用现有 class 完成：同 feature 内最小 CSS，不改全局 Token。
