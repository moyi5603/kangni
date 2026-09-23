import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INTEREST_GROUP_LIST_VIEW_KEY } from '../../../shared/ui/listViewMode';
import { InterestGroupListPage } from './InterestGroupListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

function stubListView(value: string | null) {
  const store = new Map<string, string>();
  if (value != null) store.set(INTEREST_GROUP_LIST_VIEW_KEY, value);
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

describe('InterestGroupListPage', () => {
  it('renders list heading and seed groups', () => {
    const html = renderPage(<InterestGroupListPage onNavigate={() => undefined} />);
    expect(html).toContain('兴趣圈管理');
    expect(html).toContain('城市夜跑团');
    expect(html).toContain('周末徒步野行');
    expect(html).toContain('新建兴趣圈');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
    expect(html).toContain('审核状态');
    expect(html).toContain('发布状态');
    expect(html).toContain('午休飞盘局');
    expect(html).toContain('待审核');
    expect(html).toContain('无需审核');
    expect(html).toContain('审核');
    expect(html).toContain('发布');
    expect(html).toContain('撤销');
    expect(html).toContain('更多操作 城市夜跑团：取消置顶 城市夜跑团、删除 城市夜跑团');
    expect(html).toContain('更多操作 午休飞盘局：发布 午休飞盘局、置顶 午休飞盘局、上移 午休飞盘局、下移 午休飞盘局、删除 午休飞盘局');
    expect(html).not.toContain('上移 城市夜跑团');
    expect(html).not.toContain('下移 城市夜跑团');
    expect(html).toContain('更多操作 周末徒步野行：置顶 周末徒步野行、上移 周末徒步野行、下移 周末徒步野行、删除 周末徒步野行');
    expect(html).toContain('更多操作 周末胶片社：置顶 周末胶片社、上移 周末胶片社、下移 周末胶片社、删除 周末胶片社');
    expect(html).not.toContain('ant-popconfirm');
    expect(html).not.toContain('加入方式');
    expect(html).not.toContain('审核加入');
    expect(html).not.toContain('自由加入');
    expect(html).not.toContain('活动区域');
  });

  it('shows view switch in list mode', () => {
    const html = renderPage(<InterestGroupListPage onNavigate={() => undefined} />);
    expect(html.split('aria-label="展示形式"').length - 1).toBe(1);
    expect(html).toContain('ant-table');
    expect(html).not.toContain('media-entity-card-grid');
  });

  it('renders cover cards when view is card', () => {
    stubListView('card');
    const html = renderPage(<InterestGroupListPage onNavigate={() => undefined} />);
    expect(html).toContain('media-entity-card-grid');
    expect(html).toContain('城市夜跑团');
    expect(html).toContain('/activities/basketball.jpg');
    expect(html).not.toContain('class="ant-table');
  });
});
