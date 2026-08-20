import { useMemo, useState, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { courseCategoryStatuses, type CourseCategoryRecord, type CourseCategoryStatus } from '../model/training';
import { removeCourseCategory, setCourseCategoryStatus, upsertCourseCategory, useCourseCategories } from '../model/trainingStore';

type CategoryQuery = {
  name: string;
  status?: CourseCategoryStatus;
};

const emptyQuery: CategoryQuery = { name: '' };

const statusColor: Record<CourseCategoryStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function CourseCategoryListPage() {
  const { message } = App.useApp();
  const data = useCourseCategories();
  const [draft, setDraft] = useState<CategoryQuery>(emptyQuery);
  const [query, setQuery] = useState<CategoryQuery>(emptyQuery);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<CourseCategoryRecord>();
  const [form] = Form.useForm<{ name: string }>();
  const filtered = useMemo(
    () => data.filter((item) => (!query.name || item.name.includes(query.name)) && (!query.status || item.status === query.status)),
    [data, query],
  );

  const openEditor = (record?: CourseCategoryRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    upsertCourseCategory({
      id: current?.id ?? Date.now(),
      name: values.name.trim(),
      status: current?.status ?? '启用',
    });
    message.success(current ? '课程分类已更新' : '课程分类已创建');
    setOpen(false);
  };

  const columns: TableColumnsType<CourseCategoryRecord> = [
    { title: '分类名称', dataIndex: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: CourseCategoryStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEditor(record)}>
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => {
              const next = record.status === '启用' ? '禁用' : '启用';
              setCourseCategoryStatus([record.id], next);
              message.success(next === '启用' ? `已启用「${record.name}」` : `已禁用「${record.name}」`);
            }}
          >
            {record.status === '启用' ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            onClick={() => {
              removeCourseCategory(record.id);
              message.success(`已删除「${record.name}」`);
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['课程', '课程分类']} title="课程分类" subtitle="维护课程分类，供课程创建时选择。" />
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="分类名称">
          <Input
            allowClear
            placeholder="请输入分类名称"
            value={draft.name}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))}
            options={optionsOf(courseCategoryStatuses)}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建分类
          </Button>
        </div>
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Modal
        title={current ? '编辑课程分类' : '新建课程分类'}
        open={open}
        onOk={save}
        footer={modalFooter}
        onCancel={() => setOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form
          key={current?.id ?? 'create'}
          form={form}
          layout="horizontal"
          className="edit-form"
          requiredMark
          initialValues={{ name: current?.name ?? '' }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 20, message: '分类名称不超过 20 个字' },
            ]}
          >
            <Input maxLength={20} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
