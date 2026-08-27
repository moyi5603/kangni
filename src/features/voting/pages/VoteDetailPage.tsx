import { useEffect, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { App, Alert, Breadcrumb, Button, Card, Descriptions, Empty, Flex, Input, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  averageQuestionScore,
  displayVoterName,
  isChoiceQuestionType,
  isPersonQuestionType,
  isVisualChoiceQuestionType,
  resolveVoteImageLayout,
  resolveVoteStatus,
  scoreDistribution,
  tallyQuestionChoices,
  tallyVoteResults,
  voteChoiceAvatarName,
  voteChoiceTitle,
  voteOptionTitle,
  voteQuotaFieldLabel,
  type VoteAnswer,
  type VoteBallot,
  type VoteCampaign,
  type VoteChoice,
  type VoteQuestion,
  type VoteResponse,
  type VoteStatus,
  type VoteTallyRow,
} from '../model/voting';
import { employeeAvatarColor, employeeAvatarLetter } from '../../activities/model/employeeAvatar';
import { getVote, getVoteAnswers, getVoteBallots, getVoteOptions, getVoteQuestions, getVoteResponses } from '../model/voteStore';
import { downloadContestVoteExport, downloadVoteResultExport } from '../model/voteExport';
import { VoteShareModal } from '../components/VoteShareModal';
import { VoteCommentPanel } from './VoteCommentPanel';

const voteDetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'results', label: '投票结果' },
  { key: 'records', label: '投票记录' },
  { key: 'comments', label: '评论' },
] as const;

type VoteDetailTab = (typeof voteDetailTabs)[number]['key'];

function isVoteDetailTab(value: string | undefined): value is VoteDetailTab {
  return !!value && voteDetailTabs.some((item) => item.key === value);
}

const statusColor: Record<VoteStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'success',
};

function nowStamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function dash(value: string | number | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'number') return String(value);
  return value.trim() ? value : '—';
}

function visibilityExtra(record: VoteCampaign): { label: string; value: string } | null {
  if (record.visibility === '按部门') return { label: '选择部门', value: record.departments.join('、') || '—' };
  if (record.visibility === '自定义人员') return { label: '选择人员', value: record.people.join('、') || '—' };
  if (record.visibility === '导入人群') {
    const file = record.importFileName || '—';
    return {
      label: '导入人群',
      value: record.importedPeople.length ? `${file}（${record.importedPeople.length} 人）` : file,
    };
  }
  return null;
}

function onOff(value: boolean): string {
  return value ? '开' : '关';
}

type Props = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onTabChange?: (tab: VoteDetailTab) => void;
};

export function VoteDetailPage({ recordId, tab, onBack, onEdit, onTabChange }: Props) {
  const { message } = App.useApp();
  const record = getVote(Number(recordId));
  const now = nowStamp();
  const activeTab: VoteDetailTab = isVoteDetailTab(tab) ? tab : 'detail';
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!record) {
      message.error('投票不存在或已删除');
      onBack();
    }
  }, [record, message, onBack]);

  if (!record) return null;

  const status = resolveVoteStatus(record, now);

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '投票' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                投票管理
              </Button>
            ),
          },
          { title: record.name },
        ]}
      />
      <Flex align="baseline" justify="space-between" gap={16} wrap="wrap">
        <Space align="center" wrap>
          <Typography.Title level={1} style={{ margin: 0 }}>
            {record.name}
          </Typography.Title>
          <Tag color={statusColor[status]}>{status}</Tag>
        </Space>
        <Space>
          {status !== '已结束' ? (
            <Button type="primary" onClick={() => onEdit(String(record.id))}>
              编辑
            </Button>
          ) : null}
          <Button aria-label={`分享 ${record.name}`} onClick={() => setShareOpen(true)}>
            分享
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (isVoteDetailTab(key)) onTabChange?.(key);
        }}
        items={[
          { key: 'detail', label: '详情', children: <VoteDetailFields record={record} /> },
          { key: 'results', label: '投票结果', children: <VoteResultsPanel record={record} status={status} /> },
          { key: 'records', label: '投票记录', children: <VoteRecordsPanel record={record} status={status} /> },
          { key: 'comments', label: '评论', children: <VoteCommentPanel campaignId={record.id} /> },
        ]}
      />
      {shareOpen ? <VoteShareModal record={record} open onClose={() => setShareOpen(false)} /> : null}
    </div>
  );
}

