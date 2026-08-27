import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { b2bStandards } from '../design-system/generated/b2b-standards.generated';

export type TableRowAction = {
  key: string;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  tooltip?: string;
};

export function TableRowActions({ actions, moreAriaLabel }: { actions: TableRowAction[]; moreAriaLabel: string }) {
  const max = b2bStandards.table.actionsMaxVisible;
  const visible = actions.slice(0, max);
  const overflow = actions.slice(max);

  const overflowItems: MenuProps['items'] = [];
  overflow.forEach((action, index) => {
    if (action.danger && (index === 0 || !overflow[index - 1]?.danger)) {
      overflowItems.push({ type: 'divider' });
    }
    overflowItems.push({
      key: action.key,
      label: action.label,
      danger: action.danger,
      disabled: action.disabled,
      onClick: action.disabled ? undefined : action.onClick,
    });
  });

  return (
    <Space wrap={false}>
      {visible.map((action) => {
        const button = (
          <Button
            key={action.key}
            type="link"
            danger={action.danger}
            disabled={action.disabled}
            aria-label={action.ariaLabel}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        );
        return action.tooltip ? (
          <Tooltip key={action.key} title={action.tooltip}>
            <span>{button}</span>
          </Tooltip>
        ) : (
          button
        );
      })}
      {overflow.length ? (
        <Dropdown trigger={['click']} menu={{ items: overflowItems }}>
          <Button type="link" aria-label={moreAriaLabel}>
            更多 <DownOutlined />
          </Button>
        </Dropdown>
      ) : null}
    </Space>
  );
}
