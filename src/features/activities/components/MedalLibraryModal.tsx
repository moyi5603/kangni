import { useEffect, useState } from 'react';
import { Button, Card, Col, Empty, Flex, Modal, Row, Tag, theme, Typography } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { Medal } from '../model/medalLibrary';

export function MedalLibraryModal({
  open,
  medals,
  value,
  disabled,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  medals: Medal[];
  value?: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: (medalId: string) => void;
}) {
  const { token } = theme.useToken();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const confirm = () => {
    if (!draft) return;
    onConfirm(draft);
  };

  return (
    <Modal
      title="从勋章库选择"
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      width={b2bStandards.form.modalWidth}
      styles={{ body: { maxHeight: 480, overflowY: 'auto' } }}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" disabled={disabled || !draft} onClick={confirm}>
            确认
          </Button>
        </Flex>
      }
    >
      {medals.length === 0 ? (
        <Empty description="暂无勋章" />
      ) : (
        <Row gutter={[16, 16]}>
          {medals.map((item) => {
            const selected = draft === item.id;
            return (
              <Col key={item.id} xs={12} sm={8}>
                <Card
                  size="small"
                  hoverable={!disabled}
                  onClick={() => {
                    if (!disabled) setDraft(item.id);
                  }}
                  styles={{
                    body: { textAlign: 'center', padding: token.paddingSM },
                  }}
                  style={{
                    borderColor: selected ? token.colorPrimary : undefined,
                    boxShadow: selected ? `0 0 0 1px ${token.colorPrimary}` : undefined,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Flex vertical align="center" gap={8}>
                    <img src={item.imageUrl} alt="" width={56} height={56} />
                    <Typography.Text ellipsis={{ tooltip: item.name }}>{item.name}</Typography.Text>
                    <Tag>{item.scope}</Tag>
                  </Flex>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Modal>
  );
}
