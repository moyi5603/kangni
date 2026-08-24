import { Breadcrumb, Button, Card, Descriptions, Empty, Flex, Image, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { findCategoryNode } from '../../../shared/category-tree/categoryTree';
import { CourseCommentConfigFields } from '../components/CourseCommentConfigFields';
import { CourseCommentPanel } from '../components/CourseCommentPanel';
import { CourseLearningRecordPanel } from '../components/CourseLearningRecordPanel';
import { CourseQuizPanel } from '../components/CourseQuizPanel';
import { CourseStatsRow } from '../components/CourseStatsRow';
import {
  formatCoursewareDuration,
  normalizeCourseCommentConfig,
  type CourseCatalogItem,
  type CourseStatus,
  type CourseType,
} from '../model/training';
import { getCoursewareById, useCourseCategoryTree, useCourses } from '../model/trainingStore';

const detailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'records', label: '学习记录' },
  { key: 'comments', label: '评论管理' },
  { key: 'quiz', label: '设置答题' },
] as const;

type DetailTab = (typeof detailTabs)[number]['key'];

function isDetailTab(value: string | undefined): value is DetailTab {
  return !!value && detailTabs.some((item) => item.key === value);
}

type CourseDetailPageProps = {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onTabChange?: (tab: DetailTab) => void;
};

const statusColor: Record<CourseStatus, string> = {
  草稿: 'default',
  已发布: 'success',
  已下架: 'warning',
};

const typeColor: Record<CourseType, string> = {
  视频: 'blue',
  音频: 'purple',
  PDF: 'orange',
};

function dash(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function hasHtmlContent(html: string): boolean {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

export function CourseDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onTabChange,
}: CourseDetailPageProps) {
  const courses = useCourses();
  const categoryTree = useCourseCategoryTree();
  const courseId = Number(recordId);
  const course = courses.find((item) => item.id === courseId);
  const activeTab: DetailTab = isDetailTab(tab) ? tab : 'detail';

  if (!course || Number.isNaN(courseId)) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '课程' },
            {
              title: (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  课程管理
                </Button>
              ),
            },
            { title: '记录不存在' },
          ]}
        />
        <Empty description="课程不存在或已删除">
          <Button onClick={onBack}>返回课程管理</Button>
        </Empty>
      </div>
    );
  }

  const commentConfig = normalizeCourseCommentConfig(course.commentConfig);
  const categoryName = course.categoryId == null ? '—' : (findCategoryNode(categoryTree, course.categoryId)?.name ?? '—');
  const catalogRows = course.catalog.map((item, index) => ({ ...item, index }));

  const catalogColumns: TableColumnsType<CourseCatalogItem & { index: number }> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 64,
      render: (index: number) => index + 1,
    },
    {
      title: '封面',
      key: 'cover',
      width: 72,
      render: (_, record) => {
        const cw = getCoursewareById(record.coursewareId);
        return (
          <div className="table-cover-thumb" aria-label={`${cw?.name ?? `课件 #${record.coursewareId}`} 封面`}>
            {cw?.cover ? (
              <img src={cw.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {cw?.type ?? '—'}
              </Typography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: '名称',
      key: 'name',
      render: (_, record) => getCoursewareById(record.coursewareId)?.name ?? `课件 #${record.coursewareId}`,
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      render: (_, record) => getCoursewareById(record.coursewareId)?.type ?? '—',
    },
    {
      title: '课件时长',
      key: 'duration',
      width: 100,
      render: (_, record) => formatCoursewareDuration(getCoursewareById(record.coursewareId)?.estimatedDurationSeconds),
    },
    {
      title: '学时',
      dataIndex: 'creditHours',
      width: 80,
      align: 'right',
    },
    {
      title: '是否必学',
      dataIndex: 'required',
      width: 100,
      render: (required: boolean) => (required ? '是' : '否'),
    },
  ];

  return (
    <div className="page-stack order-detail-page">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '课程' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                课程管理
              </Button>
            ),
          },
          { title: course.name },
          { title: '详情' },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Flex align="center" gap={12} wrap="wrap">
          <Typography.Title level={1}>{course.name}</Typography.Title>
          <Tag color={statusColor[course.status]}>{course.status}</Tag>
        </Flex>
        <Space size="middle" wrap>
          <Button type="primary" aria-label={`编辑 ${course.name}`} onClick={() => onEdit(course.id)}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>

      <CourseStatsRow course={course} />

      <Tabs
        destroyOnHidden
        activeKey={activeTab}
        onChange={(key) => {
          if (isDetailTab(key)) onTabChange?.(key);
        }}
        items={[
          {
            key: 'detail',
            label: '详情',
            children: (
              <div className="page-stack">
                <Card title="基本信息">
                  <Descriptions
                    column={{ xs: 1, sm: 2, lg: 3 }}
                    items={[
                      {
                        label: '课程封面图',
                        span: 3,
                        children: course.cover ? <Image src={course.cover} width={240} alt={`${course.name} 封面`} /> : '—',
                      },
                      { label: '课程类型', children: <Tag color={typeColor[course.type]}>{course.type}</Tag> },
                      { label: '课程分类', children: categoryName },
                      { label: '课程名称', children: course.name },
                      { label: '课程标签', children: dash(course.tags) },
                      { label: '适用对象', children: dash(course.audience) },
                      { label: '创建人', children: dash(course.creator) },
                      { label: '创建时间', children: course.createdAt },
                      { label: '最后修改时间', children: course.updatedAt },
                    ]}
                  />
                </Card>

                <Card title="学习设置">
                  <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} items={[{ label: '学习过程', children: course.learningMode }]} />
                </Card>

                <Card title="课程目录">
                  <Table
                    rowKey={(record) => `${record.coursewareId}-${record.index}`}
                    size="middle"
                    pagination={false}
                    dataSource={catalogRows}
                    columns={catalogColumns}
                    scroll={{ x: 720 }}
                    locale={{ emptyText: <Empty description="暂无课件" /> }}
                  />
                </Card>

                <Card title="课程介绍">
                  {hasHtmlContent(course.introHtml) ? (
                    <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: course.introHtml }} />
                  ) : (
                    <Empty description="暂无介绍" />
                  )}
                </Card>

                <Card title="评论配置">
                  <CourseCommentConfigFields value={commentConfig} readOnly />
                </Card>
              </div>
            ),
          },
          {
            key: 'records',
            label: '学习记录',
            children: <CourseLearningRecordPanel courseName={course.name} />,
          },
          {
            key: 'comments',
            label: '评论管理',
            children: <CourseCommentPanel courseId={course.id} />,
          },
          {
            key: 'quiz',
            label: '设置答题',
            children: <CourseQuizPanel courseId={course.id} courseName={course.name} />,
          },
        ]}
      />
    </div>
  );
}
