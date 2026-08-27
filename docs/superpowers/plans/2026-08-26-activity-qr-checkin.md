# 活动扫码签到 Implementation Plan

> **For agentic workers:** Implement in place. TDD for `activityCheckIn` 规则。不自动 commit。

**Goal:** 后台配置扫码签到，详情出每场二维码，H5 落地页校验并写入报名签到。

**Architecture:** 规则纯函数 `evaluateCheckIn`；token 挂场次；H5 路由 query `s`/`t`；报名 `checkIns` 按场次记时间。

**Tech Stack:** React、TypeScript、Ant Design 6、Vitest、现有 hash 路由。

---

### Task 1: 规则与 token

- Create: `src/features/activities/model/activityCheckIn.ts`
- Test: `src/features/activities/model/activityCheckIn.test.ts`

### Task 2: Activity / Session / Signup 字段与 mock

- Modify: `activity.ts`、`activitySchedule.ts`、`related.ts`、表单保存时补 token

### Task 3: 后台表单、详情签到码、报名列

- Modify: `ActivityFormPage.tsx`、`ActivityDetailPage.tsx`、`ActivityQrCheckInPage.tsx`（新建）、`ActivityRelatedListPage.tsx`

### Task 4: H5 路由与签到页

- Modify: `navigation.ts`、`CEndApp.tsx`
- Create: `H5CheckInPage.tsx`、`checkInApply.ts`

### Task 5: 验证

- vitest：checkIn、navigation、Signup 列不必全仓 tsc
