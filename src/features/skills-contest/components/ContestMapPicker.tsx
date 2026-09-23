import { useState } from 'react';
import { Button, Modal, Space } from 'antd';
import { CONTEST_MAPS, contestMapOf, type ContestMapId } from '../model/contest';

export function ContestMapThumb({
  mapId,
  width = 152,
  height = 96,
  showHint = true,
}: {
  mapId: ContestMapId;
  width?: number;
  height?: number;
  showHint?: boolean;
}) {
  const map = contestMapOf(mapId);
  const [open, setOpen] = useState(false);
  if (!map) return null;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', lineHeight: 0 }}
      >
        <img
          src={map.imageUrl}
          alt={`${map.label}地图`}
          width={width}
          height={height}
          style={{ objectFit: 'cover', borderRadius: 8, display: 'block', background: '#e8f1fb' }}
        />
      </button>
      {showHint ? (
        <Button type="link" size="small" htmlType="button" onClick={() => setOpen(true)} style={{ padding: 0, height: 'auto' }}>
          查看大图
        </Button>
      ) : null}
      <Modal title={map.label} open={open} footer={null} onCancel={() => setOpen(false)} width={760} destroyOnHidden>
        <img src={map.imageUrl} alt={`${map.label}地图`} style={{ display: 'block', width: '100%', borderRadius: 8 }} />
      </Modal>
    </span>
  );
}

export function ContestMapPicker({ value, onChange }: { value?: ContestMapId; onChange?: (value: ContestMapId) => void }) {
  return (
    <Space align="start" wrap size={16}>
      {CONTEST_MAPS.map((item) => {
        const selected = value === item.id;
        return (
          <div
            key={item.id}
            style={{
              width: 168,
              padding: 8,
              border: `1px solid ${selected ? '#1677ff' : '#d9d9d9'}`,
              borderRadius: 8,
              background: selected ? '#f0f7ff' : '#fff',
            }}
          >
            <ContestMapThumb mapId={item.id} />
            <div style={{ margin: '8px 0 6px', fontWeight: 600 }}>{item.label}</div>
            <Button type={selected ? 'primary' : 'default'} htmlType="button" block onClick={() => onChange?.(item.id)}>
              {selected ? '已选择' : '选择'}
            </Button>
          </div>
        );
      })}
    </Space>
  );
}
