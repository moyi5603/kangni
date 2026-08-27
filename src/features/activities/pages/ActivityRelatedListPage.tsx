import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
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
import type { TableColumnsType, UploadFile } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { useRejectReasonPrompt } from '../../../shared/ui/RejectReasonModal';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  activitySignupTypes,
  departmentOptions,
  orgPeopleByName,
  orgPeoplePickerTree,
  personDepartment,
  withDisabledPeople,
  type Activity,
} from '../model/activity';
import {
  formatPickedSessionsLabel,
  needsSessionPick,
} from '../model/activitySchedule';
import { formatSignupCheckIns } from '../model/activityCheckIn';
import { downloadSignupImportTemplate, parseSignupImportCsv } from '../model/signupImport';
import {
  downloadSignupExport,
  formatSignupAnswerValue,
  formatSignupAnswersSummary,
  resolveSignupRecordAnswers,
} from '../model/signupAnswers';
import {
  patchRelated,
  signupStatuses,
  surveyStatuses,
  useRelated,
  type ApprovalRecord,
  type CommentRecord,
  type SignupRecord,
  type SurveyRecord,
} from '../model/related';
import { commentReplyLabel, removeCommentsAndDescendants } from '../model/commentTree';
import { employeeAvatarColor, employeeAvatarLetter } from '../model/employeeAvatar';

type DateRange = [Dayjs | null, Dayjs | null] | null;

const statusColor: Record<string, string> = {
  待发放: 'warning',
  发放中: 'processing',
  已完成: 'success',
  草稿: 'default',
  收集中: 'processing',
  已结束: 'default',
  提交: 'processing',
  通过: 'success',
  驳回: 'error',
  待处理: 'warning',
  已通过: 'success',
  已驳回: 'error',
  待审核: 'warning',
  已取消: 'default',
  已发布: 'success',
  待发布: 'warning',
};

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

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

