import { useMemo, useState } from 'react';
import { DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  challengeLogColumnCount,
  filterChallengeDayLogs,
  formatChallengeGateCell,
  type ChallengeDayLog,
  type Contest,
} from '../model/contest';
import { useChallengeDayLogs, useContestSignups } from '../model/contestStore';

export function ContestChallengeLogsPanel({ contest }: { contest: Contest }) {
  const logs = useChallengeDayLogs(contest.id);
  const signups = useContestSignups(contest.id);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Dayjs | null>(null);
  const [stageId, setStageId] = useState<string | 'all'>('all');
  const [query, setQuery] = useState({ name: '', date: '', stageId: 'all' as string | 'all' });

  const filtered = useMemo(
    () => filterChallengeDayLogs(logs, signups, query),
    [logs, signups, query],
  );
  const gateCount = challengeLogColumnCount(contest.stages, query.stageId);
  const signupName = (signupId: number) => signups.find((item) => item.id === signupId)?.answers['姓名'] || '—';
  const stageName = (id: string) => contest.stages.find((item) => item.id === id)?.name || '—';

  const columns: TableColumnsType<ChallengeDayLog> = [
    {
      title: '姓名',
      key: 'name',
      width: 120,
      render: (_, record) => signupName(record.signupId),
    },
    { title: '日期', dataIndex: 'date', width: 128 },
    {
      title: '阶段',
      key: 'stage',
      width: 120,
      render: (_, record) => stageName(record.stageId),
    },
    ...Array.from({ length: gateCount }, (_, index) => ({
      title: `关 ${index + 1}`,
      key: `gate-${index}`,
      width: 160,
      render: (_: unknown, record: ChallengeDayLog) => formatChallengeGateCell(record.gates[index]),
    })),
  ];

  return (
    <>
      <SearchPanel
        onSearch={() => setQuery({ name: name.trim(), date: date ? date.format('YYYY-MM-DD') : '', stageId })}
        onReset={() => {
          setName('');
          setDate(null);
          setStageId('all');
          setQuery({ name: '', date: '', stageId: 'all' });
        }}
      >
        <SearchField label="姓名">
          <Input allowClear placeholder="请输入姓名" value={name} onChange={(event) => setName(event.target.value)} />
        </SearchField>
        <SearchField label="日期">
          <DatePicker allowClear value={date} onChange={(value) => setDate(value)} style={{ width: '100%' }} />
        </SearchField>
        <SearchField label="阶段">
          <Select
            value={stageId}
            onChange={setStageId}
            options={[{ value: 'all', label: '全部' }, ...contest.stages.map((item) => ({ value: item.id, label: item.name }))]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard toolbar={<span>共 {filtered.length} 条</span>}>
        <Table<ChallengeDayLog>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: b2bStandards.table.pageSize, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 720 + gateCount * 160 }}
        />
      </ListTableCard>
    </>
  );
}
