# 朋友圈式瞬间发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** C 端发布瞬间去掉类型单选；按图片/视频推断 `MomentRecord.type`；发布页上文 + 九宫格，图与视频互斥，媒体必填、字可选。

**Architecture:** `moment.ts` 加 `inferMomentType`、`applyPickedMedia`，重写 `validateComposer`（不信任 `draft.type`）。`momentStore` 落库 type 用推断结果。`MomentComposer` 共用一个 file input。H5/PC 壳不改。

**Tech Stack:** TypeScript、Vitest、React 19。C 端不用 antd。

---

## File map

- Modify: `src/features/activities/model/moment.ts`
- Modify: `src/features/activities/model/moment.test.ts`
- Modify: `src/features/activities/model/momentStore.ts`
- Modify: `src/features/c-end/activities/components/MomentComposer.tsx`
- Create: `src/features/c-end/activities/components/MomentComposer.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`（九宫格视频格与图同尺寸；可删 `.c-moment-add.is-wide` 的使用）

规格：`docs/superpowers/specs/2026-08-20-moment-composer-wechat-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

不改 `canSubmitMoment` / `submitBlockReason`。不改瞬间种子。不改 `H5MomentSheet` / `PcMomentModal` 结构。C 端不用 antd。

`applyPickedMedia` 把规格里的 FileList 规则提成纯函数，便于单测（composer 仍负责 FileReader）。

---

### Task 1: 推断、选文件、校验

**Files:**
- Modify: `src/features/activities/model/moment.ts`
- Modify: `src/features/activities/model/moment.test.ts`

- [ ] **Step 1: 写失败测试**

在 `moment.test.ts` 追加（保留现有 submit rules describe）：

```ts
import { applyPickedMedia, inferMomentType, validateComposer } from './moment';

describe('inferMomentType', () => {
  it('infers from media without mixing', () => {
    expect(inferMomentType(['a'], undefined)).toBe('图文类型');
    expect(inferMomentType([], 'v')).toBe('视频');
    expect(inferMomentType([], undefined)).toBeUndefined();
    expect(inferMomentType(['a'], 'v')).toBeUndefined();
  });
});

