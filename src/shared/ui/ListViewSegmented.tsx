import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import type { ListViewMode } from './listViewMode';

export function ListViewSegmented({
  value,
  onChange,
}: {
  value: ListViewMode;
  onChange: (view: ListViewMode) => void;
}) {
  return (
    <Segmented
      aria-label="展示形式"
      value={value}
      options={[
        { value: 'list', icon: <UnorderedListOutlined />, label: '列表' },
        { value: 'card', icon: <AppstoreOutlined />, label: '卡片' },
      ]}
      onChange={(next) => onChange(next as ListViewMode)}
    />
  );
}
