# 活动 PC / H5 / 管理后台数据联动

**日期：** 2026-08-19  
**状态：** 已确认，待实现  
**范围：** 活动主数据三端共用（已有）补回归；报名名单以后台 `related.signups` 为唯一源，C 端 `signupStore` 改为适配器。  
**关联：** `docs/superpowers/specs/2026-08-19-my-signups-audit-tabs-and-search-design.md`

## 背景与目标

活动主数据已在 `activityStore` 打通，H5 / PC / 后台读同一份。报名却是两套：C 端 `signupStore` 与后台 `related.signups` 种子不一致，C 端报名写不进后台，后台审核改不了「我的报名」。

目标：后台改活动，员工端目录/详情跟着变；员工报名与后台名单、审核状态同一份。

## 活动主数据

继续共用 `src/features/activities/model/activityStore.ts`。不新建第二份活动列表。

| 表面 | 规则 |
|---|---|
| 后台 | 现有 `upsertActivity` / 发布 / 下架 |
| H5 / PC 发现活动、详情、首页预览 | 只展示 `publishStatus === '已发布'` |
| 已报名后被下架 | 「我的报名」失效卡（现有逻辑，无封面） |

H5 与 PC 不各存活动。不改 B 端活动表单字段。

补测：`upsertActivity` 改已发布标题后，C 端 `getPublishedActivity` / 详情 SSR 含新标题；改为 `未发布` 后发现活动列表不再含该 id。

## 报名唯一源

`related.signups`（`src/features/activities/model/related.ts`）为唯一名单。后台报名页、导入、批量通过/驳回、删除继续 `patchRelated('signups', …)`。

`signupStore` 不再持有独立数组。改为：

- `subscribe` 挂到 related 的 listeners（related 需导出订阅，或 signupStore 与 related 共用 emit）。
- snapshot 读 `getRelatedList('signups')`。
- 按 `DEMO_SIGNUP_USER.phone`（`13800001111`）过滤。
- **丢弃 `status === '已取消'`**：不进「我的报名」，`hasSignedUp` 为 false，可再报名。
- 已驳回仍展示，且 `hasSignedUp` 为 true，不可再报同一活动。

### 映射

| SignupRecord | ClientSignup |
|---|---|
| `activityId` | `activityId` |
| `name` | `name` |
| `phone` | `phone` |
| `signupType` | `type` |
| `status`（待审核 / 已通过 / 已驳回） | `status` |
| `createdAt` | `createdAt`（后台格式 `YYYY-MM-DD HH:mm:ss`） |

C 端写出时补 `department: '职能中心'`（对齐现有陈产品记录）。`id` 用 `Date.now()` 或 `max(id)+1`，与后台新增一致即可。

`ClientSignupStatus` 仍是 `'待审核' | '已通过' | '已驳回'`，不含已取消。

### 提交报名与 needAudit

`submitSignup(activityId, type)`：

1. 类型 trim 空 → `'no-type'`。
2. 该手机号在该活动已有非取消记录 → `'duplicate'`。
3. `getActivity(activityId)` 找到活动，且 `signupSettings` 有该类型：`needAudit === true` → 状态 `待审核`，否则 `已通过`。
4. 活动不存在或类型不在设置里：仍写入，状态 `已通过`（兼容现有假 id 单测）。
5. `patchRelated('signups', …)` 追加一条，`createdAt` 为本地 `YYYY-MM-DD HH:mm:ss`。

H5 / PC 详情继续调同一 `submitSignup`，自然进后台名单。

### 测试辅助

- `resetClientSignups()`：只从 `related.signups` 删除陈产品手机号记录，**保留**张悦等人。
- `loadDemoSignups()`：先去掉陈产品记录，再写入下面四条。

现有 `resetClientSignups` 把 C 端名单清空的单测语义变为「陈产品没有报名」，不是「全公司没有报名」。

## Demo 种子（陈产品以 C 端为准）

从 `related.signups` 去掉 `phone === '13800001111'` 的旧行（开放日已通过 id 14、训练营团体 id 4），写入：

| id | activityId | 活动 | signupType | status | createdAt | department |
|---|---|---|---|---|---|---|
| 4 | 2 | 新员工入职训练营 | 个人报名 | 已通过 | 2026-08-18 16:00:00 | 职能中心 |
| 15 | 6 | 年度体检安排 | 个人报名 | 待审核 | 2026-08-17 16:00:00 | 职能中心 |
| 16 | 9 | 中秋员工晚会 | 个人报名 | 已通过 | 2026-08-16 16:00:00 | 职能中心 |
| 14 | 1 | 春季员工开放日 | 个人报名 | 已驳回 | 2026-04-12 10:00:00 | 职能中心 |

其他人报名不动。五 tab / 搜索 / 首页预览 demo 期望不变。

`DEMO_CLIENT_SIGNUPS` 可保留为这四条的 ClientSignup 形态，供 `loadDemoSignups` 映射进 related。

## 精彩瞬间

`hasApprovedSignup` / `useApprovedSignup` 现在把 C 端 `hasSignedUp`（任意状态）也当成已通过。改为 **只认统一名单里 `status === '已通过'`**。待审核不能发瞬间。去掉对两套名单的 OR。

## 测试

- 活动：改已发布标题 → C 端详情含新标题；下架 → 目录无该活动。
- 报名写入 related；后台改陈产品状态 → `getUserSignups` 同步；已取消 → C 端不可见且可再报。
- `needAudit: true` 的类型 → 新报名待审核。
- `resetClientSignups` 后张悦报名仍在 `getRelatedList('signups')`。
- 现有 H5/PC 我的报名五 tab、搜索、首页预览、signupStore 防变异测仍绿（ISO 时间断言改为后台格式）。
- 瞬间：仅已通过可 `hasApprovedSignup`。

## 不做

- 不新增已取消 tab。
- 不上真实后端、不写 localStorage。
- 不改后台报名表格交互（列、导入、批量审核照旧，只是数据同源）。
- 不另建评论/勋章数据源（它们已读 related；报名同源后发奖「全部报名人员」自然含 C 端新报名的已通过）。
- 不改发现活动、详情布局、后台活动字段。
