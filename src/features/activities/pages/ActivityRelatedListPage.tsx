import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Avatar,
  Breadcrumb,
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
import { getActivity } from '../model/activityStore';
import { downloadSignupImportTemplate, parseSignupImportCsv } from '../model/signupImport';
import {
  patchRelated,
  signupStatuses,
  surveyStatuses,
  useRelated,
  type ApprovalRecord,
  type CommentRecord,
  type RelatedPage,
  type SignupRecord,
  type SurveyRecord,
} from '../model/related';
import { commentReplyLabel, removeCommentsAndDescendants } from '../model/commentTree';
import { employeeAvatarColor, employeeAvatarLetter } from '../model/employeeAvatar';
import { ActivityMomentListPage } from './ActivityMomentListPage';
import { ActivityPrizeListPage } from './ActivityPrizeListPage';

type DateRange = [Dayjs | null, Dayjs | null] | null;

const pageMeta: Record<RelatedPage, { title: string; subtitle: string; noun: string }> = {
  'activity-prizes': { title: '奖品发放', subtitle: '按人员发放勋章，并查看发放记录。', noun: '发放记录' },
  'activity-surveys': { title: '满意度调查', subtitle: '配置并查看该活动的满意度问卷。', noun: '问卷' },
  'activity-approvals': { title: '审批记录', subtitle: '查看该活动的审批流转记录。', noun: '审批记录' },
  'activity-signups': { title: '报名管理', subtitle: '查询、添加和导入该活动的报名人员。', noun: '报名' },
  'activity-comments': { title: '评论管理', subtitle: '查看并删除该活动下的评论，无需审核。', noun: '评论' },
  'activity-moments': { title: '精彩瞬间管理', subtitle: '审核并管理员工提交的图文和视频瞬间。', noun: '瞬间' },
};

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
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function RelatedHeading({
  activity,
  title,
  subtitle,
  onBack,
}: {
  activity: Activity;
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="list-page-heading">
      <Breadcrumb
        separator=">"
        items={[
          { title: '活动' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
          { title: activity.title },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </Flex>
    </div>
  );
}

function MissingActivity({ onBack }: { onBack: () => void }) {
  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '活动' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
          { title: '记录不存在' },
        ]}
      />
      <Empty description="活动不存在或已删除">
        <Button onClick={onBack}>返回活动管理</Button>
      </Empty>
    </div>
  );
}

export function ActivityRelatedListPage({
  page,
  recordId,
  onBack,
}: {
  page: RelatedPage;
  recordId?: string;
  onBack: () => void;
}) {
  const activity = getActivity(Number(recordId));
  if (!activity || Number.isNaN(Number(recordId))) return <MissingActivity onBack={onBack} />;
  if (page === 'activity-prizes') return <ActivityPrizeListPage activity={activity} onBack={onBack} />;
  if (page === 'activity-surveys') return <SurveyList activity={activity} onBack={onBack} />;
  if (page === 'activity-approvals') return <ApprovalList activity={activity} onBack={onBack} />;
  if (page === 'activity-signups') return <SignupList activity={activity} onBack={onBack} />;
  if (page === 'activity-comments') return <CommentList activity={activity} onBack={onBack} />;
  return <ActivityMomentListPage activity={activity} onBack={onBack} />;
}

