# 考试准备页：CTA 与考试说明

**日期：** 2026-08-22  
**范围：** C 端 PC / H5 考试准备页。列表、答题、结果、回顾、B 端表单不改。

## 决策

| 项 | 选择 |
|---|---|
| 做法 | 最小改：现有双栏 / H5 卡片结构不动 |
| 说明字段 | B 端已有 `ExamRecord.descriptionHtml` |
| 说明位置 | 考试次数后、考试规则前 |
| 空说明 | 剥标签与 `&nbsp;` 后无正文则整节不渲染 |
| PC CTA | 右侧加大、考试色；`remainingTimes === 0` 禁用 |

## 数据

`ClientExamPrep` 增加 `descriptionHtml?: string`，由 `getClientExamPrep` 透传。

共享判断（`clientExam.ts`）：

- `hasExamDescriptionHtml(html)`：与 B 端详情相同规则（去标签、去 `&nbsp;`、trim）
- `canStartClientExam(remainingTimes)`：`remainingTimes > 0`

`remainingTimes` 仍按现有规则计算（当前等于总次数）。禁用逻辑按该字段接线，不在本次改次数算法。

## PC `PcExamPrep`

- 左栏次数块后：有说明则出「考试说明」+ `c-html` 渲染 `descriptionHtml`
- 右栏：摘要保留；主按钮 `c-cta is-exam-start`
  - 可开考：`<a href=答题>`，文案「开始考试」
  - 不可开考：`<button disabled>`，文案「次数已用完」，无答题链接
- 样式：更高（min-height 52px）、字号 18px、背景 `#2f54eb`（对齐 H5 开考胶囊），覆盖壳层青绿 CTA

## H5 `H5ExamPrep`

- 次数卡后、规则前：同样条件渲染「考试说明」卡，正文用 `c-html`
- 底栏：可开考保持胶囊链；不可开考改为 disabled 按钮「次数已用完」，无 `href`

## 异常

- 考试不存在 / 未发布：现有 missing 页，不加说明块
- 说明仅空标签：当无说明

## 测试

- `getClientExamPrep(7)` 带上 id 7 的说明 HTML
- `hasExamDescriptionHtml`：有正文 / 空 / 仅 `<p></p>`
- `canStartClientExam(0)` false，`(1)` true
- PC / H5 准备页：说明在「考试次数」之后、「考试规则」之前；含说明正文
- upsert 清空说明后：两页都不出「考试说明」
- upsert `examTimes: 0` 后：两页「次数已用完」且无 take 链接

## 不做

改次数计算、真切屏、B 端编辑器、答题/结果/回顾、PC 改 H5 2×2 指标卡。
