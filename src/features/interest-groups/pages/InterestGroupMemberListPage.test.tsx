import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupMemberListPage } from './InterestGroupMemberListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupMemberListPage', () => {
  it('lists members without admin delete or join-audit actions', () => {
    const html = renderPage(<InterestGroupMemberListPage groupId={1} />);
    expect(html).toContain('姓名');
    expect(html).not.toContain('手机号');
    expect(html).toContain('添加人员');
    expect(html).toContain('批量导入');
    expect(html).toContain('导出');
    expect(html).not.toContain('操作');
    expect(html).not.toContain('删除');
    expect(html).not.toContain('驳回');
    expect(html).not.toContain('批量通过');
    expect(html).not.toContain('批量删除');
    expect(html).not.toContain('待审核');
  });
});
