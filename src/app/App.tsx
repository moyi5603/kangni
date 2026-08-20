import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GiftOutlined,
  HeartOutlined,
  MenuOutlined,
  ReadOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TagsOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Breadcrumb, Button, Drawer, Flex, Layout, Menu, Popover, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { PlaceholderPage } from '../features/shell/pages/PlaceholderPage';
import { CourseCommentListPage } from '../features/training/pages/CourseCommentListPage';
import { CourseFormPage } from '../features/training/pages/CourseFormPage';
import { CourseListPage } from '../features/training/pages/CourseListPage';
import { CoursewareListPage } from '../features/training/pages/CoursewareListPage';
import { LearningRecordListPage } from '../features/training/pages/LearningRecordListPage';
import { TrainingRulesPage } from '../features/training/pages/TrainingRulesPage';
import { ExamFormPage } from '../features/exams/pages/ExamFormPage';
import { ExamListPage } from '../features/exams/pages/ExamListPage';
import { ActivityListPage } from '../features/activities/pages/ActivityListPage';
import { ActivityFormPage } from '../features/activities/pages/ActivityFormPage';
import { ActivityDetailPage } from '../features/activities/pages/ActivityDetailPage';
import { ActivityRelatedListPage } from '../features/activities/pages/ActivityRelatedListPage';
import { ActivityTagListPage } from '../features/activities/pages/ActivityTagListPage';
import { ActivityCategoryListPage } from '../features/activities/pages/ActivityCategoryListPage';
import { ActivityRulesPage } from '../features/activities/pages/ActivityRulesPage';
import { relatedPages, type RelatedPage } from '../features/activities/model/related';
import { b2bStandards } from '../shared/design-system/generated/b2b-standards.generated';
import { CEndApp } from './CEndApp';
import { CEndPortal } from '../features/c-end/portal/CEndPortal';
import { beginSuppressHash, consumeSuppressHash, requestNavigation } from './navigationLeave';
import {
  APPLICATION_CATEGORIES,
  applicationMenus,
  applications,
  findMenuTrail,
  getApplication,
  getDirectApplications,
  getOpenKeys,
  isLeafMenuKey,
  parseCEndHash,
  parseLocationHash,
  siderSelectedKey,
  toLocationHash,
  goCEndPortal,
  type MenuNode,
  type NavIcon,
} from './navigation';

const { Header, Sider, Content } = Layout;

const navIcons: Record<NavIcon, ReactNode> = {
  apartment: <ApartmentOutlined />,
  appstore: <AppstoreOutlined />,
  barChart: <BarChartOutlined />,
  bell: <BellOutlined />,
  book: <BookOutlined />,
  calendar: <CalendarOutlined />,
  checkCircle: <CheckCircleOutlined />,
  checkSquare: <CheckSquareOutlined />,
  clock: <ClockCircleOutlined />,
  dashboard: <DashboardOutlined />,
  fileText: <FileTextOutlined />,
  gift: <GiftOutlined />,
  heart: <HeartOutlined />,
  read: <ReadOutlined />,
  rocket: <RocketOutlined />,
  shopping: <ShoppingOutlined />,
  shoppingCart: <ShoppingCartOutlined />,
  sync: <SyncOutlined />,
  tags: <TagsOutlined />,
  team: <TeamOutlined />,
  trophy: <TrophyOutlined />,
  unorderedList: <UnorderedListOutlined />,
  user: <UserOutlined />,
};

function toMenuItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => ({
    key: node.key,
    icon: navIcons[node.icon],
    label: node.label,
    children: node.children ? toMenuItems(node.children) : undefined,
  }));
}

function useNarrow(maxWidth = 900) {
  const [narrow, setNarrow] = useState(() => window.matchMedia(`(max-width: ${maxWidth}px)`).matches);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = () => setNarrow(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [maxWidth]);
  return narrow;
}

export function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const cEnd = parseCEndHash(hash);
  if (cEnd.kind === 'preview') {
    return <CEndPortal />;
  }
  if (cEnd.kind === 'c-end') {
    return <CEndApp surface={cEnd.surface} activityId={cEnd.activityId} courseId={cEnd.courseId} h5Page={cEnd.h5Page} />;
  }
  return <AdminApp />;
}

