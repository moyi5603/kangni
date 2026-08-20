import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tooltip,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { TableColumnsType, UploadFile } from 'antd';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  grantPrizeBlockReason,
  orgPeopleByName,
  orgPeoplePickerTree,
  withDisabledPeople,
  type Activity,
} from '../model/activity';
import { addMedal, getMedal, useMedals, type Medal } from '../model/medalLibrary';
import { downloadPrizeImportTemplate, parsePrizeImportCsv } from '../model/prizeImport';
import { patchRelated, prizeTargetTypes, prizeTypes, useRelated, type PrizeRecord, type PrizeTargetType, type PrizeType } from '../model/related';

type GrantForm = {
  type: PrizeType;
  medalSource: '勋章库' | '上传图片';
  medalId?: string;
  medalName?: string;
  medalImageUrl?: string;
  targetType: PrizeTargetType;
  people?: string[];
};

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function grantKey(name: string, phone: string, medalName: string) {
  return `${name}|${phone}|${medalName}`;
}

type MedalOption = { value: string; label: string; imageUrl: string };

function MedalSelect({
  value,
  onChange,
  medals,
}: {
  value?: string;
  onChange?: (value?: string) => void;
  medals: Medal[];
}) {
  const options: MedalOption[] = medals.map((medal) => ({ value: medal.id, label: medal.name, imageUrl: medal.imageUrl }));
  return (
    <Select
      value={value}
      onChange={onChange}
      allowClear
      showSearch={{ optionFilterProp: 'label' }}
      placeholder="请搜索或选择勋章"
      options={options}
      optionRender={(option) => (
        <Flex align="center" gap={8}>
          <img src={(option.data as MedalOption).imageUrl} alt="" width={32} height={32} />
          <span>{option.data.label}</span>
        </Flex>
      )}
      labelRender={(props) => {
        const medal = medals.find((item) => item.id === props.value);
        if (!medal) return props.label;
        return (
          <Flex align="center" gap={8}>
            <img src={medal.imageUrl} alt="" width={20} height={20} />
            <span>{medal.name}</span>
          </Flex>
        );
      }}
      style={{ width: '100%' }}
    />
  );
}

