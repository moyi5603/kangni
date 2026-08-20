# 首页「我的活动 / 我的收藏」合并与压缩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** H5 / PC 首页把「我的活动」和「我的收藏」收成一块：空不渲染，单边普通标题，双边 tab（默认活动），预览卡方图 72→48。

**Architecture:** `clientActivity.ts` 增加 `homeMineMode` 纯函数。H5 / PC 首页各一个 `c-*-mine` section，本地 `useState` + `initialMineTab` 管 tab。压缩样式只打 `.is-preview` 内的 `.c-signup-thumb`，全页列表 72px 不动。

**Tech Stack:** React 19、TypeScript、Vitest `renderToStaticMarkup`、现有 `.c-tab`。C 端不用 antd。

---

## File map

- Modify: `src/features/c-end/activities/model/clientActivity.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/styles.css`

规格：`docs/superpowers/specs/2026-08-20-home-mine-tabs-compact-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

Demo 种子：报名 `resetClientSignups()` 后为空；收藏 `resetEngagement()` 后陈产品仍藏 id 2、9。测「整块隐藏 / 只有报名」必须 `toggleFavorite(2)` 和 `toggleFavorite(9)` 清掉。不要改 engagement 种子，也不要把 `resetEngagement` 改成空收藏。

不要改全页 `H5MySignups` / `PcMySignups` / `H5MyFavorites` / `PcMyFavorites` 卡片尺寸。不要改 `HOME_SIGNUP_PREVIEW_LIMIT` / `HOME_FAVORITE_PREVIEW_LIMIT`（仍为 2）。不要改发现活动。

---

### Task 1: `homeMineMode` helper

**Files:**
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.ts`

- [ ] **Step 1: 写失败测试**

`clientActivity.test.ts` 顶部 import 增加：

```ts
  hasHomeFavoritesPane,
  hasHomeSignupsPane,
  homeMineMode,
  HOME_MINE_TABS,
```

在文件末尾（`live social counts and favorites` 的 `describe` 之后）追加：

```ts
describe('home mine mode', () => {
  const signup: ClientSignup = {
    activityId: 2,
    name: DEMO_SIGNUP_USER.name,
    phone: DEMO_SIGNUP_USER.phone,
    type: '个人报名',
    status: '已通过',
    createdAt: '2026-08-18T16:00:00.000Z',
  };

  it('hides when both panes are empty', () => {
    expect(hasHomeSignupsPane([])).toBe(false);
    expect(hasHomeFavoritesPane(previewFavorites([3], initialActivities))).toBe(false);
    expect(homeMineMode(false, false)).toBe('hidden');
  });

  it('uses a single pane when only one side has data', () => {
    expect(hasHomeSignupsPane([signup])).toBe(true);
    expect(hasHomeFavoritesPane(previewFavorites([2, 9], initialActivities))).toBe(true);
    expect(homeMineMode(true, false)).toBe('signups');
    expect(homeMineMode(false, true)).toBe('favorites');
  });

  it('uses tabs when both sides have data', () => {
    expect(homeMineMode(true, true)).toBe('tabs');
    expect(HOME_MINE_TABS.map((item) => item.label)).toEqual(['活动', '收藏']);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/clientActivity.test.ts`

Expected: FAIL，`hasHomeSignupsPane` / `HOME_MINE_TABS` 未导出。

- [ ] **Step 3: 最小实现**

在 `src/features/c-end/activities/model/clientActivity.ts` 的 `FavoriteView` / `previewFavorites` **之后**追加：

