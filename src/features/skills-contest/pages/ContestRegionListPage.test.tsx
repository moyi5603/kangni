import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetRegionStoreForTests } from '../model/regionStore';
import { ContestRegionListPage } from './ContestRegionListPage';

describe('ContestRegionListPage', () => {
  beforeEach(() => {
    __resetRegionStoreForTests();
  });

  it('lists regions and create entry', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestRegionListPage />
      </App>,
    );
    expect(html).toContain('区域配置');
    expect(html).toContain('江苏省');
    expect(html).toContain('南京市');
    expect(html).toContain('鼓楼区');
    expect(html).toContain('新建区域');
    expect(html).toContain('添加下级');
  });
});
