import type { ReactNode } from 'react';
import { Avatar, Form, Input, Select, Space } from 'antd';
import type { SelectProps } from 'antd';
import { activityCommentReplyAccountOptions } from '../model/activityCommentReply';
import { employeeAvatarColor, employeeAvatarLetter } from '../model/employeeAvatar';

function AccountOption({ name, label }: { name: string; label: ReactNode }) {
  return (
    <Space size={8}>
      <Avatar size={20} style={{ background: employeeAvatarColor(name) }}>
        {employeeAvatarLetter(name)}
      </Avatar>
      {label}
    </Space>
  );
}

export function AdminReplyAccountSelect(props: SelectProps) {
  const { options = activityCommentReplyAccountOptions(), ...rest } = props;
  return (
    <Select
      {...rest}
      options={options}
      optionRender={(option) => <AccountOption name={String(option.value)} label={option.label} />}
      labelRender={(item) => <AccountOption name={String(item.value)} label={item.label} />}
    />
  );
}

export function AdminReplyFormItems() {
  return (
    <>
      <Form.Item name="author" label="回复账号" rules={[{ required: true, message: '请选择回复账号' }]}>
        <AdminReplyAccountSelect />
      </Form.Item>
      <Form.Item name="content" label="回复内容" rules={[{ required: true, whitespace: true, message: '请输入回复内容' }]}>
        <Input.TextArea rows={4} maxLength={500} showCount placeholder="请输入回复内容" />
      </Form.Item>
    </>
  );
}
