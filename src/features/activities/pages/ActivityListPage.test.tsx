import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityListPage } from './ActivityListPage';
import { ActivityCategoryListPage } from './ActivityCategoryListPage';

describe('ActivityListPage', () => {
  it('keeps list toolbar information on the left and create on the right', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityListPage onNavigate={() => undefined} />
      </App>,
    );
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
    expect(html).not.toContain('aria-label="置顶 ');
    expect(html).toContain('anticon-search');
    expect(html).toContain('举办方式');
    expect(html).toContain('单次活动');
    expect(html).toContain('周期活动');
    expect(html).toContain('系列活动');
  });

  it('offers check-in QR only for activities that enabled it', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityListPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('签到码 周四篮球夜');
    expect(html).toContain('签到码 中秋员工晚会');
    expect(html).toContain('签到码 年度体检安排');
    expect(html).toContain('签到码 新人导师工作坊');
    expect(html).toContain('签到码 公益植树日');
    expect(html).toContain('签到码 安全专项培训');
    expect(html).not.toContain('签到码 春季员工开放日');
  });
});

describe('ActivityCategoryListPage', () => {
  it('orders row actions as edit, enable or disable, then delete', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityCategoryListPage />
      </App>,
    );
    const total = html.indexOf('共 ');
    const create = html.indexOf('新建分类');
    const edit = html.indexOf('aria-label="编辑 ');
    const enable = html.indexOf('aria-label="禁用 ');
    const remove = html.indexOf('aria-label="删除 ');
    expect(create).toBeGreaterThan(total);
    expect(edit).toBeGreaterThan(-1);
    expect(enable).toBeGreaterThan(edit);
    expect(remove).toBeGreaterThan(enable);
    expect(html).toContain('ant-btn-dangerous');
  });
});
