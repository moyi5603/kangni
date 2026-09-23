import { Button, Form, Input } from 'antd';
import type { FormInstance } from 'antd';
import { activityAdminSelf } from '../model/activityCommentReply';
import { AdminReplyAccountSelect } from './AdminReplyAccountSelect';

export function MomentInlineReplyForm({
  form,
  onCancel,
  onOk,
  accountOptions,
}: {
  form: FormInstance<{ content: string; author: string }>;
  onCancel: () => void;
  onOk: () => void;
  accountOptions?: { value: string; label: string }[];
}) {
  return (
    <div className="moment-inline-reply">
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        validateTrigger="onBlur"
        initialValues={{ author: activityAdminSelf, content: '' }}
        onFinish={() => void onOk()}
      >
        <div className="moment-inline-reply-account">
          <span className="moment-inline-reply-account-label">回复账号</span>
          <Form.Item name="author" noStyle rules={[{ required: true, message: '请选择回复账号' }]}>
            <AdminReplyAccountSelect options={accountOptions} />
          </Form.Item>
        </div>
        <Form.Item name="content" rules={[{ required: true, whitespace: true, message: '请输入回复内容' }]}>
          <Input.TextArea rows={3} maxLength={500} placeholder="请输入回复内容" aria-label="回复内容" />
        </Form.Item>
      </Form>
      <div className="moment-inline-reply-actions">
        <Button htmlType="button" aria-label="取消回复" onClick={onCancel}>
          取消
        </Button>
        <Button type="primary" htmlType="button" aria-label="确认回复" onClick={() => form.submit()}>
          确认
        </Button>
      </div>
    </div>
  );
}
