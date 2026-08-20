# C 端活动页 · H5 与 PC 分页面

**状态：** 待实现  
**日期：** 2026-08-18  
**范围：** 康尼2 内两条独立 C 端树：H5 活动、PC 活动广场。首页 + 详情 + 报名。

## 背景

B 端活动管理已在康尼2 跑通。员工端要对齐康尼1 左机模内容（报名中大卡、类型 Tab、列表卡），但不要 Showcase 双机模，也不套 B 端顶栏/侧栏。PC 用同一套员工端信息，改成宽屏门户。

C 端不参考 `build-ant-design-b2b-app`，不使用 antd。

## 决策摘要

| 项 | 选择 |
|---|---|
| 入口 | 独立 hash，不进后台壳 |
| H5 | 康尼1 左机模信息架构 |
| PC | 同一内容的宽屏门户 |
| 深度 | 首页 + 详情 + 报名 |
| 数据 | 现有 `activityStore`，只露已发布 |
| 报名 | 内存 `signupStore`，演示用户固定 |
| 赞/星/评 | 只展示，不写回 |
| UI 栈 | React + 独立 CSS，无 antd、无 Tailwind |

## 路由

解析写在 `src/app/navigation.ts`。hash 以 `c/` 开头则走 C 端，否则走现有后台。

| URL | 页 |
|---|---|
| `#/c/h5` | H5 首页 |
| `#/c/h5/{id}` | H5 详情，`id` 为活动数字 id |
| `#/c/pc` | PC 首页 |
| `#/c/pc/{id}` | PC 详情 |

非法 `id`、未发布、或不存在：该端详情页展示「活动不存在」+ 返回列表，不回退后台。

H5 首页顶栏返回 → `#/workbench/dashboard`。  
PC 顶栏品牌「康尼」→ `#/workbench/dashboard`。  
详情返回 → 同端首页。  
PC 顶栏提供「手机版」链到 `#/c/h5`；H5 不链 PC。

`App` 在 C 端 hash 下只渲 `CEndApp`，不渲 Header / Sider / Drawer。`main.tsx` 仍可包 `ConfigProvider`，C 端页面不调用 antd 组件。

## 文件边界

| 文件 | 职责 |
|---|---|
| `src/app/CEndApp.tsx` | 读 hash，挂 H5 或 PC 壳 |
| `src/app/App.tsx` | `#/c/` 分支到 `CEndApp` |
| `src/app/navigation.ts` | 解析/生成 C 端 hash，后台解析保持不变 |
| `src/features/c-end/activities/model/clientActivity.ts` | 已发布筛选、报名中、Tab、排序、摘要、社交展示数 |
| `src/features/c-end/activities/model/signupStore.ts` | 内存报名；订阅刷新 |
| `src/features/c-end/activities/components/StatusPill.tsx` | 状态 pill |
| `src/features/c-end/activities/components/ActivityMeta.tsx` | 时间 + 地点行 |
| `src/features/c-end/activities/components/SocialRow.tsx` | 赞/星/评只读 |
| `src/features/c-end/activities/components/SignupForm.tsx` | 报名类型选择 + 确认 |
| `src/features/c-end/activities/h5/H5ActivityShell.tsx` | 430px 居中壳 + toast |
| `src/features/c-end/activities/h5/H5ActivityHome.tsx` | H5 首页 |
| `src/features/c-end/activities/h5/H5ActivityDetail.tsx` | H5 详情 + 底栏 CTA |
| `src/features/c-end/activities/h5/H5SignupSheet.tsx` | 底栏报名 Sheet |
| `src/features/c-end/activities/pc/PcActivityShell.tsx` | 宽屏顶栏壳 + toast |
| `src/features/c-end/activities/pc/PcActivityHome.tsx` | PC 首页 |
| `src/features/c-end/activities/pc/PcActivityDetail.tsx` | PC 详情 + 右栏报名 |
| `src/features/c-end/activities/pc/PcSignupModal.tsx` | 居中报名弹层 |
| `src/features/c-end/activities/styles.css` | C 端 token 与布局，仅 C 端树 import |

B 端 `activity.ts` / 表单 / 列表不改字段。社交数字不进 B 端模型。

## 数据

源：`useActivities()`。C 端列表 = `publishStatus === '已发布'`。

**报名中（featured）：** 已发布，且 `activityStatus !== '已结束'`，且当前时间落在 `[signupStartAt, signupEndAt]`（含端点）。时间按本地解析 `YYYY-MM-DD HH:mm`。

**Tab：** 全部 / 公司活动 / 体检活动 / 疗休养活动 / 项目活动。全部不过滤类型；其余按 `activity.type`。

**排序：** `pinned === true` 在前，同组按 `publishedAt` 新→旧；无发布时间的已发布项排该组末尾。

**摘要：** 从 `detailHtml` 去掉标签后取前 36 字，末尾加省略号（不足 36 字不加）。用于报名中大卡渐变文案。

**社交展示：** `clientActivity.ts` 内按 `id` 固定映射，缺省 `likes/stars/comments = 0`。不持久化、不可点。

当前种子在 2026-08-18 应至少两条报名中：`新员工入职训练营`(id 2)、`年度体检安排`(id 6)。未发布项员工不可见。

