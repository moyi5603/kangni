import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMedalStoreForTests } from '../model/medalStore';
import { MedalListPage } from './MedalListPage';

const noop = () => {};

describe('MedalListPage', () => {
  beforeEach(() => {
    __resetMedalStoreForTests();
  });

  it('renders heading, query fields, create action, columns and row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalListPage page="medal-list" onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('勋章管理');
    expect(html).toContain('维护勋章素材，供活动、打卡等业务选用');
    expect(html).toContain('创建勋章');
    expect(html).toContain('共 20 条');
    expect(html).toContain('勋章名称');
    expect(html).toContain('所属应用');
    expect(html).toContain('类型');
    expect(html).toContain('分类');
    expect(html).toContain('即时激励');
    expect(html).toContain('公司表彰');
    expect(html).toContain('勋章状态');
    expect(html).toContain('勋章图标');
    expect(html).toContain('勋章描述');
    expect(html).toContain('创建人');
    expect(html).toContain('创建时间');
    expect(html).toContain('明星员工');
    expect(html).toContain('评优活动');
    expect(html).toContain('编辑');
    expect(html).toContain('发放记录');
    expect(html).toContain('设为失效');
    expect(html).toContain('删除');
    expect(html).toContain('后续开放');
  });
});