export function SurveyList({ activity }: { activity: Activity }) {
  const { message } = App.useApp();
  const data = useRelated('surveys', activity.id);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [current, setCurrent] = useState<SurveyRecord>();
  const [form] = Form.useForm();
  const openEditor = (record?: SurveyRecord, nextMode: 'create' | 'edit' | 'view' = record ? 'view' : 'create') => {
    setMode(nextMode);
    setCurrent(record);
    setOpen(true);
    if (nextMode === 'create') form.resetFields();
    else if (record) {
      form.setFieldsValue({
        ...record,
        collectAt: [dayjs(record.collectStartAt), dayjs(record.collectEndAt)],
      });
    }
  };
  const save = async () => {
    const values = await form.validateFields();
    const payload = {
      title: values.title as string,
      status: values.status as SurveyRecord['status'],
      collectStartAt: (values.collectAt[0] as Dayjs).format('YYYY-MM-DD HH:mm'),
      collectEndAt: (values.collectAt[1] as Dayjs).format('YYYY-MM-DD HH:mm'),
    };
    if (mode === 'edit' && current) {
      patchRelated('surveys', (list) => list.map((item) => (item.id === current.id ? { ...item, ...payload } : item)));
      message.success('问卷已更新');
    } else {
      patchRelated('surveys', (list) => [{ id: Date.now(), activityId: activity.id, createdAt: nowText(), responseCount: 0, ...payload }, ...list]);
      message.success('问卷已创建');
    }
    setOpen(false);
  };
  const columns: TableColumnsType<SurveyRecord> = [
    {
      title: '问卷标题',
      dataIndex: 'title',
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => openEditor(record, 'view')}>
          {value}
        </Button>
      ),
    },
    { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: '回收份数', dataIndex: 'responseCount', width: 110, align: 'right' },
    { title: '收集时间', key: 'collectAt', width: 280, render: (_, record) => `${record.collectStartAt} ~ ${record.collectEndAt}` },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right' as const,
      width: 140,
      render: (_, record) => (
        <TableRowActions
          actions={[
            {
              key: 'detail',
              label: '详情',
              ariaLabel: `详情 ${record.title}`,
              onClick: () => openEditor(record, 'view'),
            },
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑 ${record.title}`,
              onClick: () => openEditor(record, 'edit'),
            },
          ]}
          moreAriaLabel={`更多操作 ${record.title}`}
        />
      ),
    },
  ];
  return (
    <RelatedTable
      query={null}
      toolbar={
        <>
          <Typography.Text>共 {data.length} 条</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建问卷
          </Button>
        </>
      }
      batch={
        selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button
                onClick={() => {
                  patchRelated('surveys', (list) =>
                    list.map((item) => (selectedRowKeys.includes(item.id) && item.status === '草稿' ? { ...item, status: '收集中' } : item)),
                  );
                  message.success('已将草稿问卷设为收集中');
                  setSelectedRowKeys([]);
                }}
              >
                批量开始收集
              </Button>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </Flex>
        ) : null
      }
      table={
        <Table
          rowKey="id"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={data}
          scroll={{ x: 960 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={b2bStandards.table.emptyText} /> }}
        />
      }
      modal={
        <Modal
          title={mode === 'create' ? '新建问卷' : mode === 'edit' ? '编辑问卷' : '问卷详情'}
          open={open}
          footer={
            mode === 'view' ? (
              <Space>
                <Button onClick={() => setOpen(false)}>关闭</Button>
                <Button type="primary" onClick={() => setMode('edit')}>
                  编辑
                </Button>
              </Space>
            ) : (
              modalFooter
            )
          }
          onOk={save}
          onCancel={() => setOpen(false)}
          okText="确认"
          cancelText="取消"
          width={b2bStandards.form.modalWidth}
          destroyOnHidden
        >
          {mode === 'view' && current ? (
            <Descriptions column={1} bordered items={[
              { label: '问卷标题', children: current.title },
              { label: '状态', children: current.status },
              { label: '回收份数', children: current.responseCount },
              { label: '收集时间', children: `${current.collectStartAt} ~ ${current.collectEndAt}` },
            ]} />
          ) : (
            <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur" initialValues={{ status: '草稿' }}>
              <Form.Item name="title" label="问卷标题" rules={[{ required: true, message: '请输入问卷标题' }]}>
                <Input maxLength={40} showCount />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={optionsOf(surveyStatuses)} />
              </Form.Item>
              <Form.Item name="collectAt" label="收集时间" rules={[{ required: true, message: '请选择收集时间' }]}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          )}
        </Modal>
      }
    />
  );
}

export function ApprovalList({ activity }: { activity: Activity }) {
  const data = useRelated('approvals', activity.id);
  const columns: TableColumnsType<ApprovalRecord> = [
    { title: '审批动作', dataIndex: 'action', width: 110 },
    { title: '处理人', dataIndex: 'operator', width: 120 },
    { title: '意见', dataIndex: 'comment', ellipsis: true, render: (value: string) => <TableEllipsisText text={value || '—'} /> },
    { title: '处理时间', dataIndex: 'createdAt', width: 180 },
  ];
  return (
    <RelatedTable
      query={null}
      toolbar={<Typography.Text>共 {data.length} 条</Typography.Text>}
      batch={null}
      table={
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={data}
          scroll={{ x: 720 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={b2bStandards.table.emptyText} /> }}
        />
      }
      modal={null}
    />
  );
}

export function SignupList({ activity }: { activity: Activity }) {
  const { message, modal } = App.useApp();
  const { promptReject, rejectReasonModal } = useRejectReasonPrompt();
  const data = useRelated('signups', activity.id);
  const signupFields = useMemo(() => activity.signupFields ?? [], [activity.signupFields]);
  const defaultSignupType = useMemo(
    () => activitySignupTypes(activity)[0] || '个人报名',
    [activity],
  );
  const signedNames = useMemo(() => new Set(data.map((item) => item.name)), [data]);
  const peopleTree = useMemo(() => withDisabledPeople(orgPeoplePickerTree, signedNames), [signedNames]);
  const [draft, setDraft] = useState<{
    name: string;
    department?: string;
    status?: SignupRecord['status'];
    createdAt: DateRange;
  }>({
    name: '',
    createdAt: null,
  });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [detailRecord, setDetailRecord] = useState<SignupRecord | null>(null);
  const [addForm] = Form.useForm();
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.name || item.name.includes(query.name)) &&
          (!query.department || item.department === query.department) &&
          (!query.status || item.status === query.status) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );
  const selected = data.filter((item) => selectedRowKeys.includes(item.id));
  const hasFilter = Boolean(query.name || query.department || query.status || query.createdAt);
  const openAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({ people: [] });
    setAddOpen(true);
  };
  const deleteOne = (record: SignupRecord) => {
    modal.confirm({
      title: `确认删除「${record.name}」的报名？`,
      content: '删除后该人员不再出现在本活动报名名单中，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        patchRelated('signups', (list) => list.filter((item) => item.id !== record.id));
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.name}」的报名`);
      },
    });
  };
  const rejectOne = (record: SignupRecord) => {
    promptReject({
      title: `确认驳回「${record.name}」的报名？`,
      description: '驳回后该人员将无法参加本活动。',
      onConfirm: (reason) => {
        patchRelated('signups', (list) =>
          list.map((item) =>
            item.id === record.id
              ? { ...item, status: '已驳回' as const, rejectReason: reason || undefined }
              : item,
          ),
        );
        message.success(`已驳回「${record.name}」的报名`);
      },
    });
  };
  const saveAddedPeople = async () => {
    const values = await addForm.validateFields();
    const names = (values.people as string[]) ?? [];
    const created: SignupRecord[] = [];
    const skipped: string[] = [];
    const usedPhones = new Set(data.map((item) => item.phone));
    names.forEach((name) => {
      const person = orgPeopleByName[name];
      if (!person) {
        skipped.push(`${name}不在组织中`);
        return;
      }
      if (signedNames.has(name) || usedPhones.has(person.phone) || created.some((item) => item.name === name || item.phone === person.phone)) {
        skipped.push(`${name}已报名`);
        return;
      }
      created.push({
        id: Date.now() + created.length,
        activityId: activity.id,
        name: person.name,
        phone: person.phone,
        department: person.department,
        signupType: defaultSignupType,
        status: '已通过',
        createdAt: nowText(),
      });
    });
    if (created.length) {
      patchRelated('signups', (list) => [...created, ...list]);
    }
    if (!created.length) {
      message.info(skipped.length ? `未添加人员：${skipped.join('；')}` : '未选择可添加人员');
      return;
    }
    message.success(skipped.length ? `已添加 ${created.length} 人，跳过 ${skipped.length} 人：${skipped.join('；')}` : `已添加 ${created.length} 人`);
    setAddOpen(false);
  };
  const importSignups = async () => {
    const file = importList[0];
    const raw = file?.originFileObj;
    if (!raw) {
      message.error('请上传导入文件。当前未改动报名数据，可重新选择文件后重试。');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('演示环境请下载 CSV 模板后导入。当前未改动报名数据。');
      return;
    }
    const parsed = parseSignupImportCsv(await raw.text(), defaultSignupType);
    const created: SignupRecord[] = [];
    const skipped = [...parsed.errors];
    const usedNames = new Set(data.map((item) => item.name));
    const usedPhones = new Set(data.map((item) => item.phone));
    parsed.rows.forEach((row) => {
      if (usedNames.has(row.name) || usedPhones.has(row.phone) || created.some((item) => item.name === row.name || item.phone === row.phone)) {
        skipped.push(`${row.name}已报名`);
        return;
      }
      created.push({
        id: Date.now() + created.length,
        activityId: activity.id,
        name: row.name,
        phone: row.phone,
        department: row.department,
        signupType: row.signupType,
        status: '已通过',
        createdAt: nowText(),
      });
    });
    if (!created.length) {
      message.error(skipped.length ? `导入失败，报名数据未改动：${skipped.slice(0, 3).join('；')}` : '没有可导入的报名记录');
      return;
    }
    patchRelated('signups', (list) => [...created, ...list]);
    message.success(skipped.length ? `已导入 ${created.length} 条，跳过 ${skipped.length} 条：${skipped.slice(0, 3).join('；')}` : `已导入 ${created.length} 条报名`);
    setImportOpen(false);
    setImportList([]);
  };
  const batchStatus = (status: SignupRecord['status'], label: string, reason?: string) => {
    const targets = selected.filter((item) => item.status === '待审核');
    if (!targets.length) {
      message.info('已选报名均不是待审核状态');
      return;
    }
    const ids = new Set(targets.map((item) => item.id));
    const rejectReason = status === '已驳回' ? reason || undefined : undefined;
    patchRelated('signups', (list) =>
      list.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              status,
              rejectReason: status === '已驳回' ? rejectReason : status === '已通过' ? undefined : item.rejectReason,
            }
          : item,
      ),
    );
    message.success(`已${label} ${targets.length} 条报名`);
    setSelectedRowKeys(selectedRowKeys.filter((key) => !ids.has(Number(key))));
  };
  const columns: TableColumnsType<SignupRecord> = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 110,
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value || '—'} />,
    },
    ...(needsSessionPick(activity.scheduleType)
      ? [
          {
            title: '场次',
            key: 'sessions',
            width: 260,
            ellipsis: true,
            render: (_: unknown, record: SignupRecord) => (
              <TableEllipsisText
                text={formatPickedSessionsLabel(activity.sessions ?? [], resolveSignupRecordAnswers(record)['场次']) || '—'}
              />
            ),
          },
        ]
      : []),
    ...(signupFields.length
      ? [
          {
            title: '收集信息',
            key: 'collection',
            width: 220,
            ellipsis: true,
            render: (_: unknown, record: SignupRecord) => (
              <TableEllipsisText text={formatSignupAnswersSummary(signupFields, resolveSignupRecordAnswers(record))} />
            ),
          },
        ]
      : []),
    { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: '报名时间', dataIndex: 'createdAt', width: 180 },
    ...(activity.checkInEnabled
      ? [
          {
            title: '签到',
            key: 'checkIn',
            width: 220,
            ellipsis: true,
            render: (_: unknown, record: SignupRecord) => (
              <TableEllipsisText text={formatSignupCheckIns(record.checkIns, activity.sessions ?? [])} />
            ),
          },
        ]
      : []),
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right' as const,
      width: 220,
      render: (_, record) => {
        const actions: TableRowAction[] = [];
        if (signupFields.length) {
          actions.push({
            key: 'detail',
            label: '报名详情',
            ariaLabel: `查看 ${record.name} 的报名详情`,
            onClick: () => setDetailRecord(record),
          });
        }
        if (record.status === '待审核') {
          actions.push({
            key: 'approve',
            label: '通过',
            ariaLabel: `通过 ${record.name} 的报名`,
            onClick: () => {
              patchRelated('signups', (list) =>
                list.map((item) =>
                  item.id === record.id ? { ...item, status: '已通过' as const, rejectReason: undefined } : item,
                ),
              );
              message.success(`已通过「${record.name}」的报名`);
            },
          });
          actions.push({
            key: 'reject',
            label: '驳回',
            ariaLabel: `驳回 ${record.name} 的报名`,
            onClick: () => rejectOne(record),
          });
        }
        actions.push({
          key: 'delete',
          label: '删除',
          ariaLabel: `删除 ${record.name} 的报名`,
          danger: true,
          onClick: () => deleteOne(record),
        });
        return <TableRowActions actions={actions} moreAriaLabel={`更多操作 ${record.name}`} />;
      },
    },
  ];
  return (
    <RelatedTable
      query={
        <SearchPanel
          onSearch={() => {
            setQuery(draft);
            setSelectedRowKeys([]);
            message.success('查询完成');
          }}
          onReset={() => {
            const empty = { name: '', createdAt: null as DateRange };
            setDraft(empty);
            setQuery(empty);
            setSelectedRowKeys([]);
          }}
        >
          <SearchField label="姓名">
            <Input allowClear placeholder="请输入姓名" value={draft.name} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))} />
          </SearchField>
          <SearchField label="部门">
            <Select allowClear placeholder="全部部门" value={draft.department} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, department: value }))} options={optionsOf(departmentOptions)} />
          </SearchField>
          <SearchField label="状态">
            <Select allowClear placeholder="全部状态" value={draft.status} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))} options={optionsOf(signupStatuses)} />
          </SearchField>
          <SearchField label="报名时间">
            <DatePicker.RangePicker style={{ width: '100%' }} value={draft.createdAt} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, createdAt: value }))} />
          </SearchField>
        </SearchPanel>
      }
      toolbar={
        <>
          <Typography.Text>共 {filtered.length} 条</Typography.Text>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                downloadSignupExport(activity.title, signupFields, filtered, activity.sessions ?? []);
                message.success(`已导出 ${filtered.length} 条报名`);
              }}
            >
              导出
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => { setImportList([]); setImportOpen(true); }}>
              批量导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              添加人员
            </Button>
          </Space>
        </>
      }
      batch={
        selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认通过已选 ${selectedRowKeys.length} 条报名？`,
                    content: '仅待审核记录会被通过。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: () => batchStatus('已通过', '通过'),
                  })
                }
              >
                批量通过
              </Button>
              <Button
                onClick={() =>
                  promptReject({
                    title: `确认驳回已选 ${selectedRowKeys.length} 条报名？`,
                    description: '仅待审核记录会被驳回，报名人将无法参加该活动。',
                    onConfirm: (reason) => batchStatus('已驳回', '驳回', reason),
                  })
                }
              >
                批量驳回
              </Button>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </Flex>
        ) : null
      }
      table={
        <Table
          rowKey="id"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: signupFields.length ? 1120 : 920 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasFilter ? '没有符合条件的报名' : b2bStandards.table.emptyText} /> }}
        />
      }
      modal={
        <>
          <Modal
            title="添加人员"
            open={addOpen}
            footer={modalFooter}
            onOk={saveAddedPeople}
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
            onOk={importSignups}
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
              <Form.Item label="导入文件" extra="支持 csv。请按模板填写姓名、手机号、部门。" required>
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
                  <Button type="link" style={{ paddingInline: 0 }} onClick={() => downloadSignupImportTemplate()}>
                    下载导入模板
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
          <Modal
            title={`报名收集信息 — ${detailRecord?.name ?? ''}`}
            open={detailRecord != null}
            footer={null}
            onCancel={() => setDetailRecord(null)}
            width={b2bStandards.form.modalWidth}
            destroyOnHidden
          >
            {detailRecord ? (
              <Descriptions
                bordered
                column={1}
                size="small"
                items={[
                  ...(needsSessionPick(activity.scheduleType)
                    ? [
                        {
                          key: '场次',
                          label: '场次',
                          children:
                            formatPickedSessionsLabel(
                              activity.sessions ?? [],
                              resolveSignupRecordAnswers(detailRecord)['场次'],
                            ) || '—',
                        },
                      ]
                    : []),
                  ...signupFields.map((field) => ({
                    key: field.key,
                    label: field.label,
                    children: formatSignupAnswerValue(field, resolveSignupRecordAnswers(detailRecord)[field.key]),
                  })),
                  ...(detailRecord.rejectReason
                    ? [{ key: 'rejectReason', label: '驳回原因', children: detailRecord.rejectReason }]
                    : []),
                ]}
              />
            ) : null}
          </Modal>
          {rejectReasonModal}
        </>
      }
    />
  );
}

export function CommentList({ activity }: { activity: Activity }) {
  const { message, modal } = App.useApp();
  const data = useRelated('comments', activity.id);
  const [draft, setDraft] = useState<{ content: string; author: string; createdAt: DateRange }>({
    content: '',
    author: '',
    createdAt: null,
  });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.content.includes(query.content)) &&
          (!query.author || item.author.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );
  const deleteOne = (record: CommentRecord) => {
    modal.confirm({
      title: `确认删除「${record.author}」的评论？`,
      content: '删除后员工端不再展示该评论及其回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        patchRelated('comments', (list) => removeCommentsAndDescendants(list, [record.id]));
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.author}」的评论`);
      },
    });
  };
  const deleteSelected = () => {
    const ids = [...new Set(selectedRowKeys)].map(Number);
    patchRelated('comments', (list) => removeCommentsAndDescendants(list, ids));
    message.success(`已删除 ${ids.length} 条评论`);
    setSelectedRowKeys([]);
  };
  const columns: TableColumnsType<CommentRecord> = [
    {
      title: '评论内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    {
      title: '回复',
      key: 'reply',
      width: 160,
      render: (_, record) => {
        const label = commentReplyLabel(record, data);
        return label === record.author ? '—' : label;
      },
    },
    {
      title: '评论人',
      key: 'author',
      width: 160,
      render: (_, record) => (
        <Space>
          <Avatar size={28} style={{ background: employeeAvatarColor(record.author), fontSize: 12 }}>
            {employeeAvatarLetter(record.author)}
          </Avatar>
          {record.author}
        </Space>
      ),
    },
    { title: '部门', key: 'department', width: 120, render: (_, record) => personDepartment(record.author) ?? '—' },
    { title: '评论时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right' as const,
      width: 88,
      render: (_, record) => (
        <TableRowActions
          actions={[
            {
              key: 'delete',
              label: '删除',
              ariaLabel: `删除 ${record.author} 的评论`,
              danger: true,
              onClick: () => deleteOne(record),
            },
          ]}
          moreAriaLabel={`更多操作 ${record.author}`}
        />
      ),
    },
  ];
  return (
    <RelatedTable
      query={
        <SearchPanel
          onSearch={() => {
            setQuery(draft);
            setSelectedRowKeys([]);
            message.success('查询完成');
          }}
          onReset={() => {
            const empty = { content: '', author: '', createdAt: null as DateRange };
            setDraft(empty);
            setQuery(empty);
            setSelectedRowKeys([]);
          }}
        >
          <SearchField label="评论内容">
            <Input allowClear placeholder="请输入评论内容" value={draft.content} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, content: event.target.value }))} />
          </SearchField>
          <SearchField label="评论人">
            <Input allowClear placeholder="请输入评论人" value={draft.author} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, author: event.target.value }))} />
          </SearchField>
          <SearchField label="评论时间">
            <DatePicker.RangePicker style={{ width: '100%' }} value={draft.createdAt} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, createdAt: value }))} />
          </SearchField>
        </SearchPanel>
      }
      toolbar={<Typography.Text>共 {filtered.length} 条</Typography.Text>}
      batch={
        selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认删除已选 ${selectedRowKeys.length} 条评论？`,
                    content: '删除后员工端不再展示这些评论，且无法恢复。',
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
        ) : null
      }
      table={
        <Table
          rowKey="id"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 840 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={query.content || query.author || query.createdAt ? '没有符合条件的评论' : b2bStandards.table.emptyText} /> }}
        />
      }
      modal={null}
    />
  );
}

function RelatedTable({
  query,
  toolbar,
  batch,
  table,
  modal,
}: {
  query: ReactNode;
  toolbar: ReactNode;
  batch: ReactNode;
  table: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="page-stack">
      {query}
      <Card>
        <div className="table-toolbar">{toolbar}</div>
        {batch}
        {table}
      </Card>
      {modal}
    </div>
  );
}
