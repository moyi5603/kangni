import { useRef } from 'react';
import { App, Button, Flex, Input, Modal, QRCode, Space, Typography } from 'antd';
import { downloadQrFromRoot, currentVoteShareUrl, voteShareQrFileName } from '../model/voteShare';
import type { VoteCampaign } from '../model/voting';

type Props = {
  record: VoteCampaign;
  open: boolean;
  onClose: () => void;
};

export function VoteShareModal({ record, open, onClose }: Props) {
  const { message } = App.useApp();
  const qrRef = useRef<HTMLDivElement>(null);
  const url = currentVoteShareUrl(record.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      message.success('链接已复制');
    } catch {
      message.error('复制失败，请手动复制链接');
    }
  };

  const downloadQr = () => {
    const ok = downloadQrFromRoot(qrRef.current, voteShareQrFileName(record.name));
    if (ok) message.success('二维码已下载');
    else message.error('二维码下载失败，请稍后重试');
  };

  return (
    <Modal
      title={`分享「${record.name}」`}
      open={open}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>关闭</Button>
      }
      destroyOnHidden
    >
      <Flex vertical align="center" gap={16}>
        <div ref={qrRef}>
          <QRCode value={url} size={180} bgColor="#ffffff" />
        </div>
        <Typography.Text type="secondary">员工扫码或打开链接即可进入投票</Typography.Text>
        <Flex vertical gap={8} style={{ width: '100%' }}>
          <Typography.Text>链接</Typography.Text>
          <Input value={url} readOnly aria-label="分享链接" />
        </Flex>
        <Space>
          <Button type="primary" onClick={() => void copyLink()}>
            复制链接
          </Button>
          <Button onClick={downloadQr}>下载二维码</Button>
        </Space>
      </Flex>
    </Modal>
  );
}
