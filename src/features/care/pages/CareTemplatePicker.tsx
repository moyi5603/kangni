import { useState } from 'react';
import { CheckCircleFilled, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Modal, Typography, theme } from 'antd';
import type { CareTemplate } from '../model/care';
import { cardBlessingPlain } from '../model/care';

export function CareTemplatePicker({
  value,
  onChange,
  templates,
}: {
  value?: string[];
  onChange?: (keys: string[]) => void;
  templates: CareTemplate[];
}) {
  const { token } = theme.useToken();
  const selectedIds = value ?? [];
  const selected = templates.filter((item) => selectedIds.includes(item.id));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const openPicker = () => {
    setDraft(selectedIds);
    setOpen(true);
  };

  const toggle = (id: string) => {
    setDraft((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const remove = (id: string) => {
    onChange?.(selectedIds.filter((item) => item !== id));
  };

  return (
    <>
      <Flex wrap="wrap" gap={12}>
        {selected.map((item) => (
          <Card
            key={item.id}
            hoverable
            size="small"
            style={{ width: 168, cursor: 'pointer' }}
            styles={{ body: { padding: 12 } }}
            onClick={openPicker}
          >
            <Flex justify="space-between" align="flex-start" gap={8}>
              <Typography.Text strong ellipsis={{ tooltip: item.name }} style={{ flex: 1 }} title={item.name}>
                {item.name}
              </Typography.Text>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                aria-label={`移除关怀模板 ${item.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(item.id);
                }}
              />
            </Flex>
            <img
              src={item.coverImage}
              alt={`${item.name}贺卡`}
              width={144}
              height={256}
              style={{ width: '100%', aspectRatio: '9 / 16', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: 6, marginTop: 8 }}
            />
          </Card>
        ))}
        <button
          type="button"
          className="care-template-add-card"
          onClick={openPicker}
          aria-label="选择关怀模板"
          style={{
            width: 168,
            minHeight: 220,
            border: `1px dashed ${token.colorBorder}`,
            borderRadius: token.borderRadiusLG,
            background: token.colorFillAlter,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: token.colorTextSecondary,
          }}
        >
          <PlusOutlined />
          <span>选择模板</span>
        </button>
      </Flex>
      <Modal
        title="选择关怀模板"
        open={open}
        onCancel={() => setOpen(false)}
        width={760}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              onChange?.(draft);
              setOpen(false);
            }}
          >
            确定
          </Button>,
        ]}
      >
        {templates.length ? (
          <Flex wrap="wrap" gap={16}>
            {templates.map((item) => {
              const checked = draft.includes(item.id);
              return (
                <Card
                  key={item.id}
                  hoverable
                  size="small"
                  role="button"
                  tabIndex={0}
                  aria-pressed={checked}
                  aria-label={`${checked ? '取消选择' : '选择'}关怀模板 ${item.name}`}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggle(item.id);
                    }
                  }}
                  style={{
                    width: 168,
                    cursor: 'pointer',
                    outline: checked ? `2px solid ${token.colorPrimary}` : undefined,
                    position: 'relative',
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  {checked ? (
                    <CheckCircleFilled
                      style={{ position: 'absolute', top: 10, right: 10, color: token.colorPrimary, fontSize: 18, zIndex: 1 }}
                    />
                  ) : null}
                  <Typography.Text strong ellipsis={{ tooltip: item.name }} style={{ display: 'block', paddingRight: 22 }} title={item.name}>
                    {item.name}
                  </Typography.Text>
                  <img
                    src={item.coverImage}
                    alt=""
                    width={144}
                    height={256}
                    style={{ width: '100%', aspectRatio: '9 / 16', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: 6, marginTop: 8 }}
                  />
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 0, minHeight: 44 }}>
                    {cardBlessingPlain(item.blessing)}
                  </Typography.Paragraph>
                </Card>
              );
            })}
          </Flex>
        ) : (
          <Empty description="当前关怀场景暂无匹配模板" />
        )}
      </Modal>
    </>
  );
}
