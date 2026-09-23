import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetIncentiveStoreForTests, getBadges, getCategories, getScopes } from '../model/incentiveStore';
import { BadgeTaxonomyScopeList, IncentiveBadgeListPage } from './IncentiveBadgeListPage';

const noop = () => {};

describe('IncentiveBadgeListPage', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('lists seed badges and create action', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveBadgeListPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('新增勋章');
    expect(html).toContain('归属与分类管理');
    expect(html).toContain('年度标杆');
    expect(html).toContain('编辑');
    expect(html.indexOf('公司表彰')).toBeLessThan(html.indexOf('同事认可'));
    expect(html).not.toContain('请输入勋章名称');
    expect(html).not.toContain('集团管理员');
    expect(html).not.toContain('单位管理员');
    expect(html).not.toContain('勋章由集团统一配置');
  });

  it('keeps scope sort only and leaves category edit and delete', () => {
    const html = renderToStaticMarkup(
      <App>
        <BadgeTaxonomyScopeList
          scopes={[...getScopes()].sort((a, b) => a.sort - b.sort)}
          categories={getCategories()}
          badges={getBadges()}
          onMoveScope={noop}
          onMoveCategory={noop}
          onEditCategory={noop}
          onRemoveCategory={noop}
          onCreateCategory={noop}
        />
      </App>,
    );
    const scopeStart = html.indexOf('incentive-badge-taxonomy-scope');
    const scopeHeader = html.slice(scopeStart, html.indexOf('incentive-badge-taxonomy-category-list', scopeStart));
    expect(scopeHeader).toContain('上移公司表彰');
    expect(scopeHeader).toContain('下移公司表彰');
    expect(scopeHeader).not.toContain('编辑');
    expect(scopeHeader).not.toContain('删除');
    expect(html).toContain('新增分类');
    expect(html).toContain('>编辑<');
    expect(html).toContain('>删除<');
  });
});