describe('applyPickedMedia', () => {
  it('replaces images with the first video', () => {
    expect(
      applyPickedMedia(
        { imageUrls: ['old'], videoUrl: undefined },
        [
          { mime: 'image/png', dataUrl: 'img' },
          { mime: 'video/mp4', dataUrl: 'vid' },
        ],
      ),
    ).toEqual({ imageUrls: [], videoUrl: 'vid' });
  });

  it('clears video and appends images up to 9', () => {
    const current = { imageUrls: ['1', '2'], videoUrl: 'old-vid' };
    const picked = Array.from({ length: 10 }, (_, index) => ({
      mime: 'image/jpeg',
      dataUrl: `n${index}`,
    }));
    const next = applyPickedMedia(current, picked);
    expect(next.videoUrl).toBeUndefined();
    expect(next.imageUrls).toEqual(['1', '2', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']);
  });
});

describe('validateComposer media rules', () => {
  const base = { type: '图文类型' as const, content: '', imageUrls: [] as string[], videoUrl: undefined as string | undefined };

  it('requires media and allows empty text', () => {
    expect(validateComposer(base)).toBe('请上传图片或视频');
    expect(validateComposer({ ...base, content: '只有字' })).toBe('请上传图片或视频');
    expect(validateComposer({ ...base, imageUrls: ['a'] })).toBeUndefined();
    expect(validateComposer({ ...base, type: '视频', videoUrl: 'v' })).toBeUndefined();
    expect(validateComposer({ ...base, imageUrls: ['a'], videoUrl: 'v' })).toBe('图片和视频不能同时发');
  });

  it('still caps content length', () => {
    expect(validateComposer({ ...base, content: '字'.repeat(201), imageUrls: ['a'] })).toBe('内容不能超过 200 字');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/moment.test.ts`

Expected: FAIL，`inferMomentType` / `applyPickedMedia` 未导出；`validateComposer` 空字有图仍报「请填写内容」。

- [ ] **Step 3: 实现**

`moment.ts` 在 `MomentDraft` 后追加：

```ts
export type PickedMediaFile = { mime: string; dataUrl: string };

export function inferMomentType(imageUrls: string[], videoUrl?: string): MomentType | undefined {
  const hasImages = imageUrls.length > 0;
  const hasVideo = Boolean(videoUrl);
  if (hasImages && hasVideo) return undefined;
  if (hasVideo) return '视频';
  if (hasImages) return '图文类型';
  return undefined;
}

export function applyPickedMedia(
  current: { imageUrls: string[]; videoUrl?: string },
  picked: PickedMediaFile[],
): { imageUrls: string[]; videoUrl?: string } {
  const video = picked.find((item) => item.mime.startsWith('video/'));
  if (video) return { imageUrls: [], videoUrl: video.dataUrl };
  const incoming = picked.filter((item) => item.mime.startsWith('image/')).map((item) => item.dataUrl);
  return {
    imageUrls: [...current.imageUrls, ...incoming].slice(0, MOMENT_IMAGE_MAX),
    videoUrl: undefined,
  };
}
```

把 `validateComposer` **整段替换**为：

```ts
export function validateComposer(draft: MomentDraft): string | undefined {
  const content = draft.content.trim();
  if (content.length > MOMENT_CONTENT_MAX) return `内容不能超过 ${MOMENT_CONTENT_MAX} 字`;
  const hasImages = draft.imageUrls.length > 0;
  const hasVideo = Boolean(draft.videoUrl);
  if (hasImages && hasVideo) return '图片和视频不能同时发';
  if (!hasImages && !hasVideo) return '请上传图片或视频';
  if (draft.imageUrls.length > MOMENT_IMAGE_MAX) return `图片不能超过 ${MOMENT_IMAGE_MAX} 张`;
  return undefined;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/moment.test.ts`

Expected: PASS（含原 submit rules）。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: store 以推断结果落库

**Files:**
- Modify: `src/features/activities/model/momentStore.ts`

- [ ] **Step 1: 无独立失败测试**

本任务无新用例。Task 1 已覆盖推断。改 store 时 `draft.type` 作假也不应写入错误类型。

- [ ] **Step 2: 跳过红灯**

- [ ] **Step 3: 改 submit / resubmit**

`momentStore.ts` 从 `./moment` 的 import 增加 `inferMomentType`。

`submitMoment` 在 `validateComposer` 通过后、组对象前：

```ts
  const type = inferMomentType(draft.imageUrls, draft.videoUrl);
  if (!type) return { ok: false, message: '请上传图片或视频' };
```

把写入记录里的 `type: draft.type` 改成 `type`，`imageUrls` / `videoUrl` 用这个 `type` 分支（不要 `draft.type`）：

```ts
      type,
      imageUrls: type === '图文类型' ? [...draft.imageUrls] : [],
      videoUrl: type === '视频' ? draft.videoUrl : undefined,
```

`resubmitMoment` 同样：校验后推断 `type`，`patchMoment` 里用推断 `type`，不要 `draft.type`。

- [ ] **Step 4:** `npm test -- src/features/activities/model/moment.test.ts src/features/activities/model/momentStore.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: Composer 九宫格

**Files:**
- Create: `src/features/c-end/activities/components/MomentComposer.test.tsx`
- Modify: `src/features/c-end/activities/components/MomentComposer.tsx`
- Modify: `src/features/c-end/activities/styles.css`

- [ ] **Step 1: 写失败测试**

`MomentComposer.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { MomentComposer } from './MomentComposer';

describe('MomentComposer', () => {
  it('hides type radios and uses a mixed media picker', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <MomentComposer activity={activity!} onCancel={() => undefined} onSuccess={() => undefined} />,
    );
    expect(html).not.toContain('瞬间类型');
    expect(html).not.toContain('name="moment-type"');
    expect(html).toContain('这一刻的想法…');
    expect(html).toContain('accept="image/*,video/*"');
    expect(html).toContain('发布瞬间');
  });
});
```

- [ ] **Step 2:** `npm test -- src/features/c-end/activities/components/MomentComposer.test.tsx`

Expected: FAIL，现 HTML 仍有 `瞬间类型` / `moment-type`。

- [ ] **Step 3: 重写 Composer + 微调 CSS**

`MomentComposer.tsx` **整文件替换**为：

```tsx
import { useState } from 'react';
import type { Activity } from '../../../activities/model/activity';
import {
  applyPickedMedia,
  inferMomentType,
  MOMENT_CONTENT_MAX,
  MOMENT_IMAGE_MAX,
  validateComposer,
  type MomentDraft,
  type MomentRecord,
} from '../../../activities/model/moment';
import { isMomentAuditEnabled, resubmitMoment, submitMoment } from '../../../activities/model/momentStore';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type MomentComposerProps = {
  activity: Activity;
  editing?: MomentRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
};

export function MomentComposer({ activity, editing, onCancel, onSuccess }: MomentComposerProps) {
  const [content, setContent] = useState(editing?.content ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(editing?.imageUrls?.length ? [...editing.imageUrls] : []);
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = await Promise.all(
      Array.from(files).map(async (file) => ({ mime: file.type, dataUrl: await readAsDataUrl(file) })),
    );
    const next = applyPickedMedia({ imageUrls, videoUrl }, picked);
    setImageUrls(next.imageUrls);
    setVideoUrl(next.videoUrl);
    setError(undefined);
  };

  const submit = () => {
    const type = inferMomentType(imageUrls, videoUrl) ?? '图文类型';
    const draft: MomentDraft = { type, content, imageUrls, videoUrl };
    const invalid = validateComposer(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    const result = editing ? resubmitMoment(editing.id, activity, draft) : submitMoment(activity, draft);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const audit = isMomentAuditEnabled(activity.type);
    onSuccess(audit ? '已提交，待审核' : '发布成功');
  };

  const showAdd = !videoUrl && imageUrls.length < MOMENT_IMAGE_MAX;

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="c-signup-legend">{editing ? '修改后再提' : '发布瞬间'}</p>
      <label className="c-moment-field">
        <textarea
          className="c-moment-text"
          value={content}
          maxLength={MOMENT_CONTENT_MAX}
          rows={4}
          placeholder="这一刻的想法…"
          onChange={(event) => setContent(event.target.value)}
        />
        <span className="c-moment-count">
          {content.length}/{MOMENT_CONTENT_MAX}
        </span>
      </label>
      <div className="c-moment-thumbs">
        {imageUrls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            className="c-moment-thumb"
            type="button"
            aria-label={`移除第 ${index + 1} 张图`}
            onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            <img src={url} alt="" />
          </button>
        ))}
        {videoUrl ? (
          <div className="c-moment-thumb is-video">
            {videoUrl.startsWith('data:video') || /\.mp4/i.test(videoUrl) ? <video src={videoUrl} /> : <img src={videoUrl} alt="" />}
            <button className="c-moment-thumb-remove" type="button" aria-label="移除视频" onClick={() => setVideoUrl(undefined)}>
              ×
            </button>
          </div>
        ) : null}
        {showAdd ? (
          <label className="c-moment-add">
            +
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(event) =>
                void addFiles(event.target.files).then(() => {
                  event.target.value = '';
                })
              }
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="c-moment-error">{error}</p> : null}
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="submit" disabled={submitting}>
          {editing ? '再次提交' : '发布'}
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
```

`styles.css` 在 `.c-moment-thumb img` 规则附近追加（`.c-moment-thumbs` 之后即可）：

```css
.c-moment-thumb.is-video {
  position: relative;
}

.c-moment-thumb.is-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.c-moment-thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}
```

`.c-moment-add.is-wide` 可留着不删（无引用即可）。

- [ ] **Step 4:** `npm test -- src/features/c-end/activities/components/MomentComposer.test.tsx src/features/c-end/activities/components/MomentFeed.test.tsx src/features/c-end/activities/components/ActivitySocialTabs.test.tsx`

Expected: PASS。Feed 仍可出现「图文」展示，Composer 无类型单选。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 0 errors。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1` 点发布瞬间：无类型单选；placeholder「这一刻的想法…」；「+」可选图或视频。无浏览器则 SKIP。
- [ ] **Step 4:** 跳过 commit。

---

## 自检

| 规格项 | 任务 |
|---|---|
| `inferMomentType` | Task 1 |
| `validateComposer` 新媒体规则 | Task 1 |
| FileList 互斥 / 9 张 | Task 1 `applyPickedMedia` + Task 3 |
| store 不信任 `draft.type` | Task 2 |
| 去掉 radiogroup、九宫格、placeholder | Task 3 |
| 壳不改、资格不改、种子不改 | 约束 |
| 全量测试 | Task 4 |