function SurveyList({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const { message } = App.useApp();
  const data = useRelated('surveys', activity.id);
  const [draft, setDraft] = useState<{ title: string; status?: SurveyRecord['status']; collectAt: DateRange }>({ title: '', collectAt: null });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [current, setCurrent] = useState<SurveyRecord>();
  const [form] = Form.useForm();
  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const inCollect =
          !query.collectAt?.[0] && !query.collectAt?.[1]
            ? true
            : !(query.collectAt[1] && dayjs(item.collectStartAt).isAfter(query.collectAt[1].endOf('day'))) &&
              !(query.collectAt[0] && dayjs(item.collectEndAt).isBefore(query.collectAt[0]));
        return (!query.title || item.title.includes(query.title)) && (!query.status || item.status === query.status) && inCollect;
      }),
    [data, query],
  );
  const meta = pageMeta['activity-surveys'];
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
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`查看 ${record.title}`} onClick={() => openEditor(record, 'view')}>查看</Button>
          <Button type="link" aria-label={`编辑 ${record.title}`} onClick={() => openEditor(record, 'edit')}>编辑</Button>
        </Space>
      ),
    },
  ];
  return (
    <RelatedTable
      activity={activity}
      meta={meta}
      onBack={onBack}
      query={
        <SearchPanel
          onSearch={() => {
            setQuery(draft);
            message.success('查询完成');
          }}
          onReset={() => {
            const empty = { title: '', collectAt: null as DateRange };
            setDraft(empty);
            setQuery(empty);
          }}
        >
          <SearchField label="问卷标题">
            <Input allowClear placeholder="请输入问卷标题" value={draft.title} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))} />
          </SearchField>
          <SearchField label="状态">
            <Select allowClear placeholder="全部状态" value={draft.status} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))} options={optionsOf(surveyStatuses)} />
          </SearchField>
          <SearchField label="收集时间">
            <DatePicker.RangePicker showTime style={{ width: '100%' }} value={draft.collectAt} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, collectAt: value }))} />
          </SearchField>
        </SearchPanel>
      }
      toolbar={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
          新建问卷
        </Button>
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
          dataSource={filtered}
          scroll={{ x: 960 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={query.title || query.status || query.collectAt ? '没有符合条件的问卷' : b2bStandards.table.emptyText} /> }}
        />
      }
      modal={
        <Modal
          title={mode === 'create' ? '新建问卷' : mode === 'edit' ? '编辑问卷' : '问卷详情'}
          open={open}
          footer={mode === 'view' ? <Space><Button type="primary" onClick={() => setMode('edit')}>编辑</Button><Button onClick={() => setOpen(false)}>关闭</Button></Space> : modalFooter}
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

function ApprovalList({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const data = useRelated('approvals', activity.id);
  const meta = pageMeta['activity-approvals'];
  const columns: TableColumnsType<ApprovalRecord> = [
    { title: '审批动作', dataIndex: 'action', width: 110 },
    { title: '处理人', dataIndex: 'operator', width: 120 },
    { title: '意见', dataIndex: 'comment', render: (value: string) => value || '—' },
    { title: '处理时间', dataIndex: 'createdAt', width: 180 },
  ];
  return (
    <RelatedTable
      activity={activity}
      meta={meta}
      onBack={onBack}
      query={null}
      toolbar={null}
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

function SignupList({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const { message, modal } = App.useApp();
  const data = useRelated('signups', activity.id);
  const configuredTypes = useMemo(() => activitySignupTypes(activity), [activity]);
  const typeOptions = useMemo(() => {
    const types = [...configuredTypes];
    data.forEach((item) => {
      if (item.signupType && !types.includes(item.signupType)) types.push(item.signupType);
    });
    return optionsOf(types);
  }, [configuredTypes, data]);
  const signedNames = useMemo(() => new Set(data.map((item) => item.name)), [data]);
  const peopleTree = useMemo(() => withDisabledPeople(orgPeoplePickerTree, signedNames), [signedNames]);
  const [draft, setDraft] = useState<{
    name: string;
    phone: string;
    signupType?: string;
    department?: string;
    status?: SignupRecord['status'];
    createdAt: DateRange;
  }>({
    name: '',
    phone: '',
    createdAt: null,
  });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [addForm] = Form.useForm();
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.name || item.name.includes(query.name)) &&
          (!query.phone || item.phone.includes(query.phone)) &&
          (!query.signupType || item.signupType === query.signupType) &&
          (!query.department || item.department === query.department) &&
          (!query.status || item.status === query.status) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );
  const meta = pageMeta['activity-signups'];
  const selected = data.filter((item) => selectedRowKeys.includes(item.id));
  const hasFilter = Boolean(query.name || query.phone || query.signupType || query.department || query.status || query.createdAt);
  const openAdd = () => {
    addForm.resetFields();
    addForm.setFieldsValue({ signupType: configuredTypes[0], people: [] });
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
    modal.confirm({
      title: `确认驳回「${record.name}」的报名？`,
      content: '驳回后该人员将无法参加本活动。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        patchRelated('signups', (list) => list.map((item) => (item.id === record.id ? { ...item, status: '已驳回' } : item)));
        message.success(`已驳回「${record.name}」的报名`);
      },
    });
  };
  const saveAddedPeople = async () => {
    const values = await addForm.validateFields();
    const names = (values.people as string[]) ?? [];
    const signupType = values.signupType as string;
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
        signupType,
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
    const parsed = parseSignupImportCsv(await raw.text());
    const allowed = new Set(configuredTypes);
    const created: SignupRecord[] = [];
    const skipped = [...parsed.errors];
    const usedNames = new Set(data.map((item) => item.name));
    const usedPhones = new Set(data.map((item) => item.phone));
    parsed.rows.forEach((row) => {
      if (!allowed.has(row.signupType)) {
        skipped.push(`${row.name} 的报名类型不在该活动中`);
        return;
      }
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
  const batchStatus = (status: SignupRecord['status'], label: string) => {
    const targets = selected.filter((item) => item.status === '待审核');
    if (!targets.length) {
      message.info('已选报名均不是待审核状态');
      return;
    }
    const ids = new Set(targets.map((item) => item.id));
    patchRelated('signups', (list) => list.map((item) => (ids.has(item.id) ? { ...item, status } : item)));
    message.success(`已${label} ${targets.length} 条报名`);
    setSelectedRowKeys(selectedRowKeys.filter((key) => !ids.has(Number(key))));
  };
  const columns: TableColumnsType<SignupRecord> = [
    { title: '姓名', dataIndex: 'name', width: 110 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '报名类型', dataIndex: 'signupType', width: 120 },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: '报名时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          {record.status === '待审核' ? (
            <>
              <Button
                type="link"
                aria-label={`通过 ${record.name} 的报名`}
                onClick={() => {
                  patchRelated('signups', (list) => list.map((item) => (item.id === record.id ? { ...item, status: '已通过' } : item)));
                  message.success(`已通过「${record.name}」的报名`);
                }}
              >
                通过
              </Button>
              <Button type="link" aria-label={`驳回 ${record.name} 的报名`} onClick={() => rejectOne(record)}>
                驳回
              </Button>
            </>
          ) : null}
          <Button type="link" aria-label={`删除 ${record.name} 的报名`} onClick={() => deleteOne(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <RelatedTable
      activity={activity}
      meta={meta}
      onBack={onBack}
      query={
        <SearchPanel
          onSearch={() => {
            setQuery(draft);
            setSelectedRowKeys([]);
            message.success('查询完成');
          }}
          onReset={() => {
            const empty = { name: '', phone: '', createdAt: null as DateRange };
            setDraft(empty);
            setQuery(empty);
            setSelectedRowKeys([]);
          }}
        >
          <SearchField label="姓名">
            <Input allowClear placeholder="请输入姓名" value={draft.name} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))} />
          </SearchField>
          <SearchField label="手机号">
            <Input allowClear placeholder="请输入手机号" value={draft.phone} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, phone: event.target.value }))} />
          </SearchField>
          <SearchField label="报名类型">
            <Select allowClear placeholder="全部类型" value={draft.signupType} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, signupType: value }))} options={typeOptions} />
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加人员</Button>
          <Button icon={<UploadOutlined />} onClick={() => { setImportList([]); setImportOpen(true); }}>批量导入</Button>
        </Space>
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
                  modal.confirm({
                    title: `确认驳回已选 ${selectedRowKeys.length} 条报名？`,
                    content: '仅待审核记录会被驳回，报名人将无法参加该活动。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: () => batchStatus('已驳回', '驳回'),
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
          scroll={{ x: 1040 }}
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
              <Form.Item name="signupType" label="报名类型" rules={[{ required: true, message: '请选择报名类型' }]}>
                <Select options={optionsOf(configuredTypes)} placeholder="请选择报名类型" />
              </Form.Item>
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
              <Form.Item label="导入文件" extra="支持 csv。请按模板填写姓名、手机号、部门、报名类型，类型须为该活动已配置的报名类型。" required>
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
                  <Button type="link" style={{ paddingInline: 0 }} onClick={() => downloadSignupImportTemplate(configuredTypes)}>
                    下载导入模板
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </>
      }
    />
  );
}

function CommentList({ activity, onBack }: { activity: Activity; onBack: () => void }) {
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
  const meta = pageMeta['activity-comments'];
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
    { title: '评论内容', dataIndex: 'content' },
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
      width: 88,
      render: (_, record) => (
        <Button type="link" aria-label={`删除 ${record.author} 的评论`} onClick={() => deleteOne(record)}>
          删除
        </Button>
      ),
    },
  ];
  return (
    <RelatedTable
      activity={activity}
      meta={meta}
      onBack={onBack}
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
      toolbar={null}
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
  activity,
  meta,
  onBack,
  query,
  toolbar,
  batch,
  table,
  modal,
}: {
  activity: Activity;
  meta: { title: string; subtitle: string; noun: string };
  onBack: () => void;
  query: ReactNode;
  toolbar: ReactNode;
  batch: ReactNode;
  table: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="page-stack">
      <RelatedHeading activity={activity} title={meta.title} subtitle={meta.subtitle} onBack={onBack} />
      {query}
      <Card>
        {toolbar ? <div className="table-toolbar">{toolbar}</div> : null}
        {batch}
        {table}
      </Card>
      {modal}
    </div>
  );
}
