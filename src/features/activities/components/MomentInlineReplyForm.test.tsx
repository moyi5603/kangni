import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MomentInlineReplyForm } from './MomentInlineReplyForm';

function Harness() {
  const [form] = Form.useForm();
  return <MomentInlineReplyForm form={form} onCancel={() => undefined} onOk={() => undefined} />;
}

describe('MomentInlineReplyForm', () => {
  it('renders account select with personal suffix, content box, and cancel then confirm', () => {
    const html = renderToStaticMarkup(
      <App>
        <Harness />
      </App>,
    );
    expect(html).toContain('回复账号');
    expect(html).toContain('moment-inline-reply-account');
    expect(html).toContain('moment-inline-reply-account-label');
    expect(html.indexOf('moment-inline-reply-account-label')).toBeLessThan(html.indexOf('ant-select'));
    expect(html).toContain('陈产品（个人账号）');
    expect(html).toContain('请输入回复内容');
    expect(html).toContain('moment-inline-reply');
    expect(html).toContain('aria-label="回复内容"');
    expect(html).toContain('aria-label="取消回复"');
    expect(html).toContain('aria-label="确认回复"');
    expect(html.indexOf('aria-label="确认回复"')).toBeGreaterThan(html.indexOf('aria-label="取消回复"'));
    expect(html).toContain('ant-btn-primary');
  });
});