function VoteDetailFields({ record }: { record: VoteCampaign }) {
  const options = getVoteOptions(record.id);
  const questions = getVoteQuestions(record.id);
  const extra = visibilityExtra(record);
  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="基础信息">
        <Descriptions
          column={3}
          items={[
            { key: 'name', label: '投票名称', children: record.name },
            { key: 'time', label: '投票时间', span: 2, children: `${record.startAt} ～ ${record.endAt}` },
            { key: 'intro', label: '投票简介', span: 3, children: dash(record.intro) },
          ]}
        />
      </Card>
      {record.type === '普通投票' ? (
        <Card title="投票" className="vote-option-card">
          <div className="vote-question-list vote-detail-questions">
            {questions.map((question, index) => (
              <VoteQuestionReadView key={question.id} question={question} index={index} />
            ))}
          </div>
        </Card>
      ) : (
        <Card title="选项">
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            {options.map((option) => (
              <Flex key={option.id} gap={12} align="center">
                {(option.kind === '作品' ? option.workCover : option.imageUrl) ? (
                  <img
                    src={option.kind === '作品' ? option.workCover : option.imageUrl}
                    alt={voteOptionTitle(option)}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover' }}
                  />
                ) : null}
                <Typography.Text>
                  {voteOptionTitle(option)}
                  {option.kind === '员工' && option.employeeDept ? ` · ${option.employeeDept}` : ''}
                </Typography.Text>
              </Flex>
            ))}
          </Space>
        </Card>
      )}
      <Card title="规则">
        <Descriptions
          column={3}
          items={[
            { key: 'anonymous', label: '匿名投票', children: onOff(record.anonymous) },
            { key: 'allowComment', label: '允许评论', children: onOff(record.allowComment) },
            { key: 'quotaMode', label: '投票次数', children: voteQuotaFieldLabel(record.quotaMode) },
            { key: 'quota', label: '次数', children: `${record.quota} 次` },
            ...(record.type === '评选投票'
              ? [
                  {
                    key: 'stack',
                    label: '允许对同一选项连投',
                    children: record.allowStackOnSameOption ? '允许' : '不允许',
                  },
                ]
              : []),
            { key: 'visibility', label: '参与范围', span: record.type === '评选投票' ? 1 : 2, children: record.visibility },
            ...(extra ? [{ key: 'visibilityExtra', label: extra.label, span: 3 as const, children: extra.value }] : []),
          ]}
        />
      </Card>
    </Space>
  );
}

