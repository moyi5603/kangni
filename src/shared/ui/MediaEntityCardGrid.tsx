import { Button, Card, Col, Dropdown, Empty, Flex, Pagination, Row, Space, Tag, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { b2bStandards } from '../design-system/generated/b2b-standards.generated';
import type { TableRowAction } from './TableRowActions';
import './mediaEntityCard.css';

function toMenuItems(actions: TableRowAction[]): MenuProps['items'] {
  const items: NonNullable<MenuProps['items']> = [];
  actions.forEach((action, index) => {
    if (action.danger && (index === 0 || !actions[index - 1]?.danger)) {
      items.push({ type: 'divider' });
    }
    const label = <span aria-label={action.ariaLabel}>{action.label}</span>;
    items.push({
      key: action.key,
      disabled: action.disabled,
      danger: action.danger,
      label: action.tooltip ? <Tooltip title={action.tooltip}>{label}</Tooltip> : label,
      onClick: action.disabled ? undefined : () => action.onClick(),
    });
  });
  return items;
}

export type MediaEntityCardItem = {
  key: string | number;
  coverUrl: string;
  title: string;
  summary: string;
  statusLabel: string;
  statusColor?: string;
  extra?: ReactNode;
  actions: TableRowAction[];
  onOpen: () => void;
};

export function MediaEntityCardGrid({
  items,
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  gridClassName,
}: {
  items: MediaEntityCardItem[];
  emptyDescription: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  gridClassName?: string;
}) {
  const cards = b2bStandards.pagePatterns.cards;
  if (total === 0) {
    return <Empty description={emptyDescription} />;
  }
  return (
    <div className={['media-entity-card-grid', gridClassName].filter(Boolean).join(' ')}>
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.key} xs={24} md={12} xl={8}>
            <Card
              size="small"
              className="media-entity-card"
              cover={
                <button
                  type="button"
                  className="media-entity-card-cover"
                  aria-label={`详情 ${item.title}`}
                  onClick={item.onOpen}
                >
                  {item.coverUrl ? <img src={item.coverUrl} alt="" /> : null}
                </button>
              }
            >
              <Flex className="media-entity-card-title-row" justify="space-between" align="center" gap={8}>
                <Typography.Title level={4} title={item.title} style={{ cursor: 'pointer' }} onClick={item.onOpen}>
                  {item.title}
                </Typography.Title>
                <Tag color={item.statusColor}>{item.statusLabel}</Tag>
              </Flex>
              <Typography.Paragraph
                className="media-entity-card-summary"
                type="secondary"
                ellipsis={{ rows: cards.summaryMaxLines }}
                title={item.summary}
              >
                {item.summary}
              </Typography.Paragraph>
              <Flex className="media-entity-card-meta" justify="space-between" align="center" gap={8}>
                <Space size={4} wrap={false}>
                  {item.extra}
                </Space>
                <Dropdown trigger={['click']} menu={{ items: toMenuItems(item.actions) }}>
                  <Button type="link" size="small" aria-label={`更多操作 ${item.title}`}>
                    更多
                  </Button>
                </Dropdown>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>
      <Pagination
        className="media-entity-card-pagination"
        current={page}
        pageSize={pageSize}
        total={total}
        pageSizeOptions={[...b2bStandards.table.pageSizeOptions]}
        showSizeChanger={b2bStandards.table.showSizeChanger}
        showTotal={(count) => `共 ${count} 条`}
        onChange={onPageChange}
      />
    </div>
  );
}
