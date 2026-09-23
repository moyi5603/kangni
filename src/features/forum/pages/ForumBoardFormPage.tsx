import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Card, Empty, Form, Input, Radio, Select, Space, Switch, TreeSelect, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { COVER_IMAGE_UPLOAD_HINT, IMAGE_UPLOAD_ACCEPT, PORTRAIT_IMAGE_UPLOAD_HINT, SQUARE_IMAGE_UPLOAD_HINT } from '../../../shared/ui/imageUploadHint';
import { orgDepartmentTree, orgPeoplePickerTree } from '../../activities/model/activity';
import {
  draftFromBoard,
  enabledForumTagNames,
  forumPeoplePickerTree,
  FORUM_VISIBILITY_OPTIONS,
  MAILBOX_RESPONSE_SLA_OPTIONS,
  occupiedMailboxManagerNames,
  validateBoardDraft,
  withOccupiedMailboxManagers,
  type ForumKind,
  type ForumVisibility,
  type MailboxResponseSla,
} from '../model/forum';
import { getForumBoard, saveForumBoard, useForumBoards, useForumTags } from '../model/forumStore';

type FormValues = {
  name: string;
  description: string;
  rules: string;
  visibility: ForumVisibility;
  departments?: string[];
  customPeople?: string[];
  importFileName?: string;
  managers: string[];
  repliers?: string[];
  anonymous: boolean;
  headerImage?: string;
  icon?: string;
  tags?: string[];
  responseSlaEnabled?: boolean;
  responseSla?: MailboxResponseSla;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function downloadCrowdImportTemplate() {
  const lines = ['工号,姓名,部门', 'E1001,张悦,前端组', 'E1002,李明,前端组', 'E1003,陈产品,华东大区'];
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '可见人群导入模板.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function imageFileList(url: string | undefined, name: string): UploadFile[] {
  return url ? [{ uid: '-1', name, status: 'done', url, thumbUrl: url }] : [];
}

export function ForumBoardFormPage({
  kind,
  mode,
  recordId,
  onBack,
  onSaved,
}: {
  kind: ForumKind;
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { message, modal } = App.useApp();
  const boards = useForumBoards();
  const tagCatalog = useForumTags();
  const mailbox = kind === 'mailbox';
  const noun = mailbox ? '信箱' : '论坛';
  const editing = mode === 'edit' ? getForumBoard(Number(recordId)) : undefined;
  const initial = useMemo(() => (editing ? draftFromBoard(editing) : undefined), [editing]);
  const managerTree = useMemo(
    () =>
      mailbox
        ? withOccupiedMailboxManagers(forumPeoplePickerTree, occupiedMailboxManagerNames(boards, editing?.id))
        : forumPeoplePickerTree,
    [boards, editing?.id, mailbox],
  );
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [headerList, setHeaderList] = useState<UploadFile[]>(() => imageFileList(editing?.headerImage, '背景图'));
  const [iconList, setIconList] = useState<UploadFile[]>(() => imageFileList(editing?.icon, mailbox ? '信箱图片' : `${noun}图标`));
  const [importList, setImportList] = useState<UploadFile[]>(
    editing?.importFileName ? [{ uid: 'crowd', name: editing.importFileName }] : [],
  );
  const slaOn = Form.useWatch('responseSlaEnabled', form);
  const visibility = Form.useWatch('visibility', form) ?? initial?.visibility ?? '全员';
  const appTitle = mailbox ? '信箱' : '论坛';
  const tagOptions = enabledForumTagNames(tagCatalog, mailbox ? 'mailbox' : 'forum').map((name) => ({ value: name, label: name }));

  const leave = () => {
    if (!dirty) {
      onBack();
      return;
    }
    modal.confirm({
      title: '离开当前页？',
      content: '未保存的修改将丢失。',
      okText: '离开',
      cancelText: '继续编辑',
      onOk: onBack,
    });
  };

  if (mode === 'edit' && !editing) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: appTitle }, { title: `${noun}列表` }, { title: '记录不存在' }]} />
        <Card>
          <Empty description={`${noun}不存在或已删除`} />
          <Button onClick={onBack}>返回{noun}列表</Button>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    const values = await form.validateFields();
    const draft = {
      kind,
      name: values.name,
      description: values.description,
      rules: '',
      purpose: undefined,
      visibility: values.visibility,
      departments: values.visibility === '按部门' ? values.departments ?? [] : [],
      customPeople: values.visibility === '自定义人群' ? values.customPeople ?? [] : [],
      importFileName: values.visibility === '导入人群' ? values.importFileName ?? '' : '',
      importedPeople: values.visibility === '导入人群' ? editing?.importedPeople ?? [] : [],
      organizations: [],
      managers: values.managers ?? [],
      repliers: mailbox ? values.repliers ?? [] : undefined,
      anonymous: values.anonymous,
      headerImage: mailbox ? undefined : values.headerImage,
      icon: values.icon,
      tags: (values.tags ?? []).map((item) => item.trim()).filter(Boolean),
      responseSlaEnabled: mailbox ? Boolean(values.responseSlaEnabled) : undefined,
      responseSla: mailbox && values.responseSlaEnabled ? values.responseSla : undefined,
    };
    const fieldErrors = validateBoardDraft(draft);
    if (Object.keys(fieldErrors).length) {
      form.setFields(
        Object.entries(fieldErrors).map(([name, error]) => ({
          name: name as keyof FormValues,
          errors: [error as string],
        })),
      );
      return;
    }
    const result = saveForumBoard(draft, editing?.id);
    if (!result.ok) {
      message.error(result.error);
      if (result.error.includes('负责人')) {
        form.setFields([{ name: 'managers', errors: [result.error] }]);
      } else {
        form.setFields([{ name: 'name', errors: [result.error] }]);
      }
      return;
    }
    message.success(mode === 'create' ? `已创建${noun}` : `已保存${noun}`);
    setDirty(false);
    onSaved();
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: appTitle },
          { title: <Button type="link" className="breadcrumb-link" onClick={leave}>{`${noun}列表`}</Button> },
          { title: mode === 'create' ? `新建${noun}` : `编辑${noun}` },
        ]}
      />
      <Typography.Title level={1}>{mode === 'create' ? `新建${noun}` : `编辑${noun}`}</Typography.Title>
      <Card>
        <Form
          form={form}
          layout="horizontal"
          className="edit-form"
          onValuesChange={() => setDirty(true)}
          initialValues={{
            name: initial?.name ?? '',
            description: initial?.description ?? '',
            rules: initial?.rules ?? '',
            visibility: initial?.visibility ?? '全员',
            departments: initial?.departments ?? [],
            customPeople: initial?.customPeople ?? [],
            importFileName: initial?.importFileName ?? '',
            managers: mailbox ? (initial?.managers ?? []).slice(0, 1) : (initial?.managers ?? []),
            repliers: initial?.repliers ?? [],
            anonymous: initial?.anonymous ?? mailbox,
            headerImage: initial?.headerImage ?? '',
            icon: initial?.icon ?? '',
            tags: initial?.tags ?? [],
            responseSlaEnabled: initial?.responseSlaEnabled ?? false,
            responseSla: initial?.responseSla,
          }}
        >
          <>
              <Form.Item
                label={mailbox ? '信箱图片' : `${noun}图标`}
                extra={mailbox ? PORTRAIT_IMAGE_UPLOAD_HINT : SQUARE_IMAGE_UPLOAD_HINT}
                required={mode === 'create'}
              >
                <Upload
                  accept={IMAGE_UPLOAD_ACCEPT}
                  listType="picture-card"
                  maxCount={1}
                  fileList={iconList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => {
                    const file = fileList[0];
                    setIconList(fileList.slice(-1));
                    setDirty(true);
                    if (file?.originFileObj) {
                      const reader = new FileReader();
                      reader.onload = () => form.setFieldValue('icon', String(reader.result));
                      reader.readAsDataURL(file.originFileObj);
                    } else {
                      form.setFieldValue('icon', file?.url ?? '');
                    }
                  }}
                >
                  {iconList.length ? null : (
                    <button type="button" className="cover-upload-trigger" aria-label={mailbox ? '上传图片' : '上传图标'}>
                      <PlusOutlined />
                      <span>{mailbox ? '上传图片' : '上传图标'}</span>
                    </button>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item
                name="icon"
                hidden
                rules={mode === 'create' ? [{ required: true, message: mailbox ? '请上传信箱图片' : `请上传${noun}图标` }] : undefined}
              >
                <Input />
              </Form.Item>
              {mailbox ? null : (
                <>
              <Form.Item label="背景图" extra={COVER_IMAGE_UPLOAD_HINT} required={mode === 'create'}>
                <Upload
                  accept={IMAGE_UPLOAD_ACCEPT}
                  listType="picture-card"
                  maxCount={1}
                  fileList={headerList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => {
                    const file = fileList[0];
                    setHeaderList(fileList.slice(-1));
                    setDirty(true);
                    if (file?.originFileObj) {
                      const reader = new FileReader();
                      reader.onload = () => form.setFieldValue('headerImage', String(reader.result));
                      reader.readAsDataURL(file.originFileObj);
                    } else {
                      form.setFieldValue('headerImage', file?.url ?? '');
                    }
                  }}
                >
                  {headerList.length ? null : (
                    <button type="button" className="cover-upload-trigger" aria-label="上传背景图">
                      <PlusOutlined />
                      <span>上传背景图</span>
                    </button>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item
                name="headerImage"
                hidden
                rules={mode === 'create' ? [{ required: true, message: '请上传背景图' }] : undefined}
              >
                <Input />
              </Form.Item>
                </>
              )}
            </>
          <Form.Item name="name" label={mailbox ? '名称' : `${noun}名称`} rules={[{ required: true, message: mailbox ? '请输入名称' : `请输入${noun}名称` }]}>
            <Input placeholder={mailbox ? '请输入名称' : `请输入${noun}名称`} style={{ maxWidth: 360 }} />
          </Form.Item>
          <Form.Item name="description" label={`${noun}简介`} rules={[{ required: true, message: `请输入${noun}简介` }]}>
            <Input.TextArea rows={3} placeholder={`请输入${noun}简介`} />
          </Form.Item>
          <Form.Item name="visibility" label="可见范围" rules={[{ required: true, message: '请选择可见范围' }]}>
            <Radio.Group options={optionsOf(FORUM_VISIBILITY_OPTIONS)} />
          </Form.Item>
          {visibility === '按部门' ? (
            <Form.Item name="departments" label="选择部门" rules={[{ required: true, message: '请选择部门' }]}>
              <TreeSelect
                treeData={orgDepartmentTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请选择部门"
                style={{ width: '100%', maxWidth: 480 }}
              />
            </Form.Item>
          ) : null}
          {visibility === '自定义人群' ? (
            <Form.Item name="customPeople" label="选择人员" rules={[{ required: true, message: '请选择人员' }]}>
              <TreeSelect
                treeData={orgPeoplePickerTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请按组织架构选择人员"
                style={{ width: '100%', maxWidth: 480 }}
              />
            </Form.Item>
          ) : null}
          {visibility === '导入人群' ? (
            <>
              <Form.Item name="importFileName" hidden rules={[{ required: true, message: '请导入人群文件' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="导入人群" extra="支持 csv / xlsx。请按模板填写工号、姓名、部门。" required>
                <Space>
                  <Upload
                    accept=".csv,.xlsx"
                    maxCount={1}
                    fileList={importList}
                    beforeUpload={() => false}
                    onChange={({ fileList }) => {
                      setImportList(fileList.slice(-1));
                      form.setFieldValue('importFileName', fileList[0]?.name ?? '');
                      setDirty(true);
                    }}
                  >
                    <Button>上传文件</Button>
                  </Upload>
                  <Button type="link" style={{ paddingInline: 0 }} onClick={downloadCrowdImportTemplate}>
                    下载模板
                  </Button>
                </Space>
              </Form.Item>
            </>
          ) : null}
          <Form.Item
            name="managers"
            label={mailbox ? '负责人' : '管理员'}
            rules={[{ required: true, message: mailbox ? '请选择负责人' : '请选择管理员' }]}
            extra={mailbox ? '灰色项姓名后会标注「已负责其他信箱」，表示已占用，不可再选。' : undefined}
            getValueFromEvent={(value: string | string[] | undefined) => {
              if (mailbox) return value ? [value as string] : [];
              return (value as string[] | undefined) ?? [];
            }}
            getValueProps={(value: string[] | undefined) => ({ value: mailbox ? value?.[0] : value })}
          >
            <TreeSelect
              treeData={managerTree}
              treeCheckable={!mailbox}
              treeDefaultExpandAll
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              showSearch={{ treeNodeFilterProp: 'title' }}
              allowClear
              placeholder={mailbox ? '请选择负责人' : '请按组织架构选择人员'}
              style={{ width: '100%', maxWidth: 480 }}
            />
          </Form.Item>
          {mailbox ? (
            <Form.Item
              name="repliers"
              label="回复人"
            >
              <TreeSelect
                treeData={forumPeoplePickerTree}
                treeCheckable
                treeDefaultExpandAll
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                showSearch={{ treeNodeFilterProp: 'title' }}
                allowClear
                placeholder="请选择回复人"
                style={{ width: '100%', maxWidth: 480 }}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="tags"
            label={mailbox ? '标签' : '帖子标签'}
            extra={mailbox ? '回车添加，支持多个。' : '选项来自标签管理，仅启用中的标签可选，可多选。'}
          >
            <Select
              mode={mailbox ? 'tags' : 'multiple'}
              allowClear
              placeholder={mailbox ? '请输入标签' : '请选择帖子标签'}
              options={mailbox ? undefined : tagOptions}
              style={{ maxWidth: 480 }}
            />
          </Form.Item>
          <Form.Item
            name="anonymous"
            label="允许匿名"
            valuePropName="checked"
            extra={mailbox ? '开启后，用户可匿名提交建言。' : '开启后，用户可匿名发帖'}
          >
            <Switch />
          </Form.Item>
          {mailbox ? (
            <Form.Item label="响应时效" extra="开启后，时效到期前 1 小时会触发消息提醒。">
              <Space>
                <Form.Item name="responseSlaEnabled" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                {slaOn ? (
                  <Form.Item
                    name="responseSla"
                    noStyle
                    rules={[{ required: true, message: '请选择响应时效' }]}
                  >
                    <Select
                      placeholder="请选择"
                      style={{ width: 160 }}
                      options={MAILBOX_RESPONSE_SLA_OPTIONS.map((value) => ({ value, label: value }))}
                    />
                  </Form.Item>
                ) : null}
              </Space>
            </Form.Item>
          ) : null}
          <div className="sticky-form-actions">
            <Space>
              <Button type="primary" onClick={() => void submit()}>
                {mode === 'create' ? '创建' : '保存'}
              </Button>
              <Button onClick={leave}>取消</Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
