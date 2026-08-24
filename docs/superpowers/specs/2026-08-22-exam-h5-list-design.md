# 考试 H5 列表

**日期：** 2026-08-22  
**范围：** C 端 H5「考试列表」一页。不做 PC、详情、答题、成绩页。

## 决策

| 项 | 选择 |
|---|---|
| 路由 | `#/c/h5/exams` → `h5Page: 'exams'` |
| 入口 | C 端门户加「考试 H5」 |
| 壳 | `H5ActivityShell`，标题「考试列表」，返回门户 |
| 数据 | B 端 `examStore` 已发布考试 |
| 分类 | 树全部节点横向胶囊；选中后含子树 |
| 搜索 | 点「搜索」才按名称过滤 |
| 已结束 | 「不看已结束」默认开 |
| 成绩 | 1 场 mock「已通过」；「看成绩」toast，不跳页 |
| 卡片点击 | 不进详情 |

## 页面

- 搜索：placeholder「全部」+「搜索」
- 胶囊：全部 + 分类名
- Switch：「不看已结束」
- 卡片：标题、总分值、总时长、分割线、开考/结束时间（`MM-DD HH:mm:ss`）
- 已通过：右上角标 + 右下「看成绩」
- 空：`暂无考试`

## 文件

- `c-end/exams/model/clientExam.ts` + 测试
- `c-end/exams/h5/H5ExamList.tsx` + 测试
- `c-end/exams/styles.css`
- `examStore` 增加 `getExams` / `getExamCategoryTree`
- `exam.ts` 补已发布种子，`EXAM_MOCK_VERSION` +1
- `navigation` / `CEndApp` / `CEndPortal`

## 不做

成绩页、答题、PC、未发布考试。
