import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Tabs, Typography } from 'antd';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { CARE_CATEGORIES, cardBlessingPlain, categoryOf, templateInUse, type CareCategory, type CareTemplate } from '../model/care';
import { removeTemplate, useRules, useTemplates } from '../model/careStore';

export function CareTemplateListPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { message, modal } = App.useApp();
  const templates = useTemplates();
  const rules = useRules();

  const renderGrid = (category: CareCategory) => {
    const items = templates.filter((item) => categoryOf(item.type) === category);
    if (!items.length) return <Empty description="暂无关怀模板" />;
    return (
      <Flex wrap="wrap" gap={16}>
        {items.map((item) => (
          <TemplateCard
            key={item.id}
            item={item}
            used={templateInUse(rules, item.id)?.name}
            onOpen={() => onNavigate('care-template-detail', item.id)}
            onEdit={() => onNavigate('care-template-edit', item.id)}
            onDelete={() => {
              const usedBy = templateInUse(rules, item.id);
              if (usedBy) {
                message.warning(`该模板正被「${usedBy.name}」使用，请先从规则中移除`);
                return;
              }
              modal.confirm({
                title: `确认删除关怀模板「${item.name}」？`,
                content: '删除后不可恢复。',
                okText: '确认删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: () => {
                  removeTemplate(item.id);
                  message.success('关怀模板已删除');
                },
              });
            }}
          />
        ))}
      </Flex>
    );
  };

  return (
    <div className="page-stack">
      <ListPageHeading paths={['员工关怀', '关怀模板']} title="关怀模板" subtitle="统一配置祝福消息推送与贺卡内容。" />
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>共 {templates.length} 个模板</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('care-template-create')}>
              新建模板
            </Button>
          </Flex>
        }
      >
        <Tabs items={CARE_CATEGORIES.map((item) => ({ key: item, label: item, children: renderGrid(item) }))} />
      </ListTableCard>
    </div>
  );
}

function TemplateCard({
  item,
  used,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: CareTemplate;
  used?: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card hoverable style={{ width: 280 }} styles={{ body: { padding: 12 } }}>
      <button type="button" onClick={onOpen} aria-label={`查看关怀模板 ${item.name}`} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
        <Typography.Title level={5} ellipsis style={{ marginTop: 0 }}>
          {item.name}
        </Typography.Title>
        <img src={item.employeeCover} alt={`${item.name}消息封面`} width={256} height={109} style={{ width: '100%', aspectRatio: '1068 / 455', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: 6 }} />
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8, minHeight: 44 }}>
          {cardBlessingPlain(item.blessing)}
        </Typography.Paragraph>
        <Typography.Text type="secondary">{used ? `已关联规则「${used}」` : '暂未关联规则'}</Typography.Text>
      </button>
      <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
        <Button type="link" onClick={onEdit} aria-label={`编辑关怀模板 ${item.name}`}>
          编辑
        </Button>
        <Button type="link" danger onClick={onDelete} aria-label={`删除模板 ${item.name}`}>
          删除
        </Button>
      </Flex>
    </Card>
  );
}
