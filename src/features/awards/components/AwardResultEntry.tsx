import { useMemo, useState } from 'react';
import { Button, Empty, Form, Input, Space, Table, Typography } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { AwardRecord } from '../model/award';
import {
  filterNominations,
  formatNominatorInfo,
  formatNomineeSummary,
  sortNominations,
  type AwardNominationQuery,
  type AwardNominationRecord,
} from '../model/awardNomination';

export type ResultEntryForm = { rows: { nominationId?: number }[] };

const emptyPickerQuery: AwardNominationQuery = {};

export function AwardResultNominationPicker({
  rankTitle,
  passed,
  usedIds,
  currentNominationId,
  onPick,
  onViewPeople,
}: {
  rankTitle: string;
  passed: AwardNominationRecord[];
  usedIds: Set<number>;
  currentNominationId?: number;
  onPick: (nomination: AwardNominationRecord) => void;
  onViewPeople: (title: string, names: string[]) => void;
}) {
  const [draft, setDraft] = useState<AwardNominationQuery>(emptyPickerQuery);
  const [query, setQuery] = useState<AwardNominationQuery>(emptyPickerQuery);
  const filtered = useMemo(() => filterNominations(passed, query), [passed, query]);
  const rows = useMemo(() => sortNominations(filtered, 'voteCount', 'descend'), [filtered]);
  const hasFilter = Boolean(query.title || query.nominator || query.nominee);

  if (!passed.length) {
    return <Empty description="暂无已通过的提名" />;
  }

  return (
    <div className="page-stack">
      <SearchPanel
        columns={2}
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyPickerQuery);
          setQuery(emptyPickerQuery);
        }}
      >
        <SearchField label="提名标题">
          <Input
            allowClear
            placeholder="请输入提名标题"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
        </SearchField>
        <SearchField label="提名名单">
          <Input
            allowClear
            placeholder="请输入被提名人"
            value={draft.nominee}
            onChange={(event) => setDraft((current) => ({ ...current, nominee: event.target.value }))}
          />
        </SearchField>
        <SearchField label="提名人">
          <Input
            allowClear
            placeholder="请输入提名人"
            value={draft.nominator}
            onChange={(event) => setDraft((current) => ({ ...current, nominator: event.target.value }))}
          />
        </SearchField>
      </SearchPanel>
      <Table
        rowKey="id"
        pagination={false}
        scroll={{ x: 720 }}
        dataSource={rows}
        locale={{ emptyText: <Empty description={hasFilter ? '没有符合条件的提名' : b2bStandards.table.emptyText} /> }}
        columns={[
          { title: '提名标题', dataIndex: 'title', width: 180 },
          {
            title: '提名名单',
            dataIndex: 'nominees',
            render: (value: string[], record) => (
              <Button
                type="link"
                className="table-link"
                aria-label={`查看名单 ${record.title}`}
                onClick={() => onViewPeople(record.title, record.nominees)}
              >
                {formatNomineeSummary(value)}
              </Button>
            ),
          },
          {
            title: '票数',
            dataIndex: 'voteCount',
            width: 88,
            align: 'right',
            sorter: (a, b) => a.voteCount - b.voteCount,
            defaultSortOrder: 'descend',
          },
          {
            title: '提名人',
            dataIndex: 'nominator',
            width: 140,
            render: (value: string) => formatNominatorInfo(value),
          },
          {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_, record) => {
              const taken = usedIds.has(record.id) && record.id !== currentNominationId;
              return (
                <Space>
                  <Button type="link" aria-label={`查看名单 ${record.title}`} onClick={() => onViewPeople(record.title, record.nominees)}>
                    查看名单
                  </Button>
                  <Button type="link" disabled={taken} aria-label={`选用 ${record.title} 为${rankTitle}`} onClick={() => onPick(record)}>
                    {taken ? '已占用' : '选用'}
                  </Button>
                </Space>
              );
            },
          },
        ]}
      />
    </div>
  );
}

export function AwardResultEntryContent({
  award,
  passed,
  form,
  rowsWatch,
  onPickRank,
  onClearRank,
  onViewPeople,
}: {
  award: AwardRecord;
  passed: AwardNominationRecord[];
  form: ReturnType<typeof Form.useForm<ResultEntryForm>>[0];
  rowsWatch: ResultEntryForm['rows'];
  onPickRank: (index: number) => void;
  onClearRank: (index: number) => void;
  onViewPeople: (title: string, names: string[]) => void;
}) {
  return (
    <>
      <Typography.Paragraph type="secondary">
        每个名次单独选择提名。点「选择提名」打开名单，人多可先看详情再选用。
      </Typography.Paragraph>
      <Form form={form} hidden>
        {award.ranks.map((rank, index) => (
          <Form.Item key={rank.rank} name={['rows', index, 'nominationId']}>
            <Input />
          </Form.Item>
        ))}
      </Form>
      <Table
        rowKey={(row) => String(row.rank)}
        pagination={false}
        dataSource={award.ranks.map((rank, index) => ({ ...rank, index }))}
        columns={[
          {
            title: '名次',
            dataIndex: 'title',
            width: 120,
            render: (value: string, record) => value || `第 ${record.rank} 名`,
          },
          {
            title: '提名标题',
            key: 'nominationTitle',
            render: (_, record) => {
              const selected = passed.find((item) => item.id === rowsWatch[record.index]?.nominationId);
              return selected?.title ?? <Typography.Text type="secondary">未选择</Typography.Text>;
            },
          },
          {
            title: '获奖名单',
            key: 'nominees',
            width: 200,
            render: (_, record) => {
              const selected = passed.find((item) => item.id === rowsWatch[record.index]?.nominationId);
              if (!selected) return '—';
              return (
                <Button
                  type="link"
                  className="table-link"
                  aria-label={`查看名单 ${selected.title}`}
                  onClick={() => onViewPeople(selected.title, selected.nominees)}
                >
                  {formatNomineeSummary(selected.nominees)}
                </Button>
              );
            },
          },
          {
            title: '票数',
            key: 'voteCount',
            width: 80,
            align: 'right' as const,
            render: (_, record) => {
              const selected = passed.find((item) => item.id === rowsWatch[record.index]?.nominationId);
              return selected ? selected.voteCount : '—';
            },
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_, record) => {
              const selected = passed.find((item) => item.id === rowsWatch[record.index]?.nominationId);
              const rankLabel = record.title || `第 ${record.rank} 名`;
              return (
                <Space>
                  <Button type="link" aria-label={`${selected ? '更换' : '选择'} ${rankLabel}`} onClick={() => onPickRank(record.index)}>
                    {selected ? '更换提名' : '选择提名'}
                  </Button>
                  {selected ? (
                    <Button type="link" aria-label={`清空 ${rankLabel}`} onClick={() => onClearRank(record.index)}>
                      清空
                    </Button>
                  ) : null}
                </Space>
              );
            },
          },
        ]}
      />
    </>
  );
}
