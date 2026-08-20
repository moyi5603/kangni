import { Breadcrumb, Card, Typography } from 'antd';

type PlaceholderPageProps = {
  breadcrumbItems: { title: string }[];
  title: string;
  applicationLabel: string;
};

export function PlaceholderPage({ breadcrumbItems, title, applicationLabel }: PlaceholderPageProps) {
  return (
    <div className="page-stack">
      <Breadcrumb separator=">" items={breadcrumbItems} />
      <Typography.Title level={1}>{title}</Typography.Title>
      <Card>
        <Typography.Text type="secondary">
          当前应用「{applicationLabel}」。本页先占位，后续再补列表与详情。
        </Typography.Text>
      </Card>
    </div>
  );
}
