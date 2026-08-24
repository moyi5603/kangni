# 报名填写项单选/多选选项编辑优化设计

日期：2026-08-21
状态：已确认（用户授权直接执行）

## 改动

`SignupFieldsEditor` 中单选/多选选项区，对齐 antd Form 动态增减表单项范例：

- 去掉 `Space.Compact` + 方块删除按钮
- 每行：类型装饰（`Radio` / `Checkbox`，disabled 仅示意）+ `Input` + `MinusCircleOutlined` 删除
- 选项数 ≤ 2 时禁用删除，Tooltip「至少保留 2 个选项」
- 「添加选项」：`type="dashed"` + `PlusOutlined`，宽度与输入区对齐
- placeholder：`选项 N`

数据模型与 `validateSignupFields` 不变。字段主行、预设面板、C 端不改。
