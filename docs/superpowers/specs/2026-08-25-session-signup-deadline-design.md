# 多场次报名截止（相对开场）

日期：2026-08-25

## 目标

周期/系列：报名**开始**仍活动级一份；每场报名**结束** = 该场 `startAt` 减去 N 小时。单次活动仍用报名起止 RangePicker，行为不变。

## 不做什么

- 每场手填报名起止（方案 C）
- 兴趣小组模块改动
- 分场人数上限、分场取消
- 周期/系列再提供「统一截止」与相对截止二选一（YAGNI；管理员「截止报名」可提前关）

## 数据

- `signupStartAt`：活动级，三种举办方式都有
- `signupHoursBefore`：`number`，默认 `0`（开场即停）。仅 `recurring` / `series` 使用
- `signupEndAt`：单次 = 用户填的结束；多场 = `max(各场 startAt − N小时)`，保存时回写。列表/「截止报名」继续读这个字段
- 场次仍只存 `id, startAt, endAt`，不存每场报名窗口

## 规则

- 场次报名截止：`sessionSignupEnd(session, N) = session.startAt − N hours`
- 某场可报：已发布、活动未结束、`now >= signupStartAt`、`now <= signupEndAt`、`now <= sessionSignupEnd`
- 活动可报（CTA / 列表「报名中」）：至少一场可报
- 勾选已截止场次不可提交
- 管理员截止报名：把 `signupEndAt` 设为现在（与现网一致），所有场次立即不可报
- `N >= 0` 整数；N 过大导致截止早于报名开始时，该场视为从未开放

## 表单

- 单次：报名时间 RangePicker（现状）
- 周期/系列：报名开始 DatePicker（到分钟）+「每场截止」InputNumber，单位「开场前 N 小时」，extra：`0 表示开场即停止报名`
- 不出现每场报名 RangePicker

## 展示

- 单次：`signupStart ~ signupEnd`
- 周期/系列：`{signupStartAt} 起，每场开始前 {N} 小时截止`（N=0 写「每场开场时截止」）
- B 端场次表增加列「报名截止」= 该场 `sessionSignupEnd`
- C 端报名：已截止场次 checkbox disabled，文案带「已截止」

## C 端 CTA

- 未开始：仍看 `signupStartAt`
- 已截止：没有任何场次可报
- 立即报名：至少一场可报
- 取消报名：仍在活动可报窗口内（与现逻辑一致，窗口改为「至少一场可报」）
