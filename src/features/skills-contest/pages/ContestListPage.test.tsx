import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetContestStoreForTests } from '../model/contestStore';
import { __resetRegionStoreForTests } from '../model/regionStore';
import { ContestListPage } from './ContestListPage';

describe('ContestListPage', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
    __resetRegionStoreForTests();
  });

  it('lists contests with derived status and create action', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestListPage onNavigate={() => {}} />
      </App>,
    );
    expect(html).toContain('赛事管理');
    expect(html).toContain('新建赛事');
    expect(html).toContain('2026 技能公开赛');
    expect(html).toContain('仅租户成员');
    expect(html).toContain('进行中');
    expect(html).toContain('秋季班组长挑战赛');
  });
});