function VoteQuestionReadView({ question, index }: { question: VoteQuestion; index: number }) {
  const layout = resolveVoteImageLayout(question.imageLayout);
  const visual = isVisualChoiceQuestionType(question.type);
  return (
    <div className="vote-question-card">
      <div className="vote-question-head">
        <span className="vote-question-index">{index + 1}.</span>
        <Tag className="vote-question-type">{question.type}</Tag>
        <Typography.Text strong className="vote-question-stem">
          {question.stem}
        </Typography.Text>
      </div>
      {question.type === '问答题' ? (
        <div className="vote-question-essay">
          <Input.TextArea disabled rows={3} placeholder="员工端填写，最多 500 字" />
        </div>
      ) : null}
      {question.type === '打分题' ? (
        <div className="vote-question-score">
          <Typography.Text>{question.minScore}</Typography.Text>
          <span>～</span>
          <Typography.Text>{question.maxScore}</Typography.Text>
          <span>分</span>
        </div>
      ) : null}
      {isChoiceQuestionType(question.type) ? (
        <>
          {visual ? (
            <div className="vote-image-settings">
              <span className="vote-image-settings-label">图文布局</span>
              <Typography.Text>{layout}</Typography.Text>
            </div>
          ) : null}
          <div className={visual ? 'vote-question-choices is-image' : 'vote-question-choices'}>
            {question.choices.map((choice, choiceIndex) => (
              <div key={choice.id} className="vote-question-choice">
                {visual ? (
                  <VoteImageChoiceView
                    choice={choice}
                    layout={layout}
                    fallbackAvatar={isPersonQuestionType(question.type)}
                  />
                ) : (
                  <>
                    <span className="vote-question-choice-index">选项{choiceIndex + 1}</span>
                    <Typography.Text>{voteChoiceTitle(choice)}</Typography.Text>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function VoteResultsExportBar({ count, onExport }: { count: number; onExport: () => void }) {
  return (
    <Flex className="table-toolbar" justify="space-between" align="center">
      <Typography.Text>共 {count} 条</Typography.Text>
      <Button icon={<DownloadOutlined />} onClick={onExport}>
        导出
      </Button>
    </Flex>
  );
}

function VoteResultsPanel({ record, status }: { record: VoteCampaign; status: VoteStatus }) {
  const { message } = App.useApp();
  if (record.type === '评选投票') {
    const options = getVoteOptions(record.id);
    const ballots = getVoteBallots(record.id);
    const rows = tallyVoteResults(options, ballots);
    const exportRows = () => {
      if (!ballots.length) {
        message.warning('暂无投票可导出');
        return;
      }
      downloadContestVoteExport(record.name, { options, ballots });
      message.success(`已导出 ${ballots.length} 条投票结果`);
    };
    if (!ballots.length && status === '未开始') {
      return (
        <>
          <VoteResultsExportBar count={0} onExport={exportRows} />
          <Empty description="尚未开始，暂无投票" />
        </>
      );
    }
    return (
      <>
        <VoteResultsExportBar count={ballots.length} onExport={exportRows} />
        {ballots.length ? <ContestRankTable rows={rows} /> : <Empty description="暂无投票" />}
      </>
    );
  }

  const questions = getVoteQuestions(record.id);
  const responses = getVoteResponses(record.id);
  const answers = getVoteAnswers(record.id);
  const exportRows = () => {
    if (!responses.length) {
      message.warning('暂无投票可导出');
      return;
    }
    downloadVoteResultExport(record.name, { questions, responses, answers });
    message.success(`已导出 ${responses.length} 条投票结果`);
  };
  if (!responses.length && status === '未开始') {
    return (
      <>
        <VoteResultsExportBar count={0} onExport={exportRows} />
        <Empty description="尚未开始，暂无投票" />
      </>
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <VoteResultsExportBar count={responses.length} onExport={exportRows} />
      {questions.map((question, index) => (
        <QuestionResultCard key={question.id} index={index} question={question} answers={answers} />
      ))}
    </Space>
  );
}

function VoteRecordsPanel({ record, status }: { record: VoteCampaign; status: VoteStatus }) {
  if (record.type === '评选投票') {
    const options = getVoteOptions(record.id);
    const ballots = getVoteBallots(record.id);
    if (!ballots.length && status === '未开始') {
      return <Empty description="尚未开始，暂无投票" />;
    }
    const rows = tallyVoteResults(options, ballots);
    const logColumns: TableColumnsType<VoteBallot> = [
      { title: '时间', dataIndex: 'votedAt', width: 180 },
      {
        title: '投票人',
        key: 'voter',
        width: 120,
        render: (_, item) => displayVoterName(record.anonymous, item.voterName),
      },
      {
        title: '选项',
        key: 'option',
        render: (_, item) => {
          const option = rows.find((row) => row.option.id === item.optionId)?.option;
          return option ? voteOptionTitle(option) : '—';
        },
      },
    ];
    return ballots.length ? (
      <Table rowKey="id" columns={logColumns} dataSource={ballots} pagination={{ pageSize: 10, showSizeChanger: false }} />
    ) : (
      <Empty description="暂无投票记录" />
    );
  }

  const responses = getVoteResponses(record.id);
  if (!responses.length && status === '未开始') {
    return <Empty description="尚未开始，暂无投票" />;
  }
  return responses.length ? (
    <Table
      rowKey="id"
      dataSource={responses}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      columns={[
        { title: '时间', dataIndex: 'submittedAt', width: 180 },
        {
          title: '投票人',
          key: 'voter',
          render: (_, item: VoteResponse) => displayVoterName(record.anonymous, item.voterName),
        },
      ]}
    />
  ) : (
    <Empty description="暂无投票记录" />
  );
}

function QuestionResultCard({
  index,
  question,
  answers,
}: {
  index: number;
  question: VoteQuestion;
  answers: VoteAnswer[];
}) {
  const title = `${index + 1}. ${question.stem}`;
  if (isChoiceQuestionType(question.type)) {
    const rows = tallyQuestionChoices(question, answers);
    const columns: TableColumnsType<(typeof rows)[number]> = [
      { title: '名次', dataIndex: 'rank', width: 80 },
      {
        title: '选项',
        key: 'choice',
        render: (_, row) => (
          <VoteImageChoiceView
            choice={row.choice}
            layout={isVisualChoiceQuestionType(question.type) ? resolveVoteImageLayout(question.imageLayout) : '左图右文'}
            compact
            fallbackAvatar={isPersonQuestionType(question.type)}
          />
        ),
      },
      { title: '票数', dataIndex: 'voteCount', width: 88, align: 'right' },
      {
        title: '占比',
        key: 'percent',
        width: 88,
        align: 'right',
        render: (_, row) => (row.percent == null ? '—' : `${row.percent}%`),
      },
    ];
    return (
      <Card title={title} extra={<Tag>{question.type}</Tag>}>
        <Table rowKey={(row) => row.choice.id} columns={columns} dataSource={rows} pagination={false} />
      </Card>
    );
  }
  if (question.type === '问答题') {
    const related = answers.filter((item) => item.questionId === question.id && item.text.trim());
    return (
      <Card title={title} extra={<Tag>{question.type}</Tag>}>
        {related.length ? (
          <Alert type="info" showIcon title={`已回收 ${related.length} 条。具体答案请导出查看`} />
        ) : (
          <Empty description="暂无作答" />
        )}
      </Card>
    );
  }
  const avg = averageQuestionScore(question, answers);
  const dist = scoreDistribution(question, answers);
  return (
    <Card title={title} extra={<Tag>{question.type}</Tag>}>
      <Typography.Paragraph>均分 {avg == null ? '—' : avg}</Typography.Paragraph>
      <Table
        rowKey="score"
        pagination={false}
        dataSource={dist}
        columns={[
          { title: '分值', dataIndex: 'score', width: 88 },
          { title: '人数', dataIndex: 'count', width: 88, align: 'right' },
        ]}
      />
    </Card>
  );
}

function ContestRankTable({ rows }: { rows: VoteTallyRow[] }) {
  const rankColumns: TableColumnsType<VoteTallyRow> = [
    { title: '名次', dataIndex: 'rank', width: 80 },
    {
      title: '选项',
      key: 'option',
      render: (_, row) => (
        <Space>
          {(row.option.kind === '作品' ? row.option.workCover : row.option.imageUrl) ? (
            <img
              src={row.option.kind === '作品' ? row.option.workCover : row.option.imageUrl}
              alt={voteOptionTitle(row.option)}
              width={32}
              height={32}
              style={{ objectFit: 'cover' }}
            />
          ) : null}
          {voteOptionTitle(row.option)}
        </Space>
      ),
    },
    { title: '票数', dataIndex: 'voteCount', width: 88, align: 'right' },
    {
      title: '占比',
      key: 'percent',
      width: 88,
      align: 'right',
      render: (_, row) => (row.percent == null ? '—' : `${row.percent}%`),
    },
  ];
  return <Table rowKey={(row) => row.option.id} columns={rankColumns} dataSource={rows} pagination={false} />;
}

function VoteImageChoiceView({
  choice,
  layout,
  compact,
  fallbackAvatar,
}: {
  choice: VoteChoice;
  layout: '上图下文' | '左图右文';
  compact?: boolean;
  fallbackAvatar?: boolean;
}) {
  const size = compact ? 32 : 72;
  const side = layout === '左图右文';
  const title = voteChoiceTitle(choice);
  const avatarName = voteChoiceAvatarName(choice);
  return (
    <div className={side ? 'vote-image-choice-view is-left' : 'vote-image-choice-view is-top'}>
      {choice.imageUrl ? (
        <img src={choice.imageUrl} alt={title} width={size} height={size} />
      ) : fallbackAvatar ? (
        <span
          className="vote-person-avatar"
          style={{ width: size, height: size, fontSize: compact ? 14 : 24, background: employeeAvatarColor(avatarName) }}
        >
          {employeeAvatarLetter(avatarName)}
        </span>
      ) : null}
      <div className="vote-image-choice-view-copy">
        <Typography.Text>{title}</Typography.Text>
        {choice.subtitle?.trim() ? <Typography.Text type="secondary">{choice.subtitle}</Typography.Text> : null}
      </div>
    </div>
  );
}
