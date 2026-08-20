# 评论 / 回复 / 精彩瞬间员工头像

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端活动评论与回复、精彩瞬间作者与其评论/回复；后台活动评论管理「评论人」列。  
**演示用户：** 陈产品。C 端不用 antd。H5 / PC 仍两套壳。

## 背景与目标

评论、回复、瞬间目前只有姓名文字。组织人 `OrgPerson` 没有头像图。要在这些行上显示员工头像。

## 决策摘要

| 项 | 选择 |
|---|---|
| 样式 | 圆底 + 名字末字（张悦→悦） |
| 颜色 | 姓名 hash 映射固定色板，同名同色 |
| 空名 | 字母 `?` |
| C 端 | 共享 `EmployeeAvatar`，不用 antd |
| 后台 | 评论人列 antd `Avatar` + 姓名，同一套字母/色 |
| 尺寸 | 评论/回复 sm 28px；瞬间作者 md 36px |
| 不做 | 真照片、`avatarUrl` 字段、报名表/瞬间管理表加头像、外网生成图 |

## 共享规则

新建 `src/features/activities/model/employeeAvatar.ts`：

```ts
export const EMPLOYEE_AVATAR_COLORS = [
  '#0f766e',
  '#0e7490',
  '#1d4ed8',
  '#6d28d9',
  '#be185d',
  '#c2410c',
  '#3f6212',
  '#334155',
] as const;

export function employeeAvatarLetter(name: string): string {
  const text = name.replace(/\s+/g, '');
  return text ? text.slice(-1) : '?';
}

export function employeeAvatarColor(name: string): string {
  const text = name.replace(/\s+/g, '');
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return EMPLOYEE_AVATAR_COLORS[hash % EMPLOYEE_AVATAR_COLORS.length]!;
}
```

无障碍：头像 `aria-hidden`。姓名仍在旁边可见。

## C 端

`src/features/c-end/activities/components/EmployeeAvatar.tsx`：

- props：`name: string`，`size?: 'sm' | 'md'`（默认 `sm`）
- 渲染 `span.c-avatar.c-avatar-sm|md`，`style={{ background: color }}`，内文字母
- `aria-hidden`

### 活动评论

`ActivityCommentList` 每条主评/回复的 head 改成：

```
[头像 sm]  名字或 replyLabel          时间
正文
操作行
```

名字与头像同一行左侧；时间仍右对齐。详情预览无回复时主评也有头像。

### 精彩瞬间

- 卡片 meta：`[头像 md] 作者  时间  状态旗`
- 瞬间评论/回复：`[头像 sm] CommentAuthor  正文`

H5/PC 共用 `MomentFeed`，改一处两端都有。

## 后台

`ActivityRelatedListPage.tsx` 评论人列：

```tsx
{
  title: '评论人',
  key: 'author',
  width: 160,
  render: (_, record) => (
    <Space>
      <Avatar size={28} style={{ background: employeeAvatarColor(record.author), fontSize: 12 }}>
        {employeeAvatarLetter(record.author)}
      </Avatar>
      {record.author}
    </Space>
  ),
}
```

报名表、瞬间后台本轮不加。

## 样式

`styles.css`：

- `.c-avatar` 圆形、居中字、白色字、flex-shrink 0
- sm：28×28，font 12
- md：36×36，font 14
- `.c-activity-comment-head` 左簇：`display:flex; align-items:center; gap:8px`（头像+名）；时间仍 `space-between`
- 瞬间 meta / 评论行同样 gap

评论正文、操作行与头像左缘对齐（名字列），不要缩进到头像底下除非实现更简单用「头像 | 右侧整块」。**锁定：头像与右侧（名+时间 / 正文 / 操作）两列。**

```
[头像] | 名                    时间
       | 正文
       | 赞 回复 删除
```

回复行同样两列。

## 测试

- `employeeAvatar.test.ts`：`张悦` → `悦`；`  ` → `?`；同名两次颜色相同；不同名允许同色但不强制。
- H5 详情评论块：含 `c-avatar`，张悦行仍有「张悦」。
- 全页回复行：`c-avatar` + 「王芳 回复 张悦」。
- 瞬间 feed：作者旁有 `c-avatar-md`（或 md class）。可用现有瞬间种子作者名断言。

## 文件

- 新建：`employeeAvatar.ts` + 测试
- 新建：`EmployeeAvatar.tsx`
- 改：`ActivityCommentList.tsx`、`MomentFeed.tsx`、`styles.css`
- 改：`ActivityRelatedListPage.tsx` 评论人列
- 新建：`src/features/c-end/activities/components/MomentFeed.test.tsx`：对活动 1（有瞬间种子）`renderToStaticMarkup(<MomentFeed activity={getPublishedActivity(..., 1)!} />)`，含 `c-avatar-md` 和瞬间作者名。

## 不做

- 不给 `OrgPerson` 加 `avatarUrl`。
- 不改报名列表、收藏卡。
- 后台其它表不加头像。
- C 端不用 antd。
- 不把 H5/PC 合成门户。
