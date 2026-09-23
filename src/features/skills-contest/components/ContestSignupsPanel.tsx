import { useMemo, useState, type ReactNode } from 'react';
import { App, Button, Checkbox, Flex, Input, Modal, Select, Space, Table, Tag, TreeSelect } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { formatSignupAnswersSummary } from '../../activities/model/signupAnswers';
import type { SignupField } from '../../activities/model/signupFields';
import { activitySignupFieldsOf } from '../model/contestSignupFields';
import { regionDisplayName, regionMatchesFilter, regionTree, stageOrdinalLabel, type Contest, type ContestSignup, type RegionTreeNode } from '../model/contest';
import { setSignupStages, useContestSignups } from '../model/contestStore';
import { useRegions } from '../model/regionStore';

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function toTreeSelectNode(node: RegionTreeNode): { value: number; title: string; children?: ReturnType<typeof toTreeSelectNode>[] } {
  return {
    value: node.id,
    title: node.name,
    children: node.children?.map(toTreeSelectNode),
  };
}

export function ContestSignupsPanel({ contest }: { contest: Contest }) {
  const { message } = App.useApp();
  const rows = useContestSignups(contest.id);
  const regions = useRegions();
  const [name, setName] = useState('');
  const [regionId, setRegionId] = useState<number | 'all'>('all');
  const [stageId, setStageId] = useState<string | 'all'>('all');
  const [query, setQuery] = useState({ name: '', regionId: 'all' as number | 'all', stageId: 'all' as string | 'all' });
  const [selected, setSelected] = useState<number[]>([]);
  const [stageOpen, setStageOpen] = useState(false);
  const [stageTarget, setStageTarget] = useState<number[]>([]);
  const [pickedStages, setPickedStages] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const person = item.answers['姓名'] ?? '';
        if (query.name && !person.includes(query.name)) return false;
        if (query.regionId !== 'all' && !regionMatchesFilter(regions, item.regionId, query.regionId)) return false;
        if (query.stageId !== 'all' && !item.eligibleStageIds.includes(query.stageId)) return false;
        return true;
      }),
    [rows, query],
  );

  const openStages = (ids: number[], current?: string[]) => {
    setStageTarget(ids);
    setPickedStages(current ?? []);
    setStageOpen(true);
  };

  const saveStages = () => {
    setSignupStages(contest.id, stageTarget, pickedStages);
    message.success('已更新可参与阶段');
    setStageOpen(false);
    setSelected([]);
  };

  const activityFields = activitySignupFieldsOf(contest.signupFields);
  const summaryFields = activityFields.filter((field) => field.key !== '姓名' && field.key !== '手机号') as SignupField[];

  const columns: TableColumnsType<ContestSignup> = [
    { title: '姓名', key: 'name', width: 120, render: (_, record) => record.answers['姓名'] || '—' },
    { title: '手机号', key: 'phone', width: 140, render: (_, record) => record.answers['手机号'] || '—' },
    {
      title: '所属区域',
      key: 'region',
      width: 240,
      render: (_, record) => regionDisplayName(regions, record.regionId),
    },
    {
      title: '可参与阶段',
      key: 'stages',
      width: 220,
      render: (_, record) => {
        const names = contest.stages.filter((stage) => record.eligibleStageIds.includes(stage.id));
        if (!names.length) return '—';
        return (
          <Space size={[4, 4]} wrap>
            {names.map((stage) => (
              <Tag key={stage.id}>{stage.name}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '收集信息',
      key: 'summary',
      ellipsis: true,
      render: (_, record) => <TableEllipsisText text={formatSignupAnswersSummary(summaryFields, record.answers)} />,
    },
    { title: '报名时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`报名 ${record.answers['姓名'] ?? record.id} 更多操作`}
          actions={[
            {
              key: 'stages',
              label: '设置阶段',
              ariaLabel: `设置 ${record.answers['姓名'] ?? record.id} 可参与阶段`,
              onClick: () => openStages([record.id], record.eligibleStageIds),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <SearchPanel
        onSearch={() => setQuery({ name: name.trim(), regionId, stageId })}
        onReset={() => {
          setName('');
          setRegionId('all');
          setStageId('all');
          setQuery({ name: '', regionId: 'all', stageId: 'all' });
        }}
      >
        <SearchField label="姓名">
          <Input allowClear placeholder="请输入姓名" value={name} onChange={(event) => setName(event.target.value)} />
        </SearchField>
        <SearchField label="所属区域">
          <TreeSelect
            allowClear
            treeDefaultExpandAll
            placeholder="全部"
            value={regionId === 'all' ? undefined : regionId}
            onChange={(value) => setRegionId(value ?? 'all')}
            treeData={regionTree(regions).map(toTreeSelectNode)}
            treeNodeFilterProp="title"
            showSearch
          />
        </SearchField>
        <SearchField label="可参与阶段">
          <Select
            value={stageId}
            onChange={setStageId}
            options={[{ value: 'all', label: '全部' }, ...contest.stages.map((item) => ({ value: item.id, label: item.name }))]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>
              共 {filtered.length} 条
              {selected.length ? `，已选 ${selected.length} 人` : ''}
            </span>
            <Button disabled={!selected.length} onClick={() => openStages(selected, [])}>
              批量设置阶段
            </Button>
          </Flex>
        }
      >
        <Table<ContestSignup>
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map((key) => Number(key))),
          }}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: b2bStandards.table.pageSize, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1100 }}
        />
      </ListTableCard>
      <Modal title="设置可参与阶段" open={stageOpen} onCancel={() => setStageOpen(false)} onOk={saveStages} okText="保存" cancelText="取消" footer={modalFooter}>
        <Checkbox.Group
          value={pickedStages}
          onChange={(value) => setPickedStages(value as string[])}
          options={contest.stages.map((stage, index) => ({
            value: stage.id,
            label: `${stageOrdinalLabel(index)} · ${stage.name}`,
          }))}
        />
      </Modal>
    </>
  );
}
