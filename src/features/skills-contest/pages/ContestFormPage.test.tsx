import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetContestStoreForTests } from '../model/contestStore';
import { ContestFormPage } from './ContestFormPage';

const noop = () => {};

describe('ContestFormPage', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
  });

  it('renders contest fields, stages, signup region and page access', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建赛事');
    expect(html).toContain('大赛名称');
    expect(html).toContain('举办时间');
    expect(html).toContain('阶段一');
    expect(html).toContain('报名信息收集');
    expect(html).toContain('所属区域');
    expect(html).toContain('关联 H5 页面');
    expect(html).toContain('仅租户成员');
  });

  it('loads seed contest for edit', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestFormPage mode="edit" recordId="1" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('编辑赛事');
    expect(html).toContain('2026 技能公开赛');
    expect(html).toContain('初赛');
    expect(html).toContain('复赛');
  });
});