```ts
export const HOME_MINE_TABS = [
  { id: 'signups', label: '活动' },
  { id: 'favorites', label: '收藏' },
] as const;

export type HomeMinePane = (typeof HOME_MINE_TABS)[number]['id'];
export type HomeMineMode = 'hidden' | 'signups' | 'favorites' | 'tabs';

export function hasHomeSignupsPane(signups: readonly unknown[]): boolean {
  return signups.length > 0;
}

export function hasHomeFavoritesPane(preview: readonly FavoriteView[]): boolean {
  return preview.some((item) => item.activity);
}

export function homeMineMode(hasSignups: boolean, hasFavorites: boolean): HomeMineMode {
  if (hasSignups && hasFavorites) return 'tabs';
  if (hasSignups) return 'signups';
  if (hasFavorites) return 'favorites';
  return 'hidden';
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/clientActivity.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过（不是 git 仓库）。

---

### Task 2: H5 首页合并成 `c-h5-mine`

**Files:**
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/h5/H5ActivityHome.tsx`

- [ ] **Step 1: 整文件替换测试**

把 `H5ActivityHome.test.tsx` 换成：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { H5ActivityHome } from './H5ActivityHome';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../model/signupStore';

function clearSeedFavorites() {
  toggleFavorite(2);
  toggleFavorite(9);
}

function mineHtml(html: string) {
  const start = html.indexOf('c-h5-mine');
  const catalog = html.indexOf('id="h5-activity-catalog"');
  return html.slice(start, catalog);
}

