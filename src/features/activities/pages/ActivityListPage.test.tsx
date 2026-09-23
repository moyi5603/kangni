import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ACTIVITY_APP_LIST_VIEW_KEY } from '../../../shared/ui/listViewMode';
import { ActivityListPage } from './ActivityListPage';
import { comparePinSort } from '../../interest-groups/model/pinSort';
import { getActivities, getActivity, patchActivities } from '../model/activityStore';
import { applyPinToggle, movePinSortItem } from '../../interest-groups/model/pinSort';

function togglePin(id: number) {
  patchActivities((list) => applyPinToggle(list, id));
}

function moveOne(record: { id: number }, direction: 'up' | 'down', visible: ReturnType<typeof getActivities>) {
  patchActivities((list) => movePinSortItem(list, visible, record.id, direction) ?? list);
}

function stubListView(value: string | null) {
  const store = new Map<string, string>();
  if (value != null) store.set(ACTIVITY_APP_LIST_VIEW_KEY, value);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, next: string) => store.set(key, next),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    },
  });
}

beforeEach(() => stubListView(null));
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

function renderList() {
  return renderToStaticMarkup(
    <App>
      <ActivityListPage onNavigate={() => undefined} />
    </App>,
  );
}

describe('ActivityListPage', () => {
  it('shows title and lifecycle on the collapsed filter row, without audit status', () => {
    const html = renderList();
    const labels = [...html.matchAll(/search-field-label[^>]*>([^<]+)</g)].map((match) => match[1]);
    expect(labels).toEqual(['活动标题', '状态', '分类']);
  });

  it('keeps list toolbar information on the left and create on the right', () => {
    const html = renderList();
    const total = html.indexOf('共 ');
    const create = html.indexOf('新建活动');
    const detail = html.indexOf('详情');
    const edit = html.indexOf('编辑');
    const copy = html.indexOf('复制');
    expect(total).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(total);
    expect(edit).toBeGreaterThan(detail);
    expect(copy).toBeGreaterThan(edit);
    expect(html).toContain('更多操作');
    expect(html).not.toContain('aria-label="提交审批 ');
    expect(html).not.toContain('aria-label="审核 ');
    expect(html).not.toContain('截止报名');
    expect(html).not.toContain('签到码');
    expect(html).not.toContain('批量提交审批');
    expect(html).not.toContain('aria-label="置顶 ');
    expect(html).toContain('发布 骨干人才交流会');
    expect(html).toContain('更多操作 新员工入职训练营');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).toContain('anticon-search');
    expect(html).toContain('举办方式');
    expect(html).toContain('单次活动');
    expect(html).toContain('周期活动');
    expect(html).toContain('系列活动');
    expect(html).not.toContain('审核状态');
    expect(html).not.toContain('报名截止时间');
    expect(html).not.toContain('活动终止时间');
    expect(html).toContain('2026-08-31 09:30 ~ 2026-09-02 17:30 · 共 3 场');
    expect(html).toContain('创建人');
    expect(html).toContain('陈产品');
  });

  it('disables edit on ended activities and keeps copy', () => {
    const html = renderList();
    expect(html).toContain('活动已结束，不能编辑');
    expect(html).toContain('编辑 质量改进项目启动');
    expect(html).toContain('编辑 中秋员工晚会');
  });

  it('offers terminate only for in-progress published activities', () => {
    const html = renderList();
    expect(html).toContain('终止活动 新员工入职训练营');
    expect(html).not.toContain('终止活动 春季员工开放日');
  });

  it('offers delete on each activity row after other row actions', () => {
    const html = renderList();
    const copy = html.indexOf('aria-label="复制 春季员工开放日"');
    const remove = html.indexOf('删除 春季员工开放日');
    expect(copy).toBeGreaterThan(-1);
    expect(remove).toBeGreaterThan(copy);
  });

  it('offers publish instead of review or submit-approval on unpublished rows', () => {
    const html = renderList();
    expect(html).toContain('发布 骨干人才交流会');
    expect(html).toContain('发布 线上公益讲座');
    expect(html).not.toContain('审核 线上公益讲座');
  });

  it('shows view switch and table in list mode', () => {
    const html = renderList();
    expect(html.split('aria-label="展示形式"').length - 1).toBe(1);
    expect(html).toContain('ant-table');
    expect(html).not.toContain('media-entity-card-grid');
  });

  it('renders cover cards when view is card', () => {
    stubListView('card');
    const html = renderList();
    expect(html).toContain('media-entity-card-grid');
    expect(html).toContain('春季员工开放日');
    expect(html).not.toContain('ant-table-selection-column');
    expect(html).not.toMatch(/ant-tag[^>]*>待提交</);
    expect(html).not.toMatch(/ant-tag[^>]*>待审核</);
    expect(html).not.toMatch(/ant-tag[^>]*>已通过</);
    expect(html).not.toMatch(/ant-tag[^>]*>已驳回</);
    expect(html).not.toMatch(/ant-tag[^>]*>无需审核</);
    expect(html).toContain('2026-08-31 09:30 ~ 2026-09-02 17:30 · 共 3 场');
  });
});

describe('ActivityListPage sort actions', () => {
  it('orders rows by pinned then sortIndex and toggles pin into pin zone', () => {
    expect(getActivities().some((item) => item.sortIndex === undefined)).toBe(false);
    const visible = [...getActivities()].sort(comparePinSort);
    const unpinned = visible.filter((item) => !item.pinned);
    const firstUnpinned = unpinned[0];
    togglePin(firstUnpinned.id);
    const after = [...getActivities()].sort(comparePinSort);
    expect(after.findIndex((item) => item.id === firstUnpinned.id)).toBeLessThan(
      after.findIndex((item) => item.id === unpinned[1].id),
    );
    expect(getActivity(firstUnpinned.id)?.pinned).toBe(true);
  });

  it('swaps unpinned rows with 上移/下移 and keeps pinned rows out', () => {
    const visible = [...getActivities()].sort(comparePinSort);
    const pinnedCount = visible.filter((item) => item.pinned).length;
    const unpinned = visible.filter((item) => !item.pinned);
    const before = unpinned.map((item) => item.id);
    moveOne({ id: before[1] }, 'up', [...getActivities()].sort(comparePinSort));
    const after = [...getActivities()].sort(comparePinSort).filter((item) => !item.pinned).map((item) => item.id);
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    expect([...getActivities()].sort(comparePinSort).filter((item) => item.pinned).length).toBe(pinnedCount);
  });
});
