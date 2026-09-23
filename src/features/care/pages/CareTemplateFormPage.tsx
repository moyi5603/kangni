import { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Card, ConfigProvider, Form, Input, Select, Space, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { RichTextField, type RichTextFieldHandle } from '../../activities/components/RichTextField';
import {
  SCENE_OPTIONS,
  cardBlessingPlain,
  cardVariablesForType,
  emptyTemplateDraft,
  isPersonalType,
  type CareTemplate,
  type CareType,
} from '../model/care';
import { getTemplate, saveTemplate } from '../model/careStore';
import { CareCardPreview, DEFAULT_CARD_TEXT_OFFSET } from './CareCardPreview';

type FormValues = Omit<CareTemplate, 'id'>;
type ContentTab = 'employee-message' | 'card' | 'colleague-message';

function toFileList(url: string, name: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: '-1', name, status: 'done', url, thumbUrl: url }];
}

function filePreviewUrl(list: UploadFile[]) {
  const file = list[0];
  if (!file) return '';
  return file.url || file.thumbUrl || '';
}

function onPickImage(setList: (list: UploadFile[]) => void) {
  return ({ fileList }: { fileList: UploadFile[] }) => {
    const next = fileList.slice(-1);
    setList(next);
    const file = next[0];
    if (file?.originFileObj) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        setList(next.map((item) => ({ ...item, url, thumbUrl: url })));
      };
      reader.readAsDataURL(file.originFileObj);
    }
  };
}

