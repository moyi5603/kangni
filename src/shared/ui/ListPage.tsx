import { Children, useState, type CSSProperties, type ReactNode } from 'react';
import { DownOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Flex, Space, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';

export function ListPageHeading({
  paths,
  title,
  subtitle,
  extra,
  titleExtra,
}: {
  paths: string[];
  title: string;
  subtitle: string;
  extra?: ReactNode;
  titleExtra?: ReactNode;
}) {
  return (
    <div className="list-page-heading">
      <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <div className={titleExtra ? 'list-page-heading-main is-with-title-extra' : 'list-page-heading-main'}>
          <Breadcrumb separator=">" items={paths.map((item) => ({ title: item }))} />
          <Flex align={titleExtra ? 'center' : 'baseline'} gap={16} wrap="wrap">
            <Typography.Title level={1}>{title}</Typography.Title>
            {titleExtra}
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          </Flex>
        </div>
        {extra}
      </Flex>
    </div>
  );
}

export function SearchField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="search-field">
      <Typography.Text className="search-field-label">{label}</Typography.Text>
      {children}
    </div>
  );
}

export function SearchPanel({
  children,
  onSearch,
  onReset,
  columns = 4,
  defaultExpanded = false,
}: {
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
  columns?: 2 | 4;
  defaultExpanded?: boolean;
}) {
  const fields = Children.toArray(children);
  const collapsible = fields.length > 3;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const visibleFields = collapsible && !expanded ? fields.slice(0, 3) : fields;
  const actionRows = {
    '--search-action-row-4': Math.floor(visibleFields.length / 4) + 1,
    '--search-action-row-2': Math.floor(visibleFields.length / 2) + 1,
    '--search-action-row-1': visibleFields.length + 1,
  } as CSSProperties;
  return (
    <Card className="search-card" variant="borderless">
      <div className={`search-fields${columns === 2 ? ' search-fields--2' : ''}`} style={actionRows}>
        {visibleFields}
        <div className="search-actions">
          <Space wrap={false}>
            <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              重置
            </Button>
            {collapsible ? (
              <Button
                aria-expanded={expanded}
                icon={expanded ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? '收起' : '展开'}
              </Button>
            ) : null}
          </Space>
        </div>
      </div>
    </Card>
  );
}

export function ListTableCard({
  tabs,
  activeTab,
  onTabChange,
  toolbar,
  batchToolbar,
  children,
}: {
  tabs?: TabsProps['items'];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  toolbar: ReactNode;
  batchToolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="list-table-card" variant="borderless">
      {tabs && activeTab !== undefined && onTabChange ? (
        <Tabs className="list-table-card-tabs" items={tabs} activeKey={activeTab} onChange={onTabChange} />
      ) : null}
      <div className="table-toolbar">{toolbar}</div>
      {batchToolbar}
      {children}
    </Card>
  );
}
