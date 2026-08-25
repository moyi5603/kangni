import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Empty, Space, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { AwardCertificateFormModal } from '../components/AwardCertificateFormModal';
import type { AwardCertificateRecord } from '../model/awardCertificate';
import { removeAwardCertificate, useAwardCertificates } from '../model/awardCertificateStore';
import { awardNamesUsingCertificate } from '../model/awardStore';

function modalFooter(_: unknown, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function AwardCertificateListPage() {
  const { message, modal } = App.useApp();
  const certificates = useAwardCertificates();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const linkedNames = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const item of certificates) {
      map.set(item.id, awardNamesUsingCertificate(item.id));
    }
    return map;
  }, [certificates]);

  const openCreate = () => {
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (record: AwardCertificateRecord) => {
    setEditingId(record.id);
    setOpen(true);
  };

  const deleteOne = (record: AwardCertificateRecord) => {
    const linked = linkedNames.get(record.id) ?? [];
    modal.confirm({
      title: `确认删除证书「${record.name}」？`,
      content: linked.length ? `该证书已被评优「${linked.join('、')}」关联，删除后关联将失效。` : '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeAwardCertificate(record.id);
        message.success('已删除证书');
      },
    });
  };

  const columns: TableColumnsType<AwardCertificateRecord> = [
    {
      title: '证书封面',
      dataIndex: 'imageUrl',
      width: 120,
      render: (url: string, record) => <img src={url} alt={record.name} width={96} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} />,
    },
    { title: '证书名称', dataIndex: 'name', width: 180, ellipsis: true },
    {
      title: '证书描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (value: string) => value || '-',
    },
    {
      title: '关联评优',
      key: 'linked',
      width: 220,
      render: (_, record) => {
        const names = linkedNames.get(record.id);
        return names?.length ? names.join('、') : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger aria-label={`删除 ${record.name}`} onClick={() => deleteOne(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['评优', '评优证书']} title="评优证书" subtitle="维护评优名次可颁发的电子证书模板。" />
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建证书
          </Button>
        }
      >
        {certificates.length ? (
          <Table rowKey="id" columns={columns} dataSource={certificates} pagination={false} />
        ) : (
          <Empty description={b2bStandards.table.emptyText} />
        )}
      </ListTableCard>
      <AwardCertificateFormModal
        open={open}
        editingId={editingId}
        onCancel={() => setOpen(false)}
        onSaved={() => setOpen(false)}
      />
    </div>
  );
}
