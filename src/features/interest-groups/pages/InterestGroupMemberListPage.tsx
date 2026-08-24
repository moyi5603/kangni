import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  departmentOptions,
  orgPeopleByName,
  orgPeoplePickerTree,
  withDisabledPeople,
} from '../../activities/model/activity';
import {
  interestGroupMemberRoleLabels,
  interestGroupMemberStatuses,
  listInterestGroupMembers,
  type InterestGroupMember,
} from '../model/interestGroupMember';
import {
  downloadInterestGroupMemberExport,
  downloadInterestGroupMemberImportTemplate,
  parseInterestGroupMemberImportCsv,
  resolveInterestGroupMemberImport,
} from '../model/interestGroupMemberIo';
import {
  addInterestGroupMembers,
  getInterestGroup,
  removeInterestGroupMembers,
  setInterestGroupMemberStatus,
  useInterestGroupMembers,
} from '../model/interestGroupStore';

const statusColor: Record<string, string> = {
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
};

type DateRange = [Dayjs | null, Dayjs | null] | null;

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function inDayRange(value: string, range: DateRange) {
  if (!range?.[0] && !range?.[1]) return true;
  const time = dayjs(value);
  if (range[0] && time.isBefore(range[0].startOf('day'))) return false;
  if (range[1] && time.isAfter(range[1].endOf('day'))) return false;
  return true;
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function InterestGroupMemberListPage({ groupId }: { groupId: number }) {
  const { message, modal } = App.useApp();
  const all = useInterestGroupMembers();
  const data = useMemo(() => listInterestGroupMembers(groupId, all), [all, groupId]);
  const memberNames = useMemo(() => new Set(data.map((item) => item.employeeId)), [data]);
  const peopleTree = useMemo(() => withDisabledPeople(orgPeoplePickerTree, memberNames), [memberNames]);
  const [draft, setDraft] = useState<{
    name: string;
    department?: string;
    role?: InterestGroupMember['role'];
    status?: InterestGroupMember['status'];
    joinedAt: DateRange;
  }>({ name: '', joinedAt: null });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [addForm] = Form.useForm<{ people: string[] }>();
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.name || item.name.includes(query.name)) &&
          (!query.department || item.department === query.department) &&
          (!query.role || item.role === query.role) &&
          (!query.status || item.status === query.status) &&
          inDayRange(item.joinedAt, query.joinedAt),
      ),
    [data, query],
  );
  const hasFilter = Boolean(query.name || query.department || query.role || query.status || query.joinedAt);
  const selected = data.filter((item) => selectedRowKeys.includes(item.employeeId));

  const deleteOne = (record: InterestGroupMember) => {
    modal.confirm({
      title: `确认将「${record.name}」移出小组？`,
      content: '移出后该人员不再出现在本组成员名单中。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        const result = removeInterestGroupMembers(groupId, [record.employeeId]);
        if (!result.removed) {
          message.warning(result.skipped[0] ?? '无法移出');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.employeeId));
        message.success(`已移出「${record.name}」`);
      },
    });
  };

  const setStatus = (records: InterestGroupMember[], status: '已通过' | '已驳回', label: string) => {
    const targets = records.filter((item) => item.role !== 'lead' && item.status === '待审核');
    if (!targets.length) {
      message.info('已选成员均不是待审核状态');
      return;
    }
    const result = setInterestGroupMemberStatus(
      groupId,
      targets.map((item) => item.employeeId),
      status,
    );
    message.success(`已${label} ${result.done} 人`);
    setSelectedRowKeys(selected.filter((item) => item.status !== '待审核').map((item) => item.employeeId));
  };

  const rejectOne = (record: InterestGroupMember) => {
    modal.confirm({
      title: `确认驳回「${record.name}」的入组申请？`,
      content: '驳回后该人员将无法加入本小组。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        const result = setInterestGroupMemberStatus(groupId, [record.employeeId], '已驳回');
        if (!result.done) {
          message.info('仅待审核成员可驳回');
          return;
        }
        message.success(`已驳回「${record.name}」`);
      },
    });
  };

  const deleteSelected = () => {
    const ids = selected.map((item) => item.employeeId);
    const result = removeInterestGroupMembers(groupId, ids);
    if (result.removed) message.success(`已移出 ${result.removed} 人`);
    if (result.skipped.length) message.warning(result.skipped.join('；'));
    setSelectedRowKeys([]);
  };

  const saveAddedPeople = async () => {
    const values = await addForm.validateFields();
    const result = addInterestGroupMembers(groupId, values.people ?? []);
    if (!result.added) {
      message.info(result.skipped.length ? `未添加人员：${result.skipped.join('；')}` : '未选择可添加人员');
      return;
    }
    message.success(
      result.skipped.length
        ? `已添加 ${result.added} 人，跳过 ${result.skipped.length} 人：${result.skipped.join('；')}`
        : `已添加 ${result.added} 人`,
    );
    setAddOpen(false);
  };

  const importMembers = async () => {
    const file = importList[0];
    const raw = file?.originFileObj;
    if (!raw) {
      message.error('请上传导入文件。当前未改动成员数据，可重新选择文件后重试。');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('演示环境请下载 CSV 模板后导入。当前未改动成员数据。');
      return;
    }
    const parsed = parseInterestGroupMemberImportCsv(await raw.text());
    const resolved = resolveInterestGroupMemberImport(parsed.rows, memberNames);
    const skipped = [...parsed.errors, ...resolved.skipped];
    if (!resolved.employeeIds.length) {
      message.error(skipped.length ? `导入失败，成员数据未改动：${skipped.slice(0, 3).join('；')}` : '没有可导入的成员');
      return;
    }
    const result = addInterestGroupMembers(groupId, resolved.employeeIds);
    const allSkipped = [...skipped, ...result.skipped];
    message.success(
      allSkipped.length
        ? `已导入 ${result.added} 人，跳过 ${allSkipped.length} 条：${allSkipped.slice(0, 3).join('；')}`
        : `已导入 ${result.added} 人`,
    );
    setImportOpen(false);
    setImportList([]);
  };

  const columns: TableColumnsType<InterestGroupMember> = [
    { title: '姓名', dataIndex: 'name', width: 110 },
    {
      title: '手机号',
      key: 'phone',
      width: 130,
      render: (_, record) => orgPeopleByName[record.employeeId]?.phone ?? '—',
    },
    { title: '部门', dataIndex: 'department', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 110,
      render: (value: InterestGroupMember['role']) => (
        <Tag color={value === 'lead' ? 'gold' : 'default'}>{interestGroupMemberRoleLabels[value]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '加入时间', dataIndex: 'joinedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) =>
        record.role === 'lead' ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          <Space>
            <Button
              type="link"
              aria-label={`通过 ${record.name}`}
              onClick={() => {
                const result = setInterestGroupMemberStatus(groupId, [record.employeeId], '已通过');
                if (!result.done) {
                  message.info('仅待审核成员可通过');
                  return;
                }
                message.success(`已通过「${record.name}」`);
              }}
            >
              通过
            </Button>
            <Button type="link" aria-label={`驳回 ${record.name}`} onClick={() => rejectOne(record)}>
              驳回
            </Button>
            <Button type="link" aria-label={`删除 ${record.name}`} onClick={() => deleteOne(record)}>
              删除
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          setSelectedRowKeys([]);
          message.success('查询完成');
        }}
        onReset={() => {
          const empty = { name: '', joinedAt: null as DateRange };
          setDraft(empty);
          setQuery(empty);
          setSelectedRowKeys([]);
        }}
      >
        <SearchField label="姓名">
          <Input
            allowClear
            placeholder="请输入姓名"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="部门">
          <Select
            allowClear
            placeholder="全部部门"
            value={draft.department}
            onChange={(value) => setDraft((current) => ({ ...current, department: value }))}
            options={optionsOf(departmentOptions)}
          />
        </SearchField>
        <SearchField label="角色">
          <Select
            allowClear
            placeholder="全部角色"
            value={draft.role}
            onChange={(value) => setDraft((current) => ({ ...current, role: value }))}
            options={[
              { value: 'lead', label: '负责人' },
              { value: 'member', label: '成员' },
            ]}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={optionsOf(interestGroupMemberStatuses)}
          />
        </SearchField>
        <SearchField label="加入时间">
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={draft.joinedAt}
            onChange={(value) => setDraft((current) => ({ ...current, joinedAt: value }))}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                addForm.resetFields();
                setAddOpen(true);
              }}
            >
              添加人员
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => {
                setImportList([]);
                setImportOpen(true);
              }}
            >
              批量导入
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                const group = getInterestGroup(groupId);
                downloadInterestGroupMemberExport(group?.name ?? '小组', filtered);
                message.success(`已导出 ${filtered.length} 人`);
              }}
            >
              导出
            </Button>
          </Space>
        </div>
        {selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认通过已选 ${selectedRowKeys.length} 人？`,
                    content: '仅待审核记录会被通过。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: () => setStatus(selected, '已通过', '通过'),
                  })
                }
              >
                批量通过
              </Button>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认驳回已选 ${selectedRowKeys.length} 人？`,
                    content: '仅待审核记录会被驳回。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: () => setStatus(selected, '已驳回', '驳回'),
                  })
                }
              >
                批量驳回
              </Button>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认移出已选 ${selectedRowKeys.length} 人？`,
                    content: '小组负责人不会被移出。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: deleteSelected,
                  })
                }
              >
                批量删除
              </Button>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </Flex>
        ) : null}
        <Table
          rowKey="employeeId"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1040 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasFilter ? '没有符合条件的成员' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Modal
        title="添加人员"
        open={addOpen}
        footer={modalFooter}
        onOk={() => void saveAddedPeople()}
        onCancel={() => setAddOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form form={addForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          <Form.Item name="people" label="选择人员" rules={[{ required: true, type: 'array', min: 1, message: '请选择人员' }]}>
            <TreeSelect
              treeData={peopleTree}
              treeCheckable
              treeDefaultExpandAll
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              showSearch={{ treeNodeFilterProp: 'title' }}
              allowClear
              placeholder="请按组织架构选择人员"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="批量导入"
        open={importOpen}
        footer={modalFooter}
        onOk={() => void importMembers()}
        onCancel={() => {
          setImportOpen(false);
          setImportList([]);
        }}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form layout="horizontal" className="edit-form" requiredMark labelWrap={false}>
          <Form.Item label="导入文件" extra="支持 csv。请按模板填写姓名、手机号、部门。须为组织内人员。" required>
            <Space>
              <Upload
                accept=".csv,.xlsx"
                maxCount={1}
                fileList={importList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setImportList(fileList.slice(-1))}
              >
                <Button>上传文件</Button>
              </Upload>
              <Button type="link" style={{ paddingInline: 0 }} onClick={() => downloadInterestGroupMemberImportTemplate()}>
                下载导入模板
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
