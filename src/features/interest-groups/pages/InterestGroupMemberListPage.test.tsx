import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupMemberListPage } from './InterestGroupMemberListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupMemberListPage', () => {
  it('renders signup-style member columns and add action', () => {
    const html = renderPage(<InterestGroupMemberListPage groupId={1} />);
    expect(html).toContain('姓名');
    expect(html).toContain('手机号');
    expect(html).toContain('添加人员');
    expect(html).toContain('批量导入');
    expect(html).toContain('导出');
    expect(html).toContain('通过');
    expect(html).toContain('驳回');
    expect(html).toContain('删除');
    expect(html).toContain('已通过');
  });

  it('shows pending status only for approve-join groups', () => {
    const html = renderPage(<InterestGroupMemberListPage groupId={2} />);
    expect(html).toContain('待审核');
  });
});
