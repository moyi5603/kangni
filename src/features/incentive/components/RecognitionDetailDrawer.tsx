import { useState } from 'react';
import { App, Button, Drawer, Flex, Form, Input, Modal } from 'antd';
import { canOperatePendingReview, type IncentiveSettings, type Recognition, type RecognitionStatus } from '../model/incentive';
import { approveRecognition, rejectRecognition } from '../model/incentiveStore';
import { RecognitionFields } from '../pages/IncentiveRecordListPage';

const DRAWER_WIDTH = 680;

export function RecognitionDetailFooter({
  showPendingReview,
  onClose,
  onReject,
  onApprove,
}: {
  showPendingReview: boolean;
  onClose: () => void;
  onReject: () => void;
  onApprove: () => void;
}) {
  return (
    <Flex justify="flex-end" gap={8}>
      <Button onClick={onClose}>关闭</Button>
      {showPendingReview ? (
        <>
          <Button danger onClick={onReject}>
            驳回
          </Button>
          <Button type="primary" onClick={onApprove}>
            通过并发放
          </Button>
        </>
      ) : null}
    </Flex>
  );
}

export function RecognitionDetailDrawer({
  record,
  displayed,
  open,
  canReview,
  settings,
  onClose,
  onOpenRelated,
}: {
  record: Recognition | null;
  displayed: RecognitionStatus | null;
  open: boolean;
  canReview: boolean;
  settings: IncentiveSettings;
  onClose: () => void;
  onOpenRelated: (id: string) => void;
}) {
  const { message, modal } = App.useApp();
  const [reviewComment, setReviewComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const shown = displayed ?? record?.status ?? '已发放';
  const showPendingReview = Boolean(record && canOperatePendingReview(shown, canReview));

  const closeAll = () => {
    setRejectOpen(false);
    setReviewComment('');
    onClose();
  };

  const submitReject = () => {
    if (!record) return;
    if (!reviewComment.trim()) {
      message.warning('驳回须填写审核意见');
      return;
    }
    rejectRecognition(record.id, reviewComment);
    message.success('已驳回');
    closeAll();
  };

  const confirmApprove = () => {
    if (!record) return;
    modal.confirm({
      title: '确认通过并发放？',
      content: `将向 ${record.receiver} 发放「${record.badgeName}」及 ${record.points} 积分。`,
      okText: '通过并发放',
      cancelText: '取消',
      onOk: () => {
        approveRecognition(record.id);
        message.success('已通过并发放');
        closeAll();
      },
    });
  };

  return (
    <>
      <Drawer
        title="认可详情"
        open={open}
        onClose={closeAll}
        width={DRAWER_WIDTH}
        destroyOnHidden
        footer={
          <RecognitionDetailFooter
            showPendingReview={showPendingReview}
            onClose={closeAll}
            onReject={() => {
              setReviewComment('');
              setRejectOpen(true);
            }}
            onApprove={confirmApprove}
          />
        }
      >
        {record ? (
          <RecognitionFields
            record={record}
            displayed={shown}
            personalReviewEnabled={settings.personalReviewEnabled}
            rules={settings.rules}
            onOpenRelated={onOpenRelated}
          />
        ) : null}
      </Drawer>
      <Modal
        title="驳回认可"
        open={rejectOpen}
        onCancel={() => {
          setRejectOpen(false);
          setReviewComment('');
        }}
        onOk={submitReject}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <Form layout="horizontal" className="edit-form" labelCol={{ flex: '0 0 112px' }} wrapperCol={{ flex: 1 }}>
          <Form.Item label="审核意见" required extra="须说明驳回原因，将写入处理记录">
            <Input.TextArea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请填写驳回原因"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
