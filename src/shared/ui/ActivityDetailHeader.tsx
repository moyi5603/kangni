import type { ReactNode } from 'react';
import { Card, Flex, Image, Space, Tag, Typography } from 'antd';

export type ActivityDetailHeaderTag = {
  text: string;
  color?: string;
};

export type ActivityDetailHeaderFact = {
  label: string;
  value: string;
};

export function ActivityDetailHeader({
  coverUrl,
  coverAlt,
  tags,
  title,
  actions,
  facts,
  metrics,
}: {
  coverUrl?: string;
  coverAlt: string;
  tags: ActivityDetailHeaderTag[];
  title: string;
  actions: ReactNode;
  facts: ActivityDetailHeaderFact[];
  metrics: ReactNode;
}) {
  return (
    <Card className="activity-detail-header-card activity-activity-header">
      <Flex align="flex-start" gap={16} className="activity-detail-header-main" wrap>
        <div className="activity-detail-cover-wrap">
          {coverUrl ? (
            <Image src={coverUrl} alt={coverAlt} className="activity-detail-cover" />
          ) : (
            <div className="activity-detail-cover-placeholder is-wide">暂无封面</div>
          )}
        </div>
        <div className="activity-detail-header-copy">
          {tags.length ? (
            <Space wrap size={[8, 8]}>
              {tags.map((tag) => (
                <Tag key={tag.text} color={tag.color}>
                  {tag.text}
                </Tag>
              ))}
            </Space>
          ) : null}
          <Flex
            className="activity-detail-title-row"
            justify="space-between"
            align="flex-start"
            gap={16}
            wrap
            style={{ marginTop: tags.length ? 8 : 0 }}
          >
            <div className="activity-detail-title-block">
              <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 0 }}>
                {title}
              </Typography.Title>
            </div>
            {actions ? <Space wrap className="activity-detail-header-actions">{actions}</Space> : null}
          </Flex>
          {facts.map((fact, index) => (
            <Typography.Text
              key={fact.label}
              type="secondary"
              style={{ display: 'block', marginTop: index === 0 ? 8 : 4 }}
            >
              {fact.label}：{fact.value}
            </Typography.Text>
          ))}
          {metrics ? <div className="activity-detail-header-metrics">{metrics}</div> : null}
        </div>
      </Flex>
    </Card>
  );
}
