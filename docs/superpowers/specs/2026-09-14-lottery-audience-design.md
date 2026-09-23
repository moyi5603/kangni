# 抽奖参与范围（公开 / 组织内 + 姓名手机号导入）

**日期：** 2026-09-14  
**规范：** `build-ant-design-b2b-app`（高级表单独立页、查询列表四层、弹窗主操作在左）  
**范围：** 抽奖管理端新建/编辑/详情/列表的「参与范围」。导入模板与解析（姓名、手机号）。不做 C 端资格拦截、不改次数获取途径、不改奖品。

## 背景

抽奖表单现为可选开关「开启可见范围」+ 全员 / 按部门 / 导入（工号列）。运营需要必选「公开 / 组织内成员」：公开必须导外部名单；组织内仍可全员、按部门或导入。两套导入共用姓名+手机号模板，不再用工号。

## 决策

| 项 | 选择 |
|---|---|
| 开关 | 删除 `visibilityEnabled`。范围必选 |
| 第一层 | `org` 组织内成员（默认） / `public` 公开 |
| 组织内第二层 | `all` 全员 / `department` 按部门 / `import` 导入 |
| 公开 | 只能导入，无全员/按部门 |
| 模板 | CSV：`姓名,手机号`。公开与组织内导入同一套 |
| 存储 | 文件名 + 解析后的人数组，不落原始文件二进制 |
| C 端 | 本轮不按名单拦截 |
| 旧数据 | 见迁移表；旧工号名单无法映射，人数记 0，编辑须重传 |

## 表单

Card 标题仍为「参与范围」。

1. **参与范围** Radio 必选：`组织内成员` / `公开`。默认组织内成员。
2. **组织范围** 仅 `org`：Radio `全员` / `按部门` / `导入`。默认全员。
3. **选择部门** 仅 `org` + `department`：现有 `orgDepartmentTree` TreeSelect，必选至少一个。
4. **导入名单** 在 `public` 或 `org`+`import` 时出现，必填。
   - 链接「下载导入模板」→ `抽奖参与名单模板.csv`（BOM + `姓名,手机号` + 两行示例：`张三,13800001111` / `李四,13900002222`）
   - Upload.Dragger，`accept=".csv,.xlsx,.xls"`，`maxCount={1}`，`beforeUpload={() => false}`
   - extra：`请按模板填写姓名、手机号。支持 csv / xlsx。`

校验失败就地拦保存：公开或组织内导入未上传 / 有效人数为 0；按部门未选部门。

## 导入解析

纯函数 `parseLotteryAudienceFile(fileName, textOrRows) → { people, skipped }`。

| 规则 | 行为 |
|---|---|
| 表头 | 必须同时含「姓名」「手机号」（允许前后空白）。列顺序不限。缺列：整文件失败，文案「模板须包含姓名、手机号列」 |
| 空行 | 跳过，不计入 skipped |
| 缺姓名或手机号 | skipped +1 |
| 手机号 | trim，去掉中间空格。不校验位数（原型） |
| 重复手机号 | 后行覆盖前行，不增加 skipped |
| 有效人数 | `people.length ≥ 1` 才能保存 |
| xlsx | 原型可读则解析；不能解析则提示「请另存为 CSV 后再上传」 |

上传成功 Message：`已导入 N 人`；`skipped > 0` 时：`已导入 N 人，跳过 M 行`。

换文件覆盖 `audiencePeople`。移除文件：文件名与人数组清空。

## 领域模型

替换抽奖上的可见范围字段：

| 新字段 | 类型 | 说明 |
|---|---|---|
| audienceKind | `org` \| `public` | 必填 |
| orgScope | `all` \| `department` \| `import` | 仅 org 有意义；public 固定不用，存 `import` |
| audienceDepartments | string[] | 仅 org+department |
| audienceFileName | string | 需导入时必填 |
| audiencePeople | `{ name: string; phone: string }[] | 需导入时 length ≥ 1 |

删除：`visibilityEnabled`、`visibilityScope`、`visibilityDepartments`、`visibilityFileName`。测试夹具、次数相关用例一并改字段。

`lotteryAudienceText(record)`：

- org + all → `组织内 · 全员`
- org + department → `组织内 · 按部门（部门名）`；部门空则 `组织内 · 按部门（未选择）`
- org + import → `组织内 · 导入（{fileName}，{n} 人）`；无文件 `组织内 · 导入（未上传）`
- public → `公开 · 导入（{fileName}，{n} 人）`；无文件 `公开 · 导入（未上传）`

列表「参与范围」列、详情 Descriptions 用该文案。列表查询若现有「开启可见范围」筛，改为按 `audienceKind`：全部 / 组织内成员 / 公开。

## 种子迁移

| 旧 | 新 |
|---|---|
| `visibilityEnabled === false` | `org` + `all`，部门空，名单空 |
| 开 + 全员 | `org` + `all` |
| 开 + 按部门 | `org` + `department`，部门数组保留 |
| 开 + 导入 | `org` + `import`，`audienceFileName` 保留，`audiencePeople = []`（工号无法映射） |

编辑打开旧导入活动：导入控件显示原文件名，但有效人数 0，保存前必须重新上传解析成功。

## 数据流

仍写 `lotteryStore` 内存对象。解析在选择文件时做（FileReader + 可选 xlsx），结果进表单状态，随保存写入 record。无 API。

## 异常

| 场景 | 行为 |
|---|---|
| 公开未上传 | 保存失败「请导入参与名单」 |
| 解析 0 有效人 | 保存失败「名单中没有有效的姓名和手机号」 |
| 缺表头 | 上传即失败，不写入文件名 |
| 组织内全员/按部门 | 清空名单字段，避免脏数据 |
| 从公开切回组织内全员 | 清空文件与 people |
| 窄屏 | 沿用现表单壳 |

## 测试

- `lotteryAudienceText` 四种文案
- `parseLotteryAudienceCsv`：缺列失败；重复手机号覆盖；空行忽略；缺字段 skipped
- 表单：公开必须出现导入；组织内全员不出现导入；组织内导入出现模板链接
- 列表不再出现「开启可见范围」；出现「组织内 · 全员」一类文案
- 种子第三条（原未开范围）映射为组织内全员

## 非目标

- C 端按名单/部门拦截抽奖
- 真实对象存储文件
- 手机号运营商段校验、短信验证
- 名单独立复用库
