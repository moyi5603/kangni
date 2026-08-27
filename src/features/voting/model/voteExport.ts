import { personDepartment } from '../../activities/model/activity';
import { isChoiceQuestionType, voteChoiceTitle, voteOptionTitle } from './voting';
import type { VoteAnswer, VoteBallot, VoteOption, VoteQuestion, VoteResponse } from './voting';

function csvCell(value: string | number): string {
  const cell = String(value).replace(/\r?\n/g, ' ');
  if (/[",]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function departmentOf(name: string): string {
  return personDepartment(name) ?? '—';
}

function formatChoiceContent(question: VoteQuestion, choiceIds: number[]): string {
  const selected = question.choices
    .filter((choice) => choiceIds.includes(choice.id))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  if (!selected.length) return '—';
  return selected
    .map((choice) => {
      const title = voteChoiceTitle(choice);
      const subtitle = choice.subtitle?.trim();
      return subtitle ? `${title}（${subtitle}）` : title;
    })
    .join('、');
}

export function formatVoteAnswerExport(question: VoteQuestion, answer: VoteAnswer | undefined): string {
  if (!answer) return '—';
  if (question.type === '问答题') return answer.text.trim() || '—';
  if (question.type === '打分题') return answer.score == null ? '—' : String(answer.score);
  if (isChoiceQuestionType(question.type)) return formatChoiceContent(question, answer.choiceIds);
  return '—';
}

export function buildVoteResultExportCsv({
  questions,
  responses,
  answers,
}: {
  questions: VoteQuestion[];
  responses: VoteResponse[];
  answers: VoteAnswer[];
}): string {
  const sortedQuestions = [...questions].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
  const header = ['姓名', '部门', '投票时间', ...sortedQuestions.map((item) => item.stem)];
  const byResponse = new Map<number, VoteAnswer[]>();
  answers.forEach((item) => {
    const list = byResponse.get(item.responseId) ?? [];
    list.push(item);
    byResponse.set(item.responseId, list);
  });
  const rows = [...responses]
    .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt) || left.id - right.id)
    .map((response) => {
      const mine = byResponse.get(response.id) ?? [];
      const cells = [
        response.voterName,
        departmentOf(response.voterName),
        response.submittedAt,
        ...sortedQuestions.map((question) =>
          formatVoteAnswerExport(
            question,
            mine.find((item) => item.questionId === question.id),
          ),
        ),
      ];
      return cells.map(csvCell).join(',');
    });
  return [header.map(csvCell).join(','), ...rows].join('\n');
}

export function buildContestVoteExportCsv({
  options,
  ballots,
}: {
  options: VoteOption[];
  ballots: VoteBallot[];
}): string {
  const header = ['姓名', '部门', '投票时间', '选项'];
  const byId = new Map(options.map((item) => [item.id, item]));
  const rows = [...ballots]
    .sort((left, right) => left.votedAt.localeCompare(right.votedAt) || left.id - right.id)
    .map((ballot) => {
      const option = byId.get(ballot.optionId);
      return [ballot.voterName, departmentOf(ballot.voterName), ballot.votedAt, option ? voteOptionTitle(option) : '—']
        .map(csvCell)
        .join(',');
    });
  return [header.map(csvCell).join(','), ...rows].join('\n');
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFileTitle(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
}

export function downloadVoteResultExport(
  campaignName: string,
  payload: { questions: VoteQuestion[]; responses: VoteResponse[]; answers: VoteAnswer[] },
) {
  downloadCsv(`${safeFileTitle(campaignName)}-投票结果.csv`, buildVoteResultExportCsv(payload));
}

export function downloadContestVoteExport(
  campaignName: string,
  payload: { options: VoteOption[]; ballots: VoteBallot[] },
) {
  downloadCsv(`${safeFileTitle(campaignName)}-投票结果.csv`, buildContestVoteExportCsv(payload));
}
