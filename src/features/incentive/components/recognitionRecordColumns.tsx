import { Button, Tag, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { recognitionHasRiskHit, recognitionReasonLabel, type IncentiveSettings, type Recognition, type RecognitionStatus } from '../model/incentive';

export function recognitionStatusColor(status: RecognitionStatus) {
  if (status === '已发放') return 'success';
  if (status === '待审核') return 'warning';
  if (status === '已驳回') return 'error';
  return 'default';
}

export function recognitionRecordColumns(options: {
  rules: IncentiveSettings['rules'];
  displayedOf: (record: Recognition) => RecognitionStatus;
  onDetail: (record: Recognition) => void;
  extraActions?: (record: Recognition, shown: RecognitionStatus) => TableRowAction[];
  actionsWidth?: number;
  /** 发放记录按类型显示理由名称；概览仍用事实描述。 */
  reasonLabelByType?: boolean;
}): TableColumnsType<Recognition> {
  const { rules, displayedOf, onDetail, extraActions, actionsWidth = 200, reasonLabelByType = false } = options;
  return [
    {
      title: '编号',
      dataIndex: 'id',
      width: 160,
      render: (value: string, record) => (
        <Button type="link" onClick={() => onDetail(record)}>
          {value}
        </Button>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 110 },
    { title: '发起人', dataIndex: 'giver', width: 100, ellipsis: true },
    { title: '认可对象', dataIndex: 'receiver', width: 110, ellipsis: true },
    { title: '部门', dataIndex: 'department', width: 160, ellipsis: true },
    { title: '勋章', dataIndex: 'badgeName', width: 120, ellipsis: true },
    { title: '积分', dataIndex: 'points', width: 80, align: 'right' },
    {
      title: reasonLabelByType ? '表彰理由 / 认可理由' : '事实描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (value: string, record) => (
        <Tooltip title={reasonLabelByType ? `${recognitionReasonLabel(record.type)}：${value}` : value}>
          <Typography.Text ellipsis={{ tooltip: false }}>{value}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const shown = displayedOf(record);
        return <Tag color={recognitionStatusColor(shown)}>{shown}</Tag>;
      },
    },
    {
      title: '异常标识',
      key: 'risk',
      width: 100,
      render: (_, record) => {
        const hits = record.riskHits.filter((hit) => rules[hit.rule]);
        if (!recognitionHasRiskHit(record, rules)) {
          return <Tag>正常</Tag>;
        }
        return (
          <Tooltip title={hits.map((hit) => hit.message).join('\n')}>
            <Tag color="warning">异常</Tag>
          </Tooltip>
        );
      },
    },
    { title: '时间', dataIndex: 'time', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: actionsWidth,
      align: 'right',
      render: (_, record) => {
        const shown = displayedOf(record);
        const actions: TableRowAction[] = [
          { key: 'detail', label: '详情', ariaLabel: `详情 ${record.id}`, onClick: () => onDetail(record) },
          ...(extraActions?.(record, shown) ?? []),
        ];
        return <TableRowActions moreAriaLabel={`更多操作 ${record.id}`} actions={actions} />;
      },
    },
  ];
}
