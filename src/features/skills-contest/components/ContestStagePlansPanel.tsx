import { useMemo, useState, type ReactNode } from 'react';
import { App, Button, Card, Empty, Input, Modal, Space, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { useLearningPlans } from '../../learning-plan/model/learningPlanStore';
import type { LearningPlan, PlanStatus } from '../../learning-plan/model/learningPlan';
import {
  appendStagePlanIds,
  formatContestTimeRange,
  publishedPlansForPicker,
  removeStagePlanId,
  stageOrdinalLabel,
  stagePlanIdsOf,
  type Contest,
} from '../model/contest';
import { saveContest } from '../model/contestStore';

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  draft: '草稿',
  published: '已发布',
};

type BoundRow = {
  id: number;
  name: string;
  statusLabel: string;
  time: string;
};

function boundRowsOf(ids: number[], plans: LearningPlan[]): BoundRow[] {
  const byId = new Map(plans.map((item) => [item.id, item]));
  return ids.map((id) => {
    const plan = byId.get(id);
    if (!plan) {
      return { id, name: '计划已删除', statusLabel: '—', time: '—' };
    }
    return {
      id,
      name: plan.name,
      statusLabel: STATUS_LABEL[plan.status],
      time: formatContestTimeRange(plan.startAt, plan.endAt),
    };
  });
}

export function ContestStagePlansPanel({ contest }: { contest: Contest }) {
  const { message } = App.useApp();
  const plans = useLearningPlans();
  const [stageId, setStageId] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [queryName, setQueryName] = useState('');

  const activeStage = contest.stages.find((item) => item.id === stageId);
  const already = activeStage ? stagePlanIdsOf(activeStage) : [];
  const pickerRows = useMemo(() => {
    const published = publishedPlansForPicker(plans, already);
    if (!queryName) return published;
    return published.filter((item) => item.name.includes(queryName));
  }, [plans, already, queryName]);

  const openAdd = (id: string) => {
    setStageId(id);
    setSelected([]);
    setName('');
    setQueryName('');
  };

  const closeAdd = () => {
    setStageId(null);
    setSelected([]);
  };

  const persist = (nextStages: Contest['stages'], ok: string) => {
    saveContest({ ...contest, stages: nextStages });
    message.success(ok);
  };

  const confirmAdd = () => {
    if (!activeStage) return Promise.resolve();
    if (!selected.length) {
      message.warning('请选择学习计划');
      return Promise.reject(new Error('empty'));
    }
    persist(
      contest.stages.map((stage) =>
        stage.id === activeStage.id
          ? { ...stage, learningPlanIds: appendStagePlanIds(stagePlanIdsOf(stage), selected) }
          : stage,
      ),
      '已添加学习计划',
    );
    closeAdd();
    return Promise.resolve();
  };

  const removePlan = (targetStageId: string, planId: number) => {
    persist(
      contest.stages.map((stage) =>
        stage.id === targetStageId
          ? { ...stage, learningPlanIds: removeStagePlanId(stagePlanIdsOf(stage), planId) }
          : stage,
      ),
      '已移除学习计划',
    );
  };

  const pickerColumns: TableColumnsType<LearningPlan> = [
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: PlanStatus) => STATUS_LABEL[value] },
    {
      title: '计划时间',
      key: 'time',
      render: (_, record) => formatContestTimeRange(record.startAt, record.endAt),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contest.stages.map((stage, index) => {
        const ids = stagePlanIdsOf(stage);
        const rows = boundRowsOf(ids, plans);
        return (
          <Card
            key={stage.id}
            title={`${stageOrdinalLabel(index)} · ${stage.name}`}
            extra={
              <Button type="primary" onClick={() => openAdd(stage.id)}>
                添加学习计划
              </Button>
            }
          >
            {rows.length === 0 ? (
              <Empty description="暂无学习计划" />
            ) : (
              <Table
                rowKey="id"
                pagination={false}
                dataSource={rows}
                columns={[
                  { title: '名称', dataIndex: 'name', ellipsis: true },
                  { title: '状态', dataIndex: 'statusLabel', width: 100 },
                  { title: '计划时间', dataIndex: 'time' },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 100,
                    align: 'right',
                    render: (_, record) => (
                      <TableRowActions
                        moreAriaLabel={`学习计划 ${record.name} 更多操作`}
                        actions={[
                          {
                            key: 'remove',
                            label: '移除',
                            ariaLabel: `移除 ${record.name}`,
                            onClick: () => removePlan(stage.id, record.id),
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            )}
          </Card>
        );
      })}
      <Modal
        title="选择学习计划"
        open={stageId != null}
        onCancel={closeAdd}
        onOk={() => confirmAdd()}
        okText="确定"
        cancelText="取消"
        footer={modalFooter}
        width={720}
        destroyOnHidden
      >
        <SearchPanel
          onSearch={() => setQueryName(name.trim())}
          onReset={() => {
            setName('');
            setQueryName('');
          }}
        >
          <SearchField label="名称">
            <Input value={name} allowClear placeholder="请输入" onChange={(event) => setName(event.target.value)} />
          </SearchField>
        </SearchPanel>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={pickerRows}
          columns={pickerColumns}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(Number)),
          }}
        />
      </Modal>
    </Space>
  );
}