describe('H5 activity home', () => {
  beforeEach(() => {
    resetClientSignups();
    resetEngagement();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
    resetEngagement();
  });

  it('hides the mine block when there are no signups and no favorites', () => {
    clearSeedFavorites();
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).toContain('<header class="c-h5-top">');
    expect(html).toContain('<h1 class="c-h5-title">员工活动</h1>');
    expect(html).not.toContain('c-h5-portal-head');
    expect(html).not.toContain('c-h5-mine');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
  });

  it('does not render a separate signup rail that duplicates the catalog', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);

    expect(html).not.toContain('正在报名');
    expect(html).not.toContain('c-h5-feature-strip');
    expect(html).not.toContain('aria-label="报名中活动"');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
    expect(html).toContain('aria-label="活动列表"');
  });

  it('shows only my-favorites when seed favorites exist and signups are empty', () => {
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);
    const mineIndex = html.indexOf('c-h5-mine');
    const catalogIndex = html.indexOf('id="h5-activity-catalog"');

    expect(mineIndex).toBeGreaterThan(html.indexOf('<main'));
    expect(mineIndex).toBeLessThan(catalogIndex);
    expect(mine).toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('查看全部');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html.slice(catalogIndex)).toContain('c-social');
  });

  it('previews up to two upcoming signups without a view-all link', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect((html.match(/class="c-h5-signup-card /g) ?? []).length).toBe(1);
    expect(mine).toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('培训中心 3 楼');
    expect(mine).not.toContain('查看全部');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(html).not.toContain('还没有报名活动');
  });

  it('shows view-all when upcoming signups exceed the home preview limit', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(submitSignup(9, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect((html.match(/class="c-h5-signup-card /g) ?? []).length).toBe(2);
  });

  it('keeps ended signups off the home preview and points to the full list', () => {
    clearSeedFavorites();
    expect(submitSignup(1, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 1 && item.phone === '13800001111'
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(html.indexOf('c-h5-mine')).toBeGreaterThan(-1);
    expect(mine).toContain('查看全部');
    expect(mine).toContain('暂无待参加活动');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('c-h5-signup-card');
  });

  it('shows a square cover on my-activity preview cards', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });

  it('previews demo upcoming cards with tabs defaulting to signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5ActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('aria-label="我的活动与收藏"');
    expect(mine).toContain('>活动</button>');
    expect(mine).toContain('>收藏</button>');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');
    expect(mine).not.toContain('还没有报名活动');

    const catalog = html.slice(html.indexOf('id="h5-activity-catalog"'));
    expect(catalog).not.toContain('c-signup-status-row');
    expect(catalog).not.toContain('is-audit-');
  });

  it('shows favorite preview when initialMineTab is favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<H5ActivityHome initialMineTab="favorites" />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('年度体检安排');
    expect(mine).not.toContain('c-signup-status-row');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx`

Expected: FAIL，没有 `c-h5-mine` / `initialMineTab`。

- [ ] **Step 3: 改 H5 首页**

`H5ActivityHome.tsx`：

1. 删掉 `scrollToCatalog`。
2. import 增加：

```ts
  HOME_MINE_TABS,
  hasHomeFavoritesPane,
  hasHomeSignupsPane,
  homeMineMode,
  type HomeMinePane,
```

3. 把 `export function H5ActivityHome()` 换成带 prop 的版本，用 `mode` / `pane` 渲染**一个** section。发现活动 section 原样保留。

完整组件（保留文件上半 `SignupThumb` / `HomeSignupPreviewCard` 不变）：

```tsx
export function H5ActivityHome({
  initialMineTab = 'signups',
}: {
  initialMineTab?: HomeMinePane;
} = {}) {
  useLiveSocial();
  const activities = useActivities();
  const signups = useUserSignups();
  const favoriteIds = useFavoriteActivityIds();
  const [tab, setTab] = useState<ClientTabId>('all');
  const [mineTab, setMineTab] = useState<HomeMinePane>(initialMineTab);
  const signedIds = useMemo(
    () => new Set(signups.map((signup) => signup.activityId)),
    [signups],
  );
  const list = useMemo(() => filterByTab(activities, tab), [activities, tab]);
  const groups = useMemo(
    () => groupClientSignups(signups, clientVisibleActivities(activities)),
    [activities, signups],
  );
  const preview = groups.upcoming.slice(0, HOME_SIGNUP_PREVIEW_LIMIT);
  const favoritePreview = useMemo(
    () => previewFavorites(favoriteIds, activities),
    [favoriteIds, activities],
  );
  const mode = homeMineMode(
    hasHomeSignupsPane(signups),
    hasHomeFavoritesPane(favoritePreview),
  );
  const pane: HomeMinePane =
    mode === 'favorites' || (mode === 'tabs' && mineTab === 'favorites')
      ? 'favorites'
      : 'signups';
  const showViewAll =
    pane === 'favorites'
      ? true
      : groups.upcoming.length > HOME_SIGNUP_PREVIEW_LIMIT || groups.ended.length > 0;

  return (
    <H5ActivityShell title="员工活动" onBack={goCEndPortal}>
      {mode !== 'hidden' ? (
        <section className="c-h5-section c-h5-mine">
          <div className="c-h5-section-head">
            {mode === 'tabs' ? (
              <div className="c-tabs c-h5-mine-tabs" role="tablist" aria-label="我的活动与收藏">
                {HOME_MINE_TABS.map((item) => {
                  const active = item.id === pane;
                  return (
                    <button
                      key={item.id}
                      className={`c-tab${active ? ' is-active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMineTab(item.id)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="c-section-title">{mode === 'favorites' ? '我的收藏' : '我的活动'}</h2>
            )}
            {showViewAll ? (
              <button
                className="c-h5-section-more"
                type="button"
                onClick={pane === 'favorites' ? goH5Favorites : goH5MySignups}
              >
                查看全部
              </button>
            ) : null}
          </div>
          {pane === 'signups' ? (
            preview.length === 0 ? (
              <p className="c-empty">暂无待参加活动</p>
            ) : (
              <ul className="c-h5-list" aria-label="待参加活动">
                {preview.map((item) =>
                  item.activity ? (
                    <li key={`${item.signup.activityId}-${item.signup.createdAt}`}>
                      <HomeSignupPreviewCard item={item} />
                    </li>
                  ) : null,
                )}
              </ul>
            )
          ) : (
            <ul className="c-h5-list" aria-label="收藏的活动">
              {favoritePreview.map((item) =>
                item.activity ? (
                  <li key={item.activityId}>
                    <button
                      className="c-h5-fav-card c-h5-card-button is-preview"
                      type="button"
                      onClick={() => goCEnd('h5', item.activity!.id)}
                    >
                      <SignupThumb coverUrl={item.activity.coverUrl} />
                      <div className="c-h5-signup-card-body">
                        <h3 className="c-h5-signup-title">{item.activity.title}</h3>
                        <ActivityMeta activity={item.activity} compact />
                      </div>
                      <IconChevronRight />
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </section>
      ) : null}

      <section id={CATALOG_ID} className="c-h5-section c-h5-catalog">
        {/* 发现活动整段原样保留，不要改 */}
      </section>
    </H5ActivityShell>
  );
}
```

发现活动那一段从现有文件**原样拷贝**，不要改分类 tab / 列表。注释 `{/* 发现活动... */}` 不要写进代码，上面只是占位。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 3: PC 首页合并成 `c-pc-mine`

**Files:**
- Modify: `src/features/c-end/activities/pc/PcActivityHome.test.tsx`
- Modify: `src/features/c-end/activities/pc/PcActivityHome.tsx`

规则与 H5 相同，class / 导航换成 PC：`c-pc-mine`、`c-pc-section-head`、`c-pc-section-more`、`c-pc-signup-card`、`c-pc-fav-card`、`c-card-btn`、`c-pc-preview-list`、`goPcFavorites` / `goPcMySignups`、catalog id `pc-activity-catalog`。

- [ ] **Step 1: 整文件替换测试**

把 `PcActivityHome.test.tsx` 换成：

```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { patchRelated, restoreRelatedSignups } from '../../../activities/model/related';
import { resetEngagement, toggleFavorite } from '../model/engagementStore';
import { loadDemoSignups, resetClientSignups, submitSignup } from '../model/signupStore';
import { PcActivityHome } from './PcActivityHome';

function clearSeedFavorites() {
  toggleFavorite(2);
  toggleFavorite(9);
}

function mineHtml(html: string) {
  const start = html.indexOf('c-pc-mine');
  const catalog = html.indexOf('id="pc-activity-catalog"');
  return html.slice(start, catalog);
}

describe('PC activity home', () => {
  beforeEach(() => {
    resetClientSignups();
    resetEngagement();
  });

  afterEach(() => {
    resetClientSignups();
    restoreRelatedSignups();
    resetEngagement();
  });

  it('hides the mine block when there are no signups and no favorites', () => {
    clearSeedFavorites();
    const html = renderToStaticMarkup(<PcActivityHome />);

    expect(html).toContain('<h1 class="c-pc-header-title">员工活动</h1>');
    expect(html).not.toContain('c-pc-mine');
    expect(html).not.toContain('还没有报名活动');
    expect(html).not.toContain('去看看活动');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
  });

  it('does not render the featured signup rail', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));

    expect(html).not.toContain('报名中活动');
    expect(html).not.toContain('c-hero-carousel');
    expect(catalog).toContain('c-social');
    expect(html).toContain('<h2 class="c-section-title">发现活动</h2>');
    expect(html).toContain('aria-label="活动列表"');
    expect(html).toContain('c-pc-grid');
  });

  it('shows only my-favorites when seed favorites exist and signups are empty', () => {
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);
    const mineIndex = html.indexOf('c-pc-mine');
    const catalogIndex = html.indexOf('id="pc-activity-catalog"');

    expect(mineIndex).toBeGreaterThan(-1);
    expect(mineIndex).toBeLessThan(catalogIndex);
    expect(mine).toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).toContain('查看全部');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).not.toContain('role="tablist"');
    expect(mine).not.toContain('<h2 class="c-section-title">我的活动</h2>');
  });

  it('previews up to two upcoming signups without a view-all link', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(1);
    expect(mine).toContain('<h2 class="c-section-title">我的活动</h2>');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('培训中心 3 楼');
    expect(mine).not.toContain('查看全部');
    expect(mine).not.toContain('role="tablist"');
  });

  it('shows view-all when upcoming signups exceed the home preview limit', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    expect(submitSignup(6, '个人报名')).toBe('ok');
    expect(submitSignup(9, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect((html.match(/class="c-pc-signup-card /g) ?? []).length).toBe(2);
  });

  it('keeps ended signups off the home preview', () => {
    clearSeedFavorites();
    expect(submitSignup(1, '个人报名')).toBe('ok');
    patchRelated('signups', (list) =>
      list.map((item) =>
        item.activityId === 1 && item.phone === '13800001111'
          ? { ...item, status: '已通过' }
          : item,
      ),
    );
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('查看全部');
    expect(mine).toContain('暂无待参加活动');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('c-pc-signup-card');
  });

  it('shows a square cover on my-activity preview cards', () => {
    clearSeedFavorites();
    expect(submitSignup(2, '个人报名')).toBe('ok');
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);
    const onboard = initialActivities.find((activity) => activity.id === 2)!;

    expect(mine).toContain('c-signup-thumb');
    expect(mine).toContain(`src="${onboard.coverUrl}"`);
    expect(mine).toContain('c-cover-fallback');
    expect(mine).not.toContain('c-cover-type');
  });

  it('previews demo upcoming cards with tabs defaulting to signups', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('aria-label="我的活动与收藏"');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('年度体检安排');
    expect(mine).toContain('进行中');
    expect(mine).toContain('已通过');
    expect(mine).toContain('未开始');
    expect(mine).toContain('待审核');
    expect(mine).toContain('c-signup-status-row');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('<h2 class="c-section-title">我的收藏</h2>');
    expect(mine).not.toContain('春季员工开放日');
    expect(mine).not.toContain('中秋员工晚会');

    const catalog = html.slice(html.indexOf('id="pc-activity-catalog"'));
    expect(catalog).not.toContain('c-signup-status-row');
    expect(catalog).not.toContain('is-audit-');
  });

  it('shows favorite preview when initialMineTab is favorites', () => {
    loadDemoSignups();
    const html = renderToStaticMarkup(<PcActivityHome initialMineTab="favorites" />);
    const mine = mineHtml(html);

    expect(mine).toContain('role="tablist"');
    expect(mine).toContain('新员工入职训练营');
    expect(mine).toContain('中秋员工晚会');
    expect(mine).toContain('查看全部');
    expect(mine).not.toContain('年度体检安排');
    expect(mine).not.toContain('c-signup-status-row');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx`

Expected: FAIL，没有 `c-pc-mine` / `initialMineTab`。

- [ ] **Step 3: 改 PC 首页**

镜像 Task 2：删 `scrollToCatalog`；同样 `mode` / `pane` / `HOME_MINE_TABS`；一个 `<section className="c-pc-section c-pc-mine">`；列表用 `c-pc-preview-list`；收藏卡 `className="c-pc-fav-card c-card-btn is-preview"`；报名预览卡保持 `c-pc-signup-card c-card-btn is-preview`；`onClick` 用 `goCEnd('pc', …)`。发现活动整段原样保留。

tab 容器 class：`c-tabs c-pc-mine-tabs`，`role="tablist"` `aria-label="我的活动与收藏"`。

`PcActivityHome` 签名：

```ts
export function PcActivityHome({
  initialMineTab = 'signups',
}: {
  initialMineTab?: HomeMinePane;
} = {}) {
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/pc/PcActivityHome.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 4: 预览卡变矮（48px 方图）

**Files:**
- Modify: `src/features/c-end/activities/styles.css`

只改首页 `.is-preview`。禁止改全局 `.c-h5-shell .c-signup-thumb` / `.c-pc-shell .c-signup-thumb` 的 72px（全页报名/收藏会误伤）。

- [ ] **Step 1: 覆盖 H5 预览尺寸**

找到：

```css
.c-h5-shell .c-h5-signup-card.is-preview,
.c-h5-shell .c-h5-fav-card.is-preview {
  min-height: 76px;
  padding: 12px 14px;
}
```

换成：

```css
.c-h5-shell .c-h5-signup-card.is-preview,
.c-h5-shell .c-h5-fav-card.is-preview {
  min-height: 0;
  padding: 8px 12px;
}

.c-h5-shell .c-h5-signup-card.is-preview .c-signup-thumb,
.c-h5-shell .c-h5-fav-card.is-preview .c-signup-thumb {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
}
```

把同一组预览卡的 meta 上边距从 8 改 4：

```css
.c-h5-shell .c-h5-signup-card.is-preview .c-meta,
.c-h5-shell .c-h5-fav-card.is-preview .c-meta {
  margin-top: 4px;
}
```

在 `.c-h5-shell .c-h5-section-head` 规则附近增加（tab 放标题位，不要被 `.c-tabs` 的 `margin-bottom: 12px` 撑乱）：

```css
.c-h5-shell .c-h5-mine-tabs {
  margin: 0;
  overflow: visible;
}

.c-h5-shell .c-h5-mine-tabs .c-tab {
  min-height: 44px;
}
```

可删已无引用的 `.c-h5-my-empty` 三块规则（`c-h5-my-empty` / `p` / `.c-btn`）。不要删 `.c-h5-section-more`。

- [ ] **Step 2: 覆盖 PC 预览尺寸**

在 `.c-pc-shell .c-pc-signup-card` / `.c-pc-fav-card` 规则之后追加：

```css
.c-pc-shell .c-pc-signup-card.is-preview,
.c-pc-shell .c-pc-fav-card.is-preview {
  min-height: 0;
  padding: 10px;
}

.c-pc-shell .c-pc-signup-card.is-preview .c-signup-thumb,
.c-pc-shell .c-pc-fav-card.is-preview .c-signup-thumb {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
}

.c-pc-shell .c-pc-signup-card.is-preview .c-meta,
.c-pc-shell .c-pc-fav-card.is-preview .c-meta {
  margin-top: 4px;
}

.c-pc-shell .c-pc-mine-tabs {
  margin: 0;
  overflow: visible;
}

.c-pc-shell .c-pc-mine-tabs .c-tab {
  min-height: 44px;
}
```

可删已无引用的 `.c-pc-my-empty` 规则。不要改 `.c-pc-preview-list` 两列。

- [ ] **Step 3: 确认全页 thumb 仍是 72**

`styles.css` 里这两处必须仍是 72px：

- `.c-h5-shell .c-signup-thumb` → `flex: 0 0 72px; width: 72px; height: 72px;`
- `.c-pc-shell .c-signup-thumb` → 同上

只有 `.is-preview .c-signup-thumb` 是 48px。

- [ ] **Step 4: 回归相关测试**

Run: `npm test -- src/features/c-end/activities/h5/H5ActivityHome.test.tsx src/features/c-end/activities/pc/PcActivityHome.test.tsx src/features/c-end/activities/h5/H5MySignups.test.tsx src/features/c-end/activities/pc/PcMySignups.test.tsx src/features/c-end/activities/h5/H5MyFavorites.test.tsx src/features/c-end/activities/pc/PcMyFavorites.test.tsx`

Expected: PASS。

- [ ] **Step 5: Commit**

跳过。

---

### Task 5: 全量验证

**Files:** 无新文件。

- [ ] **Step 1: 跑全量测试**

Run: `npm test`

Expected: 全部 PASS（原先约 126，本需求会多几条首页/helper 测，允许总数变大）。

- [ ] **Step 2: 类型检查**

Run: `npx tsc -b`

Expected: 无错误。

- [ ] **Step 3: 手工核对（开发服务器若已开）**

`http://127.0.0.1:5173/` 硬刷新后：

- `#/c/h5` 与 `#/c/pc`：demo 默认两边都有 → 一块 tab，默认活动，卡比以前矮。
- 点收藏 tab 看到收藏预览。
- 全页 `#/c/h5/my` 卡片方图仍是大图（72），不是 48。

- [ ] **Step 4: Commit**

跳过。