function AdminApp() {
  const initial = parseLocationHash(window.location.hash);
  const [application, setApplication] = useState(initial.application);
  const [page, setPage] = useState(initial.page);
  const [recordId, setRecordId] = useState(initial.recordId);
  const [applicationCardOpen, setApplicationCardOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const narrow = useNarrow();
  const currentApplication = getApplication(application) ?? applications[0];
  const sideNodes = applicationMenus[currentApplication.key] ?? [];
  const directApplications = getDirectApplications(b2bStandards.layout.applicationDirectVisibleMax);
  const trail = findMenuTrail(sideNodes, page);
  const currentPage = trail.at(-1);
  const layoutStyle = {
    '--header-height': `${b2bStandards.theme.components.Layout.headerHeight}px`,
    '--content-max-width': `${b2bStandards.product.contentMaxWidth}px`,
    '--page-gutter': `${b2bStandards.product.pageGutter}px`,
    '--page-gutter-compact': `${b2bStandards.product.pageGutterCompact}px`,
    '--logo-width': `${b2bStandards.layout.logoWidth}px`,
    '--border-color': b2bStandards.border.color,
    '--spacing-md': `${b2bStandards.spacing.md}px`,
  } as CSSProperties;

  const syncLocation = (nextApplication: string, nextPage: string, nextRecordId?: string) => {
    const nextHash = toLocationHash(nextApplication, nextPage, nextRecordId);
    if (window.location.hash !== nextHash) {
      beginSuppressHash();
      window.location.hash = nextHash;
    }
  };

  const applyPage = (nextPage: string, nextRecordId?: string) => {
    setPage(nextPage);
    setRecordId(nextRecordId);
    setMenuDrawerOpen(false);
    syncLocation(application, nextPage, nextRecordId);
  };

  const goToPage = (nextPage: string, nextRecordId?: string) => {
    if (page === nextPage && recordId === nextRecordId) return;
    requestNavigation(() => applyPage(nextPage, nextRecordId));
  };

  const changeApplication = (key: string) => {
    const nextApplication = getApplication(key);
    if (!nextApplication) return;
    if (nextApplication.key === application && page === nextApplication.defaultPage) return;
    requestNavigation(() => {
      setApplication(nextApplication.key);
      setPage(nextApplication.defaultPage);
      setRecordId(undefined);
      setApplicationCardOpen(false);
      setMenuDrawerOpen(false);
      syncLocation(nextApplication.key, nextApplication.defaultPage);
    });
  };

  const changePage = (key: string) => {
    if (!isLeafMenuKey(sideNodes, key)) return;
    goToPage(key);
  };

  useEffect(() => {
    const onHashChange = () => {
      if (consumeSuppressHash()) return;
      const next = parseLocationHash(window.location.hash);
      requestNavigation(() => {
        setApplication(next.application);
        setPage(next.page);
        setRecordId(next.recordId);
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderSideMenu = () => (
    <Menu
      key={currentApplication.key}
      mode="inline"
      selectedKeys={[siderSelectedKey(page)]}
      defaultOpenKeys={getOpenKeys(sideNodes)}
      onClick={({ key }) => changePage(String(key))}
      items={toMenuItems(sideNodes)}
    />
  );

  const applicationCard = (
    <div className="application-card" aria-label="全部应用">
      <div className="application-card-heading">全部应用</div>
      {APPLICATION_CATEGORIES.map((category) => (
        <section className="application-group" key={category}>
          <Typography.Text type="secondary" className="application-group-title">
            {category}
          </Typography.Text>
          <div className="application-grid">
            {applications
              .filter((item) => item.category === category)
              .map((item) => (
                <button
                  className={`application-item ${application === item.key ? 'is-active' : ''}`}
                  key={item.key}
                  type="button"
                  onClick={() => changeApplication(item.key)}
                >
                  <span className="application-item-icon">{navIcons[item.icon]}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );

  const breadcrumbItems = useMemo(
    () => [
      { title: currentApplication.label },
      ...trail.map((node) => ({ title: node.label })),
    ],
    [currentApplication.label, trail],
  );

  const currentAppInDirect = directApplications.some((item) => item.key === application);

  return (
    <Layout className="app-shell" style={layoutStyle}>
      <Header className="app-header">
        <div className="brand">
          {narrow ? (
            <Button
              className="sider-trigger"
              type="text"
              aria-label="打开应用菜单"
              icon={<MenuOutlined />}
              onClick={() => setMenuDrawerOpen(true)}
            />
          ) : null}
          <span className="brand-mark" aria-hidden="true" />
          <button
            type="button"
            className="brand-name"
            aria-label="打开 C 端预览"
            onClick={() => requestNavigation(goCEndPortal)}
          >
            康尼
          </button>
        </div>
        <nav className="application-nav" aria-label="应用切换">
          {narrow ? <Typography.Text className="current-application">{currentApplication.label}</Typography.Text> : null}
          <Menu
            className="application-menu"
            mode="horizontal"
            selectedKeys={[application]}
            onClick={({ key }) => changeApplication(String(key))}
            items={directApplications.map((item) => ({
              key: item.key,
              icon: navIcons[item.icon],
              label: item.label,
            }))}
          />
          <Popover
            content={applicationCard}
            trigger={['hover', 'click']}
            placement="bottom"
            open={applicationCardOpen}
            onOpenChange={setApplicationCardOpen}
            overlayClassName="application-popover"
          >
            <Button
              className={`application-switcher ${!currentAppInDirect ? 'is-active' : ''}`}
              type="text"
              icon={<AppstoreOutlined />}
            >
              全部应用
            </Button>
          </Popover>
        </nav>
        <div className="header-user">
          <Flex align="center" gap={18}>
            <Badge dot>
              <BellOutlined className="header-icon" />
            </Badge>
            <Space>
              <Avatar size={32} icon={<UserOutlined />} />
              <div className="user-copy">
                <Typography.Text strong>陈产品</Typography.Text>
                <Typography.Text type="secondary">产品管理员</Typography.Text>
              </div>
            </Space>
          </Flex>
        </div>
      </Header>
      <Layout className="app-body">
        {narrow ? null : (
          <Sider
            width={b2bStandards.layout.sidebarWidth}
            collapsedWidth={b2bStandards.layout.sidebarCollapsedWidth}
            theme="light"
            className="app-sider"
          >
            {renderSideMenu()}
          </Sider>
        )}
        <Content className="app-content">
          {page === 'activity-list' ? (
            <ActivityListPage onNavigate={goToPage} />
          ) : page === 'activity-tags' ? (
            <ActivityTagListPage />
          ) : page === 'activity-categories' ? (
            <ActivityCategoryListPage />
          ) : page === 'activity-rules' ? (
            <ActivityRulesPage />
          ) : page === 'activity-create' || page === 'activity-edit' ? (
            <ActivityFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'activity-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('activity-list')}
            />
          ) : page === 'activity-detail' ? (
            <ActivityDetailPage
              recordId={recordId}
              onBack={() => goToPage('activity-list')}
              onEdit={(id) => goToPage('activity-edit', String(id))}
            />
          ) : relatedPages.includes(page as RelatedPage) ? (
            <ActivityRelatedListPage
              key={`${page}-${recordId ?? ''}`}
              page={page as RelatedPage}
              recordId={recordId}
              onBack={() => goToPage('activity-list')}
            />
          ) : page === 'training-courseware' ? (
            <CoursewareListPage />
          ) : page === 'course-create' || page === 'course-edit' ? (
            <CourseFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'course-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('training-courses')}
            />
          ) : page === 'course-comments' ? (
            <CourseCommentListPage
              key={`${page}-${recordId ?? ''}`}
              recordId={recordId}
              onBack={() => goToPage('training-courses')}
            />
          ) : page === 'training-courses' ? (
            <CourseListPage onNavigate={goToPage} />
          ) : page === 'training-records' ? (
            <LearningRecordListPage />
          ) : page === 'training-rules' ? (
            <TrainingRulesPage />
          ) : page === 'exam-create' || page === 'exam-edit' ? (
            <ExamFormPage
              key={`${page}-${recordId ?? 'new'}`}
              mode={page === 'exam-edit' ? 'edit' : 'create'}
              recordId={recordId}
              onBack={() => goToPage('exam-list')}
            />
          ) : page === 'exam-list' ? (
            <ExamListPage onNavigate={goToPage} />
          ) : (
            <PlaceholderPage
              breadcrumbItems={breadcrumbItems}
              title={currentPage?.label ?? currentApplication.label}
              applicationLabel={currentApplication.label}
            />
          )}
        </Content>
      </Layout>
      {narrow ? (
        <Drawer
          placement="left"
          size={b2bStandards.layout.sidebarWidth}
          open={menuDrawerOpen}
          onClose={() => setMenuDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          {renderSideMenu()}
        </Drawer>
      ) : null}
    </Layout>
  );
}
