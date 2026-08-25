import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShareContactsPanel } from './ShareContactsPanel';

describe('Share contacts panel', () => {
  it('opens a WeCom-style picker without the current user', () => {
    const html = renderToStaticMarkup(<ShareContactsPanel open surface="h5" />);
    expect(html).toContain('选择联系人');
    expect(html).toContain('张悦');
    expect(html).toContain('前端组');
    expect(html).not.toContain('陈产品');
    expect(html).toContain('搜索姓名或部门');
    expect(html).toContain('disabled=""');
    expect(html).toContain('确定');
  });
});
