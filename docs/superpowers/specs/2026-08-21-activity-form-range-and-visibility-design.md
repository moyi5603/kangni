# 活动新建/编辑：时间范围与自定义人群「且」条件

**状态：** 待实现  
**日期：** 2026-08-21  
**范围：** 管理后台「活动管理」新建活动、编辑活动同一页 `ActivityFormPage`。活动时间与报名时间改为同行日期时间范围；自定义人群下「选择人员」与「可见司龄」用分组文案体现且关系。详情页、列表页、C 端、领域模型字段不改。

## 背景

当前表单把活动开始/结束、报名开始/结束拆成四个独立 `DatePicker`，各占一行。B 端规范要求日期起止使用 `DatePicker.RangePicker`；考试新建页已按该方式落地。

自定义人群下「选择人员」与「可见司龄」已是交集：人必须在名单内，且司龄 ≥ 设定年数。两字段上下平铺，看不出且关系。

规范依据：`build-ant-design-b2b-app` 横向表单（标签固定宽、控件撑满）、日期起止用 `RangePicker`；业务必填、禁选、跨度必须显式配置。对照实现：`ExamFormPage` 的 `range` 字段。

## 决策摘要

| 项 | 选择 |
|---|---|
| 活动时间 | 一个 `RangePicker showTime`，标签「活动时间」 |
| 报名时间 | 一个 `RangePicker showTime`，标签「报名时间」 |
| 相等时间 | 允许开始 = 结束（保持现有规则，不跟考试 `isAfter` 对齐） |
| 存盘字段 | 仍拆 `startAt` / `endAt`、`signupStartAt` / `signupEndAt` |
| 详情/列表 | 不改 |
| 自定义人群且关系 | 小卡片分组，标题「须同时满足」+ 司龄 `extra` |
| 且关系数据 | 不新增字段；仍 `customPeople` ∩ `visibilityMinSeniorityYears` |
| 其他可见范围 | 全员 / 按部门 / 导入人群布局不动 |

## 页面结构 — 时间字段

新建与编辑共用 `ActivityFormPage`。

活动信息卡，原「活动开始时间」「活动结束时间」合并为一行：

```text
活动时间 *  [ 开始时间  —  结束时间 ]
```

报名设置卡，原「报名开始时间」「报名结束时间」合并为一行：

```text
报名时间 *  [ 开始时间  —  结束时间 ]
```

- 组件：Ant Design `DatePicker.RangePicker`，`showTime`，`style={{ width: '100%' }}`
- 占位：`['开始时间', '结束时间']`
- 表单字段：`activityRange`、`signupRange`，类型 `[Dayjs, Dayjs]`
- 编辑回填：`[dayjs(startAt), dayjs(endAt)]`、`[dayjs(signupStartAt), dayjs(signupEndAt)]`
- 保存格式：`YYYY-MM-DD HH:mm`（与现网一致，不改成秒）

## 页面结构 — 自定义人群

选「自定义人群」后，在可见范围单选项下方增加 `Card size="small"`：

```text
须同时满足
  选择人员 *  [组织树多选]
  可见司龄 *  [N] 年
  extra：仅名单内且司龄达标的人可见
```

- 「选择人员」「可见司龄」仍各自必填，校验文案不变
- 司龄：`InputNumber` min 0、整数，`Space.Compact` + 禁用「年」按钮，placeholder「大于等于」
- 人与司龄任一为空：只报对应字段错，不另报「且」错
- 切走自定义人群：保存时仍清空人员、司龄（现有逻辑）

## 校验

| 字段 | 规则 | 文案 |
|---|---|---|
| `activityRange` | 必填，两端都有值 | 请选择活动时间 |
| `activityRange` | 结束不得早于开始；相等通过 | 结束时间不得早于开始时间 |
| `signupRange` | 必填，两端都有值 | 请选择报名时间 |
| `signupRange` | 结束不得早于开始；相等通过 | 报名结束时间不得早于开始时间 |
| `customPeople` | 自定义人群时必填 | 请选择人员 |
| `visibilityMinSeniorityYears` | 自定义人群时必填 | 请输入可见司龄 |

缺一端视为未填完整范围，走必填，不拆成两个独立时间错误。

## 数据流

```text
编辑回填：Activity.startAt/endAt → activityRange
         Activity.signupStartAt/endAt → signupRange
保存：activityRange[0/1].format('YYYY-MM-DD HH:mm') → startAt/endAt
     signupRange[0/1].format(...) → signupStartAt/signupEndAt
可见范围：无新字段
```

`Activity` 类型、store、详情 `Descriptions`、C 端过滤逻辑本轮不改。

## 错误与离开

- 提交失败滚到第一个错误字段（现有 `scrollToFirstError`）
- 未保存离开提醒不变
- 无新危险操作

## 测试与验收

现无 `ActivityFormPage` 单测。本轮不强制补页面测试。改完必须：

1. 跑活动相关已有单测
2. `python3 scripts/check_ui_conformance.py --root <项目目录>`
3. 手测：新建、编辑回填、两端必填、结束早于开始、自定义人群分组文案、切可见范围后保存清空人员/司龄

可观察验收：

- 活动时间、报名时间各占一行，能选到时分
- 自定义人群出现「须同时满足」卡片和司龄说明
- 保存后列表/详情仍看到原来的开始、结束字符串

## 非目标

- 详情页合并时间展示
- 报名设置里的司龄要求（疗休养）改成且分组
- 可见司龄改为选填
- 按部门 / 导入人群叠加司龄
- 改 C 端可见性计算
