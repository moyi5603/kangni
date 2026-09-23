import { useMemo, useState, type ReactNode } from 'react';
import { DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
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
  orgPeoplePickerTree,
  withDisabledPeople,
} from '../../activities/model/activity';
import {
  interestGroupMemberRoleLabels,
  listInterestGroupMembers,
  type InterestGroupMember,
} from '../model/interestGroupMember';
import {
  downloadInterestGroupMemberExport,
  downloadInterestGroupMemberImportTemplate,
  parseInterestGroupMemberImportCsv,
  resolveInterestGroupMemberImport,
  INTEREST_GROUP_MEMBER_IMPORT_HINT,
} from '../model/interestGroupMemberIo';
import { addInterestGroupMembers, getInterestGroup, useInterestGroupMembers } from '../model/interestGroupStore';

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
  const { message } = App.useApp();
  const all = useInterestGroupMembers();
  const data = useMemo(() => listInterestGroupMembers(groupId, all), [all, groupId]);
  const memberNames = useMemo(() => new Set(data.map((item) => item.employeeId)), [data]);
  const peopleTree = useMemo(() => withDisabledPeople(orgPeoplePickerTree, memberNames), [memberNames]);
  const [draft, setDraft] = useState<{
    name: string;
    department?: string;
    role?: InterestGroupMember['role'];
    joinedAt: DateRange;
  }>({ name: '', joinedAt: null });
  const [query, setQuery] = useState(draft);
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
          inDayRange(item.joinedAt, query.joinedAt),
      ),
    [data, query],
  );
  const hasFilter = Boolean(query.name || query.department || query.role || query.joinedAt);

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
    { title: '部门', dataIndex: 'department', width: 120 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 110,
      render: (value: InterestGroupMember['role']) => (
        <Tag color={value === 'lead' ? 'gold' : 'default'}>{interestGroupMemberRoleLabels[value]}</Tag>
      ),
    },
    { title: '加入时间', dataIndex: 'joinedAt', width: 180 },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
        onReset={() => {
          const empty = { name: '', joinedAt: null as DateRange };
          setDraft(empty);
          setQuery(empty);
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
          <Typography.Text>共 {filtered.length} 人</Typography.Text>
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
                downloadInterestGroupMemberExport(group?.name ?? '兴趣圈', filtered);
                message.success(`已导出 ${filtered.length} 人`);
              }}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table
          rowKey="employeeId"
          sticky
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 720 }}
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
          <Form.Item label="导入文件" extra={INTEREST_GROUP_MEMBER_IMPORT_HINT} required>
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