export function ActivityPrizeListPage({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const { message } = App.useApp();
  const data = useRelated('prizes', activity.id);
  const signups = useRelated('signups', activity.id);
  const medals = useMedals();
  const [draft, setDraft] = useState<{
    name: string;
    phone: string;
  }>({ name: '', phone: '' });
  const [query, setQuery] = useState(draft);
  const [open, setOpen] = useState(false);
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<GrantForm>();
  const medalSource = Form.useWatch('medalSource', form);
  const prizeType = Form.useWatch('type', form);
  const targetType = Form.useWatch('targetType', form);
  const medalId = Form.useWatch('medalId', form);
  const medalNameWatch = Form.useWatch('medalName', form);
  const approvedSignups = useMemo(() => signups.filter((item) => item.status === '已通过'), [signups]);
  const activeMedalName =
    medalSource === '上传图片' ? medalNameWatch?.trim() : medals.find((item) => item.id === medalId)?.name;
  const grantedNames = useMemo(() => {
    if (!activeMedalName) return new Set<string>();
    return new Set(
      data.filter((item) => item.medalName === activeMedalName).map((item) => item.name),
    );
  }, [activeMedalName, data]);
  const peopleTree = useMemo(() => withDisabledPeople(orgPeoplePickerTree, grantedNames), [grantedNames]);
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.name || item.name.includes(query.name)) &&
          (!query.phone || item.phone.includes(query.phone)),
      ),
    [data, query],
  );
  const hasFilter = Boolean(query.name || query.phone);

  const grantBlocked = grantPrizeBlockReason(activity);
  const openGrant = () => {
    if (grantBlocked) {
      message.info(grantBlocked);
      return;
    }
    setUploadList([]);
    setImportList([]);
    setOpen(true);
  };

  const closeGrant = () => {
    setOpen(false);
    setUploadList([]);
    setImportList([]);
  };

  const resolveMedal = async (values: GrantForm): Promise<Medal | undefined> => {
    if (values.medalSource === '勋章库') {
      if (!values.medalId) {
        form.setFields([{ name: 'medalId', errors: ['请选择勋章'] }]);
        return undefined;
      }
      const medal = getMedal(values.medalId);
      if (!medal) {
        form.setFields([{ name: 'medalId', errors: ['请选择勋章'] }]);
        return undefined;
      }
      return medal;
    }
    const name = values.medalName?.trim() ?? '';
    const imageUrl = values.medalImageUrl ?? '';
    if (!name) {
      form.setFields([{ name: 'medalName', errors: ['请输入勋章名称'] }]);
      return undefined;
    }
    if (!imageUrl) {
      form.setFields([{ name: 'medalImageUrl', errors: ['请上传勋章图片'] }]);
      return undefined;
    }
    return { id: `upload-${Date.now()}`, name, imageUrl };
  };

  const collectPeople = async (values: GrantForm, medal: Medal): Promise<{ people: { name: string; phone: string; department: string }[]; skipped: string[] } | undefined> => {
    const existing = new Set(data.filter((item) => item.medalName === medal.name).map((item) => grantKey(item.name, item.phone, item.medalName)));
    const skipped: string[] = [];
    const people: { name: string; phone: string; department: string }[] = [];
    const push = (person: { name: string; phone: string; department: string }) => {
      const key = grantKey(person.name, person.phone, medal.name);
      if (existing.has(key) || people.some((item) => grantKey(item.name, item.phone, medal.name) === key)) {
        skipped.push(`${person.name}已获得该勋章`);
        return;
      }
      people.push(person);
    };
    if (values.targetType === '全部报名人员') {
      if (!approvedSignups.length) {
        message.info('该活动暂无已通过报名人员，未发放');
        return undefined;
      }
      approvedSignups.forEach((item) => push({ name: item.name, phone: item.phone, department: item.department }));
      return { people, skipped };
    }
    if (values.targetType === '指定人员') {
      const names = values.people ?? [];
      if (!names.length) {
        form.setFields([{ name: 'people', errors: ['请选择发放人员'] }]);
        return undefined;
      }
      names.forEach((name) => {
        const person = orgPeopleByName[name];
        if (!person) {
          skipped.push(`${name}不在组织中`);
          return;
        }
        push(person);
      });
      return { people, skipped };
    }
    const file = importList[0];
    const raw = file?.originFileObj;
    if (!raw) {
      message.error('请上传导入文件。当前未改动发放记录，可重新选择文件后重试。');
      return undefined;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.error('演示环境请下载 CSV 模板后导入。当前未改动发放记录。');
      return undefined;
    }
    const parsed = parsePrizeImportCsv(await raw.text());
    skipped.push(...parsed.errors);
    parsed.rows.forEach((row) => {
      const org = orgPeopleByName[row.name];
      push({
        name: row.name,
        phone: org?.phone && org.phone === row.phone ? org.phone : row.phone,
        department: org?.department ?? row.department,
      });
    });
    return { people, skipped };
  };

  const saveGrant = async () => {
    if (grantBlocked) {
      message.info(grantBlocked);
      return;
    }
    const values = await form.validateFields();
    const medal = await resolveMedal(values);
    if (!medal) return;
    const collected = await collectPeople(values, medal);
    if (!collected) return;
    const { people, skipped } = collected;
    if (!people.length) {
      message.info(skipped.length ? `未发放：${skipped.slice(0, 3).join('；')}` : '没有可发放人员');
      return;
    }
    const savedMedal = values.medalSource === '上传图片' ? addMedal(medal.name, medal.imageUrl) : medal;
    const created: PrizeRecord[] = people.map((person, index) => ({
      id: Date.now() + index,
      activityId: activity.id,
      name: person.name,
      phone: person.phone,
      department: person.department,
      medalId: savedMedal.id,
      medalName: savedMedal.name,
      medalImageUrl: savedMedal.imageUrl,
      type: values.type,
      targetType: values.targetType,
      createdAt: nowText(),
    }));
    patchRelated('prizes', (list) => [...created, ...list]);
    message.success(
      skipped.length
        ? `已发放 ${created.length} 人，跳过 ${skipped.length} 人：${skipped.slice(0, 3).join('；')}`
        : `已发放 ${created.length} 人`,
    );
    closeGrant();
  };

  const columns: TableColumnsType<PrizeRecord> = [
    { title: '姓名', dataIndex: 'name', width: 110 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '类型', dataIndex: 'type', width: 90 },
    {
      title: '奖品信息',
      key: 'medal',
      render: (_, record) => (
        <Flex align="center" gap={8}>
          {record.medalImageUrl ? <Image src={record.medalImageUrl} width={32} height={32} alt={record.medalName} /> : null}
          <span>{record.medalName}</span>
        </Flex>
      ),
    },
    { title: '发放对象', dataIndex: 'targetType', width: 130 },
    { title: '发放时间', dataIndex: 'createdAt', width: 180 },
  ];

  return (
    <div className="page-stack">
      <div className="list-page-heading">
        <Breadcrumb
          separator=">"
          items={[
            { title: '活动' },
            { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>活动管理</Button> },
            { title: activity.title },
            { title: '奖品发放' },
          ]}
        />
        <Flex align="baseline" gap={16} wrap="wrap">
          <Typography.Title level={1}>奖品发放</Typography.Title>
          <Typography.Text type="secondary">按人员发放奖励。仅已结束且已发布的活动可以发放。</Typography.Text>
        </Flex>
      </div>
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
        onReset={() => {
          const empty = { name: '', phone: '' };
          setDraft(empty);
          setQuery(empty);
        }}
      >
        <SearchField label="姓名">
          <Input allowClear placeholder="请输入姓名" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </SearchField>
        <SearchField label="手机号">
          <Input allowClear placeholder="请输入手机号" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          {grantBlocked ? (
            <Tooltip title={grantBlocked}>
              <span>
                <Button type="primary" disabled icon={<PlusOutlined />}>
                  发放奖励
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={openGrant}>
              发放奖励
            </Button>
          )}
        </div>
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1080 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasFilter ? '没有符合条件的发放记录' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Drawer
        title="发放奖励"
        open={open}
        onClose={closeGrant}
        width={b2bStandards.form.drawerWidth}
        destroyOnHidden
        afterOpenChange={(visible) => {
          if (visible) form.resetFields();
        }}
        footer={
          <Space>
            <Button type="primary" onClick={() => void saveGrant()}>
              确认
            </Button>
            <Button onClick={closeGrant}>取消</Button>
          </Space>
        }
      >
        <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur" initialValues={{ type: '勋章', medalSource: '勋章库', targetType: '全部报名人员', people: [] }}>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={prizeTypes.map((value) => ({ value, label: value }))} placeholder="请选择类型" />
          </Form.Item>
          {prizeType === '勋章' || prizeType == null ? (
            <>
          <Form.Item name="medalSource" label="勋章来源" rules={[{ required: true, message: '请选择勋章来源' }]}>
            <Radio.Group
              options={[
                { value: '勋章库', label: '勋章库' },
                { value: '上传图片', label: '上传图片' },
              ]}
            />
          </Form.Item>
          {medalSource !== '上传图片' ? (
            <Form.Item name="medalId" label="选择勋章" extra="勋章较多时可输入名称搜索。" rules={[{ required: true, message: '请选择勋章' }]}>
              <MedalSelect medals={medals} />
            </Form.Item>
          ) : (
            <>
              <Form.Item name="medalName" label="勋章名称" rules={[{ required: true, message: '请输入勋章名称' }, { max: 20, message: '勋章名称不超过 20 个字' }]}>
                <Input maxLength={20} showCount placeholder="请输入勋章名称" />
              </Form.Item>
              <Form.Item label="勋章图片" extra="上传后会加入勋章库，下次可直接选用。" required>
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  maxCount={1}
                  fileList={uploadList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => {
                    const file = fileList[0];
                    setUploadList(fileList.slice(-1));
                    if (file?.originFileObj) {
                      const reader = new FileReader();
                      reader.onload = () => form.setFieldValue('medalImageUrl', String(reader.result));
                      reader.readAsDataURL(file.originFileObj);
                    } else {
                      form.setFieldValue('medalImageUrl', file?.url ?? '');
                    }
                  }}
                >
                  {uploadList.length ? null : (
                    <button type="button" className="cover-upload-trigger">
                      <PlusOutlined />
                      <span>上传</span>
                    </button>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item name="medalImageUrl" hidden rules={[{ required: true, message: '请上传勋章图片' }]}>
                <Input />
              </Form.Item>
            </>
          )}
            </>
          ) : null}
          <Form.Item
            name="targetType"
            label="发放对象"
            extra={targetType === '全部报名人员' ? `发给本活动已通过报名人员，当前 ${approvedSignups.length} 人。已获得该勋章的人会跳过。` : undefined}
            rules={[{ required: true, message: '请选择发放对象' }]}
          >
            <Radio.Group orientation="vertical" options={prizeTargetTypes.map((value) => ({ value, label: value }))} />
          </Form.Item>
          {targetType === '指定人员' ? (
            <Form.Item name="people" label="选择人员" rules={[{ required: true, type: 'array', min: 1, message: '请选择发放人员' }]}>
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
          ) : null}
          {targetType === '批量导入' ? (
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
                <Button type="link" style={{ paddingInline: 0 }} onClick={downloadPrizeImportTemplate}>
                  下载导入模板
                </Button>
              </Space>
            </Form.Item>
          ) : null}
        </Form>
      </Drawer>
    </div>
  );
}
