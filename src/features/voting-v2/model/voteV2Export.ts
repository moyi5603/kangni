import type { VoteV2Campaign, VoteV2Contestant, VoteV2RecordRow } from './voteV2';
import { voteV2SampleNo } from './voteV2';

function csvCell(value: string | number): string {
  const cell = String(value).replace(/\r?\n/g, ' ');
  if (/[",]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
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

function exportOptions(contestants: VoteV2Contestant[]): VoteV2Contestant[] {
  return [...contestants].sort((left, right) => left.optionNo - right.optionNo || left.id - right.id);
}

function optionHeader(item: VoteV2Contestant): string {
  return `${voteV2SampleNo(item.optionNo)} ${item.name}`.trim();
}

export function buildVoteV2RecordExportCsv({
  selectMode,
  contestants,
  rows,
}: {
  selectMode: VoteV2Campaign['selectMode'];
  contestants: VoteV2Contestant[];
  rows: VoteV2RecordRow[];
}): string {
  const sortedRows = [...rows].sort((a, b) => a.at.localeCompare(b.at) || a.userId.localeCompare(b.userId));
  if (selectMode !== '多选') {
    const header = ['姓名', '部门', '投票时间', '投票内容'];
    const body = sortedRows.map((row) => [row.userId, row.department, row.at, row.optionName].map(csvCell).join(','));
    return [header.map(csvCell).join(','), ...body].join('\n');
  }
  const options = exportOptions(contestants);
  const header = ['姓名', '部门', '投票时间', ...options.map(optionHeader)];
  const body = sortedRows.map((row) => {
    const picked = new Set(row.contestantIds);
    return [
      row.userId,
      row.department,
      row.at,
      ...options.map((item) => (picked.has(item.id) ? item.name : '')),
    ]
      .map(csvCell)
      .join(',');
  });
  return [header.map(csvCell).join(','), ...body].join('\n');
}

export function downloadVoteV2RecordExport(
  campaignName: string,
  payload: {
    selectMode: VoteV2Campaign['selectMode'];
    contestants: VoteV2Contestant[];
    rows: VoteV2RecordRow[];
  },
) {
  downloadCsv(`${safeFileTitle(campaignName)}-投票记录.csv`, buildVoteV2RecordExportCsv(payload));
}
