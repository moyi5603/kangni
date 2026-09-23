import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MedalFormModal } from './MedalFormModal';
import { initialMedals } from '../model/medal';

describe('MedalFormModal', () => {
  it('renders create fields and cancel before save', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalFormModal open mode="create" onCancel={() => {}} onSaved={() => {}} />
      </App>,
    );
    expect(html).toContain('创建勋章');
    expect(html).toContain('勋章图片');
    expect(html).toContain('勋章名称');
    expect(html).toContain('所属应用');
    expect(html).toContain('勋章描述');
    expect(html).toContain('通用');
    expect(html).toContain('课发展');
    expect(html.indexOf('取消')).toBeLessThan(html.indexOf('保存'));
  });

  it('fills edit title from record', () => {
    const html = renderToStaticMarkup(
      <App>
        <MedalFormModal open mode="edit" record={initialMedals[0]} onCancel={() => {}} onSaved={() => {}} />
      </App>,
    );
    expect(html).toContain('编辑勋章');
    expect(html).toContain('明星员工');
    expect(html).not.toContain('>类型<');
  });

  it('shows 类型 and 分类 when editing an incentive medal', () => {
    const record = initialMedals.find((item) => item.app === '即时激励');
    const html = renderToStaticMarkup(
      <App>
        <MedalFormModal open mode="edit" record={record} onCancel={() => {}} onSaved={() => {}} />
      </App>,
    );
    expect(html).toContain('类型');
    expect(html).toContain('分类');
    expect(html).toContain('公司表彰');
    expect(html).toContain('同事认可');
  });
});
