import { useEffect, useState, type ReactNode } from 'react';
import { Form, Input, Modal } from 'antd';
import { b2bStandards } from '../design-system/generated/b2b-standards.generated';

export const REJECT_REASON_MAX = 200;

export type RejectReasonPromptOptions = {
  title: string;
  description?: ReactNode;
  okText?: string;
  onConfirm: (reason: string) => void | Promise<void>;
};

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <>
      <extra.OkBtn />
      <extra.CancelBtn />
    </>
  );
}

/** Prompt reject with optional reason field (选填). */
export function useRejectReasonPrompt() {
  const [options, setOptions] = useState<RejectReasonPromptOptions | null>(null);
  const [form] = Form.useForm<{ reason?: string }>();

  useEffect(() => {
    if (options) form.resetFields();
  }, [form, options]);

  const promptReject = (next: RejectReasonPromptOptions) => {
    setOptions(next);
  };

  const close = () => setOptions(null);

  const rejectReasonModal = (
    <Modal
      title={options?.title}
      open={Boolean(options)}
      onCancel={close}
      okText={options?.okText ?? '确认驳回'}
      cancelText="取消"
      footer={modalFooter}
      width={b2bStandards.form.modalWidth}
      destroyOnHidden
      onOk={async () => {
        if (!options) return;
        const values = await form.validateFields();
        await options.onConfirm(String(values.reason ?? '').trim());
        close();
      }}
    >
      {options?.description ? <div style={{ marginBottom: 12 }}>{options.description}</div> : null}
      <Form form={form} layout="horizontal" className="edit-form" requiredMark={false} validateTrigger="onBlur">
        <Form.Item
          name="reason"
          label="驳回原因"
          extra="选填"
          rules={[{ max: REJECT_REASON_MAX, message: `驳回原因不能超过 ${REJECT_REASON_MAX} 字` }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={REJECT_REASON_MAX}
            showCount
            placeholder="选填，填写后相关人员可见"
          />
        </Form.Item>
      </Form>
    </Modal>
  );

  return { promptReject, rejectReasonModal };
}
