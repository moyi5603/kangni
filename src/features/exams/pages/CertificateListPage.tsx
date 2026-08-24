import { useMemo, useState, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { CertificatePreview } from '../components/CertificatePreview';
import {
  certificateCoverThemes,
  certificateCoverThemeStyle,
  certificateValidityTypes,
  type CertificateCoverTheme,
  type CertificateRecord,
  type CertificateValidityType,
} from '../model/certificate';
import { getCertificate, removeCertificate, upsertCertificate, useCertificates } from '../model/certificateStore';
import { useExams } from '../model/examStore';

type FormValues = {
  name: string;
  coverTheme: CertificateCoverTheme;
  numberRule: string;
  issuer: string;
  description: string;
  watermarkText: string;
  validityType: CertificateValidityType;
};

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function coverThumb(theme: CertificateCoverTheme) {
  return (
    <div className="certificate-cover-thumb" style={{ background: certificateCoverThemeStyle[theme] }}>
      🏅
    </div>
  );
}

export function CertificateListPage() {
  const { message, modal } = App.useApp();
  const certificates = useCertificates();
  const exams = useExams();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<FormValues>();

  const linkedExamNames = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const exam of exams) {
      if (exam.certificateId == null) continue;
      const list = map.get(exam.certificateId) ?? [];
      list.push(exam.name);
      map.set(exam.certificateId, list);
    }
    return map;
  }, [exams]);

  const editing = editingId != null ? getCertificate(editingId) : undefined;
  const watched = Form.useWatch([], form);
  const previewRecord: CertificateRecord = {
    id: editing?.id ?? 0,
    name: watched?.name || '证书名称',
    coverTheme: watched?.coverTheme ?? 'gold',
    numberRule: watched?.numberRule || 'EXAM-{年份}-{流水号}',
    issuer: watched?.issuer || '考试练习 · 企业学习平台',
    description: watched?.description || '已完成本认证考试，成绩合格，特此颁发以资证明。',
    watermarkText: watched?.watermarkText || '内部认证',
    validityType: watched?.validityType ?? '长期有效',
    issuedCount: editing?.issuedCount ?? 0,
    creator: editing?.creator ?? '产品管理员',
    createdAt: editing?.createdAt ?? dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  };

  const openCreate = () => {
    setEditingId(null);
    setOpen(true);
    form.setFieldsValue({
      name: '',
      coverTheme: 'gold',
      numberRule: 'EXAM-{年份}-{流水号}',
      issuer: '考试练习 · 企业学习平台',
      description: '已完成本认证考试，成绩合格，特此颁发以资证明。',
      watermarkText: '内部认证',
      validityType: '长期有效',
    });
  };

  const openEdit = (record: CertificateRecord) => {
    setEditingId(record.id);
    setOpen(true);
    form.setFieldsValue({
      name: record.name,
      coverTheme: record.coverTheme,
      numberRule: record.numberRule,
      issuer: record.issuer,
      description: record.description,
      watermarkText: record.watermarkText,
      validityType: record.validityType,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    upsertCertificate({
      id: editing?.id ?? Date.now(),
      name: values.name.trim(),
      coverTheme: values.coverTheme,
      numberRule: values.numberRule.trim(),
      issuer: values.issuer.trim(),
      description: values.description.trim(),
      watermarkText: values.watermarkText.trim(),
      validityType: values.validityType,
      issuedCount: editing?.issuedCount ?? 0,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    message.success(editing ? '已保存证书' : '已创建证书');
    setOpen(false);
  };

  const deleteOne = (record: CertificateRecord) => {
    const linked = linkedExamNames.get(record.id) ?? [];
    modal.confirm({
      title: `确认删除证书「${record.name}」？`,
      content: linked.length ? `该证书已被考试「${linked.join('、')}」关联，删除后关联将失效。` : '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeCertificate(record.id);
        message.success('已删除证书');
      },
    });
  };

  const columns: TableColumnsType<CertificateRecord> = [
    {
      title: '证书封面',
      dataIndex: 'coverTheme',
      width: 100,
      render: (value: CertificateCoverTheme) => coverThumb(value),
    },
    {
      title: '证书名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '关联考试',
      key: 'linkedExam',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const names = linkedExamNames.get(record.id);
        return names?.length ? names.join('、') : '-';
      },
    },
    {
      title: '已颁发',
      dataIndex: 'issuedCount',
      width: 100,
      render: (value: number) => (
        <Button type="link" className="table-link">
          {value}
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => deleteOne(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack page-with-block-mask">
      <ListPageHeading
        paths={['考试练习', '考试', '证书管理']}
        title="证书管理"
        subtitle="维护考试通过后颁发的证书模板，支持配置页面水印大字、编号规则与颁发机构。"
      />
      <Alert
        type="info"
        showIcon
        message="证书与考试的绑定在「考试管理 → 新建/编辑考试 → 关联证书」中设置；考试通过后按规则自动颁发。"
        style={{ marginBottom: 16 }}
      />
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建证书
          </Button>
        }
      >
        {certificates.length ? (
          <Table rowKey="id" columns={columns} dataSource={certificates} pagination={false} scroll={{ x: 900 }} />
        ) : (
          <Empty description={b2bStandards.table.emptyText} />
        )}
      </ListTableCard>

      <Modal
        title={editing ? '编辑证书' : '新建证书'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        width={920}
        destroyOnClose
        okText="确定"
        cancelText="取消"
      >
        <Flex gap={24} align="flex-start" wrap="wrap">
          <Form form={form} layout="vertical" style={{ flex: '1 1 360px', minWidth: 320 }} requiredMark>
            <Form.Item name="name" label="证书名称" rules={[{ required: true, message: '请输入证书名称' }]}>
              <Input maxLength={50} showCount placeholder="请输入证书名称" />
            </Form.Item>
            <Form.Item
              name="watermarkText"
              label="页面水印"
              rules={[{ required: true, message: '请输入页面水印大字' }]}
              extra="展示在证书页面中央的大字水印，常用于「内部认证」「样张」等标识。"
            >
              <Input maxLength={12} showCount placeholder="如：内部认证" />
            </Form.Item>
            <Form.Item name="coverTheme" label="证书封面" rules={[{ required: true, message: '请选择证书封面' }]}>
              <Select
                options={certificateCoverThemes.map((value) => ({
                  value,
                  label: (
                    <Space>
                      {coverThumb(value)}
                      <span>{value === 'gold' ? '金色' : value === 'purple' ? '紫色' : '青色'}</span>
                    </Space>
                  ),
                }))}
              />
            </Form.Item>
            <Form.Item name="numberRule" label="编号规则">
              <Input placeholder="EXAM-{年份}-{流水号}" />
            </Form.Item>
            <Form.Item name="issuer" label="颁发机构">
              <Input placeholder="考试练习 · 企业学习平台" />
            </Form.Item>
            <Form.Item name="description" label="证书说明">
              <Input.TextArea rows={3} maxLength={200} showCount placeholder="请输入证书说明" />
            </Form.Item>
            <Form.Item name="validityType" label="有效期">
              <Radio.Group options={certificateValidityTypes.map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Typography.Text type="secondary">
              证书与考试的关联请在考试后台「关联证书」字段中设置，此处不再绑定考试。
            </Typography.Text>
          </Form>
          <div style={{ flex: '0 0 280px' }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              预览
            </Typography.Text>
            <CertificatePreview record={previewRecord} />
          </div>
        </Flex>
      </Modal>
      <div className="page-block-mask" aria-live="polite">
        <p className="page-block-mask__text">将【谋发展】中的证书管理迁移到考试中</p>
      </div>
    </div>
  );
}
