import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { activityAdminSelf } from '../model/activityCommentReply';
import { AdminReplyAccountSelect, AdminReplyFormItems } from './AdminReplyAccountSelect';

function FieldsHarness() {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="horizontal" className="edit-form" initialValues={{ author: '陈产品', content: '' }}>
      <AdminReplyFormItems />
    </Form>
  );
}

describe('AdminReplyFormItems', () => {
  it('puts reply account with avatar above content', () => {
    const html = renderToStaticMarkup(
      <App>
        <FieldsHarness />
      </App>,
    );
    const account = html.indexOf('回复账号');
    const content = html.indexOf('回复内容');
    expect(account).toBeGreaterThan(-1);
    expect(content).toBeGreaterThan(account);
    expect(html).toContain('陈产品（个人账号）');
    expect(html).toContain('ant-avatar');
    expect(html).toContain('品');
  });
});

describe('AdminReplyAccountSelect', () => {
  it('shows avatar beside the selected personal account', () => {
    const html = renderToStaticMarkup(
      <App>
        <AdminReplyAccountSelect value={activityAdminSelf} />
      </App>,
    );
    expect(html).toContain('ant-avatar');
    expect(html).toContain('陈产品（个人账号）');
  });
});
