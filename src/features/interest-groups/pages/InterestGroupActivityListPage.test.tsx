import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ACTIVITY_LIST_VIEW_KEY } from '../model/interestGroupActivityListView';
import { InterestGroupActivityListPage } from './InterestGroupActivityListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

function stubListView(value: string | null) {
  const store = new Map<string, string>();
  if (value != null) store.set(ACTIVITY_LIST_VIEW_KEY, value);
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, next: string) => {
      store.set(key, next);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage });
}

beforeEach(() => stubListView(null));
afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('InterestGroupActivityListPage', () => {
  it('renders heading, seed activities and page actions', () => {
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('活动管理');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('夏季共读三期');
    expect(html).toContain('新建活动');
    expect(html).toContain('AI 策划');
    expect(html).not.toContain('审核状态');
    expect(html).not.toContain('提交审批');
    expect(html).not.toContain('批量提交审批');
    expect(html).toContain('举办方式');
    expect(html).toContain('活动标题');
    expect(html).toContain('/activities/basketball.jpg');
    expect(html).toContain('详情');
    expect(html).toContain('编辑');
    expect(html).toContain('复制');
    expect(html).not.toContain('待审核');
    expect(html).toContain('发布状态');
    expect(html).toContain('已发布');
    expect(html).toContain('未发布');
    expect(html).not.toContain('报名情况');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
    expect(html).toContain('所属兴趣圈');
    expect(html).toContain('更多操作');
    expect(html).not.toContain('报名截止时间');
    expect(html).not.toContain('活动终止时间');
    expect(html).toContain('2026-08-31 09:00 ~ 2026-09-10 16:00 · 共 2 场');
    expect(html).toContain('终止活动 周末连营徒步');
    expect(html).not.toContain('终止活动 滨江 8K 夜跑 · 江风配速团');
    const detail = html.indexOf('详情');
    const edit = html.indexOf('编辑');
    const copy = html.indexOf('复制');
    expect(edit).toBeGreaterThan(detail);
    expect(copy).toBeGreaterThan(edit);
    expect(html).toContain('删除');
    expect(html).toContain('置顶');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).not.toContain('上移 周末连营徒步');
    expect(html).not.toContain('下移 周末连营徒步');
    expect(html).toContain('取消置顶 周末连营徒步');
    expect(html).toContain('创建人');
    expect(html).toContain('陈产品');
  });

  it('locks to one group when embedded in group detail', () => {
    const html = renderPage(<InterestGroupActivityListPage groupId={1} onNavigate={() => undefined} />);
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).not.toContain('活动管理');
    expect(html).not.toContain('所属兴趣圈');
    expect(html).toContain('活动标题');
    expect(html).toContain('详情');
    expect(html).toContain('AI 策划');
    expect(html).not.toContain('夏季共读三期');
  });

  it('shows view switch and table selection in list mode', () => {
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html.split('aria-label="展示形式"').length - 1).toBe(1);
    expect(html).toContain('ant-table');
    expect(html).toContain('ant-table-selection-column');
    expect(html).not.toContain('ig-activity-card-grid');
  });

  it('renders cover cards without row selection when view is card', () => {
    stubListView('card');
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('ig-activity-card-grid');
    expect(html).toContain('/activities/basketball.jpg');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('城市夜跑团');
    expect(html.split('aria-label="展示形式"').length - 1).toBe(1);
    expect(html).toContain('更多操作');
    expect(html).not.toContain('ant-table-selection-column');
    expect(html).not.toContain('class="ant-table');
  });

  it('falls back to table when stored view is invalid', () => {
    stubListView('grid');
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('ant-table');
    expect(html.split('aria-label="展示形式"').length - 1).toBe(1);
    expect(html).not.toContain('ig-activity-card-grid');
  });

  it('hides group name on cards when embedded in group detail', () => {
    stubListView('card');
    const html = renderPage(<InterestGroupActivityListPage groupId={1} onNavigate={() => undefined} />);
    expect(html).toContain('ig-activity-card-grid');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).not.toContain('夏季共读三期');
    expect(html).not.toContain('城市夜跑团');
  });
});
