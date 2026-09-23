import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TableRowActions } from './TableRowActions';

describe('TableRowActions', () => {
  it('fills the action cell so the first action stays on the same edge', () => {
    const html = renderToStaticMarkup(
      <TableRowActions
        moreAriaLabel="更多操作 示例"
        actions={[
          { key: 'detail', label: '详情', ariaLabel: '详情 示例', onClick: () => undefined },
          { key: 'delete', label: '删除', ariaLabel: '删除 示例', danger: true, onClick: () => undefined },
        ]}
      />,
    );
    expect(html).toContain('table-row-actions');
  });
});
