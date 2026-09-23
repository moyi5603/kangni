import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, Input, Modal, Radio, Switch, Table, Tabs, Tag, TreeSelect, Upload } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { IMAGE_UPLOAD_ACCEPT, SQUARE_IMAGE_UPLOAD_HINT } from '../../../shared/ui/imageUploadHint';
import { CARE_POSTERS, orderedEmojis, type CareEmoji } from '../model/care';
import { moveEmoji, removeEmoji, saveEmoji, setDisplaySettings, useDisplaySettings, useEmojis, useEmployees } from '../model/careStore';

export function CareSettingsPage() {
  const { message, modal } = App.useApp();
  const settings = useDisplaySettings();
  const emojis = orderedEmojis(useEmojis());
  const employees = useEmployees();
  const [form] = Form.useForm();
  const [emojiForm] = Form.useForm<Pick<CareEmoji, 'name' | 'defaultCopy' | 'status'>>();
  const [editing, setEditing] = useState<CareEmoji | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const hideExecutives = Form.useWatch('hideExecutives', form) ?? settings.hideExecutives;

  const treeData = [
    {
      title: '悦享科技',
      value: 'company-root',
      selectable: false,
      disableCheckbox: true,
      children: Array.from(new Set(employees.map((item) => item.department))).map((department) => ({
        title: department,
        value: `department-${department}`,
        selectable: false,
        disableCheckbox: true,
        children: employees.filter((item) => item.department === department).map((item) => ({ title: item.name, value: item.name })),
      })),
    },
  ];

  const columns: TableColumnsType<CareEmoji> = [
    { title: '表情名称', dataIndex: 'name', width: 150 },
    {
      title: '表情图片',
      dataIndex: 'image',
      width: 100,
      render: (value: string, record) => <img src={value} alt={`${record.name}表情`} width={48} height={48} style={{ objectFit: 'cover', display: 'block' }} />,
    },
    { title: '默认文案', dataIndex: 'defaultCopy', ellipsis: true, render: (value: string) => <TableEllipsisText text={value} /> },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: CareEmoji['status']) => <Tag color={value === '启用' ? 'success' : 'default'}>{value}</Tag> },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      align: 'right',
      render: (_, record) => {
        const index = emojis.findIndex((item) => item.id === record.id);
        return (
        <TableRowActions
          moreAriaLabel={`更多操作 ${record.name}`}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑表情 ${record.name}`,
              onClick: () => {
                setEditing(record);
                emojiForm.setFieldsValue(record);
              },
            },
            {
              key: 'up',
              label: '上移',
              ariaLabel: `上移表情 ${record.name}`,
              disabled: index <= 0,
              onClick: () => {
                if (moveEmoji(record.id, 'up')) message.success('已上移');
              },
            },
            {
              key: 'down',
              label: '下移',
              ariaLabel: `下移表情 ${record.name}`,
              disabled: index >= emojis.length - 1,
              onClick: () => {
                if (moveEmoji(record.id, 'down')) message.success('已下移');
              },
            },
            {
              key: 'delete',
              label: '删除',
              danger: true,
              ariaLabel: `删除表情 ${record.name}`,
              onClick: () => {
                modal.confirm({
                  title: `确认删除表情「${record.name}」？`,
                  content: '删除后 C 端将不再展示该表情。',
                  okText: '确认删除',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => {
                    removeEmoji(record.id);
                    message.success('表情已删除');
                  },
                });
              },
            },
          ]}
        />
        );
      },
    },
  ];

  const openCreate = () => {
    setEditing(null);
    setCreateOpen(true);
    emojiForm.setFieldsValue({ name: '', defaultCopy: '', status: '启用' });
  };

  const saveCurrent = async () => {
    const values = await emojiForm.validateFields();
    saveEmoji({
      id: editing?.id ?? '',
      image: editing?.image ?? CARE_POSTERS.birthday,
      fileName: editing?.fileName ?? `${values.name}.png`,
      updatedAt: editing?.updatedAt ?? '',
      ...values,
      sort: editing?.sort ?? Math.max(0, ...emojis.map((item) => item.sort)) + 10,
      status: values.status ?? '启用',
    });
    message.success(editing ? '表情已更新' : '表情已新增');
    setEditing(null);
    setCreateOpen(false);
  };

  return (
    <div className="page-stack">
      <ListPageHeading paths={['员工关怀', '关怀设置']} title="关怀设置" subtitle="统一管理名单展示及同事关怀表情。" />
      <Card>
        <Tabs
          items={[
            {
              key: 'leaderboard-settings',
              label: '名单展示设置',
              children: (
                <Form
                  form={form}
                  layout="horizontal"
                  className="edit-form"
                  initialValues={settings}
                  onValuesChange={(_, all) =>
                    setDisplaySettings({
                      hideExecutives: all.hideExecutives,
                      hiddenExecutiveNames: all.hiddenExecutiveNames ?? [],
                      birthdayLeaderboardVisible: all.birthdayLeaderboardVisible,
                      anniversaryLeaderboardVisible: all.anniversaryLeaderboardVisible,
                      partyLeaderboardVisible: all.partyLeaderboardVisible,
                    })
                  }
                >
                  <p>调整后立即生效，用于控制 C 端名单展示范围</p>
                  <Form.Item name="hideExecutives" label="隐藏高管信息" valuePropName="checked" extra="开启后，所选高管不在 C 端任何名单中展示。">
                    <Switch />
                  </Form.Item>
                  {hideExecutives ? (
                    <Form.Item name="hiddenExecutiveNames" label="选择高管">
                      <TreeSelect
                        treeData={treeData}
                        treeCheckable
                        showCheckedStrategy={TreeSelect.SHOW_CHILD}
                        treeDefaultExpandAll
                        allowClear
                        maxTagCount="responsive"
                        placeholder="请从公司结构树中选择高管"
                        style={{ maxWidth: 480 }}
                      />
                    </Form.Item>
                  ) : null}
                  <Form.Item name="birthdayLeaderboardVisible" label="生日名单" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="anniversaryLeaderboardVisible" label="周年名单" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="partyLeaderboardVisible" label="入党纪念" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'emoji-settings',
              label: '同事关怀表情',
              forceRender: true,
              children: (
                <>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 16 }}>
                    <span>
                      共 {emojis.length} 个表情，已启用 {emojis.filter((item) => item.status === '启用').length} 个
                    </span>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                      新建
                    </Button>
                  </Flex>
                  <Table<CareEmoji>
                    rowKey="id"
                    columns={columns}
                    dataSource={emojis}
                    scroll={{ x: 980 }}
                    pagination={false}
                    locale={{ emptyText: <Empty description="暂无同事关怀表情" /> }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title={editing ? '编辑表情' : '新建表情'}
        open={createOpen || Boolean(editing)}
        onCancel={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        width={640}
        destroyOnHidden
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button
              onClick={() => {
                setCreateOpen(false);
                setEditing(null);
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={saveCurrent}>
              确定
            </Button>
          </Flex>
        }
      >
        <Form form={emojiForm} layout="horizontal" className="edit-form">
          <CareEmojiFormFields image={editing ? { name: editing.fileName, url: editing.image } : undefined} />
        </Form>
      </Modal>
    </div>
  );
}

export function CareEmojiFormFields({ image }: { image?: { name: string; url: string } }) {
  return (
    <>
      <Form.Item name="name" label="表情名称" rules={[{ required: true, message: '请输入表情名称' }]}>
        <Input placeholder="请输入表情名称" style={{ maxWidth: 320 }} />
      </Form.Item>
      <Form.Item label="表情图片" extra={SQUARE_IMAGE_UPLOAD_HINT}>
        <Upload
          accept={IMAGE_UPLOAD_ACCEPT}
          listType="picture-card"
          maxCount={1}
          beforeUpload={() => false}
          defaultFileList={image ? [{ uid: '-1', name: image.name, status: 'done', url: image.url }] : []}
        >
          <div>
            <PlusOutlined />
            <div>上传</div>
          </div>
        </Upload>
      </Form.Item>
      <Form.Item name="defaultCopy" label="默认文案" extra="员工选中该表情后自动带入" rules={[{ required: true, message: '请输入选中该表情时自动带入的祝福' }]}>
        <Input.TextArea rows={2} placeholder="请输入选中该表情时自动带入的祝福" />
      </Form.Item>
      <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
        <Radio.Group
          options={[
            { value: '启用', label: '启用' },
            { value: '停用', label: '停用' },
          ]}
        />
      </Form.Item>
    </>
  );
}