## H5 首页

页底 `#F5F5F5`。壳 `max-width: 430px` 居中，全高。主色 `#FF7F24`。进行中 pill `#3A8EE6`。已结束 `#9CA3AF`。未开始用主色橙。

1. 顶栏白底：左返回、中「活动」、右占位同宽，避免标题偏。
2. 报名中：橙标题 + 火图标；横滑大卡 `width: 82%`、封面约 `2/1`；左上「报名中」橙 pill；底黑渐变 + 摘要；文区标题 + 时间/地点。无报名中则整块不渲染。
3. 全部活动：喇叭 + 橙标题；Tab 选中橙底白字；列表卡左 96×72 封面、标题、置顶标、时间地点、底栏社交 + 状态 pill。
4. 空 Tab：居中「暂无活动」。
5. 点大卡或列表卡 → `#/c/h5/{id}`。

触控区 ≥ 44px（顶栏返回、Tab、列表卡整卡可点）。

## PC 首页

顶栏：左「康尼」+「活动广场」，右「手机版」。主区 `max-width: 1120px` 居中，页底同灰。

1. 报名中：最多 3 张并排英雄卡，信息同 H5 大卡；超过 3 条只取排序后前 3。
2. Tab + 卡片栅格：宽 3 列，≤900px 2 列。卡信息同 H5 列表，封面 16:9 置顶。
3. 点卡 → `#/c/pc/{id}`。

## 详情

两端都展示：封面、标题、类型、状态、时间、地点、发起人、联系电话、`detailHtml`。疗休养活动额外展示行程安排、额外费用规则。

H5：封面通栏 16:9；正文白底；底栏固定主按钮，内容 `padding-bottom` 避开底栏。  
PC：左正文（封面 + HTML），右信息卡（时间地点状态 + 报名按钮）。右卡 `position: sticky`。

不存在 / 未发布：标题「活动不存在」，按钮回同端首页。

## 报名

演示用户：`{ name: '陈产品', phone: '13800001111' }`。键：活动 id + 手机号。

主按钮文案与可点性：

| 条件（自上而下先命中） | 文案 | 可点 |
|---|---|---|
| `activityStatus === '已结束'` | 报名已结束 | 否 |
| 该手机号已报名该活动 | 已报名 | 否 |
| 当前 `< signupStartAt` | 报名未开始 | 否 |
| 当前 `> signupEndAt` | 报名已截止 | 否 |
| 其余 | 立即报名 | 是 |

点立即报名：H5 起 Sheet，PC 起居中弹层。内容同一 `SignupForm`：报名类型单选，选项 = 该活动 `signupSettings[].type`（去空）。无类型时禁用确认并提示「暂不可报名」。确认写入 `signupStore` 后关层，按钮变「已报名」，toast「报名成功」。

重复提交（含连续双击）：不插第二条，toast「已报名」。  
报名不校验可见范围、司龄、人数上限、审核。`needAudit` 忽略，演示记录状态固定「已通过」。  
后台看不到这些 C 端报名（本轮不接下报名列表）。

## 错误与空态

| 场景 | 表现 |
|---|---|
| 无已发布活动 | 无报名中块；全部活动「暂无活动」 |
| Tab 筛空 | 「暂无活动」 |
| 详情 id 非法或未发布 | 「活动不存在」 |
| 报名无类型 | 表单不可确认 |
| 重复报名 | toast，列表不变 |

无全屏 loading。数据来自内存 store，首屏直接渲。

## 视觉 token（C 端 CSS 变量）

```
--c-orange: #FF7F24;
--c-ongoing: #3A8EE6;
--c-ended: #9CA3AF;
--c-bg: #F5F5F5;
--c-card: #FFFFFF;
--c-text: #18181B;
--c-muted: #71717A;
--c-radius: 12px;
```

正文对比度 ≥ 4.5:1。图标按钮有 `aria-label`。列表用 `ul/li`；Tab 用 `aria-pressed`。

## 测试

项目无测试运行器，不新增 vitest。验收：

1. `npx tsc --noEmit` 通过
2. `python3 scripts/check_ui_conformance.py --root .` 仍通过（C 端不用 antd `layout="vertical"` / `Modal onOk`）
3. `#/c/h5` 可见报名中 + 类型 Tab + 已发布列表；未发布不可见
4. Tab「体检活动」只出年度体检；空类型出「暂无活动」
5. 点卡进详情，返回回首页；底栏可报，报完变已报名，再报 toast
6. `#/c/pc` 宽屏栅格 + 英雄卡；详情右栏报名；「手机版」进 H5
7. 后台把活动撤发布后，刷新 C 端该条消失

## 非目标

- Showcase / PhoneFrame / 双机模
- 真登录、RBAC、可见范围闸门
- 赞星评写回、评论
- 把 C 端报名写进 B 端报名信息页
- 独立 HTML 文件
- Tailwind / antd / B2B ListPage

## 验收

1. 两个独立页面：H5、PC，互不套后台壳
2. H5 首页结构可对照康尼1 左机模
3. PC 为同一员工端内容的宽屏版
4. 详情可报名；状态机按上表
5. 后台发布状态驱动 C 端可见性
