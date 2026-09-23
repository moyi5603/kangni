import { App, Button, Flex, Input, Modal, Typography } from 'antd';

type LinkBodyProps = {
  title: string;
  url: string;
  onCopy: () => void;
};

export function ForumLinkBody({ title, url, onCopy }: LinkBodyProps) {
  return (
    <Flex vertical gap={12}>
      <Typography.Text>{title}</Typography.Text>
      <Typography.Text type="secondary">员工打开该链接即可进入对应页面，可直接复制。</Typography.Text>
      <Input value={url} readOnly aria-label="C端链接" />
      <Button type="primary" onClick={onCopy}>
        复制链接
      </Button>
    </Flex>
  );
}

type Props = {
  title: string;
  url: string;
  open: boolean;
  onClose: () => void;
};

export function ForumLinkModal({ title, url, open, onClose }: Props) {
  const { message } = App.useApp();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      message.success('链接已复制');
    } catch {
      message.error('复制失败，请手动复制链接');
    }
  };

  return (
    <Modal title="查看链接" open={open} onCancel={onClose} footer={<Button onClick={onClose}>关闭</Button>} destroyOnHidden>
      <ForumLinkBody title={title} url={url} onCopy={() => void copyLink()} />
    </Modal>
  );
}