export function CareTemplateFormPage({
  mode,
  recordId,
  onBack,
  onSaved,
  onEdit,
}: {
  mode: 'create' | 'edit' | 'view';
  recordId?: string;
  onBack: () => void;
  onSaved?: () => void;
  onEdit?: (id: string) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const readOnly = mode === 'view';
  const existing = (mode === 'edit' || mode === 'view') && recordId ? getTemplate(recordId) : undefined;
  const [type, setType] = useState<CareType>(existing?.type ?? '生日关怀');
  const [contentTab, setContentTab] = useState<ContentTab>('employee-message');
  const [coverList, setCoverList] = useState<UploadFile[]>(() => toFileList(existing?.coverImage ?? '', '贺卡底图'));
  const [pushList, setPushList] = useState<UploadFile[]>(() => toFileList(existing?.employeeCover ?? '', '消息封面'));
  const [colleagueList, setColleagueList] = useState<UploadFile[]>(() => toFileList(existing?.colleagueCover ?? '', '同事祝福封面'));
  const [textOffset, setTextOffset] = useState(() => ({
    x: existing?.blessingOffsetX ?? DEFAULT_CARD_TEXT_OFFSET.x,
    y: existing?.blessingOffsetY ?? DEFAULT_CARD_TEXT_OFFSET.y,
  }));
  const blessingEditorRef = useRef<RichTextFieldHandle>(null);
  const variables = cardVariablesForType(type);

  const insertVariable = (token: string) => {
    blessingEditorRef.current?.insertText(token);
  };

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && recordId && !existing) {
      message.error('关怀模板不存在');
      onBack();
    }
  }, [mode, recordId, existing, message, onBack]);

  const personal = isPersonalType(type);
  const contentTabs: { key: ContentTab; label: string }[] = [
    { key: 'employee-message', label: '祝福消息推送' },
    { key: 'card', label: '贺卡' },
    ...(personal ? [{ key: 'colleague-message' as const, label: '提醒消息推送' }] : []),
  ];

  const submit = async () => {
    const values = await form.validateFields();
    const cover = filePreviewUrl(coverList) || existing?.coverImage || '';
    if (!cover) {
      message.error('请上传贺卡底图');
      return;
    }
    saveTemplate({
      ...(existing ?? emptyTemplateDraft(type)),
      ...values,
      type,
      coverImage: cover,
      employeeCover: filePreviewUrl(pushList) || existing?.employeeCover || '',
      colleagueCover: filePreviewUrl(colleagueList) || values.colleagueCover || '',
      blessingOffsetX: textOffset.x,
      blessingOffsetY: textOffset.y,
      signature: '',
    });
    message.success(mode === 'create' ? '关怀模板已创建' : '关怀模板已更新');
    onSaved?.();
  };

  const initial = existing ?? emptyTemplateDraft('生日关怀');
  const pageTitle = mode === 'create' ? '新建关怀模板' : readOnly ? '关怀模板详情' : '编辑关怀模板';
  const crumbTitle = mode === 'create' ? '新建模板' : readOnly ? '模板详情' : '编辑模板';

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '员工关怀' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>关怀模板</Button> },
          { title: crumbTitle },
        ]}
      />
      <div>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {pageTitle}
        </Typography.Title>
        <Typography.Text type="secondary">{personal ? '统一配置祝福消息推送、贺卡与提醒消息推送内容' : '统一配置祝福消息推送与贺卡内容'}</Typography.Text>
      </div>
      <Form form={form} layout="horizontal" className="edit-form" initialValues={initial} disabled={readOnly} scrollToFirstError={{ focus: true }}>
        <Card title="基础信息">
          <Form.Item label="关怀场景" required>
            <Select options={SCENE_OPTIONS} value={type} onChange={setType} style={{ maxWidth: 320 }} placeholder="请选择关怀场景" disabled={readOnly} />
          </Form.Item>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }, { max: 50 }]}>
            <Input placeholder="请输入模板名称" maxLength={50} showCount style={{ maxWidth: 480 }} />
          </Form.Item>
        </Card>
        <Card className="care-template-content-card" styles={{ body: { padding: 0 } }}>
          <div className="care-template-content">
            <aside className="care-msg-preview" aria-label="模板预览">
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const title = String(form.getFieldValue('employeeTitle') ?? initial.employeeTitle ?? '').trim();
                  const summary = String(form.getFieldValue('employeeSummary') ?? initial.employeeSummary ?? '').trim();
                  const blessing = String(form.getFieldValue('blessing') ?? initial.blessing ?? '').trim();
                  const colleagueTitle = String(form.getFieldValue('colleagueTitle') ?? initial.colleagueTitle ?? '').trim();
                  const colleagueSummary = String(form.getFieldValue('colleagueSummary') ?? initial.colleagueSummary ?? '').trim();
                  const pushCover = filePreviewUrl(pushList);
                  const cardCover = filePreviewUrl(coverList);
                  const colleagueCover = filePreviewUrl(colleagueList);
                  if (contentTab === 'card') {
                    return (
                      <>
                        <div className="care-msg-preview__heading">贺卡预览</div>
                        <CareCardPreview
                          cover={cardCover}
                          blessing={blessing}
                          offset={textOffset}
                          onOffsetChange={readOnly ? undefined : setTextOffset}
                        />
                      </>
                    );
                  }
                  if (contentTab === 'colleague-message') {
                    return (
                      <>
                        <div className="care-msg-preview__heading">提醒消息推送预览</div>
                        <div className="care-msg-preview__card">
                          {colleagueCover ? (
                            <img className="care-msg-preview__cover-img" src={colleagueCover} alt="同事祝福封面预览" />
                          ) : (
                            <div className="care-msg-preview__cover-empty">请上传提醒消息推送封面图</div>
                          )}
                          <div className="care-preview-title">{colleagueTitle || '填写消息标题'}</div>
                          <div className="care-preview-summary">{colleagueSummary || '填写消息副标题后将在这里实时预览'}</div>
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <div className="care-msg-preview__heading">祝福消息推送预览</div>
                      <div className="care-msg-preview__card">
                        {pushCover ? (
                          <img className="care-msg-preview__cover-img" src={pushCover} alt="消息封面预览" />
                        ) : (
                          <div className="care-msg-preview__cover-empty">请上传消息封面图</div>
                        )}
                        <div className="care-preview-title">{title || '填写消息标题'}</div>
                        <div className="care-preview-summary">{summary || '填写消息副标题后将在这里实时预览'}</div>
                      </div>
                    </>
                  );
                }}
              </Form.Item>
            </aside>
            <div className="care-template-fields">
              <div className="care-msg-preview__heading">模板内容</div>
              <div className="care-template-tablist" role="tablist" aria-label="模板内容分类">
                {contentTabs.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={contentTab === item.key}
                    className={contentTab === item.key ? 'is-active' : undefined}
                    onClick={() => setContentTab(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div hidden={contentTab !== 'employee-message'}>
                <Typography.Title level={5} className="care-template-section-title">
                  祝福消息推送模板
                </Typography.Title>
                <Form.Item label="封面图" extra={readOnly ? undefined : '建议尺寸 1068 × 455 px；支持 png/jpg/jpeg，大小不超过 5MB'} required>
                  <Upload
                    accept=".png,.jpg,.jpeg"
                    listType="picture-card"
                    maxCount={1}
                    fileList={pushList}
                    beforeUpload={() => false}
                    onChange={onPickImage(setPushList)}
                    disabled={readOnly}
                    showUploadList={{ showRemoveIcon: !readOnly }}
                  >
                    {readOnly || pushList.length ? null : (
                      <div>
                        <PlusOutlined />
                        <div>上传消息封面图</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
                <Form.Item name="employeeTitle" label="标题" rules={[{ required: true, message: '请输入消息标题' }, { max: 64 }]}>
                  <Input placeholder="请输入消息标题" maxLength={64} showCount style={{ maxWidth: 560 }} />
                </Form.Item>
                <Form.Item name="employeeSummary" label="副标题" rules={[{ required: true, message: '请输入消息副标题' }, { max: 120 }]}>
                  <Input.TextArea rows={2} placeholder="请输入消息副标题" maxLength={120} showCount style={{ maxWidth: 560 }} />
                </Form.Item>
              </div>
              <div hidden={contentTab !== 'card'}>
                <Form.Item label="贺卡底图" extra={readOnly ? undefined : '请上传竖版贺卡底图'} required>
                  <Upload
                    accept=".png,.jpg,.jpeg"
                    listType="picture-card"
                    maxCount={1}
                    fileList={coverList}
                    beforeUpload={() => false}
                    onChange={onPickImage(setCoverList)}
                    disabled={readOnly}
                    showUploadList={{ showRemoveIcon: !readOnly }}
                  >
                    {readOnly || coverList.length ? null : (
                      <div>
                        <PlusOutlined />
                        <div>上传贺卡底图</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
                <Form.Item
                  label="贺卡文案"
                  extra={readOnly ? undefined : '可把变量插到光标处；可用工具栏做加粗、颜色和对齐。预览中可拖动整段文案调整位置'}
                  required
                >
                  {!readOnly && variables.length ? (
                    <Space wrap size={8} style={{ marginBottom: 8, display: 'flex' }}>
                      <Typography.Text type="secondary">插入变量</Typography.Text>
                      {variables.map((item) => (
                        <Button key={item.token} size="small" onClick={() => insertVariable(item.token)}>
                          {item.token}
                        </Button>
                      ))}
                    </Space>
                  ) : null}
                  <Form.Item
                    name="blessing"
                    noStyle
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (!cardBlessingPlain(String(value ?? ''))) {
                            throw new Error('请输入贺卡文案');
                          }
                        },
                      },
                    ]}
                  >
                    <RichTextField
                      ref={blessingEditorRef}
                      variant="simple"
                      disabled={readOnly}
                      ariaLabel="贺卡文案"
                      placeholder="请输入贺卡文案"
                    />
                  </Form.Item>
                </Form.Item>
              </div>
              {personal ? (
                <div hidden={contentTab !== 'colleague-message'}>
                  <Form.Item label="封面图" extra={readOnly ? undefined : '建议尺寸 1068 × 455 px；支持 png/jpg/jpeg，大小不超过 5MB'}>
                    <Upload
                      accept=".png,.jpg,.jpeg"
                      listType="picture-card"
                      maxCount={1}
                      fileList={colleagueList}
                      beforeUpload={() => false}
                      onChange={onPickImage(setColleagueList)}
                      disabled={readOnly}
                      showUploadList={{ showRemoveIcon: !readOnly }}
                    >
                      {readOnly || colleagueList.length ? null : (
                        <div>
                          <PlusOutlined />
                          <div>上传提醒消息推送封面图</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                  <Form.Item name="colleagueTitle" label="标题" rules={[{ required: true, message: '请输入提醒消息推送标题' }, { max: 64 }]}>
                    <Input placeholder="请输入提醒消息推送标题" maxLength={64} showCount style={{ maxWidth: 560 }} />
                  </Form.Item>
                  <Form.Item name="colleagueSummary" label="副标题" rules={[{ required: true, message: '请输入提醒消息推送副标题' }, { max: 120 }]}>
                    <Input.TextArea rows={2} placeholder="请输入提醒消息推送副标题" maxLength={120} showCount style={{ maxWidth: 560 }} />
                  </Form.Item>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
        <ConfigProvider componentDisabled={false}>
        <div className="sticky-form-actions">
          <Space>
            {readOnly ? (
              <>
                <Button type="primary" onClick={() => existing && onEdit?.(existing.id)}>
                  编辑模板
                </Button>
                <Button onClick={onBack}>返回</Button>
              </>
            ) : (
              <>
                <Button onClick={onBack}>返回</Button>
                <Button type="primary" onClick={submit}>
                  保存
                </Button>
              </>
            )}
          </Space>
        </div>
        </ConfigProvider>
      </Form>
    </div>
  );
}
