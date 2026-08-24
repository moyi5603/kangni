import { Flex, InputNumber, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  defaultPaperBankMatrix,
  defaultPaperTypeScores,
  difficultyCountsFromMatrix,
  setPaperBankMatrixCell,
  typeCountsFromMatrix,
  type PaperBankMatrix,
  type PaperTypeScore,
} from '../model/paper';
import { questionDifficulties, questionTypes } from '../model/question';

export function toQuestionCategoryTreeData(
  nodes: CategoryNode[],
): { title: string; value: number; key: number; children?: ReturnType<typeof toQuestionCategoryTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children ? toQuestionCategoryTreeData(node.children) : undefined,
  }));
}

export function TypeScoreTable({
  value = defaultPaperTypeScores(),
  onChange,
  readOnly = false,
}: {
  value?: PaperTypeScore[];
  onChange?: (value: PaperTypeScore[]) => void;
  readOnly?: boolean;
}) {
  const updateRow = (type: PaperTypeScore['type'], patch: Partial<PaperTypeScore>) => {
    onChange?.(value.map((row) => (row.type === type ? { ...row, ...patch } : row)));
  };

  const columns: TableColumnsType<PaperTypeScore> = [
    { title: '题型', dataIndex: 'type', width: 120 },
    {
      title: '每题分数',
      dataIndex: 'scorePerQuestion',
      width: 160,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={0}
          disabled={readOnly}
          value={record.scorePerQuestion}
          aria-label={`${record.type}每题分数`}
          onChange={(nextValue) => updateRow(record.type, { scorePerQuestion: Number(nextValue ?? 0) })}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  return (
    <Table
      className="paper-type-score-table"
      rowKey="type"
      columns={columns}
      dataSource={value}
      pagination={false}
      size="small"
    />
  );
}

export function BankDrawMatrix({
  value = defaultPaperBankMatrix(),
  available = defaultPaperBankMatrix(),
  onChange,
  readOnly = false,
}: {
  value?: PaperBankMatrix;
  available?: PaperBankMatrix;
  onChange?: (value: PaperBankMatrix) => void;
  readOnly?: boolean;
}) {
  const typeTotals = typeCountsFromMatrix(value);
  const difficultyTotals = difficultyCountsFromMatrix(value);
  const grandTotal = typeTotals.reduce((sum, row) => sum + row.questionCount, 0);

  return (
    <div className="paper-bank-matrix">
      <div className="paper-bank-matrix-grid" role="table">
        <div className="paper-bank-matrix-row is-head" role="row">
          <div className="paper-bank-matrix-th" role="columnheader">
            题型
          </div>
          {questionDifficulties.map((difficulty) => (
            <div key={difficulty} className="paper-bank-matrix-th" role="columnheader">
              {difficulty}
            </div>
          ))}
          <div className="paper-bank-matrix-th" role="columnheader">
            小计
          </div>
        </div>
        {questionTypes.map((type) => (
          <div key={type} className="paper-bank-matrix-row" role="row">
            <div className="paper-bank-matrix-type" role="rowheader">
              {type}
            </div>
            {questionDifficulties.map((difficulty) => {
              const stock = available[type][difficulty] ?? 0;
              const count = value[type][difficulty] ?? 0;
              const emptyStock = stock <= 0;
              return (
                <label
                  key={difficulty}
                  className={`paper-bank-matrix-cell${count > 0 ? ' is-filled' : ''}${emptyStock ? ' is-empty' : ''}`}
                >
                  <InputNumber
                    size="small"
                    variant="borderless"
                    controls={false}
                    disabled={readOnly || emptyStock}
                    min={0}
                    max={stock}
                    precision={0}
                    value={count}
                    aria-label={`${type}${difficulty}出题数`}
                    onChange={(nextValue) => onChange?.(setPaperBankMatrixCell(value, type, difficulty, Number(nextValue ?? 0)))}
                  />
                  <span className="paper-bank-matrix-stock">可用 {stock}</span>
                </label>
              );
            })}
            <div className="paper-bank-matrix-total">{typeTotals.find((row) => row.type === type)?.questionCount ?? 0}</div>
          </div>
        ))}
        <div className="paper-bank-matrix-row is-foot" role="row">
          <div className="paper-bank-matrix-type is-summary">小计</div>
          {questionDifficulties.map((difficulty) => (
            <div key={difficulty} className="paper-bank-matrix-total">
              {difficultyTotals.find((row) => row.difficulty === difficulty)?.questionCount ?? 0}
            </div>
          ))}
          <div className="paper-bank-matrix-total is-grand">{grandTotal}</div>
        </div>
      </div>
    </div>
  );
}

export function PaperQuestionTotals({ questionCount, totalScore }: { questionCount: number; totalScore: number }) {
  return (
    <Flex gap={24} justify="flex-end" className="paper-form-totals">
      <Typography.Text>
        总题数：<Typography.Text strong>{questionCount}</Typography.Text>
      </Typography.Text>
      <Typography.Text>
        总分数：<Typography.Text strong>{totalScore}</Typography.Text>
      </Typography.Text>
    </Flex>
  );
}

