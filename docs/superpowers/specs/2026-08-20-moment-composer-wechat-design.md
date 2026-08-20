# 精彩瞬间发布：按上传推断类型（朋友圈式）

**日期：** 2026-08-20  
**状态：** 已确认，待实现  
**范围：** C 端发布/再提瞬间去掉「图文类型 / 视频」单选；按已选图片或视频推断并写入 `MomentRecord.type`。发布页改成朋友圈式：上文、下九宫格。  
**演示用户：** 陈产品。C 端不用 antd。H5 底栏 / PC 弹窗壳不动。

## 背景与目标

现 `MomentComposer` 用 radiogroup 先选类型，再露出图或视频槽。产品不要选手动类型：系统看上传内容。交互对齐朋友圈：文字可选，媒体必填，图与视频互斥。

## 决策摘要

| 项 | 选择 |
|---|---|
| 类型 UI | 删除单选。后台/Feed 仍用 `图文类型` / `视频` |
| 推断时机 | 提交前 `inferMomentType`；store 仍写 `draft.type` |
| 互斥 | 后选覆盖：选视频清图；选图清视频 |
| 必填 | 至少 1 张图或 1 个视频。字可选（≤200） |
| 纯文字 | 不行 |
| 布局 | 文在上，九宫格「+」`accept="image/*,video/*"` |
| 壳 | `H5MomentSheet` / `PcMomentModal` 不改结构 |
| 不做 | 不改发布资格（仍仅已结束+已通过）、不改瞬间种子、不改审核页交互、不做真机系统相册权限、不压缩上传 |

## 推断与校验

`src/features/activities/model/moment.ts` 新增：

```ts
export function inferMomentType(imageUrls: string[], videoUrl?: string): MomentType | undefined {
  const hasImages = imageUrls.length > 0;
  const hasVideo = Boolean(videoUrl);
  if (hasImages && hasVideo) return undefined;
  if (hasVideo) return '视频';
  if (hasImages) return '图文类型';
  return undefined;
}
```

`validateComposer` 改为看媒体，不信任 `draft.type`：

1. `content.trim().length > MOMENT_CONTENT_MAX` → `内容不能超过 200 字`
2. 有图且有视频 → `图片和视频不能同时发`
3. 无图且无视频 → `请上传图片或视频`
4. `imageUrls.length > MOMENT_IMAGE_MAX` → `图片不能超过 9 张`
5. 否则通过（空字允许）

删除旧规则：「图文必须填字」「图文至少 1 张图」作为独立于推断的分支（无图已由第 3 条覆盖）。

`submitMoment` / `resubmitMoment`：校验通过后用 `inferMomentType` 写入记录的 `type`。`draft.type` 可在 composer 提交时填上，store 以推断结果为准，避免伪造类型。

`momentStore` 落库：

- `图文类型`：`imageUrls` 拷贝，`videoUrl` 不写
- `视频`：`videoUrl` 写入，`imageUrls` 空数组

## Composer UI

文件：`src/features/c-end/activities/components/MomentComposer.tsx`

- 去掉 `role="radiogroup"` 类型选择。
- 文案区：无「内容 / 内容（可选）」切换。placeholder：`这一刻的想法…`。字数 `n/200`。
- 九宫格：已选图缩略图可点删；视频一格预览+删。无视频且图 < 9 时显示「+」。
- 「+」同一 `input[type=file][accept="image/*,video/*"][multiple]`。
- 一次 `FileList`：
  - 含任意 `video/*`：取第一个视频，清空图片，写入 `videoUrl`。
  - 否则只收 `image/*`，清空视频，追加图片直到 9 张。其它 MIME 忽略。
- 有视频时不显示「+」。
- 标题仍「发布瞬间」/「修改后再提」；主按钮「发布」/「再次提交」；取消不变。
- 再提：按现记录灌图或视频进格子。

## 兼容

- Feed、后台详情仍按 `moment.type` 分支图/视频。种子瞬间不改。
- `canSubmitMoment` / `submitBlockReason` 不在本需求改。

## 测试

- `moment.test.ts`（或同文件新 describe）：
  - `inferMomentType(['a'], undefined) === '图文类型'`
  - `inferMomentType([], 'v') === '视频'`
  - `inferMomentType([], undefined)` / 图+视频 → `undefined`
  - `validateComposer`：空媒体 → `请上传图片或视频`；仅字无媒体同上；1 图空字通过；1 视频空字通过；图+视频 → `图片和视频不能同时发`；字超 200 仍拦
- Composer：静态 HTML 不含「瞬间类型」、不含「图文类型」选项文案（Feed/后台测试仍可含类型字）。
- 现有 `momentStore` / Feed 测试：资格与展示不回归。

## 范围外

活动 2 状态、评论、审核流、antd、真实上传服务。
