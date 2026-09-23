import { useMemo, useState } from 'react';
import { PlusOutlined, SendOutlined } from '@ant-design/icons';
import { App, Button, Empty, Flex, Form, Input, Modal, Radio, Select, Table, Tag, Upload } from 'antd';
import type { TableColumnsType } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { birthdayComplete, filterEmployees, hireComplete, type CareEmployee, type EmployeeQuery } from '../model/care';
import { updateEmployee, useEmployees } from '../model/careStore';

type Draft = EmployeeQuery;

const EMPTY: Draft = { name: '', info: 'all' };

export function CareInfoPage() {
  const { message, modal } = App.useApp();
  const rows = useEmployees();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [query, setQuery] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<CareEmployee | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [form] = Form.useForm<Pick<CareEmployee, 'solarBirthday' | 'lunarBirthday' | 'reminder' | 'hireDate' | 'partyJoinDate'>>();

  const filtered = useMemo(() => filterEmployees(rows, query), [rows, query]);
  const hasQuery = Boolean(query.name.trim() || query.info !== 'all');

  const columns: TableColumnsType<CareEmployee> = [
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '部门', dataIndex: 'department', width: 180 },
    {
      title: '阳历生日',
      dataIndex: 'solarBirthday',
      width: 140,
      render: (value: string) => value || <span style={{ color: b2bStandards.theme.token.colorError }}>待完善</span>,
    },
    { title: '阴历生日', dataIndex: 'lunarBirthday', width: 140, render: (value: string) => value || '—' },
    {
      title: '生日提醒',
      dataIndex: 'reminder',
      width: 120,
      render: (value: CareEmployee['reminder']) => <Tag color={value === '按阳历' ? 'blue' : 'purple'}>{value}</Tag>,
    },
    {
      title: '入职时间',
      dataIndex: 'hireDate',
      width: 140,
      render: (value: string) => value || <span style={{ color: b2bStandards.theme.token.colorError }}>待完善</span>,
    },
    { title: '入党时间', dataIndex: 'partyJoinDate', width: 140, render: (value: string) => value || '—' },
    {
      title: '操作',
      key: 'action',
      width: 88,
      fixed: 'right',
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`更多操作 ${record.name}`}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑员工 ${record.name}`,
              onClick: () => {
                setEditing(record);
                form.setFieldsValue(record);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['员工关怀', '信息管理']} title="信息管理" subtitle="维护员工生日、入职和入党信息。" />
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(EMPTY);
          setQuery(EMPTY);
        }}
      >
        <SearchField label="成员">
          <Input allowClear placeholder="请输入姓名" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </SearchField>
        <SearchField label="信息状态">
          <Select
            value={draft.info}
            onChange={(value) => setDraft((current) => ({ ...current, info: value }))}
            options={[
              { value: 'all', label: '全部' },
              { value: 'incompleteBirthday', label: '未完善生日信息成员' },
              { value: 'incompleteHire', label: '未完善入职信息成员' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>共 {filtered.length} 名成员</span>
            <Flex gap={8}>
              <Button
                icon={<SendOutlined />}
                onClick={() => {
                  const count = rows.filter((item) => !birthdayComplete(item) || !hireComplete(item)).length;
                  modal.confirm({
                    title: '发送完善提醒？',
                    content: `将向 ${count} 名生日或入职信息未完善的员工发送提醒。`,
                    okText: '确认发送',
                    cancelText: '取消',
                    onOk: () => message.success('完善提醒已发送（模拟）'),
                  });
                }}
              >
                发送完善提醒
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setBatchOpen(true)}>
                批量修改
              </Button>
            </Flex>
          </Flex>
        }
      >
        <Table<CareEmployee>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1100 }}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          locale={{ emptyText: <Empty description={hasQuery ? '没有符合条件的成员' : '暂无成员数据'} /> }}
        />
      </ListTableCard>
      <Modal
        title={editing ? `编辑员工 ${editing.name}` : '编辑员工'}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        destroyOnHidden
        width={640}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!editing) return;
                const values = await form.validateFields();
                updateEmployee(editing.id, values);
                message.success('员工关怀信息已更新');
                setEditing(null);
              }}
            >
              确定
            </Button>
          </Flex>
        }
      >
        <Form form={form} layout="horizontal" className="edit-form">
          <Form.Item name="solarBirthday" label="阳历生日" extra="请填写阳历生日">
            <Input placeholder="YYYY-MM-DD" style={{ maxWidth: 240 }} />
          </Form.Item>
          <Form.Item name="lunarBirthday" label="阴历生日">
            <Input placeholder="请填写阴历生日" style={{ maxWidth: 240 }} />
          </Form.Item>
          <Form.Item name="reminder" label="生日提醒" rules={[{ required: true, message: '请选择提醒方式' }]}>
            <Radio.Group options={[{ value: '按阳历', label: '按阳历' }, { value: '按阴历', label: '按阴历' }]} />
          </Form.Item>
          <Form.Item name="hireDate" label="入职时间">
            <Input placeholder="YYYY-MM-DD" style={{ maxWidth: 240 }} />
          </Form.Item>
          <Form.Item name="partyJoinDate" label="入党时间" extra="未入党成员可留空">
            <Input placeholder="YYYY-MM-DD" style={{ maxWidth: 240 }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="批量修改"
        open={batchOpen}
        onCancel={() => setBatchOpen(false)}
        width={640}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={() => setBatchOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                message.success('员工信息已完成批量更新（模拟）');
                setBatchOpen(false);
              }}
            >
              确认设置
            </Button>
          </Flex>
        }
      >
        <p>请先上传员工关怀信息表，确认后批量更新员工生日、入职和入党时间。</p>
        <Upload.Dragger accept=".xlsx,.xls,.csv" beforeUpload={() => false} maxCount={1}>
          <p>点击或拖拽上传 Excel / CSV</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
}
