import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OrgPeoplePickerPanel } from './OrgPeopleTreePicker';

describe('OrgPeoplePickerPanel', () => {
  it('shows org root departments with breadcrumb, search and selected footer', () => {
    const html = renderToStaticMarkup(<OrgPeoplePickerPanel value={['林浅']} onChange={() => undefined} onDone={() => undefined} />);
    expect(html).toContain('搜索姓名');
    expect(html).toContain('c-ig-orgpick-crumb');
    expect(html).toContain('研发中心');
    expect(html).toContain('生产中心');
    expect(html).toContain('营销中心');
    expect(html).toContain('职能中心');
    expect(html).toContain('c-ig-orgpick-dept');
    expect(html).not.toContain('c-ig-lead-option');
    expect(html).toContain('已选 1 人');
    expect(html).toContain('林浅');
    expect(html).toContain('清空');
    expect(html).toContain('完成');
  });

  it('shows an empty hint when nothing is selected', () => {
    const html = renderToStaticMarkup(<OrgPeoplePickerPanel value={[]} onChange={() => undefined} />);
    expect(html).toContain('已选 0 人');
  });
});
