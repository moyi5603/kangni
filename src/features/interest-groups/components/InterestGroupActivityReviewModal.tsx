import { useEffect } from 'react';
import { App, Button, Form, Input, Modal, Space } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { canReviewInterestGroupActivity, type InterestGroupActivity } from '../model/interestGroupActivity';
import { reviewInterestGroupActivity } from '../model/interestGroupStore';

export function InterestGroupActivityReviewModal({
  activity,
  open,
  onClose,
}: {
  activity?: InterestGroupActivity;
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
    if (!activity || !canReviewInterestGroupActivity(activity)) {
      message.info('当前活动不可审核');
      return;
    }
    if (!reviewInterestGroupActivity(activity.id, pass, comment)) {
      message.info('当前活动不可审核，数据未改动');
      return;
    }
    message.success(pass ? `已通过「${activity.title}」` : `已驳回「${activity.title}」`);
    onClose();
  };

  return (
    <Modal
      title={activity ? `审核「${activity.title}」` : '审核活动'}
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
