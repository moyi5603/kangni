# 技能大赛：闯关设置 + 闯关记录

**日期：** 2026-09-11  
**规范：** `build-ant-design-b2b-app`（详情 Tab、列表查询 + 表格、主操作在左）  
**范围：** 赛事详情把「闯关」改成「闯关设置」，新增「闯关记录」宽表。不做预设闯关地图、不做 C 端闯关页、不导出、不改记录。

## 背景

运营要看每人哪天每关闯了几次、过没过。设置仍按阶段配题。曾考虑预设地图，已取消。每日关卡上限改为 8。

## 决策

| 项 | 选择 |
|---|---|
| 入口 | 仍在赛事详情，不新增侧栏菜单 |
| Tab | 基本信息 / 报名管理 / 闯关设置 / 闯关记录 |
| 地图 | 不做 |
| 记录粒度 | 一行 = 人 + 日期；关卡做列 |
| 记录来源 | 内存种子聚合行，不模拟每次答题流水 |
| 每日关卡 | `dailyGateCount` 范围 1–8 |
| 自然日 | 东八区，`YYYY-MM-DD` |
| 权限 | 本轮不加 |

## 信息架构

| Tab key | 文案 | Hash |
|---|---|---|
| `detail` | 基本信息 | `#/skills-contest/contest-detail/:id/detail` |
| `signups` | 报名管理 | `.../signups` |
| `challenges` | 闯关设置 | `.../challenges` |
| `challenge-logs` | 闯关记录 | `.../challenge-logs` |

未知 tab 回落 `detail`。侧栏仍高亮「赛事管理」。

闯关设置按钮文案改为「保存闯关设置」。

## 闯关设置

沿用现有阶段卡片：出题方式、习题分类、指定题目、每日关卡数量、每关题数、答对题数过关。

变更：

- Tab 文案「闯关」→「闯关设置」
- `dailyGateCount` 输入 `min=1` `max=8`；校验超 8 不可保存
- 不增加地图字段

## 闯关记录

### 查询

姓名、日期（单日 DatePicker，可清空=全部）、阶段（全部 + 本赛事阶段）。查询/重置走 `SearchPanel`。

### 表格

固定列：姓名（报名「姓名」）、日期、阶段名称。

动态列：关 1 … 关 N。N = 当前筛中阶段的 `dailyGateCount`；阶段=全部时 N = 本赛事各阶段 `dailyGateCount` 的最大值（≤8）。某行所属阶段关数不足 N 时，多出的关列显示 `—`。

单元格：

- `attempts === 0`：`—`
- 否则：`闯 {attempts} 次 / 通过` 或 `闯 {attempts} 次 / 未通过`

`passed`：该日该关至少通过一次则为通过。通过后再闯，次数累加，状态仍通过。

分页走表格规范。无行操作、无批量。

## 领域模型

```ts
type ChallengeGateCell = {
  attempts: number; // ≥0
  passed: boolean;
};

type ChallengeDayLog = {
  id: number;
  contestId: number;
  stageId: string;
  signupId: number;
  date: string; // YYYY-MM-DD
  gates: ChallengeGateCell[]; // length = 该阶段配置的 dailyGateCount
};
```

姓名从报名 `answers['姓名']` 取。`signupId` 必须属于该 `contestId`。`stageId` 必须是该赛事阶段。`gates.length` 与保存记录时的阶段关数一致；之后改小关数，多出的格子不展示；改大关数，缺的格子当 `—`。

### 种子（赛事 1 公开赛）

初赛 `s1`（3 关）：

- 王磊 2026-09-03：关1 闯 1 次通过；关2 闯 2 次未通过；关3 未闯
- 王磊 2026-09-04：关1–3 各闯 1 次且通过
- 陈芳 2026-09-03：关1 闯 3 次通过；其余 —

复赛、赛事 2 可不造记录，空表走空状态。

公开赛种子：初赛 `dailyGateCount = 3`，复赛 `dailyGateCount = 2`。新建阶段仍用 `defaultChallengeFields().dailyGateCount = 1`，仅上限 8。

## 验收

- 详情 Tab 可见「闯关设置」「闯关记录」，无「闯关」二字单独作 Tab
- 闯关设置每日关卡无法输入 >8；保存校验拒绝 >8
- 闯关记录默认列出种子行；筛姓名「王磊」只剩其两天
- 筛阶段「初赛」关列数为 3；单元格文案符合上表
- Hash `.../challenge-logs` 打开记录 Tab
- 无地图选择控件

## 非范围

预设闯关地图、C 端闯关、改记录、导出、成绩页联动、权限。
