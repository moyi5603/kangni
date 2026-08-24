import type { ReactNode } from 'react';
import { Breadcrumb, Button, Card, Empty, Flex, Form, Space, Tag, Typography } from 'antd';
import { findCategoryNode } from '../../../shared/category-tree/categoryTree';
import { optionLabel, stripRichText, type QuestionStatus, type QuestionType } from '../model/question';
import { questionBankMeta, type QuestionBankScope } from '../model/questionBank';
import { getQuestionStore } from '../model/questionStore';

const statusColor: Record<QuestionStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

function dash(value: string | number | null | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'number') return String(value);
  return value.trim() ? value : '—';
}

function isChoiceType(type: QuestionType) {
  return type === '单选' || type === '多选';
}

function formatChoiceAnswer(answer: string | undefined, options: string[]) {
  const keys = (answer ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!keys.length) return '—';
  return keys
    .map((key) => {
      const index = key.charCodeAt(0) - 65;
      const text = options[index];
      return text ? `${key}. ${text}` : key;
    })
    .join('；');
}

function DetailValue({ children }: { children: ReactNode }) {
  return <div className="question-detail-value">{children}</div>;
}

export function QuestionDetailPage({
  scope = 'exam',
  recordId,
  onBack,
  onEdit,
}: {
  scope?: QuestionBankScope;
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
}) {
  const meta = questionBankMeta[scope];
  const { useQuestions, useQuestionCategoryTree } = getQuestionStore(scope);
  const questions = useQuestions();
  const categoryTree = useQuestionCategoryTree();
  const questionId = Number(recordId);
  const question = questions.find((item) => item.id === questionId);

  if (!question) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '考试练习' },
            { title: meta.breadcrumbSection },
            {
              title: (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  {meta.breadcrumbList}
                </Button>
              ),
            },
            { title: '记录不存在' },
          ]}
        />
        <Empty description={`${meta.itemName}不存在或已删除`}>
          <Button onClick={onBack}>返回{meta.breadcrumbList}</Button>
        </Empty>
      </div>
    );
  }

  const title = stripRichText(question.stem) || `未命名${meta.itemName}`;
  const categoryName =
    question.categoryId == null ? '—' : (findCategoryNode(categoryTree, question.categoryId)?.name ?? '—');
  const options = question.options ?? [];
  const blankAnswers = question.blankAnswers?.length
    ? question.blankAnswers
    : question.answer
      ? question.answer.split('\n').filter(Boolean)
      : [];
  const keywords = question.keywords ?? [];
  const keywordMinHits = question.keywordMinHits ?? (keywords.filter(Boolean).length || 0);

  return (
    <div className="page-stack">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '考试练习' },
          { title: meta.breadcrumbSection },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                {meta.breadcrumbList}
              </Button>
            ),
          },
          { title },
          { title: '详情' },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Flex align="center" gap={12} wrap="wrap">
          <Typography.Title level={1}>{title}</Typography.Title>
          <Tag color={statusColor[question.status]}>{question.status}</Tag>
        </Flex>
        <Space size="middle" wrap>
          <Button type="primary" aria-label={`编辑 ${title}`} onClick={() => onEdit(question.id)}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>

      <Form layout="horizontal" className="edit-form">
        <Card title="基本信息">
          <Form.Item label="所属分类">
            <DetailValue>{categoryName}</DetailValue>
          </Form.Item>
          <Form.Item label="试题难度">
            <DetailValue>{question.difficulty}</DetailValue>
          </Form.Item>
          <Form.Item label="试题类型">
            <DetailValue>{question.type}</DetailValue>
          </Form.Item>
          <Form.Item label="题干">
            <DetailValue>
              {stripRichText(question.stem) ? (
                <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: question.stem }} />
              ) : (
                '—'
              )}
            </DetailValue>
          </Form.Item>
        </Card>

        {isChoiceType(question.type) ? (
          <Card title="选项">
            {options.length ? (
              <Flex vertical gap={8}>
                {options.map((item, index) => (
                  <Flex key={`${optionLabel(index)}-${item}`} gap={12} align="flex-start">
                    <span className="question-option-label">{optionLabel(index)}</span>
                    <Typography.Text>{item}</Typography.Text>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <DetailValue>—</DetailValue>
            )}
          </Card>
        ) : null}

        <Card title="答案与解析">
          {question.type === '单选' || question.type === '多选' ? (
            <Form.Item label="正确答案">
              <DetailValue>{formatChoiceAnswer(question.answer, options)}</DetailValue>
            </Form.Item>
          ) : null}

          {question.type === '判断' ? (
            <Form.Item label="正确答案">
              <DetailValue>{dash(question.answer)}</DetailValue>
            </Form.Item>
          ) : null}

          {question.type === '填空' ? (
            <>
              <Form.Item label="答案顺序">
                <DetailValue>{question.blankAnswerOrderSensitive ? '区分顺序' : '不区分顺序'}</DetailValue>
              </Form.Item>
              <Form.Item label="正确答案">
                <DetailValue>
                  {blankAnswers.length ? (
                    <Flex vertical gap={8}>
                      {blankAnswers.map((item, index) => (
                        <Typography.Text key={`${index}-${item}`}>
                          {index + 1}. {item}
                        </Typography.Text>
                      ))}
                    </Flex>
                  ) : (
                    '—'
                  )}
                </DetailValue>
              </Form.Item>
            </>
          ) : null}

          {question.type === '问答题' ? (
            <>
              <Form.Item label="参考答案">
                <DetailValue>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{dash(question.answer)}</Typography.Paragraph>
                </DetailValue>
              </Form.Item>
              <Form.Item label="关键词">
                <DetailValue>
                  {keywords.length ? keywords.map((item, index) => `${index + 1}. ${item}`).join('；') : '—'}
                </DetailValue>
              </Form.Item>
              <Form.Item label="至少命中">
                <DetailValue>{keywordMinHits} 个关键词</DetailValue>
              </Form.Item>
            </>
          ) : null}

          <Form.Item label="试题解析">
            <DetailValue>
              <Typography.Paragraph style={{ marginBottom: 0 }}>{dash(question.analysis)}</Typography.Paragraph>
            </DetailValue>
          </Form.Item>
          <Form.Item label="状态">
            <Tag color={statusColor[question.status]}>{question.status}</Tag>
          </Form.Item>
        </Card>
      </Form>
    </div>
  );
}
