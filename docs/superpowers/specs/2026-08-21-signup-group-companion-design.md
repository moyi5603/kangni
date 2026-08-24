# 报名填写项：分组选择 / 同行人 / 数字字段设计

日期：2026-08-21
状态：执行中

## 模型

`SignupFieldInputType` 增加 `group` | `companion`。

| 字段 | 用途 |
|---|---|
| `digitOnly?: boolean` | 手机号、身份证号、年龄仅数字 |
| `groups?: { name: string; limit: number }[]` | 分组选择选项 |
| `totalLimit?: number` | 分组总人数，须等于各组 limit 之和 |
| `companionMax?: number` | 同行人最多人数 |
| `companionFields?: ('姓名'\|'手机号'\|'身份证号')[]` | 同行人需填写项 |

## 预设

- 手机号 / 身份证号 / 年龄：`digitOnly: true`
- 分组选择：默认总人数 10，两组各 5
- 同行人：默认最多 1，勾选姓名+手机号

## 管理端编辑

- 分组：总人数 + 分组名/上限列表（≥2），实时显示合计是否等于总人数
- 同行人：最多人数 + 勾选收集项
- 自定义仍仅 text/radio/checkbox

## C 端

- digitOnly 输入过滤非数字
- group 渲染为单选
- companion 选人数后按勾选项展开多组输入；答案存 JSON 字符串

## 校验

- 分组：组名非空、≥2 组、limit≥0、总和=totalLimit
- 同行人：companionMax 1～20、至少勾选一项
- 答案：分组须在选项内；同行人人数≤max，勾选字段必填
