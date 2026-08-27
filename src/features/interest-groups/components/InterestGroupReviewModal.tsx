import { useEffect } from 'react';
import { App, Button, Form, Input, Modal, Space } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { canReviewInterestGroup, type InterestGroup } from '../model/interestGroup';
import { reviewInterestGroup } from '../model/interestGroupStore';

export function InterestGroupReviewModal({
  group,
  open,
  onClose,
}: {
  group?: InterestGroup;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ comment?: string }>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open]);

  const decide = async (pass: boolean) => {
    const comment = String((await form.validateFields()).comment ?? '').trim();
    if (!group || !canReviewInterestGroup(group)) {
      message.info('当前小组不可审核');
      return;
    }
    if (!reviewInterestGroup(group.id, pass, comment)) {
      message.info('当前小组不可审核，数据未改动');
      return;
    }
    message.success(pass ? `已通过「${group.name}」` : `已驳回「${group.name}」`);
    onClose();
  };

  return (
    <Modal
      title={group ? `审核「${group.name}」` : '审核小组'}
      open={open}
      onCancel={onClose}
      destroyOnHidden
      width={b2bStandards.form.modalWidth}
      footer={
        <Space>
          <Button type="primary" onClick={() => void decide(true)}>
            通过
          </Button>
          <Button onClick={() => void decide(false)}>驳回</Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      <Form form={form} layout="horizontal" className="edit-form" requiredMark={false} validateTrigger="onBlur">
        <Form.Item name="comment" label="意见" extra="选填。驳回时可填写驳回原因。">
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="选填，驳回时可填写原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
