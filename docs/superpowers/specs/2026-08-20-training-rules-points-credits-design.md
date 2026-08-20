# 课程规则设置（积分 / 学分）

**状态：** 已实现  
**日期：** 2026-08-20  
**范围：** 课程应用新增「规则设置」页，配置全局积分与学分发放规则；从课程新增/编辑/详情去掉课程级积分激励字段。本轮只保存配置，不做真实发分/发学分计算引擎。

## 背景

课程新增编辑页与详情当前承载「积分激励」开关与固定积分值。发分策略应变为组织级全局规则，且需同时支持积分与学分两套独立配置，发放方式为「每课程固定分」或「每 x 分钟 x 分」二选一，并限制每节课与每日上限。

活动、考试应用已有「规则设置」菜单可对齐；课程侧栏目前仅有：课程管理、课件管理、学习记录。

规范依据：`build-ant-design-b2b-app` 设置页分组、高级表单底栏固定、标签同行 112px、主操作在左、字段按用户任务分组。

## 决策摘要

| 项 | 选择 |
|---|---|
| 积分 vs 学分 | 两套独立规则（各自开关与字段） |
| 发放方式 | `fixed`（每课程固定分）与 `duration`（每 x 分钟 x 分）二选一 |
| 作用范围 | 全局一份，不按课程类型拆分 |
| 页面模式 | 设置页 + 高级表单（独立页、底栏固定） |
| 分组 | 两张 Card：积分规则 / 学分规则（不做 Tabs） |
| 上限 | 启用后两种 mode 均配置「每节课上限」「每日上限」 |
| 课程级字段 | 删除 `pointsEnabled` / `points` 的表单录入与详情展示 |
| 数据 | `features/training` 本地 store，与课件/课程 mock 同一模式 |
| 生效范围 | 本轮不驱动学习记录发分、C 端展示计算 |

## 路由与入口

新增侧栏菜单：`training-rules`，文案「规则设置」，图标与活动一致（`fileText`）。  
位置：学习记录之后。

Hash：`#/training/training-rules`。

`App.tsx` 挂载 `TrainingRulesPage`（或等价命名）。  
面包屑：`课程 > 规则设置`。  
标题：规则设置。  
副标题：配置课程学习完成后的积分与学分发放规则，全局生效。

导航与测试：`applicationMenus.training`、`navigation.test.ts` 同步更新。

## 页面结构

```
面包屑
标题 + 副标题（同一行）
Card「积分规则」
Card「学分规则」
底栏：保存 | 取消
```

- 底栏主操作「保存」在左，次操作「取消」在右（取消 = 丢弃草稿并回到上次快照，或离开确认；与活动规则「重置」二选一时本页用「取消」对齐课程表单用语）。
- 推荐行为：「取消」恢复到上次成功保存的快照并留在本页；离开本页且有未保存改动时二次确认。
- 窄屏：表单纵向标签；底栏仍固定可达。

### 单套规则卡片字段顺序

1. 是否发放（Switch，默认关）
2. 启用后展示：
   - 发放方式（Radio：每课程固定分 / 每 x 分钟 x 分）
   - `fixed`：每课程固定分（InputNumber ≥ 1）
   - `duration`：每（分钟）+ 发放（分）两个 InputNumber，均 ≥ 1
   - 每节课上限（InputNumber ≥ 1）
   - 每日上限（InputNumber ≥ 1；须 ≥ 每节课上限）

未启用时，该套其余字段隐藏且不参与校验；保存时将隐藏字段规范为默认空值/占位，避免脏数据。

## 文件边界

| 文件 | 职责 |
|---|---|
| `src/features/training/model/rewardRules.ts` | 类型、默认值、校验纯函数 |
| `src/features/training/model/rewardRulesStore.ts` | 本地持久化 + 订阅刷新 |
| `src/features/training/pages/TrainingRulesPage.tsx` | 设置页 UI |
| `src/features/training/pages/CourseFormPage.tsx` | 去掉积分激励相关表单项与保存字段 |
| `src/features/training/pages/CourseListPage.tsx` | 详情去掉积分激励展示 |
| `src/features/training/model/training.ts` | `CourseRecord` 去掉 `pointsEnabled`/`points`，mock 同步升版本 |
| `src/app/navigation.ts` / `navigation.test.ts` | 菜单 |
| `src/app/App.tsx` | 路由挂载 |

不提升到 `shared`；不复用活动 `rulesStore`（领域不同）。

## 数据模型

```text
RewardKindRule
  enabled: boolean                    // 默认 false
  mode: 'fixed' | 'duration' | null   // enabled=false 时可为 null
  fixedPoints: number | null          // mode=fixed
  intervalMinutes: number | null      // mode=duration，每 x 分钟
  pointsPerInterval: number | null    // mode=duration，每区间 x 分
  lessonCap: number | null            // 每节课上限
  dailyCap: number | null             // 每日上限

TrainingRewardRules
  points: RewardKindRule              // 积分
  credits: RewardKindRule             // 学分
```

默认值：两套均为 `enabled: false`，其余字段 `null`。

### 校验（启用时）

- `mode` 必选。
- `fixed`：`fixedPoints` 正整数；`duration` 字段忽略。
- `duration`：`intervalMinutes`、`pointsPerInterval` 正整数；`fixedPoints` 忽略。
- `lessonCap`、`dailyCap` 正整数；`dailyCap >= lessonCap`。
- 保存前 `prepareForSave`：未启用套清除 mode/数值为 null；已启用套按 mode 清掉另一模式字段。

## 课程实体变更

从 `CourseRecord` 删除：

- `pointsEnabled`
- `points`

同步：

- `CourseFormPage` 表单值、默认值、保存 payload、「学习设置」中积分相关项
- `CourseListPage` 详情 Descriptions 中「积分激励」项
- mock 数据与 `TRAINING_MOCK_VERSION` 递增，避免旧 localStorage 脏字段干扰（可容忍残留字段但不读不写）

「学习设置」Card 仅保留「学习过程」；若只剩一项，仍保留 Card 分区以保持与高级表单分组一致。

## 验收

1. 侧栏可见「规则设置」，进入 `#/training/training-rules`。
2. 默认可保存：两套均关闭。
3. 仅开积分 + 固定分 + 两上限，保存成功，刷新后仍在。
4. 切到按时长，固定分隐藏；分钟与每区间分必填。
5. 每日上限 < 每节课上限时校验失败。
6. 学分独立开关与字段，互不影响。
7. 课程新增/编辑无积分激励；详情无积分激励展示。
8. 未保存离开有确认；取消恢复快照。

## 非目标

- 学习记录发分流水、C 端积分/学分展示与扣减
- 按课程类型、按分类差异化规则
- 积分与学分互相换算
- 与考试/活动规则配置合并

## 开放问题

无。已确认：独立两套、发放方式二选一、全局一份、每节课/每日上限两种 mode 均配置。
